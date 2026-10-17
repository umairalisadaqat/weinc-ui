import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** The product and its three plans. These are example prices: change them to your own. */
const product = { name: "Larkspur", line: "Recipe costing for small kitchens" };
const plans = [
  {
    name: "Taster",
    price: 9,
    pitch: "One menu, costed to the gram.",
    features: ["1 kitchen, 60 recipes", "Supplier price lists", "Allergen labels to print"],
    radius: 0.34, // jar radius in metres
    height: 0.8,
    glaze: [0.62, 0.5, 0.3], // speckled oatmeal, linear RGB
    slip: [0.16, 0.09, 0.06], // the paint used for the lettering
  },
  {
    name: "Kitchen",
    price: 24,
    pitch: "Every dish, every margin, every week.",
    features: ["3 kitchens, unlimited recipes", "Stock counts on a phone", "Waste log and weekly margin", "Prep lists by station"],
    radius: 0.42,
    height: 1.0,
    glaze: [0.78, 0.24, 0.11], // apricot
    slip: [0.93, 0.88, 0.78],
  },
  {
    name: "Larder",
    price: 58,
    pitch: "A group of sites on one price book.",
    features: ["Up to 12 sites", "Central ordering and transfers", "Menu engineering reports", "A named onboarding cook"],
    radius: 0.5,
    height: 1.24,
    glaze: [0.025, 0.06, 0.24], // cobalt
    slip: [0.93, 0.88, 0.78],
  },
];

const GAP = 0.36; // shelf between neighbouring jars
const ROCK = 0.3; // how far forward the chosen jar rocks, in radians
const BOUNCE = 0.32; // how much speed survives when a jar lands back on its foot
const FILL_SECONDS = 1.5; // how long the honey takes to fill a jar
const DEMO = true; // plays through the plans by itself until somebody touches it
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const INK = "#2a1c19";
const WALL = "#ecd3cb";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const XS = (() => {
  const total = plans.reduce((a, p) => a + p.radius * 2, 0) + GAP * (plans.length - 1);
  let x = -total / 2;
  return plans.map((p) => {
    const c = x + p.radius;
    x += p.radius * 2 + GAP;
    return c;
  });
})();
const SUN_DIR = (() => {
  const v = [-0.6, 0.66, 0.46];
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((x) => x / l);
})();
const SHELF_FRONT = 0.92;
const WALL_Z = -0.86;

const GLSL = `#version 300 es
precision highp float;
const vec3 L = vec3(${SUN_DIR.map((v) => v.toFixed(4)).join(", ")});
const vec3 SUN = vec3(1.0, 0.9, 0.76) * 3.4;
const vec3 SKY = vec3(0.86, 0.84, 0.88) * 0.6;
const float FRONT = ${SHELF_FRONT.toFixed(2)};
const float WZ = ${WALL_Z.toFixed(2)};
uniform vec4 uJ[3];      // x, z, radius, height
uniform vec2 uCS[3];     // cos and sin of the rock angle
uniform vec3 uPiv[3];    // the edge of the foot the jar is rocking on
uniform float uOff[3];   // which edge: +radius front, -radius back
uniform float uLv[3];    // world height of the honey
uniform float uSl[3];    // slosh tilt of the honey
uniform vec3 uGl[3];     // glaze colour
uniform vec3 uSp[3];     // slip colour
uniform vec4 uStream;    // x, z, radius, bottom
uniform sampler2D uTex;
uniform vec3 uCam, uRt, uUp, uFw;
uniform float uTan, uAspect, uFocus, uAperture, uTime;
uniform vec2 uShift;
in vec2 vUv;
out vec4 o;

float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.1 + 7.3) + 0.125 * vnoise(p * 4.3 + 1.7) + 0.0625 * vnoise(p * 8.9); }
float smax(float a, float b, float k) { float h = clamp(0.5 - 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) + k * h * (1.0 - h); }

vec3 toJ(vec3 p, int i) {
  vec3 d = p - uPiv[i];
  vec2 r = uCS[i];
  return vec3(d.x, d.y * r.x + d.z * r.y, -d.y * r.y + d.z * r.x + uOff[i]);
}
vec3 dirW(vec3 d, int i) { vec2 r = uCS[i]; return vec3(d.x, d.y * r.x - d.z * r.y, d.y * r.y + d.z * r.x); }

// the turned profile: a full belly, a soft shoulder, a wide neck and a rolled lip
float prof(float y, float R, float H) {
  float t = clamp(y / H, 0.0, 1.0);
  float body = R * (0.88 + 0.12 * sin(3.14159 * clamp(t / 0.82, 0.0, 1.0) * 0.86 + 0.3));
  float r = mix(body, R * 0.8, smoothstep(0.7, 0.9, t));
  r += R * 0.045 * smoothstep(0.93, 0.995, t);
  r -= R * 0.07 * (1.0 - smoothstep(0.0, 0.06, t));
  return r;
}
float wall(float R) { return 0.03 + 0.02 * R; }
float jarD(vec3 q, float R, float H) {
  float rho = length(q.xz), pr = prof(q.y, R, H), th = wall(R);
  float outer = smax((rho - pr) * 0.85, max(-q.y, q.y - H), 0.02);
  float inner = smax((rho - (pr - th)) * 0.85, th * 1.8 - q.y, 0.03);
  return smax(outer, -inner, 0.01);
}
float cavD(vec3 q, float R, float H) {
  float rho = length(q.xz), pr = prof(q.y, R, H), th = wall(R) + 0.004;
  return smax((rho - (pr - th)) * 0.85, th * 1.8 - q.y, 0.03);
}

// id: 0..2 jars, 3..5 honey, 6 the pouring thread
vec2 map(vec3 p, bool honey) {
  vec2 res = vec2(1e9, -1.0);
  for (int i = 0; i < 3; i++) {
    vec4 J = uJ[i];
    vec3 q = toJ(p, i);
    float bound = length(max(vec2(length(q.xz) - J.z * 1.01, abs(q.y - J.w * 0.5) - J.w * 0.51), 0.0)) * 0.85;
    if (bound > 0.3) { if (bound < res.x) res = vec2(bound, -1.0); continue; }
    float d = jarD(q, J.z, J.w);
    if (d < res.x) res = vec2(d, float(i));
    if (honey && uLv[i] > -1.0) {
      vec3 n = vec3(0.0, cos(uSl[i]), sin(uSl[i]));
      float h = max(cavD(q, J.z, J.w), dot(p - vec3(J.x, uLv[i], J.y), n));
      if (h < res.x) res = vec2(h, float(3 + i));
    }
  }
  if (honey && uStream.z > 0.0) {
    float wob = 0.012 * sin(p.y * 5.0 - uTime * 3.0);
    float rr = uStream.z * (1.0 + 0.18 * sin(p.y * 11.0 - uTime * 14.0)) * (0.7 + 0.3 * smoothstep(uStream.w, uStream.w + 0.4, p.y));
    float d = max(length(p.xz - uStream.xy - vec2(wob, 0.0)) - rr, uStream.w - 0.02 - p.y);
    if (d < res.x) res = vec2(d, 6.0);
  }
  return res;
}
vec3 nrm(vec3 p, bool honey) {
  vec2 e = vec2(0.0007, -0.0007);
  return normalize(e.xyy * map(p + e.xyy, honey).x + e.yyx * map(p + e.yyx, honey).x + e.yxy * map(p + e.yxy, honey).x + e.xxx * map(p + e.xxx, honey).x);
}
float shadow(vec3 p) {
  float s = 1.0, t = 0.02;
  for (int k = 0; k < 30; k++) {
    float h = map(p + L * t, true).x;
    s = min(s, 9.0 * h / t);
    t += clamp(h, 0.015, 0.25);
    if (s < 0.01 || t > 4.0) break;
  }
  return clamp(s, 0.0, 1.0);
}
float ao(vec3 p, vec3 n) {
  float a = 0.0, w = 1.0;
  for (int k = 1; k <= 5; k++) {
    float h = 0.016 * float(k * k);
    a += w * (h - map(p + n * h, true).x);
    w *= 0.62;
  }
  return clamp(1.0 - 2.6 * a, 0.0, 1.0);
}

// the sun comes through a tall casement to the left of the shelf: two leaves, glazing bars, and a plant on the sill
float casement(vec3 p) {
  vec3 a = normalize(cross(L, vec3(0.0, 1.0, 0.0))), b = cross(a, L);
  vec2 w = vec2(dot(p, a), dot(p, b)) - vec2(-0.2, -0.1);
  float pen = 0.02 + 0.03 * clamp(dot(p, -L) + 2.0, 0.0, 4.0);
  vec2 e = vec2(2.25, 1.6) - abs(w);
  float m = smoothstep(-pen, pen, e.x) * smoothstep(-pen, pen, e.y);
  vec2 g = abs(fract(w / vec2(1.15, 0.78) + 0.5) - 0.5) * vec2(1.15, 0.78);
  m *= smoothstep(0.02, 0.02 + pen, g.x) * smoothstep(0.014, 0.014 + pen, g.y);
  // leaves of the sill plant breaking up the light at one corner
  float leaf = smoothstep(0.6, 0.66, fbm(w * 3.4 + vec2(sin(uTime * 0.5) * 0.08, 0.0))) * smoothstep(0.0, 1.2, -w.y - 0.3 + w.x * 0.4);
  return m * (1.0 - 0.7 * leaf);
}

vec3 env(vec3 r) {
  vec3 c = mix(vec3(0.62, 0.5, 0.48), vec3(0.95, 0.84, 0.82), smoothstep(-0.3, 0.6, r.y)) * 0.7;
  c = mix(c, vec3(0.6, 0.7, 0.66) * 0.6, smoothstep(0.05, -0.2, r.y));
  // the window: bright panes with a cross bar, on the left
  vec3 wd = normalize(vec3(-0.75, 0.42, 0.52));
  float d = dot(r, wd);
  if (d > 0.0) {
    vec3 a = normalize(cross(wd, vec3(0.0, 1.0, 0.0))), b = cross(a, wd);
    vec2 q = vec2(dot(r, a), dot(r, b)) / d;
    float pane = smoothstep(0.04, 0.0, max(abs(q.x) - 0.38, abs(q.y) - 0.6));
    pane *= smoothstep(0.0, 0.02, abs(q.x)) * smoothstep(0.0, 0.02, abs(q.y - 0.1));
    c += vec3(1.0, 0.97, 0.92) * 9.0 * pane;
  }
  // a soft second window behind the camera
  c += vec3(0.9, 0.94, 1.0) * 1.4 * smoothstep(0.7, 0.95, dot(r, normalize(vec3(0.3, 0.3, 1.0))));
  return c;
}

vec3 shelfAlb(vec3 p) {
  // painted pine: a pale mint coat with the grain telegraphing through
  float g = fbm(vec2(p.x * 1.2, p.z * 22.0 + 4.0 * fbm(p.xz * 0.8)));
  vec3 a = vec3(0.4, 0.62, 0.5) * (0.93 + 0.1 * g);
  return a * (0.97 + 0.05 * vnoise(p.xz * 180.0));
}
vec3 wallAlb(vec3 p) {
  float f = fbm(p.xy * 1.4 + 3.0);
  vec3 a = mix(vec3(0.78, 0.47, 0.42), vec3(0.86, 0.58, 0.52), f);
  return a * (0.97 + 0.05 * vnoise(p.xy * 60.0));
}

vec3 shadeJar(int i, vec3 p, vec3 rd, vec3 n, float jit) {
  vec4 J = uJ[i];
  vec3 q = toJ(p, i);
  float R = J.z, H = J.w;
  float t = q.y / H, ang = atan(q.x, q.z);
  float rho = length(q.xz);
  bool inside = rho < prof(q.y, R, H) - wall(R) * 0.5 && q.y < H * 0.985;
  vec2 s = vec2(ang * R, q.y);
  vec3 glaze = uGl[i];
  // glaze pools darker where it runs thick: just above the drip line and around the shoulder
  float drip = H * 0.075 + 0.014 * sin(s.x * 26.0 + float(i)) + 0.02 * (vnoise(vec2(s.x * 9.0, 1.0)) - 0.5);
  float pool = smoothstep(0.05, 0.0, abs(q.y - drip - 0.02)) * 0.4 + smoothstep(0.08, 0.0, abs(t - 0.8)) * 0.2;
  vec3 alb = glaze * (1.0 - pool * 0.55) * (0.92 + 0.12 * fbm(s * 7.0 + float(i) * 3.0));
  // iron speckle from the clay body
  float sp = smoothstep(0.9, 0.93, vnoise(s * 140.0 + float(i) * 11.0)) * 0.8 + smoothstep(0.94, 0.96, vnoise(s * 60.0 + 5.0)) * 0.6;
  alb = mix(alb, vec3(0.12, 0.07, 0.04), sp * (i == 0 ? 0.75 : 0.35));
  float gloss = 1.0;
  float raw = 1.0 - smoothstep(-0.004, 0.004, q.y - drip);
  if (raw > 0.0) {
    vec3 clay = vec3(0.74, 0.6, 0.47) * (0.85 + 0.25 * vnoise(s * 60.0));
    alb = mix(alb, clay, raw);
    gloss = 1.0 - raw * 0.92;
  }
  // the plan is painted in white slip on the front of the belly
  if (!inside) {
    float u = ang / 2.1 + 0.5;
    float v = (t - 0.3) / 0.42;
    if (u > 0.0 && u < 1.0 && v > 0.0 && v < 1.0) {
      float m = texture(uTex, vec2(u, (float(i) + v) / 3.0)).r;
      alb = mix(alb, uSp[i], m * 0.96);
      gloss *= 1.0 - 0.3 * m;
    }
  } else {
    alb *= 0.8;
  }
  // a slow ripple from the throwing lines catches the reflections
  vec3 nb = normalize(n + dirW(vec3(0.0, 1.0, 0.0), i) * (vnoise(vec2(s.y * 26.0, ang * 0.5)) - 0.5) * 0.05);
  float sh = shadow(p + n * 0.01) * casement(p);
  float oc = ao(p, n);
  float ndl = max(dot(nb, L), 0.0);
  vec3 col = alb * (SUN * ndl * sh + SKY * oc * (0.55 + 0.45 * nb.y) + vec3(0.6, 0.78, 0.7) * 0.18 * oc * max(-nb.y, 0.0) + vec3(0.95, 0.75, 0.7) * 0.14 * oc * max(-nb.z, 0.0));
  // glaze: a clear coat over the colour
  float F = (0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, nb), 0.0, 1.0), 5.0)) * gloss;
  vec3 Rf = reflect(rd, nb);
  vec3 refl = env(Rf) * mix(0.35, 1.0, oc);
  refl += SUN * sh * (24.0 * pow(max(dot(Rf, L), 0.0), 600.0) + 0.6 * pow(max(dot(Rf, L), 0.0), 40.0));
  col = mix(col, refl, F * (inside ? 0.5 : 1.0));
  col += SUN * sh * gloss * 0.04 * pow(max(dot(Rf, L), 0.0), 8.0);
  return col;
}

vec3 shadeHoney(vec3 p, vec3 rd, vec3 n, float jit) {
  float sh = shadow(p + n * 0.01) * casement(p);
  float oc = 0.45 + 0.55 * ao(p, n);
  vec3 deep = vec3(0.5, 0.2, 0.025), thin = vec3(1.0, 0.62, 0.14);
  // light that enters the honey comes back out amber; the lit edge glows
  float tr = sh * (0.4 + 0.6 * max(dot(n, L), 0.0));
  vec3 col = deep * SKY * oc * 1.3 + thin * thin * SUN * tr * 0.45 + deep * SUN * sh * 0.25 + thin * deep * 0.5;
  float F = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 R = reflect(rd, n);
  vec3 refl = env(R) * mix(0.3, 1.0, oc) + SUN * sh * 30.0 * pow(max(dot(R, L), 0.0), 900.0);
  return mix(col, refl, F);
}

vec3 shadeShelf(vec3 p, vec3 rd, vec3 n) {
  vec3 alb = n.z > 0.5 ? shelfAlb(p.zyx * vec3(1.0, 1.0, 1.0)) * 0.95 : shelfAlb(p);
  float sh = shadow(p + n * 0.003) * casement(p);
  float oc = ao(p, n);
  // the honey jars throw a little colour onto the paint beside them
  vec3 bleed = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    vec3 d = vec3(uJ[i].x, uJ[i].w * 0.35, uJ[i].y) - p;
    bleed += uGl[i] * uGl[i] * uJ[i].z * 0.18 / (dot(d, d) + 0.08);
  }
  vec3 col = alb * (SUN * max(dot(n, L), 0.0) * sh + SKY * oc + bleed * SUN * 0.06 * oc);
  float F = 0.03 + 0.5 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  col += SUN * sh * 0.05 * pow(max(dot(reflect(rd, n), L), 0.0), 30.0);
  // soft satin reflection of whatever stands on the shelf
  if (n.y > 0.5) {
    vec3 R = reflect(rd, n);
    float t = 0.02;
    for (int k = 0; k < 18; k++) {
      vec2 h = map(p + R * t, false);
      if (h.x < 0.004) { col = mix(col, uGl[int(h.y)] * SKY * 0.9, 0.22 * exp(-t * 2.5)); break; }
      t += h.x;
      if (t > 1.2) break;
    }
  }
  return col * (1.0 - 0.0 * F);
}

vec3 shadeWall(vec3 p) {
  vec3 n = vec3(0.0, 0.0, 1.0);
  vec3 alb = wallAlb(p);
  float sh = shadow(p + n * 0.003) * casement(p);
  // under the shelf the board blocks the sun
  if (p.y < 0.0) {
    float k = -p.y / L.y;
    float z = p.z + L.z * k;
    sh *= smoothstep(FRONT + 0.02, FRONT - 0.06, z) < 0.5 ? 1.0 : 0.0;
  }
  float oc = ao(p, n) * (0.55 + 0.45 * smoothstep(0.0, 0.5, abs(p.y)));
  return alb * (SUN * max(dot(n, L), 0.0) * sh + SKY * oc * 0.95 + vec3(0.6, 0.78, 0.7) * 0.1 * smoothstep(0.6, 0.0, p.y) * step(0.0, p.y));
}

vec3 tonemap(vec3 x) { x *= 0.55; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  vec2 ndc = vUv * 2.0 - 1.0 - uShift;
  vec3 rd = normalize(uFw + uRt * (ndc.x * uTan * uAspect) + uUp * (ndc.y * uTan));
  float jit = ign(gl_FragCoord.xy);
  // the set: shelf top, shelf front edge, then the wall
  float tp = 1e9; int pid = -1; vec3 pn = vec3(0.0);
  if (rd.y < 0.0) { float t = -uCam.y / rd.y; vec3 h = uCam + rd * t; if (h.z < FRONT && h.z > WZ) { tp = t; pid = 0; pn = vec3(0.0, 1.0, 0.0); } }
  if (rd.z < 0.0) {
    float t = (FRONT - uCam.z) / rd.z; vec3 h = uCam + rd * t;
    if (t < tp && h.y < 0.0 && h.y > -0.11) { tp = t; pid = 1; pn = vec3(0.0, 0.0, 1.0); }
    t = (WZ - uCam.z) / rd.z;
    if (t < tp) { tp = t; pid = 2; pn = vec3(0.0, 0.0, 1.0); }
  }
  // the jars
  float t = 0.0; float id = -1.0;
  float tmax = min(tp, 30.0);
  t = max(0.0, (uCam.z - 1.6) / max(-rd.z, 0.05));
  for (int k = 0; k < 110; k++) {
    vec2 h = map(uCam + rd * t, true);
    if (h.x < 0.0006 * t) { id = h.y; break; }
    t += h.x;
    if (t > tmax) break;
  }
  vec3 col;
  float depth;
  if (id >= 0.0 && t < tmax) {
    vec3 p = uCam + rd * t;
    vec3 n = nrm(p, true);
    int k = int(id + 0.5);
    col = k < 3 ? shadeJar(k, p, rd, n, jit) : shadeHoney(p, rd, n, jit);
    depth = t;
  } else {
    vec3 p = uCam + rd * tp;
    col = pid == 2 ? shadeWall(p) : shadeShelf(p, rd, pn);
    if (pid == 1) col *= 0.82;
    depth = tp;
  }
  // light in the air near the window
  col += vec3(1.0, 0.9, 0.78) * 0.035 * smoothstep(0.4, -1.0, dot(rd, vec3(1.0, 0.0, 0.0)));
  float z = depth * dot(rd, uFw);
  float coc = clamp(uAperture * (1.0 - uFocus / max(z, 0.05)), -1.0, 1.0);
  o = vec4(pow(tonemap(col), vec3(1.0 / 2.2)), 0.5 + 0.5 * coc);
}`;

const VS = `#version 300 es
out vec2 vUv;
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const FS_LENS = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uPx;
uniform float uMaxR, uTime;
in vec2 vUv;
out vec4 o;
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  vec4 c0 = texture(uScene, vUv);
  float s0 = c0.a * 2.0 - 1.0, coc0 = abs(s0);
  vec3 acc = c0.rgb; float wsum = 1.0;
  float rot = 6.2832 * ign(gl_FragCoord.xy);
  for (int k = 1; k < 20; k++) {
    float r = sqrt(float(k) / 20.0) * uMaxR;
    float a = float(k) * 2.39996 + rot;
    vec4 s = texture(uScene, vUv + vec2(cos(a), sin(a)) * r * uPx);
    float sc = s.a * 2.0 - 1.0, cs = abs(sc);
    if (sc > s0) cs = min(cs, coc0 * 1.6 + 0.02);
    float w = smoothstep(r - 1.0, r + 1.0, cs * uMaxR);
    acc += s.rgb * w; wsum += w;
  }
  vec3 col = acc / wsum;
  // smooth the stair-steps along the jar silhouettes where the lens has not already softened them
  const vec3 LU = vec3(0.299, 0.587, 0.114);
  vec3 cNW = texture(uScene, vUv + vec2(-1.0, -1.0) * uPx).rgb, cNE = texture(uScene, vUv + vec2(1.0, -1.0) * uPx).rgb;
  vec3 cSW = texture(uScene, vUv + vec2(-1.0, 1.0) * uPx).rgb, cSE = texture(uScene, vUv + vec2(1.0, 1.0) * uPx).rgb;
  float lNW = dot(cNW, LU), lNE = dot(cNE, LU), lSW = dot(cSW, LU), lSE = dot(cSE, LU), lM = dot(c0.rgb, LU);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
  float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078));
  dir = clamp(dir * rcp, -8.0, 8.0) * uPx;
  vec3 fa = 0.5 * (texture(uScene, vUv + dir * (1.0 / 3.0 - 0.5)).rgb + texture(uScene, vUv + dir * (2.0 / 3.0 - 0.5)).rgb);
  vec3 fb = fa * 0.5 + 0.25 * (texture(uScene, vUv - dir * 0.5).rgb + texture(uScene, vUv + dir * 0.5).rgb);
  float lB = dot(fb, LU);
  vec3 fx = (lB < lMin || lB > lMax) ? fa : fb;
  col = mix(fx, col, smoothstep(0.05, 0.3, coc0));
  vec2 q = vUv - 0.5;
  col *= 1.0 - 0.32 * dot(q, q);
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

/** The slip painting on each jar: plan name, the example price and its label. One band per plan. */
function artwork() {
  const W = 1024, H = 512;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H * plans.length;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  const tracked = (s: string, y: number, font: string, gap: number) => {
    ctx.font = font;
    const w = [...s].map((c) => ctx.measureText(c).width + gap);
    let x = W / 2 - (w.reduce((a, b) => a + b, 0) - gap) / 2;
    ctx.textAlign = "left";
    [...s].forEach((c, i) => {
      ctx.fillText(c, x, y);
      x += w[i];
    });
  };
  plans.forEach((plan, i) => {
    // the texture is flipped on upload, so plan 0 is drawn in the bottom band
    const y0 = (plans.length - 1 - i) * H;
    ctx.save();
    ctx.translate(0, y0);
    tracked(plan.name.toUpperCase(), 96, `600 64px ${GROTESK}`, 14);
    ctx.fillRect(W / 2 - 150, 128, 300, 5);
    tracked(`$${plan.price}`, 354, `italic 500 230px ${SERIF}`, -6);
    tracked("A MONTH · EXAMPLE", 452, `600 42px ${GROTESK}`, 8);
    ctx.restore();
  });
  return cv;
}

type Sim = {
  a: number[]; om: number[]; fill: number[]; sl: number[]; vsl: number[]; pour: number; pourAt: number;
  plan: number; dirty: boolean; touched: boolean;
};

/** The same shelf drawn with plain elements, for browsers without WebGL 2. */
function Still({ plan }: { plan: number }) {
  const hex = ["#cdb37f", "#e27a4f", "#1f3f86"];
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(180deg, ${WALL} 0%, #f3ddd5 60%, #b6d4c4 60%, #a9cbb9 74%, #7f9f8f 74%, #d8b9b0 77%, #c9a69c 100%)` }}>
      <div className="absolute left-0 top-0 h-[60%] w-[55%]" style={{ background: "linear-gradient(115deg, rgba(255,247,232,0.75), rgba(255,247,232,0) 70%)" }} />
      {plans.map((p, i) => {
        const lit = i === plan;
        const w = p.radius * 26;
        return (
          <div key={p.name} className="absolute -translate-x-1/2" style={{ left: `${[24, 50, 77][i]}%`, bottom: "31%", width: `${w}%`, aspectRatio: `${(p.radius * 2) / p.height}` }}>
            <div className="absolute -bottom-[3%] left-[20%] h-[8%] w-[110%] rounded-[50%] bg-black/25 blur-md" />
            <div className="absolute inset-0 rounded-b-[22%] rounded-t-[38%]" style={{ background: `radial-gradient(circle at 30% 34%, rgba(255,255,255,0.55), rgba(255,255,255,0) 18%), linear-gradient(90deg, ${hex[i]} 0%, ${hex[i]} 45%, rgba(0,0,0,0.35) 100%), ${hex[i]}`, backgroundBlendMode: "screen, multiply, normal", transform: lit ? "rotate(-4deg)" : "none", transformOrigin: "50% 100%" }}>
              <div className="absolute inset-x-0 top-[34%] text-center text-[#f6efe2]" style={{ fontFamily: GROTESK }}>
                <div className="text-[8px] font-semibold uppercase tracking-[0.2em] sm:text-[11px]">{p.name}</div>
                <div className="text-[clamp(18px,4vw,48px)] italic leading-none" style={{ fontFamily: SERIF }}>${p.price}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GlazedJarPricing() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [plan, setPlan] = useState(1);
  const [mode, setMode] = useState<"pending" | "gl" | "still">("pending");
  const [marks, setMarks] = useState<number[]>([26, 50, 75]);
  const [handled, setHandled] = useState(false);
  const sim = useRef<Sim>({ a: [0, 0, 0], om: [0, 0, 0], fill: [0, 1, 0], sl: [0, 0, 0], vsl: [0, 0, 0], pour: 0, pourAt: -1, plan: 1, dirty: true, touched: false });

  // choosing a plan: the jar rocks forward on its foot and honey pours in
  useEffect(() => {
    const s = sim.current;
    if (s.plan !== plan) {
      s.plan = plan;
      const p = plans[plan];
      const hc = p.height * 0.48, phi = Math.atan(p.radius / hc);
      const K = (9.8 * Math.hypot(p.radius, hc)) / ((4 / 3) * (p.radius * p.radius + hc * hc));
      s.om[plan] = Math.sqrt(2 * K * (Math.cos(phi - ROCK) - Math.cos(phi)) * 1.02);
      s.pourAt = 0.32;
    }
    s.dirty = true;
  }, [plan]);

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
    let pScene: WebGLProgram, pLens: WebGLProgram;
    try {
      pScene = program(gl, VS, GLSL);
      pLens = program(gl, VS, FS_LENS);
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
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    const vao = gl.createVertexArray();
    const fbo = gl.createFramebuffer();
    const tex = gl.createTexture();
    let W = 0, H = 0, scale = Math.min(window.devicePixelRatio || 1, 2), cssW = 1, cssH = 1;
    const TAN = Math.tan((10 * Math.PI) / 180);
    const cam = { pos: [0, 2, 10], rt: [1, 0, 0], up: [0, 1, 0], fw: [0, 0, -1], shift: [0, 0], focus: 8 };

    const aim = (sx: number, sy: number) => {
      const aspect = cssW / cssH;
      const wide = aspect > 1.2;
      const dist = Math.max(9.2, 1.85 / (TAN * aspect));
      const el = 0.3;
      const target = [0, 0.5, 0];
      cam.pos = [target[0] + sx, target[1] + Math.sin(el) * dist + sy, target[2] + Math.cos(el) * dist];
      let fw = [target[0] - cam.pos[0], target[1] - cam.pos[1], target[2] - cam.pos[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]);
      fw = fw.map((v) => v / fl);
      let rt = [-fw[2], 0, fw[0]];
      const rl = Math.hypot(rt[0], rt[2]);
      rt = rt.map((v) => v / rl);
      cam.fw = fw;
      cam.rt = rt;
      cam.up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      cam.shift = wide ? [0.08, -0.36] : [0, -0.48];
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
      if (cssW * cssH * k * k > 1.6e6) k = Math.sqrt(1.6e6 / (cssW * cssH));
      const w = Math.max(2, Math.round(cssW * k)), h = Math.max(2, Math.round(cssH * k));
      aim(0, 0);
      setMarks(XS.map((x) => (project([x, 0, 0])[0] / cssW) * 100));
      if (w === W && h === H) return;
      W = w;
      H = h;
      canvas.width = W;
      canvas.height = H;
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      s.dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    // where the honey sits, the edge each jar rocks on and where the thread of honey lands
    const pose = (i: number) => {
      const p = plans[i], a = s.a[i], sg = a >= 0 ? 1 : -1, c = Math.cos(a), sn = Math.sin(a);
      const piv = [XS[i], 0, sg * p.radius];
      const th = 0.03 + 0.02 * p.radius;
      const yb = th * 1.8, yt = p.height * 0.9;
      const y = yb + s.fill[i] * (yt - yb);
      const level = s.fill[i] < 0.01 ? -5 : y * c + sg * p.radius * Math.abs(sn);
      const mouthZ = p.height * sn + sg * p.radius * (1 - c);
      return { piv, off: sg * p.radius, c, sn, level, mouthZ };
    };
    let pointer = [0, 0], view = [0, 0];

    const draw = (t: number) => {
      const aspect = aim(view[0], view[1]);
      gl.bindVertexArray(vao);
      gl.viewport(0, 0, W, H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.useProgram(pScene);
      const J: number[] = [], CS: number[] = [], PV: number[] = [], OF: number[] = [], LV: number[] = [], SL: number[] = [], GL: number[] = [], SP: number[] = [];
      plans.forEach((p, i) => {
        const q = pose(i);
        J.push(XS[i], 0, p.radius, p.height);
        CS.push(q.c, q.sn);
        PV.push(...q.piv);
        OF.push(q.off);
        LV.push(q.level);
        SL.push(s.sl[i]);
        GL.push(...p.glaze);
        SP.push(...p.slip);
      });
      gl.uniform4fv(U(pScene, "uJ"), J);
      gl.uniform2fv(U(pScene, "uCS"), CS);
      gl.uniform3fv(U(pScene, "uPiv"), PV);
      gl.uniform1fv(U(pScene, "uOff"), OF);
      gl.uniform1fv(U(pScene, "uLv"), LV);
      gl.uniform1fv(U(pScene, "uSl"), SL);
      gl.uniform3fv(U(pScene, "uGl"), GL);
      gl.uniform3fv(U(pScene, "uSp"), SP);
      const q = pose(s.plan);
      gl.uniform4f(U(pScene, "uStream"), XS[s.plan], q.mouthZ, 0.022 * s.pour, Math.max(q.level, 0.05));
      gl.uniform1i(U(pScene, "uTex"), 0);
      gl.uniform3fv(U(pScene, "uCam"), cam.pos);
      gl.uniform3fv(U(pScene, "uRt"), cam.rt);
      gl.uniform3fv(U(pScene, "uUp"), cam.up);
      gl.uniform3fv(U(pScene, "uFw"), cam.fw);
      gl.uniform1f(U(pScene, "uTan"), TAN);
      gl.uniform1f(U(pScene, "uAspect"), aspect);
      gl.uniform2fv(U(pScene, "uShift"), cam.shift);
      gl.uniform1f(U(pScene, "uFocus"), cam.focus);
      gl.uniform1f(U(pScene, "uAperture"), 1.6);
      gl.uniform1f(U(pScene, "uTime"), t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(pLens);
      gl.uniform1i(U(pLens, "uScene"), 1);
      gl.uniform2f(U(pLens, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(pLens, "uMaxR"), H * 0.007);
      gl.uniform1f(U(pLens, "uTime"), reduce ? 0 : t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // A jar on the edge of its foot is an upside-down pendulum: gravity pulls it back until it lands and rocks once the other way.
    const physics = (dt: number) => {
      plans.forEach((p, i) => {
        const hc = p.height * 0.48, phi = Math.atan(p.radius / hc);
        const K = (9.8 * Math.hypot(p.radius, hc)) / ((4 / 3) * (p.radius * p.radius + hc * hc));
        const a0 = s.a[i];
        const acc = a0 === 0 && s.om[i] === 0 ? 0 : -Math.sign(a0 || s.om[i]) * K * Math.sin(phi - Math.abs(a0));
        const before = s.om[i];
        s.om[i] += acc * dt;
        let a = a0 + s.om[i] * dt;
        if (a0 !== 0 && Math.sign(a) !== Math.sign(a0)) {
          // landing on the foot: most of the speed goes into the shelf
          const v = s.om[i] * BOUNCE;
          a = 0;
          s.om[i] = Math.abs(v) < 0.08 ? 0 : v;
        }
        s.a[i] = a;
        // the honey lags behind the jar and slops back
        const angAcc = (s.om[i] - before) / Math.max(dt, 1e-4);
        s.vsl[i] += (-60 * s.sl[i] - 3.2 * s.vsl[i] - angAcc * 0.012) * dt;
        s.sl[i] = clamp(s.sl[i] + s.vsl[i] * dt, -0.35, 0.35);
        const want = i === s.plan ? 1 : 0;
        if (want === 0) s.fill[i] = Math.max(0, s.fill[i] - dt * 0.9);
      });
      if (s.pourAt >= 0) {
        s.pourAt -= dt;
        if (s.pourAt < 0) s.pourAt = -1;
      }
      const filling = s.pourAt < 0 && s.fill[s.plan] < 1;
      if (filling && s.pourAt === -1) s.fill[s.plan] = Math.min(1, s.fill[s.plan] + dt / FILL_SECONDS);
      const target = s.pourAt === -1 && s.fill[s.plan] < 0.995 ? 1 : 0;
      s.pour += (target - s.pour) * Math.min(1, dt * (target ? 9 : 3.5));
      if (s.pour < 0.02 && !target) s.pour = 0;
    };
    const settle = () => {
      plans.forEach((_, i) => {
        s.a[i] = 0;
        s.om[i] = 0;
        s.sl[i] = s.vsl[i] = 0;
        s.fill[i] = i === s.plan ? 1 : 0;
      });
      s.pour = 0;
      s.pourAt = -1;
    };
    settle();

    let raf = 0, visible = true, last = performance.now(), slow = 0, frames = 0;
    const t0 = last;
    let played = 0, demoAt = 4.0, step = 0;
    const tick = (now: number) => {
      const real = now - last;
      const dt = clamp(real / 1000, 0, 0.05);
      last = now;
      const t = (now - t0) / 1000;
      if (reduce) {
        if (s.dirty) settle();
      } else {
        const sub = Math.max(1, Math.ceil(dt / 0.004));
        for (let i = 0; i < sub; i++) physics(dt / sub);
        played += dt;
        view[0] += (pointer[0] * 0.35 + 0.12 * Math.sin(t * 0.21) - view[0]) * Math.min(1, dt * 3);
        view[1] += (pointer[1] * 0.18 - view[1]) * Math.min(1, dt * 3);
        if (DEMO && !s.touched && played > demoAt) {
          const script = [2, 0, 1];
          setPlan(script[step % script.length]);
          step++;
          demoAt = played + 3.6;
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
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (visible) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(tick);

    // pressing a jar chooses its plan
    const over = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      for (let i = 0; i < plans.length; i++) {
        const p = plans[i];
        const a = project([XS[i] - p.radius, p.height, 0]), b = project([XS[i] + p.radius, 0, p.radius]);
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
      const r = wrap.getBoundingClientRect();
      pointer = [((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * -2];
      canvas.style.cursor = over(e) >= 0 ? "pointer" : "";
    };
    const leave = () => {
      pointer = [0, 0];
    };
    const lost = (e: Event) => {
      e.preventDefault();
      setMode("still");
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("webglcontextlost", lost);
    wrap.addEventListener("keydown", touch);
    wrap.addEventListener("focusin", touch);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("webglcontextlost", lost);
      wrap.removeEventListener("keydown", touch);
      wrap.removeEventListener("focusin", touch);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduce]);

  const chosen = plans[plan];
  const check = (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
  const cta = (
    <a
      href="#"
      className="inline-flex h-11 items-center gap-3 rounded-full bg-[#2a1c19] pl-5 pr-4 text-[14px] font-semibold text-[#fbefe9] transition hover:bg-[#432c27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a1c19] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ecd3cb]"
    >
      Start with {chosen.name}
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10h12M11 5l5 5-5 5" />
      </svg>
    </a>
  );

  return (
    <section className="relative overflow-hidden" style={{ fontFamily: GROTESK, background: WALL, color: INK }}>
      <div ref={wrapRef} className="relative h-[620px] w-full sm:h-[780px]">
        <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full touch-pan-y ${mode === "still" ? "hidden" : ""}`} />
        {mode === "still" && <Still plan={plan} />}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-4 p-5 sm:p-9">
          <p className="flex items-baseline gap-3">
            <span className="text-[22px] italic leading-none sm:text-[26px]" style={{ fontFamily: SERIF, letterSpacing: "-0.02em" }}>
              {product.name}
            </span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2a1c19]/75 sm:inline">{product.line}</span>
          </p>
          <span className="rounded-full border border-[#2a1c19]/30 bg-[#fbefe9]/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm">Example prices</span>
        </div>

        <div className="pointer-events-none absolute left-5 top-[70px] sm:left-9 sm:top-[104px]" aria-live={handled ? "polite" : "off"}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#2a1c19]/80">
            <span className="tabular-nums">{`0${plan + 1}`}</span>
            <span className="mx-2 text-[#2a1c19]/45">/</span>
            {chosen.name}
          </p>
          <h2 className="mt-1 flex items-start pb-1 font-semibold leading-[0.84]" style={{ letterSpacing: "-0.06em" }}>
            <span className="mr-1 mt-[0.12em] text-[34px] font-medium sm:text-[60px]" style={{ letterSpacing: 0 }}>
              $
            </span>
            <span className="overflow-hidden">
              <motion.span
                key={plan}
                initial={reduce ? false : { y: "0.6em", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                className="block text-[88px] tabular-nums sm:text-[160px]"
              >
                {chosen.price}
              </motion.span>
            </span>
            <span className="ml-3 mt-[0.6em] text-[11px] font-semibold uppercase leading-[1.5] tracking-[0.2em] text-[#2a1c19]/80 sm:ml-4 sm:mt-[1.4em] sm:text-[12px]">
              a month
              <span className="block normal-case tracking-normal" style={{ letterSpacing: "0.01em" }}>
                example price
              </span>
            </span>
          </h2>
          <p className="mt-1 max-w-[19ch] text-[19px] italic leading-tight sm:mt-2 sm:max-w-none sm:text-[25px]" style={{ fontFamily: SERIF, letterSpacing: "-0.01em" }}>
            {chosen.pitch}
          </p>
        </div>

        <div className="absolute right-9 top-[104px] hidden w-[262px] lg:block">
          <ul className="space-y-2 border-t border-[#2a1c19]/25 pt-3.5 text-[14px] leading-snug">
            {chosen.features.map((f) => (
              <li key={f} className="flex gap-3">
                {check}
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-4">{cta}</div>
        </div>

        <fieldset className="absolute inset-x-0 bottom-4 h-11 sm:bottom-6">
          <legend className="sr-only">Plan</legend>
          {plans.map((p, i) => (
            <label
              key={p.name}
              htmlFor={`glazed-jar-pricing-plan-${i}`}
              className="absolute top-0 -translate-x-1/2 cursor-pointer"
              style={{ left: `${mode === "still" ? [24, 50, 77][i] : marks[i]}%` }}
            >
              <input id={`glazed-jar-pricing-plan-${i}`} type="radio" name="glazed-jar-pricing-plan" value={p.name} checked={plan === i} onChange={() => setPlan(i)} className="peer sr-only" />
              <span className="flex h-11 items-center gap-2 whitespace-nowrap rounded-full border border-[#2a1c19]/15 bg-[#fbefe9]/90 pl-2.5 pr-3 text-[11px] font-semibold uppercase tracking-[0.08em] shadow-[0_6px_18px_rgba(60,30,20,0.18)] transition peer-checked:bg-[#2a1c19] peer-checked:text-[#fbefe9] peer-focus-visible:ring-2 peer-focus-visible:ring-[#2a1c19] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#fbefe9] sm:gap-2.5 sm:pl-3.5 sm:pr-4 sm:text-[13px] sm:tracking-[0.14em]">
                <span className={`grid h-4 w-4 place-items-center rounded-full border-[1.5px] ${plan === i ? "border-[#fbefe9]" : "border-[#2a1c19]/60"}`}>
                  <span className={`h-2 w-2 rounded-full bg-[#fbefe9] transition-transform ${plan === i ? "scale-100" : "scale-0"}`} />
                </span>
                {p.name}
                <span className="hidden font-medium normal-case tracking-normal opacity-80 sm:inline">${p.price}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      <div className="border-t border-[#2a1c19]/15 px-5 pb-8 pt-6 lg:hidden">
        <ul className="space-y-2.5 text-[15px] leading-snug">
          {chosen.features.map((f) => (
            <li key={f} className="flex gap-3">
              {check}
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-6">{cta}</div>
        <p className="mt-4 text-[13px] text-[#2a1c19]/80">Prices shown are examples. Set your own in the plans list.</p>
      </div>
    </section>
  );
}
