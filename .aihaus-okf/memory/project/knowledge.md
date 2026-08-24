---
type: knowledge
owner: architecture
status: active
last_reviewed: 2026-08-24
---

# Knowledge — DocsOb

> Durable facts, architectural conventions, and technical gotchas.

## Current truth

- **HTML Table Rule in Prototypes:** Flex container utility classes (`display: flex`) must NEVER be applied directly to `<td>` tags, as doing so breaks standard table cell rendering layout (`display: table-cell`) and misaligns column headers across `<thead>` and `<tbody>`. Flex layout must always be applied to an inner `<div>` wrapper placed inside the `<td>`.
- **Status Calculation Logic (RN-001):**
  - ⚪ `INDETERMINATE`: `expiration_date` is NULL or category is "Sem Vencimento".
  - 🔵 `RENEWAL_IN_PROGRESS`: Manual status is "Em Renovação".
  - 🔴 `EXPIRED`: Current Date > `expiration_date`.
  - 🟡 `CRITICAL`: (`expiration_date` - Current Date) <= `alert_lead_days`.
  - 🟢 `REGULAR`: Current Date < `expiration_date` and outside lead days.

## Details

- **Linear Integration:** Issue tracking is connected via Orca CLI (`orca linear ...`). Tasks are tracked on team `DOC`.
- **UI Design System Variables:**
  - `--bg-main: #021024` (Midnight Dark Navy)
  - `--bg-card: #052659` (Deep Navy)
  - `--primary: #5483B3` (Slate Blue)
  - `--primary-border: #7DA0CA` (Soft Muted Blue)
  - `--primary-light: #C1E8FF` (Ice Light Blue)

## Open questions

- Verification strategy for daily status cron recalculation in production.

## Links

- docs/ARCHITECTURE.md:247
- docs/PRD.md:60

## Timeline

- 2026-08-24 — Added HTML table layout rule and status calculation matrix.
- 2026-06-23 — Seeded from the aihaus-okf project template.
