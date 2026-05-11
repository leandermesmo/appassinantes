import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

/**
 * Middleware de proteção de rotas do Next.js.
 * Usa o NextAuth para verificar sessão e redirecionar conforme necessário.
 *
 * - Rotas públicas: acessíveis sem login
 * - Rotas protegidas: redirecionam para /login se não autenticado
 * - Rota de login: redireciona para /dashboard se já autenticado
 */
export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { nextUrl } = req

  const isPublicRoute = ["/", "/login", "/planos", "/blog"].includes(nextUrl.pathname)
  const isAuthRoute = nextUrl.pathname === "/login"
  const isProtectedRoute = ["/dashboard", "/ativos", "/sinais", "/favoritos", "/perfil"].some(route =>
    nextUrl.pathname.startsWith(route)
  )
  const isAdminRoute = nextUrl.pathname.startsWith("/admin")

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
    return NextResponse.next()
  }

  // Verifica rotas admin (Requer estar logado E ter role ADMIN)
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl))
    }
    // O NextAuth injeta 'req.auth.user.role' graças ao session callback no auth.config.ts
    // @ts-ignore - TS não sabe que role existe no req.auth.user nativamente
    if (req.auth?.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
  }

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
