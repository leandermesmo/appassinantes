import axios from "axios";
import { getSession } from "next-auth/react";

export const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api") + "/",
  // Desabilitando withCredentials porque usaremos Authorization Bearer (e evitar conflito de CORS com origin *)
  withCredentials: false, 
});

api.interceptors.request.use(async (config) => {
  // Ignora interceptor em chamadas server-side (getSession não funciona no Node.js puro sem req/res)
  if (typeof window !== "undefined") {
    const session = await getSession();
    if (session?.apiAccessToken) {
      config.headers.Authorization = `Bearer ${session.apiAccessToken}`;
    }
  }
  return config;
});
