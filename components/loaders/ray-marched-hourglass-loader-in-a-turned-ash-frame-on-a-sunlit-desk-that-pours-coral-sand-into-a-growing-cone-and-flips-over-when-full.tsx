import { useEffect, useRef, useState } from "react";

// What the loader says while it works. `until` is the last percent that line covers.
const stages = [
  { until: 16, note: "Gathering the photographs" },
  { until: 41, note: "Setting the type on every page" },
  { until: 67, note: "Compressing the gallery" },
  { until: 90, note: "Writing the contact form" },
  { until: 99, note: "Proofing it on a small screen" },
  { until: 100, note: "Done. Turning the glass over" },
];
// The self-running demo: [percent to reach, seconds to get there]. A repeated percent is a pause.
// To show real progress, delete the demo block in the frame loop and write your own number to `s.goal`.
const demo: [number, number][] = [
  [74, 2.6], [74, 0.6], [88, 1.6], [96, 1.2], [100, 1.0],
  [100, 99], // held here until the glass has been turned
  [14, 1.6], [14, 0.5], [33, 1.8], [47, 1.4], [47, 0.5], [62, 1.6],
];
const START = 62; // the percent it opens on: both bulbs hold sand and the stream is running
const RESTART = 6; // index in `demo` that follows a flip
const SAND = [0.78, 0.17, 0.065]; // the dyed sand, linear RGB
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const TOPF = 0.93; // how high a full upper bulb is filled, in local units (the glass runs to 1.06)

// Sand heights for the fraction that has run through, p from 0 to 1.
const heights = (p: number) => {
  const q = Math.max(0, Math.min(1, p));
  return {
    top: TOPF * Math.pow(1 - q, 0.8),
    crater: 0.24 * Math.min(1, q * 9) * Math.pow(1 - q, 0.3),
    base: -1.06 + 0.42 * q,
    peak: -1.06 + 0.8 * Math.pow(q, 0.55),
  };
};

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const TONE = `
vec3 tone(vec3 x){ x *= 0.9; vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return pow(clamp(a / b, 0.0, 1.0), vec3(1.0 / 2.2)); }
`;

// The photograph. The hourglass is ray marched in its own frame; glass bends each ray in and out,
// sand is a solid with grains in it, and the sun comes through a window out of frame on the left.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform float uAng; uniform float uLift; uniform float uTop; uniform float uCrat; uniform float uBase; uniform float uPeak; uniform float uHi;
uniform vec3 uFlip; uniform float uFlow; uniform float uTime; uniform float uDirect; uniform vec3 uSand;
const float HC = 1.19;       // centre of the hourglass above the desk at rest
const float WZ = 2.55;       // the wall behind the desk
const float WX = -5.2;       // the window in the left wall
const vec3 SUN = vec3(-0.772, 0.574, -0.273);
const vec3 SUNC = vec3(1.0, 0.86, 0.68) * 3.4;
const vec3 SKY = vec3(0.62, 0.72, 0.9);
const float NG = 1.5;
${TONE}
float h31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ return 0.5 * n2(p) + 0.25 * n2(p * 2.03 + 7.1) + 0.125 * n2(p * 4.01 + 3.3) + 0.0625 * n2(p * 8.1 + 1.7); }

// ---- the frame of the object --------------------------------------------------------------------
vec3 toLocal(vec3 p){ p.y -= HC + uLift; float c = cos(uAng), s = sin(uAng); return vec3(c * p.x + s * p.y, -s * p.x + c * p.y, p.z); }
vec3 dirLocal(vec3 d){ float c = cos(uAng), s = sin(uAng); return vec3(c * d.x + s * d.y, -s * d.x + c * d.y, d.z); }
vec3 dirWorld(vec3 d){ float c = cos(uAng), s = sin(uAng); return vec3(c * d.x - s * d.y, s * d.x + c * d.y, d.z); }

// The blown profile: a long taper into the neck, a full belly, and a mouth that meets the wooden plate.
float prof(float y){ float t = clamp(abs(y) / 1.06, 0.0, 1.0); return 0.044 + 0.405 * pow(sin(3.14159 * 0.86 * pow(t, 0.85)), 1.3); }
float glassD(vec3 q){ return max((length(q.xz) - prof(q.y)) * 0.6, abs(q.y) - 1.07); }

float rcyl(vec2 q, float r, float h, float rr){ vec2 d = vec2(q.x - r + rr, abs(q.y) - h + rr); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rr; }
// Turned on a lathe: a beaded spindle, fat at the ends, a collar halfway, a ring at the waist.
float spR(float y){ float a = abs(y); return 0.03 + 0.017 * smoothstep(0.86, 1.02, a) + 0.016 * exp(-(a - 0.6) * (a - 0.6) * 260.0) + 0.009 * exp(-a * a * 300.0) + 0.006 * exp(-(a - 0.75) * (a - 0.75) * 900.0); }
vec2 frame(vec3 q){
  float rho = length(q.xz); float a = abs(q.y);
  // the two plates: a broad board with a rounded edge and a groove, and a raised boss that holds the glass
  float plate = rcyl(vec2(rho, a - 1.135), 0.66, 0.055, 0.026);
  plate = max(plate, -(length(vec2(rho - 0.66, a - 1.135)) - 0.013));
  plate = min(plate, rcyl(vec2(rho, a - 1.065), 0.54, 0.03, 0.012));
  float sp = 1e9;
  for (int k = 0; k < 3; k++) {
    float an = 1.5708 + float(k) * 2.0944;
    sp = min(sp, length(q.xz - 0.53 * vec2(cos(an), sin(an))) - spR(q.y));
  }
  sp = max(sp, a - 1.09);
  return plate < sp ? vec2(plate, 1.0) : vec2(sp * 0.9, 2.0);
}

// ---- the sand ----------------------------------------------------------------------------------
float sandD(vec3 q){
  float rho = length(q.xz); float y = q.y;
  float wall = (rho - (prof(y) - 0.026)) * 0.6;
  // the upper bulb: from the neck (or, just after a flip, from the cone it was) up to a surface with a crater
  float low = mix(min(uFlip.x, uFlip.y + 0.78 * rho), 0.0, uFlip.z);
  float hi = uHi - uCrat * (1.0 - smoothstep(0.0, 0.42, rho));
  float top = max(max(wall, (y - hi) * 0.7), max((low - y) * 0.7, -y));
  // the lower bulb: a cone standing on a level bed
  float pile = max(uBase, uPeak - 0.78 * rho);
  float bot = max(max(wall, (y - pile) * 0.62), max(y, -y - 1.06));
  float d = min(top, bot);
  if (uFlow > 0.001) {
    // the stream, thickening and thinning as clumps go through, with stray grains beside it
    float sr = 0.0135 * uFlow * (0.7 + 0.6 * n2(vec2(y * 55.0 + uTime * 30.0, 0.5)));
    d = min(d, max(rho - sr, max(y - 0.03, uPeak - 0.02 - y)));
    float yy = y + uTime * 1.9; float cell = floor(yy / 0.045);
    float h = h21(vec2(cell, 3.7));
    vec3 g = vec3((h - 0.5) * 0.05, (cell + 0.5) * 0.045 - uTime * 1.9, (h21(vec2(cell, 9.1)) - 0.5) * 0.05);
    float gr = length(q - g) - 0.0065 * step(0.35, h);
    if (y < 0.0 && y > uPeak) d = min(d, gr);
  }
  return d;
}

// ---- the window the sun comes through --------------------------------------------------------
float pane(vec2 w, float soft){
  float inside = smoothstep(-soft, soft, w.x - 0.25) * smoothstep(-soft, soft, 6.6 - w.x) * smoothstep(-soft, soft, w.y + 9.0) * smoothstep(-soft, soft, 3.4 - w.y);
  vec2 c = vec2((w.x - 0.25) / 1.45, (w.y + 9.0) / 1.7);
  vec2 e = (0.5 - abs(fract(c) - 0.5)) * vec2(1.45, 1.7);
  return inside * smoothstep(0.045 - soft, 0.045 + soft, e.x) * smoothstep(0.045 - soft, 0.045 + soft, e.y);
}
float sunMask(vec3 p){ float t = (WX - p.x) / SUN.x; vec3 h = p + SUN * t; return pane(h.yz, 0.015 + t * 0.011); }

// The room as the glass and the varnish see it: warm plaster, the bright window, the desk below.
vec3 env(vec3 rd){
  vec3 c = mix(vec3(0.95, 0.82, 0.66), vec3(0.8, 0.84, 0.92), smoothstep(-0.1, 0.9, rd.y)) * 0.95;
  if (rd.y < -0.02) c = vec3(0.9, 0.62, 0.38) * 1.1;
  if (rd.x < -0.05) {
    float t = (WX) / rd.x; vec2 w = vec2(HC + rd.y * t, rd.z * t);
    c = mix(c, vec3(3.4, 3.6, 3.9), pane(w, 0.06));
  }
  c += vec3(2.5, 2.5, 2.4) * smoothstep(0.82, 0.9, rd.y) * smoothstep(0.3, 0.0, abs(rd.x));
  return c;
}

// Two tall white cards standing out of frame: only glass sees them, as long bright lines down each bulb.
float card(vec3 rd, vec3 dir, float w, float hgt){ float c = dot(rd, dir); if (c < 0.5) return 0.0; vec3 r = rd / c - dir; float x = length(r - vec3(0.0, r.y, 0.0)); return smoothstep(w, w * 0.4, x) * smoothstep(hgt, hgt * 0.7, abs(r.y)); }
vec3 strips(vec3 rd){
  return vec3(4.2, 4.0, 3.7) * card(rd, normalize(vec3(-0.85, 0.1, -0.53)), 0.07, 0.9) + vec3(2.2, 2.3, 2.4) * card(rd, normalize(vec3(0.9, 0.15, -0.42)), 0.05, 0.8);
}

float shadow(vec3 ro, vec3 rd){
  vec3 c = vec3(0.0, HC + uLift, 0.0); vec3 oc = ro - c; float b = dot(oc, rd); float h = b * b - dot(oc, oc) + 2.2;
  if (h < 0.0) return 1.0;
  h = sqrt(h); float tEnd = -b + h; float t = max(0.004, -b - h);
  float res = 1.0; float through = 1.0;
  for (int i = 0; i < 56; i++) {
    if (t > tEnd) break;
    vec3 q = toLocal(ro + rd * t);
    float d = min(frame(q).x, sandD(q)); float g = glassD(q);
    if (g < 0.0) through = 0.78;
    res = min(res, 9.0 * d / t);
    if (res < 0.004) break;
    t += clamp(min(d, abs(g) + 0.01), 0.006, 0.12);
  }
  return clamp(res, 0.0, 1.0) * through;
}
float objAO(vec3 p, vec3 n){
  float o = 0.0; float w = 1.0;
  for (int i = 1; i <= 4; i++) { float h = 0.05 * float(i * i); vec3 q = toLocal(p + n * h); float d = min(frame(q).x, max(glassD(q), -0.02)); o += w * max(h - d, 0.0); w *= 0.6; }
  return clamp(1.0 - 1.6 * o, 0.0, 1.0);
}

// ---- materials ------------------------------------------------------------------------------------
vec3 desk(vec3 p, vec3 rd){
  vec3 n = vec3(0.0, 1.0, 0.0);
  // pale oak boards running across the frame
  float board = floor(p.z / 0.62); float bz = fract(p.z / 0.62);
  float g = fbm(vec2(p.x * 0.7 + board * 13.0, p.z * 9.0)); float fine = n2(vec2(p.x * 3.0, p.z * 120.0));
  float ring = sin((p.z + 0.4 * fbm(vec2(p.x * 0.35, board))) * 60.0 + g * 9.0) * 0.5 + 0.5;
  vec3 alb = vec3(0.70, 0.5, 0.31) * (0.82 + 0.22 * g + 0.08 * fine - 0.1 * ring * ring) * (0.95 + 0.1 * h21(vec2(board, 2.0)));
  alb *= 1.0 - 0.55 * smoothstep(0.012, 0.0, min(bz, 1.0 - bz) * 0.62);
  float sh = shadow(p + n * 0.002, SUN) * sunMask(p);
  float ao = objAO(p, n);
  vec3 col = alb * (SUNC * SUN.y * sh + SKY * 0.42 * ao + vec3(0.9, 0.7, 0.5) * 0.1);
  // the sand throws a little of its colour onto the boards
  vec3 tc = p - vec3(0.0, HC + uLift, 0.0);
  col += alb * uSand * 0.28 * exp(-dot(tc.xz, tc.xz) * 2.2) * sh;
  // oiled finish: a soft copy of the window
  vec3 r = reflect(rd, normalize(n + vec3(fine - 0.5, 0.0, g - 0.5) * 0.04));
  float F = 0.04 + 0.96 * pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
  col += F * 0.55 * env(r) * mix(0.5, 1.0, ao);
  return col;
}
vec3 wall(vec3 p, vec3 rd){
  vec3 n = vec3(0.0, 0.0, -1.0);
  float m = fbm(p.xy * 1.6); float f = n2(p.xy * 60.0);
  vec3 alb = vec3(0.9, 0.84, 0.75) * (0.9 + 0.12 * m + 0.04 * f);
  float sh = shadow(p + n * 0.002, SUN) * sunMask(p);
  float skirt = smoothstep(0.06, 0.0, p.y);
  return alb * (SUNC * max(dot(n, SUN), 0.0) * sh + SKY * 0.42 + vec3(1.0, 0.8, 0.6) * 0.22 + vec3(0.9, 0.6, 0.35) * 0.28 * smoothstep(1.2, 0.0, p.y)) * (1.0 - 0.3 * skirt);
}
vec3 room(vec3 ro, vec3 rd){
  float t = 1e9; float kind = 0.0;
  if (rd.y < 0.0) { float tf = -ro.y / rd.y; if (ro.z + rd.z * tf < WZ) { t = tf; kind = 1.0; } }
  if (kind < 0.5 && rd.z > 0.0) { t = (WZ - ro.z) / rd.z; kind = 2.0; }
  if (kind < 0.5) return env(rd);
  vec3 p = ro + rd * t;
  return kind < 1.5 ? desk(p, rd) : wall(p, rd);
}

vec3 wood(vec3 p, vec3 q, vec3 nW, vec3 rd, float id){
  vec3 nL = dirLocal(nW);
  float g;
  if (id < 1.5) {
    // the plates: one board each, its grain running across, and the lathe's faint rings on the edge
    g = fbm(vec2(q.x * 1.6, q.z * 14.0 + 2.0 * fbm(q.xz * 2.0)));
    g = 0.6 * g + 0.4 * (0.5 + 0.5 * sin(q.z * 70.0 + g * 10.0));
    g += 0.12 * n2(vec2(length(q.xz) * 900.0, 1.0)) * (1.0 - abs(nL.y));
  } else {
    float an = atan(q.z, q.x);
    g = fbm(vec2(an * 4.0, q.y * 7.0)); g = 0.6 * g + 0.4 * (0.5 + 0.5 * sin(an * 26.0 + q.y * 9.0 + g * 8.0));
  }
  vec3 alb = mix(vec3(0.42, 0.22, 0.09), vec3(0.8, 0.52, 0.27), smoothstep(0.2, 0.8, g));
  float sh = shadow(p + nW * 0.004, SUN) * sunMask(p);
  float ao = objAO(p, nW);
  float dl = max(dot(nW, SUN), 0.0);
  vec3 col = alb * (SUNC * dl * sh + SKY * 0.45 * (0.6 + 0.4 * nW.y) * ao + vec3(0.9, 0.6, 0.35) * 0.35 * max(-nW.y, 0.0) * ao);
  // hand-rubbed oil: a broad sheen and a tighter highlight
  vec3 hv = normalize(SUN - rd);
  col += SUNC * sh * (0.12 * pow(max(dot(nW, hv), 0.0), 18.0) + 0.5 * pow(max(dot(nW, hv), 0.0), 140.0));
  float F = 0.04 + 0.96 * pow(1.0 - max(dot(-rd, nW), 0.0), 5.0);
  col += F * 0.5 * env(reflect(rd, nW)) * ao;
  return col;
}

vec3 sandShade(vec3 q, vec3 nL, vec3 rd, vec3 pw){
  float rho = length(q.xz);
  // grains slide down the crater and the cone: shift the grain lookup along the slope over time
  vec3 g = q;
  if (q.y > 0.0) g.y += uTime * 0.05 * uFlow; else g += vec3(q.x, 0.0, q.z) / max(rho, 0.01) * uTime * 0.025 * uFlow * smoothstep(-0.02, 0.0, q.y - max(uBase, uPeak - 0.78 * rho) + 0.01);
  vec3 c = floor(g * 420.0);
  float a = h31(c); float b = h31(c + 17.0);
  vec3 alb = uSand * (0.72 + 0.5 * a);
  alb = mix(alb, vec3(0.98, 0.86, 0.7), step(0.975, b));      // pale quartz grains
  alb = mix(alb, uSand * vec3(0.5, 0.35, 0.4), step(b, 0.05)); // dark grains
  vec3 jitter = (vec3(h31(c + 3.0), h31(c + 5.0), h31(c + 7.0)) - 0.5) * 0.9;
  vec3 n = normalize(nL + jitter * 0.3);
  vec3 nW = dirWorld(n);
  float sh = shadow(pw + dirWorld(nL) * 0.01, SUN) * sunMask(pw);
  float dl = max(dot(nW, SUN), 0.0) * 0.9 * 0.92 + 0.0;
  vec3 col = alb * (SUNC * dl * sh * 0.62 + SKY * 0.3 + uSand * 0.2);
  // the odd grain catches the sun like a mirror
  vec3 hv = normalize(SUN - rd);
  col += SUNC * sh * 1.6 * step(0.993, a) * pow(max(dot(nW, hv), 0.0), 30.0);
  return col;
}

// ---- the primary ray ---------------------------------------------------------------------------
vec2 objMap(vec3 q){ vec2 f = frame(q); float g = glassD(q); return g < f.x ? vec2(g, 3.0) : f; }
vec3 nObj(vec3 q){ vec2 e = vec2(0.0008, 0.0); return normalize(vec3(objMap(q + e.xyy).x - objMap(q - e.xyy).x, objMap(q + e.yxy).x - objMap(q - e.yxy).x, objMap(q + e.yyx).x - objMap(q - e.yyx).x)); }
vec3 nFrame(vec3 q){ vec2 e = vec2(0.0008, 0.0); return normalize(vec3(frame(q + e.xyy).x - frame(q - e.xyy).x, frame(q + e.yxy).x - frame(q - e.yxy).x, frame(q + e.yyx).x - frame(q - e.yyx).x)); }
vec3 nGlass(vec3 q){ vec2 e = vec2(0.0008, 0.0); return normalize(vec3(glassD(q + e.xyy) - glassD(q - e.xyy), glassD(q + e.yxy) - glassD(q - e.yxy), glassD(q + e.yyx) - glassD(q - e.yyx))); }
vec3 nSand(vec3 q){ vec2 e = vec2(0.0012, 0.0); return normalize(vec3(sandD(q + e.xyy) - sandD(q - e.xyy), sandD(q + e.yxy) - sandD(q - e.yxy), sandD(q + e.yyx) - sandD(q - e.yyx))); }

// march the wooden frame alone (for rays that have been through the glass)
vec3 behind(vec3 ro, vec3 rd){
  vec3 c = vec3(0.0, HC + uLift, 0.0); vec3 oc = ro - c; float b = dot(oc, rd); float h = b * b - dot(oc, oc) + 2.1;
  if (h > 0.0) {
    h = sqrt(h); float t = max(0.0, -b - h); float tEnd = -b + h;
    for (int i = 0; i < 64; i++) {
      vec3 p = ro + rd * t; vec2 f = frame(toLocal(p));
      if (f.x < 0.0008) { vec3 q = toLocal(p); return wood(p, q, dirWorld(nFrame(q)), rd, f.y); }
      t += f.x; if (t > tEnd) break;
    }
  }
  return room(ro, rd);
}

vec3 render(vec3 ro, vec3 rd){
  vec3 c = vec3(0.0, HC + uLift, 0.0); vec3 oc = ro - c; float b = dot(oc, rd); float h = b * b - dot(oc, oc) + 2.1;
  if (h < 0.0) return room(ro, rd);
  h = sqrt(h); float t = max(0.0, -b - h); float tEnd = -b + h;
  vec2 hit = vec2(0.0);
  for (int i = 0; i < 110; i++) {
    vec2 m = objMap(toLocal(ro + rd * t));
    if (m.x < 0.0006 * (1.0 + t * 0.1)) { hit = vec2(t, m.y); break; }
    t += m.x; if (t > tEnd) break;
  }
  if (hit.y < 0.5) return room(ro, rd);
  vec3 p = ro + rd * hit.x; vec3 q = toLocal(p);
  if (hit.y < 2.5) return wood(p, q, dirWorld(nFrame(q)), rd, hit.y);

  // the glass: reflect the room, bend in through the wall, look for sand, bend out the far side
  vec3 n = dirWorld(nGlass(q));
  float ci = clamp(dot(-rd, n), 0.0, 1.0);
  float F = 0.04 + 0.96 * pow(1.0 - ci, 5.0);
  vec3 rf = reflect(rd, n);
  vec3 col = F * (env(rf) + strips(rf));
  vec3 hv = normalize(SUN - rd);
  col += SUNC * 4.0 * pow(max(dot(n, hv), 0.0), 2600.0) * sunMask(p);
  vec3 T = vec3(1.0 - F) * vec3(0.985, 0.995, 0.99);
  vec3 d = refract(rd, n, 1.0 / NG);
  vec3 pp = p + d * (0.026 / max(dot(-n, d), 0.35));
  T *= exp(-vec3(1.1, 0.55, 0.8) * 0.06 / max(ci, 0.06)); // the green of thick glass seen edge on
  d = refract(d, n, NG * 0.97);
  if (dot(d, d) < 0.5) d = reflect(rd, n);
  // inside: march the sand, or until the ray reaches the far wall
  float s = 0.002; bool inside = false;
  for (int i = 0; i < 110; i++) {
    vec3 x = pp + d * s; vec3 xq = toLocal(x);
    float ds = sandD(xq); float dw = -(length(xq.xz) - (prof(xq.y) - 0.026)) * 0.6;
    dw = min(dw, 1.07 - abs(xq.y));
    // the far side of a sloping wall can still be under the entry point: walk on until clear of the glass
    if (!inside) { if (dw > 0.002) inside = true; else { s += 0.006; continue; } }
    if (ds < 0.0007) {
      vec3 nL = nSand(xq);
      return col + T * sandShade(xq, nL, dirLocal(d), x);
    }
    if (dw < 0.0007) { pp = x; break; }
    s += max(min(ds, dw), 0.0015);
    if (s > 3.0) break;
  }
  // out through the far wall
  vec3 qx = toLocal(pp); vec3 n2w = dirWorld(nGlass(qx));
  float c2 = clamp(dot(d, n2w), 0.0, 1.0);
  float F2 = 0.04 + 0.96 * pow(1.0 - c2, 5.0);
  col += T * F2 * 0.45 * env(reflect(d, -n2w));
  T *= (1.0 - F2) * exp(-vec3(1.1, 0.55, 0.8) * 0.06 / max(c2, 0.06));
  vec3 d2 = refract(d, -n2w, 1.0 / NG);
  if (dot(d2, d2) < 0.5) d2 = d;
  d2 = refract(d2, -n2w, NG * 0.98); if (dot(d2, d2) < 0.5) d2 = d;
  return col + T * behind(pp + n2w * 0.04, normalize(d2));
}

void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * uJit.z + up * uJit.w; rd = normalize(fp - ro);
  vec3 col = min(render(ro, rd), vec3(30.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the frame: a little bloom off the sun glints, filmic curve, warm vignette, grain.
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
  c = max(c + (c - nb * 0.25) * 0.25, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 16.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.012 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 3.0, 0.0), vec3(8.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.035;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= mix(vec3(1.0), vec3(0.78, 0.7, 0.62), smoothstep(0.45, 1.25, length(q)));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.022;
  outC = vec4(c, 1.0);
}
`;

// No WebGL, or reduced motion before the first frame: the same desk as a still made of gradients.
function Still({ pct }: { pct: number }) {
  const p = pct / 100;
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(180deg, #e9ddc9 0%, #e3d3bb 58%, #b98a5c 58.2%, #c99b6b 100%)" }}>
      <div className="absolute left-0 top-0 h-[58%] w-full" style={{ background: "repeating-linear-gradient(115deg, rgba(255,240,214,0) 0 90px, rgba(255,244,222,0.55) 90px 260px, rgba(255,240,214,0) 260px 300px)" }} />
      <div className="absolute left-1/2 top-[48%] h-[400px] w-[230px] -translate-x-1/2 -translate-y-1/2 sm:h-[470px] sm:w-[270px] lg:left-[68%]">
        <div className="absolute -bottom-[14px] left-[40%] h-[40px] w-[150%] rounded-[50%] bg-[#6b4526]/35 blur-xl" />
        {[0, 1].map((i) => (
          <div key={i} className={`absolute left-0 h-[7%] w-full rounded-[10px] ${i ? "bottom-0" : "top-0"}`} style={{ background: "linear-gradient(180deg,#d9a467,#a8703c 55%,#7a4c25)", boxShadow: "0 3px 6px rgba(80,45,20,0.35)" }} />
        ))}
        {[8, 46, 84].map((x) => (
          <div key={x} className="absolute top-[7%] h-[86%] w-[5%] rounded-full" style={{ left: `${x}%`, background: "linear-gradient(90deg,#7a4c25,#d9a467 45%,#9a6533)" }} />
        ))}
        <div className="absolute left-[16%] top-[7%] h-[43%] w-[68%] overflow-hidden" style={{ clipPath: "ellipse(50% 62% at 50% 34%)", background: "rgba(255,255,255,0.18)" }}>
          <div className="absolute inset-x-0 bottom-0" style={{ height: `${(1 - p) * 82}%`, background: "linear-gradient(180deg,#f07a52,#d4512f)" }} />
        </div>
        <div className="absolute bottom-[7%] left-[16%] h-[43%] w-[68%] overflow-hidden" style={{ clipPath: "ellipse(50% 62% at 50% 66%)", background: "rgba(255,255,255,0.18)" }}>
          <div className="absolute inset-x-0 bottom-0" style={{ height: `${p * 70}%`, background: "linear-gradient(180deg,#f07a52,#c94a2a)", clipPath: "polygon(0 35%, 50% 0, 100% 35%, 100% 100%, 0 100%)" }} />
        </div>
      </div>
    </div>
  );
}

export default function HourglassSandLoader() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pct, setPct] = useState(START);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const api = useRef<{ turn: () => void } | null>(null);

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
      scene = link(SCENE); post = canAcc ? link(POST) : null;
    }
    const live = !!gl && !!scene && (!canAcc || !!post);
    if (!live) setShown("still");

    const su: Record<string, WebGLUniformLocation | null> = {}, pu: Record<string, WebGLUniformLocation | null> = {};
    let acc: WebGLTexture | null = null, fbo: WebGLFramebuffer | null = null;
    if (live && gl && scene) {
      for (const n of ["uRes", "uJit", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uAng", "uLift", "uTop", "uCrat", "uBase", "uPeak", "uHi", "uFlip", "uFlow", "uTime", "uDirect", "uSand"]) su[n] = gl.getUniformLocation(scene, n);
      if (post) for (const n of ["uAcc", "uRes", "uGrain", "uCentre"]) pu[n] = gl.getUniformLocation(post, n);
      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      if (canAcc) { acc = gl.createTexture(); fbo = gl.createFramebuffer(); }
    }

    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const h0 = heights(START / 100);
    const s = {
      goal: START, seg: 0, segT: 0, from: START, running: !reduce,
      p: START / 100, flow: reduce ? 0 : 1,
      // the turn: phase 0 pouring, 1 holding full, 2 turning, 3 slumping into the neck
      phase: 0, hold: 0, ang: 0, angV: 0, lift: 0, liftV: 0, slump: 1, flip: [0, 0], aim: 0, turnT: 0,
      top: h0.top, sx: 0, sy: 0, px: 0, py: 0,
      count: 0, fresh: true, frame: 0, slow: 0, fps: 0, fpsN: 0, fpsT: 0,
      visible: true, raf: 0, last: 0, t: 0, pct: START, first: true,
    };
    (box as HTMLDivElement & { __fps?: () => number }).__fps = () => s.fps;
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      if (!live || !gl) return;
      const dpr = Math.min(software ? 0.55 : 1.25, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.0e6 / (cssW * cssH * dpr * dpr)));
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

    // A longish lens a little above the desk, the hourglass to the right with the figures beside it.
    const camera = () => {
      const aspect = cssW / cssH, wide = cssW >= 1024, roomy = cssW >= 640;
      const el = 0.2 - s.sy * 0.04, az = -0.16 + s.sx * 0.08, dist = 10.5;
      const tgt = [0, 1.22, 0];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] - dist * Math.cos(az) * Math.cos(el)];
      const foc = wide ? 2.95 : roomy ? 2.7 : Math.min(2.4, 1.75 + aspect * 0.9);
      const shift = wide ? [0.19 * aspect, -0.01] : roomy ? [0.2 * aspect, 0.04] : [0.0, 0.13];
      return { aspect, wide, cam, tgt, foc, shift };
    };

    const draw = (alpha: number, sample: number) => {
      if (!live || !gl || !scene) return;
      const c = camera();
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.06 : 0;
      const hh = heights(s.p);
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]); gl.uniform3f(su.uTgt, c.tgt[0], c.tgt[1], c.tgt[2]);
      gl.uniform1f(su.uFoc, c.foc); gl.uniform2f(su.uShift, c.shift[0], c.shift[1]);
      gl.uniform1f(su.uFocus, Math.hypot(c.cam[0], c.cam[1] - 1.2, c.cam[2]) - 0.3);
      gl.uniform1f(su.uAng, s.ang); gl.uniform1f(su.uLift, s.lift);
      // while the glass turns and slumps the upper bulb is described by the old cone, not the pour
      const slumping = s.phase === 3;
      gl.uniform1f(su.uTop, hh.top);
      gl.uniform1f(su.uHi, slumping ? 1.06 + (TOPF - 1.06) * s.slump : hh.top);
      gl.uniform1f(su.uCrat, slumping ? 0 : hh.crater);
      gl.uniform1f(su.uBase, hh.base); gl.uniform1f(su.uPeak, hh.peak);
      gl.uniform3f(su.uFlip, s.flip[0], s.flip[1], slumping ? s.slump : 1);
      gl.uniform1f(su.uFlow, s.flow); gl.uniform1f(su.uTime, s.t);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform3f(su.uSand, SAND[0], SAND[1], SAND[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, acc);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, reduce ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, 0.5 + c.shift[0] * (H / W), 0.5 + c.shift[1]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    // turn it over by hand: the button, or the demo reaching one hundred
    const startTurn = () => {
      if (s.phase === 2 || s.phase === 3) return;
      s.phase = 2; s.turnT = 0; s.angV = 0; s.aim = -0.14; s.flow = 0;
      wake();
    };
    const turn = () => {
      if (reduce) {
        // no motion: step the number on and redraw once
        s.goal = s.goal >= 100 ? 0 : Math.min(100, Math.round(s.goal / 20) * 20 + 20);
        s.p = s.goal / 100; s.count = 0; s.fresh = true; wake();
        return;
      }
      if (s.phase === 0 || s.phase === 1) { s.p = Math.max(s.p, 0.0); s.goal = 100; s.seg = 5; s.segT = 0; s.from = 100; startTurn(); }
    };
    api.current = { turn };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++; s.t += dt;
      s.fpsN++; s.fpsT += dtRaw; if (s.fpsT > 1) { s.fps = s.fpsN / s.fpsT; s.fpsN = 0; s.fpsT = 0; }

      // ---- the demo: walk the script. Replace this block with your own `s.goal = percent`.
      if (s.running && s.phase === 0) {
        s.segT += dt;
        let [to, secs] = demo[s.seg];
        while (s.segT >= secs && s.seg !== 5) {
          s.segT -= secs; s.from = to; s.seg = (s.seg + 1) % demo.length;
          [to, secs] = demo[s.seg];
        }
        const k = Math.min(1, s.segT / secs), e = k * k * (3 - 2 * k);
        s.goal = s.from + (to - s.from) * e;
      }

      let moving = false;
      if (!reduce) {
        moving = true;
        // sand runs at its own pace: it follows the number with a lag, never faster than the neck allows
        const before = s.p;
        if (s.phase === 0) {
          const want = s.goal / 100;
          s.p += Math.max(-0.5 * dt, Math.min(0.32 * dt, (want - s.p) * (1 - Math.exp(-dt * 3.2))));
          const rate = Math.abs(s.p - before) / Math.max(dt, 1e-3);
          s.flow += ((s.p < 0.997 ? 0.45 + 0.55 * Math.min(1, rate * 9) : 0) - s.flow) * (1 - Math.exp(-dt * 6));
          if (s.goal >= 100 && s.p > 0.996) { s.phase = 1; s.hold = 0; s.p = 1; }
        } else if (s.phase === 1) {
          s.flow *= Math.exp(-dt * 8);
          s.hold += dt;
          if (s.hold > 0.7) startTurn();
        } else if (s.phase === 2) {
          // a short tip back to take the weight, then over: a heavy spring that runs a touch past and settles
          s.turnT += dt;
          if (s.turnT > 0.22) s.aim = Math.PI;
          const K = s.aim < 0 ? 90 : 34, D = s.aim < 0 ? 16 : 7.4;
          s.angV += (K * (s.aim - s.ang) - D * s.angV) * dt; s.ang += s.angV * dt;
          const up = Math.max(0, Math.sin(Math.min(1, Math.max(0, s.ang / Math.PI)) * Math.PI));
          s.liftV += (260 * (0.3 * up - s.lift) - 20 * s.liftV) * dt; s.lift += s.liftV * dt;
          if (s.lift < 0) { s.lift = 0; s.liftV = Math.abs(s.liftV) * 0.22; }
          if (s.aim > 0 && Math.abs(Math.PI - s.ang) < 0.004 && Math.abs(s.angV) < 0.05 && s.lift < 0.003) {
            // turned: the full lower bulb is now on top, still in the shape of its cone; let it slump
            const full = heights(1);
            s.ang = 0; s.angV = 0; s.lift = 0; s.liftV = 0;
            s.flip = [-full.base, -full.peak]; s.slump = 0; s.phase = 3;
            s.p = 0; s.goal = 0; s.seg = RESTART; s.segT = 0; s.from = 0;
          }
        } else if (s.phase === 3) {
          s.slump = Math.min(1, s.slump + dt * (0.6 + 2.6 * s.slump));
          s.flow += (0.8 * s.slump - s.flow) * (1 - Math.exp(-dt * 8));
          if (s.slump >= 1) { s.phase = 0; }
        }
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 2.5)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 2.5));
      } else {
        s.p = s.goal / 100; s.flow = 0;
      }

      const pctNow = s.phase >= 2 ? (s.phase === 2 ? 100 : 0) : Math.round(Math.min(100, s.phase === 1 ? 100 : s.p * 100 + 0.0001));
      if (pctNow !== s.pct) { s.pct = pctNow; setPct(pctNow); }

      if (live) {
        if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
        else if (moving) draw(0.42, 1 + (s.frame % 32));
        else if (s.count < 40) { s.count++; draw(1 / s.count, s.count); }
        if (s.first) { s.first = false; setShown("gl"); }
        if (!reduce && !software && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
        if (s.slow > 40 && scale > 0.45) { scale *= 0.82; s.slow = 0; size(); }
      }
      if (moving || (live && s.count < 40)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    // the pointer moves the camera a little round the desk
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      wake();
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

  const at = Math.max(0, stages.findIndex((st) => pct <= st.until));

  return (
    <section className="relative isolate overflow-hidden bg-[#e6d8c2] text-[#2b1c12]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes ray-marched-hourglass-loader-rise { from { opacity: 0; transform: translateY(0.4em); filter: blur(4px); } to { opacity: 1; transform: none; filter: blur(0); } }
        .ray-marched-hourglass-loader-note { animation: ray-marched-hourglass-loader-rise 560ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .ray-marched-hourglass-loader-note { animation: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[720px] w-full max-w-[1600px] lg:h-[760px]" style={{ background: "linear-gradient(180deg, #ece0cc 0%, #e4d4bb 56%, #c09468 56%, #b98a5c 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        {shown === "still" && <Still pct={pct} />}

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-6 pb-7 pt-7 sm:px-10 lg:px-16 lg:pb-14 lg:pt-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#2b1c12]/65">Marlow Ashby Studio <span className="mx-2 text-[#2b1c12]/30">/</span> exporting the portfolio</p>
          <div className="max-w-[560px]">
            <div
              role="progressbar"
              aria-label="Exporting the portfolio"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-valuetext={`${pct} percent. ${stages[at].note}`}
              className="flex items-start font-semibold leading-[0.8] tracking-[-0.065em] text-[#2b1c12]"
              style={{ fontVariantNumeric: "tabular-nums", fontSize: "clamp(112px, 17vw, 248px)" }}
            >
              <span>{pct}</span>
              <span className="ml-[0.06em] mt-[0.04em] text-[0.34em] tracking-normal text-[#c4502f]">%</span>
            </div>
            <div className="mt-5 flex items-baseline gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-[#2b1c12]/60 lg:mt-7">
              <span className="tabular-nums text-[#b8472a]">{String(at + 1).padStart(2, "0")}</span>
              <span className="h-px w-8 self-center bg-[#2b1c12]/25" />
              <span className="tabular-nums">{String(stages.length).padStart(2, "0")}</span>
            </div>
            <p aria-live="polite" className="mt-2 h-[1.3em] text-[22px] italic leading-snug text-[#2b1c12] lg:text-[28px]" style={{ fontFamily: SERIF }}>
              <span key={at} className="ray-marched-hourglass-loader-note block">{stages[at].note}</span>
            </p>
            <button
              type="button"
              onClick={() => api.current?.turn()}
              className="pointer-events-auto mt-6 inline-flex h-11 items-center gap-2.5 rounded-full bg-[#2b1c12] pl-4 pr-5 text-[13px] font-medium tracking-[-0.01em] text-[#f6ecdc] shadow-[0_8px_20px_-8px_rgba(60,30,10,0.6)] outline-none transition-colors duration-200 hover:bg-[#45301f] focus-visible:ring-2 focus-visible:ring-[#c4502f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e6d8c2] lg:mt-8"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h8M6 17h8M7 3c0 4 6 4 6 7s-6 3-6 7M13 3c0 4-6 4-6 7s6 3 6 7" /></svg>
              Turn the glass over
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
