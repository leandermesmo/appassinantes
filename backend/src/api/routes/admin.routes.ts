import { FastifyInstance } from "fastify";
import { z } from "zod";
import { UserStatus, SubscriptionStatus } from "@prisma/client";
import { AdminService } from "../../application/admin.service";
import { ensureAuthenticated, authorize } from "../middlewares/auth.middleware";

/**
 * Rotas exclusivas do painel administrativo.
 *
 * Todas as rotas exigem:
 * 1. Autenticação via JWT (ensureAuthenticated)
 * 2. Role ADMIN (authorize)
 *
 * Rate limit diferenciado: 30 req/min (configurado no registro da rota).
 */

// ─────────────────────────────────────────────
// Schemas de validação (Zod)
// ─────────────────────────────────────────────

const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  role: z.enum(["ALL", "USER", "ADMIN"]).optional().default("ALL"),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE", "SUSPENDED", "BANNED"]).optional().default("ALL"),
});

const userIdSchema = z.object({
  id: z.string().length(36, "ID do usuário deve ter 36 caracteres (UUID)."),
});

const changeStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

const listSubscriptionsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(["ALL", "ACTIVE", "CANCELED", "PAST_DUE", "TRIALING"]).optional().default("ALL"),
});

const subscriptionIdSchema = z.object({
  id: z.string().length(36, "ID da assinatura deve ter 36 caracteres (UUID)."),
});

const updateSubscriptionSchema = z.object({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  planId: z.number().int().positive().optional(),
});

const overrideSubscriptionSchema = z.object({
  planId: z.number().int().positive(),
  durationDays: z.number().int().min(1).max(365),
});

const updateFreemiumConfigSchema = z.object({
  allowedSymbols: z.array(z.string().min(1)).optional(),
  allowedTimeframes: z.array(z.string().min(1)).optional(),
  maxHistoryRecords: z.number().int().min(1).optional(),
  maxSignals: z.number().int().min(1).optional(),
  maxFavorites: z.number().int().min(1).optional(),
});

/**
 * Extrai o IP do cliente da request para fins de auditoria.
 */
function getClientIp(request: { ip: string; headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return request.ip;
}

// ─────────────────────────────────────────────
// Registro das rotas
// ─────────────────────────────────────────────

export async function adminRoutes(app: FastifyInstance) {
  // Middlewares aplicados globalmente a todas as rotas deste módulo
  const adminPreHandler = [ensureAuthenticated, authorize(["ADMIN"])];

  // ─── DASHBOARD ────────────────────────────

  /**
   * GET /api/admin/dashboard
   * Métricas agregadas para o painel administrativo.
   */
  app.get(
    "/dashboard",
    { preHandler: adminPreHandler },
    async (_request, reply) => {
      const metrics = await AdminService.getDashboardMetrics();
      return reply.status(200).send({ success: true, data: metrics });
    }
  );

  // ─── USUÁRIOS ─────────────────────────────

  /**
   * GET /api/admin/users
   * Listagem paginada com busca e filtros.
   */
  app.get(
    "/users",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const params = listUsersSchema.parse(request.query);
      const result = await AdminService.listUsers(params);
      return reply.status(200).send({ success: true, data: result });
    }
  );

  /**
   * GET /api/admin/users/:id
   * Dados completos de um usuário.
   */
  app.get(
    "/users/:id",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const { id } = userIdSchema.parse(request.params);
      const user = await AdminService.getUserDetail(id);
      return reply.status(200).send({ success: true, data: user });
    }
  );

  /**
   * PATCH /api/admin/users/:id/status
   * Altera o status de um usuário (bloquear/desbloquear).
   */
  app.patch(
    "/users/:id/status",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const { id } = userIdSchema.parse(request.params);
      const { status } = changeStatusSchema.parse(request.body);
      const ip = getClientIp(request);

      const result = await AdminService.changeUserStatus(
        request.user.id,
        id,
        status,
        ip
      );

      return reply.status(200).send({
        success: true,
        message: `Status do usuário alterado para ${status}.`,
        data: result,
      });
    }
  );

  /**
   * PATCH /api/admin/users/:id/subscription
   * Override: concede acesso PREMIUM manual para um usuário.
   */
  app.patch(
    "/users/:id/subscription",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const { id } = userIdSchema.parse(request.params);
      const { planId, durationDays } = overrideSubscriptionSchema.parse(request.body);
      const ip = getClientIp(request);

      const result = await AdminService.grantPremiumAccess(
        request.user.id,
        id,
        planId,
        durationDays,
        ip
      );

      return reply.status(201).send({
        success: true,
        message: "Acesso premium concedido com sucesso.",
        data: result,
      });
    }
  );

  // ─── ASSINATURAS ──────────────────────────

  /**
   * GET /api/admin/subscriptions
   * Listagem paginada de assinaturas.
   */
  app.get(
    "/subscriptions",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const params = listSubscriptionsSchema.parse(request.query);
      const result = await AdminService.listSubscriptions(params);
      return reply.status(200).send({ success: true, data: result });
    }
  );

  /**
   * PATCH /api/admin/subscriptions/:id
   * Atualiza status e/ou plano de uma assinatura.
   */
  app.patch(
    "/subscriptions/:id",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const { id } = subscriptionIdSchema.parse(request.params);
      const data = updateSubscriptionSchema.parse(request.body);
      const ip = getClientIp(request);

      if (!data.status && !data.planId) {
        return reply.status(400).send({
          success: false,
          message: "Informe ao menos um campo para atualizar (status ou planId).",
        });
      }

      const result = await AdminService.updateSubscription(
        request.user.id,
        id,
        data,
        ip
      );

      return reply.status(200).send({
        success: true,
        message: "Assinatura atualizada com sucesso.",
        data: result,
      });
    }
  );

  // ─── FREEMIUM CONFIG ──────────────────────

  /**
   * GET /api/admin/freemium-config
   * Configuração atual dos limites do plano FREE.
   */
  app.get(
    "/freemium-config",
    { preHandler: adminPreHandler },
    async (_request, reply) => {
      const config = await AdminService.getFreemiumConfig();
      return reply.status(200).send({ success: true, data: config });
    }
  );

  /**
   * PATCH /api/admin/freemium-config
   * Atualiza os limites do plano FREE (sem necessidade de deploy).
   */
  app.patch(
    "/freemium-config",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const data = updateFreemiumConfigSchema.parse(request.body);
      const ip = getClientIp(request);

      const result = await AdminService.updateFreemiumConfig(
        request.user.id,
        data,
        ip
      );

      return reply.status(200).send({
        success: true,
        message: "Configuração do Freemium atualizada com sucesso.",
        data: result,
      });
    }
  );

  // ─── PLANOS ───────────────────────────────

  const planIdSchema = z.object({
    id: z.coerce.number().int().positive(),
  });

  const createPlanSchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().optional(),
    price: z.number().nonnegative(),
    billingCycle: z.enum(["MONTHLY", "YEARLY"]),
    maxFavorites: z.number().int().nonnegative(),
    maxSignals: z.number().int().nonnegative(),
    maxHistoryRecords: z.number().int().nonnegative(),
    hasVipSignals: z.boolean(),
    hasSignalAlerts: z.boolean(),
  });

  const updatePlanSchema = createPlanSchema.partial().extend({
    isActive: z.boolean().optional(),
  });

  /**
   * GET /api/admin/plans
   */
  app.get(
    "/plans",
    { preHandler: adminPreHandler },
    async (_request, reply) => {
      const plans = await AdminService.listPlans();
      return reply.status(200).send({ success: true, data: plans });
    }
  );

  /**
   * POST /api/admin/plans
   */
  app.post(
    "/plans",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const data = createPlanSchema.parse(request.body);
      const ip = getClientIp(request);
      const plan = await AdminService.createPlan(request.user.id, data, ip);
      return reply.status(201).send({ success: true, data: plan });
    }
  );

  /**
   * PATCH /api/admin/plans/:id
   */
  app.patch(
    "/plans/:id",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const { id } = planIdSchema.parse(request.params);
      const data = updatePlanSchema.parse(request.body);
      const ip = getClientIp(request);
      const plan = await AdminService.updatePlan(request.user.id, id, data, ip);
      return reply.status(200).send({ success: true, data: plan });
    }
  );

  /**
   * DELETE /api/admin/plans/:id
   */
  app.delete(
    "/plans/:id",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const { id } = planIdSchema.parse(request.params);
      const ip = getClientIp(request);
      await AdminService.deletePlan(request.user.id, id, ip);
      return reply.status(200).send({ success: true, message: "Plano removido ou inativado com sucesso." });
    }
  );

  // ─── CRIPTOMOEDAS ─────────────────────────

  const listCryptosSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    search: z.string().optional(),
    isActive: z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : undefined, z.boolean().optional()),
  });

  const cryptoIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
  });

  const cryptoStatusBodySchema = z.object({
    isActive: z.boolean(),
  });

  /**
   * GET /api/admin/cryptocurrencies
   */
  app.get(
    "/cryptocurrencies",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const params = listCryptosSchema.parse(request.query);
      const result = await AdminService.listCryptocurrencies(params);
      return reply.status(200).send({ success: true, data: result });
    }
  );

  /**
   * PATCH /api/admin/cryptocurrencies/:id/status
   */
  app.patch(
    "/cryptocurrencies/:id/status",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const { id } = cryptoIdParamsSchema.parse(request.params);
      const { isActive } = cryptoStatusBodySchema.parse(request.body);
      const ip = getClientIp(request);

      const result = await AdminService.toggleCryptocurrencyStatus(
        request.user.id,
        id,
        isActive,
        ip
      );

      return reply.status(200).send({
        success: true,
        message: `Status do ativo ${result.symbol} alterado para ${isActive ? "Ativo" : "Inativo"}.`,
        data: result,
      });
    }
  );

  /**
   * POST /api/admin/cryptocurrencies/sync
   * Sincroniza pares da Binance.
   */
  app.post(
    "/cryptocurrencies/sync",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const ip = getClientIp(request);
      const result = await AdminService.syncCryptocurrencies(request.user.id, ip);

      return reply.status(200).send({
        success: true,
        message: `${result.count} pares de criptomoedas sincronizados com sucesso.`,
        data: result,
      });
    }
  );

  /**
   * POST /api/admin/cryptocurrencies/:id/ingest
   * Inicia ingestão manual de candles e indicadores para todos os timeframes.
   */
  app.post(
    "/cryptocurrencies/:id/ingest",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const { id } = cryptoIdParamsSchema.parse(request.params);
      const ip = getClientIp(request);

      const result = await AdminService.ingestCryptocurrency(
        request.user.id,
        id,
        ip
      );

      return reply.status(200).send({
        success: true,
        message: `Ingestão manual iniciada para ${result.symbol}.`,
        data: result,
      });
    }
  );

  /**
   * DELETE /api/admin/cryptocurrencies/:id/purge
   * Remove todos os candles e indicadores de uma criptomoeda (desingestão manual).
   */
  app.delete(
    "/cryptocurrencies/:id/purge",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const { id } = cryptoIdParamsSchema.parse(request.params);
      const ip = getClientIp(request);

      const result = await AdminService.purgeCryptocurrency(
        request.user.id,
        id,
        ip
      );

      return reply.status(200).send({
        success: true,
        message: `Dados removidos para ${result.symbol}: ${result.deletedCandles} candles e ${result.deletedIndicators} indicadores deletados.`,
        data: result,
      });
    }
  );
}
