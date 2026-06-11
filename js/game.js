/* WiFi Billionaire — core engine: state, tick loop, income, projects, traits,
   perks, eras, prestige, events scheduling, save/load with offline progress. */
'use strict';

WB.GAME = (function () {
  const D = WB.DATA;
  const SAVE_KEY = "wifi_billionaire_save_v1";
  let UI = null;          // hooks injected by ui.js
  let s = null;           // game state
  let lastTick = 0;
  let saveTimer = 0;
  let achTimer = 0;
  let autoRested = null;  // focus to return to after forced rest

  // ---------- State ----------
  function defaultSkills() {
    const o = {};
    Object.keys(D.SKILLS).forEach(k => o[k] = { level: 0, xp: 0 });
    return o;
  }
  function defaultEquipment() {
    const o = {};
    Object.keys(D.EQUIPMENT).forEach(k => o[k] = D.EQUIPMENT[k].owned0 ? 0 : -1);
    return o;
  }
  function defaultCareers() {
    const o = {};
    Object.keys(D.CAREERS).forEach(k => o[k] = -1);
    o.programmer = 0; // everyone starts as a broke freelancer
    return o;
  }
  function freshRun() {
    return {
      money: 0, lifetimeEarnings: 0,
      runStartedAt: Date.now(),
      res: { energy: 100, happiness: 60, reputation: 0, motivation: 75, intelligence: 10, luck: 5, ego: 0, stress: 0 },
      skills: defaultSkills(),
      equipment: defaultEquipment(),
      careers: defaultCareers(),
      housing: 0,
      focus: "code",
      traits: [],
      traitProgress: { workSec: 0, restSec: 0, grassSec: 0, cryptoSec: 0, contentSec: 0, happySec: 0, riskyChoices: 0 },
      perks: [], perkOffer: null, nextPerkLevel: 3,
      project: null,
      crypto: { holdings: 0, invested: 0 },
      boost: { mult: 1, until: 0 },
      actions: { running: {}, cooldownUntil: {}, notified: {}, pendingScan: null },
      assets: { life: {}, invest: {}, staff: {} },
      eventCooldowns: {},
      nextEventAt: Date.now() + 60000,
      goalIndex: 0,
    };
  }
  function defaultState() {
    const st = freshRun();
    st.version = 1;
    st.allTimeEarnings = 0;
    st.era = 0;
    st.achievements = {};
    st.prestige = { count: 0, legacy: 0, spent: 0, upgrades: {} };
    st.stats = {
      playTimeSec: 0, totalClicks: 0, projectsShipped: 0, projectsFailed: 0, viralProjects: 0,
      projectsByCareer: { programmer: 0, creator: 0, crypto: 0, ai: 0, gamedev: 0 },
      followers: 0, cryptoProfit: 0, cryptoLosses: 0, cryptoTrades: 0,
      equipmentBought: 0, sleepSessions: 0, grassTouched: 0, momInterruptions: 0,
      collapses: 0, maxStressHit: 0, maxHappyHit: 0, eventsSeen: 0,
      richThenBroke: 0, wasRich: 0, fastTenK: 0,
      videosPosted: 0, aiTrainings: 0, marketScans: 0, jamsEntered: 0, socialPosts: 0, coffees: 0,
      gigsDone: 0, lifestyleBought: 0, investProfit: 0, staffHired: 0,
    };
    st.tutorialDone = false;
    st.lastSaved = Date.now();
    return st;
  }

  // ---------- Helpers ----------
  const hasPerk = id => s.perks.includes(id);
  const hasTrait = id => s.traits.includes(id);
  const pup = id => (s.prestige.upgrades[id] || 0);
  const luck = () => s.res.luck + (hasPerk("lucky") ? 5 : 0) + (hasTrait("optimistic") ? 3 : 0) + (hasPerk("rarefind") ? 3 : 0) + pup("legacyluck") * 2;
  const isWorking = () => { const a = D.ACTIVITIES[s.focus]; return a && a.work; };
  const netWorth = () => s.money + s.crypto.holdings + WB.ASSETS.investTotal(s);
  const assetFx = () => WB.ASSETS.fx(s);

  function costMult() {
    return (hasTrait("frugal") ? 0.92 : 1) * assetFx().costMult;
  }

  // ---------- Income ----------
  function equipIncomeMult() {
    let m = 1;
    Object.entries(D.EQUIPMENT).forEach(([k, eq]) => {
      if (eq.effect === "income" && s.equipment[k] >= 0) m *= 1 + eq.val * (s.equipment[k] + 1);
    });
    return m;
  }
  function traitIncomeMult() {
    let m = 1;
    s.traits.forEach(t => { const tr = D.TRAITS[t]; if (tr && tr.income) m *= tr.income; });
    if (hasTrait("visionary") && s.era >= D.ERAS.length - 2) m *= 1.2;
    return m;
  }
  function perkIncomeMult() {
    let m = 1;
    if (hasPerk("grindset")) m *= 1.08;
    if (hasPerk("workaholic_p") && isWorking()) m *= 1.12;
    if (hasPerk("compound")) m *= 1 + 0.01 * s.housing;
    if (hasPerk("trendspotter")) m *= 1.10;
    if (hasPerk("rarefind")) m *= 1.05;
    return m;
  }
  function moodMult() {
    return 0.6 + (s.res.happiness + s.res.motivation) / 250;
  }
  function careerBaseIncome() {
    let total = 0;
    Object.entries(D.CAREERS).forEach(([key, c]) => {
      const tier = s.careers[key];
      if (tier < 0) return;
      let inc = c.tiers[tier].income;
      const focused = D.ACTIVITIES[s.focus] && D.ACTIVITIES[s.focus].career === key;
      inc *= focused ? 1.5 : (hasPerk("sidehustler") ? 1.2 : 1);
      if (key === "crypto" && hasTrait("cryptoaddict")) inc *= 1.25;
      if (key === "creator") {
        if (hasTrait("creator")) inc *= 1.2;
        inc *= 1 + Math.log10(1 + s.stats.followers) * 0.12;
      }
      total += inc;
    });
    return total;
  }
  function incomePerSec() {
    if (!s) return 0;
    let inc = careerBaseIncome();
    inc *= D.HOUSING[s.housing].mult;
    inc *= equipIncomeMult();
    inc *= D.ERAS[s.era].mult;
    inc *= traitIncomeMult();
    inc *= perkIncomeMult();
    inc *= moodMult();
    inc *= 1 + Math.min(s.res.reputation, 500) / 250; // rep bonus capped at x3
    const afx = assetFx();
    inc *= afx.incomeMult;
    inc *= Math.max(0.5, 1 - afx.salaryPct); // staff salaries come off the top
    inc *= 1 + 0.25 * pup("legacyincome");
    if (s.money < 10000 && pup("faststart")) inc *= 1 + 0.5 * pup("faststart");
    if (Date.now() < s.boost.until) inc *= s.boost.mult;
    if (s.res.energy <= 0) inc *= 0.3;
    if (inPrison()) inc *= 0.5; // your operation runs at half speed from a cell
    if (s.focus === "rest") inc *= hasPerk("automation") ? 0.5 : 0.35;
    if (s.focus === "grass" || s.focus === "study") inc *= 0.6;
    return inc;
  }
  function earn(amount) {
    if (amount <= 0) return;
    s.money += amount;
    s.lifetimeEarnings += amount;
    s.allTimeEarnings += amount;
  }
  function clickValue() {
    let v = 1 + incomePerSec() * 0.25;
    const mt = s.equipment.mouse;
    if (mt >= 0) v *= 1 + D.EQUIPMENT.mouse.val * (mt + 1);
    if (hasPerk("clicker")) v *= 1.5;
    return v;
  }

  const inPrison = () => WB.CRIME && WB.CRIME.inPrison();

  // ---------- XP / levels ----------
  const xpForLevel = l => 55 * Math.pow(1.18, l); // gentler curve = less grind
  function xpMult() {
    let m = 1;
    Object.entries(D.EQUIPMENT).forEach(([k, eq]) => {
      if (eq.effect === "xp" && s.equipment[k] >= 0) m *= 1 + eq.val * (s.equipment[k] + 1);
    });
    if (hasPerk("fastlearner")) m *= 1.25;
    s.traits.forEach(t => { const tr = D.TRAITS[t]; if (tr && tr.xp) m *= tr.xp; });
    m *= 1 + 0.2 * pup("legacyxp");
    return m;
  }
  function gainXp(skillKey, amount) {
    const sk = s.skills[skillKey];
    if (!sk || sk.level >= 100) return;
    sk.xp += amount * xpMult();
    while (sk.level < 100 && sk.xp >= xpForLevel(sk.level)) {
      sk.xp -= xpForLevel(sk.level);
      sk.level++;
      UI.toast(`${D.SKILLS[skillKey].icon} ${D.SKILLS[skillKey].name} reached level ${sk.level}!`, "level");
      UI.bubble(WB.THOUGHTS.react("levelup"));
      checkPerkOffer();
    }
  }
  const charLevel = () => Object.values(s.skills).reduce((a, sk) => a + sk.level, 0);
  function checkPerkOffer() {
    if (charLevel() >= s.nextPerkLevel && !s.perkOffer) {
      const pool = D.PERKS.filter(p => !s.perks.includes(p.id) && (!p.rare || pup("rareperks") > 0));
      if (pool.length < 3) return;
      const offer = [];
      while (offer.length < 3) {
        const p = WB.pick(pool);
        if (!offer.includes(p)) offer.push(p);
      }
      s.perkOffer = offer.map(p => p.id);
      UI.offerPerks(offer);
    }
  }
  function choosePerk(idx) {
    if (!s.perkOffer) return;
    const id = s.perkOffer[idx];
    if (!id) return;
    s.perks.push(id);
    s.perkOffer = null;
    s.nextPerkLevel = charLevel() + 3;
    const p = D.PERKS.find(x => x.id === id);
    UI.toast(`${p.icon} Perk gained: ${p.name}`, "good");
  }

  // ---------- Projects ----------
  const PROJECT_NAMES = {
    programmer: ["{appAdj} for {appNoun}", "A to-do app (but different)", "Yet Another JS Framework", "Browser extension for {appNoun}", "An API for {appNoun}", "SaaS dashboard nobody asked for"],
    creator: ["Vlog series about {appNoun}", "Day-in-the-life video", "Tutorial: monetizing {appNoun}", "Reaction video marathon", "Documentary on {appNoun}", "Podcast episode #{n}"],
    ai: ["AI that classifies {appNoun}", "Chatbot for {appNoun}", "AutoAgent for {appNoun}", "Prompt pack: {appNoun} edition", "Fine-tuned model for {appNoun}"],
    gamedev: ["Roguelike about {appNoun}", "Cozy sim: {appNoun} Valley", "Idle game about {appNoun}", "Horror game: The {appNoun}", "Platformer with {appNoun} physics"],
  };
  function startProject() {
    const a = D.ACTIVITIES[s.focus];
    if (!a || !a.career || a.career === "crypto") { s.project = null; return; }
    let name = WB.THOUGHTS.fill(WB.pick(PROJECT_NAMES[a.career] || PROJECT_NAMES.programmer));
    name = name.replace("{n}", 1 + s.stats.projectsShipped);
    s.project = { name, career: a.career, skill: a.skill, progress: 0, required: 60 + Math.random() * 90 };
  }
  function projectSpeed() {
    const skill = s.skills[s.project.skill].level;
    let sp = 1 + skill * 0.02;
    if (hasTrait("builder")) sp *= 1.15;
    if (hasPerk("caffeinated")) sp *= 1.15;
    if (hasPerk("shipit")) sp *= 1.2;
    if (hasPerk("perfectionist")) sp *= 0.85;
    return sp;
  }
  function finishProject() {
    const p = s.project;
    const skill = s.skills[p.skill].level;
    let pSuccess = Math.min(0.92, 0.55 + skill * 0.004 + luck() * 0.01) - (hasPerk("shipit") ? 0.05 : 0);
    const swing = hasTrait("risktaker") ? 1.3 : 1;
    const viralChance = (0.04 + luck() * 0.003) * (hasPerk("viralgenius") ? 2 : 1);
    let payout = (incomePerSec() * WB.rand(45, 120) + 25);
    if (hasPerk("perfectionist")) payout *= 1.35;

    if (WB.chance(pSuccess)) {
      const viral = WB.chance(viralChance);
      if (viral) {
        payout *= 12 * swing;
        s.stats.viralProjects++;
        s.boost = { mult: 2.5, until: Date.now() + 90000 };
        UI.toast(`🚀 "${p.name}" WENT VIRAL! +${WB.fmt(payout, true)} and a 2.5x income surge!`, "viral");
      } else {
        UI.toast(`✅ Shipped "${p.name}" — +${WB.fmt(payout, true)}`, "good");
      }
      earn(payout);
      s.stats.projectsShipped++;
      s.stats.projectsByCareer[p.career]++;
      s.res.motivation = Math.min(100, s.res.motivation + 8);
      s.res.reputation += 1 + (viral ? 8 : 0);
      s.stats.followers += Math.round((viral ? 150 : 5) * (hasPerk("influence") ? 1.25 : 1));
      UI.bubble(WB.THOUGHTS.react("success"));
    } else {
      const scraps = payout * 0.08 / swing;
      earn(scraps);
      s.stats.projectsFailed++;
      s.res.motivation = Math.max(0, s.res.motivation - 7 * swing);
      s.res.stress = Math.min(100, s.res.stress + 6);
      UI.toast(`💥 "${p.name}" flopped. Scraps: ${WB.fmt(scraps, true)}`, "bad");
      UI.bubble(WB.THOUGHTS.react("fail"));
    }
    s.project = null;
  }

  // ---------- Crypto ----------
  function buyCrypto(frac) {
    const amt = s.money * frac;
    if (amt < 1) return;
    s.money -= amt;
    s.crypto.holdings += amt;
    s.crypto.invested += amt;
    s.stats.cryptoTrades++;
    UI.toast(`🪙 Bought ${WB.fmt(amt, true)} of crypto. What could go wrong?`, "good");
  }
  function sellCrypto() {
    if (s.crypto.holdings < 1) return;
    const sold = s.crypto.holdings;
    const profit = sold - s.crypto.invested;
    s.money += sold;
    // only profit counts as earnings, or buy/sell cycling would inflate era progress
    if (profit > 0) {
      s.lifetimeEarnings += profit;
      s.allTimeEarnings += profit;
      s.stats.cryptoProfit += profit;
    } else s.stats.cryptoLosses += -profit;
    s.crypto.holdings = 0;
    s.crypto.invested = 0;
    s.stats.cryptoTrades++;
    UI.toast(`💰 Sold all crypto for ${WB.fmt(sold, true)} (${profit >= 0 ? "+" : ""}${WB.fmt(profit, true)} P/L)`, profit >= 0 ? "good" : "bad");
  }
  function tickCrypto(dt) {
    if (s.crypto.holdings <= 0) return;
    const skill = s.skills.trading.level;
    let edge = skill * 0.00035 - 0.00008;
    if (s.focus === "crypto") edge *= 2.2;
    if (hasPerk("cryptowizard")) edge += 0.0003;
    const noise = (Math.random() * 2 - 1) * 0.005;
    s.crypto.holdings = Math.max(0, s.crypto.holdings * (1 + (edge + noise) * dt));
  }

  // ---------- Traits ----------
  function checkTraits() {
    const tp = s.traitProgress, st = s.stats;
    const grant = (id) => {
      if (s.traits.includes(id)) return;
      s.traits.push(id);
      const tr = D.TRAITS[id];
      UI.toast(`${tr.icon} New trait developed: ${tr.name} — ${tr.desc}`, "trait");
      UI.bubble(`So apparently I'm "${tr.name}" now. The character arc continues.`);
    };
    if (tp.workSec > 9000) grant("workaholic");
    if (tp.restSec > 3600 && tp.restSec > tp.workSec && !hasTrait("workaholic")) grant("lazy");
    if (tp.cryptoSec > 2700 || st.cryptoTrades > 40) grant("cryptoaddict");
    if (tp.contentSec > 2700) grant("creator");
    if (st.projectsShipped >= 15) grant("builder");
    if (Object.values(s.careers).reduce((a, t) => a + Math.max(0, t + 1), 0) >= 5) grant("ambitious");
    if (tp.happySec > 1200) grant("optimistic");
    if (tp.riskyChoices >= 5) grant("risktaker");
    if (s.era >= 2) grant("visionary");
    if (s.money > 10000 && s.housing === 0) grant("frugal");
    if (Object.keys(s.achievements).length >= 30) grant("competitive");
  }

  // ---------- Eras ----------
  function checkEra() {
    const next = s.era + 1;
    if (next < D.ERAS.length && s.allTimeEarnings >= D.ERAS[next].req) {
      s.era = next;
      const e = D.ERAS[next];
      UI.toast(`🗓️ THE WORLD HAS CHANGED — Welcome to ${e.year}: ${e.name}! All income x${e.mult}. ${e.desc}`, "era");
      UI.confetti();
      UI.bubble(WB.THOUGHTS.react("era" + next) || "New era, new hustle.");
    }
  }

  // ---------- Events ----------
  function onCooldown(id) {
    return (s.eventCooldowns[id] || 0) > Date.now();
  }
  function applyEffect(eff) {
    if (!eff) return;
    if (eff.money) { eff.money > 0 ? earn(eff.money) : s.money = Math.max(0, s.money + eff.money); }
    if (eff.moneyPct) {
      const d = s.money * eff.moneyPct;
      d > 0 ? earn(d) : s.money = Math.max(0, s.money + d);
    }
    if (eff.cryptoPct) s.crypto.holdings = Math.max(0, s.crypto.holdings * (1 + eff.cryptoPct));
    if (eff.investPct) Object.values(s.assets.invest).forEach(h => h.value = Math.max(0, h.value * (1 + eff.investPct)));
    if (eff.energy) s.res.energy = Math.max(0, Math.min(100, s.res.energy + eff.energy));
    if (eff.happiness) s.res.happiness = Math.max(0, Math.min(100, s.res.happiness + eff.happiness));
    if (eff.stress) s.res.stress = Math.max(0, Math.min(100, s.res.stress + eff.stress));
    if (eff.motivation) s.res.motivation = Math.max(0, Math.min(100, s.res.motivation + eff.motivation));
    if (eff.reputation) s.res.reputation = Math.max(0, s.res.reputation + eff.reputation * (eff.reputation > 0 && hasPerk("networking") ? 1.5 : 1));
    if (eff.intelligence) s.res.intelligence += eff.intelligence;
    if (eff.ego) s.res.ego += eff.ego;
    if (eff.followers) s.stats.followers += Math.round(eff.followers * (hasPerk("influence") ? 1.25 : 1));
    if (eff.skillXp) {
      const key = eff.skillXp.skill || (D.ACTIVITIES[s.focus] && D.ACTIVITIES[s.focus].skill) || "coding";
      gainXp(key, eff.skillXp.amount);
    }
    if (eff.incomeBoost) s.boost = { mult: eff.incomeBoost.mult, until: Date.now() + eff.incomeBoost.sec * 1000 };
  }
  function fireEvent() {
    const picked = WB.EVENTS.pickEvent(s);
    if (!picked) return;
    s.stats.eventsSeen++;
    if (picked.kind === "major") {
      s.eventCooldowns[picked.ev.id] = Date.now() + 300000;
      UI.showEventModal(picked.ev);
    } else {
      const ev = picked.ev;
      const text = WB.EVENTS.fill(ev.text);
      if (/Mom interrupts|vacuums/.test(ev.text)) s.stats.momInterruptions++;
      applyEffect(ev.effect(s));
      UI.toast("🎲 " + text, "event");
      if (ev.bubble) UI.bubble(WB.THOUGHTS.fill(ev.bubble));
    }
  }
  function resolveMajorChoice(ev, idx) {
    const c = ev.choices[idx];
    let text, eff;
    if (c.luckCheck !== undefined) {
      s.traitProgress.riskyChoices++;
      const p = Math.min(0.95, c.luckCheck + luck() * 0.012);
      if (WB.chance(p)) { text = c.result; eff = c.effect(s); }
      else { text = c.failResult; eff = c.failEffect(s); }
    } else {
      text = c.result; eff = c.effect(s);
    }
    applyEffect(eff);
    return WB.EVENTS.fill(text);
  }

  // ---------- Purchases ----------
  function equipCost(cat) {
    const t = s.equipment[cat] + 1;
    const tiersArr = D.EQUIPMENT[cat].tiers;
    if (t >= tiersArr.length) return null;
    return tiersArr[t].cost * costMult() * (hasPerk("minimalist") ? 0.9 : 1);
  }
  function buyEquipment(cat) {
    const cost = equipCost(cat);
    if (cost === null || s.money < cost) return false;
    s.money -= cost;
    s.equipment[cat]++;
    s.stats.equipmentBought++;
    const eq = D.EQUIPMENT[cat];
    UI.toast(`${eq.icon} Upgraded ${eq.label}: ${eq.tiers[s.equipment[cat]].name}`, "good");
    UI.bubble(WB.pick([
      "New gear. Productivity +1000%. Source: vibes.",
      "This purchase was definitely a business expense.",
      "Treat yourself. For the business. For. The. Business.",
      "Unboxing this felt better than my last three weekends.",
    ]));
    UI.roomDirty();
    return true;
  }
  function housingCost() {
    if (s.housing + 1 >= D.HOUSING.length) return null;
    return D.HOUSING[s.housing + 1].cost * costMult();
  }
  function buyHousing() {
    const cost = housingCost();
    if (cost === null || s.money < cost) return false;
    s.money -= cost;
    s.housing++;
    const h = D.HOUSING[s.housing];
    UI.toast(`🏠 MOVED! Welcome to the ${h.name}. Income x${h.mult}!`, "era");
    UI.confetti();
    UI.bubble(s.housing === 1 ? "Goodbye childhood bedroom. You were... fine." : `New place: ${h.name}. The grind has upgraded its container.`);
    s.res.happiness = Math.min(100, s.res.happiness + 15);
    UI.roomDirty();
    return true;
  }
  function careerCost(path) {
    const c = D.CAREERS[path];
    const t = s.careers[path] + 1;
    if (t >= c.tiers.length) return null;
    return c.tiers[t].cost * costMult() * (hasPerk("negotiator") ? 0.85 : 1);
  }
  function canAdvanceCareer(path) {
    const c = D.CAREERS[path];
    const t = s.careers[path] + 1;
    if (t >= c.tiers.length) return { ok: false, reason: "Maxed out" };
    if (s.era < c.reqEra) return { ok: false, reason: `Unlocks in the ${D.ERAS[c.reqEra].name} (${D.ERAS[c.reqEra].year})` };
    const tier = c.tiers[t];
    if (s.skills[c.skill].level < tier.reqSkill) return { ok: false, reason: `Needs ${D.SKILLS[c.skill].name} lvl ${tier.reqSkill}` };
    if (s.res.reputation < tier.reqRep) return { ok: false, reason: `Needs ${tier.reqRep} reputation` };
    if (s.money < careerCost(path)) return { ok: false, reason: "Not enough money" };
    return { ok: true };
  }
  function advanceCareer(path) {
    if (!canAdvanceCareer(path).ok) return false;
    s.money -= careerCost(path);
    s.careers[path]++;
    const c = D.CAREERS[path];
    const tier = c.tiers[s.careers[path]];
    UI.toast(`${c.icon} CAREER UP: You are now a ${tier.name}! (+${WB.fmt(tier.income, true)}/s base)`, "era");
    UI.bubble(WB.pick([
      `${tier.name}. It's official. Updating every bio immediately.`,
      "Promotion! By me. To me. From me. Still counts.",
      "The business plan is working. There was never a business plan.",
    ]));
    gainXp("business", 150);
    return true;
  }

  // ---------- Focus / hustle ----------
  function setFocus(f) {
    if (!D.ACTIVITIES[f]) return;
    if (D.ACTIVITIES[f].reqEra && s.era < D.ACTIVITIES[f].reqEra) return;
    if (s.focus === f) return;
    s.focus = f;
    autoRested = null;
    if (f === "rest") s.stats.sleepSessions++;
    if (f === "grass") s.stats.grassTouched++;
    s.project = null;
    UI.bubble(WB.THOUGHTS.react(f) || "");
  }
  function hustle() {
    if (inPrison()) return 0;
    const v = clickValue();
    earn(v);
    s.stats.totalClicks++;
    gainXp("business", 1.5);
    return v;
  }

  // ---------- Prestige ----------
  const PRESTIGE_REQ = 1e9;
  const legacyGain = () => netWorth() >= PRESTIGE_REQ ? Math.floor(10 * Math.sqrt(netWorth() / PRESTIGE_REQ)) : 0;
  function doPrestige() {
    const gain = legacyGain();
    if (gain <= 0) return false;
    s.prestige.count++;
    s.prestige.legacy += gain;
    const keep = {
      version: s.version, allTimeEarnings: s.allTimeEarnings, era: s.era,
      achievements: s.achievements, prestige: s.prestige, stats: s.stats, lastSaved: s.lastSaved,
    };
    const run = freshRun();
    Object.assign(s, run, keep);
    s.money = 1000 * pup("headstart");
    const kh = pup("keephardware");
    if (kh > 0) Object.keys(s.equipment).forEach(k => {
      s.equipment[k] = Math.max(s.equipment[k], Math.min(kh - 1, D.EQUIPMENT[k].tiers.length - 1));
    });
    UI.toast(`♻️ REBIRTH #${s.prestige.count}! +${gain} Legacy Points. The grind begins anew — but stronger.`, "era");
    UI.confetti();
    UI.bubble("Back to mom's bedroom. But this time... I know things.");
    UI.roomDirty();
    save();
    return true;
  }
  function prestigeUpgradeCost(id) {
    const u = D.PRESTIGE_UPGRADES.find(x => x.id === id);
    const lvl = pup(id);
    if (lvl >= u.max) return null;
    return Math.ceil(u.baseCost * Math.pow(u.costGrowth, lvl));
  }
  function buyPrestigeUpgrade(id) {
    const cost = prestigeUpgradeCost(id);
    const avail = s.prestige.legacy - s.prestige.spent;
    if (cost === null || avail < cost) return false;
    s.prestige.spent += cost;
    s.prestige.upgrades[id] = pup(id) + 1;
    const u = D.PRESTIGE_UPGRADES.find(x => x.id === id);
    UI.toast(`${u.icon} Legacy upgrade: ${u.name} → level ${pup(id)}`, "good");
    return true;
  }

  // ---------- Tick ----------
  function tick() {
    const now = Date.now();
    let dt = (now - lastTick) / 1000;
    lastTick = now;
    if (dt <= 0) return;
    dt = Math.min(dt, 2); // hiccup guard; offline handled separately
    const r = s.res, tp = s.traitProgress;
    const a = D.ACTIVITIES[s.focus];

    s.stats.playTimeSec += dt;

    // Income
    earn(incomePerSec() * dt);

    // Energy / stress / happiness
    const afx = assetFx();
    if (a && a.work) {
      let drain = 0.20;
      const ct = s.equipment.chair;
      if (ct >= 0) drain *= Math.max(0.4, 1 - D.EQUIPMENT.chair.val * (ct + 1));
      if (hasPerk("nightowl")) drain *= 0.8;
      drain *= afx.energyDrain;
      s.traits.forEach(t => { const tr = D.TRAITS[t]; if (tr && tr.energyDrain) drain *= tr.energyDrain; });
      r.energy = Math.max(0, r.energy - drain * dt);
      r.stress = Math.min(100, r.stress + 0.045 * (hasPerk("zen") ? 0.7 : 1) * afx.stressMult * dt);
      r.happiness = Math.max(hasPerk("ramenmaster") ? 30 : 0, r.happiness - 0.012 * dt);
      tp.workSec += dt;
      if (s.focus === "crypto") tp.cryptoSec += dt;
      if (s.focus === "content") tp.contentSec += dt;
    } else if (s.focus === "rest") {
      r.energy = Math.min(100, r.energy + 1.2 * dt);
      r.stress = Math.max(0, r.stress - 0.15 * dt);
      tp.restSec += dt;
    } else if (s.focus === "grass") {
      const g = hasPerk("touchgrass") ? 1.5 : 1;
      r.energy = Math.min(100, r.energy + 0.3 * g * dt);
      r.happiness = Math.min(100, r.happiness + 0.15 * g * dt);
      r.stress = Math.max(0, r.stress - 0.5 * g * dt);
      tp.grassSec += dt;
    }

    // Drift toward baselines
    const happyBase = Math.min(92, 45 + s.housing * 4 + afx.happy);
    r.happiness += (happyBase - r.happiness) * 0.002 * dt;
    r.motivation += ((50 + r.happiness * 0.3) - r.motivation) * 0.004 * dt;
    if (afx.motivFloor) r.motivation = Math.max(r.motivation, afx.motivFloor);
    if (r.happiness > 75) tp.happySec += dt;
    if (r.stress >= 99.5) s.stats.maxStressHit = 1;
    if (r.happiness >= 99.5) s.stats.maxHappyHit = 1;

    // Collapse / auto-rest behavior (character feels alive)
    if (r.energy <= 1 && a && a.work) {
      s.stats.collapses++;
      autoRested = s.focus;
      s.focus = "rest";
      s.stats.sleepSessions++;
      UI.toast("😵 Your entrepreneur collapsed face-first onto the keyboard. Forced nap initiated.", "bad");
      UI.bubble("qwertyuiop... zzz...");
    } else if (autoRested && r.energy >= 80) {
      s.focus = autoRested;
      autoRested = null;
      UI.bubble(WB.pick(["Okay. Recharged. Back to the grind.", "I'm alive again. The empire missed me.", "Power nap complete. Productivity restored to dangerous levels."]));
    }

    // XP from focused activity (boosted in v5 to reduce grind)
    if (a && a.skill && a.work) {
      gainXp(a.skill, (7 + r.intelligence * 0.07) * dt);
    } else if (s.focus === "study") {
      gainXp("business", 6 * dt);
      r.intelligence += 0.012 * dt;
      r.energy = Math.max(0, r.energy - 0.08 * dt);
    }

    // Reputation trickle from senior careers
    const tierSum = Object.values(s.careers).reduce((x, t) => x + Math.max(0, t), 0);
    if (tierSum > 0 && a && a.work) r.reputation += 0.002 * tierSum * (hasPerk("networking") ? 1.5 : 1) * dt;

    // Followers from content focus
    if (s.careers.creator >= 0) {
      const ft = (s.careers.creator + 1) ** 2 * 0.05 * (s.focus === "content" ? 2 : 0.5);
      s.stats.followers += ft * (hasPerk("influence") ? 1.25 : 1) * dt;
    }

    // Ego follows wealth & fame
    r.ego = Math.min(100, Math.log10(1 + s.money) * 5 + Math.log10(1 + s.stats.followers) * 3);

    // Projects
    if (a && a.work && a.career && a.career !== "crypto" && s.careers[a.career] >= 0) {
      if (!s.project) startProject();
      else {
        s.project.progress += projectSpeed() * dt;
        if (s.project.progress >= s.project.required) finishProject();
      }
    }

    // Crypto + investment drift
    tickCrypto(dt);
    WB.ASSETS.tick(s, dt);
    if (WB.CRIME) WB.CRIME.tick(dt);

    // Wealth-arc stats
    if (s.money >= 100000) s.stats.wasRich = 1;
    if (s.stats.wasRich && s.money < 100) { s.stats.richThenBroke = 1; s.stats.wasRich = 0; }
    if (s.money >= 10000 && (now - s.runStartedAt) < 1.8e6) s.stats.fastTenK = 1;

    // Manual actions (completion notifications)
    WB.ACTIONS.tick();

    // Events
    if (now >= s.nextEventAt && !UI.modalOpen()) {
      fireEvent();
      s.nextEventAt = now + (40 + Math.random() * 55) * 1000;
    }

    // Era / traits / goals
    checkEra();

    // Goal progression
    while (s.goalIndex < D.GOALS.length && D.GOALS[s.goalIndex].check(s)) {
      UI.toast(`🎯 Goal complete: ${D.GOALS[s.goalIndex].text}`, "goal");
      s.goalIndex++;
    }

    // Throttled checks
    achTimer += dt;
    if (achTimer >= 1) {
      achTimer = 0;
      checkTraits();
      WB.ACHIEVEMENTS.checkAll(s, a2 => UI.notifyAchievement(a2));
      checkPerkOffer();
    }

    // Autosave
    saveTimer += dt;
    if (saveTimer >= 5) { saveTimer = 0; save(); }
  }

  // ---------- Save / load ----------
  let suppressSave = false; // blocks the beforeunload autosave during reset/import
  function save() {
    if (suppressSave) return;
    s.lastSaved = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* storage full/blocked */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.version !== 1) return null;
      // merge over defaults so new fields survive updates
      const base = defaultState();
      deepMerge(base, data);
      return base;
    } catch (e) { return null; }
  }
  function deepMerge(target, src) {
    for (const k of Object.keys(src)) {
      if (src[k] && typeof src[k] === "object" && !Array.isArray(src[k]) && target[k] && typeof target[k] === "object") {
        deepMerge(target[k], src[k]);
      } else {
        target[k] = src[k];
      }
    }
  }
  function offlineProgress() {
    const away = (Date.now() - s.lastSaved) / 1000;
    if (away < 60) return null;
    const capHours = 8 + pup("offlinecap") * 4;
    const sec = Math.min(away, capHours * 3600);
    let gained = incomePerSec() * sec * 0.5;
    if (hasPerk("investor")) gained *= 1.25;
    if (gained < 1) return null;
    earn(gained);
    s.res.energy = Math.min(100, s.res.energy + sec / 120);
    return { away, gained };
  }
  function exportSave() {
    save();
    return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  }
  function importSave(str) {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
      if (!data || data.version !== 1) return false;
      suppressSave = true;
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      location.reload();
      return true;
    } catch (e) { return false; }
  }
  function hardReset() {
    suppressSave = true;
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }

  // ---------- Boot ----------
  function init(uiHooks) {
    UI = uiHooks;
    s = load() || defaultState();
    const off = offlineProgress();
    lastTick = Date.now();
    setInterval(tick, 100);
    window.addEventListener("beforeunload", save);
    return { state: s, offline: off };
  }

  return {
    init, save,
    get state() { return s; },
    incomePerSec, clickValue, hustle, setFocus, netWorth,
    buyEquipment, equipCost, buyHousing, housingCost,
    advanceCareer, canAdvanceCareer, careerCost,
    buyCrypto, sellCrypto,
    choosePerk, resolveMajorChoice, applyEffect, onCooldown,
    xpForLevel, charLevel, luck, earn, gainXp, inPrison,
    PRESTIGE_REQ, legacyGain, doPrestige, prestigeUpgradeCost, buyPrestigeUpgrade,
    exportSave, importSave, hardReset,
  };
})();
