import { useEffect, useRef, useState } from "react";

// Everything a visitor reads, in one place.
const copy = {
  house: "Calloway House",
  room: "Guest ledger",
  head: ["Your room", "is waiting."],
  done: ["The door", "is open."],
  lede: "Sign in with the address you booked under. The key on the desk follows along.",
  ledeDone: "Welcome in. Press the button once more to lock up and watch it again.",
  email: "Email address",
  password: "Password",
  button: "Turn the key",
  again: "Lock it again",
  forgot: "Forgotten your password?",
  badEmail: "Enter the address you booked with, for example ada@calloway.example.",
  badPassword: "Your password is at least 8 characters long.",
  ok: "Signed in. This is a demo, so nothing left the page.",
};
const ROOM = "214"; // engraved on the fob
const DEMO_EMAIL = "ada@calloway.example";
const DEMO_PASSWORD = "brassbound";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const TONE = `vec3 tone(vec3 x){ x *= 0.82; vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return pow(clamp(a / b, 0.0, 1.0), vec3(1.0 / 2.2)); }`;

// The photograph: a brass box lock and a hotel key on a green leather desk top, with low sun
// coming through a window to the left and laying the shadow of its glazing bars across the leather.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec2 uJit; uniform float uSeed; uniform float uAper;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform float uFocus;
uniform vec4 uKey; uniform float uRoll; uniform vec4 uFob; uniform vec4 uRing; uniform float uBolt; uniform float uDirect; uniform float uGlow; uniform sampler2D uNum;
const vec3 LC = vec3(0.86, 0.4, 0.3); const vec3 LH = vec3(0.34, 0.4, 0.66);
const vec3 HOLE = vec3(0.52, 0.48, 0.3);
const vec3 SUN = vec3(-0.70, 0.52, 0.49);
const vec3 SUNC = vec3(3.1, 2.45, 1.75);
const vec3 BRASS = vec3(0.98, 0.74, 0.40);
const vec3 LEATHER = vec3(0.036, 0.088, 0.052);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float box(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float cylX(vec3 p, float r, float a, float b){ vec2 d = vec2(length(p.yz) - r, max(a - p.x, p.x - b)); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

// ---- the key, in its own frame: shaft along x, tip at 0, bit hanging down at roll 0 ----
vec3 toKey(vec3 p){
  vec3 d = p - uKey.xyz; float c = cos(uKey.w); float s = sin(uKey.w);
  vec3 q = vec3(c * d.x + s * d.z, d.y, -s * d.x + c * d.z);
  float cr = cos(uRoll); float sr = sin(uRoll);
  return vec3(q.x, cr * q.y + sr * q.z, -sr * q.y + cr * q.z);
}
float sdKey(vec3 q){
  float d = cylX(q, 0.04, -1.08, -0.02) - 0.004;
  // turned collars where the shaft meets the bow, like a lathe left them
  float col = cylX(q, 0.066, -1.1, -1.03) - 0.006;
  col = min(col, cylX(q, 0.055, -0.98, -0.95) - 0.005);
  col = min(col, cylX(q, 0.05, -0.36, -0.33) - 0.004);
  d = min(d, col);
  // the tip is a little drum
  d = min(d, cylX(q, 0.05, -0.04, 0.0) - 0.004);
  // the bit, with two wards cut out of it
  vec3 b = q - vec3(-0.15, -0.13, 0.0);
  float bit = box(b, vec3(0.1, 0.1, 0.026), 0.008);
  bit = max(bit, -box(b - vec3(-0.035, -0.06, 0.0), vec3(0.016, 0.06, 0.05), 0.0));
  bit = max(bit, -box(b - vec3(0.05, -0.1, 0.0), vec3(0.016, 0.035, 0.05), 0.0));
  d = min(d, bit);
  // the bow: an oval ring with a pierced trefoil inside, flat in the plane of the bit
  vec2 e = (q.xy - vec2(-1.36, 0.0)) / vec2(0.28, 0.23);
  float ring = (length(e) - 1.0) * 0.23;
  float bow2 = abs(ring + 0.035) - 0.035;
  vec2 t = q.xy - vec2(-1.36, 0.0);
  float a = atan(t.y, t.x); float r3 = 0.105 + 0.03 * cos(3.0 * a);
  bow2 = min(bow2, abs(length(t) - r3) - 0.016);
  bow2 = min(bow2, max(abs(t.y) - 0.02, abs(t.x + 0.0) - 0.2));
  vec2 w = vec2(bow2, abs(q.z) - 0.026);
  float bow = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.007;
  return smin(d, bow, 0.03);
}
// ---- the fob, in its own frame: hole at the origin, body along +x ----
vec3 toFob(vec3 p){
  vec3 d = p - uFob.xyz; float c = cos(uFob.w); float s = sin(uFob.w);
  vec3 q = vec3(c * d.x + s * d.z, d.y, -s * d.x + c * d.z);
  float cp = cos(uRing.w); float sp = sin(uRing.w);
  return vec3(cp * q.x + sp * q.y, -sp * q.x + cp * q.y, q.z);
}
float sdFob(vec3 q){
  // a long oval of ivory celluloid, thickest down its middle
  vec2 c = vec2(clamp(q.x, 0.1, 0.62), 0.0);
  float r = length(q.xz - c) - 0.19;
  float th = 0.034 - 0.012 * smoothstep(-0.19, 0.0, r);
  vec2 w = vec2(r + 0.02, abs(q.y) - th);
  float d = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.02;
  return max(d, -(length(q.xz - vec2(0.08, 0.0)) - 0.045));
}
float sdGrommet(vec3 q){ vec2 t = vec2(length(q.xz - vec2(0.08, 0.0)) - 0.058, q.y); return length(t) - 0.03; }
float sdRing(vec3 p){
  vec3 d = p - uRing.xyz; float c = cos(uFob.w); float s = sin(uFob.w);
  vec3 q = vec3(c * d.x + s * d.z, d.y, -s * d.x + c * d.z);
  vec2 t = vec2(length(q.xy) - 0.11, q.z);
  return length(t) - 0.012;
}
// ---- the lock: a brass case with a keyhole in its side and a bolt in its face ----
vec2 keyhole(vec2 yz){
  float circ = length(yz - vec2(0.03, 0.0)) - 0.055;
  vec2 s = yz - vec2(-0.07, 0.0);
  float slot = max(abs(s.y) - (0.026 + 0.12 * max(-s.x, 0.0) * 0.18), abs(s.x) - 0.1);
  return vec2(min(circ, slot), 0.0);
}
// x: distance, y: 1 where the surface is brass, 0 on the black japanned case
vec2 sdLock(vec3 p){
  vec3 q = p - LC;
  float body = box(q, LH, 0.045);
  // the keyhole runs into the case, the bolt slot opens in its face
  vec3 e = p - HOLE;
  float kh = keyhole(e.yz).x;
  body = max(body, -max(kh, -e.x - 0.06));
  vec3 bq = p - vec3(LC.x, LC.y - 0.08, LC.z - LH.z);
  body = max(body, -box(bq, vec3(0.085, 0.1, 0.03), 0.004));
  // brass: a cover plate standing proud of the top with four screws, the escutcheon, the bolt
  float plate = box(q - vec3(0.0, LH.y, 0.0), vec3(LH.x - 0.06, 0.012, LH.z - 0.06), 0.012);
  vec2 sxz = abs(q.xz) - vec2(LH.x - 0.12, LH.z - 0.12);
  float screw = length(vec3(sxz.x, max(q.y - LH.y - 0.012, 0.0), sxz.y)) - 0.034;
  screw = max(screw, -(abs(q.y - LH.y - 0.04) - 0.03));
  screw = max(screw, -box(vec3(sxz.x + sxz.y, q.y - LH.y - 0.04, sxz.x - sxz.y), vec3(0.004, 0.012, 0.05), 0.0));
  float esc = box(vec3(e.x + 0.012, 0.0, 0.0), vec3(0.016, 1.0, 1.0), 0.0);
  esc = max(esc, length((e.yz - vec2(-0.02, 0.0)) / vec2(1.35, 1.0)) - 0.13) - 0.004;
  esc = max(esc, -max(kh, -e.x - 0.06));
  float bolt = box(bq - vec3(0.0, 0.0, 0.2 - uBolt), vec3(0.07, 0.085, 0.24), 0.03);
  float brass = min(min(plate, screw), min(esc, bolt));
  return brass < body ? vec2(brass, 1.0) : vec2(body, 0.0);
}
float map(vec3 p, out float id){
  float d = p.y; id = 0.0;
  float k = sdKey(toKey(p)); if (k < d) { d = k; id = 1.0; }
  vec2 l = sdLock(p); if (l.x < d) { d = l.x; id = l.y > 0.5 ? 4.0 : 2.0; }
  vec3 f = toFob(p);
  float fb = sdFob(f); if (fb < d) { d = fb; id = 3.0; }
  float g = min(sdGrommet(f), sdRing(p)); if (g < d) { d = g; id = 1.0; }
  return d;
}
float mapD(vec3 p){ float i; return map(p, i); }
vec3 nrm(vec3 p){
  vec2 e = vec2(0.0012, -0.0012);
  return normalize(e.xyy * mapD(p + e.xyy) + e.yyx * mapD(p + e.yyx) + e.yxy * mapD(p + e.yxy) + e.xxx * mapD(p + e.xxx));
}
float shadow(vec3 ro, vec3 rd){
  float res = 1.0; float t = 0.01;
  for (int i = 0; i < 40; i++) {
    float h = mapD(ro + rd * t); if (ro.y + rd.y * t > 1.4) break;
    res = min(res, 9.0 * h / t); t += clamp(h, 0.012, 0.18);
    if (res < 0.002 || t > 5.0) break;
  }
  return clamp(res, 0.0, 1.0);
}
float ao(vec3 p, vec3 n){
  float o = 0.0; float w = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.02 + 0.05 * float(i); o += (h - mapD(p + n * h)) * w; w *= 0.7; }
  return clamp(1.0 - 2.2 * o, 0.0, 1.0);
}
// sunlight only arrives through the panes of the window to the left
float pane(vec3 p){
  float t = (-5.0 - p.x) / SUN.x; vec3 w = p + SUN * t;
  float s = 0.02 + 0.012 * t;
  float m = smoothstep(-2.6 - s, -2.6 + s, w.z) * smoothstep(3.4 + s, 3.4 - s, w.z) * smoothstep(0.9 - s, 0.9 + s, w.y) * smoothstep(6.0 + s, 6.0 - s, w.y);
  float bz = abs(fract((w.z + 2.6) / 2.0) - 0.5) * 2.0; float by = abs(fract((w.y - 0.9) / 1.7) - 0.5) * 1.7;
  m *= smoothstep(0.04, 0.04 + s * 1.8, bz) * smoothstep(0.035, 0.035 + s * 1.8, by);
  return m;
}
// the room as brass sees it: a dark panelled study, the bright window to the left, green leather below
vec3 room(vec3 ro, vec3 rd, float rough){
  vec3 c = mix(vec3(0.16, 0.11, 0.07), vec3(0.07, 0.05, 0.035), smoothstep(0.1, 0.9, rd.y));
  // dark panelling at eye level, a few vertical boards catching the light
  c *= 0.75 + 0.25 * smoothstep(0.3, 0.5, abs(fract(atan(rd.z, rd.x) * 2.2) - 0.5) * 2.0);
  if (rd.x < -0.05) {
    vec3 w = rd * (5.0 / -rd.x);
    float s = 0.08 + rough * 3.0;
    float m = smoothstep(-2.4 - s, -2.4 + s, w.z) * smoothstep(3.0 + s, 3.0 - s, w.z) * smoothstep(0.7 - s, 0.7 + s, w.y) * smoothstep(6.5 + s, 6.5 - s, w.y);
    float bz = abs(fract((w.z + 2.4) / 1.8) - 0.5) * 1.8; float by = abs(fract((w.y - 0.7) / 1.9) - 0.5) * 1.9;
    m *= mix(1.0, smoothstep(0.06, 0.06 + s, bz) * smoothstep(0.06, 0.06 + s, by), 1.0 - smoothstep(0.1, 0.5, rough));
    c = mix(c, vec3(3.6, 3.1, 2.5) * mix(1.0, 0.75, smoothstep(0.0, 0.8, w.y / 6.0)), m);
  }
  // a big sheet of warm card held up behind the camera, the photographer's fill
  float card = dot(rd, normalize(vec3(0.35, 0.5, -0.8)));
  c += vec3(1.25, 1.0, 0.75) * smoothstep(0.72 - rough * 0.4, 0.86, card);
  // a pale lampshade away to the right
  float lamp = smoothstep(0.993 - rough * 0.1, 0.998 - rough * 0.04, dot(rd, normalize(vec3(0.75, 0.5, 0.9))));
  c += vec3(2.4, 1.7, 1.0) * lamp;
  // below the horizon: the desk itself, with the sun patches on it
  if (rd.y < -0.001) {
    vec3 q = ro + rd * (-ro.y / rd.y);
    vec3 desk = LEATHER * (SUNC * 0.55 * pane(q) * mix(1.0, 0.6, rough) + vec3(0.3, 0.26, 0.2));
    c = mix(c, desk, smoothstep(0.0, -0.06, rd.y));
  }
  return c;
}
vec3 ggx(vec3 n, vec3 v, vec3 l, float a, vec3 f0){
  vec3 h = normalize(l + v); float nh = max(dot(n, h), 0.0); float a2 = a * a * a * a;
  float dd = nh * nh * (a2 - 1.0) + 1.0; float D = a2 / (3.14159 * dd * dd);
  vec3 F = f0 + (1.0 - f0) * pow(1.0 - max(dot(h, v), 0.0), 5.0);
  return D * F * 0.25 * max(dot(n, l), 0.0);
}
vec3 shadeBrass(vec3 p, vec3 n, vec3 v, float id, float o){
  // polished where fingers rub it, duller and darker in the corners where polish never reaches
  float wear = n2(p.xz * 5.0 + p.y * 4.0) * 0.7 + n2(p.xz * 23.0) * 0.3;
  float rough = mix(0.14, 0.34, wear) + (1.0 - o) * 0.25;
  if (id > 3.5) {
    rough = 0.3 + 0.04 * n2(vec2(p.z * 2.0, p.x * 60.0)) + 0.04 * n2(p.xz * 6.0);
    // an engraved double rule round the top plate
    vec2 tq = abs(p.xz - LC.xz) - vec2(LH.x - 0.1, LH.z - 0.1);
    float tr = abs(max(tq.x, tq.y));
    float cut = (smoothstep(0.006, 0.0, abs(tr - 0.0)) + smoothstep(0.004, 0.0, abs(tr - 0.022))) * step(LC.y + LH.y, p.y);
    o *= 1.0 - 0.8 * clamp(cut, 0.0, 1.0); rough += cut * 0.4;
  }
  vec3 tint = mix(BRASS, BRASS * vec3(0.6, 0.47, 0.32), (1.0 - o) * 0.7 + 0.08 * wear);
  vec3 r = reflect(-v, n);
  float fr = pow(1.0 - max(dot(n, v), 0.0), 5.0);
  vec3 F = tint + (1.0 - tint) * fr;
  vec3 col = room(p, r, rough) * F * mix(0.35, 1.0, o);
  float sh = shadow(p + n * 0.004, SUN) * pane(p);
  col += SUNC * sh * ggx(n, v, SUN, rough, tint) * 1.0;
  // a little light bounced up off the leather into the underside
  col += tint * LEATHER * SUNC * 0.5 * clamp(-n.y, 0.0, 1.0) * o;
  // the top plate is an older, darker brass than the key
  col *= mix(vec3(1.0), vec3(0.78, 0.64, 0.44), step(3.5, id) * step(LC.y + LH.y - 0.01, p.y));
  return col;
}
// black japanned iron: a deep gloss coat over near-black, so it is mostly what it reflects
vec3 shadeJapan(vec3 p, vec3 n, vec3 v, float o){
  vec3 nb = normalize(n + 0.012 * vec3(n2(p.yz * 31.0) - 0.5, n2(p.xz * 31.0) - 0.5, n2(p.xy * 31.0) - 0.5));
  float sh = shadow(p + n * 0.004, SUN) * pane(p);
  vec3 col = vec3(0.016, 0.012, 0.009) * (SUNC * sh * max(dot(nb, SUN), 0.0) + vec3(0.3) * o);
  float fr = 0.045 + 0.955 * pow(1.0 - max(dot(nb, v), 0.0), 5.0);
  col += room(p, reflect(-v, nb), 0.1) * fr * mix(0.3, 1.0, o);
  col += SUNC * sh * ggx(nb, v, SUN, 0.1, vec3(0.045));
  // a faint warm sheen where the brass plate lights the case under its lip
  col += vec3(0.25, 0.16, 0.06) * 0.15 * smoothstep(-0.25, 0.0, p.y - LC.y - LH.y) * o;
  return col;
}
vec3 shadeFob(vec3 p, vec3 n, vec3 v, float o){
  vec3 q = toFob(p);
  vec3 alb = vec3(0.86, 0.79, 0.64) * (0.95 + 0.08 * n2(p.xz * 30.0));
  // the room number, cut into the celluloid and filled with oxblood
  vec2 nu = vec2((q.x - 0.2) / 0.56, 1.0 - (q.z + 0.14) / 0.28);
  float ink = 0.0;
  if (nu.x > 0.0 && nu.x < 1.0 && nu.y > 0.0 && nu.y < 1.0 && q.y > 0.0) ink = texture2D(uNum, nu).r;
  alb = mix(alb, vec3(0.3, 0.035, 0.03), ink);
  float sh = shadow(p + n * 0.004, SUN) * pane(p);
  float ndl = dot(n, SUN); float wrap = clamp((ndl + 0.3) / 1.3, 0.0, 1.0);
  vec3 col = alb * (SUNC * sh * wrap * 0.9 + vec3(0.25, 0.22, 0.18) * o) + vec3(0.9, 0.5, 0.25) * SUNC * 0.05 * sh * (1.0 - max(ndl, 0.0));
  float fr = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  col = mix(col, room(p, reflect(-v, n), 0.08) * o, fr);
  col += SUNC * sh * ggx(n, v, SUN, 0.12, vec3(0.04));
  return col;
}
vec3 shadeLeather(vec3 p, vec3 v, float blur){
  // pebbled grain, a scuff or two, and a gilt double rule tooled round the edge of the panel
  vec2 g = p.xz * 34.0;
  float k = 1.0 - smoothstep(0.0, 0.05, blur);
  vec2 gr = vec2(n2(g) - n2(g + vec2(0.4, 0.0)), n2(g) - n2(g + vec2(0.0, 0.4))) * 0.9;
  gr += vec2(n2(p.xz * 3.0) - 0.5, n2(p.xz * 3.0 + 9.0) - 0.5) * 0.1;
  vec3 n = normalize(vec3(gr.x * 0.07 * k, 1.0, gr.y * 0.07 * k));
  float tone = 0.82 + 0.3 * n2(p.xz * 1.3 + 4.0) + 0.06 * n2(g * 0.25);
  vec3 alb = LEATHER * tone;
  vec2 rq = abs(p.xz - vec2(0.3, 0.6)) - vec2(2.35, 1.55);
  float edge = abs(max(rq.x, rq.y));
  float rule = smoothstep(0.012 + blur, 0.0, abs(edge - 0.0)) + smoothstep(0.007 + blur, 0.0, abs(edge - 0.06));
  float gilt = clamp(rule, 0.0, 1.0) * (0.75 + 0.25 * n2(p.xz * 60.0));
  float sh = shadow(p + vec3(0.0, 0.002, 0.0), SUN);
  float lit = pane(p) * sh;
  float o = ao(p, vec3(0.0, 1.0, 0.0));
  vec3 col = alb * (SUNC * lit * max(dot(n, SUN), 0.0) + vec3(0.36, 0.28, 0.19) * o);
  // sun scattered back up off the bright patches warms the leather around them
  col += alb * vec3(0.5, 0.42, 0.25) * 0.35 * smoothstep(1.5, -0.5, p.z) * o;
  // the brass throws warm light down onto the leather beside it
  col += alb * vec3(1.2, 0.8, 0.35) * 0.35 * (1.0 - o) * smoothstep(1.2, 0.0, length(p.xz - LC.xz));
  float fr = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  col += room(p, reflect(-v, n), 0.85) * fr * 0.12 * o;
  col += SUNC * lit * ggx(n, v, SUN, 0.42, vec3(0.04)) * 0.9;
  vec3 gc = vec3(1.0, 0.76, 0.38);
  vec3 gcol = gc * (SUNC * lit * 0.35 + vec3(0.12, 0.1, 0.07)) + SUNC * lit * ggx(vec3(0.0, 1.0, 0.0), v, SUN, 0.25, gc) * 0.6;
  col = mix(col, gcol, gilt * 0.85);
  // the far end of the desk falls away into the dim room
  return col * mix(1.0, 0.55, smoothstep(0.8, 3.5, p.z));
}
void main(){
  vec2 fc = gl_FragCoord.xy + uJit;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  // a thin lens: every sample looks through a different spot of the aperture at the same focal plane
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uSeed);
  float ang = ign * 6.2831853 + uSeed * 17.0; float rr = sqrt(fract(ign * 7.13 + uSeed * 3.7));
  vec2 lens = vec2(cos(ang), sin(ang)) * rr * uAper * step(0.001, uSeed);
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * lens.x + up * lens.y;
  rd = normalize(fp - ro);
  vec3 col;
  float t = 0.0; float id = -1.0; bool hit = false;
  float tmax = rd.y < 0.0 ? -ro.y / rd.y + 0.01 : 30.0;
  for (int i = 0; i < 150; i++) {
    vec3 p = ro + rd * t;
    float d = map(p, id);
    if (d < 0.0006 * t) { hit = true; break; }
    t += d * 0.9;
    if (t > tmax) break;
  }
  if (!hit) { t = tmax; id = 0.0; }
  vec3 p = ro + rd * t;
  vec3 v = -rd;
  float blur = abs(t * dot(rd, fw) - uFocus) * 0.004;
  if (id < 0.5 || p.y < 0.0015) col = shadeLeather(vec3(p.x, 0.0, p.z), v, blur);
  else {
    vec3 n = nrm(p); float o = ao(p, n);
    if (id > 3.5) col = shadeBrass(p, n, v, id, o);
    else if (id > 2.5) col = shadeFob(p, n, v, o);
    else if (id > 1.5) col = shadeJapan(p, n, v, o);
    else col = shadeBrass(p, n, v, id, o);
  }
  // a warm haze in the shaft of sun
  col += vec3(0.05, 0.035, 0.02) * uGlow * smoothstep(0.4, -0.6, (gl_FragCoord.x / uRes.x - 0.2));
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
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.02 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.4, 0.0), vec3(8.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.016;
  vec2 q = (uv - vec2(0.5, 0.52)) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.38 * smoothstep(0.35, 1.2, length(q));
  c = tone(c);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.02;
  outC = vec4(c, 1.0);
}
`;

// Where the key lies for a given amount of the form filled in, and where it goes when signing in.
type Pose = { x: number; y: number; z: number; yaw: number; roll: number };
const REST: Pose = { x: 0.3, y: 0.044, z: -0.85, yaw: -0.5, roll: Math.PI / 2 };
const NEAR: Pose = { x: 0.08, y: 0.044, z: 0.06, yaw: 0.45, roll: Math.PI / 2 };
const READY: Pose = { x: 0.3, y: 0.48, z: 0.3, yaw: 0, roll: 0 };
const IN: Pose = { x: 0.84, y: 0.48, z: 0.3, yaw: 0, roll: 0 };
const mixPose = (a: Pose, b: Pose, t: number): Pose => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, yaw: a.yaw + (b.yaw - a.yaw) * t, roll: a.roll + (b.roll - a.roll) * t });
const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

// No WebGL: the same desk drawn in SVG from the same viewpoint, lit from the same window.
function Still({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 740 760" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="bk-desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2c2e1c" /><stop offset="0.45" stopColor="#1b3322" /><stop offset="1" stopColor="#1d3f29" /></linearGradient>
        <linearGradient id="bk-sun" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5f9a60" stopOpacity="0.95" /><stop offset="1" stopColor="#4d8a55" stopOpacity="0.75" /></linearGradient>
        <linearGradient id="bk-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fbe7ad" /><stop offset="0.45" stopColor="#d9ad5c" /><stop offset="1" stopColor="#8a5f23" /></linearGradient>
        <linearGradient id="bk-rod" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff0c0" /><stop offset="0.5" stopColor="#c99a48" /><stop offset="1" stopColor="#5e3f15" /></linearGradient>
        <linearGradient id="bk-case" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1a120c" /><stop offset="0.6" stopColor="#2a1c12" /><stop offset="1" stopColor="#120c08" /></linearGradient>
        <linearGradient id="bk-fob" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fbf4e6" /><stop offset="1" stopColor="#cfc0a2" /></linearGradient>
        <filter id="bk-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
        <radialGradient id="bk-vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.45" /></radialGradient>
      </defs>
      <rect width="740" height="760" fill="url(#bk-desk)" />
      {/* sun through the window, with the shadows of its bars */}
      <style>{`@keyframes bk-cloud { 0%, 100% { opacity: 1; } 50% { opacity: 0.72; } } .bk-cloud { animation: bk-cloud 7s ease-in-out infinite; } @media (prefers-reduced-motion: reduce) { .bk-cloud { animation: none; } }`}</style>
      <path className="bk-cloud" d="M0 345 L740 300 L740 760 L0 760 Z" fill="url(#bk-sun)" />
      <path d="M0 440 L740 470 L740 520 L0 478 Z M380 300 L470 300 L620 760 L520 760 Z" fill="#163222" opacity="0.85" />
      <path d="M0 400 L560 140 L740 230 M0 420 L560 155 L740 245 M30 640 L740 420 M40 652 L740 432" stroke="#d6b064" strokeWidth="2" fill="none" opacity="0.7" />
      {/* the lock case */}
      <ellipse cx="560" cy="400" rx="130" ry="26" fill="#000" opacity="0.55" filter="url(#bk-soft)" />
      <path d="M425 175 L520 150 L640 255 L640 340 L540 405 L425 330 Z" fill="url(#bk-case)" />
      <path d="M425 175 L520 150 L640 255 L540 280 Z" fill="url(#bk-brass)" />
      <path d="M440 180 L518 160 L622 252 L542 272 Z" fill="none" stroke="#7a5320" strokeWidth="2" opacity="0.6" />
      <path d="M540 280 L640 255 L640 340 L540 405 Z" fill="#20160e" />
      <ellipse cx="465" cy="275" rx="13" ry="22" fill="url(#bk-brass)" />
      <ellipse cx="466" cy="277" rx="4" ry="9" fill="#0d0805" />
      <rect x="572" y={open ? 336 : 326} width="26" height="34" rx="3" fill="url(#bk-brass)" style={{ transition: "y 300ms" }} />
      {/* the key and its fob */}
      <g transform={open ? "translate(40 -120)" : ""}>
        <ellipse cx="370" cy="470" rx="160" ry="16" fill="#000" opacity="0.4" filter="url(#bk-soft)" transform="rotate(-38 370 470)" />
        <path d="M300 495 L465 380" stroke="url(#bk-rod)" strokeWidth="11" strokeLinecap="round" />
        <path d="M440 398 l26 -18 l10 14 l-8 6 l6 9 l-8 6 l-6 -9 l-12 8 Z" fill="url(#bk-brass)" />
        <ellipse cx="275" cy="512" rx="44" ry="38" fill="none" stroke="url(#bk-brass)" strokeWidth="12" transform="rotate(-35 275 512)" />
        <path d="M275 485 q22 18 0 40 q-22 -22 0 -40 M252 512 h46" stroke="url(#bk-brass)" strokeWidth="6" fill="none" />
        <g transform="rotate(-62 205 600)">
          <rect x="140" y="565" width="150" height="66" rx="33" fill="url(#bk-fob)" />
          <circle cx="270" cy="598" r="7" fill="#1a2a1c" />
          <text x="200" y="612" textAnchor="middle" fontSize="40" fontFamily={SERIF} fill="#a2321f" transform="rotate(180 200 598)">{ROOM}</text>
        </g>
      </g>
      <rect width="740" height="760" fill="url(#bk-vig)" />
    </svg>
  );
}

export default function BrassHotelKeySignInForm() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [done, setDone] = useState(false);
  const [said, setSaid] = useState(false); // only a real sign-in is announced, never the demo
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const api = useRef<{ fill: (p: number, user: boolean) => void; open: (user: boolean) => void; close: () => void; nudge: () => void; stop: () => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts = { antialias: false, alpha: false, powerPreference: "high-performance" as const };
    const gl2 = cv.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? cv.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) { setShown("still"); return; }
    const canAcc = !!gl2 && (!!gl2.getExtension("EXT_color_buffer_float") || !!gl2.getExtension("EXT_color_buffer_half_float"));
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
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uAper", "uCam", "uTgt", "uFoc", "uFocus", "uKey", "uRoll", "uFob", "uRing", "uBolt", "uDirect", "uGlow", "uNum"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain"].map((n) => [n, U(post, n)])) : {};
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // the number on the fob, set in the serif and handed to the shader as a mask
    const num = document.createElement("canvas");
    num.width = 256; num.height = 128;
    const ng = num.getContext("2d");
    if (ng) {
      ng.fillStyle = "#000"; ng.fillRect(0, 0, 256, 128);
      ng.fillStyle = "#fff"; ng.textAlign = "center"; ng.textBaseline = "middle";
      ng.font = `600 104px ${SERIF}`;
      ng.fillText(ROOM, 128, 70);
    }
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, num);
    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const s = {
      fill: 1, fillShown: 1, fillVel: 0, phase: "rest" as "rest" | "lift" | "insert" | "turn" | "open" | "back",
      clock: 0, roll: 0, rollVel: 0, bolt: 0, boltVel: 0, pose: mixPose(REST, NEAR, 1),
      fobYaw: 0, fobYawVel: 0, wobble: 0, wobbleVel: 0,
      count: 0, fresh: true, frame: 0, drawn: "rest" as string, drawnFill: -1, thunk: 0, shake: 0, slow: 0, visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, px: 0, py: 0, sx: 0, sy: 0,
    };
    s.fobYaw = s.pose.yaw + 0.5;
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.1e6 / (cssW * cssH * dpr * dpr)));
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

    // The key's place in the world, and the fob and ring that trail behind it.
    const rig = () => {
      const p = s.pose;
      const c = Math.cos(p.yaw), sn = Math.sin(p.yaw);
      const bx = p.x - c * 1.62, bz = p.z - sn * 1.62;
      const fy = s.fobYaw;
      const fc = Math.cos(fy), fs = Math.sin(fy);
      const hy = Math.max(0.06, p.y - 0.13);
      const hx = bx - fc * 0.12, hz = bz - fs * 0.12;
      const rx = (bx + hx) / 2, rz = (bz + hz) / 2, ry = (p.y + hy) / 2;
      // the fob's far end rests on the leather, so it tips up when the key is lifted
      const pitch = Math.asin(Math.min(0.95, Math.max(0, (hy - 0.06) / 0.7)));
      return { fob: [hx + 0, hy, hz, Math.PI + fy] as const, ring: [rx, ry, rz, -pitch] as const };
    };

    const camera = () => {
      const wide = cssW / cssH > 0.95;
      const tgt = wide ? [-0.15, 0.12, 0.05] : [-0.2, 0.12, 0.0];
      const el = 0.66 - s.sy * 0.03 + Math.sin(s.shake * 40) * s.shake * 0.004, az = -0.38 + s.sx * 0.06, dist = wide ? 7.0 : 9.0;
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] - dist * Math.cos(az) * Math.cos(el)];
      const fw = [tgt[0] - cam[0], tgt[1] - cam[1], tgt[2] - cam[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]); fw[0] /= fl; fw[1] /= fl; fw[2] /= fl;
      // focus on the middle of the key
      const focus = (-0.25 - cam[0]) * fw[0] + (0.1 - cam[1]) * fw[1] + (-0.15 - cam[2]) * fw[2];
      return { cam, tgt, foc: wide ? 1.75 : 1.6, focus };
    };

    const draw = (alpha: number, sample: number) => {
      const c = camera(), r = rig();
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform2f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform1f(su.uAper, 0.045);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]); gl.uniform3f(su.uTgt, c.tgt[0], c.tgt[1], c.tgt[2]);
      gl.uniform1f(su.uFoc, c.foc); gl.uniform1f(su.uFocus, c.focus);
      gl.uniform4f(su.uKey, s.pose.x, s.pose.y, s.pose.z, s.pose.yaw);
      gl.uniform1f(su.uRoll, s.pose.roll + s.roll);
      gl.uniform4f(su.uFob, r.fob[0], r.fob[1], r.fob[2], r.fob[3]);
      gl.uniform4f(su.uRing, r.ring[0], r.ring[1], r.ring[2], r.ring[3]);
      gl.uniform1f(su.uBolt, s.bolt * 0.3);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform1f(su.uGlow, 1); gl.uniform1i(su.uNum, 3);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, s.frame % 64);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const fill = (p: number, user: boolean) => { if (user) s.touched = true; if (p > s.fill && s.phase === "rest") s.wobbleVel += 1.4 * (Math.random() > 0.5 ? 1 : -1); s.fill = p; if (s.phase !== "rest" && s.phase !== "back") s.phase = "back"; s.clock = 0; wake(); };
    const open = (user: boolean) => { if (user) s.touched = true; if (s.phase === "rest") { s.phase = "lift"; s.clock = 0; wake(); } };
    const close = () => { s.phase = "back"; s.clock = 0; wake(); };
    const nudge = () => { s.wobbleVel += 6; wake(); };
    // the moment someone reaches for the form, the demo stops and leaves the fields to them
    const stop = () => { s.touched = true; wake(); };
    api.current = { fill, open, close, nudge, stop };

    let start = mixPose(REST, NEAR, 1);
    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 2900; }
      // self-running demo: opens filled in, signs in, locks again, types again
      if (!reduce && !s.touched && now > s.demoAt) demo.step(now);

      s.clock += dt;
      if (reduce) {
        // reduced motion: no travel, the picture simply changes to the new state
        if (s.phase === "lift" || s.phase === "insert" || s.phase === "turn") s.phase = "open";
        if (s.phase === "back") s.phase = "rest";
        s.fillShown = s.fill; s.fillVel = 0;
        const shut = s.phase !== "open";
        s.pose = shut ? mixPose(REST, NEAR, s.fill) : { ...IN };
        s.roll = shut ? 0 : -Math.PI / 2; s.bolt = shut ? 0 : 1;
        s.fobYaw = s.pose.yaw + 0.5 - (shut ? 0 : 0.45);
        s.rollVel = s.boltVel = s.fobYawVel = s.wobble = s.wobbleVel = 0;
        if (s.phase !== s.drawn) { s.drawn = s.phase; s.count = 0; s.fresh = true; }
        if (s.fill !== s.drawnFill) { s.drawnFill = s.fill; s.count = 0; s.fresh = true; }
      } else {
      // the fill spring: a heavy key on leather, so it drags a little and settles
      s.fillVel += (60 * (s.fill - s.fillShown) - 13 * s.fillVel) * dt;
      s.fillShown += s.fillVel * dt;
      s.wobbleVel += (-140 * s.wobble - 8 * s.wobbleVel) * dt; s.wobble += s.wobbleVel * dt;
      const lying = mixPose(REST, NEAR, s.fillShown);
      lying.yaw += s.wobble * 0.05;
      if (s.phase === "rest") { s.pose = lying; s.roll += (0 - s.roll) * Math.min(1, dt * 10); s.boltVel += (-300 * s.bolt - 26 * s.boltVel) * dt; s.bolt += s.boltVel * dt; }
      else if (s.phase === "lift") {
        // it is picked up: rises, rolls its bit down and lines up with the keyhole
        if (s.clock < dt * 1.5) start = { ...s.pose };
        const e = Math.min(1, s.clock / 0.7);
        const m = mixPose(start, READY, ease(e));
        m.y += Math.sin(Math.PI * e) * 0.12;
        s.pose = m;
        if (e >= 1) { s.phase = "insert"; s.clock = 0; }
      } else if (s.phase === "insert") {
        const e = Math.min(1, s.clock / 0.38);
        s.pose = mixPose(READY, IN, e * e * (3 - 2 * e) * (1 + 0.02 * Math.sin(e * 9)));
        if (e >= 1) { s.phase = "turn"; s.clock = 0; s.rollVel = 0; s.thunk = 0; }
      } else if (s.phase === "turn") {
        // a quarter turn against the springs inside, a touch past, and back
        s.rollVel += (520 * (-Math.PI / 2 - s.roll) - 22 * s.rollVel) * dt;
        s.roll += s.rollVel * dt;
        if (s.clock > 0.16) { s.boltVel += (420 * (1 - s.bolt) - 20 * s.boltVel) * dt; s.bolt += s.boltVel * dt; if (!s.thunk && s.bolt > 0.95) { s.thunk = 1; s.shake = 1; } }
        if (s.clock > 1.2) { s.phase = "open"; }
      } else if (s.phase === "open") {
        s.rollVel += (520 * (-Math.PI / 2 - s.roll) - 22 * s.rollVel) * dt; s.roll += s.rollVel * dt;
        s.boltVel += (420 * (1 - s.bolt) - 20 * s.boltVel) * dt; s.bolt += s.boltVel * dt;
      } else if (s.phase === "back") {
        // turn back, draw out and lay it down where the form says it should lie
        s.rollVel += (300 * (0 - s.roll) - 26 * s.rollVel) * dt; s.roll += s.rollVel * dt;
        s.boltVel += (300 * (0 - s.bolt) - 26 * s.boltVel) * dt; s.bolt += s.boltVel * dt;
        if (s.clock < dt * 1.5) start = { ...s.pose };
        if (s.clock > 0.3) {
          const e = Math.min(1, (s.clock - 0.3) / 0.9);
          const m = mixPose(start, lying, ease(e));
          m.y += Math.sin(Math.PI * e) * 0.1 * (start.y > 0.2 ? 1 : 0);
          s.pose = m;
          if (e >= 1) s.phase = "rest";
        }
      }
      // the fob trails its key, swinging through on a lag
      const want = s.pose.yaw + 0.5 - (s.phase === "rest" ? 0 : 0.45) + s.wobble * 0.3;
      s.fobYawVel += (34 * (want - s.fobYaw) - 5 * s.fobYawVel) * dt; s.fobYaw += s.fobYawVel * dt;
      s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
      s.shake *= Math.exp(-dt * 9);
      }

      const moving = s.phase !== "rest" && s.phase !== "open" || Math.abs(s.fillVel) > 0.003 || Math.abs(s.fill - s.fillShown) > 0.002 || Math.abs(s.fobYawVel) > 0.01 || Math.abs(s.boltVel) > 0.01 || Math.abs(s.rollVel) > 0.01 || Math.abs(s.wobbleVel) > 0.01 || s.shake > 0.01 || Math.abs(s.px - s.sx) + Math.abs(s.py - s.sy) > 0.002;
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(0.42, 1 + (s.frame % 64)); s.count = 3; }
      else if (s.count < 48) { s.count++; draw(1 / s.count, s.count); }
      if (s.frame === 1) setShown("gl");
      if (dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }
      if (moving || s.count < 48 || (!reduce && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    // the demo script, driven from the frame loop so it pauses off screen
    const demo = { step: (_now: number) => {} };
    let stage_ = 0, typed = 0;
    demo.step = (now: number) => {
      if (stage_ === 0) { open(false); demoUi.sign(); stage_ = 1; s.demoAt = now + 3800; }
      else if (stage_ === 1) { close(); demoUi.clear(); fill(0, false); stage_ = 2; typed = 0; s.demoAt = now + 1500; }
      else if (stage_ === 2) {
        const total = DEMO_EMAIL.length + DEMO_PASSWORD.length;
        typed++;
        const e = DEMO_EMAIL.slice(0, Math.min(typed, DEMO_EMAIL.length));
        const pw = DEMO_PASSWORD.slice(0, Math.max(0, typed - DEMO_EMAIL.length));
        demoUi.type(e, pw);
        fill(progress(e, pw), false);
        s.demoAt = now + (typed === DEMO_EMAIL.length ? 420 : 70 + Math.random() * 60);
        if (typed >= total) { stage_ = 0; s.demoAt = now + 1600; }
      }
    };

    size();
    s.fill = progress(DEMO_EMAIL, DEMO_PASSWORD); s.fillShown = s.fill; s.pose = mixPose(REST, NEAR, s.fill);
    s.fobYaw = s.pose.yaw + 0.5;
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    const move = (e: PointerEvent) => {
      if (reduce) return;
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
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  // The demo reaches into the form through these, so what it types is really in the fields.
  const demoUi = useRef({
    sign: () => {}, clear: () => {}, type: (_e: string, _p: string) => {},
  }).current;
  demoUi.sign = () => { setErrors({}); setDone(true); };
  demoUi.clear = () => { setDone(false); setEmail(""); setPassword(""); setErrors({}); };
  demoUi.type = (e: string, p: string) => { setEmail(e); setPassword(p); };

  const edit = (e: string, p: string) => {
    setEmail(e); setPassword(p); setDone(false); setSaid(false);
    setErrors({});
    api.current?.fill(progress(e, p), true);
  };
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (done) { setDone(false); setSaid(false); api.current?.close(); emailRef.current?.focus(); return; }
    const next: { email?: string; password?: string } = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = copy.badEmail;
    if (password.length < 8) next.password = copy.badPassword;
    setErrors(next);
    if (next.email || next.password) {
      api.current?.nudge();
      (next.email ? emailRef : passRef).current?.focus();
      return;
    }
    // nothing is sent or stored: the key turns and the form says so
    setDone(true); setSaid(true);
    api.current?.open(true);
  };
  const headline = done ? copy.done : copy.head;

  return (
    <section className="relative isolate overflow-hidden bg-[#f3ecdf] text-[#1d2a22]" style={{ fontFamily: FONT }}>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col-reverse lg:min-h-[760px] lg:flex-row">
        <div className="relative z-10 flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:w-[42%] lg:px-16 lg:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#1d2a22]/70">{copy.house} <span className="mx-2 text-[#1d2a22]/30">/</span> {copy.room}</p>
          <h2 className="mt-6 text-[52px] leading-[0.9] tracking-[-0.04em] sm:text-[68px] lg:text-[84px]" style={{ fontFamily: SERIF }}>
            <span className="block">{headline[0]}</span>
            <span className="block italic text-[#1f5c3d]">{headline[1]}</span>
          </h2>
          <p className="mt-5 max-w-[24rem] text-[16px] leading-relaxed text-[#1d2a22]/75">{done ? copy.ledeDone : copy.lede}</p>
          <form onSubmit={submit} onFocus={() => api.current?.stop()} onPointerDown={() => api.current?.stop()} noValidate className="mt-8 w-full max-w-[24rem] space-y-5">
            <div>
              <label htmlFor="brass-key-email" className="block text-[12px] font-semibold uppercase tracking-[0.2em] text-[#1d2a22]/80">{copy.email}</label>
              <input
                ref={emailRef} id="brass-key-email" name="email" type="email" inputMode="email" autoComplete="off" autoCapitalize="none" spellCheck={false}
                value={email} onChange={(e) => edit(e.target.value, password)} placeholder="you@example.com"
                aria-invalid={!!errors.email} aria-describedby={errors.email ? "brass-key-email-error" : undefined}
                className={`mt-2 h-12 w-full rounded-lg border bg-white/70 px-4 text-[17px] tracking-[-0.01em] text-[#1d2a22] outline-none transition-[border-color,box-shadow] placeholder:text-[#1d2a22]/40 focus-visible:border-[#1f5c3d] focus-visible:ring-4 focus-visible:ring-[#1f5c3d]/25 ${errors.email ? "border-[#a3341f]" : "border-[#1d2a22]/25"}`}
              />
              {errors.email && <p id="brass-key-email-error" className="mt-2 text-[14px] leading-snug text-[#a3341f]">{errors.email}</p>}
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="brass-key-password" className="block text-[12px] font-semibold uppercase tracking-[0.2em] text-[#1d2a22]/80">{copy.password}</label>
                <a href="#" className="rounded text-[13px] text-[#1f5c3d] underline decoration-[#1f5c3d]/40 underline-offset-4 hover:decoration-[#1f5c3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f5c3d]">{copy.forgot}</a>
              </div>
              <input
                ref={passRef} id="brass-key-password" name="password" type="password" autoComplete="off"
                value={password} onChange={(e) => edit(email, e.target.value)}
                aria-invalid={!!errors.password} aria-describedby={errors.password ? "brass-key-password-error" : undefined}
                className={`mt-2 h-12 w-full rounded-lg border bg-white/70 px-4 text-[17px] tracking-[0.08em] text-[#1d2a22] outline-none transition-[border-color,box-shadow] focus-visible:border-[#1f5c3d] focus-visible:ring-4 focus-visible:ring-[#1f5c3d]/25 ${errors.password ? "border-[#a3341f]" : "border-[#1d2a22]/25"}`}
              />
              {errors.password && <p id="brass-key-password-error" className="mt-2 text-[14px] leading-snug text-[#a3341f]">{errors.password}</p>}
            </div>
            <button type="submit" className="h-12 w-full rounded-lg bg-[#1f4d35] text-[16px] font-semibold tracking-[-0.01em] text-[#f6efe0] transition-[transform,background-color] duration-200 hover:bg-[#173d2a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c9973f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ecdf] active:scale-[0.99] motion-reduce:transition-none">
              {done ? copy.again : copy.button}
            </button>
            <p aria-live="polite" className="min-h-[1.5em] text-[14px] text-[#1d2a22]/75">{said ? copy.ok : ""}</p>
          </form>
        </div>
        <div ref={stage} className="relative h-[380px] w-full overflow-hidden bg-[#0f3523] sm:h-[460px] lg:h-auto lg:w-[58%]">
          <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
          {shown === "still" && <Still open={done} />}
        </div>
      </div>
    </section>
  );
}

function progress(e: string, p: string) {
  return Math.min(1, e.length / DEMO_EMAIL.length) * 0.5 + Math.min(1, p.length / 8) * 0.5;
}
