import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

function parseDbUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "3306", 10),
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace("/", ""),
    connectionLimit: 10,
  };
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL not set");

const adapter = new PrismaMariaDb(parseDbUrl(dbUrl));
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding cryptocurrencies...");
  
  const cryptos = [
    { symbol: "BTCUSDT", name: "Bitcoin", baseAsset: "BTC", quoteAsset: "USDT" },
    { symbol: "ETHUSDT", name: "Ethereum", baseAsset: "ETH", quoteAsset: "USDT" },
    { symbol: "BNBUSDT", name: "Binance Coin", baseAsset: "BNB", quoteAsset: "USDT" },
    { symbol: "SOLUSDT", name: "Solana", baseAsset: "SOL", quoteAsset: "USDT" },
    { symbol: "XRPUSDT", name: "Ripple", baseAsset: "XRP", quoteAsset: "USDT" },
    { symbol: "ADAUSDT", name: "Cardano", baseAsset: "ADA", quoteAsset: "USDT" },
    { symbol: "AVAXUSDT", name: "Avalanche", baseAsset: "AVAX", quoteAsset: "USDT" },
    { symbol: "DOTUSDT", name: "Polkadot", baseAsset: "DOT", quoteAsset: "USDT" },
    { symbol: "LINKUSDT", name: "Chainlink", baseAsset: "LINK", quoteAsset: "USDT" },
    { symbol: "MATICUSDT", name: "Polygon", baseAsset: "MATIC", quoteAsset: "USDT" },
  ];

  for (const crypto of cryptos) {
    await prisma.cryptocurrency.upsert({
      where: { symbol: crypto.symbol },
      update: {},
      create: {
        ...crypto,
        isActive: true,
      },
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
