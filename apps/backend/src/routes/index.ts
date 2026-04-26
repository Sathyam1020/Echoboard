import { Router } from "express"

import { boardsRouter } from "./boards.js"
import { changelogRouter } from "./changelog.js"
import { commentsRouter } from "./comments.js"
import { dashboardRouter } from "./dashboard.js"
import { healthRouter } from "./health.js"
import { postsRouter } from "./posts.js"
import { profileRouter } from "./profile.js"
import { visitorsRouter } from "./visitors.js"
import {
  widgetConfigAdminRouter,
  widgetConfigPublicRouter,
  workspaceSettingsRouter,
} from "./workspace-settings.js"
import { workspacesRouter } from "./workspaces.js"

export const apiRouter: Router = Router()

apiRouter.use("/health", healthRouter)
apiRouter.use("/workspaces", workspacesRouter)
apiRouter.use("/workspaces", profileRouter)
apiRouter.use("/workspaces/me/settings", workspaceSettingsRouter)
apiRouter.use("/boards", boardsRouter)
apiRouter.use("/boards", widgetConfigAdminRouter)
apiRouter.use("/posts", postsRouter)
apiRouter.use("/comments", commentsRouter)
apiRouter.use("/dashboard", dashboardRouter)
apiRouter.use("/changelog", changelogRouter)
apiRouter.use("/visitors", visitorsRouter)
// Mounted at /api/widget — public read, served with CORS *.
apiRouter.use("/widget", widgetConfigPublicRouter)
