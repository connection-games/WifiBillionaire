# Seasons — design plan

A **season** is a time-boxed theme that reshapes the game for a few weeks: bonus
modifiers, a cosmetic skin, a themed goal, and a leaderboard that resets each
season. Seasons give returning players a reason to come back ("Crime Season is
live") without us shipping a build every time — the calendar drives them.

This doc is the plan. A minimal **v1 foundation already ships** in `js/seasons.js`
(season detection + a banner + a Crime Season payout bonus). Everything below the
"v1 (shipped)" line is the roadmap.

---

## Core model

```js
{
  id: "crime",
  name: "Crime Season",
  emoji: "🦹",
  color: "#ff5a5a",
  blurb: "The city looks the other way. Every score pays more.",
  start: "MM-DD", end: "MM-DD",      // calendar window (wraps year-end if needed)
  mods: { crimePay: 1.25, heatCool: 1.5, /* … */ },   // multipliers the game reads
  goal: { /* a themed seasonal goal */ },
  cosmetic: "noir",                  // optional UI skin id
}
```

- `WB.SEASONS.current()` → the active season object (or `null`).
- `WB.SEASONS.mods()` → merged multipliers for the active season (`{}` if none),
  read by the systems that care (crime, income, heat). Same pattern as
  `WB.CRIME.gearMods()`, so it composes cleanly with gear and prestige.
- Date-driven so no deploy is needed to flip a season. An **admin override**
  (Control Room) can force a season on/off for testing or special events.

## The seasons (proposed calendar)

| Season | When | Theme | Headline modifiers |
|---|---|---|---|
| 🦹 **Crime Season** | rolls each quarter | the underworld runs hot | +25% crime take, heat cools 50% faster, a "most wanted" seasonal leaderboard by total stolen |
| 💰 **Hustle Season** | quarter | grind pays | +20% active income, +25% XP, hustle-click streaks |
| 🎩 **Heist Season** | quarter | big scores | heist stakes −20%, crew payouts +30%, exclusive limited heist |
| 🚀 **Founders Season** | quarter | build the empire | venture costs −15%, offline cap +4h, prestige LP +10% |

(Short 1–2 week "micro-seasons" can overlay the quarter — e.g. a weekend
"Double Heat Weekend" — using the same engine.)

## What a season touches

1. **Modifiers** — the `mods()` multipliers, read where they matter:
   - `crimePay` → `WB.CRIME` payout math (already wired in v1)
   - `heatCool` → heat decay (already wired in v1)
   - `income`, `xp`, `ventureCost`, `lp` → game.js formula hooks (roadmap)
2. **Banner** — a top-bar chip with the season emoji + name + a countdown to its
   end (v1 ships the chip; countdown is roadmap).
3. **Cosmetic skin** — Crime Season tints the room/UI noir; optional, opt-out in
   settings. (roadmap)
4. **Seasonal goal** — one themed goal that grants a cosmetic badge on completion.
   (roadmap)
5. **Seasonal leaderboard** — a `seasons/{seasonId}/scores` Firestore collection,
   ranked by the season's metric (e.g. total stolen for Crime Season), reset each
   season. Reuses the existing leaderboard UI with a season tab. (roadmap)
6. **Battle-pass-lite (optional, later)** — a free seasonal track of small rewards
   (cosmetic hats, cash boosts) earned by playing during the season.

## Rollout

- **v1 (shipped):** season detection from the calendar, a top-bar banner chip,
  and **Crime Season** live with its payout + heat-cool bonus. Admin can force a
  season for testing.
- **v2:** countdown timer, the other three seasons wired to their income/XP/venture
  hooks, the cosmetic noir skin for Crime Season, the seasonal goal + badge.
- **v3:** seasonal leaderboard (Firestore) with a season tab, and the optional
  reward track.

## Firestore (when the seasonal leaderboard lands)

```
match /seasons/{seasonId}/scores/{uid} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == uid;
}
```

## Why date-driven (not server-pushed)

The client already knows the date, so seasons need zero backend to run — the same
reason the game works fully offline. The admin broadcast channel can still *force*
or *announce* a season globally, but the default cadence is just the calendar.
