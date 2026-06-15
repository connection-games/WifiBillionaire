/* WB.SOUND — self-contained WebAudio sound-effects engine.
 * No audio asset files: every sound is synthesized at runtime with the
 * Web Audio API. Attaches to the global `WB` namespace.
 *
 * Public API:
 *   WB.SOUND.play(name)  -> play a short synth sound (no-op if muted/unknown/no-ctx)
 *   WB.SOUND.toggle()    -> flip mute, persist to localStorage 'wb_muted', return muted bool
 *   WB.SOUND.isMuted()   -> boolean
 */
(function (global) {
  'use strict';

  var WB = global.WB = global.WB || {};

  var STORAGE_KEY = 'wb_muted';
  var MASTER_VOLUME = 0.18;

  var ctx = null;       // single shared AudioContext (lazy)
  var master = null;    // single shared master GainNode

  // ---- mute state (persisted) -------------------------------------------
  function readMuted() {
    try {
      return global.localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false; // default: sound ON
    }
  }

  function writeMuted(m) {
    try {
      global.localStorage.setItem(STORAGE_KEY, m ? '1' : '0');
    } catch (e) { /* ignore storage failures */ }
  }

  var muted = readMuted();

  // ---- audio context (lazy, created on first play) ----------------------
  function ensureCtx() {
    if (ctx) {
      // a previously-created context may have been suspended again
      if (ctx.state === 'suspended' && ctx.resume) {
        try { ctx.resume(); } catch (e) { /* ignore */ }
      }
      return ctx;
    }
    try {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(ctx.destination);
      if (ctx.state === 'suspended' && ctx.resume) {
        try { ctx.resume(); } catch (e) { /* ignore */ }
      }
    } catch (e) {
      ctx = null;
      master = null;
      return null;
    }
    return ctx;
  }

  // ---- low-level helpers ------------------------------------------------

  // A single enveloped oscillator tone. Always ramps to 0 at the end so
  // there are no clicks/pops.
  function tone(opts) {
    // opts: { freq, type, start, dur, peak, attack, endFreq, dest }
    var t0 = opts.start;
    var dur = opts.dur;
    var peak = (opts.peak == null) ? 1 : opts.peak;
    var attack = (opts.attack == null) ? 0.008 : opts.attack;

    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.endFreq != null) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, opts.endFreq), t0 + dur);
    }

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + attack);
    // smooth decay to (near) zero -> no pop
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.gain.setValueAtTime(0, t0 + dur);

    osc.connect(g);
    g.connect(opts.dest || master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
    return osc;
  }

  // A short burst of filtered white noise (for swooshes / clangs).
  function noise(opts) {
    // opts: { start, dur, peak, type, freq, q }
    var t0 = opts.start;
    var dur = opts.dur;
    var peak = (opts.peak == null) ? 1 : opts.peak;

    var frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < frames; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    var src = ctx.createBufferSource();
    src.buffer = buffer;

    var filter = ctx.createBiquadFilter();
    filter.type = opts.type || 'bandpass';
    filter.frequency.setValueAtTime(opts.freq || 1000, t0);
    if (opts.endFreq != null) {
      filter.frequency.linearRampToValueAtTime(opts.endFreq, t0 + dur);
    }
    if (opts.q != null) filter.Q.value = opts.q;

    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.gain.setValueAtTime(0, t0 + dur);

    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
    return src;
  }

  // ---- sound generators -------------------------------------------------
  // Each is small and individually guarded by play()'s try/catch.

  var GENERATORS = {
    // tiny soft UI blip
    click: function (t) {
      tone({ freq: 660, type: 'sine', start: t, dur: 0.06, peak: 0.5, attack: 0.004 });
    },

    // ascending "cha-ching"
    cash: function (t) {
      tone({ freq: 784, type: 'triangle', start: t,        dur: 0.12, peak: 0.7 }); // G5
      tone({ freq: 1047, type: 'triangle', start: t + 0.10, dur: 0.16, peak: 0.7 }); // C6
      tone({ freq: 1319, type: 'triangle', start: t + 0.18, dur: 0.18, peak: 0.6 }); // E6
    },

    // brighter sparkle: cash but higher + shimmer
    crit: function (t) {
      tone({ freq: 1047, type: 'triangle', start: t,        dur: 0.10, peak: 0.6 });
      tone({ freq: 1568, type: 'triangle', start: t + 0.07, dur: 0.12, peak: 0.6 });
      tone({ freq: 2093, type: 'sine',     start: t + 0.13, dur: 0.16, peak: 0.5 });
      // shimmer overtone
      tone({ freq: 3136, type: 'sine',     start: t + 0.13, dur: 0.16, peak: 0.18 });
    },

    // happy rising 3-note arpeggio
    level: function (t) {
      tone({ freq: 523, type: 'square',   start: t,        dur: 0.10, peak: 0.4 }); // C5
      tone({ freq: 659, type: 'square',   start: t + 0.09, dur: 0.10, peak: 0.4 }); // E5
      tone({ freq: 880, type: 'triangle', start: t + 0.18, dur: 0.18, peak: 0.5 }); // A5
    },

    // triumphant short fanfare (major arp -> chord)
    win: function (t) {
      tone({ freq: 523, type: 'triangle', start: t,        dur: 0.12, peak: 0.5 }); // C5
      tone({ freq: 659, type: 'triangle', start: t + 0.10, dur: 0.12, peak: 0.5 }); // E5
      tone({ freq: 784, type: 'triangle', start: t + 0.20, dur: 0.12, peak: 0.5 }); // G5
      // final C-major chord swell
      tone({ freq: 523, type: 'triangle', start: t + 0.28, dur: 0.22, peak: 0.4 });
      tone({ freq: 659, type: 'triangle', start: t + 0.28, dur: 0.22, peak: 0.4 });
      tone({ freq: 1047, type: 'sine',    start: t + 0.28, dur: 0.22, peak: 0.35 });
    },

    // descending sad two-note
    lose: function (t) {
      tone({ freq: 392, type: 'sine', start: t,        dur: 0.18, peak: 0.5, endFreq: 370 }); // G4
      tone({ freq: 311, type: 'sine', start: t + 0.16, dur: 0.24, peak: 0.5, endFreq: 294 }); // Eb4
    },

    // urgent repeating beep (3 beeps)
    alarm: function (t) {
      for (var i = 0; i < 3; i++) {
        tone({ freq: 1000, type: 'square', start: t + i * 0.10, dur: 0.06, peak: 0.4 });
      }
    },

    // police-ish up/down sweep
    siren: function (t) {
      tone({ freq: 600, type: 'sine', start: t,        dur: 0.14, peak: 0.45, endFreq: 950 });
      tone({ freq: 950, type: 'sine', start: t + 0.14, dur: 0.16, peak: 0.45, endFreq: 600 });
    },

    // heavy clang / low thud
    jail: function (t) {
      tone({ freq: 140, type: 'square',   start: t, dur: 0.28, peak: 0.5, endFreq: 70 });
      tone({ freq: 90,  type: 'triangle', start: t, dur: 0.30, peak: 0.5, endFreq: 55 });
      // metallic noise transient
      noise({ start: t, dur: 0.18, peak: 0.3, type: 'bandpass', freq: 1200, q: 2 });
    },

    // soft swoosh / whoosh
    open: function (t) {
      noise({ start: t, dur: 0.22, peak: 0.35, type: 'bandpass',
              freq: 400, endFreq: 2600, q: 0.7 });
    },

    // low buzz
    error: function (t) {
      tone({ freq: 130, type: 'square', start: t,        dur: 0.14, peak: 0.4 });
      tone({ freq: 110, type: 'square', start: t + 0.05, dur: 0.16, peak: 0.4 });
    },

    // quick bright ping
    coin: function (t) {
      tone({ freq: 1318, type: 'sine', start: t,        dur: 0.06, peak: 0.5 }); // E6
      tone({ freq: 1976, type: 'sine', start: t + 0.05, dur: 0.14, peak: 0.45 }); // B6
    }
  };

  // ---- public API -------------------------------------------------------

  function play(name) {
    if (muted) return;
    var gen = GENERATORS[name];
    if (!gen) return; // unknown name -> no-op
    var c = ensureCtx();
    if (!c) return;   // AudioContext unavailable -> no-op
    try {
      gen(c.currentTime + 0.001);
    } catch (e) {
      // one failing sound must never throw
    }
  }

  function toggle() {
    muted = !muted;
    writeMuted(muted);
    return muted;
  }

  function isMuted() {
    return muted;
  }

  WB.SOUND = {
    play: play,
    toggle: toggle,
    isMuted: isMuted,
    // expose for debugging / UI listings
    names: Object.keys(GENERATORS)
  };

})(typeof window !== 'undefined' ? window : this);
