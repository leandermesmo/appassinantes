import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.cryptocurrency.count();
  console.log(`Total cryptocurrencies: ${count}`);
  
  if (count === 0) {
    console.log("Database is empty. Populating with some default values...");
    await prisma.cryptocurrency.createMany({
      data: [
        { symbol: "BTCUSDT", name: "Bitcoin", baseAsset: "BTC", quoteAsset: "USDT", isActive: true },
        { symbol: "ETHUSDT", name: "Ethereum", baseAsset: "ETH", quoteAsset: "USDT", isActive: true },
        { symbol: "BNBUSDT", name: "Binance Coin", baseAsset: "BNB", quoteAsset: "USDT", isActive: true },
        { symbol: "SOLUSDT", name: "Solana", baseAsset: "SOL", quoteAsset: "USDT", isActive: true },
        { symbol: "XRPUSDT", name: "Ripple", baseAsset: "XRP", quoteAsset: "USDT", isActive: true },
      ],
    });
    console.log("Populated with default values.");
  } else {
    const first5 = await prisma.cryptocurrency.findMany({ take: 5 });
    console.log("First 5 records:", JSON.stringify(first5, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
