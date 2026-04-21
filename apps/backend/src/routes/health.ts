import { db, sql } from "@workspace/db/client"
import { Router, type Request, type Response } from "express"

export const healthRouter: Router = Router()

healthRouter.get("/", async (_req: Request, res: Response) => {
  let dbStatus: "ok" | "error" = "ok"
  try {
    await db.execute(sql`SELECT 1`)
  } catch {
    dbStatus = "error"
  }

  res.status(dbStatus === "ok" ? 200 : 503).json({
    status: dbStatus === "ok" ? "ok" : "degraded",
    db: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})
