/**
 * Classe base para erros conhecidos da aplicação.
 * Permite distinguir entre erros de negócio (4xx) e erros inesperados (5xx).
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
