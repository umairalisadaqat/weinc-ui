import { useEffect, useRef, useState } from "react";

// The channel. Positions run 0 to 100 along the slot; the engraved plate is drawn from MARKS.
const MAX = 100;
const START = 66; // opens at -5 dB, needle mid-scale and the plate fully lit
const MARKS: [number, number][] = [
  [0, -90], [8, -60], [18, -40], [28, -30], [40, -20], [55, -10], [66, -5], [78, 0], [90, 5], [100, 10],
];
const DETENT = 1.6; // how close, in positions, the cap must come to a mark before it drops into it
const DEMO = [78, 40, 92, START]; // where the self-running demo walks the fader
const notes: [number, string][] = [
  [-999, "Muted, the channel is off the bus"],
  [-50, "A whisper under everything else"],
  [-25, "Tucked well into the background"],
  [-12, "Present, but leaving room around it"],
  [-3, "Riding just under unity"],
  [-0.4, "Unity, exactly as it was recorded"],
  [0.5, "Just over unity, leaning forward"],
  [3, "Pushed hard into the mix"],
  [8, "All the way up, the needle pins"],
];
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

// Scene: the slot runs along z, far end is full level.
const Z0 = 1.85, Z1 = -1.85;
const zOf = (v: number) => Z0 + (Math.max(0, Math.min(MAX, v)) / MAX) * (Z1 - Z0);
const vOfZ = (z: number) => ((Z0 - z) / (Z0 - Z1)) * MAX;
const dbOf = (v: number) => {
  for (let i = 1; i < MARKS.length; i++) {
    const [a, da] = MARKS[i - 1], [b, db] = MARKS[i];
    if (v <= b) return da + ((v - a) / (b - a)) * (db - da);
  }
  return 10;
};
const label = (v: number) => {
  if (v <= 0) return "−∞";
  const d = dbOf(v), r = Math.round(d * 10) / 10;
  return (r > 0 ? "+" : r < 0 ? "−" : "") + Math.abs(r).toFixed(1);
};
const noteFor = (v: number) => {
  const d = v <= 0 ? -999 : dbOf(v);
  return notes.reduce((a, n) => (d >= n[0] ? n[1] : a), notes[0][1]);
};
// The meter face is linear in voltage, like the real thing: 0 VU sits well right of centre.
const P20 = Math.pow(10, -20 / 20), P3 = Math.pow(10, 3 / 20);
const angleOf = (db: number) => -0.82 + ((Math.pow(10, db / 20) - P20) / (P3 - P20)) * 1.64;

// Meter geometry shared by the shader and the printed face.
const BX = 2.2, BZ = -0.1, WX = 0.84, WZ = 0.6, PIVZ = 0.72;
const PW = 0.8, PL = 2.25;

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const TONE = `
vec3 tone(vec3 x){ x *= 0.95; vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return pow(clamp(a / b, 0.0, 1.0), vec3(1.0 / 2.2)); }
`;

const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform float uCapZ; uniform float uLean; uniform float uLift; uniform float uNeedle; uniform float uLamp; uniform float uKey;
uniform sampler2D uPlate; uniform sampler2D uFace; uniform float uDirect;
const vec3 LK = vec3(-0.3011, 0.6222, -0.7226);
const vec3 KEYC = vec3(1.0, 0.76, 0.5);
const float PW = ${PW}; const float PL = ${PL}; const float PT = 0.03;
const float SW = 0.05; const float SL = 2.04;
const float CY = 0.255;
const float BX = ${BX}; const float BZ = ${BZ}; const float WX = ${WX}; const float WZ = ${WZ};
const float GY = 0.1; const float FY = -0.06; const float NY = -0.03;
const vec2 PIV = vec2(${BX}, ${PIVZ});
const vec3 LAMP = vec3(${BX + 0.66}, 0.0, 0.95);
const vec3 BRASS = vec3(0.95, 0.68, 0.37);
${TONE}
float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n1(float x){ float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h11(i), h11(i + 1.0), f); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }

// ---- geometry ----
float sPlate(vec3 p){
  float d = sdBox(p - vec3(0.0, -0.035, 0.0), vec3(PW - 0.006, 0.059, PL - 0.006)) - 0.006;
  return max(d, -sdBox(p, vec3(SW, 0.6, SL)));
}
vec3 capLocal(vec3 p){
  vec3 q = p - vec3(0.0, CY + uLift, uCapZ);
  float c = cos(uLean); float s = sin(uLean);
  return vec3(q.x, c * q.y - s * q.z, s * q.y + c * q.z);
}
float sCap(vec3 p){
  vec3 q = capLocal(p);
  float d = sdBox(q, vec3(0.4, 0.155, 0.24)) - 0.04;
  d = max(d, (abs(q.z) + q.y * 0.34 - 0.3) * 0.95);
  d = max(d, (abs(q.x) + q.y * 0.2 - 0.45) * 0.98);
  d = max(d, 0.8 - length(q.yz - vec2(0.95, 0.0)));
  float st = sdBox(q - vec3(0.0, -0.34, 0.0), vec3(0.026, 0.16, 0.05));
  return min(d, st);
}
float sBez(vec3 p){
  vec3 q = p - vec3(BX, 0.0, BZ);
  float o = sdBox(q, vec3(WX + 0.09, 0.07, WZ + 0.09)) - 0.05;
  float i = sdBox(q, vec3(WX, 0.6, WZ));
  return max(o, -i);
}
float sLamp(vec3 p){
  vec3 q = p - LAMP;
  float dome = length(q - vec3(0.0, -0.02, 0.0)) - 0.072;
  float ring = length(vec2(length(q.xz) - 0.088, q.y)) - 0.026;
  return min(dome, ring);
}
float map(vec3 p){ return min(min(sPlate(p), sCap(p)), min(sBez(p), sLamp(p))); }
vec3 calcN(vec3 p){
  vec2 e = vec2(0.0009, -0.0009);
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}
vec2 boxSpan(vec3 ro, vec3 rd, vec3 lo, vec3 hi){
  vec3 inv = 1.0 / (rd + vec3(1e-6)); vec3 a = (lo - ro) * inv; vec3 b = (hi - ro) * inv;
  vec3 mn = min(a, b); vec3 mx = max(a, b);
  return vec2(max(max(mn.x, mn.y), max(mn.z, 0.0)), min(mx.x, min(mx.y, mx.z)));
}
float march(vec3 ro, vec3 rd, float tmax){
  vec2 tb = boxSpan(ro, rd, vec3(-0.86, -0.45, -2.3), vec3(3.32, 0.42, 1.1));
  vec2 tc = boxSpan(ro, rd, vec3(-0.86, -0.45, -2.3), vec3(0.86, 0.42, 2.3));
  tb = vec2(min(tb.x, tc.x), max(tb.y, tc.y));
  if (tb.x > tb.y) return -1.0;
  float t = tb.x; float hi = min(tb.y, tmax);
  for (int i = 0; i < 110; i++) {
    float d = map(ro + rd * t);
    if (d < 0.0004 * (1.0 + t * 0.1)) return t;
    t += d * 0.9;
    if (t > hi) break;
  }
  return -1.0;
}
float shadow(vec3 ro){
  if (ro.x < -1.6 || ro.x > 4.2 || ro.z < -2.6 || ro.z > 3.4) return 1.0;
  float res = 1.0; float t = 0.015;
  for (int i = 0; i < 30; i++) {
    float h = map(ro + LK * t);
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.015, 0.22);
    if (res < 0.002 || t > 3.5) break;
  }
  return clamp(res, 0.0, 1.0);
}
float ao(vec3 p, vec3 n){
  float o = 0.0; float s = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.01 + 0.045 * float(i); o += (h - map(p + n * h)) * s; s *= 0.72; }
  return clamp(1.0 - 2.4 * o, 0.0, 1.0);
}

// ---- the room: one warm softbox behind the desk, a cool window, a low warm card ----
float rectL(vec3 ro, vec3 rd, vec3 c, vec3 n, vec2 hs, float soft){
  float dn = dot(rd, n); if (dn > -1e-4) return 0.0;
  float t = dot(c - ro, n) / dn; if (t < 0.0) return 0.0;
  vec3 u = normalize(cross(vec3(0.0, 1.0, 0.0), n)); vec3 v = cross(n, u);
  vec3 q = ro + rd * t - c; float s = soft * t;
  vec2 d = abs(vec2(dot(q, u), dot(q, v))) - hs;
  float cloth = 1.0 - 0.3 * clamp(length(vec2(dot(q, u), dot(q, v)) / hs), 0.0, 1.4);
  return smoothstep(s, -s, d.x) * smoothstep(s, -s, d.y) * cloth;
}
vec3 env(vec3 ro, vec3 rd, float rough){
  float soft = 0.025 + rough * 0.8;
  vec3 c = vec3(0.014, 0.011, 0.009) * (0.6 + 0.4 * smoothstep(-0.2, 0.6, rd.y));
  c += vec3(0.3, 0.17, 0.08) * 0.3 * exp(-pow((rd.y - 0.1) / 0.3, 2.0)) * smoothstep(0.2, -0.8, rd.z);
  c += KEYC * 15.0 * rectL(ro, rd, LK * 9.0 + vec3(uKey, 0.0, 0.0), -LK, vec2(2.3, 1.2), soft);
  c += vec3(1.0, 0.9, 0.78) * 2.2 * rectL(ro, rd, vec3(3.2 + uKey * 0.3, 8.5, -6.8), normalize(vec3(-0.15, -0.8, 0.6)), vec2(2.6, 0.32), soft);
  c += vec3(0.55, 0.68, 0.95) * 2.4 * rectL(ro, rd, vec3(9.0, 3.0, -1.5), normalize(vec3(-1.0, -0.25, 0.2)), vec2(0.45, 2.2), soft);
  c += vec3(1.0, 0.82, 0.62) * 1.5 * rectL(ro, rd, vec3(-5.0, 2.6, 7.5), normalize(vec3(0.6, -0.3, -1.0)), vec2(1.6, 0.9), soft);
  return c;
}
float pool(vec3 p){ vec2 d = (p.xz - vec2(1.05, -0.35)) * vec2(0.78, 1.0); return 0.05 + 0.95 * exp(-dot(d, d) / 9.0); }
vec3 fres(vec3 f0, float c){ return f0 + (1.0 - f0) * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }
vec4 plateTex(vec2 xz){ return texture2D(uPlate, vec2((xz.x + PW) / (2.0 * PW), (xz.y + PL) / (2.0 * PL))); }
bool inWin(vec2 xz){ return abs(xz.x - BX) < WX && abs(xz.y - BZ) < WZ; }
vec3 panelAlb(vec3 gp){
  float hm = n2(gp.xz * 34.0) * 0.6 + n2(gp.xz * 95.0) * 0.4;
  vec3 a = vec3(0.05, 0.047, 0.043) * (0.86 + 0.28 * hm);
  // the seams between channel strips
  float sx = min(abs(gp.x + 1.2), abs(gp.x - 3.62));
  return a * (0.35 + 0.65 * smoothstep(0.004, 0.012, sx));
}
float lampGlow(vec3 p){ vec3 q = p - LAMP; return uLamp / (1.0 + dot(q, q) * 70.0); }
vec3 floorLite(vec3 gp){
  float pl = pool(gp);
  if (abs(gp.x) < PW && abs(gp.z) < PL) {
    if (abs(gp.x) < SW && abs(gp.z) < SL) return vec3(0.002);
    vec4 t = plateTex(gp.xz);
    return BRASS * 0.5 * mix(vec3(1.0), vec3(0.06), max(t.r, t.g)) * (KEYC * 1.5 * LK.y * pl + 0.03);
  }
  if (inWin(gp.xz)) return vec3(0.55, 0.36, 0.17) * 0.7;
  return panelAlb(gp) * (KEYC * 1.7 * LK.y * pl + vec3(0.03)) + vec3(1.0, 0.2, 0.06) * 0.12 * lampGlow(gp);
}
vec3 envAll(vec3 p, vec3 r, float rough){
  if (r.y < -0.002) { float t = -p.y / r.y; if (t < 25.0) return floorLite(p + r * t); return vec3(0.004); }
  return env(p, r, rough);
}

// ---- materials ----
vec3 shadeBrass(vec3 p, vec3 n, vec3 gn, vec3 rd, vec3 f0, float rough, float a, float sh){
  vec3 r = reflect(rd, n);
  vec3 s = envAll(p + gn * 0.003, r, rough);
  // a polished part sees the dark room close by: soften what it sees with the occlusion
  vec3 dl = KEYC * 2.0 * max(dot(n, LK), 0.0) * sh * pool(p);
  return fres(f0, dot(-rd, n)) * (s * (0.25 + 0.75 * a) + (0.06 + rough * 0.5) * dl + 0.01 * a);
}
float screw(vec3 p, inout vec3 n){
  float k = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 c = vec2(i < 2 ? -0.6 : 0.6, mod(float(i), 2.0) < 0.5 ? -2.12 : 2.12);
    vec2 d = p.xz - c; float r = length(d);
    if (r < 0.052) {
      float h = sqrt(max(0.0, 0.0028 - r * r));
      n = normalize(vec3(d.x, h * 1.6, d.y));
      float ang = 0.6 + float(i) * 1.3;
      float sl = abs(d.x * cos(ang) + d.y * sin(ang));
      k = smoothstep(0.009, 0.006, sl) * 0.85 + smoothstep(0.046, 0.054, r) * 0.6;
    }
  }
  return k;
}
vec3 shadePlate(vec3 p, vec3 gn, vec3 rd, vec2 rnd){
  vec3 n = gn; float paint = 0.0; float red = 0.0;
  float a = ao(p, gn); float sh = shadow(p + gn * 0.003);
  if (gn.y > 0.9) {
    vec4 tx = plateTex(p.xz);
    paint = max(tx.r, tx.g); red = tx.g;
    float e = 0.004;
    float gx = max(plateTex(p.xz + vec2(e, 0.0)).r, plateTex(p.xz + vec2(e, 0.0)).g) - max(plateTex(p.xz - vec2(e, 0.0)).r, plateTex(p.xz - vec2(e, 0.0)).g);
    float gz = max(plateTex(p.xz + vec2(0.0, e)).r, plateTex(p.xz + vec2(0.0, e)).g) - max(plateTex(p.xz - vec2(0.0, e)).r, plateTex(p.xz - vec2(0.0, e)).g);
    n = normalize(n + vec3(gx, 0.0, gz) * 0.9);
    // brushed along the slot
    n = normalize(n + vec3((n1(p.x * 1400.0 + n1(p.z * 3.0) * 4.0) - 0.5) * 0.05 + rnd.x * 0.05, 0.0, rnd.y * 0.012));
    float sk = screw(p, n);
    paint = max(paint, sk);
  }
  float tarn = n2(p.xz * vec2(2.2, 0.9)) * 0.6 + n2(p.xz * 9.0) * 0.4;
  float wear = smoothstep(0.55, 0.8, max(abs(p.x) / PW, abs(p.z) / PL));
  vec3 f0 = mix(BRASS * vec3(0.98, 0.9, 0.82), vec3(0.55, 0.38, 0.2), 0.35 * tarn + 0.35 * wear) * (0.82 + 0.18 * tarn);
  vec3 metal = shadeBrass(p, n, gn, rd, f0, 0.16, a, sh);
  vec3 pc = mix(vec3(0.016, 0.014, 0.012), vec3(0.42, 0.035, 0.02), red > 0.5 * paint ? 1.0 : 0.0);
  vec3 pd = pc * (KEYC * 1.9 * max(dot(gn, LK), 0.0) * sh * pool(p) + 0.03 * a) + 0.03 * envAll(p, reflect(rd, gn), 0.3);
  return mix(metal, pd, paint);
}
vec3 shadeCap(vec3 p, vec3 gn, vec3 rd, vec2 rnd){
  vec3 q = capLocal(p);
  float a = ao(p, gn); float sh = shadow(p + gn * 0.004);
  vec3 n = gn; float rough = 0.05;
  if (q.y > 0.12) {
    // the dish is brushed across, by the thumbs that used it
    n = normalize(n + vec3(0.0, 0.0, (n1(q.z * 1800.0) - 0.5) * 0.06) + vec3(rnd.x * 0.1, 0.0, rnd.y * 0.02));
    rough = 0.12;
  } else n = normalize(n + vec3(rnd, 0.0).xzy * 0.012);
  vec3 col = shadeBrass(p, n, gn, rd, BRASS * vec3(1.02, 1.0, 0.98), rough, a, sh);
  // the black index line across the top
  float line = smoothstep(0.014, 0.01, abs(q.z)) * step(0.1, q.y);
  vec3 lc = vec3(0.012) * (KEYC * 2.0 * max(dot(gn, LK), 0.0) * sh + 0.05) + 0.045 * envAll(p, reflect(rd, gn), 0.05);
  return mix(col, lc, line);
}
vec3 shadeBez(vec3 p, vec3 gn, vec3 rd, vec2 rnd){
  float a = ao(p, gn); float sh = shadow(p + gn * 0.003);
  vec3 n = normalize(gn + vec3(rnd.x, 0.0, rnd.y) * 0.04);
  float F = 0.045 + 0.955 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 alb = vec3(0.022, 0.018, 0.016);
  // the inner walls pick up the meter lamps
  vec3 spill = vec3(1.0, 0.62, 0.3) * 0.5 * smoothstep(0.05, -0.06, p.y) ;
  return alb * (KEYC * 2.0 * max(dot(gn, LK), 0.0) * sh * pool(p) + 0.03 * a) + spill * alb * 4.0 + F * envAll(p, reflect(rd, n), 0.12) * (0.3 + 0.7 * a);
}
vec3 shadeLamp(vec3 p, vec3 gn, vec3 rd){
  vec3 q = p - LAMP;
  float a = ao(p, gn);
  if (length(q.xz) > 0.07) return shadeBrass(p, gn, gn, rd, BRASS * 0.9, 0.08, a, shadow(p + gn * 0.003));
  float F = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, gn), 0.0, 1.0), 5.0);
  float core = 1.0 - length(q.xz) / 0.075;
  vec3 glow = vec3(1.0, 0.16, 0.04) * (0.04 + uLamp * (3.0 + 6.0 * core * core));
  return glow * (1.0 - F) + F * envAll(p, reflect(rd, gn), 0.02);
}

// ---- the meter: glass, needle, printed face ----
float needleD(vec2 xz, out float along){
  vec2 d = vec2(sin(uNeedle), -cos(uNeedle)); vec2 q = xz - PIV;
  along = clamp(dot(q, d), 0.2, 1.1);
  return length(q - d * along);
}
vec3 shadeFace(vec3 f){
  vec2 uv = vec2((f.x - (BX - WX)) / (2.0 * WX), (f.z - (BZ - WZ)) / (2.0 * WZ));
  vec3 alb = texture2D(uFace, uv).rgb; alb *= alb;
  float al;
  vec2 sp = f.xz + LK.xz * ((NY - FY) / LK.y);
  float shN = 1.0 - 0.75 * smoothstep(0.012, 0.003, needleD(sp, al));
  float sh = shadow(f + vec3(0.0, 0.002, 0.0));
  vec2 c = (uv - vec2(0.5, 0.95)) * vec2(1.1, 1.0);
  float back = 0.35 + 0.75 * exp(-dot(c, c) * 2.2);
  // edges of the window fall into the shade of the lip
  float edge = smoothstep(0.0, 0.06, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
  vec3 lamp = vec3(1.0, 0.64, 0.3) * 1.1 * back * (0.45 + 0.55 * edge);
  return alb * (lamp + KEYC * 1.7 * LK.y * sh * shN * pool(f));
}
vec3 under(vec3 o, vec3 rd){
  // needle first: it rides a little above the card
  float tn = (NY - o.y) / rd.y; vec3 qn = o + rd * tn;
  float al; float nd = needleD(qn.xz, al);
  float w = mix(0.0075, 0.0028, (al - 0.2) / 0.9);
  if (nd < w && inWin(qn.xz)) {
    vec3 nc = vec3(0.012, 0.011, 0.01) * (1.0 + 2.0 * KEYC * LK.y) + vec3(0.08, 0.04, 0.015) * (1.0 - nd / w);
    return nc;
  }
  float tf = (FY - o.y) / rd.y; vec3 f = o + rd * tf;
  if (inWin(f.xz)) return shadeFace(f);
  return vec3(0.03, 0.018, 0.008);
}
vec3 shadeGlass(vec3 o, vec3 rd, vec2 rnd){
  vec2 sm = vec2(n2(o.xz * 6.0), n2(o.xz * 6.0 + 7.0)) - 0.5;
  vec3 n = normalize(vec3(sm.x * 0.01 + rnd.x * 0.004, 1.0, sm.y * 0.01 + rnd.y * 0.004));
  float F = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  float dust = 0.6 + 0.4 * n2(o.xz * 14.0);
  // a faint image of the lamp-lit room across the glass, heaviest toward the far edge
  vec2 w = (o.xz - vec2(BX, BZ)) / vec2(WX, WZ);
  float sheen = smoothstep(0.55, -0.2, w.y + w.x * 0.35) * smoothstep(-1.2, -0.3, w.y + w.x * 0.35) * 0.09 + 0.25 * smoothstep(0.03, 0.0, abs(w.x * 0.6 - w.y - 0.15)) * 0.0;
  vec3 refl = env(o, reflect(rd, n), 0.0) * F + vec3(1.0, 0.85, 0.66) * sheen * dust;
  return refl + (1.0 - F - sheen) * 0.97 * under(o, rd);
}
vec3 shadePanel(vec3 gp, vec3 rd, vec2 rnd){
  vec3 gn = vec3(0.0, 1.0, 0.0);
  float a = ao(gp, gn); float sh = shadow(gp + gn * 0.002);
  vec3 alb = panelAlb(gp);
  vec3 n = normalize(gn + vec3(n2(gp.xz * 40.0) - 0.5, 0.0, n2(gp.xz * 40.0 + 3.0) - 0.5) * 0.03 + vec3(rnd.x, 0.0, rnd.y) * 0.06);
  float F = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 col = alb * (KEYC * 2.0 * LK.y * sh * pool(gp) + vec3(0.025) * a) + vec3(1.0, 0.2, 0.06) * 0.22 * lampGlow(gp);
  col += 0.5 * F * envAll(gp + gn * 0.002, reflect(rd, n), 0.32) * (0.25 + 0.75 * a) * (0.5 + 0.5 * sh);
  return col;
}

void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))); vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * uJit.z + up * uJit.w; rd = normalize(fp - ro);
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uSeed);
  float ang = ign * 6.2831853; float rr = sqrt(fract(ign * 7.13 + uSeed * 3.7));
  vec2 rnd = vec2(cos(ang), sin(ang)) * rr * step(0.001, uSeed);

  float tpl = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  vec3 pp = ro + rd * tpl;
  bool slot = abs(pp.x) < SW && abs(pp.z) < SL;
  if (slot) tpl = (-0.4 - ro.y) / rd.y;
  float tgl = 1e9;
  { float t = (GY - ro.y) / rd.y; vec3 q = ro + rd * t; if (t > 0.0 && inWin(q.xz)) tgl = t; }
  float ts = march(ro, rd, min(tpl, tgl));
  vec3 col;
  if (ts > 0.0) {
    vec3 p = ro + rd * ts; vec3 n = calcN(p);
    float dP = sPlate(p); float dC = sCap(p); float dB = sBez(p); float dL = sLamp(p);
    float m = min(min(dP, dC), min(dB, dL));
    if (m == dC) col = shadeCap(p, n, rd, rnd);
    else if (m == dP) col = shadePlate(p, n, rd, rnd);
    else if (m == dB) col = shadeBez(p, n, rd, rnd);
    else col = shadeLamp(p, n, rd);
  }
  else if (tgl < 1e8) col = shadeGlass(ro + rd * tgl, rd, rnd);
  else if (slot) col = vec3(0.0015, 0.0012, 0.001);
  else if (tpl < 1e8) col = shadePanel(ro + rd * tpl, rd, rnd);
  else col = env(ro, rd, 0.0);
  col = min(col, vec3(24.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

const POST = `
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain; uniform vec2 uCentre;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uAcc, uv).rgb;
  vec3 b = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 20.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.026 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.2, 0.0), vec3(6.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.012 * vec3(1.0, 0.85, 0.65);
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.35 * smoothstep(0.35, 1.25, length(q));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.022;
  outC = vec4(c, 1.0);
}
`;

// The engraved plate, drawn flat: red channel is black-filled engraving, green is red-filled.
function platePrint() {
  const k = 420, W = Math.round(PW * 2 * k), Hh = Math.round(PL * 2 * k);
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = Hh;
  const g = cv.getContext("2d");
  if (!g) return cv;
  g.fillStyle = "#000"; g.fillRect(0, 0, W, Hh);
  const X = (x: number) => (x + PW) * k, Y = (z: number) => (z + PL) * k;
  for (let v = 0; v <= MAX; v += 2) {
    const major = MARKS.some((m) => m[0] === v);
    if (major) continue;
    g.fillStyle = "#f00";
    g.fillRect(X(-0.19), Y(zOf(v)) - 0.006 * k, 0.07 * k, 0.012 * k);
  }
  g.textAlign = "right"; g.textBaseline = "middle";
  for (const [v, d] of MARKS) {
    const z = zOf(v), unity = d === 0;
    g.fillStyle = unity ? "#0f0" : "#f00";
    g.fillRect(X(-0.36), Y(z) - 0.011 * k, 0.29 * k, 0.022 * k);
    g.fillRect(X(0.08), Y(z) - 0.011 * k, 0.2 * k, 0.022 * k);
    g.font = `600 ${0.15 * k}px ${FONT}`;
    const t = v === 0 ? "∞" : d > 0 ? `+${d}` : d === 0 ? "0" : String(-d);
    g.fillText(t, X(-0.42), Y(z) + 0.006 * k);
  }
  g.fillStyle = "#f00"; g.textAlign = "left";
  g.font = `600 ${0.1 * k}px ${FONT}`;
  g.fillText("dB", X(0.36), Y(zOf(100)));
  g.save(); g.translate(X(0.5), Y(0.1)); g.rotate(Math.PI / 2);
  g.textAlign = "center"; g.font = `500 ${0.085 * k}px ${FONT}`;
  g.fillText("HALLOWAY SOUND  ·  DESK B", 0, 0);
  g.restore();
  g.textAlign = "center"; g.font = `700 ${0.2 * k}px ${FONT}`;
  g.fillText("07", X(0.45), Y(1.98));
  return cv;
}

// The meter card: cream stock, black and red scale, printed in the same geometry the needle uses.
function facePrint() {
  const k = 500, W = Math.round(WX * 2 * k), Hh = Math.round(WZ * 2 * k);
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = Hh;
  const g = cv.getContext("2d");
  if (!g) return cv;
  const grd = g.createLinearGradient(0, 0, 0, Hh);
  grd.addColorStop(0, "#f2e6c8"); grd.addColorStop(1, "#ead9b0");
  g.fillStyle = grd; g.fillRect(0, 0, W, Hh);
  for (let i = 0; i < 2400; i++) {
    g.fillStyle = `rgba(120,90,40,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * W, Math.random() * Hh, 1.5, 1.5);
  }
  const px = WX * k, py = (PIVZ - (BZ - WZ)) * k;
  const at = (a: number, r: number): [number, number] => [px + Math.sin(a) * r * k, py - Math.cos(a) * r * k];
  const arc = (r: number, a0: number, a1: number, w: number, col: string) => {
    g.beginPath(); g.strokeStyle = col; g.lineWidth = w * k;
    g.arc(px, py, r * k, a0 - Math.PI / 2, a1 - Math.PI / 2); g.stroke();
  };
  arc(0.96, angleOf(-20), angleOf(0), 0.008, "#1b1712");
  arc(0.985, angleOf(0), angleOf(3), 0.05, "#b3241a");
  const ticks = [-20, -10, -7, -5, -3, -2, -1, 0, 1, 2, 3];
  g.textAlign = "center"; g.textBaseline = "middle";
  for (const d of ticks) {
    const a = angleOf(d), red = d > 0;
    const [x0, y0] = at(a, 0.96), [x1, y1] = at(a, 1.05);
    g.beginPath(); g.strokeStyle = red ? "#b3241a" : "#1b1712"; g.lineWidth = 0.009 * k;
    g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    const [tx, ty] = at(a, 1.12);
    g.fillStyle = red ? "#b3241a" : "#1b1712";
    g.font = `600 ${0.072 * k}px ${FONT}`;
    g.fillText(String(Math.abs(d)), tx, ty);
  }
  for (let d = -20; d <= 3; d += 0.5) {
    if (ticks.includes(d)) continue;
    if (d < -10 && d % 2 !== 0) continue;
    const a = angleOf(d), [x0, y0] = at(a, 0.96), [x1, y1] = at(a, 1.0);
    g.beginPath(); g.strokeStyle = d > 0 ? "#b3241a" : "#1b1712"; g.lineWidth = 0.005 * k;
    g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  }
  // the percentage scale under the arc
  arc(0.84, angleOf(-20), angleOf(3), 0.004, "#1b1712");
  g.font = `500 ${0.045 * k}px ${FONT}`; g.fillStyle = "#1b1712";
  for (let pc = 0; pc <= 100; pc += 20) {
    const a = -0.82 + ((pc / 100 - P20) / (P3 - P20)) * 1.64;
    if (a < -0.85) continue;
    const [x0, y0] = at(a, 0.84), [x1, y1] = at(a, 0.88);
    g.beginPath(); g.lineWidth = 0.004 * k; g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    const [tx, ty] = at(a, 0.79);
    g.fillText(String(pc), tx, ty);
  }
  g.fillStyle = "#1b1712"; g.font = `500 ${0.07 * k}px ${FONT}`;
  const [mx, my] = at(-0.92, 1.12); g.fillText("−", mx, my);
  g.fillStyle = "#b3241a"; const [ppx, ppy] = at(0.92, 1.12); g.fillText("+", ppx, ppy);
  g.fillStyle = "#1b1712";
  g.font = `italic 600 ${0.2 * k}px ${SERIF}`;
  g.fillText("VU", px, py - 0.5 * k);
  g.font = `600 ${0.04 * k}px ${FONT}`;
  g.fillText("H A L L O W A Y", px, py - 0.37 * k);
  return cv;
}

// No WebGL: the same channel strip, built from gradients.
function Still({ value, needle }: { value: number; needle: number }) {
  const f = value / MAX;
  return (
    <div aria-hidden="true" className="absolute left-1/2 top-[32%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 scale-[0.62] sm:scale-75 lg:left-[68%] lg:top-1/2 lg:scale-100">
      <div className="absolute left-[40px] top-[20px] h-[480px] w-[150px] rounded-[6px]" style={{ background: "linear-gradient(90deg, #6b4c1e 0%, #c9a052 30%, #e7c983 50%, #b88d3e 75%, #5e4318 100%)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
        <div className="absolute left-1/2 top-[24px] h-[432px] w-[10px] -translate-x-1/2 rounded-full bg-[#050403]" />
        <div className="absolute left-1/2 h-[54px] w-[120px] -translate-x-1/2 rounded-[8px]" style={{ top: `${24 + (1 - f) * 380}px`, background: "linear-gradient(180deg, #fff1c4 0%, #e0b35c 30%, #a87a2c 70%, #6a4a18 100%)", boxShadow: "0 16px 18px rgba(0,0,0,0.55), inset 0 -2px 0 rgba(0,0,0,0.3)" }}>
          <div className="absolute inset-x-2 top-1/2 h-[3px] -translate-y-1/2 bg-[#14110c]" />
        </div>
      </div>
      <div className="absolute left-[230px] top-[150px] h-[190px] w-[270px] overflow-hidden rounded-[14px] border-[12px] border-[#14110f]" style={{ background: "radial-gradient(120% 90% at 50% 100%, #fff1c9 0%, #f0dca9 50%, #c9a868 100%)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
        <div className="absolute bottom-[-40px] left-1/2 h-[190px] w-[2px] origin-bottom bg-[#120f0b]" style={{ transform: `translateX(-50%) rotate(${needle}rad)` }} />
        <p className="absolute inset-x-0 top-[60px] text-center text-[34px] italic text-[#1b1712]" style={{ fontFamily: SERIF }}>VU</p>
      </div>
    </div>
  );
}

export default function BrassMixingDeskFader() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(START);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const valRef = useRef(START);
  const api = useRef<{ go: (v: number, fromUser: boolean) => void } | null>(null);

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
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uCapZ", "uLean", "uLift", "uNeedle", "uLamp", "uKey", "uPlate", "uFace", "uDirect"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    const upload = (unit: number, img: HTMLCanvasElement) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      if (gl2) gl.generateMipmap(gl.TEXTURE_2D);
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl2 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    upload(0, platePrint());
    upload(1, facePrint());

    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const s = {
      z: zOf(START), vz: 0, lean: 0, vlean: 0, lift: 0, vlift: 0, target: zOf(START), drag: false, grab: 0,
      nd: angleOf(dbOf(START) - 3.5), vn: 0, lamp: 0, lastV: START,
      px: 0, py: 0, sx: 0, sy: 0, key: 0, count: 0, fresh: true, frame: 0, slow: 0, ft: 0, fn: 0, fps: 0,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, demoI: 0, first: true,
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.3e6 / (cssW * cssH * dpr * dpr)));
      const w = Math.max(2, Math.round(cssW * dpr * k)), h = Math.max(2, Math.round(cssH * dpr * k));
      if (w === W && h === H) return;
      W = w; H = h; cv.width = W; cv.height = H;
      if (gl2 && acc && fbo) {
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, acc);
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

    // A long lens, high over the desk and a little to the left, looking down the slot.
    const camera = () => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      const el = (wide ? 0.9 : 0.98) - s.sy * 0.015, az = (wide ? -0.3 : -0.12) + s.sx * 0.04, dist = 15;
      const tgt = wide ? [1.2, 0.0, -0.05] : [1.2, 0.0, 0.0];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] + dist * Math.cos(az) * Math.cos(el)];
      const foc = wide ? 2.55 * Math.min(1, aspect / 1.55) : 1.42 * Math.max(Math.min(1, aspect / 0.55), Math.min(1.55, aspect / 0.55));
      const fw = [tgt[0] - cam[0], tgt[1] - cam[1], tgt[2] - cam[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]); fw[0] /= fl; fw[1] /= fl; fw[2] /= fl;
      const rt = [-fw[2], 0, fw[0]]; const rl = Math.hypot(rt[0], rt[2]); rt[0] /= rl; rt[2] /= rl;
      const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      const shift = wide ? [0.17 * aspect, 0.015] : [0, 0.13];
      return { cam, tgt, fw, rt, up, foc, shift, wide };
    };
    // Where on the desk, at the height of the cap's top, a point on the screen lands.
    const pick = (cx: number, cy: number) => {
      const r = box.getBoundingClientRect(), c = camera();
      const ux = (cx - r.left - r.width / 2) / r.height - c.shift[0], uy = (r.height / 2 - (cy - r.top)) / r.height - c.shift[1];
      const d = [0, 1, 2].map((i) => c.fw[i] * c.foc + c.rt[i] * ux + c.up[i] * uy);
      const t = (0.33 - c.cam[1]) / d[1];
      return { x: c.cam[0] + d[0] * t, z: c.cam[2] + d[2] * t };
    };

    const draw = (alpha: number, sample: number) => {
      const c = camera();
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.13 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]); gl.uniform3f(su.uTgt, c.tgt[0], c.tgt[1], c.tgt[2]);
      gl.uniform1f(su.uFoc, c.foc);
      gl.uniform2f(su.uShift, c.shift[0], c.shift[1]);
      // focus rides on the cap
      gl.uniform1f(su.uFocus, (0 - c.cam[0]) * c.fw[0] + (0.25 - c.cam[1]) * c.fw[1] + (s.z - c.cam[2]) * c.fw[2]);
      gl.uniform1f(su.uCapZ, s.z); gl.uniform1f(su.uLean, s.lean); gl.uniform1f(su.uLift, s.lift);
      gl.uniform1f(su.uNeedle, s.nd); gl.uniform1f(su.uLamp, s.lamp); gl.uniform1f(su.uKey, s.key);
      gl.uniform1i(su.uPlate, 0); gl.uniform1i(su.uFace, 1);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 2); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, c.wide ? 0.66 : 0.5, c.wide ? 0.5 : 0.68);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const go = (v: number, fromUser: boolean) => {
      const k = Math.max(0, Math.min(MAX, Math.round(v)));
      if (fromUser) s.touched = true;
      s.target = zOf(k);
      if (k !== valRef.current) { valRef.current = k; setValue(k); }
      if (reduce) { s.z = s.target; s.vz = 0; s.count = 0; s.fresh = true; }
      wake();
    };
    api.current = { go };

    // A program signal, roughly a song: a kick, a slow swell and some grit.
    const program = (t: number) => {
      const beat = Math.exp(-((t * 2.03) % 1) * 4.5), off = Math.exp(-(((t * 2.03) + 0.5) % 1) * 7);
      return 0.56 + 0.2 * beat + 0.08 * off + 0.07 * Math.sin(t * 0.63) + 0.04 * Math.sin(t * 7.3) * Math.sin(t * 2.9);
    };
    const needleTarget = (t: number) => {
      const v = vOfZ(s.z);
      if (v < 0.3) return -0.96;
      const db = 20 * Math.log10(Math.pow(10, dbOf(v) / 20) * program(t)) + 2.5;
      return Math.max(-0.96, Math.min(0.97, angleOf(db)));
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 3800; }
      const t = (now - s.t0) / 1000;
      s.ft += dtRaw; s.fn++; if (s.ft > 1) { s.fps = s.fn / s.ft; s.ft = 0; s.fn = 0; box.dataset.fps = s.fps.toFixed(0); }

      if (!still && !s.touched && !s.drag && now > s.demoAt) {
        go(DEMO[s.demoI % DEMO.length], false);
        s.demoI++; s.demoAt = now + 3000;
      }

      let moving = false;
      if (!reduce) {
        const steps = 4, h = dt / steps;
        for (let i = 0; i < steps; i++) {
          // a heavy cap on greased rails: it lags the hand, then settles with one small overshoot
          const stiff = s.drag ? 240 : 120, damp = s.drag ? 24 : 15;
          const a = stiff * (s.target - s.z) - damp * s.vz;
          s.vz += a * h; s.z += s.vz * h;
          // it leans in the slot against the way it is pushed, and rights itself
          s.vlean += (-260 * s.lean - 16 * s.vlean - a * 0.0028) * h; s.lean += s.vlean * h;
          s.vlift += (-900 * s.lift - 26 * s.vlift) * h; s.lift += s.vlift * h;
          // the meter: VU ballistics, a 300 ms rise with a touch of overshoot
          const nt = still ? needleTarget(2.2) : needleTarget(t);
          s.vn += (95 * (nt - s.nd) - 13 * s.vn) * h; s.nd += s.vn * h;
          if (s.nd > 0.95) { s.nd = 0.95; s.vn = -Math.abs(s.vn) * 0.35; }
          if (s.nd < -0.97) { s.nd = -0.97; s.vn = Math.abs(s.vn) * 0.3; }
        }
        // a detent: the cap drops into the notch with a clunk the needle feels too
        const vNow = vOfZ(s.z);
        for (const [m] of MARKS) {
          if ((s.lastV - m) * (vNow - m) < 0 || (vNow === m && s.lastV !== m)) { s.vlift -= 0.5; s.vn += 0.6; s.vlean += Math.sign(s.vz) * 0.4; break; }
        }
        s.lastV = vNow;
        if (Math.abs(s.vz) > 0.002 || Math.abs(s.target - s.z) > 0.0005 || Math.abs(s.lean) > 0.0004 || Math.abs(s.lift) > 0.0004 || Math.abs(s.vn) > 0.004) moving = true;
        else { s.z = s.target; s.vz = 0; s.lean = 0; s.lift = 0; }
      } else {
        s.nd = needleTarget(2.2);
      }
      const peak = s.nd > angleOf(1.2) ? 1 : 0;
      s.lamp += (peak - s.lamp) * (1 - Math.exp(-dt * (peak ? 30 : 4)));
      if (!still) {
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        s.key = Math.sin(t * 0.35 + 0.4) * 0.5 + s.sx * 0.6;
        moving = true;
      }

      const fast = Math.abs(s.vz) > 0.15 || Math.abs(s.vn) > 0.6;
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(fast ? 0.6 : still ? 0.5 : 0.22, 1 + (s.frame % 64)); s.count = still ? 1 : 6; }
      else if (s.count < 40) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      if (!still && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 45 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 40 || (!still && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);

    // the cap drops into the nearest engraved mark when it passes close
    const detent = (v: number) => {
      for (const [m] of MARKS) if (Math.abs(v - m) < DETENT) return m;
      return Math.round(v);
    };
    let id = -1;
    const down = (e: PointerEvent) => {
      const p = pick(e.clientX, e.clientY);
      if (Math.abs(p.x) > 1.05 || Math.abs(p.z) > 2.4) return;
      id = e.pointerId; s.drag = true; s.touched = true;
      s.grab = Math.abs(p.z - s.z) < 0.3 ? s.z - p.z : 0;
      try { pad.setPointerCapture(id); } catch { /* the pointer is already gone */ }
      go(detent(vOfZ(p.z + s.grab)), true);
    };
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (s.drag && e.pointerId === id) {
        const k = Math.max(0, Math.min(MAX, detent(vOfZ(pick(e.clientX, e.clientY).z + s.grab))));
        s.target = zOf(k);
        if (k !== valRef.current) { valRef.current = k; setValue(k); }
      }
      if (!still || s.drag) wake();
    };
    const upFn = (e: PointerEvent) => {
      if (!s.drag || e.pointerId !== id) return;
      s.drag = false; go(valRef.current, true);
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
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      pad.removeEventListener("pointerdown", down); box.removeEventListener("pointermove", move);
      pad.removeEventListener("pointerup", upFn); pad.removeEventListener("pointercancel", upFn);
      box.removeEventListener("pointerleave", leave); cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const change = (v: number) => {
    if (api.current) api.current.go(v, true); else { valRef.current = v; setValue(v); }
  };
  const db = label(value);
  const stillNeedle = value <= 0 ? -0.96 : Math.max(-0.96, Math.min(0.95, angleOf(dbOf(value) - 1.6)));

  return (
    <section className="relative isolate overflow-hidden bg-[#0d0b09] text-[#f1e6d0]" style={{ fontFamily: FONT }}>
      <style>{`
        .brass-fader-range { -webkit-appearance: none; appearance: none; background: transparent; height: 44px; cursor: pointer; }
        .brass-fader-range::-webkit-slider-runnable-track { height: 2px; border-radius: 2px; background: linear-gradient(90deg, #d9a55a var(--fill), rgba(241,230,208,0.22) var(--fill)); }
        .brass-fader-range::-moz-range-track { height: 2px; border-radius: 2px; background: rgba(241,230,208,0.22); }
        .brass-fader-range::-moz-range-progress { height: 2px; background: #d9a55a; }
        .brass-fader-range::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 14px; margin-top: -6px; border-radius: 3px; border: 0; background: linear-gradient(180deg, #fff0c2 0%, #d8a956 45%, #8a6223 100%); box-shadow: 0 2px 4px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(0,0,0,0.3); transition: transform 160ms cubic-bezier(0.2, 0.9, 0.2, 1.4); }
        .brass-fader-range::-moz-range-thumb { width: 22px; height: 14px; border-radius: 3px; border: 0; background: linear-gradient(180deg, #fff0c2 0%, #d8a956 45%, #8a6223 100%); box-shadow: 0 2px 4px rgba(0,0,0,0.6); }
        .brass-fader-range:active::-webkit-slider-thumb { transform: scale(1.18); }
        .brass-fader-range:focus-visible { outline: 2px solid #e2b064; outline-offset: 4px; border-radius: 6px; }
        @media (prefers-reduced-motion: reduce) { .brass-fader-range::-webkit-slider-thumb { transition: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[760px] w-full max-w-[1600px]" style={{ background: "radial-gradient(70% 70% at 66% 50%, #3a2a1a 0%, #1a130d 45%, #0d0b09 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />

        {shown === "still" && <Still value={value} needle={stillNeedle} />}

        <div ref={hit} className="absolute inset-x-0 top-0 h-[62%] cursor-grab select-none active:cursor-grabbing lg:bottom-0 lg:left-[36%] lg:top-0 lg:h-auto" style={{ touchAction: "none" }} />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end px-6 pb-7 sm:px-10 lg:justify-center lg:px-16 lg:pb-0">
          <p className="hidden text-[11px] font-medium uppercase tracking-[0.34em] text-[#f1e6d0]/55 lg:block">Halloway Sound <span className="mx-2 text-[#f1e6d0]/25">/</span> channel 07</p>
          <div className="lg:mt-8">
            <p className="flex items-start">
              <span className="text-[104px] font-semibold leading-[0.8] tracking-[-0.065em] tabular-nums sm:text-[140px] lg:text-[176px]">{db}</span>
              <span className="ml-3 mt-1 text-[22px] font-medium tracking-[-0.02em] text-[#e2b064] lg:ml-4 lg:mt-2 lg:text-[30px]">dB</span>
            </p>
            <p className="mt-4 w-[24rem] max-w-[82vw] text-[19px] italic leading-snug text-[#f1e6d0]/75 lg:mt-6 lg:text-[23px]" style={{ fontFamily: SERIF }}>{noteFor(value)}</p>
            <div className="pointer-events-auto mt-4 flex w-[19rem] max-w-full items-center gap-4 lg:mt-6">
              <label htmlFor="brass-fader-level" className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#f1e6d0]/65">Level</label>
              <input
                id="brass-fader-level"
                type="range"
                min={0}
                max={MAX}
                step={1}
                value={value}
                onChange={(e) => change(Number(e.target.value))}
                aria-valuetext={`${value <= 0 ? "minus infinity, muted" : `${db.replace("−", "minus ")} decibels`}. ${noteFor(value)}`}
                className="brass-fader-range min-w-0 flex-1"
                style={{ ["--fill" as string]: `${value}%` }}
              />
            </div>
          </div>
        </div>
        <p className="pointer-events-none absolute bottom-7 right-6 hidden text-[11px] uppercase tracking-[0.3em] text-[#f1e6d0]/45 sm:right-10 lg:bottom-12 lg:right-16 lg:block">Drag the cap</p>
      </div>
    </section>
  );
}
