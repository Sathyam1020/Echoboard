"use client"

// Tooltip — animate-ui Radix primitive (motion-driven open/close).
// Public API matches the previous shadcn tooltip 1:1 so existing
// callers (`Tooltip`, `TooltipTrigger`, `TooltipContent`,
// `TooltipProvider`) keep working unchanged.

import * as React from "react"

import {
  Tooltip as TooltipBase,
  TooltipContent as TooltipContentPrimitive,
  TooltipPortal as TooltipPortalPrimitive,
  TooltipProvider,
  TooltipTrigger as TooltipTriggerPrimitive,
  TooltipArrow as TooltipArrowPrimitive,
  type TooltipProps as TooltipBaseProps,
  type TooltipTriggerProps as TooltipTriggerBaseProps,
  type TooltipContentProps as TooltipContentBaseProps,
} from "@workspace/ui/animate-ui/primitives/radix-tooltip"
import { cn } from "@workspace/ui/lib/utils"

function Tooltip(props: TooltipBaseProps) {
  return <TooltipBase {...props} />
}

function TooltipTrigger(props: TooltipTriggerBaseProps) {
  return <TooltipTriggerPrimitive {...props} />
}

function TooltipContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: TooltipContentBaseProps) {
  return (
    <TooltipPortalPrimitive>
      <TooltipContentPrimitive
        sideOffset={sideOffset}
        className={cn(
          "z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipArrowPrimitive className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
      </TooltipContentPrimitive>
    </TooltipPortalPrimitive>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
