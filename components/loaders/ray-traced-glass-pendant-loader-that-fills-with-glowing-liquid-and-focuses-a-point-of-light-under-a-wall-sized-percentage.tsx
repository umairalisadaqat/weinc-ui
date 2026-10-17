import { useEffect, useRef, useState } from "react";

// What the loader says while it works. `until` is the last percent that line covers.
const stages = [
  { until: 14, note: "Finding the fonts" },
  { until: 38, note: "Laying out eleven pages" },
  { until: 63, note: "Developing the photographs" },
  { until: 88, note: "Wiring up the booking form" },
  { until: 99, note: "Checking it on a phone" },
  { until: 100, note: "Ready when you are" },
];
// The self-running demo: [percent to reach, seconds to get there]. A repeated percent is a stall.
// To show real progress, delete the demo block in the frame loop and write your own number to `s.goal`.
const demo: [number, number][] = [
  [72, 3.6], [81, 0.9], [88, 1.4], [88, 0.9], [97, 1.3], [100, 1.0], [100, 3.8],
  [0, 1.3], [0, 0.6], [9, 0.8], [14, 0.6], [31, 1.5], [38, 0.8], [38, 0.5], [52, 1.3], [63, 1.0], [72, 1.1],
];
const START = 72; // the percent it opens on
const DRAIN = 7; // index in `demo` where the bulb empties, used by "Run again"
const DROP = 1.45; // height of the bulb's centre above the floor, in bulb radii: this sets where the light comes to a point
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const ZW = 3.6; // how far the back wall stands behind the bulb
const RI = 0.945; // inner radius of the glass

const stageOf = (pct: number) => Math.max(0, stages.findIndex((st) => pct <= st.until));
// Liquid height inside the sphere (from -RI to RI) for a volume fraction f.
const levelFor = (f: number) => {
  const want = Math.max(0, Math.min(1, f)) * 4;
  let lo = 0, hi = 2;
  for (let i = 0; i < 22; i++) { const d = (lo + hi) / 2; if (d * d * (3 - d) < want) lo = d; else hi = d; }
  return (lo - 1) * RI;
};

// How wide the pool of light under the bulb is for a liquid height h: the same optics the shader runs,
// boiled down to one radius for the cone of light in the haze.
const spotFor = (h: number) => {
  const n = 1.333, D = DROP;
  let sum = 0, wsum = 0;
  for (let k = 0; k < 16; k++) {
    const b = 0.215 + ((k + 0.5) / 16) * (RI - 0.215), yE = Math.sqrt(RI * RI - b * b);
    let px = b, py = -yE, dx = 0, dy = -1;
    if (yE <= h) {
      const c = yE / RI, kk = 1 - (1 - c * c) / (n * n), f = c / n - Math.sqrt(kk);
      dx = f * (b / RI); dy = -1 / n + f * (yE / RI);
      const t = -2 * (b * dx + yE * dy); px = b + dx * t; py = yE + dy * t;
    } else if (h <= -yE) { sum += b * b; wsum += b; continue; }
    const nx = -px / RI, ny = -py / RI, c2 = -(dx * nx + dy * ny), k2 = 1 - n * n * (1 - c2 * c2);
    if (k2 < 0) continue;
    const f2 = n * c2 - Math.sqrt(k2), ex = n * dx + f2 * nx, ey = n * dy + f2 * ny;
    sum += b * Math.abs(px + ex * ((-D - py) / ey)); wsum += b;
  }
  return wsum > 0 ? Math.min(1, sum / wsum) : 1;
};

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 tone(vec3 x){ x *= 0.95; vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return pow(clamp(a / b, 0.0, 1.0), vec3(1.0 / 2.2)); }
`;

// The photograph. Sphere, liquid and room are all exact intersections, so every ray is followed through
// glass, air and liquid the way light goes, and the floor works out where the lens sends the beam.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform vec3 uC; uniform vec3 uAx; uniform vec3 uLn; uniform float uLvl; uniform float uFill; uniform float uRip; uniform float uTime;
uniform vec4 uCol0; uniform vec4 uCol1; uniform vec4 uCol2; uniform vec3 uGl0; uniform vec3 uGl1; uniform vec3 uGl2; uniform vec2 uPct; uniform vec3 uText; uniform vec4 uAtlas;
uniform sampler2D uTex; uniform float uFlash; uniform vec2 uCau; uniform float uSpot; uniform float uDirect; uniform vec4 uBub[6];
const float RO = 1.0; const float RI = ${RI.toFixed(3)}; const float NG = 1.5; const float NL = 1.333;
const float ZW = ${ZW.toFixed(2)}; const float RC = 0.5; const float PI = 3.14159265;
const vec3 PAPER = vec3(0.030, 0.078, 0.054);   // the green sweep
const vec3 PAINT = vec3(0.80, 0.76, 0.62);      // the numerals
const vec3 SIP = vec3(0.10, 0.035, 2.6);        // what the liquid absorbs, per radius travelled
const vec3 GLOW = vec3(0.50, 1.0, 0.045);       // what it gives back
const vec3 BRASS = vec3(0.95, 0.74, 0.40);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ return 0.5 * n2(p) + 0.25 * n2(p * 2.03 + 7.1) + 0.125 * n2(p * 4.01 + 3.3) + 0.0625 * n2(p * 8.1 + 1.7); }
float fres(float ci, float n1, float n2v){
  ci = clamp(ci, 0.0, 1.0); float s2 = (n1 / n2v) * (n1 / n2v) * (1.0 - ci * ci); if (s2 >= 1.0) return 1.0;
  float ct = sqrt(1.0 - s2); float rs = (n1 * ci - n2v * ct) / (n1 * ci + n2v * ct); float rp = (n1 * ct - n2v * ci) / (n1 * ct + n2v * ci);
  return 0.5 * (rs * rs + rp * rp);
}

// A rectangular softbox seen by a ray.
float rectL(vec3 ro, vec3 rd, vec3 c, vec3 n, vec3 u, vec3 v, vec2 hs, float soft){
  float dn = dot(rd, n); if (dn > -1e-4) return 0.0;
  float t = dot(c - ro, n) / dn; if (t < 0.0) return 0.0;
  vec3 q = ro + rd * t - c; float s = soft * t;
  vec2 uvq = vec2(dot(q, u), dot(q, v)); vec2 d = abs(uvq) - hs;
  float cloth = 1.0 - 0.3 * clamp(length(uvq / hs), 0.0, 1.4);
  return smoothstep(s, -s, d.x) * smoothstep(s, -s, d.y) * cloth;
}
// The dark studio in front of the set, with its lights.
vec3 env(vec3 ro, vec3 rd, float soft){
  vec3 c = vec3(0.012, 0.02, 0.017) + vec3(0.02, 0.035, 0.03) * smoothstep(-0.2, 0.9, rd.y);
  c += vec3(1.0, 0.97, 0.9) * 11.0 * rectL(ro, rd, vec3(-0.4, 8.0, -0.6), vec3(0.0, -1.0, 0.0), vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), vec2(2.3, 1.5), soft);
  vec3 ln = normalize(vec3(1.0, -0.05, 0.5));
  c += vec3(0.80, 0.95, 1.0) * 5.0 * rectL(ro, rd, vec3(-8.5, 3.0, -4.5), ln, normalize(cross(vec3(0.0, 1.0, 0.0), ln)), vec3(0.0, 1.0, 0.0), vec2(1.3, 3.0), soft);
  vec3 rn = normalize(vec3(-1.0, -0.05, 0.45));
  c += vec3(1.0, 0.86, 0.66) * 3.0 * rectL(ro, rd, vec3(8.0, 2.6, -5.0), rn, normalize(cross(vec3(0.0, 1.0, 0.0), rn)), vec3(0.0, 1.0, 0.0), vec2(0.5, 3.2), soft);
  c += vec3(0.9, 1.0, 0.95) * 0.55 * rectL(ro, rd, vec3(-1.5, 4.5, -15.0), vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec2(5.0, 2.4), soft + 0.02);
  return c;
}

// Two strip lights standing out of frame beside the set. Only the glass ever sees them: they are what
// draws a bright line down each edge of the bulb.
vec3 strips(vec3 ro, vec3 rd){
  vec3 a = normalize(vec3(-1.0, 0.0, -0.3)); vec3 b = normalize(vec3(1.0, 0.0, -0.22));
  return vec3(1.0, 0.97, 0.9) * 6.0 * rectL(ro, rd, vec3(4.8, 2.0, 2.0), a, normalize(cross(vec3(0.0, 1.0, 0.0), a)), vec3(0.0, 1.0, 0.0), vec2(0.3, 2.6), 0.05)
       + vec3(0.85, 0.96, 1.0) * 6.0 * rectL(ro, rd, vec3(-9.0, 2.2, 1.6), b, normalize(cross(vec3(0.0, 1.0, 0.0), b)), vec3(0.0, 1.0, 0.0), vec2(0.4, 2.8), 0.05);
}

// ---- the numerals painted on the wall -------------------------------------------------------
float glyph(float id, vec2 g){
  if (abs(g.x) > uAtlas.x * 0.5 / uAtlas.y - 0.01 || g.y < -0.14 || g.y > 1.14) return 0.0;
  return texture2D(uTex, vec2((id + 0.5) * uAtlas.x + g.x * uAtlas.y, uAtlas.z - g.y * uAtlas.w)).r;
}
float column(vec2 q, vec4 c, vec3 g){
  if (c.y < 0.002) return 0.0;
  float gx = q.x - (c.x + 0.5 * c.y);
  if (abs(gx) > 0.6) return 0.0;
  float a = 0.0;
  // a rolling figure is smeared along its travel, the way a shutter would catch it
  for (int i = 0; i < 12; i++) {
    float f = clamp(c.z + c.w * (float(i) - 5.5) * 0.09, 0.0, 1.0) * g.z;
    float a0 = g.x > 10.5 ? 0.0 : glyph(g.x, vec2(gx, q.y - f * 1.3));
    float a1 = g.y > 10.5 ? 0.0 : glyph(g.y, vec2(gx, q.y - f * 1.3 + 1.3 * g.z));
    a += max(a0, a1);
    if (abs(c.w) < 0.002) { a *= 12.0; break; }
  }
  return a / 12.0 * smoothstep(-0.14, -0.02, q.y) * smoothstep(1.14, 1.02, q.y);
}
float ink(vec2 w){
  vec2 q = (w - uText.xy) / uText.z;
  if (q.x < -0.6 || q.x > 4.4 || q.y < -0.16 || q.y > 1.16) return 0.0;
  float a = max(column(q, uCol0, uGl0), max(column(q, uCol1, uGl1), column(q, uCol2, uGl2)));
  return max(a, glyph(10.0, vec2(q.x - (uPct.x + 0.5 * uPct.y), q.y)));
}

// ---- where the lens puts the overhead beam ----------------------------------------------------
// Seen from above the bulb is a ring of glass around a liquid lens. Follow fifty-six rings of light down
// through it, note where each lands, and add up how much arrives at this distance from the axis.
vec3 caustic(vec3 p){
  float rho = length(p.xz - uC.xz - uCau);
  if (rho > 2.3) return vec3(1.0);
  float D = uC.y - p.y; float s = 0.026;
  vec3 acc = vec3(0.0);
  for (int k = 0; k < 56; k++) {
    float b = (float(k) + 0.5) / 56.0;
    float yE = sqrt(max(RI * RI - b * b, 0.0));
    float ci = sqrt(1.0 - b * b);
    float sh = (1.0 - fres(ci, 1.0, NG)); sh *= sh * 0.92;
    vec3 T = vec3(sh); float r = b;
    if (b > RI) { T = vec3(0.3); }
    else if (b < 0.215) { T = vec3(0.0); }
    else if (yE <= uLvl) {
      // straight into liquid through the shoulder of the glass: this ring behaves like a ball lens
      vec2 P = vec2(b, yE); vec2 d1 = refract(vec2(0.0, -1.0), P / RI, 1.0 / NL);
      float t = -2.0 * dot(P, d1); vec2 P2 = P + d1 * t; vec2 N2 = -P2 / RI;
      vec2 d2 = refract(d1, N2, NL);
      if (dot(d2, d2) < 0.5) T = vec3(0.0);
      else { T *= exp(-SIP * t) * (1.0 - fres(dot(-d1, N2), NL, 1.0)); r = P2.x + d2.x * ((-D - P2.y) / d2.y); }
    } else if (uLvl > -yE) {
      // down through the air, through the flat surface, out through the curved bottom
      vec2 P2 = vec2(b, -yE); vec2 N2 = -P2 / RI;
      vec2 d2 = refract(vec2(0.0, -1.0), N2, NL);
      if (dot(d2, d2) < 0.5) T = vec3(0.0);
      else { T *= 0.98 * exp(-SIP * (uLvl + yE)) * (1.0 - fres(N2.y, NL, 1.0)); r = P2.x + d2.x * ((-D - P2.y) / d2.y); }
    }
    float ar = abs(r);
    float g = exp(-(rho - ar) * (rho - ar) / (2.0 * s * s)) / (2.5066 * s * sqrt(ar * ar + s * s * 0.159));
    acc += T * g * b * (1.0 / 56.0);
  }
  return acc + smoothstep(RO - 0.16, RO + 0.2, rho);
}
float sphSoft(vec3 ro, vec3 rd, float k){
  vec3 oc = ro - uC; float b = dot(oc, rd); if (b > 0.0) return 1.0;
  float dm = sqrt(max(dot(oc, oc) - b * b, 0.0)); float w = -b / k;
  return smoothstep(RO - w * 0.45, RO + w, dm);
}

// ---- the set: a floor that sweeps up into a wall ----------------------------------------------
vec3 stage(vec3 ro, vec3 rd, float full){
  float t = -1.0; vec3 n = vec3(0.0); float kind = 0.0;
  if (rd.y < 0.0) { float tf = -ro.y / rd.y; if (ro.z + rd.z * tf < ZW - RC) { t = tf; n = vec3(0.0, 1.0, 0.0); kind = 1.0; } }
  if (kind < 0.5 && rd.z > 0.0) { float tw = (ZW - ro.z) / rd.z; float y = ro.y + rd.y * tw; if (y > RC && y < 9.0) { t = tw; n = vec3(0.0, 0.0, -1.0); kind = 2.0; } }
  if (kind < 0.5) {
    vec2 o = vec2(ro.y - RC, ro.z - (ZW - RC)); vec2 d = rd.yz; float a = dot(d, d); float b = dot(o, d); float c = dot(o, o) - RC * RC; float h = b * b - a * c;
    if (h > 0.0 && a > 1e-6) { float tc = (-b + sqrt(h)) / a; vec2 q = o + d * tc; if (tc > 0.0 && q.x <= 0.0 && q.y >= 0.0) { t = tc; n = vec3(0.0, -q.x / RC, -q.y / RC); kind = 3.0; } }
  }
  if (kind < 0.5) return env(ro, rd, 0.05);
  vec3 p = ro + rd * t;
  // one coordinate that runs along the floor and on up the wall, so the paper has no seam
  float run = kind < 1.5 ? p.z : (kind < 2.5 ? ZW - RC + RC * 1.5708 + p.y - RC : ZW - RC + RC * atan(max(p.z - (ZW - RC), 0.0), max(RC - p.y, 1e-4)));
  vec2 tuv = vec2(p.x, run);
  float mott = fbm(tuv * 0.9 + 3.0); float fine = n2(tuv * 90.0); float fibre = n2(vec2(tuv.x * 14.0, tuv.y * 260.0));
  vec3 alb = PAPER * (0.86 + 0.26 * mott + 0.07 * fine + 0.07 * fibre);
  float a = 0.0; float shd = 0.0; float lip = 0.0;
  if (kind > 1.5 && kind < 2.5) {
    a = ink(p.xy); float px = uText.z * 0.012;
    shd = max(ink(p.xy + vec2(-px, px * 1.3)) - a, 0.0);
    lip = max(a - ink(p.xy + vec2(-px, px) * 0.6), 0.0);
  }
  alb = mix(alb * (1.0 - 0.6 * shd), PAINT * (0.9 + 0.1 * fine + 0.05 * mott + 0.3 * lip), a);

  vec3 toC = uC - p; float dC = length(toC); vec3 nC = toC / dC;
  float solid = RO * RO / (dC * dC);
  float ao = 1.0 - 0.75 * max(dot(n, nC), 0.0) * solid;
  vec3 through = mix(vec3(0.72), exp(-SIP * 0.9) * 0.9, uFill);   // what a shadow of the bulb lets past

  vec3 E = vec3(0.0);
  // the overhead softbox
  vec3 lt = vec3(-0.4, 8.0, -0.6) - p; float d2 = dot(lt, lt); lt /= sqrt(d2);
  E += vec3(1.0, 0.97, 0.9) * 13.0 * max(dot(n, lt), 0.0) * max(lt.y, 0.0) / d2 * mix(through, vec3(1.0), sphSoft(p, lt, 2.2));
  // a broad fill from beside the camera that falls off across the backdrop
  vec3 lf = normalize(vec3(-0.34, 0.32, -1.0));
  float wash = 0.05 + 0.95 * smoothstep(7.0, 0.4, length((p.xy - vec2(-1.6, 3.0)) * vec2(1.0, 1.5)));
  E += vec3(0.95, 1.0, 0.97) * 1.55 * max(dot(n, lf), 0.0) * wash * mix(through, vec3(1.0), sphSoft(p, lf, 3.5));
  // the narrow beam straight down the cord, and what the lens does with it
  float pool = smoothstep(2.9, 0.5, length(p.xz - vec2(-0.1, -0.2)));
  vec3 cau = full > 0.5 ? caustic(p) : vec3(1.0);
  E += vec3(1.0, 0.96, 0.86) * 1.25 * (1.0 + 3.0 * uFlash) * max(n.y, 0.0) * pool * cau;
  // the liquid is a lamp of its own
  E += GLOW * 13.0 * uFill * (1.0 + 1.6 * uFlash) * max(dot(n, nC), 0.0) * solid / (1.0 + 0.1 * dC);
  // a ring of light that runs out across the floor the moment it is full
  float ring = (1.0 - uFlash) * 3.4; float rr = length(p.xz - uC.xz);
  E += GLOW * 1.4 * uFlash * uFlash * exp(-(rr - ring) * (rr - ring) * 18.0) * max(n.y, 0.0);
  E += vec3(0.035, 0.05, 0.045) * ao;
  vec3 col = alb * E;
  // a soft sheen where the paper turns away from the camera
  vec3 hv = normalize(lt - rd); col += vec3(0.02) * pow(max(dot(n, hv), 0.0), 24.0) * (1.0 - a);
  return col;
}
// The same room for rays that have already bounced about inside the glass: lights, and the set as flat colour.
vec3 cheap(vec3 ro, vec3 rd){
  if (rd.y < -0.02 || (rd.z > 0.3 && rd.y < 0.75)) return PAPER * 0.9 + GLOW * 0.05 * uFill + strips(ro, rd);
  return env(ro, rd, 0.08);
}

// ---- the glass, the liquid, and the bubbles in it ---------------------------------------------
vec3 liqN(vec3 q){
  vec3 u = q - uLn * dot(q, uLn); float r = length(u); vec3 ur = u / max(r, 1e-4);
  float a = sqrt(max(RI * RI - uLvl * uLvl, 1e-4));
  vec3 g = ur * cos(r * 19.0 - uTime * 8.0) * uRip * (0.3 + 0.7 * smoothstep(0.0, 0.6, r / a));
  g += vec3(1.0, 0.0, 0.35) * cos(dot(u, vec3(9.0, 0.0, 3.0)) + uTime * 4.3) * uRip * 0.6;
  g += vec3(-0.4, 0.0, 1.0) * cos(dot(u, vec3(-4.0, 0.0, 11.0)) - uTime * 5.1) * uRip * 0.5;
  g -= ur * smoothstep(a - 0.09, a - 0.004, r) * 0.9;   // the meniscus climbing the glass
  return normalize(uLn + g);
}
float etch(vec3 q){
  float y = dot(q, uAx); float az = atan(q.x, -q.z);
  float m = 0.0;
  // short ticks every tenth of the way up, on the side that faces the camera
  float f = (y / RI + 1.0) * 0.5; float tick = abs(fract(f * 10.0 + 0.5) - 0.5) / 10.0 * 2.0 * RI;
  float longer = step(abs(fract(f * 2.0 + 0.5) - 0.5), 0.03);
  m += 0.75 * smoothstep(0.005, 0.002, tick) * smoothstep(0.02, 0.0, abs(az + 0.62) - 0.07 - 0.07 * longer) * step(abs(y), 0.86);
  return min(m, 1.0);
}
vec3 bulb(vec3 ro, vec3 rd, float t0){
  vec3 p = ro + rd * t0; vec3 q = p - uC; vec3 n = q / RO;
  float F = fres(dot(-rd, n), 1.0, NG);
  float e = etch(q);
  vec3 rf = reflect(rd, n); vec3 col = F * (1.0 - e) * (stage(p, rf, 1.0) + strips(p, rf));
  col += e * vec3(0.42, 0.5, 0.44) * (0.25 + 0.9 * max(n.y, 0.0) + 0.5 * max(dot(n, normalize(vec3(-0.34, 0.32, -1.0))), 0.0) + 0.6 * uFill);
  vec3 T = vec3((1.0 - F) * (1.0 - 0.7 * e));
  vec3 d = refract(rd, n, 1.0 / NG);
  float med = 1.0;   // 1 glass, 2 the air inside, 3 liquid, 4 inside a bubble, 0 back in the room
  float bub = -1.0;
  for (int i = 0; i < 12; i++) {
    q = p - uC;
    float tH = 0.0; vec3 nH = vec3(0.0); float nxt = 0.0;
    float b = dot(q, d); float qq = dot(q, q);
    if (med < 1.5) {
      float h = b * b - (qq - RI * RI);
      if (h > 0.0 && b < 0.0) { tH = -b - sqrt(h); vec3 qh = q + d * tH; nH = qh / RI; nxt = dot(qh, uLn) < uLvl ? 3.0 : 2.0; }
      else { tH = -b + sqrt(max(b * b - (qq - RO * RO), 0.0)); nH = -(q + d * tH) / RO; nxt = 0.0; }
    } else if (med > 3.5) {
      vec3 qb = p - (uC + uBub[0].xyz); float rb = uBub[0].w;
      for (int j = 0; j < 6; j++) { if (abs(float(j) - bub) < 0.5) { qb = p - (uC + uBub[j].xyz); rb = uBub[j].w; } }
      float bb = dot(qb, d); tH = -bb + sqrt(max(bb * bb - (dot(qb, qb) - rb * rb), 0.0)); nH = -(qb + d * tH) / rb; nxt = 3.0;
    } else {
      tH = -b + sqrt(max(b * b - (qq - RI * RI), 0.0)); nH = -(q + d * tH) / RI; nxt = 1.0;
      float dn = dot(d, uLn);
      if ((med < 2.5 && dn < -1e-5) || (med > 2.5 && dn > 1e-5)) {
        float tp = max((uLvl - dot(q, uLn)) / dn, 0.0);
        if (tp < tH) { tH = tp; vec3 ln = liqN(q + d * tp); if (dot(ln, d) * dn <= 0.0) ln = uLn; nH = med < 2.5 ? ln : -ln; nxt = med < 2.5 ? 3.0 : 2.0; }
      }
      if (med > 2.5) {
        for (int j = 0; j < 6; j++) {
          vec3 qb = p - (uC + uBub[j].xyz); float rb = uBub[j].w; float bb = dot(qb, d); float hb = bb * bb - (dot(qb, qb) - rb * rb);
          if (rb > 0.0 && hb > 0.0 && bb < 0.0) { float tb = -bb - sqrt(hb); if (tb > 0.0 && tb < tH) { tH = tb; nH = (qb + d * tb) / rb; nxt = 4.0; bub = float(j); } }
        }
      }
    }
    if (med > 2.5 && med < 3.5) { vec3 qm = q + d * tH * 0.5; float deep = uLvl - dot(qm, uLn); float lit = (0.25 + 0.75 * exp(-max(deep, 0.0) * 1.5)) * (0.8 + 0.5 * exp(-dot(qm.xz, qm.xz) * 2.5));
      col += T * GLOW * (0.13 + 0.4 * uFlash) * lit * (1.0 - exp(-tH * 1.1)); T *= exp(-SIP * tH); }
    else if (med < 1.5) T *= exp(-vec3(0.10, 0.02, 0.06) * tH);
    p += d * tH;
    float n1 = med < 1.5 ? NG : (med > 2.5 && med < 3.5 ? NL : 1.0);
    float n2v = nxt < 0.5 ? 1.0 : (nxt < 1.5 ? NG : (nxt > 2.5 && nxt < 3.5 ? NL : 1.0));
    vec3 r = refract(d, nH, n1 / n2v);
    if (dot(r, r) < 0.5) { d = reflect(d, nH); }
    else {
      float Fi = fres(dot(-d, nH), n1, n2v);
      if (i < 5) col += T * Fi * cheap(p, reflect(d, nH));
      T *= 1.0 - Fi; d = r; med = nxt;
      if (med < 0.5) break;
    }
  }
  T *= 1.0 - 0.5 * etch(p - uC);
  return col + T * (stage(p, d, 1.0) + strips(p, d));
}

// ---- the brass cap and the cord ---------------------------------------------------------------
float iCyl(vec3 ro, vec3 rd, vec3 pa, vec3 pb, float ra, out vec3 nor){
  vec3 ba = pb - pa; vec3 oc = ro - pa; float baba = dot(ba, ba); float bard = dot(ba, rd); float baoc = dot(ba, oc);
  float k2 = baba - bard * bard; float k1 = baba * dot(oc, rd) - baoc * bard; float k0 = baba * dot(oc, oc) - baoc * baoc - ra * ra * baba;
  float h = k1 * k1 - k2 * k0; nor = vec3(0.0); if (h < 0.0) return -1.0; h = sqrt(h);
  float t = (-k1 - h) / k2; float y = baoc + t * bard;
  if (y > 0.0 && y < baba) { nor = (oc + t * rd - ba * y / baba) / ra; return t; }
  t = ((y < 0.0 ? 0.0 : baba) - baoc) / bard;
  if (abs(k1 + k2 * t) < h) { nor = ba * sign(y) / sqrt(baba); return t; }
  return -1.0;
}
vec3 brass(vec3 p, vec3 n, vec3 rd){
  float y = dot(p - uC, uAx);
  // turned on a lathe: fine rings smear the lights up and down the cap
  n = normalize(n + uAx * (n2(vec2(y * 520.0, 1.0)) - 0.5) * 0.22 * (1.0 - abs(dot(n, uAx))));
  vec3 c = vec3(0.0); float w = 0.0;
  for (int i = -2; i <= 2; i++) { float f = float(i) / 2.0; float g = exp(-1.8 * f * f); c += g * stage(p, reflect(rd, normalize(n + uAx * f * 0.3)), 0.0); w += g; }
  vec3 F = BRASS + (1.0 - BRASS) * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  // a knurled waist to grip when the bulb is unscrewed
  float waist = smoothstep(1.05, 1.065, y) * smoothstep(1.19, 1.175, y) * step(abs(dot(n, uAx)), 0.5);
  float kn = abs(fract(atan(n.x + 1e-5, n.z + 2e-5) * 7.0 + y * 40.0) - 0.5) + abs(fract(atan(n.x + 1e-5, n.z + 2e-5) * 7.0 - y * 40.0) - 0.5);
  float under = smoothstep(0.94, 1.1, y);
  vec3 lf = normalize(vec3(-0.34, 0.32, -1.0));
  return (F * (c / w) * (0.5 + 0.5 * under) + BRASS * 0.22 * (0.25 + max(dot(n, lf), 0.0))) * mix(1.0, 0.4 + 1.1 * kn, waist) + BRASS * GLOW * 0.16 * uFill * (1.0 - under);
}

// A little haze in the room shows the beam: a shaft coming down the cord, and under the bulb the
// cone the lens squeezes it into.
vec3 haze(vec3 ro, vec3 rd){
  vec2 o2 = ro.xz - uC.xz - uCau; vec2 d2 = rd.xz; float dd = dot(d2, d2); if (dd < 1e-6) return vec3(0.0);
  float tca = -dot(o2, d2) / dd; if (tca < 0.0) return vec3(0.0);
  if (rd.y < 0.0 && tca > -ro.y / rd.y) return vec3(0.0);
  float dm = length(o2 + d2 * tca); float yc = ro.y + rd.y * tca;
  vec3 h = vec3(0.0);
  float top = uC.y + 0.9;
  if (yc > top) h += vec3(1.0, 0.97, 0.88) * 0.012 * exp(-dm * dm * 1.6) * smoothstep(top, top + 1.6, yc);
  float bot = uC.y - 0.78;
  if (yc < bot && yc > 0.0) {
    float u = yc / bot; float rc = mix(uSpot + 0.04, 0.7, u);
    float prof = exp(-dm * dm / (rc * rc * 0.45));
    h += mix(vec3(1.0, 0.97, 0.88), vec3(0.95, 1.0, 0.2), min(uFill * 1.6, 1.0)) * 0.022 * prof * rc * min(0.49 / (rc * rc), 60.0) * smoothstep(bot, bot - 0.12, yc) * (1.0 + 2.0 * uFlash);
  }
  return h;
}

vec3 render(vec3 ro, vec3 rd){
  float tB = 1e9; float what = 0.0; vec3 nB = vec3(0.0); vec3 nn; float tc;
  tc = iCyl(ro, rd, uC + uAx * 0.962, uC + uAx * 1.04, 0.215, nn); if (tc > 0.0 && tc < tB) { tB = tc; nB = nn; what = 1.0; }
  tc = iCyl(ro, rd, uC + uAx * 1.04, uC + uAx * 1.2, 0.17, nn); if (tc > 0.0 && tc < tB) { tB = tc; nB = nn; what = 1.0; }
  tc = iCyl(ro, rd, uC + uAx * 1.2, uC + uAx * 1.235, 0.2, nn); if (tc > 0.0 && tc < tB) { tB = tc; nB = nn; what = 1.0; }
  tc = iCyl(ro, rd, uC + uAx * 1.235, uC + uAx * 1.43, 0.05, nn); if (tc > 0.0 && tc < tB) { tB = tc; nB = nn; what = 1.0; }
  tc = iCyl(ro, rd, uC + uAx * 1.43, uC + uAx * 14.0, 0.016, nn); if (tc > 0.0 && tc < tB) { tB = tc; nB = nn; what = 2.0; }
  vec3 oc = ro - uC; float b = dot(oc, rd); float h = b * b - (dot(oc, oc) - RO * RO);
  if (h > 0.0) { float ts = -b - sqrt(h); if (ts > 0.0 && ts < tB) { tB = ts; what = 3.0; } }
  if (what > 2.5) return bulb(ro, rd, tB);
  if (what > 1.5) {
    // braided cord: dark cloth with a twist that catches the fill
    vec3 p = ro + rd * tB; float tw = 0.5 + 0.5 * sin(dot(p - uC, uAx) * 190.0 + atan(nB.x, nB.z) * 2.0);
    return vec3(0.012, 0.016, 0.014) * (0.5 + tw) * (0.4 + 1.6 * max(dot(nB, normalize(vec3(-0.34, 0.32, -1.0))), 0.0)) + vec3(0.03) * pow(max(dot(nB, normalize(vec3(-0.6, 0.5, -0.6))), 0.0), 8.0);
  }
  if (what > 0.5) return brass(ro + rd * tB, nB, rd);
  return stage(ro, rd, 1.0) + haze(ro, rd);
}

void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * uJit.z + up * uJit.w; rd = normalize(fp - ro);
  vec3 col = min(render(ro, rd), vec3(40.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the negative: bloom off the hot point, filmic curve, vignette, grain.
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
  c = max(c + (c - nb * 0.25) * 0.2, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 24; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 24.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.03 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 2.2, 0.0), vec3(10.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.03;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.5 * smoothstep(0.3, 1.2, length(q));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.028 * (1.0 - 0.5 * c.g);
  outC = vec4(c, 1.0);
}
`;

// Ten figures and a percent sign, drawn once. The shader sets the number from this sheet, so a
// changing percentage never uploads a new picture.
const CELL = 372, SHEET_W = 4096, SHEET_H = 512, BASE = 456;
function figures() {
  const cv = document.createElement("canvas");
  cv.width = SHEET_W; cv.height = SHEET_H;
  const g = cv.getContext("2d");
  const out = { cv, cap: 400, widths: new Array(11).fill(0.6) as number[] };
  if (!g) return out;
  g.fillStyle = "#000"; g.fillRect(0, 0, SHEET_W, SHEET_H);
  g.fillStyle = "#fff"; g.textBaseline = "alphabetic"; g.textAlign = "left";
  g.font = `600 100px ${FONT}`;
  const capAt100 = g.measureText("H").actualBoundingBoxAscent || 72;
  let size = (400 / capAt100) * 100;
  let widest = 0;
  for (let i = 0; i < 10; i++) widest = Math.max(widest, g.measureText(String(i)).width);
  size = Math.min(size, ((CELL - 24) / widest) * 100);
  const cap = (capAt100 * size) / 100;
  out.cap = cap;
  g.font = `600 ${size}px ${FONT}`;
  for (let i = 0; i < 10; i++) {
    const w = g.measureText(String(i)).width;
    g.fillText(String(i), i * CELL + CELL / 2 - w / 2, BASE);
    out.widths[i] = w / cap - 0.07; // set tight, the way large figures should be
  }
  const ps = size * 0.4;
  g.font = `600 ${ps}px ${FONT}`;
  const pw = g.measureText("%").width;
  g.fillText("%", 10 * CELL + CELL / 2 - pw / 2, BASE);
  out.widths[10] = pw / cap;
  return out;
}

// No WebGL: the same picture as a still, built from circles and gradients.
function Still({ pct }: { pct: number }) {
  const f = pct / 100;
  const level = ((levelFor(f) / RI + 1) / 2) * 100;
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: "radial-gradient(70% 62% at 40% 34%, #3a7d62 0%, #1f4d3a 46%, #0c2219 100%)" }}>
      <div className="absolute inset-x-0 bottom-0 h-[31%]" style={{ background: "linear-gradient(180deg, #0a1c14 0%, #12301f 22%, #0c2219 100%)" }} />
      <div className="absolute left-[74%] top-[82%] h-[150px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-2xl lg:left-[71.5%]" style={{ background: `radial-gradient(closest-side, rgba(120,235,90,${0.2 + 0.5 * f}), rgba(120,235,90,0))` }} />
      <p className="absolute right-[26%] top-[16%] whitespace-nowrap text-right text-[110px] font-semibold leading-none tracking-[-0.06em] text-[#ebe5cd] sm:top-[18%] sm:text-[230px] lg:right-[28.5%] lg:top-[19%] lg:text-[372px]" style={{ fontVariantNumeric: "tabular-nums" }}>
        {pct}<span className="text-[0.4em] tracking-normal text-[#ebe5cd]/80">%</span>
      </p>
      <div className="absolute left-[74%] top-[55%] h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 sm:h-[270px] sm:w-[270px] lg:left-[71.5%] lg:h-[284px] lg:w-[284px]">
        <div className="absolute bottom-full left-1/2 h-[520px] w-[3px] -translate-x-1/2 bg-[#050d09]" />
        <div className="absolute -top-[30px] left-1/2 h-[34px] w-[46px] -translate-x-1/2 rounded-t-[3px]" style={{ background: "linear-gradient(90deg,#3d2c12,#d9b56c 30%,#fff1c4 44%,#a8843f 62%,#4a3615)" }} />
        <div className="absolute left-1/2 top-[110%] h-[40px] w-[112%] -translate-x-1/2 rounded-[50%]" style={{ background: `radial-gradient(closest-side, rgba(255,255,205,${0.3 + 0.7 * f}) 0%, rgba(206,255,60,${0.25 + 0.6 * f}) ${Math.round(46 - 34 * f)}%, rgba(96,200,40,0.5) 78%, rgba(96,200,40,0) 100%)`, filter: "blur(3px)" }} />
        <div className="absolute inset-0 overflow-hidden rounded-full" style={{ background: "radial-gradient(circle at 50% 120%, rgba(8,30,20,0.25), rgba(255,255,255,0.02) 60%)", boxShadow: "inset 0 0 0 1.5px rgba(235,255,240,0.4), inset 6px 0 14px -6px rgba(255,255,255,0.5), inset -6px 0 14px -6px rgba(255,255,255,0.35), inset 0 0 30px rgba(255,255,255,0.1)" }}>
          <div className="absolute inset-x-0 bottom-0 transition-[height] duration-500 motion-reduce:transition-none" style={{ height: `${level}%`, background: "radial-gradient(120% 90% at 50% 100%, #f4ff5c 0%, #c6ea1f 26%, #8dbb10 62%, #6f9a0b 100%)", boxShadow: "0 -2px 0 rgba(250,255,200,0.9), 0 0 50px rgba(214,255,60,0.6)" }} />
          <div className="absolute left-[30%] top-[6%] h-[13%] w-[40%] rounded-[45%] bg-white/70 blur-[5px]" />
          <div className="absolute left-[8%] top-[24%] h-[52%] w-[5%] rounded-full bg-white/40 blur-[3px]" />
        </div>
      </div>
    </div>
  );
}

export default function RayTracedGlassPendantLoader() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pct, setPct] = useState(START);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const api = useRef<{ again: () => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts = { antialias: false, alpha: false, powerPreference: "high-performance" as const };
    const gl2 = cv.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? cv.getContext("webgl", opts)) as WebGLRenderingContext | null;
    const canAcc = !!gl2 && (!!gl2.getExtension("EXT_color_buffer_float") || !!gl2.getExtension("EXT_color_buffer_half_float"));
    const info = gl ? gl.getExtension("WEBGL_debug_renderer_info") : null;
    const software = /swiftshader|llvmpipe|software|basic render/i.test(gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "");

    let scene: WebGLProgram | null = null, post: WebGLProgram | null = null;
    if (gl) {
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
      scene = link(SCENE); post = canAcc ? link(POST) : null;
    }
    const live = !!gl && !!scene && (!canAcc || !!post);
    if (!live) setShown("still");

    const fig = live ? figures() : null;
    const W10 = fig ? [...fig.widths, 0] : new Array(12).fill(0.6);
    const su: Record<string, WebGLUniformLocation | null> = {}, pu: Record<string, WebGLUniformLocation | null> = {};
    let acc: WebGLTexture | null = null, fbo: WebGLFramebuffer | null = null;
    if (live && gl && scene && fig) {
      for (const n of ["uRes", "uJit", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uC", "uAx", "uLn", "uLvl", "uFill", "uRip", "uTime", "uCol0", "uCol1", "uCol2", "uGl0", "uGl1", "uGl2", "uPct", "uText", "uAtlas", "uTex", "uFlash", "uCau", "uSpot", "uDirect", "uBub"]) su[n] = gl.getUniformLocation(scene, n);
      if (post) for (const n of ["uAcc", "uRes", "uGrain", "uCentre"]) pu[n] = gl.getUniformLocation(post, n);
      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fig.cv);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (canAcc) { acc = gl.createTexture(); fbo = gl.createFramebuffer(); }
    }

    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const s = {
      goal: START, seg: 0, segT: 0, from: START, running: !reduce,
      vol: START / 100, volV: 0, rip: 0.02, flash: 0, wasFull: false,
      th: [0.012, 0.004], thV: [0, 0.01], sl: [0, 0], slV: [0, 0],
      // each figure column: the glyph showing, the one rolling in (11 is a blank), how far the roll has got
      col: [11, Math.floor(START / 10), START % 10].map((g) => ({ a: g, b: g, f: 1, v: 0, dir: 1 })),
      bub: Array.from({ length: 6 }, (_, i) => ({ x: 0, y: -2, z: 0, r: 0, v: 0, ph: i * 1.7, wait: 0.3 + i * 0.45 })),
      px: 0, py: 0, sx: 0, sy: 0, lastX: 0, lastY: 0, count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t: 0, pct: START, prev: START, first: true,
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      if (!live || !gl) return;
      const dpr = Math.min(software ? 0.6 : 1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.3e6 / (cssW * cssH * dpr * dpr)));
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
    const norm = (v: number[]) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
    const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

    // The camera: a long lens a little above the bulb, looking slightly down so the floor shows.
    const camera = () => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      const el = 0.165, az = -0.045 + s.sx * 0.05, dist = 12.5;
      const tgt = [0, 1.66, 0.3];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el) - s.sy * 0.22, tgt[2] - dist * Math.cos(az) * Math.cos(el)];
      const foc = 2.3 * Math.min(1, 0.3 + aspect * 0.62);
      const shift = wide ? [0.215 * aspect, -0.012] : cssW >= 640 ? [0.23 * aspect, 0.05] : [0.2 * aspect, -0.035];
      const fw = norm([tgt[0] - cam[0], tgt[1] - cam[1], tgt[2] - cam[2]]);
      const rt = norm(cross([0, 1, 0], fw)), up = cross(fw, rt);
      // where a point of the frame, in CSS pixels, meets the back wall
      const wall = (x: number, y: number) => {
        const u = (x - cssW / 2) / cssH - shift[0], v = (cssH / 2 - y) / cssH - shift[1];
        const rd = norm([fw[0] * foc + rt[0] * u + up[0] * v, fw[1] * foc + rt[1] * u + up[1] * v, fw[2] * foc + rt[2] * u + up[2] * v]);
        const t = (ZW - cam[2]) / rd[2];
        return [cam[0] + rd[0] * t, cam[1] + rd[1] * t];
      };
      // and the height in the frame of a point on that wall
      const frameY = (x: number, y: number, z: number) => {
        const d = [x - cam[0], y - cam[1], z - cam[2]];
        const v = ((d[0] * up[0] + d[1] * up[1] + d[2] * up[2]) / (d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2])) * foc;
        return cssH / 2 - (v + shift[1]) * cssH;
      };
      return { wide, roomy: cssW >= 640, aspect, tgt, cam, foc, shift, wall, frameY };
    };

    const draw = (alpha: number, sample: number) => {
      if (!live || !gl || !scene) return;
      const c = camera();
      // set the numerals: left edge on the page margin, sized to the frame
      const margin = c.wide ? 64 : cssW >= 640 ? 40 : 24;
      const axisPx = cssW / 2 + c.shift[0] * cssH;
      // with room, the number runs flush right into the bulb so the percent sign sits behind the glass;
      // on a phone it stands clear above the bulb
      const edgePx = c.roomy ? axisPx + 0.02 * cssH * c.foc : cssW - margin;
      const capPx = c.roomy ? Math.min(0.36 * cssH, 0.212 * cssW, (edgePx - margin) / 2.72) : (cssW - 2 * margin) / 2.78;
      const basePx = c.roomy ? c.frameY(-1, 0.57, ZW) : c.frameY(0, DROP + 1.5, 0) - 0.03 * cssH;
      const o = c.wall(edgePx, basePx), o2 = c.wall(edgePx, basePx - capPx);
      const capW = o2[1] - o[1];
      let x = 0;
      const cols: number[][] = [];
      for (const k of s.col) {
        const e = k.f * k.f * (3 - 2 * k.f);
        const w = Math.max(0, W10[k.a] + (W10[k.b] - W10[k.a]) * e);
        cols.push([x, w, k.f, k.v / 60, k.a, k.b, k.dir]); x += w;
      }
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.045 : 0;
      const LEN = 12;
      const C = [LEN * s.th[0], DROP + LEN * 0.5 * (s.th[0] * s.th[0] + s.th[1] * s.th[1]), LEN * s.th[1]];
      const ax = norm([-s.th[0], 1, -s.th[1]]);
      const ln = norm([ax[0] + s.sl[0], ax[1], ax[2] + s.sl[1]]);
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]); gl.uniform3f(su.uTgt, c.tgt[0], c.tgt[1], c.tgt[2]);
      gl.uniform1f(su.uFoc, c.foc); gl.uniform2f(su.uShift, c.shift[0], c.shift[1]); gl.uniform1f(su.uFocus, 12.6);
      gl.uniform3f(su.uC, C[0], C[1], C[2]); gl.uniform3f(su.uAx, ax[0], ax[1], ax[2]); gl.uniform3f(su.uLn, ln[0], ln[1], ln[2]);
      gl.uniform1f(su.uLvl, levelFor(s.vol)); gl.uniform1f(su.uFill, s.vol); gl.uniform1f(su.uRip, s.rip); gl.uniform1f(su.uTime, s.t);
      [su.uCol0, su.uCol1, su.uCol2].forEach((u, i) => gl.uniform4f(u, cols[i][0], cols[i][1], cols[i][2], cols[i][3]));
      [su.uGl0, su.uGl1, su.uGl2].forEach((u, i) => gl.uniform3f(u, cols[i][4], cols[i][5], cols[i][6]));
      gl.uniform2f(su.uPct, x + 0.05, W10[10]);
      gl.uniform3f(su.uText, o[0] - (x + 0.05 + W10[10]) * capW, o[1], capW);
      const cap = fig ? fig.cap : 400;
      gl.uniform4f(su.uAtlas, CELL / SHEET_W, cap / SHEET_W, BASE / SHEET_H, cap / SHEET_H);
      gl.uniform1i(su.uTex, 0);
      gl.uniform1f(su.uFlash, s.flash);
      gl.uniform2f(su.uCau, -s.sl[0] * 0.5, -s.sl[1] * 0.5);
      gl.uniform1f(su.uSpot, spotFor(levelFor(s.vol)));
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      const bb = new Float32Array(24);
      s.bub.forEach((b, i) => { bb[i * 4] = b.x; bb[i * 4 + 1] = b.y; bb[i * 4 + 2] = b.z; bb[i * 4 + 3] = b.r; });
      gl.uniform4fv(su.uBub, bb);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, reduce ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, c.wide ? 0.6 : 0.5, c.wide ? 0.48 : 0.5);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const again = () => {
      s.seg = DRAIN; s.segT = 0; s.from = s.goal; s.running = true;
      wake();
    };
    api.current = { again };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++; s.t += dt;

      // ---- the demo: walk the script. Replace this block with your own `s.goal = percent`.
      if (s.running) {
        s.segT += dt;
        let [to, secs] = demo[s.seg];
        while (s.segT >= secs) {
          s.segT -= secs; s.from = to; s.seg = (s.seg + 1) % demo.length;
          if (reduce && to === 100) { s.running = false; s.segT = 0; break; }
          [to, secs] = demo[s.seg];
        }
        const k = Math.min(1, s.segT / secs), e = k * k * k * (k * (6 * k - 15) + 10);
        s.goal = reduce ? s.from : s.from + (to - s.from) * e;
      } else if (reduce) s.goal = 100;

      const pctNow = Math.round(s.goal);
      if (pctNow !== s.pct) { s.pct = pctNow; setPct(pctNow); }
      const tgt = [pctNow >= 100 ? 1 : 11, pctNow >= 10 ? Math.floor(pctNow / 10) % 10 : 11, pctNow % 10];
      const rising = pctNow >= s.prev; s.prev = pctNow;
      let moving = false;
      if (reduce) {
        if (s.vol !== s.goal / 100) { s.count = 0; s.fresh = true; }
        s.vol = s.goal / 100; s.rip = 0; s.th = [0, 0]; s.flash = 0;
        s.col.forEach((k, i) => { k.a = tgt[i]; k.b = tgt[i]; k.f = 1; k.v = 0; });
      } else {
        // the liquid is heavy: it chases the number on a spring and runs a little past it
        const before = s.vol;
        for (let i = 0; i < 2; i++) { s.volV += (46 * (s.goal / 100 - s.vol) - 8.4 * s.volV) * (dt / 2); s.vol += s.volV * (dt / 2); }
        if (s.vol > 1) { s.vol = 1; s.volV = Math.min(0, s.volV); }
        if (s.vol < 0) { s.vol = 0; s.volV = Math.max(0, s.volV); }
        const rate = Math.abs(s.vol - before) / Math.max(dt, 1e-3);
        s.rip = Math.min(0.2, s.rip + rate * dt * 2.2);
        s.rip += (0.012 - s.rip) * (1 - Math.exp(-dt * 1.5));
        // filling tips the surface and sets it wobbling
        const kick = rate * dt * 0.9;
        s.slV[0] += Math.sin(s.t * 3.1) * kick * 9; s.slV[1] += Math.cos(s.t * 2.3) * kick * 6;
        // the moment it is full
        const full = pctNow >= 100 && s.vol > 0.985;
        if (full && !s.wasFull) { s.flash = 1; s.thV[0] += 0.004; }
        s.wasFull = full;
        if (s.flash > 0.003) s.flash *= Math.exp(-dt * 1.7); else s.flash = 0;
        // the pendulum, and the liquid that lags behind it
        for (let a = 0; a < 2; a++) {
          const drift = Math.sin(s.t * (a ? 0.53 : 0.41) + a * 2) * 0.0009;
          const accel = -5.6 * s.th[a] - 0.22 * s.thV[a] + drift;
          s.thV[a] += accel * dt; s.th[a] += s.thV[a] * dt;
          s.slV[a] += (-70 * s.sl[a] - 2.6 * s.slV[a] - accel * 6.5) * dt; s.sl[a] += s.slV[a] * dt;
          s.sl[a] = Math.max(-0.3, Math.min(0.3, s.sl[a]));
        }
        // figures roll like a counter: one step at a time, upward when the number climbs
        s.col.forEach((k, i) => {
          if (k.f >= 1 && k.b !== tgt[i]) { k.a = k.b; k.b = tgt[i]; k.f = 0; k.v = 0; k.dir = rising ? 1 : -1; }
          if (k.f < 1) {
            k.v += (190 * (1 - k.f) - 19 * k.v) * dt; k.f += k.v * dt;
            if (k.f > 0.997 && Math.abs(k.v) < 0.6) { k.f = 1; k.v = 0; k.a = k.b; }
          }
        });
        // bubbles: born at the bottom while it fills, rising in a wobble, gone at the surface
        const lvl = levelFor(s.vol);
        for (const b of s.bub) {
          if (b.r <= 0) {
            b.wait -= dt * (0.35 + Math.min(4, rate * 30));
            if (b.wait <= 0 && lvl > -0.6) {
              const a = b.ph * 2.4 + s.t, rr = 0.1 + 0.45 * ((b.ph * 7.31) % 1);
              b.x = Math.cos(a) * rr; b.z = Math.sin(a) * rr; b.y = -Math.sqrt(Math.max(0.02, RI * RI - rr * rr)) + 0.08;
              b.r = 0.018 + 0.03 * ((b.ph * 3.17 + s.t) % 1); b.v = 0;
            }
          } else {
            b.v += (0.9 + b.r * 22 - b.v * 2.2) * dt; b.y += b.v * dt;
            b.x += Math.sin(s.t * 5 + b.ph * 3) * 0.12 * dt; b.z += Math.cos(s.t * 4.3 + b.ph) * 0.12 * dt;
            const lim = Math.sqrt(Math.max(0, RI * RI - b.y * b.y)) - b.r - 0.02, rad = Math.hypot(b.x, b.z);
            if (rad > lim && rad > 0) { b.x *= Math.max(0, lim) / rad; b.z *= Math.max(0, lim) / rad; }
            if (b.y > lvl - b.r * 0.6 || lim <= 0) { b.r = 0; b.wait = 0.5 + ((b.ph * 5.3 + s.t) % 1.6); s.rip = Math.min(0.2, s.rip + 0.02); }
          }
        }
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        moving = true;
      }

      if (live) {
        if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
        else if (moving) draw(0.5, 1 + (s.frame % 32));
        else if (s.count < 48) { s.count++; draw(1 / s.count, s.count); }
        if (s.first) { s.first = false; setShown("gl"); }
        if (!reduce && !software && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
        if (s.slow > 45 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }
      }
      if (moving || s.running || (live && s.count < 48)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);

    // a pointer passing the bulb pushes it, and a press flicks it
    const where = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      const wide = r.width >= 1024;
      const bx = r.left + r.width * 0.72, by = r.top + r.height * 0.55;
      return { r, near: Math.hypot(e.clientX - bx, e.clientY - by) < r.height * 0.3, dx: e.clientX - bx };
    };
    const move = (e: PointerEvent) => {
      const w = where(e);
      s.px = ((e.clientX - w.r.left) / w.r.width) * 2 - 1; s.py = ((e.clientY - w.r.top) / w.r.height) * 2 - 1;
      if (!reduce && w.near && s.lastX) {
        s.thV[0] += Math.max(-0.012, Math.min(0.012, (e.clientX - s.lastX) * 0.00055));
        s.thV[1] += Math.max(-0.008, Math.min(0.008, (s.lastY - e.clientY) * 0.0003));
      }
      s.lastX = e.clientX; s.lastY = e.clientY;
      wake();
    };
    const down = (e: PointerEvent) => {
      const w = where(e);
      if (!reduce && w.near) { s.thV[0] += w.dx < 0 ? 0.03 : -0.03; s.rip = Math.min(0.2, s.rip + 0.06); }
      wake();
    };
    const leave = () => { s.px = 0; s.py = 0; s.lastX = 0; };
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerdown", down);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerdown", down);
      box.removeEventListener("pointerleave", leave); cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const at = stageOf(pct);
  const done = pct >= 100;

  return (
    <section className="relative isolate overflow-hidden bg-[#0e2a1f] text-[#efe9d2]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes ray-traced-glass-pendant-loader-rise { from { opacity: 0; transform: translateY(0.35em); filter: blur(5px); } to { opacity: 1; transform: none; filter: blur(0); } }
        .ray-traced-glass-pendant-loader-note { animation: ray-traced-glass-pendant-loader-rise 520ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .ray-traced-glass-pendant-loader-note { animation: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[720px] w-full max-w-[1600px] lg:h-[760px]" style={{ background: "radial-gradient(80% 70% at 40% 36%, #24553f 0%, #153a2b 50%, #0e2a1f 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        {shown === "still" && <Still pct={pct} />}

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-6 pb-7 pt-7 sm:px-10 lg:px-16 lg:pb-14 lg:pt-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#efe9d2]/70">Fennick &amp; Rowe <span className="mx-2 text-[#efe9d2]/35">/</span> publishing your site</p>
          <div>
            <div
              role="progressbar"
              aria-label="Publishing your site"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-valuetext={`${pct} percent. ${stages[at].note}`}
              className="mb-3 flex items-baseline gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-[#efe9d2]/70 lg:mb-4"
            >
              <span className="tabular-nums text-[#dcf34f]">{String(at + 1).padStart(2, "0")}</span>
              <span className="h-px w-8 bg-[#efe9d2]/30" />
              <span className="tabular-nums">{String(stages.length).padStart(2, "0")}</span>
            </div>
            <p aria-live="polite" className="h-[1.3em] text-[22px] italic leading-snug text-[#f4efdc] lg:text-[27px]" style={{ fontFamily: SERIF }}>
              <span key={at} className="ray-traced-glass-pendant-loader-note block">{stages[at].note}</span>
            </p>
            <button
              type="button"
              onClick={() => api.current?.again()}
              className="pointer-events-auto mt-6 inline-flex h-11 items-center gap-2.5 rounded-full border border-[#efe9d2]/25 bg-[#efe9d2]/[0.07] pl-4 pr-5 text-[13px] font-medium tracking-[-0.01em] text-[#f4efdc] outline-none backdrop-blur-sm transition-colors duration-200 hover:bg-[#efe9d2]/[0.16] focus-visible:ring-2 focus-visible:ring-[#dcf34f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e2a1f] lg:mt-7"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10a6 6 0 1 0 2-4.5" /><path d="M4 4v3.5h3.5" /></svg>
              {done ? "Run it again" : "Start over"}
            </button>
          </div>
        </div>
        <p className="pointer-events-none absolute bottom-7 right-6 hidden text-[11px] uppercase tracking-[0.3em] text-[#efe9d2]/55 sm:right-10 lg:bottom-14 lg:right-16 lg:block">Nudge the bulb</p>
      </div>
    </section>
  );
}
