/* WiFi Billionaire — dynamic thought system.
   Template pools × slot fillers × context weighting = thousands of unique thoughts. */
'use strict';

WB.THOUGHTS = (function () {

  // ---------- Slot fillers ----------
  const FILL = {
    coin: ["DogeCoin", "MoonShiba", "ElonSparkle", "SafeYachtToken", "QuantumPepe", "BananaChain", "ToTheMarsCoin", "RugPullPro", "HodlMeCloser", "WAGMI Classic", "CtrlAltDefi", "GigaChad Token", "InfiniteMoney v2", "TrustMeBro Coin", "YOLOswap", "Web5Coin", "PonziNotAPonzi", "StonkCoin", "LamboFund", "CryptoKitten Gold", "GrandmaCoin", "SqueakPay", "VibeChain", "404Coin", "DefinitelyNotScam", "MoonMoonMoon", "ZeroDayToken", "FOMOmax"],
    appAdj: ["Uber", "Tinder", "Airbnb", "Netflix", "Spotify", "Duolingo", "LinkedIn", "Shazam", "Venmo", "Strava"],
    appNoun: ["cats", "plants", "naps", "sandwiches", "introverts", "pigeons", "houseplants", "left socks", "awkward silences", "expired coupons", "garden gnomes", "passive-aggressive notes", "lost TV remotes", "office snacks", "grandmas", "haunted printers", "lost AirPods", "parallel parking", "leftover pizza", "stolen pens", "umbrella sharing", "midlife crises", "neighborhood gossip"],
    snack: ["instant ramen", "cold pizza", "energy drink #4", "cereal for dinner", "expired yogurt", "gas station sushi", "microwave burrito", "coffee that's mostly sugar"],
    bug: ["off-by-one error", "race condition", "missing semicolon", "null pointer", "infinite loop", "merge conflict", "cache that never invalidates", "typo in production", "timezone bug", "CSS that only breaks on Tuesdays"],
    platform: ["the algorithm", "the For You page", "the trending tab", "the subreddit", "the comment section", "the group chat", "the Discord"],
    bigco: ["Google", "a FAANG company", "a stealth startup", "some VC fund", "a 19-year-old in a hoodie", "three guys in a garage", "an AI that learned to code"],
    body: ["spine", "wrists", "eyes", "sleep schedule", "posture", "vitamin D levels", "social life"],
    excuse: ["it works on my machine", "it's a feature", "the requirements changed", "mercury is in retrograde", "the intern did it", "legacy code"],
  };
  function fill(t) {
    t = WB.t ? WB.t(t) : t; // translate the TEMPLATE first — slots fill after
    return t.replace(/\{(\w+)\}/g, (m, k) => FILL[k] ? WB.pick(FILL[k]) : m);
  }

  // ---------- Pools (tag → lines). {slot} markers expand combinatorially. ----------
  const POOLS = {
    // Activities
    code: [
      "Hmm… this app might actually work.",
      "This bug has been here for 3 hours.",
      "Why is this API broken again?",
      "This freaking AI won't follow instructions.",
      "Maybe I should build something people actually need.",
      "It compiles. I'm scared.",
      "I'll just fix this one thing first. (3 hours later…)",
      "Tabs or spaces? The eternal war.",
      "I found the bug. It was a {bug}. Of course it was.",
      "Stack Overflow is my real co-founder.",
      "I have 47 browser tabs open and I need all of them.",
      "What if I just rewrite the whole thing? No. NO.",
      "The code works. I don't know why. Don't touch it.",
      "Naming this variable is the hardest part of my day.",
      "An '{appAdj} for {appNoun}' app. That's the one. I can feel it.",
      "My git history is just 'fix', 'fix2', and 'FINAL fix'.",
      "Documentation? I AM the documentation.",
      "Whoever wrote this code should be— oh. It was me.",
      "One more feature and it's done. Famous last words.",
      "The error message is lying to me. I can tell.",
      "I deployed on a Friday. I live dangerously.",
      "When in doubt: {excuse}.",
      "This function is 400 lines long and I'm afraid of it.",
      "TODO: remove this hack. (Written 2 years ago.)",
      "I don't write bugs. I write surprise features.",
      "My code reviews itself. Badly.",
      "If it works on the first try, something is deeply wrong.",
      "Ctrl+Z is my co-pilot.",
    ],
    content: [
      "Smash that like button. Please. I'm begging.",
      "Take 47 of this intro. Nailed it. Probably.",
      "The thumbnail matters more than the video. Sad but true.",
      "{platform} giveth and {platform} taketh away.",
      "Is my personality... content now?",
      "I said 'hey guys' to an empty room again.",
      "Three hours of editing for a 30-second clip. Worth it.",
      "If I whisper 'algorithm' three times, do I go viral?",
      "My ring light costs more than my chair. Priorities.",
      "Day 47 of posting daily. The grind is undefeated.",
      "One more take. Okay five. Okay ten.",
      "My mic costs more than my furniture. Priorities.",
      "Day 47 of posting daily. The grind is undefeated.",
      "Engagement is down 3%. Time to panic professionally.",
      "I need a hook in the first 0.4 seconds. No pressure.",
      "Maybe a video about {appNoun}? The internet loves {appNoun}.",
      "One viral video. That's all I need. Just one.",
      "I just watched my own video. Strong 'who is that guy' energy.",
    ],
    crypto: [
      "This coin definitely looks trustworthy.",
      "Surely buying at the top is a strategy.",
      "I have absolutely no idea what I'm doing.",
      "{coin} is going to the moon. Source: a guy online.",
      "It's not a loss until I sell. Or look at it.",
      "The chart is doing... a thing. Is that good?",
      "Diamond hands. Mostly because I forgot my password.",
      "I'm not addicted. I can stop checking anytime. *checks*",
      "Buy high, sell low. Wait. Other way around.",
      "{coin} dipped 40%. So it's basically on sale.",
      "My portfolio is a rollercoaster with no seatbelt.",
      "Technical analysis: the line went up, so I'm a genius.",
      "Whitepaper? I skimmed the font choices. Looked legit.",
      "If {coin} hits $1 I'm buying a boat. It's at $0.0003.",
      "The dip keeps dipping. Dips all the way down.",
    ],
    ai: [
      "I asked the AI to fix the bug. It deleted the feature.",
      "Prompt engineering is just yelling politely.",
      "The AI agreed with everything I said. Suspicious.",
      "My AI agent hired another AI agent. Should I be worried?",
      "It hallucinated an entire API. Confidently.",
      "I automated my job. Now I manage the automation. Hmm.",
      "The model is 'thinking'. So am I. One of us is faster.",
      "Step 1: AI does the work. Step 2: I take the credit. Step 3: profit.",
      "I said 'don't change anything else.' It changed everything else.",
      "Training data is just the internet's diary.",
      "An AI that automates {appNoun}? Revolutionary. Probably.",
      "The future is here. It's weird and it bills by the token.",
    ],
    gamedev: [
      "It's not a bug, it's emergent gameplay.",
      "The physics engine just launched the player into orbit. Keeping it.",
      "Scope creep? I prefer 'ambition expansion'.",
      "My game is 90% done. Just the last 90% to go.",
      "Playtester feedback: 'it's... a game.' I'll take it.",
      "I spent all day on a door. Game dev is doors.",
      "Just one more particle effect. For balance.",
      "The placeholder art is becoming the final art, isn't it.",
      "Speedrunners will break this in ways I can't imagine.",
      "What if the gnomes... were procedurally generated?",
    ],
    study: [
      "Learning is just downloading skills slowly.",
      "Page 1 of 400. The journey begins.",
      "I understood that sentence. Individually. Not together.",
      "Tutorial hell has excellent WiFi at least.",
      "The more I learn, the more I realize I know nothing. Cool cool cool.",
      "Taking notes I will absolutely never read again.",
      "This 'beginner' course assumes I know quantum physics.",
      "Brain at 98% capacity. Deleting childhood memories to make room.",
    ],
    rest: [
      "Just five more minutes. Or hours.",
      "Sleep is a startup strategy nobody talks about.",
      "Dreaming about spreadsheets again.",
      "Recharging. Like a phone, but with snoring.",
      "The grind respects a good nap. Probably.",
      "My bed and I have a very serious relationship.",
      "zzz... ship it... zzz...",
    ],
    grass: [
      "So this is 'outside'. It has decent graphics.",
      "The sun is just a big lamp with no off switch.",
      "Grass confirmed. Surprisingly grassy.",
      "Birds are just push notifications from nature.",
      "Fresh air. Should I monetize this?",
      "My eyes are doing that 'focusing on far things' feature again.",
      "Touching grass as recommended by my last 4 group chats.",
    ],
    idle: [
      "I should be doing something productive right now.",
      "Staring at the wall. Strategically.",
      "My to-do list has a to-do list.",
      "Is procrastination a skill? Asking for me.",
      "What if I just... started a podcast instead.",
      "The WiFi is the only thing in this room that's faithful.",
      "Somewhere, a 19-year-old just made my net worth in an afternoon.",
      "I wonder what my leaderboard rank is. I wonder if I should care. I do.",
      "One more reorg of the desktop icons and THEN I'll work.",
      "I should text a friend. Do I have friends? I have a friends list.",
      "If overthinking were billable I'd be retired.",
      "New plan: same as the old plan but with more confidence.",
      "Refactoring my whole life. Starting tomorrow. Probably.",
      "I named my plant after a tax loophole. We're both thriving.",
      "Brain: 1 open tab of work, 47 of doom.",
      "The grind doesn't stop. Mostly because I never started.",
      "Is it 'rise and grind' or 'rise and find a reason to lie back down'?",
      "I bought a course on focus. Haven't watched it. Ironic.",
      "Every billionaire started somewhere. Usually with more than this.",
      "My origin story is going to be SO good in the documentary.",
    ],
    // ---- new situational pools ----
    leaderboard: [
      "Just need to pass ONE more name on the leaderboard.",
      "Somebody named xX_Tycoon_Xx is ahead of me. Unacceptable.",
      "Rank is temporary. Screenshotting rank #1 is forever.",
      "I refreshed the leaderboard again. I have a problem.",
    ],
    friends: [
      "I should bail my buddy out of jail. Or not. Drama is content.",
      "A friend sent me money once. I framed the notification.",
      "Networking is just friendship with a spreadsheet.",
      "My friends list is my real net worth. (The money helps though.)",
    ],
    smelly: [
      "I can smell the ambition. And also myself. Mostly myself.",
      "Day three in this hoodie. We've bonded.",
      "Hygiene is a Q2 problem.",
      "The chair and I have unresolved issues.",
    ],

    // Energy / mood
    tired: [
      "I need sleep.",
      "Coffee is basically a skill at this point.",
      "I forgot what grass looks like.",
      "My {body} filed a formal complaint.",
      "Blinking feels like a workout.",
      "I've been awake so long I can hear colors.",
      "Running on {snack} and pure delusion.",
      "Sleep is for people without deadlines.",
      "My eye is twitching in morse code. It says 'help'.",
    ],
    energized: [
      "I could code a whole operating system right now.",
      "Today is a 10x day. I can feel it.",
      "Fully charged. Let's break something. Then fix it.",
      "Who needs coffee when you have unjustified confidence?",
    ],
    stressed: [
      "Everything is fine. EVERYTHING. IS. FINE.",
      "My stress has stress.",
      "I'm not panicking, I'm prioritizing loudly.",
      "Deep breaths. In, out, refresh dashboard, repeat.",
      "The deadline and I are no longer on speaking terms.",
    ],
    happy: [
      "Life's actually pretty good right now.",
      "Is this... work-life balance? Weird feeling.",
      "Note to self: remember this moment when servers crash.",
    ],
    sad: [
      "Is this all worth it? ...yeah probably.",
      "Today's vibe: error 404, motivation not found.",
      "Even my houseplant looks disappointed in me.",
    ],

    // Wealth tiers
    broke: [
      "Maybe this next project changes everything.",
      "Current bank account status: concerning.",
      "I can afford {snack} OR rent. Choices.",
      "Negative balance is just a high score in reverse.",
      "Investors keep not discovering me. Rude.",
      "One day this struggle will be a great podcast story.",
      "My budget app sent me a get-well-soon card.",
      "Rich people skip breakfast too. We're basically the same.",
    ],
    gettingby: [
      "Not rich. Not broke. Aggressively medium.",
      "I bought name-brand cereal today. Growth.",
      "The numbers are going up. Slowly. But up.",
      "Almost out of the danger zone. Almost.",
    ],
    comfortable: [
      "I no longer check the price of coffee. Power move.",
      "Savings account? More like a tiny dragon hoard.",
      "I could buy a slightly better chair. Living large.",
      "Remember being broke? My spine does.",
    ],
    rich: [
      "I spent more on this chair than my first apartment.",
      "I should probably hire someone.",
      "Money solves problems. It creates new ones too.",
      "I have a guy for that now. I have guys.",
      "My accountant called me 'an interesting case'.",
      "Is it weird to name your money? Asking for Greg. Greg is my money.",
      "I tipped someone 100% today just to watch their face.",
    ],
    billionaire: [
      "I could buy {bigco}. Should I? No. ...Should I though?",
      "My net worth has a seasonal climate.",
      "Somewhere, my old laptop is very proud of me.",
      "Money stopped being numbers. It's just weather now.",
      "I bought an island and I still check WiFi speed first.",
      "Remember the bedroom at mom's? The WiFi was terrible. Character building.",
    ],

    // Events / outcomes
    success: [
      "I can't believe people actually paid for this.",
      "This is getting interesting.",
      "Wait, it worked? IT WORKED!",
      "Screenshot. Frame it. This is history.",
      "First they ignore you, then they subscribe.",
      "Mom, I'm basically famous in a very specific niche.",
    ],
    fail: [
      "Well… that was a terrible idea.",
      "Back to the drawing board.",
      "Failure is data. Painful, expensive data.",
      "I'll laugh about this someday. Not today. Someday.",
      "The market has spoken. Rudely.",
      "Adding this to my 'learning experiences' folder. It's a big folder.",
    ],
    levelup: [
      "I felt my brain grow. Slightly.",
      "Skill acquired. Confidence: dangerously increased.",
      "Level up! The grind is grinding.",
    ],

    haveCat: [
      "The cat walked across my keyboard and honestly improved the code.",
      "The cat judges my work. The cat is usually right.",
      "I work for the cat now. The empire is a side effect.",
      "Cat sat on the warm laptop again. Fair. It IS the best seat.",
    ],
    haveStaff: [
      "I said 'circle back' unironically today. Who have I become?",
      "My team is great. I still check everything at 2 AM. Trust, but verify.",
      "Payroll cleared. Being the boss is just paying people and vibes.",
    ],

    // Manual action reactions
    act_video: [
      "Aaaand uploaded. Time to refresh the stats every 4 seconds.",
      "The thumbnail has a red arrow pointing at nothing. Perfection.",
      "Posted. Now we wait. And refresh. And wait. And refresh.",
      "If this flops I'm blaming {platform}.",
    ],
    act_ai: [
      "Training started. The GPU sounds like a hairdryer with ambitions.",
      "Epoch 1 of many. Believe in the loss curve.",
      "The fans are screaming. That means it's working. Probably.",
      "Please learn the right thing this time. Please.",
    ],
    act_scan: [
      "Scanning the charts. The charts are scanning me back.",
      "Somewhere in this noise is a signal. Allegedly.",
      "Time to find a coin before the group chat does.",
    ],
    act_jam: [
      "48 hours. One game. Zero sleep scheduled.",
      "Game jam time. The theme is panic.",
      "Step 1: huge scope. Step 2: regret. Step 3: ship anyway.",
    ],
    act_social: [
      "Crafting the perfect post. Deleting it. Posting the first draft.",
      "This take is either genius or career-ending. Posting.",
      "Engagement farming? No no. 'Community building.'",
    ],
    act_coffee: [
      "Ah. Liquid productivity.",
      "Coffee number four? Who's counting. Not my heart.",
      "The beans understand me.",
      "Instant focus. Side effects: vibrating slightly.",
    ],

    // Housing flavor
    housing0: [
      "Mom says dinner's ready. The empire can wait 20 minutes.",
      "My childhood posters are watching me build the future.",
      "Step 1 of the master plan: leave this bedroom.",
      "If I make it big I'm buying mom a house first.",
      "The WiFi password is still 'family123'. The shame fuels me.",
    ],
    housing1: [
      "My own place. It's tiny. It's mine. It's tinily mine.",
      "I can hear my neighbor's alarm. We're a team now.",
      "The whole apartment is one room. Efficient. Cozy. Legally a closet.",
    ],
    housingMid: [
      "An actual office room. I've made it. (Don't check my bank account.)",
      "I bought a plant. We're both trying our best.",
      "This view beats the parking lot wall. Low bar. Cleared it.",
    ],
    housingHigh: [
      "The penthouse echo is my new coworker.",
      "I have a fridge for just drinks. JUST DRINKS.",
      "My commute is an elevator. A fancy one.",
    ],
    housingTop: [
      "Island WiFi: excellent. Island neighbors: crabs.",
      "My campus has a smoothie bar. I regret nothing.",
      "Sometimes I video call mom from the beach. She still asks if I eat enough.",
    ],

    // Trait flavor
    t_workaholic: ["Breaks are for people with finished products.", "Rest day? Never heard of her.", "I'll sleep when the backlog is empty. So... never."],
    t_lazy: ["I'll do it tomorrow. Tomorrow-me is very reliable.", "Why stand when you can sit? Why sit when you can lie down?"],
    t_cryptoaddict: ["Just one more chart check. The last one. Promise.", "I dreamt in candlesticks again."],
    t_optimistic: ["Today's the day. I can feel it. (Day 312 of feeling it.)", "Every crash is just a discount on the future."],
    t_risktaker: ["Safe bets are for people with backup plans.", "All in. Again. It's a lifestyle."],
    t_frugal: ["Why buy new when slightly broken exists?", "That's not dust on my laptop, that's patina."],
    t_visionary: ["In 10 years everyone will do this. I'm just early.", "They laughed at my {appAdj} for {appNoun} idea. They'll see."],

    // Era flavor
    era0: ["Apps. Apps everywhere. I should make apps.", "Everyone's building a social network. What if... one more?"],
    era1: ["Everyone's a creator now. Even my dentist has a vlog.", "Attention is the new oil. I'm drilling."],
    era2: ["The AI gold rush. I'm selling shovels. Smart shovels.", "My toaster got a funding round. The bar is on the floor."],
    era3: ["My robot vacuums AND judges my life choices.", "Robots took the boring jobs. The meetings remain. Cruel."],
    era4: ["Earth office or Mars office today? Decisions.", "The space WiFi has 4-minute lag. Still better than 2015."],
  };

  // ---------- Context-weighted selection ----------
  let recent = [];
  function remember(t) {
    recent.push(t);
    if (recent.length > 12) recent.shift();
  }

  function buildPool(s, incomePerSec) {
    const w = []; // [line, weight]
    const add = (tag, weight) => {
      const p = POOLS[tag];
      if (p) p.forEach(line => w.push([line, weight]));
    };

    // Activity (dominant)
    add(s.focus, 5);
    if (!WB.DATA.ACTIVITIES[s.focus]) add("idle", 5);

    // Energy / mood
    if (s.res.energy < 28) add("tired", 4);
    else if (s.res.energy > 85) add("energized", 1.5);
    if (s.res.stress > 70) add("stressed", 3);
    if (s.res.happiness > 80) add("happy", 1.5);
    if (s.res.happiness < 25) add("sad", 2);

    // Wealth
    const m = s.money;
    if (m < 500) add("broke", 3);
    else if (m < 20000) add("gettingby", 2);
    else if (m < 1e6) add("comfortable", 2);
    else if (m < 1e9) add("rich", 2.5);
    else add("billionaire", 3);

    // Housing
    if (s.housing === 0) add("housing0", 2);
    else if (s.housing === 1) add("housing1", 1.5);
    else if (s.housing <= 4) add("housingMid", 1);
    else if (s.housing <= 6) add("housingHigh", 1);
    else add("housingTop", 1.2);

    // Traits
    s.traits.forEach(t => add("t_" + t, 1.5));

    // Situational
    if (s.housing >= 1) add("haveCat", 0.7);
    if (s.assets && Object.keys(s.assets.staff || {}).length > 0) add("haveStaff", 1);
    if (s.res.hygiene != null && s.res.hygiene < 35) add("smelly", 2);
    if (s.money >= 1e5) add("leaderboard", 0.8);
    add("friends", 0.5);

    // Era
    add("era" + s.era, 1);

    return w;
  }

  function next(s, incomePerSec) {
    const pool = buildPool(s, incomePerSec);
    // weighted pick avoiding recent repeats
    for (let attempt = 0; attempt < 14; attempt++) {
      let total = 0;
      pool.forEach(p => total += p[1]);
      let r = Math.random() * total;
      let line = pool[0][0];
      for (const [l, wt] of pool) {
        r -= wt;
        if (r <= 0) { line = l; break; }
      }
      const filled = fill(line);
      if (!recent.includes(filled) || attempt === 13) {
        remember(filled);
        return filled;
      }
    }
    return fill(WB.pick(pool)[0]);
  }

  // Direct reaction to a specific moment (event, project result, level up…)
  function react(tag) {
    const p = POOLS[tag];
    if (!p) return null;
    const t = fill(WB.pick(p));
    remember(t);
    return t;
  }

  return { next, react, fill, POOLS };
})();
