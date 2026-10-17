import { useEffect, useRef, useState } from "react";

// Everything a visitor would edit first.
const product = {
  house: "Maison Ostra",
  kind: "Eau de parfum 07",
  word: "Mirage", // painted on the back wall, as wide as the frame
  line: "Neroli, sea salt and warm cedar, bottled at the hour the light turns gold.",
  cta: "Reserve a bottle",
  note: "50 ml, refillable",
};
// Colours of the set, in linear light (0 to 1), not screen values.
const PAPER = [0.92, 0.33, 0.4]; // the paper sweep
const INK = [0.5, 0.006, 0.03]; // paint of the giant word
const SCENT = [0.1, 0.92, 3.3]; // how fast the liquid swallows red, green and blue per unit of depth
const CAP = [0.012, 0.05, 0.5]; // lacquered ball stopper
const STAND = 1; // which letter of the word the bottle stands in front of (0 is the first)
const HERO = 0.42; // resting turn of the bottle in radians
const FILL = 1.4; // height of the liquid surface
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const v3 = (c: number[]) => `vec3(${c.map((n) => n.toFixed(4)).join(", ")})`;

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 tone(vec3 x){ vec3 c = 1.0 - exp(-max(x, 0.0) * 1.06); c = mix(c, c * c * (3.0 - 2.0 * c), 0.42); return pow(c, vec3(1.0 / 2.2)); }
`;

// The photograph: a paper sweep with the word painted on it, and a bottle traced through glass, scent and trapped air.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uDirect;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform float uRot; uniform float uBx; uniform vec3 uSurf; uniform vec3 uSun; uniform vec4 uText;
uniform sampler2D uTex; uniform sampler2D uLab; uniform vec2 uLod;
const float ZW = 2.4; const float RC = 0.6; const float TOP = 5.6;
const float H = 1.66; const vec2 HB = vec2(0.76, 0.36); const float RB = 0.3;
const float IG = 1.5; const float IL = 1.36; const float FILLH = ${FILL.toFixed(3)};
const vec3 PAPER = ${v3(PAPER)}; const vec3 INK = ${v3(INK)}; const vec3 SCENT = ${v3(SCENT)}; const vec3 CAPC = ${v3(CAP)};
const vec3 GOLD = vec3(1.0, 0.74, 0.36);
const vec3 SUNC = vec3(1.0, 0.94, 0.84);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }

// The bottle has its own frame: it stands at uBx and turns about its axis.
vec3 toLocalDir(vec3 v){ float s = sin(uRot); float c = cos(uRot); return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); }
vec3 toWorldDir(vec3 v){ float s = sin(uRot); float c = cos(uRot); return vec3(c * v.x - s * v.z, v.y, s * v.x + c * v.z); }
vec3 toLocal(vec3 p){ return toLocalDir(vec3(p.x - uBx, p.y, p.z)); }
vec3 toWorld(vec3 q){ vec3 p = toWorldDir(q); p.x += uBx; return p; }

float box2(vec2 p, vec2 b, float r){ vec2 d = abs(p) - b + r; return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r; }
// A slab with a rounded plan, standing from y0 to y1, with its own radius on the bottom and top edges.
float slab(vec3 q, vec2 b, float r, float y0, float y1, float eb, float et){
  float d2 = box2(q.xz, b, r); float mid = 0.5 * (y0 + y1); float e = q.y > mid ? et : eb;
  vec2 w = vec2(d2 + e, abs(q.y - mid) - 0.5 * (y1 - y0) + e);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - e;
}
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float dOut(vec3 q){
  float body = slab(q, HB, RB, 0.0, H, 0.045, 0.15);
  float neck = max(length(q.xz) - 0.185, abs(q.y - (H + 0.04)) - 0.1);
  return smin(body, neck, 0.07);
}
float dCav(vec3 q){ return slab(q, HB - 0.07, RB - 0.07, 0.3, H - 0.085, 0.16, 0.12); }
float dBall(vec3 q){ return length(q - vec3(0.0, H + 0.47, 0.0)) - 0.36; }
float dCollar(vec3 q){ vec2 w = vec2(length(q.xz) - 0.225, abs(q.y - (H + 0.095)) - 0.075) + 0.018; return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.018; }
float dCap(vec3 q){ return min(dBall(q), dCollar(q)); }
float map(vec3 p){ vec3 q = toLocal(p); return min(dOut(q), dCap(q)); }

vec2 bound(vec3 ro, vec3 rd){
  vec2 o = ro.xz - vec2(uBx, 0.0);
  float a = dot(rd.xz, rd.xz); float b = dot(o, rd.xz); float c = dot(o, o) - 0.86;
  float h = b * b - a * c; if (h < 0.0 || a < 1e-6) return vec2(1.0, -1.0);
  h = sqrt(h); float t0 = (-b - h) / a; float t1 = (-b + h) / a;
  if (abs(rd.y) > 1e-5) { float ya = -ro.y / rd.y; float yb = (2.52 - ro.y) / rd.y; t0 = max(t0, min(ya, yb)); t1 = min(t1, max(ya, yb)); }
  else if (ro.y < 0.0 || ro.y > 2.52) return vec2(1.0, -1.0);
  return vec2(max(t0, 0.0), t1);
}
float march(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 72; i++) { float d = map(ro + rd * t); if (d < 0.0007) return t; t += d * 0.9; if (t > tb.y) break; }
  return -1.0;
}
float marchCap(vec3 ro, vec3 rd){
  float t = 0.01;
  for (int i = 0; i < 26; i++) { float d = dCap(toLocal(ro + rd * t)); if (d < 0.0015) return t; t += d; if (t > 2.4) break; }
  return -1.0;
}
vec3 nOut(vec3 q){ vec2 e = vec2(0.0016, -0.0016); return normalize(e.xyy * dOut(q + e.xyy) + e.yyx * dOut(q + e.yyx) + e.yxy * dOut(q + e.yxy) + e.xxx * dOut(q + e.xxx)); }
vec3 nCav(vec3 q){ vec2 e = vec2(0.0016, -0.0016); return normalize(e.xyy * dCav(q + e.xyy) + e.yyx * dCav(q + e.yyx) + e.yxy * dCav(q + e.yxy) + e.xxx * dCav(q + e.xxx)); }
vec3 nCap(vec3 q){ vec2 e = vec2(0.0016, -0.0016); return normalize(e.xyy * dCap(q + e.xyy) + e.yyx * dCap(q + e.yyx) + e.yxy * dCap(q + e.yxy) + e.xxx * dCap(q + e.xxx)); }

// The studio the camera stands in: a dark room with a window-shaped softbox, a strip, a scrim overhead and the lamp itself.
vec3 env(vec3 rd){
  float el = asin(clamp(rd.y, -1.0, 1.0)); float az = atan(rd.x, -rd.z);
  vec3 c = mix(vec3(0.035, 0.03, 0.032), vec3(0.2, 0.17, 0.175), smoothstep(-0.05, 0.5, rd.y));
  c += vec3(1.0, 0.985, 0.97) * 2.6 * smoothstep(0.75, 1.15, el);
  vec2 w = abs(vec2(az + 0.66, el - 0.5)) - vec2(0.4, 0.3);
  float bars = smoothstep(0.012, 0.024, abs(az + 0.66)) * smoothstep(0.012, 0.024, abs(el - 0.5));
  c += vec3(1.0, 0.98, 0.95) * 7.0 * smoothstep(0.02, -0.02, max(w.x, w.y)) * bars;
  vec2 w2 = abs(vec2(az - 1.05, el - 0.32)) - vec2(0.11, 0.6);
  c += vec3(0.95, 0.97, 1.0) * 4.2 * smoothstep(0.03, -0.03, max(w2.x, w2.y));
  vec2 w3 = abs(vec2(az + 1.9, el - 0.2)) - vec2(0.3, 0.42);
  c += vec3(1.0, 0.9, 0.9) * 1.5 * smoothstep(0.1, -0.1, max(w3.x, w3.y));
  // a tall lightbox that reaches the floor, camera left: the flat faces of the glass pick up its edge
  c += vec3(1.0, 0.97, 0.95) * 8.0 * smoothstep(0.012, -0.012, abs(az + 1.0) - 0.25) * smoothstep(-0.8, -0.3, el) * smoothstep(0.5, 0.25, el);
  c += SUNC * 34.0 * smoothstep(0.9955, 0.9988, dot(rd, uSun));
  return c;
}

// How much of the lamp reaches a point on the paper: a soft shadow, and inside it the light the glass and the scent let through.
vec3 sunVis(vec3 p, float jit){
  vec2 tb = bound(p, uSun); if (tb.x > tb.y) return vec3(1.0);
  float res = 1.0; float t = max(tb.x, 0.02);
  for (int i = 0; i < 22; i++) { float h = map(p + uSun * t); res = min(res, 11.0 * h / t); t += clamp(h, 0.03, 0.35); if (res < 0.005 || t > tb.y) break; }
  res = clamp(res, 0.0, 1.0); res = res * res * (3.0 - 2.0 * res);
  if (res > 0.995) return vec3(1.0);
  vec3 pn = normalize(vec3(uSurf.x, 1.0, uSurf.y));
  float t0 = max(tb.x, 0.0); float dt = (tb.y - t0) / 12.0; float tt = t0 + dt * jit;
  float deep = 0.0; float liq = 0.0; float gls = 0.0; float opq = 0.0;
  for (int i = 0; i < 12; i++) {
    vec3 q = toLocal(p + uSun * tt);
    float dg = dOut(q);
    if (dCap(q) < 0.0) opq = 1.0;
    if (dg < 0.0) { deep = max(deep, -dg); if (dCav(q) > 0.0) gls += dt; else if (dot(q, pn) < uSurf.z) liq += dt; }
    tt += dt;
  }
  float core = smoothstep(0.03, 0.3, deep);
  // the bright threads a lens of liquid draws on the table
  vec2 al = normalize(uSun.xz); vec2 fq = vec2(dot(p.xz, vec2(-al.y, al.x)), dot(p.xz, al));
  float thread = n2(vec2(fq.x * 21.0 + 1.6 * n2(fq * 1.6), fq.y * 0.7));
  vec3 thru = exp(-SCENT * liq * 0.85 - vec3(0.5, 0.16, 0.3) * gls) * (0.1 + 1.9 * core * core * (0.4 + 1.5 * thread * thread * thread)) * (1.0 - opq);
  return mix(thru, vec3(1.0), res);
}

// Everything that is not the bottle: floor, cove and wall of one sheet of paper, lit by the lamp and by the room.
vec3 stage(vec3 ro, vec3 rd, float full, float jit, float blur){
  float t = 1e9; vec3 n = vec3(0.0, 1.0, 0.0);
  if (rd.y < 0.0) { float tf = -ro.y / rd.y; float z = ro.z + rd.z * tf; if (z < -3.7 && full < 0.5) return env(rd); if (z < ZW - RC) t = tf; }
  if (t > 1e8 && rd.z > 0.0) { float tw = (ZW - ro.z) / rd.z; float y = ro.y + rd.y * tw; if (y > TOP) return env(rd); if (y > RC) { t = tw; n = vec3(0.0, 0.0, -1.0); } }
  if (t > 1e8) {
    vec2 o = ro.yz - vec2(RC, ZW - RC); float a = dot(rd.yz, rd.yz); float b = dot(o, rd.yz); float h = b * b - a * (dot(o, o) - RC * RC);
    if (h > 0.0 && a > 1e-7) { float tc = (-b + sqrt(h)) / a; vec2 pc = ro.yz + rd.yz * tc; if (tc > 0.0 && pc.x < RC + 0.02 && pc.y > ZW - RC - 0.02) { t = tc; vec2 nn = (vec2(RC, ZW - RC) - pc) / RC; n = vec3(0.0, nn.x, nn.y); } }
  }
  if (t > 1e8) return env(rd);
  vec3 p = ro + rd * t;
  float onWall = smoothstep(ZW - RC - 0.05, ZW - RC + 0.05, p.z);
  vec2 uv = (p.xy - uText.xy) / uText.zw * 0.5 + 0.5;
  float ink = TEXL(uTex, vec2(uv.x, 1.0 - uv.y), uLod.x + blur).r * onWall * step(abs(uv.x - 0.5), 0.5) * step(abs(uv.y - 0.5), 0.5);
  // paper: a fine tooth and slow mottling, the paint a little glossier than the sheet
  vec2 pq = p.xy + p.z * vec2(0.37, 0.81);
  float tooth = 0.5 * (n2(pq * 150.0) - 0.5) + 0.3 * (n2(pq * 61.0 + 7.0) - 0.5) + 0.35 * (n2(pq * vec2(9.0, 240.0)) - 0.5); float mott = n2(pq * 1.7) - 0.5;
  vec3 alb = mix(PAPER * (1.0 + 0.07 * tooth + 0.05 * mott), INK * (1.0 + 0.2 * tooth), ink);
  float ndl = max(dot(n, uSun), 0.0);
  vec3 vis = vec3(1.0); float occ = 1.0;
  float dB = map(p + n * 0.04);
  if (full > 0.5 && ndl > 0.0) vis = sunVis(p + n * 0.004, jit);
  else vis = vec3(0.35 + 0.65 * smoothstep(0.0, 0.7, dB));
  occ = 0.42 + 0.58 * smoothstep(0.0, 0.42, dB);
  occ *= 1.0 - 0.2 * exp(-max(dB, 0.0) * 1.6);
  // a second light washes the backdrop behind the bottle and falls away to the corners
  float wash = exp(-dot(p.xy - vec2(uBx * 0.6, 1.3), p.xy - vec2(uBx * 0.6, 1.3)) / 15.0);
  vec3 fill = mix(PAPER * 1.5 + 0.12, vec3(1.0, 0.985, 0.97), 0.5 + 0.5 * n.y) * (1.05 + (1.05 * wash - 0.22) * (1.0 - n.y));
  vec3 col = alb * (SUNC * 2.9 * ndl * vis + fill * occ * (1.0 - 0.2 * n.y));
  // the lamp skims the painted letters
  col += ink * 0.05 * fill;
  return col;
}

struct Ray { vec3 p; vec3 d; vec3 att; float ink; };
// One ray carried through the bottle, in the bottle's frame: glass, scent, the air trapped above it, and out again.
Ray inside(vec3 pos, vec3 dir){
  Ray r; float med = 1.0; float liq = 0.0; float gls = 0.0; r.ink = 0.0;
  vec3 pn = normalize(vec3(uSurf.x, 1.0, uSurf.y));
  for (int b = 0; b < 7; b++) {
    float m = med; vec3 prev = pos;
    for (int i = 0; i < 22; i++) {
      float a = dOut(pos); float c = dCav(pos); float pl = dot(pos, pn) - uSurf.z;
      m = a > 0.0 ? 0.0 : c > 0.0 ? 1.0 : pl < 0.0 ? 2.0 : 3.0;
      if (m != med) break;
      float d = min(abs(a), abs(c)); if (c < 0.0) d = min(d, abs(pl));
      float st = max(d, 0.006);
      if (med > 1.5 && med < 2.5) liq += st; else if (med < 1.5) gls += st;
      prev = pos; pos += dir * st;
    }
    if (m == med) break;
    vec3 n = (med < 0.5 || m < 0.5) ? nOut(pos) : (med < 1.5 || m < 1.5) ? nCav(pos) : pn;
    if (m < 0.5 && n.z < -0.9) {
      // the back of the printed label
      vec2 lu = (pos.xy - vec2(0.0, 0.92)) / 0.46 * 0.5 + 0.5;
      if (abs(lu.x - 0.5) < 0.5 && abs(lu.y - 0.5) < 0.5 && TEXL(uLab, vec2(lu.x, 1.0 - lu.y), uLod.y).r > 0.5) { r.ink = 1.0; break; }
    }
    if (dot(n, dir) > 0.0) n = -n;
    float n1 = med < 0.5 ? 1.0 : med < 1.5 ? IG : med < 2.5 ? IL : 1.0;
    float n2i = m < 0.5 ? 1.0 : m < 1.5 ? IG : m < 2.5 ? IL : 1.0;
    vec3 rf = refract(dir, n, n1 / n2i);
    if (dot(rf, rf) < 0.5) { dir = reflect(dir, n); pos = prev; }
    else { dir = rf; med = m; if (m < 0.5) break; }
  }
  r.p = pos; r.d = dir; r.att = exp(-SCENT * liq - vec3(0.34, 0.1, 0.2) * gls);
  return r;
}

vec3 shadeCap(vec3 p, vec3 rd, vec2 rnd){
  vec3 q = toLocal(p); vec3 nl = nCap(q); vec3 n = toWorldDir(nl);
  vec3 r = reflect(rd, n);
  float nv = clamp(dot(-rd, n), 0.0, 1.0);
  vec3 amb = mix(PAPER * 1.7, vec3(1.0, 0.985, 0.97), 0.5 + 0.5 * n.y) * 1.1;
  if (dBall(q) < dCollar(q)) {
    // lacquer: deep colour under a hard clear coat
    float ao = 0.35 + 0.65 * smoothstep(H + 0.14, H + 0.5, q.y);
    vec3 col = CAPC * (SUNC * 2.5 * max(dot(n, uSun), 0.0) + amb * ao);
    float f = 0.045 + 0.955 * pow(1.0 - nv, 5.0);
    return col + f * stage(p + n * 0.01, r, 0.0, 0.0, 2.0) * (0.5 + 0.5 * ao);
  }
  // spun gold collar
  r = normalize(r + vec3(rnd.x, rnd.y * 3.0, rnd.x) * 0.04);
  float ao = 0.3 + 0.7 * smoothstep(0.0, 0.16, H + 0.19 - q.y) * smoothstep(-0.02, 0.07, q.y - H - 0.0);
  vec3 f = GOLD + (1.0 - GOLD) * pow(1.0 - nv, 5.0);
  return f * (stage(p + n * 0.01, r, 0.0, 0.0, 2.0) * ao + 0.05 * amb);
}

vec3 shadeBottle(vec3 p, vec3 rd, vec2 rnd, float jit){
  vec3 q = toLocal(p);
  if (dCap(q) < dOut(q)) return shadeCap(p, rd, rnd);
  vec3 nl = nOut(q); vec3 rl = toLocalDir(rd); vec3 n = toWorldDir(nl);
  float nv = clamp(dot(-rd, n), 0.0, 1.0);
  float f = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
  vec3 refl = stage(p + n * 0.01, reflect(rd, n), 0.0, 0.0, 1.0);
  Ray r = inside(q - nl * 0.008, refract(rl, nl, 1.0 / IG));
  vec3 col;
  if (r.ink > 0.5) col = vec3(0.5, 0.46, 0.44);
  else {
    vec3 wp = toWorld(r.p); vec3 wd = toWorldDir(r.d);
    float tc = wd.y > -0.2 ? marchCap(wp, wd) : -1.0;
    if (tc > 0.0) col = shadeCap(wp + wd * tc, wd, rnd);
    else {
      // glass splits colour a little: red leaves bent slightly less than blue
      vec3 dv = (wd - rd) * 0.03;
      col = stage(wp, wd, 1.0, jit, 1.0);
      col.r = stage(wp, normalize(wd - dv), 1.0, jit, 1.0).r; col.b = stage(wp, normalize(wd + dv), 1.0, jit, 1.0).b;
    }
  }
  col = col * r.att * (1.0 - f) + refl * f;
  if (nl.z < -0.9) {
    // a few beads of air cling to the inside of the glass under the surface of the scent
    vec3 pn = normalize(vec3(uSurf.x, 1.0, uSurf.y));
    for (int i = 0; i < 9; i++) {
      float fi = float(i);
      vec2 bp = vec2((h21(vec2(fi, 3.7)) - 0.5) * 1.24, FILLH - 0.014 - 0.11 * h21(vec2(fi, 9.1)) * h21(vec2(fi, 5.3)));
      float br = 0.006 + 0.011 * h21(vec2(fi, 1.9));
      vec2 dq = (q.xy - bp) / br; float dd = length(dq);
      if (dd < 1.0 && dot(vec3(bp.x, bp.y + br, -HB.y + 0.07), pn) < uSurf.z) {
        col *= mix(0.5, 1.12, smoothstep(1.0, 0.55, dd));
        col += vec3(1.0, 0.95, 0.85) * (1.6 * smoothstep(0.34, 0.1, length(dq - vec2(-0.38, 0.4))) + 0.5 * smoothstep(0.3, 0.1, length(dq - vec2(0.42, -0.46))));
      }
    }
  }
  if (nl.z < -0.9) {
    // screen print on the front face: white enamel, lit from the room
    vec2 lu = (q.xy - vec2(0.0, 0.92)) / 0.46 * 0.5 + 0.5;
    float m = TEXL(uLab, vec2(lu.x, 1.0 - lu.y), uLod.y).r * step(abs(lu.x - 0.5), 0.5) * step(abs(lu.y - 0.5), 0.5);
    col = mix(col, vec3(1.0, 0.975, 0.95) * 1.5 + refl * f, m * 0.94);
  }
  return col;
}

void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * uJit.z + up * uJit.w; rd = normalize(fp - ro);
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uSeed);
  float ang = ign * 6.2831853; float rr = sqrt(fract(ign * 7.13 + uSeed * 3.7));
  vec2 rnd = vec2(cos(ang), sin(ang)) * rr * step(0.001, uSeed);
  float jit = uSeed > 0.001 ? ign : 0.5;
  float t = march(ro, rd);
  vec3 col = t > 0.0 ? shadeBottle(ro + rd * t, rd, rnd, jit) : stage(ro, rd, 1.0, jit, 0.0);
  col = min(col, vec3(14.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the negative: a little bloom off the hot glints, the film curve, a soft vignette and grain.
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
  c = max(c + (c - nb * 0.25) * 0.4, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 20.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.022 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 2.5, 0.0), vec3(8.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.016;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.2 * smoothstep(0.35, 1.25, length(q));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.02 * (1.0 - 0.4 * c.g);
  outC = vec4(c, 1.0);
}
`;

// The word, set once on a 2D canvas as tightly as it will go. Returns how much of the width the ink fills.
function wordPlate(word: string, W: number) {
  const Hh = W / 2;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = Hh;
  const g = cv.getContext("2d");
  const chars0 = [...word];
  if (!g) return { cv, frac: 0.95, tall: 0.6, dot: 0.5, mids: chars0.map(() => 0) };
  g.fillStyle = "#000"; g.fillRect(0, 0, W, Hh);
  const px = 400, track = -0.052 * px, chars = [...word];
  g.font = `800 ${px}px ${FONT}`;
  // each letter keeps its kerning against the ones before it, then the whole line is pulled tighter
  const xs = chars.map((_, i) => g.measureText(chars.slice(0, i).join("")).width + i * track);
  const m = g.measureText(word);
  const total = m.width + (chars.length - 1) * track;
  const asc = m.actualBoundingBoxAscent || px * 0.73, desc = m.actualBoundingBoxDescent || px * 0.2;
  const k = Math.min((W * 0.95) / total, (Hh * 0.93) / (asc + desc));
  g.font = `800 ${px * k}px ${FONT}`;
  g.fillStyle = "#fff"; g.textBaseline = "alphabetic";
  const x0 = (W - total * k) / 2, y0 = (Hh + (asc - desc) * k) / 2;
  chars.forEach((ch, i) => g.fillText(ch, x0 + xs[i] * k, y0));
  // where the middle of each letter falls, from -1 at the left edge of the plate to 1 at the right
  const mids = chars.map((ch, i) => ((x0 + xs[i] * k + g.measureText(ch).width * 0.5) / W) * 2 - 1);
  // and how high the dot of an i sits, from -1 at the bottom of the plate to 1 at the top
  const mi = g.measureText("i");
  const dot = 1 - (2 * (y0 - ((mi.actualBoundingBoxAscent || px * k * 0.75) - mi.width * 0.34))) / Hh;
  return { cv, frac: (total * k) / W, tall: ((asc + desc) * k) / Hh, dot, mids };
}

// What is screen printed on the glass.
function labelPlate() {
  const S = 1024;
  const cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const g = cv.getContext("2d");
  if (!g) return cv;
  g.fillStyle = "#000"; g.fillRect(0, 0, S, S);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
  const spaced = (text: string, y: number, size: number, gap: number, weight: number) => {
    g.font = `${weight} ${size}px ${FONT}`;
    const chars = [...text.toUpperCase()];
    const w = chars.reduce((a, c) => a + g.measureText(c).width + gap, -gap);
    let x = S / 2 - w / 2;
    for (const c of chars) { const cw = g.measureText(c).width; g.fillText(c, x + cw / 2, y); x += cw + gap; }
  };
  spaced(product.house, 250, 50, 30, 600);
  g.font = `italic 400 250px ${SERIF}`;
  g.fillText(product.word, S / 2, 480);
  g.fillRect(S / 2 - 70, 668, 140, 5);
  spaced(product.kind, 760, 40, 17, 500);
  spaced(product.note.split(",")[0], 846, 36, 15, 500);
  return cv;
}

// No WebGL: the same set built from CSS, standing in front of the real heading with its stopper over the dot of the i.
function Still() {
  const glass = "linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(255,226,232,0.5) 5%, rgba(255,214,222,0.16) 14%, rgba(255,214,222,0.12) 86%, rgba(255,236,240,0.55) 95%, rgba(255,255,255,0.8) 100%)";
  return (
    <div aria-hidden="true" className="absolute left-1/2 top-[118px] h-[510px] w-[300px] origin-top -translate-x-1/2 scale-[0.56] sm:scale-75 lg:left-[32.9%] lg:top-[122px] lg:scale-100">
      {/* the shadow, with the gold light the scent lets through */}
      <div className="absolute left-[46%] top-[452px] h-[120px] w-[430px] origin-top-left skew-x-[52deg] blur-[5px]" style={{ background: "linear-gradient(180deg, rgba(180,70,90,0.5) 0%, rgba(190,80,100,0.38) 55%, rgba(190,80,100,0) 100%)" }} />
      <div className="absolute left-[52%] top-[470px] h-[78px] w-[250px] origin-top-left skew-x-[52deg] blur-[3px]" style={{ background: "repeating-linear-gradient(90deg, rgba(255,214,120,0.95) 0 9px, rgba(255,170,70,0.5) 9px 17px, rgba(255,226,150,0.9) 17px 22px, rgba(255,160,60,0.35) 22px 36px)", maskImage: "linear-gradient(180deg, #000, transparent)", WebkitMaskImage: "linear-gradient(180deg, #000, transparent)" }} />
      {/* stopper and collar */}
      <div className="absolute left-1/2 top-0 h-[142px] w-[142px] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(circle at 36% 30%, #7f92ff 0%, #3145d6 22%, #1b2cae 52%, #121c7c 78%, #6a4fa8 100%)", boxShadow: "inset -9px -12px 22px rgba(246,150,176,0.35), inset 6px 6px 14px rgba(160,180,255,0.35)" }}>
        <span className="absolute left-[30%] top-[22%] grid h-[30px] w-[34px] -rotate-6 grid-cols-2 gap-[3px] opacity-80">
          <span className="rounded-[2px] bg-white/80" /><span className="rounded-[2px] bg-white/80" /><span className="rounded-[2px] bg-white/70" /><span className="rounded-[2px] bg-white/70" />
        </span>
      </div>
      <div className="absolute left-1/2 top-[130px] h-[30px] w-[92px] -translate-x-1/2 rounded-[5px]" style={{ background: "linear-gradient(90deg,#5c3d10 0%,#e7c57c 14%,#fff3cf 24%,#b7862d 44%,#6e4a14 58%,#f1d38b 78%,#8a6420 100%)" }} />
      {/* the glass */}
      <div className="absolute inset-x-0 top-[156px] h-[346px] overflow-hidden rounded-[34px_34px_16px_16px]" style={{ background: glass, boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.9), inset 0 2px 10px rgba(255,255,255,0.8), inset 0 0 0 3px rgba(190,60,90,0.18)" }}>
        <div className="absolute inset-x-[12px] bottom-[62px] top-[72px] overflow-hidden rounded-[8px_8px_26px_26px]" style={{ background: "linear-gradient(180deg,#f0791c 0%,#f08a25 45%,#f6a548 100%)", boxShadow: "inset 0 4px 0 rgba(255,214,130,0.95), inset 14px 0 18px -8px rgba(190,60,10,0.7), inset -14px 0 18px -8px rgba(190,60,10,0.7)" }}>
          {/* stems of the letters behind, seen through the scent */}
          <span className="absolute left-[6%] top-0 h-[52%] w-[26%] bg-[#dc2c1c]" /><span className="absolute left-[39%] top-0 h-[52%] w-[24%] bg-[#dc2c1c]" /><span className="absolute right-[3%] top-0 h-[52%] w-[16%] bg-[#dc2c1c]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[62px]" style={{ background: "linear-gradient(180deg, rgba(255,226,230,0.6), rgba(255,240,242,0.75) 60%, rgba(214,120,140,0.5) 86%, rgba(255,236,240,0.8))" }} />
        <div className="absolute bottom-4 left-[14px] top-5 w-[7px] rounded-full bg-white/80 blur-[1px]" />
        <div className="absolute inset-x-0 top-[104px] text-center text-white">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.5em]">{product.house}</span>
          <span className="mt-2 block text-[54px] italic leading-none" style={{ fontFamily: SERIF }}>{product.word}</span>
          <span className="mx-auto mt-4 block h-[1.5px] w-9 bg-white" />
          <span className="mt-4 block text-[9px] font-semibold uppercase tracking-[0.34em]">{product.kind}</span>
        </div>
      </div>
    </div>
  );
}

export default function RayMarchedPerfumeBottleHero() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const api = useRef<{ spin: () => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current, pad = hit.current;
    if (!box || !cv || !pad) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts = { antialias: false, alpha: false, powerPreference: "high-performance" as const };
    const gl2 = cv.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? cv.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) { setShown("still"); return; }
    const canAcc = !!gl2 && (!!gl2.getExtension("EXT_color_buffer_float") || !!gl2.getExtension("EXT_color_buffer_half_float"));
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    const still = reduce || software; // nothing plays by itself: draw, refine, then rest

    const head = gl2 ? "#version 300 es\n#define ATTR in\n" : "#define ATTR attribute\n";
    const fhead = gl2 ? "#version 300 es\n#define texture2D texture\n#define TEXL(s, uv, l) textureLod(s, uv, l)\nprecision highp float;\nout vec4 outC;\n" : "#define outC gl_FragColor\n#define TEXL(s, uv, l) texture2D(s, uv)\n";
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
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uDirect", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uRot", "uBx", "uSurf", "uSun", "uText", "uTex", "uLab", "uLod"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const plate = (unit: number, src: HTMLCanvasElement) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, src);
      gl.generateMipmap(gl.TEXTURE_2D);
            // mip levels are chosen by hand in the shader, so there is no blockiness along the bottle's outline
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl2 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    };
    const plateW = Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE) as number, software || window.innerWidth < 700 ? 2048 : 4096);
    let word = wordPlate(product.word, plateW);
    let wordTex = plate(0, word.cv);
    plate(2, labelPlate());

    // The accumulation plate: every frame is one more exposure blended onto it.
    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.75, window.devicePixelRatio || 1) * scale;
      // never more than about two million pixels of tracing
      const k = Math.min(1, Math.sqrt(1.9e6 / (cssW * cssH * dpr * dpr)));
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

    const s = {
      a: HERO, v: 0, rest: HERO, drag: false, spinT: -1, spinFrom: HERO, spinDir: 1,
      tx: 0, tv: 0, tz: 0, tzv: 0, // the liquid surface leans on two springs
      px: 0, py: 0, sx: 0, sy: 0, sun: 0, count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, first: true, alive: true,
    };
    const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

    const draw = (alpha: number, sample: number) => {
      // three framings: desk and tablet, where the bottle stands in for a letter, and phone, where it stands under the word
      const desk = cssW >= 1024, wide = cssW >= 700, aspect = cssW / cssH;
      const dist = 8.9, el0 = wide ? 0.09 : 0.17, el = el0 - s.sy * 0.03, az = s.sx * 0.085;
      const foc = wide ? Math.min(2.3, 1.366 * aspect) : Math.min(2.3, (dist * aspect) / 3.2);
      const tgt = [0, wide ? 1.2 : 1.22, 0];
      const cam = [dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), -dist * Math.cos(az) * Math.cos(el)];
      const shift = desk ? 0 : wide ? 0.06 : 0.085;
      // the word is scaled to the width of wall the lens can see
      const camY = tgt[1] + dist * Math.sin(el0), botD = dist * Math.cos(el0), wallD = botD + 2.4;
      const seen = (wallD / foc) * aspect;
      const hw = (0.5 * (wide ? 0.93 : 0.94) * seen) / word.frac;
      // wide: the bottle stands in front of one letter, and seen from the lens its stopper lands on the dot of the i.
      // phone: it stands in the middle and the word hangs just under the top of the frame.
      const bx = wide ? (word.mids[STAND] ?? 0) * hw * (botD / wallD) : 0;
      const cy = wide ? camY + (2.13 - camY) * (wallD / botD) - word.dot * hw * 0.5 : camY + wallD * Math.tan(Math.atan((0.4 - shift) / foc) - el0) - word.tall * hw * 0.5;
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.042 : 0;
      const sa = -0.5 + s.sun, se = 0.7;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform3f(su.uCam, cam[0], cam[1], cam[2]); gl.uniform3f(su.uTgt, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFoc, foc);
      gl.uniform2f(su.uShift, 0, shift);
      gl.uniform1f(su.uFocus, dist);
      gl.uniform1f(su.uRot, s.a); gl.uniform1f(su.uBx, bx);
      const nl = Math.hypot(s.tx, 1, s.tz);
      gl.uniform3f(su.uSurf, s.tx, s.tz, FILL / nl);
      // the lamp stands behind the set, camera left, and leans over the top of the backdrop
      gl.uniform3f(su.uSun, Math.sin(sa) * Math.cos(se), Math.sin(se), Math.cos(sa) * Math.cos(se));
      gl.uniform4f(su.uText, 0, cy, hw, hw / 2);
      gl.uniform1i(su.uTex, 0); gl.uniform1i(su.uLab, 2);
      gl.uniform2f(su.uLod, Math.max(0, Math.log2(((plateW / (2 * hw)) * seen) / W)), Math.max(0, Math.log2((1024 / 0.92) * (dist / foc / H)) - 1.1));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, wide ? 0.42 : 0.5, 0.52);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    // one full turn, with a wind-up before it and a lean past the mark after it
    const back = (x: number) => { const c = 1.25; return x < 0.5 ? (Math.pow(2 * x, 2) * ((c + 1) * 2 * x - c)) / 2 : (Math.pow(2 * x - 2, 2) * ((c + 1) * (x * 2 - 2) + c) + 2) / 2; };
    const spin = (fromUser: boolean) => {
      if (fromUser) s.touched = true;
      if (reduce || s.drag || s.spinT >= 0) return;
      s.spinT = 0; s.spinFrom = s.rest; s.spinDir = fromUser ? -s.spinDir : 1; s.rest += Math.PI * 2 * s.spinDir;
      wake();
    };
    api.current = { spin: () => spin(true) };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible || !s.alive) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      // it opens finished, as if just set down: the scent is still rocking
      if (!s.t0) { s.t0 = now; s.demoAt = now + 4200; if (!still) { s.tx = 0.13; s.a = HERO - 0.12; } }
      // it opens finished and holds; then, until someone touches it, it turns once every few seconds
      if (!still && !s.touched && now > s.demoAt) { spin(false); s.demoAt = now + 8200; }

      let moving = false;
      if (!reduce) {
        let want = s.rest;
        if (s.spinT >= 0) {
          s.spinT += dt / 2.1;
          if (s.spinT >= 1) s.spinT = -1; else want = s.spinFrom + (s.rest - s.spinFrom) * back(s.spinT);
        }
        const v0 = s.v;
        if (!s.drag) {
          const stiff = s.spinT >= 0 ? 150 : 34, damp = s.spinT >= 0 ? 22 : 7.4;
          for (let i = 0; i < 3; i++) { s.v += (stiff * (want - s.a) - damp * s.v) * (dt / 3); s.a += s.v * (dt / 3); }
        }
        // the scent lags the glass: every change of speed leans its surface, and it rings down slowly
        const acc = Math.max(-60, Math.min(60, (s.v - v0) / Math.max(dt, 0.004)));
        for (let i = 0; i < 3; i++) {
          s.tv += (-150 * s.tx - 2.3 * s.tv - 0.85 * acc) * (dt / 3); s.tx += s.tv * (dt / 3);
          s.tzv += (-235 * s.tz - 2.9 * s.tzv + 0.5 * acc - 9 * s.tx * Math.abs(s.v) * 0.2) * (dt / 3); s.tz += s.tzv * (dt / 3);
        }
        s.tx = Math.max(-0.3, Math.min(0.3, s.tx)); s.tz = Math.max(-0.2, Math.min(0.2, s.tz));
        if (s.drag || s.spinT >= 0 || Math.abs(s.v) > 0.002 || Math.abs(want - s.a) > 0.0005 || Math.abs(s.tx) + Math.abs(s.tv) * 0.05 + Math.abs(s.tz) > 0.0015) moving = true;
        else { s.a = want; s.v = 0; s.tx = s.tv = s.tz = s.tzv = 0; }
      }
      if (!still) {
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        const t = (now - s.t0) / 1000;
        s.sun = Math.sin(t * 0.33) * 0.13 + s.sx * 0.1;
        moving = true;
      }
      const fast = Math.abs(s.v) > 0.2 || Math.abs(s.tv) > 0.25 || Math.abs(s.px - s.sx) + Math.abs(s.py - s.sy) > 0.02;
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(fast ? 0.62 : still ? 0.5 : 0.11, 1 + (s.frame % 64)); s.count = still ? 1 : 6; }
      else if (s.count < 48) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      // measured, not guessed: if frames run long for a while, give up some resolution
      if (!still && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 45 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 48) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible && s.alive) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    // if a web font arrives after the first frame, set the word again in it
    const fontIn = () => !!document.fonts?.check(`800 40px ${FONT.split(",")[0]}`);
    const hadFont = fontIn();
    document.fonts?.ready.then(() => {
      if (!s.alive || fontIn() === hadFont) return;
      gl.deleteTexture(wordTex);
      word = wordPlate(product.word, plateW); wordTex = plate(0, word.cv);
      s.count = 0; s.fresh = true; wake();
    });

    let downX = 0, moved = 0, id = -1, lastT = 0;
    const down = (e: PointerEvent) => {
      id = e.pointerId; downX = e.clientX; moved = 0; lastT = e.timeStamp; s.drag = true; s.touched = true; s.spinT = -1; s.v = 0;
      try { pad.setPointerCapture(id); } catch { /* the pointer is already gone */ }
      wake();
    };
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (s.drag && e.pointerId === id) {
        const dx = e.clientX - downX; downX = e.clientX; moved += Math.abs(dx);
        const da = -dx * 0.011, dtp = Math.max(0.008, (e.timeStamp - lastT) / 1000); lastT = e.timeStamp;
        s.a += da; s.v = s.v * 0.5 + (da / dtp) * 0.5;
      }
      if (!still || s.drag) wake();
    };
    const upFn = (e: PointerEvent) => {
      if (!s.drag || e.pointerId !== id) return;
      s.drag = false;
      if (moved < 5) { s.v = 0; s.rest = HERO + Math.PI * 2 * Math.round((s.a - HERO) / (Math.PI * 2)); spin(true); return; }
      // let it coast, then come to rest facing the lens again
      s.v = Math.max(-14, Math.min(14, s.v));
      s.rest = HERO + Math.PI * 2 * Math.round((s.a + s.v * 0.22 - HERO) / (Math.PI * 2));
      if (reduce) { s.a = s.rest; s.v = 0; s.count = 0; s.fresh = true; }
      wake();
    };
    const leave = () => { s.px = 0; s.py = 0; };
    pad.addEventListener("pointerdown", down);
    box.addEventListener("pointermove", move);
    pad.addEventListener("pointerup", upFn);
    pad.addEventListener("pointercancel", upFn);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      s.alive = false;
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      pad.removeEventListener("pointerdown", down); box.removeEventListener("pointermove", move);
      pad.removeEventListener("pointerup", upFn); pad.removeEventListener("pointercancel", upFn);
      box.removeEventListener("pointerleave", leave); cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-[#f4b6c0] text-[#3b0713]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes ray-marched-perfume-hero-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .ray-marched-perfume-hero-rise { animation: ray-marched-perfume-hero-rise 700ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .ray-marched-perfume-hero-rise { animation: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[720px] w-full max-w-[1600px] lg:h-[760px]" style={{ background: "linear-gradient(180deg, #f1a9b6 0%, #f4b3bf 52%, #f9c9d0 66%, #fbd3d8 100%)" }}>
        {/* The real heading. With WebGL running the canvas paints the same word on the wall and covers this one. */}
        <h1 className="absolute inset-x-0 top-[58px] select-none whitespace-nowrap text-center text-[30vw] font-extrabold leading-[0.8] tracking-[-0.055em] text-[#d5283f] lg:top-[150px] lg:text-[min(30.8vw,493px)]">{product.word}</h1>
        {shown === "still" && <Still />}
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        <div ref={hit} aria-hidden="true" className="absolute inset-0 cursor-grab select-none active:cursor-grabbing" style={{ touchAction: "pan-y" }} />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-6 pb-7 pt-6 sm:px-10 lg:px-16 lg:pb-12 lg:pt-10">
          <p className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.32em] text-[#5a0d1d]">
            <span>{product.house}</span>
            <span className="hidden sm:inline">{product.kind}</span>
          </p>
          <div className="ray-marched-perfume-hero-rise flex flex-col items-start gap-5 lg:ml-[63.6%] lg:gap-6">
            <p className="max-w-[19rem] text-[21px] italic leading-[1.22] text-[#4a0a18] lg:max-w-[25rem] lg:text-[25px]" style={{ fontFamily: SERIF }}>{product.line}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <a href="#" className="pointer-events-auto inline-flex h-[52px] items-center gap-3 whitespace-nowrap rounded-full bg-[#1c2fb8] pl-7 pr-6 text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_14px_30px_-12px_rgba(20,30,130,0.75)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#1c2fb8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9c9d0] active:translate-y-0 motion-reduce:transition-none">
                {product.cta}
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              </a>
              <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#5a0d1d]">{product.note}</span>
            </div>
          </div>
        </div>
        {shown === "gl" && (
          <button type="button" onClick={() => api.current?.spin()} className="absolute bottom-12 left-[52px] hidden h-10 items-center gap-2 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5a0d1d] outline-none hover:text-[#1c2fb8] focus-visible:ring-2 focus-visible:ring-[#1c2fb8] lg:flex motion-reduce:lg:hidden">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 10a6.5 6.5 0 1 1-2.2-4.9M16.6 3.2v3.4h-3.4" /></svg>
            Turn the bottle
          </button>
        )}
      </div>
    </section>
  );
}
