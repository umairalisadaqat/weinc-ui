import { useEffect, useRef, useState } from "react";

// The words around the bar.
const LABEL = "Email address";
const START = "hello@morrow.studio"; // what is stamped into the bar when it loads
const DEMO = ["ines@saltandfig.co", "post@lowtide.house", START]; // typed by the self-running demo
const MAX_CHARS = 30;
const copy = {
  idle: ["Slip us", "your address."],
  sent: ["Away", "it goes."],
  hint: "Every letter is pressed into the bar as you type it.",
  done: (v: string) => `${v} slid off across the tiles. Nothing left this page.`,
  bad: "That is not an email address yet. It needs an @ and a dot.",
};
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

// The stamp: the typed text is drawn flat, measured into a distance field and handed to the shader,
// which presses it into the top of the bar.
const TW = 1024, TH = 512, SLOTS = 32;
const STAMP_SIZE = 118; // letter size in stamp pixels
const STAMP_SQUEEZE = 0.84; // the die is cut in a condensed capital
const STAMP_TRACK = 9;
const STAMP_LEFT = 100, STAMP_WIDTH = 824, LINE_1 = 228, LINE_2 = 384;
const STAMP_FONT = (size: number) => `700 ${size}px ${FONT}`;

type Glyph = { ch: string; x: number; y: number; size: number; w: number };

// Soap is stamped in capitals. A letter whose capital is more than one character stays as typed.
const cap = (c: string) => { const u = c.toUpperCase(); return u.length === c.length ? u : c; };
const widths = (g: CanvasRenderingContext2D, chars: string[], size: number) => {
  g.font = STAMP_FONT(size);
  return chars.map((c) => g.measureText(c).width * STAMP_SQUEEZE + STAMP_TRACK);
};
function setLine(g: CanvasRenderingContext2D, text: string, y: number): Glyph[] {
  const chars = [...text].map(cap);
  let size = STAMP_SIZE, ws = widths(g, chars, size);
  const total = ws.reduce((a, b) => a + b, 0);
  if (total > STAMP_WIDTH) { size *= STAMP_WIDTH / total; ws = widths(g, chars, size); }
  let x = STAMP_LEFT;
  return chars.map((ch, i) => { const out = { ch, x, y, size, w: ws[i] }; x += ws[i]; return out; });
}
// An address breaks before its @, the way a signwriter would set it. Anything else wraps when the line is full.
function layout(g: CanvasRenderingContext2D, text: string): Glyph[] {
  const at = text.indexOf("@");
  if (at > 0) return [...setLine(g, text.slice(0, at), LINE_1), ...setLine(g, text.slice(at), LINE_2)];
  const ws = widths(g, [...text].map(cap), STAMP_SIZE);
  let cut = text.length, w = 0;
  for (let i = 0; i < ws.length; i++) { w += ws[i]; if (w > STAMP_WIDTH) { cut = i; break; } }
  return [...setLine(g, text.slice(0, cut), LINE_1), ...setLine(g, text.slice(cut), LINE_2)];
}
// One pass of an exact squared distance transform (Felzenszwalb and Huttenlocher).
function pass(f: Float32Array, off: number, step: number, n: number, d: Float32Array, v: Int32Array, z: Float32Array) {
  let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    const fq = f[off + q * step] + q * q;
    let s = 0;
    for (;;) { const p = v[k]; s = (fq - (f[off + p * step] + p * p)) / (2 * q - 2 * p); if (s <= z[k] && k > 0) k--; else break; }
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const p = v[k]; d[q] = (q - p) * (q - p) + f[off + p * step]; }
  for (let q = 0; q < n; q++) f[off + q * step] = d[q];
}
function distance(f: Float32Array) {
  const n = Math.max(TW, TH), d = new Float32Array(n), v = new Int32Array(n), z = new Float32Array(n + 1);
  for (let x = 0; x < TW; x++) pass(f, x, TW, TH, d, v, z);
  for (let y = 0; y < TH; y++) pass(f, y * TW, 1, TW, d, v, z);
  return f;
}
// First value of each pair: signed distance in pixels to the edge of the lettering, positive inside.
// Second: which typed character owns this spot.
function stampPixels(cv: HTMLCanvasElement, text: string) {
  const out = new Float32Array(TW * TH * 2);
  const g = cv.getContext("2d", { willReadFrequently: true });
  if (!g) return out.fill(-16);
  g.clearRect(0, 0, TW, TH);
  g.fillStyle = "#fff"; g.textBaseline = "alphabetic"; g.textAlign = "left";
  const glyphs = layout(g, text.slice(0, SLOTS - 1));
  const owner = new Uint8Array(TW * TH);
  glyphs.forEach((gl, i) => {
    g.font = STAMP_FONT(gl.size);
    g.setTransform(STAMP_SQUEEZE, 0, 0, 1, gl.x, gl.y);
    g.fillText(gl.ch, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    const x0 = Math.max(0, Math.round(gl.x - 2)), x1 = Math.min(TW, Math.round(gl.x + gl.w - 2));
    const y0 = Math.max(0, Math.round(gl.y - gl.size * 0.95)), y1 = Math.min(TH, Math.round(gl.y + gl.size * 0.36));
    for (let y = y0; y < y1; y++) owner.fill(i + 1, y * TW + x0, y * TW + x1);
  });
  const a = g.getImageData(0, 0, TW, TH).data;
  // the soft edge of the drawn letters places the outline to a fraction of a pixel
  const dOut = new Float32Array(TW * TH), dIn = new Float32Array(TW * TH);
  let any = false;
  for (let i = 0; i < dOut.length; i++) {
    const c = a[i * 4 + 3] / 255;
    if (c > 0) any = true;
    dOut[i] = c >= 1 ? 0 : c <= 0 ? 1e20 : Math.max(0, 0.5 - c) ** 2;
    dIn[i] = c >= 1 ? 1e20 : c <= 0 ? 0 : Math.max(0, c - 0.5) ** 2;
  }
  if (!any) { for (let i = 0; i < TW * TH; i++) out[i * 2] = -16; return out; }
  distance(dOut); distance(dIn);
  const sd = dIn;
  for (let i = 0; i < TW * TH; i++) sd[i] = Math.max(-16, Math.min(16, Math.sqrt(dIn[i]) - Math.sqrt(dOut[i])));
  out.fill(-16);
  // a soft blur rounds the field, as soap rounds the edge of a die
  for (let y = 1; y < TH - 1; y++) for (let x = 1; x < TW - 1; x++) {
    const i = y * TW + x;
    out[i * 2] = (sd[i] * 4 + (sd[i - 1] + sd[i + 1] + sd[i - TW] + sd[i + TW]) * 2 + sd[i - TW - 1] + sd[i - TW + 1] + sd[i + TW - 1] + sd[i + TW + 1]) / 16;
  }
  for (let i = 0; i < TW * TH; i++) out[i * 2 + 1] = owner[i];
  return out;
}
// Browsers without float textures get the same field squeezed into bytes.
function stampBytes(f: Float32Array) {
  const out = new Uint8Array(TW * TH * 4);
  for (let i = 0; i < TW * TH; i++) { out[i * 4] = Math.round(128 + f[i * 2] * 7.9); out[i * 4 + 1] = f[i * 2 + 1]; out[i * 4 + 3] = 255; }
  return out;
}

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 tone(vec3 x){ x *= 0.9; vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return pow(clamp(a / b, 0.0, 1.0), vec3(1.0 / 2.2)); }
`;

// The photograph: a bar of rose soap on a floor of hand-made green tiles, under a window in the
// wall behind. The sun comes over the sill, through the soap and across the floor.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec2 uJit; uniform float uSeed;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform vec3 uBar; uniform vec3 uSun; uniform vec4 uTrail; uniform float uTrailA;
uniform sampler2D uTex; uniform sampler2D uPress; uniform float uDirect; uniform float uLens; uniform vec3 uBytes;
const vec3 HB = vec3(1.5, 0.29, 0.75);
const float WALLZ = 3.3; const float TS = 0.62;
const vec4 WIN = vec4(-0.5, 5.4, 1.15, 3.95); // the window in the far wall: left, right, sill, head
const vec3 SUNC = vec3(2.7, 2.36, 1.9);
const vec3 SKY = vec3(0.74, 0.86, 1.0);
const vec3 SOAP = vec3(0.86, 0.16, 0.18);
const vec3 DEEP = vec3(1.0, 0.075, 0.07);
const vec3 SIG = vec3(0.9, 4.4, 4.9);
const vec3 GLAZE = vec3(0.006, 0.072, 0.044);
const float DEPTH = 0.05; const float LIP = 0.005;
const vec4 RWIN = vec4(-2.1, 5.4, 1.15, 3.95); // the whole casement, as reflections see it
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }

// ---- the bar, in its own frame ----
vec3 toBar(vec3 p){ float c = cos(uBar.z); float s = sin(uBar.z); vec2 d = p.xz - uBar.xy; return vec3(c * d.x + s * d.y, p.y - HB.y, -s * d.x + c * d.y); }
vec3 dirBar(vec3 v){ float c = cos(uBar.z); float s = sin(uBar.z); return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); }
vec3 dirWorld(vec3 v){ float c = cos(uBar.z); float s = sin(uBar.z); return vec3(c * v.x - s * v.z, v.y, s * v.x + c * v.z); }
vec3 toWorld(vec3 q){ vec3 w = dirWorld(q); return vec3(w.x + uBar.x, q.y + HB.y, w.z + uBar.y); }
float rrect(vec2 p, vec2 b, float r){ vec2 e = abs(p) - b + r; return length(max(e, 0.0)) + min(max(e.x, e.y), 0.0) - r; }
float sdBar(vec3 q){
  // the mould leaves the top a little domed
  vec2 k = q.xz / HB.xz; float dome = 0.04 * clamp(1.0 - k.x * k.x, 0.0, 1.0) * clamp(1.0 - k.y * k.y, 0.0, 1.0);
  q.y -= dome * smoothstep(-0.1, HB.y, q.y);
  float d2 = rrect(q.xz, HB.xz, 0.3);
  vec2 w = vec2(d2 + 0.125, abs(q.y) - HB.y + 0.125);
  // the two halves of the mould meet in a faint seam round the waist
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.125 - 0.0035 * exp(-pow((q.y + 0.03) / 0.007, 2.0));
}
// How far the die has pushed in at this spot on the top. cav is 1 on the floor of a letter.
float stamp(vec2 xz, out float cav){
  vec2 uv = vec2(xz.x / (2.0 * HB.x) + 0.5, 0.5 - xz.y / (2.0 * HB.z));
  vec4 t = texture2D(uTex, uv);
  vec2 su = (floor(uv * vec2(${TW}.0, ${TH}.0)) + 0.5) / vec2(${TW}.0, ${TH}.0);
  float id = floor(texture2D(uTex, su).g * uBytes.y + 0.5);
  float pr = id > 0.5 ? texture2D(uPress, vec2((id - 0.5) / ${SLOTS}.0, 0.5)).r * 1.6 : 0.0;
  float sd = (t.r * uBytes.x - uBytes.z) / 341.0;
  float inn = smoothstep(-0.006, 0.027, sd);
  cav = inn * min(pr, 1.0);
  float h = DEPTH * inn * pr;
  // soap pushed aside stands up as a soft lip round each letter
  h -= LIP * exp(-pow((sd + 0.017) / 0.011, 2.0)) * pr;
  // the maker's border, part of the mould
  float fr = abs(rrect(xz, HB.xz - 0.115, 0.16));
  h += 0.014 * smoothstep(0.017, 0.006, fr);
  return h;
}
float groove(vec2 xz){
  vec2 uv = vec2(xz.x / (2.0 * HB.x) + 0.5, 0.5 - xz.y / (2.0 * HB.z));
  return smoothstep(-0.06, -0.02, (texture2D(uTex, uv).r * uBytes.x - uBytes.z) / 341.0);
}
float map(vec3 q){
  float d = sdBar(q);
  if (q.y > 0.1 && d < 0.12) { float c; d += stamp(q.xz, c) * smoothstep(0.1, 0.22, q.y); }
  return d;
}
vec3 soapN(vec3 q){
  vec2 e = vec2(0.0058, -0.0058);
  return normalize(e.xyy * map(q + e.xyy) + e.yyx * map(q + e.yyx) + e.yxy * map(q + e.yxy) + e.xxx * map(q + e.xxx));
}
vec2 boxSpan(vec3 ro, vec3 rd, vec3 b){
  vec3 inv = 1.0 / (rd + vec3(1e-6)); vec3 a = (-b - ro) * inv; vec3 c = (b - ro) * inv;
  vec3 mn = min(a, c); vec3 mx = max(a, c);
  return vec2(max(max(mn.x, mn.y), max(mn.z, 0.0)), min(mx.x, min(mx.y, mx.z)));
}
float marchBar(vec3 ro, vec3 rd){
  vec2 tb = boxSpan(ro, rd, HB + vec3(0.02, 0.06, 0.02));
  if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 110; i++) { vec3 p = ro + rd * t; float d = map(p); if (d < 0.0003) return t; t += d * (p.y > 0.1 ? 0.36 : 0.9); if (t > tb.y) break; }
  return -1.0;
}
float marchPlain(vec3 ro, vec3 rd){
  vec2 tb = boxSpan(ro, rd, HB + vec3(0.02, 0.06, 0.02));
  if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 26; i++) { float d = sdBar(ro + rd * t); if (d < 0.002) return t; t += d; if (t > tb.y) break; }
  return -1.0;
}

// ---- the room ----
// Sunlight reaches a point only if the way back to the sun clears the sill of the window.
float inWin(vec2 w, float s){
  return smoothstep(WIN.x - s, WIN.x + s, w.x) * smoothstep(WIN.y + s, WIN.y - s, w.x) * smoothstep(WIN.z - s, WIN.z + s, w.y) * smoothstep(WIN.w + s, WIN.w - s, w.y);
}
float sunAt(vec3 p){
  float t = (WALLZ - p.z) / uSun.z;
  return inWin(p.xy + uSun.xy * t, 0.015 + 0.028 * t);
}
vec3 floorMean(vec3 p){ return GLAZE * 1.25 * (SUNC * uSun.y * sunAt(p) + SKY * 0.3); }
vec3 room(vec3 ro, vec3 rd, float rough){
  vec3 c = vec3(0.03, 0.032, 0.03) + vec3(0.16, 0.15, 0.13) * smoothstep(-0.1, 1.0, rd.y);
  if (rd.z > 0.001) {
    float t = (WALLZ - ro.z) / rd.z; vec3 p = ro + rd * t;
    if (p.y > 0.0) {
      float s = 0.03 + rough * t * 0.3;
      vec3 wall = GLAZE * (0.3 + 1.2 * exp(-p.y * 1.3));
      // sky through old glass, paler toward the top
      vec3 sky = SKY * mix(2.3, 3.8, smoothstep(WIN.z, WIN.w, p.y));
      float bars = smoothstep(0.035 + s, 0.06 + s * 2.0, abs(fract(p.x / 1.85 + 0.22) - 0.5) * 1.85) * smoothstep(0.035 + s, 0.06 + s * 2.0, abs(p.y - 2.5));
      sky *= mix(0.1, 1.0, bars);
      float m = smoothstep(RWIN.x - s, RWIN.x + s, p.x) * smoothstep(RWIN.y + s, RWIN.y - s, p.x) * smoothstep(RWIN.z - s, RWIN.z + s, p.y) * smoothstep(RWIN.w + s, RWIN.w - s, p.y);
      c = mix(wall, sky, m);
    }
  }
  if (rd.y < -0.001) { float t = -ro.y / rd.y; vec3 p = ro + rd * t; if (p.z < WALLZ) c = floorMean(p); }
  return c;
}

// A hand-made glazed tile: no two the same colour, none of them quite flat.
void tile(vec2 q, float blur, out vec3 alb, out vec3 nrm, out float gro){
  vec2 g = q / TS + vec2(0.37, 0.18); vec2 id = floor(g); vec2 f = g - id;
  vec2 e2 = min(f, 1.0 - f) * TS;
  float keep = 1.0 - clamp(blur / 0.14, 0.0, 1.0);
  float e = min(e2.x, e2.y) + (n2(q * 6.0) - 0.5) * 0.014 * keep;
  gro = 1.0 - smoothstep(0.004 - blur, 0.011 + blur, e);
  gro *= mix(0.3, 1.0, keep);
  float r1 = h21(id); float r2 = h21(id + 17.3); float r3 = h21(id + 41.7);
  vec3 base = mix(GLAZE, GLAZE * vec3(2.6, 1.7, 1.25), r2 * r2 * r2) * (0.55 + 0.8 * r1);
  // glaze runs thin and pale at the edges and pools dark in the middle
  base = mix(base, GLAZE * vec3(7.0, 2.8, 2.9), smoothstep(0.05, 0.0, e) * 0.32);
  base *= 0.82 + 0.36 * n2(q * 2.7 + id * 3.1);
  base = mix(base, base * 0.55 + vec3(0.02, 0.05, 0.03), smoothstep(0.62, 0.9, n2(q * 31.0 + id)) * 0.5 * keep);
  alb = mix(base, vec3(0.2, 0.19, 0.15), gro);
  vec2 tilt = (vec2(r2, r3) - 0.5) * 0.07;
  vec2 wav = vec2(n2(q * 3.3 + id * 5.0) - 0.5, n2(q * 3.3 + 31.0 + id * 5.0) - 0.5) * 0.06;
  wav += vec2(n2(q * 19.0) - 0.5, n2(q * 19.0 + 9.0) - 0.5) * 0.012;
  vec2 dir = e2.x < e2.y ? vec2(sign(f.x - 0.5), 0.0) : vec2(0.0, sign(f.y - 0.5));
  vec2 slope = (tilt + wav) * keep + dir * smoothstep(0.045, 0.0, e) * 0.4 * keep;
  nrm = normalize(vec3(slope.x, 1.0, slope.y));
}

// Beads of water on a flat face: xy is the slope of the bead, z is 1 inside it, w runs 0 to 1 from centre to rim.
vec4 beads(vec2 p, float cell, float chance){
  vec2 id = floor(p / cell); vec4 o = vec4(0.0);
  if (h21(id + 3.7) > chance) return o;
  vec2 c = (id + 0.28 + 0.44 * vec2(h21(id + 11.1), h21(id + 23.9))) * cell;
  float rad = cell * (0.09 + 0.2 * h21(id + 5.3));
  vec2 d = p - c; float r = length(d) / rad;
  if (r > 1.0) return o;
  o.xy = d / max(length(d), 1e-5) * r / sqrt(max(1.0 - r * r * 0.86, 0.05)) * 0.55;
  o.z = smoothstep(1.0, 0.86, r); o.w = r;
  return o;
}
// ---- the soap ----
float soapShadow(vec3 q, vec3 l){
  if (q.y < 0.14) return 1.0;
  float res = 1.0; float t = 0.004;
  for (int i = 0; i < 24; i++) { float h = map(q + l * t); res = min(res, 6.0 * h / t); t += clamp(h * 0.7, 0.004, 0.02); if (res < 0.01 || t > 0.16) break; }
  return clamp(res, 0.0, 1.0);
}
// how much soap lies between a point and the sun
float thick(vec3 q, vec3 l){
  vec3 b = HB - vec3(0.05, 0.0, 0.05);
  vec3 t = (sign(l) * b - q) / (l + vec3(1e-5));
  return max(min(t.x, min(t.y, t.z)), 0.0);
}
vec3 soapPlain(vec3 q, vec3 n, vec3 pw){
  vec3 l = dirBar(uSun); float ndl = dot(n, l); float lit = sunAt(pw);
  float wrap = clamp((ndl + 0.35) / 1.35, 0.0, 1.0);
  vec3 tr = exp(-SIG * thick(q - n * 0.02, l)) * (1.0 - max(ndl, 0.0));
  return SOAP * (SUNC * lit * wrap * wrap + SKY * 0.5 * (0.6 + 0.4 * n.y)) + DEEP * SUNC * lit * tr * 0.5;
}
vec3 shadeSoap(vec3 q, vec3 rdB){
  vec3 n = soapN(q); vec3 pw = toWorld(q); vec3 l = dirBar(uSun);
  float cav; stamp(q.xz, cav); cav *= step(0.14, q.y);
  // the cast skin is never perfectly even
  vec3 nb = normalize(n + 0.022 * vec3(n2(q.xz * 23.0) - 0.5, 0.0, n2(q.xz * 23.0 + 7.0) - 0.5) + 0.03 * vec3(n2(q.xz * 4.0 + 3.0) - 0.5, 0.0, n2(q.zx * 4.0) - 0.5));
  float grv = groove(q.xz) * step(0.14, q.y);
  // it has been rinsed: a film of water lies in patches on the top, and a few beads have not run off
  float top = smoothstep(0.85, 0.97, n.y) * (1.0 - grv);
  float film = top * smoothstep(0.42, 0.6, n2(q.xz * 1.7 + 5.0) * 0.7 + n2(q.xz * 5.3) * 0.3);
  vec4 bd = beads(q.xz + 7.0, 0.19, 0.24) * top * (1.0 - film * 0.6);
  nb = normalize(mix(nb, n, film * 0.8) + vec3(bd.x, 0.0, bd.y));
  float ndl = dot(nb, l); float lit = sunAt(pw);
  float sh = ndl > 0.0 ? soapShadow(q + n * 0.002, l) : 0.0;
  float o = 0.0; float w = 1.0;
  for (int i = 1; i <= 3; i++) { float h = 0.014 * float(i); o += (h - map(q + n * h)) * w; w *= 0.75; }
  float ao = clamp(1.0 - 9.0 * o, 0.0, 1.0);
  float wrap = clamp((ndl + 0.38) / 1.38, 0.0, 1.0);
  float direct = max(ndl, 0.0) * sh;
  // light that went in somewhere near and comes back out redder, filling the shadows inside the letters
  vec3 scat = DEEP * SUNC * lit * (wrap * wrap - direct * 0.7) * mix(0.34, 0.2, grv);
  vec3 tr = exp(-SIG * (thick(q - n * 0.02, l) + 0.04)) * (1.0 - max(ndl, 0.0)) * (1.0 - 0.8 * grv);
  vec3 sky = SKY * 0.62 * (0.55 + 0.45 * nb.y) + vec3(0.3, 0.26, 0.2) * 0.25;
  vec3 bounce = GLAZE * SUNC * 0.5 * clamp(0.3 - nb.y, 0.0, 1.0) * smoothstep(0.3, -0.3, q.y);
  // milled soap is faintly clouded, with the odd paler fleck
  vec3 skin = SOAP * (0.93 + 0.14 * n2(q.xz * 3.1 + q.y * 5.0)) + vec3(0.05, 0.03, 0.025) * smoothstep(0.8, 0.95, n2(q.xz * 70.0 + q.y * 70.0));
  vec3 col = skin * (SUNC * lit * direct + (sky + bounce) * ao) + scat * mix(0.75, 1.0, ao) + DEEP * SUNC * lit * tr * 1.0;
  // a bead is a little lens: dark toward the sun, a bright crescent on the far side
  if (bd.z > 0.0) { float side = dot(normalize(bd.xy + 1e-5), normalize(l.xz)); col *= 1.0 - 0.3 * bd.z * smoothstep(-0.2, 0.9, side) * bd.w; col += skin * SUNC * lit * 0.55 * bd.z * smoothstep(0.1, 0.95, -side) * bd.w * bd.w; }
  col *= 1.0 - 0.1 * film;
  // a waxy sheen: the window, seen soft in the skin, sharper where the die has polished it
  vec3 nw = dirWorld(nb); vec3 rw = reflect(dirWorld(rdB), nw);
  float f = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rdB, nb), 0.0, 1.0), 5.0);
  float wetk = max(film, bd.z);
  float rough = mix(mix(0.34, 0.13, cav), 0.0, wetk);
  col = col * (1.0 - f) + f * mix(1.6, 2.2, wetk) * room(pw, rw, rough) * mix(0.45, 1.0, ao);
  // the sun itself, smeared wide by the waxy skin
  vec3 hv = normalize(l - rdB); float nh = max(dot(nb, hv), 0.0); float al = mix(0.2, 0.09, cav); al *= al;
  float dd = nh * nh * (al - 1.0) + 1.0;
  col += SUNC * lit * sh * max(ndl, 0.0) * 0.045 * al / (3.14159 * dd * dd) * 0.8;
  // and a tighter glint from the wax on top, tightest of all on water
  col += SUNC * lit * sh * (0.5 * pow(nh, 380.0) + 26.0 * wetk * pow(nh, 2600.0));
  return col;
}

// ---- floor and wall ----
vec4 barSeen(vec3 p, vec3 r){
  vec3 ro = toBar(p); vec3 rd = dirBar(r);
  float t = marchPlain(ro, rd);
  if (t < 0.0) return vec4(0.0);
  vec3 q = ro + rd * t; vec2 e = vec2(0.004, -0.004);
  vec3 n = normalize(e.xyy * sdBar(q + e.xyy) + e.yyx * sdBar(q + e.yyx) + e.yxy * sdBar(q + e.yxy) + e.xxx * sdBar(q + e.xxx));
  return vec4(soapPlain(q, n, toWorld(q)), 1.0);
}
float barShadow(vec3 pw){
  vec3 q = toBar(pw);
  if (dot(q.xz, q.xz) > 16.0) return 1.0;
  vec3 d = dirBar(uSun);
  float res = 1.0; float t = 0.02;
  for (int i = 0; i < 24; i++) { float h = sdBar(q + d * t); res = min(res, 15.0 * h / t); t += clamp(h, 0.03, 0.22); if (res < 0.004 || t > 2.4) break; }
  return clamp(res, 0.0, 1.0);
}
// Standing water: positive where it lies. Puddles left from the rinse, a ring round the foot of the bar,
// and the film a bar drags behind it, which thins and breaks up as it dries.
float trail(vec2 p){
  if (uTrailA < 0.001) return -1.0;
  vec2 a = uTrail.xy; vec2 ba = uTrail.zw - a; vec2 pa = p - a;
  float hh = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
  float body = 0.6 + 0.2 * (n2(p * 1.6 + 2.0) - 0.5) - length(pa - ba * hh);
  return body - (1.0 - uTrailA) * (0.25 + 0.9 * n2(p * 3.4 + 11.0)) - 0.16 * n2(p * 9.0);
}
float water(vec2 p){
  float w = n2(p * 0.85 + 4.2) * 0.62 + n2(p * 2.7 + 9.0) * 0.38 - 0.6;
  vec3 q = toBar(vec3(p.x, 0.0, p.y));
  w = max(w, 0.05 - rrect(q.xz, HB.xz, 0.3) - 0.1 * n2(p * 3.0 + 1.0));
  return max(w, trail(p));
}
// soap bubbles left in the film: a thin bright ring and a dot of sun for each
float suds(vec2 p, float cell, out float glint){
  vec2 g = p / cell; vec2 id = floor(g);
  vec2 c = id + 0.5 + 0.56 * (vec2(h21(id + 1.3), h21(id + 7.0)) - 0.5);
  float rad = 0.12 + 0.3 * h21(id + 3.0) * h21(id + 5.0);
  float d = length(g - c) / rad;
  float on = step(h21(id + 19.0), 0.45);
  glint = on * smoothstep(0.28, 0.08, length(g - c - vec2(0.35, 0.3) * rad) / rad);
  return on * (smoothstep(0.2, 0.0, abs(d - 0.86)) + 0.18 * smoothstep(1.0, 0.6, d));
}
vec3 shadeFloor(vec3 p, vec3 rd, float blur, vec2 rnd){
  vec3 alb; vec3 n; float gro;
  tile(p.xz, blur, alb, n, gro);
  float near = sdBar(toBar(p));
  float ao = 0.35 + 0.65 * smoothstep(0.0, 0.38, near);
  float lit = sunAt(p);
  float sh = lit > 0.001 ? barShadow(p + vec3(0.0, 0.004, 0.0)) : 1.0;
  // inside the shadow the sun still arrives, filtered rose by the bar
  vec3 sun = SUNC * lit * mix(DEEP * 0.42 * exp(-near * 2.6), vec3(1.0), sh) * max(dot(n, uSun), 0.0);
  vec3 amb = SKY * 0.42 * ao + SOAP * SUNC * 0.07 * exp(-near * 3.2);
  vec3 col = alb * (sun + amb);
  // water lies flat over tile and grout alike, and curls up at its edge
  float wf = water(p.xz); float es = 0.012 + blur;
  float wet = smoothstep(0.0, es, wf);
  vec2 wg = vec2(water(p.xz + vec2(0.012, 0.0)) - wf, water(p.xz + vec2(0.0, 0.012)) - wf);
  float lipw = wet * smoothstep(0.05 + blur, 0.0, wf) / (1.0 + blur * 30.0);
  vec4 bd = beads(p.xz, 0.2, 0.3) * (1.0 - wet) * (1.0 - gro) * smoothstep(0.03, 0.0, blur) * smoothstep(3.2, 1.6, near);
  n = normalize(mix(n, vec3(0.0, 1.0, 0.0), wet) - vec3(wg.x, 0.0, wg.y) / max(length(wg), 1e-4) * lipw * 0.55 + vec3(bd.x, 0.0, bd.y));
  col *= 1.0 - 0.28 * wet;
  float still = max(wet, bd.z);
  vec3 r = reflect(rd, normalize(n + vec3(rnd.x, 0.0, rnd.y) * 0.012 * (1.0 - still)));
  r.y = abs(r.y);
  float f = 0.045 + 0.955 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  f *= mix(1.0 - gro, 1.0, still);
  vec4 bs = dot(p.xz - uBar.xy, p.xz - uBar.xy) < 30.0 ? barSeen(p + vec3(0.0, 0.003, 0.0), r) : vec4(0.0);
  vec3 refl = mix(room(p, r, blur * 0.6), bs.rgb, bs.a);
  col = col * (1.0 - f) + f * refl;
  vec3 hv = normalize(uSun - rd); float nh = max(dot(n, hv), 0.0);
  col += SUNC * lit * sh * (1.0 - gro) * 0.5 * pow(nh, 420.0);
  // the sun catches the curled edge of the water and the crown of each bead
  col += SUNC * lit * sh * (lipw + bd.z) * 14.0 * pow(nh, 1400.0);
  if (bd.z > 0.0) { float side = dot(normalize(bd.xy + 1e-5), normalize(uSun.xz)); col += alb * SUNC * lit * sh * 0.7 * bd.z * smoothstep(0.1, 0.95, -side) * bd.w * bd.w; }
  // suds left behind in the film, thickest along its edges
  float tf = trail(p.xz);
  if (tf > -0.08 && blur < 0.05) {
    float g1; float g2; float ring = suds(p.xz, 0.07, g1) + suds(p.xz + 3.3, 0.034, g2);
    // froth gathers along the edges of the film and in a few clots down the middle
    float where = smoothstep(-0.08, 0.02, tf) * max(smoothstep(0.22, 0.02, tf), smoothstep(0.62, 0.8, n2(p.xz * 3.1 + 6.0))) * smoothstep(0.45, 0.7, n2(p.xz * 7.0 + 2.0) + 0.25 * smoothstep(0.2, 0.0, tf)) * smoothstep(0.0, 0.3, uTrailA) * smoothstep(0.05, 0.0, blur);
    col += where * (ring * vec3(0.92, 0.88, 0.88) * (SUNC * lit * sh * 0.2 + SKY * 0.2) + (g1 + g2) * SUNC * lit * sh * 1.1);
    col += SKY * 0.05 * smoothstep(0.0, 0.05, tf) * uTrailA;
  }
  return col;
}
vec3 shadeWall(vec3 p, vec3 rd, float blur){
  vec3 alb; vec3 n; float gro;
  tile(p.xy + vec2(0.0, 0.03), blur, alb, n, gro);
  vec3 nw = normalize(vec3(n.x, n.z, -n.y));
  // no sun on this wall: it is lit by the floor in front of it and the room
  vec3 amb = SKY * 0.3 + GLAZE * SUNC * 1.6 * exp(-p.y * 1.5) * smoothstep(0.0, 0.5, p.y + 0.2);
  amb *= 0.3 + 0.7 * smoothstep(0.0, 0.5, p.y);
  vec3 col = alb * amb;
  vec3 r = reflect(rd, nw);
  float f = (0.045 + 0.955 * pow(1.0 - clamp(dot(-rd, nw), 0.0, 1.0), 5.0)) * (1.0 - gro);
  vec3 seen = r.y < -0.001 ? floorMean(p + r * (-p.y / r.y)) : vec3(0.05, 0.05, 0.045);
  return col * (1.0 - f) + f * seen;
}

void main(){
  vec2 fc = gl_FragCoord.xy + uJit;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uSeed);
  float ang = ign * 6.2831853; float rr = sqrt(fract(ign * 7.13 + uSeed * 3.7));
  vec2 rnd = vec2(cos(ang), sin(ang)) * rr * step(0.001, uSeed);
  float tf = rd.y < -1e-4 ? -ro.y / rd.y : 1e9;
  float tw = rd.z > 1e-4 ? (WALLZ - ro.z) / rd.z : 1e9;
  vec3 rob = toBar(ro); vec3 rdb = dirBar(rd);
  float tb = marchBar(rob, rdb);
  vec3 col;
  if (tb > 0.0 && tb < min(tf, tw)) col = shadeSoap(rob + rdb * tb, rdb);
  else {
    float t = min(tf, tw);
    // a long lens: only the bar is sharp
    float dz = t * dot(rd, fw) - uFocus;
    float blur = uLens * abs(dz) / uFocus * (dz < 0.0 ? 0.4 : 1.0) + t * 0.0005;
    vec3 p = ro + rd * t;
    if (tf < tw) {
      col = shadeFloor(p, rd, blur, rnd);
      float j = (WALLZ - p.z) / max(blur * 1.6, 0.004);
      if (j < 1.0) col = mix(shadeWall(vec3(p.x, 0.02, WALLZ), rd, blur), col, 0.5 + 0.5 * j);
    } else {
      col = shadeWall(p, rd, blur);
      float j = p.y / max(blur * 1.6, 0.004);
      if (j < 1.0) col = mix(shadeFloor(vec3(p.x, 0.0, WALLZ - 0.02), rd, blur, rnd), col, 0.5 + 0.5 * j);
    }
  }
  col = min(col, vec3(24.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the negative: a little bloom off the hot highlights, the filmic curve, vignette, grain.
const POST = `
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain; uniform vec2 uCentre;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uAcc, uv).rgb;
  vec2 px = 1.0 / uRes;
  vec3 nb = texture2D(uAcc, uv + vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv - vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv + vec2(0.0, px.y)).rgb + texture2D(uAcc, uv - vec2(0.0, px.y)).rgb;
  c = max(c + (c - nb * 0.25) * 0.22, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 20.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.024 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.3, 0.0), vec3(6.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.012;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.34 * smoothstep(0.3, 1.25, length(q));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.022;
  outC = vec4(c, 1.0);
}
`;

// No WebGL: the same bar on the same floor, laid out in CSS on a tilted plane, with the address
// pressed in by text shadow and the thickness of the bar stacked up from hard shadows.
const SIDE = Array.from({ length: 34 }, (_, k) => `${(-0.41 * (k + 1)).toFixed(1)}px ${(0.91 * (k + 1)).toFixed(1)}px 0 ${k < 17 ? "#e2504d" : "#c93f41"}`).join(", ");
function Still({ value }: { value: string }) {
  const at = value.indexOf("@");
  const lines = at > 0 ? [value.slice(0, at), value.slice(at)] : [value];
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: "radial-gradient(46% 44% at 68% 60%, #23945f 0%, #17734c 34%, #0c4430 62%, #072a1e 100%)" }}>
      <div className="absolute left-1/2 top-[34%] h-0 w-0 lg:left-[68%] lg:top-[58%]" style={{ transform: "perspective(1100px) rotateX(56deg) rotateZ(-24deg)" }}>
        <div className="absolute -left-[1400px] -top-[1400px] h-[2800px] w-[2800px]" style={{ backgroundImage: "linear-gradient(90deg, rgba(4,26,18,0.55) 0 3px, transparent 3px), linear-gradient(rgba(4,26,18,0.55) 0 3px, transparent 3px), linear-gradient(90deg, rgba(190,230,200,0.16) 3px, transparent 5px), linear-gradient(rgba(190,230,200,0.16) 3px, transparent 5px)", backgroundSize: "118px 118px", WebkitMaskImage: "radial-gradient(closest-side, #000 30%, transparent 100%)", maskImage: "radial-gradient(closest-side, #000 30%, transparent 100%)" }} />
        <div className="absolute -left-[150px] -top-[10px] h-[250px] w-[470px] rounded-[70px] bg-[#04160f]/70 blur-xl lg:-left-[250px] lg:h-[360px] lg:w-[700px]" />
        <div className="absolute -left-[170px] -top-[90px] flex h-[180px] w-[340px] flex-col justify-center rounded-[40px] px-9 lg:-left-[270px] lg:-top-[140px] lg:h-[280px] lg:w-[540px] lg:rounded-[62px] lg:px-14" style={{ background: "linear-gradient(200deg, #ffb9ae 0%, #f78a84 30%, #f06e6b 100%)", boxShadow: `${SIDE}, inset 0 0 0 2px rgba(255,214,204,0.5)` }}>
          <div className="absolute inset-[13px] rounded-[30px] lg:inset-[20px] lg:rounded-[46px]" style={{ boxShadow: "inset 1px 2px 2px rgba(150,30,40,0.6), 0 1px 1px rgba(255,226,216,0.7)" }} />
          <div className="relative text-[30px] font-extrabold uppercase leading-[1.3] tracking-[0.03em] text-[#e9605d] lg:text-[48px]" style={{ textShadow: "1px -2px 2px rgba(140,24,34,0.8), -1px 2px 1px rgba(255,220,210,0.85)" }}>
            {lines.map((l, i) => <span key={i} className="block whitespace-nowrap">{l || "\u00a0"}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoseSoapBarEmailInput() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(START);
  const [mode, setMode] = useState<"idle" | "sent">("idle");
  const [note, setNote] = useState(copy.hint);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const api = useRef<{ type: (v: string, fromUser: boolean) => void; send: (fromUser: boolean) => boolean; no: () => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts = { antialias: false, alpha: false, powerPreference: "high-performance" as const };
    const gl2 = cv.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? cv.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) { setShown("still"); return; }
    const canAcc = !!gl2 && (!!gl2.getExtension("EXT_color_buffer_float") || !!gl2.getExtension("EXT_color_buffer_half_float"));
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    const still = reduce || software; // no idle drift: draw, refine, then rest

    const head = gl2 ? "#version 300 es\n#define ATTR in\n" : "#define ATTR attribute\n";
    const fhead = gl2 ? "#version 300 es\n#define texture2D texture\nprecision highp float;\nout vec4 outC;\n" : "#define outC gl_FragColor\n";
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const link = (frag: string) => {
      const v = compile(gl.VERTEX_SHADER, head + VERT), f = compile(gl.FRAGMENT_SHADER, fhead + frag);
      const p = gl.createProgram();
      if (!v || !f || !p) return null;
      gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    };
    const scene = link(SCENE), post = canAcc ? link(POST) : null;
    if (!scene || (canAcc && !post)) { setShown("still"); return; }
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uBar", "uSun", "uTrail", "uTrailA", "uTex", "uPress", "uDirect", "uLens", "uBytes"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const plain = (unit: number, filter: number) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    plain(0, gl.LINEAR);
    plain(2, gl.NEAREST);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    const flat = document.createElement("canvas");
    flat.width = TW; flat.height = TH;
    const pressPx = new Uint8Array(SLOTS * 4);

    // The accumulation plate: every frame is one more exposure blended onto it.
    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const s = {
      text: "", stamped: "", press: new Float32Array(SLOTS), vel: new Float32Array(SLOTS), goal: new Float32Array(SLOTS),
      heal: 0, bx: 0, bz: 0, yaw: 0, vx: 0, vz: 0, vyaw: 0, phase: "rest" as "rest" | "wind" | "away" | "in", clock: 0,
      trail: [0, 0, 0, 0], trailA: 0, px: 0, py: 0, sx: 0, sy: 0, count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, demoI: 0, demoText: "", demoN: 0, first: true,
    };
    const restamp = (text: string) => {
      gl.activeTexture(gl.TEXTURE0);
      const field = stampPixels(flat, text);
      if (gl2) gl2.texImage2D(gl.TEXTURE_2D, 0, gl2.RG16F, TW, TH, 0, gl2.RG, gl.FLOAT, field);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TW, TH, 0, gl.RGBA, gl.UNSIGNED_BYTE, stampBytes(field));
      s.stamped = text; s.heal = 0;
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      // never more than about a million and a half pixels of tracing
      const k = Math.min(1, Math.sqrt(1.45e6 / (cssW * cssH * dpr * dpr)));
      const w = Math.max(2, Math.round(cssW * dpr * k)), h = Math.max(2, Math.round(cssH * dpr * k));
      if (w === W && h === H) return;
      W = w; H = h; cv.width = W; cv.height = H;
      if (gl2 && acc && fbo) {
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, acc);
        gl2.texImage2D(gl.TEXTURE_2D, 0, gl2.RGBA16F, W, H, 0, gl.RGBA, gl2.HALF_FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, acc, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      s.count = 0; s.fresh = true;
    };
    const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

    // The camera: a long lens above the bar's near right corner.
    const camera = (now: number) => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      const el = (wide ? 0.68 : 0.86) - s.sy * 0.014, az = (wide ? 0.5 : 0.36) + s.sx * 0.045, dist = 10;
      const tgt = wide ? [-0.05, 0.26, 0.05] : [0, 0.26, 0];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] - dist * Math.cos(az) * Math.cos(el)];
      const foc = wide ? 2.8 * Math.min(1, aspect / 1.55) : 1.5 * Math.min(1, aspect / 0.51);
      const fw = [tgt[0] - cam[0], tgt[1] - cam[1], tgt[2] - cam[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]); fw[0] /= fl; fw[1] /= fl; fw[2] /= fl;
      const shift = wide ? [0.185 * aspect, -0.09] : [0, 0.21];
      const t = still ? 0 : (now - s.t0) / 1000;
      const sun = [0.5 + 0.08 * Math.sin(t * 0.33) + s.sx * 0.05, 0.5, 0.7];
      const sl = Math.hypot(sun[0], sun[1], sun[2]);
      return { cam, tgt, fw, foc, shift, wide, sun: sun.map((v) => v / sl) };
    };

    const draw = (alpha: number, sample: number, now: number) => {
      const c = camera(now);
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      for (let i = 0; i < SLOTS; i++) pressPx[i * 4] = Math.max(0, Math.min(255, Math.round((s.press[i] / 1.6) * 255)));
      gl.activeTexture(gl.TEXTURE2);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SLOTS, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pressPx);
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform2f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]); gl.uniform3f(su.uTgt, c.tgt[0], c.tgt[1], c.tgt[2]);
      gl.uniform1f(su.uFoc, c.foc);
      gl.uniform2f(su.uShift, c.shift[0], c.shift[1]);
      gl.uniform1f(su.uFocus, (0 - c.cam[0]) * c.fw[0] + (0.4 - c.cam[1]) * c.fw[1] + (0 - c.cam[2]) * c.fw[2]);
      gl.uniform1f(su.uLens, 0.2);
      gl.uniform3f(su.uBar, s.bx, s.bz, s.yaw);
      gl.uniform3f(su.uSun, c.sun[0], c.sun[1], c.sun[2]);
      gl.uniform4f(su.uTrail, s.trail[0], s.trail[1], s.trail[2], s.trail[3]);
      gl.uniform1f(su.uTrailA, s.trailA);
      gl.uniform1i(su.uTex, 0); gl.uniform1i(su.uPress, 2);
      if (gl2) gl.uniform3f(su.uBytes, 1, 1, 0); else gl.uniform3f(su.uBytes, 255 / 7.9, 255, 128 / 7.9);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, c.wide ? 0.6 : 0.5, c.wide ? 0.42 : 0.66);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    // Typing: letters shared with what is already stamped stay put, new ones are pressed in,
    // and a deleted one closes over before the stamp is redrawn without it.
    const type = (next: string, fromUser: boolean) => {
      if (fromUser) s.touched = true;
      const v = next.slice(0, MAX_CHARS);
      if (v === s.text) return;
      const old = s.stamped;
      s.text = v;
      if (!reduce && old.startsWith(v) && v.length < old.length && s.phase === "rest") {
        for (let i = 0; i < SLOTS; i++) s.goal[i] = i < v.length ? 1 : 0;
        s.heal = performance.now() + 150;
      } else {
        let keep = 0;
        while (keep < v.length && keep < old.length && v[keep] === old[keep]) keep++;
        // a letter after the @ moves down a line when the @ arrives, so it is pressed again
        if (old.includes("@") !== v.includes("@")) keep = Math.min(keep, Math.max(0, v.indexOf("@")), Math.max(0, old.indexOf("@")));
        restamp(v);
        for (let i = 0; i < SLOTS; i++) {
          s.goal[i] = i < v.length ? 1 : 0;
          if (i >= keep) { s.press[i] = reduce && i < v.length ? 1 : 0; s.vel[i] = 0; }
        }
        if (!reduce && v.length > keep && s.phase === "rest") { s.vx -= 0.05; s.vyaw += (Math.random() - 0.5) * 0.12; }
      }
      s.count = 0;
      wake();
    };
    const send = (fromUser: boolean) => {
      if (fromUser) s.touched = true;
      if (s.phase !== "rest") return false;
      if (reduce) { restamp(""); s.text = ""; s.press.fill(0); s.goal.fill(0); s.count = 0; wake(); return true; }
      s.phase = "wind"; s.clock = 0;
      wake();
      return true;
    };
    const no = () => { if (!reduce && s.phase === "rest") { s.vyaw += 1.5; wake(); } };
    api.current = { type, send, no };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 4400; }

      // the self-running demo: it opens finished, holds, sends the bar off, then stamps a new address
      if (!still && DEMO.length > 0 && !s.touched && s.phase === "rest" && now > s.demoAt) {
        if (s.demoN < s.demoText.length) {
          s.demoN++;
          const v = s.demoText.slice(0, s.demoN);
          type(v, false); setValue(v); setMode("idle"); setNote(copy.hint);
          s.demoAt = now + (v.endsWith("@") ? 260 : 105 + Math.random() * 70);
          if (s.demoN === s.demoText.length) s.demoAt = now + 3600;
        } else {
          const gone = s.text;
          if (send(false)) { setMode("sent"); setNote(copy.done(gone)); setValue(""); }
          s.demoText = DEMO[s.demoI % DEMO.length]; s.demoI++; s.demoN = 0;
          s.demoAt = now + 2700;
        }
      }
      if (s.heal && now > s.heal) restamp(s.text);

      let moving = false;
      if (!reduce) {
        const steps = 3, h = dt / steps;
        for (let k = 0; k < steps; k++) {
          for (let i = 0; i < SLOTS; i++) {
            // the die goes in hard, a touch too far, and the soap gives a little of it back
            const up = s.goal[i] > 0.5;
            s.vel[i] += ((up ? 700 : 900) * (s.goal[i] - s.press[i]) - (up ? 23 : 60) * s.vel[i]) * h;
            s.press[i] = Math.max(0, Math.min(1.6, s.press[i] + s.vel[i] * h));
          }
          if (s.phase === "rest") {
            // sitting on a film of water: a push moves it and it drifts back
            s.vx += (-90 * s.bx - 13 * s.vx) * h; s.bx += s.vx * h;
            s.vz += (-90 * s.bz - 13 * s.vz) * h; s.bz += s.vz * h;
            s.vyaw += (-70 * s.yaw - 9 * s.vyaw) * h; s.yaw += s.vyaw * h;
          } else if (s.phase === "wind") {
            // drawn back, like a finger about to flick it
            s.clock += h;
            const e = Math.min(1, s.clock / 0.2), ease = e * e * (3 - 2 * e);
            s.bx = -0.26 * ease; s.yaw = -0.05 * ease;
            if (e >= 1) { s.phase = "away"; s.vx = 15; s.vz = 2.6; s.vyaw = 1.5; s.trail = [s.bx, s.bz, s.bx, s.bz]; s.trailA = 1; }
          } else if (s.phase === "away") {
            s.vx *= Math.exp(-0.35 * h); s.bx += s.vx * h; s.bz += s.vz * h; s.yaw += s.vyaw * h;
            s.trail[2] = s.bx; s.trail[3] = s.bz;
            if (s.bx > 6.2) {
              // out of sight: a fresh bar comes in from the near corner
              s.text = ""; restamp(""); s.press.fill(0); s.vel.fill(0); s.goal.fill(0);
              s.phase = "in"; s.bx = -6.6; s.bz = -2.2; s.yaw = 0.6; s.vx = 15; s.vz = 5; s.vyaw = -1.4;
            }
          } else {
            s.vx += (-30 * s.bx - 9.6 * s.vx) * h; s.bx += s.vx * h;
            s.vz += (-30 * s.bz - 9.6 * s.vz) * h; s.bz += s.vz * h;
            s.vyaw += (-26 * s.yaw - 6.4 * s.vyaw) * h; s.yaw += s.vyaw * h;
            if (Math.abs(s.bx) < 0.004 && Math.abs(s.vx) < 0.02 && Math.abs(s.yaw) < 0.003 && Math.abs(s.vyaw) < 0.02) s.phase = "rest";
          }
        }
        if (s.phase === "rest" || s.phase === "in") s.trailA = Math.max(0, s.trailA - dt * (s.phase === "in" ? 0.25 : 0.5));
        for (let i = 0; i < SLOTS; i++) if (Math.abs(s.goal[i] - s.press[i]) > 0.002 || Math.abs(s.vel[i]) > 0.01) moving = true;
        if (s.phase !== "rest" || s.trailA > 0 || Math.abs(s.vx) > 0.002 || Math.abs(s.vyaw) > 0.002 || Math.abs(s.bx) > 0.0005 || Math.abs(s.yaw) > 0.0005) moving = true;
      }
      if (!still) {
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        moving = true;
      }

      const fast = s.phase !== "rest" || Math.abs(s.vx) > 0.05;
      let quick = false;
      for (let i = 0; i < SLOTS; i++) if (Math.abs(s.vel[i]) > 0.4) quick = true;
      if (s.fresh || !canAcc) { draw(1, 0, now); s.fresh = false; s.count = 1; }
      else if (moving) { draw(fast ? 1 : quick ? 0.5 : still ? 0.5 : 0.1, 1 + (s.frame % 64), now); s.count = still ? 1 : 6; }
      else if (s.count < 40) { s.count++; draw(1 / s.count, s.count, now); }
      if (s.first) { s.first = false; setShown("gl"); }

      // measured, not guessed: if frames run long for a while, give up some resolution
      if (!still && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 45 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.heal || s.count < 40 || (!still && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    // the bar loads already stamped, at full depth
    s.text = START; restamp(START);
    for (let i = 0; i < START.length; i++) { s.press[i] = 1; s.goal[i] = 1; }
    s.demoText = ""; s.demoN = 0;
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!still) wake();
    };
    const leave = () => { s.px = 0; s.py = 0; };
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const change = (v: string) => {
    setValue(v); setMode("idle"); setNote(copy.hint);
    api.current?.type(v, true);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { setNote(copy.bad); api.current?.no(); field.current?.focus(); return; }
    // nothing is posted anywhere: the bar slides away and the field empties
    const ok = api.current ? api.current.send(true) : true;
    if (!ok) return;
    setMode("sent"); setNote(copy.done(v)); setValue("");
  };
  const head = mode === "sent" ? copy.sent : copy.idle;

  return (
    <section className="relative isolate overflow-hidden bg-[#0c3527] text-[#f6efe2]" style={{ fontFamily: FONT }}>
      <div ref={stage} className="relative mx-auto h-[760px] w-full max-w-[1600px]" style={{ background: "linear-gradient(#0a2f23 0%, #0e3d2c 45%, #15583f 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" onPointerDown={() => field.current?.focus({ preventScroll: true })} className={`absolute inset-0 h-full w-full cursor-text transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />

        {shown === "still" && <Still value={value} />}

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end px-6 pb-8 sm:px-10 lg:justify-start lg:px-16 lg:pb-0 lg:pt-14">
          <p className="hidden text-[11px] font-medium uppercase tracking-[0.34em] text-[#f6efe2]/70 lg:block">Morrow soap works <span className="mx-2 text-[#f6efe2]/35">/</span> the house letter</p>
          <h2 className="text-[54px] leading-[0.9] tracking-[-0.035em] sm:text-[72px] lg:mt-8 lg:text-[88px]" style={{ fontFamily: SERIF }}>
            <span className="block">{head[0]}</span>
            <span className="block italic text-[#ff9d92]">{head[1]}</span>
          </h2>
          <form onSubmit={submit} noValidate className="pointer-events-auto mt-6 w-full max-w-[25rem] lg:mt-9">
            <label htmlFor="rose-soap-bar-email" className="block text-[11px] font-medium uppercase tracking-[0.3em] text-[#f6efe2]/75">{LABEL}</label>
            <div className="mt-2 flex items-end gap-3 border-b border-[#f6efe2]/45 pb-2 transition-colors focus-within:border-[#ff9d92]">
              <input
                ref={field}
                id="rose-soap-bar-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={MAX_CHARS}
                value={value}
                onChange={(e) => change(e.target.value)}
                placeholder="you@yours.com"
                aria-describedby="rose-soap-bar-note"
                className="h-11 min-w-0 flex-1 bg-transparent text-[22px] font-medium tracking-[-0.02em] text-[#f6efe2] caret-[#ff9d92] outline-none placeholder:text-[#f6efe2]/40 focus-visible:outline-none"
              />
              <button type="submit" className="h-11 shrink-0 rounded-full bg-[#ff9d92] px-5 text-[14px] font-semibold tracking-[-0.01em] text-[#0c2a20] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff9d92] active:translate-y-0 active:scale-95 motion-reduce:transition-none">Send it off</button>
            </div>
            <p id="rose-soap-bar-note" aria-live="polite" className="mt-3 min-h-[2.6em] text-[14px] leading-snug text-[#f6efe2]/80">{note}</p>
          </form>
        </div>
        <p className="pointer-events-none absolute right-16 top-14 hidden text-[11px] uppercase tracking-[0.3em] text-[#f6efe2]/60 lg:block">Type, then press return</p>
      </div>
    </section>
  );
}
