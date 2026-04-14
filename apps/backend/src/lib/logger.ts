import pino, { type LoggerOptions } from "pino"

import { env } from "../config/env.js"

const options: LoggerOptions = {
  level: env.LOG_LEVEL,
  base: { env: env.NODE_ENV },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie"],
    remove: true,
  },
  ...(env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:HH:MM:ss.l" },
        },
      }
    : {}),
}

export const logger = pino(options)
