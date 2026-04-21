import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import { db } from "@workspace/db/client"
import * as authSchema from "@workspace/db/schema"

import { authEnv, googleEnabled, trustedOrigins } from "./env.js"

export const auth = betterAuth({
  baseURL: authEnv.BETTER_AUTH_URL,
  secret: authEnv.BETTER_AUTH_SECRET,
  trustedOrigins,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      // v1: dev-only logger. Swap to a real email provider (Resend/Postmark)
      // in a follow-up feature along with the /reset-password + /forgot-password
      // UI pages.
      // eslint-disable-next-line no-console
      console.info(
        `[auth] password reset requested for ${user.email} — ${url}`,
      )
    },
  },

  socialProviders: googleEnabled
    ? {
        google: {
          clientId: authEnv.GOOGLE_CLIENT_ID!,
          clientSecret: authEnv.GOOGLE_CLIENT_SECRET!,
          prompt: "select_account",
          accessType: "offline",
        },
      }
    : {},

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  advanced: {
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
})

export type Auth = typeof auth
