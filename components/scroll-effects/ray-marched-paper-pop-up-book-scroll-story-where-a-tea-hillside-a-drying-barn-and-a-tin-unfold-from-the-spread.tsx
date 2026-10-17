import { useEffect, useRef, useState } from "react";

// The story. Each beat is one fold of the pop-up: where the page has to reach for it to stand.
const beats = [
  { fold: "Ridge", title: "Grown on the ridge", body: "Fernmoor leaves are picked by hand on the terraces above the river, only the bud and the top two leaves, before the morning mist has lifted.", at: 0.64 },
  { fold: "Barn", title: "Withered in the barn", body: "They rest overnight on slatted racks in the old drying barn and are turned twice by hand, so every leaf softens at the same pace.", at: 0.83 },
  { fold: "Tin", title: "Sealed in the tin", body: "Rolled, fired and packed the same week into a lined paper tin, so the cup you pour still tastes of the hillside it came from.", at: 1 },
];
const BRAND = "Fernmoor Tea";
const STORY = "Spring picking, told in three folds";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

// When each paper piece stands, as a share of the story (0 closed, 1 fully open).
const COVER = [0, 0.3];
const RISE = [[0.3, 0.5], [0.36, 0.56], [0.42, 0.62], [0.64, 0.8], [0.84, 0.98]];
const beatOf = (p: number) => (p < 0.735 ? 0 : p < 0.915 ? 1 : 2);
const sm = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const TONE = `
vec3 tone(vec3 x){ x *= 0.92; vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return pow(clamp(a / b, 0.0, 1.0), vec3(1.0 / 2.2)); }
`;

// A cloth-bound book lying open on a linen table in low afternoon light from the left and behind.
// Three cut-paper ridges, a drying barn and a tea tin stand up out of the spread.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform float uTh; uniform vec4 uA; uniform float uTin; uniform vec3 uL;
uniform sampler2D uTex; uniform float uDirect;
const float YT = 0.17;
const vec3 SUN = vec3(1.0, 0.86, 0.68);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float sdBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdCyl(vec3 p, float r, float h, float rr){ vec2 d = vec2(length(p.xz) - r + rr, abs(p.y) - h + rr); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rr; }

// the page surface sinks into the gutter
float topY(float x){ return YT - 0.075 * exp(-abs(x) * 6.0); }
// the left half of the book, swung about the spine by uTh, seen in its own (mirrored) frame
vec3 toLeft(vec3 p){
  vec2 r = vec2(p.x, p.y - YT); float c = cos(uTh), s = sin(uTh);
  vec2 l = vec2(r.x * c - r.y * s, r.x * s + r.y * c);
  return vec3(-l.x, l.y + YT, p.z);
}
vec2 halfBook(vec3 q){
  float b = sdBox(q - vec3(1.07, 0.024, 0.0), vec3(1.07, 0.024, 1.52), 0.014);
  float pg = sdBox(q - vec3(1.04, 0.11, 0.0), vec3(1.0, 0.07, 1.45), 0.008);
  pg = max(pg, (q.y - topY(q.x)) * 0.9);
  return b < pg ? vec2(b, 1.0) : vec2(pg, 2.0);
}
// ---- cut paper ridges, hinged at their foot, lying forward when folded ----
float ridgeH(float X, float i){
  float h;
  if (i < 0.5) h = 0.9 + 0.18 * sin(X * 1.3 + 0.5) + 0.07 * sin(X * 3.7 + 1.0);
  else if (i < 1.5) h = 0.64 + 0.15 * sin(X * 1.8 + 2.3) + 0.05 * sin(X * 5.3 + 1.0);
  else { h = 0.4 + 0.11 * sin(X * 2.3 + 4.1); h += 0.028 * sqrt(abs(sin(X * 13.0))); }
  return h * smoothstep(1.97, 1.5, abs(X));
}
vec2 ridgeUV(vec3 q, float a, float zb){
  float h = q.y - topY(q.x); float dz = q.z - zb;
  float ph = (1.0 - a) * 1.5708; float c = cos(ph), s = sin(ph);
  vec2 vw = vec2(h * c + dz * s, -h * s + dz * c);
  // stiff card still bows a little between its folds
  vw.y += vw.x * (0.05 * vw.x + 0.035 * sin(q.x * 2.1 + zb * 5.0)) * smoothstep(0.0, 0.3, vw.x);
  return vw;
}
float ridge(vec3 q, float sg, float i, float a, float zb){
  if (a < 0.002) return 1e3;
  vec2 vw = ridgeUV(q, a, zb);
  float X = sg * q.x;
  float d2 = max(vw.x - ridgeH(X, i), -vw.x) * 0.65;
  if (i < 0.5) d2 = min(d2, max(length(vec2(X - 0.72, vw.x - 1.14)) - 0.27, -vw.x));
  d2 = max(d2, max(-q.x, q.x - 1.98));
  vec2 e = vec2(d2, (abs(vw.y) - 0.007) * 0.85);
  return min(max(e.x, e.y), 0.0) + length(max(e, 0.0));
}
// ---- the barn on the right page: a pop-up box that rises out of the paper ----
vec3 barnP(vec3 q){ vec3 r = q - vec3(1.02, topY(1.02) - 0.004, 0.66); r.y /= clamp(uA.w, 0.03, 1.2); return r; }
float barn(vec3 q){
  if (uA.w < 0.01) return 1e3;
  vec3 r = barnP(q);
  float body = sdBox(r - vec3(0.0, 0.2, 0.0), vec3(0.34, 0.2, 0.2), 0.004);
  vec2 rz = vec2(abs(r.z), r.y - 0.4);
  float roof = max(abs(r.x) - 0.4, max(dot(rz, vec2(0.6, 0.8)) - 0.15, -rz.y));
  float ch = sdBox(r - vec3(0.22, 0.56, -0.05), vec3(0.035, 0.1, 0.035), 0.003);
  return min(min(body, roof), ch) * min(uA.w, 1.0) * 0.9;
}
// ---- the tea tin on the left page ----
vec3 tinP(vec3 q){ vec3 r = q - vec3(1.0, topY(1.0) - 0.004, 0.72); r.y /= clamp(uTin, 0.03, 1.2); return r; }
float tin(vec3 q){
  if (uTin < 0.01) return 1e3;
  vec3 r = tinP(q);
  float body = sdCyl(r - vec3(0.0, 0.25, 0.0), 0.24, 0.25, 0.012);
  float lid = sdCyl(r - vec3(0.0, 0.47, 0.0), 0.252, 0.06, 0.012);
  return min(body, lid) * min(uTin, 1.0) * 0.9;
}
const vec3 ZB = vec3(-0.95, -0.42, 0.06);
vec2 map(vec3 p){
  vec3 L = toLeft(p);
  vec2 r = halfBook(p);
  vec2 l = halfBook(L); if (l.x < r.x) r = l;
  float d = min(ridge(p, 1.0, 0.0, uA.x, ZB.x), ridge(L, -1.0, 0.0, uA.x, ZB.x)); if (d < r.x) r = vec2(d, 3.0);
  d = min(ridge(p, 1.0, 1.0, uA.y, ZB.y), ridge(L, -1.0, 1.0, uA.y, ZB.y)); if (d < r.x) r = vec2(d, 4.0);
  d = min(ridge(p, 1.0, 2.0, uA.z, ZB.z), ridge(L, -1.0, 2.0, uA.z, ZB.z)); if (d < r.x) r = vec2(d, 5.0);
  d = barn(p); if (d < r.x) r = vec2(d, 6.0);
  d = tin(L); if (d < r.x) r = vec2(d, 7.0);
  return r;
}
vec3 calcN(vec3 p){
  vec2 e = vec2(0.0007, -0.0007);
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}
vec2 boxSpan(vec3 ro, vec3 rd, vec3 lo, vec3 hi){
  vec3 inv = 1.0 / (rd + vec3(1e-6)); vec3 a = (lo - ro) * inv; vec3 b = (hi - ro) * inv;
  vec3 mn = min(a, b); vec3 mx = max(a, b);
  return vec2(max(max(mn.x, mn.y), max(mn.z, 0.0)), min(mx.x, min(mx.y, mx.z)));
}
const vec3 BLO = vec3(-2.3, -0.01, -1.7); const vec3 BHI = vec3(2.3, 2.45, 1.7);
float shadow(vec3 ro){
  vec2 tb = boxSpan(ro, uL, BLO, BHI);
  if (tb.x > tb.y) return 1.0;
  float res = 1.0; float t = max(tb.x, 0.012);
  for (int i = 0; i < 44; i++) {
    float h = map(ro + uL * t).x;
    res = min(res, 14.0 * h / t);
    t += clamp(h, 0.01, 0.25);
    if (res < 0.002 || t > tb.y) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}
float calcAO(vec3 p, vec3 n){
  float o = 0.0; float s = 1.0;
  for (int i = 1; i <= 5; i++) {
    float h = 0.012 + 0.05 * float(i); float d = min(map(p + n * h).x, p.y + n.y * h);
    o += (h - d) * s; s *= 0.7;
  }
  return clamp(1.0 - 2.0 * o, 0.0, 1.0);
}
vec3 sky(vec3 r){
  vec3 c = mix(vec3(0.82, 0.76, 0.68), vec3(0.72, 0.78, 0.88), smoothstep(-0.1, 0.9, r.y));
  c += SUN * 3.0 * pow(max(dot(r, uL), 0.0), 24.0);
  return c * 0.8;
}
vec3 light(vec3 p, vec3 n, float occ, float sh){
  float ndl = max(dot(n, uL), 0.0);
  vec3 amb = mix(vec3(0.5, 0.45, 0.4), vec3(0.62, 0.68, 0.8), 0.5 + 0.5 * n.y) * occ;
  // the table throws warm light back up into the undersides
  vec3 bounce = vec3(0.7, 0.58, 0.44) * clamp(0.6 - 0.5 * n.y, 0.0, 1.0) * 0.32 * occ;
  return SUN * 3.4 * ndl * sh + amb * 0.42 + bounce;
}
// ---- what each surface is made of ----
vec3 albedo(float m, vec3 p, vec3 n, inout float gloss, out float thin){
  thin = 0.0;
  if (m < 1.5) {
    // book cloth: a fine linen weave in ink blue
    vec3 q = p; float w = n2(q.xz * 260.0) * 0.5 + n2(q.zy * 260.0) * 0.5;
    gloss = 0.18;
    vec3 c = vec3(0.03, 0.05, 0.1) * (0.8 + 0.4 * w);
    // the title blocked in gold on the front board, which is the underside of the left half
    vec3 L = toLeft(p);
    if (L.y < 0.006 && halfBook(L).x < halfBook(p).x + 0.001) {
      float g = texture2D(uTex, vec2(0.5 - L.x / 4.1, (L.z + 1.45) / 2.9)).g;
      c = mix(c, vec3(0.5, 0.34, 0.12), g); gloss = mix(gloss, 0.9, g);
    }
    return c;
  }
  if (m < 2.5) {
    vec3 R = p; float sg = 1.0;
    if (halfBook(toLeft(p)).x < halfBook(p).x) { R = toLeft(p); sg = -1.0; }
    vec3 a = vec3(0.86, 0.82, 0.73);
    if (R.y < topY(R.x) - 0.006) a *= 0.86 + 0.14 * sin(R.y * 1700.0 + n2(R.xz * 40.0) * 3.0); // the edges of the leaves
    else {
      float ink = texture2D(uTex, vec2(0.5 + sg * R.x / 4.1, (R.z + 1.45) / 2.9)).r;
      a = mix(a, vec3(0.14, 0.12, 0.1), ink * 0.85);
    }
    a *= 0.95 + 0.07 * n2(p.xz * 90.0);
    return a;
  }
  if (m < 5.5) {
    float i = m - 3.0;
    vec3 R = p; float sg = 1.0;
    float z = i < 0.5 ? ZB.x : i < 1.5 ? ZB.y : ZB.z;
    float a = i < 0.5 ? uA.x : i < 1.5 ? uA.y : uA.z;
    vec2 vr = ridgeUV(p, a, z), vl = ridgeUV(toLeft(p), a, z);
    if (abs(vl.y) < abs(vr.y)) { R = toLeft(p); sg = -1.0; }
    vec2 vw = ridgeUV(R, a, z); float X = sg * R.x;
    float ph = (1.0 - a) * 1.5708; float ly = -sin(ph);
    vec3 pn = sg > 0.0 ? vec3(0.0, ly, cos(ph)) : vec3(ly * sin(uTh), ly * cos(uTh), cos(ph));
    vec3 c = i < 0.5 ? vec3(0.5, 0.58, 0.45) : i < 1.5 ? vec3(0.24, 0.4, 0.27) : vec3(0.08, 0.22, 0.14);
    if (i < 0.5 && length(vec2(X - 0.72, vw.x - 1.14)) < 0.27 && vw.x > ridgeH(X, 0.0) - 0.002) c = vec3(0.78, 0.46, 0.17);
    // rows of tea bushes printed on the front ridge
    if (i > 1.5) c *= 0.82 + 0.25 * smoothstep(0.2, 0.8, sin(vw.x * 70.0 + sin(X * 3.0) * 2.0));
    // a cut edge shows the paler core of the coloured card
    float edge = 1.0 - smoothstep(0.55, 0.85, abs(dot(n, pn)));
    c = mix(c, vec3(0.88, 0.85, 0.76), edge * 0.75);
    thin = 1.0 - edge;
    c *= 0.94 + 0.1 * n2(vec2(X, vw.x) * 120.0);
    return c;
  }
  if (m < 6.5) {
    vec3 r = barnP(p);
    if (r.y > 0.4 || (r.y > 0.45 && abs(r.x) < 0.3)) {
      float tile = smoothstep(0.35, 0.5, abs(fract(r.y * 26.0) - 0.5));
      return vec3(0.1, 0.095, 0.09) * (0.85 + 0.3 * tile);
    }
    if (abs(r.x - 0.22) < 0.04 && r.y > 0.45) return vec3(0.42, 0.18, 0.11);
    vec3 c = vec3(0.6, 0.2, 0.1);
    float boards = smoothstep(0.42, 0.5, abs(fract(r.x * 30.0) - 0.5));
    c *= 0.9 + 0.12 * boards;
    if (r.z > 0.19 && abs(r.x) < 0.09 && r.y < 0.25) c = vec3(0.17, 0.08, 0.05);
    if (r.z > 0.19 && abs(abs(r.x) - 0.22) < 0.05 && abs(r.y - 0.24) < 0.05) c = vec3(0.95, 0.8, 0.52);
    if (r.z > 0.19 && abs(r.x) < 0.25 && abs(r.y - 0.34) < 0.012) c = vec3(0.86, 0.82, 0.72);
    return c * (0.95 + 0.08 * n2(p.xy * 140.0));
  }
  vec3 r = tinP(p);
  vec3 c = vec3(0.03, 0.22, 0.24);
  if (r.y > 0.41) c = vec3(0.3, 0.17, 0.08);
  else if (abs(r.y - 0.23) < 0.1) {
    c = vec3(0.88, 0.82, 0.68);
    float ang = atan(r.x, r.z);
    if (abs(r.y - 0.23) > 0.082) c = vec3(0.3, 0.17, 0.08);
    else if (abs(ang) < 0.55 && abs(r.y - 0.24) < 0.022) c = vec3(0.05, 0.2, 0.2);
    else if (abs(ang) < 0.32 && abs(r.y - 0.19) < 0.008) c = vec3(0.4, 0.3, 0.2);
  }
  gloss = 0.1;
  return c * (0.95 + 0.08 * n2(p.xy * 140.0));
}
vec3 shade(vec3 p, vec3 n, vec3 rd, float m){
  float occ = calcAO(p, n);
  float gloss = 0.03; float thin;
  vec3 a = albedo(m, p, n, gloss, thin);
  float sh = shadow(p + n * 0.006);
  vec3 col = a * light(p, n, occ, sh);
  // light coming through thin card from behind
  if (thin > 0.0) {
    float back = max(dot(-n, uL), 0.0);
    if (back > 0.0) col += a * a * SUN * 3.4 * back * shadow(p - n * 0.02) * thin;
  }
  vec3 r = reflect(rd, n);
  float F = 0.03 + 0.97 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  col += F * sky(r) * gloss * (0.4 + 0.6 * occ) * (0.4 + 0.6 * sh);
  return col;
}
vec3 backdrop(vec3 rd){ return mix(vec3(0.9, 0.84, 0.76), vec3(0.72, 0.66, 0.58), smoothstep(-0.25, 0.25, rd.y)); }
vec3 floorCol(vec3 p, float t, vec3 rd){
  float w = n2(vec2(p.x * 160.0, p.z * 9.0)) * 0.5 + n2(vec2(p.x * 9.0, p.z * 160.0)) * 0.5;
  vec3 a = vec3(0.7, 0.63, 0.53) * (0.92 + 0.12 * w) * (0.96 + 0.06 * n2(p.xz * 1.5));
  vec3 n = vec3(0.0, 1.0, 0.0);
  float occ = calcAO(p, n);
  float sh = shadow(p + n * 0.004);
  vec3 c = a * light(p, n, occ, sh);
  return mix(c, backdrop(rd), smoothstep(9.0, 26.0, t));
}
void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))); vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * uJit.z + up * uJit.w; rd = normalize(fp - ro);
  float tf = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  vec2 tb = boxSpan(ro, rd, BLO, BHI);
  float t = -1.0; float m = 0.0;
  if (tb.x < tb.y) {
    float s = tb.x;
    for (int i = 0; i < 140; i++) {
      vec2 h = map(ro + rd * s);
      if (h.x < 0.0003 * s) { t = s; m = h.y; break; }
      s += h.x; if (s > tb.y) break;
    }
  }
  vec3 col;
  if (t > 0.0) { vec3 p = ro + rd * t; col = shade(p, calcN(p), rd, m); }
  else if (tf < 1e8) col = floorCol(ro + rd * tf, tf, rd);
  else col = backdrop(rd);
  col = min(col, vec3(24.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing: a soft bloom, the filmic curve, a vignette and a little grain.
const POST = `
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain; uniform vec2 uCentre;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uAcc, uv).rgb;
  vec3 b = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 16.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.018 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += max(s - 1.6, 0.0) * (1.0 - 0.6 * r);
  }
  c += b * 0.012 * vec3(1.0, 0.9, 0.78);
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.2 * smoothstep(0.4, 1.3, length(q));
  c = tone(c);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.02;
  outC = vec4(c, 1.0);
}
`;

// The type printed on the spread, drawn once. Left half of the canvas is the left page.
function spreadPrint() {
  const W = 2048, H = 1440;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  if (!g) return cv;
  g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#f00"; g.textBaseline = "alphabetic";
  const px = (x: number) => W / 2 + (x / 2.05) * (W / 2); // scene x on the page to canvas x
  const pz = (z: number) => ((z + 1.45) / 2.9) * H;
  g.font = `600 30px ${FONT}`; g.textAlign = "left";
  g.fillText("FERNMOOR", px(-1.82), pz(-1.24));
  g.textAlign = "right"; g.fillText("SPRING PICKING", px(1.82), pz(-1.24));
  g.font = `italic 44px ${SERIF}`; g.textAlign = "left";
  const lines = ["The mist sits in the valley until nine.", "By then the first baskets are full and", "the pickers walk them down to the barn."];
  lines.forEach((l, i) => g.fillText(l, px(-1.82), pz(1.02) + i * 58));
  g.textAlign = "right";
  ["Nothing is hurried. A leaf that is rushed", "tastes of the hurry, the old growers say."].forEach((l, i) => g.fillText(l, px(1.82), pz(1.1) + i * 58));
  // the cover title, in green so the shader can tell it from the page ink
  g.fillStyle = "#0f0"; g.textAlign = "center";
  g.font = `700 104px ${FONT}`;
  g.save(); g.translate(px(-1.02), pz(-0.25)); g.scale(-1, 1); g.fillText("FERNMOOR", 0, 0);
  g.font = `italic 56px ${SERIF}`; g.fillText("A spring picking", 0, 96); g.restore();
  g.fillStyle = "#f00";
  g.font = `500 30px ${FONT}`;
  g.textAlign = "left"; g.fillText("14", px(-1.82), pz(1.36));
  g.textAlign = "right"; g.fillText("15", px(1.82), pz(1.36));
  return cv;
}

// No WebGL: the open book drawn flat, at its finished state.
function Still() {
  return (
    <svg aria-hidden="true" viewBox="0 0 800 520" className="absolute inset-x-4 bottom-[34%] mx-auto w-[calc(100%-2rem)] max-w-[760px] lg:bottom-[12%] lg:left-[38%] lg:right-[3%] lg:w-auto">
      <defs>
        <linearGradient id="ppb-page" x1="0" x2="1"><stop offset="0" stopColor="#efe7d6" /><stop offset="0.47" stopColor="#e2d7c1" /><stop offset="0.5" stopColor="#c9bca3" /><stop offset="0.53" stopColor="#e4dac5" /><stop offset="1" stopColor="#f2ebdc" /></linearGradient>
        <filter id="ppb-soft" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <ellipse cx="420" cy="470" rx="380" ry="40" fill="#5b4a36" opacity="0.28" filter="url(#ppb-soft)" />
      <path d="M70 460 L120 300 L680 300 L740 460 Z" fill="#1d2a44" />
      <path d="M84 446 L130 306 L670 306 L726 446 Z" fill="url(#ppb-page)" />
      <circle cx="560" cy="150" r="58" fill="#e08b2c" />
      <path d="M150 330 C210 180 300 150 400 210 C480 120 600 120 660 330 Z" fill="#8c9d7c" />
      <path d="M140 360 C220 250 320 230 400 280 C480 220 590 230 670 360 Z" fill="#4a6a4d" />
      <path d="M128 400 C220 330 320 330 400 350 C480 320 600 320 690 400 Z" fill="#1f3d2c" />
      <path d="M470 330 L470 395 L590 395 L590 330 L530 290 Z" fill="#9c3b20" />
      <path d="M462 334 L530 284 L598 334 L590 338 L530 296 L470 338 Z" fill="#232120" />
      <rect x="520" y="358" width="20" height="37" fill="#2c140b" />
      <rect x="210" y="348" width="74" height="78" rx="6" fill="#0d3d40" />
      <rect x="210" y="368" width="74" height="30" fill="#e6dac0" />
      <rect x="206" y="340" width="82" height="16" rx="4" fill="#b8843a" />
    </svg>
  );
}

export default function PaperPopUpBookScrollStory() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [beat, setBeat] = useState(2);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const beatRef = useRef(2);
  const api = useRef<{ go: (p: number) => void } | null>(null);

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
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uTh", "uA", "uTin", "uL", "uTex", "uDirect"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spreadPrint());
    gl.generateMipmap(gl.TEXTURE_2D);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    // It opens already open: the finished spread is what the first second shows.
    const s = {
      p: 1, T: 1, th: 0, thv: 0, a: RISE.map(() => 1), av: RISE.map(() => 0),
      px: 0, py: 0, sx: 0, sy: 0, count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, first: true, fpsN: 0, fpsT: 0,
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.2e6 / (cssW * cssH * dpr * dpr)));
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

    // A three-quarter view from the front and a little to the right, as if the book lay on your desk.
    const camera = () => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      const el = (wide ? 0.6 : 0.68) - s.sy * 0.03, az = 0.2 + s.sx * 0.08, dist = 11;
      const tgt = [0.0, 0.42, 0.05];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] + dist * Math.cos(az) * Math.cos(el)];
      const foc = wide ? 1.9 * Math.min(1, aspect / 1.65) : 1.04 * Math.min(1.5, aspect / 0.5);
      const shift = wide ? [0.24 * aspect / 1.68, -0.03] : [0.0, 0.15];
      return { cam, tgt, foc, shift, wide };
    };

    const draw = (alpha: number, sample: number) => {
      const c = camera();
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.06 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]); gl.uniform3f(su.uTgt, c.tgt[0], c.tgt[1], c.tgt[2]);
      gl.uniform1f(su.uFoc, c.foc);
      gl.uniform2f(su.uShift, c.shift[0], c.shift[1]);
      gl.uniform1f(su.uFocus, Math.hypot(c.cam[0], c.cam[1] - 0.4, c.cam[2] - 0.2));
      gl.uniform1f(su.uTh, s.th);
      gl.uniform4f(su.uA, s.a[0], s.a[1], s.a[2], s.a[3]);
      gl.uniform1f(su.uTin, s.a[4]);
      const lx = -0.7, ly = 0.72, lz = -0.36, ll = Math.hypot(lx, ly, lz);
      gl.uniform3f(su.uL, lx / ll, ly / ll, lz / ll);
      gl.uniform1i(su.uTex, 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, c.wide ? 0.62 : 0.5, c.wide ? 0.45 : 0.62);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    // Every target follows from one number: how far through the story the reader is.
    const targets = (p: number) => ({ th: Math.PI * (1 - sm(COVER[0], COVER[1], p)), a: RISE.map(([a, b]) => sm(a, b, p)) });
    const snap = () => { const t = targets(s.p); s.th = t.th; s.thv = 0; s.a = t.a; s.av = RISE.map(() => 0); s.count = 0; };
    const setP = (p: number) => {
      s.T = Math.max(0, Math.min(1, p));
      if (reduce) { s.p = s.T; snap(); }
      const b = beatOf(reduce ? s.p : s.T);
      if (b !== beatRef.current) { beatRef.current = b; setBeat(b); }
      wake();
    };
    api.current = { go: (p: number) => { s.touched = true; setP(p); } };

    // The self-running demo: hold the open spread, close it, then open it a fold at a time.
    const demo = (ms: number) => {
      if (ms < 5200) return 1;
      const t = ((ms - 5200) / 1000) % 14;
      return t < 2 ? 0 : t < 4.8 ? beats[0].at : t < 7.6 ? beats[1].at : 1;
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) s.t0 = now;
      if (!still && !s.touched) { const d = demo(now - s.t0); if (d !== s.T) setP(d); }

      let moving = false;
      if (!reduce) {
        s.p += (s.T - s.p) * (1 - Math.exp(-dt * 2.6));
        if (Math.abs(s.T - s.p) < 0.0005) s.p = s.T;
        const tg = targets(s.p);
        const sub = 4, h = dt / sub;
        for (let k = 0; k < sub; k++) {
          // the board is heavy: it lands, bounces once off the table and settles
          s.thv += (62 * (tg.th - s.th) - 8.5 * s.thv) * h; s.th += s.thv * h;
          if (s.th < 0) { s.th = 0; if (s.thv < 0) s.thv *= -0.22; }
          // card springs up past upright and sways back
          for (let i = 0; i < RISE.length; i++) {
            s.av[i] += (150 * (tg.a[i] - s.a[i]) - 9 * s.av[i]) * h; s.a[i] = Math.max(0, s.a[i] + s.av[i] * h);
          }
        }
        if (Math.abs(s.T - s.p) > 0 || Math.abs(s.thv) > 0.002 || Math.abs(tg.th - s.th) > 0.001 || s.av.some((v, i) => Math.abs(v) > 0.002 || Math.abs(tg.a[i] - s.a[i]) > 0.001)) moving = true;
      }
      if (!still) {
        const ox = s.sx, oy = s.sy;
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        if (Math.abs(s.sx - ox) + Math.abs(s.sy - oy) > 1e-4) moving = true;
      }

      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(0.55, 1 + (s.frame % 64)); s.count = 3; }
      else if (s.count < 36) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      if (!still && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 45 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }
      s.fpsN++; if (now - s.fpsT > 1000) { box.dataset.fps = String(Math.round((s.fpsN * 1000) / (now - s.fpsT))); s.fpsN = 0; s.fpsT = now; }

      if (moving || s.count < 36 || (!still && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    // Scrolling drives the story once the reader starts to scroll: closed as the book enters the
    // window, fully open by the time it sits in the middle.
    const onScroll = () => {
      const r = box.getBoundingClientRect(), vh = window.innerHeight || 800;
      if (r.bottom < 0 || r.top > vh) return;
      s.touched = true;
      setP((vh * 0.95 - r.top) / (vh * 0.95 - Math.max(0, (vh - r.height) / 2) + 1));
    };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.02 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("scroll", onScroll, { passive: true });
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!still) wake();
    };
    const leave = () => { s.px = 0; s.py = 0; };
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("scroll", onScroll);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const choose = (i: number) => {
    if (api.current) api.current.go(beats[i].at); else { beatRef.current = i; setBeat(i); }
  };
  const keys = (e: React.KeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? beats.length - 1 : -9;
    if (next === -9) return;
    e.preventDefault();
    const k = Math.max(0, Math.min(beats.length - 1, next));
    choose(k);
    document.getElementById(`ppb-fold-${k}`)?.focus();
  };
  const b = beats[beat];

  return (
    <section className="relative isolate overflow-hidden bg-[#e7ddcd] text-[#1d1a15]" style={{ fontFamily: FONT }}>
      <div ref={stage} className="relative mx-auto h-[840px] w-full max-w-[1600px] sm:h-[860px] lg:h-[760px]" style={{ background: "radial-gradient(90% 80% at 62% 55%, #efe6d8 0%, #e2d6c3 60%, #d3c4ad 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        {shown === "still" && <Still />}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-8 sm:px-10 lg:bottom-auto lg:top-0 lg:w-[44%] lg:px-16 lg:pt-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#1d1a15]/65">{BRAND}<span className="mx-2 text-[#1d1a15]/30">/</span>{STORY}</p>
          <div aria-live="polite" className="mt-5 lg:mt-10">
            <p className="flex items-baseline gap-3 text-[13px] font-medium tabular-nums tracking-[-0.01em] text-[#8a4a1c]">
              <span>Fold {String(beat + 1).padStart(2, "0")} of {String(beats.length).padStart(2, "0")}</span>
              <span className="h-px w-8 bg-[#8a4a1c]/40" />
              <span>{b.fold}</span>
            </p>
            <h2 key={b.title} className="mt-3 max-w-[9ch] animate-[ppb-rise_0.7s_cubic-bezier(0.2,0.9,0.25,1.15)_both] text-[44px] font-semibold leading-[0.92] tracking-[-0.045em] motion-reduce:animate-none sm:text-[58px] lg:text-[78px]">{b.title}</h2>
            <p key={b.body} className="mt-4 max-w-[25rem] animate-[ppb-fade_0.9s_ease-out_0.12s_both] text-[17px] italic leading-snug text-[#1d1a15]/75 motion-reduce:animate-none lg:mt-6 lg:text-[21px]" style={{ fontFamily: SERIF }}>{b.body}</p>
          </div>
          <div role="group" aria-label="Story folds" className="pointer-events-auto mt-6 flex gap-2 lg:mt-12">
            {beats.map((x, i) => (
              <button
                key={x.fold}
                id={`ppb-fold-${i}`}
                type="button"
                aria-pressed={i === beat}
                tabIndex={i === beat ? 0 : -1}
                onClick={() => choose(i)}
                onKeyDown={(e) => keys(e, i)}
                className={`flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-[14px] font-medium tracking-[-0.01em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#8a4a1c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7ddcd] motion-reduce:transition-none ${i === beat ? "border-[#1d1a15] bg-[#1d1a15] text-[#f3ece0]" : "border-[#1d1a15]/25 text-[#1d1a15]/75 hover:border-[#1d1a15]/60 hover:text-[#1d1a15]"}`}
              >
                <span className="text-[11px] tabular-nums opacity-70">{String(i + 1).padStart(2, "0")}</span>
                {x.fold}
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes ppb-rise { from { opacity: 0; transform: translateY(18px) rotateX(55deg); transform-origin: 50% 100%; } to { opacity: 1; transform: none; } }
        @keyframes ppb-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </section>
  );
}
