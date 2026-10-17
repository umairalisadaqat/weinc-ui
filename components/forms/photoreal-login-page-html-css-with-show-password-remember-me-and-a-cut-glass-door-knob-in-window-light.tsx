import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useReducedMotion } from "framer-motion";

/** Words on the page. Change them here; nothing else needs to move. */
const copy = {
  eyebrow: "Northfield Studio",
  title: "Welcome back.",
  lead: "Sign in to pick up where you left off.",
  submit: "Sign in",
  alt: "or continue with",
  signup: "New here?",
  signupLink: "Create an account",
};

const MIN_PASSWORD = 8; // shortest password the form accepts
const TURN = 0.95; // how far the knob turns on a successful sign-in, in radians
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
// the light rig, edited for this scene: late sun from a window behind and to the left of the knob
const GLSL_RIG_SETTINGS = `
const vec3 KEY_DIR = normalize(vec3(-0.42, 0.5, -0.76));
const vec3 KEY_COL = vec3(1.0, 0.82, 0.62) * 2.3;
const float KEY_SPREAD = 0.006;
const float WIN_DIST = 150.0;
const vec2 WIN_HALF = vec2(11.0, 15.0);
const vec2 WIN_OFF = vec2(-1.5, 1.0);
const float BAR = 0.7;
const float BAR_Y = 2.0;
const vec3 SKY_COL = vec3(0.58, 0.66, 0.78) * 0.16;
const vec3 FILL_DIR = normalize(vec3(0.35, 0.4, 1.0));
const vec3 FILL_COL = vec3(1.0, 0.95, 0.88) * 0.12;
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

// The scene: one cut-glass door knob on a brass rose, standing on a limewashed terracotta sill. Units are centimetres.
const SCENE = `
const float SCENE_TOP = 7.0;
const float AO_RADIUS = 1.2;
uniform float uTurn;
const float R = 2.45, YB = 1.75, YT = 5.55; // knob: octagon half-width, bottom and top of the glass
const vec3 GLASS_ABS = vec3(0.03, 0.008, 0.02);
const vec3 SILL = vec3(0.40, 0.155, 0.085);

float oct(vec2 q) { q = abs(q); return max(max(q.x, q.y), (q.x + q.y) * 0.70710678); }
float sdGlass(vec3 p) {
  float c = cos(uTurn), s = sin(uTurn);
  vec2 q = mat2(c, -s, s, c) * p.xz;
  float o = oct(q);
  float yc = (YB + YT) * 0.5, hh = (YT - YB) * 0.5;
  vec2 e = vec2(o - (R - 0.08), abs(p.y - yc) - (hh - 0.08));
  float d = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0) - 0.08;
  d = max(d, (o + (p.y - YT) - (R - 0.55)) * 0.70710678); // top bevel ring of facets
  d = max(d, (o - (p.y - YB) - (R - 1.05)) * 0.70710678); // the body narrows into the neck
  return d;
}
float sdBrass(vec3 p) {
  float r = length(p.xz);
  vec2 e = vec2(r - 2.9, abs(p.y - 0.14) - 0.14);
  float rose = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0) - 0.06;
  rose = smax(rose, (r + p.y * 2.5) * 0.37 - 1.12, 0.2); // domed edge
  vec2 f = vec2(r - (0.62 + 0.12 * smoothstep(1.4, 0.4, p.y)), abs(p.y - 1.05) - 0.8);
  float neck = length(max(f, 0.0)) + min(max(f.x, f.y), 0.0);
  return smin(rose, neck, 0.25);
}
vec2 scene(vec3 p, int skip) {
  vec2 h = vec2(p.y, 0.0);
  float b = sdBrass(p);
  if (b < h.x) h = vec2(b, 1.0);
  if (skip != 2) { float g = sdGlass(p); if (g < h.x) h = vec2(g, 2.0); }
  return h;
}
float map(vec3 p) { return scene(p, -1).x; }
float mapShadow(vec3 p) { return scene(p, 2).x; }
// light through the knob: tinted by the glass and gathered into a bright core, like a lens
vec3 lightFilter(vec3 p, vec3 l) {
  vec3 c = vec3(0.0, (YB + YT) * 0.5, 0.0);
  vec3 oc = p - c;
  float b = dot(oc, l), k = dot(oc, oc) - R * R * 1.05;
  float disc = b * b - k;
  if (disc <= 0.0 || -b < 0.0) return vec3(1.0);
  float len = 2.0 * sqrt(disc);
  float miss = sqrt(max(dot(oc, oc) - b * b, 0.0)) / R; // 0 through the middle, 1 at the rim
  float focus = 0.3 + 2.0 * smoothstep(0.75, 0.15, miss) * (0.7 + 0.3 * sin(miss * 22.0 + atan(oc.z, oc.x) * 8.0));
  return beer(GLASS_ABS, len) * focus * vec3(0.92, 1.0, 0.95);
}
`;
const SCENE_MAIN = `
vec3 glassNormal(vec3 p) {
  vec2 k = vec2(1.0, -1.0); float e = 0.002;
  return normalize(k.xyy * sdGlass(p + k.xyy * e) + k.yyx * sdGlass(p + k.yyx * e) + k.yxy * sdGlass(p + k.yxy * e) + k.xxx * sdGlass(p + k.xxx * e));
}
vec3 shadeOpaque(int id, vec3 p, vec3 v) {
  vec3 n = calcNormal(p, 0.002);
  float ao = calcAO(p, n);
  if (id == 1) {
    // aged brass: satin from years of hands, warmer and duller in the hollows
    Mat m = matPolished(p * 2.0, n, BRASS);
    m.rough = 0.16 + 0.12 * fbm(p.xz * 2.5 + p.y);
    m.albedo *= mix(vec3(0.8, 0.72, 0.6), vec3(1.0), ao);
    return litOpaque(p, v, m, ao);
  }
  // limewash over a sill: broad trowel clouds and a faint chalky bloom where it has been wiped
  Mat m = matPlaster(p.xzy, n, SILL);
  m.albedo *= 0.9 + 0.2 * fbm(p.xz * 0.05);
  return litOpaque(p, v, m, ao);
}
vec3 traceBehind(vec3 ro, vec3 rd) {
  float t = 0.0;
  for (int s = 0; s < 80; s++) {
    vec3 q = ro + rd * t;
    vec2 h = scene(q, 2);
    if (h.x < 0.0004 * (t + 1.0)) return shadeOpaque(int(h.y + 0.5), q, -rd);
    t += h.x;
    if (t > 400.0 || q.y > SCENE_TOP + 1.0) break;
  }
  return envStudio(rd);
}
vec3 shadeGlass(vec3 p, vec3 v) {
  vec3 n = glassNormal(p);
  // polishing never leaves a cut face perfectly flat: a whisper of roughness
  vec3 h = n;
  float F = fresnelD(max(dot(v, h), 0.0), 1.5);
  vec3 r = reflect(-v, h);
  vec3 col = F * envStudioRough(r, 0.035) * shadowCol(p + n * 0.02, r);
  vec3 dir = refract(-v, h, 1.0 / 1.5), pos = p - n * 0.01, thr = vec3(1.0 - F);
  for (int k = 0; k < 4; k++) {
    float t = 0.0;
    for (int s = 0; s < 40; s++) { float d = -sdGlass(pos + dir * t); if (d < 0.001) break; t += max(d, 0.01); }
    thr *= beer(GLASS_ABS, t);
    pos += dir * t;
    vec3 ne = glassNormal(pos);
    vec3 od = refract(dir, -ne, 1.5);
    if (dot(od, od) > 1e-4) {
      thr *= 1.0 - fresnelD(dot(od, ne), 1.5);
      col += thr * traceBehind(pos + od * 0.03, od);
      break;
    }
    dir = reflect(dir, -ne);
    pos -= ne * 0.004;
  }
  // a little light scattered by the glass's own faint haze where the sun is on it
  col += subsurface(p, n, vec3(0.8, 0.9, 0.85), 0.025);
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
  for (int s = 0; s < 180; s++) {
    h = scene(ro + rd * t, -1);
    if (h.x < 0.0002 * t) { hit = true; break; }
    t += h.x * 0.9;
    if (t > 900.0) break;
  }
  vec3 p = ro + rd * t, col;
  int id = int(h.y + 0.5);
  if (!hit) col = envStudio(rd);
  else if (id == 2) col = shadeGlass(p, -rd);
  else col = shadeOpaque(id, p, -rd);
  o = vec4(clampSample(col, 2.6), 1.0);
}
`;
const SCENE_FS = [GLSL_HEADER, GLSL_COMMON, GLSL_SAMPLING, GLSL_CAMERA, GLSL_RIG_SETTINGS, GLSL_LIGHT_RIG, GLSL_MATERIALS, GLSL_SDF, SCENE, GLSL_SHADOW_AO, GLSL_LIGHTING, SCENE_MAIN].join("\n");

/* ---- small generic icons (no brand marks) ---- */
const Eye = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
    {off && <path d="M4 20 20 4" />}
  </svg>
);
const Building = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 21V4.5L13 3v18M13 8l7 2v11M2.5 21h19M7.5 8h2M7.5 12h2M7.5 16h2M16.5 13.5h.5M16.5 17h.5" />
  </svg>
);
const KeyIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="15" r="4.5" />
    <path d="M11.2 11.8 20 3M16.5 6.5l2.5 2.5M14 9l2 2" />
  </svg>
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Errors = { email?: string; password?: string };

export default function PhotorealLoginPage() {
  const reduce = useReducedMotion();
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<{ wake: () => void } | null>(null);
  const turn = useRef({ x: 0, v: 0, goal: 0, until: 0, kick: false });
  const [mode, setMode] = useState<"pending" | "gl" | "still">("pending");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState("");

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const k = turn.current;
    const stage = createPhotoStage({
      canvas,
      wrap,
      sceneFS: SCENE_FS,
      samples: 128,
      exposure: 1.0,
      vignette: 0.4,
      onFail: () => setMode("still"),
      camera: (w, h) => {
        const aspect = w / h;
        const fov = 16;
        const tan = Math.tan((fov * Math.PI) / 360);
        // keep about 9 cm of sill above and below the knob and 7 cm either side, whatever the panel shape
        const dist = Math.max(7.6 / tan, 6.4 / (tan * aspect));
        const el = 0.5;
        const target: Vec3 = [0.5, 2.8, 1.2];
        return lookAt([target[0] + 6, target[1] + Math.sin(el) * dist, target[2] + Math.cos(el) * dist], target, fov, aspect, dist * 0.013, [0, -0.04]);
      },
      uniforms: (gl, loc) => {
        gl.uniform1f(loc("uTurn"), k.x);
      },
      step: (dt, t) => {
        if (k.kick) { k.kick = false; k.goal = TURN; k.until = t + 0.75; }
        if (k.goal && t > k.until) k.goal = 0;
        if (reduce) { if (k.x !== 0) { k.x = 0; k.v = 0; return true; } return false; }
        return springStep(k, k.goal, dt, 70, 13);
      },
    });
    if (!stage) return;
    stageRef.current = stage;
    setMode("gl");
    return () => { stage.dispose(); stageRef.current = null; };
  }, [reduce]);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!email.trim()) e.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "That email address looks incomplete.";
    if (!password) e.password = "Enter your password.";
    else if (password.length < MIN_PASSWORD) e.password = `Passwords are at least ${MIN_PASSWORD} characters.`;
    return e;
  };

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (e.email || e.password) {
      setStatus("");
      const first = ev.currentTarget.querySelector<HTMLInputElement>(e.email ? "input[type=email]" : "input[name=password]");
      first?.focus();
      return;
    }
    // demo only: wire your own auth call here. Nothing leaves the page.
    turn.current.kick = true;
    stageRef.current?.wake();
    setStatus(`Signed in as ${email.trim()}${remember ? ", remembered on this device" : ""}. Demo only, nothing was sent.`);
  };

  const field = "h-12 w-full rounded-xl border border-[#d9cfc2] bg-white px-4 text-[15px] text-[#1d1915] placeholder:text-[#9a8f82] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#1d1915] focus:ring-4 focus:ring-[#1d1915]/10 aria-[invalid=true]:border-[#a3341f] aria-[invalid=true]:focus:ring-[#a3341f]/15";
  const social = "flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d9cfc2] bg-white text-[14px] font-medium text-[#1d1915] outline-none transition-colors duration-150 hover:border-[#bfb2a2] hover:bg-[#fbf8f4] focus-visible:ring-4 focus-visible:ring-[#1d1915]/15 active:translate-y-px";

  return (
    <section className="grid min-h-[720px] w-full overflow-hidden bg-[#f4efe8] text-[#1d1915] lg:h-[720px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]" style={{ fontFamily: GROTESK }}>
      <div className="order-2 flex items-center justify-center px-6 py-10 sm:px-10 lg:order-1 lg:py-0">
        <div className="w-full max-w-[400px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#8a3a24]">{copy.eyebrow}</p>
          <h1 className="mt-3 text-[40px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[48px]">{copy.title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5f564c]">{copy.lead}</p>

          <form noValidate onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor={`${id}-email`} className="mb-1.5 block text-[13px] font-medium">Email</label>
              <input
                id={`${id}-email`} type="email" name="email" autoComplete="username" inputMode="email" placeholder="you@company.example"
                value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                aria-invalid={!!errors.email} aria-describedby={errors.email ? `${id}-email-err` : undefined} className={field}
              />
              {errors.email && <p id={`${id}-email-err`} className="mt-1.5 text-[13px] text-[#a3341f]">{errors.email}</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor={`${id}-pw`} className="text-[13px] font-medium">Password</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); setStatus(email.trim() ? `Demo: a reset link would go to ${email.trim()}.` : "Demo: enter your email first and a reset link would go there."); }}
                  className="rounded text-[13px] font-medium text-[#8a3a24] underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#8a3a24]/40">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id={`${id}-pw`} type={show ? "text" : "password"} name="password" autoComplete="current-password" placeholder={`At least ${MIN_PASSWORD} characters`}
                  value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }); }}
                  aria-invalid={!!errors.password} aria-describedby={errors.password ? `${id}-pw-err` : undefined} className={`${field} pr-12`}
                />
                <button type="button" onClick={() => setShow((v) => !v)} aria-pressed={show} aria-controls={`${id}-pw`} aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#6d6358] outline-none transition-colors hover:bg-[#f1ebe3] hover:text-[#1d1915] focus-visible:ring-2 focus-visible:ring-[#1d1915]/30">
                  <Eye off={show} />
                </button>
              </div>
              {errors.password && <p id={`${id}-pw-err`} className="mt-1.5 text-[13px] text-[#a3341f]">{errors.password}</p>}
            </div>

            <label className="flex w-fit cursor-pointer select-none items-center gap-2.5 text-[14px] text-[#3d362f]">
              <input type="checkbox" aria-label="Remember me" name="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-[18px] w-[18px] cursor-pointer rounded accent-[#1d1915]" />
              Remember me
            </label>

            <button type="submit" className="h-12 w-full rounded-xl bg-[#1d1915] text-[15px] font-semibold text-[#f7f1e8] outline-none transition-[background-color,transform] duration-150 hover:bg-[#332c25] focus-visible:ring-4 focus-visible:ring-[#1d1915]/25 active:scale-[0.99]">
              {copy.submit}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[12px] text-[#8a8075]">
            <span className="h-px flex-1 bg-[#ddd3c7]" />{copy.alt}<span className="h-px flex-1 bg-[#ddd3c7]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className={social} onClick={() => setStatus("Demo: single sign-on would open your company's sign-in page.")}><Building />Work account</button>
            <button type="button" className={social} onClick={() => setStatus("Demo: your device would ask for its passkey.")}><KeyIcon />Passkey</button>
          </div>

          <p aria-live="polite" className="mt-5 min-h-[20px] text-[13px] leading-snug text-[#3d362f]">{status}</p>
          <p className="mt-2 text-[14px] text-[#5f564c]">
            {copy.signup}{" "}
            <a href="#signup" onClick={(e) => e.preventDefault()} className="rounded font-semibold text-[#1d1915] underline decoration-[#1d1915]/30 underline-offset-4 outline-none hover:decoration-[#1d1915] focus-visible:ring-2 focus-visible:ring-[#1d1915]/30">{copy.signupLink}</a>
          </p>
        </div>
      </div>

      <div ref={wrapRef} className="relative order-1 h-[300px] overflow-hidden bg-[#3a1d12] sm:h-[380px] lg:order-2 lg:h-auto">
        <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full ${mode === "still" ? "hidden" : ""}`} />
        {mode === "still" && (
          <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(110% 80% at 35% 35%, #9a4a2c 0%, #6e2f1a 50%, #3a1a0f 100%)" }}>
            <div className="absolute inset-0" style={stillWindowLight()} />
            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2" style={{ ...stillObject("rgba(225,238,230,0.42)", { radius: 30, depth: 12 }), clipPath: "polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)" }} />
            <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: STILL_GRAIN }} />
          </div>
        )}
        <p className="pointer-events-none absolute bottom-5 left-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f6e9da]/75">Cut glass, brass, limewash</p>
      </div>
    </section>
  );
}
