/* WiFi Billionaire — manual actions: the "do stuff" layer.
   Each action: start (optionally pick from choices) → runs for a while →
   results ready → player checks them in a results modal. */
'use strict';

WB.ACTIONS = (function () {
  const D = WB.DATA;
  const S = () => WB.GAME.state;
  const ips = () => WB.GAME.incomePerSec();
  const now = () => Date.now();

  // ---------- Content generators ----------
  const VIDEO_FORMATS = ["I tried", "Day in the life:", "24 hours of", "Reviewing every", "The TRUTH about", "I built", "Ranking", "Why I quit", "Speedrunning", "ASMR:", "Exposing", "Living off", "I survived", "World's cheapest", "Blindfolded:", "My mom rates", "AI reacts to", "100 days of"];
  const VIDEO_SUBJECTS = ["cheap keyboards", "my morning routine", "crypto bros", "standing desks", "energy drinks", "AI girlfriends", "mechanical switches", "hustle culture", "$1 web hosting", "vintage laptops", "productivity apps", "instant ramen", "my own game", "monitor setups", "WiFi routers", "garage startups", "dropshipping gurus", "my server room", "open source drama", "keyboard ASMR", "tech conference food", "my cat's daily routine"];
  const REPLIES = [
    "Someone replied 'ratio' but it didn't stick.",
    "A bot called you 'inspiring'. You'll take it.",
    "Three people argued about tabs vs spaces in your replies.",
    "Someone's grandma shared it. Huge demographic win.",
    "A blue-check VC replied '👀'. That's basically a term sheet.",
    "It got quote-posted by a meme account. Net positive. Probably.",
  ];
  const AI_FAILS = [
    "The model now answers everything with duck facts. Confidently.",
    "It learned sarcasm before it learned math.",
    "Training crashed at 99%. The GPU is sulking.",
    "The model became extremely good at one (1) thing: apologizing.",
    "It memorized the training data and calls it 'intuition'.",
  ];
  const AI_WINS = [
    "Loss curve went down and stayed down. Frame it.",
    "The model just refactored its own training script. Promotion?",
    "Benchmark scores up. The group chat has been notified.",
    "It answered a question correctly that YOU couldn't. Mixed feelings.",
  ];
  function stars(n) { return "★".repeat(n) + "☆".repeat(5 - n); }

  // ---------- Action definitions ----------
  const DEFS = {
    codeSprint: {
      name: "Code Sprint", icon: "⚡", dur: 15, cd: 60, energy: 8,
      avail: s => s.careers.programmer >= 0,
      desc: "15 seconds of pure focus on the current project.",
      choices: s => ({
        title: "⚡ Code Sprint", desc: "Pick your battle. No meetings allowed.",
        options: [
          { label: "🚀 Build a feature", desc: "Big project progress — but it might break the build." },
          { label: "🐛 Hunt bugs", desc: "Safe, steady progress plus coding XP." },
          { label: "🧹 Refactor", desc: "Less progress now, project finishes faster after." },
        ],
      }),
      resolve(s, payload) {
        const lines = [];
        let money = 0;
        const skill = s.skills.coding.level;
        const apply = pct => { if (s.project) s.project.progress += s.project.required * pct; };
        if (payload.choice === 0) {
          if (WB.chance(0.18 - WB.GAME.luck() * 0.004)) {
            apply(-0.10);
            s.res.stress = Math.min(100, s.res.stress + 6);
            lines.push("💥 You broke the build. Heroically.", "Project progress: -10%. Stress: rising.");
            WB.UI.bubble(WB.THOUGHTS.react("fail"));
          } else {
            apply(WB.rand(0.40, 0.75));
            lines.push("🚀 Feature shipped to the branch!", "Project progress: huge jump.");
            WB.GAME.gainXp("coding", 40);
          }
        } else if (payload.choice === 1) {
          apply(WB.rand(0.22, 0.38));
          WB.GAME.gainXp("coding", 70 + skill);
          lines.push("🐛 Bugs exterminated: " + Math.floor(WB.rand(3, 14)), "Solid progress + a chunk of Coding XP.");
        } else {
          apply(0.12);
          if (s.project) s.project.required *= 0.8;
          WB.GAME.gainXp("coding", 30);
          lines.push("🧹 Codebase 30% less haunted.", "This project now finishes noticeably faster.");
        }
        money = ips() * WB.rand(6, 14);
        WB.GAME.earn(money);
        return { icon: "⚡", title: "Sprint complete", lines, money };
      },
    },

    postVideo: {
      name: "Post Video", icon: "🎬", dur: 30, cd: 45, energy: 6,
      avail: s => s.careers.creator >= 0,
      desc: "Pick a topic, upload, then check how it performed.",
      choices: s => {
        const opts = [];
        for (let i = 0; i < 3; i++) {
          const title = WB.pick(VIDEO_FORMATS) + " " + WB.pick(VIDEO_SUBJECTS);
          const quality = WB.rand(0.4, 2.6) * (s.traits.includes("creator") ? 1.15 : 1);
          const hint = Math.max(1, Math.min(5, Math.round(quality * 1.6 + WB.rand(-1, 1))));
          opts.push({ label: "🎬 " + title, desc: `Trend score: ${stars(hint)} (analyst confidence: low)`, data: { title, quality } });
        }
        return { title: "🎬 Post a Video", desc: "The algorithm is hungry. Feed it.", options: opts };
      },
      onStart() { WB.UI.bubble(WB.THOUGHTS.react("act_video")); },
      resolve(s, payload) {
        s.stats.videosPosted = (s.stats.videosPosted || 0) + 1;
        const q = payload.data.quality;
        const skill = s.skills.content.level;
        let views = (40 + s.stats.followers * WB.rand(0.4, 1.6)) * q * (1 + skill * 0.04) * WB.ASSETS.fx(s).videoBoost;
        let viral = false;
        if (q > 2.0 && WB.chance(0.22 + WB.GAME.luck() * 0.008) || WB.chance(0.03)) {
          viral = true;
          views *= WB.rand(6, 14);
          s.boost = { mult: 2, until: now() + 90000 };
        }
        views = Math.round(views);
        const newFollowers = Math.round(views * WB.rand(0.01, 0.03));
        const money = views * 0.01 * (1 + s.era * 0.3) + ips() * 25 * q;
        s.stats.followers += newFollowers;
        s.res.reputation += viral ? 8 : 1;
        WB.GAME.earn(money);
        WB.GAME.gainXp("content", 60 + views * 0.01);
        const lines = [
          `“${payload.data.title}”`,
          `👀 Views: ${WB.fmt(views)}`,
          `👥 New followers: +${WB.fmt(newFollowers)}`,
        ];
        if (viral) { lines.push("🔥 IT WENT VIRAL — 2x income surge active!"); WB.UI.confetti(); }
        else if (q < 0.8) lines.push("📉 The algorithm watched it once and looked away.");
        else lines.push(WB.pick(REPLIES));
        WB.UI.bubble(WB.THOUGHTS.react(viral ? "success" : (q < 0.8 ? "fail" : "content")));
        return { icon: "🎬", title: "Video results are in", lines, money };
      },
    },

    trainAI: {
      name: "Train AI", icon: "🤖", dur: 25, cd: 40, energy: 6,
      avail: s => s.careers.ai >= 0,
      desc: "Spend compute, grow the model, hope it learns the right thing.",
      choices: s => {
        const base = Math.max(50, ips() * 25);
        const f = v => WB.fmt(v, true);
        return {
          title: "🤖 Training Run", desc: "Pick a run size. The GPU fans are ready.",
          options: [
            { label: "☕ Quick run — " + f(base), desc: "20s · modest AI XP, low risk.", data: { cost: base, mult: 1, dur: 20 } },
            { label: "🔥 Deep train — " + f(base * 4), desc: "45s · serious XP, chance of a breakthrough.", data: { cost: base * 4, mult: 3.2, dur: 45 } },
            { label: "🌙 Overnight monster — " + f(base * 10), desc: "90s · massive XP, big breakthrough odds.", data: { cost: base * 10, mult: 8, dur: 90 } },
          ],
        };
      },
      validate(s, data) {
        if (s.money < data.cost) return "Not enough money for that much compute.";
        return null;
      },
      onBegin(s, data) { s.money -= data.cost; },
      onStart() { WB.UI.bubble(WB.THOUGHTS.react("act_ai")); },
      resolve(s, payload) {
        s.stats.aiTrainings = (s.stats.aiTrainings || 0) + 1;
        const d = payload.data;
        const lines = [];
        let money = 0;
        if (WB.chance(0.15)) {
          WB.GAME.gainXp("ai", 60 * d.mult);
          money = d.cost * 0.3;
          WB.GAME.earn(money);
          lines.push("🫠 " + WB.pick(AI_FAILS), "Partial compute refund issued.", "Still learned something. Technically.");
          WB.UI.bubble(WB.THOUGHTS.react("fail"));
        } else {
          WB.GAME.gainXp("ai", 140 * d.mult);
          lines.push("📈 " + WB.pick(AI_WINS), `AI skill XP: a ${d.mult >= 3 ? "huge" : "solid"} chunk.`);
          if (WB.chance(0.20 + d.mult * 0.03 + WB.GAME.luck() * 0.005)) {
            const boostMult = 1.5 + d.mult * 0.15;
            const sec = 60 + d.mult * 15;
            s.boost = { mult: boostMult, until: now() + sec * 1000 };
            lines.push(`💡 BREAKTHROUGH — income x${boostMult.toFixed(1)} for ${Math.round(sec)}s!`);
          }
          WB.UI.bubble(WB.THOUGHTS.react("success"));
        }
        return { icon: "🤖", title: "Training run finished", lines, money };
      },
    },

    scanMarket: {
      name: "Scan Market", icon: "📡", dur: 10, cd: 50, energy: 3,
      avail: s => s.careers.crypto >= 0,
      desc: "Hunt for a hot coin, then decide whether to ape in.",
      onStart() { WB.UI.bubble(WB.THOUGHTS.react("act_scan")); },
      resolve(s) {
        s.stats.marketScans = (s.stats.marketScans || 0) + 1;
        const skill = s.skills.trading.level;
        // skill & luck skew the multiplier distribution upward
        let mult = WB.rand(0.2, 1.9) + WB.rand(0, 1) * (skill * 0.012 + WB.GAME.luck() * 0.015);
        if (WB.chance(0.04)) mult = WB.rand(2.5, 5); // moonshot
        const coin = WB.THOUGHTS.fill("{coin}");
        const hint = Math.max(1, Math.min(5, Math.round(mult * 1.4 + WB.rand(-0.8, 0.8))));
        s.actions.pendingScan = { coin, mult };
        WB.GAME.gainXp("trading", 35);
        return {
          icon: "📡", title: "Market scan complete",
          lines: [`Signal found: ${coin}`, `Vibe rating: ${stars(hint)}`, "Charts say maybe. Charts always say maybe."],
          money: 0, scan: true,
        };
      },
    },

    gameJam: {
      name: "Game Jam", icon: "🕹️", dur: 60, cd: 180, energy: 15,
      avail: s => s.careers.gamedev >= 0,
      desc: "A 48-hour jam compressed into 60 seconds of panic.",
      onStart() { WB.UI.bubble(WB.THOUGHTS.react("act_jam")); },
      resolve(s) {
        s.stats.jamsEntered = (s.stats.jamsEntered || 0) + 1;
        const skill = s.skills.gamedev.level;
        const roll = Math.random() + skill * 0.006 + WB.GAME.luck() * 0.01;
        const lines = [];
        let money = 0;
        WB.GAME.gainXp("gamedev", 150);
        if (roll > 0.85) {
          money = ips() * 180 + 300;
          s.res.reputation += 15;
          lines.push("🥇 FIRST PLACE!", "Your weird little game about " + WB.THOUGHTS.fill("{appNoun}") + " won the whole jam.", "Prize money + reputation + bragging rights forever.");
          WB.UI.confetti();
          WB.UI.bubble(WB.THOUGHTS.react("success"));
        } else if (roll > 0.45) {
          money = ips() * 70 + 100;
          s.res.reputation += 5;
          lines.push("🏅 Top 10 finish!", "The judges said 'charming'. You'll take 'charming'.");
        } else {
          money = ips() * 15;
          s.res.stress = Math.min(100, s.res.stress + 8);
          lines.push("🪦 The game crashed during judging.", "Huge XP though. Pain is a teacher.");
          WB.UI.bubble(WB.THOUGHTS.react("fail"));
        }
        WB.GAME.earn(money);
        return { icon: "🕹️", title: "Game jam results", lines, money };
      },
    },

    social: {
      name: "Post Online", icon: "💬", dur: 12, cd: 45, energy: 3,
      avail: () => true,
      desc: "Fire off a take. See what the internet thinks.",
      onStart() { WB.UI.bubble(WB.THOUGHTS.react("act_social")); },
      resolve(s) {
        s.stats.socialPosts = (s.stats.socialPosts || 0) + 1;
        const lines = [];
        let money = 0;
        if (WB.chance(0.07)) {
          s.res.reputation = Math.max(0, s.res.reputation - 3);
          lines.push("🔥 Bad take. You got ratio'd into next week.", "Deleting it made it worse. It always does.");
          WB.UI.bubble("Note to self: never post again. (Posts again in 45 seconds.)");
        } else {
          const rep = 2 + Math.random() * 4;
          const fans = Math.round(3 + s.stats.followers * 0.005 + Math.random() * 10);
          s.res.reputation += rep;
          s.stats.followers += fans;
          money = ips() * 6;
          WB.GAME.earn(money);
          lines.push(WB.pick(REPLIES), `🌟 Reputation: +${rep.toFixed(0)} · 👥 Followers: +${fans}`);
        }
        WB.GAME.gainXp("business", 25);
        return { icon: "💬", title: "Post performance", lines, money };
      },
    },

    freelanceGig: {
      name: "Freelance Gig", icon: "🧰", dur: 20, cd: 70, energy: 7,
      avail: () => true,
      desc: "Pick up a quick job. The client is always... a personality.",
      choices: s => {
        const CLIENTS = ["a local bakery", "a confused law firm", "an influencer's mom", "a vegan butcher", "a haunted-looking startup", "your old high school", "a crypto podcast", "a dental empire"];
        const TASKS = ["needs a landing page", "wants their printer 'hacked back'", "needs a logo (they have 9 opinions)", "wants a TikTok strategy", "needs a spreadsheet un-cursed", "wants 'an app like Uber but not'", "needs SEO, whatever that is to them", "wants their website to 'pop more'"];
        const opts = [];
        for (let i = 0; i < 3; i++) {
          const who = WB.pick(CLIENTS), what = WB.pick(TASKS);
          const tier = i; // 0 easy, 1 medium, 2 demanding
          const pay = (15 + ips() * WB.rand(20, 35)) * (1 + tier * 0.8);
          opts.push({
            label: `🧰 ${who.charAt(0).toUpperCase() + who.slice(1)} ${what}`,
            desc: `Pays ~${WB.fmt(pay, true)} · ${["chill client", "normal client", "demanding client (+pay, +stress)"][tier]}`,
            data: { who, what, pay, tier },
          });
        }
        return { title: "🧰 Gig Board", desc: "Three clients. Three budgets. Three flavors of chaos.", options: opts };
      },
      onStart() { WB.UI.bubble(WB.pick(["Client work. The rent-payer. The soul-tester.", "Scope creep incoming in 3... 2...", "The client said 'simple job'. Bracing for impact."])); },
      resolve(s, payload) {
        s.stats.gigsDone = (s.stats.gigsDone || 0) + 1;
        const d = payload.data;
        const lines = [];
        let money = d.pay;
        if (WB.chance(0.12 + d.tier * 0.08)) {
          money *= 0.6;
          s.res.stress = Math.min(100, s.res.stress + 4 + d.tier * 3);
          lines.push(`😤 The client "had notes". Seventeen rounds of revisions later...`, "They paid 60% and left a 4-star review. FOUR.");
        } else {
          lines.push(`✅ Delivered! ${d.who.charAt(0).toUpperCase() + d.who.slice(1)} is thrilled.`, WB.pick(["They called you 'the computer person'. High praise.", "Payment arrived WITH a tip. Framing the invoice.", "They want more work next month. A regular!"]));
          s.res.reputation += 1 + d.tier;
        }
        WB.GAME.earn(money);
        WB.GAME.gainXp("business", 40 + d.tier * 20);
        return { icon: "🧰", title: "Gig complete", lines, money };
      },
    },

    coffee: {
      name: "Brew Coffee", icon: "☕", dur: 0, cd: 90, energy: 0,
      avail: () => true, instant: true,
      desc: "Liquid productivity. Instant effect.",
      resolve(s) {
        s.stats.coffees = (s.stats.coffees || 0) + 1;
        s.res.energy = Math.min(100, s.res.energy + 18);
        s.res.stress = Math.min(100, s.res.stress + 2);
        WB.UI.bubble(WB.THOUGHTS.react("act_coffee"));
        return null; // no results modal for instant actions
      },
    },
  };

  // ---------- State helpers ----------
  function a() {
    const s = S();
    if (!s.actions) s.actions = { running: {}, cooldownUntil: {}, notified: {}, pendingScan: null };
    return s.actions;
  }

  function status(id) {
    const s = S(), st = a(), def = DEFS[id];
    if (!def.avail(s)) return { state: "locked" };
    const run = st.running[id];
    if (run) {
      if (now() >= run.doneAt) return { state: "done", label: "Results ready!" };
      const total = run.doneAt - run.startedAt;
      const left = run.doneAt - now();
      return { state: "running", pct: 100 - left / total * 100, label: Math.ceil(left / 1000) + "s" };
    }
    const cd = st.cooldownUntil[id] || 0;
    if (now() < cd) return { state: "cooldown", pct: 0, label: Math.ceil((cd - now()) / 1000) + "s" };
    return { state: "ready", label: def.desc };
  }

  function list() {
    return Object.keys(DEFS)
      .map(id => ({ id, def: DEFS[id], st: status(id) }))
      .filter(x => x.st.state !== "locked");
  }

  function begin(id, payload) {
    const s = S(), st = a(), def = DEFS[id];
    const dur = (payload && payload.data && payload.data.dur ? payload.data.dur : def.dur) * 1000;
    if (def.energy) s.res.energy = Math.max(0, s.res.energy - def.energy);
    st.running[id] = { startedAt: now(), doneAt: now() + dur, payload: payload || {} };
    delete st.notified[id];
    if (def.onStart) def.onStart(s);
  }

  function start(id) {
    const s = S(), def = DEFS[id];
    if (WB.GAME.inPrison()) return { refused: "You're in jail — no actions until you're out." };
    const st = status(id);
    if (st.state !== "ready") return { refused: null };
    if (def.energy && s.res.energy < def.energy + 4) return { refused: "Too tired for that. Sleep or brew coffee first." };
    if (def.instant) {
      def.resolve(s);
      a().cooldownUntil[id] = now() + def.cd * 1000;
      return { instant: true };
    }
    if (def.choices) return { choice: def.choices(s) };
    begin(id);
    return { started: true };
  }

  function beginWithChoice(id, idx, choiceData) {
    const s = S(), def = DEFS[id];
    const data = choiceData || {};
    if (def.validate) {
      const err = def.validate(s, data);
      if (err) return { refused: err };
    }
    if (def.onBegin) def.onBegin(s, data);
    begin(id, { choice: idx, data });
    return { started: true };
  }

  function collect(id) {
    const s = S(), st = a(), def = DEFS[id];
    const run = st.running[id];
    if (!run || now() < run.doneAt) return null;
    delete st.running[id];
    delete st.notified[id];
    st.cooldownUntil[id] = now() + def.cd * 1000;
    return def.resolve(s, run.payload);
  }

  function resolveScan(buy) {
    const s = S(), st = a();
    const scan = st.pendingScan;
    st.pendingScan = null;
    if (!scan || !buy) {
      WB.GAME.gainXp("trading", 10);
      return { icon: "🧘", title: "You passed", lines: ["Sometimes the best trade is no trade.", "(The chart will haunt you either way.)"], money: 0 };
    }
    const amt = s.money * 0.20;
    if (amt < 1) return { icon: "📡", title: "No funds", lines: ["You aped with $0. The market is unimpressed."], money: 0 };
    s.money -= amt;
    const ret = amt * scan.mult;
    const profit = ret - amt;
    s.money += ret;
    s.stats.cryptoTrades++;
    if (profit > 0) {
      s.lifetimeEarnings += profit;
      s.allTimeEarnings += profit;
      s.stats.cryptoProfit += profit;
      WB.UI.bubble(WB.THOUGHTS.react("success"));
    } else {
      s.stats.cryptoLosses += -profit;
      WB.UI.bubble(WB.THOUGHTS.react("crypto"));
    }
    WB.GAME.gainXp("trading", 50);
    return {
      icon: profit >= 0 ? "🤑" : "🩸",
      title: profit >= 0 ? `${scan.coin} pumped!` : `${scan.coin} dumped.`,
      lines: [
        `Aped in: ${WB.fmt(amt, true)}`,
        `Cashed out: ${WB.fmt(ret, true)}`,
        profit >= 0 ? "The group chat shall hear of this victory." : "We do not speak of this trade.",
      ],
      money: profit,
    };
  }

  function tick() {
    const st = a();
    for (const id of Object.keys(st.running)) {
      const run = st.running[id];
      if (now() >= run.doneAt && !st.notified[id]) {
        st.notified[id] = true;
        WB.UI.toast(`📬 ${DEFS[id].icon} ${DEFS[id].name} finished — results are ready!`, "goal");
      }
    }
  }

  return { DEFS, list, status, start, beginWithChoice, collect, resolveScan, tick };
})();
