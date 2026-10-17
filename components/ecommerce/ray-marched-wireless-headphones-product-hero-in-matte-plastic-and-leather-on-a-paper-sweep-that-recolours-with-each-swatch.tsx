import { useEffect, useRef, useState } from "react";

// Everything a visitor would edit first.
const product = {
  maker: "Ondelle Sound",
  kind: "Over-ear, wireless",
  name: ["Lull", "One"],
  price: "$249",
  cta: "Add to bag",
  note: "Example price. Folding yokes, carry pouch included.",
};
// The colourways. Each dresses the shell, the cushions and the paper behind them. Plain sRGB hex; the shader converts them.
const colourways = [
  { name: "Clay", shell: "#d0603f", leather: "#efe2cc", paper: "#eaa47c" },
  { name: "Sage", shell: "#8aa585", leather: "#3a3a2c", paper: "#c4d4a0" },
  { name: "Sky", shell: "#86acd6", leather: "#f2e9d8", paper: "#a8c6e6" },
  { name: "Butter", shell: "#efcb5f", leather: "#6a472b", paper: "#f0cd66" },
  { name: "Ink", shell: "#2b2e36", leather: "#1c1c1f", paper: "#bcb5a8" },
];
const HERO = 0.62; // resting turn in radians: three quarters, the left cushion toward the lens
const SWAP = 1.6; // seconds a new colour takes to sweep across the shell
const INK = "#1a1612";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const lin = (hex: string) => [1, 3, 5].map((i) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2));

// Where the camera stands for a frame of this size.
function frameOf(w: number, h: number) {
  const desk = w >= 1024, wide = w >= 768, aspect = w / h;
  const dist = 9, el = desk ? 0.24 : 0.27;
  const foc = desk ? Math.min(2.55, 1.5 * aspect) : wide ? Math.min(2.3, 1.45 * aspect) : Math.min(2.0, (dist * aspect) / 3.35);
  const tgt = [0, 1.08, 0];
  const cam = [0, tgt[1] + dist * Math.sin(el), -dist * Math.cos(el)];
  const fx = desk ? 0.665 : wide ? 0.64 : 0.5, fy = desk ? 0.46 : wide ? 0.44 : 0.255;
  const shift = [(fx - 0.5) * aspect, 0.5 - fy];
  const fw = [0, -Math.sin(el), Math.cos(el)], up = [0, Math.cos(el), Math.sin(el)];
  const project = (x: number, y: number, z: number) => {
    const v = [x - cam[0], y - cam[1], z - cam[2]];
    const d = v[1] * fw[1] + v[2] * fw[2];
    return { x: w / 2 + ((v[0] / d) * foc + shift[0]) * h, y: h / 2 - (((v[1] * up[1] + v[2] * up[2]) / d) * foc + shift[1]) * h, k: (foc / d) * h };
  };
  return { dist, el, foc, tgt, cam, shift, project };
}

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 tone(vec3 x){ vec3 c = 1.0 - exp(-max(x, 0.0) * 1.0); c = mix(c, c * c * (3.0 - 2.0 * c), 0.45); return pow(c, vec3(1.0 / 2.2)); }
`;

// The photograph: a paper sweep in daylight, a round card, and a pair of headphones standing on their cushions.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uDirect;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform float uRot; uniform float uLift; uniform vec3 uSun;
uniform vec3 uOldS; uniform vec3 uNewS; uniform vec3 uOldL; uniform vec3 uNewL; uniform float uProg;
uniform vec3 uPaper; uniform vec3 uCard;
vec3 gRnd;
const float ZW = 3.6; const float RC = 1.3; const float TOP = 9.0; const float TOPR = 1.6;
const float PH = 0.1; const float PR = 1.48;
const float CX = 0.9; const float CY = 0.52; const float BC = 1.24; const float RB = 0.93; const float YTOP = 2.26;
const vec3 SUNC = vec3(1.0, 0.96, 0.9); const float SUNI = 2.6;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float smax(float a, float b, float k){ return -smin(-a, -b, k); }
float rbox2(vec2 w, float r){ return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - r; }

vec3 toLocalDir(vec3 v){ float s = sin(uRot); float c = cos(uRot); return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); }
vec3 toWorldDir(vec3 v){ float s = sin(uRot); float c = cos(uRot); return vec3(c * v.x - s * v.z, v.y, s * v.x + c * v.z); }
vec3 toLocal(vec3 p){ return toLocalDir(vec3(p.x, p.y - uLift - PH, p.z)); }

// The parts, each in the headphones' own frame. a is the point folded onto the right-hand side.
float ovalR(vec3 p){ return length(vec2(p.y * 0.94, p.z * 1.1)); }
float dShell(vec3 a){ vec3 p = a - vec3(CX + 0.04, CY, 0.0); float r = ovalR(p);
  // a soft dome on the outer face, flat where the cushion sits
  float dome = 0.05 * (1.0 - smoothstep(0.0, 0.42, r));
  float d = rbox2(vec2(r - 0.38, abs(p.x - 0.5 * dome) - 0.1 - 0.5 * dome), 0.075);
  // a fine parting groove round the outer face, where the cap meets the cup
  float g = length(vec2(r - 0.33, p.x - 0.19 - 0.5 * dome)) - 0.012;
  return smax(d, -g, 0.006); }
float dCush(vec3 a){ vec3 p = a - vec3(CX - 0.15, CY, 0.0); float r = ovalR(p);
  return (length(vec2(r - 0.285, p.x * 1.25)) - 0.125) * 0.8; }
float dFork(vec3 a){ vec3 p = a - vec3(CX + 0.04, CY, 0.0);
  float ring = length(vec2(length(vec2(p.y * 0.94, p.z * 1.1)) - 0.5, p.x)) - 0.026;
  float rod = length(vec2(p.x, p.z)) - 0.034; rod = max(rod, abs(p.y - 0.62) - 0.14);
  return min(smax(ring, -p.y - 0.02, 0.03), rod); }
float dBand(vec3 q){ vec3 p = q - vec3(0.0, BC, 0.0); float r = length(p.xy);
  float b = rbox2(abs(vec2(r - RB, p.z)) - vec2(0.03, 0.105), 0.03);
  // the slider block at each end, where the band takes the rod
  vec3 e = abs(vec3(abs(p.x) - RB, p.y - 0.02, p.z)) - vec3(0.035, 0.07, 0.09);
  float blk = length(max(e, 0.0)) + min(max(e.x, max(e.y, e.z)), 0.0) - 0.03;
  return min(smax(b, -p.y + 0.06, 0.02), blk); }
float dPad(vec3 q){ vec3 p = q - vec3(0.0, BC, 0.0); float r = length(p.xy);
  float d = rbox2(abs(vec2(r - RB + 0.085, p.z)) - vec2(0.025, 0.07), 0.035);
  return smax(smax(d, abs(p.x) - 0.6, 0.18), -p.y, 0.02); }
float dHead(vec3 q){
  vec3 a = vec3(abs(q.x), q.y, q.z);
  float d = min(dShell(a), dCush(a));
  d = min(d, dFork(a));
  d = min(d, min(dBand(q), dPad(q)));
  return d;
}
vec3 nHead(vec3 q){ vec2 e = vec2(0.0018, -0.0018); return normalize(e.xyy * dHead(q + e.xyy) + e.yyx * dHead(q + e.yyx) + e.yxy * dHead(q + e.yxy) + e.xxx * dHead(q + e.xxx)); }

// The round card the headphones stand on, a finger thick.
float dCard(vec3 p){ vec2 w = vec2(length(p.xz) - PR + 0.02, abs(p.y - 0.5 * PH) - 0.5 * PH + 0.02); return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.02; }
vec3 nCard(vec3 p){ vec2 e = vec2(0.0016, -0.0016); return normalize(e.xyy * dCard(p + e.xyy) + e.yyx * dCard(p + e.yyx) + e.yxy * dCard(p + e.yxy) + e.xxx * dCard(p + e.xxx)); }

vec2 bound(vec3 ro, vec3 rd){
  float a = dot(rd.xz, rd.xz); float b = dot(ro.xz, rd.xz); float c = dot(ro.xz, ro.xz) - 1.5;
  float h = b * b - a * c; if (h < 0.0 || a < 1e-6) return vec2(1.0, -1.0);
  h = sqrt(h); float t0 = (-b - h) / a; float t1 = (-b + h) / a;
  float y0 = PH + uLift - 0.01; float y1 = PH + uLift + YTOP;
  if (abs(rd.y) > 1e-5) { float ya = (y0 - ro.y) / rd.y; float yb = (y1 - ro.y) / rd.y; t0 = max(t0, min(ya, yb)); t1 = min(t1, max(ya, yb)); }
  else if (ro.y < y0 || ro.y > y1) return vec2(1.0, -1.0);
  return vec2(max(t0, 0.0), t1);
}
float march(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 96; i++) { float d = dHead(toLocal(ro + rd * t)); if (d < 0.0008) return t; t += d * 0.9; if (t > tb.y) break; }
  return -1.0;
}
float marchLo(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = max(tb.x, 0.015);
  for (int i = 0; i < 32; i++) { float d = dHead(toLocal(ro + rd * t)); if (d < 0.003) return t; t += d * 0.95; if (t > tb.y) break; }
  return -1.0;
}
float marchCard(vec3 ro, vec3 rd){
  if (rd.y > -1e-4) return -1.0;
  float t = max((PH + 0.01 - ro.y) / rd.y, 0.0); float t1 = -ro.y / rd.y;
  for (int i = 0; i < 24; i++) { float d = dCard(ro + rd * t); if (d < 0.0008) return t; t += d; if (t > t1) break; }
  return -1.0;
}

// The studio: warm walls, a big window camera left, a strip light camera right, a scrim overhead and the sun.
vec3 env(vec3 rd){
  float el = asin(clamp(rd.y, -1.0, 1.0)); float az = atan(rd.x, -rd.z);
  vec3 c = mix(uPaper * 0.35 + 0.04, vec3(0.55, 0.5, 0.44), smoothstep(-0.1, 0.6, rd.y));
  c += vec3(1.0, 0.99, 0.97) * (0.5 * smoothstep(0.42, 0.8, el) + 1.8 * smoothstep(0.86, 1.2, el));
  vec2 w = abs(vec2(az + 0.9, el - 0.45)) - vec2(0.42, 0.34);
  c += vec3(1.0, 0.98, 0.95) * 5.0 * smoothstep(0.06, -0.06, max(w.x, w.y));
  vec2 w2 = abs(vec2(az - 1.0, el - 0.4)) - vec2(0.12, 0.45);
  c += vec3(0.95, 0.98, 1.0) * 3.2 * smoothstep(0.05, -0.05, max(w2.x, w2.y));
  c += SUNC * 26.0 * smoothstep(0.9965, 0.9992, dot(rd, uSun));
  return c;
}
vec3 ambient(vec3 n){ return mix(uCard * 1.2 + 0.03, vec3(1.0, 0.98, 0.95) * 0.72, 0.5 + 0.5 * n.y); }

// How much sun reaches a point: soft where the blocker is far, crisp where it touches.
float sunVis(vec3 p){
  float res = 1.0;
  vec2 tb = bound(p, uSun);
  if (tb.x < tb.y) {
    float t = max(tb.x, 0.02);
    for (int i = 0; i < 30; i++) { float h = dHead(toLocal(p + uSun * t)); res = min(res, 8.0 * h / t); t += clamp(h, 0.02, 0.25); if (res < 0.004 || t > tb.y) break; }
  }
  res = clamp(res, 0.0, 1.0); return res * res * (3.0 - 2.0 * res);
}

float hitStage(vec3 ro, vec3 rd, float top, out vec3 n){
  n = vec3(0.0, 1.0, 0.0);
  if (rd.y < 0.0) { float tf = -ro.y / rd.y; float z = ro.z + rd.z * tf; if (z < ZW - RC) return tf; }
  if (rd.z > 0.0) { float tw = (ZW - ro.z) / rd.z; float y = ro.y + rd.y * tw; if (y > top) return -1.0; if (y > RC) { n = vec3(0.0, 0.0, -1.0); return tw; } }
  vec2 o = ro.yz - vec2(RC, ZW - RC); float a = dot(rd.yz, rd.yz); float b = dot(o, rd.yz); float h = b * b - a * (dot(o, o) - RC * RC);
  if (h > 0.0 && a > 1e-7) { float tc = (-b + sqrt(h)) / a; vec2 pc = ro.yz + rd.yz * tc; if (tc > 0.0 && pc.x < RC + 0.02 && pc.y > ZW - RC - 0.02) { vec2 nn = (vec2(RC, ZW - RC) - pc) / RC; n = vec3(0.0, nn.x, nn.y); return tc; } }
  return -1.0;
}
float paperTooth(vec2 pq){ return 0.5 * (n2(pq * 150.0) - 0.5) + 0.3 * (n2(pq * 61.0 + 7.0) - 0.5) + 0.3 * (n2(pq * vec2(9.0, 240.0)) - 0.5); }
vec3 stage(vec3 ro, vec3 rd, float full){
  vec3 n; float t = hitStage(ro, rd, full > 0.5 ? TOP : TOPR, n);
  if (t < 0.0) return env(rd);
  vec3 p = ro + rd * t;
  vec2 pq = p.xy + p.z * vec2(0.37, 0.81);
  vec3 alb = uPaper * (1.0 + 0.06 * paperTooth(pq) + 0.08 * (n2(pq * 1.7) - 0.5));
  float ndl = max(dot(n, uSun), 0.0);
  float vis = 1.0; float occ = 1.0;
  if (full > 0.5) {
    vis = ndl > 0.0 ? sunVis(p + n * 0.004) : 0.0;
    float dc = dCard(p + n * 0.03);
    occ = 0.55 + 0.45 * smoothstep(0.0, 0.14, dc);
  } else {
    if (n.y > 0.9) alb = mix(alb, uCard, smoothstep(PR + 0.1, PR - 0.1, length(p.xz)));
    occ = 0.5 + 0.5 * smoothstep(0.4, 1.2, length(p.xz));
  }
  vec2 wq = p.xy - vec2(0.4, 1.2); float wash = exp(-dot(wq, wq) / 18.0);
  vec3 fill = mix(uPaper * 1.2 + 0.04, vec3(0.9, 0.88, 0.85), 0.5 + 0.5 * n.y) * (1.0 + (1.2 * wash - 0.3) * (1.0 - n.y)) * 0.8;
  ndl *= 1.0 - 0.45 * smoothstep(0.6, 2.8, p.y);
  vec2 kq = p.xz - vec2(0.3, -0.2); float pool = 0.72 + 0.4 * exp(-dot(kq, kq) / 24.0);
  return alb * (SUNC * SUNI * pool * ndl * vis + fill * occ * (1.0 - 0.2 * n.y));
}

// What the headphones are made of at a point. x: 0 shell plastic, 1 leather, 2 metal, 3 cloth over the driver.
vec4 skin(vec3 q){
  vec3 a = vec3(abs(q.x), q.y, q.z);
  float ds = dShell(a), dc = dCush(a), df = dFork(a), db = dBand(q), dp = dPad(q);
  // a new colour sweeps from the left cup, over the band, to the right one
  float s = q.x + 0.12 * sin(q.y * 6.0 + q.z * 4.0);
  float k = smoothstep(-0.03, 0.03, (uProg * 3.0 - 1.5) - s);
  vec3 shell = mix(uOldS, uNewS, k); vec3 lea = mix(uOldL, uNewL, k);
  float m = min(min(ds, dc), min(df, min(db, dp)));
  if (m == df) return vec4(vec3(0.3, 0.29, 0.28), 2.0);
  if (m == dc || m == dp) return vec4(lea, 1.0);
  if (m == ds && a.x < CX - 0.06) return vec4(lea * 0.35 + 0.01, 3.0);
  return vec4(shell, 0.0);
}

// A mirror ray: the headphones again (roughly lit), or the set.
vec3 mirror(vec3 ro, vec3 rd){
  float t = marchLo(ro, rd);
  if (t > 0.0) {
    vec3 q = toLocal(ro + rd * t); vec3 n = toWorldDir(nHead(q)); vec4 sk = skin(q);
    return sk.rgb * (SUNC * SUNI * max(dot(n, uSun), 0.0) * 0.55 + ambient(n) * 0.6);
  }
  return stage(ro, rd, 0.0);
}
float aoHead(vec3 p, vec3 n){
  float a = 0.0; float w = 1.0;
  for (int i = 1; i <= 5; i++) { float d = 0.03 * float(i) + 0.012 * float(i * i); float h = min(dHead(toLocal(p + n * d)), p.y + n.y * d - PH); a += w * (d - h); w *= 0.6; }
  return clamp(1.0 - 2.2 * a, 0.0, 1.0);
}

vec3 shadeHead(vec3 p, vec3 rd){
  vec3 q = toLocal(p); vec3 nl = nHead(q);
  vec4 sk = skin(q); float id = sk.a;
  // surface texture: leather grain and stitched creases, a fine spark erosion on the plastic
  vec3 aq = vec3(abs(q.x), q.y, q.z);
  if (id == 1.0) {
    float g = n2(aq.yz * 70.0 + aq.x * 31.0) + 0.5 * n2(aq.zy * 160.0 + aq.x * 11.0);
    float ang = atan(q.z, q.y - CY); float cr = pow(n2(vec2(ang * 16.0, aq.x * 9.0)), 2.0) * smoothstep(0.42, 0.25, length(vec2(q.y - CY, q.z)));
    nl = normalize(nl + 0.07 * (vec3(g, n2(aq.xz * 80.0), n2(aq.xy * 80.0)) - 0.6) + 0.16 * (cr - 0.2) * vec3(0.0, cos(ang), sin(ang)));
  } else if (id == 0.0) {
    nl = normalize(nl + 0.018 * (vec3(n2(aq.yz * 220.0), n2(aq.xz * 220.0), n2(aq.xy * 220.0)) - 0.5));
  }
  vec3 n = toWorldDir(nl);
  float ndl = max(dot(n, uSun), 0.0);
  float vis = ndl > 0.0 ? sunVis(p + n * 0.012) : 0.0;
  float ao = aoHead(p, n);
  vec3 alb = sk.rgb;
  if (id == 1.0) alb *= 0.9 + 0.2 * n2(aq.yz * 9.0 + aq.x * 5.0);
  if (id == 0.0) alb *= 0.97 + 0.06 * n2(aq.yz * 4.0 + aq.x * 3.0);
  // matte plastic lets a little light into its skin, so the turned-away side never goes dead
  float wrap = id == 0.0 ? 0.18 : (id == 1.0 ? 0.1 : 0.0);
  float diff = max((dot(n, uSun) + wrap) / (1.0 + wrap), 0.0) * mix(vis, 1.0, wrap * 0.5);
  vec3 col = alb * (SUNC * SUNI * diff + ambient(n) * ao);
  float rough = id == 0.0 ? 0.42 : (id == 1.0 ? 0.55 : (id == 2.0 ? 0.3 : 0.9));
  vec3 h = normalize(uSun - rd); float ndh = max(dot(n, h), 0.0);
  float e = 2.0 / (rough * rough * rough * rough) - 2.0;
  float nv = clamp(dot(-rd, n), 0.0, 1.0);
  float f0 = id == 2.0 ? 0.6 : 0.045;
  float f = f0 + (1.0 - f0) * pow(1.0 - nv, 5.0);
  vec3 tint = id == 2.0 ? alb : vec3(1.0);
  col += tint * SUNC * SUNI * vis * ndl * pow(ndh, e) * (e + 8.0) / 25.0 * f * (id == 3.0 ? 0.0 : 1.0);
  // leather has a soft sheen at grazing angles
  if (id == 1.0) col += alb * 0.35 * pow(1.0 - nv, 3.0) * ao;
  vec3 r = normalize(reflect(rd, n) + gRnd * rough * 0.9);
  vec3 refl = mirror(p + n * 0.012, r);
  float kr = f * (1.0 - rough * 0.75) * (id == 3.0 ? 0.0 : 1.0);
  return col * (1.0 - kr * (id == 2.0 ? 0.6 : 0.2)) + refl * tint * kr * (0.4 + 0.6 * ao);
}

vec3 shadeCard(vec3 p, vec3 rd){
  vec3 n = nCard(p);
  vec3 alb = uCard * (1.0 + 0.08 * paperTooth(p.xz) + 0.08 * (n2(p.xz * 2.3) - 0.5));
  float ndl = max(dot(n, uSun), 0.0);
  float vis = ndl > 0.0 ? sunVis(p + n * 0.004) : 0.0;
  float dm = dHead(toLocal(p + n * 0.04));
  float occ = (0.3 + 0.7 * smoothstep(0.0, 0.45, dm)) * (0.6 + 0.4 * smoothstep(0.0, 0.08, p.y + 0.05 * n.y));
  vec3 bleed = mix(uOldS, uNewS, uProg) * 0.4 * exp(-max(dm, 0.0) * 6.0);
  vec3 fill = mix(uPaper * 1.4 + 0.08, vec3(1.0, 0.98, 0.95), 0.5 + 0.5 * n.y);
  return alb * (SUNC * SUNI * 1.05 * ndl * vis + fill * occ * (1.0 - 0.2 * n.y) + bleed);
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
  gRnd = uSeed > 0.001 ? (vec3(h21(gl_FragCoord.xy + ign * 17.0), h21(gl_FragCoord.yx + ign * 31.0), ign) - 0.5) * 2.0 : vec3(0.0);
  float tm = march(ro, rd); float tc = marchCard(ro, rd);
  vec3 col;
  if (tm > 0.0 && (tc < 0.0 || tm < tc)) col = shadeHead(ro + rd * tm, rd);
  else if (tc > 0.0) col = shadeCard(ro + rd * tc, rd);
  else col = stage(ro, rd, 1.0);
  col = min(col, vec3(14.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the negative: bloom off hot glints, the film curve, a soft vignette and grain.
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
  c = max(c + (c - nb * 0.25) * 0.35, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 16.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.02 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 3.0, 0.0), vec3(8.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.016;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.14 * smoothstep(0.4, 1.3, length(q));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.016 * (1.0 - 0.4 * c.g);
  outC = vec4(c, 1.0);
}
`;

type Spot = { x: number; y: number; k: number };

// No WebGL: the same headphones drawn as a lit vector still at the same spot and scale (k pixels per scene unit).
function Still({ at, sel }: { at: Spot; sel: number }) {
  const c = colourways[sel];
  const k = at.k;
  return (
    <svg aria-hidden="true" className="absolute overflow-visible" style={{ left: at.x - 1.6 * k, top: at.y - 2.5 * k, width: 3.2 * k, height: 2.9 * k }} viewBox="-1.6 -2.5 3.2 2.9">
      <defs>
        <radialGradient id="hp-still-cup" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
        <radialGradient id="hp-still-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.35" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="0.25" cy="0.04" rx="1.5" ry="0.3" fill="url(#hp-still-shadow)" />
      <ellipse cx="0" cy="0.02" rx="1.45" ry="0.32" fill="#000" fillOpacity="0.12" />
      <path d="M -0.62 -1.3 A 0.66 0.58 0 0 1 0.62 -1.3" fill="none" stroke={c.leather} strokeWidth="0.08" strokeLinecap="round" style={{ transition: "stroke 600ms" }} />
      <path d="M -0.86 -0.9 A 0.88 1.05 0 0 1 0.86 -0.9" fill="none" stroke={c.shell} strokeWidth="0.15" strokeLinecap="round" style={{ transition: "stroke 600ms" }} />
      <rect x="-0.92" y="-1.05" width="0.06" height="0.3" fill="#9b968f" />
      <rect x="0.86" y="-1.05" width="0.06" height="0.3" fill="#9b968f" />
      <ellipse cx="0.72" cy="-0.5" rx="0.3" ry="0.5" fill={c.leather} style={{ transition: "fill 600ms" }} />
      <ellipse cx="-0.86" cy="-0.5" rx="0.26" ry="0.5" fill={c.shell} style={{ transition: "fill 600ms" }} />
      <ellipse cx="-0.86" cy="-0.5" rx="0.26" ry="0.5" fill="url(#hp-still-cup)" />
      <ellipse cx="0.92" cy="-0.5" rx="0.24" ry="0.49" fill={c.shell} style={{ transition: "fill 600ms" }} />
      <ellipse cx="0.92" cy="-0.5" rx="0.24" ry="0.49" fill="url(#hp-still-cup)" />
    </svg>
  );
}

export default function RayMarchedWirelessHeadphonesHero() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [sel, setSel] = useState(0);
  const [bag, setBag] = useState(0);
  const [spot, setSpot] = useState<Spot | null>(null);
  const api = useRef<{ swap: (i: number) => void; hop: () => void; turn: () => void } | null>(null);

  useEffect(() => {
    const box = stage.current;
    if (!box) return;
    const place = () => {
      const r = box.getBoundingClientRect();
      const f = frameOf(Math.max(1, r.width), Math.max(1, r.height));
      setSpot(f.project(0, 0.1, 0));
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

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
    const still = reduce || software;

    const head = gl2 ? "#version 300 es\n#define ATTR in\n" : "#define ATTR attribute\n";
    const fhead = gl2 ? "#version 300 es\n#define texture2D texture\nprecision highp float;\nout vec4 outC;\n" : "#define outC gl_FragColor\n";
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); return null; }
      return sh;
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
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uDirect", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uRot", "uLift", "uSun", "uOldS", "uNewS", "uOldL", "uNewL", "uProg", "uPaper", "uCard"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.75, window.devicePixelRatio || 1) * scale;
      // never more than about 1.8 million pixels of tracing
      const k = Math.min(1, Math.sqrt(1.8e6 / (cssW * cssH * dpr * dpr)));
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

    const ways = colourways.map((c) => ({ shell: lin(c.shell), leather: lin(c.leather), paper: lin(c.paper) }));
    const s = {
      a: HERO, v: 0, rest: HERO as number | null, drag: false, spinT: -1, spinFrom: HERO, spinTo: HERO, spinLen: 1,
      cur: 0, old: 0, prog: 1, paper: ways[0].paper.slice(),
      ly: 0, lv: 0,
      count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, first: true, alive: true,
    };
    const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

    const draw = (alpha: number, sample: number) => {
      const f = frameOf(cssW, cssH);
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.06 : 0;
      const sj = sample ? 0.03 : 0, sa = -0.85 + (halton(sample, 11) - 0.5) * sj, se = 0.62 + (halton(sample, 13) - 0.5) * sj;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform3f(su.uCam, f.cam[0], f.cam[1], f.cam[2]); gl.uniform3f(su.uTgt, f.tgt[0], f.tgt[1], f.tgt[2]);
      gl.uniform1f(su.uFoc, f.foc);
      gl.uniform2f(su.uShift, f.shift[0], f.shift[1]);
      gl.uniform1f(su.uFocus, f.dist);
      gl.uniform1f(su.uRot, s.a); gl.uniform1f(su.uLift, s.ly);
      gl.uniform3f(su.uSun, Math.sin(sa) * Math.cos(se), Math.sin(se), -Math.cos(sa) * Math.cos(se));
      const o = ways[s.old], n = ways[s.cur];
      gl.uniform3fv(su.uOldS, o.shell); gl.uniform3fv(su.uNewS, n.shell);
      gl.uniform3fv(su.uOldL, o.leather); gl.uniform3fv(su.uNewL, n.leather);
      gl.uniform1f(su.uProg, s.prog);
      gl.uniform3fv(su.uPaper, s.paper);
      gl.uniform3fv(su.uCard, s.paper.map((x) => x * 0.62));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, cssW >= 768 ? 0.62 : 0.5, 0.5);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const back = (x: number) => { const c = 1.1; return x < 0.5 ? (Math.pow(2 * x, 2) * ((c + 1) * 2 * x - c)) / 2 : (Math.pow(2 * x - 2, 2) * ((c + 1) * (x * 2 - 2) + c) + 2) / 2; };
    const spin = (by: number, secs: number) => {
      if (s.drag) return;
      const from = s.spinT >= 0 ? s.spinTo : s.rest ?? s.a;
      s.spinT = 0; s.spinFrom = s.a; s.spinTo = from + by; s.spinLen = secs; s.rest = s.spinTo;
    };
    const swap = (i: number, fromUser: boolean) => {
      if (fromUser) s.touched = true;
      if (i === s.cur) return;
      s.old = s.cur; s.cur = i;
      if (reduce) { s.prog = 1; s.paper = ways[i].paper.slice(); } else { s.prog = 0; spin(Math.PI * 2, 2.1); }
      s.count = 0; s.fresh = reduce;
      wake();
    };
    api.current = {
      swap: (i) => swap(i, true),
      hop: () => { s.touched = true; if (!reduce && s.ly < 0.01) { s.lv = 3.2; s.ly = 0.001; s.v += 2.0; wake(); } },
      turn: () => { s.touched = true; if (reduce) { s.a += Math.PI / 2; s.rest = s.a; s.count = 0; s.fresh = true; } else spin(Math.PI / 2, 0.9); wake(); },
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible || !s.alive) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      // opens finished and holds; then, until someone touches it, tries the next colour every few seconds
      if (!s.t0) { s.t0 = now; s.demoAt = now + 4800; }
      if (!still && !s.touched && now > s.demoAt) { const next = (s.cur + 1) % colourways.length; swap(next, false); setSel(next); s.demoAt = now + 6200; }

      let moving = false;
      if (!reduce) {
        if (s.spinT >= 0) { s.spinT += dt / s.spinLen; if (s.spinT >= 1) s.spinT = -1; }
        if (!s.drag) {
          if (s.rest !== null) {
            const want = s.spinT >= 0 ? s.spinFrom + (s.spinTo - s.spinFrom) * back(s.spinT) : s.rest;
            const stiff = s.spinT >= 0 ? 150 : 46, damp = s.spinT >= 0 ? 22 : 8;
            for (let i = 0; i < 3; i++) { s.v += (stiff * (want - s.a) - damp * s.v) * (dt / 3); s.a += s.v * (dt / 3); }
            if (s.spinT < 0 && Math.abs(s.v) < 0.003 && Math.abs(want - s.a) < 0.0006) { s.a = want; s.v = 0; } else moving = true;
          } else {
            s.v *= Math.exp(-dt * 2.4); s.a += s.v * dt;
            if (Math.abs(s.v) < 0.012) s.v = 0; else moving = true;
          }
        } else moving = true;
        if (s.prog < 1) {
          s.prog = Math.min(1, s.prog + dt / SWAP); moving = true;
          // the paper follows a beat behind the shell
          const p = ways[s.cur].paper, k = 1 - Math.exp(-dt * 3.2);
          s.paper = s.paper.map((x, j) => x + (p[j] - x) * k);
        } else {
          const p = ways[s.cur].paper;
          if (s.paper.some((x, j) => Math.abs(p[j] - x) > 0.002)) { s.paper = s.paper.map((x, j) => x + (p[j] - x) * (1 - Math.exp(-dt * 3.2))); moving = true; }
          else s.paper = p.slice();
        }
        if (s.ly > 0 || s.lv !== 0) {
          s.lv -= 24 * dt; s.ly += s.lv * dt;
          if (s.ly <= 0) { s.ly = 0; s.lv = s.lv < -1.3 ? -s.lv * 0.28 : 0; }
          moving = true;
        }
      }
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(0.6, 1 + (s.frame % 64)); s.count = 3; }
      else if (s.count < 64) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      if (!still && moving && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 64 || (!still && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible && s.alive) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);

    let downX = 0, id = -1, lastT = 0;
    const down = (e: PointerEvent) => {
      id = e.pointerId; downX = e.clientX; lastT = e.timeStamp; s.drag = true; s.touched = true; s.spinT = -1; s.v = 0; s.rest = null;
      try { pad.setPointerCapture(id); } catch { /* the pointer is already gone */ }
      wake();
    };
    const move = (e: PointerEvent) => {
      if (!s.drag || e.pointerId !== id) return;
      const dx = e.clientX - downX; downX = e.clientX;
      const da = dx * 0.01, dtp = Math.max(0.008, (e.timeStamp - lastT) / 1000); lastT = e.timeStamp;
      s.a += da; s.v = s.v * 0.5 + (da / dtp) * 0.5;
      if (reduce) { s.count = 0; s.fresh = true; }
      wake();
    };
    const upFn = (e: PointerEvent) => {
      if (!s.drag || e.pointerId !== id) return;
      s.drag = false;
      s.v = reduce ? 0 : Math.max(-12, Math.min(12, s.v));
      wake();
    };
    pad.addEventListener("pointerdown", down);
    pad.addEventListener("pointermove", move);
    pad.addEventListener("pointerup", upFn);
    pad.addEventListener("pointercancel", upFn);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      s.alive = false;
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      pad.removeEventListener("pointerdown", down); pad.removeEventListener("pointermove", move);
      pad.removeEventListener("pointerup", upFn); pad.removeEventListener("pointercancel", upFn);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const pick = (i: number) => { setSel(i); api.current?.swap(i); };
  const add = () => { setBag((b) => b + 1); api.current?.hop(); };
  const way = colourways[sel];

  return (
    <section className="relative isolate overflow-hidden transition-colors duration-1000 motion-reduce:transition-none" style={{ fontFamily: FONT, color: INK, backgroundColor: way.paper }}>
      <style>{`
        @keyframes ray-marched-headphones-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .ray-marched-headphones-rise { animation: ray-marched-headphones-rise 700ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @keyframes ray-marched-headphones-name { from { opacity: 0; transform: translateY(0.5em); } to { opacity: 1; transform: none; } }
        .ray-marched-headphones-name { display: inline-block; animation: ray-marched-headphones-name 520ms cubic-bezier(0.2, 1.2, 0.3, 1) both; }
        @keyframes ray-marched-headphones-count { 0% { transform: scale(1); } 35% { transform: scale(1.45); } 100% { transform: scale(1); } }
        .ray-marched-headphones-count { animation: ray-marched-headphones-count 420ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .ray-marched-headphones-rise, .ray-marched-headphones-name, .ray-marched-headphones-count { animation: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[780px] w-full max-w-[1600px] md:h-[760px]">
        {shown === "still" && spot && <Still at={spot} sel={sel} />}
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        <div ref={hit} aria-hidden="true" className="absolute inset-0 cursor-grab select-none active:cursor-grabbing" style={{ touchAction: "pan-y" }} />

        <div className="pointer-events-none absolute inset-0 flex flex-col px-6 pb-7 pt-6 md:px-10 md:pb-10 md:pt-8 lg:px-16 lg:pb-12 lg:pt-10">
          <p className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.32em]">
            <span>{product.maker}</span>
            <span className="flex items-center gap-3">
              Bag
              <span key={bag} className={`grid h-7 min-w-[28px] place-items-center rounded-full px-2 text-[12px] tracking-normal ${bag ? "ray-marched-headphones-count" : ""}`} style={{ backgroundColor: INK, color: way.paper }}>{bag}</span>
            </span>
          </p>
          <div className="ray-marched-headphones-rise mt-auto md:mb-auto md:mt-[52px]">
            <p className="text-[17px] italic md:text-[19px] lg:text-[21px]" style={{ fontFamily: SERIF }}>{product.kind}</p>
            <h2 className="mt-1 text-[72px] font-extrabold leading-[0.82] tracking-[-0.06em] md:mt-3 md:text-[112px] lg:text-[156px]">
              {product.name.map((line) => <span key={line} className="block">{line}</span>)}
            </h2>
            <p className="mt-3 text-[20px] italic leading-none md:mt-5 md:text-[25px] lg:mt-6 lg:text-[30px]" style={{ fontFamily: SERIF }}>
              finished in <span key={way.name} className="ray-marched-headphones-name not-italic font-extrabold tracking-[-0.03em]" style={{ fontFamily: FONT }}>{way.name}</span>
            </p>
          </div>
          <div className="ray-marched-headphones-rise mt-5 md:mt-0">
            <div role="group" aria-label="Colour" className="pointer-events-auto mb-4 flex gap-2 md:mb-6">
              {colourways.map((c, i) => (
                <button key={c.name} type="button" aria-pressed={i === sel} aria-label={c.name} onClick={() => pick(i)} className="group grid h-11 w-11 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ ["--tw-ring-color" as string]: INK, ["--tw-ring-offset-color" as string]: way.paper }}>
                  <span className={`relative block h-8 w-8 rounded-full transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none ${i === sel ? "scale-110" : ""}`} style={{ background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,0.55), rgba(255,255,255,0) 38%), radial-gradient(circle at 60% 70%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.28) 100%), ${c.shell}`, boxShadow: i === sel ? `0 0 0 2px ${c.paper}, 0 0 0 4px ${INK}, 0 6px 10px -4px rgba(0,0,0,0.45)` : "0 6px 10px -4px rgba(0,0,0,0.45), inset 0 -2px 3px rgba(0,0,0,0.18)" }}>
                    <span className="absolute bottom-[3px] right-[3px] h-3 w-3 rounded-full" style={{ background: c.leather, boxShadow: "0 0 0 1.5px rgba(0,0,0,0.12)" }} />
                  </span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="text-[52px] font-extrabold leading-none tracking-[-0.055em] md:text-[64px] lg:text-[88px]" style={{ fontVariantNumeric: "tabular-nums" }}>{product.price}</span>
              <button type="button" onClick={add} className="pointer-events-auto inline-flex h-[60px] items-center gap-3 whitespace-nowrap rounded-full pl-8 pr-7 text-[19px] font-bold tracking-[-0.02em] shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_16px_30px_-14px_rgba(40,20,0,0.8)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0.5 active:scale-[0.98] motion-reduce:transition-none lg:h-[68px] lg:text-[22px]" style={{ backgroundColor: INK, color: way.paper, ["--tw-ring-color" as string]: INK, ["--tw-ring-offset-color" as string]: way.paper }}>
                {product.cta}
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 7h11l-.8 9.5H5.3L4.5 7ZM7.3 7V5.7a2.7 2.7 0 0 1 5.4 0V7" /></svg>
              </button>
              <span className="w-full text-[11px] font-semibold uppercase tracking-[0.22em] lg:mt-1">{product.note}</span>
            </div>
          </div>
        </div>
        <p aria-live="polite" className="sr-only">{bag ? `${bag} in your bag. ${product.name.join(" ")} in ${way.name} added.` : ""}</p>
        {shown === "gl" && (
          <button type="button" onClick={() => api.current?.turn()} className="absolute right-3 top-[58px] flex h-10 items-center gap-2 rounded-full px-3 text-[10px] font-semibold uppercase tracking-[0.28em] outline-none hover:opacity-70 focus-visible:ring-2 md:right-7 md:top-[66px] md:text-[11px] lg:right-[52px] lg:top-[78px]" style={{ ["--tw-ring-color" as string]: INK }}>
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 10a6.5 6.5 0 1 1-2.2-4.9M16.6 3.2v3.4h-3.4" /></svg>
            <span><span className="hidden md:inline">Drag or press to turn</span><span className="md:hidden">Turn</span></span>
          </button>
        )}
      </div>
    </section>
  );
}
