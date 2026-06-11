/* WiFi Billionaire — assets: lifestyle purchases, fluctuating investments, hireable staff.
   Lifestyle = one-time buys with permanent effects. Investments = buy/sell with drifting
   value. Staff = ongoing salary (% of income) in exchange for buffs. */
'use strict';

WB.ASSETS = (function () {

  const LIFESTYLE = [
    { id: "espresso",  name: "Espresso Machine",        icon: "☕", cost: 400,    happy: 1, desc: "+1 happiness baseline. The beans respect you now." },
    { id: "console",   name: "Game Console",            icon: "🎮", cost: 900,    happy: 2, desc: "+2 happiness baseline. For 'market research'." },
    { id: "scooter",   name: "E-Scooter",               icon: "🛴", cost: 1800,   happy: 1, rep: 2, desc: "+1 happiness, +2 reputation. You are now 'that guy'." },
    { id: "sneakers",  name: "Sneaker Collection",      icon: "👟", cost: 4000,   happy: 1, rep: 4, desc: "+1 happiness, +4 reputation. Never worn outside." },
    { id: "hatchback", name: "Used Hatchback",          icon: "🚗", cost: 12000,  happy: 2, rep: 4, desc: "+2 happiness, +4 reputation. It mostly starts." },
    { id: "gym",       name: "Home Gym",                icon: "🏋️", cost: 35000,  energyDrain: 0.93, desc: "Energy drains 7% slower. The {body} thanks you." },
    { id: "hottub",    name: "Hot Tub",                 icon: "🛁", cost: 90000,  stressMult: 0.88, happy: 2, desc: "Stress builds 12% slower. Ideas happen in here." },
    { id: "cinema",    name: "Home Cinema",             icon: "🍿", cost: 220000, happy: 4, desc: "+4 happiness baseline. The popcorn machine was non-negotiable." },
    { id: "sportscar", name: "Sports Car",              icon: "🏎️", cost: 700000, happy: 4, rep: 14, desc: "+4 happiness, +14 reputation. It's red. Obviously." },
    { id: "watch",     name: "Tourbillon Watch",        icon: "⌚", cost: 3e6,    rep: 18, desc: "+18 reputation. Tells worse time than your phone." },
    { id: "art",       name: "Questionable Modern Art", icon: "🖼️", cost: 8e6,    rep: 24, happy: 2, desc: "+24 reputation. It's three lines. You get it." },
    { id: "supercar",  name: "Supercar",                icon: "🏁", cost: 2.5e7,  happy: 6, rep: 32, desc: "+6 happiness, +32 reputation. Doors open upward." },
    { id: "yacht",     name: "Yacht",                   icon: "🛥️", cost: 2e8,    happy: 8, rep: 50, desc: "+8 happiness, +50 reputation. A hole in the water you throw money into." },
    { id: "rocket",    name: "Space Tourist Ticket",    icon: "🚀", cost: 6e8,    happy: 12, rep: 40, reqEra: 3, desc: "+12 happiness, +40 reputation. Eleven minutes of weightless smugness." },
    { id: "jet",       name: "Private Jet",             icon: "✈️", cost: 3e9,    happy: 10, rep: 80, desc: "+10 happiness, +80 reputation. The WiFi works at 40,000 feet." },
    { id: "club",      name: "Football Club",           icon: "⚽", cost: 4e10,   happy: 10, rep: 200, desc: "+10 happiness, +200 reputation. Now the fans yell at YOU." },
  ];

  // drift & vol are per-hour fractions of value
  const INVEST = [
    { id: "index",   name: "Index Fund",        icon: "📊", min: 100,    drift: 0.05, vol: 0.04, desc: "Boring. Reliable. Up and to the right, slowly." },
    { id: "gold",    name: "Gold",              icon: "🥇", min: 1000,   drift: 0.02, vol: 0.025, desc: "Shiny rocks. Humanity's longest-running meme." },
    { id: "estate",  name: "Real Estate",       icon: "🏘️", min: 100000, drift: 0.09, vol: 0.05, desc: "They're not making more land. Except in games." },
    { id: "startup", name: "Angel Investments", icon: "👼", min: 50000,  drift: 0.22, vol: 0.50, desc: "Ten startups. Nine will die. Maybe ten." },
    { id: "nft",     name: "NFT of a Rock",     icon: "🪨", min: 500,    drift: 0.00, vol: 1.10, desc: "It's a jpeg of a rock. The chart is a heart monitor." },
  ];

  // salary = fraction of gross income, ongoing
  const STAFF = [
    { id: "assistant",  name: "Virtual Assistant", icon: "🧑‍💻", salary: 0.03, stressMult: 0.75, reqIncome: 5,    desc: "Stress builds 25% slower. Handles 'the emails'." },
    { id: "editor",     name: "Video Editor",      icon: "🎞️", salary: 0.04, videoBoost: 1.35, reqIncome: 25,   desc: "Videos get 35% more views. Knows where the jump cuts go." },
    { id: "accountant", name: "Accountant",        icon: "🧾", salary: 0.03, costMult: 0.94,   reqIncome: 80,   desc: "Everything costs 6% less. Finds deductions in the couch." },
    { id: "coach",      name: "Life Coach",        icon: "🧘", salary: 0.03, motivFloor: 55,   reqIncome: 200,  desc: "Motivation never drops below 55. Mostly says 'breathe'." },
    { id: "manager",    name: "Business Manager",  icon: "💼", salary: 0.07, incomeMult: 1.18, reqIncome: 600,  desc: "+18% income. Takes 7%. The math works. Probably." },
    { id: "security",   name: "Head of Security",  icon: "🕶️", salary: 0.04, stressMult: 0.9,  reqIncome: 3000, desc: "Stress builds 10% slower. Stands near doors meaningfully." },
  ];

  function a(s) {
    if (!s.assets) s.assets = { life: {}, invest: {}, staff: {} };
    return s.assets;
  }

  // ---------- Aggregated effects ----------
  function fx(s) {
    const st = a(s);
    const out = { happy: 0, energyDrain: 1, stressMult: 1, incomeMult: 1, costMult: 1, videoBoost: 1, motivFloor: 0, salaryPct: 0 };
    LIFESTYLE.forEach(l => {
      if (!st.life[l.id]) return;
      if (l.happy) out.happy += l.happy;
      if (l.energyDrain) out.energyDrain *= l.energyDrain;
      if (l.stressMult) out.stressMult *= l.stressMult;
    });
    STAFF.forEach(p => {
      if (!st.staff[p.id]) return;
      out.salaryPct += p.salary;
      if (p.stressMult) out.stressMult *= p.stressMult;
      if (p.videoBoost) out.videoBoost *= p.videoBoost;
      if (p.costMult) out.costMult *= p.costMult;
      if (p.motivFloor) out.motivFloor = Math.max(out.motivFloor, p.motivFloor);
      if (p.incomeMult) out.incomeMult *= p.incomeMult;
    });
    return out;
  }

  // ---------- Lifestyle ----------
  function buyLifestyle(id) {
    const s = WB.GAME.state, st = a(s);
    const l = LIFESTYLE.find(x => x.id === id);
    if (!l || st.life[id]) return false;
    const cost = l.cost * (fx(s).costMult);
    if (s.money < cost) return false;
    s.money -= cost;
    st.life[id] = Date.now();
    if (l.rep) s.res.reputation += l.rep;
    s.res.happiness = Math.min(100, s.res.happiness + 10);
    s.stats.lifestyleBought = (s.stats.lifestyleBought || 0) + 1;
    WB.UI.toast(`${l.icon} Acquired: ${l.name}!`, "good");
    WB.UI.bubble(WB.THOUGHTS.fill(WB.pick([
      "Do I need it? No. Did I buy it? Absolutely.",
      "This is an investment in morale. My morale.",
      "Rich people things. I do rich people things now.",
      l.cost > 1e7 ? "My accountant just sighed from across the city." : "Treat yourself responsibly. Or just treat yourself.",
    ])));
    return true;
  }

  // ---------- Investments ----------
  function investBuy(id, frac) {
    const s = WB.GAME.state, st = a(s);
    const def = INVEST.find(x => x.id === id);
    const amt = s.money * frac;
    if (amt < def.min) {
      WB.UI.toast(`${def.icon} Minimum buy-in for ${def.name} is ${WB.fmt(def.min, true)}.`, "bad");
      return false;
    }
    s.money -= amt;
    const h = st.invest[id] || (st.invest[id] = { value: 0, invested: 0 });
    h.value += amt;
    h.invested += amt;
    WB.UI.toast(`${def.icon} Invested ${WB.fmt(amt, true)} in ${def.name}.`, "good");
    return true;
  }
  function investSell(id) {
    const s = WB.GAME.state, st = a(s);
    const def = INVEST.find(x => x.id === id);
    const h = st.invest[id];
    if (!h || h.value < 1) return false;
    const sold = h.value;
    const profit = sold - h.invested;
    s.money += sold;
    if (profit > 0) {
      s.lifetimeEarnings += profit;
      s.allTimeEarnings += profit;
      s.stats.investProfit = (s.stats.investProfit || 0) + profit;
    }
    st.invest[id] = { value: 0, invested: 0 };
    WB.UI.toast(`${def.icon} Sold ${def.name} for ${WB.fmt(sold, true)} (${profit >= 0 ? "+" : ""}${WB.fmt(profit, true)})`, profit >= 0 ? "good" : "bad");
    return true;
  }
  function investTotal(s) {
    const st = a(s);
    return Object.values(st.invest).reduce((sum, h) => sum + (h.value || 0), 0);
  }
  function tick(s, dt) {
    const st = a(s);
    INVEST.forEach(def => {
      const h = st.invest[def.id];
      if (!h || h.value < 1) return;
      const driftSec = def.drift / 3600;
      const noiseSec = (Math.random() * 2 - 1) * (def.vol / 60);
      h.value = Math.max(0, h.value * (1 + (driftSec + noiseSec) * dt));
    });
  }

  // ---------- Staff ----------
  function hire(id) {
    const s = WB.GAME.state, st = a(s);
    const p = STAFF.find(x => x.id === id);
    if (!p || st.staff[id]) return false;
    if (WB.GAME.incomePerSec() < p.reqIncome) return false;
    st.staff[id] = Date.now();
    s.stats.staffHired = (s.stats.staffHired || 0) + 1;
    WB.UI.toast(`${p.icon} Hired: ${p.name} (${Math.round(p.salary * 100)}% of income)`, "good");
    WB.UI.bubble(WB.pick([
      "I have an employee. I'm basically a Fortune 500 now.",
      "Delegation: the art of paying someone to do what you were avoiding.",
      "Welcome aboard. The office is wherever the WiFi is.",
    ]));
    return true;
  }
  function fire(id) {
    const s = WB.GAME.state, st = a(s);
    const p = STAFF.find(x => x.id === id);
    if (!p || !st.staff[id]) return false;
    delete st.staff[id];
    WB.UI.toast(`${p.icon} ${p.name} has left the company. The exit interview was awkward.`, "good");
    return true;
  }

  return { LIFESTYLE, INVEST, STAFF, fx, buyLifestyle, investBuy, investSell, investTotal, tick, hire, fire };
})();
