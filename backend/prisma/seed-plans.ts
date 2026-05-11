import "dotenv/config";
import { prisma } from "../src/infrastructure/database/prisma.client";
import { BillingCycle } from "@prisma/client";

async function main() {
  console.log("🌱 Iniciando seed de planos atualizados (Estrutura Flat)...");

  const plans = [
    {
      id: 1,
      name: "Free",
      description: "Acesso gratuito e limitado apenas ao BTC",
      price: 0.0,
      billingCycle: BillingCycle.MONTHLY,
      maxFavorites: 3,
      maxSignals: 1,
      maxHistoryRecords: 20,
      hasVipSignals: false,
      hasSignalAlerts: false,
      isActive: true,
    },
    {
      id: 2,
      name: "Premium 01 Mensal",
      description: "Acesso somente a criptoativos - Mensal",
      price: 97.0,
      billingCycle: BillingCycle.MONTHLY,
      maxFavorites: 50,
      maxSignals: 10,
      maxHistoryRecords: 100,
      hasVipSignals: true,
      hasSignalAlerts: false,
      isActive: true,
    },
    {
      id: 3,
      name: "Premium 01 Anual",
      description: "Acesso somente a criptoativos - Anual",
      price: 897.0,
      billingCycle: BillingCycle.YEARLY,
      maxFavorites: 100,
      maxSignals: 20,
      maxHistoryRecords: 500,
      hasVipSignals: true,
      hasSignalAlerts: true,
      isActive: true,
    }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
    console.log(`✅ Plano configurado: ${plan.name}`);
  }

  console.log("🏁 Seed de planos concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
