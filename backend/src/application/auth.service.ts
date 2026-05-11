/**
 * Serviço de Autenticação — Limpo.
 * 
 * O sistema agora utiliza exclusivamente Google OAuth via NextAuth no frontend.
 * O controle de sessões e geração de tokens de API é gerenciado pelo NextAuth,
 * e a validação é feita via middleware usando o AUTH_SECRET compartilhado.
 * 
 * Os métodos legados de registro e login com senha foram removidos.
 */
export class AuthService {
  // Atualmente não há necessidade de métodos server-side para OAuth puro,
  // já que o NextAuth lida com o fluxo e o Prisma Adapter com a persistência.
}
