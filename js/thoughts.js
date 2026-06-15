/* WiFi Billionaire — dynamic thought system.
   Template pools × slot fillers × context weighting = thousands of unique thoughts. */
'use strict';

WB.THOUGHTS = (function () {

  // ---------- Slot fillers ----------
  const FILL = {
    coin: ["DogeCoin", "MoonShiba", "ElonSparkle", "SafeYachtToken", "QuantumPepe", "BananaChain", "ToTheMarsCoin", "RugPullPro", "HodlMeCloser", "WAGMI Classic", "CtrlAltDefi", "GigaChad Token", "InfiniteMoney v2", "TrustMeBro Coin", "YOLOswap", "Web5Coin", "PonziNotAPonzi", "StonkCoin", "LamboFund", "CryptoKitten Gold", "GrandmaCoin", "SqueakPay", "VibeChain", "404Coin", "DefinitelyNotScam", "MoonMoonMoon", "ZeroDayToken", "FOMOmax"],
    appAdj: ["Uber", "Tinder", "Airbnb", "Netflix", "Spotify", "Duolingo", "LinkedIn", "Shazam", "Venmo", "Strava"],
    appNoun: ["cats", "plants", "naps", "sandwiches", "introverts", "pigeons", "houseplants", "left socks", "awkward silences", "expired coupons", "garden gnomes", "passive-aggressive notes", "lost TV remotes", "office snacks", "grandmas", "haunted printers", "lost AirPods", "parallel parking", "leftover pizza", "stolen pens", "umbrella sharing", "midlife crises", "neighborhood gossip"],
    snack: ["instant ramen", "cold pizza", "energy drink #4", "cereal for dinner", "expired yogurt", "gas station sushi", "microwave burrito", "coffee that's mostly sugar", "vending machine crackers", "leftover takeout of unknown origin", "a sad desk salad", "the last protein bar"],
    bug: ["off-by-one error", "race condition", "missing semicolon", "null pointer", "infinite loop", "merge conflict", "cache that never invalidates", "typo in production", "timezone bug", "CSS that only breaks on Tuesdays", "rogue console.log", "dependency from 2014", "promise that never resolves", "floating point rounding error"],
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
      "I commented out the bug instead of fixing it. Balance restored.",
      "The staging server works. Production is just staging with anxiety.",
      "I refactored for two days and changed zero behavior. Art.",
      "Found a {bug}. Pretended I didn't. Found it again.",
      "Semicolons are optional until suddenly they aren't.",
      "My unit tests test that my unit tests run. That's it.",
      "Three monitors and I still alt-tab to the wrong one.",
      "Reading my own code from last month like it's a stranger's ransom note.",
      "I'll add error handling later. (Narrator: he would not.)",
      "The linter and I are in a committed, unhappy relationship.",
      "I solved it in the shower. Forgot it before I dried off.",
      "Copy. Paste. Pray. The holy trinity of debugging.",
      "This regex worked once and now I worship it in fear.",
      "Rubber duck debugging, except the duck judges me.",
      "I named it 'temp'. It has been in production for a year.",
      "Why does it break only when the boss is watching?",
      "Just pushed straight to main. I am the chaos.",
      "Indentation is a personality test and I'm failing it.",
      "Compiling. The one time I'm allowed to do nothing.",
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
      "The comments section is a war zone and I started it.",
      "Subscribed at 999. Refreshing for that sweet 1K.",
      "I clickbait myself in the mirror every morning.",
      "Filming a 'day in my life' where nothing happens.",
      "Watch time is down. My self-esteem is also watch time apparently.",
      "{platform} buried my best work and boosted my worst. Classic.",
      "A brand wants to sponsor me. For free product. Groundbreaking.",
      "I rehearsed 'being spontaneous' for an hour.",
      "Reading 'first' in my comments like it's a Nobel prize for someone.",
      "Going live to four viewers, two of which are me on other devices.",
      "The trend dies the moment I learn the dance. Every time.",
      "I deleted the video with 12 views. The shame was louder.",
      "Posting at 'peak engagement hours' which is apparently 3 AM.",
      "My retention graph looks like a ski jump. Downhill.",
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
      "I aped into {coin} because the logo was a frog. No regrets. Some regrets.",
      "The dev wallet just moved. That's fine. That's normal. That's fine.",
      "{coin} got rugged. I'm calling it a 'forced long-term hold'.",
      "I set a stop-loss and then emotionally overrode it. Twice.",
      "My cost basis is a state of mind at this point.",
      "Wen moon? Soon. (It's always soon.)",
      "I explained {coin} to my mom. Now she's worried and I'm broke.",
      "Just staked my rent for 4% APY. Bold. Stupid. Bold.",
      "The whale dumped. The whale always dumps on me specifically.",
      "I'm early. I'm always early. Painfully, broke-ly early.",
      "Green candles cure my depression. Red ones cause it.",
      "I'd sell but then I'd have to admit it was real money.",
      "Liquidated at 3 AM. The chart waited until I slept. Coward.",
      "DYOR: did one Reddit search, felt informed.",
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
      "I gave it the whole codebase. It thanked me and deleted a folder.",
      "The token bill came in. I need an AI to process the grief.",
      "'As an AI language model' — buddy, just answer the question.",
      "I told it to be concise. It wrote me an essay on concision.",
      "It cited three sources. None of them exist. Confidently.",
      "My prompt is longer than the thing I'm asking it to write.",
      "Reinforcement learning from my disappointment, basically.",
      "The chatbot apologized, then made the exact same mistake. Relatable.",
      "I'm not scared of AI taking my job. I'm scared of explaining the job to it.",
      "Vibe coding: I have no idea what it wrote but it runs.",
      "Asked for {appAdj} for {appNoun}. It built it. It's terrible. It's mine.",
      "It learned my coding style. Now it makes my bugs faster.",
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
      "The tutorial is longer than the game. Working as intended.",
      "I balanced the difficulty. Now nobody can beat level 2. Whoops.",
      "Day-one patch is just shipping the game twice.",
      "I added a cosmetic shop before I added the fun.",
      "The save system corrupts saves. It's very thorough about it.",
      "Wishlists are up by three. We're basically a AAA studio.",
      "My NPC pathfinding sends them off cliffs. Lemming mode.",
      "Crunch is just game jam with worse vibes.",
      "I spent six hours on a loading screen tip nobody reads.",
      "The collision box is a suggestion, apparently.",
      "Procedural generation made a level that's just one long hallway.",
      "Adding lens flare so it looks expensive.",
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
      "I highlighted the whole page. Now nothing is highlighted.",
      "Watched the lecture at 2x speed. Understood it at 0.5x.",
      "Bought the textbook, read the back cover, feel scholarly.",
      "I've rewatched this tutorial four times. The code still hates me.",
      "Flashcards everywhere. Knowledge: debatable.",
      "Re-reading the same paragraph until the words lose meaning.",
      "Certificate of completion: my only personality trait now.",
      "I learn best under deadline-induced terror, apparently.",
      "Skipped the fundamentals. The fundamentals found me anyway.",
    ],
    rest: [
      "Just five more minutes. Or hours.",
      "Sleep is a startup strategy nobody talks about.",
      "Dreaming about spreadsheets again.",
      "Recharging. Like a phone, but with snoring.",
      "The grind respects a good nap. Probably.",
      "My bed and I have a very serious relationship.",
      "zzz... ship it... zzz...",
      "A power nap. A 4-hour power nap.",
      "I'll just rest my eyes and review the backlog mentally. zzz.",
      "Sleep debt accruing interest. Compound, probably.",
      "Do Not Disturb is on. So is my conscience, but quieter.",
      "Resting is productive. I read that on a pillow.",
      "The hustle culture didn't account for how cozy blankets are.",
    ],
    grass: [
      "So this is 'outside'. It has decent graphics.",
      "The sun is just a big lamp with no off switch.",
      "Grass confirmed. Surprisingly grassy.",
      "Birds are just push notifications from nature.",
      "Fresh air. Should I monetize this?",
      "My eyes are doing that 'focusing on far things' feature again.",
      "Touching grass as recommended by my last 4 group chats.",
      "A dog looked at me. Best meeting I've had all week.",
      "The outside has no dark mode. My eyes are filing a ticket.",
      "Vitamin D, the original free download.",
      "Real-world graphics are unreal. Who's the dev?",
      "I tried to swipe the clouds. Nothing happened. Rude.",
      "Wind has no loading screen. Impressive engine.",
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
      "I opened the fridge for the fourth time. Still the same fridge.",
      "Productivity tip: stare at the wall until inspiration files for unemployment.",
      "I alphabetized my apps instead of using any of them.",
      "Should I work? Yes. Will I? That's a Q3 decision.",
      "Doom-scrolling, but make it 'market research'.",
      "I have eleven half-finished projects and one finished excuse.",
      "Inbox zero is a myth invented to torment me.",
      "I'll start when the playlist is perfect. The playlist is never perfect.",
      "Cleaning my desk counts as building an empire, right?",
      "Just gonna check one thing. Forty minutes ago.",
      "That car's been parked outside for a while. ...Probably nothing.",
      "Did I clear the browser history? I cleared the browser history. Did I?",
      "Every time a siren goes by I do a quick mental audit. We're fine. We're fine.",
      "I haven't done anything wrong. Recently. That I'm aware of.",
      "The 'heat' is just a meter, right? Right? It can't actually find me.",
      "I keep my phone face-down now. Old habits.",
      "If anyone asks, I was home all night. With the cat. The cat will vouch.",
      "Black SUV. Tinted windows. Slow roll. ...Or just a rideshare. Probably.",
      "I should lay low for a bit. Right after this one last thing.",
      "Knock at the door. I am not expecting a door knock. I do not breathe.",
      "Cash only from now on. Nothing says 'paper trail' like a paper trail.",
      "I deleted the app. Then reinstalled it. The heat doesn't sleep, neither do I.",
      "Did they see my face? They didn't see my face. Did they see my face.",
    ],
    // ---- new situational pools ----
    leaderboard: [
      "Just need to pass ONE more name on the leaderboard.",
      "Somebody named xX_Tycoon_Xx is ahead of me. Unacceptable.",
      "Rank is temporary. Screenshotting rank #1 is forever.",
      "I refreshed the leaderboard again. I have a problem.",
      "Whoever's at #1 is going down. Today. Or tomorrow. This decade.",
      "I'm not competitive, I just need to crush everyone above me.",
      "Top 10! Time to gloat to absolutely no one.",
      "Someone passed me while I slept. They will pay. Slowly.",
      "The leaderboard is just a high score with extra ego damage.",
    ],
    friends: [
      "I should bail my buddy out of jail. Or not. Drama is content.",
      "A friend sent me money once. I framed the notification.",
      "Networking is just friendship with a spreadsheet.",
      "My friends list is my real net worth. (The money helps though.)",
      "Adam texted again. Man genuinely believes in me. 🐐",
      "Adam said when I make it we're getting a yacht. I'm holding him to it.",
      "Whatever happens, at least I've got Adam. Realest dude alive.",
      "Adam doesn't even want anything from me. He just checks in. Wild.",
      "My contacts list is 80% delivery drivers I'm on a first-name basis with.",
      "Adam offered to be my CFO. He cannot do math. He's hired anyway.",
      "A real friend helps you move. A real real friend helps you move servers.",
      "I owe Adam like nine favors and one kidney.",
      "Group chat went quiet. Did I say the wrong thing again? Probably.",
      "Adam knows a guy who knows a guy. I don't ask about the guys.",
      "If it all goes sideways, Adam said he'll wire the bail. Real ones.",
      "We swore we'd never snitch. Mostly about the group project in 9th grade.",
      "Adam deleted the messages 'just in case'. In case of what, Adam?",
    ],
    smelly: [
      "I can smell the ambition. And also myself. Mostly myself.",
      "Day three in this hoodie. We've bonded.",
      "Hygiene is a Q2 problem.",
      "The chair and I have unresolved issues.",
      "I think the chair is starting to smell like ambition. Or feet.",
      "Shower? My code doesn't compile when I'm clean. Superstition.",
      "I reapplied deodorant instead of showering. Innovation.",
      "The room has a vibe now. The vibe is 'concerning'.",
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
      "I just nodded off mid-keystroke and typed a haiku of 'j'.",
      "My {body} and I are no longer on speaking terms.",
      "Is the screen blurry or is that just my soul leaving.",
      "I powered through on {snack}. The 'power' is a generous word.",
      "Three energy drinks deep and I'm somehow MORE tired.",
      "I yawned so hard I think I saw the future. It was also tired.",
      "Sleep when you're dead, they said. I'm testing the timeline.",
      "I read the same line nine times. The line won.",
    ],
    energized: [
      "I could code a whole operating system right now.",
      "Today is a 10x day. I can feel it.",
      "Fully charged. Let's break something. Then fix it.",
      "Who needs coffee when you have unjustified confidence?",
      "I'm in the zone. The zone has no exits. I live here now.",
      "Energy at 100%. Wisdom at 12%. Let's gooo.",
      "I could refactor the universe. Starting with this function.",
      "Inbox: cleared. Bugs: slain. Ego: inflating.",
      "I woke up and chose violence against my to-do list.",
    ],
    stressed: [
      "Everything is fine. EVERYTHING. IS. FINE.",
      "My stress has stress.",
      "I'm not panicking, I'm prioritizing loudly.",
      "Deep breaths. In, out, refresh dashboard, repeat.",
      "The deadline and I are no longer on speaking terms.",
      "I have 200 unread emails and a heartbeat to match.",
      "This is fine. The room's on fire but the metaphor is fine.",
      "I made a to-do list to manage my panic. Now I'm panicking about the list.",
      "My calendar is just red blocks screaming at each other.",
      "If I ignore the notification, does the problem cease to exist? No?",
      "Stress-eating {snack} while stress-reading the dashboard.",
      "Everything is on fire and I'm out of fire metaphors.",
      "I'd cry but I scheduled that for never.",
    ],
    happy: [
      "Life's actually pretty good right now.",
      "Is this... work-life balance? Weird feeling.",
      "Note to self: remember this moment when servers crash.",
      "I caught myself humming. Who is this well-adjusted person?",
      "Everything's working and I'm suspicious but grateful.",
      "Today the algorithm liked me back. We're in love.",
      "Good day. Wrote 'good day' in my journal. Felt good. Day.",
    ],
    sad: [
      "Is this all worth it? ...yeah probably.",
      "Today's vibe: error 404, motivation not found.",
      "Even my houseplant looks disappointed in me.",
      "I miss who I was before I checked the analytics.",
      "Maybe I peaked in the planning phase.",
      "The silence after a flop is its own kind of loud.",
      "I'd ask for a sign but my WiFi's the only thing that answers.",
      "Some days the grind grinds back.",
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
      "I returned the bottles for the deposit. A businessman, technically.",
      "My card got declined buying {snack}. Humbling cuisine.",
      "I'm not broke, I'm pre-rich. There's a difference. (There isn't.)",
      "Checked my balance, laughed, closed the app. Therapy.",
      "Free trial of everything is just my lifestyle now.",
      "I ate dinner at the free-sample station. Curated tasting menu.",
      "Ramen again. The chef recommends it. The chef is me. I have no money.",
    ],
    gettingby: [
      "Not rich. Not broke. Aggressively medium.",
      "I bought name-brand cereal today. Growth.",
      "The numbers are going up. Slowly. But up.",
      "Almost out of the danger zone. Almost.",
      "I added guacamole and didn't flinch. New me.",
      "Bought a couch that didn't come from the curb. Luxury.",
      "I have a savings account now. It has, like, three dollars. But still.",
      "Paid rent on time AND ate. Look at me, multitasking adulthood.",
    ],
    comfortable: [
      "I no longer check the price of coffee. Power move.",
      "Savings account? More like a tiny dragon hoard.",
      "I could buy a slightly better chair. Living large.",
      "Remember being broke? My spine does.",
      "I bought the brand-name {snack}. Tastes like progress.",
      "Two-day shipping? I'm basically royalty.",
      "I left a tip without doing the math first. Reckless. Rich. Reckless.",
      "Emergency fund: funded. Emergencies: cordially invited.",
    ],
    rich: [
      "I spent more on this chair than my first apartment.",
      "I should probably hire someone.",
      "Money solves problems. It creates new ones too.",
      "I have a guy for that now. I have guys.",
      "My accountant called me 'an interesting case'.",
      "Is it weird to name your money? Asking for Greg. Greg is my money.",
      "I tipped someone 100% today just to watch their face.",
      "I bought the building so I wouldn't have to find parking.",
      "My couch has more square footage than my old apartment.",
      "I have a guy whose only job is knowing other guys.",
      "I asked the price and the salesperson laughed. We both knew.",
      "I named a wing of something after myself. A small wing. Still.",
      "My second car is for when the first car is sad.",
      "I keep losing track of which subscriptions I own versus which I bought.",
      "Booked a private chef to make me {snack}. Irony tastes expensive.",
      "I don't read prices anymore. I read the salesperson's hope.",
      "Bought art I don't understand to confuse people richer than me.",
      "My watch tells time and also tells everyone I'm insufferable.",
      "I flew somewhere for lunch. The lunch was fine. The point was the flying.",
    ],
    billionaire: [
      "I could buy {bigco}. Should I? No. ...Should I though?",
      "My net worth has a seasonal climate.",
      "Somewhere, my old laptop is very proud of me.",
      "Money stopped being numbers. It's just weather now.",
      "I bought an island and I still check WiFi speed first.",
      "Remember the bedroom at mom's? The WiFi was terrible. Character building.",
      "I tried to buy {bigco}. They said no. I respect the boundary. Barely.",
      "My foundation has a foundation. Foundations all the way down.",
      "I forgot how many houses I own. My assistant has a spreadsheet.",
      "A senator returned my call in eleven seconds. New record.",
      "I rounded my net worth and lost a small country's GDP.",
      "I have a rocket. It's mostly for the group chat reaction.",
      "Money is a high score now. I'm just farming the leaderboard of life.",
      "I bought a vineyard so my water has a backstory.",
      "I employ more people than my hometown has residents. Weird.",
      "I gave a museum a painting. Now I'm a 'patron'. I just like the word.",
    ],

    // Events / outcomes
    success: [
      "I can't believe people actually paid for this.",
      "This is getting interesting.",
      "Wait, it worked? IT WORKED!",
      "Screenshot. Frame it. This is history.",
      "First they ignore you, then they subscribe.",
      "Mom, I'm basically famous in a very specific niche.",
      "It scaled! Quick, act like I planned for this!",
      "The notification said money came IN. In! Unprecedented.",
      "A stranger thanked me for my work. I'm not crying, you are.",
      "I refreshed the metrics and they went UP. Witchcraft.",
      "Somebody copied my idea. I've truly arrived.",
    ],
    fail: [
      "Well… that was a terrible idea.",
      "Back to the drawing board.",
      "Failure is data. Painful, expensive data.",
      "I'll laugh about this someday. Not today. Someday.",
      "The market has spoken. Rudely.",
      "Adding this to my 'learning experiences' folder. It's a big folder.",
      "It was a {bug} all along. It's always a {bug}.",
      "We don't say 'failed'. We say 'pivoted aggressively'.",
      "The users have spoken and they spoke with the unsubscribe button.",
      "Plan B is now plan A. Plan A is in the 'learnings' folder.",
      "I'll blame {excuse} and try again at dawn.",
    ],
    levelup: [
      "I felt my brain grow. Slightly.",
      "Skill acquired. Confidence: dangerously increased.",
      "Level up! The grind is grinding.",
      "New skill unlocked. Old problems, meet new arrogance.",
      "I leveled up. My imposter syndrome leveled up too. Fair fight.",
      "Ding! That's the sound of marginally less incompetence.",
    ],

    haveCat: [
      "The cat walked across my keyboard and honestly improved the code.",
      "The cat judges my work. The cat is usually right.",
      "I work for the cat now. The empire is a side effect.",
      "Cat sat on the warm laptop again. Fair. It IS the best seat.",
      "The cat knocked my coffee off the desk. A code review of sorts.",
      "I explain my plans to the cat. The cat has notes. The cat is silent.",
      "Cat hairball at 3 AM: nature's stand-up meeting.",
      "I work to afford the cat's lifestyle. Worth it.",
    ],
    haveStaff: [
      "I said 'circle back' unironically today. Who have I become?",
      "My team is great. I still check everything at 2 AM. Trust, but verify.",
      "Payroll cleared. Being the boss is just paying people and vibes.",
      "I scheduled a meeting that should've been an email I also wrote.",
      "Delegating is hard when you secretly want to do everything badly yourself.",
      "My calendar is booked solid with people booking my calendar.",
      "I gave feedback. It was a compliment sandwich with no bread.",
    ],

    // Manual action reactions
    act_video: [
      "Aaaand uploaded. Time to refresh the stats every 4 seconds.",
      "The thumbnail has a red arrow pointing at nothing. Perfection.",
      "Posted. Now we wait. And refresh. And wait. And refresh.",
      "If this flops I'm blaming {platform}.",
      "Hit publish. No backsies. Refreshing now.",
      "The title has three emojis and zero shame.",
    ],
    act_ai: [
      "Training started. The GPU sounds like a hairdryer with ambitions.",
      "Epoch 1 of many. Believe in the loss curve.",
      "The fans are screaming. That means it's working. Probably.",
      "Please learn the right thing this time. Please.",
      "The loss is going down. My electric bill is going up. Balance.",
      "Kicked off training. See you in nine hours and one heart attack.",
    ],
    act_scan: [
      "Scanning the charts. The charts are scanning me back.",
      "Somewhere in this noise is a signal. Allegedly.",
      "Time to find a coin before the group chat does.",
      "If I buy {coin} now and it moons, I'm a genius. If not, I was hacked.",
      "Scanning for the next big thing. It's probably a dog with a hat.",
    ],
    act_jam: [
      "48 hours. One game. Zero sleep scheduled.",
      "Game jam time. The theme is panic.",
      "Step 1: huge scope. Step 2: regret. Step 3: ship anyway.",
      "The theme dropped. My brain immediately ignored it.",
      "Coffee stockpiled, dignity unpacked. Let the jam begin.",
    ],
    act_social: [
      "Crafting the perfect post. Deleting it. Posting the first draft.",
      "This take is either genius or career-ending. Posting.",
      "Engagement farming? No no. 'Community building.'",
      "Posting a hot take and then turning off my phone in fear.",
      "This thread will either change the world or get me ratioed.",
    ],
    act_coffee: [
      "Ah. Liquid productivity.",
      "Coffee number four? Who's counting. Not my heart.",
      "The beans understand me.",
      "Instant focus. Side effects: vibrating slightly.",
      "This is a 'replace blood with espresso' kind of day.",
      "I can taste the productivity. It's bitter and over-brewed.",
    ],

    // Housing flavor
    housing0: [
      "Mom says dinner's ready. The empire can wait 20 minutes.",
      "My childhood posters are watching me build the future.",
      "Step 1 of the master plan: leave this bedroom.",
      "If I make it big I'm buying mom a house first.",
      "The WiFi password is still 'family123'. The shame fuels me.",
      "Dad asked when I'm getting a 'real job'. The empire heard him.",
      "I pitch startups to my old soccer trophies. They believe in me.",
      "Mom rearranged my desk 'to help'. The whole roadmap is gone.",
      "Building a unicorn from a twin bed. Steve Jobs had a garage. I'll allow it.",
      "Curfew doesn't apply to founders. I checked. It does. I'm sneaking out.",
    ],
    housing1: [
      "My own place. It's tiny. It's mine. It's tinily mine.",
      "I can hear my neighbor's alarm. We're a team now.",
      "The whole apartment is one room. Efficient. Cozy. Legally a closet.",
      "My bed, desk, and kitchen are the same piece of furniture. Synergy.",
      "The neighbor's bassline is my new ambient soundtrack. Free.",
      "I can touch both walls. It's not small, it's 'hug-sized'.",
    ],
    housingMid: [
      "An actual office room. I've made it. (Don't check my bank account.)",
      "I bought a plant. We're both trying our best.",
      "This view beats the parking lot wall. Low bar. Cleared it.",
      "I have a guest room. I have no guests. But I have the room.",
      "Two whole bathrooms. I rotate them for variety.",
    ],
    housingHigh: [
      "The penthouse echo is my new coworker.",
      "I have a fridge for just drinks. JUST DRINKS.",
      "My commute is an elevator. A fancy one.",
      "The cleaning crew knows the place better than I do.",
      "Floor-to-ceiling windows. The city watches me eat {snack} in my underwear.",
    ],
    housingTop: [
      "Island WiFi: excellent. Island neighbors: crabs.",
      "My campus has a smoothie bar. I regret nothing.",
      "Sometimes I video call mom from the beach. She still asks if I eat enough.",
      "I own this whole island and the crabs still don't respect me.",
      "Helipad's a bit much. Use it daily though. No regrets.",
      "My home has a name. A NAME. Like a pet, but it's a building.",
    ],

    // Trait flavor
    t_workaholic: ["Breaks are for people with finished products.", "Rest day? Never heard of her.", "I'll sleep when the backlog is empty. So... never.", "Weekends are just weekdays with worse lighting.", "I scheduled my burnout for Q4. Penciled in.", "Vacation? I brought my laptop to the funeral. Optimization."],
    t_lazy: ["I'll do it tomorrow. Tomorrow-me is very reliable.", "Why stand when you can sit? Why sit when you can lie down?", "I automated the thing so I'd never have to do the thing.", "Effort is a finite resource and I'm conserving it. Forever.", "The bare minimum is a goal, technically."],
    t_cryptoaddict: ["Just one more chart check. The last one. Promise.", "I dreamt in candlesticks again.", "I set 14 price alerts. All of them went off. None of them helped.", "My therapist asked about my support levels. The price kind.", "I named my firstborn after {coin}. Hypothetically. For now."],
    t_optimistic: ["Today's the day. I can feel it. (Day 312 of feeling it.)", "Every crash is just a discount on the future.", "Glass half full? I bought the whole factory.", "This bug? An opportunity wearing a disguise.", "Rock bottom has great cell reception, honestly."],
    t_risktaker: ["Safe bets are for people with backup plans.", "All in. Again. It's a lifestyle.", "Diversification is just admitting you're scared.", "What's the worst that could happen? Don't answer that.", "I read the warning label and took it as a dare."],
    t_frugal: ["Why buy new when slightly broken exists?", "That's not dust on my laptop, that's patina.", "I reuse tea bags. Three times. Flavor's a mindset.", "Coupons are just society rewarding my vigilance.", "I'd rather walk an hour than pay for parking. Built different. Broke different."],
    t_visionary: ["In 10 years everyone will do this. I'm just early.", "They laughed at my {appAdj} for {appNoun} idea. They'll see.", "I see the future. It's blurry, but it's there. Probably.", "I'm not ahead of my time, time is just slow.", "Disruption is just a polite word for 'I broke something on purpose'."],

    // Era flavor
    era0: ["Apps. Apps everywhere. I should make apps.", "Everyone's building a social network. What if... one more?", "There's an app for that. But not MY app for that.", "The App Store is gold. Mostly fool's gold. But still gold."],
    era1: ["Everyone's a creator now. Even my dentist has a vlog.", "Attention is the new oil. I'm drilling.", "Influencer is a real job now. My parents are still processing.", "I monetized my hobby and now I hate my hobby. Growth."],
    era2: ["The AI gold rush. I'm selling shovels. Smart shovels.", "My toaster got a funding round. The bar is on the floor.", "Everything's '.ai' now. My corner store rebranded.", "We slapped a chatbot on it and called it innovation."],
    era3: ["My robot vacuums AND judges my life choices.", "Robots took the boring jobs. The meetings remain. Cruel.", "My fridge negotiates its own warranty now. I'm not consulted.", "The android coworker is too good at small talk. Unsettling."],
    era4: ["Earth office or Mars office today? Decisions.", "The space WiFi has 4-minute lag. Still better than 2015.", "Low gravity standing desk. My posture has never been worse.", "Shipped a feature to three planets. Bugs on all three."],
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
