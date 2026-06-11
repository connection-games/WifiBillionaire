/* WiFi Billionaire — crime category: instant-commit crimes, heat, prison, payouts.
   The interactive phishing/scam mode lives in scam.js; this module owns the rest:
   crime definitions, the catch/heat math, jail time, and bail. */
'use strict';

WB.CRIME = (function () {
  const S = () => WB.GAME.state;
  const ips = () => WB.GAME.incomePerSec();
  const now = () => Date.now();

  // payout = `minutes of income` * range, so crime scales with your operation, not flat.
  // risk = base catch chance. sentence = jail seconds if caught. heat = added on success.
  const CRIMES = [
    { id: "fakestore", name: "Fake Online Store", icon: "🛒",
      desc: "Spin up a store that takes orders and ships nothing.",
      mins: [3, 8], risk: 0.12, sentence: 120, heat: 6, reqLevel: 0,
      flavorWin: ["Orders rolled in. Tracking numbers did not.", "Five-star reviews from accounts you made. Genius."],
      flavorLoss: ["A customer reverse-image-searched your 'warehouse'. It was a stock photo.", "Chargebacks. So many chargebacks. Then a knock at the door."] },
    { id: "carding", name: "Card Skimming", icon: "💳",
      desc: "Skim card numbers off a sketchy payment page.",
      mins: [5, 12], risk: 0.2, sentence: 200, heat: 10, reqLevel: 5, reqSkill: { coding: 8 },
      flavorWin: ["Numbers harvested. The dark web tips its hat.", "Quick, clean, deeply illegal. Nice."],
      flavorLoss: ["Turns out the bank has a fraud team. A good one.", "You skimmed a detective's card. Of all the cards."] },
    { id: "identity", name: "Identity Theft", icon: "🪪",
      desc: "Become someone else, financially speaking.",
      mins: [8, 18], risk: 0.24, sentence: 320, heat: 14, reqLevel: 10, reqSkill: { coding: 14 },
      flavorWin: ["You opened 6 credit lines as 'Gerald'. Sorry, Gerald.", "Gerald's credit score is now your problem. And income."],
      flavorLoss: ["The real Gerald noticed. Gerald has a lawyer cousin.", "Identity returned to sender. With handcuffs."] },
    { id: "rugpull", name: "Crypto Rug Pull", icon: "🪙",
      desc: "Launch {coin}, pump it, vanish with the liquidity.",
      mins: [14, 30], risk: 0.3, sentence: 500, heat: 22, reqLevel: 14, reqSkill: { trading: 18 },
      flavorWin: ["Liquidity: pulled. Community: devastated. Wallet: full.", "You tweeted 'sorry anon' and bought an island."],
      flavorLoss: ["The holders doxxed you in 40 minutes. Crypto people are fast.", "On-chain forensics are real, apparently. Who knew."] },
    { id: "ponzi", name: "Ponzi Scheme", icon: "🏦",
      desc: "Pay old investors with new investors. Forever. (It's never forever.)",
      mins: [22, 50], risk: 0.34, sentence: 800, heat: 30, reqLevel: 20, reqSkill: { business: 20 },
      flavorWin: ["The returns are 'guaranteed'. The math is not.", "New money covers old money covers your new yacht."],
      flavorLoss: ["The music stopped. You were holding the chair.", "An investor asked to 'just see the books'. The end."] },
    { id: "counterfeit", name: "Counterfeit Sneakers", icon: "👟",
      desc: "Sell 'limited edition' kicks made in a very unlimited factory.",
      mins: [4, 10], risk: 0.16, sentence: 160, heat: 8, reqLevel: 4,
      flavorWin: ["'Authentic'. The glue smell adds character.", "Hypebeasts paid retail for $4 of materials. Beautiful."],
      flavorLoss: ["A customer noticed the logo said 'Nikee'. Sloppy.", "Customs opened the container. Customs was not amused."] },
    { id: "ddos", name: "DDoS-for-Hire", icon: "🌐",
      desc: "Rent out your botnet to people with grudges.",
      mins: [10, 22], risk: 0.28, sentence: 420, heat: 18, reqLevel: 16, reqSkill: { coding: 22 },
      flavorWin: ["Someone's competitor is having a very slow day.", "Payment in crypto, chaos delivered on schedule."],
      flavorLoss: ["You DDoS'd a server the FBI was hosting. Bold.", "Your botnet had a snitch in it. They always do."] },
    { id: "launder", name: "Launder Heat", icon: "🧼", launder: true,
      desc: "Run dirty money through a 'car wash empire' to cool things down.",
      mins: [0, 0], risk: 0, sentence: 0, heat: 0, reqLevel: 0,
      flavorWin: ["The books are squeaky clean now. Allegedly."] },
  ];

  function crimeState() {
    const s = S();
    if (!s.crime) s.crime = { heat: 0, prisonUntil: 0, prisonReason: "", timesCaught: 0, crimeEarnings: 0, crimesDone: 0, scamSuccess: 0, scamFail: 0, victimsScammed: {} };
    return s.crime;
  }

  const inPrison = () => crimeState().prisonUntil > now();
  const prisonLeft = () => Math.max(0, crimeState().prisonUntil - now());
  const heat = () => crimeState().heat;

  function addHeat(n) {
    const c = crimeState();
    c.heat = Math.max(0, Math.min(100, c.heat + n));
  }
  function addDirtyMoney(amount) {
    const c = crimeState();
    WB.GAME.earn(amount);
    c.crimeEarnings += amount;
  }

  function goToPrison(sec, reason) {
    const c = crimeState();
    c.prisonUntil = now() + sec * 1000;
    c.prisonReason = reason;
    c.timesCaught++;
    WB.UI.toast(`🚔 BUSTED: ${reason} — ${WB.fmtTime(sec)} in jail. Manual actions are locked.`, "bad");
    WB.UI.bubble(WB.pick([
      "Okay this is fine. This is a networking opportunity. In prison.",
      "One phone call. I'm calling my accountant.",
      "I regret nothing. I regret some things. I regret getting caught.",
    ]));
    if (WB.UI.showPrison) WB.UI.showPrison();
  }

  function bailCost() {
    const c = crimeState();
    const left = prisonLeft() / 1000;
    return Math.max(500, ips() * left * 1.5 + left * 50);
  }
  function postBail() {
    const c = crimeState();
    if (!inPrison()) return false;
    const cost = bailCost();
    if (S().money < cost) { WB.UI.toast("💸 Can't afford bail. Wait it out.", "bad"); return false; }
    S().money -= cost;
    c.prisonUntil = 0;
    addHeat(8);
    WB.UI.toast(`⚖️ Posted bail for ${WB.fmt(cost, true)}. Free… for now. (+heat)`, "info");
    return true;
  }

  function eligible(cr) {
    const s = S();
    if (cr.reqLevel && WB.GAME.charLevel() < cr.reqLevel) return { ok: false, why: `Needs character level ${cr.reqLevel}` };
    if (cr.reqSkill) {
      for (const [k, lv] of Object.entries(cr.reqSkill)) {
        if (s.skills[k].level < lv) return { ok: false, why: `Needs ${WB.DATA.SKILLS[k].name} lvl ${lv}` };
      }
    }
    return { ok: true };
  }

  function catchChance(cr) {
    const c = crimeState();
    let p = cr.risk + c.heat * 0.0035 - WB.GAME.luck() * 0.012;
    // relevant skill lowers risk
    if (cr.reqSkill) {
      const k = Object.keys(cr.reqSkill)[0];
      p -= S().skills[k].level * 0.0025;
    }
    return Math.max(0.03, Math.min(0.9, p));
  }

  function commit(id) {
    const s = S(), c = crimeState();
    const cr = CRIMES.find(x => x.id === id);
    if (!cr) return null;
    if (inPrison()) return { refused: "You're in jail. Sit tight." };
    const el = eligible(cr);
    if (!el.ok) return { refused: el.why };

    if (cr.launder) {
      const cost = Math.max(200, s.money * 0.08);
      if (s.money < cost) return { refused: "Need more cash to launder convincingly." };
      s.money -= cost;
      addHeat(-35);
      return { icon: "🧼", title: "Money Laundered", win: true,
        lines: [WB.pick(cr.flavorWin), `Paid ${WB.fmt(cost, true)} in 'expenses'. Heat dropped a lot.`], money: -cost };
    }

    const caught = WB.chance(catchChance(cr));
    if (caught) {
      c.scamFail++;
      addHeat(cr.heat * 0.6);
      const sentence = Math.round(cr.sentence * (1 + c.heat / 200));
      goToPrison(sentence, cr.name);
      return { icon: "🚔", title: "Caught!", win: false,
        lines: [WB.pick(cr.flavorLoss), `Sentence: ${WB.fmtTime(sentence)}.`], money: 0, caught: true };
    }
    const payout = ips() * 60 * WB.rand(cr.mins[0], cr.mins[1]) + 50;
    addDirtyMoney(payout);
    addHeat(cr.heat);
    c.crimesDone++;
    WB.GAME.gainXp("business", 30);
    return { icon: cr.icon, title: cr.name + " — Success", win: true,
      lines: [WB.THOUGHTS.fill(WB.pick(cr.flavorWin)), `Take: ${WB.fmt(payout, true)}. Heat is rising though.`], money: payout };
  }

  // called from scam.js when a texting scam resolves
  function scamResolved(win, payout, victimId, reported) {
    const c = crimeState();
    if (win) {
      c.scamSuccess++;
      c.victimsScammed[victimId] = (c.victimsScammed[victimId] || 0) + 1;
      addDirtyMoney(payout);
      addHeat(7);
      WB.GAME.gainXp("business", 40);
    } else {
      c.scamFail++;
      if (reported) {
        addHeat(16);
        // a fresh report can land you in jail if heat is already high
        if (WB.chance(0.18 + c.heat * 0.004)) goToPrison(150 + Math.round(c.heat * 2), "Wire fraud (reported)");
        else WB.UI.toast("🚨 The mark reported you. Heat is climbing — lay low.", "bad");
      }
    }
  }

  // tick: heat decay + auto-release
  function tick(dt) {
    const c = crimeState();
    if (c.heat > 0) c.heat = Math.max(0, c.heat - 0.04 * dt);
    if (c.prisonUntil && c.prisonUntil <= now()) {
      c.prisonUntil = 0;
      WB.UI.toast("🔓 Released from jail. Reformed? Absolutely not.", "good");
      WB.UI.bubble("Free man. Free WiFi. Back to it.");
      if (WB.UI.hidePrison) WB.UI.hidePrison();
    }
  }

  return { CRIMES, crimeState, commit, eligible, catchChance, inPrison, prisonLeft, heat, addHeat,
    addDirtyMoney, goToPrison, bailCost, postBail, scamResolved, tick };
})();
