"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"
import { useState, useTransition } from "react"

import { useUpdateWidgetConfigMutation } from "@/hooks/use-widget-config"
import { ApiError } from "@/lib/http/api-error"

export type WidgetConfig = {
  color: string | null
  position: "bottom-right" | "bottom-left"
  buttonText: string
  showBranding: boolean
  supportEnabled: boolean
}

export function WidgetCustomizerForm({
  boardId,
  initial,
  onSaved,
}: {
  boardId: string
  initial: WidgetConfig
  onSaved: (next: WidgetConfig) => void
}) {
  const [color, setColor] = useState(initial.color ?? "")
  const [position, setPosition] = useState(initial.position)
  const [buttonText, setButtonText] = useState(initial.buttonText)
  const [showBranding, setShowBranding] = useState(initial.showBranding)
  const [supportEnabled, setSupportEnabled] = useState(initial.supportEnabled)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const mutation = useUpdateWidgetConfigMutation(boardId)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const trimmed = color.trim()
        if (trimmed && !/^#?[0-9a-fA-F]{6}$/.test(trimmed)) {
          throw new Error("Color must be a 6-digit hex (e.g. #0F6E56)")
        }
        await mutation.mutateAsync({
          color: trimmed === "" ? null : trimmed,
          position,
          buttonText: buttonText.trim(),
          showBranding,
          supportEnabled,
        })
        onSaved({
          color: trimmed === "" ? null : trimmed.startsWith("#") ? trimmed : `#${trimmed}`,
          position,
          buttonText: buttonText.trim(),
          showBranding,
          supportEnabled,
        })
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Something went wrong",
        )
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="widget-color">Brand color</Label>
          <div className="flex gap-2">
            <span
              aria-hidden
              className="size-9 shrink-0 rounded-md border border-border"
              style={{
                backgroundColor: color.trim()
                  ? color.trim().startsWith("#")
                    ? color.trim()
                    : `#${color.trim()}`
                  : "var(--primary)",
              }}
            />
            <Input
              id="widget-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#0F6E56 (defaults to primary)"
              maxLength={7}
              className="font-mono"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="widget-button-text">Button label</Label>
          <Input
            id="widget-button-text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder="Feedback"
            maxLength={24}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Position</Label>
        <div
          role="radiogroup"
          className="inline-flex rounded-md border border-border bg-card p-0.5"
        >
          {(["bottom-left", "bottom-right"] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={position === p}
              onClick={() => setPosition(p)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-[12.5px] transition-colors",
                position === p
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p === "bottom-left" ? "Bottom left" : "Bottom right"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border-soft px-3 py-2.5">
        <div>
          <div className="text-[13px] font-medium">
            Show "Powered by Echoboard"
          </div>
          <p className="text-[11.5px] text-muted-foreground">
            Disable on Pro plans to white-label the widget.
          </p>
        </div>
        <Switch checked={showBranding} onCheckedChange={setShowBranding} />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border-soft px-3 py-2.5">
        <div>
          <div className="text-[13px] font-medium">Enable support chat</div>
          <p className="text-[11.5px] text-muted-foreground">
            Adds a "Support" tab to the widget. Visitors can message your team
            directly; replies appear in /dashboard/support.
          </p>
        </div>
        <Switch
          checked={supportEnabled}
          onCheckedChange={setSupportEnabled}
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
