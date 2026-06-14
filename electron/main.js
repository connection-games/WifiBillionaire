/* WiFi Billionaire — Electron main process.
   - Loads the bundled web game.
   - Persists ALL user data to a JSON file in the OS userData dir (survives updates).
   - Auto-updates from GitHub Releases via electron-updater, forwarding progress
     and errors to the renderer for a friendly in-app banner. */
'use strict';

const { app, BrowserWindow, ipcMain, shell, Menu, net } = require('electron');
const path = require('path');
const fs = require('fs');

// Use Electron's Chromium network stack (net.fetch) for update checks/downloads.
// Node's global fetch in the main process can fail on GitHub's redirect chain,
// corporate proxies, or certain TLS setups — which is what produced the
// "couldn't check for updates" boot message. net.fetch follows redirects and
// uses the system proxy + cert store, so it's far more reliable. Falls back to
// global fetch if net is somehow unavailable.
function wbFetch(url, opts = {}) {
  const timeoutMs = opts.timeoutMs || 20000;
  const doFetch = (net && net.fetch) ? (u) => net.fetch(u, { cache: 'no-store', redirect: 'follow' })
                                     : (u) => fetch(u, { cache: 'no-store' });
  return Promise.race([
    doFetch(url),
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
  ]);
}

// userData = OS-standard app data dir:
//   macOS:   ~/Library/Application Support/WiFi Billionaire
//   Windows: %APPDATA%/WiFi Billionaire
// (NOT the install folder — so updates & uninstalls never touch saves.)
app.setName('WiFi Billionaire');

const DATA_FILE = () => path.join(app.getPath('userData'), 'wifi-billionaire-data.json');

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE(), 'utf8')) || {}; }
  catch (e) { return {}; }
}
function writeData(obj) {
  try { fs.writeFileSync(DATA_FILE(), JSON.stringify(obj), 'utf8'); }
  catch (e) { /* disk full / permissions — fail soft */ }
}

// ---- Save bridge IPC (renderer mirrors localStorage here) ----
ipcMain.on('save:loadSync', (e) => { e.returnValue = readData(); });
ipcMain.on('save:write', (e, { k, v }) => { const d = readData(); d[k] = v; writeData(d); });
ipcMain.on('save:remove', (e, { k }) => { const d = readData(); delete d[k]; writeData(d); });
ipcMain.on('app:version', (e) => { e.returnValue = app.getVersion(); });

// ---- AI proxy (avoids renderer CORS; key is passed per-call, never stored here) ----
ipcMain.handle('ai:chat', async (e, { endpoint, key, model, messages }) => {
  if (!key) return { error: 'no-key' };
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({ model, temperature: 0.9, max_tokens: 220, response_format: { type: 'json_object' }, messages }),
    });
    if (!res.ok) return { error: 'HTTP ' + res.status };
    const data = await res.json();
    return { content: data.choices[0].message.content };
  } catch (err) { return { error: String((err && err.message) || err) }; }
});

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: '#05060a',
    autoHideMenuBar: true,
    title: 'WiFi Billionaire',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // preload needs fs-free ipc only; keep simple + safe
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  // open external links (if any) in the real browser, never in-app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('did-finish-load', () => initUpdater(mainWindow));
}

// ---------- Auto-update ----------
// Fully automatic: on launch the app checks GitHub Releases and, if a new
// version exists, downloads + installs it by itself while the boot screen
// shows a progress bar. No dialogs. The app relaunches itself when done.
// Windows installs via electron-updater (works unsigned). macOS cannot use
// electron-updater without an Apple Developer ID signature, so it self-updates:
// download release zip -> verify sha512 -> swap .app -> relaunch.
const UPDATE_BASE = 'https://github.com/connection-games/WifiBillionaire/releases/latest/download/';

function sendStatus(win, payload) {
  if (win && !win.isDestroyed()) win.webContents.send('updater:status', payload);
}

let updaterStarted = false;
let updating = false;

function initUpdater(win) {
  if (updaterStarted) return;
  updaterStarted = true;
  if (!app.isPackaged) { sendStatus(win, { state: 'dev' }); return; } // no updates in dev
  if (process.platform === 'darwin') initMacUpdater(win);
  else initWinUpdater(win);
}

// --- Windows: electron-updater (NSIS auto-updates without code signing) ---
function initWinUpdater(win) {
  let autoUpdater;
  try { autoUpdater = require('electron-updater').autoUpdater; }
  catch (e) { sendStatus(win, { state: 'error', message: 'updater unavailable' }); return; }

  autoUpdater.autoDownload = true; // fully automatic
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => sendStatus(win, { state: 'checking' }));
  autoUpdater.on('update-available', (i) => {
    updating = true;
    sendStatus(win, { state: 'available', version: (i && i.version) || '?' });
  });
  autoUpdater.on('update-not-available', () => sendStatus(win, { state: 'none' }));
  autoUpdater.on('download-progress', (p) => sendStatus(win, {
    state: 'progress', percent: Math.round(p.percent || 0), bps: p.bytesPerSecond || 0,
  }));
  autoUpdater.on('update-downloaded', (i) => {
    sendStatus(win, { state: 'downloaded', version: i && i.version });
    // brief beat so the renderer can paint "Installing…" before we restart
    setTimeout(() => { try { autoUpdater.quitAndInstall(false, true); } catch (e) {} }, 700);
  });
  autoUpdater.on('error', (err) => {
    updating = false;
    sendStatus(win, { state: 'error', message: String((err && err.message) || err) });
  });

  ipcMain.removeAllListeners('updater:check');
  ipcMain.on('updater:check', () => { try { autoUpdater.checkForUpdates(); } catch (e) {} });

  try { autoUpdater.checkForUpdates(); } catch (e) {}
}

// --- macOS: self-updater (no Apple signature required) ---
function cmpVersions(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0; const y = pb[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

function initMacUpdater(win) {
  // fetch latest-mac.yml with a few retries (transient network blips shouldn't
  // surface the scary "couldn't check for updates" message)
  const fetchManifest = async () => {
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await wbFetch(UPDATE_BASE + 'latest-mac.yml');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.text();
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
    throw lastErr;
  };
  const check = async () => {
    if (updating) return;
    try {
      sendStatus(win, { state: 'checking' });
      const yml = await fetchManifest();
      const version = (yml.match(/^version:\s*(\S+)/m) || [])[1];
      if (!version || cmpVersions(version, app.getVersion()) <= 0) {
        sendStatus(win, { state: 'none' });
        return;
      }
      sendStatus(win, { state: 'available', version });
      const sha512 = (yml.match(/url:\s*WiFi-Billionaire\.zip[\s\S]*?sha512:\s*(\S+)/) || [])[1] || null;
      updating = true;
      await applyMacUpdate(win, version, sha512); // downloads, swaps, relaunches by itself
    } catch (err) {
      updating = false;
      sendStatus(win, { state: 'error', message: String((err && err.message) || err) });
    }
  };

  ipcMain.removeAllListeners('updater:check');
  ipcMain.on('updater:check', check);

  check();
}

async function applyMacUpdate(win, version, sha512) {
  const crypto = require('crypto');
  const { execFile } = require('child_process');
  const run = (cmd, args) => new Promise((resolve, reject) =>
    execFile(cmd, args, (err) => (err ? reject(err) : resolve())));

  // .app bundle of the running instance (execPath = .app/Contents/MacOS/<bin>)
  const appPath = path.resolve(process.execPath, '..', '..', '..');
  if (!appPath.endsWith('.app')) throw new Error('not running from an installed .app');

  const tmp = path.join(app.getPath('temp'), 'wifi-billionaire-update');
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const zipPath = path.join(tmp, 'update.zip');

  const res = await wbFetch(UPDATE_BASE + 'WiFi-Billionaire.zip', { timeoutMs: 180000 });
  if (!res.ok || !res.body) throw new Error('download failed: HTTP ' + res.status);
  const total = Number(res.headers.get('content-length')) || 0;
  const out = fs.createWriteStream(zipPath);
  const reader = res.body.getReader();
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    got += value.length;
    out.write(Buffer.from(value));
    sendStatus(win, { state: 'progress', percent: total ? Math.round((got / total) * 100) : 0, bps: 0 });
  }
  await new Promise((resolve) => out.end(resolve));

  if (sha512) {
    const hash = crypto.createHash('sha512').update(fs.readFileSync(zipPath)).digest('base64');
    if (hash !== sha512) throw new Error('update checksum mismatch — install aborted');
  }

  const extracted = path.join(tmp, 'extracted');
  await run('/usr/bin/ditto', ['-xk', zipPath, extracted]);
  const newApp = path.join(extracted, 'WiFi Billionaire.app');
  if (!fs.existsSync(path.join(newApp, 'Contents', 'MacOS'))) throw new Error('update package invalid');

  sendStatus(win, { state: 'downloaded', version });

  // swap the bundle (running process keeps its open files; new launch uses new app)
  const backup = path.join(tmp, 'previous.app');
  await run('/bin/mv', [appPath, backup]);
  try { await run('/bin/mv', [newApp, appPath]); }
  catch (e) { await run('/bin/mv', [backup, appPath]); throw e; }

  app.relaunch();
  app.exit(0);
}

// ---------- Lifecycle ----------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(buildMenu());
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });

  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [];
  if (isMac) template.push({ role: 'appMenu' });
  template.push({ role: 'editMenu' });
  template.push({
    label: 'View',
    submenu: [
      { role: 'reload' }, { role: 'togglefullscreen' }, { type: 'separator' },
      { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
    ],
  });
  return Menu.buildFromTemplate(template);
}
