import { AdminAction, UserRole, UserStatus, SubscriptionStatus } from "@prisma/client";
import { AdminRepository } from "../infrastructure/repositories/admin.repository";
import { IngestionService } from "../ingestion/ingestion.service";
import { IndicatorService } from "../ingestion/indicator.service";
import { FreemiumConfigRepository, FreemiumLimits } from "../infrastructure/repositories/freemium-config.repository";
import { PlanRepository } from "../infrastructure/repositories/plan.repository";
import { BinanceService } from "../infrastructure/external/binance.service";
import { AppError } from "../shared/errors/AppError";

/**
 * Serviço de Administração — Camada de lógica de negócio.
 *
 * Centraliza validações, regras de negócio e auditoria
 * para todas as operações administrativas da plataforma.
 */
export class AdminService {
  // ─────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────

  /**
   * Retorna métricas agregadas para o dashboard administrativo.
   */
  static async getDashboardMetrics() {
    return AdminRepository.getDashboardMetrics();
  }

  // ─────────────────────────────────────────────
  // USUÁRIOS
  // ─────────────────────────────────────────────

  /**
   * Lista usuários com paginação, busca e filtros.
   */
  static async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));

    const role = params.role && params.role !== "ALL"
      ? (params.role as UserRole)
      : undefined;

    const status = params.status && params.status !== "ALL"
      ? (params.status as UserStatus)
      : undefined;

    return AdminRepository.listUsers({
      page,
      limit,
      search: params.search?.trim(),
      role,
      status,
    });
  }

  /**
   * Retorna dados completos de um usuário específico.
   */
  static async getUserDetail(userId: string) {
    const user = await AdminRepository.getUserDetail(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    return user;
  }

  /**
   * Altera o status de um usuário (bloquear/desbloquear).
   * Registra a ação no log de auditoria.
   */
  static async changeUserStatus(
    adminId: string,
    targetUserId: string,
    newStatus: UserStatus,
    ipAddress: string | null
  ) {
    const target = await AdminRepository.getUserDetail(targetUserId);

    if (!target) {
      throw new AppError("Usuário alvo não encontrado.", 404);
    }

    // Impedir que o admin bloqueie a si mesmo
    if (adminId === targetUserId) {
      throw new AppError("Não é possível alterar seu próprio status.", 400);
    }

    // Impedir que um admin bloqueie outro admin
    if (target.role === UserRole.ADMIN) {
      throw new AppError("Não é possível alterar o status de outro administrador.", 403);
    }

    const oldStatus = target.status;
    const updated = await AdminRepository.updateUserStatus(targetUserId, newStatus);

    // Registra a ação de auditoria
    await AdminRepository.logAction(
      adminId,
      AdminAction.STATUS_CHANGE,
      targetUserId,
      { from: oldStatus, to: newStatus },
      ipAddress
    );

    return updated;
  }

  // ─────────────────────────────────────────────
  // ASSINATURAS
  // ─────────────────────────────────────────────

  /**
   * Lista assinaturas com paginação e filtro por status.
   */
  static async listSubscriptions(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));

    const status = params.status && params.status !== "ALL"
      ? (params.status as SubscriptionStatus)
      : undefined;

    return AdminRepository.listSubscriptions({ page, limit, status });
  }

  /**
   * Atualiza uma assinatura existente (status e/ou plano).
   * Registra a ação no log de auditoria.
   */
  static async updateSubscription(
    adminId: string,
    subscriptionId: string,
    data: { status?: SubscriptionStatus; planId?: number },
    ipAddress: string | null
  ) {
    const subscription = await AdminRepository.findSubscriptionById(subscriptionId);

    if (!subscription) {
      throw new AppError("Assinatura não encontrada.", 404);
    }

    // Validar plano se está sendo alterado
    if (data.planId) {
      const plan = await PlanRepository.findById(data.planId);
      if (!plan || !plan.isActive) {
        throw new AppError("Plano não encontrado ou inativo.", 404);
      }
    }

    const updateData: { status?: SubscriptionStatus; planId?: number; canceledAt?: Date } = {};
    if (data.status) updateData.status = data.status;
    if (data.planId) updateData.planId = data.planId;

    // Se cancelando, registrar data de cancelamento
    if (data.status === SubscriptionStatus.CANCELED) {
      updateData.canceledAt = new Date();
    }

    const updated = await AdminRepository.updateSubscription(subscriptionId, updateData);

    // Determina a ação correta para o log
    const action = data.status === SubscriptionStatus.CANCELED
      ? AdminAction.SUBSCRIPTION_CANCEL
      : AdminAction.SUBSCRIPTION_CHANGE;

    await AdminRepository.logAction(
      adminId,
      action,
      subscription.user.id,
      {
        subscriptionId,
        changes: data,
        previousStatus: subscription.status,
      },
      ipAddress
    );

    return updated;
  }

  /**
   * Concede acesso PREMIUM manualmente (override administrativo).
   * Cria uma nova assinatura ativa para o usuário.
   */
  static async grantPremiumAccess(
    adminId: string,
    targetUserId: string,
    planId: number,
    durationDays: number,
    ipAddress: string | null
  ) {
    // Validar usuário alvo
    const target = await AdminRepository.getUserDetail(targetUserId);
    if (!target) {
      throw new AppError("Usuário alvo não encontrado.", 404);
    }

    // Validar plano
    const plan = await PlanRepository.findById(planId);
    if (!plan || !plan.isActive) {
      throw new AppError("Plano não encontrado ou inativo.", 404);
    }

    // Validar duração (1 a 365 dias)
    if (durationDays < 1 || durationDays > 365) {
      throw new AppError("Duração deve ser entre 1 e 365 dias.", 400);
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const subscription = await AdminRepository.createSubscriptionOverride(
      targetUserId,
      planId,
      endDate
    );

    // Registra a ação de auditoria
    await AdminRepository.logAction(
      adminId,
      AdminAction.SUBSCRIPTION_OVERRIDE,
      targetUserId,
      {
        planId,
        planName: plan.name,
        durationDays,
        endDate: endDate.toISOString(),
      },
      ipAddress
    );

    return subscription;
  }

  // ─────────────────────────────────────────────
  // FREEMIUM CONFIG
  // ─────────────────────────────────────────────

  /**
   * Retorna a configuração atual do Freemium.
   */
  static async getFreemiumConfig(): Promise<FreemiumLimits> {
    return FreemiumConfigRepository.getConfig();
  }

  /**
   * Atualiza a configuração do Freemium.
   * Valida os dados e registra a ação no log de auditoria.
   */
  static async updateFreemiumConfig(
    adminId: string,
    data: Partial<FreemiumLimits>,
    ipAddress: string | null
  ) {
    // Validações de segurança
    if (data.allowedSymbols && !Array.isArray(data.allowedSymbols)) {
      throw new AppError("allowedSymbols deve ser um array de strings.", 400);
    }
    if (data.allowedTimeframes && !Array.isArray(data.allowedTimeframes)) {
      throw new AppError("allowedTimeframes deve ser um array de strings.", 400);
    }
    if (data.maxHistoryRecords !== undefined && data.maxHistoryRecords < 1) {
      throw new AppError("maxHistoryRecords deve ser pelo menos 1.", 400);
    }
    if (data.maxSignals !== undefined && data.maxSignals < 1) {
      throw new AppError("maxSignals deve ser pelo menos 1.", 400);
    }
    if (data.maxFavorites !== undefined && data.maxFavorites < 1) {
      throw new AppError("maxFavorites deve ser pelo menos 1.", 400);
    }

    // Captura config anterior para o log
    const previousConfig = await FreemiumConfigRepository.getConfig();
    const updated = await FreemiumConfigRepository.updateConfig(data);

    // Registra a ação de auditoria
    await AdminRepository.logAction(
      adminId,
      AdminAction.FREEMIUM_CONFIG_CHANGE,
      null,
      { previousConfig, newConfig: data },
      ipAddress
    );

    return updated;
  }

  // ─────────────────────────────────────────────
  // PLANOS
  // ─────────────────────────────────────────────

  /**
   * Lista todos os planos cadastrados.
   */
  static async listPlans() {
    return AdminRepository.listPlans();
  }

  /**
   * Cria um novo plano de assinatura.
   */
  static async createPlan(
    adminId: string,
    data: {
      name: string;
      description?: string;
      price: number;
      billingCycle: "MONTHLY" | "YEARLY";
      maxFavorites: number;
      maxSignals: number;
      maxHistoryRecords: number;
      hasVipSignals: boolean;
      hasSignalAlerts: boolean;
    },
    ipAddress: string | null
  ) {
    const plan = await AdminRepository.createPlan({
      ...data,
      price: data.price.toString(), // Prisma Decimal espera string ou Decimal
    } as any);

    try {
      await AdminRepository.logAction(
        adminId,
        AdminAction.PLAN_CHANGE,
        null,
        { action: "CREATE", planId: plan.id, planName: plan.name },
        ipAddress
      );
    } catch (logError) {
      console.error("Falha ao registrar log de auditoria (Plano Criado):", logError);
    }

    return plan;
  }

  /**
   * Atualiza um plano existente.
   */
  static async updatePlan(
    adminId: string,
    planId: number,
    data: {
      name?: string;
      description?: string;
      price?: number;
      billingCycle?: "MONTHLY" | "YEARLY";
      maxFavorites?: number;
      maxSignals?: number;
      maxHistoryRecords?: number;
      hasVipSignals?: boolean;
      hasSignalAlerts?: boolean;
      isActive?: boolean;
    },
    ipAddress: string | null
  ) {
    const existing = await AdminRepository.findPlanById(planId);
    if (!existing) {
      throw new AppError("Plano não encontrado.", 404);
    }

    const updated = await AdminRepository.updatePlan(planId, {
      ...data,
      price: data.price !== undefined ? data.price.toString() : undefined,
    } as any);

    try {
      await AdminRepository.logAction(
        adminId,
        AdminAction.PLAN_CHANGE,
        null,
        { action: "UPDATE", planId, changes: data },
        ipAddress
      );
    } catch (logError) {
      console.error("Falha ao registrar log de auditoria (Plano Atualizado):", logError);
    }

    return updated;
  }

  /**
   * Deleta um plano.
   */
  static async deletePlan(adminId: string, planId: number, ipAddress: string | null) {
    const existing = await AdminRepository.findPlanById(planId);
    if (!existing) {
      throw new AppError("Plano não encontrado.", 404);
    }

    const result = await AdminRepository.deletePlan(planId);

    try {
      await AdminRepository.logAction(
        adminId,
        AdminAction.PLAN_CHANGE,
        null,
        { action: "DELETE", planId, planName: existing.name },
        ipAddress
      );
    } catch (logError) {
      console.error("Falha ao registrar log de auditoria (Plano Deletado/Inativado):", logError);
    }

    return result;
  }

  /**
   * Inicia a ingestão manual de candles e indicadores para todos os timeframes de uma criptomoeda.
   */
  static async ingestCryptocurrency(
    adminId: string,
    cryptoId: number,
    ipAddress: string | null
  ) {
    const crypto = await AdminRepository.findCryptocurrencyById(cryptoId);
    if (!crypto) throw new Error("Criptomoeda não encontrada");

    const timeframes = ["15m", "1h", "4h", "1d", "1w", "1M"];
    const results = [];

    for (const tf of timeframes) {
      // incrementalUpdate faz o backfill se não houver dados
      const candlesCount = await IngestionService.incrementalUpdate(crypto.symbol, tf);
      const indicatorsCount = await IndicatorService.calculateAndPersist(crypto.symbol, tf);
      results.push({ timeframe: tf, candles: candlesCount, indicators: indicatorsCount });
    }

    await AdminRepository.logAction(
      adminId,
      AdminAction.CRYPTO_SYNC,
      null, // Target User Null pois o alvo é uma moeda
      { 
        action: "manual_ingestion", 
        cryptoSymbol: crypto.symbol,
        results 
      },
      ipAddress
    );

    return {
      symbol: crypto.symbol,
      results
    };
  }

  /**
   * Remove todos os candles e indicadores de uma criptomoeda (desingestão manual).
   * Registra a ação no log de auditoria.
   */
  static async purgeCryptocurrency(
    adminId: string,
    cryptoId: number,
    ipAddress: string | null
  ) {
    const crypto = await AdminRepository.findCryptocurrencyById(cryptoId);
    if (!crypto) {
      throw new AppError("Criptomoeda não encontrada.", 404);
    }

    const result = await AdminRepository.purgeCryptocurrencyData(crypto.symbol);

    await AdminRepository.logAction(
      adminId,
      AdminAction.CRYPTO_SYNC,
      null,
      {
        action: "manual_purge",
        cryptoSymbol: crypto.symbol,
        deletedCandles: result.deletedCandles,
        deletedIndicators: result.deletedIndicators,
      },
      ipAddress
    );

    return {
      symbol: crypto.symbol,
      ...result,
    };
  }

  // ─────────────────────────────────────────────
  // CRIPTOMOEDAS
  // ─────────────────────────────────────────────

  /**
   * Lista criptomoedas com paginação e busca.
   */
  static async listCryptocurrencies(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));

    return AdminRepository.listCryptocurrencies({
      page,
      limit,
      search: params.search?.trim(),
      isActive: params.isActive,
    });
  }

  /**
   * Alterna o status (ativo/inativo) de uma criptomoeda.
   * Registra a ação no log de auditoria.
   */
  static async toggleCryptocurrencyStatus(
    adminId: string,
    cryptoId: number,
    isActive: boolean,
    ipAddress: string | null
  ) {
    const crypto = await AdminRepository.findCryptocurrencyById(cryptoId);

    if (!crypto) {
      throw new AppError("Criptomoeda não encontrada.", 404);
    }

    const updated = await AdminRepository.updateCryptocurrencyStatus(cryptoId, isActive);

    // Registra a ação de auditoria
    try {
      await AdminRepository.logAction(
        adminId,
        AdminAction.CRYPTO_STATUS_CHANGE,
        null,
        { 
          cryptoId, 
          symbol: crypto.symbol, 
          previousStatus: crypto.isActive, 
          newStatus: isActive 
        },
        ipAddress
      );
    } catch (logError) {
      console.error("Falha ao registrar log de auditoria (Crypto Status Change):", logError);
    }

    return updated;
  }

  /**
   * Sincroniza todos os pares da Binance com o banco de dados local.
   */
  static async syncCryptocurrencies(adminId: string, ipAddress: string | null) {
    const exchangeInfo = await BinanceService.getExchangeInfo();
    
    if (!exchangeInfo || !exchangeInfo.symbols) {
      throw new AppError("Não foi possível obter dados da Binance.", 502);
    }

    // Filtrar todos os pares que estejam TRADING
    const symbols = exchangeInfo.symbols.filter(
      (s: any) => s.status === "TRADING"
    );

    const cryptosToUpsert = symbols.map((s: any) => ({
      symbol: s.symbol,
      name: `${s.baseAsset} / ${s.quoteAsset}`,
      baseAsset: s.baseAsset,
      quoteAsset: s.quoteAsset,
    }));

    const results = await AdminRepository.bulkUpsertCryptocurrencies(cryptosToUpsert);

    // Registra a ação de auditoria
    try {
      await AdminRepository.logAction(
        adminId,
        AdminAction.CRYPTO_SYNC,
        null,
        { 
          totalSynced: cryptosToUpsert.length,
          symbols: cryptosToUpsert.map(c => c.symbol).slice(0, 50) // Loga os primeiros 50 símbolos
        },
        ipAddress
      );
    } catch (logError) {
      console.error("Falha ao registrar log de auditoria (Crypto Sync):", logError);
    }

    return {
      count: cryptosToUpsert.length,
      results,
    };
  }
}
