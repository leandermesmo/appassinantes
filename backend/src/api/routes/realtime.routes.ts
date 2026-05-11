import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ensureAuthenticated } from '../middlewares/auth.middleware';
import { setUserTier, isSymbolAllowedForFree, isTimeframeAllowedForFree, getFreeTierLimits } from '../middlewares/freemium.middleware';
import { AppError } from '../../shared/errors/AppError';
import { CandleRepository } from '../../infrastructure/repositories/candle.repository';

/**
 * Rotas de tempo real (Refatorado)
 * Agora retorna apenas o último candle fechado para reduzir carga de CPU.
 */
export async function realtimeRoutes(app: FastifyInstance) {
  app.get(
    '/market/realtime',
    { preHandler: [ensureAuthenticated, setUserTier] },
    async (request, reply) => {
      const querySchema = z.object({
        symbol: z.string().min(1).toUpperCase(),
        timeframe: z.enum(['15m', '1h', '4h', '1d', '1w', '1M']),
      });

      try {
        const { symbol, timeframe } = querySchema.parse(request.query);

        // Bloqueio server-side: FREE só acessa símbolos permitidos
        if (request.tier === 'FREE' && !(await isSymbolAllowedForFree(symbol))) {
          return reply.status(403).send({
            success: false,
            message: 'Este ativo está disponível apenas no plano Premium.',
            upgradeRequired: true,
            allowedSymbols: (await getFreeTierLimits()).allowedSymbols,
          });
        }

        // Bloqueio server-side: FREE só acessa timeframes permitidos
        if (request.tier === 'FREE' && !(await isTimeframeAllowedForFree(timeframe))) {
          return reply.status(403).send({
            success: false,
            message: `O timeframe "${timeframe}" está disponível apenas no plano Premium.`,
            upgradeRequired: true,
            allowedTimeframes: (await getFreeTierLimits()).allowedTimeframes,
          });
        }

        // Busca o último candle fechado e seus indicadores do banco de dados
        const history = await CandleRepository.getHistoryWithIndicators(symbol, timeframe, 1);
        
        if (!history || history.length === 0) {
          return reply.status(404).send({
            success: false,
            message: `Dados não encontrados para ${symbol} (${timeframe}). Aguarde a próxima ingestão.`,
          });
        }

        const latest = history[0];

        // Mapeia para a estrutura esperada pelo frontend (compatibilidade)
        const result = {
          symbol,
          timeframe,
          candle: {
            open: latest.open,
            high: latest.high,
            low: latest.low,
            close: latest.close,
            volume: latest.volume,
            openTime: latest.open_time,
          },
          indicators: {
            rsi: latest.rsi,
            rsiMa: latest.rsi_ma,
            stochK: latest.rsi_k,
            stochD: latest.rsi_d,
            ema1: latest.ema1,
            ema2: latest.ema2,
            macd: latest.macd,
            macdSignal: latest.macd_signal,
          },
          source: {
            closedData: true,
            realtimeProjection: false,
          },
          timestamp: Date.now(),
        };

        return reply.status(200).send({
          success: true,
          tier: request.tier,
          data: result,
        });
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw error;
      }
    }
  );
}
