/* WiFi Billionaire — JUICE: the "game feel" layer. Self-contained, injects its own
 * CSS, no game logic. Coin-burst particles, screen flashes, micro screen-shake,
 * expanding rings, and element pulses — the little hits of feedback that make every
 * tap, win and milestone land. Respects the existing "confetti" effects toggle, so
 * players who turn effects off get none of it.
 *
 *   WB.JUICE.coins(srcElOrPoint, count, {power, spread, icon})
 *   WB.JUICE.ring(srcElOrPoint, color)
 *   WB.JUICE.flash(color, ms)
 *   WB.JUICE.shake(intensity)
 *   WB.JUICE.pulse(el)
 */
'use strict';

(function () {
  const WB = (window.WB = window.WB || {});

  // master gate — reuse the existing "confetti" setting as the effects switch
  function on() { try { return !(WB.UI && WB.UI.getSetting) || WB.UI.getSetting("confetti"); } catch (e) { return true; } }

  // resolve an element OR a {x,y} viewport point to a viewport-centered point
  function pt(src) {
    if (!src) return { x: innerWidth / 2, y: innerHeight / 2 };
    if (src.getBoundingClientRect) { const r = src.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    return { x: src.x, y: src.y };
  }

  let layer;
  function L() {
    if (!layer || !layer.isConnected) { layer = document.createElement("div"); layer.id = "juice-layer"; document.body.appendChild(layer); }
    return layer;
  }

  function coins(src, count, opts) {
    if (!on()) return;
    opts = opts || {};
    const p = pt(src), n = Math.min(count || 8, 28), icon = opts.icon || "🪙", power = opts.power || 1, spread = opts.spread || 2.2;
    for (let i = 0; i < n; i++) {
      const c = document.createElement("div");
      c.className = "juice-coin";
      c.textContent = icon;
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * spread;
      const dist = (40 + Math.random() * 90) * power;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist - (18 + Math.random() * 40);
      c.style.left = p.x + "px"; c.style.top = p.y + "px";
      c.style.setProperty("--dx", dx.toFixed(1) + "px");
      c.style.setProperty("--dy", dy.toFixed(1) + "px");
      c.style.setProperty("--rot", (Math.random() * 540 - 270).toFixed(0) + "deg");
      c.style.setProperty("--dur", (0.7 + Math.random() * 0.5).toFixed(2) + "s");
      c.style.fontSize = (12 + Math.random() * 8) + "px";
      L().appendChild(c);
      setTimeout(((el) => () => el.remove())(c), 1300);
    }
  }

  function ring(src, color) {
    if (!on()) return;
    const p = pt(src), r = document.createElement("div");
    r.className = "juice-ring";
    r.style.left = p.x + "px"; r.style.top = p.y + "px";
    if (color) r.style.borderColor = color;
    L().appendChild(r);
    setTimeout(() => r.remove(), 680);
  }

  function flash(color, ms) {
    if (!on()) return;
    const f = document.createElement("div");
    f.className = "juice-flash";
    f.style.background = "radial-gradient(125% 95% at 50% 50%, transparent 52%, " + (color || "rgba(52,199,89,0.28)") + " 100%)";
    L().appendChild(f);
    requestAnimationFrame(() => { f.style.opacity = "1"; });
    setTimeout(() => { f.style.opacity = "0"; setTimeout(() => f.remove(), 320); }, ms || 120);
  }

  function shake(intensity) {
    if (!on()) return;
    const app = document.getElementById("app"); if (!app) return;
    app.style.setProperty("--shake", (intensity || 4) + "px");
    app.classList.remove("juice-shake"); void app.offsetWidth; app.classList.add("juice-shake");
    setTimeout(() => app.classList.remove("juice-shake"), 400);
  }

  function pulse(el) {
    if (!on() || !el) return;
    el.classList.remove("juice-pulse"); void el.offsetWidth; el.classList.add("juice-pulse");
  }

  const css = document.createElement("style");
  css.id = "juice-css";
  css.textContent = `
#juice-layer { position: fixed; inset: 0; pointer-events: none; z-index: 240; overflow: hidden; }
.juice-coin {
  position: fixed; transform: translate(-50%, -50%); will-change: transform, opacity;
  animation: juiceCoin var(--dur, 1s) cubic-bezier(.2,.7,.3,1) forwards;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,.35));
}
@keyframes juiceCoin {
  0%   { transform: translate(-50%, -50%) scale(.4) rotate(0); opacity: 0; }
  16%  { opacity: 1; transform: translate(-50%, -50%) scale(1.18) rotate(calc(var(--rot) * .2)); }
  100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy) + 130px)) scale(.6) rotate(var(--rot)); opacity: 0; }
}
.juice-ring {
  position: fixed; width: 18px; height: 18px; border-radius: 50%;
  border: 3px solid rgba(255,206,77,.9); transform: translate(-50%, -50%);
  animation: juiceRing .62s ease-out forwards;
}
@keyframes juiceRing {
  0%   { opacity: .9; transform: translate(-50%, -50%) scale(.3); }
  100% { opacity: 0;  transform: translate(-50%, -50%) scale(5.5); }
}
.juice-flash { position: fixed; inset: 0; opacity: 0; transition: opacity .12s ease; pointer-events: none; }
#app.juice-shake { animation: juiceShake .38s ease; }
@keyframes juiceShake {
  0%,100% { transform: translate(0,0); }
  20% { transform: translate(calc(var(--shake,4px) * -1), 1px); }
  40% { transform: translate(var(--shake,4px), -1px); }
  60% { transform: translate(calc(var(--shake,4px) * -.6), 1px); }
  80% { transform: translate(calc(var(--shake,4px) * .4), 0); }
}
.juice-pulse { animation: juicePulse .42s ease; }
@keyframes juicePulse { 0% { transform: scale(1); } 42% { transform: scale(1.16); } 100% { transform: scale(1); } }

/* hustle combo badge (driven by ui.js) */
#hustle-btn { position: relative; }
#combo-badge {
  position: absolute; top: -10px; right: -8px; z-index: 3;
  padding: 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 900; letter-spacing: .02em;
  color: #1a1206; background: linear-gradient(160deg, #ffd97a, #ff9f0a);
  border: 1.5px solid rgba(255,255,255,.5); box-shadow: 0 3px 12px rgba(255,159,10,.5);
  opacity: 0; transform: scale(.4) rotate(-8deg); transition: opacity .15s ease, transform .15s cubic-bezier(.18,1.4,.4,1);
  pointer-events: none;
  --combo: 0;
  filter: hue-rotate(calc(var(--combo) * -2.2deg));
}
#combo-badge.show { opacity: 1; transform: scale(1) rotate(-6deg); }
#combo-badge.bump { animation: comboBump .26s cubic-bezier(.2,1.5,.4,1); }
@keyframes comboBump { 0% { transform: scale(1.35) rotate(-6deg); } 100% { transform: scale(1) rotate(-6deg); } }
@media (prefers-reduced-motion: reduce) {
  .juice-coin, .juice-ring, #app.juice-shake, .juice-pulse, #combo-badge.bump { animation: none !important; }
}
`;
  document.head.appendChild(css);

  WB.JUICE = { coins, ring, flash, shake, pulse };
})();
