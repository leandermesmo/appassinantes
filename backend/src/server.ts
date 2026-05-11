import 'dotenv/config';
import { app } from './app';
import { env } from './infrastructure/env';
import { MarketScannerService } from './application/market-scanner.service';
import { CandleIngestionScheduler } from './application/ingestion/candle-ingestion.scheduler';

/**
 * Inicialização do Servidor HTTP.
 * Inclui tratamento de encerramento gracioso (Graceful Shutdown).
 */
const start = async () => {
  try {
    const port = env.PORT;
    
    await app.listen({ 
      port, 
      host: '0.0.0.0' // Importante para rodar em containers/Docker
    });

    // Inicia a ingestão automática de alta precisão
    const ingestionScheduler = new CandleIngestionScheduler();
    await ingestionScheduler.start();

    // Mantém o MarketScannerService apenas se explicitamente habilitado (legado)
    MarketScannerService.start();

    // O logger do Fastify já está configurado no app.ts
    // app.log.info está disponível
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Tratamento de sinais do sistema operacional para fechar o servidor corretamente
const signals = ['SIGINT', 'SIGTERM'] as const;

signals.forEach((signal) => {
  process.on(signal, async () => {
    app.log.info(`Recebido ${signal}. Encerrando o servidor...`);
    
    try {
      await app.close();
      app.log.info('Servidor encerrado com sucesso.');
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'Erro ao encerrar o servidor');
      process.exit(1);
    }
  });
});

start();
