/* WiFi Billionaire — pixel-art room renderer.
   Draws the room on a 320x180 canvas (scaled up with image-rendering: pixelated)
   at ~12 fps: animated character, screens, LEDs, steam, window views. */
'use strict';

WB.ROOM = (function () {
  let ctx = null, getState = null, frame = 0;
  let pos = 168, facing = 1; // where the character is standing (canvas x)

  const W = 320, H = 180;
  const FLOOR_Y = 118;

  // wall, wallDark, floor, floorDark, trim, view
  const PAL = [
    { wall: "#6b5a78", wallD: "#5b4c66", floor: "#8a6a4d", floorD: "#79593e", trim: "#4a3d54", view: "brick" },    // parents' bedroom
    { wall: "#7a7064", wallD: "#695f54", floor: "#9b7c5c", floorD: "#86684a", trim: "#564e44", view: "alley" },    // tiny studio
    { wall: "#647686", wallD: "#556673", floor: "#a07a52", floorD: "#8a6743", trim: "#475663", view: "city" },     // small apartment
    { wall: "#5b7282", wallD: "#4c616f", floor: "#46545f", floorD: "#3a474f", trim: "#3e505b", view: "city" },     // modern apartment
    { wall: "#475569", wallD: "#3b485a", floor: "#5e4b33", floorD: "#4e3d28", trim: "#334050", view: "skyline" }, // luxury
    { wall: "#343e54", wallD: "#2b3447", floor: "#3a4658", floorD: "#2f3947", trim: "#262e3f", view: "skyline" },  // penthouse
    { wall: "#564a3d", wallD: "#483d32", floor: "#7a5c38", floorD: "#674c2d", trim: "#3b332a", view: "garden" },   // mansion
    { wall: "#3f93b5", wallD: "#357d9b", floor: "#e0ca96", floorD: "#cdb47e", trim: "#2c6a84", view: "ocean" },    // island
    { wall: "#232f47", wallD: "#1c2639", floor: "#2b3a55", floorD: "#223047", trim: "#171f30", view: "space" },    // campus
  ];

  const ERA_HOODIE = ["#4a7dbe", "#c05a3e", "#6a55a0", "#2e8a6a", "#b54470"];
  const SKIN = "#eebd92", SKIN_D = "#d6a276", HAIR = "#5a4632";

  // seeded pseudo-random (stable per draw, varies only by inputs)
  function srand(seed) {
    let x = seed | 0;
    return () => {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      return x / 0x7fffffff;
    };
  }

  function px(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  }

  // ---------- Window views (inside 56x40 at wx,wy) ----------
  function drawView(view, wx, wy, vw, vh) {
    const r = srand(99);
    const tw = Math.floor(frame / 6); // slow twinkle clock
    switch (view) {
      case "brick": {
        px(wx, wy, vw, vh, "#7a4b3a");
        for (let row = 0; row < vh / 6; row++)
          for (let col = -1; col < vw / 12; col++)
            px(wx + col * 12 + (row % 2 ? 6 : 0) + 1, wy + row * 6 + 1, 10, 4, row % 3 === 1 ? "#8a5645" : "#83513f");
        break;
      }
      case "alley": {
        px(wx, wy, vw, vh, "#2c3848");
        px(wx + 4, wy + 12, 14, vh - 12, "#222d3a");
        px(wx + 36, wy + 8, 16, vh - 8, "#222d3a");
        for (let i = 0; i < 6; i++) px(wx + 6 + (i % 2) * 6, wy + 16 + Math.floor(i / 2) * 8, 3, 3, (i + tw) % 4 ? "#43536a" : "#ffd97a");
        px(wx + 24, wy + 5, 7, 7, "#f2ecc9"); // moon
        px(wx + 24, wy + 5, 2, 2, "#2c3848");
        break;
      }
      case "city": {
        px(wx, wy, vw, vh, "#8fc1e3");
        px(wx + vw - 12, wy + 3, 8, 8, "#ffe9a0"); // sun
        const hs = [18, 26, 14, 30, 22];
        hs.forEach((h, i) => {
          const bx = wx + i * 11, bw = 9;
          px(bx, wy + vh - h, bw, h, i % 2 ? "#5d7e9c" : "#6c8fae");
          for (let wn = 0; wn < Math.floor(h / 7); wn++) px(bx + 2, wy + vh - h + 2 + wn * 6, 2, 3, "#cfe5f5");
        });
        break;
      }
      case "skyline": {
        px(wx, wy, vw, vh, "#141c33");
        for (let i = 0; i < 14; i++) {
          const sx = wx + Math.floor(r() * vw), sy = wy + Math.floor(r() * (vh * 0.5));
          if ((i + tw) % 5) px(sx, sy, 1, 1, "#cdd8f5");
        }
        px(wx + vw - 13, wy + 4, 7, 7, "#e8e6e1");
        const hs2 = [16, 28, 20, 32, 24, 18];
        hs2.forEach((h, i) => {
          const bx = wx + i * 9;
          px(bx, wy + vh - h, 8, h, "#222c49");
          for (let wn = 0; wn < Math.floor(h / 6); wn++)
            if (r() > 0.4) px(bx + 2 + (wn % 2) * 3, wy + vh - h + 2 + wn * 5, 2, 2, "#ffd97a");
        });
        break;
      }
      case "garden": {
        px(wx, wy, vw, vh, "#a3d4f0");
        px(wx, wy + vh - 13, vw, 13, "#5f9e58");
        px(wx, wy + vh - 13, vw, 2, "#6fae66");
        px(wx + 8, wy + vh - 30, 4, 18, "#6e4f33"); // tree
        px(wx + 2, wy + vh - 38, 16, 12, "#4c8348");
        px(wx + 4, wy + vh - 42, 12, 6, "#5a9655");
        px(wx + 34, wy + vh - 26, 4, 14, "#6e4f33");
        px(wx + 28, wy + vh - 34, 16, 11, "#4c8348");
        [10, 22, 40, 48].forEach((fx, i) => px(wx + fx, wy + vh - 10 + (i % 2) * 3, 2, 2, i % 2 ? "#e86a92" : "#f2d05a"));
        px(wx + vw - 11, wy + 3, 7, 7, "#fff3b0");
        break;
      }
      case "ocean": {
        px(wx, wy, vw, vh * 0.45, "#b5e5f5");
        px(wx, wy + vh * 0.45, vw, vh * 0.55, "#2f9fc7");
        for (let i = 0; i < 5; i++) px(wx + ((i * 13 + tw * 2) % vw), wy + vh * 0.5 + i * 5, 8, 1, "#5dc1e2");
        px(wx + 6, wy + 4, 8, 8, "#fff3b0");
        const bx = wx + vw - 22;
        px(bx, wy + vh * 0.45 - 1, 12, 3, "#7a4b2f"); // boat
        px(bx + 5, wy + vh * 0.45 - 11, 1, 10, "#5b3a24");
        px(bx + 6, wy + vh * 0.45 - 10, 6, 7, "#f5f0e6");
        break;
      }
      case "space": {
        px(wx, wy, vw, vh, "#0a0f25");
        for (let i = 0; i < 26; i++) {
          const sx = wx + Math.floor(r() * vw), sy = wy + Math.floor(r() * vh);
          if ((i + tw) % 6) px(sx, sy, 1, 1, i % 3 ? "#dfe7ff" : "#9fb4ff");
        }
        px(wx + 34, wy + 8, 12, 12, "#c0563f"); // ringed planet
        px(wx + 36, wy + 10, 4, 3, "#d8765c");
        px(wx + 28, wy + 13, 24, 2, "#d8b16a");
        px(wx + 8, wy + 24, 7, 7, "#3f7ec2"); // earth, far away
        px(wx + 9, wy + 25, 3, 2, "#5da05c");
        break;
      }
    }
  }

  // ---------- Furniture ----------
  function drawWindow(p, h) {
    const wx = 26, wy = 22, vw = 60, vh = 44;
    px(wx - 4, wy - 4, vw + 8, vh + 8, p.trim);
    ctx.save();
    ctx.beginPath();
    ctx.rect(wx, wy, vw, vh);
    ctx.clip();
    drawView(p.view, wx, wy, vw, vh);
    ctx.restore();
    px(wx + vw / 2 - 1, wy, 2, vh, p.trim);
    px(wx, wy + vh / 2 - 1, vw, 2, p.trim);
    if (h >= 4) px(wx - 4, wy + vh + 4, vw + 8, 3, "#8a8276"); // sill
  }

  function drawDecor(h, eq) {
    // posters / art / shelves by housing tier
    if (h === 0) {
      px(252, 26, 40, 28, "#b8412f"); px(254, 28, 36, 24, "#cc4f3a");
      px(258, 38, 28, 8, "#7e2f22"); px(262, 40, 8, 4, "#f2d2a0"); px(276, 40, 8, 4, "#f2d2a0"); // dream car
      px(106, 26, 22, 30, "#3a3f55"); px(108, 28, 18, 26, "#4a5172"); px(112, 34, 10, 14, "#d8d2c2"); // band poster
    }
    if (h >= 1 && h <= 3) { px(252, 28, 34, 24, "#3c4250"); px(254, 30, 30, 20, "#5d7e9c"); px(258, 40, 22, 6, "#cfe5f5"); }
    if (h >= 2) { // plant
      px(296, FLOOR_Y - 16, 12, 16, "#a8552f"); px(298, FLOOR_Y - 14, 8, 2, "#8d4626");
      px(294, FLOOR_Y - 30, 6, 14, "#3f7d3b"); px(302, FLOOR_Y - 32, 6, 16, "#4c8f47"); px(299, FLOOR_Y - 36, 5, 20, "#357034");
    }
    if (h >= 3) { // bookshelf
      px(6, FLOOR_Y - 44, 16, 44, "#6b4a2f");
      for (let sh = 0; sh < 3; sh++) {
        px(8, FLOOR_Y - 38 + sh * 13, 12, 2, "#54381f");
        ["#b5483a", "#3f6fa0", "#d8a13c", "#4c8f47"].forEach((c, i) => px(8 + i * 3, FLOOR_Y - 48 + sh * 13 + 2, 2, 8, c));
      }
    }
    if (h >= 4) { px(244, 24, 48, 30, "#262626"); // big abstract art
      px(246, 26, 44, 26, "#e8e0d2"); px(250, 30, 14, 18, "#d2603f"); px(268, 34, 16, 10, "#3a6ea8"); px(264, 30, 4, 18, "#e3b53a"); }
    if (h >= 5) { // WIFI neon sign
      const on = Math.floor(frame / 8) % 7 !== 6;
      const neon = on ? "#5eead4" : "#2a5a52";
      px(120, 18, 2, 10, neon); px(124, 22, 2, 6, neon); px(128, 18, 2, 10, neon);
      px(134, 18, 2, 10, neon); px(140, 18, 8, 2, neon); px(143, 20, 2, 8, neon);
      px(152, 18, 2, 10, neon); px(158, 18, 2, 10, neon); px(160, 18, 6, 2, neon); px(160, 22, 4, 2, neon);
    }
    if (h >= 6) { // trophy shelf
      px(100, 38, 36, 3, "#8a6d3b");
      px(106, 26, 8, 12, "#e8c33c"); px(108, 24, 4, 3, "#f2d869"); px(104, 28, 2, 5, "#e8c33c"); px(114, 28, 2, 5, "#e8c33c");
      px(122, 30, 7, 8, "#cfcfd6");
    }
    if (h >= 8) { // animated hologram panel
      const hy = 26 + Math.floor(Math.sin(frame / 5) * 2);
      px(218, hy, 22, 30, "rgba(94,234,212,0.16)");
      px(220, hy + 4, 18, 2, "#5eead4"); px(220, hy + 9, 12, 2, "rgba(94,234,212,0.7)");
      px(220, hy + 14, 16, 2, "rgba(94,234,212,0.5)"); px(220, hy + 19, 10, 2, "rgba(94,234,212,0.7)");
      const dy = hy + 6 + Math.floor((frame % 18) / 1.2);
      px(218, Math.min(dy, hy + 28), 22, 1, "rgba(94,234,212,0.35)");
    }
  }

  function drawRug(h) {
    if (h < 2) return;
    const rw = h >= 5 ? 120 : 88, rx = 160 - rw / 2 + 30;
    const c1 = h >= 5 ? "#7e3a4f" : "#5d6e8c", c2 = h >= 5 ? "#9c4a63" : "#6f82a3";
    px(rx, FLOOR_Y + 26, rw, 22, c1);
    px(rx + 4, FLOOR_Y + 29, rw - 8, 16, c2);
    if (h >= 5) px(rx + 10, FLOOR_Y + 33, rw - 20, 8, c1);
  }

  function drawServer(eq) {
    const t = eq.server;
    if (t < 0) return;
    const rows = Math.min(8, t + 2);
    const sh = rows * 9 + 10;
    const sx = 282, sy = FLOOR_Y + 38 - sh;
    px(sx - 2, sy - 2, 32, sh + 4, "#15181f");
    px(sx, sy, 28, sh, "#232833");
    for (let i = 0; i < rows; i++) {
      px(sx + 2, sy + 4 + i * 9, 24, 6, "#2e3542");
      px(sx + 4, sy + 6 + i * 9, 8, 2, "#1c212b");
      const on = (Math.floor(frame / 2) + i * 3) % 7 !== 0;
      px(sx + 21, sy + 6 + i * 9, 2, 2, on ? (i % 2 ? "#46e0a0" : "#5eead4") : "#1f4a3c");
    }
  }

  function drawRouter(eq) {
    const t = eq.internet;
    if (t < 0) return;
    px(206, 56, 30, 3, "#4a4438"); // shelf
    px(210, 48, 22, 8, "#2c313c");
    const ants = Math.min(4, 1 + Math.floor(t / 2));
    for (let i = 0; i < ants; i++) px(212 + i * 5, 42 - i % 2 * 2, 2, 6 + i % 2 * 2, "#2c313c");
    px(228, 51, 2, 2, frame % 6 < 4 ? "#46e0a0" : "#1f4a3c");
  }

  function drawDesk(eq) {
    const dt = Math.max(0, eq.desk);
    const deskCols = ["#8a6f4d", "#9c7b50", "#7d5a3c", "#454d5c", "#39404d", "#5b4936", "#4a5a6c", "#323f52"];
    const c = deskCols[Math.min(dt, 7)];
    const dw = 104 + dt * 2;
    const dx = 160 - dw / 2, dy = FLOOR_Y - 4;
    px(dx, dy, dw, 6, c);
    px(dx, dy + 6, dw, 2, "rgba(0,0,0,0.25)");
    px(dx + 4, dy + 8, 5, 30, c);
    px(dx + dw - 9, dy + 8, 5, 30, c);
    return { dx, dy, dw };
  }

  function drawScreens(eq, desk, state, focus) {
    const { dx, dy, dw } = desk;
    const cx = dx + dw / 2;
    const mt = eq.monitor, lt = eq.laptop;
    const off = state === "rest";
    const r = srand(Math.floor(frame / 5) * 7 + 3); // code "types" over time

    function screen(sx, sy, sw, sh) {
      px(sx - 1, sy - 1, sw + 2, sh + 2, "#15181f");
      px(sx, sy, sw, sh, off ? "#10131a" : "#15314a");
      if (off) return;
      if (focus === "crypto") {
        // candlestick chart — the only honest part of crypto
        px(sx, sy, sw, sh, "#101b26");
        const rc = srand(Math.floor(frame / 10) * 13 + 5);
        const n = Math.floor((sw - 6) / 5);
        for (let i = 0; i < n; i++) {
          const up = rc() > 0.45;
          const bh = 3 + Math.floor(rc() * (sh - 10));
          const by = sy + sh - 3 - bh;
          const col = up ? "#46e0a0" : "#ff6b5e";
          px(sx + 3 + i * 5, by - 2, 1, bh + 4, col); // wick
          px(sx + 2 + i * 5, by, 3, bh, col);         // body
        }
        px(sx, sy + sh + 1, sw, 1, "rgba(70,224,160,0.25)");
        return;
      }
      if (focus === "content") {
        // video editing timeline
        px(sx, sy, sw, sh, "#1a1426");
        px(sx + 3, sy + 3, sw - 6, Math.max(4, sh - 14), "#2b2140"); // preview window
        px(sx + 5, sy + 5, 6, 4, "#e8d27f"); // tiny face cam
        const ty = sy + sh - 8;
        ["#c79bf2", "#7fb4e8", "#5fd3a5"].forEach((c, i) => px(sx + 3 + i * 9, ty + (i % 2) * 3, 8, 2, c)); // clips
        const ph = sx + 3 + ((frame * 1.5) % (sw - 6));
        px(ph, ty - 2, 1, 8, "#fff"); // playhead
        return;
      }
      if (focus === "study") {
        // documentation page, mostly unread
        px(sx, sy, sw, sh, "#d8d2c2");
        for (let i = 0; i < Math.floor((sh - 6) / 4); i++) px(sx + 3, sy + 3 + i * 4, sw - 8, 2, i === 0 ? "#5a5248" : "#a59c8c");
        return;
      }
      const lines = Math.floor((sh - 4) / 4);
      for (let i = 0; i < lines; i++) {
        const lw = 4 + Math.floor(r() * (sw - 10));
        const col = ["#5fd3a5", "#7fb4e8", "#c79bf2", "#e8d27f"][Math.floor(r() * 4)];
        px(sx + 3, sy + 3 + i * 4, lw, 2, col);
      }
      if (Math.floor(frame / 3) % 2) px(sx + sw - 6, sy + sh - 5, 3, 3, "#d8e6f5"); // cursor
      px(sx, sy + sh + 1, sw, 1, "rgba(95,211,165,0.25)"); // glow
    }

    if (mt >= 0) {
      const n = mt >= 6 ? 3 : (mt >= 3 ? 2 : 1);
      const sw = mt >= 6 ? 26 : 34, sh = 22;
      const total = n * sw + (n - 1) * 4;
      for (let i = 0; i < n; i++) {
        const sx = cx - total / 2 + i * (sw + 4);
        screen(sx, dy - sh - 8, sw, sh);
        px(sx + sw / 2 - 1, dy - 8, 2, 5, "#15181f");
        px(sx + sw / 2 - 5, dy - 3, 10, 2, "#15181f");
      }
    } else if (lt >= 0) {
      screen(cx - 14, dy - 20, 28, 17);
      px(cx - 16, dy - 3, 32, 2, "#2a2f3a");
    }

    // keyboard
    if (eq.keyboard >= 0) {
      if (eq.keyboard >= 4) {
        for (let i = 0; i < 8; i++) px(cx - 16 + i * 4, dy - 2, 3, 1, `hsl(${(frame * 12 + i * 45) % 360},85%,60%)`);
        px(cx - 16, dy - 1, 32, 2, "#3a3f4a");
      } else px(cx - 16, dy - 2, 32, 3, "#3a3f4a");
    }
    if (eq.mouse >= 0) px(cx + 24, dy - 2, 5, 3, "#454c5a");

    // PC tower
    if (eq.pc >= 0) {
      const tx = dx + dw + 6, ty = FLOOR_Y + 6;
      px(tx, ty, 16, 30, "#1c2029");
      px(tx + 2, ty + 2, 12, 26, "#262c38");
      if (eq.pc >= 3) px(tx + 3, ty + 4, 2, 22, `hsl(${(frame * 10) % 360},85%,62%)`);
      px(tx + 11, ty + 25, 2, 2, "#46e0a0");
    }

    // mug + steam
    px(dx + 12, dy - 6, 6, 6, "#c0392b");
    px(dx + 18, dy - 5, 2, 3, "#c0392b");
    if (!off) {
      const sy1 = dy - 10 - (frame % 8) / 2;
      px(dx + 13 + Math.sin(frame / 2) * 1.5, sy1, 1, 2, "rgba(255,255,255,0.5)");
      px(dx + 16 + Math.cos(frame / 2.5) * 1.5, sy1 - 3, 1, 2, "rgba(255,255,255,0.35)");
    }
  }

  function drawChairAndCharacter(eq, desk, state, era) {
    const { dx, dy, dw } = desk;
    const cx = dx + dw / 2;
    const ct = Math.max(0, eq.chair);
    const chairCols = ["#7a6a55", "#5a5a5a", "#8a3535", "#3a4a5e", "#2c3a4c", "#5b4a8a", "#1f6f6b", "#3d2b6b"];
    const cc = chairCols[Math.min(ct, 7)];
    const chy = FLOOR_Y + 8;

    if (state === "away") {
      // chair sits empty while he's off walking somewhere
      px(cx - 14, chy - 20, 6, 34, cc);
      px(cx - 12, chy + 12, 14, 3, cc);
      return;
    }
    if (state === "grass") {
      // empty chair; character stands at the window
      px(cx - 14, chy - 20, 6, 34, cc);
      px(cx - 12, chy + 12, 14, 3, cc);
      const gx = 56, gy = FLOOR_Y - 10;
      px(gx - 3, gy - 22, 10, 4, HAIR);
      px(gx - 2, gy - 19, 8, 7, SKIN);
      px(gx - 4, gy - 12, 12, 13, ERA_HOODIE[era]);
      px(gx - 2, gy + 1, 4, 9, "#39414f");
      px(gx + 2, gy + 1, 4, 9, "#39414f");
      px(gx - 2, gy + 10, 4, 2, "#222"); px(gx + 2, gy + 10, 4, 2, "#222");
      return;
    }

    const bob = state === "rest" ? 0 : (Math.floor(frame / 4) % 2);

    // chair behind character
    px(cx - 16, chy - 26, 6, 38, cc);                    // backrest
    if (ct >= 2) px(cx - 17, chy - 30, 8, 5, cc);        // headrest
    px(cx - 14, chy + 10, 24, 4, cc);                    // seat
    px(cx - 4, chy + 14, 3, 8, "#444a55");               // post
    px(cx - 10, chy + 22, 16, 2, "#444a55");             // base

    if (state === "rest") {
      // off to a proper bed (bottom-left), chair sits empty
      px(cx - 16, chy - 26, 6, 38, cc);
      px(cx - 14, chy + 10, 24, 4, cc);
      px(cx - 4, chy + 14, 3, 8, "#444a55");
      px(cx - 10, chy + 22, 16, 2, "#444a55");
      drawBedSleeper(era);
      return;
    }

    // seated, typing (viewed from behind)
    const hy = chy - 34 - bob;
    px(cx - 6, hy, 12, 5, HAIR);                          // hair
    px(cx - 5, hy + 4, 10, 7, SKIN);                      // head (back)
    px(cx - 6, hy + 4, 2, 5, SKIN_D); px(cx + 4, hy + 4, 2, 5, SKIN_D); // ears
    px(cx - 9, hy + 11, 18, 14, ERA_HOODIE[era]);         // torso
    px(cx - 9, hy + 11, 18, 3, shade(ERA_HOODIE[era]));   // hood line
    // arms reaching to keyboard
    const armY = dy - 4 - (bob ? 0 : 1);
    px(cx - 11, hy + 14, 3, armY - (hy + 14), ERA_HOODIE[era]);
    px(cx + 8, hy + 14, 3, armY - (hy + 14) + (bob ? 1 : 0), ERA_HOODIE[era]);
    px(cx - 11, armY, 3, 3, SKIN); px(cx + 8, armY + (bob ? 1 : 0), 3, 3, SKIN);
  }

  // ---------- Walking + bathroom ----------
  function drawToilet() {
    const tx = 10, ty = FLOOR_Y + 28;
    px(tx - 2, ty + 14, 22, 2, "#8d9096");      // bath mat shadow
    px(tx, ty + 6, 16, 9, "#e6eaef");           // bowl
    px(tx + 2, ty + 4, 12, 3, "#cdd3da");       // seat
    px(tx + 3, ty - 8, 10, 12, "#e6eaef");      // tank
    px(tx + 5, ty - 6, 6, 2, "#aab0b8");        // flush button
    px(tx + 19, ty - 2, 4, 4, "#f4efe2");       // toilet paper
    px(tx + 19, ty + 1, 4, 4, "#e8e2d4");
  }
  function drawToiletUse(era) {
    const tx = 10, ty = FLOOR_Y + 28;
    px(tx + 1, ty - 10, 10, 4, HAIR);           // seated, dignity mostly intact
    px(tx + 2, ty - 7, 8, 6, SKIN);
    px(tx - 1, ty - 1, 15, 8, ERA_HOODIE[era]);
    px(tx + 1, ty + 7, 4, 6, "#39414f"); px(tx + 8, ty + 7, 4, 6, "#39414f");
    px(tx + 15, ty - 2, 4, 6, "#15181f");       // phone. obviously.
    if (frame % 8 < 4) px(tx + 16, ty - 1, 2, 2, "#5fd3a5");
  }
  function drawWalker(x, dir, era) {
    const y = FLOOR_Y + 2;
    const step = Math.floor(frame / 3) % 2;
    px(x - 4 + (step ? 3 : 0), y + 22, 3, 8, "#39414f"); // legs scissor
    px(x + 2 - (step ? 3 : 0), y + 22, 3, 8, "#39414f");
    px(x - 4 + (step ? 3 : 0), y + 29, 4, 2, "#222");
    px(x + 2 - (step ? 3 : 0), y + 29, 4, 2, "#222");
    px(x - 6, y + 8, 12, 15, ERA_HOODIE[era]);           // body
    px(x - 8 + (step ? 1 : 0), y + 11, 3, 9, ERA_HOODIE[era]); // swinging arm
    px(x - 4, y, 9, 8, SKIN);                            // head, profile
    px(x - 5, y - 3, 11, 5, HAIR);
    px(x + (dir > 0 ? 3 : -2), y + 2, 2, 2, "#1d1d1f");  // eye toward direction
  }
  function drawStink(x, yTop) {
    for (let i = 0; i < 3; i++) {
      const wob = Math.sin(frame / 3 + i * 2) * 2;
      px(x - 8 + i * 8 + wob, yTop - 6 - ((frame + i * 6) % 14), 2, 5, "rgba(140,190,90,0.45)");
    }
  }

  // ---------- Situation set-pieces ----------
  function drawBedSleeper(era) {
    const bx = 26, by = FLOOR_Y + 18; // bed sits on the floor, bottom-left
    const breathe = Math.floor(frame / 7) % 2;
    px(bx - 4, by - 22, 5, 34, "#5b432e");                 // headboard
    px(bx + 64, by - 10, 5, 22, "#5b432e");                // footboard
    px(bx, by, 66, 8, "#6e5238");                          // frame
    px(bx, by - 6, 66, 7, "#e8e2d4");                      // mattress
    px(bx + 1, by - 11, 14, 6, "#f4efe2");                 // pillow
    // sleeper: head on pillow, body bump under blanket
    px(bx + 4, by - 15, 9, 4, HAIR);
    px(bx + 5, by - 12, 8, 5, SKIN);
    px(bx + 14, by - 10 - breathe, 48, 6 + breathe, ERA_HOODIE[era]); // blanket over body
    px(bx + 14, by - 10 - breathe, 48, 2, shade(ERA_HOODIE[era]));
    px(bx + 50, by - 8 - breathe, 12, 4, "#e8e2d4");       // feet poke out
    // snoring Z's drift up from the head
    const zf = frame % 28;
    const za = Math.max(0, 1 - zf / 28);
    px(bx + 12, by - 20 - zf / 2.4, 3, 3, `rgba(255,255,255,${za})`);
    if (zf > 9) px(bx + 17, by - 26 - zf / 3, 2, 2, `rgba(255,255,255,${za * 0.8})`);
    if (zf > 18) px(bx + 21, by - 31 - zf / 4, 2, 2, `rgba(255,255,255,${za * 0.6})`);
    if (Math.floor(frame / 14) % 2) px(bx + 13, by - 9, 2, 1, "#d6a276"); // open mouth, peak snore
  }

  function drawContentStudio(desk) {
    const { dx, dy, dw } = desk;
    const rx = dx + dw + 18; // ring light right of the desk
    px(rx + 5, FLOOR_Y - 26, 2, 26, "#3a3f4a");            // pole
    px(rx - 1, FLOOR_Y + 0, 14, 2, "#3a3f4a");             // feet
    const glow = Math.floor(frame / 4) % 5 !== 4;
    const ring = glow ? "#fff3c4" : "#8a8276";
    for (let i = 0; i < 10; i++) {                          // the ring, pixel circle
      const a = (i / 10) * Math.PI * 2;
      px(rx + 6 + Math.cos(a) * 8, FLOOR_Y - 34 + Math.sin(a) * 8, 2, 2, ring);
    }
    px(rx + 4, FLOOR_Y - 36, 5, 5, "#15181f");             // phone in the ring
    px(rx + 5, FLOOR_Y - 35, 3, 3, "#1c4666");
    if (Math.floor(frame / 6) % 2) px(rx + 5, FLOOR_Y - 41, 2, 2, "#ff453a"); // REC
    // paparazzi-style camera flashes
    if (frame % 34 < 2) {
      ctx.fillStyle = "rgba(255,255,255,0.20)";
      ctx.fillRect(0, 0, W, H);
      const fx = 60 + (frame * 37) % 200, fy = 30 + (frame * 23) % 60;
      px(fx, fy, 3, 3, "#fff"); px(fx - 3, fy + 1, 9, 1, "#fff"); px(fx + 1, fy - 3, 1, 9, "#fff");
    }
  }

  function drawAIBuddy(desk) {
    const { dx } = desk;
    const rx = dx - 26, ry = FLOOR_Y + 10; // little helper bot left of the desk
    const hover = Math.floor(Math.sin(frame / 6) * 2);
    px(rx, ry + hover, 14, 12, "#33415c");                  // body
    px(rx + 2, ry + 2 + hover, 10, 5, "#1c2233");           // face
    const eye = 2 + (Math.floor(frame / 8) % 3) * 3;        // scanning eye
    px(rx + eye, ry + 4 + hover, 2, 2, "#5eead4");
    px(rx + 6, ry - 4 + hover, 2, 4, "#33415c");            // antenna
    px(rx + 5, ry - 7 + hover, 3, 3, frame % 10 < 5 ? "#46e0a0" : "#1f4a3c");
    px(rx + 2, ry + 12 + hover, 3, 2, "#222"); px(rx + 9, ry + 12 + hover, 3, 2, "#222");
  }

  function drawStudyProps(desk) {
    const { dx, dy } = desk;
    px(dx + 26, dy - 5, 16, 5, "#f4efe2");                  // open book on the desk
    px(dx + 33, dy - 5, 2, 5, "#b8412f");                   // spine
    px(dx + 28, dy - 4, 4, 1, "#a59c8c"); px(dx + 37, dy - 4, 4, 1, "#a59c8c");
    px(dx + 28, dy - 2, 4, 1, "#a59c8c"); px(dx + 37, dy - 2, 4, 1, "#a59c8c");
    if (Math.floor(frame / 12) % 4 === 0) px(dx + 42, dy - 6, 2, 3, "#f4efe2"); // page flip
  }

  // ---------- Prison cell (the whole room changes) ----------
  function drawPrison(s) {
    // stone walls + concrete floor
    px(0, 0, W, FLOOR_Y, "#4b4e55");
    px(0, 0, W, 12, "#3f424a");
    px(0, FLOOR_Y - 6, W, 6, "#3f424a");
    for (let row = 0; row < 9; row++)
      for (let col = -1; col < 11; col++)
        px(col * 32 + (row % 2 ? 16 : 0), 12 + row * 12, 30, 10, row % 2 ? "#50535b" : "#4d5058");
    px(0, FLOOR_Y, W, H - FLOOR_Y, "#393b40");
    for (let i = 0; i < 7; i++) px(0, FLOOR_Y + 6 + i * 8, W, 1, "#2f3135");
    px(0, FLOOR_Y, W, 2, "#26282c");

    // tiny barred window, night sky
    const wx = 48, wy = 24, vw = 36, vh = 26;
    px(wx - 3, wy - 3, vw + 6, vh + 6, "#26282c");
    px(wx, wy, vw, vh, "#141c33");
    px(wx + 24, wy + 5, 6, 6, "#f2ecc9"); // moon
    px(wx + 26, wy + 6, 2, 2, "#141c33");
    for (let i = 0; i < 8; i++) px(wx + 2 + ((i * 9) % (vw - 4)), wy + 3 + ((i * 5) % (vh - 6)), 1, 1, "#cdd8f5");
    for (let i = 0; i < 3; i++) px(wx + 6 + i * 11, wy, 3, vh, "#26282c"); // window bars

    // swinging bulb
    const sway = Math.sin(frame / 10) * 3;
    const lx = 200 + sway;
    px(200, 0, 1, 16, "#26282c");
    const lit = frame % 60 < 55;
    px(lx - 3, 16, 7, 6, lit ? "#fff3c4" : "#6a6455");
    if (lit) {
      ctx.fillStyle = "rgba(255,236,170,0.05)";
      ctx.beginPath();
      ctx.moveTo(lx, 22); ctx.lineTo(lx - 30, FLOOR_Y); ctx.lineTo(lx + 30, FLOOR_Y); ctx.closePath();
      ctx.fill();
    }

    // tally marks: one group per arrest
    const groups = Math.min(6, 1 + ((WB.CRIME && WB.CRIME.crimeState().timesCaught) || 1));
    for (let g = 0; g < groups; g++) {
      const tx = 130 + g * 14, ty = 38;
      for (let i = 0; i < 4; i++) px(tx + i * 3, ty, 1, 8, "#c8cad0");
      px(tx - 1, ty + 2, 12, 1, "#c8cad0");
    }

    // bunk + prisoner
    const bx = 232, by = FLOOR_Y + 14;
    px(bx, by - 26, 4, 40, "#5a5d64"); px(bx + 62, by - 26, 4, 40, "#5a5d64"); // posts
    px(bx + 2, by - 22, 62, 4, "#6a6d74");                                     // top bunk
    px(bx + 2, by, 62, 4, "#6a6d74");                                          // bottom bunk
    px(bx + 4, by - 4, 58, 4, "#9a9da6");                                      // thin mattress
    const bob = Math.floor(frame / 8) % 2;
    const sx2 = bx + 26;
    px(sx2 - 5, by - 21 + bob, 10, 5, HAIR);                                   // head, hung low
    px(sx2 - 4, by - 17 + bob, 8, 6, SKIN);
    px(sx2 - 7, by - 12 + bob, 14, 10, "#d97f28");                             // prison jumpsuit
    px(sx2 - 7, by - 12 + bob, 14, 2, "#b8641c");
    px(sx2 - 5, by - 3, 4, 5, "#d97f28"); px(sx2 + 2, by - 3, 4, 5, "#d97f28"); // legs dangling
    px(sx2 - 5, by + 2 + (Math.floor(frame / 5) % 2), 4, 2, "#222");           // feet swing
    px(sx2 + 2, by + 2 + ((Math.floor(frame / 5) + 1) % 2), 4, 2, "#222");
    const sigh = frame % 90;
    if (sigh < 14) px(sx2 + 9, by - 16 - sigh / 3, 2, 2, `rgba(255,255,255,${0.5 - sigh / 30})`); // sigh

    // toilet, regrettably
    px(150, FLOOR_Y + 20, 14, 4, "#c8cad0");
    px(153, FLOOR_Y + 24, 8, 8, "#aab0b8");
    px(150, FLOOR_Y + 12, 4, 9, "#c8cad0");

    // cell door: heavy bars on the left wall
    px(2, 18, 34, FLOOR_Y + 24, "rgba(20,21,24,0.25)");
    for (let i = 0; i < 5; i++) px(4 + i * 7, 14, 3, FLOOR_Y + 28, "#22242a");
    px(2, 50, 34, 3, "#22242a"); px(2, 96, 34, 3, "#22242a"); // crossbars
    px(26, 70, 7, 9, "#3a3d44"); px(28, 73, 3, 3, "#ffd60a"); // lock plate + keyhole

    // a rat. for ambiance.
    const rt = (frame * 1.1) % 360;
    const rx2 = rt < 180 ? 60 + rt : 240 - (rt - 180);
    px(rx2, FLOOR_Y + 38, 8, 4, "#7a7d85");
    px(rx2 + (rt < 180 ? 7 : -2), FLOOR_Y + 37, 3, 3, "#7a7d85");
    px(rx2 + (rt < 180 ? -3 : 9), FLOOR_Y + 39, 3, 1, "#5d6068"); // tail
  }

  function shade(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (n >> 16) - 28), g = Math.max(0, ((n >> 8) & 255) - 28), b = Math.max(0, (n & 255) - 28);
    return `rgb(${r},${g},${b})`;
  }

  // ============================================================ CUTSCENES
  // Little in-canvas movies: the police arrest, the drive to the launch pad,
  // the trip to the Moon. play("arrest"|"launch"|"moon") and the room becomes
  // a stage until the sequence finishes.
  let cut = null; // { name, start }

  function play(name) {
    if (!CUTS[name]) return;
    cut = { name, start: Date.now() };
    pos = 160; // keep the thought bubble centered during the movie
  }

  function caption(text, y) {
    ctx.font = "bold 9px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(W / 2 - ctx.measureText(text).width / 2 - 5, (y || 158) - 9, ctx.measureText(text).width + 10, 13);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, W / 2, y || 158);
    ctx.textAlign = "left";
  }
  function letterbox() {
    px(0, 0, W, 9, "#000");
    px(0, H - 9, W, 9, "#000");
  }
  function starsBg(count, seed) {
    px(0, 0, W, H, "#070b1a");
    const r = srand(seed || 7);
    for (let i = 0; i < count; i++) {
      const sx = Math.floor(r() * W), sy = Math.floor(r() * H);
      if ((i + Math.floor(frame / 6)) % 7) px(sx, sy, 1, 1, i % 3 ? "#dfe7ff" : "#8fa6ff");
    }
  }
  function tinyGuy(x, y, outfit, step) {
    // generic 12px-tall pixel person, side profile
    px(x - 2, y - 12, 6, 4, HAIR);
    px(x - 1, y - 9, 5, 4, SKIN);
    px(x - 2, y - 5, 7, 7, outfit);
    px(x - 2 + (step ? 2 : 0), y + 2, 2, 4, "#39414f");
    px(x + 1 - (step ? 2 : 0), y + 2, 2, 4, "#39414f");
  }
  function copGuy(x, y, step) {
    px(x - 2, y - 13, 7, 3, "#1d2a4a");          // cap
    px(x - 1, y - 10, 5, 4, SKIN);
    px(x - 2, y - 6, 7, 8, "#27408b");           // uniform
    px(x - 1, y - 4, 2, 2, "#ffd60a");           // badge
    px(x - 2 + (step ? 2 : 0), y + 2, 2, 4, "#15203d");
    px(x + 1 - (step ? 2 : 0), y + 2, 2, 4, "#15203d");
  }
  function policeCar(x, y, flash) {
    px(x, y - 8, 44, 9, "#e8eaf0");              // body
    px(x + 9, y - 14, 24, 7, "#dfe3ea");         // cabin
    px(x + 11, y - 13, 9, 5, "#9fc4e8");         // windows
    px(x + 22, y - 13, 9, 5, "#9fc4e8");
    px(x + 4, y - 5, 16, 5, "#15181f");          // black doors
    px(x + 18, y - 16, 8, 3, flash ? "#ff453a" : "#0a84ff"); // lightbar
    px(x + 8, y + 1, 7, 6, "#1d1f24"); px(x + 10, y + 3, 3, 2, "#6e7480");  // wheels
    px(x + 31, y + 1, 7, 6, "#1d1f24"); px(x + 33, y + 3, 3, 2, "#6e7480");
  }
  function sportsCar(x, y) {
    px(x + 2, y - 7, 42, 8, "#c4322a");          // low body
    px(x + 12, y - 12, 20, 6, "#a82720");        // cabin
    px(x + 14, y - 11, 14, 4, "#8fd0f0");        // glass
    px(x, y - 5, 4, 4, "#ffd97a");               // headlight
    px(x + 7, y + 1, 7, 6, "#1d1f24"); px(x + 9, y + 3, 3, 2, "#6e7480");
    px(x + 32, y + 1, 7, 6, "#1d1f24"); px(x + 34, y + 3, 3, 2, "#6e7480");
  }
  function rocketSprite(x, y, h2, flame) {
    const w2 = Math.max(8, Math.round(h2 / 4));
    px(x - w2 / 2, y - h2, w2, h2, "#e8eaf0");                       // hull
    px(x - w2 / 2 + 2, y - h2 + 6, w2 - 4, 6, "#9fc4e8");            // window band
    px(x - w2 / 2, y - h2 - 6, w2, 7, "#c4322a");                    // nose
    px(x - w2 / 2 - 3, y - 10, 4, 10, "#c4322a");                    // fins
    px(x + w2 / 2 - 1, y - 10, 4, 10, "#c4322a");
    if (flame) {
      const f = Math.floor(frame / 2) % 2;
      px(x - 3, y, 6, 8 + f * 3, "#ff9f0a");
      px(x - 1, y, 2, 12 + f * 4, "#ffd60a");
    }
  }
  function roadScroll(speed) {
    px(0, 120, W, 60, "#3a3d44");                // asphalt
    px(0, 120, W, 2, "#2c2f35");
    for (let i = 0; i < 7; i++) {
      const lx = ((i * 56 - (frame * speed) % 56) + 56) % (W + 56) - 28;
      px(lx, 146, 26, 3, "#e8d27f");             // lane dashes fly past
    }
  }
  function skylinePan(offset) {
    px(0, 0, W, 120, "#16203a");                 // night sky
    const r = srand(31);
    for (let i = 0; i < 30; i++) {
      const sx = Math.floor(r() * W), sy = Math.floor(r() * 60);
      if ((i + Math.floor(frame / 7)) % 6) px(sx, sy, 1, 1, "#cdd8f5");
    }
    for (let i = -1; i < 9; i++) {               // parallax towers
      const bx = ((i * 48 - offset * 0.4) % (W + 48) + W + 48) % (W + 48) - 48;
      const bh = 34 + ((i * 37) % 40);
      px(bx, 120 - bh, 30, bh, "#222c49");
      for (let wn = 0; wn < bh / 9; wn++)
        if ((i * 7 + wn) % 3) px(bx + 4 + (wn % 3) * 8, 120 - bh + 4 + wn * 9, 4, 4, "#ffd97a");
    }
  }

  // --- arrest scenes ---
  function sceneKnock(p) {
    const s = getState(), pal = PAL[s.housing] || PAL[0];
    px(0, 0, W, FLOOR_Y, pal.wall);
    px(0, FLOOR_Y, W, H - FLOOR_Y, pal.floor);
    px(0, FLOOR_Y, W, 2, pal.trim);
    // door on the right, rattling
    const shake2 = Math.floor(frame / 2) % 2 && p > 0.25 ? 1 : 0;
    px(252 + shake2, 30, 44, FLOOR_Y - 28, "#5b432e");
    px(256 + shake2, 34, 36, FLOOR_Y - 36, "#6e5238");
    px(286 + shake2, 74, 5, 5, "#caa54a"); // handle
    // red/blue washes through the window
    const wx = 26, wy = 22;
    px(wx - 4, wy - 4, 68, 52, pal.trim);
    px(wx, wy, 60, 44, Math.floor(frame / 3) % 2 ? "rgba(255,69,58,0.6)" : "rgba(10,132,255,0.6)");
    ctx.fillStyle = Math.floor(frame / 3) % 2 ? "rgba(255,69,58,0.10)" : "rgba(10,132,255,0.10)";
    ctx.fillRect(0, 0, W, H);
    // startled entrepreneur mid-room, sweat drop
    const gx = 150, gy = FLOOR_Y + 6;
    tinyGuy(gx, gy + 14, ERA_HOODIE[s.era || 0], Math.floor(frame / 3) % 2);
    px(gx + 5, gy - 2, 2, 3, "#8fd0f0"); // sweat
    if (p > 0.2) caption("👮 OPEN UP! POLICE!", 24);
    if (p > 0.62) caption("...maybe it's the pizza guy?", 158);
  }
  function sceneEscort(p) {
    px(0, 0, W, 120, "#1b2742");                 // night
    const r = srand(17);
    for (let i = 0; i < 22; i++) { const sx = Math.floor(r() * W), sy = Math.floor(r() * 70); if (i % 5) px(sx, sy, 1, 1, "#cdd8f5"); }
    px(0, 120, W, 60, "#2f3a30");                // lawn
    px(0, 120, W, 3, "#27442c");
    // house facade left
    px(10, 38, 96, 84, "#6b5a78");
    px(4, 26, 108, 14, "#4a3d54");               // roof
    px(26, 56, 20, 18, "#16203a"); px(70, 56, 20, 18, "#ffd97a"); // windows (one lit)
    px(46, 86, 22, 36, "#5b432e");               // front door, open dark
    px(48, 88, 18, 34, "#241c12");
    // police car right, lights going
    policeCar(236, 116, Math.floor(frame / 3) % 2);
    ctx.fillStyle = Math.floor(frame / 3) % 2 ? "rgba(255,69,58,0.07)" : "rgba(10,132,255,0.07)";
    ctx.fillRect(0, 0, W, H);
    // procession walks door → car
    const x = 64 + p * 160;
    const step = Math.floor(frame / 3) % 2;
    copGuy(x - 16, 116, step);
    const s = getState();
    tinyGuy(x, 116, ERA_HOODIE[s.era || 0], step ? 0 : 1);
    px(x - 2, 112, 6, 2, "#9a9da6");             // cuffs
    copGuy(x + 15, 116, step ? 0 : 1);
    caption(p < 0.5 ? "\"It was a PARODY, officer!\"" : "\"Mind the hair. The hair is the brand.\"", 158);
  }
  function sceneDrive(p, kind, toRocket) {
    skylinePan(frame * 3);
    roadScroll(6);
    if (toRocket) { // launch site grows on the horizon
      const rh = 18 + p * 26;
      rocketSprite(284, 120, rh, false);
      px(270, 114, 34, 6, "#4a5160");            // pad
    }
    const carX = 120 + Math.sin(frame / 5) * 2;
    if (kind === "police") {
      policeCar(carX, 138, Math.floor(frame / 3) % 2);
      px(carX + 23, 128, 6, 5, SKIN);            // sad face in the back window
      px(carX + 22, 126, 8, 3, HAIR);
    } else {
      sportsCar(carX, 138);
      px(carX + 17, 130, 6, 4, HAIR);            // hair in the wind
      px(carX + 18, 133, 5, 3, SKIN);
    }
    for (let i = 0; i < 4; i++) {                // speed lines
      const lx = (W - ((frame * 14 + i * 83) % (W + 40)));
      px(lx, 96 + i * 10, 18, 1, "rgba(255,255,255,0.25)");
    }
    caption(kind === "police" ? "Downtown. Booking. No WiFi." : "🎵 to the launch pad — radio: full blast", 158);
  }
  function sceneJailArrive(p) {
    px(0, 0, W, 120, "#141c33");
    const r = srand(23);
    for (let i = 0; i < 18; i++) { const sx = Math.floor(r() * W), sy = Math.floor(r() * 56); if (i % 4) px(sx, sy, 1, 1, "#cdd8f5"); }
    px(0, 120, W, 60, "#3a3d44");
    // the county jail: grim, rectangular, judgmental
    px(86, 34, 150, 88, "#4b4e55");
    px(80, 26, 162, 10, "#3f424a");
    for (let i = 0; i < 4; i++) {
      px(98 + i * 34, 50, 18, 14, "#16203a");
      for (let b = 0; b < 3; b++) px(101 + i * 34 + b * 5, 50, 2, 14, "#22242a");
    }
    px(146, 92, 30, 30, "#22242a");              // gate
    ctx.font = "bold 8px 'Courier New', monospace";
    ctx.fillStyle = "#c8cad0";
    ctx.textAlign = "center";
    ctx.fillText("COUNTY JAIL", 161, 44);
    ctx.textAlign = "left";
    // car pulls up
    const carX = -50 + Math.min(1, p * 1.6) * 170;
    policeCar(carX, 138, Math.floor(frame / 3) % 2);
    if (p > 0.55) caption("\"One phone call. I'm calling my accountant.\"", 158);
    if (p > 0.8) { ctx.fillStyle = `rgba(0,0,0,${(p - 0.8) * 5})`; ctx.fillRect(0, 0, W, H); } // fade to cell
  }

  // --- space scenes ---
  function sceneWalkOut(p) {
    const s = getState(), pal = PAL[s.housing] || PAL[0];
    px(0, 0, W, FLOOR_Y, pal.wall);
    px(0, FLOOR_Y, W, H - FLOOR_Y, pal.floor);
    px(0, FLOOR_Y, W, 2, pal.trim);
    // open door, golden light spilling in
    px(252, 30, 44, FLOOR_Y - 28, "#5b432e");
    px(258, 34, 34, FLOOR_Y - 36, "#ffd97a");
    ctx.fillStyle = "rgba(255,217,122,0.10)";
    ctx.beginPath(); ctx.moveTo(258, 34); ctx.lineTo(190, FLOOR_Y + 40); ctx.lineTo(300, FLOOR_Y + 40); ctx.closePath(); ctx.fill();
    drawWalker(40 + p * 230, 1, s.era || 0);
    caption("Today we leave the planet. Casually.", 158);
  }
  function sceneBoard(p) {
    starsBg(36, 11);
    px(0, 132, W, 48, "#4a5160");                // concrete pad
    px(0, 132, W, 3, "#3a4150");
    rocketSprite(248, 132, 86, false);
    px(216, 50, 6, 82, "#3a4150");               // gantry tower
    for (let i = 0; i < 7; i++) px(216, 54 + i * 11, 26, 2, "#3a4150");
    px(190, 128, 10, 4, frame % 8 < 4 ? "#ff453a" : "#7a2620"); // warning light
    sportsCar(30, 146);
    const s = getState();
    if (p < 0.75) drawWalker(86 + p * 200, 1, s.era || 0);
    else { px(244, 78, 8, 8, "#ffd97a"); }       // he's in — capsule window glows
    caption(p < 0.5 ? "Steps? Where we're going we don't need steps." : "Boarding. Mr. Whiskers has the conn.", 158);
  }
  function sceneLaunch(p) {
    starsBg(Math.round(20 + p * 40), 13);
    const shake2 = p < 0.3 ? Math.floor(frame % 3) - 1 : 0;
    // ground falls away
    if (p < 0.45) {
      const gy = 150 + p * 110;
      px(0, gy, W, H, "#2f3a30");
      px(40, gy + 4, 60, 6, "#4a5160");
      px(220, gy + 4, 70, 6, "#4a5160");
    }
    const ry = 150 - p * 120;
    rocketSprite(160 + shake2, ry, 52, true);
    // smoke puffs at liftoff
    if (p < 0.4) for (let i = 0; i < 6; i++) {
      const sx = 130 + ((i * 47 + frame * 5) % 70);
      px(sx, 152 + (i % 3) * 6 - p * 60, 8, 5, `rgba(220,220,228,${0.5 - p})`);
    }
    caption(p < 0.35 ? "IGNITION. 🔥" : p < 0.7 ? "Goodbye taxes— I mean, gravity!" : "Space. It's quieter than the comment section.", 158);
  }
  function sceneMoon(p) {
    starsBg(46, 19);
    // Earth hangs in the corner
    px(264, 22, 26, 26, "#3f7ec2");
    px(269, 27, 9, 6, "#5da05c");
    px(274, 38, 8, 5, "#5da05c");
    px(264, 22, 26, 4, "rgba(255,255,255,0.25)");
    // moon ground + craters
    px(0, 128, W, 52, "#9a9da6");
    px(0, 128, W, 3, "#b9bcc4");
    [[40, 146, 18], [120, 158, 12], [228, 150, 22], [288, 164, 10]].forEach(([cx2, cy2, cw2]) => {
      px(cx2, cy2, cw2, 4, "#7e828c");
      px(cx2 + 2, cy2 + 1, cw2 - 4, 2, "#6e727c");
    });
    rocketSprite(252, 128, 62, false);
    const s = getState();
    if (p < 0.4) { // bounce out of the rocket, low gravity
      const hop = Math.abs(Math.sin(frame / 3)) * 6;
      tinyGuy(236 - p * 280 * 0.4 * 2.5 + 90, 124 - hop, ERA_HOODIE[s.era || 0], Math.floor(frame / 4) % 2);
    } else {
      tinyGuy(150, 124, ERA_HOODIE[s.era || 0], 0);
      // plant the flag: green banner, $ on it
      px(160, 86, 2, 38, "#c8cad0");
      const wave = Math.floor(frame / 4) % 2;
      px(162, 86, 22 + wave, 14, "#34c759");
      ctx.font = "bold 9px 'Courier New', monospace";
      ctx.fillStyle = "#0a3d1e";
      ctx.fillText("$", 169, 96);
    }
    caption(p < 0.4 ? "One small hop for a billionaire…" : "🌕 THE MOON IS YOURS.", 158);
    if (p > 0.92) { ctx.fillStyle = `rgba(0,0,0,${(p - 0.92) * 10})`; ctx.fillRect(0, 0, W, H); }
  }

  const CUTS = {
    arrest: [
      { dur: 2100, draw: sceneKnock },
      { dur: 2700, draw: sceneEscort },
      { dur: 2500, draw: p => sceneDrive(p, "police") },
      { dur: 2100, draw: sceneJailArrive },
    ],
    launch: [
      { dur: 1700, draw: sceneWalkOut },
      { dur: 2500, draw: p => sceneDrive(p, "sports", true) },
      { dur: 2200, draw: sceneBoard },
      { dur: 3000, draw: sceneLaunch },
    ],
    moon: [
      { dur: 1700, draw: sceneWalkOut },
      { dur: 2500, draw: p => sceneDrive(p, "sports", true) },
      { dur: 2200, draw: sceneBoard },
      { dur: 3000, draw: sceneLaunch },
      { dur: 3600, draw: sceneMoon },
    ],
  };

  function drawCut() {
    const seq = CUTS[cut.name];
    let t = Date.now() - cut.start;
    for (const ph of seq) {
      if (t < ph.dur) {
        ph.draw(Math.max(0, Math.min(1, t / ph.dur)));
        letterbox();
        return true;
      }
      t -= ph.dur;
    }
    cut = null;
    return false;
  }

  // ---------- Detail pass: clock, curtains, ceiling light, cat, clutter, asset props ----------
  function drawClock() {
    const cx2 = 160, cy2 = 30;
    px(cx2 - 7, cy2 - 7, 14, 14, "#e8e4da");
    px(cx2 - 7, cy2 - 7, 14, 1, "#3a3a3a"); px(cx2 - 7, cy2 + 6, 14, 1, "#3a3a3a");
    px(cx2 - 7, cy2 - 7, 1, 14, "#3a3a3a"); px(cx2 + 6, cy2 - 7, 1, 14, "#3a3a3a");
    // hands rotate with frame
    const m = (frame / 8) % 4;
    if (m < 1) px(cx2, cy2 - 4, 1, 5, "#222");
    else if (m < 2) px(cx2, cy2, 4, 1, "#222");
    else if (m < 3) px(cx2, cy2, 1, 5, "#222");
    else px(cx2 - 4, cy2, 5, 1, "#222");
    px(cx2 - 3, cy2, 4, 1, "#c0392b"); // hour hand
  }
  function drawCurtains(p, h) {
    if (h < 1) return;
    const wx = 26, wy = 22, vw = 60, vh = 44;
    const c = h >= 5 ? "#7e3a4f" : (h >= 3 ? "#3f6fa0" : "#6e5f4e");
    px(wx - 8, wy - 8, vw + 16, 4, "#4a4438"); // rod
    px(wx - 9, wy - 6, 7, vh + 12, c);
    px(wx - 9, wy - 6, 2, vh + 12, shade(c));
    px(wx + vw + 2, wy - 6, 7, vh + 12, c);
    px(wx + vw + 7, wy - 6, 2, vh + 12, shade(c));
  }
  function drawCeilingLight(h) {
    if (h < 2) return;
    const lx = 175;
    if (h >= 5) { // chandelier
      px(lx, 0, 2, 10, "#8a7035");
      px(lx - 10, 10, 22, 3, "#caa54a");
      [-9, 0, 10].forEach(dx2 => {
        px(lx + dx2, 13, 3, 4, "#fff3c4");
        px(lx + dx2, 17, 3, 1, "rgba(255,243,196,0.5)");
      });
    } else {
      px(lx, 0, 2, 14, "#3a3a3a");
      px(lx - 6, 14, 14, 6, "#caa54a");
      px(lx - 4, 20, 10, 2, "#fff3c4");
    }
    ctx.fillStyle = "rgba(255,236,170,0.05)";
    ctx.beginPath();
    ctx.moveTo(lx + 1, 20);
    ctx.lineTo(lx - 26, FLOOR_Y);
    ctx.lineTo(lx + 28, FLOOR_Y);
    ctx.closePath();
    ctx.fill();
  }
  function drawSunbeam(p) {
    if (!["city", "garden", "ocean", "brick"].includes(p.view)) return;
    ctx.fillStyle = "rgba(255,250,220,0.06)";
    ctx.beginPath();
    ctx.moveTo(30, 66);
    ctx.lineTo(86, 66);
    ctx.lineTo(130, FLOOR_Y + 30);
    ctx.lineTo(58, FLOOR_Y + 30);
    ctx.closePath();
    ctx.fill();
  }
  function drawClutter(h) {
    if (h === 0) { // teenage bedroom mess
      px(36, FLOOR_Y + 26, 16, 6, "#5a6a8a"); px(40, FLOOR_Y + 22, 14, 5, "#8a5a6a"); // clothes pile
      px(120, FLOOR_Y + 34, 4, 6, "#b03030"); px(127, FLOOR_Y + 36, 4, 4, "#3070b0"); // soda cans
      px(60, FLOOR_Y + 30, 10, 3, "#d8d2c2"); // stray sock?? paper
    }
    if (h >= 1 && h <= 2) { // mini fridge
      px(8, FLOOR_Y - 26, 18, 26, "#dfe3e8");
      px(8, FLOOR_Y - 26, 18, 1, "#aab0b8"); px(8, FLOOR_Y - 12, 18, 1, "#aab0b8");
      px(22, FLOOR_Y - 22, 2, 5, "#aab0b8");
    }
    if (h >= 8) { // patrol drone
      const dx2 = 200 + Math.sin(frame / 9) * 46;
      const dy2 = 18 + Math.sin(frame / 5) * 3;
      px(dx2 - 5, dy2, 10, 4, "#33415c");
      px(dx2 - 8, dy2 - 2, 4, 2, frame % 4 < 2 ? "#5eead4" : "#33415c");
      px(dx2 + 4, dy2 - 2, 4, 2, frame % 4 >= 2 ? "#5eead4" : "#33415c");
      px(dx2 - 1, dy2 + 4, 2, 1, "#5eead4");
    }
  }
  function drawCat(h) {
    if (h < 1) return;
    const t = (frame * 0.8) % 520;
    let cx2, dir;
    if (t < 220) { cx2 = 44 + t; dir = 1; }
    else if (t < 300) { cx2 = 264; dir = 0; } // sits for a bit
    else { cx2 = 264 - (t - 300); dir = -1; }
    const cy2 = FLOOR_Y + 44;
    const body = "#c98a3f", dark = "#a86f2d";
    if (dir === 0) { // sitting, tail flick
      px(cx2 - 4, cy2 - 9, 8, 9, body);
      px(cx2 - 3, cy2 - 13, 6, 5, body);
      px(cx2 - 3, cy2 - 15, 2, 2, body); px(cx2 + 1, cy2 - 15, 2, 2, body); // ears
      px(cx2 - 2, cy2 - 12, 1, 1, "#222"); px(cx2 + 1, cy2 - 12, 1, 1, "#222");
      const tf = Math.floor(frame / 4) % 2;
      px(cx2 + 4, cy2 - 4 - tf, 5, 2, dark);
    } else {
      const step = Math.floor(frame / 3) % 2;
      px(cx2 - 6, cy2 - 7, 12, 5, body);
      const hx = cx2 + dir * 6;
      px(hx - 2, cy2 - 10, 5, 5, body);
      px(hx - 2, cy2 - 12, 2, 2, body); px(hx + 1, cy2 - 12, 2, 2, body);
      px(hx + (dir > 0 ? 1 : -1), cy2 - 9, 1, 1, "#222");
      px(cx2 - dir * 7, cy2 - 11 + (step ? 1 : 0), 2, 5, dark); // tail up
      px(cx2 - 4 + step, cy2 - 2, 2, 3, dark); px(cx2 + 2 - step, cy2 - 2, 2, 3, dark); // legs
    }
  }
  function drawAssetProps(s) {
    const life = (s.assets && s.assets.life) || {};
    if (life.console) { // TV + console on the right wall
      px(240, 58, 38, 24, "#15181f");
      px(242, 60, 34, 20, "#1c4666");
      px(248, 64, 8, 6, "#5fd3a5"); px(262, 64, 8, 6, "#e8d27f"); // game on screen
      px(250 + (Math.floor(frame / 5) % 2) * 12, 72, 6, 4, "#c79bf2");
      px(252, 84, 14, 4, "#2a2e38"); // console box on shelf
      px(266, 85, 1, 2, "#5eead4");
    }
    if (life.espresso) { // espresso machine on a side table, left of desk
      px(92, FLOOR_Y - 14, 22, 14, "#6b4a2f"); // table
      px(94, FLOOR_Y - 26, 14, 12, "#3a3f4a");
      px(96, FLOOR_Y - 22, 4, 4, "#c0392b"); // cup
      px(106, FLOOR_Y - 24, 2, 2, frame % 8 < 4 ? "#e8b86a" : "#3a3f4a");
      const sy2 = FLOOR_Y - 30 - (frame % 6) / 2;
      px(98 + Math.sin(frame / 3), sy2, 1, 2, "rgba(255,255,255,0.35)");
    }
    if (life.art) { // bonus mini art piece (the questionable one)
      px(186, 24, 22, 18, "#262626");
      px(188, 26, 18, 14, "#e8e0d2");
      px(190, 28, 2, 10, "#d2603f"); px(196, 30, 2, 8, "#3a6ea8"); px(201, 28, 2, 10, "#e3b53a"); // three lines. you get it.
    }
    if (life.sneakers && false) { /* reserved */ }
  }

  function drawLamp(h) {
    if (h < 1) return;
    px(238, FLOOR_Y - 34, 2, 34, "#3a3a3a");
    px(232, FLOOR_Y - 42, 14, 9, "#caa54a");
    ctx.fillStyle = "rgba(255,228,150,0.10)";
    ctx.beginPath();
    ctx.moveTo(239, FLOOR_Y - 33);
    ctx.lineTo(224, FLOOR_Y + 14);
    ctx.lineTo(254, FLOOR_Y + 14);
    ctx.closePath();
    ctx.fill();
  }

  // ---------- Main draw ----------
  function draw() {
    const s = getState();
    if (!s || !ctx) return;

    // a cutscene is playing — the room is a movie set until it ends
    if (cut) {
      if (drawCut()) { frame++; return; }
    }

    // locked up? the whole scene becomes a cell until release
    if (window.WB && WB.CRIME && WB.CRIME.inPrison()) {
      pos = 258; // on the bunk
      drawPrison(s);
      frame++;
      return;
    }

    const h = s.housing, p = PAL[h], eq = s.equipment;
    const state = s.focus === "rest" ? "rest" : (s.focus === "grass" ? "grass" : "work");

    // walls with shade bands
    px(0, 0, W, FLOOR_Y, p.wall);
    px(0, 0, W, 12, p.wallD);
    px(0, FLOOR_Y - 6, W, 6, p.wallD);
    // floor with planks
    px(0, FLOOR_Y, W, H - FLOOR_Y, p.floor);
    for (let i = 0; i < 7; i++) px(0, FLOOR_Y + 6 + i * 8, W, 1, p.floorD);
    for (let i = 0; i < 10; i++) px(16 + i * 32 + (i % 2) * 12, FLOOR_Y + 6 + (i % 7) * 8, 1, 8, p.floorD);
    px(0, FLOOR_Y, W, 2, p.trim); // skirting

    drawWindow(p, h);
    drawCurtains(p, h);
    drawSunbeam(p);
    drawDecor(h, eq);
    drawClock();
    drawCeilingLight(h);
    drawLamp(h);
    drawRug(h);
    drawClutter(h);
    drawAssetProps(s);
    drawServer(eq);
    drawRouter(eq);
    drawToilet();
    const desk = drawDesk(eq);
    const deskCx = desk.dx + desk.dw / 2;

    // where should he be? (bathroom > bed > window > desk) — and walk there
    const target = s.bathroom ? 22 : state === "rest" ? 60 : state === "grass" ? 56 : deskCx;
    const moving = Math.abs(pos - target) > 4;
    if (moving) {
      facing = target > pos ? 1 : -1;
      pos += facing * 3.4;
    } else pos = target;

    drawScreens(eq, desk, moving || s.bathroom ? "rest" : state, s.focus);
    if (moving) {
      drawChairAndCharacter(eq, desk, "away", s.era);
      drawWalker(pos, facing, s.era);
    } else if (s.bathroom) {
      drawChairAndCharacter(eq, desk, "away", s.era);
      drawToiletUse(s.era);
    } else {
      drawChairAndCharacter(eq, desk, state, s.era); // in front: we see their back against the glow
      if (state === "work") {
        if (s.focus === "study") drawStudyProps(desk);
        if (s.focus === "ai") drawAIBuddy(desk);
      }
    }
    // smells like startup spirit
    if (s.res && s.res.hygiene != null && s.res.hygiene < 30 && !s.bathroom) {
      drawStink(moving ? pos : (state === "rest" ? 60 : state === "grass" ? 56 : deskCx), FLOOR_Y - 38);
    }
    drawCat(h);

    // soft vignette floor shadow under desk
    px(desk.dx - 4, FLOOR_Y + 36, desk.dw + 8, 3, "rgba(0,0,0,0.12)");

    // content mode: ring light + paparazzi flashes on top of everything
    if (state === "work" && s.focus === "content") drawContentStudio(desk);

    frame++;
  }

  function init(canvas, stateGetter) {
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    getState = stateGetter;
    setInterval(draw, 85); // ~12 fps, chunky and pixel-true
    draw();
  }

  return { init, play, charX: () => pos / W, cutActive: () => !!cut };
})();
