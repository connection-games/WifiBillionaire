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
    el.style.left = Math.max(140, Math.min(cw - 140, x)) + "px";
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
  function toast(text, type) {
    text = WB.t(text); // constant toasts translate; composed ones pass through
    pushNotif(text, type); // everything is collected in the inbox
    if (!POPUP_TYPES.has(type || "info")) return; // chatty stuff stays in the inbox
    if (text === lastToastText && Date.now() - lastToastAt < 5000) return; // de-dupe bursts
    lastToastText = text; lastToastAt = Date.now();
    const box = $("toasts");
    const el = document.createElement("div");
    el.className = "toast " + (type || "info");
    el.textContent = text;
    box.appendChild(el);
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
  function uiBusy() { return modalIsOpen || scamOpen(); }
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
    // wait while the texting app or the tutorial is up — never stack popups
    if (scamOpen() || tutStep >= 0) { setTimeout(() => offerPerks(perks), 2500); return; }
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
  let settingsTab = "general";
  const UPDATES = [
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
  function settingsBody() {
    if (settingsTab === "about") {
      return `
        <div class="about-card">
          <h3>📖 About Us</h3>
          <p>This game is an open-source project built with the help of AI. Our goal is simple: to create an incredibly entertaining game that anyone can play, enjoy, and contribute to. The source code is publicly available, meaning any developer, designer, or enthusiast can read it, suggest changes, or build on top of it.</p>
          <p>We believe great games should be accessible to everyone — not locked behind paywalls or closed systems.</p>
        </div>
        <div class="about-card">
          <h3>💌 Contact Us</h3>
          <p>Have a tip, suggestion, or idea to make the game better? We'd love to hear from you. Reach out to us at:</p>
          <div class="contact-row">
            <a class="contact-pill" href="mailto:cntngames96@gmail.com" target="_blank" rel="noopener">📧 cntngames96@gmail.com</a>
            <a class="contact-pill" href="https://github.com/connection-games/WifiBillionare/issues" target="_blank" rel="noopener">🐙 GitHub — report ideas &amp; bugs</a>
          </div>
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
        <option value="en" ${curLang === "en" ? "selected" : ""}>English</option>
        <option value="sv" ${curLang === "sv" ? "selected" : ""}>Svenska 🇸🇪 (SEK)</option>
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
    return langSec + modeSec + `<div class="toggle-list">${toggles.map(([k, label, desc]) =>
      `<div class="toggle-row"><div><b>${WB.t(label)}</b><div class="muted">${WB.t(desc)}</div></div>
        <button class="switch ${getSetting(k) ? "on" : ""}" data-toggle="${k}"><span></span></button></div>`).join("")}</div>`;
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
    }
    $("modal-content").querySelectorAll("[data-settab]").forEach(b => b.onclick = () => {
      settingsTab = b.dataset.settab;
      $("modal-content").querySelectorAll("[data-settab]").forEach(x => x.classList.toggle("active", x === b));
      rebind();
    });
    bindBody();
    $("set-close").onclick = closeModal;
  }

  // ============================================================ Tutorial (spotlight redesign)
  const TUT_STEPS = [
    { target: "room-wrap",   icon: "📶", title: "Meet your entrepreneur", text: "He lives in his parents' bedroom and dreams in dollar signs. You don't control him — you manage him." },
    { target: "hustle-btn",  icon: "💪", title: "The Hustle button", text: "Smash it for instant cash. Clicks get stronger as your income grows." },
    { target: "activities",  icon: "🎯", title: "Set his focus", text: "Pick what he works on. He earns more and gains XP in whatever you choose. Sleep is not optional." },
    { target: "actions-bar", icon: "⚡", title: "Run actions", text: "Freelance gigs, code sprints, videos — start one, collect the results when it glows." },
    { target: "side",        icon: "🛒", title: "Spend it wisely", text: "Gear, homes, careers, crime. Everything you buy shows up in the room." },
    { target: "goal-banner", icon: "🎯", title: "Follow the goal", text: "The goal bar always shows your next milestone. Now go — from this bedroom to a billion. 📈" },
  ];
  let tutStep = -1;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function showTutStep(i) {
    tutStep = i;
    if (i >= TUT_STEPS.length) return endTutorial();
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
    $("tut-skip").onclick = endTutorial;
  }
  function endTutorial() {
    ["tut-spot", "tut-box"].forEach(id => { const e = $(id); if (e) e.remove(); });
    tutStep = -1;
    st.tutorialDone = true;
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
  function showOnboarding(onDone) {
    let lang = WB.I18N.lang();
    let theme = document.documentElement.getAttribute("data-theme") || "light";
    const ov = document.createElement("div");
    ov.id = "onboard";
    ov.innerHTML = `
      <div class="onboard-card">
        <div class="ob-logo logo-tile"><svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="108" height="108" rx="28" fill="#101a35"/>
          <path d="M28 56c9-9 20-13.5 32-13.5S83 47 92 56" stroke="#4dde80" stroke-width="8" stroke-linecap="round" fill="none"/>
          <path d="M38 68c6-6 13.5-9 22-9s16 3 22 9" stroke="#4dde80" stroke-width="8" stroke-linecap="round" fill="none"/>
          <circle cx="60" cy="86" r="11" fill="#ffc83d"/><text x="60" y="91" text-anchor="middle" font-size="15" font-weight="800" fill="#5a3804">$</text>
        </svg></div>
        <h1 class="ob-title">Welcome to <span>WiFi Billionaire</span></h1>
        <p class="ob-tag">Let's set you up — you can change all of this later in Settings.</p>

        <label class="ob-label">👤 Username <span class="ob-hint">— how you'll show on the global leaderboard</span></label>
        <input id="ob-name" class="ob-input" maxlength="20" placeholder="e.g. RamenTycoon" autocomplete="off" spellcheck="false">

        <label class="ob-label">🌍 Language</label>
        <div class="ob-choices" id="ob-lang">
          <button class="ob-choice ${lang === "en" ? "active" : ""}" data-v="en">🇬🇧 English</button>
          <button class="ob-choice ${lang === "sv" ? "active" : ""}" data-v="sv">🇸🇪 Svenska</button>
        </div>

        <label class="ob-label">🎨 Theme</label>
        <div class="ob-choices" id="ob-theme">
          <button class="ob-choice ${theme === "light" ? "active" : ""}" data-v="light">☀️ Light</button>
          <button class="ob-choice ${theme === "dark" ? "active" : ""}" data-v="dark">🌙 Dark</button>
        </div>

        <button class="btn primary wide ob-start" id="ob-start">Start the grind →</button>
        <div class="ob-foot">📶 A satire game by Connection Games · for entertainment only</div>
      </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add("in"));
    setTimeout(() => { const n = $("ob-name"); if (n) n.focus(); }, 350);

    ov.querySelector("#ob-lang").onclick = (e) => {
      const b = e.target.closest(".ob-choice"); if (!b) return;
      lang = b.dataset.v;
      ov.querySelectorAll("#ob-lang .ob-choice").forEach(x => x.classList.toggle("active", x === b));
    };
    ov.querySelector("#ob-theme").onclick = (e) => {
      const b = e.target.closest(".ob-choice"); if (!b) return;
      theme = b.dataset.v; applyTheme(theme); // live preview
      ov.querySelectorAll("#ob-theme .ob-choice").forEach(x => x.classList.toggle("active", x === b));
    };
    $("ob-name").onkeydown = (e) => { if (e.key === "Enter") $("ob-start").click(); };
    $("ob-start").onclick = () => {
      const name = ($("ob-name").value.trim() || "Player").slice(0, 20);
      const langChanged = lang !== WB.I18N.lang();
      try { localStorage.setItem("wb_username", name); localStorage.setItem("wb_onboarded", "1"); } catch (e) {}
      WB.I18N.setLang(lang);
      applyTheme(theme);
      ov.classList.remove("in"); ov.classList.add("out");
      setTimeout(() => ov.remove(), 450);
      if (langChanged) { setTimeout(() => location.reload(), 300); return; } // re-render UI in the chosen language
      if (onDone) setTimeout(onDone, 300);
    };
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
  const TABS = { shop: "🛒 Shop", careers: "💼 Careers", crime: "🦹 Crime", challenges: "🎯 Challenges", profile: "🧠 Profile", prestige: "♻️ Prestige" };
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
  function tabChallenges() {
    const list = WB.DATA.CHALLENGES;
    const claimedCount = list.filter(c => st.challengesClaimed[c.id]).length;
    let html = `
      <div class="chal-hero">
        <div class="chal-hero-top"><b>🎯 Challenges</b><span class="chal-count">${claimedCount}/${list.length}</span></div>
        <div class="chal-hero-sub">Hit the targets, claim the rewards. Progress is tracked across every life.</div>
        <div class="chal-hero-bar"><div class="chal-hero-fill" style="width:${claimedCount / list.length * 100}%"></div></div>
      </div>
      <div class="chal-grid">`;
    list.forEach(c => {
      const claimed = !!st.challengesClaimed[c.id];
      const raw = Math.max(0, c.prog(st));
      const pct = Math.min(100, raw / c.goal * 100);
      const done = raw >= c.goal;
      const fmtN = n => n >= 1000 ? WB.fmt(n) : Math.floor(n);
      const state = claimed ? "claimed" : done ? "ready" : "locked";
      html += `
        <div class="chal-card ${c.tier} ${state}">
          <div class="chal-card-head"><span class="chal-ico">${c.icon}</span>
            <span class="chal-tier">${c.tier}</span></div>
          <b class="chal-name">${WB.t(c.name)}</b>
          <div class="chal-desc">${WB.t(c.desc)}</div>
          <div class="chal-bar"><div class="chal-fill" style="width:${pct}%"></div></div>
          <div class="chal-meta"><span>${fmtN(Math.min(raw, c.goal))} / ${fmtN(c.goal)}</span><span class="chal-reward">${WB.t(c.rewardText)}</span></div>
          ${claimed
            ? `<div class="chal-claimed">✓ ${WB.t("Claimed")}</div>`
            : done
              ? `<button class="btn primary chal-claim" data-act="claimchal" data-key="${c.id}">🎁 ${WB.t("Claim reward")}</button>`
              : `<div class="chal-progresslbl">${Math.floor(pct)}%</div>`}
        </div>`;
    });
    return html + `</div>`;
  }
  function claimChallenge(id) {
    const c = WB.DATA.CHALLENGES.find(x => x.id === id);
    if (!c || st.challengesClaimed[id] || c.prog(st) < c.goal) return;
    st.challengesClaimed[id] = Date.now();
    const r = c.reward;
    let msg;
    if (r.money) { const amt = WB.GAME.incomePerSec() * 60 * r.money + 250; WB.GAME.earn(amt); msg = "+" + WB.fmt(amt, true); }
    else if (r.boost) { st.boost = { mult: r.boost.mult, until: Date.now() + r.boost.sec * 1000 }; msg = `×${r.boost.mult} income for ${r.boost.sec}s`; }
    else if (r.legacy) { st.prestige.legacy += r.legacy; msg = `+${r.legacy} Legacy`; }
    else if (r.followers) { st.stats.followers += r.followers; msg = `+${WB.fmt(r.followers)} fans`; }
    toast(`🎯 Challenge complete: ${WB.t(c.name)} — ${msg}`, "goal");
    confetti();
    renderTab(true);
  }

  // ---------- 🏆 Global leaderboard (Firebase) ----------
  function playerName() { try { return localStorage.getItem("wb_username") || "Anon"; } catch (e) { return "Anon"; } }
  function tabLeaderboard() {
    const C = WB.CLOUD;
    const online = C && C.enabled ? `🟢 ${C.online} ${WB.t("online now")}` : `⚪ ${WB.t("offline")}`;
    return `
      <div class="lb-hero">
        <div class="lb-hero-top"><b>🏆 Global Leaderboard</b><span class="lb-online">${online}</span></div>
        <div class="lb-hero-sub">${WB.t("Ranked by net worth across every player. You compete as")} <b>${esc(playerName())}</b>.</div>
      </div>
      <div id="lb-body" class="lb-body"><div class="lb-loading">⏳ ${WB.t("Loading the leaderboard…")}</div></div>`;
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

  const crimeDescCache = {}; // fill() once per crime — random slot-fills would re-randomize every render
  function tabCrime() {
    const C = WB.CRIME, c = C.crimeState();
    const heat = Math.round(c.heat);
    const jailed = C.inPrison();
    const hs = heat < 20 ? ["❄️", "Cold", "#34c759"] : heat < 45 ? ["🌤️", "Warm", "#ffd60a"] : heat < 70 ? ["🔥", "Hot", "#ff9f0a"] : ["🚨", "Blazing", "#ff453a"];

    let html = `
      <div class="crime-hero">
        <div class="crime-hero-top"><b>🌆 The Underworld</b><span class="heat-chip" style="--hc:${hs[2]}">${hs[0]} ${hs[1]}</span></div>
        <div class="heat-row"><span class="heat-num">${heat}</span><span class="heat-cap">/ 100 heat</span></div>
        <div class="heat-bar"><div class="heat-fill" style="width:${heat}%"></div></div>
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

    html += `<div class="section-title">🦹 Quick Jobs</div><div class="crime-grid">`;
    C.CRIMES.forEach(cr => {
      const el = C.eligible(cr);
      const chance = cr.launder ? null : Math.round(C.catchChance(cr) * 100);
      const riskCol = chance === null ? "#34c759" : chance > 40 ? "#ff453a" : chance > 22 ? "#ff9f0a" : "#34c759";
      if (!crimeDescCache[cr.id]) crimeDescCache[cr.id] = WB.THOUGHTS.fill(cr.desc);
      html += `
        <div class="crime-card ${el.ok ? "" : "locked"}">
          <div class="crime-card-head"><span class="crime-ico">${cr.icon}</span>
            <span class="risk-pill" style="--rp:${riskCol}">${chance === null ? "🧼 −" + WB.t("heat") : chance + "% " + WB.t("risk")}</span></div>
          <b class="crime-name">${WB.t(cr.name)}</b>
          <div class="crime-desc">${crimeDescCache[cr.id]}</div>
          <div class="crime-meta">${cr.sentence ? `⛓️ ${WB.fmtTime(cr.sentence)} ${WB.t("if caught")}` : WB.t("Washes your dirty reputation")}</div>
          ${el.ok
            ? `<button class="btn crime-btn ${jailed ? "locked" : ""}" data-act="crime" data-key="${cr.id}">${WB.t(cr.launder ? "🧼 Launder" : "Commit")}</button>`
            : `<div class="crime-lock">🔒 ${el.why}</div>`}
        </div>`;
    });
    html += `</div>`;
    return html;
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
  function buildActivities(jailed) {
    const keys = jailed
      ? ["workout", "yard", "study", "rest"]                                  // what you can do behind bars
      : Object.keys(D.ACTIVITIES).filter(k => !D.ACTIVITIES[k].jailOnly);     // normal life
    $("activities").innerHTML = keys.map(key => {
      const a = D.ACTIVITIES[key];
      return `<button class="act-btn" data-focus="${key}"><span>${a.icon}</span><small>${WB.t(a.name)}</small></button>`;
    }).join("");
    // make sure the current focus is valid for the context
    if (jailed && !["workout", "yard", "study", "rest"].includes(st.focus)) WB.GAME.setFocus("yard");
    if (!jailed && D.ACTIVITIES[st.focus] && D.ACTIVITIES[st.focus].jailOnly) WB.GAME.setFocus("code");
  }

  let tabHovered = false; // periodic refreshes pause while the pointer is in the panel (anti hover-flicker)
  function renderTab(force) {
    if (!force && tabHovered) return;
    let html;
    if (activeTab === "shop") html = subBar("shop") + (sub.shop === "gear" ? tabStore() : tabAssets());
    else if (activeTab === "profile") html = subBar("profile") + (sub.profile === "skills" ? tabSkills() : sub.profile === "awards" ? tabAchievements() : tabStats());
    else if (activeTab === "challenges") { html = subBar("challenges") + (sub.challenges === "list" ? tabChallenges() : tabLeaderboard()); if (sub.challenges === "leaderboard") setTimeout(loadLeaderboard, 30); }
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
    if (act === "crime") { const r = WB.CRIME.commit(key); if (r && r.refused) toast("🚫 " + r.refused, "bad"); else if (r) openResult({ ...r, money: r.money }); }
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
    else if (act === "openscam") WB.SCAM.open();
    else if (act === "dopost") { const r = WB.ACTIONS.start("social"); if (r && r.refused) toast("😮‍💨 " + r.refused, "bad"); }
    else if (act === "equip") G.buyEquipment(key);
    else if (act === "housing") G.buyHousing();
    else if (act === "career") G.advanceCareer(key);
    else if (act === "cryptobuy") G.buyCrypto(0.25);
    else if (act === "cryptosell") G.sellCrypto();
    else if (act === "lifestyle") WB.ASSETS.buyLifestyle(key);
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

    // living character panel: status, mood, level, prison state
    renderStatus();
    $("mood-badge").textContent = WB.t(moodFace(r));
    $("level-badge").textContent = "⭐ Lv " + G.charLevel();

    // Goal
    const goal = D.GOALS[st.goalIndex];
    $("goal-text").textContent = goal ? WB.t(goal.text) : WB.t("All goals complete. You are the goal now.");

    // Project (hidden during cutscenes & in jail — no "building a SaaS" bar on the way to prison)
    const p = st.project;
    const pb = $("project-box");
    const cutOrJail = (WB.ROOM.cutActive && WB.ROOM.cutActive()) || (WB.CRIME && WB.CRIME.inPrison());
    if (p && !cutOrJail) {
      pb.style.display = "";
      $("project-name").textContent = p.name;
      $("project-fill").style.width = Math.min(100, p.progress / p.required * 100) + "%";
    } else pb.style.display = "none";

    // Activity buttons — swap the whole bar between free/jail sets when jail state flips
    const jailedNow = !!(WB.CRIME && WB.CRIME.inPrison());
    if (jailedNow !== lastActBarJailed) { lastActBarJailed = jailedNow; buildActivities(jailedNow); }
    document.querySelectorAll("#activities .act-btn").forEach(b => {
      const f = b.dataset.focus;
      b.classList.toggle("active", st.focus === f);
      const a = D.ACTIVITIES[f];
      const locked = a.reqEra && st.era < a.reqEra;
      b.classList.toggle("locked", !!locked);
      b.title = locked ? `Unlocks in ${D.ERAS[a.reqEra].year}` : WB.t(a.name);
    });

    $("hustle-val").textContent = "+" + WB.fmt(G.clickValue(), true);
    $("prestige-pill").style.display = G.legacyGain() > 0 ? "" : "none";

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

  function floatMoney(val, x, y) {
    const el = document.createElement("div");
    el.className = "float-money";
    el.textContent = "+" + WB.fmt(val, true);
    el.style.left = x + "px";
    el.style.top = y + "px";
    $("scene").appendChild(el);
    setTimeout(() => el.remove(), 1100);
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
      const b = e.target.closest(".act-btn");
      if (b && !b.classList.contains("locked")) { WB.GAME.setFocus(b.dataset.focus); renderHud(); }
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
      if (clickLog.length > 14) clickLog.shift();
      if (clickLog.length === 14 && t2 - clickLog[0] < 1500 && t2 - lastEgg > 240000 && !uiBusy()) {
        lastEgg = t2; clickLog = [];
        showAutoclickerEgg();
        return;
      }
      const v = WB.GAME.hustle();
      const rect = $("scene").getBoundingClientRect();
      floatMoney(v, e.clientX - rect.left + WB.rand(-12, 12), e.clientY - rect.top - 14);
    });

    $("settings-btn").addEventListener("click", showSettings);

    // Notification center
    $("notif-btn").addEventListener("click", e => { e.stopPropagation(); toggleNotifPanel(); });
    $("notif-clear").addEventListener("click", () => { notifs = []; saveNotifs(); renderNotifPanel(); renderNotifBadge(); });
    $("notif-panel").addEventListener("click", e => e.stopPropagation());
    document.addEventListener("click", () => { toggleNotifPanel(false); closeActPanel(); });
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
    buildActivities(!!(WB.CRIME && WB.CRIME.inPrison())); // now that state exists
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

    setInterval(renderHud, 200);
    setInterval(bubbleTrack, 120); // thought bubble follows him around the room
    setInterval(() => renderTab(false), 600);

    // cloud sync: heartbeat presence + push your score for the global leaderboard
    const cloudSync = () => {
      if (WB.CLOUD && WB.CLOUD.enabled) {
        WB.CLOUD.heartbeat(playerName());
        WB.CLOUD.submitScore({ name: playerName(), netWorth: WB.GAME.netWorth(), prestige: st.prestige.count, era: st.era });
      }
    };
    window.addEventListener("wb-cloud-ready", () => setTimeout(cloudSync, 1500));
    setInterval(cloudSync, 60000);
  }

  document.addEventListener("DOMContentLoaded", boot);

  return { toast, bubble, confetti, openResult, showPrison, hidePrison, getSetting, showSettings, showWhatsNew };
})();
