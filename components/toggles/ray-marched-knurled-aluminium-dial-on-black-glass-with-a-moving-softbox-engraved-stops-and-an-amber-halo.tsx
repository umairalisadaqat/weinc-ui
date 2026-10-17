import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// The stops, left to right. `level` is how hard the halo under the dial burns (0 to 1).
const stops = [
  { label: "Off", note: "Lamp dark, halo resting", level: 0 },
  { label: "Night", note: "Five percent, enough to find the stairs", level: 0.1 },
  { label: "Evening", note: "A third of the output, warm and low", level: 0.34 },
  { label: "Reading", note: "Seventy percent over the armchair", level: 0.68 },
  { label: "Full", note: "Everything the lamp has", level: 1 },
];
const SWEEP = 148; // degrees of travel between the first stop and the last
const START = 3; // the stop it opens on
const LAMP: [number, number, number] = [1, 0.5, 0.13]; // halo, pointer paint and lit numeral (linear RGB)
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const rad = (d: number) => (d * Math.PI) / 180;
const stopAngle = (i: number) => rad((stops.length === 1 ? 0 : i / (stops.length - 1) - 0.5) * SWEEP);
const levelAt = (a: number) => {
  const f = Math.max(0, Math.min(stops.length - 1, (a / rad(SWEEP) + 0.5) * (stops.length - 1)));
  const i = Math.min(stops.length - 2, Math.floor(f));
  return stops[i].level + (stops[i + 1].level - stops[i].level) * (f - i);
};

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 tone(vec3 x){ x *= 0.92; vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return pow(clamp(a / b, 0.0, 1.0), vec3(1.0 / 2.2)); }
`;

// The whole photograph: signed-distance geometry, studio softboxes, one traced bounce.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uAng; uniform float uLvl;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform float uKey; uniform float uFlash; uniform vec3 uLamp; uniform sampler2D uTex; uniform float uDirect;
const float HB = 0.14; const float RB = 1.78; const float KB = 0.165; const float KH = 0.95;
const float PI = 3.14159265;
const vec3 ALU = vec3(0.913, 0.921, 0.925);
${TONE}
float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n1(float x){ float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h11(i), h11(i + 1.0), f); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }

// Pointer frame of the knob: x runs across the pointer slot, y runs along it.
vec2 knobFrame(vec2 xz){ float s = sin(uAng); float c = cos(uAng); return vec2(xz.x * c + xz.y * s, xz.x * s - xz.y * c); }

float sdBase(vec3 p){
  float r = length(p.xz);
  float d = max(r - RB, p.y - HB);
  d = max(d, (r - RB + p.y - HB + 0.075) * 0.7071);
  return d;
}
float knurl(vec3 p, float y){
  vec2 k = knobFrame(p.xz);
  float u = atan(k.x, k.y) * (54.0 / (2.0 * PI));
  float v = y * (54.0 / (2.0 * PI)) * 0.62;
  return min(1.0, (1.0 - 2.0 * max(abs(fract(u + v) - 0.5), abs(fract(u - v) - 0.5))) * 1.45);
}
float slotCut(vec3 p){
  vec2 k = knobFrame(p.xz);
  float ax = abs(k.x) - 0.04;
  float top = max(max(ax, 0.36 - k.y), KB + KH - 0.05 - p.y);
  float side = max(max(ax, 0.957 - k.y), KB + 0.80 - p.y);
  return min(top, side);
}
float sdKnob(vec3 p){
  float r = length(p.xz); float y = p.y - KB;
  float R = 1.0 - max(0.0, 0.034 - abs(y - 0.165)) - max(0.0, 0.034 - abs(y - 0.755)) - 0.014 * step(0.755, y);
  float band = smoothstep(0.20, 0.235, y) * smoothstep(0.72, 0.685, y);
  if (band > 0.0 && r > 0.93 && r < 1.06) R -= 0.026 * band * (1.0 - knurl(p, y));
  float d = max(r - R, max(y - KH, -y));
  d = max(d, (r + y - (0.986 + KH - 0.085)) * 0.7071);
  d = max(d, (r - y - 0.975) * 0.7071);
  d = max(d, 9.2 - length(p - vec3(0.0, KB + KH + 9.2 - 0.034, 0.0)));
  d = max(d, -slotCut(p));
  return d;
}
float map(vec3 p){ return min(sdBase(p), sdKnob(p)); }

vec2 bound(vec3 ro, vec3 rd){
  float a = dot(rd.xz, rd.xz); float b = dot(ro.xz, rd.xz); float c = dot(ro.xz, ro.xz) - 3.24;
  float h = b * b - a * c; if (h < 0.0 || a < 1e-6) return vec2(1.0, -1.0);
  h = sqrt(h); float t0 = (-b - h) / a; float t1 = (-b + h) / a;
  if (abs(rd.y) > 1e-5) { float ya = (0.0 - ro.y) / rd.y; float yb = (1.13 - ro.y) / rd.y; t0 = max(t0, min(ya, yb)); t1 = min(t1, max(ya, yb)); }
  else if (ro.y < 0.0 || ro.y > 1.13) return vec2(1.0, -1.0);
  return vec2(max(t0, 0.0), t1);
}
float march(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 80; i++) { float d = map(ro + rd * t); if (d < 0.0006 * (1.0 + t * 0.3)) return t; t += d * 0.72; if (t > tb.y) break; }
  return -1.0;
}
float marchLite(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x + 0.004;
  for (int i = 0; i < 44; i++) { float d = map(ro + rd * t); if (d < 0.0016) return t; t += d * 0.8; if (t > tb.y) break; }
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
  // a faint cloth falloff toward the edges of the scrim
  float cloth = 1.0 - 0.28 * clamp(length(vec2(dot(q, u), dot(q, v)) / hs), 0.0, 1.4);
  return smoothstep(s, -s, d.x) * smoothstep(s, -s, d.y) * cloth;
}
vec3 keyPos(){ return vec3(uKey, 7.3, 9.5); }
vec3 env(vec3 ro, vec3 rd, float rough){
  float soft = 0.035 + rough * 0.75;
  vec3 c = mix(vec3(0.02, 0.021, 0.026), vec3(0.12, 0.125, 0.14), smoothstep(-0.1, 1.0, rd.y));
  // key: a big scrim high behind the dial, leaning over it
  vec3 kn = normalize(vec3(0.0, -0.42, -1.0));
  c += vec3(1.0, 0.965, 0.93) * 7.5 * rectL(ro, rd, keyPos(), kn, vec3(1.0, 0.0, 0.0), normalize(cross(kn, vec3(1.0, 0.0, 0.0))), vec2(1.9, 1.35), soft);
  // overhead box that the bevels pick up
  c += vec3(0.93, 0.96, 1.0) * 3.4 * rectL(ro, rd, vec3(uKey * 0.8 - 0.4, 7.5, -4.6), vec3(0.0, -1.0, 0.0), vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), vec2(2.6, 1.7), soft);
  // cool strip, camera left
  vec3 ln = normalize(vec3(1.0, -0.05, 0.42));
  c += vec3(0.82, 0.9, 1.0) * 6.0 * rectL(ro, rd, vec3(-7.6, 2.5, -3.4), ln, normalize(cross(vec3(0.0, 1.0, 0.0), ln)), vec3(0.0, 1.0, 0.0), vec2(1.5, 2.5), soft);
  // warm strip, camera right
  vec3 rn = normalize(vec3(-1.0, -0.05, 0.3));
  c += vec3(1.0, 0.84, 0.66) * 3.4 * rectL(ro, rd, vec3(7.8, 2.8, -2.2), rn, normalize(cross(vec3(0.0, 1.0, 0.0), rn)), vec3(0.0, 1.0, 0.0), vec2(0.9, 2.8), soft);
  // the cyclorama far behind, lit from the floor: it is what the glass shows at the top of the frame
  float cyc = smoothstep(0.03, 0.2, rd.y) * smoothstep(0.52, 0.2, rd.y) * smoothstep(-0.2, 0.75, rd.z) * (0.55 + 0.45 * smoothstep(-0.9, 0.5, rd.x));
  c += vec3(0.62, 0.72, 0.9) * 0.36 * cyc;
  return c;
}
// Below the horizon the room is the glass table, which mirrors the lights dimly.
vec3 envFloor(vec3 ro, vec3 rd, float rough){
  if (rd.y >= 0.0) return env(ro, rd, rough);
  float t = -ro.y / rd.y; vec3 gp = ro + rd * t; vec3 r = vec3(rd.x, -rd.y, rd.z);
  float f = 0.05 + 0.95 * pow(1.0 - clamp(-rd.y, 0.0, 1.0), 5.0);
  return vec3(0.004, 0.0045, 0.006) + f * env(gp, r, rough + 0.03);
}

struct Mat { vec3 alb; vec3 f0; float rough; vec3 emi; float kind; vec3 bit; float spread; float occ; float wide; };

Mat getMat(vec3 p, inout vec3 n){
  Mat m; m.alb = vec3(0.0); m.f0 = ALU; m.rough = 0.08; m.emi = vec3(0.0); m.kind = 0.0; m.bit = vec3(0.0, 1.0, 0.0); m.spread = 0.0; m.occ = 1.0; m.wide = 0.03;
  float r = length(p.xz); vec3 rdir = vec3(p.x, 0.0, p.z) / max(r, 1e-4);
  if (sdBase(p) < sdKnob(p)) {
    float ch = r - RB + p.y - HB + 0.075;
    if (p.y > HB - 0.002 && ch < -0.003) {
      // top of the plate: satin black anodising, paint-filled engraving, the halo ring
      vec2 uv = vec2(p.x, -p.z) / (2.0 * RB) + 0.5;
      float e = 1.0 / 1024.0;
      float ink = texture2D(uTex, uv).r;
      float ix = texture2D(uTex, uv + vec2(e, 0.0)).r - texture2D(uTex, uv - vec2(e, 0.0)).r;
      float iy = texture2D(uTex, uv + vec2(0.0, e)).r - texture2D(uTex, uv - vec2(0.0, e)).r;
      n = normalize(n + vec3(ix, 0.0, -iy) * 0.9);
      float grainv = n2(p.xz * 260.0);
      m.alb = vec3(0.011, 0.012, 0.015); m.f0 = vec3(0.05); m.rough = 0.3 + 0.08 * grainv; m.kind = 6.0; m.bit = rdir; m.spread = 0.3;
      n = normalize(n + rdir * (n1(r * 240.0) - 0.5) * 0.05);
      n = normalize(n + vec3(grainv - 0.5, 0.0, n2(p.zx * 260.0 + 9.0) - 0.5) * 0.05);
      float phi = atan(p.x, -p.z);
      float sel = smoothstep(0.2, 0.07, abs(phi - uAng)) * step(1.17, r);
      vec3 paint = mix(vec3(0.74, 0.75, 0.74), uLamp * 0.9, sel);
      m.alb = mix(m.alb, paint, ink * 0.94);
      m.rough = mix(m.rough, 0.55, ink);
      m.emi = uLamp * ink * sel * (0.55 + 1.3 * uLvl + 3.0 * uFlash);
      float ring = smoothstep(1.035, 1.05, r) * smoothstep(1.125, 1.11, r);
      float spill = exp(-max(r - 1.11, 0.0) * 5.0) * step(1.11, r);
      m.alb = mix(m.alb, vec3(0.3, 0.25, 0.2), ring);
      m.rough = mix(m.rough, 0.3, ring);
      m.emi += uLamp * ring * (0.03 + 5.5 * uLvl) * (1.0 + 0.5 * uFlash) + uLamp * spill * uLvl * 0.26 * (0.75 + 0.5 * grainv);
    } else if (ch > -0.004 && p.y > HB - 0.074) {
      // diamond-cut chamfer: bare bright aluminium with the cutter's fine rings
      m.rough = 0.045; m.kind = 2.0; m.bit = normalize(rdir - vec3(0.0, 1.0, 0.0)); m.spread = 0.035;
      n = normalize(n + m.bit * (n1(ch * 900.0 + r * 300.0) - 0.5) * 0.03);
    } else {
      m.alb = vec3(0.011, 0.012, 0.015); m.f0 = vec3(0.045); m.rough = 0.36; m.kind = 1.0;
    }
    return m;
  }
  float y = p.y - KB;
  if (slotCut(p) < 0.004) {
    // enamel paint flooded into the pointer slot
    m.alb = uLamp * vec3(0.95, 0.8, 0.7); m.f0 = vec3(0.045); m.rough = 0.22; m.kind = 1.0; m.emi = uLamp * (0.05 + 0.5 * uLvl);
    return m;
  }
  if (n.y > 0.94 && r < 0.9) {
    // faced on the lathe: thousands of circular scratches, so the highlight opens into two fans
    float g = n1(r * 310.0) - 0.5; float g2 = n1(r * 71.0 + 4.0) - 0.5;
    n = normalize(n + rdir * (g * 0.05 + g2 * 0.035));
    n = normalize(n - rdir * smoothstep(0.045, 0.0, r) * 0.6);
    m.rough = 0.05 + 0.03 * n1(r * 37.0); m.kind = 3.0; m.bit = rdir; m.spread = 0.42;
    m.occ = 0.86 + 0.14 * n1(r * 160.0 + 2.0); m.wide = 0.05;
    return m;
  }
  if (abs(n.y) < 0.3) {
    float band = smoothstep(0.20, 0.235, y) * smoothstep(0.72, 0.685, y);
    if (band > 0.5) {
      // the knurl: cut pyramids, bright on the faces and dull in the valleys
      float k = knurl(p, y);
      m.rough = 0.16; m.kind = 4.0; m.occ = mix(0.35, 1.0, smoothstep(0.0, 0.55, k)); m.wide = 0.3;
      return m;
    }
    // turned skirt and cap: horizontal tool marks smear the lights vertically
    n = normalize(n + vec3(0.0, 1.0, 0.0) * ((n1(y * 420.0) - 0.5) * 0.07 + (n1(y * 90.0 + 3.0) - 0.5) * 0.04));
    m.rough = 0.06; m.kind = 5.0; m.bit = vec3(0.0, 1.0, 0.0); m.spread = 0.3; m.wide = 0.2;
    return m;
  }
  // polished bevels and groove walls
  m.rough = 0.04; m.kind = 2.0; m.bit = normalize(cross(cross(n, vec3(0.0, 1.0, 0.0)), n) + vec3(0.0, 1e-4, 0.0)); m.spread = 0.03;
  n = normalize(n + m.bit * (n1(y * 800.0 + r * 500.0) - 0.5) * 0.02);
  return m;
}

vec3 diffuseLight(vec3 p, vec3 n, float sh, float ao){
  vec3 lk = normalize(keyPos() - p);
  vec3 c = vec3(1.0, 0.965, 0.93) * 1.5 * max(dot(n, lk), 0.0) * sh;
  c += vec3(0.93, 0.96, 1.0) * 0.5 * max(n.y, 0.0) * ao;
  c += vec3(0.82, 0.9, 1.0) * 0.55 * max(dot(n, normalize(vec3(-7.6, 2.5, -3.4) - p)), 0.0) * ao;
  c += vec3(1.0, 0.84, 0.66) * 0.25 * max(dot(n, normalize(vec3(7.8, 2.8, -2.2) - p)), 0.0) * ao;
  return c + vec3(0.03) * ao;
}
vec3 fres(vec3 f0, float c){ return f0 + (1.0 - f0) * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }
vec3 envAniso(vec3 p, vec3 rd, vec3 n, vec3 b, float spread, float rough){
  vec3 c = vec3(0.0); float w = 0.0;
  for (int i = -6; i <= 6; i++) { float f = float(i) / 6.0; float g = exp(-2.6 * f * f); c += g * envFloor(p, reflect(rd, normalize(n + b * f * spread)), rough); w += g; }
  return c / w;
}
// What a mirror sees: shading without a further bounce.
vec3 shadeLite(vec3 p, vec3 n, vec3 rd){
  Mat m = getMat(p, n);
  vec3 r = reflect(rd, n);
  vec3 s = m.spread > 0.1 ? envAniso(p, rd, n, m.bit, m.spread, m.rough) : envFloor(p, r, m.rough + 0.04);
  vec3 dl = diffuseLight(p, n, 0.6, 0.8);
  return m.emi + m.alb * dl + fres(m.f0, dot(-rd, n)) * (s + m.wide * dl) * m.occ;
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
  vec3 dl = diffuseLight(p, n, sh, ao);
  vec3 col = m.emi + m.alb * dl;
  vec3 F = fres(m.f0, dot(-rd, n));
  vec3 r = reflect(rd, n);
  vec3 jr = normalize(r + (vec3(rnd.x, rnd.y, rnd.x * rnd.y * 2.0) ) * m.rough * 0.5);
  vec3 s;
  if (m.kind == 3.0) s = envAniso(p, rd, n, m.bit, m.spread, m.rough);
  else if (m.kind == 5.0) s = mix(envAniso(p, rd, n, m.bit, m.spread, m.rough), trace(p + gn * 0.006, jr, m.rough), 0.5);
  else if (m.kind == 6.0) s = envAniso(p, rd, n, m.bit, m.spread, m.rough) * (0.3 + 0.7 * ao);
  else if (m.kind == 1.0) s = envFloor(p, r, m.rough) * (0.35 + 0.65 * ao);
  else s = trace(p + gn * 0.006, jr, m.rough);
  float so = m.kind == 3.0 ? 1.0 : (0.45 + 0.55 * ao);
  return col + F * (s * so + m.wide * dl) * m.occ;
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
  // the glass: nearly no diffuse, a few specks of dust that catch the key
  vec3 lk = normalize(keyPos() - gp);
  vec2 cell = floor(gp.xz * 19.0); float hsp = h21(cell);
  vec2 cp = (cell + 0.2 + 0.6 * vec2(h21(cell + 3.1), h21(cell + 7.7))) / 19.0;
  float speck = step(0.992, hsp) * smoothstep(0.004 + 0.009 * h21(cell + 1.3), 0.0, length(gp.xz - cp));
  float pool = smoothstep(8.5, 0.8, length(gp.xz - vec2(0.4, 0.2)));
  vec3 alb = vec3(0.04, 0.042, 0.05) * (0.9 + 0.2 * n2(gp.xz * 3.0)) + speck * 0.25;
  vec3 col = alb * (vec3(1.0, 0.965, 0.93) * 2.2 * max(lk.y, 0.0) * sh * pool * pool + vec3(0.1) * occ) * occ;
  col += f * refl * (0.95 + 0.1 * n2(gp.xz * 0.8 + 3.0));
  // room falls away into the dark behind
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
  // a light unsharp mask, the way a print is finished
  vec2 px = 1.0 / uRes;
  vec3 nb = texture2D(uAcc, uv + vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv - vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv + vec2(0.0, px.y)).rgb + texture2D(uAcc, uv - vec2(0.0, px.y)).rgb;
  c = max(c + (c - nb * 0.25) * 0.55, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 20.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.024 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.1, 0.0), vec3(6.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.009;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.42 * smoothstep(0.25, 1.15, length(q));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.022 * (1.0 - 0.5 * c.g);
  outC = vec4(c, 1.0);
}
`;

// The engraving, drawn once as a top-down plan of the plate: ticks, numerals and two small legends.
function engraving() {
  const S = 2048, RBASE = 1.78;
  const cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const g = cv.getContext("2d");
  if (!g) return cv;
  const px = S / (2 * RBASE);
  g.fillStyle = "#000"; g.fillRect(0, 0, S, S);
  g.translate(S / 2, S / 2);
  g.fillStyle = "#fff"; g.strokeStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
  const n = stops.length, minor = 5;
  for (let i = 0; i <= (n - 1) * minor; i++) {
    const major = i % minor === 0;
    const a = rad((i / ((n - 1) * minor) - 0.5) * SWEEP);
    g.save(); g.rotate(-a);
    g.fillRect((-(major ? 0.03 : 0.012) * px) / 2, 1.2 * px, (major ? 0.03 : 0.012) * px, (major ? 0.15 : 0.075) * px);
    if (major) {
      g.font = `600 ${0.2 * px}px ${FONT}`;
      g.fillText(String(i / minor), 0, 1.52 * px);
    }
    g.restore();
  }
  const arc = (text: string, at: number, r: number, size: number, gap: number) => {
    g.font = `600 ${size * px}px ${FONT}`;
    const chars = text.split("");
    chars.forEach((c, k) => { g.save(); g.rotate(-(at + (k - (chars.length - 1) / 2) * gap)); g.fillText(c, 0, r * px); g.restore(); });
  };
  arc("OUTPUT", rad(-SWEEP / 2 - 30), 1.36, 0.085, 0.058);
  arc("FIVE STOP", rad(SWEEP / 2 + 34), 1.36, 0.085, 0.058);
  return cv;
}

// No WebGL: the same pose as a still. Every round part is a circle inside a plane squashed to the camera's tilt.
const TILT = 0.42;
function Still({ mode }: { mode: number }) {
  const glow = stops[mode].level;
  const deg = (i: number, n: number) => (i / n - 0.5) * SWEEP;
  const plane = (d: number, top: number) => ({ width: d, height: d, left: 260 - d / 2, top: top - d / 2, transform: `scaleY(${TILT})` });
  const metal = "linear-gradient(90deg,#0d0e11 0%,#565c66 7%,#c9d0d9 15%,#f3f5f7 19%,#7f8691 27%,#2b2e34 41%,#3a3e45 55%,#8e8a84 70%,#e7d9c6 79%,#6d665e 87%,#16171a 100%)";
  return (
    <div aria-hidden="true" className="absolute left-1/2 top-[33%] h-[420px] w-[520px] -translate-x-1/2 -translate-y-1/2 scale-[0.66] sm:scale-90 lg:left-[66.5%] lg:top-[51%] lg:scale-[1.22]">
      <div className="absolute rounded-full blur-2xl" style={{ ...plane(620, 318), background: "radial-gradient(closest-side, rgba(190,200,220,0.2), transparent)" }} />
      <div className="absolute rounded-full" style={{ ...plane(500, 282), background: "#020203", boxShadow: "0 40px 70px rgba(0,0,0,0.9)" }} />
      <div className="absolute rounded-full" style={{ ...plane(500, 270), background: "radial-gradient(circle at 50% 30%, #2c2e34 0%, #17181c 55%, #0e0f12 100%)", boxShadow: "inset 0 0 0 7px #7d848e, inset 0 6px 0 7px rgba(255,255,255,0.75), inset 0 0 0 9px rgba(0,0,0,0.5)" }}>
        {Array.from({ length: (stops.length - 1) * 5 + 1 }, (_, i) => (
          <span key={i} className="absolute left-1/2 top-1/2 block" style={{ width: i % 5 ? 2 : 4, marginLeft: i % 5 ? -1 : -2, height: i % 5 ? 10 : 21, background: i === mode * 5 ? "#ffa13d" : "#d7d8d6", transform: `rotate(${-deg(i, (stops.length - 1) * 5)}deg) translateY(169px)` }} />
        ))}
        {stops.map((_, i) => (
          <span key={i} className="absolute left-1/2 top-1/2 -ml-5 -mt-5 flex h-10 w-10 items-center justify-center text-[28px] font-semibold" style={{ color: i === mode ? "#ffa13d" : "#d7d8d6", textShadow: i === mode ? "0 0 14px rgba(255,150,46,0.9)" : "none", transform: `rotate(${-deg(i, stops.length - 1)}deg) translateY(213px)` }}>{i}</span>
        ))}
        <span className="absolute left-1/2 top-1/2 block rounded-full" style={{ width: 318, height: 318, margin: -159, border: "11px solid", borderColor: `rgb(${Math.round(90 + glow * 165)},${Math.round(72 + glow * 118)},${Math.round(58 + glow * 50)})`, boxShadow: `0 0 ${glow * 38}px ${glow * 12}px rgba(255,150,46,${glow * 0.75}), inset 0 0 ${glow * 20}px rgba(255,170,80,${glow})` }} />
      </div>
      <div className="absolute left-[120px] top-[149px] h-[180px] w-[280px] overflow-hidden" style={{ borderRadius: "0 0 140px 140px / 0 0 59px 59px", background: metal }}>
        <div className="absolute inset-x-0 top-[38px] h-[104px]" style={{ borderRadius: "0 0 140px 140px / 0 0 59px 59px", background: "repeating-linear-gradient(58deg, rgba(0,0,0,0.62) 0 2.5px, rgba(255,255,255,0.1) 2.5px 4px, transparent 4px 9px), repeating-linear-gradient(-58deg, rgba(0,0,0,0.62) 0 2.5px, rgba(255,255,255,0.16) 2.5px 4px, transparent 4px 9px)" }} />
        <div className="absolute inset-x-0 bottom-0 h-[30px]" style={{ background: `linear-gradient(180deg, transparent, rgba(255,150,46,${glow * 0.55}))` }} />
      </div>
      <div className="absolute rounded-full" style={{ ...plane(280, 149), background: "#aeb5be", boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.7)" }} />
      <div className="absolute rounded-full" style={{ ...plane(250, 147), background: "conic-gradient(from 8deg, #f6f7f8 0deg, #c5cad1 16deg, #7d838c 40deg, #6b7079 90deg, #868c95 140deg, #d8dce1 168deg, #f2f3f5 184deg, #b9bec6 204deg, #747a83 235deg, #676c75 280deg, #8f959e 325deg, #f6f7f8 360deg)" }}>
        <span className="absolute left-1/2 top-1/2 block rounded-sm" style={{ width: 10, marginLeft: -5, height: 82, marginTop: 44, background: "#f39a2c", boxShadow: "inset 1px 0 0 rgba(0,0,0,0.4)", transformOrigin: "50% -44px", transform: `rotate(${-deg(mode, stops.length - 1)}deg)` }} />
      </div>
    </div>
  );
}

export default function RayMarchedKnurledDial() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const [mode, setMode] = useState(START);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const modeRef = useRef(START);
  const api = useRef<{ go: (i: number, fromUser: boolean) => void } | null>(null);

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
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uAng", "uLvl", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uKey", "uFlash", "uLamp", "uTex", "uDirect"].map((n) => [n, U(scene, n)]));
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
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      // never more than about a million pixels of ray marching
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

    const a0 = stopAngle(START);
    const s = {
      a: a0, v: 0, target: a0, raw: a0, drag: false, lvl: stops[START].level,
      flash: 0, armed: false, px: 0, py: 0, sx: 0, sy: 0, key: 1.2, count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, demoDir: -1, first: true,
    };
    const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

    const draw = (alpha: number, sample: number) => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      const el = 0.42, az = -0.2 + s.sx * 0.07, dist = 9;
      const tgt = [0, 0.5, 0];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el) - s.sy * 0.25, tgt[2] - dist * Math.cos(az) * Math.cos(el)];
      const foc = 2.12 * Math.min(1, aspect / 0.93);
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.028 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform1f(su.uAng, s.a); gl.uniform1f(su.uLvl, s.lvl);
      gl.uniform3f(su.uCam, cam[0], cam[1], cam[2]); gl.uniform3f(su.uTgt, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFoc, foc);
      gl.uniform2f(su.uShift, wide ? 0.165 * aspect : 0, wide ? 0.012 : 0.135);
      gl.uniform1f(su.uFocus, 8.05);
      gl.uniform1f(su.uKey, s.key); gl.uniform1f(su.uFlash, s.flash);
      gl.uniform3f(su.uLamp, LAMP[0], LAMP[1], LAMP[2]);
      gl.uniform1i(su.uTex, 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, wide ? 0.5 + 0.17 : 0.5, wide ? 0.5 : 0.62);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const go = (i: number, fromUser: boolean) => {
      const k = Math.max(0, Math.min(stops.length - 1, i));
      if (fromUser) s.touched = true;
      if (Math.abs(stopAngle(k) - s.a) > 0.05) s.armed = true;
      s.target = stopAngle(k);
      if (k !== modeRef.current) { modeRef.current = k; setMode(k); }
      if (reduce) { s.a = s.target; s.v = 0; s.lvl = stops[k].level; s.count = 0; }
      wake();
    };
    api.current = { go };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 3600; }

      // the self-running demo: it opens finished, holds, then walks the stops until someone touches it
      if (!still && !s.touched && !s.drag && now > s.demoAt) {
        let k = modeRef.current + s.demoDir;
        if (k < 0 || k >= stops.length) { s.demoDir *= -1; k = modeRef.current + s.demoDir; }
        go(k, false);
        s.demoAt = now + (k === 0 || k === stops.length - 1 ? 2500 : 1700);
      }

      let moving = false;
      if (!reduce) {
        // heavy brass-on-steel feel: a stiff spring that overshoots the stop once and settles
        const want = s.drag ? s.raw - Math.sin(((s.raw - stopAngle(0)) / (rad(SWEEP) / (stops.length - 1))) * Math.PI * 2) * (rad(SWEEP) / (stops.length - 1) / (Math.PI * 2)) * 0.8 : s.target;
        const stiff = s.drag ? 900 : 300, damp = s.drag ? 46 : 15.5;
        const steps = 3;
        for (let i = 0; i < steps; i++) { s.v += (stiff * (want - s.a) - damp * s.v) * (dt / steps); s.a += s.v * (dt / steps); }
        if (Math.abs(s.v) > 0.002 || Math.abs(want - s.a) > 0.0004) moving = true; else { s.a = want; s.v = 0; }
        // the click: as the pointer first crosses its stop the numeral and the ring kick, then settle
        if (!s.drag && s.armed && Math.abs(s.target - s.a) < 0.02) { s.armed = false; s.flash = 1; }
        if (s.flash > 0.004) { s.flash *= Math.exp(-dt * 6.5); moving = true; } else s.flash = 0;
        const lt = levelAt(s.a), dl = lt - s.lvl;
        // the lamp warms up a touch behind the hand
        if (Math.abs(dl) > 0.0015) { s.lvl += dl * (1 - Math.exp(-dt * 7)); moving = true; } else s.lvl = lt;
      }
      if (!still) {
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        const t = (now - s.t0) / 1000;
        s.key = 1.2 + Math.sin(t * 0.42 + 0.6) * 2.1 + s.sx * 2.2;
        moving = true;
      }

      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(Math.abs(s.v) > 0.25 ? 0.5 : still ? 0.5 : 0.085, 1 + (s.frame % 64)); s.count = still ? 1 : 6; }
      else if (s.count < 40) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      // measured, not guessed: if frames run long for a while, give up some resolution
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

    let downX = 0, moved = 0, id = -1;
    const down = (e: PointerEvent) => {
      id = e.pointerId; downX = e.clientX; moved = 0; s.drag = true; s.touched = true; s.raw = s.a;
      try { pad.setPointerCapture(id); } catch { /* the pointer is already gone */ }
      wake();
    };
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (s.drag && e.pointerId === id) {
        const dx = e.clientX - downX; downX = e.clientX; moved += Math.abs(dx);
        let raw = s.raw + dx * 0.0105;
        const lo = stopAngle(0), hi = stopAngle(stops.length - 1);
        // past the end stop it leans against the spring and gives very little
        if (raw < lo) raw = lo - (1 - Math.exp((raw - lo) * 2)) * 0.09;
        if (raw > hi) raw = hi + (1 - Math.exp((hi - raw) * 2)) * 0.09;
        s.raw = raw;
        const k = Math.round(((Math.max(lo, Math.min(hi, raw)) - lo) / (hi - lo)) * (stops.length - 1));
        if (k !== modeRef.current) { modeRef.current = k; setMode(k); }
      }
      if (!still || s.drag) wake();
    };
    const upFn = (e: PointerEvent) => {
      if (!s.drag || e.pointerId !== id) return;
      s.drag = false;
      if (moved < 5) {
        let k = modeRef.current + s.demoDir;
        if (k < 0 || k >= stops.length) { s.demoDir *= -1; k = modeRef.current + s.demoDir; }
        go(k, true);
      } else go(modeRef.current, true);
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

  const pick = (i: number) => {
    const k = Math.max(0, Math.min(stops.length - 1, i));
    if (api.current) api.current.go(k, true); else { modeRef.current = k; setMode(k); }
  };
  const onKey = (e: ReactKeyboardEvent<HTMLButtonElement>, i: number) => {
    let k = i;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") k = i + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") k = i - 1;
    else if (e.key === "Home") k = 0;
    else if (e.key === "End") k = stops.length - 1;
    else return;
    e.preventDefault();
    k = Math.max(0, Math.min(stops.length - 1, k));
    pick(k);
    radios.current[k]?.focus();
  };

  const still = shown === "still";

  return (
    <section className="relative isolate overflow-hidden bg-[#050608] text-white" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes ray-marched-knurled-dial-rise { from { opacity: 0; transform: translateY(0.18em); filter: blur(6px); } to { opacity: 1; transform: none; filter: blur(0); } }
        .ray-marched-knurled-dial-word { animation: ray-marched-knurled-dial-rise 520ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .ray-marched-knurled-dial-word { animation: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[720px] w-full max-w-[1600px] lg:h-[760px]" style={{ background: "radial-gradient(90% 70% at 62% 30%, #15171c 0%, #090a0d 55%, #050608 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />

        {still && <Still mode={mode} />}

        <div ref={hit} className="absolute inset-x-0 top-0 h-[62%] cursor-grab select-none active:cursor-grabbing lg:inset-y-0 lg:left-[36%] lg:h-full" style={{ touchAction: "pan-y" }} />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end px-6 pb-7 sm:px-10 lg:justify-between lg:px-16 lg:pb-14 lg:pt-14">
          <p className="hidden text-[11px] font-medium uppercase tracking-[0.34em] text-white/55 lg:block">Hallam lamp <span className="mx-2 text-white/25">/</span> output selector</p>
          <div>
            <p className="mb-3 flex items-baseline gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-white/55 lg:mb-5">
              <span className="tabular-nums text-[#ffa24a]">{String(mode).padStart(2, "0")}</span>
              <span className="h-px w-8 bg-white/25" />
              <span className="tabular-nums">{String(stops.length - 1).padStart(2, "0")}</span>
            </p>
            <p aria-live="polite" className="max-w-[9ch]">
              <span key={mode} className="ray-marched-knurled-dial-word block text-[72px] font-semibold leading-[0.86] tracking-[-0.055em] text-white sm:text-[96px] lg:text-[136px]">{stops[mode].label}</span>
              <span className="mt-4 block w-[24rem] max-w-[80vw] text-[19px] italic leading-snug text-white/70 lg:mt-7 lg:text-[23px]" style={{ fontFamily: SERIF }}>{stops[mode].note}</span>
            </p>
            <div role="radiogroup" aria-label="Lamp output" className="pointer-events-auto mt-6 flex w-fit gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-sm lg:mt-9">
              {stops.map((st, i) => (
                <button
                  key={st.label}
                  ref={(el) => { radios.current[i] = el; }}
                  type="button"
                  role="radio"
                  aria-checked={i === mode}
                  aria-label={`${st.label}: ${st.note}`}
                  tabIndex={i === mode ? 0 : -1}
                  onClick={() => pick(i)}
                  onKeyDown={(e) => onKey(e, i)}
                  className={`h-11 min-w-[52px] rounded-full px-3 text-[13px] font-medium tracking-[-0.01em] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#ffa24a] focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:px-4 ${i === mode ? "bg-white text-black" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                >
                  <span className="tabular-nums sm:hidden">{i}</span>
                  <span className="hidden sm:inline">{st.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="pointer-events-none absolute bottom-7 right-6 hidden text-[11px] uppercase tracking-[0.3em] text-white/40 sm:right-10 lg:bottom-14 lg:right-16 lg:block">Drag to turn</p>
      </div>
    </section>
  );
}
