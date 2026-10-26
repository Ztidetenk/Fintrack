# Apex Horizon — Prop Trader Capital & Milestone Tracker

A dark-mode financial-terminal dashboard for a 15-year plan: scale one $25k prop eval into a multi-million-dollar private fund, split every payout between lifestyle, a milestone vault and a compounding treasury, and buy the trophies in order: Dad's Mercedes, a Dubai rental, a Porsche 911 / BMW M4 Comp, and a primary residence.

Built with **React 19 + TypeScript**, **Vite**, **Tailwind CSS v4**, **Recharts** and **lucide-react**. Every tab is interactive out of the box, and its state is saved in `localStorage`.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script                 | What it does                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `npm run dev`          | Dev server with hot reload                                                                                     |
| `npm run build`        | Type-check, then a production build into `dist/`                                                               |
| `npm run build:single` | One self-contained `dist-single/index.html` (JS, CSS and fonts inlined) you can open or share as a single file |
| `npm run preview`      | Serve the production build locally                                                                             |
| `npm run typecheck`    | `tsc` only                                                                                                     |
| `npm run format`       | Prettier                                                                                                       |

## What's inside

| Tab                    | Highlights                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Command Center**     | Profile header (age/birthday countdown, strategy, horizon) with a live New York clock and CME session. KPI cards: current phase, an account fleet selector and counter with estimated payout capacity, the next milestone's progress, hard assets vs the $1.5M+ target, and daily rule status. Includes the plan projection, today's discipline, a phase strip and the trophy shelf.                                                                                                                       |
| **15-Year Roadmap**    | An interactive stepper across all 5 phases. Each phase shows its payouts, fleet, highlights, a payout chart (the Phase 1 staircase or the phase's planned ramp), checkable objectives and milestone triggers with model ETAs.                                                                                                                                                                                                                                                                              |
| **Treasury Split**     | A $0–$80k payout slider with phase presets, a vault ⟷ treasury balance (35–40% / 30–25%; lifestyle fixed at 35%), and a monthly split. The 15-year projection runs in two models: _Slider_ (your payout with annual growth) or _Roadmap_ (the phase curve). You can view it as a stacked area, stacked bars or a table, with a tooltip and the plan baseline overlaid.                                                                                                                                     |
| **Trophy Room**        | Four milestone cards that unlock strictly in order. Each shows funding progress, its roadmap window, a plan-model ETA and an ETA at your current vault pace. You can mark a milestone acquired (with undo), log deposits, run quick simulations (+1 or +6 months of allocation) and review the deposit history.                                                                                                                                                                                            |
| **Execution Terminal** | The 5-question pre-trade gatekeeper; question 3 is a Patience vs Boredom/Greed choice that blocks the session. Session states are Standby → Active → Locked. Every trade re-arms the gate, and the circuit breaker trips at 2 trades or −$200. Trades are graded (a controlled loss scores A+). A rule-break ledger adds +3 months to every ETA per break, and a customizable visual anchor lets you set the milestone, the reminder text and an optional image URL. The gate and trade count reset daily. |

## How the projection works

`src/lib/projection.ts` runs the plan month by month for 180 months:

1. Each payout splits into **35% lifestyle**, **35–40% vault** and **25–30% treasury**.
2. The treasury compounds at the chosen annual return. Rent from owned property is added to it.
3. As soon as the vault can afford the next milestone it buys it ($80k → $100k → $180k → $500k). After those four, it buys up to three more $150k Dubai units (the Phase 5 target of 3–4 properties).
4. Cars depreciate (Mercedes −12%/yr, coupe −6%/yr) and property appreciates (+4–5%/yr). **Hard asset equity** = owned assets at market value + vault cash not yet deployed.

The roadmap payout curve uses the Phase 1 staircase ($0 → $900 → $3,150 → $6,750) and then ramps linearly across each phase's range. Year 10 (Months 109–120) bridges Phase 4 into Phase 5.

## Customizing

Your personal numbers live in **`src/data/roadmap.ts`**: birthday, roadmap start month, phases, milestone targets, account types and payout estimates, trading rules, and gatekeeper questions. Chart colors are in `src/lib/palette.ts`. They were checked as a set for colorblind separation and contrast against the card surface.

## Project structure

```
src/
├── data/roadmap.ts          # Profile, phases, milestones, accounts, rules
├── lib/
│   ├── projection.ts        # 15-year month-by-month model
│   ├── vault.ts             # Milestone funding / unlock order
│   ├── format.ts            # Currency + date helpers
│   ├── palette.ts           # Validated chart colors
│   └── usePersistentState.ts
├── state/DashboardContext.tsx   # All app state + derived values
├── components/              # Layout (sidebar, header, mobile nav), charts, UI primitives
└── sections/                # Command Center, Roadmap, Treasury, Trophy Room, Terminal
```

Use **Reset data** at the bottom of the sidebar to restore the demo state.
