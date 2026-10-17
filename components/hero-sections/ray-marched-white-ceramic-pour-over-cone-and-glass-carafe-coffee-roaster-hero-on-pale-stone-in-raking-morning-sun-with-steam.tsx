import { useEffect, useRef, useState } from "react";

// Everything a visitor would edit first.
const roaster = {
  house: "Fernhill Roasting Works",
  kind: "Small-batch coffee",
  headline: ["Slow water,", "early light,", "a better cup."],
  line: "Washed and natural lots from three farms, roasted light enough to taste the place they grew, shipped the day after roasting.",
  cta: "Shop this week's roast",
  more: "Brewing guide",
  note: "Roasted Tuesdays, shipped Wednesdays",
};
// Colours of the set, in linear light (0 to 1).
const STONE = [0.72, 0.665, 0.585]; // the honed travertine counter
const WALL = [0.62, 0.575, 0.52]; // the plaster wall in soft shade behind
const GLAZE = [0.86, 0.845, 0.81]; // the white glaze of the cone
const COFFEE = [7.0, 15.0, 28.0]; // how fast brewed coffee swallows red, green and blue per unit of depth
const LEVEL = 0.4; // height of the coffee in the carafe
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const v3 = (c: number[]) => `vec3(${c.map((n) => n.toFixed(4)).join(", ")})`;

const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

// The photograph: a glazed cone on a glass carafe of coffee, on a stone counter, in a low sun from behind and to the left.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uJit;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus; uniform float uBlur;
uniform vec3 uSun;
const float LEVEL = ${LEVEL.toFixed(3)};
const vec3 STONE = ${v3(STONE)}; const vec3 WALL = ${v3(WALL)}; const vec3 GLAZE = ${v3(GLAZE)}; const vec3 COFFEE = ${v3(COFFEE)};
const vec3 SUNC = vec3(1.0, 0.86, 0.68);
const float WALLZ = 3.4;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float h31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float n3(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float cyl(vec3 p, float r, float y0, float y1, float e){
  vec2 d = vec2(length(p.xz) - r + e, abs(p.y - 0.5 * (y0 + y1)) - 0.5 * (y1 - y0) + e);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - e;
}
float cone(vec3 p, float h, float r1, float r2){
  vec2 q = vec2(length(p.xz), p.y); vec2 k1 = vec2(r2, h); vec2 k2 = vec2(r2 - r1, 2.0 * h);
  vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0) ? r1 : r2), abs(q.y) - h);
  vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}
float ellip(vec3 p, vec3 r){ float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / k1; }
float torus(vec3 p, float R, float r){ return length(vec2(length(p.xz) - R, p.y)) - r; }

// ---- the carafe: a thin blown-glass shell ----
float carafeOut(vec3 p){
  float b = ellip(p - vec3(0.0, 0.5, 0.0), vec3(0.62, 0.53, 0.62));
  float n = cyl(p, 0.27, 0.7, 1.5, 0.004);
  return max(smin(b, n, 0.2), -p.y);
}
float dGlass(vec3 p){
  float s = abs(carafeOut(p) + 0.011) - 0.011;
  s = max(s, p.y - 1.24);
  return min(s, torus(p - vec3(0.0, 1.24, 0.0), 0.262, 0.014));
}
float surfH(vec3 p){ float r = length(p.xz); return LEVEL + 0.0016 * sin(r * 80.0 - uTime * 13.0) * exp(-r * 9.0); }
float dLiq(vec3 p){ return max(carafeOut(p) + 0.024, p.y - surfH(p)); }
float dStream(vec3 p){
  if (p.y > 1.22 || p.y < LEVEL - 0.03) return 1.0;
  float k = (p.y - LEVEL) / (1.2 - LEVEL);
  vec2 o = vec2(0.0025 * sin(p.y * 23.0 - uTime * 17.0), 0.002 * cos(p.y * 19.0 - uTime * 13.0)) * (1.0 - k);
  float r = mix(0.0062, 0.0105, k) * (1.0 + 0.12 * sin(p.y * 95.0 - uTime * 38.0));
  return (length(p.xz - o) - r) * 0.8;
}
// ---- the cone: thrown and glazed, with a flange that rests on the carafe ----
float coneIn(vec3 p){ return cone(p - vec3(0.0, 1.635, 0.0), 0.29, 0.155, 0.565); }
float dCer(vec3 p){
  float o = cone(p - vec3(0.0, 1.58, 0.0), 0.28, 0.2, 0.6);
  float s = max(o, -coneIn(p));
  s = smin(s, torus(p - vec3(0.0, 1.857, 0.0), 0.582, 0.02), 0.012);
  float fl = cyl(p, 0.42, 1.245, 1.29, 0.014);
  float ft = cyl(p, 0.235, 1.16, 1.3, 0.012);
  s = smin(s, min(fl, ft), 0.025);
  return max(s, 0.03 - length(p.xz));
}
// the paper filter: a pleated liner standing a little proud of the rim
float dPaper(vec3 p){
  float a = atan(p.z, p.x);
  float pleat = 0.0035 * sin(a * 26.0) * smoothstep(1.62, 1.9, p.y);
  float side = cone(p - vec3(0.0, 1.735, 0.0), 0.39, 0.155, 0.7064);
  float d = abs(side + 0.009 + pleat) - 0.0025;
  return max(max(d, p.y - (1.915 + 0.006 * sin(a * 13.0))), 1.42 - p.y);
}
float groundsH(vec3 p){ float r = length(p.xz); return 1.77 - 0.06 * exp(-r * r * 14.0) + 0.012 * n2(p.xz * 18.0) + 0.008 * n2(p.xz * 50.0); }
float dGrounds(vec3 p){ return max(coneIn(p) + 0.012, p.y - groundsH(p)); }

float map(vec3 p){ return min(min(min(dGlass(p), dCer(p)), min(dGrounds(p), dLiq(p))), min(dStream(p), dPaper(p))); }
vec2 bound(vec3 ro, vec3 rd, float rr, float y0, float y1){
  float a = dot(rd.xz, rd.xz); float b = dot(ro.xz, rd.xz); float c = dot(ro.xz, ro.xz) - rr;
  float h = b * b - a * c; if (h < 0.0 || a < 1e-6) return vec2(1.0, -1.0);
  h = sqrt(h); float t0 = (-b - h) / a; float t1 = (-b + h) / a;
  if (abs(rd.y) > 1e-5) { float ya = (y0 - ro.y) / rd.y; float yb = (y1 - ro.y) / rd.y; t0 = max(t0, min(ya, yb)); t1 = min(t1, max(ya, yb)); }
  return vec2(max(t0, 0.0), t1);
}
float march(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd, 0.4, -0.02, 1.94); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 90; i++) { float d = map(ro + rd * t); if (d < 0.0005) return t; t += d * 0.9; if (t > tb.y) break; }
  return -1.0;
}
const vec2 NE = vec2(0.0012, -0.0012);
vec3 dGlassN(vec3 p){ return normalize(NE.xyy * dGlass(p + NE.xyy) + NE.yyx * dGlass(p + NE.yyx) + NE.yxy * dGlass(p + NE.yxy) + NE.xxx * dGlass(p + NE.xxx)); }
vec3 dCerN(vec3 p){ return normalize(NE.xyy * dCer(p + NE.xyy) + NE.yyx * dCer(p + NE.yyx) + NE.yxy * dCer(p + NE.yxy) + NE.xxx * dCer(p + NE.xxx)); }
vec3 dGroundsN(vec3 p){ return normalize(NE.xyy * dGrounds(p + NE.xyy) + NE.yyx * dGrounds(p + NE.yyx) + NE.yxy * dGrounds(p + NE.yxy) + NE.xxx * dGrounds(p + NE.xxx)); }
vec3 dLiqN(vec3 p){ return normalize(NE.xyy * dLiq(p + NE.xyy) + NE.yyx * dLiq(p + NE.yyx) + NE.yxy * dLiq(p + NE.yxy) + NE.xxx * dLiq(p + NE.xxx)); }
vec3 dPaperN(vec3 p){ return normalize(NE.xyy * dPaper(p + NE.xyy) + NE.yyx * dPaper(p + NE.yyx) + NE.yxy * dPaper(p + NE.yxy) + NE.xxx * dPaper(p + NE.xxx)); }
vec3 dStreamN(vec3 p){ return normalize(NE.xyy * dStream(p + NE.xyy) + NE.yyx * dStream(p + NE.yyx) + NE.yxy * dStream(p + NE.yxy) + NE.xxx * dStream(p + NE.xxx)); }

// The room seen in reflections: a tall bright window toward the sun, a white card to the right, warm shade elsewhere.
vec3 env(vec3 d){
  vec3 c = mix(vec3(0.2, 0.17, 0.14), vec3(0.5, 0.48, 0.46), smoothstep(-0.3, 0.6, d.y));
  float az = atan(d.x, d.z); float saz = atan(uSun.x, uSun.z);
  float da = az - saz;
  float win = smoothstep(0.62, 0.5, abs(da)) * smoothstep(-0.02, 0.06, d.y) * smoothstep(0.85, 0.7, d.y);
  win *= 0.75 + 0.25 * smoothstep(0.02, 0.05, abs(fract(da * 2.4 + 0.5) - 0.5));
  c += vec3(1.0, 0.92, 0.8) * 3.2 * win;
  c += vec3(0.95, 0.95, 0.96) * 0.9 * smoothstep(0.3, 0.18, abs(az - 1.7)) * smoothstep(-0.1, 0.1, d.y) * smoothstep(0.7, 0.45, d.y);
  c += vec3(1.0, 0.97, 0.92) * 1.5 * smoothstep(0.55, 0.3, abs(az + 2.55)) * smoothstep(-0.15, 0.15, d.y) * smoothstep(0.9, 0.5, d.y);
  c += vec3(1.0) * 4.0 * smoothstep(0.06, 0.03, abs(az - 2.75)) * smoothstep(-0.05, 0.1, d.y) * smoothstep(0.8, 0.6, d.y);
  c += SUNC * 70.0 * smoothstep(0.9975, 0.9993, dot(d, uSun));
  return c;
}

// Sunlight reaching a point: opaque things block it, coffee lets amber through, glass dims it a little.
vec3 sunVis(vec3 p, vec3 L){
  vec2 tb = bound(p, L, 0.42, -0.02, 1.94); if (tb.x > tb.y) return vec3(1.0);
  float ro = 1.0, rl = 1.0, rg = 1.0; float t = max(tb.x, 0.004);
  for (int i = 0; i < 40; i++) {
    vec3 q = p + L * t;
    float a = min(min(dCer(q), dGrounds(q)), dPaper(q)); float b = dLiq(q); float g = dGlass(q);
    ro = min(ro, 12.0 * a / t); rl = min(rl, 6.0 * b / t); rg = min(rg, 6.0 * g / t);
    t += clamp(min(a, min(b, g)), 0.008, 0.12);
    if (ro < 0.002 || t > tb.y) break;
  }
  ro = smoothstep(0.0, 1.0, clamp(ro, 0.0, 1.0)); rl = smoothstep(0.0, 1.0, clamp(rl, 0.0, 1.0)); rg = clamp(rg, 0.0, 1.0);
  vec3 amber = vec3(0.16, 0.07, 0.025);
  return ro * mix(amber, vec3(1.0), rl) * mix(0.8, 1.0, rg);
}
float aoObj(vec3 p, vec3 n){
  float o = 0.0, w = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.012 + 0.05 * float(i); o += w * (h - min(dCer(p + n * h), dGrounds(p + n * h))); w *= 0.62; }
  return clamp(1.0 - 2.2 * o, 0.0, 1.0);
}

// ---- the counter and the wall ----
vec3 stoneAlb(vec2 p){
  // travertine: soft bands along its length, open pores, the odd warm streak
  float band = n2(vec2(p.x * 0.35, p.y * 5.5) + vec2(n2(p * 0.8) * 1.5, 0.0));
  float pore = smoothstep(0.8, 0.9, n2(p * vec2(7.0, 15.0) + 3.0) * 0.7 + n2(p * 40.0) * 0.3) * 0.1 + smoothstep(0.84, 0.92, n2(p * 70.0)) * 0.06;
  float g = n2(p * 2.2) * 0.5 + n2(p * 7.0) * 0.3 + n2(p * 23.0) * 0.2;
  vec3 c = STONE * (0.9 + 0.12 * g + 0.08 * band - pore);
  c = mix(c, c * vec3(1.06, 0.97, 0.86), smoothstep(0.55, 0.85, band) * 0.6);
  return c;
}
float stoneBump(vec2 p){ return n2(p * vec2(4.0, 12.0)) * 0.6 + n2(p * 30.0) * 0.3 - smoothstep(0.8, 0.9, n2(p * vec2(7.0, 15.0) + 3.0) * 0.7 + n2(p * 40.0) * 0.3) * 0.7; }

vec3 counter(vec3 p, vec3 rd){
  vec2 e = vec2(0.006, 0.0);
  float b0 = stoneBump(p.xz);
  vec3 n = normalize(vec3(-(stoneBump(p.xz + e.xy) - b0) * 0.0045 / e.x, 1.0, -(stoneBump(p.xz + e.yx) - b0) * 0.0045 / e.x));
  vec3 alb = stoneAlb(p.xz);
  vec3 vis = sunVis(p + vec3(0.0, 0.002, 0.0), uSun);
  float r = length(p.xz);
  // contact: the carafe's foot ring and the room's own occlusion
  float ao = 1.0 - 0.55 * exp(-max(r - 0.5, 0.0) * 14.0) - 0.18 * exp(-max(r - 0.45, 0.0) * 2.5);
  ao *= 1.0 - 0.25 * smoothstep(1.6, 3.4, p.z);
  vec3 sun = SUNC * 3.3 * max(dot(n, uSun), 0.0) * vis;
  vec3 sky = mix(vec3(0.42, 0.4, 0.38), vec3(0.5, 0.44, 0.38), 0.5) * 0.62 * ao;
  // the sun through the coffee throws a warm glow into the middle of the shadow
  vec3 col = alb * (sun + sky);
  // honed stone: a faint, broad sheen of the window
  vec3 rr = reflect(rd, n);
  float F = 0.03 + 0.5 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  col += F * env(normalize(rr + vec3(0.0, 0.18, 0.0))) * 0.35 * ao;
  return col;
}
vec3 wall(vec3 p){
  float g = n2(p.xy * 3.0) * 0.6 + n2(p.xy * 14.0) * 0.4;
  vec3 alb = WALL * (0.94 + 0.08 * g);
  float fall = smoothstep(4.5, 0.0, p.y) * 0.25 + 0.75;
  float glow = exp(-pow((p.x + 3.0) / 3.5, 2.0)) * 0.35;
  vec3 c = alb * (vec3(0.5, 0.46, 0.42) * fall + vec3(0.62, 0.5, 0.38) * glow);
  // where the wall meets the counter, it darkens a little
  c *= 0.75 + 0.25 * smoothstep(0.0, 0.5, p.y);
  return c;
}
vec3 background(vec3 ro, vec3 rd, out float dist){
  float tg = rd.y < -1e-4 ? -ro.y / rd.y : 1e5;
  float tw = rd.z > 1e-4 ? (WALLZ - ro.z) / rd.z : 1e5;
  if (tg < tw) { dist = tg; return counter(ro + rd * tg, rd); }
  dist = tw; if (tw > 9e4) return env(rd);
  return wall(ro + rd * tw);
}

// ---- materials ----
vec3 shadeCer(vec3 p, vec3 rd){
  vec3 n = dCerN(p);
  // faint throwing rings left by the potter's fingers, felt more than seen
  float rings = sin(p.y * 210.0 + 2.0 * sin(atan(p.z, p.x) * 3.0)) * 0.035 * smoothstep(1.3, 1.36, p.y) * smoothstep(1.85, 1.8, p.y) * step(0.0, -coneIn(p) - 0.005);
  n = normalize(n + vec3(0.0, rings, 0.0));
  float nv = clamp(dot(-rd, n), 0.0, 1.0);
  float ao = aoObj(p, n);
  vec3 vis = sunVis(p + n * 0.004, uSun);
  float ndl = dot(n, uSun);
  // glaze over porcelain: a soft wrapped diffuse, a little light carried under the surface
  vec3 diff = SUNC * 2.2 * max(ndl, 0.0) * vis + SUNC * 0.3 * max((ndl + 0.5) / 1.5, 0.0) * (0.4 + 0.6 * vis);
  vec3 amb = mix(vec3(0.2, 0.18, 0.16), vec3(0.4, 0.39, 0.38), n.y * 0.5 + 0.5) * ao;
  amb += vec3(0.38, 0.34, 0.29) * 0.4 * max(-n.y, 0.0) * ao; // bounce off the stone
  vec3 fillD = normalize(vec3(-0.55, 0.35, -0.75));
  amb += vec3(1.0, 0.96, 0.9) * 0.32 * pow(max(dot(n, fillD) * 0.5 + 0.5, 0.0), 2.0) * ao;
  vec3 col = GLAZE * (diff + amb);
  col += SUNC * 1.4 * pow(1.0 - nv, 3.0) * max(dot(n, vec3(uSun.x, 0.0, uSun.z)) + 0.2, 0.0) * vis;
  vec3 r = reflect(rd, n);
  float F = 0.045 + 0.955 * pow(1.0 - nv, 5.0);
  col += F * env(r) * ao * 0.9;
  col += SUNC * 9.0 * pow(max(dot(r, uSun), 0.0), 180.0) * vis;
  return col;
}
// unbleached filter paper: matte, with sunlight glowing through it from behind
vec3 shadePaper(vec3 p, vec3 rd){
  vec3 n = dPaperN(p); if (dot(n, rd) > 0.0) n = -n;
  vec3 vis = sunVis(p + n * 0.004, uSun);
  float ao = aoObj(p, n);
  float fib = 0.94 + 0.06 * n2(p.xz * 300.0 + p.y * 200.0);
  vec3 alb = vec3(0.9, 0.85, 0.75) * fib;
  float ndl = dot(n, uSun);
  vec3 col = alb * (SUNC * 2.0 * max(ndl, 0.0) * vis + SUNC * 0.9 * max(-ndl, 0.0) * vec3(1.0, 0.85, 0.6) * smoothstep(1.86, 1.9, p.y) + mix(vec3(0.22, 0.2, 0.18), vec3(0.42, 0.4, 0.38), n.y * 0.5 + 0.5) * ao);
  return col;
}
vec3 shadeGrounds(vec3 p, vec3 rd){
  vec3 n = dGroundsN(p);
  vec3 vis = sunVis(p + n * 0.004, uSun);
  float wet = smoothstep(0.03, 0.0, length(p.xz) - 0.05);
  float g = n2(p.xz * 140.0);
  vec3 alb = mix(vec3(0.07, 0.04, 0.022), vec3(0.11, 0.065, 0.035), g) * (1.0 - wet * 0.4);
  vec3 col = alb * (SUNC * 2.5 * max(dot(n, uSun), 0.0) * vis + vec3(0.35) * aoObj(p, n));
  vec3 r = reflect(rd, n);
  col += (0.02 + 0.3 * wet) * env(r) * 0.6 + SUNC * 3.0 * wet * pow(max(dot(r, uSun), 0.0), 60.0) * vis;
  return col;
}
// how far a ray travels through coffee from p
float coffeeRun(vec3 p, vec3 d, float j){ float s = 0.0; p += d * 0.03 * j; for (int i = 0; i < 22; i++) { p += d * 0.03; if (dLiq(p) < 0.0) s += 0.03; else if (i > 1) break; } return s; }
vec3 shadeCoffee(vec3 p, vec3 rd, bool stream){
  vec3 n = stream ? dStreamN(p) : dLiqN(p);
  float nv = clamp(dot(-rd, n), 0.0, 1.0);
  float F = 0.02 + 0.98 * pow(1.0 - nv, 5.0);
  vec3 td = refract(rd, n, 0.75);
  float s = stream ? 0.045 * nv + 0.012 : coffeeRun(p, td, h21(gl_FragCoord.xy + uJit * 17.0));
  float sl = stream ? 0.03 : coffeeRun(p, uSun, 0.5);
  float dd; vec3 behind = background(p + td * (s + 0.02), td, dd);
  vec3 body = behind * exp(-COFFEE * s);
  float fwd = 0.25 + 2.5 * pow(max(dot(rd, uSun), 0.0), 3.0);
  body += SUNC * vec3(1.0, 0.48, 0.18) * 0.4 * exp(-COFFEE * (sl * 0.7 + s * 0.5)) * fwd;
  vec3 r = reflect(rd, n);
  return mix(body, env(r), F) + SUNC * 6.0 * pow(max(dot(r, uSun), 0.0), 120.0);
}

// Steam: a few curling wisps above the cone, bright where the low sun comes through them.
vec3 steam(vec3 ro, vec3 rd, float tmax, inout float T){
  vec2 tb = bound(ro, rd, 0.9, 1.9, 3.4); tb.y = min(tb.y, tmax);
  if (tb.x > tb.y) return vec3(0.0);
  vec3 acc = vec3(0.0); float dt = (tb.y - tb.x) / 18.0;
  float t = tb.x + dt * h21(gl_FragCoord.xy + uJit * 31.0);
  float ph = 0.35 + 3.0 * pow(max(dot(rd, uSun), 0.0), 5.0);
  for (int i = 0; i < 18; i++) {
    vec3 p = ro + rd * t; float h = p.y - 1.84;
    vec3 q = p;
    q.xz += 0.1 * h * vec2(sin(h * 3.1 - uTime * 0.8), cos(h * 2.7 - uTime * 0.6));
    q.x -= 0.18 * h * h;
    float r = length(q.xz);
    float shape = exp(-r * r / (0.025 + 0.06 * h)) * smoothstep(0.0, 0.18, h) * smoothstep(1.05, 0.25, h);
    float nn = n3(q * vec3(5.0, 2.4, 5.0) - vec3(0.0, uTime * 0.7, 0.0)) * 0.65 + n3(q * 11.0 - vec3(0.0, uTime * 1.1, 0.0)) * 0.35;
    float d = shape * smoothstep(0.42, 0.78, nn) * 2.2 * dt;
    acc += T * d * (SUNC * 2.2 * ph + vec3(0.45, 0.43, 0.42));
    T *= exp(-d * 1.4);
    t += dt;
  }
  return acc;
}

vec3 tone(vec3 x){ vec3 c = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)); }

void main(){
  vec2 uv = (gl_FragCoord.xy + uJit - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 col = vec3(0.0); vec3 thr = vec3(1.0);
  float first = -1.0;
  for (int b = 0; b < 5; b++) {
    float t = march(ro, rd);
    float bd; vec3 bg = background(ro, rd, bd);
    if (t < 0.0 || t > bd) { col += thr * bg; if (first < 0.0) first = bd; break; }
    vec3 p = ro + rd * t;
    if (first < 0.0) first = t + length(ro - uCam);
    float g = dGlass(p), c = dCer(p), gr = dGrounds(p), l = dLiq(p), s = dStream(p), pa = dPaper(p);
    float m = min(min(min(g, c), min(gr, l)), min(s, pa));
    if (m == g) {
      vec3 n = dGlassN(p); if (dot(n, rd) > 0.0) n = -n;
      float nv = clamp(dot(-rd, n), 0.0, 1.0);
      float F = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
      vec3 r = reflect(rd, n);
      col += thr * F * (env(r) + SUNC * 30.0 * pow(max(dot(r, uSun), 0.0), 400.0));
      // thin glass seen edge-on gathers a faint green-grey of its own
      thr *= (1.0 - F) * exp(-vec3(0.5, 0.32, 0.4) * 0.05 / max(nv, 0.1));
      ro = p + rd * clamp(0.03 / max(nv, 0.05), 0.03, 0.14);
      // a thin wall bends the view a hair, enough to make the edges swim
      rd = normalize(rd - n * 0.02 * (1.0 - nv));
      continue;
    }
    if (m == pa) col += thr * shadePaper(p, rd);
    else if (m == c) col += thr * shadeCer(p, rd);
    else if (m == gr) col += thr * shadeGrounds(p, rd);
    else col += thr * shadeCoffee(p, rd, m == s);
    break;
  }
  float T = 1.0;
  vec3 st = steam(uCam, rd, first, T);
  col = col * T + st;
  col = tone(col * 0.82);
  float coc = clamp((1.0 / uFocus - 1.0 / max(first, 0.01)) * uBlur, -1.0, 1.0);
  gl_FragColor = vec4(col, 0.5 + 0.5 * coc);
}
`;

// Supersampling: each frame is traced with a sub-pixel shift and folded into a running average.
const ACCUM = `
precision highp float;
uniform sampler2D uCur; uniform sampler2D uHist; uniform vec2 uRes; uniform float uW;
void main(){ vec2 uv = gl_FragCoord.xy / uRes; gl_FragColor = mix(texture2D(uHist, uv), texture2D(uCur, uv), uW); }
`;

// Developing it: depth of field gathered from the circle each pixel spreads over, a soft vignette, a little grain.
const POST = `
precision highp float;
uniform sampler2D uImg; uniform vec2 uRes; uniform float uMax; uniform float uGrain;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; vec2 px = 1.0 / uRes;
  vec4 c0 = texture2D(uImg, uv);
  float cs = c0.a * 2.0 - 1.0;
  vec3 sum = c0.rgb; float wsum = 1.0;
  for (int i = 0; i < 24; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 24.0) * uMax;
    vec4 s = texture2D(uImg, uv + vec2(cos(a), sin(a)) * r * px);
    float ss = s.a * 2.0 - 1.0;
    // a sample further away than this pixel may not spill over it
    float k = ss > cs + 0.02 ? min(abs(ss), abs(cs)) : abs(ss);
    float w = smoothstep(r - 1.0, r + 1.0, k * uMax);
    sum += s.rgb * w; wsum += w;
  }
  vec3 c = sum / wsum;
  vec2 q = uv - 0.5; c *= 1.0 - 0.16 * dot(q, q);
  c += (h21(gl_FragCoord.xy + uGrain * 37.0) - 0.5) * 0.02;
  gl_FragColor = vec4(c, 1.0);
}
`;

function camera(w: number, h: number) {
  const wide = w >= 900, mid = w >= 640;
  const dist = 6.6, el = wide ? 0.3 : 0.32;
  const tgt = [0, 1.12, 0];
  const cam = [0, tgt[1] + dist * Math.sin(el), -dist * Math.cos(el)];
  const foc = wide ? 1.9 : mid ? 1.5 : 1.04;
  const aspect = w / h;
  const shift = wide ? [Math.min(0.46, aspect * 0.21), -0.06] : [0, mid ? -0.2 : -0.215];
  return { dist, tgt, cam, foc, shift };
}

// Halton points for the sub-pixel shifts
const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

// No WebGL: the same set built from CSS.
function Still() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(180deg, #a69c90 0%, #b3a99c 46%, #d9cfbf 47%, #e6dccb 100%)" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 40% at 15% 30%, rgba(255,226,180,0.35), transparent 70%)" }} />
      <div className="absolute left-1/2 top-[56%] h-[300px] w-[190px] -translate-x-1/2 lg:left-[68%] lg:top-[22%] lg:h-[420px] lg:w-[260px]">
        <div className="absolute bottom-[-4%] left-[45%] h-[14%] w-[150%] rounded-full blur-md" style={{ background: "linear-gradient(90deg, rgba(60,40,25,0.45), rgba(120,60,20,0.25) 50%, transparent)" }} />
        <div className="absolute inset-x-[2%] bottom-0 h-[50%] rounded-[46%_46%_40%_40%/55%_55%_30%_30%]" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.05) 70%, rgba(255,255,255,0.4))", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.55)" }}>
          <div className="absolute inset-x-[4%] bottom-[3%] top-[30%] rounded-[40%_40%_44%_44%/18%_18%_40%_40%]" style={{ background: "linear-gradient(90deg, #6a2e0e, #2a1206 40%, #1a0b04 70%, #5a250a)" }} />
        </div>
        <div className="absolute left-[30%] top-[38%] h-[14%] w-[40%] rounded-[6px]" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.45), rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.35))" }} />
        <div className="absolute left-0 top-[6%] h-[34%] w-full" style={{ clipPath: "polygon(0 0, 100% 0, 66% 100%, 34% 100%)", background: "linear-gradient(90deg, #fffdf8, #f2ede4 45%, #d9d2c6 80%, #c4bcae)" }} />
      </div>
    </div>
  );
}

export default function PourOverCoffeeRoasterHero() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = cv.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: false }) as WebGLRenderingContext | null;
    if (!gl) { setShown("still"); return; }
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); return null; }
      return sh;
    };
    const link = (frag: string) => {
      const v = compile(gl.VERTEX_SHADER, VERT), f = compile(gl.FRAGMENT_SHADER, frag), p = gl.createProgram();
      if (!v || !f || !p) return null;
      gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    };
    const scene = link(SCENE), accum = link(ACCUM), post = link(POST);
    if (!scene || !accum || !post) { setShown("still"); return; }
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uTime", "uJit", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uBlur", "uSun"].map((n) => [n, U(scene, n)]));
    const au = Object.fromEntries(["uCur", "uHist", "uRes", "uW"].map((n) => [n, U(accum, n)]));
    const pu = Object.fromEntries(["uImg", "uRes", "uMax", "uGrain"].map((n) => [n, U(post, n)]));
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // one target for the fresh trace, two that take turns holding the running average
    const targets = [0, 1, 2].map(() => ({ tex: gl.createTexture(), fbo: gl.createFramebuffer() }));
    let W = 0, H = 0, cssW = 1, cssH = 1, scale = 1, n = 0, ping = 0;
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.1e6 / (cssW * cssH * dpr * dpr)));
      const w = Math.max(2, Math.round(cssW * dpr * k)), h = Math.max(2, Math.round(cssH * dpr * k));
      if (w === W && h === H) return;
      W = w; H = h; cv.width = W; cv.height = H; n = 0;
      for (const t of targets) {
        gl.bindTexture(gl.TEXTURE_2D, t.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    // the sun: low and behind to the left; the pointer swings it round and up or down, on a spring
    const light = { az: -1.05, el: 0.34, vaz: 0, vel: 0, taz: -1.05, tel: 0.34 };
    const sunDir = () => {
      const c = Math.cos(light.el);
      return [Math.sin(light.az) * c, Math.sin(light.el), Math.cos(light.az) * c];
    };
    const s = { t: 0, last: 0, raf: 0, visible: true, alive: true, first: true, frame: 0, slow: 0, touched: false, fpsT: 0, fpsN: 0 };

    const draw = () => {
      const c = camera(cssW, cssH);
      const sun = sunDir();
      n++;
      const cur = targets[0], hist = targets[1 + ping], out = targets[2 - ping];
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, cur.fbo);
      gl.viewport(0, 0, W, H);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform1f(su.uTime, s.t);
      gl.uniform2f(su.uJit, halton((n % 16) + 1, 2) - 0.5, halton((n % 16) + 1, 3) - 0.5);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]); gl.uniform3f(su.uTgt, c.tgt[0], c.tgt[1], c.tgt[2]);
      gl.uniform1f(su.uFoc, c.foc); gl.uniform2f(su.uShift, c.shift[0], c.shift[1]);
      gl.uniform1f(su.uFocus, c.dist); gl.uniform1f(su.uBlur, 16.0);
      gl.uniform3f(su.uSun, sun[0], sun[1], sun[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.useProgram(accum);
      gl.bindFramebuffer(gl.FRAMEBUFFER, out.fbo);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, cur.tex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, hist.tex);
      gl.uniform1i(au.uCur, 0); gl.uniform1i(au.uHist, 1); gl.uniform2f(au.uRes, W, H);
      gl.uniform1f(au.uW, Math.max(1 / n, reduce ? 0 : 0.3));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(post);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, out.tex);
      gl.uniform1i(pu.uImg, 0); gl.uniform2f(pu.uRes, W, H);
      gl.uniform1f(pu.uMax, (H / 760) * 8.0); gl.uniform1f(pu.uGrain, s.frame % 61);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      ping = 1 - ping;
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible || !s.alive) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      s.last = now; s.frame++;
      const dt = Math.min(dtRaw, 0.05);
      s.t += dt;
      // until someone moves the pointer, the morning light drifts a little by itself
      if (!s.touched && !reduce) { light.taz = -1.05 + 0.22 * Math.sin(s.t * 0.23); light.tel = 0.34 + 0.05 * Math.sin(s.t * 0.17 + 1.0); }
      // a soft spring with a touch of overshoot
      light.vaz += ((light.taz - light.az) * 14 - light.vaz * 5.5) * dt; light.az += light.vaz * dt;
      light.vel += ((light.tel - light.el) * 14 - light.vel * 5.5) * dt; light.el += light.vel * dt;
      draw();
      if (s.first && n >= (reduce ? 12 : 1)) { s.first = false; setShown("gl"); }
      s.fpsN++;
      if (now - s.fpsT > 1000) { box.dataset.fps = String(Math.round((s.fpsN * 1000) / (now - s.fpsT))); s.fpsT = now; s.fpsN = 0; }
      // measured, not guessed: if frames keep running long, trace fewer pixels
      if (dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && scale > 0.45) { scale *= 0.8; s.slow = 0; size(); }
      // with reduced motion, a still is built from sixteen shifted traces and then the loop stops
      if (!reduce || n < 16) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible && s.alive) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    s.t = 2.0;
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);

    const aim = (fx: number, fy: number) => {
      light.taz = -1.05 + (fx - 0.5) * 1.3;
      light.tel = Math.min(0.62, Math.max(0.16, 0.34 + (0.5 - fy) * 0.4));
      if (reduce) { light.az = light.taz; light.el = light.tel; n = 0; wake(); }
    };
    const move = (e: PointerEvent) => {
      if (reduce && e.pointerType === "mouse" && e.buttons === 0) return;
      const r = box.getBoundingClientRect();
      s.touched = true; aim((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    box.addEventListener("pointermove", move);
    const key = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault(); s.touched = true;
      if (e.key === "ArrowLeft") light.taz -= 0.15; if (e.key === "ArrowRight") light.taz += 0.15;
      if (e.key === "ArrowUp") light.tel = Math.min(0.62, light.tel + 0.05); if (e.key === "ArrowDown") light.tel = Math.max(0.16, light.tel - 0.05);
      light.taz = Math.min(-0.35, Math.max(-1.75, light.taz));
      if (reduce) { light.az = light.taz; light.el = light.tel; n = 0; }
      wake();
    };
    const knob = box.querySelector<HTMLElement>("[data-sun]");
    knob?.addEventListener("keydown", key);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      s.alive = false;
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move);
      knob?.removeEventListener("keydown", key);
      cv.removeEventListener("webglcontextlost", lost);
    };
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-[#b9afa2] text-[#1f1712]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes pour-over-roaster-hero-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        .pour-over-roaster-hero-rise { animation: pour-over-roaster-hero-rise 900ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .pour-over-roaster-hero-rise { animation: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[800px] w-full max-w-[1600px] lg:h-[760px]">
        {shown === "still" && <Still />}
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        <div className="pointer-events-none absolute inset-0 flex flex-col px-6 pb-7 pt-6 sm:px-10 lg:px-16 lg:pb-11 lg:pt-10">
          <p className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-[#2e231b]">
            <span>{roaster.house}</span>
            <span className="hidden sm:inline">{roaster.kind}</span>
          </p>
          <div className="pour-over-roaster-hero-rise mt-7 max-w-[36rem] lg:mb-auto lg:mt-auto">
            <h1 className="text-[46px] leading-[0.94] tracking-[-0.035em] text-[#1a120c] sm:text-[66px] lg:text-[92px]" style={{ fontFamily: SERIF }}>
              {roaster.headline.map((l, i) => (
                <span key={l} className={`block ${i === 1 ? "italic text-[#6b3412]" : ""}`}>{l}</span>
              ))}
            </h1>
            <p className="mt-5 max-w-[25rem] text-[16px] leading-[1.5] text-[#2b2018] lg:mt-7 lg:text-[18px]">{roaster.line}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 lg:mt-8">
              <a href="#" className="pointer-events-auto inline-flex h-[52px] items-center gap-3 whitespace-nowrap rounded-full bg-[#1a120c] pl-7 pr-6 text-[15px] font-semibold tracking-[-0.01em] text-[#f8f1e6] shadow-[0_16px_30px_-14px_rgba(30,18,8,0.85)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#1a120c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#cfc5b6] motion-reduce:transition-none">
                {roaster.cta}
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              </a>
              <a href="#" className="pointer-events-auto inline-flex h-11 items-center text-[15px] font-semibold text-[#1a120c] underline decoration-[#1a120c]/35 underline-offset-[6px] outline-none hover:decoration-[#1a120c] focus-visible:ring-2 focus-visible:ring-[#1a120c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#cfc5b6]">{roaster.more}</a>
            </div>
          </div>
          <div className="mt-auto flex items-end justify-between gap-4 lg:mt-0">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2e231b]">{roaster.note}</span>
            <span
              data-sun
              tabIndex={0}
              role="group"
              aria-label="Move the morning sun with the arrow keys"
              className={`pointer-events-auto h-10 items-center gap-2 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#2e231b] outline-none focus-visible:ring-2 focus-visible:ring-[#1a120c] ${shown === "still" ? "hidden" : "hidden sm:flex"}`}
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="10" cy="10" r="3.2" /><path d="M10 2v2.2M10 15.8V18M2 10h2.2M15.8 10H18M4.3 4.3l1.6 1.6M14.1 14.1l1.6 1.6M4.3 15.7l1.6-1.6M14.1 5.9l1.6-1.6" /></svg>
              Arrows move the sun
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
