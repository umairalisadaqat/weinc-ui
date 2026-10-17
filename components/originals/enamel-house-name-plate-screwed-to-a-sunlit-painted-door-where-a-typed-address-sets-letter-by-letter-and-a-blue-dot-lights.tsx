import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Names the self-playing demo sets on the plate, one after another. The first is on the door when the piece opens. */
const NAMES = ["lindenbakery", "harbourswim", "fernandfig"];
const SUFFIX = ".example";
/** Longest name the plate will take. */
const MAX_NAME = 16;
/** Seconds after the last key before the loose screw is driven home. */
const SETTLE_AFTER = 1.1;

const BLUE = "#4F98FB";
const INK = "#0B0D12";
const PAPER = "#F6F4EF";
const WALL = "#D9D1C4";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
/** Lowest and highest render scale (canvas pixels per CSS pixel). The loop steps down when frames run slow. */
const MIN_SCALE = 0.6001;
const MAX_SCALE = 1.5001;
/** Size of the lettering texture laid into the enamel. */
const TEX_W = 1024;
const TEX_H = 256;

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
uniform float uTilt;   // how far the plate hangs off true, turning on its left screw
uniform float uStand;  // how far the plate stands off the door
uniform float uOut;    // how far the right screw is backed out
uniform vec2 uTurn;    // the angle of each screw's slot
uniform float uDot;    // the blue enamel dot: 0 dark, 1 lit
uniform sampler2D uInk, uRelief;

const vec3 SUNC = vec3(1.0, 0.83, 0.62);
const vec3 BLUE = vec3(0.078, 0.30, 0.97);
const vec2 PC = vec2(0.0, 0.2);      // centre of the plate on the door
const vec2 HS = vec2(1.45, 0.4);     // half size of the plate
const float TH = 0.02;              // half thickness of the plate
const vec2 PIV = vec2(-1.31, 0.0);   // the left screw, which the plate hangs from
const vec2 DOTP = vec2(1.08, 0.0);   // the dot, after the lettering
const vec2 FX = vec2(-1.2, 1.0);     // the lettered field, left and right
const float FY = 0.27;               // and its half height
vec3 gL; float gPix, gDist;

float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ return 0.5 * n2(p) + 0.25 * n2(p * 2.03 + 1.7) + 0.125 * n2(p * 4.01 + 3.1) + 0.0625 * n2(p * 8.1 + 5.3); }

float rb2(vec2 p, vec2 h, float r){ vec2 d = abs(p) - h + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r; }
float ext(float d2, float z, float h, float bev){ vec2 w = vec2(d2, abs(z) - h) + bev; return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - bev; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }

// world to the plate's own frame: x along it, y up it, z out from its back face
vec3 toPlate(vec3 p){
  vec3 q = vec3(p.xy - PC - PIV, p.z);
  q.xy = rot(uTilt) * q.xy;
  q.xy += PIV;
  q.z -= uStand;
  return q;
}

float screw(vec3 q, vec2 c, float out_, float turn){
  vec3 s = q - vec3(c, 2.0 * TH + out_);
  // a domed brass head, its slot, and the shank that shows while it is backed out
  float d = max(length(s + vec3(0.0, 0.0, 0.034)) - 0.064, -s.z);
  vec2 sl = rot(turn) * s.xy;
  d = max(d, -max(max(abs(sl.x) - 0.09, abs(sl.y) - 0.008), 0.017 - s.z));
  float sh = max(length(s.xy) - 0.021, max(-q.z - uStand, s.z));
  return min(d, sh);
}

vec2 map(vec3 p){
  vec2 res = vec2(1e5, 0.0);
  // the painted architraves either side of the door
  for (int i = 0; i < 2; i++){
    float sx = i == 0 ? -1.0 : 1.0;
    vec2 q = vec2((p.x - sx * 2.3) * sx, p.z);
    float d = rb2(q - vec2(0.0, 0.05), vec2(0.17, 0.05), 0.012);
    d = min(d, rb2(q - vec2(-0.05, 0.1), vec2(0.1, 0.035), 0.03));
    d = min(d, rb2(q - vec2(0.07, 0.11), vec2(0.035, 0.03), 0.028));
    if (d < res.x) res = vec2(d, 1.0);
  }
  vec3 q = toPlate(p);
  float bound = length(vec3(q.xy, q.z * 4.0)) - 1.7;
  if (bound > 0.3) return vec2(min(res.x, bound), res.x < bound ? res.y : 0.0);
  // the enamelled steel plate with a rolled edge
  float d = ext(rb2(q.xy, HS, 0.1), q.z - TH, TH, 0.011);
  if (d < res.x) res = vec2(d, 2.0);
  d = min(screw(q, PIV, 0.0, uTurn.x), screw(q, vec2(-PIV.x, 0.0), uOut * 0.075, uTurn.y));
  if (d < res.x) res = vec2(d, 3.0);
  return res;
}
vec3 normal(vec3 p){
  vec2 e = vec2(1.0, -1.0) * 0.0006;
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}
vec2 march(vec3 ro, vec3 rd, float far){
  float t = 0.0; vec2 h = vec2(0.0);
  for (int i = 0; i < 120; i++){
    h = map(ro + rd * t);
    if (h.x < 0.0003 * (1.0 + t * 0.3) || t > far) break;
    t += h.x * 0.9;
  }
  return vec2(t, (t > far || h.x > 0.01) ? 0.0 : h.y);
}
float softShadow(vec3 ro, vec3 rd){
  float res = 1.0, t = 0.006;
  for (int i = 0; i < 36; i++){
    float h = map(ro + rd * t).x;
    res = min(res, 14.0 * h / t);
    t += clamp(h, 0.006, 0.15);
    if (res < 0.004 || t > 2.5) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}
float occ(vec3 p, vec3 n){
  float o = 0.0, s = 1.0;
  for (int i = 0; i < 5; i++){
    float h = 0.006 + 0.07 * float(i) / 4.0;
    o += (h - map(p + n * h).x) * s;
    s *= 0.75;
  }
  return clamp(1.0 - 4.0 * o, 0.0, 1.0);
}

// The street in front of the door: open sky, a pale terrace across the road, warm paving.
vec3 env(vec3 rd){
  float y = rd.y;
  vec3 sky = mix(vec3(0.62, 0.74, 0.9), vec3(0.95, 0.94, 0.9), smoothstep(0.7, 0.05, y)) * 1.5;
  vec3 c = mix(vec3(0.3, 0.26, 0.22), sky, smoothstep(-0.04, 0.03, y));
  float roofs = 0.1 + 0.05 * step(0.5, fract(rd.x * 2.3)) + 0.03 * n2(vec2(rd.x * 9.0, 1.0));
  float ter = smoothstep(0.004, -0.004, y - roofs) * smoothstep(-0.03, 0.0, y);
  float win = smoothstep(0.3, 0.6, n2(vec2(rd.x * 9.0, y * 12.0))) * 0.35;
  c = mix(c, mix(vec3(0.95, 0.86, 0.72), vec3(0.3, 0.3, 0.32), win) * 1.1, ter);
  return c;
}
vec3 fres(vec3 f0, float c){ return f0 + (1.0 - f0) * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }

// Leaves from a tree out of shot throw a moving dapple, mostly over the upper left.
float leaves(vec3 p){
  vec2 w = p.xy - gL.xy / gL.z * p.z;
  vec2 s = vec2(sin(uTime * 0.35) * 0.05 + sin(uTime * 0.9) * 0.012, cos(uTime * 0.27) * 0.035);
  // the shadow of the porch roof: a long soft diagonal across the top of the door, broken up by leaves at its edge
  float edge = (w.y - 1.25) + 0.42 * (w.x + 1.0);
  float br = fbm(w * 2.2 + s + vec2(3.1, 7.7)) - 0.5;
  float roof = smoothstep(-0.09, 0.09, edge + br * 0.22);
  // and a few coins of light that get through the leaves inside it
  float coins = smoothstep(0.7, 0.74, n2(w * 7.0 + s * 4.0 + 11.0)) * smoothstep(0.5, 0.65, fbm(w * 1.3 + 4.0)) * 0.8;
  return mix(1.0, 0.07 + coins * 0.0, roof);
}

vec3 sunLight(vec3 p, vec3 n, bool hq){
  float d = dot(n, gL);
  if (d <= 0.0) return vec3(0.0);
  float v = leaves(p);
  if (v > 0.01 && hq) v *= softShadow(p + n * 0.002, gL);
  return SUNC * 3.1 * d * v;
}
vec3 fill(vec3 n, float ao){
  // the open sky in front, warm bounce off the paving, the lit terrace opposite
  vec3 c = vec3(0.34, 0.4, 0.5) * (0.55 + 0.45 * n.y) * max(n.z * 0.6 + 0.4, 0.0) + vec3(0.32, 0.25, 0.18) * max(-n.y, 0.0) * 0.8 + vec3(0.2, 0.17, 0.14) * max(n.z, 0.0);
  return c * ao;
}
vec3 dotGlow(vec3 p){
  vec3 dp = vec3(PC + DOTP, 2.0 * TH + uStand);
  float d = length(p - dp);
  return BLUE * uDot * 0.05 / (d * d + 0.03);
}

// The raised and fielded panels of the door, as a relief height.
float panelH(vec2 p){
  vec2 q = vec2(abs(p.x) - 0.96, p.y);
  float d = min(rb2(q - vec2(0.0, 2.2), vec2(0.84, 1.35), 0.02), rb2(q - vec2(0.0, -2.05), vec2(0.84, 1.6), 0.02));
  if (d > 0.0) return 0.0;
  float groove = -0.014 * smoothstep(0.0, -0.012, d) * smoothstep(-0.05, -0.035, d);
  float bevel = 0.026 * smoothstep(-0.06, -0.24, d);
  return groove + bevel - 0.008;
}

vec3 planeShade(vec3 p, vec3 rd, float t){
  float ax = abs(p.x);
  vec3 n = vec3(0.0, 0.0, 1.0);
  float nv = max(dot(n, -rd), 0.0);
  if (ax < 2.13){
    // the door: gloss paint in near black, laid on with a brush
    float e = 0.004;
    float h = panelH(p.xy);
    vec2 g = vec2(panelH(p.xy + vec2(e, 0.0)) - h, panelH(p.xy + vec2(0.0, e)) - h) / e;
    float brushV = n2(vec2(p.x * 260.0, p.y * 3.0)), brushH = n2(vec2(p.x * 3.0, p.y * 260.0));
    float onRail = step(abs(p.y - 0.2), 0.62) * step(ax, 1.8);
    float br = (mix(brushV, brushH, onRail) - 0.5) * 0.5;
    vec3 nn = normalize(vec3(-g * 1.0 + mix(vec2(br * 0.012, 0.0), vec2(0.0, br * 0.012), onRail), 1.0));
    float groove = smoothstep(-0.006, -0.02, h - (h > -0.0081 ? -0.008 : h)) ;
    float ao = occ(p + nn * 0.001, nn) * (1.0 - 0.5 * smoothstep(-0.008, -0.02, h));
    float gap = smoothstep(2.095, 2.11, ax);
    vec3 alb = vec3(0.021, 0.023, 0.029) * (0.95 + 0.1 * n2(p.xy * 3.0));
    vec3 sl = sunLight(p, nn, true);
    vec3 col = alb * (sl + fill(nn, ao));
    vec3 r = reflect(rd, nn);
    float F = 0.04 + 0.96 * pow(1.0 - max(dot(nn, -rd), 0.0), 5.0);
    col += env(r) * F * ao * 0.5 * (0.75 + 0.5 * smoothstep(-2.0, 2.0, p.y));
    col += SUNC * 3.1 * pow(max(dot(r, gL), 0.0), 120.0) * 4.0 * length(sl) / 3.1;
    col += dotGlow(p) * 0.06;
    return col * (1.0 - 0.9 * gap);
  }
  // lime-washed plaster
  float b = fbm(p.xy * 4.0);
  float b2 = n2(p.xy * 37.0);
  float e = 0.01;
  vec3 nn = normalize(vec3((fbm((p.xy + vec2(e, 0.0)) * 4.0) - b) / e * 0.05 + (b2 - 0.5) * 0.1, (fbm((p.xy + vec2(0.0, e)) * 4.0) - b) / e * 0.05, 1.0));
  vec3 alb = vec3(0.8, 0.76, 0.69) * (0.92 + 0.1 * b + 0.04 * b2);
  float ao = occ(p + nn * 0.001, nn);
  return alb * (sunLight(p, nn, true) + fill(nn, ao));
}

vec3 shade(vec3 p, vec3 n, float id, vec3 rd){
  float ao = occ(p, n);
  vec3 r = reflect(rd, n);
  float nv = max(dot(n, -rd), 0.0);
  if (id < 1.5){
    // the architraves, in warm white eggshell paint
    vec3 alb = vec3(0.84, 0.81, 0.75) * (0.97 + 0.05 * n2(p.yz * vec2(3.0, 60.0)));
    vec3 col = alb * (sunLight(p, n, true) + fill(n, ao));
    col += env(r) * (0.03 + 0.25 * pow(1.0 - nv, 5.0)) * ao;
    return col;
  }
  if (id < 2.5){
    vec3 q = toPlate(p);
    vec3 nl = n;
    vec3 alb = vec3(0.8, 0.78, 0.735);
    float gloss = 1.0;
    float inkA = 0.0, wet = 0.0;
    if (q.z > 2.0 * TH - 0.004 && n.z > 0.2){
      // the face: the lettering, a fine border rule and the dot
      vec2 uv = vec2((q.x - FX.x) / (FX.y - FX.x), (FY - q.y) / (2.0 * FY));
      if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0){
        vec4 k = texture(uInk, uv);
        inkA = k.r; wet = k.g;
        vec2 e = vec2(1.5 / ${TEX_W}.0, 1.5 / ${TEX_H}.0);
        float h0 = texture(uRelief, uv).r;
        vec2 g = vec2(texture(uRelief, uv + vec2(e.x, 0.0)).r - h0, texture(uRelief, uv - vec2(0.0, e.y)).r - h0);
        vec2 tilt = rot(-uTilt) * (-g * (1.4 + 2.2 * wet));
        nl = normalize(n + vec3(tilt, 0.0));
      }
      float pw = max(0.004, gDist * gPix * 0.8);
      float rule = smoothstep(pw, pw * 0.4, abs(rb2(q.xy, HS - 0.075, 0.05)) - 0.003);
      inkA = max(inkA, rule);
      float dd = length(q.xy - DOTP);
      float dotM = smoothstep(0.052, 0.046, dd);
      alb = mix(alb, vec3(0.022, 0.025, 0.032), inkA);
      vec3 dotC = mix(vec3(0.03, 0.07, 0.2), BLUE * 0.9, uDot);
      alb = mix(alb, dotC, dotM);
      if (dotM > 0.0) nl = normalize(n + vec3(rot(-uTilt) * (q.xy - DOTP) * 7.0 * dotM, 0.0));
      // the plate is very slightly domed, so the sky slides across it
      nl = normalize(nl + vec3(rot(-uTilt) * (q.xy / HS) * vec2(0.05, 0.12), 0.0));
      // the enamel is a glass: a faint ripple in its surface
      nl = normalize(nl + vec3(n2(q.xy * 60.0) - 0.5, n2(q.xy * 60.0 + 9.0) - 0.5, 0.0) * 0.012);
      vec3 col = alb * (sunLight(p, nl, true) * mix(1.0, 0.9, inkA) + fill(nl, ao));
      vec3 rr = reflect(rd, nl);
      float F = 0.045 + 0.955 * pow(1.0 - max(dot(nl, -rd), 0.0), 5.0);
      float sv = leaves(p);
      col += env(rr) * F * (0.9 + 0.6 * wet);
      col += SUNC * 3.1 * pow(max(dot(rr, gL), 0.0), 260.0) * 30.0 * sv;
      col = mix(col, BLUE * (0.15 + 1.25 * uDot * (0.92 + 0.08 * sin(uTime * 2.2))) + env(rr) * F, dotM * 0.92);
      col += dotGlow(p) * (1.0 - dotM) * mix(1.0, 0.25, inkA);
      return col;
    }
    // the rolled edge and the back: the same enamel, a touch greyer where it is thin over the steel
    alb = vec3(0.78, 0.76, 0.72);
    vec3 col = alb * (sunLight(p, n, true) + fill(n, ao));
    col += env(r) * (0.045 + 0.955 * pow(1.0 - nv, 5.0));
    col += SUNC * 3.1 * pow(max(dot(r, gL), 0.0), 200.0) * 20.0 * leaves(p);
    return col;
  }
  // brass screw heads, a little worn
  vec3 f0 = vec3(0.95, 0.74, 0.42) * (0.88 + 0.12 * n2(p.xy * 200.0));
  vec3 col = fres(f0, nv) * (env(r) * (0.35 + 0.65 * ao) + SUNC * 3.1 * pow(max(dot(r, gL), 0.0), 50.0) * 5.0 * leaves(p));
  col += f0 * sunLight(p, n, true) * 0.08;
  return col;
}

vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main(){
  gL = normalize(vec3(-0.62, 0.6, 0.5));
  gPix = 2.0 * tan(uFov * 0.5) / uRes.y;
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 fw = normalize(uTarget - uCam), rgt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))), up = cross(rgt, fw);
  vec3 rd = normalize(fw + (uv.x * rgt + uv.y * up) * 2.0 * tan(uFov * 0.5));
  vec3 ro = uCam;
  float tp = rd.z < -1e-4 ? -ro.z / rd.z : 1e5;
  // start the march just in front of anything that stands proud of the door
  float t0 = rd.z < -1e-4 ? max(0.0, (0.25 - ro.z) / rd.z) : 0.0;
  vec2 hit = march(ro + rd * t0, rd, tp - t0);
  float t; vec3 col;
  if (hit.y > 0.5){
    t = t0 + hit.x; vec3 p = ro + rd * t; gDist = t;
    col = shade(p, normal(p), hit.y, rd);
  } else {
    t = tp; gDist = t;
    col = planeShade(ro + rd * tp, rd, tp);
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
  float coc = clamp(abs(z - uFocus) / max(z, 0.1) * 26.0 - 0.5, 0.0, 6.0) * px;
  vec3 acc = c0.rgb; float ws = 1.0;
  float j = hash(gl_FragCoord.xy) * 6.283;
  float lod = log2(max(coc / 3.0, 1.0));
  for (int i = 0; i < 12; i++){
    float fi = (float(i) + 0.5) / 12.0;
    float a = float(i) * 2.39996 + j;
    vec2 off = vec2(cos(a), sin(a)) * sqrt(fi) * coc / uRes;
    vec4 s = textureLod(uSrc, vUv + off, lod);
    float w = 1.0 + 4.0 * pow(max(s.r, max(s.g, s.b)), 6.0);
    acc += s.rgb * w; ws += w;
  }
  vec3 col = acc / ws;
  vec3 bl = textureLod(uSrc, vUv, 3.0).rgb * 0.35 + textureLod(uSrc, vUv, 4.5).rgb * 0.35 + textureLod(uSrc, vUv, 6.0).rgb * 0.3;
  col += bl * bl * 0.08;
  vec2 v = vUv - vec2(0.6, 0.5);
  col *= 1.0 - dot(v, v) * 0.42;
  float g = hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;
  col += g * 0.02 * (1.0 - 0.4 * col);
  o = vec4(col, 1.0);
}`;

/* ---------- small motion helpers ---------- */

type Spring = { x: number; v: number; t: number; k: number; c: number };
const spring = (x: number, k: number, c: number): Spring => ({ x, v: 0, t: x, k, c });
const stepSpring = (s: Spring, dt: number) => {
  s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt;
  s.x += s.v * dt;
};
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, MAX_NAME);

type Glyph = { ch: string; x: number; tx: number; born: number; dying: number; suffix: boolean };

export default function EnamelHouseNamePlate() {
  const reduce = useReducedMotion();
  const [name, setName] = useState(NAMES[0]);
  const [fixed, setFixed] = useState(true);
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The render loop owns the scene. React talks to it through this handle.
  const api = useRef<{ type: (s: string, byHand: boolean) => void; fix: () => void; stopDemo: () => void } | null>(null);

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
    const su = Object.fromEntries(
      ["uRes", "uCam", "uTarget", "uFov", "uTime", "uTilt", "uStand", "uOut", "uTurn", "uDot", "uInk", "uRelief"].map((n) => [n, U(scene, n)]),
    );
    const pu = Object.fromEntries(["uSrc", "uRes", "uFocus", "uTime"].map((n) => [n, U(post, n)]));

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    /* ---- the lettering, drawn in 2D and laid into the enamel ---- */
    const ink = document.createElement("canvas");
    ink.width = TEX_W;
    ink.height = TEX_H;
    const relief = document.createElement("canvas");
    relief.width = TEX_W;
    relief.height = TEX_H;
    const ic = ink.getContext("2d")!;
    const rc = relief.getContext("2d")!;
    const mkTex = () => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    const inkTex = mkTex();
    const reliefTex = mkTex();

    let clock = 0;
    let glyphs: Glyph[] = [];
    let size = 0;
    let sizeT = 0;
    const fontOf = (px: number, suffix: boolean) => `${suffix ? 600 : 800} ${px}px ${FONT}`;
    const layout = () => {
      const live = glyphs.filter((g) => g.dying < 0);
      // fit the line inside the field, never larger than a set cap height
      ic.font = fontOf(100, false);
      let w = 0;
      const adv = live.map((g) => {
        ic.font = fontOf(100, g.suffix);
        const a = ic.measureText(g.ch).width - 3.5;
        w += a;
        return a;
      });
      sizeT = Math.min(118, (TEX_W * 0.94 * 100) / Math.max(w, 1));
      let x = (TEX_W - (w * sizeT) / 100) / 2;
      live.forEach((g, i) => {
        g.tx = x;
        x += (adv[i] * sizeT) / 100;
      });
    };
    const setText = (nm: string, instant: boolean) => {
      const full = nm + SUFFIX;
      const live = glyphs.filter((g) => g.dying < 0);
      let k = 0;
      while (k < live.length && k < full.length && live[k].ch === full[k] && live[k].suffix === k >= nm.length) k++;
      const keep = live.slice(0, k);
      live.slice(k).forEach((g) => (g.dying = instant ? clock - 10 : clock));
      const fresh: Glyph[] = [];
      for (let i = k; i < full.length; i++) {
        const suffix = i >= nm.length;
        // the suffix letters are already on the plate; only the name's letters are set fresh
        const old = live.find((g, j) => j >= k && g.suffix && suffix && g.ch === full[i] && g.dying === clock);
        if (old) {
          old.dying = -1;
          fresh.push(old);
        } else fresh.push({ ch: full[i], x: 0, tx: 0, born: instant ? clock - 10 : clock + (fresh.length - 0) * 0, dying: -1, suffix });
      }
      glyphs = [...keep, ...fresh, ...glyphs.filter((g) => g.dying >= 0 && !fresh.includes(g))];
      layout();
      glyphs.forEach((g) => {
        if (g.x === 0 || instant) g.x = g.tx;
      });
      if (instant || size === 0) size = sizeT;
    };
    // returns true while something is still moving
    const paintText = () => {
      let moving = Math.abs(size - sizeT) > 0.05;
      const k = 1 - Math.exp(-dtLast * 14);
      size += (sizeT - size) * k;
      ic.fillStyle = "#000";
      ic.fillRect(0, 0, TEX_W, TEX_H);
      ic.textBaseline = "alphabetic";
      const base = TEX_H / 2 + size * 0.36;
      glyphs = glyphs.filter((g) => g.dying < 0 || clock - g.dying < 0.3);
      for (const g of glyphs) {
        if (g.dying < 0) {
          if (Math.abs(g.tx - g.x) > 0.2) moving = true;
          g.x += (g.tx - g.x) * k;
        }
        const age = clock - g.born;
        let s = 1;
        let a = 1;
        let wet = 0;
        if (g.dying >= 0) {
          const d = (clock - g.dying) / 0.3;
          a = 1 - d;
          s = 1 + d * 0.25;
          moving = true;
        } else if (age < 1.6) {
          // a bead of wet enamel lands, spreads past its shape and draws back in, then cures from gloss to satin
          a = Math.min(1, age * 9);
          s = 1 + 0.42 * Math.exp(-age * 10) * Math.cos(age * 26);
          wet = Math.exp(-age * 2.4);
          moving = true;
        }
        ic.font = fontOf(size, g.suffix);
        const w = ic.measureText(g.ch).width;
        ic.save();
        ic.globalAlpha = Math.max(0, Math.min(1, a));
        ic.translate(g.x + w / 2, base - size * 0.36);
        ic.scale(s, s);
        ic.fillStyle = `rgb(255,${Math.round(wet * 255)},0)`;
        ic.fillText(g.ch, -w / 2, size * 0.36);
        ic.restore();
      }
      // the relief: a softened copy, so the lettering stands a hair proud of the enamel with rounded shoulders
      rc.fillStyle = "#000";
      rc.fillRect(0, 0, TEX_W, TEX_H);
      rc.filter = "blur(3px)";
      rc.drawImage(ink, 0, 0);
      rc.filter = "none";
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      for (const [t, c] of [
        [inkTex, ink],
        [reliefTex, relief],
      ] as const) {
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
        gl.generateMipmap(gl.TEXTURE_2D);
      }
      return moving;
    };
    let dtLast = 0.016;

    /* ---- the plate, its screws and the dot ---- */
    const tilt = spring(0, 120, 14);
    const stand = spring(0.012, 200, 22);
    const out = spring(0, 60, 14);
    const dot = spring(1, 90, 9);
    const turn = [0.6, 2.2];
    let drive = 0; // seconds left while the right screw is being driven home
    let isFixed = true;
    let textDirty = true;
    let dirty = true;
    let cues: { at: number; fn: () => void }[] = [];
    const at = (delay: number, fn: () => void) => {
      cues.push({ at: clock + delay, fn });
      cues.sort((a, b) => a.at - b.at);
    };
    let current = NAMES[0];
    let settleAt = Infinity;

    const loosen = () => {
      if (!isFixed) return;
      isFixed = false;
      setFixed(false);
      dot.t = 0;
      out.t = 1;
      stand.t = 0.04;
      tilt.k = 26;
      tilt.c = 1.6;
      tilt.t = -0.022;
      if (reduce) {
        for (const s of [dot, out, stand, tilt]) ((s.x = s.t), (s.v = 0));
      }
    };
    const fix = () => {
      settleAt = Infinity;
      if (isFixed) return;
      isFixed = true;
      if (reduce) {
        out.x = out.t = 0;
        stand.x = stand.t = 0.012;
        tilt.x = tilt.t = 0;
        dot.x = dot.t = 1;
        setFixed(true);
        dirty = true;
        return;
      }
      // the right screw is driven home, which pulls the plate level and tight to the door, then the dot lights
      drive = 0.75;
      out.t = 0;
      tilt.k = 120;
      tilt.c = 13;
      tilt.t = 0;
      at(0.62, () => {
        stand.t = 0.012;
        stand.v -= 0.06;
      });
      at(0.95, () => {
        dot.t = 1;
        dot.v += 6;
        setFixed(true);
      });
    };
    const type = (s: string) => {
      const nm = clean(s);
      if (nm === current) return;
      const added = nm.length > current.length;
      loosen();
      current = nm;
      setName(nm);
      setText(nm, !!reduce);
      textDirty = true;
      dirty = true;
      // a letter landing knocks the loose plate on its screw
      if (!reduce) tilt.v += added ? 0.1 : -0.06;
      settleAt = nm.length ? clock + SETTLE_AFTER : Infinity;
    };

    // the self-playing demo: hold the finished plate, then take the name off letter by letter and set the next one
    let demo = !reduce;
    let demoIdx = 0;
    let demoNext = 3.4;
    const demoStep = () => {
      const goal = NAMES[(demoIdx + 1) % NAMES.length];
      if (!isFixed || current !== goal) {
        if (goal.startsWith(current) && current !== goal) {
          type(goal.slice(0, current.length + 1));
          demoNext = clock + 0.12 + Math.random() * 0.1;
        } else if (current.length && !goal.startsWith(current)) {
          type(current.slice(0, -1));
          demoNext = clock + 0.055;
        } else if (current === goal) {
          demoNext = clock + 0.2;
        }
        if (current === goal) {
          settleAt = clock + 0.5;
          demoIdx = (demoIdx + 1) % NAMES.length;
          demoNext = clock + 0.5 + 1.0 + 5.2;
        }
      }
    };
    const stopDemo = () => {
      demo = false;
    };
    api.current = {
      type: (s, byHand) => {
        if (byHand) stopDemo();
        type(s);
        kick();
      },
      fix: () => {
        stopDemo();
        fix();
        kick();
      },
      stopDemo,
    };
    setText(current, true);

    /* ---- render target ---- */
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

    const cam = { ax: 0, ay: 0, tx: 0, ty: 0 };
    let time = 0;
    const draw = () => {
      const wide = cssW / cssH;
      const tgt = phone ? [0, 0.62, 0] : [-1.25, 0.12, 0];
      const az = (phone ? 0.12 : 0.22) + cam.ax * 0.06 + Math.sin(time * 0.17) * 0.01;
      const el = (phone ? 0.04 : 0.06) - cam.ay * 0.035 + Math.sin(time * 0.23 + 1) * 0.004;
      const fov = 0.5;
      const half = Math.tan(fov / 2);
      const dist = phone ? Math.max(9, 1.78 / (half * wide)) : 8.3 * Math.max(1, 1.78 / wide);
      const camPos = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] + dist * Math.cos(az) * Math.cos(el)];

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(scene);
      gl.uniform2f(su.uRes, bw, bh);
      gl.uniform3f(su.uCam, camPos[0], camPos[1], camPos[2]);
      gl.uniform3f(su.uTarget, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFov, fov);
      gl.uniform1f(su.uTime, time);
      gl.uniform1f(su.uTilt, tilt.x);
      gl.uniform1f(su.uStand, Math.max(0.002, stand.x));
      gl.uniform1f(su.uOut, Math.max(0, out.x));
      gl.uniform2f(su.uTurn, turn[0], turn[1]);
      gl.uniform1f(su.uDot, Math.max(0, Math.min(1.25, dot.x)));
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, inkTex);
      gl.uniform1i(su.uInk, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, reliefTex);
      gl.uniform1i(su.uRelief, 2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(post);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fbTex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.uniform1i(pu.uSrc, 0);
      gl.uniform2f(pu.uRes, bw, bh);
      gl.uniform1f(pu.uFocus, Math.hypot(camPos[0], camPos[1] - 0.2, camPos[2]));
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
      dtLast = dt;
      if (reduce) {
        clock += dt;
        if (clock > settleAt) fix();
        if (textDirty) {
          paintText();
          textDirty = false;
        }
        if (dirty) {
          dirty = false;
          draw();
        }
      } else {
        clock += dt;
        time += dt;
        while (cues.length && cues[0].at <= clock) cues.shift()!.fn();
        if (clock > settleAt) fix();
        if (demo && clock > demoNext) demoStep();
        if (drive > 0) {
          drive = Math.max(0, drive - dt);
          turn[1] += dt * 22 * Math.min(1, drive * 4 + 0.15);
        }
        if (out.x > 0.05 && out.v > 0) turn[1] -= dt * 12;
        for (let n = 0; n < 4; n++) {
          const h = dt / 4;
          stepSpring(tilt, h);
          stepSpring(stand, h);
          stepSpring(out, h);
          stepSpring(dot, h);
        }
        if (textDirty) textDirty = paintText();
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
      const pending = reduce && (dirty || textDirty || settleAt < Infinity);
      if (onScreen && !document.hidden && (!reduce || pending)) raf = requestAnimationFrame(frame);
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
      gl.deleteTexture(inkTex);
      gl.deleteTexture(reliefTex);
      gl.deleteFramebuffer(fbo);
      gl.deleteBuffer(quad);
      gl.deleteProgram(scene);
      gl.deleteProgram(post);
    };
  }, [reduce]);

  const onType = (v: string) => {
    if (api.current) api.current.type(v, true);
    else {
      setName(clean(v));
      setFixed(false);
    }
  };
  const onFix = () => {
    if (api.current) api.current.fix();
    else setFixed(true);
  };

  return (
    <section ref={rootRef} className="relative isolate h-[700px] w-full overflow-hidden md:h-[720px]" style={{ backgroundColor: WALL, fontFamily: FONT }}>
      {/* The still: the same door and plate built from elements. Shown before the renderer starts and wherever it cannot run. */}
      <div aria-hidden="true" className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`} style={{ background: "linear-gradient(120deg, #e6dfd2 0%, #d6cdbf 60%, #cbc1b2 100%)" }}>
        <div
          className="absolute inset-y-0 left-[8%] right-[8%] md:left-[39%] md:right-[1.5%]"
          style={{ background: "linear-gradient(100deg, #1c2027 0%, #0d0f14 45%, #15181e 100%)", boxShadow: "-14px 0 0 #e9e3d8, 14px 0 0 #e9e3d8, -30px 0 40px rgba(60,45,30,0.35)" }}
        >
          <div className="absolute inset-x-[7%] top-0 h-[34%] rounded-b-[4px]" style={{ boxShadow: "inset 0 -2px 0 rgba(255,255,255,0.08), inset 0 0 0 10px rgba(0,0,0,0.25)" }} />
          <div className="absolute inset-x-[7%] bottom-0 h-[34%] rounded-t-[4px]" style={{ boxShadow: "inset 0 2px 0 rgba(255,255,255,0.08), inset 0 0 0 10px rgba(0,0,0,0.25)" }} />
          <div
            className="absolute left-1/2 top-[61%] flex h-[64px] w-[88%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[10px] md:top-[49%] md:h-[100px] md:w-[66%]"
            style={{ background: "linear-gradient(170deg, #fbf9f4 0%, #ebe7df 100%)", boxShadow: "10px 14px 18px rgba(0,0,0,0.45), inset 0 0 0 5px #ebe7df, inset 0 0 0 6.5px #0B0D12" }}
          >
            <span className="absolute left-[3%] h-4 w-4 rounded-full md:h-5 md:w-5" style={{ background: "radial-gradient(circle at 35% 30%, #f6dca0, #9a6a26)" }} />
            <span className="absolute right-[3%] h-4 w-4 rounded-full md:h-5 md:w-5" style={{ background: "radial-gradient(circle at 35% 30%, #f6dca0, #9a6a26)" }} />
            <span className="truncate px-10 text-[19px] tracking-[-0.04em] md:text-[30px]" style={{ color: INK }}>
              <b className="font-extrabold">{name || " "}</b>
              <span className="font-semibold">{SUFFIX}</span>
            </span>
            <span className="absolute right-[9%] h-2.5 w-2.5 rounded-full md:h-3 md:w-3" style={{ backgroundColor: fixed ? BLUE : "#1d2a44", boxShadow: fixed ? `0 0 14px ${BLUE}` : "none" }} />
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} />

      <div className="pointer-events-none absolute left-5 right-5 top-6 md:left-12 md:right-auto md:top-12 md:max-w-[400px]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#F6F4EF]/70 md:text-[11px] md:text-[#0B0D12]/60">
          Your own address <span className="mx-1.5 opacity-50">/</span> On the door
        </p>
        <h2 className="mt-2 text-[44px] font-extrabold leading-[0.92] tracking-[-0.055em] text-[#F6F4EF] md:mt-4 md:text-[76px] md:text-[#0B0D12]">
          Put your name on the door.
        </h2>
        <p className="mt-3 max-w-[300px] text-[15px] font-medium leading-snug tracking-tight text-[#F6F4EF]/80 md:mt-5 md:text-[17px] md:text-[#0B0D12]/75">
          Type the name you want people to find you by. Each letter is set into the enamel, then the plate is screwed down.
        </p>
      </div>

      <form
        className="absolute inset-x-5 bottom-5 md:inset-x-auto md:bottom-12 md:left-12 md:w-[400px]"
        onSubmit={(e) => {
          e.preventDefault();
          onFix();
        }}
      >
        <label htmlFor="house-plate-name" className="sr-only">
          Site address, before .example
        </label>
        <div className="flex h-14 items-center rounded-full pl-5 pr-1.5 shadow-[0_18px_40px_-18px_rgba(40,30,20,0.55)] ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-[#0B0D12]" style={{ backgroundColor: PAPER }}>
          <input
            id="house-plate-name"
            value={name}
            onChange={(e) => onType(e.target.value)}
            onFocus={() => api.current?.stopDemo()}
            maxLength={MAX_NAME}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="w-0 min-w-0 flex-1 bg-transparent text-[17px] font-bold tracking-tight outline-none placeholder:text-black/35"
            style={{ color: INK }}
            placeholder="yourname"
          />
          <span className="pr-3 text-[17px] font-semibold tracking-tight" style={{ color: "rgba(11,13,18,0.5)" }}>
            {SUFFIX}
          </span>
          <button
            type="submit"
            disabled={!name}
            className="flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-bold tracking-tight transition-[transform,background-color,box-shadow] duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 motion-reduce:transition-none"
            style={fixed ? { backgroundColor: INK, color: PAPER } : { backgroundColor: BLUE, color: INK, boxShadow: "0 10px 24px -10px rgba(79,152,251,0.8), inset 0 1px 0 rgba(255,255,255,0.45)" }}
          >
            <span className="h-2 w-2 rounded-full" aria-hidden="true" style={{ backgroundColor: fixed ? BLUE : INK, boxShadow: fixed ? `0 0 8px ${BLUE}` : "none" }} />
            {fixed ? "On the door" : "Screw it on"}
          </button>
        </div>
      </form>
      <p className="sr-only" aria-live="polite">
        {fixed && name ? `${name}${SUFFIX} is screwed to the door.` : ""}
      </p>
    </section>
  );
}
