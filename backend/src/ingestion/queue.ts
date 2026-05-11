import { createLogger } from './logger';

const log = createLogger('Queue');

/**
 * Representa uma tarefa na fila de processamento.
 */
export interface QueueTask {
  id: string;
  symbol: string;
  timeframe: string;
  type: 'backfill' | 'incremental' | 'indicators';
  retries: number;
}

/**
 * Fila in-memory com controle de concorrência.
 *
 * Garante que no máximo N workers processem simultaneamente,
 * evitando sobrecarga na Binance API e no MySQL.
 */
export class TaskQueue {
  private queue: QueueTask[] = [];
  private activeCount = 0;
  private readonly maxConcurrency: number;
  private readonly maxRetries: number;
  private handler: ((task: QueueTask) => Promise<void>) | null = null;
  private resolveIdle: (() => void) | null = null;
  private processing = false;

  constructor(concurrency: number = 15, maxRetries: number = 3) {
    this.maxConcurrency = concurrency;
    this.maxRetries = maxRetries;
  }

  /**
   * Quantidade total de tasks (pendentes + ativas).
   */
  get size(): number {
    return this.queue.length + this.activeCount;
  }

  get pending(): number {
    return this.queue.length;
  }

  get active(): number {
    return this.activeCount;
  }

  /**
   * Adiciona uma task à fila.
   */
  enqueue(task: Omit<QueueTask, 'id' | 'retries'>): void {
    const id = `${task.symbol}_${task.timeframe}_${task.type}_${Date.now()}`;
    this.queue.push({ ...task, id, retries: 0 });
    this.processNext();
  }

  /**
   * Adiciona múltiplas tasks de uma vez.
   */
  enqueueBatch(tasks: Omit<QueueTask, 'id' | 'retries'>[]): void {
    for (const task of tasks) {
      const id = `${task.symbol}_${task.timeframe}_${task.type}_${Date.now()}`;
      this.queue.push({ ...task, id, retries: 0 });
    }
    log.info(`Batch enfileirado`, { count: tasks.length });
    this.processNext();
  }

  /**
   * Define o handler que processa cada task.
   */
  onTask(handler: (task: QueueTask) => Promise<void>): void {
    this.handler = handler;
  }

  /**
   * Aguarda até que a fila esteja completamente vazia (0 pendentes, 0 ativas).
   */
  waitUntilIdle(): Promise<void> {
    if (this.size === 0) return Promise.resolve();

    return new Promise((resolve) => {
      this.resolveIdle = resolve;
    });
  }

  /**
   * Limpa a fila (não cancela tasks já em execução).
   */
  clear(): void {
    this.queue = [];
    log.info('Fila limpa');
  }

  /**
   * Processa o próximo item da fila se há slot disponível.
   */
  private processNext(): void {
    if (!this.handler) return;
    if (this.activeCount >= this.maxConcurrency) return;
    if (this.queue.length === 0) {
      // Verifica se tudo terminou para resolver a promise de idle
      if (this.activeCount === 0 && this.resolveIdle) {
        this.resolveIdle();
        this.resolveIdle = null;
      }
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.activeCount++;
    this.executeTask(task);
  }

  /**
   * Executa uma task com tratamento de erro e retry.
   */
  private async executeTask(task: QueueTask): Promise<void> {
    try {
      await this.handler!(task);
    } catch (error) {
      if (task.retries < this.maxRetries) {
        task.retries++;
        log.warn(`Task falhou, tentativa ${task.retries}/${this.maxRetries}`, {
          symbol: task.symbol,
          timeframe: task.timeframe,
        });

        // Backoff exponencial: 1s, 2s, 4s
        const delay = Math.pow(2, task.retries - 1) * 1000;
        await this.sleep(delay);

        // Re-enfileira no final
        this.queue.push(task);
      } else {
        log.error(
          `Task falhou após ${this.maxRetries} tentativas`,
          error,
          { symbol: task.symbol, timeframe: task.timeframe }
        );
      }
    } finally {
      this.activeCount--;
      // Continua processando a fila
      this.processNext();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
