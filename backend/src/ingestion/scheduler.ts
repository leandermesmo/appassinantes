import cron from 'node-cron';
import { prisma } from '../infrastructure/database/prisma.client';
import { TaskQueue, QueueTask } from './queue';
import { IngestionService } from './ingestion.service';
import { IndicatorService } from './indicator.service';
import { createLogger } from './logger';

const log = createLogger('Scheduler');

/**
 * Configuração de frequência de atualização por timeframe.
 * Cada entrada define a expressão cron e o timeframe.
 */
const SCHEDULE_CONFIG: Array<{ cron: string; timeframe: string; label: string }> = [
  { cron: '0,15,30,45 * * * *', timeframe: '15m', label: 'minutos (00,15,30,45)' },
  { cron: '0 * * * *',        timeframe: '1h',  label: 'a cada hora (00)' },
  { cron: '0 */4 * * *',      timeframe: '4h',  label: 'a cada 4 horas (00:00)' },
  { cron: '0 0 * * *',        timeframe: '1d',  label: 'diário (00:00)' },
  { cron: '5 0 * * 1',        timeframe: '1w',  label: 'semanal (Seg 00:05)' },
  { cron: '10 0 1 * *',       timeframe: '1M',  label: 'mensal (Dia 1 00:10)' },
];

/**
 * Scheduler — Orquestrador do pipeline de ingestão.
 *
 * Responsabilidades:
 * - Agendar coletas por timeframe via node-cron
 * - Enfileirar tasks para todos os symbols ativos
 * - Coordenar ingestão + cálculo de indicadores
 */
export class Scheduler {
  private queue: TaskQueue;
  private cronJobs: ReturnType<typeof cron.schedule>[] = [];
  private isRunning = false;

  constructor(concurrency: number = 15) {
    this.queue = new TaskQueue(concurrency, 3);
    this.setupTaskHandler();
  }

  /**
   * Configura o handler que processa cada task da fila.
   */
  private setupTaskHandler(): void {
    this.queue.onTask(async (task: QueueTask) => {
      if (task.type === 'backfill') {
        await IngestionService.backfill(task.symbol, task.timeframe);
        // Após backfill, calcula indicadores
        await IndicatorService.calculateAndPersist(task.symbol, task.timeframe);
      } else if (task.type === 'incremental') {
        await IngestionService.incrementalUpdate(task.symbol, task.timeframe);
        // Após atualização, recalcula indicadores
        await IndicatorService.calculateAndPersist(task.symbol, task.timeframe);
      } else if (task.type === 'indicators') {
        await IndicatorService.calculateAndPersist(task.symbol, task.timeframe);
      }
    });
  }

  /**
   * Busca todos os symbols ativos do banco.
   */
  private async getActiveSymbols(): Promise<string[]> {
    const cryptos = await prisma.cryptocurrency.findMany({
      where: {
        isActive: true,
      },
      select: { symbol: true },
    });

    return cryptos.map((c) => c.symbol);
  }

  /**
   * Inicia o modo contínuo com cron jobs.
   */
  async startContinuous(): Promise<void> {
    if (this.isRunning) {
      log.warn('Scheduler já está rodando');
      return;
    }

    this.isRunning = true;
    const symbols = await this.getActiveSymbols();
    log.info(`Scheduler iniciado — ${symbols.length} símbolos ativos: ${symbols.join(', ')}`);

    // Registra cron jobs para cada timeframe
    for (const config of SCHEDULE_CONFIG) {
      const job = cron.schedule(config.cron, async () => {
        log.info(`[CRON] Disparado: ${config.timeframe} (${config.label})`);
        await this.enqueueIncrementalForTimeframe(config.timeframe);
      });

      this.cronJobs.push(job);
      log.info(`[CRON] Registrado: ${config.timeframe} → ${config.label}`);
    }

    // Execução imediata no startup para todos os timeframes ativos
    log.info('Executando atualização inicial no startup para todos os timeframes...');
    const targetTimeframes = ['15m', '1h', '4h', '1d', '1w', '1M'];
    for (const timeframe of targetTimeframes) {
      await this.enqueueIncrementalForTimeframe(timeframe);
    }
    
    await this.queue.waitUntilIdle();
    log.info('Atualização inicial de startup concluída');
  }

  /**
   * Executa o backfill completo para todos os symbols × timeframes.
   */
  async runBackfill(timeframes?: string[]): Promise<void> {
    const symbols = await this.getActiveSymbols();
    const targetTimeframes = timeframes || ['15m', '1h', '4h', '1d', '1w', '1M'];

    log.info(`Backfill iniciado: ${symbols.length} símbolos × ${targetTimeframes.length} timeframes`);

    for (const timeframe of targetTimeframes) {
      const tasks = symbols.map((symbol) => ({
        symbol,
        timeframe,
        type: 'backfill' as const,
      }));

      this.queue.enqueueBatch(tasks);
      log.info(`Enfileirado backfill: ${tasks.length} tasks para ${timeframe}`);

      // Aguarda cada timeframe terminar antes do próximo
      // para não misturar e sobrecarregar
      await this.queue.waitUntilIdle();
      log.info(`Backfill concluído para timeframe: ${timeframe}`);
    }

    log.info('Backfill completo finalizado');
  }

  /**
   * Enfileira atualização incremental para todos os symbols de um timeframe.
   */
  private async enqueueIncrementalForTimeframe(timeframe: string): Promise<void> {
    const symbols = await this.getActiveSymbols();

    const tasks = symbols.map((symbol) => ({
      symbol,
      timeframe,
      type: 'incremental' as const,
    }));

    this.queue.enqueueBatch(tasks);
    log.info(`Enfileirado incremental: ${tasks.length} tasks para ${timeframe}`);
  }

  /**
   * Para o scheduler e limpa os cron jobs.
   */
  stop(): void {
    log.info('Parando scheduler...');

    for (const job of this.cronJobs) {
      job.stop();
    }
    this.cronJobs = [];
    this.queue.clear();
    this.isRunning = false;

    log.info('Scheduler parado');
  }

  /**
   * Retorna estatísticas da fila.
   */
  getStats(): { pending: number; active: number; total: number } {
    return {
      pending: this.queue.pending,
      active: this.queue.active,
      total: this.queue.size,
    };
  }
}
