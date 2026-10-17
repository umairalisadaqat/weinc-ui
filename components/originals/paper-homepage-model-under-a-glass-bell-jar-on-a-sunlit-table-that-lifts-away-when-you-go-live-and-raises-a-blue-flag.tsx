import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** The two states, as the words beside the model and the label on the button. */
const STATES = {
  draft: { word: "Draft", line: "Kept under glass while you work on it.", action: "Go live" },
  live: { word: "Live", line: "Out in the open for anyone with the address.", action: "Cover it again" },
};

const BLUE = "#4F98FB";
const INK = "#0B0D12";
const PAPER = "#F6F4EF";
const STAGE = "#E7DFD2";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
/** Seconds the self-playing demo holds the live model, and the covered one, before switching. */
const HOLD_LIVE = 6.0;
const HOLD_DRAFT = 3.0;
/** Seconds the jar takes to travel between the model and its place on the table. */
const LIFT_TIME = 1.55;
/** Lowest and highest render scale (canvas pixels per CSS pixel). The loop steps down when frames run slow. */
const MIN_SCALE = 0.6001;
const MAX_SCALE = 1.5001;

/* ---------- shaders ---------- */

const VERT = `#version 300 es
in vec2 a; out vec2 vUv;
void main(){ vUv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

const SCENE = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes;
uniform vec3 uCam, uTarget;
uniform float uFov, uTime;
uniform vec3 uJar;   // where the bell jar stands, relative to resting on the model's base
uniform float uSun;  // 0 a cloud over the sun, 1 full sun
uniform float uFlag; // how far up its pole the flag has been run
uniform float uWind; // 0 the still air under the glass, 1 a breeze from the open window

const vec3 SUNC = vec3(1.0, 0.84, 0.64);
const vec3 BLUE = vec3(0.078, 0.314, 0.965);
const float Y0 = 0.14, S = 0.152, R = 1.05, YC = 1.14, WALL = -4.4;
vec3 gL; float gSun, gPix, gDist;

float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ return 0.5 * n2(p) + 0.25 * n2(p * 2.03 + 1.7) + 0.125 * n2(p * 4.01 + 3.1); }

float rb2(vec2 p, vec2 h, float r){ vec2 d = abs(p) - h + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r; }
float ext(float d2, float y, float h, float bev){ vec2 w = vec2(d2, abs(y) - h) + bev; return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - bev; }
float box(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
// a folded card block standing on the sheet: centre, half size across the sheet, height
float blk(vec3 p, vec2 c, vec2 hs, float h){ return box(p - vec3(c.x, S + h * 0.5, c.y), vec3(hs.x, h * 0.5, hs.y), 0.004); }

const vec3 POLE = vec3(0.53, 0.672, -0.17);

vec3 toFlag(vec3 p){
  vec3 f = p - POLE - vec3(0.0, 0.1 + uFlag * 0.4, 0.0);
  // with no air moving the flag hangs against its pole; in the breeze it stands out and ripples
  float a = (1.0 - uWind) * 1.32;
  f.xy = vec2(cos(a) * f.x - sin(a) * f.y, sin(a) * f.x + cos(a) * f.y);
  float u = clamp(f.x / 0.26, 0.0, 1.0);
  f.z -= uWind * u * (0.022 * sin(f.x * 21.0 - uTime * 7.5) + 0.01 * sin(f.x * 37.0 - uTime * 11.0 + 1.0));
  f.y += uWind * u * u * 0.018 * sin(uTime * 3.1);
  return f;
}

vec2 map(vec3 p){
  float bound = length(p - vec3(0.0, 0.45, 0.0)) - 1.45;
  if (bound > 0.25) return vec2(bound, 0.0);
  // the turned walnut base
  float r = length(p.xz);
  vec2 res = vec2(ext(r - 1.2, p.y - Y0 * 0.5, Y0 * 0.5, 0.03), 1.0);
  // the card sheet and the blocks of the page folded up from card
  float d = box(p - vec3(0.0, Y0 + 0.006, 0.0), vec3(0.76, 0.0062, 0.52), 0.0045);
  d = min(d, blk(p, vec2(0.0, -0.41), vec2(0.68, 0.045), 0.055));
  d = min(d, blk(p, vec2(-0.31, -0.13), vec2(0.35, 0.1), 0.3));
  d = min(d, blk(p, vec2(-0.37, 0.065), vec2(0.29, 0.035), 0.1));
  d = min(d, blk(p, vec2(0.37, -0.1), vec2(0.27, 0.16), 0.52));
  for (int i = 0; i < 3; i++) d = min(d, blk(p, vec2(-0.48 + 0.48 * float(i), 0.34), vec2(0.2, 0.09), 0.14));
  if (d < res.x) res = vec2(d, 2.0);
  // the button, in blue card
  vec3 q = p - vec3(-0.52, S + 0.035, 0.19);
  d = ext(rb2(q.xz, vec2(0.12, 0.04), 0.04), q.y, 0.035, 0.006);
  if (d < res.x) res = vec2(d, 3.0);
  // a brass pin for a flagpole, with a ball on top
  vec3 pp = p - POLE;
  d = max(length(pp.xz) - 0.0075, abs(pp.y - 0.27) - 0.27);
  d = min(d, length(pp - vec3(0.0, 0.552, 0.0)) - 0.016);
  if (d < res.x) res = vec2(d, 4.0);
  vec3 f = toFlag(p);
  d = box(f - vec3(0.13, -0.08, 0.0), vec3(0.13, 0.08, 0.0022), 0.001) * 0.6;
  if (d < res.x) res = vec2(d, 5.0);
  return res;
}
vec3 normal(vec3 p){
  vec2 e = vec2(1.0, -1.0) * 0.0007;
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}
vec2 march(vec3 ro, vec3 rd, float far){
  float t = 0.0; vec2 h = vec2(0.0);
  for (int i = 0; i < 110; i++){
    h = map(ro + rd * t);
    if (h.x < 0.0004 * (1.0 + t * 0.3) || t > far) break;
    t += h.x * 0.92;
  }
  return vec2(t, (t > far || h.x > 0.01) ? 0.0 : h.y);
}
float softShadow(vec3 ro, vec3 rd){
  float res = 1.0, t = 0.012;
  for (int i = 0; i < 30; i++){
    float h = map(ro + rd * t).x;
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.01, 0.2);
    if (res < 0.004 || t > 3.0) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}
float occ(vec3 p, vec3 n){
  float o = 0.0, s = 1.0;
  for (int i = 0; i < 5; i++){
    float h = 0.01 + 0.09 * float(i) / 4.0;
    o += (h - map(p + n * h).x) * s;
    s *= 0.78;
  }
  return clamp(1.0 - 3.0 * o, 0.0, 1.0);
}

// The window the sun comes through, out of shot on the left: its bars throw shadows across everything.
float panes(vec2 w, float s){
  float frame = smoothstep(s, -s, max(abs(w.x) - 3.0, abs(w.y) - 2.4));
  float gx = abs(fract(w.x * 0.5) - 0.5) * 2.0;
  float gy = abs(fract(w.y / 4.8 + 0.5) - 0.5) * 4.8;
  return frame * smoothstep(0.05 - s, 0.05 + s, gx) * smoothstep(0.06 - s, 0.06 + s, gy);
}
float win(vec3 p){
  float t = (-7.0 - p.x) / gL.x;
  vec3 q = p + gL * t;
  return panes(vec2(q.z - 2.5, q.y - 4.9), 0.012 * t + 0.02);
}

// The bell jar, as a thin shell: a cylinder wall, a dome and a knob. Returns the near and far hit.
vec2 jarHit(vec3 ro, vec3 rd, out vec3 n1, out vec3 n2o){
  vec3 o = ro - uJar;
  float tn = 1e9, tf = -1.0;
  n1 = vec3(0.0, 1.0, 0.0); n2o = n1;
  float a = dot(rd.xz, rd.xz), b = dot(o.xz, rd.xz), c = dot(o.xz, o.xz) - R * R;
  float h = b * b - a * c;
  if (h > 0.0 && a > 1e-6){
    h = sqrt(h);
    for (int i = 0; i < 2; i++){
      float t = (-b + (i == 0 ? -h : h)) / a;
      float y = o.y + rd.y * t;
      if (t > 1e-3 && y > Y0 && y < YC){
        vec2 xz = (o.xz + rd.xz * t) / R; vec3 n = vec3(xz.x, 0.0, xz.y);
        if (t < tn){ tn = t; n1 = n; }
        if (t > tf){ tf = t; n2o = n; }
      }
    }
  }
  vec3 oc = o - vec3(0.0, YC, 0.0);
  b = dot(oc, rd); c = dot(oc, oc) - R * R; h = b * b - c;
  if (h > 0.0){
    h = sqrt(h);
    for (int i = 0; i < 2; i++){
      float t = -b + (i == 0 ? -h : h);
      vec3 q = oc + rd * t;
      if (t > 1e-3 && q.y >= 0.0){
        vec3 n = q / R;
        if (t < tn){ tn = t; n1 = n; }
        if (t > tf){ tf = t; n2o = n; }
      }
    }
  }
  vec3 ok = o - vec3(0.0, YC + R + 0.06, 0.0);
  b = dot(ok, rd); c = dot(ok, ok) - 0.085 * 0.085; h = b * b - c;
  if (h > 0.0){
    float t = -b - sqrt(h);
    if (t > 1e-3 && t < tn){ tn = t; n1 = (ok + rd * t) / 0.085; if (tf < 0.0){ tf = t; n2o = n1; } }
  }
  return vec2(tn, tf);
}
// How much sunlight gets through the jar on its way to p: glass seen edge on bends light away, just inside the edge it gathers.
float jarT(vec3 p){
  vec3 n1, n2; vec2 h = jarHit(p, gL, n1, n2);
  float T = 1.0;
  if (h.x < 1e8){
    float c = abs(dot(n1, gL));
    T *= mix(0.45, 0.9, smoothstep(0.0, 0.45, c)) + 0.22 * smoothstep(0.1, 0.3, c) * smoothstep(0.6, 0.3, c);
    if (h.y > h.x + 1e-3){
      c = abs(dot(n2, gL));
      T *= mix(0.45, 0.9, smoothstep(0.0, 0.45, c)) + 0.22 * smoothstep(0.1, 0.3, c) * smoothstep(0.6, 0.3, c);
    }
  }
  return T;
}

// The room: warm plaster all round, a bright window on the left.
vec3 env(vec3 ro, vec3 rd){
  vec3 c = mix(vec3(0.16, 0.13, 0.1), vec3(0.5, 0.45, 0.39), smoothstep(-0.3, 0.7, rd.y));
  c += vec3(0.25, 0.2, 0.15) * smoothstep(0.2, -0.6, rd.z) * smoothstep(-0.2, 0.3, rd.y);
  if (rd.x < -0.02){
    float t = (-7.0 - ro.x) / rd.x;
    vec3 q = ro + rd * t;
    c = mix(c, vec3(1.5, 1.6, 1.78) * 3.2, panes(vec2(q.z - 2.5, q.y - 4.9), 0.03));
  }
  return c;
}
vec3 fres(vec3 f0, float c){ return f0 + (1.0 - f0) * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }

vec3 sunLight(vec3 p, vec3 n, bool hq){
  float d = dot(n, gL);
  if (d <= 0.0) return vec3(0.0);
  float v = win(p);
  if (v > 0.001 && hq) v *= softShadow(p + n * 0.003, gL);
  if (v > 0.001) v *= jarT(p);
  return SUNC * gSun * d * v;
}
vec3 fill(vec3 n, float ao){
  // skylight from the window, warm bounce from the table, the plaster round about
  vec3 c = vec3(0.34, 0.37, 0.43) * max(-n.x * 0.7 + n.y * 0.3, 0.0) + vec3(0.3, 0.22, 0.15) * max(-n.y, 0.0) + vec3(0.24, 0.21, 0.18) * (0.6 + 0.4 * n.y);
  return c * ao;
}

vec3 shade(vec3 p, vec3 n, float id, vec3 rd, bool hq){
  float ao = hq ? occ(p, n) : 1.0;
  vec3 sl = sunLight(p, n, hq);
  vec3 r = reflect(rd, n);
  float nv = max(dot(n, -rd), 0.0);
  if (id < 1.5){
    // walnut, oiled and waxed
    float rr = length(p.xz);
    float g = fbm(vec2(p.x * 3.0 + fbm(p.xz * 2.0) * 1.5, p.z * 38.0 + p.y * 30.0));
    vec3 alb = mix(vec3(0.07, 0.034, 0.016), vec3(0.17, 0.085, 0.04), g);
    float groove = smoothstep(0.022, 0.006, abs(rr - 1.07)) * step(0.9, n.y);
    alb *= 1.0 - 0.45 * groove;
    alb *= 1.0 + 0.5 * smoothstep(0.004, 0.0, abs(rr - 1.049)) * step(0.9, n.y);
    vec3 col = alb * (sl + fill(n, ao));
    float f = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
    col += env(p, r) * f * ao * 0.8 * (1.0 - groove);
    col += SUNC * gSun * pow(max(dot(r, gL), 0.0), 90.0) * 3.0 * length(sl) / max(gSun, 0.01);
    return col;
  }
  if (id < 3.5){
    // card: a faint tooth, slightly warmer where it faces away from the sun because light comes through it
    vec3 alb = id < 2.5 ? vec3(0.79, 0.77, 0.72) : BLUE * vec3(0.95, 0.9, 0.8);
    float tooth = n2(p.xy * 420.0 + p.z * 310.0) * 0.5 + n2(p.zy * 380.0 + p.x * 200.0) * 0.5;
    alb *= 1.0 + 0.07 * (tooth - 0.5) * clamp(0.0015 / (gDist * gPix), 0.0, 1.0);
    if (id < 2.5){
      float ink = 0.0;
      float lw = max(0.0035, gDist * gPix * 0.9);
      if (n.z > 0.9 && p.y > S + 0.012){
        // pencil marks on the faces: headline rules on the hero block, a picture frame on the tall block, icons on the cards
        vec2 f = p.xy;
        if (p.z > -0.04 && p.z < -0.02 && f.x < -0.0){
          float row = mod(f.y - S - 0.05, 0.075);
          ink = smoothstep(lw, lw * 0.3, abs(row - 0.03)) * step(f.x, -0.12 + 0.12 * step(0.11, f.y - S)) * step(-0.62, f.x) * step(f.y, S + 0.27) * step(S + 0.04, f.y);
        }
        if (p.z > 0.05 && p.x > 0.08){
          vec2 c = f - vec2(0.37, S + 0.28);
          float fr = abs(rb2(c, vec2(0.2, 0.19), 0.015));
          float hill = abs(c.y + 0.08 - 0.12 * max(0.0, 1.0 - abs(c.x + 0.05) * 3.0)) ;
          ink = max(smoothstep(lw, lw * 0.3, fr), smoothstep(lw, lw * 0.3, hill) * step(abs(c.x), 0.19) * step(c.y, 0.18));
          ink = max(ink, smoothstep(lw, lw * 0.3, abs(length(c - vec2(0.1, 0.09)) - 0.035)));
        }
        if (p.z > 0.42){
          float cx = mod(f.x + 0.72, 0.48) - 0.24;
          vec2 c = vec2(cx, f.y - S);
          ink = max(smoothstep(lw, lw * 0.3, abs(length(c - vec2(-0.11, 0.09)) - 0.022)), smoothstep(lw, lw * 0.3, abs(c.y - 0.04)) * step(-0.14, c.x) * step(c.x, 0.06));
        }
      }
      alb = mix(alb, vec3(0.26, 0.25, 0.25), ink * 0.85 * min(1.0, 0.0045 / lw));
    }
    vec3 col = alb * (sl + fill(n, ao));
    // light passing through thin card on the side away from the sun
    col += alb * vec3(1.0, 0.9, 0.72) * gSun * 0.1 * max(-dot(n, gL), 0.0) * win(p) * ao;
    col += env(p, r) * (0.025 + 0.2 * pow(1.0 - nv, 5.0)) * ao;
    return col;
  }
  if (id < 4.5){
    vec3 col = fres(vec3(0.92, 0.72, 0.38), nv) * (env(p, r) * (0.4 + 0.6 * ao) + SUNC * gSun * pow(max(dot(r, gL), 0.0), 60.0) * 6.0 * win(p));
    return col;
  }
  // the flag: blue card, lit from behind as well as in front
  vec3 f = toFlag(p);
  vec3 alb = BLUE * (0.96 + 0.06 * n2(f.xy * 300.0));
  float d = abs(dot(n, gL));
  float v = win(p) * (hq ? softShadow(p + n * 0.004 * sign(dot(n, gL)), gL) : 1.0) * jarT(p);
  vec3 col = alb * (SUNC * gSun * d * v * mix(0.55, 1.0, step(0.0, dot(n, gL))) + fill(n, ao) * 0.9);
  col += env(p, r) * 0.03;
  return col;
}

vec3 tableShade(vec3 p, vec3 rd, float t){
  vec3 n = vec3(0.0, 1.0, 0.0);
  // pale oak, the grain running left to right
  float w = fbm(vec2(p.x * 0.35, p.z * 6.0 + fbm(p.xz * vec2(0.4, 1.6)) * 4.0));
  float fine = n2(vec2(p.x * 2.0, p.z * 90.0));
  vec3 alb = mix(vec3(0.42, 0.27, 0.15), vec3(0.6, 0.43, 0.27), w) * (0.92 + 0.12 * fine);
  float near = step(t, 30.0);
  float rb = length(p.xz);
  float ao = clamp(0.3 + 0.7 * smoothstep(1.17, 1.5, rb), 0.0, 1.0);
  float dj = length(p.xz - uJar.xz) - R;
  float onTable = smoothstep(-0.05, -0.12, uJar.y);
  ao *= 1.0 - onTable * 0.55 * exp(-abs(dj) * 26.0);
  float sv = win(p);
  if (sv > 0.001 && near > 0.5 && rb < 4.5) sv *= softShadow(p + n * 0.002, gL);
  if (sv > 0.001) sv *= jarT(p);
  vec3 col = alb * (SUNC * gSun * gL.y * sv + fill(n, ao) * 0.95);
  // satin oil finish: the window in the wood, softened
  float f = 0.035 + 0.965 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
  vec3 rr = reflect(rd, normalize(n + vec3(fine - 0.5, 0.0, w - 0.5) * 0.05));
  col += env(p, rr) * f * 0.45 * ao;
  col += SUNC * gSun * sv * pow(max(dot(rr, gL), 0.0), 40.0) * 0.6;
  return col;
}
vec3 wallShade(vec3 p){
  vec3 alb = vec3(0.7, 0.64, 0.56) * (0.94 + 0.08 * fbm(p.xy * 3.0));
  vec3 n = vec3(0.0, 0.0, 1.0);
  float sv = win(p) * max(dot(n, gL), 0.0);
  float base = smoothstep(0.0, 0.8, p.y);
  return alb * (SUNC * gSun * sv + vec3(0.25, 0.22, 0.19) * (0.55 + 0.45 * base));
}

vec3 glass(vec3 col, vec3 p, vec3 n, vec3 rd){
  if (dot(n, rd) > 0.0) n = -n;
  float c = max(dot(n, -rd), 0.0);
  float F = 0.04 + 0.96 * pow(1.0 - c, 5.0);
  float lip = smoothstep(0.06, 0.01, p.y - uJar.y - Y0);
  vec3 tint = pow(vec3(0.975, 0.99, 0.985), vec3(1.0 / max(c, 0.1) + lip * 8.0));
  vec3 r = reflect(rd, n);
  vec3 refl = env(p, r) + SUNC * gSun * pow(max(dot(r, gL), 0.0), 900.0) * 40.0;
  F = min(1.0, F + lip * 0.25);
  return col * (1.0 - F) * tint + refl * F;
}

vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main(){
  gL = normalize(vec3(-0.78, 0.47, 0.4));
  gSun = mix(0.85, 3.6, uSun);
  gPix = 2.0 * tan(uFov * 0.5) / uRes.y;
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 fw = normalize(uTarget - uCam), rgt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))), up = cross(rgt, fw);
  vec3 rd = normalize(fw + (uv.x * rgt + uv.y * up) * 2.0 * tan(uFov * 0.5));
  vec3 ro = uCam;
  vec3 n1, n2;
  vec2 jh = jarHit(ro, rd, n1, n2);
  // glass bends what is behind it a little, most near its edges
  vec3 rdo = rd;
  if (jh.x < 1e8) rdo = normalize(rd + (n1 * dot(n1, rd) - rd * 0.0) * 0.035);
  float tf = rdo.y < -1e-4 ? -ro.y / rdo.y : 1e5;
  float tw = rdo.z < -1e-4 ? (WALL - ro.z) / rdo.z : 1e5;
  vec2 hit = march(ro, rdo, min(min(tf, tw), 30.0));
  float t; vec3 col;
  if (hit.y > 0.5 && hit.x < min(tf, tw)){
    t = hit.x; vec3 p = ro + rdo * t; gDist = t;
    col = shade(p, normal(p), hit.y, rdo, true);
  } else if (tf < tw){
    t = tf; col = tableShade(ro + rdo * tf, rdo, tf);
  } else {
    t = tw; col = wallShade(ro + rdo * tw);
  }
  // sunbeams through the window, in the air
  {
    float tm = min(t, 16.0), acc = 0.0, j = h21(gl_FragCoord.xy + fract(uTime) * 17.0);
    for (int i = 0; i < 10; i++){
      vec3 q = ro + rd * tm * (float(i) + j) / 10.0;
      acc += win(q) * smoothstep(0.0, 0.6, q.y);
    }
    col += SUNC * gSun * acc / 10.0 * tm * 0.0045;
  }
  if (jh.y > 0.0 && jh.y < t && jh.y > jh.x + 1e-3) col = glass(col, ro + rd * jh.y, n2, rd);
  if (jh.x < t) col = glass(col, ro + rd * jh.x, n1, rd);
  col *= 0.62;
  col = aces(col);
  col = pow(col, vec3(1.0 / 2.2));
  o = vec4(col, clamp(t / 24.0, 0.0, 1.0));
}`;

const POST = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uSrc;
uniform vec2 uRes;
uniform float uFocus, uTime;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec4 c0 = texture(uSrc, vUv);
  float z = c0.a * 24.0;
  {
    vec2 e = 1.0 / uRes; vec3 L = vec3(0.299, 0.587, 0.114);
    float nw = dot(textureLod(uSrc, vUv + vec2(-e.x, -e.y), 0.0).rgb, L), ne = dot(textureLod(uSrc, vUv + vec2(e.x, -e.y), 0.0).rgb, L);
    float sw = dot(textureLod(uSrc, vUv + vec2(-e.x, e.y), 0.0).rgb, L), se = dot(textureLod(uSrc, vUv + e, 0.0).rgb, L), lm = dot(c0.rgb, L);
    float lo = min(lm, min(min(nw, ne), min(sw, se))), hi = max(lm, max(max(nw, ne), max(sw, se)));
    vec2 dir = vec2(-((nw + ne) - (sw + se)), (nw + sw) - (ne + se));
    float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + max((nw + ne + sw + se) * 0.03125, 0.0078));
    dir = clamp(dir * rcp, -8.0, 8.0) * e;
    vec3 a = 0.5 * (textureLod(uSrc, vUv + dir * (1.0 / 3.0 - 0.5), 0.0).rgb + textureLod(uSrc, vUv + dir * (2.0 / 3.0 - 0.5), 0.0).rgb);
    vec3 b = a * 0.5 + 0.25 * (textureLod(uSrc, vUv - dir * 0.5, 0.0).rgb + textureLod(uSrc, vUv + dir * 0.5, 0.0).rgb);
    float lb = dot(b, L);
    c0.rgb = (lb < lo || lb > hi) ? a : b;
  }
  float px = uRes.y / 720.0;
  float coc = clamp(abs(z - uFocus) / max(z, 0.1) * (z < uFocus ? 8.0 : 6.0) - 0.6, 0.0, 7.0) * px;
  vec3 acc = c0.rgb; float ws = 1.0;
  float j = hash(gl_FragCoord.xy) * 6.283;
  float lod = log2(max(coc / 3.0, 1.0));
  for (int i = 0; i < 14; i++){
    float fi = (float(i) + 0.5) / 14.0;
    float a = float(i) * 2.39996 + j;
    vec2 off = vec2(cos(a), sin(a)) * sqrt(fi) * coc / uRes;
    vec4 s = textureLod(uSrc, vUv + off, lod);
    float w = 1.0 + 4.0 * pow(max(s.r, max(s.g, s.b)), 6.0);
    acc += s.rgb * w; ws += w;
  }
  vec3 col = acc / ws;
  vec3 bl = textureLod(uSrc, vUv, 3.0).rgb * 0.35 + textureLod(uSrc, vUv, 4.5).rgb * 0.35 + textureLod(uSrc, vUv, 6.0).rgb * 0.3;
  col += bl * bl * 0.09;
  vec2 v = vUv - vec2(0.55, 0.5);
  col *= 1.0 - dot(v, v) * 0.45;
  float g = hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;
  col += g * 0.022 * (1.0 - 0.4 * col);
  o = vec4(col, 1.0);
}`;

/* ---------- small motion helpers ---------- */

type Spring = { x: number; v: number; t: number; k: number; c: number };
const spring = (x: number, k: number, c: number): Spring => ({ x, v: 0, t: x, k, c });
const stepSpring = (s: Spring, dt: number) => {
  s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt;
  s.x += s.v * dt;
};
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function BellJarGoLiveModel() {
  const reduce = useReducedMotion();
  const [live, setLive] = useState(true);
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The render loop owns the scene. React talks to it through this handle.
  const api = useRef<{ toggle: () => void } | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
      return s;
    };
    const link = (fs: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, "a");
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
      return p;
    };
    let scene: WebGLProgram;
    let post: WebGLProgram;
    try {
      scene = link(SCENE);
      post = link(POST);
    } catch (e) {
      console.error(e);
      return;
    }
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uCam", "uTarget", "uFov", "uTime", "uJar", "uSun", "uFlag", "uWind"].map((n) => [n, U(scene, n)]));
    const pu = Object.fromEntries(["uSrc", "uRes", "uFocus", "uTime"].map((n) => [n, U(post, n)]));

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // the moving parts; the piece opens on the finished, live state
    const jar = { p: 1, to: 1 };
    const bounce = spring(0, 260, 9);
    const sun = spring(1, 40, 11);
    const flag = spring(1, 70, 9);
    const wind = spring(1, 30, 8);
    const cam = { ax: 0, ay: 0, tx: 0, ty: 0 };
    let isLive = true;
    let demo = !reduce;
    let clock = 0;
    let time = 0;
    let idleAt = HOLD_LIVE;
    let wake = Infinity;
    let dirty = true;
    let cues: { at: number; fn: () => void }[] = [];
    const at = (delay: number, fn: () => void) => {
      cues.push({ at: clock + delay, fn });
      cues.sort((a, b) => a.at - b.at);
    };

    const settle = (on: boolean) => {
      cues = [];
      jar.p = jar.to = on ? 1 : 0;
      const set = (s: Spring, v: number) => ((s.x = s.t = v), (s.v = 0));
      set(bounce, 0);
      set(sun, on ? 1 : 0);
      set(flag, on ? 1 : 0);
      set(wind, on ? 1 : 0);
      dirty = true;
    };
    const toggle = () => {
      const next = !isLive;
      isLive = next;
      if (reduce) {
        setLive(next);
        settle(next);
        return;
      }
      cues = [];
      if (next) {
        // the jar comes up off its seat, the sun comes out as it clears, then the flag is run up
        jar.to = 1;
        at(LIFT_TIME * 0.3, () => {
          sun.t = 1;
          setLive(true);
        });
        at(LIFT_TIME * 0.55, () => (wind.t = 1));
        at(LIFT_TIME * 0.62, () => (flag.t = 1));
      } else {
        // the flag comes down first, then the glass goes back over and the room dims
        flag.t = 0;
        wind.t = 0;
        at(0.35, () => (jar.to = 0));
        at(0.35 + LIFT_TIME * 0.75, () => {
          sun.t = 0;
          setLive(false);
        });
      }
    };
    const quiet = () => {
      demo = false;
      idleAt = Infinity;
      wake = clock + 14;
    };
    api.current = {
      toggle: () => {
        quiet();
        toggle();
        kick();
      },
    };

    // render target
    const fbo = gl.createFramebuffer();
    const fbTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, fbTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    let scale = Math.min(MAX_SCALE, Math.max(1, window.devicePixelRatio || 1));
    let cssW = 1;
    let cssH = 1;
    let phone = false;
    let bw = 0;
    let bh = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      cssW = Math.max(1, r.width);
      cssH = Math.max(1, r.height);
      phone = cssW < 768;
      // never more than about 1.6 million pixels through the ray marcher
      const s = Math.min(scale, Math.sqrt(1.6e6 / (cssW * cssH)));
      const w = Math.round(cssW * s);
      const h = Math.round(cssH * s);
      if (w !== bw || h !== bh) {
        bw = w;
        bh = h;
        canvas.width = w;
        canvas.height = h;
        gl.bindTexture(gl.TEXTURE_2D, fbTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTex, 0);
      }
      dirty = true;
    };
    resize();

    const draw = () => {
      const wide = cssW / cssH;
      // where the jar is set down on the table, and where the camera stands
      const land = phone ? [0.6, -3.2] : [1.4, -3.0];
      const tgt = phone ? [0.3, 0.85, -1.5] : [-0.3, 0.72, -1.0];
      const az = (phone ? 0.3 : 0.4) + cam.ax * 0.07 + Math.sin(time * 0.19) * 0.012;
      const el = (phone ? 0.36 : 0.27) - cam.ay * 0.04 + Math.sin(time * 0.27 + 1) * 0.005;
      const fov = phone ? 0.52 : 0.42;
      const dist = phone ? 13.5 : 9.6 * Math.max(1, 1.75 / wide);
      const camPos = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] + dist * Math.cos(az) * Math.cos(el)];
      // the jar's path: straight up off its seat, across, and down onto the table
      const u = ease(Math.max(0, Math.min(1, jar.p)));
      const across = smooth(0.22, 0.82, u);
      const lift = 1.42 * (smooth(0, 0.3, u) - smooth(0.72, 1, u)) + 1.42 * smooth(0.72, 1, u) * 0;
      const jx = land[0] * across;
      const jz = land[1] * across;
      const jy = lift - 0.14 * smooth(0.72, 1, u) + bounce.x;

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(scene);
      gl.uniform2f(su.uRes, bw, bh);
      gl.uniform3f(su.uCam, camPos[0], camPos[1], camPos[2]);
      gl.uniform3f(su.uTarget, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFov, fov);
      gl.uniform1f(su.uTime, time);
      gl.uniform3f(su.uJar, jx, jy, jz);
      gl.uniform1f(su.uSun, Math.max(0, Math.min(1.1, sun.x)));
      gl.uniform1f(su.uFlag, Math.max(-0.05, Math.min(1.08, flag.x)));
      gl.uniform1f(su.uWind, Math.max(0, Math.min(1.1, wind.x)));
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(post);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fbTex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.uniform1i(pu.uSrc, 0);
      gl.uniform2f(pu.uRes, bw, bh);
      const f = [0.1 - camPos[0], 0.45 - camPos[1], 0 - camPos[2]];
      gl.uniform1f(pu.uFocus, Math.hypot(f[0], f[1], f[2]));
      gl.uniform1f(pu.uTime, reduce ? 0 : time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let raf = 0;
    let last = 0;
    let onScreen = true;
    let slow = 0;
    let first = true;
    const frame = (now: number) => {
      raf = 0;
      const raw = last ? (now - last) / 1000 : 0.016;
      last = now;
      const dt = Math.min(raw, 0.1);
      if (reduce) {
        if (dirty) {
          dirty = false;
          draw();
        }
      } else {
        clock += dt;
        time += dt;
        while (cues.length && cues[0].at <= clock) cues.shift()!.fn();
        if (clock > wake) {
          wake = Infinity;
          demo = true;
          idleAt = clock + 1.5;
        }
        if (demo && clock > idleAt) {
          toggle();
          idleAt = clock + (isLive ? HOLD_LIVE + LIFT_TIME : HOLD_DRAFT + LIFT_TIME + 0.35);
        }
        if (jar.p !== jar.to) {
          const before = jar.p;
          jar.p += Math.sign(jar.to - jar.p) * Math.min(Math.abs(jar.to - jar.p), dt / LIFT_TIME);
          // glass set down on wood: a small knock back up
          if (jar.p === jar.to && before !== jar.to) bounce.v += 0.32;
        }
        for (let n = 0; n < 4; n++) {
          const h = dt / 4;
          stepSpring(bounce, h);
          stepSpring(sun, h);
          stepSpring(flag, h);
          stepSpring(wind, h);
        }
        if (bounce.x < 0) {
          bounce.x = 0;
          bounce.v = Math.abs(bounce.v) * 0.3;
        }
        const kc = 1 - Math.exp(-dt * 3.2);
        cam.ax += (cam.tx - cam.ax) * kc;
        cam.ay += (cam.ty - cam.ay) * kc;
        draw();
        // step the resolution down if this machine cannot hold the frame rate
        if (raw > 0.03) slow++;
        else slow = Math.max(0, slow - 1);
        if (slow > 24 && scale > MIN_SCALE) {
          scale = Math.max(MIN_SCALE, scale * 0.84);
          slow = 0;
          resize();
        }
      }
      if (first) {
        first = false;
        setReady(true);
      }
      if (onScreen && !document.hidden && (!reduce || dirty)) raf = requestAnimationFrame(frame);
    };
    function kick() {
      if (!raf && onScreen && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    }
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      kick();
    });
    io.observe(root);
    const ro = new ResizeObserver(() => {
      resize();
      kick();
    });
    ro.observe(canvas);
    const onVis = () => kick();
    document.addEventListener("visibilitychange", onVis);
    const onMove = (e: PointerEvent) => {
      if (reduce) return;
      const r = root.getBoundingClientRect();
      cam.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      cam.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    };
    const onLeave = () => {
      cam.tx = 0;
      cam.ty = 0;
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    const onLost = (e: Event) => {
      e.preventDefault();
      setReady(false);
      cancelAnimationFrame(raf);
      api.current = null;
    };
    canvas.addEventListener("webglcontextlost", onLost);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
      api.current = null;
      gl.deleteTexture(fbTex);
      gl.deleteFramebuffer(fbo);
      gl.deleteBuffer(quad);
      gl.deleteProgram(scene);
      gl.deleteProgram(post);
    };
  }, [reduce]);

  const press = () => {
    if (api.current) api.current.toggle();
    else setLive((v) => !v);
  };
  const state = live ? STATES.live : STATES.draft;
  const curve = [0.2, 0.9, 0.2, 1] as const;

  return (
    <section ref={rootRef} className="relative isolate h-[680px] w-full overflow-hidden md:h-[720px]" style={{ backgroundColor: STAGE, fontFamily: FONT }}>
      <style>{`
        @keyframes bell-jar-go-live-flag { 0%, 100% { transform: skewY(0deg) scaleX(1) } 50% { transform: skewY(-5deg) scaleX(0.94) } }
        @keyframes bell-jar-go-live-sun { 0%, 100% { opacity: 0.75 } 50% { opacity: 1 } }
        .bell-jar-go-live-flag { transform-origin: 0 50%; animation: bell-jar-go-live-flag 1.1s ease-in-out infinite }
        .bell-jar-go-live-sun { animation: bell-jar-go-live-sun 2.4s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .bell-jar-go-live-flag, .bell-jar-go-live-sun { animation: none } }
      `}</style>
      {/* The still: the same scene built from elements. Shown before the renderer starts and wherever it cannot run. */}
      <div aria-hidden="true" className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`} style={{ background: "linear-gradient(180deg, #d9cfbf 0%, #e3d9c9 54%, #b98f62 54.2%, #a87d52 100%)" }}>
        <div className="bell-jar-go-live-sun absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(255,240,214,0.55) 0%, rgba(255,240,214,0) 46%)" }} />
        <div className="absolute isolate left-1/2 top-[50%] w-[300px] -translate-x-1/2 md:left-[64%] md:top-[44%] md:w-[420px]">
          {/* walnut base */}
          <div className="absolute left-0 right-0 top-[150px] h-[70px] rounded-[50%] md:top-[205px] md:h-[96px]" style={{ background: "radial-gradient(70% 70% at 40% 35%, #5a301a 0%, #2a140a 70%)", boxShadow: "0 30px 40px -18px rgba(60,30,10,0.6)" }} />
          {/* card blocks */}
          <div className="absolute left-[16%] top-[70px] h-[100px] w-[38%] rounded-[3px] md:top-[95px] md:h-[136px]" style={{ background: "linear-gradient(90deg, #f3efe6 0%, #ddd6c9 100%)", boxShadow: "6px 8px 14px rgba(70,50,30,0.25)" }} />
          <div className="absolute left-[56%] top-[24px] h-[146px] w-[28%] rounded-[3px] md:top-[30px] md:h-[200px]" style={{ background: "linear-gradient(90deg, #faf7f0 0%, #e2dbcf 100%)", boxShadow: "6px 8px 14px rgba(70,50,30,0.25)" }} />
          <div className="absolute left-[14%] top-[150px] h-[16px] w-[18%] rounded-full md:top-[206px] md:h-[22px]" style={{ backgroundColor: BLUE }} />
          {/* flag */}
          <div className="absolute left-[80%] top-[-62px] h-[86px] w-[2px] bg-[#b08a4a] md:top-[-86px] md:h-[118px]" />
          <div className={`absolute left-[80.5%] h-[24px] w-[42px] md:h-[30px] md:w-[56px] ${live ? "bell-jar-go-live-flag " : ""}${live ? "top-[-60px] md:top-[-84px]" : "top-[0px] md:top-[2px]"}`} style={{ backgroundColor: BLUE, clipPath: "polygon(0 0, 100% 12%, 92% 55%, 100% 92%, 0 100%)" }} />
          {/* the jar, over the model or set down beside it */}
          <div
            className="absolute top-[-110px] h-[300px] w-[106%] rounded-t-[50%] md:top-[-150px] md:h-[410px]"
            style={{
              left: live ? "58%" : "-3%",
              transform: live ? "translateY(-70px) scale(0.56)" : "none",
              zIndex: live ? -1 : 1,
              transformOrigin: "50% 100%",
              border: "1.5px solid rgba(255,255,255,0.65)",
              background: "linear-gradient(90deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.04) 18%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.22) 92%, rgba(255,255,255,0.05) 100%)",
              boxShadow: "inset 0 0 26px rgba(255,255,255,0.35)",
            }}
          />
        </div>
      </div>

      <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} />

      <div className="pointer-events-none absolute left-5 top-6 md:left-12 md:top-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] md:text-[11px]" style={{ color: "rgba(11,13,18,0.55)" }}>
          Under glass <span className="mx-1.5" style={{ color: "rgba(11,13,18,0.3)" }}>/</span> Draft to live
        </p>
        <div className="relative mt-1 h-[84px] w-[300px] overflow-hidden md:mt-3 md:h-[128px] md:w-[380px] lg:h-[160px] lg:w-[440px]">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.h2
              key={state.word}
              initial={reduce ? { opacity: 0 } : { y: "62%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { y: "-46%", opacity: 0 }}
              transition={reduce ? { duration: 0.01 } : { y: { type: "spring", stiffness: 240, damping: 21 }, opacity: { duration: 0.3, ease: curve } }}
              className="absolute left-0 top-0 text-[84px] font-extrabold leading-[1] tracking-[-0.065em] md:text-[124px] lg:text-[156px]"
              style={{ color: INK }}
            >
              {state.word}
            </motion.h2>
          </AnimatePresence>
        </div>
        <p className="mt-1 max-w-[260px] text-[15px] font-medium leading-snug tracking-tight md:mt-2 md:max-w-[300px] md:text-[17px]" style={{ color: "rgba(11,13,18,0.68)" }}>
          {state.line}
        </p>
      </div>

      <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-4 md:inset-x-auto md:bottom-12 md:left-12">
        <button
          type="button"
          onClick={press}
          aria-pressed={live}
          aria-label={live ? "Live. Press to cover the page with the glass again" : "Draft. Press to take the glass off and go live"}
          className="flex h-12 items-center gap-2.5 rounded-full pl-5 pr-6 text-[15px] font-bold tracking-tight transition-[transform,background-color,color,box-shadow] duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E7DFD2] active:scale-95 motion-reduce:transition-none"
          style={live ? { backgroundColor: PAPER, color: INK, boxShadow: "0 10px 24px -12px rgba(60,40,20,0.5), inset 0 0 0 1px rgba(11,13,18,0.12)" } : { backgroundColor: BLUE, color: INK, boxShadow: "0 14px 30px -10px rgba(79,152,251,0.75), inset 0 1px 0 rgba(255,255,255,0.45)" }}
        >
          <svg viewBox="0 0 20 20" className={`h-5 w-5 transition-transform duration-300 motion-reduce:transition-none ${live ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 16V4M5 9l5-5 5 5" />
          </svg>
          {state.action}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        The page is {live ? "live" : "a draft"}. {state.line}
      </p>
    </section>
  );
}
