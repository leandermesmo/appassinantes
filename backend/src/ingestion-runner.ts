import 'dotenv/config';
import { Scheduler } from './ingestion/scheduler';
import { CandleIngestionScheduler } from './application/ingestion/candle-ingestion.scheduler';
import { createLogger } from './ingestion/logger';

const log = createLogger('Runner');

/**
 * Entry point do pipeline de ingestão.
 */

const args = process.argv.slice(2);
const isBackfill = args.includes('--backfill');
const backfillTfArg = args.find((a) => a.startsWith('--backfill-tf='));
const backfillTimeframes = backfillTfArg
  ? backfillTfArg.split('=')[1].split(',')
  : undefined;

// Concorrência configurável via env ou flag
const concurrencyArg = args.find((a) => a.startsWith('--concurrency='));
const concurrency = concurrencyArg
  ? parseInt(concurrencyArg.split('=')[1], 10)
  : parseInt(process.env.INGESTION_CONCURRENCY || '15', 10);

const legacyScheduler = new Scheduler(concurrency);
const autoScheduler = new CandleIngestionScheduler();

async function main(): Promise<void> {
  log.info('═══════════════════════════════════════════');
  log.info('  Pipeline de Ingestão — AppCrypto');
  log.info('═══════════════════════════════════════════');
  log.info(`Modo: ${isBackfill ? 'BACKFILL' : 'CONTÍNUO (ALTA PRECISÃO)'}`);
  log.info(`Concorrência: ${concurrency} workers`);

  if (isBackfill) {
    log.info(
      backfillTimeframes
        ? `Timeframes: ${backfillTimeframes.join(', ')}`
        : 'Todos os timeframes'
    );
    await legacyScheduler.runBackfill(backfillTimeframes);
    log.info('Backfill finalizado. Encerrando...');
    process.exit(0);
  } else {
    // Inicia o novo scheduler de alta precisão para modo contínuo
    await autoScheduler.start();
    log.info('Scheduler de Alta Precisão ativo. Ctrl+C para parar.');
  }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'] as const;
for (const signal of signals) {
  process.on(signal, () => {
    log.info(`Sinal ${signal} recebido. Encerrando...`);
    legacyScheduler.stop();
    autoScheduler.stop();

    // Aguarda 5s para tasks ativas finalizarem
    setTimeout(() => {
      log.info('Processo encerrado.');
      process.exit(0);
    }, 5000);
  });
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection', reason);
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception', error);
  scheduler.stop();
  process.exit(1);
});

main().catch((error) => {
  log.error('Falha fatal no pipeline', error);
  process.exit(1);
});
