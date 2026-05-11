import { Plan } from "@prisma/client";
import { prisma } from "../database/prisma.client";

export class PlanRepository {
  /**
   * Lista todos os planos ativos para exibição no frontend.
   */
  static async listAllActive(): Promise<Plan[]> {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
  }

  /**
   * Busca um plano específico pelo ID.
   */
  static async findById(id: number): Promise<Plan | null> {
    return prisma.plan.findUnique({
      where: { id },
    });
  }

  /**
   * Cria ou atualiza um plano (utilitário para seed).
   */
  static async upsert(data: {
    id: number;
    name: string;
    description: string;
    price: number;
    billingCycle: "MONTHLY" | "YEARLY";
    features: any;
  }): Promise<Plan> {
    return prisma.plan.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        description: data.description,
        price: data.price,
        billingCycle: data.billingCycle,
        features: data.features,
      },
      create: {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        billingCycle: data.billingCycle,
        features: data.features,
      },
    });
  }
}
