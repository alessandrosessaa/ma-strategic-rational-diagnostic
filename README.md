# M&A Strategic Rationale Diagnostic

A self-contained Next.js app for assessing how coherent and evidence-backed the strategic rationale for a candidate M&A deal is. It **does not predict deal success**.

## What it does

- Tests six dimensions: strategic fit, value creation logic, alternatives, timing/market context, executive sponsorship/alignment and risk to thesis.
- Provides three 1–5 statements per dimension, relative importance weights, evidence notes and independent unmet-condition/dealbreaker flags.
- Calculates weighted rationale strength and explains the actual weaker areas in plain language.
- Converts the strongest rationale into three target-screening objectives.
- Supports multiple candidate deals, side-by-side comparison, duplication, local browser saving and JSON export/import.

## Run locally

1. Install [Node.js LTS](https://nodejs.org/).
2. In this project folder, run `npm install`.
3. Run `npm run dev` and open `http://localhost:3000`.

## Deploy with Vercel

This is a standard Next.js app. Import the GitHub repository into Vercel and accept its default build settings. No environment variables or database are required.

## Project structure

```
app/
  layout.js       Global document metadata
  page.js         Diagnostic state, scoring and user interface
  globals.css     Responsive visual design
```

All user data lives in the browser's local storage. Export JSON regularly if the work needs to move between browsers or be shared.
