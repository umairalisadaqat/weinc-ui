import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The four buttons, left to right. `label` is cut into the key top and is the button's accessible name. */
const keys = [
  { label: "Publish", role: "Primary", material: "Oxblood glazed ceramic" },
  { label: "Save draft", role: "Secondary", material: "Brushed steel" },
  { label: "Preview", role: "Tertiary", material: "Oiled walnut" },
  { label: "Cancel", role: "Ghost", material: "Frosted glass" },
];

const TRAVEL = 0.5; // how far a key goes down, in centimetres
const REST_TOUCH = 0.1; // how far a key dips while the pointer rests on it (0 to 1 of the travel)
const DEMO = true; // presses each key in turn until somebody touches the piece
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

/* ---- photoreal kit (pasted, see PHOTOREAL-KIT.md) ---- */
const FULLSCREEN_VS = `#version 300 es
out vec2 vUv;
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
const GLSL_HEADER = `#version 300 es
precision highp float;
uniform vec2 uRes;      // drawing buffer size in pixels
uniform float uFrame;   // sample index since the last reset (drives every random number)
uniform float uTime;    // seconds, for things that really move
uniform vec3 uCamPos, uCamRt, uCamUp, uCamFw;
uniform float uTan, uAspect, uAperture, uFocus;
uniform vec2 uShift;    // lens shift (architectural framing): move the subject in frame without tilting verticals
out vec4 o;`;
const GLSL_COMMON = `
#define PI 3.14159265359
float saturate(float x) { return clamp(x, 0.0, 1.0); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3) { p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y);
}
float vnoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 3.1; a *= 0.5; } return s; }
float fbm3(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
// Clamp one sample before it is averaged: a single lucky glossy ray hitting the window would otherwise leave
// a bright speck ("firefly") that takes hundreds of frames to fade. Call on the final colour in main().
vec3 clampSample(vec3 c, float m) { float l = max(c.r, max(c.g, c.b)); return l > m ? c * (m / l) : c; }
// A new well-spread 2D random point per pixel AND per frame: the R2 low-discrepancy sequence over frames,
// rotated by a per-pixel white-noise offset (structured offsets such as ign() show diagonal hatching while moving).
// Use a different salt for every decision (pixel jitter, lens, sun disc, gloss...). Accumulation averages them.
vec2 rand2(float salt) {
  vec2 f = gl_FragCoord.xy + salt * 17.13;
  return fract(vec2(hash12(f), hash12(f + 71.7)) + uFrame * vec2(0.7548776662, 0.5698402910));
}`;
const GLSL_SAMPLING = `
mat3 basisOf(vec3 n) { vec3 t = abs(n.y) < 0.999 ? normalize(cross(vec3(0.0, 1.0, 0.0), n)) : vec3(1.0, 0.0, 0.0); return mat3(t, cross(n, t), n); }
vec2 diskSample(vec2 u) { float r = sqrt(u.x), a = 6.2831853 * u.y; return r * vec2(cos(a), sin(a)); }
vec3 cosineSample(vec3 n, vec2 u) { vec2 d = diskSample(u); return basisOf(n) * vec3(d, sqrt(max(0.0, 1.0 - dot(d, d)))); }
// a microfacet normal from the GGX distribution: reflect about it for a rough reflection, refract through it for frosted glass
vec3 ggxSample(vec3 n, float rough, vec2 u) {
  float a = rough * rough;
  float ct = sqrt((1.0 - u.x) / (1.0 + (a * a - 1.0) * u.x)), st = sqrt(max(0.0, 1.0 - ct * ct)), ph = 6.2831853 * u.y;
  return normalize(basisOf(n) * vec3(st * cos(ph), st * sin(ph), ct));
}`;
const GLSL_CAMERA = `
// Thin-lens camera. Sub-pixel jitter = supersampling; a random point on the lens = true depth of field.
// uAperture is the lens radius in scene units (0 = pinhole). uFocus is the distance along the view axis that is sharp.
void cameraRay(out vec3 ro, out vec3 rd) {
  vec2 px = rand2(1.0) - 0.5;
  vec2 ndc = (gl_FragCoord.xy + px) / uRes * 2.0 - 1.0 - uShift;
  vec3 dir = normalize(uCamFw + uCamRt * (ndc.x * uTan * uAspect) + uCamUp * (ndc.y * uTan));
  vec3 fp = uCamPos + dir * (uFocus / dot(dir, uCamFw));
  vec2 lens = diskSample(rand2(2.0)) * uAperture;
  ro = uCamPos + uCamRt * lens.x + uCamUp * lens.y;
  rd = normalize(fp - ro);
}`;
// the light rig, edited for this scene: a small, low window so one pool of sun lands across the keys
const GLSL_RIG_SETTINGS = `
const vec3 KEY_DIR = normalize(vec3(-0.3, 0.52, -0.8));
const vec3 KEY_COL = vec3(1.0, 0.83, 0.64) * 2.1;
const float KEY_SPREAD = 0.006;
const float WIN_DIST = 140.0;
const vec2 WIN_HALF = vec2(13.0, 16.0);
const vec2 WIN_OFF = vec2(2.0, 4.0);
const float BAR = 0.8;
const float BAR_Y = 3.0;
const vec3 SKY_COL = vec3(0.58, 0.66, 0.78) * 0.17;
const vec3 FILL_DIR = normalize(vec3(0.3, 0.42, 1.0));
const vec3 FILL_COL = vec3(1.0, 0.95, 0.88) * 0.13;
const vec3 CEIL_COL = vec3(0.95, 0.9, 0.84) * 0.42;`;
const GLSL_LIGHT_RIG = `
// the window opening with one vertical bar and one transom, in window-plane units
float paneMask(vec2 q, float pen) {
  vec2 e = WIN_HALF - abs(q);
  float open = smoothstep(-pen, pen, e.x) * smoothstep(-pen, pen, e.y);
  float bars = smoothstep(-pen, pen, abs(q.x) - BAR) * smoothstep(-pen, pen, abs(q.y - BAR_Y) - BAR);
  return open * bars;
}
// The gobo: how much of the window a point sees along KEY_DIR. This is what makes light look like it came
// from a real room instead of a CG directional light: a pool with straight edges and bar shadows.
float keyGobo(vec3 p) {
  mat3 B = basisOf(KEY_DIR);
  vec2 q = vec2(dot(p, B[0]), dot(p, B[1])) - WIN_OFF;
  float d = max(WIN_DIST - dot(p, KEY_DIR), 1.0);
  return paneMask(q, 0.25 + d * KEY_SPREAD);
}
// What a mirror sees. The window appears as a bright shape with bars: that shape in every reflection is the
// single strongest "this is a photograph" cue. Everything else is dark so reflections have contrast.
// envStudioRough: the same room seen in a ROUGH surface. Instead of firing random glossy rays at a small, very
// bright window (the source of sand-like speckle and sparkling metal), the window and card are blurred
// analytically by the roughness. Deterministic: zero noise, converges in one frame.
vec3 envStudioRough(vec3 rd, float rough) {
  float a = rough * rough;                       // GGX alpha: roughly the angular blur in radians
  vec3 c = mix(vec3(0.028, 0.025, 0.022), CEIL_COL, smoothstep(0.1 - a, 0.95 + a, rd.y));
  c = mix(c, vec3(0.09, 0.075, 0.06), smoothstep(0.0, -0.5 - a, rd.y));
  float k = dot(rd, KEY_DIR);
  if (k > 0.0) {
    mat3 B = basisOf(KEY_DIR);
    vec2 q = vec2(dot(rd, B[0]), dot(rd, B[1])) / k * WIN_DIST - WIN_OFF;
    float pen = 1.2 + a * WIN_DIST;
    // a blurred window spreads the same light over a larger area: keep its energy, so the peak drops
    float spread = (WIN_HALF.x * WIN_HALF.y) / ((WIN_HALF.x + pen) * (WIN_HALF.y + pen));
    c += vec3(1.0, 0.96, 0.9) * 26.0 * paneMask(q, pen) * mix(1.0, spread, saturate(a * 4.0));
  }
  float f = dot(rd, FILL_DIR);
  if (f > 0.0) {
    mat3 B = basisOf(FILL_DIR);
    vec2 e = vec2(0.6, 0.36) - abs(vec2(dot(rd, B[0]), dot(rd, B[1])) / f);
    float w = 0.18 + a;
    c += FILL_COL * 7.0 * smoothstep(-w, w, e.x) * smoothstep(-w, w, e.y);
  }
  return c;
}
vec3 envStudio(vec3 rd) { return envStudioRough(rd, 0.0); }`;
const GLSL_MATERIALS = `
// q = position in the object's own frame, in CENTIMETRES (scale noise accordingly if your units differ).
// n = geometric normal. Every material returns a perturbed normal: real surfaces are never perfect.
struct Mat { vec3 albedo; float rough; float metal; float coat; vec3 n; };
Mat mk(vec3 a, float r, float m, float c, vec3 n) { Mat x; x.albedo = a; x.rough = r; x.metal = m; x.coat = c; x.n = n; return x; }

// Metals: these are reflectance (F0) colours in linear light, not paint colours.
const vec3 BRASS = vec3(0.88, 0.69, 0.37);
const vec3 GOLD = vec3(1.0, 0.76, 0.33);
const vec3 STEEL = vec3(0.56, 0.56, 0.54);
const vec3 ALUMINIUM = vec3(0.91, 0.92, 0.92);
const vec3 COPPER = vec3(0.95, 0.62, 0.50);

// Brushed: fine parallel scratches along axis. Tilting the normal ACROSS the brushing stretches highlights
// across it, which is how brushed metal really looks.
Mat matBrushed(vec3 q, vec3 n, vec3 f0, vec3 axis) {
  vec3 b = normalize(cross(n, axis) + 1e-4);
  float a = dot(q, axis), c = dot(q, b);
  float s = 0.6 * vnoise(vec2(a * 0.5, c * 240.0)) + 0.4 * vnoise(vec2(a * 0.1, c * 700.0));
  return mk(f0 * (0.96 + 0.04 * s), 0.24 + 0.04 * s, 1.0, 0.0, normalize(n + b * (s - 0.5) * 0.012));
}
// Polished: near mirror, with faint handling haze in patches (no real polished object is uniform).
Mat matPolished(vec3 q, vec3 n, vec3 f0) {
  float h = fbm(q.xz * 0.9 + q.y);
  return mk(f0, 0.04 + 0.09 * smoothstep(0.45, 0.75, h), 1.0, 0.0, n);
}
// Glazed ceramic: coloured body under a glass coat; glaze pools and thins, a few pinholes, gentle waviness.
Mat matCeramic(vec3 q, vec3 n, vec3 glaze) {
  float pool = fbm(q.xz * 0.6 + q.y * 0.4);
  float pin = step(0.996, hash13(floor(q * 22.0)));
  vec3 w = vec3(fbm(q.xy * 1.3) - 0.5, 0.0, fbm(q.zy * 1.3 + 4.0) - 0.5);
  return mk(glaze * (0.78 + 0.4 * pool) * (1.0 - 0.6 * pin), 0.35, 0.0, 1.0, normalize(n + w * 0.025));
}
// Matte paper or card: fibres, never flat white.
Mat matPaper(vec3 q, vec3 n, vec3 tint) {
  float f = fbm(q.xz * 9.0) * 0.6 + vnoise(q.xz * 60.0) * 0.4;
  return mk(tint * (0.93 + 0.08 * f), 0.88, 0.0, 0.0, normalize(n + vec3(f - 0.5, 0.0, f - 0.5) * 0.02));
}
// Linen: plain weave with slubs (thicker uneven threads), about 18 threads per cm.
Mat matLinen(vec3 q, vec3 n, vec3 tint) {
  vec2 u = q.xz * 18.0;
  float wx = 0.5 + 0.5 * sin(u.x * PI), wy = 0.5 + 0.5 * sin(u.y * PI);
  float over = mod(floor(u.x) + floor(u.y), 2.0);
  float th = mix(wx, wy, over);
  float slub = vnoise(vec2(floor(u.x) * 3.1, u.y * 0.08)) * vnoise(vec2(u.x * 0.08, floor(u.y) * 2.7));
  vec3 a = tint * (0.8 + 0.2 * th) * (0.92 + 0.16 * slub);
  return mk(a, 0.9, 0.0, 0.0, normalize(n + vec3(cos(u.x * PI) * (1.0 - over), 0.0, cos(u.y * PI) * over) * 0.08));
}
// Plaster / limewash: broad trowel clouds and fine pores.
Mat matPlaster(vec3 q, vec3 n, vec3 tint) {
  float c = fbm(q.xy * 0.18 + q.z * 0.1), p = vnoise(q.xy * 35.0 + q.z);
  return mk(tint * (0.86 + 0.22 * c) * (0.97 + 0.04 * p), 0.92, 0.0, 0.0, normalize(n + vec3(p - 0.5, c - 0.5, 0.0) * 0.03));
}
// Honed travertine: cream with soft bands along one direction and long shallow pits.
Mat matTravertine(vec3 q, vec3 n) {
  float band = fbm(vec2(q.z * 0.35 + fbm(q.xz * 0.08) * 2.0, q.x * 0.03));
  vec3 a = mix(vec3(0.66, 0.58, 0.47), vec3(0.78, 0.71, 0.6), band);
  float pitN = vnoise(vec2(q.x * 1.6, q.z * 9.0) + 7.0) * vnoise(vec2(q.x * 0.5, q.z * 3.0));
  float pit = smoothstep(0.5, 0.58, pitN);
  a = mix(a, vec3(0.52, 0.44, 0.34), pit * 0.3);
  a *= 0.96 + 0.08 * vnoise(q.xz * 30.0);
  return mk(a, mix(0.42, 0.9, pit), 0.0, 0.0, normalize(n + vec3(0.0, 0.0, pit * 0.08)));
}
// Marble: soft warped veins, polished.
Mat matMarble(vec3 q, vec3 n, vec3 base, vec3 vein) {
  // thin veins that wander but do not curl: low warp, a main vein family and a fainter hairline family
  float w = fbm3(q * 0.15) * 3.2;
  float v = 1.0 - smoothstep(0.0, 0.05, abs(sin(q.x * 0.35 + q.z * 0.18 + w)));
  float hair = 1.0 - smoothstep(0.0, 0.03, abs(sin(q.x * 0.9 - q.z * 0.6 + w * 1.7)));
  vec3 a = mix(base, vein, v * 0.6 + hair * 0.2) * (0.96 + 0.08 * fbm(q.xz * 1.5));
  return mk(a, 0.12, 0.0, 0.6, n);
}
// Wood, grain running along x. Photographic wood is LOW contrast: rings within 25% brightness, not stripes.
const vec3 OAK_LIGHT = vec3(0.52, 0.36, 0.20), OAK_DARK = vec3(0.36, 0.23, 0.12);
const vec3 WALNUT_LIGHT = vec3(0.20, 0.11, 0.06), WALNUT_DARK = vec3(0.11, 0.055, 0.03);
Mat matWood(vec3 q, vec3 n, vec3 light, vec3 dark, float pores) {
  float r = length(q.yz + vec2(9.0, 4.0)) * 3.2 + fbm3(q * vec3(0.05, 0.7, 0.7)) * 3.0;
  float ring = smoothstep(0.4, 0.95, fract(r));
  float streak = vnoise(vec2(q.x * 0.05, q.z * 11.0 + q.y * 11.0)) * 0.6 + vnoise(vec2(q.x * 0.2, q.z * 40.0)) * 0.4;
  vec3 a = mix(light, dark, ring * 0.3 + streak * 0.35);
  float pore = smoothstep(0.78, 0.86, vnoise(vec2(q.x * 1.4, (q.z + q.y) * 55.0))) * pores;
  a *= 1.0 - pore * 0.35;
  return mk(a, 0.45 + 0.2 * pore, 0.0, 0.35, normalize(n + vec3(0.0, 0.0, (streak - 0.5) * 0.03)));
}

// Dielectrics (glass, acrylic, resin). You trace the refracted ray yourself; these do the physics around it.
float fresnelD(float c, float ior) { float r = (1.0 - ior) / (1.0 + ior); r *= r; return r + (1.0 - r) * pow(1.0 - saturate(c), 5.0); }
// Light lost to the colour of the body over a path of length len. absorb is per unit length per channel:
// clear soda glass vec3(0.05, 0.012, 0.03) per cm (green edges); resin uses strong values for deep colour.
vec3 beer(vec3 absorb, float len) { return exp(-absorb * len); }`;
const GLSL_SDF = `
float sdRoundBox(vec3 p, vec3 b, float r) { vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float smax(float a, float b, float k) { float h = max(k - abs(a - b), 0.0); return max(a, b) + h * h * 0.25 / k; }
float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.0); return min(a, b) - h * h * 0.25 / k; }
// ray vs box centred at the origin: (t near, t far)
vec2 boxI(vec3 ro, vec3 rd, vec3 b) {
  rd = mix(rd, vec3(1e-5), lessThan(abs(rd), vec3(1e-5)));
  vec3 m = 1.0 / rd, n = m * ro, k = abs(m) * b;
  vec3 t1 = -n - k, t2 = -n + k;
  return vec2(max(max(t1.x, t1.y), t1.z), min(min(t2.x, t2.y), t2.z));
}
vec3 boxFaceNormal(vec3 p, vec3 b) { vec3 d = abs(p) / b; return d.x > d.y && d.x > d.z ? vec3(sign(p.x), 0, 0) : d.y > d.z ? vec3(0, sign(p.y), 0) : vec3(0, 0, sign(p.z)); }`;
const GLSL_SHADOW_AO = `
// needs: const float SCENE_TOP, AO_RADIUS; float map(vec3); float mapShadow(vec3); vec3 lightFilter(vec3 p, vec3 l)
// Deterministic penumbra (no random sun points: random shadow rays are the main source of floor speckle).
// SHADOW_SOFT is the penumbra angle in radians: sun-sharp is ~0.01, overcast-soft ~0.08.
const float SHADOW_SOFT = 0.03;
float softShadow(vec3 ro, vec3 rd, float tmin, float tmax) {
  float res = 1.0, t = tmin, ph = 1e10;
  for (int i = 0; i < 48; i++) {
    vec3 p = ro + rd * t;
    if (p.y > SCENE_TOP && rd.y > 0.0) break;
    float h = mapShadow(p);
    if (h < 0.0004) return 0.0;
    float y = h * h / (2.0 * ph), d = sqrt(max(h * h - y * y, 0.0));
    res = min(res, d / (SHADOW_SOFT * max(1e-3, t - y)));
    ph = h;
    t += clamp(h, 0.01, 3.0);
    if (t > tmax) break;
  }
  res = saturate(res);
  return res * res * (3.0 - 2.0 * res);
}
vec3 shadowCol(vec3 ro, vec3 rd) { return softShadow(ro, rd, 0.01, 200.0) * lightFilter(ro, rd); }
float calcAO(vec3 p, vec3 n) {
  float occ = 0.0, s = 1.0;
  for (int i = 0; i < 5; i++) { float h = AO_RADIUS * (0.06 + 0.94 * float(i) / 4.0); occ += (h - map(p + n * h)) * s; s *= 0.72; }
  return saturate(1.0 - 1.4 * occ / AO_RADIUS);
}
vec3 calcNormal(vec3 p, float e) {
  vec2 k = vec2(1.0, -1.0);
  return normalize(k.xyy * map(p + k.xyy * e) + k.yyx * map(p + k.yyx * e) + k.yxy * map(p + k.yxy * e) + k.xxx * map(p + k.xxx * e));
}`;
const GLSL_LIGHTING = `
// One opaque surface under the rig. Diffuse from the key (through the window gobo, with smooth analytic
// shadows), cool sky and the card; specular reflects the room along the mirror direction with the window
// pre-blurred by roughness (envStudioRough). Everything here is deterministic, so it adds NO per-frame noise:
// accumulation only has to clean up edges, depth of field and any glass you trace yourself.
// coat adds a sharp glaze/lacquer layer.
vec3 litOpaque(vec3 p, vec3 v, Mat m, float ao) {
  vec3 n = m.n;
  float NoV = max(dot(n, v), 1e-3);
  vec3 L = KEY_DIR;
  float NoL = max(dot(n, L), 0.0);
  vec3 sun = NoL > 0.0 ? KEY_COL * NoL * keyGobo(p) * shadowCol(p + n * 0.015, L) : vec3(0.0);
  vec3 f0 = mix(vec3(0.04), m.albedo, m.metal);
  vec3 F = f0 + (1.0 - f0) * pow(1.0 - NoV, 5.0);
  vec3 amb = SKY_COL * (0.55 + 0.45 * n.y) + FILL_COL * 1.6 * max(dot(n, FILL_DIR) + 0.25, 0.0);
  vec3 col = (1.0 - F) * (1.0 - m.metal) * m.albedo * (sun + amb * ao);
  vec3 r = reflect(-v, n);
  // rough surfaces lose some of the grazing Fresnel boost
  vec3 Fr = f0 + (max(vec3(1.0 - m.rough), f0) - f0) * pow(1.0 - NoV, 5.0);
  col += Fr * envStudioRough(r, m.rough) * mix(vec3(1.0), shadowCol(p + n * 0.015, r), 1.0 - m.rough * 0.6) * mix(1.0, ao, 0.6);
  if (m.coat > 0.0) {
    vec3 rc = reflect(-v, n);
    float Fc = (0.04 + 0.96 * pow(1.0 - NoV, 5.0)) * m.coat;
    col = col * (1.0 - Fc) + Fc * envStudio(rc) * shadowCol(p + n * 0.015, rc);
  }
  return col;
}
// Light that a lit translucent body gives off from inside (resin, wax, jade, frosted acrylic).
vec3 subsurface(vec3 p, vec3 n, vec3 scatterCol, float strength) {
  return scatterCol * strength * (KEY_COL * keyGobo(p) * (0.35 + 0.65 * max(dot(n, KEY_DIR), 0.0)) + SKY_COL);
}`;
const OUTPUT_FS = `#version 300 es
precision highp float;
uniform sampler2D uAccum;
uniform vec2 uPx;
uniform float uExposure, uGrain, uVignette, uSeed, uHalation;
in vec2 vUv;
out vec4 o;
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
// ACES filmic fit: highlights roll off instead of clipping, which is most of the "camera" look
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec3 c = texture(uAccum, vUv).rgb;
  // halation: the brightest highlights bleed a warm glow, like light scattering in film
  vec3 g = vec3(0.0);
  float rot = 6.2831853 * ign(gl_FragCoord.xy);
  for (int k = 0; k < 12; k++) {
    float a = float(k) * 2.39996 + rot, r = 2.0 + 24.0 * sqrt(float(k) / 12.0);
    g += max(texture(uAccum, vUv + vec2(cos(a), sin(a)) * r * uPx).rgb - 2.0, 0.0);
  }
  c += g / 12.0 * vec3(0.42, 0.3, 0.22) * uHalation;
  c = aces(c * uExposure);
  vec2 q = vUv - 0.5;
  c *= 1.0 - uVignette * dot(q, q) * 2.0;
  c = pow(c, vec3(1.0 / 2.2));
  // grain lives in the midtones, never in pure black or white
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  // static grain (it does not crawl), meant to be barely visible: default amplitude 0.012
  c += (hash(gl_FragCoord.xy + uSeed) - 0.5) * uGrain * (0.25 + 3.0 * l * (1.0 - l));
  o = vec4(c, 1.0);
}`;
type Vec3 = [number, number, number];
type Camera = { pos: Vec3; rt: Vec3; up: Vec3; fw: Vec3; tan: number; aspect: number; shift: [number, number]; aperture: number; focus: number };
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: Vec3): Vec3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function lookAt(pos: Vec3, target: Vec3, fovYdeg: number, aspect: number, aperture = 0, shift: [number, number] = [0, 0]): Camera {
  const fw = norm(sub(target, pos));
  const rt = norm(cross(fw, [0, 1, 0]));
  const up = cross(rt, fw);
  return { pos, rt, up, fw, tan: Math.tan((fovYdeg * Math.PI) / 360), aspect, shift, aperture, focus: Math.hypot(...sub(target, pos)) };
}
function project(cam: Camera, p: Vec3, cssW: number, cssH: number): [number, number, number] {
  const d = sub(p, cam.pos);
  const z = dot(d, cam.fw);
  const x = dot(d, cam.rt) / (z * cam.tan * cam.aspect) + cam.shift[0];
  const y = dot(d, cam.up) / (z * cam.tan) + cam.shift[1];
  return [(x * 0.5 + 0.5) * cssW, (0.5 - y * 0.5) * cssH, z];
}
function overlayRect(cam: Camera, center: Vec3, half: Vec3, cssW: number, cssH: number) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < 8; i++) {
    const [x, y] = project(cam, [center[0] + (i & 1 ? half[0] : -half[0]), center[1] + (i & 2 ? half[1] : -half[1]), center[2] + (i & 4 ? half[2] : -half[2])], cssW, cssH);
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
}
function compileProgram(gl: WebGL2RenderingContext, vs: string, fs: string) {
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
type StageOptions = {
  canvas: HTMLCanvasElement;
  wrap: HTMLElement;
  /** full fragment shader: GLSL_HEADER + chunks + your scene. Writes linear HDR to `o`. */
  sceneFS: string;
  /** called once per CSS resize, before drawing: build your camera here and return it */
  camera: (cssW: number, cssH: number) => Camera;
  /** your uniforms, every rendered frame (program is in use) */
  uniforms?: (gl: WebGL2RenderingContext, loc: (name: string) => WebGLUniformLocation | null, t: number) => void;
  /** advance your simulation; return true while anything visible is still moving */
  step?: (dt: number, t: number) => boolean;
  /** samples per pixel when at rest (then drawing stops). Default 128; never below 96 */
  samples?: number;
  /** blend weight of each new frame while moving: 0.25 (default) keeps ~4 frames of history; raise for fast motion */
  motionBlend?: number;
  maxPixels?: number; // cap on drawing buffer pixels, default 2.2e6
  maxDpr?: number; // default 2
  exposure?: number; grain?: number; vignette?: number; halation?: number;
  onFail?: () => void; // WebGL 2 missing, shader error or context lost: show your CSS still
};
function createPhotoStage(o: StageOptions) {
  const { canvas, wrap } = o;
  const fail = () => { o.onFail?.(); return null; };
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, powerPreference: "high-performance" });
  if (!gl) return fail();
  const float = !!gl.getExtension("EXT_color_buffer_float");
  let scene: WebGLProgram, out: WebGLProgram;
  try {
    scene = compileProgram(gl, FULLSCREEN_VS, o.sceneFS);
    out = compileProgram(gl, FULLSCREEN_VS, OUTPUT_FS);
  } catch (e) {
    console.error(e);
    return fail();
  }
  const SAMPLES = o.samples ?? 128;
  const MOTION = o.motionBlend ?? 0.25;
  let frameNo = 0;
  const maxPixels = o.maxPixels ?? 2.2e6;
  let scale = Math.min(window.devicePixelRatio || 1, o.maxDpr ?? 2);
  const vao = gl.createVertexArray();
  const fbo = gl.createFramebuffer();
  const tex = gl.createTexture();
  const locS = new Map<string, WebGLUniformLocation | null>();
  const loc = (n: string) => { if (!locS.has(n)) locS.set(n, gl.getUniformLocation(scene, n)); return locS.get(n)!; };
  const locO = (n: string) => gl.getUniformLocation(out, n);
  let W = 0, H = 0, cssW = 1, cssH = 1, n = 0, cam: Camera | null = null;

  const resize = () => {
    cssW = Math.max(1, wrap.clientWidth); cssH = Math.max(1, wrap.clientHeight);
    let k = scale;
    if (cssW * cssH * k * k > maxPixels) k = Math.sqrt(maxPixels / (cssW * cssH));
    cam = o.camera(cssW, cssH);
    n = 0;
    const w = Math.max(2, Math.round(cssW * k)), h = Math.max(2, Math.round(cssH * k));
    if (w === W && h === H) return;
    W = w; H = h; canvas.width = W; canvas.height = H;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, float ? gl.RGBA16F : gl.RGBA8, W, H, 0, gl.RGBA, float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  };

  const draw = (t: number, moving: boolean) => {
    const c = cam!;
    gl.bindVertexArray(vao);
    gl.viewport(0, 0, W, H);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.useProgram(scene);
    gl.uniform2f(loc("uRes"), W, H);
    gl.uniform1f(loc("uFrame"), frameNo++); // never repeats, so moving frames keep exploring new samples
    gl.uniform1f(loc("uTime"), t);
    gl.uniform3fv(loc("uCamPos"), c.pos); gl.uniform3fv(loc("uCamRt"), c.rt); gl.uniform3fv(loc("uCamUp"), c.up); gl.uniform3fv(loc("uCamFw"), c.fw);
    gl.uniform1f(loc("uTan"), c.tan); gl.uniform1f(loc("uAspect"), c.aspect); gl.uniform1f(loc("uAperture"), c.aperture); gl.uniform1f(loc("uFocus"), c.focus);
    gl.uniform2fv(loc("uShift"), c.shift);
    o.uniforms?.(gl, loc, t);
    // blend the new jittered frame into the running average: alpha 1/(n+1) is an exact mean;
    // while moving keep a SHORT history instead of restarting: alpha 0.25 is about 4 frames (a touch of motion
    // blur, no speckle). When it stops, carry on averaging from there: n continues at 1/MOTION samples.
    const alpha = moving ? MOTION : 1 / (n + 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
    gl.blendColor(0, 0, 0, n === 0 ? 1 : alpha);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(out);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(locO("uAccum"), 0);
    gl.uniform2f(locO("uPx"), 1 / W, 1 / H);
    gl.uniform1f(locO("uExposure"), o.exposure ?? 1);
    gl.uniform1f(locO("uGrain"), o.grain ?? 0.012);
    gl.uniform1f(locO("uVignette"), o.vignette ?? 0.35);
    gl.uniform1f(locO("uHalation"), o.halation ?? 0.6);
    gl.uniform1f(locO("uSeed"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    n = moving ? Math.round(1 / MOTION) : n + 1;
  };

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(wrap);

  let raf = 0, last = performance.now(), slow = 0, onScreen = true, dead = false;
  const t0 = last;
  const tick = (now: number) => {
    raf = 0;
    const real = now - last;
    last = now;
    const dt = Math.min(real / 1000, 0.05);
    const t = (now - t0) / 1000;
    const moving = o.step ? o.step(dt, t) : false;
    if (moving || n < SAMPLES) {
      if (moving) {
        // measure, do not guess: if moving frames run long, draw fewer pixels
        slow = slow * 0.9 + (real > 28 ? 0.1 : 0);
        if (slow > 0.55 && scale > 0.45) { scale *= 0.85; slow = 0; W = 0; resize(); }
      }
      draw(t, moving);
    }
    if (onScreen && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const wake = () => { if (!raf && !dead && onScreen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; wake(); });
  io.observe(wrap);
  document.addEventListener("visibilitychange", wake);
  const lost = (e: Event) => { e.preventDefault(); dead = true; o.onFail?.(); };
  canvas.addEventListener("webglcontextlost", lost);
  wake();

  return {
    /** something changed that is not animated (theme, text, reduced-motion snap): restart accumulation */
    invalidate() { n = 0; wake(); },
    /** call after step() starts moving from rest (input), so the loop is running */
    wake,
    camera: () => cam!,
    size: () => [cssW, cssH] as const,
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      canvas.removeEventListener("webglcontextlost", lost);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
function springStep(s: { x: number; v: number }, target: number, dt: number, k = 900, damping = 38) {
  const sub = Math.max(1, Math.ceil(dt / 0.004));
  for (let i = 0; i < sub; i++) {
    const h = dt / sub;
    s.v += (k * (target - s.x) - damping * s.v) * h;
    s.x += s.v * h;
  }
  if (Math.abs(s.v) < 0.02 && Math.abs(target - s.x) < 0.002) { s.x = target; s.v = 0; return false; }
  return true;
}
function stillObject(face: string, opts: { radius?: number; depth?: number } = {}) {
  const r = opts.radius ?? 14, d = opts.depth ?? 10;
  return {
    background: face,
    borderRadius: r,
    boxShadow: [
      "inset 0 1px 0 rgba(255,255,255,0.35)",
      "inset 0 -2px 3px rgba(0,0,0,0.22)",
      `0 ${d * 0.4}px ${d * 0.3}px rgba(0,0,0,0.28)`,
      `${d * 1.6}px ${d * 2.2}px ${d * 3}px rgba(20,12,4,0.30)`,
    ].join(", "),
  };
}
const STILL_GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
function stillWindowLight(warm = "255,236,205") {
  return {
    background: `linear-gradient(115deg, transparent 18%, rgba(${warm},0.55) 30%, rgba(${warm},0.55) 47%, transparent 48.5%, transparent 50%, rgba(${warm},0.5) 51.5%, rgba(${warm},0.45) 70%, transparent 82%)`,
    filter: "blur(6px)",
    mixBlendMode: "soft-light" as const,
  };
}
/* ---- end of kit ---- */

// The scene: four keys sitting in wells cut into a honed travertine slab, under window light. Units are centimetres.
const KX = 3.0; // half the key's width
const PITCH = 7.6; // key centre to key centre, in centimetres
const SCENE = `
const float SCENE_TOP = 1.2;
const float AO_RADIUS = 1.4;
uniform float uPress[4];
uniform vec2 uKP[4]; // where each key stands on the slab (x, z): a row on wide screens, two by two on phones
uniform sampler2D uLegend;
const float KX = ${KX.toFixed(2)}, KYH = 0.75, KR = 0.42, PITCH = ${PITCH.toFixed(2)};
const vec3 GLASS_ABS = vec3(0.07, 0.018, 0.04);

vec3 keyC(int i) { return vec3(uKP[i].x, 0.25 - ${TRAVEL.toFixed(2)} * uPress[i], uKP[i].y); }
vec2 scene(vec3 p, int skip) {
  float w = 1e9, d = 1e9, id = 0.0;
  for (int i = 0; i < 4; i++) {
    vec3 q = p - vec3(uKP[i].x, 0.0, uKP[i].y);
    w = min(w, sdRoundBox(q - vec3(0.0, -0.4, 0.0), vec3(KX + 0.2, 1.0, KX + 0.2), 0.3));
    if (i != skip) { float k = sdRoundBox(p - keyC(i), vec3(KX, KYH, KX), KR); if (k < d) { d = k; id = float(i + 1); } }
  }
  float slab = smax(p.y, -w, 0.16);
  return slab < d ? vec2(slab, 0.0) : vec2(d, id);
}
float map(vec3 p) { return scene(p, -1).x; }
// the glass key does not block the sun; lightFilter tints and focuses what passes through it instead
float mapShadow(vec3 p) { return scene(p, 3).x; }
vec3 lightFilter(vec3 p, vec3 l) {
  vec3 c = keyC(3), b = vec3(KX - 0.15, KYH, KX - 0.15);
  vec2 tb = boxI(p - c, l, b);
  if (tb.y <= max(tb.x, 0.0)) return vec3(1.0);
  float len = tb.y - max(tb.x, 0.0);
  vec3 e = b - abs(p - c + l * (max(tb.x, 0.0) + tb.y) * 0.5);
  float rim = min(e.x, e.z);
  return beer(GLASS_ABS, len) * (0.35 + 0.95 * smoothstep(0.0, 0.7, rim));
}
`;
const SCENE_MAIN = `
float legendAt(int i, vec2 uv) { uv = clamp(uv, 0.002, 0.998); return texture(uLegend, vec2((float(i) + uv.x) * 0.25, uv.y)).r; }
// the lettering on a key top, and the slope of its walls (for engraved or raised letters)
vec3 legend(int i, vec3 q, vec3 n) {
  float top = smoothstep(0.8, 0.97, n.y);
  if (top <= 0.0) return vec3(0.0);
  vec2 uv = q.xz / (2.0 * (KX - 0.25)) + 0.5;
  float e = 1.0 / 512.0;
  return top * vec3(legendAt(i, uv), legendAt(i, uv + vec2(e, 0.0)) - legendAt(i, uv - vec2(e, 0.0)), legendAt(i, uv + vec2(0.0, e)) - legendAt(i, uv - vec2(0.0, e)));
}
vec3 shadeKey(int i, vec3 p, vec3 v, vec3 n, float ao) {
  vec3 q = p - keyC(i);
  vec3 lg = legend(i, q, n);
  Mat m;
  if (i == 0) {
    // glaze over the whole top, lettering in a raised cream slip
    m = matCeramic(q, normalize(n - vec3(lg.y, 0.0, lg.z) * 0.9), vec3(0.17, 0.02, 0.017));
    m.albedo = mix(m.albedo, vec3(0.80, 0.70, 0.54), lg.x);
    m.rough = mix(m.rough, 0.5, lg.x);
  } else if (i == 1) {
    // engraved and filled with black enamel
    m = matBrushed(q, normalize(n + vec3(lg.y, 0.0, lg.z) * 0.9), ALUMINIUM * 0.82, vec3(1.0, 0.0, 0.0));
    m.rough += 0.08;
    m.albedo = mix(m.albedo, vec3(0.012), lg.x);
    m.metal = 1.0 - lg.x;
    m.rough = mix(m.rough, 0.45, lg.x);
  } else {
    // cut into the oiled wood and filled with cream paint
    m = matWood(q + vec3(float(i) * 11.0, 0.0, 0.0), normalize(n + vec3(lg.y, 0.0, lg.z) * 0.9), WALNUT_LIGHT, WALNUT_DARK, 1.0);
    m.albedo = mix(m.albedo, vec3(0.72, 0.62, 0.46), lg.x);
    m.coat *= 1.0 - lg.x;
  }
  return litOpaque(p, v, m, ao);
}
vec3 shadeOpaque(int id, vec3 p, vec3 v) {
  vec3 n = calcNormal(p, 0.002);
  float ao = calcAO(p, n);
  if (id == 0) return litOpaque(p, v, matTravertine(p, n), ao);
  return shadeKey(id - 1, p, v, n, ao);
}
// what the bent ray sees under and beyond the glass key: the well, the stone, the next key
vec3 traceBehind(vec3 ro, vec3 rd) {
  float t = 0.0;
  for (int s = 0; s < 72; s++) {
    vec2 h = scene(ro + rd * t, 3);
    if (h.x < 0.0004 * (t + 1.0)) return shadeOpaque(int(h.y + 0.5), ro + rd * t, -rd);
    t += h.x;
    if (t > 300.0 || (ro + rd * t).y > SCENE_TOP + 1.0) break;
  }
  return envStudio(rd);
}
vec3 shadeGlass(vec3 p, vec3 v, vec3 n) {
  vec3 c = keyC(3), q = p - c, b = vec3(KX, KYH, KX);
  vec3 lg = legend(3, q, n);
  vec3 nb = normalize(n + vec3(lg.y, 0.0, lg.z) * 0.6);
  // polished glass with a sandblasted legend: the blast is just a much rougher surface
  float frost = mix(0.22, 0.6, lg.x);
  // reflection is deterministic (window pre-blurred by the frost); only the refraction is sampled
  float F = fresnelD(max(dot(v, nb), 0.0), 1.5);
  vec3 r = reflect(-v, nb);
  vec3 col = F * envStudioRough(r, frost) * shadowCol(p + n * 0.02, r);
  vec3 h = ggxSample(nb, frost, rand2(5.0));
  vec3 dir = refract(-v, h, 1.0 / 1.5), pos = q, thr = vec3(1.0 - F);
  for (int k = 0; k < 3; k++) {
    float len = max(boxI(pos, dir, b).y, 0.0);
    thr *= beer(GLASS_ABS, len);
    pos += dir * len;
    vec3 ne = boxFaceNormal(pos, b);
    vec3 od = refract(dir, -ne, 1.5);
    if (dot(od, od) > 1e-4) {
      thr *= 1.0 - fresnelD(dot(od, ne), 1.5);
      col += thr * traceBehind(c + pos + od * 0.02, od);
      break;
    }
    dir = reflect(dir, ne);
    pos -= ne * 0.002;
  }
  // frosted glass scatters part of the light inside it: the body glows where the sun reaches it
  col += subsurface(p, n, vec3(0.72, 0.84, 0.8), 0.13);
  // light the blasted letters catch and scatter
  col += lg.x * (KEY_COL * keyGobo(p) * 0.05 + SKY_COL * 0.6 + FILL_COL * 0.8) * vec3(0.9, 0.93, 0.92);
  return col;
}
void main() {
  vec3 ro, rd;
  cameraRay(ro, rd);
  float t = 0.0;
  if (ro.y > SCENE_TOP) {
    if (rd.y >= 0.0) { o = vec4(envStudio(rd), 1.0); return; }
    t = (SCENE_TOP - ro.y) / rd.y;
  }
  vec2 h = vec2(1e9, 0.0);
  bool hit = false;
  for (int s = 0; s < 160; s++) {
    h = scene(ro + rd * t, -1);
    if (h.x < 0.00025 * t) { hit = true; break; }
    t += h.x;
    if (t > 900.0) break;
  }
  vec3 p = ro + rd * t, col;
  int id = int(h.y + 0.5);
  if (!hit) col = envStudio(rd);
  else if (id == 4) col = shadeGlass(p, -rd, calcNormal(p, 0.002));
  else col = shadeOpaque(id, p, -rd);
  o = vec4(clampSample(col, 5.0), 1.0);
}
`;

const SCENE_FS = [GLSL_HEADER, GLSL_COMMON, GLSL_SAMPLING, GLSL_CAMERA, GLSL_RIG_SETTINGS, GLSL_LIGHT_RIG, GLSL_MATERIALS, GLSL_SDF, SCENE, GLSL_SHADOW_AO, GLSL_LIGHTING, SCENE_MAIN].join("\n");

/** The lettering for all four key tops, white on black, one 512px tile per key. */
function legendArt() {
  const cv = document.createElement("canvas");
  cv.width = 2048;
  cv.height = 512;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 2048, 512);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.filter = "blur(1.4px)"; // soft walls, so the letters read as cut, not printed
  keys.forEach((k, i) => {
    let size = 92;
    ctx.font = `600 ${size}px ${GROTESK}`;
    const w = ctx.measureText(k.label).width;
    if (w > 330) size = Math.floor((size * 330) / w);
    ctx.font = `600 ${size}px ${GROTESK}`;
    ctx.fillText(k.label, i * 512 + 256, 262);
  });
  return cv;
}

type Sim = { press: { x: number; v: number }[]; held: boolean[]; hover: boolean[]; touched: boolean; layout: number[][] };

export default function PhotorealButtonSet() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"pending" | "gl" | "still">("pending");
  const [rects, setRects] = useState<{ left: number; top: number; width: number; height: number }[]>([]);
  const [last, setLast] = useState<string | null>(null);
  const sim = useRef<Sim>({ press: keys.map(() => ({ x: 0, v: 0 })), held: keys.map(() => false), hover: keys.map(() => false), touched: false, layout: [] });

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const s = sim.current;
    let legendTex: WebGLTexture | null = null;
    let demoAt = 3.0, step = 0, pressUntil = -1, demoKey = -1;
    const stage = createPhotoStage({
      canvas,
      wrap,
      sceneFS: SCENE_FS,
      samples: 128,
      exposure: 1.0,
      vignette: 0.42,
      onFail: () => setMode("still"),
      camera: (w, h) => {
        const aspect = w / h;
        const fov = 15;
        const grid = w < 560;
        s.layout = keys.map((_, i) => (grid ? [(i % 2 - 0.5) * PITCH, (Math.floor(i / 2) - 0.5) * PITCH * 1.12] : [(i - 1.5) * PITCH, 0]));
        const half = grid ? 7.4 : 14.6; // the keys, plus a margin, must fit across
        const dist = Math.max(grid ? 66 : 80, half / (Math.tan((fov * Math.PI) / 360) * aspect));
        const el = 0.5;
        const target: Vec3 = [0, 0, 0.6];
        const cam = lookAt([0, Math.sin(el) * dist, 0.6 + Math.cos(el) * dist], target, fov, aspect, dist * 0.016, [0, aspect < 0.9 ? 0.02 : 0.05]);
        setRects(keys.map((_, i) => overlayRect(cam, [s.layout[i][0], 0.25, s.layout[i][1]], [KX, 0.75, KX], w, h)));
        return cam;
      },
      uniforms: (gl, loc) => {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, legendTex);
        gl.uniform1i(loc("uLegend"), 1);
        gl.uniform1fv(loc("uPress"), s.press.map((p) => Math.max(0, p.x)));
        gl.uniform2fv(loc("uKP"), s.layout.flat());
      },
      step: (dt, t) => {
        if (DEMO && !reduce && !s.touched && t > demoAt) {
          demoKey = step % keys.length;
          pressUntil = t + 0.24;
          step++;
          demoAt = t + (demoKey === keys.length - 1 ? 2.4 : 1.15);
        }
        let moving = false;
        s.press.forEach((p, i) => {
          const goal = s.held[i] || (i === demoKey && t < pressUntil) ? 1 : s.hover[i] ? REST_TOUCH : 0;
          if (reduce) {
            if (p.x !== goal) { p.x = goal; p.v = 0; moving = true; }
          } else if (springStep(p, goal, dt, 1100, 42)) moving = true;
        });
        return moving;
      },
    });
    if (!stage) return;
    const gl = canvas.getContext("webgl2")!;
    legendTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, legendTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, legendArt());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    stage.invalidate();
    setMode("gl");
    return () => stage.dispose();
  }, [reduce]);

  const s = sim.current;
  const touch = () => { s.touched = true; };
  const hold = (i: number, on: boolean) => { touch(); s.held[i] = on; };

  return (
    <section className="relative overflow-hidden bg-[#2a221b]" style={{ fontFamily: GROTESK }}>
      <div ref={wrapRef} className="relative h-[600px] w-full sm:h-[720px]">
        <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full ${mode === "still" ? "hidden" : ""}`} />
        {mode === "still" && <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 30% 20%, #c9b79c 0%, #a99377 45%, #6d5b47 100%)" }}><div className="absolute inset-0" style={stillWindowLight()} /><div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: STILL_GRAIN }} /></div>}

        <div className={mode === "still" ? "absolute inset-0 flex flex-wrap items-center justify-center gap-4 p-6 sm:gap-6" : "absolute inset-0"}>
          {keys.map((k, i) => {
            const r = rects[i];
            const still = mode === "still";
            const faces = ["#5b0f0c", "linear-gradient(160deg,#d7d8d6,#8d8f8f)", "linear-gradient(160deg,#4a2a18,#24130a)", "rgba(220,235,228,0.35)"];
            return (
              <button
                key={k.label}
                type="button"
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); hold(i, true); }}
                onPointerUp={() => hold(i, false)}
                onPointerCancel={() => hold(i, false)}
                onPointerEnter={() => { s.hover[i] = true; }}
                onPointerLeave={() => { s.hover[i] = false; s.held[i] = false; }}
                onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) hold(i, true); }}
                onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") hold(i, false); }}
                onBlur={() => { s.held[i] = false; }}
                onClick={() => setLast(k.label)}
                className={`touch-manipulation select-none rounded-[22%] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[#f4e9d6] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent ${still ? `grid h-24 w-24 place-items-center text-[13px] font-semibold sm:h-28 sm:w-28 ${i === 1 || i === 3 ? "text-[#1c1a17]" : "text-[#f4e9d6]"}` : "absolute"}`}
                style={still ? stillObject(faces[i], { radius: 20, depth: 10 }) : r ? { left: r.left, top: r.top, width: r.width, height: r.height } : { display: "none" }}
              >
                {still ? k.label : <span className="sr-only">{k.label}</span>}
              </button>
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5 text-[#f4e9d6] sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f4e9d6]/80">Ceramic, steel, walnut, frosted glass</p>
          <p aria-live="polite" className="text-[13px] tabular-nums text-[#f4e9d6]/90">
            {last ? `${last} pressed` : "Press a key"}
          </p>
        </div>
      </div>
    </section>
  );
}
