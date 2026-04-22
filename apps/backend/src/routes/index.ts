import { Router } from "express"

import { boardsRouter } from "./boards.js"
import { dashboardRouter } from "./dashboard.js"
import { healthRouter } from "./health.js"
import { workspacesRouter } from "./workspaces.js"

export const apiRouter: Router = Router()

apiRouter.use("/health", healthRouter)
apiRouter.use("/workspaces", workspacesRouter)
apiRouter.use("/boards", boardsRouter)
apiRouter.use("/dashboard", dashboardRouter)
