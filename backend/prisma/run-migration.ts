/**
 * Script para executar a migration das tabelas candles e indicators.
 * Usa Prisma $executeRawUnsafe para criar as tabelas diretamente.
 *
 * Executar: npx tsx prisma/run-migration.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function parseDbUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '3306', 10),
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace('/', ''),
    connectionLimit: 5,
  };
}

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL não definida');

  const adapter = new PrismaMariaDb(parseDbUrl(dbUrl));
  const prisma = new PrismaClient({ adapter });

  console.log('🔄 Criando tabela candles...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS candles (
      id BIGINT NOT NULL AUTO_INCREMENT,
      symbol VARCHAR(20) NOT NULL,
      timeframe ENUM('15m','1h','4h','1d','1w','1M') NOT NULL,
      open_time BIGINT NOT NULL,
      close_time BIGINT NOT NULL,
      \`open\` DECIMAL(18,8) NOT NULL,
      high DECIMAL(18,8) NOT NULL,
      low DECIMAL(18,8) NOT NULL,
      \`close\` DECIMAL(18,8) NOT NULL,
      volume DECIMAL(20,8) NOT NULL,
      quote_asset_volume DECIMAL(20,8) NOT NULL,
      number_of_trades INT NOT NULL DEFAULT 0,
      taker_buy_base_asset_volume DECIMAL(20,8) NOT NULL DEFAULT 0,
      taker_buy_quote_asset_volume DECIMAL(20,8) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_candle (symbol, timeframe, open_time),
      INDEX idx_candle_lookup (symbol, timeframe, open_time DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Tabela candles criada');

  console.log('🔄 Criando tabela indicators...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS indicators (
      id BIGINT NOT NULL AUTO_INCREMENT,
      symbol VARCHAR(20) NOT NULL,
      timeframe ENUM('15m','1h','4h','1d','1w','1M') NOT NULL,
      open_time BIGINT NOT NULL,
      rsi_k DECIMAL(10,5) DEFAULT NULL,
      rsi_d DECIMAL(10,5) DEFAULT NULL,
      rsi DECIMAL(10,5) DEFAULT NULL,
      rsi_ma DECIMAL(10,5) DEFAULT NULL,
      macd DECIMAL(18,8) DEFAULT NULL,
      macd_signal DECIMAL(18,8) DEFAULT NULL,
      ema1 DECIMAL(18,8) DEFAULT NULL,
      ema2 DECIMAL(18,8) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_indicator (symbol, timeframe, open_time),
      INDEX idx_indicator_lookup (symbol, timeframe, open_time DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Tabela indicators criada');

  console.log('🎉 Migration concluída com sucesso!');
  process.exit(0);
}

runMigration().catch((error) => {
  console.error('❌ Erro na migration:', error);
  process.exit(1);
});
