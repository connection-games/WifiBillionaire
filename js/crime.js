/* WiFi Billionaire — crime category: instant-commit crimes, heat, prison, payouts.
   The interactive phishing/scam mode lives in scam.js; this module owns the rest:
   crime definitions, the catch/heat math, jail time, and bail. */
'use strict';

WB.CRIME = (function () {
  const S = () => WB.GAME.state;
  const ips = () => WB.GAME.incomePerSec();
  const now = () => Date.now();

  // Crime categories shown as sub-tabs in the Underworld. Robberies = the heists
  // (HARD_CRIMES); the rest are instant "quick jobs" (CRIMES) tagged with `cat`.
  const CATS = [
    { id: "street",     name: "Street",     icon: "🧤" },
    { id: "scams",      name: "Scams",      icon: "💬" },
    { id: "hacking",    name: "Hacking",    icon: "💻" },
    { id: "fraud",      name: "Fraud",      icon: "🎩" },
    { id: "smuggling",  name: "Smuggling",  icon: "📦" },
    { id: "robberies",  name: "Robberies",  icon: "🔫" },
  ];

  // payout = `minutes of income` * range, so crime scales with your operation, not flat.
  // risk = base catch chance. sentence = jail seconds if caught. heat = added on success.
  const CRIMES = [
    // ---------------- 🧤 STREET — petty, early-game, low risk/reward ----------------
    { id: "pickpocket", name: "Pickpocketing", icon: "👛", cat: "street",
      desc: "Bump into tourists near the {platform} crowd and lighten their pockets.",
      mins: [1, 3], risk: 0.10, sentence: 60, heat: 4, reqLevel: 0,
      flavorWin: ["A wallet, a phone, and somebody's grandma's locket. Sorry, grandma.", "Light fingers, lighter conscience. Easy money."],
      flavorLoss: ["You picked an off-duty cop. Of all the pockets.", "The 'tourist' was a plainclothes officer. Rookie mistake."] },
    { id: "shoplift", name: "Shoplifting Spree", icon: "🛍️", cat: "street",
      desc: "Walk into the mall with an empty bag and walk out with a full one.",
      mins: [2, 4], risk: 0.12, sentence: 80, heat: 5, reqLevel: 1,
      flavorWin: ["The anti-theft tags never stood a chance.", "Five-finger discount: 100% off, plus tax evasion."],
      flavorLoss: ["The greeter at the door was security. Friendly, then not.", "Caught on 14 cameras you somehow didn't see."] },
    { id: "vending", name: "Vending Machine Raid", icon: "🥤", cat: "street",
      desc: "You found a video on how to make any vending machine cry coins.",
      mins: [2, 5], risk: 0.13, sentence: 90, heat: 5, reqLevel: 1,
      flavorWin: ["$300 in quarters and 40 bags of chips. Dinner sorted.", "The machine gave up everything. Snacks AND cash."],
      flavorLoss: ["The machine ate your arm AND called the cops.", "Turns out the campus has guards. Who knew."] },
    { id: "bikejack", name: "Bike 'Borrowing'", icon: "🚲", cat: "street",
      desc: "Bolt cutters, a clear conscience, and a row of unlocked e-bikes.",
      mins: [2, 5], risk: 0.14, sentence: 100, heat: 6, reqLevel: 2,
      flavorWin: ["Flipped six e-bikes by lunch. The gig economy, reimagined.", "It's not stealing if you sell it fast enough. (It is.)"],
      flavorLoss: ["The owner had an AirTag. And rage. Mostly rage.", "Bolt cutters jammed mid-cut. The cops did not."] },
    { id: "monte", name: "Three-Card Monte", icon: "🃏", cat: "street",
      desc: "Set up a folding table downtown. The hand is quicker than the eye.",
      mins: [3, 6], risk: 0.15, sentence: 90, heat: 6, reqLevel: 3,
      flavorWin: ["The queen is NEVER where they think. Tourists love to lose.", "A crowd, a card, a con. Showbiz, basically."],
      flavorLoss: ["One of the 'marks' was a vice cop. Show's over.", "A sore loser flipped your table. And called 911."] },
    { id: "catalytic", name: "Catalytic Converter Job", icon: "🔧", cat: "street",
      desc: "Two minutes under a parked SUV with a battery saw. Precious metals inside.",
      mins: [4, 8], risk: 0.18, sentence: 140, heat: 8, reqLevel: 5,
      flavorWin: ["Palladium pays. Eleven SUVs, one very loud night.", "The scrapyard didn't ask questions. They never do."],
      flavorLoss: ["The SUV had a dashcam. And an owner who was 'home'.", "Sparks, an alarm, and headlights. Yours, then theirs."] },

    // ---------------- 💬 SCAMS — social engineering ----------------
    { id: "fakestore", name: "Fake Online Store", icon: "🛒", cat: "scams",
      desc: "Spin up a store that takes orders and ships nothing.",
      mins: [3, 8], risk: 0.12, sentence: 120, heat: 6, reqLevel: 0,
      flavorWin: ["Orders rolled in. Tracking numbers did not.", "Five-star reviews from accounts you made. Genius."],
      flavorLoss: ["A customer reverse-image-searched your 'warehouse'. It was a stock photo.", "Chargebacks. So many chargebacks. Then a knock at the door."] },
    { id: "phishing", name: "Phishing Emails", icon: "🎣", cat: "scams",
      desc: "'Your account has been suspended. Click here to definitely not get robbed.'",
      mins: [3, 7], risk: 0.14, sentence: 110, heat: 7, reqLevel: 2,
      flavorWin: ["10,000 emails, 200 logins, one great afternoon.", "People really will type their password anywhere. Beautiful."],
      flavorLoss: ["You phished the IT department. They phished back, with cops.", "One target was a security researcher. Whoops."] },
    { id: "giftcard", name: "Gift Card Scam", icon: "🎁", cat: "scams",
      desc: "'Hi it's your boss, buy $500 in gift cards and read me the codes urgently.'",
      mins: [3, 8], risk: 0.15, sentence: 120, heat: 7, reqLevel: 3,
      flavorWin: ["The codes came in faster than you could redeem them.", "Turns out 'urgency' melts everyone's common sense."],
      flavorLoss: ["The 'employee' looped in the actual boss. And the FBI.", "Store clerk recognized the scam and stalled you for the cops."] },
    { id: "techsupport", name: "Tech Support Scam", icon: "🖥️", cat: "scams",
      desc: "'Hello, I am calling from Definitely-Microsoft about your computer virus.'",
      mins: [4, 9], risk: 0.16, sentence: 140, heat: 8, reqLevel: 3,
      flavorWin: ["Remote access granted. Grandma trusts me completely.", "$1,200 to remove a virus that was just a popup I made."],
      flavorLoss: ["The 'grandma' was a scam-baiter with a YouTube channel.", "You got counter-hacked live on a stream. Humbling."] },
    { id: "faketicket", name: "Counterfeit Tickets", icon: "🎫", cat: "scams",
      desc: "Sell the same front-row concert seat to nine different people.",
      mins: [4, 9], risk: 0.16, sentence: 130, heat: 8, reqLevel: 4,
      flavorWin: ["Nine buyers, one seat, zero refunds. Sold out!", "The QR codes scanned perfectly. Once."],
      flavorLoss: ["All nine buyers showed up. At the same gate. Together.", "Ticketmaster's fraud team had notes. Detailed ones."] },
    { id: "romance", name: "Romance Scam", icon: "💔", cat: "scams",
      desc: "A lonely heart, a fake oil-rig engineer, and a steady drip of 'emergencies'.",
      mins: [5, 11], risk: 0.18, sentence: 180, heat: 9, reqLevel: 4,
      flavorWin: ["'I just need money for a plane ticket to finally meet you, my love.'", "Six months of texts, one very profitable broken heart."],
      flavorLoss: ["Her son was a detective. The dinner invite was a sting.", "You fell for your own mark. Then she scammed you. Karma."] },
    { id: "charity", name: "Fake Charity", icon: "🎗️", cat: "scams",
      desc: "Tug heartstrings, pocket donations. The orphans are stock photos.",
      mins: [6, 13], risk: 0.20, sentence: 220, heat: 11, reqLevel: 6,
      flavorWin: ["'100% goes to the cause.' The cause is your rent.", "Tax-deductible for them, tax-free for you. Win-win-crime."],
      flavorLoss: ["A real journalist asked where the money went. Awkward.", "The 'charity gala' got raided between the soup and the speeches."] },
    { id: "rugpull", name: "Crypto Rug Pull", icon: "🪙", cat: "scams",
      desc: "Launch {coin}, pump it, vanish with the liquidity.",
      mins: [14, 30], risk: 0.3, sentence: 500, heat: 22, reqLevel: 14, reqSkill: { trading: 18 },
      flavorWin: ["Liquidity: pulled. Community: devastated. Wallet: full.", "You tweeted 'sorry anon' and bought an island."],
      flavorLoss: ["The holders doxxed you in 40 minutes. Crypto people are fast.", "On-chain forensics are real, apparently. Who knew."] },
    { id: "mlm", name: "Launch an MLM", icon: "🧴", cat: "scams",
      desc: "It's not a pyramid. It's a 'direct-sales family'. (It's a pyramid.)",
      mins: [16, 34], risk: 0.26, sentence: 360, heat: 16, reqLevel: 10, reqSkill: { business: 14 },
      flavorWin: ["Your downline bought 40,000 bottles of magic juice. Boss babe!", "They pay YOU to sell to their friends. Genius and evil."],
      flavorLoss: ["The FTC used the word 'pyramid' in a press release. Yours.", "Your top recruiter flipped and testified. With slides."] },

    // ---------------- 💻 HACKING — technical ----------------
    { id: "carding", name: "Card Skimming", icon: "💳", cat: "hacking",
      desc: "Skim card numbers off a sketchy payment page.",
      mins: [5, 12], risk: 0.2, sentence: 200, heat: 10, reqLevel: 5, reqSkill: { coding: 8 },
      flavorWin: ["Numbers harvested. The dark web tips its hat.", "Quick, clean, deeply illegal. Nice."],
      flavorLoss: ["Turns out the bank has a fraud team. A good one.", "You skimmed a detective's card. Of all the cards."] },
    { id: "simswap", name: "SIM Swap Attack", icon: "📱", cat: "hacking",
      desc: "Sweet-talk a phone-store rep into porting a whale's number to you.",
      mins: [6, 13], risk: 0.20, sentence: 200, heat: 11, reqLevel: 8, reqSkill: { coding: 12 },
      flavorWin: ["Their 2FA texts come to ME now. Drained in minutes.", "One phone number, every account. The keys to the kingdom."],
      flavorLoss: ["The carrier flagged the swap and looped in the feds.", "Your target was a security influencer. He livetweeted your arrest."] },
    { id: "databreach", name: "Corporate Data Breach", icon: "🗄️", cat: "hacking",
      desc: "Slip through an unpatched server and walk out with the customer database.",
      mins: [10, 22], risk: 0.26, sentence: 360, heat: 17, reqLevel: 14, reqSkill: { coding: 18 },
      flavorWin: ["Ten million records. The dark web is having a sale.", "Their security was a default password. 'admin'. Of course."],
      flavorLoss: ["They had a honeypot. You walked right into it.", "The logs you forgot to wipe walked the cops right to you."] },
    { id: "ddos", name: "DDoS-for-Hire", icon: "🌐", cat: "hacking",
      desc: "Rent out your botnet to people with grudges.",
      mins: [10, 22], risk: 0.28, sentence: 420, heat: 18, reqLevel: 16, reqSkill: { coding: 22 },
      flavorWin: ["Someone's competitor is having a very slow day.", "Payment in crypto, chaos delivered on schedule."],
      flavorLoss: ["You DDoS'd a server the FBI was hosting. Bold.", "Your botnet had a snitch in it. They always do."] },
    { id: "zeroday", name: "Sell a Zero-Day", icon: "🐛", cat: "hacking",
      desc: "You found a flaw nobody knows about. Shady buyers pay shady money.",
      mins: [18, 36], risk: 0.30, sentence: 560, heat: 24, reqLevel: 19, reqSkill: { coding: 24 },
      flavorWin: ["A nameless agency wired seven figures. No questions, ever.", "One bug, sold three times to three governments. Efficient."],
      flavorLoss: ["The 'buyer' was the vendor's own threat-intel team.", "Your exploit got traced to your dev machine. Sloppy commit."] },
    { id: "ransomware", name: "Ransomware Attack", icon: "🔒", cat: "hacking",
      desc: "Encrypt a hospital's files, demand crypto. (Ethically? No. Profitably? Yes.)",
      mins: [14, 28], risk: 0.28, sentence: 420, heat: 20, reqLevel: 16, reqSkill: { coding: 20 },
      flavorWin: ["They paid in 40 minutes. Backups were 'for next quarter'.", "The decryption key cost them a fortune. You're welcome."],
      flavorLoss: ["You hit a city that called in a federal cyber unit.", "A researcher cracked your encryption and posted the antidote."] },
    { id: "exchangehack", name: "Crypto Exchange Hack", icon: "🏧", cat: "hacking",
      desc: "Drain a sketchy exchange's hot wallet through a contract they never audited.",
      mins: [24, 46], risk: 0.34, sentence: 700, heat: 30, reqLevel: 22, reqSkill: { coding: 28 },
      flavorWin: ["$40M out the door before they noticed the door.", "You left a taunting note in the transaction memo. Iconic."],
      flavorLoss: ["The mixer you used got seized last week. With logs.", "Chain analysis tagged every wallet. Funds frozen, you next."] },

    // ---------------- 🎩 FRAUD — white collar ----------------
    { id: "invoicefraud", name: "Invoice Fraud", icon: "📄", cat: "fraud",
      desc: "Email a company a totally real-looking bill from a totally fake vendor.",
      mins: [7, 16], risk: 0.19, sentence: 260, heat: 11, reqLevel: 8,
      flavorWin: ["Accounts Payable paid it without blinking. Twice.", "A $90k invoice for 'consulting services rendered'. Beautiful fiction."],
      flavorLoss: ["Their new CFO actually reads invoices. Monster.", "The bank flagged the transfer and reversed it. With a report."] },
    { id: "taxfraud", name: "Tax Fraud", icon: "🧾", cat: "fraud",
      desc: "Deductions for a yacht, a 'home office' the size of a yacht, and three fake kids.",
      mins: [8, 18], risk: 0.20, sentence: 280, heat: 12, reqLevel: 9, reqSkill: { business: 12 },
      flavorWin: ["The refund cleared. The IRS believes in my six dependents.", "Every receipt is 'business'. Even the jet ski. Especially the jet ski."],
      flavorLoss: ["The audit found the kids don't exist. Or the yacht.", "Turns out the IRS does, in fact, do math."] },
    { id: "identity", name: "Identity Theft", icon: "🪪", cat: "fraud",
      desc: "Become someone else, financially speaking.",
      mins: [8, 18], risk: 0.24, sentence: 320, heat: 14, reqLevel: 10, reqSkill: { coding: 14 },
      flavorWin: ["You opened 6 credit lines as 'Gerald'. Sorry, Gerald.", "Gerald's credit score is now your problem. And income."],
      flavorLoss: ["The real Gerald noticed. Gerald has a lawyer cousin.", "Identity returned to sender. With handcuffs."] },
    { id: "pumpdump", name: "Pump & Dump", icon: "📊", cat: "fraud",
      desc: "Hype a penny stock in your 'finance guru' group, sell into the frenzy.",
      mins: [10, 22], risk: 0.26, sentence: 340, heat: 16, reqLevel: 13, reqSkill: { trading: 18 },
      flavorWin: ["'To the moon!' you posted, while quietly selling everything.", "The group still holds. You're already out. Diamond hands, suckers."],
      flavorLoss: ["The SEC reads group chats now, apparently.", "A whale dumped before you did. The bag is yours."] },
    { id: "insider", name: "Insider Trading", icon: "📈", cat: "fraud",
      desc: "Your golf buddy runs a pharma firm and 'mentioned' tomorrow's announcement.",
      mins: [12, 26], risk: 0.24, sentence: 380, heat: 16, reqLevel: 12, reqSkill: { trading: 16 },
      flavorWin: ["Bought before the news, sold after. Suspiciously perfect timing.", "It's only insider trading if they can prove the golf game."],
      flavorLoss: ["The SEC subpoenaed the country club's tee sheet.", "Your 'lucky' trades formed a very illegal pattern."] },
    { id: "embezzle", name: "Embezzlement", icon: "💼", cat: "fraud",
      desc: "Skim a little off every transaction at the company you definitely work for.",
      mins: [14, 30], risk: 0.28, sentence: 460, heat: 19, reqLevel: 15, reqSkill: { business: 18 },
      flavorWin: ["A fraction of a cent, a million times. The classics work.", "The 'miscellaneous expenses' line item is doing heavy lifting."],
      flavorLoss: ["A forensic accountant found the rounding. They always find the rounding.", "Your second set of books met your first set of books. In court."] },
    { id: "ponzi", name: "Ponzi Scheme", icon: "🏦", cat: "fraud",
      desc: "Pay old investors with new investors. Forever. (It's never forever.)",
      mins: [22, 50], risk: 0.34, sentence: 800, heat: 30, reqLevel: 20, reqSkill: { business: 20 },
      flavorWin: ["The returns are 'guaranteed'. The math is not.", "New money covers old money covers your new yacht."],
      flavorLoss: ["The music stopped. You were holding the chair.", "An investor asked to 'just see the books'. The end."] },

    // ---------------- 📦 SMUGGLING — black market goods ----------------
    { id: "bootleg", name: "Bootleg Streams", icon: "📺", cat: "smuggling",
      desc: "Resell pirated pay-per-views and premium streams from a server in your closet.",
      mins: [3, 7], risk: 0.14, sentence: 120, heat: 7, reqLevel: 3,
      flavorWin: ["2,000 subscribers paying $5 to watch stolen boxing. Ding ding.", "The closet server is hot, loud, and extremely profitable."],
      flavorLoss: ["The studio's anti-piracy bots traced the closet. Your closet.", "A 'subscriber' was a copyright lawyer. They had popcorn."] },
    { id: "counterfeit", name: "Counterfeit Sneakers", icon: "👟", cat: "smuggling",
      desc: "Sell 'limited edition' kicks made in a very unlimited factory.",
      mins: [4, 10], risk: 0.16, sentence: 160, heat: 8, reqLevel: 4,
      flavorWin: ["'Authentic'. The glue smell adds character.", "Hypebeasts paid retail for $4 of materials. Beautiful."],
      flavorLoss: ["A customer noticed the logo said 'Nikee'. Sloppy.", "Customs opened the container. Customs was not amused."] },
    { id: "knockoff", name: "Knockoff Electronics", icon: "🔌", cat: "smuggling",
      desc: "Import 'iPhone 15 Pro Maxx' units. Two X's. Totally different product, legally.",
      mins: [5, 11], risk: 0.17, sentence: 180, heat: 9, reqLevel: 5,
      flavorWin: ["They charge! Sometimes! For a while! Sold out anyway.", "The 'Samsong' tablets flew off the shelf. Refunds pending forever."],
      flavorLoss: ["One unit caught fire on a customer's nightstand. Lawsuits.", "Customs has a whole warehouse of your 'AirBuds' now."] },
    { id: "exoticpet", name: "Exotic Pet Trade", icon: "🦜", cat: "smuggling",
      desc: "Move rare parrots and tiny tortoises across borders in questionable luggage.",
      mins: [8, 18], risk: 0.22, sentence: 300, heat: 13, reqLevel: 10,
      flavorWin: ["A collector paid a fortune for a bird that won't shut up.", "The tortoises were slow. The profit was not."],
      flavorLoss: ["The parrot squawked 'CALL THE COPS' at the airport. It learned.", "A wildlife officer with a sniffer dog ruined everything."] },
    { id: "fakeart", name: "Forged Masterpiece", icon: "🖼️", cat: "smuggling",
      desc: "Paint a 'lost' masterwork, age it with tea and lies, sell to a gullible gallery.",
      mins: [10, 22], risk: 0.24, sentence: 340, heat: 15, reqLevel: 12,
      flavorWin: ["The gallery hung your forgery next to the real thing. Nobody noticed.", "An 'authenticated' fake sold at auction. The bidders applauded."],
      flavorLoss: ["The expert noticed the paint was drying. Literally.", "Carbon dating put your 'Renaissance' piece at last Tuesday."] },
    { id: "contraband", name: "Smuggle Contraband", icon: "🚢", cat: "smuggling",
      desc: "Hide product inside a shipping container of rubber ducks. Nobody checks the ducks.",
      mins: [12, 26], risk: 0.28, sentence: 420, heat: 18, reqLevel: 14,
      flavorWin: ["20,000 rubber ducks, one very profitable false bottom.", "The manifest said 'novelty toys'. It was not lying. Mostly."],
      flavorLoss: ["This time, they checked the ducks. Always check the ducks.", "A port scanner lit up like a Christmas tree. Yours."] },

    // ---------------- 🧼 Utility (shown in every category) ----------------
    { id: "launder", name: "Launder Heat", icon: "🧼", launder: true, cat: "fraud",
      desc: "Run dirty money through a 'car wash empire' to cool things down.",
      mins: [0, 0], risk: 0, sentence: 0, heat: 0, reqLevel: 0,
      flavorWin: ["The books are squeaky clean now. Allegedly."] },
  ];

  function crimeState() {
    const s = S();
    if (!s.crime) s.crime = { heat: 0, prisonUntil: 0, prisonReason: "", timesCaught: 0, crimeEarnings: 0, crimesDone: 0, scamSuccess: 0, scamFail: 0, victimsScammed: {} };
    return s.crime;
  }

  const inPrison = () => crimeState().prisonUntil > now();
  const prisonLeft = () => Math.max(0, crimeState().prisonUntil - now());
  const heat = () => crimeState().heat;

  function addHeat(n) {
    const c = crimeState();
    c.heat = Math.max(0, Math.min(100, c.heat + n));
  }
  function addDirtyMoney(amount) {
    const c = crimeState();
    WB.GAME.earn(amount);
    c.crimeEarnings += amount;
  }

  function goToPrison(sec, reason, skipCutscene) {
    const c = crimeState();
    c.prisonUntil = now() + sec * 1000;
    c.prisonReason = reason;
    c.timesCaught++;
    // The heist-bust movie already drove us to jail, so it passes skipCutscene
    // to avoid playing the generic door-knock "arrest" scene on top of it.
    if (!skipCutscene && WB.ROOM && WB.ROOM.play) WB.ROOM.play("arrest"); // sirens, cuffs, the ride downtown
    WB.UI.toast(`🚔 BUSTED: ${reason} — ${WB.fmtTime(sec)} in jail. Manual actions are locked.`, "bad");
    WB.UI.bubble(WB.pick([
      "Okay this is fine. This is a networking opportunity. In prison.",
      "One phone call. I'm calling my accountant.",
      "I regret nothing. I regret some things. I regret getting caught.",
    ]));
    if (WB.UI.showPrison) WB.UI.showPrison();
  }

  function bailCost() {
    const c = crimeState();
    const left = prisonLeft() / 1000;
    return Math.max(500, ips() * left * 1.5 + left * 50);
  }
  function postBail() {
    const c = crimeState();
    if (!inPrison()) return false;
    const cost = bailCost();
    if (S().money < cost) { WB.UI.toast("💸 Can't afford bail. Wait it out.", "bad"); return false; }
    S().money -= cost;
    c.prisonUntil = 0;
    addHeat(8);
    if (WB.ROOM && WB.ROOM.play) WB.ROOM.play("release"); // money opens doors. literally.
    WB.UI.toast(`⚖️ Posted bail for ${WB.fmt(cost, true)}. Free… for now. (+heat)`, "good");
    return true;
  }

  function eligible(cr) {
    const s = S();
    if (cr.reqLevel && WB.GAME.charLevel() < cr.reqLevel) return { ok: false, why: `Needs character level ${cr.reqLevel}` };
    if (cr.reqSkill) {
      for (const [k, lv] of Object.entries(cr.reqSkill)) {
        if (s.skills[k].level < lv) return { ok: false, why: `Needs ${WB.DATA.SKILLS[k].name} lvl ${lv}` };
      }
    }
    return { ok: true };
  }

  function catchChance(cr) {
    const c = crimeState();
    let p = cr.risk + c.heat * 0.0035 - WB.GAME.luck() * 0.012;
    // relevant skill lowers risk
    if (cr.reqSkill) {
      const k = Object.keys(cr.reqSkill)[0];
      p -= S().skills[k].level * 0.0025;
    }
    return Math.max(0.03, Math.min(0.9, p));
  }

  function commit(id) {
    const s = S(), c = crimeState();
    const cr = CRIMES.find(x => x.id === id);
    if (!cr) return null;
    if (inPrison()) return { refused: "You're in jail. Sit tight." };
    const el = eligible(cr);
    if (!el.ok) return { refused: el.why };

    if (cr.launder) {
      const cost = Math.max(200, s.money * 0.08);
      if (s.money < cost) return { refused: "Need more cash to launder convincingly." };
      s.money -= cost;
      addHeat(-35);
      return { icon: "🧼", title: "Money Laundered", win: true,
        lines: [WB.pick(cr.flavorWin), `Paid ${WB.fmt(cost, true)} in 'expenses'. Heat dropped a lot.`], money: -cost };
    }

    const caught = WB.chance(catchChance(cr));
    if (caught) {
      c.scamFail++;
      addHeat(cr.heat * 0.6);
      const sentence = Math.round(cr.sentence * (1 + c.heat / 200));
      goToPrison(sentence, cr.name);
      return { icon: "🚔", title: "Caught!", win: false,
        lines: [WB.pick(cr.flavorLoss), `Sentence: ${WB.fmtTime(sentence)}.`], money: 0, caught: true };
    }
    const payout = ips() * 60 * WB.rand(cr.mins[0], cr.mins[1]) + 50;
    addDirtyMoney(payout);
    addHeat(cr.heat);
    c.crimesDone++;
    WB.GAME.gainXp("business", 30);
    return { icon: cr.icon, title: cr.name + " — Success", win: true,
      lines: [WB.THOUGHTS.fill(WB.pick(cr.flavorWin)), `Take: ${WB.fmt(payout, true)}. Heat is rising though.`], money: payout };
  }

  // called from scam.js when a texting scam resolves
  function scamResolved(win, payout, victimId, reported) {
    const c = crimeState();
    if (win) {
      c.scamSuccess++;
      c.victimsScammed[victimId] = (c.victimsScammed[victimId] || 0) + 1;
      addDirtyMoney(payout);
      addHeat(7);
      WB.GAME.gainXp("business", 40);
    } else {
      c.scamFail++;
      if (reported) {
        addHeat(16);
        // a fresh report can land you in jail if heat is already high
        if (WB.chance(0.18 + c.heat * 0.004)) goToPrison(150 + Math.round(c.heat * 2), "Wire fraud (reported)");
        else WB.UI.toast("🚨 The mark reported you. Heat is climbing — lay low.", "bad");
      }
    }
  }

  // tick: heat decay + auto-release
  function tick(dt) {
    const c = crimeState();
    if (c.heat > 0) c.heat = Math.max(0, c.heat - 0.04 * dt);
    if (c.prisonUntil && c.prisonUntil <= now()) {
      c.prisonUntil = 0;
      if (WB.ROOM && WB.ROOM.play) WB.ROOM.play("release"); // gates open, sunrise, walk home
      WB.UI.toast("🔓 Released from jail. Reformed? Absolutely not.", "good");
      if (WB.UI.hidePrison) WB.UI.hidePrison();
    }
  }

  // ---------- HARD JOBS: high-stakes heists that need an upfront stake and/or a car ----------
  const CARS = ["hatchback", "sportscar", "supercar"];
  const hasCar = s => !!(s.assets && s.assets.life && CARS.some(k => s.assets.life[k]));
  const HARD_CRIMES = [
    { id: "convenience", name: "Convenience Store Stickup", icon: "🏪", cat: "robberies",
      desc: "A note, a hoodie, and the register. Everyone starts somewhere.",
      stake: s => Math.max(500, ips() * 60 * 2), reqCar: false,
      mins: [25, 50], risk: 0.20, sentence: 240, heat: 10, reqLevel: 3,
      flavorWin: ["Forty bucks, a lottery ticket, and a bag of jerky. We ball.", "The clerk didn't even look up. Easiest till of my life."],
      flavorLoss: ["The clerk had a bat under the counter. And a cousin on the force.", "The 'closed' sign was a sting. Rookie energy."] },
    { id: "gasstation", name: "Gas Station Job", icon: "⛽", cat: "robberies",
      desc: "Late shift, one camera, a sleepy attendant. In, out, gone.",
      stake: s => Math.max(900, ips() * 60 * 3), reqCar: false,
      mins: [35, 65], risk: 0.22, sentence: 320, heat: 13, reqLevel: 4,
      flavorWin: ["Register AND the lotto safe. The attendant slept through it.", "Pumped the till dry and didn't even buy gas. Iconic."],
      flavorLoss: ["The 'sleepy attendant' had a silent alarm and good aim.", "You tripped over the squeegee bucket on the way out. Caught."] },
    { id: "jewelry", name: "Jewelry Store Heist", icon: "💎", cat: "robberies",
      desc: "Smash-and-grab a high-end boutique. Bring tools, bring nerve.",
      stake: s => Math.max(2000, ips() * 60 * 8), reqCar: false,
      mins: [60, 110], risk: 0.26, sentence: 600, heat: 20, reqLevel: 6,
      flavorWin: ["The display case never stood a chance. Sparkle: acquired.", "In and out in 90 seconds. The alarm is still ringing."],
      flavorLoss: ["The case was tougher than expected. So were the cops.", "Silent alarm. Very silent. Until it really wasn't."] },
    { id: "artgallery", name: "Art Gallery Heist", icon: "🖼️", cat: "robberies",
      desc: "Cut the canvas, beat the lasers, vanish before the guards finish their coffee.",
      stake: s => Math.max(15000, ips() * 60 * 20), reqCar: false,
      mins: [110, 200], risk: 0.30, sentence: 850, heat: 26, reqLevel: 10,
      flavorWin: ["Rolled up a masterpiece like a yoga mat. Priceless. Literally.", "The motion sensors took the night off. So did the guards."],
      flavorLoss: ["You ducked one laser and triggered the other six.", "The 'painting' was bolted to a pressure plate. Of course it was."] },
    { id: "armored", name: "Armored Truck Job", icon: "🚚", cat: "robberies",
      desc: "Intercept a cash transport. You'll need wheels and a stake for gear.",
      stake: s => Math.max(8000, ips() * 60 * 16), reqCar: true,
      mins: [140, 240], risk: 0.34, sentence: 1100, heat: 34, reqLevel: 12,
      flavorWin: ["Bags of unmarked bills. The driver is having a day.", "Clean getaway. The car finally earned its keep."],
      flavorLoss: ["Turns out armored trucks are, in fact, armored.", "Roadblock. Spike strip. Into the van you go."] },
    { id: "train", name: "Train Robbery", icon: "🚂", cat: "robberies",
      desc: "Board the cargo express, crack the freight car, ride off into legend.",
      stake: s => Math.max(30000, ips() * 60 * 28), reqCar: true,
      mins: [200, 360], risk: 0.37, sentence: 1400, heat: 38, reqLevel: 16,
      flavorWin: ["Robbed a TRAIN. In this economy. The Wild West is back, baby.", "Uncoupled the car, looted it clean, gone before the next station."],
      flavorLoss: ["Turns out trains have radios. And a railway police force.", "You missed the jump. The gravel did not miss you."] },
    { id: "casino", name: "Casino Vault Heist", icon: "🎰", cat: "robberies",
      desc: "Eleven friends optional. A very large bankroll required.",
      stake: s => Math.max(50000, ips() * 60 * 40), reqCar: false,
      mins: [240, 440], risk: 0.40, sentence: 2000, heat: 45, reqLevel: 18,
      flavorWin: ["The vault opened like it owed you money. Now it does.", "Past security with a smile and several million."],
      flavorLoss: ["The pit boss watches everything. EVERYTHING.", "Facial recognition is unreasonably good these days."] },
    { id: "museum", name: "Museum Heist", icon: "🏛️", cat: "robberies",
      desc: "Crown jewels behind inch-thick glass and a small army of guards. Dress nice.",
      stake: s => Math.max(80000, ips() * 60 * 50), reqCar: false,
      mins: [280, 500], risk: 0.42, sentence: 2200, heat: 48, reqLevel: 20,
      flavorWin: ["Swapped the crown for a replica. They won't notice for years.", "Rappelled through the skylight like a documentary. Flawless."],
      flavorLoss: ["The skylight had a sensor. And the floor. And the air, somehow.", "A docent recognized you from the gift shop. The gift shop!"] },
    { id: "bank", name: "Bank Robbery", icon: "🏦", cat: "robberies",
      desc: "The classic. Mask, note, getaway car. Legendary payday.",
      stake: s => Math.max(20000, ips() * 60 * 24), reqCar: true,
      mins: [320, 600], risk: 0.46, sentence: 2800, heat: 55, reqLevel: 22,
      flavorWin: ["You robbed a BANK and drove off. Childhood you is screaming.", "Vault to trunk to freedom. Unhinged. And extremely paid."],
      flavorLoss: ["Dye pack. Of course there was a dye pack.", "Three blocks. You made it three whole blocks."] },
    { id: "reserve", name: "Federal Reserve Job", icon: "🏛️", cat: "robberies",
      desc: "The one nobody's ever pulled. Gold bars, blast doors, the works. Go big or go home in cuffs.",
      stake: s => Math.max(300000, ips() * 60 * 90), reqCar: true,
      mins: [480, 860], risk: 0.50, sentence: 3800, heat: 65, reqLevel: 26,
      flavorWin: ["You robbed the FEDERAL RESERVE. They'll teach this in schools.", "Gold bars in the trunk, sirens in the mirror, freedom on the horizon."],
      flavorLoss: ["The blast door closed a half-second early. So did your window.", "Turns out the most secure building on Earth is, in fact, secure."] },
  ];
  function eligibleHard(cr) {
    const s = S();
    if (cr.reqLevel && WB.GAME.charLevel() < cr.reqLevel) return { ok: false, why: `Needs character level ${cr.reqLevel}` };
    if (cr.reqCar && !hasCar(s)) return { ok: false, why: "Needs a car (Shop → Assets)" };
    const cost = cr.stake(s);
    if (s.money < cost) return { ok: false, why: `Needs ${WB.fmt(cost, true)} upfront stake` };
    return { ok: true, cost };
  }
  // withFriend: a two-person crew → lower risk, bigger payout. The friend's cut
  // is delivered separately by ui.js (Cloud.sendHeistCut).
  //
  // IMPORTANT: this only DECIDES the outcome and pays the stake — it does NOT
  // credit the payout or send you to jail. Those land in finalizeHardJob(),
  // which ui.js calls once the heist cutscene finishes, so the result is never
  // spoiled before the movie plays.
  function commitHard(id, withFriend) {
    const s = S(), c = crimeState();
    const cr = HARD_CRIMES.find(x => x.id === id);
    if (!cr) return null;
    if (inPrison()) return { refused: "You're in jail. Sit tight." };
    const el = eligibleHard(cr);
    if (!el.ok) return { refused: el.why };
    s.money -= el.cost; // pay the stake up front (this is the cost of trying, not a spoiler)
    let risk = catchChance(cr);
    if (withFriend) risk *= 0.6;
    const caught = WB.chance(risk);
    if (caught) {
      const sentence = Math.round(cr.sentence * (1 + c.heat / 200));
      return { hard: true, win: false, caught: true, withFriend, job: cr.name, icon: "🚔",
        title: "Heist Failed!", money: -el.cost, cost: el.cost, sentence, heatAdd: cr.heat * 0.7,
        lines: [WB.pick(cr.flavorLoss), `Lost your ${WB.fmt(el.cost, true)} stake. Sentence: ${WB.fmtTime(sentence)}.`] };
    }
    // Payouts are deliberately big — heists are the marquee high-risk feature.
    let payout = ips() * 60 * WB.rand(cr.mins[0], cr.mins[1]) + el.cost * 2.5;
    if (withFriend) payout *= 1.6; // a crew brings home more
    payout = Math.floor(payout);
    return { hard: true, win: true, caught: false, withFriend, job: cr.name, icon: cr.icon,
      title: cr.name + " — Success", money: payout, cost: el.cost, heatAdd: cr.heat,
      lines: [WB.THOUGHTS.fill(WB.pick(cr.flavorWin)), `Take: ${WB.fmt(payout, true)} (stake back +more).`] };
  }

  // Apply a heist's consequences — called by ui.js AFTER the cutscene ends, so
  // the money/heat/jail only land once the movie has played out.
  function finalizeHardJob(r) {
    if (!r || !r.hard || r.done) return;
    r.done = true;
    const c = crimeState();
    if (r.caught) {
      c.scamFail++;
      addHeat(r.heatAdd || 0);
      goToPrison(r.sentence, r.job, true); // skipCutscene: the bust movie already drove us downtown
    } else {
      addDirtyMoney(r.money);
      addHeat(r.heatAdd || 0);
      c.crimesDone++;
      WB.GAME.gainXp("business", 80);
    }
  }

  return { CRIMES, HARD_CRIMES, CATS, hasCar, eligibleHard, commitHard, finalizeHardJob, crimeState, commit, eligible, catchChance,
    inPrison, prisonLeft, heat, addHeat, addDirtyMoney, goToPrison, bailCost, postBail, scamResolved, tick };
})();
