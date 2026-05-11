import { Cryptocurrency } from "@prisma/client";
import { prisma } from "../database/prisma.client";

export class CryptocurrencyRepository {
  /**
   * Retorna todas as criptomoedas ativas no sistema.
   */
  static async findAllActive(): Promise<Cryptocurrency[]> {
    return prisma.cryptocurrency.findMany({
      where: { isActive: true },
      orderBy: { symbol: "asc" },
    });
  }

  /**
   * Busca uma moeda pelo símbolo (ex: BTCUSDT).
   */
  static async findBySymbol(symbol: string): Promise<Cryptocurrency | null> {
    return prisma.cryptocurrency.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });
  }

  /**
   * Sincroniza a lista de ativos vindos da Binance com o banco local.
   * Cria novos ativos e desativa os que não foram enviados.
   */
  static async syncFromBinance(
    assets: { symbol: string; baseAsset: string; quoteAsset: string }[]
  ): Promise<void> {
    // Upsert de cada ativo recebido
    const upsertOperations = assets.map((asset) =>
      prisma.cryptocurrency.upsert({
        where: { symbol: asset.symbol },
        update: { isActive: true },
        create: {
          symbol: asset.symbol,
          baseAsset: asset.baseAsset,
          quoteAsset: asset.quoteAsset,
          name: asset.baseAsset, // fallback: nome = ticker base
          isActive: true,
        },
      })
    );

    await prisma.$transaction(upsertOperations);
  }
}
