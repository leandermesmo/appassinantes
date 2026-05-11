import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

async function testSearch() {
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

  const search = 'ativo';
  const s = search.toLowerCase().trim();
  
  const orConditions: any[] = [
    { symbol: { contains: search } },
    { name: { contains: search } },
  ];

  if ("ativo".includes(s) && s.length >= 3) {
    orConditions.push({ isActive: true });
  } 
  
  if ("inativo".includes(s) && s.length >= 3) {
    orConditions.push({ isActive: false });
  }

  console.log('Condições OR:', JSON.stringify(orConditions, null, 2));

  const results = await prisma.cryptocurrency.findMany({
    where: {
      OR: orConditions
    },
    take: 5
  });

  console.log('Resultados encontrados:', results.length);
  results.forEach(r => console.log(`- ${r.symbol} (Active: ${r.isActive})`));

  process.exit(0);
}

testSearch().catch(e => { console.error(e); process.exit(1); });
