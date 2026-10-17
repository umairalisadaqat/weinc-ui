import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// What the key says in each state. `legend` is cut through the anodising and lit from behind.
const LEGEND = ["ON", "AIR"];
const PLATE = ["MARLOW", "AIR KEY 02"]; // the two small engravings on the housing
const states = {
  on: { word: "On air", note: "Studio two is live. Keep the door shut." },
  off: { word: "Off air", note: "Mics muted, lamp out, kettle allowed." },
};
const START_ON = true;
const TRAVEL = 0.24; // how far the key goes down, in scene units (the key is 2.24 wide)
const LATCH = 0.085; // how low it sits while it is on
const DYE: [number, number, number] = [0.92, 0.085, 0.012]; // anodising colour of the key (linear RGB)
const LAMP: [number, number, number] = [1, 0.8, 0.56]; // legend, light ring and foot line (linear RGB)
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

// Scene sizes shared by the shader, the engraving and the hit area.
const HH = 1.78, HB = 0.42, KHALF = 1.12, KTOP = 0.98;

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 curve(vec3 x){ x *= 0.92; vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return clamp(a / b, 0.0, 1.0); }
// half of the curve is applied to the brightest channel alone, so a hot orange stays orange and does not bleach to yellow
vec3 tone(vec3 x){ float pk = max(max(x.r, x.g), max(x.b, 1e-4)); vec3 keep = curve(vec3(pk)) * (x / pk); return pow(mix(curve(x), keep, 0.55), vec3(1.0 / 2.2)); }
`;

// The photograph: signed-distance geometry, studio softboxes, one traced bounce.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uDrop; uniform vec2 uTilt; uniform vec3 uLvl;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform float uKey; uniform vec3 uLamp; uniform vec3 uDye; uniform sampler2D uTex; uniform float uDirect;
const float HH = ${HH.toFixed(3)}; const float HB = ${HB.toFixed(3)}; const float HR = 0.62;
const float SCREW = 1.425; const float WH = 1.31; const float WR = 0.52; const float RY = 0.385;
const float KH = ${KHALF.toFixed(3)}; const float KR = 0.36; const float KT = ${KTOP.toFixed(3)}; const float TAPER = 0.055;
const vec3 ALU = vec3(0.913, 0.921, 0.925);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float n1(float x){ float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h11(i), h11(i + 1.0), f); }

// rounded square in plan
float rb2(vec2 p, float h, float r){ vec2 q = abs(p) - (h - r); return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }

float sdHouse(vec3 p){
  float o = rb2(p.xz, HH, HR);
  float d = max(o, p.y - HB);
  d = max(d, (o + p.y - HB + 0.07) * 0.7071);            // bright-cut outer chamfer
  d = max(d, (o - p.y - 0.012) * 0.7071);                // foot bevel
  float w = rb2(p.xz, WH, WR);
  d = max(d, -max(w, RY - p.y));                         // the well the light ring sits in
  d = max(d, (p.y - HB + 0.035 - w) * 0.7071);           // its polished lip
  d = max(d, -max(abs(p.y - 0.05) - 0.022, -(o + 0.014))); // the slot for the foot line
  d = max(d, -max(abs(w - 0.2) - 0.011, HB - 0.012 - p.y)); // a fine turned groove round the well
  // four socket screws, counterbored into the corners
  vec2 a = abs(p.xz) - SCREW; float r = length(a);
  d = max(d, -max(r - 0.1, HB - 0.06 - p.y));
  float head = max(r - 0.086, p.y - HB + 0.016);
  head = max(head, (r + p.y - HB + 0.016 - 0.074) * 0.7071);
  a = vec2(a.x * 0.8776 - a.y * 0.4794, a.x * 0.4794 + a.y * 0.8776);
  head = max(head, -max(max(abs(a.x) * 0.866 + abs(a.y) * 0.5, abs(a.y)) - 0.04, HB - 0.07 - p.y));
  return min(d, head);
}
// The key's own frame: origin at the middle of its top face, rocked a little under the finger.
vec3 keyLocal(vec3 p){
  p.y -= KT - uDrop - 0.5;
  float c = cos(uTilt.x); float s = sin(uTilt.x); p.yz = vec2(p.y * c - p.z * s, p.y * s + p.z * c);
  c = cos(uTilt.y); s = sin(uTilt.y); p.xy = vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  p.y -= 0.5;
  return p;
}
float sdKey(vec3 p){
  vec3 q = keyLocal(p);
  float o = rb2(q.xz, KH, KR) + q.y * TAPER;
  float d = max(o, q.y);
  d = max(d, (o + q.y + 0.06) * 0.7071);                 // bright-cut edge
  vec2 e2 = q.xz * q.xz; float sq = sqrt(sqrt(dot(e2, e2)));
  d = max(d, q.y + 0.085 * smoothstep(1.02, 0.3, sq));   // the dish a fingertip sits in
  return max(d, -q.y - 0.95);
}
float map(vec3 p){ return min(sdHouse(p), sdKey(p)); }

vec2 bound(vec3 ro, vec3 rd){
  vec3 d = mix(rd, vec3(1e-5), step(abs(rd), vec3(1e-5)));
  vec3 t0 = (vec3(-HH, 0.0, -HH) - ro) / d; vec3 t1 = (vec3(HH, KT + 0.03, HH) - ro) / d;
  vec3 a = min(t0, t1); vec3 b = max(t0, t1);
  return vec2(max(max(a.x, a.y), max(a.z, 0.0)), min(min(b.x, b.y), b.z));
}
float march(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 84; i++) { float d = map(ro + rd * t); if (d < 0.0006 * (1.0 + t * 0.3)) return t; t += d * 0.8; if (t > tb.y) break; }
  return -1.0;
}
float marchLite(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x + 0.004;
  for (int i = 0; i < 40; i++) { float d = map(ro + rd * t); if (d < 0.0018) return t; t += d * 0.85; if (t > tb.y) break; }
  return -1.0;
}
vec3 calcN(vec3 p){
  vec2 e = vec2(0.0011, -0.0011);
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}
float calcAO(vec3 p, vec3 n){
  float o = 0.0; float s = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.012 + 0.055 * float(i); o += (h - map(p + n * h)) * s; s *= 0.72; }
  return clamp(1.0 - 2.4 * o, 0.0, 1.0);
}
float softShadow(vec3 ro, vec3 rd){
  float res = 1.0; float t = 0.03;
  for (int i = 0; i < 22; i++) { float h = map(ro + rd * t); res = min(res, 3.6 * h / t); t += clamp(h, 0.035, 0.3); if (res < 0.01 || t > 4.5) break; }
  return clamp(res, 0.0, 1.0);
}

// A rectangular softbox: where the ray meets its plane, with edges that soften as the surface gets rougher.
float rectL(vec3 ro, vec3 rd, vec3 c, vec3 n, vec3 u, vec3 v, vec2 hs, float soft){
  float dn = dot(rd, n); if (dn > -1e-4) return 0.0;
  float t = dot(c - ro, n) / dn; if (t < 0.0) return 0.0;
  vec3 q = ro + rd * t - c; float s = soft * t;
  vec2 d = abs(vec2(dot(q, u), dot(q, v))) - hs;
  float cloth = 1.0 - 0.28 * clamp(length(vec2(dot(q, u), dot(q, v)) / hs), 0.0, 1.4);
  return smoothstep(s, -s, d.x) * smoothstep(s, -s, d.y) * cloth;
}
vec3 keyPos(){ return vec3(uKey, 7.3, 9.5); }
vec3 env(vec3 ro, vec3 rd, float rough){
  float soft = 0.035 + rough * 0.75;
  vec3 c = mix(vec3(0.02, 0.021, 0.026), vec3(0.12, 0.125, 0.14), smoothstep(-0.1, 1.0, rd.y));
  // key: a big scrim high behind the set, leaning over it
  vec3 kn = normalize(vec3(0.0, -0.42, -1.0));
  c += vec3(1.0, 0.965, 0.93) * 7.5 * rectL(ro, rd, keyPos(), kn, vec3(1.0, 0.0, 0.0), normalize(cross(kn, vec3(1.0, 0.0, 0.0))), vec2(1.9, 1.35), soft);
  // overhead box that the chamfers pick up
  c += vec3(0.93, 0.96, 1.0) * 3.4 * rectL(ro, rd, vec3(uKey * 0.8 - 0.4, 7.5, -4.6), vec3(0.0, -1.0, 0.0), vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), vec2(2.6, 1.7), soft);
  // cool strip, camera left
  vec3 ln = normalize(vec3(1.0, -0.05, 0.42));
  c += vec3(0.82, 0.9, 1.0) * 6.0 * rectL(ro, rd, vec3(-7.6, 2.5, -3.4), ln, normalize(cross(vec3(0.0, 1.0, 0.0), ln)), vec3(0.0, 1.0, 0.0), vec2(1.5, 2.5), soft);
  // warm strip, camera right
  vec3 rn = normalize(vec3(-1.0, -0.05, 0.3));
  c += vec3(1.0, 0.84, 0.66) * 3.4 * rectL(ro, rd, vec3(7.8, 2.8, -2.2), rn, normalize(cross(vec3(0.0, 1.0, 0.0), rn)), vec3(0.0, 1.0, 0.0), vec2(0.9, 2.8), soft);
  // the cyclorama far behind: it is what the glass shows at the top of the frame
  float cyc = smoothstep(0.03, 0.2, rd.y) * smoothstep(0.52, 0.2, rd.y) * smoothstep(-0.2, 0.75, rd.z) * (0.55 + 0.45 * smoothstep(-0.9, 0.5, rd.x));
  c += vec3(0.62, 0.72, 0.9) * 0.36 * cyc;
  // a fill card behind the camera, so faces turned toward the lens are not left black
  c += vec3(0.9, 0.93, 1.0) * 0.9 * rectL(ro, rd, vec3(2.0, 3.4, -11.0), vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec2(4.5, 2.6), soft + 0.1);
  return c;
}
// Below the horizon the room is the glass table, which mirrors the lights dimly.
vec3 envFloor(vec3 ro, vec3 rd, float rough){
  if (rd.y >= 0.0) return env(ro, rd, rough);
  float t = -ro.y / rd.y; vec3 gp = ro + rd * t; vec3 r = vec3(rd.x, -rd.y, rd.z);
  float f = 0.05 + 0.95 * pow(1.0 - clamp(-rd.y, 0.0, 1.0), 5.0);
  return vec3(0.004, 0.0045, 0.006) + f * env(gp, r, rough + 0.03);
}

// kind 0: polished, traced. kind 1: glossy plastic. kind 2: bead-blasted metal, traced through a wide lobe.
struct Mat { vec3 alb; vec3 f0; float rough; vec3 emi; float kind; float wide; };

vec3 gnTop(vec3 n){ return n; }
Mat getMat(vec3 p, inout vec3 n){
  Mat m; m.alb = vec3(0.0); m.f0 = ALU; m.rough = 0.045; m.emi = vec3(0.0); m.kind = 0.0; m.wide = 0.03;
  vec3 grain = vec3(n2(p.xz * 210.0 + p.y * 83.0), n2(p.zy * 210.0 + p.x * 71.0 + 5.0), n2(p.yx * 210.0 + p.z * 67.0 + 11.0)) - 0.5;
  if (sdKey(p) < sdHouse(p)) {
    vec3 q = keyLocal(p);
    float o = rb2(q.xz, KH, KR) + q.y * TAPER;
    if (o + q.y + 0.06 > -0.007 && q.y > -0.085) {
      // the edge is cut after anodising, so it is bare bright metal with the cutter's fine lines
      n = normalize(n + vec3(0.0, 1.0, 0.0) * (n1((o - q.y) * 260.0) - 0.5) * 0.012);
      return m;
    }
    m.f0 = uDye; m.alb = uDye * 0.05; m.rough = 0.17; m.kind = 2.0; m.wide = 0.05;
    n = normalize(n + grain * 0.05);
    if (q.y > -0.09 && o < -0.05) {
      vec2 uv = vec2(q.x, -q.z) / (2.0 * HH) + 0.5; float e = 1.0 / 1024.0;
      float ink = texture2D(uTex, uv).r;
      float ix = texture2D(uTex, uv + vec2(e, 0.0)).r - texture2D(uTex, uv - vec2(e, 0.0)).r;
      float iy = texture2D(uTex, uv + vec2(0.0, e)).r - texture2D(uTex, uv - vec2(0.0, e)).r;
      n = normalize(n + vec3(ix, 0.0, -iy) * 0.7);
      // the legend is an opal insert: milky when the lamp is out, burning when it is on
      m.alb = mix(m.alb, vec3(0.3, 0.285, 0.26), ink); m.f0 = mix(m.f0, vec3(0.045), ink); m.rough = mix(m.rough, 0.2, ink);
      m.emi = uLamp * ink * (0.012 + 3.4 * uLvl.x);
    }
    return m;
  }
  float o = rb2(p.xz, HH, HR); float w = rb2(p.xz, WH, WR);
  if (w < 0.003 && p.y < RY + 0.004) {
    // the light ring: opal acrylic, with the dark slot the key runs in
    float gap = rb2(p.xz, KH, KR) - (KT - uDrop - RY) * TAPER;
    float g = smoothstep(0.035, 0.065, gap);
    float edge = smoothstep(0.0, -0.035, w);
    m.alb = vec3(0.56, 0.54, 0.5) * g; m.f0 = vec3(0.045); m.rough = 0.1; m.kind = 1.0;
    m.emi = uLamp * g * (0.01 + 2.3 * uLvl.y) * (0.62 + 0.38 * edge);
    return m;
  }
  if (abs(p.y - 0.05) < 0.026 && o < -0.006 && o > -0.03) {
    // the foot line: a strip of the same acrylic let into the base
    m.alb = vec3(0.4, 0.39, 0.36); m.f0 = vec3(0.045); m.rough = 0.2; m.kind = 1.0;
    m.emi = uLamp * (0.006 + 4.4 * uLvl.z);
    return m;
  }
  float sr = length(abs(p.xz) - SCREW);
  if (sr < 0.092 && p.y < HB - 0.008) {
    // black oxide steel
    m.f0 = vec3(0.22, 0.225, 0.24); m.alb = vec3(0.012); m.rough = 0.2; m.kind = 2.0; m.wide = 0.06;
    n = normalize(n + grain * 0.05);
    return m;
  }
  bool outer = o + p.y - HB + 0.07 > -0.007 && p.y > HB - 0.085;
  bool lip = p.y - HB + 0.035 - w > -0.007 && w < 0.045;
  bool foot = o - p.y - 0.012 > -0.005 && p.y < 0.02;
  if (outer || lip || foot) {
    n = normalize(n + vec3(0.0, 1.0, 0.0) * (n1((o - p.y) * 260.0 + w * 120.0) - 0.5) * 0.012);
    return m;
  }
  // bead-blasted and clear anodised
  m.f0 = ALU * 0.9; m.alb = vec3(0.03); m.rough = 0.24; m.kind = 2.0; m.wide = 0.1;
  n = normalize(n + grain * 0.06);
  if (p.y > HB - 0.004) {
    // the top is brushed along x after blasting: the lights smear toward the lens
    float st = n1(p.z * 520.0 + n1(p.x * 3.0) * 2.0) - 0.5; float st2 = n1(p.z * 140.0 + 9.0) - 0.5;
    n = normalize(gnTop(n) + vec3(0.0, 0.0, 1.0) * (st * 0.05 + st2 * 0.03) + grain * 0.02);
    m.rough = 0.11 + 0.05 * (st2 + 0.5); m.kind = 3.0; m.wide = 0.04;
    vec2 uv = vec2(p.x, -p.z) / (2.0 * HH) + 0.5; float e = 1.0 / 1024.0;
    float ink = texture2D(uTex, uv).r;
    float ix = texture2D(uTex, uv + vec2(e, 0.0)).r - texture2D(uTex, uv - vec2(e, 0.0)).r;
    float iy = texture2D(uTex, uv + vec2(0.0, e)).r - texture2D(uTex, uv - vec2(0.0, e)).r;
    n = normalize(n + vec3(ix, 0.0, -iy) * 0.8);
    m.alb = mix(m.alb, vec3(0.012), ink); m.f0 = mix(m.f0, vec3(0.04), ink); m.rough = mix(m.rough, 0.45, ink); m.wide *= 1.0 - ink;
  }
  return m;
}

vec3 envAniso(vec3 p, vec3 rd, vec3 n, vec3 b, float spread, float rough){
  vec3 c = vec3(0.0); float w = 0.0;
  for (int i = -5; i <= 5; i++) { float f = float(i) / 5.0; float g = exp(-2.6 * f * f); c += g * envFloor(p, reflect(rd, normalize(n + b * f * spread)), rough); w += g; }
  return c / w;
}
vec3 diffuseLight(vec3 p, vec3 n, float sh, float ao){
  vec3 lk = normalize(keyPos() - p);
  vec3 c = vec3(1.0, 0.965, 0.93) * 1.5 * max(dot(n, lk), 0.0) * sh;
  c += vec3(0.93, 0.96, 1.0) * 0.5 * max(n.y, 0.0) * ao;
  c += vec3(0.82, 0.9, 1.0) * 0.55 * max(dot(n, normalize(vec3(-7.6, 2.5, -3.4) - p)), 0.0) * ao;
  c += vec3(1.0, 0.84, 0.66) * 0.25 * max(dot(n, normalize(vec3(7.8, 2.8, -2.2) - p)), 0.0) * ao;
  return c + vec3(0.03) * ao;
}
// What the lamp does to things near it: the ring lights the key's flanks and the lip, the foot line lights the glass.
vec3 lampLight(vec3 p, vec3 n){
  float w = rb2(p.xz, WH - 0.1, WR - 0.1);
  vec2 g = vec2(rb2(p.xz + vec2(0.01, 0.0), WH - 0.1, WR - 0.1) - w, rb2(p.xz + vec2(0.0, 0.01), WH - 0.1, WR - 0.1) - w) / 0.01;
  vec3 to = vec3(-g.x * w, RY - p.y, -g.y * w);
  float d = length(to) + 0.02;
  float ring = max(dot(n, to / d), 0.0) * 0.07 / (d * d + 0.03) * step(RY - 0.01, p.y);
  return uLamp * uLvl.y * ring * 1.2;
}
vec3 fres(vec3 f0, float c){ return f0 + (1.0 - f0) * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }
// What a mirror sees: shading without a further bounce.
vec3 shadeLite(vec3 p, vec3 n, vec3 rd){
  Mat m = getMat(p, n);
  vec3 r = reflect(rd, n);
  vec3 s = m.kind == 3.0 ? envAniso(p, rd, n, vec3(0.0, 0.0, 1.0), 0.34, m.rough) : envFloor(p, r, m.rough + 0.04);
  vec3 dl = diffuseLight(p, n, 0.6, 0.8) + lampLight(p, n);
  return m.emi + m.alb * dl + fres(m.f0, dot(-rd, n)) * (s + m.wide * dl);
}
vec3 groundLite(vec3 gp, vec3 rd){
  vec3 r = vec3(rd.x, -rd.y, rd.z);
  float f = 0.05 + 0.95 * pow(1.0 - clamp(-rd.y, 0.0, 1.0), 5.0);
  float occ = smoothstep(0.0, 0.5, map(gp + vec3(0.0, 0.02, 0.0)));
  return vec3(0.004, 0.0045, 0.006) * occ + f * env(gp, r, 0.05) * (0.25 + 0.75 * occ);
}
vec3 trace(vec3 p, vec3 r, float rough){
  float t = marchLite(p, r);
  if (t > 0.0) { vec3 hp = p + r * t; vec3 hn = calcN(hp); return shadeLite(hp, hn, r); }
  if (r.y < 0.0) return groundLite(p + r * (-p.y / r.y), r);
  return env(p, r, rough);
}
vec3 shadeFull(vec3 p, vec3 n, vec3 rd, vec2 rnd){
  vec3 gn = n;
  Mat m = getMat(p, n);
  float ao = calcAO(p, gn);
  vec3 lk = normalize(keyPos() - p);
  float sh = softShadow(p + gn * 0.012, lk);
  vec3 dl = diffuseLight(p, n, sh, ao) + lampLight(p, gn) * (0.4 + 0.6 * ao);
  vec3 col = m.emi + m.alb * dl;
  vec3 F = fres(m.f0, dot(-rd, n));
  vec3 r = reflect(rd, n);
  vec3 tx = normalize(cross(r, vec3(0.31, 0.9, 0.3))); vec3 ty = cross(r, tx);
  vec3 jr = normalize(r + (tx * rnd.x + ty * rnd.y) * m.rough * 0.55);
  if (dot(jr, gn) < 0.02) jr = r;
  vec3 s;
  if (m.kind == 1.0) s = envFloor(p, r, m.rough) * (0.35 + 0.65 * ao);
  else if (m.kind == 3.0) s = mix(envAniso(p, rd, n, vec3(0.0, 0.0, 1.0), 0.34, m.rough), trace(p + gn * 0.006, jr, m.rough), 0.45) * (0.4 + 0.6 * ao);
  else s = trace(p + gn * 0.006, jr, m.rough) * (0.4 + 0.6 * ao);
  return col + F * (s + m.wide * dl);
}
vec3 shadeGround(vec3 gp, vec3 rd, vec2 rnd, float dist){
  float near = step(dot(gp.xz, gp.xz), 60.0);
  vec3 n = normalize(vec3((n2(gp.xz * 0.7) - 0.5) * 0.0012, 1.0, (n2(gp.zx * 0.7 + 5.0) - 0.5) * 0.0012));
  vec3 r = reflect(rd, n);
  r = normalize(r + vec3(rnd.x, 0.0, rnd.y) * 0.016);
  float f = 0.05 + 0.95 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  float occ = 1.0; float sh = 1.0;
  if (near > 0.5) {
    occ = smoothstep(-0.02, 0.6, map(gp + vec3(0.0, 0.03, 0.0)));
    sh = softShadow(gp + vec3(0.0, 0.01, 0.0), normalize(keyPos() - gp));
  }
  vec3 refl;
  float t = near > 0.5 ? marchLite(gp + vec3(0.0, 0.002, 0.0), r) : -1.0;
  if (t > 0.0) { vec3 hp = gp + r * t; vec3 hn = calcN(hp); refl = shadeLite(hp, hn, r); }
  else refl = env(gp, r, 0.2) * (0.3 + 0.7 * occ);
  // the glass: nearly no diffuse, a few specks of dust that catch the key light
  vec3 lk = normalize(keyPos() - gp);
  vec2 cell = floor(gp.xz * 19.0); float hsp = h21(cell);
  vec2 cp = (cell + 0.2 + 0.6 * vec2(h21(cell + 3.1), h21(cell + 7.7))) / 19.0;
  float speck = step(0.992, hsp) * smoothstep(0.004 + 0.009 * h21(cell + 1.3), 0.0, length(gp.xz - cp));
  float pool = smoothstep(8.5, 0.8, length(gp.xz - vec2(0.4, 0.2)));
  vec3 alb = vec3(0.04, 0.042, 0.05) * (0.9 + 0.2 * n2(gp.xz * 3.0)) + speck * 0.25;
  vec3 col = alb * (vec3(1.0, 0.965, 0.93) * 2.2 * max(lk.y, 0.0) * sh * pool * pool + vec3(0.1) * occ) * occ;
  // the foot line spills a little onto the dust around the base
  float o = max(rb2(gp.xz, HH, HR), 0.0);
  col += uLamp * uLvl.z * (alb * 3.0 + 0.01) * 0.9 / (1.0 + o * o * 90.0) * exp(-o * 2.2);
  col += f * refl * (0.95 + 0.1 * n2(gp.xz * 0.8 + 3.0));
  col *= mix(1.0, 0.0, smoothstep(14.0, 46.0, dist));
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
  float t = march(ro, rd);
  float tg = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  vec3 col;
  if (t > 0.0 && t < tg) { vec3 p = ro + rd * t; vec3 n = calcN(p); col = shadeFull(p, n, rd, rnd); }
  else if (tg < 1e8) col = shadeGround(ro + rd * tg, rd, rnd, tg);
  else col = env(ro, rd, 0.0);
  col = min(col, vec3(24.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the negative: bloom off the hot highlights, filmic curve, vignette, grain.
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
  c = max(c + (c - nb * 0.25) * 0.28, 0.0);
  vec3 b = vec3(0.0);
  // the spiral is turned by a different amount at every pixel, so the glow is a haze and never a row of ghosts
  float turn = h21(gl_FragCoord.xy + uGrain * 13.1) * 6.2831853;
  for (int i = 0; i < 28; i++) {
    float a = float(i) * 2.39996 + turn; float r = (float(i) + 0.5) / 28.0;
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.034 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.1, 0.0), vec3(5.0)) * (1.0 - 0.75 * r);
  }
  c += b * 0.0085;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.42 * smoothstep(0.25, 1.15, length(q));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.022 * (1.0 - 0.5 * c.g);
  outC = vec4(c, 1.0);
}
`;

// The engraving, drawn once as a top-down plan of the housing: the legend in the middle, two small marks on the rim.
function engraving() {
  const S = 2048;
  const cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const g = cv.getContext("2d");
  if (!g) return cv;
  const px = S / (2 * HH);
  g.fillStyle = "#000"; g.fillRect(0, 0, S, S);
  g.translate(S / 2, S / 2);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "alphabetic";
  const spaced = (text: string, x: number, y: number, size: number, weight: number, track: number, align: "center" | "left" | "right") => {
    g.font = `${weight} ${size * px}px ${FONT}`;
    const chars = text.split("");
    const widths = chars.map((c) => g.measureText(c).width + track * size * px);
    const total = widths.reduce((a, b) => a + b, 0) - track * size * px;
    let at = align === "center" ? x * px - total / 2 : align === "left" ? x * px : x * px - total;
    g.textAlign = "left";
    chars.forEach((c, i) => { g.fillText(c, at, y * px); at += widths[i]; });
  };
  const size = LEGEND.length > 1 ? 0.5 : 0.56, lead = size * 0.98;
  LEGEND.forEach((line, i) => spaced(line, 0, (i - (LEGEND.length - 1) / 2) * lead + size * 0.36, size, 800, 0.02, "center"));
  spaced(PLATE[0], -1.18, 1.6, 0.092, 700, 0.2, "left");
  spaced(PLATE[1], 1.18, 1.6, 0.092, 700, 0.2, "right");
  return cv;
}

// No WebGL: the same pose built from stacked CSS slices in a tilted plane.
function Still({ on, down }: { on: boolean; down: boolean }) {
  const lamp = on ? 1 : 0;
  const rise = down ? 26 : on ? 44 : 54;
  const slab = (n: number, from: number, step: number, size: number, radius: number, bg: string) =>
    Array.from({ length: n }, (_, i) => (
      <span key={i} className="absolute left-1/2 top-1/2 block" style={{ width: size, height: size, margin: -size / 2, borderRadius: radius, background: bg, transform: `translateZ(${from + i * step}px)` }} />
    ));
  return (
    <div aria-hidden="true" className="absolute left-1/2 top-[34%] h-[420px] w-[520px] -translate-x-1/2 -translate-y-1/2 scale-[0.6] sm:scale-90 lg:left-[66.5%] lg:top-[52%] lg:scale-[1.12]" style={{ perspective: 1700 }}>
      <div className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d", transform: "rotateX(63deg) rotateZ(27deg)" }}>
        <span className="absolute left-1/2 top-1/2 block rounded-[74px] blur-2xl" style={{ width: 440, height: 440, margin: -220, background: `rgba(255,190,120,${0.12 + lamp * 0.3})`, transform: "translateZ(-2px)" }} />
        <span className="absolute left-1/2 top-1/2 block rounded-[66px] blur-md" style={{ width: 372, height: 372, margin: -186, background: "#000", boxShadow: "0 0 60px 24px rgba(0,0,0,0.85)" }} />
        {slab(2, 1, 2, 356, 62, "#1b1c20")}
        {slab(2, 5, 2, 354, 61, on ? "#ffe6c4" : "#3a3835")}
        {slab(11, 9, 3, 356, 62, "linear-gradient(100deg,#2d3036,#8f959d 30%,#55595f 62%,#1c1d21)")}
        <span className="absolute left-1/2 top-1/2 block rounded-[62px]" style={{ width: 356, height: 356, margin: -178, transform: "translateZ(41px)", background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, rgba(0,0,0,0.04) 1px 3px), linear-gradient(135deg,#e3e6ea 0%,#a9aeb5 34%,#7c8188 62%,#c3c8ce 100%)", boxShadow: "inset 0 0 0 5px rgba(255,255,255,0.8), inset 0 0 0 6px rgba(0,0,0,0.25)" }}>
          {[[26, 26], [26, 312], [312, 26], [312, 312]].map(([x, y]) => (
            <span key={`${x}-${y}`} className="absolute block h-[18px] w-[18px] rounded-full" style={{ left: x, top: y, background: "radial-gradient(circle, #050506 0 28%, #3b3d42 30% 62%, #0c0c0e 66%)", boxShadow: "0 1px 0 rgba(255,255,255,0.6)" }} />
          ))}
          <span className="absolute left-1/2 top-1/2 block rounded-[60px]" style={{ width: 290, height: 290, margin: -145, boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.4)" }} />
          <span className="absolute bottom-[14px] left-[58px] text-[9px] font-semibold uppercase tracking-[0.24em] text-black/75">{PLATE[0]}</span>
          <span className="absolute bottom-[14px] right-[58px] text-[9px] font-semibold uppercase tracking-[0.24em] text-black/75">{PLATE[1]}</span>
          <span className="absolute left-1/2 top-1/2 block rounded-[52px]" style={{ width: 262, height: 262, margin: -131, background: on ? "#ffe2bd" : "#6f6b64", boxShadow: `0 0 0 3px rgba(255,255,255,0.8), 0 0 ${lamp * 46}px ${lamp * 12}px rgba(255,176,96,0.8), inset 0 0 0 20px rgba(0,0,0,${on ? 0.05 : 0.5})` }} />
        </span>
        {slab(Math.max(1, Math.round((rise - 2) / 3)), 43, 3, 226, 37, "linear-gradient(100deg,#5a1404,#e8480f 34%,#a92a07 66%,#3a0c02)")}
        <span className="absolute left-1/2 top-1/2 flex flex-col items-center justify-center rounded-[36px]" style={{ width: 224, height: 224, margin: -112, transform: `translateZ(${41 + rise}px)`, background: "radial-gradient(circle at 42% 30%, #ff7a3a 0%, #e4440d 46%, #b82f08 100%)", boxShadow: "inset 0 0 0 4px rgba(255,255,255,0.85), inset 0 0 0 5px rgba(0,0,0,0.2)" }}>
          {LEGEND.map((line) => (
            <span key={line} className="block text-[50px] font-extrabold leading-[0.98] tracking-[0.02em]" style={{ color: on ? "#fff6e6" : "#b9aa97", textShadow: on ? "0 0 18px rgba(255,214,160,0.95), 0 0 4px #fff" : "none" }}>{line}</span>
          ))}
        </span>
      </div>
    </div>
  );
}

export default function RayMarchedAirKey() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const key = useRef<HTMLButtonElement>(null);
  const ring = useRef<SVGGElement>(null);
  const [focused, setFocused] = useState(false);
  const [on, setOn] = useState(START_ON);
  const [down, setDown] = useState(false);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const api = useRef<{ hold: (h: boolean, x?: number, y?: number) => void; set: (v: boolean) => void; touch: () => void } | null>(null);
  const flip = useRef<() => void>(() => {});
  flip.current = () => setOn((v) => !v);

  useEffect(() => { api.current?.set(on); }, [on]);

  useEffect(() => {
    const box = stage.current, cv = canvas.current, btn = key.current, halo = ring.current;
    if (!box || !cv || !btn || !halo) return;
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

    const head = gl2 ? "#version 300 es\n#define ATTR in\n#define texture2D texture\n" : "#define ATTR attribute\n";
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
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uDrop", "uTilt", "uLvl", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uKey", "uLamp", "uDye", "uTex", "uDirect"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, engraving());
    gl.generateMipmap(gl.TEXTURE_2D);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // The accumulation plate: every frame is one more exposure blended onto it.
    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1, perDrop = 0, haloY = -1;

    const s = {
      y: START_ON ? LATCH : 0, vy: 0, held: false, on: START_ON, lv: START_ON ? [1, 1, 1] : [0, 0, 0], fl: [0, 0, 0], onAt: 0, armed: [false, false, false],
      tx: 0, tz: 0, wx: 0, wz: 0, kick: 0, vk: 0, px: 0, py: 0, sx: 0, sy: 0, key: 3.6,
      count: 0, fresh: true, frame: 0, slow: 0, visible: true, raf: 0, last: 0, t0: 0,
      touched: false, demoAt: 0, demoUp: 0, first: true,
    };

    // The camera, shared by the shader and by the hit area that has to sit over the key.
    const view = (sx: number, sy: number, kick: number) => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      const el = 0.42, az = -0.5 + sx * 0.07, dist = 9;
      const tgt = [0, 0.42 - kick, 0];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), 0.42 + dist * Math.sin(el) - sy * 0.25 - kick, tgt[2] - dist * Math.cos(az) * Math.cos(el)];
      const foc = 1.96 * Math.min(1, aspect / 1.04);
      const shift = [wide ? 0.142 * aspect : 0, wide ? 0.02 : 0.15];
      return { wide, cam, tgt, foc, shift };
    };
    const place = () => {
      const v = view(0, 0, 0);
      const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
      const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const norm = (a: number[]) => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
      const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const fw = norm(sub(v.tgt, v.cam)), rt = norm(cross([0, 1, 0], fw)), up = cross(fw, rt);
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const cx of [-1, 1]) for (const cz of [-1, 1]) for (const cy of [HB, KTOP]) {
        const d = sub([cx * KHALF * 0.93, cy, cz * KHALF * 0.93], v.cam), z = dot(d, fw);
        const ux = (dot(d, rt) / z) * v.foc + v.shift[0], uy = (dot(d, up) / z) * v.foc + v.shift[1];
        const X = cssW / 2 + ux * cssH, Y = cssH / 2 - uy * cssH;
        x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
      }
      // the focus ring: the outline of the key's top face, seen through the same lens
      const pts: string[] = [];
      const h = KHALF + 0.09, rr = 0.45;
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a);
        const k = 1 / Math.pow(Math.pow(Math.abs(cx), 2 / rr) + Math.pow(Math.abs(cz), 2 / rr), rr / 2);
        const d = sub([cx * k * h, KTOP, cz * k * h], v.cam), z = dot(d, fw);
        pts.push(`${(cssW / 2 + ((dot(d, rt) / z) * v.foc + v.shift[0]) * cssH).toFixed(1)},${(cssH / 2 - ((dot(d, up) / z) * v.foc + v.shift[1]) * cssH).toFixed(1)}`);
      }
      halo.querySelectorAll("polygon").forEach((p) => p.setAttribute("points", pts.join(" ")));
      perDrop = (up[1] * v.foc * cssH) / dot(sub([0, KTOP, 0], v.cam), fw);
      btn.style.left = `${x0}px`; btn.style.top = `${y0}px`; btn.style.width = `${x1 - x0}px`; btn.style.height = `${y1 - y0}px`;
    };

    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      place();
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      // never more than about a million and a half pixels of ray marching
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

    const draw = (alpha: number, sample: number) => {
      const v = view(s.sx, s.sy, s.kick);
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.02 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform1f(su.uDrop, s.y); gl.uniform2f(su.uTilt, s.tx, s.tz);
      gl.uniform3f(su.uLvl, s.lv[0] * (1 + 0.8 * s.fl[0]), s.lv[1] * (1 + 0.8 * s.fl[1]), s.lv[2] * (1 + 0.8 * s.fl[2]));
      gl.uniform3f(su.uCam, v.cam[0], v.cam[1], v.cam[2]); gl.uniform3f(su.uTgt, v.tgt[0], v.tgt[1], v.tgt[2]);
      gl.uniform1f(su.uFoc, v.foc);
      gl.uniform2f(su.uShift, v.shift[0], v.shift[1]);
      gl.uniform1f(su.uFocus, 8.8);
      gl.uniform1f(su.uKey, s.key);
      gl.uniform3f(su.uLamp, LAMP[0], LAMP[1], LAMP[2]); gl.uniform3f(su.uDye, DYE[0], DYE[1], DYE[2]);
      gl.uniform1i(su.uTex, 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, v.wide ? 0.5 + 0.17 : 0.5, v.wide ? 0.5 : 0.62);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 4200; }

      // the self-running demo: it opens lit, holds, then presses itself until someone touches it
      if (!still && !s.touched) {
        if (!s.held && now > s.demoAt) { s.held = true; s.wx = 0.012; s.wz = -0.01; s.demoUp = now + 190; }
        else if (s.held && now > s.demoUp) { s.held = false; s.wx = 0; s.wz = 0; flip.current(); s.demoAt = now + (s.on ? 2300 : 3400); }
      }

      let moving = false;
      if (reduce) {
        const rest = s.held ? TRAVEL : s.on ? LATCH : 0;
        const lv = s.on ? 1 : 0;
        if (s.y !== rest || s.lv[0] !== lv) { s.y = rest; s.lv = [lv, lv, lv]; s.count = 0; s.fresh = true; }
      } else {
        // a sprung plunger with hard stops: it bottoms out with a knock and comes back up past its rest
        const rest = s.held ? TRAVEL + 0.03 : s.on ? LATCH : 0;
        const stiff = s.held ? 2100 : 640, damp = s.held ? 38 : 15;
        const steps = 4, h = dt / steps;
        for (let i = 0; i < steps; i++) {
          s.vy += (stiff * (rest - s.y) - damp * s.vy) * h; s.y += s.vy * h;
          if (s.y > TRAVEL) { s.y = TRAVEL; if (s.vy > 0.25) s.vk += s.vy * 0.022; s.vy *= -0.16; }
          if (s.y < 0) { s.y = 0; s.vy *= -0.3; }
          s.vk += (-900 * s.kick - 34 * s.vk) * h; s.kick += s.vk * h;
        }
        if (Math.abs(s.vy) > 0.002 || Math.abs(rest - s.y) > 0.0006 && !(s.held && s.y >= TRAVEL) || Math.abs(s.kick) > 0.00005) moving = true;
        else if (!s.held) { s.y = rest; s.vy = 0; }
        // the key rocks toward the finger
        const kt = 1 - Math.exp(-dt * 22);
        if (Math.abs(s.wx - s.tx) + Math.abs(s.wz - s.tz) > 0.0002) { s.tx += (s.wx - s.tx) * kt; s.tz += (s.wz - s.tz) * kt; moving = true; }
        // the lamp: it strikes hard, overshoots and settles; when cut it fades like a filament
        // and it travels: legend first, then the ring, then the line round the foot
        for (let i = 0; i < 3; i++) {
          const lit = s.on && now >= s.onAt + i * 75;
          if (lit && s.armed[i]) { s.armed[i] = false; s.fl[i] = 1; }
          const want = lit ? 1 : 0, dl = want - s.lv[i];
          if (Math.abs(dl) > 0.002) { s.lv[i] += dl * (1 - Math.exp(-dt * (lit ? 20 : 9 - i * 2))); moving = true; } else s.lv[i] = want;
          if (s.fl[i] > 0.004) { s.fl[i] *= Math.exp(-dt * 6); moving = true; } else s.fl[i] = 0;
          if (s.on && !lit) moving = true;
        }
      }
      if (!still) {
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        const t = (now - s.t0) / 1000;
        s.key = 3.6 + Math.sin(t * 0.42 + 0.6) * 1.2 + s.sx * 0.5;
        moving = true;
      }

      const fast = Math.abs(s.vy) > 0.1 || Math.abs(s.vk) > 0.02 || s.fl[0] + s.fl[2] > 0.2;
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(fast ? 0.85 : still ? 0.5 : 0.085, 1 + (s.frame % 64)); s.count = still ? 1 : 6; }
      else if (s.count < 40) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }
      if (s.y !== haloY) { haloY = s.y; halo.style.transform = `translateY(${(s.y * perDrop).toFixed(2)}px)`; }

      // measured, not guessed: if frames run long for a while, give up some resolution
      if (!still && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 45 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 40 || (!still && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    api.current = {
      touch: () => { if (!s.touched) { s.touched = true; if (s.held) { s.held = false; } } },
      hold: (h, x, y) => {
        s.held = h;
        if (h && x !== undefined && y !== undefined) { s.wx = -y * 0.03; s.wz = -x * 0.034; } else { s.wx = 0; s.wz = 0; }
        wake();
      },
      set: (v) => {
        if (v === s.on) return;
        s.on = v;
        if (v) { s.onAt = performance.now(); s.armed = [true, true, true]; }
        wake();
      },
    };

    size();
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

  const hold = (h: boolean, x?: number, y?: number) => { setDown(h); api.current?.touch(); api.current?.hold(h, x, y); };
  const onKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== " " && e.key !== "Enter") return;
    if (e.repeat) { e.preventDefault(); return; }
    hold(true);
  };
  const onKeyUp = (e: ReactKeyboardEvent<HTMLButtonElement>) => { if (e.key === " " || e.key === "Enter") hold(false); };

  const st = on ? states.on : states.off;
  const still = shown === "still";

  return (
    <section className="relative isolate overflow-hidden bg-[#050608] text-white" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes ray-marched-air-key-rise { from { opacity: 0; transform: translateY(0.16em); filter: blur(7px); } to { opacity: 1; transform: none; filter: blur(0); } }
        .ray-marched-air-key-word { animation: ray-marched-air-key-rise 480ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @keyframes ray-marched-air-key-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        .ray-marched-air-key-dot { animation: ray-marched-air-key-pulse 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .ray-marched-air-key-word, .ray-marched-air-key-dot { animation: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[720px] w-full max-w-[1600px] lg:h-[760px]" style={{ background: "radial-gradient(90% 70% at 62% 30%, #15171c 0%, #090a0d 55%, #050608 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />

        {still && <Still on={on} down={down} />}

        <button
          ref={key}
          type="button"
          aria-pressed={on}
          aria-label="On air"
          onClick={() => { api.current?.touch(); setOn((v) => !v); }}
          onPointerDown={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            hold(true, ((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
          }}
          onPointerUp={() => hold(false)}
          onPointerLeave={() => { if (down) hold(false); }}
          onPointerCancel={() => hold(false)}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onFocus={(e) => setFocused(e.currentTarget.matches(":focus-visible"))}
          onBlur={() => { setFocused(false); if (down) hold(false); }}
          className={`absolute cursor-pointer touch-manipulation select-none rounded-[22%] bg-transparent outline-none ${still ? "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-black left-1/2 top-[34%] h-[220px] w-[240px] -translate-x-1/2 -translate-y-1/2 lg:left-[66.5%] lg:top-[50%] lg:h-[300px] lg:w-[330px]" : ""}`}
          style={{ WebkitTapHighlightColor: "transparent" }}
        />

        <svg aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-150 ${focused && !still ? "opacity-100" : "opacity-0"}`}>
          <g ref={ring} fill="none" strokeLinejoin="round">
            <polygon stroke="rgba(0,0,0,0.55)" strokeWidth="7" />
            <polygon stroke="#ffffff" strokeWidth="2.5" />
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end px-6 pb-8 sm:px-10 lg:justify-between lg:px-16 lg:pb-14 lg:pt-14">
          <p className="hidden text-[11px] font-medium uppercase tracking-[0.34em] text-white/55 lg:block">Marlow desk <span className="mx-2 text-white/25">/</span> air key</p>
          <div>
            <p className="mb-3 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-white/55 lg:mb-5">
              <span className={`block h-[7px] w-[7px] rounded-full ${on ? "ray-marched-air-key-dot bg-[#ff5a1f] shadow-[0_0_10px_2px_rgba(255,90,31,0.7)]" : "bg-white/25"}`} />
              <span className={on ? "text-[#ffb37a]" : ""}>Studio 02</span>
              <span className="h-px w-8 bg-white/25" />
              <span>{on ? "Latched" : "Released"}</span>
            </p>
            <p aria-live="polite">
              <span key={st.word} className="ray-marched-air-key-word block whitespace-nowrap text-[76px] font-semibold leading-[0.86] tracking-[-0.06em] text-white sm:text-[100px] lg:text-[156px]">{st.word}</span>
              <span className="mt-4 block w-[25rem] max-w-[82vw] text-[19px] italic leading-snug text-white/70 lg:mt-7 lg:text-[23px]" style={{ fontFamily: SERIF }}>{st.note}</span>
            </p>
            <p className="mt-6 flex items-center gap-3 text-[12px] font-medium tracking-[0.02em] text-white/55 lg:mt-9">
              <span className="hidden rounded-[7px] border border-white/20 bg-white/[0.06] px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-white/80 lg:inline-block">Space</span>
              <span className="hidden lg:inline">or press the key</span>
              <span className="uppercase tracking-[0.3em] text-[11px] lg:hidden">Tap the key</span>
            </p>
          </div>
        </div>
        <p className="pointer-events-none absolute bottom-7 right-6 hidden text-[11px] uppercase tracking-[0.3em] text-white/40 sm:right-10 lg:bottom-14 lg:right-16 lg:block">{TRAVEL * 10} mm travel, latching</p>
      </div>
    </section>
  );
}
