/* WiFi Billionaire — Golden Opportunities.

   The anti-boredom mechanic for the idle loop: every ~45–95s a coin/cash bubble
   floats over the room. Tap it before it drifts away for a cash burst, an income
   FRENZY (a big ×3–×5 spike), a jackpot, or a lucky break. It keeps hands on the
   game, creates exciting income spikes, and pays off from the very first minutes.

   Fully self-contained: it only uses the public WB.GAME / WB.UI / WB.ROOM APIs and
   edits no other file. Reuses the existing income-boost field (state.boost), so the
   "🔥 x3" HUD badge lights up for free during a frenzy. */
'use strict';
(function () {
  const WB = (window.WB = window.WB || {});
  const G = () => WB.GAME;
  const fmt = (n) => (WB.fmt ? WB.fmt(n, true) : "$" + Math.floor(n));
  const frame = () => document.getElementById("room-frame");
  const rnd = (a, b) => a + Math.random() * (b - a);

  function ready() { return G() && G().state && G().earn && WB.UI && frame(); }

  // never interrupt a cutscene, jail, a modal, or the boot/onboarding flow
  function busy() {
    if (document.getElementById("splash")) return true;
    if (WB.ROOM && WB.ROOM.cutActive && WB.ROOM.cutActive()) return true;
    if (document.querySelector(".plan-overlay")) return true; // not during heist planning
    if (document.getElementById("onboard")) return true;
    if (WB.CRIME && WB.CRIME.inPrison && WB.CRIME.inPrison()) return true;
    const ov = document.getElementById("modal-overlay");
    if (ov && ov.classList.contains("open")) return true;
    if (document.hidden) return true;
    return false;
  }

  // Rewards scale with BOTH your click value (matters early) and your income
  // (matters late), so an opportunity always feels worth grabbing.
  function rollReward() {
    const ips = (G().incomePerSec && G().incomePerSec()) || 0;
    const clk = (G().clickValue && G().clickValue()) || 1;
    const table = [
      { w: 34, kind: "cash",    emoji: "💸", label: "💸 Lucky cash",       calc: () => Math.max(25,  clk * rnd(18, 36),   ips * 60 * rnd(1, 3)) },
      { w: 24, kind: "frenzy",  emoji: "🔥", label: "🔥 ×3 income frenzy!", mult: 3, sec: 30 },
      { w: 15, kind: "frenzy",  emoji: "🔥", label: "🔥🔥 ×5 income RUSH!",  mult: 5, sec: 18 },
      { w: 14, kind: "cash",    emoji: "💰", label: "💰 Big drop",          calc: () => Math.max(120, clk * rnd(60, 110),  ips * 60 * rnd(3, 7)) },
      { w: 7,  kind: "jackpot", emoji: "🎰", label: "🎰 JACKPOT!",          calc: () => Math.max(600, clk * rnd(180, 320), ips * 60 * rnd(10, 22)) },
      { w: 6,  kind: "xp",      emoji: "🧠", label: "🧠 Eureka!" },
    ];
    let x = Math.random() * table.reduce((a, r) => a + r.w, 0);
    for (const r of table) { if ((x -= r.w) <= 0) return r; }
    return table[0];
  }

  function grant(r) {
    const toast = WB.UI.toast || function () {};
    const pop = WB.UI.confetti || function () {};
    if (r.kind === "frenzy") {
      G().state.boost = { mult: r.mult, until: Date.now() + r.sec * 1000 };
      toast(r.label + " (" + r.sec + "s)", "era");
      pop();
    } else if (r.kind === "xp") {
      Object.keys(G().state.skills || {}).forEach((k) => G().gainXp && G().gainXp(k, 70));
      const c = Math.max(40, ((G().clickValue && G().clickValue()) || 1) * 25);
      G().earn(c);
      toast(r.label + " +XP & " + fmt(c), "good");
    } else {
      const amt = Math.floor(r.calc());
      G().earn(amt);
      toast(r.label + " " + fmt(amt) + "!", r.kind === "jackpot" ? "era" : "good");
      if (r.kind === "jackpot") pop();
    }
    if (G().save) G().save();
  }

  let live = null;
  function spawn() {
    if (live || busy() || !ready()) return;
    const r = rollReward();
    const el = document.createElement("button");
    el.className = "wb-opp";
    el.type = "button";
    el.textContent = r.emoji;
    el.title = "Grab it!";
    const left = rnd(10, 80), top = rnd(12, 66); // % within the room frame
    el.style.cssText =
      "position:absolute;left:" + left + "%;top:" + top + "%;z-index:40;width:42px;height:42px;" +
      "display:flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:50%;" +
      "font-size:21px;line-height:1;cursor:pointer;" +
      "background:radial-gradient(circle at 35% 28%,#ffe98a,#f5a623);" +
      "box-shadow:0 0 16px 5px rgba(245,166,35,.6),0 4px 10px rgba(0,0,0,.4);" +
      "animation:wbOppPop .3s ease, wbOppFloat 2.2s ease-in-out infinite;";
    let claimed = false;
    const kill = () => { clearTimeout(timer); if (el.parentNode) el.parentNode.removeChild(el); if (live === el) live = null; };
    el.addEventListener("click", () => {
      if (claimed) return; claimed = true;
      grant(r);
      el.style.animation = "wbOppGo .35s ease forwards";
      setTimeout(kill, 320);
    });
    frame().appendChild(el);
    live = el;
    const timer = setTimeout(() => { if (!claimed) kill(); }, 11000); // miss it and it drifts away
  }

  function injectCSS() {
    if (document.getElementById("wb-opp-css")) return;
    const s = document.createElement("style");
    s.id = "wb-opp-css";
    s.textContent =
      "@keyframes wbOppPop{from{transform:scale(0)}to{transform:scale(1)}}" +
      "@keyframes wbOppFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}" +
      "@keyframes wbOppGo{to{transform:scale(1.9);opacity:0}}" +
      ".wb-opp:hover{filter:brightness(1.12)}";
    document.head.appendChild(s);
  }

  function loop() {
    spawn();
    setTimeout(loop, rnd(45, 95) * 1000); // randomized so it never feels scripted
  }
  function start() {
    if (!ready()) { setTimeout(start, 1000); return; }
    injectCSS();
    setTimeout(loop, rnd(22, 40) * 1000); // first chance soon after you settle in
  }
  start();
})();
