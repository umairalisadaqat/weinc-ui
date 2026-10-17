import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Everything etched into the card. Change the words here and the laser follows. */
const card = {
  house: "TESSERA",
  tier: "RESERVE",
  number: "1234 5678 9012 3456", // a placeholder, not a real card number
  memberLabel: "MEMBER",
  member: "ILSE MARROW",
  validLabel: "VALID THRU",
  valid: "09/31",
  serial: "No. 0417",
  signature: "Ilse Marrow",
  small: [
    "This card belongs to Tessera Reserve. If you find it,",
    "please hand it in at any Tessera house or write to members@tessera.example",
  ],
};
const sides = [
  { tag: "Face", title: "Ilse Marrow" },
  { tag: "Reverse", title: "Signed and numbered" },
];

const TILT = 0.2; // how far the card rocks toward the pointer, in radians
const SPRING = 60; // pull toward the pose it is asked for
const DAMPING = 8.5; // lower for more wobble
const FLIP_SPRING = 26;
const FLIP_DAMPING = 5.2; // lower for more overshoot when it turns over
const REST_YAW = -0.1; // the card lies a little askew in the tray
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// The card, in metres of a scene where it is 1.6 wide: the 85.6 by 54 mm proportion, a 1 mm plate.
const HX = 0.8;
const HY = 0.5047;
const HT = 0.011;
const CR = 0.06;
const TW = 1600;
const TH = 1010;

const GLSL_HEAD = `#version 300 es
precision highp float;
precision highp sampler2DArray;
const vec2 HS = vec2(${HX}, ${HY});
const float CR = ${CR};
const vec3 SUN = vec3(-0.4196, 0.6594, -0.6237);
const vec3 SUNC = vec3(1.0, 0.92, 0.80);
const vec3 SKY = vec3(0.56, 0.64, 0.78);
const float WZ = -3.2;
uniform vec3 uC, uU, uV, uN;
uniform sampler2DArray uMat;
uniform vec3 uCam, uRt, uUp, uFw;
uniform float uTan, uAspect, uFocus, uAperture, uTime;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.1 + 7.3) + 0.125 * vnoise(p * 4.3 + 1.7) + 0.0625 * vnoise(p * 8.9); }
float sdCard(vec2 p) { vec2 q = abs(p) - HS + CR; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - CR; }

// a box rounded in plan by rx and along every edge by re
float sdRR(vec3 p, vec3 b, float rx, float re) {
  vec2 q = abs(p.xz) - b.xz + rx;
  float d2 = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rx;
  vec2 w = vec2(d2 + re, abs(p.y) - b.y + re);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - re;
}
// the stone tray: a honed slab with a shallow pocket cut into it, the pocket floor at y = 0
float sdTray(vec3 p) {
  float o = sdRR(p - vec3(0.0, 0.0025, 0.0), vec3(1.3, 0.0625, 0.92), 0.17, 0.022);
  float i = sdRR(p - vec3(0.0, 0.2, 0.0), vec3(1.12, 0.2, 0.74), 0.09, 0.045);
  return max(o, -i);
}
float softShadow(vec3 ro, vec3 ld) {
  float res = 1.0, t = 0.004;
  for (int i = 0; i < 28; i++) {
    float h = sdTray(ro + ld * t);
    res = min(res, 12.0 * h / t);
    t += clamp(h, 0.006, 0.12);
    if (res < 0.002 || t > 2.2) break;
  }
  return clamp(res, 0.0, 1.0);
}
// the window behind the tray: follow the sun back to its glass and see whether a glazing bar is in the way
float pane(vec3 P) {
  float t = (WZ - P.z) / SUN.z;
  vec3 q = P + SUN * t;
  float w = 0.0093 * t + 0.004;
  float open = smoothstep(-w, w, q.x + 5.5) * smoothstep(-w, w, 3.0 - q.x) * smoothstep(-w, w, q.y - 1.0) * smoothstep(-w, w, 9.0 - q.y);
  return open * smoothstep(0.05 - w, 0.05 + w, abs(q.x + 1.0)) * smoothstep(0.045 - w, 0.045 + w, abs(q.y - 2.7));
}
// the room as a mirror sees it: limewashed walls, a bright ceiling, the tall window and its bars, the table below
vec3 room(vec3 ro, vec3 rd, float s) {
  vec3 c = mix(vec3(0.12, 0.115, 0.11), vec3(0.3, 0.3, 0.3), smoothstep(-0.05, 0.85, rd.y));
  c += vec3(0.3, 0.28, 0.25) * smoothstep(0.3, 0.95, dot(rd, normalize(vec3(0.9, 0.35, 0.1)))); // a lit wall on the right
  if (rd.z < -0.02) {
    float t = (WZ - ro.z) / rd.z;
    vec3 q = ro + rd * t;
    float w = s * t + 0.012;
    // the mirror sees the nearest bay of the window: two lights wide, with a sill and a head
    float open = smoothstep(-w, w, q.x + 1.9) * smoothstep(-w, w, 0.5 - q.x) * smoothstep(-w, w, q.y - 1.0) * smoothstep(-w, w, 4.5 - q.y);
    float bars = smoothstep(0.05 - w, 0.05 + w, abs(q.x + 1.0)) * smoothstep(0.045 - w, 0.045 + w, abs(q.y - 2.7));
    vec3 sky = mix(vec3(1.0, 0.97, 0.92), vec3(0.7, 0.8, 1.0), smoothstep(1.0, 4.5, q.y)) * 5.0;
    c = mix(c, sky, open * bars);
  }
  if (rd.y < 0.0) c = mix(c, vec3(0.3, 0.28, 0.25), smoothstep(0.0, -0.12, rd.y));
  return c;
}

// how much of a round lamp at L a point P can see past the card
float lit(vec3 P, vec3 L, float rl) {
  vec3 d = L - P;
  float dn = dot(d, uN);
  if (abs(dn) < 1e-5) return 1.0;
  float t = dot(uC - P, uN) / dn;
  if (t <= 0.0 || t >= 1.0) return 1.0;
  vec3 q = P + d * t - uC;
  float w = rl * t + 0.002;
  return smoothstep(-w, w, sdCard(vec2(dot(q, uU), dot(q, uV))));
}

vec3 tonemap(vec3 x) { x *= 0.74; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
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
vec3 trayN(vec3 p) {
  const vec2 k = vec2(1.0, -1.0);
  const float e = 0.0012;
  return normalize(k.xyy * sdTray(p + k.xyy * e) + k.yyx * sdTray(p + k.yyx * e) + k.yxy * sdTray(p + k.yxy * e) + k.xxx * sdTray(p + k.xxx * e));
}
float occ(vec3 p, vec3 n) {
  float a = 0.0, w = 1.0;
  for (int i = 1; i <= 5; i++) {
    float h = 0.012 * float(i * i);
    a += w * (h - min(sdTray(p + n * h), p.y + 0.06 + n.y * h));
    w *= 0.6;
  }
  return clamp(1.0 - 3.2 * a, 0.0, 1.0);
}
// pale travertine: soft bands laid down along its length, a few open pores, a honed (not polished) face
vec3 stone(vec3 P) {
  float warp = fbm(P.xz * vec2(1.4, 2.2) + 4.0);
  float band = fbm(vec2(P.x * 0.7 + warp * 0.9, P.z * 5.5 + P.y * 9.0 + warp * 2.4));
  vec3 c = mix(vec3(0.66, 0.6, 0.52), vec3(0.87, 0.835, 0.775), smoothstep(0.3, 0.7, band));
  c = mix(c, vec3(0.78, 0.7, 0.6), 0.35 * smoothstep(0.55, 0.8, fbm(P.xz * vec2(0.6, 3.5) + 9.0)));
  c *= 0.965 + 0.05 * vnoise(P.xz * 70.0 + P.y * 50.0);
  vec2 pq = P.xz * vec2(34.0, 95.0) + P.y * 60.0 + vec2(fbm(P.xz * 9.0), 0.0) * 3.0;
  float pore = smoothstep(0.84, 0.95, vnoise(pq)) * smoothstep(0.4, 0.7, vnoise(P.xz * 4.0 + 2.0));
  return c * (1.0 - 0.3 * pore);
}
void main() {
  vec2 ndc = vUv * 2.0 - 1.0;
  vec3 ro = uCam;
  vec3 rd = normalize(uFw + uRt * (ndc.x * uTan * uAspect) + uUp * (ndc.y * uTan));
  float tHit = -1.0;
  vec3 bmin = vec3(-1.31, -0.062, -0.93), bmax = vec3(1.31, 0.068, 0.93);
  vec3 inv = 1.0 / rd;
  vec3 ta = (bmin - ro) * inv, tb = (bmax - ro) * inv;
  vec3 tmn = min(ta, tb), tmx = max(ta, tb);
  float tn = max(max(tmn.x, tmn.y), tmn.z), tf = min(min(tmx.x, tmx.y), tmx.z);
  if (tf > max(tn, 0.0)) {
    float t = max(tn, 0.0);
    for (int i = 0; i < 80; i++) {
      float d = sdTray(ro + rd * t);
      if (d < 0.00025 * t) { tHit = t; break; }
      t += d;
      if (t > tf) break;
    }
  }
  bool tray = tHit > 0.0;
  if (!tray) {
    if (rd.y >= -1e-3) { o = pack(room(ro, rd, 0.1), 80.0); return; }
    tHit = (-0.06 - ro.y) / rd.y;
  }
  vec3 P = ro + rd * tHit;
  vec3 n = tray ? trayN(P) : vec3(0.0, 1.0, 0.0);
  vec3 alb = tray ? stone(P) : vec3(0.3, 0.255, 0.205) * (0.9 + 0.16 * fbm(P.xz * vec2(1.2, 9.0))) * (0.95 + 0.08 * vnoise(P.xz * vec2(40.0, 400.0)));

  // sun through the window: blocked by the glazing bars, the tray's own rim and the card
  float sv = max(dot(n, SUN), 0.0) * pane(P) * softShadow(P + n * 0.002, SUN) * lit(P, P + SUN * 20.0, 0.5);
  // the sky through the same window, and the room, both partly hidden under the card
  float ao = occ(P, n);
  float under = mix(1.0, lit(P, P + vec3(-0.6, 2.4, -1.6), 2.6), 0.85);
  vec3 amb = SKY * (0.42 + 0.22 * n.y) * ao * under + vec3(0.2, 0.17, 0.13) * 0.25 * ao;
  vec3 col = alb * (SUNC * 2.5 * sv + amb);
  // honed stone keeps a faint sheen where the window lands
  vec3 V = -rd;
  float F = 0.03 + 0.97 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
  col += F * room(P, reflect(rd, n), 0.35) * 0.35 * ao * under;
  col += SUNC * sv * 0.25 * pow(max(dot(n, normalize(SUN + V)), 0.0), 60.0);
  o = pack(col, dot(rd, uFw) * tHit);
}`;

const VS_CARD = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNor;
uniform vec3 uC, uU, uV, uN, uCam, uRt, uUp, uFw;
uniform float uTan, uAspect;
out vec3 vW; out vec3 vL; out vec3 vNl;
void main() {
  vW = uC + uU * aPos.x + uV * aPos.y + uN * aPos.z;
  vL = aPos; vNl = aNor;
  vec3 d = vW - uCam;
  float z = dot(d, uFw);
  gl_Position = vec4(dot(d, uRt) / (uTan * uAspect), dot(d, uUp) / uTan, (z * 30.1 - 6.0) / 29.9, z);
}`;

const FS_CARD = `${GLSL_HEAD}
in vec3 vW; in vec3 vL; in vec3 vNl;
out vec4 o;
const vec3 TI = vec3(0.56, 0.535, 0.50); // titanium, a touch warmer and darker than steel
void main() {
  vec3 V = normalize(uCam - vW);
  vec3 nl = normalize(vNl);
  vec3 Ng = normalize(uU * nl.x + uV * nl.y + uN * nl.z);
  float face = smoothstep(0.75, 0.98, abs(nl.z));
  float side = vL.z > 0.0 ? 1.0 : -1.0;
  float vis = pane(vW) * softShadow(vW + Ng * 0.004, SUN);

  // the edge: a polished chamfer, an ordinary mirror
  vec3 Re = reflect(-V, Ng);
  float Fe = pow(1.0 - max(dot(Ng, V), 0.0), 5.0);
  vec3 edge = mix(TI, vec3(1.0), Fe) * (room(vW, Re, 0.02) * 0.9 + SUNC * 3.0 * vis * 6.0 * pow(max(dot(Ng, normalize(SUN + V)), 0.0), 120.0));
  vec3 col = edge;

  if (face > 0.0) {
    vec2 uv = vL.xy / HS * 0.5 + 0.5;
    if (side < 0.0) uv.x = 1.0 - uv.x;
    float layer = side > 0.0 ? 0.0 : 1.0;
    vec3 m = texture(uMat, vec3(uv, layer)).rgb;
    // the etch sits a hair below the plate, so its walls catch light
    vec2 e = vec2(1.4 / ${TW}.0, 1.4 / ${TH}.0);
    float hx = texture(uMat, vec3(uv + vec2(e.x, 0.0), layer), 0.5).g - texture(uMat, vec3(uv - vec2(e.x, 0.0), layer), 0.5).g;
    float hy = texture(uMat, vec3(uv + vec2(0.0, e.y), layer), 0.5).g - texture(uMat, vec3(uv - vec2(0.0, e.y), layer), 0.5).g;
    vec2 g = vec2(hx, hy) * 3.0 * clamp(1.4 / (fwidth(uv.x) * ${TW}.0), 0.0, 1.0);
    float etch = smoothstep(0.1, 0.6, m.r);
    float pol = m.b;
    vec2 pp = vL.xy * vec2(side, 1.0);

    // brushing: fine grooves run along the card's length, so the surface only tilts across them
    float fade = clamp(1.0 / (fwidth(pp.y) * 900.0) - 0.4, 0.0, 1.0);
    float gro = (vnoise(vec2(pp.x * 3.0, pp.y * 900.0)) - 0.5) * fade + (vnoise(vec2(pp.x * 1.3 + 9.0, pp.y * 260.0)) - 0.5) * 0.8;
    float slow = fbm(pp * 2.2 + 3.0) - 0.5;
    vec2 tiltL = -g + vec2(0.0, gro * 0.035 + slow * 0.03) * (1.0 - pol);
    vec3 N = normalize(Ng + uU * (tiltL.x * side) + uV * tiltL.y);
    vec3 T = normalize(uU - N * dot(uU, N));
    vec3 B = cross(N, T);
    float NV = max(dot(N, V), 1e-3);
    vec3 F = TI + (1.0 - TI) * pow(1.0 - NV, 5.0);

    // the room smeared across the grooves: a fan of reflections spread along B
    float spread = mix(0.26, 0.015, pol);
    vec3 env = vec3(0.0); float ws = 0.0;
    for (int k = -6; k <= 6; k++) {
      float a = float(k) / 6.0;
      float wt = exp(-a * a * 2.2);
      env += room(vW, reflect(-V, normalize(N + B * a * spread)), 0.02 + spread * 0.08) * wt;
      ws += wt;
    }
    env /= ws;
    // the sun as an anisotropic highlight: narrow along the grooves, long across them
    vec3 L = SUN, H = normalize(L + V);
    float NL = max(dot(N, L), 0.0);
    float aT = mix(0.045, 0.02, pol), aB = mix(0.3, 0.02, pol);
    float hn = max(dot(H, N), 1e-3);
    float ward = NL * exp(-(pow(dot(H, T) / aT, 2.0) + pow(dot(H, B) / aB, 2.0)) / (hn * hn)) / (12.566 * aT * aB * sqrt(max(NL * NV, 1e-4)));
    vec3 metal = F * (env + SUNC * 3.0 * vis * min(ward, 14.0) * 0.3);
    metal *= 0.9 + 0.22 * (gro * 0.5 + 0.5) * (1.0 - pol);

    // the laser mark: a dark, matte oxide with a faint frost
    float frost = vnoise(pp * 1400.0);
    vec3 et = vec3(0.03, 0.029, 0.028) * (0.8 + 0.4 * frost) * (SUNC * 2.5 * vis * NL + SKY * 0.5 + vec3(0.06));
    et += 0.025 * room(vW, reflect(-V, N), 0.5);
    col = mix(metal, et, etch);
    col = mix(edge, col, face);
  }
  o = pack(col, dot(vW - uCam, uFw));
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
  float s0 = c0.a * 2.0 - 1.0;
  float coc0 = abs(s0);
  vec3 lin0 = pow(c0.rgb, vec3(2.2));
  float w0 = 1.0 / (1.03 - max(lin0.r, max(lin0.g, lin0.b)));
  vec3 acc = lin0 * w0; float wsum = w0;
  float rot = 6.2832 * ign(gl_FragCoord.xy);
  for (int k = 1; k < 36; k++) {
    float r = k < 26 ? sqrt(float(k) / 26.0) * uMaxR : sqrt(float(k - 25) / 10.0) * min(uMaxR, 3.0);
    float a = float(k) * 2.39996 + rot;
    vec4 s = texture(uScene, vUv + vec2(cos(a), sin(a)) * r * uPx);
    float sc = s.a * 2.0 - 1.0;
    float cs = abs(sc);
    if (sc > s0) cs = min(cs, coc0 * 1.6 + 0.02);
    vec3 lin = pow(s.rgb, vec3(2.2));
    float w = smoothstep(r - 1.0, r + 1.0, cs * uMaxR) / (1.03 - max(lin.r, max(lin.g, lin.b)));
    acc += lin * w; wsum += w;
  }
  o = vec4(pow(acc / wsum, vec3(1.0 / 2.2)), coc0);
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
  float r = clamp(c.a * 4.0, 0.0, 1.0) * 1.4;
  vec3 col = c.rgb * 4.0;
  for (int k = 0; k < 8; k++) {
    float a = float(k) * 0.7854;
    col += texture(uScene, vUv + vec2(cos(a), sin(a)) * r * (k % 2 == 0 ? 1.0 : 1.9) * uPx).rgb;
  }
  col /= 12.0;
  // a little bloom where the sheen runs hottest
  vec3 glow = vec3(0.0);
  float rot = 6.2832 * ign(gl_FragCoord.xy);
  for (int k = 0; k < 12; k++) {
    float a = float(k) * 2.39996 + rot;
    float d = 2.0 + 16.0 * sqrt(float(k) / 12.0);
    vec3 s = texture(uScene, vUv + vec2(cos(a), sin(a)) * d * uPx).rgb;
    glow += s * smoothstep(0.9, 1.0, min(s.r, min(s.g, s.b)));
  }
  col += glow / 12.0 * vec3(0.22, 0.21, 0.19);
  vec2 q = vUv - 0.5;
  col *= 1.0 - 0.38 * dot(q, q);
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

/** The plate as triangles: two faces, a flat side, and a small chamfer-round between them. Position + normal. */
function cardMesh() {
  const SEG = 10;
  const B = 0.004;
  const ring = (d: number, z: number, tilt: number, nz: number) => {
    const out: number[][] = [];
    for (let k = 0; k < 4; k++) {
      const cx = (k === 0 || k === 3 ? 1 : -1) * (HX - CR);
      const cy = (k < 2 ? 1 : -1) * (HY - CR);
      for (let j = 0; j <= SEG; j++) {
        const a = ((k + j / SEG) * Math.PI) / 2;
        const dx = Math.cos(a), dy = Math.sin(a);
        out.push([cx + (CR - d) * dx, cy + (CR - d) * dy, z, dx * tilt, dy * tilt, nz]);
      }
    }
    return out;
  };
  const rings: number[][][] = [];
  for (const sgn of [1, -1]) {
    const order = sgn > 0 ? [0, 30, 60, 90] : [90, 60, 30, 0];
    for (const deg of order) {
      const p = (deg * Math.PI) / 180;
      rings.push(ring(B * (1 - Math.sin(p)), sgn * (HT - B * (1 - Math.cos(p))), Math.sin(p), sgn * Math.cos(p)));
    }
  }
  const v: number[] = [];
  const M = rings[0].length;
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < M; i++) {
      const a = rings[r][i], b = rings[r][(i + 1) % M], c = rings[r + 1][i], d = rings[r + 1][(i + 1) % M];
      v.push(...a, ...b, ...c, ...b, ...d, ...c);
    }
  }
  for (const [r, z] of [[0, 1], [rings.length - 1, -1]]) {
    for (let i = 0; i < M; i++) v.push(0, 0, z * HT, 0, 0, z, ...rings[r][i], ...rings[r][(i + 1) % M]);
  }
  return new Float32Array(v);
}

type Channel = "etch" | "height" | "polish";

/** Draw one side of the plate into one channel: where the laser marked it, how deep, and where it was left mirror-polished. */
function paintSide(ctx: CanvasRenderingContext2D, side: number, ch: Channel) {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = { etch: "#000", height: "#808080", polish: "#000" }[ch];
  ctx.fillRect(0, 0, TW, TH);
  const put = (c: Partial<Record<Channel, string>>, draw: () => void) => {
    const col = c[ch];
    if (!col) return;
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    draw();
  };
  const tracked = (s: string, x: number, y: number, font: string, gap: number, align: "left" | "right" | "center" = "left") => {
    ctx.font = font;
    ctx.textAlign = "left";
    const widths = [...s].map((c) => ctx.measureText(c).width + gap);
    const total = widths.reduce((a, b) => a + b, 0) - gap;
    let cx = align === "left" ? x : align === "right" ? x - total : x - total / 2;
    [...s].forEach((c, i) => {
      ctx.fillText(c, cx, y);
      cx += widths[i];
    });
  };
  const ETCH = { etch: "#fff", height: "#606060" };
  // the tessera mark: a three by three mosaic of tiles, the centre one left mirror-bright
  const mark = (x: number, y: number, size: number) => {
    const g = size * 0.07;
    const t = (size - 2 * g) / 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const tx = x + c * (t + g), ty = y + r * (t + g);
        if (r === 1 && c === 1) put({ polish: "#fff", height: "#8c8c8c" }, () => ctx.fillRect(tx, ty, t, t));
        else if ((r + c) % 2 === 0) put(ETCH, () => ctx.fillRect(tx, ty, t, t));
        else
          put(ETCH, () => {
            ctx.lineWidth = Math.max(3, t * 0.08);
            ctx.strokeRect(tx + ctx.lineWidth / 2, ty + ctx.lineWidth / 2, t - ctx.lineWidth, t - ctx.lineWidth);
          });
      }
    }
  };
  ctx.textBaseline = "alphabetic";
  if (side === 0) {
    put(ETCH, () => tracked(card.house, 112, 196, `600 70px ${GROTESK}`, 26));
    put(ETCH, () => tracked(card.tier, 116, 246, `500 22px ${GROTESK}`, 12));
    mark(1370, 118, 118);
    put(ETCH, () => tracked(card.number, 112, 640, `500 84px ${GROTESK}`, 7));
    put(ETCH, () => ctx.fillRect(114, 712, 1372, 2));
    put(ETCH, () => {
      tracked(card.memberLabel, 116, 800, `600 20px ${GROTESK}`, 9);
      tracked(card.validLabel, 1486, 800, `600 20px ${GROTESK}`, 9, "right");
    });
    put(ETCH, () => {
      tracked(card.member, 112, 868, `500 46px ${GROTESK}`, 7);
      tracked(card.valid, 1486, 868, `500 46px ${GROTESK}`, 7, "right");
    });
  } else {
    put(ETCH, () => ctx.fillRect(0, 108, TW, 150));
    put(ETCH, () => tracked(card.serial, 112, 360, `600 22px ${GROTESK}`, 9));
    put(ETCH, () => {
      ctx.lineWidth = 3;
      ctx.strokeRect(112, 400, 900, 150);
    });
    put(ETCH, () => {
      ctx.font = `italic 84px ${SERIF}`;
      ctx.textAlign = "left";
      ctx.fillText(card.signature, 150, 505);
    });
    put(ETCH, () => tracked("AUTHORISED SIGNATURE", 114, 600, `600 18px ${GROTESK}`, 8));
    mark(1210, 372, 210);
    put(ETCH, () => {
      tracked(card.small[0], 114, 830, `500 25px ${GROTESK}`, 2);
      tracked(card.small[1], 114, 874, `500 25px ${GROTESK}`, 2);
    });
    put(ETCH, () => tracked(card.house, 1486, 874, `600 30px ${GROTESK}`, 12, "right"));
  }
}

type Sim = {
  roll: number; vroll: number; pitch: number; vpitch: number; flip: number; vflip: number; goal: number;
  px: number; py: number; inside: boolean; focus: number; t0: number; dirty: boolean;
};

export default function TitaniumTrayCard() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [side, setSide] = useState(0);
  const [mode, setMode] = useState<"pending" | "gl" | "still">("pending");
  const sim = useRef<Sim>({ roll: 0, vroll: 0, pitch: 0, vpitch: 0, flip: 0, vflip: 0, goal: 0, px: 0, py: 0, inside: false, focus: 3, t0: 0, dirty: true });

  const turn = useCallback(() => {
    const s = sim.current;
    s.goal += 1;
    s.vflip -= 1.6; // it digs in on one edge before it goes over
    s.dirty = true;
    setSide(((s.goal % 2) + 2) % 2);
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
    let progSet: WebGLProgram, progCard: WebGLProgram, progLens: WebGLProgram, progOut: WebGLProgram;
    try {
      progSet = program(gl, VS_FULL, FS_SET);
      progCard = program(gl, VS_CARD, FS_CARD);
      progLens = program(gl, VS_FULL, FS_LENS);
      progOut = program(gl, VS_FULL, FS_OUT);
    } catch {
      setMode("still");
      return;
    }
    setMode("gl");

    // one array texture, a layer per side: etch in red, depth in green, mirror polish in blue
    const levels = Math.floor(Math.log2(TW)) + 1;
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    const matTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, matTex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.RGBA8, TW, TH, 2);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    const scratch = document.createElement("canvas");
    const mix = document.createElement("canvas");
    scratch.width = mix.width = TW;
    scratch.height = mix.height = TH;
    const sctx = scratch.getContext("2d")!;
    const mctx = mix.getContext("2d")!;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    for (let layer = 0; layer < 2; layer++) {
      mctx.globalCompositeOperation = "source-over";
      mctx.fillStyle = "#000";
      mctx.fillRect(0, 0, TW, TH);
      for (const [ch, tint] of [["etch", "#f00"], ["height", "#0f0"], ["polish", "#00f"]] as const) {
        paintSide(sctx, layer, ch);
        sctx.globalCompositeOperation = "multiply";
        sctx.fillStyle = tint;
        sctx.fillRect(0, 0, TW, TH);
        mctx.globalCompositeOperation = "lighter";
        mctx.drawImage(scratch, 0, 0);
      }
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, TW, TH, 1, gl.RGBA, gl.UNSIGNED_BYTE, mix);
    }
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);

    const mesh = cardMesh();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    gl.bindVertexArray(null);
    const emptyVao = gl.createVertexArray();

    // multisampled scene, resolved to a texture for the lens pass (colour, with blur size in alpha)
    const msFbo = gl.createFramebuffer();
    const msColor = gl.createRenderbuffer();
    const msDepth = gl.createRenderbuffer();
    const resFbo = gl.createFramebuffer();
    const resTex = gl.createTexture();
    const lensFbo = gl.createFramebuffer();
    const lensTex = gl.createTexture();
    let W = 0, H = 0, scale = Math.min(window.devicePixelRatio || 1, 2);
    const samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES));
    const resize = () => {
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      let k = scale;
      if (cw * ch * k * k > 1.9e6) k = Math.sqrt(1.9e6 / (cw * ch));
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
    const TAN = Math.tan((17 * Math.PI) / 180);
    const pose = { c: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] };

    const shared = (p: WebGLProgram, cam: number[], rt: number[], up: number[], fw: number[], t: number) => {
      gl.useProgram(p);
      gl.uniform3fv(U(p, "uC"), pose.c);
      gl.uniform3fv(U(p, "uU"), pose.u);
      gl.uniform3fv(U(p, "uV"), pose.v);
      gl.uniform3fv(U(p, "uN"), pose.n);
      gl.uniform1i(U(p, "uMat"), 1);
      gl.uniform3fv(U(p, "uCam"), cam);
      gl.uniform3fv(U(p, "uRt"), rt);
      gl.uniform3fv(U(p, "uUp"), up);
      gl.uniform3fv(U(p, "uFw"), fw);
      gl.uniform1f(U(p, "uTan"), TAN);
      gl.uniform1f(U(p, "uAspect"), W / H);
      gl.uniform1f(U(p, "uFocus"), s.focus);
      gl.uniform1f(U(p, "uAperture"), 1.2);
      gl.uniform1f(U(p, "uTime"), t);
    };

    const draw = (t: number) => {
      // the plate's pose: turn over about its short axis, rock under the pointer, then lie askew in the tray
      const A = s.flip * Math.PI + s.roll;
      const Pt = s.pitch;
      const cy = Math.cos(REST_YAW), sy = Math.sin(REST_YAW);
      const rot = (x: number, y: number, z: number) => {
        [x, z] = [x * Math.cos(A) + z * Math.sin(A), -x * Math.sin(A) + z * Math.cos(A)];
        [y, z] = [y * Math.cos(Pt) - z * Math.sin(Pt), y * Math.sin(Pt) + z * Math.cos(Pt)];
        const wx = x, wy = z, wz = -y;
        return [wx * cy + wz * sy, wy, -wx * sy + wz * cy];
      };
      pose.u = rot(1, 0, 0);
      pose.v = rot(0, 1, 0);
      pose.n = rot(0, 0, 1);
      // it rests on whichever corner is lowest, so a tilt makes it rock on an edge instead of sinking into the stone
      let low = Infinity;
      for (const ex of [-1, 1]) for (const ey of [-1, 1]) for (const ez of [-1, 1]) low = Math.min(low, rot(ex * (HX - CR * 0.3), ey * (HY - CR * 0.3), ez * HT)[1]);
      const spin = Math.sin(clamp(Math.abs(s.flip - Math.round(s.flip)), 0, 0.5) * Math.PI);
      pose.c = [0.03, -low + 0.0008 + 0.16 * spin * spin, 0.02];

      const aspect = W / H;
      const el = 0.92;
      const dist = Math.max(1.3 / TAN, 1.72 / (TAN * aspect));
      const drift = reduce ? 0 : 1;
      const tgt = [0, 0.0, 0.08];
      const az = drift * 0.035 * Math.sin(t * 0.21);
      const cam = [tgt[0] + Math.sin(az) * Math.cos(el) * dist, tgt[1] + Math.sin(el) * dist + drift * 0.02 * Math.sin(t * 0.17 + 1), tgt[2] + Math.cos(az) * Math.cos(el) * dist];
      let fw = [tgt[0] - cam[0], tgt[1] - cam[1], tgt[2] - cam[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]);
      fw = fw.map((v) => v / fl);
      let rt = [-fw[2], 0, fw[0]];
      const rl = Math.hypot(rt[0], rt[2]);
      rt = rt.map((v) => v / rl);
      const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      s.focus = (pose.c[0] - cam[0]) * fw[0] + (pose.c[1] - cam[1]) * fw[1] + (pose.c[2] - cam[2]) * fw[2];

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
      shared(progCard, cam, rt, up, fw, t);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.length / 6);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msFbo);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, resFbo);
      gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, lensFbo);
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(progLens);
      gl.uniform1i(U(progLens, "uScene"), 2);
      gl.uniform2f(U(progLens, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(progLens, "uMaxR"), H * 0.009);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(progOut);
      gl.uniform1i(U(progOut, "uScene"), 3);
      gl.uniform2f(U(progOut, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(progOut, "uTime"), reduce ? 0 : t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const physics = (dt: number, t: number) => {
      // with nobody steering, the card rocks slowly so the window's reflection runs across the brushing
      const idle = s.inside ? 0 : 1;
      const wantRoll = (s.inside ? s.px * TILT : 0) + idle * 0.06 * Math.sin(t * 0.62 + 0.9);
      const wantPitch = (s.inside ? s.py * TILT * 0.7 : 0) + idle * 0.025 * Math.sin(t * 0.43 + 0.4);
      s.vroll += (SPRING * (wantRoll - s.roll) - DAMPING * s.vroll) * dt;
      s.roll += s.vroll * dt;
      s.vpitch += (SPRING * (wantPitch - s.pitch) - DAMPING * s.vpitch) * dt;
      s.pitch += s.vpitch * dt;
      s.vflip += (FLIP_SPRING * (s.goal - s.flip) - FLIP_DAMPING * s.vflip) * dt;
      s.flip += s.vflip * dt;
    };

    let raf = 0, visible = true, last = performance.now(), slow = 0, frames = 0;
    s.t0 = last;
    const tick = (now: number) => {
      const real = now - last;
      const dt = Math.min(0.05, real / 1000);
      last = now;
      const t = (now - s.t0) / 1000;
      if (reduce) {
        if (s.flip !== s.goal) s.dirty = true;
        s.flip = s.goal;
        s.vflip = 0;
        s.pitch = 0.05;
        s.roll = 0.03;
      } else {
        const sub = Math.max(1, Math.ceil(dt / 0.006));
        for (let i = 0; i < sub; i++) physics(dt / sub, t);
      }
      if (!reduce || s.dirty) {
        draw(reduce ? 0 : t);
        s.dirty = false;
        // measure, do not guess: if frames run long, render fewer pixels
        if (!reduce && ++frames > 20) {
          slow = slow * 0.92 + (real > 24 ? 1 : 0) * 0.08;
          if (slow > 0.6 && scale > 0.6) {
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

    let first: number[] | null = null;
    const move = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      s.px = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      s.py = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      // a pointer that is merely resting over the stage does not steer: it has to travel first
      if (first === null) first = [e.clientX, e.clientY];
      const moved = Math.hypot(e.clientX - first[0], e.clientY - first[1]) > 6;
      if (moved) first = [-1e6, -1e6];
      s.inside = moved && e.pointerType === "mouse";
    };
    const click = () => turn();
    const leave = () => {
      s.inside = false;
    };
    wrap.addEventListener("pointermove", move);
    canvas.addEventListener("click", click);
    wrap.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener("pointermove", move);
      canvas.removeEventListener("click", click);
      wrap.removeEventListener("pointerleave", leave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduce, turn]);

  const onKey = (e: React.KeyboardEvent) => {
    const s = sim.current;
    const nudge = (dx: number, dy: number) => {
      e.preventDefault();
      s.inside = true;
      s.px = clamp(s.px + dx, -1, 1);
      s.py = clamp(s.py + dy, -1, 1);
    };
    if (e.key === "ArrowLeft") nudge(-0.25, 0);
    else if (e.key === "ArrowRight") nudge(0.25, 0);
    else if (e.key === "ArrowUp") nudge(0, -0.25);
    else if (e.key === "ArrowDown") nudge(0, 0.25);
    else if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
      e.preventDefault();
      turn();
    }
  };

  const brushed =
    "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, rgba(0,0,0,0.04) 1px 2px), linear-gradient(100deg, #8d8a85 0%, #c9c6c0 30%, #f1efea 44%, #a9a59f 58%, #8b8782 100%)";
  const etched = "#2a2826";

  return (
    <section className="relative overflow-hidden bg-[#ddd7cd]">
      <div
        ref={wrapRef}
        role="group"
        aria-label="A brushed titanium membership card lying in a stone tray. Arrow keys rock it under the window light, Enter turns it over."
        tabIndex={0}
        onKeyDown={onKey}
        onBlur={() => (sim.current.inside = false)}
        className="relative h-[620px] w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2a2826]/60 sm:h-[780px]"
      >
        <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full cursor-pointer touch-pan-y ${mode === "still" ? "hidden" : ""}`} />

        {/* the same card laid out with plain elements, for browsers without WebGL 2 */}
        {mode === "still" && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "radial-gradient(70% 60% at 45% 40%, #efebe4 0%, #ddd7cd 60%, #c9c2b6 100%)", perspective: "1400px" }}>
            <div className="relative aspect-[1.6/1] w-[78%] max-w-[760px] rounded-[28px] bg-[#e4dfd6] p-[3.5%] shadow-[inset_0_2px_8px_rgba(80,70,55,0.35),0_30px_60px_rgba(80,70,55,0.25)]">
              <style>{`@keyframes titanium-tray-card-rock { from { transform: rotateX(26deg) rotateY(-5deg) rotateZ(-4deg); } to { transform: rotateX(22deg) rotateY(5deg) rotateZ(-3deg); } } .titanium-tray-card-rock { animation: titanium-tray-card-rock 4s ease-in-out infinite alternate; } @media (prefers-reduced-motion: reduce) { .titanium-tray-card-rock { animation: none; } }`}</style>
              <div
                className="titanium-tray-card-rock mx-auto mt-[6%] aspect-[1.585/1] w-[70%] rounded-[14px] p-[5%] shadow-[0_1px_0_#f5f3ef_inset,0_-1px_0_#6e6a64_inset,0_18px_30px_rgba(60,50,40,0.35)]"
                style={{ background: brushed, transform: "rotateX(26deg) rotateZ(-4deg)", fontFamily: GROTESK, color: etched }}
              >
                {side === 0 ? (
                  <div className="flex h-full flex-col justify-between">
                    <p className="text-[clamp(14px,2.6vw,26px)] font-semibold tracking-[0.3em]">{card.house}</p>
                    <p className="text-[clamp(12px,2.6vw,28px)] font-medium tracking-[0.08em] tabular-nums">{card.number}</p>
                    <p className="flex justify-between text-[clamp(8px,1.3vw,14px)] font-medium tracking-[0.14em]">
                      <span>{card.member}</span>
                      <span>{card.valid}</span>
                    </p>
                  </div>
                ) : (
                  <div className="flex h-full flex-col justify-between">
                    <div className="-mx-[7%] h-[18%] bg-[#2a2826]" />
                    <p className="text-[clamp(14px,2.4vw,26px)] italic" style={{ fontFamily: SERIF }}>{card.signature}</p>
                    <p className="text-[clamp(7px,1vw,11px)] font-medium tracking-[0.04em]">{card.small.join(" ")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-baseline justify-between p-5 text-[#24221f] sm:p-9">
          <p className="text-[22px] font-semibold leading-none tracking-[0.32em] sm:text-[26px]" style={{ fontFamily: GROTESK }}>
            {card.house}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#3d3a35] sm:text-[11px]" style={{ fontFamily: GROTESK }}>
            <span className="hidden sm:inline">Move to rock it, click to turn</span>
            <span className="sm:hidden">Tap to turn</span>
          </p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-9">
          <p aria-live="polite" className="text-[#1d1b18]">
            <span className="block text-[11px] font-medium uppercase tracking-[0.28em] text-[#3d3a35]" style={{ fontFamily: GROTESK }}>
              <span className="tabular-nums text-[#1d1b18]">{`0${side + 1}`}</span>
              <span className="mx-2 text-[#3d3a35]/60">/</span>
              <span className="tabular-nums">02</span>
              <span className="ml-4">{sides[side].tag}</span>
            </span>
            <span className="mt-2 block text-[34px] font-semibold leading-[0.95] sm:text-[64px]" style={{ fontFamily: GROTESK, letterSpacing: "-0.045em" }}>
              {sides[side].title}
            </span>
            <span className="sr-only">
              {side === 0 ? `. Card number ${card.number}, valid through ${card.valid}.` : `. Serial ${card.serial}, signed ${card.signature}.`}
            </span>
          </p>
          <button
            type="button"
            onClick={turn}
            aria-pressed={side === 1}
            className="pointer-events-auto inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full border border-[#24221f]/25 bg-[#f4f1ec]/70 pl-4 pr-5 text-[12px] font-medium uppercase tracking-[0.2em] text-[#1d1b18] backdrop-blur-sm transition hover:bg-[#f4f1ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24221f]"
            style={{ fontFamily: GROTESK }}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10a6 6 0 0 1 10.6-3.8M16 10a6 6 0 0 1-10.6 3.8M14.8 3v3.4h-3.4M5.2 17v-3.4h3.4" />
            </svg>
            Turn over
          </button>
        </div>
      </div>
    </section>
  );
}
