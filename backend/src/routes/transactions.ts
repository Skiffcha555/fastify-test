import { FastifyInstance } from "fastify"
import {
  createTransaction,
  getTransactions,
} from "../controllers/transactionController"
import { authenticate } from "../middlewares/authMiddleware"

export default async function transactionRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/transaction",
    { preHandler: [authenticate] },
    createTransaction
  )
  fastify.get("/transactions", { preHandler: [authenticate] }, getTransactions)
}
