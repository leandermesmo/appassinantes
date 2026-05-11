import { FavoriteRepository } from "../../infrastructure/repositories/favorite.repository";
import { CryptocurrencyRepository } from "../../infrastructure/repositories/cryptocurrency.repository";
import { AppError } from "../../shared/errors/AppError";

export class FavoriteService {
  /**
   * Obtém a lista de favoritos do usuário
   */
  static async getUserFavorites(userId: string) {
    const favorites = await FavoriteRepository.getUserFavorites(userId);
    return favorites.map((fav) => fav.crypto.symbol);
  }

  /**
   * Adiciona um ativo aos favoritos do usuário
   * Valida se a moeda existe e não aplica limites (limite será no plano ou frontend)
   */
  static async addFavorite(userId: string, symbol: string) {
    const crypto = await CryptocurrencyRepository.findBySymbol(symbol);

    if (!crypto) {
      throw new AppError("Ativo não encontrado.", 404);
    }

    if (!crypto.isActive) {
      throw new AppError("Ativo inativo.", 400);
    }

    try {
      await FavoriteRepository.addFavorite(userId, crypto.id);
      return true;
    } catch (error: any) {
      // Ignora erro de chave única (já é favorito)
      if (error.code === "P2002") {
        return true;
      }
      throw error;
    }
  }

  /**
   * Remove um ativo dos favoritos do usuário
   */
  static async removeFavorite(userId: string, symbol: string) {
    const crypto = await CryptocurrencyRepository.findBySymbol(symbol);

    if (!crypto) {
      throw new AppError("Ativo não encontrado.", 404);
    }

    try {
      await FavoriteRepository.removeFavorite(userId, crypto.id);
      return true;
    } catch (error: any) {
      // Ignora se não encontrar para deletar
      if (error.code === "P2025") {
        return true;
      }
      throw error;
    }
  }
}
