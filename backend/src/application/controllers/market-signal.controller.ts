import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { MarketSignalService } from "../services/market-signal.service";
import { getFreeTierLimits } from "../../api/middlewares/freemium.middleware";

export async function marketSignalRoutes(fastify: FastifyInstance) {
  
  /**
   * GET /api/signals/summary
   * Retorna um resumo dos sinais atuais para as moedas principais.
   *
   * Controle Freemium:
   * - FREE: retorna apenas 1 sinal (BTC, 1d), sem campo strength
   * - PREMIUM/ADMIN: retorna todos os sinais completos
   */
  fastify.get("/summary", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const summary = await MarketSignalService.getSignalsForDashboard();

      // FREE: limitar sinais e ocultar dados sensíveis
      if (request.tier === "FREE") {
        const limits = await getFreeTierLimits();
        const limitedSignals = summary
          .filter(s => (limits.allowedSymbols as readonly string[]).includes(s.symbol))
          .filter(s => (limits.allowedTimeframes as readonly string[]).includes(s.timeframe))
          .slice(0, limits.maxSignals)
          .map(s => ({
            ...s,
            // Ocultar strength para FREE — incentiva upgrade
            strength: 0,
          }));

        return {
          signals: limitedSignals,
          tier: "FREE",
          totalAvailable: summary.length,
          limitApplied: limits.maxSignals,
        };
      }

      // PREMIUM/ADMIN: dados completos
      return {
        signals: summary,
        tier: request.tier,
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Erro ao carregar resumo de sinais" });
    }
  });

  /**
   * GET /api/signals/history/:symbol
   * Retorna histórico de sinais de um símbolo.
   *
   * Controle Freemium:
   * - FREE: apenas BTCUSDT, limitado a 10 registros
   * - PREMIUM/ADMIN: qualquer símbolo, até 50 registros
   */
  fastify.get("/history/:symbol", async (request: FastifyRequest<{ Params: { symbol: string } }>, reply: FastifyReply) => {
    const { symbol } = request.params;

    // Bloqueio server-side: FREE só acessa BTCUSDT
    if (request.tier === "FREE") {
      const limits = await getFreeTierLimits();
      if (!(limits.allowedSymbols as readonly string[]).includes(symbol.toUpperCase())) {
        return reply.status(403).send({
          error: "Este ativo está disponível apenas no plano Premium.",
          upgradeRequired: true,
        });
      }
    }

    try {
      const limit = request.tier === "FREE" ? 10 : 50;
      const history = await MarketSignalService.getHistory(symbol, limit);
      
      // Transformar BigInt para String para o JSON
      const serializedHistory = history.map(h => ({
        ...h,
        id: h.id.toString(),
      }));

      return {
        history: serializedHistory,
        tier: request.tier,
        ...(request.tier === "FREE" ? { limitApplied: 10 } : {}),
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Erro ao carregar histórico de sinais" });
    }
  });

  /**
   * POST /api/signals/analyze
   * Força uma análise de um símbolo específico.
   *
   * Controle Freemium:
   * - FREE: apenas BTCUSDT com timeframe 1d
   * - PREMIUM/ADMIN: qualquer símbolo e timeframe
   */
  fastify.post("/analyze", async (request: FastifyRequest<{ Body: { symbol: string, timeframe: string } }>, reply: FastifyReply) => {
    const { symbol, timeframe } = request.body;

    if (request.tier === "FREE") {
      const limits = await getFreeTierLimits();
      if (!(limits.allowedSymbols as readonly string[]).includes(symbol.toUpperCase())) {
        return reply.status(403).send({
          error: "Este ativo está disponível apenas no plano Premium.",
          upgradeRequired: true,
        });
      }
      if (!(limits.allowedTimeframes as readonly string[]).includes(timeframe)) {
        return reply.status(403).send({
          error: `O timeframe "${timeframe}" está disponível apenas no plano Premium.`,
          upgradeRequired: true,
        });
      }
    }

    try {
      const result = await MarketSignalService.calculateSignal(symbol, timeframe);
      return result;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Erro ao analisar símbolo" });
    }
  });
}
