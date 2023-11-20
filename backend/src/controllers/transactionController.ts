import { FastifyRequest, FastifyReply } from "fastify"
import { PrismaClient } from "@prisma/client"
import { transactionSchema } from "../utils/validationSchemas"

const prisma = new PrismaClient()

export const createTransaction = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { error, value } = transactionSchema.validate(request.body)
  if (error) {
    return reply.code(400).send({ message: error.details[0].message })
  }

  const { recipientId, amount } = value
  const senderId = (request as any).user.userId

  try {
    const transaction = await prisma.$transaction(async (prisma) => {
      const sender = await prisma.user.findUnique({ where: { id: senderId } })
      if (!sender || sender.balance < amount) {
        throw new Error("Недостаточно средств")
      }

      await prisma.user.update({
        where: { id: senderId },
        data: { balance: { decrement: amount } },
      })

      await prisma.user.update({
        where: { id: recipientId },
        data: { balance: { increment: amount } },
      })

      return prisma.transaction.create({
        data: {
          senderId,
          recipientId,
          amount,
        },
      })
    })

    return reply.code(201).send(transaction)
  } catch (error) {
    console.error(error)
    return reply.code(500).send({ message: "Ошибка при выполнении транзакции" })
  }
}

export const getTransactions = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request as any).user.userId

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return reply.send(transactions)
  } catch (error) {
    console.error(error)
    return reply
      .code(500)
      .send({ message: "Ошибка при получении истории транзакций" })
  }
}
