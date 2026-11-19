# Porting the prototype to React + shadcn

The vanilla-JS prototype lives in `legacy/` (build: `legacy/build.sh`, served at http://localhost:8090).
The new app is Vite + React 19 + TypeScript + Tailwind v4 + shadcn (radix, nova preset), served by `pnpm dev`.

## Goal
Port each legacy screen to React, keep every fact, KPI and behaviour that matters, and restyle it to the
**Default** design system's structure in **Sirion's brand palette** (sirion.ai: teal-black, plum primary, light-teal accents, periwinkle AI; tokens already in `src/index.css`) (`/Users/akhilbordia/Downloads/DESIGN Default.md`): Linear/Vercel-like, dark-first,
hairline borders, calm type, compact and information-dense. Polish it to a share-ready product.
Improve layout and hierarchy where the legacy one is cluttered — verdict first, evidence on demand.

## Out of scope (client asked to drop)
Evidences / "Risk reasons" section, any "N new updates" badge, competitive intelligence, Actions / plays tab.

## Building blocks
- Data: `import { ... } from '@/data/legacy'` — exports AREAS, band, bestName, col, DAY, daysBetween, displayName,
  fmtDate, money, monthEnd, MONTHS, ORG, P, rel, ROWS, RULES, STRONG, SUGGEST, SYSTEM, T, TA_EVENTS, TA_EXAMPLE,
  TA_NEWS_PEOPLE, TA_REAL, TA_RECORD, taEpisode, taEvidence, taFlags, taMonths, taPeople, taPeopleIndex, TODAY.
  Constants and helpers defined inside a legacy `screen-*.js` file are yours to port into your own files (pure TS, no DOM strings).
- Health: `@/components/health` — `bandOf`, `isMissing`, `BAND_LABEL`, `bandText/bandBg/bandSoft`, `HealthRing`, `HealthBar`, `HealthPill`.
- Page: `@/components/page` — `PageHeader`, `SectionTitle`, `Stat`, `Empty`.
- shadcn UI in `src/components/ui/`: avatar badge breadcrumb button card chart command dialog dropdown-menu input
  input-group kbd popover progress scroll-area select separator sheet sidebar skeleton table tabs textarea toggle toggle-group tooltip.
  Need another? `pnpm dlx shadcn@latest add -y <name> </dev/null`. Charts: shadcn `chart` (recharts). Icons: lucide-react.
- Routing: `go('account' | 'accounts' | 'portfolio' | 'states')` from `@/lib/route`.

## Design rules
- Use theme tokens only (`bg-card`, `bg-muted`, `bg-surface-2`, `border-hairline`, `text-muted-foreground`, `text-good/warn/bad`,
  `bg-good-soft`…, `text-signal`, `text-ai`/`bg-ai-soft` for AI-written content). No hex colours in components.
- Green / amber / red mean **health only** — never a chart series or decoration. Chart series use `--chart-1..5`.
- `signal` (Sirion teal) only for active state, links, focus. Primary button = default variant (Sirion plum) — one per view.
- Headings weight 400–500, never 600+. Numbers tabular. 0.5px-feel hairlines, no heavy shadows, no gradients.
- A missing value reads **"No data"** (use `isMissing`), never −1, "-" or undefined; leave it out of averages.
- No coloured left-edge strips on cards or rows — use icon tiles, dots or tints.
- Expand / show more are bordered pill buttons (`Button variant="outline" size="sm"`), never underlined text links.
- Live, enabled rows never use muted grey for their main text (reads as disabled).
- Must look right in dark and light (`.dark` class on html) and at phone width (no horizontal page scroll; tables scroll in their card).
- Use `Sheet` for side panels/drawers, `Dialog` for modals, `Tooltip` for info tips, `Tabs`/`ToggleGroup` for segmented controls.

## Working rules
- Edit only the files you own. If you need a change in a shared file (health.tsx, page.tsx, index.css, ui/*), say so in your report instead.
- Check with `npx tsc -b`; fix errors in your files (ignore errors in files other agents are still writing).
- The dev server is already running with HMR. Do not start servers, do not open a browser, do not commit.

## Loading
`useIsLoading()` from `@/lib/loading` is true for ~700ms after every route change (simulated fetch).
While true, render each widget's `Skeleton` in the widget's real shape.

## No edge banding, no AI slop (user rule — overrides anything above)
- **No edge banding**: no coloured left/top/side strips on cards, rows, callouts or tabs; no status-tinted whole cards or tiles
  (e.g. a red "ARR at risk" tile); no gradient bands or hero washes. Status shows on the value or a small dot/pill only.
- **No AI slop elements**: no Sparkles/stars/wand icons, no "AI" badges or pills, no `ai-soft` tinted cards, no glow,
  gradient text or shimmer. AI-written text looks like normal content; if provenance matters, one plain muted line ("From monthly summaries").
- **No AI slop content**: no eyebrows ("Sirion · Account health"), no italic emphasis in headings, no subtitles that restate the
  title ("Every account in your book with…"), no "Written from…/Every statement links to…" disclaimers, no "illustrative" notes,
  no fake freshness ("Updated 26 mins ago"), no stacked info-(i) tips, no decorative icon tiles on every KPI, no count-up animations,
  no filler words (seamless, actionable, at a glance, insights, unlock, empower). Short, specific, factual labels.

## Polish round 2 (user feedback, overrides anything above)
- **Less to read.** One idea per widget. Cut secondary lines, merge chips, drop labels that a number or icon already says.
  Prefer a visual (meter, bar, ring, sparkline, dot) over a sentence. Truncate long text to 1–2 lines; full text lives in a Sheet.
- **Side sheets, not modals,** for explanations and drill-downs (e.g. "How scores work" is a right `Sheet`, not a `Dialog`).
- **Widgets are visual:** every KPI/stat tile carries a small visual — mini sparkline, progress/meter, ring, delta chip — not just a number + caption.
- **Lists:** compact rows (≈44–52px), clear left anchor (icon in a 28px neutral circle or avatar), title on one line, one muted meta line,
  status as a small dot/pill aligned right, hover row tint, whole row clickable, grouped by day/month with sticky small headers when long.
  No full-paragraph bodies in list rows.
- **Iconography:** lucide only, `size-4` (16px), stroke default, `text-muted-foreground` unless active; one consistent icon per concept
  across the app (e.g. meeting = CalendarDays, email = Mail, ticket = LifeBuoy, health = HeartPulse, renewal = CalendarClock,
  revenue = DollarSign, people = Users). No tinted icon tiles; a neutral 28px circle (`bg-muted`) is the only container allowed.

## Feedback states (user ask: hover states, tooltips, toasts)
- **Hover:** every interactive element has a visible hover (row tint `hover:bg-accent/60`, card `hover:bg-accent/40` + cursor-pointer,
  icon buttons `hover:bg-accent`), plus `focus-visible:ring-2 ring-ring`. Non-interactive things never get hover styles.
- **Tooltips** (shadcn `Tooltip`): every icon-only button; truncated text (full text); abbreviations/codes (NRR, GRR, CARR, O7, MAU, PER);
  chart marks; status dots; meters/rings (exact value + what it means); dates shown relative ("41 days" → full date). Short, no sentences > 1 line.
- **Toasts** (`import { toast } from 'sonner'`, Toaster already mounted bottom-right): confirm every user action that changes state or
  happens off-screen — CSV export ("Exported 102 contacts"), role changed/confirmed (with **Undo** action), filters reset, copied email,
  saved view switched only if off-screen, retry success/failure ("Couldn't load pods" error toast + Retry action), Ask new chat.
  Never toast navigation or simple open/close. One line title, optional muted description.

## Feedback states (user ask: hover states, tooltips, toasts)
- **Hover:** every interactive element has a visible hover (row tint `hover:bg-accent/60`, clickable card `hover:bg-accent/40`,
  icon buttons `hover:bg-accent`) plus `focus-visible:ring-2 ring-ring`. Non-interactive things never get hover styles.
- **Tooltips** (shadcn `Tooltip`): every icon-only button; truncated text; codes/abbreviations (NRR, GRR, CARR, O7, MAU, PER);
  chart marks; status dots; meters/rings (exact value); relative dates ("41 days" → full date). One short line.
- **Toasts** (`import { toast } from 'sonner'`; Toaster mounted bottom-right): confirm actions that change state or happen off-screen —
  CSV export, role changed/confirmed (with an **Undo** action), filters reset, email copied, retry failed (error toast with Retry).
  Never toast navigation or plain open/close.

## Toolbars
One row: saved views (segmented, overflow into a "More" menu) on the left; search + icon buttons (Filter, Columns) on the right,
with tooltips. "Reset" only appears when something differs from the default.
