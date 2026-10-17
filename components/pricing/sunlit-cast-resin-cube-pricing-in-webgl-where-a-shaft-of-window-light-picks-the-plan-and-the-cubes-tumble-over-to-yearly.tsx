import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** The product and its three plans. Prices are per month; `yearly` is the monthly rate when billed once a year. */
const product = { name: "Penrow", line: "Bookkeeping for small studios" };
const plans = [
  {
    name: "Solo",
    monthly: 12,
    yearly: 10,
    pitch: "One set of books, kept tidy.",
    features: ["1 seat and 2 bank feeds", "Invoices, quotes and receipts", "Year-end export for your accountant"],
    size: 0.66, // edge of the cube, in metres
    resin: [7.5, 3.3, 0.4], // how strongly the resin soaks up red, green and blue
  },
  {
    name: "Studio",
    monthly: 29,
    yearly: 24,
    pitch: "The whole studio in one ledger.",
    features: ["5 seats, unlimited bank feeds", "Payroll for up to 10 people", "Project budgets and time sheets", "Approvals before money moves"],
    size: 0.8,
    resin: [0.1, 2.9, 5.0],
  },
  {
    name: "Company",
    monthly: 79,
    yearly: 66,
    pitch: "Several entities, one close.",
    features: ["25 seats across entities", "Consolidated month-end close", "Custom roles and audit trail", "A named onboarding lead"],
    size: 1.0,
    resin: [0.5, 4.8, 2.0],
  },
];

const GAP = 0.42; // floor between neighbouring cubes
const PIVOT = -0.5; // the line on the floor the cubes tip over: monthly they stand behind it, yearly in front
const WEIGHT = 20; // gravity on the cubes: higher falls faster
const BOUNCE = 0.24; // how much speed survives each landing
const SHAFT_SPRING = 46; // pull of the light toward the chosen cube
const SHAFT_DAMPING = 7.5; // lower lets the light overshoot further
const DEMO = true; // plays through the plans by itself until somebody touches it
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const HALF_PI = Math.PI / 2;
const TILE = 1024;

// where each cube stands along the row
const XS = (() => {
  const total = plans.reduce((a, p) => a + p.size, 0) + GAP * (plans.length - 1);
  let x = -total / 2;
  return plans.map((p) => {
    const c = x + p.size / 2;
    x += p.size + GAP;
    return c;
  });
})();

// the sun, low and behind the wall, coming through a tall window above the frame
const SUN_DIR = [-0.2, 0.423, -0.884];
const WALL_Z = -8;

const GLSL = `#version 300 es
precision highp float;
const float ZW = ${WALL_Z.toFixed(1)};
const float SILL = 3.0;
const float RAD = 0.04;
const float SC = 0.5;
const vec3 L = vec3(${SUN_DIR.join(", ")});
const vec3 SUN = vec3(1.0, 0.85, 0.64) * 7.5;
const vec3 SKY = vec3(0.6, 0.65, 0.74) * 0.66;
const vec3 FILLD = vec3(0.1407, 0.3283, 0.9340);
const vec3 FILL = vec3(1.0, 0.94, 0.86) * 0.56;
uniform vec3 uC[3];
uniform vec2 uCS[3];
uniform float uH[3];
uniform vec3 uAbs[3];
uniform vec3 uSlot;
uniform sampler2D uTex;
uniform vec3 uCam, uRt, uUp, uFw;
uniform float uTan, uAspect, uFocus, uAperture, uTime;
uniform vec2 uShift, uRes;
in vec2 vUv;
out vec4 o;

float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.1 + 7.3) + 0.125 * vnoise(p * 4.3 + 1.7) + 0.0625 * vnoise(p * 8.9); }

// each cube has rolled about the x axis: into its own frame and back out
vec3 dirL(vec3 d, int i) { vec2 r = uCS[i]; return vec3(d.x, d.y * r.x + d.z * r.y, -d.y * r.y + d.z * r.x); }
vec3 dirW(vec3 d, int i) { vec2 r = uCS[i]; return vec3(d.x, d.y * r.x - d.z * r.y, d.y * r.y + d.z * r.x); }
vec3 toL(vec3 p, int i) { return dirL(p - uC[i], i); }
vec3 toW(vec3 q, int i) { return dirW(q, i) + uC[i]; }

vec2 boxI(vec3 ro, vec3 rd, float h) {
  rd = mix(rd, vec3(1e-5), lessThan(abs(rd), vec3(1e-5)));
  vec3 m = 1.0 / rd, n = m * ro, k = abs(m) * h;
  vec3 t1 = -n - k, t2 = -n + k;
  return vec2(max(max(t1.x, t1.y), t1.z), min(min(t2.x, t2.y), t2.z));
}
float sdCube(vec3 q, float h) {
  vec3 d = abs(q) - (h - RAD);
  return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0) - RAD;
}

// The window: a tall slot in the wall, above the top of the frame. A point is in the sun
// when the line from it toward the sun passes through the slot and over its sill.
float slot(vec3 p) {
  float k = (ZW - p.z) / L.z;
  float pen = 0.011 * k + 0.012;
  float x = p.x + L.x * k;
  float y = p.y + L.y * k;
  return smoothstep(-pen, pen, uSlot.y - abs(x - uSlot.x)) * smoothstep(-pen, pen, y - SILL);
}

// what is left of a ray of sun after it has crossed the other cubes: resin tints it and scatters most of it
vec3 through(vec3 p, vec3 l, int skip) {
  vec3 T = vec3(1.0);
  for (int i = 0; i < 3; i++) {
    if (i == skip) continue;
    vec2 tb = boxI(toL(p, i), dirL(l, i), uH[i] - 0.004);
    float len = tb.y - max(tb.x, 0.0);
    if (len > 0.0 && tb.y > 0.0) {
      // the arrises throw light aside, so the pool of colour has a dark outline and a bright heart
      vec3 lo = toL(p, i), ld = dirL(l, i);
      vec3 e1 = uH[i] - abs(lo + ld * max(tb.x, 0.0)), e2 = uH[i] - abs(lo + ld * tb.y);
      float rim = min(e1.x + e1.y + e1.z - max(e1.x, max(e1.y, e1.z)), e2.x + e2.y + e2.z - max(e2.x, max(e2.y, e2.z)));
      // and the faces gather what is left into a brighter band just inside that outline
      float band = exp(-pow((rim - 0.22 * uH[i]) / (0.09 * uH[i]), 2.0));
      T *= exp(-uAbs[i] * (0.12 + len * 1.0)) * (0.5 + 0.8 * exp(-SC * len)) * (0.25 + 0.75 * smoothstep(0.0, 0.1 * uH[i], rim)) * (1.2 + 1.3 * band);
    }
  }
  return T;
}
vec3 sunVis(vec3 p, int skip, float jit, int ns) {
  vec3 a = normalize(cross(L, vec3(0.0, 1.0, 0.0))), b = cross(L, a);
  vec3 acc = vec3(0.0);
  for (int j = 0; j < ns; j++) {
    float an = float(j) * 2.39996 + jit * 6.2832;
    float r = sqrt((float(j) + 0.5) / float(ns)) * 0.021;
    acc += through(p, normalize(L + (a * cos(an) + b * sin(an)) * r), skip);
  }
  return acc / float(ns) * slot(p);
}

float lamp(vec3 rd, vec3 c, vec2 half_, float s) {
  float d = dot(rd, c);
  if (d <= 0.02) return 0.0;
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), c));
  vec3 up = cross(c, rt);
  vec2 q = vec2(dot(rd, rt), dot(rd, up)) / d;
  vec2 e = half_ - abs(q);
  // a skylight with one glazing bar
  return smoothstep(-s, s, e.x) * smoothstep(-s, s, e.y) * (1.0 - 0.7 * smoothstep(s * 0.6, 0.0, abs(q.x + 0.08) - 0.012));
}
// the room a mirror would see: sky through a roof light, a white card behind the camera, dark elsewhere
vec3 room(vec3 rd) {
  vec3 c = mix(vec3(0.05, 0.055, 0.06), SKY * 0.9, smoothstep(-0.15, 0.9, rd.y));
  c += vec3(0.86, 0.93, 1.0) * 60.0 * lamp(rd, normalize(vec3(0.2, 0.92, 0.34)), vec2(0.7, 0.42), 0.035);
  // two tall strip lights off to the sides: they only show as thin lines down the rounded edges
  c += vec3(1.0, 0.97, 0.92) * 75.0 * (lamp(rd, normalize(vec3(-0.86, 0.12, 0.5)), vec2(0.07, 0.7), 0.03) + lamp(rd, normalize(vec3(0.88, 0.1, 0.46)), vec2(0.05, 0.7), 0.03));
  c += FILL * 2.2 * lamp(rd, normalize(vec3(-0.25, 0.22, 1.0)), vec2(0.8, 0.42), 0.12);
  return c;
}

vec3 floorAlb(vec2 x) {
  // pale terrazzo: a cream binder with marble chips of two sizes ground flat into it
  vec3 a = mix(vec3(0.83, 0.76, 0.63), vec3(0.93, 0.87, 0.75), fbm(x * 0.7 + 2.0));
  a *= 0.965 + 0.07 * vnoise(x * 190.0);
  for (int s = 0; s < 2; s++) {
    vec2 u = x * (s == 0 ? 5.2 : 12.5) + float(s) * 17.0;
    vec2 c = floor(u), f = fract(u), id = vec2(0.0);
    float d1 = 9.0, d2 = 9.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 r = g + vec2(hash(c + g), hash(c + g + 31.7)) - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; id = c + g; } else if (d < d2) d2 = d;
    }
    float chip = smoothstep(0.0, 0.05, sqrt(d2) - sqrt(d1) - 0.14 - 0.3 * hash(id + 9.1)) * step(hash(id + 3.3), s == 0 ? 0.42 : 0.58);
    float t = hash(id + 5.7);
    vec3 cc = t < 0.3 ? vec3(0.96, 0.94, 0.89) : t < 0.5 ? vec3(0.6, 0.55, 0.5) : t < 0.72 ? vec3(0.84, 0.58, 0.4) : t < 0.88 ? vec3(0.74, 0.71, 0.62) : vec3(0.33, 0.4, 0.35);
    a = mix(a, cc * (0.9 + 0.2 * vnoise(u * 5.0)), chip);
  }
  return a;
}
vec3 tintOf(int i) { return exp(-uAbs[i] * 0.42); }
// a cube standing in the sun is a lantern: this is the coloured light it throws on a nearby surface
vec3 lantern(vec3 p, vec3 n, int skip) {
  vec3 c = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    if (i == skip) continue;
    float s = slot(uC[i] + vec3(0.0, uH[i], 0.0));
    if (s < 0.01) continue;
    vec3 d = uC[i] - p;
    float r2 = dot(d, d);
    c += tintOf(i) * tintOf(i) * SUN * s * uH[i] * uH[i] * 0.34 * max(dot(n, d) * inversesqrt(r2) + 0.15, 0.0) / (r2 + 0.05);
  }
  return c;
}
// a cube as seen in a reflection: its colour under the lights, without looking inside it
vec3 cubeFar(int i, vec3 p, vec3 n) {
  float s = slot(uC[i] + vec3(0.0, uH[i], 0.0));
  vec3 t = tintOf(i);
  return t * (SKY * (0.35 + 0.4 * n.y) + FILL * (0.25 + 0.6 * max(dot(n, FILLD), 0.0)) + SUN * s * (0.1 + 0.3 * max(dot(n, L), 0.0)) * t);
}
float aoCubes(vec3 p) {
  float ao = 1.0;
  for (int i = 0; i < 3; i++) {
    float d = sdCube(toL(p, i), uH[i]);
    float k = 1.0 - smoothstep(0.0, uH[i] * 1.5, d);
    ao *= 1.0 - 0.72 * k * k;
  }
  return ao;
}

vec3 shadeWall(vec3 p) {
  vec3 alb = vec3(0.024, 0.165, 0.1) * (0.8 + 0.42 * fbm(p.xy * vec2(0.55, 0.9) + 3.0)) * (0.98 + 0.04 * vnoise(p.xy * vec2(5.0, 23.0)));
  float corner = 0.5 + 0.5 * smoothstep(0.0, 2.4, p.y);
  float g = exp(-pow((p.x - uSlot.x - 1.9) / 3.4, 2.0));
  vec3 bounce = vec3(1.0, 0.82, 0.6) * (0.5 + 1.6 * g) * exp(-p.y * 0.3);
  return alb * (SKY * 0.5 * corner + FILL * 0.22 + bounce * 0.42);
}

vec3 shadeFloor(vec3 p, vec3 rd, float jit, int ns, bool mirror) {
  vec3 alb = floorAlb(p.xz);
  vec2 bump = vec2(vnoise(p.xz * 46.0 + 1.0), vnoise(p.xz * 46.0 + 7.0)) - 0.5;
  vec3 n = normalize(vec3(bump.x * 0.03, 1.0, bump.y * 0.03));
  float ao = aoCubes(p) * (0.62 + 0.38 * smoothstep(0.0, 3.0, p.z - ZW));
  vec3 sv = sunVis(p + vec3(0.0, 0.003, 0.0), -1, jit, ns);
  vec3 col = alb * (SUN * max(dot(n, L), 0.0) * sv + SKY * ao + FILL * 0.3 * ao);
  // looking into the light, honed stone glares
  col += SUN * sv * pow(max(dot(reflect(rd, n), L), 0.0), 22.0) * 0.16;
  col += alb * lantern(p, n, -1) * ao;
  if (mirror) {
    // polished terrazzo seen at a low angle carries a soft reflection of whatever stands on it
    vec3 R = reflect(rd, n);
    float F = 0.04 + 0.96 * pow(1.0 - clamp(-rd.y, 0.0, 1.0), 5.0);
    vec3 sheen = room(R) * F * 0.35;
    float got = 0.0; vec3 seen = vec3(0.0);
    for (int i = 0; i < 3; i++) {
      vec3 lo = toL(p, i), ld = dirL(reflect(rd, vec3(0.0, 1.0, 0.0)), i);
      vec2 tb = boxI(lo, ld, uH[i]);
      if (tb.y > max(tb.x, 0.0) && tb.x > 0.0) {
        vec3 q = lo + ld * tb.x;
        vec3 nl = step(vec3(uH[i] - 0.002), abs(q)) * sign(q);
        float w = exp(-tb.x * 1.7 / uH[i]) * smoothstep(0.0, 0.03, tb.y - tb.x);
        if (w > got) { got = w; seen = cubeFar(i, toW(q, i), dirW(nl, i)); }
      }
    }
    col += sheen * (1.0 - got) * ao;
    col = mix(col, seen, got * F * 0.9);
  }
  return col;
}

// floor, wall, the other cubes or the room, for mirrors and for looking through a block
vec3 traceSet(vec3 ro, vec3 rd, int self, float jit, bool gloss) {
  float best = 1e9; int hit = -1; vec3 nrm = vec3(0.0);
  if (rd.y < -1e-4) { best = -ro.y / rd.y; hit = 3; }
  if (rd.z < -1e-4) { float tw = (ZW - ro.z) / rd.z; if (tw < best) { best = tw; hit = 4; } }
  for (int i = 0; i < 3; i++) {
    if (i == self) continue;
    vec3 lo = toL(ro, i), ld = dirL(rd, i);
    vec2 tb = boxI(lo, ld, uH[i]);
    if (tb.y > tb.x && tb.x > 0.0 && tb.x < best) {
      best = tb.x; hit = i;
      vec3 q = lo + ld * tb.x;
      nrm = dirW(step(vec3(uH[i] - 0.002), abs(q)) * sign(q), i);
    }
  }
  if (hit < 0) return room(rd);
  vec3 p = ro + rd * best;
  if (hit == 3) return shadeFloor(p, rd, jit, 1, false);
  if (hit == 4) {
    vec3 w = shadeWall(p);
    // a polished face picks up the row of window panes high in the wall
    if (gloss) {
      float px = abs(fract(p.x / 0.6 + 0.5) - 0.5) * 0.6;
      w += vec3(0.88, 0.94, 1.0) * 3.6 * smoothstep(0.215, 0.205, px) * smoothstep(1.2, 1.26, p.y) * smoothstep(3.0, 2.9, p.y);
    }
    return w;
  }
  return cubeFar(hit, p, nrm);
}

vec3 shadeCube(int i, vec3 p, vec3 rd, float jit) {
  float h = uH[i];
  vec3 q = toL(p, i);
  vec3 nl = normalize(max(abs(q) - (h - RAD), 0.0) * sign(q) + sign(q) * 1e-5);
  vec3 rdl = dirL(rd, i);

  // The price is white resin cast inside the block, a little way under the face it is read through.
  // Looking along the bent line of sight shifts it against the surface, and its thickness shows as a darker flank.
  int k = -1;
  if (nl.z > 0.92) k = 0; else if (nl.y > 0.92) k = 1; else if (nl.z < -0.92) k = 2;
  float paint = 0.0, flank = 0.0;
  vec3 rf0 = refract(rdl, nl, 1.0 / 1.49);
  if (k >= 0) {
    vec2 f = k == 0 ? q.xy : k == 1 ? vec2(q.x, -q.z) : vec2(q.x, -q.y);
    vec3 tv = k == 0 ? vec3(0.0, 1.0, 0.0) : k == 1 ? vec3(0.0, 0.0, -1.0) : vec3(0.0, -1.0, 0.0);
    vec3 nf = k == 0 ? vec3(0.0, 0.0, 1.0) : k == 1 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, -1.0);
    vec2 slide = vec2(rf0.x, dot(rf0, tv)) / max(-dot(rf0, nf), 0.25);
    vec2 sc = vec2(1.0 / 3.0, 0.5), org = vec2(float(i), k == 1 ? 1.0 : 0.0);
    vec2 dx = dFdx(f / (2.0 * h)) * sc, dy = dFdy(f / (2.0 * h)) * sc;
    for (int s = 0; s < 4; s++) {
      vec2 uv = clamp((f + slide * h * (0.1 + 0.035 * float(s))) / (2.0 * h) + 0.5, 0.004, 0.996);
      float m = textureGrad(uTex, (uv + org) * sc, dx, dy).r;
      if (s == 0) paint = m; else flank = max(flank, m);
    }
    flank = max(flank - paint, 0.0);
  }
  // cast resin is never optically flat: a slow ripple left by the mould
  vec2 rip = vec2(vnoise(q.xy * 5.0 + q.z * 3.0 + float(i) * 9.0), vnoise(q.yz * 5.0 + q.x * 3.0 + 4.0)) - 0.5;
  vec3 nb = normalize(nl + vec3(rip.x, rip.y, rip.x - rip.y) * 0.012);
  vec3 n = dirW(nb, i);

  // inside the block: follow the bent line of sight as it mirrors off the inner faces until it finds a way out,
  // gathering on the way the light that reaches it from the sun, the sky and the fill card through the resin
  vec3 A = uAbs[i], ext = A + SC * 0.3, pig = exp(-A * 0.3);
  vec3 Ll = dirL(L, i), Ul = dirL(vec3(0.0, 1.0, 0.0), i), Fl = dirL(FILLD, i);
  vec3 pos = q - nl * 0.003, dir = rf0;
  vec3 trans = vec3(1.0), body = vec3(0.0);
  for (int leg = 0; leg < 3; leg++) {
    float Lx = max(boxI(pos, dir, h).y, 0.004);
    vec3 acc = vec3(0.0);
    for (int s = 0; s < 3; s++) {
      float t = Lx * (float(s) + 0.2 + 0.6 * jit) / 3.0;
      vec3 pk = pos + dir * t;
      float ds = max(boxI(pk, Ll, h).y, 0.0);
      vec3 pw = toW(pk + Ll * ds, i);
      vec3 ins = SUN * slot(pw) * through(pw, L, i) * exp(-(A * 0.5 + SC * 0.3) * ds) * 2.0;
      ins += SKY * exp(-ext * 0.7 * max(boxI(pk, Ul, h).y, 0.0)) * 3.0;
      ins += FILL * exp(-ext * 0.7 * max(boxI(pk, Fl, h).y, 0.0)) * 3.2;
      acc += exp(-ext * t) * ins;
    }
    body += trans * acc * pig * SC * Lx / 3.0;
    // a couple of air bubbles the pour trapped: each is a small bright ring with a glint
    if (leg == 0) for (int b = 0; b < 2; b++) {
      vec3 r = vec3(hash(vec2(float(i) * 7.0 + float(b), 3.1)), hash(vec2(float(b) * 5.0 + float(i), 8.7)), hash(vec2(float(i + b) * 3.0, 1.3)));
      vec3 oc = pos - (r - 0.5) * h * vec3(1.3, 1.2, 0.9);
      float rad = (0.011 + 0.012 * r.z) * (0.5 + h), tc = -dot(oc, dir);
      vec3 cl = oc + dir * tc;
      float d2 = dot(cl, cl) / (rad * rad);
      if (tc > 0.0 && tc < Lx && d2 < 1.0) {
        vec3 nb2 = normalize(cl - dir * rad * sqrt(1.0 - d2));
        body += trans * exp(-ext * tc) * ((SKY + FILL) * (0.2 + 2.2 * d2 * d2 * d2) + vec3(4.0) * pow(max(dot(nb2, normalize(Ul + Fl * 0.6)), 0.0), 24.0));
      }
    }
    trans *= exp(-(A + SC * 0.55) * Lx);
    vec3 pe = pos + dir * Lx;
    vec3 ne = -normalize(step(vec3(h - 0.006), abs(pe)) * sign(pe) + sign(pe) * 1e-4);
    // light that is trapped inside runs to the edges and leaves there: the far arrises of the block shine through it
    vec3 ee = h - abs(pe);
    float ed = ee.x + ee.y + ee.z - max(ee.x, max(ee.y, ee.z)) - min(ee.x, min(ee.y, ee.z));
    body += trans * pig * (SKY * 1.5 + FILL * 1.3 + SUN * slot(toW(pe, i)) * 0.9) * exp(-ed / (0.03 * h + 0.008)) * 0.55;
    vec3 od = refract(dir, ne, 1.49);
    float inside = 1.0;
    if (dot(od, od) > 0.0) {
      inside = 0.04 + 0.96 * pow(1.0 - clamp(dot(od, -ne), 0.0, 1.0), 5.0);
      body += trans * (1.0 - inside) * traceSet(toW(pe, i) + dirW(od, i) * 0.004, dirW(od, i), i, jit, false);
    }
    trans *= inside;
    dir = reflect(dir, ne);
    pos = pe + ne * 0.004;
  }
  body += trans * pig * (SKY * 0.5 + FILL * 0.3);

  vec3 glow = lantern(p, n, i);
  body += pig * glow * 0.9;
  vec3 light = glow + SKY * (0.7 + 0.6 * n.y) + FILL * (0.8 + 3.2 * max(dot(n, FILLD), 0.0)) + SUN * max(dot(n, L), 0.0) * slot(p) * through(p + n * 0.01, L, i);
  vec3 veil = exp(-A * h * 0.16);
  vec3 col = mix(body, pig * (body * 0.5 + light * 0.2), flank);
  col = mix(col, vec3(0.97, 0.95, 0.9) * light * veil + body * 0.1, paint);

  float F = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  // handled objects: faint wipe marks dull the mirror in patches, and specks of dust sit on the top
  vec2 sq = (abs(nl.y) > 0.5 ? q.xz : abs(nl.z) > 0.5 ? q.xy : q.zy) / h;
  F *= 0.62 + 0.38 * smoothstep(0.25, 0.7, fbm(sq * 2.3 + float(i) * 5.0));
  vec3 R = reflect(rd, n);
  vec3 refl = traceSet(p + n * 0.006, R, i, jit, true);
  vec3 sp = SUN * slot(p) * through(p + n * 0.01, L, i);
  refl += sp * (6.0 * pow(max(dot(R, L), 0.0), 380.0) + 0.9 * pow(max(dot(R, L), 0.0), 34.0));
  col = mix(col, refl, F);
  float speck = step(0.9965, hash(floor(sq * 90.0) + float(i))) * step(0.9, n.y);
  col += speck * (SKY * 0.5 + SUN * slot(p) * 0.25);
  return col;
}

vec3 tonemap(vec3 x) { x *= 0.31; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  vec2 ndc = vUv * 2.0 - 1.0 - uShift;
  vec3 rd = normalize(uFw + uRt * (ndc.x * uTan * uAspect) + uUp * (ndc.y * uTan));
  float jit = ign(gl_FragCoord.xy);
  float best = 60.0; int hit = -1;
  if (rd.y < -1e-4) { best = -uCam.y / rd.y; hit = 3; }
  if (rd.z < -1e-4) { float tw = (ZW - uCam.z) / rd.z; if (tw < best) { best = tw; hit = 4; } }
  for (int i = 0; i < 3; i++) {
    vec3 lo = toL(uCam, i), ld = dirL(rd, i);
    vec2 tb = boxI(lo, ld, uH[i]);
    if (tb.y > max(tb.x, 0.0) && tb.x < best) {
      float t = max(tb.x, 0.0); bool ok = false;
      for (int s = 0; s < 30; s++) {
        float d = sdCube(lo + ld * t, uH[i]);
        if (d < 0.0004) { ok = true; break; }
        t += d;
        if (t > tb.y) break;
      }
      if (ok && t < best) { best = t; hit = i; }
    }
  }
  vec3 p = uCam + rd * best;
  vec3 col;
  if (hit < 0) col = room(rd);
  else if (hit == 3) col = shadeFloor(p, rd, jit, 6, true);
  else if (hit == 4) col = shadeWall(p);
  else col = shadeCube(hit, p, rd, jit);

  // dust in the air shows the shaft itself
  float beam = 0.0;
  for (int s = 0; s < 8; s++) {
    vec3 pb = uCam + rd * (best * (float(s) + jit) / 8.0);
    beam += slot(pb) * dot(through(pb, L, -1), vec3(0.333));
  }
  col += SUN * beam / 8.0 * min(best, 22.0) * 0.0013;

  float depth = best * dot(rd, uFw);
  // motes of dust drifting through the room: only the ones inside the shaft catch the sun
  for (int k = 0; k < 44; k++) {
    float fk = float(k);
    vec3 r = vec3(hash(vec2(fk, 1.7)), hash(vec2(fk, 5.3)), hash(vec2(fk, 9.1)));
    vec3 pm = vec3(-3.4 + 6.4 * r.x, 0.08 + 2.2 * r.y, -3.6 + 8.0 * r.z);
    pm += vec3(sin(uTime * 0.13 + fk * 2.1), 0.5 * sin(uTime * 0.09 + fk), cos(uTime * 0.1 + fk * 1.3)) * 0.3;
    vec3 d = pm - uCam;
    float z = dot(d, uFw);
    if (z > depth) continue;
    vec2 sp = vec2(dot(d, uRt) / (z * uTan * uAspect), dot(d, uUp) / (z * uTan)) + uShift;
    float dist = length((sp - (vUv * 2.0 - 1.0)) * uRes * 0.5);
    float size = (0.7 + 7.0 * abs(1.0 - uFocus / z)) * uRes.y / 780.0;
    if (dist > size) continue;
    col += SUN * slot(pm) * dot(through(pm, L, -1), vec3(0.333)) * smoothstep(size, size * 0.55, dist) * (0.25 + r.y) * 0.9 / (size * size) * (uRes.y / 780.0) * (uRes.y / 780.0);
  }
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
  float w0 = 1.0 / (1.03 - max(lin0.r, max(lin0.g, lin0.b)));
  vec3 acc = lin0 * w0; float wsum = w0;
  float rot = 6.2832 * ign(gl_FragCoord.xy);
  // a disc of taps for whatever is out of focus; a tap only counts if its own blur reaches this pixel
  for (int k = 1; k < 28; k++) {
    float r = sqrt(float(k) / 28.0) * uMaxR;
    float a = float(k) * 2.39996 + rot;
    vec4 s = texture(uScene, vUv + vec2(cos(a), sin(a)) * r * uPx);
    float sc = s.a * 2.0 - 1.0;
    float cs = abs(sc);
    if (sc > s0) cs = min(cs, coc0 * 1.6 + 0.02);
    vec3 lin = pow(s.rgb, vec3(2.2));
    float w = smoothstep(r - 1.0, r + 1.0, cs * uMaxR) / (1.03 - max(lin.r, max(lin.g, lin.b)));
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
  // smooth the stair-steps along hard edges
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
  // and give back a little of the bite the smoothing took
  col += (m - 0.25 * (cNW + cNE + cSW + cSE)) * 0.4;
  // halation: the hottest sunlit stone bleeds a little
  vec3 glow = vec3(0.0);
  float rot = 6.2832 * ign(gl_FragCoord.xy);
  for (int k = 0; k < 14; k++) {
    float an = float(k) * 2.39996 + rot;
    float d = 3.0 + 26.0 * sqrt(float(k) / 14.0);
    vec3 s = texture(uScene, vUv + vec2(cos(an), sin(an)) * d * uPx).rgb;
    glow += s * smoothstep(0.8, 1.0, dot(s, LU));
  }
  col += glow / 14.0 * vec3(0.3, 0.22, 0.14);
  vec2 q = vUv - 0.5;
  col *= 1.0 - 0.55 * dot(q, q);
  col += (ign(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.02;
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

/** The lettering cast inside the cubes: one tile per plan and billing period, white where the white resin goes. */
function artwork() {
  const cv = document.createElement("canvas");
  cv.width = TILE * plans.length;
  cv.height = TILE * 2;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";
  const tracked = (s: string, x: number, y: number, font: string, gap: number, right = false) => {
    ctx.font = font;
    ctx.textAlign = "left";
    const w = [...s].map((c) => ctx.measureText(c).width + gap);
    let cx = right ? x - (w.reduce((a, b) => a + b, 0) - gap) : x;
    [...s].forEach((c, i) => {
      ctx.fillText(c, cx, y);
      cx += w[i];
    });
    return cx;
  };
  plans.forEach((plan, i) => {
    for (let row = 0; row < 2; row++) {
      // row 0 is drawn into the top half of the canvas and ends up as the yearly face (the texture is flipped)
      const yearly = row === 0;
      const x0 = i * TILE, y0 = row * TILE;
      ctx.save();
      ctx.translate(x0, y0);
      ctx.scale(TILE / 512, TILE / 512);
      tracked(plan.name.toUpperCase(), 50, 88, `600 31px ${GROTESK}`, 9);
      tracked(`0${i + 1}`, 462, 88, `600 31px ${GROTESK}`, 5, true);
      ctx.fillRect(50, 114, 412, 4);
      const end = tracked("$", 44, 282, `500 104px ${GROTESK}`, 0);
      tracked(String(yearly ? plan.yearly : plan.monthly), end + 6, 378, `600 292px ${GROTESK}`, -17);
      tracked(yearly ? "A MONTH, YEARLY" : "A MONTH", 50, 458, `600 30px ${GROTESK}`, 7);
      ctx.restore();
    }
  });
  return cv;
}

type Sim = {
  th: number[]; om: number[]; goal: number[]; wait: number[];
  sx: number; svx: number; sw: number; svw: number;
  shake: number; vshake: number; plan: number; yearly: boolean; dirty: boolean; touched: boolean;
};

/** The same scene laid out with plain elements, for browsers without WebGL 2. */
function Still({ plan, yearly }: { plan: number; yearly: boolean }) {
  const hues = [["#f3b52b", "#b9741a"], ["#f4642c", "#b8371a"], ["#d0245f", "#7d1238"]];
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(180deg, #10291f 0%, #1c4735 46%, #24523d 58%, #8a7f6c 58%, #6f6657 100%)" }}>
      <div className="absolute inset-x-0 top-[58%] h-[9%]" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0))" }} />
      <div
        className="absolute bottom-0 top-[62%] w-[30%] -translate-x-1/2 transition-[left] duration-700 ease-out motion-reduce:transition-none sm:w-[22%]"
        style={{ left: `${[20, 50, 80][plan]}%`, background: "linear-gradient(180deg, #f3dfbd, #fbe9c9)", clipPath: "polygon(14% 0, 86% 0, 100% 100%, 0 100%)", filter: "blur(2px)" }}
      />
      {plans.map((p, i) => {
        const lit = i === plan;
        return (
          <div key={p.name} className="absolute bottom-[16%] -translate-x-1/2" style={{ left: `${[20, 50, 80][i]}%`, width: `min(${p.size * 25}%, ${p.size * 250}px)`, aspectRatio: "1 / 1" }}>
            <div className="absolute -bottom-[5%] left-[6%] h-[12%] w-full rounded-[50%] bg-black/50 blur-md" style={lit ? { background: hues[i][1], opacity: 0.7 } : undefined} />
            <div className="absolute inset-x-0 bottom-full h-[12%]" style={{ background: lit ? "#ffe2b0" : hues[i][0], clipPath: "polygon(7% 0, 93% 0, 100% 100%, 0 100%)", filter: lit ? "none" : "brightness(0.72)" }} />
            <div
              className="absolute inset-0 flex flex-col justify-between p-[9%] text-[#fbf3e2]"
              style={{ background: lit ? `linear-gradient(175deg, #ffcf8a 0%, ${hues[i][0]} 34%, ${hues[i][1]} 100%)` : `linear-gradient(175deg, ${hues[i][0]} 0%, ${hues[i][1]} 100%)`, filter: lit ? "none" : "brightness(0.78)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 0 0 1px rgba(255,255,255,0.12)", fontFamily: GROTESK }}
            >
              <span className="border-b border-current pb-[6%] text-[7px] font-semibold uppercase tracking-[0.22em] sm:text-[10px]">{p.name}</span>
              <span className="text-[clamp(22px,7vw,112px)] font-semibold leading-[0.8] tracking-[-0.06em]">
                <span className="mr-[0.04em] align-top text-[0.4em] font-medium tracking-normal">$</span>
                {yearly ? p.yearly : p.monthly}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ResinCubePricing() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [plan, setPlan] = useState(1);
  const [yearly, setYearly] = useState(false);
  const [mode, setMode] = useState<"pending" | "gl" | "still">("pending");
  const [marks, setMarks] = useState<number[]>([24, 50, 76]);
  const [handled, setHandled] = useState(false);
  const sim = useRef<Sim>({
    th: [0, 0, 0], om: [0, 0, 0], goal: [0, 0, 0], wait: [0, 0, 0],
    sx: NaN, svx: 0, sw: 0, svw: 0, shake: 0, vshake: 0, plan: 1, yearly: false, dirty: true, touched: false,
  });

  // choosing a plan: the light swings over and the chosen cube rocks on its edge
  useEffect(() => {
    const s = sim.current;
    if (s.plan !== plan) {
      s.plan = plan;
      if (Math.abs(s.om[plan]) < 0.01) s.om[plan] = (s.goal[plan] ? -1 : 1) * 0.5 * Math.sqrt((0.586 * WEIGHT) / plans[plan].size);
    }
    s.dirty = true;
  }, [plan]);
  // changing the billing period: every cube tips over its front edge, the small one first
  useEffect(() => {
    const s = sim.current;
    if (s.yearly !== yearly) {
      s.yearly = yearly;
      plans.forEach((_, i) => {
        s.goal[i] = yearly ? 1 : 0;
        s.wait[i] = i * 0.13;
      });
    }
    s.dirty = true;
  }, [yearly]);

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

    const art = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, art);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, artwork());
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    const vao = gl.createVertexArray();
    const fbos = [gl.createFramebuffer(), gl.createFramebuffer()];
    const texs = [gl.createTexture(), gl.createTexture()];
    let W = 0, H = 0, scale = Math.min(window.devicePixelRatio || 1, 2), cssW = 1, cssH = 1;
    const TAN = Math.tan((7.7 * Math.PI) / 180);
    const cam = { pos: [0, 2, 10], rt: [1, 0, 0], up: [0, 1, 0], fw: [0, 0, -1], shift: [0, 0], focus: 10 };

    const aim = (sway: number, lift: number) => {
      const aspect = cssW / cssH;
      const wide = aspect > 1.2;
      const dist = Math.max(10, 2.05 / (TAN * aspect));
      const el = wide ? 0.15 : 0.12;
      const target = [0, 0.5, PIVOT];
      cam.pos = [target[0] + sway, target[1] + Math.sin(el) * dist + lift, target[2] + Math.cos(el) * dist];
      let fw = [target[0] - cam.pos[0], target[1] - cam.pos[1] + lift, target[2] - cam.pos[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]);
      fw = fw.map((v) => v / fl);
      let rt = [-fw[2], 0, fw[0]];
      const rl = Math.hypot(rt[0], rt[2]);
      rt = rt.map((v) => v / rl);
      cam.fw = fw;
      cam.rt = rt;
      cam.up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      cam.shift = wide ? [0, -0.235] : [0, -0.3];
      cam.focus = fl;
      return aspect;
    };
    const project = (p: number[]) => {
      const d = [p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]];
      const z = d[0] * cam.fw[0] + d[1] * cam.fw[1] + d[2] * cam.fw[2];
      const x = (d[0] * cam.rt[0] + d[1] * cam.rt[1] + d[2] * cam.rt[2]) / (z * TAN * (cssW / cssH)) + cam.shift[0];
      const y = (d[0] * cam.up[0] + d[1] * cam.up[1] + d[2] * cam.up[2]) / (z * TAN) + cam.shift[1];
      return [(x * 0.5 + 0.5) * cssW, (0.5 - y * 0.5) * cssH];
    };

    const resize = () => {
      cssW = wrap.clientWidth;
      cssH = wrap.clientHeight;
      let k = scale;
      if (cssW * cssH * k * k > 2.1e6) k = Math.sqrt(2.1e6 / (cssW * cssH));
      const w = Math.max(2, Math.round(cssW * k)), h = Math.max(2, Math.round(cssH * k));
      aim(0, 0);
      setMarks(XS.map((x) => (project([x, 0, PIVOT])[0] / cssW) * 100));
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
    const centre = (i: number) => {
      const h = plans[i].size / 2, c = Math.cos(s.th[i]), sn = Math.sin(s.th[i]);
      // the cube turns about its front bottom edge, which stays on the pivot line
      return [XS[i], h * c + h * sn, PIVOT + h * sn - h * c];
    };
    // where the window has to be for the sun to land on a cube
    const shaftFor = (i: number) => {
      const c = centre(i);
      return c[0] + SUN_DIR[0] * ((WALL_Z - c[2]) / SUN_DIR[2]);
    };

    const draw = (t: number) => {
      const aspect = aim(reduce ? 0 : 0.16 * Math.sin(t * 0.23), s.shake);
      gl.bindVertexArray(vao);
      gl.disable(gl.DEPTH_TEST);
      gl.viewport(0, 0, W, H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[0]);
      gl.useProgram(pScene);
      const cs: number[] = [], cc: number[] = [], hh: number[] = [], ab: number[] = [];
      plans.forEach((p, i) => {
        cc.push(...centre(i));
        cs.push(Math.cos(s.th[i]), Math.sin(s.th[i]));
        hh.push(p.size / 2);
        ab.push(...p.resin);
      });
      gl.uniform3fv(U(pScene, "uC"), cc);
      gl.uniform2fv(U(pScene, "uCS"), cs);
      gl.uniform1fv(U(pScene, "uH"), hh);
      gl.uniform3fv(U(pScene, "uAbs"), ab);
      gl.uniform3f(U(pScene, "uSlot"), s.sx, s.sw + (reduce ? 0 : 0.012 * Math.sin(t * 0.8)), 0);
      gl.uniform1i(U(pScene, "uTex"), 0);
      gl.uniform3fv(U(pScene, "uCam"), cam.pos);
      gl.uniform3fv(U(pScene, "uRt"), cam.rt);
      gl.uniform3fv(U(pScene, "uUp"), cam.up);
      gl.uniform3fv(U(pScene, "uFw"), cam.fw);
      gl.uniform1f(U(pScene, "uTan"), TAN);
      gl.uniform1f(U(pScene, "uAspect"), aspect);
      gl.uniform2fv(U(pScene, "uShift"), cam.shift);
      gl.uniform2f(U(pScene, "uRes"), W, H);
      gl.uniform1f(U(pScene, "uFocus"), cam.focus);
      gl.uniform1f(U(pScene, "uAperture"), 0.8);
      gl.uniform1f(U(pScene, "uTime"), t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[1]);
      gl.useProgram(pLens);
      gl.uniform1i(U(pLens, "uScene"), 1);
      gl.uniform2f(U(pLens, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(pLens, "uMaxR"), H * 0.0085);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(pOut);
      gl.uniform1i(U(pOut, "uScene"), 2);
      gl.uniform2f(U(pOut, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(pOut, "uTime"), reduce ? 0 : t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // A cube on its edge is an upside-down pendulum with two places to rest: flat on one face (0) or on the next (a quarter turn).
    const physics = (dt: number) => {
      plans.forEach((p, i) => {
        const k = WEIGHT / p.size;
        if (s.wait[i] > 0) {
          s.wait[i] -= dt;
          return;
        }
        const want = s.goal[i] * HALF_PI;
        const side = s.th[i] > Math.PI / 4 ? HALF_PI : 0;
        let acc = -k * Math.sin(Math.PI / 4 - s.th[i]);
        // a steady push until it is over the balance point, then gravity does the rest
        if (side !== want) acc += (want > side ? 1 : -1) * k * 0.86;
        s.om[i] += acc * dt;
        s.th[i] += s.om[i] * dt;
        for (const [wall, sign] of [[0, -1], [HALF_PI, 1]] as const) {
          if ((s.th[i] - wall) * sign > 0) {
            s.th[i] = wall;
            const hit = Math.abs(s.om[i]);
            if (s.om[i] * sign > 0) s.om[i] = hit > 0.5 ? -s.om[i] * BOUNCE : 0;
            if (hit > 1.2) s.vshake -= hit * p.size * p.size * p.size * 0.085;
          }
        }
      });
      const tx = shaftFor(s.plan), tw = plans[s.plan].size / 2 + 0.34;
      s.svx += (SHAFT_SPRING * (tx - s.sx) - SHAFT_DAMPING * s.svx) * dt;
      s.sx += s.svx * dt;
      s.svw += (SHAFT_SPRING * (tw - s.sw) - SHAFT_DAMPING * 1.4 * s.svw) * dt;
      s.sw += s.svw * dt;
      s.vshake += (-900 * s.shake - 34 * s.vshake) * dt;
      s.shake += s.vshake * dt;
    };
    const settle = () => {
      plans.forEach((_, i) => {
        s.th[i] = s.goal[i] * HALF_PI;
        s.om[i] = 0;
        s.wait[i] = 0;
      });
      s.sx = shaftFor(s.plan);
      s.sw = plans[s.plan].size / 2 + 0.34;
      s.svx = s.svw = s.shake = s.vshake = 0;
    };
    settle();

    let raf = 0, visible = true, last = performance.now(), slow = 0, frames = 0;
    const t0 = last;
    // the demo keeps its own clock, counted in simulated time, so a slow machine never gets ahead of its cubes
    let played = 0, demoAt = 4.2, step = 0;
    const tick = (now: number) => {
      const real = now - last;
      const dt = clamp(real / 1000, 0, 0.05); // the first frame can be stamped before the effect ran
      last = now;
      const t = (now - t0) / 1000;
      if (reduce) {
        if (s.dirty) settle();
      } else {
        const sub = Math.max(1, Math.ceil(dt / 0.004));
        for (let i = 0; i < sub; i++) physics(dt / sub);
        played += dt;
        if (DEMO && !s.touched && played > demoAt) {
          // the gallery plays itself: yearly, the big plan, the small one, monthly, and home again
          const script = [() => setYearly(true), () => setPlan(2), () => setPlan(0), () => setYearly(false), () => setPlan(1)];
          script[step % script.length]();
          step++;
          demoAt = played + 3.4;
        }
      }
      if (!reduce || s.dirty) {
        draw(reduce ? 0 : t);
        s.dirty = false;
        // measure, do not guess: if frames run long, render fewer pixels
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
      if (visible) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) {
        last = performance.now();
        frames = 0;
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(wrap);
    raf = requestAnimationFrame(tick);

    // pressing a cube chooses its plan
    const over = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      aim(0, 0);
      for (let i = 0; i < plans.length; i++) {
        const c = centre(i), h = plans[i].size / 2;
        const a = project([c[0] - h, c[1] + h, c[2]]), b = project([c[0] + h, 0, c[2] + h]);
        if (x > a[0] - 6 && x < b[0] + 6 && y > a[1] - 6 && y < b[1] + 6) return i;
      }
      return -1;
    };
    const touch = () => {
      s.touched = true;
      setHandled(true);
    };
    const down = (e: PointerEvent) => {
      touch();
      const i = over(e);
      if (i >= 0) setPlan(i);
    };
    const move = (e: PointerEvent) => {
      canvas.style.cursor = over(e) >= 0 ? "pointer" : "";
    };
    const lost = (e: Event) => {
      e.preventDefault();
      setMode("still");
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("webglcontextlost", lost);
    wrap.addEventListener("keydown", touch);
    wrap.addEventListener("pointerdown", touch);
    wrap.addEventListener("focusin", touch);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("webglcontextlost", lost);
      wrap.removeEventListener("keydown", touch);
      wrap.removeEventListener("pointerdown", touch);
      wrap.removeEventListener("focusin", touch);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduce]);

  const chosen = plans[plan];
  const price = yearly ? chosen.yearly : chosen.monthly;
  const ink = "text-[#f6eedd]";

  return (
    <section className="relative overflow-hidden bg-[#163a2d]" style={{ fontFamily: GROTESK }}>
      <div ref={wrapRef} className="relative h-[600px] w-full sm:h-[780px]">
        <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full touch-pan-y ${mode === "still" ? "hidden" : ""}`} />
        {mode === "still" && <Still plan={plan} yearly={yearly} />}

        <div className={`pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5 sm:p-9 ${ink}`}>
          <p className="flex items-baseline gap-3">
            <span className="text-[22px] italic leading-none sm:text-[26px]" style={{ fontFamily: SERIF, letterSpacing: "-0.02em" }}>
              {product.name}
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.26em] text-[#f6eedd]/75 sm:inline">{product.line}</span>
          </p>
          <div className="pointer-events-auto flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <span id="resin-cube-pricing-billing" className={yearly ? "text-[#f6eedd]/70" : ""}>
              Monthly
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={yearly}
              aria-label="Bill yearly"
              onClick={() => setYearly((v) => !v)}
              className="relative h-10 w-[68px] rounded-full border border-[#f6eedd]/35 bg-black/25 backdrop-blur-sm transition-colors hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6eedd]"
            >
              <span
                className="absolute left-1 top-1 h-[30px] w-[30px] rounded-full bg-[#f6eedd] shadow-[0_2px_6px_rgba(0,0,0,0.4)] transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{ transform: yearly ? "translateX(28px)" : "none" }}
              />
            </button>
            <span className={yearly ? "" : "text-[#f6eedd]/70"}>Yearly</span>
          </div>
        </div>

        <div className={`pointer-events-none absolute left-5 top-[76px] sm:left-9 sm:top-[112px] ${ink}`} aria-live={handled ? "polite" : "off"}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#f6eedd]/80">
            <span className="tabular-nums text-[#f6eedd]">{`0${plan + 1}`}</span>
            <span className="mx-2 text-[#f6eedd]/45">/</span>
            {chosen.name}
          </p>
          <h2 className="mt-1 flex items-start overflow-hidden pb-1 font-semibold leading-[0.84] sm:mt-2" style={{ letterSpacing: "-0.065em" }}>
            <span className="mr-1 mt-[0.1em] text-[40px] font-medium sm:text-[76px]" style={{ letterSpacing: "0" }}>
              $
            </span>
            <motion.span
              key={`${plan}-${yearly}`}
              initial={reduce ? false : { y: "0.5em", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="block text-[104px] tabular-nums sm:text-[196px]"
            >
              {price}
            </motion.span>
            <span className="ml-3 mt-[0.72em] self-start text-[12px] font-semibold uppercase leading-[1.5] tracking-[0.2em] text-[#f6eedd]/80 sm:ml-5 sm:mt-[9.6em] sm:text-[12px]">
              a month
              <span className="block normal-case tracking-normal text-[#f6eedd]/75" style={{ letterSpacing: "0.01em" }}>
                {yearly ? `$${chosen.yearly * 12} billed once a year` : "billed every month"}
              </span>
            </span>
          </h2>
          <p className="mt-1 text-[19px] italic leading-tight sm:mt-2 sm:text-[26px]" style={{ fontFamily: SERIF, letterSpacing: "-0.01em" }}>
            {chosen.pitch}
          </p>
        </div>

        <div className={`absolute right-9 top-[96px] hidden w-[262px] lg:block ${ink}`}>
          <ul className="space-y-2 border-t border-[#f6eedd]/30 pt-3.5 text-[14px] leading-snug">
            {chosen.features.map((f) => (
              <li key={f} className="flex gap-3">
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                  <path d="M4 10.5l4 4 8-9" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <a
            href="#"
            className="mt-4 inline-flex h-11 items-center gap-3 rounded-full bg-[#f6eedd] pl-5 pr-4 text-[14px] font-semibold text-[#12281f] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6eedd] focus-visible:ring-offset-2 focus-visible:ring-offset-[#163a2d]"
          >
            Start with {chosen.name}
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10h12M11 5l5 5-5 5" />
            </svg>
          </a>
        </div>

        <fieldset className="absolute inset-x-0 bottom-4 h-11">
          <legend className="sr-only">Plan</legend>
          {plans.map((p, i) => (
            <label
              key={p.name}
              htmlFor={`resin-cube-pricing-plan-${i}`}
              className="absolute top-0 -translate-x-1/2 cursor-pointer"
              style={{ left: `${mode === "still" ? [20, 50, 80][i] : marks[i]}%` }}
            >
              <input id={`resin-cube-pricing-plan-${i}`} type="radio" name="resin-cube-pricing-plan" value={p.name} checked={plan === i} onChange={() => setPlan(i)} className="peer sr-only" />
              <span className="flex h-11 items-center gap-2.5 whitespace-nowrap rounded-full border border-black/10 bg-[#f6eedd]/90 pl-3 pr-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#12281f] shadow-[0_6px_20px_rgba(20,14,6,0.28)] backdrop-blur-sm transition peer-checked:bg-[#12281f] peer-checked:text-[#f6eedd] peer-focus-visible:ring-2 peer-focus-visible:ring-[#12281f] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#f6eedd] sm:text-[13px]">
                <span className={`grid h-4 w-4 place-items-center rounded-full border-[1.5px] ${plan === i ? "border-[#f6eedd]" : "border-[#12281f]/60"}`}>
                  <span className={`h-2 w-2 rounded-full bg-[#f6eedd] transition-transform ${plan === i ? "scale-100" : "scale-0"}`} />
                </span>
                {p.name}
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      <div className={`border-t border-[#f6eedd]/15 px-5 pb-8 pt-6 lg:hidden ${ink}`}>
        <ul className="space-y-2.5 text-[15px] leading-snug">
          {chosen.features.map((f) => (
            <li key={f} className="flex gap-3">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                <path d="M4 10.5l4 4 8-9" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
        <a
          href="#"
          className="mt-6 inline-flex h-12 items-center gap-3 rounded-full bg-[#f6eedd] pl-6 pr-5 text-[14px] font-semibold text-[#12281f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6eedd] focus-visible:ring-offset-2 focus-visible:ring-offset-[#163a2d]"
        >
          Start with {chosen.name}
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10h12M11 5l5 5-5 5" />
          </svg>
        </a>
      </div>
    </section>
  );
}
