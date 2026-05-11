import "dotenv/config";
import { prisma } from "../src/infrastructure/database/prisma.client";
import { BillingCycle, UserRole } from "@prisma/client";



async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // ─────────────────────────────────────────────
  // 1. PLANOS
  // ─────────────────────────────────────────────
  const planFree = await prisma.plan.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Free",
      description: "Acesso limitado às funcionalidades básicas da plataforma.",
      price: 0.0,
      billingCycle: BillingCycle.MONTHLY,
      maxFavorites: 3,
      hasSignalAlerts: false,
      hasVipSignals: false,
      maxSignals: 1,
      maxHistoryRecords: 20,
      isActive: true,
    },
  });

  const planPro = await prisma.plan.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Pro",
      description: "Acesso completo com indicadores avançados e múltiplos timeframes.",
      price: 49.9,
      billingCycle: BillingCycle.MONTHLY,
      maxFavorites: 20,
      hasSignalAlerts: true,
      hasVipSignals: false,
      maxSignals: 5,
      maxHistoryRecords: 100,
      isActive: true,
    },
  });

  const planPremium = await prisma.plan.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: "Premium",
      description: "Plano topo de linha com sinais VIP, alertas em tempo real e suporte prioritário.",
      price: 99.9,
      billingCycle: BillingCycle.MONTHLY,
      maxFavorites: -1, // -1 = ilimitado
      hasSignalAlerts: true,
      hasVipSignals: true,
      maxSignals: 10,
      maxHistoryRecords: 500,
      isActive: true,
    },
  });

  console.log(`✅ Planos criados: Free (#${planFree.id}), Pro (#${planPro.id}), Premium (#${planPremium.id})`);

  // ─────────────────────────────────────────────
  // 2. INDICADORES TÉCNICOS
  // ─────────────────────────────────────────────
  if (process.env.ENABLE_INDICATOR_PERSISTENCE === 'true') {
    const indicators = await Promise.all([
      prisma.technicalIndicator.upsert({
        where: { code: "rsi_14" },
        update: {},
        create: {
          name: "RSI (14)",
          code: "rsi_14",
          description: "Índice de Força Relativa com período de 14 velas. Mede a velocidade e magnitude dos movimentos de preço.",
          parameters: JSON.stringify({ period: 14, overbought: 70, oversold: 30 }),
        },
      }),
      prisma.technicalIndicator.upsert({
        where: { code: "stochrsi_14" },
        update: {},
        create: {
          name: "StochRSI (14,14,3,3)",
          code: "stochrsi_14",
          description: "RSI Estocástico. Aplica o oscilador estocástico ao RSI para gerar sinais de sobrecompra/sobrevenda mais sensíveis.",
          parameters: JSON.stringify({ rsiPeriod: 14, stochasticPeriod: 14, kPeriod: 3, dPeriod: 3, overbought: 0.8, oversold: 0.2 }),
        },
      }),
      prisma.technicalIndicator.upsert({
        where: { code: "ema_21" },
        update: {},
        create: {
          name: "EMA (21)",
          code: "ema_21",
          description: "Média Móvel Exponencial de 21 períodos. Referência de tendência de curto prazo.",
          parameters: JSON.stringify({ period: 21 }),
        },
      }),
      prisma.technicalIndicator.upsert({
        where: { code: "ema_50" },
        update: {},
        create: {
          name: "EMA (50)",
          code: "ema_50",
          description: "Média Móvel Exponencial de 50 períodos. Referência de tendência de médio prazo.",
          parameters: JSON.stringify({ period: 50 }),
        },
      }),
      prisma.technicalIndicator.upsert({
        where: { code: "ema_200" },
        update: {},
        create: {
          name: "EMA (200)",
          code: "ema_200",
          description: "Média Móvel Exponencial de 200 períodos. Referência global de tendência de longo prazo.",
          parameters: JSON.stringify({ period: 200 }),
        },
      }),
      prisma.technicalIndicator.upsert({
        where: { code: "confluence_strat" },
        update: {},
        create: {
          name: "Estratégia de Confluência",
          code: "confluence_strat",
          description: "Estratégia principal combinando RSI, StochRSI e EMAs para sinais de alta precisão.",
          parameters: JSON.stringify({ weightRsi: 0.3, weightStoch: 0.3, weightEma: 0.4 }),
        },
      }),
    ]);
    console.log(`✅ ${indicators.length} indicadores técnicos criados/confirmados.`);
  } else {
    console.log("ℹ️ Criação de indicadores pulada (ENABLE_INDICATOR_PERSISTENCE=false)");
  }


  // ─────────────────────────────────────────────
  // 3. CRIPTOMOEDAS INICIAIS
  // ─────────────────────────────────────────────
  const cryptoAssets = [
    { symbol: "BTCUSDT", baseAsset: "BTC", quoteAsset: "USDT", name: "Bitcoin" },
    { symbol: "ETHUSDT", baseAsset: "ETH", quoteAsset: "USDT", name: "Ethereum" },
    { symbol: "BNBUSDT", baseAsset: "BNB", quoteAsset: "USDT", name: "BNB" },
    { symbol: "SOLUSDT", baseAsset: "SOL", quoteAsset: "USDT", name: "Solana" },
    { symbol: "XRPUSDT", baseAsset: "XRP", quoteAsset: "USDT", name: "XRP" },
    { symbol: "ADAUSDT", baseAsset: "ADA", quoteAsset: "USDT", name: "Cardano" },
    { symbol: "DOGEUSDT", baseAsset: "DOGE", quoteAsset: "USDT", name: "Dogecoin" },
    { symbol: "AVAXUSDT", baseAsset: "AVAX", quoteAsset: "USDT", name: "Avalanche" },
  ];

  for (const asset of cryptoAssets) {
    await prisma.cryptocurrency.upsert({
      where: { symbol: asset.symbol },
      update: {},
      create: { ...asset, isActive: true },
    });
  }

  console.log(`✅ ${cryptoAssets.length} criptomoedas iniciais criadas/confirmadas.`);

  // ─────────────────────────────────────────────
  // 4. USUÁRIO ADMIN PADRÃO (senha: Admin@1234)
  // ─────────────────────────────────────────────
  // USUÁRIO ADMINISTRADOR INICIAL
  // Este bloco garante a existência de um administrador para o primeiro acesso ao sistema.
  // A senha abaixo utiliza o hash bcrypt de alta segurança (Admin@1234).
  const adminPasswordHash = "$2b$12$XKHbB.k5l6qLJI2G/y3OUe6E2f5vVh7X1LcRvWkZ7Y3oN2XkGq6Pa";

  const admin = await prisma.user.upsert({
    where: { email: "admin@appcrypto.com" },
    update: {},
    create: {
      name: "Admin AppCrypto",
      email: "admin@appcrypto.com",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      status: "ACTIVE",
    },
  });

  console.log(`✅ Admin criado: ${admin.email}`);
  console.log("🎉 Seed concluído com sucesso!");
}

main()
  .catch((error) => {
    console.error("❌ Erro durante o seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
