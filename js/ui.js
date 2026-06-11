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
  function bubble(text) {
    if (!text || !getSetting("bubbles")) return;
    const el = $("bubble");
    el.textContent = text;
    el.classList.remove("show");
    void el.offsetWidth; // restart animation
    el.classList.add("show");
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

  function toast(text, type) {
    const box = $("toasts");
    const el = document.createElement("div");
    el.className = "toast " + (type || "info");
    el.textContent = text;
    box.appendChild(el);
    while (box.children.length > 5) box.removeChild(box.firstChild);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 400); }, 6000);
  }
  function notifyAchievement(a) {
    toast(`🏆 Achievement unlocked: ${a.icon} ${a.name}`, "ach");
  }

  // ============================================================ Modals
  function openModal(html) {
    modalIsOpen = true;
    $("modal-content").innerHTML = html;
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
    openModal(`
      <h2>✨ Level Up — Choose a Perk</h2>
      <p class="muted">Pick one. The other two are lost to the multiverse.</p>
      <div class="perk-cards">${perks.map((p, i) =>
        `<button class="perk-card" data-perk="${i}"><div class="perk-icon">${p.icon}</div><div class="perk-name">${p.name}</div><div class="perk-desc">${p.desc}</div></button>`).join("")}
      </div>`);
    $("modal-content").querySelectorAll("[data-perk]").forEach(btn => {
      btn.onclick = () => { WB.GAME.choosePerk(+btn.dataset.perk); closeModal(); };
    });
  }
  function showOffline(off) {
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
    const toggles = [
      ["sorko", "🦈 Sorko Mode", "Your #1 superfan haunts the Socials feed. Essential."],
      ["confetti", "🎉 Confetti", "Celebrate milestones with falling confetti."],
      ["bubbles", "💭 Thought Bubbles", "The character's running inner monologue."],
      ["showHeat", "🌡️ Show Heat Meter", "Display the crime heat indicator in the HUD."],
      ["autosaveToast", "💾 Autosave Notices", "Pop a tiny toast every time the game saves."],
    ];
    return `<div class="toggle-list">${toggles.map(([k, label, desc]) =>
      `<div class="toggle-row"><div><b>${label}</b><div class="muted">${desc}</div></div>
        <button class="switch ${getSetting(k) ? "on" : ""}" data-toggle="${k}"><span></span></button></div>`).join("")}</div>`;
  }
  function showSettings() {
    const tabs = { general: "⚙️ General", ai: "🤖 AI", data: "💾 Data", updates: "✨ Updates" };
    openModal(`<h2>Settings</h2>
      <div class="set-tabs">${Object.entries(tabs).map(([k, l]) => `<button class="set-tab ${settingsTab === k ? "active" : ""}" data-settab="${k}">${l}</button>`).join("")}</div>
      <div id="set-body">${settingsBody()}</div>
      <button class="btn primary wide" id="set-close" style="margin-top:14px">Close</button>`);
    const rebind = () => { $("set-body").innerHTML = settingsBody(); bindBody(); };
    function bindBody() {
      $("set-body").querySelectorAll("[data-toggle]").forEach(b => b.onclick = () => {
        const k = b.dataset.toggle; setSetting(k, !getSetting(k)); b.classList.toggle("on"); renderTab(true);
      });
      if ($("ai-save")) $("ai-save").onclick = () => {
        localStorage.setItem("wb_openai_key", $("ai-key").value.trim());
        localStorage.setItem("wb_openai_model", $("ai-model").value.trim() || WB.SECRETS.openaiModel);
        toast("🤖 AI key saved on this device.", "good"); rebind();
      };
      if ($("ai-clear")) $("ai-clear").onclick = () => { localStorage.removeItem("wb_openai_key"); $("ai-key").value = ""; toast("Key cleared.", "info"); rebind(); };
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

  // ============================================================ Tutorial (first launch)
  const TUT_STEPS = [
    { target: null, title: "📶 Welcome to WiFi Billionaire", text: "Meet your entrepreneur. He lives in his parents' bedroom, owns one sad laptop, and dreams in dollar signs. You don't control him — you manage him. He'll work, think out loud, and occasionally make questionable decisions." },
    { target: "hustle-btn", title: "💪 The Hustle Button", text: "Smash this for instant cash. It's small money, but in the beginning every dollar is a victory. Your clicks get stronger as your income grows." },
    { target: "activities", title: "🎯 Set His Focus", text: "Choose what he works on: code, content, crypto, games... He earns more from whatever he's focused on, and gains skill XP doing it. Don't forget Sleep and Touch Grass — burnout is real." },
    { target: "actions-bar", title: "⚡ Actions", text: "The fun part. Take freelance gigs, run code sprints, post videos — each one runs for a bit, then shows you results. Watch for the glowing '📬 Check results!' cards." },
    { target: "side", title: "🛒 Spend It Wisely", text: "Buy equipment and bigger homes in the Store, hire staff and buy a yacht in Assets, climb 5 career paths in Careers. Everything you buy appears in the room." },
    { target: "goal-banner", title: "🎯 Follow the Goals", text: "The goal bar always shows your next milestone. Random events will pop up and demand decisions — choose wisely, or at least entertainingly. Now go: from this bedroom to a billion. 📈" },
  ];
  let tutStep = -1;
  function tutHalo(on) {
    document.querySelectorAll(".tut-halo").forEach(el => el.classList.remove("tut-halo"));
    if (on) {
      const el = $(on);
      if (el) el.classList.add("tut-halo");
    }
  }
  function showTutStep(i) {
    tutStep = i;
    if (i >= TUT_STEPS.length) return endTutorial();
    const s2 = TUT_STEPS[i];
    tutHalo(s2.target);
    let box = $("tut-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "tut-box";
      document.body.appendChild(box);
    }
    box.innerHTML = `<h3>${s2.title}</h3><p>${s2.text}</p>
      <div class="tut-row"><button class="btn subtle" id="tut-skip">Skip tour</button>
      <span class="tut-dots">${TUT_STEPS.map((_, j) => j === i ? "●" : "○").join(" ")}</span>
      <button class="btn primary" id="tut-next">${i === TUT_STEPS.length - 1 ? "Let's go!" : "Next"}</button></div>`;
    $("tut-next").onclick = () => showTutStep(i + 1);
    $("tut-skip").onclick = endTutorial;
  }
  function endTutorial() {
    tutHalo(null);
    const box = $("tut-box");
    if (box) box.remove();
    tutStep = -1;
    st.tutorialDone = true;
    WB.GAME.save();
  }
  function maybeStartTutorial() {
    if (st.tutorialDone || st.stats.playTimeSec > 30) {
      st.tutorialDone = true;
      return;
    }
    setTimeout(() => showTutStep(0), 3200); // let the splash finish first
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
  const TABS = { shop: "🛒 Shop", careers: "💼 Careers", crime: "🦹 Crime", socials: "📱 Socials", profile: "🧠 Profile", prestige: "♻️ Prestige" };
  const SUBTABS = { shop: ["gear", "assets"], profile: ["skills", "awards", "stats"] };
  const SUB_LABEL = { gear: "🛠️ Gear & Home", assets: "💎 Assets", skills: "🧠 Skills", awards: "🏆 Awards", stats: "📊 Stats" };
  const sub = { shop: "gear", profile: "skills" };

  function subBar(tab) {
    if (!SUBTABS[tab]) return "";
    return `<div class="subtabs">${SUBTABS[tab].map(s =>
      `<button class="subtab-btn ${sub[tab] === s ? "active" : ""}" data-sub="${s}">${SUB_LABEL[s]}</button>`).join("")}</div>`;
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
    html += `<div class="card"><div class="card-main"><b>${h.name}</b> <span class="tag">x${h.mult} income</span><div class="muted">${h.desc}</div></div>`;
    if (next) {
      const cost = G.housingCost();
      html += `<button class="btn buy ${st.money >= cost ? "" : "locked"}" data-act="housing">Move to ${next.name}<span class="cost">${WB.fmt(cost, true)}</span></button>`;
    } else html += `<span class="tag gold">MAX</span>`;
    html += `</div><div class="section-title">🛠️ Equipment</div>`;
    Object.entries(D.EQUIPMENT).forEach(([key, eq]) => {
      const t = st.equipment[key];
      const cur = t >= 0 ? eq.tiers[t].name : "None";
      const cost = G.equipCost(key);
      const effTxt = { income: `+${Math.round(eq.val * 100)}% income/tier`, xp: `+${Math.round(eq.val * 100)}% XP/tier`, energy: `-${Math.round(eq.val * 100)}% energy drain/tier`, click: `+${Math.round(eq.val * 100)}% click/tier` }[eq.effect];
      html += `<div class="card"><div class="card-main"><b>${eq.icon} ${eq.label}</b> <span class="tag">${cur}</span><div class="muted">${effTxt}</div></div>`;
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
      const cur = t >= 0 ? c.tiers[t].name : "Not started";
      const next = c.tiers[t + 1];
      html += `<div class="card col"><div class="career-head"><b>${c.icon} ${c.name}</b><span class="tag">${cur}${t >= 0 ? ` — ${WB.fmt(c.tiers[t].income, true)}/s base` : ""}</span></div>`;
      html += `<div class="career-path muted">${c.tiers.map((x, i) => i <= t ? `<b class="done">${x.name}</b>` : x.name).join(" → ")}</div>`;
      if (next) {
        const chk = G.canAdvanceCareer(key);
        const cost = G.careerCost(key);
        html += `<button class="btn buy wide ${chk.ok ? "" : "locked"}" data-act="career" data-key="${key}">
          ${t >= 0 ? "Advance to" : "Start as"} ${next.name}<span class="cost">${WB.fmt(cost, true)}</span></button>`;
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
      html += `<div class="skill-row"><span class="skill-name">${sk.icon} ${sk.name}</span><span class="skill-lvl">Lv ${x.level}</span>
        <div class="bar"><div class="fill skill" style="width:${pct}%"></div></div></div>`;
    });
    html += `<div class="section-title">🎭 Traits</div><div class="chips">`;
    html += st.traits.length ? st.traits.map(t => { const tr = D.TRAITS[t]; return `<span class="chip" title="${tr.desc}">${tr.icon} ${tr.name}</span>`; }).join("") : `<span class="muted">No traits yet. Live a little — personality develops from behavior.</span>`;
    html += `</div><div class="section-title">✨ Perks</div><div class="chips">`;
    html += st.perks.length ? st.perks.map(id => { const p = D.PERKS.find(x => x.id === id); return `<span class="chip" title="${p.desc}">${p.icon} ${p.name}</span>`; }).join("") : `<span class="muted">Perks unlock every 3 character levels.</span>`;
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
    return `<div class="stats-list">${rows.map(([k, v]) => `<div class="stat-row"><span>${k}</span><b>${v}</b></div>`).join("")}</div>`;
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
      html += `<div class="card"><div class="card-main"><b>${u.icon} ${u.name}</b> <span class="tag">Lv ${lvl}/${u.max}</span><div class="muted">${u.desc}</div></div>`;
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
    for (let i = 0; i < n; i++) {
      if (sorko && (i === 0 || WB.chance(0.4))) feed.push({ sorko: true, t: SORKO_FAN[(st.stats.eventsSeen + i) % SORKO_FAN.length] });
      else feed.push({ sorko: false, t: "@" + WB.pick(["devmike", "sara_codes", "nightowl99", "rampedup", "broke_no_more", "future_ceo", "pixelpete", "grindset_greg"]) + " — " + WB.pick(FAN_COMMENTS) });
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

  function tabCrime() {
    const C = WB.CRIME, c = C.crimeState();
    const heatPct = Math.round(c.heat);
    const jailed = C.inPrison();
    let html = `<div class="section-title">🚨 The Underworld</div>
      <div class="card col"><div class="card-main">
        <b>🌡️ Heat</b> <span class="tag" style="color:${heatPct > 60 ? "var(--red)" : heatPct > 30 ? "var(--gold)" : "var(--green)"}">${heatPct}/100</span>
        <div class="muted">Every crime raises heat; high heat = higher chance of getting caught. It cools off slowly over time.</div>
        <div class="bar" style="margin-top:6px"><div class="fill stress" style="width:${heatPct}%"></div></div></div></div>`;
    if (jailed) {
      html += `<div class="card col jail"><b>🚔 In Jail — ${WB.fmtTime(C.prisonLeft() / 1000)} left</b>
        <div class="muted">Reason: ${c.prisonReason}. Manual actions are locked; income runs at 50%.</div>
        <button class="btn danger wide" data-act="bail">Post Bail (${WB.fmt(C.bailCost(), true)})</button></div>`;
    }
    // Featured: the texting scam
    html += `<div class="section-title">📱 Phishing — Scam Texting</div>
      <div class="card col"><div class="card-main"><b>💬 Open the Texting App</b>
        <div class="muted">Chat up fictional victims, build their trust, and cash out. ${WB.aiEnabled() ? "AI-powered victims." : "Offline victims (add an OpenAI key in Settings for smart ones)."}</div></div>
        <button class="btn buy wide ${jailed ? "locked" : ""}" data-act="openscam">📲 Launch Messages</button></div>`;
    html += `<div class="section-title">🦹 Quick Jobs</div>`;
    C.CRIMES.forEach(cr => {
      const el = C.eligible(cr);
      const chance = cr.launder ? null : Math.round(C.catchChance(cr) * 100);
      html += `<div class="card"><div class="card-main"><b>${cr.icon} ${cr.name}</b>
        ${chance !== null ? `<span class="tag" style="color:${chance > 40 ? "var(--red)" : "var(--gold)"}">${chance}% caught risk</span>` : `<span class="tag">cools heat</span>`}
        <div class="muted">${WB.THOUGHTS.fill(cr.desc)}${cr.sentence ? ` · jail ${WB.fmtTime(cr.sentence)}` : ""}</div></div>`;
      if (el.ok) html += `<button class="btn buy ${jailed ? "locked" : ""}" data-act="crime" data-key="${cr.id}">${cr.launder ? "Launder" : "Commit"}</button>`;
      else html += `<span class="tag">🔒 ${el.why}</span>`;
      html += `</div>`;
    });
    return html;
  }

  function renderTab(force) {
    let html;
    if (activeTab === "shop") html = subBar("shop") + (sub.shop === "gear" ? tabStore() : tabAssets());
    else if (activeTab === "profile") html = subBar("profile") + (sub.profile === "skills" ? tabSkills() : sub.profile === "awards" ? tabAchievements() : tabStats());
    else html = { careers: tabCareers, crime: tabCrime, socials: tabSocials, prestige: tabPrestige }[activeTab]();
    if (html !== lastTabHtml || force) {
      lastTabHtml = html;
      $("tab-content").innerHTML = html;
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
    else if (act === "bail") WB.CRIME.postBail();
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
    $("era-badge").textContent = `${e.year} · ${e.name}`;
    $("housing-name").textContent = D.HOUSING[st.housing].name;
    const boost = Date.now() < st.boost.until;
    $("boost-badge").style.display = boost ? "" : "none";
    if (boost) $("boost-badge").textContent = `🔥 x${st.boost.mult} for ${Math.ceil((st.boost.until - Date.now()) / 1000)}s`;

    setBar("energy", r.energy, Math.round(r.energy));
    setBar("happiness", r.happiness, Math.round(r.happiness));
    setBar("motivation", r.motivation, Math.round(r.motivation));
    setBar("stress", r.stress, Math.round(r.stress));
    $("rep-val").textContent = Math.floor(r.reputation);
    $("int-val").textContent = Math.floor(r.intelligence);
    $("followers-val").textContent = WB.fmt(st.stats.followers);

    // Goal
    const goal = D.GOALS[st.goalIndex];
    $("goal-text").textContent = goal ? goal.text : "All goals complete. You are the goal now.";

    // Project
    const p = st.project;
    const pb = $("project-box");
    if (p) {
      pb.style.display = "";
      $("project-name").textContent = p.name;
      $("project-fill").style.width = Math.min(100, p.progress / p.required * 100) + "%";
    } else pb.style.display = "none";

    // Activity buttons
    document.querySelectorAll("#activities .act-btn").forEach(b => {
      const f = b.dataset.focus;
      b.classList.toggle("active", st.focus === f);
      const a = D.ACTIVITIES[f];
      const locked = a.reqEra && st.era < a.reqEra;
      b.classList.toggle("locked", !!locked);
      b.title = locked ? `Unlocks in ${D.ERAS[a.reqEra].year}` : a.name;
    });

    $("hustle-val").textContent = "+" + WB.fmt(G.clickValue(), true);
    $("prestige-pill").style.display = G.legacyGain() > 0 ? "" : "none";

    // Heat pill + prison banner
    const heatPill = $("heat-pill");
    if (WB.CRIME && getSetting("showHeat") && WB.CRIME.heat() > 1) {
      const h = Math.round(WB.CRIME.heat());
      heatPill.style.display = "";
      heatPill.textContent = `🌡️ Heat ${h}`;
      heatPill.style.color = h > 60 ? "var(--red)" : h > 30 ? "var(--gold)" : "var(--green)";
    } else heatPill.style.display = "none";
    renderPrisonBanner();

    renderActions();
  }

  // ============================================================ Actions bar
  function renderActions() {
    if (!WB.ACTIONS) return;
    const items = WB.ACTIONS.list();
    const html = items.map(({ id, def, st: a }) => {
      let sub = "", pct = 0, cls = a.state;
      if (a.state === "ready") sub = "Ready";
      else if (a.state === "running") { sub = "Working… " + a.label; pct = a.pct; }
      else if (a.state === "done") { sub = "📬 Check results!"; pct = 100; }
      else if (a.state === "cooldown") sub = "Recharging " + a.label;
      return `<button class="action-card ${cls}" data-action="${id}" title="${def.desc}">
        <span class="action-icon">${def.icon}</span>
        <span class="action-name">${def.name}</span>
        <span class="action-sub">${sub}</span>
        <span class="action-track"><span class="action-fill" style="width:${pct}%"></span></span>
      </button>`;
    }).join("");
    if (html !== lastActionsHtml) {
      lastActionsHtml = html;
      $("actions-bar").innerHTML = html;
    }
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
    const jailed = WB.CRIME && WB.CRIME.inPrison();
    let b = $("prison-banner");
    if (!jailed) { if (b) b.style.display = "none"; return; }
    if (!b) {
      b = document.createElement("div");
      b.id = "prison-banner";
      $("scene").appendChild(b);
    }
    b.style.display = "";
    const c = WB.CRIME.crimeState();
    b.innerHTML = `🚔 <b>JAILED</b> — ${WB.fmtTime(WB.CRIME.prisonLeft() / 1000)} left · ${c.prisonReason}
      <button class="btn small danger" id="prison-bail">Bail ${WB.fmt(WB.CRIME.bailCost(), true)}</button>`;
    $("prison-bail").onclick = () => WB.CRIME.postBail();
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

  // ============================================================ Boot
  function boot() {
    // Activities
    $("activities").innerHTML = Object.entries(D.ACTIVITIES).map(([key, a]) =>
      `<button class="act-btn" data-focus="${key}"><span>${a.icon}</span><small>${a.name}</small></button>`).join("");
    $("activities").addEventListener("click", e => {
      const b = e.target.closest(".act-btn");
      if (b && !b.classList.contains("locked")) { WB.GAME.setFocus(b.dataset.focus); renderHud(); }
    });

    // Tabs
    $("tabs").innerHTML = Object.entries(TABS).map(([k, label]) =>
      `<button class="tab-btn ${k === activeTab ? "active" : ""}" data-tab="${k}">${label}</button>`).join("");
    $("tabs").addEventListener("click", e => {
      const b = e.target.closest("[data-tab]");
      if (!b) return;
      activeTab = b.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(x => x.classList.toggle("active", x.dataset.tab === activeTab));
      renderTab(true);
    });
    $("tab-content").addEventListener("click", onTabClick);

    // Hustle
    $("hustle-btn").addEventListener("click", e => {
      const v = WB.GAME.hustle();
      const rect = $("scene").getBoundingClientRect();
      floatMoney(v, e.clientX - rect.left + WB.rand(-12, 12), e.clientY - rect.top - 14);
    });

    $("settings-btn").addEventListener("click", showSettings);
    const gotoTab = name => { activeTab = name; document.querySelectorAll(".tab-btn").forEach(x => x.classList.toggle("active", x.dataset.tab === name)); renderTab(true); };
    $("prestige-pill").addEventListener("click", () => gotoTab("prestige"));

    // Scam app close
    $("scam-close").addEventListener("click", () => WB.SCAM.close());
    $("scam-back").addEventListener("click", () => WB.SCAM.open());

    // Game init
    $("actions-bar").addEventListener("click", e => {
      const b = e.target.closest(".action-card");
      if (b) onActionClick(b.dataset.action);
    });

    const hooks = { toast, bubble, showEventModal, offerPerks, notifyAchievement, confetti, roomDirty: () => {}, modalOpen: () => modalIsOpen };
    initTheme();
    const res = WB.GAME.init(hooks);
    st = res.state;
    WB.ROOM.init($("room-canvas"), () => st);
    renderHud();
    renderTab(true);
    // Re-show a perk offer that was pending when the game was closed
    if (st.perkOffer) {
      const pending = st.perkOffer.map(id => D.PERKS.find(p => p.id === id)).filter(Boolean);
      if (pending.length === 3) offerPerks(pending);
      else st.perkOffer = null;
    }
    maybeStartTutorial();
    if (res.offline) showOffline(res.offline);
    else bubble(st.stats.playTimeSec < 5
      ? "Okay. New plan. I'm going to get rich on the internet. From this bedroom. With this WiFi."
      : "Right. Where was I? Ah yes — getting rich.");
    scheduleThoughts();

    setInterval(renderHud, 200);
    setInterval(() => renderTab(false), 600);
  }

  document.addEventListener("DOMContentLoaded", boot);

  return { toast, bubble, confetti, openResult, showPrison, hidePrison, getSetting };
})();
