import { FastifyInstance } from "fastify";
import { ensureAuthenticated } from "../middlewares/auth.middleware";
import { UserRepository } from "../../infrastructure/repositories/user.repository";

/**
 * Rotas de Autenticação — Limpas.
 * 
 * Mantemos apenas a rota /auth/me para que o frontend consiga obter
 * os dados detalhados do usuário logado (armazenados no banco) 
 * utilizando o token de API validado.
 */
export async function authRoutes(app: FastifyInstance) {
  /**
   * GET /api/auth/me
   * Retorna o perfil do usuário logado baseado no token de API.
   */
  app.get(
    "/auth/me",
    { preHandler: [ensureAuthenticated] },
    async (request, reply) => {
      const user = await UserRepository.findById(request.user.id);
      
      if (!user) {
        return reply.status(404).send({ 
          success: false, 
          message: "Usuário não encontrado." 
        });
      }

      return reply.status(200).send({ 
        success: true, 
        data: user 
      });
    }
  );
}
