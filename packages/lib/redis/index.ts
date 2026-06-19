import Redis from "ioredis"

// Upstash provides a full `rediss://` connection URL (TLS required).
// Prefer it when available; otherwise fall back to host/port/password.
const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
    : new Redis({
          host: process.env.REDIS_HOST || "127.0.0.1",
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD,
      })

export default redis