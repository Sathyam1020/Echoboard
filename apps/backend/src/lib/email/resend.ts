import { env } from "../../config/env.js"
import { logger } from "../logger.js"

// Minimal Resend wrapper. We don't take a dependency on the Resend SDK —
// a single fetch call is enough and keeps the bundle lean. If RESEND_API_KEY
// is unset (dev mode), we log the email payload and return success so the
// flow that triggered it (invite creation) doesn't need to special-case dev.

export type EmailMessage = {
  to: string
  subject: string
  text: string
  html?: string
  // RFC 8058 unsubscribe headers etc.
  headers?: Record<string, string>
}

export type SendEmailResult = { id: string | null; logged: boolean }

export async function sendEmail(message: EmailMessage): Promise<SendEmailResult> {
  if (!env.RESEND_API_KEY) {
    logger.info(
      { to: message.to, subject: message.subject, body: message.text },
      "[dev] email logged (RESEND_API_KEY not set)",
    )
    return { id: null, logged: true }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      headers: message.headers,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "<unreadable>")
    logger.error(
      { status: response.status, detail, to: message.to },
      "resend send failed",
    )
    throw new Error(`Resend ${response.status}: ${detail.slice(0, 200)}`)
  }

  const json = (await response.json()) as { id?: string }
  return { id: json.id ?? null, logged: false }
}
