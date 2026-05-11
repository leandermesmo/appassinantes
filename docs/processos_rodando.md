Realizei uma auditoria profunda no backend e identifiquei dois motores de execução automática que operam de forma independente das requisições dos usuários. O sistema possui uma arquitetura de "Heavy Background Processing" que mantém o banco de dados e o cache sempre quentes.

### 1. Processos Automáticos Ativos

O sistema possui dois orquestradores principais:

*   **Ingestion Runner (`ingestion-runner.ts`)**: Um processo separado da API que utiliza `node-cron` para sincronizar dados históricos e consolidar candles no MySQL.
*   **Realtime Feed (`RealtimeFeedService`)**: Executado dentro do processo da API Fastify, utiliza múltiplos `setInterval` para projetar indicadores em tempo real no cache (Redis/Memory).

### 2. Tabela de Frequência e Impacto

| Processo | Onde está | Frequência | Impacto Estimado |
| :--- | :--- | :--- | :--- |
| **Realtime Polling** | `realtime-feed.service.ts` | Cada 10s a 60s (por TF) | **Alto**: Polling constante na Binance para todos os símbolos ativos. |
| **Indicator Ingestion** | `scheduler.ts` | Cron (15m, 1h, 4h, 1d...) | **Médio/Alto**: Recalcula 1000 candles p/ símbolo a cada fechamento. |
| **Startup Refresh** | `scheduler.ts` e `realtime-feed.ts` | No boot do servidor | **Crítico**: Pico de CPU/DB ao processar todos os TFs simultaneamente. |

### 3. Mapa Geral de Execução

*   **Constante (Polling)**: `RealtimeFeedService` busca o candle atual (em formação) da Binance e projeta RSI/MACD/EMAs em memória a cada 10~60 segundos.
*   **Por Evento (Cron)**: `Scheduler` enfileira tarefas de ingestão assim que um candle oficial fecha (ex: a cada 15 min).
*   **Sob Demanda**: Apenas a leitura dos resultados via endpoints `/api/market/...`.

### 4. Problemas Críticos Identificados

1.  **Recálculo de Janela Completa**: O `IndicatorService` recalcula uma janela de **1000 candles** toda vez que 1 novo candle é inserido, gerando carga redundante no banco e CPU.
2.  **Falta de Presence Check**: O sistema processa todos os símbolos "Ativos" 24/7, mesmo que não haja nenhum usuário logado na plataforma ou visualizando aquele ativo específico.
3.  **Startup Bomb**: Ambos os serviços disparam atualizações massivas de todos os timeframes no startup, o que pode causar bloqueio no banco de dados em produção.

### 5. Plano de Otimização

*   **PresenceService**: Implementar um rastreador de usuários ativos. Se um símbolo/timeframe não for visualizado por ninguém nos últimos 5 min, pausar o `RealtimeFeed` para ele.
*   **Incremental Indicators**: Alterar o `IndicatorService` para usar estados anteriores (memoization) em vez de recalcular 1000 linhas a cada tick.
*   **Staggered Startup**: Adicionar delays progressivos (jitter) na inicialização para diluir a carga de boot.
*   **On-Demand Ingestion**: Transformar os timeframes maiores (1w, 1M) em processos disparados apenas quando solicitados, já que mudam raramente.