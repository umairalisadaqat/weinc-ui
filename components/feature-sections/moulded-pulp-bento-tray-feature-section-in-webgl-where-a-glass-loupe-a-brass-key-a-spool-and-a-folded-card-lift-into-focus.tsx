import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** The product, and one feature per compartment of the tray (in the order the compartments are cut). */
const product = { name: "Oddment", line: "A shared notebook for small studios" };
const features = [
  { name: "Find it at a glance", line: "Search reads inside every file, scan and screenshot, so the thing you half remember comes up first.", object: "Glass loupe" },
  { name: "Private until you say", line: "Every page starts locked. Hand a key to one person, a team or the open web, and take it back whenever you like.", object: "Brass key" },
  { name: "Threads that hold", line: "Replies stay tied to the sentence they are about, even after the page around them has been rewritten twice.", object: "Cotton spool" },
  { name: "Fold a note into a page", line: "Any note becomes a tidy public page with its own address, and it changes when the note does.", object: "Folded card" },
];

const LIFT_SPRING = 150; // pull on an object toward its lifted or resting height
const LIFT_DAMPING = 12.5; // lower lets it overshoot further before it settles
const DEMO = true; // walks through the compartments by itself until somebody touches the section
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

// compartments of the tray in metres: centre x, centre z, half width, half depth
const CELLS = [
  [-0.83, 0.0, 0.75, 0.98],
  [0.81, -0.52, 0.77, 0.46],
  [0.395, 0.52, 0.355, 0.46],
  [1.225, 0.52, 0.355, 0.46],
];
// where each object rests (its middle), so the lens can focus on it
const RESTS = [
  [-0.83, -0.03, -0.18],
  [0.81, -0.09, -0.52],
  [0.395, 0.07, 0.52],
  [1.225, 0.02, 0.52],
];
const v3 = (a: number[]) => `vec3(${a.map((x) => x.toFixed(4)).join(", ")})`;
const v4 = (a: number[]) => `vec4(${a.map((x) => x.toFixed(4)).join(", ")})`;
const norm = (a: number[]) => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return a.map((x) => x / l);
};
// daylight from a tall window behind and to the left of the tray
const SUN = norm([-0.52, 0.74, -0.42]);
const FILL = norm([0.75, 0.42, 0.52]);

const GLSL = `#version 300 es
precision highp float;
uniform vec3 uCam, uRt, uUp, uFw;
uniform float uTan, uAspect, uFocus, uAperture, uTime;
uniform vec2 uShift, uRes;
uniform vec4 uLift;
in vec2 vUv;
out vec4 o;

const vec3 L = ${v3(SUN)};
const vec3 FD = ${v3(FILL)};
const vec3 KEY = vec3(1.0, 0.93, 0.83) * 3.3;
const vec3 SKY = vec3(0.88, 0.87, 0.87) * 1.12;
const float FL = -0.12;
const float TB = -0.18;
const vec4 CA = ${v4(CELLS[0])};
const vec4 CB = ${v4(CELLS[1])};
const vec4 CC = ${v4(CELLS[2])};
const vec4 CD = ${v4(CELLS[3])};

float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.1 + 7.3) + 0.125 * vnoise(p * 4.3 + 1.7) + 0.0625 * vnoise(p * 8.9); }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }

float sdRB(vec3 p, vec3 b, float r) { vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdR2(vec2 p, vec2 b) { vec2 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
float smax(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0); return mix(b, a, h) + k * h * (1.0 - h); }
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
// a solid cylinder: radial distance and height measured from its middle
float sdCyl(float rr, float y, float r, float h) { vec2 w = vec2(rr - r, abs(y) - h); return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)); }

// ---------- the tray: one moulded slab with four drafted pockets ----------
float pocket(vec3 p, vec4 c) {
  vec3 q = p - vec3(c.x, 0.0, c.y);
  float dy = clamp(-q.y, 0.0, 0.12);
  vec2 h = c.zw - dy * 0.22;
  return sdRB(q - vec3(0.0, 0.09, 0.0), vec3(h.x, 0.21, h.y), 0.1);
}
float sdTray(vec3 p) {
  float d = sdRB(p - vec3(0.0, -0.09, 0.0), vec3(1.72, 0.09, 1.12), 0.07);
  float k = min(min(pocket(p, CA), pocket(p, CB)), min(pocket(p, CC), pocket(p, CD)));
  return smax(d, -k, 0.035);
}

// ---------- the objects, each in its own frame so it can lift and turn ----------
vec3 lensP(vec3 p) {
  float l = uLift.x;
  vec3 q = p - vec3(CA.x - 0.02, FL + 0.072 + l * 0.25, CA.y - 0.2);
  q.yz = rot(-l * 0.42) * q.yz;
  q.xz = rot(-1.2) * q.xz;
  q.xy = rot(-l * 0.08) * q.xy;
  return q;
}
vec3 lensD(vec3 d) {
  float l = uLift.x;
  d.yz = rot(-l * 0.42) * d.yz;
  d.xz = rot(-1.2) * d.xz;
  d.xy = rot(-l * 0.08) * d.xy;
  return d;
}
vec3 lensDinv(vec3 d) {
  float l = uLift.x;
  d.xy = rot(l * 0.08) * d.xy;
  d.xz = rot(1.2) * d.xz;
  d.yz = rot(l * 0.42) * d.yz;
  return d;
}
// leaving the glass from inside: the nearest of its two spherical faces and its ground edge, found exactly
float exitGlass(vec3 o, vec3 d, out vec3 nl) {
  const float R = 1.5, th = 0.058;
  float best = 1e9;
  for (int k = 0; k < 2; k++) {
    vec3 c = vec3(0.0, k == 0 ? -(R - th) : (R - th), 0.0);
    vec3 oc = o - c;
    float b = dot(oc, d), cc = dot(oc, oc) - R * R;
    float t = -b + sqrt(max(b * b - cc, 0.0));
    if (t < best) { best = t; nl = normalize(oc + d * t); }
  }
  float a = dot(d.xz, d.xz), b = dot(o.xz, d.xz), cc = dot(o.xz, o.xz) - 0.16;
  if (a > 1e-6) {
    float t = (-b + sqrt(max(b * b - a * cc, 0.0))) / a;
    if (t < best) { best = t; vec3 e = o + d * t; nl = normalize(vec3(e.x, 0.0, e.z)); }
  }
  return best;
}
float sdGlass(vec3 q) {
  const float R = 1.5, th = 0.058;
  float a = length(q + vec3(0.0, R - th, 0.0)) - R;
  float b = length(q - vec3(0.0, R - th, 0.0)) - R;
  return max(max(a, b), length(q.xz) - 0.4);
}
float sdRim(vec3 q) { return sdR2(vec2(length(q.xz) - 0.425, q.y), vec2(0.026, 0.036)) - 0.012; }
float sdHandle(vec3 q) {
  // a brass ferrule and a turned walnut handle running out from the rim
  float x = q.x - 0.44;
  float rr = length(q.yz);
  float fer = sdCyl(rr, x - 0.05, 0.026, 0.05) - 0.008;
  float r = 0.026 + 0.012 * sin(clamp((x - 0.1) / 0.44, 0.0, 1.0) * 2.8);
  float wood = sdCyl(rr, x - 0.33, r, 0.21) - 0.012;
  return min(fer, wood) * 0.85;
}
float handleId(vec3 q) { return q.x - 0.46 < 0.1 ? 3.0 : 8.0; }

vec3 keyP(vec3 p) {
  float l = uLift.y;
  vec3 q = p - vec3(CB.x + 0.03, FL + 0.03 + l * 0.38, CB.y - 0.02);
  q.xz = rot(0.1 - l * 0.22) * q.xz;
  q.yz = rot(-l * 0.62) * q.yz;
  q.xy = rot(l * 0.16) * q.xy;
  return q;
}
float sdKey(vec3 q) {
  vec3 b = q - vec3(-0.43, 0.0, 0.0);
  float d = sdR2(vec2(length(b.xz) - 0.15, b.y), vec2(0.026, 0.011)) - 0.012;
  // a trefoil of small lobes inside the bow
  float a = atan(b.z, b.x);
  float lobe = sdR2(vec2(length(b.xz) - 0.075 - 0.02 * cos(a * 3.0), b.y), vec2(0.008, 0.008)) - 0.008;
  d = min(d, lobe);
  d = min(d, length(q - vec3(clamp(q.x, -0.3, 0.5), 0.0, 0.0)) - 0.027);
  float rr = length(q.yz);
  d = min(d, sdCyl(rr, q.x + 0.27, 0.03, 0.016) - 0.009);
  d = min(d, sdCyl(rr, q.x + 0.2, 0.022, 0.01) - 0.008);
  float bit = sdRB(q - vec3(0.4, 0.0, 0.07), vec3(0.095, 0.012, 0.07), 0.006);
  float n1 = sdRB(q - vec3(0.355, 0.0, 0.125), vec3(0.017, 0.05, 0.04), 0.003);
  float n2 = sdRB(q - vec3(0.445, 0.0, 0.145), vec3(0.015, 0.05, 0.04), 0.003);
  d = min(d, max(bit, -min(n1, n2)));
  d = min(d, length(q - vec3(0.5, 0.0, 0.0)) - 0.031);
  return d;
}

vec3 spoolP(vec3 p) {
  float l = uLift.z;
  vec3 q = p - vec3(CC.x, FL + l * 0.3, CC.y);
  q.xy = rot(l * 0.16) * q.xy;
  q.yz = rot(-l * 0.1) * q.yz;
  q.xz = rot(l * 2.4 + 0.6) * q.xz;
  return q;
}
float sdFlange(vec3 q, float y) { return sdCyl(length(q.xz), q.y - y, 0.2, 0.016) - 0.012; }
float sdSpoolWood(vec3 q) {
  float d = min(sdFlange(q, 0.028), sdFlange(q, 0.352));
  d = max(d, -(length(q.xz) - 0.042));
  // a nick in the top rim, where the end of the thread is caught
  d = max(d, -sdRB(q - vec3(0.215, 0.352, 0.0), vec3(0.03, 0.05, 0.008), 0.004));
  return d;
}
float sdThread(vec3 q) {
  float r = 0.168 + 0.004 * sin(q.y * 34.0);
  return sdCyl(length(q.xz), q.y - 0.19, r, 0.14) - 0.004;
}

vec3 cardP(vec3 p) {
  float l = uLift.w;
  vec3 q = p - vec3(CD.x, FL + l * 0.3, CD.y - 0.02);
  q.xz = rot(-0.32 + l * 0.3) * q.xz;
  q.yz = rot(l * 0.22) * q.yz;
  return q;
}
float cardTh() { return 0.62 + uLift.w * 0.12; }
float sdCard(vec3 q) {
  float th = cardTh(), len = 0.36;
  vec3 v = q - vec3(0.0, len * cos(th), 0.0);
  v.z = abs(v.z);
  float along = dot(v.yz, vec2(-cos(th), sin(th)));
  float across = dot(v.yz, vec2(sin(th), cos(th)));
  return sdRB(vec3(v.x, along - len * 0.5, across), vec3(0.25, len * 0.5, 0.004), 0.003);
}

// a printed slip lying on the floor of the big pocket, under the loupe
vec3 slipP(vec3 p) { vec3 q = p - vec3(CA.x + 0.02, FL + 0.004, CA.y - 0.12); q.xz = rot(0.12) * q.xz; return q; }
float sdSlip(vec3 q) { return sdRB(q, vec3(0.46, 0.003, 0.62), 0.002); }

// id: 1 tray, 2 glass, 3 brass, 5 beech, 6 thread, 7 card, 8 walnut, 9 slip
vec2 map(vec3 p, bool glass) {
  vec2 r = vec2(sdTray(p), 1.0);
  float sl = sdSlip(slipP(p)); if (sl < r.x) r = vec2(sl, 9.0);
  vec3 q = lensP(p);
  if (length(q - vec3(0.35, 0.0, 0.0)) - 0.85 < r.x) {
    if (glass) { float g = sdGlass(q); if (g < r.x) r = vec2(g, 2.0); }
    float m = sdRim(q); if (m < r.x) r = vec2(m, 3.0);
    float h = sdHandle(q); if (h < r.x) r = vec2(h, handleId(q));
  }
  q = keyP(p);
  if (length(q) - 0.68 < r.x) { float k = sdKey(q); if (k < r.x) r = vec2(k, 3.0); }
  q = spoolP(p);
  if (length(q - vec3(0.0, 0.19, 0.0)) - 0.32 < r.x) {
    float w = sdSpoolWood(q); if (w < r.x) r = vec2(w, 5.0);
    float t = sdThread(q); if (t < r.x) r = vec2(t, 6.0);
  }
  q = cardP(p);
  if (length(q - vec3(0.0, 0.17, 0.0)) - 0.42 < r.x) { float c = sdCard(q); if (c < r.x) r = vec2(c, 7.0); }
  return r;
}

vec3 normalAt(vec3 p, bool g) {
  const vec2 e = vec2(1.0, -1.0) * 0.0007;
  return normalize(e.xyy * map(p + e.xyy, g).x + e.yyx * map(p + e.yyx, g).x + e.yxy * map(p + e.yxy, g).x + e.xxx * map(p + e.xxx, g).x);
}
float march(vec3 ro, vec3 rd, float t, float tEnd, bool g, int n, out float id) {
  id = -1.0;
  for (int i = 0; i < 140; i++) {
    if (i >= n) break;
    vec2 h = map(ro + rd * t, g);
    if (h.x < 0.00035 * t) { id = h.y; return t; }
    t += h.x * 0.92;
    if (t > tEnd) break;
  }
  return tEnd;
}
vec2 boxI(vec3 ro, vec3 rd, vec3 c, vec3 h) {
  vec3 m = 1.0 / rd, n = m * (ro - c), k = abs(m) * h;
  vec3 t1 = -n - k, t2 = -n + k;
  return vec2(max(max(t1.x, t1.y), t1.z), min(min(t2.x, t2.y), t2.z));
}

// the window: tall panes with glazing bars, whose shadow lies across the table
float window_(vec3 p) {
  vec3 a = normalize(cross(L, vec3(0.0, 1.0, 0.0))), b = cross(a, L);
  vec2 u = vec2(dot(p, a), dot(p, b));
  // one upright and one transom, far from the table, so their shadows are wide and soft
  float bx = abs(u.x - 0.9);
  float by = abs(u.y + 1.15);
  float frame = smoothstep(2.3, 2.6, abs(u.x - 0.3)) + smoothstep(2.4, 2.8, abs(u.y + 0.2));
  return clamp((0.25 + 0.75 * smoothstep(0.02, 0.14, bx)) * (0.25 + 0.75 * smoothstep(0.02, 0.14, by)) - frame, 0.08, 1.0);
}
float shadow(vec3 ro, vec3 rd) {
  float res = 1.0, t = 0.012;
  for (int i = 0; i < 40; i++) {
    float h = map(ro + rd * t, false).x;
    res = min(res, 7.0 * h / t);
    t += clamp(h, 0.01, 0.16);
    if (res < 0.002 || t > 2.8) break;
  }
  return clamp(res, 0.0, 1.0);
}
// sun through the loupe: the glass bends what falls on it into a smaller, brighter disc
float caustic(vec3 p) {
  vec3 q = lensP(p), d = lensD(L);
  if (d.y < 0.05) return 1.0;
  float t = -q.y / d.y;
  if (t <= 0.0) return 1.0;
  float r = length((q + d * t).xz);
  float f = 2.4;
  float k = max(1.0 - t / f, 0.15);
  float rs = r / k;
  float lit = smoothstep(0.405, 0.38, rs);
  float rimShade = smoothstep(0.37, 0.4, r) * smoothstep(0.5, 0.46, r);
  float bright = min(0.78 / (k * k), 1.32) * (1.0 + 0.3 * smoothstep(0.4, 0.33, rs) * smoothstep(0.2, 0.36, rs));
  float inside = step(r, 0.46);
  return mix(1.0, mix(0.06, bright, lit) * (1.0 - 0.85 * rimShade * (1.0 - lit)), inside);
}
float ao(vec3 p, vec3 n) {
  float o = 0.0, s = 1.0;
  for (int i = 1; i <= 5; i++) {
    float h = 0.012 + 0.045 * float(i);
    o += (h - map(p + n * h, false).x) * s;
    s *= 0.72;
  }
  return clamp(1.0 - 2.4 * o, 0.0, 1.0);
}

vec3 env(vec3 d) {
  vec3 c = mix(vec3(0.6, 0.56, 0.5), vec3(0.97, 0.97, 0.98), smoothstep(-0.35, 0.55, d.y));
  // the side of the room behind the camera is in shade: warm and dim, which gives polished metal its contrast
  c *= mix(1.0, 0.32, smoothstep(-0.1, 0.7, d.z) * smoothstep(0.95, 0.4, d.y));
  c = mix(c, c * vec3(1.0, 0.86, 0.7), smoothstep(-0.1, 0.7, d.z) * 0.5);
  vec3 a = normalize(cross(L, vec3(0.0, 1.0, 0.0))), b = cross(a, L);
  float k = dot(d, L);
  if (k > 0.0) {
    vec2 u = vec2(dot(d, a), dot(d, b)) / k;
    float pane = smoothstep(0.02, 0.0, sdR2(u, vec2(0.32, 0.5)));
    float bars = smoothstep(0.012, 0.02, abs(u.x)) * smoothstep(0.012, 0.02, abs(u.y - 0.1));
    c += vec3(1.0, 0.96, 0.9) * 9.0 * pane * bars;
  }
  float kf = dot(d, FD);
  if (kf > 0.0) {
    vec3 a2 = normalize(cross(FD, vec3(0.0, 1.0, 0.0))), b2 = cross(a2, FD);
    vec2 u2 = vec2(dot(d, a2), dot(d, b2)) / kf;
    c += vec3(1.0, 0.98, 0.95) * 2.4 * smoothstep(0.08, 0.0, sdR2(u2, vec2(0.5, 0.36)));
  }
  return c;
}

float tableTex(vec2 x) {
  // a pale linen cloth: fine weave and a slow mottle
  float w = 0.5 + 0.5 * sin(x.x * 900.0) * sin(x.y * 900.0);
  return 0.94 + 0.05 * fbm(x * 1.4) + 0.025 * w + 0.03 * (vnoise(x * vec2(9.0, 160.0)) - 0.5);
}

struct M { vec3 alb; float rough; float metal; vec3 n; float sss; };
M material(vec3 p, vec3 n, float id) {
  M m; m.n = n; m.metal = 0.0; m.sss = 0.0; m.rough = 0.6;
  if (id < 0.5) {
    m.alb = vec3(0.8, 0.74, 0.66) * tableTex(p.xz);
    m.rough = 0.8;
  } else if (id < 1.5) {
    // pressed pulp: a pale grey-green, fibres and a few darker flecks, a soft dimpled skin
    // (sampled on a plane that turns with the walls, so the texture never smears down a vertical face)
    vec2 w = p.xz + vec2(p.y, -p.y) * 1.3;
    float f = fbm(w * 26.0);
    float dens = fbm(w * 5.0 + 11.0);
    m.alb = mix(vec3(0.69, 0.72, 0.66), vec3(0.79, 0.81, 0.76), f) * (0.94 + 0.08 * dens);
    float fleck = smoothstep(0.82, 0.9, vnoise(w * vec2(170.0, 60.0))) * 0.5 + smoothstep(0.93, 0.97, vnoise(w.yx * 230.0));
    m.alb *= 1.0 - 0.13 * fleck;
    vec2 g = vec2(vnoise(w * 90.0), vnoise(w.yx * 90.0 + 3.0)) - 0.5;
    vec2 g2 = vec2(vnoise(w * 26.0), vnoise(w.yx * 26.0 + 5.0)) - 0.5;
    vec3 tg = vec3(g.x, 0.0, g.y) * 0.22 + vec3(g2.x, 0.0, g2.y) * 0.12;
    m.n = normalize(n + tg - n * dot(n, tg));
    m.rough = 0.9; m.sss = 0.45;
  } else if (id < 3.5) {
    // brass: worn bright where handled, a warmer patina in the hollows
    vec3 q = lensP(p);
    float pat = fbm(p.xz * 18.0 + p.y * 7.0);
    m.alb = mix(vec3(1.0, 0.78, 0.42), vec3(0.78, 0.55, 0.28), smoothstep(0.45, 0.8, pat));
    m.metal = 1.0; m.rough = 0.16 + 0.22 * pat;
    vec2 g = vec2(vnoise(p.xz * 110.0), vnoise(p.zx * 110.0 + 4.0)) - 0.5;
    m.n = normalize(n + vec3(g.x, 0.0, g.y) * 0.01);
  } else if (id < 5.5) {
    vec3 q = spoolP(p);
    float ring = sin(length(q.xz + vec2(0.4, 0.1)) * 140.0 + fbm(q.xz * 20.0) * 6.0);
    m.alb = mix(vec3(0.82, 0.64, 0.44), vec3(0.74, 0.55, 0.36), 0.5 + 0.5 * ring);
    m.rough = 0.42;
  } else if (id < 6.5) {
    vec3 q = spoolP(p);
    // wound cotton: fine turns that catch the light, a little unevenness in the winding
    float g = sin(q.y * 520.0 + atan(q.z, q.x) * 0.5);
    float lay = vnoise(vec2(atan(q.z, q.x) * 6.0, q.y * 30.0));
    m.alb = vec3(0.72, 0.19, 0.12) * (0.86 + 0.14 * g) * (0.9 + 0.2 * lay);
    m.n = normalize(n + vec3(0.0, g * 0.18, 0.0));
    m.rough = 0.75; m.sss = 0.6;
  } else if (id < 7.5) {
    // cotton card, printed on its front face
    vec3 q = cardP(p);
    float th = cardTh(), len = 0.36;
    vec3 v = q - vec3(0.0, len * cos(th), 0.0);
    float along = dot(vec2(v.y, abs(v.z)), vec2(-cos(th), sin(th)));
    float across = dot(vec2(v.y, abs(v.z)), vec2(sin(th), cos(th)));
    m.alb = vec3(0.95, 0.94, 0.91) * (0.97 + 0.04 * vnoise(q.xy * 220.0));
    m.alb *= 0.9 + 0.1 * smoothstep(0.0, 0.025, along);
    if (v.z > 0.0 && across > 0.0) {
      vec2 c = vec2(v.x, along);
      float band = step(abs(c.x + 0.04), 0.19) * step(abs(c.y - 0.12), 0.06);
      float lines = step(abs(c.x + 0.1), 0.13) * step(abs(c.y - 0.235), 0.035) * step(0.45, fract(c.y * 52.0));
      m.alb = mix(m.alb, vec3(0.13, 0.26, 0.74), band);
      m.alb = mix(m.alb, vec3(0.16, 0.15, 0.14), lines * 0.85);
    }
    m.rough = 0.7; m.sss = 0.5;
  } else if (id > 8.5) {
    // a page of an index, set in tiny type: one entry is marked in coral, the thing that was being looked for
    vec3 q = slipP(p);
    vec2 u = vec2(q.x, q.z);
    m.alb = vec3(0.965, 0.955, 0.93) * (0.975 + 0.035 * vnoise(u * 300.0));
    float lh = 0.046;
    float y = (u.y + 0.44) / lh;
    float row = floor(y), fy = abs(fract(y) - 0.5);
    float wx = (u.x + 0.36) / 0.72;
    float body = step(0.0, y) * step(y, 21.0) * step(0.0, wx);
    float band = smoothstep(0.2, 0.12, fy);
    float tw = wx * 8.0 + hash(vec2(row, 1.0)) * 4.0;
    float gap = smoothstep(0.0, 0.05, fract(tw)) * smoothstep(0.2, 0.15, fract(tw));
    float lineLen = smoothstep(0.01, -0.01, wx - (0.55 + 0.42 * hash(vec2(row, 7.0))));
    float tex = 0.7 + 0.3 * vnoise(vec2(u.x * 170.0, row * 5.0));
    float ink = body * band * (1.0 - gap) * lineLen * tex;
    if (row > 6.5 && row < 7.5) m.alb = mix(m.alb, vec3(0.98, 0.66, 0.52), body * smoothstep(0.42, 0.34, fy) * step(0.16, wx) * step(wx, 0.5));
    m.alb = mix(m.alb, vec3(0.28, 0.26, 0.24), ink * 0.85);
    // the heading: two bold words and a rule above the entries
    float hy = (u.y + 0.53) / 0.05;
    m.alb = mix(m.alb, vec3(0.13, 0.12, 0.11), smoothstep(0.33, 0.25, abs(hy)) * step(0.0, wx) * step(wx, 0.42) * smoothstep(0.03, 0.06, fract(wx * 3.2)));
    m.alb = mix(m.alb, vec3(0.3, 0.28, 0.26), step(abs(u.y + 0.475), 0.0025) * step(0.0, wx) * step(wx, 1.0));
    m.rough = 0.8; m.sss = 0.4;
  } else {
    vec3 q = lensP(p);
    m.alb = vec3(0.24, 0.13, 0.07) * (0.8 + 0.4 * vnoise(vec2(q.x * 60.0, atan(q.z, q.y) * 3.0)));
    m.rough = 0.22;
  }
  return m;
}

// light arriving at a surface point, before the material is applied
vec3 shade(vec3 p, vec3 n0, vec3 rd, float id, bool full) {
  M m = material(p, n0, id);
  vec3 n = m.n;
  float sh = full ? shadow(p + n0 * 0.006, L) : 1.0;
  sh *= window_(p) * caustic(p);
  float o = full ? ao(p, n0) : 1.0;
  if (id < 0.5) o *= 0.55 + 0.45 * smoothstep(0.0, 0.4, max(abs(p.x) - 1.72, abs(p.z) - 1.12));
  float nl = dot(n, L);
  float wrap = max((nl + m.sss * 0.6) / (1.0 + m.sss * 0.6), 0.0);
  vec3 sssTint = mix(vec3(1.0), m.alb * 1.3, m.sss * 0.5 * (1.0 - max(nl, 0.0)));
  vec3 bounce = vec3(0.92, 0.86, 0.76) * 0.35 * (0.5 - 0.5 * n.y);
  vec3 diff = KEY * wrap * sh * sssTint + SKY * (0.62 + 0.38 * n.y) * o + bounce * o + vec3(1.0, 0.97, 0.92) * 0.45 * max(dot(n, FD), 0.0) * o;
  vec3 R = reflect(rd, n);
  float F = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  float shin = 2.0 / (m.rough * m.rough * m.rough + 0.002);
  float spec = pow(max(dot(R, L), 0.0), shin) * (shin + 2.0) / 8.0;
  if (m.metal > 0.5) {
    vec3 Fm = m.alb + (1.0 - m.alb) * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
    vec3 refl = env(R) * mix(1.0, 0.55, m.rough) * o;
    return Fm * (refl + KEY * sh * spec * 0.8) + m.alb * diff * 0.02;
  }
  vec3 col = m.alb * diff;
  col += F * (env(R) * o * (1.0 - m.rough) * 0.6 + KEY * sh * spec * (1.0 - m.rough * 0.85));
  return col;
}

// what a mirror or a lens sees: the rest of the scene, lit but without its own reflections
vec3 trace2(vec3 ro, vec3 rd, bool full) {
  float id;
  vec2 bb = boxI(ro, rd, vec3(0.0, 0.27, 0.0), vec3(1.8, 0.46, 1.2));
  float tT = rd.y < -1e-4 ? (TB - ro.y) / rd.y : 1e9;
  float tEnd = min(tT, 6.0);
  float t = 1e9;
  id = -1.0;
  if (bb.y > max(bb.x, 0.0)) t = march(ro, rd, max(bb.x, 0.0), min(bb.y, tEnd), false, full ? 70 : 44, id);
  if (id > 0.0) { vec3 p = ro + rd * t; return shade(p, normalAt(p, false), rd, id, full); }
  if (tT < 1e8) { vec3 p = ro + rd * tT; return shade(p, vec3(0.0, 1.0, 0.0), rd, 0.0, full); }
  return env(rd);
}

vec3 tonemap(vec3 x) { x *= 0.31; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  vec2 ndc = vUv * 2.0 - 1.0 - uShift;
  vec3 rd = normalize(uFw + uRt * (ndc.x * uTan * uAspect) + uUp * (ndc.y * uTan));
  vec3 ro = uCam;
  float jit = ign(gl_FragCoord.xy);
  float tT = (TB - ro.y) / min(rd.y, -1e-4);
  vec2 bb = boxI(ro, rd, vec3(0.0, 0.27, 0.0), vec3(1.8, 0.46, 1.2));
  float id = -1.0, t = tT;
  if (bb.y > max(bb.x, 0.0)) t = march(ro, rd, max(bb.x, 0.0), min(bb.y, tT), true, 140, id);
  if (id < 0.0) { t = tT; id = 0.0; }
  vec3 p = ro + rd * t;
  vec3 col;
  if (id > 1.5 && id < 2.5) {
    // the loupe: a mirror on top, and through it the floor of the pocket, bent and enlarged
    vec3 n = normalAt(p, true);
    float F = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
    vec3 R = reflect(rd, n);
    vec3 dir = refract(rd, n, 1.0 / 1.52);
    vec3 pi = p - n * 0.002;
    vec3 nl;
    float s = exitGlass(lensP(pi), lensD(dir), nl);
    vec3 pe = pi + dir * s;
    vec3 ne = lensDinv(nl);
    vec3 od = refract(dir, -ne, 1.52);
    if (dot(od, od) < 0.01) od = reflect(dir, -ne);
    vec3 through = trace2(pe + od * 0.004, od, true) * vec3(0.95, 0.985, 0.97);
    vec3 refl = env(R);
    col = mix(through, refl, F);
    col += KEY * 3.0 * pow(max(dot(R, L), 0.0), 900.0);
    // the ground edge of the glass catches a thin bright line
    float edge = smoothstep(0.37, 0.4, length(lensP(p).xz));
    col += vec3(0.9, 0.95, 1.0) * edge * 0.35;
  } else {
    vec3 n = id > 0.5 ? normalAt(p, true) : vec3(0.0, 1.0, 0.0);
    col = shade(p, n, rd, id, true);
    if (id > 2.5 && id < 3.5) {
      // brass mirrors the tray and its neighbours, softened by its roughness
      M m = material(p, n, id);
      vec3 R = reflect(rd, m.n);
      vec3 Fm = m.alb + (1.0 - m.alb) * pow(1.0 - clamp(dot(-rd, m.n), 0.0, 1.0), 5.0);
      vec3 seen = trace2(p + n * 0.01, R, false);
      col = mix(col, Fm * seen * mix(1.0, 0.6, m.rough) + col * 0.25, 0.62);
    }
  }

  float depth = t * dot(rd, uFw);
  float coc = clamp(uAperture * (1.0 - uFocus / max(depth, 0.05)), -1.0, 1.0);
  o = vec4(pow(tonemap(col), vec3(1.0 / 2.2)), 0.5 + 0.5 * coc);
}`;

const VS = `#version 300 es
out vec2 vUv;
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const FS_LENS = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uPx;
uniform float uMaxR;
in vec2 vUv;
out vec4 o;
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  vec4 c0 = texture(uScene, vUv);
  float s0 = c0.a * 2.0 - 1.0;
  float coc0 = abs(s0);
  vec3 lin0 = pow(c0.rgb, vec3(2.2));
  float w0 = 1.0 / (1.04 - max(lin0.r, max(lin0.g, lin0.b)) * 0.9);
  vec3 acc = lin0 * w0; float wsum = w0;
  float rot = 6.2832 * ign(gl_FragCoord.xy);
  for (int k = 1; k < 28; k++) {
    float r = sqrt(float(k) / 28.0) * uMaxR;
    float a = float(k) * 2.39996 + rot;
    vec4 s = texture(uScene, vUv + vec2(cos(a), sin(a)) * r * uPx);
    float sc = s.a * 2.0 - 1.0;
    float cs = abs(sc);
    if (sc > s0) cs = min(cs, coc0 * 1.6 + 0.02);
    vec3 lin = pow(s.rgb, vec3(2.2));
    float w = smoothstep(r - 1.0, r + 1.0, cs * uMaxR) / (1.04 - max(lin.r, max(lin.g, lin.b)) * 0.9);
    acc += lin * w; wsum += w;
  }
  o = vec4(pow(acc / wsum, vec3(1.0 / 2.2)), 1.0);
}`;

const FS_OUT = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uPx;
uniform float uTime;
in vec2 vUv;
out vec4 o;
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
const vec3 LU = vec3(0.299, 0.587, 0.114);
void main() {
  vec3 m = texture(uScene, vUv).rgb;
  vec3 cNW = texture(uScene, vUv + vec2(-1.0, -1.0) * uPx).rgb, cNE = texture(uScene, vUv + vec2(1.0, -1.0) * uPx).rgb;
  vec3 cSW = texture(uScene, vUv + vec2(-1.0, 1.0) * uPx).rgb, cSE = texture(uScene, vUv + vec2(1.0, 1.0) * uPx).rgb;
  float lNW = dot(cNW, LU), lNE = dot(cNE, LU), lSW = dot(cSW, LU), lSE = dot(cSE, LU);
  float lM = dot(m, LU);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
  float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078));
  dir = clamp(dir * rcp, -8.0, 8.0) * uPx;
  vec3 a = 0.5 * (texture(uScene, vUv + dir * (1.0 / 3.0 - 0.5)).rgb + texture(uScene, vUv + dir * (2.0 / 3.0 - 0.5)).rgb);
  vec3 b = a * 0.5 + 0.25 * (texture(uScene, vUv - dir * 0.5).rgb + texture(uScene, vUv + dir * 0.5).rgb);
  float lB = dot(b, LU);
  vec3 col = (lB < lMin || lB > lMax) ? a : b;
  col += (m - 0.25 * (cNW + cNE + cSW + cSE)) * 0.35;
  vec3 glow = vec3(0.0);
  float rot = 6.2832 * ign(gl_FragCoord.xy);
  for (int k = 0; k < 12; k++) {
    float an = float(k) * 2.39996 + rot;
    float d = 3.0 + 22.0 * sqrt(float(k) / 12.0);
    vec3 s = texture(uScene, vUv + vec2(cos(an), sin(an)) * d * uPx).rgb;
    glow += s * smoothstep(0.95, 1.0, dot(s, LU));
  }
  col += glow / 12.0 * vec3(0.22, 0.18, 0.12);
  vec2 q = vUv - 0.5;
  col *= 1.0 - 0.3 * dot(q, q);
  col += (ign(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.018;
  o = vec4(col, 1.0);
}`;

function program(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const p = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
  return p;
}

/** Small drawings of the four objects, for the still tray shown without WebGL. */
function Glyph({ i }: { i: number }) {
  const common = { "aria-hidden": true as const, className: "h-full w-full", viewBox: "0 0 100 100" };
  if (i === 0)
    return (
      <svg {...common}>
        <defs>
          <radialGradient id="pulp-tray-lens" cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="#dfe6e2" stopOpacity="0.5" />
            <stop offset="1" stopColor="#b9c4bf" stopOpacity="0.6" />
          </radialGradient>
        </defs>
        <path d="M58 64 L86 88" stroke="#3b2414" strokeWidth="8" strokeLinecap="round" />
        <path d="M58 64 L64 69" stroke="#c99a52" strokeWidth="9" strokeLinecap="round" />
        <circle cx="42" cy="46" r="26" fill="url(#pulp-tray-lens)" stroke="#c4914a" strokeWidth="5" />
      </svg>
    );
  if (i === 1)
    return (
      <svg {...common}>
        <circle cx="22" cy="50" r="12" fill="none" stroke="#c4914a" strokeWidth="5" />
        <path d="M34 50 H84" stroke="#c4914a" strokeWidth="5" strokeLinecap="round" />
        <path d="M70 50 V60 H76 V56 H82 V50" fill="#c4914a" />
      </svg>
    );
  if (i === 2)
    return (
      <svg {...common}>
        <rect x="28" y="22" width="44" height="7" rx="3" fill="#cfa77a" />
        <rect x="31" y="29" width="38" height="42" fill="#c33a24" />
        <rect x="28" y="71" width="44" height="7" rx="3" fill="#b88d60" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M20 74 L50 30 L80 74 Z" fill="#f4f2ec" stroke="#d7d3ca" strokeWidth="1.5" />
      <path d="M38 62 L50 44 L62 62 Z" fill="#2443b8" />
    </svg>
  );
}

/** The tray drawn with plain elements, for browsers without WebGL 2. */
function Still({ active, side }: { active: number; side: boolean }) {
  const cells = [
    { x: 2, y: 2, w: 47, h: 96 },
    { x: 51, y: 2, w: 47, h: 47 },
    { x: 51, y: 51, w: 22.5, h: 47 },
    { x: 75.5, y: 51, w: 22.5, h: 47 },
  ];
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#e7e1d6]" style={{ backgroundImage: "radial-gradient(120% 90% at 30% 10%, #f4f0e8 0%, #e7e1d6 55%, #d9d2c5 100%)" }}>
      <div className={`absolute ${side ? "left-[42%] right-[5%] top-[16%]" : "left-[6%] right-[6%] top-[12%]"}`} style={{ perspective: "1400px" }}>
        <div className="relative aspect-[3.4/2.2] rounded-[22px] bg-[#dcdcd4] shadow-[0_40px_60px_-20px_rgba(60,48,30,0.35),0_8px_18px_rgba(60,48,30,0.18)]" style={{ transform: "rotateX(38deg)", transformOrigin: "50% 70%" }}>
          {cells.map((c, i) => (
            <div key={i} className="absolute rounded-[16px] bg-[#d2d3ca]" style={{ left: `${c.x}%`, top: `${c.y}%`, width: `${c.w}%`, height: `${c.h}%`, boxShadow: "inset 0 10px 18px rgba(70,64,50,0.28), inset 0 -2px 3px rgba(255,255,255,0.6)" }}>
              <div className="absolute inset-[16%] transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: i === active ? "translateY(-14%) scale(1.08)" : "none", filter: i === active ? "drop-shadow(0 18px 12px rgba(50,40,25,0.3))" : "drop-shadow(0 3px 2px rgba(50,40,25,0.35))" }}>
                <Glyph i={i} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type Sim = { lift: number[]; vel: number[]; active: number; focus: number; touched: boolean; dirty: boolean };

export default function PulpTrayFeatures() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<"pending" | "gl" | "still">("pending");
  const [side, setSide] = useState(true);
  const [handled, setHandled] = useState(false);
  const sim = useRef<Sim>({ lift: [1, 0, 0, 0], vel: [0, 0, 0, 0], active: 0, focus: NaN, touched: false, dirty: true });

  const choose = (i: number) => {
    sim.current.touched = true;
    setHandled(true);
    setActive(i);
  };

  useEffect(() => {
    const s = sim.current;
    if (s.active !== active) {
      // a small press into the pulp before it rises: anticipation
      s.vel[active] -= 1.1;
      s.active = active;
    }
    s.dirty = true;
  }, [active]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) {
      setMode("still");
      return;
    }
    const s = sim.current;
    let pScene: WebGLProgram, pLens: WebGLProgram, pOut: WebGLProgram;
    try {
      pScene = program(gl, VS, GLSL);
      pLens = program(gl, VS, FS_LENS);
      pOut = program(gl, VS, FS_OUT);
    } catch {
      setMode("still");
      return;
    }
    setMode("gl");

    const vao = gl.createVertexArray();
    const fbos = [gl.createFramebuffer(), gl.createFramebuffer()];
    const texs = [gl.createTexture(), gl.createTexture()];
    let W = 0, H = 0, scale = Math.min(window.devicePixelRatio || 1, 2), cssW = 1, cssH = 1, wide = true;
    const TAN = Math.tan((11 * Math.PI) / 180);
    const cam = { pos: [0, 5, 6], rt: [1, 0, 0], up: [0, 1, 0], fw: [0, 0, -1], shift: [0, 0] };

    const aim = (t: number) => {
      const aspect = cssW / cssH;
      wide = cssW >= 1024;
      const el = (wide ? 0.74 : 0.86) + (reduce ? 0 : 0.012 * Math.sin(t * 0.21));
      const yaw = (wide ? 0.3 : 0.06) + (reduce ? 0 : 0.03 * Math.sin(t * 0.17));
      const target = [0.06, -0.02, 0.02];
      const dist = wide ? Math.max(3.75 / (1.32 * TAN * aspect), 2.5 / (2 * TAN * 0.92)) : Math.max(3.8 / (2 * TAN * aspect), 2.6 / (2 * TAN));
      cam.pos = [target[0] + Math.sin(yaw) * Math.cos(el) * dist, target[1] + Math.sin(el) * dist, target[2] + Math.cos(yaw) * Math.cos(el) * dist];
      let fw = [target[0] - cam.pos[0], target[1] - cam.pos[1], target[2] - cam.pos[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]);
      fw = fw.map((v) => v / fl);
      let rt = [-fw[2], 0, fw[0]];
      const rl = Math.hypot(rt[0], rt[2]);
      rt = rt.map((v) => v / rl);
      cam.fw = fw;
      cam.rt = rt;
      cam.up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      cam.shift = wide ? [0.38, -0.06] : [0, 0.02];
      return aspect;
    };

    const resize = () => {
      cssW = wrap.clientWidth;
      cssH = wrap.clientHeight;
      let k = scale;
      if (cssW * cssH * k * k > 1.6e6) k = Math.sqrt(1.6e6 / (cssW * cssH));
      const w = Math.max(2, Math.round(cssW * k)), h = Math.max(2, Math.round(cssH * k));
      aim(0);
      setSide(wide);
      if (w === W && h === H) return;
      W = w;
      H = h;
      canvas.width = W;
      canvas.height = H;
      texs.forEach((t, i) => {
        gl.activeTexture(gl.TEXTURE1 + i);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[i]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      });
      s.dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const focusTo = () => {
      const r = RESTS[s.active], l = s.lift[s.active];
      const d = [r[0] - cam.pos[0], r[1] + l * 0.34 - cam.pos[1], r[2] - cam.pos[2]];
      return d[0] * cam.fw[0] + d[1] * cam.fw[1] + d[2] * cam.fw[2];
    };

    const draw = (t: number) => {
      const aspect = aim(t);
      if (Number.isNaN(s.focus) || reduce) s.focus = focusTo();
      gl.bindVertexArray(vao);
      gl.disable(gl.DEPTH_TEST);
      gl.viewport(0, 0, W, H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[0]);
      gl.useProgram(pScene);
      gl.uniform4fv(U(pScene, "uLift"), s.lift);
      gl.uniform3fv(U(pScene, "uCam"), cam.pos);
      gl.uniform3fv(U(pScene, "uRt"), cam.rt);
      gl.uniform3fv(U(pScene, "uUp"), cam.up);
      gl.uniform3fv(U(pScene, "uFw"), cam.fw);
      gl.uniform1f(U(pScene, "uTan"), TAN);
      gl.uniform1f(U(pScene, "uAspect"), aspect);
      gl.uniform2fv(U(pScene, "uShift"), cam.shift);
      gl.uniform2f(U(pScene, "uRes"), W, H);
      gl.uniform1f(U(pScene, "uFocus"), s.focus);
      gl.uniform1f(U(pScene, "uAperture"), 1.5);
      gl.uniform1f(U(pScene, "uTime"), t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[1]);
      gl.useProgram(pLens);
      gl.uniform1i(U(pLens, "uScene"), 1);
      gl.uniform2f(U(pLens, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(pLens, "uMaxR"), H * 0.012);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(pOut);
      gl.uniform1i(U(pOut, "uScene"), 2);
      gl.uniform2f(U(pOut, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(pOut, "uTime"), reduce ? 0 : t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const physics = (dt: number, t: number) => {
      for (let i = 0; i < 4; i++) {
        const goal = i === s.active ? 1 + 0.035 * Math.sin(t * 1.4) : 0;
        s.vel[i] += (LIFT_SPRING * (goal - s.lift[i]) - LIFT_DAMPING * s.vel[i]) * dt;
        s.lift[i] += s.vel[i] * dt;
        // a resting object cannot sink into the floor of its pocket
        if (s.lift[i] < 0) {
          s.lift[i] = 0;
          if (s.vel[i] < 0) s.vel[i] *= -0.18;
        }
      }
      const f = focusTo();
      s.focus += (f - s.focus) * Math.min(1, dt * 5);
    };
    const settle = () => {
      for (let i = 0; i < 4; i++) {
        s.lift[i] = i === s.active ? 1 : 0;
        s.vel[i] = 0;
      }
    };

    let raf = 0, visible = true, last = performance.now(), slow = 0, frames = 0;
    const t0 = last;
    let played = 0, demoAt = 3.6;
    const tick = (now: number) => {
      const real = now - last;
      const dt = Math.min(Math.max(real / 1000, 0), 0.05);
      last = now;
      const t = (now - t0) / 1000;
      if (reduce) {
        if (s.dirty) settle();
      } else {
        const sub = Math.max(1, Math.ceil(dt / 0.004));
        for (let i = 0; i < sub; i++) physics(dt / sub, t);
        played += dt;
        if (DEMO && !s.touched && played > demoAt) {
          setActive((a) => (a + 1) % features.length);
          demoAt = played + 3.2;
        }
      }
      if (!reduce || s.dirty) {
        draw(reduce ? 0 : t);
        s.dirty = false;
        if (!reduce && ++frames > 20) {
          slow = slow * 0.92 + (real > 24 ? 1 : 0) * 0.08;
          if (slow > 0.6 && scale > 0.5) {
            scale *= 0.84;
            slow = 0;
            frames = 0;
            resize();
          }
        }
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const wake = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      frames = 0;
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      wake();
    });
    io.observe(wrap);
    document.addEventListener("visibilitychange", wake);
    raf = requestAnimationFrame(tick);

    // which compartment is under the pointer: cast the ray onto the top of the tray
    const cellAt = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const aspect = aim(0);
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1 - cam.shift[0];
      const ny = 1 - ((e.clientY - r.top) / r.height) * 2 - cam.shift[1];
      const d = [0, 1, 2].map((k) => cam.fw[k] + cam.rt[k] * nx * TAN * aspect + cam.up[k] * ny * TAN);
      if (d[1] >= 0) return -1;
      const t = (0.0 - cam.pos[1]) / d[1];
      const x = cam.pos[0] + d[0] * t, z = cam.pos[2] + d[2] * t;
      return CELLS.findIndex((c) => Math.abs(x - c[0]) < c[2] + 0.04 && Math.abs(z - c[1]) < c[3] + 0.04);
    };
    const move = (e: PointerEvent) => {
      const i = cellAt(e);
      canvas.style.cursor = i >= 0 ? "pointer" : "";
      if (i >= 0 && e.pointerType === "mouse" && i !== s.active) {
        s.touched = true;
        setHandled(true);
        setActive(i);
      }
    };
    const down = (e: PointerEvent) => {
      const i = cellAt(e);
      if (i >= 0) {
        s.touched = true;
        setHandled(true);
        setActive(i);
      }
    };
    const lost = (e: Event) => {
      e.preventDefault();
      setMode("still");
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("webglcontextlost", lost);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("webglcontextlost", lost);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduce]);

  const f = features[active];

  return (
    <section className="relative overflow-hidden bg-[#e7e1d6] text-[#1d1a16]" style={{ fontFamily: GROTESK }}>
      <div ref={wrapRef} className="relative h-[360px] sm:h-[540px] lg:absolute lg:inset-0 lg:h-auto">
        <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full touch-pan-y ${mode === "still" ? "hidden" : ""}`} />
        {mode === "still" && <Still active={active} side={side} />}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-[#e7e1d6]/0 to-[#e7e1d6] lg:hidden" />
      </div>

      <div className="pointer-events-none relative flex flex-col px-5 pb-10 pt-2 sm:px-9 lg:h-[780px] lg:w-[40%] lg:max-w-[540px] lg:justify-between lg:py-12 lg:pl-14 lg:pr-0">
        <div className="hidden lg:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#1d1a16]/70">
            {product.name}
            <span className="mx-2 text-[#1d1a16]/35">/</span>
            {product.line}
          </p>
          <h2 className="mt-4 text-[34px] italic leading-[1.05] text-[#1d1a16]" style={{ fontFamily: SERIF, letterSpacing: "-0.02em" }}>
            Four things it does, each kept in its own place.
          </h2>
        </div>
        <h2 className="text-[26px] italic leading-[1.1] lg:hidden" style={{ fontFamily: SERIF, letterSpacing: "-0.02em" }}>
          Four things {product.name} does, each in its own place.
        </h2>

        <div className="mt-6 lg:mt-0" aria-live={handled ? "polite" : "off"}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#1d1a16]/70">
            <span className="tabular-nums text-[#1d1a16]">{`0${active + 1}`}</span>
            <span className="mx-2 text-[#1d1a16]/35">/</span>
            {f.object}
          </p>
          <div className="relative mt-2 min-h-[150px] sm:min-h-[170px] lg:min-h-[230px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={reduce ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 30 }}
              >
                <h3 className="text-[44px] font-semibold leading-[0.92] sm:text-[58px] lg:text-[68px]" style={{ letterSpacing: "-0.05em" }}>
                  {f.name}
                </h3>
                <p className="mt-4 max-w-[30ch] text-[18px] leading-[1.35] text-[#3a352d] sm:text-[20px]" style={{ fontFamily: SERIF }}>
                  {f.line}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <ul className="pointer-events-auto mt-6 grid grid-cols-1 gap-x-6 border-t sm:grid-cols-2 border-[#1d1a16]/15 lg:mt-0 lg:grid-cols-1">
          {features.map((x, i) => (
            <li key={x.name} className="border-b border-[#1d1a16]/15">
              <button
                type="button"
                aria-pressed={active === i}
                onClick={() => choose(i)}
                onFocus={() => choose(i)}
                onMouseEnter={() => choose(i)}
                className="group flex min-h-[48px] w-full items-center gap-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1a16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7e1d6]"
              >
                <span className={`text-[11px] font-semibold tabular-nums tracking-[0.12em] ${active === i ? "text-[#1d1a16]" : "text-[#1d1a16]/55"}`}>{`0${i + 1}`}</span>
                <span className={`text-[15px] font-semibold tracking-[-0.01em] transition-colors sm:text-[16px] ${active === i ? "text-[#1d1a16]" : "text-[#1d1a16]/65 group-hover:text-[#1d1a16]"}`}>{x.name}</span>
                <span className={`ml-auto hidden h-[2px] origin-left bg-[#1d1a16] transition-all duration-300 motion-reduce:transition-none sm:block ${active === i ? "w-8" : "w-0"}`} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
