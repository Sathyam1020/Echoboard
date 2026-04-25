"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Check, FileText, Upload } from "lucide-react"
import { useState } from "react"

import { SettingsSection } from "@/components/settings/section-card"

type Step = 1 | 2 | 3 | 4 | 5

export default function ImportPage() {
  const [step, setStep] = useState<Step>(1)
  const [source, setSource] = useState<"csv" | "canny" | null>(null)

  return (
    <SettingsSection
      title="Import feedback"
      description="Bring posts in from a CSV or Canny export. Mappings + dry-run + final import. Coming soon."
    >
      <ol className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
        {[
          "Source",
          "Upload",
          "Map",
          "Review",
          "Confirm",
        ].map((label, idx) => {
          const n = (idx + 1) as Step
          const done = step > n
          const current = step === n
          return (
            <li
              key={label}
              className={cn(
                "inline-flex items-center gap-1.5",
                idx > 0 && "before:mr-1 before:text-border before:content-['→']",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full border text-[10px] font-mono tabular-nums",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : current
                      ? "border-foreground text-foreground"
                      : "border-border",
                )}
              >
                {done ? <Check className="size-3" aria-hidden /> : n}
              </span>
              <span
                className={cn(
                  current && "font-medium text-foreground",
                  done && "text-foreground",
                )}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>

      {step === 1 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setSource("csv")
              setStep(2)
            }}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:border-foreground/30",
              source === "csv" && "border-primary",
            )}
          >
            <FileText className="size-5 text-muted-foreground" aria-hidden />
            <div className="text-[13.5px] font-medium">CSV file</div>
            <p className="text-[12px] text-muted-foreground">
              Generic spreadsheet export. We'll map your columns to title,
              description, status, and votes.
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setSource("canny")
              setStep(2)
            }}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:border-foreground/30",
              source === "canny" && "border-primary",
            )}
          >
            <Upload className="size-5 text-muted-foreground" aria-hidden />
            <div className="text-[13.5px] font-medium">Canny export</div>
            <p className="text-[12px] text-muted-foreground">
              Paste your Canny export JSON. We migrate posts, votes, comments,
              and statuses.
            </p>
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-3">
          <div
            aria-disabled="true"
            className="flex h-32 cursor-not-allowed items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-[13px] text-muted-foreground opacity-60"
          >
            Drop file or click to upload — coming soon
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button size="sm" disabled title="Coming soon">
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 || step === 4 || step === 5 ? (
        <p className="text-[13px] text-muted-foreground">
          Step {step} preview not implemented in v1 — full import flow lands
          alongside the CSV parser.
        </p>
      ) : null}
    </SettingsSection>
  )
}
