import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The prints, in the order they come round. `focus` is the crop centre (0 to 1), `tone` shows until the photo arrives. */
const plates = [
  { title: "Tulle, scarlet", src: "https://images.pexels.com/photos/31167809/pexels-photo-31167809.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman with dark lipstick wrapped in a cloud of red tulle against a black backdrop", focus: [0.5, 0.36], tone: "#7a0f14" },
  { title: "Pleats on oxblood", src: "https://images.pexels.com/photos/31422879/pexels-photo-31422879.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman in profile wearing a pale pink pleated dress against a deep red backdrop", focus: [0.5, 0.4], tone: "#5a0a12" },
  { title: "Lacquer and paper", src: "https://images.pexels.com/photos/33798257/pexels-photo-33798257.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman in a glossy red dress and long red gloves holding a crumpled red paper flag", focus: [0.5, 0.42], tone: "#a3121a" },
  { title: "The black fan", src: "https://images.pexels.com/photos/36900256/pexels-photo-36900256.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman in a white top holding a large black fan in front of a red backdrop", focus: [0.5, 0.42], tone: "#6e1410" },
  { title: "Suit, carmine", src: "https://images.pexels.com/photos/38887203/pexels-photo-38887203.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman in a red trouser suit standing against a matching dark red backdrop", focus: [0.5, 0.4], tone: "#8a0f1c" },
  { title: "Turn in crimson", src: "https://images.pexels.com/photos/31422870/pexels-photo-31422870.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman twirling in a red pleated dress on a red studio floor", focus: [0.5, 0.5], tone: "#6a0a14" },
  { title: "Coat off the shoulder", src: "https://images.pexels.com/photos/21352928/pexels-photo-21352928.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman with a black coat slung over one shoulder against a hot pink and red backdrop", focus: [0.5, 0.4], tone: "#a80f3a" },
];

const N = plates.length;
const MASTHEAD = "Rouge"; // the wordmark in the top corner
const HOLD_MS = 3400; // rest between automatic turns
const SPRING = 34; // pull of the carriage toward the chosen print
const DAMPING = 7.6; // lower for more overshoot
const ROCK_GAIN = 0.072; // how hard a change of speed tips the prints
const TEX_W = 640;
const TEX_H = 904;
const SERIF = '"Didot", "Bodoni 72", "Bodoni MT", "Playfair Display", "Libre Bodoni", Georgia, serif';
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Geometry of the set, in metres. A print is 1.06 wide and 1.5 tall and stands on its bottom edge.
const HX = 0.53;
const HY = 0.75;
const ALPHA = Math.atan(HX / HY); // lean at which a print would balance on one corner
const P2 = (3 * 9.81) / (4 * Math.hypot(HX, HY)); // rocking frequency squared of a slab this size
const RING = 3.4;
const STEP = 0.36;

const GLSL_HEAD = `#version 300 es
precision highp float;
precision highp sampler2DArray;
const int NP = 7;
const vec2 HS = vec2(${HX}, ${HY});
const float ZW = -3.7;
const vec3 LPOS = vec3(-2.7, 5.0, 5.6);
const vec3 LAIM = vec3(0.0, 0.7, 0.3);
uniform vec3 uPc[7];
uniform vec3 uPu[7];
uniform vec3 uPv[7];
uniform float uPl[7];
uniform float uPk[7];
uniform sampler2DArray uTex;
uniform vec3 uCam, uRt, uUp, uFw;
uniform float uTan, uAspect, uFocus, uAperture, uTime;

float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.1 + 7.3) + 0.125 * vnoise(p * 4.3 + 1.7) + 0.0625 * vnoise(p * 8.9); }

bool hitPanel(int i, vec3 ro, vec3 rd, out float t, out vec2 ab) {
  vec3 n = cross(uPu[i], uPv[i]);
  float d = dot(rd, n);
  if (abs(d) < 1e-5) return false;
  t = dot(uPc[i] - ro, n) / d;
  if (t <= 1e-3) return false;
  vec3 p = ro + rd * t - uPc[i];
  ab = vec2(dot(p, uPu[i]), dot(p, uPv[i]));
  return abs(ab.x) < HS.x && abs(ab.y) < HS.y;
}

// The key light: one big softbox high on the left, aimed at the middle print, falling off to the sides.
vec3 keyAt(vec3 P, out vec3 l) {
  vec3 d = LPOS - P;
  float r2 = dot(d, d);
  l = d * inversesqrt(r2);
  float spot = smoothstep(0.86, 0.985, dot(-l, normalize(LAIM - LPOS)));
  return vec3(1.0, 0.955, 0.9) * (72.0 * (0.1 + 0.9 * spot) / r2);
}
float keyVis(vec3 P, int skip, float seed) {
  vec3 fw = normalize(LAIM - LPOS);
  vec3 lt = normalize(cross(fw, vec3(0, 1, 0)));
  vec3 lb = cross(lt, fw);
  float v = 0.0;
  for (int k = 0; k < 4; k++) {
    float a = 6.2832 * fract(seed + float(k) * 0.618034);
    float r = sqrt((float(k) + 0.5) / 4.0) * 0.85;
    vec3 d = LPOS + (lt * cos(a) + lb * sin(a)) * r - P;
    float occ = 0.0; float t; vec2 ab;
    for (int i = 0; i < NP; i++) {
      if (i == skip) continue;
      if (hitPanel(i, P, d, t, ab) && t < 1.0) { occ = 1.0; break; }
    }
    v += 1.0 - occ;
  }
  return v / 4.0;
}

// What a mirror sees when it looks away from the wall: two softboxes behind and above the camera.
vec3 studio(vec3 ro, vec3 rd) {
  vec3 c = vec3(0.012, 0.01, 0.01);
  if (rd.z > 0.0) {
    // tall strip lights either side of the camera: they only show in a print that is turned toward them
    float side = smoothstep(0.5, 0.62, abs(rd.x)) * smoothstep(0.96, 0.86, abs(rd.x));
    float high = smoothstep(0.215, 0.25, rd.y) * smoothstep(0.7, 0.5, rd.y);
    c += vec3(1.0, 0.95, 0.9) * 2.4 * side * high;
  }
  if (rd.y > 1e-4) {
    vec3 p = ro + rd * ((6.5 - ro.y) / rd.y);
    float m = smoothstep(-2.6, -1.8, p.x) * smoothstep(2.6, 1.8, p.x) * smoothstep(0.5, 1.3, p.z) * smoothstep(5.0, 4.2, p.z);
    c += vec3(1.0, 0.93, 0.86) * 3.0 * m;
  }
  return c;
}

// The back wall: charcoal plaster with one pool of light low behind the middle print.
vec3 wallCol(vec3 ro, vec3 rd, float lod) {
  if (rd.z > -1e-4) return studio(ro, rd);
  vec3 W = ro + rd * ((ZW - ro.z) / rd.z);
  if (W.y < 0.0) return vec3(0.0);
  vec3 l; vec3 key = keyAt(W, l);
  float grain = 0.9 + 0.2 * fbm(W.xy * 3.0);
  vec3 alb = vec3(0.026, 0.021, 0.022) * grain;
  vec2 wq = (W.xy - vec2(-0.15, 0.7)) / vec2(2.5, 1.25);
  float wash = exp(-pow(dot(wq, wq), 0.8) * 1.15);
  vec3 c = alb * (key * max(l.z, 0.0) * 0.5 + vec3(1.0, 0.93, 0.88) * wash * 8.5 + 0.03);
  c += vec3(1.0, 0.86, 0.78) * exp(-W.y / 0.05) * 0.1 * wash;
  return c * smoothstep(8.0, 3.0, abs(W.x));
}

vec3 faceLight(int i, vec3 P) {
  vec3 l; vec3 key = keyAt(P, l);
  return (key * max(dot(cross(uPu[i], uPv[i]), l), 0.0) + vec3(0.07, 0.06, 0.06)) * uPk[i];
}
vec3 tonemap(vec3 x) { x *= 0.92; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec4 pack(vec3 col, float depth) {
  float coc = clamp(uAperture * (1.0 - uFocus / max(depth, 0.05)), -1.0, 1.0);
  return vec4(pow(tonemap(col), vec3(1.0 / 2.2)), 0.5 + 0.5 * coc);
}
`;

const VS_FULL = `#version 300 es
out vec2 vUv;
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const FS_SET = `${GLSL_HEAD}
in vec2 vUv;
out vec4 o;
void main() {
  vec2 ndc = vUv * 2.0 - 1.0;
  vec3 rd = normalize(uFw + uRt * (ndc.x * uTan * uAspect) + uUp * (ndc.y * uTan));
  float seed = ign(gl_FragCoord.xy);
  float tw = (ZW - uCam.z) / rd.z;
  float tf = rd.y < -1e-4 ? -uCam.y / rd.y : 1e9;
  if (tf > tw) { o = pack(wallCol(uCam, rd, 0.0), dot(rd, uFw) * tw); return; }
  vec3 P = uCam + rd * tf;

  // polished resin floor: dark, slightly wavy, with smudges that change how sharp the mirror is
  float smudge = fbm(P.xz * 1.7 + 3.1);
  float rough = 0.006 + 0.042 * smudge * smudge + 0.012 * vnoise(P.xz * vec2(3.0, 41.0));
  vec2 wav = vec2(vnoise(P.xz * 2.3 + 11.0), vnoise(P.xz * 2.3 + 37.0)) - 0.5;
  vec3 n = normalize(vec3(wav.x * 0.012, 1.0, wav.y * 0.012));

  // the brass rail the prints ride on, inlaid flush
  float rr = abs(length(P.xz - vec2(0.0, -${RING})) - ${RING});
  float rr2 = abs(length(P.xz - vec2(0.0, -${RING})) - ${RING + 0.92});
  float rail = max(smoothstep(0.011, 0.007, rr), smoothstep(0.011, 0.007, rr2));
  rough = mix(rough, 0.03, rail);

  // glossy reflection: a handful of rays through the rough mirror, each one finding a print, the wall or the softboxes
  vec3 refl = vec3(0.0);
  float far = 0.0;
  for (int k = 0; k < 6; k++) {
    float a = 6.2832 * fract(seed + float(k) * 0.618034);
    float r = sqrt((float(k) + 0.5) / 6.0);
    vec3 nn = normalize(n + vec3(cos(a), 0.0, sin(a)) * r * rough);
    vec3 R = reflect(rd, nn);
    float best = 1e9; int bi = -1; vec2 bab = vec2(0.0); float t; vec2 ab;
    for (int i = 0; i < NP; i++) if (hitPanel(i, P, R, t, ab) && t < best) { best = t; bi = i; bab = ab; }
    if (bi >= 0) {
      float lod = log2(1.0 + best * rough * 260.0);
      vec3 alb = textureLod(uTex, vec3(bab / HS * 0.5 + 0.5, uPl[bi]), lod).rgb;
      refl += alb * faceLight(bi, P + R * best);
      far += best;
    } else { refl += wallCol(P, R, 1.0 + rough * 60.0); far += (ZW - P.z) / min(R.z, -0.05); }
  }
  refl /= 6.0;
  far /= 6.0;

  // light on the floor itself: the key with soft shadows, plus colour bounced off the nearest prints
  vec3 l; vec3 key = keyAt(P, l);
  vec3 dif = key * max(l.y, 0.0) * keyVis(P + vec3(0.0, 0.002, 0.0), -1, seed);
  float ao = 1.0;
  for (int i = 0; i < NP; i++) {
    vec3 np = cross(uPu[i], uPv[i]);
    vec3 q = uPc[i] - uPv[i] * (HS.y * 0.45);
    vec3 d = P - q; float r2 = dot(d, d); vec3 dn = d * inversesqrt(r2);
    float ff = abs(dot(np, dn)) * max(-dn.y, 0.0) / (0.35 + r2);
    vec3 bounce = textureLod(uTex, vec3(0.5, 0.3, uPl[i]), 7.0).rgb;
    dif += bounce * faceLight(i, q) * ff * (dot(np, dn) > 0.0 ? 1.5 : 0.25);
    vec3 b0 = uPc[i] - uPv[i] * HS.y;
    float h = clamp(dot(P - b0, uPu[i]), -HS.x, HS.x);
    float dl = length(P - (b0 + uPu[i] * h));
    ao *= 1.0 - 0.8 * exp(-dl / 0.05);
  }
  vec3 alb = mix(vec3(0.07, 0.05, 0.05), vec3(0.5, 0.33, 0.14), rail);
  float F0 = mix(0.11, 0.75, rail);
  float F = F0 + (1.0 - F0) * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 col = alb * dif * ao * (1.0 - F) + refl * mix(vec3(1.0), vec3(1.0, 0.78, 0.42), rail) * F * (0.55 + 0.45 * ao);
  // a mirror image focuses at the distance of the thing mirrored, not of the glass
  float mirror = clamp(F * 2.2, 0.0, 1.0) * (1.0 - smoothstep(0.02, 0.07, rough));
  o = pack(col, dot(rd, uFw) * (tf + far * mirror));
}`;

const VS_PRINT = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNor;
uniform vec3 uC, uU, uV, uCam, uRt, uUp, uFw;
uniform float uTan, uAspect;
out vec3 vW; out vec3 vL; out vec3 vN;
void main() {
  vec3 n = cross(uU, uV);
  vW = uC + uU * aPos.x + uV * aPos.y + n * aPos.z;
  vL = aPos; vN = aNor;
  vec3 d = vW - uCam;
  float z = dot(d, uFw);
  gl_Position = vec4(dot(d, uRt) / (uTan * uAspect), dot(d, uUp) / uTan, (z * 60.1 - 12.0) / 59.9, z);
}`;

const FS_PRINT = `${GLSL_HEAD}
uniform vec3 uC, uU, uV;
uniform int uIdx;
in vec3 vW; in vec3 vL; in vec3 vN;
out vec4 o;
void main() {
  vec3 pn = cross(uU, uV);
  vec3 N = normalize(uU * vN.x + uV * vN.y + pn * vN.z);
  vec3 V = normalize(uCam - vW);
  float seed = ign(gl_FragCoord.xy);
  vec3 l; vec3 key = keyAt(vW, l);
  float vis = keyVis(vW + N * 0.004, uIdx, seed);
  float gain = uPk[uIdx];
  vec3 col;
  if (vN.z > 0.5) {
    // the photograph under a gloss laminate
    vec2 uv = vL.xy / HS * 0.5 + 0.5;
    vec3 alb = texture(uTex, vec3(uv, uPl[uIdx])).rgb;
    alb = pow(alb, vec3(1.06)) * 1.04;
    float foot = smoothstep(0.0, 0.5, vW.y);
    col = alb * (key * max(dot(N, l), 0.0) * (0.25 + 0.75 * vis) + vec3(0.07, 0.06, 0.06)) * (0.84 + 0.16 * foot);
    float F = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec3 wob = vec3(vnoise(vL.xy * 5.0), vnoise(vL.xy * 5.0 + 9.0), 0.0) - 0.5;
    col += studio(vW, reflect(-V, normalize(N + (uU * wob.x + uV * wob.y) * 0.02))) * F;
    float e = min(HS.x - abs(vL.x), HS.y - abs(vL.y));
    col += vec3(1.0, 0.96, 0.9) * smoothstep(0.006, 0.0, e) * (0.1 + 0.5 * max(dot(N, l), 0.0)) * key * 0.22;
  } else if (vN.z < -0.5) {
    col = vec3(0.02, 0.018, 0.018) * (key * max(dot(N, l), 0.0) * vis + 0.3);
  } else {
    // the edge: a milled aluminium core that catches the softboxes
    float brush = 0.8 + 0.4 * vnoise(vec2(vL.z * 900.0, (vL.x + vL.y) * 6.0));
    vec3 R = reflect(-V, N);
    col = vec3(0.78, 0.76, 0.74) * brush * (studio(vW, R) * 0.6 + wallCol(vW, R, 4.0) * 0.5 + key * max(dot(N, l), 0.0) * vis * 0.16 + 0.03);
  }
  o = pack(col * gain, dot(vW - uCam, uFw));
}`;

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
  float coc0 = abs(c0.a * 2.0 - 1.0);
  vec3 lin0 = pow(c0.rgb, vec3(2.2));
  float w0 = 1.0 / (1.03 - max(lin0.r, max(lin0.g, lin0.b)));
  vec3 acc = lin0 * w0; float wsum = w0; float spread = coc0;
  float rot = 6.2832 * ign(gl_FragCoord.xy);
  // 40 taps over the whole blur disc, then 14 more packed into the middle so slightly soft edges stay clean
  for (int k = 1; k < 54; k++) {
    float r = k < 40 ? sqrt(float(k) / 40.0) * uMaxR : sqrt(float(k - 39) / 14.0) * min(uMaxR, 3.2);
    float a = float(k) * 2.39996 + rot;
    vec4 s = texture(uScene, vUv + vec2(cos(a), sin(a)) * r * uPx);
    float sc = s.a * 2.0 - 1.0;
    float cs = abs(sc);
    if (sc > c0.a * 2.0 - 1.0) cs = min(cs, coc0 * 1.6 + 0.02);
    vec3 lin = pow(s.rgb, vec3(2.2));
    float w = smoothstep(r - 1.0, r + 1.0, cs * uMaxR) / (1.03 - max(lin.r, max(lin.g, lin.b)));
    acc += lin * w; wsum += w; spread = max(spread, cs * step(0.5, w * 0.03 + smoothstep(r - 1.0, r + 1.0, cs * uMaxR)));
  }
  o = vec4(pow(acc / wsum, vec3(1.0 / 2.2)), spread);
}`;

const FS_PRINTOUT = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uPx;
uniform float uTime;
in vec2 vUv;
out vec4 o;
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  // tidy the blur where the lens pass was sparse, then vignette and film grain
  vec4 c = texture(uScene, vUv);
  float r = clamp(c.a * 4.0, 0.0, 1.0) * 1.5;
  vec3 col = c.rgb * 4.0;
  for (int k = 0; k < 8; k++) {
    float a = float(k) * 0.7854;
    col += texture(uScene, vUv + vec2(cos(a), sin(a)) * r * (k % 2 == 0 ? 1.0 : 1.9) * uPx).rgb;
  }
  col /= 12.0;
  vec2 q = vUv - 0.5;
  col *= 1.0 - 0.9 * dot(q, q);
  col += (ign(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.026;
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

/** A thin box: 36 vertices of position + normal, in print-local units. */
function boxMesh() {
  const T = 0.016;
  const faces: [number[], number[], number[]][] = [
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
    [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
    [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
    [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
    [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  ];
  const half = [HX, HY, T];
  const out: number[] = [];
  for (const [n, a, b] of faces) {
    for (const [s, t] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) {
      for (let c = 0; c < 3; c++) out.push((n[c] + a[c] * s + b[c] * t) * half[c]);
      out.push(n[0], n[1], n[2]);
    }
  }
  return new Float32Array(out);
}

/** Crop a photo to the print's shape around its focus point. */
function coverDraw(ctx: CanvasRenderingContext2D, img: HTMLImageElement, focus: number[]) {
  const s = Math.max(TEX_W / img.naturalWidth, TEX_H / img.naturalHeight);
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  ctx.drawImage(img, clamp(TEX_W / 2 - focus[0] * w, TEX_W - w, 0), clamp(TEX_H / 2 - focus[1] * h, TEX_H - h, 0), w, h);
}

type Sim = {
  pos: number; vel: number; goal: number; acc: number; accF: number;
  rock: Float32Array; rockV: Float32Array; hist: Float32Array; histAt: number;
  dragging: boolean; lastX: number; lastT: number; paused: boolean; nextAuto: number;
  px: number; py: number; cx: number; cy: number; pull: number; focus: number; active: number; dirty: boolean;
};

export default function StandingPrintCarousel() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<"pending" | "gl" | "still">("pending");
  const sim = useRef<Sim>({
    pos: 0, vel: 0, goal: 0, acc: 0, accF: 0,
    rock: new Float32Array(N), rockV: new Float32Array(N), hist: new Float32Array(64), histAt: 0,
    dragging: false, lastX: 0, lastT: 0, paused: false, nextAuto: 0,
    px: 0, py: 0, cx: 0, cy: 0, pull: 0, focus: 5, active: 0, dirty: true,
  });

  const step = useCallback((dir: number) => {
    const s = sim.current;
    s.goal = Math.round(s.goal) + dir;
    s.nextAuto = performance.now() + HOLD_MS * 2;
    s.dirty = true;
    if (mode === "still") setActive(mod(s.goal, N));
  }, [mode]);

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
    let progSet: WebGLProgram, progPrint: WebGLProgram, progLens: WebGLProgram, progOut: WebGLProgram;
    try {
      progSet = program(gl, VS_FULL, FS_SET);
      progPrint = program(gl, VS_PRINT, FS_PRINT);
      progLens = program(gl, VS_FULL, FS_LENS);
      progOut = program(gl, VS_FULL, FS_PRINTOUT);
    } catch {
      setMode("still");
      return;
    }
    setMode("gl");

    // the photographs, one layer each of an sRGB array texture so the light maths is linear
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, Math.floor(Math.log2(TEX_H)) + 1, gl.SRGB8_ALPHA8, TEX_W, TEX_H, N);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    const scratch = document.createElement("canvas");
    scratch.width = TEX_W;
    scratch.height = TEX_H;
    const sctx = scratch.getContext("2d")!;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const upload = (layer: number) => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, TEX_W, TEX_H, 1, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      s.dirty = true;
    };
    let alive = true;
    plates.forEach((p, i) => {
      const g = sctx.createLinearGradient(0, 0, 0, TEX_H);
      g.addColorStop(0, p.tone);
      g.addColorStop(1, "#150406");
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, TEX_W, TEX_H);
      upload(i);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (!alive) return;
        coverDraw(sctx, img, p.focus);
        upload(i);
      };
      img.src = p.src;
    });

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, boxMesh(), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    gl.bindVertexArray(null);
    const emptyVao = gl.createVertexArray();

    // multisampled scene target, resolved into a texture the lens pass reads (colour + blur size in alpha)
    const msFbo = gl.createFramebuffer();
    const msColor = gl.createRenderbuffer();
    const msDepth = gl.createRenderbuffer();
    const resFbo = gl.createFramebuffer();
    const resTex = gl.createTexture();
    const lensFbo = gl.createFramebuffer();
    const lensTex = gl.createTexture();
    let W = 0, H = 0, scale = Math.min(window.devicePixelRatio || 1, 1.5);
    const samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES));
    const resize = () => {
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      let k = scale;
      if (cw * ch * k * k > 1.5e6) k = Math.sqrt(1.5e6 / (cw * ch));
      const w = Math.max(2, Math.round(cw * k)), h = Math.max(2, Math.round(ch * k));
      if (w === W && h === H) return;
      W = w;
      H = h;
      canvas.width = W;
      canvas.height = H;
      gl.bindRenderbuffer(gl.RENDERBUFFER, msColor);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, W, H);
      gl.bindRenderbuffer(gl.RENDERBUFFER, msDepth);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT16, W, H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, msFbo);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, msColor);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, msDepth);
      for (const [unit, t, f] of [[gl.TEXTURE2, resTex, resFbo], [gl.TEXTURE3, lensTex, lensFbo]] as const) {
        gl.activeTexture(unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, f);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      }
      s.dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const pc = new Float32Array(21), pu = new Float32Array(21), pv = new Float32Array(21), pl = new Float32Array(7), pk = new Float32Array(7);
    const TAN = Math.tan((19 * Math.PI) / 180);

    const shared = (p: WebGLProgram, cam: number[], rt: number[], up: number[], fw: number[], t: number) => {
      gl.useProgram(p);
      gl.uniform3fv(U(p, "uPc"), pc);
      gl.uniform3fv(U(p, "uPu"), pu);
      gl.uniform3fv(U(p, "uPv"), pv);
      gl.uniform1fv(U(p, "uPl"), pl);
      gl.uniform1fv(U(p, "uPk"), pk);
      gl.uniform1i(U(p, "uTex"), 0);
      gl.uniform3fv(U(p, "uCam"), cam);
      gl.uniform3fv(U(p, "uRt"), rt);
      gl.uniform3fv(U(p, "uUp"), up);
      gl.uniform3fv(U(p, "uFw"), fw);
      gl.uniform1f(U(p, "uTan"), TAN);
      gl.uniform1f(U(p, "uAspect"), W / H);
      gl.uniform1f(U(p, "uFocus"), s.focus);
      gl.uniform1f(U(p, "uAperture"), 1.35);
      gl.uniform1f(U(p, "uTime"), t);
    };

    const draw = (t: number) => {
      // where every print stands this frame
      const base = Math.round(s.pos) - 3;
      let hero = 0;
      for (let i = 0; i < 7; i++) {
        const k = base + i;
        const u = k - s.pos;
        const layer = mod(k, N);
        const ang = u * STEP;
        const lift = 0.42 * Math.exp(-u * u * 2.2);
        if (Math.abs(u) <= 0.5) hero = lift;
        const bx = RING * Math.sin(ang), bz = -RING * (1 - Math.cos(ang)) + lift;
        const yaw = ang * 0.92;
        const ux = Math.cos(yaw), uz = -Math.sin(yaw);
        const th = s.rock[layer];
        const c = Math.cos(th), sn = Math.sin(th);
        // rotate in the print's own plane about whichever bottom corner is on the floor
        const rux = ux * c, ruy = -sn, ruz = uz * c;
        const rvx = ux * sn, rvy = c, rvz = uz * sn;
        const side = th >= 0 ? 1 : -1;
        const pxv = bx + ux * HX * side, pzv = bz + uz * HX * side;
        pc[i * 3] = pxv - rux * HX * side + rvx * HY;
        pc[i * 3 + 1] = -ruy * HX * side + rvy * HY + 0.0015;
        pc[i * 3 + 2] = pzv - ruz * HX * side + rvz * HY;
        pu.set([rux, ruy, ruz], i * 3);
        pv.set([rvx, rvy, rvz], i * 3);
        pl[i] = layer;
        pk[i] = clamp((3.4 - Math.abs(u)) / 0.9, 0, 1);
      }
      // camera: low, drifting a little, leaning with the pointer
      const aspect = W / H;
      const camZ = Math.max(3.78, 0.42 + 0.74 / (TAN * aspect)) + s.pull;
      const drift = reduce ? 0 : 1;
      const cam = [-0.46 + s.cx * 0.7 + drift * 0.12 * Math.sin(t * 0.31), 0.46 - s.cy * 0.16 + drift * 0.03 * Math.sin(t * 0.23 + 1), camZ];
      const tx = 0, ty = 0.71, tz = 0;
      let fw = [tx - cam[0], ty - cam[1], tz - cam[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]);
      fw = fw.map((v) => v / fl);
      let rt = [-fw[2], 0, fw[0]];
      const rl = Math.hypot(rt[0], rt[2]);
      rt = rt.map((v) => v / rl);
      const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      const want = (hero - cam[2]) * fw[2] + (0.75 - cam[1]) * fw[1] + (0 - cam[0]) * fw[0];
      s.focus = reduce ? want : s.focus + (want - s.focus) * 0.09;

      gl.bindFramebuffer(gl.FRAMEBUFFER, msFbo);
      gl.viewport(0, 0, W, H);
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      shared(progSet, cam, rt, up, fw, t);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      shared(progPrint, cam, rt, up, fw, t);
      gl.bindVertexArray(vao);
      for (let i = 0; i < 7; i++) {
        if (pk[i] <= 0) continue;
        gl.uniform3f(U(progPrint, "uC"), pc[i * 3], pc[i * 3 + 1], pc[i * 3 + 2]);
        gl.uniform3f(U(progPrint, "uU"), pu[i * 3], pu[i * 3 + 1], pu[i * 3 + 2]);
        gl.uniform3f(U(progPrint, "uV"), pv[i * 3], pv[i * 3 + 1], pv[i * 3 + 2]);
        gl.uniform1i(U(progPrint, "uIdx"), i);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
      }
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msFbo);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, resFbo);
      gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, lensFbo);
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(progLens);
      gl.uniform1i(U(progLens, "uScene"), 2);
      gl.uniform2f(U(progLens, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(progLens, "uMaxR"), H * 0.012);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(progOut);
      gl.uniform1i(U(progOut, "uScene"), 3);
      gl.uniform2f(U(progOut, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(progOut, "uTime"), reduce ? 0 : t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    /** One small step of the carriage and of every print rocking on its corners. */
    const physics = (dt: number) => {
      if (!s.dragging) {
        s.acc = SPRING * (s.goal - s.pos) - DAMPING * s.vel;
        s.vel += s.acc * dt;
        s.pos += s.vel * dt;
      } else s.acc *= Math.exp(-dt * 14);
      s.accF += (s.acc - s.accF) * Math.min(1, dt / 0.08);
      s.histAt = (s.histAt + 1) & 63;
      s.hist[s.histAt] = s.accF;
      for (let j = 0; j < N; j++) {
        // prints further from the middle hear about the shove a moment later, so the rocking travels outward
        let u = mod(j - s.pos + N / 2, N) - N / 2;
        u = Math.min(Math.abs(u), 3);
        const a = clamp(s.hist[(s.histAt - Math.round(u * 14) + 64) & 63] * ROCK_GAIN, -1.5, 1.5);
        let th = s.rock[j], om = s.rockV[j];
        if (th === 0 && om === 0) {
          if (Math.abs(a) > Math.tan(ALPHA)) om = -Math.sign(a) * 1e-4;
          else continue;
        }
        const sg = th > 0 || (th === 0 && om > 0) ? 1 : -1;
        const lean = ALPHA - sg * th;
        om += P2 * (-sg * Math.sin(lean) - a * Math.cos(lean)) * dt;
        om -= om * 0.25 * dt;
        let nx = th + om * dt;
        if (Math.abs(nx) > ALPHA * 0.34) {
          nx = Math.sign(nx) * ALPHA * 0.34;
          om *= -0.2;
        }
        if (th !== 0 && nx * th <= 0) {
          // the lifted corner lands: lose energy, and either pivot onto the other corner or stay down
          om *= 0.82;
          nx = 0;
          if (Math.abs(om) < 0.1 && Math.abs(a) < Math.tan(ALPHA)) om = 0;
        }
        s.rock[j] = nx;
        s.rockV[j] = om;
      }
    };

    let raf = 0, visible = true, last = performance.now(), slow = 0, frames = 0;
    s.nextAuto = last + HOLD_MS;
    const tick = (now: number) => {
      const real = now - last;
      const dt = Math.min(0.05, real / 1000);
      last = now;
      if (reduce) {
        if (s.pos !== s.goal) s.dirty = true;
        s.pos = s.goal;
        s.vel = 0;
      } else {
        const sub = Math.max(1, Math.ceil(dt / 0.004));
        for (let i = 0; i < sub; i++) physics(dt / sub);
        s.cx += (s.px - s.cx) * Math.min(1, dt * 3.2);
        s.cy += (s.py - s.cy) * Math.min(1, dt * 3.2);
        s.pull += (0.11 * Math.min(Math.abs(s.vel), 4) - s.pull) * Math.min(1, dt * 4);
        if (!s.paused && !s.dragging && !document.hidden && now > s.nextAuto) {
          s.goal = Math.round(s.goal) + 1;
          s.nextAuto = now + HOLD_MS;
        }
      }
      const a = mod(Math.round(s.pos), N);
      if (a !== s.active) {
        s.active = a;
        setActive(a);
      }
      if (!reduce || s.dirty) {
        draw(now / 1000);
        s.dirty = false;
        // measure, do not guess: if the machine cannot hold the frame rate, render fewer pixels
        if (!reduce && ++frames > 20) {
          slow = slow * 0.92 + (real > 24 ? 1 : 0) * 0.08;
          if (slow > 0.6 && scale > 0.5) {
            scale *= 0.85;
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

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      s.dragging = true;
      s.lastX = e.clientX;
      s.lastT = performance.now();
      s.vel = 0;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      s.px = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      s.py = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      if (!s.dragging) return;
      const now = performance.now();
      const dn = -(e.clientX - s.lastX) / (r.height * 0.46);
      const dt = Math.max(4, now - s.lastT) / 1000;
      const v = dn / dt;
      s.acc = clamp((v - s.vel) / dt, -60, 60);
      s.vel = s.vel * 0.5 + v * 0.5;
      s.pos += dn;
      s.lastX = e.clientX;
      s.lastT = now;
      s.dirty = true;
    };
    const up = () => {
      if (!s.dragging) return;
      s.dragging = false;
      s.vel = clamp(s.vel, -9, 9);
      s.goal = Math.round(s.pos + s.vel * 0.22);
      s.nextAuto = performance.now() + HOLD_MS * 2;
    };
    const leave = () => {
      s.px = 0;
      s.py = 0;
    };
    canvas.addEventListener("pointerdown", down);
    wrap.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    wrap.addEventListener("pointerleave", leave);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", down);
      wrap.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      wrap.removeEventListener("pointerleave", leave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduce]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      step(-1);
    }
  };
  const pause = (v: boolean) => () => {
    sim.current.paused = v;
    if (!v) sim.current.nextAuto = performance.now() + HOLD_MS;
  };
  const btn = "grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-sm transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

  return (
    <section className="relative overflow-hidden bg-[#0b0405]" onFocus={pause(true)} onBlur={pause(false)}>
      <div
        ref={wrapRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Seven fashion prints standing on a mirror floor. Use the left and right arrow keys to bring the next print forward."
        tabIndex={0}
        onKeyDown={onKey}
        className="relative h-[600px] w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 sm:h-[780px]"
      >
        <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full cursor-grab touch-pan-y active:cursor-grabbing ${mode === "still" ? "hidden" : ""}`} />

        {/* the same set built from plain images, for browsers without WebGL 2 */}
        {mode === "still" && (
          <div className="absolute inset-0 overflow-hidden" style={{ background: "radial-gradient(60% 46% at 50% 62%, #5a5050 0%, #2a2525 45%, #0b0a0a 100%)" }}>
            <style>{`@keyframes standing-print-carousel-drift { from { transform: translateX(-10px); } to { transform: translateX(10px); } } .standing-print-carousel-drift { animation: standing-print-carousel-drift 7s ease-in-out infinite alternate; } @media (prefers-reduced-motion: reduce) { .standing-print-carousel-drift { animation: none; } }`}</style>
            <div className="absolute inset-x-0 bottom-0 top-[76%]" style={{ background: "linear-gradient(180deg, #171313 0%, #0b0a0a 100%)" }} />
            <div className="standing-print-carousel-drift absolute left-1/2 top-[15%] h-[61%]" style={{ perspective: "1400px" }}>
              {[-2, -1, 1, 2, 0].map((u) => {
                const p = plates[mod(active + u, N)];
                const x = u * 88 - 50;
                const tf = `translateX(${x}%) translateZ(${-Math.abs(u) * 130}px) rotateY(${u * 20}deg)`;
                return (
                  <div key={mod(active + u, N)} className="absolute left-0 top-0 h-full transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ aspectRatio: "1060 / 1500", transform: tf, transformStyle: "preserve-3d", filter: u ? `blur(${Math.abs(u) * 2.5}px) brightness(${1 - Math.abs(u) * 0.28})` : undefined }}>
                    <img src={p.src} alt={u === 0 ? p.alt : ""} width={900} height={1274} className="h-full w-full object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.12)]" style={{ background: p.tone, objectPosition: `${p.focus[0] * 100}% ${p.focus[1] * 100}%` }} />
                    <div aria-hidden="true" className="absolute left-0 top-full h-full w-full" style={{ transform: "scaleY(-1)", backgroundImage: `url("${p.src}")`, backgroundSize: "cover", backgroundPosition: `${p.focus[0] * 100}% ${p.focus[1] * 100}%`, backgroundColor: p.tone, opacity: 0.42, filter: "blur(3px)", maskImage: "linear-gradient(0deg, rgba(0,0,0,0.9), rgba(0,0,0,0) 62%)", WebkitMaskImage: "linear-gradient(0deg, rgba(0,0,0,0.9), rgba(0,0,0,0) 62%)" }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-baseline justify-between p-5 text-white sm:p-9">
          <p className="text-[26px] italic leading-none sm:text-[30px]" style={{ fontFamily: SERIF, letterSpacing: "-0.03em" }}>
            {MASTHEAD}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/60 sm:text-[11px]" style={{ fontFamily: GROTESK }}>
            Drag<span className="hidden sm:inline">, or use the arrow keys</span>
          </p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-9">
          <p aria-live="polite" className="text-white">
            <span className="block text-[11px] font-medium uppercase tracking-[0.28em] text-white/70" style={{ fontFamily: GROTESK }}>
              <span className="tabular-nums text-white">{String(active + 1).padStart(2, "0")}</span>
              <span className="mx-2 text-white/40">/</span>
              <span className="tabular-nums">{String(N).padStart(2, "0")}</span>
              <span className="ml-4 hidden sm:inline">Autumn portfolio</span>
            </span>
            <span className="mt-2 block text-[38px] italic leading-[0.92] sm:text-[76px]" style={{ fontFamily: SERIF, letterSpacing: "-0.035em" }}>
              {plates[active].title}
            </span>
            <span className="sr-only">. {plates[active].alt}</span>
          </p>
          <div className="pointer-events-auto flex gap-2">
            <button type="button" onClick={() => step(-1)} aria-label="Previous print" className={btn}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next print" className={btn}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 4l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
