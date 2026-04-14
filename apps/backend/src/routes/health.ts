import { Router, type Request, type Response } from "express"

export const healthRouter: Router = Router()

healthRouter.get("/", (_req: Request, res: Response) => {
  // When Neon is wired in, add a lightweight `SELECT 1` here and surface
  // db status in the payload.
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})
