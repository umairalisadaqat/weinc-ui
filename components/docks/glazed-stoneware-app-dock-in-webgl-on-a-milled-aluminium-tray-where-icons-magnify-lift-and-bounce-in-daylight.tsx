import { useEffect, useRef, useState, type KeyboardEvent } from "react";

// The apps in the dock. `glaze` is the tile, `ink` the raised enamel of its glyph, `path` the glyph (24 by 24, stroked).
const apps = [
  { id: "post", label: "Post", glaze: "#163f93", ink: "#efe6d3", line: "Four letters waiting, one from the framer about Thursday.", path: "M4 7h16v11H4z M4.5 7.5l7.5 6 7.5-6" },
  { id: "days", label: "Calendar", glaze: "#8c2219", ink: "#f1e7d4", line: "Kiln opening at eleven, then lunch on the bench outside.", path: "M5 6h14v13H5z M5 10.5h14 M9 3.5v4 M15 3.5v4 M9 14.5h.01 M12 14.5h.01 M15 14.5h.01" },
  { id: "lens", label: "Camera", glaze: "#1b1d20", ink: "#e9e1d1", line: "Morning light on the glaze test tiles, twelve frames.", path: "M5 12a7 7 0 1 0 14 0a7 7 0 1 0 -14 0 M9.2 12a2.8 2.8 0 1 0 5.6 0a2.8 2.8 0 1 0 -5.6 0" },
  { id: "notes", label: "Notes", glaze: "#d49a2c", ink: "#3b230c", line: "Three drafts since Monday and a list of glaze weights.", path: "M6 7h12 M6 12h12 M6 17h7" },
  { id: "tunes", label: "Music", glaze: "#8fb5a0", ink: "#163a2c", line: "A slow record for the afternoon throw, side two.", path: "M9.5 17V6.5l8.5-2v10.5 M9.5 17a2.2 2.2 0 1 1 -4.4 0a2.2 2.2 0 1 1 4.4 0 M18 15a2.2 2.2 0 1 1 -4.4 0a2.2 2.2 0 1 1 4.4 0" },
  { id: "tune", label: "Settings", glaze: "#ebe4d6", ink: "#173d8a", line: "Night shift from nine, and the studio printer is paired.", path: "M4.5 8h15 M4.5 16h15 M7 8a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0 M12.6 16a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0" },
];
const N = apps.length;
const PAPER = "#e7e1d7"; // the limestone desk as a screen colour, for the frame and the still picture
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

// Scene sizes in shader units. Each icon is a 1 by 1 tile; GAP is the space between tiles; the tray is milled from one bar.
const GAP = 0.22, FL = 0.08, TH = 0.3, TD = 0.6, WW = 0.12, LEAN = 0.12, PAD = 0.42;
const MAG = 0.62, REACH = 1.45; // how much the tile under the pointer grows, and how far the swell spreads

const lin = (hex: string) => [1, 3, 5].map((i) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2));
const v3 = (c: number[]) => `vec3(${c.map((n) => n.toFixed(4)).join(", ")})`;
const pick = (key: "glaze" | "ink", name: string) =>
  `vec3 ${name}(float i){ ${apps.map((a, i) => `if (i < ${i}.5) return ${v3(lin(a[key]))};`).join(" ")} return vec3(0.5); }`;

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const TONE = `
vec3 tone(vec3 x){ vec3 c = 1.0 - exp(-max(x, 0.0) * 1.05); c = mix(c, c * c * (3.0 - 2.0 * c), 0.3); return pow(c, vec3(1.0 / 2.2)); }
`;

const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uDirect;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform float uFocus; uniform vec2 uShift;
uniform vec4 uIcon[${N}]; uniform vec4 uTray; uniform vec3 uSun; uniform sampler2D uTex;
const float IH = 0.5; const float IT = 0.13; const float IR = 0.225; const float IB = 0.075;
const float FL = ${FL.toFixed(3)}; const float TH = ${TH.toFixed(3)}; const float TD = ${TD.toFixed(3)}; const float WW = ${WW.toFixed(3)}; const float LEAN = ${LEAN.toFixed(3)};
const float WALLZ = 7.0; const float NI = ${N}.0;
const vec3 SUNC = vec3(1.0, 0.9, 0.78); const float SUNI = 3.3;
const vec3 STONE = vec3(0.74, 0.7, 0.63);
${pick("glaze", "glazeC")}
${pick("ink", "inkC")}
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ return 0.5 * n2(p) + 0.25 * n2(p * 2.03 + 7.1) + 0.125 * n2(p * 4.01 + 3.3) + 0.0625 * n2(p * 8.1 + 1.7); }

float sdRBox(vec3 p, vec3 b, float r){ vec3 d = abs(p) - b + r; return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0) - r; }
float smax(float a, float b, float k){ float h = max(k - abs(a - b), 0.0) / k; return max(a, b) + h * h * k * 0.25; }
// A glazed tile: a rounded square slab with soft, dipped edges.
float sdIcon(vec3 q){
  vec2 a = abs(q.xy) - vec2(IH - IR); float d2 = length(max(a, 0.0)) + min(max(a.x, a.y), 0.0) - IR;
  vec2 w = vec2(d2 + IB, abs(q.z) - IT + IB);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - IB;
}
vec4 iconAt(float id){ vec4 c = uIcon[0];
  ${apps.map((_, i) => (i ? `if (id > ${i - 1}.5) c = uIcon[${i}];` : "")).join(" ")}
  return c; }
// World to tile space: each tile stands on the pocket floor, leans back a little, and grows from its foot.
vec3 iLocal(vec3 p, vec4 ic){
  vec3 q = (p - vec3(ic.x, FL + ic.y, 0.02)) / ic.z;
  float c = cos(LEAN); float s = sin(LEAN);
  q = vec3(q.x, q.y * c + q.z * s, -q.y * s + q.z * c);
  q.y -= IH; return q;
}
vec3 iWorldDir(vec3 v){ float c = cos(LEAN); float s = sin(LEAN); return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c); }
float dBound(vec3 p, vec4 ic){
  vec3 c = vec3(ic.x, FL + ic.y + 0.52 * ic.z, 0.08 * ic.z); vec3 b = vec3(0.54, 0.58, 0.28) * ic.z + 0.02;
  vec3 d = abs(p - c) - b; return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}
float dTray(vec3 p){
  float o = sdRBox(p - vec3(0.0, TH * 0.5, 0.0), vec3(uTray.x, TH * 0.5, TD), 0.07);
  float k = sdRBox(p - vec3(0.0, FL + 1.0, 0.0), vec3(uTray.x - WW, 1.0, TD - WW), 0.07);
  return smax(o, -k, 0.025);
}
vec2 map(vec3 p, float lim){
  vec2 r = vec2(dTray(p), NI);
  for (int i = 0; i < ${N}; i++) {
    vec4 ic = uIcon[i];
    float bb = dBound(p, ic);
    float d = bb > lim ? bb : sdIcon(iLocal(p, ic)) * ic.z;
    if (d < r.x) r = vec2(d, float(i));
  }
  return r;
}
float mapS(vec3 p){ return map(p, 0.6).x; }
vec3 nMap(vec3 p){ vec2 e = vec2(0.0012, -0.0012); return normalize(e.xyy * mapS(p + e.xyy) + e.yyx * mapS(p + e.yyx) + e.yxy * mapS(p + e.yxy) + e.xxx * mapS(p + e.xxx)); }

vec2 march(vec3 ro, vec3 rd, float tmax, int steps){
  vec3 lo = vec3(-uTray.x - 0.12, -0.01, -TD - 0.3); vec3 hi = vec3(uTray.x + 0.12, 3.2, 1.0);
  vec3 inv = 1.0 / (rd + vec3(1e-6)); vec3 t0 = (lo - ro) * inv; vec3 t1 = (hi - ro) * inv;
  vec3 mn = min(t0, t1); vec3 mx = max(t0, t1);
  float tn = max(max(mn.x, mn.y), max(mn.z, 0.0)); float tf = min(min(mx.x, mx.y), min(mx.z, tmax));
  if (tn > tf) return vec2(-1.0);
  float t = tn;
  for (int i = 0; i < 110; i++) { if (i >= steps) break; vec2 h = map(ro + rd * t, 0.12); if (h.x < 0.0007) return vec2(t, h.y); t += h.x; if (t > tf) break; }
  return vec2(-1.0);
}
// The desk and the wall behind it are flat, so they are hit exactly.
float hitStatic(vec3 ro, vec3 rd, out vec3 n){
  float t = 1e9; n = vec3(0.0, 1.0, 0.0);
  if (rd.y < 0.0) { float ty = -ro.y / rd.y; if (ty > 0.0) t = ty; }
  if (rd.z > 0.0) { float tw = (WALLZ - ro.z) / rd.z; if (tw > 0.0 && tw < t) { t = tw; n = vec3(0.0, 0.0, -1.0); } }
  return t;
}
// Daylight through a tall window off to the left: the panes and glazing bars fall across the desk.
float windowLight(vec3 p){
  vec3 u = normalize(cross(uSun, vec3(0.0, 1.0, 0.0))); vec3 v = cross(u, uSun);
  vec2 w = vec2(dot(p, u), dot(p, v)) - vec2(1.2, 0.2);
  float open = smoothstep(0.5, -0.5, max(abs(w.x) - 7.5, abs(w.y) - 5.0));
  vec2 g = abs(fract(w / vec2(6.2, 4.6) + 0.5) - 0.5) * vec2(6.2, 4.6);
  return open * (0.2 + 0.8 * smoothstep(0.02, 0.16, g.x) * smoothstep(0.02, 0.16, g.y));
}
float gJit = 0.5;
float softShadow(vec3 ro){
  float res = 1.0; float t = 0.01 + 0.03 * gJit;
  for (int i = 0; i < 46; i++) {
    float h = mapS(ro + uSun * t);
    res = min(res, 10.0 * h / t);
    t += clamp(h, 0.01, 0.14) * (0.85 + 0.3 * gJit); if (res < 0.003 || t > 5.0) break;
  }
  res = clamp(res, 0.0, 1.0); return res * res * (3.0 - 2.0 * res);
}
float occl(vec3 p, vec3 n){
  float o = 0.0; float w = 1.0;
  for (int i = 1; i < 6; i++) { float h = 0.03 * float(i * i) + 0.008; o += w * (h - mapS(p + n * h)); w *= 0.6; }
  return clamp(1.0 - 2.4 * o, 0.0, 1.0);
}
// The room the glaze and metal mirror: a bright window on the left, pale walls, a darker floor.
vec3 env(vec3 rd){
  float el = asin(clamp(rd.y, -1.0, 1.0)); float az = atan(rd.x, -rd.z);
  vec3 c = mix(vec3(0.26, 0.23, 0.2), vec3(0.78, 0.78, 0.8), smoothstep(-0.35, 0.55, rd.y));
  vec2 w = vec2(az + 0.75, el - 0.32);
  float fr = smoothstep(0.02, -0.02, max(abs(w.x) - 0.5, abs(w.y) - 0.42));
  vec2 g = abs(fract(w / vec2(0.33, 0.28) + 0.5) - 0.5) * vec2(0.33, 0.28);
  c += vec3(1.0, 0.98, 0.94) * 7.0 * fr * smoothstep(0.008, 0.016, g.x) * smoothstep(0.008, 0.016, g.y) * (0.7 + 0.3 * smoothstep(-0.3, 0.4, w.y));
  vec2 w2 = vec2(az - 0.9, el - 0.25);
  c += vec3(0.95, 0.97, 1.0) * 2.2 * smoothstep(0.08, -0.08, max(abs(w2.x) - 0.35, abs(w2.y) - 0.3));
  // a broad overcast softbox above and behind the camera: the long highlight across every tile face
  vec2 w3 = vec2(az + 0.1, el - 0.62);
  c += vec3(1.0, 0.99, 0.97) * 3.2 * smoothstep(0.12, -0.12, max(abs(w3.x) - 1.1, abs(w3.y) - 0.14));
  c += SUNC * 30.0 * smoothstep(0.996, 0.999, dot(rd, uSun));
  return c;
}
// Limestone desk and a limewashed wall: mottled, lit by the window, with colour thrown off the glaze nearby.
vec3 desk(vec3 p, vec3 n, float full){
  vec2 pq = n.y > 0.5 ? p.xz : p.xy + vec2(0.0, 9.0);
  float mott = fbm(pq * 0.9) - 0.5; float fine = n2(pq * 70.0) - 0.5; float vein = fbm(pq * vec2(0.6, 2.4) + mott * 2.0);
  vec3 alb = STONE * (1.0 + 0.1 * mott + 0.035 * fine) * (1.0 - 0.07 * smoothstep(0.55, 0.62, vein));
  if (n.z < -0.5) alb = vec3(0.84, 0.76, 0.66) * (1.0 + 0.06 * mott) * (0.8 + 0.25 * smoothstep(0.0, 5.0, p.y));
  float ndl = max(dot(n, uSun), 0.0);
  float win = windowLight(p);
  float sh = 1.0; float ao = 1.0;
  if (full > 0.5 && n.y > 0.5) { if (win > 0.02) sh = softShadow(p + n * 0.003); ao = occl(p, n); }
  vec3 sky = mix(vec3(0.62, 0.58, 0.53), vec3(0.76, 0.8, 0.88), 0.5 + 0.5 * n.y);
  vec3 col = alb * (SUNC * SUNI * ndl * win * sh + sky * 0.95 * ao);
  if (full > 0.5 && n.y > 0.5) {
    for (int i = 0; i < ${N}; i++) {
      vec4 ic = uIcon[i]; if (dBound(p, ic) > 1.0) continue;
      float d = max(sdIcon(iLocal(p, ic)) * ic.z, 0.0);
      col += glazeC(float(i)) * alb * 0.35 * exp(-d * 10.0) * (0.3 + 0.7 * win);
    }
  }
  // a quiet sheen on the honed stone where the window reflects
  float nv = max(n.y, 0.0);
  return col + env(reflect(normalize(p - uCam), n)) * 0.02 * nv * (full > 0.5 ? ao : 1.0);
}
vec3 stage(vec3 ro, vec3 rd){
  vec3 n; float t = hitStatic(ro, rd, n);
  if (t > 1e8) return env(rd);
  return desk(ro + rd * t, n, 0.0);
}
vec3 nIcon(vec3 q){ vec2 e = vec2(0.001, -0.001); return normalize(e.xyy * sdIcon(q + e.xyy) + e.yyx * sdIcon(q + e.yyx) + e.yxy * sdIcon(q + e.yxy) + e.xxx * sdIcon(q + e.xxx)); }

// What a reflection meets: a tile (shaded simply), the tray again, or the room.
vec3 traceRefl(vec3 ro, vec3 rd){
  vec2 h = march(ro, rd, 12.0, 44);
  if (h.x < 0.0) return stage(ro, rd);
  vec3 p = ro + rd * h.x;
  if (h.y < NI - 0.5) {
    vec4 ic = iconAt(h.y); vec3 n = iWorldDir(nIcon(iLocal(p, ic)));
    return glazeC(h.y) * (vec3(0.7, 0.72, 0.76) * (0.5 + 0.5 * n.y) + SUNC * 1.6 * max(dot(n, uSun), 0.0)) + env(reflect(rd, n)) * 0.06;
  }
  return env(rd) * vec3(0.55, 0.56, 0.58);
}

// Glazed stoneware: glossy, deep colour, pale where the glaze breaks thin over an edge, raised enamel glyph.
vec3 shadeIcon(vec3 p, vec3 rd, float id, vec2 rnd){
  vec4 ic = iconAt(id);
  vec3 q = iLocal(p, ic); vec3 nl = nIcon(q);
  float edge = smoothstep(0.12, 0.42, 1.0 - max(abs(nl.x), max(abs(nl.y), abs(nl.z))));
  float front = smoothstep(0.7, 0.95, -nl.z);
  vec2 uv = clamp(q.xy / (2.0 * IH) + 0.5, 0.0, 1.0);
  vec2 au = vec2((id + uv.x) / NI, 1.0 - uv.y);
  float du = 0.004;
  float h = TEXL(uTex, au, 0.0).r * front;
  float hx = (TEXL(uTex, au + vec2(du / NI, 0.0), 0.0).r - TEXL(uTex, au - vec2(du / NI, 0.0), 0.0).r) * front;
  float hy = (TEXL(uTex, au - vec2(0.0, du), 0.0).r - TEXL(uTex, au + vec2(0.0, du), 0.0).r) * front;
  vec2 wq = q.xy * 1.6 + id * 3.7;
  float wv = fbm(wq); float wx = fbm(wq + vec2(0.04, 0.0)) - wv; float wy = fbm(wq + vec2(0.0, 0.04)) - wv;
  vec3 nb = normalize(nl - vec3(hx, hy, 0.0) * 1.3 + vec3(wx, wy, 0.0) * 0.16 * (1.0 - edge));
  vec3 n = iWorldDir(nb);
  vec3 G = glazeC(id);
  float run = fbm(vec2(q.x * 5.0 + id * 4.0, q.y * 1.3 + 0.5 * fbm(q.xy * 3.0)));
  vec3 alb = G * (0.84 + 0.3 * run);
  alb = mix(alb, mix(G, vec3(0.86, 0.78, 0.64), 0.45), edge * 0.8);
  alb *= 1.0 - 0.18 * smoothstep(0.1, 0.5, uv.y) * (1.0 - uv.y) * (1.0 - edge);
  float sp = h21(floor(q.xy * 150.0) + id * 13.0); alb *= 1.0 - 0.45 * step(0.988, sp);
  float g = smoothstep(0.3, 0.62, h);
  alb = mix(alb, inkC(id) * (0.95 + 0.08 * n2(q.xy * 40.0)), g);
  vec3 wp = p + n * 0.003;
  float ndl = dot(n, uSun);
  float win = windowLight(p);
  float sh = ndl > 0.0 ? softShadow(wp) : 0.0;
  float ao = occl(p, n);
  vec3 sky = mix(vec3(0.58, 0.54, 0.5), vec3(0.8, 0.84, 0.92), 0.5 + 0.5 * n.y);
  float wrap = max((ndl + 0.2) / 1.2, 0.0);
  vec3 dif = alb * (SUNC * SUNI * wrap * (0.35 + 0.65 * win) * sh + sky * 1.2 * ao);
  float nv = clamp(dot(-rd, n), 0.0, 1.0);
  float f = 0.045 + 0.955 * pow(1.0 - nv, 5.0);
  vec3 r = normalize(reflect(rd, n) + vec3(rnd, rnd.x) * 0.01);
  vec3 refl = traceRefl(wp, r) * (0.3 + 0.7 * ao);
  vec3 hv = normalize(uSun - rd); float nh = max(dot(n, hv), 0.0);
  float a2 = 0.003; float dd = nh * nh * (a2 - 1.0) + 1.0; float spec = a2 / (3.14159 * dd * dd);
  return dif * (1.0 - f) + refl * f + SUNC * SUNI * spec * 0.05 * max(ndl, 0.0) * sh;
}

// Milled aluminium: brushed along the bar on the outside, fly-cut arcs on the pocket floor, a lit dot under the open app.
vec3 shadeTray(vec3 p, vec3 rd, vec2 rnd){
  vec3 n = nMap(p);
  float floorP = step(p.y, FL + 0.012) * step(0.6, n.y);
  if (n.y > 0.6 && floorP < 0.5) n = normalize(n + vec3(0.0, 0.0, (n2(vec2(p.x * 2.0, p.z * 700.0)) - 0.5) * 0.05));
  else if (n.z < -0.6) n = normalize(n + vec3(0.0, (n2(vec2(p.x * 2.0, p.y * 900.0)) - 0.5) * 0.05, 0.0));
  if (floorP > 0.5) { float cx = mod(p.x, 0.36) - 0.18; float arc = length(vec2(cx, p.z + 0.9)); n = normalize(n + vec3(cx, 0.0, 0.0) * 0.0 + vec3(0.0, 0.0, sin(arc * 520.0) * 0.012 + (n2(vec2(arc * 300.0, p.x)) - 0.5) * 0.03)); }
  vec3 wp = p + n * 0.003;
  float ndl = dot(n, uSun);
  float win = windowLight(p);
  float sh = ndl > 0.0 ? softShadow(wp) : 0.0;
  float ao = occl(p, n);
  float nv = clamp(dot(-rd, n), 0.0, 1.0);
  vec3 F0 = vec3(0.9, 0.91, 0.92);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - nv, 5.0);
  float rough = floorP > 0.5 ? 0.11 : 0.07;
  vec3 r = normalize(reflect(rd, n) + (floorP > 0.5 ? vec3(rnd.x, rnd.y * 0.4, rnd.y) * rough : vec3(rnd.x * 0.3, rnd.y * 0.015, rnd.y * 0.02)));
  vec3 refl = traceRefl(wp, r) * (0.25 + 0.75 * ao);
  vec3 hv = normalize(uSun - rd); float nh = max(dot(n, hv), 0.0);
  float a2 = 0.02; float dd = nh * nh * (a2 - 1.0) + 1.0; float spec = a2 / (3.14159 * dd * dd);
  vec3 col = refl * F * 0.92 + F * SUNC * SUNI * spec * 0.12 * max(ndl, 0.0) * sh * (0.4 + 0.6 * win);
  // a little bead-blasted scatter keeps the shadow side from going black
  col += vec3(0.5, 0.51, 0.53) * (SUNC * SUNI * max(ndl, 0.0) * sh * win * 0.06 + 0.1 * ao);
  // glaze colour bounced onto the floor of the pocket
  if (floorP > 0.5) for (int i = 0; i < ${N}; i++) { vec4 ic = uIcon[i]; float d = max(sdIcon(iLocal(p, ic)) * ic.z, 0.0); col += glazeC(float(i)) * 0.16 * exp(-d * 12.0) * ao; }
  // the lamp: a small frosted dot set into the front lip, with its light spilling along the brushing
  if (p.y > TH - 0.02 && n.y > 0.5) {
    vec2 c = vec2(uTray.y, -TD + 0.06); vec2 d = (p.xz - c) * vec2(1.0, 1.0);
    float r0 = length(d);
    vec3 led = vec3(1.0, 0.5, 0.16);
    col *= 1.0 - 0.6 * smoothstep(0.058, 0.046, r0) * (1.0 - smoothstep(0.046, 0.038, r0));
    col = mix(col, led * (3.5 + 6.0 * uTray.z), smoothstep(0.05, 0.036, r0));
    col += led * uTray.z * (exp(-abs(d.x) * 9.0) * exp(-abs(d.y) * 50.0) * 0.8 + exp(-r0 * 22.0) * 1.0);
  }
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
  vec2 h = march(ro, rd, min(ts, 60.0), 110);
  vec3 col;
  if (h.x > 0.0) { vec3 p = ro + rd * h.x; col = h.y < NI - 0.5 ? shadeIcon(p, rd, h.y, rnd) : shadeTray(p, rd, rnd); }
  else col = ts < 1e8 ? desk(ro + rd * ts, n, 1.0) : env(rd);
  col = min(col, vec3(12.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the frame: bloom off the lamp and the glints, the film curve, a soft vignette and grain.
const POST = `
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uAcc, uv).rgb;
  vec3 b = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 20.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.022 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 2.6, 0.0), vec3(10.0)) * (1.0 - 0.7 * r);
  }
  c += b * 0.03;
  c += vec3(1.0, 0.86, 0.66) * 0.1 * smoothstep(1.2, 0.0, length((uv - vec2(-0.1, 1.1)) * vec2(uRes.x / uRes.y, 1.0) * 0.75));
  vec2 q = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.18 * smoothstep(0.45, 1.35, length(q));
  c = tone(c);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.016;
  outC = vec4(c, 1.0);
}
`;

// The raised glyphs, as a height plate: one square per app, white where the enamel stands proud.
function glyphPlate() {
  const S = 256;
  const cv = document.createElement("canvas");
  cv.width = S * N; cv.height = S;
  const g = cv.getContext("2d");
  if (!g) return cv;
  g.fillStyle = "#000"; g.fillRect(0, 0, cv.width, cv.height);
  g.strokeStyle = "#fff"; g.fillStyle = "#fff"; g.lineCap = "round"; g.lineJoin = "round";
  apps.forEach((a, i) => {
    g.save();
    g.translate(S * i + S * 0.18, S * 0.18);
    g.scale((S * 0.64) / 24, (S * 0.64) / 24);
    g.filter = "blur(2.5px)";
    g.lineWidth = 2.3;
    g.stroke(new Path2D(a.path));
    g.restore();
  });
  return cv;
}

type Cam = { cam: number[]; fw: number[]; rt: number[]; up: number[]; foc: number; dist: number; tgt: number[]; shift: number };
const sub = (a: number[], b: number[]) => a.map((v, i) => v - b[i]);
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: number[]) => { const l = Math.hypot(a[0], a[1], a[2]); return a.map((v) => v / l); };
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const REST_HALF = (N + (N - 1) * GAP) / 2;
const restX = (i: number) => -REST_HALF + 0.5 + i * (1 + GAP);

// One camera for the shader and the HTML over it, so each button sits on its tile.
function camera(w: number, h: number, px = 0, py = 0): Cam {
  const desk = w >= 768, aspect = w / h;
  const dist = desk ? 11 : 15;
  const el = (desk ? 0.4 : 0.42) + py * 0.025, az = -0.1 + px * 0.05;
  const tgt = [0, 0.55, 0];
  const foc = (dist * aspect * 0.5) / ((REST_HALF + PAD + 0.8) / (desk ? 0.76 : 0.82));
  const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] - dist * Math.cos(az) * Math.cos(el)];
  const fw = norm(sub(tgt, cam)); const rt = norm(cross([0, 1, 0], fw)); const up = cross(fw, rt);
  return { cam, fw, rt, up, foc, dist, tgt, shift: desk ? -0.13 : -0.2 };
}
function project(c: Cam, p: number[], w: number, h: number) {
  const d = sub(p, c.cam); const z = dot(d, c.fw);
  return [w / 2 + (dot(d, c.rt) / z) * c.foc * h, h / 2 - ((dot(d, c.up) / z) * c.foc + c.shift) * h];
}
// Where a screen point meets the upright plane through the tiles (z = 0), in scene units.
function unproject(c: Cam, x: number, y: number, w: number, h: number) {
  const ux = (x - w / 2) / h, uy = (h / 2 - y) / h - c.shift;
  const rd = [0, 1, 2].map((k) => c.fw[k] * c.foc + c.rt[k] * ux + c.up[k] * uy);
  const t = -c.cam[2] / rd[2];
  return [c.cam[0] + rd[0] * t, c.cam[1] + rd[1] * t];
}
// Where each tile sits for a given set of sizes: they push their neighbours aside as they swell.
function layoutX(sc: number[]) {
  const widths = sc.map((s) => s), total = widths.reduce((a, b) => a + b, 0) + GAP * (N - 1);
  let x = -total / 2;
  return { xs: widths.map((wd) => { const c = x + wd / 2; x += wd + GAP; return c; }), half: total / 2 + PAD };
}
// The box around a tile on screen, for its button.
function tileBox(c: Cam, x: number, y: number, s: number, w: number, h: number) {
  const pts = [[x - s / 2, FL + y, -0.2], [x + s / 2, FL + y, -0.2], [x - s / 2, FL + y + s * Math.cos(LEAN), s * Math.sin(LEAN) - 0.2], [x + s / 2, FL + y + s * Math.cos(LEAN), s * Math.sin(LEAN) - 0.2]].map((p) => project(c, p, w, h));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

// No WebGL: the same dock drawn flat through the same camera.
function Still({ w, h, active }: { w: number; h: number; active: number }) {
  if (w < 2) return null;
  const c = camera(w, h);
  const sc = apps.map((_, i) => 1 + MAG * Math.exp(-Math.pow((restX(i) - restX(2)) / REACH, 2)));
  const { xs, half } = layoutX(sc);
  const P = (p: number[]) => project(c, p, w, h).map((v) => v.toFixed(1)).join(",");
  const poly = (pts: number[][]) => pts.map(P).join(" ");
  const top = poly([[-half, TH, -TD], [half, TH, -TD], [half, TH, TD], [-half, TH, TD]]);
  const front = poly([[-half, 0, -TD], [half, 0, -TD], [half, TH, -TD], [-half, TH, -TD]]);
  const dot0 = project(c, [xs[active], TH, -TD + 0.06], w, h);
  return (
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="stoneware-dock-desk" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor="#efebe4" /><stop offset="0.55" stopColor={PAPER} /><stop offset="1" stopColor="#cfc6b8" /></linearGradient>
        <linearGradient id="stoneware-dock-alu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#b9bcc0" /><stop offset="0.3" stopColor="#eef0f2" /><stop offset="0.7" stopColor="#c9ccd0" /><stop offset="1" stopColor="#a9adb2" /></linearGradient>
        <linearGradient id="stoneware-dock-gloss" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.45" /><stop offset="0.4" stopColor="#fff" stopOpacity="0.05" /><stop offset="1" stopColor="#000" stopOpacity="0.15" /></linearGradient>
        <filter id="stoneware-dock-soft"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>
      <rect width={w} height={h} fill="url(#stoneware-dock-desk)" />
      <polygon points={poly([[-half + 0.3, 0, -TD + 0.2], [half + 1.2, 0, -TD + 0.2], [half + 1.6, 0, TD + 0.9], [-half + 0.6, 0, TD + 0.9]])} fill="rgba(70,58,44,0.3)" filter="url(#stoneware-dock-soft)" />
      <polygon points={top} fill="url(#stoneware-dock-alu)" stroke="#d8dbde" strokeWidth="6" strokeLinejoin="round" />
      <polygon points={front} fill="#9da1a7" stroke="#9da1a7" strokeWidth="6" strokeLinejoin="round" />
      {apps.map((a, i) => {
        const b = tileBox(c, xs[i], (sc[i] - 1) * 0.42, sc[i], w, h);
        const r = b.w * 0.24;
        return (
          <g key={a.id}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={r} fill={a.glaze} />
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={r} fill="url(#stoneware-dock-gloss)" />
            <g transform={`translate(${b.x + b.w * 0.18} ${b.y + b.h * 0.18}) scale(${(b.w * 0.64) / 24} ${(b.h * 0.64) / 24})`}>
              <path d={a.path} fill="none" stroke={a.ink} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
        );
      })}
      <circle cx={dot0[0]} cy={dot0[1]} r="3.5" fill="#ffb35c" />
      <circle cx={dot0[0]} cy={dot0[1]} r="12" fill="#ff9a3c" opacity="0.25" />
    </svg>
  );
}

export default function GlazedStonewareAppDock() {
  const [active, setActive] = useState(2);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [view, setView] = useState<[number, number]>([0, 0]);
  const [tip, setTip] = useState(-1);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const tipEl = useRef<HTMLDivElement>(null);
  const api = useRef<{ open: (i: number, user: boolean) => void; hover: (i: number) => void } | null>(null);
  const activeRef = useRef(2);

  const open = (i: number, user = true) => {
    activeRef.current = i;
    setActive(i);
    api.current?.open(i, user);
  };

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cssW = 1, cssH = 1;
    const s = {
      sc: apps.map(() => 1), sv: apps.map(() => 0), by: apps.map(() => 0), bv: apps.map(() => 0), hops: apps.map(() => 0),
      hx: restX(2) as number | null, sx: 0, sy: 0, px: 0, py: 0, dot: 2, glow: 1, dotX: restX(2),
      count: 0, fresh: true, frame: 0, slow: 0, visible: true, raf: 0, last: 0, t0: 0, touched: false, alive: true,
      focusI: -1, tip: -1, fpsN: 0, fpsT: 0, nextDemo: 0, demoStep: 0,
    };
    // the first picture: the camera tile already swollen under a resting pointer
    s.sc = apps.map((_, i) => 1 + MAG * Math.exp(-Math.pow((restX(i) - restX(2)) / REACH, 2)));
    s.by = s.sc.map((v) => (v - 1) * 0.42);

    const place = () => {
      const c = camera(cssW, cssH, s.sx, s.sy);
      const { xs } = layoutX(s.sc);
      apps.forEach((_, i) => {
        const el = btns.current[i]; if (!el) return;
        const b = tileBox(c, xs[i], s.by[i], s.sc[i], cssW, cssH);
        el.style.transform = `translate(${(b.x - 4).toFixed(1)}px, ${(b.y - 4).toFixed(1)}px)`;
        el.style.width = `${(b.w + 8).toFixed(1)}px`; el.style.height = `${(b.h + 8).toFixed(1)}px`;
      });
      const t = tipEl.current;
      if (t && s.tip >= 0) {
        const b = tileBox(c, xs[s.tip], s.by[s.tip], s.sc[s.tip], cssW, cssH);
        t.style.transform = `translate(${(b.x + b.w / 2).toFixed(1)}px, ${(b.y - 12).toFixed(1)}px) translate(-50%, -100%)`;
      }
    };
    const setTipI = (i: number) => { if (s.tip !== i) { s.tip = i; setTip(i); } };

    const resizeView = () => { const r = box.getBoundingClientRect(); cssW = Math.max(1, r.width); cssH = Math.max(1, r.height); setView([cssW, cssH]); place(); };
    resizeView();

    const opts = { antialias: false, alpha: false, powerPreference: "high-performance" as const };
    const gl2 = cv.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? cv.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) { setShown("still"); const r0 = new ResizeObserver(resizeView); r0.observe(box); return () => r0.disconnect(); }
    const canAcc = !!gl2 && (!!gl2.getExtension("EXT_color_buffer_float") || !!gl2.getExtension("EXT_color_buffer_half_float"));
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const software = /swiftshader|llvmpipe|software|basic render/i.test(info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "");
    const head = gl2 ? "#version 300 es\n#define ATTR in\n" : "#define ATTR attribute\n";
    const fhead = gl2 ? "#version 300 es\n#define texture2D texture\n#define TEXL(s, uv, l) textureLod(s, uv, l)\nprecision highp float;\nout vec4 outC;\n" : "#define outC gl_FragColor\n#define TEXL(s, uv, l) texture2D(s, uv)\n";
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type); if (!sh) return null;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); return null; }
      return sh;
    };
    const link = (frag: string) => {
      const v = compile(gl.VERTEX_SHADER, head + VERT), f = compile(gl.FRAGMENT_SHADER, fhead + frag);
      const p = gl.createProgram(); if (!v || !f || !p) return null;
      gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    };
    const scene = link(SCENE), post = canAcc ? link(POST) : null;
    if (!scene || (canAcc && !post)) { setShown("still"); return; }
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uDirect", "uCam", "uTgt", "uFoc", "uFocus", "uShift", "uIcon", "uTray", "uSun", "uTex"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain"].map((n) => [n, U(post, n)])) : {};

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, glyphPlate());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1;
    const size = () => {
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.3e6 / (cssW * cssH * dpr * dpr)));
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
        gl.activeTexture(gl.TEXTURE0);
      }
      s.count = 0; s.fresh = true;
    };
    const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

    const draw = (alpha: number, sample: number) => {
      const c = camera(cssW, cssH, s.sx, s.sy);
      const { xs, half } = layoutX(s.sc);
      const fd = dot(sub([0, 0.45, -0.3], c.cam), c.fw);
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.16 : 0;
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
      gl.uniform4fv(su.uIcon, apps.flatMap((_, i) => [xs[i], s.by[i], s.sc[i], 0]));
      s.dotX += (xs[s.dot] - s.dotX) * 0.35;
      gl.uniform4f(su.uTray, half, xs[s.dot], s.glow, 0);
      const sa = -1.62, se = 0.6; // the sun: from the left and a little behind, so shadows fall toward you
      gl.uniform3f(su.uSun, Math.sin(sa) * Math.cos(se), Math.sin(se), -Math.cos(sa) * Math.cos(se));
      gl.uniform1i(su.uTex, 0);
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

    // Opening an app: the tile hops twice and the lamp moves under it.
    api.current = {
      open: (i, user) => {
        if (user) s.touched = true;
        s.dot = i; s.glow = 1.6;
        if (!reduce) { s.bv[i] = 3.4; s.hops[i] = 2; }
        s.count = 0; s.fresh = true; wake();
      },
      hover: (i) => { s.focusI = i; if (i >= 0) { s.touched = true; s.hx = restX(i); setTipI(i); } else { s.hx = null; setTipI(-1); } wake(); },
    };

    const step = (dt: number, now: number) => {
      let moving = false;
      for (let i = 0; i < N; i++) {
        const target = s.hx === null ? 1 : 1 + MAG * Math.exp(-Math.pow((restX(i) - s.hx) / REACH, 2));
        const n = 3;
        for (let k = 0; k < n; k++) {
          const h = dt / n;
          s.sv[i] += (-260 * (s.sc[i] - target) - 24 * s.sv[i]) * h; s.sc[i] += s.sv[i] * h;
          // the hop: thrown up, falls, lands back on its swell height with a smaller second hop
          const rest = (s.sc[i] - 1) * 0.42;
          if (s.by[i] > rest + 0.0005 || s.bv[i] > 0) {
            s.bv[i] -= 22 * h; s.by[i] += s.bv[i] * h;
            if (s.by[i] <= rest) { s.by[i] = rest; s.bv[i] = s.hops[i] > 1 ? 2.0 : 0; s.hops[i] = Math.max(0, s.hops[i] - 1); }
          } else { s.by[i] = rest; s.bv[i] = 0; }
        }
        if (Math.abs(s.sv[i]) > 0.002 || Math.abs(s.sc[i] - target) > 0.001 || s.bv[i] !== 0) moving = true;
      }
      if (s.glow > 1) { s.glow = Math.max(1, s.glow - dt * 1.2); moving = true; }
      void now;
      return moving;
    };

    // Left alone, a pointer drifts along the dock now and then and opens what it rests on.
    const demo = (now: number) => {
      if (reduce || s.touched) return;
      const t = (now - s.t0) / 1000;
      if (t < 3.6) { s.hx = restX(2); return; }
      if (now < s.nextDemo) return;
      const seq = [restX(0) - 0.4, restX(1), restX(3), restX(5), null, restX(4), restX(4), null, restX(1), restX(2), null];
      const v = seq[s.demoStep % seq.length];
      if (v === null && s.hx !== null) {
        const i = Math.round((s.hx + REST_HALF - 0.5) / (1 + GAP));
        if (i >= 0 && i < N) { activeRef.current = i; setActive(i); api.current?.open(i, false); }
      }
      s.hx = v; s.demoStep++; s.nextDemo = now + (v === null ? 1700 : 900);
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible || !s.alive) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.nextDemo = now + 3600; }
      demo(now);
      let moving = reduce ? false : step(dt, now);
      if (!reduce) {
        const k = 1 - Math.exp(-dt * 3);
        const dx = s.px - s.sx, dy = s.py - s.sy;
        s.sx += dx * k; s.sy += dy * k;
        if (Math.abs(dx) + Math.abs(dy) > 0.003) moving = true;
      }
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(0.55, 1 + (s.frame % 64)); s.count = 4; }
      else if (s.count < 36) { s.count++; draw(1 / s.count, s.count); }
      place();
      if (shownRef.first) { shownRef.first = false; setShown("gl"); }
      if (moving && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 30 && scale > 0.45) { scale *= 0.82; s.slow = 0; size(); }
      if (moving) { s.fpsN++; s.fpsT += dtRaw; }
      box.dataset.fps = s.fpsT > 0 ? (s.fpsN / s.fpsT).toFixed(1) : "";
      if (moving || s.count < 36 || (!reduce && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const shownRef = { first: true };
    const wake = () => { if (!s.raf && s.visible && s.alive) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { resizeView(); size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = box.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (!reduce) { s.px = (x / r.width) * 2 - 1; s.py = (y / r.height) * 2 - 1; }
      const c = camera(cssW, cssH, s.sx, s.sy);
      const [wx, wy] = unproject(c, x, y, cssW, cssH);
      const { half } = layoutX(s.sc);
      const over = Math.abs(wx) < half + 0.3 && wy > -0.4 && wy < 2.3;
      s.touched = true;
      if (over) {
        s.hx = wx;
        const i = Math.max(0, Math.min(N - 1, Math.round((wx + REST_HALF - 0.5) / (1 + GAP))));
        setTipI(i);
      } else if (s.focusI < 0) { s.hx = null; setTipI(-1); }
      wake();
    };
    const leave = () => { s.px = 0; s.py = 0; if (s.focusI < 0) { s.hx = null; setTipI(-1); } wake(); };
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
    const i = btns.current.findIndex((b) => b === document.activeElement);
    if (i < 0) return;
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % N;
    else if (e.key === "ArrowLeft") n = (i - 1 + N) % N;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = N - 1;
    if (n >= 0) { e.preventDefault(); btns.current[n]?.focus(); }
  };
  const a = apps[active];

  return (
    <section className="relative isolate overflow-hidden text-[#1f1a14]" style={{ fontFamily: FONT, background: PAPER }}>
      <style>{`
        @keyframes stoneware-dock-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .stoneware-dock-rise > * { animation: stoneware-dock-rise 620ms cubic-bezier(0.2, 0.9, 0.25, 1) both; }
        .stoneware-dock-rise > *:nth-child(2) { animation-delay: 80ms; }
        @media (prefers-reduced-motion: reduce) { .stoneware-dock-rise > * { animation: none; } }
      `}</style>
      <div ref={stage} className="relative h-[480px] w-full md:h-[700px]">
        {shown !== "gl" && <Still w={view[0]} h={view[1]} active={active} />}
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        <div className="pointer-events-none absolute inset-x-0 top-0 px-5 pt-7 md:px-14 md:pt-12" aria-live="polite">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#4a4036]">Open on the desk</p>
          <div key={a.id} className="stoneware-dock-rise">
            <h2 className="mt-3 text-[56px] font-semibold leading-[0.92] tracking-[-0.045em] text-[#1b1611] md:text-[112px]">{a.label}</h2>
            <p className="mt-3 max-w-[30ch] text-[15px] leading-[1.5] text-[#3d342b] md:mt-4 md:text-[18px]">{a.line}</p>
          </div>
        </div>
        <div
          ref={tipEl}
          aria-hidden="true"
          className={`pointer-events-none absolute left-0 top-0 rounded-full bg-[#1b1611]/85 px-3 py-1.5 text-[12px] font-semibold tracking-[0.01em] text-[#f4efe6] shadow-[0_6px_18px_rgba(40,30,20,0.25)] transition-opacity duration-150 motion-reduce:transition-none ${tip >= 0 ? "opacity-100" : "opacity-0"}`}
        >
          {tip >= 0 ? apps[tip].label : ""}
        </div>
        <nav aria-label="Dock" className="absolute inset-0" onKeyDown={onKey}>
          <ul className="contents">
            {apps.map((ap, i) => (
              <li key={ap.id} className="contents">
                <button
                  ref={(el) => { btns.current[i] = el; }}
                  type="button"
                  aria-label={`Open ${ap.label}`}
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => open(i)}
                  onFocus={() => api.current?.hover(i)}
                  onBlur={() => api.current?.hover(-1)}
                  className="absolute left-0 top-0 h-16 w-16 rounded-[22%] outline-none focus-visible:ring-2 focus-visible:ring-[#1b1611] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                />
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
