import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** One record per speaker. The cover photo is printed on the sleeve; `label` is the paper label in the middle of the disc. */
const records = [
  {
    quote: "They listened to the whole brief before touching a single pixel.",
    name: "Noor Halvorsen",
    role: "Owner, Halvorsen Ceramics",
    src: "https://images.pexels.com/photos/11608677/pexels-photo-11608677.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Woman with a dark bob and a large earring looking back over her shoulder against a violet and orange backdrop",
    tone: "#5b3bb4",
    label: "#e9a23b",
  },
  {
    quote: "Our booking page finally sounds like us, not like a template.",
    name: "Desmond Okafor",
    role: "Founder, Low Tide Barbers",
    src: "https://images.pexels.com/photos/37580515/pexels-photo-37580515.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Young man with swept-back hair and a green overshirt smiling against a deep red backdrop",
    tone: "#a3201d",
    label: "#e2c98f",
  },
  {
    quote: "The site went live on Friday. Monday's calls were all new faces.",
    name: "Adaeze Calderwood",
    role: "Director, Calderwood Physio",
    src: "https://images.pexels.com/photos/30774062/pexels-photo-30774062.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Woman with a full afro, a patterned head tie and hoop earrings standing in front of dark green trees",
    tone: "#2f4a2c",
    label: "#d8452f",
  },
];

const N = records.length;
const KICKER = "Played on repeat"; // small label above the quote
const HOLD_MS = 6400; // rest before the next record is pulled by itself
const SLIDE = 0.158; // how far the disc rises out of its sleeve, in metres (half a 12 inch record)
const SLIDE_PULL = 58; // spring strength of the sliding disc; higher arrives sooner
const SLIDE_DRAG = 8.6; // lower lets the disc overshoot further before it settles
const TIP_KICK = 0.75; // how hard the chosen sleeve rocks off the wall when its record is pulled
const SERIF = '"New York", ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const INK = "#2b1a10";

// Sleeves in metres: a 12 inch sleeve is 31.5 cm square. Each leans back until its top meets the wall.
const HS = 0.1575;
const HT = 0.0034;
const XS = [-0.338, 0.0, 0.338];
const LEANS = [0.15, 0.115, 0.165];
const YAWS = [0.05, -0.025, 0.06];
const CAM_Z = 2.0;
const TEX = 768;

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;
uniform vec3 uCam, uRt, uUp, uFw;
uniform float uTan, uAspect, uFocus, uAperture;
uniform vec2 uRes;
uniform int uSS;
uniform vec3 uSC[3], uSU[3], uSV[3], uSN[3];
uniform float uLift[3], uSpin[3];
uniform vec3 uL;
uniform vec4 uWin;
uniform sampler2DArray uTex;
out vec4 o;
const float HS = ${HS.toFixed(4)}, HT = ${HT.toFixed(4)}, DR = 0.1505, LR = 0.051;
const vec3 SUN = vec3(1.0, 0.82, 0.6) * 3.0;
const vec3 AMB = vec3(0.46, 0.4, 0.36) * 0.66;
const vec3 WALL = vec3(0.6, 0.48, 0.36);
const vec3 OAK = vec3(0.40, 0.235, 0.12);
const vec3 SHC = vec3(0.0, -0.019, 0.13), SHH = vec3(6.0, 0.019, 0.13);
const vec3 KEY2 = vec3(0.62, 0.62, 0.48);
vec3 Lu, Lv;

float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.03 + 7.3) + 0.125 * vnoise(p * 4.1 + 1.7) + 0.0625 * vnoise(p * 8.3); }
float sbox(vec2 p, vec2 h, float s) { vec2 d = smoothstep(h + s, h - s, abs(p)); return d.x * d.y; }
float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }

float boxHit(vec3 ro, vec3 rd, vec3 h, out vec3 n) {
  vec3 inv = 1.0 / rd;
  vec3 t1 = (-h - ro) * inv, t2 = (h - ro) * inv;
  vec3 tn = min(t1, t2), tf = max(t1, t2);
  float a = max(max(tn.x, tn.y), tn.z), b = min(min(tf.x, tf.y), tf.z);
  if (a > b || a < 0.0) return -1.0;
  n = tn.x > tn.y && tn.x > tn.z ? vec3(-sign(rd.x), 0, 0) : tn.y > tn.z ? vec3(0, -sign(rd.y), 0) : vec3(0, 0, -sign(rd.z));
  return a;
}
vec3 loc(vec3 v, int i) { return vec3(dot(v, uSU[i]), dot(v, uSV[i]), dot(v, uSN[i])); }

// Nearest surface along a ray: 0 wall, 1 shelf, 2 sleeve, 3 disc.
float trace(vec3 ro, vec3 rd, out int m, out vec3 n, out vec3 lp, out int k) {
  float t = 1e9; m = -1; k = 0; n = vec3(0, 0, 1); lp = vec3(0);
  if (rd.z < 0.0) { t = -ro.z / rd.z; m = 0; }
  vec3 nn;
  float ts = boxHit(ro - SHC, rd, SHH, nn);
  if (ts > 0.0 && ts < t) { t = ts; m = 1; n = nn; lp = ro + rd * ts - SHC; }
  for (int i = 0; i < 3; i++) {
    vec3 lo = loc(ro - uSC[i], i), ld = loc(rd, i);
    float tb = boxHit(lo, ld, vec3(HS, HS, HT), nn);
    if (tb > 0.0 && tb < t) { t = tb; m = 2; k = i; n = uSU[i] * nn.x + uSV[i] * nn.y + uSN[i] * nn.z; lp = lo + ld * tb; lp.z = nn.z; }
    if (uLift[i] > 0.004) {
      float td = -lo.z / ld.z;
      vec2 c = (lo + ld * td).xy - vec2(0.0, uLift[i]);
      if (td > 0.0 && td < t && dot(c, c) < DR * DR) { t = td; m = 3; k = i; n = uSN[i] * (ld.z < 0.0 ? 1.0 : -1.0); lp = vec3(c, 0.0); }
    }
  }
  return t;
}
bool blocked(vec3 ro, vec3 rd) {
  vec3 nn;
  if (boxHit(ro - SHC, rd, SHH, nn) > 0.0) return true;
  for (int i = 0; i < 3; i++) {
    vec3 lo = loc(ro - uSC[i], i), ld = loc(rd, i);
    if (boxHit(lo, ld, vec3(HS, HS, HT), nn) > 0.0) return true;
    if (uLift[i] > 0.004) {
      float td = -lo.z / ld.z;
      vec2 c = (lo + ld * td).xy - vec2(0.0, uLift[i]);
      if (td > 0.0 && dot(c, c) < DR * DR) return true;
    }
  }
  return false;
}
// Two jittered rays toward a sun that comes through a window, so shadow edges have a penumbra.
float sunShadow(vec3 P, float seed) {
  float s = 0.0;
  for (int j = 0; j < 2; j++) {
    float a = 6.2832 * fract(seed + float(j) * 0.5);
    float r = 0.022 * sqrt(fract(seed * 7.13 + float(j) * 0.37));
    if (!blocked(P, normalize(uL + (Lu * cos(a) + Lv * sin(a)) * r))) s += 0.5;
  }
  return s;
}
// The window: four panes with glazing bars, cast as a slanted patch of sun on the wall and shelf.
float gobo(vec3 P) {
  vec2 g = vec2(dot(P, Lu), dot(P, Lv)) - uWin.xy;
  float w = sbox(g, uWin.zw, 0.05);
  float bars = (1.0 - 0.92 * smoothstep(0.03, 0.012, abs(g.x + 0.12))) * (1.0 - 0.92 * smoothstep(0.03, 0.012, abs(g.y - 0.12)));
  return w * bars;
}
float occl(vec3 P) {
  float ao = 1.0;
  for (int i = 0; i < 3; i++) {
    vec3 l = loc(P - uSC[i], i);
    ao *= mix(0.42, 1.0, smoothstep(0.0, 0.07, sdBox(l, vec3(HS, HS + uLift[i] * 0.5, HT))));
  }
  return ao;
}
// What glossy things see when they look back into the room: warm walls, a bright window, a pale card.
vec3 room(vec3 R, float soft) {
  vec3 c = mix(vec3(0.18, 0.12, 0.08), vec3(0.7, 0.62, 0.52), smoothstep(-0.4, 0.7, R.y));
  float f = dot(R, uL);
  if (f > 0.0) {
    vec2 a = vec2(dot(R, Lu), dot(R, Lv)) / f;
    float win = sbox(a - vec2(0.05, 0.1), vec2(0.42, 0.3), mix(0.01, 0.25, soft));
    win *= 1.0 - 0.9 * (1.0 - soft) * smoothstep(0.02, 0.008, abs(a.x - 0.0));
    c += SUN * 2.6 * win;
  }
  c += vec3(1.0, 0.96, 0.9) * 1.1 * smoothstep(0.9 - soft * 0.2, 0.97, dot(R, normalize(KEY2)));
  return c;
}

vec3 shadeWall(vec3 P, float seed) {
  vec2 q = P.xy * vec2(6.0, 4.0);
  float h0 = fbm(q), hx = fbm(q + vec2(0.04, 0)), hy = fbm(q + vec2(0, 0.04));
  vec3 n = normalize(vec3(-(hx - h0) * 0.55, -(hy - h0) * 0.55, 1.0));
  vec3 alb = WALL * (0.84 + 0.28 * fbm(P.xy * 1.3 + 3.0)) * (0.93 + 0.14 * h0);
  float ao = occl(P) * (1.0 - 0.3 * exp(-abs(P.y) / 0.05)) * (P.y < 0.0 ? 0.8 : 1.0);
  float lit = max(dot(n, uL), 0.0) * gobo(P);
  if (lit > 0.001) lit *= sunShadow(P + n * 0.001, seed);
  vec3 bounce = OAK * SUN * 0.16 * exp(-max(P.y, 0.0) / 0.12) * step(0.0, P.y);
  return alb * (SUN * lit + AMB * ao + bounce);
}
vec3 shadeShelf(vec3 P, vec3 lp, vec3 n, vec3 V, float seed) {
  bool top = n.y > 0.5;
  vec2 gp = top ? vec2(P.x, P.z) : vec2(P.x, P.y);
  float warp = fbm(gp * vec2(1.4, 18.0));
  float g = fbm(vec2(gp.x * 2.4, gp.y * 90.0 + warp * 5.0));
  vec3 alb = OAK * (0.62 + 0.62 * g) * (0.9 + 0.2 * vnoise(vec2(gp.x * 40.0, gp.y * 900.0)));
  // a rounded front edge picks up a line of light
  float edge = top ? smoothstep(0.122, 0.13, lp.z) : smoothstep(-0.008, 0.0, lp.y);
  vec3 ns = normalize(mix(n, normalize(vec3(0, 0.7, 0.7)), edge * 0.85));
  float ao = occl(P) * (top ? mix(0.55, 1.0, smoothstep(0.0, 0.06, P.z)) : 1.0);
  float lit = max(dot(ns, uL), 0.0) * gobo(P);
  if (lit > 0.001) lit *= sunShadow(P + n * 0.001, seed);
  vec3 col = alb * (SUN * lit + AMB * ao);
  float F = 0.04 + 0.96 * pow(1.0 - max(dot(ns, V), 0.0), 5.0);
  col += room(reflect(-V, ns), 0.8) * F * 0.45 * ao;
  col += SUN * lit * pow(max(dot(ns, normalize(uL + V)), 0.0), 40.0) * 0.18;
  return col;
}
vec3 shadeSleeve(vec3 P, vec3 lp, vec3 n, int k, vec3 V, float seed) {
  vec3 alb;
  bool front = lp.z > 0.5;
  vec2 xy = lp.xy;
  if (front) {
    alb = pow(texture(uTex, vec3(xy / (2.0 * HS) + 0.5, float(k))).rgb, vec3(2.2));
    // ring wear where the record has pressed through, and soft scuffed corners
    float r = length(xy);
    float ring = smoothstep(0.009, 0.0, abs(r - 0.146)) * smoothstep(0.35, 0.8, fbm(xy * 40.0 + float(k) * 9.0));
    float e = HS - max(abs(xy.x), abs(xy.y));
    float wear = smoothstep(0.0045, 0.0, e) * (0.4 + 0.6 * vnoise(xy * 260.0));
    alb = mix(alb, vec3(0.62, 0.58, 0.52), clamp(ring * 0.1 + wear * 0.6, 0.0, 1.0));
  } else {
    alb = vec3(0.6, 0.55, 0.47) * (0.9 + 0.2 * vnoise(xy * 400.0));
  }
  float ao = mix(0.6, 1.0, smoothstep(-HS, -HS + 0.05, xy.y));
  float lit = max(dot(n, uL), 0.0) * gobo(P);
  if (lit > 0.001) lit *= sunShadow(P + n * 0.0015, seed);
  vec3 col = alb * (SUN * lit + AMB * ao * 1.15);
  float F = 0.04 + 0.96 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
  col += room(reflect(-V, n), 0.55) * F * (front ? 0.6 : 0.2);
  col += SUN * lit * pow(max(dot(n, normalize(uL + V)), 0.0), 70.0) * 0.12;
  // the laminated print catches a broad, faint sheen, broken up by handling marks
  if (front) col += SUN * lit * pow(max(dot(n, normalize(uL + V)), 0.0), 9.0) * 0.05 * (0.6 + 0.8 * fbm(xy * 18.0 + float(k)));
  return col;
}
vec3 shadeDisc(vec3 P, vec3 lp, vec3 n, int k, vec3 V, float seed) {
  vec2 p = lp.xy;
  float r = length(p);
  if (r < 0.0037) return vec3(0.004);
  float lit = max(dot(n, uL), 0.0) * gobo(P);
  if (lit > 0.001) lit *= sunShadow(P + n * 0.0015, seed);
  float ao = occl(P) * 0.9 + 0.1;
  if (r < LR) {
    float s = uSpin[k];
    vec2 q = mat2(cos(s), -sin(s), sin(s), cos(s)) * p;
    vec3 alb = pow(texture(uTex, vec3(q / (2.0 * LR) + 0.5, float(k + 3))).rgb, vec3(2.2));
    vec3 col = alb * (SUN * lit + AMB * ao);
    float F = 0.04 + 0.96 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
    return col + room(reflect(-V, n), 0.7) * F * 0.3;
  }
  // grooves run round the centre, so light streaks across them along the radius
  vec2 tl = vec2(-p.y, p.x) / r;
  vec3 T = uSU[k] * tl.x + uSV[k] * tl.y;
  float runout = smoothstep(0.062, 0.0605, r);
  float gap = 0.0;
  for (int b = 0; b < 4; b++) gap = max(gap, smoothstep(0.0011, 0.0004, abs(r - (0.078 + float(b) * 0.0165))));
  float lead = smoothstep(0.1455, 0.1465, r);
  float smoothBand = max(max(runout, gap), lead * 0.7);
  float grooveTex = 0.75 + 0.25 * vnoise(vec2(r * 2600.0, 0.0)) ;
  // each groove wall is a tiny slope facing in or out along the radius, so a light reflects off them
  // only along the radius that lines up with the half vector: a thin bright streak through the centre
  vec2 rad = p / r;
  vec3 H = normalize(uL + V);
  vec2 hl = vec2(dot(H, uSU[k]), dot(H, uSV[k]));
  float slope = length(hl) / max(dot(H, n), 1e-3);
  float al = abs(dot(rad, hl / max(length(hl), 1e-4)));
  float aniso = (pow(al, 900.0) * 4.5 + pow(al, 60.0) * 0.35) * exp(-slope * slope / 0.5);
  vec3 H2 = normalize(normalize(KEY2) + V);
  vec2 hl2 = vec2(dot(H2, uSU[k]), dot(H2, uSV[k]));
  float slope2 = length(hl2) / max(dot(H2, n), 1e-3);
  float al2 = abs(dot(rad, hl2 / max(length(hl2), 1e-4)));
  float aniso2 = (pow(al2, 500.0) * 1.6 + pow(al2, 40.0) * 0.12) * exp(-slope2 * slope2 / 0.5);
  float ndl = max(dot(n, uL), 0.0);
  vec3 col = vec3(0.011, 0.010, 0.010) * (SUN * lit + AMB * ao);
  float F = 0.045 + 0.955 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
  vec3 R = reflect(-V, n);
  col += room(R, mix(0.35, 0.02, smoothBand)) * F * mix(0.8, 1.15, smoothBand);
  col += SUN * (lit / max(ndl, 0.05)) * ndl * aniso * grooveTex * (1.0 - smoothBand * 0.8) * 0.9;
  col += vec3(1.0, 0.96, 0.9) * aniso2 * grooveTex * ao * (1.0 - smoothBand) * 0.9;
  // a bevelled rim, and a little dust
  col += room(R, 0.2) * 0.25 * smoothstep(DR - 0.0018, DR - 0.0003, r);
  float dust = step(0.9992, hash(floor(p * 1600.0) + float(k) * 13.0));
  col += vec3(0.5, 0.48, 0.45) * dust * (SUN * lit * 0.12 + AMB * 0.4);
  return col;
}

vec3 tonemap(vec3 x) { x *= 0.72; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  Lu = normalize(cross(uL, vec3(0.0, 1.0, 0.0)));
  Lv = cross(Lu, uL);
  vec3 acc = vec3(0.0);
  float depth = 0.0;
  int ss = uSS;
  vec2 offs[4] = vec2[4](vec2(0.375, 0.125), vec2(0.875, 0.375), vec2(0.125, 0.625), vec2(0.625, 0.875));
  int cnt = ss > 1 ? 4 : 1;
  for (int s = 0; s < 4; s++) {
    if (s >= cnt) break;
    vec2 off = cnt == 1 ? vec2(0.5) : offs[s];
    vec2 uv = (gl_FragCoord.xy - 0.5 + off) / uRes * 2.0 - 1.0;
    vec3 rd = normalize(uFw + uRt * uv.x * uTan * uAspect + uUp * uv.y * uTan);
    int m, k; vec3 n, lp;
    float t = trace(uCam, rd, m, n, lp, k);
    vec3 P = uCam + rd * t, V = -rd;
    float seed = ign(gl_FragCoord.xy + vec2(float(s) * 17.0, float(s) * 5.0));
    vec3 col;
    if (m == 0) col = shadeWall(P, seed);
    else if (m == 1) col = shadeShelf(P, lp, n, V, seed);
    else if (m == 2) col = shadeSleeve(P, lp, n, k, V, seed);
    else if (m == 3) col = shadeDisc(P, lp, n, k, V, seed);
    else col = vec3(0.5);
    acc += tonemap(col);
    depth += dot(P - uCam, uFw);
  }
  acc /= float(cnt);
  depth /= float(cnt);
  float coc = clamp(uAperture * (1.0 - uFocus / max(depth, 0.05)), -1.0, 1.0);
  o = vec4(pow(acc, vec3(1.0 / 2.2)), 0.5 + 0.5 * coc);
}`;

const VS_FULL = `#version 300 es
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

// Lens and film: a small depth-of-field gather, a warm glow round the brightest highlights, vignette and grain.
const FS_OUT = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uPx;
uniform float uMaxR, uTime;
out vec4 o;
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  vec2 uv = gl_FragCoord.xy * uPx;
  vec4 c0 = texture(uScene, uv);
  float coc = abs(c0.a * 2.0 - 1.0);
  vec3 acc = c0.rgb; float w = 1.0; vec3 glow = vec3(0.0);
  float rot = 6.2832 * ign(gl_FragCoord.xy);
  for (int k = 1; k < 16; k++) {
    float r = sqrt(float(k) / 15.0);
    float a = float(k) * 2.39996 + rot;
    vec2 d = vec2(cos(a), sin(a)) * r;
    vec4 s = texture(uScene, uv + d * coc * uMaxR * uPx);
    float ws = smoothstep(0.0, 0.15, abs(s.a * 2.0 - 1.0) + 0.05);
    acc += s.rgb * ws; w += ws;
    vec3 g = texture(uScene, uv + d * uMaxR * 2.2 * uPx).rgb;
    glow += max(g - 0.82, 0.0);
  }
  vec3 col = acc / w + glow * vec3(1.0, 0.8, 0.6) * 0.09;
  vec2 q = uv - 0.5;
  col *= 1.0 - 0.38 * dot(q, q);
  col += (ign(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.024;
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

type Rec = (typeof records)[number];

/** The printed front of a sleeve: the photo, cropped square, with the speaker's name set small in the corner. */
function paintCover(ctx: CanvasRenderingContext2D, r: Rec, img: HTMLImageElement | null) {
  ctx.fillStyle = r.tone;
  ctx.fillRect(0, 0, TEX, TEX);
  if (img) {
    const s = Math.max(TEX / img.naturalWidth, TEX / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (TEX - w) / 2, (TEX - h) / 2, w, h);
  }
  ctx.fillStyle = "rgba(255, 250, 240, 0.92)";
  ctx.font = `600 22px ${GROTESK}`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  const name = r.name.toUpperCase().split("").join(String.fromCharCode(8202));
  ctx.fillText(name, 40, TEX - 44);
  ctx.textAlign = "right";
  ctx.font = `italic 24px ${SERIF}`;
  ctx.fillText("Side A", TEX - 40, TEX - 44);
}

/** The paper label: a flat colour, the name, a rim line and the centre hole marking. */
function paintLabel(ctx: CanvasRenderingContext2D, r: Rec, index: number) {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, TEX, TEX);
  const c = TEX / 2;
  ctx.fillStyle = r.label;
  ctx.beginPath();
  ctx.arc(c, c, c - 2, 0, Math.PI * 2);
  ctx.fill();
  const ink = r.label === "#e2c98f" ? "#2b1a10" : "#1d120b";
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(c, c, c - 40, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `italic 64px ${SERIF}`;
  ctx.fillText(r.name.split(" ")[0], c, c - 150);
  ctx.font = `600 26px ${GROTESK}`;
  ctx.fillText(r.name.split(" ").slice(1).join(" ").toUpperCase(), c, c - 92);
  ctx.font = `600 22px ${GROTESK}`;
  ctx.fillText(`33 RPM   ·   No. ${index + 1}`, c, c + 120);
  ctx.font = `20px ${GROTESK}`;
  ctx.fillText(r.role, c, c + 170);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.arc(c, c, 34, 0, Math.PI * 2);
  ctx.fill();
}

type Sim = {
  index: number; queued: number; outAt: number; textIn: boolean;
  out: number[]; outV: number[]; tip: number[]; tipV: number[]; spin: number[];
  px: number; py: number; cx: number; cy: number;
  paused: boolean; nextAuto: number; dirty: boolean; narrow: boolean;
};

function QuoteBody({ r, narrow }: { r: Rec; narrow: boolean }) {
  return (
    <figure className="m-0" style={{ color: INK }}>
      <p className="flex items-center gap-3 font-semibold uppercase" style={{ fontFamily: GROTESK, fontSize: narrow ? 10.5 : 12, letterSpacing: "0.26em" }}>
        <span aria-hidden="true" className="inline-block h-px w-8 bg-current" />
        {KICKER}
      </p>
      <blockquote className="relative m-0 mt-5" style={{ fontFamily: SERIF, fontSize: narrow ? 36 : 60, lineHeight: 1.0, letterSpacing: "-0.035em", fontWeight: 500, textWrap: "balance" } as React.CSSProperties}>
        <span aria-hidden="true" className="absolute" style={{ transform: "translateX(-0.46em)" }}>
          “
        </span>
        {r.quote}”
      </blockquote>
      <figcaption className={narrow ? "mt-5" : "mt-9"} style={{ fontFamily: GROTESK }}>
        <span className="block font-semibold" style={{ fontSize: narrow ? 15 : 19, letterSpacing: "-0.01em" }}>
          {r.name}
        </span>
        <span className="mt-1 block font-medium uppercase" style={{ fontSize: narrow ? 10 : 11.5, letterSpacing: "0.2em" }}>
          {r.role}
        </span>
      </figcaption>
    </figure>
  );
}

export default function RecordSleeveTestimonials() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [shown, setShown] = useState(0);
  const [ink, setInk] = useState(true);
  const [narrow, setNarrow] = useState(false);
  const [mode, setMode] = useState<"pending" | "gl" | "still">("pending");
  const sim = useRef<Sim>({
    index: 0, queued: -1, outAt: 0, textIn: true,
    out: [1, 0, 0], outV: [0, 0, 0], tip: [0, 0, 0], tipV: [0, 0, 0], spin: [0.4, 1.9, 4.2],
    px: 0, py: 0, cx: 0, cy: 0, paused: false, nextAuto: 0, dirty: true, narrow: false,
  });

  const pick = useCallback((i: number) => {
    const s = sim.current;
    s.nextAuto = performance.now() + HOLD_MS * 1.5;
    s.dirty = true;
    if (i === s.index) return;
    s.queued = mod(i, N);
    if (mode === "still") {
      s.index = s.queued;
      s.queued = -1;
      setShown(s.index);
    }
  }, [mode]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const isNarrow = wrap.clientWidth / wrap.clientHeight < 1.1;
      sim.current.narrow = isNarrow;
      sim.current.dirty = true;
      setNarrow(isNarrow);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

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
    let prog: WebGLProgram, progOut: WebGLProgram;
    try {
      prog = program(gl, VS_FULL, FS);
      progOut = program(gl, VS_FULL, FS_OUT);
    } catch {
      setMode("still");
      return;
    }
    setMode("gl");

    // covers in layers 0 to 2, disc labels in layers 3 to 5, all in sRGB
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, Math.floor(Math.log2(TEX)) + 1, gl.RGBA8, TEX, TEX, N * 2);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    const scratch = document.createElement("canvas");
    scratch.width = TEX;
    scratch.height = TEX;
    const sctx = scratch.getContext("2d")!;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const upload = (layer: number) => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, TEX, TEX, 1, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      s.dirty = true;
    };
    let alive = true;
    records.forEach((r, i) => {
      paintLabel(sctx, r, i);
      upload(N + i);
      paintCover(sctx, r, null);
      upload(i);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (!alive) return;
        paintCover(sctx, r, img);
        upload(i);
      };
      img.src = r.src;
    });

    const vao = gl.createVertexArray();
    const sceneFbo = gl.createFramebuffer();
    const sceneTex = gl.createTexture();
    let W = 0, H = 0, cw = 1, ch = 1, scale = Math.min(window.devicePixelRatio || 1, 1.25), ss = 2;
    const resize = () => {
      cw = wrap.clientWidth;
      ch = wrap.clientHeight;
      let k = scale;
      if (cw * ch * k * k > 1.5e6) k = Math.sqrt(1.5e6 / (cw * ch));
      const w = Math.max(2, Math.round(cw * k)), h = Math.max(2, Math.round(ch * k));
      s.dirty = true;
      if (w === W && h === H) return;
      W = w;
      H = h;
      canvas.width = W;
      canvas.height = H;
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, sceneTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const locs = new Map<string, WebGLUniformLocation | null>();
    const U = (p: WebGLProgram, n: string) => {
      const key = (p === prog ? "a" : "b") + n;
      if (!locs.has(key)) locs.set(key, gl.getUniformLocation(p, n));
      return locs.get(key)!;
    };
    const sun = (() => {
      const v = [-0.5, 0.62, 0.6];
      const l = Math.hypot(v[0], v[1], v[2]);
      return v.map((x) => x / l);
    })();

    /** Where each sleeve stands: its bottom back edge rests on the shelf, its top touches the wall. */
    const pose = (i: number) => {
      const lean = LEANS[i] + s.tip[i];
      // with its record out, the sleeve slides forward on the shelf so the disc, not the sleeve, rests on the wall
      const zb = Math.max(2 * HS * Math.sin(LEANS[i]), (HS + s.out[i] * SLIDE + 0.1505) * Math.sin(lean)) + 0.0015;
      const cyw = Math.cos(YAWS[i]), syw = Math.sin(YAWS[i]);
      const yaw = (v: number[]) => [v[0] * cyw + v[2] * syw, v[1], -v[0] * syw + v[2] * cyw];
      const Uv = yaw([1, 0, 0]);
      const Vv = yaw([0, Math.cos(lean), -Math.sin(lean)]);
      const Nv = yaw([0, Math.sin(lean), Math.cos(lean)]);
      const B = [XS[i], 0, zb];
      const C = [0, 1, 2].map((a) => B[a] + Vv[a] * HS + Nv[a] * HT);
      return { C, Uv, Vv, Nv };
    };

    const sc = new Float32Array(9), su = new Float32Array(9), sv = new Float32Array(9), sn = new Float32Array(9);
    const lift = new Float32Array(3), spin = new Float32Array(3);

    const draw = (t: number) => {
      const aspect = cw / ch;
      const needW = s.narrow ? 1.12 : 1.85;
      const visW = Math.max(needW, (s.narrow ? 1.3 : 1.05) * aspect);
      const visH = visW / aspect;
      const shelfAt = s.narrow ? 0.8 : 0.84;
      const ctrX = s.narrow ? 0 : -0.2 * visW;
      const ctrY = (shelfAt - 0.5) * visH + 0.02;
      const TAN = visH / 2 / CAM_Z;
      const cam = [ctrX + s.cx * 0.12 + (reduce ? 0 : 0.02 * Math.sin(t * 0.23)), ctrY + 0.42 - s.cy * 0.06, CAM_Z];
      let fw = [ctrX * 0.96 - cam[0], ctrY - cam[1], -cam[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]);
      fw = fw.map((v) => v / fl);
      let rt = [-fw[2], 0, fw[0]];
      const rl = Math.hypot(rt[0], rt[2]);
      rt = rt.map((v) => v / rl);
      const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];

      const proj = (p: number[]) => {
        const d = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]];
        const xv = d[0] * rt[0] + d[1] * rt[1] + d[2] * rt[2], yv = d[0] * up[0] + d[1] * up[1] + d[2] * up[2], zv = d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2];
        return [cw * 0.5 * (1 + xv / (TAN * aspect * zv)), ch * 0.5 * (1 - yv / (TAN * zv))];
      };
      for (let i = 0; i < N; i++) {
        const p = pose(i);
        sc.set(p.C, i * 3);
        su.set(p.Uv, i * 3);
        sv.set(p.Vv, i * 3);
        sn.set(p.Nv, i * 3);
        lift[i] = s.out[i] * SLIDE;
        spin[i] = s.spin[i];
        // a clickable box over each sleeve and the part of its record that shows
        const btn = hitRefs.current[i];
        if (btn) {
          const top = HS + lift[i] + (lift[i] > 0.01 ? HS * 0.95 : 0);
          const corners = [[-HS, -HS], [HS, -HS], [HS, top], [-HS, top]].map(([x, y]) => proj([0, 1, 2].map((a) => p.C[a] + p.Uv[a] * x + p.Vv[a] * y)));
          const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
          const l = Math.min(...xs), tp = Math.min(...ys);
          btn.style.transform = `translate(${l}px, ${tp}px)`;
          btn.style.width = `${Math.max(...xs) - l}px`;
          btn.style.height = `${Math.max(...ys) - tp}px`;
        }
      }
      const sel = pose(s.index);
      const focusD = (sel.C[0] - cam[0]) * fw[0] + (sel.C[1] + 0.08 - cam[1]) * fw[1] + (sel.C[2] - cam[2]) * fw[2];

      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
      gl.viewport(0, 0, W, H);
      gl.useProgram(prog);
      gl.uniform3fv(U(prog, "uCam"), cam);
      gl.uniform3fv(U(prog, "uRt"), rt);
      gl.uniform3fv(U(prog, "uUp"), up);
      gl.uniform3fv(U(prog, "uFw"), fw);
      gl.uniform1f(U(prog, "uTan"), TAN);
      gl.uniform1f(U(prog, "uAspect"), W / H);
      gl.uniform2f(U(prog, "uRes"), W, H);
      gl.uniform1i(U(prog, "uSS"), ss);
      gl.uniform3fv(U(prog, "uSC[0]"), sc);
      gl.uniform3fv(U(prog, "uSU[0]"), su);
      gl.uniform3fv(U(prog, "uSV[0]"), sv);
      gl.uniform3fv(U(prog, "uSN[0]"), sn);
      gl.uniform1fv(U(prog, "uLift[0]"), lift);
      gl.uniform1fv(U(prog, "uSpin[0]"), spin);
      gl.uniform3fv(U(prog, "uL"), sun);
      gl.uniform4fv(U(prog, "uWin"), s.narrow ? [0.06, 0.5, 0.85, 1.05] : [0.18, 0.08, 1.15, 0.62]);
      gl.uniform1f(U(prog, "uFocus"), focusD);
      gl.uniform1f(U(prog, "uAperture"), 1.1);
      gl.uniform1i(U(prog, "uTex"), 0);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(progOut);
      gl.uniform1i(U(progOut, "uScene"), 1);
      gl.uniform2f(U(progOut, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(progOut, "uMaxR"), H * 0.012);
      gl.uniform1f(U(progOut, "uTime"), reduce ? 0 : t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    /** One small step: discs slide on springs and stop against the sleeve bottom, sleeves rock off the wall and fall back. */
    const physics = (dt: number, now: number) => {
      if (s.queued >= 0 && s.out[s.index] < 0.6) {
        s.index = s.queued;
        s.queued = -1;
        s.outAt = now + 160;
        s.tipV[s.index] -= TIP_KICK;
      }
      for (let i = 0; i < N; i++) {
        const goal = i === s.index && s.queued < 0 && now > s.outAt ? 1 : 0;
        const before = s.out[i];
        s.outV[i] += (SLIDE_PULL * (goal - s.out[i]) - SLIDE_DRAG * s.outV[i]) * dt;
        s.out[i] += s.outV[i] * dt;
        if (s.out[i] < 0) {
          s.out[i] = 0;
          if (s.outV[i] < -0.4) s.tipV[i] -= s.outV[i] * 0.08;
          s.outV[i] *= -0.18;
        }
        s.spin[i] += (s.out[i] - before) * 1.6;
        // gravity pulls the sleeve back toward the wall; it cannot pass through it
        s.tipV[i] += 2.6 * dt;
        s.tip[i] += s.tipV[i] * dt;
        if (s.tip[i] > 0) {
          s.tip[i] = 0;
          s.tipV[i] = s.tipV[i] > 0.12 ? -s.tipV[i] * 0.32 : 0;
        }
        s.tip[i] = Math.max(s.tip[i], -0.09);
      }
      const now_out = s.out[s.index];
      if (s.queued >= 0 && s.textIn) {
        s.textIn = false;
        setInk(false);
      }
      if (!s.textIn && s.queued < 0 && now_out > 0.45) {
        s.textIn = true;
        setShown(s.index);
        setInk(true);
      }
    };

    let raf = 0, visible = true, last = performance.now(), slow = 0, frames = 0;
    s.nextAuto = last + HOLD_MS;
    const tick = (now: number) => {
      const real = now - last;
      const dt = Math.min(0.05, real / 1000);
      last = now;
      if (!s.paused && !document.hidden && now > s.nextAuto && s.queued < 0) {
        s.queued = mod(s.index + 1, N);
        s.nextAuto = now + HOLD_MS;
      }
      if (reduce) {
        if (s.queued >= 0) {
          s.index = s.queued;
          s.queued = -1;
          setShown(s.index);
          setInk(true);
          s.dirty = true;
        }
        for (let i = 0; i < N; i++) {
          s.out[i] = i === s.index ? 1 : 0;
          s.tip[i] = 0;
        }
      } else {
        const sub = Math.max(1, Math.ceil(dt / 0.004));
        for (let i = 0; i < sub; i++) physics(dt / sub, now);
        s.cx += (s.px - s.cx) * Math.min(1, dt * 3);
        s.cy += (s.py - s.cy) * Math.min(1, dt * 3);
      }
      if (!reduce || s.dirty) {
        draw(now / 1000);
        s.dirty = false;
        // measure, do not guess: drop the supersampling first, then the resolution, if frames run long
        if (!reduce && ++frames > 24) {
          slow = slow * 0.9 + (real > 22 ? 1 : 0) * 0.1;
          if (slow > 0.6) {
            if (ss > 1) ss = 1;
            else if (scale > 0.55) {
              scale *= 0.85;
              resize();
            }
            slow = 0;
            frames = 0;
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

    const move = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      s.px = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      s.py = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      s.dirty = true;
    };
    const leave = () => {
      s.px = 0;
      s.py = 0;
    };
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerleave", leave);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerleave", leave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduce]);

  const onKey = (e: React.KeyboardEvent) => {
    const s = sim.current;
    const cur = s.queued >= 0 ? s.queued : s.index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      pick(cur + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      pick(cur - 1);
    }
  };
  const pause = (v: boolean) => () => {
    sim.current.paused = v;
    if (!v) sim.current.nextAuto = performance.now() + HOLD_MS;
  };
  const r = records[shown];
  const label = "text-[10px] font-semibold uppercase tracking-[0.26em] sm:text-[11px]";

  return (
    <section className="relative overflow-hidden bg-[#c9b394]" onFocus={pause(true)} onBlur={pause(false)} onPointerEnter={pause(true)} onPointerLeave={pause(false)}>
      <style>{`@keyframes vinyl-sleeve-testimonials-ink { from { opacity: 0; transform: translateY(16px); filter: blur(6px); } to { opacity: 1; transform: none; filter: blur(0); } } .vinyl-sleeve-testimonials-ink { animation: vinyl-sleeve-testimonials-ink 680ms cubic-bezier(0.2, 0.7, 0.2, 1) both; } @media (prefers-reduced-motion: reduce) { .vinyl-sleeve-testimonials-ink { animation: none; } }`}</style>
      <div
        ref={wrapRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Client testimonials shown as three record sleeves on a sunlit shelf. Choose a sleeve, or use the left and right arrow keys, to pull out that person's record and read their quote."
        tabIndex={0}
        onKeyDown={onKey}
        className="relative h-[740px] w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2b1a10]/70 sm:h-[760px]"
      >
        <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full ${mode === "still" ? "hidden" : ""}`} />

        {/* the still room, for browsers without WebGL 2 */}
        {mode === "still" && (
          <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(160deg, #d8c3a3 0%, #c4ab88 60%, #b39874 100%)" }}>
            <div className="absolute inset-0" style={{ background: "linear-gradient(118deg, transparent 30%, rgba(255,226,180,0.55) 30.5%, rgba(255,226,180,0.55) 78%, transparent 78.5%)" }} />
            <div className="absolute inset-x-0 h-[4%]" style={{ top: "80%", background: "linear-gradient(180deg, #8a5a33, #5e3a1f)", boxShadow: "0 18px 30px -10px rgba(50,25,5,0.55)" }} />
            <div className="absolute flex items-end gap-[2.4%]" style={{ left: narrow ? "8%" : "46%", right: narrow ? "8%" : "6%", bottom: "20%" }}>
              {records.map((rec, i) => (
                <div key={rec.name} className="relative aspect-square flex-1" style={{ transform: `perspective(900px) rotateX(${LEANS[i] * 57}deg)`, transformOrigin: "bottom" }}>
                  {i === shown && <div className="absolute inset-x-[2%] -top-[50%] aspect-square rounded-full" style={{ background: "repeating-radial-gradient(circle, #141414 0 2px, #1d1d1d 2px 3px)", boxShadow: "0 0 0 1px #000" }}><div className="absolute inset-[33%] rounded-full" style={{ background: rec.label }} /></div>}
                  <img src={rec.src} alt="" width={900} height={900} className="relative h-full w-full object-cover" style={{ background: rec.tone, boxShadow: "14px 16px 26px -8px rgba(60,30,5,0.5)" }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* the quote, printed onto the wall: real text, multiplied so the sun and shade show through */}
        <div
          aria-live="polite"
          className={`pointer-events-none absolute ${narrow ? "inset-x-6 top-[11%]" : "left-[6%] top-[15%] w-[36%] max-w-[540px]"}`}
          style={{ mixBlendMode: mode === "gl" ? "multiply" : "normal" }}
        >
          <div className="transition-opacity duration-300 motion-reduce:transition-none" style={{ opacity: ink ? 1 : 0 }}>
            <div key={shown} className="vinyl-sleeve-testimonials-ink">
              <QuoteBody r={r} narrow={narrow} />
              <span className="sr-only">Record sleeve photo: {r.alt}</span>
            </div>
          </div>
        </div>

        {/* invisible buttons laid over each sleeve, kept in place by the render loop */}
        {mode === "gl" &&
          records.map((rec, i) => (
            <button
              key={rec.name}
              ref={(el) => {
                hitRefs.current[i] = el;
              }}
              type="button"
              onClick={() => pick(i)}
              aria-label={`Pull out ${rec.name}'s record`}
              aria-pressed={shown === i}
              className="absolute left-0 top-0 cursor-pointer rounded-sm bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[#fff3e2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2b1a10]"
              style={{ width: 0, height: 0 }}
            />
          ))}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-9">
          <p className={`${label} rounded-full bg-[#fff3e2]/85 px-4 py-2.5`} style={{ fontFamily: GROTESK, color: INK }}>
            <span className="tabular-nums">{String(shown + 1).padStart(2, "0")}</span>
            <span className="mx-2 opacity-50">/</span>
            <span className="tabular-nums">{String(N).padStart(2, "0")}</span>
          </p>
          <div className="pointer-events-auto flex gap-2">
            {records.map((rec, i) => (
              <button
                key={rec.name}
                type="button"
                onClick={() => pick(i)}
                aria-label={`Show ${rec.name}`}
                aria-current={shown === i ? "true" : undefined}
                className="grid h-11 w-11 place-items-center rounded-full border border-[#2b1a10]/25 bg-[#fff3e2]/75 transition hover:bg-[#fff3e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b1a10]"
              >
                <span aria-hidden="true" className="block h-4 w-4 rounded-full" style={{ background: shown === i ? "#151110" : "transparent", border: "1.5px solid #2b1a10", boxShadow: shown === i ? `inset 0 0 0 4px ${rec.label}` : "none" }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
