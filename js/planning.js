/* WiFi Billionaire — Heist Planning minigame (self-contained module)
 *
 * Public API:
 *   WB.PLANNING.openPlan(job, onDone)
 *     job    = { id, name, icon }
 *     onDone = function(quality)  // quality is 0..1, or null if cancelled
 *
 * Fully self-contained: injects its own <style> + DOM overlay. Only relies on
 * the global WB namespace (and optional WB.t / WB.fmt).
 */
(function () {
  "use strict";

  var WB = window.WB || (window.WB = {});

  // Translate helper — fall back to identity if the game hasn't wired one up.
  function T(s) {
    try {
      if (typeof WB.t === "function") return WB.t(s);
    } catch (e) {}
    return s;
  }

  /* ----------------------------------------------------------------------- *
   * Decision model
   * Each option has a base quality weight (0..1). Synergies nudge the final
   * score up or down based on the *combination* picked. The math is tuned to
   * be interesting but forgiving: a thoughtful plan lands ~0.85, a random
   * plan ~0.45, the worst-possible plan ~0.25.
   * ----------------------------------------------------------------------- */

  var DECISIONS = [
    {
      key: "approach",
      icon: "🕵️",
      label: "Approach",
      options: [
        { id: "stealth",   icon: "🤫", name: "Stealth",       blurb: "Slow, silent, surgical.",      w: 0.72 },
        { id: "loud",      icon: "💥", name: "Loud & Fast",   blurb: "In, out, before the sirens.",  w: 0.55 },
        { id: "disguised", icon: "🎭", name: "Disguised",     blurb: "Walk in like you belong.",     w: 0.66 }
      ]
    },
    {
      key: "entry",
      icon: "🚪",
      label: "Entry",
      options: [
        { id: "front",   icon: "🏛️", name: "Front door", blurb: "Bold. The guards say hi.",   w: 0.50 },
        { id: "back",    icon: "🚪", name: "Back",        blurb: "Loading bay, no cameras.",   w: 0.64 },
        { id: "rooftop", icon: "🏢", name: "Rooftop",     blurb: "Rappel in from above.",      w: 0.70 }
      ]
    },
    {
      key: "getaway",
      icon: "🚗",
      label: "Getaway",
      options: [
        { id: "muscle",  icon: "🏎️", name: "Muscle car",      blurb: "Loud, fast, unsubtle.",      w: 0.60 },
        { id: "bike",    icon: "🏍️", name: "Motorbike",       blurb: "Slips through traffic.",     w: 0.66 },
        { id: "blend",   icon: "🚶", name: "Blend into crowd", blurb: "Vanish on foot. No trace.",  w: 0.68 }
      ]
    },
    {
      key: "edge",
      icon: "🧰",
      label: "Edge",
      options: [
        { id: "inside", icon: "🤝", name: "Inside man",     blurb: "A friend on the floor.",     w: 0.74 },
        { id: "hack",   icon: "💻", name: "Hack the cameras", blurb: "Own the feeds, go ghost.", w: 0.71 },
        { id: "nerve",  icon: "😎", name: "Pure nerve",     blurb: "No plan B. All swagger.",    w: 0.48 }
      ]
    }
  ];

  // Synergy rules: each tests the current selection and, if matched, adds its
  // delta (positive = combo, negative = friction). Applied after the base avg.
  var SYNERGIES = [
    {
      delta: 0.20,
      test: function (s) { return s.approach === "stealth" && s.entry === "rooftop" && s.edge === "hack"; },
      good: true, label: "Ghost Protocol: silent rooftop infiltration with the cameras blind."
    },
    {
      delta: 0.10,
      test: function (s) { return s.approach === "loud" && s.getaway === "muscle" && s.edge === "nerve"; },
      good: true, label: "Smash & Dash: brutal, fast, and gone — risky but it works."
    },
    {
      delta: 0.12,
      test: function (s) { return s.approach === "disguised" && s.entry === "front" && s.edge === "inside"; },
      good: true, label: "Front of House: stroll in disguised while your inside man waves you through."
    },
    {
      delta: 0.08,
      test: function (s) { return s.approach === "stealth" && s.getaway === "blend"; },
      good: true, label: "No Trace: quiet in, quiet out — nobody saw a thing."
    },
    {
      delta: 0.07,
      test: function (s) { return s.entry === "back" && s.edge === "hack"; },
      good: true, label: "Blind Spot: cameras down at the loading bay."
    },
    {
      delta: 0.06,
      test: function (s) { return s.approach === "loud" && s.getaway === "bike"; },
      good: true, label: "Quick Slip: loud entry, nimble exit."
    },
    // Friction / clashes
    {
      delta: -0.14,
      test: function (s) { return s.approach === "stealth" && s.getaway === "muscle"; },
      good: false, label: "Mixed signals: a stealth job and a roaring muscle car don't mix."
    },
    {
      delta: -0.12,
      test: function (s) { return s.approach === "loud" && s.entry === "rooftop"; },
      good: false, label: "Why so quiet? Going loud but rappelling in from the roof wastes the entry."
    },
    {
      delta: -0.08,
      test: function (s) { return s.edge === "nerve" && s.entry === "front"; },
      good: false, label: "Exposed: no edge and walking straight through the front door."
    }
  ];

  // Verdict bands for the strength meter.
  function verdict(q) {
    if (q < 0.40) return { label: "Reckless", cls: "plan-v-bad" };
    if (q < 0.60) return { label: "Shaky",    cls: "plan-v-mid" };
    if (q < 0.80) return { label: "Solid",    cls: "plan-v-ok"  };
    return { label: "Airtight", cls: "plan-v-good" };
  }

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  // Compute plan quality + the synergies currently firing.
  function computePlan(sel) {
    var keys = DECISIONS.map(function (d) { return d.key; });
    var chosen = keys.filter(function (k) { return !!sel[k]; });

    // Base = average of picked option weights (only over chosen rows).
    var sum = 0;
    chosen.forEach(function (k) {
      var d = DECISIONS.filter(function (x) { return x.key === k; })[0];
      var o = d.options.filter(function (x) { return x.id === sel[k]; })[0];
      sum += o ? o.w : 0;
    });
    var base = chosen.length ? sum / chosen.length : 0;

    // Synergies only count once all four are chosen (a partial plan can't combo).
    var fired = [];
    var delta = 0;
    if (chosen.length === DECISIONS.length) {
      SYNERGIES.forEach(function (sy) {
        if (sy.test(sel)) { delta += sy.delta; fired.push(sy); }
      });
    }

    // Gentle curve so the meter feels rewarding near the top.
    var raw = base + delta;
    var q = clamp01(raw);

    return { quality: q, base: base, delta: delta, fired: fired, complete: chosen.length === DECISIONS.length };
  }

  /* ----------------------------------------------------------------------- *
   * Styles — injected once.
   * ----------------------------------------------------------------------- */
  var STYLE_ID = "plan-styles";
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = ''
      + '.plan-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;'
      + 'background:rgba(4,7,16,.72);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);'
      + 'opacity:0;transition:opacity .28s ease;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;'
      + 'padding:18px;box-sizing:border-box;}'
      + '.plan-overlay.plan-show{opacity:1;}'
      + '.plan-overlay *{box-sizing:border-box;}'

      + '.plan-board{width:100%;max-width:560px;max-height:92vh;overflow-y:auto;'
      + 'background:linear-gradient(160deg,#141a2b 0%,#0d1322 60%,#0a0f1c 100%);'
      + 'border:1px solid rgba(214,178,92,.28);border-radius:22px;'
      + 'box-shadow:0 30px 90px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.02) inset,0 1px 0 rgba(255,255,255,.06) inset;'
      + 'color:#e7ecf6;padding:22px 22px 18px;transform:translateY(18px) scale(.96);opacity:0;'
      + 'transition:transform .34s cubic-bezier(.2,.9,.25,1.05),opacity .34s ease;}'
      + '.plan-overlay.plan-show .plan-board{transform:translateY(0) scale(1);opacity:1;}'

      + '.plan-board::-webkit-scrollbar{width:8px;}'
      + '.plan-board::-webkit-scrollbar-thumb{background:rgba(214,178,92,.25);border-radius:8px;}'

      + '.plan-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:4px;}'
      + '.plan-head .plan-jobicon{font-size:34px;line-height:1;filter:drop-shadow(0 4px 10px rgba(0,0,0,.5));}'
      + '.plan-head h2{margin:0;font-size:20px;font-weight:800;letter-spacing:.2px;}'
      + '.plan-head .plan-sub{margin:2px 0 0;font-size:12px;color:#8b96ad;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;}'
      + '.plan-x{margin-left:auto;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);'
      + 'color:#aab4c8;width:30px;height:30px;border-radius:9px;font-size:16px;cursor:pointer;line-height:1;'
      + 'transition:background .15s,color .15s;flex:none;}'
      + '.plan-x:hover{background:rgba(255,90,90,.18);color:#ff8b8b;}'

      + '.plan-strength{margin:16px 0 6px;}'
      + '.plan-strength-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px;}'
      + '.plan-strength-top .plan-lbl{font-size:11px;font-weight:800;letter-spacing:1.6px;color:#8b96ad;text-transform:uppercase;}'
      + '.plan-strength-top .plan-pct{font-size:13px;font-weight:800;font-variant-numeric:tabular-nums;}'
      + '.plan-verdict{font-size:12px;font-weight:800;margin-left:8px;padding:2px 9px;border-radius:999px;letter-spacing:.4px;}'
      + '.plan-v-bad{background:rgba(255,86,86,.16);color:#ff8c8c;}'
      + '.plan-v-mid{background:rgba(255,176,60,.16);color:#ffc46b;}'
      + '.plan-v-ok{background:rgba(120,200,120,.14);color:#9fe6a0;}'
      + '.plan-v-good{background:rgba(80,230,150,.18);color:#73f0b0;}'

      + '.plan-bar{height:12px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden;'
      + 'box-shadow:inset 0 1px 3px rgba(0,0,0,.5);}'
      + '.plan-bar-fill{height:100%;width:0%;border-radius:999px;'
      + 'background:linear-gradient(90deg,#ff5a5a,#ffb13c);'
      + 'transition:width .4s cubic-bezier(.2,.9,.25,1),background .4s ease;'
      + 'box-shadow:0 0 14px rgba(255,177,60,.4);}'

      + '.plan-synergy{min-height:16px;margin:9px 2px 2px;font-size:12px;font-weight:600;line-height:1.35;'
      + 'transition:opacity .2s;}'
      + '.plan-synergy .plan-syn-good{color:#7fe6b0;}'
      + '.plan-synergy .plan-syn-bad{color:#ff9a9a;}'
      + '.plan-synergy .plan-syn-mut{color:#7d889e;}'

      + '.plan-decision{margin-top:16px;}'
      + '.plan-dec-head{display:flex;align-items:center;gap:8px;margin:0 2px 8px;}'
      + '.plan-dec-head .plan-dec-ico{font-size:16px;}'
      + '.plan-dec-head .plan-dec-name{font-size:13px;font-weight:800;letter-spacing:.6px;color:#d6dcec;}'
      + '.plan-dec-head .plan-dec-num{margin-left:auto;font-size:11px;font-weight:800;color:#5e6a82;font-variant-numeric:tabular-nums;}'

      + '.plan-opts{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;}'
      + '.plan-opt{position:relative;text-align:left;cursor:pointer;border-radius:14px;padding:11px 11px 10px;'
      + 'background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);color:#cfd6e6;'
      + 'transition:transform .14s ease,border-color .18s,background .18s,box-shadow .18s;overflow:hidden;'
      + 'font:inherit;}'
      + '.plan-opt:hover{transform:translateY(-2px);background:rgba(255,255,255,.06);border-color:rgba(214,178,92,.4);}'
      + '.plan-opt .plan-opt-ico{font-size:21px;display:block;margin-bottom:5px;line-height:1;}'
      + '.plan-opt .plan-opt-name{font-size:12.5px;font-weight:800;color:#eef2fb;display:block;line-height:1.15;}'
      + '.plan-opt .plan-opt-blurb{font-size:10.5px;color:#8c97ad;display:block;margin-top:3px;line-height:1.3;}'
      + '.plan-opt.plan-sel{background:linear-gradient(160deg,rgba(214,178,92,.20),rgba(214,178,92,.06));'
      + 'border-color:rgba(214,178,92,.8);box-shadow:0 6px 22px rgba(214,178,92,.18),0 0 0 1px rgba(214,178,92,.35) inset;}'
      + '.plan-opt.plan-sel .plan-opt-name{color:#ffe6a8;}'
      + '.plan-opt.plan-sel::after{content:"✓";position:absolute;top:8px;right:9px;font-size:11px;font-weight:900;'
      + 'color:#0c1322;background:#e6c46a;width:17px;height:17px;border-radius:50%;display:flex;'
      + 'align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.4);}'

      + '.plan-actions{display:flex;gap:10px;align-items:center;margin-top:22px;}'
      + '.plan-cancel{background:none;border:none;color:#7d889e;font-size:13px;font-weight:700;cursor:pointer;'
      + 'padding:8px 6px;transition:color .15s;font-family:inherit;}'
      + '.plan-cancel:hover{color:#c2cbdd;}'
      + '.plan-go{margin-left:auto;flex:1;max-width:320px;border:none;cursor:pointer;border-radius:14px;'
      + 'padding:14px 18px;font-size:15px;font-weight:800;letter-spacing:.3px;color:#0a1020;font-family:inherit;'
      + 'background:linear-gradient(135deg,#ffd874,#e6b34a);'
      + 'box-shadow:0 10px 26px rgba(214,178,92,.34);transition:transform .14s,box-shadow .18s,filter .18s,opacity .18s;}'
      + '.plan-go:not(:disabled):hover{transform:translateY(-2px);filter:brightness(1.05);box-shadow:0 14px 32px rgba(214,178,92,.45);}'
      + '.plan-go:not(:disabled):active{transform:translateY(0);}'
      + '.plan-go:disabled{cursor:not-allowed;opacity:.45;filter:grayscale(.5);box-shadow:none;}'

      + '@media (max-width:430px){'
      + '.plan-opt .plan-opt-blurb{display:none;}'
      + '.plan-board{padding:18px 14px 14px;}'
      + '.plan-go{padding:13px 14px;font-size:14px;}'
      + '}';

    var el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }

  /* ----------------------------------------------------------------------- *
   * Overlay construction
   * ----------------------------------------------------------------------- */
  function openPlan(job, onDone) {
    injectStyles();
    job = job || {};
    var cb = typeof onDone === "function" ? onDone : function () {};
    var done = false; // guard against double-fire

    var sel = {}; // key -> option id

    // Backdrop
    var overlay = document.createElement("div");
    overlay.className = "plan-overlay";

    var board = document.createElement("div");
    board.className = "plan-board";
    overlay.appendChild(board);

    // Header
    var head = document.createElement("div");
    head.className = "plan-head";
    head.innerHTML =
      '<div class="plan-jobicon">' + (job.icon || "🗺️") + '</div>' +
      '<div>' +
        '<h2>' + esc(job.name || T("The Job")) + '</h2>' +
        '<div class="plan-sub">' + esc(T("Plan the Job")) + '</div>' +
      '</div>';
    var xBtn = document.createElement("button");
    xBtn.className = "plan-x";
    xBtn.setAttribute("aria-label", T("Cancel"));
    xBtn.textContent = "✕";
    head.appendChild(xBtn);
    board.appendChild(head);

    // Strength meter
    var strength = document.createElement("div");
    strength.className = "plan-strength";
    strength.innerHTML =
      '<div class="plan-strength-top">' +
        '<span class="plan-lbl">' + esc(T("Plan Strength")) + '</span>' +
        '<span><span class="plan-pct">0%</span><span class="plan-verdict plan-v-bad">' + esc(T("Reckless")) + '</span></span>' +
      '</div>' +
      '<div class="plan-bar"><div class="plan-bar-fill"></div></div>' +
      '<div class="plan-synergy"><span class="plan-syn-mut">' + esc(T("Pick all four to lock in your plan.")) + '</span></div>';
    board.appendChild(strength);

    var pctEl = strength.querySelector(".plan-pct");
    var verdEl = strength.querySelector(".plan-verdict");
    var fillEl = strength.querySelector(".plan-bar-fill");
    var synEl = strength.querySelector(".plan-synergy");

    // Decisions
    DECISIONS.forEach(function (dec, di) {
      var block = document.createElement("div");
      block.className = "plan-decision";

      var dh = document.createElement("div");
      dh.className = "plan-dec-head";
      dh.innerHTML =
        '<span class="plan-dec-ico">' + dec.icon + '</span>' +
        '<span class="plan-dec-name">' + esc(T(dec.label)) + '</span>' +
        '<span class="plan-dec-num">' + (di + 1) + '/' + DECISIONS.length + '</span>';
      block.appendChild(dh);

      var grid = document.createElement("div");
      grid.className = "plan-opts";

      dec.options.forEach(function (opt) {
        var b = document.createElement("button");
        b.className = "plan-opt";
        b.type = "button";
        b.innerHTML =
          '<span class="plan-opt-ico">' + opt.icon + '</span>' +
          '<span class="plan-opt-name">' + esc(T(opt.name)) + '</span>' +
          '<span class="plan-opt-blurb">' + esc(T(opt.blurb)) + '</span>';
        b.addEventListener("click", function () {
          sel[dec.key] = opt.id;
          // update selection visuals within this row
          Array.prototype.forEach.call(grid.children, function (c) {
            c.classList.remove("plan-sel");
          });
          b.classList.add("plan-sel");
          refresh();
        });
        grid.appendChild(b);
      });

      block.appendChild(grid);
      board.appendChild(block);
    });

    // Actions
    var actions = document.createElement("div");
    actions.className = "plan-actions";
    var cancelBtn = document.createElement("button");
    cancelBtn.className = "plan-cancel";
    cancelBtn.type = "button";
    cancelBtn.textContent = T("Cancel");
    var goBtn = document.createElement("button");
    goBtn.className = "plan-go";
    goBtn.type = "button";
    goBtn.disabled = true;
    goBtn.textContent = "▶ " + T("Pull the job");
    actions.appendChild(cancelBtn);
    actions.appendChild(goBtn);
    board.appendChild(actions);

    // --- live update ---
    function colorFor(q) {
      // red -> amber -> green gradient endpoints
      if (q < 0.5) return "linear-gradient(90deg,#ff5a5a,#ffb13c)";
      if (q < 0.8) return "linear-gradient(90deg,#ffb13c,#cfe05a)";
      return "linear-gradient(90deg,#79e07a,#3fe0a0)";
    }

    function refresh() {
      var r = computePlan(sel);
      var pct = Math.round(r.quality * 100);
      fillEl.style.width = pct + "%";
      fillEl.style.background = colorFor(r.quality);
      pctEl.textContent = pct + "%";

      var v = verdict(r.quality);
      verdEl.textContent = T(v.label);
      verdEl.className = "plan-verdict " + v.cls;

      // Synergy line
      if (!r.complete) {
        var remaining = DECISIONS.length - Object.keys(sel).length;
        synEl.innerHTML = '<span class="plan-syn-mut">' +
          esc(remaining === 1
            ? T("One more choice to lock in your plan.")
            : T("Pick all four to lock in your plan.")) +
          '</span>';
      } else if (r.fired.length) {
        // Show the most impactful synergy (largest |delta|), good first.
        var best = r.fired.slice().sort(function (a, b) {
          return Math.abs(b.delta) - Math.abs(a.delta);
        })[0];
        synEl.innerHTML = '<span class="' + (best.good ? "plan-syn-good" : "plan-syn-bad") + '">' +
          (best.good ? "✦ " : "⚠ ") + esc(T(best.label)) + '</span>';
      } else {
        synEl.innerHTML = '<span class="plan-syn-mut">' +
          esc(T("A workable plan — but no standout combos.")) + '</span>';
      }

      goBtn.disabled = !r.complete;
    }

    // --- close / finish ---
    function teardown() {
      overlay.classList.remove("plan-show");
      window.setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 300);
      document.removeEventListener("keydown", onKey);
    }

    function finish(quality) {
      if (done) return;
      done = true;
      teardown();
      cb(quality);
    }

    function onKey(e) {
      if (e.key === "Escape") { finish(null); }
      else if (e.key === "Enter" && !goBtn.disabled) {
        finish(clamp01(computePlan(sel).quality));
      }
    }

    xBtn.addEventListener("click", function () { finish(null); });
    cancelBtn.addEventListener("click", function () { finish(null); });
    goBtn.addEventListener("click", function () {
      finish(clamp01(computePlan(sel).quality));
    });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) finish(null); // click backdrop to cancel
    });
    document.addEventListener("keydown", onKey);

    document.body.appendChild(overlay);
    // trigger entrance on next frame
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { overlay.classList.add("plan-show"); });
    });
    refresh();
  }

  // Minimal HTML escaper for any user/job-supplied text.
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  WB.PLANNING = { openPlan: openPlan };
})();
