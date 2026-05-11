import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import { SignJWT } from "jose"

/**
 * Gera um API Access Token (JWT HS256) assinado com AUTH_SECRET.
 * Este token é enviado pelo frontend ao backend Fastify via header Authorization.
 * Usa `jose` porque é compatível com Edge Runtime (onde o middleware do Next.js executa).
 *
 * Inclui subscriptionStatus para que o backend classifique o tier
 * sem precisar consultar o banco em cada request.
 */
async function generateApiAccessToken(
  userId: string,
  role: string,
  subscriptionStatus: string
): Promise<{ token: string; exp: number }> {
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
  const expiresInSeconds = 3600 // 1 hora
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds

  const token = await new SignJWT({ role, subscriptionStatus })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(exp)
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret)

  return { token, exp }
}

/**
 * Consulta o status da assinatura do usuário via banco de dados.
 * Executado em ambiente Node.js (callbacks do NextAuth), não Edge.
 *
 * Importação dinâmica do Prisma para evitar bundling no Edge Runtime.
 */
async function getSubscriptionStatus(userId: string): Promise<string> {
  try {
    const { prisma } = await import("@/lib/prisma")
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        currentPeriodEnd: { gte: new Date() },
      },
      select: { status: true },
      orderBy: { currentPeriodEnd: "desc" },
    })
    return subscription ? "active" : "none"
  } catch {
    // Se falhar a consulta, assume sem assinatura (seguro)
    return "none"
  }
}

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }: { token: any; user?: any; trigger?: any }) {
      // Na primeira autenticação (sign-in), persistir role e userId no token NextAuth
      if (user) {
        token.role = user.role || "USER"
      }

      // Consultar status da assinatura:
      // 1. No sign-in (user presente)
      // 2. Quando o token está sendo renovado (trigger === "update")
      // 3. Quando o apiAccessToken precisa ser regenerado
      const now = Math.floor(Date.now() / 1000)
      const needsRefresh = !token.apiAccessToken || !token.apiAccessTokenExp || (token.apiAccessTokenExp - now < 300)

      if (token.sub && (user || trigger === "update" || needsRefresh)) {
        token.subscriptionStatus = await getSubscriptionStatus(token.sub)
      }

      if (needsRefresh && token.sub) {
        const { token: apiToken, exp } = await generateApiAccessToken(
          token.sub,
          (token.role as string) || "USER",
          (token.subscriptionStatus as string) || "none"
        )
        token.apiAccessToken = apiToken
        token.apiAccessTokenExp = exp
      }

      return token
    },

    async session({ session, token }: { session: any; token: any }) {
      if (session.user && token) {
        session.user.id = token.sub!
        session.user.role = (token.role as string) || "USER"
        session.user.subscriptionStatus = (token.subscriptionStatus as string) || "none"
        session.apiAccessToken = token.apiAccessToken as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig
