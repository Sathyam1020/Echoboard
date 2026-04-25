import {
  Bug,
  Code2,
  Globe,
  type LucideIcon,
  MessageSquare,
  Package,
  Rocket,
  ShoppingBag,
  Smartphone,
  Users,
  Wrench,
  Zap,
} from "lucide-react"

// Use-case pages (`/for/<slug>`) are persona-driven landing pages. Each one
// reframes the same product around the language of one audience — same
// features, different vocabulary. Search intent is "feedback tool for
// <persona>" rather than "<competitor> alternative", so we lean into
// pain-points-first copy instead of competitive teardown.
//
// Unlike alternatives, these don't require external research — they're
// positioning content. Add to this file to ship a new use-case page.

export type UseCaseFeature = {
  icon: LucideIcon
  title: string
  description: string
}

export type UseCase = {
  slug: string
  /** Short label used in nav and lists, e.g. "SaaS startups". */
  name: string
  /** H1 of the page. */
  headline: string
  /** Meta description + lede paragraph. */
  description: string
  /** Concrete description of who this page is for. */
  audience: string
  /** 4-5 pain points this audience faces, framed as quoted internal monologue. */
  pains: string[]
  /** 6 features mapped to "why this matters for this audience". */
  features: UseCaseFeature[]
  /** A 3-step concrete workflow showing how the audience uses EchoBoard. */
  workflow: { title: string; description: string }[]
  faqs: { question: string; answer: string }[]
  ctaHeadline: string
  ctaDescription: string
}

const F = {
  flatPricing: {
    icon: Zap,
    title: "Flat pricing, no per-user math",
    description:
      "$0 free, $49/mo Pro. Your bill doesn't change as your audience grows from 100 voters to 100,000.",
  },
  noLogin: {
    icon: Users,
    title: "No-login feedback widget",
    description:
      "Drop in a script tag. Visitors submit with just an email — no account creation, no confirmation flow.",
  },
  publicRoadmap: {
    icon: Rocket,
    title: "Public roadmap included",
    description:
      "Show what you're building next. Filter by status, group by board, share a public URL.",
  },
  changelog: {
    icon: Package,
    title: "Changelog ships with feedback",
    description:
      "Close the loop — when you ship, post a changelog entry. Subscribers get notified automatically.",
  },
  voting: {
    icon: MessageSquare,
    title: "Voting + threaded comments",
    description:
      "Voters surface what matters. Threads let you ask follow-up questions in context.",
  },
  widget: {
    icon: Globe,
    title: "Embed anywhere",
    description:
      "Drop the widget on your marketing site, in-product, in your help center — wherever your users are.",
  },
} as const

export const useCases: Record<string, UseCase> = {
  "saas-startups": {
    slug: "saas-startups",
    name: "SaaS startups",
    headline: "Customer feedback for SaaS startups",
    description:
      "Collect feature requests, run a public roadmap, and ship a changelog — without paying per tracked user before you've found product-market fit.",
    audience:
      "Early-stage SaaS teams (pre-PMF through Series A) who need feedback infrastructure but can't justify $80-300/mo before they have repeatable revenue.",
    pains: [
      "We're talking to users every day but feedback lives in 6 places: Slack, Intercom, email, Notion, Linear, and one Google Doc nobody opens.",
      "Canny costs more than our entire content marketing budget.",
      "Customers ask 'what's on the roadmap?' constantly and we send them a screenshot of a Linear board.",
      "We ship something and only the customer who asked for it knows we shipped it — everyone else assumes we're idle.",
    ],
    features: [
      F.flatPricing,
      F.publicRoadmap,
      F.noLogin,
      F.changelog,
      F.voting,
      F.widget,
    ],
    workflow: [
      {
        title: "Drop the widget on your dashboard",
        description:
          "One script tag in your authenticated app. Customers click 'Feedback' from anywhere, drop a request, and you see it in your inbox.",
      },
      {
        title: "Build a public roadmap from upvoted posts",
        description:
          "Move requests through statuses (Open → Planned → In progress → Shipped). The public roadmap mirrors them automatically.",
      },
      {
        title: "Post a changelog when you ship",
        description:
          "Voters and commenters on the original post get an email when status flips to Shipped. You close the loop with one click.",
      },
    ],
    faqs: [
      {
        question: "Is EchoBoard's free plan really enough for a SaaS startup?",
        answer:
          "For most teams pre-Series A, yes. The free plan includes unlimited users, unlimited posts, the widget, public roadmap, and changelog — everything Canny gates behind their $19+ Core plan. Pro ($49/mo) adds multiple boards, custom domains, and removes EchoBoard branding.",
      },
      {
        question: "Can we hide our roadmap until we're ready to share it?",
        answer:
          "Yes. Boards default to private until you flip a switch. You can run an internal-only feedback flow first, then go public when you're ready.",
      },
      {
        question: "Do we need to sync feedback to Linear or Jira?",
        answer:
          "Most early-stage teams just use EchoBoard as the source of truth and link Linear tickets in the post itself. Native Linear/Jira integrations are on the roadmap for Pro.",
      },
    ],
    ctaHeadline: "Stop losing feedback to chat threads",
    ctaDescription:
      "Free forever for SaaS teams of any size. Set up in two minutes.",
  },

  "developer-tools": {
    slug: "developer-tools",
    name: "Developer tools",
    headline: "Feedback tool for devtool companies",
    description:
      "Collect feature requests from developers without forcing them into yet another product portal. Bring feedback into GitHub-flavored workflows.",
    audience:
      "Companies building libraries, CLIs, IDE plugins, APIs, or any tool whose primary users are software engineers — an audience that hates account creation and product portals.",
    pains: [
      "Our users open GitHub issues for feature requests, but issues are linear and hard to vote on.",
      "Discord requests get lost in the firehose 24 hours later.",
      "Every developer hates being forced to sign up to vote on a feature.",
      "We have 10k stars but no idea which 5 features the community actually wants most.",
    ],
    features: [
      F.noLogin,
      F.flatPricing,
      F.voting,
      F.publicRoadmap,
      F.changelog,
      F.widget,
    ],
    workflow: [
      {
        title: "Link to your EchoBoard from your README",
        description:
          "Replace 'Open an issue for feature requests' with 'Vote on features here'. Devs can vote anonymously without creating yet another account.",
      },
      {
        title: "Triage requests in one place",
        description:
          "Merge duplicates, tag posts by category (CLI / SDK / docs), and move them through your pipeline from Open to Shipped.",
      },
      {
        title: "Sync shipped releases to changelog",
        description:
          "When you cut a release, post a changelog entry that links the GitHub release notes. Voters get notified, releases get distribution.",
      },
    ],
    faqs: [
      {
        question: "How is this different from GitHub Issues for feature requests?",
        answer:
          "Issues are linear and have no upvote mechanism beyond emoji reactions. EchoBoard sorts by votes, groups by status, deduplicates, and lets non-GitHub-savvy users contribute. You can keep using Issues for bugs and EchoBoard for features.",
      },
      {
        question: "Can users submit anonymously?",
        answer:
          "Yes. The widget asks only for an email — no password, no GitHub OAuth flow, no account. You can also pre-identify signed-in users via a JS call.",
      },
      {
        question: "Can we self-host?",
        answer:
          "Not yet. EchoBoard is a hosted product — we focus engineering effort on the product itself rather than self-hosting bundles. Most devtool companies use the hosted version on a custom domain.",
      },
    ],
    ctaHeadline: "Devs hate signups. Skip them.",
    ctaDescription:
      "No-login feedback widget, free for unlimited users. Built for tools whose users are engineers.",
  },

  "e-commerce": {
    slug: "e-commerce",
    name: "E-commerce",
    headline: "Customer feedback for e-commerce stores",
    description:
      "Run a feature request board for product ideas, packaging requests, and bundle suggestions. Show your community what you're shipping next.",
    audience:
      "E-commerce brands (Shopify, WooCommerce, custom storefronts) who want a structured way to collect product ideas from their community without sifting through Instagram DMs.",
    pains: [
      "Customers DM us 'when are you bringing back the X color?' constantly — we've lost track of demand.",
      "We get the same product idea from 50 different customers and no way to show 'we heard you, it's coming'.",
      "Our subscription customers want a way to influence the roadmap and feel ownership.",
      "Reviews aren't the right tool — they're about products that exist, not products people wish existed.",
    ],
    features: [
      F.noLogin,
      F.publicRoadmap,
      F.flatPricing,
      F.voting,
      F.changelog,
      F.widget,
    ],
    workflow: [
      {
        title: "Add 'Suggest a product' to your store nav",
        description:
          "Link to a public EchoBoard. Customers vote on flavor/color/size requests, packaging changes, and bundle ideas without making an account.",
      },
      {
        title: "Group requests by category",
        description:
          "Use boards or tags to separate Product Ideas, Packaging, and Customer Service requests. Filter votes by category to see top demand.",
      },
      {
        title: "Announce new drops via changelog",
        description:
          "When you launch the requested flavor, post a changelog entry. Subscribers (the people who voted) get notified — turn product launches into engagement.",
      },
    ],
    faqs: [
      {
        question: "Is this for product reviews or product requests?",
        answer:
          "Requests, not reviews. EchoBoard is for 'I wish you sold X' or 'please bring back Y' — pre-purchase demand signals. Use a review platform for post-purchase reviews of products you already sell.",
      },
      {
        question: "Can we limit who can vote?",
        answer:
          "On Pro you can require an email match against your subscriber list, so only paying customers vote on roadmap items. The free plan is fully open.",
      },
      {
        question: "Does this integrate with Shopify?",
        answer:
          "It embeds on a Shopify storefront via the widget script tag. Native Shopify integrations (auto-pre-identify customers from their Shopify account) are on the roadmap.",
      },
    ],
    ctaHeadline: "Turn DMs into a roadmap",
    ctaDescription:
      "Stop losing product ideas in your inbox. Free for unlimited customers.",
  },

  "open-source": {
    slug: "open-source",
    name: "Open source",
    headline: "Feedback tool for open source projects",
    description:
      "A free, public feedback board for your OSS project. Let your community vote on features without overwhelming GitHub Issues.",
    audience:
      "OSS maintainers — solo developers and small core teams — who need to surface what their users actually want without their issue tracker exploding.",
    pains: [
      "GitHub Issues mixes bugs and feature requests, and feature requests sit at the bottom forever.",
      "We get five duplicate 'please add dark mode' issues per week.",
      "There's no way to gauge demand — emoji reactions are noise, not signal.",
      "Most paid feedback tools price like SaaS companies, not OSS projects.",
    ],
    features: [
      F.flatPricing,
      F.voting,
      F.noLogin,
      F.publicRoadmap,
      F.changelog,
      F.widget,
    ],
    workflow: [
      {
        title: "Move feature requests out of Issues",
        description:
          "Add a 'Feature requests' link in your README pointing to your EchoBoard. Keep Issues for bugs and PRs.",
      },
      {
        title: "Auto-merge duplicates",
        description:
          "When five people request the same thing, merge them into one post. Vote counts combine — you see real demand.",
      },
      {
        title: "Ship + changelog",
        description:
          "When a feature lands in a release, mark its post as Shipped. Subscribers get notified automatically.",
      },
    ],
    faqs: [
      {
        question: "Is EchoBoard really free for OSS projects?",
        answer:
          "Yes — the free plan covers unlimited users, posts, and votes, with the widget and public roadmap included. There's no special 'OSS tier' because the regular free tier is already enough.",
      },
      {
        question: "Should we still use GitHub Issues for bugs?",
        answer:
          "Yes. Issues are great for bugs (reproducible, tied to commits, used by maintainers). EchoBoard handles feature requests (community demand signal). Many OSS projects link both ways.",
      },
      {
        question: "Can we self-host?",
        answer:
          "Not currently. If self-hosting is mandatory, Fider (also OSS) is worth checking out. Most OSS projects use the hosted EchoBoard with a public board.",
      },
    ],
    ctaHeadline: "Free, forever — including for your OSS project",
    ctaDescription: "No tracked-user limits, no paywalled features.",
  },

  "mobile-apps": {
    slug: "mobile-apps",
    name: "Mobile apps",
    headline: "In-app feedback for mobile apps",
    description:
      "Collect feature requests from iOS and Android users without dragging them out of the app to a desktop-first feedback portal.",
    audience:
      "Mobile-first app teams (iOS, Android, React Native) who need feedback infrastructure that doesn't break on a phone screen — most feedback tools were built mobile-second.",
    pains: [
      "Most feedback portals are desktop-first — users tap a link and land on a broken layout.",
      "App Store reviews are anonymous, untracked, and one-shot — we can't follow up.",
      "We get tons of email feedback but no way to vote, prioritize, or close the loop.",
      "Our crash reporter handles bugs. Nothing handles requests.",
    ],
    features: [
      F.widget,
      F.noLogin,
      F.flatPricing,
      F.voting,
      F.changelog,
      F.publicRoadmap,
    ],
    workflow: [
      {
        title: "Embed the feedback view in your app",
        description:
          "Open EchoBoard in a WebView from your settings menu, or embed the widget on your marketing site. Both render correctly on small screens.",
      },
      {
        title: "Pre-identify signed-in users",
        description:
          "Pass the user's email into the widget so they don't have to type it. Their submissions show up in your inbox attached to their account.",
      },
      {
        title: "Notify on ship",
        description:
          "When you ship a requested feature in v2.5, mark the post as Shipped. Original requester gets an email — they can update the app and see their idea live.",
      },
    ],
    faqs: [
      {
        question: "Do you have a native iOS/Android SDK?",
        answer:
          "Not yet. The current pattern is a WebView embedding the public board, with the user's email passed via URL parameter for auto-identification. This works well on both platforms today.",
      },
      {
        question: "How do we handle App Store reviews vs in-app feedback?",
        answer:
          "App Store reviews are good for surface-level sentiment. In-app feedback (via EchoBoard) is good for specific feature requests where you want to follow up. Both have a place.",
      },
      {
        question: "Can users vote anonymously?",
        answer:
          "Yes — the widget only asks for an email. They can submit and vote without creating an account.",
      },
    ],
    ctaHeadline: "Mobile-first feedback, finally",
    ctaDescription:
      "Built to render correctly on any phone. Free for unlimited users.",
  },

  "indie-hackers": {
    slug: "indie-hackers",
    name: "Indie hackers",
    headline: "Feedback tool for indie hackers",
    description:
      "When you're shipping solo or with a co-founder, feedback infrastructure can't be a $79/mo line item. EchoBoard is free for unlimited users.",
    audience:
      "Solo founders, two-person teams, and bootstrapped indie projects with under $5k MRR. Tight budgets, no time for setup, allergic to per-seat pricing.",
    pains: [
      "Every SaaS tool I add eats into MRR I haven't earned yet.",
      "I want a feedback board, but Canny is more than my hosting bill.",
      "I'm shipping fast and losing track of what users asked for two weeks ago.",
      "I don't want a 'request a demo' tier — I want sign up and ship.",
    ],
    features: [
      F.flatPricing,
      F.noLogin,
      F.widget,
      F.publicRoadmap,
      F.changelog,
      F.voting,
    ],
    workflow: [
      {
        title: "Sign up free, paste the widget",
        description:
          "Two minutes. No credit card, no demo call, no 'contact us for pricing' tier. Drop the script tag and ship.",
      },
      {
        title: "Build in public",
        description:
          "Public roadmap on your homepage shows what's next. Tweet the link. Indie hackers love seeing roadmaps — it's free marketing.",
      },
      {
        title: "Close the loop with changelog",
        description:
          "When you ship, post a changelog entry. Tweet it. Email it. Voters get notified automatically.",
      },
    ],
    faqs: [
      {
        question: "Is the free plan really free forever?",
        answer:
          "Yes. Unlimited users, unlimited posts, the widget, public roadmap, and changelog — all free. We don't have a hidden 'after 30 days' clause.",
      },
      {
        question: "What does Pro add that I'd actually need?",
        answer:
          "Multiple boards (one per product), custom domains (feedback.yourdomain.com), and white-labeling. Most indie projects with one product don't need it until they're at $10k+ MRR.",
      },
      {
        question: "Can I switch from Canny without disrupting my users?",
        answer:
          "Yes. Export Canny posts as CSV, import to EchoBoard, swap the embed script. Total downtime: usually under 30 minutes. Voters get re-emailed an opt-in to keep following their posts on the new home.",
      },
    ],
    ctaHeadline: "Free forever. Set up in two minutes.",
    ctaDescription:
      "Built for indie hackers. No demo calls, no per-seat math, no annual minimums.",
  },

  "plugin-makers": {
    slug: "plugin-makers",
    name: "Plugin & extension makers",
    headline: "Feedback tool for plugin and extension makers",
    description:
      "Run a feature request board for your Figma plugin, browser extension, Notion integration, or VS Code extension — without sending users to a generic ticket portal.",
    audience:
      "Builders of plugins and extensions: Figma, Chrome/Edge, VS Code, Raycast, Notion, Slack apps, Shopify apps. Niche audiences that won't sign up to vote, but will leave a quick note in a widget.",
    pains: [
      "Plugin store reviews are 1-5 stars — useful for sentiment, useless for prioritization.",
      "Users email me feature requests and I lose them in my inbox.",
      "I want to show what's coming next without maintaining a separate marketing site.",
      "Most feedback tools are priced for SaaS, not for $5/month plugin businesses.",
    ],
    features: [
      F.flatPricing,
      F.noLogin,
      F.widget,
      F.publicRoadmap,
      F.changelog,
      F.voting,
    ],
    workflow: [
      {
        title: "Link from inside your plugin UI",
        description:
          "Add a 'Suggest a feature' menu item that opens a public EchoBoard. Users submit without leaving the platform host (Figma / Chrome / Notion).",
      },
      {
        title: "Tag by surface area",
        description:
          "Use tags to organize requests by part of your plugin (settings / canvas / sidebar). Spot which area generates the most demand.",
      },
      {
        title: "Ship + announce",
        description:
          "Update your plugin, mark the post as Shipped. The voter gets notified. Your changelog page becomes a marketing surface that lives on its own URL.",
      },
    ],
    faqs: [
      {
        question: "Will this work for a Figma plugin?",
        answer:
          "Yes. Figma plugin UIs can open external URLs — link to your public EchoBoard. Most plugin authors use this pattern with EchoBoard's free plan.",
      },
      {
        question: "What about a Chrome/Edge extension?",
        answer:
          "Same pattern. The extension opens the EchoBoard URL in a new tab, or you embed the widget on your extension's settings page (which is just a webpage).",
      },
      {
        question: "Can I run multiple plugins from one account?",
        answer:
          "On the free plan you get one board per workspace. Pro adds multiple boards, so you can keep separate roadmaps for separate plugins under one account.",
      },
    ],
    ctaHeadline: "Built for the long tail",
    ctaDescription:
      "Free for plugins of any size. Pro $49/mo flat once you grow into multiple products.",
  },

  "internal-feedback": {
    slug: "internal-feedback",
    name: "Internal feedback",
    headline: "Internal feedback tool for teams",
    description:
      "Run a feedback board for internal tools, employee suggestions, or team retros — without paying enterprise feedback prices for an audience of 50.",
    audience:
      "Teams running internal tooling, IT teams collecting employee feedback, HR running engagement surveys, ops teams running retros. Small audiences, infrequent voting, but signal that matters.",
    pains: [
      "Our internal tools team has no idea which improvements employees actually want.",
      "We send out engagement surveys quarterly and the answers vanish into a Notion page.",
      "Every enterprise feedback tool starts at 'contact sales' before we know if we'll use it.",
      "We want a single intranet page where any employee can suggest an improvement.",
    ],
    features: [
      F.flatPricing,
      F.voting,
      F.publicRoadmap,
      F.changelog,
      F.widget,
      F.noLogin,
    ],
    workflow: [
      {
        title: "Set up a private board",
        description:
          "Create a private board for internal use. Employees access via SSO (Pro) or shared link.",
      },
      {
        title: "Categorize by team",
        description:
          "Tag requests by which team owns them (Eng / IT / Ops / People). Filter to see what each team should prioritize.",
      },
      {
        title: "Close the loop with internal changelog",
        description:
          "When IT ships an internal tool improvement, post to the changelog. Employees who voted get notified — they see their input shipped.",
      },
    ],
    faqs: [
      {
        question: "Can the board be private to our company?",
        answer:
          "Yes. Boards default to private — only people you invite can see and vote. Pro adds SSO so authentication is automatic via your IdP.",
      },
      {
        question: "Is there an SSO option?",
        answer:
          "SSO/SAML is on the Pro roadmap. The current Pro plan supports custom domains and team invites; SSO ships in a coming release.",
      },
      {
        question: "Is this overkill for a 50-person company?",
        answer:
          "No — the free plan covers small companies fine. Pro ($49/mo flat) makes sense once you want SSO, multiple boards (one per team), or custom branding.",
      },
    ],
    ctaHeadline: "Internal feedback, without the enterprise price tag",
    ctaDescription:
      "Free for unlimited employees. Pro $49/mo flat — no per-seat ladder.",
  },
}

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  "saas-startups": Rocket,
  "developer-tools": Code2,
  "e-commerce": ShoppingBag,
  "open-source": Bug,
  "mobile-apps": Smartphone,
  "indie-hackers": Zap,
  "plugin-makers": Wrench,
  "internal-feedback": Users,
}

export function getUseCase(slug: string): UseCase | null {
  return useCases[slug] ?? null
}

export function getAllUseCases(): UseCase[] {
  return Object.values(useCases)
}

export function getUseCaseIcon(slug: string): LucideIcon {
  return ICON_BY_SLUG[slug] ?? Package
}
