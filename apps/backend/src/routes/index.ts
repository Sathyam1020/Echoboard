import { Router } from "express"

import { boardsRouter } from "./boards.js"
import { changelogRouter } from "./changelog.js"
import { commentsRouter } from "./comments.js"
import { dashboardRouter } from "./dashboard.js"
import { healthRouter } from "./health.js"
import { postsRouter } from "./posts.js"
import { visitorsRouter } from "./visitors.js"
import { workspacesRouter } from "./workspaces.js"

export const apiRouter: Router = Router()

apiRouter.use("/health", healthRouter)
apiRouter.use("/workspaces", workspacesRouter)
apiRouter.use("/boards", boardsRouter)
apiRouter.use("/posts", postsRouter)
apiRouter.use("/comments", commentsRouter)
apiRouter.use("/dashboard", dashboardRouter)
apiRouter.use("/changelog", changelogRouter)
apiRouter.use("/visitors", visitorsRouter)
