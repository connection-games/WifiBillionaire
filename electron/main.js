/* WiFi Billionaire — Electron main process.
   - Loads the bundled web game.
   - Persists ALL user data to a JSON file in the OS userData dir (survives updates).
   - Auto-updates from GitHub Releases via electron-updater, forwarding progress
     and errors to the renderer for a friendly in-app banner. */
'use strict';

const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

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
function sendStatus(win, payload) {
  if (win && !win.isDestroyed()) win.webContents.send('updater:status', payload);
}

let updaterStarted = false;
function initUpdater(win) {
  if (updaterStarted) return;
  updaterStarted = true;
  if (!app.isPackaged) { sendStatus(win, { state: 'dev' }); return; } // no updates in dev

  let autoUpdater;
  try { autoUpdater = require('electron-updater').autoUpdater; }
  catch (e) { sendStatus(win, { state: 'error', message: 'updater unavailable' }); return; }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true; // applies on quit even if user ignores the banner

  autoUpdater.on('checking-for-update', () => sendStatus(win, { state: 'checking' }));
  autoUpdater.on('update-available', (i) => sendStatus(win, { state: 'available', version: i && i.version }));
  autoUpdater.on('update-not-available', () => sendStatus(win, { state: 'none' }));
  autoUpdater.on('download-progress', (p) => sendStatus(win, {
    state: 'progress', percent: Math.round(p.percent || 0), bps: p.bytesPerSecond || 0,
  }));
  autoUpdater.on('update-downloaded', (i) => sendStatus(win, { state: 'downloaded', version: i && i.version }));
  autoUpdater.on('error', (err) => sendStatus(win, { state: 'error', message: String((err && err.message) || err) }));

  ipcMain.removeAllListeners('updater:restart');
  ipcMain.on('updater:restart', () => { try { autoUpdater.quitAndInstall(); } catch (e) {} });
  ipcMain.removeAllListeners('updater:check');
  ipcMain.on('updater:check', () => { try { autoUpdater.checkForUpdates(); } catch (e) {} });

  try { autoUpdater.checkForUpdates(); } catch (e) {}
  // re-check every 6 hours for long sessions
  setInterval(() => { try { autoUpdater.checkForUpdates(); } catch (e) {} }, 6 * 60 * 60 * 1000);
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
