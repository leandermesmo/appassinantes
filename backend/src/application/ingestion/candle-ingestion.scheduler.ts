import { ActiveCryptosRepository } from './active-cryptos.repository';
import { BinanceTimeService } from './binance-time.service';
import { CandleIngestionService } from './candle-ingestion.service';
import { TimeframeStrategy } from './timeframe.strategy';
import { createLogger } from '../../ingestion/logger';
import { IndicatorService } from '../../ingestion/indicator.service';

const log = createLogger('IngestionScheduler');

/**
 * Orquestrador central da ingestão automática.
 * Gerencia o loop de execução por timeframe, respeitando as regras globais e por ativo.
 */
export class CandleIngestionScheduler {
  private isRunning = false;
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Inicia o scheduler para todos os timeframes suportados.
   */
  async start(): Promise<void> {
    const isEnabled = process.env.ENABLE_AUTO_INGESTION === 'true';

    if (!isEnabled) {
      log.warn('### INGESTÃO AUTOMÁTICA DESATIVADA (Feature Flag: ENABLE_AUTO_INGESTION=false) ###');
      return;
    }

    if (this.isRunning) return;
    this.isRunning = true;

    log.info('Iniciando Ingestão Automática de Alta Precisão...');

    const timeframes = TimeframeStrategy.getSupportedTimeframes();
    
    // Execução inicial para garantir que os dados estão atualizados no startup
    log.info('Executando carga inicial para todos os timeframes...');
    for (const timeframe of timeframes) {
      await this.runIngestion(timeframe);
      this.scheduleNextExecution(timeframe);
    }
  }

  /**
   * Para todas as execuções agendadas.
   */
  stop(): void {
    this.isRunning = false;
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    log.info('Scheduler de ingestão parado.');
  }

  /**
   * Agenda a próxima execução para um timeframe específico com base no tempo da Binance.
   */
  private async scheduleNextExecution(timeframe: string): Promise<void> {
    if (!this.isRunning) return;

    try {
      const serverTime = await BinanceTimeService.getServerTime();
      const nextExecution = TimeframeStrategy.getNextExecutionTime(timeframe, serverTime);
      let delay = Math.max(0, nextExecution - Date.now());

      // Node.js setTimeout limit is 2^31-1 ms (~24.8 days)
      const MAX_TIMEOUT = 2147483647;
      const isOverLimit = delay > MAX_TIMEOUT;
      
      const effectiveDelay = isOverLimit ? MAX_TIMEOUT : delay;

      log.debug(`Agendando execução [${timeframe}] em ${Math.round(effectiveDelay / 1000)}s ${isOverLimit ? '(cap)' : ''}`);

      const timeout = setTimeout(async () => {
        if (isOverLimit) {
          // Apenas reagenda se era um cap
          this.scheduleNextExecution(timeframe);
        } else {
          await this.runIngestion(timeframe);
          this.scheduleNextExecution(timeframe);
        }
      }, effectiveDelay);

      this.timeouts.set(timeframe, timeout);
    } catch (error) {
      log.error(`Erro ao agendar execução para ${timeframe}, tentando em 30s`, error);
      setTimeout(() => this.scheduleNextExecution(timeframe), 30000);
    }
  }

  /**
   * Executa a ingestão para todos os ativos ativos de um determinado timeframe.
   */
  private async runIngestion(timeframe: string): Promise<void> {
    log.info(`[EXECUTANDO] Ingestão para timeframe: ${timeframe}`);
    
    try {
      const cryptos = await ActiveCryptosRepository.getActiveSymbols();
      
      if (cryptos.length === 0) {
        log.warn(`Nenhum ativo habilitado (is_active=true) para processar no timeframe ${timeframe}`);
        return;
      }

      // Processamento sequencial ou em pequenos lotes para não sobrecarregar API/Banco
      // Aqui usamos sequencial para segurança, mas pode ser otimizado com p-limit
      for (const crypto of cryptos) {
        try {
          const insertedCount = await CandleIngestionService.ingest(crypto.symbol, timeframe);
          
          if (insertedCount > 0) {
            log.info(`[SUCESSO] ${crypto.symbol} (${timeframe}): ${insertedCount} candles inseridos.`);
            // Após ingerir candles, recalcula indicadores
            await IndicatorService.calculateAndPersist(crypto.symbol, timeframe);
          }
        } catch (err) {
          log.error(`Erro ao processar ${crypto.symbol} no timeframe ${timeframe}`, err);
        }
      }

      log.info(`[CONCLUÍDO] Ciclo de ingestão finalizado para ${timeframe}`);
    } catch (error) {
      log.error(`Falha crítica no ciclo de ingestão do timeframe ${timeframe}`, error);
    }
  }
}
