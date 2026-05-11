import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

/**
 * Parseia a DATABASE_URL do formato mysql://user:pass@host:port/dbname
 * e retorna os parâmetros para o adapter mariadb do Prisma 7.
 */
function parseDbUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "3306", 10),
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace("/", ""),
    connectionLimit: 10,
  };
}

// Singleton do PrismaClient — evita múltiplas conexões no hot-reload do dev.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL não definida nas variáveis de ambiente.");
  }

  const adapter = new PrismaMariaDb(parseDbUrl(dbUrl));

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

