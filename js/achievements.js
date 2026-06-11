/* WiFi Billionaire — 110+ achievements, mostly generated from milestone tables. */
'use strict';

WB.ACHIEVEMENTS = (function () {
  const list = [];
  const add = (id, name, icon, desc, check) => list.push({ id, name, icon, desc, check });

  // ---------- Money milestones (12) ----------
  const moneyMs = [
    [1, "First Dollar", "Earn your very first dollar online."],
    [100, "Triple Digits", "Hold $100. Pizza money secured."],
    [1e3, "Four Figures", "Hold $1,000. Ramen upgrade unlocked."],
    [1e4, "Five Figures", "Hold $10,000. Mom is cautiously impressed."],
    [1e5, "Six Figures", "Hold $100,000. Dad asks fewer questions."],
    [1e6, "Millionaire", "Hold $1,000,000. It hits different."],
    [1e7, "Deca-Millionaire", "Hold $10M. You have 'people' now."],
    [1e8, "Centi-Millionaire", "Hold $100M. Yachts enter the chat."],
    [1e9, "Billionaire", "Hold $1B. The title of the game, achieved."],
    [1e10, "Deca-Billionaire", "Hold $10B. Numbers are abstract now."],
    [1e11, "Centi-Billionaire", "Hold $100B. You ARE the economy."],
    [1e12, "Trillionaire", "Hold $1T. The simulation is impressed."],
  ];
  moneyMs.forEach(([v, n, d], i) => add("money" + i, n, "💵", d, s => s.money >= v));

  // ---------- Lifetime earnings (6) ----------
  [[1e3, "Side Hustle"], [1e5, "Real Business"], [1e7, "Serious Operation"], [1e9, "Empire Revenue"], [1e11, "Galactic GDP"], [1e13, "Post-Scarcity"]]
    .forEach(([v, n], i) => add("earn" + i, n, "📊", `Earn ${WB.fmt(v, true)} across all time.`, s => s.allTimeEarnings >= v));

  // ---------- Income per second (7) ----------
  [[1, "Drip"], [10, "Stream"], [100, "River"], [1e3, "Flood"], [1e4, "Tsunami"], [1e5, "Money Weather"], [1e6, "Cashflow Singularity"]]
    .forEach(([v, n], i) => add("ips" + i, n, "⏱️", `Reach ${WB.fmt(v, true)}/sec income.`, s => WB.GAME.incomePerSec() >= v));

  // ---------- Clicks (6) ----------
  [[1, "First Click"], [100, "Warmed Up"], [1000, "Click Enthusiast"], [5000, "Carpal Crusader"], [20000, "The Clicking"], [100000, "Finger of Legend"]]
    .forEach(([v, n], i) => add("click" + i, n, "👆", `Hustle ${v.toLocaleString()} times.`, s => s.stats.totalClicks >= v));

  // ---------- Skills (24: 6 skills × 4 levels) ----------
  Object.entries(WB.DATA.SKILLS).forEach(([key, sk]) => {
    [[10, "Novice"], [25, "Adept"], [50, "Expert"], [100, "Legendary"]].forEach(([lvl, t], i) => {
      add(`skill_${key}_${i}`, `${t} ${sk.name}`, sk.icon, `Reach ${sk.name} level ${lvl}.`, s => s.skills[key].level >= lvl);
    });
  });

  // ---------- Housing (9) ----------
  WB.DATA.HOUSING.forEach((h, i) => {
    if (i === 0) return;
    const names = [null, "Moved Out", "Real Renter", "Modern Living", "Lap of Luxury", "Top Floor", "Lord of the Manor", "Island Owner", "Campus Founder"];
    add("housing" + i, names[i], "🏠", `Move into the ${h.name}.`, s => s.housing >= i);
  });

  // ---------- Careers (16 tiers total) ----------
  Object.entries(WB.DATA.CAREERS).forEach(([key, c]) => {
    c.tiers.forEach((t, i) => {
      add(`career_${key}_${i}`, t.name, c.icon, `Become a ${t.name} (${c.name} path).`, s => s.careers[key] >= i);
    });
  });
  add("allcareers", "Renaissance Hustler", "🎭", "Unlock all 5 career paths in one life.", s => Object.values(s.careers).every(t => t >= 0));
  add("aiempire", "Built AI Empire", "🤖", "Reach the top of the AI Entrepreneur path.", s => s.careers.ai >= 2);

  // ---------- Followers (6) ----------
  [[100, "100 Followers"], [1000, "Small Community"], [10000, "Niche Famous"], [100000, "Actually Famous"], [1e6, "Million Club"], [1e7, "Main Character"]]
    .forEach(([v, n], i) => add("followers" + i, n, "📱", `Reach ${v.toLocaleString()} followers.`, s => s.stats.followers >= v));

  // ---------- Projects (8) ----------
  [[1, "First Customer"], [5, "Shipping Habit"], [25, "Serial Shipper"], [100, "Product Machine"], [500, "Factory Mode"]]
    .forEach(([v, n], i) => add("proj" + i, n, "🚢", `Ship ${v} projects.`, s => s.stats.projectsShipped >= v));
  add("firstwebsite", "First Website", "🌐", "Ship your first coding project.", s => s.stats.projectsByCareer.programmer >= 1);
  add("viralproject", "Going Viral", "🔥", "Have a project go viral.", s => s.stats.viralProjects >= 1);
  add("failforward", "Fail Forward", "🪦", "Have 10 projects flop. Character development.", s => s.stats.projectsFailed >= 10);

  // ---------- Crypto (5) ----------
  add("crypto1", "First Bag", "🪙", "Hold any crypto.", s => s.crypto.holdings >= 1);
  add("crypto2", "Diamond Hands", "💎", "Hold $10k+ in crypto.", s => s.crypto.holdings >= 1e4);
  add("crypto3", "Whale Watching", "🐋", "Hold $1M+ in crypto.", s => s.crypto.holdings >= 1e6);
  add("crypto4", "Exit Liquidity Survivor", "📉", "Lose $5k total on crypto and keep going.", s => s.stats.cryptoLosses >= 5000);
  add("crypto5", "Actually Profitable", "📈", "Make $50k total profit on crypto.", s => s.stats.cryptoProfit >= 50000);

  // ---------- Eras (5) ----------
  WB.DATA.ERAS.forEach((e, i) => {
    if (i === 0) return;
    add("era" + i, "Welcome to " + e.year, "🗓️", `Reach the ${e.name}.`, s => s.era >= i);
  });
  add("era_native", "Born Too Early", "🕰️", "Reach the Space-Tech Era.", s => s.era >= 4);

  // ---------- Equipment (6) ----------
  add("equip1", "First Upgrade", "🛒", "Buy any equipment upgrade.", s => s.stats.equipmentBought >= 1);
  add("equip2", "Battlestation", "🖥️", "Own 6 different equipment categories.", s => Object.values(s.equipment).filter(t => t >= 0).length >= 6);
  add("equip3", "Full Setup", "🏗️", "Own all 12 equipment categories.", s => Object.values(s.equipment).filter(t => t >= 0).length >= 12);
  add("equip4", "Max Laptop", "💻", "Max out the laptop tier.", s => s.equipment.laptop >= WB.DATA.EQUIPMENT.laptop.tiers.length - 1);
  add("equip5", "Server Room", "🗄️", "Own a Server Rack tier 5+.", s => s.equipment.server >= 4);
  add("equip6", "Everything Maxed", "🏆", "Max every equipment category.", s => Object.entries(s.equipment).every(([k, t]) => t >= WB.DATA.EQUIPMENT[k].tiers.length - 1));

  // ---------- Traits & perks (5) ----------
  add("trait1", "Personality Unlocked", "🎭", "Develop your first trait.", s => s.traits.length >= 1);
  add("trait3", "Complicated Person", "🌀", "Have 3 traits at once.", s => s.traits.length >= 3);
  add("trait6", "Walking Contradiction", "🤹", "Have 6 traits at once.", s => s.traits.length >= 6);
  add("perk1", "Perked Up", "✨", "Choose your first perk.", s => s.perks.length >= 1);
  add("perk8", "Stacked Build", "🧱", "Have 8 perks in one life.", s => s.perks.length >= 8);

  // ---------- Prestige (5) ----------
  [[1, "Born Again", "Prestige for the first time."], [3, "Serial Founder", "Prestige 3 times."], [5, "Time Loop Veteran", "Prestige 5 times."], [10, "Groundhog Decade", "Prestige 10 times."], [25, "The Eternal Grind", "Prestige 25 times."]]
    .forEach(([v, n, d], i) => add("prestige" + i, n, "♻️", d, s => s.prestige.count >= v));
  add("legacy50", "Legacy Builder", "🏛️", "Hold 50 unspent Legacy Points.", s => (s.prestige.legacy - s.prestige.spent) >= 50);

  // ---------- Lifestyle / misc (12) ----------
  add("sleep100", "Professional Sleeper", "😴", "Sleep 100 times.", s => s.stats.sleepSessions >= 100);
  add("grass50", "Grass Connoisseur", "🌱", "Touch grass 50 times.", s => s.stats.grassTouched >= 50);
  add("mominterrupt", "Mom's Favorite", "🥪", "Get interrupted by mom 10 times.", s => s.stats.momInterruptions >= 10);
  add("nosleep", "Zombie Mode", "🧟", "Hit 0 energy.", s => s.stats.collapses >= 1);
  add("stress100", "Pressure Cooker", "🫠", "Hit 100 stress and live to tell the tale.", s => s.stats.maxStressHit >= 1);
  add("happy100", "Peak Bliss", "😇", "Reach 100 happiness.", s => s.stats.maxHappyHit >= 1);
  add("events25", "Eventful Life", "🎪", "Experience 25 random events.", s => s.stats.eventsSeen >= 25);
  add("events100", "Chaos Magnet", "🌪️", "Experience 100 random events.", s => s.stats.eventsSeen >= 100);
  add("rep100", "Internet Famous", "🌟", "Reach 100 reputation.", s => s.res.reputation >= 100);
  add("rep1000", "Living Legend", "👑", "Reach 1,000 reputation.", s => s.res.reputation >= 1000);
  add("hour1", "Hooked", "🕐", "Play for 1 hour total.", s => s.stats.playTimeSec >= 3600);
  add("hour10", "Invested", "🕙", "Play for 10 hours total.", s => s.stats.playTimeSec >= 36000);

  // ---------- Manual actions (10) ----------
  add("video1", "First Upload", "🎬", "Post your first video.", s => (s.stats.videosPosted || 0) >= 1);
  add("video25", "Content Machine", "🎞️", "Post 25 videos.", s => (s.stats.videosPosted || 0) >= 25);
  add("video100", "Upload Addict", "📼", "Post 100 videos.", s => (s.stats.videosPosted || 0) >= 100);
  add("ai1", "It's Learning", "🤖", "Complete your first AI training run.", s => (s.stats.aiTrainings || 0) >= 1);
  add("ai25", "GPU Goes Brrr", "🔥", "Complete 25 AI training runs.", s => (s.stats.aiTrainings || 0) >= 25);
  add("scan20", "Chart Whisperer", "📡", "Run 20 market scans.", s => (s.stats.marketScans || 0) >= 20);
  add("jam1", "Jam Survivor", "🕹️", "Finish your first game jam.", s => (s.stats.jamsEntered || 0) >= 1);
  add("jam10", "Jam Veteran", "🏁", "Finish 10 game jams.", s => (s.stats.jamsEntered || 0) >= 10);
  add("post50", "Terminally Online", "💬", "Make 50 social posts.", s => (s.stats.socialPosts || 0) >= 50);
  add("coffee25", "Caffeine Dependency", "☕", "Brew 25 coffees.", s => (s.stats.coffees || 0) >= 25);

  // ---------- Assets & staff (9) ----------
  add("life1", "Treat Yourself", "🛍️", "Buy your first lifestyle asset.", s => (s.stats.lifestyleBought || 0) >= 1);
  add("life8", "Collector", "💎", "Own 8 lifestyle assets.", s => Object.keys((s.assets && s.assets.life) || {}).length >= 8);
  add("lifeall", "Materialist Supreme", "👑", "Own every lifestyle asset.", s => Object.keys((s.assets && s.assets.life) || {}).length >= WB.ASSETS.LIFESTYLE.length);
  add("jet", "Wheels Up", "✈️", "Own the private jet.", s => !!(s.assets && s.assets.life.jet));
  add("club", "Club Owner", "⚽", "Buy the football club.", s => !!(s.assets && s.assets.life.club));
  add("invest1", "Diversified", "📊", "Make your first investment.", s => Object.values((s.assets && s.assets.invest) || {}).some(h => h.invested > 0));
  add("investprofit", "Compound Interest", "🏦", "Realize $100k of investment profit.", s => (s.stats.investProfit || 0) >= 1e5);
  add("hire1", "Boss Mode", "🧑‍💼", "Hire your first staff member.", s => (s.stats.staffHired || 0) >= 1);
  add("fullteam", "Dream Team", "🌟", "Have all 6 staff hired at once.", s => Object.keys((s.assets && s.assets.staff) || {}).length >= 6);
  add("gig10", "Gig Economy", "🧰", "Complete 10 freelance gigs.", s => (s.stats.gigsDone || 0) >= 10);

  // ---------- Secret-ish fun (4) ----------
  add("broke_again", "Riches to Rags", "🎢", "Drop below $100 after having $100k.", s => s.stats.richThenBroke >= 1);
  add("speedrun", "Speedrunner", "⏩", "Reach $10k within 30 min of a fresh life.", s => s.stats.fastTenK >= 1);
  add("island_wifi", "Bought Private Island", "🏝️", "You know what this one is.", s => s.housing >= 7);
  add("completionist", "WiFi Billionaire", "📶", "Reach $1B with all careers unlocked. The dream, realized.",
    s => s.money >= 1e9 && Object.values(s.careers).every(t => t >= 0));

  function checkAll(s, onUnlock) {
    for (const a of list) {
      if (s.achievements[a.id]) continue;
      let ok = false;
      try { ok = a.check(s); } catch (e) { ok = false; }
      if (ok) {
        s.achievements[a.id] = Date.now();
        onUnlock(a);
      }
    }
  }

  return { list, checkAll };
})();
