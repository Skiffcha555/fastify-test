import Fastify from "fastify"
import userRoutes from "./routes/users"
import transactionRoutes from "./routes/transactions"
import formbody from "@fastify/formbody"

const fastify = Fastify({ logger: true })

fastify.register(formbody)

fastify.register(userRoutes)
fastify.register(transactionRoutes)

const start = async () => {
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
