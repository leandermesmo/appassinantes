# ⚙️ Pipeline de Inteligência (Dados + Indicadores)

## 🎯 Objetivo
Transformar dados brutos da Binance em indicadores técnicos persistidos (RSI, MACD, etc.).

## 🔁 Fluxo
1. Scheduler dispara sincronização a cada 15min
2. IngestionService busca candles faltantes
3. IndicatorService recalcula janela de 1000 candles
4. Dados são salvos via bulkUpsert

## 📂 Arquivos envolvidos
- /backend/src/ingestion/ingestion.service.ts
- /backend/src/ingestion/indicator.service.ts
- /backend/src/infrastructure/repositories/candle.repository.ts

## 🧠 Regras de negócio
- Recalcular janela histórica para evitar erro de convergência
- Persistir apenas candles fechados

## ⚠️ Pontos críticos
- Alto custo computacional no recálculo
- Possível gargalo em escrita no banco

## 🧪 Como testar
Verificar logs após 15min e validar inserções na tabela `indicators`