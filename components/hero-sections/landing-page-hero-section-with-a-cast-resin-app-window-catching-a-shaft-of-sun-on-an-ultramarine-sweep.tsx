import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

/** Everything a visitor reads. Change these and nothing else to reuse the hero. */
const copy = {
  brand: "Paneworks",
  signIn: "Sign in",
  eyebrow: "New: a live preview link for every draft",
  headline: "From a rough idea to a working app by Friday.",
  sub: "Describe the screens you want, drag them into order and send your team a link that already works. Paneworks writes the plumbing so you can stay on the parts people notice.",
  primary: { label: "Start building", href: "#start" },
  secondary: { label: "Watch the two minute tour", href: "#tour" },
  trust: "Free while you build. No card needed.",
};

const SUN_FOLLOWS_POINTER = true; // the window light slides a little as the pointer moves across the hero
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
// the light rig for this scene: low sun from behind and to the left, through a window above the frame.
// WIN_OFF is a uniform here so the pool of light can slide with the pointer.
const GLSL_RIG_SETTINGS = `
const vec3 KEY_DIR = normalize(vec3(-0.42, 0.48, -0.77));
const vec3 KEY_COL = vec3(1.0, 0.84, 0.66) * 3.0;
const float KEY_SPREAD = 0.006;
const float WIN_DIST = 160.0;
const vec2 WIN_HALF = vec2(8.5, 11.0);
uniform vec2 WIN_OFF;
const float BAR = 0.8;
const float BAR_Y = 3.0;
const vec3 SKY_COL = vec3(0.6, 0.67, 0.78) * 0.2;
const vec3 FILL_DIR = normalize(vec3(0.3, 0.42, 1.0));
const vec3 FILL_COL = vec3(1.0, 0.95, 0.88) * 0.2;
const vec3 CEIL_COL = vec3(0.95, 0.9, 0.84) * 0.5;`;
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

// The scene, in centimetres: one cast resin slab the shape of an app window, standing on a painted sweep.
const SLAB = { halfW: 9.0, halfH: 6.4, halfD: 1.6, turn: -0.38 }; // turn: radians about the vertical axis
const RESIN_ABS = "vec3(0.012, 0.16, 0.42)"; // how strongly the resin soaks up red, green and blue per cm (tangerine)
const FIELD = "vec3(0.05, 0.085, 0.34)"; // the colour of the painted backdrop (linear light, ultramarine)

const SCENE = `
const float SCENE_TOP = ${(SLAB.halfH * 2 + 2).toFixed(1)};
const float AO_RADIUS = 3.0;
uniform vec3 uC;
uniform vec2 uRot;
uniform sampler2D uArt;
const vec3 HB = vec3(${SLAB.halfW.toFixed(2)}, ${SLAB.halfH.toFixed(2)}, ${SLAB.halfD.toFixed(2)});
const float ZA = HB.z - 0.5; // the white resin "interface" is cast this far behind the front face
const float WALL = 55.0;
const vec3 RESIN_ABS = ${RESIN_ABS};
vec3 toL(vec3 q) { return vec3(uRot.x * q.x + uRot.y * q.z, q.y, -uRot.y * q.x + uRot.x * q.z); }
vec3 toW(vec3 q) { return vec3(uRot.x * q.x - uRot.y * q.z, q.y, uRot.y * q.x + uRot.x * q.z); }
float slab(vec3 p) {
  vec3 q = toL(p - uC);
  float d = sdRoundBox(q, HB, 0.42);
  // the title bar: a fine groove across the front, and three shallow dimples for the window buttons
  float g = sdRoundBox(q - vec3(0.0, HB.y - 2.25, HB.z), vec3(HB.x - 0.9, 0.05, 0.12), 0.04);
  d = smax(d, -g, 0.05);
  for (int i = 0; i < 3; i++) {
    float s = length(q - vec3(-HB.x + 1.4 + float(i) * 0.95, HB.y - 1.15, HB.z + 0.2)) - 0.3;
    d = smax(d, -s, 0.05);
  }
  return d;
}
// a seamless paper sweep: floor curving up into the back wall
float sweep(vec3 p) { return smin(p.y, p.z + WALL, 40.0); }
vec2 scene(vec3 p, int skip) {
  float s = sweep(p);
  if (skip == 1) return vec2(s, 0.0);
  float b = slab(p);
  return b < s ? vec2(b, 1.0) : vec2(s, 0.0);
}
float map(vec3 p) { return scene(p, -1).x; }
// the slab does not block the sun: lightFilter tints and focuses what passes through it instead
float mapShadow(vec3 p) { return 100.0; }
float artAt(vec3 q) {
  vec2 lo = vec2(-HB.x + 0.8, -HB.y + 0.8), hi = vec2(HB.x - 0.8, HB.y - 2.75);
  vec2 uv = (q.xy - lo) / (hi - lo);
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
  return texture(uArt, vec2(uv.x, 1.0 - uv.y)).r;
}
vec3 lightFilter(vec3 p, vec3 l) {
  vec3 q = toL(p - uC), d = toL(l), b = HB - 0.08;
  vec2 tb = boxI(q, d, b);
  if (tb.y <= max(tb.x, 0.0)) return vec3(1.0);
  float t0 = max(tb.x, 0.0), len = tb.y - t0;
  vec3 e = b - abs(q + d * (t0 + tb.y) * 0.5);
  float rim = min(min(e.x, e.y), e.z * 3.0);
  float ta = (ZA - q.z) / d.z;
  float art = ta > t0 && ta < tb.y ? artAt(q + d * ta) : 0.0;
  return beer(RESIN_ABS, len) * (0.4 + 1.6 * smoothstep(0.0, 1.2, rim)) * (1.0 - 0.75 * art);
}
`;

const SCENE_MAIN = `
vec3 shadeSweep(vec3 p, vec3 v) {
  vec3 n = calcNormal(p, 0.01);
  float ao = calcAO(p, n);
  vec3 q = n.y > 0.7 ? vec3(p.x, p.z, p.y) : p;
  Mat m = matPlaster(q * 0.8, n, ${FIELD});
  return litOpaque(p, v, m, ao);
}
vec3 traceBehind(vec3 ro, vec3 rd) {
  float t = 0.0;
  for (int s = 0; s < 96; s++) {
    vec3 p = ro + rd * t;
    float h = sweep(p);
    if (h < 0.0005 * (t + 1.0)) return shadeSweep(p, -rd);
    t += h;
    if (t > 900.0) break;
  }
  return envStudio(rd);
}
// the white resin cast inside the block: diffuse, lit by the sun that reaches it and by the room
vec3 whiteLit(vec3 wp) {
  return vec3(0.74, 0.7, 0.64) * (KEY_COL * keyGobo(wp) * 0.2 + SKY_COL * 1.4 + FILL_COL * 1.5);
}
vec3 shadeResin(vec3 p, vec3 v) {
  vec3 n = calcNormal(p, 0.002);
  vec3 lq = toL(p - uC);
  // cast resin is never optically flat: a slow ripple left by the mould
  n = normalize(n + toW(vec3(fbm(lq.xy * 0.5) - 0.5, fbm(lq.zy * 0.5 + 3.0) - 0.5, 0.0)) * 0.014);
  float F = fresnelD(max(dot(v, n), 0.0), 1.5);
  vec3 col = F * envStudioRough(reflect(-v, n), 0.03);
  vec3 dir = toL(refract(-v, n, 1.0 / 1.5)), pos = lq, thr = vec3(1.0 - F);
  for (int k = 0; k < 4; k++) {
    float len = max(boxI(pos, dir, HB).y, 0.0);
    if (abs(dir.z) > 1e-4) {
      float ta = (ZA - pos.z) / dir.z;
      if (ta > 0.0 && ta < len) {
        vec3 aq = pos + dir * ta;
        float m = artAt(aq);
        if (m > 0.0) {
          thr *= beer(RESIN_ABS, ta);
          col += thr * m * whiteLit(uC + toW(aq));
          thr *= 1.0 - m;
          pos = aq; len -= ta;
        }
      }
    }
    thr *= beer(RESIN_ABS, len);
    pos += dir * len;
    vec3 ne = boxFaceNormal(pos, HB);
    vec3 od = refract(dir, -ne, 1.5);
    if (dot(od, od) > 1e-4) {
      thr *= 1.0 - fresnelD(dot(od, ne), 1.5);
      vec3 wd = toW(od);
      col += thr * traceBehind(uC + toW(pos) + wd * 0.05, wd);
      break;
    }
    dir = reflect(dir, ne);
    pos -= ne * 0.002;
  }
  // a lit resin body glows from inside
  col += subsurface(p, n, vec3(1.0, 0.42, 0.08), 0.32);
  return col;
}
void main() {
  vec3 ro, rd;
  cameraRay(ro, rd);
  float t = 0.0;
  vec2 h = vec2(1e9, 0.0);
  bool hit = false;
  for (int s = 0; s < 200; s++) {
    h = scene(ro + rd * t, -1);
    if (h.x < 0.0003 * t) { hit = true; break; }
    t += h.x;
    if (t > 1500.0) break;
  }
  vec3 p = ro + rd * t, col;
  if (!hit) col = envStudio(rd);
  else if (h.y > 0.5) col = shadeResin(p, -rd);
  else col = shadeSweep(p, -rd);
  o = vec4(clampSample(col, 4.0), 1.0);
}
`;

const SCENE_FS = [GLSL_HEADER, GLSL_COMMON, GLSL_SAMPLING, GLSL_CAMERA, GLSL_RIG_SETTINGS, GLSL_LIGHT_RIG, GLSL_MATERIALS, GLSL_SDF, SCENE, GLSL_SHADOW_AO, GLSL_LIGHTING, SCENE_MAIN].join("\n");

/** The app interface cast in white resin inside the block: a sidebar and three panels, white on black. */
function interfaceArt() {
  const cv = document.createElement("canvas");
  cv.width = 1024;
  cv.height = 640;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 1024, 640);
  ctx.filter = "blur(2.5px)"; // soft walls, so the shapes read as cast, not printed
  const block = (x: number, y: number, w: number, h: number, a: number) => {
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 18);
    ctx.fill();
  };
  block(0, 0, 150, 640, 0.4);
  block(205, 0, 819, 270, 0.48);
  block(205, 330, 380, 310, 0.36);
  block(644, 330, 380, 310, 0.36);
  return cv;
}

type Sim = { sun: { x: number; v: number }[]; goal: [number, number] };

export default function PhotorealResinWindowHero() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"pending" | "gl" | "still">("pending");
  const sim = useRef<Sim>({ sun: [{ x: 0, v: 0 }, { x: 0, v: 0 }], goal: [0, 0] });
  const stageRef = useRef<ReturnType<typeof createPhotoStage>>(null);

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const s = sim.current;
    let artTex: WebGLTexture | null = null;
    const c = Math.cos(SLAB.turn), sn = Math.sin(SLAB.turn);
    const stage = createPhotoStage({
      canvas,
      wrap,
      sceneFS: SCENE_FS,
      samples: 128,
      exposure: 1.05,
      vignette: 0.38,
      onFail: () => setMode("still"),
      camera: (w, h) => {
        const aspect = w / h;
        const fov = 18;
        const wide = w >= 820;
        const k = Math.tan((fov * Math.PI) / 360);
        // wide: the slab sits right of the copy; narrow: below it, filling most of the width
        const dist = wide ? Math.max(92, 36 / (2 * k * aspect)) : 31 / (2 * k * aspect);
        const el = 0.42;
        const target: Vec3 = [0, SLAB.halfH * 0.95, 0];
        return lookAt([0, target[1] + Math.sin(el) * dist, Math.cos(el) * dist], target, fov, aspect, dist * 0.012, wide ? [0.4, -0.04] : [0, -0.58]);
      },
      uniforms: (gl, loc) => {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, artTex);
        gl.uniform1i(loc("uArt"), 1);
        gl.uniform3f(loc("uC"), 0, SLAB.halfH, 0);
        gl.uniform2f(loc("uRot"), c, sn);
        gl.uniform2f(loc("WIN_OFF"), s.sun[0].x, s.sun[1].x);
      },
      step: (dt) => {
        let moving = false;
        s.sun.forEach((p, i) => { if (springStep(p, s.goal[i], dt, 40, 13)) moving = true; });
        return moving;
      },
    });
    if (!stage) return;
    stageRef.current = stage;
    const gl = canvas.getContext("webgl2")!;
    artTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, artTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, interfaceArt());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    stage.invalidate();
    setMode("gl");
    return () => { stageRef.current = null; stage.dispose(); };
  }, []);

  const onMove = (e: React.PointerEvent) => {
    if (!SUN_FOLLOWS_POINTER || reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    sim.current.goal = [((e.clientX - r.left) / r.width - 0.5) * 9, ((e.clientY - r.top) / r.height - 0.5) * -4];
    stageRef.current?.wake();
  };

  return (
    <section className="relative overflow-hidden bg-[#0d1838] text-[#f5efe4]" style={{ fontFamily: GROTESK }} onPointerMove={onMove}>
      <div ref={wrapRef} className="relative h-[880px] w-full md:h-[760px]">
        <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full ${mode === "still" ? "hidden" : ""}`} />
        {mode === "still" && (
          <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(90% 80% at 72% 70%, #26407f 0%, #142659 50%, #0b1533 100%)" }}>
            <div className="absolute inset-0" style={stillWindowLight()} />
            <div className="absolute bottom-[16%] right-[8%] h-[34%] w-[34%] md:bottom-[24%] md:right-[12%] md:h-[38%] md:w-[30%]" style={{ borderRadius: 14, background: "linear-gradient(160deg, rgba(255,170,90,0.92), rgba(214,84,22,0.88))", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 3px rgba(0,0,0,0.3), 28px 34px 50px rgba(214,90,30,0.35)" }} />
            <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: STILL_GRAIN }} />
          </div>
        )}

        <header className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5 md:px-14 md:py-7">
          <a href="#" className="rounded-md text-[17px] font-semibold tracking-[-0.01em] outline-none focus-visible:ring-2 focus-visible:ring-[#f5efe4]/80 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0d1838]">{copy.brand}</a>
          <a href="#" className="rounded-full px-4 py-2 text-[14px] font-medium text-[#f5efe4]/85 outline-none transition-colors hover:bg-white/10 hover:text-[#f5efe4] focus-visible:ring-2 focus-visible:ring-[#f5efe4]/80">{copy.signIn}</a>
        </header>

        <div className="absolute inset-x-0 top-[84px] px-5 md:inset-y-0 md:left-0 md:right-auto md:top-0 md:flex md:w-[50%] md:items-center md:pl-14 md:pr-0 lg:pl-20">
          <div className="max-w-[560px]">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1.5 text-[12.5px] font-medium text-[#f5efe4]/85 ring-1 ring-inset ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff9b4a]" aria-hidden="true" />
              {copy.eyebrow}
            </p>
            <h1 className="text-[40px] font-semibold leading-[1.02] tracking-[-0.035em] [text-wrap:balance] sm:text-[52px] lg:text-[64px]">{copy.headline}</h1>
            <p className="mt-5 max-w-[470px] text-[16px] leading-[1.55] text-[#f5efe4]/75 md:text-[17px]">{copy.sub}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={copy.primary.href} className="group inline-flex h-12 items-center gap-2 rounded-full bg-[#f5efe4] pl-6 pr-5 text-[15px] font-semibold text-[#0d1838] outline-none transition-transform duration-150 hover:bg-white active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#ff9b4a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1838]">
                {copy.primary.label}
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </a>
              <a href={copy.secondary.href} className="inline-flex h-12 items-center gap-2.5 rounded-full px-5 text-[15px] font-medium text-[#f5efe4] ring-1 ring-inset ring-[#f5efe4]/25 outline-none transition-colors hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-[#f5efe4]/80">
                <Play aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
                {copy.secondary.label}
              </a>
            </div>
            <p className="mt-6 text-[13px] text-[#f5efe4]/55">{copy.trust}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
