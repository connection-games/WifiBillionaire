/* WiFi Billionaire — TURF MAP + MAFIA WAR.
 *
 * A neon-noir city map that lives INSIDE the room/person box (#room-frame).
 * A 🗺️ button toggles it. The overlay is pointer-events:none while closed so
 * taps fall through to the room; only when the map is OPEN do its districts
 * become touchable (exactly the spec). Tap a district → attack panel → plan the
 * raid (reuses WB.PLANNING) → war is resolved (your syndicate's strength vs the
 * district's) → a cutscene plays (WB.ROOM) → you seize it or get pushed back.
 *
 * Real rival syndicates (other players' gangs that have claimed turf) show in
 * red; fake AI families fill the rest in slate; your family's blocks glow gold.
 *
 * Self-contained: injects its own CSS, reads WB.GANG / WB.CLOUD / WB.PLANNING /
 * WB.ROOM / WB.SOUND / WB.GAME, and degrades gracefully offline.
 */
'use strict';

(function () {
  const WB = (window.WB = window.WB || {});
  const T = (s) => (WB.t ? WB.t(s) : s);
  const fmt = (n, money) => (WB.fmt ? WB.fmt(n, money) : "$" + Math.floor(n));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // The twelve blocks of the city, laid out as a 4×3 grid. `base` = how tough an
  // unclaimed (AI-held) district is to take; the marquee blocks are fortresses.
  const DISTRICTS = [
    { id: "dockside",    name: "Dockside",        base: 120 },
    { id: "littleitaly", name: "Little Italy",    base: 270 },
    { id: "chinatown",   name: "Chinatown",       base: 210 },
    { id: "theheights",  name: "The Heights",     base: 360 },
    { id: "riverside",   name: "Riverside",       base: 160 },
    { id: "oldtown",     name: "Old Town",        base: 230 },
    { id: "financial",   name: "Financial Dist.", base: 540 },
    { id: "warehouse",   name: "Warehouse Row",   base: 185 },
    { id: "uptown",      name: "Uptown",          base: 440 },
    { id: "theflats",    name: "The Flats",       base: 140 },
    { id: "garment",     name: "Garment Dist.",   base: 320 },
    { id: "casino",      name: "Casino Strip",    base: 640 },
  ];
  // Fake families that "hold" everything no real player has taken yet.
  const AI_FAMILIES = [
    "Moretti Family", "Volkov Bratva", "Lau Triad", "O'Brien Mob", "Salazar Cartel",
    "Greco Family", "Petrov Syndicate", "Costa Outfit", "Marchetti Family", "Yamada Clan",
    "De Luca Family", "Romano Outfit",
  ];

  let mounted = false, open = false, sel = null;
  let cloud = {};          // live districts/{id} ownership table
  let unsub = null;        // firestore listener while the map is open

  // ---- helpers -------------------------------------------------------------
  const gang = () => WB.GANG || null;
  const myGangId = () => (gang() && gang().id) || null;
  const myGangName = () => (gang() && gang().data && gang().data.name) || "Your Family";
  const memberCount = () => { const g = gang(); return g && g.data && g.data.members ? Object.keys(g.data.members).length : 0; };
  const charLvl = () => (WB.GAME && WB.GAME.charLevel ? WB.GAME.charLevel() : 1);
  const ips = () => (WB.GAME && WB.GAME.incomePerSec ? WB.GAME.incomePerSec() : 0);
  const cut = () => WB.ROOM && WB.ROOM.cutActive && WB.ROOM.cutActive();
  const planning = () => !!document.querySelector(".plan-overlay");
  const jailed = () => WB.CRIME && WB.CRIME.inPrison && WB.CRIME.inPrison();

  function heldCount() {
    const mg = myGangId(); if (!mg) return 0;
    return DISTRICTS.reduce((n, d) => n + (cloud[d.id] && cloud[d.id].owner === mg ? 1 : 0), 0);
  }
  // Your syndicate's muscle: crew size is king, your own rank + the turf you hold add to it.
  function myStrength() {
    return Math.floor(90 + memberCount() * 130 + charLvl() * 9 + heldCount() * 70);
  }
  // Resolve who holds a district right now (real claim, else a deterministic AI family).
  function viewOf(d, idx) {
    const c = cloud[d.id];
    if (c && c.owner) {
      const mine = myGangId() && c.owner === myGangId();
      return { kind: mine ? "you" : "rival", name: mine ? myGangName() : (c.ownerName || "A rival family"),
        strength: Math.max(d.base, c.strength || d.base), gangId: c.owner, real: true };
    }
    const scale = 1 + Math.min(1.6, charLvl() / 36);
    return { kind: "ai", name: AI_FAMILIES[idx % AI_FAMILIES.length], strength: Math.floor(d.base * scale), gangId: null, real: false };
  }
  // Win probability given a plan quality q (0..1). Used for both the preview and the roll.
  function odds(defStrength, q) {
    const atk = myStrength() * (0.65 + q * 0.85);
    return Math.max(0.05, Math.min(0.95, atk / (atk + defStrength)));
  }

  // ---- mount: build the button + overlay into the room box -----------------
  function mount() {
    if (mounted) return;
    const frame = document.getElementById("room-frame");
    if (!frame) return;
    injectCss();

    const btn = document.createElement("button");
    btn.id = "turf-btn";
    btn.title = T("Turf map — wage war for the city");
    btn.innerHTML = "🗺️";
    btn.onclick = (e) => { e.stopPropagation(); toggle(); };
    frame.appendChild(btn);

    const ov = document.createElement("div");
    ov.id = "turf-overlay";
    ov.innerHTML =
      '<div class="turf-scan"></div>' +
      '<div class="turf-top">' +
        '<div class="turf-title">🗺️ <b>' + T("CITY TURF") + '</b></div>' +
        '<div class="turf-stat" id="turf-stat"></div>' +
        '<button class="turf-x" id="turf-close">✕</button>' +
      '</div>' +
      '<div class="turf-grid" id="turf-grid"></div>' +
      '<div class="turf-panel" id="turf-panel"></div>';
    frame.appendChild(ov);
    ov.querySelector("#turf-close").onclick = (e) => { e.stopPropagation(); close(); };
    mounted = true;
  }

  // ---- open / close (pointer-events gating) --------------------------------
  function toggle() { open ? close() : openMap(); }
  function openMap() {
    mount();
    if (cut() || planning() || document.getElementById("onboard")) return; // never over a movie/plan/tutorial
    open = true; sel = null;
    document.getElementById("turf-overlay").classList.add("show");
    document.getElementById("turf-btn").classList.add("on");
    if (WB.SOUND) WB.SOUND.play("open");
    // live map while it's open; first paint from a one-shot fetch so it's instant
    if (WB.CLOUD && WB.CLOUD.fetchDistricts) WB.CLOUD.fetchDistricts().then((m) => { cloud = m || {}; if (open) render(); });
    if (WB.CLOUD && WB.CLOUD.watchDistricts) unsub = WB.CLOUD.watchDistricts((m) => { cloud = m || {}; if (open) render(); });
    render();
  }
  function close() {
    open = false; sel = null;
    if (unsub) { unsub(); unsub = null; }
    const ov = document.getElementById("turf-overlay");
    if (ov) ov.classList.remove("show");
    const b = document.getElementById("turf-btn"); if (b) b.classList.remove("on");
  }

  // ---- render --------------------------------------------------------------
  function render() {
    if (!open) return;
    const grid = document.getElementById("turf-grid"), stat = document.getElementById("turf-stat");
    if (!grid) return;
    stat.innerHTML = myGangId()
      ? '⚔️ ' + fmt(myStrength()) + ' ' + T("muscle") + ' · 🏙️ ' + heldCount() + '/' + DISTRICTS.length
      : '<span class="turf-warn">' + T("No family — form one to fight") + '</span>';

    grid.innerHTML = DISTRICTS.map((d, i) => {
      const v = viewOf(d, i);
      const klass = v.kind === "you" ? "mine" : v.kind === "rival" ? "rival" : "ai";
      const ico = v.kind === "you" ? "👑" : v.real ? "🩸" : "🕴️";
      return '<button class="turf-cell ' + klass + (sel === d.id ? " sel" : "") + '" data-d="' + d.id + '">' +
        '<span class="tc-ico">' + ico + '</span>' +
        '<span class="tc-name">' + esc(T(d.name)) + '</span>' +
        '<span class="tc-owner">' + esc(v.name) + '</span>' +
        '<span class="tc-str">🛡️ ' + fmt(v.strength) + '</span>' +
        '<span class="tc-reticle"></span>' +
      '</button>';
    }).join("");
    grid.querySelectorAll("[data-d]").forEach((b) => { b.onclick = (e) => { e.stopPropagation(); pick(b.dataset.d); }; });
    renderPanel();
  }

  function pick(id) { sel = (sel === id ? null : id); render(); }

  function renderPanel() {
    const panel = document.getElementById("turf-panel"); if (!panel) return;
    if (!sel) { panel.classList.remove("show"); panel.innerHTML = ""; return; }
    const idx = DISTRICTS.findIndex((x) => x.id === sel), d = DISTRICTS[idx], v = viewOf(d, idx);
    panel.classList.add("show");

    if (v.kind === "you") {
      panel.innerHTML = '<div class="tp-row"><b>👑 ' + esc(T(d.name)) + '</b><span class="tp-tag mine">' + T("YOUR TURF") + '</span></div>' +
        '<div class="tp-sub">' + T("This block already pays tribute to your family.") + '</div>';
      return;
    }
    const can = !!myGangId() && (WB.CLOUD && WB.CLOUD.enabled);
    const p = Math.round(odds(v.strength, 0.55) * 100);
    const oddsClass = p >= 60 ? "good" : p >= 35 ? "mid" : "bad";
    panel.innerHTML =
      '<div class="tp-row"><b>' + (v.real ? "🩸 " : "🕴️ ") + esc(T(d.name)) + '</b>' +
        '<span class="tp-tag ' + (v.real ? "rival" : "ai") + '">' + (v.real ? T("RIVAL CREW") : T("AI FAMILY")) + '</span></div>' +
      '<div class="tp-sub">' + T("Held by") + ' <b>' + esc(v.name) + '</b> · 🛡️ ' + fmt(v.strength) + ' ' + T("defense") + '</div>' +
      '<div class="tp-odds"><span class="tp-odds-l">' + T("Raid odds") + '</span><span class="tp-odds-v ' + oddsClass + '">~' + p + '%</span></div>' +
      (can
        ? '<button class="tp-attack" id="turf-attack">⚔️ ' + T("Plan the raid") + '</button>'
        : '<div class="tp-locked">' + (myGangId() ? T("Go online to wage war.") : T("Form a syndicate (Crime → Mafia) to attack.")) + '</div>');
    const ab = panel.querySelector("#turf-attack");
    if (ab) ab.onclick = (e) => { e.stopPropagation(); attack(d, v); };
  }

  // ---- the war ------------------------------------------------------------
  function attack(d, v) {
    if (jailed()) { toast("🚫 " + T("You're in jail. Sit tight."), "bad"); return; }
    if (cut()) { toast("🎬 " + T("A scene's already playing — let it finish."), "bad"); return; }
    if (!myGangId()) { toast("🕴️ " + T("Form a syndicate first."), "bad"); return; }
    const job = { icon: "⚔️", name: T("Raid on") + " " + T(d.name) };
    const go = (q) => {
      if (q == null) return; // backed out of planning
      resolve(d, v, q);
    };
    if (WB.PLANNING && WB.PLANNING.openPlan) WB.PLANNING.openPlan(job, go);
    else go(0.6);
  }

  function resolve(d, v, q) {
    const win = Math.random() < odds(v.strength, q);
    const mg = myGangId(), mgName = myGangName();
    // close the map so the cutscene owns the room box
    close();

    if (win) {
      // seize it: store the strength we'll defend it with, reward the family pot + your own cut
      const newStr = Math.floor(myStrength() * 0.92);
      if (WB.CLOUD && WB.CLOUD.claimDistrict) WB.CLOUD.claimDistrict(d.id, mg, mgName, newStr);
      cloud[d.id] = { id: d.id, owner: mg, ownerName: mgName, strength: newStr };
      const haul = Math.floor((ips() * 60 * (6 + Math.random() * 9)) + d.base * 50 + 500);
      const potShare = Math.floor(haul * 0.6), mine = haul - potShare;
      if (WB.GAME && WB.GAME.earn) WB.GAME.earn(mine);
      if (WB.CLOUD && WB.CLOUD.contributeToGang) WB.CLOUD.contributeToGang(mg, potShare);
      if (v.real && v.gangId && WB.CLOUD && WB.CLOUD.sendWarNotice) WB.CLOUD.sendWarNotice(v.gangId, mgName, T(d.name), true);
      const reveal = () => {
        if (WB.SOUND) WB.SOUND.play("win"); confettiSafe();
        toast("🏙️ " + T("Took") + " " + T(d.name) + "! +" + fmt(mine, true) + " " + T("to you") + " · " + fmt(potShare, true) + " " + T("to the pot"), "good");
        if (WB.UI && WB.UI.bubble) WB.UI.bubble(WB.pick ? WB.pick(["Another block under our flag.", "The city's getting smaller. For everyone else.", "Tribute starts Friday."]) : "Another block under our flag.");
        rerenderMafia();
      };
      if (WB.ROOM && WB.ROOM.play) WB.ROOM.play("turfWar", reveal); else reveal();
    } else {
      // pushed back: heat + a setback, no jail (the streets remember though)
      if (WB.CRIME && WB.CRIME.addHeat) WB.CRIME.addHeat(12);
      if (v.real && v.gangId && WB.CLOUD && WB.CLOUD.sendWarNotice) WB.CLOUD.sendWarNotice(v.gangId, mgName, T(d.name), false);
      const reveal = () => {
        if (WB.SOUND) WB.SOUND.play("lose");
        toast("🩸 " + T("The raid on") + " " + T(d.name) + " " + T("got pushed back — lay low, heat's up."), "bad");
        if (WB.UI && WB.UI.bubble) WB.UI.bubble("We regroup. We come back. Nobody forgets this.");
        rerenderMafia();
      };
      if (WB.ROOM && WB.ROOM.play) WB.ROOM.play("turfRaid", reveal); else reveal();
    }
  }

  function rerenderMafia() { if (WB.UI && WB.UI.refreshTab) WB.UI.refreshTab(); }
  function confettiSafe() { try { if (WB.UI && WB.UI.confetti) WB.UI.confetti(); } catch (e) {} }
  function toast(t, k) { if (WB.UI && WB.UI.toast) WB.UI.toast(t, k); }

  // ---- styles --------------------------------------------------------------
  function injectCss() {
    if (document.getElementById("turf-css")) return;
    const s = document.createElement("style");
    s.id = "turf-css";
    s.textContent = `
#room-frame { position: relative; }
#turf-btn {
  position: absolute; top: 8px; right: 8px; z-index: 6;
  width: 34px; height: 34px; border-radius: 10px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.18); font-size: 17px; line-height: 1;
  background: linear-gradient(160deg, rgba(20,26,52,0.92), rgba(10,12,28,0.92));
  color: #fff; box-shadow: 0 4px 14px rgba(0,0,0,0.4); transition: transform .15s, box-shadow .2s;
}
#turf-btn:hover { transform: translateY(-1px) scale(1.05); }
#turf-btn.on { box-shadow: 0 0 0 2px #ffce4d, 0 4px 16px rgba(255,200,60,0.5); }
#turf-overlay {
  position: absolute; inset: 0; z-index: 5; pointer-events: none; opacity: 0;
  display: flex; flex-direction: column; overflow: hidden;
  background:
    radial-gradient(120% 90% at 50% -10%, rgba(80,40,140,0.35), transparent 60%),
    linear-gradient(180deg, rgba(8,10,24,0.96), rgba(6,7,16,0.985));
  transition: opacity .22s ease; font-family: inherit;
}
#turf-overlay.show { pointer-events: auto; opacity: 1; }
#turf-overlay::before {
  content: ""; position: absolute; inset: 0; opacity: .5; pointer-events: none;
  background-image:
    linear-gradient(rgba(90,140,255,0.10) 1px, transparent 1px),
    linear-gradient(90deg, rgba(90,140,255,0.10) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(120% 100% at 50% 40%, #000 55%, transparent 100%);
}
.turf-scan {
  position: absolute; left: 0; right: 0; height: 38%; top: -38%; pointer-events: none;
  background: linear-gradient(180deg, transparent, rgba(120,180,255,0.07), transparent);
  animation: turfScan 4.5s linear infinite;
}
@keyframes turfScan { to { top: 120%; } }
.turf-top {
  position: relative; z-index: 2; display: flex; align-items: center; gap: 8px;
  padding: 7px 9px; border-bottom: 1px solid rgba(255,255,255,0.08);
  background: linear-gradient(180deg, rgba(10,14,32,0.7), transparent);
}
.turf-title { font-size: 11px; letter-spacing: .12em; color: #cfe0ff; }
.turf-title b { color: #fff; }
.turf-stat { margin-left: auto; font-size: 10px; color: #9fb4e6; white-space: nowrap; }
.turf-warn { color: #ffb24d; }
.turf-x {
  width: 22px; height: 22px; border-radius: 7px; cursor: pointer; flex: 0 0 auto;
  border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.06); color: #fff; font-size: 12px;
}
.turf-x:hover { background: rgba(255,90,90,0.25); }
.turf-grid {
  position: relative; z-index: 2; flex: 1; min-height: 0; display: grid;
  grid-template-columns: repeat(4, 1fr); grid-auto-rows: 1fr; gap: 4px; padding: 6px;
}
.turf-cell {
  position: relative; overflow: hidden; cursor: pointer; text-align: left;
  display: flex; flex-direction: column; justify-content: center; gap: 1px;
  padding: 4px 5px; border-radius: 7px; color: #eaf0ff; font: inherit;
  border: 1px solid rgba(255,255,255,0.10);
  background: linear-gradient(155deg, rgba(40,48,78,0.85), rgba(22,26,46,0.9));
  transition: transform .12s, box-shadow .2s, border-color .2s;
}
.turf-cell:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.3); }
.turf-cell .tc-ico { position: absolute; top: 3px; right: 4px; font-size: 11px; opacity: .9; }
.turf-cell .tc-name { font-size: 9.5px; font-weight: 800; line-height: 1.05; }
.turf-cell .tc-owner { font-size: 8px; color: #aeb9da; line-height: 1.05; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.turf-cell .tc-str { font-size: 8px; color: #d7e2ff; margin-top: 1px; }
.turf-cell.ai    { background: linear-gradient(155deg, rgba(46,52,74,0.9), rgba(24,27,42,0.92)); }
.turf-cell.rival { background: linear-gradient(155deg, rgba(96,28,40,0.92), rgba(46,16,22,0.94)); border-color: rgba(255,90,110,0.35); }
.turf-cell.rival .tc-owner { color: #ffb9c4; }
.turf-cell.mine  { background: linear-gradient(155deg, rgba(120,92,24,0.92), rgba(70,52,12,0.94)); border-color: rgba(255,206,77,0.5); box-shadow: inset 0 0 12px rgba(255,206,77,0.18); }
.turf-cell.mine .tc-owner { color: #ffe6a3; }
.turf-cell .tc-reticle { display: none; }
.turf-cell.sel { border-color: #ffce4d; box-shadow: 0 0 0 1.5px #ffce4d, 0 0 14px rgba(255,200,60,0.4); }
.turf-cell.sel .tc-reticle {
  display: block; position: absolute; inset: 2px; border-radius: 6px; pointer-events: none;
  border: 1.5px dashed rgba(255,206,77,0.85); animation: turfPulse 1.1s ease-in-out infinite;
}
@keyframes turfPulse { 0%,100% { opacity: .4; } 50% { opacity: 1; } }
.turf-panel {
  position: relative; z-index: 3; pointer-events: auto; flex: 0 0 auto;
  max-height: 0; overflow: hidden; transition: max-height .25s ease, padding .25s ease;
  padding: 0 9px; border-top: 1px solid rgba(255,255,255,0.0);
  background: linear-gradient(0deg, rgba(8,10,22,0.96), rgba(14,18,38,0.9));
}
.turf-panel.show { max-height: 130px; padding: 8px 9px; border-top-color: rgba(255,255,255,0.08); }
.tp-row { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #fff; }
.tp-tag { margin-left: auto; font-size: 8px; letter-spacing: .08em; padding: 2px 6px; border-radius: 6px; }
.tp-tag.mine { background: rgba(255,206,77,0.22); color: #ffe6a3; }
.tp-tag.rival { background: rgba(255,90,110,0.2); color: #ffb9c4; }
.tp-tag.ai { background: rgba(150,170,220,0.16); color: #cdd8f5; }
.tp-sub { font-size: 9.5px; color: #aeb9da; margin-top: 2px; }
.tp-odds { display: flex; align-items: center; gap: 6px; margin-top: 5px; }
.tp-odds-l { font-size: 9px; color: #9fb4e6; }
.tp-odds-v { font-size: 11px; font-weight: 800; margin-left: auto; }
.tp-odds-v.good { color: #4dde80; } .tp-odds-v.mid { color: #ffce4d; } .tp-odds-v.bad { color: #ff6b6b; }
.tp-attack {
  width: 100%; margin-top: 7px; padding: 7px; border-radius: 9px; cursor: pointer;
  border: none; font: inherit; font-weight: 800; font-size: 11px; color: #1a1206;
  background: linear-gradient(160deg, #ffd97a, #ffb02e); box-shadow: 0 3px 12px rgba(255,160,40,0.4);
}
.tp-attack:hover { filter: brightness(1.06); }
.tp-locked { margin-top: 7px; font-size: 9.5px; color: #ffb24d; text-align: center; }
`;
    document.head.appendChild(s);
  }

  // mount once the room box exists; the button waits quietly until you tap it.
  function boot() {
    mount();
    if (!mounted) setTimeout(boot, 400);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  WB.TURF = { mount, open: openMap, close, toggle, isOpen: () => open, render };
})();
