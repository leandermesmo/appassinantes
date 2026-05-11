import "dotenv/config";
import { prisma } from "../src/infrastructure/database/prisma.client";
import { UserRole } from "@prisma/client";

/**
 * Seed para configurar o administrador inicial da plataforma.
 * Este é o ÚNICO mecanismo para promover usuários a ADMIN.
 * A promoção via painel admin foi intencionalmente desabilitada por segurança.
 */
const ADMIN_EMAIL = "leandermesmo@gmail.com";

async function main() {
  console.log(`🔑 Promovendo ${ADMIN_EMAIL} para ADMIN...`);

  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, name: true, role: true },
  });

  if (!user) {
    console.error(`❌ Usuário com email ${ADMIN_EMAIL} não encontrado no banco.`);
    console.log("   Certifique-se de que o usuário já fez login via Google OAuth.");
    process.exit(1);
  }

  if (user.role === UserRole.ADMIN) {
    console.log(`✅ ${user.name || ADMIN_EMAIL} já é ADMIN. Nenhuma alteração necessária.`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: UserRole.ADMIN },
  });

  console.log(`✅ ${user.name || ADMIN_EMAIL} promovido para ADMIN com sucesso!`);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
