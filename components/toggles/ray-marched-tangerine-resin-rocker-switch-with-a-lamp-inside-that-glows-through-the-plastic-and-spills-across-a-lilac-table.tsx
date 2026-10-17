import { useEffect, useRef, useState } from "react";

// The two positions. `word` is set very large, `note` sits under it.
const copy = {
  on: { word: "On", note: "Hall lamp lit. It will stay that way until somebody leans on the far end." },
  off: { word: "Off", note: "Circuit open. The resin goes back to the colour of marmalade held up to a window." },
};
const LABEL = "Hall lamp"; // what the real switch is called
const START_ON = true;
const TILT = 0.2; // radians the rocker leans either way
const DUSK = 0.42; // how far the daylight drops while the lamp is on (0 keeps the room as it was)
const MARKS = "TOLLAND & REEVE      R2      10A 250V~"; // pressed into the plate beside the rocker
// How much of each colour one unit of resin soaks up (red, green, blue). Low red, high blue: tangerine.
const RESIN: [number, number, number] = [0.05, 1.8, 4.6];
const LAMP: [number, number, number] = [1, 0.6, 0.26]; // the lamp inside (linear RGB)
const TABLE: [number, number, number] = [0.34, 0.37, 0.8]; // the painted surface it sits on (linear RGB)
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 curve(vec3 x){ return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
// A film curve that keeps colour in the highlights: half of it works on the brightest channel only.
vec3 tone(vec3 x){ x *= 0.8; float m = max(max(x.r, x.g), max(x.b, 1e-4)); vec3 h = x * (curve(vec3(m)).r / m); return pow(mix(curve(x), h, 0.42), vec3(1.0 / 2.2)); }
`;

// The photograph. A porcelain housing and a block of cloudy resin as signed distances, a ray that goes
// into the resin, bends, and is absorbed and scattered on its way to the lamp, the tray or the far side.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform vec2 uCS; uniform float uLamp; uniform float uDip;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform vec3 uKeyP; uniform vec3 uFillP; uniform vec3 uTopP; uniform vec3 uLowP; uniform vec3 uSig; uniform vec3 uLampC; uniform vec3 uTable; uniform float uDirect; uniform float uRoom; uniform sampler2D uTex;
const float PIV = 0.30;
const vec3 RB = vec3(0.66, 0.34, 1.14);
const float SCAT = 0.75;
#define KEYC (vec3(1.0, 0.975, 0.94) * mix(vec3(0.74, 0.82, 1.12), vec3(1.0), clamp(uRoom * 2.0 - 1.0, 0.0, 1.0)))
const vec3 LA = vec3(-0.27, 0.2, 0.0); const vec3 LB = vec3(0.27, 0.2, 0.0);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
float smax(float a, float b, float k){ return -smin(-a, -b, k); }
float sdRRect(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float sdRBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdCaps(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a; vec3 ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
float slab(float d2, float y, float h, float r){ vec2 w = vec2(d2, abs(y - 0.5 * h) - 0.5 * h) + r; return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - r; }

// The rocker's own frame: it turns about the x axis through its pivot.
vec3 rockL(vec3 p){ p.y -= PIV - uDip; return vec3(p.x, uCS.x * p.y + uCS.y * p.z, uCS.x * p.z - uCS.y * p.y); }
vec3 rockW(vec3 q){ return vec3(q.x, uCS.x * q.y - uCS.y * q.z + PIV - uDip, uCS.y * q.y + uCS.x * q.z); }

float sdRock(vec3 p){
  vec3 q = rockL(p);
  float d = sdRBox(q, RB, 0.13);
  // the thumb dish: a very large cylinder scooped out of the top
  float dish = 8.6 - length(vec2(q.y - (RB.y - 0.078 + 8.6), q.z));
  return smax(d, dish, 0.07);
}
float sdBez(vec3 p){
  float plate = slab(sdRRect(p.xz, vec2(1.40, 1.90), 0.54), p.y, 0.15, 0.07);
  float collar = slab(sdRRect(p.xz, vec2(0.95, 1.43), 0.33), p.y, 0.45, 0.14);
  float d = smin(plate, collar, 0.26);
  float well = max(sdRRect(p.xz, vec2(0.72, 1.205), 0.16), 0.05 - p.y);
  d = smax(d, -well, 0.06);
  // a shallow counterbore for each fixing screw
  return max(d, -max(length(vec2(p.x, abs(p.z) - 1.665)) - 0.122, 0.128 - p.y));
}
float sdScrew(vec3 p){
  vec3 q = vec3(p.x, p.y, abs(p.z) - 1.665);
  float d = max(length(q.xz) - 0.105, length(q - vec3(0.0, -0.118, 0.0)) - 0.3);
  d = max(d, 0.1 - q.y);
  // the slots were left wherever the screwdriver stopped
  float a = p.z > 0.0 ? 0.5 : -1.05; float k = q.x * cos(a) + q.z * sin(a);
  return max(d, -max(abs(k) - 0.017, 0.156 - q.y));
}
float map(vec3 p){ return min(min(sdBez(p), sdRock(p)), sdScrew(p)); }

vec2 bound(vec3 ro, vec3 rd){
  vec3 inv = 1.0 / (rd + vec3(1e-6)); vec3 lo = (vec3(-1.5, 0.0, -2.0) - ro) * inv; vec3 hi = (vec3(1.5, 1.02, 2.0) - ro) * inv;
  vec3 a = min(lo, hi); vec3 b = max(lo, hi);
  return vec2(max(max(a.x, a.y), max(a.z, 0.0)), min(b.x, min(b.y, b.z)));
}
float march(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 84; i++) { float d = map(ro + rd * t); if (d < 0.0006 * (1.0 + t * 0.3)) return t; t += d * 0.86; if (t > tb.y) break; }
  return -1.0;
}
float marchLite(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x + 0.004;
  for (int i = 0; i < 40; i++) { float d = map(ro + rd * t); if (d < 0.002) return t; t += d * 0.9; if (t > tb.y) break; }
  return -1.0;
}
float marchBez(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x + 0.004;
  for (int i = 0; i < 36; i++) { float d = sdBez(ro + rd * t); if (d < 0.002) return t; t += d * 0.9; if (t > tb.y) break; }
  return -1.0;
}
vec3 calcN(vec3 p){
  vec2 e = vec2(0.0012, -0.0012);
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}
vec3 bezN(vec3 p){
  vec2 e = vec2(0.002, -0.002);
  return normalize(e.xyy * sdBez(p + e.xyy) + e.yyx * sdBez(p + e.yyx) + e.yxy * sdBez(p + e.yxy) + e.xxx * sdBez(p + e.xxx));
}
vec3 rockN(vec3 p){
  vec2 e = vec2(0.002, -0.002);
  return normalize(e.xyy * sdRock(p + e.xyy) + e.yyx * sdRock(p + e.yyx) + e.yxy * sdRock(p + e.yxy) + e.xxx * sdRock(p + e.xxx));
}
float calcAO(vec3 p, vec3 n){
  float o = 0.0; float s = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.012 + 0.07 * float(i); o += (h - map(p + n * h)) * s; s *= 0.74; }
  return clamp(1.0 - 1.9 * o, 0.0, 1.0);
}
// Two shadows from the big softbox: what the porcelain blocks, and what the resin only tints.
float shadowBez(vec3 ro, vec3 rd, float k){
  float res = 1.0; float t = 0.03;
  for (int i = 0; i < 30; i++) { float h = sdBez(ro + rd * t); res = min(res, k * h / t); t += clamp(h, 0.025, 0.3); if (res < 0.01 || t > 3.6) break; }
  return clamp(res, 0.0, 1.0);
}
float shadowRock(vec3 ro, vec3 rd){
  float res = 1.0; float t = 0.03;
  for (int i = 0; i < 26; i++) { float h = sdRock(ro + rd * t); res = min(res, 15.0 * h / t); t += clamp(h, 0.03, 0.32); if (res < 0.01 || t > 3.6) break; }
  return clamp(res, 0.0, 1.0);
}

// A softbox: where the ray meets its plane, with edges that feather as the surface gets rougher.
float rectL(vec3 ro, vec3 rd, vec3 c, vec3 n, vec3 u, vec2 hs, float soft){
  float dn = dot(rd, n); if (dn > -1e-4) return 0.0;
  float t = dot(c - ro, n) / dn; if (t < 0.0) return 0.0;
  vec3 q = ro + rd * t - c; vec3 v = cross(n, u); float s = soft * t;
  float cr = min(0.4, min(hs.x, hs.y) * 0.6);
  vec2 d = abs(vec2(dot(q, u), dot(q, v))) - hs + cr;
  float e = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - cr;
  float cloth = 1.0 - 0.22 * clamp(length(vec2(dot(q, u), dot(q, v)) / hs), 0.0, 1.4);
  return smoothstep(s, -s, e) * cloth;
}
// The key comes through a window: four panes of light with the shadow of the glazing bars between them.
float pane(vec2 w, float pen){
  float frame = smoothstep(pen, -pen, max(abs(w.x) - 2.5, abs(w.y) - 2.7));
  float bars = smoothstep(0.045 - pen * 0.5, 0.045 + pen * 0.5, abs(w.x - 1.15)) * smoothstep(0.045 - pen * 0.5, 0.045 + pen * 0.5, abs(w.y + 0.95));
  return frame * bars;
}
vec3 room(vec3 rd){
  // a pale painted studio: the walls take the colour of the table, the ceiling is white card
  vec3 wall = mix(uTable * 0.5 + 0.04, vec3(0.3, 0.31, 0.36), smoothstep(0.0, 0.5, rd.y));
  return mix(wall, vec3(0.62, 0.62, 0.6), smoothstep(0.5, 0.95, rd.y)) * uRoom;
}
vec3 env(vec3 ro, vec3 rd, float rough){
  float soft = 0.03 + rough * 0.8; float crisp = 0.005 + rough * 0.8;
  vec3 c = room(rd);
  vec3 kn = normalize(uTgt - uKeyP);
  float kdn = dot(rd, kn);
  if (kdn < -1e-4) {
    float kt = dot(uKeyP - ro, kn) / kdn; vec3 ku = normalize(cross(vec3(0.0, 1.0, 0.0), kn)); vec3 kq = ro + rd * kt - uKeyP;
    if (kt > 0.0) c += KEYC * 6.0 * uRoom * pane(vec2(dot(kq, ku), dot(kq, cross(kn, ku))) * 1.25, 0.05 + rough * 6.0);
  }
  // a strip box high behind the set, turned a little, so its edge lies across the top of the rocker
  vec3 tn = normalize(uTgt - uTopP); vec3 tu = normalize(cross(vec3(0.0, 1.0, 0.0), tn)); tu = normalize(tu + cross(tn, tu) * 0.32);
  c += vec3(1.0, 0.99, 0.97) * 38.0 * uRoom * rectL(ro, rd, uTopP, tn, tu, vec2(3.0, 0.42), crisp);
  // and a long low window near the horizon, which is what the top face sees when the near end is up
  vec3 ln = normalize(uTgt - uLowP); vec3 lu = normalize(cross(vec3(0.0, 1.0, 0.0), ln)); lu = normalize(lu - cross(ln, lu) * 0.2);
  c += vec3(1.0, 0.98, 0.95) * 9.0 * uRoom * rectL(ro, rd, uLowP, ln, lu, vec2(2.6, 0.13), crisp);
  vec3 fn = normalize(uTgt - uFillP);
  c += vec3(1.0, 0.97, 0.95) * 2.2 * uRoom * rectL(ro, rd, uFillP, fn, normalize(cross(vec3(0.0, 1.0, 0.0), fn)), vec2(1.3, 2.6), soft + 0.03);
  return c;
}

// Light that leaves the lit resin and lands on whatever is near it.
vec3 spill(vec3 p, vec3 n){
  if (uLamp < 0.003) return vec3(0.0);
  vec3 v1 = rockW(vec3(0.0, 0.3, 0.6)) - p; vec3 v2 = rockW(vec3(0.0, 0.3, -0.6)) - p;
  float d1 = dot(v1, v1); float d2 = dot(v2, v2);
  float a = (0.2 + 0.8 * max(dot(n, v1) * inversesqrt(d1), 0.0)) / (d1 * sqrt(d1) * 0.5 + d1 * 0.5 + 0.22) + (0.2 + 0.8 * max(dot(n, v2) * inversesqrt(d2), 0.0)) / (d2 * sqrt(d2) * 0.5 + d2 * 0.5 + 0.22);
  return uLampC * vec3(1.0, 0.55, 0.24) * uLamp * 9.0 * a;
}
// Inside the well the lamp is bare: the walls and the gap around the rocker take it straight.
vec3 wellGlow(vec3 p, vec3 n){
  vec3 c = vec3(clamp(p.x, LA.x, LB.x), LA.y, 0.0); vec3 v = c - p; float d = dot(v, v);
  float inwell = smoothstep(0.1, -0.02, sdRRect(p.xz, vec2(0.72, 1.205), 0.16)) * smoothstep(0.5, 0.36, p.y);
  return uLampC * vec3(1.0, 0.62, 0.3) * uLamp * 1.6 * inwell * (0.35 + 0.65 * max(dot(n, v) * inversesqrt(d), 0.0)) / (d + 0.3);
}
float gobo(vec3 p){
  vec3 kd = normalize(uTgt - uKeyP); vec3 u = normalize(cross(vec3(0.0, 1.0, 0.0), kd)); vec3 v = cross(kd, u);
  vec3 q = p - uTgt; vec2 w = vec2(dot(q, u), dot(q, v));
  w = vec2(w.x * 0.985 - w.y * 0.174, w.x * 0.174 + w.y * 0.985);
  return 0.24 + 0.76 * pane(w, 0.15);
}
vec3 keyLight(vec3 p, vec3 n, float sb, float sr){
  vec3 lk = normalize(uKeyP - p);
  vec3 through = exp(-uSig * 0.5) * 0.95 + uLampC * uLamp * 0.2;
  return KEYC * 2.3 * uRoom * gobo(p) * max(dot(n, lk), 0.0) * sb * mix(through, vec3(1.0), sr);
}
vec3 fillLight(vec3 n, float ao){
  return (vec3(0.95, 0.97, 1.0) * 0.34 * max(n.y, 0.0) + (uTable * 0.5 + 0.16) * (0.5 + 0.5 * n.y) * 0.5 + (uTable + 0.1) * 0.3 * max(-n.y, 0.0) + vec3(0.22) * max(dot(n, normalize(uFillP - uTgt)), 0.0)) * ao * uRoom;
}
vec3 tableLite(vec3 gp){
  float occ = smoothstep(-0.05, 0.9, map(gp + vec3(0.0, 0.05, 0.0)));
  return uTable * (uRoom * 1.75 * (0.3 + 0.7 * occ) + spill(gp, vec3(0.0, 1.0, 0.0)));
}
vec3 envF(vec3 ro, vec3 rd, float rough){
  if (rd.y >= 0.0) return env(ro, rd, rough);
  return tableLite(ro + rd * (-ro.y / rd.y));
}
const vec3 PORC = vec3(0.86, 0.845, 0.8);
vec3 bezLite(vec3 p, vec3 n, vec3 rd){
  float occ = smoothstep(-0.02, 0.3, map(p + n * 0.16));
  vec3 c = PORC * (keyLight(p, n, 0.75, 1.0) * occ + fillLight(n, occ) + spill(p, n) + wellGlow(p, n));
  float f = 0.045 + 0.955 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  return c + f * envF(p, reflect(rd, n), 0.1) * occ;
}
// What the resin looks like from outside when a mirror only needs the gist of it.
vec3 rockLite(vec3 p, vec3 n, vec3 rd){
  vec3 c = vec3(clamp(p.x, LA.x, LB.x), LA.y, 0.0); float d = length(c - p);
  vec3 body = exp(-uSig * 0.55) * uRoom * 0.75 + uLampC * uLamp * 1.3 * exp(-uSig * d * 0.3) / (d * d + 0.3);
  float f = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  return body * (1.0 - f) + f * envF(p, reflect(rd, n), 0.04);
}
// Everything that is not the rocker, as seen from inside it.
vec3 outside(vec3 p, vec3 d){
  float t = marchBez(p, d);
  if (t > 0.0) { vec3 h = p + d * t; return bezLite(h, bezN(h), d); }
  if (d.y < 0.0) return tableLite(p + d * (-p.y / d.y));
  return env(p, d, 0.25);
}
vec3 trace(vec3 p, vec3 r, float rough){
  float t = marchLite(p, r);
  if (t > 0.0) { vec3 h = p + r * t; if (sdRock(h) < sdBez(h)) return rockLite(h, rockN(h), r); return bezLite(h, bezN(h), r); }
  return envF(p, r, rough);
}

// The path through the resin. Each step adds the light scattered toward the eye (daylight soaking in from the
// skin, lamplight from the middle) and takes away what the dye absorbs.
vec3 inside(vec3 p, vec3 d, float jit){
  vec3 col = vec3(0.0); vec3 T = vec3(1.0); float t = 0.0; float id = 0.0; vec3 q = p;
  vec3 amb = uRoom * vec3(2.5, 2.45, 2.35);
  for (int i = 0; i < 44; i++) {
    q = p + d * t;
    float dR = -sdRock(q);
    float dL = sdCaps(q, LA, LB, 0.0);
    float dT = q.y - 0.07;
    float dm = min(dR, dT);
    if (i > 0 && dm < 0.004) { id = dm == dR ? 0.0 : 1.0; break; }
    float st = clamp(min(dm, dL * 0.5), 0.014, 0.13) * (i == 0 ? 0.35 + 0.65 * jit : 1.0);
    vec3 Ls = amb * exp(-uSig * (max(dR, 0.0) * 2.2 + 0.25));
    // the lamp is a volume, not a surface: a white-hot thread with a wide soft halo that the dye turns orange
    vec3 Ll = uLamp * uLampC * 0.46 * exp(-uSig * dL * 2.0) * (0.2 / (dL * dL + 0.03) + 0.24 / (dL + 0.3));
    float hd = dL * dL + 0.0022; vec3 hot = uLamp * vec3(1.0, 0.82, 0.6) * 0.0011 / (hd * hd);
    col += T * ((Ls + Ll) * SCAT + hot) * st;
    T *= exp(-(uSig + SCAT * 0.5) * st);
    t += st;
  }
  vec3 through = uRoom * 2.3 * exp(-uSig * 0.4);
  if (id == 1.0) {
    // the white tray under the rocker
    vec3 n = vec3(0.0, 1.0, 0.0);
    vec3 c = vec3(clamp(q.x, LA.x, LB.x), LA.y, 0.0); vec3 v = c - q; float dd = dot(v, v);
    vec3 e = through * 0.6 + uLampC * uLamp * 0.9 * max(dot(n, v) * inversesqrt(dd), 0.0) * exp(-uSig * sqrt(dd) * 1.1) / (dd + 0.04);
    float edge = smoothstep(0.0, 0.14, -sdRRect(q.xz, vec2(0.72, 1.205), 0.16));
    col += T * vec3(0.9, 0.89, 0.86) * e * (0.25 + 0.75 * edge);
  } else {
    // out the far side: bend again, unless the angle traps the ray, then carry on straight
    vec3 nx = rockN(q); vec3 o = refract(d, -nx, 1.49); if (dot(o, o) < 0.5) o = reflect(d, -nx);
    col += T * outside(q + nx * 0.012, o);
  }
  return col;
}

vec3 shadeRock(vec3 p, vec3 n, vec3 rd, float jit){
  vec3 q = rockL(p);
  vec3 gn = n;
  float ndv = clamp(dot(-rd, n), 0.0, 1.0);
  float f = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
  vec3 r = reflect(rd, n);
  float ro = smoothstep(-0.02, 0.22, sdBez(p + r * 0.2));
  vec3 refl = envF(p, r, 0.0) * ro;
  vec3 body = inside(p - gn * 0.012, refract(rd, n, 1.0 / 1.49), jit);
  // the legends, pad printed in white on the top face
  vec3 nl = vec3(gn.x, uCS.x * gn.y + uCS.y * gn.z, uCS.x * gn.z - uCS.y * gn.y);
  if (nl.y > 0.6) {
    vec2 b = abs(q.xz - vec2(0.0, 0.6)) - vec2(0.012, 0.16);
    float bar = length(max(b, 0.0)) + min(max(b.x, b.y), 0.0) - 0.022;
    float ring = abs(length(q.xz - vec2(0.0, -0.6)) - 0.15) - 0.03;
    float mk = min(bar, ring);
    float ink = smoothstep(0.004, -0.004, mk);
    float sb = shadowBez(p + gn * 0.01, normalize(uKeyP - p), 15.0);
    vec3 paint = vec3(0.93, 0.92, 0.9) * (keyLight(p, n, sb, 1.0) + fillLight(n, 1.0)) + uLampC * uLamp * 0.3;
    body = mix(body * (1.0 - 0.25 * smoothstep(0.03, 0.0, mk)), paint, ink);
  }
  return body * (1.0 - f) + f * refl;
}
vec3 shadeBez(vec3 p, vec3 n, vec3 rd, vec2 rnd){
  vec3 gn = n;
  // glaze: a slow ripple you only see where a softbox edge crosses it
  n = normalize(n + (vec3(n2(p.xz * 3.1), n2(p.zy * 3.1 + 2.0), n2(p.yx * 3.1 + 6.0)) - 0.5) * 0.02);
  float ao = calcAO(p, gn);
  vec3 alb = PORC;
  if (gn.y > 0.8 && p.y < 0.22) {
    // the maker's marks, pressed into the clay and filled with a dark slip
    vec2 uv = vec2(p.x / 2.8 + 0.5, 0.5 - p.z / 3.8); float e = 1.0 / 1024.0;
    float ink = texture2D(uTex, uv).r;
    float ix = texture2D(uTex, uv + vec2(e, 0.0)).r - texture2D(uTex, uv - vec2(e, 0.0)).r;
    float iz = texture2D(uTex, uv - vec2(0.0, e)).r - texture2D(uTex, uv + vec2(0.0, e)).r;
    n = normalize(n + vec3(ix, 0.0, iz) * 0.7);
    alb = mix(alb, vec3(0.2, 0.2, 0.33), ink * 0.9);
  }
  vec3 lk = normalize(uKeyP - p);
  float sb = shadowBez(p + gn * 0.012, lk, 15.0); float sr = shadowRock(p + gn * 0.012, lk);
  float sl = uLamp > 0.003 ? 0.12 + 0.88 * shadowBez(p + gn * 0.012, normalize(rockW(vec3(0.0, 0.42, 0.0)) - p), 3.0) : 1.0;
  vec3 col = alb * (keyLight(p, n, sb, sr) + fillLight(n, ao) + spill(p, n) * sl * (0.4 + 0.6 * ao) + wellGlow(p, n));
  float f = 0.045 + 0.955 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 r = normalize(reflect(rd, n) + vec3(rnd.x, rnd.y, rnd.x * rnd.y * 2.0) * 0.012);
  return col + f * trace(p + gn * 0.008, r, 0.03) * (0.3 + 0.7 * ao);
}
vec3 shadeScrew(vec3 p, vec3 n, vec3 rd, vec2 rnd){
  // turned brass, a little dulled by handling
  float ao = calcAO(p, n);
  vec3 q = vec3(p.x, p.y, abs(p.z) - 1.665); float r = length(q.xz);
  n = normalize(n + vec3(q.x, 0.0, q.z) / max(r, 1e-3) * (n2(vec2(r * 520.0, 1.0)) - 0.5) * 0.09);
  vec3 f0 = vec3(0.98, 0.74, 0.34);
  vec3 F = f0 + (1.0 - f0) * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 rr = normalize(reflect(rd, n) + vec3(rnd.x, rnd.y, rnd.x * rnd.y * 2.0) * 0.06);
  vec3 dl = keyLight(p, n, shadowBez(p + n * 0.012, normalize(uKeyP - p), 15.0), 1.0) + fillLight(n, ao) + spill(p, n);
  return F * (trace(p + n * 0.006, rr, 0.12) * (0.35 + 0.65 * ao) + 0.3 * dl);
}
vec3 shadeTable(vec3 gp, vec3 rd, vec2 rnd, float dist){
  float near = step(dot(gp.xz, gp.xz), 52.0);
  // sprayed paint: a fine tooth and a slower mottle
  float g = n2(gp.xz * 150.0); float g2 = n2(gp.xz * 9.0 + 3.0);
  vec3 n = normalize(vec3((g - 0.5) * 0.05 * smoothstep(24.0, 9.0, dist), 1.0, (n2(gp.zx * 150.0 + 7.0) - 0.5) * 0.05 * smoothstep(24.0, 9.0, dist)));
  float fine = smoothstep(24.0, 9.0, dist);
  vec3 alb = uTable * (0.955 + (0.06 * g - 0.03) * fine + 0.035 * g2);
  float ao = 1.0; float sb = 1.0; float sr = 1.0; float sl = 1.0;
  vec3 lk = normalize(uKeyP - gp);
  if (near > 0.5) {
    ao = calcAO(gp, vec3(0.0, 1.0, 0.0));
    sb = shadowBez(gp + vec3(0.0, 0.012, 0.0), lk, 15.0); sr = shadowRock(gp + vec3(0.0, 0.012, 0.0), lk);
    if (uLamp > 0.003) sl = 0.3 + 0.7 * shadowBez(gp + vec3(0.0, 0.012, 0.0), normalize(rockW(vec3(0.0, 0.75, 0.0)) - gp), 2.2);
  }
  // a few specks of dust that catch the light
  vec2 cell = floor(gp.xz * 15.0); float hs = h21(cell);
  vec2 cp = (cell + 0.2 + 0.6 * vec2(h21(cell + 3.1), h21(cell + 7.7))) / 15.0;
  alb += step(0.99, hs) * smoothstep(0.004 + 0.008 * h21(cell + 1.3), 0.0, length(gp.xz - cp)) * 0.3;
  // the softbox is aimed at the switch, so the table falls off away from it
  float pool = mix(0.6, 1.0, smoothstep(11.0, 1.2, length(gp.xz - vec2(-0.5, 0.6))));
  vec3 col = alb * ((keyLight(gp, n, sb, sr) + fillLight(n, ao)) * pool + spill(gp, n) * 1.9 * sl * (0.5 + 0.5 * ao));
  // a satin top coat: a dim, soft mirror of whatever stands on it
  float f = 0.07 + 0.9 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 r = normalize(reflect(rd, vec3(0.0, 1.0, 0.0)) + vec3(rnd.x, 0.0, rnd.y) * 0.07);
  vec3 refl = room(r);
  if (near > 0.5) { float tr = marchLite(gp + vec3(0.0, 0.004, 0.0), r); if (tr > 0.0) { vec3 h = gp + r * tr; refl = sdRock(h) < sdBez(h) ? rockLite(h, rockN(h), r) : bezLite(h, bezN(h), r); } }
  col += f * refl * (0.4 + 0.6 * ao);
  return col;
}

void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * uJit.z + up * uJit.w; rd = normalize(fp - ro);
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uSeed);
  float ang = ign * 6.2831853; float rr = sqrt(fract(ign * 7.13 + uSeed * 3.7));
  vec2 rnd = vec2(cos(ang), sin(ang)) * rr * step(0.001, uSeed);
  float t = march(ro, rd);
  float tg = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  vec3 col;
  if (t > 0.0 && t < tg) {
    vec3 p = ro + rd * t; vec3 n = calcN(p);
    float dr = sdRock(p); float db = sdBez(p); float ds = sdScrew(p);
    if (dr < min(db, ds)) col = shadeRock(p, n, rd, uSeed > 0.001 ? ign : 0.5); else if (ds < db) col = shadeScrew(p, n, rd, rnd); else col = shadeBez(p, n, rd, rnd);
  }
  else if (tg < 1e8) col = shadeTable(ro + rd * tg, rd, rnd, tg);
  else col = env(ro, rd, 0.0);
  col = min(col, vec3(24.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// The print: a little bloom off the lamp and the softbox, the film curve, a corner falloff, grain.
const POST = `
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain; uniform vec2 uCentre;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uAcc, uv).rgb;
  vec2 px = 1.0 / uRes;
  vec3 nb = texture2D(uAcc, uv + vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv - vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv + vec2(0.0, px.y)).rgb + texture2D(uAcc, uv - vec2(0.0, px.y)).rgb;
  c = max(c + (c - nb * 0.25) * 0.45, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 20.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.03 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.3, 0.0), vec3(8.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.01;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.2 * smoothstep(0.3, 1.2, length(q));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.016;
  outC = vec4(c, 1.0);
}
`;

// The maker's marks, drawn once as a plan of the plate (x across, far end at the top).
function marks() {
  const W = 1024, H = 1390;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  if (!g) return cv;
  const px = W / 2.8;
  g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `600 ${0.072 * px}px ${FONT}`;
  // down the long side nearest the lens, read from that side
  g.save(); g.translate(W / 2 + 1.215 * px, H / 2); g.rotate(-Math.PI / 2);
  const chars = MARKS.split(""); const step = 0.062 * px;
  chars.forEach((c, k) => g.fillText(c, (k - (chars.length - 1) / 2) * step, 0));
  g.restore();
  return cv;
}

// No WebGL: the same switch as a still, built from CSS boxes in the same three-quarter pose.
function Still({ on }: { on: boolean }) {
  const glow = on ? 1 : 0;
  const resin = on
    ? "radial-gradient(120% 90% at 50% 62%, #fff3c4 0%, #ffc35a 16%, #ff8a1f 42%, #f2600c 72%, #d8490a 100%)"
    : "radial-gradient(120% 90% at 50% 30%, #ffa648 0%, #f97316 45%, #dc5a0b 80%, #c2480a 100%)";
  return (
    <div aria-hidden="true" className="absolute left-1/2 top-[34%] h-[420px] w-[520px] -translate-x-1/2 -translate-y-1/2 scale-[0.62] sm:scale-90 lg:left-[66%] lg:top-[50%] lg:scale-[1.2]" style={{ perspective: 1800 }}>
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transform: "rotateX(57deg) rotateZ(31deg)" }}>
        <div className="absolute left-[-260px] top-[-330px] h-[900px] w-[760px] blur-md" style={{ opacity: on ? 0.5 : 0.85, background: "linear-gradient(90deg, rgba(226,228,255,0.85) 0 61%, transparent 61% 63%, rgba(226,228,255,0.85) 63%), linear-gradient(0deg, transparent 0 34%, rgba(150,154,220,0.9) 34% 36%, transparent 36%)" }} />
        <div className="absolute left-[92px] top-[10px] h-[400px] w-[336px] rounded-[120px] blur-2xl" style={{ background: "rgba(52,48,120,0.45)", transform: "translate(34px, 40px)" }} />
        <div className="absolute left-[60px] top-[-30px] h-[480px] w-[400px] rounded-full blur-3xl transition-opacity duration-300 motion-reduce:transition-none" style={{ background: "radial-gradient(closest-side, rgba(255,150,70,0.75), rgba(255,150,70,0))", opacity: glow }} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="absolute left-[110px] top-[20px] h-[380px] w-[300px] rounded-[110px]" style={{ background: i === 5 ? "linear-gradient(135deg, #ffffff 0%, #f1ede4 55%, #ddd6ca 100%)" : "#cfc8bc", transform: `translateZ(${i * 3}px)`, boxShadow: i === 5 ? "inset 0 0 0 1px rgba(255,255,255,0.9)" : "none" }} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="absolute left-[156px] top-[66px] h-[288px] w-[208px] rounded-[70px]" style={{ background: i === 7 ? "linear-gradient(135deg, #ffffff 0%, #f4f0e8 50%, #e2dbcf 100%)" : "#d6cfc3", transform: `translateZ(${16 + i * 5}px)`, boxShadow: i === 7 ? `inset 0 0 26px rgba(255,140,50,${0.55 * glow})` : "none" }} />
        ))}
        <div className="absolute left-[184px] top-[94px] h-[232px] w-[152px] rounded-[30px]" style={{ background: on ? "#ffb347" : "#5b3a2a", transform: "translateZ(52px)", boxShadow: on ? "0 0 26px 6px rgba(255,160,60,0.9)" : "inset 0 0 12px rgba(0,0,0,0.7)" }} />
        <div className="absolute left-[190px] top-[100px] h-[220px] w-[140px]" style={{ transformStyle: "preserve-3d", transform: `translateZ(62px) rotateX(${on ? 11 : -11}deg)` }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="absolute inset-0 rounded-[26px]" style={{ background: i === 9 ? resin : on ? "#f0640c" : "#c9500b", transform: `translateZ(${i * 4}px)`, boxShadow: i === 9 ? "inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -10px 22px rgba(160,50,0,0.35)" : on ? "0 0 14px rgba(255,150,60,0.5)" : "none" }}>
              {i === 9 && (
                <>
                  <span className="absolute left-1/2 top-[34px] block h-[40px] w-[9px] -translate-x-1/2 rounded-full bg-white/95" />
                  <span className="absolute bottom-[32px] left-1/2 block h-[40px] w-[40px] -translate-x-1/2 rounded-full border-[8px] border-white/95" />
                  <span className="absolute left-[14px] right-[40px] top-[10px] block h-[86px] rounded-[18px] bg-gradient-to-br from-white/75 to-white/0" />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RayMarchedResinRocker() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(START_ON);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const onRef = useRef(START_ON);
  const api = useRef<{ set: (v: boolean, fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current, pad = hit.current;
    if (!box || !cv || !pad) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts = { antialias: false, alpha: false, powerPreference: "high-performance" as const };
    const gl2 = cv.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? cv.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) { setShown("still"); return; }
    const canAcc = !!gl2 && (!!gl2.getExtension("EXT_color_buffer_float") || !!gl2.getExtension("EXT_color_buffer_half_float"));
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    const still = reduce || software; // nothing drifts: draw, refine, rest

    const head = gl2 ? "#version 300 es\n#define ATTR in\n" : "#define ATTR attribute\n";
    const fhead = gl2 ? "#version 300 es\n#define texture2D texture\nprecision highp float;\nout vec4 outC;\n" : "#define outC gl_FragColor\n";
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const link = (frag: string) => {
      const v = compile(gl.VERTEX_SHADER, head + VERT), f = compile(gl.FRAGMENT_SHADER, fhead + frag);
      const p = gl.createProgram();
      if (!v || !f || !p) return null;
      gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    };
    const scene = link(SCENE), post = canAcc ? link(POST) : null;
    if (!scene || (canAcc && !post)) { setShown("still"); return; }
    const names = ["uRes", "uJit", "uSeed", "uCS", "uLamp", "uDip", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uKeyP", "uFillP", "uTopP", "uLowP", "uSig", "uLampC", "uTable", "uDirect", "uRoom", "uTex"];
    const su = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, gl.getUniformLocation(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, marks());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // The plate every exposure is blended onto.
    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const a0 = START_ON ? TILT : -TILT;
    const s = {
      a: a0, v: 0, want: START_ON, hold: 0, holding: false, lit: START_ON, strike: 9, lamp: START_ON ? 1 : 0, room: START_ON ? 1 : 0, dip: 0, dipV: 0,
      px: 0, py: 0, sx: 0, sy: 0, key: 0, count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, first: true,
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      // never more than about a million and a half pixels of ray marching
      const k = Math.min(1, Math.sqrt(1.45e6 / (cssW * cssH * dpr * dpr)));
      const w = Math.max(2, Math.round(cssW * dpr * k)), h = Math.max(2, Math.round(cssH * dpr * k));
      if (w === W && h === H) return;
      W = w; H = h; cv.width = W; cv.height = H;
      if (gl2 && acc && fbo) {
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, acc);
        gl2.texImage2D(gl.TEXTURE_2D, 0, gl2.RGBA16F, W, H, 0, gl.RGBA, gl2.HALF_FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, acc, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      s.count = 0; s.fresh = true;
    };
    const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

    const draw = (alpha: number, sample: number) => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      // the camera: a long lens, up and to the right of the switch, looking down its length
      const el = 0.56 - s.sy * 0.03, az = 0.6 + s.sx * 0.07, dist = 9;
      const tgt = [0, 0.34, 0];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] - dist * Math.cos(az) * Math.cos(el)];
      const foc = 2.2 * Math.min(1, aspect / 1.12);
      // lights are placed relative to the lens: `away` runs from the camera past the switch, `right` across the frame
      const away = [-Math.sin(0.6), Math.cos(0.6)], right = [Math.cos(0.6), Math.sin(0.6)];
      const kx = -4.2 + s.key;
      const keyP = [away[0] * 5.6 + right[0] * kx, 5.2, away[1] * 5.6 + right[1] * kx];
      // two strip boxes sit where the top face of the rocker looks in each of its positions
      const topP = [-4.7 + right[0] * s.key * 0.7, 7.2, 4.6 + right[1] * s.key * 0.7];
      const lowP = [-4.5 + right[0] * (1 + s.key * 0.35), 1.75, 7.7 + right[1] * (1 + s.key * 0.35)];
      const fillP = [-away[0] * 7 + right[0] * 4.6, 3.2, -away[1] * 7 + right[1] * 4.6];
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.015 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform2f(su.uCS, Math.cos(s.a), Math.sin(s.a));
      gl.uniform1f(su.uLamp, s.lamp); gl.uniform1f(su.uDip, s.dip * 0.6);
      gl.uniform3f(su.uCam, cam[0], cam[1], cam[2]); gl.uniform3f(su.uTgt, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFoc, foc);
      gl.uniform2f(su.uShift, wide ? 0.15 * aspect : 0, (wide ? 0.0 : 0.16) + s.dip * 0.9);
      gl.uniform1f(su.uFocus, 8.75);
      gl.uniform3f(su.uKeyP, keyP[0], keyP[1], keyP[2]); gl.uniform3f(su.uFillP, fillP[0], fillP[1], fillP[2]); gl.uniform3f(su.uTopP, topP[0], topP[1], topP[2]); gl.uniform3f(su.uLowP, lowP[0], lowP[1], lowP[2]);
      gl.uniform3f(su.uSig, RESIN[0], RESIN[1], RESIN[2]);
      gl.uniform3f(su.uLampC, LAMP[0], LAMP[1], LAMP[2]);
      gl.uniform3f(su.uTable, TABLE[0], TABLE[1], TABLE[2]);
      // the studio comes down a touch while the lamp is on, as an exposure set for the lamp would have it
      gl.uniform1f(su.uRoom, 1 - DUSK * s.room);
      gl.uniform1i(su.uTex, 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, wide ? 0.65 : 0.5, wide ? 0.5 : 0.66);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const set = (v: boolean, fromUser: boolean) => {
      if (fromUser) s.touched = true;
      s.want = v;
      if (v !== onRef.current) { onRef.current = v; setOn(v); }
      if (reduce) { s.a = v ? TILT : -TILT; s.v = 0; s.lit = v; s.lamp = v ? 1 : 0; s.room = v ? 1 : 0; s.strike = 9; s.count = 0; s.fresh = true; }
      wake();
    };
    api.current = { set };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 3700; }

      // the self-running demo: it opens lit and finished, holds, then works the switch until someone touches it
      if (!still && !s.touched && now > s.demoAt) {
        const next = !s.want;
        set(next, false);
        s.demoAt = now + (next ? 3100 : 1500);
      }

      let moving = false;
      if (!reduce) {
        const rest = s.want ? TILT : -TILT;
        // a finger resting on the high end takes up the slack before the spring goes over centre
        s.hold += ((s.holding ? 1 : 0) - s.hold) * (1 - Math.exp(-dt * 26));
        const goal = rest * (1 - 0.62 * s.hold);
        const stiff = s.holding ? 520 : 420, damp = s.holding ? 40 : 13;
        const steps = 4, h = dt / steps;
        for (let i = 0; i < steps; i++) {
          s.v += (stiff * (goal - s.a) - damp * s.v) * h; s.a += s.v * h;
          // the end stop: the rocker lands on the housing and kicks back a little, and the thud reaches the tripod
          if (s.a > TILT) { s.a = TILT; if (s.v > 0) { s.dipV -= s.v * 0.03; s.v *= -0.3; } }
          if (s.a < -TILT) { s.a = -TILT; if (s.v < 0) { s.dipV += s.v * 0.03; s.v *= -0.3; } }
          s.dipV += (-2600 * s.dip - 46 * s.dipV) * h; s.dip += s.dipV * h;
        }
        if (Math.abs(s.v) > 0.003 || Math.abs(goal - s.a) > 0.0005 || Math.abs(s.dip) > 0.00012 || Math.abs(s.dipV) > 0.004) moving = true;
        else { s.a = goal; s.v = 0; s.dip = 0; s.dipV = 0; }
        // the contacts close a little before the stop and open a little after leaving it
        // (once made, a bounce off the stop does not break them)
        const closed = s.want ? s.lit || s.a > TILT * 0.55 : s.a > TILT * 0.8;
        if (closed && !s.lit) { s.lit = true; s.strike = 0; }
        if (!closed && s.lit) s.lit = false;
        if (s.lit) {
          s.strike += dt;
          // it strikes, stutters once, overshoots, and settles
          const want = (1 + 0.6 * Math.exp(-s.strike * 6)) * (s.strike > 0.035 && s.strike < 0.07 ? 0.18 : 1);
          const d = want - s.lamp;
          if (Math.abs(d) > 0.002) { s.lamp += d * (1 - Math.exp(-dt * 70)); moving = true; } else s.lamp = want;
        } else if (s.lamp > 0) {
          // and dies quickly, with a short tail
          s.lamp *= Math.exp(-dt * (s.lamp > 0.14 ? 20 : 4.5));
          if (s.lamp < 0.003) s.lamp = 0;
          moving = true;
        }
      }
      if (!reduce) {
        // the daylight follows the lamp slowly, the way an eye or an exposure does
        const dr = (s.lit ? 1 : 0) - s.room;
        if (Math.abs(dr) > 0.002) { s.room += dr * (1 - Math.exp(-dt * (s.lit ? 5 : 3.2))); moving = true; } else s.room = s.lit ? 1 : 0;
      }
      if (!still) {
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        const t = (now - s.t0) / 1000;
        s.key = Math.sin(t * 0.4 + 0.3) * 1.5 + s.sx * 1.6;
        moving = true;
      }

      const fast = Math.abs(s.v) > 0.2 || (s.lit && s.strike < 0.3) || (!s.lit && s.lamp > 0.05);
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(fast ? 0.6 : still ? 0.5 : 0.09, 1 + (s.frame % 64)); s.count = still ? 1 : 6; }
      else if (s.count < 48) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      // measured, not guessed: if frames run long for a while, give up some resolution
      if (!still && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 45 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 48 || (!still && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);

    const down = (e: PointerEvent) => { if (e.pointerType === "mouse" && e.button !== 0) return; s.holding = true; s.touched = true; wake(); };
    const release = () => { if (s.holding) { s.holding = false; wake(); } };
    const click = () => { s.holding = false; set(!onRef.current, true); };
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!still) wake();
    };
    const leave = () => { s.px = 0; s.py = 0; };
    pad.addEventListener("pointerdown", down);
    pad.addEventListener("pointerup", release);
    pad.addEventListener("pointercancel", release);
    pad.addEventListener("pointerleave", release);
    pad.addEventListener("click", click);
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      pad.removeEventListener("pointerdown", down); pad.removeEventListener("pointerup", release);
      pad.removeEventListener("pointercancel", release); pad.removeEventListener("pointerleave", release);
      pad.removeEventListener("click", click);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const toggle = () => {
    const v = !onRef.current;
    if (api.current) api.current.set(v, true); else { onRef.current = v; setOn(v); }
  };

  const still = shown === "still";
  const c = on ? copy.on : copy.off;

  return (
    <section className="relative isolate overflow-hidden bg-[#aeb2e8] text-[#1b1947]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes ray-marched-resin-rocker-rise { from { opacity: 0; transform: translateY(0.12em); filter: blur(8px); } to { opacity: 1; transform: none; filter: blur(0); } }
        .ray-marched-resin-rocker-word { animation: ray-marched-resin-rocker-rise 460ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .ray-marched-resin-rocker-word { animation: none; } }
      `}</style>
      <div ref={stage} className="relative h-[720px] w-full lg:h-[760px]" style={{ background: "radial-gradient(80% 70% at 64% 44%, #cdd0f6 0%, #b6baec 50%, #9da2de 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />

        {still && <Still on={on} />}

        <div ref={hit} aria-hidden="true" className="absolute inset-x-0 top-0 h-[60%] cursor-pointer select-none lg:inset-y-0 lg:left-[38%] lg:h-full" style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }} />

        <div className="pointer-events-none absolute inset-0 mx-auto flex max-w-[1600px] flex-col justify-end px-6 pb-7 sm:px-10 lg:justify-between lg:px-16 lg:pb-14 lg:pt-14">
          <p className="hidden text-[11px] font-semibold uppercase tracking-[0.34em] text-[#1b1947] lg:block">Tolland &amp; Reeve <span className="mx-2 text-[#1b1947]/40">/</span> lit rocker, pattern R2</p>
          <div>
            <p aria-live="polite">
              <span key={c.word} className="ray-marched-resin-rocker-word block text-[112px] leading-[0.8] tracking-[-0.045em] text-[#1b1947] sm:text-[150px] lg:text-[232px]" style={{ fontFamily: SERIF }}>
                {c.word}
              </span>
              <span className="mt-5 block max-w-[21rem] text-[15px] font-medium leading-[1.45] tracking-[-0.01em] text-[#1b1947] lg:mt-8 lg:text-[17px]">{c.note}</span>
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              onClick={toggle}
              className="pointer-events-auto mt-6 flex h-12 items-center gap-3 rounded-full bg-white/55 py-1 pl-2 pr-5 text-[14px] font-semibold tracking-[-0.01em] text-[#1b1947] outline-none ring-1 ring-[#1b1947]/10 backdrop-blur-sm transition-colors duration-200 hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-[#1b1947] focus-visible:ring-offset-2 focus-visible:ring-offset-[#aeb2e8] lg:mt-9"
            >
              <span className={`relative block h-8 w-[54px] rounded-full transition-colors duration-200 motion-reduce:transition-none ${on ? "bg-[#f2620f]" : "bg-[#1b1947]/25"}`}>
                <span className={`absolute left-1 top-1 block h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(27,25,71,0.35)] transition-transform duration-300 ease-[cubic-bezier(0.3,1.5,0.5,1)] motion-reduce:transition-none ${on ? "translate-x-[22px]" : ""}`} />
              </span>
              <span>{LABEL}</span>
            </button>
          </div>
        </div>
        <p className="pointer-events-none absolute bottom-7 right-6 hidden text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1b1947]/80 sm:right-10 lg:bottom-14 lg:right-16 lg:block">Press the rocker</p>
      </div>
    </section>
  );
}
