import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** The page that the model shows once it is live. Change the words here. */
const SITE = {
  brand: "Slow Kiln",
  nav: ["Shop", "Studio", "Visit"],
  headline: ["Thrown by hand,", "fired slow."],
  sub: "Small batch stoneware from a harbour studio, glazed in quiet colours and fired once a week.",
  cta: "Shop the batch",
  foot: "Whitby, Yorkshire",
};
const PHOTO = {
  src: "https://images.pexels.com/photos/8479191/pexels-photo-8479191.jpeg?auto=compress&cs=tinysrgb&w=900",
  alt: "Pale crackle glazed ceramic vase lit from one side against a black background",
  tone: "#17191c",
};
/** The two states, as the words shown beside the key. */
const STATES = {
  draft: { word: "Draft", line: "Only you can see this page.", action: "Publish" },
  live: { word: "Live", line: "Anyone with the address can visit.", action: "Back to draft" },
};

const BLUE = "#4F98FB";
const INK = "#0B0D12";
const PAPER = "#F6F4EF";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
/** Seconds the self-playing demo holds the live page, and the draft, before pressing the key again. */
const HOLD_LIVE = 6.5;
const HOLD_DRAFT = 2.3;
/** How far down the key stays once the page is live, as a share of its full travel. */
const LATCH = 0.46;
/** Lowest and highest render scale (canvas pixels per CSS pixel). The loop steps down when frames run slow. */
const MIN_SCALE = 0.6001;
const MAX_SCALE = 1.5001;

/* ---------- canvas drawings, used as textures ---------- */

type Ctx = CanvasRenderingContext2D;
const setFont = (c: Ctx, weight: number, size: number, track = 0) => {
  c.font = `${weight} ${size}px ${FONT}`;
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
function pill(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/** The published page, as printed on the film inside the lightbox. 2048 x 1536. */
function drawLive(c: Ctx, img: HTMLImageElement | null) {
  c.fillStyle = PAPER;
  c.fillRect(0, 0, 2048, 1536);
  c.textBaseline = "alphabetic";
  // menu bar
  c.fillStyle = INK;
  pill(c, 84, 76, 1880, 132, 66);
  c.fill();
  c.fillStyle = "#fff";
  setFont(c, 800, 58, -0.02);
  c.fillText(SITE.brand, 148, 163);
  setFont(c, 500, 44, 0);
  let x = 1900;
  for (const item of [...SITE.nav].reverse()) {
    x -= c.measureText(item).width;
    c.fillText(item, x, 158);
    x -= 70;
  }
  // photograph
  const px = 1296, py = 290, pw = 668, ph = 1010;
  c.save();
  pill(c, px, py, pw, ph, 40);
  c.clip();
  c.fillStyle = PHOTO.tone;
  c.fillRect(px, py, pw, ph);
  if (img && img.naturalWidth) {
    const s = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    try {
      c.filter = "grayscale(1) contrast(1.08) brightness(1.12)";
    } catch {
      /* colour is fine too */
    }
    c.drawImage(img, px + (pw - w) / 2, py + (ph - h) / 2, w, h);
    c.filter = "none";
  } else {
    const g = c.createRadialGradient(px + 300, py + 600, 20, px + 300, py + 600, 520);
    g.addColorStop(0, "#c9ccd0");
    g.addColorStop(0.45, "#5d6066");
    g.addColorStop(1, PHOTO.tone);
    c.fillStyle = g;
    c.fillRect(px, py, pw, ph);
  }
  c.restore();
  // headline
  c.fillStyle = INK;
  let size = 176;
  for (; size > 80; size -= 4) {
    setFont(c, 800, size, -0.05);
    if (Math.max(...SITE.headline.map((l) => c.measureText(l).width)) < 1130) break;
  }
  SITE.headline.forEach((l, i) => c.fillText(l, 100, 470 + size * 0.36 + i * size * 0.95));
  // small print
  c.fillStyle = "#3d4149";
  setFont(c, 500, 50, -0.012);
  wrap(c, SITE.sub, 980).slice(0, 3).forEach((l, i) => c.fillText(l, 106, 880 + i * 68));
  // button
  c.fillStyle = BLUE;
  pill(c, 104, 1126, 560, 150, 75);
  c.fill();
  c.fillStyle = "#fff";
  setFont(c, 700, 56, -0.015);
  const lw = c.measureText(SITE.cta).width;
  const sx = 104 + (560 - lw - 74) / 2;
  c.fillText(SITE.cta, sx, 1220);
  c.lineWidth = 7;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.strokeStyle = "#fff";
  const ax = sx + lw + 28;
  c.beginPath();
  c.moveTo(ax, 1201);
  c.lineTo(ax + 44, 1201);
  c.moveTo(ax + 26, 1183);
  c.lineTo(ax + 44, 1201);
  c.lineTo(ax + 26, 1219);
  c.stroke();
  // foot
  c.fillStyle = "rgba(11,13,18,0.16)";
  c.fillRect(104, 1404, 1860, 3);
  c.fillStyle = "#7d8088";
  setFont(c, 600, 26, 0.14);
  c.fillText(SITE.foot.toUpperCase(), 104, 1462);
  const right = SITE.brand.toUpperCase();
  c.fillText(right, 1964 - c.measureText(right).width, 1462);
}

/** The same page before it is published: a pencil plan of blocks on dark film. 1024 x 768. */
function drawDraft(c: Ctx) {
  c.fillStyle = "#23262c";
  c.fillRect(0, 0, 1024, 768);
  const line = "#7c818b";
  const fill = "#343841";
  c.strokeStyle = line;
  c.lineWidth = 2.5;
  c.setLineDash([10, 9]);
  c.fillStyle = fill;
  pill(c, 42, 38, 940, 66, 33);
  c.fill();
  c.stroke();
  pill(c, 648, 145, 334, 505, 20);
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(660, 157);
  c.lineTo(970, 638);
  c.moveTo(970, 157);
  c.lineTo(660, 638);
  c.stroke();
  pill(c, 52, 563, 280, 75, 37.5);
  c.fill();
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = "#5b606a";
  pill(c, 52, 222, 520, 62, 10);
  c.fill();
  pill(c, 52, 304, 400, 62, 10);
  c.fill();
  c.fillStyle = "#454a54";
  for (let i = 0; i < 3; i++) {
    pill(c, 53, 432 + i * 34, [470, 490, 300][i], 14, 7);
    c.fill();
  }
  c.fillStyle = "#4a4f59";
  pill(c, 72, 62, 110, 18, 9);
  c.fill();
  for (let i = 0; i < 3; i++) {
    pill(c, 720 + i * 82, 64, 58, 14, 7);
    c.fill();
  }
  c.fillStyle = line;
  c.fillRect(52, 702, 930, 1.5);
  c.textBaseline = "alphabetic";
  setFont(c, 600, 15, 0.2);
  c.fillText("DRAFT", 52, 734);
  const t = "NOT PUBLISHED";
  c.fillText(t, 982 - c.measureText(t).width, 734);
}

/** Plan view of the key from above, 1.3 units across: red is the white paint in the engraving, green is the arrow cut through the cap. */
function drawMarks(c: Ctx) {
  const S = 2048, u = S / 1.3;
  c.fillStyle = "#000";
  c.fillRect(0, 0, S, S);
  c.translate(S / 2, S / 2);
  c.textBaseline = "middle";
  c.fillStyle = "#f00";
  setFont(c, 700, 0.052 * u, 0.2);
  const z = 0.533 * u;
  const d = "DRAFT";
  c.fillText(d, -0.125 * u - c.measureText(d).width, z);
  c.fillText("LIVE", 0.135 * u, z);
  setFont(c, 600, 0.036 * u, 0.34);
  const p = "PUBLISH";
  c.fillText(p, -c.measureText(p).width / 2 + 0.006 * u, -z);
  // arrow
  c.strokeStyle = "#0f0";
  c.lineWidth = 0.05 * u;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(0, 0.15 * u);
  c.lineTo(0, -0.15 * u);
  c.moveTo(-0.125 * u, -0.03 * u);
  c.lineTo(0, -0.155 * u);
  c.lineTo(0.125 * u, -0.03 * u);
  c.stroke();
}

/* ---------- shaders ---------- */

const VERT = `#version 300 es
in vec2 a; out vec2 vUv;
void main(){ vUv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

const SCENE = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes;
uniform vec3 uCam, uTarget;
uniform float uFov, uTime;
uniform vec4 uPos;    // key x, z and model x, z on the floor
uniform float uYaw;   // turn of the model
uniform float uPress; // travel of the key, 0 up to 1 on its stop
uniform float uGlow;  // blue light under the key
uniform float uInk;   // how far the printed page has replaced the plan, bottom to top
uniform float uLit;   // lamps inside the lightbox
uniform vec4 uSeg;    // the light channel in the floor: from x, z to x, z
uniform vec4 uChan;   // pulse position, pulse strength, how far the channel is filled, light under the model
uniform vec4 uPip;    // the two indicator lamps on the collar, then radius and strength of the ring on the floor
uniform sampler2D uLive, uDraft, uMarks;

const vec3 BLUE = vec3(0.078, 0.314, 0.965);
const vec3 ALU = vec3(0.91, 0.918, 0.925);
const vec3 KEY = vec3(-0.21, 0.86, 0.465);
const vec3 KEYC = vec3(1.0, 0.975, 0.94);
const float PT = 0.38, CT = 0.50, MS = 0.84;

float gCy, gSy, gCl, gSl, gPix, gDist;
vec3 gPageC, gPageN, gKeyC;

float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float n1(float x){ float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h21(vec2(i, 3.7)), h21(vec2(i + 1.0, 3.7)), f); }

float rb2(vec2 p, vec2 h, float r){ vec2 d = abs(p) - h + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r; }
float ext(float d2, float y, float h, float bev){ vec2 w = vec2(d2, abs(y) - h) + bev; return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - bev; }

vec3 toKey(vec3 p){ return p - vec3(uPos.x, 0.0, uPos.y); }
vec3 toBase(vec3 p){ p -= vec3(uPos.z, 0.0, uPos.w); p.xz = vec2(gCy * p.x - gSy * p.z, gSy * p.x + gCy * p.z); return p / MS; }
vec3 toBox(vec3 q){ q.y -= 0.11; q.yz = vec2(gCl * q.y - gSl * q.z, gSl * q.y + gCl * q.z); return q; }
vec3 dirBox(vec3 d){ d.xz = vec2(gCy * d.x - gSy * d.z, gSy * d.x + gCy * d.z); d.yz = vec2(gCl * d.y - gSl * d.z, gSl * d.y + gCl * d.z); return d; }
vec3 boxToWorld(vec3 q){
  q.yz = vec2(gCl * q.y + gSl * q.z, -gSl * q.y + gCl * q.z); q.y += 0.11;
  q.xz = vec2(gCy * q.x + gSy * q.z, -gSy * q.x + gCy * q.z);
  return q * MS + vec3(uPos.z, 0.0, uPos.w);
}

float capTop(){ return CT + 0.19 - uPress * 0.15; }
float sdPlinth(vec3 p){
  float body = ext(rb2(p.xz, vec2(0.8), 0.15), p.y - 0.215, 0.165, 0.03);
  float foot = ext(rb2(p.xz, vec2(0.72), 0.09), p.y - 0.03, 0.03, 0.0);
  return min(body, foot);
}
float sdCollar(vec3 p){
  float d2 = rb2(p.xz, vec2(0.62), 0.17);
  float d = max(d2, abs(p.y - (PT + CT) * 0.5) - (CT - PT) * 0.5);
  d = max(d, (d2 + p.y - CT + 0.03) * 0.7071);
  float w2 = rb2(p.xz, vec2(0.47), 0.13) - clamp(p.y - (CT - 0.02), 0.0, 0.03);
  return max(d, -max(w2, PT + 0.03 - p.y));
}
float sdCap(vec3 p){
  float top = capTop();
  float d = ext(rb2(p.xz, vec2(0.42), 0.11), p.y - (top - 0.22), 0.22, 0.032);
  return max(d, 2.3 - length(p - vec3(0.0, top + 2.3 - 0.03, 0.0)));
}
float sdBase(vec3 q){
  float body = ext(rb2(q.xz - vec2(0.0, -0.04), vec2(1.2, 0.34), 0.07), q.y - 0.09, 0.05, 0.026);
  float foot = ext(rb2(q.xz - vec2(0.0, -0.04), vec2(1.04, 0.18), 0.04), q.y - 0.02, 0.02, 0.0);
  return min(body, foot);
}
float sdBox(vec3 r){
  vec2 c = r.xy - vec2(0.0, 0.82);
  return ext(rb2(c, vec2(1.07, 0.82), 0.075), r.z, 0.085, 0.028);
}

vec2 map(vec3 p){
  vec2 r = vec2(1e5, 0.0);
  vec3 k = toKey(p);
  float bk = length(k - vec3(0.0, 0.3, 0.0)) - 1.3;
  if (bk < 0.25){
    r = vec2(sdPlinth(k), 1.0);
    float d = sdCollar(k); if (d < r.x) r = vec2(d, 2.0);
    d = sdCap(k); if (d < r.x) r = vec2(d, 3.0);
  } else r.x = bk;
  vec3 q = toBase(p);
  float bp = (length(q - vec3(0.0, 0.85, -0.12)) - 1.6) * MS;
  if (bp < 0.25){
    float d = sdBase(q) * MS; if (d < r.x) r = vec2(d, 4.0);
    d = sdBox(toBox(q)) * MS; if (d < r.x) r = vec2(d, 5.0);
  } else if (bp < r.x) r = vec2(bp, 0.0);
  return r;
}
vec3 normal(vec3 p){
  vec2 e = vec2(1.0, -1.0) * 0.0011;
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}
vec2 march(vec3 ro, vec3 rd, int steps, float far){
  float t = 0.0; vec2 h = vec2(0.0);
  for (int i = 0; i < 120; i++){
    if (i >= steps) break;
    h = map(ro + rd * t);
    if (h.x < 0.0005 * (1.0 + t * 0.3) || t > far) break;
    t += h.x * 0.9;
  }
  return vec2(t, (t > far || h.x > 0.02) ? 0.0 : h.y);
}
float shadow(vec3 ro, vec3 rd){
  float res = 1.0, t = 0.02;
  for (int i = 0; i < 26; i++){
    vec2 m = map(ro + rd * t); float h = m.x;
    if (m.y > 0.5) res = min(res, 5.5 * h / t);
    t += clamp(h, 0.014, 0.3);
    if (res < 0.004 || t > 5.0) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}
float occ(vec3 p, vec3 n){
  float o = 0.0, s = 1.0;
  for (int i = 0; i < 5; i++){
    float h = 0.012 + 0.1 * float(i) / 4.0;
    o += (h - map(p + n * h).x) * s;
    s *= 0.8;
  }
  return clamp(1.0 - 3.4 * o, 0.0, 1.0);
}

// The studio: softboxes as rectangles, with edges that soften as the surface that mirrors them gets rougher.
float gGrade;
float rectL(vec3 ro, vec3 rd, vec3 c, vec3 n, vec2 hs, float soft){
  float dn = dot(rd, n); if (dn > -1e-4) return 0.0;
  float t = dot(c - ro, n) / dn; if (t < 0.0) return 0.0;
  vec3 q = ro + rd * t - c; float s = soft * t + 0.02;
  vec3 u = normalize(cross(vec3(0.0, 1.0, 0.0), n)), v = cross(n, u);
  vec2 d = abs(vec2(dot(q, u), dot(q, v))) - hs;
  float cloth = 1.0 - 0.45 * clamp(length(vec2(dot(q, u), dot(q, v)) / hs), 0.0, 1.4);
  gGrade = smoothstep(-hs.y - s, hs.y, dot(q, v));
  return smoothstep(s, -s, d.x) * smoothstep(s, -s, d.y) * cloth;
}
vec3 env(vec3 ro, vec3 rd, float rough){
  float soft = 0.03 + rough * 0.8;
  vec3 c = mix(vec3(0.008, 0.009, 0.012), vec3(0.03, 0.033, 0.042), smoothstep(-0.1, 0.9, rd.y));
  c += vec3(1.0, 0.975, 0.94) * 6.0 * rectL(ro, rd, vec3(-1.8, 7.8, 4.2), normalize(vec3(2.0, -7.4, -4.2)), vec2(3.2, 1.9), soft);
  c += vec3(0.9, 0.94, 1.0) * 4.6 * rectL(ro, rd, vec3(8.0, 3.2, -2.6), normalize(vec3(-8.0, -2.6, 2.6)), vec2(0.8, 2.8), soft);
  c += vec3(0.86, 0.92, 1.0) * 1.6 * rectL(ro, rd, vec3(-8.5, 2.4, -0.5), normalize(vec3(8.5, -1.8, 0.5)), vec2(1.3, 2.2), soft);
  // the scrim behind the set is graded: bright along its top edge, nearly out at the bottom
  float back = rectL(ro, rd, vec3(0.6, 5.8, -6.9), normalize(vec3(-0.3, -5.2, 6.9)), vec2(4.6, 1.9), soft);
  c += vec3(0.92, 0.96, 1.0) * back * (0.14 + 2.0 * gGrade * gGrade);
  c += vec3(0.3, 0.315, 0.345) * smoothstep(0.08, 1.0, rd.y) * (0.25 + 0.75 * smoothstep(0.7, -0.8, rd.z));
  return c;
}
vec3 envF(vec3 ro, vec3 rd, float rough){
  if (rd.y >= 0.0) return env(ro, rd, rough);
  float t = -ro.y / rd.y;
  float f = 0.06 + 0.94 * pow(1.0 - clamp(-rd.y, 0.0, 1.0), 5.0);
  return vec3(0.006, 0.0065, 0.008) + f * env(ro + rd * t, vec3(rd.x, -rd.y, rd.z), rough + 0.04);
}
vec3 fres(vec3 f0, float c){ return f0 + (1.0 - f0) * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }
vec3 aniso(vec3 p, vec3 rd, vec3 n, vec3 b, float spread, float rough){
  vec3 c = vec3(0.0); float w = 0.0;
  for (int i = -3; i <= 3; i++){ float f = float(i) / 3.0; float g = exp(-2.4 * f * f); c += g * envF(p, reflect(rd, normalize(n + b * f * spread)), rough); w += g; }
  return c / w;
}
// White light thrown by the lit page onto whatever faces it.
float pageLight(vec3 p, vec3 n){
  vec3 l = gPageC - p; float d2 = dot(l, l); l *= inversesqrt(d2);
  return uLit * 2.3 * max(dot(n, l), 0.0) * max(dot(gPageN, -l), 0.0) / (0.5 + d2 * 0.5);
}
float lodOf(float texels){ return clamp(log2(gDist * gPix * texels), 0.0, 7.0); }

vec3 shade(vec3 p, vec3 n, float id, vec3 rd, bool hq){
  float sh = 1.0, ao = 1.0;
  if (hq){ sh = shadow(p + n * 0.006, KEY); ao = occ(p, n); }
  vec3 keyL = KEYC * max(dot(n, KEY), 0.0) * sh * 1.5;
  vec3 amb = vec3(0.07, 0.076, 0.09) * ao * (0.6 + 0.4 * n.y);
  float pl = pageLight(p, n);
  vec3 r = reflect(rd, n);
  float nv = max(dot(n, -rd), 0.0);
  float so = 0.35 + 0.65 * ao;
  vec3 col;
  if (id < 1.5 || (id > 3.5 && id < 4.5)){
    // plinth and base: bead-blasted black anodising
    vec3 l = id < 1.5 ? toKey(p) : toBase(p);
    float g = n2(l.xz * 60.0 + l.y * 41.0);
    float f = 0.045 + 0.955 * pow(1.0 - nv, 5.0);
    vec2 cell = floor(l.xz * 41.0); float hs = h21(cell + id);
    vec2 cp = (cell + 0.2 + 0.6 * vec2(h21(cell + 3.1), h21(cell + 7.7))) / 41.0;
    float dust = step(id, 1.5) * step(0.985, hs) * smoothstep(0.003 + 0.004 * h21(cell + 1.3), 0.0, length(l.xz - cp)) * step(0.9, n.y);
    float smear = n2(l.xz * 3.1 + 7.0) * n2(l.xz * 7.3);
    col = (vec3(0.016, 0.017, 0.021) * (0.94 + 0.12 * g) + dust * 0.4) * (keyL + amb + pl) + envF(p, r, 0.16 + 0.03 * g + 0.14 * smear) * f * so;
    // light from underneath bounces off the floor and up the sides
    col += BLUE * (id < 1.5 ? uGlow : uChan.w) * 0.16 * exp(-max(l.y - 0.05, 0.0) * 13.0) * (1.0 - abs(n.y));
    if (l.y < (id < 1.5 ? 0.0505 : 0.0405)) col = BLUE * (id < 1.5 ? uGlow : uChan.w) * 3.5 + vec3(1.0) * (id < 1.5 ? uGlow : uChan.w) * 0.4;
    return col;
  }
  if (id < 2.5){
    vec3 k = toKey(p);
    float w2 = rb2(k.xz, vec2(0.47), 0.13);
    float hgt = k.y - (PT + 0.03);
    if (w2 < 0.006 && hgt < 0.006) return (BLUE * 5.5 + 0.12) * uGlow; // the diffuser at the bottom of the gap
    if (w2 < 0.04 && n.y < 0.6){
      // wall of the well, washed by the light below it
      col = fres(ALU, nv) * envF(p, r, 0.22) * so;
      return col * 0.5 + BLUE * 1.5 * uGlow * exp(-max(hgt, 0.0) * 17.0) * ALU;
    }
    if (n.y > 0.9){
      // top face, brushed front to back, with paint-filled engraving and two lamps
      vec3 nn = normalize(n + vec3(1.0, 0.0, 0.0) * ((n1(k.x * 520.0) - 0.5) * 0.05 + (n1(k.x * 130.0 + 5.0) - 0.5) * 0.03));
      col = fres(ALU, nv) * (aniso(p, rd, nn, vec3(0.0, 0.0, 1.0), 0.34, 0.1) * so * (0.86 + 0.14 * n1(k.x * 260.0 + 9.0)) + 0.07 * (keyL + pl));
      float ink = textureLod(uMarks, k.xz / 1.3 + 0.5, lodOf(1575.0)).r;
      col = mix(col, vec3(0.012, 0.013, 0.016) * (keyL + amb) + envF(p, r, 0.3) * 0.04, ink * 0.96);
      vec2 pd = vec2(abs(k.x) - 0.066, k.z - 0.533);
      float pip = smoothstep(0.019, 0.015, length(pd));
      float lev = k.x < 0.0 ? uPip.x : uPip.y;
      vec3 lamp = k.x < 0.0 ? vec3(0.8, 0.83, 0.9) * 1.3 : BLUE * 7.0 + 0.12;
      col = mix(col, vec3(0.01) + lamp * lev, pip);
      col += (k.x < 0.0 ? vec3(0.05) : BLUE * 0.5) * lev * exp(-length(pd) * 26.0) * (1.0 - pip);
      // four socket screws hold the collar down
      float sd = length(abs(k.xz) - 0.506);
      if (sd < 0.04){
        vec2 hx = abs(k.xz - sign(k.xz) * 0.506);
        float hex = max(hx.x * 0.866 + hx.y * 0.5, hx.y) - 0.014;
        vec3 head = fres(ALU, nv) * envF(p, reflect(rd, normalize(n + vec3(k.x, 0.0, k.z) * 0.0 + vec3(hx.x, 0.0, hx.y) * 2.5 * sign(k.x))), 0.05) * so;
        col = mix(col, head * 0.9, smoothstep(0.03, 0.028, sd));
        col *= 1.0 - 0.75 * smoothstep(0.036, 0.031, sd) * smoothstep(0.026, 0.03, sd);
        col = mix(col, vec3(0.004), smoothstep(0.002, -0.001, hex));
      }
      // light creeping over the lip of the well
      col += BLUE * uGlow * 0.5 * exp(-max(w2 - 0.03, 0.0) * 34.0);
      return col;
    }
    if (abs(n.y) < 0.25){
      vec3 nn = normalize(n + vec3(0.0, 1.0, 0.0) * (n1(k.y * 700.0) - 0.5) * 0.05);
      return fres(ALU, nv) * (aniso(p, rd, nn, vec3(0.0, 1.0, 0.0), 0.3, 0.1) * so + 0.07 * (keyL + pl));
    }
    return fres(ALU, nv) * (envF(p, r, 0.035) * so + 0.05 * (keyL + pl)); // diamond-cut chamfers
  }
  if (id < 3.5){
    vec3 k = toKey(p);
    float rr = length(k.xz); vec3 rdir = vec3(k.x, 0.0, k.z) / max(rr, 1e-4);
    float dish = smoothstep(0.372, 0.36, rr) * step(0.55, n.y);
    if (n.y > 0.55){
      // the dish is faced on a lathe, the flat round it is brushed straight
      vec3 bit = mix(vec3(0.0, 0.0, 1.0), rdir, dish);
      vec3 gr = mix(vec3(1.0, 0.0, 0.0) * ((n1(k.x * 430.0) - 0.5) * 0.035 + (n1(k.x * 90.0 + 2.0) - 0.5) * 0.02), rdir * ((n1(rr * 420.0) - 0.5) * 0.05 + (n1(rr * 95.0 + 4.0) - 0.5) * 0.03), dish);
      vec3 nn = normalize(n + gr);
      col = fres(ALU, nv) * (aniso(p, rd, nn, bit, mix(0.2, 0.36, dish), mix(0.09, 0.05, dish)) * so * (0.88 + 0.12 * n1(rr * 180.0 + 1.0)) + 0.05 * (keyL + pl + amb));
      // the cutter leaves a bright lip where the dish meets the flat
      float lip = smoothstep(0.012, 0.0, abs(rr - 0.366));
      col = mix(col, fres(ALU, nv) * envF(p, reflect(rd, normalize(n - rdir * 0.55)), 0.04), lip * 0.85);
    } else col = fres(ALU, nv) * (envF(p, r, 0.05) * so + 0.05 * (keyL + pl + amb));
    float hgt = k.y - (PT + 0.03);
    if (n.y > 0.55){
      // the arrow is a light pipe let into the metal: brightest down its middle, with a dark cut edge
      float ar = textureLod(uMarks, k.xz / 1.3 + 0.5, lodOf(1575.0)).g;
      float soft = textureLod(uMarks, k.xz / 1.3 + 0.5, 4.6).g;
      float core = smoothstep(0.45, 0.95, soft);
      col *= 1.0 - 0.6 * smoothstep(0.02, 0.4, soft) * (1.0 - ar);
      vec3 lens = vec3(0.2, 0.26, 0.4) * (keyL + amb) * 0.3 + BLUE * (0.45 + 1.1 * uGlow + 3.4 * uGlow * core) + vec3(1.0) * 1.7 * uGlow * core * core;
      col += BLUE * uGlow * 0.55 * soft * (1.0 - ar);
      col = mix(col, lens, ar);
    } else {
      col += BLUE * 1.5 * uGlow * exp(-max(hgt, 0.0) * 12.0) * smoothstep(0.5, -0.2, n.y) * ALU;
    }
    return col;
  }
  // the lightbox
  vec3 q = toBox(toBase(p)), nq = dirBox(n);
  vec2 c = q.xy - vec2(0.0, 0.82);
  float fd = rb2(c, vec2(1.0, 0.75), 0.03), aa = gDist * gPix * 1.2;
  float film = smoothstep(aa, -aa, fd) * step(0.07, q.z);
  vec3 filmC = vec3(0.0);
  if (film > 0.0){
    float vt = (c.y + 0.75) / 1.5;
    vec2 uv = vec2(c.x * 0.5 + 0.5, 1.0 - vt);
    float lv = smoothstep(0.0, 0.012, uInk * 1.06 - vt);
    vec3 live = pow(textureLod(uLive, uv, lodOf(1024.0)).rgb, vec3(2.2));
    vec3 draft = pow(textureLod(uDraft, uv, lodOf(512.0)).rgb, vec3(2.2));
    vec3 alb = mix(draft, live * 0.42, lv);
    float f = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
    col = alb * (keyL * 0.8 + amb * 1.4) + envF(p, r, 0.05) * f;
    // opal acrylic over edge lamps: a touch brighter toward the frame, and never perfectly even
    float even = 0.9 + 0.1 * smoothstep(0.45, 0.0, min(1.0 - abs(c.x), 0.75 - abs(c.y))) + 0.02 * n2(c * 3.0);
    col += live * lv * uLit * 2.1 * even;
    if (uInk > 0.002 && uInk < 0.998){
      float d = uInk * 1.06 - vt;
      col += (BLUE * 6.0 + 1.4) * exp(-abs(d) * 130.0) + BLUE * 0.9 * exp(-max(d, 0.0) * 9.0) * step(0.0, d);
    }
    if (film > 0.999) return col;
    filmC = col;
  }
  // frame: dark titanium grey, satin, with a polished edge
  float edge = 1.0 - smoothstep(0.8, 0.97, max(abs(nq.z), max(abs(nq.x), abs(nq.y))));
  vec3 bw = normalize(boxToWorld(vec3(1.0, 0.0, 0.0)) - boxToWorld(vec3(0.0)));
  vec3 nn = normalize(n + bw * (n1(q.x * 150.0) - 0.5) * 0.03 * (1.0 - edge));
  col = fres(ALU, nv) * (mix(aniso(p, rd, nn, normalize(cross(n, bw)), 0.3, 0.1), envF(p, r, 0.09), edge) * so + 0.07 * (keyL + pl));
  // the rebate round the film catches the page's own light
  // a black gasket holds the film in the frame, and catches a little of the page's light
  float gasket = smoothstep(0.016 + aa, 0.016 - aa, fd) * step(0.07, q.z);
  col = mix(col, vec3(0.006, 0.0065, 0.008) + vec3(0.9, 0.92, 1.0) * uLit * 0.07 * smoothstep(0.016, 0.0, fd), gasket);
  return mix(col, filmC, film);
}

vec3 backdrop(vec3 rd){
  return mix(vec3(0.03, 0.034, 0.045), vec3(0.0035, 0.004, 0.0055), smoothstep(0.0, 0.42, rd.y));
}

vec3 floorShade(vec3 p, vec3 rd, float t){
  vec3 n = normalize(vec3((n2(p.xz * 0.9) - 0.5) * 0.004, 1.0, (n2(p.zx * 0.9 + 5.0) - 0.5) * 0.004));
  float near = step(t, 26.0);
  float sh = 1.0, ao = 1.0;
  vec3 k = toKey(p), q = toBase(p);
  float dK = rb2(k.xz, vec2(0.8), 0.15), dP = rb2(q.xz - vec2(0.0, -0.04), vec2(1.2, 0.34), 0.07) * MS;
  if (near > 0.5){
    sh = shadow(p + vec3(0.0, 0.006, 0.0), KEY);
    ao = clamp(0.25 + 0.75 * min(smoothstep(-0.06, 0.5, dK), smoothstep(-0.06, 0.4, dP)), 0.0, 1.0);
  }
  vec2 cc = p.xz - 0.5 * (uPos.xy + uPos.zw);
  float pool = 1.0 / (1.0 + dot(cc, cc) * 0.055); pool *= pool;
  vec3 alb = vec3(0.05, 0.052, 0.06) * (0.9 + 0.2 * n2(p.xz * 2.2));
  // dust on the floor that catches the key light
  vec2 cell = floor(p.xz * 23.0); float hs = h21(cell);
  vec2 cp = (cell + 0.2 + 0.6 * vec2(h21(cell + 3.1), h21(cell + 7.7))) / 23.0;
  alb += step(0.993, hs) * smoothstep(0.004 + 0.006 * h21(cell + 1.3), 0.0, length(p.xz - cp)) * 0.3;
  vec3 col = alb * (KEYC * KEY.y * sh * pool * 1.5 + vec3(0.05) * ao + pageLight(p, n) * ao);
  // the mirror
  vec3 rr = reflect(rd, n);
  float f = 0.055 + 0.945 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
  vec3 rc = env(p, rr, 0.3) * 0.2 * (0.4 + 0.6 * ao);
  if (near > 0.5){
    vec3 rp = p + vec3(0.0, 0.004, 0.0);
    vec2 rh = march(rp, rr, 56, 12.0);
    if (rh.y > 0.5){
      vec3 hp = rp + rr * rh.x;
      gDist = t + rh.x;
      rc = shade(hp, normal(hp), rh.y, rr, false) * exp(-rh.x * 0.7);
    }
  }
  col += rc * f * (0.9 + 0.1 * n2(p.xz * 1.3 + 3.0));
  // blue light leaking from under the plinth, and under the model once the channel is lit
  float oK = max(dK, 0.0), oP = max(dP, 0.0);
  col += BLUE * uGlow * (0.34 * exp(-oK * 11.0) + 0.06 * exp(-oK * 2.6)) * step(0.0, dK + 0.1);
  col += BLUE * uChan.w * (0.26 * exp(-oP * 11.0) + 0.04 * exp(-oP * 2.6)) * step(0.0, dP + 0.1);
  // the thump when the key lands: a ring of light running out across the floor
  col += BLUE * uPip.w * (0.5 * exp(-pow((oK - uPip.z) * 8.0, 2.0)) + 0.07 * exp(-pow((oK - uPip.z) * 2.6, 2.0))) * step(0.0, dK);
  // the channel let into the floor
  vec2 a = uSeg.xy, b = uSeg.zw, ab = b - a;
  float s = clamp(dot(p.xz - a, ab) / dot(ab, ab), 0.0, 1.0);
  float d = length(p.xz - a - ab * s);
  float core = smoothstep(0.02, 0.011, d);
  float level = smoothstep(0.0, 0.03, uChan.z - s) * (0.75 + 0.25 * sin(s * 40.0 - uTime * 2.4)) + uChan.y * exp(-pow((s - uChan.x) * 6.5, 2.0)) * 3.0;
  col = mix(col, vec3(0.004), core * 0.85);
  col += (BLUE * (0.035 + 4.5 * level) + vec3(1.0) * level * 0.9) * core + BLUE * level * 0.22 * exp(-d * 13.0);
  return mix(col, backdrop(vec3(rd.x, 0.0, rd.z)), smoothstep(8.0, 30.0, t));
}

vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main(){
  gCy = cos(uYaw); gSy = sin(uYaw); gCl = cos(0.2); gSl = sin(0.2);
  gPageC = boxToWorld(vec3(0.0, 0.82, 0.09));
  gPageN = normalize(boxToWorld(vec3(0.0, 0.82, 1.08)) - gPageC);
  gKeyC = vec3(uPos.x, PT + 0.06, uPos.y);
  gPix = 2.0 * tan(uFov * 0.5) / uRes.y;
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 fw = normalize(uTarget - uCam), rgt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))), up = cross(rgt, fw);
  vec3 rd = normalize(fw + (uv.x * rgt + uv.y * up) * 2.0 * tan(uFov * 0.5));
  vec3 ro = uCam;
  float tf = rd.y < -1e-4 ? -ro.y / rd.y : 1e5;
  vec2 hit = march(ro, rd, 120, min(tf, 40.0));
  float t; vec3 col;
  if (hit.y > 0.5 && hit.x < tf){
    t = hit.x; vec3 p = ro + rd * t; gDist = t;
    col = shade(p, normal(p), hit.y, rd, true);
  } else if (tf < 1e4){
    t = tf; col = floorShade(ro + rd * tf, rd, tf);
  } else { t = 40.0; col = backdrop(rd); }
  // light in the air above the key and in front of the page
  float tc = clamp(dot(gKeyC - ro, rd), 0.0, t);
  float dm = length(ro + rd * tc - gKeyC);
  col += BLUE * uGlow * 0.006 / (0.1 + dm * dm * 2.2);
  vec3 pc = gPageC + gPageN * 0.5;
  tc = clamp(dot(pc - ro, rd), 0.0, t);
  dm = length(ro + rd * tc - pc);
  col += vec3(0.85, 0.9, 1.0) * uLit * 0.01 / (0.25 + dm * dm);
  float mx = max(col.r, max(col.g, col.b));
  col = mix(col * (aces(vec3(mx)).r / max(mx, 0.0001)), aces(col), 0.14);
  col = pow(col, vec3(1.0 / 2.2));
  o = vec4(col, clamp(t / 24.0, 0.0, 1.0));
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
  float z = c0.a * 24.0;
  {
    vec2 e = 1.0 / uRes; vec3 L = vec3(0.299, 0.587, 0.114);
    float nw = dot(textureLod(uSrc, vUv + vec2(-e.x, -e.y), 0.0).rgb, L), ne = dot(textureLod(uSrc, vUv + vec2(e.x, -e.y), 0.0).rgb, L);
    float sw = dot(textureLod(uSrc, vUv + vec2(-e.x, e.y), 0.0).rgb, L), se = dot(textureLod(uSrc, vUv + e, 0.0).rgb, L), lm = dot(c0.rgb, L);
    float lo = min(lm, min(min(nw, ne), min(sw, se))), hi = max(lm, max(max(nw, ne), max(sw, se)));
    vec2 dir = vec2(-((nw + ne) - (sw + se)), (nw + sw) - (ne + se));
    float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + max((nw + ne + sw + se) * 0.03125, 0.0078));
    dir = clamp(dir * rcp, -8.0, 8.0) * e;
    vec3 a = 0.5 * (textureLod(uSrc, vUv + dir * (1.0 / 3.0 - 0.5), 0.0).rgb + textureLod(uSrc, vUv + dir * (2.0 / 3.0 - 0.5), 0.0).rgb);
    vec3 b = a * 0.5 + 0.25 * (textureLod(uSrc, vUv - dir * 0.5, 0.0).rgb + textureLod(uSrc, vUv + dir * 0.5, 0.0).rgb);
    float lb = dot(b, L);
    c0.rgb = (lb < lo || lb > hi) ? a : b;
  }
  float px = uRes.y / 720.0;
  float coc = clamp(abs(z - uFocus) / max(z, 0.1) * (z < uFocus ? 7.0 : 5.0) - 0.9, 0.0, 6.0) * px;
  vec3 acc = c0.rgb; float ws = 1.0;
  float j = hash(gl_FragCoord.xy) * 6.283;
  float lod = log2(max(coc / 3.0, 1.0));
  for (int i = 0; i < 14; i++){
    float fi = (float(i) + 0.5) / 14.0;
    float a = float(i) * 2.39996 + j;
    vec2 off = vec2(cos(a), sin(a)) * sqrt(fi) * coc / uRes;
    vec4 s = textureLod(uSrc, vUv + off, lod);
    float w = 1.0 + 5.0 * pow(max(s.r, max(s.g, s.b)), 6.0);
    acc += s.rgb * w; ws += w;
  }
  vec3 col = acc / ws;
  vec3 bl = textureLod(uSrc, vUv, 3.0).rgb * 0.35 + textureLod(uSrc, vUv, 4.5).rgb * 0.35 + textureLod(uSrc, vUv, 6.0).rgb * 0.3;
  col += bl * bl * 0.11;
  vec2 v = vUv - 0.5;
  col *= 1.0 - dot(v, v) * 0.8;
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.3);
  float g = hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;
  col += g * 0.026 * (1.0 - 0.5 * col);
  o = vec4(col, 1.0);
}`;

/* ---------- small motion helpers ---------- */

type Spring = { x: number; v: number; t: number; k: number; c: number };
const spring = (x: number, k: number, c: number): Spring => ({ x, v: 0, t: x, k, c });
const stepSpring = (s: Spring, dt: number) => {
  s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt;
  s.x += s.v * dt;
};

export default function PublishKeyLightboxPage() {
  const reduce = useReducedMotion();
  const [live, setLive] = useState(true);
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  // The render loop owns the scene. React talks to it through this handle.
  const api = useRef<{ toggle: () => void; hold: (down: boolean) => void } | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
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
    const su = Object.fromEntries(["uRes", "uCam", "uTarget", "uFov", "uTime", "uPos", "uYaw", "uPress", "uGlow", "uInk", "uLit", "uSeg", "uChan", "uPip", "uLive", "uDraft", "uMarks"].map((n) => [n, U(scene, n)]));
    const pu = Object.fromEntries(["uSrc", "uRes", "uFocus", "uTime"].map((n) => [n, U(post, n)]));

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    const makeTex = () => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      return t;
    };
    const upload = (t: WebGLTexture, src: HTMLCanvasElement) => {
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.generateMipmap(gl.TEXTURE_2D);
    };
    const mk = (w: number, h: number) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      return [c, c.getContext("2d")!] as const;
    };
    const liveTex = makeTex();
    const draftTex = makeTex();
    const marksTex = makeTex();
    let dirty = true;
    const paintLive = (img: HTMLImageElement | null) => {
      const [cv, cx] = mk(2048, 1536);
      drawLive(cx, img);
      try {
        upload(liveTex, cv);
      } catch {
        // a photograph that may not be read back: print the page with the plain study instead
        const [c2, x2] = mk(2048, 1536);
        drawLive(x2, null);
        upload(liveTex, c2);
      }
      dirty = true;
    };
    paintLive(null);
    {
      const [cv, cx] = mk(1024, 768);
      drawDraft(cx);
      upload(draftTex, cv);
      const [mv, mx] = mk(2048, 2048);
      drawMarks(mx);
      upload(marksTex, mv);
    }
    const photo = new Image();
    photo.crossOrigin = "anonymous";
    photo.decoding = "async";
    photo.onload = () => paintLive(photo);
    photo.src = PHOTO.src;

    // the moving parts
    const press = spring(LATCH, 420, 22);
    const glow = spring(1, 200, 20);
    const lit = spring(1, 150, 13);
    const push = spring(0, 60, 9);
    const under = spring(1, 60, 14);
    const pip = spring(1, 90, 16);
    const ink = { x: 1, t: 1, rate: 2 };
    const fill = { x: 1, t: 1, rate: 2 };
    const pulse = { x: 2, on: false };
    const ring = { r: 0, s: 0 };
    const cam = { ax: 0, ay: 0, tx: 0, ty: 0 };
    let isLive = true;
    let held = false;
    let flicker: { at: number; v: number }[] = [];
    let demo = !reduce;
    let clock = 0;
    let time = 0;
    let idleAt = 4.2;
    let wake = Infinity;
    let cues: { at: number; fn: () => void }[] = [];
    const at = (delay: number, fn: () => void) => {
      cues.push({ at: clock + delay, fn });
      cues.sort((a, b) => a.at - b.at);
    };

    const settle = (on: boolean) => {
      cues = [];
      flicker = [];
      const set = (s: Spring, v: number) => ((s.x = s.t = v), (s.v = 0));
      set(press, on ? LATCH : 0);
      set(glow, on ? 1 : 0.42);
      set(lit, on ? 1 : 0);
      set(under, on ? 1 : 0);
      set(pip, on ? 1 : 0);
      ink.x = ink.t = fill.x = fill.t = on ? 1 : 0;
      pulse.on = false;
      ring.s = 0;
      dirty = true;
    };
    /** The key has reached its stop: run what follows from it. */
    const strike = (on: boolean) => {
      isLive = on;
      cues = [];
      flicker = [];
      push.v += 2.2;
      ring.r = 0;
      ring.s = on ? 1 : 0.45;
      if (on) {
        glow.t = 2.6;
        pip.t = 1;
        pulse.x = 0;
        pulse.on = true;
        fill.t = 1;
        fill.rate = 1 / 0.5;
        at(0.1, () => {
          press.k = 520;
          press.c = 17;
          press.t = held ? 1 : LATCH;
        });
        at(0.22, () => (glow.t = 1));
        at(0.5, () => {
          under.t = 1;
          ink.t = 1;
          ink.rate = 1 / 0.5;
        });
        at(1.04, () => {
          // the lamps catch, drop out, catch again and hold
          flicker = [
            { at: clock, v: 0.7 },
            { at: clock + 0.05, v: 0.04 },
            { at: clock + 0.13, v: 0.95 },
            { at: clock + 0.18, v: 0.16 },
            { at: clock + 0.25, v: 1.25 },
          ];
          setLive(true);
        });
        at(1.32, () => {
          flicker = [];
          lit.t = 1;
        });
      } else {
        glow.t = 0.42;
        pip.t = 0;
        lit.k = 520;
        lit.c = 46;
        lit.t = 0;
        setLive(false);
        at(0.09, () => {
          press.k = 300;
          press.c = 13;
          press.t = held ? 1 : 0;
        });
        at(0.12, () => {
          ink.t = 0;
          ink.rate = 1 / 0.38;
          fill.t = 0;
          fill.rate = 1 / 0.45;
          under.t = 0;
        });
        at(0.7, () => {
          lit.k = 150;
          lit.c = 13;
        });
      }
    };
    const toggle = () => {
      const next = !isLive;
      if (reduce) {
        isLive = next;
        setLive(next);
        settle(next);
        return;
      }
      press.k = 620;
      press.c = 30;
      press.t = 1;
      cues = [];
      at(0.11, () => strike(next));
    };
    const quiet = () => {
      demo = false;
      idleAt = Infinity;
      wake = clock + 14;
    };
    api.current = {
      toggle: () => {
        quiet();
        toggle();
        kick();
      },
      hold: (down) => {
        if (reduce) {
          if (!down) {
            isLive = !isLive;
            setLive(isLive);
            settle(isLive);
            kick();
          }
          return;
        }
        quiet();
        held = down;
        if (down) {
          press.k = 620;
          press.c = 30;
          press.t = 1;
        } else strike(!isLive);
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
    let scale = Math.min(MAX_SCALE, Math.max(1, window.devicePixelRatio || 1));
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
      // never more than about 1.9 million pixels through the ray marcher
      const s = Math.min(scale, Math.sqrt(1.9e6 / (cssW * cssH)));
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

    let hitKey = "";
    const draw = () => {
      const wide = cssW / cssH;
      // where things stand, and where the camera is
      const key = phone ? [0.25, 1.35] : [-0.1, 0.9];
      const model = phone ? [-0.1, -1.45] : [2.1, -1.15];
      const yaw = phone ? 0.1 : -0.34;
      const tgt = phone ? [0.05, 0.85, -0.1] : [0.2, 0.62, 0.1];
      const az = (phone ? 0.12 : -0.2) + cam.ax * 0.1 + Math.sin(time * 0.21) * 0.018;
      const el = (phone ? 0.5 : 0.4) - cam.ay * 0.05 + Math.sin(time * 0.29 + 1) * 0.007;
      const fov = phone ? 0.5 : 0.4;
      const dist = (phone ? 12.0 : 7.6 * Math.max(1, 1.6 / wide)) * (1 - 0.012 * push.x);
      const camPos = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] + dist * Math.cos(az) * Math.cos(el)];
      // the channel runs from the edge of the plinth to the edge of the model's base
      const dx = model[0] - key[0];
      const dz = model[1] - key[1];
      const len = Math.hypot(dx, dz);
      const ux = dx / len;
      const uz = dz / len;
      const seg = [key[0] + ux * 0.76, key[1] + uz * 0.76, model[0] - ux * 0.42, model[1] - uz * 0.42];
      const breathe = reduce ? 0 : 1;
      const rest = 1 - Math.min(1, pip.x);

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(scene);
      gl.uniform2f(su.uRes, bw, bh);
      gl.uniform3f(su.uCam, camPos[0], camPos[1], camPos[2]);
      gl.uniform3f(su.uTarget, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFov, fov);
      gl.uniform1f(su.uTime, time);
      gl.uniform4f(su.uPos, key[0], key[1], model[0], model[1]);
      gl.uniform1f(su.uYaw, yaw);
      gl.uniform1f(su.uPress, Math.max(-0.12, Math.min(1.06, press.x)));
      gl.uniform1f(su.uGlow, Math.max(0, glow.x) * (1 + (0.04 + 0.3 * rest) * Math.sin(time * 1.9) * breathe));
      gl.uniform1f(su.uInk, ink.x);
      gl.uniform1f(su.uLit, Math.max(0, lit.x) * (1 + 0.012 * Math.sin(time * 9.0) * breathe));
      gl.uniform4f(su.uSeg, seg[0], seg[1], seg[2], seg[3]);
      gl.uniform4f(su.uChan, pulse.x, pulse.on ? 1 : 0, fill.x * 1.04, Math.max(0, under.x));
      gl.uniform4f(su.uPip, rest, Math.max(0, pip.x), ring.r, ring.s);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, liveTex);
      gl.uniform1i(su.uLive, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, draftTex);
      gl.uniform1i(su.uDraft, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, marksTex);
      gl.uniform1i(su.uMarks, 2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(post);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fbTex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.uniform1i(pu.uSrc, 0);
      gl.uniform2f(pu.uRes, bw, bh);
      const f = [key[0] + 0.5 * ux - camPos[0], 0.7 - camPos[1], key[1] + 0.5 * uz - camPos[2]];
      gl.uniform1f(pu.uFocus, Math.hypot(f[0], f[1], f[2]));
      gl.uniform1f(pu.uTime, reduce ? 0 : time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // keep the pointer target over the key
      const hit = hitRef.current;
      if (hit) {
        const fw = [tgt[0] - camPos[0], tgt[1] - camPos[1], tgt[2] - camPos[2]];
        const fl = Math.hypot(fw[0], fw[1], fw[2]);
        fw[0] /= fl; fw[1] /= fl; fw[2] /= fl;
        const rg = [-fw[2], 0, fw[0]];
        const rl = Math.hypot(rg[0], rg[2]);
        rg[0] /= rl; rg[2] /= rl;
        const up = [rg[1] * fw[2] - rg[2] * fw[1], rg[2] * fw[0] - rg[0] * fw[2], rg[0] * fw[1] - rg[1] * fw[0]];
        const v = [key[0] - camPos[0], 0.55 - camPos[1], key[1] - camPos[2]];
        const depth = v[0] * fw[0] + v[1] * fw[1] + v[2] * fw[2];
        const k = cssH / (depth * 2 * Math.tan(fov / 2));
        const x = cssW / 2 + (v[0] * rg[0] + v[2] * rg[2]) * k;
        const y = cssH / 2 - (v[0] * up[0] + v[1] * up[1] + v[2] * up[2]) * k;
        const next = `${Math.round(x)}|${Math.round(y)}|${Math.round(1.5 * k)}`;
        if (next !== hitKey) {
          hitKey = next;
          hit.style.left = `${x}px`;
          hit.style.top = `${y}px`;
          hit.style.width = `${1.5 * k}px`;
          hit.style.height = `${1.15 * k}px`;
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
          toggle();
          idleAt = clock + (isLive ? HOLD_DRAFT : HOLD_LIVE + 1.4);
        }
        for (let n = 0; n < 4; n++) {
          const h = dt / 4;
          stepSpring(press, h);
          stepSpring(glow, h);
          stepSpring(lit, h);
          stepSpring(push, h);
          stepSpring(under, h);
          stepSpring(pip, h);
        }
        // the key lands on a rubber stop
        if (press.x > 1.04) {
          press.x = 1.04;
          press.v *= -0.3;
        }
        if (flicker.length) {
          let v = lit.x;
          for (const f of flicker) if (clock >= f.at) v = f.v;
          lit.x = v;
          lit.v = 0;
        }
        ink.x += Math.sign(ink.t - ink.x) * Math.min(Math.abs(ink.t - ink.x), dt * ink.rate);
        fill.x += Math.sign(fill.t - fill.x) * Math.min(Math.abs(fill.t - fill.x), dt * fill.rate);
        if (ring.s > 0.001) {
          ring.r += dt * (3.4 - ring.r * 0.9);
          ring.s *= Math.exp(-dt * 3.6);
        } else ring.s = 0;
        if (pulse.on) {
          pulse.x += dt / 0.5;
          if (pulse.x > 1.5) pulse.on = false;
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
    const photoKick = () => kick();
    photo.addEventListener("load", photoKick);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
      photo.removeEventListener("load", photoKick);
      photo.onload = null;
      api.current = null;
      [liveTex, draftTex, marksTex, fbTex].forEach((t) => gl.deleteTexture(t));
      gl.deleteFramebuffer(fbo);
      gl.deleteBuffer(quad);
      gl.deleteProgram(scene);
      gl.deleteProgram(post);
    };
  }, [reduce]);

  const press = () => {
    if (api.current) api.current.toggle();
    else setLive((v) => !v);
  };
  const state = live ? STATES.live : STATES.draft;
  const ease = [0.2, 0.9, 0.2, 1] as const;

  return (
    <section ref={rootRef} className="relative isolate h-[680px] w-full overflow-hidden md:h-[740px]" style={{ backgroundColor: INK, fontFamily: FONT }}>
      <style>{`
        @keyframes publish-key-lightbox-page-breathe { 0%, 100% { opacity: .7 } 50% { opacity: 1 } }
        .publish-key-lightbox-page-glow { animation: publish-key-lightbox-page-breathe 3.3s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .publish-key-lightbox-page-glow { animation: none } }
      `}</style>

      {/* The still: the same picture built from elements. Shown before the renderer starts and wherever it cannot run. */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`} style={{ background: "radial-gradient(80% 60% at 62% 60%, #1b1e26 0%, #0f1117 48%, #0B0D12 100%)" }}>
        {/* the model of the page */}
        <div className="absolute left-1/2 top-[29%] w-[250px] -translate-x-1/2 md:left-[72%] md:top-[15%] md:w-[400px]" style={{ perspective: "1400px" }}>
          <div className="relative rounded-[18px] p-[9px] transition-shadow duration-500" style={{ aspectRatio: "4 / 3.08", transform: "rotateY(-17deg) rotateX(7deg)", background: "linear-gradient(160deg, #5b5f68 0%, #2a2d34 30%, #17191e 100%)", boxShadow: live ? "0 0 0 1px rgba(255,255,255,0.08) inset, 0 50px 80px -30px rgba(0,0,0,0.9), 0 0 120px 10px rgba(226,234,255,0.22)" : "0 0 0 1px rgba(255,255,255,0.08) inset, 0 50px 80px -30px rgba(0,0,0,0.9)" }}>
            {live ? (
              <div className="relative h-full w-full overflow-hidden rounded-[10px]" style={{ backgroundColor: PAPER, boxShadow: "inset 0 0 30px rgba(255,255,255,0.9)" }}>
                <div className="absolute inset-x-[4%] top-[5%] flex h-[9%] items-center justify-between rounded-full px-[4%] text-white" style={{ backgroundColor: INK }}>
                  <span className="text-[10px] font-extrabold tracking-tight md:text-[11px]">{SITE.brand}</span>
                  <span className="flex gap-2.5 text-[8px] font-medium text-white/85 md:text-[9px]">
                    {SITE.nav.map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </span>
                </div>
                <h3 className="absolute left-[5%] top-[27%] w-[58%] text-[15px] font-extrabold leading-[0.95] tracking-[-0.05em] md:text-[23px]" style={{ color: INK }}>
                  {SITE.headline.map((l) => (
                    <span key={l} className="block whitespace-nowrap">
                      {l}
                    </span>
                  ))}
                </h3>
                <p className="absolute left-[5%] top-[50%] w-[52%] text-[6.5px] font-medium leading-snug text-slate-600 md:top-[54%] md:w-[50%] md:text-[9px]">{SITE.sub}</p>
                <div className="absolute right-[4%] top-[19%] h-[66%] w-[33%] overflow-hidden rounded-[8px]" style={{ backgroundColor: PHOTO.tone }}>
                  <img src={PHOTO.src} alt={PHOTO.alt} width={334} height={505} className="h-full w-full object-cover grayscale" />
                </div>
                <div className="absolute left-[5%] top-[73.5%] flex h-[10%] w-[28%] items-center justify-center rounded-full text-[6.5px] font-bold text-white md:text-[9px]" style={{ backgroundColor: BLUE }}>
                  {SITE.cta}
                </div>
                <div className="absolute inset-x-[5%] bottom-[4%] flex justify-between border-t border-slate-900/15 pt-[1.5%] text-[6px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <span>{SITE.foot}</span>
                  <span>{SITE.brand}</span>
                </div>
              </div>
            ) : (
              <div className="relative h-full w-full overflow-hidden rounded-[10px] bg-[#23262c]">
                <div className="absolute inset-x-[4%] top-[5%] h-[9%] rounded-full border border-dashed border-[#7c818b] bg-[#343841]" />
                <div className="absolute left-[5%] top-[29%] h-[8%] w-[50%] rounded bg-[#5b606a]" />
                <div className="absolute left-[5%] top-[40%] h-[8%] w-[39%] rounded bg-[#5b606a]" />
                <div className="absolute left-[5%] top-[56%] h-[2%] w-[46%] rounded bg-[#454a54]" />
                <div className="absolute left-[5%] top-[61%] h-[2%] w-[48%] rounded bg-[#454a54]" />
                <div className="absolute right-[4%] top-[19%] h-[66%] w-[33%] rounded-[8px] border border-dashed border-[#7c818b] bg-[#343841]" />
                <div className="absolute left-[5%] top-[73.5%] h-[10%] w-[28%] rounded-full border border-dashed border-[#7c818b] bg-[#343841]" />
                <div className="absolute inset-x-[5%] bottom-[4%] flex justify-between border-t border-[#7c818b]/60 pt-[1.5%] text-[6px] font-semibold uppercase tracking-[0.2em] text-[#7c818b]">
                  <span>Draft</span>
                  <span>Not published</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* the key on its plinth, seen from above the front edge */}
        <div className="absolute bottom-[15%] left-1/2 h-[150px] w-[200px] -translate-x-1/2 md:bottom-[13%] md:left-[49%] md:h-[230px] md:w-[300px]" style={{ perspective: "900px" }} aria-hidden="true">
          <div className="absolute inset-x-0 bottom-0 h-[34%] rounded-b-[14px]" style={{ background: "linear-gradient(180deg, #17191e 0%, #0b0c10 100%)", boxShadow: `0 16px 46px -2px rgba(79,152,251,${live ? 0.75 : 0.35}), 0 2px 0 0 rgba(79,152,251,${live ? 0.95 : 0.5})` }} />
          <div className="absolute inset-x-0 top-0 h-[76%] rounded-[26px]" style={{ transform: "rotateX(58deg)", transformOrigin: "50% 100%", background: "linear-gradient(180deg, #23262d 0%, #15171c 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)" }}>
            <div className="absolute inset-[14%] rounded-[30px]" style={{ background: "linear-gradient(100deg, #8d9299 0%, #e9ecef 30%, #a9aeb5 62%, #dfe2e6 100%)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.55), 0 6px 14px rgba(0,0,0,0.6)" }}>
              <div className="publish-key-lightbox-page-glow absolute inset-[12%] rounded-[22px]" style={{ backgroundColor: BLUE, boxShadow: `0 0 26px 6px rgba(79,152,251,${live ? 0.95 : 0.5}), inset 0 0 12px #fff` }} />
              <div className="absolute inset-[16.5%] flex items-center justify-center rounded-[18px] transition-transform duration-300" style={{ transform: live ? "translateY(-4px)" : "translateY(-12px)", background: "radial-gradient(90% 90% at 40% 30%, #f4f5f6 0%, #c3c7cc 55%, #8f949b 100%)", boxShadow: "0 12px 0 -1px #6d7279, 0 16px 16px rgba(0,0,0,0.55), inset 0 2px 0 rgba(255,255,255,0.9)" }}>
                <svg viewBox="0 0 24 24" className="h-[42%] w-[42%]" fill="none" stroke={BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 5px rgba(79,152,251,0.9))" }}>
                  <path d="M12 20V5M5.5 11 12 4.5 18.5 11" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} />

      {/* Pointer target laid over the key in the picture. The named button below does the same job for keyboards and screen readers. */}
      <div
        ref={hitRef}
        aria-hidden="true"
        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation select-none rounded-[32%] ${ready ? "" : "hidden"}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          api.current?.hold(true);
        }}
        onPointerUp={() => api.current?.hold(false)}
        onPointerCancel={() => api.current?.hold(false)}
      />

      <p className="pointer-events-none absolute left-5 top-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45 md:left-10 md:top-9 md:text-[11px]">
        One key <span className="mx-1.5 text-white/25">/</span> Draft to live
      </p>

      <div className="pointer-events-none absolute left-5 top-12 md:left-10 md:top-20 lg:bottom-12 lg:top-auto">
        <p className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50 md:text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full transition-colors duration-300" style={{ backgroundColor: live ? BLUE : "rgba(255,255,255,0.3)", boxShadow: live ? "0 0 10px 2px rgba(79,152,251,0.9)" : "none" }} />
          </span>
          {SITE.brand} <span className="text-white/25">/</span> Status
        </p>
        <div className="relative mt-1 h-[84px] w-[300px] overflow-hidden md:mt-2 md:h-[112px] md:w-[320px] lg:h-[150px] lg:w-[400px]">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.h2
              key={state.word}
              initial={reduce ? { opacity: 0 } : { y: "62%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { y: "-46%", opacity: 0 }}
              transition={reduce ? { duration: 0.01 } : { y: { type: "spring", stiffness: 240, damping: 21 }, opacity: { duration: 0.3, ease } }}
              className="absolute left-0 top-0 text-[84px] font-extrabold leading-[1] tracking-[-0.06em] text-white md:text-[112px] lg:text-[150px]"
            >
              {state.word}
            </motion.h2>
          </AnimatePresence>
        </div>
        <p className="mt-1 text-[14px] font-medium tracking-tight text-white/60 md:mt-3 md:text-[17px]">{state.line}</p>
      </div>

      <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-4 md:inset-x-auto md:bottom-12 md:right-10 md:flex-col md:items-end md:gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40 md:text-[11px]">Press the key</span>
        <button
          type="button"
          onClick={press}
          aria-pressed={live}
          aria-label={live ? "Published. Press to take the page back to draft" : "Draft. Press to publish the page"}
          className="flex h-12 items-center gap-2.5 rounded-full pl-5 pr-6 text-[15px] font-bold tracking-tight transition-[transform,background-color,color,box-shadow] duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12] active:scale-95 motion-reduce:transition-none"
          style={live ? { backgroundColor: "rgba(255,255,255,0.08)", color: "#fff", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.16)" } : { backgroundColor: BLUE, color: INK, boxShadow: "0 0 28px -2px rgba(79,152,251,0.8), inset 0 1px 0 rgba(255,255,255,0.4)" }}
        >
          <svg viewBox="0 0 20 20" className={`h-5 w-5 transition-transform duration-300 motion-reduce:transition-none ${live ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 16V4M5 9l5-5 5 5" />
          </svg>
          {state.action}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {SITE.brand} is {live ? "live" : "a draft"}. {state.line}
      </p>
    </section>
  );
}
