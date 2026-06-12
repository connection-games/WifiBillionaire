/* WiFi Billionaire — preload bridge (contextIsolation ON).
   Exposes a minimal, safe API to the renderer: a userData-backed save store and
   the auto-update channel. No Node APIs leak into the page. */
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wbDesktop', {
  isElectron: true,
  version: (() => { try { return ipcRenderer.sendSync('app:version'); } catch (e) { return null; } })(),

  // --- persistent save store (lives in OS userData dir) ---
  loadSync: () => { try { return ipcRenderer.sendSync('save:loadSync') || {}; } catch (e) { return {}; } },
  save: (k, v) => ipcRenderer.send('save:write', { k, v: String(v) }),
  remove: (k) => ipcRenderer.send('save:remove', { k }),

  // --- AI proxy (renderer -> main -> OpenAI, no CORS) ---
  aiChat: (payload) => ipcRenderer.invoke('ai:chat', payload),

  // --- auto-update (fully automatic; renderer just listens for status) ---
  onUpdateStatus: (cb) => ipcRenderer.on('updater:status', (_e, data) => cb(data)),
  checkForUpdates: () => ipcRenderer.send('updater:check'),
});
