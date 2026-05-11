import { RefreshToken } from '@prisma/client';
import { prisma } from '../database/prisma.client';

export class RefreshTokenRepository {
  /**
   * Cria um novo refresh token no banco de dados.
   */
  static async create(data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data,
    });
  }

  /**
   * Busca um refresh token e inclui os dados do usuário.
   */
  static async findByToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  /**
   * Remove todos os refresh tokens de um usuário (Revoga todas as sessões).
   */
  static async deleteAllByUserId(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Remove um refresh token específico (Logout de uma sessão).
   */
  static async deleteByToken(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  /**
   * Remove tokens expirados do banco.
   */
  static async deleteExpired(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}
