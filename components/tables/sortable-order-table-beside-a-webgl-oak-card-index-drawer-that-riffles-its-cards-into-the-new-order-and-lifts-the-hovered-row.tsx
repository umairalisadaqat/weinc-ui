import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The shop and its orders. Demo data: replace with your own rows. */
const SHOP = "Halden Paper Co.";
type Status = "Paid" | "Packed" | "Shipped" | "Delivered";
type Order = { id: string; customer: string; item: string; placed: string; total: number; status: Status };
const orders: Order[] = [
  { id: "2041", customer: "Ilse Varga", item: "Linen notebook, A5", placed: "2026-10-03", total: 48, status: "Shipped" },
  { id: "2042", customer: "Tomas Rehl", item: "Brass pen clips, set of 4", placed: "2026-10-03", total: 22.5, status: "Delivered" },
  { id: "2043", customer: "Wren Osei", item: "Ruled index cards, 500", placed: "2026-10-04", total: 16, status: "Paid" },
  { id: "2044", customer: "Marguerite Lund", item: "Oak desk tray", placed: "2026-10-05", total: 118, status: "Packed" },
  { id: "2045", customer: "Arun Mehra", item: "Fountain pen ink, sepia", placed: "2026-10-06", total: 31, status: "Shipped" },
  { id: "2046", customer: "Noor Haddad", item: "Wax seal kit", placed: "2026-10-07", total: 64, status: "Paid" },
  { id: "2047", customer: "Pia Castell", item: "Kraft envelopes, 50", placed: "2026-10-08", total: 12.75, status: "Delivered" },
  { id: "2048", customer: "Calum Frey", item: "Card file drawer, oak", placed: "2026-10-09", total: 186, status: "Packed" },
];

/** Tab colours of the index cards, one per status (sRGB hex). */
const STATUS: Record<Status, { hex: string; rank: number }> = {
  Paid: { hex: "#d8b25c", rank: 0 },
  Packed: { hex: "#cf8f78", rank: 1 },
  Shipped: { hex: "#93ab86", rank: 2 },
  Delivered: { hex: "#86a2bf", rank: 3 },
};

type Key = "id" | "customer" | "item" | "placed" | "total" | "status";
const columns: { key: Key; label: string; numeric?: boolean; wide?: boolean }[] = [
  { key: "id", label: "Order" },
  { key: "customer", label: "Customer" },
  { key: "item", label: "Item", wide: true },
  { key: "placed", label: "Placed", wide: true },
  { key: "total", label: "Total", numeric: true },
  { key: "status", label: "Status" },
];

const RIFFLE_SECONDS = 0.9; // how long one card takes to travel to its new place
const RIFFLE_STAGGER = 0.07; // delay between cards, by their new position
const RIFFLE_HEIGHT = 1.02; // how high a moving card is pulled out of the drawer
const HOVER_LIFT = 0.74; // how far the hovered row's card rises
const DEMO = true; // plays a short sort-and-point demo until the visitor touches anything

const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const TYPE = '"Courier Prime", "Courier New", Courier, ui-monospace, monospace';
const PAPER = "#f3eee5";
const INK = "#1f1b16";

const TAB_X = [-0.52, 0.0, 0.52];
const SLOT_Z = (s: number) => 0.92 - s * 0.255;
const CELL_W = 640, CELL_H = 456;

const money = (n: number) => `$${n.toFixed(2)}`;
const day = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]}`;
};
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lin = (hex: string) => [1, 3, 5].map((i) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2));

function compare(a: Order, b: Order, key: Key) {
  if (key === "total") return a.total - b.total;
  if (key === "status") return STATUS[a.status].rank - STATUS[b.status].rank || a.id.localeCompare(b.id);
  return String(a[key]).localeCompare(String(b[key])) || a.id.localeCompare(b.id);
}

const GLSL = `#version 300 es
precision highp float;
uniform vec3 uCam, uRt, uUp, uFw;
uniform float uTan, uAspect, uFocus, uAperture;
uniform vec2 uShift;
uniform vec4 uCard[8]; // z, lift, tilt, tab x
uniform vec3 uTab[8];
uniform sampler2D uInk;
in vec2 vUv;
out vec4 o;

const vec3 L = normalize(vec3(-0.62, 0.74, 0.30));
const float WALL = -2.7;
const vec3 SUN = vec3(1.0, 0.85, 0.66) * 3.1;
const vec3 SKY = vec3(0.70, 0.72, 0.78) * 0.7;

float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }

float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float sdRect(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float sdCap(vec3 p, vec3 a, vec3 b, float r) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }

vec3 cardLocal(vec3 p, int k) {
  vec4 c = uCard[k];
  vec3 q = p - vec3(0.0, 0.065 + c.y, c.x);
  float s = sin(c.z), co = cos(c.z);
  q.yz = mat2(co, s, -s, co) * q.yz;
  return q;
}
float sdCard(vec3 q, float tx) {
  float d2 = min(sdRect(q.xy - vec2(0.0, 0.5), vec2(0.8, 0.5), 0.03), sdRect(q.xy - vec2(tx, 1.03), vec2(0.17, 0.11), 0.035));
  vec2 w = vec2(d2, abs(q.z) - 0.0065);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0));
}

// 0 desk, 2 oak, 3 brass, 4 label, 10+k card k
vec2 map(vec3 p, bool desk) {
  vec2 r = vec2(desk ? p.y : 1e3, 0.0);
  float outer = sdBox(p - vec3(0.0, 0.3, -0.02), vec3(0.95, 0.3, 1.2)) - 0.008;
  float inner = sdBox(p - vec3(0.0, 0.76, -0.02), vec3(0.885, 0.71, 1.135));
  float front = sdBox(p - vec3(0.0, 0.34, 1.215), vec3(1.0, 0.34, 0.045)) - 0.012;
  float d = min(max(outer, -inner), front);
  if (d < r.x) r = vec2(d, 2.0);
  if (p.z > 1.18) {
    float b = sdCap(p, vec3(-0.21, 0.47, 1.335), vec3(0.21, 0.47, 1.335), 0.024);
    b = min(b, sdCap(p, vec3(-0.21, 0.47, 1.26), vec3(-0.21, 0.47, 1.335), 0.017));
    b = min(b, sdCap(p, vec3(0.21, 0.47, 1.26), vec3(0.21, 0.47, 1.335), 0.017));
    float fr = max(sdBox(p - vec3(0.0, 0.215, 1.268), vec3(0.22, 0.085, 0.01)) - 0.004, -sdBox(p - vec3(0.0, 0.215, 1.29), vec3(0.19, 0.058, 0.03)));
    b = min(b, fr);
    if (b < r.x) r = vec2(b, 3.0);
    float lab = sdBox(p - vec3(0.0, 0.215, 1.263), vec3(0.2, 0.065, 0.004));
    if (lab < r.x) r = vec2(lab, 4.0);
  }
  float bb = sdBox(p - vec3(0.0, 1.2, -0.05), vec3(0.86, 1.2, 1.3));
  if (bb < r.x) {
    for (int k = 0; k < 8; k++) {
      float c = sdCard(cardLocal(p, k), uCard[k].w);
      if (c < r.x) r = vec2(c, 10.0 + float(k));
    }
  }
  return r;
}
vec3 nrm(vec3 p, bool desk) {
  const vec2 e = vec2(0.0012, -0.0012);
  return normalize(e.xyy * map(p + e.xyy, desk).x + e.yyx * map(p + e.yyx, desk).x + e.yxy * map(p + e.yxy, desk).x + e.xxx * map(p + e.xxx, desk).x);
}
float shadow(vec3 ro) {
  float res = 1.0, t = 0.015;
  for (int i = 0; i < 44; i++) {
    float h = map(ro + L * t, false).x;
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.008, 0.22);
    if (res < 0.003 || t > 4.5) break;
  }
  return clamp(res, 0.0, 1.0);
}
float occl(vec3 p, vec3 n) {
  float o = 0.0, s = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.015 + 0.055 * float(i); o += (h - map(p + n * h, true).x) * s; s *= 0.72; }
  return clamp(1.0 - 2.4 * o, 0.0, 1.0);
}
// a tall window off to the left: the sun comes through its glazing bars
float gobo(vec3 p) {
  float t = (-4.2 - p.x) / L.x;
  vec3 h = p + L * t;
  float s = 0.012 + 0.016 * t;
  float win = smoothstep(-s, s, h.y - 0.3) * smoothstep(-s, s, 5.2 - h.y) * smoothstep(-s, s, h.z + 2.6) * smoothstep(-s, s, 3.4 - h.z);
  float mz = abs(fract((h.z + 0.35) / 1.45 + 0.5) - 0.5) * 1.45;
  float bars = smoothstep(0.035 - s, 0.035 + s, mz) * smoothstep(0.04 - s, 0.04 + s, abs(h.y - 3.05));
  return win * bars;
}
vec3 env(vec3 r) {
  vec3 c = mix(vec3(0.80, 0.74, 0.66), vec3(0.78, 0.84, 0.94), smoothstep(-0.2, 0.7, r.y));
  c += vec3(2.6, 2.4, 2.1) * smoothstep(0.45, 0.7, -r.x) * smoothstep(0.0, 0.2, r.y) * smoothstep(0.95, 0.6, r.y);
  return c;
}
float ggx(vec3 n, vec3 v, float rough) {
  vec3 h = normalize(L + v); float a = rough * rough, nh = max(dot(n, h), 0.0);
  float d = a * a / (3.14159 * pow(nh * nh * (a * a - 1.0) + 1.0, 2.0));
  return d * max(dot(n, L), 0.0) * 0.25 / max(dot(n, v) * 0.5 + 0.5, 0.2);
}
vec3 oak(vec3 p, vec3 n) {
  vec2 g = abs(n.x) > 0.5 ? p.zy : (abs(n.y) > 0.5 ? p.zx : p.xy);
  float w = fbm(vec2(g.x * 0.45, g.y * 2.2)) * 16.0 + fbm(vec2(g.x * 2.0, g.y * 9.0)) * 2.5;
  float ring = 0.5 + 0.5 * sin(g.y * 24.0 + w);
  ring = pow(ring, 3.0);
  float fibre = fbm(vec2(g.x * 3.0, g.y * 160.0));
  float ray = smoothstep(0.82, 0.95, vnoise(vec2(g.x * 9.0, g.y * 40.0)));
  vec3 a = mix(vec3(0.54, 0.34, 0.16), vec3(0.40, 0.23, 0.10), ring * 0.75);
  a *= 0.88 + 0.2 * fibre;
  return mix(a, vec3(0.70, 0.52, 0.30), ray * 0.25);
}

vec3 light(vec3 p, vec3 n, vec3 v, vec3 alb, float rough, float spec, bool desk) {
  float sh = shadow(p + n * 0.004) * gobo(p);
  float ao = occl(p, n);
  float nl = max(dot(n, L), 0.0);
  vec3 c = alb * (SUN * nl * sh + SKY * (0.55 + 0.45 * n.y) * ao + vec3(0.42, 0.32, 0.22) * (0.5 - 0.5 * n.y) * ao * 0.8);
  float f = spec + (1.0 - spec) * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  c += SUN * ggx(n, v, rough) * sh * f * 1.2;
  c += env(reflect(-v, n)) * f * ao * (1.0 - rough) * 0.35;
  return c;
}

vec3 shadeCard(int k, vec3 p, vec3 v, vec3 n) {
  vec3 q = cardLocal(p, k);
  vec3 alb = vec3(0.90, 0.87, 0.80);
  float tx = uCard[k].w;
  bool tab = q.y > 0.985 && abs(q.x - tx) < 0.2;
  vec3 ln = n;
  float face = abs(q.z) > 0.004 ? 1.0 : 0.0;
  if (tab) alb = uTab[k];
  if (q.z > 0.004) {
    // printed rules on the front of the card
    if (!tab) {
      float px = fwidth(q.y) * 1.2 + 0.0015;
      float red = 1.0 - smoothstep(0.0, px + 0.002, abs(q.y - 0.86));
      alb = mix(alb, vec3(0.70, 0.22, 0.20), red * 0.75);
      float bl = 0.0;
      for (int i = 0; i < 7; i++) bl = max(bl, 1.0 - smoothstep(0.0, px + 0.0015, abs(q.y - (0.74 - float(i) * 0.1))));
      alb = mix(alb, vec3(0.42, 0.58, 0.80), bl * 0.6);
    }
    vec2 uv = vec2((q.x + 0.8) / 1.6, clamp(q.y / 1.14, 0.0, 1.0));
    vec2 t = vec2(uv.x, 1.0 - (float(k) + 1.0 - uv.y) / 8.0);
    vec4 ink = texture(uInk, t);
    alb = mix(alb, uTab[k] * vec3(0.55, 0.42, 0.40), ink.g * 0.8);
    alb = mix(alb, vec3(0.07, 0.07, 0.10), min(ink.r * 1.15, 1.0));
  } else if (face < 0.5) {
    alb *= 0.9;
  }
  float fib = vnoise(q.xy * vec2(240.0, 240.0)) * 0.05;
  alb *= 0.97 + fib;
  vec3 c = light(p, n, v, alb, 0.75, 0.03, false);
  // thin card: sun that hits the back comes through, warmed by the paper
  float back = max(dot(-n, L), 0.0);
  if (back > 0.0) c += alb * vec3(1.0, 0.82, 0.6) * SUN * back * 0.16 * shadow(p - n * 0.01) * gobo(p);
  return c;
}

void main() {
  vec2 sp = vUv * 2.0 - 1.0 - uShift;
  vec3 rd = normalize(uFw + uRt * sp.x * uTan * uAspect + uUp * sp.y * uTan);
  float tD = rd.y < 0.0 ? -uCam.y / rd.y : 60.0;
  float t = 0.0, id = -1.0;
  float tmax = min(tD, 30.0);
  for (int i = 0; i < 140; i++) {
    vec2 h = map(uCam + rd * t, false);
    if (h.x < 0.00035 * t) { id = h.y; break; }
    t += h.x;
    if (t > tmax) break;
  }
  vec3 v = -rd, col; float depth;
  if (id >= 0.0 && t < tmax) {
    vec3 p = uCam + rd * t;
    vec3 n = nrm(p, false);
    if (id >= 10.0) col = shadeCard(int(id - 10.0 + 0.5), p, v, n);
    else if (id > 3.5) col = light(p, n, v, vec3(0.86, 0.82, 0.72) * (0.92 + 0.08 * vnoise(p.xy * 300.0)), 0.8, 0.03, false);
    else if (id > 2.5) col = light(p, n, v, vec3(0.0), 0.28, 0.0, false) + vec3(0.95, 0.72, 0.38) * (env(reflect(rd, n)) * 0.6 * occl(p, n) + SUN * ggx(n, v, 0.28) * shadow(p + n * 0.004) * 2.2);
    else col = light(p, n, v, oak(p, n), 0.36, 0.04, false);
    depth = t;
  } else if (rd.z < 0.0 && (WALL - uCam.z) / rd.z < tD) {
    // the plaster wall behind the desk
    float tw = (WALL - uCam.z) / rd.z;
    vec3 p = uCam + rd * tw;
    vec3 n = vec3(0.0, 0.0, 1.0);
    vec3 alb = vec3(0.88, 0.80, 0.69) * (0.96 + 0.06 * fbm(p.xy * 9.0));
    col = alb * (SUN * max(dot(n, L), 0.0) * gobo(p) + SKY * 0.8 + vec3(0.42, 0.32, 0.22) * 0.5 * exp(-p.y * 1.5));
    col *= 1.0 - 0.35 * exp(-p.y * 9.0);
    depth = tw;
  } else {
    vec3 p = uCam + rd * tD;
    vec3 n = vec3(0.0, 1.0, 0.0);
    float g = fbm(vec2(p.x * 0.6, p.z * 16.0));
    vec3 alb = mix(vec3(0.74, 0.63, 0.49), vec3(0.83, 0.73, 0.59), g) * (0.95 + 0.06 * vnoise(vec2(p.x * 3.0, p.z * 140.0)));
    col = light(p, n, v, alb, 0.5, 0.035, true);
    col *= 1.0 - 0.3 * exp(-(p.z - WALL) * 6.0);
    depth = tD;
  }
  float z = depth * dot(rd, uFw);
  float coc = clamp(uAperture * (1.0 - uFocus / max(z, 0.05)), -1.0, 1.0);
  vec3 x = col * 0.7;
  x = clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
  o = vec4(pow(x, vec3(1.0 / 2.2)), 0.5 + 0.5 * coc);
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
  for (int k = 1; k < 18; k++) {
    float r = sqrt(float(k) / 18.0) * uMaxR;
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
  col *= 1.0 - 0.22 * dot(q, q);
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

/** What is typed on each card: red channel is typewriter ink, green is the status stamp. */
function typeCards() {
  const cv = document.createElement("canvas");
  cv.width = CELL_W;
  cv.height = CELL_H * orders.length;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cv.width, cv.height);
  const top = (CELL_H * 0.14) / 1.14;
  const yOf = (v: number) => top + (1 - v) * (CELL_H - top);
  orders.forEach((o, k) => {
    ctx.save();
    ctx.translate(0, k * CELL_H);
    ctx.fillStyle = "#ff0000";
    ctx.textBaseline = "alphabetic";
    // the tab
    const tx = ((TAB_X[k % 3] + 0.8) / 1.6) * CELL_W;
    ctx.textAlign = "center";
    ctx.font = `700 38px ${TYPE}`;
    ctx.fillText(o.id, tx, top - 8);
    // the heading line, above the red rule
    ctx.textAlign = "left";
    ctx.font = `700 40px ${TYPE}`;
    ctx.fillText(o.customer.toUpperCase(), 34, yOf(0.86) - 12);
    ctx.font = `600 31px ${TYPE}`;
    ctx.fillText(o.item, 34, yOf(0.74) - 8);
    ctx.fillText(`Placed ${day(o.placed)} 2026`, 34, yOf(0.64) - 8);
    ctx.font = `700 34px ${TYPE}`;
    ctx.fillText(`Total ${money(o.total)}`, 34, yOf(0.54) - 8);
    // the rubber stamp
    ctx.translate(CELL_W - 150, yOf(0.42));
    ctx.rotate(-0.16);
    ctx.strokeStyle = "#00ff00";
    ctx.fillStyle = "#00ff00";
    ctx.lineWidth = 5;
    ctx.strokeRect(-110, -34, 220, 62);
    ctx.font = `800 34px ${GROTESK}`;
    ctx.textAlign = "center";
    ctx.fillText(o.status.toUpperCase(), 0, 10);
    ctx.restore();
  });
  return cv;
}

type Sim = {
  z: number[]; from: number[]; to: number[]; start: number[]; moving: boolean[];
  tilt: number[]; tv: number[]; hov: number[]; hv: number[]; hover: number; dirty: boolean; touched: boolean; now: number;
};

/** The drawer drawn with plain elements, for browsers without WebGL 2. */
function Still({ slots, hover }: { slots: number[]; hover: number | null }) {
  const byFront = orders.map((_, k) => k).sort((a, b) => slots[b] - slots[a]);
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(180deg, #e9e1d4 0%, #dccdb6 55%, #cdbb9f 100%)" }}>
      <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(118deg, rgba(255,247,230,0) 0 70px, rgba(255,247,230,0.5) 70px 150px, rgba(255,247,230,0) 150px 165px)" }} />
      <div className="absolute left-1/2 top-[56%] h-[30%] w-[78%] -translate-x-1/2 rounded-md shadow-[18px_26px_40px_rgba(70,45,20,0.35)]" style={{ background: "linear-gradient(180deg, #8a5a2f, #6a4021)" }} />
      {byFront.map((k) => {
        const s = slots[k];
        const lifted = hover === k;
        return (
          <div key={k} className="absolute left-1/2 w-[70%] -translate-x-1/2 rounded-t-md border border-[#cfc5b2] shadow-[0_-2px_6px_rgba(60,40,20,0.12)]" style={{ top: `${18 + (7 - s) * 4.6 - (lifted ? 9 : 0)}%`, height: "44%", background: "#efe9dc" }}>
            <span className="absolute -top-[9%] h-[10%] w-[22%] rounded-t-md" style={{ left: `${39 + TAB_X[k % 3] * 38}%`, background: STATUS[orders[k].status].hex }} />
            <span className="absolute left-[5%] top-[6%] text-[11px] font-bold uppercase" style={{ fontFamily: TYPE, color: INK }}>{orders[k].customer}</span>
            <span className="absolute inset-x-0 top-[22%] h-px bg-[#b5413a]/70" />
          </div>
        );
      })}
      <div className="absolute left-1/2 top-[66%] h-[26%] w-[82%] -translate-x-1/2 rounded-md shadow-[0_18px_30px_rgba(60,35,15,0.35)]" style={{ background: "linear-gradient(180deg, #9a6838, #7b4f29 60%, #6a4322)" }}>
        <span className="absolute left-1/2 top-[22%] h-[8%] w-[22%] -translate-x-1/2 rounded-full" style={{ background: "linear-gradient(180deg, #f1d18c, #a87a34)" }} />
        <span className="absolute left-1/2 top-[52%] h-[24%] w-[24%] -translate-x-1/2 rounded-sm border-2 border-[#c39a52] bg-[#e8e0cd]" />
      </div>
    </div>
  );
}

export default function SortableOrderTableCardIndex() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "id", dir: 1 });
  const [hover, setHover] = useState<number | null>(null);
  const [mode, setMode] = useState<"pending" | "gl" | "still">("pending");
  const [said, setSaid] = useState("");
  const sim = useRef<Sim>({
    z: orders.map((_, k) => SLOT_Z(k)), from: orders.map((_, k) => SLOT_Z(k)), to: orders.map((_, k) => SLOT_Z(k)),
    start: orders.map(() => -10), moving: orders.map(() => false), tilt: orders.map(() => 0), tv: orders.map(() => 0),
    hov: orders.map(() => 0), hv: orders.map(() => 0), hover: -1, dirty: true, touched: false, now: 0,
  });
  const demo = useRef<{ setSort: typeof setSort; setHover: typeof setHover }>({ setSort, setHover });

  const rows = useMemo(() => orders.map((o, k) => ({ o, k })).sort((a, b) => compare(a.o, b.o, sort.key) * sort.dir), [sort]);
  const slots = useMemo(() => {
    const s = orders.map(() => 0);
    rows.forEach((r, i) => (s[r.k] = i));
    return s;
  }, [rows]);

  // a new order: every card is pulled up and dropped into its new place, front card first
  useEffect(() => {
    const s = sim.current;
    orders.forEach((_, k) => {
      const target = SLOT_Z(slots[k]);
      if (Math.abs(target - s.to[k]) < 1e-4 && !s.moving[k]) return;
      s.from[k] = s.z[k];
      s.to[k] = target;
      s.start[k] = s.now + slots[k] * RIFFLE_STAGGER;
      s.moving[k] = true;
    });
    s.dirty = true;
  }, [slots]);
  useEffect(() => {
    sim.current.hover = hover ?? -1;
    sim.current.dirty = true;
  }, [hover]);

  // the self-playing demo: point at a card, sort, point again, until the visitor takes over
  useEffect(() => {
    if (!DEMO || reduce) return;
    const script: [number, () => void][] = [
      [0.5, () => setHover(2)],
      [3.4, () => setHover(null)],
      [0.5, () => setSort({ key: "total", dir: -1 })],
      [2.6, () => setHover(6)],
      [2.4, () => setHover(null)],
      [0.5, () => setSort({ key: "customer", dir: 1 })],
      [2.6, () => setHover(4)],
      [2.4, () => setHover(null)],
      [0.5, () => setSort({ key: "id", dir: 1 })],
    ];
    let step = 0, timer = 0;
    const next = () => {
      if (sim.current.touched) return;
      const [wait, act] = script[step % script.length];
      timer = window.setTimeout(() => {
        if (sim.current.touched) return;
        act();
        step++;
        next();
      }, wait * 1000);
    };
    next();
    return () => window.clearTimeout(timer);
  }, [reduce]);

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
    } catch (err) {
      console.warn(err);
      setMode("still");
      return;
    }
    setMode("gl");

    const ink = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, ink);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, typeCards());
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    const tabs = orders.flatMap((o) => lin(STATUS[o.status].hex));

    const vao = gl.createVertexArray();
    const fbo = gl.createFramebuffer();
    const tex = gl.createTexture();
    let W = 0, H = 0, scale = Math.min(window.devicePixelRatio || 1, 1.5), cssW = 1, cssH = 1;
    const TAN = Math.tan((17 * Math.PI) / 180);
    const cam = { pos: [0, 2, 6], rt: [1, 0, 0], up: [0, 1, 0], fw: [0, 0, -1], shift: [0, 0], focus: 6 };
    let view = [0, 0], pointer = [0, 0], focus = 6;

    const aim = () => {
      const aspect = cssW / cssH;
      const half = Math.atan(Math.min(TAN, TAN * aspect));
      const dist = (aspect > 1 ? 1.95 : 1.66) / Math.sin(half);
      const az = 0.38 + view[0] * 0.12, el = 0.66 + view[1] * 0.06;
      const target = [-0.12, 0.72, -0.02];
      cam.pos = [target[0] + Math.sin(az) * Math.cos(el) * dist, target[1] + Math.sin(el) * dist, target[2] + Math.cos(az) * Math.cos(el) * dist];
      let fw = [target[0] - cam.pos[0], target[1] - cam.pos[1], target[2] - cam.pos[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]);
      fw = fw.map((v) => v / fl);
      let rt = [-fw[2], 0, fw[0]];
      const rl = Math.hypot(rt[0], rt[2]);
      rt = rt.map((v) => v / rl);
      cam.fw = fw;
      cam.rt = rt;
      cam.up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      cam.shift = [0, -0.04];
      return aspect;
    };
    const depthOf = (p: number[]) => (p[0] - cam.pos[0]) * cam.fw[0] + (p[1] - cam.pos[1]) * cam.fw[1] + (p[2] - cam.pos[2]) * cam.fw[2];
    const project = (p: number[]) => {
      const d = [p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]];
      const z = depthOf(p);
      const x = (d[0] * cam.rt[0] + d[1] * cam.rt[1] + d[2] * cam.rt[2]) / (z * TAN * (cssW / cssH)) + cam.shift[0];
      const y = (d[0] * cam.up[0] + d[1] * cam.up[1] + d[2] * cam.up[2]) / (z * TAN) + cam.shift[1];
      return [(x * 0.5 + 0.5) * cssW, (0.5 - y * 0.5) * cssH];
    };

    const resize = () => {
      cssW = wrap.clientWidth;
      cssH = wrap.clientHeight;
      let k = scale;
      if (cssW * cssH * k * k > 1.1e6) k = Math.sqrt(1.1e6 / (cssW * cssH));
      const w = Math.max(2, Math.round(cssW * k)), h = Math.max(2, Math.round(cssH * k));
      aim();
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
    const REST = orders.map((_, k) => 0.075 + 0.025 * Math.sin(k * 2.3));
    // where each card is right now: its depth in the drawer, how high it is and how far it leans
    const pose = (k: number) => {
      const t = s.now;
      let lift = s.hov[k] * HOVER_LIFT, tilt = REST[k] + s.tilt[k] - s.hov[k] * 0.3;
      if (s.moving[k]) {
        const p = clamp((t - s.start[k]) / RIFFLE_SECONDS, 0, 1);
        const far = clamp(Math.abs(s.to[k] - s.from[k]) / 0.5, 0.18, 1);
        lift += RIFFLE_HEIGHT * far * Math.sin(Math.PI * Math.pow(p, 0.8)) ** 1.4;
        tilt -= 0.42 * far * Math.sin(Math.PI * p) * (s.to[k] > s.from[k] ? 1 : -0.6);
      }
      return { lift, tilt };
    };

    const draw = () => {
      const aspect = aim();
      const C: number[] = [];
      orders.forEach((_, k) => {
        const q = pose(k);
        C.push(s.z[k], q.lift, q.tilt, TAB_X[k % 3]);
      });
      // the lens follows the lifted card, or rests on the middle of the drawer
      const h = s.hover >= 0 ? s.hover : -1;
      const want = h >= 0 ? depthOf([0, 0.065 + pose(h).lift + 0.8, s.z[h]]) : depthOf([0, 0.9, 0.3]);
      focus += (want - focus) * (reduce ? 1 : 0.12);
      gl.bindVertexArray(vao);
      gl.viewport(0, 0, W, H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.useProgram(pScene);
      gl.uniform4fv(U(pScene, "uCard"), C);
      gl.uniform3fv(U(pScene, "uTab"), tabs);
      gl.uniform1i(U(pScene, "uInk"), 0);
      gl.uniform3fv(U(pScene, "uCam"), cam.pos);
      gl.uniform3fv(U(pScene, "uRt"), cam.rt);
      gl.uniform3fv(U(pScene, "uUp"), cam.up);
      gl.uniform3fv(U(pScene, "uFw"), cam.fw);
      gl.uniform1f(U(pScene, "uTan"), TAN);
      gl.uniform1f(U(pScene, "uAspect"), aspect);
      gl.uniform2fv(U(pScene, "uShift"), cam.shift);
      gl.uniform1f(U(pScene, "uFocus"), focus);
      gl.uniform1f(U(pScene, "uAperture"), 1.5);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(pLens);
      gl.uniform1i(U(pLens, "uScene"), 1);
      gl.uniform2f(U(pLens, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(pLens, "uMaxR"), H * 0.0065);
      gl.uniform1f(U(pLens, "uTime"), reduce ? 0 : s.now);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const physics = (dt: number) => {
      orders.forEach((_, k) => {
        if (s.moving[k]) {
          const p = clamp((s.now - s.start[k]) / RIFFLE_SECONDS, 0, 1);
          const e = p < 0.22 ? 0 : p > 0.8 ? 1 : (1 - Math.cos(Math.PI * ((p - 0.22) / 0.58))) / 2;
          s.z[k] = s.from[k] + (s.to[k] - s.from[k]) * e;
          if (p >= 1) {
            s.moving[k] = false;
            s.z[k] = s.to[k];
            s.tv[k] += 2.6; // the card slaps down and rocks against its neighbours
          }
        }
        s.tv[k] += (-150 * s.tilt[k] - 7.5 * s.tv[k]) * dt;
        s.tilt[k] += s.tv[k] * dt;
        const want = s.hover === k ? 1 : 0;
        s.hv[k] += (190 * (want - s.hov[k]) - 15 * s.hv[k]) * dt;
        s.hov[k] += s.hv[k] * dt;
      });
    };
    const settle = () => {
      orders.forEach((_, k) => {
        s.z[k] = s.to[k];
        s.moving[k] = false;
        s.tilt[k] = s.tv[k] = s.hv[k] = 0;
        s.hov[k] = s.hover === k ? 1 : 0;
      });
    };

    let raf = 0, visible = true, last = performance.now(), slow = 0, frames = 0;
    const t0 = last;
    const tick = (nowMs: number) => {
      const real = nowMs - last;
      const dt = clamp(real / 1000, 0, 0.05);
      last = nowMs;
      if (reduce) {
        if (s.dirty) settle();
      } else {
        s.now += dt;
        const sub = Math.max(1, Math.ceil(dt / 0.005));
        for (let i = 0; i < sub; i++) physics(dt / sub);
        const t = (nowMs - t0) / 1000;
        view[0] += (pointer[0] + 0.25 * Math.sin(t * 0.23) - view[0]) * Math.min(1, dt * 2.5);
        view[1] += (pointer[1] - view[1]) * Math.min(1, dt * 2.5);
      }
      if (!reduce || s.dirty) {
        draw();
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
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) {
        last = performance.now();
        frames = 0;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(wrap);
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && visible) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(tick);

    // pointing at a card in the drawer lights up its row: test front to back
    const over = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const order = orders.map((_, k) => k).sort((a, b) => s.z[b] - s.z[a]);
      for (const k of order) {
        const q = pose(k);
        const a = project([-0.8, 0.065 + q.lift + 1.0, s.z[k]]), b = project([0.8, 0.065 + q.lift + 0.1, s.z[k]]);
        if (x > a[0] && x < b[0] && y > a[1] && y < b[1]) return k;
      }
      return -1;
    };
    const touch = () => {
      s.touched = true;
    };
    const move = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      pointer = [((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * -2];
      if (e.pointerType === "mouse") {
        touch();
        const k = over(e);
        demo.current.setHover(k >= 0 ? k : null);
        canvas.style.cursor = k >= 0 ? "pointer" : "";
      }
    };
    const down = (e: PointerEvent) => {
      touch();
      const k = over(e);
      demo.current.setHover(k >= 0 ? k : null);
    };
    const leave = () => {
      pointer = [0, 0];
      if (s.touched) demo.current.setHover(null);
    };
    const lost = (e: Event) => {
      e.preventDefault();
      setMode("still");
    };
    const section = wrap.closest("section") ?? wrap;
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("webglcontextlost", lost);
    section.addEventListener("keydown", touch);
    section.addEventListener("focusin", touch);
    section.addEventListener("pointerdown", touch);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("webglcontextlost", lost);
      section.removeEventListener("keydown", touch);
      section.removeEventListener("focusin", touch);
      section.removeEventListener("pointerdown", touch);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduce]);

  const sortBy = (key: Key) => {
    sim.current.touched = true;
    const next = { key, dir: (sort.key === key ? -sort.dir : key === "total" || key === "placed" ? -1 : 1) as 1 | -1 };
    setSort(next);
    const col = columns.find((c) => c.key === key)!;
    setSaid(`Sorted by ${col.label.toLowerCase()}, ${next.dir === 1 ? "ascending" : "descending"}. The card file re-filed to match.`);
  };

  const arrow = (key: Key) => {
    const on = sort.key === key;
    return (
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" className={`shrink-0 transition-transform duration-300 ${on ? "opacity-100" : "opacity-35"} ${on && sort.dir === -1 ? "rotate-180" : ""}`}>
        <path d="M6 2.5v7M3 5.5l3-3 3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <section className="relative overflow-hidden" style={{ fontFamily: GROTESK, background: PAPER, color: INK }}>
      <div className="mx-auto grid max-w-[1380px] gap-6 px-4 py-8 sm:px-8 sm:py-12 lg:grid-cols-[minmax(0,1.32fr)_minmax(0,0.68fr)] lg:gap-10">
        <div className="order-2 min-w-0 lg:order-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5b5146]">{SHOP} · demo data</p>
          <h2 className="mt-2 text-[40px] leading-[0.95] sm:text-[56px]" style={{ fontFamily: SERIF, letterSpacing: "-0.035em" }}>
            The order book
          </h2>
          <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[#4c443b]">Sort any column and the card file on the counter re-files itself to match. Point at a row to pull its card.</p>

          <div className="mt-6 overflow-x-auto rounded-xl border border-[#1f1b16]/12 bg-[#fbf8f2] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_18px_40px_-24px_rgba(60,40,20,0.35)]">
            <table className="w-full border-collapse text-left text-[13px] sm:text-[14.5px]" onMouseLeave={() => setHover(null)}>
              <caption className="sr-only">Orders for {SHOP}, demo data. Column headers are buttons that sort the table.</caption>
              <thead>
                <tr className="border-b border-[#1f1b16]/12 bg-[#f1ebe0]">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
                      className={`p-0 ${c.wide ? "hidden md:table-cell" : ""} ${c.numeric ? "text-right" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => sortBy(c.key)}
                        className={`flex h-11 w-full items-center gap-1 px-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-[#e8e0d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1f1b16] sm:px-4 sm:text-[11px] ${c.numeric ? "justify-end" : ""} ${sort.key === c.key ? "text-[#1f1b16]" : "text-[#5b5146]"}`}
                      >
                        {c.label}
                        {arrow(c.key)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ o, k }) => {
                  const on = hover === k;
                  return (
                    <tr
                      key={o.id}
                      tabIndex={0}
                      onMouseEnter={() => {
                        sim.current.touched = true;
                        setHover(k);
                      }}
                      onFocus={() => setHover(k)}
                      onBlur={() => setHover(null)}
                      className={`border-b border-[#1f1b16]/8 transition-colors duration-200 last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1f1b16] ${on ? "bg-[#efe5d2]" : ""}`}
                    >
                      <th scope="row" className="h-12 whitespace-nowrap px-2 font-medium tabular-nums sm:px-4" style={{ fontFamily: TYPE }}>
                        <span className="mr-2 inline-block h-3 w-1.5 rounded-sm align-[-1px]" style={{ background: STATUS[o.status].hex, transform: on ? "scaleY(1.6)" : "none", transition: "transform 300ms cubic-bezier(.3,1.6,.5,1)" }} />
                        {o.id}
                      </th>
                      <td className="max-w-[7.5rem] truncate px-2 sm:max-w-none sm:px-4">{o.customer}</td>
                      <td className="hidden whitespace-nowrap px-4 text-[#4c443b] md:table-cell">{o.item}</td>
                      <td className="hidden whitespace-nowrap px-4 tabular-nums text-[#4c443b] md:table-cell">{day(o.placed)}</td>
                      <td className="whitespace-nowrap px-2 text-right font-medium tabular-nums sm:px-4">{money(o.total)}</td>
                      <td className="px-2 sm:px-4">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold sm:text-[12px]" style={{ background: `${STATUS[o.status].hex}40`, color: INK }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS[o.status].hex }} />
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px] text-[#5b5146]">
            {orders.length} orders · {money(orders.reduce((a, o) => a + o.total, 0))} in total
          </p>
          <p className="sr-only" aria-live="polite">
            {said}
          </p>
        </div>

        <div ref={wrapRef} className="relative order-1 h-[380px] overflow-hidden rounded-2xl bg-[#d9ccb7] sm:h-[460px] lg:order-2 lg:h-auto lg:min-h-[600px]">
          <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full touch-pan-y ${mode === "still" ? "hidden" : ""}`} />
          {mode === "still" && <Still slots={slots} hover={hover} />}
        </div>
      </div>
    </section>
  );
}
