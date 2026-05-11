import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../../infrastructure/env';
import { AppError } from '../../shared/errors/AppError';

/**
 * Payload do API Access Token gerado pelo NextAuth (frontend).
 * Token assinado com HS256 usando AUTH_SECRET compartilhado.
 */
interface TokenPayload {
  /** ID do usuário (UUID) */
  sub: string;
  /** Papel do usuário no sistema */
  role: string;
  /** Status da assinatura do usuário (active, none, past_due) */
  subscriptionStatus: string;
  /** Issued At (epoch seconds) */
  iat: number;
  /** Expiration (epoch seconds) */
  exp: number;
}

/**
 * Middleware para proteger rotas que exigem autenticação.
 * Verifica o header Authorization e valida o JWT usando AUTH_SECRET
 * (mesmo secret usado pelo NextAuth para assinar o API Access Token).
 *
 * Após validação, popula request.user com { id, role } para uso
 * nos controllers e middlewares subsequentes (ex: ensureSubscriptionActive).
 */
export async function ensureAuthenticated(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token não fornecido.', 401);
  }

  // Formato esperado: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AppError('Token mal formatado.', 401);
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, env.AUTH_SECRET) as TokenPayload;

    // Mantém a mesma estrutura de request.user usada pelo resto da aplicação
    request.user = {
      id: decoded.sub,
      role: decoded.role,
      subscriptionStatus: decoded.subscriptionStatus || 'none',
    };
  } catch (err) {
    throw new AppError('Token inválido ou expirado.', 401);
  }
}

/**
 * Middleware para controle de acesso baseado em roles (RBAC).
 * Deve ser usado APÓS ensureAuthenticated.
 */
export function authorize(roles: string[]) {
  return async (request: FastifyRequest) => {
    if (!request.user || !roles.includes(request.user.role)) {
      throw new AppError('Acesso não autorizado.', 403);
    }
  };
}

// Extensão de tipos para o Fastify incluir o campo user no Request
declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      role: string;
      subscriptionStatus: string;
    };
  }
}
