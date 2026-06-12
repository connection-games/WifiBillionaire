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

  // Walk a DOM subtree and translate exact-match text nodes (covers rendered tabs).
  function translateDom(root) {
    if (lang === "en" || !root) return;
    const d = DICTS[lang];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const s = n.nodeValue.trim();
      if (s && d[s]) n.nodeValue = n.nodeValue.replace(s, d[s]);
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
