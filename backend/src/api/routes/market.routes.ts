import { FastifyInstance } from "fastify";
import { z } from "zod";
import { TechnicalAnalysisService } from "../../application/technical-analysis.service";
import { MarketService } from "../../application/services/market.service";
import { ensureAuthenticated } from "../middlewares/auth.middleware";
import { setUserTier, isSymbolAllowedForFree, isTimeframeAllowedForFree, getFreeTierLimits } from "../middlewares/freemium.middleware";
import { AppError } from "../../shared/errors/AppError";
import { CryptocurrencyRepository } from "../../infrastructure/repositories/cryptocurrency.repository";
import { CandleRepository } from "../../infrastructure/repositories/candle.repository";

export async function marketRoutes(app: FastifyInstance) {
  /**
   * GET /api/market/dashboard/:symbol
   * Retorna dados do dashboard para um símbolo.
   *
   * Controle Freemium:
   * - FREE: apenas BTCUSDT permitido; indicadores limitados (RSI, StochRSI)
   * - PREMIUM/ADMIN: todos os símbolos e indicadores completos
   */
  app.get(
    "/market/dashboard/:symbol",
    { preHandler: [ensureAuthenticated, setUserTier] },
    async (request, reply) => {
      const paramsSchema = z.object({
        symbol: z.string().min(1).toUpperCase()
      });

      try {
        const { symbol } = paramsSchema.parse(request.params);

        // Bloqueio server-side: FREE só acessa BTCUSDT
        if (request.tier === "FREE" && !(await isSymbolAllowedForFree(symbol))) {
          return reply.status(403).send({
            success: false,
            message: "Este ativo está disponível apenas no plano Premium.",
            upgradeRequired: true,
            allowedSymbols: (await getFreeTierLimits()).allowedSymbols,
          });
        }

        const data = await TechnicalAnalysisService.getDashboardData(symbol);

        // Para FREE: filtrar campos sensíveis dos indicadores
        if (request.tier === "FREE") {
          return reply.status(200).send({
            success: true,
            tier: "FREE",
            data: {
              symbol: data.symbol,
              lastPrice: data.lastPrice,
              indicators: {
                rsi: data.indicators?.rsi ?? null,
                stochRsi: data.indicators?.stochRsi ?? null,
                // EMA e MACD omitidos para FREE
              },
            },
          });
        }

        // PREMIUM/ADMIN: dados completos
        return reply.status(200).send({
          success: true,
          tier: request.tier,
          data
        });
      } catch (error) {
        if (error instanceof AppError) throw error;
        return reply.status(400).send({
          success: false,
          message: "Erro ao buscar dados do dashboard."
        });
      }
    }
  );

  /**
   * GET /api/market/analysis/:symbol
   * Retorna dados históricos de análise técnica.
   *
   * Controle Freemium:
   * - FREE: apenas BTCUSDT, apenas timeframe 1d, máximo 20 registros
   * - PREMIUM/ADMIN: todos os símbolos, timeframes e registros completos
   */
  app.get(
    "/market/analysis/:symbol",
    { preHandler: [ensureAuthenticated, setUserTier] },
    async (request, reply) => {
      const paramsSchema = z.object({
        symbol: z.string().min(1).toUpperCase()
      });

      const querySchema = z.object({
        interval: z.string().default("1d")
      });

      try {
        const { symbol } = paramsSchema.parse(request.params);
        const { interval } = querySchema.parse(request.query);

        // Bloqueio server-side: FREE só acessa BTCUSDT
        if (request.tier === "FREE" && !(await isSymbolAllowedForFree(symbol))) {
          return reply.status(403).send({
            success: false,
            message: "Este ativo está disponível apenas no plano Premium.",
            upgradeRequired: true,
          });
        }

        // Bloqueio server-side: FREE só acessa timeframe 1d
        if (request.tier === "FREE" && !(await isTimeframeAllowedForFree(interval))) {
          return reply.status(403).send({
            success: false,
            message: `O timeframe "${interval}" está disponível apenas no plano Premium.`,
            upgradeRequired: true,
            allowedTimeframes: (await getFreeTierLimits()).allowedTimeframes,
          });
        }

        const data = await MarketService.getAnalysis(symbol, interval);

        // Para FREE: limitar quantidade de registros retornados
        if (request.tier === "FREE") {
          const limits = await getFreeTierLimits();
          return reply.status(200).send({
            success: true,
            tier: "FREE",
            data: {
              ...data,
              indicators: data.indicators.slice(0, limits.maxHistoryRecords),
              totalAvailable: data.indicators.length,
              limitApplied: limits.maxHistoryRecords,
            },
          });
        }

        // PREMIUM/ADMIN: dados completos
        return reply.status(200).send({
          success: true,
          tier: request.tier,
          data
        });
      } catch (error: unknown) {
        if (error instanceof AppError) throw error;
        const message = error instanceof Error ? error.message : "Erro ao buscar análise de mercado.";
        return reply.status(400).send({
          success: false,
          message,
        });
      }
    }
  );

  /**
   * GET /api/market/symbols
   * Retorna a lista de símbolos ativos no sistema.
   */
  app.get(
    "/market/symbols",
    { preHandler: [ensureAuthenticated] },
    async (request, reply) => {
      try {
        const cryptos = await CryptocurrencyRepository.findAllActive();
        
        return reply.status(200).send({
          success: true,
          data: cryptos.map((c: any) => ({
            symbol: c.symbol,
            name: c.name,
            baseAsset: c.baseAsset
          })),
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message: "Erro ao buscar símbolos.",
        });
      }
    }
  );

  /**
   * GET /api/market/history/:symbol
   * Retorna dados históricos do banco de dados (candles + indicadores consolidados).
   *
   * Controle Freemium:
   * - FREE: apenas BTCUSDT, apenas timeframe 1d, máximo limitado de registros
   * - PREMIUM/ADMIN: todos os símbolos, timeframes e registros completos
   */
  app.get(
    "/market/history/:symbol",
    { preHandler: [ensureAuthenticated, setUserTier] },
    async (request, reply) => {
      const paramsSchema = z.object({
        symbol: z.string().min(1).toUpperCase()
      });

      const querySchema = z.object({
        interval: z.string().default("1d"),
        limit: z.coerce.number().int().min(1).max(1000).default(1000),
      });

      try {
        const { symbol } = paramsSchema.parse(request.params);
        const { interval, limit } = querySchema.parse(request.query);

        // Bloqueio server-side: FREE só acessa BTCUSDT
        if (request.tier === "FREE" && !(await isSymbolAllowedForFree(symbol))) {
          return reply.status(403).send({
            success: false,
            message: "Este ativo está disponível apenas no plano Premium.",
            upgradeRequired: true,
          });
        }

        // Bloqueio server-side: FREE só acessa timeframe 1d
        if (request.tier === "FREE" && !(await isTimeframeAllowedForFree(interval))) {
          return reply.status(403).send({
            success: false,
            message: `O timeframe "${interval}" está disponível apenas no plano Premium.`,
            upgradeRequired: true,
          });
        }

        const rows = await CandleRepository.getHistoryWithIndicators(symbol, interval, limit);

        // Calcula tendências a partir dos indicadores do banco
        const indicators = rows.map((row, index) => {
          const rsi = row.rsi ?? 0;
          const rsiMa = row.rsi_ma ?? 0;
          const stochK = row.rsi_k ?? 0;
          const stochD = row.rsi_d ?? 0;

          // Valores anteriores (rows está DESC, então o anterior cronologicamente é index + 1)
          const prev = index < rows.length - 1 ? rows[index + 1] : null;
          const prevStochD = prev?.rsi_d ?? 0;
          const prevRsiMa = prev?.rsi_ma ?? 0;

          // Lógica de tendências validada
          const trendRSIe1 = (stochD > prevStochD && stochK > stochD) ? "Alta" : "Baixa";
          const trendRSIe2 = (stochK > stochD) ? "Alta" : "Baixa";
          const trendRsi1 = (rsiMa > prevRsiMa && rsi > rsiMa) ? "Alta" : "Baixa";
          const trendRsi2 = (rsiMa > prevRsiMa) ? "Alta" : "Baixa";

          const trend = trendRsi2;
          let signal: "Compra" | "Venda" | "Neutro" = "Neutro";
          if (trendRsi1 === "Alta" && trendRSIe1 === "Alta") signal = "Compra";
          else if (trendRsi2 === "Baixa" && trendRSIe2 === "Baixa") signal = "Venda";

          return {
            time: row.open_time,
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            rsi,
            rsiMa,
            stochK,
            stochD,
            trendRSIe1,
            trendRSIe2,
            trendRsi1,
            trendRsi2,
            trend,
            signal,
          };
        });

        const responseData = {
          symbol,
          interval,
          lastUpdate: Date.now(),
          indicators,
        };

        // Para FREE: limitar quantidade de registros retornados
        if (request.tier === "FREE") {
          const limits = await getFreeTierLimits();
          return reply.status(200).send({
            success: true,
            tier: "FREE",
            data: {
              ...responseData,
              indicators: responseData.indicators.slice(0, limits.maxHistoryRecords),
              totalAvailable: responseData.indicators.length,
              limitApplied: limits.maxHistoryRecords,
            },
          });
        }

        return reply.status(200).send({
          success: true,
          tier: request.tier,
          data: responseData,
        });
      } catch (error: unknown) {
        if (error instanceof AppError) throw error;
        const message = error instanceof Error ? error.message : "Erro ao buscar histórico.";
        return reply.status(400).send({
          success: false,
          message,
        });
      }
    }
  );
}
