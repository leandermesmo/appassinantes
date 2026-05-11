import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import { healthRoutes } from './api/routes/health.routes';
import { marketRoutes } from './api/routes/market.routes';
import { authRoutes } from './api/routes/auth.routes';
import { subscriptionRoutes } from './api/routes/subscription.routes';
import { signalRoutes } from './api/routes/signal.routes';
import { adminRoutes } from './api/routes/admin.routes';
import { favoriteRoutes } from './api/routes/favorite.routes';
import { realtimeRoutes } from './api/routes/realtime.routes';
import { errorHandler } from './api/middlewares/error-handler';
import { env } from './infrastructure/env';

/**
 * Configuração principal da aplicação Fastify.
 * Aqui registramos plugins, middlewares globais, rotas e handlers de erro.
 */
export const app = fastify({
  logger: {
    level: env.NODE_ENV === 'development' ? 'debug' : 'info',
    // Em desenvolvimento, o pino-pretty pode ser usado para logs legíveis.
    // Em produção, logs JSON puros são melhores para agregadores de log.
  },
});

// ─────────────────────────────────────────────
// MIDDLEWARES GLOBAIS E SEGURANÇA
// ─────────────────────────────────────────────

// Helmet: Adiciona headers de segurança HTTP (proteção básica contra XSS, Clickjacking, etc)
app.register(helmet);

// CORS: Controle de acesso entre origens
app.register(cors, {
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});

// Rate Limit: Proteção contra ataques de força bruta e DoS
app.register(rateLimit, {
  max: 100, // Limite de 100 requisições por janela
  timeWindow: '1 minute',
});

// ─────────────────────────────────────────────
// ROTAS MODULARES
// ─────────────────────────────────────────────

// Prefixamos as rotas com /api para versionamento e organização
app.register(healthRoutes, { prefix: '/api' });
app.register(authRoutes, { prefix: '/api' });
app.register(subscriptionRoutes, { prefix: '/api' });
app.register(marketRoutes, { prefix: '/api' });
app.register(signalRoutes, { prefix: '/api' });
app.register(favoriteRoutes, { prefix: '/api' });
app.register(realtimeRoutes, { prefix: '/api' });

// Rotas administrativas com prefixo consolidado /api/admin
app.register(adminRoutes, { prefix: '/api/admin' });

// ─────────────────────────────────────────────
// TRATAMENTO DE ERROS
// ─────────────────────────────────────────────

// Handler global para capturar todas as exceções da aplicação
app.setErrorHandler(errorHandler);

// Handler para rotas não encontradas (404)
app.setNotFoundHandler((request, reply) => {
  return reply.status(404).send({
    success: false,
    message: 'Recurso não encontrado.',
  });
});
