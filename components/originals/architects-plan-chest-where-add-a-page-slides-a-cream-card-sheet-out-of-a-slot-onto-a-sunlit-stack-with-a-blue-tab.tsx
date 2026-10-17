import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** The pages of the site, in the order they are added. The first four are on the stack when it opens. */
const PAGES = ["Home", "Menu", "About", "Contact", "Gallery", "Bookings", "Journal", "Events"];
const START = 4;

const BLUE = "#4F98FB";
const INK = "#0B0D12";
const PAPER = "#F6F4EF";
const STAGE = "#E4DCCF";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
/** Seconds one sheet takes from the slot to the stack (or back). */
const MOVE_TIME = 1.7;
/** Seconds the self-playing demo waits before its first sheet, and between sheets after that. */
const FIRST_HOLD = 4.2;
const HOLD = 2.6;
/** Lowest and highest render scale (canvas pixels per CSS pixel). Above one the scene is supersampled. */
const MIN_SCALE = 0.6001;
const MAX_SCALE = 1.7001;
/** How thick one sheet is, and how far apart they lie on the stack, in scene units. */
const HALF_T = 0.0085;
const PITCH = 0.0215;
const TOP = 0.6;

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
uniform int uCount;      // sheets lying on the stack
uniform int uBlue;       // which of them carries the blue tab (-1: the moving one has it)
uniform vec4 uS[8];      // per sheet: offset x, offset z, turn, where its tab sits
uniform float uMove;     // 1 while a sheet is travelling
uniform vec3 uMP;        // the travelling sheet's centre
uniform mat3 uMR;        // and its turn
uniform vec2 uMB;        // its bend along its length, and a flutter across it
uniform float uMTab;
uniform vec2 uTop;       // the top sheet settling: a lift and a tip

const vec3 SUNC = vec3(1.0, 0.85, 0.66);
const float HT = ${HALF_T.toFixed(4)}, PITCH = ${PITCH.toFixed(4)}, TOP = ${TOP.toFixed(2)}, WALL = -4.6;
const vec2 SH = vec2(0.8, 0.58);
vec3 gL; float gPix, gDist, gSoft = 0.04;

float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ return 0.5 * n2(p) + 0.25 * n2(p * 2.03 + 1.7) + 0.125 * n2(p * 4.01 + 3.1); }
float rb2(vec2 p, vec2 h, float r){ vec2 d = abs(p) - h + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r; }
float ext(float d2, float y, float h, float bev){ vec2 w = vec2(d2, abs(y) - h) + bev; return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - bev; }
float box(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }

// one sheet of card in its own frame, with its index tab standing off the right-hand edge
float sheet(vec3 q, float tz){
  float d = ext(rb2(q.xz, SH, 0.012), q.y, HT, 0.0025);
  return min(d, ext(rb2(q.xz - vec2(SH.x + 0.035, tz), vec2(0.075, 0.08), 0.028), q.y, HT, 0.0025));
}
vec3 stackQ(vec3 p, int i){
  vec4 s = uS[i];
  vec3 q = p - vec3(s.x, TOP + HT + float(i) * PITCH, s.y);
  if (i == uCount - 1){ q.y -= uTop.x; float a = uTop.y; q.yz = vec2(cos(a) * q.y + sin(a) * q.z, -sin(a) * q.y + cos(a) * q.z); }
  float c = cos(s.z), sn = sin(s.z);
  return vec3(c * q.x - sn * q.z, q.y, sn * q.x + c * q.z);
}
vec3 moveQ(vec3 p){
  vec3 q = (p - uMP) * uMR;
  q.y -= uMB.x * (q.z * q.z - 0.11) + uMB.y * sin(q.x * 3.2 + uTime * 9.0) * (q.x + 0.8);
  return q;
}

vec2 map(vec3 p){
  // the plan chest: ebonised wood, with a long slot across its front
  vec2 res = vec2(box(p - vec3(0.0, 0.3, 0.0), vec3(1.25, 0.3, 0.9), 0.024), 1.0);
  res.x = max(res.x, -box(p - vec3(0.0, 0.405, 0.9), vec3(0.9, 0.019, 0.32), 0.003));
  res.x = max(res.x, -box(p - vec3(0.0, 0.02, 0.9), vec3(1.4, 0.022, 0.05), 0.0));
  // brass: a pull and a label holder on the drawer below the slot
  float d = box(p - vec3(0.32, 0.2, 0.912), vec3(0.17, 0.016, 0.022), 0.012);
  d = min(d, max(box(p - vec3(-0.42, 0.2, 0.903), vec3(0.15, 0.058, 0.007), 0.004), -box(p - vec3(-0.42, 0.195, 0.912), vec3(0.135, 0.044, 0.01), 0.0)));
  if (d < res.x) res = vec2(d, 2.0);
  // the label card inside the holder
  d = box(p - vec3(-0.42, 0.195, 0.903), vec3(0.136, 0.045, 0.004), 0.001);
  if (d < res.x) res = vec2(d, 3.0);
  // the stack of sheets on top
  float top = TOP + float(uCount) * PITCH + 0.02;
  float bnd = box(p - vec3(0.06, (TOP + top) * 0.5, 0.0), vec3(1.0, (top - TOP) * 0.5 + 0.03, 0.72), 0.0);
  if (bnd < 0.03){
    for (int i = 0; i < 8; i++){
      if (i >= uCount) break;
      d = sheet(stackQ(p, i), uS[i].w);
      if (d < res.x) res = vec2(d, 10.0 + float(i));
    }
  } else if (bnd < res.x) res = vec2(bnd, 0.0);
  if (uMove > 0.5){
    d = sheet(moveQ(p), uMTab) * 0.7;
    if (d < res.x) res = vec2(d, 30.0);
  }
  return res;
}
vec3 normal(vec3 p){
  vec2 e = vec2(1.0, -1.0) * 0.0006;
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}
vec2 march(vec3 ro, vec3 rd, float far){
  float t = 0.0; vec2 h = vec2(0.0);
  for (int i = 0; i < 140; i++){
    h = map(ro + rd * t);
    if (abs(h.x) < 0.00025 * (1.0 + t * 0.4) || t > far) break;
    t += h.x * 0.9;
  }
  return vec2(t, (t > far || h.x > 0.01 || h.y < 0.5) ? 0.0 : h.y);
}
float softShadow(vec3 ro, vec3 rd){
  float res = 1.0, t = 0.008;
  for (int i = 0; i < 34; i++){
    float h = map(ro + rd * t).x;
    res = min(res, 10.0 * h / t);
    t += clamp(h, 0.006, 0.18);
    if (res < 0.004 || t > 3.0) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}
float occ(vec3 p, vec3 n){
  float o = 0.0, s = 1.0;
  for (int i = 0; i < 5; i++){
    float h = 0.006 + 0.08 * float(i) / 4.0;
    o += (h - map(p + n * h).x) * s;
    s *= 0.75;
  }
  return clamp(1.0 - 3.2 * o, 0.0, 1.0);
}

// the window out of shot on the left: its bars fall across the desk and the chest
float panes(vec2 w, float s){
  float frame = smoothstep(s, -s, max(abs(w.x) - 3.2, abs(w.y) - 2.6));
  float gx = abs(fract(w.x * 0.5) - 0.5) * 2.0;
  float gy = abs(fract(w.y / 5.2 + 0.5) - 0.5) * 5.2;
  return frame * smoothstep(0.05 - s, 0.05 + s, gx) * smoothstep(0.06 - s, 0.06 + s, gy);
}
float win(vec3 p){
  float t = (-7.0 - p.x) / gL.x;
  vec3 q = p + gL * t;
  return panes(vec2(q.z - 1.6, q.y - 5.0), 0.012 * t + 0.02);
}
vec3 env(vec3 ro, vec3 rd){
  vec3 c = mix(vec3(0.17, 0.14, 0.11), vec3(0.52, 0.47, 0.41), smoothstep(-0.3, 0.7, rd.y));
  if (rd.x < -0.02){
    float t = (-7.0 - ro.x) / rd.x;
    vec3 q = ro + rd * t;
    c = mix(c, vec3(1.5, 1.6, 1.78) * 3.0, panes(vec2(q.z - 1.6, q.y - 5.0), gSoft));
  }
  return c;
}
vec3 sunLight(vec3 p, vec3 n, bool hq){
  float d = dot(n, gL);
  if (d <= 0.0) return vec3(0.0);
  float v = win(p);
  if (v > 0.001 && hq) v *= softShadow(p + n * 0.002, gL);
  return SUNC * 3.4 * d * v;
}
vec3 fill(vec3 n, float ao){
  vec3 c = vec3(0.34, 0.37, 0.43) * max(-n.x * 0.7 + n.y * 0.3, 0.0) + vec3(0.3, 0.22, 0.15) * max(-n.y, 0.0) + vec3(0.24, 0.21, 0.18) * (0.6 + 0.4 * n.y);
  return c * ao;
}

// a pencilled page layout on the face of a sheet; each page gets its own arrangement
float pageSketch(vec2 f, float k, float lw){
  float ink = 0.0;
  // menu rule along the top and a mark for the name
  ink = max(ink, smoothstep(lw, lw * 0.3, abs(f.y + 0.47)) * step(abs(f.x), 0.7));
  ink = max(ink, smoothstep(lw, lw * 0.3, abs(rb2(f - vec2(-0.6, -0.515), vec2(0.07, 0.022), 0.02))));
  for (int j = 0; j < 3; j++) ink = max(ink, smoothstep(lw, lw * 0.3, abs(f.y + 0.515)) * step(abs(f.x - 0.3 - 0.13 * float(j)), 0.045));
  float side = k < 0.5 ? -1.0 : 1.0;
  // headline lines
  for (int j = 0; j < 3; j++){
    float y = -0.34 + 0.07 * float(j);
    float len = j == 2 ? 0.22 : 0.4 - 0.08 * float(j);
    ink = max(ink, smoothstep(lw * 1.8, lw * 0.5, abs(f.y - y)) * step(abs(f.x - ((side < 0.0 ? -0.7 : 0.06) + len)), len));
  }
  // a picture box with a hill and a sun
  vec2 c = f - vec2(-side * 0.36, -0.22);
  ink = max(ink, smoothstep(lw, lw * 0.3, abs(rb2(c, vec2(0.28, 0.17), 0.012))));
  float hill = abs(c.y - 0.1 + 0.12 * max(0.0, 1.0 - abs(c.x + 0.06) * 3.2));
  ink = max(ink, smoothstep(lw, lw * 0.3, hill) * step(abs(c.x), 0.28) * step(-0.17, c.y));
  ink = max(ink, smoothstep(lw, lw * 0.3, abs(length(c - vec2(0.12, -0.07)) - 0.03)));
  // a row of cards along the bottom, or text lines for even pages
  if (fract(k * 3.7) < 0.5){
    for (int j = 0; j < 3; j++) ink = max(ink, smoothstep(lw, lw * 0.3, abs(rb2(f - vec2(-0.47 + 0.47 * float(j), 0.3), vec2(0.2, 0.15), 0.02))));
  } else {
    for (int j = 0; j < 4; j++) ink = max(ink, smoothstep(lw, lw * 0.3, abs(f.y - 0.12 - 0.075 * float(j))) * step(abs(f.x), 0.66 - 0.2 * step(2.5, float(j))));
    ink = max(ink, smoothstep(lw, lw * 0.3, abs(rb2(f - vec2(-0.5, 0.46), vec2(0.13, 0.04), 0.04))));
  }
  return ink;
}

vec3 shadePaper(vec3 p, vec3 n, vec3 q, vec3 nl, bool blueTab, float k, vec3 rd, float ao, vec3 sl){
  bool tab = q.x > SH.x + 0.002;
  vec3 alb = vec3(0.86, 0.82, 0.73);
  if (tab) alb = blueTab ? vec3(0.072, 0.29, 0.92) : vec3(0.74, 0.69, 0.59);
  float tooth = n2(q.xz * 520.0) * 0.5 + n2(q.zx * 330.0 + 7.0) * 0.5;
  alb *= 1.0 + 0.08 * (tooth - 0.5) * clamp(0.0016 / (gDist * gPix), 0.0, 1.0);
  // the cut edges are a shade warmer and darker than the faces
  float face = smoothstep(0.6, 0.9, abs(nl.y));
  alb *= mix(0.86, 1.0, face);
  if (!tab && nl.y > 0.6){
    float lw = max(0.0032, gDist * gPix * 0.85);
    float ink = pageSketch(q.xz, k, lw);
    alb = mix(alb, vec3(0.22, 0.21, 0.22), ink * 0.9 * min(1.0, 0.004 / lw));
  }
  vec3 col = alb * (sl + fill(n, ao));
  // sun through the card from behind
  col += alb * vec3(1.0, 0.88, 0.7) * 0.32 * max(-dot(n, gL), 0.0) * win(p) * ao;
  vec3 r = reflect(rd, n);
  float nv = max(dot(n, -rd), 0.0);
  col += env(p, r) * (0.02 + 0.18 * pow(1.0 - nv, 5.0)) * ao;
  return col;
}

vec3 shade(vec3 p, vec3 n, float id, vec3 rd){
  float ao = occ(p, n);
  vec3 sl = sunLight(p, n, true);
  vec3 r = reflect(rd, n);
  float nv = max(dot(n, -rd), 0.0);
  if (id < 1.5){
    // ebonised oak with a satin finish: the open grain still shows
    vec2 g2 = abs(n.x) > 0.5 ? p.zy : (abs(n.z) > 0.5 ? p.xy : p.xz);
    float g = fbm(vec2(g2.x * 2.5 + fbm(g2 * 3.0) * 1.2, g2.y * 40.0));
    vec3 alb = mix(vec3(0.028, 0.026, 0.025), vec3(0.075, 0.062, 0.05), g);
    float pore = smoothstep(0.62, 0.8, n2(vec2(g2.x * 30.0, g2.y * 300.0)));
    alb *= 1.0 - 0.35 * pore;
    // drawer seams on the front
    float seam = n.z > 0.9 ? max(smoothstep(0.006, 0.0015, abs(p.y - 0.29)), smoothstep(0.006, 0.0015, abs(p.y - 0.1))) : 0.0;
    alb *= 1.0 - 0.8 * seam;
    vec3 col = alb * (sl + fill(n, ao));
    float f = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
    vec3 rr = normalize(r + (vec3(n2(g2 * 40.0), 0.0, n2(g2.yx * 40.0)) - 0.5) * 0.06);
    col += env(p, rr) * f * ao * 0.9 * (1.0 - seam);
    col += SUNC * pow(max(dot(rr, gL), 0.0), 70.0) * 2.4 * length(sl) * (1.0 - pore * 0.5);
    return col;
  }
  if (id < 2.5){
    vec3 f0 = vec3(0.9, 0.7, 0.4);
    vec3 F = f0 + (1.0 - f0) * pow(1.0 - nv, 5.0);
    vec3 rr = normalize(r + (vec3(n2(p.xy * 300.0), n2(p.yx * 300.0), 0.0) - 0.5) * 0.04);
    return F * (env(p, rr) * (0.35 + 0.65 * ao) + SUNC * pow(max(dot(rr, gL), 0.0), 50.0) * 7.0 * win(p) * softShadow(p + n * 0.003, gL)) + f0 * 0.04 * fill(n, ao);
  }
  if (id < 3.5){
    vec3 alb = vec3(0.84, 0.8, 0.7);
    vec2 f = p.xy - vec2(-0.42, 0.195);
    float lw = max(0.0028, gDist * gPix * 0.8);
    float ink = smoothstep(lw * 2.0, lw * 0.6, abs(f.y)) * step(abs(f.x), 0.07);
    alb = mix(alb, vec3(0.2), ink * 0.7);
    return alb * (sl + fill(n, ao)) * 0.9;
  }
  if (id < 25.0){
    int i = int(id - 10.0 + 0.5);
    vec3 q = stackQ(p, i);
    return shadePaper(p, n, q, vec3(0.0, sign(q.y) * step(HT * 0.7, abs(q.y)), 0.0), i == uBlue, fract(float(i) * 0.618 + 0.2), rd, ao, sl);
  }
  vec3 q = moveQ(p);
  return shadePaper(p, n, q, vec3(0.0, sign(q.y) * step(HT * 0.7, abs(q.y)), 0.0), true, fract(float(uCount) * 0.618 + 0.2), rd, ao, sl);
}

vec3 deskShade(vec3 p, vec3 rd, float t){
  vec3 n = vec3(0.0, 1.0, 0.0);
  float w = fbm(vec2(p.x * 0.35, p.z * 6.0 + fbm(p.xz * vec2(0.4, 1.6)) * 4.0));
  float fine = n2(vec2(p.x * 2.0, p.z * 90.0));
  vec3 alb = mix(vec3(0.44, 0.29, 0.16), vec3(0.62, 0.45, 0.28), w) * (0.92 + 0.12 * fine);
  // contact shadow under the chest
  vec2 e = abs(p.xz) - vec2(1.25, 0.9);
  float dc = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0);
  float ao = clamp(0.25 + 0.75 * smoothstep(0.0, 0.4, dc), 0.0, 1.0);
  float sv = win(p);
  if (sv > 0.001 && t < 30.0 && dc < 3.5) sv *= softShadow(p + n * 0.002, gL);
  vec3 col = alb * (SUNC * 3.4 * gL.y * sv + fill(n, ao) * 0.95);
  float f = 0.035 + 0.965 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
  vec3 rr = reflect(rd, normalize(n + vec3(0.0, 0.0, w - 0.5) * 0.04));
  gSoft = 0.6;
  col += env(p, rr) * f * 0.3 * ao;
  gSoft = 0.04;
  col += SUNC * sv * pow(max(dot(rr, gL), 0.0), 40.0) * 0.5;
  return col;
}
vec3 wallShade(vec3 p){
  vec3 alb = vec3(0.7, 0.64, 0.56) * (0.94 + 0.08 * fbm(p.xy * 3.0));
  float sv = win(p) * max(gL.z, 0.0);
  return alb * (SUNC * 3.4 * sv + vec3(0.25, 0.22, 0.19) * (0.55 + 0.45 * smoothstep(0.0, 0.8, p.y)));
}
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main(){
  gL = normalize(vec3(-0.78, 0.5, 0.36));
  gPix = 2.0 * tan(uFov * 0.5) / uRes.y;
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 fw = normalize(uTarget - uCam), rgt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))), up = cross(rgt, fw);
  vec3 rd = normalize(fw + (uv.x * rgt + uv.y * up) * 2.0 * tan(uFov * 0.5));
  vec3 ro = uCam;
  float tf = rd.y < -1e-4 ? -ro.y / rd.y : 1e5;
  float tw = rd.z < -1e-4 ? (WALL - ro.z) / rd.z : 1e5;
  vec2 hit = march(ro, rd, min(min(tf, tw), 30.0));
  float t; vec3 col;
  if (hit.y > 0.5 && hit.x < min(tf, tw)){
    t = hit.x; vec3 p = ro + rd * t; gDist = t;
    col = shade(p, normal(p), hit.y, rd);
  } else if (tf < tw){
    t = tf; col = deskShade(ro + rd * tf, rd, tf);
  } else {
    t = tw; col = wallShade(ro + rd * tw);
  }
  // sunbeams in the air
  {
    float tm = min(t, 16.0), acc = 0.0, j = h21(gl_FragCoord.xy + fract(uTime) * 17.0);
    for (int i = 0; i < 8; i++){
      vec3 q = ro + rd * tm * (float(i) + j) / 8.0;
      acc += win(q) * smoothstep(0.0, 0.6, q.y);
    }
    col += SUNC * 3.4 * acc / 8.0 * tm * 0.004;
  }
  col *= 0.6;
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
  float coc = clamp(abs(z - uFocus) / max(z, 0.1) * (z < uFocus ? 3.5 : 6.0) - 0.5, 0.0, 5.0) * px;
  vec3 acc = c0.rgb; float ws = 1.0;
  float j = hash(gl_FragCoord.xy) * 6.283;
  float lod = log2(max(coc / 3.0, 1.0));
  for (int i = 0; i < 14; i++){
    float fi = (float(i) + 0.5) / 14.0;
    float a = float(i) * 2.39996 + j;
    vec2 off = vec2(cos(a), sin(a)) * sqrt(fi) * coc / uRes;
    vec4 s = textureLod(uSrc, vUv + off, lod);
    float w = 1.0 + 1.5 * pow(max(s.r, max(s.g, s.b)), 6.0);
    acc += s.rgb * w; ws += w;
  }
  vec3 col = acc / ws;
  vec3 bl = textureLod(uSrc, vUv, 3.0).rgb * 0.35 + textureLod(uSrc, vUv, 4.5).rgb * 0.35 + textureLod(uSrc, vUv, 6.0).rgb * 0.3;
  col += bl * bl * 0.08;
  vec2 v = vUv - vec2(0.58, 0.5);
  col *= 1.0 - dot(v, v) * 0.42;
  float g = hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;
  col += g * 0.02 * (1.0 - 0.4 * col);
  o = vec4(col, 1.0);
}`;

/* ---------- motion helpers ---------- */

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
/** Each sheet lies a little askew, with its tab at its own height down the edge. */
const LAY = PAGES.map((_, i) => {
  const r = (k: number) => {
    const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  return [(r(1) - 0.5) * 0.09, (r(2) - 0.5) * 0.07, (r(3) - 0.5) * 0.09, -0.42 + ((i * 0.19) % 0.76)];
});

/** Rotation from a turn about the vertical, a tip about the sheet's width and a roll along its length. */
function rot(yaw: number, pitch: number, roll: number) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
  // R = Ry * Rx * Rz, written column by column for WebGL
  const Ry = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
  const Rx = [1, 0, 0, 0, cp, sp, 0, -sp, cp];
  const Rz = [cr, sr, 0, -sr, cr, 0, 0, 0, 1];
  const mul = (a: number[], b: number[]) => {
    const m = new Array(9).fill(0);
    for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) m[c * 3 + r] += a[k * 3 + r] * b[c * 3 + k];
    return m;
  };
  return new Float32Array(mul(mul(Ry, Rx), Rz));
}

/** Where the travelling sheet is at u (0 inside the chest, 1 lying on the stack as sheet k). */
function pose(u: number, k: number, time: number) {
  const inside = [0, 0.405, 0.22];
  const out = [0, 0.405, 1.62];
  const lay = LAY[k];
  const rest = [lay[0], TOP + HALF_T + k * PITCH, lay[1]];
  if (u < 0.34) {
    const a = easeInOut(u / 0.34);
    return { p: [0, inside[1], inside[2] + (out[2] - inside[2]) * a], yaw: 0, pitch: 0, roll: 0, bend: 0, flut: 0 };
  }
  const b = (u - 0.34) / 0.66;
  const e = easeInOut(b);
  const arc = Math.sin(Math.PI * Math.pow(b, 0.8));
  return {
    p: [out[0] + (rest[0] - out[0]) * e, out[1] + (rest[1] - out[1]) * e + 0.62 * arc, out[2] + (rest[2] - out[2]) * e],
    yaw: lay[2] * e + 0.22 * arc,
    pitch: 0.42 * arc,
    roll: -0.12 * arc,
    bend: 0.22 * arc,
    flut: 0.012 * arc * (0.6 + 0.4 * Math.sin(time * 3)),
  };
}

export default function PlanChestAddAPage() {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(START);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ add: () => void; remove: () => void } | null>(null);

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
    const su = Object.fromEntries(["uRes", "uCam", "uTarget", "uFov", "uTime", "uCount", "uBlue", "uS", "uMove", "uMP", "uMR", "uMB", "uMTab", "uTop"].map((n) => [n, U(scene, n)]));
    const pu = Object.fromEntries(["uSrc", "uRes", "uFocus", "uTime"].map((n) => [n, U(post, n)]));
    const sheets = new Float32Array(LAY.flat());

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    let n = START;
    let move: { k: number; u: number; dir: 1 | -1 } | null = null;
    // the top sheet settling after it lands: a cushion of air under it, then a small tip
    const settle = { t: 99 };
    const cam = { ax: 0, ay: 0, tx: 0, ty: 0 };
    let demo = !reduce;
    let clock = 0;
    let time = 0;
    let next = FIRST_HOLD;
    let wake = Infinity;
    let dirty = true;
    let demoDir: 1 | -1 = 1;

    const start = (dir: 1 | -1) => {
      if (move) return false;
      if (dir === 1 && n >= PAGES.length) return false;
      if (dir === -1 && n <= 1) return false;
      if (reduce) {
        n += dir;
        setCount(n);
        dirty = true;
        return true;
      }
      if (dir === 1) {
        move = { k: n, u: 0, dir };
      } else {
        n -= 1;
        move = { k: n, u: 1, dir };
        setCount(n);
      }
      setBusy(true);
      return true;
    };
    const quiet = () => {
      demo = false;
      next = Infinity;
      wake = clock + 14;
    };
    api.current = {
      add: () => {
        quiet();
        start(1);
        kick();
      },
      remove: () => {
        quiet();
        start(-1);
        kick();
      },
    };

    const fbo = gl.createFramebuffer();
    const fbTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, fbTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    let scale = Math.min(MAX_SCALE, Math.max(1.25, window.devicePixelRatio || 1));
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
      // never more than about 1.7 million pixels through the ray marcher
      const s = Math.min(scale, Math.sqrt(1.7e6 / (cssW * cssH)));
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
      const tgt = phone ? [0.1, 0.5, 0.45] : [-0.72, 0.5, 0.3];
      const az = (phone ? 0.42 : 0.5) + cam.ax * 0.06 + Math.sin(time * 0.17) * 0.01;
      const el = (phone ? 0.52 : 0.44) - cam.ay * 0.035 + Math.sin(time * 0.23 + 1) * 0.004;
      const fov = phone ? 0.5 : 0.4;
      const dist = phone ? 12.5 : 7.6 * Math.max(1, 1.75 / wide);
      const camPos = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] + dist * Math.cos(az) * Math.cos(el)];

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(scene);
      gl.uniform2f(su.uRes, bw, bh);
      gl.uniform3f(su.uCam, camPos[0], camPos[1], camPos[2]);
      gl.uniform3f(su.uTarget, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFov, fov);
      gl.uniform1f(su.uTime, time);
      gl.uniform4fv(su.uS, sheets);
      const stackN = move ? move.k : n;
      gl.uniform1i(su.uCount, stackN);
      gl.uniform1i(su.uBlue, move ? -1 : n - 1);
      // the sheet that has just landed floats down on its own air, then tips flat
      const st = settle.t;
      const lift = st < 1.2 ? 0.035 * Math.exp(-st * 7) * Math.abs(Math.cos(st * 13)) : 0;
      const tip = st < 1.2 ? 0.05 * Math.exp(-st * 6) * Math.sin(st * 17) : 0;
      gl.uniform2f(su.uTop, move ? 0 : lift, move ? 0 : tip);
      if (move) {
        const ps = pose(clamp01(move.u), move.k, time);
        gl.uniform1f(su.uMove, 1);
        gl.uniform3f(su.uMP, ps.p[0], ps.p[1], ps.p[2]);
        gl.uniformMatrix3fv(su.uMR, false, rot(ps.yaw, ps.pitch, ps.roll));
        gl.uniform2f(su.uMB, ps.bend, ps.flut);
        gl.uniform1f(su.uMTab, LAY[move.k][3]);
      } else {
        gl.uniform1f(su.uMove, 0);
        gl.uniform3f(su.uMP, 0, -5, 0);
        gl.uniformMatrix3fv(su.uMR, false, rot(0, 0, 0));
        gl.uniform2f(su.uMB, 0, 0);
        gl.uniform1f(su.uMTab, 0);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(post);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fbTex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.uniform1i(pu.uSrc, 0);
      gl.uniform2f(pu.uRes, bw, bh);
      const f = [0.05 - camPos[0], 0.65 - camPos[1], 0.2 - camPos[2]];
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
        settle.t += dt;
        if (clock > wake) {
          wake = Infinity;
          demo = true;
          next = clock + 1.5;
        }
        if (demo && !move && clock > next) {
          if (n >= 6) demoDir = -1;
          if (n <= START) demoDir = 1;
          start(demoDir);
          next = Infinity;
        }
        if (move) {
          move.u += (move.dir * dt) / MOVE_TIME;
          if (move.dir === 1 && move.u >= 1) {
            n = move.k + 1;
            move = null;
            settle.t = 0;
            setCount(n);
            setBusy(false);
            if (demo) next = clock + HOLD;
          } else if (move.dir === -1 && move.u <= 0) {
            move = null;
            setBusy(false);
            if (demo) next = clock + HOLD * 0.7;
          }
        }
        const kc = 1 - Math.exp(-dt * 3.2);
        cam.ax += (cam.tx - cam.ax) * kc;
        cam.ay += (cam.ty - cam.ay) * kc;
        draw();
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

  const add = () => {
    if (api.current) api.current.add();
    else setCount((c) => Math.min(PAGES.length, c + 1));
  };
  const remove = () => {
    if (api.current) api.current.remove();
    else setCount((c) => Math.max(1, c - 1));
  };
  const top = PAGES[count - 1];
  const full = count >= PAGES.length;

  return (
    <section ref={rootRef} className="relative isolate h-[700px] w-full overflow-hidden md:h-[720px]" style={{ backgroundColor: STAGE, fontFamily: FONT }}>
      {/* The still: the same scene built from elements, shown before the renderer starts and wherever it cannot run. */}
      <div aria-hidden="true" className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`} style={{ background: "linear-gradient(180deg, #d8cebf 0%, #e1d7c8 48%, #b48a5e 48.2%, #a07651 100%)" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(112deg, rgba(255,240,214,0.55) 0%, rgba(255,240,214,0) 50%)" }} />
        <div className="absolute left-1/2 top-[52%] w-[300px] -translate-x-1/2 md:left-[66%] md:top-[44%] md:w-[440px]">
          <div className="absolute left-0 right-0 top-[60px] h-[120px] rounded-[6px] md:top-[80px] md:h-[170px]" style={{ background: "linear-gradient(180deg, #23201d 0%, #0f0e0d 100%)", boxShadow: "0 40px 50px -24px rgba(50,25,8,0.7)" }}>
            <div className="absolute left-[12%] right-[12%] top-[36%] h-[5px] rounded-full bg-black" />
            <div className="absolute left-[60%] top-[66%] h-[8px] w-[22%] rounded-full" style={{ background: "linear-gradient(180deg,#e8c27a,#9b7135)" }} />
          </div>
          {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
            <div key={i} className="absolute left-[10%] h-[64px] w-[74%] rounded-[3px] md:h-[86px]" style={{ top: 2 - i * 3, background: "linear-gradient(180deg,#f3ecdc,#ddd3bf)", boxShadow: "0 1px 0 rgba(90,70,40,0.35)", transform: `rotate(${(i % 3) - 1}deg)` }}>
              <div className="absolute -right-[18px] h-[16px] w-[22px] rounded-r-[6px]" style={{ top: 8 + ((i * 13) % 40), backgroundColor: i === count - 1 ? BLUE : "#c9bda4" }} />
            </div>
          ))}
        </div>
      </div>

      <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} />

      <div className="pointer-events-none absolute left-5 right-5 top-6 md:left-12 md:right-auto md:top-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] md:text-[11px]" style={{ color: "rgba(11,13,18,0.58)" }}>
          Plan chest <span className="mx-1.5" style={{ color: "rgba(11,13,18,0.3)" }}>/</span> Pages of the site
        </p>
        <div className="relative mt-1 h-[84px] w-full overflow-hidden md:mt-3 md:h-[132px] md:w-[460px] lg:h-[164px] lg:w-[520px]">
          <AnimatePresence initial={false} mode="wait">
            <motion.h2
              key={top}
              initial={reduce ? { opacity: 0 } : { y: "70%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { y: "-30%", opacity: 0 }}
              transition={reduce ? { duration: 0.01 } : { y: { type: "spring", stiffness: 300, damping: 22 }, opacity: { duration: 0.18 } }}
              className="absolute left-0 top-0 text-[72px] font-extrabold leading-[1] tracking-[-0.065em] md:text-[112px] lg:text-[138px]"
              style={{ color: INK }}
            >
              {top}
            </motion.h2>
          </AnimatePresence>
        </div>
        <ol className="mt-2 flex max-w-[340px] flex-wrap gap-x-3 gap-y-1 text-[14px] font-semibold tracking-tight md:mt-3 md:text-[15px]" aria-label="Pages on the stack">
          {PAGES.slice(0, count).map((p, i) => (
            <li key={p} className="flex items-center gap-1.5" style={{ color: i === count - 1 ? INK : "rgba(11,13,18,0.6)" }}>
              <span aria-hidden="true" className="inline-block h-2 w-2 rounded-[2px]" style={{ backgroundColor: i === count - 1 ? BLUE : "rgba(11,13,18,0.28)" }} />
              {p}
            </li>
          ))}
        </ol>
      </div>

      <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-center gap-3 md:inset-x-auto md:bottom-12 md:left-12">
        <button
          type="button"
          onClick={add}
          disabled={full || busy}
          aria-label={full ? "Add a page. The plan chest is empty" : `Add a page: ${PAGES[count]}`}
          className="flex h-12 items-center gap-2.5 rounded-full pl-5 pr-6 text-[15px] font-bold tracking-tight transition-[transform,opacity] duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E4DCCF] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 motion-reduce:transition-none"
          style={{ backgroundColor: BLUE, color: INK, boxShadow: "0 14px 30px -10px rgba(79,152,251,0.7), inset 0 1px 0 rgba(255,255,255,0.45)" }}
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M10 4v12M4 10h12" />
          </svg>
          Add a page
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={count <= 1 || busy}
          aria-label={`Put ${top} back in the chest`}
          className="flex h-12 items-center rounded-full px-5 text-[15px] font-bold tracking-tight transition-[transform,opacity] duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E4DCCF] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 motion-reduce:transition-none"
          style={{ backgroundColor: PAPER, color: INK, boxShadow: "0 10px 24px -12px rgba(60,40,20,0.5), inset 0 0 0 1px rgba(11,13,18,0.12)" }}
        >
          Put one back
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {count} pages on the stack. The newest is {top}.
      </p>
    </section>
  );
}
