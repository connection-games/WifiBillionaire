# 📶 WiFi Billionaire

A 2D idle/life simulator about an internet entrepreneur grinding from a mattress
in their parents' bedroom to internet billionaire — armed with nothing but WiFi,
questionable project ideas, and an inner monologue that never stops.

## ⬇️ Download & play

**Always the newest version — one click, no account needed:**

| Platform | Download | Format |
|---|---|---|
| 🍎 **macOS** | **[⬇ WiFi-Billionaire.dmg](https://github.com/connection-games/WifiBillionare/releases/latest/download/WiFi-Billionaire.dmg)** | Disk image (recommended) |
| 🍎 macOS | [⬇ WiFi-Billionaire.zip](https://github.com/connection-games/WifiBillionare/releases/latest/download/WiFi-Billionaire.zip) | Zip — unzip, drag to Applications |
| 🪟 **Windows** | **[⬇ WiFiBillionaireSetup.exe](https://github.com/connection-games/WifiBillionare/releases/latest/download/WiFiBillionaireSetup.exe)** | Installer |

All versions: [**Releases page**](https://github.com/connection-games/WifiBillionare/releases/latest)

### Install on macOS
1. Open the `.dmg` and follow the arrow — drag **WiFi Billionaire** onto **Applications**
   (or unzip the `.zip` and do the same).
2. **First launch only:** the app isn't notarized by Apple yet, so macOS may claim it is
   "damaged" or from an unidentified developer (it isn't — that's just Gatekeeper on
   unsigned apps). Fix it with one Terminal command, then open normally:
   ```bash
   xattr -cr "/Applications/WiFi Billionaire.app"
   ```
   (Or: System Settings → Privacy & Security → **Open Anyway**.) This is only ever
   needed once — updates installed by the app itself never trigger it again.

### Install on Windows
Run `WiFiBillionaireSetup.exe` → Next → done. SmartScreen may warn on first install —
click **More info** → **Run anyway**. Installed apps auto-update from this repo.

### Play in the browser (no install)
Clone or download this repo, then double-click `index.html` — runs straight from disk.
Or `node serve.js` and open <http://localhost:8741>.

---

## 📦 Distribution & auto-update (electron-builder + electron-updater)

The canonical distribution is now a single Electron app built with **electron-builder**
and auto-updated from **GitHub Releases** via **electron-updater**. (The old `build.sh`
Swift wrapper and `build-win.sh` zip are legacy and superseded.)

Releases publish to `connection-games/WifiBillionare` (configured in `package.json` →
`build.publish`). The repo is public, so updates need no token on the player's side.

### Build commands (local)
```bash
npm install            # once
npm start              # run the app locally (dev, no auto-update)
npm run dist:mac       # build dist/WiFi-Billionaire.dmg + .zip (run on macOS)
npm run dist:win       # build dist/WiFiBillionaireSetup.exe    (run on Windows)
```
> Cross-building Windows from macOS needs Wine; in practice let CI build each OS natively.


### Installer branding
The mac DMG ships a branded retina background (navy/green/gold, matching the
app icon) with a "drag here to install" guide arrow; the Windows installer uses
matching sidebar/header artwork. Regenerate the artwork with:
```bash
cd build && swift make-installer-assets.swift . \
  && tiffutil -cathidpicheck dmg-bg.png dmg-bg@2x.png -out dmg-background.tiff \
  && sips -s format bmp installerSidebar.png --out installerSidebar.bmp \
  && sips -s format bmp installerHeader.png --out installerHeader.bmp
```

### Future updates
1. Make changes, bump the version in `package.json` **and** `WB.VERSION` in `js/data.js` (e.g. `6.0.1`).
2. Commit, then `git tag v6.0.1 && git push origin v6.0.1`.
3. CI builds & publishes the new release. Installed apps update **by themselves** on
   the next launch — boot screen progress bar, automatic restart, saves kept.

### How auto-update works (v6.0+)
The boot screen runs **Loading… → Looking for updates…**. If a newer release exists
the update installs fully automatically (no dialogs) with a progress bar, the app
restarts itself, and the **changelog pops up** on the first open of the new version:
- **Windows:** electron-updater downloads the NSIS package and silently reinstalls + restarts.
- **macOS:** unsigned apps can't use Apple's update path, so the app updates itself —
  it downloads `WiFi-Billionaire.zip`, verifies the release's sha512 checksum, swaps
  the `.app` bundle in place, and relaunches. No Gatekeeper prompt, saves untouched.

### Auto-update testing
- Auto-update only runs in the **packaged** app (skipped in `npm start`).
- Install an older version from its release page (not "latest"), publish a newer tag,
  then launch the old app → boot screen finds the update → progress bar → auto-restart →
  the new version opens with the changelog showing and saves intact.

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

> Legacy note: `app/main.swift` + `build.sh` (native Mac WKWebView shell) and
> `build-win.sh` (manual Electron zip) are superseded by the electron-builder
> pipeline above and kept only for reference.

## How to play

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
