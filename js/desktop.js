/* WiFi Billionaire — desktop (Electron) integration.
   MUST load before the game scripts. In a plain browser it no-ops, so the web/
   preview build is unaffected.

   1) Seeds localStorage from the userData-backed JSON store, so saves & settings
      survive app updates and live in the OS app-data dir (never the install dir).
   2) Mirrors every save/setting write back to that store.
   3) Renders a friendly auto-update banner (progress + restart + errors). */
'use strict';
(function () {
  const D = window.wbDesktop;
  if (!D || !D.isElectron) return; // browser / preview — nothing to do

  // ---- 1 & 2: back localStorage with the userData store ----
  const KEEP = (k) => /^(wifi_billionaire_save|wb_)/.test(k);
  try {
    const data = D.loadSync() || {};
    Object.keys(data).forEach((k) => { try { localStorage.setItem(k, data[k]); } catch (e) {} });
  } catch (e) {}

  const _set = Storage.prototype.setItem;
  const _rem = Storage.prototype.removeItem;
  Storage.prototype.setItem = function (k, v) {
    _set.call(this, k, v);
    if (this === window.localStorage && KEEP(k)) { try { D.save(k, v); } catch (e) {} }
  };
  Storage.prototype.removeItem = function (k) {
    _rem.call(this, k);
    if (this === window.localStorage && KEEP(k)) { try { D.remove(k); } catch (e) {} }
  };

  // ---- 3: update banner ----
  function fmtBps(b) {
    if (!b) return '';
    const u = ['B', 'KB', 'MB', 'GB']; let i = 0;
    while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
    return b.toFixed(1) + ' ' + u[i] + '/s';
  }
  let banner = null;
  function ensureBanner() {
    if (banner) return banner;
    banner = document.createElement('div');
    banner.id = 'update-banner';
    (document.body || document.documentElement).appendChild(banner);
    return banner;
  }
  function hide() { if (banner) banner.style.display = 'none'; }
  function render(html, cls) {
    const b = ensureBanner();
    b.className = cls || '';
    b.style.display = 'flex';
    b.innerHTML = html;
  }

  // The boot screen owns update UI while it's visible; this banner only kicks
  // in for updates that arrive after the game is already open (manual checks).
  const bootVisible = () => !!document.getElementById('splash');

  D.onUpdateStatus((s) => {
    if (bootVisible()) return;
    switch (s.state) {
      case 'available':
        render(`<span class="upd-spin"></span><div><b>Update found${s.version ? ' (v' + s.version + ')' : ''}</b><div class="upd-sub">Downloading automatically…</div></div>`);
        break;
      case 'progress':
        render(`<span class="upd-spin"></span><div style="flex:1"><b>Downloading update… ${s.percent}%</b>
          <div class="upd-track"><div class="upd-fill" style="width:${s.percent}%"></div></div>
          <div class="upd-sub">${fmtBps(s.bps)}</div></div>`);
        break;
      case 'downloaded':
        render(`<div style="flex:1"><b>✅ Update installed${s.version ? ' (v' + s.version + ')' : ''}</b>
          <div class="upd-sub">Restarting — your save is kept.</div></div>`, 'ready');
        break;
      case 'error':
        // non-fatal: keep playing, just inform briefly
        if (window.WB && WB.UI && WB.UI.toast) WB.UI.toast('⚠️ Update check failed: ' + s.message, 'bad');
        else render(`<div style="flex:1"><b>⚠️ Update check failed</b><div class="upd-sub">${s.message}</div></div><button class="upd-x" id="upd-x">✕</button>`, 'err'),
          (document.getElementById('upd-x') || {}).onclick = hide;
        if (banner && banner.className === 'err') setTimeout(hide, 6000);
        break;
      // 'checking' / 'none' / 'dev' — stay silent
      default: break;
    }
  });
})();
