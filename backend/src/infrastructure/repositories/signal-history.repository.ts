import { Prisma, SignalType } from "@prisma/client";
import { prisma } from "../database/prisma.client";
import { FLAGS } from "../../shared/config";



interface CreateSignalDto {
  cryptoId: number;
  indicatorId: number;
  timeframe: string;
  signalType: SignalType;
  value: number;
  generatedAt: Date;
}

interface FindLatestSignalsFilter {
  cryptoId: number;
  timeframe: string;
}

export class SignalHistoryRepository {
  /**
   * Insere múltiplos sinais em lote (batch insert) para alta performance.
   * Evita N inserts individuais no banco.
   */
  static async createMany(signals: CreateSignalDto[]): Promise<Prisma.BatchPayload> {
    if (!FLAGS.ENABLE_INDICATOR_PERSISTENCE) {
      console.log(`[SignalHistoryRepository] Persistence disabled. Skipping ${signals.length} signals.`);
      return { count: 0 };
    }
    return prisma.signalHistory.createMany({
      data: signals.map((s) => ({
        cryptoId: s.cryptoId,
        indicatorId: s.indicatorId,
        timeframe: s.timeframe,
        signalType: s.signalType,
        // Prisma aceita number para Decimal
        value: s.value,
        generatedAt: s.generatedAt,
      })),
      // Ignora se o sinal já foi inserido (idempotência do scanner)
      skipDuplicates: true,
    });
  }

  /**
   * Retorna os N sinais mais recentes de uma moeda em um timeframe específico.
   * Útil para alimentar o gráfico de histórico no dashboard.
   */
  static async findLatestByFilter(
    filter: FindLatestSignalsFilter,
    limit: number = 100
  ) {
    if (!FLAGS.ENABLE_INDICATOR_PERSISTENCE) return [];

    return prisma.signalHistory.findMany({
      where: {
        cryptoId: filter.cryptoId,
        timeframe: filter.timeframe,
      },
      orderBy: { generatedAt: "desc" },
      take: limit,
      include: {
        indicator: { select: { code: true, name: true } },
      },
    });
  }

  /**
   * Retorna o sinal mais recente de cada indicador de uma moeda/timeframe.
   * Otimizado para o carregamento do dashboard (snapshot atual).
   */
  static async findCurrentSnapshot(filter: FindLatestSignalsFilter) {
    if (!FLAGS.ENABLE_INDICATOR_PERSISTENCE) return [];

    // Busca os indicadores únicos para construir N sub-queries
    const indicators = await prisma.technicalIndicator.findMany({
      select: { id: true },
    });

    const promises = indicators.map((ind) =>
      prisma.signalHistory.findFirst({
        where: {
          cryptoId: filter.cryptoId,
          timeframe: filter.timeframe,
          indicatorId: ind.id,
        },
        orderBy: { generatedAt: "desc" },
        include: { indicator: { select: { code: true, name: true } } },
      })
    );

    const results = await Promise.all(promises);
    // Filtra nulos (indicadores sem dados para essa moeda/timeframe)
    return results.filter((r) => r !== null);
  }

  /**
   * Remove sinais antigos para controlar o tamanho da tabela (TTL/Data Retention).
   * Deve ser chamado por um Cron Job periódico.
   */
  static async deleteOlderThan(
    timeframe: string,
    retentionDays: number
  ): Promise<Prisma.BatchPayload> {
    if (!FLAGS.ENABLE_INDICATOR_PERSISTENCE) return { count: 0 };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    return prisma.signalHistory.deleteMany({
      where: {
        timeframe,
        generatedAt: { lt: cutoffDate },
      },
    });
  }
}
