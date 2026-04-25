// Hand-curated competitor data for alternative + comparison pSEO pages.
// Each entry is researched from the competitor's own pricing/features
// pages. Fields with `null` mean "not yet researched" — the page route
// filters those out of `generateStaticParams`, so an entry only goes
// live once it's verified.
//
// **`verifiedAt`** is the timestamp (ISO date) of the last manual check.
// Refresh quarterly — competitors change pricing.

export type CompetitorFeatures = {
  feedbackBoard: boolean
  publicRoadmap: boolean
  changelog: boolean
  widget: boolean
  api: boolean
  voting: boolean
  comments: boolean
  customDomain: boolean
  sso: boolean
  mrrWeightedVoting: boolean
  anonymousPosting: boolean
  flatPricing: boolean
  aiFeatures: boolean
  slackIntegration: boolean
  jiraIntegration: boolean
}

export type Competitor = {
  slug: string
  name: string
  website: string
  /** ISO date (YYYY-MM-DD) of last manual verification. `null` = not researched yet. */
  verifiedAt: string | null
  /** 1-2 sentence summary used in the alternatives index card. */
  description: string
  /** 2-3 paragraph overview rendered at the top of the alternative page. */
  longDescription: string
  pricing: string
  pricingModel: string
  freePlan: string
  founded: string | null
  fundingStatus: string | null
  bestFor: string
  pros: string[]
  cons: string[]
  features: CompetitorFeatures
  faqs: { question: string; answer: string }[]
}

// EchoBoard's own entry — used as the "right side" of every comparison
// table. Lives in this file (not somewhere central) so adding/removing
// fields in the Competitor type stays type-safe across both sides of the
// comparison.
export const echoboard: Competitor = {
  slug: "echoboard",
  name: "EchoBoard",
  website: "https://echoboard.io",
  verifiedAt: "2026-04-26",
  description:
    "Free-forever feedback tool for SaaS teams. Flat pricing, unlimited users, no per-user fees.",
  longDescription:
    "EchoBoard is a feedback management platform built for teams tired of paying per tracked user. Collect feature requests, run a public roadmap, and ship a changelog — all from one workspace, with a no-login-required widget that drops onto any page.\n\nThe pricing model is the headline difference: instead of charging per tracked user (which scales painfully with your audience), EchoBoard is free forever for the core feature set, with a flat $49/month Pro plan for teams that need multiple boards and white-labeling. Your costs don't grow when your user count does.",
  pricing: "Free forever / Pro $49/month",
  pricingModel: "Flat-rate (not per tracked user)",
  freePlan:
    "Unlimited users, unlimited posts, 1 board, public roadmap, changelog, widget",
  founded: "2026",
  fundingStatus: "Bootstrapped",
  bestFor:
    "SaaS teams that want predictable pricing and don't need enterprise integrations on day one",
  pros: [
    "Genuinely free for teams of any size — no tracked-user trap",
    "No-login feedback widget (visitors submit with just an email)",
    "Public roadmap and changelog included on every plan",
    "Built mobile-first — most competitors treat mobile as an afterthought",
    "Open feedback model: vote, comment, merge duplicates without seat licenses",
  ],
  cons: [
    "Newer product — fewer integrations than Canny or Featurebase right now",
    "Slack/Jira/Linear integrations are on the roadmap, not shipped yet",
    "No SSO/SAML on the free plan (coming with Pro)",
    "Single-region hosting (Pro adds custom-domain in coming releases)",
  ],
  features: {
    feedbackBoard: true,
    publicRoadmap: true,
    changelog: true,
    widget: true,
    api: false, // coming soon
    voting: true,
    comments: true,
    customDomain: false, // coming soon
    sso: false, // coming soon
    mrrWeightedVoting: false, // coming soon
    anonymousPosting: true,
    flatPricing: true,
    aiFeatures: false, // coming soon
    slackIntegration: false, // coming soon
    jiraIntegration: false, // coming soon
  },
  faqs: [
    {
      question: "Is EchoBoard really free for unlimited users?",
      answer:
        "Yes. The free plan has no tracked-user limit. You can have 50 voters or 50,000 — your bill doesn't change. Pro ($49/mo flat) adds multiple boards, custom domains, and removes EchoBoard branding.",
    },
    {
      question: "How does the no-login widget work?",
      answer:
        "Drop a one-line script tag on your site. Visitors click the floating button, submit feedback with just an email (no account creation), and the widget remembers them via a 1st-party cookie. You can optionally pre-identify signed-in users via a JavaScript call so they skip the email step.",
    },
    {
      question: "Can I import my feedback from Canny?",
      answer:
        "Yes. Canny offers a CSV export of your posts and votes; we have an import flow in EchoBoard's settings that takes the same CSV format. Migration time is typically under 10 minutes.",
    },
  ],
}

export const competitors: Record<string, Competitor> = {
  canny: {
    slug: "canny",
    name: "Canny",
    website: "https://canny.io",
    verifiedAt: "2026-04-26",
    description:
      "The most established feedback tool. Powerful, but pricing scales with tracked users and key integrations live on higher tiers.",
    longDescription:
      "Canny is the category leader for SaaS feedback management. Founded in 2017 and bootstrapped to $3.5M ARR by 2024, it's the reference tool for feedback boards, roadmaps, and changelogs. If you've seen a feedback board on a SaaS pricing page, there's a good chance it was Canny.\n\nThe trade-off is pricing. Canny's plans scale with tracked users — the count of unique users who've interacted with your boards. Free is 25, Core (\\$19/mo) and Pro (\\$79/mo) start at 100, and Business is custom-priced for 5,000+. For a SaaS with 1,000 monthly active users, this can mean several hundred dollars per month even before you factor in integrations, which sit on Pro and above.\n\nCanny's strength is depth: AI-powered feedback deduplication (Autopilot), advanced segmentation, integrations with most PM tools, and a polished public roadmap. The cost of that depth is sticker shock for smaller teams.",
    pricing: "From $19/month (yearly) — usage-based on tracked users",
    pricingModel: "Per tracked user (free: 25 / paid: 100+ / business: 5,000+)",
    freePlan: "25 tracked users, unlimited posts, Autopilot AI, 1 board",
    founded: "2017",
    fundingStatus: "Bootstrapped (one $318K crowdfunding round in 2017)",
    bestFor:
      "Mid-size SaaS companies with budget for integrations and a stable user count",
    pros: [
      "Most mature feature set — Autopilot AI deduplicates feedback automatically",
      "Wide integration coverage on Pro and up: Jira, Linear, Asana, ClickUp, GitHub, Azure DevOps, Slack, Salesforce, HubSpot",
      "Strong analytics — segment voters by MRR, plan, custom attributes",
      "Bootstrapped + profitable — no risk of pivot or shutdown",
      "Public roadmap with private/internal mode for hidden plans",
    ],
    cons: [
      "Pricing scales with tracked users — can become expensive as your audience grows",
      "Integrations and API only available on Pro plan ($79/mo) and up",
      "SSO/SAML is Business-tier only (custom pricing)",
      "Free plan capped at 25 tracked users — easy to outgrow",
      "No white-label option below the Business plan",
    ],
    features: {
      feedbackBoard: true,
      publicRoadmap: true,
      changelog: true,
      widget: true,
      api: true, // Pro plan
      voting: true,
      comments: true,
      customDomain: true, // Core plan
      sso: true, // Business plan
      mrrWeightedVoting: true, // Pro plan via segmentation
      anonymousPosting: false, // tracked users required
      flatPricing: false, // per-tracked-user model
      aiFeatures: true, // Autopilot, all plans
      slackIntegration: true, // Pro plan
      jiraIntegration: true, // Pro plan
    },
    faqs: [
      {
        question: "How much does Canny actually cost?",
        answer:
          "Canny's Free plan is $0 but capped at 25 tracked users. The Core plan starts at $19/mo (paid yearly) for 100 tracked users — that's $228/year minimum. The Pro plan, which includes Jira/Linear/Slack integrations and the API, is $79/mo (paid yearly) — $948/year. Business pricing (5,000+ users, SSO) is custom and typically several hundred dollars per month.",
      },
      {
        question: "What is a 'tracked user' in Canny?",
        answer:
          "A tracked user is anyone who has interacted with your Canny boards — voted, commented, or posted. The count is rolling: it includes everyone who's ever taken an action, not just monthly actives. For most SaaS teams, this number grows faster than expected and pushes you up Canny's pricing tiers.",
      },
      {
        question: "Why are people looking for Canny alternatives?",
        answer:
          "The two most common reasons: (1) Canny's tracked-user pricing scales painfully — a SaaS with a few thousand engaged users can spend $300-600+/mo. (2) Critical features like API access, Slack, and Jira integrations are gated behind the $79/mo Pro plan. For smaller teams or those that don't need the deepest feature set, the cost-to-value ratio breaks down.",
      },
      {
        question: "Is Canny worth the price?",
        answer:
          "If you have a stable user count, need their integrations, and want the most polished feedback tool on the market — yes. If you're scaling fast, want flat pricing, or only need core feedback features (boards, voting, roadmap, changelog), there are alternatives that deliver 90% of the value for a fraction of the cost.",
      },
    ],
  },

  userjot: {
    slug: "userjot",
    name: "UserJot",
    website: "https://userjot.com",
    verifiedAt: "2026-04-26",
    description:
      "Modern flat-rate feedback tool for SaaS with unlimited users, free tier, and built-in roadmaps and changelogs.",
    longDescription:
      "UserJot is a customer feedback and product communication platform built specifically for SaaS teams. Launched in late 2024 by solo founder Shayan Taslim (also creator of LogSnag), it centralizes feature requests, public roadmaps, and changelogs in a single tool with a deliberately simple UI and a flat-rate pricing model that does not scale with seats or tracked users.\n\nThe product targets small-to-mid SaaS teams frustrated with per-seat tools like Canny or Productboard. UserJot's free tier is unusually generous for the category — unlimited end users, unlimited posts, and 2 boards forever — making it a popular pick for indie hackers and bootstrapped startups. Paid plans unlock custom domains, private boards, integrations, and SSO without introducing seat-based scaling.\n\nPricing is flat: Starter at $29/month and Professional at $59/month, with the Free plan permanent. Integrations include Slack and Linear; AI assistance for triage and summarization is built in. UserJot positions itself as a Canny alternative for teams that want predictable costs and don't need enterprise features like MRR-weighted voting or Salesforce integration.",
    pricing: "Free, Starter $29/mo, Professional $59/mo",
    pricingModel: "Flat-rate",
    freePlan:
      "Unlimited users, unlimited posts, 2 boards, userjot.com subdomain",
    founded: "2024",
    fundingStatus: "Bootstrapped",
    bestFor:
      "Bootstrapped SaaS founders and small product teams who want flat-rate pricing and a free tier that scales.",
    pros: [
      "Flat-rate pricing that does not scale with seats or tracked users",
      "Generous free tier with unlimited users and posts",
      "Clean, modern UI focused on simplicity over feature breadth",
      "Built-in AI features for feedback triage and summarization",
      "Predictable costs make it appealing for indie and small SaaS budgets",
    ],
    cons: [
      "Free plan limited to 2 boards and excludes custom domains and integrations",
      "Starter plan caps integrations at 1 — teams using both Slack and Linear must upgrade",
      "Newer product (launched late 2024) with smaller integration catalog than incumbents",
      "No MRR-weighted voting or revenue-based prioritization",
      "Solo-founder operation means smaller support footprint than VC-backed competitors",
    ],
    features: {
      feedbackBoard: true,
      publicRoadmap: true,
      changelog: true,
      widget: true,
      api: true,
      voting: true,
      comments: true,
      customDomain: true,
      sso: true,
      mrrWeightedVoting: false,
      anonymousPosting: false,
      flatPricing: true,
      aiFeatures: true,
      slackIntegration: true,
      jiraIntegration: false,
    },
    faqs: [
      {
        question: "How much does UserJot cost?",
        answer:
          "UserJot has a free plan plus two paid tiers: Starter at $29/month and Professional at $59/month. Pricing is flat — it does not scale with the number of users or seats.",
      },
      {
        question: "Does UserJot have a free plan?",
        answer:
          "Yes. The free plan is permanent and includes unlimited end users, unlimited posts, and 2 boards. It excludes custom domains, integrations, and SSO.",
      },
      {
        question: "Is UserJot a good Canny alternative?",
        answer:
          "UserJot is a credible Canny alternative for small-to-mid SaaS teams that want flat-rate pricing rather than per-tracked-user fees. It lacks enterprise features like MRR-weighted voting and Salesforce integration.",
      },
      {
        question: "Does UserJot integrate with Jira?",
        answer:
          "Based on UserJot's published integrations, Slack and Linear are first-class but Jira is not currently listed. Teams using Jira may need a Zapier-style workaround.",
      },
    ],
  },

  featurebase: {
    slug: "featurebase",
    name: "Featurebase",
    website: "https://featurebase.app",
    verifiedAt: "2026-04-26",
    description:
      "All-in-one feedback, roadmap, changelog, and help center suite with revenue-weighted prioritization and AI agents.",
    longDescription:
      "Featurebase is a customer feedback and product management platform founded in late 2020 by Robi Rohumaa and Bruno Hiis in Estonia. It bundles feedback boards, public roadmaps, changelogs, surveys, a help center, and an AI-powered support inbox into one suite, positioning itself as a more modern, all-in-one alternative to Canny and Productboard.\n\nThe platform is popular with scaling SaaS companies because it natively connects feature requests to revenue via Stripe and HubSpot integrations, allowing teams to prioritize requests by upvoters' MRR. Featurebase also ships AI features (Fibi AI Agent, AI Copilot) that summarize feedback, deduplicate posts, and resolve support questions automatically. The company is bootstrapped and profitable.\n\nPricing is per-seat and billed annually: Free for 1 seat, Growth at $29/seat/month, Professional at $59/seat/month (with 20 included Lite seats), and Enterprise at $99/seat/month (with 50 Lite seats). Each plan supports a $0.29 pay-per-use AI resolution fee. Custom domains, API, webhooks, and SSO (Enterprise) are all supported. The per-seat model means costs scale with team size.",
    pricing: "Free, Growth $29/seat/mo, Professional $59/seat/mo, Enterprise $99/seat/mo (yearly)",
    pricingModel: "Per-seat",
    freePlan:
      "1 seat, unlimited conversations, feedback & roadmaps, help center (50 articles), surveys, changelog",
    founded: "2020",
    fundingStatus: "Bootstrapped",
    bestFor:
      "Scaling SaaS teams that want an all-in-one feedback, support, and changelog platform with revenue-weighted prioritization.",
    pros: [
      "All-in-one suite covering feedback, roadmap, changelog, help center, and surveys",
      "MRR-weighted voting via native Stripe and HubSpot integrations",
      "Built-in AI agents for support deflection and feedback triage",
      "Generous free tier for solo founders",
      "Bootstrapped and profitable — incentives aligned with customer outcomes",
    ],
    cons: [
      "Per-seat pricing scales quickly for larger product and CS teams",
      "AI resolutions billed separately at $0.29 each on top of seat fees",
      "Slack integration listed as 'coming soon' on the pricing page",
      "Steeper learning curve given the breadth of the suite",
      "Enterprise SSO gated behind the $99/seat tier",
    ],
    features: {
      feedbackBoard: true,
      publicRoadmap: true,
      changelog: true,
      widget: true,
      api: true,
      voting: true,
      comments: true,
      customDomain: true,
      sso: true,
      mrrWeightedVoting: true,
      anonymousPosting: false,
      flatPricing: false,
      aiFeatures: true,
      slackIntegration: false,
      jiraIntegration: true,
    },
    faqs: [
      {
        question: "How much does Featurebase cost?",
        answer:
          "Featurebase has a Free plan plus Growth ($29/seat/month), Professional ($59/seat/month), and Enterprise ($99/seat/month) tiers, all billed annually. AI resolutions are billed separately at $0.29 each.",
      },
      {
        question: "Does Featurebase support MRR-weighted voting?",
        answer:
          "Yes. Featurebase integrates natively with Stripe and HubSpot to attach revenue data to upvoters, allowing teams to prioritize feature requests by paying-customer value.",
      },
      {
        question: "Is Featurebase a Canny alternative?",
        answer:
          "Yes. Featurebase competes directly with Canny and adds a help center, AI support agent, and surveys to the same suite. Its per-seat model can cost more than Canny for very large admin teams.",
      },
      {
        question: "Does Featurebase have a free plan?",
        answer:
          "Yes — the Free plan is permanent and includes 1 seat, unlimited conversations, feedback boards, roadmaps, a help center with up to 50 articles, and surveys.",
      },
    ],
  },

  nolt: {
    slug: "nolt",
    name: "Nolt",
    website: "https://nolt.io",
    verifiedAt: "2026-04-26",
    description:
      "Lean feedback board tool with flat per-board pricing, popular with indie SaaS, gaming, and Discord communities.",
    longDescription:
      "Nolt is a feedback and feature-request platform founded in 2018 by Daniel Stefanovic and based in Toronto. It is one of the most established lean feedback tools in the category, known for a clean Trello-style board UI and a fixed per-board pricing model that does not scale with users or posts.\n\nNolt is especially popular with indie hackers, gaming studios, and Discord-driven communities because boards have no caps on contributors or votes — costs stay predictable as a community grows. The product covers feedback boards, voting, a roadmap view, basic statuses, and integrations with Slack, Jira, Linear, Zapier, and Microsoft Teams. It is intentionally narrower than all-in-one suites: there is no native changelog, help center, or AI triage.\n\nPricing is flat per board: Essential at $29/month ($348/year) for one board, Pro at $69/month ($828/year) for up to 5 boards plus password protection and full integrations, and an Enterprise tier with custom pricing. New boards get a 10-day free trial; there is no permanent free plan. The bootstrapped company has stayed deliberately small.",
    pricing: "Essential $29/mo, Pro $69/mo, Enterprise custom",
    pricingModel: "Flat per-board",
    freePlan: "No free plan (10-day Pro trial only)",
    founded: "2018",
    fundingStatus: "Bootstrapped",
    bestFor:
      "Indie SaaS, gaming studios, and Discord communities that want a single clean board with predictable flat pricing.",
    pros: [
      "Flat per-board pricing with no caps on users, votes, or posts",
      "Clean Trello-style UI that end users grasp instantly",
      "Native integrations with Jira, Slack, Linear, Zapier, and Microsoft Teams",
      "Anonymous voting toggle gives admins fine-grained identity control",
      "Long-running, stable bootstrapped company with low churn risk",
    ],
    cons: [
      "No free plan — only a 10-day Pro trial",
      "Essential tier limited to a single board",
      "No native changelog product (only roadmap and board)",
      "No built-in AI features for triage or summarization",
      "Smaller two-person team means slower feature velocity than VC-backed rivals",
    ],
    features: {
      feedbackBoard: true,
      publicRoadmap: true,
      changelog: false,
      widget: true,
      api: true,
      voting: true,
      comments: true,
      customDomain: true,
      sso: true,
      mrrWeightedVoting: false,
      anonymousPosting: true,
      flatPricing: true,
      aiFeatures: false,
      slackIntegration: true,
      jiraIntegration: true,
    },
    faqs: [
      {
        question: "How much does Nolt cost?",
        answer:
          "Nolt has two public tiers: Essential at $29/month ($348/year) for one board, and Pro at $69/month ($828/year) for up to 5 boards. Enterprise plans with custom pricing exist for teams that need more boards.",
      },
      {
        question: "Does Nolt have a free plan?",
        answer:
          "No. Nolt does not offer a permanent free plan, but every new board comes with a 10-day Pro trial that requires no credit card.",
      },
      {
        question: "Is Nolt a good Canny alternative?",
        answer:
          "Nolt is a strong Canny alternative for small teams that want flat-rate, per-board pricing rather than per-tracked-user fees. It lacks Canny's changelog and revenue-weighted voting features.",
      },
      {
        question: "Does Nolt integrate with Jira and Slack?",
        answer:
          "Yes. Nolt offers native integrations with Jira (auto-create issues), Slack, Linear, Microsoft Teams, and Zapier, available on the Pro plan.",
      },
    ],
  },

  fider: {
    slug: "fider",
    name: "Fider",
    website: "https://fider.io",
    verifiedAt: "2026-04-26",
    description:
      "Open-source feedback platform you can self-host for free, with an optional managed cloud tier from $49/month.",
    longDescription:
      "Fider is an open-source customer feedback platform first released in 2016. It is the leading open-source alternative to Canny, Featurebase, and UserJot, and ships as a self-hostable Go application that any team can deploy on their own infrastructure for free. The cloud-hosted version is run by Northern App Labs Ltd.\n\nFider's core feature set covers feedback collection, voting, comments, statuses, multi-language support, OAuth, and basic customization. It deliberately keeps the surface area small: no native changelog, no roadmap kanban, no AI features, and no Jira/Slack first-party integrations (most teams wire these up via webhooks). The appeal is data ownership, GDPR-friendly self-hosting, and zero vendor lock-in.\n\nThe managed cloud has a free tier with a fair-use cap of 250 feedback items and unlimited customers/votes/members, plus a Pro plan at $49/month that adds SEO indexing and other extras. Self-hosting is unconditionally free under an open-source license. Fider is the right pick for teams that prioritize cost control, privacy, or the ability to fork and modify the code.",
    pricing: "Free (self-hosted) or $49/mo (Pro cloud)",
    pricingModel: "Flat-rate / open-source self-hostable",
    freePlan:
      "Self-hosted: free forever. Cloud free tier: 250 items, unlimited customers/votes/members",
    founded: "2016",
    fundingStatus: "Open source",
    bestFor:
      "Privacy-conscious teams and open-source advocates who want full control of their feedback data via self-hosting.",
    pros: [
      "Fully open-source — self-host for free with full data ownership",
      "Active GitHub project with steady community contributions since 2016",
      "Lightweight, fast, and easy to deploy in under five minutes",
      "Cloud free tier supports unlimited users and votes (only items are capped)",
      "GDPR-friendly thanks to self-hosting and EU operator",
    ],
    cons: [
      "No native changelog, kanban roadmap, or AI features",
      "No first-party Slack or Jira integrations — requires webhook glue",
      "Cloud free tier capped at 250 feedback items",
      "UI feels dated compared to Featurebase and UserJot",
      "Self-hosting requires DevOps capacity to operate and update",
    ],
    features: {
      feedbackBoard: true,
      publicRoadmap: false,
      changelog: false,
      widget: false,
      api: true,
      voting: true,
      comments: true,
      customDomain: true,
      sso: true,
      mrrWeightedVoting: false,
      anonymousPosting: false,
      flatPricing: true,
      aiFeatures: false,
      slackIntegration: false,
      jiraIntegration: false,
    },
    faqs: [
      {
        question: "Is Fider really free?",
        answer:
          "Yes. Fider is open-source and free to self-host without any license fee. There is also a managed cloud free tier capped at 250 feedback items, plus a Pro cloud plan at $49/month.",
      },
      {
        question: "Can I self-host Fider?",
        answer:
          "Yes — self-hosting is the recommended path for teams who want full data ownership. Fider ships as a Go binary with Postgres, and most teams deploy it on Docker, Kubernetes, or a managed PaaS in under five minutes.",
      },
      {
        question: "Does Fider have a roadmap or changelog?",
        answer:
          "Fider has feedback boards with statuses but does not ship a kanban-style public roadmap or a dedicated changelog product. Teams that need both typically pair Fider with a separate changelog tool.",
      },
      {
        question: "How does Fider compare to Canny?",
        answer:
          "Fider is the open-source alternative to Canny — it covers core feedback, voting, and comments for free if self-hosted, but lacks Canny's changelog, AI summarization, and integrations like Salesforce.",
      },
    ],
  },

  productlift: {
    slug: "productlift",
    name: "ProductLift",
    website: "https://productlift.dev",
    verifiedAt: "2026-04-26",
    description:
      "All-in-one feedback, roadmap, changelog, and knowledge base platform with flat pricing and unlimited end-users.",
    longDescription:
      "ProductLift is a customer feedback and product management platform founded around 2018-2019 and headquartered in Vancouver with European operations. It bundles five products — feedback boards, voting, public roadmap, changelog, and knowledge base — under a single flat-rate subscription with unlimited end-users, which differentiates it from per-seat or per-tracked-user incumbents.\n\nThe platform targets SaaS product managers and small-to-mid-sized product teams who want predictable costs as their userbase grows. ProductLift includes white-labeling, custom domains, 22 languages, prioritization frameworks (RICE/ICE/MoSCoW), and a Stripe integration to weight feedback by revenue. AI credits are bundled into each tier (250/2,000/6,000 per month depending on plan).\n\nPricing has separate monthly and yearly options with a 30% annual discount. Starter is $29/month or $19/month yearly ($228/year) and includes 2 admins; Pro is $79/month or $49/month yearly ($588/year) with 5 admins, API access, SSO, and unlimited boards; Business is $199/month or $129/month yearly ($1,548/year) with 25 admins. Additional admins are $15/month each. There is no permanent free plan but a 14-day trial is available with no credit card.",
    pricing: "Starter from $19/mo, Pro from $49/mo, Business from $129/mo (yearly)",
    pricingModel: "Flat-rate (with $15/mo per extra admin)",
    freePlan: "No free plan (14-day free trial)",
    founded: "2019",
    fundingStatus: "Bootstrapped",
    bestFor:
      "Mid-sized SaaS product teams that want an all-in-one feedback suite with flat pricing and revenue-weighted voting.",
    pros: [
      "Flat-rate pricing with unlimited end-users on every tier",
      "Bundles feedback, roadmap, changelog, and knowledge base in one tool",
      "Native prioritization frameworks (RICE, ICE, MoSCoW) plus AI credits per plan",
      "Stripe integration enables revenue-weighted feedback prioritization",
      "Supports 22 languages and white-labeling out of the box",
    ],
    cons: [
      "No permanent free plan — only a 14-day trial",
      "Starter tier capped at 2 boards and 2 admins",
      "Extra admins cost $15/month each on top of base subscription",
      "AI credits are metered (250/2,000/6,000 per month) and reset monthly",
      "Smaller brand recognition than Canny or Featurebase in enterprise circles",
    ],
    features: {
      feedbackBoard: true,
      publicRoadmap: true,
      changelog: true,
      widget: true,
      api: true,
      voting: true,
      comments: true,
      customDomain: true,
      sso: true,
      mrrWeightedVoting: true,
      anonymousPosting: true,
      flatPricing: true,
      aiFeatures: true,
      slackIntegration: true,
      jiraIntegration: true,
    },
    faqs: [
      {
        question: "How much does ProductLift cost?",
        answer:
          "ProductLift has three tiers billed yearly or monthly: Starter from $19/month ($228/year), Pro from $49/month ($588/year), and Business from $129/month ($1,548/year). Yearly billing saves around 30%.",
      },
      {
        question: "Does ProductLift have a free plan?",
        answer:
          "No, there is no permanent free plan. ProductLift offers a 14-day free trial that does not require a credit card and lets teams cancel anytime.",
      },
      {
        question: "Is ProductLift a good Canny alternative?",
        answer:
          "ProductLift is a strong Canny alternative for teams that want flat-rate pricing with unlimited end-users plus a built-in knowledge base. It lacks Canny's deep enterprise integrations like Salesforce.",
      },
      {
        question: "Does ProductLift have AI features?",
        answer:
          "Yes. Each plan ships with monthly AI credits — 250 on Starter, 2,000 on Pro, and 6,000 on Business — for tasks like duplicate detection and summarization.",
      },
    ],
  },

  upvoty: {
    slug: "upvoty",
    name: "Upvoty",
    website: "https://upvoty.com",
    verifiedAt: "2026-04-26",
    description:
      "Bootstrapped Dutch feedback platform with flat pricing, white-labeling, and full custom HTML/CSS control.",
    longDescription:
      "Upvoty is a customer feedback platform founded in 2018 by Mike Slaats in the Netherlands. The bootstrapped company crossed $1M ARR within three years and serves over 700 SaaS, agency, and product customers. Upvoty's positioning emphasizes flat pricing with unlimited users and very deep white-label customization including custom HTML and CSS.\n\nThe product covers feedback boards, voting, a public roadmap, a changelog, and an embeddable widget, plus integrations with Slack, Jira, Trello, and Notion via Zapier and direct connectors. Higher tiers add SSO, send-from-own-domain emails, user segmentation, and full custom CSS — features that typically sit behind enterprise plans elsewhere. Upvoty is best known for letting agencies and reseller-style SaaS rebrand the entire experience.\n\nPricing is flat-rate with three tiers: Power at $25/month, Super at $49/month, and Hyper at $99/month. Annual billing offers approximately 25% off. All tiers include unlimited boards, unlimited users, custom domain, and custom SSO; Power and Super are limited to 1 project, while Hyper unlocks unlimited projects. A 14-day free trial is available; there is no permanent free plan.",
    pricing: "Power $25/mo, Super $49/mo, Hyper $99/mo",
    pricingModel: "Flat-rate",
    freePlan: "No free plan (14-day free trial)",
    founded: "2018",
    fundingStatus: "Bootstrapped",
    bestFor:
      "Agencies and white-label SaaS who need deep custom CSS and rebranded feedback boards on flat pricing.",
    pros: [
      "Flat-rate pricing with unlimited users on every tier",
      "Deep white-labeling including custom HTML and CSS even on lower tiers",
      "Custom SSO available on all paid plans, not just enterprise",
      "Send-from-own-domain email support for fully branded notifications",
      "Bootstrapped and profitable since 2019, low churn risk",
    ],
    cons: [
      "No permanent free plan — only a 14-day trial",
      "Power and Super tiers limited to a single project",
      "No native AI features for triage or deduplication",
      "UI feels dated relative to newer competitors like UserJot and Featurebase",
      "No native MRR-weighted voting or Stripe revenue integration",
    ],
    features: {
      feedbackBoard: true,
      publicRoadmap: true,
      changelog: true,
      widget: true,
      api: true,
      voting: true,
      comments: true,
      customDomain: true,
      sso: true,
      mrrWeightedVoting: false,
      anonymousPosting: false,
      flatPricing: true,
      aiFeatures: false,
      slackIntegration: true,
      jiraIntegration: true,
    },
    faqs: [
      {
        question: "How much does Upvoty cost?",
        answer:
          "Upvoty has three flat-rate plans: Power at $25/month, Super at $49/month, and Hyper at $99/month. Annual billing saves around 25%, and a 14-day free trial is available without a credit card.",
      },
      {
        question: "Does Upvoty have a free plan?",
        answer:
          "No, Upvoty does not offer a permanent free plan. New customers can use a 14-day free trial that does not require a credit card.",
      },
      {
        question: "Is Upvoty a good Canny alternative?",
        answer:
          "Upvoty is a solid Canny alternative for agencies and white-label SaaS that need deep CSS customization and flat per-month pricing. It lacks Canny's AI summarization and revenue-weighted voting.",
      },
      {
        question: "Can Upvoty be white-labeled?",
        answer:
          "Yes — Upvoty supports custom domains, send-from-own-domain emails, custom HTML, and custom CSS on all paid tiers, making it popular with agencies and reseller-style products.",
      },
    ],
  },

  sleekplan: {
    slug: "sleekplan",
    name: "Sleekplan",
    website: "https://sleekplan.com",
    verifiedAt: "2026-04-26",
    description:
      "Affordable feedback suite with feedback boards, roadmap, changelog, NPS, and CSAT surveys starting at $13/month.",
    longDescription:
      "Sleekplan is a customer feedback platform founded in 2021 by Marco Graf in Germany. It bundles feedback boards, voting, a public roadmap, a changelog, NPS, and CSAT surveys into a single suite, with a strong focus on affordability — the entry-level paid tier starts at just $13/month, well below most competitors.\n\nThe platform suits early-stage SaaS, agencies, and indie products that want survey capabilities (NPS/CSAT) layered on top of standard feedback collection. Sleekplan ships an embeddable widget plus a standalone hosted page, integrations with Slack, Jira, GitHub, Zapier, Intercom, and Shopify, and SAML SSO on higher tiers. Custom domains and private boards (password or SSO protected) sit on the Business tier.\n\nPricing has a permanent Indie free plan (1 seat, 500K monthly pageviews, unlimited end-users, feedback, and subscribers), then Starter at $13/month with 3 seats and 1,000 AI credits/year, Business at $38/month with 10 seats and 5,000 AI credits/year, and Enterprise with custom pricing and unlimited seats. Annual billing offers a 'save 2 months' discount versus monthly.",
    pricing: "Indie free, Starter $13/mo, Business $38/mo, Enterprise custom (yearly)",
    pricingModel: "Per-seat (tier-bundled)",
    freePlan:
      "Unlimited end-users, feedback, and subscribers; 1 team seat; 500K monthly pageviews",
    founded: "2021",
    fundingStatus: "Bootstrapped (unconfirmed)",
    bestFor:
      "Early-stage SaaS teams that want NPS/CSAT surveys plus feedback boards in one affordable tool.",
    pros: [
      "Lowest entry-level paid tier in the category at $13/month",
      "Bundles NPS and CSAT surveys with feedback boards in one tool",
      "Permanent Indie free plan with unlimited end-users and subscribers",
      "Native integrations with Slack, Jira, GitHub, Intercom, Shopify, and Zapier",
      "European-based with strong GDPR posture for EU SaaS buyers",
    ],
    cons: [
      "Custom domains and API gated behind the $38/month Business tier",
      "AI credits are metered (1,000/year on Starter, 5,000/year on Business)",
      "No MRR-weighted voting or Stripe revenue integration",
      "Public roadmap kanban requires Starter or higher (not on Indie)",
      "Smaller brand presence than Canny or Featurebase in enterprise sales",
    ],
    features: {
      feedbackBoard: true,
      publicRoadmap: true,
      changelog: true,
      widget: true,
      api: true,
      voting: true,
      comments: true,
      customDomain: true,
      sso: true,
      mrrWeightedVoting: false,
      anonymousPosting: false,
      flatPricing: false,
      aiFeatures: true,
      slackIntegration: true,
      jiraIntegration: true,
    },
    faqs: [
      {
        question: "How much does Sleekplan cost?",
        answer:
          "Sleekplan has four tiers: Indie (free forever), Starter at $13/month, Business at $38/month, and Enterprise with custom pricing. All paid tiers are billed annually with a 'save 2 months' discount.",
      },
      {
        question: "Does Sleekplan have a free plan?",
        answer:
          "Yes — the Indie plan is permanently free and includes unlimited end-users, unlimited feedback items, unlimited subscribers, 1 team seat, and 500,000 monthly pageviews.",
      },
      {
        question: "Is Sleekplan a good Canny alternative?",
        answer:
          "Sleekplan is a strong Canny alternative for budget-conscious teams that also want NPS and CSAT surveys. It is significantly cheaper but lacks revenue-weighted voting and deep enterprise integrations.",
      },
      {
        question: "Does Sleekplan support custom domains?",
        answer:
          "Yes, but custom domains are gated behind the Business tier ($38/month). Lower tiers use a Sleekplan-hosted subdomain or embedded widget.",
      },
    ],
  },

  "feature-upvote": {
    slug: "feature-upvote",
    name: "Feature Upvote",
    website: "https://featureupvote.com",
    verifiedAt: "2026-04-26",
    description:
      "Long-running bootstrapped feedback board tool with per-board flat pricing and unlimited contributors.",
    longDescription:
      "Feature Upvote is a customer feedback platform founded in 2016 by Steve McLeod in Barcelona. It is one of the longest-running bootstrapped tools in the category, intentionally focused on doing one thing well: simple feedback boards with voting, comments, and statuses. The founder has been public about preferring 'modest growth' and a healthy work-life balance over aggressive expansion, which translates to a stable, low-churn product.\n\nThe tool is especially popular with game developers, B2B SaaS, and internal teams that want a fast, no-frills feedback board. Feature Upvote ships unlimited contributors, unlimited team members, multiple languages, custom domains, private boards, custom statuses, custom CSS, and SAML SSO on all paid tiers. Integrations cover Slack, Discord, Microsoft Teams, Jira, and Zapier.\n\nPricing is per-board: Indie at $49/board/month and Standard at $99/board/month, with a 20% discount for annual billing. There is also a custom Enterprise tier. There is no permanent free plan, but a 30-day free trial unlocks almost all features. The per-board model means scaling to multiple products linearly multiplies costs, which is a meaningful constraint for multi-product organizations.",
    pricing: "Indie $49/board/mo, Standard $99/board/mo, Enterprise custom",
    pricingModel: "Flat per-board",
    freePlan: "No free plan (30-day free trial)",
    founded: "2016",
    fundingStatus: "Bootstrapped",
    bestFor:
      "Game studios and B2B SaaS that want a single simple feedback board and value stability over aggressive feature velocity.",
    pros: [
      "Unlimited contributors and team members on every paid tier",
      "SAML SSO included on all paid plans, not just enterprise",
      "Long-running bootstrapped company since 2016 — very stable",
      "Native integrations with Jira, Slack, Discord, Microsoft Teams, and Zapier",
      "30-day free trial with almost all features unlocked",
    ],
    cons: [
      "Per-board pricing — multiple products mean linearly multiplied costs",
      "No permanent free plan",
      "No native changelog or AI features",
      "UI feels dated relative to Featurebase and UserJot",
      "Slow feature velocity reflecting the founder's modest-growth philosophy",
    ],
    features: {
      feedbackBoard: true,
      publicRoadmap: false,
      changelog: false,
      widget: true,
      api: true,
      voting: true,
      comments: true,
      customDomain: true,
      sso: true,
      mrrWeightedVoting: false,
      anonymousPosting: true,
      flatPricing: true,
      aiFeatures: false,
      slackIntegration: true,
      jiraIntegration: true,
    },
    faqs: [
      {
        question: "How much does Feature Upvote cost?",
        answer:
          "Feature Upvote charges per board: Indie at $49/board/month and Standard at $99/board/month, with a 20% discount for annual billing. Enterprise pricing is available on request.",
      },
      {
        question: "Does Feature Upvote have a free plan?",
        answer:
          "No. Feature Upvote does not offer a permanent free plan, but it ships a 30-day free trial with nearly all features enabled and no credit card required.",
      },
      {
        question: "Is Feature Upvote a good Canny alternative?",
        answer:
          "Feature Upvote is a credible Canny alternative for teams that only need a single feedback board with predictable per-board pricing. It lacks Canny's changelog, AI summarization, and revenue-weighted voting.",
      },
      {
        question: "Does Feature Upvote support multiple boards?",
        answer:
          "Yes, but each additional board increases your monthly bill linearly. Teams running many separate products tend to outgrow the per-board model and look at flat-priced suites like UserJot or ProductLift.",
      },
    ],
  },

  hellonext: {
    slug: "hellonext",
    name: "Hellonext",
    website: "https://featureos.com",
    verifiedAt: "2026-04-26",
    description:
      "Feedback, roadmap, changelog, and knowledge base suite (rebranded from Hellonext to FeatureOS in 2023).",
    longDescription:
      "Hellonext, now branded as FeatureOS, is a customer feedback and product management platform founded in 2018 by Karthik Kamalakannan in Chennai, India under the Skcript Technologies parent company. The product rebranded from Hellonext to FeatureOS in August 2023 to reflect its expansion from a feedback board into a full product suite covering boards, roadmaps, changelogs, a knowledge base, and feedback forms.\n\nFeatureOS targets product managers and CX teams at growing SaaS companies. It includes AI-powered features for sentiment analysis, duplicate detection, and feedback summarization, plus integrations with Slack, GitHub, Jira, and (on Business) Salesforce. The platform is profitable and customer-funded — Hellonext crossed $30K MRR with a 5-person team and continues to operate as a bootstrapped business.\n\nPricing is flat-rate with three tiers, billed monthly or annually (17% discount on annual): Starter at $60/month or $50/month (yearly) with 5 seats and 5 boards, Growth at $120/month or $100/month (yearly) with 10 seats, 10 boards, API access, white-labeling, and SSO, and Business at $250/month or $208/month (yearly) with 15 seats, unlimited boards, dedicated CSM, and Salesforce integration. Additional seats and boards cost $15/month each. A 30-day free trial is available; there is no permanent free plan.",
    pricing: "Starter $50/mo, Growth $100/mo, Business $208/mo (yearly billing)",
    pricingModel: "Flat-rate (with $15/mo per extra seat or board)",
    freePlan: "No free plan (30-day free trial)",
    founded: "2018",
    fundingStatus: "Bootstrapped",
    bestFor:
      "Mid-market SaaS product teams that want an all-in-one suite with AI features and Salesforce integration.",
    pros: [
      "All-in-one suite covering boards, roadmap, changelog, knowledge base, and forms",
      "AI-powered sentiment analysis, duplicate detection, and summarization",
      "Native integrations with Slack, GitHub, Jira, and Salesforce",
      "30-day free trial across all tiers without a credit card",
      "Bootstrapped and profitable since 2018, low churn risk",
    ],
    cons: [
      "No permanent free plan — only a 30-day trial",
      "Higher entry price ($50/month yearly) than competitors like Sleekplan",
      "Salesforce integration gated behind the Business tier",
      "Extra seats and boards cost $15/month each on top of base subscription",
      "Recent rebrand from Hellonext to FeatureOS has caused some user confusion",
    ],
    features: {
      feedbackBoard: true,
      publicRoadmap: true,
      changelog: true,
      widget: true,
      api: true,
      voting: true,
      comments: true,
      customDomain: true,
      sso: true,
      mrrWeightedVoting: false,
      anonymousPosting: true,
      flatPricing: true,
      aiFeatures: true,
      slackIntegration: true,
      jiraIntegration: true,
    },
    faqs: [
      {
        question: "Is Hellonext the same as FeatureOS?",
        answer:
          "Yes. Hellonext rebranded to FeatureOS in August 2023. The product, team, and customer accounts carried over — only the brand and domain changed.",
      },
      {
        question: "How much does FeatureOS cost?",
        answer:
          "FeatureOS has three flat-rate tiers: Starter at $60/month ($50/month yearly), Growth at $120/month ($100/month yearly), and Business at $250/month ($208/month yearly). Extra seats and boards are $15/month each.",
      },
      {
        question: "Does FeatureOS have a free plan?",
        answer:
          "No, there is no permanent free plan. FeatureOS offers a 30-day free trial across all tiers and does not require a credit card to start.",
      },
      {
        question: "Is FeatureOS a good Canny alternative?",
        answer:
          "FeatureOS is a strong Canny alternative for mid-market teams that want AI features, a knowledge base, and Salesforce integration in one suite. It does not currently offer MRR-weighted voting.",
      },
    ],
  },
}

/** Only competitors with a `verifiedAt` timestamp are exposed publicly. */
export function getVerifiedCompetitors(): Competitor[] {
  return Object.values(competitors).filter(
    (c): c is Competitor => c.verifiedAt !== null,
  )
}

export function getCompetitor(slug: string): Competitor | null {
  const c = competitors[slug]
  return c?.verifiedAt ? c : null
}
