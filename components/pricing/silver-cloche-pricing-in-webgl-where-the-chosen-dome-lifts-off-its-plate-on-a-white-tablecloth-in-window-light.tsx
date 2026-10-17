import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** The product and its three plans. These are example prices: change them to your own. */
const product = { name: "Brasswick", line: "Reservations and floor plans for restaurants" };
const plans = [
  {
    name: "Bistro",
    price: 19,
    pitch: "One room, every table accounted for.",
    features: ["1 dining room, 40 covers", "Online bookings and walk-ins", "Reminder texts to guests"],
    dome: 0.44, // cloche radius in metres; the plate is sized from it
  },
  {
    name: "Brasserie",
    price: 49,
    pitch: "Two sittings a night without a clash.",
    features: ["Up to 3 rooms, 160 covers", "Drag-and-drop floor plan", "Deposits for large parties", "Waitlist on a tablet"],
    dome: 0.5,
  },
  {
    name: "Grand Salon",
    price: 119,
    pitch: "Private dining, terraces and events.",
    features: ["Unlimited rooms and covers", "Event menus and run sheets", "Group booking pages", "A named setup host"],
    dome: 0.56,
  },
];

const GAP = 0.3; // tablecloth between neighbouring plates
const LIFT = 0.5; // how high the chosen cloche is raised, in metres
const TILT = 1.12; // how far its front edge tips up, in radians
const DEMO = true; // lifts the cloches in turn until somebody touches it
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const INK = "#1f1b17";
const CLOTH = "#ebe8e2";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const PLATE = (a: number) => a * 1.24;
const XS = (() => {
  const total = plans.reduce((s, p) => s + PLATE(p.dome) * 2, 0) + GAP * (plans.length - 1);
  let x = -total / 2;
  return plans.map((p) => {
    const c = x + PLATE(p.dome);
    x += PLATE(p.dome) * 2 + GAP;
    return c;
  });
})();
const domeH = (a: number) => a * 0.86 + 0.03;
const SEAT = 0.038; // where the cloche rim rests on the plate
const SUN_DIR = (() => {
  const v = [-0.66, 0.56, -0.3];
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((x) => x / l);
})();

const GLSL = `#version 300 es
precision highp float;
const vec3 L = vec3(${SUN_DIR.map((v) => v.toFixed(4)).join(", ")});
const vec3 SUN = vec3(1.0, 0.93, 0.82) * 3.2;
const vec3 SKY = vec3(0.82, 0.85, 0.9) * 0.7;
const float WZ = -3.6;
uniform vec4 uC[3];      // x, z, dome radius, dome height
uniform vec3 uO[3];      // where the cloche rim centre is now
uniform vec2 uCS[3];     // cos and sin of its tilt
uniform float uR[3];     // plate radius
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
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

vec3 toL(vec3 d, int i) { vec2 r = uCS[i]; return vec3(d.x, d.y * r.x - d.z * r.y, d.y * r.y + d.z * r.x); }

float ell(vec3 q, vec3 r) { float k0 = length(q / r), k1 = length(q / (r * r)); return k0 * (k0 - 1.0) / max(k1, 1e-4); }

// the cloche in its own frame: a thin spun dome, a rolled bead at the rim and a turned knob
float cloche(vec3 q, float a, float b) {
  float rho = length(q.xz);
  float shell = abs(ell(q, vec3(a, b, a))) - 0.009;
  shell = max(shell, -q.y);
  float bead = length(vec2(rho - a, q.y - 0.016)) - 0.017;
  float band = length(vec2(rho - a * 0.985, q.y - 0.075)) - 0.006;
  float d = min(min(shell, bead), band);
  float stem = max(rho - 0.02 - 0.012 * smoothstep(b + 0.035, b, q.y), abs(q.y - b - 0.02) - 0.03);
  float knob = ell(q - vec3(0.0, b + 0.072, 0.0), vec3(0.052, 0.036, 0.052));
  return min(d, smin(stem, knob, 0.02));
}
float plateTop(float rho, float R) {
  return 0.02 + 0.026 * smoothstep(0.62 * R, 0.86 * R, rho) - 0.02 * smoothstep(0.93 * R, R, rho);
}
float plate(vec3 p, int i) {
  float R = uR[i];
  float rho = length(p.xz - uC[i].xy);
  return max(rho - R, max(p.y - plateTop(rho, R), 0.004 - p.y)) * 0.8;
}

// id: 0..2 cloches, 3..5 plates
vec2 map(vec3 p) {
  vec2 res = vec2(1e9, -1.0);
  for (int i = 0; i < 3; i++) {
    vec4 C = uC[i];
    float pb = length(vec2(max(length(p.xz - C.xy) - uR[i], 0.0), max(p.y - 0.05, 0.0)));
    float dp = pb > 0.1 ? pb : plate(p, i);
    if (dp < res.x) res = vec2(dp, float(3 + i));
    vec3 q = toL(p - uO[i], i);
    float bound = length(q - vec3(0.0, C.w * 0.5, 0.0)) - max(C.z, C.w) - 0.12;
    float dc = bound > 0.1 ? bound : cloche(q, C.z, C.w);
    if (dc < res.x) res = vec2(dc, float(i));
  }
  return res;
}
vec3 nrm(vec3 p) {
  vec2 e = vec2(0.0006, -0.0006);
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}
float shadow(vec3 p) {
  float s = 1.0, t = 0.015;
  for (int k = 0; k < 32; k++) {
    float h = map(p + L * t).x;
    s = min(s, 7.0 * h / t);
    t += clamp(h, 0.012, 0.2);
    if (s < 0.01 || t > 3.0) break;
  }
  return clamp(s, 0.0, 1.0);
}
float ao(vec3 p, vec3 n) {
  float a = 0.0, w = 1.0;
  for (int k = 1; k <= 5; k++) {
    float h = 0.014 * float(k * k);
    a += w * (h - map(p + n * h).x);
    w *= 0.6;
  }
  return clamp(1.0 - 2.4 * a, 0.0, 1.0);
}

// sun through a tall sash window on the left: glazing bars and a curtain edge break it up
float sash(vec3 p) {
  vec3 a = normalize(cross(L, vec3(0.0, 1.0, 0.0))), b = cross(a, L);
  vec2 w = vec2(dot(p, a), dot(p, b)) - vec2(0.3, -0.4);
  float pen = 0.045 + 0.06 * clamp(dot(p, -L) + 2.0, 0.0, 4.0);
  vec2 e = vec2(2.6, 2.2) - abs(w);
  float m = smoothstep(-pen, pen, e.x) * smoothstep(-pen, pen, e.y);
  vec2 g = abs(fract(w / vec2(2.6, 1.5) + 0.5) - 0.5) * vec2(2.6, 1.5);
  m *= smoothstep(0.03, 0.03 + pen, g.x) * smoothstep(0.02, 0.02 + pen, g.y);
  float curtain = smoothstep(0.0, 0.35, w.x + 2.4 + 0.12 * sin(w.y * 3.0 + uTime * 0.4));
  return m * (0.25 + 0.75 * curtain);
}

// the dining room the silver sees: dark panelling, a cream ceiling, the sash window and the bright cloth
vec3 env(vec3 r) {
  float up = r.y;
  vec3 c = mix(vec3(0.1, 0.08, 0.065), vec3(0.62, 0.6, 0.56), smoothstep(0.08, 0.5, up));
  // a dresser and pictures along the wall behind the camera
  float az = atan(r.x, r.z);
  c *= 0.8 + 0.3 * smoothstep(0.42, 0.5, abs(fract(az * 4.0) - 0.5)) * step(up, 0.18);
  vec2 fr = abs(vec2(fract(az * 0.7 + 0.3) - 0.5, up - 0.4));
  c = mix(c, vec3(0.03, 0.025, 0.02), step(fr.x, 0.16) * step(fr.y, 0.13) * (1.0 - step(fr.x, 0.13) * step(fr.y, 0.1)));
  c += vec3(1.0, 0.72, 0.42) * 2.2 * smoothstep(0.985, 0.998, dot(r, normalize(vec3(0.6, 0.28, 0.75))));
  // the tablecloth below the horizon
  c = mix(c, vec3(0.86, 0.84, 0.8) * 1.15, smoothstep(0.03, -0.14, up));
  // the window: two tall sashes with bars, behind and to the left
  vec3 wd = normalize(vec3(-0.85, 0.3, -0.42));
  float d = dot(r, wd);
  if (d > 0.0) {
    vec3 a = normalize(cross(wd, vec3(0.0, 1.0, 0.0))), b = cross(a, wd);
    vec2 q = vec2(dot(r, a), dot(r, b)) / d;
    float pane = smoothstep(0.03, 0.0, max(abs(q.x) - 0.5, abs(q.y - 0.1) - 0.75));
    vec2 g = abs(fract(q / vec2(0.5, 0.5) + 0.5) - 0.5) * 0.5;
    pane *= smoothstep(0.008, 0.02, g.x) * smoothstep(0.008, 0.02, g.y);
    c = mix(c, vec3(1.0, 0.98, 0.94) * 10.0, pane);
  }
  // a softer window behind the camera on the right
  vec3 w2 = normalize(vec3(0.7, 0.32, 0.64));
  float d2 = dot(r, w2);
  if (d2 > 0.0) {
    vec3 a = normalize(cross(w2, vec3(0.0, 1.0, 0.0))), b = cross(a, w2);
    vec2 q = vec2(dot(r, a), dot(r, b)) / d2;
    float pane = smoothstep(0.05, 0.0, max(abs(q.x) - 0.22, abs(q.y) - 0.42));
    pane *= smoothstep(0.0, 0.015, abs(q.x)) * smoothstep(0.0, 0.015, abs(q.y - 0.05));
    c = mix(c, vec3(0.88, 0.93, 1.0) * 3.2, pane);
  }
  return c;
}

vec3 clothAlb(vec3 p) {
  float weave = vnoise(p.xz * vec2(70.0, 9.0)) * 0.5 + vnoise(p.xz * vec2(8.0, 64.0)) * 0.5;
  return vec3(0.86, 0.85, 0.82) * (0.975 + 0.035 * weave);
}
// ironed fold lines run across the cloth in a grid
vec3 clothN(vec3 p) {
  float cx = (fract(p.x / 1.45 + 0.31) - 0.5) * 1.45;
  float cz = (fract(p.z / 1.2 + 0.18) - 0.5) * 1.2;
  float bx = exp(-cx * cx / 0.0016), bz = exp(-cz * cz / 0.0012);
  float gx = -0.1 * bx * (2.0 * cx / 0.0016) * 0.04, gz = 0.08 * bz * (2.0 * cz / 0.0012) * 0.04;
  gx += (vnoise(p.xz * 3.0) - 0.5) * 0.04;
  return normalize(vec3(-gx, 1.0, -gz));
}
vec3 shadeCloth(vec3 p, bool full) {
  vec3 n = clothN(p);
  float sh = (full ? shadow(p + vec3(0.0, 0.004, 0.0)) : 1.0) * sash(p);
  float oc = full ? ao(p, vec3(0.0, 1.0, 0.0)) : 1.0;
  vec3 alb = clothAlb(p);
  vec3 col = alb * (SUN * max(dot(n, L), 0.0) * sh + SKY * oc * (0.8 + 0.2 * n.y));
  // light that the polished domes throw back onto the cloth
  for (int i = 0; i < 3; i++) {
    vec3 d = uO[i] + vec3(0.0, uC[i].w * 0.5, 0.0) - p;
    col += alb * SUN * 0.035 * uC[i].z / (dot(d, d) + 0.15) * oc;
  }
  return col;
}

vec3 platePaint(vec3 p, int i, out float ink) {
  vec2 d = p.xz - uC[i].xy;
  float Rt = uR[i] * 0.64;
  float u = d.x / (2.0 * Rt) + 0.5, v = 0.5 - d.y / (2.0 * Rt);
  ink = 0.0;
  if (u > 0.0 && u < 1.0 && v > 0.0 && v < 1.0) ink = texture(uTex, vec2(u, (float(i) + v) / 3.0)).r;
  return vec3(0.035, 0.016, 0.008);
}

// what a reflected ray off the silver sees: the other pieces, the cloth, or the room
vec3 bounce(vec3 ro, vec3 rd) {
  float t = 0.02;
  for (int k = 0; k < 36; k++) {
    vec2 h = map(ro + rd * t);
    if (h.x < 0.002) {
      vec3 p = ro + rd * t;
      if (h.y > 2.5) {
        int i = int(h.y + 0.5) - 3;
        float ink;
        vec3 ic = platePaint(p, i, ink);
        vec3 alb = mix(vec3(0.9, 0.89, 0.86), ic, ink);
        return alb * (SUN * 0.5 * sash(p) + SKY);
      }
      vec3 n = nrm(p);
      return env(reflect(rd, n)) * vec3(0.92, 0.9, 0.86) * 0.85;
    }
    t += h.x;
    if (t > 4.0) break;
  }
  if (rd.y < 0.0) {
    float tp = -ro.y / rd.y;
    vec3 p = ro + rd * tp;
    return shadeCloth(p, false) * 0.92;
  }
  return env(rd);
}

vec3 shadeSilver(int i, vec3 p, vec3 rd, vec3 n) {
  vec3 q = toL(p - uO[i], i);
  vec2 s = vec2(atan(q.x, q.z) * uC[i].z, q.y);
  // fine spinning lines from the lathe and a few soft polishing smears
  float lines = vnoise(vec2(s.y * 420.0, s.x * 2.0)) - 0.5;
  float smear = fbm(s * 5.0 + float(i) * 4.0);
  vec3 nb = normalize(n + (vec3(0.0, 1.0, 0.0) * lines * 0.006) + (vec3(smear - 0.5) * 0.006));
  vec3 R = reflect(rd, nb);
  vec3 refl = bounce(p + nb * 0.006, R);
  // soften the room a little where the polish is smeared
  refl = mix(refl, env(normalize(R + (vec3(vnoise(s * 9.0), vnoise(s * 9.0 + 3.0), 0.0) - 0.5) * 0.2)), 0.25 * smoothstep(0.55, 0.8, smear));
  float cosT = clamp(dot(-rd, nb), 0.0, 1.0);
  vec3 F0 = vec3(0.95, 0.93, 0.88);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - cosT, 5.0);
  float oc = ao(p, n);
  float sh = shadow(p + n * 0.01);
  vec3 col = refl * F * mix(0.55, 1.0, oc);
  col += SUN * sh * sash(p) * (30.0 * pow(max(dot(R, L), 0.0), 900.0) + 0.5 * pow(max(dot(R, L), 0.0), 60.0));
  return col;
}

vec3 shadePlate(int i, vec3 p, vec3 rd, vec3 n) {
  float ink;
  vec3 ic = platePaint(p, i, ink);
  // only paint the flat well of the plate
  ink *= step(0.5, n.y) * smoothstep(0.7 * uR[i], 0.64 * uR[i], length(p.xz - uC[i].xy));
  float rr = length(p.xz - uC[i].xy) / uR[i];
  float band = smoothstep(0.004, 0.0, abs(rr - 0.9) - 0.012);
  float gild = smoothstep(0.003, 0.0, abs(rr - 0.875) - 0.003);
  vec3 alb = mix(vec3(0.93, 0.925, 0.9), ic, ink);
  alb = mix(alb, vec3(0.06, 0.2, 0.15), band);
  alb = mix(alb, vec3(0.6, 0.42, 0.16), gild);
  float sh = shadow(p + n * 0.006) * sash(p);
  float oc = ao(p, n);
  vec3 col = alb * (SUN * max(dot(n, L), 0.0) * sh + SKY * oc);
  // porcelain glaze
  float F = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 R = reflect(rd, n);
  vec3 refl = env(R) * mix(0.4, 1.0, oc) + SUN * sh * 26.0 * pow(max(dot(R, L), 0.0), 700.0);
  return mix(col, refl, F * (1.0 - 0.4 * ink));
}

vec3 shadeWall(vec3 p) {
  vec3 alb = mix(vec3(0.74, 0.7, 0.64), vec3(0.8, 0.76, 0.7), fbm(p.xy * 1.2));
  float lit = sash(p + vec3(0.0, 0.0, 0.0));
  return alb * (SUN * 0.45 * lit + SKY * 0.85);
}

vec3 tonemap(vec3 x) { x *= 0.6; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  vec2 ndc = vUv * 2.0 - 1.0 - uShift;
  vec3 rd = normalize(uFw + uRt * (ndc.x * uTan * uAspect) + uUp * (ndc.y * uTan));
  float tp = 1e9; int pid = -1;
  if (rd.y < 0.0) { float t = -uCam.y / rd.y; vec3 h = uCam + rd * t; if (h.z > WZ) { tp = t; pid = 0; } }
  if (pid < 0 && rd.z < 0.0) { tp = (WZ - uCam.z) / rd.z; pid = 1; }
  float t = max(0.0, (uCam.y - 1.6) / max(-rd.y, 0.05));
  float id = -1.0;
  float tmax = min(tp, 40.0);
  for (int k = 0; k < 120; k++) {
    vec2 h = map(uCam + rd * t);
    if (h.x < 0.0005 * t) { id = h.y; break; }
    t += h.x * 0.85;
    if (t > tmax) break;
  }
  vec3 col;
  float depth;
  if (id >= 0.0 && t < tmax) {
    vec3 p = uCam + rd * t;
    vec3 n = nrm(p);
    int k = int(id + 0.5);
    col = k < 3 ? shadeSilver(k, p, rd, n) : shadePlate(k - 3, p, rd, n);
    depth = t;
  } else {
    vec3 p = uCam + rd * tp;
    col = pid == 0 ? shadeCloth(p, true) : shadeWall(p);
    depth = tp;
  }
  // haze in the window light
  col += vec3(1.0, 0.93, 0.84) * 0.03 * smoothstep(0.5, -1.0, dot(rd, vec3(1.0, 0.0, 0.0)));
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
  col *= 1.0 - 0.28 * dot(q, q);
  col += (ign(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.016;
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

/** What is piped onto each plate in chocolate: plan name, the example price and its label. One square per plan. */
function artwork() {
  const S = 1024;
  const cv = document.createElement("canvas");
  cv.width = S;
  cv.height = S * plans.length;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = "#fff";
  const tracked = (s: string, y: number, font: string, gap: number) => {
    ctx.font = font;
    ctx.textAlign = "left";
    const w = [...s].map((c) => ctx.measureText(c).width + gap);
    let x = S / 2 - (w.reduce((a, b) => a + b, 0) - gap) / 2;
    [...s].forEach((c, i) => {
      ctx.fillText(c, x, y);
      x += w[i];
    });
  };
  plans.forEach((plan, i) => {
    // the texture is flipped on upload, so plan 0 sits in the bottom square
    ctx.save();
    ctx.translate(0, (plans.length - 1 - i) * S);
    // the plate is seen at a low angle, so the lettering is drawn tall to read true
    ctx.scale(1, 1.7);
    tracked(plan.name.toUpperCase(), 150, `700 ${plan.name.length > 9 ? 74 : 88}px ${GROTESK}`, 14);
    ctx.fillRect(S / 2 - 80, 172, 160, 6);
    tracked(`$${plan.price}`, 430, `italic 600 ${plan.price > 99 ? 290 : 330}px ${SERIF}`, -10);
    tracked("A MONTH · EXAMPLE", 520, `700 62px ${GROTESK}`, 8);
    ctx.restore();
  });
  return cv;
}

type Sim = { l: number[]; vl: number[]; a: number[]; va: number[]; dip: number[]; plan: number; dirty: boolean; touched: boolean };

/** The same table drawn with plain elements, for browsers without WebGL 2. */
function Still({ plan, marks }: { plan: number; marks: number[] }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(180deg, #8d8276 0%, #b3a99c 26%, #dcd8d1 27%, ${CLOTH} 60%, #f4f2ee 100%)` }}>
      <div className="absolute left-0 top-0 h-full w-[60%]" style={{ background: "linear-gradient(110deg, rgba(255,250,240,0.6), rgba(255,250,240,0) 70%)" }} />
      {plans.map((p, i) => {
        const up = i === plan;
        const w = p.dome * 30;
        return (
          <div key={p.name} className="absolute -translate-x-1/2" style={{ left: `${marks[i]}%`, bottom: "26%", width: `${w}%` }}>
            <div className="absolute -bottom-[10%] left-[-14%] h-[34%] w-[128%] rounded-[50%] border border-black/10 bg-[#f6f5f2] shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
              {up && (
                <div className="absolute inset-0 grid place-items-center text-center text-[#2a1810]" style={{ fontFamily: SERIF }}>
                  <span className="text-[clamp(14px,2.6vw,30px)] italic leading-none">${p.price}</span>
                </div>
              )}
            </div>
            <div
              className="relative rounded-t-full"
              style={{
                aspectRatio: "2 / 1.6",
                transform: up ? "translateY(-70%) rotate(-12deg)" : "none",
                background: "radial-gradient(ellipse at 34% 30%, #ffffff 0%, #e9e9e6 12%, #8c8b88 42%, #3c3b39 70%, #b9b7b2 92%)",
                boxShadow: "inset 0 -6px 10px rgba(0,0,0,0.35)",
              }}
            >
              <div className="absolute left-1/2 top-[-9%] h-[12%] w-[14%] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #fff, #8a8985 60%, #3a3937)" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SilverClochePricing() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [plan, setPlan] = useState(1);
  const [mode, setMode] = useState<"pending" | "gl" | "still">("pending");
  const [marks, setMarks] = useState<number[]>([24, 50, 77]);
  const [handled, setHandled] = useState(false);
  const sim = useRef<Sim>({ l: [0, 1, 0], vl: [0, 0, 0], a: [0, TILT, 0], va: [0, 0, 0], dip: [0, 0, 0], plan: 1, dirty: true, touched: false });

  useEffect(() => {
    const s = sim.current;
    if (s.plan !== plan) {
      s.plan = plan;
      s.dip[plan] = 0.11; // a waiter's small press down before the lift
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
      const dist = Math.max(9.4, (wide ? 2.4 : 2.2) / (TAN * aspect));
      const el = 0.52;
      const target = [0, 0.32, 0.05];
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
      cam.shift = wide ? [0.12, -0.36] : [0, -0.38];
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
      if (cssW * cssH * k * k > 1.5e6) k = Math.sqrt(1.5e6 / (cssW * cssH));
      const w = Math.max(2, Math.round(cssW * k)), h = Math.max(2, Math.round(cssH * k));
      aim(0, 0);
      setMarks(XS.map((x) => clamp((project([x, 0, 0])[0] / cssW) * 100, cssW < 640 ? 19 : 8, cssW < 640 ? 81 : 92)));
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
    let pointer = [0, 0], view = [0, 0];

    const draw = (t: number) => {
      const aspect = aim(view[0], view[1]);
      gl.bindVertexArray(vao);
      gl.viewport(0, 0, W, H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.useProgram(pScene);
      const C: number[] = [], O: number[] = [], CS: number[] = [], R: number[] = [];
      plans.forEach((p, i) => {
        const l = s.l[i];
        C.push(XS[i], 0, p.dome, domeH(p.dome));
        // lifted up and drawn back toward the waiter, front edge rising so the diner sees the plate
        O.push(XS[i], SEAT + l * (LIFT + (reduce ? 0 : 0.008 * Math.sin(t * 1.6 + i))), -l * p.dome * 1.05);
        CS.push(Math.cos(s.a[i]), Math.sin(s.a[i]));
        R.push(PLATE(p.dome));
      });
      gl.uniform4fv(U(pScene, "uC"), C);
      gl.uniform3fv(U(pScene, "uO"), O);
      gl.uniform2fv(U(pScene, "uCS"), CS);
      gl.uniform1fv(U(pScene, "uR"), R);
      gl.uniform1i(U(pScene, "uTex"), 0);
      gl.uniform3fv(U(pScene, "uCam"), cam.pos);
      gl.uniform3fv(U(pScene, "uRt"), cam.rt);
      gl.uniform3fv(U(pScene, "uUp"), cam.up);
      gl.uniform3fv(U(pScene, "uFw"), cam.fw);
      gl.uniform1f(U(pScene, "uTan"), TAN);
      gl.uniform1f(U(pScene, "uAspect"), aspect);
      gl.uniform2fv(U(pScene, "uShift"), cam.shift);
      gl.uniform1f(U(pScene, "uFocus"), cam.focus);
      gl.uniform1f(U(pScene, "uAperture"), 1.5);
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

    // The lift is an underdamped spring so the dome overshoots a touch; the tilt is a second, looser spring that trails it.
    const physics = (dt: number) => {
      plans.forEach((_, i) => {
        let target = i === s.plan ? 1 : 0;
        if (s.dip[i] > 0) {
          s.dip[i] -= dt;
          target = -0.035;
        }
        const down = target < s.l[i];
        const k = down ? 90 : 62, c = down ? 15 : 9.5;
        s.vl[i] += (k * (target - s.l[i]) - c * s.vl[i]) * dt;
        s.l[i] += s.vl[i] * dt;
        if (s.l[i] < 0) {
          // the rim meets the plate: a small, damped clink
          s.l[i] = 0;
          s.vl[i] = Math.abs(s.vl[i]) * 0.22 < 0.05 ? 0 : Math.abs(s.vl[i]) * 0.22;
        }
        const ta = TILT * clamp(s.l[i], 0, 1.2);
        s.va[i] += (40 * (ta - s.a[i]) - 6.5 * s.va[i] - s.vl[i] * 0.8) * dt;
        s.a[i] = clamp(s.a[i] + s.va[i] * dt, 0, 1.4);
        if (s.l[i] === 0 && s.a[i] < 0.002) s.a[i] = 0;
      });
    };
    const settle = () => {
      plans.forEach((_, i) => {
        s.l[i] = i === s.plan ? 1 : 0;
        s.a[i] = i === s.plan ? TILT : 0;
        s.vl[i] = s.va[i] = s.dip[i] = 0;
      });
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
        view[0] += (pointer[0] * 0.4 + 0.15 * Math.sin(t * 0.2) - view[0]) * Math.min(1, dt * 3);
        view[1] += (pointer[1] * 0.2 - view[1]) * Math.min(1, dt * 3);
        if (DEMO && !s.touched && played > demoAt) {
          const script = [2, 0, 1];
          setPlan(script[step % script.length]);
          step++;
          demoAt = played + 3.8;
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

    // pressing a cloche or its plate chooses that plan
    const over = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      for (let i = 0; i < plans.length; i++) {
        const p = plans[i], R = PLATE(p.dome);
        const a = project([XS[i] - R, domeH(p.dome) + 0.1 + LIFT * s.l[i], 0]), b = project([XS[i] + R, 0, R]);
        if (x > a[0] && x < b[0] && y > a[1] && y < b[1]) return i;
      }
      return -1;
    };
    const touch = () => {
      s.touched = true;
      setHandled(true);
    };
    const downEv = (e: PointerEvent) => {
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
    canvas.addEventListener("pointerdown", downEv);
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
      canvas.removeEventListener("pointerdown", downEv);
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
      className="inline-flex h-11 items-center gap-3 rounded-full bg-[#1f1b17] pl-5 pr-4 text-[14px] font-semibold text-[#f4f1ec] transition hover:bg-[#3a332c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f1b17] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ebe8e2]"
    >
      Book {chosen.name}
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10h12M11 5l5 5-5 5" />
      </svg>
    </a>
  );

  return (
    <section className="relative overflow-hidden" style={{ fontFamily: GROTESK, background: CLOTH, color: INK }}>
      <div ref={wrapRef} className="relative h-[620px] w-full sm:h-[780px]">
        <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full touch-pan-y ${mode === "still" ? "hidden" : ""}`} />
        {mode === "still" && <Still plan={plan} marks={[24, 50, 77]} />}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-4 p-5 sm:p-9">
          <p className="flex items-baseline gap-3 text-[#1f1b17]">
            <span className="text-[22px] italic leading-none sm:text-[26px]" style={{ fontFamily: SERIF, letterSpacing: "-0.02em" }}>
              {product.name}
            </span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1f1b17]/75 sm:inline">{product.line}</span>
          </p>
          <span className="rounded-full border border-[#1f1b17]/30 bg-[#f7f5f1]/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f1b17] backdrop-blur-sm">Example prices</span>
        </div>

        <div className="pointer-events-none absolute left-5 top-[70px] text-[#1f1b17] sm:left-9 sm:top-[104px]" aria-live={handled ? "polite" : "off"} >
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#1f1b17]/80">
            <span className="tabular-nums">{`0${plan + 1}`}</span>
            <span className="mx-2 opacity-60">/</span>
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
                transition={{ type: "spring", stiffness: 240, damping: 22, delay: reduce ? 0 : 0.15 }}
                className="block text-[88px] tabular-nums sm:text-[150px]"
              >
                {chosen.price}
              </motion.span>
            </span>
            <span className="ml-3 mt-[0.6em] text-[11px] font-semibold uppercase leading-[1.5] tracking-[0.2em] text-[#1f1b17]/80 sm:ml-4 sm:mt-[1.4em] sm:text-[12px]">
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

        <div className="absolute right-9 top-[104px] hidden w-[262px] text-[#1f1b17] lg:block">
          <ul className="space-y-2 border-t border-[#1f1b17]/25 pt-3.5 text-[14px] leading-snug">
            {chosen.features.map((f) => (
              <li key={f} className="flex gap-3">
                {check}
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-4" style={{ textShadow: "none" }}>
            <a
              href="#"
              className="inline-flex h-11 items-center gap-3 rounded-full bg-[#1f1b17] pl-5 pr-4 text-[14px] font-semibold text-[#f4f1ec] transition hover:bg-[#3a332c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f1b17] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ebe8e2]"
            >
              Book {chosen.name}
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </a>
          </div>
        </div>

        <fieldset className="absolute inset-x-0 bottom-4 h-11 sm:bottom-6">
          <legend className="sr-only">Plan</legend>
          {plans.map((p, i) => (
            <label
              key={p.name}
              htmlFor={`silver-cloche-pricing-plan-${i}`}
              className="absolute top-0 -translate-x-1/2 cursor-pointer"
              style={{ left: `${mode === "still" ? [24, 50, 77][i] : marks[i]}%` }}
            >
              <input id={`silver-cloche-pricing-plan-${i}`} type="radio" name="silver-cloche-pricing-plan" value={p.name} checked={plan === i} onChange={() => setPlan(i)} className="peer sr-only" />
              <span className="flex h-11 items-center gap-2 whitespace-nowrap rounded-full border border-[#1f1b17]/15 bg-[#f7f5f1]/90 pl-2.5 pr-3 text-[11px] font-semibold uppercase tracking-[0.08em] shadow-[0_6px_18px_rgba(40,30,20,0.16)] transition peer-checked:bg-[#1f1b17] peer-checked:text-[#f4f1ec] peer-focus-visible:ring-2 peer-focus-visible:ring-[#1f1b17] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#f7f5f1] sm:gap-2.5 sm:pl-3.5 sm:pr-4 sm:text-[13px] sm:tracking-[0.14em]">
                <span className={`grid h-4 w-4 place-items-center rounded-full border-[1.5px] ${plan === i ? "border-[#f4f1ec]" : "border-[#1f1b17]/60"}`}>
                  <span className={`h-2 w-2 rounded-full bg-[#f4f1ec] transition-transform ${plan === i ? "scale-100" : "scale-0"}`} />
                </span>
                {p.name}
                <span className="hidden font-medium normal-case tracking-normal opacity-80 sm:inline">${p.price}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      <div className="border-t border-[#1f1b17]/15 px-5 pb-8 pt-6 lg:hidden">
        <ul className="space-y-2.5 text-[15px] leading-snug">
          {chosen.features.map((f) => (
            <li key={f} className="flex gap-3">
              {check}
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-6">{cta}</div>
        <p className="mt-4 text-[13px] text-[#1f1b17]/80">Prices shown are examples. Set your own in the plans list.</p>
      </div>
    </section>
  );
}
