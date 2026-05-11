import { FastifyInstance } from "fastify";
import { marketSignalRoutes } from "../../application/controllers/market-signal.controller";
import { ensureAuthenticated } from "../middlewares/auth.middleware";
import { setUserTier } from "../middlewares/freemium.middleware";

/**
 * Definição das rotas de sinais de mercado.
 * Todas as rotas de sinais são protegidas por autenticação,
 * pois são o "core" de valor da plataforma SaaS.
 *
 * O middleware setUserTier classifica o tier para que o controller
 * filtre a quantidade de sinais retornados.
 */
export async function signalRoutes(fastify: FastifyInstance) {
  fastify.register(async (protectedRoutes) => {
    // Middleware de autenticação e classificação de tier
    protectedRoutes.addHook("preHandler", ensureAuthenticated);
    protectedRoutes.addHook("preHandler", setUserTier);
    
    // Registra o controller com o prefixo /signals
    protectedRoutes.register(marketSignalRoutes, { prefix: "/signals" });
  });
}
