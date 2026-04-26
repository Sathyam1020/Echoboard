import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

import { FadeIn } from "./fade-in"

// Landing FAQ. Five high-intent questions a SaaS founder evaluating
// the tool actually has — pricing reality, the no-login claim,
// migration, integrations, when to upgrade. Plain visual treatment
// (no JSON-LD here) — the SEO-friendly variant lives in
// `components/marketing/faq-accordion.tsx` and gets used on
// alternative pages where rich-result eligibility matters.
type Faq = { q: string; a: string }

const FAQS: Faq[] = [
  {
    q: "Is the free plan really free forever?",
    a: "Yes. The free plan covers unlimited users, unlimited posts, one public board, the public roadmap, the changelog, and the embeddable widget — no time limit and no credit card required. Pro adds multiple boards, custom domains, MRR-weighted voting, and integrations.",
  },
  {
    q: "How does the no-login widget work?",
    a: "You drop a one-line script tag on your site. Visitors click the button, submit feedback with just an email — no password, no account creation, no confirmation flow. We cookie them so subsequent submissions skip the email field, and your team sees every submission attached to the visitor's identity.",
  },
  {
    q: "Can I migrate my Canny posts?",
    a: "Yes. Canny offers a CSV export of posts and votes from your admin settings. Drop it into our import flow in workspace settings — most teams complete migration in under 30 minutes. Voters get a one-time email with a link to keep following their submissions on the new home.",
  },
  {
    q: "What integrations do you support today?",
    a: "Public roadmap, changelog, and the embeddable widget all ship in the free plan. Slack, Linear, Jira, and webhooks are on the Pro roadmap and rolling out as we go. Until then, most teams pair the workspace with a Zapier hook for one-off automations.",
  },
  {
    q: "When should I upgrade to Pro?",
    a: "When you need multiple boards (one product, multiple boards — e.g. Feature requests + Bugs + Suggestions), a custom domain (feedback.yourdomain.com), removal of our branding, or MRR-weighted voting tied to Stripe. Most teams stay on free until one of those becomes blocking.",
  },
]

export function LandingFaq() {
  return (
    <section className="px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <div className="mb-10 text-center">
            <p className="text-xs tracking-widest text-muted-foreground/60 uppercase">
              Frequently asked
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight -tracking-[0.01em] sm:text-3xl">
              The questions we hear most
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={80}>
          <Accordion
            type="single"
            collapsible
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            {FAQS.map((faq, idx) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${idx}`}
                className="border-border-soft px-5 last:border-b-0"
              >
                <AccordionTrigger className="py-4 text-left text-[14px] font-medium hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-[13.5px] leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  )
}
