import axios from "axios";
import { getSession, signOut } from "next-auth/react";

/**
 * Instância Axios configurada para comunicação com a API Fastify (backend).
 * O interceptor injeta automaticamente o API Access Token gerado pelo NextAuth
 * no header Authorization de cada request.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api/",
  timeout: 15000,
});

/**
 * Interceptor de Request — Injeta o Bearer token do NextAuth.
 * Usa getSession() que lê a sessão cacheada pelo SessionProvider.
 * O token enviado é um JWT HS256 separado (apiAccessToken), não o session cookie.
 */
api.interceptors.request.use(async (config) => {
  // Evita adicionar token em chamadas para URLs externas (ex: Binance API)
  const isExternalUrl = config.url?.startsWith("http");
  if (isExternalUrl) {
    return config;
  }

  try {
    const session = await getSession();
    if (session?.apiAccessToken) {
      config.headers.Authorization = `Bearer ${session.apiAccessToken}`;
    }
  } catch (error) {
    // Sessão não disponível ou erro de rede (servidor fora do ar)
    // NÃO chamamos signOut aqui para evitar loop infinito caso o Next.js tenha crashado.
    console.warn("[API] Falha ao recuperar sessão no interceptor:", error);
  }

  return config;
});

/**
 * Interceptor de Response — Tratamento centralizado de erros da API.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido — sessão será renovada automaticamente
      // pelo NextAuth na próxima interação do usuário. Se falhar, forçamos o logout.
      console.warn("[API] Token expirado ou não autorizado. Forçando logout.");
      if (typeof window !== "undefined") {
        signOut({ callbackUrl: "/login" });
      }
    }
    return Promise.reject(error);
  }
);
