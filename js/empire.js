/* WiFi Billionaire — THE EMPIRE (secret endgame content).
   Unlocks at $1T net worth. Mega-ventures with staged progression: found a
   space company and buy planets, build a city-state, push tech past the
   singularity. Income here is flat-but-enormous and survives prestige. */
'use strict';

WB.EMPIRE = (function () {
  const TEASE_NW = 1e9;    // a locked "???" tab appears — something is out there
  const UNLOCK_NW = 1e12;  // $1 trillion net worth opens the Empire

  // Each stage: cost (one-time), income (flat $/s added to your base income —
  // era/housing/etc multipliers then scale it up), optional cutscene in the room.
  const VENTURES = [
    { id: "space", name: "Stardust Aerospace", icon: "🚀",
      tagline: "Because the first trillion is boring if you stay on Earth.",
      stages: [
        { name: "Found Stardust Aerospace", cost: 1e12, income: 2e9,
          flavor: "You bought a hangar, three engineers and a dream. Mostly the hangar." },
        { name: "First Orbital Launch", cost: 8e12, income: 1.5e10, cutscene: "launch",
          flavor: "It went UP and stayed up. Mission control cried. You tweeted." },
        { name: "Satellite Constellation", cost: 5e13, income: 1e11,
          flavor: "4,000 satellites now sell WiFi back to the planet that doubted you." },
        { name: "Space Tourism Line", cost: 3e14, income: 6e11,
          flavor: "Billionaires pay you to float for 11 minutes. The margins are criminal. Legally." },
        { name: "Lunar Base Alpha", cost: 2e15, income: 4e12, cutscene: "moon",
          flavor: "A base on the Moon. The commute is awful but the view sells itself." },
        { name: "BUY THE MOON", cost: 1e16, income: 2.5e13, cutscene: "moon",
          flavor: "You own the Moon now. The tides report to you. Romantic poets owe royalties." },
        { name: "Mars Colony", cost: 8e16, income: 1.5e14,
          flavor: "Population 340. Rent is extortionate. You set the rent." },
        { name: "Buy Mars", cost: 5e17, income: 1e15, cutscene: "launch",
          flavor: "The red planet, paid in full. You repaint nothing — red was always your color." },
        { name: "Dyson Swarm", cost: 4e18, income: 8e15,
          flavor: "You wrapped the sun in solar panels. The electric bill is now an electric income." },
        { name: "Own the Solar System", cost: 3e19, income: 6e16,
          flavor: "Every planet, dwarf planet and embarrassing asteroid: yours. The sun rises because you allow it." },
      ] },
    { id: "city", name: "Neon Heights", icon: "🌆",
      tagline: "Why rent an office when you can own the skyline it sits in?",
      stages: [
        { name: "Buy the Block", cost: 2e12, income: 4e9,
          flavor: "Your old landlord now rents from you. You raised his rent. Twice." },
        { name: "Mega Skyscraper", cost: 1.5e13, income: 3e10,
          flavor: "212 floors. The top floor is your desk. Just the desk." },
        { name: "Private District", cost: 9e13, income: 2e11,
          flavor: "Your name is on the street signs. And the streets. And the pigeons, somehow." },
        { name: "City of Neon Heights", cost: 6e14, income: 1.2e12,
          flavor: "A whole city. The WiFi is free and the statue in the square looks familiar." },
        { name: "Megacity Expansion", cost: 4e15, income: 8e12,
          flavor: "Three airports, one of them just for your sneakers." },
        { name: "Charter Your Own State", cost: 3e16, income: 5e13,
          flavor: "Your face is on the flag. The anthem is a dial-up sound. Beautiful." },
        { name: "Buy a Small Country", cost: 2e17, income: 4e14,
          flavor: "It came with a navy. Two boats. You named them CTRL and Z." },
        { name: "Floating Sky City", cost: 1.5e18, income: 3e15,
          flavor: "A city in the clouds, held up by money and a frankly alarming amount of fans." },
      ] },
    { id: "tech", name: "Singularity Labs", icon: "🧬",
      tagline: "Money can't buy happiness, but it funds the lab that's working on it.",
      stages: [
        { name: "Found Singularity Labs", cost: 3e12, income: 5e9,
          flavor: "You hired 200 PhDs and one guy who 'just gets vibes'. He runs the place." },
        { name: "Robot Workforce", cost: 2e13, income: 4e10,
          flavor: "The robots work 24/7 and never unionize. They do judge your code though." },
        { name: "Fusion Reactor", cost: 1.2e14, income: 2.5e11,
          flavor: "Infinite clean energy. Your electric kettle is now a flex." },
        { name: "Cure the Common Cold", cost: 8e14, income: 1.5e12,
          flavor: "Humanity weeps with gratitude. Big Tissue declares war." },
        { name: "AI Superintelligence", cost: 5e15, income: 1e13,
          flavor: "It became self-aware, looked at your bank balance, and chose loyalty." },
        { name: "Longevity Serum", cost: 4e16, income: 7e13,
          flavor: "Aging is now optional. You stay 'late twenties, eternally tired'." },
        { name: "Teleportation Grid", cost: 3e17, income: 5e14,
          flavor: "Traffic is abolished. Car salesmen form a support group. You fund it. You caused it." },
        { name: "Simulate a Universe", cost: 2.5e18, income: 4e15,
          flavor: "You booted a pocket universe. Somewhere inside it, a kid is grinding for WiFi money. Weird." },
      ] },
  ];

  const S = () => WB.GAME.state;

  function eState() {
    const s = S();
    if (!s.empire) s.empire = { unlocked: 0, ventures: {} };
    if (!s.empire.ventures) s.empire.ventures = {};
    return s.empire;
  }
  const stageOf = id => eState().ventures[id] == null ? -1 : eState().ventures[id];

  const teased = () => WB.GAME.netWorth() >= TEASE_NW || eState().unlocked;
  const unlocked = () => !!eState().unlocked;

  // called from the game tick (throttled) — flips the secret open with fanfare
  function checkUnlock(UI) {
    const e = eState();
    if (e.unlocked || WB.GAME.netWorth() < UNLOCK_NW) return;
    e.unlocked = 1;
    UI.toast("🪐 SECRET UNLOCKED: THE EMPIRE — a new tab has appeared. Time to spend like a final boss.", "era");
    UI.confetti();
    UI.bubble("A trillion. Okay. Earth feels… small now.");
  }

  function income() {
    const e = eState();
    let total = 0;
    VENTURES.forEach(v => {
      const st = e.ventures[v.id] == null ? -1 : e.ventures[v.id];
      for (let i = 0; i <= st && i < v.stages.length; i++) total += v.stages[i].income;
    });
    return total;
  }

  function nextStage(id) {
    const v = VENTURES.find(x => x.id === id);
    if (!v) return null;
    const st = stageOf(id);
    return st + 1 < v.stages.length ? v.stages[st + 1] : null;
  }

  function buyNext(id) {
    const s = S(), v = VENTURES.find(x => x.id === id);
    if (!v || !unlocked()) return { refused: "Locked." };
    const stage = nextStage(id);
    if (!stage) return { refused: "Venture complete. You literally own everything here." };
    if (s.money < stage.cost) return { refused: "Not enough cash. Yes, really. Even for you." };
    s.money -= stage.cost;
    eState().ventures[id] = stageOf(id) + 1;
    return { ok: true, venture: v, stage, cutscene: stage.cutscene || null };
  }

  // total stages owned across all ventures → an "empire rank" title
  function rank() {
    const owned = VENTURES.reduce((a, v) => a + (stageOf(v.id) + 1), 0);
    const titles = ["Trillionaire", "Mogul", "Tycoon", "Magnate", "Sovereign", "Planet Owner", "Star Lord", "Cosmic Landlord", "Final Boss"];
    return { owned, total: VENTURES.reduce((a, v) => a + v.stages.length, 0), title: titles[Math.min(titles.length - 1, Math.floor(owned / 3))] };
  }

  return { VENTURES, TEASE_NW, UNLOCK_NW, teased, unlocked, checkUnlock, income, stageOf, nextStage, buyNext, rank };
})();
