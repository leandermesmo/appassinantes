import "dotenv/config";
import { prisma } from "../src/infrastructure/database/prisma.client";

async function main() {
  console.log("🚀 Criando indicador de estratégia...");
  
  await prisma.technicalIndicator.upsert({
    where: { code: "confluence_strat" },
    update: {},
    create: {
      name: "Confluência Estratégica Premium",
      code: "confluence_strat",
      description: "Lógica proprietária que une RSI, StochRSI, MACD e EMAs para identificar pontos de reversão e tendência.",
      parameters: { 
        indicators: ["RSI", "StochRSI", "MACD", "EMA"],
        secret: true 
      },
    },
  });

  console.log("✅ Indicador criado com sucesso!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
