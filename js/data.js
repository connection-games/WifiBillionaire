/* WiFi Billionaire — balance tables & static data */
'use strict';
var WB = window.WB || {};
window.WB = WB;

WB.DATA = (function () {

  // ---------- Housing (9 tiers) ----------
  const HOUSING = [
    { name: "Parents' Bedroom",        cost: 0,      mult: 1.00, desc: "A mattress, a desk, and a poster of a sports car you can't afford." },
    { name: "Tiny Studio",             cost: 2500,   mult: 1.20, desc: "300 square feet of pure freedom. The shower is also the kitchen." },
    { name: "Small Apartment",         cost: 16000,  mult: 1.45, desc: "An actual bedroom door. Luxury." },
    { name: "Modern Apartment",        cost: 110000, mult: 1.75, desc: "Exposed brick. You point it out to everyone." },
    { name: "Luxury Apartment",        cost: 800000, mult: 2.10, desc: "The doorman knows your name. You tip in app credits." },
    { name: "Penthouse",               cost: 7e6,    mult: 2.50, desc: "Floor-to-ceiling windows. The city is your screensaver." },
    { name: "Mansion",                 cost: 9e7,    mult: 3.00, desc: "You have rooms you've literally never entered." },
    { name: "Private Island",          cost: 1.8e9,  mult: 3.60, desc: "The WiFi is satellite. The vibes are immaculate." },
    { name: "Futuristic Tech Campus",  cost: 6e10,   mult: 4.50, desc: "Your house has a mission statement." },
  ];

  // ---------- Equipment (12 categories × 8 tiers) ----------
  // effect types: income (% per tier, compounding), xp (% xp per tier),
  // energy (% slower drain), click (% click value), luck (flat luck)
  function tiers(names, baseCost, growth) {
    return names.map((n, i) => ({ name: n, cost: Math.round(baseCost * Math.pow(growth, i)) }));
  }
  const EQUIPMENT = {
    laptop:   { label: "Laptop",        icon: "💻", effect: "income", val: 0.08, owned0: true,
      tiers: tiers(["Mom's Old Laptop", "Refurb Special", "Mid-range Workhorse", "Creator Book Pro", "Dev Beast 9000", "Liquid-Cooled Slab", "Quantum Notebook", "Neural Deck X"], 300, 8) },
    pc:       { label: "Desktop PC",    icon: "🖥️", effect: "income", val: 0.11,
      tiers: tiers(["Beige Box", "Office Tower", "Gamer Rig", "Threadripper Build", "Dual-Xeon Monster", "Mini Supercomputer", "Photonic Tower", "Singularity Core"], 900, 8) },
    cpu:      { label: "CPU",           icon: "⚙️", effect: "income", val: 0.06,
      tiers: tiers(["Dusty Dual-Core", "Quad-Core", "8-Core", "16-Core", "64-Core", "128-Core", "Neuromorphic Chip", "Quantum CPU"], 500, 8) },
    gpu:      { label: "GPU",           icon: "🎮", effect: "income", val: 0.08,
      tiers: tiers(["Integrated Graphics", "Used Mining Card", "Mid-tier GPU", "Flagship GPU", "Dual GPUs", "GPU Cluster", "AI Accelerator", "Tensor Monolith"], 700, 8) },
    keyboard: { label: "Keyboard",      icon: "⌨️", effect: "xp", val: 0.06,
      tiers: tiers(["Sticky Membrane", "Quiet Office Board", "Mechanical Blues", "Hot-swap Customs", "Artisan Ergo Split", "Hall-Effect Pro", "Haptic Glass Deck", "Thought-to-Text Pad"], 80, 6.5) },
    mouse:    { label: "Mouse",         icon: "🖱️", effect: "click", val: 0.20,
      tiers: tiers(["Ball Mouse", "Office Mouse", "Gaming Mouse", "Wireless Pro", "Ultralight Esports", "Trackball Deluxe", "Gesture Ring", "Neural Pointer"], 50, 6.5) },
    monitor:  { label: "Monitor",       icon: "🖼️", effect: "xp", val: 0.08,
      tiers: tiers(["CRT From the Curb", "1080p Panel", "1440p IPS", "4K HDR", "Ultrawide", "Triple Ultrawides", "8K Wall", "Holo Display"], 200, 6.5) },
    desk:     { label: "Desk",          icon: "🪵", effect: "income", val: 0.04,
      tiers: tiers(["Folding Table", "Flat-pack Desk", "Solid Wood Desk", "Standing Desk", "Motorized Battlestation", "Executive Slab", "Smart Glass Desk", "Levitating Desk"], 150, 7.5) },
    chair:    { label: "Chair",         icon: "🪑", effect: "energy", val: 0.07,
      tiers: tiers(["Kitchen Chair", "Used Office Chair", "Gamer Throne", "Mesh Ergonomic", "Premium Ergo", "Massage Recliner", "Zero-G Pod", "Anti-Gravity Throne"], 120, 6.8) },
    internet: { label: "Internet",      icon: "📶", effect: "income", val: 0.10,
      tiers: tiers(["Neighbor's WiFi", "Budget DSL", "Cable 100Mb", "Fiber 1Gb", "Fiber 10Gb", "Dedicated Line", "Satellite Mesh", "Orbital Laser Link"], 400, 8) },
    server:   { label: "Server Rack",   icon: "🗄️", effect: "income", val: 0.12,
      tiers: tiers(["Raspberry Pi Shelf", "Closet Server", "Half Rack", "Full Rack", "Server Room", "Mini Datacenter", "Edge Network", "Orbital Datacenter"], 5000, 9) },
    office:   { label: "Office",        icon: "🏢", effect: "income", val: 0.14,
      tiers: tiers(["Corner of Bedroom", "Coffee Shop Regular", "Coworking Desk", "Private Office", "Startup Loft", "Company Floor", "HQ Building", "Campus Tower"], 8000, 9.5) },
  };

  // ---------- Careers (5 paths) ----------
  const CAREERS = {
    programmer: { name: "Programmer", icon: "💻", skill: "coding", reqEra: 0,
      tiers: [
        { name: "Freelancer",   income: 0.8,   reqSkill: 0,  cost: 0,      reqRep: 0 },
        { name: "Agency Owner", income: 11,    reqSkill: 9,  cost: 3000,   reqRep: 6 },
        { name: "SaaS Founder", income: 130,   reqSkill: 26, cost: 110000, reqRep: 40 },
        { name: "Tech CEO",     income: 1500,  reqSkill: 46, cost: 9e6,    reqRep: 170 },
      ] },
    creator: { name: "Content Creator", icon: "🎥", skill: "content", reqEra: 0,
      tiers: [
        { name: "Creator",      income: 1.4,   reqSkill: 4,  cost: 300,    reqRep: 0 },
        { name: "Influencer",   income: 20,    reqSkill: 13, cost: 10000,  reqRep: 16 },
        { name: "Media Empire", income: 320,   reqSkill: 34, cost: 5.5e5,  reqRep: 80 },
      ] },
    crypto: { name: "Crypto Trader", icon: "🪙", skill: "trading", reqEra: 0,
      tiers: [
        { name: "Trader",       income: 2.2,   reqSkill: 6,  cost: 600,    reqRep: 0 },
        { name: "Whale",        income: 38,    reqSkill: 19, cost: 45000,  reqRep: 10 },
        { name: "Crypto Mogul", income: 550,   reqSkill: 40, cost: 3e6,    reqRep: 55 },
      ] },
    ai: { name: "AI Entrepreneur", icon: "🤖", skill: "ai", reqEra: 2,
      tiers: [
        { name: "Automation Builder", income: 60,    reqSkill: 7,  cost: 28000,  reqRep: 13 },
        { name: "AI Agency",          income: 650,   reqSkill: 26, cost: 1.8e6,  reqRep: 65 },
        { name: "AI Empire",          income: 7500,  reqSkill: 50, cost: 1.5e8,  reqRep: 270 },
      ] },
    gamedev: { name: "Game Developer", icon: "🕹️", skill: "gamedev", reqEra: 0,
      tiers: [
        { name: "Indie Dev",     income: 3,     reqSkill: 6,  cost: 1400,   reqRep: 3 },
        { name: "Studio Owner",  income: 75,    reqSkill: 28, cost: 3.5e5,  reqRep: 48 },
        { name: "Gaming Empire", income: 2400,  reqSkill: 54, cost: 4e7,    reqRep: 200 },
      ] },
  };

  // ---------- Skills ----------
  const SKILLS = {
    coding:  { name: "Coding",     icon: "👨‍💻" },
    content: { name: "Content",    icon: "📹" },
    trading: { name: "Trading",    icon: "📈" },
    ai:      { name: "AI",         icon: "🧠" },
    gamedev: { name: "Game Dev",   icon: "🎲" },
    business:{ name: "Business",   icon: "💼" },
  };

  // ---------- Activities ----------
  const ACTIVITIES = {
    code:    { name: "Write Code",     icon: "💻", skill: "coding",  career: "programmer", work: true },
    content: { name: "Make Content",   icon: "🎥", skill: "content", career: "creator",    work: true },
    crypto:  { name: "Trade Crypto",   icon: "🪙", skill: "trading", career: "crypto",     work: true },
    ai:      { name: "Build AI",       icon: "🤖", skill: "ai",      career: "ai",         work: true, reqEra: 2 },
    gamedev: { name: "Make Games",     icon: "🕹️", skill: "gamedev", career: "gamedev",    work: true },
    study:   { name: "Study",          icon: "📚", skill: null,      career: null,         work: true },
    rest:    { name: "Sleep",          icon: "😴", work: false },
    grass:   { name: "Touch Grass",    icon: "🌱", work: false },
  };

  // ---------- Eras ----------
  const ERAS = [
    { year: 2015, name: "Internet Era",   mult: 1,   req: 0,      desc: "Everyone has an app idea. Including you." },
    { year: 2020, name: "Creator Era",    mult: 2,   req: 1.5e6,  desc: "Everyone is a content creator now. Attention is currency." },
    { year: 2025, name: "AI Era",         mult: 4.5, req: 8e7,    desc: "AI writes the code. You write the prompts. Allegedly." },
    { year: 2030, name: "Robotics Era",   mult: 10,  req: 4e9,    desc: "Your robots have standups. They keep them short." },
    { year: 2040, name: "Space-Tech Era", mult: 24,  req: 2e11,   desc: "Latency to your Mars office is rough, but the view is great." },
  ];

  // ---------- Traits ----------
  const TRAITS = {
    workaholic:  { name: "Workaholic",   icon: "🔥", desc: "+15% income, energy drains 10% faster.", income: 1.15, energyDrain: 1.1 },
    ambitious:   { name: "Ambitious",    icon: "🚀", desc: "+10% income, +10% XP.", income: 1.10, xp: 1.10 },
    optimistic:  { name: "Optimistic",   icon: "😄", desc: "+10% happiness recovery, better event luck.", luck: 3 },
    lazy:        { name: "Lazy",         icon: "🛋️", desc: "-10% income, energy drains 20% slower.", income: 0.90, energyDrain: 0.8 },
    risktaker:   { name: "Risk Taker",   icon: "🎲", desc: "Project outcomes swing 30% harder, both ways.", swing: 1.3 },
    cryptoaddict:{ name: "Crypto Addict",icon: "📉", desc: "+25% crypto income, +stress.", cryptoIncome: 1.25 },
    creator:     { name: "Creator",      icon: "✨", desc: "+20% content income, +followers.", creatorIncome: 1.20 },
    builder:     { name: "Builder",      icon: "🔨", desc: "+15% project speed.", projectSpeed: 1.15 },
    visionary:   { name: "Visionary",    icon: "🔭", desc: "+20% income in the two newest eras.", visionary: true },
    frugal:      { name: "Frugal",       icon: "🐷", desc: "Everything costs 8% less.", costMult: 0.92 },
    competitive: { name: "Competitive",  icon: "🏆", desc: "+12% XP, +5% income.", income: 1.05, xp: 1.12 },
  };

  // ---------- Perks ----------
  const PERKS = [
    { id: "workaholic_p",  name: "Workaholic",        icon: "☕", desc: "+12% income while working." },
    { id: "nightowl",      name: "Night Owl",         icon: "🦉", desc: "Energy drains 20% slower." },
    { id: "lucky",         name: "Lucky",             icon: "🍀", desc: "+5 hidden luck. Good things happen more." },
    { id: "viralgenius",   name: "Viral Genius",      icon: "📱", desc: "Projects are 2x as likely to go viral." },
    { id: "cryptowizard",  name: "Crypto Wizard",     icon: "🧙", desc: "+30% crypto trading returns." },
    { id: "networking",    name: "Networking Expert", icon: "🤝", desc: "+50% reputation gain." },
    { id: "ramenmaster",   name: "Ramen Master",      icon: "🍜", desc: "Happiness never drops below 30." },
    { id: "fastlearner",   name: "Fast Learner",      icon: "⚡", desc: "+25% skill XP." },
    { id: "caffeinated",   name: "Caffeinated",       icon: "🥤", desc: "+15% project speed." },
    { id: "minimalist",    name: "Minimalist",        icon: "📦", desc: "Equipment costs 10% less." },
    { id: "shipit",        name: "Ship It",           icon: "🚢", desc: "Projects complete 20% faster but fail 5% more." },
    { id: "perfectionist", name: "Perfectionist",     icon: "💎", desc: "Projects 15% slower, payouts +35%." },
    { id: "sidehustler",   name: "Side Hustler",      icon: "🧰", desc: "+20% income from careers you're NOT focused on." },
    { id: "influence",     name: "Main Character",    icon: "🌟", desc: "+25% follower gain." },
    { id: "zen",           name: "Zen Mode",          icon: "🧘", desc: "Stress builds 30% slower." },
    { id: "compound",      name: "Compound Brain",    icon: "🏦", desc: "+1% income per housing tier owned." },
    { id: "automation",    name: "Automation Lover",  icon: "🦾", desc: "+15% income while sleeping." },
    { id: "negotiator",    name: "Negotiator",        icon: "🗣️", desc: "Career upgrades cost 15% less." },
    { id: "trendspotter",  name: "Trend Spotter",     icon: "🔮", desc: "+10% income in the newest unlocked era." },
    { id: "grindset",      name: "Grindset",          icon: "🗿", desc: "+8% income permanently. No notes." },
    { id: "touchgrass",    name: "Grass Toucher",     icon: "🌿", desc: "Touching grass restores 50% more." },
    { id: "investor",      name: "Angel Mindset",     icon: "👼", desc: "Offline earnings +25%." },
    { id: "clicker",       name: "Hustle Fingers",    icon: "👆", desc: "Hustle clicks worth +50%." },
    { id: "rarefind",      name: "Rare Find",         icon: "💠", desc: "+3 luck and +5% income. Prestige-tier perk.", rare: true },
  ];

  // ---------- Prestige shop ----------
  const PRESTIGE_UPGRADES = [
    { id: "legacyincome", name: "Old Money",       icon: "💰", desc: "+25% income per level.", baseCost: 1, costGrowth: 1.6, max: 50 },
    { id: "headstart",    name: "Head Start",      icon: "🏁", desc: "Start each life with $1,000 × level.", baseCost: 1, costGrowth: 1.5, max: 20 },
    { id: "legacyluck",   name: "Born Lucky",      icon: "🍀", desc: "+2 luck per level.", baseCost: 2, costGrowth: 1.7, max: 15 },
    { id: "legacyxp",     name: "Genius Genes",    icon: "🧬", desc: "+20% skill XP per level.", baseCost: 2, costGrowth: 1.6, max: 25 },
    { id: "keephardware", name: "Storage Unit",    icon: "📦", desc: "Keep 1 equipment tier per category per level after rebirth.", baseCost: 3, costGrowth: 2.0, max: 8 },
    { id: "rareperks",    name: "Perk Connoisseur",icon: "💠", desc: "Rare perks can appear in perk choices.", baseCost: 5, costGrowth: 1, max: 1 },
    { id: "offlinecap",   name: "Night Shift",     icon: "🌙", desc: "+4h offline earnings cap per level.", baseCost: 2, costGrowth: 1.8, max: 10 },
    { id: "faststart",    name: "Speedrun Mode",   icon: "⏩", desc: "+50% income below $10k per level.", baseCost: 1, costGrowth: 1.4, max: 10 },
  ];

  // ---------- Goals (guided progression) ----------
  const GOALS = [
    { id: "g1",  text: "Earn your first $10",          check: s => s.allTimeEarnings >= 10 },
    { id: "g2",  text: "Reach Coding level 3",          check: s => s.skills.coding.level >= 3 },
    { id: "g3",  text: "Ship your first project",       check: s => s.stats.projectsShipped >= 1 },
    { id: "g4",  text: "Save up $500",                  check: s => s.money >= 500 },
    { id: "g5",  text: "Buy a real laptop (tier 2)",    check: s => s.equipment.laptop >= 1 },
    { id: "g6",  text: "Move into the Tiny Studio",     check: s => s.housing >= 1 },
    { id: "g7",  text: "Unlock a second career",        check: s => Object.values(s.careers).filter(t => t >= 0).length >= 2 },
    { id: "g8",  text: "Reach $10,000",                 check: s => s.money >= 10000 },
    { id: "g9",  text: "Move into the Small Apartment", check: s => s.housing >= 2 },
    { id: "g10", text: "Become an Agency Owner",        check: s => s.careers.programmer >= 1 || s.careers.creator >= 1 || s.careers.crypto >= 1 },
    { id: "g11", text: "Reach $100,000",                check: s => s.money >= 100000 },
    { id: "g12", text: "Enter the Creator Era",         check: s => s.era >= 1 },
    { id: "g13", text: "Become a millionaire",          check: s => s.money >= 1e6 },
    { id: "g14", text: "Buy the Penthouse",             check: s => s.housing >= 5 },
    { id: "g15", text: "Enter the AI Era",              check: s => s.era >= 2 },
    { id: "g16", text: "Reach $100M net worth",         check: s => (s.money + s.crypto.holdings) >= 1e8 },
    { id: "g17", text: "Buy the Private Island",        check: s => s.housing >= 7 },
    { id: "g18", text: "Reach $1B — prestige unlocked", check: s => (s.money + s.crypto.holdings) >= 1e9 },
    { id: "g19", text: "Prestige and be reborn",        check: s => s.prestige.count >= 1 },
    { id: "g20", text: "Reach the Space-Tech Era",      check: s => s.era >= 4 },
  ];

  return { HOUSING, EQUIPMENT, CAREERS, SKILLS, ACTIVITIES, ERAS, TRAITS, PERKS, PRESTIGE_UPGRADES, GOALS };
})();

// ---------- Build version (keep in sync with package.json) ----------
WB.VERSION = "6.0.0";

// ---------- Number formatting ----------
WB.fmt = function (n, money) {
  if (n === undefined || n === null || isNaN(n)) n = 0;
  const neg = n < 0 ? "-" : "";
  n = Math.abs(n);
  const pre = money ? "$" : "";
  const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  if (n < 1000) {
    const v = n < 10 && money ? n.toFixed(2) : (n < 100 ? Math.round(n * 10) / 10 : Math.round(n));
    return neg + pre + v;
  }
  let u = 0;
  while (n >= 1000 && u < units.length - 1) { n /= 1000; u++; }
  return neg + pre + (n >= 100 ? n.toFixed(0) : n.toFixed(n >= 10 ? 1 : 2)) + units[u];
};
WB.fmtTime = function (sec) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return h + "h " + m + "m";
  if (m > 0) return m + "m " + s + "s";
  return s + "s";
};
WB.rand = (a, b) => a + Math.random() * (b - a);
WB.pick = arr => arr[Math.floor(Math.random() * arr.length)];
WB.chance = p => Math.random() < p;
