import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

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

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL not set");

const adapter = new PrismaMariaDb(parseDbUrl(dbUrl));
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users in DB:", JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
