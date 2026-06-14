/* WiFi Billionaire — CrazyGames SDK integration (optional, self-contained).

   CrazyGames runs the game in a sandboxed iframe and wants the game to report
   its loading + gameplay lifecycle so it can place ads at safe moments. This
   shim wires those events IF the CrazyGames SDK is present (it is injected on
   crazygames.com and loaded from their CDN via the <script> in index.html).

   Everywhere else — GitHub Pages, itch.io, the Electron desktop app, or a plain
   file:// open — window.CrazyGames is undefined, so every call below no-ops and
   the game is completely unaffected. */
'use strict';
(function () {
  const WB = (window.WB = window.WB || {});
  const CG = (WB.CG = { ready: false });

  const sdk = () => (window.CrazyGames && window.CrazyGames.SDK) || null;
  const game = () => { const s = sdk(); return (s && s.game) || null; };
  const safe = (fn) => { try { return fn(); } catch (e) {} };

  let playing = false;
  CG.gameplayStart = () => { if (playing) return; playing = true; safe(() => game() && game().gameplayStart()); };
  CG.gameplayStop  = () => { if (!playing) return; playing = false; safe(() => game() && game().gameplayStop()); };
  // Call on a genuinely happy beat (big win, prestige, achievement) — CrazyGames
  // uses it to time a rewarding ad. Harmless no-op off-platform.
  CG.happytime = () => safe(() => game() && game().happytime());

  if (!sdk()) return; // not on CrazyGames — stay dormant

  safe(() => game() && game().loadingStart());

  (async function () {
    await safe(async () => window.CrazyGames.SDK.init());
    CG.ready = true;
    safe(() => game() && game().loadingStop());

    // Gameplay starts once the boot splash is gone (the game is interactive).
    const begin = () => CG.gameplayStart();
    if (!document.getElementById('splash')) begin();
    else {
      const iv = setInterval(() => {
        if (!document.getElementById('splash')) { clearInterval(iv); begin(); }
      }, 400);
      setTimeout(() => { clearInterval(iv); begin(); }, 20000); // safety
    }

    // Pause/resume gameplay reporting with tab visibility.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) CG.gameplayStop(); else CG.gameplayStart();
    });
  })();
})();
