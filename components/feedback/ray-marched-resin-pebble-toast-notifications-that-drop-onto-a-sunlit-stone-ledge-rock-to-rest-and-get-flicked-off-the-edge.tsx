import { useEffect, useRef, useState } from "react";

type Kind = "success" | "warning" | "error";
type Toast = { id: number; kind: Kind; title: string; body: string };

// What each kind is cast in, what it says and which mark is printed beside the word.
const KINDS: Record<Kind, { label: string; resin: [number, number, number]; css: string; ink: string }> = {
  success: { label: "Done", resin: [0.42, 0.74, 0.5], css: "#8fcf9f", ink: "#1d4a2c" },
  warning: { label: "Check", resin: [0.98, 0.6, 0.24], css: "#f6b26b", ink: "#6a3510" },
  error: { label: "Failed", resin: [0.96, 0.32, 0.33], css: "#f08a86", ink: "#6b1616" },
};
// The demo feed. The first three are already on the ledge when the page opens.
const FEED: Omit<Toast, "id">[] = [
  { kind: "success", title: "Saved", body: "The spring menu draft for Larkspur Kitchen is safe." },
  { kind: "warning", title: "Card due", body: "The card ending 4417 runs out on 30 November." },
  { kind: "error", title: "Not sent", body: "The invoice to orders@tallowmere.example bounced back." },
  { kind: "success", title: "Published", body: "New opening hours are live on the site." },
  { kind: "warning", title: "Heavy", body: "hero.jpg is 9 MB and will crawl on a phone." },
  { kind: "error", title: "Offline", body: "Connection lost. Your edits wait here until it is back." },
  { kind: "success", title: "Invited", body: "Ines Barrow can now edit the gallery page." },
];
const START = 4; // pebbles on the ledge at load
const MAX = 4; // more than this and the oldest is flicked off the end
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

// Pebble half sizes (x across, y height, z depth), the ledge's front edge, the wall behind.
const RAD = [0.6, 0.25, 0.35];
const STEP = 1.33;
const LZ = 5.0;
const BACK = -2.7; // the far edge they are flicked over
const N = 5;
const ROWS = 8;

const VERT = `#version 300 es
in vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 curve(vec3 x){ return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 tone(vec3 x){ x *= 0.78; float m = max(max(x.r, x.g), max(x.b, 1e-4)); vec3 h = x * (curve(vec3(m)).r / m); return pow(mix(curve(x), h, 0.4), vec3(1.0 / 2.2)); }
`;

const SCENE = `#version 300 es
precision highp float;
out vec4 outC;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus; uniform float uDirect; uniform float uT;
uniform vec3 uP[5]; uniform mat3 uR[5]; uniform vec3 uA[5]; uniform vec4 uK[5];
uniform sampler2D uTex;
const vec3 RAD = vec3(${RAD.join(", ")});
const float TOP = 0.165;
uniform float LZ;
const float WZ = ${BACK.toFixed(2)};
const vec3 L = vec3(-0.42, 0.7, -0.58);
const vec3 SUNC = vec3(1.0, 0.9, 0.76) * 3.4;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * n2(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
float smax(float a, float b, float k){ return -smin(-a, -b, k); }
float sdEll(vec3 p, vec3 r){ float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / k1; }
// A cast lozenge: an ellipsoid with its top ground flat so a message can be printed on it.
float sdPeb(vec3 q){ return smax(sdEll(q, RAD), q.y - TOP, 0.07); }
float mapP(vec3 p, out int id){
  float d = 1e5; id = -1;
  for (int i = 0; i < 5; i++) {
    if (uK[i].x < 0.5) continue;
    vec3 o = p - uP[i]; float b = length(o) - 0.64;
    float di = b > 0.45 ? b : sdPeb(o * uR[i]);
    if (di < d) { d = di; id = i; }
  }
  return d;
}
float mapS(vec3 p){ int k; return mapP(p, k); }
vec2 range(vec3 ro, vec3 rd, float R){
  float t0 = 1e9, t1 = -1.0;
  for (int i = 0; i < 5; i++) {
    if (uK[i].x < 0.5) continue;
    vec3 oc = ro - uP[i]; float b = dot(oc, rd); float h = b * b - dot(oc, oc) + R * R;
    if (h > 0.0) { h = sqrt(h); t0 = min(t0, -b - h); t1 = max(t1, -b + h); }
  }
  return vec2(max(t0, 0.0), t1);
}
float marchP(vec3 ro, vec3 rd, out int id){
  id = -1; vec2 r = range(ro, rd, 0.66); if (r.y < r.x) return -1.0;
  float t = r.x;
  for (int i = 0; i < 90; i++) { int k; float d = mapP(ro + rd * t, k); if (d < 0.0004 * (1.0 + t * 0.15)) { id = k; return t; } t += d; if (t > r.y) break; }
  return -1.0;
}
vec3 nrmP(vec3 p){ vec2 e = vec2(0.0008, -0.0008); return normalize(e.xyy * mapS(p + e.xyy) + e.yyx * mapS(p + e.yyx) + e.yxy * mapS(p + e.yxy) + e.xxx * mapS(p + e.xxx)); }
float shadowP(vec3 ro, vec3 rd, float k){
  vec2 r = range(ro, rd, 0.95); if (r.y < 0.0 || r.y < r.x) return 1.0;
  float res = 1.0; float t = max(r.x, 0.01);
  for (int i = 0; i < 30; i++) { float h = mapS(ro + rd * t); res = min(res, k * h / t); t += clamp(h, 0.015, 0.2); if (res < 0.002 || t > r.y) break; }
  return clamp(res, 0.0, 1.0);
}
// The pebble as a plain ellipsoid, solved exactly: how far a ray travels inside, and how close it passes to the middle.
vec3 chord(int i, vec3 ro, vec3 rd, float grow){
  vec3 r = RAD * grow;
  vec3 o = ((ro - uP[i]) * uR[i]) / r; vec3 d = (rd * uR[i]) / r;
  float a = dot(d, d); float b = dot(o, d); float c = dot(o, o) - 1.0; float h = b * b - a * c;
  if (h < 0.0) return vec3(0.0, 9.0, 0.0);
  h = sqrt(h); float t0 = (-b - h) / a; float t1 = (-b + h) / a;
  if (t1 < 0.0) return vec3(0.0, 9.0, 0.0);
  return vec3(t1 - max(t0, 0.0), dot(o, o) - b * b / a, t1);
}
vec3 sigOf(vec3 alb){ return (1.0 - alb) * 3.2 + 0.3; }
// Sun that has come through resin: tinted, dimmed by scattering, and gathered to a bright core where the lens is thickest.
vec3 through(vec3 g){
  vec3 T = vec3(1.0); float any = 0.0;
  for (int i = 0; i < 5; i++) {
    if (uK[i].x < 0.5) continue;
    vec3 c = chord(i, g, L, 1.1);
    if (c.x > 0.0) {
      // the lens only gathers light to a point close underneath; from higher up the colour spreads thin
      float near = exp(-max(c.z - 0.9, 0.0) * 1.1);
      any = 1.0; T *= mix(vec3(0.62), exp(-sigOf(uA[i]) * c.x * 1.1) * (0.3 + 1.5 * exp(-c.y * 10.0) + 0.35 * exp(-c.y * 3.0)) * mix(vec3(1.0), uA[i], 0.35), near);
    }
  }
  return any > 0.5 ? T : vec3(0.3);
}
float leaves(vec3 p){
  vec3 u = normalize(cross(L, vec3(0.0, 1.0, 0.0))); vec3 v = cross(u, L);
  vec2 w = vec2(dot(p, u), dot(p, v)) * 0.9 + vec2(sin(uT * 0.45) * 0.12, cos(uT * 0.31) * 0.06);
  float f = fbm(w * 1.4 + vec2(3.0, 1.0)) + 0.18 * fbm(w * 5.0);
  float lit = smoothstep(0.5, 0.6, f);
  float reach = clamp((-p.z - 0.5 + p.x * 0.2) * 0.6, 0.0, 1.0);
  return mix(1.0, 0.16 + 0.84 * lit, reach * 0.9);
}
vec3 sky(vec3 n){ return mix(vec3(0.62, 0.54, 0.45), vec3(0.58, 0.68, 0.86), n.y * 0.5 + 0.5) * 0.52; }
vec3 stoneAlb(vec2 w){
  float strata = fbm(vec2(w.x * 0.3, w.y * 5.0));
  float fine = n2(w * 70.0);
  vec3 a = vec3(0.8, 0.69, 0.55) * (0.86 + 0.22 * strata) * (0.95 + 0.07 * fine);
  float pit = fbm(vec2(w.x * 3.0, w.y * 26.0) + 7.0);
  a *= 1.0 - 0.2 * smoothstep(0.66, 0.74, pit) - 0.06 * smoothstep(0.6, 0.66, pit);
  a = mix(a, vec3(0.88, 0.8, 0.68), 0.25 * smoothstep(0.55, 0.75, fbm(w * 0.8 + 2.0)));
  return a;
}
float aoP(vec3 p, vec3 n){
  float o = 0.0; float s = 1.0;
  for (int i = 1; i <= 4; i++) { float h = 0.03 + 0.09 * float(i); o += (h - min(mapS(p + n * h), h)) * s; s *= 0.7; }
  return clamp(1.0 - 2.2 * o, 0.0, 1.0);
}
vec3 bounce(vec3 g, vec3 n){
  vec3 b = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    if (uK[i].x < 0.5) continue;
    vec3 v = uP[i] - g; float d2 = dot(v, v);
    b += uA[i] * max(dot(n, v) * inversesqrt(d2), 0.0) * 0.5 / (1.0 + d2 * 5.0);
  }
  return b * SUNC * 0.5;
}
vec3 shadeLedge(vec3 g, int face, vec3 rd){
  vec3 n = face == 0 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
  // a rounded nose along the front edge catches the sun as one bright line
  if (face == 0) n = normalize(mix(n, vec3(0.0, 0.0, 1.0), smoothstep(LZ - 0.07, LZ, g.z) * 0.85));
  else n = normalize(mix(n, vec3(0.0, 1.0, 0.0), smoothstep(-0.07, 0.0, g.y) * 0.85));
  vec2 w = face == 0 ? g.xz : vec2(g.x, g.y * 0.6 + 3.0);
  vec3 alb = stoneAlb(w);
  float tooth = n2(g.xz * 180.0 + g.y * 40.0);
  n = normalize(n + vec3(tooth - 0.5, 0.0, n2(g.zx * 180.0) - 0.5) * 0.04);
  float sh = 1.0; vec3 tr = vec3(1.0); float ao = 1.0;
  if (face == 0) { sh = shadowP(g + n * 0.002, L, 11.0); if (sh < 0.999) tr = through(g); ao = aoP(g, vec3(0.0, 1.0, 0.0)); }
  float dap = leaves(g);
  vec3 sun = SUNC * max(dot(n, L), 0.0) * dap * mix(tr, vec3(1.0), sh);
  float wallAO = 1.0;
  vec3 col = alb * (sun + sky(n) * ao * wallAO + bounce(g, n) * ao);
  // honed stone: a soft sheen, no mirror
  float f = 0.03 + 0.4 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  col += f * vec3(0.95, 0.92, 0.88) * 0.8 * ao;
  if (face == 1) col *= mix(0.5, 1.0, smoothstep(-1.6, 0.0, g.y));
  return col;
}
vec3 shadeWall(vec3 g){
  vec3 n = vec3(0.0, 0.0, 1.0);
  float m = fbm(g.xy * 1.3) * 0.6 + fbm(g.xy * 9.0) * 0.4;
  vec3 alb = vec3(0.9, 0.82, 0.74) * (0.93 + 0.1 * m);
  n = normalize(n + vec3(n2(g.xy * 40.0) - 0.5, n2(g.yx * 40.0) - 0.5, 0.0) * 0.06);
  float ao = 0.55 + 0.45 * smoothstep(0.0, 0.5, g.y);
  return alb * (SUNC * max(dot(n, L), 0.0) * leaves(g) + sky(n) * ao);
}
// Beyond the ledge: a sunny garden far out of focus, pale leaves and the bright gaps between them.
vec3 garden(vec3 rd){
  vec2 w = vec2(atan(rd.x, -rd.z) * 2.4, rd.y * 4.0);
  vec3 c = mix(vec3(0.62, 0.72, 0.5), vec3(1.0, 0.96, 0.86), smoothstep(-0.55, 0.1, rd.y));
  float f = fbm(w * 1.1 + 4.0);
  c = mix(c, vec3(0.42, 0.55, 0.36), smoothstep(0.4, 0.7, f) * 0.6);
  c = mix(c, vec3(0.98, 0.9, 0.74), smoothstep(0.55, 0.8, fbm(w * 0.7 + 9.0)) * 0.5);
  float b = 0.0;
  for (int i = 0; i < 12; i++) {
    vec2 o = vec2(h21(vec2(float(i), 3.1)) * 5.0 - 2.5, -1.9 + h21(vec2(float(i), 7.7)) * 1.0);
    float rr = 0.07 + 0.07 * h21(vec2(float(i), 1.3));
    b += smoothstep(rr, rr - 0.02, length(w - o)) * (0.5 + 0.5 * h21(vec2(float(i), 5.5)));
  }
  return c * 1.2 + vec3(1.0, 0.96, 0.84) * b * 0.22;
}
vec3 envR(vec3 p, vec3 r){
  // seen in a slightly soft coat, so the line where stone meets garden is a blur, not a seam
  vec3 stone = vec3(0.8, 0.7, 0.57) * (SUNC * L.y * 0.85 + sky(vec3(0.0, 1.0, 0.0)));
  vec3 g = garden(vec3(r.x, max(r.y, 0.02), r.z)) * 1.3;
  vec3 c = mix(stone, g, smoothstep(-0.22, 0.25, r.y));
  // and a broad bright sky panel high behind the ledge
  c += vec3(1.0, 0.97, 0.9) * 2.2 * smoothstep(0.55, 0.85, dot(r, normalize(vec3(-0.2, 0.75, -0.6))));
  return c;
}
vec3 shadePeb(vec3 p, vec3 n, vec3 rd, int id){
  vec3 q = (p - uP[id]) * uR[id]; vec3 nl = n * uR[id];
  vec3 alb = uA[id]; vec3 sig = sigOf(alb);
  // tiny casting flaws: a soft orange peel and the odd pinhole bubble just under the skin
  vec3 gn = n;
  n = normalize(n + (vec3(n2(q.xz * 26.0), n2(q.zy * 26.0 + 3.0), n2(q.yx * 26.0 + 7.0)) - 0.5) * 0.035);
  float ndv = clamp(dot(-rd, n), 0.0, 1.0);
  float sh = mix(shadowP(p + gn * 0.02, L, 5.0), 1.0, 0.25) * leaves(p);
  float ndl = (dot(n, L) + 0.45) / 1.45;
  // light that came in on the sunny side and is still travelling when it reaches this point
  float dsun = chord(id, p - n * 0.006, L, 1.0).z;
  vec3 dv = refract(rd, n, 1.0 / 1.5);
  float dview = chord(id, p - n * 0.006, dv, 1.0).z;
  float ground = smoothstep(-0.02, 0.3, p.y - (q.y < 0.0 ? 0.0 : -1.0)) ;
  float ao = mix(0.35, 1.0, smoothstep(0.0, 0.26, p.y)) * aoP(p, n);
  if (p.z > LZ) ao = 1.0;
  vec3 diff = alb * (SUNC * max(ndl, 0.0) * sh * 0.5 + sky(n) * ao + vec3(0.8, 0.69, 0.55) * SUNC * L.y * 0.22 * max(-n.y, 0.0) * ao);
  vec3 sss = alb * SUNC * exp(-sig * (dsun + 0.15)) * 0.9 * mix(1.0, sh, 0.5) * (0.55 + 0.45 * (1.0 - ndv));
  // cast resin is never perfectly even: a slow cloud of denser pigment drifts through it
  float cloud = fbm(q.xz * 3.2 + q.y * 2.0 + float(id) * 3.7);
  vec3 body = (diff + sss * (0.75 + 0.5 * cloud)) * mix(vec3(1.0), exp(-sig * dview * 0.5), 0.6) * (0.94 + 0.12 * cloud);
  // light that wraps round the thin rim reads as a soft glow on the edge facing the sun
  body += mix(alb, vec3(1.0), 0.3) * SUNC * 0.42 * pow(1.0 - ndv, 3.0) * max(dot(rd, L), 0.0) * smoothstep(-0.2, 0.4, dot(gn, L)) * sh;
  // the message, pad printed on the flat top in the deepest shade of the resin
  if (nl.y > 0.4 && abs(q.x) < 0.5 && abs(q.z) < 0.25) {
    vec2 uv = vec2(q.x + 0.5, (uK[id].y + q.z * 2.0 + 0.5) / ${ROWS}.0);
    float ink = smoothstep(0.18, 0.62, texture(uTex, uv).r) * smoothstep(0.4, 0.7, nl.y);
    vec3 inkC = alb * alb * alb * 0.07 + 0.004;
    body = mix(body, inkC * (SUNC * max(ndl, 0.0) * sh * 0.5 + sky(n) * 1.5), ink);
  }
  float f = 0.035 + 0.6 * pow(1.0 - ndv, 5.0);
  vec3 r = reflect(rd, n);
  vec3 refl = envR(p + n * 0.01, r) * mix(0.4, 1.0, ao);
  float spec = pow(max(dot(r, L), 0.0), 600.0) * 30.0 + pow(max(dot(r, L), 0.0), 40.0) * 0.9;
  return body * (1.0 - f) + f * refl + SUNC * spec * sh * 0.25;
}
void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))); vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * uJit.z + up * uJit.w; rd = normalize(fp - ro);
  int id; float tp = marchP(ro, rd, id);
  float ts = 1e9; int face = -1;
  if (rd.y < 0.0) { float t = -ro.y / rd.y; vec3 g = ro + rd * t; if (g.z < LZ && g.z > WZ) { ts = t; face = 0; } }
  if (rd.z < 0.0) {
    float t = (LZ - ro.z) / rd.z; vec3 g = ro + rd * t; if (g.y < 0.0 && t < ts) { ts = t; face = 1; }
    t = (WZ - ro.z) / rd.z; g = ro + rd * t; if (g.y < 0.0 && t < ts && rd.y < 0.0) { ts = t; face = 3; }
  }
  vec3 col;
  if (tp > 0.0 && tp < ts && id >= 0) { vec3 p = ro + rd * tp; col = shadePeb(p, nrmP(p), rd, id); }
  else if (face == 0 || face == 1) col = shadeLedge(ro + rd * ts, face, rd);
  else if (face == 3) col = garden(rd) * 0.55;
  else col = garden(rd);
  col = min(col, vec3(30.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

const POST = `#version 300 es
precision highp float;
out vec4 outC;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain; uniform vec2 uCentre;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture(uAcc, uv).rgb;
  vec3 b = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 16.0);
    vec3 s = texture(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.025 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 2.2, 0.0), vec3(10.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.012;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.16 * smoothstep(0.35, 1.25, length(q));
  c = tone(c);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.014;
  outC = vec4(c, 1.0);
}
`;

// Small marks drawn beside each word so the kind is never told by colour alone.
function mark(g: CanvasRenderingContext2D, kind: Kind, cx: number, cy: number, s: number) {
  g.save();
  g.translate(cx, cy);
  g.strokeStyle = "#fff"; g.fillStyle = "#fff"; g.lineWidth = s * 0.15; g.lineCap = "round"; g.lineJoin = "round";
  if (kind === "success") {
    g.beginPath(); g.arc(0, 0, s * 0.5, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(-s * 0.22, s * 0.01); g.lineTo(-s * 0.05, s * 0.18); g.lineTo(s * 0.25, -s * 0.16); g.stroke();
  } else if (kind === "warning") {
    g.beginPath(); g.moveTo(0, -s * 0.5); g.lineTo(s * 0.52, s * 0.42); g.lineTo(-s * 0.52, s * 0.42); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(0, -s * 0.14); g.lineTo(0, s * 0.12); g.stroke();
    g.beginPath(); g.arc(0, s * 0.27, s * 0.055, 0, Math.PI * 2); g.fill();
  } else {
    g.beginPath(); g.arc(0, 0, s * 0.5, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(-s * 0.18, -s * 0.18); g.lineTo(s * 0.18, s * 0.18); g.moveTo(s * 0.18, -s * 0.18); g.lineTo(-s * 0.18, s * 0.18); g.stroke();
  }
  g.restore();
}
function paintRow(g: CanvasRenderingContext2D, row: number, t: Toast) {
  const W = 1024, H = 512, y0 = row * H;
  g.fillStyle = "#000"; g.fillRect(0, y0, W, H);
  g.textBaseline = "middle"; g.textAlign = "left"; g.fillStyle = "#fff";
  let size = 178;
  const set = () => { g.font = `800 ${size}px ${FONT}`; try { (g as unknown as { letterSpacing: string }).letterSpacing = `${-size * 0.035}px`; } catch { /* older canvas */ } };
  set();
  const icon = size * 0.72, gap = size * 0.2, room = 740;
  while (g.measureText(t.title).width + icon + gap > room && size > 80) { size -= 6; set(); }
  const ic = size * 0.72;
  const total = g.measureText(t.title).width + ic + size * 0.2;
  const x = W / 2 - total / 2, cy = y0 + H / 2 - size * 0.02;
  mark(g, t.kind, x + ic / 2, cy, ic);
  g.fillText(t.title, x + ic + size * 0.2, cy + size * 0.04);
}

type Peb = { id: number; row: number; kind: Kind; x: number; y: number; z: number; vx: number; vy: number; vz: number; p: number; r: number; wp: number; wr: number; yaw: number; mode: "drop" | "rest" | "off"; wait: number; off: number };
type Api = { add: (t: Toast) => void; remove: (id: number) => void; touch: () => void };

// No WebGL or reduced motion: the same ledge as a still, made from soft CSS shapes.
function Still({ toasts }: { toasts: Toast[] }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "linear-gradient(176deg, #dfe6d2 0%, #d3dcc4 24%, #efe4d4 24.4%, #f3e8d9 60%, #eadbc6 100%)" }} />
      <div className="absolute inset-x-0 top-[24%] h-[40%] opacity-70" style={{ background: "radial-gradient(28% 40% at 70% 20%, rgba(120,100,80,0.18), transparent 70%), radial-gradient(20% 30% at 88% 46%, rgba(120,100,80,0.14), transparent 70%)" }} />
      <div className="absolute left-1/2 top-[30%] flex -translate-x-1/2 items-end gap-3 sm:gap-6 lg:left-[67%] lg:top-[40%]">
        {toasts.slice(0, MAX).map((t, i) => (
          <div key={t.id} className="relative h-[54px] w-[78px] sm:h-[86px] sm:w-[150px]" style={{ transform: `translateY(${i * 10}px) rotate(${(i % 2 ? 1 : -1) * 4}deg)` }}>
            <div className="absolute left-[8%] top-[62%] h-[70%] w-[96%] rounded-[50%] blur-[6px]" style={{ background: `radial-gradient(60% 60% at 50% 40%, ${KINDS[t.kind].css}, rgba(120,90,60,0.28) 70%, transparent)`, transform: "translate(8px, 10px)" }} />
            <div className="absolute inset-0 grid place-items-center rounded-[50%]" style={{ background: `radial-gradient(80% 70% at 40% 28%, #ffffffcc 0%, ${KINDS[t.kind].css} 42%, ${KINDS[t.kind].css} 70%, ${KINDS[t.kind].ink}66 100%)`, boxShadow: "inset 0 -8px 16px rgba(0,0,0,0.1), inset 0 3px 5px rgba(255,255,255,0.75)" }}>
              <span className="-mt-3 text-[11px] font-extrabold tracking-[-0.02em] sm:text-[17px]" style={{ color: KINDS[t.kind].ink }}>{t.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

let nextId = 1;
const make = (k: number): Toast => ({ id: nextId++, ...FEED[k % FEED.length] });
const INITIAL: Toast[] = [make(0), make(1), make(2), make(3)];

export default function PebbleToastLedge() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [toasts, setToasts] = useState<Toast[]>(INITIAL);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [said, setSaid] = useState({ polite: "", urgent: "" });
  const list = useRef<Toast[]>(INITIAL);
  const feed = useRef(START);
  const api = useRef<Api | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const refocus = useRef(false);
  // when the focused notice goes, hand focus to the next dismiss button (or the drop buttons) so the keyboard is never lost
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [toasts]);

  const commit = (next: Toast[]) => { list.current = next; setToasts(next); };
  const announce = (t: Toast) => setSaid(t.kind === "error" ? { polite: "", urgent: `${KINDS[t.kind].label}: ${t.title}. ${t.body}` } : { polite: `${KINDS[t.kind].label}: ${t.title}. ${t.body}`, urgent: "" });

  const dismiss = (id: number, fromUser = true) => {
    if (fromUser) api.current?.touch();
    if (panel.current?.contains(document.activeElement)) refocus.current = true;
    api.current?.remove(id);
    commit(list.current.filter((t) => t.id !== id));
  };
  const push = (t: Toast, fromUser = true) => {
    if (fromUser) api.current?.touch();
    let next = [t, ...list.current];
    if (next.length > MAX) { const old = next[next.length - 1]; api.current?.remove(old.id); next = next.slice(0, MAX); }
    api.current?.add(t);
    commit(next);
    announce(t);
  };
  const pushKind = (kind: Kind) => {
    for (let i = 0; i < FEED.length; i++) {
      const k = feed.current++ % FEED.length;
      if (FEED[k].kind === kind) { push(make(k)); return; }
    }
  };

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) { setShown("still"); return; }
    const canAcc = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const software = /swiftshader|llvmpipe|software|basic render/i.test(info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "");
    const calm = reduce || software;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type); if (!sh) return null;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const link = (frag: string) => {
      const v = compile(gl.VERTEX_SHADER, VERT), f = compile(gl.FRAGMENT_SHADER, frag), p = gl.createProgram();
      if (!v || !f || !p) return null;
      gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    };
    const scene = link(SCENE), post = canAcc ? link(POST) : null;
    if (!scene || (canAcc && !post)) { setShown("still"); return; }
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uDirect", "uT", "uP", "uR", "uA", "uK", "uTex", "LZ"].map((n) => [n, gl.getUniformLocation(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, gl.getUniformLocation(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // The printing plates: one row of the atlas per pebble.
    const atlas = document.createElement("canvas"); atlas.width = 1024; atlas.height = 512 * ROWS;
    const ag = atlas.getContext("2d");
    const tex = gl.createTexture();
    const upload = () => {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
      gl.generateMipmap(gl.TEXTURE_2D);
      const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const s = { hold: 0, count: 0, fresh: true, frame: 0, slow: 0, visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, demoStep: 0, first: true, time: 0, dip: 0, dipV: 0, px: 0, py: 0, sx: 0, sy: 0 };
    const pebs: Peb[] = [];

    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(9e5 / (cssW * cssH * dpr * dpr)));
      const w = Math.max(2, Math.round(cssW * dpr * k)), h = Math.max(2, Math.round(cssH * dpr * k));
      if (w === W && h === H) return;
      W = w; H = h; cv.width = W; cv.height = H;
      if (acc && fbo) {
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, acc);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, W, H, 0, gl.RGBA, gl.HALF_FLOAT, null);
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

    // Where the lens is, worked out once a frame and shared by the shader and the click test.
    const view = () => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      const fx = wide ? 0.645 : 0.5, fy = wide ? 0.47 : 0.74;
      const half = wide ? Math.min(0.96 - fx, fx - 0.36) * aspect : 0.47 * aspect;
      const az = wide ? 0.24 : 0.6, el = (wide ? 0.44 : 0.52) - s.sy * 0.02;
      const foc = 2.6;
      const need = wide ? 2.5 : 2.6 * Math.cos(az) + 0.6;
      const dist = Math.min(30, Math.max(8, (need * foc) / half));
      const tgt = [0, 0.1, 0.45];
      const a = az + s.sx * 0.03;
      const cam = [tgt[0] + dist * Math.sin(a) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] + dist * Math.cos(a) * Math.cos(el)];
      return { cam, tgt, foc, dist, shift: [(fx - 0.5) * aspect, (fy - 0.5) + s.dip], aspect, centre: [fx, fy] };
    };

    const rot = (yaw: number, p: number, r: number) => {
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(p), sp = Math.sin(p), cr = Math.cos(r), sr = Math.sin(r);
      // Ry * Rx * Rz, written column by column
      const rz = [[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]];
      const rx = [[1, 0, 0], [0, cp, -sp], [0, sp, cp]];
      const ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]];
      const mul = (A: number[][], B: number[][]) => A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
      const m = mul(ry, mul(rx, rz));
      return [m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]];
    };
    const support = (p: number, r: number) => Math.sqrt((RAD[1] * Math.cos(r) * Math.cos(p)) ** 2 + (RAD[0] * Math.sin(r)) ** 2 + (RAD[2] * Math.sin(p)) ** 2);
    const slotX = (k: number) => -STEP * 1.5 + k * STEP;
    const restZ = 0.3;

    const P = new Float32Array(N * 3), R = new Float32Array(N * 9), A = new Float32Array(N * 3), K = new Float32Array(N * 4);
    const draw = (alpha: number, sample: number) => {
      const v = view();
      P.fill(0); K.fill(0);
      pebs.slice(0, N).forEach((b, i) => {
        if (b.wait > 0) return;
        P.set([b.x, b.y, b.z], i * 3);
        R.set(rot(b.yaw, b.p, b.r), i * 9);
        A.set(KINDS[b.kind].resin, i * 3);
        K.set([1, b.row, 0, 0], i * 4);
      });
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.03 * (v.dist / 10) : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, sample ? (sample * 0.61803) % 1 : 0);
      gl.uniform3f(su.uCam, v.cam[0], v.cam[1], v.cam[2]); gl.uniform3f(su.uTgt, v.tgt[0], v.tgt[1], v.tgt[2]);
      gl.uniform1f(su.uFoc, v.foc); gl.uniform2f(su.uShift, v.shift[0], v.shift[1]);
      gl.uniform1f(su.LZ, cssW >= 1024 ? LZ : LZ * 1.8); gl.uniform1f(su.uFocus, v.dist); gl.uniform1f(su.uDirect, canAcc ? 0 : 1); gl.uniform1f(su.uT, s.time);
      gl.uniform3fv(su.uP, P); gl.uniformMatrix3fv(su.uR, false, R); gl.uniform3fv(su.uA, A); gl.uniform4fv(su.uK, K);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(su.uTex, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.disable(gl.BLEND); gl.useProgram(post);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, acc);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, calm ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, v.centre[0], v.centre[1]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    // Slot order follows the list: newest on the left, everyone else moves along.
    const order = () => {
      const alive = pebs.filter((b) => b.mode !== "off");
      const ids = list.current.map((t) => t.id);
      alive.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      return alive;
    };
    const spawn = (t: Toast, settled: boolean, k: number) => {
      if (ag) { paintRow(ag, t.id % ROWS, t); upload(); }
      const rnd = Math.sin(t.id * 91.7) * 0.5 + 0.5;
      const b: Peb = { id: t.id, row: t.id % ROWS, kind: t.kind, x: slotX(k), y: settled ? RAD[1] : 5.2, z: restZ + (rnd - 0.5) * 0.12, vx: 0, vy: 0, vz: 0, p: settled ? 0 : 0.1 * (rnd - 0.3), r: settled ? 0 : -0.16 + 0.08 * rnd, wp: 0, wr: 0, yaw: (rnd - 0.5) * 0.3, mode: settled ? "rest" : "drop", wait: settled ? 0 : 0.3, off: 0 };
      pebs.push(b);
    };
    INITIAL.forEach((t, k) => spawn(t, true, k));

    const add = (t: Toast) => {
      spawn(t, reduce, 0);
      s.count = 0; wake();
    };
    const remove = (id: number) => {
      const b = pebs.find((x) => x.id === id);
      if (!b) return;
      if (reduce) pebs.splice(pebs.indexOf(b), 1);
      else { b.mode = "off"; b.off = 0; b.vz = 1.3; b.wp += 1.2; s.hold = 0.22; }
      s.count = 0; wake();
    };
    api.current = { add, remove, touch: () => { s.touched = true; } };

    const physics = (dt: number) => {
      const slots = order();
      let moving = false;
      const h = dt / 4;
      for (let step = 0; step < 4; step++) {
        // the stack waits a beat for a flicked pebble to clear before it shuffles along
        if (s.hold > 0) s.hold -= h;
        slots.forEach((b, k) => {
          if (b.wait > 0) { b.wait -= h; moving = true; return; }
          if (s.hold > 0) return;
          const tx = slotX(k);
          const ax = 74 * (tx - b.x) - 12 * b.vx;
          b.vx += ax * h; b.x += b.vx * h;
          // friction at the contact tips the pebble against the way it slides
          b.wr += (-ax * 0.11) * h;
        });
        for (const b of pebs) {
          if (b.wait > 0) continue;
          if (b.mode === "off") {
            b.off += h;
            // a little wind-up toward the lens, then the flick away over the far edge
            if (b.off > 0.13 && b.vz > 0) b.vz = -7.2;
            b.z += b.vz * h;
          }
          const over = b.z > BACK + 0.04;
          const ys = over ? support(b.p, b.r) : -99;
          b.vy -= 17 * h; b.y += b.vy * h;
          if (b.y <= ys) {
            if (b.vy < -1.4) {
              const hit = -b.vy;
              b.vy = hit * 0.26;
              b.wr += (b.r > 0 ? -1 : 1) * hit * 0.16 + (Math.random() - 0.5) * hit * 0.12;
              b.wp += (Math.random() - 0.5) * hit * 0.2;
              if (hit > 4) {
                s.dipV += hit * 0.004;
                for (const o of pebs) if (o !== b && o.mode === "rest") { o.wr += (Math.random() - 0.5) * 0.35; o.wp += (Math.random() - 0.5) * 0.25; }
              }
            } else { b.vy = 0; if (b.mode === "drop" && Math.abs(b.wr) + Math.abs(b.wp) < 0.4) b.mode = "rest"; }
            b.y = ys;
            // rocking on a curved base: gravity pulls it back level, the stone takes the energy out slowly
            b.wr += (-58 * b.r - 2.6 * b.wr) * h;
            b.wp += (-70 * b.p - 2.8 * b.wp) * h;
            if (b.mode === "off") b.vz *= Math.exp(-h * 0.9);
          } else if (b.mode === "off" && !over) {
            b.wp -= 9 * h;
          }
          b.r += b.wr * h; b.p += b.wp * h;
        }
        s.dipV += (-900 * s.dip - 30 * s.dipV) * h; s.dip += s.dipV * h;
      }
      for (let i = pebs.length - 1; i >= 0; i--) if (pebs[i].y < -6) pebs.splice(i, 1);
      for (const b of pebs) {
        if (b.wait > 0 || b.mode !== "rest" || Math.abs(b.vx) > 0.004 || Math.abs(b.wr) > 0.01 || Math.abs(b.wp) > 0.01 || Math.abs(b.r) > 0.002 || Math.abs(b.p) > 0.002) moving = true;
      }
      if (Math.abs(s.dip) > 1e-4) moving = true;
      return moving;
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 3400; }
      if (!calm && !s.touched && now > s.demoAt) {
        if (list.current.length >= MAX || (s.demoStep % 2 === 1 && list.current.length > 2)) dismiss(list.current[list.current.length - 1].id, false);
        else { push(make(feed.current++), false); }
        s.demoStep++;
        s.demoAt = now + 2900;
      }
      let moving = reduce ? false : physics(dt);
      if (!calm) {
        s.time += dt;
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
      }
      const fast = moving;
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (fast) { draw(0.55, 1 + (s.frame % 64)); s.count = 4; }
      else if (!calm) { draw(0.12, 1 + (s.frame % 64)); s.count = 8; moving = true; }
      else if (s.count < 48) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }
      if (!calm && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && scale > 0.5) { scale *= 0.84; s.slow = 0; size(); }
      if (moving || s.count < 48) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    // Tap a pebble to flick it away.
    const pick = (cx: number, cy: number) => {
      const v = view();
      const fw = norm(sub(v.tgt, v.cam)), rt = norm(cross(fw, [0, 1, 0])), up = cross(rt, fw);
      let best = -1, bd = 1e9;
      for (const b of pebs) {
        if (b.mode === "off" || b.wait > 0) continue;
        const d = sub([b.x, b.y, b.z], v.cam);
        const z = dot(d, fw);
        const u = (dot(d, rt) / z) * v.foc + v.shift[0], w = (dot(d, up) / z) * v.foc + v.shift[1];
        const sx = cssW / 2 + u * cssH, sy = cssH / 2 - w * cssH;
        const rpx = (RAD[0] * v.foc / z) * cssH;
        const dd = Math.hypot(cx - sx, (cy - sy) * 1.6);
        if (dd < rpx && dd < bd) { bd = dd; best = b.id; }
      }
      return best;
    };
    const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const norm = (a: number[]) => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    const click = (e: MouseEvent) => {
      const r = box.getBoundingClientRect();
      const id = pick(e.clientX - r.left, e.clientY - r.top);
      if (id > 0) dismiss(id);
    };
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      cv.style.cursor = pick(e.clientX - r.left, e.clientY - r.top) > 0 ? "pointer" : "default";
      if (!calm) wake();
    };
    const leave = () => { s.px = 0; s.py = 0; };
    cv.addEventListener("click", click);
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();
    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      cv.removeEventListener("click", click); cv.removeEventListener("webglcontextlost", lost);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lead = toasts[0];
  const rest = toasts.slice(1);
  const Icon = ({ kind, className }: { kind: Kind; className?: string }) => (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {kind === "success" && (<><circle cx="12" cy="12" r="9" /><path d="M8 12.2l2.7 2.7L16.4 9" /></>)}
      {kind === "warning" && (<><path d="M12 3.5l9 16H3z" /><path d="M12 10v4" /><circle cx="12" cy="17" r="0.6" fill="currentColor" /></>)}
      {kind === "error" && (<><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></>)}
    </svg>
  );

  return (
    <section
      className="relative isolate overflow-hidden bg-[#eadccb] text-[#2b1d12]"
      style={{ fontFamily: FONT }}
      onKeyDown={(e) => { if (e.key === "Escape" && list.current[0]) dismiss(list.current[0].id); }}
    >
      <div ref={stage} className="relative h-[900px] w-full sm:h-[860px] lg:h-[760px]">
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        {shown === "still" && <Still toasts={toasts} />}

        <div className="pointer-events-none absolute inset-0 mx-auto flex max-w-[1600px] flex-col justify-end px-5 pb-6 sm:px-10 lg:justify-between lg:px-16 lg:pb-12 lg:pt-12">
          <p className="hidden text-[11px] font-semibold uppercase tracking-[0.32em] text-[#2b1d12] lg:block">Quarry &amp; Fennel <span className="mx-2 text-[#2b1d12]/40">/</span> cast resin notices</p>
          <div ref={panel} className="pointer-events-auto w-full max-w-[25rem] rounded-[28px] bg-[#f7efe5]/80 p-5 backdrop-blur-md sm:p-6 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            {lead ? (
              <div key={lead.id}>
                <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.24em]" style={{ color: KINDS[lead.kind].ink }}>
                  <Icon kind={lead.kind} className="h-4 w-4" /> {KINDS[lead.kind].label} <span className="text-[#2b1d12]/50">· newest</span>
                </p>
                <h2 className="pebble-toast-word mt-2 text-[64px] leading-[0.86] tracking-[-0.04em] sm:text-[84px] lg:text-[108px]" style={{ fontFamily: SERIF }}>{lead.title}</h2>
                <div className="mt-3 flex items-start gap-3 lg:mt-5">
                  <p className="flex-1 text-balance text-[15px] font-medium leading-[1.45] tracking-[-0.01em] lg:text-[17px]">{lead.body}</p>
                  <button type="button" onClick={() => dismiss(lead.id)} aria-label={`Dismiss: ${lead.title}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2b1d12] text-[#f7efe5] outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-[#2b1d12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eadccb] motion-reduce:transition-none">
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-[64px] leading-[0.86] tracking-[-0.04em] lg:text-[108px]" style={{ fontFamily: SERIF }}>All clear</h2>
                <p className="mt-3 text-[15px] font-medium lg:text-[17px]">Nothing left on the ledge. Drop a new notice below.</p>
              </div>
            )}
            {rest.length > 0 && (
              <ul className="mt-5 divide-y divide-[#2b1d12]/10 border-y border-[#2b1d12]/10">
                {rest.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-1.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ background: KINDS[t.kind].css, color: KINDS[t.kind].ink }}><Icon kind={t.kind} className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1 truncate text-[14px]"><span className="font-semibold">{t.title}</span><span className="text-[#2b1d12]/70"> · {KINDS[t.kind].label}</span></span>
                    <button type="button" onClick={() => dismiss(t.id)} aria-label={`Dismiss: ${t.title}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#2b1d12] outline-none hover:bg-[#2b1d12]/10 focus-visible:ring-2 focus-visible:ring-[#2b1d12]">
                      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#2b1d12]/80">Drop</span>
              {(Object.keys(KINDS) as Kind[]).map((k) => (
                <button key={k} type="button" onClick={() => pushKind(k)} className="flex h-10 items-center gap-2 rounded-full bg-white/70 pl-2 pr-4 text-[14px] font-semibold text-[#2b1d12] outline-none ring-1 ring-[#2b1d12]/10 transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-[#2b1d12]">
                  <span className="grid h-6 w-6 place-items-center rounded-full" style={{ background: KINDS[k].css, color: KINDS[k].ink }}><Icon kind={k} className="h-3.5 w-3.5" /></span>
                  {KINDS[k].label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {shown === "gl" && <p className="pointer-events-none absolute bottom-12 right-16 hidden text-[11px] font-semibold uppercase tracking-[0.3em] text-[#2b1d12]/80 lg:block">Tap a pebble to flick it off</p>}
        <div role="status" aria-live="polite" className="sr-only">{said.polite}</div>
        <div role="alert" aria-live="assertive" className="sr-only">{said.urgent}</div>
      </div>
      <style>{`
        @keyframes pebble-toast-rise { from { opacity: 0; transform: translateY(0.14em); filter: blur(8px); } to { opacity: 1; transform: none; filter: blur(0); } }
        .pebble-toast-word { animation: pebble-toast-rise 480ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .pebble-toast-word { animation: none; } }
      `}</style>
    </section>
  );
}
