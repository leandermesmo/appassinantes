import { Subscription, SubscriptionStatus, Plan } from "@prisma/client";
import { SubscriptionRepository } from "../infrastructure/repositories/subscription.repository";
import { PlanRepository } from "../infrastructure/repositories/plan.repository";
import { AppError } from "../shared/errors/AppError";

export class SubscriptionService {
  /**
   * Verifica se o usuário possui uma assinatura ativa.
   * Retorna os detalhes da assinatura e as features do plano.
   */
  static async checkActiveSubscription(userId: string) {
    const activeSub = await SubscriptionRepository.findActiveByUserId(userId);

    if (!activeSub) {
      throw new AppError("Assinatura inativa ou expirada. Faça o upgrade para continuar.", 403);
    }

    return activeSub;
  }

  /**
   * Lista todos os planos disponíveis para o usuário.
   */
  static async listAvailablePlans(): Promise<Plan[]> {
    return PlanRepository.listAllActive();
  }

  /**
   * Cria uma assinatura para o usuário (Simulação de checkout bem-sucedido).
   * Em produção, isso seria chamado por um webhook de pagamento.
   */
  static async subscribe(userId: string, planId: number): Promise<Subscription> {
    const plan = await PlanRepository.findById(planId);

    if (!plan || !plan.isActive) {
      throw new AppError("Plano não encontrado ou inativo.", 404);
    }

    const startDate = new Date();
    const endDate = new Date();

    if (plan.billingCycle === "MONTHLY") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.billingCycle === "YEARLY") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Cria a assinatura
    const subscription = await SubscriptionRepository.create({
      userId,
      planId: plan.id,
      periodStartDate: startDate,
      periodEndDate: endDate,
      status: SubscriptionStatus.ACTIVE,
    });

    return subscription;
  }

  /**
   * Rotina para desativar assinaturas expiradas.
   * Pode ser exposta em uma rota protegida para ser chamada via Cron Job.
   */
  static async cleanupExpiredSubscriptions(): Promise<number> {
    return SubscriptionRepository.markExpiredAsPastDue();
  }
}
