import {
  getCompetitor,
  echoboard,
  type Competitor,
} from "@/content/alternatives"

// Comparison pages are X-vs-Y pages. The bulk of them are
// `<competitor>-vs-echoboard` because that's the search-volume
// keyword pattern people actually type. We keep the slug fixed in
// data so URLs are stable even if we later add competitor-vs-competitor
// pages.
//
// Like alternatives, a comparison only goes live once both competitor
// entries have `verifiedAt`. The route's `generateStaticParams` filters
// out comparisons where either side is unverified.

export type ComparisonVerdict = {
  // 3-5 bullets per side. Reads as "<competitor> wins on...".
  leftWins: string[]
  rightWins: string[]
  // One sentence summary surfacing the key trade-off.
  bottomLine: string
}

export type Comparison = {
  /** URL slug, e.g. "canny-vs-echoboard". Order matters for canonical. */
  slug: string
  /** Left-hand competitor slug (matches a `competitors` key). */
  leftSlug: string
  /** Right-hand competitor slug — usually "echoboard". */
  rightSlug: string
  /** ISO date of last manual review of the verdict text. */
  verifiedAt: string | null
  verdict: ComparisonVerdict
  faqs: { question: string; answer: string }[]
}

export const comparisons: Record<string, Comparison> = {
  "canny-vs-echoboard": {
    slug: "canny-vs-echoboard",
    leftSlug: "canny",
    rightSlug: "echoboard",
    verifiedAt: "2026-04-26",
    verdict: {
      leftWins: [
        "Mature integrations: Jira, Linear, Salesforce, HubSpot all on Pro",
        "Autopilot AI auto-deduplicates incoming feedback",
        "Battle-tested with 9 years in market and large customer base",
        "Advanced segmentation by MRR, plan, custom attributes",
      ],
      rightWins: [
        "Free for unlimited users — Canny caps free at 25 tracked users",
        "Flat $49/mo Pro vs Canny's $79/mo + per-user scaling",
        "No-login feedback widget — Canny requires user accounts",
        "Public roadmap and changelog included on every plan",
      ],
      bottomLine:
        "Canny is the safer pick if you need every integration day one and have budget. EchoBoard wins on price-to-value once your audience grows past Canny's free tier.",
    },
    faqs: [
      {
        question: "Is EchoBoard a real Canny replacement?",
        answer:
          "For 80% of teams, yes. EchoBoard covers the core feedback workflow Canny is famous for — boards, roadmap, changelog, widget — with flat pricing instead of per-tracked-user. Canny still wins if you specifically need its mature Jira/Salesforce integrations on day one.",
      },
      {
        question: "Can I import my Canny posts into EchoBoard?",
        answer:
          "Yes. Canny offers a CSV export of posts and votes from your admin settings. Drop it into EchoBoard's import flow in workspace settings — most teams complete migration in under 30 minutes.",
      },
      {
        question: "What's the price difference at 1,000 users?",
        answer:
          "Canny's Pro plan covers up to 1,000 tracked users at $79/month (paid yearly) — $948/year. EchoBoard's flat $49/month Pro plan is $588/year, with the same 1,000 users free. The gap widens fast above that threshold.",
      },
    ],
  },

  "userjot-vs-echoboard": {
    slug: "userjot-vs-echoboard",
    leftSlug: "userjot",
    rightSlug: "echoboard",
    verifiedAt: "2026-04-26",
    verdict: {
      leftWins: [
        "Built-in AI features for triage and summarization",
        "Native Linear integration on Starter tier",
        "More mature product with a year of polish",
        "Custom domain available on every paid tier",
      ],
      rightWins: [
        "Free plan includes the widget — UserJot's free tier excludes integrations and custom domain",
        "No-login feedback submission via email-only widget",
        "Permanent free plan with unlimited boards (UserJot caps free at 2)",
        "$49/mo Pro vs UserJot's $59/mo Professional",
      ],
      bottomLine:
        "Both are flat-rate Canny alternatives. UserJot edges ahead on AI and a year of maturity; EchoBoard wins on widget freedom and the no-login submission flow.",
    },
    faqs: [
      {
        question: "Are UserJot and EchoBoard both flat-rate?",
        answer:
          "Yes. Neither charges per tracked user or per seat. The difference is what each free tier includes — EchoBoard ships the widget on free; UserJot gates it behind paid plans.",
      },
      {
        question: "Which has more integrations?",
        answer:
          "UserJot has more shipped integrations today (Slack, Linear). EchoBoard ships those in coming Pro releases.",
      },
      {
        question: "What about AI features?",
        answer:
          "UserJot has built-in AI for triage and summarization. EchoBoard ships AI features in coming Pro releases.",
      },
    ],
  },

  "featurebase-vs-echoboard": {
    slug: "featurebase-vs-echoboard",
    leftSlug: "featurebase",
    rightSlug: "echoboard",
    verifiedAt: "2026-04-26",
    verdict: {
      leftWins: [
        "All-in-one suite: feedback + roadmap + changelog + help center + surveys",
        "MRR-weighted voting via Stripe and HubSpot",
        "AI agents resolve support tickets automatically",
        "Mature Jira integration on paid tiers",
      ],
      rightWins: [
        "Flat pricing — Featurebase scales per seat ($29-$99/seat/month)",
        "No AI per-resolution fees ($0.29 each on Featurebase)",
        "Free plan includes more than Featurebase's 1-seat free tier",
        "No-login widget — Featurebase requires user accounts",
      ],
      bottomLine:
        "Featurebase is the more capable suite if you also need a help center and AI support. EchoBoard wins on pricing predictability for teams that just need feedback infrastructure.",
    },
    faqs: [
      {
        question: "Is EchoBoard a Featurebase alternative?",
        answer:
          "Yes, for the feedback portion. Featurebase bundles feedback with a help center and AI support agent, which EchoBoard doesn't currently offer. If feedback is your core need, EchoBoard's flat pricing is significantly cheaper.",
      },
      {
        question: "How does pricing compare at 5 seats?",
        answer:
          "Featurebase Growth is $29/seat/month — $145/month for 5 seats ($1,740/year). EchoBoard Pro is flat $49/month ($588/year) regardless of seat count. The math gets steeper as you add admins.",
      },
      {
        question: "Does EchoBoard have MRR-weighted voting?",
        answer:
          "Not yet — it's on the Pro roadmap. If MRR-weighted prioritization is a hard requirement today, Featurebase ships it.",
      },
    ],
  },

  "nolt-vs-echoboard": {
    slug: "nolt-vs-echoboard",
    leftSlug: "nolt",
    rightSlug: "echoboard",
    verifiedAt: "2026-04-26",
    verdict: {
      leftWins: [
        "Trello-style kanban UI that's instantly familiar",
        "Anonymous voting toggle for Discord-driven communities",
        "Mature integrations: Jira, Slack, Linear, Microsoft Teams",
        "Stable since 2018 with low churn risk",
      ],
      rightWins: [
        "Permanent free plan — Nolt has only a 10-day trial",
        "Built-in changelog (Nolt has no changelog product)",
        "EchoBoard's $49/mo Pro covers multiple boards; Nolt charges $69/mo for 5 boards",
        "Modern mobile-first UI",
      ],
      bottomLine:
        "Nolt is the right pick if you specifically want a Trello-style board with mature integrations. EchoBoard wins on free-tier generosity and built-in changelog.",
    },
    faqs: [
      {
        question: "Does EchoBoard work for gaming/Discord communities?",
        answer:
          "Yes. The no-login widget and unlimited free users make it well-suited for community-driven feedback. You can also pre-identify users via email if you've integrated with Discord auth.",
      },
      {
        question: "Why does Nolt not have a free plan?",
        answer:
          "Nolt's pricing is intentionally minimalist — they offer only a 10-day Pro trial instead. EchoBoard takes the opposite approach with a permanent free tier.",
      },
      {
        question: "Can I import Nolt boards to EchoBoard?",
        answer:
          "Nolt supports CSV export of posts and votes. EchoBoard's import flow accepts the standard feedback CSV format.",
      },
    ],
  },

  "fider-vs-echoboard": {
    slug: "fider-vs-echoboard",
    leftSlug: "fider",
    rightSlug: "echoboard",
    verifiedAt: "2026-04-26",
    verdict: {
      leftWins: [
        "Open source — self-host for free with full data ownership",
        "GDPR-friendly with EU operator and self-host option",
        "No vendor lock-in: fork the code, modify it, run it forever",
        "Active GitHub project since 2016",
      ],
      rightWins: [
        "Hosted product — no DevOps to operate Postgres + Go binary",
        "Built-in roadmap and changelog (Fider has neither)",
        "Embeddable widget (Fider has no widget)",
        "Modern UI; Fider's interface feels dated",
      ],
      bottomLine:
        "If self-hosting is a hard requirement, Fider is the only choice. If you want feedback + roadmap + changelog as a hosted product, EchoBoard ships more out of the box.",
    },
    faqs: [
      {
        question: "Can EchoBoard be self-hosted?",
        answer:
          "Not currently. EchoBoard is a hosted product. If self-hosting is mandatory for compliance reasons, Fider is the open-source path.",
      },
      {
        question: "Is Fider really free forever?",
        answer:
          "Yes if you self-host — Fider is open source under MIT. The managed cloud has a free tier capped at 250 feedback items.",
      },
      {
        question: "Why pick EchoBoard over Fider?",
        answer:
          "Speed and feature completeness. EchoBoard ships roadmap, changelog, and widget out of the box; Fider covers boards only. If you don't have DevOps capacity to maintain a self-hosted app, EchoBoard's free hosted plan removes that burden.",
      },
    ],
  },

  "productlift-vs-echoboard": {
    slug: "productlift-vs-echoboard",
    leftSlug: "productlift",
    rightSlug: "echoboard",
    verifiedAt: "2026-04-26",
    verdict: {
      leftWins: [
        "Bundles a knowledge base alongside feedback",
        "MRR-weighted voting via Stripe integration",
        "RICE/ICE/MoSCoW prioritization frameworks built in",
        "22 supported languages out of the box",
      ],
      rightWins: [
        "Permanent free plan — ProductLift only has a 14-day trial",
        "EchoBoard's $49/mo Pro is the same price as ProductLift Pro yearly but more features ship over time",
        "No per-admin fees ($15/mo each on ProductLift)",
        "No-login widget; ProductLift requires user accounts",
      ],
      bottomLine:
        "ProductLift is the right pick if you also need a knowledge base and prioritization frameworks. EchoBoard wins on free-tier generosity and absence of per-admin fees.",
    },
    faqs: [
      {
        question: "What's a knowledge base good for in a feedback tool?",
        answer:
          "ProductLift bundles articles/help content with feedback. If you want one tool for both, that's a real reason to pick them. Most teams using EchoBoard pair it with a separate help center (Notion, Intercom, etc.).",
      },
      {
        question: "Does EchoBoard support RICE prioritization?",
        answer:
          "Not in the UI today — most EchoBoard teams export to a spreadsheet for prioritization. Native RICE/ICE scoring is on the Pro roadmap.",
      },
      {
        question: "What about per-admin fees?",
        answer:
          "ProductLift charges $15/admin/month above the included count (2 on Starter, 5 on Pro). EchoBoard's Pro is flat $49/month with no per-admin fee on the current roadmap.",
      },
    ],
  },

  "upvoty-vs-echoboard": {
    slug: "upvoty-vs-echoboard",
    leftSlug: "upvoty",
    rightSlug: "echoboard",
    verifiedAt: "2026-04-26",
    verdict: {
      leftWins: [
        "Deep white-labeling: custom HTML, CSS, send-from-own-domain emails",
        "Custom SSO available on every paid tier (not just enterprise)",
        "Bootstrapped since 2018 with proven $1M+ ARR",
        "Strong fit for agencies and reseller-style SaaS",
      ],
      rightWins: [
        "Permanent free plan — Upvoty has no free tier",
        "EchoBoard's $49/mo Pro covers multiple boards; Upvoty's Power tier is single-project",
        "No-login widget — Upvoty requires user accounts",
        "Modern mobile-first UI",
      ],
      bottomLine:
        "Upvoty is the right pick for agencies that need deep CSS customization. For most product teams that just need feedback infrastructure, EchoBoard's free tier and modern UI win.",
    },
    faqs: [
      {
        question: "Does EchoBoard support white-labeling?",
        answer:
          "Pro removes EchoBoard branding and supports custom domains. Custom CSS / HTML at the level Upvoty offers is on the roadmap.",
      },
      {
        question: "What if I'm an agency reselling feedback boards?",
        answer:
          "Upvoty's deep white-labeling is genuinely well-suited for that. EchoBoard's Pro tier supports custom domains but isn't yet positioned as a reseller platform.",
      },
      {
        question: "Why does Upvoty not have a free plan?",
        answer:
          "Their pricing model emphasizes flat-rate paid tiers with no usage caps. EchoBoard takes the opposite approach with a permanent free tier and a single Pro upgrade.",
      },
    ],
  },

  "sleekplan-vs-echoboard": {
    slug: "sleekplan-vs-echoboard",
    leftSlug: "sleekplan",
    rightSlug: "echoboard",
    verifiedAt: "2026-04-26",
    verdict: {
      leftWins: [
        "Lowest paid tier in the category at $13/month",
        "NPS and CSAT surveys bundled with feedback",
        "Permanent Indie free plan with unlimited end-users",
        "Native integrations with Intercom, Shopify, GitHub",
      ],
      rightWins: [
        "Flat pricing without per-seat scaling (Sleekplan Business is per-seat-bundled)",
        "No-login widget — Sleekplan requires user accounts",
        "EchoBoard's free plan includes the widget; Sleekplan's Indie does not include public roadmap",
        "Mobile-first UI",
      ],
      bottomLine:
        "Sleekplan is the right pick if you want NPS/CSAT surveys alongside feedback at a low price. EchoBoard wins for teams that just need feedback boards + roadmap + changelog with a no-login widget.",
    },
    faqs: [
      {
        question: "Does EchoBoard do NPS or CSAT surveys?",
        answer:
          "Not currently. If surveys are a hard requirement, Sleekplan ships both. Most EchoBoard teams use a separate tool (Typeform, Hotjar) for surveys.",
      },
      {
        question: "What's the cheapest path to a public roadmap?",
        answer:
          "EchoBoard's free plan includes the public roadmap. Sleekplan's Indie free plan does not — you need Starter ($13/mo) for the public roadmap kanban.",
      },
      {
        question: "Where do they overlap most?",
        answer:
          "Both bundle feedback boards + voting + comments. The differentiation is what each adds: Sleekplan adds surveys; EchoBoard adds the widget and unlimited free admins.",
      },
    ],
  },

  "feature-upvote-vs-echoboard": {
    slug: "feature-upvote-vs-echoboard",
    leftSlug: "feature-upvote",
    rightSlug: "echoboard",
    verifiedAt: "2026-04-26",
    verdict: {
      leftWins: [
        "SAML SSO included on every paid tier (not just enterprise)",
        "Bootstrapped since 2016 with strong stability",
        "Native integrations with Discord, Microsoft Teams, Jira",
        "30-day free trial across all features",
      ],
      rightWins: [
        "Permanent free plan — Feature Upvote has no free tier",
        "EchoBoard $49/mo Pro vs Feature Upvote's $49/board/mo (multiplies linearly)",
        "Built-in changelog (Feature Upvote has no changelog product)",
        "No-login widget; Feature Upvote requires user accounts",
      ],
      bottomLine:
        "Feature Upvote is the right pick if you need a single board, SAML SSO, and you value bootstrapped stability. EchoBoard wins on free tier and multi-board pricing.",
    },
    faqs: [
      {
        question: "Why is per-board pricing a problem?",
        answer:
          "Feature Upvote charges $49/board/month at the Indie tier. Two boards = $98/month. Five boards = $245/month. EchoBoard's flat $49/mo Pro covers multiple boards in a single subscription.",
      },
      {
        question: "Does EchoBoard support SAML SSO?",
        answer:
          "SSO is on the Pro roadmap. If SSO is a hard requirement today, Feature Upvote ships it across all paid tiers.",
      },
      {
        question: "Which has a longer track record?",
        answer:
          "Feature Upvote has been bootstrapped and operating since 2016. EchoBoard launched in 2026 — much newer, but feature velocity is higher as a result.",
      },
    ],
  },

  // ── Head-to-head comparisons (neither side is EchoBoard) ─────────────
  // These exist to capture "X vs Y" search traffic where EchoBoard isn't
  // one of the two — the verdict still ends with a CtaSection pointing
  // at us, so the page is also a top-of-funnel acquisition surface.

  "canny-vs-featurebase": {
    slug: "canny-vs-featurebase",
    leftSlug: "canny",
    rightSlug: "featurebase",
    verifiedAt: "2026-04-26",
    verdict: {
      leftWins: [
        "9 years of polish vs Featurebase's 5 — fewer rough edges",
        "Bigger integration catalog: Salesforce, HubSpot, ClickUp, Azure DevOps",
        "Larger customer base means more battle-tested edge cases",
        "Autopilot AI deduplicates feedback automatically",
      ],
      rightWins: [
        "Featurebase bundles a help center and AI support agent — Canny doesn't",
        "MRR-weighted voting via Stripe is more flexible than Canny's segmentation",
        "Free plan includes unlimited conversations and 50 help center articles",
        "Per-seat pricing can be cheaper than Canny's per-tracked-user at scale",
      ],
      bottomLine:
        "Canny is the safer mature pick for pure feedback. Featurebase wins for teams that want feedback + help center + AI support in one tool. Pricing model preference is the real tiebreaker — per-tracked-user (Canny) vs per-seat (Featurebase).",
    },
    faqs: [
      {
        question: "Which is more expensive?",
        answer:
          "It depends on your shape. Canny gets expensive when tracked-user count grows; Featurebase gets expensive when admin team grows. A 3-admin team with 1,000 tracked users pays Canny $948/year and Featurebase $1,044/year (Growth tier) — close. A 10-admin team with the same users pays Canny the same $948 but Featurebase $3,480.",
      },
      {
        question: "Which has better integrations?",
        answer:
          "Canny — by margin. Pro tier covers Jira, Linear, Asana, ClickUp, GitHub, Azure DevOps, Salesforce, HubSpot, Slack. Featurebase ships Jira and HubSpot natively but Slack is listed as 'coming soon' and the catalog is smaller overall.",
      },
      {
        question: "Is there a flat-pricing option that does both?",
        answer:
          "Not exactly — but EchoBoard ($49/mo flat, free for unlimited users) covers most teams' core feedback needs without Canny's per-user math or Featurebase's per-seat math. It's the third-option middle ground if neither pricing model fits.",
      },
    ],
  },

  "canny-vs-nolt": {
    slug: "canny-vs-nolt",
    leftSlug: "canny",
    rightSlug: "nolt",
    verifiedAt: "2026-04-26",
    verdict: {
      leftWins: [
        "Built-in changelog — Nolt only ships boards and roadmap",
        "Autopilot AI for automatic deduplication",
        "Mature analytics with MRR segmentation",
        "Wider integration catalog (Salesforce, HubSpot, etc.)",
      ],
      rightWins: [
        "Flat per-board pricing — no tracked-user math",
        "Anonymous voting toggle for community-driven products",
        "Cleaner, simpler UI that end users grasp instantly",
        "10-day Pro trial vs Canny's 25-tracked-user free cap",
      ],
      bottomLine:
        "Canny is the more complete suite (with a changelog and AI). Nolt is the lean per-board alternative best suited for indie SaaS, gaming studios, and Discord communities. Canny wins on feature breadth; Nolt wins on simplicity and predictable pricing.",
    },
    faqs: [
      {
        question: "Does Nolt have a free plan like Canny?",
        answer:
          "No — Nolt offers only a 10-day Pro trial without a credit card. Canny's free plan is permanent but capped at 25 tracked users.",
      },
      {
        question: "Which is cheaper at 1,000 users?",
        answer:
          "Nolt Essential ($29/mo, $348/year) covers 1 board with no user limit. Canny Pro ($79/mo yearly, $948/year) covers 1,000 tracked users and unlimited boards. Nolt is cheaper unless you specifically need multiple boards or Canny's integrations.",
      },
      {
        question: "Is there a tool that combines Canny's depth with Nolt's pricing?",
        answer:
          "EchoBoard sits between them — flat $49/mo Pro (less than Nolt Pro) but with the changelog Nolt is missing. Free for unlimited users. It's the option for teams that don't want to choose between feature breadth and predictable pricing.",
      },
    ],
  },

  "featurebase-vs-userjot": {
    slug: "featurebase-vs-userjot",
    leftSlug: "featurebase",
    rightSlug: "userjot",
    verifiedAt: "2026-04-26",
    verdict: {
      leftWins: [
        "All-in-one suite: feedback + help center + AI support agent",
        "MRR-weighted voting via Stripe and HubSpot",
        "More mature product (founded 2020 vs UserJot's 2024)",
        "Native Jira integration",
      ],
      rightWins: [
        "Flat-rate pricing — Featurebase scales per seat",
        "Free plan includes 2 boards (Featurebase: 1 seat only)",
        "Simpler UI focused on feedback boards alone",
        "Cheaper Pro tier — $59/mo flat vs Featurebase's $59/seat/mo",
      ],
      bottomLine:
        "Featurebase is the wider suite with help center + AI. UserJot is the leaner flat-rate alternative for teams that want feedback boards without per-seat math. Pick Featurebase if you also need a help center; pick UserJot if you don't.",
    },
    faqs: [
      {
        question: "Which is better for a 5-admin team?",
        answer:
          "UserJot — by margin. UserJot Professional is $59/month flat regardless of team size. Featurebase Growth at $29/seat/month becomes $145/month for 5 admins. The math gets steeper as you add admins.",
      },
      {
        question: "Does UserJot have a help center?",
        answer:
          "No. UserJot is feedback-only — boards, roadmap, changelog. If you also need a help center, Featurebase or ProductLift bundle one. Most UserJot customers pair it with Notion or Intercom for help content.",
      },
      {
        question: "Are there other flat-rate alternatives?",
        answer:
          "Yes — EchoBoard ($49/mo flat, free for unlimited users), Upvoty, and ProductLift all offer flat pricing. EchoBoard's free tier is more generous than UserJot's (includes the widget and unlimited boards).",
      },
    ],
  },

  "canny-vs-userjot": {
    slug: "canny-vs-userjot",
    leftSlug: "canny",
    rightSlug: "userjot",
    verifiedAt: "2026-04-26",
    verdict: {
      leftWins: [
        "9 years of polish vs UserJot's first year",
        "Wider integration catalog (Salesforce, HubSpot, Linear, Asana)",
        "Battle-tested analytics with MRR segmentation",
        "Larger customer base — fewer surprises in edge cases",
      ],
      rightWins: [
        "Flat-rate pricing — no per-tracked-user surprises",
        "Permanent free plan with 2 boards (Canny: 1 board, 25 tracked users)",
        "Native Linear integration on Starter ($29/mo)",
        "Built-in AI for triage and summarization",
      ],
      bottomLine:
        "Canny is the safer mature choice with deeper integrations. UserJot is the flat-rate alternative for teams that want predictable costs and Linear-first workflows. Pick Canny if you're enterprise-shaped; pick UserJot if you want pricing that doesn't scale with your audience.",
    },
    faqs: [
      {
        question: "Which has a better free plan?",
        answer:
          "UserJot. The free plan covers unlimited end users and 2 boards permanently, while Canny's free is capped at 25 tracked users. For most teams the UserJot free tier is genuinely usable; Canny's is closer to a trial.",
      },
      {
        question: "Which has more integrations?",
        answer:
          "Canny, by margin. Pro tier covers Jira, Linear, Asana, ClickUp, GitHub, Azure DevOps, Salesforce, HubSpot, Slack. UserJot ships Slack and Linear; Jira is not currently supported.",
      },
      {
        question: "Is there an even cheaper flat-rate option?",
        answer:
          "EchoBoard's free plan is more generous than both — unlimited users, unlimited boards, the widget included. Pro is $49/mo flat (vs UserJot's $59/mo Professional). Worth comparing if pricing is the deciding factor.",
      },
    ],
  },

  "hellonext-vs-echoboard": {
    slug: "hellonext-vs-echoboard",
    leftSlug: "hellonext",
    rightSlug: "echoboard",
    verifiedAt: "2026-04-26",
    verdict: {
      leftWins: [
        "All-in-one suite: feedback + roadmap + changelog + knowledge base + forms",
        "Native Salesforce integration on Business tier",
        "Built-in AI for sentiment analysis and deduplication",
        "30-day free trial across all features",
      ],
      rightWins: [
        "Permanent free plan — FeatureOS only offers a 30-day trial",
        "EchoBoard's $49/mo Pro vs FeatureOS Starter $50/mo (similar) but more included over time",
        "No per-seat or per-board fees ($15/mo each on FeatureOS)",
        "No-login widget; FeatureOS requires user accounts",
      ],
      bottomLine:
        "FeatureOS (Hellonext) is the right pick if you also need a knowledge base and Salesforce integration. EchoBoard wins on free tier and absence of per-admin fees.",
    },
    faqs: [
      {
        question: "Is Hellonext still a thing?",
        answer:
          "It's now branded FeatureOS — same company, same product, new name and domain. If you've been using Hellonext, your account carried over to FeatureOS in 2023.",
      },
      {
        question: "Does EchoBoard have a knowledge base?",
        answer:
          "Not currently. If you want a feedback tool that doubles as a help center, FeatureOS is the better pick. Most EchoBoard teams pair it with Notion or Intercom for help content.",
      },
      {
        question: "What about Salesforce?",
        answer:
          "FeatureOS Business ships native Salesforce integration. EchoBoard plans Salesforce on the Pro roadmap; today it's not shipped.",
      },
    ],
  },
}

/** Inflates a Comparison entry into the resolved competitor pair. */
export function resolveComparison(
  c: Comparison,
): { competitor: Comparison; left: Competitor; right: Competitor } | null {
  const left =
    c.leftSlug === "echoboard" ? echoboard : getCompetitor(c.leftSlug)
  const right =
    c.rightSlug === "echoboard" ? echoboard : getCompetitor(c.rightSlug)
  if (!left || !right) return null
  return { competitor: c, left, right }
}

export function getVerifiedComparisons(): Comparison[] {
  return Object.values(comparisons).filter((c) => {
    if (!c.verifiedAt) return false
    return resolveComparison(c) !== null
  })
}

export function getComparison(slug: string): Comparison | null {
  const c = comparisons[slug]
  if (!c?.verifiedAt) return null
  return resolveComparison(c) ? c : null
}
