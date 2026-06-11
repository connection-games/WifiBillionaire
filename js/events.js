/* WiFi Billionaire — random event system.
   Major events open a choice modal; minor events auto-resolve as toasts + thoughts.
   Templates with slot fillers + variants generate hundreds of distinct events. */
'use strict';

WB.EVENTS = (function () {
  const fill = WB.THOUGHTS.fill;
  // windfall: a payout worth `sec` seconds of current income (keeps events linear, not exponential)
  const wf = sec => WB.GAME.incomePerSec() * sec;

  // effect helpers operate on game via WB.GAME.applyEffect
  // effect = { money, moneyPct (of current), incomeBoost:{mult,sec}, energy, happiness, stress,
  //            reputation, motivation, followers, cryptoPct, skillXp:{skill,amount}, luckCheck }

  // ---------- Major events (choice modals) ----------
  const MAJOR = [
    {
      id: "investor", title: "Investor Slides Into Your DMs", icon: "💼",
      cond: s => s.stats.projectsShipped >= 3 && s.money > 1000,
      text: "A venture capitalist saw your work and offers funding — in exchange for 'just a few small changes to everything'.",
      choices: [
        { label: "Take the money", result: "Wired instantly. The group chat will hear about this.",
          effect: s => ({ money: 2000 + wf(240), stress: 15, reputation: 10 }) },
        { label: "Stay independent", result: "Freedom is priceless. Your reputation for integrity grows.",
          effect: s => ({ reputation: 25, motivation: 15, happiness: 5 }) },
      ],
    },
    {
      id: "acquisition", title: "Acquisition Offer!", icon: "🤝",
      cond: s => s.money > 100000 && Object.values(s.careers).some(t => t >= 1),
      text: "{bigco} wants to acquire one of your side products for a suspiciously round number.",
      choices: [
        { label: "Sell it", result: "Champagne (the affordable kind). The product is theirs now.",
          effect: s => ({ money: wf(600) + 20000, happiness: 10, reputation: 5 }) },
        { label: "Counter-offer x3", result: "They laughed. Then they paid. Sometimes audacity is a skill.", luckCheck: 0.4,
          effect: s => ({ money: wf(1500) + 50000, reputation: 15, ego: 10 }),
          failResult: "They walked away. The deal evaporated like your confidence.",
          failEffect: s => ({ motivation: -15, stress: 10 }) },
      ],
    },
    {
      id: "lawsuit", title: "Unexpected Lawsuit", icon: "⚖️",
      cond: s => s.money > 50000,
      text: "Someone claims they invented your idea first. Their evidence: a napkin sketch from 2009.",
      choices: [
        { label: "Settle quietly", result: "Money gone, problem gone. The napkin wins this round.",
          effect: s => ({ moneyPct: -0.12, stress: 5 }) },
        { label: "Fight it in court", result: "The napkin did not hold up under cross-examination. Victory!", luckCheck: 0.65,
          effect: s => ({ reputation: 20, happiness: 10, stress: 10 }),
          failResult: "The napkin had... notarization? You lose, painfully.",
          failEffect: s => ({ moneyPct: -0.30, stress: 25, happiness: -10 }) },
      ],
    },
    {
      id: "taxbill", title: "Tax Bill Arrives", icon: "🧾",
      cond: s => s.money > 5000,
      text: "The tax office has discovered that you exist and earn money. They have opinions about this.",
      choices: [
        { label: "Pay it", result: "Painful but clean. Your accountant-shaped spreadsheet approves.",
          effect: s => ({ moneyPct: -0.10, happiness: -3 }) },
        { label: "Hire a tax expert", result: "Deductions you didn't know existed. The expert pays for themselves.",
          effect: s => ({ moneyPct: -0.04, money: -500, intelligence: 1 }) },
      ],
    },
    {
      id: "cryptopump", title: "Crypto Is Exploding!", icon: "🚀",
      cond: s => s.era >= 0 && s.money > 200,
      text: "{coin} is up 400% today. Your group chat has achieved sentience. FOMO levels: critical.",
      choices: [
        { label: "Ape in (25% of cash)", result: "It kept going! You sold near the top like an absolute legend.", luckCheck: 0.45,
          effect: s => ({ money: wf(300), stress: 10, ego: 5 }),
          failResult: "You bought the exact top. The chart now looks like a ski slope.",
          failEffect: s => ({ moneyPct: -0.25, stress: 15, happiness: -8 }) },
        { label: "Stay calm", result: "It crashed 80% an hour later. Inner peace: achieved.",
          effect: s => ({ happiness: 8, motivation: 5, intelligence: 1 }) },
      ],
    },
    {
      id: "burnout", title: "Burnout Warning", icon: "🫠",
      cond: s => s.res.stress > 75,
      text: "Your body has submitted a formal resignation letter. Your eye twitch has its own eye twitch.",
      choices: [
        { label: "Take a real break", result: "You watched clouds. Clouds are great. Who knew?",
          effect: s => ({ stress: -40, energy: 30, happiness: 15, motivation: 10 }) },
        { label: "Push through", result: "You powered through on spite and caffeine. The work got done. At a price.",
          effect: s => ({ money: wf(60) + 100, stress: 15, energy: -20, happiness: -10 }) },
      ],
    },
    {
      id: "viralmoment", title: "You're Going Viral!", icon: "📱",
      cond: s => s.stats.followers > 100,
      text: "One of your posts escaped containment. Strangers are forming opinions about you at industrial scale.",
      choices: [
        { label: "Ride the wave", result: "Follower counter went brrr. The algorithm loves you (for now).",
          effect: s => ({ followers: 300 + s.stats.followers * 0.15, reputation: 15, incomeBoost: { mult: 2, sec: 120 } }) },
        { label: "Drop a product link", result: "Shameless? Yes. Profitable? Extremely.",
          effect: s => ({ money: wf(240) + 500, followers: 100 + s.stats.followers * 0.05, ego: 5 }) },
      ],
    },
    {
      id: "competitor", title: "Competitor Copies Your Product", icon: "👀",
      cond: s => Object.values(s.careers).some(t => t >= 1),
      text: "{bigco} just launched a pixel-perfect copy of your product. Even the typos match.",
      choices: [
        { label: "Out-innovate them", result: "You shipped three features while they were still copying the first.",
          effect: s => ({ skillXp: { amount: 200 }, motivation: 15, stress: 10, reputation: 10 }) },
        { label: "Tweet about it", result: "The internet dragged them mercilessly. Sympathy customers arrived.",
          effect: s => ({ followers: 200, reputation: 8, happiness: 5 }) },
      ],
    },
    {
      id: "employeequit", title: "Key Employee Quits", icon: "🚪",
      cond: s => Object.values(s.careers).some(t => t >= 2),
      text: "Your best person is leaving to 'find themselves'. They found themselves at a competitor.",
      choices: [
        { label: "Counter-offer", result: "Money fixed it. Money usually fixes it.",
          effect: s => ({ moneyPct: -0.05, stress: 5 }) },
        { label: "Wish them well", result: "Classy. The team noticed. Morale up, workload also up.",
          effect: s => ({ reputation: 12, stress: 10, motivation: 8 }) },
      ],
    },
    {
      id: "featured", title: "Your App Got Featured!", icon: "🌟",
      cond: s => s.careers.programmer >= 1 || s.careers.gamedev >= 0,
      text: "An editor at a big platform featured your product. Servers are sweating. So are you.",
      choices: [
        { label: "Scale the servers", result: "Smooth sailing. New users became paying users.",
          effect: s => ({ money: -500, incomeBoost: { mult: 3, sec: 180 }, reputation: 15 }) },
        { label: "Pray to the uptime gods", result: "It mostly held. 'Mostly' is doing a lot of work in that sentence.", luckCheck: 0.5,
          effect: s => ({ incomeBoost: { mult: 2.5, sec: 150 }, reputation: 10 }),
          failResult: "Everything crashed during peak traffic. The reviews are poetry. Mean poetry.",
          failEffect: s => ({ reputation: -10, stress: 20 }) },
      ],
    },
    {
      id: "audit", title: "IRS Audit", icon: "🔍",
      cond: s => s.money > 1e6,
      text: "The tax office would like 'a quick chat'. They brought folders. Plural.",
      choices: [
        { label: "Cooperate fully", result: "Painful, thorough, but clean. They even complimented your spreadsheets.",
          effect: s => ({ moneyPct: -0.08, stress: 12, reputation: 5 }) },
        { label: "Lawyer up", result: "Your lawyer found their mistake. Case closed, reputation intact.", luckCheck: 0.55,
          effect: s => ({ money: -2000, reputation: 10 }),
          failResult: "The lawyer was expensive AND you still owed. Double pain.",
          failEffect: s => ({ moneyPct: -0.18, stress: 20 }) },
      ],
    },
    {
      id: "ransomware", title: "Servers Hacked!", icon: "🔒",
      cond: s => s.equipment.server >= 1,
      text: "A hacker encrypted your servers and left a ransom note. With a typo. Somehow that makes it worse.",
      choices: [
        { label: "Pay the ransom", result: "Decrypted. You both pretend this never happened.",
          effect: s => ({ money: -Math.min(s.money * 0.1, WB.GAME.incomePerSec() * 400), stress: 10 }) },
        { label: "Rebuild from backups", result: "The backups WORKED. Past you is a legend. The hacker is furious.",
          effect: s => ({ incomeBoost: { mult: 0.4, sec: 90 }, skillXp: { skill: "coding", amount: 250 }, reputation: 8 }) },
      ],
    },
    {
      id: "pitchnight", title: "Startup Pitch Night", icon: "🎤",
      cond: s => s.money > 20000 && s.res.reputation > 30,
      text: "A founder you half-trust wants you to invest in their startup: '{appAdj} for {appNoun}'. The deck has 14 rocket emojis.",
      choices: [
        { label: "Invest", result: "They actually shipped! Your stake is worth a small fortune.", luckCheck: 0.42,
          effect: s => ({ money: wf(1200), reputation: 10, ego: 5 }),
          failResult: "They pivoted four times and bought standing desks with your money. It's gone.",
          failEffect: s => ({ money: -Math.min(s.money * 0.15, wf(600)), stress: 8 }) },
        { label: "Politely decline", result: "You kept your money. The deck haunts your dreams anyway.",
          effect: s => ({ intelligence: 1, happiness: 2 }) },
      ],
    },
    {
      id: "documentary", title: "Documentary Request", icon: "🎥",
      cond: s => s.res.reputation > 200,
      text: "A streaming platform wants to make a documentary about your rise. Working title: 'The WiFi Billionaire'.",
      choices: [
        { label: "Let them film", result: "It trended for a week. Your DMs will never recover.",
          effect: s => ({ reputation: 60, followers: 5000, stress: 10, ego: 15 }) },
        { label: "Stay mysterious", result: "Declining made you MORE interesting. The internet loves a recluse.",
          effect: s => ({ reputation: 25, happiness: 8 }) },
      ],
    },
    {
      id: "branddeal", title: "Big Brand Sponsorship", icon: "💄",
      cond: s => s.stats.followers > 50000,
      text: "A massive brand wants you to promote their new energy drink, 'GRIND ZERO'. It tastes like static electricity.",
      choices: [
        { label: "Take the deal", result: "The money hit the account before the video even rendered.",
          effect: s => ({ money: wf(900) + 5000, reputation: -8, followers: -200 }) },
        { label: "Decline on principle", result: "Your audience noticed. Respect: earned. Money: not.",
          effect: s => ({ reputation: 18, happiness: 5 }) },
      ],
    },
    {
      id: "poached", title: "You're Being Poached", icon: "🎣",
      cond: s => Object.values(s.careers).some(t => t >= 2),
      text: "{bigco} wants YOU as their new CEO. Corner office, stock options, mandatory synergy meetings.",
      choices: [
        { label: "Take the signing bonus", result: "You lasted one quarter, banked the bonus, and quit in a blaze of glory.",
          effect: s => ({ money: wf(1000) + 10000, motivation: -20, stress: 12 }) },
        { label: "Bet on yourself", result: "You said no to a corner office. The grind respects it.",
          effect: s => ({ motivation: 20, reputation: 12, happiness: 5 }) },
      ],
    },
    {
      id: "momlaptop", title: "Mom Needs The Laptop", icon: "👩",
      cond: s => s.housing === 0,
      text: "Mom wants to borrow your laptop 'for five minutes' to look at a recipe. You know what five minutes means.",
      choices: [
        { label: "Hand it over", result: "Forty minutes and 14 new toolbars later, you got it back. She found the recipe. Family harmony +1.",
          effect: s => ({ happiness: 8, motivation: -5, incomeBoost: { mult: 0.5, sec: 40 } }) },
        { label: "Set up her old tablet instead", result: "Tech support: 30 minutes. Result: mom thinks you're a genius. The empire's first satisfied user.",
          effect: s => ({ happiness: 5, reputation: 3, energy: -8 }) },
      ],
    },
    {
      id: "roommate", title: "Roommate Application", icon: "🧍",
      cond: s => s.housing >= 1 && s.housing <= 2,
      text: "Someone answered your roommate ad. He owns a snake, a drum kit, and 'mostly works nights'. Rent would be halved though.",
      choices: [
        { label: "Move him in", result: "The snake is named Kevin. The drums are constant. The rent savings are real.",
          effect: s => ({ money: wf(220) + 200, happiness: -8, stress: 8 }) },
        { label: "Live alone", result: "Expensive silence. Worth every penny.",
          effect: s => ({ happiness: 6, motivation: 4 }) },
      ],
    },
    {
      id: "keynote", title: "Keynote Invitation", icon: "🎙️",
      cond: s => s.res.reputation > 60,
      text: "A tech conference wants you to give the closing keynote: 'From Bedroom to Empire'. 2,000 people. One clicker.",
      choices: [
        { label: "Deliver the talk", result: "You opened with a joke. It LANDED. Standing ovation, viral clips, business cards everywhere.", luckCheck: 0.6,
          effect: s => ({ reputation: 30, followers: 2000, motivation: 15, ego: 8 }),
          failResult: "The demo crashed live on stage. The screenshot is a meme now. Engagement is engagement?",
          failEffect: s => ({ reputation: -5, followers: 800, stress: 15, happiness: -5 }) },
        { label: "Send a video message", result: "Safe, professional, forgettable. The conference WiFi failed during it anyway.",
          effect: s => ({ reputation: 8 }) },
      ],
    },
    {
      id: "viralchallenge", title: "Viral Challenge Alert", icon: "🤸",
      cond: s => s.careers.creator >= 0,
      text: "A dangerous-looking challenge is trending: coding for 24 hours on a treadmill. Participation is optional. Clout is not.",
      choices: [
        { label: "Do the challenge", result: "Your legs filed a complaint, but the video CRUSHED. New followers love commitment.",
          effect: s => ({ followers: 1500, energy: -35, happiness: 5, reputation: 8 }) },
        { label: "Mock the challenge instead", result: "Your takedown video did numbers. Irony is also content.",
          effect: s => ({ followers: 600, reputation: 5, happiness: 5 }) },
      ],
    },
    {
      id: "patenttroll", title: "Patent Troll Attack", icon: "🧌",
      cond: s => s.money > 200000,
      text: "A company that produces nothing claims it owns the patent on 'displaying information on a screen'. They want licensing fees.",
      choices: [
        { label: "Pay the fee", result: "Cheaper than court. The troll returns to its bridge.",
          effect: s => ({ money: -Math.min(s.money * 0.06, WB.GAME.incomePerSec() * 300), stress: 4 }) },
        { label: "Fight it publicly", result: "Your legal thread went viral. The troll's patent got invalidated. Hero status achieved.", luckCheck: 0.5,
          effect: s => ({ reputation: 25, followers: 1000, stress: 12 }),
          failResult: "The court sided with the troll. The legal system is also a meme.",
          failEffect: s => ({ money: -Math.min(s.money * 0.12, WB.GAME.incomePerSec() * 600), stress: 18 }) },
      ],
    },
    {
      id: "exchangecollapse", title: "Crypto Exchange Wobbles", icon: "🏦",
      cond: s => s.crypto.holdings > 1000,
      text: "Your exchange's CEO just tweeted 'assets are fine 🙏'. Historically, that emoji has a 100% disaster rate.",
      choices: [
        { label: "Withdraw everything NOW", result: "Funds secured. Six hours later the exchange 'paused withdrawals'. You legend.",
          effect: s => ({ cryptoPct: -0.05, happiness: 8, intelligence: 2 }) },
        { label: "Trust the prayer emoji", result: "Somehow... it was fine? The CEO bought a stadium. Crypto is unknowable.", luckCheck: 0.35,
          effect: s => ({ cryptoPct: 0.25, ego: 5 }),
          failResult: "The exchange collapsed. Your coins are now 'a learning experience'.",
          failEffect: s => ({ cryptoPct: -0.55, stress: 20, happiness: -10 }) },
      ],
    },
    {
      id: "aiethics", title: "AI Ethics Review", icon: "🧑‍⚖️",
      cond: s => s.careers.ai >= 1,
      text: "Your AI started giving customers life advice. It's... weirdly good at it? Regulators have questions anyway.",
      choices: [
        { label: "Add guardrails", result: "The AI now ends every answer with 'consult a professional'. Compliance achieved. Vibes reduced.",
          effect: s => ({ money: -WB.GAME.incomePerSec() * 120, reputation: 12 }) },
        { label: "Let it cook", result: "The AI's advice column got syndicated. Regulators subscribed. Unbelievable.", luckCheck: 0.45,
          effect: s => ({ money: wf(500), followers: 2000, reputation: 10 }),
          failResult: "It told a CEO to 'follow his dreams'. He dissolved the company. Lawsuits incoming.",
          failEffect: s => ({ money: -WB.GAME.incomePerSec() * 400, reputation: -10, stress: 15 }) },
      ],
    },
    {
      id: "publisher", title: "Publisher Deal Offer", icon: "📦",
      cond: s => s.careers.gamedev >= 1,
      text: "A big games publisher loves your latest game. They offer money, marketing, and 'just a few microtransaction ideas'.",
      choices: [
        { label: "Sign the deal", result: "The money is great. The horse armor DLC haunts your dreams.",
          effect: s => ({ money: wf(800) + 5000, reputation: -8, stress: 8 }) },
        { label: "Stay indie", result: "You posted 'staying indie 💪' and the internet showered you in wishlists.",
          effect: s => ({ reputation: 18, followers: 800, motivation: 12 }) },
      ],
    },
    {
      id: "celebcollab", title: "Celebrity Collab DM", icon: "🌟",
      cond: s => s.stats.followers > 20000,
      text: "An A-list celebrity wants to collab. Their last three business ventures were: scented candles, an app, and jail-adjacent.",
      choices: [
        { label: "Collab anyway", result: "The video broke the internet. Their fans are now your fans. Chaos, but profitable chaos.", luckCheck: 0.55,
          effect: s => ({ followers: 8000, money: wf(400), reputation: 10 }),
          failResult: "They no-showed twice, then posted the collab without you in it. Hollywood, baby.",
          failEffect: s => ({ stress: 10, happiness: -5, followers: 300 }) },
        { label: "Politely decline", result: "Two months later their new venture collapsed spectacularly. Dodged.",
          effect: s => ({ intelligence: 2, happiness: 5 }) },
      ],
    },
    {
      id: "mysteryusb", title: "Mysterious USB Drive", icon: "🔌",
      cond: s => s.skills.coding.level >= 10,
      text: "A USB drive arrived in the mail. No sender. The label says 'DO NOT PLUG IN'. It's basically begging to be plugged in.",
      choices: [
        { label: "Plug it in (sandboxed)", result: "It contained a 2009 mixtape and someone's tax returns. Disappointing AND illegal to keep.",
          effect: s => ({ intelligence: 2, skillXp: { skill: "coding", amount: 150 }, happiness: 3 }) },
        { label: "Destroy it", result: "Smashed it with a hammer like a cybersecurity professional. Felt incredible.",
          effect: s => ({ happiness: 5, stress: -5 }) },
      ],
    },
    {
      id: "interndrama", title: "The Intern Deployed on Friday", icon: "🧑‍🎓",
      cond: s => Object.keys(s.assets.staff).length >= 1,
      text: "Your intern pushed straight to production at 4:58 PM on a Friday. The site is now in Comic Sans. All of it.",
      choices: [
        { label: "Roll it back calmly", result: "Crisis handled. The intern learned about deploy windows. You learned about your blood pressure.",
          effect: s => ({ stress: 8, reputation: 2, skillXp: { skill: "business", amount: 100 } }) },
        { label: "Keep the Comic Sans for the weekend", result: "Users thought it was a bit. Engagement UP 40%. The intern wants a raise.",
          effect: s => ({ followers: 900, happiness: 8, reputation: 5 }) },
      ],
    },
    {
      id: "foodtruck", title: "Food Truck Pitch", icon: "🌮",
      cond: s => s.money > 50000,
      text: "Your cousin wants you to invest in his food truck: 'Crypto Tacos'. You can pay in crypto. The tacos are allegedly good.",
      choices: [
        { label: "Fund the truck", result: "The tacos ARE good. The truck breaks even, the family dinners are heroic now.", luckCheck: 0.5,
          effect: s => ({ money: wf(350), happiness: 10, reputation: 5 }),
          failResult: "The truck caught fire. Insurance called it 'taco-related'. Family dinners are awkward now.",
          failEffect: s => ({ money: -Math.min(s.money * 0.08, wf(400)), happiness: -5 }) },
        { label: "Decline with love", result: "You bought ten tacos instead. Diplomatic AND delicious.",
          effect: s => ({ money: -50, happiness: 6 }) },
      ],
    },
  ];

  // ---------- Minor events (auto-resolve, toast + thought) ----------
  // Each entry: cond (optional), weight, text, effect(s), bubble (optional thought reaction tag or literal)
  const MINOR = [
    { cond: s => s.housing === 0, w: 3, text: "Mom interrupts: 'Are you still on that computer?' You lose your train of thought but gain a sandwich.",
      effect: s => ({ energy: 8, happiness: 4, motivation: -3 }), bubble: "Thanks for the sandwich, mom. The empire thanks you too." },
    { cond: s => s.housing === 0, w: 2, text: "Dad questions your life choices over dinner. 'When will you get a REAL job?'",
      effect: s => ({ motivation: -8, stress: 5 }), bubble: "One day, dad. One day this WiFi pays the bills." },
    { cond: s => s.housing === 0, w: 1.5, text: "Mom vacuums directly under your desk during your most important call.",
      effect: s => ({ stress: 6, reputation: -2 }), bubble: "She waited for the call. I KNOW she waited for the call." },
    { w: 1.5, text: "Your laptop fan screams like a jet engine, then dies. Repairs aren't free.",
      cond: s => s.money > 100, effect: s => ({ money: -Math.min(s.money * 0.08, 5000), stress: 8 }), bubble: "Why do machines only break when rent is due?" },
    { w: 1.5, text: "Internet outage! The router blinks mockingly. You stare into the void.",
      effect: s => ({ incomeBoost: { mult: 0.2, sec: 45 }, stress: 8, happiness: -3 }), bubble: "No internet. So this is what the 1800s felt like." },
    { w: 1, cond: s => s.crypto.holdings > 10, text: "Crypto market pumps! Your portfolio is green and glowing.",
      effect: s => ({ cryptoPct: 0.30, happiness: 5 }), bubble: "Green candles! I am a financial genius (temporarily)." },
    { w: 1, cond: s => s.crypto.holdings > 10, text: "Crypto crash! The chart fell off a cliff and kept digging.",
      effect: s => ({ cryptoPct: -0.30, stress: 8 }), bubble: "It's not a loss until I sell. It's not a loss until I sell." },
    { w: 1, text: "A stranger on the internet compliments your work. Unprompted. Genuinely.",
      effect: s => ({ motivation: 10, happiness: 8 }), bubble: "A nice comment?? Framing this mentally forever." },
    { w: 1, text: "You find $20 in an old jacket. Past you was a legend.",
      effect: s => ({ money: 20, happiness: 5 }), bubble: "Free money! Past me, you beautiful genius." },
    { w: 1, text: "Power nap accidentally becomes a 3-hour hibernation.",
      effect: s => ({ energy: 35, motivation: -5 }), bubble: "It's not oversleeping, it's offline processing." },
    { w: 1, text: "Your post gets a small boost from {platform}. New followers trickle in.",
      effect: s => ({ followers: 25, reputation: 2 }), bubble: "Hello, new people. Please stay. I have content." },
    { w: 0.8, text: "Coffee machine breaks. Productivity enters a state of mourning.",
      effect: s => ({ energy: -10, happiness: -5 }), bubble: "No coffee. We work in darkness now." },
    { w: 0.8, text: "An old client returns with a rush job and a fat bonus.",
      cond: s => s.careers.programmer >= 0, effect: s => ({ money: 100 + wf(90), energy: -10 }), bubble: "Rush jobs: terrible for sleep, great for rent." },
    { w: 0.8, text: "You fall down a 2-hour wiki rabbit hole about {appNoun}.",
      effect: s => ({ intelligence: 1, motivation: -4 }), bubble: "Was that productive? No. Do I regret it? Also no." },
    { w: 0.7, text: "Spam call offers to extend your car's warranty. You don't own a car.",
      effect: s => ({ stress: 2 }), bubble: "Extend my WiFi warranty and we'll talk." },
    { w: 0.7, text: "Your video gets stolen and reuploaded — but the comments defend you and follow your page.",
      cond: s => s.stats.followers > 50, effect: s => ({ followers: 60, reputation: 4 }), bubble: "Stolen content but free marketing? The internet is chaos." },
    { w: 0.7, text: "A bug you couldn't fix for days resolves itself after a restart.",
      effect: s => ({ happiness: 6, stress: -8 }), bubble: "I don't trust it. But I accept it." },
    { w: 0.6, text: "Neighbor's WiFi suddenly gets a password. Dark times (you were borrowing it).",
      cond: s => s.equipment.internet === 0, effect: s => ({ stress: 5, incomeBoost: { mult: 0.5, sec: 60 } }), bubble: "'family123' didn't work. They've evolved." },
    { w: 0.6, text: "You win a small online hackathon. Prize: money and bragging rights.",
      cond: s => s.skills.coding.level >= 10, effect: s => ({ money: 250 + wf(60), reputation: 6, ego: 3 }), bubble: "Hackathon champion. Adding it to every bio I have." },
    { w: 0.6, text: "A celebrity accidentally likes your post. The notification tsunami begins.",
      cond: s => s.stats.followers > 500, effect: s => ({ followers: 300, reputation: 8 }), bubble: "THE algorithm has noticed me. Stay calm. STAY CALM." },
    { w: 0.5, text: "Tax refund! The government returns money like a guilty raccoon.",
      cond: s => s.money > 10000, effect: s => ({ moneyPct: 0.03, happiness: 5 }), bubble: "A refund?? Is this legal? Don't answer." },
    { w: 0.5, text: "Your server bill arrives. The cloud is expensive this season.",
      cond: s => s.equipment.server >= 0, effect: s => ({ moneyPct: -0.03, stress: 3 }), bubble: "The cloud is just someone else's very expensive computer." },
    { w: 0.5, text: "You give a talk at a local meetup. Three people stay awake. One claps.",
      cond: s => s.res.reputation > 20, effect: s => ({ reputation: 8, motivation: 5 }), bubble: "Public speaking complete. Hands have stopped shaking." },
    { w: 0.4, text: "Mysterious package arrives: a keyboard keycap shaped like a tiny burger. Morale soars.",
      effect: s => ({ happiness: 7 }), bubble: "Tiny burger keycap. Best purchase past-me ever made." },
    { w: 0.4, cond: s => s.era >= 2, text: "Your AI assistant develops a weird accent. Nobody knows why. Customers love it.",
      effect: s => ({ followers: 80, happiness: 4 }), bubble: "The AI is doing bits now. It's funnier than me. Concerning." },
    { w: 0.4, cond: s => s.era >= 3, text: "Your delivery robot gets a parking ticket. The legal system is confused. So are you.",
      effect: s => ({ money: -200, happiness: 3 }), bubble: "My robot has a record now. They grow up so fast." },
    { w: 0.3, cond: s => s.housing >= 7, text: "A coconut falls on your satellite dish. Island problems are different problems.",
      effect: s => ({ money: -1000, happiness: 2 }), bubble: "Coconut outage. Can't even be mad. It's a coconut." },

    // ---- v3 batch: more chaos, more sinks, more windfalls ----
    { w: 1, text: "Power flickers. Your UPS beeps heroically. You saved everything just in time.",
      effect: s => ({ stress: 4, intelligence: 1 }), bubble: "Ctrl+S is a lifestyle." },
    { w: 0.8, cond: s => !!s.project, text: "Hard drive hiccup! Your project files got corrupted. Some progress lost.",
      effect: s => { if (s.project) s.project.progress *= 0.7; return { stress: 8 }; }, bubble: "Backups. Tomorrow I set up backups. Definitely tomorrow." },
    { w: 0.8, text: "A 'prince' emails offering you $14M. You almost respect the hustle.",
      effect: s => ({ intelligence: 1, happiness: 2 }), bubble: "Nice try, your highness." },
    { w: 0.8, cond: s => s.housing <= 1, text: "There's a rat in the wall. It also works night shifts, apparently.",
      effect: s => ({ happiness: -4, stress: 4 }), bubble: "We're roommates now. His name is Greg. Greg pays no rent." },
    { w: 0.9, cond: s => s.money > 200, text: "Date night! Expensive, occasionally awkward, fundamentally worth it.",
      effect: s => ({ money: -Math.min(s.money * 0.05, WB.GAME.incomePerSec() * 120 + 60), happiness: 12, stress: -6 }), bubble: "Touched grass WITH another human. Achievement-worthy, honestly." },
    { w: 0.8, text: "Your Stack Overflow answer got accepted. Eleven years of reputation in one day.",
      effect: s => ({ reputation: 4, intelligence: 1 }), bubble: "Internet points. The most valuable currency." },
    { w: 0.7, text: "A mentor DMs you unprompted advice. It's actually... good?",
      effect: s => ({ skillXp: { amount: 150 }, motivation: 8 }), bubble: "Wisdom from the void. Saving this screenshot forever." },
    { w: 0.7, text: "Gas station sushi strikes back. Productivity: rotated 90 degrees.",
      effect: s => ({ energy: -18, happiness: -4 }), bubble: "Worth it? No. Will I buy it again? Obviously." },
    { w: 0.7, text: "Social media is down worldwide. Accidental serenity ensues.",
      effect: s => ({ stress: -8, happiness: 4 }), bubble: "The timeline is quiet. Too quiet. ...This is amazing." },
    { w: 0.7, cond: s => s.housing >= 1 && s.housing <= 4, text: "Landlord raises the rent, citing 'market conditions' and 'vibes'.",
      effect: s => ({ money: -WB.GAME.incomePerSec() * 180 - 50, stress: 6 }), bubble: "The market conditions are that he wants more money." },
    { w: 0.7, cond: s => s.stats.followers > 1000, text: "A fan made art of you. It's beautiful. You look 20% cooler than reality.",
      effect: s => ({ happiness: 9, motivation: 6 }), bubble: "Framing it. Sending it to mom. Making it my profile pic." },
    { w: 0.6, cond: s => s.stats.followers > 5000, text: "Sponsored post offer from a sketchy VPN. The money is real, at least.",
      effect: s => ({ money: WB.GAME.incomePerSec() * 200 + 200, reputation: -2 }), bubble: "This video is sponsored by... my rent." },
    { w: 0.6, text: "Conference invite! You go, network aggressively, collect 47 stickers.",
      effect: s => ({ money: -WB.GAME.incomePerSec() * 90 - 40, reputation: 10, energy: -10 }), bubble: "My laptop is now 80% sticker by weight." },
    { w: 0.6, cond: s => s.money > 1000, text: "Charity stream! You raised money for a good cause and your soul.",
      effect: s => ({ money: -WB.GAME.incomePerSec() * 120, reputation: 12, happiness: 10 }), bubble: "Doing good feels good. Who knew. (Everyone. Everyone knew.)" },
    { w: 0.5, text: "An old friend finally repays that loan you'd written off years ago.",
      effect: s => ({ money: WB.GAME.incomePerSec() * 80 + 50, happiness: 6 }), bubble: "He remembered! Faith in humanity: partially restored." },
    { w: 0.6, cond: s => s.equipment.server >= 0, text: "Electricity bill arrives. The server rack has expensive taste.",
      effect: s => ({ money: -WB.GAME.incomePerSec() * 45 - 30, stress: 2 }), bubble: "My electricity bill has its own gravity now." },
    { w: 0.6, cond: s => WB.ASSETS.investTotal(s) > 100, text: "Bull market! Everything with a chart is going up.",
      effect: s => ({ investPct: 0.08, cryptoPct: 0.10, happiness: 4 }), bubble: "Green everywhere. I am a genius (market conditions)." },
    { w: 0.6, cond: s => WB.ASSETS.investTotal(s) > 100, text: "Bear market. The charts have chosen violence.",
      effect: s => ({ investPct: -0.08, cryptoPct: -0.10, stress: 5 }), bubble: "Zooming out until the chart looks fine. Zooming... still bad." },
    { w: 0.5, cond: s => !!s.assets.life.espresso, text: "The espresso machine made a sound machines should not make. Repairs required.",
      effect: s => ({ money: -150, happiness: -3 }), bubble: "Not the espresso machine. Take the servers. TAKE THE SERVERS." },
    { w: 0.5, cond: s => !!s.assets.life.yacht, text: "Yacht maintenance bill arrives. Barnacles, apparently, are expensive.",
      effect: s => ({ money: -WB.GAME.incomePerSec() * 150 - 1000, happiness: 2 }), bubble: "A boat is a hole in the water you throw money into. Worth it." },
    { w: 0.5, cond: s => !!(s.assets.life.hatchback || s.assets.life.sportscar || s.assets.life.supercar), text: "The car needs a service. The mechanic sucked air through his teeth. That's never cheap.",
      effect: s => ({ money: -WB.GAME.incomePerSec() * 60 - 100, stress: 3 }), bubble: "He said 'while we're in there'. My wallet flinched." },
    { w: 0.4, cond: s => !!s.assets.life.art, text: "Your art piece was featured in a magazine. Prints are selling.",
      effect: s => ({ money: WB.GAME.incomePerSec() * 100 + 500, reputation: 8 }), bubble: "Three lines on canvas. Critics love it. I love it. We've all agreed to love it." },
    { w: 0.4, cond: s => !!s.assets.life.jet, text: "Jet fuel prices spiked. Flying anyway. Some habits are non-negotiable.",
      effect: s => ({ money: -WB.GAME.incomePerSec() * 300 - 5000, reputation: 4 }), bubble: "The WiFi at 40,000 feet costs WHAT now?" },
    { w: 0.4, cond: s => Object.keys(s.assets.staff).length > 0, text: "Team offsite! Trust falls, lukewarm pizza, one genuinely good idea.",
      effect: s => ({ money: -WB.GAME.incomePerSec() * 100 - 80, happiness: 6, motivation: 8 }), bubble: "We aligned our synergies. I hate that I know what that means now." },
    { w: 0.5, text: "You reorganized your desk. Productivity feels +200%. Is probably +2%.",
      effect: s => ({ motivation: 6, happiness: 3 }), bubble: "A clean desk is a clean mind. My mind: also has 47 tabs open." },
    { w: 0.5, cond: s => s.era >= 2, text: "Your AI assistant unionized with the smart fridge. They have demands.",
      effect: s => ({ happiness: 4, stress: 3 }), bubble: "The fridge wants dental. It doesn't have teeth. We're in negotiations." },
    { w: 0.4, cond: s => s.era >= 4, text: "Mars office reports a dust storm delayed the standup. By four minutes. Of light lag.",
      effect: s => ({ happiness: 3 }), bubble: "Interplanetary meetings. Still could've been an email." },
  ];

  // ---------- Scheduling / resolution ----------
  function pickEvent(s) {
    // ~25% chance of major event when one is eligible
    const majors = MAJOR.filter(e => (!e.cond || e.cond(s)) && !WB.GAME.onCooldown(e.id));
    if (majors.length && WB.chance(0.42)) {
      return { kind: "major", ev: WB.pick(majors) };
    }
    const minors = MINOR.filter(e => !e.cond || e.cond(s));
    if (!minors.length) return null;
    let total = 0;
    minors.forEach(e => total += e.w);
    let r = Math.random() * total;
    for (const e of minors) {
      r -= e.w;
      if (r <= 0) return { kind: "minor", ev: e };
    }
    return { kind: "minor", ev: minors[0] };
  }

  return { MAJOR, MINOR, pickEvent, fill };
})();
