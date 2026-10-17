import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** The made-up shop all three designs are for. Change the words here. */
const SHOP = {
  name: "Juniper Row",
  town: "Margate",
  sentence: "A florist in Margate that delivers by bike",
};
/** The three designs: the name shown beside the stage, one line about each, and its photograph. */
const DESIGNS = [
  {
    name: "Linen",
    line: "Serif columns on cream card.",
    body: "#EDE5D5",
    photo: {
      src: "https://images.pexels.com/photos/28868047/pexels-photo-28868047.jpeg?auto=compress&cs=tinysrgb&w=900",
      alt: "Woman in a white shirt holding a tall bunch of white gypsophila against her chest",
      tone: "#d9d2c6",
    },
  },
  {
    name: "Poppy",
    line: "One loud line over full colour.",
    body: "#C7463A",
    photo: {
      src: "https://images.pexels.com/photos/13023364/pexels-photo-13023364.jpeg?auto=compress&cs=tinysrgb&w=1200",
      alt: "Single pale yellow strawflower in a small blue glass bottle against a red paper backdrop",
      tone: "#c9483c",
    },
  },
  {
    name: "Midnight",
    line: "A quiet arch on black.",
    body: "#131416",
    photo: {
      src: "https://images.pexels.com/photos/31189167/pexels-photo-31189167.jpeg?auto=compress&cs=tinysrgb&w=900",
      alt: "White and blush roses beside a white jug against a black cloth",
      tone: "#0d0d0e",
    },
  },
];

const BLUE = "#4F98FB";
const INK = "#0B0D12";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
/** Which design stands forward when the piece loads, counted from 0. */
const START = 1;
/** Seconds the self-playing demo holds each design before picking the next. */
const HOLD = 4.4;
/** Seconds one swap takes from the first move to the last. */
const TRAVEL = 1.15;
/** Lowest and highest render scale (canvas pixels per CSS pixel). The loop steps down when frames run slow. */
const MIN_SCALE = 0.5001;
const MAX_SCALE = 1.5001;

/* ---------- the three pages, drawn once on 2D canvases and used as the print on each model ---------- */

const PW = 1200;
const PH = 1600;
/** Parts of each page that stand proud of the board: place and size in page pixels, corner radii (top left, top right, bottom right, bottom left), height in scene units, and gloss from 0 to 1. */
type Raised = { x: number; y: number; w: number; h: number; r: [number, number, number, number]; lift: number; gloss: number };
const all = (r: number): [number, number, number, number] => [r, r, r, r];
const LINEN = {
  photo: { x: 652, y: 214, w: 468, h: 900, r: all(5), lift: 0.05, gloss: 0.92 } as Raised,
  cta: { x: 78, y: 1012, w: 372, h: 98, r: all(49), lift: 0.03, gloss: 0.7 } as Raised,
};
const POPPY = {
  nav: { x: 60, y: 60, w: 1080, h: 112, r: all(56), lift: 0.032, gloss: 0.6 } as Raised,
  sticker: { x: 84, y: 300, w: 232, h: 232, r: all(116), lift: 0.022, gloss: 0.35 } as Raised,
  cta: { x: 70, y: 1376, w: 448, h: 118, r: all(59), lift: 0.04, gloss: 0.75 } as Raised,
};
const MIDNIGHT = {
  arch: { x: 330, y: 186, w: 540, h: 770, r: [270, 270, 6, 6], lift: 0.055, gloss: 0.95 } as Raised,
  cta: { x: 410, y: 1332, w: 380, h: 96, r: all(48), lift: 0.03, gloss: 0.7 } as Raised,
};
const RAISED: Raised[][] = [Object.values(LINEN), Object.values(POPPY), Object.values(MIDNIGHT)];

type Ctx = CanvasRenderingContext2D;
const setFont = (c: Ctx, style: string, size: number, family: string, track = 0) => {
  c.font = `${style} ${size}px ${family}`;
  (c as unknown as { letterSpacing: string }).letterSpacing = `${(track * size).toFixed(2)}px`;
};
function wrap(c: Ctx, text: string, maxW: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? line + " " + word : word;
    if (line && c.measureText(next).width > maxW) {
      out.push(line);
      line = word;
    } else line = next;
  }
  out.push(line);
  return out;
}
function shape(c: Ctx, x: number, y: number, w: number, h: number, r: [number, number, number, number]) {
  c.beginPath();
  c.moveTo(x + r[0], y);
  c.arcTo(x + w, y, x + w, y + h, r[1]);
  c.arcTo(x + w, y + h, x, y + h, r[2]);
  c.arcTo(x, y + h, x, y, r[3]);
  c.arcTo(x, y, x + w, y, r[0]);
  c.closePath();
}
const rect = (c: Ctx, k: Raised) => shape(c, k.x, k.y, k.w, k.h, k.r);
/** Fill a shape with the photograph: fx and fy say which point of the picture sits in the middle, zoom enlarges it. */
function photoIn(c: Ctx, img: HTMLImageElement | null, tone: string, x: number, y: number, w: number, h: number, fx = 0.5, fy = 0.5, zoom = 1) {
  c.fillStyle = tone;
  c.fillRect(x, y, w, h);
  if (!img || !img.naturalWidth) return;
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  const dx = Math.min(0, Math.max(w - dw, w / 2 - fx * dw));
  const dy = Math.min(0, Math.max(h - dh, h / 2 - fy * dh));
  c.drawImage(img, x + dx, y + dy, dw, dh);
}
function arrow(c: Ctx, x: number, y: number, s: number, colour: string) {
  c.strokeStyle = colour;
  c.lineWidth = s * 0.14;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + s, y);
  c.moveTo(x + s * 0.58, y - s * 0.42);
  c.lineTo(x + s, y);
  c.lineTo(x + s * 0.58, y + s * 0.42);
  c.stroke();
}

/** Linen: cream card, a serif headline in a left column, a tall photograph on the right, three numbered notes below. */
function drawLinen(c: Ctx, img: HTMLImageElement | null) {
  const ink = "#1D1914";
  c.fillStyle = DESIGNS[0].body;
  c.fillRect(0, 0, PW, PH);
  c.textBaseline = "alphabetic";
  c.fillStyle = ink;
  setFont(c, "italic 500", 50, SERIF, -0.01);
  c.fillText(SHOP.name, 78, 124);
  setFont(c, "500", 21, SERIF, 0.2);
  let x = 1122;
  for (const item of ["JOURNAL", "WEDDINGS", "BUNCHES"]) {
    x -= c.measureText(item).width;
    c.fillText(item, x, 118);
    x -= 44;
  }
  c.fillStyle = "rgba(29,25,20,0.3)";
  c.fillRect(78, 160, 1042, 2);
  c.save();
  rect(c, LINEN.photo);
  c.clip();
  photoIn(c, img, DESIGNS[0].photo.tone, LINEN.photo.x, LINEN.photo.y, LINEN.photo.w, LINEN.photo.h, 0.46, 0.4, 1.04);
  c.restore();
  c.fillStyle = ink;
  const lines: [string, string][] = [["400", "Flowers,"], ["400", "cut this"], ["italic 400", "morning."]];
  lines.forEach(([style, text], i) => {
    setFont(c, style, 146, SERIF, -0.028);
    c.fillText(text, 70, 404 + i * 140);
  });
  c.fillStyle = "#4b4337";
  setFont(c, "400", 31, SERIF, 0);
  wrap(c, "Seasonal bunches from growers near the coast, tied by hand and out of the door on a bicycle by noon.", 500).forEach((l, i) => c.fillText(l, 80, 806 + i * 45));
  c.fillStyle = ink;
  rect(c, LINEN.cta);
  c.fill();
  c.fillStyle = DESIGNS[0].body;
  setFont(c, "600", 32, FONT, -0.01);
  c.fillText("Order a bunch", 122, 1072);
  arrow(c, 122 + c.measureText("Order a bunch").width + 22, 1061, 30, DESIGNS[0].body);
  c.fillStyle = "#6a6052";
  setFont(c, "italic 400", 23, SERIF, 0);
  c.fillText("Gypsophila, tied this morning", LINEN.photo.x, 1160);
  c.fillStyle = "rgba(29,25,20,0.3)";
  c.fillRect(78, 1250, 1042, 2);
  const notes: [string, string, string][] = [["i.", "The weekly bunch", "Whatever is best that week"], ["ii.", "Wedding flowers", "From buttonholes to arches"], ["iii.", "Sunday workshops", "Six seats at the long table"]];
  notes.forEach(([n, t, s], i) => {
    const nx = 80 + i * 352;
    c.fillStyle = ink;
    setFont(c, "italic 400", 60, SERIF, 0);
    c.fillText(n, nx, 1348);
    setFont(c, "500", 33, SERIF, -0.01);
    c.fillText(t, nx, 1418);
    c.fillStyle = "#6a6052";
    setFont(c, "400", 23, SERIF, 0);
    c.fillText(s, nx, 1458);
  });
  c.fillStyle = "#6a6052";
  setFont(c, "500", 19, SERIF, 0.22);
  c.fillText(`${SHOP.name.toUpperCase()}, ${SHOP.town.toUpperCase()}`, 80, 1524);
}

/** Poppy: the photograph over the whole board, a white menu pill, a paper sticker and one very large line. */
function drawPoppy(c: Ctx, img: HTMLImageElement | null) {
  const dark = "#2B0C08";
  photoIn(c, img, DESIGNS[1].photo.tone, 0, 0, PW, PH, 0.37, 0.56, 1.36);
  if (!img || !img.naturalWidth) {
    c.fillStyle = DESIGNS[1].body;
    c.fillRect(0, 0, PW, PH);
  }
  c.textBaseline = "alphabetic";
  c.fillStyle = "#fff";
  rect(c, POPPY.nav);
  c.fill();
  c.fillStyle = dark;
  setFont(c, "800", 36, FONT, -0.01);
  c.fillText(SHOP.name.toUpperCase(), 112, 129);
  setFont(c, "600", 27, FONT, 0);
  let x = 1090;
  for (const item of ["Find us", "Weddings", "Bunches"]) {
    x -= c.measureText(item).width;
    c.fillText(item, x, 126);
    x -= 46;
  }
  // sticker
  const s = POPPY.sticker;
  c.fillStyle = "#F4D548";
  rect(c, s);
  c.fill();
  c.save();
  c.translate(s.x + s.w / 2, s.y + s.h / 2);
  c.rotate(-0.2);
  c.fillStyle = dark;
  c.textAlign = "center";
  setFont(c, "800", 40, FONT, -0.02);
  c.fillText("SAME DAY", 0, -6);
  setFont(c, "italic 500", 38, SERIF, 0);
  c.fillText("by bicycle", 0, 38);
  c.restore();
  c.textAlign = "left";
  // the line
  c.fillStyle = "#fff";
  const words = ["Send", "colour."];
  let size = 300;
  for (; size > 120; size -= 4) {
    setFont(c, "800", size, FONT, -0.055);
    if (Math.max(...words.map((w) => c.measureText(w).width)) < 1010) break;
  }
  words.forEach((w, i) => c.fillText(w, 58, 1082 + i * size * 0.86));
  rect(c, POPPY.cta);
  c.fill();
  c.fillStyle = dark;
  setFont(c, "700", 40, FONT, -0.015);
  c.fillText("Send a bunch", 122, 1449);
  arrow(c, 122 + c.measureText("Send a bunch").width + 26, 1435, 36, dark);
  c.fillStyle = "#fff";
  setFont(c, "700", 23, FONT, 0.16);
  const foot = `${SHOP.town.toUpperCase()} / OPEN TILL SIX`;
  c.fillText(foot, 1140 - c.measureText(foot).width, 1446);
}

/** Midnight: black board, the photograph in an arch, a light centred line and small spaced capitals. */
function drawMidnight(c: Ctx, img: HTMLImageElement | null) {
  const cream = "#EDE6D8";
  c.fillStyle = DESIGNS[2].body;
  c.fillRect(0, 0, PW, PH);
  c.textBaseline = "alphabetic";
  c.textAlign = "center";
  c.fillStyle = cream;
  setFont(c, "600", 23, MONO, 0.42);
  const nameW = c.measureText(SHOP.name.toUpperCase()).width;
  c.fillText(SHOP.name.toUpperCase(), 600 + 5, 116);
  c.fillStyle = "rgba(237,230,216,0.34)";
  c.fillRect(78, 107, 600 - nameW / 2 - 110, 1.5);
  c.fillRect(600 + nameW / 2 + 32, 107, 600 - nameW / 2 - 110, 1.5);
  const a = MIDNIGHT.arch;
  c.strokeStyle = "rgba(237,230,216,0.4)";
  c.lineWidth = 1.5;
  shape(c, a.x - 18, a.y - 18, a.w + 36, a.h + 36, [288, 288, 10, 10]);
  c.stroke();
  c.save();
  rect(c, a);
  c.clip();
  photoIn(c, img, DESIGNS[2].photo.tone, a.x, a.y, a.w, a.h, 0.56, 0.6, 1.02);
  c.restore();
  c.fillStyle = cream;
  setFont(c, "300", 112, FONT, -0.04);
  c.fillText("Flowers for", 600, 1104);
  c.fillText("the evening.", 600, 1216);
  c.fillStyle = "rgba(237,230,216,0.62)";
  setFont(c, "500", 20, MONO, 0.3);
  c.fillText(`CUT TODAY  /  TIED BY HAND  /  ${SHOP.town.toUpperCase()}`, 603, 1284);
  c.fillStyle = cream;
  rect(c, MIDNIGHT.cta);
  c.fill();
  c.fillStyle = "#131416";
  setFont(c, "600", 31, FONT, -0.01);
  c.fillText("Reserve a bunch", 600, 1391);
  c.fillStyle = "rgba(237,230,216,0.34)";
  c.fillRect(78, 1462, 1044, 1.5);
  c.fillStyle = "rgba(237,230,216,0.62)";
  setFont(c, "500", 19, MONO, 0.26);
  c.textAlign = "left";
  c.fillText("01 BUNCHES", 78, 1512);
  c.textAlign = "center";
  c.fillText("02 WEDDINGS", 602, 1512);
  c.textAlign = "right";
  c.fillText("03 JOURNAL", 1122, 1512);
  c.textAlign = "left";
}
const PAINT = [drawLinen, drawPoppy, drawMidnight];

/* ---------- shaders ---------- */

const f = (n: number) => n.toFixed(5);
const lin = (hex: string) => `vec3(${[1, 3, 5].map((i) => f(Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2))).join(", ")})`;
/** Half the thickness of a board, in scene units. A board is 1.5 wide and 2 tall. */
const TH = 0.062;
// The raised parts, written out as distance functions so the picture and the relief can never drift apart.
const RELIEF = RAISED.map((list, i) => {
  const at = (k: Raised) => `c.xy - vec2(${f((k.x + k.w / 2 - PW / 2) / 800)}, ${f((PH / 2 - (k.y + k.h / 2)) / 800)}), vec2(${f(k.w / 1600)}, ${f(k.h / 1600)}), vec4(${[k.r[1], k.r[2], k.r[0], k.r[3]].map((r) => f(r / 800)).join(", ")})`;
  const d = list.map((k) => `d = min(d, ext(rb4(${at(k)}), c.z - ${f((TH + k.lift) / 2)}, ${f((TH + k.lift) / 2)}, 0.008));`).join("\n  ");
  const g = list.map((k) => `e = rb4(${at(k)}); if (e < b) { b = e; g = ${f(k.gloss)}; }`).join("\n  ");
  return `float rel${i}(vec3 c){ float d = 1e5;\n  ${d}\n  return d; }\nfloat gls${i}(vec3 c){ float b = 1e5, g = 0.0, e;\n  ${g}\n  return g; }`;
}).join("\n");

const VERT = `#version 300 es
in vec2 a; out vec2 vUv;
void main(){ vUv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

const SCENE = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes;
uniform vec3 uCam, uTarget;
uniform float uFov;
uniform vec4 uA[3]; // each model: x, z, extra lean, turn
uniform vec4 uB[3]; // each model: how brightly its base is lit, then the distance the lens is focused at
uniform sampler2D uT0, uT1, uT2;

const vec3 L = vec3(-0.5499, 0.6199, 0.5599);
const vec3 SUNC = vec3(1.0, 0.945, 0.85);
const float SUNI = 2.35;
const vec3 FLOORC = vec3(0.87, 0.86, 0.835);
const vec3 BLUE = vec3(0.078, 0.314, 0.965);
const vec3 BLUEE = vec3(0.07, 0.34, 3.0);
const vec3 OPAL = vec3(0.75, 0.765, 0.79);
const float WZ = -3.3, RC = 1.15, TH = ${f(TH)}, SH = 0.155, LEAN = 0.105, ZF = 26.0;
const vec3 BODY[3] = vec3[3](${DESIGNS.map((d) => lin(d.body)).join(", ")});
const float FACEG[3] = float[3](0.05, 0.5, 0.72);
const float EDGEG[3] = float[3](0.3, 0.55, 0.6);

float gCy[3]; float gSy[3]; float gCp[3]; float gSp[3];
float gPix, gDist;

float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
vec3 tone(vec3 x){ vec3 c = 1.0 - exp(-max(x, 0.0) * 0.84); c = mix(c, c * c * (3.0 - 2.0 * c), 0.38); return pow(c, vec3(1.0 / 2.2)); }

float rb2(vec2 p, vec2 h, float r){ vec2 d = abs(p) - h + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r; }
float rb4(vec2 p, vec2 b, vec4 r){ r.xy = p.x > 0.0 ? r.xy : r.zw; r.x = p.y > 0.0 ? r.x : r.y; vec2 q = abs(p) - b + r.x; return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x; }
float ext(float d2, float y, float h, float bev){ vec2 w = vec2(d2, abs(y) - h) + bev; return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - bev; }
${RELIEF}

vec3 toSled(vec3 p, int i){ p -= vec3(uA[i].x, 0.0, uA[i].y); p.xz = vec2(gCy[i] * p.x - gSy[i] * p.z, gSy[i] * p.x + gCy[i] * p.z); return p; }
vec3 toBoard(vec3 q, int i){ q.y -= SH; q.yz = vec2(gCp[i] * q.y - gSp[i] * q.z, gSp[i] * q.y + gCp[i] * q.z); q.y -= 1.0; return q; }
vec3 dirBoard(vec3 d, int i){ d.xz = vec2(gCy[i] * d.x - gSy[i] * d.z, gSy[i] * d.x + gCy[i] * d.z); d.yz = vec2(gCp[i] * d.y - gSp[i] * d.z, gSp[i] * d.y + gCp[i] * d.z); return d; }

float sdSled(vec3 q){
  float e = q.y > 0.1 ? 0.022 : 0.003;
  vec2 w = vec2(rb2(q.xz, vec2(0.6, 0.27), 0.05), abs(q.y - 0.1) - 0.1) + e;
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - e;
}
float sdBoard(vec3 c, int i){
  float d = ext(rb2(c.xy, vec2(0.75, 1.0), 0.035), c.z, TH, 0.011);
  if (d > 0.2) return d - 0.07;
  float r = i == 0 ? rel0(c) : i == 1 ? rel1(c) : rel2(c);
  return min(d, r);
}
vec2 map(vec3 p){
  vec2 r = vec2(1e5, 0.0);
  for (int i = 0; i < 3; i++){
    vec3 q = toSled(p, i);
    float bd = length(q - vec3(0.0, 1.1, -0.1)) - 1.5;
    if (bd > 0.3){ if (bd < r.x) r = vec2(bd, 0.0); continue; }
    float d = sdSled(q); if (d < r.x) r = vec2(d, 4.0 + float(i));
    d = sdBoard(toBoard(q, i), i); if (d < r.x) r = vec2(d, 1.0 + float(i));
  }
  return r;
}
vec3 normal(vec3 p){
  vec2 e = vec2(1.0, -1.0) * 0.0015;
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}
vec2 march(vec3 ro, vec3 rd, int steps, float far){
  float t = 0.0; vec2 h = vec2(0.0);
  for (int i = 0; i < 120; i++){
    if (i >= steps) break;
    h = map(ro + rd * t);
    if (h.x < 0.0004 * (1.0 + t * 0.3) || t > far) break;
    t += h.x * 0.92;
  }
  return vec2(t, (t > far || h.x > 0.02) ? 0.0 : h.y);
}
float shadow(vec3 ro, vec3 rd){
  float res = 1.0, t = 0.012;
  for (int i = 0; i < 34; i++){
    vec2 m = map(ro + rd * t); float h = m.x;
    if (m.y > 0.5) res = min(res, 9.0 * h / t);
    t += clamp(h, 0.007 + t * 0.02, 0.32);
    if (res < 0.004 || t > 6.0) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}
float occ(vec3 p, vec3 n){
  float o = 0.0, s = 1.0;
  for (int i = 0; i < 5; i++){
    float h = 0.01 + 0.11 * float(i) / 4.0;
    o += (h - map(p + n * h).x) * s;
    s *= 0.78;
  }
  return clamp(1.0 - 3.0 * o, 0.0, 1.0);
}

// The window: one tall opening high on the left. Everything it lights sits inside a slanted beam with soft edges.
float win(vec3 p){
  float v = dot(p, vec3(0.435, 0.785, -0.442));
  float s = 0.26;
  return smoothstep(4.25 + s, 4.25 - s, v) * (0.5 + 0.5 * smoothstep(-3.5 - s * 2.0, -3.5 + s * 2.0, v));
}
// The bars of that window, as they fall on the wall behind the models.
float panes(vec3 p){
  float u = dot(p, vec3(0.713, 0.0, 0.701)), v = dot(p, vec3(0.435, 0.785, -0.442));
  float bu = abs(fract(u / 2.35 + 0.27) - 0.5) * 2.35, bv = abs(fract(v / 1.8 + 0.12) - 0.5) * 1.8;
  float lit = smoothstep(-0.07, 0.17, bu) * smoothstep(-0.06, 0.15, bv);
  return mix(1.0, 0.4 + 0.6 * lit, smoothstep(-1.1, -2.3, p.z));
}
vec3 fillL(vec3 n){ return mix(vec3(0.7, 0.68, 0.65), vec3(0.74, 0.82, 0.97), 0.5 + 0.5 * n.y); }

float rectL(vec3 ro, vec3 rd, vec3 c, vec3 n, vec2 hs, float soft){
  float dn = dot(rd, n); if (dn > -1e-4) return 0.0;
  float t = dot(c - ro, n) / dn; if (t < 0.0) return 0.0;
  vec3 q = ro + rd * t - c; float s = soft * t + 0.02;
  vec3 u = normalize(cross(vec3(0.0, 1.0, 0.0), n)), v = cross(n, u);
  vec2 d = abs(vec2(dot(q, u), dot(q, v))) - hs;
  return smoothstep(s, -s, d.x) * smoothstep(s, -s, d.y);
}
// The room the models mirror: a sunlit floor below, pale walls, a brighter ceiling and the window itself.
vec3 env(vec3 ro, vec3 rd, float rough){
  float soft = 0.04 + rough * 0.9;
  vec3 c = mix(vec3(1.7, 1.67, 1.6), vec3(0.62, 0.64, 0.69), smoothstep(-0.55 - rough * 0.3, 0.12 + rough * 0.3, rd.y));
  c = mix(c, vec3(1.45, 1.47, 1.52), smoothstep(0.2, 0.95, rd.y));
  c = mix(c, vec3(1.6, 1.57, 1.5), 0.85 * smoothstep(0.15, 0.9, -rd.z) * smoothstep(-0.05, 0.25, rd.y));
  c += SUNC * 7.5 * rectL(ro, rd, L * 9.0 + vec3(0.0, 0.6, 0.0), -L, vec2(2.4, 2.9), soft);
  // a white flat behind the camera, up and to the right: it is what the gloss on the photographs picks up
  c += vec3(0.94, 0.97, 1.0) * 3.4 * rectL(ro, rd, vec3(5.5, 4.4, 10.0), normalize(vec3(-5.5, -3.2, -10.0)), vec2(2.6, 2.2), soft + 0.06);
  return c;
}

bool stageHit(vec3 ro, vec3 rd, out float t, out vec3 n){
  t = 1e9; n = vec3(0.0, 1.0, 0.0);
  if (rd.y < -1e-5){ float tf = -ro.y / rd.y; if (tf > 0.0 && ro.z + rd.z * tf > WZ + RC){ t = tf; return true; } }
  if (rd.z < -1e-5){ float tw = (WZ - ro.z) / rd.z; if (tw > 0.0 && ro.y + rd.y * tw > RC){ t = tw; n = vec3(0.0, 0.0, 1.0); return true; } }
  vec2 oc = vec2(ro.y - RC, ro.z - (WZ + RC)); vec2 d = vec2(rd.y, rd.z);
  float a = dot(d, d), b = dot(oc, d), h = b * b - a * (dot(oc, oc) - RC * RC);
  if (h > 0.0 && a > 1e-7){
    float tc = (-b + sqrt(h)) / a; vec2 pc = oc + d * tc;
    if (tc > 0.0 && pc.x < 0.02 && pc.y < 0.02){ t = tc; n = vec3(0.0, -pc.x / RC, -pc.y / RC); return true; }
  }
  return false;
}
// The sweep with nothing standing on it: used for what the floor and the models mirror.
vec3 stageLite(vec3 ro, vec3 rd){
  float t; vec3 n;
  if (!stageHit(ro, rd, t, n)) return env(ro, rd, 0.3);
  vec3 p = ro + rd * t;
  return FLOORC * (SUNC * SUNI * max(dot(n, L), 0.0) * win(p) * panes(p) + fillL(n));
}

vec3 tex(int i, vec2 uv, float lod){
  vec3 c = i == 0 ? textureLod(uT0, uv, lod).rgb : i == 1 ? textureLod(uT1, uv, lod).rgb : textureLod(uT2, uv, lod).rgb;
  return pow(c, vec3(2.2));
}

vec3 shadeBoard(vec3 p, vec3 n, int i, vec3 rd, bool hq){
  vec3 q = toSled(p, i); vec3 c = toBoard(q, i);
  // the flat of the board and of everything raised on it shares one exact normal
  vec3 nl = dirBoard(n, i);
  if (abs(nl.z) > 0.96) n = sign(nl.z) * vec3(gSy[i] * gCp[i], gSp[i], gCy[i] * gCp[i]);
  float sh = 1.0, ao = 1.0;
  if (hq){ sh = shadow(p + n * 0.004, L); ao = occ(p, n); }
  float ndl = max(dot(n, L), 0.0);
  float nv = max(dot(n, -rd), 0.0);
  float d2 = rb2(c.xy, vec2(0.75, 1.0), 0.035);
  bool face = c.z > TH - 0.007 && d2 < -0.003;
  vec3 alb; float g;
  if (face){
    vec2 uv = vec2(c.x / 1.5 + 0.5, 0.5 - c.y / 2.0);
    float lod = clamp(log2(gDist * gPix * 800.0 / max(nv, 0.4)) - 0.45, 0.0, 8.0);
    alb = tex(i, uv, lod);
    g = FACEG[i];
    if (c.z > TH + 0.006) g = i == 0 ? gls0(c) : i == 1 ? gls1(c) : gls2(c);
    // card has a tooth; lacquer does not
    alb *= 1.0 + (0.05 * (n2(c.xy * 210.0) - 0.5) + 0.04 * (n2(c.xy * 77.0 + 3.0) - 0.5)) * (1.0 - g);
  } else { alb = BODY[i]; g = EDGEG[i]; }
  vec3 r = reflect(rd, n);
  float fr = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
  vec3 col = alb * (SUNC * SUNI * ndl * sh * win(p) + fillL(n) * ao);
  col += fr * env(p, r, mix(0.6, 0.05, g)) * (0.3 + 0.7 * ao) * mix(0.3, 1.0, g);
  // blue from the lit base creeps up the foot of the board
  col += BLUE * uB[i].x * 0.55 * exp(-(c.y + 1.0) * 11.0) * (0.3 + 0.7 * alb) * step(0.0, nl.z);
  return col;
}

vec3 shadeSled(vec3 p, vec3 n, int i, vec3 rd, bool hq){
  // a block of opal acrylic with a lamp inside: milky when it is off, blue all through when it is on
  vec3 q = toSled(p, i);
  float g = uB[i].x;
  vec3 nq = vec3(gCy[i] * n.x - gSy[i] * n.z, n.y, gSy[i] * n.x + gCy[i] * n.z);
  if (abs(nq.y) > 0.96) n = vec3(0.0, sign(nq.y), 0.0);
  else if (abs(nq.z) > 0.96) n = sign(nq.z) * vec3(gSy[i], 0.0, gCy[i]);
  else if (abs(nq.x) > 0.96) n = sign(nq.x) * vec3(gCy[i], 0.0, -gSy[i]);
  float sh = 1.0, ao = 1.0;
  if (hq){ sh = shadow(p + n * 0.004, L); ao = occ(p, n); }
  float nv = max(dot(n, -rd), 0.0);
  float fr = 0.045 + 0.955 * pow(1.0 - nv, 5.0);
  // light gets a little way into the plastic before it comes back, so the shading is softer than on card
  float wrap = max(dot(n, L) * 0.6 + 0.4, 0.0);
  vec3 col = OPAL * (SUNC * SUNI * mix(wrap, wrap * sh, 0.7) * win(p) * 0.8 + fillL(n) * (0.5 + 0.5 * ao));
  // the slot the board stands in
  float dB = abs(q.z + 0.012) - 0.078;
  col *= 1.0 - 0.3 * smoothstep(0.05, 0.0, dB) * step(0.9, n.y);
  // thin plastic at the edges lets more through, and the lamp bar shows as a soft grey band low in the block
  float rim = smoothstep(0.07, 0.0, min(0.6 - abs(q.x), min(0.27 - abs(q.z), 0.2 - q.y)));
  float bar = exp(-pow((q.y - 0.055) / 0.04, 2.0)) * smoothstep(0.56, 0.4, abs(q.x)) * (1.0 - abs(n.y));
  col *= (1.0 + 0.1 * rim) * (1.0 - 0.1 * bar * (1.0 - g)) * (0.88 + 0.12 * smoothstep(0.0, 0.08, q.y));
  // how much of the lamp reaches this bit of the surface: most straight above the bar, least at the ends
  float dl = length(vec2(q.y - 0.05, q.z * 0.8));
  float through = 1.0 / (1.0 + pow(dl / 0.2, 2.0)) * smoothstep(0.66, 0.3, abs(q.x));
  vec3 lamp = BLUEE * (0.3 + 0.62 * through) + vec3(0.36, 0.55, 0.8) * (bar * 0.5 + through * through * 0.3);
  col = mix(col, col * vec3(0.04, 0.18, 0.8), smoothstep(0.0, 0.5, g)) + lamp * g;
  col += fr * env(p, reflect(rd, n), 0.04) * (0.4 + 0.6 * ao) * 1.35;
  return col;
}
vec3 shade(vec3 p, vec3 n, float id, vec3 rd, bool hq){
  return id < 3.5 ? shadeBoard(p, n, int(id - 0.5), rd, hq) : shadeSled(p, n, int(id - 3.5), rd, hq);
}

vec3 stageShade(vec3 p, vec3 n, vec3 rd, float t){
  vec2 pq = p.xz + p.y * vec2(0.37, 0.81);
  vec3 alb = FLOORC * (1.0 + 0.035 * (n2(pq * 3.1) - 0.5) + 0.02 * (n2(pq * 47.0) - 0.5));
  float near = step(t, 24.0);
  float sh = near > 0.5 ? shadow(p + n * 0.005, L) : 1.0;
  float ao = 1.0; vec3 tint = vec3(0.0); float tw = 0.0; vec3 bleed = vec3(0.0);
  float floorish = smoothstep(0.6, 0.98, n.y);
  for (int i = 0; i < 3; i++){
    vec3 q = toSled(p, i);
    float dS = rb2(q.xz, vec2(0.6, 0.27), 0.07);
    float lowS = exp(-p.y * 3.0);
    ao *= 1.0 - 0.6 * lowS * smoothstep(0.4, -0.05, dS);
    // the lit base washes the floor round it
    float oS = max(dS, 0.0);
    tw += uB[i].x * lowS * (0.75 * exp(-oS * 7.0) + 0.3 * exp(-oS * 2.0));
    // colour thrown forward off each board
    float fz = q.z - 0.06;
    bleed += BODY[i] * step(0.0, fz) * exp(-fz * 1.5) * smoothstep(1.05 + fz * 0.8, 0.15, abs(q.x)) * lowS;
  }
  vec3 col = alb * (SUNC * SUNI * max(dot(n, L), 0.0) * sh * win(p) * panes(p) + fillL(n) * ao);
  col += alb * bleed * 0.5 * (0.35 + 0.65 * sh);
  if (floorish > 0.0 && near > 0.5){
    // polished floor: a soft mirror, strongest at a glancing angle
    vec3 nf = normalize(n + vec3((n2(p.xz * 1.3) - 0.5) * 0.006, 0.0, (n2(p.zx * 1.3 + 5.0) - 0.5) * 0.006));
    vec3 rr = reflect(rd, nf);
    float fr = (0.04 + 0.96 * pow(1.0 - max(dot(nf, -rd), 0.0), 5.0)) * 0.8 * floorish;
    vec3 rp = p + n * 0.004;
    vec3 rc = stageLite(rp, rr);
    vec2 rh = march(rp, rr, 52, 9.0);
    if (rh.y > 0.5){
      vec3 hp = rp + rr * rh.x; float keep = gDist; gDist = t + rh.x;
      rc = mix(rc, shade(hp, normal(hp), rh.y, rr, false), exp(-rh.x * 0.5));
      gDist = keep;
    }
    col = mix(col, rc, fr);
  }
  col = col * mix(vec3(1.0), vec3(0.34, 0.6, 1.0), clamp(tw, 0.0, 1.0)) + BLUE * tw * 0.4;
  return col;
}

void main(){
  for (int i = 0; i < 3; i++){ gCy[i] = cos(uA[i].w); gSy[i] = sin(uA[i].w); gCp[i] = cos(LEAN + uA[i].z); gSp[i] = sin(LEAN + uA[i].z); }
  gPix = 2.0 * tan(uFov * 0.5) / uRes.y;
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 fw = normalize(uTarget - uCam), rgt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))), up = cross(rgt, fw);
  vec3 rd = normalize(fw + (uv.x * rgt + uv.y * up) * 2.0 * tan(uFov * 0.5));
  vec3 ro = uCam;
  float ts; vec3 ns;
  bool hs = stageHit(ro, rd, ts, ns);
  float far = hs ? min(ts, 40.0) : 40.0;
  vec2 hit = march(ro, rd, 110, far);
  float t; vec3 col;
  if (hit.y > 0.5 && hit.x < far){
    t = hit.x; vec3 p = ro + rd * t; gDist = t;
    col = shade(p, normal(p), hit.y, rd, true);
  } else if (hs){
    t = ts; gDist = t; col = stageShade(ro + rd * ts, ns, rd, ts);
  } else { t = 40.0; col = env(ro, rd, 0.2); }
  // the lit base blooms a little in the lens
  for (int i = 0; i < 3; i++){
    vec3 c = vec3(uA[i].x, 0.1, uA[i].y);
    float tc = clamp(dot(c - ro, rd), 0.0, t);
    vec3 dv = ro + rd * tc - c; dv.x *= 0.45;
    col += BLUE * uB[i].x * 0.016 / (0.03 + dot(dv, dv));
  }
  o = vec4(tone(col), clamp(t / ZF, 0.0, 1.0));
}`;

const POST = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uSrc;
uniform vec2 uRes;
uniform float uFocus, uTime;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec4 c0 = texture(uSrc, vUv);
  float z = c0.a * 26.0;
  {
    vec2 e = 1.0 / uRes; vec3 Lm = vec3(0.299, 0.587, 0.114);
    float nw = dot(textureLod(uSrc, vUv + vec2(-e.x, -e.y), 0.0).rgb, Lm), ne = dot(textureLod(uSrc, vUv + vec2(e.x, -e.y), 0.0).rgb, Lm);
    float sw = dot(textureLod(uSrc, vUv + vec2(-e.x, e.y), 0.0).rgb, Lm), se = dot(textureLod(uSrc, vUv + e, 0.0).rgb, Lm), lm = dot(c0.rgb, Lm);
    float lo = min(lm, min(min(nw, ne), min(sw, se))), hi = max(lm, max(max(nw, ne), max(sw, se)));
    vec2 dir = vec2(-((nw + ne) - (sw + se)), (nw + sw) - (ne + se));
    float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + max((nw + ne + sw + se) * 0.03125, 0.0078));
    dir = clamp(dir * rcp, -8.0, 8.0) * e;
    vec3 a = 0.5 * (textureLod(uSrc, vUv + dir * (1.0 / 3.0 - 0.5), 0.0).rgb + textureLod(uSrc, vUv + dir * (2.0 / 3.0 - 0.5), 0.0).rgb);
    vec3 b = a * 0.5 + 0.25 * (textureLod(uSrc, vUv - dir * 0.5, 0.0).rgb + textureLod(uSrc, vUv + dir * 0.5, 0.0).rgb);
    float lb = dot(b, Lm);
    c0.rgb = (lb < lo || lb > hi) ? a : b;
  }
  float px = uRes.y / 720.0;
  float coc = clamp(abs(z - uFocus) / max(z, 0.1) * (z < uFocus ? 8.0 : 5.0) - 0.5, 0.0, 6.0) * px;
  vec3 acc = c0.rgb; float ws = 1.0;
  float j = hash(gl_FragCoord.xy) * 6.283;
  float lod = log2(max(coc / 3.0, 1.0));
  for (int i = 0; i < 14; i++){
    float fi = (float(i) + 0.5) / 14.0;
    float a = float(i) * 2.39996 + j;
    vec2 off = vec2(cos(a), sin(a)) * sqrt(fi) * coc / uRes;
    vec4 s = textureLod(uSrc, vUv + off, lod);
    acc += s.rgb; ws += 1.0;
  }
  vec3 col = acc / ws;
  vec3 bl = textureLod(uSrc, vUv, 4.0).rgb * 0.5 + textureLod(uSrc, vUv, 6.0).rgb * 0.5;
  col += bl * bl * 0.035;
  vec2 v = vUv - 0.5;
  col *= 1.0 - dot(v, v) * 0.22;
  float g = hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;
  col += g * 0.02 * (1.0 - 0.4 * col);
  o = vec4(col, 1.0);
}`;

/* ---------- small motion helpers ---------- */

type Spring = { x: number; v: number; t: number; k: number; c: number };
const spring = (x: number, k: number, c: number): Spring => ({ x, v: 0, t: x, k, c });
const stepSpring = (s: Spring, dt: number, push = 0) => {
  s.v += (-s.k * (s.x - s.t) - s.c * s.v + push) * dt;
  s.x += s.v * dt;
};

export default function ThreeDesignModelsOnASunlitStage() {
  const reduce = useReducedMotion();
  const [pick, setPick] = useState(START);
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flatRef = useRef<(HTMLCanvasElement | null)[]>([]);
  const hitRef = useRef<(HTMLDivElement | null)[]>([]);
  const photoRef = useRef<(HTMLImageElement | null)[]>([]);
  // The design asked for last. The picture catches up a moment later, so the keyboard reads this and not the state.
  const want = useRef(START);
  // The render loop owns the scene. React talks to it through this handle.
  const api = useRef<{ choose: (i: number) => void; hover: (i: number, on: boolean) => void } | null>(null);

  // Print the three pages. They are the picture on each model, and the still shown where the renderer cannot run.
  useEffect(() => {
    const sheets = flatRef.current;
    const paint = (i: number, img: HTMLImageElement | null) => {
      const cv = sheets[i];
      const cx = cv?.getContext("2d");
      if (!cv || !cx) return;
      cx.setTransform(1, 0, 0, 1, 0, 0);
      PAINT[i](cx, img);
      cv.dispatchEvent(new Event("printed"));
    };
    const offs = DESIGNS.map((_, i) => {
      const img = photoRef.current[i];
      const ok = !!img && img.complete && img.naturalWidth > 0;
      paint(i, ok ? img : null);
      if (!img || ok) return () => {};
      const fn = () => paint(i, img);
      img.addEventListener("load", fn);
      return () => img.removeEventListener("load", fn);
    });
    return () => offs.forEach((off) => off());
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const sheets = flatRef.current;
    if (!root || !canvas || sheets.length < 3 || sheets.some((s) => !s)) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
      return s;
    };
    const link = (fs: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, "a");
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
      return p;
    };
    let scene: WebGLProgram;
    let post: WebGLProgram;
    try {
      scene = link(SCENE);
      post = link(POST);
    } catch (e) {
      console.error(e);
      return;
    }
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uCam", "uTarget", "uFov", "uA", "uB", "uT0", "uT1", "uT2"].map((n) => [n, U(scene, n)]));
    const pu = Object.fromEntries(["uSrc", "uRes", "uFocus", "uTime"].map((n) => [n, U(post, n)]));

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    let dirty = true;
    const texs = sheets.map(() => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    });
    const upload = (i: number) => {
      const cv = sheets[i]!;
      gl.bindTexture(gl.TEXTURE_2D, texs[i]);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      } catch {
        // a photograph that may not be read back: print the page with its plain colour instead
        const c2 = document.createElement("canvas");
        c2.width = PW;
        c2.height = PH;
        PAINT[i](c2.getContext("2d")!, null);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c2);
      }
      gl.generateMipmap(gl.TEXTURE_2D);
      dirty = true;
    };
    const onPrinted = sheets.map((cv, i) => {
      const fn = () => {
        upload(i);
        kick();
      };
      cv!.addEventListener("printed", fn);
      return fn;
    });

    // the moving parts, one set for each model
    let chosen = START;
    // Two places at the back, one at the front. Whoever is picked trades places with the model in front.
    const slot = DESIGNS.map((_, i) => (i < START ? -1 : 1));
    const prog = DESIGNS.map((_, i) => (i === START ? 1 : 0));
    const side = DESIGNS.map((_, i) => spring(i === START ? 0 : slot[i], 80, 15));
    const fwd = DESIGNS.map((_, i) => spring(i === START ? 1 : 0, 64, 13.5));
    const goal = DESIGNS.map((_, i) => (i === START ? 1 : 0));
    const lean = DESIGNS.map(() => spring(0, 190, 7.5));
    const turn = DESIGNS.map((_, i) => spring(i === START ? -0.05 : -slot[i] * 0.1, 40, 11));
    const glow = DESIGNS.map((_, i) => spring(i === START ? 1 : 0, 120, 16));
    const hov = [0, 0, 0];
    const landed = DESIGNS.map((_, i) => i === START);
    const push = spring(0, 70, 9);
    const cam = { ax: 0, ay: 0, tx: 0, ty: 0 };
    let demo = !reduce;
    let clock = 0;
    let time = 0;
    let idleAt = HOLD;
    let wake = Infinity;
    let cues: { at: number; fn: () => void }[] = [];
    const at = (delay: number, fn: () => void) => {
      cues.push({ at: clock + delay, fn });
      cues.sort((a, b) => a.at - b.at);
    };
    const settle = (j: number) => {
      cues = [];
      chosen = j;
      DESIGNS.forEach((_, i) => {
        const on = i === j ? 1 : 0;
        fwd[i].x = fwd[i].t = goal[i] = prog[i] = on;
        fwd[i].v = 0;
        side[i].x = side[i].t = on ? 0 : slot[i];
        side[i].v = 0;
        turn[i].x = turn[i].t = on ? -0.05 : -slot[i] * 0.1;
        turn[i].v = 0;
        lean[i].x = lean[i].v = 0;
        glow[i].x = glow[i].t = on;
        glow[i].v = 0;
        landed[i] = on === 1;
      });
      dirty = true;
    };
    const choose = (j: number) => {
      if (j === chosen) return;
      const prev = chosen;
      chosen = j;
      want.current = j;
      slot[prev] = slot[j];
      if (reduce) {
        settle(j);
        setPick(j);
        return;
      }
      cues = [];
      // the base lights first, then the model lets go and comes forward
      glow[j].t = 0.8;
      goal[prev] = 0;
      landed[prev] = false;
      at(0.14, () => (glow[prev].t = 0));
      at(0.12, () => {
        goal[j] = 1;
        setPick(j);
      });
    };
    const quiet = () => {
      demo = false;
      idleAt = Infinity;
      wake = clock + 14;
    };
    api.current = {
      choose: (j) => {
        quiet();
        choose(j);
        kick();
      },
      hover: (j, on) => {
        hov[j] = on ? 1 : 0;
        kick();
      },
    };

    // render target
    const fbo = gl.createFramebuffer();
    const fbTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, fbTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    let scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, window.devicePixelRatio || 1));
    let cssW = 1;
    let cssH = 1;
    let phone = false;
    let bw = 0;
    let bh = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      cssW = Math.max(1, r.width);
      cssH = Math.max(1, r.height);
      phone = cssW < 768;
      // never more than about 2.2 million pixels through the ray marcher
      const s = Math.min(scale, Math.sqrt(2.2e6 / (cssW * cssH)));
      const w = Math.round(cssW * s);
      const h = Math.round(cssH * s);
      if (w !== bw || h !== bh) {
        bw = w;
        bh = h;
        canvas.width = w;
        canvas.height = h;
        gl.bindTexture(gl.TEXTURE_2D, fbTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTex, 0);
      }
      dirty = true;
    };
    resize();
    sheets.forEach((_, i) => upload(i));

    const A = new Float32Array(12);
    const B = new Float32Array(12);
    const hitKey = ["", "", ""];
    const draw = () => {
      const wide = cssW / cssH;
      // where things stand, and where the camera is
      const gap = phone ? 1.72 : 2.08;
      const run = phone ? 2.1 : 1.8;
      const front = phone ? -0.1 : -0.34;
      const fov = phone ? 0.5 : 0.36;
      const tgt = [phone ? 0 : -0.2, phone ? 1.02 : 0.8, (phone ? 1.2 : 0.55)];
      const az = (phone ? -0.1 : -0.17) + cam.ax * 0.07 + Math.sin(time * 0.19) * 0.014;
      const el = (phone ? 0.15 : 0.115) - cam.ay * 0.035 + Math.sin(time * 0.27 + 1) * 0.005;
      const dist = (phone ? 9.6 : 10.2 * Math.max(1, 1.62 / wide)) * (1 - 0.01 * push.x);
      const camPos = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] + dist * Math.cos(az) * Math.cos(el)];
      // focus rides with whichever model is furthest forward
      let fx = 0;
      let fz = 0;
      let fwt = 0;
      for (let i = 0; i < 3; i++) {
        const w = Math.pow(Math.max(0, fwd[i].x), 2) + 0.001;
        fx += (side[i].x * gap + fwd[i].x * front) * w;
        fz += fwd[i].x * run * w;
        fwt += w;
      }
      const fp = [fx / fwt - camPos[0], 1.1 - camPos[1], fz / fwt - camPos[2]];
      const focus = Math.hypot(fp[0], fp[1], fp[2]);
      for (let i = 0; i < 3; i++) {
        A[i * 4] = side[i].x * gap + fwd[i].x * front;
        A[i * 4 + 1] = fwd[i].x * run;
        A[i * 4 + 2] = lean[i].x;
        A[i * 4 + 3] = turn[i].x;
        B[i * 4] = Math.max(0, glow[i].x + (i === chosen ? 0 : hov[i] * 0.22));
        B[i * 4 + 1] = focus;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(scene);
      gl.uniform2f(su.uRes, bw, bh);
      gl.uniform3f(su.uCam, camPos[0], camPos[1], camPos[2]);
      gl.uniform3f(su.uTarget, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFov, fov);
      gl.uniform4fv(su.uA, A);
      gl.uniform4fv(su.uB, B);
      ["uT0", "uT1", "uT2"].forEach((n, i) => {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, texs[i]);
        gl.uniform1i(su[n], i);
      });
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(post);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fbTex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.uniform1i(pu.uSrc, 0);
      gl.uniform2f(pu.uRes, bw, bh);
      gl.uniform1f(pu.uFocus, focus);
      gl.uniform1f(pu.uTime, reduce ? 0 : time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // keep a pointer target over each model in the picture
      const fwv = [tgt[0] - camPos[0], tgt[1] - camPos[1], tgt[2] - camPos[2]];
      const fl = Math.hypot(fwv[0], fwv[1], fwv[2]);
      fwv[0] /= fl; fwv[1] /= fl; fwv[2] /= fl;
      const rg = [-fwv[2], 0, fwv[0]];
      const rl = Math.hypot(rg[0], rg[2]);
      rg[0] /= rl; rg[2] /= rl;
      const up = [rg[1] * fwv[2] - rg[2] * fwv[1], rg[2] * fwv[0] - rg[0] * fwv[2], rg[0] * fwv[1] - rg[1] * fwv[0]];
      for (let i = 0; i < 3; i++) {
        const hit = hitRef.current[i];
        if (!hit) continue;
        const v = [A[i * 4] - camPos[0], 1.1 - camPos[1], A[i * 4 + 1] - 0.1 - camPos[2]];
        const depth = v[0] * fwv[0] + v[1] * fwv[1] + v[2] * fwv[2];
        const k = cssH / (depth * 2 * Math.tan(fov / 2));
        const x = cssW / 2 + (v[0] * rg[0] + v[2] * rg[2]) * k;
        const y = cssH / 2 - (v[0] * up[0] + v[1] * up[1] + v[2] * up[2]) * k;
        const next = `${Math.round(x)}|${Math.round(y)}|${Math.round(k)}`;
        if (next !== hitKey[i]) {
          hitKey[i] = next;
          hit.style.left = `${x}px`;
          hit.style.top = `${y}px`;
          hit.style.width = `${1.5 * k}px`;
          hit.style.height = `${2.1 * k}px`;
          hit.style.zIndex = String(Math.round(100 - depth * 5));
        }
      }
    };

    let raf = 0;
    let last = 0;
    let onScreen = true;
    let slow = 0;
    let first = true;
    const frame = (now: number) => {
      raf = 0;
      const raw = last ? (now - last) / 1000 : 0.016;
      last = now;
      const dt = Math.min(raw, 0.1);
      if (reduce) {
        if (dirty) {
          dirty = false;
          draw();
        }
      } else {
        clock += dt;
        time += dt;
        while (cues.length && cues[0].at <= clock) cues.shift()!.fn();
        if (clock > wake) {
          wake = Infinity;
          demo = true;
          idleAt = clock + 1.5;
        }
        if (demo && clock > idleAt) {
          choose((chosen + 1) % DESIGNS.length);
          idleAt = clock + HOLD + 1.2;
        }
        for (let i = 0; i < 3; i++) {
          // Each model follows a slow plan and a spring follows the plan, so it starts late and rocks as it stops.
          // Coming in: sideways along the back, a small step away, then forward. Going out: sideways across the front, then back.
          prog[i] = Math.max(0, Math.min(1, prog[i] + ((goal[i] === 1 ? 1 : -1) * dt) / TRAVEL));
          const ease = (a: number, b: number) => {
            const u = Math.max(0, Math.min(1, (prog[i] - a) / (b - a)));
            return u * u * (3 - 2 * u);
          };
          let plan: number;
          if (goal[i] === 1) {
            side[i].t = slot[i] * (1 - ease(0, 0.55));
            plan = ease(0.25, 1) - 0.05 * Math.sin(Math.PI * Math.min(1, prog[i] / 0.3));
          } else {
            side[i].t = slot[i] * (1 - ease(0.45, 1));
            plan = ease(0, 0.75);
          }
          fwd[i].t = Math.max(plan, i === chosen ? -1 : hov[i] * 0.07);
          const f = Math.max(0, Math.min(1, fwd[i].x));
          turn[i].t = -side[i].x * 0.1 * (1 - f) - 0.05 * f;
          for (let n = 0; n < 4; n++) {
            const h = dt / 4;
            const v0 = fwd[i].v;
            const s0 = side[i].v;
            stepSpring(fwd[i], h);
            stepSpring(side[i], h);
            stepSpring(lean[i], h, ((fwd[i].v - v0) / h) * 2.6);
            stepSpring(turn[i], h, ((side[i].v - s0) / h) * 1.5);
            stepSpring(glow[i], h);
          }
          lean[i].x = Math.max(-0.09, Math.min(0.12, lean[i].x));
          if (goal[i] === 1 && !landed[i] && fwd[i].x > 0.965) {
            // it arrives: the light under it flares and the camera takes the knock
            landed[i] = true;
            glow[i].t = 1;
            glow[i].v += 7;
            push.v += 1.5;
          }
        }
        for (let n = 0; n < 4; n++) {
          stepSpring(push, dt / 4);
        }
        const kc = 1 - Math.exp(-dt * 3.2);
        cam.ax += (cam.tx - cam.ax) * kc;
        cam.ay += (cam.ty - cam.ay) * kc;
        draw();
        // step the resolution down if this machine cannot hold the frame rate
        if (raw > 0.03) slow++;
        else slow = Math.max(0, slow - 1);
        if (slow > 24 && scale > MIN_SCALE) {
          scale = Math.max(MIN_SCALE, scale * 0.84);
          slow = 0;
          resize();
        }
      }
      if (first) {
        first = false;
        setReady(true);
      }
      if (onScreen && !document.hidden && (!reduce || dirty)) raf = requestAnimationFrame(frame);
    };
    function kick() {
      if (!raf && onScreen && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    }
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      kick();
    });
    io.observe(root);
    const ro = new ResizeObserver(() => {
      resize();
      kick();
    });
    ro.observe(canvas);
    const onVis = () => kick();
    document.addEventListener("visibilitychange", onVis);
    const onMove = (e: PointerEvent) => {
      if (reduce) return;
      const r = root.getBoundingClientRect();
      cam.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      cam.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    };
    const onLeave = () => {
      cam.tx = 0;
      cam.ty = 0;
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    const onLost = (e: Event) => {
      e.preventDefault();
      setReady(false);
      cancelAnimationFrame(raf);
      api.current = null;
    };
    canvas.addEventListener("webglcontextlost", onLost);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
      sheets.forEach((cv, i) => cv?.removeEventListener("printed", onPrinted[i]));
      api.current = null;
      texs.forEach((t) => gl.deleteTexture(t));
      gl.deleteTexture(fbTex);
      gl.deleteFramebuffer(fbo);
      gl.deleteBuffer(quad);
      gl.deleteProgram(scene);
      gl.deleteProgram(post);
    };
  }, [reduce]);

  const choose = (i: number) => {
    want.current = i;
    if (api.current) api.current.choose(i);
    else setPick(i);
  };
  const onKeys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (want.current + step + DESIGNS.length) % DESIGNS.length;
    choose(next);
    (e.currentTarget.children[next] as HTMLElement | undefined)?.focus();
  };
  const design = DESIGNS[pick];

  return (
    <section ref={rootRef} className="relative isolate h-[680px] w-full overflow-hidden md:h-[740px]" style={{ backgroundColor: "#ECEAE5", color: INK, fontFamily: FONT }}>
      {/* The still: the three printed pages standing in a row. Shown before the renderer starts and wherever it cannot run. */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "pointer-events-none opacity-0" : "opacity-100"}`} style={{ background: "linear-gradient(118deg, rgba(255,255,255,0) 56%, rgba(128,134,150,0.32) 82%), linear-gradient(180deg, #F3F1EC 0%, #ECEAE5 62%, #E2E0DB 62.3%, #EFEDE8 100%)" }}>
        <div className="absolute inset-x-0 top-[25%] flex items-end justify-center gap-[3.5%] px-4 md:top-[17%]">
          {DESIGNS.map((d, i) => (
            <div
              key={d.name}
              aria-hidden="true"
              onClick={() => choose(i)}
              className="relative w-[29%] max-w-[262px] cursor-pointer transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ aspectRatio: "3 / 4", transform: i === pick ? "translateY(9%) scale(1.13)" : "scale(0.95)", zIndex: i === pick ? 2 : 1 }}
            >
              <canvas
                ref={(el) => {
                  flatRef.current[i] = el;
                }}
                width={PW}
                height={PH}
                className="block h-full w-full rounded-[5px]"
                style={{ backgroundColor: d.body, boxShadow: i === pick ? "0 1px 0 rgba(255,255,255,0.5) inset, 26px 44px 60px -22px rgba(40,48,66,0.5), 8px 10px 16px -6px rgba(40,48,66,0.3)" : "18px 30px 44px -20px rgba(40,48,66,0.4), 5px 7px 12px -5px rgba(40,48,66,0.25)" }}
              />
              <span
                className="absolute inset-x-[11%] top-[96.5%] h-[7.5%] rounded-[4px] transition-[background-color,box-shadow] duration-500 motion-reduce:transition-none"
                style={i === pick ? { backgroundColor: BLUE, boxShadow: "0 0 28px 5px rgba(79,152,251,0.5), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -7px 10px -4px rgba(160,205,255,0.9)" } : { backgroundColor: "#F4F4F2", boxShadow: "0 8px 12px -5px rgba(40,48,66,0.3), inset 0 1px 0 #fff, inset 0 -6px 8px -4px rgba(120,130,150,0.25)" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* The photographs printed on the pages. Kept as real images so they load once and are described to screen readers. */}
      <div className="sr-only">
        {DESIGNS.map((d, i) => (
          <img
            alt={`${d.name} design: ${d.photo.alt}`}
            key={d.name}
            src={d.photo.src}
            crossOrigin="anonymous"
            width={300}
            height={400}
            ref={(el) => {
              photoRef.current[i] = el;
            }}
          />
        ))}
      </div>

      <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} />

      {/* Pointer targets laid over the models in the picture. The named buttons below do the same job for keyboards and screen readers. */}
      {DESIGNS.map((d, i) => (
        <div
          key={d.name}
          ref={(el) => {
            hitRef.current[i] = el;
          }}
          aria-hidden="true"
          className={`absolute -translate-x-1/2 -translate-y-1/2 touch-manipulation select-none ${ready ? "" : "hidden"} ${i === pick ? "" : "cursor-pointer"}`}
          onClick={() => choose(i)}
          onPointerEnter={() => api.current?.hover(i, true)}
          onPointerLeave={() => api.current?.hover(i, false)}
        />
      ))}

      <p className="pointer-events-none absolute left-5 top-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0B0D12]/55 md:left-10 md:top-9 md:text-[11px]">
        One sentence <span className="mx-1.5 text-[#0B0D12]/30">/</span> Three designs
      </p>
      <p className="pointer-events-none absolute right-5 top-5 hidden max-w-[260px] text-right text-[13px] font-medium leading-snug tracking-tight text-[#0B0D12]/55 md:right-10 md:top-8 md:block">
        &ldquo;{SHOP.sentence}&rdquo;
      </p>

      <div className="pointer-events-none absolute left-5 top-11 md:bottom-10 md:left-10 md:top-auto">
        <p className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0B0D12]/60 md:text-[11px]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BLUE }} />
          Design 0{pick + 1} <span className="text-[#0B0D12]/30">/</span> 0{DESIGNS.length}
        </p>
        <div className="relative mt-1 h-[58px] w-[320px] overflow-hidden md:mt-1.5 md:h-[104px] md:w-[520px]">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.h2
              key={design.name}
              initial={reduce ? { opacity: 0 } : { y: "70%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { y: "-50%", opacity: 0 }}
              transition={reduce ? { duration: 0.01 } : { y: { type: "spring", stiffness: 210, damping: 22 }, opacity: { duration: 0.28 } }}
              className="absolute left-0 top-0 text-[56px] font-extrabold leading-[1] tracking-[-0.055em] md:text-[100px]"
            >
              {design.name}
            </motion.h2>
          </AnimatePresence>
        </div>
        <p className="mt-0.5 text-[14px] font-medium tracking-tight text-[#0B0D12]/65 md:mt-2 md:text-[17px]">{design.line}</p>
      </div>

      <div className="absolute inset-x-0 bottom-5 z-[200] flex flex-col items-center gap-2.5 md:inset-x-auto md:bottom-10 md:right-10 md:items-end md:gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0B0D12]/50 md:text-[11px]">Pick one</span>
        <div role="radiogroup" aria-label={`Design for ${SHOP.name}`} onKeyDown={onKeys} className="flex rounded-full p-1" style={{ backgroundColor: "rgba(255,255,255,0.72)", boxShadow: "0 0 0 1px rgba(11,13,18,0.08), 0 14px 30px -14px rgba(30,40,60,0.35)", backdropFilter: "blur(10px)" }}>
          {DESIGNS.map((d, i) => (
            <button
              key={d.name}
              type="button"
              role="radio"
              aria-checked={i === pick}
              tabIndex={i === pick ? 0 : -1}
              onClick={() => choose(i)}
              className="relative h-11 rounded-full px-5 text-[15px] font-bold tracking-tight transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 motion-reduce:transition-none"
              style={{ color: INK }}
            >
              {i === pick && (
                <motion.span layoutId="three-design-models-pill" className="absolute inset-0 rounded-full" style={{ backgroundColor: BLUE, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), 0 6px 16px -4px rgba(79,152,251,0.75)" }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }} />
              )}
              <span className="relative">{d.name}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {design.name}, design {pick + 1} of {DESIGNS.length} for {SHOP.name}. {design.line}
      </p>
    </section>
  );
}
