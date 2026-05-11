import { User, UserStatus } from "@prisma/client";
import { prisma } from "../database/prisma.client";

type SafeUser = Omit<User, "passwordHash">;

/**
 * Repositório de Usuário.
 * 
 * Limpo para focar apenas em operações necessárias para o sistema via OAuth.
 * A criação de usuários agora ocorre via NextAuth Prisma Adapter.
 */
export class UserRepository {
  /**
   * Busca um usuário pelo ID sem expor campos sensíveis.
   */
  static async findById(id: string): Promise<SafeUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user as SafeUser | null;
  }

  /**
   * Atualiza o status do usuário (ex: suspender por inadimplência).
   */
  static async updateStatus(id: string, status: UserStatus): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Busca usuário por e-mail (útil para verificações administrativas).
   */
  static async findByEmail(email: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    }) as Promise<SafeUser | null>;
  }
}
