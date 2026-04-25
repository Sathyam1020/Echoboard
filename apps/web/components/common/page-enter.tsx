"use client"

import { motion } from "motion/react"
import { type ReactNode } from "react"

// Subtle "page just landed" animation. Used at the root of each page's
// content so navigation between routes feels less abrupt than a hard cut.
// No exit animation — Next.js App Router doesn't keep the previous tree
// mounted long enough for one to play, and a fake exit just adds latency.
export function PageEnter({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
