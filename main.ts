// AURHAVEN — travel poster for a place that isn't there.
// Procedural poster generator: pure Node stdlib, no network, no assets.
// Writes one 1024x1024 PNG to /output/entry.png (or $OUTPUT_PATH).
// Concept: a single white lighthouse on a black rock at dusk; its lamp beam
// sweeps left as a ribbon of aurora (teal-green). Warm windows in the keeper's
// cottage, gold reflection path on calm water. Name huge in cream caps.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const W = 1024;
const H = 1024;
const HORIZON = 635;

// ---------- deterministic RNG ----------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261121);

// ---------- pixel buffer ----------
const buf = new Uint8ClampedArray(W * H * 3);
type RGB = [number, number, number];

function clamp255(v: number): number { return v < 0 ? 0 : v > 255 ? 255 : v; }
function setPx(x: number, y: number, c: RGB, a: number): void {
  if (x < 0 || x >= W || y < 0 || y >= H || a <= 0) return;
  const i = (y * W + x) * 3;
  if (a >= 1) { buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; return; }
  buf[i] = clamp255(buf[i] * (1 - a) + c[0] * a);
  buf[i + 1] = clamp255(buf[i + 1] * (1 - a) + c[1] * a);
  buf[i + 2] = clamp255(buf[i + 2] * (1 - a) + c[2] * a);
}
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function lerpC(c1: RGB, c2: RGB, t: number): RGB {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}
function smooth(t: number): number { return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); }

// ---------- palette ----------
const SKY_TOP: RGB = [22, 35, 63];      // #16233F
const SKY_MID: RGB = [27, 42, 74];      // #1B2A4A
const SKY_HOR: RGB = [52, 70, 102];     // dusk glow at horizon
const SEA_TOP: RGB = [20, 66, 79];      // #14424F
const SEA_BOT: RGB = [9, 34, 44];
const AURORA_TEAL: RGB = [61, 214, 194]; // #3DD6C2
const AURORA_GREEN: RGB = [127, 227, 160]; // #7FE3A0
const AMBER: RGB = [255, 179, 71];      // #FFB347
const CREAM: RGB = [255, 246, 227];     // #FFF6E3
const ROCK: RGB = [14, 27, 38];         // #0E1B26
const TOWER_SHADE: RGB = [232, 217, 184];

// ---------- sky ----------
for (let y = 0; y < HORIZON; y++) {
  const t = y / HORIZON;
  const c = t < 0.55 ? lerpC(SKY_TOP, SKY_MID, t / 0.55) : lerpC(SKY_MID, SKY_HOR, (t - 0.55) / 0.45);
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
  }
}
// warm dusk glow low on the horizon, strongest near the lamp (right of centre)
for (let y = 420; y < HORIZON; y++) {
  const vt = smooth((y - 420) / (HORIZON - 420));
  for (let x = 165; x < 1024; x++) {
    const ht = 1 - Math.abs(x - 665) / 500;
    if (ht <= 0) continue;
    setPx(x, y, [214, 138, 74], 0.12 * vt * ht);
  }
}

// ---------- stars (sparse, kept out of the name band) ----------
for (let s = 0; s < 110; s++) {
  const x = Math.floor(rand() * W);
  const y = Math.floor(rand() * 400);
  if (y > 70 && y < 300 && x > 100 && x < 930) continue; // name band stays clean
  const a = 0.25 + rand() * 0.6;
  const r = rand() < 0.12 ? 2 : 1;
  const warm: RGB = rand() < 0.5 ? [255, 246, 227] : [200, 225, 255];
  for (let dy = 0; dy < r; dy++) for (let dx = 0; dx < r; dx++) setPx(x + dx, y + dy, warm, a);
}

// ---------- sea ----------
for (let y = HORIZON; y < H; y++) {
  const t = (y - HORIZON) / (H - HORIZON);
  const c = lerpC(SEA_TOP, SEA_BOT, t);
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
  }
}
// faint horizontal shimmer strokes on the water
for (let y = HORIZON + 12; y < H - 8; y += 9) {
  const fade = 1 - (y - HORIZON) / (H - HORIZON);
  let x = Math.floor(rand() * 200);
  while (x < W - 40) {
    const len = 20 + Math.floor(rand() * 90);
    for (let dx = 0; dx < len; dx++) setPx(x + dx, y, [120, 190, 200], 0.05 * fade);
    x += len + 30 + Math.floor(rand() * 120);
  }
}
// soft wide teal bands across the lower sea — the bottom third stops being flat
for (const [cy, bh, al] of [[718, 26, 0.05], [812, 30, 0.045], [908, 34, 0.04]] as const) {
  for (let y = Math.floor(cy - bh / 2); y < Math.ceil(cy + bh / 2); y++) {
    const edge = 1 - smooth(Math.abs(y - cy) / (bh / 2));
    for (let x = 0; x < W; x++) setPx(x, y, [110, 185, 195], al * edge);
  }
}

// ---------- aurora ribbon ----------
// Quadratic bezier from the lamp up-left, with a sine ripple. Widest near lamp.
type Pt = { x: number; y: number; t: number };
const LAMP: Pt = { x: 662, y: 362, t: 0 };
const CTRL: Pt = { x: 430, y: 280, t: 0.5 };
const END: Pt = { x: 168, y: 302, t: 1 };
const ribbon: Pt[] = [];
for (let i = 0; i <= 260; i++) {
  const t = i / 260;
  const bx = (1 - t) * (1 - t) * LAMP.x + 2 * (1 - t) * t * CTRL.x + t * t * END.x;
  const by = (1 - t) * (1 - t) * LAMP.y + 2 * (1 - t) * t * CTRL.y + t * t * END.y;
  // perpendicular ripple
  const dx = 2 * (1 - t) * (CTRL.x - LAMP.x) + 2 * t * (END.x - CTRL.x);
  const dy = 2 * (1 - t) * (CTRL.y - LAMP.y) + 2 * t * (END.y - CTRL.y);
  const len = Math.hypot(dx, dy) || 1;
  const rip = 13 * Math.sin(t * Math.PI * 2.4);
  ribbon.push({ x: bx + (-dy / len) * rip, y: by + (dx / len) * rip, t });
}
function ribbonWidth(t: number): number { return 8 + 64 * Math.pow(1 - t, 1.8); }

function drawRibbonLayer(path: Pt[], widthFn: (t: number) => number, offset: number, color: RGB, alpha: number, widthMul: number): void {
  const x0 = 120, x1 = 800, y0 = 230, y1 = 480;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      let best = 1e9; let bestT = 0;
      for (let k = 0; k < path.length; k++) {
        const p = path[k];
        const ddx = p.x - x, ddy = p.y + offset - y;
        const d = ddx * ddx + ddy * ddy;
        if (d < best) { best = d; bestT = p.t; }
      }
      const d = Math.sqrt(best);
      const w = widthFn(bestT) * widthMul;
      // alpha breathes along the length and fades wispy at the far tip
      const breathe = 0.8 + 0.2 * Math.sin(bestT * Math.PI * 2.2);
      const tipFade = 1 - 0.35 * smooth((bestT - 0.85) / 0.15);
      const a = alpha * breathe * tipFade * (1 - smooth((d - w * 0.35) / (w * 0.65)));
      if (a > 0.01) setPx(x, y, color, a);
    }
  }
}
drawRibbonLayer(ribbon, ribbonWidth, 14, AURORA_TEAL, 0.34, 1.35);   // wide faint teal under-layer
drawRibbonLayer(ribbon, ribbonWidth, 10, AURORA_TEAL, 0.55, 1.0);    // teal body
drawRibbonLayer(ribbon, ribbonWidth, -4, AURORA_GREEN, 0.5, 0.72);   // green core, offset up
drawRibbonLayer(ribbon, ribbonWidth, 2, [190, 245, 210], 0.42, 0.26); // bright core streak near the lamp
// second fainter strand, diverging downward from mid-ribbon toward the far end
function buildStrand(): Pt[] {
  const start = ribbon[Math.floor(0.55 * (ribbon.length - 1))];
  const c = { x: 320, y: 336 }; const e = { x: 198, y: 356 };
  const pts: Pt[] = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    pts.push({
      x: (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * c.x + t * t * e.x,
      y: (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * c.y + t * t * e.y,
      t,
    });
  }
  return pts;
}
const strand = buildStrand();
function strandWidth(t: number): number { return 5 + 24 * Math.pow(1 - t, 1.5); }
drawRibbonLayer(strand, strandWidth, 0, AURORA_TEAL, 0.22, 1.0);
drawRibbonLayer(strand, strandWidth, -3, AURORA_GREEN, 0.18, 0.6);

// ---------- rock ----------
// Jagged mound silhouette, base on the horizon. Scaled x1.3 about (650, 640)
// so the landmark reads bigger against the name.
const rockPts: [number, number][] = [
  [475, 640], [491, 591], [517, 562], [546, 533], [585, 515], [637, 505],
  [689, 505], [735, 520], [774, 552], [803, 588], [822, 619], [829, 640],
];
function pointInPoly(x: number, y: number, pts: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]; const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
for (let y = 503; y < 642; y++) {
  for (let x = 470; x < 832; x++) {
    if (pointInPoly(x + 0.5, y + 0.5, rockPts)) setPx(x, y, ROCK, 1);
  }
}
// faint teal rim light along the rock's top edge
for (let k = 0; k < rockPts.length - 1; k++) {
  const [x1, y1] = rockPts[k]; const [x2, y2] = rockPts[k + 1];
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(lerp(x1, x2, s / steps));
    const y = Math.round(lerp(y1, y2, s / steps));
    setPx(x, y - 1, [90, 170, 170], 0.35);
  }
}
// soft dark reflection of the rock under the horizon (squashed, fading with depth)
const reflPts = rockPts.map(([x, y]): [number, number] => [652 + (x - 652) * 0.92, 640 + (640 - y) * 0.5]);
for (let y = 640; y < 708; y++) {
  const fade = Math.max(0, 1 - (y - 640) / 70);
  for (let x = 470; x < 835; x++) {
    if (pointInPoly(x + 0.5, y + 0.5, reflPts)) setPx(x, y, [10, 26, 34], 0.35 * fade);
  }
}
// faint spray dots where the rock meets the sea
for (let s = 0; s < 26; s++) {
  const x = s % 2 === 0 ? 472 + Math.floor(rand() * 34) : 800 + Math.floor(rand() * 34);
  const y = 636 + Math.floor(rand() * 10);
  setPx(x, y, [220, 240, 240], 0.25 + rand() * 0.25);
  if (rand() < 0.5) setPx(x + 1, y, [220, 240, 240], 0.2);
}

// ---------- keeper's cottage (bigger now, warm windows that read at 512) ----------
for (let y = 492; y < 560; y++) for (let x = 558; x < 644; x++) setPx(x, y, [34, 48, 62], 1);
for (let x = 554; x < 648; x++) { // roofline
  const ry = 492 - Math.round((1 - Math.abs(x - 601) / 47) * 21);
  for (let y = ry; y < 493; y++) setPx(x, y, ROCK, 1);
}
// bigger warm windows, with a soft glow spilling onto the rock
for (const wx of [571, 605]) for (let y = 512; y < 534; y++) for (let x = wx; x < wx + 14; x++) setPx(x, y, AMBER, 0.95);
for (let y = 480; y < 580; y++) {
  for (let x = 530; x < 675; x++) {
    const d = Math.hypot(x - 601, y - 528);
    if (d < 72) setPx(x, y, AMBER, 0.16 * (1 - smooth(d / 72)));
  }
}

// ---------- lighthouse ----------
// Tapered tower, centre x=665, base y=556 (planted in the rock), top y=379.
// Scaled x1.3 about the base: taller and wider so the landmark holds its own
// against the name. Smooth warm shading: cream on the lit left, gently
// deepening to the right.
function towerHalfWidth(y: number): number { return lerp(52, 34, (556 - y) / 177); }
for (let y = 379; y <= 556; y++) {
  const hw = towerHalfWidth(y);
  for (let x = Math.floor(665 - hw); x <= Math.ceil(665 + hw); x++) {
    const f = (x - (665 - hw)) / (2 * hw); // 0 left edge -> 1 right edge
    setPx(x, y, lerpC(CREAM, TOWER_SHADE, smooth(f * 1.15 - 0.1)), 1);
  }
}
// two thin shade bands on the tower (no hard dark lines)
for (const by of [455, 512]) {
  const hw = towerHalfWidth(by);
  for (let x = Math.floor(665 - hw); x <= Math.ceil(665 + hw); x++) setPx(x, by, [226, 210, 175], 0.85);
}
// gallery platform + lamp room (slim dark frame, bright amber lamp)
for (let x = 630; x <= 700; x++) setPx(x, 378, [30, 40, 56], 1);
for (let y = 347; y < 378; y++) for (let x = 638; x <= 692; x++) setPx(x, y, [16, 24, 36], 1);
for (let y = 352; y < 374; y++) for (let x = 645; x <= 685; x++) setPx(x, y, AMBER, 0.98); // lit lamp
// trapezoid roof + finial (a proper cap, not a funnel)
for (let y = 331; y < 347; y++) {
  const w = lerp(10, 29, (347 - y) / 16);
  for (let x = Math.floor(665 - w); x <= Math.ceil(665 + w); x++) setPx(x, y, [30, 40, 56], 1);
}
for (let y = 325; y < 332; y++) for (let x = 663; x <= 667; x++) setPx(x, y, [30, 40, 56], 1);
// lamp glow: radial warm halo
for (let y = 260; y < 480; y++) {
  for (let x = 545; x < 785; x++) {
    const d = Math.hypot(x - 665, y - 362);
    if (d < 120) setPx(x, y, AMBER, 0.28 * (1 - smooth(d / 120)));
  }
}
// warm spill at the tower base, onto the rock
for (let y = 480; y < 640; y++) {
  for (let x = 570; x < 760; x++) {
    const d = Math.hypot(x - 665, y - 545);
    if (d < 95) setPx(x, y, AMBER, 0.12 * (1 - smooth(d / 95)));
  }
}

// ---------- gold reflection on the water ----------
// Vertical tapered column of broken horizontal dashes below the lamp,
// gently wandering with depth.
for (let y = 644; y < 930; y += 6) {
  const depth = (y - 644) / 286;
  const centre = 665 + Math.sin(depth * 5.2) * 8 * depth;
  const halfW = lerp(64, 12, depth) * (0.85 + rand() * 0.3);
  const alpha = lerp(0.85, 0.10, depth);
  let x = Math.floor(centre - halfW);
  while (x < centre + halfW) {
    const len = 8 + Math.floor(rand() * 26);
    for (let dx = 0; dx < len && x + dx < centre + halfW; dx++) {
      setPx(x + dx, y, AMBER, alpha);
      setPx(x + dx, y + 1, AMBER, alpha * 0.6);
    }
    x += len + 6 + Math.floor(rand() * 22);
  }
  // one wide soft dash near the horizon for glow
  if (depth < 0.12 && rand() < 0.5) {
    for (let dx = -54; dx < 54; dx++) setPx(Math.floor(centre + dx), y + 2, AMBER, 0.18);
  }
}

// ---------- name: stroke vector letterforms ----------
// Each glyph: list of segments in a 100 x 140 box, stroke width 20.
type Seg = [number, number, number, number];
const GLYPHS: Record<string, Seg[]> = {
  A: [[10, 140, 50, 4], [90, 140, 50, 4], [30, 92, 70, 92]],
  U: [[12, 4, 12, 100], [88, 4, 88, 100], [12, 100, 34, 136], [34, 136, 66, 136], [66, 136, 88, 100]],
  R: [[12, 4, 12, 140], [12, 4, 64, 4], [64, 4, 86, 22], [86, 22, 86, 54], [86, 54, 64, 72], [64, 72, 12, 72], [50, 72, 88, 140]],
  H: [[12, 4, 12, 140], [88, 4, 88, 140], [12, 72, 88, 72]],
  V: [[8, 4, 50, 140], [92, 4, 50, 140]],
  E: [[12, 4, 12, 140], [12, 4, 84, 4], [12, 72, 70, 72], [12, 140, 84, 140]],
  N: [[12, 4, 12, 140], [14, 6, 86, 138], [88, 4, 88, 140]],
  T: [[10, 4, 90, 4], [50, 4, 50, 140]],
  L: [[12, 4, 12, 140], [12, 140, 84, 140]],
  I: [[34, 4, 66, 4], [50, 4, 50, 140], [34, 140, 66, 140]],
  G: [[88, 20, 70, 4], [70, 4, 30, 4], [30, 4, 14, 20], [14, 20, 14, 120], [14, 120, 30, 136], [30, 136, 70, 136], [70, 136, 86, 120], [86, 120, 86, 84], [86, 84, 52, 84]],
  S: [[86, 22, 66, 4], [66, 4, 34, 4], [34, 4, 14, 22], [14, 22, 14, 52], [14, 52, 30, 70], [30, 70, 70, 70], [70, 70, 86, 88], [86, 88, 86, 118], [86, 118, 66, 136], [66, 136, 34, 136], [34, 136, 14, 118]],
  D: [[12, 4, 12, 140], [12, 4, 62, 4], [62, 4, 86, 28], [86, 28, 86, 112], [86, 112, 62, 140], [62, 140, 12, 140]],
  K: [[12, 4, 12, 140], [86, 4, 20, 70], [44, 92, 88, 140]],
};
function distToSeg(px: number, py: number, s: Seg): number {
  const [x1, y1, x2, y2] = s;
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
function drawText(text: string, cx: number, topY: number, capH: number, color: RGB, alpha: number, strokeW: number, tracking: number): void {
  const scale = capH / 140;
  const adv = (100 + tracking) * scale;
  const totalW = text.length * adv - tracking * scale;
  let x0 = cx - totalW / 2;
  for (const ch of text) {
    if (ch === " ") { x0 += adv; continue; }
    const segs = GLYPHS[ch];
    if (!segs) { x0 += adv; continue; }
    const hw = (strokeW * scale) / 2;
    const bx0 = Math.floor(x0 - hw - 3), bx1 = Math.ceil(x0 + 100 * scale + hw + 3);
    const by0 = Math.floor(topY - hw - 3), by1 = Math.ceil(topY + capH + hw + 3);
    for (let y = by0; y <= by1; y++) {
      for (let x = bx0; x <= bx1; x++) {
        let d = 1e9;
        for (const s of segs) {
          const dd = distToSeg((x - x0) / scale, (y - topY) / scale, s);
          if (dd < d) d = dd;
        }
        const a = alpha * (1 - smooth((d * scale - hw + 1.2) / 2.4));
        if (a > 0.01) setPx(x, y, color, a);
      }
    }
    x0 += adv;
  }
}
const VARIANT = (process.env.AURHAVEN_VARIANT || "a").toLowerCase();
// Warm halo pass removed: at low alpha over indigo it read as a dark
// outline/drop shadow around the letters, which is worse than no glow.
drawText("AURHAVEN", 512, 88, 140, CREAM, 1, 20, 0);
// thin cream rule under the name, ~40% of name width
const ruleW = 310, ruleX0 = Math.round(512 - ruleW / 2);
for (let x = ruleX0; x < ruleX0 + ruleW; x++) {
  setPx(x, 262, CREAM, 0.85); setPx(x, 263, CREAM, 0.85); setPx(x, 264, CREAM, 0.5);
}
if (VARIANT === "b") {
  // One functional detail line in small caps (variant test only).
  drawText("THE LIGHT IS LIT AT DUSK", 512, 296, 34, CREAM, 0.92, 20, 6);
}

// ---------- fine deterministic grain (2x2 blocks: printed feel, stays compressible) ----------
const grain = mulberry32(777);
for (let by = 0; by < H; by += 2) {
  for (let bx = 0; bx < W; bx += 2) {
    const n = (grain() - 0.5) * 4;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const i = ((by + dy) * W + (bx + dx)) * 3;
      buf[i] = clamp255(buf[i] + n);
      buf[i + 1] = clamp255(buf[i + 1] + n);
      buf[i + 2] = clamp255(buf[i + 2] + n);
    }
  }
}

// ---------- PNG encode (zlib deflate, filter 0) ----------
const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
const raw = new Uint8Array(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0;
  raw.set(buf.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
}
const ihdr = new Uint8Array(13);
{
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, W); dv.setUint32(4, H);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from(chunk("IHDR", ihdr)),
  Buffer.from(chunk("IDAT", deflateSync(raw, { level: 9 }))),
  Buffer.from(chunk("IEND", new Uint8Array(0))),
]);
const outPath = process.env.OUTPUT_PATH || "/output/entry.png";
mkdirSync(outPath.slice(0, outPath.lastIndexOf("/")), { recursive: true });
writeFileSync(outPath, png);
console.log(`wrote ${outPath} ${png.length} bytes ${W}x${H} variant=${VARIANT}`);
