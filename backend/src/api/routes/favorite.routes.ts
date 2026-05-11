import { FastifyInstance } from "fastify";
import { z } from "zod";
import { FavoriteService } from "../../application/services/favorite.service";
import { ensureAuthenticated } from "../middlewares/auth.middleware";
import { setUserTier, getFreeTierLimits } from "../middlewares/freemium.middleware";
import { SubscriptionRepository } from "../../infrastructure/repositories/subscription.repository";
import { FavoriteRepository } from "../../infrastructure/repositories/favorite.repository";
import { AppError } from "../../shared/errors/AppError";

export async function favoriteRoutes(app: FastifyInstance) {
  /**
   * GET /api/favorites
   * Retorna a lista de símbolos favoritos do usuário.
   */
  app.get(
    "/favorites",
    { preHandler: [ensureAuthenticated, setUserTier] },
    async (request, reply) => {
      try {
        const symbols = await FavoriteService.getUserFavorites(request.user!.id);
        return reply.status(200).send({
          success: true,
          data: symbols,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message: "Erro ao buscar favoritos.",
        });
      }
    }
  );

  /**
   * POST /api/favorites
   * Adiciona um ativo aos favoritos, validando o limite do plano.
   */
  app.post(
    "/favorites",
    { preHandler: [ensureAuthenticated, setUserTier] },
    async (request, reply) => {
      const bodySchema = z.object({
        symbol: z.string().min(1).toUpperCase(),
      });

      try {
        const { symbol } = bodySchema.parse(request.body);
        const userId = request.user!.id;

        // Determinar o limite de favoritos
        let maxFavorites = 0;
        if (request.tier === "FREE") {
          const limits = await getFreeTierLimits();
          maxFavorites = limits.maxFavorites;
        } else {
          const subscription = await SubscriptionRepository.findActiveByUserId(userId);
          maxFavorites = subscription?.plan.maxFavorites ?? 5; // Default 5 se algo falhar
        }

        // Verificar contagem atual
        const currentCount = await FavoriteRepository.countFavorites(userId);
        if (currentCount >= maxFavorites) {
          return reply.status(403).send({
            success: false,
            message: `Você atingiu o limite de ${maxFavorites} favoritos para o seu plano.`,
            upgradeRequired: request.tier === "FREE",
          });
        }

        await FavoriteService.addFavorite(userId, symbol);

        return reply.status(201).send({
          success: true,
          message: "Ativo adicionado aos favoritos.",
        });
      } catch (error) {
        if (error instanceof AppError) throw error;
        return reply.status(400).send({
          success: false,
          message: "Erro ao adicionar favorito.",
        });
      }
    }
  );

  /**
   * DELETE /api/favorites/:symbol
   * Remove um ativo dos favoritos.
   */
  app.delete(
    "/favorites/:symbol",
    { preHandler: [ensureAuthenticated] },
    async (request, reply) => {
      const paramsSchema = z.object({
        symbol: z.string().min(1).toUpperCase(),
      });

      try {
        const { symbol } = paramsSchema.parse(request.params);
        await FavoriteService.removeFavorite(request.user!.id, symbol);

        return reply.status(200).send({
          success: true,
          message: "Ativo removido dos favoritos.",
        });
      } catch (error) {
        if (error instanceof AppError) throw error;
        return reply.status(400).send({
          success: false,
          message: "Erro ao remover favorito.",
        });
      }
    }
  );
}
