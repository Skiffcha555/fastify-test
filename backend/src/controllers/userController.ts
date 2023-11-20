import { FastifyRequest, FastifyReply } from "fastify"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { PrismaClient, Prisma } from "@prisma/client"
import { registerSchema, loginSchema } from "../utils/validationSchemas"

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret"

interface RegisterUserBody {
  name: string
  email: string
  password: string
}

interface LoginUserBody {
  email: string
  password: string
}

interface DepositRequestBody {
  amount: string
}

export const registerUser = async (
  request: FastifyRequest<{ Body: RegisterUserBody }>,
  reply: FastifyReply
) => {
  const { error, value } = registerSchema.validate(request.body)

  if (error) {
    return reply.code(400).send({ message: error.details[0].message })
  }

  const { name, email, password } = value
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        balance: 500,
      },
    })

    return reply
      .code(201)
      .send({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        balance: newUser.balance,
      })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return reply.code(400).send({ message: "Email уже используется" })
    }

    console.error(error)
    return reply
      .code(500)
      .send({ message: "Ошибка сервера при регистрации пользователя" })
  }
}

export const loginUser = async (
  request: FastifyRequest<{ Body: LoginUserBody }>,
  reply: FastifyReply
) => {
  const { error, value } = loginSchema.validate(request.body)
  if (error) {
    return reply.code(400).send({ message: error.details[0].message })
  }

  const { email, password } = value
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.code(401).send({ message: "Неверные учетные данные" })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" })
    return reply.send({ token })
  } catch (error) {
    console.error(error)
    return reply
      .code(500)
      .send({ message: "Ошибка сервера при входе в систему" })
  }
}

export const depositAmount = async (
  request: FastifyRequest<{ Body: DepositRequestBody }>,
  reply: FastifyReply
) => {
  const { amount } = request.body
  const userId = (request as any).user.userId

  if (parseFloat(amount) <= 0) {
    return reply.code(400).send({ message: "Сумма должна быть положительной" })
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: parseFloat(amount) } },
    })

    return reply.code(200).send({ message: "Баланс успешно пополнен" })
  } catch (error) {
    console.error(error)
    return reply
      .code(500)
      .send({ message: "Ошибка сервера при пополнении баланса" })
  }
}
