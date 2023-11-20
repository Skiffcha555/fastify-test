import { FastifyInstance } from "fastify"
import {
  registerUser,
  loginUser,
  depositAmount,
} from "../controllers/userController"
import { authenticate } from "../middlewares/authMiddleware"

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.post("/register", registerUser)
  fastify.post("/login", loginUser)
  //@ts-ignore
  fastify.post("/deposit", { preHandler: [authenticate] }, depositAmount)
}
