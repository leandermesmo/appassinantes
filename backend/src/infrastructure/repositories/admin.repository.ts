import { UserRole, UserStatus, SubscriptionStatus, AdminAction, Prisma } from "@prisma/client";
import { prisma } from "../database/prisma.client";

/**
 * Repositório centralizado para todas as queries administrativas.
 *
 * Responsável exclusivamente pelo acesso a dados — sem lógica de negócio.
 * A lógica de validação e regras fica no AdminService.
 */

// ─────────────────────────────────────────────
// Tipos auxiliares
// ─────────────────────────────────────────────

interface DashboardMetrics {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  conversionRate: number;
  estimatedMonthlyRevenue: number;
  newUsersLast7Days: number;
  recentCancellations: number;
}

interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

interface ListSubscriptionsParams {
  page: number;
  limit: number;
  status?: SubscriptionStatus;
}

// ─────────────────────────────────────────────
// Repositório
// ─────────────────────────────────────────────

export class AdminRepository {
  /**
   * Agrega métricas para o dashboard administrativo.
   * Usa queries otimizadas para minimizar o número de roundtrips ao banco.
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Executa todas as queries em paralelo para performance
    const [
      totalUsers,
      premiumUsersResult,
      newUsersLast7Days,
      recentCancellations,
      revenueResult,
    ] = await Promise.all([
      // Total de usuários (excluindo administradores)
      prisma.user.count({
        where: { role: { not: UserRole.ADMIN } },
      }),

      // Usuários com assinatura ativa (PREMIUM) - excluindo administradores
      prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: { gte: now },
          user: { role: { not: UserRole.ADMIN } },
        },
        select: { userId: true },
        distinct: ["userId"],
      }),

      // Novos usuários nos últimos 7 dias (excluindo administradores)
      prisma.user.count({
        where: { 
          createdAt: { gte: sevenDaysAgo },
          role: { not: UserRole.ADMIN },
        },
      }),

      // Cancelamentos recentes (últimos 30 dias) - excluindo administradores
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.CANCELED,
          canceledAt: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
          user: { role: { not: UserRole.ADMIN } },
        },
      }),

      // Receita mensal estimada (soma de planos ativos) - excluindo administradores
      prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: { gte: now },
          user: { role: { not: UserRole.ADMIN } },
        },
        include: { plan: { select: { price: true, billingCycle: true } } },
      }),
    ]);

    const premiumUsers = premiumUsersResult.length;
    const freeUsers = totalUsers - premiumUsers;
    const conversionRate =
      totalUsers > 0
        ? parseFloat(((premiumUsers / totalUsers) * 100).toFixed(2))
        : 0;

    // Calcula receita mensal normalizada (anual / 12)
    const estimatedMonthlyRevenue = revenueResult.reduce((sum, sub) => {
      const price = Number(sub.plan.price);
      return sum + (sub.plan.billingCycle === "YEARLY" ? price / 12 : price);
    }, 0);

    return {
      totalUsers,
      freeUsers,
      premiumUsers,
      conversionRate,
      estimatedMonthlyRevenue: parseFloat(estimatedMonthlyRevenue.toFixed(2)),
      newUsersLast7Days,
      recentCancellations,
    };
  }

  /**
   * Listagem paginada de usuários com busca e filtros.
   */
  static async listUsers(params: ListUsersParams) {
    const { page, limit, search, role, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
        { id: search.length === 36 ? search : undefined },
      ].filter((condition) => {
        const values = Object.values(condition);
        return values.every((v) => v !== undefined);
      });
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          status: true,
          createdAt: true,
          subscriptions: {
            where: {
              status: SubscriptionStatus.ACTIVE,
              currentPeriodEnd: { gte: new Date() },
            },
            select: {
              id: true,
              status: true,
              plan: { select: { id: true, name: true } },
              currentPeriodEnd: true,
            },
            orderBy: { currentPeriodEnd: "desc" },
            take: 1,
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Dados completos de um usuário para a tela de detalhes.
   */
  static async getUserDetail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          },
        },
        subscriptions: {
          select: {
            id: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            canceledAt: true,
            createdAt: true,
            plan: {
              select: { id: true, name: true, price: true, billingCycle: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        adminTargetActions: {
          select: {
            id: true,
            action: true,
            details: true,
            createdAt: true,
            admin: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!user) return null;

    // Serialização customizada para lidar com BigInt do AdminLog id
    return {
      ...user,
      adminTargetActions: user.adminTargetActions.map(action => ({
        ...action,
        id: action.id.toString()
      }))
    };
  }

  /**
   * Atualiza o role de um usuário.
   */
  static async updateUserRole(userId: string, role: UserRole) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  /**
   * Atualiza o status de um usuário (bloquear/desbloquear).
   */
  static async updateUserStatus(userId: string, status: UserStatus) {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, name: true, email: true, status: true },
    });
  }

  /**
   * Listagem paginada de assinaturas com filtro por status.
   */
  static async listSubscriptions(params: ListSubscriptionsParams) {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.SubscriptionWhereInput = {};
    if (status) {
      where.status = status;
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
          plan: {
            select: { id: true, name: true, price: true, billingCycle: true },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    return {
      subscriptions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Atualiza o status de uma assinatura.
   */
  static async updateSubscription(
    subscriptionId: string,
    data: { status?: SubscriptionStatus; planId?: number; currentPeriodEnd?: Date }
  ) {
    return prisma.subscription.update({
      where: { id: subscriptionId },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Busca uma assinatura pelo ID.
   */
  static async findSubscriptionById(subscriptionId: string) {
    return prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Cria uma assinatura manualmente (override administrativo).
   */
  static async createSubscriptionOverride(
    userId: string,
    planId: number,
    endDate: Date
  ) {
    return prisma.subscription.create({
      data: {
        userId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: endDate,
      },
      include: {
        plan: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Listagem de todos os planos.
   */
  static async listPlans() {
    const plans = await prisma.plan.findMany({
      orderBy: { price: "asc" },
    });

    return plans.map(plan => ({
      ...plan,
      price: Number(plan.price)
    }));
  }

  /**
   * Busca um plano pelo ID.
   */
  static async findPlanById(planId: number) {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) return null;

    return {
      ...plan,
      price: Number(plan.price)
    };
  }

  /**
   * Cria um novo plano.
   */
  static async createPlan(data: Prisma.PlanCreateInput) {
    const plan = await prisma.plan.create({
      data,
    });
    return { ...plan, price: Number(plan.price) };
  }

  /**
   * Atualiza um plano existente.
   */
  static async updatePlan(planId: number, data: Prisma.PlanUpdateInput) {
    const plan = await prisma.plan.update({
      where: { id: planId },
      data,
    });
    return { ...plan, price: Number(plan.price) };
  }

  /**
   * Deleta (ou inativa) um plano.
   * No SaaS, deletar fisicamente pode quebrar históricos. 
   * Vamos implementar o delete físico se não houver assinaturas, 
   * ou forçar a inativação se preferir.
   */
  static async deletePlan(planId: number) {
    // Verifica se existem assinaturas vinculadas
    const subCount = await prisma.subscription.count({
      where: { planId },
    });

    if (subCount > 0) {
      // Se houver assinaturas, apenas inativa para não quebrar o banco
      return prisma.plan.update({
        where: { id: planId },
        data: { isActive: false },
      });
    }

    return prisma.plan.delete({
      where: { id: planId },
    });
  }
  
  /**
   * Listagem paginada de criptomoedas com busca.
   */
  static async listCryptocurrencies(params: { 
    page: number, 
    limit: number, 
    search?: string,
    isActive?: boolean 
  }) {
    const { page, limit, search, isActive } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CryptocurrencyWhereInput = {};
    if (search) {
      const words = search.toLowerCase().trim().split(/\s+/);
      
      // Filtra palavras que indicam status
      const statusAtivo = words.some(w => "ativo".startsWith(w) || w === "ativa");
      const statusInativo = words.some(w => "inativo".startsWith(w) || w === "inativa");
      
      // Filtra termos que não são de status para busca em symbol/name
      const textTerms = words.filter(w => 
        !("ativo".startsWith(w) || w === "ativa") && 
        !("inativo".startsWith(w) || w === "inativa")
      );

      const conditions: any[] = [];

      // Adiciona condição de texto se houver termos restantes
      if (textTerms.length > 0) {
        const textSearch = textTerms.join(' ');
        conditions.push({
          OR: [
            { symbol: { contains: textSearch } },
            { name: { contains: textSearch } },
          ]
        });
      }

      // Adiciona condição de status se detectado de forma exclusiva
      if (statusAtivo && !statusInativo) {
        conditions.push({ isActive: true });
      } else if (statusInativo && !statusAtivo) {
        conditions.push({ isActive: false });
      }

      if (conditions.length > 1) {
        where.AND = conditions;
      } else if (conditions.length === 1) {
        // Se houver apenas uma condição (só texto ou só status), simplifica
        Object.assign(where, conditions[0]);
      }
    }

    // Filtro explícito de status (sobrescreve busca se fornecido)
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [cryptos, total, activeCount, inactiveCount] = await Promise.all([
      prisma.cryptocurrency.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.cryptocurrency.count({ where }),
      prisma.cryptocurrency.count({ where: { isActive: true } }),
      prisma.cryptocurrency.count({ where: { isActive: false } }),
    ]);

    // Busca contagem de candles por timeframe para os symbols da página atual
    let candleCountsMap: Record<string, Record<string, number>> = {};

    if (cryptos.length > 0) {
      const symbols = cryptos.map((c) => c.symbol);
      const placeholders = symbols.map(() => '?').join(', ');

      const rows = await prisma.$queryRawUnsafe<
        { symbol: string; timeframe: string; total: bigint }[]
      >(
        `SELECT symbol, timeframe, COUNT(*) as total
         FROM candles
         WHERE symbol IN (${placeholders})
         GROUP BY symbol, timeframe`,
        ...symbols
      );

      for (const row of rows as any[]) {
        // Normaliza as chaves do objeto retornado pelo banco (para lidar com possíveis diferenças de case)
        const normalizedRow: any = {};
        for (const key of Object.keys(row)) {
          normalizedRow[key.toLowerCase()] = row[key];
        }

        const sym = (normalizedRow.symbol as string)?.toUpperCase();
        const tf = normalizedRow.timeframe;
        const total = normalizedRow.total;

        if (sym && tf) {
          if (!candleCountsMap[sym]) {
            candleCountsMap[sym] = {};
          }
          // Converte BigInt para Number de forma segura
          candleCountsMap[sym][tf] = typeof total === 'bigint' ? Number(total) : Number(total || 0);
        }
      }
    }

    // Enriquece cada crypto com as contagens de candles
    const enrichedCryptos = cryptos.map((c) => {
      const counts = candleCountsMap[c.symbol.toUpperCase()] || {};
      return {
        ...c,
        candleCounts: {
          '15m': counts['15m'] || 0,
          '1h': counts['1h'] || 0,
          '4h': counts['4h'] || 0,
          '1d': counts['1d'] || 0,
          '1w': counts['1w'] || 0,
          '1M': counts['1M'] || 0,
        },
      };
    });

    return {
      cryptos: enrichedCryptos,
      total,
      activeCount,
      inactiveCount,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Atualiza o status de ativação de uma criptomoeda.
   */
  static async updateCryptocurrencyStatus(cryptoId: number, isActive: boolean) {
    return prisma.cryptocurrency.update({
      where: { id: cryptoId },
      data: { isActive },
    });
  }

  /**
   * Busca uma criptomoeda pelo ID.
   */
  static async findCryptocurrencyById(cryptoId: number) {
    return prisma.cryptocurrency.findUnique({
      where: { id: cryptoId },
    });
  }

  /**
   * Remove todos os candles e indicadores de uma criptomoeda (purge/desingestão).
   * Usa transaction para garantir atomicidade.
   */
  static async purgeCryptocurrencyData(symbol: string) {
    const results = await prisma.$transaction([
      prisma.$executeRawUnsafe(`DELETE FROM indicators WHERE symbol = ?`, symbol),
      prisma.$executeRawUnsafe(`DELETE FROM candles WHERE symbol = ?`, symbol),
    ]);

    return {
      deletedIndicators: results[0],
      deletedCandles: results[1],
    };
  }

  /**
   * Registra uma ação administrativa no log de auditoria.
   */
  static async logAction(
    adminId: string,
    action: AdminAction,
    targetUserId: string | null,
    details: Record<string, unknown> | null,
    ipAddress: string | null
  ) {
    return prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetUserId,
        details: (details as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        ipAddress,
      },
    });
  }

  /**
   * Insere ou atualiza criptomoedas em massa.
   */
  static async bulkUpsertCryptocurrencies(cryptos: any[]) {
    const results = [];
    
    // Usando loop sequencial para evitar sobrecarga e tratar duplicatas via upsert
    for (const crypto of cryptos) {
      const result = await prisma.cryptocurrency.upsert({
        where: { symbol: crypto.symbol },
        update: {
          name: crypto.name,
          baseAsset: crypto.baseAsset,
          quoteAsset: crypto.quoteAsset,
        },
        create: {
          symbol: crypto.symbol,
          name: crypto.name,
          baseAsset: crypto.baseAsset,
          quoteAsset: crypto.quoteAsset,
          isActive: true,
        },
      });
      results.push(result);
    }
    
    return results;
  }
}
