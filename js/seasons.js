/* WiFi Billionaire — SEASONS (v1 foundation). See SEASONS.md for the full plan.
 *
 * A season is a calendar-driven theme that bends the game for a stretch: bonus
 * modifiers + a top-bar banner. v1 ships the engine, the banner, and CRIME SEASON
 * live (bigger scores, heat cools faster). Other seasons show their banner; their
 * deeper hooks (income/XP/venture/leaderboard) are the v2/v3 roadmap.
 *
 * Date-driven so no deploy is needed to flip a season — the same reason the game
 * runs fully offline. WB.SEASONS.mods() returns the active multipliers, read by
 * the systems that care (crime.js already does). Admin can force one for testing
 * via localStorage "wb_season_force" = <id> | "off".
 */
'use strict';

(function () {
  const WB = (window.WB = window.WB || {});
  const T = (s) => (WB.t ? WB.t(s) : s);

  // Quarterly rotation — one season is always live (months are 0-indexed).
  const SEASONS = [
    { id: "crime",    name: "Crime Season",    emoji: "🦹", color: "#ff5a5a", months: [5, 6, 7],
      blurb: "The city looks the other way — every score pays more and heat fades fast.",
      mods: { crimePay: 1.25, heatCool: 1.5 } },
    { id: "heist",    name: "Heist Season",    emoji: "🎩", color: "#ffce4d", months: [8, 9, 10],
      blurb: "Big-score weather. Crews hit harder. (Deeper bonuses coming soon.)",
      mods: { crewPay: 1.30 } },
    { id: "founders", name: "Founders Season", emoji: "🚀", color: "#5e9eff", months: [11, 0, 1],
      blurb: "Build the empire. (Venture + prestige bonuses coming soon.)",
      mods: { ventureCost: 0.85 } },
    { id: "hustle",   name: "Hustle Season",   emoji: "💰", color: "#4dde80", months: [2, 3, 4],
      blurb: "The grind pays. (Income + XP bonuses coming soon.)",
      mods: { income: 1.20, xp: 1.25 } },
  ];

  function forced() {
    try { return localStorage.getItem("wb_season_force") || ""; } catch (e) { return ""; }
  }
  function current() {
    const f = forced();
    if (f === "off") return null;
    if (f) { const s = SEASONS.find((x) => x.id === f); if (s) return s; }
    const m = new Date().getMonth();
    return SEASONS.find((s) => s.months.includes(m)) || null;
  }
  function mods() { const s = current(); return s ? s.mods : {}; }

  // ---- top-bar banner chip ----
  function injectCss() {
    if (document.getElementById("season-css")) return;
    const el = document.createElement("style");
    el.id = "season-css";
    el.textContent = `
#season-chip {
  display: inline-flex; align-items: center; gap: 6px; cursor: default;
  padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; white-space: nowrap;
  color: #fff; border: 1px solid color-mix(in srgb, var(--sc) 55%, transparent);
  background: linear-gradient(160deg, color-mix(in srgb, var(--sc) 32%, transparent), color-mix(in srgb, var(--sc) 14%, transparent));
  box-shadow: 0 0 14px color-mix(in srgb, var(--sc) 30%, transparent);
}
#season-chip .sc-emoji { font-size: 13px; }
#season-chip .sc-live { font-size: 8.5px; letter-spacing: .1em; opacity: .85; padding: 1px 5px; border-radius: 999px; background: color-mix(in srgb, var(--sc) 40%, transparent); }
@media (max-width: 1100px) { #season-chip .sc-name { display: none; } }
`;
    document.head.appendChild(el);
  }
  function mount() {
    const badges = document.getElementById("badges");
    if (!badges) { setTimeout(mount, 400); return; }
    injectCss();
    let chip = document.getElementById("season-chip");
    if (!chip) { chip = document.createElement("div"); chip.id = "season-chip"; badges.appendChild(chip); }
    render(chip);
    // refresh hourly in case the season rolls over while the tab is open
    setInterval(() => render(chip), 3600000);
  }
  function render(chip) {
    const s = current();
    if (!s) { chip.style.display = "none"; return; }
    chip.style.display = "";
    chip.style.setProperty("--sc", s.color);
    chip.title = s.blurb;
    chip.innerHTML = `<span class="sc-emoji">${s.emoji}</span><span class="sc-name">${T(s.name)}</span><span class="sc-live">${T("LIVE")}</span>`;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  WB.SEASONS = { SEASONS, current, mods };
})();
