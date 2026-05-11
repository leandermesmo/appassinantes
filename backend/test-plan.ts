import { prisma } from './src/infrastructure/database/prisma.client';

async function test() {
  try {
    const plan = await prisma.plan.create({
      data: {
        name: "Test Plan " + Date.now(),
        price: "99.90",
        features: { test: true },
        billingCycle: "MONTHLY"
      }
    });
    console.log("Success:", plan.id);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
