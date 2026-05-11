# 💰 SaaS Engine (Assinaturas + Freemium)

## 🎯 Objetivo
Gerenciar monetização e controle de acesso por plano.

## 🔁 Fluxo
1. AuthMiddleware valida JWT
2. FreemiumMiddleware aplica restrições
3. SubscriptionService gerencia planos

## 📂 Arquivos envolvidos
- /backend/src/api/middlewares/freemium.middleware.ts
- /backend/src/api/routes/subscription.routes.ts
- /backend/src/application/subscription.service.ts

## 🧠 Regras de negócio
- FREE: BTCUSDT, timeframe 1d, limite 20 registros
- Bloqueio automático em inadimplência

## ⚠️ Pontos críticos
- Lógica de bloqueio espalhada pode gerar inconsistência

## 🧪 Como testar
Acessar endpoint premium com usuário FREE → esperar 403