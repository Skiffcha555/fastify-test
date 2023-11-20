import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret"

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) => {
  try {
    const token = request.headers.authorization?.split(" ")[1]
    if (!token) {
      return reply.code(401).send({ message: "Неавторизован" })
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        reply.code(401).send({ message: "Неверный токен" })
      } else {
        ;(request as any).user = decoded
        done()
      }
    })
  } catch (error) {
    reply.code(500).send({ message: "Ошибка сервера" })
  }
}
