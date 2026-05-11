import { FastifyInstance } from "fastify";
import { z } from "zod";
import { SubscriptionService } from "../../application/subscription.service";
import { ensureAuthenticated, authorize } from "../middlewares/auth.middleware";
import { setUserTier, getFreeTierLimits } from "../middlewares/freemium.middleware";
import { UserRole } from "@prisma/client";

const subscribeSchema = z.object({
  planId: z.number().int().positive(),
});

export async function subscriptionRoutes(app: FastifyInstance) {
  /**
   * GET /api/subscriptions/plans
   * Lista planos ativos para o usuário escolher.
   */
  app.get("/subscriptions/plans", async (request, reply) => {
    const plans = await SubscriptionService.listAvailablePlans();
    return reply.status(200).send({ success: true, data: plans });
  });

  /**
   * GET /api/subscriptions/status
   * Retorna o status da assinatura do usuário logado.
   */
  app.get(
    "/subscriptions/status",
    { preHandler: [ensureAuthenticated] },
    async (request, reply) => {
      try {
        const subscription = await SubscriptionService.checkActiveSubscription(request.user.id);
        return reply.status(200).send({ success: true, data: subscription });
      } catch (error) {
        return reply.status(200).send({ success: false, message: "Sem assinatura ativa." });
      }
    }
  );

  /**
   * GET /api/subscriptions/tier
   * Retorna o tier atual do usuário e os limites aplicáveis.
   * Usado pelo frontend para renderização condicional de componentes Freemium.
   */
  app.get(
    "/subscriptions/tier",
    { preHandler: [ensureAuthenticated, setUserTier] },
    async (request, reply) => {
      const tier = request.tier;

      if (tier === "FREE") {
        const limits = await getFreeTierLimits();
        return reply.status(200).send({
          success: true,
          tier: "FREE",
          limits,
        });
      }

      // PREMIUM e ADMIN têm acesso total
      return reply.status(200).send({
        success: true,
        tier,
        limits: null, // Sem limites
      });
    }
  );

  /**
   * POST /api/subscriptions/checkout
   * Simula um checkout de plano.
   */
  app.post(
    "/subscriptions/checkout",
    { preHandler: [ensureAuthenticated] },
    async (request, reply) => {
      const { planId } = subscribeSchema.parse(request.body);
      const subscription = await SubscriptionService.subscribe(request.user.id, planId);
      return reply.status(201).send({ 
        success: true, 
        message: "Assinatura realizada com sucesso!", 
        data: subscription 
      });
    }
  );

  /**
   * POST /api/subscriptions/cleanup
   * Rota administrativa para limpar assinaturas expiradas.
   */
  app.post(
    "/subscriptions/cleanup",
    { preHandler: [ensureAuthenticated, authorize([UserRole.ADMIN])] },
    async (request, reply) => {
      const count = await SubscriptionService.cleanupExpiredSubscriptions();
      return reply.status(200).send({ 
        success: true, 
        message: `${count} assinaturas expiradas foram atualizadas.` 
      });
    }
  );
}
