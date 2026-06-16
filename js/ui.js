/* WiFi Billionaire — UI: thought bubbles, action cards, tabs, toasts, modals.
   (Room rendering lives in room.js.) */
'use strict';

WB.UI = (function () {
  const D = WB.DATA;
  const $ = id => document.getElementById(id);
  let st = null;
  let activeTab = "shop";
  let lastTabHtml = "";
  let lastActionsHtml = "";
  let modalIsOpen = false;
  let lastMoney = 0;

  // ============================================================ Bubbles / toasts
  let bubbleTimer = null;
  function bubbleTrack() {
    const el = $("bubble"), frame = $("room-frame");
    if (!el || !frame || !el.classList.contains("show")) return;
    if (!(WB.ROOM && WB.ROOM.charX)) return;
    // a cutscene is a movie — no inner monologue over it
    if (WB.ROOM.cutActive && WB.ROOM.cutActive()) { el.classList.remove("show"); return; }
    const cw = frame.clientWidth; // frame is exactly 16:9 — canvas fills it
    const x = WB.ROOM.charX() * cw;
    // clamp by the bubble's REAL half-width so the full sentence always stays
    // inside the room box — even when he's asleep in a corner (was clipping).
    const half = Math.min(el.offsetWidth / 2, cw / 2 - 6) + 6;
    el.style.left = Math.max(half, Math.min(cw - half, x)) + "px";
  }
  function bubble(text) {
    if (!text || !getSetting("bubbles")) return;
    if (WB.ROOM && WB.ROOM.cutActive && WB.ROOM.cutActive()) return; // never during a cutscene
    const el = $("bubble");
    el.textContent = text;
    el.classList.remove("show");
    void el.offsetWidth; // restart animation
    el.classList.add("show");
    bubbleTrack();
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => el.classList.remove("show"), 6500);
  }
  function scheduleThoughts() {
    const delay = 7000 + Math.random() * 6000;
    setTimeout(() => {
      if (!modalIsOpen) bubble(WB.THOUGHTS.next(st, WB.GAME.incomePerSec()));
      scheduleThoughts();
    }, delay);
  }

  // ---------- Notification center ----------
  // Every notification lands in the inbox (🔔). Only IMPORTANT types also pop a
  // toast; chatty ones (minor events, info) just bump the unread badge.
  const POPUP_TYPES = new Set(["ach", "era", "viral", "goal", "trait", "level", "good", "bad"]);
  const NOTIF_CAP = 60;
  let notifs = [];
  try { notifs = JSON.parse(localStorage.getItem("wb_notifs") || "[]"); } catch (e) { notifs = []; }
  function saveNotifs() { try { localStorage.setItem("wb_notifs", JSON.stringify(notifs)); } catch (e) {} }
  function unreadCount() { return notifs.reduce((n, x) => n + (x.read ? 0 : 1), 0); }
  function renderNotifBadge() {
    const b = $("notif-badge");
    if (!b) return;
    const n = unreadCount();
    b.style.display = n ? "" : "none";
    b.textContent = n > 9 ? "9+" : n;
  }
  function fmtAgo(ts) {
    const s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }
  function renderNotifPanel() {
    const list = $("notif-list");
    if (!list) return;
    list.innerHTML = notifs.length
      ? notifs.map((n, i) => `<div class="notif-item ${n.type || "info"} ${n.read ? "" : "unread"}">
          <div class="n-text">${n.text}<div class="n-time">${fmtAgo(n.ts)}</div></div>
          <button class="n-del" data-ndel="${i}" title="Delete">✕</button></div>`).join("")
      : `<div class="notif-empty">📭 Nothing here. Go make some news.</div>`;
    list.querySelectorAll("[data-ndel]").forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      notifs.splice(+b.dataset.ndel, 1);
      saveNotifs(); renderNotifPanel(); renderNotifBadge();
    });
  }
  function toggleNotifPanel(open) {
    const p = $("notif-panel");
    const want = open !== undefined ? open : !p.classList.contains("open");
    p.classList.toggle("open", want);
    if (want) {
      renderNotifPanel();
      notifs.forEach(n => { n.read = true; });
      saveNotifs(); renderNotifBadge();
    }
  }
  function pushNotif(text, type) {
    notifs.unshift({ text, type: type || "info", ts: Date.now(), read: false });
    if (notifs.length > NOTIF_CAP) notifs.length = NOTIF_CAP;
    saveNotifs(); renderNotifBadge();
    if ($("notif-panel") && $("notif-panel").classList.contains("open")) renderNotifPanel();
  }

  let lastToastText = "", lastToastAt = 0;
  // Apple-notification styling: app icon (the leading emoji, or a per-type
  // default) + a bold title line + the message body + "now".
  const TOAST_META = {
    good:  { app: "Reward",              icon: "💸" },
    bad:   { app: "Heads up",            icon: "⚠️" },
    event: { app: "Something happened",  icon: "🎲" },
    level: { app: "Level up",            icon: "⭐" },
    trait: { app: "New trait",           icon: "🧬" },
    goal:  { app: "Challenge complete",  icon: "🎯" },
    ach:   { app: "Achievement",         icon: "🏆" },
    viral: { app: "Going viral",         icon: "🔥" },
    era:   { app: "New era",             icon: "🌍" },
    info:  { app: "WiFi Billionaire",    icon: "📶" },
  };
  const TOAST_EMOJI_RE = /^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*️?)\s*/u;
  function toast(text, type) {
    text = WB.t(text); // constant toasts translate; composed ones pass through
    pushNotif(text, type); // everything is collected in the inbox
    if (!POPUP_TYPES.has(type || "info")) return; // chatty stuff stays in the inbox
    if (cutOrPlan()) return; // never pop a toast over a cutscene or the planning board — it's in the inbox
    if (text === lastToastText && Date.now() - lastToastAt < 5000) return; // de-dupe bursts
    lastToastText = text; lastToastAt = Date.now();
    const box = $("toasts");
    const el = document.createElement("div");
    el.className = "toast " + (type || "info");
    const meta = TOAST_META[type || "info"] || TOAST_META.info;
    const m = text.match(TOAST_EMOJI_RE);
    const icon = m ? m[1] : meta.icon;
    const body = m ? text.slice(m[0].length) : text;
    el.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-body">
        <div class="toast-row"><span class="toast-app">${esc(WB.t(meta.app))}</span><span class="toast-time">${WB.t("now")}</span></div>
        <div class="toast-msg">${esc(body)}</div>
      </div>`;
    box.appendChild(el);
    if (WB.SOUND) { const snd = { level: "level", ach: "level", goal: "win", era: "win", viral: "win" }[type]; if (snd) WB.SOUND.play(snd); }
    while (box.children.length > 4) box.removeChild(box.firstChild);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 400); }, 6000);
  }
  function notifyAchievement(a) {
    toast(`🏆 Achievement unlocked: ${a.icon} ${a.name}`, "ach");
  }

  // ============================================================ Modals
  // The scam texting app is a full-screen layer above modals, so while it is
  // open we treat the UI as "busy": events and perk offers wait instead of
  // popping underneath it.
  function scamOpen() {
    const s = $("scam-app");
    return !!(s && s.classList.contains("open"));
  }
  // A cutscene is a movie and planning is sacred — NOTHING interrupts them.
  function cutOrPlan() {
    return !!(WB.ROOM && WB.ROOM.cutActive && WB.ROOM.cutActive()) || !!document.querySelector(".plan-overlay");
  }
  function uiBusy() { return modalIsOpen || scamOpen() || tutStep >= 0 || !!document.getElementById("onboard") || cutOrPlan(); }
  function openModal(html) {
    modalIsOpen = true;
    $("modal-content").innerHTML = html;
    WB.I18N.translateDom($("modal-content"));
    $("modal-overlay").classList.add("open");
  }
  function closeModal() {
    modalIsOpen = false;
    $("modal-overlay").classList.remove("open");
  }
  function showEventModal(ev) {
    const text = WB.EVENTS.fill(ev.text);
    openModal(`
      <div class="ev-icon">${ev.icon}</div>
      <h2>${ev.title}</h2>
      <p>${text}</p>
      <div class="ev-choices">${ev.choices.map((c, i) =>
        `<button class="btn choice" data-evchoice="${i}">${c.label}${c.luckCheck !== undefined ? " 🎲" : ""}</button>`).join("")}
      </div>`);
    $("modal-content").querySelectorAll("[data-evchoice]").forEach(btn => {
      btn.onclick = () => {
        const result = WB.GAME.resolveMajorChoice(ev, +btn.dataset.evchoice);
        openModal(`<div class="ev-icon">${ev.icon}</div><h2>${ev.title}</h2><p class="ev-result">${result}</p><button class="btn primary" id="ev-done">Continue</button>`);
        $("ev-done").onclick = closeModal;
      };
    });
  }
  function offerPerks(perks) {
    // wait while ANYTHING important is up (cutscene, planning, texting, tutorial, a modal) — never stack popups
    if (uiBusy()) { setTimeout(() => offerPerks(perks), 2500); return; }
    openModal(`
      <h2>✨ ${WB.t("Level Up — Choose a Perk")}</h2>
      <p class="muted">${WB.t("Pick one. The other two are lost to the multiverse.")}</p>
      <div class="perk-cards">${perks.map((p, i) =>
        `<button class="perk-card" data-perk="${i}"><div class="perk-icon">${p.icon}</div><div class="perk-name">${p.name}</div><div class="perk-desc">${p.desc}</div></button>`).join("")}
      </div>`);
    $("modal-content").querySelectorAll("[data-perk]").forEach(btn => {
      btn.onclick = () => { WB.GAME.choosePerk(+btn.dataset.perk); closeModal(); };
    });
  }
  function showOffline(off) {
    // narrator card first, results after — like every good montage
    if (WB.ROOM.playCard) WB.ROOM.playCard(WB.t("5 BILLION HOURS LATER…"), "(" + WB.t("fine, it was") + " " + WB.fmtTime(off.away) + ")", 3000);
    openModal(`
      <div class="ev-icon">🌙</div>
      <h2>While You Were Away…</h2>
      <p>Your entrepreneur kept the hustle alive for <b>${WB.fmtTime(off.away)}</b> and earned</p>
      <div class="offline-amount">${WB.fmt(off.gained, true)}</div>
      <button class="btn primary" id="off-done">Nice.</button>`);
    $("off-done").onclick = closeModal;
  }

  // ============================================================ Daily reward streak
  // Come back each day for an escalating cash bonus that scales with your income,
  // so it stays meaningful at every stage. Day 7 is a big payday, then it loops.
  // Stored in localStorage so it survives prestige and game updates.
  const dayKey = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  function readDaily() { try { return JSON.parse(localStorage.getItem("wb_daily") || "null"); } catch (e) { return null; } }
  function writeDaily(rec) { try { localStorage.setItem("wb_daily", JSON.stringify(rec)); } catch (e) {} }
  function dailyReward(streak) {
    const day = ((streak - 1) % 7) + 1;
    const ips = (WB.GAME.incomePerSec && WB.GAME.incomePerSec()) || 0;
    let reward = Math.max(250, ips * 180) * (1 + 0.2 * (day - 1)); // ~3 min of income, ramps across the week
    if (day === 7) reward *= 3;                                    // day 7 = big payday
    return { day, reward: Math.max(1, Math.floor(reward)) };
  }
  function maybeDailyReward() {
    const rec = readDaily();
    const today = new Date(), tKey = dayKey(today);
    const yKey = dayKey(new Date(today.getTime() - 86400000));
    if (rec && rec.last === tKey) return;                 // already claimed today
    const streak = rec && rec.last === yKey ? (rec.streak || 0) + 1 : 1; // continue or reset
    const show = () => {
      if (modalIsOpen) { setTimeout(show, 1500); return; } // queue politely behind onboarding/tutorial/offline
      showDailyModal(streak, tKey);
    };
    setTimeout(show, 1400);
  }
  function showDailyModal(streak, tKey) {
    const { day, reward } = dailyReward(streak);
    const pips = [1, 2, 3, 4, 5, 6, 7].map(n => {
      const past = n < day, cur = n === day;
      const bg = past ? "rgba(77,222,128,.18)" : cur ? "linear-gradient(180deg,#4dde80,#2bb85f)" : "rgba(255,255,255,.06)";
      const col = cur ? "#04210f" : past ? "#7be3a4" : "var(--muted,#9aa)";
      const bd = cur ? "#4dde80" : "rgba(255,255,255,.10)";
      return `<div style="flex:1;max-width:46px;padding:9px 0;border-radius:11px;font-size:12px;font-weight:800;text-align:center;background:${bg};color:${col};border:1px solid ${bd}">${past ? "✓" : n === 7 ? "🎁" : "D" + n}</div>`;
    }).join("");
    const canAd = WB.ADS && WB.ADS.enabled; // rewarded "watch to double" — browser build only
    openModal(`
      <div class="ev-icon">📅</div>
      <h2>Daily Reward</h2>
      <p>Day <b>${streak}</b> of your login streak${day === 7 ? " — <b>payday!</b> 🎁" : ""}. Keep showing up.</p>
      <div style="display:flex;gap:6px;justify-content:center;margin:14px 2px">${pips}</div>
      <div class="offline-amount">${WB.fmt(reward, true)}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="btn primary" id="daily-claim">Claim 💰</button>
        ${canAd ? `<button class="btn" id="daily-double">📺 Double it (watch ad)</button>` : ""}
      </div>`);
    const finish = (amt, doubled) => {
      WB.GAME.earn(amt);
      writeDaily({ last: tKey, streak });
      confetti();
      toast(`📅 Day ${streak} reward: ${WB.fmt(amt, true)}${doubled ? " (×2!)" : ""}!`, "good");
      if (WB.CG && WB.CG.happytime && (day === 7 || doubled)) WB.CG.happytime();
      if (WB.GAME.save) WB.GAME.save();
      closeModal();
    };
    $("daily-claim").onclick = () => finish(reward, false);
    if (canAd) $("daily-double").onclick = () => {
      const btn = $("daily-double"); if (btn) { btn.disabled = true; btn.textContent = "📺 Loading ad…"; }
      WB.ADS.rewarded(() => finish(reward * 2, true));
    };
  }

  let settingsTab = "general";
  const UPDATES = [
    { v: "v7.4.2 — Fits anywhere 📐", items: [
      "📐 The whole game now fits neatly in small landscape windows (down to 800×450) without scrolling — room, controls and shop all on screen, text readable.",
      "🧹 Tidied the layout for embedded play.",
    ]},
    { v: "v7.4.1 — Bigger room, cleaner UI 🔍", items: [
      "🔍 The pixel room is now front and center — much bigger, and the whole left side is calmer.",
      "🎯 The wall of focus buttons is folded into ONE tidy picker: tap it to open a grouped menu (Hustles / Grow & Live) and choose what he's doing.",
      "🗺️ Fixed: the room is only touchable while the turf map is open — no more stray taps when it's closed.",
    ]},
    { v: "v7.4.0 — Crime pays 🦹", items: [
      "🧰 NEW: Black-Market Gear — eight permanent tools (burner phone, fake IDs, police scanner, getaway driver, mob lawyer, inside man, body armor…) that lower your risk, boost your take, cut jail time, and cool heat. They stack on every job.",
      "🔥 NEW: clean-streak multiplier — pull jobs without getting caught and your take climbs (up to +48%); get pinched and it resets.",
      "💰 Every crime now shows its estimated take up front, and a rap sheet tracks your jobs, clean %, biggest score and busts.",
      "🛒 More shop: new gear (Phone, Headset, Microphone, Camera) and new lifestyle (Private Chef, Penthouse Suite, Racehorse, Private Island — three of them usable).",
      "🦹 NEW: SEASONS — a calendar-driven theme that bends the game. Crime Season is LIVE now: +25% on every score and heat cools 50% faster. (See the banner up top.)",
      "🎩 Fresh crime-themed app icon.",
    ]},
    { v: "v7.3.2 — Family business 🕴️🌍", items: [
      "🔧 Fixed: your syndicate now STAYS. Leaving and logging back in keeps your family — no more starting over (it was being restored before sign-in finished).",
      "⚙️ NEW: a clean Mafia management screen — tap your family's name to manage the pot, members, roles & cuts, recruiting, and your turf, all in one popup.",
      "🕴️ Running rackets finally looks the part: a dedicated mafia status (planning, looking for members, counting the take…) and your character runs the family from his desk — fedora, cigar, stacks of cash.",
      "🌍 NEW: six more languages — Русский, Deutsch, Français, Español, Português, Italiano (Settings → General).",
    ]},
    { v: "v7.3.1 — A bigger room 🔍", items: [
      "🔍 The room/character box is noticeably bigger now — a wider scene column and a tighter layout underneath give the pixel room more of the screen, so the turf map (and your character) have real space to breathe.",
      "🗺️ The turf map now fully covers the room when open — no more housing label or project bar peeking through.",
    ]},
    { v: "v7.3.0 — Turf War 🗺️⚔️", items: [
      "🗺️ NEW: the TURF MAP — tap the map button in your room to open a neon city of 12 districts. See rival player syndicates (red) and AI families (slate) holding the streets. It's only touchable while open, so it never gets in your way.",
      "⚔️ NEW: MAFIA WARS — target any district, plan the raid, and throw your family's muscle against its defenders. Win and you SEIZE the block (cash to you + the pot, and your colours go up); lose and you get pushed back with the heat rising.",
      "🩸 Attack a real player's turf and their boss gets a war notice in their inbox — hold your ground or watch your districts get taken.",
      "🕴️ Now EVERY score kicks a cut up to the family pot — mafia rackets pay 25%, every other crime and heist a 10% street tax. The boss still splits it by the cuts you set.",
      "🎬 Two brand-new cutscenes: a block changing hands under your flag, and a raid that goes sideways.",
    ]},
    { v: "v7.2.0 — The Mafia Update 🕴️", items: [
      "🕴️ NEW: the Mafia — a whole crime category of rackets, a 'Made Man' career path, and real online SYNDICATES: form a family, recruit players, and a cut of every mafia job feeds a shared pot.",
      "👔 Bosses can rename the family, assign roles (Underboss, Capo, Soldier…) and set each member's cut of the pot.",
      "🗺️ NEW: every hard job now starts with a PLANNING board — pick your approach, entry, getaway and edge; a tight plan means a much safer score.",
      "🔊 NEW: sound effects across the game (toggle in Settings → General). 🏚️ Jail now has life — yard time, sleeping, a passing train — with its own prison events.",
      "🎬 Cutscenes are now sacred — NOTHING pops over them (or the planning board) anymore. Plus: a livelier activity bar, the skill chip shows your real skill level, and the crime types now clearly scroll.",
    ]},
    { v: "v7.1.0 — Rebirth, socials & a crew shake-up", items: [
      "♻️ Rebirth now FULLY resets your empire — and springs you straight out of jail, instantly.",
      "🌐 NEW: Follow Us links (TikTok, Discord, GitHub, itch.io) in Settings → About, a 'Message the developer' support button, and a 'follow us for a prize' bonus.",
      "🚔 A failed crew heist now jails the WHOLE crew — and you can't recruit someone who's locked up (bail them out right from the lobby). No random popups while you're in jail.",
      "💬 Fixed: the thought bubble no longer gets cut off — full sentence stays in the room, even while he's asleep.",
      "🤖 The autoclicker popup now only triggers on an actual autoclicker, not fast hand-clicking. ✨ Cleaner crime card spacing.",
    ]},
    { v: "v7.0.1 — Smoother start (player feedback 🙏)", items: [
      "🎓 The intro tutorial is no longer buried under level-up popups — level-ups stay quiet while you're reading it, and a burst of levels now shows as a single tidy toast.",
      "🪟 Windows: smoother installer — it now installs just for you with no admin prompt and no confusing folder step, so it launches reliably.",
    ]},
    { v: "v7.0.0 — MULTIPLAYER HEISTS 🤝", items: [
      "👥 NEW: real co-op heist lobbies! On any robbery, hit Crew to open a lobby, invite online friends AND players, and pull the job together.",
      "✅ Everyone readies up before the host rolls out — a bigger crew means lower risk and a bigger score, with a cut sent to every member.",
      "💬 Lobby chat while you wait, live ready-up indicators, and you can see who's online to invite.",
      "📲 Get invited and a slick popup slides in — Join or Decline before it expires.",
    ]},
    { v: "v6.9.2 — Watch-to-double", items: [
      "📺 (Web version) Claim your Daily Reward, then optionally watch a short ad to DOUBLE it. Desktop app stays ad-free.",
    ]},
    { v: "v6.9.1 — UI polish", items: [
      "✨ Redesigned the crime category tabs into a clean segmented control — much nicer than the old chunky buttons.",
      "🌙 Fixed ugly hover flashes in dark mode — your profile button, the top-bar icons and several buttons no longer flash light grey when you hover them.",
    ]},
    { v: "v6.9.0 — Crime Wave + a tighter crew", items: [
      "🌆 The Underworld is now sorted into tabs: 🧤 Street, 💬 Scams, 💻 Hacking, 🎩 Fraud, 📦 Smuggling and 🔫 Robberies.",
      "🦹 TONS more crimes — 46 in total — from pickpocketing and vending-machine raids all the way up to a Museum Heist and the Federal Reserve Job.",
      "⚖️ Fixed bailing a friend: you now see exactly when a friend's locked up and their real bail amount — one tap pays it and frees them instantly.",
      "👥 Richer Friends list: your rank among your crew, each friend's era + rebirth badges, and a 🔒 flag (with a pulsing bail button) when someone's in jail.",
    ]},
    { v: "v6.8.0 — The Big One: more action, more to do, more happening", items: [
      "🎬 SIX new cutscenes: cruise in your car, throw a yacht party, watch a post go viral, a cop car crawling past, a full police RAID, and a shopping-spree montage.",
      "🛍️ USE your toys! Owned cars, hot tubs, consoles, yachts and more now have a tap-to-use action — go for a drive, throw a party, crush a workout — for real on-demand boosts, not just passive stats.",
      "🚨 Heat finally bites: when the law's closing in you'll get tense decision popups — 'I've got a bad feeling…', patrol cars crawling by, fixers who can wash your heat — with real choices and real consequences (sometimes a raid).",
      "💬 Heaps of new events and thoughts across the whole game, so it always feels alive.",
    ]},
    { v: "v6.7.0 — Golden Opportunities (the game never sits still)", items: [
      "💸 NEW: Golden Opportunities — a coin or cash bubble floats into your room every so often. Tap it before it drifts away!",
      "🔥 Grab one for a big cash burst, a ×3–×5 income FRENZY, a jackpot, or a lucky brain-blast — rewards scale with your operation, so they always matter.",
      "🎯 It keeps the idle loop alive and rewarding from the very first minutes — eyes on the screen, hands on the cash.",
    ]},
    { v: "v6.6.2 — Heists hit harder", items: [
      "🎬 The win/loss now only reveals AFTER the heist cutscene plays — no more spoiling it before the movie.",
      "💥 NEW failure cutscene made just for heists: alarm, bullets flying, a police chase, then the ride to jail (separate from the normal arrest scene).",
      "🧑‍🤝‍🧑 Your whole crew now shows up in the cutscene — you and your partner, start to finish.",
      "💰 Heist payouts are way bigger now. It's a dope feature; it should pay like one.",
    ]},
    { v: "v6.6.1 — Desktop fixes", items: [
      "🔒 Fixed: the Admin Control Room password screen now opens in the desktop app (it used a dialog the Mac/Windows app didn't support).",
      "✏️ Fixed: changing your username now works in the desktop app too.",
    ]},
    { v: "v6.6.0 — Daily Rewards & Now Playable in Your Browser", items: [
      "📅 NEW: Daily Reward streak — come back each day for an escalating cash bonus that scales with your income. Day 7 is a big payday, then it loops.",
      "🌐 NEW: WiFi Billionaire now runs right in your browser — play instantly on the web, no download needed (also coming to CrazyGames).",
      "🔒 Tightened up behind the scenes for the public web release.",
    ]},
    { v: "v6.5.4 — Heists, Hard Jobs & a Cleaner HUD", items: [
      "🏦 NEW: Hard Jobs in Crime — high-stakes heists (jewelry, armored truck, casino, bank) that need an upfront stake and sometimes a car, with cinematic cutscenes and legendary payouts.",
      "🤝 NEW: Pull heists WITH a friend (or Adam) — a crew lowers the risk, boosts the take, shows your partner in the room, and sends them a cut.",
      "🎯 The goal bar is cleaner now — an icon chip, a progress bar and a x/20 counter.",
      "🔔 Notifications trimmed down a touch, plus more of the game (and toasts) now speak Swedish.",
    ]},
    { v: "v6.5.3 — Smoother Start & a Friend Named Adam", items: [
      "✨ Onboarding is buttery now — a staggered reveal, and switching language flips the entire game live with no reload or flash.",
      "🧑‍🏫 The tutorial glides more smoothly between steps — the spotlight and card move together with a gentler, easier-to-follow pop.",
      "🐐 Meet Adam — your built-in friend. He's always online at the top of your Friends list, says hi, and you can chat with him anytime. Adam's got you.",
    ]},
    { v: "v6.5.2 — Challenges & Notifications", items: [
      "🎯 Challenges overhauled — 31 challenges across four tiers, including a brutal new ⚜️ Legendary tier (buy the Moon, own the Solar System, 1,000 lucky crits…).",
      "📌 Track challenges — pin the ones you're chasing and they float to the top with a highlight, with a per-tier progress breakdown up top.",
      "🏆 Rewards worth the grind — big Legacy Point payouts, permanent stat boosts (luck / intelligence / reputation) and huge income multipliers.",
      "🔔 Beautiful new notifications — toasts are now real Apple-style notification cards with an app icon, title, time and message, matching the rest of the UI.",
    ]},
    { v: "v6.5.1 — Rebirth Fix & More Events", items: [
      "🐛 Fixed the rebirth glitch — owning the whole empire no longer hands out absurd, glitched Legacy Points, and your wealth actually resets on rebirth.",
      "♻️ You keep your planets through a rebirth, but the rent ramps back up over a few minutes — so a fresh life finally feels fresh.",
      "📈 Investments can no longer balloon to near-infinite values (the real cause of the broken numbers). Existing glitched saves are auto-repaired on load.",
      "🎲 8 new choice popups that actually DO things — energy-drink deals, mentors, scratch tickets, hackathons, surprise patrons and more, each with real boosts. Events also pop a little more often.",
    ]},
    { v: "v6.5 — Polished & Roomier", items: [
      "✨ A big visual refresh — richer depth, softer Apple-style shadows, and a subtle material sheen across every panel and card.",
      "📐 More breathing room everywhere: roomier shop & list cards, a calmer top bar, and a cleaner, more consistent spacing rhythm.",
      "🎛️ Smoother, springier interactions — cards and buttons gently lift on hover, with refined segmented tabs and scrollbars.",
      "🌗 Light and dark themes both retuned for a cleaner, more premium feel.",
    ]},
    { v: "v6.4.1 — Feel Good", items: [
      "💥 NEW: lucky CRIT clicks! Every hustle has a small chance to pay out 4–7× with a golden burst — track your luck in Stats.",
      "✨ Juicier feedback: floating cash pops and springs, and the Hustle button now bounces and flashes when you smash it.",
      "🐛 Stability pass: bug sweep across the new online & cutscene systems — no crashes, cleaner Swedish.",
    ]},
    { v: "v6.4 — The Online Update", items: [
      "👥 NEW: real friends! Add players by username, accept requests, and chat in real-time.",
      "🤝 NEW: send money to a friend, or ⚖️ bail them out of jail — it lands in their wallet instantly.",
      "🧑‍💼 NEW: your username now sits top-right — tap it for your Profile (friends, chats, skills, awards, stats).",
      "🏆 Leaderboard is now manual-refresh only (saves data) and shows who's online.",
      "💼 Your current career level shows on the character panel.",
      "⭐ A friendly 'enjoying the game?' check-in — Yes stars us on GitHub, No opens a quick survey.",
      "🎓 Finish the tutorial → get $1,000. And no popups interrupt the tutorial anymore.",
      "✨ Cleaner top bar, prettier progress bars, more inner-monologue thoughts, and a fuller Swedish translation.",
      "🔧 Updater made more reliable.",
    ]},
    { v: "v6.3 — Online & Alive", items: [
      "🏆 NEW: global leaderboard + live player count, powered by the cloud — climb the ranks by net worth.",
      "👋 NEW: first-launch onboarding — pick your username, language and theme before you start.",
      "🎯 NEW: a Challenges tab with 12 claimable goals (bronze/silver/gold) and juicy rewards.",
      "💩 NEW: when nature calls you must choose — run to the toilet, or… don't (the chair remembers). Plus a 🧹 Clean Up action as dirt builds up over time.",
      "⛓️ Jail overhaul: behind bars you now Work Out, do Yard Time, read law books or sleep — no more 'building a SaaS' on the way to prison.",
      "🎬 Fixed: the project progress bar and thought bubbles no longer show during cutscenes.",
      "🧍 The character got a detail pass (sneakers, hoodie strings, a real face), and the room screen is bigger.",
      "🔧 Auto-updater hardened (Chromium network stack + retries) — no more false 'couldn't check for updates'.",
      "🧹 Removed the Socials tab.",
    ]},
    { v: "v6.2.2 — Onboarding & Installer Polish", items: [
      "🧑‍🏫 Tutorial 3.0: the help card now shrinks in from each thing it explains and points right at it with a little beak — crystal clear what you're looking at.",
      "💿 Branded installer: the Mac DMG now opens on a deep-navy window with the big app icon and Applications folder (no more blank grey box), and each version mounts under its own name.",
      "🛡️ Clearer guidance on the 'unknown publisher' antivirus warnings (it's an unsigned-app prompt, not a real virus) — see the README for the one-click bypass and the permanent fix.",
    ]},
    { v: "v6.2.1 — Install Fix", items: [
      "🛡️ FIXED: macOS no longer says the app is \"damaged\" — every build is now ad-hoc code-signed, so the whole bundle is sealed properly (Apple Silicon was rejecting the old unsigned bundle outright).",
      "💿 Gorgeous new DMG: glowing brand mark, 'drag to install' arrow, and a first-launch hint — plus a polished Windows installer to match.",
      "🧹 First launch is now just right-click → Open, once; every in-app update after that is seamless.",
    ]},
    { v: "v6.2 — The Polish & Planets Update", items: [
      "🌕 NEW ENVIRONMENTS: own a Lunar Base and your room MOVES to the Moon (Mars Colony upgrades it again — portholes, $ flag, low-gravity dust).",
      "🎬 New cutscenes: walk free from jail at sunrise, '5 BILLION HOURS LATER…' narrator cards on offline returns, era changes and rebirth.",
      "🛏️ A real bed in the room — made when he's up, occupied when he sleeps.",
      "🖼️ The room is now ALWAYS a perfect 16:9 frame — no black bars, any window size.",
      "⚖️ Economy rebalanced: Empire income is flat (planets pay rent, they don't compound) — no more accidental infinite money.",
      "🚔 Jail fixes: bars only appear when you're actually IN the cell, never over text; thoughts never interrupt cutscenes.",
      "🇸🇪 Swedish overhaul: housing, careers, crime, scams, actions, goals, stats, perks — hela rubbet.",
      "🔧 Auto-update hardened: releases can no longer be published under the wrong version.",
    ]},
    { v: "v6.0 — The Empire Update", items: [
      "🪐 NEW SECRET: hit $1T net worth and a hidden tab opens — found a space company, buy the Moon, build your own city-state, simulate a universe.",
      "🎬 NEW: in-room cutscenes — get arrested and watch the cops drive you downtown; buy the Moon and watch the full rocket trip.",
      "⬇️ NEW: the game now updates ITSELF on launch — Loading… → Looking for updates… → auto-install with a progress bar. No buttons.",
      "📰 After an update, the changelog greets you on first open (like this one just did).",
      "🎮 The mode menu is gone — Casual/Speedrun now lives in Settings → General.",
    ]},
    { v: "v5.4 — The Living Character Update", items: [
      "🚽 NEW: Hygiene meter — your guy gets gross and walks himself to the toilet to freshen up.",
      "🚶 The character now WALKS around the room — to the desk, the bed, the bathroom.",
      "💭 Thought bubbles follow him as he moves.",
      "🧠 Intelligence replaces Motivation as a meter, and is MUCH faster to raise (study, ship projects, learn by doing).",
      "🧼 Hygiene replaces Happiness on the HUD; let it drop too low and income (and your nose) suffer.",
      "💨 Stink lines when you really let yourself go.",
    ]},
    { v: "v5.3 — The Menu Update", items: [
      "🎮 NEW: Main menu with Casual and Speedrun modes (speedrun = ~3× faster everything).",
      "🇸🇪 NEW: Swedish language in Settings → General, with SEK currency.",
      "🧑‍🏫 Tutorial rebuilt: animated spotlight, floating step cards, click-here guidance.",
      "🚔 Jail polish: bars off the status panel, sleek countdown pill, smooth bail button.",
      "🤖 A little surprise for autoclicker users…",
      "🧹 Cleaner layout: calmer shadows, more air, less visual noise.",
    ]},
    { v: "v5.2 — The Underworld Update", items: [
      "🦹 Crime tab redesigned: Underworld heat hero, scam feature card, risk-pill job grid.",
      "😱 NEW: Scare meter in the Scam Sim — spook your mark for fear-payouts, but panic means police.",
      "💬 Fixed: scam chats now finish properly with a result screen inside the phone.",
      "✨ Popups rebuilt: glassy blur, springy animation, cleaner event/result/perk cards.",
    ]},
    { v: "v5.1 — The Living Room Update", items: [
      "🏠 Living UI overhaul: new character status panel with live activity, mood and level.",
      "🚔 Prison takeover: get jailed and the whole room becomes a cell — bars, bunk, tally marks, cell number.",
      "😴 He actually sleeps in a bed now (and snores). 🎥 Content mode brings a ring light + camera flashes.",
      "🪙 Crypto mode shows live candle charts; 📚 Study gets a book; 🤖 Build AI spawns a helper bot.",
      "🔔 NEW: Notification inbox — fewer popups, everything collected under the bell (9+ badge).",
      "ℹ️ NEW: About Us & Contact Us in Settings.",
      "🐛 Fixed: buttons glitching on hover; popups appearing underneath the texting app.",
    ]},
    { v: "v5.0 — Crime & Polish", items: [
      "🦹 NEW: Crime tab — phishing scam texting, plus 7 quick-job crimes.",
      "📱 NEW: AI Scam Sim — chat up fictional victims with personalities & a hidden trust meter.",
      "🚔 NEW: Prison system — get caught and you're benched (with a bail option).",
      "🌡️ NEW: Heat meter — crimes raise it, time cools it, launder to dump it fast.",
      "🎨 Cleaner UI: tabs consolidated into Shop / Careers / Crime / Socials / Profile / Prestige.",
      "📱 NEW: Socials tab — with Sorko, your unhinged #1 superfan. 🦈",
      "⚙️ Expanded Settings: AI key, Sorko Mode, and more toggles.",
      "⚡ Faster careers, less grind (cheaper promotions, faster XP).",
      "🌙 Fixed dark-mode invisible thought text.",
      "🪪 Redesigned login screen with a proper disclaimer.",
    ]},
    { v: "Earlier", items: [
      "v4: First-launch tutorial, 12 new choice events, detailed pixel rooms (cat, clock, props).",
      "v3: Assets (lifestyle/investments/staff), dark mode, economy rebalance.",
      "v2: Manual actions, Apple-style UI, pixel-art rooms.",
    ]},
  ];
  // Social links. NOTE: GitHub + itch are live; replace the TikTok and Discord
  // URLs below with your real ones (the labels are already what you asked for).
  const SOCIALS = [
    { id: "tiktok",  icon: "🎵", name: "TikTok",  label: "Wifi Billionaire Game",     url: "https://www.tiktok.com/@wifi.billionaire.game" },
    { id: "discord", icon: "💬", name: "Discord", label: "Join Our Discord",          url: "https://discord.gg/uJ9BQ8DXcw" },
    { id: "github",  icon: "🐙", name: "GitHub",  label: "Wifi Billionaire on GitHub", url: "https://github.com/connection-games/WifiBillionaire" },
    { id: "itch",    icon: "🎮", name: "itch.io", label: "Wifi Billionaire on itch.io", url: "https://wifi-billionare.itch.io/wifi-billionaire" },
  ];
  // CrazyGames forbids cross-promotion to other game platforms (itch.io, GitHub).
  // The CrazyGames build sets window.IS_CRAZYGAMES — there we drop those links and
  // keep only first-party social media (TikTok, Discord), which CG allows.
  const onCrazy = () => !!window.IS_CRAZYGAMES;
  const socialsFor = () => onCrazy() ? SOCIALS.filter(s => s.id !== "github" && s.id !== "itch") : SOCIALS;
  function settingsBody() {
    if (settingsTab === "about") {
      return `
        <div class="about-card">
          <h3>📖 About Us</h3>
          <p>This game is an open-source project built with the help of AI. Our goal is simple: to create an incredibly entertaining game that anyone can play, enjoy, and contribute to. The source code is publicly available, meaning any developer, designer, or enthusiast can read it, suggest changes, or build on top of it.</p>
          <p>We believe great games should be accessible to everyone — not locked behind paywalls or closed systems.</p>
        </div>
        <div class="about-card">
          <h3>🌐 Follow Us</h3>
          <p>Updates, behind-the-scenes and giveaways — come hang out:</p>
          <div class="social-row">
            ${socialsFor().map(s => `<a class="social-pill" href="${s.url}" target="_blank" rel="noopener"><span class="social-ico">${s.icon}</span><span class="social-meta"><b>${s.name}</b><small>${WB.t(s.label)}</small></span></a>`).join("")}
          </div>
        </div>
        <div class="about-card">
          <h3>💌 Contact &amp; Support</h3>
          <p>Have a tip, a bug, or need a hand? Reach the dev directly:</p>
          <div class="contact-row">
            <a class="contact-pill" href="mailto:cntngames96@gmail.com" target="_blank" rel="noopener">📧 cntngames96@gmail.com</a>
            ${onCrazy() ? "" : `<a class="contact-pill" href="https://github.com/connection-games/WifiBillionaire/issues" target="_blank" rel="noopener">🐙 GitHub — report ideas &amp; bugs</a>`}
          </div>
          <button class="btn primary wide" id="support-btn" style="margin-top:10px">🆘 ${WB.t("Message the developer")}</button>
        </div>`;
    }
    if (settingsTab === "updates") {
      return `<div class="upd-list">${UPDATES.map(u =>
        `<div class="upd-block"><div class="upd-ver">${u.v}</div>${u.items.map(i => `<div class="upd-item">${i}</div>`).join("")}</div>`).join("")}</div>`;
    }
    if (settingsTab === "ai") {
      const hasKey = WB.aiEnabled();
      return `<p class="muted">The Scam Sim victims can be powered by OpenAI. Your key is stored only on this device.</p>
        <label class="set-label">OpenAI API Key</label>
        <input class="set-input" id="ai-key" type="password" placeholder="sk-..." value="${(localStorage.getItem('wb_openai_key')||'')}">
        <label class="set-label">Model</label>
        <input class="set-input" id="ai-model" type="text" placeholder="gpt-4o-mini" value="${(localStorage.getItem('wb_openai_model')||WB.SECRETS.openaiModel)}">
        <div class="set-status">${hasKey ? "🟢 AI victims active" : "⚪ No key — using offline scripted victims"}</div>
        <div class="settings-row"><button class="btn" id="ai-save">Save Key</button><button class="btn subtle" id="ai-clear">Clear</button></div>`;
    }
    if (settingsTab === "data") {
      return `<div class="settings-row"><button class="btn" id="set-export">Export Save</button><button class="btn" id="set-import">Import Save</button></div>
        <textarea id="save-blob" placeholder="Save data appears here / paste here to import"></textarea>
        <button class="btn danger wide" id="set-reset">Hard Reset (delete everything)</button>`;
    }
    // general
    const curLang = WB.I18N.lang();
    const langSec = `<label class="set-label">${WB.t("🌍 Language")}</label>
      <select class="set-input" id="lang-sel">
        <option value="en" ${curLang === "en" ? "selected" : ""}>🇬🇧 English</option>
        <option value="sv" ${curLang === "sv" ? "selected" : ""}>🇸🇪 Svenska (SEK)</option>
        <option value="ru" ${curLang === "ru" ? "selected" : ""}>🇷🇺 Русский</option>
        <option value="de" ${curLang === "de" ? "selected" : ""}>🇩🇪 Deutsch</option>
        <option value="fr" ${curLang === "fr" ? "selected" : ""}>🇫🇷 Français</option>
        <option value="es" ${curLang === "es" ? "selected" : ""}>🇪🇸 Español</option>
        <option value="pt" ${curLang === "pt" ? "selected" : ""}>🇵🇹 Português</option>
        <option value="it" ${curLang === "it" ? "selected" : ""}>🇮🇹 Italiano</option>
      </select>
      <div class="muted" style="text-align:left;margin:6px 2px 14px">${WB.t("Choose your language. Swedish switches money to SEK.")}</div>`;
    let curMode = "casual";
    try { curMode = localStorage.getItem("wb_mode") === "speedrun" ? "speedrun" : "casual"; } catch (e) {}
    const modeSec = `<label class="set-label">${WB.t("🎮 Game Mode")}</label>
      <select class="set-input" id="mode-sel">
        <option value="casual" ${curMode === "casual" ? "selected" : ""}>🌱 ${WB.t("Casual — relaxed pacing")}</option>
        <option value="speedrun" ${curMode === "speedrun" ? "selected" : ""}>⚡ ${WB.t("Speedrun — everything ×3 faster")}</option>
      </select>
      <div class="muted" style="text-align:left;margin:6px 2px 14px">${WB.t("Applies instantly — switch any time.")}</div>`;
    const toggles = [
      ["sorko", "🦈 Sorko Mode", "Your #1 superfan haunts the Socials feed. Essential."],
      ["confetti", "🎉 Confetti", "Celebrate milestones with falling confetti."],
      ["bubbles", "💭 Thought Bubbles", "The character's running inner monologue."],
      ["showHeat", "🌡️ Show Heat Meter", "Display the crime heat indicator in the HUD."],
      ["autosaveToast", "💾 Autosave Notices", "Pop a tiny toast every time the game saves."],
    ];
    const soundRow = `<div class="toggle-row"><div><b>${WB.t("🔊 Sound Effects")}</b><div class="muted">${WB.t("Clicks, cha-chings, sirens and big wins.")}</div></div>
      <button class="switch ${WB.SOUND && !WB.SOUND.isMuted() ? "on" : ""}" data-sound><span></span></button></div>`;
    return langSec + modeSec + `<div class="toggle-list">${toggles.map(([k, label, desc]) =>
      `<div class="toggle-row"><div><b>${WB.t(label)}</b><div class="muted">${WB.t(desc)}</div></div>
        <button class="switch ${getSetting(k) ? "on" : ""}" data-toggle="${k}"><span></span></button></div>`).join("")}${soundRow}</div>`;
  }
  // first launch after an auto-update: greet the player with what changed
  function showWhatsNew() {
    const u = UPDATES[0];
    openModal(`
      <div class="ev-icon">🎁</div>
      <h2>${WB.t("What's New")}</h2>
      <p class="muted">${WB.t("The game updated itself while you weren't looking. Here's the loot:")}</p>
      <div class="upd-list whatsnew"><div class="upd-block"><div class="upd-ver">${u.v}</div>${u.items.map(i => `<div class="upd-item">${i}</div>`).join("")}</div></div>
      <button class="btn primary wide" id="wn-done">${WB.t("Let's go!")} 🚀</button>`);
    $("wn-done").onclick = closeModal;
  }

  // ---------- ⭐ "Do you like the game?" ----------
  const REPO_URL = "https://github.com/connection-games/WifiBillionaire";
  function openExternal(url) { try { window.open(url, "_blank", "noopener"); } catch (e) {} }
  function showLikePrompt() {
    openModal(`
      <div class="ev-icon">⭐</div>
      <h2>${WB.t("Enjoying WiFi Billionaire?")}</h2>
      <p class="muted">${WB.t("Your honest take genuinely helps.")}</p>
      <div class="ev-choices">
        <button class="btn choice" id="like-yes"><b>😄 ${WB.t("Yes, love it!")}</b><small>${onCrazy() ? WB.t("Rate us right here on CrazyGames!") : WB.t("Give it a ⭐ on GitHub")}</small></button>
        <button class="btn choice" id="like-no"><b>😐 ${WB.t("Not really")}</b><small>${WB.t("Tell us what to fix")}</small></button>
      </div>`);
    $("like-yes").onclick = () => { closeModal(); if (!onCrazy()) openExternal(REPO_URL); toast(WB.t("⭐ Thank you! It means the world."), "good"); };
    $("like-no").onclick = () => { closeModal(); showSurvey(); };
  }
  function showSurvey() {
    const opts = ["Too grindy", "Confusing UI", "Not enough content", "Bugs / glitches", "Gets boring", "Performance / lag"];
    openModal(`
      <div class="ev-icon">📝</div>
      <h2>${WB.t("What's not clicking?")}</h2>
      <p class="muted">${WB.t("Pick anything that applies — it's anonymous.")}</p>
      <div class="survey-opts">${opts.map(o => `<label class="survey-opt"><input type="checkbox" value="${o}"> ${WB.t(o)}</label>`).join("")}</div>
      <textarea id="survey-text" class="set-input" placeholder="${WB.t("Anything else? (optional)")}" style="min-height:64px"></textarea>
      <button class="btn primary wide" id="survey-send" style="margin-top:10px">${WB.t("Send feedback")}</button>`);
    $("survey-send").onclick = () => {
      const picked = [...document.querySelectorAll(".survey-opt input:checked")].map(c => c.value);
      const text = ($("survey-text").value || "").trim();
      try { localStorage.setItem("wb_feedback", JSON.stringify({ picked, text, ts: Date.now() })); } catch (e) {}
      if (WB.CLOUD && WB.CLOUD.submitFeedback) WB.CLOUD.submitFeedback(picked, text);
      closeModal();
      toast(WB.t("🙏 Thank you — we read every one."), "good");
    };
  }
  // "Follow us for a prize" — shows once, rewards tapping any social link.
  function showSocialPrize() {
    const reward = Math.max(5000, Math.floor(WB.GAME.incomePerSec() * 60 * 30)); // ~30 min of income
    openModal(`
      <div class="ev-icon">🎁</div>
      <h2>${WB.t("Follow us for a prize!")}</h2>
      <p>${WB.t("Tap any of our socials and claim a fat")} <b>${WB.fmt(reward, true)}</b> ${WB.t("bonus — on the house.")}</p>
      <div class="social-row">${socialsFor().map(s => `<a class="social-pill" href="${s.url}" target="_blank" rel="noopener" data-social="1"><span class="social-ico">${s.icon}</span><span class="social-meta"><b>${s.name}</b><small>${WB.t(s.label)}</small></span></a>`).join("")}</div>
      <button class="btn subtle wide" id="social-skip" style="margin-top:10px">${WB.t("Maybe later")}</button>`);
    let claimed = false;
    const claim = () => {
      if (claimed) return; claimed = true;
      try { localStorage.setItem("wb_social_claimed", "1"); } catch (e) {}
      WB.GAME.earn(reward); confetti();
      toast(`🎁 ${WB.t("Thanks for the follow! Here's")} ${WB.fmt(reward, true)}!`, "good");
      setTimeout(closeModal, 500);
    };
    $("modal-content").querySelectorAll("[data-social]").forEach(a => a.addEventListener("click", claim));
    $("social-skip").onclick = closeModal;
  }
  function maybeSocialPrize() {
    let done = false; try { done = !!localStorage.getItem("wb_social_claimed"); } catch (e) {}
    if (done || uiBusy() || (WB.CRIME && WB.CRIME.inPrison())) return;
    if (!st || st.stats.playTimeSec < 150) return;
    showSocialPrize();
  }
  // ask once, after the player has settled in (not during tutorial/onboarding)
  function maybeAskLike() {
    let asked = false;
    try { asked = !!localStorage.getItem("wb_liked_asked"); } catch (e) {}
    if (asked || tutStep >= 0 || uiBusy()) return;
    if (st.stats.playTimeSec < 180 || st.allTimeEarnings < 5000) return;
    try { localStorage.setItem("wb_liked_asked", "1"); } catch (e) {}
    showLikePrompt();
  }

  function showSettings() {
    const tabs = { general: "⚙️ General", ai: "🤖 AI", data: "💾 Data", updates: "✨ Updates", about: "ℹ️ About" };
    openModal(`<h2>Settings</h2>
      <div class="set-tabs">${Object.entries(tabs).map(([k, l]) => `<button class="set-tab ${settingsTab === k ? "active" : ""}" data-settab="${k}">${WB.t(l)}</button>`).join("")}</div>
      <div id="set-body">${settingsBody()}</div>
      <button class="btn primary wide" id="set-close" style="margin-top:14px">Close</button>`);
    const rebind = () => { $("set-body").innerHTML = settingsBody(); bindBody(); };
    function bindBody() {
      if ($("lang-sel")) $("lang-sel").onchange = () => { WB.I18N.setLang($("lang-sel").value); location.reload(); };
      if ($("mode-sel")) $("mode-sel").onchange = () => {
        try { localStorage.setItem("wb_mode", $("mode-sel").value); } catch (e) {}
        toast($("mode-sel").value === "speedrun" ? "⚡ Speedrun mode ON — everything runs ~3× faster." : "🌱 Casual mode — back to a human pace.", "good");
      };
      $("set-body").querySelectorAll("[data-toggle]").forEach(b => b.onclick = () => {
        const k = b.dataset.toggle; setSetting(k, !getSetting(k)); b.classList.toggle("on"); renderTab(true);
      });
      if ($("ai-save")) $("ai-save").onclick = () => {
        localStorage.setItem("wb_openai_key", $("ai-key").value.trim());
        localStorage.setItem("wb_openai_model", $("ai-model").value.trim() || WB.SECRETS.openaiModel);
        toast("🤖 AI key saved on this device.", "good"); rebind();
      };
      if ($("ai-clear")) $("ai-clear").onclick = () => { localStorage.removeItem("wb_openai_key"); $("ai-key").value = ""; toast("Key cleared.", "good"); rebind(); };
      if ($("set-export")) $("set-export").onclick = () => { $("save-blob").value = WB.GAME.exportSave(); $("save-blob").select(); };
      if ($("set-import")) $("set-import").onclick = () => { if (!WB.GAME.importSave($("save-blob").value)) alert("Invalid save data."); };
      if ($("set-reset")) $("set-reset").onclick = () => { if (confirm("Delete EVERYTHING including prestige? No takebacks.")) WB.GAME.hardReset(); };
      if ($("support-btn")) $("support-btn").onclick = openSupportDialog;
      $("set-body").querySelectorAll("[data-sound]").forEach(b => b.onclick = () => {
        if (!WB.SOUND) return;
        const muted = WB.SOUND.toggle();
        b.classList.toggle("on", !muted);
        if (!muted) WB.SOUND.play("coin");
      });
    }
    $("modal-content").querySelectorAll("[data-settab]").forEach(b => b.onclick = () => {
      if (b.dataset.settab === "general") bumpAdminTap(); // 5 taps → admin gate
      settingsTab = b.dataset.settab;
      $("modal-content").querySelectorAll("[data-settab]").forEach(x => x.classList.toggle("active", x === b));
      rebind();
    });
    bindBody();
    $("set-close").onclick = closeModal;
  }
  // Direct line to the dev — lands in the cloud feedback the admin can read.
  function openSupportDialog() {
    const ov = document.createElement("div");
    ov.className = "amt-dialog";
    ov.innerHTML = `<div class="amt-card">
      <div class="amt-ico">🆘</div>
      <h3>${WB.t("Message the developer")}</h3>
      <p class="muted">${WB.t("Bug, idea, or just saying hi — it goes straight to the dev.")}</p>
      <textarea id="support-text" class="set-input" placeholder="${WB.t("Type your message…")}" style="min-height:90px"></textarea>
      <div class="amt-row"><button class="btn subtle" id="support-cancel">${WB.t("Cancel")}</button><button class="btn primary" id="support-send">📨 ${WB.t("Send")}</button></div>
    </div>`;
    $("modal-content").appendChild(ov);
    const close = () => ov.remove();
    ov.querySelector("#support-cancel").onclick = close;
    ov.querySelector("#support-send").onclick = () => {
      const t = (ov.querySelector("#support-text").value || "").trim();
      if (!t) { toast(WB.t("Write a message first."), "bad"); return; }
      if (WB.CLOUD && WB.CLOUD.enabled && WB.CLOUD.submitFeedback) WB.CLOUD.submitFeedback(["support", "from:" + playerName()], t);
      else { toast("☁️ " + WB.t("You're offline — can't reach the dev right now."), "bad"); return; }
      toast("📨 " + WB.t("Sent to the dev — thank you!"), "good");
      close();
    };
    setTimeout(() => { const i = $("support-text"); if (i) i.focus(); }, 50);
  }

  // ============================================================ Admin (hidden)
  // Tap the "General" settings tab 5× → password → broadcast events to all players.
  let adminTaps = 0, adminTapAt = 0, lastBroadcastId = 0;
  // The admin password is never stored in plaintext (this file is publicly
  // readable on GitHub Pages / CrazyGames). We keep only a one-way SHA-256
  // hash and compare against the hash of what's typed. Real broadcast security
  // is enforced server-side by the Firestore rules — see CONTRIBUTING.md.
  const ADMIN_PW_HASH = "1a71cebced4ef24443af896ef6077624bb963501057102afd5a0e70f4f57e914";
  async function sha256Hex(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  function bumpAdminTap() {
    const t = Date.now();
    if (t - adminTapAt > 2500) adminTaps = 0;
    adminTapAt = t; adminTaps++;
    if (adminTaps >= 5) { adminTaps = 0; setTimeout(openAdminGate, 120); }
  }
  function openAdminGate() {
    // Custom modal instead of window.prompt(): Electron (the desktop app) does
    // not support prompt(), so the native dialog never appeared there.
    openModal(`
      <div class="ev-icon">🔒</div>
      <h2>Admin access</h2>
      <p class="muted">Enter the admin password.</p>
      <input class="set-input" id="admin-pw" type="password" placeholder="Password" autocomplete="off" style="width:100%;margin:6px 0 14px">
      <div style="display:flex;gap:8px;justify-content:center">
        <button class="btn" id="admin-cancel">Cancel</button>
        <button class="btn primary" id="admin-go">Unlock</button>
      </div>`);
    const input = $("admin-pw");
    const submit = async () => {
      let ok = false;
      try { ok = (await sha256Hex(input ? input.value : "")) === ADMIN_PW_HASH; } catch (e) { ok = false; }
      if (ok) { closeModal(); showAdminPanel(); }
      else toast("⛔ Wrong password.", "bad");
    };
    if (input) { input.focus(); input.onkeydown = (e) => { if (e.key === "Enter") submit(); }; }
    $("admin-cancel").onclick = closeModal;
    $("admin-go").onclick = submit;
  }
  function broadcastBoost(mult, sec, label) {
    if (!WB.CLOUD || !WB.CLOUD.enabled) { toast("☁️ Cloud offline — can't broadcast.", "bad"); return; }
    const payload = { kind: "boost", mult, durationSec: sec, msg: label || `×${mult} income for everyone!`, id: Date.now() };
    applyBroadcast(payload);            // apply to me instantly (dedupes the cloud echo)
    WB.CLOUD.pushBroadcast(payload);    // … and send it to everyone else
    toast(`📡 Broadcast sent: ${label || mult + "× · " + sec + "s"}`, "good");
  }
  function showAdminPanel() {
    openModal(`
      <div class="admin-wrap">
        <div class="admin-head"><span class="admin-badge">ADMIN</span><h2 style="margin:0">Control Room</h2></div>
        <p class="muted" style="margin-bottom:14px">Broadcasts hit every online player in real time.</p>
        <div class="admin-sec">🌍 Global income boosts</div>
        <div class="admin-grid">
          <button class="btn admin-btn" data-bc="2,60">2× · 1 min</button>
          <button class="btn admin-btn" data-bc="3,120">3× · 2 min</button>
          <button class="btn admin-btn" data-bc="5,30">5× · 30s</button>
          <button class="btn admin-btn hot" data-bc="10,60">🔥 10× · 1 min</button>
        </div>
        <div class="admin-sec">🎛️ Custom boost</div>
        <div class="admin-row">
          <input id="adm-mult" type="number" min="1" step="0.5" value="2"> <span class="admin-x">×</span>
          <input id="adm-sec" type="number" min="5" step="5" value="60"> <span class="admin-x">s</span>
          <button class="btn primary" id="adm-custom">Broadcast</button>
        </div>
        <div class="admin-sec">📢 Announcement to all players</div>
        <div class="admin-row">
          <input id="adm-msg" type="text" maxlength="120" placeholder="A message to everyone…" style="flex:1">
          <button class="btn primary" id="adm-announce">Send</button>
        </div>
        <div class="admin-sec">🛠️ Local tools (you only)</div>
        <div class="admin-grid">
          <button class="btn admin-btn" data-loc="m6">+ $1M</button>
          <button class="btn admin-btn" data-loc="m9">+ $1B</button>
          <button class="btn admin-btn" data-loc="era">+ Era</button>
          <button class="btn admin-btn" data-loc="heat">Clear heat</button>
          <button class="btn admin-btn" data-loc="free">Free jail</button>
          <button class="btn admin-btn" data-loc="event">Spawn event</button>
          <button class="btn admin-btn" data-loc="legacy">+10 Legacy</button>
          <button class="btn admin-btn" data-loc="heist">🎬 Heist win</button>
          <button class="btn admin-btn" data-loc="bust">💥 Heist bust</button>
        </div>
        <div class="admin-sec">📨 Players & feedback</div>
        <div class="admin-row">
          <button class="btn" id="adm-feedback">📨 Feedback &amp; support</button>
          <button class="btn" id="adm-online">🟢 Online players</button>
        </div>
        <div id="adm-view" class="admin-view"></div>
        <button class="btn primary wide" id="adm-close" style="margin-top:16px">Close</button>
      </div>`);
    $("modal-content").querySelectorAll("[data-bc]").forEach(b => b.onclick = () => {
      const [m, s] = b.dataset.bc.split(",").map(Number);
      broadcastBoost(m, s, `${m}× income · ${s >= 60 ? s / 60 + " min" : s + "s"}`);
    });
    $("adm-custom").onclick = () => broadcastBoost(Math.max(1, +$("adm-mult").value || 2), Math.max(5, +$("adm-sec").value || 60));
    $("adm-announce").onclick = () => {
      const m = ($("adm-msg").value || "").trim(); if (!m) return;
      if (WB.CLOUD && WB.CLOUD.enabled) {
        const payload = { kind: "msg", msg: m, id: Date.now() };
        applyBroadcast(payload); WB.CLOUD.pushBroadcast(payload);
        toast("📢 Announcement sent.", "good"); $("adm-msg").value = "";
      } else toast("☁️ Cloud offline.", "bad");
    };
    $("modal-content").querySelectorAll("[data-loc]").forEach(b => b.onclick = () => adminLocal(b.dataset.loc));
    $("adm-feedback").onclick = adminLoadFeedback;
    $("adm-online").onclick = adminLoadOnline;
    $("adm-close").onclick = closeModal;
  }
  function adminLoadOnline() {
    const v = $("adm-view"); if (!v) return;
    v.innerHTML = `<div class="muted">${WB.t("Loading…")}</div>`;
    if (!WB.CLOUD || !WB.CLOUD.fetchOnlinePlayers) { v.innerHTML = `<div class="muted">☁️ Cloud offline.</div>`; return; }
    WB.CLOUD.fetchOnlinePlayers(60).then(list => {
      list = list || [];
      v.innerHTML = `<div class="admin-view-head">🟢 ${list.length + 1} ${WB.t("online")} (${WB.t("incl. you")})</div>` +
        list.map(p => `<div class="admin-view-row"><b>${esc(p.name || "Anon")}</b></div>`).join("") +
        (list.length ? "" : `<div class="muted">${WB.t("Just you right now.")}</div>`);
    });
  }
  function adminLoadFeedback() {
    const v = $("adm-view"); if (!v) return;
    v.innerHTML = `<div class="muted">${WB.t("Loading…")}</div>`;
    if (!WB.CLOUD || !WB.CLOUD.fetchFeedback) { v.innerHTML = `<div class="muted">☁️ Cloud offline.</div>`; return; }
    WB.CLOUD.fetchFeedback(40).then(list => {
      list = list || [];
      v.innerHTML = `<div class="admin-view-head">📨 ${list.length} ${WB.t("recent")}</div>` + (list.length
        ? list.map(f => {
            const who = (f.reasons || []).find(r => /^from:/.test(r));
            const name = who ? who.slice(5) : "Anon";
            const support = (f.reasons || []).includes("support");
            return `<div class="admin-view-row fb"><div><b>${support ? "🆘 " : "💬 "}${esc(name)}</b><div class="fb-text">${esc(f.text || "(no text)")}</div></div>
              ${f.uid ? `<button class="btn small adm-reply" data-uid="${esc(f.uid)}" data-name="${esc(name)}">↩︎</button>` : ""}</div>`;
          }).join("")
        : `<div class="muted">${WB.t("No feedback yet.")}</div>`);
      v.querySelectorAll(".adm-reply").forEach(b => b.onclick = () => adminReply(b.dataset.uid, b.dataset.name));
    });
  }
  function adminReply(uid, name) {
    const text = prompt(`Reply to ${name}:`);
    if (text == null || !text.trim()) return;
    if (WB.CLOUD && WB.CLOUD.sendAdminReply) WB.CLOUD.sendAdminReply(uid, text.trim(), playerName());
    toast(`↩︎ ${WB.t("Reply sent to")} ${esc(name)}`, "good");
  }
  function adminLocal(k) {
    const G = WB.GAME, s = st;
    if (k === "m6") { G.earn(1e6); toast("💰 +$1M", "good"); }
    else if (k === "m9") { G.earn(1e9); toast("💰 +$1B", "good"); }
    else if (k === "era") { s.era = Math.min(WB.DATA.ERAS.length - 1, s.era + 1); toast("⏩ Era +1", "good"); }
    else if (k === "heat") { if (WB.CRIME) WB.CRIME.addHeat(-100); toast("❄️ Heat cleared", "good"); }
    else if (k === "free") { if (WB.CRIME) { WB.CRIME.crimeState().prisonUntil = 0; if (WB.UI && WB.UI.hidePrison) WB.UI.hidePrison(); } toast("🔓 Freed", "good"); }
    else if (k === "event") { const evs = (WB.EVENTS.MAJOR || []).filter(e => !e.cond || e.cond(st)); if (evs.length) { closeModal(); setTimeout(() => showEventModal(WB.pick(evs)), 200); return; } }
    else if (k === "legacy") { s.prestige.legacy += 10; toast("♻️ +10 Legacy", "good"); }
    else if (k === "heist") { closeModal(); if (WB.ROOM && WB.ROOM.play) WB.ROOM.play("heistDuo"); return; }
    else if (k === "bust") { closeModal(); if (WB.ROOM && WB.ROOM.play) WB.ROOM.play("heistBustDuo"); return; }
    renderHud(); renderTab(true);
  }
  function applyBroadcast(data) {
    if (!data || !data.id || data.id === lastBroadcastId) return;
    if (Date.now() - data.id > 120000) { lastBroadcastId = data.id; return; } // ignore stale ones on reconnect
    lastBroadcastId = data.id;
    if (data.kind === "boost") {
      st.boost = { mult: data.mult, until: Date.now() + (data.durationSec || 60) * 1000 };
      toast(`🌍 GLOBAL EVENT: ${data.msg || ("×" + data.mult + " income!")}`, "era");
      confetti(); renderHud();
    } else if (data.kind === "msg") {
      toast(`📢 ${data.msg}`, "era");
    } else if (data.kind === "event" && data.eventId) {
      const ev = (WB.EVENTS.MAJOR || []).find(e => e.id === data.eventId);
      if (ev && !uiBusy()) showEventModal(ev);
    }
  }

  // ============================================================ Tutorial (spotlight redesign)
  const TUT_STEPS = [
    { target: "room-wrap",   icon: "📶", title: "Meet your entrepreneur", text: "He lives in his parents' bedroom and dreams in dollar signs. You don't control him — you manage him." },
    { target: "hustle-btn",  icon: "💪", title: "The Hustle button", text: "Smash it for instant cash. Clicks get stronger as your income grows." },
    { target: "activities",  icon: "🎯", title: "Set his focus", text: "Tap to pick what he works on — code, content, crypto, crime and more. He earns and gains XP in whatever you choose. Sleep is not optional." },
    { target: "actions-bar", icon: "⚡", title: "Run actions", text: "Freelance gigs, code sprints, videos — start one, collect the results when it glows." },
    { target: "side",        icon: "🛒", title: "Spend it wisely", text: "Gear, homes, careers, crime. Everything you buy shows up in the room." },
    { target: "goal-banner", icon: "🎯", title: "Follow the goal", text: "The goal bar always shows your next milestone. Now go — from this bedroom to a billion. 📈" },
  ];
  let tutStep = -1;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function showTutStep(i) {
    tutStep = i;
    if (i >= TUT_STEPS.length) return endTutorial(true);
    const s2 = TUT_STEPS[i];
    let spot = $("tut-spot"), card = $("tut-box");
    if (!spot) { spot = document.createElement("div"); spot.id = "tut-spot"; document.body.appendChild(spot); }
    if (!card) { card = document.createElement("div"); card.id = "tut-box"; document.body.appendChild(card); }
    const el = s2.target && $(s2.target);
    const r = el ? el.getBoundingClientRect()
      : { left: innerWidth / 2 - 60, top: innerHeight / 2 - 60, width: 120, height: 120 };

    // spotlight cutout glides to the target
    const pad = 7;
    spot.style.left = (r.left - pad) + "px";
    spot.style.top = (r.top - pad) + "px";
    spot.style.width = (r.width + pad * 2) + "px";
    spot.style.height = (r.height + pad * 2) + "px";

    card.innerHTML = `
      <div class="tut-beak"></div>
      <div class="tut-head"><span class="tut-ico">${s2.icon}</span><h3>${WB.t(s2.title)}</h3><span class="tut-step">${i + 1}/${TUT_STEPS.length}</span></div>
      <p>${WB.t(s2.text)}</p>
      <div class="tut-row">
        <button class="btn subtle" id="tut-skip">${WB.t("Skip")}</button>
        <span class="tut-dots">${TUT_STEPS.map((_, j) => `<i class="${j <= i ? "on" : ""}"></i>`).join("")}</span>
        <button class="btn primary" id="tut-next">${i === TUT_STEPS.length - 1 ? WB.t("Let's go!") : WB.t("Next")}</button>
      </div>`;

    // measure, then place on the side of the target with the most room
    const cw = card.offsetWidth, ch = card.offsetHeight, gap = 20;
    const vw = innerWidth, vh = innerHeight;
    const tcx = r.left + r.width / 2, tcy = r.top + r.height / 2;
    let dir, left, top;
    if (vh - (r.top + r.height) > ch + gap + 8) {            // below
      dir = "up"; top = r.top + r.height + gap; left = clamp(tcx - cw / 2, 12, vw - cw - 12);
    } else if (r.top > ch + gap + 8) {                        // above
      dir = "down"; top = r.top - ch - gap; left = clamp(tcx - cw / 2, 12, vw - cw - 12);
    } else if (vw - (r.left + r.width) > cw + gap) {          // right
      dir = "left"; left = r.left + r.width + gap; top = clamp(tcy - ch / 2, 12, vh - ch - 12);
    } else {                                                  // left
      dir = "right"; left = r.left - cw - gap; top = clamp(tcy - ch / 2, 12, vh - ch - 12);
    }
    card.dataset.dir = dir;
    card.style.left = left + "px";
    card.style.top = top + "px";

    // point the beak at the target, and make the card "shrink in" from that point
    const beak = card.querySelector(".tut-beak");
    if (dir === "up" || dir === "down") {
      const bx = clamp(tcx - left, 20, cw - 20);
      beak.style.left = (bx - 9) + "px"; beak.style.top = ""; beak.style.right = ""; beak.style.bottom = "";
      card.style.setProperty("--tox", bx + "px");
      card.style.setProperty("--toy", dir === "up" ? "0%" : "100%");
    } else {
      const by = clamp(tcy - top, 20, ch - 20);
      beak.style.top = (by - 9) + "px"; beak.style.left = ""; beak.style.right = ""; beak.style.bottom = "";
      card.style.setProperty("--toy", by + "px");
      card.style.setProperty("--tox", dir === "left" ? "0%" : "100%");
    }
    card.classList.remove("tutpop"); void card.offsetWidth; card.classList.add("tutpop");

    $("tut-next").onclick = () => showTutStep(i + 1);
    $("tut-skip").onclick = () => endTutorial(false);
  }
  function endTutorial(completed) {
    ["tut-spot", "tut-box"].forEach(id => { const e = $(id); if (e) e.remove(); });
    tutStep = -1;
    st.tutorialDone = true;
    if (completed && !st.tutorialRewarded) {        // reward finishing the tutorial
      st.tutorialRewarded = 1;
      WB.GAME.earn(1000);
      setTimeout(() => { toast("🎓 Tutorial complete — here's $1,000 to get you started!", "goal"); confetti(); }, 300);
    }
    WB.GAME.save();
  }
  function maybeStartTutorial() {
    if (st.tutorialDone || st.stats.playTimeSec > 30) {
      st.tutorialDone = true;
      return;
    }
    setTimeout(() => showTutStep(0), 1200); // onboarding/splash already finished
  }

  // ============================================================ Onboarding (first launch)
  // Re-render the whole UI in a new language WITHOUT a page reload (the old
  // flow did location.reload(), which flashed the boot screen). The game sits
  // live behind the onboarding overlay, so we just retranslate + re-render it.
  function applyLanguageLive(lang) {
    try {
      WB.I18N.setLang(lang);
      document.querySelectorAll("[data-i18n]").forEach(el => { el.innerHTML = WB.I18N.t(el.getAttribute("data-i18n")); });
      renderTabBar(); renderHud(); renderTab(true);
      WB.I18N.translateDom(document.body);
    } catch (e) { /* worst case: language applies on next render */ }
  }
  function showOnboarding(onDone) {
    let lang = WB.I18N.lang();
    let theme = document.documentElement.getAttribute("data-theme") || "light";
    let name = "";
    const ov = document.createElement("div");
    ov.id = "onboard";
    document.body.appendChild(ov);

    const LOGO = `<div class="ob-logo logo-tile"><svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="108" height="108" rx="28" fill="#101a35"/>
        <path d="M28 56c9-9 20-13.5 32-13.5S83 47 92 56" stroke="#4dde80" stroke-width="8" stroke-linecap="round" fill="none"/>
        <path d="M38 68c6-6 13.5-9 22-9s16 3 22 9" stroke="#4dde80" stroke-width="8" stroke-linecap="round" fill="none"/>
        <circle cx="60" cy="86" r="11" fill="#ffc83d"/><text x="60" y="91" text-anchor="middle" font-size="15" font-weight="800" fill="#5a3804">$</text>
      </svg></div>`;
    function render(reveal) {
      ov.innerHTML = `
        <div class="onboard-card${reveal ? " ob-reveal" : ""}">
          ${LOGO}
          <h1 class="ob-title">${WB.t("Welcome to")} <span>WiFi Billionaire</span></h1>
          <p class="ob-tag">${WB.t("Let's set you up — you can change all of this later in Settings.")}</p>
          <label class="ob-label">👤 ${WB.t("Username")} <span class="ob-hint">— ${WB.t("how you'll show on the global leaderboard")}</span></label>
          <input id="ob-name" class="ob-input" maxlength="20" placeholder="${WB.t("e.g. RamenTycoon")}" autocomplete="off" spellcheck="false" value="${esc(name)}">
          <label class="ob-label">🌍 ${WB.t("Language")}</label>
          <div class="ob-choices ob-langs" id="ob-lang">
            <button class="ob-choice ${lang === "en" ? "active" : ""}" data-v="en">🇬🇧 English</button>
            <button class="ob-choice ${lang === "sv" ? "active" : ""}" data-v="sv">🇸🇪 Svenska</button>
            <button class="ob-choice ${lang === "ru" ? "active" : ""}" data-v="ru">🇷🇺 Русский</button>
            <button class="ob-choice ${lang === "de" ? "active" : ""}" data-v="de">🇩🇪 Deutsch</button>
            <button class="ob-choice ${lang === "fr" ? "active" : ""}" data-v="fr">🇫🇷 Français</button>
            <button class="ob-choice ${lang === "es" ? "active" : ""}" data-v="es">🇪🇸 Español</button>
            <button class="ob-choice ${lang === "pt" ? "active" : ""}" data-v="pt">🇵🇹 Português</button>
            <button class="ob-choice ${lang === "it" ? "active" : ""}" data-v="it">🇮🇹 Italiano</button>
          </div>
          <label class="ob-label">🎨 ${WB.t("Theme")}</label>
          <div class="ob-choices" id="ob-theme">
            <button class="ob-choice ${theme === "light" ? "active" : ""}" data-v="light">☀️ ${WB.t("Light")}</button>
            <button class="ob-choice ${theme === "dark" ? "active" : ""}" data-v="dark">🌙 ${WB.t("Dark")}</button>
          </div>
          <button class="btn primary wide ob-start" id="ob-start">${WB.t("Start the grind")} →</button>
          <div class="ob-foot">📶 ${WB.t("A satire game by Connection Games · for entertainment only")}</div>
        </div>`;
      bind();
    }
    function bind() {
      const nameEl = $("ob-name");
      nameEl.oninput = () => { name = nameEl.value; };
      nameEl.onkeydown = e => { if (e.key === "Enter") $("ob-start").click(); };
      $("ob-lang").onclick = e => {
        const b = e.target.closest(".ob-choice"); if (!b || b.dataset.v === lang) return;
        name = $("ob-name").value;
        lang = b.dataset.v;
        applyLanguageLive(lang);   // flip the game behind us, live — no reload
        render(false);             // re-render this card in the new language
        const n = $("ob-name"); if (n) { n.focus(); n.setSelectionRange(name.length, name.length); }
      };
      $("ob-theme").onclick = e => {
        const b = e.target.closest(".ob-choice"); if (!b) return;
        theme = b.dataset.v; applyTheme(theme); // live preview
        ov.querySelectorAll("#ob-theme .ob-choice").forEach(x => x.classList.toggle("active", x === b));
      };
      $("ob-start").onclick = () => {
        const finalName = (($("ob-name").value || "").trim() || "Player").slice(0, 20);
        try { localStorage.setItem("wb_username", finalName); localStorage.setItem("wb_onboarded", "1"); } catch (e) {}
        WB.I18N.setLang(lang); applyTheme(theme);
        if ($("profile-name")) $("profile-name").textContent = finalName;
        renderHud();
        ov.classList.remove("in"); ov.classList.add("out");
        setTimeout(() => ov.remove(), 520);
        if (onDone) setTimeout(onDone, 380);
      };
    }
    render(true);
    requestAnimationFrame(() => ov.classList.add("in"));
    setTimeout(() => { const n = $("ob-name"); if (n) n.focus(); }, 420);
  }

  // ============================================================ Confetti
  function confetti() {
    if (!getSetting("confetti")) return;
    const colors = ["#0071e3", "#34c759", "#ff9f0a", "#ff375f", "#bf5af2", "#5eead4"];
    for (let i = 0; i < 32; i++) {
      const el = document.createElement("div");
      el.className = "confetti-bit";
      el.style.left = Math.random() * 100 + "vw";
      el.style.background = WB.pick(colors);
      el.style.animationDuration = (2 + Math.random() * 1.8) + "s";
      el.style.animationDelay = (Math.random() * 0.4) + "s";
      el.style.transform = `rotate(${Math.random() * 360}deg)`;
      if (Math.random() > 0.5) el.style.borderRadius = "50%";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4500);
    }
  }

  // ============================================================ Theme
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    const btn = $("theme-btn");
    if (btn) btn.textContent = t === "dark" ? "☀️" : "🌙";
    try { localStorage.setItem("wb_theme", t); } catch (e) {}
  }
  function initTheme() {
    let t = null;
    try { t = localStorage.getItem("wb_theme"); } catch (e) {}
    if (!t) t = (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    applyTheme(t);
    $("theme-btn").addEventListener("click", () => {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  // ============================================================ Settings (toggles in localStorage)
  const DEFAULT_SETTINGS = { sorko: true, confetti: true, bubbles: true, autosaveToast: false, showHeat: true };
  function getSetting(k) {
    try { const v = localStorage.getItem("wb_set_" + k); if (v !== null) return v === "1"; } catch (e) {}
    return DEFAULT_SETTINGS[k];
  }
  function setSetting(k, v) { try { localStorage.setItem("wb_set_" + k, v ? "1" : "0"); } catch (e) {} }

  // ============================================================ Tabs (consolidated)
  const TABS = { shop: "🛒 Shop", careers: "💼 Careers", crime: "🦹 Crime", challenges: "🎯 Challenges", prestige: "♻️ Prestige" };
  const SUBTABS = { shop: ["gear", "assets"], profile: ["skills", "awards", "stats"], challenges: ["list", "leaderboard"] };
  const SUB_LABEL = { gear: "🛠️ Gear & Home", assets: "💎 Assets", skills: "🧠 Skills", awards: "🏆 Awards", stats: "📊 Stats", list: "🎯 Challenges", leaderboard: "🏆 Leaderboard" };
  const sub = { shop: "gear", profile: "skills", challenges: "list" };

  function subBar(tab) {
    if (!SUBTABS[tab]) return "";
    return `<div class="subtabs">${SUBTABS[tab].map(s =>
      `<button class="subtab-btn ${sub[tab] === s ? "active" : ""}" data-sub="${s}">${WB.t(SUB_LABEL[s])}</button>`).join("")}</div>`;
  }

  function tabAssets() {
    const A = WB.ASSETS, G = WB.GAME;
    const st2 = st.assets || { life: {}, invest: {}, staff: {} };
    let html = `<div class="section-title">🧑‍💼 Staff — salaries come out of income</div>`;
    A.STAFF.forEach(p => {
      const hired = !!st2.staff[p.id];
      const unlocked = G.incomePerSec() >= p.reqIncome || hired;
      html += `<div class="card"><div class="card-main"><b>${p.icon} ${p.name}</b> <span class="tag">${Math.round(p.salary * 100)}% salary</span><div class="muted">${p.desc}</div></div>`;
      if (hired) html += `<button class="btn small danger" data-act="fire" data-key="${p.id}">Let go</button>`;
      else if (unlocked) html += `<button class="btn buy" data-act="hire" data-key="${p.id}">Hire</button>`;
      else html += `<span class="tag">🔒 needs ${WB.fmt(p.reqIncome, true)}/s</span>`;
      html += `</div>`;
    });
    html += `<div class="section-title">📈 Investments — they move while you work</div>`;
    A.INVEST.forEach(def => {
      const h = st2.invest[def.id];
      const val = h ? h.value : 0;
      const pl = h ? val - h.invested : 0;
      html += `<div class="card col"><div class="card-main"><b>${def.icon} ${def.name}</b>
        <span class="tag">${WB.fmt(val, true)}</span>
        ${val >= 1 ? `<span class="tag" style="color:${pl >= 0 ? "var(--green)" : "var(--red)"}">${pl >= 0 ? "+" : ""}${WB.fmt(pl, true)}</span>` : ""}
        <div class="muted">${def.desc} Min buy-in: ${WB.fmt(def.min, true)}.</div></div>
        <div class="invest-row">
          <button class="btn small" data-act="invbuy10" data-key="${def.id}">Buy (10%)</button>
          <button class="btn small" data-act="invbuy25" data-key="${def.id}">Buy (25%)</button>
          <button class="btn small ${val >= 1 ? "" : "locked"}" data-act="invsell" data-key="${def.id}">Sell all</button>
        </div></div>`;
    });
    html += `<div class="section-title">🛍️ Lifestyle — permanent perks for living well</div>`;
    A.LIFESTYLE.forEach(l => {
      if (l.reqEra && st.era < l.reqEra && !st2.life[l.id]) return;
      const owned = !!st2.life[l.id];
      html += `<div class="card"><div class="card-main"><b>${l.icon} ${l.name}</b>${owned ? ` <span class="tag gold">OWNED</span>` : ""}<div class="muted">${WB.THOUGHTS.fill(l.desc)}</div></div>`;
      if (!owned) html += `<button class="btn buy ${st.money >= l.cost ? "" : "locked"}" data-act="lifestyle" data-key="${l.id}">Buy<span class="cost">${WB.fmt(l.cost, true)}</span></button>`;
      else if (A.usable && A.usable(l.id)) {
        const left = A.useLeft(l.id);
        if (left > 0) html += `<button class="btn use locked" disabled>⏳ ${Math.ceil(left / 1000)}s</button>`;
        else html += `<button class="btn use" data-act="useitem" data-key="${l.id}">${A.USE[l.id].label}</button>`;
      }
      html += `</div>`;
    });
    return html;
  }

  function tabStore() {
    const G = WB.GAME;
    let html = `<div class="section-title">🏠 Housing</div>`;
    const h = D.HOUSING[st.housing];
    const next = D.HOUSING[st.housing + 1];
    html += `<div class="card"><div class="card-main"><b>${WB.t(h.name)}</b> <span class="tag">x${h.mult} ${WB.t("income")}</span><div class="muted">${WB.t(h.desc)}</div></div>`;
    if (next) {
      const cost = G.housingCost();
      html += `<button class="btn buy ${st.money >= cost ? "" : "locked"}" data-act="housing">${WB.t("Move to")} ${WB.t(next.name)}<span class="cost">${WB.fmt(cost, true)}</span></button>`;
    } else html += `<span class="tag gold">MAX</span>`;
    html += `</div><div class="section-title">🛠️ Equipment</div>`;
    Object.entries(D.EQUIPMENT).forEach(([key, eq]) => {
      const t = st.equipment[key];
      const cur = t >= 0 ? eq.tiers[t].name : WB.t("None");
      const cost = G.equipCost(key);
      const effTxt = { income: `+${Math.round(eq.val * 100)}% ${WB.t("income/tier")}`, xp: `+${Math.round(eq.val * 100)}% ${WB.t("XP/tier")}`, energy: `-${Math.round(eq.val * 100)}% ${WB.t("energy drain/tier")}`, click: `+${Math.round(eq.val * 100)}% ${WB.t("click/tier")}` }[eq.effect];
      html += `<div class="card"><div class="card-main"><b>${eq.icon} ${WB.t(eq.label)}</b> <span class="tag">${cur}</span><div class="muted">${effTxt}</div></div>`;
      if (cost !== null) {
        html += `<button class="btn buy ${st.money >= cost ? "" : "locked"}" data-act="equip" data-key="${key}">${eq.tiers[t + 1].name}<span class="cost">${WB.fmt(cost, true)}</span></button>`;
      } else html += `<span class="tag gold">MAX</span>`;
      html += `</div>`;
    });
    return html;
  }

  function tabCareers() {
    const G = WB.GAME;
    let html = "";
    Object.entries(D.CAREERS).forEach(([key, c]) => {
      const t = st.careers[key];
      const cur = t >= 0 ? WB.t(c.tiers[t].name) : WB.t("Not started");
      const next = c.tiers[t + 1];
      html += `<div class="card col"><div class="career-head"><b>${c.icon} ${WB.t(c.name)}</b><span class="tag">${cur}${t >= 0 ? ` — ${WB.fmt(c.tiers[t].income, true)}/s` : ""}</span></div>`;
      html += `<div class="career-path muted">${c.tiers.map((x, i) => i <= t ? `<b class="done">${WB.t(x.name)}</b>` : WB.t(x.name)).join(" → ")}</div>`;
      if (next) {
        const chk = G.canAdvanceCareer(key);
        const cost = G.careerCost(key);
        html += `<button class="btn buy wide ${chk.ok ? "" : "locked"}" data-act="career" data-key="${key}">
          ${WB.t(t >= 0 ? "Advance to" : "Start as")} ${WB.t(next.name)}<span class="cost">${WB.fmt(cost, true)}</span></button>`;
        if (!chk.ok) html += `<div class="req muted">🔒 ${chk.reason}</div>`;
      } else html += `<span class="tag gold">PATH MASTERED</span>`;
      if (key === "crypto" && t >= 0) {
        html += `<div class="crypto-box"><span>Portfolio: <b>${WB.fmt(st.crypto.holdings, true)}</b></span>
          <button class="btn small" data-act="cryptobuy">Buy (25% cash)</button>
          <button class="btn small" data-act="cryptosell" ${st.crypto.holdings < 1 ? "disabled" : ""}>Sell All</button></div>`;
      }
      html += `</div>`;
    });
    return html;
  }

  function tabSkills() {
    const G = WB.GAME;
    let html = `<div class="section-title">🧠 Skills (character level ${G.charLevel()})</div>`;
    Object.entries(D.SKILLS).forEach(([key, sk]) => {
      const x = st.skills[key];
      const need = G.xpForLevel(x.level);
      const pct = Math.min(100, x.xp / need * 100);
      html += `<div class="skill-row"><span class="skill-name">${sk.icon} ${WB.t(sk.name)}</span><span class="skill-lvl">Lv ${x.level}</span>
        <div class="bar"><div class="fill skill" style="width:${pct}%"></div></div></div>`;
    });
    html += `<div class="section-title">🎭 Traits</div><div class="chips">`;
    html += st.traits.length ? st.traits.map(t => { const tr = D.TRAITS[t]; return `<span class="chip" title="${WB.t(tr.desc)}">${tr.icon} ${WB.t(tr.name)}</span>`; }).join("") : `<span class="muted">No traits yet. Live a little — personality develops from behavior.</span>`;
    html += `</div><div class="section-title">✨ Perks</div><div class="chips">`;
    html += st.perks.length ? st.perks.map(id => { const p = D.PERKS.find(x => x.id === id); return `<span class="chip" title="${WB.t(p.desc)}">${p.icon} ${WB.t(p.name)}</span>`; }).join("") : `<span class="muted">Perks unlock every 3 character levels.</span>`;
    html += `</div>`;
    return html;
  }

  function tabAchievements() {
    const list = WB.ACHIEVEMENTS.list;
    const got = list.filter(a => st.achievements[a.id]).length;
    let html = `<div class="section-title">🏆 ${got} / ${list.length} unlocked</div><div class="ach-grid">`;
    list.forEach(a => {
      const on = !!st.achievements[a.id];
      html += `<div class="ach ${on ? "on" : ""}" title="${a.desc}"><span class="ach-icon">${on ? a.icon : "🔒"}</span><span class="ach-name">${a.name}</span></div>`;
    });
    return html + `</div>`;
  }

  function tabStats() {
    const G = WB.GAME, r = st.res, x = st.stats;
    const rows = [
      ["Net worth", WB.fmt(G.netWorth(), true)],
      ["Income", WB.fmt(G.incomePerSec(), true) + "/s"],
      ["Lifetime earnings (this life)", WB.fmt(st.lifetimeEarnings, true)],
      ["All-time earnings", WB.fmt(st.allTimeEarnings, true)],
      ["Era", `${D.ERAS[st.era].year} — ${D.ERAS[st.era].name} (x${D.ERAS[st.era].mult})`],
      ["Play time", WB.fmtTime(x.playTimeSec)],
      ["Hustle clicks", x.totalClicks.toLocaleString()],
      ["💥 Lucky crits", (x.critClicks || 0).toLocaleString()],
      ["Projects shipped / flopped", `${x.projectsShipped} / ${x.projectsFailed}`],
      ["Viral hits", x.viralProjects],
      ["Followers", WB.fmt(x.followers)],
      ["Crypto P/L", `+${WB.fmt(x.cryptoProfit, true)} / -${WB.fmt(x.cryptoLosses, true)}`],
      ["Events experienced", x.eventsSeen],
      ["Mom interruptions", x.momInterruptions],
      ["Times slept", x.sleepSessions],
      ["Grass touched", x.grassTouched + " times"],
      ["Reputation", Math.floor(r.reputation)],
      ["Intelligence", Math.floor(r.intelligence)],
      ["Ego", "█".repeat(Math.max(1, Math.round(r.ego / 10))) + " (classified)"],
      ["Luck", "??? (it knows what it did)"],
      ["Prestige count", st.prestige.count],
      ["Legacy points", `${st.prestige.legacy - st.prestige.spent} available / ${st.prestige.legacy} total`],
    ];
    return `<div class="stats-list">${rows.map(([k, v]) => `<div class="stat-row"><span>${WB.t(k)}</span><b>${v}</b></div>`).join("")}</div>`;
  }

  function tabPrestige() {
    const G = WB.GAME;
    const nw = G.netWorth();
    const gain = G.legacyGain();
    const avail = st.prestige.legacy - st.prestige.spent;
    let html = `<div class="section-title">♻️ Rebirth</div>
      <div class="card col"><div>Reach <b>${WB.fmt(G.PRESTIGE_REQ, true)}</b> net worth, then restart life with permanent <b>Legacy Points</b>.</div>
      <div class="muted">Kept forever: achievements, era progress, legacy upgrades. Reset: money, skills, careers, housing, equipment, perks, traits.</div>
      <div class="prestige-status">Net worth: <b>${WB.fmt(nw, true)}</b> → Legacy on rebirth: <b class="gold-text">+${gain} LP</b></div>
      <button class="btn ${gain > 0 ? "danger-glow" : "locked"} wide" data-act="prestige">${gain > 0 ? `REBIRTH NOW (+${gain} LP)` : `Locked — reach ${WB.fmt(G.PRESTIGE_REQ, true)}`}</button></div>
      <div class="section-title">🏛️ Legacy Shop — ${avail} LP available</div>`;
    D.PRESTIGE_UPGRADES.forEach(u => {
      const lvl = st.prestige.upgrades[u.id] || 0;
      const cost = G.prestigeUpgradeCost(u.id);
      html += `<div class="card"><div class="card-main"><b>${u.icon} ${WB.t(u.name)}</b> <span class="tag">Lv ${lvl}/${u.max}</span><div class="muted">${WB.t(u.desc)}</div></div>`;
      if (cost !== null) html += `<button class="btn buy ${avail >= cost ? "" : "locked"}" data-act="pupgrade" data-key="${u.id}">Upgrade<span class="cost">${cost} LP</span></button>`;
      else html += `<span class="tag gold">MAX</span>`;
      html += `</div>`;
    });
    return html;
  }

  // ---------- Crime tab ----------
  const SORKO_FAN = [
    "SORKO 🦈 commented: 'GREATEST ENTREPRENEUR ALIVE. i have a tattoo of your logo now'",
    "SORKO 🦈 commented: 'i named my firstborn WiFi. my wife left. WORTH IT'",
    "SORKO 🦈 commented: 'watched your stream 47 times today. notification gang 🔔'",
    "SORKO 🦈 commented: 'you liked my comment in 2019 and i think about it daily'",
    "SORKO 🦈 commented: 'i would take a bullet for your side project'",
    "SORKO 🦈 commented: 'built a shrine. the WiFi router glows. it's beautiful'",
    "SORKO 🦈 commented: 'FIRST!!! also: visionary. legend. my roman empire.'",
    "SORKO 🦈 commented: 'bro replied K to my paragraph. best day of my life'",
    "SORKO 🦈 commented: 'i tell strangers we're best friends. we've never met. yet.'",
    "SORKO 🦈 commented: 'merch when?? i will sell a kidney. i have researched the price.'",
  ];
  const FAN_COMMENTS = [
    "📈 finally someone who gets it", "🔥🔥🔥", "this changed my life ngl",
    "ok but how do you stay motivated", "underrated genius", "commenting for the algorithm",
    "my mom thinks you're a scammer but i believe", "the GRIND is real", "ratio? no. respect.",
    "saw you in my dream. you said 'ship it'.", "🐐", "where do you get your energy drinks",
  ];

  function tabSocials() {
    const x = st.stats;
    const sorko = getSetting("sorko");
    let feed = [];
    const n = 7;
    // deterministic feed that rotates every 45s — random picks per render made
    // the DOM rebuild constantly and killed hover states (glitchy buttons)
    const seed = Math.floor(Date.now() / 45000);
    const HANDLES = ["devmike", "sara_codes", "nightowl99", "rampedup", "broke_no_more", "future_ceo", "pixelpete", "grindset_greg"];
    for (let i = 0; i < n; i++) {
      const r = (seed * 31 + i * 17 + st.stats.eventsSeen) % 97;
      if (sorko && (i === 0 || r % 5 < 2)) feed.push({ sorko: true, t: SORKO_FAN[(seed + st.stats.eventsSeen + i) % SORKO_FAN.length] });
      else feed.push({ sorko: false, t: "@" + HANDLES[(r + i) % HANDLES.length] + " — " + FAN_COMMENTS[(r * 7 + i * 3) % FAN_COMMENTS.length] });
    }
    let html = `<div class="section-title">📱 Your Socials</div>
      <div class="card"><div class="card-main"><b>📣 Followers</b> <span class="tag">${WB.fmt(x.followers)}</span>
      <div class="muted">Posts, videos and going viral grow this. More fans = more Creator income.</div></div>
      <button class="btn buy" data-act="dopost">Post Update</button></div>`;
    if (sorko) {
      html += `<div class="card sorko-card"><div class="card-main"><b>🦈 Sorko</b> <span class="tag gold">#1 SUPERFAN</span>
        <div class="muted">Your most dedicated fan. He has notifications on for everything. Everything.</div></div>
        <span class="tag">${WB.fmt(2_000_000 + (x.followers||0))} loyalty</span></div>`;
    }
    html += `<div class="section-title">💬 Recent Activity</div><div class="feed">`;
    feed.forEach(f => { html += `<div class="feed-item ${f.sorko ? "sorko" : ""}">${f.t}</div>`; });
    html += `</div>`;
    if (!sorko) html += `<p class="muted" style="margin-top:10px">Sorko Mode is off. Somewhere, a shark-avatar superfan weeps. (Toggle it in ⚙️ Settings.)</p>`;
    return html;
  }

  // ---------- Challenges tab ----------
  const TIER_ORDER = { bronze: 0, silver: 1, gold: 2, legendary: 3 };
  function tabChallenges() {
    const list = WB.DATA.CHALLENGES;
    const fmtN = n => n >= 1000 ? WB.fmt(n) : Math.floor(n);
    // compute state for each, then sort: tracked → ready → in-progress(% desc) → claimed
    const rows = list.map(c => {
      const raw = Math.max(0, c.prog(st));
      const claimed = !!st.challengesClaimed[c.id];
      const done = raw >= c.goal;
      const tracked = !!st.challengeTrack[c.id] && !claimed;
      const pct = Math.min(100, raw / c.goal * 100);
      const rank = tracked ? 0 : claimed ? 3 : done ? 1 : 2;
      return { c, raw, claimed, done, tracked, pct, rank };
    });
    rows.sort((a, b) => a.rank - b.rank || b.pct - a.pct || TIER_ORDER[a.c.tier] - TIER_ORDER[b.c.tier]);

    const claimedCount = rows.filter(r => r.claimed).length;
    const readyCount = rows.filter(r => r.done && !r.claimed).length;
    const tiers = ["bronze", "silver", "gold", "legendary"];
    const tierDots = tiers.map(t => {
      const all = rows.filter(r => r.c.tier === t);
      const got = all.filter(r => r.claimed).length;
      return `<span class="chal-tier-stat ${t}">${WB.t(t[0].toUpperCase() + t.slice(1))} ${got}/${all.length}</span>`;
    }).join("");

    let html = `
      <div class="chal-hero">
        <div class="chal-hero-top"><b>🎯 ${WB.t("Challenges")}</b><span class="chal-count">${claimedCount}/${list.length}</span></div>
        <div class="chal-hero-sub">${readyCount ? `🎁 ${readyCount} ${WB.t("ready to claim")} · ` : ""}${WB.t("Pin the ones you're chasing. Progress carries across every life.")}</div>
        <div class="chal-hero-bar"><div class="chal-hero-fill" style="width:${claimedCount / list.length * 100}%"></div></div>
        <div class="chal-tierbar">${tierDots}</div>
      </div>
      <div class="chal-grid">`;
    rows.forEach(({ c, raw, claimed, done, tracked, pct }) => {
      const state = claimed ? "claimed" : done ? "ready" : "inprog";
      html += `
        <div class="chal-card ${c.tier} ${state}${tracked ? " tracked" : ""}">
          <div class="chal-card-head">
            <span class="chal-ico">${c.icon}</span>
            <span class="chal-tier">${WB.t(c.tier)}</span>
            ${claimed ? "" : `<button class="chal-pin${tracked ? " on" : ""}" data-act="trackchal" data-key="${c.id}" title="${WB.t("Track this challenge")}">${tracked ? "📌" : "📍"}</button>`}
          </div>
          <b class="chal-name">${WB.t(c.name)}</b>
          <div class="chal-desc">${WB.t(c.desc)}</div>
          <div class="chal-bar"><div class="chal-fill" style="width:${pct}%"></div></div>
          <div class="chal-meta"><span class="chal-prog">${fmtN(Math.min(raw, c.goal))} / ${fmtN(c.goal)}</span><span class="chal-reward">${WB.t(c.rewardText)}</span></div>
          ${claimed
            ? `<div class="chal-claimed">✓ ${WB.t("Claimed")}</div>`
            : done
              ? `<button class="btn primary chal-claim" data-act="claimchal" data-key="${c.id}">🎁 ${WB.t("Claim reward")}</button>`
              : `<div class="chal-progresslbl">${Math.floor(pct)}%</div>`}
        </div>`;
    });
    return html + `</div>`;
  }
  function toggleTrackChallenge(id) {
    if (st.challengeTrack[id]) delete st.challengeTrack[id];
    else st.challengeTrack[id] = Date.now();
    renderTab(true);
  }
  function claimChallenge(id) {
    const c = WB.DATA.CHALLENGES.find(x => x.id === id);
    if (!c || st.challengesClaimed[id] || c.prog(st) < c.goal) return;
    st.challengesClaimed[id] = Date.now();
    delete st.challengeTrack[id];
    const r = c.reward;
    let msg;
    if (r.money) { const amt = WB.GAME.incomePerSec() * 60 * r.money + 250; WB.GAME.earn(amt); msg = "+" + WB.fmt(amt, true); }
    else if (r.boost) { st.boost = { mult: r.boost.mult, until: Date.now() + r.boost.sec * 1000 }; msg = `×${r.boost.mult} ${WB.t("income")} · ${r.boost.sec}s`; }
    else if (r.legacy) { st.prestige.legacy += r.legacy; msg = `+${r.legacy} ${WB.t("Legacy")}`; }
    else if (r.followers) { st.stats.followers += r.followers; msg = `+${WB.fmt(r.followers)} ${WB.t("fans")}`; }
    else if (r.luck) { st.res.luck += r.luck; msg = `+${r.luck} ${WB.t("luck")}`; }
    else if (r.intel) { st.res.intelligence += r.intel; msg = `+${r.intel} INT`; }
    else if (r.rep) { st.res.reputation += r.rep; msg = `+${r.rep} ${WB.t("rep")}`; }
    else if (r.xp) { WB.GAME.gainXp(r.xp.skill, r.xp.amount); msg = `+${r.xp.amount} XP`; }
    toast(`${WB.t(c.name)} · ${msg}`, "goal");
    confetti();
    renderTab(true);
  }

  // ---------- 🏆 Global leaderboard (Firebase) ----------
  function playerName() { try { return localStorage.getItem("wb_username") || "Anon"; } catch (e) { return "Anon"; } }
  let lbLoadedOnce = false;
  function tabLeaderboard() {
    const C = WB.CLOUD;
    const online = C && C.enabled ? `🟢 ${C.online} ${WB.t("online now")}` : `⚪ ${WB.t("offline")}`;
    return `
      <div class="lb-hero">
        <div class="lb-hero-top"><b>🏆 Global Leaderboard</b><span class="lb-online">${online}</span></div>
        <div class="lb-hero-sub">${WB.t("Ranked by net worth across every player. You compete as")} <b>${esc(playerName())}</b>.</div>
        <button class="btn small lb-refresh" data-act="lbrefresh">🔄 ${WB.t("Refresh")}</button>
      </div>
      <div id="lb-body" class="lb-body"><div class="lb-loading">${WB.t("Tap Refresh to load the latest rankings.")}</div></div>`;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  async function loadLeaderboard() {
    const body = $("lb-body");
    if (!body) return;
    const C = WB.CLOUD;
    if (!C) { body.innerHTML = `<div class="lb-empty">⏳ ${WB.t("Connecting…")}</div>`; return; }
    await C.ready;
    if (!C.enabled) {
      body.innerHTML = `<div class="lb-empty">📡 ${WB.t("Leaderboard is offline.")}<br><span class="muted">${WB.t("The owner needs to enable Firestore + Anonymous sign-in (see js/cloud.js).")}</span></div>`;
      return;
    }
    await C.submitScore({ name: playerName(), netWorth: WB.GAME.netWorth(), prestige: st.prestige.count, era: st.era });
    const rows = await C.fetchTop(25);
    if (!rows || !rows.length) { body.innerHTML = `<div class="lb-empty">${WB.t("No scores yet — be the first!")}</div>`; return; }
    const medal = i => ["🥇", "🥈", "🥉"][i] || `<span class="lb-rank">${i + 1}</span>`;
    body.innerHTML = rows.map((r, i) => `
      <div class="lb-row ${r.id === C.uid ? "me" : ""}">
        <span class="lb-pos">${medal(i)}</span>
        <span class="lb-name">${esc(r.name || "Anon")}${r.id === C.uid ? ` <span class="lb-you">${WB.t("you")}</span>` : ""}</span>
        <span class="lb-era">${(WB.DATA.ERAS[r.era] || {}).name ? WB.t(WB.DATA.ERAS[r.era].name) : ""}${r.prestige ? ` · ♻️${r.prestige}` : ""}</span>
        <span class="lb-net">${WB.fmt(r.netWorth, true)}</span>
      </div>`).join("");
  }

  // ============================================================ 👥 Friends / Profile
  const social = { friends: [], requests: [], view: "list", chatWith: null, unsubFriends: null, unsubReq: null, unsubInbox: null, unsubChat: null };
  function socialName() { return playerName(); }
  // Score row incl. live jail status, so friends can see you're locked up and
  // bail you out for the exact amount.
  function scorePayload() {
    const jailed = WB.CRIME && WB.CRIME.inPrison();
    return {
      name: playerName(), netWorth: WB.GAME.netWorth(), prestige: st.prestige.count, era: st.era,
      jailedUntil: jailed ? Date.now() + WB.CRIME.prisonLeft() : 0,
      bail: jailed ? Math.floor(WB.CRIME.bailCost()) : 0,
    };
  }
  function pushScore() { if (WB.CLOUD && WB.CLOUD.enabled) WB.CLOUD.submitScore(scorePayload()); }
  let lastJailedState = false; // push score the instant you're jailed / freed
  function watchJailForCloud() {
    const j = !!(WB.CRIME && WB.CRIME.inPrison());
    if (j !== lastJailedState) { lastJailedState = j; pushScore(); }
  }
  function profileOpen() { return modalIsOpen && !!$("profile-body"); }

  // global listeners (run for the whole session): incoming requests + gift inbox
  function startSocial() {
    if (!WB.CLOUD) return;
    WB.CLOUD.ready.then(() => {
      if (!WB.CLOUD.enabled) return;
      WB.CLOUD.submitScore({ name: socialName(), netWorth: WB.GAME.netWorth(), prestige: st.prestige.count, era: st.era });
      social.unsubReq = WB.CLOUD.watchRequests(reqs => { social.requests = reqs; updateProfileBadge(); if (profileOpen() && profileTab === "friends" && social.view === "list") renderFriendsView(); });
      social.unsubInbox = WB.CLOUD.watchInbox(gifts => gifts.forEach(applyGift));
    });
  }
  function applyGift(g) {
    WB.CLOUD.clearInbox(g.id);
    if (g.type === "invite") { showInvitePopup(g); return; } // heist-lobby invite → popup
    if (g.type === "ganginvite") { showGangInvitePopup(g); return; } // syndicate invite → popup
    if (g.type === "gangcut") { // your share of the syndicate pot
      WB.GAME.earn(g.amount || 0); if (WB.SOUND) WB.SOUND.play("cash"); confetti();
      toast(`🕴️ ${esc(g.gang || "The family")} ${WB.t("paid out — your cut:")} ${WB.fmt(g.amount || 0, true)}`, "good");
      return;
    }
    if (g.type === "war") { // a rival syndicate attacked your turf
      const msg = g.won
        ? `⚔️ ${esc(g.attacker || "A rival crew")} ${WB.t("seized")} ${esc(g.district || "your turf")} ${WB.t("from your family!")}`
        : `🛡️ ${esc(g.attacker || "A rival crew")} ${WB.t("hit")} ${esc(g.district || "your turf")} — ${WB.t("your crew held the line.")}`;
      toast(msg, g.won ? "bad" : "good");
      pushNotif(msg, g.won ? "bad" : "good");
      if (WB.SOUND) WB.SOUND.play(g.won ? "error" : "win");
      return;
    }
    if (g.type === "devreply") { // the developer replied to your message
      toast(`💬 ${esc(g.fromName || "The developer")}: ${esc(g.text || "")}`, "good");
      pushNotif(`💬 ${WB.t("Reply from the developer")}: ${g.text || ""}`, "good");
      return;
    }
    const amt = g.amount || 0;
    if (g.type === "bail") {
      if (WB.CRIME && WB.CRIME.inPrison()) {
        WB.CRIME.crimeState().prisonUntil = 0;          // freed!
        if (WB.ROOM && WB.ROOM.play) WB.ROOM.play("release");
        hidePrison();
        pushScore();                                    // clear my jail status on the cloud right away
        renderHud(); renderTab(true);
        toast(`⚖️ ${g.fromName} ${WB.t("bailed you out of jail!")} 🙏`, "good");
      } else {
        // someone tried to bail you but you're already out — keep it as a kind gift
        WB.GAME.earn(amt);
        toast(`💸 ${g.fromName} ${WB.t("sent you")} ${WB.fmt(amt, true)}!`, "good");
      }
    } else if (g.type === "heist") {
      WB.GAME.earn(amt);
      toast(`🤝 ${g.fromName} ${WB.t("cut you in on")} ${esc(g.job || "a job")} — +${WB.fmt(amt, true)}!`, "good");
    } else {
      WB.GAME.earn(amt);
      toast(`💸 ${g.fromName} ${WB.t("sent you")} ${WB.fmt(amt, true)}!`, "good");
    }
    confetti();
  }
  function updateProfileBadge() {
    const b = $("profile-badge"); if (!b) return;
    const n = social.requests.length;
    b.style.display = n ? "" : "none"; b.textContent = n > 9 ? "9+" : n;
  }

  let profileTab = "friends";
  function showProfile() {
    if (uiBusy() && !profileOpen()) { /* allow opening over nothing */ }
    const tabs = { friends: "👥 Friends", skills: "🧠 Skills", awards: "🏆 Awards", stats: "📊 Stats" };
    openModal(`
      <div class="profile-head">
        <div class="pf-avatar">${WB.CRIME && WB.CRIME.inPrison() ? "🚔" : "🧑‍💻"}</div>
        <div class="pf-id"><b id="pf-username">${esc(playerName())}</b><span class="muted" id="pf-sub"></span></div>
        <button class="btn subtle small" id="pf-edit" title="Edit name">✏️</button>
      </div>
      <div class="set-tabs">${Object.entries(tabs).map(([k, l]) => `<button class="set-tab ${profileTab === k ? "active" : ""}" data-ptab="${k}">${WB.t(l)}</button>`).join("")}</div>
      <div id="profile-body"></div>
      <button class="btn primary wide" id="pf-close" style="margin-top:12px">${WB.t("Close")}</button>`);
    $("pf-sub").textContent = (WB.CLOUD && WB.CLOUD.enabled ? `🟢 ${WB.t("online")}` : `⚪ ${WB.t("offline")}`) + " · " + WB.fmt(WB.GAME.netWorth(), true);
    $("modal-content").querySelectorAll("[data-ptab]").forEach(b => b.onclick = () => {
      profileTab = b.dataset.ptab;
      $("modal-content").querySelectorAll("[data-ptab]").forEach(x => x.classList.toggle("active", x === b));
      social.view = "list"; social.chatWith = null;
      if (social.unsubChat) { social.unsubChat(); social.unsubChat = null; }
      renderProfileBody();
    });
    $("pf-edit").onclick = editUsername;
    $("pf-close").onclick = () => { stopFriendsWatch(); closeModal(); };
    renderProfileBody();
  }
  function editUsername() {
    // Custom modal instead of window.prompt() (unsupported in the Electron app).
    const cur = playerName();
    openModal(`
      <div class="ev-icon">✏️</div>
      <h2>${WB.t("Choose a username")}</h2>
      <p class="muted">${WB.t("Shown to friends & on the leaderboard.")}</p>
      <input class="set-input" id="uname-input" type="text" maxlength="20" placeholder="Player" value="${esc(cur)}" autocomplete="off" style="width:100%;margin:6px 0 14px">
      <div style="display:flex;gap:8px;justify-content:center">
        <button class="btn" id="uname-cancel">${WB.t("Cancel")}</button>
        <button class="btn primary" id="uname-save">${WB.t("Save")}</button>
      </div>`);
    const input = $("uname-input");
    const save = () => {
      const name = (input ? input.value : "").trim().slice(0, 20) || "Player";
      try { localStorage.setItem("wb_username", name); } catch (e) {}
      if (WB.CLOUD && WB.CLOUD.enabled) WB.CLOUD.submitScore({ name, netWorth: WB.GAME.netWorth(), prestige: st.prestige.count, era: st.era });
      if ($("pf-username")) $("pf-username").textContent = name;
      if ($("profile-name")) $("profile-name").textContent = name;
      closeModal();
    };
    if (input) { input.focus(); input.select(); input.onkeydown = (e) => { if (e.key === "Enter") save(); }; }
    $("uname-cancel").onclick = closeModal;
    $("uname-save").onclick = save;
  }
  function renderProfileBody() {
    const body = $("profile-body"); if (!body) return;
    if (profileTab === "skills") { body.innerHTML = tabSkills(); WB.I18N.translateDom(body); stopFriendsWatch(); return; }
    if (profileTab === "awards") { body.innerHTML = tabAchievements(); WB.I18N.translateDom(body); stopFriendsWatch(); return; }
    if (profileTab === "stats") { body.innerHTML = tabStats(); WB.I18N.translateDom(body); stopFriendsWatch(); return; }
    // friends — Adam (the built-in friend) shows even offline; real friends need the cloud
    if (!WB.CLOUD || !WB.CLOUD.enabled) {
      stopFriendsWatch();
      social.friends = [];
      body.innerHTML = `<div class="fr-offline-note">📡 ${WB.t("Real friends need Firestore + Anonymous sign-in — but Adam's always here. 🐐")}</div><div id="friends-view"></div>`;
      renderFriendsView();
      return;
    }
    body.innerHTML = `<div id="friends-view"></div>`;
    startFriendsWatch();
    renderFriendsView();
  }
  function startFriendsWatch() {
    if (social.unsubFriends || !WB.CLOUD || !WB.CLOUD.enabled) return;
    social.unsubFriends = WB.CLOUD.watchFriends(list => {
      social.friends = list.sort((a, b) => (b.online - a.online) || (b.netWorth || 0) - (a.netWorth || 0));
      if (profileOpen() && profileTab === "friends" && social.view === "list") renderFriendsView();
    });
  }
  function stopFriendsWatch() {
    if (social.unsubFriends) { social.unsubFriends(); social.unsubFriends = null; }
    if (social.unsubChat) { social.unsubChat(); social.unsubChat = null; }
  }
  function frBadges(f) {
    if (!f) return "";
    const b = [];
    const ERAS = WB.DATA && WB.DATA.ERAS;
    if (f.era != null && ERAS && ERAS[f.era]) b.push(`<span class="fr-badge" title="${esc(ERAS[f.era].name)}">${ERAS[f.era].year}</span>`);
    if (f.prestige) b.push(`<span class="fr-badge gold" title="Rebirths">♻️${f.prestige}</span>`);
    return b.length ? `<span class="fr-badges">${b.join("")}</span>` : "";
  }
  function frRow(name, net, uid, online, extraClass, nameExtra, f, rank) {
    const jailed = f && f.jailedUntil && f.jailedUntil > Date.now();
    const bail = jailed ? Math.floor(f.bail || 0) : 0;
    return `
      <div class="fr-row ${extraClass || ""}${jailed ? " jailed" : ""}">
        ${rank ? `<span class="fr-rank">${rank}</span>` : ""}
        <span class="fr-dot ${online ? "on" : ""}"></span>
        <span class="fr-name">${esc(name)}${nameExtra || ""}${frBadges(f)}${jailed ? ` <span class="fr-jail" title="Locked up">🔒</span>` : ""}</span>
        <span class="fr-net">${net != null ? WB.fmt(net, true) : "—"}</span>
        <span class="fr-actions">
          <button class="btn tiny" data-fr="chat" data-uid="${uid}" data-name="${esc(name)}" title="Chat">💬</button>
          <button class="btn tiny" data-fr="trade" data-uid="${uid}" data-name="${esc(name)}" title="Send money">🤝</button>
          ${jailed ? `<button class="btn tiny fr-bail" data-fr="bail" data-uid="${uid}" data-name="${esc(name)}" data-bail="${bail}" title="Bail out for ${WB.fmt(bail, true)}">⚖️</button>` : ""}
        </span></div>`;
  }
  function renderFriendsView() {
    const v = $("friends-view"); if (!v) return;
    if (social.view === "chat" && social.chatWith) {
      return social.chatWith.uid === ADAM_UID ? renderAdamChat(v) : renderChat(v, social.chatWith);
    }
    maybeMeetAdam();
    const reqs = social.requests.map(r => `
      <div class="fr-req"><span>👋 <b>${esc(r.name)}</b> ${WB.t("wants to be friends")}</span>
        <span><button class="btn small primary" data-fr="acc" data-uid="${r.uid}" data-name="${esc(r.name)}">${WB.t("Accept")}</button>
        <button class="btn small subtle" data-fr="dec" data-uid="${r.uid}">${WB.t("Decline")}</button></span></div>`).join("");
    // Adam: your built-in friend, always at the top. 🐐
    const a = adamFriend();
    const adamRow = frRow("Adam", a.netWorth, ADAM_UID, true, "fr-adam", ` <span class="fr-bestie">🐐 ${WB.t("bestie")}</span>${adamUnread ? ` <span class="fr-unread">${adamUnread}</span>` : ""}`);
    const real = social.friends.map((f, i) => frRow(f.name, f.netWorth, f.uid, f.online, "", "", f, i + 1)).join("");
    const onlineCount = social.friends.filter(f => f.online).length + 1; // +1 for Adam, always online
    // your standing among your crew
    const myNet = WB.GAME.netWorth();
    const myRank = social.friends.filter(f => (f.netWorth || 0) > myNet).length + 1;
    const jailedFriends = social.friends.filter(f => f.jailedUntil && f.jailedUntil > Date.now()).length;
    v.innerHTML = `
      <div class="fr-hero">
        <div class="fr-hero-top"><span class="fr-hero-net">${WB.fmt(myNet, true)}</span><span class="fr-hero-rank">#${myRank} ${WB.t("of")} ${social.friends.length + 1}</span></div>
        <div class="fr-hero-sub">🟢 ${onlineCount} ${WB.t("online")}${jailedFriends ? ` · 🔒 ${jailedFriends} ${WB.t("locked up — bail 'em out")}` : ""}</div>
      </div>
      <div class="fr-add">
        <input id="fr-input" placeholder="${WB.t("Friend's username…")}" maxlength="20" autocomplete="off">
        <button class="btn primary small" data-fr="add">${WB.t("Add")}</button>
      </div>
      ${reqs ? `<div class="fr-section">${WB.t("Requests")}</div>${reqs}` : ""}
      <div class="fr-section">${WB.t("Friends")} · ${onlineCount} ${WB.t("online")}</div>
      <div class="fr-list">${adamRow}${real || (social.friends.length ? "" : `<div class="fr-empty">${WB.t("Add real players by username — Adam's always here for you. 🐐")}</div>`)}</div>`;
    v.querySelectorAll("[data-fr]").forEach(b => b.onclick = () => onFriendAction(b.dataset.fr, b.dataset.uid, b.dataset.name, b.dataset.bail));
    const inp = $("fr-input"); if (inp) inp.onkeydown = e => { if (e.key === "Enter") onFriendAction("add"); };
  }

  // ---------------------------------------------------------- 🐐 Adam (easter egg)
  const ADAM_UID = "__adam__";
  let adamChat = null;       // local message history with Adam
  let adamUnread = 0;        // little unread badge on his row
  function adamFriend() {
    // Adam's always doing a little better than you — a friendly nudge to keep going.
    const net = Math.max(50000, Math.floor((WB.GAME ? WB.GAME.netWorth() : 0) * 1.07) + 25000);
    return { uid: ADAM_UID, name: "Adam", online: 1, netWorth: net, adam: true };
  }
  const ADAM_LINES = [
    "Yo!! How's the grind going? 👀", "Bro you're built different fr 🐐",
    "Saw your net worth. Sheeeesh. Proud of you man 🙌",
    "Touch some grass once in a while ok? I worry about you 😅",
    "When you make it, remember who believed first 🤝",
    "I told everyone you'd blow up. Don't make me a liar 😎",
    "Need anything? Money, bail, a pep talk — I got you. Always. 💯",
    "Honestly you're the most locked-in person I know.",
    "We're gonna laugh about the parents'-bedroom era from a yacht 🛥️",
    "Keep going. You're closer than you think. 🚀",
    "Hustle today, brunch forever. That's the motto.",
    "Don't let the haters in the group chat get to you. I muted them.",
  ];
  function maybeMeetAdam() {
    let met = false; try { met = !!localStorage.getItem("wb_adam_met"); } catch (e) {}
    if (met) return;
    try { localStorage.setItem("wb_adam_met", "1"); } catch (e) {}
    adamUnread = 2;
    setTimeout(() => toast("🐐 Adam added you as a friend — open the chat and say hi!", "good"), 400);
  }
  function renderAdamChat(v) {
    adamUnread = 0;
    if (!adamChat) adamChat = [
      { from: "them", text: "Yo!! Look who finally opened their friends list 😂" },
      { from: "them", text: "Proud of you for grinding, man. I'm always in your corner. 🤝" },
    ];
    const draw = () => {
      const box = $("fr-chat"); if (!box) return;
      box.innerHTML = adamChat.map(m => `<div class="cmsg ${m.from === "me" ? "me" : "them"}"><span>${esc(m.text)}</span></div>`).join("");
      box.scrollTop = box.scrollHeight;
    };
    v.innerHTML = `
      <div class="chat-top"><button class="btn tiny subtle" id="chat-back">‹ ${WB.t("Back")}</button><b>Adam</b><span class="fr-bestie">🐐</span></div>
      <div class="fr-chat" id="fr-chat"></div>
      <div class="fr-chat-row"><input id="fr-chat-input" placeholder="${WB.t("Message Adam…")}" maxlength="280" autocomplete="off"><button class="btn primary small" id="fr-chat-send">➤</button></div>`;
    $("chat-back").onclick = () => { social.view = "list"; social.chatWith = null; renderFriendsView(); };
    draw();
    const send = () => {
      const i = $("fr-chat-input"); const t = (i.value || "").trim(); if (!t) return;
      adamChat.push({ from: "me", text: t }); i.value = ""; draw();
      setTimeout(() => { adamChat.push({ from: "them", text: WB.pick(ADAM_LINES) }); if (social.chatWith && social.chatWith.uid === ADAM_UID) draw(); }, 700 + Math.random() * 700);
    };
    $("fr-chat-send").onclick = send;
    $("fr-chat-input").onkeydown = e => { if (e.key === "Enter") send(); };
    setTimeout(() => { const i = $("fr-chat-input"); if (i) i.focus(); }, 50);
  }
  async function onFriendAction(kind, uid, name, bail) {
    const C = WB.CLOUD;
    if (uid === ADAM_UID) { // 🐐 Adam is local — handle him without the cloud
      if (kind === "chat") { social.view = "chat"; social.chatWith = { uid: ADAM_UID, name: "Adam" }; renderFriendsView(); }
      else if (kind === "trade") toast("🐐 Adam: keep your money, king 👑 — save it for the yacht.", "good");
      else if (kind === "bail") {
        if (WB.CRIME && WB.CRIME.inPrison()) {
          WB.CRIME.crimeState().prisonUntil = 0;
          toast("🐐 Adam pulled some strings — you're FREE. 'Told you I got you.' 🤝", "good");
          confetti(); renderHud(); if (WB.UI && WB.UI.hidePrison) WB.UI.hidePrison();
        } else toast("🐐 Adam: bro you're not even in jail 😭 stay outta trouble.", "good");
      }
      return;
    }
    if (kind === "add") {
      const nm = ($("fr-input").value || "").trim(); if (!nm) return;
      const r = await C.sendFriendRequest(nm, socialName());
      if (r.ok) toast(`📨 ${WB.t("Friend request sent to")} ${esc(r.name)}!`, "good");
      else toast(r.why === "notfound" ? `🤷 ${WB.t("No player called")} "${esc(nm)}"` : r.why === "self" ? WB.t("That's you!") : WB.t("Couldn't send request."), "bad");
      if ($("fr-input")) $("fr-input").value = "";
    } else if (kind === "acc") { await C.acceptFriendRequest(uid, name, socialName()); toast(`🎉 ${esc(name)} ${WB.t("is now your friend!")}`, "good"); }
    else if (kind === "dec") { await C.declineRequest(uid); }
    else if (kind === "chat") { social.view = "chat"; social.chatWith = { uid, name }; renderFriendsView(); }
    else if (kind === "trade") socialAmountDialog("trade", uid, name);
    else if (kind === "bail") {
      const amt = Math.floor(Number(bail) || 0);
      if (amt <= 0) { toast(`🤷 ${esc(name)} ${WB.t("isn't in jail right now.")}`, "bad"); return; }
      confirmBailDialog(uid, name, amt);
    }
  }
  function renderChat(v, friend) {
    v.innerHTML = `
      <div class="chat-top"><button class="btn tiny subtle" id="chat-back">‹ ${WB.t("Back")}</button><b>${esc(friend.name)}</b></div>
      <div class="fr-chat" id="fr-chat"></div>
      <div class="fr-chat-row"><input id="fr-chat-input" placeholder="${WB.t("Message…")}" maxlength="280" autocomplete="off"><button class="btn primary small" id="fr-chat-send">➤</button></div>`;
    $("chat-back").onclick = () => { social.view = "list"; social.chatWith = null; if (social.unsubChat) { social.unsubChat(); social.unsubChat = null; } renderFriendsView(); };
    if (social.unsubChat) social.unsubChat();
    social.unsubChat = WB.CLOUD.watchChat(friend.uid, msgs => {
      const box = $("fr-chat"); if (!box) return;
      box.innerHTML = msgs.length ? msgs.map(m => `<div class="cmsg ${m.from === WB.CLOUD.uid ? "me" : "them"}"><span>${esc(m.text)}</span></div>`).join("") : `<div class="fr-empty">${WB.t("Say hi! 👋")}</div>`;
      box.scrollTop = box.scrollHeight;
    });
    const send = () => { const i = $("fr-chat-input"); const t = i.value.trim(); if (!t) return; WB.CLOUD.sendMessage(friend.uid, t, socialName()); i.value = ""; };
    $("fr-chat-send").onclick = send;
    $("fr-chat-input").onkeydown = e => { if (e.key === "Enter") send(); };
    setTimeout(() => { const i = $("fr-chat-input"); if (i) i.focus(); }, 50);
  }
  function socialAmountDialog(type, uid, name) {
    const isBail = type === "bail";
    const def = Math.max(1, Math.floor(st.money * (isBail ? 0.25 : 0.1)));
    const ov = document.createElement("div");
    ov.className = "amt-dialog";
    ov.innerHTML = `<div class="amt-card">
      <div class="amt-ico">${isBail ? "⚖️" : "🤝"}</div>
      <h3>${isBail ? WB.t("Bail out") : WB.t("Send money to")} ${esc(name)}</h3>
      <p class="muted">${WB.t("It leaves your wallet and lands in theirs instantly.")}</p>
      <input id="amt-in" type="text" inputmode="numeric" value="${Math.floor(def)}">
      <div class="amt-row"><button class="btn subtle" id="amt-cancel">${WB.t("Cancel")}</button><button class="btn primary" id="amt-go">${isBail ? "⚖️ " + WB.t("Bail out") : "💸 " + WB.t("Send")}</button></div>
    </div>`;
    $("modal-content").appendChild(ov);
    const close = () => ov.remove();
    ov.querySelector("#amt-cancel").onclick = close;
    ov.querySelector("#amt-go").onclick = async () => {
      const amt = Math.floor(Number(($("amt-in").value || "").replace(/[^0-9.]/g, "")) || 0);
      if (amt <= 0) return;
      if (st.money < amt) { toast(WB.t("You can't afford that."), "bad"); return; }
      st.money -= amt;
      await WB.CLOUD.sendGift(uid, type, amt, socialName());
      toast(`${isBail ? "⚖️" : "💸"} ${WB.t("Sent")} ${WB.fmt(amt, true)} ${WB.t("to")} ${esc(name)}!`, "good");
      close();
    };
    setTimeout(() => { const i = $("amt-in"); if (i) { i.focus(); i.select(); } }, 50);
  }
  // Bail is a fixed, known amount (the friend publishes it) — no guessing.
  function confirmBailDialog(uid, name, amt) {
    const ov = document.createElement("div");
    ov.className = "amt-dialog";
    ov.innerHTML = `<div class="amt-card">
      <div class="amt-ico">⚖️</div>
      <h3>${WB.t("Bail out")} ${esc(name)}?</h3>
      <p class="muted">${WB.t("Their bail is")} <b>${WB.fmt(amt, true)}</b> — ${WB.t("it leaves your wallet and frees them instantly.")}</p>
      <div class="amt-row"><button class="btn subtle" id="bail-cancel">${WB.t("Cancel")}</button><button class="btn primary" id="bail-go">⚖️ ${WB.t("Bail out")} · ${WB.fmt(amt, true)}</button></div>
    </div>`;
    $("modal-content").appendChild(ov);
    const close = () => ov.remove();
    ov.querySelector("#bail-cancel").onclick = close;
    ov.querySelector("#bail-go").onclick = async () => {
      if (st.money < amt) { toast(WB.t("You can't afford their bail."), "bad"); return; }
      st.money -= amt;
      await WB.CLOUD.sendGift(uid, "bail", amt, socialName());
      toast(`⚖️ ${WB.t("You bailed")} ${esc(name)} ${WB.t("out!")} (−${WB.fmt(amt, true)})`, "good");
      close();
    };
  }

  const crimeDescCache = {}; // fill() once per crime — random slot-fills would re-randomize every render
  let crimeCat = "street";   // which Underworld category sub-tab is open
  function crimeQuickCard(cr, C, jailed) {
    const el = C.eligible(cr);
    const chance = cr.launder ? null : Math.round(C.catchChance(cr) * 100);
    const riskCol = chance === null ? "#34c759" : chance > 40 ? "#ff453a" : chance > 22 ? "#ff9f0a" : "#34c759";
    if (!crimeDescCache[cr.id]) crimeDescCache[cr.id] = WB.THOUGHTS.fill(cr.desc);
    return `
      <div class="crime-card ${el.ok ? "" : "locked"}">
        <div class="crime-card-head"><span class="crime-ico">${cr.icon}</span>
          <span class="risk-pill" style="--rp:${riskCol}">${chance === null ? "🧼 −" + WB.t("heat") : chance + "% " + WB.t("risk")}</span></div>
        <b class="crime-name">${WB.t(cr.name)}</b>
        <div class="crime-desc">${crimeDescCache[cr.id]}</div>
        ${cr.launder ? "" : `<div class="crime-take">💰 ${WB.t("Est. take")} <b>${WB.fmt(C.estPayout(cr), true)}</b></div>`}
        <div class="crime-meta">${cr.sentence ? `⛓️ ${WB.fmtTime(cr.sentence)} ${WB.t("if caught")}` : WB.t("Washes your dirty reputation")}</div>
        ${el.ok
          ? `<button class="btn crime-btn ${jailed ? "locked" : ""}" data-act="crime" data-key="${cr.id}">${WB.t(cr.launder ? "🧼 Launder" : "Commit")}</button>`
          : `<div class="crime-lock">🔒 ${el.why}</div>`}
      </div>`;
  }
  function crimeHardCard(cr, C, jailed) {
    const el = C.eligibleHard(cr);
    const chance = Math.round(C.catchChance(cr) * 100);
    const riskCol = chance > 40 ? "#ff453a" : chance > 22 ? "#ff9f0a" : "#34c759";
    const stake = cr.stake(st);
    if (!crimeDescCache[cr.id]) crimeDescCache[cr.id] = WB.THOUGHTS.fill(cr.desc);
    return `
      <div class="crime-card hard ${el.ok ? "" : "locked"}">
        <div class="crime-card-head"><span class="crime-ico">${cr.icon}</span>
          <span class="risk-pill" style="--rp:${riskCol}">${chance}% ${WB.t("risk")}</span></div>
        <b class="crime-name">${WB.t(cr.name)}</b>
        <div class="crime-desc">${crimeDescCache[cr.id]}</div>
        <div class="crime-take">💰 ${WB.t("Est. take")} <b>${WB.fmt(C.estHardPayout(cr), true)}</b></div>
        <div class="crime-stake">🎟️ ${WB.t("Stake")} ${WB.fmt(stake, true)}${cr.reqCar ? ` · 🚗 ${WB.t("car")}` : ""}</div>
        <div class="crime-meta">⛓️ ${WB.fmtTime(cr.sentence)} ${WB.t("if caught")}</div>
        ${el.ok
          ? `<div class="hard-btns">
               <button class="btn crime-btn ${jailed ? "locked" : ""}" data-act="hardjob" data-key="${cr.id}">${WB.t("Solo")}</button>
               <button class="btn crime-btn coop ${jailed ? "locked" : ""}" data-act="heistfriend" data-key="${cr.id}">🤝 ${WB.t("Crew")}</button>
             </div>`
          : `<div class="crime-lock">🔒 ${el.why}</div>`}
      </div>`;
  }
  function tabCrime() {
    const C = WB.CRIME, c = C.crimeState();
    const heat = Math.round(c.heat);
    const jailed = C.inPrison();
    const hs = heat < 20 ? ["❄️", "Cold", "#34c759"] : heat < 45 ? ["🌤️", "Warm", "#ffd60a"] : heat < 70 ? ["🔥", "Hot", "#ff9f0a"] : ["🚨", "Blazing", "#ff453a"];

    const jobsDone = (c.crimesDone || 0) + (c.scamSuccess || 0);
    const cleanPct = (jobsDone + c.timesCaught) ? Math.round(jobsDone / (jobsDone + c.timesCaught) * 100) : 100;
    const streak = c.streak || 0;
    const sMult = C.streakMult ? C.streakMult() : 1;
    let html = `
      <div class="crime-hero">
        <div class="crime-hero-top"><b>🌆 The Underworld</b><span class="heat-chip" style="--hc:${hs[2]}">${hs[0]} ${hs[1]}</span></div>
        <div class="heat-row"><span class="heat-num">${heat}</span><span class="heat-cap">/ 100 heat</span>${streak > 1 ? `<span class="streak-chip">🔥 ${streak} ${WB.t("streak")} ×${sMult.toFixed(2)}</span>` : ""}</div>
        <div class="heat-bar"><div class="heat-fill" style="width:${heat}%"></div></div>
        <div class="rap-sheet">
          <span class="rap-stat">🦹 <b>${jobsDone}</b> ${WB.t("jobs")}</span>
          <span class="rap-stat">✅ <b>${cleanPct}%</b> ${WB.t("clean")}</span>
          <span class="rap-stat">🏆 <b>${WB.fmt(c.bestScore || 0, true)}</b> ${WB.t("best")}</span>
          <span class="rap-stat">⛓️ <b>${c.timesCaught || 0}</b> ${WB.t("busts")}</span>
        </div>
        <div class="crime-hero-sub">Crimes raise heat · heat raises catch odds · time (or laundering) cools it down</div>
      </div>`;

    if (jailed) {
      html += `
        <div class="crime-jail">
          <div class="crime-jail-top"><b>🚔 County Jail</b><span class="jail-clock">⏳ ${WB.fmtTime(C.prisonLeft() / 1000)}</span></div>
          <div class="jail-stripes"></div>
          <div class="crime-jail-sub">Booked for: ${c.prisonReason}. Actions are locked, income runs at 50%.</div>
          <button class="btn danger wide" data-act="bail">⚖️ Post Bail — ${WB.fmt(C.bailCost(), true)}</button>
        </div>`;
    }

    // category sub-tabs
    const cats = C.CATS || [];
    if (!cats.some(x => x.id === crimeCat)) crimeCat = cats[0] ? cats[0].id : "street";
    html += `<div class="crime-types-label">🗂️ ${WB.t("Crime types")} <span class="crime-types-hint">${WB.t("swipe for more →")}</span></div>`;
    html += `<div class="crime-cats-wrap"><div class="crime-cats">` + cats.map(cat =>
      `<button class="crime-cat-chip${crimeCat === cat.id ? " active" : ""}" data-act="crimecat" data-key="${cat.id}">${cat.icon} ${WB.t(cat.name)}</button>`
    ).join("") + `</div></div>`;

    if (crimeCat === "scams") {
      const avatars = (WB.SCAM ? WB.SCAM.VICTIMS : []).map(v => `<span title="${v.name}">${v.avatar}</span>`).join("");
      html += `
        <div class="crime-feature">
          <div class="crime-feature-main">
            <b>💬 Scam Sim — Texting</b>
            <div class="crime-feature-sub">Chat up fictional marks, watch their scare meter, cash out before they snap.
              ${WB.aiEnabled() ? "🟢 AI victims active." : "⚪ Offline victims — add an OpenAI key in Settings for smart ones."}</div>
            <div class="victim-row">${avatars}</div>
          </div>
          <button class="btn primary ${jailed ? "locked" : ""}" data-act="openscam">Open<br>Messages</button>
        </div>`;
    }
    if (crimeCat === "mafia") html += gangPanel(); // syndicate panel above the mafia jobs

    if (crimeCat === "robberies") {
      html += `<div class="section-title">💰 ${WB.t("Hard Jobs")} <span class="hard-hint">${WB.t("· real stakes, real payouts")}</span></div><div class="crime-grid">`;
      (C.HARD_CRIMES || []).forEach(cr => { html += crimeHardCard(cr, C, jailed); });
      html += `</div>`;
    } else {
      const catName = (cats.find(x => x.id === crimeCat) || {}).name || "Quick";
      const list = C.CRIMES.filter(cr => cr.cat === crimeCat || cr.launder);
      html += `<div class="section-title">🦹 ${WB.t(catName)} ${WB.t("Jobs")}</div><div class="crime-grid">`;
      list.forEach(cr => { html += crimeQuickCard(cr, C, jailed); });
      html += `</div>`;
    }
    html += crimeGearSection(C);
    return html;
  }
  // 🧰 the black-market shop — permanent tools that bend the odds on every job
  function crimeGearSection(C) {
    const c = C.crimeState(), mods = C.gearMods();
    let html = `<div class="section-title">🧰 ${WB.t("Black-Market Gear")} <span class="hard-hint">${WB.t("· a permanent edge on every job")}</span></div>`;
    html += `<div class="gear-summary"><span>🎚️ ${WB.t("Risk")} <b style="color:${mods.risk < 1 ? "var(--green)" : "var(--text)"}">×${mods.risk.toFixed(2)}</b></span><span>💰 ${WB.t("Take")} <b style="color:${mods.pay > 1 ? "var(--green)" : "var(--text)"}">×${mods.pay.toFixed(2)}</b></span><span>⛓️ ${WB.t("Sentence")} <b style="color:${mods.sentence < 1 ? "var(--green)" : "var(--text)"}">×${mods.sentence.toFixed(2)}</b></span></div>`;
    html += `<div class="crime-grid">`;
    C.CRIME_GEAR.forEach(g => {
      const has = !!c.gear[g.id], can = st.money >= g.cost;
      html += `<div class="crime-card gear ${has ? "owned" : (can ? "" : "locked")}">
        <div class="crime-card-head"><span class="crime-ico">${g.icon}</span>${has ? `<span class="risk-pill" style="--rp:#34c759">✓ ${WB.t("owned")}</span>` : ""}</div>
        <b class="crime-name">${WB.t(g.name)}</b>
        <div class="crime-desc">${WB.t(g.desc)}</div>
        ${has
          ? `<div class="crime-meta">🧰 ${WB.t("In your kit")}</div>`
          : `<button class="btn buy ${can ? "" : "locked"}" data-act="buygear" data-key="${g.id}">${WB.t("Acquire")}<span class="cost">${WB.fmt(g.cost, true)}</span></button>`}
      </div>`;
    });
    html += `</div>`;
    return html;
  }
  function doHardJob(id, withFriend, friend) {
    if (WB.ROOM && WB.ROOM.cutActive && WB.ROOM.cutActive()) { toast("🎬 A job's already in motion — let it play out.", "bad"); return; }
    const cr = WB.CRIME.HARD_CRIMES.find(x => x.id === id);
    const el = cr && WB.CRIME.eligibleHard(cr);
    if (!el || !el.ok) { toast("🚫 " + (el ? el.why : WB.t("Unknown job")), "bad"); return; }
    if (WB.CRIME.inPrison()) { toast("🚫 " + WB.t("You're in jail. Sit tight."), "bad"); return; }

    // MANDATORY planning — plan quality (0..1) drives the risk.
    const pull = (planQ) => {
      if (planQ == null) return; // backed out of planning → no job, no stake spent
      const r = WB.CRIME.commitHard(id, withFriend, withFriend ? 2 : 1, planQ);
      if (!r) return;
      if (r.refused) { toast("🚫 " + r.refused, "bad"); return; }
      renderTab(true); renderHud(); // reflect the stake being paid up front

      const reveal = () => {
        WB.CRIME.finalizeHardJob(r); // money lands / jail door closes — after the movie
        if (WB.SOUND) WB.SOUND.play(r.win ? "win" : "lose");
        if (r.win && r.money > 0) { // the family takes a 10% cut of every heist score too
          const fed = feedPot(r.money, 0.10);
          if (fed > 0) r.lines = (r.lines || []).concat(`🕴️ ${WB.fmt(fed, true)} ${WB.t("into the syndicate pot.")}`);
        }
        if (withFriend && friend && r.win) {
          if (friend.uid === ADAM_UID) toast("🐐 Adam: clean job, partner. Same time next week?", "good");
          else if (WB.CLOUD && WB.CLOUD.enabled) {
            const cut = Math.floor(r.money * 0.4);
            WB.CLOUD.sendHeistCut(friend.uid, cut, playerName(), r.job);
            toast(`🤝 ${WB.t("Sent")} ${friend.name} ${WB.t("their cut")}: ${WB.fmt(cut, true)}`, "good");
          }
        }
        openResult(r);
        renderTab(true); renderHud();
      };
      const scene = r.win ? (withFriend ? "heistDuo" : "heist") : (withFriend ? "heistBustDuo" : "heistBust");
      if (WB.ROOM && WB.ROOM.play) WB.ROOM.play(scene, reveal);
      else reveal();
    };
    if (WB.PLANNING && WB.PLANNING.openPlan) WB.PLANNING.openPlan(cr, pull);
    else pull(0.6);
  }
  function openHeistPicker(id) {
    const cr = WB.CRIME.HARD_CRIMES.find(x => x.id === id);
    const el = WB.CRIME.eligibleHard(cr);
    if (!el.ok) { toast("🚫 " + el.why, "bad"); return; }
    if (WB.CRIME.inPrison()) { toast("🚫 " + WB.t("You're in jail. Sit tight."), "bad"); return; }
    const online = (social.friends || []).filter(f => f.online);
    const crew = [{ uid: ADAM_UID, name: "Adam" }].concat(online.map(f => ({ uid: f.uid, name: f.name })));
    openModal(`
      <div class="ev-icon">🤝</div>
      <h2>${WB.t("Pick your crew")}</h2>
      <p>${WB.t("A partner lowers the risk and boosts the take — and gets a cut sent to them.")}</p>
      <div class="ev-choices">${crew.map(f => `<button class="btn choice crew-pick" data-uid="${f.uid}" data-name="${esc(f.name)}"><b>🧑‍🤝‍🧑 ${esc(f.name)}${f.uid === ADAM_UID ? " 🐐" : ""}</b>${f.uid === ADAM_UID ? `<small>${WB.t("Your built-in partner — always down.")}</small>` : ""}</button>`).join("")}</div>
      <button class="btn subtle wide" id="crew-cancel" style="margin-top:10px">${WB.t("Cancel")}</button>`);
    $("modal-content").querySelectorAll(".crew-pick").forEach(b => b.onclick = () => {
      const friend = { uid: b.dataset.uid, name: b.dataset.name };
      closeModal();
      setTimeout(() => doHardJob(id, true, friend), 120);
    });
    $("crew-cancel").onclick = closeModal;
  }

  // ============================================================ 👥 Heist Lobby (multiplayer)
  const lobby = { id: null, jobId: null, data: null, msgs: [], online: [], invited: {}, isHost: false, resolved: false, unsub: null, unsubMsgs: null };
  const lobbyJob = () => WB.CRIME.HARD_CRIMES.find(x => x.id === lobby.jobId);
  function stopLobbyWatch() {
    if (lobby.unsub) { lobby.unsub(); lobby.unsub = null; }
    if (lobby.unsubMsgs) { lobby.unsubMsgs(); lobby.unsubMsgs = null; }
  }
  function resetLobby() { stopLobbyWatch(); lobby.id = null; lobby.jobId = null; lobby.data = null; lobby.msgs = []; lobby.invited = {}; lobby.isHost = false; lobby.resolved = false; }
  function leaveLobby(silent) {
    const id = lobby.id;
    if (id && WB.CLOUD && WB.CLOUD.leaveLobby) WB.CLOUD.leaveLobby(id);
    const open = modalIsOpen && document.getElementById("lobby-root");
    resetLobby();
    if (!silent && open) closeModal();
  }
  // "🤝 Crew" → an online lobby when connected, else the offline Adam/friend picker.
  function openLobbyCreate(id) {
    if (!WB.CLOUD || !WB.CLOUD.enabled) { openHeistPicker(id); return; }
    const cr = WB.CRIME.HARD_CRIMES.find(x => x.id === id);
    const el = WB.CRIME.eligibleHard(cr);
    if (!el.ok) { toast("🚫 " + el.why, "bad"); return; }
    if (WB.CRIME.inPrison()) { toast("🚫 " + WB.t("You're in jail. Sit tight."), "bad"); return; }
    WB.CLOUD.createLobby(id, cr.name, playerName()).then(lid => {
      if (!lid) { toast("☁️ " + WB.t("Couldn't open a lobby — try the offline crew."), "bad"); openHeistPicker(id); return; }
      resetLobby(); lobby.id = lid; lobby.jobId = id; lobby.isHost = true;
      startLobbyWatch(); renderLobbyModal();
    });
  }
  function joinLobbyFlow(lobbyId, jobId) {
    if (!WB.CLOUD || !WB.CLOUD.enabled) return;
    if (WB.CRIME && WB.CRIME.inPrison()) { toast("🚫 " + WB.t("You're in jail — get bailed out before joining a crew."), "bad"); return; }
    WB.CLOUD.joinLobby(lobbyId, playerName()).then(ok => {
      if (!ok) { toast("🚫 " + WB.t("That crew already rolled out."), "bad"); return; }
      resetLobby(); lobby.id = lobbyId; lobby.jobId = jobId; lobby.isHost = false;
      startLobbyWatch(); renderLobbyModal();
    });
  }
  function startLobbyWatch() {
    stopLobbyWatch();
    lobby.unsub = WB.CLOUD.watchLobby(lobby.id, d => { lobby.data = d; onLobbyUpdate(); });
    lobby.unsubMsgs = WB.CLOUD.watchLobbyMsgs(lobby.id, m => { lobby.msgs = m || []; renderLobbyMsgs(); });
  }
  function onLobbyUpdate() {
    if (!lobby.id) return;
    const d = lobby.data;
    if (!d || d.status === "closed") {
      const resolved = lobby.resolved;
      const open = modalIsOpen && document.getElementById("lobby-root");
      resetLobby();
      if (open) closeModal();
      if (!resolved) toast("👋 " + WB.t("The crew disbanded."), "bad");
      return;
    }
    if (d.status === "done" && !lobby.resolved && !lobby.isHost) { lobby.resolved = true; resolveLobbyMember(d); return; }
    if (!document.getElementById("lobby-root")) { leaveLobby(true); return; } // modal closed elsewhere → clean up
    if (d.status === "started" && !lobby.isHost) { const s = $("lobby-status"); if (s) { s.textContent = WB.t("Rolling out…"); s.className = "lobby-status go"; } return; }
    updateLobbyBody();
  }
  function renderLobbyModal() {
    const cr = lobbyJob();
    openModal(`
      <div class="lobby" id="lobby-root">
        <div class="lobby-hero">
          <div class="lobby-hero-ico">${cr ? cr.icon : "🦹"}</div>
          <div class="lobby-hero-main">
            <div class="lobby-hero-title">${cr ? esc(WB.t(cr.name)) : "Heist"}</div>
            <div class="lobby-hero-sub">${WB.t("Crew lobby — bigger crew, safer job, bigger score")}</div>
          </div>
          <span class="lobby-status" id="lobby-status">${WB.t("Waiting…")}</span>
        </div>
        <div class="lobby-section">${WB.t("Crew")}</div>
        <div class="lobby-members" id="lobby-members"></div>
        <div class="lobby-section">${WB.t("Invite players")}</div>
        <div class="lobby-invite" id="lobby-invites"></div>
        <div class="lobby-section">${WB.t("Lobby chat")}</div>
        <div class="lobby-chat">
          <div class="lobby-msgs" id="lobby-msgs"></div>
          <div class="lobby-chat-row"><input class="lobby-chat-input" id="lobby-chat-input" placeholder="${WB.t("Message the crew…")}" maxlength="200" autocomplete="off"><button class="btn primary lobby-send" id="lobby-send">➤</button></div>
        </div>
        <div class="lobby-foot" id="lobby-foot"></div>
      </div>`);
    const send = () => { const i = $("lobby-chat-input"); const t = (i.value || "").trim(); if (!t) return; WB.CLOUD.sendLobbyMsg(lobby.id, t, playerName()); i.value = ""; };
    $("lobby-send").onclick = send;
    $("lobby-chat-input").onkeydown = e => { if (e.key === "Enter") send(); };
    if (WB.CLOUD.fetchOnlinePlayers) WB.CLOUD.fetchOnlinePlayers(30).then(list => { lobby.online = list || []; if (document.getElementById("lobby-root")) updateLobbyBody(); });
    updateLobbyBody();
    renderLobbyMsgs();
  }
  function updateLobbyBody() {
    const d = lobby.data; if (!d || !$("lobby-members")) return;
    const members = d.members || {}, uids = Object.keys(members), me = WB.CLOUD.uid;
    const allReady = uids.length >= 2 && uids.every(u => members[u].ready);
    const stat = $("lobby-status");
    if (stat) { stat.textContent = allReady ? WB.t("Everyone's ready! 🔥") : uids.length < 2 ? WB.t("Invite your crew…") : WB.t("Waiting for crew…"); stat.className = "lobby-status" + (allReady ? " go" : ""); }
    $("lobby-members").innerHTML = uids.map(u => {
      const m = members[u], ini = (m.name || "?").trim().charAt(0).toUpperCase();
      return `<div class="lobby-member ${m.ready ? "ready" : ""}">
        <span class="lobby-avatar">${esc(ini)}</span>
        <span class="lobby-mname">${esc(m.name)}${u === me ? ` <span class="muted">(${WB.t("you")})</span>` : ""}</span>
        ${m.host ? `<span class="lobby-tag">HOST</span>` : ""}
        <span class="lobby-mstate"><span class="lobby-readydot"></span>${m.ready ? WB.t("Ready") : WB.t("Not ready")}</span>
      </div>`;
    }).join("");
    const inSet = new Set(uids), seen = new Set();
    const cands = [];
    (social.friends || []).filter(f => f.online).forEach(f => cands.push({ uid: f.uid, name: f.name, jailedUntil: f.jailedUntil, bail: f.bail }));
    (lobby.online || []).forEach(p => cands.push({ uid: p.uid, name: p.name }));
    const list = cands.filter(c => c.uid && !inSet.has(c.uid) && !seen.has(c.uid) && (seen.add(c.uid), true));
    $("lobby-invites").innerHTML = list.length ? list.map(c => {
      const ini = (c.name || "?").trim().charAt(0).toUpperCase();
      const jailed = c.jailedUntil && c.jailedUntil > Date.now();
      if (jailed) { // can't crew with a jailed player — offer to bail them instead
        return `<div class="lobby-invite-row jailed">
          <span class="lobby-avatar">${esc(ini)}</span>
          <span class="lobby-invite-name">🔒 ${esc(c.name)} — ${WB.t("in prison")}</span>
          <button class="lobby-invite-btn bail" data-bailuid="${esc(c.uid)}" data-bailname="${esc(c.name)}" data-bail="${Math.floor(c.bail || 0)}">⚖️ ${WB.t("Bail out?")}</button>
        </div>`;
      }
      const inv = lobby.invited[c.uid];
      return `<div class="lobby-invite-row">
        <span class="lobby-avatar">${esc(ini)}</span>
        <span class="lobby-invite-name">${esc(c.name)}</span>
        <button class="lobby-invite-btn ${inv ? "invited" : ""}" data-inv="${esc(c.uid)}" data-name="${esc(c.name)}" ${inv ? "disabled" : ""}>${inv ? WB.t("Invited ✓") : "＋ " + WB.t("Invite")}</button>
      </div>`;
    }).join("") : `<div class="fr-empty">${WB.t("No other players online right now — invite a friend to log on!")}</div>`;
    $("lobby-invites").querySelectorAll("[data-inv]").forEach(b => b.onclick = () => {
      WB.CLOUD.sendLobbyInvite(b.dataset.inv, lobby.id, lobby.jobId, (lobbyJob() || {}).name || "a heist", playerName());
      lobby.invited[b.dataset.inv] = true; toast(`📨 ${WB.t("Invited")} ${esc(b.dataset.name)}`, "good"); updateLobbyBody();
    });
    $("lobby-invites").querySelectorAll("[data-bailuid]").forEach(b => b.onclick = () => {
      const amt = Math.floor(Number(b.dataset.bail) || 0);
      if (amt > 0) confirmBailDialog(b.dataset.bailuid, b.dataset.bailname, amt);
      else toast(`🤷 ${esc(b.dataset.bailname)} ${WB.t("isn't in jail right now.")}`, "bad");
    });
    const myReady = members[me] && members[me].ready;
    let foot = `<button class="lobby-btn ready ${myReady ? "on" : ""}" id="lobby-ready">${myReady ? "✓ " + WB.t("Ready") : WB.t("Ready up")}</button>`;
    if (lobby.isHost) foot += `<button class="lobby-btn start" id="lobby-start" ${allReady ? "" : "disabled"}>🚀 ${WB.t("Start heist")}${uids.length >= 2 ? ` · ${uids.length}` : ""}</button>`;
    foot += `<button class="lobby-btn leave" id="lobby-leave">${WB.t("Leave")}</button>`;
    $("lobby-foot").innerHTML = foot;
    $("lobby-ready").onclick = () => WB.CLOUD.setLobbyReady(lobby.id, !myReady);
    if (lobby.isHost && $("lobby-start")) $("lobby-start").onclick = () => { if (allReady) startLobbyHeist(); };
    $("lobby-leave").onclick = () => leaveLobby();
  }
  function renderLobbyMsgs() {
    const box = $("lobby-msgs"); if (!box) return;
    const me = WB.CLOUD.uid;
    box.innerHTML = (lobby.msgs && lobby.msgs.length)
      ? lobby.msgs.map(m => `<div class="lmsg ${m.from === me ? "me" : ""}">${m.from !== me ? `<span class="lmsg-name">${esc(m.fromName || "?")}</span>` : ""}<span>${esc(m.text)}</span></div>`).join("")
      : `<div class="fr-empty">${WB.t("Say hi to the crew 👋")}</div>`;
    box.scrollTop = box.scrollHeight;
  }
  function startLobbyHeist() {
    const d = lobby.data; if (!d || !lobby.isHost) return;
    const cr = WB.CRIME.HARD_CRIMES.find(x => x.id === lobby.jobId);
    const pull = (planQ) => {
      if (planQ == null) return; // host backed out of planning
      const d2 = lobby.data; if (!d2 || !lobby.id) return;
      const uids = Object.keys(d2.members || {}), crew = uids.length;
      const r = WB.CRIME.commitHard(lobby.jobId, true, crew, planQ);
      if (!r || r.refused) { toast("🚫 " + ((r && r.refused) || "Can't start."), "bad"); return; }
      lobby.resolved = true;
      const id = lobby.id;
      WB.CLOUD.finishLobby(id, { win: r.win, payout: r.win ? r.money : 0, sentence: r.sentence || 0, by: playerName(), job: r.job });
      if (r.win) uids.forEach(u => { if (u !== WB.CLOUD.uid) WB.CLOUD.sendHeistCut(u, Math.floor(r.money * 0.35), playerName(), r.job); });
      stopLobbyWatch(); closeModal(); resetLobby();
      const reveal = () => { WB.CRIME.finalizeHardJob(r); if (WB.SOUND) WB.SOUND.play(r.win ? "win" : "lose"); openResult(r); renderTab(true); renderHud(); };
      if (WB.ROOM && WB.ROOM.play) WB.ROOM.play(r.win ? "heistDuo" : "heistBustDuo", reveal); else reveal();
      setTimeout(() => { if (WB.CLOUD.closeLobby) WB.CLOUD.closeLobby(id); }, 9000);
    };
    if (WB.PLANNING && WB.PLANNING.openPlan && cr) WB.PLANNING.openPlan(cr, pull); else pull(0.6);
  }
  function resolveLobbyMember(d) {
    const res = d.result || {};
    stopLobbyWatch(); const open = modalIsOpen && document.getElementById("lobby-root");
    resetLobby(); if (open) closeModal();
    const win = !!res.win;
    const done = () => {
      if (win) toast(`🤝 ${esc(res.by || "The crew")} ${WB.t("pulled off the")} ${esc(res.job || "job")} — ${WB.t("your cut's on the way!")}`, "good");
      else {
        // a failed heist takes the WHOLE crew down — you're booked too.
        if (WB.CRIME && !WB.CRIME.inPrison()) WB.CRIME.goToPrison(res.sentence || 300, (res.job || "a heist") + " (crew)", true);
        toast(`🚔 ${WB.t("The")} ${esc(res.job || "job")} ${WB.t("went bad — the whole crew got nicked.")}`, "bad");
      }
      renderTab(true); renderHud();
    };
    if (WB.ROOM && WB.ROOM.play) WB.ROOM.play(win ? "heistDuo" : "heistBustDuo", done); else done();
  }
  // incoming invite popup
  let invitePop = null;
  function showInvitePopup(g) {
    if (lobby.id === g.lobbyId) return; // already in it
    if (invitePop) invitePop.remove();
    const cr = WB.CRIME.HARD_CRIMES.find(x => x.id === g.jobId);
    const icon = cr ? cr.icon : "🦹", job = g.jobName || (cr && cr.name) || "a heist";
    const pop = document.createElement("div");
    pop.className = "invite-pop";
    pop.innerHTML = `
      <div class="invite-card">
        <div class="invite-glow"></div>
        <div class="invite-ico">${icon}</div>
        <div class="invite-from"><b>${esc(g.fromName || "A player")}</b> ${WB.t("invites you to")}</div>
        <div class="invite-job">${esc(job)}</div>
        <div class="invite-sub">${WB.t("Join the crew — lower risk, bigger score, and a cut for you.")}</div>
        <div class="invite-timer"><div class="invite-timer-fill" id="inv-fill"></div></div>
        <div class="invite-actions">
          <button class="btn subtle invite-decline" id="inv-no">${WB.t("Decline")}</button>
          <button class="btn primary invite-join" id="inv-yes">🤝 ${WB.t("Join")}</button>
        </div>
      </div>`;
    document.body.appendChild(pop);
    invitePop = pop;
    toast(`🤝 ${esc(g.fromName || "A player")} ${WB.t("invited you to a heist!")}`, "good");
    const TOTAL = 30000, start = Date.now(), fill = pop.querySelector("#inv-fill");
    const iv = setInterval(() => { const left = Math.max(0, TOTAL - (Date.now() - start)); if (fill) fill.style.width = (left / TOTAL * 100) + "%"; if (left <= 0) close(); }, 150);
    function close() { clearInterval(iv); if (pop.parentNode) pop.remove(); if (invitePop === pop) invitePop = null; }
    pop.querySelector("#inv-no").onclick = close;
    pop.querySelector("#inv-yes").onclick = () => { close(); joinLobbyFlow(g.lobbyId, g.jobId); };
  }

  // ============================================================ 🕴️ Mafia / Syndicate (persistent gang)
  const gang = { id: null, data: null, unsub: null, online: [] };
  WB.GANG = gang; // exposed so the turf-map / war module can read the player's syndicate
  function watchMyGang() {
    if (!WB.CLOUD || !WB.CLOUD.enabled || !gang.id) return;
    if (gang.unsub) { gang.unsub(); gang.unsub = null; }
    gang.unsub = WB.CLOUD.watchGang(gang.id, d => {
      if (!d) { // disbanded by the boss
        gang.data = null; gang.id = null; try { localStorage.removeItem("wb_gang"); } catch (e) {}
        if (gang.unsub) { gang.unsub(); gang.unsub = null; }
        return;
      }
      gang.data = d;
    });
    if (WB.CLOUD.fetchOnlinePlayers) WB.CLOUD.fetchOnlinePlayers(20).then(l => { gang.online = l || []; });
  }
  function loadGang() {
    try { gang.id = localStorage.getItem("wb_gang") || null; } catch (e) {}
    if (gang.id) watchMyGang();
  }
  function createGangFlow(name) {
    if (!WB.CLOUD || !WB.CLOUD.enabled) { toast("☁️ " + WB.t("Syndicates need you online."), "bad"); return; }
    WB.CLOUD.createGang(name, playerName()).then(id => {
      if (!id) { toast("☁️ " + WB.t("Couldn't form the family."), "bad"); return; }
      gang.id = id; try { localStorage.setItem("wb_gang", id); } catch (e) {}
      watchMyGang(); if (WB.SOUND) WB.SOUND.play("win");
      toast("🕴️ " + WB.t("The family is born. Welcome, boss."), "good"); renderTab(true);
    });
  }
  function joinGangFlow(gangId) {
    WB.CLOUD.joinGang(gangId, playerName()).then(ok => {
      if (!ok) { toast("🚫 " + WB.t("That family's already gone."), "bad"); return; }
      gang.id = gangId; try { localStorage.setItem("wb_gang", gangId); } catch (e) {}
      watchMyGang(); if (WB.SOUND) WB.SOUND.play("coin");
      toast("🤝 " + WB.t("You're in the family now."), "good"); renderTab(true);
    });
  }
  function leaveGangFlow() {
    if (!gang.id) return;
    const isBoss = gang.data && gang.data.boss === WB.CLOUD.uid;
    if (WB.CLOUD.leaveGang) WB.CLOUD.leaveGang(gang.id, isBoss);
    if (gang.unsub) { gang.unsub(); gang.unsub = null; }
    gang.id = null; gang.data = null; try { localStorage.removeItem("wb_gang"); } catch (e) {}
    toast(isBoss ? "🕴️ " + WB.t("You disbanded the family.") : "👋 " + WB.t("You left the family."), "bad"); renderTab(true);
  }
  // Kick a `rate` cut of any score up to the family pot. Returns the cut paid
  // (0 if you're not in a gang or offline). Used by every crime + every heist.
  function feedPot(amount, rate) {
    if (!(amount > 0) || !gang.id || !WB.CLOUD || !WB.CLOUD.enabled || !WB.CLOUD.contributeToGang) return 0;
    const cut = Math.floor(amount * (rate || 0.1));
    if (cut > 0) WB.CLOUD.contributeToGang(gang.id, cut);
    return cut;
  }
  function claimGangPotFlow() {
    if (!gang.id || !WB.CLOUD.claimGangPot) return;
    WB.CLOUD.claimGangPot(gang.id, playerName()).then(share => {
      if (share > 0) { if (WB.SOUND) WB.SOUND.play("cash"); toast(`💰 ${WB.t("Pot split — by the cuts you set")}`, "good"); }
      else toast(WB.t("The pot's empty right now."), "bad");
    });
  }
  const GANG_ROLES = ["Underboss", "Consigliere", "Capo", "Enforcer", "Soldier", "Associate"];
  function openGangMemberDialog(uid, name) {
    const m = (gang.data && gang.data.members && gang.data.members[uid]) || {};
    const ov = document.createElement("div");
    ov.className = "amt-dialog";
    ov.innerHTML = `<div class="amt-card">
      <div class="amt-ico">🕴️</div>
      <h3>${esc(name)}</h3>
      <label class="set-label">${WB.t("Role")}</label>
      <select class="set-input" id="gm-role">${GANG_ROLES.map(r => `<option value="${r}" ${m.role === r ? "selected" : ""}>${WB.t(r)}</option>`).join("")}</select>
      <label class="set-label">${WB.t("Cut of the pot (%) — 0 = even split")}</label>
      <input class="set-input" id="gm-cut" type="text" inputmode="numeric" value="${Math.floor(m.cut || 0)}">
      <div class="amt-row"><button class="btn subtle" id="gm-cancel">${WB.t("Cancel")}</button><button class="btn primary" id="gm-save">${WB.t("Save")}</button></div>
    </div>`;
    $("modal-content").appendChild(ov);
    const close = () => ov.remove();
    ov.querySelector("#gm-cancel").onclick = close;
    ov.querySelector("#gm-save").onclick = () => {
      const role = ov.querySelector("#gm-role").value;
      const cut = Math.max(0, Math.min(100, Math.floor(Number((ov.querySelector("#gm-cut").value || "").replace(/[^0-9]/g, "")) || 0)));
      if (gang.id && WB.CLOUD.setGangMember) WB.CLOUD.setGangMember(gang.id, uid, role, cut);
      toast(`🕴️ ${esc(name)} → ${WB.t(role)}${cut ? ` · ${cut}%` : ""}`, "good");
      close();
    };
  }
  function gangPanel() {
    if (!WB.CLOUD || !WB.CLOUD.enabled) return `<div class="gang-empty">🕴️ ${WB.t("Connect online to run a syndicate.")}</div>`;
    if (!gang.id || !gang.data) {
      return `<div class="gang-create">
        <div class="gang-section">🕴️ ${WB.t("Start a Syndicate")}</div>
        <p class="muted" style="margin:0 0 8px">${WB.t("Form a family, recruit your crew, seize city districts on the turf map, and a cut of every score feeds a shared pot the boss splits.")}</p>
        <input class="gang-create-input" id="gang-name" placeholder="${WB.t("Family name…")}" maxlength="24" autocomplete="off">
        <button class="gang-btn claim" data-act="gangcreate" style="margin-top:8px">🕴️ ${WB.t("Form the family")}</button>
      </div>`;
    }
    // Compact card in the crime tab — the whole thing opens the manager popup.
    const d = gang.data, members = d.members || {}, uids = Object.keys(members);
    return `
      <div class="gang-card">
        <button class="gang-hero gang-hero-btn" data-act="gangmanage" title="${WB.t("Manage the family")}">
          <div class="gang-hero-ico">🕴️</div>
          <div class="gang-hero-main">
            <div class="gang-name">${esc(d.name || "The Family")} <span class="gang-cog">⚙️</span></div>
            <div class="gang-hero-sub">${uids.length} ${WB.t("made members")} · ${WB.t("tap to manage")}</div>
          </div>
        </button>
        <div class="gang-pot-box"><div class="gang-pot">${WB.fmt(d.pot || 0, true)}</div><div class="gang-pot-label">${WB.t("Syndicate pot")}</div></div>
        <div class="gang-quick">
          <button class="gang-btn turf" data-act="turfmap">🗺️ ${WB.t("Turf map")}</button>
          <button class="gang-btn" data-act="gangmanage">⚙️ ${WB.t("Manage family")}</button>
        </div>
      </div>`;
  }
  // ---------- Mafia management popup (name/pot/members/cuts/turf in one screen) ----------
  let gangMgrTimer = null;
  function gangManagerBody() {
    const d = gang.data;
    if (!d) return `<div class="gang-empty">${WB.t("The family is gone.")}</div>`;
    const members = d.members || {}, uids = Object.keys(members), me = WB.CLOUD.uid;
    const isBoss = d.boss === me;
    const memberHtml = uids.map(u => {
      const m = members[u], ini = (m.name || "?").trim().charAt(0).toUpperCase();
      const role = m.boss ? "BOSS" : (m.role || "Soldier");
      const cutTxt = m.boss ? "" : (m.cut > 0 ? `${m.cut}%` : WB.t("even"));
      return `<div class="gang-member">
        <span class="gang-avatar">${esc(ini)}</span>
        <span class="gang-mname">${esc(m.name)}${u === me ? ` <span class="muted">(${WB.t("you")})</span>` : ""}<span class="gang-role">${esc(WB.t(role))}${cutTxt ? ` · ${cutTxt}` : ""}</span></span>
        ${m.boss ? `<span class="gang-boss-tag">BOSS</span>` : (isBoss ? `<button class="gang-edit" data-act="gangedit" data-key="${esc(u)}" data-name="${esc(m.name)}" title="Set role &amp; cut">✎</button>` : "")}
      </div>`;
    }).join("");
    const inSet = new Set(uids), seen = new Set(), cands = [];
    (social.friends || []).filter(f => f.online).forEach(f => cands.push({ uid: f.uid, name: f.name }));
    (gang.online || []).forEach(p => cands.push({ uid: p.uid, name: p.name }));
    const invites = cands.filter(c => c.uid && !inSet.has(c.uid) && !seen.has(c.uid) && (seen.add(c.uid), true)).slice(0, 8);
    const inviteHtml = invites.length ? invites.map(c => {
      const ini = (c.name || "?").trim().charAt(0).toUpperCase();
      return `<div class="gang-invite-row"><span class="gang-avatar">${esc(ini)}</span><span class="gang-invite-name">${esc(c.name)}</span><button class="gang-invite-btn" data-act="ganginvite" data-key="${esc(c.uid)}" data-name="${esc(c.name)}">＋ ${WB.t("Invite")}</button></div>`;
    }).join("") : `<div class="gang-empty">${WB.t("No one online to recruit right now.")}</div>`;
    const bossRename = isBoss ? `<div class="gang-rename"><input class="gang-create-input" id="gm-rename-in" maxlength="24" placeholder="${WB.t("Rename the family…")}" value="${esc(d.name || "")}"><button class="gang-btn" data-act="gangrename">${WB.t("Rename")}</button></div>` : "";
    return `
      <div class="gm-hero">
        <div class="gm-ico">🕴️</div>
        <div class="gm-id"><b>${esc(d.name || "The Family")}</b><span class="muted">${uids.length} ${WB.t("made members")} · ${isBoss ? WB.t("You're the boss") : WB.t("You're in the family")}</span></div>
      </div>
      <div class="gm-potbar">
        <div><div class="gang-pot">${WB.fmt(d.pot || 0, true)}</div><div class="gang-pot-label">${WB.t("Syndicate pot")} · ${WB.t("every score kicks up a cut")}</div></div>
        ${isBoss ? `<button class="gang-btn claim" data-act="gangclaim" ${(d.pot || 0) > 0 ? "" : "disabled"}>💰 ${WB.t("Split the pot")}</button>` : ""}
      </div>
      ${bossRename}
      <div class="gang-section">${WB.t("The Family")}${isBoss ? ` <span class="muted" style="font-weight:400">— ${WB.t("tap ✎ to set role & cut")}</span>` : ""}</div>
      <div class="gang-members">${memberHtml}</div>
      <div class="gang-section">${WB.t("Recruit")}</div>
      <div class="gang-invite">${inviteHtml}</div>
      <div class="gang-section">${WB.t("Turf")}</div>
      <div class="gm-turf">
        <span id="gm-turf-count" class="muted">${WB.t("Districts held")}: …</span>
        <button class="gang-btn turf" data-act="turfmap">🗺️ ${WB.t("Open the turf map")}</button>
      </div>
      <div class="gang-foot"><button class="gang-btn leave" data-act="gangleave">${isBoss ? WB.t("Disband the family") : WB.t("Leave the family")}</button></div>`;
  }
  function wireGangManagerButtons() {
    $("modal-content").querySelectorAll("#gm-root [data-act]").forEach(b =>
      b.onclick = () => handleGangAction(b.dataset.act, b.dataset.key, b.dataset.name));
  }
  function refreshGangManager() {
    const root = document.getElementById("gm-root"); if (!root) return;
    root.innerHTML = gangManagerBody();
    WB.I18N.translateDom(root);
    wireGangManagerButtons();
    updateGmTurf();
  }
  function updateGmTurf() {
    if (!WB.CLOUD || !WB.CLOUD.fetchDistricts || !gang.id) return;
    WB.CLOUD.fetchDistricts().then(m => {
      const n = Object.values(m || {}).filter(x => x.owner === gang.id).length;
      const el = document.getElementById("gm-turf-count");
      if (el) el.textContent = `${WB.t("Districts held")}: ${n}`;
    });
  }
  function handleGangAction(act, key, name) {
    if (act === "gangclaim") claimGangPotFlow();
    else if (act === "gangleave") { leaveGangFlow(); closeModal(); return; }
    else if (act === "gangedit") { openGangMemberDialog(key, name); return; }
    else if (act === "ganginvite") { if (WB.CLOUD && WB.CLOUD.sendGangInvite && gang.id) { WB.CLOUD.sendGangInvite(key, gang.id, (gang.data && gang.data.name) || "the family", playerName()); toast(`📨 ${WB.t("Invited")} ${esc(name || "")}`, "good"); } }
    else if (act === "gangrename") { const n = ($("gm-rename-in") && $("gm-rename-in").value || "").trim(); if (n && gang.id && WB.CLOUD.renameGang) { WB.CLOUD.renameGang(gang.id, n); toast("🕴️ " + WB.t("The family has a new name."), "good"); } }
    else if (act === "turfmap") { closeModal(); if (WB.TURF && WB.TURF.open) WB.TURF.open(); return; }
    setTimeout(refreshGangManager, 250);
  }
  function openGangManager() {
    if (!gang.id || !gang.data) { toast("🕴️ " + WB.t("Form a syndicate first."), "bad"); return; }
    openModal(`<div id="gm-root">${gangManagerBody()}</div><button class="btn subtle wide" id="gm-close" style="margin-top:12px">${WB.t("Close")}</button>`);
    $("gm-close").onclick = closeModal;
    wireGangManagerButtons();
    updateGmTurf();
    if (gangMgrTimer) clearInterval(gangMgrTimer);
    gangMgrTimer = setInterval(() => {
      if (!modalIsOpen || !document.getElementById("gm-root")) { clearInterval(gangMgrTimer); gangMgrTimer = null; return; }
      if (!gang.data) { closeModal(); return; }
      refreshGangManager();
    }, 1200);
  }
  // incoming gang invite popup (reuses the invite-pop styling)
  function showGangInvitePopup(g) {
    if (gang.id === g.gangId) return;
    const pop = document.createElement("div");
    pop.className = "invite-pop";
    pop.innerHTML = `
      <div class="invite-card">
        <div class="invite-glow"></div>
        <div class="invite-ico">🕴️</div>
        <div class="invite-from"><b>${esc(g.fromName || "A boss")}</b> ${WB.t("wants you in")}</div>
        <div class="invite-job">${esc(g.gangName || "the family")}</div>
        <div class="invite-sub">${WB.t("Join the syndicate — earn together from every mafia job.")}</div>
        <div class="invite-actions">
          <button class="btn subtle invite-decline" id="ginv-no">${WB.t("Decline")}</button>
          <button class="btn primary invite-join" id="ginv-yes">🤝 ${WB.t("Join the family")}</button>
        </div>
      </div>`;
    document.body.appendChild(pop);
    if (WB.SOUND) WB.SOUND.play("open");
    const close = () => { if (pop.parentNode) pop.remove(); };
    pop.querySelector("#ginv-no").onclick = close;
    pop.querySelector("#ginv-yes").onclick = () => { close(); joinGangFlow(g.gangId); };
  }

  // ---------- Empire tab (secret endgame) ----------
  function tabEmpire() {
    const E = WB.EMPIRE;
    const rk = E.rank();
    let html = `
      <div class="empire-hero">
        <div class="empire-hero-top"><b>🪐 The Empire</b><span class="empire-rank">👑 ${rk.title}</span></div>
        <div class="empire-sub">${WB.fmt(E.income(), true)}/s ${WB.t("flat income from")} ${rk.owned}/${rk.total} ${WB.t("acquisitions — an empire pays rent, it doesn't print.")}</div>
      </div>`;
    E.VENTURES.forEach(v => {
      const stage = E.stageOf(v.id);
      const next = E.nextStage(v.id);
      html += `<div class="card col empire-venture">
        <div class="career-head"><b>${v.icon} ${v.name}</b><span class="tag">${stage + 1}/${v.stages.length}</span></div>
        <div class="muted" style="margin-top:-2px">${WB.t(v.tagline)}</div>
        <div class="career-path muted">${v.stages.map((x2, i) => i <= stage ? `<b class="done">${x2.name}</b>` : x2.name).join(" → ")}</div>
        ${stage >= 0 ? `<div class="empire-flavor">“${v.stages[stage].flavor}”</div>` : ""}
        ${next
          ? `<button class="btn buy wide ${st.money >= next.cost ? "" : "locked"}" data-act="venture" data-key="${v.id}">
              ${next.cutscene ? "🎬 " : ""}${next.name}<span class="cost">${WB.fmt(next.cost, true)}</span></button>
            <div class="req muted">+${WB.fmt(next.income, true)}/s ${WB.t("flat income")} · ${WB.t("pays itself back in")} ${WB.fmtTime(next.cost / next.income)}</div>`
          : `<span class="tag gold">EMPIRE COMPLETE</span>`}
      </div>`;
    });
    return html;
  }

  // tab bar is rebuilt when the secret unlock state changes
  let lastTabsSig = "";
  function renderTabBar() {
    const E = WB.EMPIRE;
    const mode = !E ? "none" : E.unlocked() ? "open" : E.teased() ? "tease" : "none";
    if (mode === lastTabsSig) return;
    lastTabsSig = mode;
    let html = Object.entries(TABS).map(([k, label]) =>
      `<button class="tab-btn ${k === activeTab ? "active" : ""}" data-tab="${k}">${WB.t(label)}</button>`).join("");
    if (mode === "open") html += `<button class="tab-btn empire ${activeTab === "empire" ? "active" : ""}" data-tab="empire">🪐 ${WB.t("Empire")}</button>`;
    else if (mode === "tease") html += `<button class="tab-btn secret" data-tab="empire-locked" title="Something colossal unlocks at ${WB.fmt(E.UNLOCK_NW, true)} net worth">🔒 ???</button>`;
    $("tabs").innerHTML = html;
  }

  // ---------- Activity bar (free vs jail) ----------
  let lastActBarJailed = null;
  // The Focus is chosen from ONE compact picker that opens a grouped popover —
  // far cleaner than a wall of buttons, and it frees vertical space for the room.
  const FOCUS_GROUPS = [
    { name: "Hustles", icon: "💼", keys: ["code", "content", "crypto", "ai", "gamedev", "mafia"] },
    { name: "Grow & Live", icon: "🌿", keys: ["study", "rest", "grass"] },
  ];
  const JAIL_FOCUS_GROUPS = [
    { name: "Behind Bars", icon: "🔒", keys: ["workout", "yard", "study", "rest"] },
  ];
  let focusPanelOpen = false;
  function buildFocusPicker() {
    $("activities").innerHTML = `<button class="focus-card" id="focus-card" title="${WB.t("Change what you're doing")}">
      <span class="focus-card-icon" id="focus-card-icon">💻</span>
      <span class="focus-card-main">
        <span class="focus-card-label">${WB.t("DOING")}</span>
        <span class="focus-card-name" id="focus-card-name">—</span>
      </span>
      <span class="focus-card-chev">▾</span>
    </button>`;
    updateFocusCard();
  }
  // keep the focus valid for the context (jailed ↔ free)
  function fixFocusForContext(jailed) {
    if (jailed && !["workout", "yard", "study", "rest"].includes(st.focus)) WB.GAME.setFocus("yard");
    if (!jailed && D.ACTIVITIES[st.focus] && D.ACTIVITIES[st.focus].jailOnly) WB.GAME.setFocus("code");
  }
  function updateFocusCard() {
    const a = D.ACTIVITIES[st.focus] || D.ACTIVITIES.code;
    const ic = $("focus-card-icon"), nm = $("focus-card-name");
    if (ic) ic.textContent = a.icon;
    if (nm) nm.textContent = WB.t(a.name);
  }
  function renderFocusPanel() {
    const p = $("focus-panel"); if (!p) return;
    const jailed = !!(WB.CRIME && WB.CRIME.inPrison());
    const groups = jailed ? JAIL_FOCUS_GROUPS : FOCUS_GROUPS;
    p.innerHTML = `<div class="focus-panel-head"><b>${WB.t("What are you doing?")}</b></div>` +
      groups.map(g => {
        const rows = g.keys.map(k => {
          const a = D.ACTIVITIES[k]; if (!a) return "";
          const locked = a.reqEra && st.era < a.reqEra;
          const active = st.focus === k;
          return `<button class="focus-opt ${active ? "active" : ""} ${locked ? "locked" : ""}" data-focus="${k}"${locked ? ` title="${WB.t("Unlocks in")} ${D.ERAS[a.reqEra].year}"` : ""}>
            <span class="focus-opt-ico">${a.icon}</span><span class="focus-opt-name">${WB.t(a.name)}</span>${locked ? `<span class="focus-opt-tag">🔒</span>` : (active ? `<span class="focus-opt-tag now">●</span>` : "")}</button>`;
        }).join("");
        return `<div class="focus-group"><div class="focus-group-h">${g.icon} ${WB.t(g.name)}</div><div class="focus-group-grid">${rows}</div></div>`;
      }).join("");
  }
  function openFocusPanel() {
    let p = $("focus-panel");
    if (!p) {
      p = document.createElement("div");
      p.id = "focus-panel";
      document.body.appendChild(p);
      p.addEventListener("click", e => {
        e.stopPropagation();
        const b = e.target.closest("[data-focus]");
        if (!b || b.classList.contains("locked")) return;
        if (WB.SOUND) WB.SOUND.play("click");
        WB.GAME.setFocus(b.dataset.focus);
        closeFocusPanel();
        updateFocusCard(); renderHud();
      });
    }
    renderFocusPanel();
    focusPanelOpen = true;
    const card = $("focus-card"); if (!card) return;
    const r = card.getBoundingClientRect();
    p.classList.add("open");
    const pw = p.offsetWidth || 320;
    p.style.left = Math.min(Math.max(12, r.left + r.width / 2 - pw / 2), innerWidth - pw - 12) + "px";
    p.style.bottom = (innerHeight - r.top + 10) + "px";
  }
  function closeFocusPanel() { focusPanelOpen = false; const p = $("focus-panel"); if (p) p.classList.remove("open"); }
  function toggleFocusPanel() { focusPanelOpen ? closeFocusPanel() : openFocusPanel(); }

  let tabHovered = false; // periodic refreshes pause while the pointer is in the panel (anti hover-flicker)
  function renderTab(force) {
    if (!force && tabHovered) return;
    let html;
    if (activeTab === "shop") html = subBar("shop") + (sub.shop === "gear" ? tabStore() : tabAssets());
    else if (activeTab === "profile") html = subBar("profile") + (sub.profile === "skills" ? tabSkills() : sub.profile === "awards" ? tabAchievements() : tabStats());
    else if (activeTab === "challenges") { html = subBar("challenges") + (sub.challenges === "list" ? tabChallenges() : tabLeaderboard()); }
    else html = ({ careers: tabCareers, crime: tabCrime, prestige: tabPrestige, empire: tabEmpire }[activeTab] || tabStore)();
    if (html !== lastTabHtml || force) {
      lastTabHtml = html;
      $("tab-content").innerHTML = html;
      WB.I18N.translateDom($("tab-content"));
    }
  }

  function onTabClick(e) {
    const subBtn = e.target.closest("[data-sub]");
    if (subBtn) { sub[activeTab] = subBtn.dataset.sub; renderTab(true); return; }
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const G = WB.GAME;
    const act = btn.dataset.act, key = btn.dataset.key;
    if (act === "crime") {
      const r = WB.CRIME.commit(key);
      if (r && r.refused) { toast("🚫 " + r.refused, "bad"); }
      else if (r) {
        const cr = WB.CRIME.CRIMES.find(x => x.id === key);
        // EVERY score kicks up to the family — mafia rackets pay a fat 25% cut,
        // every other job a standard 10% street tax. The boss splits the pot.
        if (r.win && cr && !cr.launder && r.money > 0) {
          const fed = feedPot(r.money, cr.mafia ? 0.25 : 0.10);
          if (fed > 0) r.lines = (r.lines || []).concat(`🕴️ ${WB.fmt(fed, true)} ${WB.t("into the syndicate pot.")}`);
        }
        if (WB.SOUND) WB.SOUND.play(r.win ? (cr && cr.launder ? "open" : "cash") : "error");
        openResult({ ...r, money: r.money });
      }
    }
    else if (act === "gangcreate") { const n = ($("gang-name") && $("gang-name").value || "").trim(); if (!n) { toast(WB.t("Name your family first."), "bad"); return; } createGangFlow(n); return; }
    else if (act === "gangclaim") { claimGangPotFlow(); return; }
    else if (act === "gangleave") { leaveGangFlow(); return; }
    else if (act === "ganginvite") { if (WB.CLOUD && WB.CLOUD.sendGangInvite && gang.id) { WB.CLOUD.sendGangInvite(key, gang.id, (gang.data && gang.data.name) || "the family", playerName()); toast(`📨 ${WB.t("Invited")} ${esc(btn.dataset.name || "")}`, "good"); } return; }
    else if (act === "gangrename") { const n = ($("gang-rename-in") && $("gang-rename-in").value || "").trim(); if (n && gang.id && WB.CLOUD.renameGang) { WB.CLOUD.renameGang(gang.id, n); toast("🕴️ " + WB.t("The family has a new name."), "good"); } return; }
    else if (act === "gangedit") { openGangMemberDialog(key, btn.dataset.name); return; }
    else if (act === "gangmanage") { openGangManager(); return; }
    else if (act === "turfmap") { if (WB.TURF && WB.TURF.open) WB.TURF.open(); return; }
    else if (act === "venture") {
      const r = WB.EMPIRE.buyNext(key);
      if (r.refused) toast("🚫 " + r.refused, "bad");
      else {
        confetti();
        toast(`${r.venture.icon} EMPIRE: ${r.stage.name} — +${WB.fmt(r.stage.income, true)}/s base!`, "era");
        bubble(r.stage.flavor);
        if (r.cutscene && WB.ROOM.play) WB.ROOM.play(r.cutscene); // roll the movie 🎬
      }
    }
    else if (act === "bail") WB.CRIME.postBail();
    else if (act === "claimchal") { claimChallenge(key); return; }
    else if (act === "trackchal") { toggleTrackChallenge(key); return; }
    else if (act === "hardjob") { doHardJob(key, false); return; }
    else if (act === "heistfriend") { openLobbyCreate(key); return; }
    else if (act === "buygear") {
      const r = WB.CRIME.buyGear(key);
      if (!r.ok) { toast("🚫 " + WB.t(r.why), "bad"); }
      else { if (WB.SOUND) WB.SOUND.play("cash"); toast(`🧰 ${r.gear.icon} ${WB.t(r.gear.name)} — ${WB.t("added to your kit.")}`, "good"); renderTab(true); renderHud(); }
      return;
    }
    else if (act === "crimecat") { crimeCat = key; }
    else if (act === "lbrefresh") { loadLeaderboard(); return; }
    else if (act === "openscam") WB.SCAM.open();
    else if (act === "dopost") { const r = WB.ACTIONS.start("social"); if (r && r.refused) toast("😮‍💨 " + r.refused, "bad"); }
    else if (act === "equip") G.buyEquipment(key);
    else if (act === "housing") G.buyHousing();
    else if (act === "career") G.advanceCareer(key);
    else if (act === "cryptobuy") G.buyCrypto(0.25);
    else if (act === "cryptosell") G.sellCrypto();
    else if (act === "lifestyle") WB.ASSETS.buyLifestyle(key);
    else if (act === "useitem") WB.ASSETS.useLifestyle(key);
    else if (act === "hire") WB.ASSETS.hire(key);
    else if (act === "fire") WB.ASSETS.fire(key);
    else if (act === "invbuy10") WB.ASSETS.investBuy(key, 0.10);
    else if (act === "invbuy25") WB.ASSETS.investBuy(key, 0.25);
    else if (act === "invsell") WB.ASSETS.investSell(key);
    else if (act === "pupgrade") G.buyPrestigeUpgrade(key);
    else if (act === "prestige") {
      if (G.legacyGain() > 0 && confirm(`Rebirth now for +${G.legacyGain()} Legacy Points? Your current life resets.`)) G.doPrestige();
    }
    renderTab(true);
  }

  // ============================================================ Header / left panel
  function setBar(id, pct, txt) {
    $(id + "-fill").style.width = Math.max(0, Math.min(100, pct)) + "%";
    if (txt !== undefined) $(id + "-txt").textContent = txt;
  }

  // ---------- Living status (what is he doing right now?) ----------
  const STATUS_BY_FOCUS = {
    code:    ["💻", "Writing Code", "shipping features (and bugs)"],
    content: ["🎥", "Making Content", "cameras flashing, fame loading"],
    crypto:  ["🪙", "Trading Crypto", "watching candles like a hawk"],
    ai:      ["🤖", "Building AI", "teaching the machine to hustle"],
    gamedev: ["🕹️", "Making Games", "one more playtest, promise"],
    study:   ["📚", "Studying", "brain gains in progress"],
    rest:    ["😴", "Sleeping", "snoring at championship level"],
    grass:   ["🌱", "Touching Grass", "outside??? character growth"],
    workout: ["🏋️", "Working Out", "getting swole in the yard"],
    yard:    ["🌳", "Yard Time", "pacing the perimeter, plotting"],
    poop:    ["💩", "On the Toilet", "very important business"],
  };
  // running the family rotates through "mafia things" so the doing-bar feels alive
  const MAFIA_PHASES = [
    ["🕴️", "Running Rackets", "collecting envelopes on the block"],
    ["🗺️", "Planning a Move", "marking the map, picking the next target"],
    ["📞", "Working the Phones", "calling in favors, making offers"],
    ["👥", "Looking for Members", "scouting fresh muscle for the crew"],
    ["💼", "Counting the Take", "stacking it, skimming it, washing it"],
    ["🤝", "A Quiet Sit-Down", "settling business over espresso"],
  ];
  // what the jail-bound entrepreneur is doing right now (by focus)
  const JAIL_STATUS = {
    workout: ["🏋️", "Prison Workout", "push-ups, pull-ups, protein loaf"],
    yard:    ["🌳", "Yard Time", "walking the yard, making 'connections'"],
    study:   ["📚", "Jailhouse Law", "reading law books, filing appeals"],
    rest:    ["😴", "Doing Time", "staring at the bunk above"],
  };
  function moodFace(r) {
    const m = (r.happiness + r.motivation) / 2 - r.stress * 0.35 - (r.hygiene != null && r.hygiene < 30 ? 14 : 0);
    if (m >= 70) return "😄 Great";
    if (m >= 45) return "🙂 Fine";
    if (m >= 25) return "😕 Meh";
    return "😩 Rough";
  }
  function cellNumber() {
    const c = WB.CRIME ? WB.CRIME.crimeState() : { timesCaught: 0 };
    return (3 + (c.timesCaught % 6)) + "" + "ABC"[c.timesCaught % 3];
  }
  // where does he live right now? Empire space stages move him off-planet
  function homeName() {
    const st2 = WB.EMPIRE ? WB.EMPIRE.stageOf("space") : -1;
    if (st2 >= 6) return "🔴 " + WB.t("Mars Colony");
    if (st2 >= 4) return "🌕 " + WB.t("Lunar Base Alpha");
    return WB.t(D.HOUSING[st.housing].name);
  }
  let wasJailed = null;
  function renderStatus() {
    // during the arrest/release cutscenes the room is a movie set — the jail
    // chrome (bars, badges) waits until the cutscene lands you in the cell
    const inCut = WB.ROOM && WB.ROOM.cutActive && WB.ROOM.cutActive();
    const jailed = WB.CRIME && WB.CRIME.inPrison() && !inCut;
    const panel = $("char-panel"), room = $("room-wrap");
    if (jailed !== wasJailed) { // toggle classes only on change for clean CSS transitions
      wasJailed = jailed;
      panel.classList.toggle("jailed", jailed);
      room.classList.toggle("jailed", jailed);
      $("cell-badge").style.display = jailed ? "" : "none";
      if (jailed) $("cell-badge").textContent = "🔒 CELL " + cellNumber();
    }
    if (inCut) return; // cutscene owns the screen; keep last status text
    if (jailed) {
      const c = WB.CRIME.crimeState();
      const [ji, jl, js2] = JAIL_STATUS[st.focus] || ["🚔", "Doing Time", c.prisonReason || "thinking about choices"];
      $("status-icon").textContent = ji;
      $("status-label").textContent = WB.t(jl);
      $("status-sub").textContent = WB.fmtTime(WB.CRIME.prisonLeft() / 1000) + " " + WB.t("left") + " · " + WB.t(js2);
      $("housing-name").textContent = "🔒 " + WB.t("County Jail · Cell") + " " + cellNumber();
      return;
    }
    if (st.bathroom) {
      $("status-icon").textContent = "🚽";
      $("status-label").textContent = WB.t("Bathroom Break");
      $("status-sub").textContent = WB.t("very important business");
      $("housing-name").textContent = homeName();
      return;
    }
    if (st.focus === "mafia") {
      // running rackets isn't "coding" — give the mob its own rotating status so
      // the doing-bar reads "planning / looking for members / counting the take".
      const p = MAFIA_PHASES[Math.floor(Date.now() / 3500) % MAFIA_PHASES.length];
      $("status-icon").textContent = p[0];
      $("status-label").textContent = WB.t(p[1]);
      $("status-sub").textContent = WB.t(p[2]);
      $("housing-name").textContent = homeName();
      return;
    }
    const [icon, label, sub2] = STATUS_BY_FOCUS[st.focus] || ["💼", "Hustling", "doing entrepreneur things"];
    $("status-icon").textContent = icon;
    $("status-label").textContent = WB.t(label);
    $("status-sub").textContent = st.project ? `"${st.project.name}" · ${WB.t(sub2)}` : WB.t(sub2);
    $("housing-name").textContent = homeName();
  }
  function renderHud() {
    const G = WB.GAME, r = st.res;
    const money = st.money;
    const moneyEl = $("money");
    moneyEl.textContent = WB.fmt(money, true);
    if (money > lastMoney * 1.2 + 100) {
      moneyEl.classList.remove("pop"); void moneyEl.offsetWidth; moneyEl.classList.add("pop");
    }
    lastMoney = money;
    $("ips").textContent = WB.fmt(G.incomePerSec(), true) + "/sec";
    const e = D.ERAS[st.era];
    $("era-badge").textContent = `${e.year} · ${WB.t(e.name)}`;
    const boost = Date.now() < st.boost.until;
    $("boost-badge").style.display = boost ? "" : "none";
    if (boost) $("boost-badge").textContent = `🔥 x${st.boost.mult} for ${Math.ceil((st.boost.until - Date.now()) / 1000)}s`;

    setBar("energy", r.energy, Math.round(r.energy));
    setBar("hygiene", r.hygiene == null ? 70 : r.hygiene, Math.round(r.hygiene == null ? 70 : r.hygiene));
    setBar("intel", Math.min(100, r.intelligence), Math.floor(r.intelligence));
    setBar("stress", r.stress, Math.round(r.stress));
    $("rep-val").textContent = Math.floor(r.reputation);
    $("followers-val").textContent = WB.fmt(st.stats.followers);
    // The skill you're currently training (from the focused activity) + its level,
    // e.g. "🧠 Coding Lv 36" or "💼 Business Lv 10".
    const chip = $("career-chip");
    if (chip) {
      const a = D.ACTIVITIES[st.focus];
      const sk = a && a.skill;
      if (sk && st.skills[sk]) {
        const s = D.SKILLS[sk];
        chip.innerHTML = `${s.icon} <b id="career-val">${WB.t(s.name)} ${WB.t("Lv")} ${st.skills[sk].level}</b>`;
      } else chip.innerHTML = `🧘 <b id="career-val">${WB.t("Taking it easy")}</b>`;
    }

    // living character panel: status, mood, level, prison state
    renderStatus();
    $("mood-badge").textContent = WB.t(moodFace(r));
    $("level-badge").textContent = "⭐ Lv " + G.charLevel();

    // Goal
    const goal = D.GOALS[st.goalIndex];
    $("goal-text").textContent = goal ? WB.t(goal.text) : WB.t("All goals complete. You are the goal now.");
    const gTotal = D.GOALS.length, gIdx = Math.min(st.goalIndex, gTotal);
    if ($("goal-count")) $("goal-count").textContent = `${Math.min(gIdx + (goal ? 1 : 0), gTotal)}/${gTotal}`;
    if ($("goal-fill")) $("goal-fill").style.width = (gIdx / gTotal * 100) + "%";

    // Project (hidden during cutscenes & in jail — no "building a SaaS" bar on the way to prison)
    const p = st.project;
    const pb = $("project-box");
    const cutOrJail = (WB.ROOM.cutActive && WB.ROOM.cutActive()) || (WB.CRIME && WB.CRIME.inPrison());
    if (p && !cutOrJail) {
      pb.style.display = "";
      $("project-name").textContent = p.name;
      $("project-fill").style.width = Math.min(100, p.progress / p.required * 100) + "%";
    } else pb.style.display = "none";

    // Focus picker — fix the focus when jail state flips, keep the card in sync,
    // and refresh the popover live if it happens to be open.
    const jailedNow = !!(WB.CRIME && WB.CRIME.inPrison());
    if (jailedNow !== lastActBarJailed) { lastActBarJailed = jailedNow; fixFocusForContext(jailedNow); if (focusPanelOpen) renderFocusPanel(); }
    updateFocusCard();

    $("hustle-val").textContent = "+" + WB.fmt(G.clickValue(), true);
    $("prestige-pill").style.display = G.legacyGain() > 0 ? "" : "none";

    // Profile button: username + online dot
    const pn = $("profile-name"); if (pn) pn.textContent = playerName();
    const pd = $("profile-dot"); if (pd) pd.className = "pf-dot" + (WB.CLOUD && WB.CLOUD.enabled ? " on" : "");

    // Secret tab may have just unlocked
    renderTabBar();

    // Heat pill + prison banner
    const heatPill = $("heat-pill");
    if (WB.CRIME && getSetting("showHeat") && WB.CRIME.heat() > 1) {
      const h = Math.round(WB.CRIME.heat());
      heatPill.style.display = "";
      heatPill.textContent = `🌡️ ${WB.t("Heat")} ${h}`;
      heatPill.style.color = h > 60 ? "var(--red)" : h > 30 ? "var(--gold)" : "var(--green)";
    } else heatPill.style.display = "none";
    renderPrisonBanner();

    renderActions();
  }

  // ============================================================ Actions bar
  // Always exactly FOUR category cards (💼 Work · 📣 Fame · 💸 Money · 🧘 Life)
  // in a fixed-height grid — the bar never wraps or grows, so the character
  // panel below it never moves. Each category opens a popover of its actions.
  const CAT_ORDER = ["work", "fame", "money", "life"];
  let actBarBuilt = false;
  let actPanelCat = null, actPanelSig = "";

  function catItems(cat) {
    return WB.ACTIONS.list().filter(x => x.def.cat === cat);
  }
  function renderActions() {
    if (!WB.ACTIONS || !WB.ACTIONS.CATEGORIES) return;
    const bar = $("actions-bar");
    if (!actBarBuilt) {
      actBarBuilt = true;
      bar.innerHTML = CAT_ORDER.map(c => {
        const def = WB.ACTIONS.CATEGORIES[c];
        return `<button class="act-cat" data-cat="${c}" title="${WB.t(def.desc)}">
          <span class="act-cat-icon">${def.icon}</span>
          <span class="act-cat-main">
            <span class="act-cat-name">${WB.t(def.name)}</span>
            <span class="act-cat-sub" id="actsub-${c}"></span>
          </span>
          <span class="act-cat-chev">▾</span>
          <span class="act-cat-track"><span class="act-cat-fill" id="actfill-${c}"></span></span>
        </button>`;
      }).join("");
    }
    CAT_ORDER.forEach(c => {
      const items = catItems(c);
      const done = items.filter(x => x.st.state === "done").length;
      const running = items.filter(x => x.st.state === "running");
      const ready = items.filter(x => x.st.state === "ready").length;
      let state, sub, pct = 0;
      if (done) { state = "done"; sub = WB.t("📬 Results ready!"); pct = 100; }
      else if (running.length) {
        state = "running";
        const r = running.sort((a, b) => b.st.pct - a.st.pct)[0];
        sub = (running.length > 1 ? running.length + " × " : "") + WB.t("working…") + " " + r.st.label;
        pct = r.st.pct;
      } else if (ready) { state = "ready"; sub = ready + " " + WB.t("ready"); }
      else { state = "cooldown"; sub = WB.t("recharging…"); }
      const card = bar.querySelector(`[data-cat="${c}"]`);
      if (!card) return;
      if (card.dataset.state !== state) { card.dataset.state = state; card.className = "act-cat " + state; }
      const subEl = $("actsub-" + c);
      if (subEl && subEl.textContent !== sub) subEl.textContent = sub;
      const fill = $("actfill-" + c);
      if (fill) fill.style.width = pct + "%";
    });
    if (actPanelCat) renderActPanel(); // live countdowns while the popover is open
  }

  // ---------- Category popover: the direct actions ----------
  function rowInfo({ id, def, st: a }) {
    let sub = WB.t(def.desc), chip = "▶ " + WB.t("Start"), pct = 0;
    if (a.state === "running") { sub = WB.t("working…"); chip = "⏳ " + a.label; pct = a.pct; }
    else if (a.state === "done") { sub = WB.t("Results are in!"); chip = "📬 " + WB.t("Collect"); pct = 100; }
    else if (a.state === "cooldown") { sub = WB.t("recharging…"); chip = "🕒 " + a.label; }
    return { id, def, state: a.state, sub, chip, pct };
  }
  function renderActPanel() {
    const p = $("act-panel");
    if (!p || !actPanelCat) return;
    const catDef = WB.ACTIONS.CATEGORIES[actPanelCat];
    const items = catItems(actPanelCat).map(rowInfo);
    const sig = actPanelCat + "|" + items.map(i => i.id + ":" + i.state).join("|");
    if (sig !== actPanelSig) {
      actPanelSig = sig;
      p.innerHTML = `<div class="act-panel-head"><span>${catDef.icon}</span><b>${WB.t(catDef.name)}</b><small>${WB.t(catDef.desc)}</small></div>` +
        items.map(i => `
          <button class="act-row ${i.state}" data-action="${i.id}">
            <span class="act-row-icon">${i.def.icon}</span>
            <span class="act-row-main">
              <b>${WB.t(i.def.name)}</b>
              <small id="arsub-${i.id}">${i.sub}</small>
            </span>
            <span class="act-row-chip" id="archip-${i.id}">${i.chip}</span>
            <span class="act-row-track"><span class="act-row-fill" id="arfill-${i.id}" style="width:${i.pct}%"></span></span>
          </button>`).join("");
      return;
    }
    items.forEach(i => { // patch countdowns in place — no hover flicker
      const chip = $("archip-" + i.id), sub = $("arsub-" + i.id), fill = $("arfill-" + i.id);
      if (chip && chip.textContent !== i.chip) chip.textContent = i.chip;
      if (sub && sub.textContent !== i.sub) sub.textContent = i.sub;
      if (fill) fill.style.width = i.pct + "%";
    });
  }
  function toggleActPanel(cat, anchor) {
    if (actPanelCat === cat) return closeActPanel();
    actPanelCat = cat;
    actPanelSig = "";
    let p = $("act-panel");
    if (!p) {
      p = document.createElement("div");
      p.id = "act-panel";
      document.body.appendChild(p);
      p.addEventListener("click", e => {
        e.stopPropagation();
        const row = e.target.closest("[data-action]");
        if (!row) return;
        const id = row.dataset.action;
        const a = WB.ACTIONS.status(id);
        if (a.state === "cooldown" || a.state === "running") return; // chip shows the countdown
        closeActPanel();
        onActionClick(id);
      });
    }
    renderActPanel();
    // anchor the popover above its category card
    const r = anchor.getBoundingClientRect();
    p.classList.add("open");
    const pw = p.offsetWidth || 340;
    p.style.left = Math.min(Math.max(12, r.left + r.width / 2 - pw / 2), innerWidth - pw - 12) + "px";
    p.style.top = "";
    p.style.bottom = (innerHeight - r.top + 10) + "px";
  }
  function closeActPanel() {
    actPanelCat = null;
    const p = $("act-panel");
    if (p) p.classList.remove("open");
  }

  function showActionResult(result) {
    if (!result) return;
    const moneyLine = result.money ? `<div class="offline-amount ${result.money < 0 ? "loss" : ""}">${result.money >= 0 ? "+" : ""}${WB.fmt(result.money, true)}</div>` : "";
    const extra = result.scan
      ? `<div class="ev-choices"><button class="btn primary" id="scan-buy">🦍 Ape in (20% of cash)</button><button class="btn" id="scan-pass">🧘 Pass</button></div>`
      : `<button class="btn primary" id="result-done">Nice.</button>`;
    openModal(`
      <div class="ev-icon">${result.icon}</div>
      <h2>${result.title}</h2>
      <div class="result-lines">${result.lines.map(l => `<p>${l}</p>`).join("")}</div>
      ${moneyLine}${extra}`);
    if (result.scan) {
      $("scan-buy").onclick = () => showActionResult(WB.ACTIONS.resolveScan(true));
      $("scan-pass").onclick = () => showActionResult(WB.ACTIONS.resolveScan(false));
    } else {
      $("result-done").onclick = closeModal;
    }
  }

  function onActionClick(id) {
    const a = WB.ACTIONS.status(id);
    if (a.state === "done") { showActionResult(WB.ACTIONS.collect(id)); return; }
    if (a.state !== "ready") return;
    const res = WB.ACTIONS.start(id);
    if (res.refused) { toast("😮‍💨 " + res.refused, "bad"); return; }
    if (res.instant || res.started) return;
    if (res.choice) {
      const c = res.choice;
      openModal(`
        <h2>${c.title}</h2>
        <p>${c.desc}</p>
        <div class="ev-choices">${c.options.map((o, i) =>
          `<button class="btn choice" data-achoice="${i}"><b>${o.label}</b><small>${o.desc}</small></button>`).join("")}
        <button class="btn subtle" id="achoice-cancel">Never mind</button></div>`);
      $("modal-content").querySelectorAll("[data-achoice]").forEach(btn => {
        btn.onclick = () => {
          const idx = +btn.dataset.achoice;
          const r = WB.ACTIONS.beginWithChoice(id, idx, c.options[idx].data);
          closeModal();
          if (r.refused) toast("😮‍💨 " + r.refused, "bad");
        };
      });
      $("achoice-cancel").onclick = closeModal;
    }
  }

  // generic result modal used by crime + scam
  function openResult({ icon, title, lines, money, onDone }) {
    const moneyLine = money ? `<div class="offline-amount ${money < 0 ? "loss" : ""}">${money >= 0 ? "+" : ""}${WB.fmt(money, true)}</div>` : "";
    openModal(`<div class="ev-icon">${icon}</div><h2>${title}</h2>
      <div class="result-lines">${lines.map(l => `<p>${l}</p>`).join("")}</div>${moneyLine}
      <button class="btn primary" id="res-done">OK</button>`);
    $("res-done").onclick = () => { closeModal(); if (onDone) onDone(); };
  }

  // ---------- Prison overlay (countdown banner) ----------
  function showPrison() { /* banner is rendered every HUD tick when jailed */ }
  function hidePrison() { const b = $("prison-banner"); if (b) b.style.display = "none"; }
  function renderPrisonBanner() {
    const inCut = WB.ROOM && WB.ROOM.cutActive && WB.ROOM.cutActive();
    const jailed = WB.CRIME && WB.CRIME.inPrison() && !inCut;
    let b = $("prison-banner");
    if (!jailed) { if (b) b.remove(); return; }
    if (!b) { // built once; only the text nodes update, so the button never flickers
      b = document.createElement("div");
      b.id = "prison-banner";
      b.innerHTML = `<span id="prison-count"></span><button id="prison-bail"></button>`;
      $("room-frame").appendChild(b);
      $("prison-bail").onclick = () => WB.CRIME.postBail();
    }
    $("prison-count").textContent = "⏳ " + WB.fmtTime(WB.CRIME.prisonLeft() / 1000);
    const bail = WB.t("⚖️ Bail") + " " + WB.fmt(WB.CRIME.bailCost(), true);
    if ($("prison-bail").textContent !== bail) $("prison-bail").textContent = bail;
  }

  function floatMoney(val, x, y, crit) {
    const el = document.createElement("div");
    el.className = "float-money" + (crit ? " crit" : "");
    el.textContent = (crit ? "💥 +" : "+") + WB.fmt(val, true);
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.setProperty("--drift", WB.rand(-10, 10) + "deg");
    $("scene").appendChild(el);
    setTimeout(() => el.remove(), crit ? 1400 : 1100);
  }

  // ---------- 💩 The poop decision ----------
  function poopPopup() {
    if (uiBusy()) { setTimeout(poopPopup, 2500); return; } // never stack on another modal
    openModal(`
      <div class="ev-icon">💩</div>
      <h2>${WB.t("You need to poop!")}</h2>
      <p>${WB.t("Nature is calling. Loudly. Urgently. This is a board-level emergency.")}</p>
      <div class="ev-choices">
        <button class="btn choice" id="poop-go"><b>🚽 ${WB.t("Go to the toilet")}</b><small>${WB.t("Pause the grind. Keep your dignity.")}</small></button>
        <button class="btn choice" id="poop-no"><b>🙈 ${WB.t("I don't care")}</b><small>${WB.t("The deadline matters more than the chair.")}</small></button>
      </div>`);
    $("poop-go").onclick = () => { closeModal(); WB.GAME.goPoop(); };
    $("poop-no").onclick = () => { closeModal(); WB.GAME.poopSelf(); };
  }

  // ---------- Autoclicker easter egg ----------
  function showAutoclickerEgg() {
    openModal(`<div class="ev-icon">🤖</div><h2>${WB.t("Hold up.")}</h2>
      <p>${WB.t("Oh.. You are using an autoclicker, what's the challenge?")}</p>
      <div class="ev-choices">
        <button class="btn choice" id="egg-ok">😇 ${WB.t("Ok, I will stop")}</button>
        <button class="btn choice" id="egg-no">🖕 ${WB.t("F##k off")}</button>
      </div>`);
    $("egg-ok").onclick = () => { closeModal(); toast(WB.t("🤝 Respect. The grind must be earned."), "good"); };
    $("egg-no").onclick = () => {
      closeModal();
      const bad = [
        () => { const loss = Math.floor(st.money * 0.15); st.money -= loss;
          openResult({ icon: "🧾", title: "Karma Tax", lines: ["The universe heard that.", "A mysterious 'processing fee' just drained your account."], money: -loss }); },
        () => { st.res.stress = Math.min(100, st.res.stress + 40); st.res.energy = Math.max(0, st.res.energy - 50);
          openResult({ icon: "🤕", title: "Finger Cramp", lines: ["Your clicking finger seized up mid-flex.", "Stress +40, energy −50. Worth it?"] }); },
        () => { WB.CRIME.addHeat(20);
          openResult({ icon: "🛰️", title: "Suspicious Activity Detected", lines: ["Someone flagged your inhuman clicking pattern.", "Heat +20. They're watching."] }); },
        () => { st.boost = { mult: 0.5, until: Date.now() + 120000 };
          openResult({ icon: "🐌", title: "Throttled", lines: ["Your WiFi provider 'optimized' your plan as punishment.", "Income ×0.5 for 2 minutes."] }); },
      ];
      WB.pick(bad)();
    };
  }

  // ============================================================ Boot
  function boot() {
    // Activities click handler (the bar itself is built after state loads, below)
    $("activities").addEventListener("click", e => {
      if (e.target.closest("#focus-card")) { e.stopPropagation(); toggleFocusPanel(); }
    });

    // Tabs (rebuilt dynamically — the Empire tab appears when the secret unlocks)
    $("tabs").addEventListener("click", e => {
      const b = e.target.closest("[data-tab]");
      if (!b) return;
      if (b.dataset.tab === "empire-locked") {
        toast(`🤫 Something colossal unlocks at ${WB.fmt(WB.EMPIRE.UNLOCK_NW, true)} net worth. Keep stacking.`, "good");
        return;
      }
      activeTab = b.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(x => x.classList.toggle("active", x.dataset.tab === activeTab));
      renderTab(true);
    });
    $("tab-content").addEventListener("click", onTabClick);

    // Hustle (with autoclicker easter egg)
    let clickLog = [], lastEgg = 0;
    $("hustle-btn").addEventListener("click", e => {
      const t2 = Date.now();
      clickLog.push(t2);
      if (clickLog.length > 16) clickLog.shift();
      // Only flag a GUARANTEED autoclicker: not just fast, but mechanically regular.
      // A human's click intervals jitter a lot; a clicker's are near-identical.
      if (clickLog.length === 16 && t2 - lastEgg > 240000 && !uiBusy()) {
        const iv = [];
        for (let i = 1; i < clickLog.length; i++) iv.push(clickLog[i] - clickLog[i - 1]);
        const avg = iv.reduce((a, b) => a + b, 0) / iv.length;
        const std = Math.sqrt(iv.reduce((a, b) => a + (b - avg) * (b - avg), 0) / iv.length);
        if (avg < 95 && std < 12) { // ~>10.5 cps with <12ms jitter = a machine, not a hand
          lastEgg = t2; clickLog = [];
          showAutoclickerEgg();
          return;
        }
      }
      const r = WB.GAME.hustle();
      if (WB.SOUND) WB.SOUND.play(r.crit ? "crit" : "click");
      const rect = $("scene").getBoundingClientRect();
      floatMoney(r.value, e.clientX - rect.left + WB.rand(-12, 12), e.clientY - rect.top - 14, r.crit);
      const btn = $("hustle-btn");
      btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");
      if (r.crit) { btn.classList.remove("crit-flash"); void btn.offsetWidth; btn.classList.add("crit-flash"); }
    });

    $("settings-btn").addEventListener("click", showSettings);
    $("profile-btn").addEventListener("click", showProfile);

    // Notification center
    $("notif-btn").addEventListener("click", e => { e.stopPropagation(); toggleNotifPanel(); });
    $("notif-clear").addEventListener("click", () => { notifs = []; saveNotifs(); renderNotifPanel(); renderNotifBadge(); });
    $("notif-panel").addEventListener("click", e => e.stopPropagation());
    document.addEventListener("click", () => { toggleNotifPanel(false); closeActPanel(); closeFocusPanel(); });
    renderNotifBadge();

    // pause periodic side-panel refreshes while hovering (prevents button flicker)
    $("tab-content").addEventListener("pointerenter", () => { tabHovered = true; });
    $("tab-content").addEventListener("pointerleave", () => { tabHovered = false; });
    const gotoTab = name => { activeTab = name; document.querySelectorAll(".tab-btn").forEach(x => x.classList.toggle("active", x.dataset.tab === name)); renderTab(true); };
    $("prestige-pill").addEventListener("click", () => gotoTab("prestige"));

    // Scam app close
    $("scam-close").addEventListener("click", () => WB.SCAM.close());
    $("scam-back").addEventListener("click", () => WB.SCAM.open());

    // Action categories: cards open a popover of direct actions
    $("actions-bar").addEventListener("click", e => {
      const b = e.target.closest(".act-cat");
      if (!b) return;
      e.stopPropagation();
      toggleActPanel(b.dataset.cat, b);
    });

    const hooks = { toast, bubble, showEventModal, offerPerks, notifyAchievement, confetti, roomDirty: () => {}, modalOpen: uiBusy, poopPopup };
    initTheme();
    const res = WB.GAME.init(hooks);
    st = res.state;
    buildFocusPicker(); fixFocusForContext(!!(WB.CRIME && WB.CRIME.inPrison())); // now that state exists
    WB.ROOM.init($("room-canvas"), () => st);
    renderTabBar();
    renderHud();
    renderTab(true);
    // Re-show a perk offer that was pending when the game was closed
    if (st.perkOffer) {
      const pending = st.perkOffer.map(id => D.PERKS.find(p => p.id === id)).filter(Boolean);
      if (pending.length === 3) offerPerks(pending);
      else st.perkOffer = null;
    }
    // first ever launch → onboarding (name / language / theme), then the tutorial
    let onboarded = true;
    try { onboarded = !!localStorage.getItem("wb_onboarded"); } catch (e) {}
    if (!onboarded) showOnboarding(() => maybeStartTutorial());
    else maybeStartTutorial();

    if (res.offline) showOffline(res.offline);
    else bubble(st.stats.playTimeSec < 5
      ? "Okay. New plan. I'm going to get rich on the internet. From this bedroom. With this WiFi."
      : "Right. Where was I? Ah yes — getting rich.");
    scheduleThoughts();
    maybeDailyReward(); // come-back-daily cash bonus (waits for any onboarding/tutorial modal)
    if (WB.ADS && WB.ADS.banner) WB.ADS.banner($("ad-banner")); // browser build only; empty until AdinPlay wired

    setInterval(renderHud, 200);
    setInterval(bubbleTrack, 120); // thought bubble follows him around the room
    setInterval(() => renderTab(false), 600);

    // cloud sync: heartbeat presence + push your score (incl. jail status) for the leaderboard
    const cloudSync = () => {
      if (WB.CLOUD && WB.CLOUD.enabled) { WB.CLOUD.heartbeat(playerName()); pushScore(); }
    };
    window.addEventListener("wb-cloud-ready", () => setTimeout(cloudSync, 1500));
    setInterval(cloudSync, 60000);
    setInterval(watchJailForCloud, 1500); // push score the instant you're jailed / bailed
    startSocial(); // friend-request + gift listeners (run all session)
    // Restore your syndicate ONLY after anonymous auth actually completes.
    // (The "wb-cloud-ready" event fires the instant cloud.js loads — before
    // sign-in resolves — so gating on it alone left WB.CLOUD.enabled false and
    // the gang was never re-watched. That's why a saved mafia "didn't stay".)
    const restoreGang = () => { if (WB.CLOUD && WB.CLOUD.ready && WB.CLOUD.ready.then) WB.CLOUD.ready.then(ok => { if (ok) loadGang(); }); };
    if (WB.CLOUD) restoreGang(); else window.addEventListener("wb-cloud-ready", restoreGang);
    setInterval(maybeAskLike, 8000); // "do you like the game?" — fires once
    setInterval(maybeSocialPrize, 75000); // "follow us for a prize" — fires once
    // listen for admin broadcasts (global events) — apply to this player live
    const startBroadcast = () => { if (WB.CLOUD && WB.CLOUD.enabled && WB.CLOUD.watchBroadcast) WB.CLOUD.watchBroadcast(applyBroadcast); };
    const restoreBroadcast = () => { if (WB.CLOUD && WB.CLOUD.ready && WB.CLOUD.ready.then) WB.CLOUD.ready.then(ok => { if (ok) startBroadcast(); }); };
    if (WB.CLOUD) restoreBroadcast(); else window.addEventListener("wb-cloud-ready", restoreBroadcast);
  }

  document.addEventListener("DOMContentLoaded", boot);

  return { toast, bubble, confetti, openResult, showPrison, hidePrison, getSetting, showSettings, showWhatsNew,
    refreshTab: () => { try { renderTab(true); renderHud(); } catch (e) {} } };
})();
