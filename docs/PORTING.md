# Porting the prototype to React + shadcn

The vanilla-JS prototype lives in `legacy/` (build: `legacy/build.sh`, served at http://localhost:8090).
The new app is Vite + React 19 + TypeScript + Tailwind v4 + shadcn (radix, nova preset), served by `pnpm dev`.

## Goal
Port each legacy screen to React, keep every fact, KPI and behaviour that matters, and restyle it to the
**Default** design system (`/Users/akhilbordia/Downloads/DESIGN Default.md`): Linear/Vercel-like, dark-first,
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
- Signal blue only for active state, links, focus. Primary button = default variant (bone pill in dark).
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
