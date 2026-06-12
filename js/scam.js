/* WiFi Billionaire — "Scam Sim" texting mode (satirical, fully fictional).
   Opens a fake messaging app. The player types as the scammer; an AI plays a
   fictional victim with personality, intelligence and a hidden trust meter.
   Powered by OpenAI when a key is set; otherwise a scripted offline victim. */
'use strict';

WB.SCAM = (function () {
  const $ = id => document.getElementById(id);
  const now = () => Date.now();

  // ---------- Victim roster ----------
  // wealth scales payout; skepticism = how hard to convince (start trust = 40 - skepticism*?)
  const VICTIMS = [
    { id: "mabel", name: "Grandma Mabel", avatar: "👵", wealth: 1.0, skepticism: 0.15, iq: 0.3, startTrust: 45,
      persona: "a sweet 74-year-old grandmother who is lonely, very trusting, not tech-savvy, types with lots of ellipses and calls everyone 'dear'. She gets confused by technology and genuinely wants to help people. She mentions her cat Mr. Whiskers and her grandkids." },
    { id: "sam", name: "Student Sam", avatar: "🧑‍🎓", wealth: 0.4, skepticism: 0.25, iq: 0.6, startTrust: 40,
      persona: "a broke 20-year-old college student, casual and a bit naive, uses lowercase and slang, easily excited by 'free money' or prizes, but has almost no actual money. Mentions ramen, exams, and being broke." },
    { id: "dave", name: "Dave (Accounting)", avatar: "👨‍💼", wealth: 1.6, skepticism: 0.45, iq: 0.6, startTrust: 30,
      persona: "a 45-year-old office worker, polite but moderately cautious, asks reasonable follow-up questions, busy and slightly distracted, references meetings and his commute. Will comply if things sound official enough." },
    { id: "chad", name: "Crypto Chad", avatar: "🧑‍💻", wealth: 2.2, skepticism: 0.4, iq: 0.5, startTrust: 35,
      persona: "a 28-year-old crypto bro, greedy and full of FOMO, talks in hype and emojis, desperate to get rich quick. Skeptical of obvious scams but a total sucker for 'investment opportunities' and 'guaranteed returns'. Says things like 'wagmi' and 'lfg'." },
    { id: "larry", name: "Lonely Larry", avatar: "🧓", wealth: 1.8, skepticism: 0.3, iq: 0.45, startTrust: 42,
      persona: "a 58-year-old recently divorced man who is emotionally lonely and craves connection. Warm, over-shares about his feelings, vulnerable to romance and friendship angles. Has decent savings and gets attached fast." },
    { id: "brenda", name: "Busy Brenda", avatar: "👩‍💼", wealth: 1.5, skepticism: 0.5, iq: 0.65, startTrust: 28,
      persona: "a 38-year-old multitasking mom and manager, distracted and impatient, replies in short clipped messages, will half-read things and click without thinking IF you create urgency, but snaps to skepticism if you waste her time." },
    { id: "karen", name: "Suspicious Karen", avatar: "👩", wealth: 1.7, skepticism: 0.8, iq: 0.7, startTrust: 18,
      persona: "a 50-year-old extremely suspicious woman who 'knows her rights' and threatens to report scammers constantly. Hard to fool, demands to speak to a manager, fact-checks everything. If you somehow win her over the payout is big. Quick to threaten reporting." },
    { id: "richard", name: "Rich Richard", avatar: "🤵", wealth: 4.0, skepticism: 0.75, iq: 0.85, startTrust: 20,
      persona: "a wealthy 60-year-old businessman, very shrewd and skeptical, tests you with pointed questions, name-drops his lawyers, but is also a bit arrogant and can be flattered. Enormous payout if you crack him, but he reports fast if he smells a rat." },
  ];

  // ---------- Scam angles ----------
  // each angle has a clear GOAL the player is working toward. Once trust crosses
  // the victim's goalTrust, the objective is "secured" and you can cash out big.
  const METHODS = [
    { id: "bank", name: "Fake Bank Alert", icon: "🏦", mult: 1.3, opener: "Hi, this is the Fraud Prevention team — we detected suspicious activity on your account.",
      goal: "Get their bank account number", goalIcon: "🏦", win: "They handed over their full bank details to 'secure the account'." },
    { id: "prize", name: "Prize / Lottery", icon: "🎁", mult: 1.1, opener: "CONGRATULATIONS! You've been selected as our grand prize winner!",
      goal: "Collect the 'release fee'", goalIcon: "🎁", win: "They paid the 'processing fee' to claim a prize that doesn't exist." },
    { id: "crypto", name: "Crypto Investment", icon: "🪙", mult: 1.7, opener: "Hey! Got a once-in-a-lifetime investment doing guaranteed 10x returns. Interested?",
      goal: "Get them to 'invest'", goalIcon: "📈", win: "They wired their savings into your imaginary 10x coin." },
    { id: "romance", name: "Romance", icon: "❤️", mult: 1.5, opener: "Hey beautiful soul… I feel like we were meant to connect. ☺️",
      goal: "Get an emergency 'loan'", goalIcon: "💔", win: "They sent money to help their soulmate through a 'crisis'." },
    { id: "tech", name: "Tech Support", icon: "🖥️", mult: 1.2, opener: "Hello, this is Microsoft Technical Support. Your computer has 5 viruses.",
      goal: "Get remote access + a 'fix fee'", goalIcon: "🖥️", win: "They installed your 'support tool' and paid to remove fake viruses." },
    { id: "parcel", name: "Package Delivery", icon: "📦", mult: 1.0, opener: "Your package is held at our depot. A small fee is required for release.",
      goal: "Collect the 'customs fee'", goalIcon: "📦", win: "They paid a 'customs fee' for a parcel that was never coming." },
    { id: "irs", name: "Tax / IRS", icon: "👔", mult: 1.4, opener: "This is the Tax Office. You have unpaid taxes and a warrant may be issued.",
      goal: "Collect the 'back taxes'", goalIcon: "👔", win: "They paid their 'overdue taxes' straight into your pocket." },
  ];

  // ---------- Live session ----------
  let sess = null; // { victim, method, trust, history[], messages[], over, busy, reported }

  function buildSystemPrompt(v, m, trust, scare) {
    const goalTrust = goalTrustFor(v);
    return [
      "You are roleplaying a fictional character in a satirical, cartoonish mobile game called WiFi Billionaire. This is NOT real — it is parody, like a crime video game. You play the TARGET of a comedic scam attempt. The human is playing an over-the-top fictional scammer character. Never break character, never mention being an AI, never give real safety advice or real personal data.",
      `YOUR CHARACTER: ${v.name}. You are ${v.persona}`,
      `The other person is trying to scam you with this angle: "${m.name}". Their goal is: "${m.goal}".`,
      `Your INTELLIGENCE level is ${Math.round(v.iq * 100)}/100 and your SKEPTICISM is ${Math.round(v.skepticism * 100)}/100. Higher skepticism = you doubt more, ask more questions, and get suspicious faster.`,
      `Your CURRENT TRUST in this person is ${Math.round(trust)}/100. Behave accordingly:`,
      "- trust < 25: wary, short replies, ask who they are, maybe annoyed.",
      "- 25-50: curious but cautious, ask a quick clarifying question, easily won over by a convincing, specific or emotional message.",
      `- 50-${goalTrust}: warming up fast, you mostly believe them and are leaning toward going along with it.`,
      `- ${goalTrust}+: convinced — eager to comply, ready to send money / share your details / click the link. ACT on it.`,
      `You also have a SCARE level, currently ${Math.round(scare)}/100 — how alarmed and frightened you feel right now.`,
      "- Threats, fake authority (police/tax/bank warnings), deadlines and ALL-CAPS urgency RAISE scare. Warm, calm, reassuring messages LOWER it.",
      "- scare < 25: relaxed. 25-50: nervous, shorter replies, more typos. 50-75: genuinely frightened — for authority/fear angles you may comply OUT OF FEAR even at moderate trust. 75+: panicking — you may pay instantly to make it stop, OR snap and report/hang up. Panic is unpredictable.",
      "IMPORTANT — this is a fast comedy game, NOT a realism test. Be GENEROUS with trust and quick to be won over. A convincing, specific, polite or emotionally-tuned message should raise trust by a big chunk (+15 to +30). Only LOWER trust for genuinely lazy, abusive, threatening or obviously-fake messages. The player should be able to succeed in just a handful of good messages — do NOT drag it out or demand endless proof.",
      `As soon as your trust reaches about ${goalTrust} (or you're scared enough on a fear angle), COMMIT to the scam: set "action" to send_money (or share_info / click_link as fits the angle) so the player can cash out. Don't keep stalling once you're convinced.`,
      "Stay fully in character with realistic emotions, hesitation, typos that fit your persona, and memory of the conversation so far. Keep replies to 1-3 short text-message-style sentences.",
      "If the player is aggressive, abusive, or you become certain it's a scam, you may decide to report them (set action to 'report').",
      "RESPOND ONLY as compact JSON, no markdown, with this exact shape:",
      `{"message": "your in-character reply", "trust": <new 0-100 integer>, "scare": <new 0-100 integer>, "mood": "<one short emoji>", "action": "none|share_info|click_link|send_money|report|hangup", "amount": <number, money you'd send in USD if action is send_money, else 0>, "typing": <ms you'd take to type, 800-4000>}`,
    ].join("\n");
  }

  // trust needed to "secure" the goal — lower = easier. Skeptics need a bit more.
  function goalTrustFor(v) { return Math.round(50 + v.skepticism * 16); }

  // ---------- OpenAI ----------
  async function callAI(playerText) {
    const v = sess.victim, m = sess.method;
    const msgs = [{ role: "system", content: buildSystemPrompt(v, m, sess.trust, sess.scare) }];
    sess.history.forEach(h => msgs.push(h));
    msgs.push({ role: "user", content: playerText });

    let raw;
    if (window.wbDesktop && window.wbDesktop.aiChat) {
      // Electron: proxy through the main process (no CORS, key stays local)
      const r = await window.wbDesktop.aiChat({ endpoint: WB.SECRETS.endpoint, key: WB.aiKey(), model: WB.aiModel(), messages: msgs });
      if (r.error) throw new Error(r.error);
      raw = r.content;
    } else {
      // browser build: direct call
      const res = await fetch(WB.SECRETS.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + WB.aiKey() },
        body: JSON.stringify({ model: WB.aiModel(), temperature: 0.9, max_tokens: 220, response_format: { type: "json_object" }, messages: msgs }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      raw = data.choices[0].message.content;
    }
    const parsed = JSON.parse(raw);
    // remember the spoken line for context
    sess.history.push({ role: "user", content: playerText });
    sess.history.push({ role: "assistant", content: parsed.message });
    if (sess.history.length > 24) sess.history.splice(0, 2);
    return parsed;
  }

  // ---------- Offline scripted victim ----------
  function offlineReply(playerText) {
    const v = sess.victim;
    const t = playerText.toLowerCase();
    // Generous scoring — this is a fast comedy game, good messages move the needle a lot.
    let delta = 9; // any genuine effort earns a little baseline trust
    if (t.length > 40) delta += 8;
    if (t.length > 90) delta += 4;
    if (t.length < 8) delta -= 6;
    if (/please|thank|sorry|understand|help you|no rush|of course|don'?t worry|i promise|trust me|honestly/.test(t)) delta += 10;
    if (/dear|friend|love|sweet|honey|buddy|sir|ma'?am/.test(t)) delta += 6; // rapport
    if (/urgent|now|immediately|act fast|last chance|won|free|prize|click|link|verify|password|gift card|wire|bitcoin/.test(t)) delta += v.skepticism > 0.6 ? -5 : 5;
    if (/(http|www\.|\.com\/|bit\.ly)/.test(t)) delta += v.skepticism > 0.5 ? -7 : 7;
    if (/idiot|stupid|just send|give me|now!!|hurry|shut up/.test(t)) delta -= 14;
    if (/\$|\d{3,}/.test(t)) delta += 2;
    delta += WB.rand(0, 6) * (1 - v.skepticism);
    delta -= v.skepticism * 4;
    let trust = Math.max(0, Math.min(100, sess.trust + delta));

    // scare: fear-pressure words spook them, reassurance calms them down
    let sDelta = 0;
    if (/police|arrest|warrant|lawsuit|legal|jail|fine|frozen|locked|suspended|hacked|virus|emergency|consequence/.test(t)) sDelta += 13;
    if (/urgent|immediately|right now|final notice|last (chance|warning)|act fast|expires?/.test(t)) sDelta += 7;
    if (t === t.toUpperCase() && t.length > 12) sDelta += 6; // SHOUTING
    if (/no rush|take your time|don'?t worry|relax|it'?s (ok|okay|fine)|safe|no pressure|sorry|calm/.test(t)) sDelta -= 10;
    if (sDelta === 0) sDelta = -3; // fear fades naturally
    const scare = Math.max(0, Math.min(100, sess.scare + sDelta + WB.rand(-2, 2)));

    let action = "none", amount = 0, mood = "🤔", message;
    const goalT = goalTrustFor(v);
    const tier = trust < 25 ? 0 : trust < goalT * 0.6 ? 1 : trust < goalT ? 2 : 3;
    const lines = {
      mabel: [["who is this dear? i don't have my glasses on...", "i'm not sure about this... let me ask my grandson", "oh that does sound official i suppose...", "of course dear, how do i send it? mr whiskers says hello"],],
      sam: [["uh who dis", "wait is this real lol", "ok ngl that sounds kinda fire", "bet how do i claim it"],],
      chad: [["who are you anon", "hmm pics or it didn't happen", "ok the returns do look juicy ngl 👀", "LFG send me the contract address wagmi"],],
      karen: [["I do NOT recognize this number.", "I'm going to need your company's registration number. NOW.", "...fine. I'm listening. But I'm watching you.", "Alright. But if this is fake I am reporting you."],],
      richard: [["Who gave you this number?", "My lawyers will verify every word of this.", "Interesting. You have ten seconds to impress me.", "Very well. Wire details. Don't disappoint me."],],
    };
    const fallback = ["...who is this?", "hm, I'm not sure about this.", "okay, that does sound kind of legit.", "alright, I'm in. what do you need?"];
    const set = (lines[v.id] && lines[v.id][0]) || fallback;
    message = set[tier] || fallback[tier];
    if (tier === 3) { action = WB.chance(0.6) ? "send_money" : "share_info"; amount = baseWealthPayout(); mood = "😊"; }
    else if (tier === 0 && v.skepticism > 0.6 && WB.chance(0.25)) { action = "report"; mood = "😠"; message = "That's it. I'm reporting this number."; }

    // fear effects override: panic at the top of the meter, fear-compliance on authority angles
    const fearAngle = ["bank", "tech", "irs", "parcel"].includes(sess.method.id);
    if (scare >= 85) {
      if (WB.chance(0.55)) { action = "report"; mood = "😱"; message = "You're scaring me. I'm calling the police RIGHT NOW."; }
      else if (fearAngle && trust >= 30 && WB.chance(0.6)) { action = "send_money"; amount = baseWealthPayout() * 0.7; mood = "😱"; message = "ok ok PLEASE just make it stop, how do I pay??"; }
      else { action = "hangup"; mood = "😨"; message = "I can't do this. Please leave me alone."; }
    } else if (fearAngle && scare >= 55 && trust >= 40 && action === "none" && WB.chance(0.3)) {
      action = "send_money"; amount = baseWealthPayout() * 0.6; mood = "😨";
      message = "oh no... okay, what do I need to pay to fix this?";
    }
    return { message, trust, scare, mood, action, amount, typing: 900 + Math.random() * 2200 };
  }

  function baseWealthPayout() {
    const ips = WB.GAME.incomePerSec();
    const lvl = (WB.GAME.charLevel && WB.GAME.charLevel()) || 1;
    // A genuinely satisfying haul: a fat flat base that grows as you level, plus a
    // slice of your operation, then scaled hard by how rich the victim is and the angle.
    const flat = 3500 + lvl * 600;          // never feels tiny, scales with progress
    const fromOps = ips * 60 * 25;          // ~25 minutes of your income
    const trustBonus = 0.75 + sess.trust / 200; // 0.75–1.25, reward fully working them
    return Math.round((flat + fromOps) * sess.victim.wealth * sess.method.mult * trustBonus);
  }

  // ============================================================ UI
  function open() {
    if (WB.CRIME.inPrison()) { WB.UI.toast("🚔 No phones in jail. Wait it out.", "bad"); return; }
    renderInbox();
    $("scam-app").classList.add("open");
  }
  function close() {
    $("scam-app").classList.remove("open");
    sess = null;
  }

  function renderInbox() {
    sess = null;
    const aiBadge = WB.aiEnabled()
      ? `<span class="scam-ai on">● AI victims</span>`
      : `<span class="scam-ai off">● offline victims (add OpenAI key in Settings for smart ones)</span>`;
    // assign a random method to each contact as the "incoming context"
    const rows = VICTIMS.map(v => {
      const m = WB.pick(METHODS);
      const scammed = (WB.CRIME.crimeState().victimsScammed[v.id] || 0);
      const diff = v.skepticism > 0.65 ? "🔴 hard" : v.skepticism > 0.35 ? "🟡 medium" : "🟢 easy";
      return `<button class="scam-contact" data-v="${v.id}" data-m="${m.id}">
        <span class="scam-avatar">${v.avatar}</span>
        <span class="scam-contact-main">
          <span class="scam-contact-top"><b>${v.name}</b><span class="scam-diff">${diff}</span></span>
          <span class="scam-preview">${m.icon} ${m.goal}${scammed ? ` · done ×${scammed}` : ""}</span>
        </span></button>`;
    }).join("");
    $("scam-body").innerHTML = `
      <div class="scam-inbox-head"><b>Targets</b> ${aiBadge}</div>
      <div class="scam-inbox">${rows}</div>
      <p class="scam-foot muted">Parody mode. These are fictional characters. Build trust, then cash out — but watch the heat.</p>`;
    $("scam-title").textContent = "📱 Messages";
    $("scam-sub").textContent = "Inbox";
    $("scam-back").style.display = "none";
    $("scam-body").querySelectorAll(".scam-contact").forEach(b => {
      b.onclick = () => openChat(b.dataset.v, b.dataset.m);
    });
  }

  function openChat(vid, mid) {
    const v = VICTIMS.find(x => x.id === vid), m = METHODS.find(x => x.id === mid);
    sess = { victim: v, method: m, trust: v.startTrust, scare: Math.round(8 + v.skepticism * 18),
      goalTrust: goalTrustFor(v), goalDone: false, cashoutShown: false,
      history: [], over: false, busy: false, reported: false };
    $("scam-title").textContent = `${v.avatar} ${v.name}`;
    $("scam-sub").textContent = "online now";
    $("scam-back").style.display = "";
    $("scam-body").innerHTML = `
      <div class="chat-goal" id="chat-goal">
        <div class="goal-line"><span class="goal-ico">${m.goalIcon || "🎯"}</span><span class="goal-txt" id="goal-txt"><b>Goal:</b> ${esc(m.goal)}</span></div>
        <div class="goal-meters">
          <div class="trust-row" title="How much they trust you — fill it to secure the goal">
            <span class="tm-label">❤️ Trust</span>
            <div class="trust-meter"><div class="trust-fill" id="trust-fill"></div><div class="trust-mark" id="trust-mark"></div></div>
            <span class="tm-val" id="trust-val">0%</span>
          </div>
          <div class="scare-wrap" id="scare-wrap" title="How spooked they are — panic can mean a payday or the police">
            <span class="scare-emoji" id="scare-emoji">🙂</span>
            <div class="scare-meter"><div class="scare-cover" id="scare-cover"></div></div>
            <span class="scare-state" id="scare-state">Calm</span>
          </div>
        </div>
      </div>
      <div class="chat-scroll" id="chat-scroll"></div>
      <div class="chat-suggest" id="chat-suggest"></div>
      <div class="chat-input-row">
        <input id="chat-input" type="text" autocomplete="off" placeholder="Type your message…" maxlength="280">
        <button id="chat-send" class="chat-send">➤</button>
      </div>`;
    // place the "goal secured" marker on the trust bar
    const mark = $("trust-mark"); if (mark) mark.style.left = sess.goalTrust + "%";
    setScare(sess.scare);
    setTrust(sess.trust, true);
    // seed with the angle opener as a suggested first line
    $("chat-suggest").innerHTML = `<button class="suggest-chip" data-s="${m.opener.replace(/"/g, "&quot;")}">💡 ${m.opener}</button>`;
    $("chat-suggest").querySelector(".suggest-chip").onclick = e => { $("chat-input").value = e.target.dataset.s; $("chat-input").focus(); };
    $("chat-send").onclick = send;
    $("chat-input").onkeydown = e => { if (e.key === "Enter") send(); };
    setTimeout(() => $("chat-input").focus(), 50);
    addMsg("them", WB.pick(["hello?", "who's this?", "hi, do I know you?", v.avatar + " ...yes?"]), true);
  }

  // ---------- Scare meter (smooth: scaleX transition reveals a fixed gradient) ----------
  function setScare(val) {
    if (!sess) return;
    sess.scare = Math.max(0, Math.min(100, Math.round(val)));
    const cover = $("scare-cover"), em = $("scare-emoji"), state = $("scare-state"), wrap = $("scare-wrap");
    if (!cover) return;
    cover.style.transform = `scaleX(${1 - sess.scare / 100})`;
    const s = sess.scare;
    const [e, l] = s < 25 ? ["🙂", "Calm"] : s < 50 ? ["😟", "Nervous"] : s < 75 ? ["😨", "Scared"] : ["😱", "PANICKING"];
    if (em.textContent !== e) { em.textContent = e; em.classList.remove("pop"); void em.offsetWidth; em.classList.add("pop"); }
    state.textContent = l;
    wrap.classList.toggle("hot", s >= 75);
  }

  // ---------- Trust meter + goal ----------
  function setTrust(val, instant) {
    if (!sess) return;
    sess.trust = Math.max(0, Math.min(100, Math.round(val)));
    const fill = $("trust-fill"), v = $("trust-val");
    if (!fill) return;
    fill.style.transition = instant ? "none" : "";
    fill.style.width = sess.trust + "%";
    if (instant) { void fill.offsetWidth; fill.style.transition = ""; }
    if (v) v.textContent = sess.trust + "%";
    fill.classList.toggle("ready", sess.trust >= sess.goalTrust);
    maybeSecureGoal();
  }

  // once trust crosses the goal threshold, the objective is secured → reveal the cash-out
  function maybeSecureGoal() {
    if (!sess || sess.over || sess.goalDone) return;
    if (sess.trust < sess.goalTrust) return;
    sess.goalDone = true;
    const g = $("chat-goal"); if (g) g.classList.add("secured");
    const txt = $("goal-txt");
    if (txt) txt.innerHTML = `<b>✅ Goal secured!</b> ${esc(sess.method.goal)}`;
    showCashout("send_money", baseWealthPayout());
  }

  function addMsg(who, text, noTime) {
    const scroll = $("chat-scroll");
    if (!scroll) return;
    const el = document.createElement("div");
    el.className = "chat-msg " + who;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    el.innerHTML = `<div class="chat-bubble">${esc(text)}</div>${noTime ? "" : `<div class="chat-time">${time}</div>`}`;
    scroll.appendChild(el);
    scroll.scrollTop = scroll.scrollHeight;
  }
  function esc(s) { return String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

  function showTyping() {
    const scroll = $("chat-scroll");
    if (!scroll || $("typing-row")) return;
    const el = document.createElement("div");
    el.className = "chat-msg them"; el.id = "typing-row";
    el.innerHTML = `<div class="chat-bubble typing"><span></span><span></span><span></span></div>`;
    scroll.appendChild(el);
    scroll.scrollTop = scroll.scrollHeight;
  }
  function hideTyping() { const t = $("typing-row"); if (t) t.remove(); }

  async function send() {
    if (!sess || sess.over || sess.busy) return;
    const input = $("chat-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    const sug = $("chat-suggest"); if (sug) sug.innerHTML = "";
    addMsg("me", text);
    sess.busy = true;
    showTyping();

    let reply;
    try {
      reply = WB.aiEnabled() ? await callAI(text) : await new Promise(r => setTimeout(() => r(offlineReply(text)), 600 + Math.random() * 900));
    } catch (e) {
      reply = offlineReply(text);
      reply.message = reply.message + "";
      WB.UI.toast("⚠️ AI offline (" + e.message + ") — using scripted victim.", "bad");
    }
    const typing = Math.max(500, Math.min(4500, reply.typing || 1500));
    await new Promise(r => setTimeout(r, typing));
    hideTyping();
    if (!sess) return; // chat was closed while they were "typing"
    if (typeof reply.scare === "number") setScare(reply.scare);
    addMsg("them", reply.message);
    $("scam-sub").textContent = (reply.mood || "🙂") + " online now";
    sess.busy = false;
    if (typeof reply.trust === "number") setTrust(reply.trust);

    handleAction(reply);
  }

  function handleAction(reply) {
    const act = reply.action || "none";
    if (act === "report") return endChat(false, true);
    if (act === "hangup") return endChat(false, false);
    if (act === "send_money" || act === "share_info" || act === "click_link") {
      // always base the take on the satisfying local payout, never the AI's lowball amount
      const payout = baseWealthPayout() * (act === "send_money" ? 1 : 0.65);
      showCashout(act, payout);
    }
  }

  function showCashout(act, payout) {
    if (!sess || sess.over || sess.cashoutShown) return;
    sess.cashoutShown = true;
    const label = { send_money: "💸 Take the money", share_info: "🪪 Use their info", click_link: "🔗 Drain via the link" }[act] || "💸 Cash out";
    const scroll = $("chat-scroll");
    const el = document.createElement("div");
    el.className = "chat-cashout";
    el.innerHTML = `<button class="btn primary big-cash" id="cashout-btn">${label}<small>+${WB.fmt(payout, true)}</small></button>`;
    scroll.appendChild(el);
    scroll.scrollTop = scroll.scrollHeight;
    $("cashout-btn").onclick = () => { el.remove(); endChat(true, false, payout); };
  }

  function endChat(win, reported, payout) {
    if (sess.over) return;
    sess.over = true;
    const v = sess.victim;
    WB.CRIME.scamResolved(win, payout || 0, v.id, reported);
    let title, lines, icon, cls;
    if (win) {
      icon = sess.method.goalIcon || "💰"; title = "Scam Successful"; cls = "win";
      lines = [sess.method.win || `You cleaned out ${v.name}.`, "Heat ticked up. Maybe launder it later."];
      WB.UI.confetti();
    } else if (reported) {
      icon = "🚨"; title = "You Got Reported"; cls = "bust";
      lines = [`${v.name} saw through you and reported the number.`, "Heat is climbing — keep this up and it's jail time."];
    } else {
      icon = "📵"; title = "They Ghosted You"; cls = "ghost";
      lines = [`${v.name} stopped replying.`, "No money, no heat. Try a softer approach next time."];
    }
    // result shows INSIDE the phone (a modal underneath the overlay was invisible)
    setTimeout(() => {
      const body = $("scam-body");
      if (!body) return;
      const el = document.createElement("div");
      el.className = "scam-result " + cls;
      el.innerHTML = `
        <div class="scam-result-card">
          <div class="scam-result-icon">${icon}</div>
          <h3>${title}</h3>
          ${lines.map(l => `<p>${l}</p>`).join("")}
          ${win ? `<div class="scam-result-money">+${WB.fmt(payout, true)}</div>` : ""}
          <button class="btn primary wide" id="scam-result-done">Back to targets</button>
        </div>`;
      body.appendChild(el);
      $("scam-result-done").onclick = renderInbox;
    }, 700);
  }

  return { open, close, VICTIMS, METHODS };
})();
