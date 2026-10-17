import { useEffect, useRef, useState } from "react";

// Everything a visitor would edit first.
const brand = {
  name: "Tarnwick Outdoor Co.",
  eyebrow: "Cabins, canoes and quiet lakes",
  headline: ["Tiny cabin.", "Big weekend."],
  line: "Hand-picked cabins on still water, a short drive from town, with the canoe already at the jetty and the kit packed for you.",
  cta: "Find a cabin",
  second: "See the routes",
};
// Colours of the set, in linear light (0 to 1), not screen values.
const LAKE = [0.035, 0.15, 0.2]; // the felt lake
const MEADOW = [0.2, 0.25, 0.075]; // the felt the whole board is covered in
const CABIN = [0.42, 0.06, 0.03]; // oxide red boards
const SUN = [1.0, 0.56, 0.26]; // colour of the late sun
const START = 0.86; // where the sun starts on its arc, 0 is morning and 1 is evening
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

const v3 = (c: number[]) => `vec3(${c.map((n) => n.toFixed(4)).join(", ")})`;

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const TONE = `
vec3 tone(vec3 x){ vec3 c = 1.0 - exp(-max(x, 0.0) * 1.1); c = mix(c, c * c * (3.0 - 2.0 * c), 0.35); return pow(c, vec3(1.0 / 2.2)); }
`;

// The table, the board, folded paper mountains, a felt lake with a canoe, a cabin and felt pines, all as distance fields.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uDirect;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform vec3 uSun; uniform float uLow;
const float BT = 0.16;
const vec3 LAKEC = ${v3(LAKE)}; const vec3 MEADOWC = ${v3(MEADOW)}; const vec3 CABINC = ${v3(CABIN)}; const vec3 SUNC = ${v3(SUN)};
const vec3 BACK = vec3(1.0, 0.8, 0.6);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
mat2 rot(float a){ float s = sin(a); float c = cos(a); return mat2(c, -s, s, c); }
float box(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float box2(vec2 p, vec2 b){ vec2 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }

// A sheet of paper folded into an n-sided peak: every face is flat and every fold is a sharp crease.
float peak(vec3 q, float h, float r, float n, float a0, vec2 lean){
  q.xz -= lean * q.y;
  float s = 6.2831853 / n;
  float a = atan(q.z, q.x) + a0; a = mod(a + 0.5 * s, s) - 0.5 * s;
  float x = length(q.xz) * cos(a);
  float ap = r * cos(0.5 * s);
  return max((x * h + q.y * ap - h * ap) / sqrt(h * h + ap * ap), -q.y);
}
// how far a point on a peak is from its nearest fold, in world units
float crease(vec3 q, float h, float n, float a0, vec2 lean){
  q.xz -= lean * q.y;
  float s = 6.2831853 / n;
  float a = atan(q.z, q.x) + a0; a = mod(a + 0.5 * s, s) - 0.5 * s;
  return length(q.xz) * (0.5 * s - abs(a)) + 0.0 * h;
}
float mountains(vec3 p){
  float m = peak(p - vec3(-0.78, BT, 0.58), 1.45, 0.92, 5.0, 0.3, vec2(0.1, -0.04));
  m = min(m, peak(p - vec3(0.18, BT, 0.72), 1.95, 1.0, 6.0, 1.1, vec2(-0.05, 0.02)));
  m = min(m, peak(p - vec3(1.02, BT, 0.52), 1.28, 0.76, 5.0, 0.7, vec2(-0.12, 0.0)));
  m = min(m, peak(p - vec3(-1.26, BT, 0.24), 0.9, 0.54, 4.0, 0.2, vec2(0.06, 0.0)));
  m = min(m, peak(p - vec3(-0.25, BT, 0.12), 0.62, 0.5, 5.0, 2.2, vec2(0.0, 0.05)));
  return max(m, box2(p.xz, vec2(1.86, 1.2)));
}
// which sheet a point is on, for its colour
float sheet(vec3 p){
  float b = 1e9; float id = 0.0; float d;
  d = peak(p - vec3(-0.78, BT, 0.58), 1.45, 0.92, 5.0, 0.3, vec2(0.1, -0.04)); if (d < b) { b = d; id = 0.0; }
  d = peak(p - vec3(0.18, BT, 0.72), 1.95, 1.0, 6.0, 1.1, vec2(-0.05, 0.02)); if (d < b) { b = d; id = 1.0; }
  d = peak(p - vec3(1.02, BT, 0.52), 1.28, 0.76, 5.0, 0.7, vec2(-0.12, 0.0)); if (d < b) { b = d; id = 2.0; }
  d = peak(p - vec3(-1.26, BT, 0.24), 0.9, 0.54, 4.0, 0.2, vec2(0.06, 0.0)); if (d < b) { b = d; id = 3.0; }
  d = peak(p - vec3(-0.25, BT, 0.12), 0.62, 0.5, 5.0, 2.2, vec2(0.0, 0.05)); if (d < b) { b = d; id = 4.0; }
  return id;
}
float lake(vec3 p){
  vec3 q = p - vec3(-0.6, BT, -0.42);
  float e = (length(q.xz / vec2(0.8, 0.44)) - 1.0) * 0.44;
  vec2 w = vec2(e + 0.012, q.y - 0.012);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.012;
}
float canoe(vec3 p){
  vec3 q = p - vec3(-0.42, BT + 0.03, -0.5); q.xz = rot(0.35) * q.xz;
  vec3 r = vec3(0.24, 0.045, 0.06);
  float k0 = length(q / r); float k1 = length(q / (r * r));
  return max(k0 * (k0 - 1.0) / k1, q.y - 0.006);
}
vec3 cabinLocal(vec3 p){ vec3 q = p - vec3(0.82, BT, -0.42); q.xz = rot(0.5) * q.xz; return q; }
float roofOuter(vec3 q){ vec3 r = q - vec3(0.0, 0.2, 0.0); return max(max((abs(r.z) * 0.15 + r.y * 0.2 - 0.2 * 0.15) / 0.25, -r.y - 0.0), abs(r.x) - 0.21); }
float cabinWalls(vec3 q){
  float w = box(q - vec3(0.0, 0.1, 0.0), vec3(0.17, 0.1, 0.13), 0.004);
  vec3 r = q - vec3(0.0, 0.2, 0.0);
  float gable = max(max((abs(r.z) * 0.15 + r.y * 0.2 - 0.13 * 0.15) / 0.25, -r.y), abs(r.x) - 0.17);
  float chim = box(q - vec3(0.09, 0.3, 0.06), vec3(0.025, 0.08, 0.025), 0.003);
  return min(min(w, gable), chim);
}
float cabinRoof(vec3 q){ float o = roofOuter(q); return max(o, -(o + 0.022)); }
float tree(vec3 p, vec3 c, float h, float r){
  vec3 q = p - c;
  float trunk = max(length(q.xz) - 0.018, abs(q.y - 0.04) - 0.04);
  q.y -= 0.05;
  float cone = max((length(q.xz) * h + q.y * r - h * r) / sqrt(h * h + r * r), -q.y);
  // three tiers, like felt cut and stacked
  vec3 q2 = q - vec3(0.0, h * 0.32, 0.0); float c2 = max((length(q2.xz) * h + q2.y * r - h * r * 0.82) / sqrt(h * h + r * r), -q2.y);
  return min(trunk, min(cone, c2));
}
float trees(vec3 p){
  float t = tree(p, vec3(1.36, BT, -0.12), 0.5, 0.15);
  t = min(t, tree(p, vec3(1.56, BT, -0.62), 0.42, 0.13));
  t = min(t, tree(p, vec3(1.22, BT, -0.92), 0.34, 0.11));
  t = min(t, tree(p, vec3(0.42, BT, -0.02), 0.4, 0.12));
  t = min(t, tree(p, vec3(0.62, BT, 0.12), 0.52, 0.15));
  t = min(t, tree(p, vec3(-1.55, BT, -0.88), 0.44, 0.14));
  t = min(t, tree(p, vec3(-1.62, BT, -0.32), 0.56, 0.16));
  t = min(t, tree(p, vec3(-1.3, BT, -0.98), 0.3, 0.1));
  return t;
}
float board(vec3 p){ return box(p - vec3(0.0, BT * 0.5, 0.0), vec3(1.9, BT * 0.5, 1.24), 0.03); }

vec2 U(vec2 a, vec2 b){ return a.x < b.x ? a : b; }
vec2 mapId(vec3 p){
  vec2 r = vec2(board(p), 1.0);
  r = U(r, vec2(mountains(p), 2.0));
  r = U(r, vec2(lake(p), 3.0));
  r = U(r, vec2(canoe(p), 8.0));
  vec3 q = cabinLocal(p);
  r = U(r, vec2(cabinWalls(q), 4.0));
  r = U(r, vec2(cabinRoof(q), 5.0));
  r = U(r, vec2(trees(p), 6.0));
  return r;
}
float map(vec3 p){
  float d = min(board(p), mountains(p));
  d = min(d, lake(p)); d = min(d, canoe(p));
  vec3 q = cabinLocal(p); d = min(d, min(cabinWalls(q), cabinRoof(q)));
  return min(d, trees(p));
}
vec3 nrm(vec3 p){ vec2 e = vec2(0.0012, -0.0012); return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx)); }

const vec3 BMIN = vec3(-1.95, 0.0, -1.3); const vec3 BMAX = vec3(1.95, 2.2, 1.3);
vec2 bound(vec3 ro, vec3 rd){
  vec3 inv = 1.0 / rd; vec3 a = (BMIN - ro) * inv; vec3 b = (BMAX - ro) * inv;
  vec3 lo = min(a, b); vec3 hi = max(a, b);
  return vec2(max(max(lo.x, lo.y), max(lo.z, 0.0)), min(hi.x, min(hi.y, hi.z)));
}
float march(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 110; i++) { float d = map(ro + rd * t); if (d < 0.0006 * (1.0 + t * 0.1)) return t; t += d * 0.85; if (t > tb.y) break; }
  return -1.0;
}
float shadow(vec3 p, vec3 l){
  vec2 tb = bound(p, l); if (tb.x > tb.y) return 1.0;
  float res = 1.0; float t = max(tb.x, 0.01);
  for (int i = 0; i < 40; i++) { float h = map(p + l * t); res = min(res, 14.0 * h / t); t += clamp(h, 0.012, 0.25); if (res < 0.002 || t > tb.y) break; }
  res = clamp(res, 0.0, 1.0); return res * res * (3.0 - 2.0 * res);
}
float occl(vec3 p, vec3 n){
  float o = 0.0; float w = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.03 * float(i) * float(i) * 0.6; o += (h - map(p + n * h)) * w; w *= 0.62; }
  return clamp(1.0 - 2.6 * o, 0.0, 1.0);
}

// The room beyond the table, far out of focus: a warm wall and the soft discs of a window behind the set.
vec3 env(vec3 rd){
  vec3 c = mix(vec3(0.95, 0.66, 0.44), vec3(1.05, 0.86, 0.66), smoothstep(-0.1, 0.4, rd.y));
  c *= 1.0 + 0.6 * pow(max(dot(rd, normalize(vec3(uSun.x, max(uSun.y, 0.1), uSun.z))), 0.0), 6.0) * vec3(1.0, 0.85, 0.65);
  vec2 a = vec2(atan(rd.x, rd.z), rd.y) * 7.0;
  vec2 cell = floor(a); vec2 f = fract(a) - 0.5;
  float h = h21(cell + 3.1);
  vec2 o = vec2(h21(cell + 9.7), h21(cell + 1.3)) - 0.5;
  c += vec3(1.0, 0.9, 0.7) * 0.18 * step(0.55, h) * smoothstep(0.32, 0.2, length(f - o * 0.3)) * smoothstep(-0.05, 0.25, rd.y);
  return c;
}

vec3 light(vec3 p, vec3 n, vec3 rd, vec3 alb, float sh, float ao, float sheen, float spec, float shin, float trans){
  float ndl = max(dot(n, uSun), 0.0);
  vec3 sunL = SUNC * (3.0 + 1.6 * uLow);
  vec3 sky = vec3(0.46, 0.56, 0.82) * (0.4 + 0.3 * n.y) * ao;
  vec3 bounce = vec3(0.85, 0.52, 0.3) * 0.3 * (0.5 - 0.5 * n.y) * ao;
  vec3 room = vec3(1.0, 0.78, 0.55) * 0.2 * ao * (0.5 + 0.5 * dot(n, vec3(0.0, 0.0, -1.0)));
  vec3 col = alb * (sunL * ndl * sh + sky + bounce + room);
  // light that comes through thin paper and felt from behind
  col += alb * sunL * trans * max(dot(-n, uSun), 0.0) * (0.35 + 0.65 * ao);
  float nv = max(dot(-rd, n), 0.0);
  col += sunL * sheen * pow(1.0 - nv, 3.0) * (0.25 + ndl * sh) * alb * 2.0;
  vec3 hv = normalize(uSun - rd);
  col += sunL * sh * ndl * spec * pow(max(dot(n, hv), 0.0), shin) * (shin + 8.0) / 25.0;
  return col;
}

vec3 shadeHit(vec3 p, vec3 rd, float jit){
  float id = mapId(p).y;
  vec3 n = nrm(p);
  vec3 alb = vec3(0.5); float sheen = 0.0; float spec = 0.02; float shin = 16.0; float trans = 0.0; vec3 emit = vec3(0.0);
  if (id < 1.5) {
    if (p.y > BT - 0.006 && n.y > 0.5) {
      // meadow felt: dense fibres, a little mottled where it was cut from the roll
      float f = n2(p.xz * 220.0) * 0.6 + n2(p.xz * 61.0) * 0.4;
      alb = MEADOWC * (0.8 + 0.4 * f) * (0.9 + 0.25 * n2(p.xz * 3.0));
      n = normalize(n + 0.3 * vec3(n2(p.xz * 300.0) - 0.5, 0.0, n2(p.zx * 300.0 + 4.0) - 0.5));
      sheen = 0.35; trans = 0.0;
    } else {
      // plywood edge: thin plies of birch with a dark glue line between each
      float ply = fract(p.y / BT * 5.0);
      alb = mix(vec3(0.62, 0.42, 0.24), vec3(0.3, 0.18, 0.09), smoothstep(0.82, 0.92, ply)) * (0.85 + 0.3 * n2(vec2(p.x + p.z, p.y * 3.0) * vec2(40.0, 4.0)));
      spec = 0.04; shin = 30.0;
    }
  } else if (id < 2.5) {
    float s = sheet(p);
    vec3 c0 = s < 0.5 ? vec3(-0.78, BT, 0.58) : s < 1.5 ? vec3(0.18, BT, 0.72) : s < 2.5 ? vec3(1.02, BT, 0.52) : s < 3.5 ? vec3(-1.26, BT, 0.24) : vec3(-0.25, BT, 0.12);
    vec4 cp = s < 0.5 ? vec4(5.0, 0.3, 0.1, -0.04) : s < 1.5 ? vec4(6.0, 1.1, -0.05, 0.02) : s < 2.5 ? vec4(5.0, 0.7, -0.12, 0.0) : s < 3.5 ? vec4(4.0, 0.2, 0.06, 0.0) : vec4(5.0, 2.2, 0.0, 0.05);
    float cr = crease(p - c0, 1.0, cp.x, cp.y, cp.zw);
    // soft wrinkles where the sheet was pressed over the fold, and a crisp line along each fold
    vec2 wq = p.xy * 9.0 + p.z * 5.0;
    n = normalize(n + 0.05 * vec3(n2(wq) - 0.5, n2(wq + 7.3) - 0.5, n2(wq + 3.1) - 0.5));
    alb = s < 0.5 ? vec3(0.86, 0.74, 0.56) : s < 1.5 ? vec3(0.9, 0.88, 0.83) : s < 2.5 ? vec3(0.44, 0.52, 0.36) : s < 3.5 ? vec3(0.72, 0.32, 0.17) : vec3(0.78, 0.62, 0.36);
    // cotton paper: long fibres and a faint laid texture
    float fib = n2(p.xy * vec2(90.0, 14.0) + p.z * 30.0) * 0.5 + n2(p.zy * vec2(120.0, 20.0)) * 0.5;
    alb *= 0.93 + 0.12 * fib;
    trans = 0.22; spec = 0.03; shin = 12.0;
    alb *= 1.0 - 0.18 * smoothstep(0.012, 0.0, cr);
    emit += SUNC * 0.25 * smoothstep(0.006, 0.0, cr) * max(dot(n, uSun), 0.0);
  } else if (id < 3.5) {
    vec3 q = p - vec3(-0.6, BT, -0.42);
    float e = length(q.xz / vec2(0.8, 0.44));
    float f = n2(p.xz * 200.0) * 0.6 + n2(p.xz * 40.0) * 0.4;
    alb = LAKEC * (0.75 + 0.5 * f) * mix(1.25, 0.85, smoothstep(0.2, 0.95, e));
    n = normalize(n + 0.25 * vec3(n2(p.xz * 260.0) - 0.5, 0.0, n2(p.zx * 260.0 + 2.0) - 0.5));
    sheen = 0.5;
    // a running stitch of cream thread just inside the shore
    float ang = atan(q.z / 0.44, q.x / 0.8);
    float dash = step(0.45, fract(ang * 22.0));
    float ring = smoothstep(0.03, 0.012, abs(e - 0.9)) * dash;
    alb = mix(alb, vec3(0.88, 0.8, 0.64), ring);
    // a faint lighter swirl where the felt was pressed
    alb += LAKEC * 0.5 * smoothstep(0.55, 0.0, length(q.xz - vec2(0.15, 0.05))) ;
  } else if (id < 4.5) {
    vec3 q = cabinLocal(p);
    // board and batten siding
    float bat = smoothstep(0.35, 0.5, abs(fract((q.x + q.z) * 55.0) - 0.5));
    alb = CABINC * (0.85 + 0.25 * n2(q.xy * vec2(8.0, 200.0))) * (1.0 - 0.25 * bat);
    if (q.y > 0.26) alb = vec3(0.32, 0.29, 0.26) * (0.8 + 0.4 * n2(q.xy * 120.0)); // stone chimney
    spec = 0.05; shin = 24.0;
    // lit windows and a door on the front, warm against the evening
    vec2 wq = vec2(q.x, q.y);
    if (q.z < -0.12) {
      float win = step(abs(wq.x - 0.08) , 0.035) * step(abs(wq.y - 0.12), 0.03);
      float door = step(abs(wq.x + 0.07), 0.03) * step(wq.y, 0.13);
      float cross = 1.0 - step(abs(wq.x - 0.08), 0.004) * win - step(abs(wq.y - 0.12), 0.004) * win;
      emit += vec3(1.0, 0.55, 0.18) * 2.4 * win * cross;
      alb = mix(alb, vec3(0.86, 0.78, 0.6), door * 0.85);
    }
    if (abs(q.x) > 0.165) {
      float win = step(abs(q.z), 0.035) * step(abs(q.y - 0.12), 0.03);
      emit += vec3(1.0, 0.55, 0.18) * 2.0 * win;
    }
  } else if (id < 5.5) {
    vec3 q = cabinLocal(p);
    float rows = smoothstep(0.4, 0.5, abs(fract(q.y * 70.0 + abs(q.z) * 52.0) - 0.5));
    alb = vec3(0.07, 0.065, 0.06) * (1.0 - 0.3 * rows) * (0.9 + 0.2 * n2(q.xz * 90.0));
    spec = 0.06; shin = 18.0;
  } else if (id < 6.5) {
    float f = n2(p.xz * 240.0 + p.y * 60.0);
    alb = p.y < BT + 0.052 ? vec3(0.22, 0.12, 0.06) : vec3(0.03, 0.1, 0.05) * (0.8 + 0.4 * f) * (0.8 + 0.5 * h21(floor(p.xz * 3.0)));
    n = normalize(n + 0.2 * vec3(n2(p.xy * 300.0) - 0.5, 0.0, n2(p.zy * 300.0) - 0.5));
    sheen = 0.45; trans = 0.12;
  } else {
    vec3 q = p - vec3(-0.42, BT + 0.03, -0.5);
    q.xz = rot(0.35) * q.xz;
    float inner = length(q.xz / vec2(0.2, 0.038));
    alb = q.y > 0.004 && inner < 1.0 ? vec3(0.24, 0.13, 0.06) * (0.8 + 0.4 * step(0.5, fract(q.x * 60.0))) : vec3(0.9, 0.26, 0.03);
    spec = 0.25; shin = 60.0;
  }
  float sh = shadow(p + n * 0.003, uSun);
  float ao = occl(p, n);
  return light(p, n, rd, alb, sh, ao, sheen, spec, shin, trans) + emit;
}

// The table under the board: oiled oak with the long shadow of the set laid across it.
vec3 shadeTable(vec3 p, vec3 rd){
  vec2 g = p.xz;
  float grain = n2(vec2(g.x * 1.2 + 2.0 * n2(g * 0.6), g.y * 26.0 + 3.0 * n2(g * 1.3)));
  float fleck = n2(g * vec2(6.0, 90.0));
  float plank = smoothstep(0.004, 0.0, abs(fract(g.y / 1.1 + 0.37) - 0.5) - 0.497);
  vec3 alb = mix(vec3(0.46, 0.25, 0.11), vec3(0.62, 0.38, 0.18), grain) * (0.9 + 0.15 * fleck) * (1.0 - 0.6 * plank);
  vec3 n = vec3(0.0, 1.0, 0.0);
  float sh = shadow(p + n * 0.002, uSun);
  float d = board(p);
  float ao = 0.35 + 0.65 * smoothstep(0.0, 0.3, d);
  vec3 col = light(p, n, rd, alb, sh, ao, 0.0, 0.0, 1.0, 0.0);
  // oiled finish: a soft sheen of the room and a long glint of the sun
  float f = 0.03 + 0.97 * pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
  vec3 r = reflect(rd, n);
  col += env(r) * f * 0.35 * ao;
  col += SUNC * 3.0 * pow(max(dot(r, uSun), 0.0), 40.0) * 0.25 * sh;
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
  float t = march(ro, rd);
  vec3 col;
  float dist;
  if (t > 0.0) { col = shadeHit(ro + rd * t, rd, ign); dist = t; }
  else if (rd.y < 0.0) {
    float tf = -ro.y / rd.y; dist = tf;
    col = shadeTable(ro + rd * tf, rd);
  } else { col = env(rd); dist = 60.0; }
  // haze of the room toward the far wall
  col = mix(col, env(rd) * 0.95, 1.0 - exp(-max(dist - 9.0, 0.0) * 0.09));
  col = min(col, vec3(12.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

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
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.02 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.6, 0.0), vec3(6.0)) * (1.0 - 0.6 * r);
  }
  c += b * vec3(0.03, 0.022, 0.014);
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.16 * smoothstep(0.4, 1.3, length(q));
  c = tone(c);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.018;
  outC = vec4(c, 1.0);
}
`;

// No WebGL or reduced data: the same set laid out in CSS, already in its evening light.
function Still() {
  const peaks = [
    { l: 8, w: 30, h: 58, a: "#e9cfa6", b: "#b98e5e" },
    { l: 30, w: 34, h: 78, a: "#f3eee4", b: "#c6b9a3" },
    { l: 58, w: 28, h: 52, a: "#a9b58f", b: "#6f7c55" },
    { l: 0, w: 20, h: 36, a: "#d98a62", b: "#9a4a2a" },
  ];
  return (
    <div aria-hidden="true" className="absolute bottom-[8%] right-[4%] aspect-[16/11] w-[92%] max-w-[760px] lg:bottom-[12%] lg:w-[54%]">
      <div className="absolute inset-x-[2%] bottom-[2%] h-[16%] rounded-[50%] bg-[#6b3a1a]/30 blur-xl" />
      <div className="absolute inset-x-[4%] bottom-[8%] h-[30%] rounded-[6px] [transform:perspective(900px)_rotateX(58deg)]" style={{ background: "linear-gradient(180deg,#5e6b2a,#47521d)", boxShadow: "0 18px 0 -2px #a87a4c, 0 22px 30px rgba(80,40,10,0.35)" }} />
      {peaks.map((p, i) => (
        <div key={i} className="absolute bottom-[30%]" style={{ left: `${p.l + 6}%`, width: `${p.w}%`, height: `${p.h}%` }}>
          <div className="absolute inset-0" style={{ clipPath: "polygon(50% 0, 0 100%, 50% 100%)", background: p.a }} />
          <div className="absolute inset-0" style={{ clipPath: "polygon(50% 0, 50% 100%, 100% 100%)", background: p.b }} />
        </div>
      ))}
      <div className="absolute bottom-[14%] left-[14%] h-[13%] w-[36%] rounded-[50%]" style={{ background: "radial-gradient(ellipse at 50% 40%, #2f6f80, #163f4c 70%)", boxShadow: "inset 0 0 0 3px rgba(240,220,180,0.5)" }} />
      <div className="absolute bottom-[20%] right-[22%] h-[12%] w-[10%] bg-[#8e2414]">
        <div className="absolute -top-[70%] left-[-10%] h-[75%] w-[120%] bg-[#1d1a18]" style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
        <div className="absolute left-[60%] top-[30%] h-[30%] w-[22%] bg-[#ffb35a] shadow-[0_0_10px_#ffb35a]" />
      </div>
      {[[78, 22, 14], [86, 17, 11], [3, 18, 13], [70, 30, 10]].map(([l, b, h], i) => (
        <div key={i} className="absolute bg-[#163a1f]" style={{ left: `${l}%`, bottom: `${b}%`, width: `${h * 0.6}%`, height: `${h}%`, clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
      ))}
    </div>
  );
}

export default function PaperMountainDioramaHero() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [sun, setSun] = useState(Math.round(START * 100));
  const sunRef = useRef(START);

  useEffect(() => {
    sunRef.current = sun / 100;
  }, [sun]);

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
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(sh)); return null; }
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
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uDirect", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uSun", "uLow"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // The accumulation plate: every frame is one more exposure blended onto it.
    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const s = {
      sun: START, k: START, px: 0, sx: 0, py: 0, sy: 0, count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, alive: true, first: true, fps: 0, fpsN: 0, fpsT: 0,
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      // never more than about one and a half million pixels of tracing
      const k = Math.min(1, Math.sqrt(1.5e6 / (cssW * cssH * dpr * dpr)));
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

    const draw = (alpha: number, sample: number, time: number) => {
      const wide = cssW >= 900, aspect = cssW / cssH;
      // the camera drifts on a slow figure of eight, as if someone were leaning over the table
      const drift = still ? 0 : time;
      const az = -0.2 + Math.sin(drift * 0.11) * 0.16 + s.sx * 0.05;
      const el = 0.5 + Math.sin(drift * 0.07 + 1.0) * 0.04 - s.sy * 0.03;
      const dist = 7.6;
      const tgt = [0.02, 0.62, 0.15];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] - dist * Math.cos(az) * Math.cos(el)];
      const foc = wide ? 1.46 : Math.max(0.7, Math.min(1.34, aspect * 1.42));
      const shift = wide ? [0.2 * aspect + 0.02, -0.02] : [0, -0.2];
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.16 : 0;
      // the sun walks a low arc behind the set from morning on the left to evening on the right
      const k = s.sun;
      const sa = -2.0 + 4.0 * k, se = 0.1 + 0.34 * Math.sin(Math.PI * Math.min(1, Math.max(0, k)));
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform3f(su.uCam, cam[0], cam[1], cam[2]); gl.uniform3f(su.uTgt, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFoc, foc);
      gl.uniform2f(su.uShift, shift[0], shift[1]);
      gl.uniform1f(su.uFocus, dist);
      gl.uniform3f(su.uSun, Math.sin(sa) * Math.cos(se), Math.sin(se), Math.cos(sa) * Math.cos(se));
      gl.uniform1f(su.uLow, 1 - se / 0.44);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, wide ? 0.62 : 0.5, 0.45);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    // how far the section has travelled through the window moves the sun a little further along
    let scrollK = 0;
    const onScroll = () => {
      const r = box.getBoundingClientRect();
      scrollK = Math.max(-0.5, Math.min(0.5, -r.top / Math.max(1, r.height))) * 0.5;
      wake();
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible || !s.alive) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.05, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) s.t0 = now;
      const t = (now - s.t0) / 1000;
      // the sun eases toward wherever the slider, the pointer and the scroll put it, with a little weight
      const want = Math.max(0, Math.min(1, sunRef.current + s.px * 0.12 + scrollK));
      const before = s.sun;
      if (still) s.sun = want; else s.sun += (want - s.sun) * (1 - Math.exp(-dt * 2.6));
      s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 2)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 2));
      const sunMoved = Math.abs(s.sun - before) > 0.0004;
      if (still && sunMoved) { s.count = 0; s.fresh = true; }
      const moving = !still;
      if (s.fresh || !canAcc) { draw(1, 0, t); s.fresh = false; s.count = 1; }
      else if (moving) { draw(sunMoved ? 0.35 : 0.2, 1 + (s.frame % 64), t); s.count = 6; }
      else if (s.count < 40) { s.count++; draw(1 / s.count, s.count, t); }
      if (s.first) { s.first = false; setShown("gl"); }

      // measured, not guessed: frame rate is kept on the canvas, and long frames cost resolution
      s.fpsN++; if (now - s.fpsT > 1000) { s.fps = Math.round((s.fpsN * 1000) / (now - s.fpsT)); s.fpsN = 0; s.fpsT = now; cv.dataset.fps = String(s.fps); }
      if (!still && dtRaw > 0.024) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && scale > 0.45) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 40) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible && s.alive) { s.last = 0; s.raf = requestAnimationFrame(frame); } };
    (box as HTMLDivElement & { wake?: () => void }).wake = wake;

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.02 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("scroll", onScroll, { passive: true });
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      wake();
    };
    const leave = () => { s.px = 0; s.py = 0; wake(); };
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      s.alive = false;
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("scroll", onScroll);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      cv.removeEventListener("webglcontextlost", lost);
    };
  }, []);

  const onSun = (v: number) => {
    setSun(v);
    sunRef.current = v / 100;
    (stage.current as (HTMLDivElement & { wake?: () => void }) | null)?.wake?.();
  };
  const hour = (() => {
    const m = Math.round((5.5 + (sun / 100) * 15) * 60);
    const h = Math.floor(m / 60), mm = Math.floor((m % 60) / 15) * 15;
    return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
  })();

  return (
    <section className="relative isolate overflow-hidden bg-[#f3cfa8] text-[#2a1406]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes paper-diorama-hero-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .paper-diorama-hero-rise { animation: paper-diorama-hero-rise 800ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        .paper-diorama-hero-range { -webkit-appearance: none; appearance: none; background: transparent; }
        .paper-diorama-hero-range::-webkit-slider-runnable-track { height: 4px; border-radius: 9999px; background: linear-gradient(90deg, #f6b25a, #e0662b 50%, #7a2a52); }
        .paper-diorama-hero-range::-moz-range-track { height: 4px; border-radius: 9999px; background: linear-gradient(90deg, #f6b25a, #e0662b 50%, #7a2a52); }
        .paper-diorama-hero-range::-webkit-slider-thumb { -webkit-appearance: none; margin-top: -9px; height: 22px; width: 22px; border-radius: 9999px; background: radial-gradient(circle at 38% 34%, #fff6dc, #ffc15e 45%, #f08a2a); box-shadow: 0 0 0 4px rgba(255,236,200,0.65), 0 4px 10px rgba(120,50,10,0.35); }
        .paper-diorama-hero-range::-moz-range-thumb { border: 0; height: 22px; width: 22px; border-radius: 9999px; background: radial-gradient(circle at 38% 34%, #fff6dc, #ffc15e 45%, #f08a2a); box-shadow: 0 0 0 4px rgba(255,236,200,0.65), 0 4px 10px rgba(120,50,10,0.35); }
        @media (prefers-reduced-motion: reduce) { .paper-diorama-hero-rise { animation: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[860px] w-full max-w-[1600px] lg:h-[760px]" style={{ background: "linear-gradient(180deg, #f7dcb8 0%, #f2c99d 55%, #b77d4c 78%, #8a5530 100%)" }}>
        {shown === "still" && <Still />}
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />

        <div className="pointer-events-none relative flex h-full flex-col px-6 pb-8 pt-7 sm:px-10 lg:px-16 lg:pb-12 lg:pt-10">
          <p className="flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.26em] text-[#4a230c]">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M2 20 9 7l4 7 3-4 6 10z" /></svg>
            {brand.name}
          </p>
          <div className="paper-diorama-hero-rise mt-8 max-w-[34rem] lg:mt-[86px]">
            <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#7a3a12]">{brand.eyebrow}</p>
            <h1 className="mt-4 text-[52px] font-extrabold leading-[0.9] tracking-[-0.045em] text-[#2a1406] sm:text-[72px] lg:text-[92px]">
              {brand.headline.map((l) => <span key={l} className="block">{l}</span>)}
            </h1>
            <p className="mt-5 max-w-[26rem] text-[17px] leading-[1.5] text-[#4a2610] lg:mt-7 lg:text-[19px]">{brand.line}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 lg:mt-8">
              <a href="#" className="pointer-events-auto inline-flex h-[52px] items-center gap-3 rounded-full bg-[#1f3b2c] pl-7 pr-6 text-[15px] font-semibold text-[#fff4e2] shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_14px_30px_-12px_rgba(20,50,30,0.8)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#1f3b2c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3cfa8] motion-reduce:transition-none">
                {brand.cta}
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              </a>
              <a href="#" className="pointer-events-auto inline-flex h-11 items-center rounded-full text-[15px] font-semibold text-[#2a1406] underline decoration-[#2a1406]/30 decoration-2 underline-offset-[6px] outline-none hover:decoration-[#2a1406] focus-visible:ring-2 focus-visible:ring-[#2a1406] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3cfa8]">{brand.second}</a>
            </div>
          </div>
          <div className="pointer-events-auto mt-6 flex w-full max-w-[20rem] items-center gap-4 self-start lg:mt-12 rounded-full bg-[#fff1dc]/80 py-2 pl-4 pr-5 shadow-[0_10px_30px_-14px_rgba(90,40,10,0.5)] backdrop-blur-sm">
            <label htmlFor="paper-diorama-hero-sun" className="shrink-0 text-[11px] font-bold uppercase tracking-[0.2em] text-[#5a2a0e]">Sun</label>
            <input id="paper-diorama-hero-sun" type="range" min={0} max={100} value={sun} onChange={(e) => onSun(Number(e.target.value))} aria-valuetext={`Sun at about ${hour}`} className="paper-diorama-hero-range h-10 w-full cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#1f3b2c]" />
            <span className="w-[4.2rem] shrink-0 text-right text-[13px] font-semibold tabular-nums text-[#5a2a0e]">{hour}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
