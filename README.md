# AppCrypto - Plataforma SaaS de Análise de Criptomoedas

Este é o projeto base para a plataforma de análise técnica de criptomoedas, preparado para análise externa.

## 🚀 Como Rodar o Projeto

### 1. Pré-requisitos
- Node.js (v18 ou superior)
- MySQL rodando localmente ou via Docker

### 2. Instalação de Dependências
Na raiz do projeto, execute:
```bash
npm run install:all
```

### 3. Configuração de Variáveis de Ambiente
- Renomeie `backend/.env.example` para `backend/.env` e configure sua URL do banco de dados.
- Renomeie `frontend/.env.example` para `frontend/.env.local` e configure as chaves necessárias.

### 4. Banco de Dados
Para rodar as migrations e configurar o schema do banco:
```bash
npm run db:migrate
```

### 5. Execução em Desenvolvimento
Para rodar backend e frontend simultaneamente:
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:3000` e o backend em `http://localhost:3333`.

## 📁 Estrutura do Projeto
- `backend/`: API REST em Node.js com Prisma ORM.
- `frontend/`: Aplicação Next.js com Tailwind CSS.
- `package.json`: Scripts de automação para o projeto completo.
