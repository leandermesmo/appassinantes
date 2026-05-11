import { prisma } from "../database/prisma.client";
import { UserFavorite, Cryptocurrency } from "@prisma/client";

export class FavoriteRepository {
  /**
   * Retorna os favoritos de um usuário, com os dados da criptomoeda
   */
  static async getUserFavorites(userId: string): Promise<(UserFavorite & { crypto: Cryptocurrency })[]> {
    return prisma.userFavorite.findMany({
      where: { userId },
      include: {
        crypto: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  /**
   * Adiciona um novo ativo aos favoritos
   */
  static async addFavorite(userId: string, cryptoId: number): Promise<UserFavorite> {
    return prisma.userFavorite.create({
      data: {
        userId,
        cryptoId,
      },
    });
  }

  /**
   * Remove um ativo dos favoritos do usuário
   */
  static async removeFavorite(userId: string, cryptoId: number): Promise<void> {
    await prisma.userFavorite.delete({
      where: {
        idx_user_crypto_unique: {
          userId,
          cryptoId,
        },
      },
    });
  }

  /**
   * Conta quantos favoritos o usuário já tem
   */
  static async countFavorites(userId: string): Promise<number> {
    return prisma.userFavorite.count({
      where: { userId },
    });
  }
}
