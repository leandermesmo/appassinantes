import "dotenv/config";
import { SubscriptionService } from "../src/application/subscription.service";
import { UserRepository } from "../src/infrastructure/repositories/user.repository";
import { prisma } from "../src/infrastructure/database/prisma.client";

async function test() {
  console.log("🧪 Iniciando teste de assinaturas...");

  // 1. Criar um usuário de teste
  const email = `test-${Date.now()}@example.com`;
  console.log(`👤 Criando usuário: ${email}`);
  const user = await UserRepository.create({
    name: "Usuário Teste",
    email,
    passwordHash: "dummy-hash",
  });

  // 2. Tentar verificar assinatura (deve falhar)
  console.log("🔍 Verificando assinatura inicial (esperado falha)...");
  try {
    await SubscriptionService.checkActiveSubscription(user.id);
    console.error("❌ Erro: Assinatura deveria estar inativa.");
  } catch (e) {
    console.log("✅ Sucesso: Assinatura inativa detectada.");
  }

  // 3. Criar uma assinatura (Plano 1 - Mensal)
  console.log("💳 Criando assinatura no Plano 1...");
  const sub = await SubscriptionService.subscribe(user.id, 1);
  console.log(`✅ Assinatura criada! Expira em: ${sub.currentPeriodEnd}`);

  // 4. Verificar novamente (deve passar)
  console.log("🔍 Verificando assinatura após pagamento...");
  const activeSub = await SubscriptionService.checkActiveSubscription(user.id);
  console.log(`✅ Sucesso! Plano: ${activeSub.plan.name}`);
  console.log(`🎁 Features: ${JSON.stringify(activeSub.plan.features)}`);

  // 5. Testar expiração (Simulação)
  console.log("⏰ Simulando expiração...");
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { currentPeriodEnd: new Date(Date.now() - 1000) } // Expirou há 1 segundo
  });

  console.log("🔍 Verificando assinatura expirada (deve falhar)...");
  try {
    await SubscriptionService.checkActiveSubscription(user.id);
    console.error("❌ Erro: Assinatura expirada permitiu acesso.");
  } catch (e) {
    console.log("✅ Sucesso: Assinatura expirada bloqueada corretamente.");
  }

  // Limpeza (opcional)
  // await prisma.user.delete({ where: { id: user.id } });

  console.log("🏁 Todos os testes passaram!");
}

test()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
