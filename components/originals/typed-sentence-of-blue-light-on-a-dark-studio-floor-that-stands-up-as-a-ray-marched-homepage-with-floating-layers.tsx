import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useReducedMotion } from "framer-motion";

/** The sentences the piece types by itself, and the page each one becomes. */
const DEMOS: { sentence: string; site: Site }[] = [
  {
    sentence: "A surf school in Ericeira with lessons at sunrise",
    site: { brand: "Saltline", nav: ["Lessons", "Coaches", "Visit"], headline: "First light,\nfirst wave.", sub: "Small group surf lessons on the reef at Ericeira, in the water before the town wakes.", cta: "Book a lesson", foot: "Ericeira, Portugal", photo: 0 },
  },
  {
    sentence: "A bakery in Leith that bakes sourdough overnight",
    site: { brand: "Night Oven", nav: ["Bread", "Mornings", "Find us"], headline: "Baked while\nyou sleep.", sub: "Slow sourdough shaped by hand in Leith and out of the oven as the street lights go off.", cta: "Reserve a loaf", foot: "Leith, Edinburgh", photo: 1 },
  },
  {
    sentence: "A flower studio in Ghent that stays open late on Fridays",
    site: { brand: "Nachtbloem", nav: ["Bunches", "Weddings", "Studio"], headline: "Flowers\nafter dark.", sub: "Seasonal stems tied to order in Ghent, with the door open late every Friday.", cta: "Order a bunch", foot: "Ghent, Belgium", photo: 2 },
  },
];

const PHOTOS = [
  { src: "https://images.pexels.com/photos/31814300/pexels-photo-31814300.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Silhouette of a surfer standing a board upright on the shore at sunrise", tone: "#6f7278" },
  { src: "https://images.pexels.com/photos/30895276/pexels-photo-30895276.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Scored round loaf of bread on a cloth beside a rolling pin and a proving bowl", tone: "#3a3b3e" },
  { src: "https://images.pexels.com/photos/19793720/pexels-photo-19793720.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Bunch of white tulips against a dark background", tone: "#2b2c30" },
];

type Site = { brand: string; nav: string[]; headline: string; sub: string; cta: string; foot: string; photo: number };

const BLUE = "#4F98FB";
const INK = "#0B0D12";
const PAPER = "#F6F4EF";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const MAX_CHARS = 84;
/** Seconds the finished page is held before the next demo sentence is typed. */
const HOLD = 5.2;
/** Lowest and highest render scale (canvas pixels per CSS pixel). The loop steps down when frames run slow. */
const MIN_SCALE = 0.6001;
const MAX_SCALE = 1.5001;
const LIE = -1.47; // page angle when it lies back on the floor, in radians

/** Turns any sentence a visitor types into the words for a page. Demo sentences use their written page. */
function compose(sentence: string): Site {
  const clean = sentence.trim().replace(/\s+/g, " ");
  const demo = DEMOS.find((d) => d.sentence.toLowerCase() === clean.toLowerCase());
  if (demo) return demo.site;
  const s = clean.toLowerCase();
  const body = clean.replace(/[.!?]+$/, "");
  const words = body.replace(/^(a|an|the|my|our)\s+/i, "").split(" ");
  const brand = words.slice(0, 2).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Your page";
  const booking = /(book|lesson|class|school|studio|salon|barber|clinic|dentist|yoga|tour|coach|trainer|hotel|guest)/.test(s);
  const selling = /(shop|store|sell|bakery|bake|cafe|coffee|restaurant|florist|flower|menu|pizza|food|bar|market)/.test(s);
  const photo = /(surf|beach|sea|ocean|wave|swim|sail)/.test(s) ? 0 : /(bak|bread|cafe|coffee|restaurant|food|pizza|kitchen)/.test(s) ? 1 : /(flor|flower|garden|plant|bloom|wedding)/.test(s) ? 2 : -1;
  return {
    brand,
    nav: selling ? ["Shop", "Story", "Find us"] : booking ? ["Book", "About", "Visit"] : ["Work", "About", "Contact"],
    headline: body ? body.charAt(0).toUpperCase() + body.slice(1) + "." : "Your sentence here.",
    sub: "Set from the sentence on the floor. Type another and press return.",
    cta: selling ? "Order now" : booking ? "Book a visit" : "Get in touch",
    foot: "Draft one",
    photo,
  };
}

/* ---------- canvas text, used as textures ---------- */

type Ctx = CanvasRenderingContext2D;
const setFont = (c: Ctx, weight: number, size: number, track = 0) => {
  c.font = `${weight} ${size}px ${FONT}`;
  (c as unknown as { letterSpacing: string }).letterSpacing = `${(track * size).toFixed(2)}px`;
};
function wrap(c: Ctx, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const next = line ? line + " " + word : word;
      if (line && c.measureText(next).width > maxW) {
        out.push(line);
        line = word;
      } else line = next;
    }
    out.push(line);
  }
  return out;
}
/** Largest size at which the text fits the box. */
function fit(c: Ctx, text: string, weight: number, track: number, maxW: number, maxH: number, lead: number, from: number, to: number) {
  let size = from;
  let lines: string[] = [text];
  for (; size >= to; size -= 4) {
    setFont(c, weight, size, track);
    lines = wrap(c, text, maxW);
    const widest = Math.max(...lines.map((l) => c.measureText(l).width));
    if (widest <= maxW && lines.length * size * lead <= maxH) break;
  }
  return { size: Math.max(size, to), lines };
}

/** The sheet itself: the small print that stays on the paper. 2048 x 1536. */
function drawPage(c: Ctx, site: Site) {
  c.fillStyle = PAPER;
  c.fillRect(0, 0, 2048, 1536);
  c.textBaseline = "alphabetic";
  c.fillStyle = "#3d4149";
  setFont(c, 500, 54, -0.015);
  wrap(c, site.sub, 960).slice(0, 3).forEach((l, i) => c.fillText(l, 123, 985 + i * 70));
  c.fillStyle = "rgba(11,13,18,0.14)";
  c.fillRect(123, 1426, 1802, 3);
  c.fillStyle = "#8d9097";
  setFont(c, 600, 25, 0.14);
  c.fillText(site.foot.toUpperCase(), 123, 1481);
  const right = site.brand.toUpperCase();
  c.fillText(right, 1925 - c.measureText(right).width, 1481);
}

/** One sheet holding the pieces that lift off the page: photograph, headline, menu and button label. 2048 x 2048. */
function drawParts(c: Ctx, site: Site, img: HTMLImageElement | null) {
  c.fillStyle = "#000";
  c.fillRect(0, 0, 2048, 2048);
  // photograph, 628 x 1024
  if (img && img.naturalWidth) {
    const s = Math.max(628 / img.naturalWidth, 1024 / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    c.drawImage(img, (628 - w) / 2, (1024 - h) / 2, w, h);
  } else {
    // no photograph for this sentence: a quiet study of a low sun over a dark plain
    const g = c.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0, "#3a3c42");
    g.addColorStop(0.6, "#b9bbc1");
    g.addColorStop(0.64, "#d8d9dd");
    g.addColorStop(0.645, "#2a2b30");
    g.addColorStop(1, "#0e0f12");
    c.fillStyle = g;
    c.fillRect(0, 0, 628, 1024);
    const r = c.createRadialGradient(330, 610, 6, 330, 610, 330);
    r.addColorStop(0, "rgba(255,255,255,1)");
    r.addColorStop(0.16, "rgba(255,255,255,0.92)");
    r.addColorStop(0.2, "rgba(255,255,255,0.3)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = r;
    c.fillRect(0, 0, 628, 660);
    const w = c.createLinearGradient(0, 660, 0, 1024);
    w.addColorStop(0, "rgba(255,255,255,0.5)");
    w.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = w;
    c.fillRect(290, 662, 80, 362);
  }
  c.fillStyle = "#000";
  c.fillRect(628, 0, 1420, 1024);
  c.fillRect(0, 1024, 2048, 1024);
  c.fillStyle = "#fff";
  c.textBaseline = "alphabetic";
  // headline, 1024 x 512 at (1024, 0)
  const head = fit(c, site.headline, 800, -0.045, 1000, 500, 0.93, 232, 60);
  setFont(c, 800, head.size, -0.045);
  head.lines.forEach((l, i) => c.fillText(l, 1032, head.size * 0.8 + 6 + i * head.size * 0.93));
  // menu bar label, 2048 x 144 at (0, 1100)
  setFont(c, 800, 62, -0.02);
  c.fillText(site.brand, 68, 1100 + 94);
  setFont(c, 500, 47, 0);
  let x = 2048 - 70;
  for (const item of [...site.nav].reverse()) {
    x -= c.measureText(item).width;
    c.fillText(item, x, 1100 + 89);
    x -= 76;
  }
  // button label, 1024 x 284 at (0, 1400)
  setFont(c, 700, 98, -0.02);
  const label = site.cta;
  const lw = c.measureText(label).width;
  const start = (1024 - lw - 124) / 2;
  c.fillText(label, start, 1400 + 177);
  c.lineWidth = 12;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.strokeStyle = "#fff";
  const ax = start + lw + 46;
  c.beginPath();
  c.moveTo(ax, 1542);
  c.lineTo(ax + 76, 1542);
  c.moveTo(ax + 46, 1512);
  c.lineTo(ax + 76, 1542);
  c.lineTo(ax + 46, 1572);
  c.stroke();
}

/** The sentence as it lies on the floor. Returns where the caret sits, in 0..1 of the canvas. */
function drawSentence(c: Ctx, text: string, w: number, h: number, maxLines: number) {
  c.fillStyle = "#000";
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#fff";
  c.textBaseline = "alphabetic";
  const pad = 64;
  const lead = 1.2;
  const base = Math.floor((h - pad * 2) / (maxLines * lead));
  const f = fit(c, text || " ", 600, -0.02, w - pad * 2, h - pad * 2 + 8, lead, base, 40);
  setFont(c, 600, f.size, -0.02);
  const top = (h - f.lines.length * f.size * lead) / 2;
  f.lines.forEach((l, i) => c.fillText(l, pad, top + f.size * 0.92 + i * f.size * lead));
  const last = f.lines[f.lines.length - 1] ?? "";
  const cx = pad + c.measureText(last).width + f.size * 0.1;
  const cy = top + (f.lines.length - 0.5) * f.size * lead;
  return [cx / w, cy / h, (f.size * 0.52) / h, (f.size * 0.035) / w] as const;
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
uniform float uFov, uTilt, uGlow, uInk, uText, uTime;
uniform vec4 uEx;      // how far the menu, headline, photograph and button float off the sheet (0..1)
uniform vec3 uHinge;   // x, z of the bottom edge and the turn of the sheet
uniform vec4 uSent;    // floor rectangle that holds the sentence: centre x, centre z, half width, half depth
uniform vec4 uCaret;   // u, v, half height, strength
uniform vec2 uPulse;   // position along the sentence, strength
uniform float uCaretA, uSentR, uBeam;
uniform sampler2D uPage, uParts, uSentTex;

const float W = 2.6, H = 1.95, T = 0.07;
const vec3 BLUE = vec3(0.078, 0.314, 0.965);
const vec3 PAPER = vec3(0.905, 0.89, 0.85);
const vec3 KEY = vec3(-0.352, 0.553, 0.755);
const vec3 KEYC = vec3(1.02, 1.0, 0.96);

vec3 gPill, gSentL; float gZH, gPix, gDist;
float lodOf(float texels){ return clamp(log2(gDist * gPix * texels), 0.0, 7.0); }

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
vec3 toPage(vec3 p){ p.xz -= uHinge.xy; p.y -= 0.032; p.xz = rot(uHinge.z) * p.xz; p.yz = rot(uTilt) * p.yz; return p; }
vec3 dirPage(vec3 d){ d.xz = rot(uHinge.z) * d.xz; d.yz = rot(uTilt) * d.yz; return d; }
vec3 dirWorld(vec3 d){ d.yz = rot(-uTilt) * d.yz; d.xz = rot(-uHinge.z) * d.xz; return d; }
vec3 fromPage(vec3 q){ q.yz = rot(-uTilt) * q.yz; q.xz = rot(-uHinge.z) * q.xz; q.y += 0.032; q.xz += uHinge.xy; return q; }

float slab(vec3 q, vec2 c, vec2 h, float r, float z0, float th, float bev){
  vec2 d2 = abs(q.xy - c) - h + r;
  float d = length(max(d2, 0.0)) + min(max(d2.x, d2.y), 0.0) - r;
  vec2 w = vec2(d, abs(q.z - z0) - th) + bev;
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - bev;
}

vec2 map(vec3 p){
  float fl = p.y, wall = p.z + 6.0;
  float k = 1.6, hh = clamp(0.5 + 0.5 * (wall - fl) / k, 0.0, 1.0);
  float room = mix(wall, fl, hh) - k * hh * (1.0 - hh);
  vec3 q = toPage(p);
  float bound = length(q - vec3(0.0, H * 0.5, 0.2)) - 1.85;
  if (bound > 0.4) return vec2(min(room, bound), 1.0);
  vec2 r = vec2(room, 1.0);
  float d = slab(q, vec2(0.0, H * 0.5), vec2(W * 0.5, H * 0.5), 0.07, 0.0, T * 0.5, 0.006);
  if (d < r.x) r = vec2(d, 2.0);
  d = slab(q, vec2(0.0, 1.770), vec2(1.196, 0.083), 0.083, T * 0.5 + 0.024 + uEx.x * 0.17, 0.024, 0.016);
  if (d < r.x) r = vec2(d, 3.0);
  d = slab(q, vec2(0.753, 0.858), vec2(0.43, 0.702), 0.05, T * 0.5 + 0.02 + uEx.z * 0.42, 0.02, 0.007);
  if (d < r.x) r = vec2(d, 4.0);
  d = slab(q, vec2(-0.784, 0.37), vec2(0.36, 0.1), 0.1, T * 0.5 + 0.04 + uEx.w * 0.46, 0.04, 0.034);
  if (d < r.x) r = vec2(d, 5.0);
  return r;
}

vec3 normal(vec3 p){
  vec2 e = vec2(1.0, -1.0) * 0.0012;
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}

float vis(float vt){ return smoothstep(0.0, 0.015, uInk * 1.05 - vt); }

float headA(vec2 xy, float lod){
  vec2 uv = vec2((xy.x + 1.144) / 1.404, 1.0 - (xy.y - 0.819) / 0.702);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
  vec2 a = vec2(1024.0 + uv.x * 1024.0, uv.y * 512.0) / 2048.0;
  return textureLod(uParts, a, lod).r * vis(1.0 - xy.y / H);
}

float shadow(vec3 ro, vec3 rd){
  float res = 1.0, t = 0.02;
  for (int i = 0; i < 28; i++){
    float h = map(ro + rd * t).x;
    res = min(res, 7.0 * h / t);
    t += clamp(h, 0.012, 0.32);
    if (res < 0.004 || t > 5.5) break;
  }
  res = clamp(res, 0.0, 1.0);
  res = res * res * (3.0 - 2.0 * res);
  if (uEx.y > 0.01){
    vec3 q = toPage(ro), d = dirPage(rd);
    float tt = (gZH - q.z) / d.z;
    if (tt > 0.002) res *= 1.0 - 0.62 * headA(q.xy + d.xy * tt, 3.5 + tt * 7.0);
  }
  return res;
}

float occ(vec3 p, vec3 n){
  float o = 0.0, s = 1.0;
  for (int i = 0; i < 5; i++){
    float h = 0.012 + 0.11 * float(i) / 4.0;
    o += (h - map(p + n * h).x) * s;
    s *= 0.8;
  }
  return clamp(1.0 - 3.6 * o, 0.0, 1.0);
}

// The studio the glossy pieces mirror: one large overhead softbox and a strip to the side.
vec3 env(vec3 d){
  vec3 c = vec3(0.010, 0.011, 0.014) + vec3(0.02, 0.022, 0.027) * smoothstep(-0.2, 0.9, d.y);
  if (d.y > 0.02){
    vec2 h = d.xz * (6.0 / d.y) - vec2(-2.4, 2.2);
    vec2 b = 1.0 - smoothstep(vec2(2.5, 1.5), vec2(3.4, 2.3), abs(h));
    c += vec3(3.2, 3.15, 3.05) * b.x * b.y;
  }
  if (d.x < -0.02){
    vec2 h = d.yz * (-7.5 / d.x) - vec2(2.6, 2.0);
    vec2 b = 1.0 - smoothstep(vec2(1.7, 0.45), vec2(2.2, 0.75), abs(h));
    c += vec3(1.5, 1.5, 1.55) * b.x * b.y;
  }
  return c;
}

vec3 lit(vec3 p, vec3 n, float m, vec3 rd, bool hq){
  vec3 q = toPage(p), nq = dirPage(n);
  float vt = 1.0 - q.y / H, iv = vis(vt);
  vec3 alb = PAPER, em = vec3(0.0);
  float gl = 0.05, f0 = 0.04, rough = 40.0;
  bool front = nq.z > 0.6;
  float spot = 1.0;
  if (m < 1.5){
    alb = vec3(0.05, 0.052, 0.058); gl = 0.0;
    vec2 c = p.xz - uHinge.xy - vec2(-0.2, 0.5);
    spot = 1.0 / (1.0 + dot(c, c) * 0.11);
    spot *= spot;
    // a low wash of light on the curved back wall
    vec2 wd = vec2(p.x - uHinge.x - 0.5, p.y - 0.9);
    em = vec3(0.04, 0.045, 0.06) * (1.0 - smoothstep(-5.0, -2.5, p.z)) * exp(-(wd.x * wd.x / 11.0 + wd.y * wd.y / 2.2));
  } else if (m < 2.5){
    if (front){
      vec3 tx = pow(textureLod(uPage, vec2(q.x / W + 0.5, vt), lodOf(788.0)).rgb, vec3(2.2));
      alb = mix(PAPER, tx, iv);
    }
    spot = 1.0 - 0.3 * length(q.xy - vec2(-1.0, 1.7)) / 2.6;
    alb *= 0.955 + 0.03 * fract(sin(dot(floor(q.xy * 900.0), vec2(12.9898, 78.233))) * 43758.5453) + 0.015 * sin(q.x * 310.0 + sin(q.y * 170.0) * 2.0) * sin(q.y * 280.0 + sin(q.x * 130.0) * 2.0);
    gl = 0.16; rough = 18.0;
  } else if (m < 3.5){
    vec3 c = vec3(0.007, 0.008, 0.012);
    if (front){
      vec2 uv = vec2((q.x + 1.196) / 2.392, 1.0 - (q.y - 1.687) / 0.166);
      c = mix(c, vec3(0.93), textureLod(uParts, vec2(uv.x * 2048.0, 1100.0 + uv.y * 144.0) / 2048.0, lodOf(856.0)).r);
    }
    alb = mix(PAPER, c, iv); gl = mix(0.05, 0.75, iv); rough = 220.0;
  } else if (m < 4.5){
    vec3 c = PAPER;
    if (front){
      vec2 uv = vec2((q.x - 0.323) / 0.86, 1.0 - (q.y - 0.156) / 1.404);
      vec3 tx = pow(textureLod(uParts, vec2(uv.x * 628.0, uv.y * 1024.0) / 2048.0, lodOf(730.0)).rgb, vec3(2.2));
      float l = dot(tx, vec3(0.2126, 0.7152, 0.0722));
      l = l * l * (3.0 - 2.0 * l) * 0.35 + l * 0.65;
      c = vec3(l) * vec3(0.96, 0.985, 1.03) * 0.92 + 0.004;
    }
    alb = mix(PAPER, c, iv); gl = mix(0.05, 0.42, iv); rough = 160.0;
  } else {
    float lab = 0.0;
    if (front){
      vec2 uv = vec2((q.x + 1.144) / 0.72, 1.0 - (q.y - 0.27) / 0.2);
      lab = textureLod(uParts, vec2(uv.x * 1024.0, 1400.0 + uv.y * 284.0) / 2048.0, lodOf(1422.0)).r;
    }
    float core = 0.72 + 0.28 * max(dot(n, -rd), 0.0);
    alb = mix(PAPER, mix(BLUE * 0.22, vec3(0.9), lab), iv);
    em = iv * (BLUE * (0.03 + 1.55 * uGlow) * core + lab * vec3(0.95, 0.97, 1.0) * (0.2 + 1.4 * uGlow));
    gl = mix(0.05, 0.85, iv); rough = 260.0;
  }
  if (m > 1.5 && front && uInk > 0.002 && uInk < 0.998){
    float d = uInk * 1.05 - vt;
    em += (BLUE * 5.0 + 1.2) * exp(-abs(d) * 110.0) + BLUE * 0.9 * exp(-max(d, 0.0) * 9.0) * step(0.0, d);
  }
  float sh = 1.0, ao = 1.0;
  if (hq){ sh = shadow(p + n * 0.004, KEY); ao = occ(p, n); }
  float ndl = max(dot(n, KEY), 0.0);
  vec3 col = alb * (KEYC * ndl * sh * spot + vec3(0.085, 0.092, 0.11) * ao * (0.55 + 0.45 * n.y) * (0.35 + 0.65 * spot));
  vec3 lb = gPill - p; float d2 = dot(lb, lb);
  float nb = max(dot(n, lb * inversesqrt(d2)), 0.0) * 0.8 + 0.2;
  if (m < 4.5) col += alb * BLUE * uGlow * 0.62 * nb / (0.22 + d2 * 3.0) * (0.4 + 0.6 * ao);
  vec3 ls = gSentL - p; d2 = dot(ls, ls);
  col += alb * BLUE * uText * 0.55 * max(dot(n, ls * inversesqrt(d2)), 0.0) / (0.5 + d2);
  vec3 r = reflect(rd, n);
  float fr = f0 + (1.0 - f0) * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
  col += env(r) * fr * gl * (0.3 + 0.7 * ao);
  col += KEYC * pow(max(dot(n, normalize(KEY - rd)), 0.0), rough) * gl * sh * 0.5;
  col += alb * vec3(0.5, 0.52, 0.56) * max(dot(n, vec3(0.83, 0.28, -0.48)), 0.0);
  return col + em;
}

// The headline is a sheet of cut letters floating in front of the page.
void letters(vec3 ro, vec3 rd, float tmax, inout vec3 col){
  vec3 q = toPage(ro), d = dirPage(rd);
  if (abs(d.z) < 0.0001) return;
  float depth = 0.0085 * min(1.0, uEx.y * 6.0);
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 7; i++){
    float tt = (gZH - float(i) * depth - q.z) / d.z;
    if (tt < 0.0 || tt > tmax + 0.004) continue;
    vec2 xy = q.xy + d.xy * tt;
    float a = headA(xy, clamp(log2(tt * gPix * 730.0), 0.0, 6.0));
    if (a < 0.003) continue;
    vec3 c = vec3(0.008, 0.009, 0.013);
    if (i == 0) c += env(reflect(rd, dirWorld(vec3(0.0, 0.0, 1.0)))) * 0.02;
    else c = vec3(0.075, 0.08, 0.092) * (1.0 - 0.1 * float(i));
    vec3 pw = ro + rd * tt;
    vec3 lb = gPill - pw;
    c += BLUE * uGlow * 0.05 / (0.15 + dot(lb, lb) * 2.0);
    acc.rgb += (1.0 - acc.a) * a * c;
    acc.a += (1.0 - acc.a) * a;
    if (depth < 0.0005) break;
  }
  col = mix(col, acc.rgb / max(acc.a, 0.001), acc.a);
}

// The sentence: letters of lit glass standing a few millimetres off the floor, and their image in it.
void sentence(vec3 ro, vec3 rd, float tmax, float onFloor, inout vec3 col){
  if (rd.y > -0.001) return;
  float hT = 0.02;
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 12; i++){
    float fi = float(i);
    float y = i < 6 ? hT * (1.0 - fi / 5.0) : -hT * (fi - 6.0) / 5.0;
    float tt = (y - ro.y) / rd.y;
    vec3 p = ro + rd * tt;
    vec2 su = (rot(uSentR) * (p.xz - uSent.xy)) / (uSent.zw * 2.0) + 0.5;
    float inside = step(0.0, su.x) * step(su.x, 1.0) * step(0.0, su.y) * step(su.y, 1.0);
    float a = textureLod(uSentTex, su, clamp(log2(tt * gPix * 520.0), 0.0, 5.0)).r * inside;
    a *= i < 6 ? step(tt, tmax + 0.02) : onFloor * 0.2;
    float wave = uPulse.y * exp(-pow((su.x - uPulse.x) * 5.0, 2.0));
    vec3 c = i == 0 ? mix(BLUE, vec3(1.0), 0.86) * (2.6 + 6.0 * wave) : BLUE * (2.3 - 0.3 * min(fi, 5.0)) * (1.0 + 3.0 * wave) + vec3(0.25) * exp(-fi * 1.3);
    if (i >= 6) c = BLUE * (1.3 - 0.18 * (fi - 6.0));
    a *= uText;
    acc.rgb += (1.0 - acc.a) * a * c;
    acc.a += (1.0 - acc.a) * a;
  }
  col = mix(col, acc.rgb / max(acc.a, 0.001), acc.a);
}

// The blade of light that leaves the sentence and writes the page.
void beam(vec3 ro, vec3 rd, float tmax, inout vec3 col){
  if (uBeam < 0.01 || uInk < 0.002 || uInk > 0.998) return;
  vec3 S = vec3(uSent.x, 0.05, uSent.y);
  vec3 Lc = fromPage(vec3(0.0, H * (1.0 - uInk * 1.05), T * 0.5 + 0.02));
  vec3 X = dirWorld(vec3(1.0, 0.0, 0.0));
  vec3 A = Lc - S;
  vec3 N = normalize(cross(X, A));
  float dn = dot(rd, N);
  if (abs(dn) < 0.0005) return;
  float tt = dot(Lc - ro, N) / dn;
  if (tt < 0.0 || tt > tmax) return;
  vec3 v = ro + rd * tt - S;
  vec3 Ap = A - X * dot(A, X);
  float sA = dot(v, Ap) / dot(A, Ap), lat = (dot(v, X) - sA * dot(A, X)) / (W * 0.5);
  float w = max(sA, 0.02);
  float m = smoothstep(0.0, 0.06, sA) * (1.0 - smoothstep(0.985, 1.0, sA)) * (1.0 - smoothstep(0.9, 1.0, abs(lat) / w));
  float rays = 0.55 + 0.45 * sin(lat / w * 23.0 + sin(lat / w * 7.0) * 2.0);
  col += (BLUE * 1.1 + 0.12) * m * uBeam * rays * (0.14 + 0.5 * sA * sA);
}

vec2 march(vec3 ro, vec3 rd, int steps, float far){
  float t = 0.0; vec2 h = vec2(0.0);
  for (int i = 0; i < 96; i++){
    if (i >= steps) break;
    h = map(ro + rd * t);
    if (h.x < 0.0007 * (1.0 + t) || t > far) break;
    t += h.x;
  }
  return vec2(t, t > far ? 0.0 : h.y);
}

vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 f = normalize(uTarget - uCam), rgt = normalize(cross(f, vec3(0.0, 1.0, 0.0))), up = cross(rgt, f);
  vec3 rd = normalize(f + (uv.x * rgt + uv.y * up) * 2.0 * tan(uFov * 0.5));
  vec3 ro = uCam;
  gZH = T * 0.5 + 0.004 + uEx.y * 0.22;
  gPix = 2.0 * tan(uFov * 0.5) / uRes.y;
  gPill = fromPage(vec3(-0.784, 0.37, T * 0.5 + 0.08 + uEx.w * 0.46));
  gSentL = vec3(uSent.x, 0.12, uSent.y);

  vec2 hit = march(ro, rd, 96, 30.0);
  float t = hit.x;
  vec3 col = vec3(0.0);
  if (hit.y > 0.5){
    vec3 p = ro + rd * t, n = normal(p);
    gDist = t;
    col = lit(p, n, hit.y, rd, true);
    if (hit.y < 1.5){
      // the floor: sentence of light, then what it mirrors
      float flat_ = smoothstep(0.9, 0.99, n.y);
      vec2 su = (rot(uSentR) * (p.xz - uSent.xy)) / (uSent.zw * 2.0) + 0.5;
      float inside = step(0.0, su.x) * step(su.x, 1.0) * step(0.0, su.y) * step(su.y, 1.0);
      float a = texture(uSentTex, su).r * inside;
      float g1 = textureLod(uSentTex, su, 2.6).r, g2 = textureLod(uSentTex, su, 5.4).r;
      float wave = uPulse.y * exp(-pow((su.x - uPulse.x) * 5.0, 2.0));
      vec2 cd = (su - uCaret.xy) / vec2(max(uCaret.w, 0.0005), uCaret.z);
      float caret = uCaret.w > 0.0 ? (1.0 - smoothstep(0.6, 1.0, abs(cd.x))) * (1.0 - smoothstep(0.9, 1.0, abs(cd.y))) * inside * uCaretA : 0.0;
      vec3 e = (g1 * 0.5 + g2 * 0.7) * BLUE * (1.0 + 3.0 * wave) * uText + a * 0.0;
      e += caret * mix(BLUE, vec3(1.0), 0.5) * 3.0;
      col += e * flat_;
      vec3 lb = gPill - p;
      col += BLUE * uGlow * 0.035 / (0.35 + dot(lb, lb)) * flat_;
      vec3 rr = reflect(rd, n);
      float fr = 0.07 + 0.93 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
      vec3 rp = p + n * 0.004;
      vec2 rh = march(rp, rr, 56, 14.0);
      vec3 rc = vec3(0.012, 0.013, 0.017);
      if (rh.y > 0.5){
        vec3 hp = rp + rr * rh.x;
        gDist = t + rh.x;
        rc = lit(hp, normal(hp), rh.y, rr, false);
      }
      letters(rp, rr, rh.x, rc);
      float fn = 0.5 + 0.5 * sin(p.x * 3.1 + sin(p.z * 2.3) * 1.7) * sin(p.z * 2.7 + sin(p.x * 1.9) * 1.3);
      float clear = 1.0 - smoothstep(0.0, 0.25, textureLod(uSentTex, su, 7.0).r) * step(-0.3, su.x) * step(su.x, 1.3) * step(-0.5, su.y) * step(su.y, 1.5);
      col += rc * fr * exp(-rh.x * 1.5) * (0.86 + 0.14 * fn) * clear;
    }
  }
  sentence(ro, rd, t, hit.y > 0.5 && hit.y < 1.5 ? 1.0 : 0.0, col);
  letters(ro, rd, t, col);
  beam(ro, rd, t, col);
  // light in the air around the button
  float tc = clamp(dot(gPill - ro, rd), 0.0, t);
  float dm = length(ro + rd * tc - gPill);
  col += BLUE * uGlow * 0.006 / (0.06 + dm * dm * 3.0);
  float mx = max(col.r, max(col.g, col.b));
  col = mix(col * (aces(vec3(mx)).r / max(mx, 0.0001)), aces(col), 0.25);
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
  float coc = clamp(abs(z - uFocus) / max(z, 0.1) * (z < uFocus ? 5.0 : 36.0) - 0.7, 0.0, 7.0) * px;
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
  vec3 bl = textureLod(uSrc, vUv, 3.5).rgb * 0.4 + textureLod(uSrc, vUv, 5.0).rgb * 0.35 + textureLod(uSrc, vUv, 6.5).rgb * 0.25;
  col += bl * bl * 0.05;
  vec2 v = vUv - 0.5;
  col *= 1.0 - dot(v, v) * 0.75;
  float g = hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;
  col += g * 0.028 * (1.0 - 0.5 * col);
  o = vec4(col, 1.0);
}`;

/* ---------- small motion helpers ---------- */

type Spring = { x: number; v: number; t: number; k: number; c: number };
const spring = (x: number, k: number, c: number): Spring => ({ x, v: 0, t: x, k, c });
const stepSpring = (s: Spring, dt: number) => {
  s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt;
  s.x += s.v * dt;
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

export default function SentenceOfLightStandingPage() {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(DEMOS[0].sentence);
  const [site, setSite] = useState<Site>(DEMOS[0].site);
  const [live, setLive] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // The render loop owns the scene. React talks to it through this handle.
  const api = useRef<{ type: (text: string) => void; build: (text: string) => void; focus: (on: boolean) => void } | null>(null);

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
    const su = Object.fromEntries(["uRes", "uCam", "uTarget", "uFov", "uTilt", "uGlow", "uInk", "uText", "uTime", "uEx", "uHinge", "uSent", "uCaret", "uPulse", "uCaretA", "uSentR", "uBeam", "uPage", "uParts", "uSentTex"].map((n) => [n, U(scene, n)]));
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
    const [pageCv, pageCx] = mk(2048, 1536);
    const [partsCv, partsCx] = mk(2048, 2048);
    const [sentCv, sentCx] = mk(2048, 512);
    const pageTex = makeTex();
    const partsTex = makeTex();
    const sentTex = makeTex();

    // photographs, loaded so that they may be used as textures
    let photoOk = true;
    const imgs = PHOTOS.map((p) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.decoding = "async";
      im.onload = () => {
        if (cur.photo >= 0 && imgs[cur.photo] === im) paintSite(cur);
        dirty = true;
      };
      im.src = p.src;
      return im;
    });

    let cur: Site = DEMOS[0].site;
    const paintSite = (s: Site) => {
      cur = s;
      drawPage(pageCx, s);
      upload(pageTex, pageCv);
      const im = photoOk && s.photo >= 0 && imgs[s.photo] && imgs[s.photo].complete && imgs[s.photo].naturalWidth ? imgs[s.photo] : null;
      drawParts(partsCx, s, im);
      try {
        upload(partsTex, partsCv);
      } catch {
        // a photograph that may not be read back: draw the plain light study instead
        photoOk = false;
        const [c2, x2] = mk(2048, 2048);
        drawParts(x2, s, null);
        upload(partsTex, c2);
      }
    };

    // layout: wide stage or phone
    let cssW = 0;
    let cssH = 0;
    let phone = false;
    let caret = [0, 0, 0, 0] as readonly number[];
    let shown = DEMOS[0].sentence;
    const paintSentence = () => {
      const w = phone ? 1536 : 2048;
      const h = phone ? 768 : 512;
      if (sentCv.width !== w) {
        sentCv.width = w;
        sentCv.height = h;
      }
      caret = drawSentence(sentCx, shown, w, h, phone ? 3 : 2);
      upload(sentTex, sentCv);
    };

    // the moving parts
    const tilt = spring(0, 34, 6.2);
    const ex = [spring(1, 130, 11), spring(1, 120, 10.5), spring(1, 100, 9.5), spring(1, 110, 9)];
    const glow = spring(1, 260, 24);
    const ink = { x: 1, t: 1, rate: 1 };
    const pulse = { x: 2, on: false };
    const text = spring(1, 60, 14);
    const cam = { ax: 0, ay: 0, tx: 0, ty: 0, push: spring(0, 30, 9) };
    let caretFlash = 0;
    let focused = false;
    let demo = !reduce;
    let demoIx = 0;
    let clock = 0;
    let idleAt = HOLD;
    let cues: { at: number; fn: () => void }[] = [];
    let target = shown; // what the typist is heading for
    let typeAt = 0;
    let afterType: (() => void) | null = null;
    let dirty = true;
    const at = (delay: number, fn: () => void) => {
      cues.push({ at: clock + delay, fn });
      cues.sort((a, b) => a.at - b.at);
    };

    const rise = (s: Site) => {
      paintSite(s);
      setSite(s);
      ink.x = 0;
      ink.t = 0;
      pulse.x = -0.25;
      pulse.on = true;
      at(0.3, () => {
        tilt.t = 0;
        cam.push.t = 1;
      });
      at(1.0, () => {
        ink.t = 1;
        ink.rate = 1.15;
      });
      at(1.85, () => (ex[0].t = 1));
      at(1.97, () => (ex[1].t = 1));
      at(2.1, () => (ex[2].t = 1));
      at(2.26, () => (ex[3].t = 1));
      at(2.62, () => (glow.t = 0.75));
      at(2.7, () => (glow.t = 0.1));
      at(2.8, () => {
        glow.t = 1;
        cam.push.t = 0;
      });
      at(2.9, () => (idleAt = clock + HOLD));
    };
    const fold = (then: () => void) => {
      cues = [];
      idleAt = Infinity;
      glow.t = 0;
      at(0.06, () => (ex[3].t = 0));
      at(0.13, () => (ex[2].t = 0));
      at(0.2, () => (ex[1].t = 0));
      at(0.26, () => (ex[0].t = 0));
      at(0.3, () => {
        ink.t = 0;
        ink.rate = 2.6;
      });
      at(0.55, () => (tilt.t = LIE));
      at(1.05, then);
    };
    const nextDemo = () => {
      demoIx = (demoIx + 1) % DEMOS.length;
      const d = DEMOS[demoIx];
      fold(() => {
        target = d.sentence;
        afterType = () => at(0.35, () => rise(d.site));
      });
    };
    const settle = () => {
      // bring the page back to its finished state at once (used with reduced motion)
      cues = [];
      tilt.x = tilt.t = 0;
      tilt.v = 0;
      ex.forEach((e) => ((e.x = e.t = 1), (e.v = 0)));
      glow.x = glow.t = 1;
      ink.x = ink.t = 1;
      pulse.on = false;
      dirty = true;
    };

    api.current = {
      type: (t) => {
        shown = target = t;
        afterType = null;
        caretFlash = 1;
        paintSentence();
        dirty = true;
      },
      build: (t) => {
        demo = false;
        shown = target = t;
        afterType = null;
        paintSentence();
        const s = compose(t);
        if (reduce) {
          paintSite(s);
          setSite(s);
          settle();
          return;
        }
        fold(() => rise(s));
        at(1.05 + 2.9 + 16, () => {
          if (!focused) demo = true;
        });
      },
      focus: (on) => {
        focused = on;
        dirty = true;
        if (on && demo) {
          demo = false;
          const typing = target !== shown || afterType;
          target = shown;
          afterType = null;
          if (typing || tilt.t !== 0) {
            cues = [];
            rise(compose(shown));
          } else idleAt = Infinity;
        }
        if (!on && !demo) at(18, () => {
          if (!focused) {
            demo = true;
            idleAt = clock + 1;
          }
        });
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
    let bw = 0;
    let bh = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      cssW = Math.max(1, r.width);
      cssH = Math.max(1, r.height);
      const wasPhone = phone;
      phone = cssW / cssH < 0.95;
      // never more than about 1.5 million pixels through the ray marcher
      const s = Math.min(scale, Math.sqrt(1.5e6 / (cssW * cssH)));
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
      if (wasPhone !== phone || !caret[2]) paintSentence();
      dirty = true;
    };

    paintSite(cur);
    resize();
    paintSentence();

    let time = 0;
    const draw = () => {
      const wide = cssW / cssH;
      // camera
      const az = (phone ? -0.2 : -0.32) + cam.ax * 0.16 + Math.sin(time * 0.23) * 0.022;
      const el = (phone ? 0.3 : 0.335) - cam.ay * 0.07 + Math.sin(time * 0.31 + 1) * 0.008;
      const dist = (phone ? 12.0 : 8.0 * Math.max(1, 1.62 / wide)) * (1 - 0.035 * cam.push.x);
      const tgt = phone ? [0, 0.42, 0.6] : [0.42, 0.7, 0.4];
      const camPos = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] + dist * Math.cos(az) * Math.cos(el)];
      const hinge = phone ? [0, 0, 0] : [1.0, 0, 0];
      const sent = phone ? [0, 1.75, 1.42, 0.95] : [-0.3, 1.12, 1.62, 0.52];
      const breathe = reduce ? 0 : 1;

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(scene);
      gl.uniform2f(su.uRes, bw, bh);
      gl.uniform3f(su.uCam, camPos[0], camPos[1], camPos[2]);
      gl.uniform3f(su.uTarget, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFov, phone ? 0.5 : 0.4);
      gl.uniform1f(su.uTilt, tilt.x);
      gl.uniform1f(su.uGlow, Math.max(0, glow.x) * (1 + 0.035 * Math.sin(time * 1.7) * breathe));
      gl.uniform1f(su.uInk, ink.x);
      gl.uniform1f(su.uText, text.x);
      gl.uniform1f(su.uTime, time);
      const b = (i: number) => Math.max(0, ex[i].x) * (1 + 0.05 * Math.sin(time * 0.7 + i * 1.7) * breathe);
      gl.uniform4f(su.uEx, b(0), b(1), b(2), b(3));
      gl.uniform3f(su.uHinge, hinge[0], hinge[2], hinge[1]);
      gl.uniform4f(su.uSent, sent[0], sent[1], sent[2], sent[3]);
      gl.uniform1f(su.uSentR, -az * 0.62);
      gl.uniform1f(su.uBeam, ink.t === 1 && tilt.t === 0 ? 1 : 0);
      const blink = focused || target !== shown ? (Math.sin(time * 6.5) > -0.2 ? 1 : 0.15) : 0;
      gl.uniform4f(su.uCaret, caret[0], caret[1], caret[2], blink > 0 ? caret[3] * (1 + caretFlash) : 0);
      gl.uniform1f(su.uCaretA, Math.min(1.6, blink + caretFlash));
      gl.uniform2f(su.uPulse, pulse.x, pulse.on ? 1 : 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pageTex);
      gl.uniform1i(su.uPage, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, partsTex);
      gl.uniform1i(su.uParts, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, sentTex);
      gl.uniform1i(su.uSentTex, 2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(post);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fbTex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.uniform1i(pu.uSrc, 0);
      gl.uniform2f(pu.uRes, bw, bh);
      const fx = camPos[0] - (hinge[0] - 0.75);
      const fy = camPos[1] - 0.9;
      const fz = camPos[2] - 0.25;
      gl.uniform1f(pu.uFocus, Math.sqrt(fx * fx + fy * fy + fz * fz));
      gl.uniform1f(pu.uTime, reduce ? 0 : time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
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
        if (demo && clock > idleAt) {
          idleAt = Infinity;
          nextDemo();
        }
        // the typist
        if (target !== shown && clock >= typeAt) {
          if (!target.startsWith(shown)) {
            shown = shown.slice(0, Math.max(0, shown.length - 3));
            typeAt = clock + 0.016;
          } else {
            shown = target.slice(0, shown.length + 1);
            typeAt = clock + 0.03 + Math.random() * 0.035 + (shown.endsWith(" ") ? 0.03 : 0);
            caretFlash = 1;
          }
          paintSentence();
          setValue(shown);
          if (target === shown && afterType) {
            const fn = afterType;
            afterType = null;
            fn();
          }
        }
        for (let n = 0; n < 4; n++) {
          const h = dt / 4;
          stepSpring(tilt, h);
          ex.forEach((e) => stepSpring(e, h));
          stepSpring(glow, h);
          stepSpring(text, h);
          stepSpring(cam.push, h);
        }
        // the sheet cannot swing through the floor
        if (tilt.x < LIE - 0.06) {
          tilt.x = LIE - 0.06;
          tilt.v *= -0.25;
        }
        ink.x += Math.sign(ink.t - ink.x) * Math.min(Math.abs(ink.t - ink.x), dt * ink.rate);
        if (pulse.on) {
          pulse.x += dt * 1.9;
          if (pulse.x > 1.5) pulse.on = false;
        }
        caretFlash *= Math.exp(-dt * 9);
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
        setLive(true);
      }
      if (onScreen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf && onScreen && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };
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
      setLive(false);
      cancelAnimationFrame(raf);
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
      imgs.forEach((im) => (im.onload = null));
      api.current = null;
      [pageTex, partsTex, sentTex, fbTex].forEach((t) => gl.deleteTexture(t));
      gl.deleteFramebuffer(fbo);
      gl.deleteBuffer(quad);
      gl.deleteProgram(scene);
      gl.deleteProgram(post);
    };
  }, [reduce]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = value.trim();
    if (!t) return;
    if (api.current) api.current.build(t);
    else setSite(compose(t));
  };

  const photo = site.photo >= 0 ? PHOTOS[site.photo] : null;
  const headLines = site.headline.split("\n");
  const longHead = site.headline.length > 28;

  return (
    <section ref={rootRef} className="relative isolate h-[660px] w-full overflow-hidden md:h-[740px]" style={{ backgroundColor: INK, fontFamily: FONT }}>
      <style>{`
        @keyframes sentence-of-light-standing-page-breathe { 0%, 100% { opacity: .82 } 50% { opacity: 1 } }
        .sentence-of-light-standing-page-glow { animation: sentence-of-light-standing-page-breathe 4.5s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .sentence-of-light-standing-page-glow { animation: none } }
      `}</style>

      {/* The still: the same picture built from elements. Shown before the renderer starts and wherever it cannot run. */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${live ? "opacity-0" : "opacity-100"}`} style={{ background: "radial-gradient(90% 60% at 58% 58%, #1a1d25 0%, #0e1016 46%, #0B0D12 100%)" }}>
        <div className="absolute inset-x-0 top-[62%] bottom-0" style={{ background: "linear-gradient(180deg, rgba(79,152,251,0.05) 0%, rgba(11,13,18,0) 60%)" }} aria-hidden="true" />
        <div className="absolute left-1/2 top-[45%] w-[min(86vw,560px)] -translate-x-1/2 -translate-y-1/2 md:left-[57%] md:top-[43%]" style={{ perspective: "1600px" }}>
          <div className="relative rounded-[14px]" style={{ aspectRatio: "4 / 3", backgroundColor: PAPER, transform: "rotateY(19deg) rotateX(3deg)", transformStyle: "preserve-3d", boxShadow: "-1px 0 0 #cfcbc2, -3px 1px 0 #b9b5ac, 0 60px 90px -30px rgba(0,0,0,0.9), 0 0 120px -20px rgba(79,152,251,0.28)" }}>
            <div className="absolute inset-x-[4%] top-[5%] flex h-[8.5%] items-center justify-between rounded-full px-[3%] text-white" style={{ backgroundColor: INK, transform: "translateZ(22px)", boxShadow: "0 14px 18px -8px rgba(11,13,18,0.5), inset 0 1px 0 rgba(255,255,255,0.14)" }}>
              <span className="text-[11px] font-extrabold tracking-tight md:text-[13px]">{site.brand}</span>
              <span className="flex gap-3 text-[9px] font-medium text-white/85 md:text-[11px]">
                {site.nav.map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </span>
            </div>
            <h2 className={`absolute left-[6%] top-[21%] w-[56%] font-extrabold leading-[0.93] tracking-[-0.045em] ${longHead ? "text-[22px] md:text-[30px]" : "text-[34px] md:text-[54px]"}`} style={{ color: INK, transform: "translateZ(38px)", textShadow: "10px 16px 14px rgba(11,13,18,0.16)" }}>
              {headLines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </h2>
            <p className="absolute left-[6%] top-[62%] w-[46%] text-[9px] font-medium leading-snug text-slate-600 md:text-[12px]">{site.sub}</p>
            <div className="absolute right-[4.5%] top-[20%] h-[72%] w-[33%] overflow-hidden rounded-[10px]" style={{ backgroundColor: photo ? photo.tone : "#7d8087", transform: "translateZ(56px)", boxShadow: "18px 30px 34px -12px rgba(11,13,18,0.5), inset 0 0 0 1px rgba(255,255,255,0.12)" }}>
              {photo ? <img src={photo.src} alt={photo.alt} width={628} height={1024} className="h-full w-full object-cover grayscale" /> : <div className="h-full w-full" style={{ background: "radial-gradient(60% 40% at 64% 32%, #fff 0%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0) 100%), linear-gradient(160deg, #d9dade 0%, #7d8087 55%, #1d1e22 100%)" }} />}
            </div>
            <div className="sentence-of-light-standing-page-glow absolute left-[6%] top-[79.5%] flex h-[10.5%] w-[28%] items-center justify-center gap-1.5 rounded-full text-[9px] font-bold text-white md:text-[13px]" style={{ backgroundColor: BLUE, transform: "translateZ(84px)", boxShadow: "0 0 0 1px rgba(255,255,255,0.25) inset, 0 0 26px 2px rgba(79,152,251,0.85), 0 0 90px 18px rgba(79,152,251,0.45), 16px 26px 30px -10px rgba(11,13,18,0.5)" }}>
              {site.cta}
              <ArrowIcon />
            </div>
            <div className="absolute inset-x-[6%] bottom-[4%] flex justify-between border-t border-slate-900/15 pt-[1.5%] text-[7px] font-semibold uppercase tracking-[0.14em] text-slate-500 md:text-[8px]">
              <span>{site.foot}</span>
              <span>{site.brand}</span>
            </div>
          </div>
        </div>
        <p aria-hidden="true" className="absolute inset-x-6 top-[74%] mx-auto max-w-[620px] text-center text-[19px] font-semibold leading-tight tracking-tight md:left-[8%] md:right-auto md:top-[72%] md:text-left md:text-[30px]" style={{ color: "#dbe9ff", textShadow: "0 0 18px rgba(79,152,251,0.95), 0 0 60px rgba(79,152,251,0.7)", transform: "perspective(900px) rotateX(58deg)", transformOrigin: "50% 0" }}>
          {value}
        </p>
      </div>

      <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${live ? "opacity-100" : "opacity-0"}`} />

      <p className="pointer-events-none absolute left-5 top-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45 md:left-8 md:top-7 md:text-[11px]">One sentence in, one page up</p>

      <form onSubmit={submit} className="absolute inset-x-4 bottom-5 mx-auto flex max-w-[620px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] p-1.5 pl-5 backdrop-blur-xl focus-within:border-[#4F98FB]/70 md:bottom-7" style={{ boxShadow: "0 18px 50px -18px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
        <label htmlFor="sentence-of-light-standing-page-input" className="sr-only">
          Describe a business in one sentence
        </label>
        <input
          id="sentence-of-light-standing-page-input"
          ref={inputRef}
          type="text"
          value={value}
          maxLength={MAX_CHARS}
          autoComplete="off"
          spellCheck={false}
          placeholder="Describe a business in one sentence"
          onChange={(e) => {
            setValue(e.target.value);
            api.current?.type(e.target.value);
          }}
          onFocus={(e) => {
            api.current?.focus(true);
            e.target.select();
          }}
          onBlur={() => api.current?.focus(false)}
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] font-medium tracking-tight text-white caret-[#4F98FB] outline-none placeholder:text-white/40 md:text-[17px]"
        />
        <button type="submit" aria-label="Stand the page up from this sentence" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12] active:scale-95 motion-reduce:transition-none md:w-auto md:gap-2 md:px-5" style={{ backgroundColor: BLUE, boxShadow: "0 0 24px -2px rgba(79,152,251,0.8), inset 0 1px 0 rgba(255,255,255,0.35)" }}>
          <span className="hidden text-[15px] font-bold tracking-tight md:inline">Build</span>
          <ArrowIcon />
        </button>
      </form>
      <p className="sr-only" aria-live="polite">
        Page shown: {site.brand}. {site.headline.replace("\n", " ")}
      </p>
    </section>
  );
}
