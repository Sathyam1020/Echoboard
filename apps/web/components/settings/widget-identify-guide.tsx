"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Zap,
} from "lucide-react"
import { type ReactNode, useState, useTransition } from "react"
import { toast } from "sonner"

import {
  useRegenerateIdentifyKeyMutation,
  useUpdateWorkspaceSettingsMutation,
} from "@/hooks/use-workspaces"
import { ApiError } from "@/lib/http/api-error"

// ── Code samples ─────────────────────────────────────────────────────────

const UNSIGNED_SAMPLE = `// Anywhere on your site, AFTER your <script src="/widget.js"> has loaded
// and AFTER your user is signed in:
echoboard.identify({
  externalId: user.id,        // your stable user id
  email:      user.email,
  name:       user.name,
  // optional:
  avatarUrl:  user.avatarUrl,
})`

const HMAC_NODE = `import { createHmac } from "node:crypto"

const SECRET = process.env.ECHOBOARD_IDENTIFY_SECRET

export function signIdentity(user) {
  const payload = Buffer.from(JSON.stringify({
    externalId: user.id,
    email:      user.email,
    name:       user.name,
    exp:        Math.floor(Date.now() / 1000) + 600, // 10-min TTL
  })).toString("base64url")
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url")
  return \`\${payload}.\${sig}\`
}`

const HMAC_PYTHON = `import base64, hashlib, hmac, json, os, time

SECRET = os.environ["ECHOBOARD_IDENTIFY_SECRET"]

def sign_identity(user):
    payload = base64.urlsafe_b64encode(json.dumps({
        "externalId": user["id"],
        "email":      user.get("email"),
        "name":       user.get("name"),
        "exp":        int(time.time()) + 600,
    }).encode()).rstrip(b"=").decode()
    sig = base64.urlsafe_b64encode(
        hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).digest()
    ).rstrip(b"=").decode()
    return f"{payload}.{sig}"`

const HMAC_RUBY = `require "openssl"
require "base64"
require "json"

SECRET = ENV.fetch("ECHOBOARD_IDENTIFY_SECRET")

def sign_identity(user)
  payload = Base64.urlsafe_encode64({
    externalId: user[:id],
    email:      user[:email],
    name:       user[:name],
    exp:        Time.now.to_i + 600,
  }.to_json, padding: false)
  sig = Base64.urlsafe_encode64(
    OpenSSL::HMAC.digest("SHA256", SECRET, payload), padding: false
  )
  "#{payload}.#{sig}"
end`

const HMAC_PHP = `<?php
$secret = getenv('ECHOBOARD_IDENTIFY_SECRET');

function sign_identity($user, $secret) {
    $payload = rtrim(strtr(base64_encode(json_encode([
        'externalId' => $user['id'],
        'email'      => $user['email'] ?? null,
        'name'       => $user['name']  ?? null,
        'exp'        => time() + 600,
    ])), '+/', '-_'), '=');
    $sig = rtrim(strtr(base64_encode(
        hash_hmac('sha256', $payload, $secret, true)
    ), '+/', '-_'), '=');
    return "$payload.$sig";
}`

const HMAC_FRONTEND = `// Your backend serializes the signed token onto the page
// (e.g. via a script tag or fetch from /me). Then on the frontend:
echoboard.identify({ token: signedToken })`

const HMAC_LANGS = [
  { id: "node", label: "Node.js", code: HMAC_NODE },
  { id: "python", label: "Python", code: HMAC_PYTHON },
  { id: "ruby", label: "Ruby", code: HMAC_RUBY },
  { id: "php", label: "PHP", code: HMAC_PHP },
] as const

const METHODS = [
  {
    id: "guest" as const,
    label: "Guest",
    icon: UserPlus,
    tagline: "No setup",
    summary:
      "The default. Visitors enter their email + name on the first submit, vote, or comment. Saved as a 1st-party cookie so the widget remembers them on return visits.",
  },
  {
    id: "unsigned" as const,
    label: "Auto-identify",
    icon: Zap,
    tagline: "1 line of JS",
    summary:
      "When your user is already signed into your product, call eb.identify with their identity to skip the email gate.",
  },
  {
    id: "hmac" as const,
    label: "HMAC (signed)",
    icon: ShieldCheck,
    tagline: "Production-grade",
    summary:
      "Same UX as auto-identify, but the identity is signed by your backend with a shared secret. Browser-side impersonation is impossible.",
  },
]

// ── Component ────────────────────────────────────────────────────────────

export function WidgetIdentifyGuide({
  initialSecret,
  initialRequireSigned,
}: {
  initialSecret: string | null
  initialRequireSigned: boolean
}) {
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("guest")
  const [hmacLang, setHmacLang] = useState<(typeof HMAC_LANGS)[number]["id"]>("node")

  return (
    <div className="flex flex-col gap-5">
      {/* Method picker — three cards stacked on mobile, three columns on sm+. */}
      <div role="tablist" className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {METHODS.map((m) => {
          const active = method === m.id
          const Icon = m.icon
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMethod(m.id)}
              className={cn(
                "flex flex-col gap-1.5 rounded-xl border px-4 py-3.5 text-left transition-colors",
                active
                  ? "border-foreground/30 bg-card"
                  : "border-border bg-card/60 hover:bg-card",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                <div className="text-[13.5px] font-medium">{m.label}</div>
                <span className="ml-auto font-mono text-[10.5px] tracking-wide text-muted-foreground uppercase">
                  {m.tagline}
                </span>
              </div>
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                {m.summary}
              </p>
            </button>
          )
        })}
      </div>

      {/* Selected-method body. */}
      {method === "guest" ? <GuestPanel /> : null}
      {method === "unsigned" ? <UnsignedPanel /> : null}
      {method === "hmac" ? (
        <HmacPanel
          lang={hmacLang}
          onLang={setHmacLang}
          secret={initialSecret}
          initialRequireSigned={initialRequireSigned}
        />
      ) : null}
    </div>
  )
}

// ── Panels ───────────────────────────────────────────────────────────────

function StepCard({
  step,
  title,
  children,
}: {
  step: number
  title: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-medium tabular-nums text-muted-foreground">
          {step}
        </span>
        <h3 className="text-[13px] font-medium">{title}</h3>
      </header>
      <div className="flex flex-col gap-3 px-4 py-4 text-[13px] leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 px-4 py-3 font-mono text-[12px] leading-[1.65]">
        <code>{children}</code>
      </pre>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={copy}
        className="absolute right-2 top-2 h-7 gap-1.5 px-2 text-[11px]"
      >
        {copied ? (
          <>
            <Check className="size-3" aria-hidden /> Copied
          </>
        ) : (
          <>
            <Copy className="size-3" aria-hidden /> Copy
          </>
        )}
      </Button>
    </div>
  )
}

function GuestPanel() {
  return (
    <StepCard step={1} title="Nothing else to do">
      <p>
        With the install snippet above on your page, the widget already works
        in guest mode. Visitors see an email + name prompt the first time they
        try to submit, vote, or comment. The identity is stored as a 1st-party
        cookie so they don&apos;t see the prompt again on return visits.
      </p>
      <p className="text-muted-foreground">
        Switch to <strong className="text-foreground">Auto-identify</strong>{" "}
        when your users are already signed into your product and you want to
        skip the email step.
      </p>
    </StepCard>
  )
}

function UnsignedPanel() {
  return (
    <div className="flex flex-col gap-3">
      <StepCard
        step={1}
        title="Call eb.identify after your user signs in"
      >
        <p>
          Anywhere on your frontend, after the install snippet has loaded and
          your user is authenticated, call:
        </p>
        <CodeBlock>{UNSIGNED_SAMPLE}</CodeBlock>
        <p className="text-muted-foreground">
          The widget&apos;s &quot;Submit as …&quot; line and identity-required
          prompts disappear immediately. Switching users is just another
          identify call; signing out is{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11.5px]">
            echoboard.identify(null)
          </code>
          .
        </p>
      </StepCard>

      <div className="rounded-xl border border-amber-300/30 bg-amber-50/40 px-4 py-3 text-[12.5px] leading-relaxed dark:bg-amber-500/5">
        <strong className="text-foreground">Heads up:</strong> unsigned
        identify is convenient but trusts the browser. A determined visitor
        could call <code className="font-mono">eb.identify</code> in the
        console with someone else&apos;s id. Use{" "}
        <strong className="text-foreground">HMAC (signed)</strong> if that
        matters to you — same one-line frontend call, just signed by your
        backend.
      </div>
    </div>
  )
}

function HmacPanel({
  lang,
  onLang,
  secret,
  initialRequireSigned,
}: {
  lang: (typeof HMAC_LANGS)[number]["id"]
  onLang: (id: (typeof HMAC_LANGS)[number]["id"]) => void
  secret: string | null
  initialRequireSigned: boolean
}) {
  const sample = HMAC_LANGS.find((l) => l.id === lang)!.code
  return (
    <div className="flex flex-col gap-3">
      <StepCard
        step={1}
        title="Generate or copy your identify secret"
      >
        <p>
          A workspace-wide HMAC key. Keep it on your{" "}
          <strong className="text-foreground">backend</strong> — anyone with
          this secret can impersonate any user on your workspace.
        </p>
        <SecretRow secret={secret} />
      </StepCard>

      <StepCard
        step={2}
        title="Sign an identity token on your backend"
      >
        <p>
          Use the secret from step 1 to sign a short-lived JSON payload. Pick
          your stack:
        </p>
        <div role="tablist" className="inline-flex rounded-md border border-border bg-card p-0.5 self-start">
          {HMAC_LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={lang === l.id}
              onClick={() => onLang(l.id)}
              className={cn(
                "rounded-sm px-3 py-1 text-[12px] transition-colors",
                lang === l.id
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
        <CodeBlock>{sample}</CodeBlock>
      </StepCard>

      <StepCard
        step={3}
        title="Pass the signed token to the widget"
      >
        <p>
          Serialize the signed token onto the page (server-rendered
          <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-[11.5px]">
            {`<script>`}
          </code>
          tag, or a small <code className="font-mono">/api/me</code> endpoint
          your frontend reads). Then:
        </p>
        <CodeBlock>{HMAC_FRONTEND}</CodeBlock>
        <p className="text-muted-foreground">
          The widget posts the token to the backend, which verifies the
          signature and the
          <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-[11.5px]">
            exp
          </code>
          claim. Tokens expire after 15 minutes max — sign a fresh one per
          page load or per session.
        </p>
      </StepCard>

      <StepCard
        step={4}
        title="(Optional) Reject unsigned identify workspace-wide"
      >
        <RequireSignedToggle initialValue={initialRequireSigned} />
      </StepCard>
    </div>
  )
}

// ── Subcomponents (secret reveal + require-signed toggle) ────────────────

function SecretRow({ secret }: { secret: string | null }) {
  const [reveal, setReveal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()
  const [localSecret, setLocalSecret] = useState(secret ?? "")

  const regenMutation = useRegenerateIdentifyKeyMutation()

  function copy() {
    if (!localSecret) return
    navigator.clipboard.writeText(localSecret).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  function regenerate() {
    startTransition(async () => {
      try {
        const res = await regenMutation.mutateAsync()
        setLocalSecret(res.settings.identifySecretKey ?? "")
        toast.success("Identify secret regenerated", {
          description:
            "Update your backend's ECHOBOARD_IDENTIFY_SECRET env var, then redeploy.",
        })
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Failed to regenerate",
        )
      }
    })
  }

  const masked = localSecret
    ? "•".repeat(Math.min(localSecret.length, 64))
    : "(none)"

  return (
    <div className="flex flex-col gap-2">
      <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 px-4 py-2.5 font-mono text-[12px] tracking-[0.02em] break-all">
        {reveal ? localSecret || "(none)" : masked}
      </pre>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setReveal((v) => !v)}
          className="h-8 gap-1.5"
          title={reveal ? "Hide" : "Reveal"}
        >
          {reveal ? (
            <EyeOff className="size-3.5" aria-hidden />
          ) : (
            <Eye className="size-3.5" aria-hidden />
          )}
          {reveal ? "Hide" : "Reveal"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={copy}
          className="h-8 gap-1.5"
          disabled={!localSecret}
        >
          {copied ? (
            <>
              <Check className="size-3.5" aria-hidden /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" aria-hidden /> Copy
            </>
          )}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              disabled={pending}
            >
              <RefreshCw
                className={cn("size-3.5", pending && "animate-spin")}
                aria-hidden
              />
              Regenerate
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Regenerate identify secret?</AlertDialogTitle>
              <AlertDialogDescription>
                Old signed tokens stop validating immediately. Update your
                backend&apos;s{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11.5px]">
                  ECHOBOARD_IDENTIFY_SECRET
                </code>{" "}
                env var, then redeploy.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  regenerate()
                }}
              >
                Regenerate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

function RequireSignedToggle({ initialValue }: { initialValue: boolean }) {
  const [requireSigned, setRequireSigned] = useState(initialValue)
  const [pending, startTransition] = useTransition()

  const settingsMutation = useUpdateWorkspaceSettingsMutation()

  function onChange(next: boolean) {
    setRequireSigned(next)
    startTransition(async () => {
      try {
        await settingsMutation.mutateAsync({ requireSignedIdentify: next })
        toast.success(
          next
            ? "Signed identify tokens are now required"
            : "Unsigned identify is allowed again",
        )
      } catch (err) {
        setRequireSigned(!next)
        toast.error(
          err instanceof ApiError ? err.message : "Failed to update setting",
        )
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p>
          When on, the widget rejects unsigned{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11.5px]">
            eb.identify(...)
          </code>{" "}
          calls workspace-wide. Use this on sensitive workspaces once your
          backend is reliably signing tokens.
        </p>
      </div>
      <Switch
        checked={requireSigned}
        onCheckedChange={onChange}
        disabled={pending}
      />
    </div>
  )
}
