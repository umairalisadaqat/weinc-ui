import { useEffect, useRef, useState } from "react";

// The caption is the only copy. Everything else is the photograph.
const caption = { label: "Pulled glass", line: "Three ribbons turning under one lamp" };
const START_TIME = 41; // where in the slow fold the piece opens (seconds of scene time)
const SPEED = 1; // 0.5 is a slower fold, 2 a restless one
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const DIST = 7.5; // camera distance from the glass

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 film(vec3 x){ return (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); }
// half the curve is applied to brightness alone, so a warm wall stays warm instead of bleaching to white
vec3 tone(vec3 x){ x *= EXPOSURE; float l = dot(x, vec3(0.2126, 0.7152, 0.0722)); vec3 keep = x * (film(vec3(l)).g / max(l, 1e-4)); return pow(clamp(mix(film(x), keep, 0.5), 0.0, 1.0), vec3(1.0 / 2.2)); }
`;

// The photograph: three twisted glass ribbons in front of a plaster wall, one warm lamp, one cool fill.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec2 uJit; uniform float uT; uniform vec3 uCam; uniform float uFoc;
uniform vec4 uPtr; uniform vec4 uPulse; uniform vec3 uKey; uniform float uDirect;
const float EXPOSURE = 1.0;
const float ZW = 2.3;      // the wall
const float ZS = 1.8;      // the glass lives between -ZS and ZS
const float IOR = 1.52;
const float RISE = 0.06;    // lifts the whole set in the frame
const float DISP = 0.085;  // how far red and blue part company
const vec3 KEYCOL = vec3(1.0, 0.74, 0.50);
const vec3 FILLCOL = vec3(0.50, 0.58, 1.0);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }

// half width, half thickness, resting depth
vec3 sizeOf(int i){ if (i == 0) return vec3(0.48, 0.085, 0.0); if (i == 1) return vec3(0.36, 0.072, 0.98); return vec3(0.25, 0.060, -0.98); }
// what each glass soaks up per unit of travel: rose, sea green, pale amber
vec3 soakOf(int i){ if (i == 0) return vec3(0.08, 0.80, 0.50); if (i == 1) return vec3(1.20, 0.12, 0.36); return vec3(0.05, 0.30, 1.00); }

// A point in the ribbon's own cross-section: x across the width, y through the thickness.
vec2 loc(int i, vec3 p){
  vec2 cs; vec2 off; vec4 wy; vec4 wz; vec4 tw; float sd;
  if (i == 0) { cs = vec2(0.9848, 0.1736); off = vec2(0.34, 0.0); wy = vec4(0.34, 0.55, 0.4, 0.110); wz = vec4(0.20, 0.80, 2.0, 0.090); tw = vec4(0.25, 0.52, 1.15, 0.66); sd = 1.0; }
  else if (i == 1) { cs = vec2(0.9659, -0.2588); off = vec2(-0.50, 0.98); wy = vec4(0.28, 0.70, 2.3, -0.090); wz = vec4(0.16, 0.90, 0.7, 0.120); tw = vec4(1.9, -0.56, 1.00, 0.78); sd = -1.0; }
  else { cs = vec2(0.8660, 0.5); off = vec2(-1.25, -0.98); wy = vec4(0.24, 0.85, 4.1, 0.130); wz = vec4(0.14, 1.10, 3.3, -0.100); tw = vec4(0.9, 0.66, 0.90, 0.92); sd = 1.0; }
  vec2 xy = vec2(cs.x * p.x + cs.y * p.y, cs.x * p.y - cs.y * p.x);
  float x = xy.x;
  float cy = off.x + wy.x * sin(wy.y * x + wy.z + uT * wy.w);
  float cz = off.y + wz.x * sin(wz.y * x + wz.z + uT * wz.w);
  // far from this ribbon nothing below can matter: answer with a safe distance and skip the trigonometry
  float far = length(vec2(xy.y - cy, p.z - cz)) - sizeOf(i).x - 0.62;
  if (far > 0.3) return vec2(sizeOf(i).x + far, 1e-4);
  float th = tw.x + tw.y * x + tw.z * sin(tw.w * x + 1.7 * sd + uT * 0.19 * sd);
  // the pointer: the glass leans out of its way and turns a face toward it
  vec2 pl = vec2(cs.x * uPtr.x + cs.y * uPtr.y, cs.x * uPtr.y - cs.y * uPtr.x);
  float dx = x - pl.x;
  float g = uPtr.z * exp(-dx * dx * 0.85);
  float dy = cy - pl.y;
  cy += g * 0.36 * dy / (dy * dy + 0.24);
  th += g * (0.85 * sd + uPtr.w);
  // a struck twist: one clean half turn that runs away along the ribbon in both directions
  vec2 ql = vec2(cs.x * uPulse.x + cs.y * uPulse.y, cs.x * uPulse.y - cs.y * uPulse.x);
  float dp = abs(x - ql.x) - 2.4 * uPulse.z;
  float wv = uPulse.w * exp(-dp * dp * 0.9);
  th += wv * 2.1 * sd;
  cy += wv * 0.07 * sd;
  vec2 q = vec2(xy.y - cy, p.z - cz);
  float c = cos(th); float s = sin(th);
  return vec2(c * q.x + s * q.y, c * q.y - s * q.x);
}
float rib(int i, vec3 p){
  vec3 sz = sizeOf(i); vec2 q = loc(i, p);
  vec2 d = vec2(abs(q.x) - (sz.x - sz.y), abs(q.y));
  // a beaded edge: hand-pulled glass is a touch fatter along its sides
  float bead = sz.y * (0.94 + 0.16 * smoothstep(0.0, sz.x, abs(q.x)));
  return (length(max(d, 0.0)) - bead) * 0.62;
}
float map(vec3 p){ return min(rib(0, p), min(rib(1, p), rib(2, p))); }
int which(vec3 p){ float a = rib(0, p); float b = rib(1, p); float c = rib(2, p); if (a < b && a < c) return 0; if (b < c) return 1; return 2; }

float march(vec3 ro, vec3 rd){
  float ta = 0.0; float tb = 14.0;
  if (abs(rd.z) > 1e-4) { float a = (-ZS - ro.z) / rd.z; float b = (ZS - ro.z) / rd.z; ta = max(min(a, b), 0.0); tb = min(max(a, b), ta + 14.0); }
  else if (abs(ro.z) > ZS) return -1.0;
  if (tb <= ta) return -1.0;
  float t = ta;
  for (int i = 0; i < 64; i++) { float d = map(ro + rd * t); if (d < 0.0012) return t; t += d; if (t > tb) break; }
  return -1.0;
}
vec3 calcN(int i, vec3 p){
  vec2 e = vec2(0.0016, -0.0016);
  return normalize(e.xyy * rib(i, p + e.xyy) + e.yyx * rib(i, p + e.yyx) + e.yxy * rib(i, p + e.yxy) + e.xxx * rib(i, p + e.xxx));
}

float rectL(vec3 ro, vec3 rd, vec3 c, vec3 n, vec3 u, vec3 v, vec2 hs, float soft){
  float dn = dot(rd, n); if (dn > -1e-4) return 0.0;
  float t = dot(c - ro, n) / dn; if (t < 0.0) return 0.0;
  vec3 q = ro + rd * t - c; float s = soft * t;
  vec2 d = abs(vec2(dot(q, u), dot(q, v))) - hs;
  float cloth = 1.0 - 0.3 * clamp(length(vec2(dot(q, u), dot(q, v)) / hs), 0.0, 1.4);
  return smoothstep(s, -s, d.x) * smoothstep(s, -s, d.y) * cloth;
}

// How much of the lamp reaches a point on the wall, colour by colour. Each ribbon is solved exactly:
// find where the light ray crosses the ribbon's middle sheet, read how far in from the edge that is,
// and lay down what glass does there: a dark rim, a focused bright line split into a spectrum, a tinted face.
vec3 lampOn(vec3 pw){
  vec3 ld = normalize(uKey - pw);
  vec3 L = vec3(1.0);
  for (int i = 0; i < 3; i++) {
    vec3 sz = sizeOf(i);
    float ta = (ZW - (sz.z + 0.98)) / -ld.z; float tb = (ZW - (sz.z - 0.98)) / -ld.z;
    vec2 qp = loc(i, pw + ld * ta); float tp = ta; float best = -9.0; float bm = 1.0; float bt = ta;
    for (int k = 1; k <= 6; k++) {
      float t = mix(ta, tb, float(k) / 6.0); vec2 q = loc(i, pw + ld * t);
      if (qp.y * q.y <= 0.0) {
        float m = (q.y - qp.y) / (t - tp); m = (m < 0.0 ? -1.0 : 1.0) * max(abs(m), 1e-3);
        float tr = clamp(tp - qp.y / m, tp, t); vec2 qr = loc(i, pw + ld * tr);
        float s = sz.x - abs(qr.x);
        if (abs(qr.y) < sz.y * 3.0 && s > best) { best = s; bm = abs(m); bt = tr; }
      }
      qp = q; tp = t;
    }
    float slope = clamp(bm, 0.06, 1.0);
    float sp = best * slope + (best > 0.0 ? (1.0 - slope) * sz.y : 0.0);
    float b = 0.004 + 0.0085 * bt;                 // the lamp has a size, so far glass throws a softer mark
    float we = sz.y * 1.05;
    float cover = smoothstep(-b, b, sp);
    float face = smoothstep(we - b, we + b * 1.6, sp);
    vec3 thru = exp(-soakOf(i) * (2.0 * sz.y / slope)) * 0.93;
    vec3 inside = mix(vec3(0.20, 0.19, 0.22), thru, face);
    float w0 = 0.013; float wk = sqrt(w0 * w0 + b * b * 0.6);
    vec3 dc = (sp - (we + vec3(0.006, 0.022, 0.040))) / wk;
    vec3 caus = 2.6 * (w0 / wk) * exp(-dc * dc);
    // a second, broader bloom of light just outside the rim, where the bead throws what it gathered
    float out2 = 0.22 * exp(-(sp + b * 2.0) * (sp + b * 2.0) / (b * b * 6.0 + 0.0004));
    L *= mix(vec3(1.0 + out2), inside + caus, cover);
  }
  return L;
}

vec3 wallCol(vec3 pw, vec3 L){
  vec3 lk = uKey - pw; float d2 = dot(lk, lk); vec3 ld = lk / sqrt(d2);
  float spot = smoothstep(9.0, 0.5, length(pw.xy - vec2(-1.2, 0.8)));
  // the lamp comes through a tall window: one slanted pane of light with a single glazing bar
  float u = pw.x * 0.9455 + pw.y * 0.3256; float v = pw.y * 0.9455 - pw.x * 0.3256;
  float pane = smoothstep(-4.3, -3.75, u) * smoothstep(3.55, 3.0, u) * smoothstep(-3.6, -3.0, v) * smoothstep(2.9, 2.4, v);
  pane *= 1.0 - 0.46 * smoothstep(0.15, 0.05, abs(u - 2.05));
  vec3 key = KEYCOL * max(-ld.z, 0.0) * (176.0 / d2) * (0.5 + 0.5 * spot) * pane;
  vec3 fk = vec3(7.5, -5.5, -4.0) - pw; float f2 = dot(fk, fk);
  vec3 fill = FILLCOL * max(-fk.z / sqrt(f2), 0.0) * (62.0 / f2);
  // lime plaster: trowel mottling and a fine tooth
  float m = n2(pw.xy * 1.3) * 0.6 + n2(pw.xy * 4.7 + 3.0) * 0.4;
  float tooth = n2(vec2(pw.x * 0.8 + pw.y * 0.6, pw.y * 0.8 - pw.x * 0.6) * 17.0) * 0.55 + n2(vec2(pw.x * 0.6 - pw.y * 0.8, pw.y * 0.6 + pw.x * 0.8) * 37.0 + 7.0) * 0.45;
  vec3 alb = vec3(0.90, 0.885, 0.87) * (0.955 + 0.06 * m) * (0.985 + 0.03 * tooth);
  vec3 c = alb * (key * L + fill + vec3(0.15, 0.135, 0.19));
  float edge = smoothstep(15.0, 12.0, abs(pw.x)) * smoothstep(15.0, 12.0, abs(pw.y));
  return mix(vec3(0.015, 0.014, 0.02), c, edge);
}

// The studio in front of the wall, which only the glass ever sees.
vec3 room(vec3 ro, vec3 rd, float soft){
  vec3 c = mix(vec3(0.17, 0.15, 0.17), vec3(0.58, 0.58, 0.66), smoothstep(-0.5, 0.9, rd.y));
  c = mix(c, vec3(0.06, 0.055, 0.07), smoothstep(0.25, 0.0, -rd.z) * 0.6);
  vec3 kn = normalize(-uKey);
  vec3 ku = normalize(cross(vec3(0.0, 1.0, 0.0), kn)); vec3 kv = cross(kn, ku);
  c += vec3(1.0, 0.92, 0.82) * 15.0 * rectL(ro, rd, uKey, kn, ku, kv, vec2(3.0, 2.2), soft);
  c += vec3(1.0, 0.95, 0.9) * 4.5 * rectL(ro, rd, vec3(4.5, 1.5, -9.5), normalize(vec3(-4.5, -1.5, 9.5)), vec3(0.9045, 0.0, 0.4264), vec3(0.0, 1.0, 0.0), vec2(2.0, 3.0), soft);
  // a skylight bank overhead, glazing bars and all
  float sky = rectL(ro, rd, vec3(0.6, 8.0, -2.6), vec3(0.0, -1.0, 0.0), vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), vec2(3.6, 2.2), soft);
  if (sky > 0.0) { float t = (8.0 - ro.y) / max(rd.y, 1e-3); vec3 h = ro + rd * t; float bars = smoothstep(0.03, 0.07, abs(fract(h.x * 0.42 + 0.5) - 0.5)) * smoothstep(0.03, 0.07, abs(fract(h.z * 0.36) - 0.5)); c += vec3(0.86, 0.92, 1.0) * 6.5 * sky * bars; }
  vec3 rn = normalize(vec3(-1.0, 0.0, 0.32));
  c += vec3(0.72, 0.80, 1.0) * 8.0 * rectL(ro, rd, vec3(7.6, 0.4, -3.4), rn, normalize(cross(vec3(0.0, 1.0, 0.0), rn)), vec3(0.0, 1.0, 0.0), vec2(0.42, 3.2), soft);
  vec3 ln = normalize(vec3(1.0, 0.1, 0.5));
  c += vec3(1.0, 0.72, 0.62) * 3.2 * rectL(ro, rd, vec3(-7.4, -2.2, -2.2), ln, normalize(cross(vec3(0.0, 1.0, 0.0), ln)), vec3(0.0, 1.0, 0.0), vec2(0.8, 1.5), soft);
  return c;
}

float wallT(vec3 ro, vec3 rd){ return rd.z > 0.03 ? (ZW - ro.z) / rd.z : -1.0; }
vec3 seen(vec3 ro, vec3 rd, vec3 L){
  float t = wallT(ro, rd);
  if (t > 0.0) return wallCol(ro + rd * t, L);
  return room(ro, rd, 0.05);
}
// What lies behind the last pane, with the colours fanned by however far the glass has bent the ray.
vec3 backdrop(vec3 ro, vec3 rd, vec3 rd0, float bent){
  float t = wallT(ro, rd);
  vec3 L = t > 0.0 ? lampOn(ro + rd * t) : vec3(1.0);
  vec3 g = seen(ro, rd, L);
  if (bent < 0.5) return g;
  vec3 dv = rd - rd0;
  vec3 r = seen(ro, normalize(rd0 + dv * (1.0 - DISP)), L);
  vec3 b = seen(ro, normalize(rd0 + dv * (1.0 + DISP)), L);
  return vec3(r.r, g.g, b.b);
}

vec3 render(vec3 ro, vec3 rd){
  vec3 rd0 = rd; vec3 col = vec3(0.0); vec3 thr = vec3(1.0); float bent = 0.0;
  for (int b = 0; b < 3; b++) {
    float t = march(ro, rd);
    if (t < 0.0) break;
    vec3 p = ro + rd * t; int id = which(p); vec3 n = calcN(id, p);
    // nothing pulled by hand is optically flat
    vec3 w = vec3(n2(p.xy * 2.3 + 1.0), n2(p.yz * 2.3 + 5.0), n2(p.zx * 2.3 + 9.0)) - 0.5;
    n = normalize(n + w * 0.05);
    if (dot(n, rd) > -0.02) n = normalize(n - rd * (dot(n, rd) + 0.02));
    float ci = clamp(dot(-rd, n), 0.0, 1.0);
    float F = 0.04 + 0.96 * pow(1.0 - ci, 5.0);
    vec3 rr = reflect(rd, n);
    col += thr * F * (rr.z > 0.03 ? wallCol(p + rr * ((ZW - p.z) / rr.z), vec3(1.0)) : room(p, rr, 0.03));
    thr *= 1.0 - F;
    vec3 ri = refract(rd, n, 1.0 / IOR);
    vec3 q = p - n * 0.007; float ti = 0.0;
    for (int i = 0; i < 22; i++) { float d = -rib(id, q + ri * ti); if (d < 0.0012) break; ti += max(d, 0.006); if (ti > 2.4) break; }
    vec3 p2 = q + ri * ti; vec3 n2v = -calcN(id, p2);
    thr *= exp(-soakOf(id) * ti * 1.25);
    vec3 ro2 = refract(ri, n2v, IOR);
    if (dot(ro2, ro2) < 0.25) { ro2 = reflect(ri, n2v); thr *= 0.8; }
    ro = p2 - n2v * 0.009; rd = normalize(ro2); bent = 1.0;
  }
  return col + thr * backdrop(ro, rd, rd0, bent);
}

void main(){
  vec2 fc = gl_FragCoord.xy + uJit;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - vec2(0.0, RISE);
  vec3 fw = normalize(-uCam); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 col = min(render(uCam, rd), vec3(20.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the plate: a little bloom off the hot highlights, the film curve, a soft vignette, grain.
const POST = `
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain;
const float EXPOSURE = 1.0;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uAcc, uv).rgb;
  vec2 px = 1.0 / uRes;
  vec3 nb = texture2D(uAcc, uv + vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv - vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv + vec2(0.0, px.y)).rgb + texture2D(uAcc, uv - vec2(0.0, px.y)).rgb;
  c = max(c + (c - nb * 0.25) * 0.4, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 16.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.03 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.02, 0.0), vec3(5.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.03;
  vec2 q = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.2 * smoothstep(0.35, 1.2, length(q));
  c = tone(c);
  c = mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, 1.08);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.02;
  outC = vec4(c, 1.0);
}
`;

// No WebGL: the same set as a drawing. Each ribbon is a band whose width opens and closes as it turns.
const stillRibbons = [
  { from: [-90, 318], to: [1370, 150], width: 150, turns: 1.55, phase: 0.55, sway: 34, tint: "#f3a9c0", id: "a" },
  { from: [-90, 196], to: [1370, 560], width: 112, turns: 1.9, phase: 2.0, sway: 30, tint: "#86d6c4", id: "b" },
  { from: [250, 850], to: [1370, 236], width: 82, turns: 2.3, phase: 1.1, sway: 24, tint: "#f1cf8c", id: "c" },
];
function band(r: (typeof stillRibbons)[number], scale = 1, shift = 0) {
  const top: string[] = [], bottom: string[] = [];
  const dx = r.to[0] - r.from[0], dy = r.to[1] - r.from[1], len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  for (let i = 0; i <= 72; i++) {
    const u = i / 72;
    const sway = Math.sin(u * Math.PI * 2.2 + r.phase) * r.sway;
    const turn = Math.cos(u * Math.PI * r.turns + r.phase);
    const half = (Math.abs(turn) * r.width * 0.5 + 4) * scale;
    const cx = r.from[0] + dx * u + nx * (sway + shift * turn * r.width), cy = r.from[1] + dy * u + ny * (sway + shift * turn * r.width);
    top.push(`${(cx + nx * half).toFixed(1)} ${(cy + ny * half).toFixed(1)}`);
    bottom.unshift(`${(cx - nx * half).toFixed(1)} ${(cy - ny * half).toFixed(1)}`);
  }
  return `M${top.join("L")}L${bottom.join("L")}Z`;
}
const stillPane = "M-40 190 L640 -60 L1075 -60 L1250 760 L60 760 Z";
function Still() {
  return (
    <svg aria-hidden="true" viewBox="0 0 1280 760" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="glass-ribbon-still-shade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f8cb9" /><stop offset="0.55" stopColor="#a9a6d2" /><stop offset="1" stopColor="#c6c6ea" />
        </linearGradient>
        <linearGradient id="glass-ribbon-still-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7ecdf" /><stop offset="0.5" stopColor="#f3e3da" /><stop offset="1" stopColor="#ead9e2" />
        </linearGradient>
        <filter id="glass-ribbon-still-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="16" /></filter>
        <filter id="glass-ribbon-still-shadow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3.2" /></filter>
        <filter id="glass-ribbon-still-line" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4" /></filter>
        <mask id="glass-ribbon-still-lit"><path d={stillPane} fill="#fff" filter="url(#glass-ribbon-still-soft)" /></mask>
      </defs>
      <rect width="1280" height="760" fill="url(#glass-ribbon-still-shade)" />
      <path d={stillPane} fill="url(#glass-ribbon-still-sun)" filter="url(#glass-ribbon-still-soft)" />
      <path d="M800 -60 L1010 760" stroke="#b9b2d6" strokeOpacity="0.5" strokeWidth="26" filter="url(#glass-ribbon-still-soft)" />
      {/* what the lamp throws on the wall: a soft violet mark with a spectrum along each edge */}
      <g mask="url(#glass-ribbon-still-lit)">
        <g className="glass-ribbon-still-drift" transform="translate(64 92)">
          {stillRibbons.map((r) => (
            <g key={r.id}>
              <path d={band(r)} fill="#8c86cc" fillOpacity="0.3" filter="url(#glass-ribbon-still-shadow)" />
              <path d={band(r, 0.9)} fill="none" stroke="#ff9872" strokeOpacity="0.7" strokeWidth="2.4" filter="url(#glass-ribbon-still-line)" />
              <path d={band(r, 0.82)} fill="none" stroke="#fff3c4" strokeOpacity="0.95" strokeWidth="2.6" filter="url(#glass-ribbon-still-line)" />
              <path d={band(r, 0.74)} fill="none" stroke="#86b4ff" strokeOpacity="0.7" strokeWidth="2.4" filter="url(#glass-ribbon-still-line)" />
            </g>
          ))}
        </g>
      </g>
      {stillRibbons.map((r) => (
        <g key={r.id}>
          <path d={band(r)} fill={r.tint} fillOpacity="0.2" />
          <path d={band(r)} fill="#ffffff" fillOpacity="0.14" />
          <path d={band(r, 0.26, 0.22)} fill="#ffffff" fillOpacity="0.34" filter="url(#glass-ribbon-still-shadow)" />
          <path d={band(r)} fill="none" stroke="#3e3660" strokeOpacity="0.5" strokeWidth="1.6" transform="translate(0 1.2)" />
          <path d={band(r)} fill="none" stroke="#ffffff" strokeOpacity="0.95" strokeWidth="1.3" />
          <path d={band(r, 0.9)} fill="none" stroke={r.tint} strokeOpacity="0.55" strokeWidth="3" filter="url(#glass-ribbon-still-line)" />
        </g>
      ))}
    </svg>
  );
}

export default function RayMarchedGlassRibbonBackground() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [paused, setPaused] = useState(false);
  const [live, setLive] = useState(true); // false when there is nothing to pause: reduced motion, software drawing or no WebGL
  const api = useRef<{ twist: () => void; pause: (p: boolean) => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts = { antialias: false, alpha: false, powerPreference: "high-performance" as const };
    const gl2 = cv.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? cv.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) { setShown("still"); setLive(false); return; }
    const canAcc = !!gl2 && (!!gl2.getExtension("EXT_color_buffer_float") || !!gl2.getExtension("EXT_color_buffer_half_float"));
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    const still = reduce || software; // one exposure, refined, then the loop rests
    if (still) setLive(false);

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
    if (!scene || (canAcc && !post)) { setShown("still"); setLive(false); return; }
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uJit", "uT", "uCam", "uFoc", "uPtr", "uPulse", "uKey", "uDirect"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // The plate every exposure is blended onto: sub-pixel jitter averages into clean edges.
    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const s = {
      t: START_TIME, paused: false, visible: true, raf: 0, last: 0, frame: 0, slow: 0, count: 0, fresh: true, first: true,
      has: false, tx: 0, ty: 0, x: 0.9, y: 0.25, vx: 0, vy: 0, str: 0, kick: 0, lx: 0, ly: 0, idle: 0,
      pulse: [0, 0, 0, 0], nextPulse: 5.2, clock: 0, sum: 0, struck: false,
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      // measured budget: never more than about 0.9 million pixels of ray marching, far fewer when drawn in software
      const k = Math.min(1, Math.sqrt((software ? 1.6e5 : 1.0e6) / (cssW * cssH * dpr * dpr)));
      const w = Math.max(2, Math.round(cssW * dpr * k)), h = Math.max(2, Math.round(cssH * dpr * k));
      if (w === W && h === H) return;
      W = w; H = h; cv.width = W; cv.height = H;
      if (gl2 && acc && fbo) {
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, acc);
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
    const lens = () => { const aspect = cssW / cssH; const foc = 1.8 * Math.max(0.5, Math.min(1, aspect / 1.25)); const hh = (DIST * 0.5) / foc; return { foc, hh, hw: hh * aspect, rise: (0.06 * DIST) / foc }; };

    const draw = (alpha: number, sample: number) => {
      const { foc } = lens();
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform2f(su.uJit, canAcc && sample ? halton(sample, 2) - 0.5 : 0, canAcc && sample ? halton(sample, 3) - 0.5 : 0);
      gl.uniform1f(su.uT, s.t);
      // the camera and the lamp both lean a little with the pointer, so the shadows slide on the wall
      gl.uniform3f(su.uCam, -s.lx * 0.42, 0.1 + s.ly * 0.26, -DIST);
      gl.uniform1f(su.uFoc, foc);
      gl.uniform4f(su.uPtr, s.x, s.y, s.str, s.kick);
      gl.uniform4f(su.uPulse, s.pulse[0], s.pulse[1], s.pulse[2], s.pulse[3]);
      gl.uniform3f(su.uKey, -4.4 + s.lx * 1.5, 5.3 - s.ly * 1.0, -9.0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 0); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still || s.paused ? 1 : s.frame % 64);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const strike = (x: number, y: number) => { s.pulse = [x, y, 0, 0]; s.struck = true; wake(); };
    const settle = still ? 20 : 28; // exposures blended into a resting frame

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      const moving = !still && !s.paused;

      if (moving) {
        s.t += dt * SPEED; s.clock += dt;
        const { hw, hh, rise } = lens();
        // with nobody there, a slow hand of its own wanders through the glass
        let gx: number, gy: number, want: number;
        if (s.has) { gx = s.tx * hw; gy = -s.ty * hh - rise; want = 1; s.idle = 0; }
        else { s.idle += dt; const a = s.clock * 0.33; gx = Math.sin(a + 0.9) * hw * 0.55; gy = Math.sin(a * 1.43 + 0.3) * hh * 0.45; want = 0.8; }
        // a sprung follower: it arrives a beat late and overshoots once
        const k = s.has ? 46 : 5, c = s.has ? 8.5 : 4;
        for (let i = 0; i < 2; i++) { s.vx += (k * (gx - s.x) - c * s.vx) * (dt / 2); s.vy += (k * (gy - s.y) - c * s.vy) * (dt / 2); s.x += s.vx * (dt / 2); s.y += s.vy * (dt / 2); }
        s.str += (want - s.str) * (1 - Math.exp(-dt * 3));
        s.kick += (Math.max(-0.9, Math.min(0.9, s.vx * 0.16)) - s.kick) * (1 - Math.exp(-dt * 6));
        const px = s.has ? s.tx : Math.sin(s.clock * 0.21) * 0.35, py = s.has ? s.ty : Math.sin(s.clock * 0.17 + 1) * 0.3;
        s.lx += (px - s.lx) * (1 - Math.exp(-dt * 2.2)); s.ly += (py - s.ly) * (1 - Math.exp(-dt * 2.2));
        // the twist winds up over a tenth of a second, then rings down as it travels
        if (s.struck) { s.pulse[2] += dt; const a = s.pulse[2]; s.pulse[3] = (1 - Math.exp(-a * 10)) * Math.exp(-a * 0.8); if (a > 8) { s.struck = false; s.pulse[3] = 0; } }
        if (!s.has && s.clock > s.nextPulse) { strike(gx, gy); s.nextPulse = s.clock + 9; }
      }

      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(0.2, 1 + (s.frame % 16)); s.count = 1; }
      else if (s.count < settle) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      // measured, not guessed: if frames run long for most of a second, give up a step of resolution
      if (moving) {
        // first a one-off reading over half a second, which can drop straight to the size this machine can carry
        if (s.frame > 12 && s.frame <= 42) s.sum += dtRaw;
        if (s.frame === 42 && s.sum / 30 > 0.0195) { scale = Math.max(0.36, scale * Math.sqrt(0.0167 / (s.sum / 30)) * 0.94); size(); }
        if (dtRaw > 0.024) s.slow++; else s.slow = Math.max(0, s.slow - 2);
        if (s.slow > 30 && scale > 0.36) { scale *= 0.84; s.slow = 0; size(); }
      }
      if (moving || s.count < settle) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };
    api.current = {
      twist: () => { if (!still) strike(0, 0); },
      pause: (p) => { s.paused = p; s.count = 1; wake(); },
    };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.02 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);

    const at = (e: PointerEvent) => { const r = box.getBoundingClientRect(); s.tx = ((e.clientX - r.left) / r.width) * 2 - 1; s.ty = ((e.clientY - r.top) / r.height) * 2 - 1; };
    const move = (e: PointerEvent) => { at(e); s.has = true; };
    const leave = () => { s.has = false; };
    const down = (e: PointerEvent) => {
      if (still || s.paused || (e.target as HTMLElement).closest("button")) return;
      at(e); s.has = e.pointerType === "mouse";
      const { hw, hh, rise } = lens();
      strike(s.tx * hw, -s.ty * hh - rise);
    };
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    box.addEventListener("pointercancel", leave);
    box.addEventListener("pointerdown", down);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); setLive(false); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      box.removeEventListener("pointercancel", leave); box.removeEventListener("pointerdown", down);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const togglePause = () => { const p = !paused; setPaused(p); api.current?.pause(p); };
  const pill = "pointer-events-auto inline-flex h-10 min-w-[40px] items-center justify-center gap-2 rounded-full border border-white/60 bg-white/35 px-3 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-stone-900 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_24px_-12px_rgba(60,50,110,0.45)] sm:px-4 outline-none backdrop-blur-md transition-colors duration-200 hover:bg-white/75 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9dcd9]";

  return (
    <section className="relative isolate overflow-hidden bg-[#e9dcd9] text-stone-900" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes ray-marched-glass-ribbon-drift { from { transform: translate(58px, 86px); } to { transform: translate(72px, 98px); } }
        .glass-ribbon-still-drift { animation: ray-marched-glass-ribbon-drift 7s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .glass-ribbon-still-drift { animation: none; } }
      `}</style>
      <div ref={stage} className="relative h-[680px] w-full lg:h-[760px]" style={{ background: "linear-gradient(135deg, #a9a6d2 0%, #f3e3da 30%, #f3e3da 68%, #c6c6ea 100%)", touchAction: "pan-y" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        {shown === "still" && <Still />}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 px-6 pb-6 sm:px-10 sm:pb-9 lg:px-14 lg:pb-11">
          <p>
            <span className="flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.34em] text-stone-900/75">
              <span aria-hidden="true" className="h-px w-7 bg-stone-900/50" />
              {caption.label}
            </span>
            <span className="mt-2.5 block text-[20px] italic leading-[1.05] tracking-[-0.015em] text-stone-900 sm:text-[26px]" style={{ fontFamily: SERIF }}>{caption.line}</span>
          </p>
          {live && (
            <div className="flex shrink-0 gap-1.5">
              <button type="button" onClick={() => api.current?.twist()} disabled={paused} aria-label="Send a twist along the ribbons" className={`${pill} disabled:opacity-40`}>
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 10c2.5-6 5.5-6 8 0s5.5 6 8 0" /></svg>
                <span className="hidden sm:inline">Twist</span>
              </button>
              <button type="button" onClick={togglePause} aria-pressed={paused} aria-label="Pause the motion" className={pill}>
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">{paused ? <path d="M6 3.5v13l10.5-6.5z" /> : <path d="M5 3.5h3.5v13H5zM11.5 3.5H15v13h-3.5z" />}</svg>
                <span className="hidden sm:inline">{paused ? "Play" : "Pause"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
