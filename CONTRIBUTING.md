# Contributing / Developer guide — WiFi Billionaire

Everything technical lives here. Players only need the [README](README.md).

WiFi Billionaire ships three ways from one codebase:

- **Web** — the static files (`index.html` + `css/` + `js/`) run as-is in any
  browser. Deployed to GitHub Pages and packaged for CrazyGames.
- **Desktop** — an Electron app built with **electron-builder**, auto-updated
  from **GitHub Releases** via **electron-updater**.

> Heads-up on a deliberate misspelling: the Firebase **project id** is
> `wifibillionare-1acf6` (missing an `i`). Firebase project ids are permanent and
> can never be renamed, so that string is left exactly as-is everywhere in code —
> do **not** "fix" it or the leaderboard/friends/cloud break. The GitHub repo and
> all app-facing names use the correct spelling, `WifiBillionaire`.

---

## Run it locally

```bash
# Web (no build step — pure static files):
node serve.js            # then open http://localhost:8741
# …or just double-click index.html (runs from file://).

# Desktop (Electron):
npm install              # once
npm start                # run the app locally (dev, no auto-update)
```

The web and desktop builds share all `js/` game code. `js/desktop.js` and
`js/crazygames.js` both **no-op** outside their host (Electron / CrazyGames), so
the same files run unchanged everywhere.

---

## Web deployment

### GitHub Pages
`.github/workflows/pages.yml` deploys the static game on every push to `main`.
One-time setup: repo **Settings → Pages → Source: "GitHub Actions"**. The game
then lives at <https://connection-games.github.io/WifiBillionaire/>.

The workflow copies only `index.html`, `css/`, and `js/` into the published site
(the Electron/build tooling is ignored), and adds a `.nojekyll` marker so files
are served verbatim. All asset paths are relative, so it works under the
`/WifiBillionaire/` subpath.

### CrazyGames
```bash
./package-web.sh         # → dist/wifi-billionaire-web.zip
```
Upload that zip at <https://developer.crazygames.com/> → your game → **Build**.
The [CrazyGames SDK](https://docs.crazygames.com/) is wired up in
`js/crazygames.js`: it reports loading/gameplay lifecycle events and fires a
`happytime()` on big wins (e.g. prestige). It activates only on crazygames.com
and stays dormant everywhere else.

---

## Desktop build & release (electron-builder + electron-updater)

```bash
npm run dist:mac         # build dist/WiFi-Billionaire.dmg + .zip (run on macOS)
npm run dist:win         # build dist/WiFiBillionaireSetup.exe    (run on Windows)
```
> Cross-building Windows from macOS needs Wine; in practice let CI build each OS natively.

Releases publish to `connection-games/WifiBillionaire` (configured in
`package.json` → `build.publish`). The repo is public, so updates need no token
on the player's side.

### Cutting a release
1. Make changes, bump the version in `package.json` **and** `WB.VERSION` in
   `js/data.js` (e.g. `6.6.1`), and add a changelog entry to `UPDATES` in `js/ui.js`.
2. Commit, then `git tag v6.6.1 && git push origin v6.6.1`.
3. `.github/workflows/release.yml` builds & publishes both installers. The CI
   guards that the tag matches `package.json`'s version (a mismatch would make
   electron-builder overwrite the wrong release and break auto-update).
4. Installed apps update **by themselves** on the next launch — boot-screen
   progress bar, automatic restart, saves kept. The changelog pops up on first
   open of the new version.

### How auto-update works
The boot screen runs **Loading… → Looking for updates…**, then installs silently
with a progress bar and restarts:
- **Windows:** electron-updater downloads the NSIS package and silently reinstalls.
- **macOS:** unsigned apps can't use Apple's update path, so the app updates
  itself — downloads `WiFi-Billionaire.zip`, verifies the release's sha512, swaps
  the ad-hoc-signed `.app` via `ditto`/`mv`, and relaunches. `ditto` sets no
  quarantine flag, so updates never re-trigger Gatekeeper (the one-time "Open" is
  only ever needed on the very first manual install).

### Why the app no longer says "damaged" (ad-hoc signing)
`mac.identity: null` skips signing, which on Apple Silicon makes a quarantined
download report as "damaged." `build/after-pack.js` fixes this: after each macOS
build it runs `codesign --force --deep --sign -` (an ad-hoc signature, no
certificate) and verifies it, sealing the bundle. That downgrades the fatal
"damaged" error to the normal one-time "unidentified developer" prompt. Proper
notarization (paid Apple Developer ID) would remove even that.

### Making the warnings vanish for good (paid certificates)
- **macOS:** an Apple **Developer ID** ($99/yr) + notarization. Add repo secrets
  `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`,
  `APPLE_TEAM_ID`, remove `mac.identity:null`, set `mac.notarize: true`.
- **Windows:** an OV/EV Authenticode cert. Add `WIN_CSC_LINK` /
  `WIN_CSC_KEY_PASSWORD`. An EV cert clears SmartScreen immediately. As a free
  alternative, submit the installer to Microsoft as a false positive at
  <https://www.microsoft.com/wdsi/filesubmission>.

### Installer branding
The mac DMG opens on a deep-navy window (`dmg.backgroundColor`) — modern Finder
ignores legacy alias-based image backgrounds but honours a solid colour, which
also works headless in CI. The Windows installer uses full branded sidebar/header
BMP art. Regenerate the art with:
```bash
cd build && swift make-installer-assets.swift . \
  && sips -s format bmp installerSidebar.png --out installerSidebar.bmp \
  && sips -s format bmp installerHeader.png --out installerHeader.bmp
```

### Where user data lives
All saves/settings are `localStorage`, backed by a JSON file in the OS app-data
dir — never the install folder, so updates and uninstalls keep progress:
- macOS: `~/Library/Application Support/WiFi Billionaire/wifi-billionaire-data.json`
- Windows: `%APPDATA%\WiFi Billionaire\wifi-billionaire-data.json`

### AI key (optional)
Players can enter their own OpenAI key in **⚙️ Settings → AI** (stored only in
their own localStorage). `js/secrets.js` ships empty. With no key, the Scam Sim
uses offline scripted victims. In the desktop app the key goes renderer → main →
OpenAI (no CORS); it never leaves the machine.

---

## Cloud backend (Firebase)

The global leaderboard, live-player count, friends, chat, trades and admin
broadcasts run on Firebase (`js/cloud.js`). The web config in that file is
**public client config** — it only identifies the project; security is enforced
by Firestore rules, not by hiding it. To take the cloud live, in the
[Firebase console](https://console.firebase.google.com/) for `wifibillionare-1acf6`:

1. **Build → Firestore Database → Create database.**
2. **Build → Authentication → Sign-in method → enable Anonymous.**
3. **Firestore → Rules**, paste:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /scores/{uid} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == uid;
         match /requests/{from} { allow read, delete: if request.auth.uid == uid; allow create: if request.auth != null; }
         match /friends/{fid}   { allow read: if request.auth.uid == uid; allow write: if request.auth != null; }
         match /inbox/{id}      { allow read, delete: if request.auth.uid == uid; allow create: if request.auth != null; }
       }
       match /presence/{uid}          { allow read: if true; allow write: if request.auth != null && request.auth.uid == uid; }
       match /chats/{chatId}/msgs/{m} { allow read, create: if request.auth != null; }
       match /feedback/{id}           { allow create: if request.auth != null; }
       match /broadcast/{id}          { allow read: if true; allow write: if request.auth != null; }
       // multiplayer heist lobbies (create/join/ready/chat). Invites reuse /inbox above.
       match /lobbies/{id} {
         allow read, write: if request.auth != null;
         match /msgs/{m} { allow read, create: if request.auth != null; }
       }
       // mafia / syndicate gangs (create/join/pot/roles). Invites reuse /inbox above.
       match /gangs/{id} { allow read, write: if request.auth != null; }
       // turf map: city districts syndicates fight over. War notices reuse /inbox above.
       match /districts/{id} { allow read: if true; allow write: if request.auth != null; }
     }
   }
   ```

Until those steps are done the game runs fine — the cloud features just show
"offline" and never block play.

### Admin broadcasts
A hidden Control Room (Settings → tap **General** 5× → password) lets the owner
push a global income boost or announcement to every online player. The password
is stored as a one-way **SHA-256 hash** in `js/ui.js` (never in plaintext, since
this file is publicly readable on the web) and the password itself is not
committed anywhere.

---

## Architecture

Zero-dependency vanilla JS, classic scripts sharing a `WB` namespace (loads from
`file://` with no build step):

| File | Responsibility |
|---|---|
| `js/data.js` | All balance tables: housing, equipment, careers, eras, traits, perks, prestige shop, goals. Number formatting + `WB.VERSION`. |
| `js/thoughts.js` | Dynamic thought engine: context-weighted template pools × slot fillers → thousands of distinct lines. |
| `js/events.js` | Major choice events (modals, luck-gated gambles) + minor auto-resolving flavor events. |
| `js/achievements.js` | 120+ achievements from milestone tables + hand-written secrets. |
| `js/actions.js` | Manual gameplay: Post Video, Train AI, Code Sprint, Game Jam, Freelance Gig, Brew Coffee — choice modals, timed runs, cooldowns. |
| `js/assets.js` | Lifestyle assets, fluctuating investments, staff with %-of-income salaries. |
| `js/crime.js` / `js/empire.js` / `js/scam.js` | Crime & heists, the secret space-empire endgame, and the Scam Sim texting mini-game. |
| `js/game.js` | Engine: 10 Hz tick, income math, skills/XP, project pipeline, crypto sim, traits, perks, eras, prestige, save/load with offline progress. |
| `js/room.js` | Pixel-art room renderer: 320×180 canvas, animated character, per-housing palettes. |
| `js/ui.js` | Apple-style UI shell: action cards, thought bubbles, tabs, toasts, modals, daily reward, render loop. |
| `js/cloud.js` | Firebase: leaderboard, presence, friends, chat, gifts, broadcasts. |
| `js/desktop.js` / `js/crazygames.js` | Host integrations (Electron / CrazyGames). Both no-op off-host. |

### Income formula
```
income/sec = Σ(career tier income × focus/follower/trait modifiers)
           × housing × equipment × era × traits × perks
           × mood (0.6–1.4) × (1 + reputation/200) × prestige bonuses × event boosts
```

### Balancing targets
| Milestone | Target | Mechanism |
|---|---|---|
| First housing upgrade ($2.5k) | 10–20 min | Freelancer income + hustle clicks + first projects |
| First apartment ($12k) | 30–60 min | Tier-2 career + early equipment compounding |
| First million | 5–10 h | Career tier 3, Creator Era ×2.5, housing ×2+ |
| First prestige ($1B net worth) | 15–30 h | AI Era ×7, top careers, viral project bursts |
| Long-term | 100+ h | Legacy shop, 5 eras, 5 career paths, 120+ achievements |

Prestige: Legacy Points = `floor(10 × √(net worth / $1B))`, spent on permanent
upgrades (income, luck, XP, head-start cash, kept hardware, rare perks, offline cap).

### Save system
- Autosaves to `localStorage` every 5 s and on page close; field-level merge so
  old saves survive updates.
- Offline progress: 50% of income while away, capped at 8 h (+4 h per Night Shift legacy level).
- Export/import save as a string, plus hard reset, via ⚙️ Settings.

> Legacy note: `app/main.swift` + `build.sh` (native Mac WKWebView shell) and
> `build-win.sh` are superseded by the electron-builder pipeline and kept only for reference.
