/* WiFi Billionaire — i18n. English is the source language; dictionaries map
   exact English strings to translations. Swedish mode also switches money
   formatting to SEK ("kr", Swedish separators). Language stored in wb_lang. */
'use strict';

WB.I18N = (function () {
  let lang = "en";
  try { lang = localStorage.getItem("wb_lang") || "en"; } catch (e) {}

  const SV = {
    // top bar / HUD
    "Goal:": "Mål:", "Settings": "Inställningar", "Notifications": "Notiser",
    "Clear all": "Rensa alla", "PRESTIGE READY": "PRESTIGE REDO",
    "HUSTLE 💪": "HUSTLA 💪",
    // meters & chips
    "⚡ Energy": "⚡ Energi", "😊 Happiness": "😊 Lycka", "🔥 Motivation": "🔥 Motivation", "🫠 Stress": "🫠 Stress",
    "🌟 Reputation": "🌟 Rykte", "🧠 Intelligence": "🧠 Intelligens", "📱 Fans": "📱 Fans",
    // status chip
    "Writing Code": "Kodar", "shipping features (and bugs)": "levererar funktioner (och buggar)",
    "Making Content": "Skapar innehåll", "cameras flashing, fame loading": "kamerablixtar, kändisskap laddas",
    "Trading Crypto": "Tradar krypto", "watching candles like a hawk": "stirrar på candlesticks som en hök",
    "Building AI": "Bygger AI", "teaching the machine to hustle": "lär maskinen att hustla",
    "Making Games": "Gör spel", "one more playtest, promise": "ett speltest till, jag lovar",
    "Studying": "Pluggar", "brain gains in progress": "hjärngains pågår",
    "Sleeping": "Sover", "snoring at championship level": "snarkar på elitnivå",
    "Touching Grass": "Rör gräs", "outside??? character growth": "utomhus??? personlig utveckling",
    "In Prison": "I fängelse", "Hustling": "Hustlar", "doing entrepreneur things": "gör entreprenörsgrejer",
    "😄 Great": "😄 Toppen", "🙂 Fine": "🙂 Okej", "😕 Meh": "😕 Sådär", "😩 Rough": "😩 Tufft",
    // activities
    "Write Code": "Koda", "Make Content": "Skapa innehåll", "Trade Crypto": "Trada krypto",
    "Build AI": "Bygg AI", "Make Games": "Gör spel", "Study": "Plugga", "Sleep": "Sov", "Touch Grass": "Rör gräs",
    // tabs
    "🛒 Shop": "🛒 Butik", "💼 Careers": "💼 Karriärer", "🦹 Crime": "🦹 Brott",
    "📱 Socials": "📱 Socialt", "🧠 Profile": "🧠 Profil", "♻️ Prestige": "♻️ Prestige",
    "🛠️ Gear & Home": "🛠️ Prylar & Hem", "💎 Assets": "💎 Tillgångar",
    "🧠 Skills": "🧠 Färdigheter", "🏆 Awards": "🏆 Utmärkelser", "📊 Stats": "📊 Statistik",
    // common buttons / labels
    "Buy": "Köp", "Commit": "Utför", "🧼 Launder": "🧼 Tvätta", "Hire": "Anställ", "Let go": "Säg upp",
    "Sell all": "Sälj allt", "Upgrade": "Uppgradera", "Close": "Stäng", "MAX": "MAX", "OWNED": "ÄGD",
    "Open<br>Messages": "Öppna<br>Meddelanden", "Post Update": "Posta uppdatering",
    "Ready": "Redo", "📬 Check results!": "📬 Kolla resultat!",
    // crime tab
    "🌆 The Underworld": "🌆 Undre världen", "/ 100 heat": "/ 100 hetta",
    "Crimes raise heat · heat raises catch odds · time (or laundering) cools it down":
      "Brott höjer hettan · hetta höjer risken att åka fast · tid (eller pengatvätt) kyler ner",
    "🦹 Quick Jobs": "🦹 Snabbjobb", "💬 Scam Sim — Texting": "💬 Scam Sim — SMS",
    "Chat up fictional marks, watch their scare meter, cash out before they snap.":
      "Chatta med fiktiva offer, håll koll på skräckmätaren, casha ut innan de knäcks.",
    "❄️ Cold": "❄️ Kall", "🌤️ Warm": "🌤️ Ljummen", "🔥 Hot": "🔥 Het", "🚨 Blazing": "🚨 Glödhet",
    "🚔 County Jail": "🚔 Häktet", "Calm": "Lugn", "Nervous": "Nervös", "Scared": "Rädd", "PANICKING": "PANIK",
    // jail
    "JAILED": "FÄNGSLAD", "⚖️ Bail": "⚖️ Borgen", "left": "kvar",
    "County Jail · Cell": "Häktet · Cell",
    // settings
    "⚙️ General": "⚙️ Allmänt", "🤖 AI": "🤖 AI", "💾 Data": "💾 Data", "✨ Updates": "✨ Uppdateringar", "ℹ️ About": "ℹ️ Om oss",
    "🌍 Language": "🌍 Språk", "Choose your language. Swedish switches money to SEK.":
      "Välj språk. Svenska byter valuta till SEK.",
    // v6.5.4 — goal bar, hard jobs, crew heists, common toasts
    "NEXT GOAL": "NÄSTA MÅL", "Goal:": "Mål:",
    "Hard Jobs": "Tunga jobb", "· real stakes, real payouts": "· riktiga insatser, riktiga utbetalningar",
    "Stake": "Insats", "car": "bil", "if caught": "om du åker fast", "risk": "risk", "heat": "hetta",
    "Solo": "Ensam", "Crew": "Gäng", "Commit": "Begå", "Pick your crew": "Välj ditt gäng",
    "A partner lowers the risk and boosts the take — and gets a cut sent to them.":
      "En partner sänker risken och ökar bytet — och får en andel skickad till sig.",
    "Your built-in partner — always down.": "Din inbyggda partner — alltid med på noterna.",
    "their cut": "sin andel", "cut you in on": "lät dig vara med på", "Sent": "Skickade",
    "You're in jail. Sit tight.": "Du sitter i finkan. Håll ut.",
    "Jewelry Store Heist": "Juvelerarkupp", "Armored Truck Job": "Värdetransportkupp",
    "Casino Vault Heist": "Kasinovalvkupp", "Bank Robbery": "Bankrån",
    "Fake Online Store": "Falsk nätbutik", "Card Skimming": "Kortskumning", "Identity Theft": "Identitetsstöld",
    "Crypto Rug Pull": "Krypto rug pull", "Ponzi Scheme": "Pyramidspel", "Counterfeit Sneakers": "Piratsneakers",
    "DDoS-for-Hire": "DDoS mot betalning", "Launder Heat": "Tvätta hetta",
    // common toasts
    "bailed you out of jail!": "betalade din borgen!", "sent you": "skickade dig",
    "Released from jail. Reformed? Absolutely not.": "Frisläppt. Bättrad? Absolut inte.",
    "Can't afford bail. Wait it out.": "Har inte råd med borgen. Vänta ut det.",
    "Tutorial complete — here's $1,000 to get you started!": "Tutorial klar — här är 1 000 kr för att komma igång!",
    "GLOBAL EVENT": "GLOBAL HÄNDELSE", "Wrong password.": "Fel lösenord.",
    // onboarding
    "Welcome to": "Välkommen till", "Let's set you up — you can change all of this later in Settings.":
      "Vi fixar dig — du kan ändra allt detta senare i Inställningar.",
    "Username": "Användarnamn", "how you'll show on the global leaderboard": "så här syns du på topplistan",
    "e.g. RamenTycoon": "t.ex. RamenTycoon", "Language": "Språk", "Theme": "Tema",
    "Light": "Ljust", "Dark": "Mörkt", "Start the grind": "Börja grinda",
    "A satire game by Connection Games · for entertainment only": "Ett satirspel av Connection Games · endast underhållning",
    // Adam (easter egg)
    "bestie": "bästis", "Message Adam…": "Meddela Adam…",
    "Add real players by username — Adam's always here for you. 🐐": "Lägg till riktiga spelare via användarnamn — Adam är alltid här för dig. 🐐",
    "Real friends need Firestore + Anonymous sign-in — but Adam's always here. 🐐": "Riktiga vänner kräver Firestore + anonym inloggning — men Adam är alltid här. 🐐",
    "🦈 Sorko Mode": "🦈 Sorko-läge", "🎉 Confetti": "🎉 Konfetti", "💭 Thought Bubbles": "💭 Tankebubblor",
    "🌡️ Show Heat Meter": "🌡️ Visa hetta-mätare", "💾 Autosave Notices": "💾 Autospar-notiser",
    "Your #1 superfan haunts the Socials feed. Essential.": "Ditt största fan hemsöker Socialt-flödet. Oumbärligt.",
    "Celebrate milestones with falling confetti.": "Fira milstolpar med fallande konfetti.",
    "The character's running inner monologue.": "Karaktärens ständiga inre monolog.",
    "Display the crime heat indicator in the HUD.": "Visa hetta-indikatorn i HUD:en.",
    "Pop a tiny toast every time the game saves.": "Visa en liten notis varje gång spelet sparar.",
    "Export Save": "Exportera sparfil", "Import Save": "Importera sparfil",
    "Hard Reset (delete everything)": "Hård återställning (radera allt)",
    "Save Key": "Spara nyckel", "Clear": "Rensa",
    // main menu
    "From a mattress to a market cap": "Från madrass till börsvärde",
    "Casual Mode": "Lugnt läge", "Speedrun Mode": "Speedrun-läge",
    "Relaxed pacing": "Avslappnat tempo", "Everything ×3 faster": "Allt ×3 snabbare",
    
    "Pick a mode to start": "Välj ett läge för att börja",
    "CASUAL — the classic experience.": "LUGNT — den klassiska upplevelsen.",
    "Normal pacing, no time pressure. Build your empire one ramen at a time. Perfect for long idle sessions.":
      "Normalt tempo, ingen tidspress. Bygg ditt imperium en nudelportion i taget. Perfekt för långa idle-sessioner.",
    "SPEEDRUN — for optimizers.": "SPEEDRUN — för optimerare.",
    "Income, XP and actions run ~3× faster and events come more often. Reach a billion fast — but chaos comes fast too.":
      "Inkomst, XP och handlingar går ~3× snabbare och händelser kommer oftare. Nå en miljard snabbt — men kaoset kommer också snabbt.",
    "Audio, language, gameplay and data options. Opens after you enter the game.":
      "Ljud, språk, spel- och datainställningar. Öppnas när du klivit in i spelet.",
    "▶ Continue": "▶ Fortsätt",
    "© 2026 Connection Games · For entertainment only": "© 2026 Connection Games · Endast för underhållning",
    // boot screen (v6: auto-update on open)
    "Loading…": "Laddar…", "Looking for updates…": "Letar efter uppdateringar…",
    "You’re up to date ✓": "Du har senaste versionen ✓",
    "Installing — restarting…": "Installerar — startar om…",
    "Couldn’t check for updates — playing offline": "Kunde inte söka uppdateringar — spelar offline",
    "What's New": "Vad är nytt",
    "The game updated itself while you weren't looking. Here's the loot:": "Spelet uppdaterade sig självt medan du tittade bort. Här är bytet:",
    "Let's go!": "Nu kör vi!",
    // game mode in settings
    "🎮 Game Mode": "🎮 Spelläge",
    "Casual — relaxed pacing": "Lugnt — avslappnat tempo",
    "Speedrun — everything ×3 faster": "Speedrun — allt ×3 snabbare",
    "Applies instantly — switch any time.": "Gäller direkt — byt när du vill.",
    // empire
    "Empire": "Imperium",
    // action categories (v6.1)
    "Work": "Jobb", "Fame": "Kändis", "Money": "Pengar", "Life": "Livet",
    "Sprints, gigs, jams — make stuff, get paid.": "Sprintar, gig, jams — bygg saker, få betalt.",
    "Videos, streams, hot takes — grow the audience.": "Videor, streams, heta åsikter — väx publiken.",
    "Flips, drops, market plays — pure profit moves.": "Flippar, släpp, marknadsdrag — rena vinstdrag.",
    "Coffee, naps, showers — keep the human running.": "Kaffe, tupplurar, duschar — håll människan igång.",
    "📬 Results ready!": "📬 Resultat klara!",
    "working…": "jobbar…", "ready": "redo", "recharging…": "laddar om…",
    "Start": "Starta", "Collect": "Hämta", "Results are in!": "Resultaten är här!",
    // hygiene & bathroom
    "🧼 Hygiene": "🧼 Hygien", "Bathroom Break": "Toalettpaus", "very important business": "mycket viktiga affärer",
    // easter egg
    "Hold up.": "Vänta lite.",
    "Oh.. You are using an autoclicker, what's the challenge?": "Oj.. Du använder en autoclicker — var är utmaningen?",
    "Ok, I will stop": "Ok, jag slutar", "F##k off": "Dra åt h##vete",
    "🤝 Respect. The grind must be earned.": "🤝 Respekt. Grindet måste förtjänas.",
    // tutorial
    "Welcome!": "Välkommen!", "Skip": "Hoppa över", "Next": "Nästa", "Let's go!": "Nu kör vi!", "Done": "Klar",
    "Meet your entrepreneur": "Möt din entreprenör",
    "He lives in his parents' bedroom and dreams in dollar signs. You don't control him — you manage him.":
      "Han bor i sina föräldrars sovrum och drömmer i dollartecken. Du styr honom inte — du managerar honom.",
    "The Hustle button": "Hustle-knappen",
    "Smash it for instant cash. Clicks get stronger as your income grows.":
      "Tryck för snabba pengar. Klicken blir starkare när din inkomst växer.",
    "Set his focus": "Välj hans fokus",
    "Pick what he works on. He earns more and gains XP in whatever you choose. Sleep is not optional.":
      "Välj vad han jobbar med. Han tjänar mer och får XP i det du väljer. Sömn är inte valfritt.",
    "Run actions": "Kör handlingar",
    "Freelance gigs, code sprints, videos — start one, collect the results when it glows.":
      "Frilansjobb, kodsprintar, videor — starta en och hämta resultatet när det lyser.",
    "Spend it wisely": "Spendera klokt",
    "Gear, homes, careers, crime. Everything you buy shows up in the room.":
      "Prylar, hem, karriärer, brott. Allt du köper syns i rummet.",
    "Follow the goal": "Följ målet",
    "The goal bar always shows your next milestone. Now go — from this bedroom to a billion. 📈":
      "Målraden visar alltid nästa milstolpe. Kör nu — från sovrummet till en miljard. 📈",

    // ============ v6.2: FULL SWEDISH PASS ============
    // ---- housing ----
    "Parents' Bedroom": "Föräldrarnas sovrum", "Tiny Studio": "Liten etta", "Small Apartment": "Liten lägenhet",
    "Modern Apartment": "Modern lägenhet", "Luxury Apartment": "Lyxlägenhet", "Penthouse": "Takvåning",
    "Mansion": "Herrgård", "Private Island": "Privat ö", "Futuristic Tech Campus": "Futuristiskt tech-campus",
    "A mattress, a desk, and a poster of a sports car you can't afford.": "En madrass, ett skrivbord och en poster på en sportbil du inte har råd med.",
    "300 square feet of pure freedom. The shower is also the kitchen.": "28 kvadratmeter ren frihet. Duschen är också köket.",
    "An actual bedroom door. Luxury.": "En riktig sovrumsdörr. Lyx.",
    "Exposed brick. You point it out to everyone.": "Exponerat tegel. Du pekar ut det för alla.",
    "The doorman knows your name. You tip in app credits.": "Dörrvakten kan ditt namn. Du dricksar i app-poäng.",
    "Floor-to-ceiling windows. The city is your screensaver.": "Fönster från golv till tak. Staden är din skärmsläckare.",
    "You have rooms you've literally never entered.": "Du har rum du bokstavligen aldrig varit i.",
    "The WiFi is satellite. The vibes are immaculate.": "WiFi:t går via satellit. Stämningen är fläckfri.",
    "Your house has a mission statement.": "Ditt hus har en vision och affärsidé.",
    "Lunar Base Alpha": "Månbas Alpha", "Mars Colony": "Mars-koloni",
    // ---- equipment labels + effects ----
    "Laptop": "Laptop", "Desktop PC": "Stationär dator", "CPU": "Processor", "GPU": "Grafikkort",
    "Keyboard": "Tangentbord", "Mouse": "Mus", "Monitor": "Skärm", "Desk": "Skrivbord", "Chair": "Stol",
    "Internet": "Internet", "Server Rack": "Serverrack", "Office": "Kontor",
    "🏠 Housing": "🏠 Boende", "🛠️ Equipment": "🛠️ Utrustning",
    "+8% income/tier": "+8% inkomst/nivå", "+11% income/tier": "+11% inkomst/nivå", "+6% income/tier": "+6% inkomst/nivå",
    "+4% income/tier": "+4% inkomst/nivå", "+10% income/tier": "+10% inkomst/nivå", "+12% income/tier": "+12% inkomst/nivå",
    "+14% income/tier": "+14% inkomst/nivå", "+6% XP/tier": "+6% XP/nivå", "+8% XP/tier": "+8% XP/nivå",
    "+20% click/tier": "+20% klick/nivå", "-7% energy drain/tier": "-7% energiförlust/nivå",
    "MAX": "MAX", "OWNED": "ÄGD",
    // ---- careers ----
    "Programmer": "Programmerare", "Content Creator": "Innehållsskapare", "Crypto Trader": "Kryptohandlare",
    "AI Entrepreneur": "AI-entreprenör", "Game Developer": "Spelutvecklare",
    "Freelancer": "Frilansare", "Agency Owner": "Byråägare", "SaaS Founder": "SaaS-grundare", "Tech CEO": "Tech-VD",
    "Creator": "Kreatör", "Influencer": "Influencer", "Media Empire": "Medieimperium",
    "Trader": "Handlare", "Whale": "Val", "Crypto Mogul": "Kryptomogul",
    "Automation Builder": "Automationsbyggare", "AI Agency": "AI-byrå", "AI Empire": "AI-imperium",
    "Indie Dev": "Indieutvecklare", "Studio Owner": "Studioägare", "Gaming Empire": "Spelimperium",
    "Not started": "Inte påbörjad", "PATH MASTERED": "BANAN BEMÄSTRAD", "Portfolio:": "Portfölj:",
    "Buy (25% cash)": "Köp (25% av kassan)", "Sell All": "Sälj allt",
    // ---- skills ----
    "Coding": "Kodning", "Content": "Innehåll", "Trading": "Trading", "AI": "AI", "Game Dev": "Spelutveckling", "Business": "Affärer",
    "🎭 Traits": "🎭 Drag", "✨ Perks": "✨ Förmåner",
    "No traits yet. Live a little — personality develops from behavior.": "Inga drag än. Lev lite — personlighet utvecklas av beteende.",
    "Perks unlock every 3 character levels.": "Förmåner låses upp var tredje karaktärsnivå.",
    // ---- eras ----
    "Internet Era": "Internet-eran", "Creator Era": "Kreatörs-eran", "AI Era": "AI-eran",
    "Robotics Era": "Robot-eran", "Space-Tech Era": "Rymdtech-eran",
    "THE WORLD HAS CHANGED": "VÄRLDEN HAR FÖRÄNDRATS",
    "LIFE": "LIV", "same bedroom. more knowledge.": "samma sovrum. mer kunskap.",
    "5 BILLION HOURS LATER…": "5 MILJARDER TIMMAR SENARE…", "fine, it was": "okej, det var",
    // ---- traits ----
    "Workaholic": "Arbetsnarkoman", "Ambitious": "Ambitiös", "Optimistic": "Optimist", "Lazy": "Lat",
    "Risk Taker": "Risktagare", "Crypto Addict": "Kryptoberoende", "Builder": "Byggare",
    "Visionary": "Visionär", "Frugal": "Snål", "Competitive": "Tävlingsmänniska",
    // ---- perks (names + descs) ----
    "Night Owl": "Nattuggla", "Lucky": "Tursam", "Viral Genius": "Viralt geni", "Crypto Wizard": "Kryptotrollkarl",
    "Networking Expert": "Nätverksexpert", "Ramen Master": "Nudelmästare", "Fast Learner": "Snabblärd",
    "Caffeinated": "Koffeinerad", "Minimalist": "Minimalist", "Ship It": "Skeppa det", "Perfectionist": "Perfektionist",
    "Side Hustler": "Sidohustlare", "Main Character": "Huvudkaraktär", "Zen Mode": "Zen-läge",
    "Compound Brain": "Ränta-på-ränta-hjärna", "Automation Lover": "Automationsälskare", "Negotiator": "Förhandlare",
    "Trend Spotter": "Trendspanare", "Grindset": "Grindset", "Grass Toucher": "Gräsrörare",
    "Angel Mindset": "Änglainvesterare", "Hustle Fingers": "Hustlefingrar", "Rare Find": "Sällsynt fynd",
    "+12% income while working.": "+12% inkomst när du jobbar.", "Energy drains 20% slower.": "Energin sjunker 20% långsammare.",
    "+5 hidden luck. Good things happen more.": "+5 dold tur. Bra saker händer oftare.",
    "Projects are 2x as likely to go viral.": "Projekt blir virala dubbelt så ofta.",
    "+30% crypto trading returns.": "+30% avkastning på krypto.", "+50% reputation gain.": "+50% ryktesökning.",
    "Happiness never drops below 30.": "Lyckan sjunker aldrig under 30.", "+25% skill XP.": "+25% färdighets-XP.",
    "+15% project speed.": "+15% projektfart.", "Equipment costs 10% less.": "Utrustning kostar 10% mindre.",
    "Projects complete 20% faster but fail 5% more.": "Projekt blir klara 20% snabbare men floppar 5% oftare.",
    "Projects 15% slower, payouts +35%.": "Projekt 15% långsammare, utbetalningar +35%.",
    "+20% income from careers you're NOT focused on.": "+20% inkomst från karriärer du INTE fokuserar på.",
    "+25% follower gain.": "+25% följartillväxt.", "Stress builds 30% slower.": "Stress byggs upp 30% långsammare.",
    "+1% income per housing tier owned.": "+1% inkomst per boendenivå.", "+15% income while sleeping.": "+15% inkomst när du sover.",
    "Career upgrades cost 15% less.": "Karriäruppgraderingar kostar 15% mindre.",
    "+10% income in the newest unlocked era.": "+10% inkomst i senaste eran.",
    "+8% income permanently. No notes.": "+8% inkomst permanent. Inga anteckningar.",
    "Touching grass restores 50% more.": "Att röra gräs återställer 50% mer.",
    "Offline earnings +25%.": "Offline-intäkter +25%.", "Hustle clicks worth +50%.": "Hustleklick värda +50%.",
    "+3 luck and +5% income. Prestige-tier perk.": "+3 tur och +5% inkomst. Prestige-klass.",
    // ---- prestige ----
    "Old Money": "Gamla pengar", "Head Start": "Försprång", "Born Lucky": "Född med tur", "Genius Genes": "Genigener",
    "Storage Unit": "Förråd", "Perk Connoisseur": "Förmånskännare", "Night Shift": "Nattskift", "Speedrun Mode": "Speedrun-läge",
    "♻️ Rebirth": "♻️ Återfödelse", "Upgrade": "Uppgradera",
    // ---- goals ----
    "Earn your first $10": "Tjäna dina första 10 kr", "Reach Coding level 3": "Nå Kodning nivå 3",
    "Ship your first project": "Skeppa ditt första projekt", "Save up $500": "Spara ihop 500 kr",
    "Buy a real laptop (tier 2)": "Köp en riktig laptop (nivå 2)", "Move into the Tiny Studio": "Flytta till ettan",
    "Unlock a second career": "Lås upp en andra karriär", "Reach $10,000": "Nå 10 000 kr",
    "Move into the Small Apartment": "Flytta till lilla lägenheten", "Become an Agency Owner": "Bli byråägare",
    "Reach $100,000": "Nå 100 000 kr", "Enter the Creator Era": "Kliv in i Kreatörs-eran",
    "Become a millionaire": "Bli miljonär", "Buy the Penthouse": "Köp takvåningen",
    "Enter the AI Era": "Kliv in i AI-eran", "Reach $100M net worth": "Nå 100 mn i nettoförmögenhet",
    "Buy the Private Island": "Köp den privata ön", "Reach $1B — prestige unlocked": "Nå 1 miljard — prestige upplåst",
    "Prestige and be reborn": "Prestiga och återföds", "Reach the Space-Tech Era": "Nå Rymdtech-eran",
    "All goals complete. You are the goal now.": "Alla mål klara. Du ÄR målet nu.",
    // ---- actions ----
    "Code Sprint": "Kodsprint", "Post Video": "Lägg upp video", "Train AI": "Träna AI", "Scan Market": "Skanna marknaden",
    "Game Jam": "Game jam", "Post Online": "Posta online", "Freelance Gig": "Frilansjobb", "Brew Coffee": "Brygg kaffe",
    "Bug Bounty": "Buggjakt", "Go Live": "Gå live", "Collab DM": "Collab-DM", "Flip Tech": "Flippa prylar",
    "Merch Drop": "Merch-släpp", "Raise Rates": "Höj priserna", "Power Nap": "Tupplur", "Hot Shower": "Varm dusch",
    "Meditate": "Meditera", "Order Takeout": "Beställ käk",
    "15 seconds of pure focus on the current project.": "15 sekunder av rent fokus på projektet.",
    "Pick a topic, upload, then check how it performed.": "Välj ämne, ladda upp och se hur det gick.",
    "Spend compute, grow the model, hope it learns the right thing.": "Bränn beräkningskraft och hoppas modellen lär sig rätt sak.",
    "Hunt for a hot coin, then decide whether to ape in.": "Jaga ett hett mynt och bestäm om du ska apa in.",
    "A 48-hour jam compressed into 60 seconds of panic.": "Ett 48-timmars jam komprimerat till 60 sekunder panik.",
    "Fire off a take. See what the internet thinks.": "Avfyra en åsikt. Se vad internet tycker.",
    "Pick up a quick job. The client is always... a personality.": "Ta ett snabbt jobb. Kunden är alltid... en personlighet.",
    "Liquid productivity. Instant effect.": "Flytande produktivitet. Direkt effekt.",
    "Hunt vulnerabilities in big-company code for cash.": "Jaga säkerhetshål i storbolagens kod för pengar.",
    "Stream the grind. Chat is… a place.": "Streama grindet. Chatten är… en plats.",
    "Slide into a bigger creator's DMs with a pitch.": "Glid in i en större kreatörs DM med en pitch.",
    "Buy 'barely used' tech cheap, resell at enthusiast prices.": "Köp 'knappt använd' teknik billigt, sälj till entusiastpris.",
    "Print hoodies with your logo. Your fans NEED them.": "Trycka hoodies med din logga. Dina fans BEHÖVER dem.",
    "Email every client: 'My rates are increasing.' Hold your nerve.": "Mejla varje kund: 'Mina priser höjs.' Håll nerverna.",
    "20 minutes. Just 20 minutes. Instant energy.": "20 minuter. Bara 20 minuter. Direkt energi.",
    "Instant hygiene. Best ideas guaranteed.": "Direkt hygien. Bästa idéerna garanterade.",
    "Sit still. Think nothing. Fail. Try again.": "Sitt still. Tänk inget. Misslyckas. Försök igen.",
    "Costs money. Restores the will to grind.": "Kostar pengar. Återställer viljan att grinda.",
    // ---- crime ----
    "Fake Online Store": "Falsk nätbutik", "Card Skimming": "Kortskimning", "Identity Theft": "Identitetsstöld",
    "Crypto Rug Pull": "Krypto-rugpull", "Ponzi Scheme": "Ponzibedrägeri", "Counterfeit Sneakers": "Piratkopierade sneakers",
    "DDoS-for-Hire": "DDoS att hyra", "Launder Heat": "Tvätta hettan",
    "Spin up a store that takes orders and ships nothing.": "Starta en butik som tar emot beställningar och skickar inget.",
    "Skim card numbers off a sketchy payment page.": "Skimma kortnummer från en skum betalsida.",
    "Become someone else, financially speaking.": "Bli någon annan, rent ekonomiskt.",
    "Launch {coin}, pump it, vanish with the liquidity.": "Lansera {coin}, pumpa det, försvinn med likviditeten.",
    "Pay old investors with new investors. Forever. (It's never forever.)": "Betala gamla investerare med nya. För evigt. (Det är aldrig för evigt.)",
    "Sell 'limited edition' kicks made in a very unlimited factory.": "Sälj 'limited edition'-skor från en väldigt obegränsad fabrik.",
    "Rent out your botnet to people with grudges.": "Hyr ut ditt botnät till folk med agg.",
    "Run dirty money through a 'car wash empire' to cool things down.": "Kör svarta pengar genom ett 'biltvättsimperium' för att kyla läget.",
    "🌆 The Underworld": "🌆 Undre världen", "🦹 Quick Jobs": "🦹 Snabbjobb", "Commit": "Begå", "🧼 Launder": "🧼 Tvätta",
    "Crimes raise heat · heat raises catch odds · time (or laundering) cools it down": "Brott höjer hettan · hetta höjer risken att åka fast · tid (eller tvätt) kyler ner",
    "💬 Scam Sim — Texting": "💬 Scam Sim — SMS", "🚔 County Jail": "🚔 Häktet", "County Jail · Cell": "Häktet · Cell",
    "Chat up fictional marks, watch their scare meter, cash out before they snap.": "Snacka upp fiktiva offer, håll koll på skräckmätaren och casha ut innan de knäcks.",
    "🟢 AI victims active.": "🟢 AI-offer aktiva.", "⚪ Offline victims — add an OpenAI key in Settings for smart ones.": "⚪ Offline-offer — lägg in en OpenAI-nyckel i Inställningar för smarta.",
    "Open": "Öppna", "Messages": "Meddelanden", "Washes your dirty reputation": "Tvättar ditt smutsiga rykte",
    "In Prison": "I fängelse", "left": "kvar", "⚖️ Bail": "⚖️ Borgen",
    // ---- scam app ----
    "Inbox": "Inkorg", "Targets": "Måltavlor", "online now": "online nu", "hard": "svår", "medium": "medel", "easy": "lätt",
    "AI victims": "AI-offer", "offline victims (add OpenAI key in Settings for smart ones)": "offline-offer (lägg in OpenAI-nyckel i Inställningar)",
    "Parody mode. These are fictional characters. Build trust, then cash out — but watch the heat.": "Parodiläge. Detta är fiktiva karaktärer. Bygg förtroende, casha ut — men akta hettan.",
    "Trust": "Förtroende", "Type your message…": "Skriv ditt meddelande…", "Calm": "Lugn", "Nervous": "Nervös",
    "Scared": "Rädd", "PANICKING": "PANIK", "Goal secured!": "Mål säkrat!",
    "💸 Take the money": "💸 Ta pengarna", "🪪 Use their info": "🪪 Använd uppgifterna", "🔗 Drain via the link": "🔗 Töm via länken",
    "💸 Cash out": "💸 Casha ut", "Scam Successful": "Scam lyckades", "You Got Reported": "Du blev anmäld",
    "They Ghosted You": "De ghostade dig", "Back to targets": "Tillbaka till måltavlorna",
    "Heat ticked up. Maybe launder it later.": "Hettan steg. Kanske tvätta pengarna sen.",
    "saw through you and reported the number.": "genomskådade dig och anmälde numret.",
    "Heat is climbing — keep this up and it's jail time.": "Hettan stiger — fortsätt så här och det blir fängelse.",
    "stopped replying.": "slutade svara.", "No money, no heat. Try a softer approach next time.": "Inga pengar, ingen hetta. Testa mjukare nästa gång.",
    "hello?": "hallå?", "who's this?": "vem är det här?", "hi, do I know you?": "hej, känner jag dig?",
    "Get their bank account number": "Få deras kontonummer", "Collect the 'release fee'": "Få ut 'utlämningsavgiften'",
    "Get them to 'invest'": "Få dem att 'investera'", "Get an emergency 'loan'": "Få ett akut 'lån'",
    "Get remote access + a 'fix fee'": "Få fjärråtkomst + en 'fixavgift'", "Collect the 'customs fee'": "Få ut 'tullavgiften'",
    "Collect the 'back taxes'": "Driv in 'skatteskulden'",
    "Fake Bank Alert": "Falskt bankutskick", "Prize / Lottery": "Vinst / Lotteri", "Crypto Investment": "Kryptoinvestering",
    "Romance": "Romans", "Tech Support": "Teknisk support", "Package Delivery": "Paketleverans", "Tax / IRS": "Skatteverket",
    "Hi, this is the Fraud Prevention team — we detected suspicious activity on your account.": "Hej, det här är bedrägeriavdelningen — vi har upptäckt misstänkt aktivitet på ditt konto.",
    "CONGRATULATIONS! You've been selected as our grand prize winner!": "GRATTIS! Du har valts ut som vår storvinnare!",
    "Hey! Got a once-in-a-lifetime investment doing guaranteed 10x returns. Interested?": "Tjena! Har en investering som garanterat gör 10x. Intresserad?",
    "Hey beautiful soul… I feel like we were meant to connect. ☺️": "Hej vackra själ… Jag känner att vi var menade att mötas. ☺️",
    "Hello, this is Microsoft Technical Support. Your computer has 5 viruses.": "Hej, det här är Microsofts tekniska support. Din dator har 5 virus.",
    "Your package is held at our depot. A small fee is required for release.": "Ditt paket hålls kvar på vår depå. En liten avgift krävs för utlämning.",
    "This is the Tax Office. You have unpaid taxes and a warrant may be issued.": "Detta är Skatteverket. Du har obetald skatt och en varning kan utfärdas.",
    "They handed over their full bank details to 'secure the account'.": "De lämnade över alla bankuppgifter för att 'säkra kontot'.",
    "They paid the 'processing fee' to claim a prize that doesn't exist.": "De betalade 'hanteringsavgiften' för en vinst som inte finns.",
    "They wired their savings into your imaginary 10x coin.": "De förde över sparpengarna till ditt påhittade 10x-mynt.",
    "They sent money to help their soulmate through a 'crisis'.": "De skickade pengar för att hjälpa sin själsfrände genom en 'kris'.",
    "They installed your 'support tool' and paid to remove fake viruses.": "De installerade ditt 'supportverktyg' och betalade för att ta bort låtsasvirus.",
    "They paid a 'customs fee' for a parcel that was never coming.": "De betalade 'tullavgift' för ett paket som aldrig var på väg.",
    "They paid their 'overdue taxes' straight into your pocket.": "De betalade sin 'skatteskuld' rakt ner i din ficka.",
    // ---- empire ----
    "🪐 The Empire": "🪐 Imperiet", "EMPIRE COMPLETE": "IMPERIET KOMPLETT",
    "flat income from": "platt inkomst från", "acquisitions — an empire pays rent, it doesn't print.": "förvärv — ett imperium betalar hyra, det trycker inte pengar.",
    "flat income": "platt inkomst", "pays itself back in": "betalar sig själv på",
    "Because the first trillion is boring if you stay on Earth.": "För att den första biljonen är tråkig om du stannar på jorden.",
    "Why rent an office when you can own the skyline it sits in?": "Varför hyra kontor när du kan äga hela silhuetten det står i?",
    "Money can't buy happiness, but it funds the lab that's working on it.": "Pengar köper inte lycka, men de finansierar labbet som jobbar på saken.",
    // ---- tabs / common chrome ----
    "🧑‍💼 Staff — salaries come out of income": "🧑‍💼 Personal — löner dras från inkomsten",
    "📈 Investments — they move while you work": "📈 Investeringar — de rör sig medan du jobbar",
    "🛍️ Lifestyle — permanent perks for living well": "🛍️ Livsstil — permanenta fördelar för gott liv",
    "Hire": "Anställ", "Let go": "Säg upp", "Buy (10%)": "Köp (10%)", "Buy (25%)": "Köp (25%)", "Sell all": "Sälj allt",
    "Buy": "Köp", "Min buy-in:": "Lägsta insats:", "Advance to": "Avancera till", "Start as": "Börja som",
    "While You Were Away…": "Medan du var borta…",
    "Your entrepreneur kept the hustle alive for": "Din entreprenör höll hustlet vid liv i",
    "and earned": "och tjänade", "Nice.": "Najs.", "OK": "OK", "Continue": "Fortsätt",
    "Settings": "Inställningar", "What's New": "Vad är nytt",
    // ---- common toasts / bubbles (constants) ----
    "🔓 Released from jail. Reformed? Absolutely not.": "🔓 Släppt från finkan. Rehabiliterad? Absolut inte.",
    "🚔 No phones in jail. Wait it out.": "🚔 Inga telefoner i finkan. Vänta ut det.",
    "💸 Can't afford bail. Wait it out.": "💸 Har inte råd med borgen. Vänta ut det.",
    "🚨 The mark reported you. Heat is climbing — lay low.": "🚨 Offret anmälde dig. Hettan stiger — ligg lågt.",
    "😵 Your entrepreneur collapsed face-first onto the keyboard. Forced nap initiated.": "😵 Din entreprenör kollapsade med ansiktet i tangentbordet. Tvångslur initierad.",
    "🤖 AI key saved on this device.": "🤖 AI-nyckeln sparad på den här enheten.",
    "Key cleared.": "Nyckel rensad.",
    "FREE. The grind never did time.": "FRI. Grindet satt aldrig inne.",
    "Note to self: crime, but more carefully.": "Anteckning: brott, fast försiktigare.",
    "Home. The router missed me.": "Hemma. Routern saknade mig.",
    "Right. Where was I? Ah yes — getting rich.": "Just det. Var var jag? Ah ja — bli rik.",
    "👮 OPEN UP! POLICE!": "👮 ÖPPNA! POLISEN!",
    "...maybe it's the pizza guy?": "...kanske är det pizzabudet?",
    "\"It was a PARODY, officer!\"": "\"Det var en PARODI, konstapeln!\"",
    "\"Mind the hair. The hair is the brand.\"": "\"Akta håret. Håret är varumärket.\"",
    "Downtown. Booking. No WiFi.": "In till stationen. Inget WiFi.",
    "\"One phone call. I'm calling my accountant.\"": "\"Ett samtal. Jag ringer min revisor.\"",
    "🎵 to the launch pad — radio: full blast": "🎵 till uppskjutningsrampen — radio: max volym",
    "Today we leave the planet. Casually.": "Idag lämnar vi planeten. Helt casual.",
    "Steps? Where we're going we don't need steps.": "Trappor? Dit vi ska behövs inga trappor.",
    "Boarding. Mr. Whiskers has the conn.": "Bordar. Herr Morrhår har rodret.",
    "IGNITION. 🔥": "TÄNDNING. 🔥",
    "Goodbye taxes— I mean, gravity!": "Hejdå skatten— jag menar gravitationen!",
    "Space. It's quieter than the comment section.": "Rymden. Tystare än kommentarsfältet.",
    "One small hop for a billionaire…": "Ett litet skutt för en miljardär…",
    "🌕 THE MOON IS YOURS.": "🌕 MÅNEN ÄR DIN.",
    // ---- tab fragments (source-level keys) ----
    "income": "inkomst", "Move to": "Flytta till", "income/tier": "inkomst/nivå", "XP/tier": "XP/nivå",
    "energy drain/tier": "energiförlust/nivå", "click/tier": "klick/nivå",
    "if caught": "om du åker fast", "heat": "hetta", "risk": "risk",
    // ---- stats rows ----
    "Net worth": "Nettoförmögenhet", "Income": "Inkomst", "Lifetime earnings (this life)": "Intjänat (detta liv)",
    "All-time earnings": "Intjänat totalt", "Era": "Era", "Play time": "Speltid", "Hustle clicks": "Hustleklick", "💥 Lucky crits": "💥 Turträffar",
    "Projects shipped / flopped": "Projekt skeppade / floppade", "Viral hits": "Virala hits", "Followers": "Följare",
    "Crypto P/L": "Krypto V/F", "Events experienced": "Händelser upplevda", "Mom interruptions": "Mamma-avbrott",
    "Times slept": "Gånger sovit", "Grass touched": "Gräs rört", "Reputation": "Rykte", "Intelligence": "Intelligens",
    "Ego": "Ego", "Luck": "Tur", "Prestige count": "Prestige-antal", "Legacy points": "Arvspoäng",
    "??? (it knows what it did)": "??? (den vet vad den gjorde)",
    "None": "Ingen", "Heat": "Hetta", "PRESTIGE READY": "PRESTIGE REDO", "♻️ PRESTIGE READY": "♻️ PRESTIGE REDO",
    "Level Up — Choose a Perk": "Levlade upp — välj en förmån",
    "Pick one. The other two are lost to the multiverse.": "Välj en. De andra två försvinner i multiversum.",
    "Internet Era": "Internet-eran",

    // ============ v6.3 / v6.4 SWEDISH ============
    // tabs / chrome
    "🎯 Challenges": "🎯 Utmaningar", "🏆 Leaderboard": "🏆 Topplista", "Close": "Stäng", "Lv": "Nv", "Freelancing": "Frilansar",
    "Your profile & friends": "Din profil & vänner", "Player": "Spelare",
    // challenges
    "Challenges": "Utmaningar", "Claimed": "Hämtad", "Claim reward": "Hämta belöning",
    "ready to claim": "redo att hämtas", "Pin the ones you're chasing. Progress carries across every life.": "Nåla fast de du jagar. Framsteg följer med genom varje liv.",
    "Track this challenge": "Spåra denna utmaning",
    "bronze": "brons", "silver": "silver", "gold": "guld", "legendary": "legendarisk",
    "Bronze": "Brons", "Silver": "Silver", "Gold": "Guld", "Legendary": "Legendarisk",
    "income": "inkomst", "Legacy": "Arv", "fans": "fans", "luck": "tur", "rep": "rykte",
    // toast notification titles
    "Reward": "Belöning", "Heads up": "Obs", "Something happened": "Något hände", "Level up": "Ny nivå",
    "New trait": "Ny egenskap", "Challenge complete": "Utmaning klar", "Achievement": "Bedrift",
    "Going viral": "Blir viral", "New era": "Ny era", "now": "nu",
    "Smash That Button": "Smasha knappen", "Hit HUSTLE 500 times.": "Tryck HUSTLA 500 gånger.",
    "Ship It": "Skeppa det", "Ship 5 projects.": "Skeppa 5 projekt.",
    "Sleep Is For The Strong": "Sömn är för de svaga", "Sleep 30 times.": "Sov 30 gånger.",
    "Touch Grass": "Rör gräs", "Go outside 25 times.": "Gå ut 25 gånger.",
    "Diamond Hands": "Diamanthänder", "Make 20 crypto trades.": "Gör 20 kryptoaffärer.",
    "Career Criminal": "Yrkeskriminell", "Pull off 10 crimes.": "Genomför 10 brott.",
    "Rock Bottom": "Botten nådd", "Poop yourself 3 times. (Why.)": "Bajsa på dig 3 gånger. (Varför.)",
    "Going Viral": "Bli viral", "Land 3 viral hits.": "Få 3 virala hits.",
    "Galaxy Brain": "Galaxhjärna", "Reach Intelligence 50.": "Nå Intelligens 50.",
    "Millionaire Mindset": "Miljonärstänk", "Reach $1M net worth.": "Nå 1 mn i nettoförmögenhet.",
    "Time Traveler": "Tidsresenär", "Reach the AI Era.": "Nå AI-eran.",
    "Whale Alert": "Vallarm", "Earn $1B all-time.": "Tjäna 1 miljard totalt.",
    "💰 8 min of income": "💰 8 min inkomst", "💰 10 min of income": "💰 10 min inkomst",
    "💰 12 min of income": "💰 12 min inkomst", "💰 14 min of income": "💰 14 min inkomst",
    "💰 15 min of income": "💰 15 min inkomst", "💰 6 min of income (hush money)": "💰 6 min inkomst (tystnadspengar)",
    "🔥 ×1.5 income · 2 min": "🔥 ×1.5 inkomst · 2 min", "🔥 ×2 income · 3 min": "🔥 ×2 inkomst · 3 min",
    "📈 +1,000 followers": "📈 +1 000 följare", "♻️ +1 Legacy Point": "♻️ +1 arvspoäng", "♻️ +2 Legacy Points": "♻️ +2 arvspoäng",
    // leaderboard
    "Global Leaderboard": "Global topplista", "Refresh": "Uppdatera",
    "Tap Refresh to load the latest rankings.": "Tryck Uppdatera för att ladda senaste placeringarna.",
    "Ranked by net worth across every player. You compete as": "Rankad efter nettoförmögenhet bland alla spelare. Du tävlar som",
    "online now": "online nu", "offline": "offline", "you": "du", "Loading the leaderboard…": "Laddar topplistan…",
    "No scores yet — be the first!": "Inga resultat än — bli först!", "Connecting…": "Ansluter…",
    "Leaderboard is offline.": "Topplistan är offline.",
    "The owner needs to enable Firestore + Anonymous sign-in (see js/cloud.js).": "Ägaren måste aktivera Firestore + Anonym inloggning (se js/cloud.js).",
    // profile / friends
    "Friends": "Vänner", "Skills": "Färdigheter", "Awards": "Utmärkelser", "Stats": "Statistik",
    "online": "online", "Edit name": "Ändra namn",
    "Choose a username (shown to friends & on the leaderboard):": "Välj ett användarnamn (visas för vänner & på topplistan):",
    "Friends are offline.": "Vänner är offline.",
    "Enable Firestore + Anonymous sign-in to play with friends (see README).": "Aktivera Firestore + Anonym inloggning för att spela med vänner (se README).",
    "Friend's username…": "Vännens användarnamn…", "Add": "Lägg till", "Requests": "Förfrågningar",
    "wants to be friends": "vill bli vän", "Accept": "Acceptera", "Decline": "Avböj",
    "No friends yet — add someone by their username!": "Inga vänner än — lägg till någon med deras användarnamn!",
    "Friend request sent to": "Vänförfrågan skickad till", "No player called": "Ingen spelare som heter",
    "That's you!": "Det är ju du!", "Couldn't send request.": "Kunde inte skicka förfrågan.",
    "is now your friend!": "är nu din vän!", "Back": "Tillbaka", "Message…": "Meddelande…", "Say hi! 👋": "Säg hej! 👋",
    "Send money to": "Skicka pengar till", "Bail out": "Betala borgen för",
    "It leaves your wallet and lands in theirs instantly.": "Det lämnar din plånbok och landar i deras direkt.",
    "Cancel": "Avbryt", "Send": "Skicka", "You can't afford that.": "Du har inte råd med det.",
    "Sent": "Skickade", "to": "till", "bailed you out of jail!": "betalade din borgen!", "sent you": "skickade dig",
    // poop
    "You need to poop!": "Du måste bajsa!",
    "Nature is calling. Loudly. Urgently. This is a board-level emergency.": "Naturen kallar. Högt. Akut. Detta är en styrelsenivå-kris.",
    "Go to the toilet": "Gå på toaletten", "Pause the grind. Keep your dignity.": "Pausa grindet. Behåll värdigheten.",
    "I don't care": "Jag bryr mig inte", "The deadline matters more than the chair.": "Deadlinen är viktigare än stolen.",
    // like prompt / survey
    "Enjoying WiFi Billionaire?": "Gillar du WiFi Billionaire?", "Your honest take genuinely helps.": "Din ärliga åsikt hjälper på riktigt.",
    "Yes, love it!": "Ja, älskar det!", "Give it a ⭐ on GitHub": "Ge en ⭐ på GitHub",
    "Not really": "Inte direkt", "Tell us what to fix": "Berätta vad vi ska fixa",
    "⭐ Thank you! A star means the world.": "⭐ Tack! En stjärna betyder allt.",
    "What's not clicking?": "Vad funkar inte?", "Pick anything that applies — it's anonymous.": "Välj allt som stämmer — det är anonymt.",
    "Too grindy": "För mycket grind", "Confusing UI": "Förvirrande gränssnitt", "Not enough content": "För lite innehåll",
    "Bugs / glitches": "Buggar / glitchar", "Gets boring": "Blir tråkigt", "Performance / lag": "Prestanda / lagg",
    "Anything else? (optional)": "Något annat? (valfritt)", "Send feedback": "Skicka feedback", "🙏 Thank you — we read every one.": "🙏 Tack — vi läser varje en.",
    // jail activities
    "Work Out": "Träna", "Yard Time": "Rastgården", "Working Out": "Tränar",
    "Prison Workout": "Fängelseträning", "push-ups, pull-ups, protein loaf": "armhävningar, pull-ups, proteinlimpa",
    "walking the yard, making 'connections'": "går på rastgården, knyter 'kontakter'",
    "Jailhouse Law": "Fängelsejuridik", "reading law books, filing appeals": "läser lagböcker, överklagar",
    "Doing Time": "Avtjänar straff", "staring at the bunk above": "stirrar på britsen ovanför",
    "getting swole in the yard": "blir stark på gården", "pacing the perimeter, plotting": "går runt, planerar",
    // tutorial reward
    "🎓 Tutorial complete — here's $1,000 to get you started!": "🎓 Tutorial klar — här är 1 000 kr för att komma igång!",
  };

  // ============================================================ v7.3.2 — major languages
  // Core UI coverage (HUD, tabs, statuses incl. mafia, activities, buttons, the
  // whole syndicate/turf system). Untranslated long flavor text falls back to
  // English via t(). Money stays in $ for these (only Swedish switches to SEK).
  const RU = {
    "Settings": "Настройки", "Notifications": "Уведомления", "Clear all": "Очистить всё", "PRESTIGE READY": "ПРЕСТИЖ ГОТОВ", "HUSTLE 💪": "ХАСЛ 💪", "NEXT GOAL": "СЛЕДУЮЩАЯ ЦЕЛЬ",
    "⚡ Energy": "⚡ Энергия", "🧼 Hygiene": "🧼 Гигиена", "🧠 Intelligence": "🧠 Интеллект", "🫠 Stress": "🫠 Стресс", "🌟 Reputation": "🌟 Репутация", "📱 Fans": "📱 Фанаты",
    "🙂 Fine": "🙂 Норм", "😄 Great": "😄 Отлично", "😕 Meh": "😕 Так себе", "😩 Rough": "😩 Тяжко",
    "🛒 Shop": "🛒 Магазин", "💼 Careers": "💼 Карьеры", "🦹 Crime": "🦹 Криминал", "🎯 Challenges": "🎯 Испытания", "♻️ Prestige": "♻️ Престиж", "🛠️ Gear & Home": "🛠️ Снаряжение и дом", "💎 Assets": "💎 Активы", "🧠 Skills": "🧠 Навыки", "🏆 Awards": "🏆 Награды", "📊 Stats": "📊 Статистика", "🪐 Empire": "🪐 Империя",
    "Writing Code": "Пишет код", "Making Content": "Снимает контент", "Trading Crypto": "Торгует крипту", "Building AI": "Строит ИИ", "Making Games": "Делает игры", "Studying": "Учится", "Sleeping": "Спит", "Touching Grass": "Гуляет", "Hustling": "Хаслит",
    "Running Rackets": "Крышует район", "Planning a Move": "Планирует дело", "Working the Phones": "На телефоне", "Looking for Members": "Ищет людей", "Counting the Take": "Считает навар", "A Quiet Sit-Down": "Тихая сходка",
    "Write Code": "Писать код", "Make Content": "Снимать контент", "Trade Crypto": "Торговать крипту", "Build AI": "Строить ИИ", "Make Games": "Делать игры", "Study": "Учиться", "Sleep": "Спать", "Touch Grass": "Погулять", "Run Rackets": "Крышевать",
    "Buy": "Купить", "Close": "Закрыть", "Cancel": "Отмена", "Save": "Сохранить", "Upgrade": "Улучшить", "Hire": "Нанять", "Sell all": "Продать всё", "MAX": "МАКС", "OWNED": "ЕСТЬ", "Rename": "Переименовать", "Invite": "Пригласить", "Leave": "Выйти", "Decline": "Отклонить",
    "🌍 Language": "🌍 Язык",
    "Manage the family": "Управлять семьёй", "tap to manage": "нажми, чтобы управлять", "made members": "членов семьи", "Turf map": "Карта районов", "Manage family": "Управление семьёй", "Manage": "Управление", "Syndicate pot": "Общак синдиката", "The Family": "Семья", "Recruit": "Вербовка", "Turf": "Районы", "Districts held": "Районов под контролем", "Open the turf map": "Открыть карту районов", "Disband the family": "Распустить семью", "Leave the family": "Покинуть семью", "Split the pot": "Разделить общак", "You're the boss": "Ты босс", "You're in the family": "Ты в семье", "Form a syndicate first.": "Сначала создай синдикат.", "Form the family": "Создать семью", "Start a Syndicate": "Создать синдикат", "even": "поровну", "you": "ты", "The family is gone.": "Семьи больше нет.", "No one online to recruit right now.": "Сейчас некого вербовать.", "every score kicks up a cut": "с каждого дела — доля в общак",
    "CITY TURF": "РАЙОНЫ ГОРОДА", "muscle": "силы", "No family — form one to fight": "Нет семьи — создай, чтобы воевать", "YOUR TURF": "ТВОЙ РАЙОН", "RIVAL CREW": "БАНДА-СОПЕРНИК", "AI FAMILY": "ИИ-СЕМЬЯ", "Held by": "Контролирует", "defense": "защита", "Raid odds": "Шанс налёта", "Plan the raid": "Спланировать налёт", "Go online to wage war.": "Выйди в сеть, чтобы воевать.", "This block already pays tribute to your family.": "Этот квартал уже платит твоей семье.",
  };
  const DE = {
    "Settings": "Einstellungen", "Notifications": "Mitteilungen", "Clear all": "Alle löschen", "PRESTIGE READY": "PRESTIGE BEREIT", "HUSTLE 💪": "HUSTLE 💪", "NEXT GOAL": "NÄCHSTES ZIEL",
    "⚡ Energy": "⚡ Energie", "🧼 Hygiene": "🧼 Hygiene", "🧠 Intelligence": "🧠 Intelligenz", "🫠 Stress": "🫠 Stress", "🌟 Reputation": "🌟 Ruf", "📱 Fans": "📱 Fans",
    "🙂 Fine": "🙂 Okay", "😄 Great": "😄 Super", "😕 Meh": "😕 Naja", "😩 Rough": "😩 Mies",
    "🛒 Shop": "🛒 Shop", "💼 Careers": "💼 Karrieren", "🦹 Crime": "🦹 Verbrechen", "🎯 Challenges": "🎯 Aufgaben", "♻️ Prestige": "♻️ Prestige", "🛠️ Gear & Home": "🛠️ Ausrüstung & Heim", "💎 Assets": "💎 Vermögen", "🧠 Skills": "🧠 Fähigkeiten", "🏆 Awards": "🏆 Auszeichnungen", "📊 Stats": "📊 Statistik", "🪐 Empire": "🪐 Imperium",
    "Writing Code": "Programmiert", "Making Content": "Erstellt Content", "Trading Crypto": "Handelt Krypto", "Building AI": "Baut KI", "Making Games": "Macht Spiele", "Studying": "Lernt", "Sleeping": "Schläft", "Touching Grass": "An der frischen Luft", "Hustling": "Hustlet",
    "Running Rackets": "Zieht Schutzgeld ein", "Planning a Move": "Plant einen Coup", "Working the Phones": "Am Telefon", "Looking for Members": "Sucht Leute", "Counting the Take": "Zählt die Beute", "A Quiet Sit-Down": "Stilles Treffen",
    "Write Code": "Programmieren", "Make Content": "Content machen", "Trade Crypto": "Krypto handeln", "Build AI": "KI bauen", "Make Games": "Spiele machen", "Study": "Lernen", "Sleep": "Schlafen", "Touch Grass": "Rausgehen", "Run Rackets": "Schutzgeld",
    "Buy": "Kaufen", "Close": "Schließen", "Cancel": "Abbrechen", "Save": "Speichern", "Upgrade": "Verbessern", "Hire": "Einstellen", "Sell all": "Alles verkaufen", "MAX": "MAX", "OWNED": "BESITZ", "Rename": "Umbenennen", "Invite": "Einladen", "Leave": "Verlassen", "Decline": "Ablehnen",
    "🌍 Language": "🌍 Sprache",
    "Manage the family": "Familie verwalten", "tap to manage": "zum Verwalten tippen", "made members": "Mitglieder", "Turf map": "Reviermap", "Manage family": "Familie verwalten", "Manage": "Verwalten", "Syndicate pot": "Syndikatskasse", "The Family": "Die Familie", "Recruit": "Anwerben", "Turf": "Revier", "Districts held": "Bezirke gehalten", "Open the turf map": "Reviermap öffnen", "Disband the family": "Familie auflösen", "Leave the family": "Familie verlassen", "Split the pot": "Kasse aufteilen", "You're the boss": "Du bist der Boss", "You're in the family": "Du bist in der Familie", "Form a syndicate first.": "Gründe zuerst ein Syndikat.", "Form the family": "Familie gründen", "Start a Syndicate": "Syndikat gründen", "even": "gleich", "you": "du", "The family is gone.": "Die Familie ist weg.", "No one online to recruit right now.": "Gerade niemand zum Anwerben online.", "every score kicks up a cut": "jeder Coup gibt einen Anteil ab",
    "CITY TURF": "STADTREVIER", "muscle": "Stärke", "No family — form one to fight": "Keine Familie — gründe eine zum Kämpfen", "YOUR TURF": "DEIN REVIER", "RIVAL CREW": "RIVALEN-CREW", "AI FAMILY": "KI-FAMILIE", "Held by": "Gehalten von", "defense": "Verteidigung", "Raid odds": "Überfall-Chance", "Plan the raid": "Überfall planen", "Go online to wage war.": "Geh online, um Krieg zu führen.", "This block already pays tribute to your family.": "Dieser Block zahlt schon an deine Familie.",
  };
  const FR = {
    "Settings": "Paramètres", "Notifications": "Notifications", "Clear all": "Tout effacer", "PRESTIGE READY": "PRESTIGE PRÊT", "HUSTLE 💪": "HUSTLE 💪", "NEXT GOAL": "OBJECTIF SUIVANT",
    "⚡ Energy": "⚡ Énergie", "🧼 Hygiene": "🧼 Hygiène", "🧠 Intelligence": "🧠 Intelligence", "🫠 Stress": "🫠 Stress", "🌟 Reputation": "🌟 Réputation", "📱 Fans": "📱 Fans",
    "🙂 Fine": "🙂 Ça va", "😄 Great": "😄 Super", "😕 Meh": "😕 Bof", "😩 Rough": "😩 Dur",
    "🛒 Shop": "🛒 Boutique", "💼 Careers": "💼 Carrières", "🦹 Crime": "🦹 Crime", "🎯 Challenges": "🎯 Défis", "♻️ Prestige": "♻️ Prestige", "🛠️ Gear & Home": "🛠️ Équip. & Maison", "💎 Assets": "💎 Actifs", "🧠 Skills": "🧠 Compétences", "🏆 Awards": "🏆 Récompenses", "📊 Stats": "📊 Stats", "🪐 Empire": "🪐 Empire",
    "Writing Code": "Code", "Making Content": "Crée du contenu", "Trading Crypto": "Trade la crypto", "Building AI": "Construit une IA", "Making Games": "Fait des jeux", "Studying": "Étudie", "Sleeping": "Dort", "Touching Grass": "Prend l'air", "Hustling": "Hustle",
    "Running Rackets": "Gère les rackets", "Planning a Move": "Prépare un coup", "Working the Phones": "Au téléphone", "Looking for Members": "Cherche des membres", "Counting the Take": "Compte le butin", "A Quiet Sit-Down": "Réunion discrète",
    "Write Code": "Coder", "Make Content": "Créer du contenu", "Trade Crypto": "Trader la crypto", "Build AI": "Construire une IA", "Make Games": "Faire des jeux", "Study": "Étudier", "Sleep": "Dormir", "Touch Grass": "Sortir", "Run Rackets": "Rackets",
    "Buy": "Acheter", "Close": "Fermer", "Cancel": "Annuler", "Save": "Enregistrer", "Upgrade": "Améliorer", "Hire": "Recruter", "Sell all": "Tout vendre", "MAX": "MAX", "OWNED": "POSSÉDÉ", "Rename": "Renommer", "Invite": "Inviter", "Leave": "Quitter", "Decline": "Refuser",
    "🌍 Language": "🌍 Langue",
    "Manage the family": "Gérer la famille", "tap to manage": "toucher pour gérer", "made members": "membres", "Turf map": "Carte des quartiers", "Manage family": "Gérer la famille", "Manage": "Gérer", "Syndicate pot": "Cagnotte du syndicat", "The Family": "La Famille", "Recruit": "Recruter", "Turf": "Territoire", "Districts held": "Quartiers tenus", "Open the turf map": "Ouvrir la carte", "Disband the family": "Dissoudre la famille", "Leave the family": "Quitter la famille", "Split the pot": "Partager la cagnotte", "You're the boss": "Tu es le boss", "You're in the family": "Tu es dans la famille", "Form a syndicate first.": "Forme d'abord un syndicat.", "Form the family": "Former la famille", "Start a Syndicate": "Créer un syndicat", "even": "égal", "you": "toi", "The family is gone.": "La famille n'existe plus.", "No one online to recruit right now.": "Personne à recruter en ligne.", "every score kicks up a cut": "chaque coup verse une part",
    "CITY TURF": "QUARTIERS DE LA VILLE", "muscle": "force", "No family — form one to fight": "Pas de famille — crée-en une pour combattre", "YOUR TURF": "TON QUARTIER", "RIVAL CREW": "GANG RIVAL", "AI FAMILY": "FAMILLE IA", "Held by": "Tenu par", "defense": "défense", "Raid odds": "Chances du raid", "Plan the raid": "Planifier le raid", "Go online to wage war.": "Connecte-toi pour faire la guerre.", "This block already pays tribute to your family.": "Ce quartier paie déjà ta famille.",
  };
  const ES = {
    "Settings": "Ajustes", "Notifications": "Notificaciones", "Clear all": "Borrar todo", "PRESTIGE READY": "PRESTIGIO LISTO", "HUSTLE 💪": "CURRAR 💪", "NEXT GOAL": "SIGUIENTE META",
    "⚡ Energy": "⚡ Energía", "🧼 Hygiene": "🧼 Higiene", "🧠 Intelligence": "🧠 Inteligencia", "🫠 Stress": "🫠 Estrés", "🌟 Reputation": "🌟 Reputación", "📱 Fans": "📱 Fans",
    "🙂 Fine": "🙂 Bien", "😄 Great": "😄 Genial", "😕 Meh": "😕 Regular", "😩 Rough": "😩 Fatal",
    "🛒 Shop": "🛒 Tienda", "💼 Careers": "💼 Carreras", "🦹 Crime": "🦹 Crimen", "🎯 Challenges": "🎯 Desafíos", "♻️ Prestige": "♻️ Prestigio", "🛠️ Gear & Home": "🛠️ Equipo y Hogar", "💎 Assets": "💎 Activos", "🧠 Skills": "🧠 Habilidades", "🏆 Awards": "🏆 Logros", "📊 Stats": "📊 Estadísticas", "🪐 Empire": "🪐 Imperio",
    "Writing Code": "Programando", "Making Content": "Creando contenido", "Trading Crypto": "Operando cripto", "Building AI": "Creando IA", "Making Games": "Haciendo juegos", "Studying": "Estudiando", "Sleeping": "Durmiendo", "Touching Grass": "Tomando aire", "Hustling": "Currando",
    "Running Rackets": "Cobrando protección", "Planning a Move": "Planeando un golpe", "Working the Phones": "Al teléfono", "Looking for Members": "Buscando miembros", "Counting the Take": "Contando el botín", "A Quiet Sit-Down": "Reunión discreta",
    "Write Code": "Programar", "Make Content": "Crear contenido", "Trade Crypto": "Operar cripto", "Build AI": "Crear IA", "Make Games": "Hacer juegos", "Study": "Estudiar", "Sleep": "Dormir", "Touch Grass": "Salir", "Run Rackets": "Extorsión",
    "Buy": "Comprar", "Close": "Cerrar", "Cancel": "Cancelar", "Save": "Guardar", "Upgrade": "Mejorar", "Hire": "Contratar", "Sell all": "Vender todo", "MAX": "MÁX", "OWNED": "EN PROPIEDAD", "Rename": "Renombrar", "Invite": "Invitar", "Leave": "Salir", "Decline": "Rechazar",
    "🌍 Language": "🌍 Idioma",
    "Manage the family": "Gestionar la familia", "tap to manage": "toca para gestionar", "made members": "miembros", "Turf map": "Mapa de barrios", "Manage family": "Gestionar familia", "Manage": "Gestionar", "Syndicate pot": "Bote del sindicato", "The Family": "La Familia", "Recruit": "Reclutar", "Turf": "Territorio", "Districts held": "Barrios controlados", "Open the turf map": "Abrir el mapa", "Disband the family": "Disolver la familia", "Leave the family": "Dejar la familia", "Split the pot": "Repartir el bote", "You're the boss": "Eres el jefe", "You're in the family": "Estás en la familia", "Form a syndicate first.": "Forma un sindicato primero.", "Form the family": "Formar la familia", "Start a Syndicate": "Crear un sindicato", "even": "igual", "you": "tú", "The family is gone.": "La familia ya no existe.", "No one online to recruit right now.": "No hay nadie para reclutar ahora.", "every score kicks up a cut": "cada golpe aporta una parte",
    "CITY TURF": "BARRIOS DE LA CIUDAD", "muscle": "fuerza", "No family — form one to fight": "Sin familia — crea una para luchar", "YOUR TURF": "TU BARRIO", "RIVAL CREW": "BANDA RIVAL", "AI FAMILY": "FAMILIA IA", "Held by": "En manos de", "defense": "defensa", "Raid odds": "Probabilidad de asalto", "Plan the raid": "Planear el asalto", "Go online to wage war.": "Conéctate para hacer la guerra.", "This block already pays tribute to your family.": "Este barrio ya paga a tu familia.",
  };
  const PT = {
    "Settings": "Configurações", "Notifications": "Notificações", "Clear all": "Limpar tudo", "PRESTIGE READY": "PRESTÍGIO PRONTO", "HUSTLE 💪": "CORRER ATRÁS 💪", "NEXT GOAL": "PRÓXIMA META",
    "⚡ Energy": "⚡ Energia", "🧼 Hygiene": "🧼 Higiene", "🧠 Intelligence": "🧠 Inteligência", "🫠 Stress": "🫠 Estresse", "🌟 Reputation": "🌟 Reputação", "📱 Fans": "📱 Fãs",
    "🙂 Fine": "🙂 Ok", "😄 Great": "😄 Ótimo", "😕 Meh": "😕 Mais ou menos", "😩 Rough": "😩 Difícil",
    "🛒 Shop": "🛒 Loja", "💼 Careers": "💼 Carreiras", "🦹 Crime": "🦹 Crime", "🎯 Challenges": "🎯 Desafios", "♻️ Prestige": "♻️ Prestígio", "🛠️ Gear & Home": "🛠️ Equip. e Casa", "💎 Assets": "💎 Ativos", "🧠 Skills": "🧠 Habilidades", "🏆 Awards": "🏆 Conquistas", "📊 Stats": "📊 Estatísticas", "🪐 Empire": "🪐 Império",
    "Writing Code": "Programando", "Making Content": "Criando conteúdo", "Trading Crypto": "Operando cripto", "Building AI": "Criando IA", "Making Games": "Fazendo jogos", "Studying": "Estudando", "Sleeping": "Dormindo", "Touching Grass": "Tomando ar", "Hustling": "Correndo atrás",
    "Running Rackets": "Cobrando proteção", "Planning a Move": "Planejando um golpe", "Working the Phones": "No telefone", "Looking for Members": "Procurando membros", "Counting the Take": "Contando o butim", "A Quiet Sit-Down": "Reunião discreta",
    "Write Code": "Programar", "Make Content": "Criar conteúdo", "Trade Crypto": "Operar cripto", "Build AI": "Criar IA", "Make Games": "Fazer jogos", "Study": "Estudar", "Sleep": "Dormir", "Touch Grass": "Sair", "Run Rackets": "Extorsão",
    "Buy": "Comprar", "Close": "Fechar", "Cancel": "Cancelar", "Save": "Salvar", "Upgrade": "Melhorar", "Hire": "Contratar", "Sell all": "Vender tudo", "MAX": "MÁX", "OWNED": "ADQUIRIDO", "Rename": "Renomear", "Invite": "Convidar", "Leave": "Sair", "Decline": "Recusar",
    "🌍 Language": "🌍 Idioma",
    "Manage the family": "Gerenciar a família", "tap to manage": "toque para gerenciar", "made members": "membros", "Turf map": "Mapa de territórios", "Manage family": "Gerenciar família", "Manage": "Gerenciar", "Syndicate pot": "Caixa do sindicato", "The Family": "A Família", "Recruit": "Recrutar", "Turf": "Território", "Districts held": "Distritos controlados", "Open the turf map": "Abrir o mapa", "Disband the family": "Dissolver a família", "Leave the family": "Deixar a família", "Split the pot": "Dividir o caixa", "You're the boss": "Você é o chefe", "You're in the family": "Você está na família", "Form a syndicate first.": "Forme um sindicato primeiro.", "Form the family": "Formar a família", "Start a Syndicate": "Criar um sindicato", "even": "igual", "you": "você", "The family is gone.": "A família acabou.", "No one online to recruit right now.": "Ninguém para recrutar agora.", "every score kicks up a cut": "cada golpe rende uma parte",
    "CITY TURF": "TERRITÓRIOS DA CIDADE", "muscle": "força", "No family — form one to fight": "Sem família — crie uma para lutar", "YOUR TURF": "SEU TERRITÓRIO", "RIVAL CREW": "GANGUE RIVAL", "AI FAMILY": "FAMÍLIA IA", "Held by": "Controlado por", "defense": "defesa", "Raid odds": "Chance do ataque", "Plan the raid": "Planejar o ataque", "Go online to wage war.": "Fique online para guerrear.", "This block already pays tribute to your family.": "Este bairro já paga à sua família.",
  };
  const IT = {
    "Settings": "Impostazioni", "Notifications": "Notifiche", "Clear all": "Cancella tutto", "PRESTIGE READY": "PRESTIGIO PRONTO", "HUSTLE 💪": "DATTI DA FARE 💪", "NEXT GOAL": "PROSSIMO OBIETTIVO",
    "⚡ Energy": "⚡ Energia", "🧼 Hygiene": "🧼 Igiene", "🧠 Intelligence": "🧠 Intelligenza", "🫠 Stress": "🫠 Stress", "🌟 Reputation": "🌟 Reputazione", "📱 Fans": "📱 Fan",
    "🙂 Fine": "🙂 Ok", "😄 Great": "😄 Alla grande", "😕 Meh": "😕 Così così", "😩 Rough": "😩 Dura",
    "🛒 Shop": "🛒 Negozio", "💼 Careers": "💼 Carriere", "🦹 Crime": "🦹 Crimine", "🎯 Challenges": "🎯 Sfide", "♻️ Prestige": "♻️ Prestigio", "🛠️ Gear & Home": "🛠️ Attrezz. e Casa", "💎 Assets": "💎 Beni", "🧠 Skills": "🧠 Abilità", "🏆 Awards": "🏆 Premi", "📊 Stats": "📊 Statistiche", "🪐 Empire": "🪐 Impero",
    "Writing Code": "Programma", "Making Content": "Crea contenuti", "Trading Crypto": "Fa trading cripto", "Building AI": "Costruisce IA", "Making Games": "Crea giochi", "Studying": "Studia", "Sleeping": "Dorme", "Touching Grass": "Prende aria", "Hustling": "Si dà da fare",
    "Running Rackets": "Gestisce il pizzo", "Planning a Move": "Pianifica un colpo", "Working the Phones": "Al telefono", "Looking for Members": "Cerca uomini", "Counting the Take": "Conta il bottino", "A Quiet Sit-Down": "Incontro riservato",
    "Write Code": "Programmare", "Make Content": "Creare contenuti", "Trade Crypto": "Tradare cripto", "Build AI": "Costruire IA", "Make Games": "Creare giochi", "Study": "Studiare", "Sleep": "Dormire", "Touch Grass": "Uscire", "Run Rackets": "Pizzo",
    "Buy": "Compra", "Close": "Chiudi", "Cancel": "Annulla", "Save": "Salva", "Upgrade": "Potenzia", "Hire": "Assumi", "Sell all": "Vendi tutto", "MAX": "MAX", "OWNED": "POSSEDUTO", "Rename": "Rinomina", "Invite": "Invita", "Leave": "Esci", "Decline": "Rifiuta",
    "🌍 Language": "🌍 Lingua",
    "Manage the family": "Gestisci la famiglia", "tap to manage": "tocca per gestire", "made members": "affiliati", "Turf map": "Mappa dei quartieri", "Manage family": "Gestisci famiglia", "Manage": "Gestisci", "Syndicate pot": "Cassa del sindacato", "The Family": "La Famiglia", "Recruit": "Recluta", "Turf": "Territorio", "Districts held": "Quartieri controllati", "Open the turf map": "Apri la mappa", "Disband the family": "Sciogli la famiglia", "Leave the family": "Lascia la famiglia", "Split the pot": "Dividi la cassa", "You're the boss": "Sei il boss", "You're in the family": "Sei nella famiglia", "Form a syndicate first.": "Prima forma un sindacato.", "Form the family": "Forma la famiglia", "Start a Syndicate": "Crea un sindacato", "even": "equa", "you": "tu", "The family is gone.": "La famiglia non c'è più.", "No one online to recruit right now.": "Nessuno da reclutare ora.", "every score kicks up a cut": "ogni colpo versa una quota",
    "CITY TURF": "QUARTIERI DELLA CITTÀ", "muscle": "forza", "No family — form one to fight": "Niente famiglia — creane una per combattere", "YOUR TURF": "IL TUO QUARTIERE", "RIVAL CREW": "BANDA RIVALE", "AI FAMILY": "FAMIGLIA IA", "Held by": "Controllato da", "defense": "difesa", "Raid odds": "Probabilità del raid", "Plan the raid": "Pianifica il raid", "Go online to wage war.": "Vai online per la guerra.", "This block already pays tribute to your family.": "Questo isolato paga già la tua famiglia.",
  };

  const DICTS = { sv: SV, ru: RU, de: DE, fr: FR, es: ES, pt: PT, it: IT };

  function t(s) {
    if (lang === "en") return s;
    const d = DICTS[lang];
    return (d && d[s]) || s;
  }
  function setLang(l) {
    lang = DICTS[l] || l === "en" ? l : "en";
    try { localStorage.setItem("wb_lang", lang); } catch (e) {}
  }

  // Walk a DOM subtree and translate text nodes (covers rendered tabs).
  // Exact match first; then with the leading icon/emoji stripped (so a node
  // like "💻 Laptop" translates via the dict key "Laptop").
  const ICON_PREFIX = /^[^\p{L}\p{N}]+\s*/u;
  function translateDom(root) {
    if (lang === "en" || !root) return;
    const d = DICTS[lang];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const s = n.nodeValue.trim();
      if (!s) continue;
      if (d[s]) { n.nodeValue = n.nodeValue.replace(s, d[s]); continue; }
      const m = s.match(ICON_PREFIX);
      if (m) {
        const rest = s.slice(m[0].length);
        if (rest && d[rest]) n.nodeValue = n.nodeValue.replace(rest, d[rest]);
      }
    }
  }

  // ---- SEK money formatting (Swedish): "1,2 mn kr" style suffixes ----
  const origFmt = WB.fmt;
  WB.fmt = function (n, money) {
    if (lang !== "sv" || !money) return origFmt(n, money);
    const plain = origFmt(n, false); // "1.2K" etc — keep magnitude suffixes, swap decimal comma
    return plain.replace(".", ",") + " kr";
  };

  // translate static page chrome on load
  document.addEventListener("DOMContentLoaded", () => {
    if (lang === "en") return;
    document.querySelectorAll("[data-i18n]").forEach(el => { el.innerHTML = t(el.getAttribute("data-i18n")); });
  });

  return { t, setLang, lang: () => lang, translateDom };
})();
WB.t = WB.I18N.t;
