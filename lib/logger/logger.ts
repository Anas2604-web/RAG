import pino from "pino"

export const logger = pino({
    base: {service: "agentic-rag"},
    level: process.env.LOG_LEVEL ?? "info"
})