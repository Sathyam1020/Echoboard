import { env } from "../../../config/env.js"

export type InviteEmailContent = {
  inviterName: string
  workspaceName: string
  acceptUrl: string
  role: string
}

export function inviteEmailText(c: InviteEmailContent): string {
  return [
    `${c.inviterName} invited you to join ${c.workspaceName} on echoboard as a ${c.role}.`,
    "",
    `Accept the invite:`,
    c.acceptUrl,
    "",
    `If you weren't expecting this email, you can ignore it — the invite expires in 7 days.`,
  ].join("\n")
}

export function inviteEmailHtml(c: InviteEmailContent): string {
  // Plain HTML — keeps the wire small + the templates dependency-free.
  // We don't pull React Email here; the surface area is too small to justify it.
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0a0a0a;">
      <h1 style="font-size:18px;font-weight:500;margin:0 0 16px;">You're invited to ${escape(c.workspaceName)}</h1>
      <p style="font-size:14px;line-height:1.6;margin:0 0 16px;color:#525252;">
        ${escape(c.inviterName)} invited you to join <strong>${escape(c.workspaceName)}</strong> on echoboard as a <strong>${escape(c.role)}</strong>.
      </p>
      <p style="margin:24px 0;">
        <a href="${escape(c.acceptUrl)}" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;font-weight:500;">Accept invite</a>
      </p>
      <p style="font-size:12px;line-height:1.6;color:#737373;margin:32px 0 0;">
        If you weren't expecting this email, you can ignore it — the invite expires in 7 days.<br />
        Sent from ${escape(env.APP_URL)}.
      </p>
    </div>
  `.trim()
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
