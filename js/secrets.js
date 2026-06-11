/* WiFi Billionaire — API config.
   The key here is a fallback baked at build time. The player can override it at
   runtime in Settings → AI (stored only in their own localStorage).
   Leave openaiKey empty to ship a keyless build (scam mode uses the offline victim). */
'use strict';
var WB = window.WB || {};
window.WB = WB;

WB.SECRETS = {
  openaiKey: "",                 // <-- baked key goes here (optional)
  openaiModel: "gpt-4o-mini",
  endpoint: "https://api.openai.com/v1/chat/completions",
};

// Effective key = player override (Settings) or the baked one.
WB.aiKey = function () {
  try {
    const k = localStorage.getItem("wb_openai_key");
    if (k && k.trim()) return k.trim();
  } catch (e) {}
  return WB.SECRETS.openaiKey || "";
};
WB.aiModel = function () {
  try {
    const m = localStorage.getItem("wb_openai_model");
    if (m && m.trim()) return m.trim();
  } catch (e) {}
  return WB.SECRETS.openaiModel;
};
WB.aiEnabled = function () { return !!WB.aiKey(); };
