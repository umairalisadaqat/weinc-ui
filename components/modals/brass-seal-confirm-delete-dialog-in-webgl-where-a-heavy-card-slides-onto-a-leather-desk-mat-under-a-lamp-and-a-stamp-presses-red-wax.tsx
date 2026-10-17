import { useEffect, useRef, useState } from "react";

// Every word printed on the card. Nothing is deleted: confirming only plays the seal.
const card = {
  trigger: "Delete this ledger",
  eyebrow: "Archive / Folio 7",
  title: "Delete the Harbour Street ledger?",
  body: "Every page filed under it goes with it, and there is no drawer to fetch it back from.",
  seal: "Seal here",
  cancel: "Keep it",
  confirm: "Seal and delete",
  done: "Sealed. This is a demo, so nothing was deleted.",
  kept: "Kept. The ledger stays on file.",
};
const WAX: [number, number, number] = [0.19, 0.006, 0.008]; // the wax, linear RGB
const PAPER: [number, number, number] = [0.8, 0.745, 0.63]; // the card stock, linear RGB
const LEATHER: [number, number, number] = [0.026, 0.0125, 0.0085]; // the desk mat, linear RGB
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const U = 200; // css pixels to one card unit, for the layer of real elements
const CT = 0.011; // half the thickness of the card
const SC = 1.55; // size of the seal

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const TONE = `
vec3 curve(vec3 x){ return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 tone(vec3 x){ x *= 1.05; float m = max(max(x.r, x.g), max(x.b, 1e-4)); vec3 h = x * (curve(vec3(m)).r / m); return pow(mix(curve(x), h, 0.5), vec3(1.0 / 2.2)); }
`;

const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uDirect;
uniform vec3 uCam; uniform vec3 uFw; uniform vec3 uRt; uniform vec3 uUp; uniform float uFoc; uniform vec2 uShift; uniform float uFocusD;
uniform vec3 uCard; uniform vec2 uHalf; uniform vec2 uSeal; uniform float uWax; uniform float uWaxOn; uniform float uCardOn;
uniform vec3 uStamp; uniform mat3 uSRot; uniform vec4 uMat; uniform vec4 uHov;
uniform vec3 uWaxC; uniform vec3 uPaper; uniform vec3 uLeather;
uniform sampler2D uLab;
const float CT = ${CT}; const float SC = ${SC};
const vec3 LAMP = vec3(-3.4, 5.6, -3.2);
const vec3 LAMPC = vec3(1.0, 0.78, 0.52);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float cells(vec2 x){ vec2 i = floor(x), f = fract(x); float m = 1.0;
  for (int y = -1; y <= 1; y++) for (int k = -1; k <= 1; k++) { vec2 g = vec2(float(k), float(y)); vec2 o = vec2(h21(i + g), h21(i + g + 17.31)); vec2 r = g + o * 0.85 - f; m = min(m, dot(r, r)); }
  return sqrt(m); }
vec2 ry(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c * v.x + s * v.y, -s * v.x + c * v.y); }
float sdRR(vec2 p, vec2 h, float r){ vec2 d = abs(p) - h + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r; }
float sdCyl(vec3 p, float ra, float h, float rb){ vec2 d = vec2(length(p.xz) - ra + rb, abs(p.y) - h + rb); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rb; }
float sdEll(vec3 p, vec3 r){ float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / max(k1, 1e-5); }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
vec3 cardLocal(vec3 p){ vec3 q = p - vec3(uCard.x, CT, uCard.y); q.xz = ry(q.xz, -uCard.z); return q; }
float sdCard(vec3 p){
  if (uCardOn < 0.5) return 1e3;
  vec3 q = cardLocal(p);
  vec2 w = vec2(sdRR(q.xz, uHalf - 0.004, 0.05), abs(q.y) - CT + 0.004);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.004;
}
// what the brass face leaves behind: a rim, a ring of beads and a saltire
float motif(vec2 u){
  float r = length(u);
  float ring = 1.0 - smoothstep(0.035, 0.055, abs(r - 0.86));
  float d1 = abs(u.x - u.y) * 0.7071, d2 = abs(u.x + u.y) * 0.7071;
  float x = (1.0 - smoothstep(0.055, 0.085, min(d1, d2))) * smoothstep(0.56, 0.5, r);
  float a = atan(u.y, u.x); float fa = fract(a / 6.28318 * 18.0) - 0.5;
  float bead = 1.0 - smoothstep(0.03, 0.05, length(vec2(fa * 6.28318 / 18.0 * 0.7, r - 0.7)));
  return max(ring, max(x, bead));
}
float sdWax(vec3 p){
  if (uWaxOn < 0.5 || uCardOn < 0.5) return 1e3;
  vec3 q = cardLocal(p);
  vec3 w = vec3(q.x - uSeal.x, q.y - CT, q.z - uSeal.y);
  if (length(w) > 0.9) return length(w) - 0.3;
  float k = uWax;
  float a = atan(w.z, w.x);
  float wob = 1.0 + 0.05 * sin(3.0 * a + 1.3) + 0.035 * sin(5.0 * a + 0.4) + 0.02 * k * sin(9.0 * a + 2.0);
  float R = mix(0.15, 0.24, k) * wob;
  float dome = sdEll(w - vec3(0.0, -0.01, 0.0), vec3(R * 0.95, 0.082, R * 0.95));
  float disc = sdCyl(w - vec3(0.0, 0.012, 0.0), R, 0.023, 0.017);
  float d = mix(dome, disc, smoothstep(0.0, 0.75, k));
  float r = length(w.xz);
  float tw = smoothstep(0.004, 0.024, w.y);
  float field = smoothstep(0.176, 0.163, r);
  float depth = 0.0085 * smoothstep(0.5, 1.0, k);
  d += depth * field * (1.0 - motif(w.xz / 0.168)) * tw;
  // the wax squeezed out from under the face rolls up into a lip
  d -= 0.006 * k * smoothstep(0.165, 0.19, r) * smoothstep(R, R - 0.05, r) * tw;
  return d * 0.8;
}
// the seal: a brass face and collar, a turned neck, a brass ferrule and an ebony handle
vec2 sdStamp(vec3 p){
  vec3 s = uSRot * (p - uStamp) / SC;
  float bs = length(s - vec3(0.0, 0.45, 0.0)); if (bs > 1.6) return vec2((bs - 0.62) * SC, 4.0);
  float base = sdCyl(s - vec3(0.0, 0.035, 0.0), 0.135, 0.035, 0.009);
  base = max(base, -(sdCyl(s - vec3(0.0, 0.058, 0.0), 0.15, 0.004, 0.002)));
  float collar = sdCyl(s - vec3(0.0, 0.094, 0.0), 0.1, 0.026, 0.008);
  float t = clamp((s.y - 0.12) / 0.3, 0.0, 1.0);
  float rr = mix(0.068, 0.05, t) + 0.008 * sin(t * 3.14159);
  float neck = max(length(s.xz) - rr, abs(s.y - 0.27) - 0.16);
  float brass = smin(min(base, collar), neck, 0.02);
  brass = min(brass, sdCyl(s - vec3(0.0, 0.455, 0.0), 0.064, 0.03, 0.01));
  float wood = sdEll(s - vec3(0.0, 0.66, 0.0), vec3(0.118, 0.205, 0.118));
  wood = smin(wood, max(length(s.xz) - 0.05, abs(s.y - 0.5) - 0.04), 0.03);
  return brass < wood ? vec2(brass * SC, 4.0) : vec2(wood * SC, 5.0);
}
vec2 map(vec3 p){
  vec2 r = vec2(sdCard(p), 2.0);
  float w = sdWax(p); if (w < r.x) r = vec2(w, 3.0);
  vec2 s = sdStamp(p); if (s.x < r.x) r = s;
  return r;
}
vec3 nrm(vec3 p){
  vec2 e = vec2(0.0007, -0.0007);
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}
float shadow(vec3 ro, vec3 rd){
  float res = 1.0, t = 0.01, ph = 1e10;
  for (int i = 0; i < 72; i++) {
    vec3 p = ro + rd * t; if (p.y > 2.4) break;
    float h = map(p).x;
    float y = h * h / (2.0 * ph); float d = sqrt(max(h * h - y * y, 0.0));
    res = min(res, 7.0 * d / max(1e-4, t - y)); ph = h;
    t += clamp(h, 0.004, 0.09); if (res < 0.002) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}
float occ(vec3 p, vec3 n){
  float o = 0.0, s = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.015 + 0.05 * float(i); o += (h - map(p + n * h).x) * s; s *= 0.62; }
  return clamp(1.0 - 2.3 * o, 0.0, 1.0);
}
float lbox(vec3 rd, vec3 n, vec2 hs, float soft){
  float dn = dot(rd, n); if (dn < 0.05) return 0.0;
  vec3 u = normalize(cross(vec3(0.0, 1.0, 0.0), n)); vec3 v = cross(n, u);
  vec2 q = vec2(dot(rd, u), dot(rd, v)) / dn; vec2 d = abs(q) - hs;
  return smoothstep(soft, -soft, length(max(d, 0.0)) + min(max(d.x, d.y), 0.0));
}
// the study around the desk: dark panelling, the lamp's bulb and the inside of its shade, a tall window far to the right
vec3 env(vec3 rd){
  vec3 c = mix(vec3(0.03, 0.017, 0.011), vec3(0.05, 0.04, 0.035), smoothstep(-0.3, 0.6, rd.y));
  vec3 l = normalize(LAMP);
  float d = dot(rd, l);
  c += LAMPC * 60.0 * smoothstep(0.9975, 0.9992, d);
  c += LAMPC * vec3(1.0, 0.8, 0.55) * 1.6 * smoothstep(0.985, 0.996, d) * step(d, 0.9975);
  c += vec3(0.55, 0.64, 0.8) * 1.4 * lbox(rd, normalize(vec3(0.95, 0.42, 0.1)), vec2(0.28, 0.5), 0.08);
  c += vec3(0.95, 0.85, 0.7) * 0.5 * lbox(rd, normalize(vec3(-0.2, 0.9, 0.5)), vec2(0.6, 0.25), 0.3);
  return c;
}
vec3 lampAt(vec3 p, out vec3 L){
  vec3 dv = LAMP - p; float d2 = dot(dv, dv); L = dv * inversesqrt(d2);
  float cone = dot(-L, normalize(vec3(0.1, -0.1, 0.25) - LAMP));
  return LAMPC * 100.0 / d2 * mix(0.05, 1.0, smoothstep(0.9, 0.995, cone));
}
// how much the card shades the leather right beside it, light that never reaches under a heavy board
float cardNear(vec3 p){
  if (uCardOn < 0.5) return 1.0;
  vec3 q = cardLocal(p);
  float d = sdRR(q.xz, uHalf, 0.05);
  return 1.0 - 0.55 * exp(-max(d, 0.0) / 0.035);
}
vec3 shadeDesk(vec3 p, vec3 rd){
  vec2 m = p.xz - uMat.xy;
  float e = sdRR(m, uMat.zw, 0.22);
  vec3 L; vec3 li = lampAt(p, L);
  vec3 n = vec3(0.0, 1.0, 0.0);
  vec3 alb; float sp, gl;
  if (e < 0.0) {
    // pebbled leather: puffy cells with creases between them, a little lighter where it has been rubbed
    float c0 = cells(p.xz * 30.0);
    float cx = cells((p.xz + vec2(0.003, 0.0)) * 30.0), cz = cells((p.xz + vec2(0.0, 0.003)) * 30.0);
    n = normalize(vec3(-(cx - c0) * 0.55, 1.0, -(cz - c0) * 0.55));
    float rub = n2(p.xz * 1.3) * 0.6 + 0.4 * n2(p.xz * 5.0);
    alb = uLeather * (0.75 + 0.5 * rub) * mix(0.55, 1.0, smoothstep(0.0, 0.5, c0));
    // the rolled edge of the mat, and its stitching
    float bev = smoothstep(-0.07, 0.0, e);
    vec2 g = vec2(sdRR(m + vec2(0.01, 0.0), uMat.zw, 0.22) - e, sdRR(m + vec2(0.0, 0.01), uMat.zw, 0.22) - e) / 0.01;
    n = normalize(n + vec3(g.x, 0.0, g.y) * bev * 1.4);
    float st = abs(e + 0.12);
    float dash = step(0.38, fract((p.x + p.z) * 11.0));
    alb = mix(alb, vec3(0.2, 0.12, 0.06), (1.0 - smoothstep(0.006, 0.011, st)) * dash);
    alb *= 1.0 - 0.45 * (1.0 - smoothstep(0.0, 0.016, st)) * (1.0 - dash);
    sp = 0.22; gl = 14.0;
  } else {
    // walnut beyond the mat, close grained, waxed
    float gr = n2(vec2(p.x * 0.9, p.z * 14.0 + n2(p.xz * 1.7) * 6.0));
    alb = mix(vec3(0.07, 0.033, 0.015), vec3(0.15, 0.075, 0.034), gr) * (0.9 + 0.2 * n2(p.xz * 40.0));
    alb *= mix(0.35, 1.0, smoothstep(0.0, 0.09, e));
    sp = 0.35; gl = 70.0;
  }
  float sh = shadow(p + vec3(0.0, 0.002, 0.0), L);
  float ao = occ(p, vec3(0.0, 1.0, 0.0)) * cardNear(p);
  sh *= mix(1.0, cardNear(p), 0.6);
  vec3 h = normalize(L - rd);
  float f = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 col = alb * li * max(dot(n, L), 0.0) * sh;
  col += li * sp * pow(max(dot(n, h), 0.0), gl) * sh * (0.3 + f);
  col += alb * vec3(0.05, 0.045, 0.05) * ao + env(reflect(rd, n)) * f * 0.18 * ao;
  return col;
}
vec3 shadeCard(vec3 p, vec3 n, vec3 rd){
  vec3 q = cardLocal(p);
  vec3 nl = n; nl.xz = ry(n.xz, -uCard.z);
  vec3 L; vec3 li = lampAt(p, L);
  vec3 alb = uPaper * (0.93 + 0.1 * n2(q.xz * 260.0) + 0.05 * n2(q.xz * 37.0));
  float spec = 0.03, gl = 10.0;
  if (nl.y > 0.85) {
    vec2 uv = vec2((q.x + uHalf.x) / (2.0 * uHalf.x), (q.z + uHalf.y) / (2.0 * uHalf.y));
    vec3 lb = texture2D(uLab, uv, -0.6).rgb;
    // letterpress: the ink sits at the bottom of a shallow bite into the stock
    vec2 dx = vec2(1.0 / 2048.0, 0.0), dz = vec2(0.0, 1.0 / 1400.0);
    float hx = dot(texture2D(uLab, uv + dx * 1.5, 0.0).rgb - texture2D(uLab, uv - dx * 1.5, 0.0).rgb, vec3(1.0, 0.8, 0.0));
    float hz = dot(texture2D(uLab, uv + dz * 1.5, 0.0).rgb - texture2D(uLab, uv - dz * 1.5, 0.0).rgb, vec3(1.0, 0.8, 0.0));
    nl = normalize(vec3(hx * 0.22, 1.0, hz * 0.22));
    // a control under the pointer or the focus ring is breathed on by the lamp
    float hp = sdRR(q.xz - uHov.xy, uHov.zw, min(uHov.z, uHov.w));
    alb *= 1.0 + 0.1 * uHov.w * step(0.001, uHov.z) * smoothstep(0.02, -0.01, hp);
    vec3 ink = vec3(0.009, 0.008, 0.01) * (0.9 + 0.2 * n2(q.xz * 400.0));
    vec3 red = uWaxC * 1.25 * (0.88 + 0.24 * n2(q.xz * 300.0));
    alb = mix(alb, vec3(0.34, 0.3, 0.25), lb.b * 0.85);
    alb = mix(alb, red, lb.g);
    alb = mix(alb, ink, lb.r);
    spec += 0.07 * max(lb.r, lb.g); gl = mix(10.0, 50.0, max(lb.r, lb.g));
    // the corners of a heavy card are a touch soiled by fingers
    float cn = sdRR(q.xz, uHalf, 0.05);
    alb *= 1.0 - 0.06 * smoothstep(-0.25, 0.0, cn);
  } else {
    // the cut edge: layers of the board pressed together
    alb *= 0.72 + 0.12 * sin(q.y * 1400.0);
  }
  n = nl; n.xz = ry(nl.xz, uCard.z);
  float sh = shadow(p + n * 0.003, L);
  float ao = occ(p, n);
  float dif = max(dot(n, L), 0.0);
  vec3 h = normalize(L - rd);
  vec3 col = alb * li * dif * sh;
  // light that soaks into the stock and comes back out a little warmer
  col += alb * li * vec3(1.0, 0.75, 0.5) * 0.05 * sh;
  col += li * spec * pow(max(dot(n, h), 0.0), gl) * sh;
  col += alb * vec3(0.045, 0.043, 0.05) * ao;
  return col;
}
vec3 shadeWax(vec3 p, vec3 n, vec3 rd){
  vec3 L; vec3 li = lampAt(p, L);
  vec3 q = cardLocal(p);
  vec2 w = q.xz - uSeal;
  float r = length(w);
  float sh = shadow(p + n * 0.004, L);
  float ao = occ(p, n);
  float pressed = smoothstep(0.5, 1.0, uWax) * smoothstep(0.18, 0.16, r);
  vec3 alb = uWaxC * (0.9 + 0.2 * n2(w * 40.0));
  float dif = max(dot(n, L), 0.0);
  vec3 col = alb * li * dif * sh;
  // wax is translucent: the lamp glows through the thin edges and the body stays a deep, lit red
  float thin = smoothstep(0.05, 0.0, q.y - CT);
  col += uWaxC * vec3(1.5, 0.3, 0.18) * li * (0.08 + 0.3 * thin) * (0.4 + 0.6 * sh) * (0.5 + 0.5 * dot(n, L));
  col += alb * vec3(0.08, 0.06, 0.06) * ao;
  float f = 0.035 + 0.965 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  float gloss = mix(160.0, 30.0, pressed);
  vec3 h = normalize(L - rd);
  col += li * mix(1.1, 0.35, pressed) * pow(max(dot(n, h), 0.0), gloss) * sh;
  // a shallow pool of colour where the body is thickest
  col *= mix(1.0, 0.7, smoothstep(0.02, 0.07, q.y - CT) * (1.0 - pressed));
  col += env(reflect(rd, n)) * f * mix(0.9, 0.35, pressed) * ao;
  return col;
}
vec3 shadeStamp(vec3 p, vec3 n, vec3 rd, float id){
  vec3 L; vec3 li = lampAt(p, L);
  vec3 s = uSRot * (p - uStamp) / SC;
  vec3 sn = uSRot * n;
  float sh = shadow(p + n * 0.004, L);
  float ao = occ(p, n);
  vec3 h = normalize(L - rd);
  vec3 r = reflect(rd, n);
  if (id < 4.5) {
    // brass, turned on a lathe: fine rings around the axis, darker where hands never reach
    float rings = n2(vec2(s.y * 900.0, 0.5)) - 0.5;
    vec3 nn = normalize(n + (uSRot * vec3(0.0, 1.0, 0.0)) * rings * 0.07 * (1.0 - abs(sn.y)));
    vec3 f0 = vec3(0.95, 0.7, 0.34) * mix(0.62, 1.0, smoothstep(0.0, 0.2, s.y));
    float fr = pow(1.0 - clamp(dot(-rd, nn), 0.0, 1.0), 5.0);
    vec3 F = f0 + (1.0 - f0) * fr;
    vec3 col = F * env(reflect(rd, nn)) * (0.5 + 0.5 * ao);
    col += F * li * (1.6 * pow(max(dot(nn, h), 0.0), 90.0) + 0.12 * pow(max(dot(nn, h), 0.0), 8.0)) * sh;
    return col;
  }
  vec3 alb = vec3(0.016, 0.011, 0.009) * (0.8 + 0.4 * n2(vec2(s.y * 60.0, atan(s.z, s.x) * 3.0)));
  float f = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 col = alb * li * max(dot(n, L), 0.0) * sh + alb * 0.2 * ao;
  col += li * 0.9 * pow(max(dot(n, h), 0.0), 120.0) * sh + env(r) * f * ao;
  return col;
}
void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 rd0 = normalize(uFw * uFoc + uRt * uv.x + uUp * uv.y);
  vec3 fp = uCam + rd0 * (uFocusD / dot(rd0, uFw));
  vec3 ro = uCam + uRt * uJit.z + uUp * uJit.w;
  vec3 rd = normalize(fp - ro);
  float tFloor = -ro.y / rd.y;
  float t = max(0.0, (2.1 - ro.y) / rd.y);
  vec2 hit = vec2(-1.0);
  for (int i = 0; i < 120; i++) {
    vec3 p = ro + rd * t;
    vec2 d = map(p);
    if (d.x < 0.0004) { hit = vec2(t, d.y); break; }
    t += d.x * 0.92;
    if (t > tFloor) break;
  }
  vec3 col;
  if (hit.x > 0.0) {
    vec3 p = ro + rd * hit.x; vec3 n = nrm(p);
    if (hit.y < 2.5) col = shadeCard(p, n, rd);
    else if (hit.y < 3.5) col = shadeWax(p, n, rd);
    else col = shadeStamp(p, n, rd, hit.y);
  } else {
    col = shadeDesk(ro + rd * tFloor, rd);
  }
  col = min(col, vec3(30.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

const POST = `
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uAcc, uv).rgb;
  vec3 b = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 16.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.025 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.4, 0.0), vec3(8.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.008;
  vec2 q = (uv - vec2(0.42, 0.6)) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.42 * smoothstep(0.35, 1.25, length(q));
  c = tone(c);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.022;
  outC = vec4(c, 1.0);
}
`;

type Box = { x: number; y: number; w: number; h: number }; // card units from the card's top left corner
type Plan = { hx: number; hz: number; eyebrow: Box; title: Box; body: Box; cancel: Box; confirm: Box; seal: { x: number; y: number; r: number }; titleSize: number; bodySize: number; titleLines: string[]; bodyLines: string[] };
type V3 = [number, number, number];

function planFor(hx: number, hz: number, measure: (text: string, font: string) => number): Plan {
  const tall = hz > hx;
  const pad = tall ? 0.19 : 0.24;
  const W = 2 * hx, inner = W - 2 * pad;
  const seal = { x: W - pad - 0.27, y: pad + 0.27, r: 0.27 };
  const wrap = (text: string, font: string, max: number) => {
    const out: string[] = []; let line = "";
    for (const w of text.split(" ")) { const t = line ? `${line} ${w}` : w; if (line && measure(t, font) > max) { out.push(line); line = w; } else line = t; }
    out.push(line); return out;
  };
  const titleMax = tall ? inner : inner - 0.72;
  let titleSize = tall ? 0.235 : 0.235, titleLines: string[] = [];
  for (; titleSize > 0.1; titleSize -= 0.004) {
    titleLines = wrap(card.title, `600 ${titleSize}px ${SERIF}`, titleMax);
    if (titleLines.length <= (tall ? 3 : 2)) break;
  }
  const bodySize = tall ? 0.095 : 0.08;
  const bodyMax = Math.min(tall ? inner : inner - 0.72, 1.85);
  const bodyLines = wrap(card.body, `500 ${bodySize}px ${FONT}`, bodyMax);
  const eyebrow = { x: pad, y: pad, w: tall ? inner - 0.6 : inner - 0.8, h: 0.06 };
  const titleTop = tall ? seal.y + seal.r + 0.12 : pad + 0.2;
  const titleH = titleLines.length * titleSize * 1.06;
  const bodyTop = titleTop + titleH + 0.08;
  const bodyH = bodyLines.length * bodySize * 1.5;
  const bh = tall ? 0.24 : 0.2, gap = 0.08;
  const bf = `600 ${tall ? 0.078 : 0.07}px ${FONT}`;
  const by = 2 * hz - pad - bh;
  let cw = measure(card.confirm, bf) + 0.32, kw = measure(card.cancel, bf) + 0.32;
  if (tall) { cw = (inner - gap) * 0.56; kw = inner - gap - cw; }
  const confirm = { x: W - pad - cw, y: by, w: cw, h: bh };
  const cancel = { x: confirm.x - gap - kw, y: by, w: kw, h: bh };
  return { hx, hz, titleSize, bodySize, titleLines, bodyLines, eyebrow, title: { x: pad, y: titleTop, w: titleMax, h: titleH }, body: { x: pad, y: bodyTop, w: bodyMax, h: bodyH }, cancel, confirm, seal };
}

export default function BrassSealConfirmDeleteDialog() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sheet = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(true);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [note, setNote] = useState("");
  const [sealed, setSealed] = useState(false);
  const byUser = useRef(false);
  const api = useRef<{ open: () => void; cancel: () => void; confirm: () => void; hover: (b: Box | null) => void; matrix: string } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts = { antialias: false, alpha: false, powerPreference: "high-performance" as const };
    const gl2 = cv.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? cv.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) { setShown("still"); return; }
    const canAcc = !!gl2 && (!!gl2.getExtension("EXT_color_buffer_float") || !!gl2.getExtension("EXT_color_buffer_half_float"));
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    const still = reduce || software;

    const head = gl2 ? "#version 300 es\n#define ATTR in\n" : "#define ATTR attribute\n";
    const fhead = gl2 ? "#version 300 es\n#define texture2D texture\nprecision highp float;\nout vec4 outC;\n" : "#define outC gl_FragColor\n";
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); return null; }
      return sh;
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
    const names = ["uRes", "uJit", "uSeed", "uDirect", "uCam", "uFw", "uRt", "uUp", "uFoc", "uShift", "uFocusD", "uCard", "uHalf", "uSeal", "uWax", "uWaxOn", "uCardOn", "uStamp", "uSRot", "uMat", "uHov", "uWaxC", "uPaper", "uLeather", "uLab"];
    const su = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain"].map((n) => [n, gl.getUniformLocation(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const texLab = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texLab);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;

    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1, hx = 1.55, hz = 1.0;
    let rest: V3 = [2.2, 0, -0.4], below = 6, left = -6;
    const mat = [0, 0, 20, 20];
    let pl: Plan | null = null;
    const s = {
      cx: 0, cz: 0, cyaw: 0, vx: 0, vz: 0, vyaw: 0, tx: 0, tz: 0, tyaw: 0, on: true, leaving: false,
      st: [0, 0, 0] as V3, tilt: [0, 0], tiltV: [0, 0], seq: -1, wax: 0, waxOn: true,
      hov: [0, 0, 0, 0], hovS: 0, hovB: null as Box | null, px: 0, py: 0, lx: 0, ly: 0,
      count: 0, fresh: true, frame: 0, slow: 0, visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, first: true, closeAt: 0,
    };

    // The camera looks down at the desk from above and in front, like someone sitting at it.
    const EL = 0.98, DIST = 10.5;
    const view = (lx: number, ly: number) => {
      const aspect = cssW / cssH;
      const az = lx * 0.035, el = EL + ly * 0.02;
      const tgt: V3 = [0, 0, 0];
      const cam: V3 = [tgt[0] + DIST * Math.sin(az) * Math.cos(el), DIST * Math.sin(el), tgt[2] + DIST * Math.cos(az) * Math.cos(el)];
      const n = Math.hypot(cam[0] - tgt[0], cam[1], cam[2] - tgt[2]);
      const fw: V3 = [(tgt[0] - cam[0]) / n, -cam[1] / n, (tgt[2] - cam[2]) / n];
      let rt: V3 = [-fw[2], 0, fw[0]];
      const rn = Math.hypot(rt[0], rt[2]); rt = [rt[0] / rn, 0, rt[2] / rn];
      const up: V3 = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      return { cam, fw, rt, up, foc: 1, shift: [0, 0], aspect };
    };
    type View = ReturnType<typeof view>;
    const raw = (v: View, p: number[]) => {
      const d = [p[0] - v.cam[0], p[1] - v.cam[1], p[2] - v.cam[2]];
      const z = d[0] * v.fw[0] + d[1] * v.fw[1] + d[2] * v.fw[2];
      return [(d[0] * v.rt[0] + d[1] * v.rt[1] + d[2] * v.rt[2]) / z, (d[0] * v.up[0] + d[1] * v.up[1] + d[2] * v.up[2]) / z];
    };
    let fit = { foc: 1, shift: [0, 0] };
    const framed = (lx: number, ly: number) => { const v = view(lx, ly); v.foc = fit.foc; v.shift = fit.shift; return v; };
    const project = (v: View, p: number[]) => {
      const r = raw(v, p);
      const ux = r[0] * v.foc + v.shift[0], uy = r[1] * v.foc + v.shift[1];
      return [cssW / 2 + ux * cssH, cssH / 2 - uy * cssH];
    };
    const onDesk = (v: View, ux: number, uy: number) => {
      const a = (ux - v.shift[0]) / v.foc, b = (uy - v.shift[1]) / v.foc;
      const d = [0, 1, 2].map((k) => v.fw[k] + v.rt[k] * a + v.up[k] * b);
      const t = -v.cam[1] / d[1];
      return [v.cam[0] + d[0] * t, v.cam[2] + d[2] * t];
    };
    const toWorld = (lx: number, lz: number, cx = s.cx, cz = s.cz, yaw = s.cyaw): V3 => {
      const c = Math.cos(yaw), sn = Math.sin(yaw);
      // inverse of ry(v, -yaw)
      return [cx + c * lx - sn * lz, 0, cz + sn * lx + c * lz];
    };

    const labCv = document.createElement("canvas");
    const ruler = document.createElement("canvas").getContext("2d");
    const measure = (text: string, font: string) => {
      if (!ruler) return text.length * 0.05;
      ruler.font = font.replace(/([\d.]+)px/, (_, n) => `${Number(n) * 100}px`);
      return ruler.measureText(text).width / 100;
    };
    // Printing plate: ink in red, the printed vermilion in green, the grey rules in blue.
    const paintCard = () => {
      const p = planFor(hx, hz, measure);
      const u = 2048 / (2 * hx);
      labCv.width = 2048; labCv.height = Math.round(2 * hz * u);
      const g = labCv.getContext("2d") as (CanvasRenderingContext2D & { letterSpacing?: string }) | null;
      if (!g) return p;
      g.fillStyle = "#000"; g.fillRect(0, 0, labCv.width, labCv.height);
      g.globalCompositeOperation = "lighter"; g.textBaseline = "alphabetic"; g.textAlign = "left";
      const R = "#ff0000", G = "#00ff00", B = "#0000ff";
      const pill = (b: Box) => { const r = b.h / 2; g.beginPath(); g.moveTo((b.x + r) * u, b.y * u); g.arcTo((b.x + b.w) * u, b.y * u, (b.x + b.w) * u, (b.y + b.h) * u, r * u); g.arcTo((b.x + b.w) * u, (b.y + b.h) * u, b.x * u, (b.y + b.h) * u, r * u); g.arcTo(b.x * u, (b.y + b.h) * u, b.x * u, b.y * u, r * u); g.arcTo(b.x * u, b.y * u, (b.x + b.w) * u, b.y * u, r * u); g.closePath(); };
      g.fillStyle = G; g.fillRect(p.eyebrow.x * u, (p.eyebrow.y + 0.012) * u, 0.034 * u, 0.034 * u);
      const es = hz > hx ? 0.064 : 0.05;
      g.fillStyle = R; g.letterSpacing = `${0.2 * es * u}px`; g.font = `700 ${es * u}px ${FONT}`;
      g.fillText(card.eyebrow.toUpperCase(), (p.eyebrow.x + 0.075) * u, (p.eyebrow.y + 0.046) * u);
      g.fillStyle = B; g.fillRect(p.eyebrow.x * u, (p.eyebrow.y + 0.11) * u, (p.eyebrow.w) * u, 0.006 * u);
      g.fillStyle = R; g.letterSpacing = `${-0.022 * p.titleSize * u}px`; g.font = `600 ${p.titleSize * u}px ${SERIF}`;
      p.titleLines.forEach((l, k) => g.fillText(l, p.title.x * u, (p.title.y + p.titleSize * 0.82 + k * p.titleSize * 1.06) * u));
      g.letterSpacing = "0px"; g.font = `500 ${p.bodySize * u}px ${FONT}`;
      p.bodyLines.forEach((l, k) => g.fillText(l, p.body.x * u, (p.body.y + p.bodySize * 1.0 + k * p.bodySize * 1.5) * u));
      // the place for the seal: a ring of fine dashes and two words beneath it
      g.strokeStyle = B; g.lineWidth = 0.007 * u; g.setLineDash([0.02 * u, 0.018 * u]);
      g.beginPath(); g.arc(p.seal.x * u, p.seal.y * u, p.seal.r * u, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      g.fillStyle = B; g.textAlign = "center"; g.letterSpacing = `${0.2 * 0.036 * u}px`; g.font = `600 ${0.036 * u}px ${FONT}`;
      g.fillText(card.seal.toUpperCase(), p.seal.x * u, (p.seal.y + p.seal.r + 0.07) * u);
      const fs = hz > hx ? 0.078 : 0.07;
      g.font = `600 ${fs * u}px ${FONT}`; g.letterSpacing = `${-0.005 * fs * u}px`;
      g.fillStyle = G; pill(p.confirm); g.fill();
      g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";
      g.fillText(card.confirm, (p.confirm.x + p.confirm.w / 2) * u, (p.confirm.y + p.confirm.h / 2 + fs * 0.36) * u);
      g.globalCompositeOperation = "lighter";
      const i = 0.005; g.strokeStyle = R; g.lineWidth = 0.009 * u;
      pill({ x: p.cancel.x + i, y: p.cancel.y + i, w: p.cancel.w - 2 * i, h: p.cancel.h - 2 * i }); g.stroke();
      g.fillStyle = R; g.fillText(card.cancel, (p.cancel.x + p.cancel.w / 2) * u, (p.cancel.y + p.cancel.h / 2 + fs * 0.36) * u);
      g.globalCompositeOperation = "source-over";
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texLab);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, labCv);
      gl.generateMipmap(gl.TEXTURE_2D);
      return p;
    };

    const layout = () => {
      const aspect = cssW / cssH;
      const tall = aspect < 0.8;
      if (tall) { hx = 1.0; hz = 1.42; } else { hx = 1.55; hz = 1.0; }
      pl = paintCard();
      rest = tall ? [hx - 0.5, 0, -hz - 0.7] : [hx + 0.85, 0, -0.3];
      // fit the lens to the card and the seal standing beside it
      const v = view(0, 0);
      const pts: number[][] = [];
      for (const [x, z] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]]) pts.push([x, 0, z]);
      for (let a = 0; a < 8; a++) pts.push([rest[0] + Math.cos(a) * 0.18, 0, rest[2] + Math.sin(a) * 0.18]);
      pts.push([rest[0], 0.88 * SC, rest[2]]);
      const r = pts.map((p) => raw(v, p));
      const x0 = Math.min(...r.map((q) => q[0])), x1 = Math.max(...r.map((q) => q[0]));
      const y0 = Math.min(...r.map((q) => q[1])), y1 = Math.max(...r.map((q) => q[1]));
      const foc = Math.min((tall ? 0.86 : 0.8) * aspect / (x1 - x0), (tall ? 0.74 : 0.76) / (y1 - y0));
      fit = { foc, shift: [-foc * (x0 + x1) / 2, -foc * (y0 + y1) / 2 - 0.035] };
      const fv = framed(0, 0);
      // the far edge of the mat runs across the top of the frame, with walnut beyond it
      const far = Math.min(onDesk(fv, 0, 0.43)[1], Math.min(-hz, rest[2] - 0.25) - 0.3);
      mat[0] = 0; mat[1] = far + 9; mat[2] = 30; mat[3] = 9;
      below = onDesk(fv, 0, -0.5)[1] + hz + 0.6;
      left = onDesk(fv, -0.5 * aspect, 0)[0] - hx - 1.0;
      if (!s.on) { s.cz = below; s.tz = below; }
      if (s.seq < 0) s.st = [...rest];
      setPlan(pl);
      s.count = 0; s.fresh = true;
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      const changed = Math.abs(r.width - cssW) > 0.5 || Math.abs(r.height - cssH) > 0.5;
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.3e6 / (cssW * cssH * dpr * dpr)));
      const w = Math.max(2, Math.round(cssW * dpr * k)), h = Math.max(2, Math.round(cssH * dpr * k));
      if (w !== W || h !== H) {
        W = w; H = h; cv.width = W; cv.height = H;
        if (gl2 && acc && fbo) {
          gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, acc);
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
      }
      if (changed) layout();
    };
    const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

    // The real dialog rides the card: the flat transform that best fits the four corners of its printed face.
    const pin = (v: View) => {
      const w = 2 * hx * U, h = 2 * hz * U;
      const [tl, tr, bl, br] = [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]].map(([x, z]) => { const p = toWorld(x, z); return project(v, [p[0], 2 * CT, p[2]]); });
      const a = (tr[0] - tl[0] + br[0] - bl[0]) / (2 * w), b = (tr[1] - tl[1] + br[1] - bl[1]) / (2 * w);
      const c = (bl[0] - tl[0] + br[0] - tr[0]) / (2 * h), d = (bl[1] - tl[1] + br[1] - tr[1]) / (2 * h);
      const mx = (tl[0] + tr[0] + bl[0] + br[0]) / 4, my = (tl[1] + tr[1] + bl[1] + br[1]) / 4;
      const css = `matrix(${[a, b, c, d, mx - (a * w) / 2 - (c * h) / 2, my - (b * w) / 2 - (d * h) / 2].map((n) => n.toFixed(5)).join(",")})`;
      if (api.current) api.current.matrix = css;
      if (sheet.current) sheet.current.style.transform = css;
    };
    const stampRot = () => {
      // a small lean toward where it is going: about x by the forward lean, about z by the sideways one
      const ax = s.tilt[1], az = -s.tilt[0];
      const cx = Math.cos(ax), sx = Math.sin(ax), cz = Math.cos(az), sz = Math.sin(az);
      // R = Rx * Rz written row by row; read as columns by the shader it becomes its transpose, which takes world points into the seal's frame
      return [cz, -sz, 0, cx * sz, cx * cz, -sx, sx * sz, sx * cz, cx];
    };

    const draw = (alpha: number, sample: number) => {
      const v = framed(s.lx, s.ly);
      pin(v);
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.06 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texLab);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 : 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform3f(su.uCam, v.cam[0], v.cam[1], v.cam[2]);
      gl.uniform3f(su.uFw, v.fw[0], v.fw[1], v.fw[2]); gl.uniform3f(su.uRt, v.rt[0], v.rt[1], v.rt[2]); gl.uniform3f(su.uUp, v.up[0], v.up[1], v.up[2]);
      gl.uniform1f(su.uFoc, v.foc); gl.uniform2f(su.uShift, v.shift[0], v.shift[1]);
      const fd = (0 - v.cam[0]) * v.fw[0] + (0.02 - v.cam[1]) * v.fw[1] + (0 - v.cam[2]) * v.fw[2];
      gl.uniform1f(su.uFocusD, fd);
      gl.uniform3f(su.uCard, s.cx, s.cz, s.cyaw);
      gl.uniform2f(su.uHalf, hx, hz);
      if (pl) gl.uniform2f(su.uSeal, pl.seal.x - hx, pl.seal.y - hz);
      gl.uniform1f(su.uWax, s.wax); gl.uniform1f(su.uWaxOn, s.waxOn ? 1 : 0); gl.uniform1f(su.uCardOn, s.on || s.leaving ? 1 : 0);
      gl.uniform3f(su.uStamp, s.st[0], s.st[1], s.st[2]);
      gl.uniformMatrix3fv(su.uSRot, false, stampRot());
      gl.uniform4f(su.uMat, mat[0], mat[1], mat[2], mat[3]);
      gl.uniform4f(su.uHov, s.hov[0], s.hov[1], s.hov[2], s.hovS * s.hov[3]);
      gl.uniform3f(su.uWaxC, WAX[0], WAX[1], WAX[2]); gl.uniform3f(su.uPaper, PAPER[0], PAPER[1], PAPER[2]); gl.uniform3f(su.uLeather, LEATHER[0], LEATHER[1], LEATHER[2]);
      gl.uniform1i(su.uLab, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, acc);
        gl.uniform1i(pu.uAcc, 3); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    // where the seal travels when it is used: up, across, a breath, down hard, hold, up, home
    const path = () => {
      if (!pl) return [];
      const w = toWorld(pl.seal.x - hx, pl.seal.y - hz);
      const touch = 2 * CT + 0.075, press = 2 * CT + 0.033;
      return [
        { t: 0, p: [rest[0], 0, rest[2]], e: 0 },
        { t: 0.3, p: [rest[0], 0.36, rest[2]], e: 0 },
        { t: 0.82, p: [w[0], 0.42, w[2]], e: 0 },
        { t: 1.02, p: [w[0], 0.52, w[2]], e: 0 },
        { t: 1.15, p: [w[0], touch, w[2]], e: 1 },
        { t: 1.32, p: [w[0], press, w[2]], e: 2 },
        { t: 1.72, p: [w[0], press, w[2]], e: 0 },
        { t: 2.0, p: [w[0], 0.36, w[2]], e: 2 },
        { t: 2.58, p: [rest[0], 0.26, rest[2]], e: 0 },
        { t: 2.86, p: [rest[0], 0, rest[2]], e: 1 },
      ] as { t: number; p: V3; e: number }[];
    };
    const sample = (keys: { t: number; p: V3; e: number }[], t: number): V3 => {
      for (let i = 1; i < keys.length; i++) {
        if (t <= keys[i].t) {
          const a = keys[i - 1], b = keys[i];
          const k = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t)));
          const e = b.e === 1 ? k * k * k : b.e === 2 ? 1 - Math.pow(1 - k, 3) : k * k * (3 - 2 * k);
          return [a.p[0] + (b.p[0] - a.p[0]) * e, a.p[1] + (b.p[1] - a.p[1]) * e, a.p[2] + (b.p[2] - a.p[2]) * e];
        }
      }
      return [...keys[keys.length - 1].p];
    };

    const openCard = () => {
      if (s.on && !s.leaving) return;
      s.on = true; s.leaving = false; s.wax = 0; s.waxOn = true;
      if (still) { s.cx = 0; s.cz = 0; s.cyaw = 0; s.vx = s.vz = s.vyaw = 0; }
      else { s.cx = 0.35; s.cz = below; s.cyaw = -0.16; s.vx = 0; s.vz = -2; s.vyaw = 0; }
      s.tx = 0; s.tz = 0; s.tyaw = 0; wake();
    };
    const away = (x: number, z: number, yaw: number) => {
      s.leaving = true; s.tx = x; s.tz = z; s.tyaw = yaw;
      if (still) { s.on = false; s.leaving = false; s.cx = x; s.cz = z; }
      wake();
    };
    const cancel = () => { if (s.seq >= 0 || !s.on || s.leaving) return; away(0.4, below, 0.14); };
    const confirm = () => {
      if (s.seq >= 0 || !s.on || s.leaving) return;
      if (still) { s.wax = 1; s.count = 0; s.fresh = true; s.closeAt = performance.now() + 1100; wake(); return; }
      s.seq = 0; wake();
    };
    const hover = (b: Box | null) => {
      s.hovB = b;
      if (b) s.hov = [b.x + b.w / 2 - hx, b.y + b.h / 2 - hz, b.w / 2, b.h / 2];
      if (still) { s.hovS = b ? 1 : 0; s.count = 0; s.fresh = true; }
      wake();
    };
    api.current = { open: openCard, cancel, confirm, hover, matrix: "" };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 4200; }

      // the self-running demo starts from the finished card, seals it, files it, and deals a fresh one
      if (!still && !s.touched && now > s.demoAt && s.seq < 0) {
        if (s.on && !s.leaving) { confirm(); s.demoAt = now + 4600; }
        else if (!s.on) { openCard(); setOpen(true); s.demoAt = now + 5200; }
      }
      if (still && s.closeAt && now > s.closeAt) { s.closeAt = 0; away(left, -0.3, 0); s.count = 0; s.fresh = true; }

      let moving = false, speed = 0;
      if (!still) {
        if (s.seq < 0) for (let k = 0; k < 2; k++) s.tiltV[k] += -s.tilt[k] * 55 * dt;
        if (s.seq >= 0) {
          s.seq += dt;
          const keys = path();
          const prev = s.st;
          s.st = sample(keys, s.seq);
          const vx = (s.st[0] - prev[0]) / Math.max(dt, 1e-3), vz = (s.st[2] - prev[2]) / Math.max(dt, 1e-3);
          s.tiltV[0] += (Math.max(-0.16, Math.min(0.16, vx * 0.05)) - s.tilt[0]) * 55 * dt;
          s.tiltV[1] += (Math.max(-0.16, Math.min(0.16, vz * 0.05)) - s.tilt[1]) * 55 * dt;
          const touch = 2 * CT + 0.075, press = 2 * CT + 0.033;
          if (s.seq > 1.0 && s.seq < 1.8) s.wax = Math.max(s.wax, Math.max(0, Math.min(1, (touch - s.st[1]) / (touch - press))));
          if (s.seq > 2.0 && !s.leaving) away(left, -0.25, 0.32);
          if (s.seq > keys[keys.length - 1].t) { s.seq = -1; s.st = [...rest]; }
        }
        for (let k = 0; k < 2; k++) { s.tiltV[k] -= s.tiltV[k] * 13 * dt; s.tilt[k] += s.tiltV[k] * dt; }
        const steps = 4, h = dt / steps;
        const kS = s.leaving ? 30 : 42, cS = s.leaving ? 9 : 8.6;
        for (let i = 0; i < steps; i++) {
          s.vx += (kS * (s.tx - s.cx) - cS * s.vx) * h; s.cx += s.vx * h;
          s.vz += (kS * (s.tz - s.cz) - cS * s.vz) * h; s.cz += s.vz * h;
          s.vyaw += (kS * (s.tyaw - s.cyaw) - cS * s.vyaw) * h; s.cyaw += s.vyaw * h;
        }
        if (s.leaving && Math.abs(s.cx - s.tx) < 0.05 && Math.abs(s.cz - s.tz) < 0.05) { s.on = false; s.leaving = false; }
        const hs = (s.hovB ? 1 : 0) - s.hovS;
        s.hovS += hs * (1 - Math.exp(-dt * 12));
        s.lx += (s.px - s.lx) * (1 - Math.exp(-dt * 3)); s.ly += (s.py - s.ly) * (1 - Math.exp(-dt * 3));
        speed = Math.abs(s.vx) + Math.abs(s.vz) + Math.abs(s.vyaw) * 2 + (s.seq >= 0 ? 1 : 0) + Math.abs(hs) * 0.3 + Math.abs(s.px - s.lx) * 2 + Math.abs(s.py - s.ly) * 2 + Math.abs(s.tiltV[0]) + Math.abs(s.tiltV[1]);
        moving = speed > 0.004;
      }

      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(Math.min(0.9, 0.3 + speed * 0.5), 1 + (s.frame % 64)); s.count = 4; }
      else if (s.count < 48) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      if (!still && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 48 || (!still && !s.touched) || s.closeAt) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1; wake();
    };
    const leave = () => { s.px = 0; s.py = 0; wake(); };
    const touch = () => { s.touched = true; };
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    box.addEventListener("pointerdown", touch);
    box.addEventListener("keydown", touch);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      box.removeEventListener("pointerdown", touch); box.removeEventListener("keydown", touch);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  useEffect(() => {
    if (!byUser.current) return;
    if (open) keep.current?.focus(); else trigger.current?.focus();
  }, [open]);

  const still = shown === "still";
  const change = (to: boolean, how: "cancel" | "confirm" | "open") => {
    byUser.current = true;
    if (how === "open") { api.current?.open(); setSealed(false); setNote(""); }
    if (how === "cancel") { api.current?.cancel(); setNote(card.kept); }
    if (how === "confirm") {
      api.current?.confirm(); setNote(card.done);
      if (still) { setSealed(true); window.setTimeout(() => { setOpen(false); }, 1100); return; }
    }
    setOpen(to);
  };
  const keys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { e.preventDefault(); change(false, "cancel"); return; }
    if (e.key !== "Tab") return;
    const list = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("button"));
    if (!list.length) return;
    const at = list.indexOf(document.activeElement as HTMLElement);
    e.preventDefault();
    list[(at + (e.shiftKey ? -1 : 1) + list.length) % list.length].focus();
  };

  const gl = !still && !!plan;
  const at = (b: Box | undefined) => (gl && b ? { position: "absolute" as const, left: b.x * U, top: b.y * U, width: b.w * U, height: b.h * U } : undefined);
  const lit = (b: Box | undefined) => ({
    onPointerEnter: () => api.current?.hover(b ?? null), onPointerLeave: () => api.current?.hover(null),
    onFocus: () => api.current?.hover(b ?? null), onBlur: () => api.current?.hover(null),
  });
  const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[#f3e6cf] focus-visible:ring-offset-4 focus-visible:ring-offset-[#2a1712]";

  return (
    <section className="relative isolate overflow-hidden bg-[#140b08] text-[#f3e6cf]" style={{ fontFamily: FONT }}>
      <style>{`@keyframes brass-seal-lamp { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.04); } }`}</style>
      <div
        ref={stage}
        className="relative h-[700px] w-full sm:h-[min(720px,62vw)] sm:min-h-[600px]"
        style={{ background: "radial-gradient(120% 90% at 34% 38%, #3a2016 0%, #1c0f0b 55%, #0d0706 100%)" }}
        onPointerDown={(e) => { const t = e.target as HTMLElement; if (open && !t.closest("[role=dialog]") && !t.closest("button")) change(false, "cancel"); }}
      >
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />

        {still && (
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[12%] bg-[linear-gradient(180deg,#2a150b,#4a2614_70%,#1a0c07)]" />
            <div className="absolute inset-x-0 top-[12%] bottom-0 bg-[radial-gradient(70%_60%_at_36%_42%,#4a2a1e_0%,#26140f_55%,#120a08_100%)]" />
            <div className="absolute inset-x-0 top-[12%] h-[3px] bg-[#6a4330]/60" />
            <div className="absolute inset-x-0 top-[calc(12%+18px)] border-t border-dashed border-[#7a5236]/70" />
            <div className="absolute inset-0 bg-[radial-gradient(40%_35%_at_30%_30%,rgba(255,196,120,0.18),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(38%_34%_at_32%_34%,rgba(255,200,130,0.12),transparent_70%)] motion-safe:animate-[brass-seal-lamp_5s_ease-in-out_infinite]" />
            {!open && <div className="absolute right-[12%] top-[34%] hidden h-24 w-14 sm:block"><span className="absolute bottom-0 left-1/2 h-4 w-16 -translate-x-1/2 rounded-[50%] bg-gradient-to-b from-[#e6b866] to-[#7a5422] shadow-[0_10px_18px_rgba(0,0,0,0.6)]" /><span className="absolute bottom-3 left-1/2 h-12 w-3 -translate-x-1/2 bg-gradient-to-r from-[#7a5422] via-[#f0cd84] to-[#6a4518]" /><span className="absolute -top-2 left-1/2 h-14 w-11 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(circle_at_35%_30%,#4a3a32,#0e0907_70%)]" /></div>}
          </div>
        )}

        <div className={`absolute left-5 top-5 transition-opacity duration-300 motion-reduce:transition-none sm:left-9 sm:top-8 ${open ? "pointer-events-none opacity-0" : "opacity-100"}`}>
          <button
            ref={trigger}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            tabIndex={open ? -1 : 0}
            onClick={() => change(true, "open")}
            className="inline-flex h-12 items-center gap-2.5 rounded-full bg-[#f1e6d2] pl-5 pr-4 text-[14px] font-semibold tracking-[-0.01em] text-[#2a1712] shadow-[0_14px_30px_-12px_rgba(0,0,0,0.8),inset_0_-2px_0_rgba(42,23,18,0.15)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#f3e6cf] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c0f0b] active:translate-y-0 motion-reduce:transition-none"
          >
            {card.trigger}
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" /></svg>
          </button>
        </div>

        {open && (
          <div
            ref={(el) => { sheet.current = el; if (el && gl && api.current?.matrix) el.style.transform = api.current.matrix; }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="brass-seal-dialog-title"
            aria-describedby="brass-seal-dialog-body"
            onKeyDown={keys}
            className={gl
              ? "absolute left-0 top-0 origin-top-left text-transparent"
              : still
                ? "absolute left-1/2 top-[54%] w-[min(90%,640px)] -translate-x-1/2 -translate-y-1/2 rounded-[10px] bg-[#e9dcc2] p-6 text-[#1d1512] shadow-[0_1px_0_#fffaf0_inset,0_-2px_0_#bfae8e_inset,0_2px_2px_rgba(0,0,0,0.5),18px_34px_48px_-10px_rgba(0,0,0,0.75)] sm:p-10"
                : "sr-only"}
            style={gl && plan ? { width: 2 * plan.hx * U, height: 2 * plan.hz * U } : undefined}
          >
            {!gl && (
              <div aria-hidden="true" className="absolute right-6 top-6 h-24 w-24 sm:right-10 sm:top-10">
                <span className="absolute inset-0 rounded-full border border-dashed border-[#8d7d63]" />
                {!sealed && <span className="absolute inset-6 rounded-[46%_54%_48%_52%] bg-[radial-gradient(circle_at_38%_32%,#e04a44,#8e1014_55%,#560709)] shadow-[0_4px_6px_rgba(60,0,0,0.45),inset_0_-3px_4px_rgba(40,0,0,0.5)]" />}
                {sealed && <span className="absolute inset-1 rounded-[46%_54%_50%_50%] bg-[radial-gradient(circle_at_40%_35%,#c0282a,#7d0d10_60%,#4c0608)] shadow-[0_3px_6px_rgba(60,0,0,0.5),inset_0_2px_3px_rgba(255,160,150,0.35)]"><span className="absolute inset-3 rounded-full border-2 border-[#5e0709]/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" /></span>}
              </div>
            )}
            <p className={gl ? "absolute whitespace-nowrap text-[10px] uppercase" : "flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#3b2c24]"} style={at(plan?.eyebrow)}>
              {!gl && <span aria-hidden="true" className="h-2 w-2 bg-[#a3161a]" />}{card.eyebrow}
            </p>
            <h2 id="brass-seal-dialog-title" className={gl ? "absolute leading-[1.06]" : "mt-6 max-w-[calc(100%-7rem)] text-[30px] font-medium leading-[1.06] tracking-[-0.02em] sm:mt-8 sm:text-[44px]"} style={gl && plan ? { ...at(plan.title), fontSize: plan.titleSize * U, fontFamily: SERIF } : { fontFamily: SERIF }}>{card.title}</h2>
            <p id="brass-seal-dialog-body" className={gl ? "absolute leading-[1.5]" : "mt-4 max-w-[26rem] text-[15px] leading-[1.55] text-[#3b2c24] sm:text-[16px]"} style={gl && plan ? { ...at(plan.body), fontSize: plan.bodySize * U } : undefined}>{card.body}</p>
            <div className={gl ? "" : "mt-8 flex justify-end gap-3 sm:mt-12"}>
              <button ref={keep} type="button" onClick={() => change(false, "cancel")} {...lit(plan?.cancel)} className={gl ? `rounded-full text-[14px] ${ring}` : `h-12 flex-1 whitespace-nowrap rounded-full border border-[#1d1512] px-5 text-[15px] font-semibold text-[#1d1512] transition-colors hover:bg-black/5 motion-reduce:transition-none sm:flex-none ${ring}`} style={at(plan?.cancel)}>{card.cancel}</button>
              <button type="button" onClick={() => change(false, "confirm")} {...lit(plan?.confirm)} className={gl ? `rounded-full text-[14px] ${ring}` : `h-12 flex-1 whitespace-nowrap rounded-full bg-[#a3161a] px-5 text-[15px] font-semibold text-[#fbf1e2] transition-colors hover:bg-[#8a1216] motion-reduce:transition-none sm:flex-none ${ring}`} style={at(plan?.confirm)}>{card.confirm}</button>
            </div>
          </div>
        )}

        <p className="pointer-events-none absolute bottom-4 left-5 text-[11px] font-medium uppercase tracking-[0.22em] text-[#e9d6b8]/70 sm:bottom-7 sm:left-9">Demo only. Nothing is deleted.</p>
        <p aria-live="polite" className="sr-only">{note}</p>
      </div>
    </section>
  );
}
