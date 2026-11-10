# ChatGPT Finance Board — Operating Guide

This directory contains the finance display for CHHS Student-Run Vending.
ChatGPT manages the shared finance data in conversation. The browser is a display with **two explicitly requested local quick-entry forms** for Monthly Expenses and Money Gained.

## Source of truth
- `finance/data.json` is the shared data file for all devices, read by `finance/app.js`.
- To record an approved change, fetch the current `finance/data.json` from the main branch, preserve existing fields and rows, make the smallest requested addition/correction, then commit the updated JSON. Do not overwrite the file with a stale copy.
- The GitHub Pages URL is `https://vince314159.github.io/CHHS-Student-Vending/finance/`. A browser refresh displays changes after Pages publishes them.
- ChatGPT updates are **not** made automatically by messages alone; a successful authorized GitHub write is required. Report success only after receiving a commit result.
- Do not modify other website sections when changing this board.

## User's change policy
- Preserve all six display views: Home, Receipts, Machines, Funding, Monthly Expenses, Months.
- Preserve existing data and features by default when adding new requested features. Removing data or existing features requires an explicit user request.
- Preserve the two quick-entry forms, the Activity remove controls for unsaved cash entries, the Save Month button, and the permanent Months archive. Do not add other browser-side editing or deletion unless requested. The dashboard also supports read-only filters, an entry export button, and a legacy backup button.
- Keep original raw figures distinct from derived totals. Explain accounting assumptions and avoid double-counting.

## Data schema
The top-level JSON object must have:
```json
{
  "schemaVersion": 1,
  "updatedAt": null,
  "currency": "USD",
  "receipts": [],
  "machines": [],
  "funding": [],
  "monthlyExpenses": [],
  "moneyGained": [],
  "savedMonths": []
}
```
Set `updatedAt` to a real ISO 8601 timestamp whenever intentionally updating financial data.

Existing supported row shapes, with optional fields omitted when unknown:
- `receipts`: `{id, date:"YYYY-MM-DD", vendor, category, total, status:"reviewed"|"needs-review", notes}`.
- `machines`: `{id, name, location, start:"YYYY-MM-DD", end:"YYYY-MM-DD", sales, refunds, cogs, processing, platform, commission, maintenance, other}`. One machine reporting period per record. Numeric fields represent USD.
- `funding`: `{id, type:"funding"|"repayment", date:"YYYY-MM-DD", amount, source, notes}`.
- `monthlyExpenses`: `{id, date:"YYYY-MM-DD", amount, note, createdAt}`.
- `moneyGained`: `{id, date:"YYYY-MM-DD", amount, note, createdAt}`.

Use unique stable IDs and numeric JSON amounts, not currency-formatted strings. Never invent dates, amounts, vendors, machine names, transactions, or funding sources. Avoid posting scans or personal financial data in the public repo.

## Calculations and limitations
- Recorded revenue = machine-period gross sales.
- Gross profit = sales minus refunds minus COGS.
- Machine operating profit = sales minus refunds, COGS, processing, platform fees, commissions, maintenance, and other machine-period costs.
- Receipts total is displayed separately and is **not** automatically subtracted from machine operating profit, because receipt purchases may overlap with COGS or machine-period costs. This is not a full tax/accounting ledger.
- Funding balance = funding contributions minus repayments, shown not below zero.
- If no periods were recorded, $0 means no recorded financial data, not verified zero business activity.

## Quick entry data and net money bar
- Home offers two quick-entry forms. Each form accepts a positive USD amount and optional note; saving appends a dated record to `localStorage['vendingFinanceBoard.quickEntries.v1']` on that device.
- Monthly Expenses groups individual expenses by month; entries are not deleted or overwritten when another is added.
- The **net money bar** is sum of `moneyGained` minus sum of `monthlyExpenses`, across all recorded dates. Do not silently add machine-period sales or subtract receipt totals, which might overlap.
- The new GitHub `finance/data.json` also supports both arrays as shared records. When an ID is present in both GitHub and the browser, the browser displays it once. If user exports local entries and asks ChatGPT to migrate, check by ID and avoid duplicates.
- GitHub Pages has no authenticated write backend. Manual browser entries **do not sync across devices or automatically reach ChatGPT**. The Monthly Expenses tab includes an Export quick entries button for sharing a JSON file in chat; ChatGPT may merge it into GitHub after review.
- Protect previous datasets and preserve browser localStorage. Do not claim local quick entries are synchronized remotely.

## Monthly archive / lifetime total invariants
- Monthly archive logic lives in finance/months.js. The browser stores month snapshots and removal tombstones under localStorage key vendingFinanceBoard.savedMonths.v1.
- Home shows only CURRENT UNSAVED records; the top money bar is LIFETIME net: all visible money gained minus all visible expenses, including archived ones. Saving a month NEVER resets or subtracts the lifetime balance. New entries and deliberate removal of unsaved entries can still change the lifetime balance.
- Save Month accepts a custom name, captures all current unsaved income, expenses, machine periods, receipts and funding, and stores a snapshot. It archives records by stable ID, so Home current totals and activity reset visually without deleting historical data.
- The Months tab lists every saved month with gross gained, expenses, net, machine gross sales/costs/profit, receipts, funding and repayments and the included entries. Month names can change; archived snapshots may not be deleted.
- Unsaved money gained and expenses can be removed from Home Activity; unsaved expenses can also be removed from Monthly Expenses. The removal updates the lifetime balance and is saved as a browser-local tombstone. Archived entries are protected.
- finance/data.json supports savedMonths: []; when migrating exports, merge by ID and avoid duplicates.
- Browser saved months and removals are NOT automatically synchronized to GitHub. Export Entries + Months includes local records, month snapshots and removed entry IDs. The user must upload an export in chat for a GitHub merge.
- Local browser storage can be cleared; saved months need backup or shared synchronization for durability. Do not promise absolute permanence without it.
- The top net bar and archived month net use ONLY money gained minus monthly expenses. Machine and receipt totals are separate and do not double-count.

## Legacy browser data migration
The old version stored records only in the browser under `localStorage['vendingFinanceBoard.v2']`. Existing device-local data cannot be read by GitHub/ChatGPT remotely.
- If old data exists, the board shows it locally only while the shared JSON is empty; it offers a one-time `Download legacy backup`.
- Have the user upload the exported JSON in chat before migrating. Inspect for duplicate records, respect privacy, and merge without deleting or overwriting unrelated existing records.
- Never erase the original localStorage in code. When shared data exists, it is the primary display; legacy data remains available for download.

## Publication / privacy warning
This is a public GitHub repository and GitHub Pages site. Any committed `finance/data.json` records can be viewed publicly. Before committing private/sensitive amounts, transaction details, or notes, establish whether publication is appropriate; use a private data backend if privacy is required.
