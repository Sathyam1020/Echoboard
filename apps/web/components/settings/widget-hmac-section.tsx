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
import { Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  useRegenerateIdentifyKeyMutation,
  useUpdateWorkspaceSettingsMutation,
} from "@/hooks/use-workspaces"
import { ApiError } from "@/lib/http/api-error"

const NODE_SAMPLE = `import { createHmac } from "node:crypto"
const SECRET = process.env.ECHOBOARD_IDENTIFY_SECRET
function signIdentity(user) {
  const payload = Buffer.from(JSON.stringify({
    externalId: user.id,
    email: user.email,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + 600, // 10-min TTL
  })).toString("base64url")
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url")
  return \`\${payload}.\${sig}\`
}`

const PYTHON_SAMPLE = `import base64, hashlib, hmac, json, os, time
SECRET = os.environ["ECHOBOARD_IDENTIFY_SECRET"]
def sign_identity(user):
    payload = base64.urlsafe_b64encode(json.dumps({
        "externalId": user["id"],
        "email": user.get("email"),
        "name": user.get("name"),
        "exp": int(time.time()) + 600,
    }).encode()).rstrip(b"=").decode()
    sig = base64.urlsafe_b64encode(
        hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).digest()
    ).rstrip(b"=").decode()
    return f"{payload}.{sig}"`

const RUBY_SAMPLE = `require "openssl"
require "base64"
require "json"
SECRET = ENV.fetch("ECHOBOARD_IDENTIFY_SECRET")
def sign_identity(user)
  payload = Base64.urlsafe_encode64({
    externalId: user[:id],
    email:      user[:email],
    name:       user[:name],
    exp:        Time.now.to_i + 600
  }.to_json, padding: false)
  sig = Base64.urlsafe_encode64(
    OpenSSL::HMAC.digest("SHA256", SECRET, payload), padding: false
  )
  "#{payload}.#{sig}"
end`

const PHP_SAMPLE = `<?php
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

const TABS = [
  { id: "node", label: "Node.js", code: NODE_SAMPLE },
  { id: "python", label: "Python", code: PYTHON_SAMPLE },
  { id: "ruby", label: "Ruby", code: RUBY_SAMPLE },
  { id: "php", label: "PHP", code: PHP_SAMPLE },
] as const

export function WidgetHmacSection({
  initialSecret,
  initialRequireSigned,
}: {
  initialSecret: string | null
  initialRequireSigned: boolean
}) {
  const [secret, setSecret] = useState(initialSecret ?? "")
  const [requireSigned, setRequireSigned] = useState(initialRequireSigned)
  const [reveal, setReveal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("node")
  const [isRegenerating, startRegen] = useTransition()
  const [isToggling, startToggle] = useTransition()

  const regenMutation = useRegenerateIdentifyKeyMutation()
  const settingsMutation = useUpdateWorkspaceSettingsMutation()

  function regenerate() {
    startRegen(async () => {
      try {
        const res = await regenMutation.mutateAsync()
        setSecret(res.settings.identifySecretKey ?? "")
        toast.success("Identify secret regenerated", {
          description:
            "Update your backend's ECHOBOARD_IDENTIFY_SECRET env var.",
        })
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Failed to regenerate",
        )
      }
    })
  }

  function toggleRequireSigned(next: boolean) {
    setRequireSigned(next)
    startToggle(async () => {
      try {
        await settingsMutation.mutateAsync({ requireSignedIdentify: next })
        toast.success(
          next
            ? "Signed identify tokens are now required"
            : "Unsigned identify is allowed again",
        )
      } catch (err) {
        // Roll back
        setRequireSigned(!next)
        toast.error(
          err instanceof ApiError ? err.message : "Failed to update setting",
        )
      }
    })
  }

  async function copySecret() {
    if (!secret) return
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const masked = secret ? "•".repeat(Math.min(secret.length, 64)) : "(none)"

  const sample = TABS.find((t) => t.id === tab)!.code

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[13px] font-medium">Identify secret</div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setReveal((v) => !v)}
              className="h-7 gap-1.5 px-2"
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
              onClick={copySecret}
              className="h-7 gap-1.5"
              disabled={!secret}
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
                  className="h-7 gap-1.5"
                  disabled={isRegenerating}
                >
                  <RefreshCw
                    className={cn(
                      "size-3.5",
                      isRegenerating && "animate-spin",
                    )}
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
                    backend's <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11.5px]">ECHOBOARD_IDENTIFY_SECRET</code> env var, then redeploy.
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
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/30 px-4 py-3 font-mono text-[12px] tracking-[0.02em] break-all">
          {reveal ? secret || "(none)" : masked}
        </pre>
        <p className="text-[11.5px] text-muted-foreground">
          Keep this on your <strong>backend</strong>. Anyone with this secret
          can impersonate any user on your workspace.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border-soft px-3 py-2.5">
        <div>
          <div className="text-[13px] font-medium">
            Require signed identity tokens
          </div>
          <p className="text-[11.5px] text-muted-foreground">
            When on, unsigned <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">eb.identify(...)</code> calls are rejected. Use this on
            sensitive workspaces.
          </p>
        </div>
        <Switch
          checked={requireSigned}
          onCheckedChange={toggleRequireSigned}
          disabled={isToggling}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-[13px] font-medium">
          Generate a token on your backend
        </div>
        <div
          role="tablist"
          className="inline-flex rounded-md border border-border bg-card p-0.5"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-sm px-3 py-1 text-[12px] transition-colors",
                tab === t.id
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/30 px-4 py-3 font-mono text-[12px] leading-[1.6]">
          <code>{sample}</code>
        </pre>
        <p className="text-[11.5px] text-muted-foreground">
          On the frontend:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11.5px]">
            window.echoboard.identify({"{ token: signedToken }"})
          </code>
        </p>
      </div>
    </div>
  )
}
