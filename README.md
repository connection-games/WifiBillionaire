# 📶 WiFi Billionaire

A 2D idle/life simulator about an internet entrepreneur grinding from a mattress
in their parents' bedroom to internet billionaire — armed with nothing but WiFi,
questionable project ideas, and an inner monologue that never stops.

## How to play

**Option A (simplest):** double-click `index.html` — runs straight from disk, no install.

**Option B (local server):** `node serve.js` then open <http://localhost:8741>.

**Option C (Mac app):** open **WiFi Billionaire** from `/Applications` (or install
via `build/WiFi Billionaire.dmg`). Rebuild anytime with `./build.sh` — it compiles
the native wrapper, renders the icon, signs the bundle, and produces the DMG using
only macOS Command Line Tools (no Xcode).

**Option D (Windows):** unzip `build/WiFi Billionaire (Windows).zip` and run
`WiFi Billionaire.exe` (legacy manual Electron wrapper).

---

## 📦 Distribution & auto-update (electron-builder + electron-updater)

The canonical distribution is now a single Electron app built with **electron-builder**
and auto-updated from **GitHub Releases** via **electron-updater**. (The old `build.sh`
Swift wrapper and `build-win.sh` zip are legacy and superseded.)

**Before first release:** set your GitHub repo in `package.json` →
`build.publish` (`owner` / `repo`). The repo should be **public** for keyless updates.

### Build commands (local)
```bash
npm install            # once
npm start              # run the app locally (dev, no auto-update)
npm run dist:mac       # build dist/WiFi Billionaire.dmg   (run on macOS)
npm run dist:win       # build dist/WiFiBillionaireSetup.exe (run on Windows)
```
> Cross-building Windows from macOS needs Wine; in practice let CI build each OS natively.

### Release commands
```bash
# Local publish (needs a GH_TOKEN with repo scope in your env):
GH_TOKEN=xxxx npm run release:mac     # build + upload mac dmg to the GitHub Release
GH_TOKEN=xxxx npm run release:win     # build + upload win exe to the same Release

# Recommended: tag-driven CI (.github/workflows/release.yml builds BOTH OSes):
git tag v5.0.0 && git push origin v5.0.0
```

### First release
1. `package.json`: set `build.publish.owner` to your GitHub username and `repo` to your repo.
2. Push the project to that GitHub repo. Add `.github/workflows/release.yml` (already here).
3. `git tag v5.0.0 && git push origin v5.0.0` — CI builds mac+win and creates the
   GitHub Release with `WiFi Billionaire.dmg`, `WiFiBillionaireSetup.exe`, plus the
   `latest-mac.yml` / `latest.yml` update manifests electron-updater needs.
4. Mark the release **published** (CI uploads as draft if `releaseType` is draft; default is to publish). Download & install — you're live.

### Future updates
1. Make changes, bump the version in `package.json` (e.g. `5.0.1`).
2. Commit, then `git tag v5.0.1 && git push origin v5.0.1`.
3. CI builds & publishes the new release. Installed apps check on startup (and every 6h),
   download in the background, and show a **Restart to update** banner. User saves are kept.

### Auto-update testing
- Auto-update only runs in the **packaged** app (skipped in `npm start`).
- Install an older version (e.g. tag `v5.0.0`), publish a newer one (`v5.0.1`), relaunch the
  old app: it shows "Downloading update…", then "Update ready — Restart". Click Restart.
- To watch logs, launch from a terminal; electron-updater logs to the console and to
  `userData/logs`. macOS auto-update requires a **signed** app (Apple Developer ID);
  Windows NSIS auto-updates unsigned (SmartScreen prompt on first install).

### Where user data lives (audited)
All saves/settings are `localStorage`, transparently backed by a JSON file in the OS
app-data dir — **never** the install folder:
- macOS: `~/Library/Application Support/WiFi Billionaire/wifi-billionaire-data.json`
- Windows: `%APPDATA%\WiFi Billionaire\wifi-billionaire-data.json`

Updates replace only app files; this directory is untouched, so progress always survives.
`nsis.deleteAppDataOnUninstall` is `false`, so even uninstalling keeps saves.

### AI key
Optional. Enter your own OpenAI key in **⚙️ Settings → AI** (stored locally in the data
dir, never committed, never hardcoded — `js/secrets.js` ships empty). With no key, the
Scam Sim gracefully uses offline scripted victims. In the desktop app the key is sent
straight from the renderer to the main process to OpenAI (no CORS, key never leaves your machine).

The native app (`app/main.swift`) is an AppKit + WKWebView shell that serves the
game over a custom `wifib://` URL scheme, mirrors every autosave to
`~/Library/Application Support/WiFiBillionaire/save.json` (restored on launch, so
progress survives independently of WebKit storage), and bridges JS `alert`/`confirm`
to native dialogs. The icon (`app/makeicon.swift`) is drawn programmatically with
CoreGraphics/AppKit.

You don't control the character directly. You set their **focus** (code, make
content, trade crypto, study, sleep, touch grass…), buy their gear, pick their
perks, steer random events — and watch them think out loud about all of it.

## Architecture

Zero-dependency vanilla JS, classic scripts sharing a `WB` namespace
(loads from `file://` with no build step):

| File | Responsibility |
|---|---|
| `js/data.js` | All balance tables: housing, equipment, careers, eras, traits, perks, prestige shop, goals. Number formatting. |
| `js/thoughts.js` | Dynamic thought engine: context-weighted template pools × slot fillers (coins, app ideas, snacks, bugs…) → thousands of distinct lines. Tracks recent thoughts to avoid repeats. |
| `js/events.js` | Major choice events (modal, some with luck-gated gambles) + minor auto-resolving flavor events, both template-expanded. |
| `js/achievements.js` | 120+ achievements, generated from milestone tables + hand-written secrets. |
| `js/actions.js` | Manual gameplay layer: Post Video, Train AI, Code Sprint, Scan Market, Game Jam, Freelance Gig, Post Online, Brew Coffee — choice modals, timed runs, results screens, cooldowns. |
| `js/assets.js` | Lifestyle assets (16, espresso machine → football club), fluctuating investments (index fund / gold / real estate / angel / NFT of a rock), staff with %-of-income salaries (assistant, editor, accountant, coach, manager, security). |
| `js/game.js` | Engine: 10 Hz tick, income math, skills/XP/levels, project pipeline, crypto sim, trait acquisition, perk offers, eras, prestige, event scheduling, save/load with offline progress. |
| `js/room.js` | Pixel-art room renderer: 320×180 canvas at ~12 fps with animated character (typing/sleeping/standing), code-flickering screens, blinking server LEDs, RGB cycling, mug steam, per-housing palettes/views/props. |
| `js/ui.js` | Apple-style UI shell: action cards, thought bubbles, segmented tabs, toasts, modals, render loop. |

### Income formula

```
income/sec = Σ(career tier income × focus/follower/trait modifiers)
           × housing × equipment × era × traits × perks
           × mood (0.6–1.4, from happiness + motivation)
           × (1 + reputation/200) × prestige bonuses × event boosts
```

### The character feels alive because

- Thoughts are chosen from pools weighted by activity, wealth tier, energy,
  stress, happiness, housing, traits, and era — then slot-filled.
- Traits emerge from *behavior* (work 2.5h total → Workaholic; 40 crypto trades
  → Crypto Addict; reach $10k while still living with parents → Frugal…).
- At 0 energy the character collapses and force-naps, then returns to whatever
  they were doing on their own.

## Balancing targets

| Milestone | Target | Mechanism |
|---|---|---|
| First housing upgrade ($2.5k) | 10–20 min | Freelancer income + hustle clicks + first project payouts |
| First apartment ($12k) | 30–60 min | Tier-2 career + early equipment compounding |
| First million | 5–10 h | Career tier 3, Creator Era ×2.5, housing ×2+ |
| First prestige ($1B net worth) | 15–30 h | AI Era ×7, top career tiers, viral project bursts |
| Long-term | 100+ h | Prestige legacy shop (+25% income/level, ~50 levels), 5 eras, 5 career paths, 120+ achievements |

Prestige: Legacy Points = `floor(10 × √(net worth / $1B))`, spent on permanent
upgrades (income, luck, XP, head-start cash, kept hardware, rare perks,
offline cap).

## Save system

- Autosaves to `localStorage` every 5 s and on page close; loads with
  field-level merge so old saves survive game updates.
- Offline progress: 50% of income while away, capped at 8 h
  (+4 h per Night Shift legacy level).
- Export/import save as a string, plus hard reset, via ⚙️ Settings.
