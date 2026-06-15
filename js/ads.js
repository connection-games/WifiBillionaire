/* WiFi Billionaire — ads layer (AdinPlay-ready).

   Ads run ONLY in the browser build. In the Electron desktop app this whole
   module no-ops: ad networks don't serve to local-file apps and downloaders
   shouldn't get ads, so the desktop app stays ad-free by design.

   ───────────────────────────────────────────────────────────────────────────
   GOING LIVE WITH ADINPLAY (https://www.adinplay.com):
   1. Apply and get approved (you'll get a publisher id + ad-unit tags, ~a few days).
   2. Fill CONFIG.pub + CONFIG.domain below.
   3. Add the AdinPlay tag <script> in index.html (placeholder is already there).
   4. Paste your rewarded + banner unit ids where marked.
   Until then everything uses the built-in house ad / empty slot — no revenue,
   but the "watch a video for X" reward loop is fully playable.
   ─────────────────────────────────────────────────────────────────────────── */
'use strict';
(function () {
  const WB = (window.WB = window.WB || {});

  // ===== CONFIG — fill in after AdinPlay approves you =====
  const CONFIG = {
    pub: "",        // your AdinPlay publisher id, e.g. "WIFIBILLIONAIRE"
    domain: "",     // the domain you registered, e.g. "connection-games.github.io"
  };

  const isElectron = !!(window.wbDesktop && window.wbDesktop.isElectron);
  const ADS = (WB.ADS = { enabled: !isElectron, configured: false });
  ADS.configured = ADS.enabled && !!CONFIG.pub;
  // a real AdinPlay video player is present and configured
  const live = () => ADS.configured && window.aiptag && window.aiptag.adplayer;

  // ---------------------------------------------------------- Rewarded video
  // ADS.rewarded(onReward): play a rewarded ad, then grant. Falls back to a
  // built-in placeholder ad when no network is wired, so it always works.
  let pending = null;
  ADS.rewarded = function (onReward) {
    if (!ADS.enabled) { if (onReward) onReward(); return; } // desktop safety: never block
    if (live()) {
      pending = onReward;
      try {
        window.aiptag.cmd.player.push(function () { window.aiptag.adplayer.startPreRoll(); });
        return; // AdinPlay fires AIP_COMPLETE → ADS._complete() grants the reward
      } catch (e) { pending = null; }
    }
    houseAd(onReward);
  };
  // Wire these into the AdinPlay player config (AIP_COMPLETE / AIP_REMOVE) when you set it up.
  ADS._complete = function () { const cb = pending; pending = null; if (cb) cb(); };
  ADS._skipped = function () { pending = null; };

  // built-in placeholder "ad": a short branded countdown, then the reward unlocks
  function houseAd(onReward) {
    injectCSS();
    const ov = document.createElement("div");
    ov.className = "ad-overlay";
    let left = 5;
    ov.innerHTML =
      '<div class="ad-card">' +
        '<div class="ad-badge">AD</div>' +
        '<div class="ad-logo">📶</div>' +
        '<div class="ad-title">WiFi <span>Billionaire</span></div>' +
        '<div class="ad-sub">Reward unlocks in <b id="ad-count">' + left + '</b>s…</div>' +
        '<div class="ad-bar"><div class="ad-fill" id="ad-fill"></div></div>' +
      '</div>';
    document.body.appendChild(ov);
    const tick = setInterval(function () {
      left--;
      const c = ov.querySelector("#ad-count"); if (c) c.textContent = Math.max(0, left);
      const f = ov.querySelector("#ad-fill"); if (f) f.style.width = ((5 - left) / 5 * 100) + "%";
      if (left <= 0) { clearInterval(tick); ov.remove(); if (onReward) onReward(); }
    }, 1000);
  }

  // ---------------------------------------------------------- Banner
  // ADS.banner(el): fill a container with a banner. Empty (no ugly box) until a
  // network is wired. AdinPlay display call goes where marked.
  ADS.banner = function (el) {
    if (!ADS.enabled || !el) return;
    if (live()) {
      // Once you have a banner unit id from AdinPlay:
      // window.aiptag.cmd.display.push(function(){ window.aipDisplayTag.display(el.id); });
    }
  };

  function injectCSS() {
    if (document.getElementById("wb-ads-css")) return;
    const s = document.createElement("style");
    s.id = "wb-ads-css";
    s.textContent =
      ".ad-overlay{position:fixed;inset:0;z-index:11000;background:rgba(6,8,18,.86);backdrop-filter:blur(6px);" +
        "display:flex;align-items:center;justify-content:center;animation:adFade .2s ease}" +
      "@keyframes adFade{from{opacity:0}to{opacity:1}}" +
      ".ad-card{width:min(340px,86vw);background:linear-gradient(180deg,#1a2b54,#0a0f21);border:1px solid rgba(255,255,255,.12);" +
        "border-radius:20px;padding:26px 24px;text-align:center;color:#fff;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.5)}" +
      ".ad-badge{position:absolute;top:12px;right:12px;font-size:10px;font-weight:800;letter-spacing:1px;color:#0a0f21;" +
        "background:#ffd34d;padding:2px 8px;border-radius:6px}" +
      ".ad-logo{font-size:40px;line-height:1;margin-bottom:6px}" +
      ".ad-title{font-size:21px;font-weight:800}.ad-title span{color:#4dde80}" +
      ".ad-sub{font-size:13px;color:#aab3cc;margin-top:8px}.ad-sub b{color:#fff}" +
      ".ad-bar{height:6px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:16px}" +
      ".ad-fill{height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#4dde80,#2bb85f);transition:width 1s linear}" +
      ".ad-banner{display:flex;align-items:center;justify-content:center;min-height:0}" +
      ".ad-banner:empty{display:none}";
    document.head.appendChild(s);
  }
  injectCSS();
})();
