# ChatGPT Finance Board — Operating Guide

This directory contains the finance display for CHHS Student-Run Vending.
The user wants ChatGPT to manage the information in conversation; the browser is a **read-only display**, not a financial entry tool.

## Source of truth
- `finance/data.json` is the shared data file for all devices, read by `finance/app.js`.
- To record an approved change, fetch the current `finance/data.json` from the main branch, preserve existing fields and rows, make the smallest requested addition/correction, then commit the updated JSON. Do not overwrite the file with a stale copy.
- The GitHub Pages URL is `https://vince314159.github.io/CHHS-Student-Vending/finance/`. A browser refresh displays changes after Pages publishes them.
- ChatGPT updates are **not** made automatically by messages alone; a successful authorized GitHub write is required. Report success only after receiving a commit result.
- Do not modify other website sections when changing this board.

## User's change policy
- Preserve all four display views: Home, Receipts, Machines, Funding.
- Preserve existing data and features by default when adding new requested features. Removing data or existing features requires an explicit user request.
- No browser-side editing, delete, uploads, or local data entry. The dashboard may have navigation, read-only filters and a one-time export button to recover old browser-only data.
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
  "funding": []
}
```
Set `updatedAt` to a real ISO 8601 timestamp whenever intentionally updating financial data.

Existing supported row shapes, with optional fields omitted when unknown:
- `receipts`: `{id, date:"YYYY-MM-DD", vendor, category, total, status:"reviewed"|"needs-review", notes}`.
- `machines`: `{id, name, location, start:"YYYY-MM-DD", end:"YYYY-MM-DD", sales, refunds, cogs, processing, platform, commission, maintenance, other}`. One machine reporting period per record. Numeric fields represent USD.
- `funding`: `{id, type:"funding"|"repayment", date:"YYYY-MM-DD", amount, source, notes}`.

Use unique stable IDs and numeric JSON amounts, not currency-formatted strings. Never invent dates, amounts, vendors, machine names, transactions, or funding sources. Avoid posting scans or personal financial data in the public repo.

## Calculations and limitations
- Recorded revenue = machine-period gross sales.
- Gross profit = sales minus refunds minus COGS.
- Machine operating profit = sales minus refunds, COGS, processing, platform fees, commissions, maintenance, and other machine-period costs.
- Receipts total is displayed separately and is **not** automatically subtracted from machine operating profit, because receipt purchases may overlap with COGS or machine-period costs. This is not a full tax/accounting ledger.
- Funding balance = funding contributions minus repayments, shown not below zero.
- If no periods were recorded, $0 means no recorded financial data, not verified zero business activity.

## Legacy browser data migration
The old version stored records only in the browser under `localStorage['vendingFinanceBoard.v2']`. Existing device-local data cannot be read by GitHub/ChatGPT remotely.
- If old data exists, the board shows it locally only while the shared JSON is empty; it offers a one-time `Download legacy backup`.
- Have the user upload the exported JSON in chat before migrating. Inspect for duplicate records, respect privacy, and merge without deleting or overwriting unrelated existing records.
- Never erase the original localStorage in code. When shared data exists, it is the primary display; legacy data remains available for download.

## Publication / privacy warning
This is a public GitHub repository and GitHub Pages site. Any committed `finance/data.json` records can be viewed publicly. Before committing private/sensitive amounts, transaction details, or notes, establish whether publication is appropriate; use a private data backend if privacy is required.
