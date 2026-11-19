# Sirion Account Health — redesign

A redesign of Sirion's Account Health Index (AHI) for Customer Success Managers. It keeps every KPI and widget of the live app and changes how they are ranked, grouped and shown: verdict first, evidence on demand, one design system, and one set of loading, empty and error states.

**Local:** `./dev.sh`, then open <http://localhost:8090>. It rebuilds `index.html` whenever a file in `src/` changes; refresh the page to see it.

## Screens

| Screen | What it does |
| --- | --- |
| **My accounts** | The book: headline numbers, saved views (All, At risk, Renewing in 90 days, In implementation), search, sortable columns, worst health first. A row opens a preview panel; TransAmerica opens the full page. |
| **Account page** | A navy band with the verdict (health 50, capped from 62, and why) and the renewal runway (41 days, the events since August, the commitment target). Then the KPI strip and tabs: Overview, Health, Adoption, Support, People, Market signals. |
| **Portfolio** | Where the $103.6M sits by health band, the pods ranked by ARR at risk, CARR by stage and gross retention. |
| **States** | The reference for every loading, empty and error state the app uses. |

## Rules the build follows

- Green, amber and red mean health only, never a chart series or decoration.
- A missing value reads "No data", never −1, "-" or undefined, and is left out of averages and risk drivers.
- Every health score that is capped says why.
- The executive sponsor and champions come from the stakeholder role tags, not from AI prose.
- One typeface (Hanken Grotesk), tabular numbers, light and dark themes.

## Layout

```
build.sh            concatenates src/ into index.html
dev.sh              local dev server with rebuild on change
index.html          the built single-file app (this is what deploys)
vercel.json         Vercel settings (noindex)
src/
  head.html         design tokens, all CSS, the DOM shell
  data.js           fixtures captured from the live tenant
  lib.js            formatting, health bands, mini ring
  screen-accounts.js
  screen-account.js
  screen-portfolio.js
  screen-states.js
  boot.js           routing, loading sequence, first render
```

Edit `src/`, not `index.html`.

## Data

Captured from the live Sirion tenant (`eme21-platform.eusb.sirioncloud.io`) on 19 Nov 2026: TransAmerica in full, 25 accounts for the list, and the portfolio figures. This is customer data, so keep the repository private. Dates are computed against a fixed today of 19 Nov 2026. CARR by stage is read from the live chart and is approximate.
