# 🛠️ Backoffice Administrativo

## 🎯 Objetivo
Gerenciar usuários, planos e configurações do sistema.

## 🔁 Fluxo
1. Admin autentica com role ADMIN
2. Ajusta configurações via API
3. Pode disparar sync manual

## 📂 Arquivos envolvidos
- /backend/src/api/routes/admin.routes.ts
- /backend/src/application/admin.service.ts

## 🧠 Regras de negócio
- Apenas ADMIN pode acessar
- Alterações afetam sistema em tempo real

## ⚠️ Pontos críticos
- Falta de auditoria pode gerar riscos

## 🧪 Como testar
Alterar limite FREE e validar impacto imediato