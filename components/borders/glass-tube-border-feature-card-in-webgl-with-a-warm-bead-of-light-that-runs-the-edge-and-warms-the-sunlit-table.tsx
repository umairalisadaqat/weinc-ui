import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The words on the card. Everything here is real page text laid onto the card face. */
const card = {
  kicker: "Version history",
  title: "Every draft kept. None of them in the way.",
  body: "Roll any page back to how it looked on a given morning, compare two versions side by side, and restore one section without touching the rest.",
  link: "See how versions work",
  maker: "Quillmark Studio",
};

const SERIF = '"New York", ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const INK = "#2b1c12";

const IDLE_SPEED = 0.075; // laps per second while nobody is near
const HOVER_SPEED = 0.46; // laps per second under the pointer
const SPEED_SPRING = 26; // how hard the bead is pulled to its new speed
const SPEED_DAMP = 6.5; // lower lets it overshoot more
const WARM_DECAY = 2.6; // seconds for the warmth on the table to fade to about a third
const DEMO_EVERY = 9000; // ms between automatic fast laps when nobody is interacting
const BINS = 24; // places around the edge that hold warmth
const GAP = 0.02; // air between the card's edge and the glass

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Layout = { hx: number; hy: number; rc: number; th: number; yaw: number; tr: number; pad: number; narrow: boolean };
const WIDE: Layout = { hx: 0.82, hy: 0.5, rc: 0.09, th: 0.028, yaw: -0.2, tr: 0.03, pad: 0.13, narrow: false };
const TALL: Layout = { hx: 0.5, hy: 0.7, rc: 0.08, th: 0.028, yaw: -0.16, tr: 0.026, pad: 0.095, narrow: true };

/** The centre line of the tube, a rounded rectangle on the card face. */
const tubePath = (l: Layout) => {
  const ax = l.hx + GAP + l.tr, ay = l.hy + GAP + l.tr, pr = l.rc + GAP + l.tr;
  const sx = ax - pr, sy = ay - pr, A = (pr * Math.PI) / 2;
  const per = 4 * sx + 4 * sy + 4 * A;
  /** A point on the line, s from 0 to 1, starting bottom centre and running anticlockwise as you face the card. */
  const at = (s: number): [number, number] => {
    let d = (((s % 1) + 1) % 1) * per;
    const arc = (cx: number, cy: number, a0: number, len: number): [number, number] => {
      const a = a0 + len / pr;
      return [cx + pr * Math.cos(a), cy + pr * Math.sin(a)];
    };
    if (d < sx) return [d, -ay];
    d -= sx;
    if (d < A) return arc(sx, -sy, -Math.PI / 2, d);
    d -= A;
    if (d < 2 * sy) return [ax, -sy + d];
    d -= 2 * sy;
    if (d < A) return arc(sx, sy, 0, d);
    d -= A;
    if (d < 2 * sx) return [sx - d, ay];
    d -= 2 * sx;
    if (d < A) return arc(-sx, sy, Math.PI / 2, d);
    d -= A;
    if (d < 2 * sy) return [-ax, sy - d];
    d -= 2 * sy;
    if (d < A) return arc(-sx, -sy, Math.PI, d);
    d -= A;
    return [-sx + d, -ay];
  };
  return { ax, ay, pr, per, at, zt: 0, lift: 2 * l.tr + GAP };
};

const VS = `#version 300 es
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec3 uCam, uFw, uRt, uUp;
uniform float uTan;
uniform vec2 uHalf; uniform float uRc, uTh, uYaw, uLift;
uniform vec2 uPA; uniform float uPR, uTr, uZt, uPer;
uniform vec3 uBead, uTail; uniform float uBeadS, uBeadPow;
uniform vec3 uWarmPos[${BINS}]; uniform float uWarm[${BINS}];
uniform vec3 uL, uLu, uLv, uSun;
uniform float uTime, uFocus, uAperture;
out vec4 o;
const float WALLZ = -2.3;
const vec3 WARM = vec3(1.0, 0.5, 0.17);
const vec3 AMB = vec3(0.2, 0.21, 0.25);
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.03 + 7.3) + 0.125 * vnoise(p * 4.1 + 1.7) + 0.0625 * vnoise(p * 8.3 + 3.1); }
float sbox(vec2 p, vec2 h, float s) { vec2 d = smoothstep(h + s, h - s, abs(p)); return d.x * d.y; }
float sdRR(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
vec3 toL(vec3 p) { float c = cos(uYaw), s = sin(uYaw); vec3 d = p - vec3(0.0, uHalf.y + uLift, 0.0); return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z); }
vec3 dirW(vec3 n) { float c = cos(uYaw), s = sin(uYaw); return vec3(c * n.x + s * n.z, n.y, -s * n.x + c * n.z); }
float sdCard(vec3 q) { float e = 0.007; vec2 w = vec2(sdRR(q.xy, uHalf - e, uRc - e), abs(q.z) - uTh + e); return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - e; }
float sdTube(vec3 q) { return length(vec2(sdRR(q.xy, uPA, uPR), q.z - uZt)) - uTr; }
float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - 0.002; }
// brass clips: a sleeve round the glass and a tab that holds the card's edge
float sdClip(vec3 q) {
  vec3 a = vec3(abs(q.x), abs(q.y), q.z);
  float cx = uHalf.x * 0.62;
  float s1 = max(length(vec2(a.y - uPA.y, a.z)) - (uTr + 0.0045), abs(a.x - cx) - 0.012);
  float t1 = sdBox(vec3(a.x - cx, a.y - (uHalf.y + uPA.y) * 0.5, a.z), vec3(0.009, (uPA.y - uHalf.y) * 0.5, uTh * 1.15));
  float s2 = max(length(vec2(a.x - uPA.x, a.z)) - (uTr + 0.0045), abs(a.y) - 0.012);
  float t2 = sdBox(vec3(a.x - (uHalf.x + uPA.x) * 0.5, a.y, a.z), vec3((uPA.x - uHalf.x) * 0.5, 0.009, uTh * 1.15));
  return min(min(s1, t1), min(s2, t2));
}
vec2 mapL(vec3 q) { float a = sdCard(q), b = sdTube(q), c = sdClip(q); vec2 r = a < b ? vec2(a, 1.0) : vec2(b, 2.0); return c < r.x ? vec2(c, 3.0) : r; }
vec3 normL(vec3 q, float id) {
  vec2 e = vec2(0.0007, -0.0007);
  if (id < 1.5) return normalize(e.xyy * sdCard(q + e.xyy) + e.yyx * sdCard(q + e.yyx) + e.yxy * sdCard(q + e.yxy) + e.xxx * sdCard(q + e.xxx));
  if (id > 2.5) return normalize(e.xyy * sdClip(q + e.xyy) + e.yyx * sdClip(q + e.yyx) + e.yxy * sdClip(q + e.yxy) + e.xxx * sdClip(q + e.xxx));
  return normalize(e.xyy * sdTube(q + e.xyy) + e.yyx * sdTube(q + e.yyx) + e.yxy * sdTube(q + e.yxy) + e.xxx * sdTube(q + e.xxx));
}
// where along the tube (0 to 1) a point on the card face sits
float pathParam(vec2 p) {
  float sx = uPA.x - uPR, sy = uPA.y - uPR, A = uPR * 1.5707963;
  float c2 = sx + A, c3 = c2 + 2.0 * sy, c4 = c3 + A, c5 = c4 + 2.0 * sx, c6 = c5 + A, c7 = c6 + 2.0 * sy, c8 = c7 + A;
  float d;
  if (abs(p.x) <= sx) d = p.y < 0.0 ? (p.x >= 0.0 ? p.x : c8 + p.x + sx) : c4 + sx - p.x;
  else if (abs(p.y) <= sy) d = p.x > 0.0 ? c2 + p.y + sy : c6 + sy - p.y;
  else {
    vec2 cc = vec2(sign(p.x) * sx, sign(p.y) * sy);
    float a = atan(p.y - cc.y, p.x - cc.x);
    if (p.x > 0.0 && p.y < 0.0) d = sx + uPR * (a + 1.5707963);
    else if (p.x > 0.0) d = c3 + uPR * a;
    else if (p.y > 0.0) d = c5 + uPR * (a - 1.5707963);
    else d = c7 + uPR * ((a < 0.0 ? a + 6.2831853 : a) - 3.1415926);
  }
  return d / uPer;
}
// warmth stored around the edge, read at one place on the tube
float warmAt(float s) {
  float f = s * ${BINS}.0 - 0.5;
  int i0 = int(floor(f)); float t = fract(f);
  int a = (i0 + ${BINS}) % ${BINS}, b = (i0 + 1 + ${BINS}) % ${BINS};
  return mix(uWarm[a], uWarm[b], t);
}
float gobo(vec3 P, bool fine) {
  vec2 g = vec2(dot(P, uLu), dot(P, uLv));
  float w = sbox(g - vec2(0.15, 0.25), vec2(2.6, 1.9), 0.25);
  float bars = 1.0 - 0.94 * smoothstep(0.05, 0.02, abs(g.x + 1.42)) - 0.94 * smoothstep(0.05, 0.02, abs(g.y - 1.62));
  float leaf = 1.0;
  if (fine) {
    vec2 q = g * 2.4 + vec2(0.04 * sin(uTime * 0.6 + g.y * 3.0), 0.03 * cos(uTime * 0.45 + g.x * 2.0));
    float n = fbm(q * 1.6 + 2.0);
    leaf = 1.0 - 0.85 * smoothstep(0.52, 0.66, n) * smoothstep(-0.2, -1.6, g.x + 0.4 * g.y);
  }
  return w * clamp(bars, 0.0, 1.0) * leaf;
}
// light that the sun gets past the card and through the glass tube (which throws a bright line in its shadow)
float sunVis(vec3 P) {
  vec3 o = toL(P);
  vec3 d = toL(P + uL) - o;
  float rc = 1.0, tm = 1.0, t = 0.006;
  for (int i = 0; i < 96; i++) {
    vec3 q = o + d * t;
    float dc = sdCard(q), dt = sdTube(q);
    rc = min(rc, 6.0 * dc / t);
    tm = min(tm, dt);
    if (rc < 0.002 || t > 3.5) break;
    t += clamp(min(dc, dt), 0.005, 0.12);
  }
  rc = clamp(rc, 0.0, 1.0); rc = rc * rc * (3.0 - 2.0 * rc);
  float c = clamp(-tm / uTr, 0.0, 1.0);
  float glass = tm > 0.0 ? 1.0 - 0.25 * exp(-tm / 0.008) : mix(0.5, 0.75, smoothstep(0.0, 0.4, c)) + 1.1 * smoothstep(0.55, 0.95, c);
  return rc * glass;
}
vec3 env(vec3 rd) {
  vec3 c = mix(vec3(0.33, 0.22, 0.15), vec3(0.92, 0.85, 0.76), smoothstep(-0.15, 0.7, rd.y));
  float f = dot(rd, uL);
  if (f > 0.0) {
    vec2 a = vec2(dot(rd, uLu), dot(rd, uLv)) / f;
    float win = sbox(a - vec2(0.05, 0.1), vec2(0.42, 0.55), 0.03);
    win *= 1.0 - 0.9 * smoothstep(0.02, 0.008, abs(a.x + 0.12));
    win *= 1.0 - 0.9 * smoothstep(0.02, 0.008, abs(a.y - 0.25));
    c += uSun * 5.5 * win;
  }
  if (rd.y < 0.0) c = mix(c, vec3(0.2, 0.11, 0.05), smoothstep(0.0, -0.2, rd.y));
  return c;
}
// the bead and the warmth it has left behind, as light falling on a surface
vec3 beadLight(vec3 P, vec3 n) {
  vec3 Lb = uBead - P; float d2 = dot(Lb, Lb);
  float k = max(dot(n, Lb * inversesqrt(d2)), 0.0) * 0.6 + 0.4 * max(dot(n, Lb * inversesqrt(d2)), -0.2);
  vec3 acc = WARM * uBeadPow * 0.08 * max(k, 0.0) / (d2 + 0.006);
  float w = 0.0;
  for (int i = 0; i < ${BINS}; i++) {
    vec3 L = uWarmPos[i] - P; float e2 = dot(L, L);
    w += uWarm[i] * max(dot(n, L * inversesqrt(e2)) * 0.7 + 0.3, 0.0) / (e2 + 0.03);
  }
  return acc + WARM * w * 0.11;
}
vec3 wood(vec3 P, out float rough, out vec3 n) {
  float z = P.z * 4.4;
  float id = floor(z);
  float fr = fract(z);
  float tone = hash(vec2(id, 3.1));
  float off = hash(vec2(id, 9.7)) * 40.0;
  float warp = 0.6 * fbm(vec2(P.x * 1.2 + off, z * 3.0));
  float grain = mix(0.5, fbm(vec2(P.x * 1.4 + off, (fr + warp) * 26.0)), clamp(1.4 - fwidth(z * 26.0) * 0.7, 0.0, 1.0));
  float fine = mix(0.5, vnoise(vec2(P.x * 90.0, z * 60.0 + off)), clamp(1.0 - max(fwidth(P.x * 90.0), fwidth(z * 60.0)) * 0.9, 0.0, 1.0));
  vec3 alb = mix(vec3(0.26, 0.12, 0.05), vec3(0.55, 0.3, 0.13), 0.3 + 0.5 * tone) * (0.55 + 0.75 * grain) * (0.9 + 0.12 * fine);
  float px = fwidth(z);
  float seam = smoothstep(0.012 + px, 0.003, min(fr, 1.0 - fr)) / (1.0 + px * 40.0);
  alb *= 1.0 - 0.75 * seam;
  float x = P.x * 0.9 + off;
  float pj = fwidth(x * 0.3);
  float fj = fract(x * 0.3);
  float joint = smoothstep(0.0012 + pj, 0.0, min(fj, 1.0 - fj)) / (1.0 + pj * 200.0);
  alb *= 1.0 - 0.6 * joint;
  rough = mix(0.05 + 0.08 * fine, 0.5, seam);
  n = normalize(vec3(0.015 * (grain - 0.5), 1.0, 0.0));
  return alb;
}
vec3 plaster(vec3 P) {
  vec3 alb = vec3(0.72, 0.52, 0.36) * (0.88 + 0.22 * fbm(P.xy * 2.2));
  float sun = max(uL.z, 0.0) * gobo(P, false) * sunVis(P);
  return alb * (uSun * sun + AMB * 0.9);
}
vec3 paper(vec3 q) {
  float f = vnoise(q.xy * 900.0) * 0.5 + vnoise(q.xy * vec2(260.0, 1700.0)) * 0.5;
  return vec3(0.84, 0.79, 0.7) * (0.97 + 0.05 * f) * (0.98 + 0.04 * fbm(q.xy * 6.0));
}
vec3 shadeCard(vec3 P, vec3 q, vec3 nl, vec3 V, bool fine) {
  vec3 n = dirW(nl);
  vec3 alb = paper(q);
  if (abs(nl.z) < 0.7) alb *= vec3(0.9, 0.86, 0.8);
  float near = sdTube(q);
  float ao = mix(0.55, 1.0, smoothstep(0.0, 0.03, near)) * mix(0.6, 1.0, smoothstep(0.0, 0.12, P.y));
  float vis = fine ? sunVis(P + n * 0.002) : 1.0;
  vec3 col = alb * (uSun * max(dot(n, uL), 0.0) * gobo(P, fine) * vis + AMB * ao + beadLight(P, n) + vec3(0.12, 0.06, 0.03) * exp(-P.y / 0.18));
  float F = 0.03 + 0.97 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
  col += env(reflect(-V, n)) * F * 0.18;
  return col;
}
vec3 shadeBrass(vec3 P, vec3 nl, vec3 V) {
  vec3 n = dirW(nl);
  vec3 alb = vec3(0.86, 0.6, 0.28);
  vec3 R = reflect(-V, n);
  float F = pow(1.0 - max(dot(n, V), 0.0), 5.0);
  vec3 spec = env(R) * 0.7 + uSun * 8.0 * pow(max(dot(R, uL), 0.0), 120.0);
  return (alb + (1.0 - alb) * F) * spec * 0.75 + alb * (uSun * max(dot(n, uL), 0.0) * 0.12 + beadLight(P, n) * 0.6);
}
vec3 shadeTable(vec3 P, vec3 V, vec3 rd, bool fine, out float far) {
  float rough; vec3 n;
  vec3 alb = wood(P, rough, n);
  vec3 q = toL(P);
  float dc = sdCard(q);
  float ao = mix(0.32, 1.0, smoothstep(0.0, 0.16, dc)) * mix(0.75, 1.0, smoothstep(0.0, 0.05, sdTube(q)));
  ao *= mix(0.7, 1.0, smoothstep(0.0, 0.5, P.z - WALLZ));
  vec3 dif = uSun * max(dot(n, uL), 0.0) * gobo(P, fine) * (fine ? sunVis(P) : 1.0) + AMB * ao + beadLight(P, n);
  vec3 col = alb * dif;
  far = 0.0;
  if (!fine) return col;
  // varnish: one glossy bounce, jittered by the roughness of the grain
  float j = hash(gl_FragCoord.xy + fract(uTime) * 13.0);
  vec3 nr = normalize(n + rough * 0.1 * vec3(cos(j * 6.283), 0.0, sin(j * 6.283)) * sqrt(fract(j * 7.13)));
  vec3 R = reflect(rd, nr);
  vec3 ro = P + R * 0.003;
  vec3 refl = vec3(0.0);
  float t = 0.0; bool hit = false; float id = 0.0;
  for (int i = 0; i < 48; i++) {
    vec2 h = mapL(toL(ro + R * t));
    if (h.x < 0.001) { hit = true; id = h.y; break; }
    t += h.x;
    if (t > 3.0) break;
  }
  if (hit) {
    vec3 H = ro + R * t, hq = toL(H);
    vec3 hn = normL(hq, id);
    if (id < 1.5) refl = shadeCard(H, hq, hn, -R, false);
    else if (id > 2.5) refl = shadeBrass(H, hn, -R);
    else refl = env(reflect(R, dirW(hn))) * 0.22 + WARM * uBeadPow * 0.6 * exp(-pow((pathParam(hq.xy) - uBeadS) * uPer, 2.0) / 0.004) + WARM * warmAt(pathParam(hq.xy)) * 0.5;
    far = t;
  } else if (R.z < 0.0) {
    float tw = (WALLZ - ro.z) / R.z;
    refl = plaster(ro + R * tw);
    far = tw;
  } else { refl = env(R); far = 5.0; }
  float F = 0.04 + 0.96 * pow(1.0 - max(dot(nr, V), 0.0), 5.0);
  F *= 0.85;
  return col * (1.0 - F) + refl * F * ao;
}
vec3 shadeGlass(vec3 P, vec3 q, vec3 nl, vec3 rd) {
  vec3 n = dirW(nl);
  float cosT = max(dot(n, -rd), 0.0);
  float F = 0.04 + 0.96 * pow(1.0 - cosT, 5.0);
  vec3 R = reflect(rd, n);
  vec3 refl = env(R) + uSun * 22.0 * pow(max(dot(R, uL), 0.0), 260.0) * sunVis(P + n * 0.01);
  // seen through the glass: the tube bends what is behind it a little
  vec3 td = normalize(mix(rd, refract(rd, n, 0.67), 0.9));
  vec3 ro = P + td * (uTr * 2.0 * cosT + 0.004);
  vec3 seen;
  float t = 0.0; bool hit = false;
  for (int i = 0; i < 28; i++) {
    float d = sdCard(toL(ro + td * t));
    if (d < 0.0008) { hit = true; break; }
    t += d;
    if (t > 1.0) break;
  }
  if (hit) { vec3 H = ro + td * t, hq = toL(H); seen = shadeCard(H, hq, normL(hq, 1.0), -td, false); }
  else { float tp = td.y < 0.0 ? -ro.y / td.y : 1e9; if (tp < 1e8) { float f; seen = shadeTable(ro + td * tp, -td, td, false, f); } else seen = env(td); }
  vec3 tint = vec3(0.9, 0.93, 0.9) * exp(-(1.0 / max(cosT, 0.12) - 1.0) * vec3(0.3, 0.14, 0.22));
  // the bead's light runs along inside the glass wall, brightest at the silhouette
  float s = pathParam(q.xy);
  float ds = fract(s - uBeadS + 0.5) - 0.5;
  float dm = ds * uPer;
  float pipe = 0.6 + 2.2 * pow(1.0 - cosT, 2.0);
  float behind = dm < 0.0 ? exp(dm / 0.16) : exp(-dm / 0.025);
  vec3 glow = WARM * (uBeadPow * (8.0 * exp(-dm * dm / 0.0025) + 1.5 * behind) + 0.55 * warmAt(s)) * pipe;
  // a hollow tube: near its silhouette the eye looks along the wall and sees the dim room bent round
  float rim = smoothstep(0.8, 0.12, cosT);
  vec3 wall = mix(seen * tint, vec3(0.1, 0.085, 0.06) * (0.5 + 0.5 * env(R).r), rim * 0.9);
  // an inner wall highlight, offset from the outer one
  float inner = smoothstep(0.62, 0.7, cosT) * smoothstep(0.8, 0.7, cosT) * 0.35;
  return wall * (1.0 - F) + refl * F + glow + vec3(1.0, 0.95, 0.88) * inner * max(dot(n, uL), 0.0);
}
vec3 tonemap(vec3 x) { x *= 0.66; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec2 uv = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
  float aspect = uRes.x / uRes.y;
  vec3 rd = normalize(uFw + uRt * uv.x * uTan * aspect + uUp * uv.y * uTan);
  vec3 ro = uCam;
  float tp = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  float tw = rd.z < 0.0 ? (WALLZ - ro.z) / rd.z : 1e9;
  float tMax = min(min(tp, tw), 12.0);
  // march the card and the tube from just before their bounds
  float t = max(0.0, length(ro - vec3(0.0, uHalf.y + uLift, 0.0)) - max(uHalf.x, uHalf.y) - 0.4);
  float id = 0.0;
  for (int i = 0; i < 140; i++) {
    vec2 h = mapL(toL(ro + rd * t));
    if (h.x < 0.0001 * t) { id = h.y; break; }
    t += h.x * 0.8;
    if (t > tMax) break;
  }
  vec3 col; float depth; vec3 V = -rd;
  if (id > 0.5 && t < tMax) {
    vec3 P = ro + rd * t, q = toL(P);
    vec3 nl = normL(q, id);
    col = id < 1.5 ? shadeCard(P, q, nl, V, true) : id > 2.5 ? shadeBrass(P, nl, V) : shadeGlass(P, q, nl, rd);
    depth = t;
  } else if (tp < tw) {
    float far;
    vec3 P = ro + rd * tp;
    col = shadeTable(P, V, rd, true, far);
    depth = tp;
  } else {
    col = plaster(ro + rd * tw);
    depth = tw;
  }
  // the bead itself: a short hot streak, drawn wherever it is not hidden behind the card
  vec3 ba = uBead - uTail, w0 = ro - uTail;
  float bb = dot(rd, ba), cc = max(dot(ba, ba), 1e-8), dd = dot(rd, w0), ee = dot(ba, w0);
  float den = cc - bb * bb;
  float sg = den > 1e-9 ? clamp((ee - bb * dd) / den, 0.0, 1.0) : 1.0;
  vec3 Q = uTail + ba * sg;
  float bt = dot(Q - ro, rd);
  float best = length(ro + rd * bt - Q);
  if (bt < depth + uTr * 2.5) {
    float hot = 0.55 + 0.45 * sg; // brightest at the head
    float core = exp(-best * best / (0.0075 * 0.0075)) * hot;
    float halo = exp(-best / 0.05);
    col += vec3(1.0, 0.88, 0.7) * core * 16.0 * uBeadPow + WARM * halo * 0.7 * uBeadPow;
  }
  float coc = clamp(uAperture * (1.0 - uFocus / max(depth, 0.05)), -1.0, 1.0);
  o = vec4(pow(tonemap(col), vec3(1.0 / 2.2)), 0.5 + 0.5 * coc);
}`;

const FS_OUT = `#version 300 es
precision highp float;
uniform sampler2D uScene; uniform vec2 uPx; uniform float uMaxR, uTime;
out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main() {
  vec2 uv = gl_FragCoord.xy * uPx;
  vec4 c0 = texture(uScene, uv);
  float r0 = abs(c0.a * 2.0 - 1.0) * uMaxR;
  vec3 acc = c0.rgb; float wsum = 1.0;
  if (r0 > 0.6) {
    float rot = hash(gl_FragCoord.xy) * 6.2832;
    for (int i = 1; i < 28; i++) {
      float f = float(i);
      float a = f * 2.39996 + rot, r = sqrt(f / 27.0) * r0;
      vec2 off = vec2(cos(a), sin(a)) * r * uPx;
      vec4 s = texture(uScene, uv + off);
      float rs = abs(s.a * 2.0 - 1.0) * uMaxR;
      float w = smoothstep(r - 1.0, r + 1.0, rs + 0.5);
      acc += s.rgb * w; wsum += w;
    }
  }
  vec3 col = acc / wsum;
  vec2 v = uv - 0.5;
  col *= 1.0 - 0.32 * dot(v, v) * 1.6;
  col += (hash(gl_FragCoord.xy + fract(uTime * 7.0) * 91.0) - 0.5) * 0.028;
  o = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const p = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || "shader");
    gl.attachShader(p, sh);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
  return p;
}

function CardText({ narrow }: { narrow: boolean }) {
  return (
    <div className="flex h-full flex-col" style={{ color: INK, fontFamily: GROTESK }}>
      <p className="font-semibold uppercase" style={{ fontSize: narrow ? 11 : 12, letterSpacing: "0.24em" }}>
        {card.kicker}
      </p>
      <h2 className="font-normal" style={{ textWrap: "balance", fontFamily: SERIF, fontSize: narrow ? 37 : 47, lineHeight: 1.02, letterSpacing: "-0.022em", marginTop: narrow ? 18 : 16, maxWidth: narrow ? 330 : 520 }}>
        {card.title}
      </h2>
      <p style={{ fontSize: narrow ? 15 : 16, lineHeight: 1.5, marginTop: narrow ? 18 : 16, maxWidth: narrow ? 320 : 470, opacity: 0.86 }}>{card.body}</p>
      <div className={`mt-auto flex gap-4 ${narrow ? "flex-col items-start" : "items-center justify-between"}`} style={{ paddingTop: 14 }}>
        <a
          href="#"
          className="inline-flex min-h-[40px] items-center gap-2 rounded-full font-semibold underline decoration-1 underline-offset-[5px] outline-none focus-visible:ring-2 focus-visible:ring-[#2b1c12] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
          style={{ fontSize: narrow ? 15 : 16 }}
        >
          {card.link}
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10h11M11 5l5 5-5 5" />
          </svg>
        </a>
        <span className="uppercase" style={{ fontSize: 10.5, letterSpacing: "0.2em", opacity: 0.7 }}>{card.maker}</span>
      </div>
    </div>
  );
}

export default function GlassTubeBorderFeatureCard() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"wait" | "gl" | "still">("wait");
  const [narrow, setNarrow] = useState(false);
  const sim = useRef({ hot: false, lastTouch: -1e9, px: 0, py: 0, cx: 0, cy: 0, narrow: false, dirty: true });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const n = wrap.clientWidth < 640;
      sim.current.narrow = n;
      sim.current.dirty = true;
      setNarrow(n);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current, plate = plateRef.current;
    if (!wrap || !canvas || !plate) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) {
      setMode("still");
      return;
    }
    let prog: WebGLProgram, progOut: WebGLProgram;
    try {
      prog = compile(gl, VS, FS);
      progOut = compile(gl, VS, FS_OUT);
    } catch (err) {
      console.warn(err);
      setMode("still");
      return;
    }
    setMode("gl");
    const s = sim.current;
    const vao = gl.createVertexArray();
    const fbo = gl.createFramebuffer();
    const tex = gl.createTexture();
    let W = 0, H = 0, cw = 1, ch = 1;
    let scale = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      cw = wrap.clientWidth;
      ch = wrap.clientHeight;
      let k = scale;
      if (cw * ch * k * k > 1.1e6) k = Math.sqrt(1.1e6 / (cw * ch));
      const w = Math.max(2, Math.round(cw * k)), h = Math.max(2, Math.round(ch * k));
      s.dirty = true;
      if (w === W && h === H) return;
      W = w;
      H = h;
      canvas.width = W;
      canvas.height = H;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
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

    // the sun: low, warm, from the front left
    const Lraw = [-0.62, 0.5, 0.6];
    const ll = Math.hypot(Lraw[0], Lraw[1], Lraw[2]);
    const L = Lraw.map((v) => v / ll);
    let Lu = [L[2], 0, -L[0]];
    const lul = Math.hypot(Lu[0], Lu[2]);
    Lu = Lu.map((v) => v / lul);
    const Lv = [L[1] * Lu[2] - L[2] * Lu[1], L[2] * Lu[0] - L[0] * Lu[2], L[0] * Lu[1] - L[1] * Lu[0]];

    // the bead's state
    let bs = 0.36, v = IDLE_SPEED, vv = 0, heat = 0;
    const warm = new Float32Array(BINS);
    const warmPos = new Float32Array(BINS * 3);
    const toWorld = (l: Layout, x: number, y: number, z: number) => {
      const c = Math.cos(l.yaw), sn = Math.sin(l.yaw);
      return [c * x + sn * z, y + l.hy + 2 * l.tr + GAP, -sn * x + c * z];
    };
    let lay = s.narrow ? TALL : WIDE;
    let path = tubePath(lay);
    const relayout = () => {
      lay = s.narrow ? TALL : WIDE;
      path = tubePath(lay);
      for (let i = 0; i < BINS; i++) {
        const [x, y] = path.at((i + 0.5) / BINS);
        const p = toWorld(lay, x, y, path.zt);
        warmPos.set(p, i * 3);
      }
    };
    relayout();
    let lastNarrow = s.narrow;

    /** One step of the bead: a spring on its speed, and warmth laid down where it passes. */
    const step = (dt: number, hot: boolean) => {
      const target = hot ? HOVER_SPEED : IDLE_SPEED;
      vv += (SPEED_SPRING * (target - v) - SPEED_DAMP * vv) * dt;
      v += vv * dt;
      heat += ((hot ? 1 : 0) - heat) * Math.min(1, dt * 2.2);
      const prev = bs;
      bs = (bs + Math.max(0.01, v) * dt) % 1;
      const decay = Math.exp(-dt / WARM_DECAY);
      for (let i = 0; i < BINS; i++) warm[i] *= decay;
      // spread the deposit over the bins the bead crossed this step
      const gain = (0.25 + 2.4 * heat) * Math.max(0, v) * dt * BINS * 0.9;
      const a = prev * BINS - 0.5, b = a + Math.max(0.01, v) * dt * BINS;
      for (let f = Math.floor(a); f <= Math.floor(b) + 1; f++) {
        const i = ((f % BINS) + BINS) % BINS;
        const cover = clamp(Math.min(b, f + 1.5) - Math.max(a, f - 0.5), 0, 1);
        warm[i] = Math.min(1.5, warm[i] + gain * cover * 0.5);
      }
    };
    // start already warm, as if the bead had just run a fast lap
    // and finish that lap with the bead on the top run, where it shows best
    const PARK = 0.47;
    for (let i = 0; i < 240; i++) step(1 / 60, i < 170);
    const travelled = bs - 0.36;
    warm.fill(0);
    bs = (((PARK - travelled) % 1) + 1) % 1;
    v = IDLE_SPEED;
    vv = 0;
    heat = 0;
    for (let i = 0; i < 240; i++) step(1 / 60, i < 170);

    const draw = (t: number) => {
      if (s.narrow !== lastNarrow) {
        lastNarrow = s.narrow;
        relayout();
      }
      const aspect = cw / ch;
      const n = lay.narrow;
      const look = n ? [0.02, 0.7, 0] : [0.04, 0.53, 0];
      const dist = n ? 3.7 : 3.25;
      const drift = reduce ? 0 : 1;
      const cam = [
        look[0] + (n ? 0.32 : 0.55) + s.cx * 0.22 + drift * 0.04 * Math.sin(t * 0.23),
        look[1] + (n ? 0.62 : 0.5) - s.cy * 0.08 + drift * 0.012 * Math.sin(t * 0.31 + 1.3),
        dist,
      ];
      let fw = [look[0] - cam[0], look[1] - cam[1], look[2] - cam[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]);
      fw = fw.map((x) => x / fl);
      let rt = [-fw[2], 0, fw[0]];
      const rl = Math.hypot(rt[0], rt[2]);
      rt = rt.map((x) => x / rl);
      const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      const needW = n ? 0.86 : 1.7, needH = n ? 1.2 : 1.02;
      const TAN = Math.max(needW / aspect, needH) / fl;

      const [bx, by] = path.at(bs);
      const bead = toWorld(lay, bx, by, path.zt);
      const [tx, ty] = path.at(bs - Math.min(0.06, Math.max(0.004, v * 0.045)));
      const tail = toWorld(lay, tx, ty, path.zt);
      const pow = 0.85 + 0.55 * heat;

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, W, H);
      gl.useProgram(prog);
      gl.uniform2f(U(prog, "uRes"), W, H);
      gl.uniform3fv(U(prog, "uCam"), cam);
      gl.uniform3fv(U(prog, "uFw"), fw);
      gl.uniform3fv(U(prog, "uRt"), rt);
      gl.uniform3fv(U(prog, "uUp"), up);
      gl.uniform1f(U(prog, "uTan"), TAN);
      gl.uniform2f(U(prog, "uHalf"), lay.hx, lay.hy);
      gl.uniform1f(U(prog, "uRc"), lay.rc);
      gl.uniform1f(U(prog, "uTh"), lay.th);
      gl.uniform1f(U(prog, "uYaw"), lay.yaw);
      gl.uniform1f(U(prog, "uLift"), path.lift);
      gl.uniform2f(U(prog, "uPA"), path.ax, path.ay);
      gl.uniform1f(U(prog, "uPR"), path.pr);
      gl.uniform1f(U(prog, "uTr"), lay.tr);
      gl.uniform1f(U(prog, "uZt"), path.zt);
      gl.uniform1f(U(prog, "uPer"), path.per);
      gl.uniform3fv(U(prog, "uBead"), bead);
      gl.uniform3fv(U(prog, "uTail"), tail);
      gl.uniform1f(U(prog, "uBeadS"), bs);
      gl.uniform1f(U(prog, "uBeadPow"), pow);
      gl.uniform3fv(U(prog, "uWarmPos[0]"), warmPos);
      gl.uniform1fv(U(prog, "uWarm[0]"), warm);
      gl.uniform3fv(U(prog, "uL"), L);
      gl.uniform3fv(U(prog, "uLu"), Lu);
      gl.uniform3fv(U(prog, "uLv"), Lv);
      gl.uniform3f(U(prog, "uSun"), 2.5, 2.02, 1.5);
      gl.uniform1f(U(prog, "uTime"), reduce ? 0 : t);
      gl.uniform1f(U(prog, "uFocus"), fl);
      gl.uniform1f(U(prog, "uAperture"), 1.1);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.useProgram(progOut);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(U(progOut, "uScene"), 0);
      gl.uniform2f(U(progOut, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(progOut, "uMaxR"), H * 0.009);
      gl.uniform1f(U(progOut, "uTime"), reduce ? 0 : t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // lay the text on the card face with the same camera, as a CSS projective matrix
      const proj = (p: number[]) => {
        const d = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]];
        const xv = d[0] * rt[0] + d[1] * rt[1] + d[2] * rt[2];
        const yv = d[0] * up[0] + d[1] * up[1] + d[2] * up[2];
        const zv = d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2];
        return [cw * 0.5 * (1 + xv / (zv * TAN * aspect)), ch * 0.5 * (1 - yv / (zv * TAN))];
      };
      const ix = lay.hx - lay.pad, iy = lay.hy - lay.pad;
      const z = lay.th + 0.0005;
      const [x0, y0] = proj(toWorld(lay, -ix, iy, z));
      const [x1, y1] = proj(toWorld(lay, ix, iy, z));
      const [x2, y2] = proj(toWorld(lay, ix, -iy, z));
      const [x3, y3] = proj(toWorld(lay, -ix, -iy, z));
      const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
      const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
      const den = dx1 * dy2 - dx2 * dy1;
      const g = (dx3 * dy2 - dx2 * dy3) / den, h = (dx1 * dy3 - dx3 * dy1) / den;
      const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
      const pw = n ? 340 : 620, ph = Math.round((pw * iy) / ix);
      plate.style.width = `${pw}px`;
      plate.style.height = `${ph}px`;
      plate.style.transform = `matrix3d(${a / pw},${d / pw},0,${g / pw},${b / ph},${e / ph},0,${h / ph},0,0,1,0,${x0},${y0},0,1)`;
    };

    let raf = 0, visible = true, last = performance.now(), slow = 0, frames = 0, fpsT = last, fpsN = 0;
    const t0 = last;
    const tick = (now: number) => {
      const real = now - last;
      const dt = Math.min(0.05, real / 1000);
      last = now;
      if (reduce) {
        if (s.dirty) {
          draw(0);
          s.dirty = false;
        }
      } else {
        // a demo lap now and then, when nobody is touching it; the first one is under way at load
        const idle = now - s.lastTouch > 4000;
        const since = now - t0;
        const demo = idle && (since < 3200 || (since - 3200) % DEMO_EVERY > DEMO_EVERY - 2600);
        const sub = Math.max(1, Math.ceil(dt / 0.008));
        for (let i = 0; i < sub; i++) step(dt / sub, s.hot || demo);
        s.cx += (s.px - s.cx) * Math.min(1, dt * 2.5);
        s.cy += (s.py - s.cy) * Math.min(1, dt * 2.5);
        draw((now - t0) / 1000);
        fpsN++;
        if (now - fpsT > 1000) {
          wrap.dataset.fps = String(Math.round((fpsN * 1000) / (now - fpsT)));
          fpsN = 0;
          fpsT = now;
        }
        // measure, do not guess: render fewer pixels if this machine cannot keep up
        if (++frames > 30) {
          slow = slow * 0.92 + (real > 22 ? 1 : 0) * 0.08;
          if (slow > 0.6 && scale > 0.5) {
            scale *= 0.85;
            slow = 0;
            frames = 0;
            resize();
          }
        }
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const restart = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      restart();
    });
    io.observe(wrap);
    document.addEventListener("visibilitychange", restart);
    raf = requestAnimationFrame(tick);
    const move = (ev: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      s.px = clamp(((ev.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      s.py = clamp(((ev.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    };
    const leave = () => {
      s.px = 0;
      s.py = 0;
    };
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", restart);
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerleave", leave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduce]);

  const heat = (on: boolean) => () => {
    sim.current.hot = on;
    sim.current.lastTouch = performance.now();
  };

  return (
    <section className="relative overflow-hidden bg-[#7a4a2a]">
      <div
        ref={wrapRef}
        className="relative h-[640px] w-full select-none sm:h-[680px]"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") {
            sim.current.hot = !sim.current.hot;
            sim.current.lastTouch = performance.now();
          }
        }}
      >
        <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full ${mode === "still" ? "hidden" : ""}`} />
        {/* the card's words: real text, projected onto the card face and multiplied into the light */}
        <div
          ref={plateRef}
          className={`absolute left-0 top-0 origin-top-left ${mode === "gl" ? "" : "hidden"}`}
          style={{ mixBlendMode: "multiply", willChange: "transform" }}
          onPointerEnter={heat(true)}
          onPointerLeave={heat(false)}
          onFocus={heat(true)}
          onBlur={heat(false)}
        >
          <CardText narrow={narrow} />
        </div>
        {mode === "still" && <Still narrow={narrow} onHot={heat} />}
      </div>
    </section>
  );
}

/** The same table and card for browsers without WebGL 2: a warm photograph-like composition in plain CSS. */
function Still({ narrow, onHot }: { narrow: boolean; onHot: (on: boolean) => () => void }) {
  return (
    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #b9875f 0%, #a5734d 34%, #6b3b1d 34.2%, #8a5229 60%, #5a2f14 100%)" }}>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 top-[34%]" style={{ background: "repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 26px, rgba(30,10,0,0.45) 26px 28px), radial-gradient(60% 50% at 30% 30%, rgba(255,214,160,0.35), transparent 70%)" }} />
      <div className="absolute inset-0 grid place-items-center px-4">
        <div
          className="relative w-full"
          style={{ maxWidth: narrow ? 360 : 700, aspectRatio: narrow ? "1 / 1.38" : "1.64 / 1", borderRadius: 22, background: "#e9e1d2", boxShadow: "30px 26px 40px -10px rgba(40,15,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.06)" }}
          onPointerEnter={onHot(true)}
          onPointerLeave={onHot(false)}
        >
          <div aria-hidden="true" className="absolute inset-[6px] rounded-[18px]" style={{ boxShadow: "inset 0 0 0 7px rgba(255,255,255,0.35), inset 0 0 0 8px rgba(120,140,120,0.35), inset 0 0 14px 6px rgba(255,170,90,0.35)" }} />
          <style>{`@keyframes glass-tube-border-card-bead { 0% { left: 6%; } 100% { left: 92%; } } .glass-tube-border-card-bead { animation: glass-tube-border-card-bead 5s cubic-bezier(0.45, 0, 0.3, 1) infinite alternate; } @media (prefers-reduced-motion: reduce) { .glass-tube-border-card-bead { animation: none; } }`}</style>
          <div aria-hidden="true" className="glass-tube-border-card-bead absolute h-2 w-2 rounded-full" style={{ top: 8, left: "62%", background: "#fff3df", boxShadow: "0 0 8px 3px rgba(255,170,80,0.8), 0 0 30px 10px rgba(255,140,50,0.35)" }} />
          <div className="absolute" style={{ inset: narrow ? "8% 10%" : "12% 9%" }}>
            <CardText narrow={narrow} />
          </div>
        </div>
      </div>
    </div>
  );
}
