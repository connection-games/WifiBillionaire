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
    "All-time earnings": "Intjänat totalt", "Era": "Era", "Play time": "Speltid", "Hustle clicks": "Hustleklick",
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

  const DICTS = { sv: SV };

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
