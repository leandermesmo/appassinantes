/**
 * Logger estruturado para o pipeline de ingestão.
 * Garante rastreabilidade e facilita debug em produção.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogContext {
  symbol?: string;
  timeframe?: string;
  duration?: number;
  count?: number;
  [key: string]: unknown;
}

class IngestionLogger {
  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  private format(level: LogLevel, message: string, ctx?: LogContext): string {
    const timestamp = new Date().toISOString();
    const base = `[${timestamp}] [${level}] [${this.module}] ${message}`;

    if (ctx && Object.keys(ctx).length > 0) {
      // Filtra undefined para logs mais limpos
      const clean = Object.fromEntries(
        Object.entries(ctx).filter(([, v]) => v !== undefined)
      );
      return `${base} ${JSON.stringify(clean)}`;
    }

    return base;
  }

  info(message: string, ctx?: LogContext): void {
    console.log(this.format('INFO', message, ctx));
  }

  warn(message: string, ctx?: LogContext): void {
    console.warn(this.format('WARN', message, ctx));
  }

  error(message: string, error?: unknown, ctx?: LogContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error ?? '');
    const errorCtx = { ...ctx, error: errorMessage };
    console.error(this.format('ERROR', message, errorCtx));
  }

  debug(message: string, ctx?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.format('DEBUG', message, ctx));
    }
  }
}

/**
 * Factory para criar loggers com contexto de módulo.
 */
export function createLogger(module: string): IngestionLogger {
  return new IngestionLogger(module);
}
