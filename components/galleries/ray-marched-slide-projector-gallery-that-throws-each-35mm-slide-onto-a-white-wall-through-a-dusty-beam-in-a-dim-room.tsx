import { useEffect, useRef, useState } from "react";

/** The slides in the tray, in order. `note` is the pencilled line on the mount. */
const slides = [
  { title: "Rowing out on the green lake", note: "Roll 2, first light", src: "https://images.pexels.com/photos/138903/pexels-photo-138903.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A small red boat on a still green lake below grey cliffs and pine trees" },
  { title: "The canoe rode on the roof all summer", note: "Roll 2, the long weekend", src: "https://images.pexels.com/photos/5379770/pexels-photo-5379770.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "An old white saloon car with a canoe strapped to its roof, parked on a pebbly beach by calm water" },
  { title: "Fringe of the parasol, open sea", note: "Roll 3, noon", src: "https://images.pexels.com/photos/39460907/pexels-photo-39460907.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Cream fringes of two beach parasols hanging against a pale sky above a deep blue sea" },
  { title: "The lighthouse above all that blue", note: "Roll 3, the cliff path", src: "https://images.pexels.com/photos/15794808/pexels-photo-15794808.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A small white lighthouse on a steep grassy headland above a wide dark blue sea" },
  { title: "Morning catch, still tied up", note: "Roll 4, the harbour", src: "https://images.pexels.com/photos/35633151/pexels-photo-35633151.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A white and blue wooden fishing boat with orange canopy moored in a busy harbour" },
  { title: "Last road before the dark", note: "Roll 4, driving home", src: "https://images.pexels.com/photos/28202557/pexels-photo-28202557.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "An empty road running into flat desert under a hazy gold sky with low mountains far off" },
];
const N = slides.length;
const HOLD_MS = 6200; // how long the self-running show holds each slide
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const thumb = (src: string) => src.replace("w=1200", "w=360");

// The room, in metres. The wall is the plane z = 0, the floor y = 0.
const LENS: [number, number, number] = [0.55, 0.985, 3.3];
const AIM: [number, number, number] = [0.55, 1.6, 0];
const TX = 0.29, TY = TX / 1.5; // half the throw angle, as tangents, for a 3:2 frame

const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform sampler2D uTex; uniform vec3 uAvg; uniform float uHasTex;
uniform float uOpen; uniform float uBlur; uniform float uTray;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFov;
uniform vec3 uL; uniform vec3 uF; uniform vec3 uR; uniform vec3 uU; uniform vec3 uWc;
const float TX = ${TX.toFixed(4)}; const float TY = ${TY.toFixed(4)};
const vec3 LAMP = vec3(1.0, 0.84, 0.66);
const vec3 PRAC = vec3(-2.3, 1.45, 4.9);

float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float h31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float n3(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }

// ---------- where a point sits in the projector's frame ----------
vec2 toFrame(vec3 p, out float z){
  vec3 d = p - uL; z = dot(d, uF);
  if (z < 0.01) return vec2(9.0);
  return vec2(dot(d, uR) / (z * TX), dot(d, uU) / (z * TY));
}
// the 35mm gate: a rectangle with slightly rounded corners
float gate(vec2 q, float soft){
  vec2 a = abs(q) * vec2(1.5, 1.0);
  vec2 e = a - vec2(1.5 - 0.05, 1.0 - 0.05);
  float sd = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0) - 0.05;
  return smoothstep(soft, -soft, sd);
}
vec3 film(vec2 q, float bias){
  vec2 uv = q * 0.5 + 0.5;
  vec3 c = texture2D(uTex, uv, bias).rgb;
  if (uBlur > 0.02) {
    float r = uBlur * 0.03;
    c = (c + texture2D(uTex, uv + vec2(r, 0.0), bias).rgb + texture2D(uTex, uv - vec2(r, 0.0), bias).rgb
           + texture2D(uTex, uv + vec2(0.0, r * 1.5), bias).rgb + texture2D(uTex, uv - vec2(0.0, r * 1.5), bias).rgb) * 0.2;
  }
  c = pow(c, vec3(2.2));
  // a little of that slide-film density: rich mids, warm highlights
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, 1.15) * vec3(1.02, 0.99, 0.94);
  c = c * c * (3.0 - 2.0 * c) * 0.35 + c * 0.65;
  return mix(vec3(0.92), c, uHasTex);
}
// light the projector throws onto a surface point
vec3 thrown(vec3 p, vec3 n, float bias){
  float z; vec2 q = toFrame(p, z);
  if (q.x > 8.0) return vec3(0.0);
  vec3 d = p - uL; float dist2 = dot(d, d);
  float cosi = max(dot(n, -normalize(d)), 0.0);
  float soft = 0.004 + uBlur * 0.03;
  float m = gate(q, soft);
  if (m <= 0.0) return vec3(0.0);
  float vig = 1.0 - 0.16 * dot(q * vec2(1.0, 0.8), q * vec2(1.0, 0.8));
  vig *= 1.0 + 0.07 * exp(-dot(q, q) * 3.0);
  return LAMP * film(q, bias) * m * vig * cosi * 16.0 / dist2 * uOpen;
}
// what the bright picture on the wall gives back to the rest of the room
vec3 bounce(vec3 p, vec3 n){
  vec3 d = uWc - p; float l2 = dot(d, d); vec3 w = d / sqrt(l2);
  float wallFacing = max(dot(-w, vec3(0.0, 0.0, 1.0)), 0.0);
  return uAvg * LAMP * uOpen * 1.15 * max(dot(n, w), 0.0) * wallFacing / (0.6 + l2);
}
vec3 practical(vec3 p, vec3 n){
  vec3 d = PRAC - p; float l2 = dot(d, d);
  return vec3(1.0, 0.62, 0.32) * 0.9 * max(dot(n, d / sqrt(l2)), 0.0) / (1.0 + l2);
}

// ---------- the projector and its cabinet ----------
float sdBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdCylY(vec3 p, float r, float h){ vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
float sdCylZ(vec3 p, float r, float h){ vec2 d = abs(vec2(length(p.xy), p.z)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
vec3 local(vec3 p){ vec3 d = p - uL; return vec3(dot(d, uR), dot(d, uU), dot(d, uF)); }
const vec3 CAB = vec3(0.6, 0.395, 3.58);
const vec3 TRAYC = vec3(0.0, 0.095, -0.35);
vec2 map(vec3 p){
  // the walnut cabinet it stands on
  float cab = sdBox(p - CAB, vec3(0.48, 0.395, 0.36), 0.012);
  vec2 res = vec2(cab, 1.0);
  vec3 q = local(p);
  // body
  float body = sdBox(q - vec3(0.0, -0.02, -0.34), vec3(0.165, 0.068, 0.20), 0.03);
  // a shallow top deck the tray sits in
  body = min(body, sdBox(q - vec3(0.0, 0.05, -0.34), vec3(0.15, 0.012, 0.18), 0.01));
  if (body < res.x) res = vec2(body, 2.0);
  // lens barrel and its front ring
  float lens = sdCylZ(q - vec3(0.0, -0.005, -0.06), 0.046, 0.065);
  lens = min(lens, sdCylZ(q - vec3(0.0, -0.005, -0.008), 0.05, 0.012));
  if (lens < res.x) res = vec2(lens, 3.0);
  // round tray, turning on its hub
  vec3 t = q - TRAYC;
  float c = cos(uTray), s = sin(uTray);
  t.xz = mat2(c, -s, s, c) * t.xz;
  float tray = sdCylY(t, 0.172, 0.036) - 0.004;
  // the open well in the middle, and the ribbed outer wall
  float ang = atan(t.z, t.x);
  float rib = 0.0;
  tray = max(tray, -sdCylY(t - vec3(0.0, 0.03, 0.0), 0.062, 0.02));
  tray -= rib * step(0.165, length(t.xz));
  if (tray < res.x) res = vec2(tray, 4.0);
  float hub = sdCylY(t - vec3(0.0, 0.03, 0.0), 0.036, 0.02) - 0.004;
  if (hub < res.x) res = vec2(hub, 5.0);
  // the slides stand in radial slots, their top edges just proud of the tray
  float a = mod(ang + 3.14159265, 6.2831853 / 40.0) - 3.14159265 / 40.0;
  float rr = length(t.xz);
  vec3 sp = vec3(rr - 0.115, t.y - 0.035, rr * sin(a));
  float sl = sdBox(sp, vec3(0.046, 0.016, 0.0018), 0.0006);
  if (sl < res.x) res = vec2(sl, 6.0);
  // one feet strut at the front, under the lens
  float foot = sdCylY(q - vec3(0.0, -0.12, -0.13), 0.012, 0.05);
  if (foot < res.x) res = vec2(foot, 3.0);
  return res;
}
vec3 nrm(vec3 p){
  vec2 e = vec2(0.0007, -0.0007);
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}
vec2 boxSpan(vec3 ro, vec3 rd, vec3 lo, vec3 hi){
  vec3 inv = 1.0 / (rd + vec3(1e-6)); vec3 a = (lo - ro) * inv; vec3 b = (hi - ro) * inv;
  vec3 mn = min(a, b); vec3 mx = max(a, b);
  return vec2(max(max(mn.x, mn.y), max(mn.z, 0.0)), min(mx.x, min(mx.y, mx.z)));
}
vec2 march(vec3 ro, vec3 rd){
  vec2 tb = boxSpan(ro, rd, vec3(0.05, 0.0, 2.95), vec3(1.15, 1.25, 4.1));
  if (tb.x > tb.y) return vec2(-1.0);
  float t = tb.x;
  for (int i = 0; i < 96; i++) {
    vec2 h = map(ro + rd * t);
    if (h.x < 0.0004 * t) return vec2(t, h.y);
    t += h.x * 0.9;
    if (t > tb.y) break;
  }
  return vec2(-1.0);
}
float ao(vec3 p, vec3 n){
  float o = 0.0, s = 1.0;
  for (int i = 1; i <= 4; i++) { float h = 0.01 + 0.035 * float(i); o += (h - map(p + n * h).x) * s; s *= 0.65; }
  return clamp(1.0 - 3.0 * o, 0.0, 1.0);
}
float soft(vec3 ro, vec3 rd, float maxt){
  float r = 1.0, t = 0.02;
  for (int i = 0; i < 20; i++) { float h = map(ro + rd * t).x; r = min(r, 10.0 * h / t); t += clamp(h, 0.02, 0.2); if (r < 0.02 || t > maxt) break; }
  return clamp(r, 0.0, 1.0);
}

// ---------- the room's flat surfaces ----------
float planeT(float o, float d, float at){ float t = (at - o) / d; return (t > 0.0) ? t : 1e9; }
vec3 wallRad(vec3 p, float bias){
  vec3 n = vec3(0.0, 0.0, 1.0);
  float plaster = 0.8 * (0.94 + 0.06 * n2(p.xy * 9.0) + 0.03 * n2(p.xy * 61.0));
  float skirting = step(p.y, 0.13);
  vec3 alb = mix(vec3(plaster) * vec3(1.0, 0.985, 0.95), vec3(0.62, 0.6, 0.56), skirting);
  float hz; vec2 hq = toFrame(p, hz);
  float halo = hq.x > 8.0 ? 0.0 : exp(-length(max(abs(hq) - 1.0, 0.0)) * 22.0) * (1.0 - gate(hq, 0.01));
  vec3 e = thrown(p, n, bias) + LAMP * uAvg * uOpen * halo * 0.1 + bounce(p, n) * 0.35 + practical(p, n) + vec3(0.006, 0.0045, 0.0035);
  return alb * e / 3.14159;
}
vec3 shadeRoom(vec3 ro, vec3 rd, out float tHit, float jit){
  float tw = rd.z < 0.0 ? planeT(ro.z, rd.z, 0.0) : 1e9;
  float tf = rd.y < 0.0 ? planeT(ro.y, rd.y, 0.0) : 1e9;
  float tc = rd.y > 0.0 ? planeT(ro.y, rd.y, 2.85) : 1e9;
  float tl = rd.x < 0.0 ? planeT(ro.x, rd.x, -3.3) : 1e9;
  float tr = rd.x > 0.0 ? planeT(ro.x, rd.x, 3.9) : 1e9;
  float t = min(min(tw, tf), min(tc, min(tl, tr)));
  tHit = t;
  vec3 p = ro + rd * t;
  if (t == tw) return wallRad(p, 0.0);
  if (t == tf) {
    vec3 n = vec3(0.0, 1.0, 0.0);
    // oiled oak boards running toward the wall
    float bw = 0.14; float bi = floor(p.x / bw);
    float grain = n2(vec2(p.x * 60.0, p.z * 3.0 + bi * 7.1));
    float tone = 0.75 + 0.5 * h11(bi);
    vec3 alb = vec3(0.16, 0.095, 0.055) * tone * (0.75 + 0.4 * grain);
    float seam = smoothstep(0.004, 0.0, abs(fract(p.x / bw) - 0.0) * bw) + smoothstep(0.004, 0.0, (1.0 - fract(p.x / bw)) * bw);
    alb *= 1.0 - 0.55 * seam;
    // the cabinet keeps a soft patch of floor out of the bounce
    float occ = 1.0 - 0.7 * exp(-pow(length((p.xz - CAB.xz) / vec2(0.6, 0.45)), 2.0) * 1.6);
    vec3 e = (bounce(p, n) * 0.6 + practical(p, n) + vec3(0.005)) * occ;
    vec3 col = alb * e / 3.14159;
    // a satin reflection of the lit wall, stretched by the boards
    vec3 r = reflect(rd, n);
    r.xz += (vec2(n2(p.xz * 8.0), n2(p.zx * 8.0 + 3.0)) - 0.5) * 0.05;
    if (r.z < 0.0) {
      float t2 = -p.z / r.z; vec3 w = p + r * t2;
      if (w.y > 0.0 && w.y < 2.85) {
        float fr = 0.03 + 0.5 * pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
        col += wallRad(w, 4.0 + t2 * 0.6) * fr * 0.9 * occ;
      }
    }
    return col;
  }
  vec3 n = t == tc ? vec3(0.0, -1.0, 0.0) : (t == tl ? vec3(1.0, 0.0, 0.0) : vec3(-1.0, 0.0, 0.0));
  vec3 alb = t == tc ? vec3(0.55, 0.53, 0.5) : vec3(0.2, 0.19, 0.165) * (0.92 + 0.08 * n2(p.zy * 7.0));
  vec3 e = bounce(p, n) + practical(p, n) * (t == tl ? 0.15 : 1.0) + vec3(0.004);
  return alb * e / 3.14159;
}

vec3 shadeObj(vec3 p, vec3 rd, float id){
  vec3 n = nrm(p); vec3 v = -rd;
  vec3 q = local(p);
  vec3 alb; float rough; float metal = 0.0; vec3 emit = vec3(0.0);
  if (id < 1.5) {
    // walnut veneer, grain running along x
    float g = n2(vec2(p.x * 3.0, p.y * 70.0 + p.z * 40.0)) * 0.6 + n2(vec2(p.x * 18.0, p.y * 220.0)) * 0.4;
    alb = vec3(0.15, 0.07, 0.032) * (0.55 + 0.9 * g); rough = 0.3;
  } else if (id < 2.5) {
    // the body: warm taupe stove enamel with a fine orange-peel
    alb = vec3(0.36, 0.3, 0.24) * (0.96 + 0.04 * n2(q.xz * 300.0)); rough = 0.42;
    // rear grille, lamp light leaking through the slats
    if (q.z < -0.52) {
      float slat = smoothstep(0.35, 0.5, abs(fract(q.y * 55.0) - 0.5)) * step(abs(q.x), 0.11) * step(abs(q.y + 0.02), 0.045);
      emit = vec3(1.0, 0.55, 0.22) * slat * 0.1 * (0.9 + 0.1 * sin(uTime * 3.0));
      alb *= 1.0 - 0.8 * slat;
    }
  } else if (id < 3.5) { alb = vec3(0.035); rough = 0.22; metal = 0.15;
    // the front element, lit from inside by the lamp
    if (q.z > -0.004 && length(q.xy - vec2(0.0, -0.005)) < 0.04) emit = LAMP * 2.6 * uOpen * smoothstep(0.04, 0.02, length(q.xy - vec2(0.0, -0.005)));
    // knurled focus ring
    if (q.z < -0.03 && q.z > -0.07) alb *= 1.0 + 1.5 * step(0.5, fract(atan(q.y + 0.005, q.x) * 9.55)); }
  else if (id < 4.5) { alb = vec3(0.075, 0.07, 0.066); rough = 0.35; }
  else if (id < 5.5) { alb = vec3(0.7, 0.68, 0.64); rough = 0.2; metal = 1.0; }
  else { alb = vec3(0.86, 0.82, 0.72); rough = 0.75; }
  float occ = ao(p, n);
  // light: the bright wall in front, the warm lamp at the back left, a little ambient
  vec3 wl = normalize(uWc - p);
  vec3 lp = normalize(PRAC - p);
  float sh = soft(p + n * 0.004, lp, 3.0);
  vec3 E = bounce(p, n) * 1.6 + practical(p, n) * 1.4 * (0.35 + 0.65 * sh) + vec3(0.012, 0.01, 0.008) * occ * (0.6 + 0.4 * n.y);
  vec3 col = alb * (1.0 - metal) * E / 3.14159 * occ;
  // specular from the wall glow and the lamp, a broad soft lobe
  float f0 = mix(0.04, 1.0, metal);
  vec3 spc = mix(vec3(f0), alb, metal);
  float fr = f0 + (1.0 - f0) * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  float a2 = rough * rough;
  vec3 h1 = normalize(wl + v); float d1 = a2 / (3.14159 * pow(pow(max(dot(n, h1), 0.0), 2.0) * (a2 - 1.0) + 1.0, 2.0));
  vec3 h2 = normalize(lp + v); float d2 = a2 / (3.14159 * pow(pow(max(dot(n, h2), 0.0), 2.0) * (a2 - 1.0) + 1.0, 2.0));
  col += spc * (d1 * uAvg * LAMP * uOpen * 0.05 * max(dot(n, wl), 0.0) + d2 * vec3(1.0, 0.62, 0.32) * 0.03 * sh * max(dot(n, lp), 0.0));
  col += fr * 0.02 * occ * uAvg * uOpen;
  return col + emit;
}

// ---------- the beam: dust lit by the picture on its way out ----------
void clipPlane(vec3 ro, vec3 rd, vec3 n, float off, inout vec2 tb){
  float a = dot(ro - uL, n) - off; float b = dot(rd, n);
  if (abs(b) < 1e-6) { if (a > 0.0) tb = vec2(1.0, 0.0); return; }
  float t = -a / b;
  if (b > 0.0) tb.y = min(tb.y, t); else tb.x = max(tb.x, t);
}
vec3 beam(vec3 ro, vec3 rd, float tmax, float jit){
  // only march the stretch of the ray that is inside the cone of light
  vec2 tb = vec2(0.0, tmax);
  clipPlane(ro, rd, uR - uF * TX * 1.03, 0.0, tb);
  clipPlane(ro, rd, -uR - uF * TX * 1.03, 0.0, tb);
  clipPlane(ro, rd, uU - uF * TY * 1.04, 0.0, tb);
  clipPlane(ro, rd, -uU - uF * TY * 1.04, 0.0, tb);
  clipPlane(ro, rd, -uF, -0.02, tb);
  if (tb.x >= tb.y) return vec3(0.0);
  vec3 acc = vec3(0.0);
  const int STEPS = 40;
  float dt = (tb.y - tb.x) / float(STEPS);
  vec3 drift = vec3(0.04, 0.06, -0.02) * uTime;
  for (int i = 0; i < STEPS; i++) {
    float t = tb.x + (float(i) + jit) * dt;
    vec3 p = ro + rd * t;
    float z; vec2 q = toFrame(p, z);
    if (q.x > 8.0) continue;
    float m = gate(q, 0.03);
    if (m <= 0.0) continue;
    vec3 dp = p * 5.0 + drift;
    float wisp = n3(dp) * 0.65 + n3(dp * 2.7 + 11.0) * 0.35;
    float dens = 0.3 + 1.1 * pow(wisp, 2.5);
    // individual specks catch the light
    vec3 cell = floor(p * 38.0 + drift * 10.0);
    float hs = h31(cell);
    dens += step(0.997, hs) * 6.0 * smoothstep(0.5, 0.15, length(fract(p * 38.0 + drift * 10.0) - 0.5));
    vec3 c = film(q, 3.0) * m;
    acc += c * dens * dt / (z * z + 0.02);
  }
  return acc * LAMP * uOpen * 0.22;
}

vec3 aces(vec3 x){ vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return clamp(a / b, 0.0, 1.0); }

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))); vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw + (uv.x * rt + uv.y * up) * uFov);
  vec3 ro = uCam;
  float jit = h21(gl_FragCoord.xy + fract(uTime * 7.13) * 91.0);
  float tR; vec3 col = shadeRoom(ro, rd, tR, jit);
  vec2 o = march(ro, rd);
  float tEnd = tR;
  if (o.x > 0.0 && o.x < tR) { col = shadeObj(ro + rd * o.x, rd, o.y); tEnd = o.x; }
  col += beam(ro, rd, tEnd, jit);
  col *= 2.3;
  col = aces(col);
  col = pow(col, vec3(1.0 / 2.2));
  vec2 sv = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - 0.45 * dot(sv, sv);
  col += (h21(gl_FragCoord.xy * 1.37 + fract(uTime) * 311.0) - 0.5) * 0.028;
  gl_FragColor = vec4(col, 1.0);
}
`;

type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Draws a photo into a square power-of-two canvas, cropped to 3:2 and stretched, so it can carry mipmaps. */
function slideCanvas(img: HTMLImageElement) {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 1024;
  const g = c.getContext("2d");
  if (!g) return { canvas: c, avg: [0.6, 0.55, 0.5] as V3 };
  const ar = img.naturalWidth / img.naturalHeight;
  let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
  if (ar > 1.5) { sw = sh * 1.5; sx = (img.naturalWidth - sw) / 2; } else { sh = sw / 1.5; sy = (img.naturalHeight - sh) / 2; }
  g.drawImage(img, sx, sy, sw, sh, 0, 0, 1024, 1024);
  const s = document.createElement("canvas"); s.width = 8; s.height = 8;
  const sg = s.getContext("2d");
  let avg: V3 = [0.6, 0.55, 0.5];
  if (sg) {
    sg.drawImage(c, 0, 0, 8, 8);
    try {
      const d = sg.getImageData(0, 0, 8, 8).data; let r = 0, gg = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) { r += (d[i] / 255) ** 2.2; gg += (d[i + 1] / 255) ** 2.2; b += (d[i + 2] / 255) ** 2.2; }
      avg = [r / 64, gg / 64, b / 64];
    } catch { /* a tainted canvas keeps the warm default */ }
  }
  return { canvas: c, avg };
}

export default function RayMarchedSlideProjectorGallery() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<"wait" | "gl" | "still">("wait");
  const api = useRef<{ go: (i: number, user: boolean) => void } | null>(null);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" }) as WebGLRenderingContext | null;
    if (!gl) { setMode("still"); return; }
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type); if (!sh) return null;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); return null; }
      return sh;
    };
    const v = compile(gl.VERTEX_SHADER, VERT), f = compile(gl.FRAGMENT_SHADER, FRAG), prog = gl.createProgram();
    if (!v || !f || !prog) { setMode("still"); return; }
    gl.attachShader(prog, v); gl.attachShader(prog, f); gl.bindAttribLocation(prog, 0, "aPos"); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setMode("still"); return; }
    gl.useProgram(prog);
    const u = Object.fromEntries(["uRes", "uTime", "uTex", "uAvg", "uHasTex", "uOpen", "uBlur", "uTray", "uCam", "uTgt", "uFov", "uL", "uF", "uR", "uU", "uWc"].map((n) => [n, gl.getUniformLocation(prog, n)]));
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([235, 228, 215, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.uniform1i(u.uTex, 0);

    const loaded: ({ canvas: HTMLCanvasElement; avg: V3 } | null)[] = slides.map(() => null);
    const s = {
      shown: -1, want: 0, avg: [0.6, 0.55, 0.5] as V3, has: 0,
      open: 1, blur: 0, bv: 0, tray: 0, trayV: 0, trayT: 0, phase: "idle" as "idle" | "close" | "open",
      pt: 0, kick: 0, kv: 0, px: 0, py: 0, sx: 0, sy: 0,
      visible: true, raf: 0, last: 0, t: 0, user: false, nextAt: HOLD_MS, frames: 0, fpsT: 0, slow: 0, scale: 1, dirty: true, glShown: false,
    };
    let W = 0, H = 0;
    const size = () => {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(1.5, window.devicePixelRatio || 1) * s.scale;
      const k = Math.min(1, Math.sqrt(9.0e5 / (r.width * r.height * dpr * dpr)));
      const w = Math.max(2, Math.round(r.width * dpr * k)), h = Math.max(2, Math.round(r.height * dpr * k));
      if (w !== W || h !== H) { W = w; H = h; cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); s.dirty = true; }
    };
    const upload = (i: number) => {
      const L = loaded[i]; if (!L) return false;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, L.canvas);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      s.avg = L.avg; s.has = 1; s.shown = i; s.dirty = true;
      return true;
    };
    slides.forEach((sl, i) => {
      const img = new Image(); img.crossOrigin = "anonymous"; img.decoding = "async";
      img.onload = () => { loaded[i] = slideCanvas(img); if (i === s.want && s.phase === "idle" && s.shown !== i) { upload(i); wake(); } };
      img.src = sl.src;
    });

    const go = (i: number, user: boolean) => {
      const n = ((i % N) + N) % N;
      if (user) s.user = true;
      setIdx(n);
      if (n === s.want) return;
      const steps = ((n - s.want + N + N / 2) % N) - N / 2 || N / 2;
      s.trayT += steps * (Math.PI * 2 / 40);
      s.want = n;
      if (reduce) { s.tray = s.trayT; upload(n); wake(); return; }
      s.phase = "close"; s.pt = 0; s.kv += 2.2;
      wake();
    };
    api.current = { go };

    const camFor = () => {
      const r = box.getBoundingClientRect(); const ar = r.width / Math.max(1, r.height);
      const narrow = ar < 1.2;
      const cam: V3 = narrow ? [-1.7 + s.sx * 0.12, 1.5 + s.sy * 0.06, 6.9] : [-2.1 + s.sx * 0.22, 1.5 + s.sy * 0.1, 6.0];
      const tgt: V3 = narrow ? [0.62, 1.3, 1.6] : [1.15, 1.22, 1.2];
      const fov = narrow ? 0.62 : 0.44;
      return { cam, tgt, fov };
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 1 / 60;
      const raw = s.last ? (now - s.last) / 1000 : 0;
      s.last = now; s.t += reduce ? 0 : dt;
      const moving = !reduce;
      // tray: a stiff spring with a little overshoot, like a ratchet landing
      const ta = (s.trayT - s.tray) * 260 - s.trayV * 16;
      s.trayV += ta * dt; s.tray += s.trayV * dt;
      // the whole projector jolts when the gate changes
      s.kv += (-s.kick * 420 - s.kv * 14) * dt; s.kick += s.kv * dt;
      s.sx += (s.px - s.sx) * Math.min(1, dt * 3); s.sy += (s.py - s.sy) * Math.min(1, dt * 3);
      if (s.phase === "close") {
        s.pt += dt; s.open = Math.max(0, 1 - s.pt / 0.14);
        if (s.pt > 0.3 && (upload(s.want) || s.pt > 1.6)) { s.phase = "open"; s.pt = 0; s.blur = 1; s.bv = 0; }
      } else if (s.phase === "open") {
        s.pt += dt; s.open = Math.min(1, s.pt / 0.12);
        if (s.pt > 0.6 && Math.abs(s.blur) < 0.01 && Math.abs(s.bv) < 0.05) { s.phase = "idle"; s.blur = 0; }
      }
      // focus pulls through and settles, a hair past sharp then back
      if (s.phase !== "close") { s.bv += (-s.blur * 70 - s.bv * 9) * dt; s.blur += s.bv * dt; }
      if (!s.user && !reduce && s.t * 1000 > s.nextAt) { s.nextAt = s.t * 1000 + HOLD_MS; go(s.want + 1, false); }
      if (s.shown !== s.want && s.phase === "idle") upload(s.want);

      const L: V3 = [LENS[0], LENS[1] + s.kick * 0.004, LENS[2]];
      const F = norm(sub([AIM[0] + s.kick * 0.01, AIM[1] + s.kick * 0.012, AIM[2]], L));
      const R = norm(cross(F, [0, 1, 0])); const U = cross(R, F);
      const tw = -L[2] / F[2]; const Wc: V3 = [L[0] + F[0] * tw, L[1] + F[1] * tw, 0];
      const { cam, tgt, fov } = camFor();
      gl.uniform2f(u.uRes, W, H); gl.uniform1f(u.uTime, s.t);
      gl.uniform3f(u.uAvg, s.avg[0], s.avg[1], s.avg[2]); gl.uniform1f(u.uHasTex, s.has);
      gl.uniform1f(u.uOpen, s.open); gl.uniform1f(u.uBlur, Math.abs(s.blur)); gl.uniform1f(u.uTray, s.tray);
      gl.uniform3f(u.uCam, ...cam); gl.uniform3f(u.uTgt, ...tgt); gl.uniform1f(u.uFov, fov);
      gl.uniform3f(u.uL, ...L); gl.uniform3f(u.uF, ...F); gl.uniform3f(u.uR, ...R); gl.uniform3f(u.uU, ...U); gl.uniform3f(u.uWc, ...Wc);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      s.dirty = false;
      if (!s.glShown) { s.glShown = true; setMode("gl"); }

      // measured frame rate, and a resolution step down if frames keep running long
      s.frames++; s.fpsT += raw;
      if (s.fpsT > 1) { setFps(Math.round(s.frames / s.fpsT)); s.frames = 0; s.fpsT = 0; }
      if (raw > 0.024) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && s.scale > 0.45) { s.scale *= 0.85; s.slow = 0; size(); }

      const busy = s.phase !== "idle" || Math.abs(s.trayT - s.tray) > 1e-3 || Math.abs(s.kick) > 1e-4 || Math.abs(s.px - s.sx) > 1e-3 || Math.abs(s.py - s.sy) > 1e-3;
      if (moving || busy || s.dirty) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); }); ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.02 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = -(((e.clientY - r.top) / r.height) * 2 - 1);
      wake();
    };
    const leave = () => { s.px = 0; s.py = 0; wake(); };
    box.addEventListener("pointermove", move); box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setMode("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();
    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = (i: number) => { if (api.current) api.current.go(i, true); else setIdx(((i % N) + N) % N); };
  const cur = slides[idx];
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); go(idx + 1); }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); go(idx - 1); }
  };

  return (
    <section className="relative isolate overflow-hidden bg-[#0e0a07] text-[#f3e9da]" style={{ fontFamily: FONT }} aria-roledescription="carousel" aria-label="Holiday slides">
      <style>{`
        @keyframes ray-marched-slide-projector-cap { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .ray-marched-slide-projector-cap { animation: ray-marched-slide-projector-cap 700ms cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion: reduce) { .ray-marched-slide-projector-cap { animation: none; } }
      `}</style>
      <div ref={stage} className="relative h-[440px] w-full sm:h-[600px]" onClick={() => go(idx + 1)}>
        <canvas ref={canvas} className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${mode === "gl" ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
        {mode === "still" && <Still src={cur.src} alt={cur.alt} />}
        {mode !== "still" && <img src={cur.src} alt={cur.alt} className="sr-only" />}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden px-10 pb-9 sm:block">
          <Caption i={idx} title={cur.title} note={cur.note} />
        </div>
      </div>
      <div className="px-5 pb-6 pt-5 sm:hidden"><Caption i={idx} title={cur.title} note={cur.note} /></div>
      <div className="border-t border-[#2a2018] bg-[#120d09] px-4 py-5 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ul className="grid grid-cols-3 gap-3 sm:flex sm:gap-3" role="group" aria-label="Slides in the tray" onKeyDown={onKey}>
            {slides.map((sl, i) => (
              <li key={sl.src}>
                <button
                  type="button"
                  aria-pressed={i === idx}
                  aria-label={`Slide ${i + 1}: ${sl.title}`}
                  onClick={() => go(i)}
                  className={`group relative block w-full rounded-[3px] p-[7px] pb-[15px] shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_6px_14px_rgba(0,0,0,0.5)] transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c27a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#120d09] sm:w-[92px] ${i === idx ? "-translate-y-1.5 bg-[#efe6d4]" : "bg-[#d9cdb6] hover:-translate-y-0.5"}`}
                >
                  <span className="block aspect-[3/2] overflow-hidden rounded-[2px] bg-[#3a2e22]">
                    <img src={thumb(sl.src)} alt="" width={180} height={120} className={`h-full w-full object-cover transition ${i === idx ? "" : "opacity-75 saturate-[.8]"}`} />
                  </span>
                  <span className="absolute bottom-[2px] left-[8px] text-[9px] font-semibold tracking-[0.12em] text-[#5b4a36]">{String(i + 1).padStart(2, "0")}</span>
                  {i === idx && <span className="absolute bottom-[5px] right-[8px] h-1.5 w-1.5 rounded-full bg-[#c2410c]" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => go(idx - 1)} aria-label="Previous slide" className="grid h-11 w-11 place-items-center rounded-full border border-[#4a3a2b] text-[#f3e9da] transition hover:bg-[#2a2018] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c27a]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button type="button" onClick={() => go(idx + 1)} className="flex h-11 items-center gap-2 rounded-full bg-[#f0e3cc] px-5 text-sm font-semibold text-[#1c140d] transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c27a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#120d09]">
              Next slide
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{`Slide ${idx + 1} of ${N}: ${cur.title}`}</p>
      <span className="sr-only">{fps ? `${fps} frames a second` : ""}</span>
    </section>
  );
}

function Caption({ i, title, note }: { i: number; title: string; note: string }) {
  return (
    <div key={i} className="ray-marched-slide-projector-cap max-w-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9a77c]">Slide {String(i + 1).padStart(2, "0")} of {String(N).padStart(2, "0")} <span className="text-[#8a735a]">/</span> {note}</p>
      <h2 className="mt-2 text-[30px] italic leading-[1.05] tracking-[-0.01em] text-[#f6ecdc] sm:text-[46px]" style={{ fontFamily: SERIF }}>{title}</h2>
    </div>
  );
}

/** The no-WebGL picture: the same room built from gradients, with the slide keystoned onto the wall. */
function Still({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#140e0a]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_35%,#3a2d22_0%,#1e1610_55%,#110c08_100%)]" />
      <div className="absolute inset-y-0 right-0 w-[29%] bg-[linear-gradient(90deg,#0f0b08,#0b0806)]" />
      <div className="absolute inset-x-0 bottom-0 h-[16%] bg-[linear-gradient(180deg,#1a120c,#0b0705)]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="rmsp-beam" x1="1" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#fff3dc" stopOpacity="0.55" />
            <stop offset="1" stopColor="#d9e6d0" stopOpacity="0.06" />
          </linearGradient>
          <filter id="rmsp-soft"><feGaussianBlur stdDeviation="0.6" /></filter>
        </defs>
        <polygon points="68.6,69 44.6,12 44,59" fill="url(#rmsp-beam)" filter="url(#rmsp-soft)" />
      </svg>
      <div className="absolute left-[13.5%] top-[9%] w-[31.5%] shadow-[0_0_40px_rgba(230,220,190,0.18)]" style={{ clipPath: "polygon(0 0, 100% 3%, 98% 96%, 2% 100%)" }}>
        <img src={src} alt={alt} className="block aspect-[3/2] w-full object-cover" style={{ filter: "saturate(1.05) contrast(1.04) brightness(.92)" }} />
      </div>
      <div className="absolute bottom-0 right-[6%] h-[19%] w-[36%] bg-[linear-gradient(180deg,#2c2119,#140d08)] shadow-[0_-1px_0_rgba(255,220,180,0.08)]" />
      <svg className="absolute right-[15%] top-[63%] w-[17%]" viewBox="0 0 200 110" aria-hidden="true">
        <defs><linearGradient id="rmsp-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6b5848" /><stop offset="1" stopColor="#2c231b" /></linearGradient></defs>
        <rect x="18" y="38" width="160" height="62" rx="12" fill="url(#rmsp-body)" />
        <ellipse cx="108" cy="30" rx="70" ry="22" fill="#151110" />
        <ellipse cx="108" cy="26" rx="70" ry="20" fill="#8e7e66" opacity=".55" />
        <ellipse cx="108" cy="26" rx="14" ry="5" fill="#b9b2a6" />
        <rect x="2" y="44" width="22" height="22" rx="4" fill="#1a1715" />
        {[0, 1, 2, 3, 4].map((k) => <rect key={k} x="140" y={58 + k * 7} width="30" height="2" rx="1" fill="#c98a48" opacity=".6" />)}
      </svg>
    </div>
  );
}
