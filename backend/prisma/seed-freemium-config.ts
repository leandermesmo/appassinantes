import "dotenv/config";
import { prisma } from "../src/infrastructure/database/prisma.client";

/**
 * Seed para popular a configuração inicial do Freemium.
 * Estes valores refletem os limites que antes estavam hardcoded
 * no freemium.middleware.ts. Agora são gerenciáveis via painel admin.
 */
async function main() {
  console.log("🌱 Configurando FreemiumConfig...");

  await prisma.freemiumConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      allowedSymbols: ["BTCUSDT"],
      allowedTimeframes: ["1d"],
      maxHistoryRecords: 20,
      maxSignals: 1,
      maxFavorites: 3,
    },
  });

  console.log("✅ FreemiumConfig configurado com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
