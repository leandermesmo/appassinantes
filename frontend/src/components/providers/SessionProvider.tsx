"use client"

import { SessionProvider } from "next-auth/react"

/**
 * Wrapper client-side para o SessionProvider do NextAuth.
 * Necessário porque o RootLayout é um Server Component e não pode
 * renderizar diretamente componentes client que usam Context (como SessionProvider).
 *
 * Isso permite que qualquer componente filho use useSession() e getSession().
 */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
