import { useEffect, useRef, useState, type KeyboardEvent } from "react";

// The tabs. `glaze` is the colour of the tile, `pool` the darker tone the glaze takes where it gathers in the carving.
const tabs = [
  {
    id: "studio", label: "Studio", glaze: "#0b246f", pool: "#06123f",
    title: "Six wheels, one kiln and a lot of north light.",
    body: "Fennick Clay Works is a working pottery in an old lime store. We throw tableware in small runs and fire it slowly, twice, in a kiln we built ourselves.",
    note: "Open Tuesday to Saturday, 10 till 5", cta: "Read about the studio",
  },
  {
    id: "glazes", label: "Glazes", glaze: "#8eae99", pool: "#33584a",
    title: "Every glaze is mixed here from rock and ash.",
    body: "Our celadons, cobalts and iron reds are weighed out by hand in the back room. Each one breaks pale over an edge and pools dark in a carving, so no two pieces match.",
    note: "Fourteen house glazes, swatches by post", cta: "See the glaze wall",
  },
  {
    id: "classes", label: "Classes", glaze: "#d58a1e", pool: "#7a3f05",
    title: "Learn to centre clay in four Thursday evenings.",
    body: "Eight people, two potters and a wheel each. You leave with four pieces of your own, glazed in a colour you choose on the last night.",
    note: "Next course starts on the first Thursday", cta: "Book a place",
  },
  {
    id: "visit", label: "Visit", glaze: "#8e1d17", pool: "#3e0604",
    title: "Find us at the bottom of Lime Kiln Lane.",
    body: "The shop is the green door beside the yard. Seconds are on the low shelf, and the kettle is usually on if you want to watch a firing being unpacked.",
    note: "14 Lime Kiln Lane, or hello@fennick.example", cta: "Plan a visit",
  },
];
const BRAND = "Fennick Clay Works";
const PLASTER = "#e9dfd1"; // the limewash, as a screen colour, for the frame and the still picture
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

// Scene sizes, in the shader's units. A tile is TW wide, TH tall and TT thick; they stand GAP apart.
const TW = 1.0, TH = 1.12, TT = 0.3, GAP = 1.3, LEAN = 0.27, WALL = 0.95;
const ZC = WALL - TT / 2 - TH * Math.sin(LEAN) - 0.01; // where a tile stands so its top just rests on the wall

const lin = (hex: string) => [1, 3, 5].map((i) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2));
const v3 = (c: number[]) => `vec3(${c.map((n) => n.toFixed(4)).join(", ")})`;

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const TONE = `
vec3 tone(vec3 x){ vec3 c = 1.0 - exp(-max(x, 0.0) * 1.0); c = mix(c, c * c * (3.0 - 2.0 * c), 0.35); return pow(c, vec3(1.0 / 2.2)); }
`;

const glazeFn = (key: "glaze" | "pool") =>
  `vec3 ${key}C(float i){ ${tabs.map((t, i) => `if (i < ${i}.5) return ${v3(lin(t[key]))};`).join(" ")} return vec3(0.5); }`;

// One fragment shader: a limewashed wall, a plaster shelf, and the tiles, lit by a low sun through a mullioned window.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uDirect;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform float uFocus; uniform vec2 uShift;
uniform vec4 uTile[4]; uniform vec3 uSun; uniform vec2 uWin; uniform sampler2D uTex; uniform float uLod;
const float TW = ${(TW / 2).toFixed(4)}; const float TH = ${TH.toFixed(4)}; const float TT = ${(TT / 2).toFixed(4)}; const float TR = 0.12;
const float WALL = ${WALL.toFixed(4)}; const float SZ0 = -0.62; const float SB = -0.3; const float BEV = 0.045;
const vec3 PLASTER = vec3(0.78, 0.69, 0.58);
const vec3 SUNC = vec3(1.0, 0.86, 0.68); const float SUNI = 3.4;
const vec3 CLAY = vec3(0.72, 0.6, 0.47);
${glazeFn("glaze")}
${glazeFn("pool")}
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ return 0.5 * n2(p) + 0.25 * n2(p * 2.03 + 7.1) + 0.125 * n2(p * 4.01 + 3.3) + 0.0625 * n2(p * 8.1 + 1.7); }

// Each tile rocks on whichever bottom edge carries it: the back edge when it leans on the wall, the front edge past upright.
vec3 tLocal(vec3 p, vec4 t){
  vec3 q = p - vec3(t.x, 0.0, t.z);
  float pz = t.y > 0.0 ? TT : -TT;
  q.z -= pz;
  float c = cos(t.y); float s = sin(t.y);
  q = vec3(q.x, q.y * c + q.z * s, -q.y * s + q.z * c);
  q.z += pz;
  return q;
}
vec3 tWorldDir(vec3 v, float a){ float c = cos(a); float s = sin(a); return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c); }
vec3 tLocalDir(vec3 v, float a){ float c = cos(a); float s = sin(a); return vec3(v.x, v.y * c + v.z * s, -v.y * s + v.z * c); }
float dTile(vec3 q){ vec3 d = abs(q - vec3(0.0, TH * 0.5, 0.0)) - (vec3(TW, TH * 0.5, TT) - TR); return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0) - TR; }
// a box that holds a tile in any pose: a true lower bound on the distance, so far tiles cost almost nothing
float dBound(vec3 p, vec4 t){
  vec3 lo = vec3(t.x - TW - 0.06, -0.03, t.z - TT - 0.22); vec3 hi = vec3(t.x + TW + 0.06, TH + 0.06, WALL);
  vec3 c = 0.5 * (lo + hi); vec3 d = abs(p - c) - 0.5 * (hi - lo);
  return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}
vec2 mapT(vec3 p, float lim){
  vec2 r = vec2(1e5, -1.0);
  for (int i = 0; i < 4; i++) {
    vec4 t = uTile[i];
    float bb = dBound(p, t);
    float d = bb > lim ? bb : dTile(tLocal(p, t));
    if (d < r.x) r = vec2(d, float(i));
  }
  return r;
}
float dShelf(vec3 p){ vec2 c = vec2((SB + 0.0) * 0.5, (SZ0 + WALL) * 0.5); vec2 b = vec2(-SB * 0.5, (WALL - SZ0) * 0.5); vec2 d = abs(vec2(p.y, p.z) - c) - b + BEV; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - BEV; }
// shadows and occlusion need true distances near the tiles, or the bound shows up as a seam
float mapS(vec3 p){ return min(mapT(p, 1.0).x, dShelf(p)); }

// The ray against the row of tiles: a box around the row first, then sphere tracing inside it.
vec2 marchT(vec3 ro, vec3 rd, float tmax){
  vec3 lo = vec3(uTile[0].x - 0.8, -0.02, -0.75); vec3 hi = vec3(uTile[3].x + 0.8, TH + 0.1, WALL);
  vec3 inv = 1.0 / (rd + vec3(1e-6)); vec3 t0 = (lo - ro) * inv; vec3 t1 = (hi - ro) * inv;
  vec3 mn = min(t0, t1); vec3 mx = max(t0, t1);
  float tn = max(max(mn.x, mn.y), max(mn.z, 0.0)); float tf = min(min(mx.x, mx.y), min(mx.z, tmax));
  if (tn > tf) return vec2(-1.0);
  float t = tn;
  for (int i = 0; i < 80; i++) { vec2 h = mapT(ro + rd * t, 0.15); if (h.x < 0.0008) return vec2(t, h.y); t += h.x; if (t > tf) break; }
  return vec2(-1.0);
}
// The shelf and the wall are flat, so they are hit exactly.
float hitStatic(vec3 ro, vec3 rd, out vec3 n){
  float t = 1e9; n = vec3(0.0, 0.0, -1.0);
  vec2 o = ro.yz; vec2 d = rd.yz + vec2(1e-6);
  vec2 t0 = (vec2(SB, SZ0) - o) / d; vec2 t1 = (vec2(0.0, WALL) - o) / d;
  vec2 mn = min(t0, t1); vec2 mx = max(t0, t1);
  float tn = max(mn.x, mn.y); float tf = min(mx.x, mx.y);
  if (tn < tf && tn > 0.0) { t = tn; n = mn.x > mn.y ? vec3(0.0, -sign(d.x), 0.0) : vec3(0.0, 0.0, -sign(d.y)); }
  if (rd.z > 0.0) { float tw = (WALL - ro.z) / rd.z; if (tw > 0.0 && tw < t) { t = tw; n = vec3(0.0, 0.0, -1.0); } }
  return t;
}

// Sun through a tall window with glazing bars, somewhere to the left and in front of the shelf.
float windowLight(vec3 p){
  vec3 u = normalize(cross(uSun, vec3(0.0, 1.0, 0.0))); vec3 v = cross(u, uSun);
  vec2 w = vec2(dot(p, u), dot(p, v)) - uWin;
  float open = smoothstep(0.09, -0.09, max(abs(w.x) - 2.9, abs(w.y) - 2.2));
  vec2 g = abs(fract(w / vec2(1.45, 1.1) + 0.5) - 0.5) * vec2(1.45, 1.1);
  float bars = smoothstep(0.025, 0.075, g.x) * smoothstep(0.025, 0.075, g.y);
  return open * bars;
}
float gJit = 0.5;
float softShadow(vec3 ro){
  // the start is jittered every sample, so the steps never line up into rings once the frames are blended
  float res = 1.0; float t = 0.012 + 0.04 * gJit;
  for (int i = 0; i < 44; i++) {
    float h = mapS(ro + uSun * t);
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.012, 0.16) * (0.85 + 0.3 * gJit); if (res < 0.003 || t > 5.0) break;
  }
  res = clamp(res, 0.0, 1.0); return res * res * (3.0 - 2.0 * res);
}
float occl(vec3 p, vec3 n){
  float o = 0.0; float w = 1.0;
  for (int i = 1; i < 6; i++) { float h = 0.05 * float(i) * float(i) * 0.5 + 0.01; o += w * (h - mapS(p + n * h)); w *= 0.62; }
  return clamp(1.0 - 2.2 * o, 0.0, 1.0);
}

// The room the glaze mirrors: limewashed walls, a beamed ceiling and the window.
vec3 env(vec3 rd){
  float el = asin(clamp(rd.y, -1.0, 1.0)); float az = atan(rd.x, -rd.z);
  vec3 c = mix(vec3(0.28, 0.23, 0.18), vec3(0.62, 0.57, 0.5), smoothstep(-0.5, 0.7, rd.y));
  vec2 w = vec2(az + 0.62, el - 0.18);
  float frame = smoothstep(0.02, -0.02, max(abs(w.x) - 0.42, abs(w.y) - 0.5));
  vec2 g = abs(fract(w / vec2(0.28, 0.25) + 0.5) - 0.5) * vec2(0.28, 0.25);
  float bars = smoothstep(0.008, 0.016, g.x) * smoothstep(0.008, 0.016, g.y);
  c += vec3(1.0, 0.97, 0.92) * 7.5 * frame * bars * (0.75 + 0.25 * smoothstep(-0.3, 0.5, w.y));
  vec2 w2 = vec2(az - 0.32, el - 0.08);
  float f2 = smoothstep(0.012, -0.012, max(abs(w2.x) - 0.14, abs(w2.y) - 0.17));
  vec2 g2 = abs(fract(w2 / vec2(0.14, 0.17) + 0.5) - 0.5) * vec2(0.14, 0.17);
  c += vec3(0.96, 0.98, 1.0) * 6.0 * f2 * smoothstep(0.005, 0.01, g2.x) * smoothstep(0.005, 0.01, g2.y) * (0.75 + 0.25 * smoothstep(-0.2, 0.2, w2.y));
  c += SUNC * 40.0 * smoothstep(0.996, 0.999, dot(rd, uSun));
  return c;
}

// Limewash: soft mottling, trowel marks the low sun picks out, warm bounce from the shelf, colour from nearby glaze.
vec3 plaster(vec3 p, vec3 n, float full){
  if (n.y > 0.5 || n.z < -0.5) {
    // round over the front edge of the shelf
    vec2 c = vec2(SZ0 + BEV, -BEV);
    if (p.z < c.x && p.y > c.y && p.z < WALL - 0.1) { vec2 dd = normalize(vec2(p.z, p.y) - c); n = vec3(0.0, dd.y, dd.x); }
  }
  vec2 pq = n.z < -0.5 ? p.xy : p.xz + vec2(0.0, 3.7);
  float mott = fbm(pq * 0.7) - 0.5; float fine = n2(pq * 55.0) - 0.5; float trowel = fbm(pq * 2.6 + mott * 1.5) - 0.5;
  vec3 alb = PLASTER * (1.0 + 0.12 * mott + 0.04 * fine + 0.05 * trowel);
  float e = 0.025; vec2 bq = pq * 2.6 + mott * 1.5; float hx = fbm(bq + vec2(e * 2.6, 0.0)) - fbm(bq - vec2(e * 2.6, 0.0)); float hy = fbm(bq + vec2(0.0, e * 2.6)) - fbm(bq - vec2(0.0, e * 2.6));
  float gx = n2(pq * 55.0 + vec2(0.4, 0.0)) - n2(pq * 55.0 - vec2(0.4, 0.0)); float gy = n2(pq * 55.0 + vec2(0.0, 0.4)) - n2(pq * 55.0 - vec2(0.0, 0.4));
  hx += gx * 0.05; hy += gy * 0.05;
  vec3 tx = n.z < -0.5 ? vec3(1.0, 0.0, 0.0) : vec3(1.0, 0.0, 0.0); vec3 ty = n.z < -0.5 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
  n = normalize(n - (tx * hx + ty * hy) * 0.5);
  float ndl = max(dot(n, uSun), 0.0);
  float win = windowLight(p);
  float sh = 1.0; float ao = 1.0;
  if (full > 0.5) { if (ndl > 0.0 && win > 0.003) sh = softShadow(p + n * 0.004); ao = occl(p, n); }
  // the shelf hides part of the room from the wall just under it
  if (p.y < SB + 0.01 && p.z > WALL - 0.02) ao *= 0.55 + 0.45 * smoothstep(0.0, 1.1, SB - p.y);
  // the shelf is a separate pour of plaster, a shade lighter than the wall
  if (p.z < WALL - 0.02) alb *= 1.07;
  vec3 sky = mix(vec3(0.82, 0.66, 0.5), vec3(0.84, 0.84, 0.86), 0.5 + 0.5 * n.y);
  vec3 col = alb * (SUNC * SUNI * ndl * win * sh + sky * 1.08 * ao);
  // glaze throws its colour onto the plaster it stands close to
  for (int i = 0; i < 4; i++) {
    vec4 t = uTile[i]; if (dBound(p, t) > 1.2) continue;
    float d = max(dTile(tLocal(p, t)), 0.0);
    col += glazeC(float(i)) * alb * 0.5 * exp(-d * 9.0) * (0.25 + 0.75 * win) * (full > 0.5 ? 1.0 : 0.4);
  }
  return col;
}
vec3 stage(vec3 ro, vec3 rd, float full){
  vec3 n; float t = hitStatic(ro, rd, n);
  if (t > 1e8) return env(rd);
  return plaster(ro + rd * t, n, full);
}

vec3 nTile(vec3 q){ vec2 e = vec2(0.0012, -0.0012); return normalize(e.xyy * dTile(q + e.xyy) + e.yyx * dTile(q + e.yyx) + e.yxy * dTile(q + e.yxy) + e.xxx * dTile(q + e.xxx)); }

// Glaze over stoneware: pale where it thins over an edge, dark where it pools in the carving, raw clay at the foot.
vec3 shadeTile(vec3 p, vec3 rd, float id, vec2 rnd){
  vec4 t = uTile[0];
  if (id > 0.5) t = uTile[1]; if (id > 1.5) t = uTile[2]; if (id > 2.5) t = uTile[3];
  vec3 q = tLocal(p, t); vec3 nl = nTile(q);
  float edge = smoothstep(0.1, 0.36, 1.0 - max(abs(nl.x), max(abs(nl.y), abs(nl.z))));
  // carving on the front face, read from the plate
  float front = smoothstep(0.75, 0.95, -nl.z);
  vec2 fu = vec2((q.x + TW) / (2.0 * TW), q.y / TH);
  float du = 0.0035; float lod = uLod;
  vec2 au = vec2((id + clamp(fu.x, 0.0, 1.0)) / 4.0, 1.0 - clamp(fu.y, 0.0, 1.0));
  float h = TEXL(uTex, au, lod).r * front;
  float hx = (TEXL(uTex, au + vec2(du / 4.0, 0.0), lod).r - TEXL(uTex, au - vec2(du / 4.0, 0.0), lod).r) * front;
  float hy = (TEXL(uTex, au - vec2(0.0, du), lod).r - TEXL(uTex, au + vec2(0.0, du), lod).r) * front;
  // a hand-dipped surface is never flat: slow waves in the glaze bend every reflection
  vec2 wq = q.xy * vec2(1.3, 1.0) + id * 3.1;
  float wv = fbm(wq); float wx = fbm(wq + vec2(0.05, 0.0)) - wv; float wy = fbm(wq + vec2(0.0, 0.05)) - wv;
  vec3 nb = normalize(nl + vec3(hx, hy, 0.0) * 1.4 * front + vec3(wx, wy, 0.0) * 0.18 * (1.0 - edge));
  vec3 n = tWorldDir(nb, t.y);
  // glaze thickness: runs downward in streaks, thins over edges, gathers in the carving and above the foot
  float run = fbm(vec2(q.x * 4.0 + id * 5.0 + 0.6 * fbm(q.xy * 3.0), q.y * 1.4));
  float thick = 0.6 + 0.35 * run + 0.35 * (1.0 - q.y / TH) + 1.4 * h - 1.3 * edge;
  vec3 G = glazeC(id); vec3 P = poolC(id);
  vec3 thin = mix(G, vec3(0.9, 0.82, 0.68), 0.42);
  vec3 alb = mix(thin, G, smoothstep(0.1, 0.8, thick));
  // a dipped glaze is never one flat colour: slow clouds where it went on heavier
  alb *= 0.86 + 0.28 * fbm(q.xy * 2.4 + id * 7.7);
  alb = mix(alb, P, smoothstep(0.9, 1.9, thick));
  // crazing: a fine net of cracks where the glaze cooled faster than the clay, strongest in the pale celadon
  vec2 cq = q.xy * 16.0 + id * 11.0; vec2 ci = floor(cq); vec2 cf = fract(cq); float m1 = 9.0; float m2 = 9.0;
  for (int j = -1; j <= 1; j++) for (int k = -1; k <= 1; k++) {
    vec2 o = vec2(float(j), float(k)); vec2 r = o + vec2(h21(ci + o), h21(ci + o + 19.1)) - cf; float dd = dot(r, r);
    if (dd < m1) { m2 = m1; m1 = dd; } else if (dd < m2) m2 = dd;
  }
  float craze = smoothstep(0.06, 0.0, sqrt(m2) - sqrt(m1)) * (id > 0.5 && id < 1.5 ? 0.55 : 0.22) * (1.0 - edge);
  alb *= 1.0 - craze * 0.5;
  // iron speckle that comes through from the clay
  float sp = h21(floor(q.xy * 140.0) + id * 17.0); alb *= 1.0 - 0.55 * step(0.985, sp) * (1.0 - h);
  // unglazed foot, with a wavy line where the glaze stopped
  float foot = smoothstep(0.06, 0.045, q.y + 0.01 * (n2(vec2(q.x * 9.0, id)) - 0.5) * 2.0);
  alb = mix(alb, CLAY * (0.88 + 0.18 * n2(q.xz * 90.0 + q.y * 40.0)), foot);
  vec3 wp = p + n * 0.003;
  float ndl = dot(n, uSun);
  float win = windowLight(p);
  float sh = (ndl > 0.0 && win > 0.003) ? softShadow(wp) : 0.0;
  float ao = occl(p, n);
  vec3 sky = mix(vec3(0.6, 0.53, 0.45), vec3(0.8, 0.86, 0.96), 0.5 + 0.5 * n.y);
  // glaze is glassy and lets a little light under its skin, so the shadow side keeps colour
  float wrap = max((ndl + 0.25) / 1.25, 0.0);
  vec3 dif = alb * (SUNC * SUNI * wrap * win * sh + sky * 0.9 * ao);
  float nv = clamp(dot(-rd, n), 0.0, 1.0);
  float f = mix(0.05 + 0.95 * pow(1.0 - nv, 5.0), 0.0, foot);
  vec3 r = reflect(rd, n);
  r = normalize(r + vec3(rnd, rnd.x) * 0.012);
  vec3 refl = stage(wp, r, 0.0) * (0.35 + 0.65 * ao);
  // the sun's own highlight, small and hot on a glossy glaze
  vec3 hv = normalize(uSun - rd); float nh = max(dot(n, hv), 0.0);
  float a2 = 0.0035; float dd = nh * nh * (a2 - 1.0) + 1.0; float spec = a2 / (3.14159 * dd * dd);
  vec3 col = dif * (1.0 - f) + refl * f + SUNC * SUNI * spec * 0.06 * max(ndl, 0.0) * win * sh * (1.0 - foot);
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
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uSeed); gJit = ign;
  float ang = ign * 6.2831853; vec2 rnd = vec2(cos(ang), sin(ang)) * sqrt(fract(ign * 7.13 + uSeed * 3.7)) * step(0.001, uSeed);
  vec3 n; float ts = hitStatic(ro, rd, n);
  vec2 ht = marchT(ro, rd, min(ts, 40.0));
  vec3 col = ht.x > 0.0 ? shadeTile(ro + rd * ht.x, rd, ht.y, rnd) : (ts < 1e8 ? plaster(ro + rd * ts, n, 1.0) : env(rd));
  col = min(col, vec3(9.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the frame: a little bloom off the glints, the film curve, a soft vignette and grain.
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
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.018 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 3.0, 0.0), vec3(8.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.02;
  // a warm veil of light from the window side, as a lens sees it
  c += vec3(1.0, 0.8, 0.55) * 0.16 * smoothstep(1.1, 0.0, length((uv - vec2(-0.05, 1.05)) * vec2(uRes.x / uRes.y, 1.0) * 0.8));
  vec2 q = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.16 * smoothstep(0.4, 1.3, length(q));
  c = tone(c);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.018;
  outC = vec4(c, 1.0);
}
`;

// The carving on each tile: a large numeral and the tab's name, cut into the clay before the glaze went on.
function carvingPlate() {
  const TWp = 512, THp = Math.round(512 * (TH / TW));
  const cv = document.createElement("canvas");
  cv.width = TWp * 4; cv.height = THp;
  const g = cv.getContext("2d");
  if (!g) return cv;
  g.fillStyle = "#000"; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "alphabetic";
  tabs.forEach((t, i) => {
    const cx = TWp * i + TWp / 2;
    g.filter = "blur(3px)";
    g.font = `italic 400 330px ${SERIF}`;
    g.fillText(String(i + 1), cx, THp * 0.6);
    g.fillRect(cx - 40, THp * 0.72, 80, 7);
    g.filter = "none";
    void t;
  });
  return cv;
}

type Rect = { x: number; y: number; w: number; h: number; lx: number; ly: number };
type Cam = { cam: number[]; fw: number[]; rt: number[]; up: number[]; foc: number; dist: number; tgt: number[]; shift: number };

const sub = (a: number[], b: number[]) => a.map((v, i) => v - b[i]);
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: number[]) => { const l = Math.hypot(a[0], a[1], a[2]); return a.map((v) => v / l); };
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const tileX = (i: number) => (i - (tabs.length - 1) / 2) * GAP;

// One camera for the shader and for the HTML laid over it, so the buttons sit exactly on the tiles.
function camera(w: number, h: number, px = 0, py = 0): Cam {
  const desk = w >= 768, aspect = w / h;
  const dist = desk ? 7.6 : 10.4;
  const el = (desk ? 0.1 : 0.12) + py * 0.02, az = (desk ? -0.36 : -0.26) + px * 0.045;
  const tgt = [desk ? -0.12 : 0.05, 0.62, 0.25];
  const half = (tabs.length - 1) / 2 * GAP + TW / 2;
  const foc = Math.min(desk ? 2.3 : 2.0, (dist * aspect * 0.5) / (half / (desk ? 0.66 : 0.86)));
  const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] - dist * Math.cos(az) * Math.cos(el)];
  const fw = norm(sub(tgt, cam)); const rt = norm(cross([0, 1, 0], fw)); const up = cross(fw, rt);
  return { cam, fw, rt, up, foc, dist, tgt, shift: desk ? 0.17 : -0.2 };
}
function project(c: Cam, p: number[], w: number, h: number) {
  const d = sub(p, c.cam); const z = dot(d, c.fw);
  return [w / 2 + (dot(d, c.rt) / z) * c.foc * h, h / 2 - ((dot(d, c.up) / z) * c.foc + c.shift) * h];
}
function tileRects(w: number, h: number): Rect[] {
  const c = camera(w, h);
  return tabs.map((_, i) => {
    const x = tileX(i);
    const pts = [[x - TW / 2, TH, ZC - TT / 2], [x + TW / 2, TH, ZC - TT / 2], [x - TW / 2, 0, ZC - TT / 2], [x + TW / 2, 0, ZC - TT / 2], [x - TW / 2, TH * Math.cos(LEAN), ZC + TH * Math.sin(LEAN)]].map((p) => project(c, p, w, h));
    const lab = project(c, [x, -0.15, -0.62], w, h);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    return { x: x0, y: y0, w: Math.max(...xs) - x0, h: lab[1] + 12 - y0, lx: lab[0], ly: lab[1] };
  });
}

// No WebGL: the same shelf drawn as flat planes through the same camera, so the buttons still land on the tiles.
const SB_Y = -0.3, SZ0_Z = -0.62;
const SUN = [Math.sin(-0.62) * Math.cos(0.62), Math.sin(0.62), -Math.cos(-0.62) * Math.cos(0.62)];
function tilePt(i: number, a: number, lx: number, ly: number, lz: number) {
  const pz = a > 0 ? TT / 2 : -TT / 2, c = Math.cos(a), sn = Math.sin(a);
  return [tileX(i) + lx, ly * c - (lz - pz) * sn, ZC + ly * sn + (lz - pz) * c + pz];
}
function Still({ w, h, active }: { w: number; h: number; active: number }) {
  if (w < 2) return null;
  const c = camera(w, h);
  const P = (p: number[]) => project(c, p, w, h).map((v) => v.toFixed(1)).join(",");
  const poly = (pts: number[][]) => pts.map(P).join(" ");
  const onWall = (p: number[]) => { const t = (WALL - p[2]) / -SUN[2]; return [p[0] - SUN[0] * t, Math.max(0, p[1] - SUN[1] * t), WALL]; };
  const X = 8;
  return (
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="glazed-still-wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fbf3e6" /><stop offset="0.55" stopColor={PLASTER} /><stop offset="1" stopColor="#cdbda8" /></linearGradient>
        <linearGradient id="glazed-still-under" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a8957f" /><stop offset="1" stopColor="#c9b9a4" /></linearGradient>
        <filter id="glazed-still-soft"><feGaussianBlur stdDeviation="7" /></filter>
        <linearGradient id="glazed-still-gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.5" /><stop offset="0.35" stopColor="#fff" stopOpacity="0.08" /><stop offset="1" stopColor="#000" stopOpacity="0.18" /></linearGradient>
        <radialGradient id="glazed-still-sun" cx="0.3" cy="0.1" r="0.7"><stop offset="0" stopColor="#fffaf0" stopOpacity="0.9" /><stop offset="1" stopColor="#fffaf0" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={w} height={h} fill="url(#glazed-still-wall)" />
      <rect width={w} height={h} fill="url(#glazed-still-sun)" />
      <polygon points={poly([[-X, SB_Y, WALL], [X, SB_Y, WALL], [X, -9, WALL], [-X, -9, WALL]])} fill="url(#glazed-still-under)" />
      <polygon points={poly([[-X, 0, SZ0_Z], [X, 0, SZ0_Z], [X, 0, WALL], [-X, 0, WALL]])} fill="#f6efe3" />
      <polygon points={poly([[-X, SB_Y, SZ0_Z], [X, SB_Y, SZ0_Z], [X, 0, SZ0_Z], [-X, 0, SZ0_Z]])} fill="#dfd2bf" />
      {tabs.map((t, i) => {
        const a = i === active ? 0 : LEAN, hw = TW / 2, ht = TT / 2;
        const f = [[-hw, 0, -ht], [hw, 0, -ht], [hw, TH, -ht], [-hw, TH, -ht]].map(([x, y, z]) => tilePt(i, a, x, y, z));
        const top = [[-hw, TH, -ht], [hw, TH, -ht], [hw, TH, ht], [-hw, TH, ht]].map(([x, y, z]) => tilePt(i, a, x, y, z));
        const side = [[-hw, 0, -ht], [-hw, 0, ht], [-hw, TH, ht], [-hw, TH, -ht]].map(([x, y, z]) => tilePt(i, a, x, y, z));
        const sh = [f[0], f[1], onWall(f[1]), onWall(f[2]), onWall(f[3])];
        const mid = project(c, tilePt(i, a, 0, TH * 0.42, -ht), w, h);
        const size = Math.abs(project(c, f[3], w, h)[1] - project(c, f[0], w, h)[1]) * 0.5;
        return (
          <g key={t.id}>
            <polygon points={poly(sh)} fill="rgba(96,70,44,0.32)" filter="url(#glazed-still-soft)" />
            <polygon points={poly(side)} fill={t.pool} stroke={t.pool} strokeWidth="10" strokeLinejoin="round" />
            <polygon points={poly(top)} fill={t.glaze} stroke={t.glaze} strokeWidth="10" strokeLinejoin="round" opacity="0.85" />
            <polygon points={poly(f)} fill={t.glaze} stroke={t.glaze} strokeWidth="12" strokeLinejoin="round" />
            <polygon points={poly(f)} fill="url(#glazed-still-gloss)" />
            <polygon points={poly(f)} fill="none" stroke="rgba(255,244,226,0.55)" strokeWidth="2" strokeLinejoin="round" />
            <text x={mid[0]} y={mid[1] + size * 0.36} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={t.pool} opacity="0.75">{i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}
export default function GlazedCeramicTileTabs() {
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [rects, setRects] = useState<Rect[]>([]);
  const [view, setView] = useState<[number, number]>([0, 0]);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const api = useRef<{ pick: (i: number, user: boolean) => void } | null>(null);
  const activeRef = useRef(0);

  const choose = (i: number, user = true, focus = false) => {
    const n = (i + tabs.length) % tabs.length;
    activeRef.current = n;
    setActive(n);
    api.current?.pick(n, user);
    if (focus) btns.current[n]?.focus();
  };

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layout = () => { const r = box.getBoundingClientRect(); setRects(tileRects(r.width, r.height)); setView([r.width, r.height]); };
    layout();

    const opts = { antialias: false, alpha: false, powerPreference: "high-performance" as const };
    const gl2 = cv.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? cv.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) { setShown("still"); const ro0 = new ResizeObserver(layout); ro0.observe(box); return () => ro0.disconnect(); }
    const canAcc = !!gl2 && (!!gl2.getExtension("EXT_color_buffer_float") || !!gl2.getExtension("EXT_color_buffer_half_float"));
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const software = /swiftshader|llvmpipe|software|basic render/i.test(info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "");

    const head = gl2 ? "#version 300 es\n#define ATTR in\n" : "#define ATTR attribute\n";
    const fhead = gl2 ? "#version 300 es\n#define texture2D texture\n#define TEXL(s, uv, l) textureLod(s, uv, l)\nprecision highp float;\nout vec4 outC;\n" : "#define outC gl_FragColor\n#define TEXL(s, uv, l) texture2D(s, uv)\n";
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
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uDirect", "uCam", "uTgt", "uFoc", "uFocus", "uShift", "uTile", "uSun", "uWin", "uTex", "uLod"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain"].map((n) => [n, U(post, n)])) : {};

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, carvingPlate());
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const s = {
      a: tabs.map((_, i) => (i === 0 ? 0 : LEAN)), v: tabs.map(() => 0), sel: 0, focus: 0,
      px: 0, py: 0, sx: 0, sy: 0, count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, first: true, alive: true, kickAt: -1,
      fpsN: 0, fpsT: 0,
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.5e6 / (cssW * cssH * dpr * dpr)));
      const w = Math.max(2, Math.round(cssW * dpr * k)), h = Math.max(2, Math.round(cssH * dpr * k));
      if (w === W && h === H) return;
      W = w; H = h; cv.width = W; cv.height = H;
      if (gl2 && acc && fbo) {
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, acc);
        gl2.texImage2D(gl.TEXTURE_2D, 0, gl2.RGBA16F, W, H, 0, gl.RGBA, gl2.HALF_FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, acc, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      s.count = 0; s.fresh = true;
    };
    const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

    const draw = (alpha: number, sample: number) => {
      const c = camera(cssW, cssH, s.sx, s.sy);
      const focusTo = [tileX(s.focus), TH * 0.55, ZC - 0.2];
      const fd = dot(sub(focusTo, c.cam), c.fw);
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.11 : 0; // aperture: the focus pulls to the chosen tile
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform3fv(su.uCam, c.cam); gl.uniform3fv(su.uTgt, c.tgt);
      gl.uniform1f(su.uFoc, c.foc); gl.uniform1f(su.uFocus, fd); gl.uniform2f(su.uShift, 0, c.shift);
      gl.uniform4fv(su.uTile, tabs.flatMap((_, i) => [tileX(i), s.a[i], ZC, 0]));
      const sa = -0.62, se = 0.62; // the sun: low, from the left and in front of the shelf
      gl.uniform3f(su.uSun, Math.sin(sa) * Math.cos(se), Math.sin(se), -Math.cos(sa) * Math.cos(se));
      gl.uniform2f(su.uWin, 0.35, 1.4);
      gl.uniform1i(su.uTex, 0);
      gl.uniform1f(su.uLod, Math.max(0, Math.log2(512 / ((H * c.foc) / c.dist)) + 0.3));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, acc);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, s.frame % 64);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.activeTexture(gl.TEXTURE0);
      }
    };

    const pick = (i: number, user: boolean) => {
      if (user) s.touched = true;
      if (i === s.sel) return;
      const old = s.sel;
      s.sel = i;
      if (reduce) { s.a = tabs.map((_, k) => (k === i ? 0 : LEAN)); s.v = s.v.map(() => 0); s.focus = i; s.count = 0; s.fresh = true; wake(); return; }
      s.v[old] += 0.6; // the old tile is let go and falls back against the wall
      s.kickAt = performance.now() + 90; // the new one is tipped forward a beat later
      wake();
    };
    api.current = { pick };

    const step = (dt: number, now: number) => {
      let moving = false;
      if (s.kickAt > 0 && now >= s.kickAt) { s.v[s.sel] -= 1.1; s.kickAt = -1; }
      for (let i = 0; i < tabs.length; i++) {
        const n = 4;
        for (let k = 0; k < n; k++) {
          const h = dt / n;
          let acc: number;
          if (i === s.sel && s.kickAt < 0) acc = -72 * s.a[i] - 5.0 * s.v[i]; // stood up: it rocks on its edge and settles
          else acc = 26 * Math.sin(s.a[i] + 0.12) - 0.8 * s.v[i]; // let go: it topples back onto the wall
          s.v[i] += acc * h; s.a[i] += s.v[i] * h;
          if (s.a[i] > LEAN) {
            const hit = s.v[i];
            s.a[i] = LEAN; s.v[i] = -hit * 0.28;
            // the knock runs along the shelf: the neighbours lift off the wall a hair and fall back
            if (hit > 0.6) for (const j of [i - 1, i + 1]) if (j >= 0 && j < tabs.length && j !== s.sel) s.v[j] -= hit * 0.05;
          }
        }
        if (Math.abs(s.v[i]) > 0.0015 || (i === s.sel ? Math.abs(s.a[i]) > 0.0008 : LEAN - s.a[i] > 0.0008)) moving = true;
        else { s.v[i] = 0; s.a[i] = i === s.sel ? 0 : LEAN; }
      }
      const f0 = s.focus;
      s.focus += (s.sel - s.focus) * (1 - Math.exp(-dt * 5));
      if (Math.abs(s.sel - s.focus) < 0.002) s.focus = s.sel; else moving = true;
      if (Math.abs(f0 - s.focus) > 0.0001) moving = true;
      return moving || s.kickAt > 0;
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible || !s.alive) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 4200; }
      if (!reduce && !s.touched && now > s.demoAt) { choose((s.sel + 1) % tabs.length, false); s.demoAt = now + 3600; }
      let moving = reduce ? false : step(dt, now);
      if (!reduce) {
        const k = 1 - Math.exp(-dt * 3);
        const dx = s.px - s.sx, dy = s.py - s.sy;
        s.sx += dx * k; s.sy += dy * k;
        if (Math.abs(dx) + Math.abs(dy) > 0.003) moving = true;
      }
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(0.5, 1 + (s.frame % 64)); s.count = 4; }
      else if (s.count < 40) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }
      // measured: if frames run long for a while, give up some resolution
      if (moving && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }
      if (moving) { s.fpsN++; s.fpsT += dtRaw; }
      (box as HTMLElement).dataset.fps = s.fpsT > 0 ? (s.fpsN / s.fpsT).toFixed(1) : "";
      const demoSoon = !reduce && !s.touched;
      if (moving || s.count < 40 || demoSoon) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible && s.alive) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); layout(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    const move = (e: PointerEvent) => {
      if (reduce || e.pointerType !== "mouse") return;
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
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const onKey = (e: KeyboardEvent) => {
    const i = activeRef.current;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); choose(i + 1, true, true); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); choose(i - 1, true, true); }
    else if (e.key === "Home") { e.preventDefault(); choose(0, true, true); }
    else if (e.key === "End") { e.preventDefault(); choose(tabs.length - 1, true, true); }
  };
  const t = tabs[active];

  return (
    <section className="relative isolate overflow-hidden text-[#2b1d12]" style={{ fontFamily: FONT, background: PLASTER }}>
      <style>{`
        @keyframes glazed-tile-tabs-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .glazed-tile-tabs-rise > * { animation: glazed-tile-tabs-rise 640ms cubic-bezier(0.2, 0.9, 0.25, 1) both; }
        .glazed-tile-tabs-rise > *:nth-child(2) { animation-delay: 70ms; }
        .glazed-tile-tabs-rise > *:nth-child(3) { animation-delay: 140ms; }
        @media (prefers-reduced-motion: reduce) { .glazed-tile-tabs-rise > * { animation: none; } }
      `}</style>
      <div ref={stage} className="relative h-[330px] w-full md:h-[760px]">
        {shown !== "gl" && <Still w={view[0]} h={view[1]} active={active} />}
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        <p className="pointer-events-none absolute left-5 top-4 flex items-baseline gap-3 text-[#2b1d12] md:left-12 md:top-9">
          <span className="text-[24px] italic leading-none tracking-[-0.01em] md:text-[28px]" style={{ fontFamily: SERIF }}>{BRAND.split(" ")[0]}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] md:text-[11px]">{BRAND.split(" ").slice(1).join(" ")}</span>
        </p>
        <p className="pointer-events-none absolute right-12 top-10 hidden text-[11px] font-semibold uppercase tracking-[0.3em] text-[#3a2818] md:block">Pick a tile, or use the arrow keys</p>
        <div role="tablist" aria-label={`${BRAND} sections`} className="absolute inset-0" onKeyDown={onKey}>
          {rects.map((r, i) => (
            <button
              key={tabs[i].id}
              ref={(el) => { btns.current[i] = el; }}
              id={`glazed-tab-${tabs[i].id}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-controls="glazed-tab-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => choose(i)}
              className="group absolute rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-[#2b1d12] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
              style={{ left: r.x - 6, top: r.y - 8, width: r.w + 12, height: r.h + 10 }}
            >
              <span className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.26em] transition-colors md:text-[11px] ${i === active ? "text-[#1c120a]" : "text-[#3f2d1e] group-hover:text-[#1c120a]"}`} style={{ top: r.ly - r.y + 1 }}>
                {tabs[i].label}
                <span aria-hidden="true" className={`mx-auto mt-1.5 block h-[2px] rounded-full bg-[#1c120a] transition-all duration-500 motion-reduce:transition-none ${i === active ? "w-5 opacity-100" : "w-0 opacity-0"}`} />
              </span>
            </button>
          ))}
        </div>
      </div>
      <div id="glazed-tab-panel" role="tabpanel" aria-labelledby={`glazed-tab-${t.id}`} className="relative px-5 pb-10 pt-2 md:absolute md:inset-x-0 md:bottom-0 md:px-12 md:pb-12">
        <div key={t.id} className="glazed-tile-tabs-rise grid gap-5 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:items-end md:gap-16">
          <h2 className="max-w-[16ch] text-[34px] leading-[1] tracking-[-0.025em] text-[#22160c] md:text-[60px]" style={{ fontFamily: SERIF }}>{t.title}</h2>
          <div className="max-w-[30rem]">
            <p className="text-[15px] leading-[1.6] text-[#3d2c1e] md:text-[16px]">{t.body}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a href="#" className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-semibold text-white outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#22160c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9dfd1] motion-reduce:transition-none" style={{ background: t.pool }}>
                {t.cta}
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              </a>
              <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4a3726]">{t.note}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
