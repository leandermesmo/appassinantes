import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../../shared/errors/AppError';

/**
 * Handler global de erros para o Fastify.
 * Centraliza o tratamento de exceções e padroniza as respostas de erro da API.
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Erros de validação do Zod
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      message: 'Erro de validação.',
      errors: error.flatten().fieldErrors,
    });
  }

  // Erros conhecidos da aplicação (Regras de negócio)
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      message: error.message,
    });
  }

  // Log de erros inesperados (Critical)
  request.log.error(error);

  // Erros genéricos em produção (não expõe detalhes sensíveis)
  if (process.env.NODE_ENV === 'production') {
    return reply.status(500).send({
      success: false,
      message: 'Erro interno do servidor.',
    });
  }

  // Erros genéricos em desenvolvimento (com detalhes)
  return reply.status(500).send({
    success: false,
    message: error.message,
    stack: error.stack,
  });
}
