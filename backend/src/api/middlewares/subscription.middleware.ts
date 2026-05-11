import { FastifyRequest, FastifyReply } from "fastify";
import { SubscriptionService } from "../../application/subscription.service";
import { AppError } from "../../shared/errors/AppError";

/**
 * Middleware para proteger rotas premium.
 * Deve ser usado APÓS o ensureAuthenticated.
 */
export async function ensureSubscriptionActive(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.user || !request.user.id) {
    throw new AppError("Usuário não autenticado.", 401);
  }

  // O Admin tem acesso total sem precisar de assinatura
  if (request.user.role === "ADMIN") {
    return;
  }

  try {
    // Verifica se há uma assinatura ativa no banco
    const subscription = await SubscriptionService.checkActiveSubscription(request.user.id);

    // Adiciona as informações da assinatura no request para uso nos controllers
    request.subscription = {
      planId: subscription.planId,
      features: {
        maxFavorites: subscription.plan.maxFavorites,
        maxSignals: subscription.plan.maxSignals,
        maxHistoryRecords: subscription.plan.maxHistoryRecords,
        hasVipSignals: subscription.plan.hasVipSignals,
        hasSignalAlerts: subscription.plan.hasSignalAlerts,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Erro ao verificar assinatura.", 500);
  }
}

// Extensão de tipos para o Fastify incluir o campo subscription no Request
declare module "fastify" {
  interface FastifyRequest {
    subscription?: {
      planId: number;
      features: Record<string, any>;
    };
  }
}
