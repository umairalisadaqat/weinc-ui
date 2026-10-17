import { useEffect, useRef, useState } from "react";

// Everything a visitor would edit first.
const piece = {
  house: "Maison Ardeline",
  kind: "The Solitaire, No. 4",
  headline: ["Light,", "kept", "in gold."],
  line: "One brilliant-cut stone held in four claws on a softly domed band of yellow gold, made to be worn every day and handed on after.",
  cta: "Choose your size",
  more: "Book a fitting",
  note: "Yellow gold, round brilliant",
};
// Materials, in linear light (0 to 1).
const GOLD = [0.98, 0.66, 0.27]; // reflectance of the metal head on; 0.95, 0.93, 0.88 gives white gold or platinum
const SILK = [0.86, 0.75, 0.66]; // the pale champagne silk
const STONE_TINT = [1.0, 0.995, 0.985]; // colour of the stone; 0.55, 0.7, 1.0 gives a pale sapphire
const IOR = [2.33, 2.42, 2.55]; // red, green and blue bend by different amounts: this spread is the fire
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Didot", "Bodoni 72", "Bodoni MT", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';

const f4 = (n: number) => n.toFixed(5);
const v3 = (c: number[]) => `vec3(${c.map(f4).join(", ")})`;

// ---- the stone: a round brilliant as 73 flat facets, generated here and written into the shader ----
const GS = 1.22; // stone size
const G = 0.19 * GS, GT = 0.006 * GS, TAB = 0.066 * GS;
const facets: number[][] = [];
(() => {
  const rad = Math.PI / 180;
  const add = (a: number, tilt: number, up: boolean, px: number, py: number) => {
    const s = Math.sin(tilt * rad), c = Math.cos(tilt * rad) * (up ? 1 : -1);
    facets.push([Math.cos(a) * s, c, Math.sin(a) * s, px * s + py * c]);
  };
  facets.push([0, 1, 0, TAB]);
  const rt = G - (TAB - GT) / Math.tan(34 * rad);
  for (let i = 0; i < 16; i++) { const a = (i * 22.5) * rad; facets.push([Math.cos(a), 0, Math.sin(a), G]); }
  for (let i = 0; i < 8; i++) {
    const a = i * 45 * rad, b = (i * 45 + 22.5) * rad;
    add(a, 34, true, G, GT); // bezel
    add(b, 21, true, rt, TAB); // star
    add(a, 40.8, false, G, -GT); // pavilion main
  }
  for (let i = 0; i < 16; i++) {
    const a = (i * 22.5 + 11.25) * rad;
    add(a, 43, true, G, GT); // upper girdle
    add(a, 43.5, false, G, -GT); // lower girdle
  }
})();
// a ray against the stone: where it enters, where it leaves, and the facet at each (planes come in as a uniform list)
const NF = facets.length;
const GEM_ISECT = `uniform vec4 uGem[${NF}];
bool gemHit(vec3 ro, vec3 rd, out float tn, out vec3 nn, out float tf, out vec3 nf){
  tn = -1e5; tf = 1e5; nn = vec3(0.0, 1.0, 0.0); nf = nn; bool ok = true;
  for (int i = 0; i < ${NF}; i++) {
    vec4 P = uGem[i]; float dn = dot(rd, P.xyz); float nm = P.w - dot(ro, P.xyz);
    if (dn < -1e-6) { float t = nm / dn; if (t > tn) { tn = t; nn = P.xyz; } }
    else if (dn > 1e-6) { float t = nm / dn; if (t < tf) { tf = t; nf = P.xyz; } }
    else if (nm < 0.0) ok = false;
  }
  return ok && tn <= tf && tf > 0.0;
}`;

const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

// The photograph: a gold solitaire standing in a fold of silk, a window of daylight behind and to the left.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec2 uJit; uniform vec2 uLens; uniform float uSeed; uniform sampler2D uHist; uniform float uBlend;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus; uniform float uAper;
uniform vec2 uYaw; uniform vec3 uSun;
const vec3 GOLD = ${v3(GOLD)}; const vec3 SILK = ${v3(SILK)}; const vec3 TINT = ${v3(STONE_TINT)}; const vec3 IOR = ${v3(IOR)};
const vec3 SUNC = vec3(1.0, 0.94, 0.85);
const float RR = 0.6; const float RH = 0.062; const float RW = 0.1;
const vec3 RC = vec3(0.0, 0.658, 0.0);
const vec3 GC = vec3(0.0, 0.83, 0.0); const float GS = ${GS.toFixed(3)};
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
vec3 toL(vec3 p){ p -= RC; return vec3(uYaw.x * p.x + uYaw.y * p.z, p.y, -uYaw.y * p.x + uYaw.x * p.z); }
vec3 dirL(vec3 v){ return vec3(uYaw.x * v.x + uYaw.y * v.z, v.y, -uYaw.y * v.x + uYaw.x * v.z); }
vec3 dirW(vec3 v){ return vec3(uYaw.x * v.x - uYaw.y * v.z, v.y, uYaw.y * v.x + uYaw.x * v.z); }
${GEM_ISECT}

// ---- the metal, in the ring's own frame: band round the z axis, stone on top ----
float capsule(vec3 p, vec3 a, vec3 b, float ra, float rb){ vec3 pa = p - a; vec3 ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - mix(ra, rb, h); }
float metal(vec3 q){
  // a comfort-fit band: domed outside, softly rounded edges, a touch heavier at the shoulders
  float sh = smoothstep(0.2, 0.62, q.y);
  vec2 b = vec2(length(q.xy) - RR - 0.008 * sh, q.z);
  vec2 e = vec2(RH + 0.01 * sh, RW - 0.02 * sh);
  vec2 d = abs(b) - e + 0.05;
  float band = min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - 0.05;
  vec3 g = (q - GC) / GS;
  if (length(g) > 0.42) return band;
  // the basket: a little collar under the stone and four claws over its edge
  float collar = length(vec2(length(g.xz) - 0.112, g.y + 0.075)) - 0.019;
  float stem = max(length(g.xz) - 0.07 + 0.25 * (g.y + 0.1), abs(g.y + 0.15) - 0.07);
  vec2 ax = abs(g.xz); vec2 dg = normalize(vec2(1.0));
  vec3 c = vec3(ax.x, g.y, ax.y);
  float claw = capsule(c, vec3(dg * 0.06, -0.15).xzy, vec3(dg * 0.165, -0.02).xzy, 0.024, 0.02);
  claw = min(claw, capsule(c, vec3(dg * 0.165, -0.02).xzy, vec3(dg * 0.181, 0.032).xzy, 0.02, 0.017));
  float s = smin(band, smin(stem, collar, 0.03) * GS, 0.04);
  return min(s, smin(claw, collar, 0.012) * GS);
}
float metalW(vec3 p){ return metal(toL(p)); }
float sphereT(vec3 ro, vec3 rd, vec3 c, float r){ vec3 oc = ro - c; float b = dot(oc, rd); float h = b * b - dot(oc, oc) + r * r; if (h < 0.0) return -1.0; h = sqrt(h); return max(-b - h, 0.0) < -b + h ? max(-b - h, 0.0) : -1.0; }
float marchMetal(vec3 ro, vec3 rd){
  float t = sphereT(ro, rd, RC + vec3(0.0, 0.1, 0.0), 0.98); if (t < 0.0) return -1.0;
  float te = t + 2.0;
  for (int i = 0; i < 96; i++) { float d = metalW(ro + rd * t); if (d < 0.0006) return t; t += d * 0.9; if (t > te) break; }
  return -1.0;
}
vec3 metalN(vec3 p){ vec2 e = vec2(0.0012, -0.0012); return normalize(e.xyy * metalW(p + e.xyy) + e.yyx * metalW(p + e.yyx) + e.yxy * metalW(p + e.yxy) + e.xxx * metalW(p + e.xxx)); }
bool gemW(vec3 ro, vec3 rd, out float t, out vec3 n){
  vec3 o = toL(ro) - GC; vec3 d = dirL(rd); float tf; vec3 nf;
  if (!gemHit(o, d, t, n, tf, nf) || t < 0.0) return false;
  n = dirW(n); return true;
}

// ---- the silk: a broad fold rising behind, slow ripples, fine grain of the weave ----
float silkH(vec2 p){
  float r = length(p);
  vec2 f = vec2(0.6, 0.8); vec2 g = vec2(0.8, -0.6);
  float u = dot(p, f); float v = dot(p, g);
  float h = 0.17 * sin(v * 1.25 + 0.7 * sin(u * 0.45) + 0.6) + 0.055 * sin(v * 2.7 - u * 0.4 + 2.0) + 0.02 * sin(v * 5.1 + u * 0.9);
  h *= smoothstep(0.55, 2.6, r);
  float z0 = 1.25 + 0.22 * sin(p.x * 0.8 + 0.5);
  h += 0.62 * exp(-pow((p.y - z0) / 0.62, 2.0)) * smoothstep(-5.0, -1.0, p.x);
  h += 0.18 * smoothstep(2.0, 7.0, p.y) * (1.0 + 0.4 * sin(p.x * 0.6));
  return h - 0.004;
}
vec3 silkN(vec2 p){ float e = 0.012; return normalize(vec3(silkH(p - vec2(e, 0.0)) - silkH(p + vec2(e, 0.0)), 2.0 * e, silkH(p - vec2(0.0, e)) - silkH(p + vec2(0.0, e)))); }
float marchSilk(vec3 ro, vec3 rd){
  float top = 1.05; float t = 0.0;
  if (ro.y > top) { if (rd.y >= 0.0) return -1.0; t = (top - ro.y) / rd.y; }
  float pd = 1.0; float pt = t;
  for (int i = 0; i < 110; i++) {
    vec3 p = ro + rd * t; float d = p.y - silkH(p.xz);
    if (d < 0.0) return mix(pt, t, pd / (pd - d));
    pd = d; pt = t; t += max(d * 0.45, 0.002 + t * 0.002);
    if (t > 45.0 || (p.y > top && rd.y > 0.0)) break;
  }
  return -1.0;
}

vec3 env(vec3 d){
  // a quiet room: dim walls, darker still behind the camera, so metal and stone keep their contrast
  vec3 c = mix(vec3(0.16, 0.15, 0.145), vec3(0.42, 0.42, 0.44), smoothstep(-0.1, 0.8, d.y));
  c *= mix(0.16, 1.0, smoothstep(-0.6, 0.3, d.z));
  if (d.y < 0.0) c = mix(c, SILK * 0.55, smoothstep(0.0, -0.2, d.y));
  // the window: six panes of daylight with soft edges and thin glazing bars
  vec3 wr = normalize(cross(vec3(0.0, 1.0, 0.0), uSun)); vec3 wu = cross(uSun, wr);
  float k = dot(d, uSun);
  if (k > 0.2) {
    vec2 w = vec2(dot(d, wr), dot(d, wu)) / k;
    float win = smoothstep(0.62, 0.55, abs(w.x)) * smoothstep(0.82, 0.74, abs(w.y));
    float bars = smoothstep(0.012, 0.03, abs(w.x)) * smoothstep(0.012, 0.03, abs(abs(w.y) - 0.27)) * smoothstep(0.012, 0.03, abs(w.y + 0.0));
    c += vec3(1.0, 0.97, 0.92) * 9.0 * win * bars * (0.85 + 0.15 * w.y);
  }
  // a tall white card to camera right, a low warm bounce in front
  c += vec3(1.0) * 2.0 * smoothstep(0.05, -0.05, abs(atan(d.x, -d.z) - 1.15) - 0.2) * smoothstep(-0.05, 0.1, d.y) * smoothstep(0.7, 0.5, d.y);
  c += vec3(1.0, 0.95, 0.88) * 3.5 * smoothstep(0.03, -0.03, abs(atan(d.x, -d.z) + 0.35) - 0.06) * smoothstep(0.05, 0.15, d.y) * smoothstep(0.9, 0.75, d.y);
  c += SUNC * 80.0 * smoothstep(0.9993, 0.9998, dot(d, uSun));
  return c;
}

// soft shadow of the metal; the stone lets most light through and throws coloured fire instead
float shadowMetal(vec3 p, vec3 L){
  float t = sphereT(p, L, RC + vec3(0.0, 0.1, 0.0), 0.98); if (t < 0.0) return 1.0;
  float res = 1.0; t = max(t, 0.03);
  for (int i = 0; i < 40; i++) { float h = metalW(p + L * t); res = min(res, 14.0 * h / t); t += clamp(h, 0.006, 0.12); if (res < 0.003 || t > 4.0) break; }
  res = clamp(res, 0.0, 1.0); return res * res * (3.0 - 2.0 * res);
}
vec3 spectrum(float x){ return clamp(abs(fract(x + vec3(0.0, 0.667, 0.333)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }

vec3 shadeSilk(vec3 p, vec3 rd, bool cheap){
  vec3 n = silkN(p.xz);
  // the weave: a fine cross-grain that only shows in the sheen
  float weave = cheap ? 0.5 : n2(p.xz * vec2(160.0, 9.0)) * 0.5 + n2(p.xz * vec2(7.0, 170.0)) * 0.5;
  vec3 L = uSun; vec3 V = -rd; vec3 H = normalize(L + V);
  vec3 fd = vec3(0.6, 0.0, 0.8); vec3 T = normalize(fd - n * dot(n, fd));
  float sh = cheap ? 1.0 : shadowMetal(p + n * 0.004, L);
  float dm = cheap ? 1.0 : metalW(p);
  float wrapd = max((dot(n, L) + 0.3) / 1.3, 0.0);
  float TH = dot(T, H); float kk = pow(sqrt(max(1.0 - TH * TH, 0.0)), 90.0);
  float ao = 1.0 - 0.55 * exp(-max(dm, 0.0) * 22.0) - 0.15 * exp(-max(dm, 0.0) * 4.0);
  vec3 col = SILK * (SUNC * 1.55 * wrapd * sh + vec3(0.78, 0.82, 0.92) * 0.42 * ao * (0.6 + 0.4 * n.y));
  col += SUNC * mix(SILK, vec3(1.0), 0.35) * kk * 1.4 * sh * (0.75 + 0.5 * weave) * smoothstep(-0.1, 0.3, dot(n, L));
  col += SILK * 0.18 * pow(1.0 - max(dot(n, V), 0.0), 3.0);
  if (!cheap) {
    // warm light bounced off the gold onto the silk around it
    col += GOLD * SILK * 0.5 * exp(-max(dm, 0.0) * 9.0) * (0.4 + 0.6 * sh);
    // fire: where sunlight passes through the stone, it lands split into colour
    float tn; vec3 nn; float tf; vec3 nf;
    vec3 o = toL(p) - GC; vec3 d = dirL(L);
    if (gemHit(o, d, tn, nn, tf, nf) && tn > 0.0) {
      // a few separate points of coloured light, one chance per small cell, that move as the ring turns
      vec2 k = p.xz * 26.0 + vec2(uYaw.y * 6.0, uYaw.x * 5.0);
      vec2 cell = floor(k); vec2 fc = fract(k) - 0.5;
      float on = step(0.72, h21(cell + 7.0));
      vec2 off = vec2(h21(cell + 1.3), h21(cell + 4.1)) * 0.6 - 0.3;
      float dot1 = on * exp(-dot(fc - off, fc - off) * 260.0);
      float edge = smoothstep(0.0, 0.03, min(tf - tn, 0.2));
      col *= mix(1.0, 0.8, edge);
      col += spectrum(h21(cell + 2.7)) * dot1 * SUNC * edge * 1.6;
    }
  }
  return col;
}

vec3 shadeMetal(vec3 p, vec3 rd, float rnd){
  vec3 n = metalN(p);
  vec3 jit = vec3(h21(gl_FragCoord.xy + uSeed * 91.0), h21(gl_FragCoord.yx + uSeed * 37.0), rnd) - 0.5;
  n = normalize(n + jit * 0.003);
  vec3 r = reflect(rd, n); float nv = clamp(dot(-rd, n), 0.0, 1.0);
  vec3 F = GOLD + (1.0 - GOLD) * pow(1.0 - nv, 5.0);
  vec3 o = p + n * 0.004;
  vec3 rc;
  float tg; vec3 ng; bool g = gemW(o, r, tg, ng);
  float tm = marchMetal(o, r);
  if (g && (tm < 0.0 || tg < tm)) rc = vec3(1.4, 1.38, 1.36) * env(reflect(r, ng)) * 0.35 + 0.6 * vec3(0.9);
  else if (tm > 0.0) {
    // gold seen in gold: the inside of the band and the claws reflect each other
    vec3 q = o + r * tm; vec3 n2 = metalN(q); vec3 r2 = reflect(r, n2);
    rc = (GOLD + (1.0 - GOLD) * pow(1.0 - clamp(dot(-r, n2), 0.0, 1.0), 5.0)) * (r2.y < -0.05 ? SILK * 0.9 : env(r2)) * 0.85;
  } else if (r.y < -0.002) {
    float ts = marchSilk(o, r);
    // a grazing ray that runs out of steps still lands on the cloth, never on the sky
    if (ts < 0.0) ts = max(-o.y / r.y, 0.0);
    rc = shadeSilk(o + r * ts, r, true);
  } else rc = env(r);
  // the band sitting in the silk is darker where it meets it
  float ao = 0.55 + 0.45 * smoothstep(0.0, 0.16, p.y - silkH(p.xz));
  float sh = 0.75 + 0.25 * shadowMetal(o, uSun);
  return F * rc * ao * sh;
}

vec3 shadeGem(vec3 p, vec3 rd, vec3 nW){
  vec3 o = toL(p) - GC; vec3 d0 = dirL(rd); vec3 n = dirL(nW);
  float nv = clamp(dot(-d0, n), 0.0, 1.0);
  float F = 0.17 + 0.83 * pow(1.0 - nv, 5.0);
  vec3 col = F * env(dirW(reflect(d0, n)));
  for (int c = 0; c < 3; c++) {
    float ior = c == 0 ? IOR.x : (c == 1 ? IOR.y : IOR.z);
    vec3 d = refract(d0, n, 1.0 / ior); vec3 q = o; float thr = 1.0 - F; float acc = 0.0;
    for (int b = 0; b < 6; b++) {
      float tn; vec3 nn; float tf; vec3 nf;
      gemHit(q + d * 0.0004, d, tn, nn, tf, nf);
      q = q + d * (0.0004 + max(tf, 0.0));
      vec3 e = refract(d, -nf, ior);
      if (dot(e, e) > 0.01) {
        float ce = clamp(dot(e, nf), 0.0, 1.0); float Fe = 0.17 + 0.83 * pow(1.0 - ce, 5.0);
        vec3 ew = dirW(e);
        // light leaving through the bottom sees the gold basket
        vec3 en = env(ew);
        if (ew.y < -0.3) en = GOLD * env(reflect(ew, vec3(0.0, 1.0, 0.0))) * 0.6;
        float v = c == 0 ? en.x : (c == 1 ? en.y : en.z);
        acc += thr * (1.0 - Fe) * v; thr *= Fe;
      }
      d = reflect(d, -nf);
    }
    float tv = c == 0 ? TINT.x : (c == 1 ? TINT.y : TINT.z);
    acc = (acc + thr * 0.5) * tv;
    if (c == 0) col.x += acc; else if (c == 1) col.y += acc; else col.z += acc;
  }
  return mix(col, vec3(dot(col, vec3(0.3333))), 0.18);
}

vec3 tone(vec3 x){ vec3 c = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)); }

void main(){
  vec2 uv = (gl_FragCoord.xy + uJit - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 pd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  // a real lens: each frame looks through a different point of the aperture, all focused on the ring
  vec3 ro = uCam + (rt * uLens.x + up * uLens.y) * uAper;
  vec3 fp = uCam + pd * (uFocus / dot(pd, fw));
  vec3 rd = normalize(fp - ro);
  float rnd = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uSeed);
  float tm = marchMetal(ro, rd);
  float tg; vec3 ng; bool g = gemW(ro, rd, tg, ng);
  vec3 col;
  if (g && (tm < 0.0 || tg < tm)) col = shadeGem(ro + rd * tg, rd, ng);
  else if (tm > 0.0) col = shadeMetal(ro + rd * tm, rd, rnd);
  else {
    float ts = marchSilk(ro, rd);
    if (ts > 0.0) {
      col = shadeSilk(ro + rd * ts, rd, false);
      col = mix(col, SILK * vec3(1.08, 1.05, 1.02), 1.0 - exp(-max(ts - 6.0, 0.0) * 0.08));
    } else col = SILK * vec3(1.08, 1.05, 1.02);
  }
  col = tone(col * 0.8);
  vec3 prev = texture2D(uHist, gl_FragCoord.xy / uRes).rgb;
  gl_FragColor = vec4(mix(prev, col, uBlend), 1.0);
}
`;

// Developing it: a gentle vignette and a little grain over the gathered frames.
const POST = `
precision highp float;
uniform sampler2D uImg; uniform vec2 uRes; uniform float uGrain;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uImg, uv).rgb;
  vec2 q = uv - 0.5; c *= 1.0 - 0.16 * dot(q, q);
  c += (h21(gl_FragCoord.xy + uGrain * 37.0) - 0.5) * 0.018;
  gl_FragColor = vec4(c, 1.0);
}
`;

// Camera for a frame of this size: the ring sits right of the words on wide screens, under them on phones.
function camera(w: number, h: number) {
  const wide = w >= 900, mid = w >= 640;
  const dist = wide ? 6.1 : 6.5, el = wide ? 0.22 : 0.26;
  const tgt = [0, 0.62, 0.15];
  const cam = [0, tgt[1] + dist * Math.sin(el), -dist * Math.cos(el)];
  const foc = wide ? 2.2 : mid ? 1.9 : 1.22;
  const shift = wide ? [Math.min(0.4, (w / h) * 0.19), 0.0] : [mid ? 0.0 : -0.03, mid ? -0.2 : -0.24];
  return { dist, tgt, cam, foc, shift };
}

// No WebGL: the same still life in CSS, a gold ring with a bright stone on pale silk.
function Still() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: "radial-gradient(120% 80% at 75% 30%, #f3ebe2 0%, #e2d4c6 45%, #cdbbaa 100%)" }}>
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "linear-gradient(160deg, transparent 40%, rgba(255,255,255,0.45) 52%, transparent 62%), linear-gradient(150deg, transparent 58%, rgba(120,90,70,0.16) 70%, transparent 82%)" }} />
      <div className="absolute left-1/2 top-[58%] h-[230px] w-[200px] -translate-x-1/2 lg:left-[68%] lg:top-[30%] lg:h-[300px] lg:w-[260px]">
        <div className="absolute bottom-[-4%] left-[10%] h-[14%] w-[110%] rounded-full blur-lg" style={{ background: "radial-gradient(ellipse at 40% 50%, rgba(90,60,30,0.4), transparent 70%)" }} />
        <div className="absolute inset-x-[8%] bottom-0 top-[18%] rounded-full" style={{ border: "22px solid transparent", background: "conic-gradient(from 200deg, #7a4f12, #f6d58a, #b98228, #fff1c4, #8a5a16, #e8b852, #7a4f12) border-box", WebkitMask: "linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0)", mask: "linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0)" }} />
        <div className="absolute left-1/2 top-[2%] h-[64px] w-[64px] -translate-x-1/2 rotate-45 rounded-[10px]" style={{ background: "conic-gradient(from 10deg, #ffffff, #cfe3ff, #fff6e0, #9fb8d8, #ffffff, #ffe0f0, #dde8f5, #ffffff)", boxShadow: "0 0 0 3px #d9a840, 0 8px 18px -6px rgba(80,50,20,0.5)" }} />
      </div>
    </div>
  );
}

export default function GoldSolitaireRingHero() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const api = useRef<{ nudge: (d: number) => void } | null>(null);

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
    const su = Object.fromEntries(["uRes", "uJit", "uLens", "uSeed", "uHist", "uBlend", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uAper", "uYaw", "uSun", "uGem"].map((n) => [n, U(scene, n)]));
    const pu = Object.fromEntries(["uImg", "uRes", "uGrain"].map((n) => [n, U(post, n)]));
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // two images that take turns: last frame's gathered picture, and this frame's
    const tex = [gl.createTexture(), gl.createTexture()], fbo = [gl.createFramebuffer(), gl.createFramebuffer()];
    let W = 0, H = 0, cssW = 1, cssH = 1, scale = 1, cur = 0;
    const s = { t: 0, last: 0, raf: 0, visible: true, alive: true, first: true, frame: 0, n: 0, slow: 0, fpsT: 0, fpsN: 0, yaw: 0.72, vel: 0, aim: 0.72, idle: true, lastMove: -10, still: 0 };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.1e6 / (cssW * cssH * dpr * dpr)));
      const w = Math.max(2, Math.round(cssW * dpr * k)), h = Math.max(2, Math.round(cssH * dpr * k));
      if (w === W && h === H) return;
      W = w; H = h; cv.width = W; cv.height = H; s.n = 0;
      for (let i = 0; i < 2; i++) {
        gl.bindTexture(gl.TEXTURE_2D, tex[i]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[i]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex[i], 0);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    const gemPlanes = new Float32Array(facets.flat());
    const sun = (() => { const v = [-0.48, 0.8, 0.36]; const l = Math.hypot(...v); return v.map((n) => n / l); })();

    // a well spread set of sub-pixel and lens offsets, so a few frames already look supersampled
    const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
    const draw = (blend: number) => {
      const c = camera(cssW, cssH);
      const i = s.frame + 1;
      const jx = halton(i % 64, 2) - 0.5, jy = halton(i % 64, 3) - 0.5;
      const la = halton(i % 97, 5) * Math.PI * 2, lr = Math.sqrt(halton(i % 97, 7));
      const nxt = 1 - cur;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[nxt]);
      gl.viewport(0, 0, W, H);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
      gl.uniform1i(su.uHist, 0);
      gl.uniform1f(su.uBlend, blend);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform2f(su.uJit, jx, jy);
      gl.uniform2f(su.uLens, Math.cos(la) * lr, Math.sin(la) * lr);
      gl.uniform1f(su.uSeed, reduce ? (s.n * 0.618) % 1 : (s.frame * 0.61803) % 1);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]); gl.uniform3f(su.uTgt, c.tgt[0], c.tgt[1], c.tgt[2]);
      gl.uniform1f(su.uFoc, c.foc); gl.uniform2f(su.uShift, c.shift[0], c.shift[1]);
      gl.uniform1f(su.uFocus, c.dist); gl.uniform1f(su.uAper, 0.09);
      gl.uniform2f(su.uYaw, Math.cos(s.yaw), Math.sin(s.yaw));
      gl.uniform3f(su.uSun, sun[0], sun[1], sun[2]);
      gl.uniform4fv(su.uGem, gemPlanes);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      cur = nxt;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.useProgram(post);
      gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
      gl.uniform1i(pu.uImg, 0); gl.uniform2f(pu.uRes, W, H);
      gl.uniform1f(pu.uGrain, s.frame % 61);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible || !s.alive) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      s.last = now; s.frame++;
      const dt = Math.min(dtRaw, 0.05);
      s.t += dt;
      // with nobody steering, the ring rocks slowly so the stone keeps finding the window
      if (s.t - s.lastMove > 2.5 && s.t > 3.6) s.aim = 0.72 + 0.55 * Math.sin((s.t - 3.6) * 0.3);
      // a heavy, well-damped spring: it leans into the turn and settles without a wobble
      const before = s.yaw;
      s.vel += ((s.aim - s.yaw) * 7.0 - s.vel * 4.6) * dt;
      s.yaw += s.vel * dt;
      const moved = Math.abs(s.yaw - before);
      // gather frames: fresh after a jump, many deep when the ring is nearly still
      // moving: mostly this frame, so nothing smears; still: keep gathering for clean edges
      s.n = moved > 0.0004 ? 1 : s.n + 1;
      const blend = moved > 0.0004 ? Math.min(1, 0.45 + moved * 120) : Math.max(1 / (s.n + 1), 0.035);
      draw(blend);
      if (s.first) { s.first = false; setShown("gl"); }
      s.fpsN++;
      if (now - s.fpsT > 1000) { box.dataset.fps = String(Math.round((s.fpsN * 1000) / (now - s.fpsT))); s.fpsT = now; s.fpsN = 0; }
      // measured, not guessed: if frames keep running long, trace fewer pixels
      if (dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && scale > 0.45) { scale *= 0.8; s.slow = 0; size(); }
      // reduced motion: gather a still, then stop
      if (reduce && s.n > 40 && Math.abs(s.vel) < 1e-3) return;
      s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible && s.alive) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);

    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      s.aim = 0.72 + x * 1.6; s.lastMove = s.t;
      if (reduce) { s.yaw = s.aim; s.vel = 0; s.n = 0; }
      wake();
    };
    box.addEventListener("pointermove", move);
    api.current = { nudge: (d) => { s.aim += d; s.lastMove = s.t + 3; if (reduce) { s.yaw = s.aim; s.vel = 0; s.n = 0; } wake(); } };
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      s.alive = false;
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const turn = "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#2a1d12]/25 text-[#2a1d12] outline-none transition-colors hover:bg-[#2a1d12] hover:text-[#f7efe4] focus-visible:ring-2 focus-visible:ring-[#2a1d12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9dfd3] motion-reduce:transition-none";
  return (
    <section className="relative isolate overflow-hidden bg-[#ded1c3] text-[#2a1d12]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes gold-solitaire-ring-hero-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .gold-solitaire-ring-hero-rise { animation: gold-solitaire-ring-hero-rise 900ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .gold-solitaire-ring-hero-rise { animation: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[860px] w-full max-w-[1600px] sm:h-[800px] lg:h-[760px]">
        {shown === "still" && <Still />}
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        <div className="pointer-events-none absolute inset-0 flex flex-col px-6 pb-8 pt-6 sm:px-10 lg:px-16 lg:pb-12 lg:pt-10">
          <p className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.34em] text-[#3b2a1c]">
            <span>{piece.house}</span>
            <span className="hidden sm:inline">{piece.kind}</span>
          </p>
          <div className="gold-solitaire-ring-hero-rise mt-8 max-w-[36rem] lg:my-auto">
            <h1 className="text-[56px] font-normal leading-[0.9] tracking-[-0.035em] text-[#24170c] sm:text-[76px] lg:text-[104px]" style={{ fontFamily: SERIF }}>
              {piece.headline.map((l, i) => (
                <span key={l} className={`block ${i === 1 ? "italic text-[#8a5a1c]" : ""}`}>{l}</span>
              ))}
            </h1>
            <p className="mt-5 max-w-[25rem] text-[16px] leading-[1.55] text-[#3b2a1c] lg:mt-7 lg:text-[17px]">{piece.line}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 lg:mt-8">
              <a href="#" className="pointer-events-auto inline-flex h-[52px] items-center gap-3 whitespace-nowrap rounded-full bg-[#24170c] pl-7 pr-6 text-[15px] font-semibold tracking-[-0.01em] text-[#f9f1e6] shadow-[0_14px_30px_-14px_rgba(40,22,8,0.8)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#24170c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9dfd3] motion-reduce:transition-none">
                {piece.cta}
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              </a>
              <a href="#" className="pointer-events-auto inline-flex h-11 items-center text-[15px] font-semibold text-[#24170c] underline decoration-[#24170c]/30 underline-offset-[6px] outline-none hover:decoration-[#24170c] focus-visible:ring-2 focus-visible:ring-[#24170c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9dfd3]">{piece.more}</a>
            </div>
          </div>
          <div className="mt-auto flex items-end justify-between gap-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#3b2a1c]">{piece.note}</span>
            {shown === "gl" && (
              <div className="flex items-center gap-2" role="group" aria-label="Turn the ring">
                <button type="button" aria-label="Turn the ring left" onClick={() => api.current?.nudge(-0.45)} className={turn}>
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12.5 4.5 7 10l5.5 5.5" /></svg>
                </button>
                <button type="button" aria-label="Turn the ring right" onClick={() => api.current?.nudge(0.45)} className={turn}>
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 4.5 13 10l-5.5 5.5" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
