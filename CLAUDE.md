# echoboard

Before any work in this repo, load the workflow from Obsidian via the `obsidian` MCP (tool: `mcp__obsidian__get_vault_file`). Read in this order:

1. `coding-rules.md` — universal rules (applies to every project)
2. `coding-agent-setup.md` — the 6-agent pipeline
3. `planning-mode.md` — how plans are produced before coding
4. `echoboard/project-rules.md` — this project's stack, design system, conventions, and testing recipe

Everything for this project lives under `echoboard/` in the Obsidian vault:
- Project rules: `echoboard/project-rules.md`
- Plans: `echoboard/<feature>.md` + sub-plans in `echoboard/<feature>/phase-N-<name>.md`
- Session logs: `echoboard/session-logs/DD-MM-YYYY-HH_MM-topic-name.md`
- Archive: `echoboard/project-rules-archive.md` (auto-populated when rules file exceeds 280 lines)

Nothing project-specific is stored in this repo — edit Obsidian files directly. This `CLAUDE.md` is just a pointer.

## How work flows

**Planning is automatic.** When you describe a non-trivial feature, Claude will enter planning mode per `coding-rules.md` — no command needed. The plan is written to `echoboard/<feature>.md` in Obsidian. Trivial edits (typo fixes, one-liners) skip planning.

**The 6-agent pipeline is opt-in.** After a plan exists and you've approved it, run `/code <feature>` to invoke the full Searcher → Coder → BC Checker → Reviewer → Tester pipeline. If you just say "start coding," Claude will code normally with rules applied — the pipeline only runs when you explicitly ask for it.

## Slash commands

Optional, explicit triggers:
- `/plan <feature>` — force planning mode if auto-planning didn't fire (or you want to plan before even describing the feature)
- `/code <feature>` — **required** to run the 6-agent pipeline against an existing plan

Session memory (CPR):
- `/resume` — start of session; loads universal rules, project rules, recent session logs. Supports `/resume 5` or `/resume <keyword>`.
- `/preserve` — mid-session; captures learnings into `echoboard/project-rules.md` with auto-archive at 280 lines.
- `/compress` — end of session, before `/compact`; saves the full session as a searchable log in `echoboard/session-logs/`.

## Typical day

`/resume` → describe feature (Claude auto-plans) → approve plan → `/code <feature>` → `/preserve` after big decisions → `/compress` → `/compact` (last, clears context).

**Important:** Disable auto-compact in `/config`. If auto-compact fires before you run `/compress`, the session archive is silently lost.
