import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port || '3306'),
  user: url.username,
  password: url.password,
  database: url.pathname.replace('/', ''),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log('\n=== CANDLES POR SYMBOL/TIMEFRAME ===');
  const candles = await prisma.$queryRawUnsafe<any[]>(
    'SELECT symbol, timeframe, COUNT(*) as total FROM candles GROUP BY symbol, timeframe ORDER BY symbol LIMIT 20'
  );
  console.table(candles);

  console.log('\n=== INDICATORS POR SYMBOL/TIMEFRAME ===');
  const indicators = await prisma.$queryRawUnsafe<any[]>(
    'SELECT symbol, timeframe, COUNT(*) as total FROM indicators GROUP BY symbol, timeframe ORDER BY symbol LIMIT 20'
  );
  console.table(indicators);

  console.log('\n=== BTCUSDT ÚLTIMOS INDICADORES ===');
  const btc = await prisma.$queryRawUnsafe<any[]>(
    'SELECT symbol, open_time, rsi, rsi_k, rsi_d, macd, ema1, ema2 FROM indicators WHERE symbol = ? ORDER BY open_time DESC LIMIT 5',
    'BTCUSDT'
  );
  console.table(btc);

  console.log('\n=== TOTAIS ===');
  const totalCandles = await prisma.$queryRawUnsafe<any[]>('SELECT COUNT(*) as total FROM candles');
  const totalIndicators = await prisma.$queryRawUnsafe<any[]>('SELECT COUNT(*) as total FROM indicators');
  console.log(`Total candles: ${totalCandles[0].total}`);
  console.log(`Total indicators: ${totalIndicators[0].total}`);

  process.exit(0);
}

verify().catch((e) => { console.error(e); process.exit(1); });
