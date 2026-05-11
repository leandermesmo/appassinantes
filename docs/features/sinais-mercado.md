# 📡 Sistema de Sinais de Mercado

## 🎯 Objetivo
Gerar sinais de compra/venda baseados em indicadores.

## 🔁 Fluxo
1. Backend analisa tendência via RSI/Stoch
2. Define sinal (Compra/Venda/Neutro)
3. Frontend exibe resultado

## 📂 Arquivos envolvidos
- /backend/src/api/routes/signal.routes.ts
- /backend/src/application/controllers/market-signal.controller.ts

## 🧠 Regras de negócio
- Confluência de indicadores define sinal

## ⚠️ Pontos críticos
- Sensível a falsos positivos sem filtro adicional

## 🧪 Como testar
Validar retorno da rota /api/signals/market