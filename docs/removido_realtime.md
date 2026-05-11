Realizei a remoção completa e controlada de toda a lógica de processamento em tempo real (projeções e polling contínuo), mantendo a integridade do pipeline de ingestão e a compatibilidade com o frontend.

1. Lista de Remocões
RealtimeFeedService: Removido o serviço que realizava polling contínuo da Binance a cada 10-60 segundos.
RealtimeEngineService: Eliminada a engine de cálculo incremental que projetava indicadores em candles abertos.
MarketReadRepository: Removido o repositório órfão que servia apenas à engine de realtime.
Loops setInterval: Todos os timers de segundo plano da API foram eliminados.
2. Arquivos Afetados
Modificados:
src/server.ts: Limpeza do bootstrap e graceful shutdown.
src/api/routes/realtime.routes.ts: Refatorado para retornar dados estáticos.
Deletados:
src/application/services/realtime-feed.service.ts
src/application/services/realtime-engine.service.ts
src/infrastructure/repositories/market-read.repository.ts
3. Código Antes/Depois (Exemplo de Rota)
ANTES (Realtime Projection):

typescript
// Dependia de loop em background e cache volátil
const result = await RealtimeEngineService.getResult(symbol, timeframe);
// Retornava projeção de candle aberto
DEPOIS (Database Driven):

typescript
// Consulta direta ao banco de dados consolidado
const history = await CandleRepository.getHistoryWithIndicators(symbol, timeframe, 1);
const latest = history[0];
// Retorna o último candle fechado oficial
4. Garantia de Integridade da Ingestão
O arquivo ingestion-runner.ts e o Scheduler baseado em node-cron permanecem intocados.
A sincronização incremental e o cálculo de indicadores oficiais continuam funcionando normalmente nos intervalos de fechamento de candle.
O banco de dados continua sendo a fonte única de verdade (SSOT).
5. Impacto de Performance
CPU: Redução drástica, eliminando o recálculo manual de indicadores a cada tick de mercado.
Memória: Economia significativa ao remover o armazenamento de estados intermediários de todos os pares/timeframes.
Rede: Redução de chamadas externas à API da Binance, eliminando riscos de Rate Limit por polling.