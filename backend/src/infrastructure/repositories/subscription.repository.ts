import { Subscription, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../database/prisma.client";

export class SubscriptionRepository {
  /**
   * Cria uma nova assinatura vinculando usuário e plano.
   */
  static async create(data: {
    userId: string;
    planId: number;
    periodStartDate: Date;
    periodEndDate: Date;
    status?: SubscriptionStatus;
  }): Promise<Subscription> {
    return prisma.subscription.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        status: data.status ?? SubscriptionStatus.ACTIVE,
        currentPeriodStart: data.periodStartDate,
        currentPeriodEnd: data.periodEndDate,
      },
    });
  }

  /**
   * Busca a assinatura ativa atual de um usuário com os dados do plano.
   * Usado para verificação de permissões em cada requisição protegida.
   */
  static async findActiveByUserId(
    userId: string
  ): Promise<(Subscription & { plan: { id: number, name: string, maxFavorites: number, maxSignals: number, maxHistoryRecords: number, hasVipSignals: boolean, hasSignalAlerts: boolean } }) | null> {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { gte: new Date() }, // Assinatura ainda vigente
      },
      include: {
        plan: {
          select: { id: true, name: true, maxFavorites: true, maxSignals: true, maxHistoryRecords: true, hasVipSignals: true, hasSignalAlerts: true },
        },
      },
      orderBy: { currentPeriodEnd: "desc" },
    });
  }

  /**
   * Cancela uma assinatura (não deleta para manter histórico financeiro).
   */
  static async cancel(subscriptionId: string): Promise<void> {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
      },
    });
  }

  /**
   * Marca assinaturas expiradas como PAST_DUE.
   * Deve ser executado por um Cron Job diário.
   */
  static async markExpiredAsPastDue(): Promise<number> {
    const result = await prisma.subscription.updateMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { lt: new Date() },
      },
      data: { status: SubscriptionStatus.PAST_DUE },
    });
    return result.count;
  }
}
