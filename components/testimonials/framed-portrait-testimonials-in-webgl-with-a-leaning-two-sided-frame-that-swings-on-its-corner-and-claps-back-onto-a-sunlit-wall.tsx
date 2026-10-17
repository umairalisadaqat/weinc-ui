import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The speakers, in order. `focus` is the crop centre of the photo (0 to 1), `tone` shows until the photo arrives. */
const voices = [
  {
    quote: "My regulars found the new shop before I had finished my coffee.",
    name: "Rosalía Méndez",
    role: "Owner, Casa Méndez Bakery",
    src: "https://images.pexels.com/photos/15672675/pexels-photo-15672675.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Older woman with silver hair and round glasses resting her chin on her folded hands in front of a bright yellow wall",
    focus: [0.5, 0.52],
    tone: "#e2b10c",
  },
  {
    quote: "They asked what we wanted to stop doing. Nobody had asked us that.",
    name: "Kwabena Asante",
    role: "Founder, Ridgeline Roasters",
    src: "https://images.pexels.com/photos/15689960/pexels-photo-15689960.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Man in a white striped shirt leaning toward the camera against a deep red backdrop",
    focus: [0.5, 0.4],
    tone: "#b3301c",
  },
  {
    quote: "We briefed them on a napkin. They built exactly the napkin.",
    name: "Amara Diallo",
    role: "Studio director, Fold and Thread",
    src: "https://images.pexels.com/photos/33276169/pexels-photo-33276169.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Woman in a white vest looking over her shoulder with one hand raised, against a teal backdrop",
    focus: [0.55, 0.42],
    tone: "#4f8f88",
  },
  {
    quote: "Launch day was quiet. I have never been so glad to be bored.",
    name: "Theo Marlowe",
    role: "Head of product, Pinewater",
    src: "https://images.pexels.com/photos/8801041/pexels-photo-8801041.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Smiling man with short curly hair in a pale pink T-shirt against a dusty pink backdrop",
    focus: [0.5, 0.42],
    tone: "#c98f9a",
  },
];

/** Where the sun sits for each speaker: direction toward it, colour, strength, how much leaf shade, and where the window light lands. */
const suns = [
  { dir: [0.5, 0.56, 0.66], col: [1.0, 0.92, 0.8], power: 1.0, leaf: 0.6, aim: [0.5, 1.02] },
  { dir: [0.78, 0.36, 0.52], col: [1.0, 0.8, 0.58], power: 1.12, leaf: 0.95, aim: [0.3, 0.7] },
  { dir: [0.3, 0.78, 0.55], col: [1.0, 0.96, 0.88], power: 0.96, leaf: 0.0, aim: [0.62, 0.86] },
  { dir: [0.66, 0.5, 0.56], col: [1.0, 0.86, 0.7], power: 1.06, leaf: 0.7, aim: [0.4, 1.12] },
];

const N = voices.length;
const MASTHEAD = "Oriel"; // the wordmark in the top corner
const KICKER = "In their words"; // small label above the quote
const HOLD_MS = 5600; // rest between automatic turns
const SWING = 10; // pull of the frame toward its new side
const SWING_DRAG = 4.2; // lower lets the frame arrive faster and clap harder
const BOUNCE = 0.36; // how much speed survives each knock against the wall
const SERIF = '"New York", ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const INK = "#3d0f0b";

// The frame, in metres. It stands on the floor and leans back until its top edge meets the wall.
const FW = 1.0;
const FH = 1.32;
const FD = 0.026; // half its thickness
const FM = 0.055; // width of the moulding
const ZG = 0.015; // the glass sits this far from the middle of the frame
const LEAN = 0.16; // resting lean, in radians
const Z0 = FH * Math.sin(LEAN) + FD * Math.cos(LEAN);
const CAM_Z = 5.6;
const TEX_W = 728;
const TEX_H = 984;

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const f = (v: number) => v.toFixed(4);

const VS = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNor;
layout(location = 2) in vec2 aUv;
layout(location = 3) in float aMat;
uniform vec3 uC, uU, uV, uN, uCam, uRt, uUp, uFw;
uniform float uTan, uAspect;
out vec3 vW; out vec3 vL; out vec3 vNor; out vec2 vUv; out float vMat;
void main() {
  bool fr = aMat > 2.5;
  vW = fr ? uC + uU * aPos.x + uV * aPos.y + uN * aPos.z : aPos;
  vNor = fr ? uU * aNor.x + uV * aNor.y + uN * aNor.z : aNor;
  vL = aPos; vUv = aUv; vMat = aMat;
  vec3 d = vW - uCam;
  float z = dot(d, uFw);
  gl_Position = vec4(dot(d, uRt) / (uTan * uAspect), dot(d, uUp) / uTan, (z * 60.2 - 24.0) / 59.8, z);
}`;

const FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;
const vec3 BC = vec3(${f(FW / 2)}, ${f(FH / 2)}, 0.0);
const vec3 BH = vec3(${f(FW / 2)}, ${f(FH / 2)}, ${f(FD)});
const float M = ${f(FM)};
const vec3 WALLC = vec3(0.84, 0.34, 0.14);
const vec3 AMB = vec3(0.5, 0.49, 0.53);
const vec3 TILE = vec3(0.42, 0.13, 0.065);
const vec3 WOOD = vec3(0.085, 0.034, 0.014);
uniform vec3 uC, uU, uV, uN, uCam, uFw;
uniform vec3 uL, uLu, uLv, uLT, uSun;
uniform float uLeaf, uTime, uFocus, uAperture;
uniform float uLayer[2];
uniform sampler2DArray uTex;
in vec3 vW; in vec3 vL; in vec3 vNor; in vec2 vUv; in float vMat;
out vec4 o;

float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.1 + 7.3) + 0.125 * vnoise(p * 4.3 + 1.7) + 0.0625 * vnoise(p * 8.9); }
float sbox(vec2 p, vec2 h, float s) { vec2 d = smoothstep(h + s, h - s, abs(p)); return d.x * d.y; }
float sdRect(vec2 p, vec2 h) { vec2 q = abs(p) - h; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }

vec3 toLocal(vec3 p) { vec3 d = p - uC; return vec3(dot(d, uU), dot(d, uV), dot(d, uN)); }
vec3 dirLocal(vec3 v) { return vec3(dot(v, uU), dot(v, uV), dot(v, uN)); }
float sdFrame(vec3 l) { vec3 q = abs(l - BC) - BH; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }

// Does a ray meet the frame? Returns the distance, and the local point it lands on.
float hitFrame(vec3 ro, vec3 rd, out vec3 lp, out vec3 ln) {
  vec3 o = toLocal(ro) - BC, d = dirLocal(rd);
  vec3 inv = 1.0 / (d + vec3(1e-6));
  vec3 t1 = (-BH - o) * inv, t2 = (BH - o) * inv;
  vec3 tn = min(t1, t2), tf = max(t1, t2);
  float a = max(tn.x, max(tn.y, tn.z)), b = min(tf.x, min(tf.y, tf.z));
  if (a > b || a < 1e-3) return -1.0;
  lp = o + d * a + BC;
  ln = tn.x > tn.y && tn.x > tn.z ? vec3(-sign(d.x), 0, 0) : tn.y > tn.z ? vec3(0, -sign(d.y), 0) : vec3(0, 0, -sign(d.z));
  return a;
}

// Soft shadow of the frame, walked toward the sun through its distance field.
float frameShadow(vec3 P, int steps) {
  vec3 o = toLocal(P), d = dirLocal(uL);
  float res = 1.0, t = 0.015;
  for (int i = 0; i < steps; i++) {
    float h = sdFrame(o + d * t);
    res = min(res, 11.0 * h / t);
    if (res < 0.003 || t > 3.5) break;
    t += clamp(h, 0.012, 0.5);
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}

// Shade from a branch outside: pointed leaves scattered in clumps, one per cell of a grid.
float leaves(vec2 q, float salt) {
  vec2 id = floor(q);
  float sh = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = id + vec2(float(i), float(j));
    float h = hash(c + salt);
    if (h + 0.75 * vnoise(c * 0.33 + salt) < 0.86) continue;
    vec2 ctr = c + 0.5 + (vec2(hash(c + salt + 1.3), hash(c + salt + 2.9)) - 0.5) * 0.9;
    float a = 2.2 + (hash(c + salt + 4.1) - 0.5) * 2.4;
    vec2 d = q - ctr;
    d = vec2(d.x * cos(a) + d.y * sin(a), -d.x * sin(a) + d.y * cos(a));
    float size = 0.42 + 0.3 * h;
    float r = length(vec2(d.x, d.y * 2.5)) / size + abs(d.x) / size * 0.35;
    sh = max(sh, smoothstep(1.0, 0.72, r));
  }
  return sh;
}

// The window the sun comes through: panes, glazing bars and a branch outside.
float gobo(vec3 P, bool fine) {
  vec3 d = P - uLT;
  vec2 g = vec2(dot(d, uLu), dot(d, uLv));
  float w = sbox(g, vec2(1.7, 1.12), 0.06);
  float bars = (1.0 - 0.9 * smoothstep(0.034, 0.012, abs(abs(g.x) - 0.57))) * (1.0 - 0.9 * smoothstep(0.034, 0.012, abs(g.y - 0.64)));
  vec2 sway = 0.035 * vec2(sin(uTime * 0.7 + g.y * 2.6), cos(uTime * 0.53 + g.x * 2.1));
  float leaf = fine ? 1.0 - 0.92 * max(leaves(g * 3.1 + sway * 2.0, 0.0), leaves(g * 4.6 - sway * 3.0 + 5.0, 7.0)) : 0.45 + 0.55 * smoothstep(0.35, 0.65, vnoise(g * 5.0 + 3.0));
  float where = smoothstep(-0.5, 0.9, g.y * 0.9 - g.x * 0.5);
  return w * bars * mix(1.0, leaf, uLeaf * where);
}

// What polished things see when they look back into the room.
vec3 room(vec3 rd, float soft) {
  vec3 c = mix(vec3(0.34, 0.2, 0.13), vec3(0.95, 0.9, 0.84), smoothstep(-0.05, 0.55, rd.y));
  if (rd.y < 0.0) c = mix(c, TILE * 0.8, smoothstep(0.0, -0.12, rd.y));
  float fwd = dot(rd, uL);
  if (fwd > 0.0) {
    vec2 a = vec2(dot(rd, uLu), dot(rd, uLv)) / fwd;
    float win = sbox(a, vec2(0.3, 0.42), mix(0.012, 0.22, soft));
    win *= 1.0 - smoothstep(0.016, 0.006, abs(a.x)) * 0.9 * (1.0 - soft);
    win *= 1.0 - smoothstep(0.016, 0.006, abs(a.y - 0.2)) * 0.9 * (1.0 - soft);
    c += uSun * 9.0 * win * (1.0 - 0.8 * soft);
  }
  // a pale ceiling panel whose slanted edge shows as the sheen on the glass
  float pan = smoothstep(0.3, 0.325, rd.y + rd.x * 0.5 * sign(uL.x)) * smoothstep(0.8, 0.45, rd.y) * step(0.0, rd.z);
  c += vec3(1.0, 0.95, 0.88) * 1.7 * pan;
  return c;
}

vec3 wallLight(vec3 P, vec3 n, bool fine) {
  float sh = frameShadow(P, fine ? 22 : 9);
  float near = sdFrame(toLocal(P));
  float ao = (1.0 - 0.32 * exp(-P.y / 0.16)) * mix(0.5, 1.0, smoothstep(0.0, 0.2, near));
  vec3 bounce = TILE * uSun * max(uL.y, 0.0) * 1.3 * exp(-P.y / 0.55);
  return uSun * max(dot(n, uL), 0.0) * gobo(P, fine) * sh + AMB * ao + bounce;
}
vec3 wallCol(vec3 P, bool fine) {
  float cloud = fbm(P.xy * 1.15 + 4.0);
  vec3 alb = WALLC * (0.86 + 0.26 * cloud);
  vec3 n = vec3(0, 0, 1);
  if (fine) {
    // trowel marks: a height field, tilted into a normal so raking sun picks it out
    vec2 q = P.xy * vec2(7.0, 5.0);
    float e = 0.02;
    float h0 = fbm(q) + 0.35 * fbm(q * 5.0), hx = fbm(q + vec2(e, 0)) + 0.35 * fbm(q * 5.0 + vec2(e * 5.0, 0)), hy = fbm(q + vec2(0, e)) + 0.35 * fbm(q * 5.0 + vec2(0, e * 5.0));
    n = normalize(vec3(-(hx - h0) / e * 0.028, -(hy - h0) / e * 0.028, 1.0));
    alb *= 0.95 + 0.1 * h0;
  }
  return alb * wallLight(P, n, fine);
}

// The picture side of the frame: glass over a bevelled mount over the print.
vec3 faceCol(vec3 l, vec3 P, vec3 Nw, float flip, int idx, vec3 V, bool fine) {
  vec2 p = vec2(flip > 0.0 ? l.x : ${f(FW)} - l.x, l.y);
  vec2 uv = (p - M) / (vec2(${f(FW)}, ${f(FH)}) - 2.0 * M);
  vec3 alb = textureLod(uTex, vec3(uv, uLayer[idx]), fine ? 0.0 : 2.5).rgb;
  vec3 Ll = vec3(dot(uL, uU) * flip, dot(uL, uV), dot(uL, Nw));
  float ndl = max(Ll.z, 0.0);
  vec2 off = Ll.xy / max(Ll.z, 0.3);
  vec2 pc = vec2(${f(FW / 2)}, 0.675), ph = vec2(0.35, 0.495);
  float dWin = sdRect(p - pc, ph);
  float lip = 1.0 - smoothstep(-0.007, 0.001, sdRect(p + off * 0.009 - BC.xy, BH.xy - M));
  float edge = -sdRect(p - BC.xy, BH.xy - M);
  float ao = 1.0 - 0.3 * exp(-edge / 0.012);
  float lit = ndl * lip;
  float aa = max(fwidth(dWin), 1e-4);
  float inPrint = 1.0 - smoothstep(-aa, 0.0, dWin);
  float onBevel = smoothstep(-aa, 0.0, dWin) * (1.0 - smoothstep(0.005 - aa, 0.005, dWin));
  float printLit = lit * (1.0 - smoothstep(-0.0035, 0.0005, sdRect(p + off * 0.003 - pc, ph)));
  float printAo = ao * (1.0 - 0.25 * exp(min(dWin, 0.0) / 0.004));
  // the cut edge of the mount, at forty-five degrees, showing its white core
  vec2 q = abs(p - pc) - ph;
  vec2 g = q.x > q.y ? vec2(sign(p.x - pc.x), 0.0) : vec2(0.0, sign(p.y - pc.y));
  float bevLit = max(dot(normalize(vec3(-g * 0.72, 0.7)), Ll), 0.0) * lip;
  vec3 matAlb = alb * (0.965 + 0.06 * vnoise(p * 1400.0));
  alb = mix(mix(matAlb, vec3(0.96, 0.95, 0.91), onBevel), pow(alb, vec3(1.04)), inPrint);
  lit = mix(mix(lit, bevLit, onBevel), printLit, inPrint);
  ao = mix(ao, printAo, inPrint);
  vec3 col = alb * (uSun * lit * gobo(P, fine) + AMB * ao + vec3(0.05, 0.03, 0.02));
  if (!fine) return col;
  float F = 0.045 + 0.955 * pow(1.0 - max(dot(Nw, V), 0.0), 5.0);
  vec3 R = reflect(-V, Nw);
  vec3 seen = R.z < -0.05 ? WALLC * (AMB + uSun * 0.5) : room(R, 0.0);
  // faint wipe marks on the glass, only visible where it mirrors something bright
  float wipe = 0.78 + 0.44 * fbm(p * vec2(5.0, 2.2) + 11.0);
  return col * (1.0 - F) * 0.985 + seen * F * wipe;
}

vec3 woodCol(vec2 uv, vec3 P, vec3 Nw, vec3 V) {
  float fig = fbm(vec2(uv.x * 2.2, uv.y * 70.0 + 3.0 * vnoise(uv * vec2(1.5, 9.0))));
  float pore = vnoise(vec2(uv.x * 38.0, uv.y * 420.0));
  vec3 alb = mix(WOOD, WOOD * vec3(1.25, 0.9, 0.7), vnoise(uv * vec2(0.9, 30.0))) * (0.4 + 1.25 * fig) * (0.8 + 0.4 * pore);
  // the mitre: a hairline where two lengths of moulding meet at each corner
  vec2 lc = min(vL.xy, vec2(${f(FW)}, ${f(FH)}) - vL.xy);
  alb *= 1.0 - 0.6 * smoothstep(0.0016, 0.0004, abs(lc.x - lc.y)) * step(abs(vL.z), ${f(FD)} + 0.01);
  float g = gobo(P, true);
  float ao = 0.55 + 0.45 * smoothstep(0.0, 0.12, P.y);
  vec3 col = alb * (uSun * max(dot(Nw, uL), 0.0) * g + AMB * ao);
  float F = 0.05 + 0.95 * pow(1.0 - max(dot(Nw, V), 0.0), 5.0);
  vec3 R = reflect(-V, Nw);
  col += (R.z < -0.1 ? WALLC * 0.7 : room(R, 1.0)) * F * 0.75;
  col += uSun * g * pow(max(dot(Nw, normalize(uL + V)), 0.0), 60.0) * 0.5 * (0.75 + 0.25 * fig);
  return col;
}

vec3 tonemap(vec3 x) { x *= 0.8; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec4 pack(vec3 col, float depth) {
  float coc = clamp(uAperture * (1.0 - uFocus / max(depth, 0.05)), -1.0, 1.0);
  return vec4(pow(tonemap(col), vec3(1.0 / 2.2)), 0.5 + 0.5 * coc);
}

void main() {
  vec3 V = normalize(uCam - vW);
  float depth = dot(vW - uCam, uFw);
  vec3 col;
  if (vMat < 0.5) {
    col = wallCol(vW, true);
  } else if (vMat < 1.5) {
    // waxed terracotta tiles, each one laid a hair out of level
    vec2 tc = vW.xz / 0.3 + vec2(0.5, 0.18);
    vec2 id = floor(tc), fr = fract(tc);
    float e = min(min(fr.x, 1.0 - fr.x), min(fr.y, 1.0 - fr.y)) * 0.3;
    float px = max(fwidth(tc.x), fwidth(tc.y)) * 0.3;
    float grout = smoothstep(0.0045 + px, 0.0025, e) / (1.0 + px * 60.0);
    float tone = hash(id);
    float blot = fbm(vW.xz * 7.0 + id * 3.0);
    vec3 alb = TILE * (0.72 + 0.5 * tone) * (0.8 + 0.4 * blot);
    alb = mix(alb, vec3(0.34, 0.22, 0.16), grout);
    vec3 n = normalize(vec3((hash(id + 3.7) - 0.5) * 0.016, 1.0, (hash(id + 9.1) - 0.5) * 0.016));
    float rough = mix(0.012 + 0.05 * blot * blot, 0.5, grout);
    float seed = ign(gl_FragCoord.xy);
    vec3 refl = vec3(0.0);
    float far = 0.0;
    for (int k = 0; k < 5; k++) {
      float a = 6.2832 * fract(seed + float(k) * 0.618034);
      float r = sqrt((float(k) + 0.5) / 5.0);
      vec3 R = reflect(-V, normalize(n + vec3(cos(a), 0.0, sin(a)) * r * rough));
      vec3 lp, ln;
      float t = hitFrame(vW, R, lp, ln);
      if (t > 0.0) {
        vec3 Nw = uU * ln.x + uV * ln.y + uN * ln.z;
        vec3 Ph = vW + R * t;
        bool open = abs(ln.z) > 0.5 && sdRect(lp.xy - BC.xy, BH.xy - M) < 0.0;
        refl += open ? faceCol(lp, Ph, Nw, ln.z, ln.z > 0.0 ? 0 : 1, -R, false) : WOOD * (uSun * max(dot(Nw, uL), 0.0) + AMB);
        far += t;
      } else if (R.z < -1e-3) {
        float tw = -vW.z / R.z;
        refl += wallCol(vW + R * tw, false);
        far += tw;
      } else { refl += room(R, 0.3); far += 6.0; }
    }
    refl /= 5.0; far /= 5.0;
    float near = sdFrame(toLocal(vW));
    float ao = (1.0 - 0.45 * exp(-vW.z / 0.1)) * mix(0.35, 1.0, smoothstep(0.0, 0.14, near));
    vec3 dif = uSun * max(dot(n, uL), 0.0) * gobo(vW, true) * frameShadow(vW, 22) + AMB * ao;
    float F = 0.05 + 0.95 * pow(1.0 - clamp(dot(V, n), 0.0, 1.0), 5.0);
    F *= 1.0 - grout;
    col = alb * dif * (1.0 - F) + refl * F * (0.5 + 0.5 * ao);
    depth += far * clamp(F * 2.0, 0.0, 1.0) * (1.0 - smoothstep(0.02, 0.08, rough));
  } else if (vMat < 2.5) {
    // skirting board, painted the wall colour in a harder gloss
    vec3 n = normalize(vNor);
    float ao = 0.55 + 0.45 * smoothstep(0.0, 0.07, vW.y);
    col = WALLC * 0.93 * (uSun * max(dot(n, uL), 0.0) * gobo(vW, true) * frameShadow(vW, 16) + AMB * ao + TILE * uSun * 0.5);
    float F = 0.04 + 0.96 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
    col += room(reflect(-V, n), 1.0) * F * 0.25;
  } else if (vMat < 3.5) {
    col = woodCol(vUv, vW, normalize(vNor), V);
  } else {
    float flip = vMat < 4.5 ? 1.0 : -1.0;
    col = faceCol(vL, vW, normalize(vNor), flip, vMat < 4.5 ? 0 : 1, V, true);
  }
  o = pack(col, depth);
}`;

const VS_FULL = `#version 300 es
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
  float coc0 = abs(c0.a * 2.0 - 1.0);
  vec3 lin0 = pow(c0.rgb, vec3(2.2));
  vec3 acc = lin0; float wsum = 1.0; float spread = coc0;
  float rot = 6.2832 * ign(gl_FragCoord.xy);
  for (int k = 1; k < 44; k++) {
    float r = k < 32 ? sqrt(float(k) / 32.0) * uMaxR : sqrt(float(k - 31) / 12.0) * min(uMaxR, 3.0);
    float a = float(k) * 2.39996 + rot;
    vec4 s = texture(uScene, vUv + vec2(cos(a), sin(a)) * r * uPx);
    float sc = s.a * 2.0 - 1.0;
    float cs = abs(sc);
    if (sc > c0.a * 2.0 - 1.0) cs = min(cs, coc0 * 1.6 + 0.02);
    float w = smoothstep(r - 1.0, r + 1.0, cs * uMaxR);
    acc += pow(s.rgb, vec3(2.2)) * w; wsum += w; spread = max(spread, cs * step(0.5, w));
  }
  o = vec4(pow(acc / wsum, vec3(1.0 / 2.2)), spread);
}`;

const FS_OUT = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uPx;
uniform float uTime;
in vec2 vUv;
out vec4 o;
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  vec4 c = texture(uScene, vUv);
  float r = clamp(c.a * 4.0, 0.0, 1.0) * 1.5;
  vec3 col = c.rgb * 4.0;
  for (int k = 0; k < 8; k++) {
    float a = float(k) * 0.7854;
    col += texture(uScene, vUv + vec2(cos(a), sin(a)) * r * (k % 2 == 0 ? 1.0 : 1.9) * uPx).rgb;
  }
  col /= 12.0;
  vec2 q = vUv - 0.5;
  col *= 1.0 - 0.42 * dot(q, q);
  col += (ign(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.022;
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

/** Wall, floor, skirting, then the frame: a mitred moulding swept from a rounded profile, and a pane on each side. */
function sceneMesh() {
  const out: number[] = [];
  const quad = (p: number[][], n: number[][], uv: number[][], mat: number) => {
    for (const i of [0, 1, 2, 0, 2, 3]) out.push(...p[i], ...n[i], ...uv[i], mat);
  };
  const flat = (p: number[][], n: number[], mat: number) => quad(p, [n, n, n, n], [[0, 0], [0, 0], [0, 0], [0, 0]], mat);
  flat([[-40, 0, 0], [40, 0, 0], [40, 14, 0], [-40, 14, 0]], [0, 0, 1], 0);
  flat([[-40, 0, 0], [40, 0, 0], [40, 0, 30], [-40, 0, 30]], [0, 1, 0], 1);
  const st = 0.014, sh = 0.085;
  flat([[-40, 0, st], [40, 0, st], [40, sh - 0.004, st], [-40, sh - 0.004, st]], [0, 0, 1], 2);
  quad([[-40, sh - 0.004, st], [40, sh - 0.004, st], [40, sh, st - 0.004], [-40, sh, st - 0.004]], [[0, 0, 1], [0, 0, 1], [0, 1, 0], [0, 1, 0]], [[0, 0], [0, 0], [0, 0], [0, 0]], 2);
  flat([[-40, sh, st - 0.004], [40, sh, st - 0.004], [40, sh, 0], [-40, sh, 0]], [0, 1, 0], 2);

  // half of the moulding's cross-section: [inset from the outer edge, height, normal]
  const half: number[][] = [[0, 0, -1, 0]];
  const r1 = 0.007, r2 = 0.004;
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI - (i / 6) * (Math.PI / 2);
    half.push([r1 + r1 * Math.cos(a), FD - r1 + r1 * Math.sin(a), Math.cos(a), Math.sin(a)]);
  }
  for (let i = 0; i <= 5; i++) {
    const a = Math.PI / 2 - (i / 5) * (Math.PI / 2);
    half.push([FM - r2 + r2 * Math.cos(a), FD - r2 + r2 * Math.sin(a), Math.cos(a), Math.sin(a)]);
  }
  half.push([FM, ZG - 0.001, 1, 0]);
  const prof = [...half.slice(1).reverse().map(([t, z, nt, nz]) => [t, -z, nt, -nz]), ...half];
  let arc = 0;
  const arcs = prof.map((p, i) => (i ? (arc += Math.hypot(p[0] - prof[i - 1][0], p[1] - prof[i - 1][1])) : 0));
  const corner = (k: number, t: number) => [[t, t], [FW - t, t], [FW - t, FH - t], [t, FH - t]][k % 4];
  const inward = [[0, 1], [-1, 0], [0, -1], [1, 0]];
  for (let k = 0; k < 4; k++) {
    for (let i = 0; i < prof.length - 1; i++) {
      const [a, b] = [prof[i], prof[i + 1]];
      const pts = [[k, a], [k + 1, a], [k + 1, b], [k, b]] as const;
      const along = (c: number[]) => (k % 2 === 0 ? c[0] : c[1]) + k * 3.3;
      quad(
        pts.map(([kk, p]) => [...corner(kk, p[0]), p[1]]),
        pts.map(([, p]) => [inward[k][0] * p[2], inward[k][1] * p[2], p[3]]),
        pts.map(([kk, p]) => [along(corner(kk, p[0])), arcs[p === a ? i : i + 1]]),
        3,
      );
    }
  }
  const e = FM - 0.002;
  const zero = [[0, 0], [0, 0], [0, 0], [0, 0]];
  quad([[e, e, ZG], [FW - e, e, ZG], [FW - e, FH - e, ZG], [e, FH - e, ZG]], Array(4).fill([0, 0, 1]), zero, 4);
  quad([[e, e, -ZG], [FW - e, e, -ZG], [FW - e, FH - e, -ZG], [e, FH - e, -ZG]], Array(4).fill([0, 0, -1]), zero, 5);
  return new Float32Array(out);
}

/** One sheet per speaker: the mount, the print cropped into its window, and a pencilled caption underneath. */
function paintSheet(ctx: CanvasRenderingContext2D, v: (typeof voices)[number], index: number, img: HTMLImageElement | null) {
  ctx.fillStyle = "#efe9dc";
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  const [x, y, w, h] = [84, 84, 560, 792];
  ctx.fillStyle = v.tone;
  ctx.fillRect(x, y, w, h);
  if (img) {
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, x + clamp(w / 2 - v.focus[0] * iw, w - iw, 0), y + clamp(h / 2 - v.focus[1] * ih, h - ih, 0), iw, ih);
    ctx.restore();
  }
  ctx.fillStyle = "rgba(60, 48, 42, 0.82)";
  ctx.textBaseline = "alphabetic";
  ctx.font = `italic 23px ${SERIF}`;
  ctx.textAlign = "left";
  ctx.fillText(v.name, x + 2, y + h + 44);
  ctx.textAlign = "right";
  ctx.fillText(`${index + 1} / ${N}`, x + w - 2, y + h + 44);
}

type Sim = {
  index: number; side: number; yaw: number; yawV: number; lean: number; leanV: number; rock: number; rockV: number;
  queue: number; textIn: boolean; textSide: number; kick: number; kickV: number;
  px: number; py: number; cx: number; cy: number; panX: number; sideMix: number;
  sun: number[]; paused: boolean; nextAuto: number; dirty: boolean; narrow: boolean;
};

function QuoteBody({ v, narrow }: { v: (typeof voices)[number]; narrow: boolean }) {
  return (
    <figure className="m-0 flex h-full flex-col" style={{ color: INK }}>
      <p className="flex items-center gap-3 font-semibold uppercase" style={{ fontFamily: GROTESK, fontSize: narrow ? 10.5 : 12, letterSpacing: "0.26em" }}>
        <span aria-hidden="true" className="inline-block h-px w-8 bg-current" />
        {KICKER}
      </p>
      <blockquote className="m-0 mt-5" style={{ fontFamily: SERIF, fontSize: narrow ? 40 : 72, lineHeight: 0.98, letterSpacing: "-0.035em", fontWeight: 500, textWrap: "balance" } as React.CSSProperties}>
        <span aria-hidden="true" className="absolute" style={{ transform: "translateX(-0.46em)" }}>
          “
        </span>
        {v.quote}”
      </blockquote>
      <figcaption className={narrow ? "mt-5" : "mt-9"} style={{ fontFamily: GROTESK }}>
        <span className="block font-semibold" style={{ fontSize: narrow ? 15 : 19, letterSpacing: "-0.01em" }}>
          {v.name}
        </span>
        <span className="mt-1 block font-medium uppercase" style={{ fontSize: narrow ? 10 : 11.5, letterSpacing: "0.2em" }}>
          {v.role}
        </span>
      </figcaption>
    </figure>
  );
}

export default function LeaningFrameTestimonials() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);
  const [ink, setInk] = useState(true);
  const [narrow, setNarrow] = useState(false);
  const [mode, setMode] = useState<"pending" | "gl" | "still">("pending");
  const sim = useRef<Sim>({
    index: 0, side: 0, yaw: 0, yawV: 0, lean: LEAN, leanV: 0, rock: 0, rockV: 0,
    queue: 0, textIn: true, textSide: 0, kick: 0, kickV: 0,
    px: 0, py: 0, cx: 0, cy: 0, panX: 0, sideMix: 0,
    sun: [], paused: false, nextAuto: 0, dirty: true, narrow: false,
  });

  const step = useCallback((dir: number) => {
    const s = sim.current;
    s.queue = clamp(s.queue + dir, -2, 2);
    s.nextAuto = performance.now() + HOLD_MS * 1.6;
    s.dirty = true;
    if (mode === "still") {
      s.queue = 0;
      setShown((i) => mod(i + dir, N));
    }
  }, [mode]);

  // tall, narrow stages put the quote on the wall above the frame instead of beside it
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const isNarrow = wrap.clientWidth / wrap.clientHeight < 1.12;
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
    const plate = plateRef.current;
    if (!wrap || !canvas || !plate) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) {
      setMode("still");
      return;
    }
    const s = sim.current;
    let prog: WebGLProgram, progLens: WebGLProgram, progOut: WebGLProgram;
    try {
      prog = program(gl, VS, FS);
      progLens = program(gl, VS_FULL, FS_LENS);
      progOut = program(gl, VS_FULL, FS_OUT);
    } catch {
      setMode("still");
      return;
    }
    setMode("gl");

    // one sRGB layer per speaker, so the light maths happens in linear colour
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
    voices.forEach((v, i) => {
      paintSheet(sctx, v, i, null);
      upload(i);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (!alive) return;
        paintSheet(sctx, v, i, img);
        upload(i);
      };
      img.src = v.src;
    });

    const mesh = sceneMesh();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
    [3, 3, 2, 1].reduce((off, size, loc) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 36, off);
      return off + size * 4;
    }, 0);
    gl.bindVertexArray(null);
    const emptyVao = gl.createVertexArray();

    const msFbo = gl.createFramebuffer();
    const msColor = gl.createRenderbuffer();
    const msDepth = gl.createRenderbuffer();
    const resFbo = gl.createFramebuffer();
    const resTex = gl.createTexture();
    const lensFbo = gl.createFramebuffer();
    const lensTex = gl.createTexture();
    let W = 0, H = 0, cw = 1, ch = 1, scale = Math.min(window.devicePixelRatio || 1, 1.5);
    const samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES));
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
      gl.bindRenderbuffer(gl.RENDERBUFFER, msColor);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, W, H);
      gl.bindRenderbuffer(gl.RENDERBUFFER, msDepth);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, W, H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, msFbo);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, msColor);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, msDepth);
      for (const [unit, t, fb] of [[gl.TEXTURE2, resTex, resFbo], [gl.TEXTURE3, lensTex, lensFbo]] as const) {
        gl.activeTexture(unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const locs = new Map<string, WebGLUniformLocation | null>();
    const U = (p: WebGLProgram, n: string) => {
      const key = (p === prog ? "a" : p === progLens ? "b" : "c") + n;
      if (!locs.has(key)) locs.set(key, gl.getUniformLocation(p, n));
      return locs.get(key)!;
    };
    const layers = new Float32Array([0, 1]);
    /** The eight numbers that describe a sun: direction, colour times power, leaf shade, aim. Mirrored when the frame changes side. */
    const sunFor = (i: number, side: number) => {
      const p = suns[i % suns.length];
      const m = side ? 1 : -1;
      return [m * p.dir[0], p.dir[1], p.dir[2], p.col[0] * p.power, p.col[1] * p.power, p.col[2] * p.power, p.leaf, -m * p.aim[0], p.aim[1]];
    };
    s.sun = sunFor(0, 0);

    const draw = (t: number) => {
      // where the frame is: swung about its hinge corner, rocked onto that corner, leaning back toward the wall
      const cy = Math.cos(s.yaw), sy = Math.sin(s.yaw), cr = Math.cos(s.rock), sr = Math.sin(s.rock), cl = Math.cos(s.lean), sl = Math.sin(s.lean);
      const tilt = (v: number[]) => [v[0], v[1] * cl + v[2] * sl, -v[1] * sl + v[2] * cl];
      const u0 = [cy, 0, sy], n0 = [-sy, 0, cy];
      const Uv = tilt([u0[0] * cr, sr, u0[2] * cr]);
      const Vv = tilt([-u0[0] * sr, cr, -u0[2] * sr]);
      const Nv = tilt(n0);
      let low = 0;
      for (const x of [0, FW]) for (const z of [-FD, FD]) low = Math.min(low, Uv[1] * x + Nv[1] * z);
      const C = [0, -low + 0.001, Z0];

      const aspect = cw / ch;
      const mix = s.sideMix; // 0 frame on the right, 1 on the left
      const fc = 0.5 - mix;
      const needW = s.narrow ? 0.68 : 1.7, needH = s.narrow ? 1.5 : 0.93;
      const TAN = Math.max(needW / aspect, needH) / CAM_Z;
      const lookY = s.narrow ? 1.16 : 0.71;
      const centre = s.narrow ? fc : (mix - 0.5) * 0.5;
      const drift = reduce ? 0 : 1;
      const cam = [centre + s.cx * 0.34 + drift * 0.05 * Math.sin(t * 0.27), 0.98 - s.cy * 0.1 + drift * 0.015 * Math.sin(t * 0.21 + 1) + s.kick, CAM_Z];
      let fw = [centre * 0.9 - cam[0], lookY - cam[1], -cam[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]);
      fw = fw.map((v) => v / fl);
      let rt = [-fw[2], 0, fw[0]];
      const rl = Math.hypot(rt[0], rt[2]);
      rt = rt.map((v) => v / rl);
      const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];

      const L = s.sun.slice(0, 3);
      const ll = Math.hypot(L[0], L[1], L[2]);
      for (let i = 0; i < 3; i++) L[i] /= ll;
      let Lu = [L[2], 0, -L[0]];
      const lul = Math.hypot(Lu[0], Lu[2]);
      Lu = Lu.map((v) => v / lul);
      const Lv = [L[1] * Lu[2] - L[2] * Lu[1], L[2] * Lu[0] - L[0] * Lu[2], L[0] * Lu[1] - L[1] * Lu[0]];

      gl.bindFramebuffer(gl.FRAMEBUFFER, msFbo);
      gl.viewport(0, 0, W, H);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.clearColor(0.9, 0.7, 0.5, 0.5);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(prog);
      gl.uniform3fv(U(prog, "uC"), C);
      gl.uniform3fv(U(prog, "uU"), Uv);
      gl.uniform3fv(U(prog, "uV"), Vv);
      gl.uniform3fv(U(prog, "uN"), Nv);
      gl.uniform3fv(U(prog, "uCam"), cam);
      gl.uniform3fv(U(prog, "uRt"), rt);
      gl.uniform3fv(U(prog, "uUp"), up);
      gl.uniform3fv(U(prog, "uFw"), fw);
      gl.uniform1f(U(prog, "uTan"), TAN);
      gl.uniform1f(U(prog, "uAspect"), W / H);
      gl.uniform3fv(U(prog, "uL"), L);
      gl.uniform3fv(U(prog, "uLu"), Lu);
      gl.uniform3fv(U(prog, "uLv"), Lv);
      gl.uniform3f(U(prog, "uLT"), s.sun[7], s.sun[8], 0);
      gl.uniform3f(U(prog, "uSun"), s.sun[3], s.sun[4], s.sun[5]);
      gl.uniform1f(U(prog, "uLeaf"), s.sun[6]);
      gl.uniform1f(U(prog, "uTime"), reduce ? 0 : t);
      gl.uniform1f(U(prog, "uFocus"), CAM_Z - 0.1);
      gl.uniform1f(U(prog, "uAperture"), 1.5);
      gl.uniform1fv(U(prog, "uLayer[0]"), layers);
      gl.uniform1i(U(prog, "uTex"), 0);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.length / 9);

      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msFbo);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, resFbo);
      gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, lensFbo);
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(progLens);
      gl.uniform1i(U(progLens, "uScene"), 2);
      gl.uniform2f(U(progLens, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(progLens, "uMaxR"), H * 0.011);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(progOut);
      gl.uniform1i(U(progOut, "uScene"), 3);
      gl.uniform2f(U(progOut, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(progOut, "uTime"), reduce ? 0 : t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // lay the quote on the wall: the same camera, written as a CSS matrix
      const dw = s.narrow ? 380 : 600;
      const ww = s.narrow ? 1.16 : 1.36;
      const tfc = 0.5 - s.textSide;
      const ox = s.narrow ? tfc - ww / 2 : s.textSide ? 0.22 : -1.55;
      const oy = s.narrow ? 2.43 : 1.36;
      const k = ww / dw;
      const proj = (p: number[]) => {
        const d = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]];
        const xv = d[0] * rt[0] + d[1] * rt[1] + d[2] * rt[2], yv = d[0] * up[0] + d[1] * up[1] + d[2] * up[2], zv = d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2];
        return [cw * 0.5 * (xv / (TAN * aspect) + zv), ch * 0.5 * (zv - yv / TAN), zv];
      };
      const h0 = proj([ox, oy, 0]), hx = proj([ox + k, oy, 0]), hy = proj([ox, oy - k, 0]);
      const m = [hx[0] - h0[0], hx[1] - h0[1], hx[2] - h0[2], hy[0] - h0[0], hy[1] - h0[1], hy[2] - h0[2], h0[0], h0[1], h0[2]].map((v) => v / h0[2]);
      plate.style.transform = `matrix3d(${m[0]},${m[1]},0,${m[2]},${m[3]},${m[4]},0,${m[5]},0,0,1,0,${m[6]},${m[7]},0,${m[8]})`;
    };

    /** One small step of the swing, the fall back against the wall, and the rock on the hinge corner. */
    const physics = (dt: number) => {
      const goal = s.side ? Math.PI : 0;
      let away = Math.abs(goal - s.yaw);
      if (s.queue !== 0 && away < 0.9 && Math.abs(s.yawV) < 2.4) {
        const dir = Math.sign(s.queue);
        s.queue -= dir;
        s.index = mod(s.index + dir, N);
        s.side = 1 - s.side;
        layers[s.side] = s.index; // the hidden side gets the next print
        s.textIn = false;
        setInk(false);
        return;
      }
      s.yawV += (SWING * (goal - s.yaw) - SWING_DRAG * s.yawV) * dt;
      s.yaw += s.yawV * dt;
      if ((goal === 0 && s.yaw < 0) || (goal > 0 && s.yaw > Math.PI)) {
        s.yaw = goal;
        s.yawV *= -0.18;
      }
      away = Math.abs(goal - s.yaw);
      if (!s.textIn && away < 1.15) {
        s.textIn = true;
        s.textSide = s.side;
        setShown(s.index);
        setInk(true);
      }
      // upright while it travels; near home it topples back, slowly at first, and knocks against the wall
      const fall = 1 - smooth(0.1, 0.75, away);
      s.leanV += (fall * 34 * Math.sin(s.lean + 0.05) + (1 - fall) * (-95 * s.lean - 15 * s.leanV)) * dt;
      s.lean += s.leanV * dt;
      if (s.lean > LEAN) {
        s.lean = LEAN;
        if (s.leanV > 0.22) {
          s.kickV -= s.leanV * 0.012;
          s.leanV *= -BOUNCE;
        } else s.leanV = 0;
      }
      const lift = 0.05 * smooth(0.25, 0.9, away);
      s.rockV += (170 * (lift - s.rock) - 11 * s.rockV) * dt;
      s.rock += s.rockV * dt;
      if (s.rock < 0) {
        s.rock = 0;
        s.rockV *= -0.3;
      }
      s.kickV += (-420 * s.kick - 26 * s.kickV) * dt;
      s.kick += s.kickV * dt;
    };

    let raf = 0, visible = true, last = performance.now(), slow = 0, frames = 0;
    s.nextAuto = last + HOLD_MS * 0.75;
    const tick = (now: number) => {
      const real = now - last;
      const dt = Math.min(0.05, real / 1000);
      last = now;
      if (!s.paused && !document.hidden && now > s.nextAuto && s.queue === 0) {
        s.queue = 1;
        s.nextAuto = now + HOLD_MS;
      }
      if (reduce) {
        if (s.queue !== 0) {
          s.index = mod(s.index + Math.sign(s.queue), N);
          s.queue = 0;
          s.side = 1 - s.side;
          layers[s.side] = s.index;
          s.textSide = s.side;
          setShown(s.index);
          s.dirty = true;
        }
        s.yaw = s.side ? Math.PI : 0;
        s.lean = LEAN;
        s.sideMix = s.side;
        s.sun = sunFor(s.index, s.side);
      } else {
        const sub = Math.max(1, Math.ceil(dt / 0.004));
        for (let i = 0; i < sub; i++) physics(dt / sub);
        s.cx += (s.px - s.cx) * Math.min(1, dt * 3);
        s.cy += (s.py - s.cy) * Math.min(1, dt * 3);
        s.sideMix += (s.yaw / Math.PI - s.sideMix) * Math.min(1, dt * 3.4);
        const want = sunFor(s.index, s.side);
        for (let i = 0; i < want.length; i++) s.sun[i] += (want[i] - s.sun[i]) * Math.min(1, dt * 2.6);
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
  const v = voices[shown];
  const btn = "grid h-11 w-11 place-items-center rounded-full border border-[#3d0f0b]/25 bg-[#fff3e2]/70 text-[#3d0f0b] backdrop-blur-sm transition hover:bg-[#fff3e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d0f0b]";
  const label = "text-[10px] font-semibold uppercase tracking-[0.26em] sm:text-[11px]";

  return (
    <section className="relative overflow-hidden bg-[#e9a568]" onFocus={pause(true)} onBlur={pause(false)} onPointerEnter={pause(true)} onPointerLeave={pause(false)}>
      <style>{`@keyframes leaning-frame-testimonials-ink { from { opacity: 0; transform: translateY(14px); filter: blur(5px); } to { opacity: 1; transform: none; filter: blur(0); } } .leaning-frame-testimonials-ink { animation: leaning-frame-testimonials-ink 620ms cubic-bezier(0.2, 0.7, 0.2, 1) both; } @keyframes leaning-frame-testimonials-sun { from { transform: translateX(-3%); } to { transform: translateX(3%); } } .leaning-frame-testimonials-sun { animation: leaning-frame-testimonials-sun 9s ease-in-out infinite alternate; } @media (prefers-reduced-motion: reduce) { .leaning-frame-testimonials-ink, .leaning-frame-testimonials-sun { animation: none; } }`}</style>
      <div
        ref={wrapRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Client testimonials. A framed portrait leans on a sunlit wall beside each quote. Use the left and right arrow keys to turn the frame to the next speaker."
        tabIndex={0}
        onKeyDown={onKey}
        className="relative h-[720px] w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3d0f0b]/70 sm:h-[780px]"
      >
        <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full ${mode === "still" ? "hidden" : ""}`} />

        {/* the quote, painted on the wall: real text, multiplied into the picture so sun and shade fall across it */}
        <div
          ref={plateRef}
          aria-live="polite"
          className={`absolute left-0 top-0 origin-top-left ${mode === "gl" ? "" : "hidden"}`}
          style={{ width: narrow ? 380 : 600, mixBlendMode: "multiply", willChange: "transform" }}
        >
          <div className="transition-opacity duration-200 motion-reduce:transition-none" style={{ opacity: ink ? 1 : 0 }}>
            <div key={shown} className="leaning-frame-testimonials-ink">
              <QuoteBody v={v} narrow={narrow} />
              <span className="sr-only">Portrait: {v.alt}</span>
            </div>
          </div>
        </div>

        {/* the same room built from plain boxes and one image, for browsers without WebGL 2 */}
        {mode === "still" && (
          <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, #f4b97c 0%, #f1b071 38%, #d99358 100%)" }}>
            <div aria-hidden="true" className="leaning-frame-testimonials-sun absolute inset-y-0 -left-[10%] w-[120%]" style={{ background: "linear-gradient(118deg, transparent 12%, rgba(255,236,200,0.5) 12.4%, rgba(255,236,200,0.5) 58%, transparent 58.6%)" }} />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[13%]" style={{ background: "linear-gradient(180deg, #7a2a17 0%, #a3472a 100%)", boxShadow: "inset 0 10px 14px -8px rgba(40,10,0,0.6)" }} />
            <div className="absolute inset-x-0 bottom-[10%] top-[11%] mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 sm:flex-row sm:items-end sm:gap-14 sm:px-12">
              <div aria-live="polite" className="order-1 w-full max-w-[600px] sm:w-[54%] sm:pb-24">
                <QuoteBody v={v} narrow={narrow} />
              </div>
              <div className="order-2 h-[52%] shrink-0 sm:h-full" style={{ aspectRatio: "100 / 132", padding: "1.6%", background: "linear-gradient(135deg, #5a2f18, #2e1509 60%, #4a2512)", boxShadow: "22px 18px 30px -6px rgba(70,25,5,0.45), 2px 0 0 rgba(255,255,255,0.08) inset" }}>
                <div className="h-full w-full" style={{ background: "#efe9dc", padding: "10.5% 11% 13.5%", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25), inset 3px 4px 6px rgba(0,0,0,0.25)" }}>
                  <img src={v.src} alt={v.alt} width={900} height={1350} className="h-full w-full object-cover" style={{ background: v.tone, objectPosition: `${v.focus[0] * 100}% ${v.focus[1] * 100}%`, boxShadow: "0 0 0 2px #fbf8f1, inset 0 0 0 1px rgba(0,0,0,0.3)" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-baseline justify-between p-5 sm:p-9" style={{ color: INK }}>
          <p className="text-[26px] italic leading-none sm:text-[30px]" style={{ fontFamily: SERIF, letterSpacing: "-0.03em" }}>
            {MASTHEAD}
          </p>
          <p className={`${label} opacity-80`} style={{ fontFamily: GROTESK }}>
            <span className="hidden sm:inline">Arrow keys turn the frame</span>
          </p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-9">
          <p className={`${label} rounded-full bg-[#fff3e2]/85 px-4 py-2.5`} style={{ fontFamily: GROTESK, color: INK }}>
            <span className="tabular-nums">{String(shown + 1).padStart(2, "0")}</span>
            <span className="mx-2 opacity-50">/</span>
            <span className="tabular-nums">{String(N).padStart(2, "0")}</span>
          </p>
          <div className="pointer-events-auto flex gap-2">
            <button type="button" onClick={() => step(-1)} aria-label="Previous testimonial" className={btn}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next testimonial" className={btn}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 4l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
