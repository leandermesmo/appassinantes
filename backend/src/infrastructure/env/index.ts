import 'dotenv/config';
import { z } from 'zod';

/**
 * Esquema de validação das variáveis de ambiente.
 * Garante que a aplicação não inicie sem as configurações básicas necessárias.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default('*'),
  BINANCE_API_URL: z.string().url().optional(),
  // Shared secret com o NextAuth do frontend para validar API Access Tokens
  // Este é o único segredo necessário para a autenticação atual via OAuth.
  AUTH_SECRET: z.string().min(10),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Variáveis de ambiente inválidas:', _env.error.format());
  throw new Error('Variáveis de ambiente inválidas.');
}

export const env = _env.data;
