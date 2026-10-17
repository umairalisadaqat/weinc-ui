import { useEffect, useRef, useState } from "react";

// Everything a visitor would edit first.
const product = {
  house: "Maren Atelier",
  kind: "Amber clarity serum",
  headline: ["Calm skin,", "one drop", "at a time."],
  line: "Sea buckthorn and squalane in a light amber oil that settles into the skin like water into stone.",
  cta: "Shop the serum",
  more: "Read the formula",
  note: "30 ml, frosted glass dropper",
};
// Colours of the set, in linear light (0 to 1).
const STONE = [0.7, 0.645, 0.56]; // the pale limestone
const SAND = [0.62, 0.6, 0.53]; // the floor of the deeper water around the stone
const SERUM = [0.75, 2.9, 7.0]; // how fast the serum swallows red, green and blue per unit of depth
const BULB = [0.05, 0.04, 0.034]; // the silicone bulb of the dropper
const METAL = [0.93, 0.86, 0.74]; // the anodised collar
const FILL = 0.94; // height of the serum inside the bottle
const DEPTH = 0.1; // depth of the water over the stone
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const v3 = (c: number[]) => `vec3(${c.map((n) => n.toFixed(4)).join(", ")})`;
const RIPS = 8;

const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

// The photograph: a frosted bottle on a limestone slab under a skin of moving water, lit by a high sun.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uSeed;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus; uniform float uBlur;
uniform vec3 uSun; uniform vec4 uRip[${RIPS}];
const float WD = ${DEPTH.toFixed(3)}; const float FILLH = ${FILL.toFixed(3)};
const vec3 STONE = ${v3(STONE)}; const vec3 SAND = ${v3(SAND)}; const vec3 SERUM = ${v3(SERUM)};
const vec3 BULB = ${v3(BULB)}; const vec3 METAL = ${v3(METAL)};
const vec3 SUNC = vec3(1.0, 0.95, 0.86);
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float cyl(vec3 p, float r, float y0, float y1, float e){
  vec2 d = vec2(length(p.xz) - r + e, abs(p.y - 0.5 * (y0 + y1)) - 0.5 * (y1 - y0) + e);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - e;
}

// ---- the dropper bottle, standing at the origin ----
float dGlass(vec3 q){
  float body = cyl(q, 0.44, 0.0, 1.2, 0.09);
  float neck = cyl(q, 0.165, 1.0, 1.44, 0.02);
  return smin(body, neck, 0.2);
}
float dLiq(vec3 q){ return max(cyl(q, 0.385, 0.075, 1.1, 0.07), q.y - FILLH); }
float dCollar(vec3 q){ return cyl(q, 0.2, 1.36, 1.64, 0.025); }
float dBulb(vec3 q){
  float r = 0.118 - 0.012 * smoothstep(1.62, 1.74, q.y);
  return smin(cyl(q, r, 1.6, 1.8, 0.03), length((q - vec3(0.0, 1.9, 0.0)) * vec3(1.0, 0.92, 1.0)) - 0.165, 0.07);
}
float dCap(vec3 q){ return min(dCollar(q), dBulb(q)); }
float map(vec3 p){ return min(dGlass(p), dCap(p)); }
vec2 bound(vec3 ro, vec3 rd){
  float a = dot(rd.xz, rd.xz); float b = dot(ro.xz, rd.xz); float c = dot(ro.xz, ro.xz) - 0.21;
  float h = b * b - a * c; if (h < 0.0 || a < 1e-6) return vec2(1.0, -1.0);
  h = sqrt(h); float t0 = (-b - h) / a; float t1 = (-b + h) / a;
  if (abs(rd.y) > 1e-5) { float ya = (-0.02 - ro.y) / rd.y; float yb = (2.12 - ro.y) / rd.y; t0 = max(t0, min(ya, yb)); t1 = min(t1, max(ya, yb)); }
  return vec2(max(t0, 0.0), t1);
}
float march(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 64; i++) { float d = map(ro + rd * t); if (d < 0.0008) return t; t += d * 0.92; if (t > tb.y) break; }
  return -1.0;
}
vec3 nGlass(vec3 q){ vec2 e = vec2(0.0015, -0.0015); return normalize(e.xyy * dGlass(q + e.xyy) + e.yyx * dGlass(q + e.yyx) + e.yxy * dGlass(q + e.yxy) + e.xxx * dGlass(q + e.xxx)); }
vec3 nCap(vec3 q){ vec2 e = vec2(0.0015, -0.0015); return normalize(e.xyy * dCap(q + e.xyy) + e.yyx * dCap(q + e.yyx) + e.yxy * dCap(q + e.yxy) + e.xxx * dCap(q + e.xxx)); }

// ---- the water: a slow swell plus the rings people make ----
float height(vec2 p){
  float t = uTime; float h = 0.0;
  h += 0.0050 * sin(dot(p, vec2(0.80, 0.60)) * 4.6 - t * 1.25);
  h += 0.0036 * sin(dot(p, vec2(-0.47, 0.88)) * 7.1 - t * 1.6 + 1.3);
  h += 0.0024 * sin(dot(p, vec2(0.96, -0.28)) * 10.7 - t * 2.05 + 4.0);
  h += 0.0016 * sin(dot(p, vec2(-0.18, -0.98)) * 15.3 - t * 2.5 + 2.2);
  h += 0.0010 * sin(dot(p, vec2(0.6, -0.8)) * 22.0 - t * 3.1);
  h += 0.0030 * (n2(p * 3.0 + vec2(t * 0.35, -t * 0.22)) + n2(p * 5.3 - vec2(t * 0.3, t * 0.41)) - 1.0);
  for (int i = 0; i < ${RIPS}; i++) {
    vec4 r = uRip[i]; float age = t - r.z;
    if (r.w > 0.0 && age > 0.0 && age < 6.0) {
      float d = length(p - r.xy); float k = d - age * 0.62;
      h += r.w * 0.02 * cos(k * 19.0) * exp(-k * k * 7.0) * exp(-age * 0.62) / sqrt(1.0 + 4.0 * d);
    }
  }
  // the glass stills the water right against it
  return h * smoothstep(0.43, 0.5, length(p));
}
vec3 wNorm(vec2 p){ float e = 0.006; float h0 = height(p); return normalize(vec3(-(height(p + vec2(e, 0.0)) - h0) / e, 1.0, -(height(p + vec2(0.0, e)) - h0) / e)); }

// ---- the stone and the sand around it ----
float slab(vec2 p){ vec2 d = abs(p - vec2(-0.9, 0.35)) - vec2(4.3, 2.15); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - 0.55 + 0.5 * (n2(p * 0.7 + 4.0) - 0.5) + 0.06 * (n2(p * 2.3) - 0.5); }
float floorH(vec2 p){ float s = slab(p); return -0.34 * smoothstep(-0.02, 0.1, s) - 0.012 * smoothstep(-0.1, -0.01, s); }
vec3 floorAlb(vec2 p){
  float s = slab(p);
  float g = n2(p * 3.1) * 0.55 + n2(p * 9.0) * 0.3 + n2(p * 31.0) * 0.15;
  float pit = smoothstep(0.82, 0.9, n2(p * 24.0 + 3.0)) * 0.22;
  float vein = smoothstep(0.035, 0.0, abs(n2(p * vec2(1.1, 2.6) + 9.0) - 0.5)) * 0.1;
  vec3 st = STONE * (0.9 + 0.16 * g - pit - vein);
  vec3 sd = SAND * (0.85 + 0.3 * n2(p * 40.0) * n2(p * 7.0));
  return mix(st, sd, smoothstep(-0.02, 0.06, s));
}

vec3 env(vec3 d){
  vec3 c = mix(vec3(0.86, 0.9, 0.95), vec3(1.0, 0.99, 0.97), smoothstep(0.0, 0.7, d.y)) * 1.35;
  c += vec3(1.0, 0.97, 0.92) * 2.2 * smoothstep(0.82, 0.97, dot(d, normalize(vec3(-0.35, 0.86, 0.4))));
  // a tall white card to camera right
  c += vec3(1.0) * 1.6 * smoothstep(0.04, -0.04, abs(atan(d.x, d.z) - 1.25) - 0.22) * smoothstep(-0.05, 0.1, d.y) * smoothstep(0.75, 0.5, d.y);
  // a narrow strip light behind camera left, the long highlight down the glass
  c += vec3(1.0, 0.98, 0.95) * 5.0 * smoothstep(0.03, -0.03, abs(atan(d.x, -d.z) + 0.5) - 0.09) * smoothstep(-0.1, 0.05, d.y) * smoothstep(1.0, 0.85, d.y);
  c += SUNC * 40.0 * smoothstep(0.9965, 0.999, dot(d, uSun));
  if (d.y < 0.0) c = mix(c, vec3(0.78, 0.76, 0.71), smoothstep(0.0, -0.15, d.y));
  return c;
}

// Light that reaches a point on the floor: a soft shadow of the bottle, and inside it the amber the serum lets through.
vec3 sunVis(vec3 p, vec3 L, float jit){
  vec2 tb = bound(p, L); if (tb.x > tb.y) return vec3(1.0);
  float res = 1.0; float t = max(tb.x, 0.01);
  for (int i = 0; i < 24; i++) { float h = map(p + L * t); res = min(res, 9.0 * h / t); t += clamp(h, 0.02, 0.3); if (res < 0.004 || t > tb.y) break; }
  res = clamp(res, 0.0, 1.0); res = res * res * (3.0 - 2.0 * res);
  if (res > 0.995) return vec3(1.0);
  float t0 = tb.x; float dt = (tb.y - t0) / 16.0; float tt = t0 + dt * jit;
  float liq = 0.0; float opq = 0.0; float gls = 0.0;
  for (int i = 0; i < 16; i++) {
    vec3 q = p + L * tt;
    if (dCap(q) < 0.0) opq = 1.0;
    if (dGlass(q) < 0.0) { gls += dt; if (dLiq(q) < 0.0) liq += dt; }
    tt += dt;
  }
  vec3 thru = exp(-SERUM * liq * 0.6) * (0.12 + 1.5 * smoothstep(0.1, 0.6, liq)) * exp(-gls * 0.9) * (1.0 - opq);
  return mix(thru * 0.6, vec3(1.0), res);
}

// Bright lines a moving surface focuses on the floor: how much a small patch of sunlight is squeezed on the way down.
float caustic(vec2 p, float depth, vec3 L){
  float e = 0.008; float k = depth * 24.0 + 0.3;
  vec3 r0 = refract(-L, wNorm(p), 0.75); vec3 r1 = refract(-L, wNorm(p + vec2(e, 0.0)), 0.75); vec3 r2 = refract(-L, wNorm(p + vec2(0.0, e)), 0.75);
  vec2 a = r0.xz / -r0.y * k; vec2 b = vec2(e, 0.0) + r1.xz / -r1.y * k; vec2 c = vec2(0.0, e) + r2.xz / -r2.y * k;
  float area = abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
  float I = e * e / max(area, 1e-6); return clamp(pow(I, 1.6), 0.0, 6.0);
}

vec3 floorShade(vec3 p, float jit){
  vec2 e = vec2(0.01, 0.0);
  vec3 n = normalize(vec3(floorH(p.xz - e.xy) - floorH(p.xz + e.xy), 2.0 * e.x, floorH(p.xz - e.yx) - floorH(p.xz + e.yx)));
  vec3 alb = floorAlb(p.xz);
  vec3 L = normalize(refract(-uSun, vec3(0.0, 1.0, 0.0), 0.75)) * -1.0;
  float depth = WD - p.y;
  float cs = caustic(p.xz, depth, uSun);
  vec3 vis = sunVis(p + n * 0.003, uSun, 0.5);
  float r = length(p.xz);
  float ao = 1.0 - 0.5 * exp(-max(r - 0.44, 0.0) * 9.0) - 0.1 * exp(-max(r - 0.44, 0.0) * 2.0);
  vec3 sun = SUNC * 1.4 * max(dot(n, L), 0.0) * vis * mix(1.0, cs, 0.55 * smoothstep(0.0, 0.05, depth));
  vec3 sky = vec3(0.86, 0.88, 0.9) * 0.46 * ao;
  return alb * (sun + sky);
}

// the bottle seen cheaply, in a reflection or under the water
vec3 bottleFlat(vec3 p){
  if (dCap(p) < dGlass(p)) return dBulb(p) < dCollar(p) ? BULB * 1.1 : METAL * 1.3;
  float l = step(p.y, FILLH) * step(0.07, p.y);
  return mix(vec3(1.05, 1.02, 0.98), vec3(1.3, 0.62, 0.2), l * 0.85);
}

// everything that is not the bottle, seen from above: water over stone
vec3 waterView(vec3 ro, vec3 rd, float jit, float lite){
  if (rd.y > -0.01) return env(rd);
  float t = (WD - ro.y) / rd.y; vec3 p = ro + rd * t;
  vec3 n = lite > 0.5 ? vec3(0.0, 1.0, 0.0) : wNorm(p.xz);
  float nv = clamp(dot(-rd, n), 0.0, 1.0);
  float F = 0.02 + 0.98 * pow(1.0 - nv, 5.0);
  vec3 rr = reflect(rd, n);
  vec3 refl = env(rr);
  if (lite < 0.5) { float tb = march(p, rr); if (tb > 0.0) refl = bottleFlat(p + rr * tb) * 0.9; }
  vec3 td = refract(rd, n, 0.75);
  // under the water: the foot of the bottle, or the floor
  vec3 col; float path = 0.0;
  float tb = lite > 0.5 ? -1.0 : march(p, td);
  float tf = 0.0;
  for (int i = 0; i < 20; i++) { vec3 q = p + td * tf; float d = q.y - floorH(q.xz); if (d < 0.002) break; tf += max(d * 0.8, 0.004); }
  if (tb > 0.0 && tb < tf) { col = bottleFlat(p + td * tb) * 0.75; path = tb; }
  else { vec3 fp = p + td * tf; col = lite > 0.5 ? floorAlb(fp.xz) * 1.6 : floorShade(fp, jit); path = tf; }
  col *= exp(-vec3(1.6, 0.55, 0.42) * path);
  // a bright meniscus where the water climbs the glass
  float r = length(p.xz);
  col += vec3(1.0, 0.97, 0.9) * 0.6 * exp(-pow((r - 0.445) / 0.012, 2.0));
  return mix(col, refl, F);
}

vec3 shadeCap(vec3 p, vec3 rd){
  vec3 n = nCap(p); vec3 r = reflect(rd, n);
  float nv = clamp(dot(-rd, n), 0.0, 1.0);
  vec3 L = uSun;
  if (dBulb(p) < dCollar(p)) {
    // soft-touch silicone: wrapped light, a broad dull sheen
    float w = max((dot(n, L) + 0.35) / 1.35, 0.0);
    float ao = 0.55 + 0.45 * smoothstep(1.6, 1.8, p.y);
    vec3 col = BULB * (SUNC * 2.1 * w * w + vec3(0.8, 0.85, 0.92) * 0.55 * ao) + BULB * vec3(0.5, 0.15, 0.08) * 0.35 * pow(1.0 - nv, 2.0);
    col += 0.12 * pow(max(dot(r, L), 0.0), 14.0) + (0.03 + 0.2 * pow(1.0 - nv, 5.0)) * env(r) * 0.5;
    return col;
  }
  // anodised collar with fine ribs: blurred reflections stretched along the ribs
  float a = atan(p.z, p.x);
  n = normalize(n + vec3(-sin(a), 0.0, cos(a)) * 0.18 * sin(a * 70.0));
  r = reflect(rd, n);
  vec3 f = METAL + (1.0 - METAL) * pow(1.0 - nv, 5.0);
  vec3 c = env(normalize(r + vec3(0.0, 0.25, 0.0)));
  float rimAo = 0.5 + 0.5 * smoothstep(1.36, 1.42, p.y) * smoothstep(1.64, 1.58, p.y);
  return f * (c * 0.55 + SUNC * 3.0 * pow(max(dot(r, L), 0.0), 24.0)) * rimAo;
}

vec3 shadeBottle(vec3 p, vec3 rd, float jit){
  if (dCap(p) < dGlass(p)) return shadeCap(p, rd);
  vec3 n = nGlass(p);
  float nv = clamp(dot(-rd, n), 0.0, 1.0);
  float F = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
  // acid-etched glass: each pixel looks through three slightly different bumps of the frost
  vec3 thru = vec3(0.0); float liqSum = 0.0;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    vec3 rnd = vec3(h21(gl_FragCoord.xy + fk * 17.1 + uSeed), h21(gl_FragCoord.yx + fk * 5.3 + uSeed * 1.7), h21(gl_FragCoord.xy * 1.3 + fk * 3.9)) - 0.5;
    vec3 nf = normalize(n + rnd * 0.34);
    vec3 d = refract(rd, nf, 1.0 / 1.5);
    vec3 q = p - n * 0.01; float liq = 0.0; float pip = 0.0;
    float st = 0.05;
    q += d * st * jit;
    for (int i = 0; i < 24; i++) {
      q += d * st;
      if (dGlass(q) > 0.0) break;
      if (dLiq(q) < 0.0) liq += st;
      if (length(q.xz - vec2(0.02, 0.0)) < 0.034 && q.y > 0.14 && q.y < 1.45) pip += st;
    }
    vec3 ne = nGlass(q);
    vec3 o = refract(d, -normalize(ne + rnd.zxy * 0.3), 1.5);
    if (dot(o, o) < 0.5) o = reflect(d, -ne);
    vec3 bg = waterView(q + o * 0.02, o, jit, 1.0);
    thru += bg * exp(-SERUM * liq * 0.95) * (1.0 - 0.6 * min(pip * 6.0, 1.0));
    liqSum += liq;
  }
  thru /= 3.0; liqSum /= 3.0;
  // the frost also scatters light inside the glass, so the serum glows where the sun comes through it
  vec3 L = uSun;
  float wrap = max((dot(n, L) + 0.6) / 1.6, 0.0);
  float inLiq = smoothstep(0.02, 0.2, liqSum);
  vec3 tint = mix(vec3(1.0, 0.99, 0.97), vec3(1.0, 0.4, 0.07), inLiq);
  vec3 glow = tint * (SUNC * 1.45 * wrap + vec3(0.85, 0.9, 0.97) * 0.55) * mix(0.82, 0.95, inLiq);
  float back = pow(max(dot(rd, L) * 0.5 + 0.5, 0.0), 2.0);
  glow += vec3(1.0, 0.55, 0.15) * inLiq * 0.9 * back;
  vec3 col = mix(thru, glow, 0.38) * (0.8 + 0.2 * nv) * (0.86 + 0.14 * clamp(dot(n, L) * 1.5 + 0.5, 0.0, 1.0));
  // the shadow the collar casts down the shoulder
  col *= 1.0 - 0.35 * smoothstep(1.3, 1.1, p.y) * smoothstep(0.9, 1.15, p.y) * smoothstep(0.2, -0.3, dot(n, L));
  // the water line on the glass, and contact darkening at the foot
  col *= 0.8 + 0.2 * smoothstep(WD - 0.01, WD + 0.05, p.y);
  vec3 r = reflect(rd, n);
  vec3 refl = env(normalize(r + vec3(h21(gl_FragCoord.xy + uSeed) - 0.5, 0.0, h21(gl_FragCoord.yx) - 0.5) * 0.2));
  float spec = pow(max(dot(r, L), 0.0), 26.0) * 2.4;
  float rim = pow(1.0 - nv, 3.0);
  col += vec3(1.0, 0.98, 0.95) * rim * 0.35 * (1.0 - inLiq * 0.5);
  float sheen = pow(max(dot(r, L), 0.0), 6.0);
  return col * (1.0 - F) + (refl * 0.8 + SUNC * spec) * F + SUNC * (spec * 0.15 + sheen * 0.18);
}

vec3 tone(vec3 x){ vec3 c = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)); }

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uSeed);
  float t = march(ro, rd);
  float tw = (WD - ro.y) / rd.y;
  vec3 col; float dist;
  if (t > 0.0 && t < tw) { col = shadeBottle(ro + rd * t, rd, jit); dist = t; }
  else { col = waterView(ro, rd, jit, 0.0); dist = tw; }
  col = tone(col * 0.74);
  float coc = clamp(abs(1.0 / dist - 1.0 / uFocus) * uBlur, 0.0, 1.0);
  gl_FragColor = vec4(col, coc);
}
`;

// Developing it: depth of field gathered from the circle each pixel says it spreads over, a little grain.
const POST = `
precision highp float;
uniform sampler2D uImg; uniform vec2 uRes; uniform float uMax; uniform float uGrain;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; vec2 px = 1.0 / uRes;
  vec4 c0 = texture2D(uImg, uv);
  vec3 sum = c0.rgb; float wsum = 1.0;
  for (int i = 0; i < 24; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 24.0) * uMax;
    vec4 s = texture2D(uImg, uv + vec2(cos(a), sin(a)) * r * px);
    float w = smoothstep(r - 1.0, r + 1.0, max(s.a, c0.a * 0.9) * uMax);
    sum += s.rgb * w; wsum += w;
  }
  vec3 c = sum / wsum;
  vec2 q = uv - 0.5; c *= 1.0 - 0.12 * dot(q, q);
  c += (h21(gl_FragCoord.xy + uGrain * 37.0) - 0.5) * 0.022;
  gl_FragColor = vec4(c, 1.0);
}
`;

// Camera for a frame of this size. Kept in one place so the pointer can find the water exactly where the shader draws it.
function camera(w: number, h: number) {
  const wide = w >= 900, mid = w >= 640;
  const dist = wide ? 8.0 : 8.6, el = wide ? 0.6 : 0.56;
  const tgt = [0, wide ? 0.72 : 0.78, 0];
  const cam = [0, tgt[1] + dist * Math.sin(el), -dist * Math.cos(el)];
  const foc = wide ? 2.05 : mid ? 1.6 : 1.32;
  const aspect = w / h;
  const shift = wide ? [Math.min(0.42, aspect * 0.2), -0.02] : [0, -0.23];
  return { dist, tgt, cam, foc, shift };
}

// No WebGL: the same set built from CSS and two gradients of caustic light.
function Still() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(170deg, #e6e1d6 0%, #dcd6c9 55%, #cfd2c8 100%)" }}>
      <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(ellipse 60px 22px at 20% 30%, rgba(255,255,255,0.7), transparent 70%), radial-gradient(ellipse 90px 30px at 70% 60%, rgba(255,255,255,0.6), transparent 70%), radial-gradient(ellipse 70px 26px at 40% 80%, rgba(255,255,255,0.6), transparent 70%), radial-gradient(ellipse 80px 26px at 85% 25%, rgba(255,255,255,0.6), transparent 70%)" }} />
      <div className="absolute left-1/2 top-[52%] h-[340px] w-[200px] -translate-x-1/2 lg:left-[66%] lg:top-[16%] lg:h-[420px] lg:w-[240px]">
        <div className="absolute bottom-[-8%] left-[60%] h-[40%] w-[130%] origin-bottom-left skew-x-[-40deg] rounded-full blur-md" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(214,132,40,0.55), rgba(80,70,60,0.25) 60%, transparent 75%)" }} />
        <div className="absolute left-[30%] top-0 h-[22%] w-[40%] rounded-t-[999px] rounded-b-[18px]" style={{ background: "linear-gradient(90deg, #8a4a38, #b8705a 40%, #9a5240 70%, #6e3a2c)" }} />
        <div className="absolute left-[27%] top-[20%] h-[9%] w-[46%] rounded-[6px]" style={{ background: "repeating-linear-gradient(90deg, #cdbb9a 0 3px, #f1e6cf 3px 6px)" }} />
        <div className="absolute inset-x-0 bottom-0 top-[29%] overflow-hidden rounded-[44px_44px_30px_30px]" style={{ background: "linear-gradient(90deg, rgba(240,236,228,0.95), rgba(255,253,248,0.9) 30%, rgba(236,230,220,0.92) 75%, rgba(214,208,198,0.95))", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.7)" }}>
          <div className="absolute inset-x-[7%] bottom-[7%] top-[24%] rounded-[16px_16px_28px_28px]" style={{ background: "linear-gradient(90deg, #d07a2c, #f0a24a 35%, #f6b860 55%, #c46a22)", filter: "blur(2px)", opacity: 0.85 }} />
        </div>
      </div>
    </div>
  );
}

export default function FrostedSerumDropperHero() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const api = useRef<{ drop: () => void } | null>(null);

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
    const scene = link(SCENE), post = link(POST);
    if (!scene || !post) { setShown("still"); return; }
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uTime", "uSeed", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uBlur", "uSun", "uRip"].map((n) => [n, U(scene, n)]));
    const pu = Object.fromEntries(["uImg", "uRes", "uMax", "uGrain"].map((n) => [n, U(post, n)]));
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const img = gl.createTexture(), fbo = gl.createFramebuffer();
    let W = 0, H = 0, cssW = 1, cssH = 1, scale = 1;
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.15e6 / (cssW * cssH * dpr * dpr)));
      const w = Math.max(2, Math.round(cssW * dpr * k)), h = Math.max(2, Math.round(cssH * dpr * k));
      if (w === W && h === H) return;
      W = w; H = h; cv.width = W; cv.height = H;
      gl.bindTexture(gl.TEXTURE_2D, img);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, img, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    // rings on the water: x, z, start time, strength
    const rips = new Float32Array(RIPS * 4);
    let ripAt = 0;
    const s = { t: 0, last: 0, raf: 0, visible: true, alive: true, first: true, frame: 0, slow: 0, lastRip: 0, touched: false, fpsT: 0, fpsN: 0 };
    const ring = (x: number, z: number, amp: number, at = s.t) => {
      if (Math.hypot(x, z) < 0.5) return; // the glass, not the water
      rips.set([x, z, at, amp], (ripAt % RIPS) * 4); ripAt++;
    };
    // where a point of the frame meets the water
    const toWater = (cx: number, cy: number) => {
      const c = camera(cssW, cssH);
      const u = (cx - cssW / 2) / cssH - c.shift[0], v = (cssH / 2 - cy) / cssH - c.shift[1];
      const fw = [c.tgt[0] - c.cam[0], c.tgt[1] - c.cam[1], c.tgt[2] - c.cam[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]); fw[0] /= fl; fw[1] /= fl; fw[2] /= fl;
      const rt = [fw[2], 0, -fw[0]]; const rl = Math.hypot(rt[0], rt[2]); rt[0] /= rl; rt[2] /= rl;
      const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      const d = [0, 1, 2].map((i) => fw[i] * c.foc + rt[i] * u + up[i] * v);
      if (d[1] >= -1e-3) return null;
      const t = (DEPTH - c.cam[1]) / d[1];
      return [c.cam[0] + d[0] * t, c.cam[2] + d[2] * t];
    };
    const sun = (() => { const v = [-0.42, 0.84, 0.36]; const l = Math.hypot(...v); return v.map((n) => n / l); })();

    const draw = () => {
      const c = camera(cssW, cssH);
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, W, H);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform1f(su.uTime, s.t);
      gl.uniform1f(su.uSeed, reduce ? 0.37 : (s.frame * 0.61803) % 1);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]); gl.uniform3f(su.uTgt, c.tgt[0], c.tgt[1], c.tgt[2]);
      gl.uniform1f(su.uFoc, c.foc); gl.uniform2f(su.uShift, c.shift[0], c.shift[1]);
      gl.uniform1f(su.uFocus, c.dist); gl.uniform1f(su.uBlur, 9.0);
      gl.uniform3f(su.uSun, sun[0], sun[1], sun[2]);
      gl.uniform4fv(su.uRip, rips);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(post);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, img);
      gl.uniform1i(pu.uImg, 0); gl.uniform2f(pu.uRes, W, H);
      gl.uniform1f(pu.uMax, (H / 760) * 7.0); gl.uniform1f(pu.uGrain, s.frame % 61);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible || !s.alive) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      s.last = now; s.frame++;
      s.t += Math.min(dtRaw, 0.05);
      // until someone touches the water, a drop lands now and then, as if from the pipette
      if (!s.touched && s.t - s.lastRip > 3.2) { s.lastRip = s.t; const a = Math.random() * 6.28; ring(Math.cos(a) * 1.1 - 0.2, Math.sin(a) * 0.5 - 0.6, 1.0); }
      draw();
      if (s.first) { s.first = false; setShown("gl"); }
      s.fpsN++;
      if (now - s.fpsT > 1000) { box.dataset.fps = String(Math.round((s.fpsN * 1000) / (now - s.fpsT))); s.fpsT = now; s.fpsN = 0; }
      // measured, not guessed: if frames keep running long, trace fewer pixels
      if (dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && scale > 0.45) { scale *= 0.8; s.slow = 0; size(); }
      if (!reduce) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible && s.alive) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    // it opens finished: two rings already spreading across the stone
    s.t = 2.0; s.lastRip = 1.6;
    ring(-1.15, -0.55, 1.1, 0.4); ring(1.05, -0.9, 0.9, 1.3);
    const ro = new ResizeObserver(() => { size(); if (reduce) s.first = true; wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);

    let lx = -1e3, ly = -1e3;
    const touch = (e: PointerEvent, amp: number) => {
      const r = box.getBoundingClientRect();
      const w = toWater(e.clientX - r.left, e.clientY - r.top);
      if (!w) return;
      s.touched = true; ring(w[0], w[1], amp);
      if (reduce) wake();
    };
    const move = (e: PointerEvent) => {
      if (reduce) return;
      if (Math.hypot(e.clientX - lx, e.clientY - ly) < 46 || s.t - s.lastRip < 0.14) return;
      lx = e.clientX; ly = e.clientY; s.lastRip = s.t; touch(e, 0.55);
    };
    const down = (e: PointerEvent) => { if ((e.target as HTMLElement).closest("a,button")) return; s.lastRip = s.t; touch(e, 1.25); };
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerdown", down);
    api.current = { drop: () => { s.touched = true; const a = Math.random() * 6.28; ring(Math.cos(a) * 0.95, Math.sin(a) * 0.7 - 0.3, 1.3); s.lastRip = s.t; wake(); } };
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      s.alive = false;
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerdown", down);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-[#dcd7cb] text-[#2b2119]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes frosted-serum-dropper-hero-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .frosted-serum-dropper-hero-rise { animation: frosted-serum-dropper-hero-rise 800ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .frosted-serum-dropper-hero-rise { animation: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[780px] w-full max-w-[1600px] lg:h-[760px]">
        {shown === "still" && <Still />}
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        <div className="pointer-events-none absolute inset-0 flex flex-col px-6 pb-8 pt-6 sm:px-10 lg:px-16 lg:pb-12 lg:pt-10">
          <p className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.32em] text-[#3d3026]">
            <span>{product.house}</span>
            <span className="hidden sm:inline">{product.kind}</span>
          </p>
          <div className="frosted-serum-dropper-hero-rise mt-8 max-w-[34rem] lg:mt-auto lg:mb-auto">
            <h1 className="text-[46px] leading-[0.95] tracking-[-0.03em] text-[#22190f] sm:text-[64px] lg:text-[84px]" style={{ fontFamily: SERIF }}>
              {product.headline.map((l, i) => (
                <span key={l} className={`block ${i === 1 ? "italic text-[#9a4a14]" : ""}`}>{l}</span>
              ))}
            </h1>
            <p className="mt-5 max-w-[24rem] text-[16px] leading-[1.5] text-[#3a2e24] lg:mt-7 lg:text-[18px]">{product.line}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 lg:mt-8">
              <a href="#" className="pointer-events-auto inline-flex h-[52px] items-center gap-3 whitespace-nowrap rounded-full bg-[#22190f] pl-7 pr-6 text-[15px] font-semibold tracking-[-0.01em] text-[#fbf6ec] shadow-[0_14px_30px_-14px_rgba(40,25,10,0.8)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#22190f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e2ddd2] motion-reduce:transition-none">
                {product.cta}
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              </a>
              <a href="#" className="pointer-events-auto inline-flex h-11 items-center text-[15px] font-semibold text-[#22190f] underline decoration-[#22190f]/30 underline-offset-[6px] outline-none hover:decoration-[#22190f] focus-visible:ring-2 focus-visible:ring-[#22190f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e2ddd2]">{product.more}</a>
            </div>
          </div>
          <div className="mt-auto flex items-end justify-between gap-4 lg:mt-0">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#3d3026]">{product.note}</span>
            {shown === "gl" && (
              <button type="button" onClick={() => api.current?.drop()} className="pointer-events-auto hidden h-10 items-center gap-2 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#3d3026] outline-none hover:text-[#9a4a14] focus-visible:ring-2 focus-visible:ring-[#22190f] sm:flex motion-reduce:hidden">
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2.5c2.8 3.6 4.4 6.2 4.4 8.6a4.4 4.4 0 0 1-8.8 0c0-2.4 1.6-5 4.4-8.6Z" /></svg>
                Touch the water
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
