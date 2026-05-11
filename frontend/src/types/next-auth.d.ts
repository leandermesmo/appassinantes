import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

/**
 * Extensão dos tipos do NextAuth para incluir campos customizados
 * usados na ponte de autenticação entre NextAuth (frontend) e Fastify (backend).
 *
 * - apiAccessToken: JWT HS256 assinado com AUTH_SECRET, enviado ao backend via Axios
 * - role: papel do usuário no sistema (USER | ADMIN)
 * - subscriptionStatus: status da assinatura (active | none | past_due)
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    /** JWT assinado para autenticação com a API Fastify */
    apiAccessToken?: string
    user: {
      id: string
      role: string
      /** Status da assinatura do usuário */
      subscriptionStatus: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    /** Papel do usuário (USER | ADMIN) */
    role?: string
    /** Status da assinatura (active | none | past_due) */
    subscriptionStatus?: string
    /** JWT de acesso à API backend (HS256, assinado com AUTH_SECRET) */
    apiAccessToken?: string
    /** Timestamp de expiração do apiAccessToken (epoch seconds) */
    apiAccessTokenExp?: number
  }
}
