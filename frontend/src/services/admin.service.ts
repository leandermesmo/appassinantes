import { api } from "@/lib/axios";
import { UserRole, UserStatus, SubscriptionStatus } from "@/types/prisma";

// Tipos para as respostas da API

export interface DashboardMetrics {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  conversionRate: number;
  estimatedMonthlyRevenue: number;
  newUsersLast7Days: number;
  recentCancellations: number;
}

export interface UserSummary {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  subscriptions: Array<{
    id: string;
    status: SubscriptionStatus;
    plan: { id: number; name: string; billingCycle: string };
    currentPeriodStart: string;
    currentPeriodEnd: string;
  }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    totalPages: number;
    total: number;
    activeCount?: number;
    inactiveCount?: number;
    page: number;
    users?: T[];
    subscriptions?: T[];
    cryptos?: T[];
  };
}

export interface Cryptocurrency {
  id: number;
  symbol: string;
  name: string;
  baseAsset: string;
  quoteAsset: string;
  isActive: boolean;
  createdAt: string;
  candleCounts?: {
    '15m': number;
    '1h': number;
    '4h': number;
    '1d': number;
    '1w': number;
    '1M': number;
  };
}

export interface UserDetail extends UserSummary {
  updatedAt: string;
  accounts: Array<{ provider: string; providerAccountId: string }>;
  adminTargetActions: Array<{
    id: string;
    action: string;
    details: any;
    createdAt: string;
    admin: { name: string | null; email: string | null };
  }>;
}

export interface SubscriptionDetail {
  id: string;
  status: SubscriptionStatus;
  user: { id: string; name: string | null; email: string | null; image: string | null };
  plan: { id: number; name: string; price: number; billingCycle: string };
}

export interface FreemiumLimits {
  allowedSymbols: string[];
  allowedTimeframes: string[];
  maxHistoryRecords: number;
  maxSignals: number;
  maxFavorites: number;
}

export interface PlanDetail {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  billingCycle: "MONTHLY" | "YEARLY";
  maxFavorites: number;
  maxSignals: number;
  maxHistoryRecords: number;
  hasVipSignals: boolean;
  hasSignalAlerts: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const AdminService = {
  // DASHBOARD
  getMetrics: async () => {
    const response = await api.get<{ success: boolean; data: DashboardMetrics }>("admin/dashboard");
    return response.data.data;
  },

  // USERS
  listUsers: async (params: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
    const response = await api.get<PaginatedResponse<UserSummary>>("admin/users", { params });
    return response.data.data;
  },

  getUserDetail: async (id: string) => {
    const response = await api.get<{ success: boolean; data: UserDetail }>(`admin/users/${id}`);
    return response.data.data;
  },

  changeUserStatus: async (id: string, status: UserStatus) => {
    const response = await api.patch(`admin/users/${id}/status`, { status });
    return response.data;
  },

  grantPremiumAccess: async (id: string, planId: number, durationDays: number) => {
    const response = await api.patch(`admin/users/${id}/subscription`, { planId, durationDays });
    return response.data;
  },

  // SUBSCRIPTIONS
  listSubscriptions: async (params: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get<PaginatedResponse<SubscriptionDetail>>("admin/subscriptions", { params });
    return response.data.data;
  },

  updateSubscription: async (id: string, data: { status?: SubscriptionStatus; planId?: number }) => {
    const response = await api.patch(`admin/subscriptions/${id}`, data);
    return response.data;
  },

  // FREEMIUM CONFIG
  getFreemiumConfig: async () => {
    const response = await api.get<{ success: boolean; data: FreemiumLimits }>("admin/freemium-config");
    return response.data.data;
  },

  updateFreemiumConfig: async (data: Partial<FreemiumLimits>) => {
    const response = await api.patch(`admin/freemium-config`, data);
    return response.data;
  },

  // PLANS
  listPlans: async () => {
    const response = await api.get<{ success: boolean; data: PlanDetail[] }>("admin/plans");
    return response.data.data;
  },

  createPlan: async (data: Omit<PlanDetail, "id" | "isActive" | "createdAt">) => {
    const response = await api.post<{ success: boolean; data: PlanDetail }>("admin/plans", data);
    return response.data.data;
  },

  updatePlan: async (id: number, data: Partial<PlanDetail>) => {
    const response = await api.patch<{ success: boolean; data: PlanDetail }>(`admin/plans/${id}`, data);
    return response.data.data;
  },

  deletePlan: async (id: number) => {
    const response = await api.delete(`admin/plans/${id}`);
    return response.data;
  },

  // CRYPTOCURRENCIES
  listCryptocurrencies: async (params: { page?: number; limit?: number; search?: string; isActive?: boolean }) => {
    const response = await api.get<PaginatedResponse<Cryptocurrency>>("admin/cryptocurrencies", { params });
    return response.data.data;
  },

  toggleCryptocurrencyStatus: async (id: number, isActive: boolean) => {
    const response = await api.patch(`admin/cryptocurrencies/${id}/status`, { isActive });
    return response.data;
  },

  syncCryptocurrencies: async () => {
    const response = await api.post("admin/cryptocurrencies/sync");
    return response.data;
  },

  ingestCryptocurrency: async (id: number) => {
    const response = await api.post(`admin/cryptocurrencies/${id}/ingest`);
    return response.data;
  },

  purgeCryptocurrency: async (id: number) => {
    const response = await api.delete(`admin/cryptocurrencies/${id}/purge`);
    return response.data;
  },
};
