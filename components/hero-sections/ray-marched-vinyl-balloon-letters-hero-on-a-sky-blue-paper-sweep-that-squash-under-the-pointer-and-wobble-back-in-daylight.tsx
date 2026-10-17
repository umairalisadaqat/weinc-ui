import { useEffect, useRef, useState } from "react";

// Everything a visitor would edit first.
const venue = {
  name: "Puffle Hall",
  where: "Party rooms, Larkfield",
  word: "PARTY", // blown up as balloon letters, one colour each (up to 8 letters)
  headline: ["Throw the party.", "We blow up the rest."],
  line: "A private room with soft play, a cake table and a host who sets up before you arrive and clears away after you leave.",
  cta: "Book a party room",
  second: "See the rooms",
  hours: "Open Thursday to Sunday",
};
// One colour per letter, in linear light (0 to 1). They repeat if the word is longer.
const COLOURS = [
  [1.0, 0.085, 0.06], // tomato
  [1.0, 0.5, 0.012], // sunflower
  [0.012, 0.42, 0.2], // mint green
  [0.2, 0.09, 0.95], // violet
  [1.0, 0.13, 0.4], // bubblegum
];
const PAPER = [0.3, 0.62, 0.93]; // the sky blue paper sweep, linear light
const INFLATE = 1.25; // how fat the letters are blown: 1 is round tubes
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const BALLOON_FONT = '"Arial Rounded MT Bold", "Nunito", "Varela Round", "Inter Tight", ui-sans-serif, system-ui, sans-serif';
const MAXL = 8;
const CAPW = 1.7; // height of a capital in world units
const v3 = (c: number[]) => `vec3(${c.map((n) => n.toFixed(4)).join(", ")})`;
const css = (c: number[]) => `rgb(${c.map((n) => Math.round(255 * Math.pow(Math.min(1, n), 1 / 2.2))).join(",")})`;

const VERT = `#version 300 es
in vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 tone(vec3 x){ vec3 c = 1.0 - exp(-max(x, 0.0) * 0.8); c = mix(c, c * c * (3.0 - 2.0 * c), 0.35); return pow(c, vec3(1.0 / 2.2)); }
`;

// The photograph: balloon letters standing on one sheet of paper that curves up into a wall, in daylight.
const SCENE = `#version 300 es
precision highp float;
out vec4 outC;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uDirect;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform vec3 uSun; uniform sampler2D uF; uniform vec4 uFS; uniform int uN;
uniform vec4 uL[${MAXL}]; uniform vec4 uD[${MAXL}]; uniform float uSplit[${MAXL}]; uniform vec3 uC[${MAXL}];
uniform vec3 uBox0; uniform vec3 uBox1;
const float ZW = 3.4; const float RC = 1.5; const float TOP = 9.0;
const float K = ${INFLATE.toFixed(3)};
const vec3 PAPER = ${v3(PAPER)};
const vec3 SUNC = vec3(1.0, 0.93, 0.8);
const vec3 SKY = vec3(0.86, 0.93, 1.0);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }

// The field: red is how far the skin is blown out at that point of the outline, green and blue its slope.
vec4 fieldB(vec2 xy){
  vec2 uv = (xy - uFS.xy) / uFS.zw;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(-0.2, 0.0, 0.0, 0.0);
  return texture(uF, uv);
}
// Smooth read (cubic B-spline) from sixteen exact texels: hardware filtering rounds its weights and would draw contour lines on the skin.
vec4 fieldS(vec2 xy){
  ivec2 ts = textureSize(uF, 0);
  vec2 uv = (xy - uFS.xy) / uFS.zw;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(-0.2, 0.0, 0.0, 0.0);
  vec2 x = uv * vec2(ts) - 0.5; vec2 f = fract(x); ivec2 i0 = ivec2(floor(x));
  vec2 f2 = f * f; vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - f) * (1.0 - f) * (1.0 - f) / 6.0; vec2 w1 = (3.0 * f3 - 6.0 * f2 + 4.0) / 6.0; vec2 w3 = f3 / 6.0; vec2 w2 = 1.0 - w0 - w1 - w3;
  float wx[4] = float[4](w0.x, w1.x, w2.x, w3.x); float wy[4] = float[4](w0.y, w1.y, w2.y, w3.y);
  vec4 acc = vec4(0.0);
  for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) {
    ivec2 c = clamp(i0 + ivec2(i - 1, j - 1), ivec2(0), ts - 1);
    acc += texelFetch(uF, c, 0) * wx[i] * wy[j];
  }
  return acc;
}
int letterOf(float x){ int k = 0; for (int i = 0; i < ${MAXL - 1}; i++) { if (i < uN - 1 && x > uSplit[i]) k = i + 1; } return k; }

// Into one letter's own frame: turned on its spot, leaning on its foot, squashed down and out.
struct Loc { vec3 q; vec2 xy; float sx; float sy; int id; };
Loc localTo(vec3 p, int id){
  Loc l; l.id = id;
  vec4 L = uL[l.id];
  vec3 q = p - vec3(L.x, uD[id].w, 0.0);
  float c = cos(L.y); float s = sin(L.y); q.xz = vec2(c * q.x - s * q.z, s * q.x + c * q.z);
  c = cos(L.z); s = sin(L.z); q.xy = vec2(c * q.x + s * q.y, -s * q.x + c * q.y);
  l.sy = 1.0 - L.w; l.sx = inversesqrt(l.sy);
  q /= vec3(l.sx, l.sy, l.sx);
  l.q = q; l.xy = vec2(q.x + L.x, q.y);
  return l;
}
float dent(Loc l, out vec2 g){
  vec4 D = uD[l.id]; vec2 d = l.xy - D.xy;
  float e = D.z * exp(-dot(d, d) * 8.0);
  g = -16.0 * d * e;
  return e;
}
// A letter turned on its spot can reach over the line into its neighbour's share, so both are asked.
int otherOf(vec3 p, int id){ int o = p.x > uL[id].x ? id + 1 : id - 1; return clamp(o, 0, uN - 1); }
float bodyOf(vec3 p, int id){
  Loc l = localTo(p, id);
  vec4 f = fieldB(l.xy);
  vec2 dg; float e = dent(l, dg);
  float z = l.q.z - e;
  float G = z * z - 2.0 * K * f.x;
  vec3 gr = vec3(2.0 * z * -dg - 2.0 * K * f.yz, 2.0 * z);
  float d = 0.5 * G / max(length(gr), 1e-3);
  // the shared field holds every letter: outside this letter's own share there is nothing of it
  float lo = id > 0 ? uSplit[id - 1] : -1e3; float hi = id < uN - 1 ? uSplit[id] : 1e3;
  float past = max(lo - l.xy.x, l.xy.x - hi);
  if (past > 0.0) d = max(d, length(vec2(past, max(abs(l.q.z) - 0.6, 0.0))) * 0.9);
  return d * min(l.sx, l.sy);
}
float body(vec3 p){ int id = letterOf(p.x); int o = otherOf(p, id); float d = bodyOf(p, id); return o == id ? d : min(d, bodyOf(p, o)); }
int nearest(vec3 p){ int id = letterOf(p.x); int o = otherOf(p, id); return o != id && bodyOf(p, o) < bodyOf(p, id) ? o : id; }
vec3 normalAt(vec3 p, out Loc l, out float hh){
  l = localTo(p, nearest(p));
  vec4 f = fieldS(l.xy); hh = f.x;
  vec2 dg; float e = dent(l, dg);
  // put the point exactly on the skin before taking its slope, so the march's last step leaves no ripples
  float z = l.q.z - e; z = sign(z) * sqrt(max(2.0 * K * f.x, 0.0));
  vec3 g = vec3(-2.0 * z * dg - 2.0 * K * f.yz, 2.0 * z);
  g /= vec3(l.sx, l.sy, l.sx);
  vec4 L = uL[l.id];
  float c = cos(L.z); float s = sin(L.z); g.xy = vec2(c * g.x - s * g.y, s * g.x + c * g.y);
  c = cos(L.y); s = sin(L.y); g.xz = vec2(c * g.x + s * g.z, -s * g.x + c * g.z);
  return normalize(g);
}
vec2 boxHit(vec3 ro, vec3 rd){
  vec3 inv = 1.0 / rd; vec3 a = (uBox0 - ro) * inv; vec3 b = (uBox1 - ro) * inv;
  vec3 lo = min(a, b); vec3 hi = max(a, b);
  return vec2(max(max(lo.x, lo.y), max(lo.z, 0.0)), min(min(hi.x, hi.y), hi.z));
}
float march(vec3 ro, vec3 rd){
  vec2 tb = boxHit(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 110; i++) { float d = body(ro + rd * t); if (d < 0.00025 * t) return t; t += clamp(d * 0.9, 0.001, 0.3); if (t > tb.y) break; }
  return -1.0;
}
// The shade a letter catches from its two neighbours (its own terminator is in the shading already).
float shadowFrom(vec3 p, vec3 l, int id){
  vec2 tb = boxHit(p, l); if (tb.x > tb.y) return 1.0;
  int a = max(id - 1, 0); int b = min(id + 1, uN - 1);
  float res = 1.0; float t = max(tb.x, 0.02);
  for (int i = 0; i < 32; i++) {
    vec3 q = p + l * t; float h = 1e3;
    if (a != id) h = min(h, bodyOf(q, a)); if (b != id) h = min(h, bodyOf(q, b));
    res = min(res, 9.0 * h / t); t += clamp(h, 0.02, 0.25); if (res < 0.003 || t > tb.y) break;
  }
  res = clamp(res, 0.0, 1.0); return res * res * (3.0 - 2.0 * res);
}
// t0 also sets how close to the start the soft edge is ignored, so a skin does not shade itself in stripes.
float shadow(vec3 p, vec3 l, float t0){
  vec2 tb = boxHit(p, l); if (tb.x > tb.y) return 1.0;
  float res = 1.0; float t = max(tb.x, t0);
  for (int i = 0; i < 40; i++) { float h = body(p + l * t); if (h < 0.0005) { res = 0.0; break; } if (t > 3.0 * t0) res = min(res, 9.0 * h / t); t += clamp(h, 0.02, 0.25); if (res < 0.003 || t > tb.y) break; }
  res = clamp(res, 0.0, 1.0); return res * res * (3.0 - 2.0 * res);
}

// The daylight studio round the set: a big window camera left, a scrim overhead, a white bounce card right.
vec3 env(vec3 rd){
  float el = asin(clamp(rd.y, -1.0, 1.0)); float az = atan(rd.x, -rd.z);
  vec3 c = mix(PAPER * 0.9, SKY * 1.1, smoothstep(-0.1, 0.6, rd.y));
  vec2 w = abs(vec2(az + 0.75, el - 0.42)) - vec2(0.42, 0.3);
  float bars = 0.25 + 0.75 * smoothstep(0.01, 0.022, abs(az + 0.75)) * smoothstep(0.01, 0.022, abs(el - 0.42));
  c += vec3(1.0, 0.98, 0.94) * 9.0 * smoothstep(0.03, -0.03, max(w.x, w.y)) * bars;
  vec2 w2 = abs(vec2(az - 0.95, el - 0.25)) - vec2(0.16, 0.5);
  c += vec3(1.0) * 3.2 * smoothstep(0.05, -0.05, max(w2.x, w2.y));
  c += vec3(1.0, 0.99, 0.97) * 2.4 * smoothstep(0.85, 1.25, el);
  c += SUNC * 40.0 * smoothstep(0.9965, 0.9992, dot(rd, uSun));
  return c;
}

// The sun comes through a tall window: its glazing bars throw soft lines across the set.
float gobo(vec3 p){
  vec3 a = normalize(cross(uSun, vec3(0.0, 1.0, 0.0))); vec3 b = cross(a, uSun);
  vec2 w = vec2(dot(p, a), dot(p, b)) - vec2(-1.2, 1.4);
  // the window: a big opening with one upright and one rail, soft because it is far away
  vec2 o = abs(w) - vec2(6.5, 3.6);
  float open = smoothstep(0.9, -0.9, max(o.x, o.y));
  float bars = smoothstep(0.06, 0.3, abs(w.x - 0.9)) * smoothstep(0.05, 0.28, abs(w.y + 0.6));
  return mix(0.5, 1.0, open * bars);
}
vec3 stage(vec3 ro, vec3 rd, float full, float jit){
  float t = 1e9; vec3 n = vec3(0.0, 1.0, 0.0);
  if (rd.y < 0.0) { float tf = -ro.y / rd.y; float z = ro.z + rd.z * tf; if (z < ZW - RC) t = tf; }
  if (t > 1e8 && rd.z > 0.0) { float tw = (ZW - ro.z) / rd.z; float y = ro.y + rd.y * tw; if (y > TOP) return env(rd); if (y > RC) { t = tw; n = vec3(0.0, 0.0, -1.0); } }
  if (t > 1e8) {
    vec2 o = ro.yz - vec2(RC, ZW - RC); float a = dot(rd.yz, rd.yz); float b = dot(o, rd.yz); float h = b * b - a * (dot(o, o) - RC * RC);
    if (h > 0.0 && a > 1e-7) { float tc = (-b + sqrt(h)) / a; vec2 pc = ro.yz + rd.yz * tc; if (tc > 0.0 && pc.x < RC + 0.02 && pc.y > ZW - RC - 0.02) { t = tc; vec2 nn = (vec2(RC, ZW - RC) - pc) / RC; n = vec3(0.0, nn.x, nn.y); } }
  }
  if (t > 1e8) return env(rd);
  vec3 p = ro + rd * t;
  vec2 pq = p.xz * (1.0 - n.z * n.z) + p.xy * n.z * n.z + vec2(p.y * 0.37, 0.0);
  float tooth = 0.45 * (n2(pq * 140.0) - 0.5) + 0.3 * (n2(pq * 55.0 + 7.0) - 0.5); float mott = n2(pq * 1.3) - 0.5;
  vec3 alb = PAPER * (1.0 + 0.06 * tooth + 0.05 * mott);
  float ndl = max(dot(n, uSun), 0.0);
  float dB = body(p + n * 0.02);
  float vis = full > 0.5 && ndl > 0.0 ? shadow(p + n * 0.004, uSun, 0.015) : 0.4 + 0.6 * smoothstep(0.0, 0.6, dB);
  float occ = 0.38 + 0.62 * smoothstep(0.0, 0.5, dB);
  occ *= 1.0 - 0.45 * exp(-max(dB, 0.0) * 9.0);
  // light thrown back off the coloured skins onto the paper
  int id = letterOf(p.x);
  vec3 bleed = uC[id] * exp(-max(dB, 0.0) * 5.5) * 0.55 * smoothstep(1.6, 0.0, p.y);
  float wash = exp(-dot(p.xy - vec2(-0.6, 1.4), p.xy - vec2(-0.6, 1.4)) / 30.0);
  vec3 fill = mix(PAPER * 1.5 + 0.06, SKY, 0.4 + 0.4 * n.y) * (0.75 + 0.5 * wash) * (1.0 - 0.35 * smoothstep(1.5, 6.0, p.y));
  vec3 col = alb * (SUNC * 4.5 * ndl * vis * gobo(p) + fill * occ * 0.5 + bleed);
  return col;
}

vec3 shadeLetter(vec3 p, vec3 rd, vec2 rnd, float jit){
  Loc l; float hh; vec3 n = normalAt(p, l, hh);
  vec3 C = uC[l.id];
  // creases where the two sheets are welded together round the outline, and fine crinkles near it
  float edge = exp(-max(hh, 0.0) * 260.0);
  // pleats run in from the seam, across the outline, like a bag pulled tight round a shape
  vec2 gd = normalize(fieldB(l.xy).yz + 1e-5); vec2 tg = vec2(-gd.y, gd.x);
  float pl = n2(vec2(dot(l.xy, tg) * 46.0, dot(l.xy, gd) * 5.0));
  float pleat = exp(-max(hh, 0.0) * 420.0);
  vec3 wob = vec3(tg * (pl - 0.5) * 0.55 * pleat, 0.0) * 0.55;
  n = normalize(n + wob);
  float seam = smoothstep(0.022, 0.006, abs(l.q.z - 0.0)) * edge;
  vec3 r = reflect(rd, n);
  float nv = clamp(dot(-rd, n), 0.0, 1.0);
  float ndl = dot(n, uSun);
  float sh = ndl > 0.0 ? shadowFrom(p + n * 0.02, uSun, l.id) : 0.0;
  // vinyl: colour that softly wraps round into the shade, and lets a little sun through where the skin is thin
  float wrap = clamp((ndl + 0.35) / 1.35, 0.0, 1.0);
  float ao = 0.45 + 0.55 * smoothstep(-0.05, 0.55, p.y) ;
  vec3 sky = mix(PAPER * 1.6 + 0.08, SKY * 1.15, 0.5 + 0.5 * n.y);
  vec3 alb = C * (1.0 - 0.35 * seam);
  vec3 col = alb * (SUNC * 3.3 * wrap * mix(0.16, 1.0, sh * gobo(p)) + sky * ao * 0.3 + alb * sky * ao * 0.35);
  col += C * 0.7 * SUNC * clamp(-ndl, 0.0, 1.0) * edge * 0.6;
  // a hard clear skin on top: the windows of the studio slide across it
  float rough = 0.02 + 0.06 * seam;
  vec3 rr = normalize(r + vec3(rnd.x, rnd.y, rnd.x * 0.5) * rough);
  float f = min(0.04 + 0.6 * pow(1.0 - nv, 5.0), 0.45);
  vec3 refl = rr.y < -0.02 ? stage(p + n * 0.01, rr, 0.0, 0.0) : env(rr);
  col = col * (1.0 - f) + refl * f * ao;
  col += SUNC * 26.0 * pow(max(dot(r, uSun), 0.0), 900.0) * sh;
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
  float ang = ign * 6.2831853; float rr = sqrt(fract(ign * 7.13 + uSeed * 3.7));
  vec2 rnd = vec2(cos(ang), sin(ang)) * rr * step(0.001, uSeed);
  float jit = uSeed > 0.001 ? ign : 0.5;
  float t = march(ro, rd);
  vec3 col = t > 0.0 ? shadeLetter(ro + rd * t, rd, rnd, jit) : stage(ro, rd, 1.0, jit);
  col = min(col, vec3(16.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the frame: a little bloom off the glints, the film curve, a soft vignette and grain.
const POST = `#version 300 es
precision highp float;
out vec4 outC;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture(uAcc, uv).rgb;
  vec2 px = 1.0 / uRes;
  vec3 nb = texture(uAcc, uv + vec2(px.x, 0.0)).rgb + texture(uAcc, uv - vec2(px.x, 0.0)).rgb + texture(uAcc, uv + vec2(0.0, px.y)).rgb + texture(uAcc, uv - vec2(0.0, px.y)).rgb;
  c = max(c + (c - nb * 0.25) * 0.35, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 20.0);
    vec3 s = texture(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.02 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 3.0, 0.0), vec3(8.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.015;
  vec2 q = (uv - vec2(0.5, 0.55)) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.16 * smoothstep(0.4, 1.3, length(q));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.018 * (1.0 - 0.4 * c.g);
  outC = vec4(c, 1.0);
}
`;

type Baked = { data: Float32Array; tw: number; th: number; fs: [number, number, number, number]; mids: number[]; splits: number[]; halfW: number; capH: number };

// Two pass chamfer distance (in pixels) to the nearest inked pixel.
function chamfer(ink: Uint8Array, w: number, h: number) {
  const d = new Float32Array(w * h);
  for (let i = 0; i < d.length; i++) d[i] = ink[i] ? 0 : 1e9;
  const a = 1, b = Math.SQRT2;
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x; if (!d[i]) continue;
      d[i] = Math.min(d[i], d[i - 1] + a, d[i - w] + a, d[i - w - 1] + b, d[i - w + 1] + b);
    }
  for (let y = h - 2; y > 0; y--)
    for (let x = w - 2; x > 0; x--) {
      const i = y * w + x; if (!d[i]) continue;
      d[i] = Math.min(d[i], d[i + 1] + a, d[i + w] + a, d[i + w + 1] + b, d[i + w - 1] + b);
    }
  return d;
}
// Relax the membrane (laplacian of h is -1 inside the ink, 0 on the outline) in place.
function relax(hf: Float32Array, ink: Uint8Array, w: number, h: number, c2: number, omega: number, rounds: number) {
  for (let it = 0; it < rounds; it++)
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (ink[i]) hf[i] += omega * ((hf[i - 1] + hf[i + 1] + hf[i - w] + hf[i + w] + c2) * 0.25 - hf[i]);
      }
}
function down(ink: Uint8Array, w: number, h: number) {
  const W = w >> 1, H = h >> 1, o = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = 2 * y * w + 2 * x; o[y * W + x] = ink[i] + ink[i + 1] + ink[i + w] + ink[i + w + 1] >= 2 ? 1 : 0; }
  return o;
}
function up(src: Float32Array, W: number, H: number, ink: Uint8Array) {
  const w = W * 2, h = H * 2, o = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = Math.min(H - 1.001, Math.max(0, (y - 0.5) / 2)), y0 = fy | 0, ty = fy - y0;
    for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!ink[i]) continue;
      const fx = Math.min(W - 1.001, Math.max(0, (x - 0.5) / 2)), x0 = fx | 0, tx = fx - x0, a = y0 * W + x0;
      o[i] = (src[a] * (1 - tx) + src[a + 1] * tx) * (1 - ty) + (src[a + W] * (1 - tx) + src[a + W + 1] * tx) * ty;
    }
  }
  return o;
}

// Set the word in a round heavy face, then blow each letter up like a sealed balloon.
function bake(word: string): Baked {
  const TW = 2048, TH = 512;
  const cv = document.createElement("canvas");
  cv.width = TW; cv.height = TH;
  const g = cv.getContext("2d", { willReadFrequently: true })!;
  const chars = [...word.slice(0, MAXL)];
  const px = 300;
  g.font = `900 ${px}px ${BALLOON_FONT}`;
  const m = g.measureText("H");
  const cap = m.actualBoundingBoxAscent || px * 0.72;
  const gap = px * 0.11, fat = px * 0.05;
  const ws = chars.map((c) => g.measureText(c).width);
  const total = ws.reduce((a, b) => a + b, 0) + gap * (chars.length - 1) + fat * 2;
  const k = Math.min((TH * 0.7) / cap, (TW * 0.92) / total);
  const size = px * k, capPx = cap * k, gp = gap * k, ft = fat * k;
  g.fillStyle = "#000"; g.fillRect(0, 0, TW, TH);
  g.font = `900 ${size}px ${BALLOON_FONT}`;
  g.fillStyle = "#fff"; g.strokeStyle = "#fff"; g.lineJoin = "round"; g.lineWidth = ft * 2; g.textBaseline = "alphabetic";
  const baseY = TH * 0.86;
  let x = (TW - (total * k - ft * 2)) / 2;
  const midsPx: number[] = [];
  chars.forEach((c, i) => {
    g.fillText(c, x, baseY); g.strokeText(c, x, baseY);
    midsPx.push(x + (ws[i] * k) / 2);
    x += ws[i] * k + gp;
  });
  const px2 = g.getImageData(0, 0, TW, TH).data;
  const ink = new Uint8Array(TW * TH);
  for (let y = 0; y < TH; y++) { const src = (TH - 1 - y) * TW * 4; for (let xx = 0; xx < TW; xx++) ink[y * TW + xx] = px2[src + xx * 4] > 127 ? 1 : 0; }
  for (let xx = 0; xx < TW; xx++) ink[xx] = ink[(TH - 1) * TW + xx] = 0;
  for (let y = 0; y < TH; y++) ink[y * TW] = ink[y * TW + TW - 1] = 0;
  const cell = CAPW / capPx; // world units per pixel
  // coarse to fine: the slow, wide part of the answer is found on the small grid
  const ink1 = down(ink, TW, TH), ink2 = down(ink1, TW >> 1, TH >> 1);
  const h2 = new Float32Array((TW >> 2) * (TH >> 2));
  relax(h2, ink2, TW >> 2, TH >> 2, (cell * 4) ** 2, 1.88, 260);
  const h1 = up(h2, TW >> 2, TH >> 2, ink1);
  relax(h1, ink1, TW >> 1, TH >> 1, (cell * 2) ** 2, 1.6, 40);
  const h0 = up(h1, TW >> 1, TH >> 1, ink);
  relax(h0, ink, TW, TH, cell * cell, 1.3, 10);
  const dist = chamfer(ink, TW, TH);
  const HC = 0.05;
  let field = new Float32Array(TW * TH);
  for (let i = 0; i < field.length; i++) {
    if (ink[i]) field[i] = HC * (1 - Math.exp(-h0[i] / HC));
    else { const d = Math.min(dist[i] * cell, 0.4); field[i] = -(0.06 * d + d * d * 0.5); }
  }
  // two light blurs take the stair steps off the outline
  const tmp = new Float32Array(TW * TH);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < TH; y++) { const r = y * TW; tmp[r] = field[r]; tmp[r + TW - 1] = field[r + TW - 1]; for (let xx = 1; xx < TW - 1; xx++) tmp[r + xx] = (field[r + xx - 1] + field[r + xx] * 2 + field[r + xx + 1]) * 0.25; }
    for (let y = 1; y < TH - 1; y++) { const r = y * TW; for (let xx = 0; xx < TW; xx++) field[r + xx] = (tmp[r + xx - TW] + tmp[r + xx] * 2 + tmp[r + xx + TW]) * 0.25; }
  }
  const data = new Float32Array(TW * TH * 4);
  const inv = 0.5 / cell;
  for (let y = 1; y < TH - 1; y++)
    for (let xx = 1; xx < TW - 1; xx++) {
      const i = y * TW + xx, o = i * 4;
      data[o] = field[i]; data[o + 1] = (field[i + 1] - field[i - 1]) * inv; data[o + 2] = (field[i + TW] - field[i - TW]) * inv;
    }
  for (let xx = 0; xx < TW; xx++) { data[xx * 4] = -0.2; data[((TH - 1) * TW + xx) * 4] = -0.2; }
  for (let y = 0; y < TH; y++) { data[y * TW * 4] = -0.2; data[(y * TW + TW - 1) * 4] = -0.2; }
  field = new Float32Array(0);
  // world frame: the outline's lowest point rests on the floor, the word centred on x = 0
  let lowest = TH;
  for (let y = 0; y < TH && lowest === TH; y++) for (let xx = 0; xx < TW; xx++) if (ink[y * TW + xx]) { lowest = y; break; }
  const x0 = -(TW / 2) * cell, y0 = -lowest * cell + 0.01;
  const mids = midsPx.map((m2) => x0 + m2 * cell);
  const splits = mids.slice(1).map((m2, i) => (m2 + mids[i]) / 2);
  return { data, tw: TW, th: TH, fs: [x0, y0, TW * cell, TH * cell], mids, splits, halfW: (total * k * cell) / 2, capH: CAPW };
}

// No WebGL 2 (or no motion wanted before the first frame): the same word as layered glossy type on the same paper.
function Still() {
  const tilt = [-4, 3, -2, 4, -3, 2, -3, 3];
  return (
    <div aria-hidden="true" className="absolute inset-x-0 top-[190px] flex justify-center lg:top-[200px]">
      <div className="relative flex items-end gap-[0.05em] text-[23vw] leading-[0.9] lg:text-[min(15.5vw,220px)]" style={{ fontFamily: BALLOON_FONT, fontWeight: 900 }}>
        {[...venue.word.slice(0, MAXL)].map((c, i) => {
          const col = css(COLOURS[i % COLOURS.length]);
          return (
            <span key={i} className="relative inline-block" style={{ transform: `rotate(${tilt[i]}deg)` }}>
              {/* the shadow thrown back and to the right on the paper */}
              <span className="absolute bottom-[-0.04em] left-[0.18em] h-[0.16em] w-[0.9em] rounded-[50%] bg-[#2d6f9e]/35 blur-[8px]" />
              <span className="relative block" style={{ color: col, textShadow: "0 0.025em 0 rgba(0,0,0,0.16), 0 0.05em 0.04em rgba(0,0,0,0.12), -0.02em -0.015em 0.02em rgba(255,255,255,0.35)" }}>{c}</span>
              {/* gloss and shade over the colour */}
              <span className="absolute inset-0 block" style={{ backgroundImage: "radial-gradient(ellipse 30% 14% at 34% 18%, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%), linear-gradient(165deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 34%, rgba(0,0,0,0) 62%, rgba(20,20,60,0.3) 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>{c}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function RayMarchedVinylBalloonLettersHero() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const api = useRef<{ squeeze: (i: number) => void; wave: () => void } | null>(null);
  const letters = [...venue.word.slice(0, MAXL)];

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" }) as WebGL2RenderingContext | null;
    if (!gl) { setShown("still"); return; }
    const canAcc = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    const still = reduce || software;

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
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uDirect", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uSun", "uF", "uFS", "uN", "uL", "uD", "uSplit", "uC", "uBox0", "uBox1"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // full precision for the field when the device can filter it, otherwise half floats
    const f32 = !!gl.getExtension("OES_texture_float_linear");
    let field = bake(venue.word);
    const ftex = gl.createTexture();
    const upload = () => {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, ftex);
      gl.texImage2D(gl.TEXTURE_2D, 0, f32 ? gl.RGBA32F : gl.RGBA16F, field.tw, field.th, 0, gl.RGBA, gl.FLOAT, field.data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    upload();
    const n = field.mids.length;
    // each letter's resting pose: a small turn and lean, as if dropped on the paper by hand
    const restYaw = [0.16, -0.1, 0.12, -0.14, 0.08, -0.12, 0.1, -0.08];
    const restLean = [0.035, -0.03, 0.02, -0.04, 0.03, -0.02, 0.03, -0.03];
    const L = Array.from({ length: n }, (_, i) => ({ sq: 0, sv: 0, yaw: 0, yv: 0, held: 0, dx: field.mids[i], dy: 0.9, dent: 0, dentT: 0 }));

    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const s = { px: 0, py: 0, sx: 0, sy: 0, count: 0, fresh: true, frame: 0, slow: 0, visible: true, raf: 0, last: 0, t0: 0, touched: false, alive: true, first: true, demo: 0 as number, hover: -1, hx: 0, hy: 0 };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.6, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.7e6 / (cssW * cssH * dpr * dpr)));
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

    // The lens: where it stands and how it frames the word, for wide screens and for phones.
    const lens = () => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      const dist = 9.5, el = (wide ? 0.2 : 0.24) - s.sy * 0.025, az = s.sx * 0.06;
      const span = field.halfW * 2 + 0.6;
      const foc = wide ? Math.min(2.6, (dist * aspect) / (span / 0.74)) : (dist * aspect) / (span / 0.94);
      const tgt = [0, 0.95, 0];
      const cam = [dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), -dist * Math.cos(az) * Math.cos(el)];
      const shift = wide ? 0.1 : 0.17 * Math.min(1, cssH / cssW / 1.6);
      return { cam, tgt, foc, shift, dist };
    };
    const ray = (cx: number, cy: number) => {
      const { cam, tgt, foc, shift } = lens();
      const ux = (cx - 0.5 * cssW) / cssH, uy = (0.5 * cssH - cy) / cssH - shift;
      const fw = [tgt[0] - cam[0], tgt[1] - cam[1], tgt[2] - cam[2]], fl = Math.hypot(...fw); fw.forEach((_, i) => (fw[i] /= fl));
      const rt = [fw[2], 0, -fw[0]], rl = Math.hypot(...rt); rt.forEach((_, i) => (rt[i] /= rl));
      const upv = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      const d = [0, 1, 2].map((i) => fw[i] * foc + rt[i] * ux + upv[i] * uy);
      // meet the plane the letters stand in
      const t = -cam[2] / d[2];
      return { x: cam[0] + d[0] * t, y: cam[1] + d[1] * t };
    };
    const pick = (cx: number, cy: number) => {
      const p = ray(cx, cy);
      if (p.y < -0.1 || p.y > CAPW * 1.15 || Math.abs(p.x) > field.halfW + 0.15) return null;
      let id = 0; field.splits.forEach((sp, i) => { if (p.x > sp) id = i + 1; });
      return { id, x: p.x, y: p.y };
    };

    const draw = (alpha: number, sample: number, focusBlur = true) => {
      const { cam, tgt, foc, shift, dist } = lens();
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample && focusBlur ? Math.sqrt(halton(sample, 7)) * 0.07 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform3f(su.uCam, cam[0], cam[1], cam[2]); gl.uniform3f(su.uTgt, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFoc, foc); gl.uniform2f(su.uShift, 0, shift);
      gl.uniform1f(su.uFocus, dist);
      const sa = -0.62 + s.sx * 0.05, se = 0.78;
      const sun = [Math.sin(sa) * Math.cos(se), Math.sin(se), -Math.cos(sa) * Math.cos(se) * 0.75], sl = Math.hypot(...sun);
      gl.uniform3f(su.uSun, sun[0] / sl, sun[1] / sl, sun[2] / sl);
      gl.uniform1i(su.uF, 0);
      gl.uniform4f(su.uFS, ...field.fs);
      gl.uniform1i(su.uN, n);
      const Lv = new Float32Array(MAXL * 4), Dv = new Float32Array(MAXL * 4), Cv = new Float32Array(MAXL * 3), Sp = new Float32Array(MAXL);
      L.forEach((l, i) => {
        Lv.set([field.mids[i], restYaw[i % 8] + l.yaw, restLean[i % 8], Math.max(-0.2, Math.min(0.4, l.sq))], i * 4);
        Dv.set([l.dx, l.dy, l.dent, Math.max(0, -l.sq) * 0.7], i * 4);
        Cv.set(COLOURS[i % COLOURS.length], i * 3);
      });
      field.splits.forEach((v, i) => (Sp[i] = v));
      gl.uniform4fv(su.uL, Lv); gl.uniform4fv(su.uD, Dv); gl.uniform3fv(su.uC, Cv); gl.uniform1fv(su.uSplit, Sp);
      const z = Math.sqrt(2 * INFLATE * 0.05) + 0.5;
      gl.uniform3f(su.uBox0, -field.halfW - 1.2, -0.05, -z); gl.uniform3f(su.uBox1, field.halfW + 1.2, CAPW * 1.7, z);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, acc);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    // a press: the letter sinks and spreads while held; on release it springs back past its mark and wobbles
    const press = (i: number, x?: number, y?: number) => {
      const l = L[i]; if (!l) return;
      l.held = 1; l.dx = x ?? field.mids[i]; l.dy = y ?? CAPW * 0.55; l.dentT = 0.22;
      wake();
    };
    const release = (i: number) => {
      const l = L[i]; if (!l || !l.held) return;
      l.held = 0; l.dentT = 0; l.yv += (i % 2 ? -1 : 1) * 2.4; wake();
    };
    const squeeze = (i: number, ms = 280) => { if (reduce) return; press(i); window.setTimeout(() => release(i), ms); };
    const wave = () => { if (reduce) return; L.forEach((_, i) => window.setTimeout(() => squeeze(i, 240), i * 120)); };
    api.current = { squeeze: (i) => { s.touched = true; squeeze(i); }, wave: () => { s.touched = true; wave(); } };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible || !s.alive) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) s.t0 = now;
      let moving = false;
      if (!reduce) {
        for (const l of L) {
          const want = l.held ? 0.24 : 0;
          for (let k = 0; k < 4; k++) {
            const h = dt / 4;
            l.sv += ((l.held ? 260 : 210) * (want - l.sq) - (l.held ? 26 : 7.5) * l.sv) * h; l.sq += l.sv * h;
            l.yv += (-120 * l.yaw - 6 * l.yv) * h; l.yaw += l.yv * h;
          }
          l.dent += (l.dentT - l.dent) * (1 - Math.exp(-dt * (l.dentT > l.dent ? 22 : 9)));
          if (l.held || Math.abs(l.sq) + Math.abs(l.sv) * 0.05 + Math.abs(l.yaw) + Math.abs(l.yv) * 0.05 + Math.abs(l.dent - l.dentT) > 0.0006) moving = true;
          else { l.sq = l.sv = l.yaw = l.yv = 0; l.dent = l.dentT; }
        }
        const ex = s.px - s.sx, ey = s.py - s.sy;
        s.sx += ex * (1 - Math.exp(-dt * 3)); s.sy += ey * (1 - Math.exp(-dt * 3));
        if (Math.abs(ex) + Math.abs(ey) > 0.003) moving = true;
      }
      const fast = L.some((l) => Math.abs(l.sv) > 0.4 || Math.abs(l.yv) > 0.4);
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(fast ? 0.6 : 0.4, 1 + (s.frame % 64), false); s.count = 4; }
      else if (s.count < 40) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }
      if (!still && dtRaw > 0.03) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && scale > 0.55) { scale *= 0.85; s.slow = 0; size(); }
      if (moving || s.count < 40) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible && s.alive) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    // it opens finished and still; a few seconds later a squeeze runs along the word, and again every few seconds until someone joins in
    const demo = () => { if (!s.alive) return; if (!s.touched && s.visible && !still) wave(); s.demo = window.setTimeout(demo, 7600); };
    if (!still) s.demo = window.setTimeout(demo, 3600);

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    const fontIn = () => !!document.fonts?.check(`900 40px ${BALLOON_FONT.split(",")[0]}`);
    const hadFont = fontIn();
    document.fonts?.ready.then(() => {
      if (!s.alive || fontIn() === hadFont) return;
      field = bake(venue.word); upload(); s.count = 0; s.fresh = true; wake();
    });

    let held = -1, pid = -1;
    const local = (e: PointerEvent) => { const r = box.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const down = (e: PointerEvent) => {
      const [x, y] = local(e); const hitL = pick(x, y);
      if (!hitL || reduce) return;
      s.touched = true; held = hitL.id; pid = e.pointerId;
      try { box.setPointerCapture(pid); } catch { /* pointer already gone */ }
      press(hitL.id, hitL.x, hitL.y);
    };
    const move = (e: PointerEvent) => {
      const [x, y] = local(e);
      s.px = (x / cssW) * 2 - 1; s.py = (y / cssH) * 2 - 1;
      const hitL = pick(x, y);
      box.style.cursor = hitL ? "pointer" : "";
      if (!reduce) {
        // a hovering finger already presses a shallow dimple into the skin
        L.forEach((l, i) => { if (!l.held) l.dentT = hitL && hitL.id === i ? 0.055 : 0; });
        if (hitL && !L[hitL.id].held) { L[hitL.id].dx = hitL.x; L[hitL.id].dy = hitL.y; }
        if (held >= 0 && hitL && hitL.id === held) { L[held].dx = hitL.x; L[held].dy = hitL.y; }
      }
      if (!still) wake();
    };
    const upFn = (e: PointerEvent) => { if (e.pointerId !== pid || held < 0) return; release(held); held = -1; };
    const leave = () => { s.px = 0; s.py = 0; L.forEach((l) => { if (!l.held) l.dentT = 0; }); wake(); };
    box.addEventListener("pointerdown", down);
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerup", upFn);
    box.addEventListener("pointercancel", upFn);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      s.alive = false;
      cancelAnimationFrame(s.raf); window.clearTimeout(s.demo); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointerdown", down); box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerup", upFn); box.removeEventListener("pointercancel", upFn);
      box.removeEventListener("pointerleave", leave); cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-[#a7d3f2] text-[#0b2442]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes balloon-hero-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .balloon-hero-rise { animation: balloon-hero-rise 760ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .balloon-hero-rise { animation: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[780px] w-full max-w-[1600px]" style={{ background: "linear-gradient(180deg, #8fc3e4 0%, #a6d3ef 38%, #c9e9f7 52%, #bfe3f5 70%, #aed7ef 100%)", touchAction: "pan-y" }}>
        {shown === "still" && <Still />}
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-5 pb-7 pt-6 sm:px-10 lg:px-16 lg:pb-12 lg:pt-9">
          <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.26em]">
            <span className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-3 w-3 rounded-full bg-[#ff3d2e] shadow-[inset_-2px_-2px_3px_rgba(0,0,0,0.25),inset_2px_2px_2px_rgba(255,255,255,0.6)]" />
              {venue.name}
            </span>
            <span className="hidden sm:inline">{venue.where}</span>
          </div>

          <div className="balloon-hero-rise grid items-end gap-6 lg:grid-cols-[1.45fr_1fr] lg:gap-14">
            <h1 className="text-[40px] font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-[58px] lg:text-[clamp(56px,5.6vw,80px)]">
              {venue.headline[0]}
              <br />
              <span className="text-[#c8241a]">{venue.headline[1]}</span>
            </h1>
            <div className="flex flex-col items-start gap-5">
              <p className="max-w-[26rem] text-[16px] font-medium leading-[1.45] text-[#14335a] lg:text-[18px]">{venue.line}</p>
              <div className="flex flex-wrap items-center gap-3">
                <a href="#" className="pointer-events-auto inline-flex h-[52px] items-center gap-3 whitespace-nowrap rounded-full bg-[#0b2442] pl-7 pr-6 text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_16px_30px_-14px_rgba(11,36,66,0.8)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#0b2442] focus-visible:ring-offset-2 focus-visible:ring-offset-[#b4daf4] active:translate-y-0 motion-reduce:transition-none">
                  {venue.cta}
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
                </a>
                <a href="#" className="pointer-events-auto inline-flex h-[52px] items-center rounded-full px-5 text-[15px] font-semibold text-[#0b2442] underline decoration-[#0b2442]/30 underline-offset-[6px] outline-none hover:decoration-[#0b2442] focus-visible:ring-2 focus-visible:ring-[#0b2442]">{venue.second}</a>
              </div>
            </div>
          </div>
        </div>

        {shown === "gl" && (
          <div className="absolute left-1/2 top-[318px] flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-white/45 p-1 backdrop-blur-sm sm:top-[420px] lg:left-auto lg:right-16 lg:top-[76px] lg:translate-x-0 motion-reduce:hidden">
            <span className="pl-3 pr-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0b2442]">Squeeze</span>
            {letters.map((c, i) => (
              <button key={i} type="button" aria-label={`Squeeze the letter ${c}`} onClick={() => api.current?.squeeze(i)} className="grid h-10 w-10 place-items-center rounded-full text-[13px] font-extrabold text-[#0b2442] outline-none transition-colors hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-[#0b2442]">
                {c}
              </button>
            ))}
          </div>
        )}
        <p className="sr-only">{venue.hours}</p>
      </div>
    </section>
  );
}
