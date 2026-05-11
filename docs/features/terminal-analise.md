# 📊 Terminal de Análise (Dashboard + Favoritos)

## 🎯 Objetivo
Interface de visualização de dados técnicos e personalização do usuário.

## 🔁 Fluxo
1. Front consome /api/market/dashboard/:symbol
2. Favoritos via /api/favorites
3. WebSocket atualiza preço em tempo real

## 📂 Arquivos envolvidos
- /backend/src/api/routes/market.routes.ts
- /backend/src/api/routes/favorite.routes.ts
- /frontend/src/app/(dashboard)/dashboard/page.tsx

## ⚠️ Pontos críticos
- Sobrecarga de requests em timeframes curtos

## 🧪 Como testar
Favoritar ativo e validar persistência + carregamento no dashboard