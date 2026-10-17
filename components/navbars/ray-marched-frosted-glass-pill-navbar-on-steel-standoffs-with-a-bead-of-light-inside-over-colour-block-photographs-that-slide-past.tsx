import { useEffect, useRef, useState } from "react";

// One entry per link. `label` is lettered on the glass, `title` is printed very large on the page behind it.
const pages = [
  { label: "Walls", title: "Walls", deck: "A pink parapet turns the corner and keeps its one ornament.", place: "Villajoyosa", src: "https://images.pexels.com/photos/12198920/pexels-photo-12198920.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "A pale pink parapet with a white ball finial under a deep blue sky", flip: false, ink: "#1c2a66", back: ["#3a5aa6", "#f3c3cd"] },
  { label: "Stairs", title: "Stairs", deck: "Four yellow steps that climb to nothing but sky.", place: "Calpe", src: "https://images.pexels.com/photos/12072472/pexels-photo-12072472.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "A bright yellow stepped wall against a clear blue sky", flip: true, ink: "#ffffff", back: ["#0a7bdc", "#0a7bdc"] },
  { label: "Windows", title: "Windows", deck: "One sash, six panes, a wall the colour of watermelon.", place: "Agaete", src: "https://images.pexels.com/photos/12132707/pexels-photo-12132707.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "A coral red house front with one stone framed window under a blue sky", flip: false, ink: "#ffffff", back: ["#2f66a8", "#e9596b"] },
  { label: "Roofs", title: "Roofs", deck: "Flat tops in pool tile teal, each capped with a white line.", place: "Arrecife", src: "https://images.pexels.com/photos/12154692/pexels-photo-12154692.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Flat roofed teal and grey concrete blocks against a blue sky", flip: true, ink: "#ffffff", back: ["#2a8cc4", "#2b97ad"] },
  { label: "Curves", title: "Curves", deck: "The only bend on the street, in two coats of apricot.", place: "Tavira", src: "https://images.pexels.com/photos/19013610/pexels-photo-19013610.jpeg?auto=compress&cs=tinysrgb&w=1600", alt: "Apricot and orange walls meeting in one soft curve with blue sky between", flip: false, ink: "#1f3276", back: ["#f8926b", "#fdbf85"] },
];
const START = 1; // the page it opens on
const BRAND = "Calle";
const LIGHT: [number, number, number] = [0.5, 1, 0.06]; // the bead inside the glass (linear RGB)
const GLOW = 1; // how hard the bead burns
const FROST = 0.17; // how far the etched back face smears the page behind it, in bar heights
const YAW = 0.46; // radians the lens stands off to the left of the bar
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

// The scene is measured in bar heights: the pill is 1 tall, 7.2 long and 0.48 thick, and stands 0.8 off the page.
const GAP = 0.8, HALF = 3.6, T2 = 0.24, SEAM = 0.05;

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 curve(vec3 x){ return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 tone(vec3 x){ x *= 0.92; float m = max(max(x.r, x.g), max(x.b, 1e-4)); vec3 h = x * (curve(vec3(m)).r / m); return pow(mix(curve(x), h, 0.5), vec3(1.0 / 2.2)); }
`;

// The photograph. A printed page on a wall, a pill of glass held off it on two steel standoffs, and a ray that
// goes into the glass, bends, and comes out through a polished edge (sharp) or the etched back face (smeared).
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uDirect;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus; uniform float uDof;
uniform vec3 uKey; uniform vec3 uKeyP; uniform float uSoft; uniform vec3 uLight; uniform vec4 uBead; uniform vec2 uHov;
uniform vec4 uRect; uniform vec2 uOff; uniform float uBlur; uniform float uFrost; uniform float uFrostLod;
uniform sampler2D uA; uniform sampler2D uB; uniform sampler2D uLab;
const float G = ${GAP.toFixed(2)}; const float T2 = ${T2.toFixed(2)}; const float BL = 3.1; const float BR = 0.5; const float RIM = 0.17; const float CX = 3.12;
const vec3 KEYC = vec3(1.0, 0.965, 0.92);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float sdStad(vec2 p){ return length(vec2(max(abs(p.x) - BL, 0.0), p.y)) - BR; }
float sdGlass(vec3 p){ vec2 w = vec2(sdStad(p.xy), abs(p.z) - T2) + RIM; return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - RIM; }
float sdCyl(vec3 p, float r, float z0, float z1, float e){ vec2 w = vec2(length(p.xy) - r, abs(p.z - 0.5 * (z0 + z1)) - 0.5 * (z1 - z0)) + e; return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - e; }
float sdMetal(vec3 p){ vec3 q = vec3(abs(p.x) - CX, p.y, p.z); return min(sdCyl(q, 0.15, T2 - 0.02, T2 + 0.07, 0.022), sdCyl(q, 0.095, -G, -T2 + 0.02, 0.01)); }
float map(vec3 p){ return min(sdGlass(p), sdMetal(p)); }
// The bead: a lozenge of light lying in the middle of the glass, between its two ends.
float beadR(){ return uBead.z; }
vec3 beadC(vec3 p){ float r = beadR(); float a = uBead.x + r; float b = max(uBead.y - r, a); return vec3(clamp(p.x, a, b), 0.0, 0.0); }
float sdBead(vec3 p){ vec3 q = p - beadC(p); q.z *= 2.5; return (length(q) - beadR()) / 2.5; }

float lab(vec2 p, float bias){
  vec2 uv = vec2((p.x + ${HALF.toFixed(1)}) / ${(HALF * 2).toFixed(1)}, 0.5 - p.y);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
  return texture2D(uLab, uv, bias).r;
}
// The printed page. While it changes, the old sheet runs off one side and the new one follows it in.
vec3 page(vec2 w, float bias){
  float v = 1.0 - (w.y - uRect.y) / uRect.w;
  float ua = (w.x - uRect.x - uOff.x) / uRect.z; float ub = (w.x - uRect.x - uOff.y) / uRect.z;
  vec3 a = texture2D(uA, vec2(clamp(ua, 0.0, 1.0), v), bias).rgb; vec3 b = texture2D(uB, vec2(clamp(ub, 0.0, 1.0), v), bias).rgb;
  float ea = min(ua, 1.0 - ua) * uRect.z; float eb = min(ub, 1.0 - ub) * uRect.z;
  float ia = smoothstep(-0.006, 0.006, ea); float ib = smoothstep(-0.006, 0.006, eb) * (1.0 - ia);
  vec3 c = a * ia + b * ib;
  // the edge of each sheet catches a little light, and the gap between them is dark
  c *= 1.0 - 0.3 * exp(-max(ea, 0.0) / 0.05) * ia - 0.3 * exp(-max(eb, 0.0) / 0.05) * ib;
  return c * c * (0.52 + 0.48 * c);
}
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a; vec2 ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
// Everything that lands on the page: the key, less what the glass and its fixings take out of it, plus the bead.
vec3 wallLight(vec2 w, float pen){
  vec2 so = -uKey.xy / uKey.z * G;
  float s = sdStad(w - so);
  float sh = smoothstep(pen, -pen, s);
  // etched glass passes most of the light on, scattered: the shadow is deepest just inside its edge, where the rim turned the light away
  float lit = 1.0 - sh * (0.36 + 0.2 * smoothstep(-0.42, -0.05, s)) + 0.07 * exp(-pow((s - pen * 1.2) / 0.07, 2.0));
  // and the polished rim gathers what it turned into one bright thread along the far side of the shadow
  vec2 sg = normalize(vec2(max(abs(w.x - so.x) - BL, 0.0) * sign(w.x - so.x), w.y - so.y) + 1e-5);
  lit += step(pen, 0.2) * 0.24 * exp(-pow((s + 0.105) / 0.03, 2.0)) * smoothstep(-0.1, 0.8, dot(sg, normalize(so))) * (0.55 + 0.45 * n2(w * vec2(1.7, 9.0)));
  float kk = (G - T2) / G;
  float b1 = sdSeg(w, vec2(CX, 0.0), vec2(CX, 0.0) + so * kk) - 0.095; float b2 = sdSeg(w, vec2(-CX, 0.0), vec2(-CX, 0.0) + so * kk) - 0.095;
  float bsh = smoothstep(0.05 + pen * 0.4, -0.05 - pen * 0.4, min(b1, b2));
  lit *= 1.0 - 0.42 * bsh;
  float cap = min(length(w - vec2(CX, 0.0) - so * 1.4), length(w - vec2(-CX, 0.0) - so * 1.4)) - 0.15;
  lit *= 1.0 - 0.22 * smoothstep(pen, -pen, cap);
  float base = min(length(w - vec2(CX, 0.0)), length(w - vec2(-CX, 0.0)));
  lit *= 1.0 - 0.35 * exp(-max(base - 0.095, 0.0) / 0.07);
  float pool = mix(0.66, 1.0, smoothstep(10.5, 1.0, length(w - vec2(-1.8, 1.2))));
  vec3 e = KEYC * 1.2 * lit * pool + vec3(0.085, 0.092, 0.11);
  vec2 pa = w - vec2(clamp(w.x, uBead.x + 0.2, max(uBead.y - 0.2, uBead.x + 0.2)), 0.0);
  e += uLight * uBead.w * 0.7 / pow(1.0 + dot(pa, pa) / 0.5, 1.6);
  return e;
}
float lbox(vec3 rd, vec3 n, vec2 hs, float soft, float turn){
  float dn = dot(rd, n); if (dn < 0.05) return 0.0;
  vec3 u = normalize(cross(vec3(0.0, 1.0, 0.0), n)); vec3 v = cross(n, u);
  vec2 q = vec2(dot(rd, u), dot(rd, v)) / dn; q = vec2(q.x * cos(turn) - q.y * sin(turn), q.x * sin(turn) + q.y * cos(turn));
  vec2 d = abs(q) - hs; float e = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  return smoothstep(soft, -soft, e);
}
// The room in front of the wall: a dim studio, the key softbox, and one wide panel whose edge lies across the glass.
vec3 env(vec3 rd){
  vec3 c = mix(vec3(0.05, 0.055, 0.07), vec3(0.3, 0.31, 0.34), smoothstep(-0.5, 0.6, rd.y));
  c += KEYC * 24.0 * lbox(rd, uKey, vec2(0.36, 0.27), 0.04, 0.2);
  // two tall strips of window: their slanted bars lie across the face of the glass and drift
  vec3 sn = normalize(vec3(0.42 + uSoft, 0.2, 0.86));
  c += vec3(0.92, 0.96, 1.0) * 0.7 * lbox(rd, sn, vec2(0.2, 1.2), 0.3, 0.42);
  // a long strip overhead, there for the top edge of the glass to find
  if (rd.y > 0.05) { vec2 q = rd.xz / rd.y; c += vec3(1.0, 0.98, 0.95) * 15.0 * smoothstep(0.05, -0.05, abs(q.y + 0.1 - uSoft * 0.6) - 0.16) * smoothstep(0.3, -0.3, abs(q.x - 0.5) - 1.7); }
  c += vec3(1.0, 0.97, 0.94) * 2.0 * lbox(rd, normalize(vec3(-0.2, -0.75, 0.6)), vec2(0.9, 0.16), 0.08, 0.0);
  return c;
}
vec3 envW(vec3 ro, vec3 rd){
  if (rd.z < -0.03) { vec2 w = ro.xy + rd.xy * ((-G - ro.z) / rd.z); return page(w, 3.0) * wallLight(w, 0.3); }
  return env(rd);
}
vec3 glassN(vec3 p){
  vec2 e = vec2(0.0012, -0.0012);
  return normalize(e.xyy * sdGlass(p + e.xyy) + e.yyx * sdGlass(p + e.yyx) + e.yxy * sdGlass(p + e.yxy) + e.xxx * sdGlass(p + e.xxx));
}
vec3 metalN(vec3 p){
  vec2 e = vec2(0.0012, -0.0012);
  return normalize(e.xyy * sdMetal(p + e.xyy) + e.yyx * sdMetal(p + e.yyx) + e.yxy * sdMetal(p + e.yxy) + e.xxx * sdMetal(p + e.xxx));
}
// Out through the etched back face. The page is 0.44 behind it, so every point of frost gathers a disc of the page.
vec3 frost(vec3 q, vec3 d, float ign){
  vec3 o = refract(d, vec3(0.0, 0.0, 1.0), 1.5); if (dot(o, o) < 0.5) o = d;
  vec2 w0 = q.xy + o.xy * ((-G - q.z) / o.z);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 9; i++) {
    float a = (float(i) + ign) * 2.39996; float r = sqrt((float(i) + 0.5) / 9.0);
    acc += page(w0 + r * vec2(cos(a), sin(a)) * uFrost, uFrostLod);
  }
  vec3 c = acc / 9.0 * wallLight(w0, 0.36) * 0.78;
  // the key reaches the frost through the front face, except where the lettering and the caps stand in its way
  vec3 lg = normalize(vec3(uKey.xy / 1.5, sqrt(1.0 - dot(uKey.xy, uKey.xy) / 2.25)));
  vec2 lp = q.xy + lg.xy / lg.z * (2.0 * T2);
  float ls = lab(lp, 4.2);
  float cs = 0.7 * smoothstep(0.19, 0.11, min(length(lp - vec2(CX, 0.0)), length(lp - vec2(-CX, 0.0))));
  float tooth = 0.92 + 0.16 * n2(q.xy * 190.0) + 0.06 * (n2(q.xy * 23.0) - 0.5);
  // the softbox is close, so the near end of the frost takes more of it than the far end
  vec3 lk = uKeyP - q; float kd = dot(lk, lk); float near = 118.0 / kd * max(lk.z * inversesqrt(kd), 0.0);
  c += KEYC * 0.2 * near * (1.0 - 0.75 * ls) * (1.0 - 0.8 * cs) * tooth;
  c += vec3(0.03, 0.033, 0.04);
  // the bead lights the frost from inside, and a pointer resting on a link leaves a faint breath of the same light
  vec3 pb = q - beadC(q); float db = length(pb.xy);
  c += uLight * uBead.w * (0.62 * exp(-max(db - beadR() * 0.7, 0.0) / 0.12) + 0.16 / (1.0 + db * db / 0.16)) * tooth;
  c += uLight * uHov.y * 0.16 * exp(-dot(q.xy - vec2(uHov.x, 0.0), q.xy - vec2(uHov.x, 0.0)) / 0.2) * tooth;
  // the standoff barrels are a dark blur behind it
  float bb = min(length(q.xy - vec2(CX, 0.0)), length(q.xy - vec2(-CX, 0.0)));
  c *= 1.0 - 0.3 * smoothstep(0.17, 0.07, bb);
  return c * (0.955 + 0.09 * n2(q.xy * 260.0));
}
vec3 outside(vec3 q, vec3 o, vec2 ws){
  if (o.z > -0.03) return min(env(o), vec3(1.5));
  vec2 w = q.xy + o.xy * ((-G - q.z) / o.z);
  // glass bends blue more than red, so the three colours of the page land a little apart
  vec2 dv = clamp(w - ws, -1.2, 1.2) * 0.045;
  vec3 c = vec3(page(w - dv, 0.0).r, page(w, 0.0).g, page(w + dv, 0.0).b);
  return c * wallLight(w, 0.1);
}
// The path through the glass: up to three legs, bouncing off any face the ray meets too flat to leave by.
vec3 through(vec3 p, vec3 d, vec2 ws, float ign){
  vec3 res = vec3(0.12, 0.13, 0.15); float depth = 0.0; float mind = 9.0; vec3 q = p; float run = 0.0; vec3 qb = p; vec3 db0 = d;
  for (int b = 0; b < 3; b++) {
    float t = 0.006; bool hit = false;
    for (int i = 0; i < 56; i++) {
      q = p + d * t;
      float dg = -sdGlass(q); if (dg < 0.0012) { hit = true; break; }
      float db = sdBead(q);
      float st = max(min(dg, abs(db)), 0.014);
      if (db < 0.0) { if (depth == 0.0) { qb = q; db0 = d; } depth += st; vec3 pc = q - beadC(q); mind = min(mind, length(vec2(pc.y, pc.z * 2.5))); }
      t += st;
    }
    run += t;
    // a ray that runs the length of the bar without finding a face is lost in the glass
    if (!hit) { res = frost(vec3(q.xy, -T2), vec3(0.0, 0.0, -1.0), ign) * 0.8; break; }
    vec3 m = glassN(q);
    if (m.z < -0.8 && sdStad(q.xy) < -0.205) { res = frost(q, d, ign); break; }
    vec3 o = refract(d, -m, 1.5);
    if (dot(o, o) < 0.5) { d = reflect(d, -m); p = q - m * 0.004; continue; }
    float f = 0.04 + 0.96 * pow(1.0 - clamp(dot(o, m), 0.0, 1.0), 5.0);
    res = outside(q, o, ws) * (1.0 - f); break;
  }
  // the long way through a sheet of glass is faintly sea green
  res *= exp(-max(run - 0.45, 0.0) * vec3(0.5, 0.05, 0.2));
  float e = 1.0 - exp(-depth * 7.0);
  float core = smoothstep(beadR(), 0.0, mind);
  // full colour at the skin, close to white down the middle
  vec3 em = uLight * uBead.w * e * (0.78 + 0.6 * core * core);
  em += mix(uLight, vec3(1.0), 0.5) * uBead.w * e * 0.007 / (mind * mind + 0.007);
  if (depth > 0.0) {
    // its skin is a liquid surface inside the glass: it shows the softbox as one soft crescent
    vec2 eb = vec2(0.004, -0.004);
    vec3 nb = normalize(eb.xyy * sdBead(qb + eb.xyy) + eb.yyx * sdBead(qb + eb.yyx) + eb.yxy * sdBead(qb + eb.yxy) + eb.xxx * sdBead(qb + eb.xxx));
    vec3 hb = normalize(normalize(uKeyP - qb) - db0);
    em += vec3(1.0, 0.99, 0.95) * 0.5 * pow(max(dot(nb, hb), 0.0), 26.0) + uLight * 0.35 * pow(1.0 - max(dot(nb, -db0), 0.0), 3.0) * e;
  }
  return res * (1.0 - 0.92 * e) + em;
}
vec3 shadeGlass(vec3 p, vec3 n, vec3 rd, vec2 ws, float ign){
  float f = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 refl = envW(p, reflect(rd, n));
  vec3 col = through(p - n * 0.004, refract(rd, n, 1.0 / 1.5), ws, ign);
  if (n.z > 0.9) {
    // the lettering: black enamel fired onto the front face
    float m = smoothstep(0.3, 0.62, lab(p.xy, -0.4));
    col = mix(col, vec3(0.012, 0.013, 0.018), m);
  }
  // the polished rim pipes the bead's light round the edge, strongest beside it
  vec3 pb = p - beadC(p);
  col += uLight * uBead.w * 0.34 * (1.0 - n.z * n.z) / (1.0 + dot(pb.xy, pb.xy) / 0.35);
  return col * (1.0 - f) + refl * f;
}
vec3 shadeMetal(vec3 p, vec3 n, vec3 rd){
  vec3 q = vec3(p.x - sign(p.x) * CX, p.y, p.z); float r = length(q.xy);
  vec3 f0 = vec3(0.64, 0.65, 0.67);
  vec3 col;
  if (n.z > 0.92) {
    // the cap face is turned on a lathe: the grooves pull the softbox out into two fans
    vec3 tg = normalize(vec3(-q.y, q.x, 0.0) + 1e-5);
    vec3 nn = normalize(n + vec3(q.xy / max(r, 1e-3), 0.0) * (n2(vec2(r * 900.0, 3.0)) - 0.5) * 0.12);
    vec3 h = normalize(uKey - rd); float an = dot(tg, h);
    float fan = exp(-an * an / 0.035) * pow(max(dot(nn, h), 0.0), 6.0);
    vec3 h2 = normalize(normalize(vec3(0.74 + uSoft, 0.5, 0.62)) - rd); float an2 = dot(tg, h2);
    float fan2 = exp(-an2 * an2 / 0.06) * pow(max(dot(nn, h2), 0.0), 4.0);
    col = f0 * (env(reflect(rd, nn)) * 0.5 + KEYC * 2.6 * fan + vec3(0.9, 0.95, 1.0) * 0.9 * fan2 + 0.16);
    // a hex socket in the middle
    vec2 hq = abs(q.xy); float hex = max(hq.x * 0.866 + hq.y * 0.5, hq.y) - 0.05;
    col *= mix(0.12, 1.0, smoothstep(-0.006, 0.006, hex));
    col *= 1.0 - 0.3 * exp(-pow((r - 0.118) / 0.008, 2.0));
  } else {
    vec3 rr = reflect(rd, n);
    col = f0 * (envW(p, rr) * 0.9 + 0.05) + (1.0 - f0) * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0) * env(rr);
    col *= 0.45 + 0.55 * smoothstep(0.0, 0.06, sdGlass(p) + 0.01);
  }
  // the bead is close enough to warm the near cap
  vec3 pb = p - beadC(p);
  col += f0 * uLight * uBead.w * 0.1 / (0.25 + dot(pb, pb));
  return col;
}
vec2 bound(vec3 ro, vec3 rd){
  vec3 inv = 1.0 / (rd + vec3(1e-6)); vec3 lo = (vec3(-3.72, -0.62, -G) - ro) * inv; vec3 hi = (vec3(3.72, 0.62, T2 + 0.1) - ro) * inv;
  vec3 a = min(lo, hi); vec3 b = max(lo, hi);
  return vec2(max(max(a.x, a.y), max(a.z, 0.0)), min(b.x, min(b.y, b.z)));
}
float march(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 64; i++) { float d = map(ro + rd * t); if (d < 0.0007) return t; t += d * 0.92; if (t > tb.y) break; }
  return -1.0;
}
void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))); vec3 up = cross(rt, fw);
  vec3 rd0 = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  // the lens is tilted so its plane of focus lies along the front of the glass
  vec3 fp = ro + rd0 * ((T2 - ro.z) / rd0.z);
  ro += rt * uJit.z + up * uJit.w; vec3 rd = normalize(fp - ro);
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uSeed);
  float tw = (-G - ro.z) / rd.z;
  vec2 ws = ro.xy + rd.xy * tw;
  float t = march(ro, rd);
  vec3 col;
  if (t > 0.0 && t < tw) {
    vec3 p = ro + rd * t;
    if (sdMetal(p) < sdGlass(p)) col = shadeMetal(p, metalN(p), rd);
    else col = shadeGlass(p, glassN(p), rd, ws, ign);
  } else {
    // the bare page: further from the plane of focus it goes softer, and while it runs it smears along its travel
    float bias = uDof;
    vec3 a = vec3(0.0);
    for (int i = 0; i < 5; i++) a += page(ws + vec2((float(i) + ign - 2.5) / 5.0 * uBlur, 0.0), bias);
    col = a / 5.0 * wallLight(ws, 0.1);
  }
  col = min(col, vec3(24.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// The print: a little bloom off the bead and the softbox, the film curve, a corner falloff, grain.
const POST = `
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain; uniform vec2 uCentre;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uAcc, uv).rgb;
  vec2 px = 1.0 / uRes;
  vec3 nb = texture2D(uAcc, uv + vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv - vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv + vec2(0.0, px.y)).rgb + texture2D(uAcc, uv - vec2(0.0, px.y)).rgb;
  c = max(c + (c - nb * 0.25) * 0.4, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 24; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 24.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.034 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.15, 0.0), vec3(8.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.005;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.26 * smoothstep(0.35, 1.25, length(q));
  c = tone(c);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.018;
  outC = vec4(c, 1.0);
}
`;

type Box = { left: number; top: number; width: number; height: number };

export default function RayMarchedFrostedGlassPillNavbar() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(START);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [boxes, setBoxes] = useState<Box[]>([]);
  const activeRef = useRef(START);
  const api = useRef<{ go: (i: number, fromUser: boolean) => void; hover: (i: number) => void } | null>(null);

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
    const still = reduce || software; // nothing drifts: draw, refine, rest

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
    const names = ["uRes", "uJit", "uSeed", "uDirect", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uDof", "uKey", "uKeyP", "uSoft", "uLight", "uBead", "uHov", "uRect", "uOff", "uBlur", "uFrost", "uFrostLod", "uA", "uB", "uLab"];
    const su = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, gl.getUniformLocation(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const makeTex = (unit: number) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    };
    const upload = (unit: number, t: WebGLTexture | null, src: HTMLCanvasElement) => {
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.generateMipmap(gl.TEXTURE_2D);
    };
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");

    // The lettering, laid out once in bar heights: equal gaps between words, whatever their lengths.
    const labCv = document.createElement("canvas");
    labCv.width = 2048; labCv.height = Math.round(2048 / (HALF * 2)); // 7.2 : 1, the face of the pill
    const lg = labCv.getContext("2d");
    const upx = labCv.width / (HALF * 2);
    const centres: number[] = [], halves: number[] = [];
    if (lg) {
      let size = 0.27;
      const span = 5.0;
      const measure = () => { lg.font = `600 ${size * upx}px ${FONT}`; return pages.map((p) => lg.measureText(p.label).width / upx); };
      let ws = measure();
      const total = () => ws.reduce((a, b) => a + b, 0);
      if (total() > span - 0.3 * (pages.length - 1)) { size *= (span - 0.3 * (pages.length - 1)) / total(); ws = measure(); }
      const gap = (span - total()) / Math.max(1, pages.length - 1);
      let x = -span / 2;
      lg.fillStyle = "#000"; lg.fillRect(0, 0, labCv.width, labCv.height);
      lg.fillStyle = "#fff"; lg.textAlign = "center"; lg.textBaseline = "alphabetic";
      ws.forEach((w, i) => {
        centres.push(x + w / 2); halves.push(w / 2 + 0.2);
        lg.fillText(pages[i].label, (x + w / 2 + HALF) * upx, labCv.height / 2 + size * upx * 0.355);
        x += w + gap;
      });
    }
    const texLab = makeTex(2); upload(2, texLab, labCv);
    let texA = makeTex(0), texB = makeTex(1);
    if (aniso) for (const u of [0, 1]) { gl.activeTexture(gl.TEXTURE0 + u); gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4); }

    const imgs = pages.map(() => null as HTMLImageElement | null);
    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const rect = { x: -8, y: -5, w: 16, h: 8 };
    let texW = 2048, texH = 1024;
    const c0 = centres[START] ?? 0, h0 = halves[START] ?? 0.6;
    const s = {
      idx: START, page: START, next: -1, sliding: false, slide: 0, slideV: 0, sdir: 1, sel: 0,
      a: c0 - h0, b: c0 + h0, av: 0, bv: 0, dir: 1, from: c0, arrived: true, flare: 0, glow: 1,
      hov: -1, hovS: 0, hovX: 0, px: 0, py: 0, sx: 0, sy: 0, soft: 0,
      count: 0, fresh: true, frame: 0, slow: 0, visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, demoDir: 1, first: true, resizeT: 0,
    };

    // the lens: a long one, standing off to the left and a little below, so the far end of the pill recedes
    const view = (sx: number, sy: number) => {
      const aspect = cssW / cssH;
      const yaw = aspect < 1 ? YAW * 0.55 : YAW;
      const dist = 11.5, az = yaw + sx * 0.04, el = -0.105 + sy * 0.03;
      const cam = [-dist * Math.sin(az) * Math.cos(el), dist * Math.sin(el), dist * Math.cos(az) * Math.cos(el)];
      const frac = Math.min((aspect < 1 ? 0.92 : 0.72) * aspect / Math.cos(yaw), 1.36); // how much of the frame height the pill's length takes
      const foc = (frac / (2 * HALF)) * dist * 1.0;
      const shift = [0, aspect > 1 ? 0.18 : 0.22];
      const n = Math.hypot(cam[0], cam[1], cam[2]);
      const fw = [-cam[0] / n, -cam[1] / n, -cam[2] / n];
      let rt = [fw[1] * 0 - fw[2] * 1, fw[2] * 0 - fw[0] * 0, fw[0] * 1 - fw[1] * 0];
      const rn = Math.hypot(rt[0], rt[1], rt[2]); rt = [rt[0] / rn, rt[1] / rn, rt[2] / rn];
      const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      // perspective makes the near end bigger, so slide the frame until the pill sits in the middle of it
      const ends = [-HALF, HALF].map((x) => { const d = [x - cam[0], -cam[1], -cam[2]]; return (foc * (d[0] * rt[0] + d[1] * rt[1] + d[2] * rt[2])) / (d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2]); });
      shift[0] = -(ends[0] + ends[1]) / 2;
      return { cam, fw, rt, up, foc, shift, dist, aspect };
    };
    const project = (v: ReturnType<typeof view>, p: number[]) => {
      const d = [p[0] - v.cam[0], p[1] - v.cam[1], p[2] - v.cam[2]];
      const z = d[0] * v.fw[0] + d[1] * v.fw[1] + d[2] * v.fw[2];
      const ux = (v.foc * (d[0] * v.rt[0] + d[1] * v.rt[1] + d[2] * v.rt[2])) / z + v.shift[0];
      const uy = (v.foc * (d[0] * v.up[0] + d[1] * v.up[1] + d[2] * v.up[2])) / z + v.shift[1];
      return [cssW / 2 + ux * cssH, cssH / 2 - uy * cssH];
    };
    const onWall = (v: ReturnType<typeof view>, ux: number, uy: number) => {
      const d = [0, 1, 2].map((k) => v.fw[k] * v.foc + v.rt[k] * (ux - v.shift[0]) + v.up[k] * (uy - v.shift[1]));
      const t = (-GAP - v.cam[2]) / d[2];
      return [v.cam[0] + d[0] * t, v.cam[1] + d[1] * t];
    };

    // One page: the photograph cropped to cover the wall, with its title printed on it in the page's own ink.
    const scratch = document.createElement("canvas");
    const paint = (i: number) => {
      const p = pages[i], im = imgs[i];
      scratch.width = texW; scratch.height = texH;
      const g = scratch.getContext("2d");
      if (!g) return scratch;
      const grad = g.createLinearGradient(0, 0, 0, texH);
      grad.addColorStop(0, p.back[0]); grad.addColorStop(1, p.back[1]);
      g.fillStyle = grad; g.fillRect(0, 0, texW, texH);
      g.imageSmoothingQuality = "high";
      if (im) {
        const k = Math.max(texW / im.naturalWidth, texH / im.naturalHeight);
        const dw = im.naturalWidth * k, dh = im.naturalHeight * k;
        g.save();
        if (p.flip) { g.translate(texW, 0); g.scale(-1, 1); }
        g.drawImage(im, (texW - dw) / 2, (texH - dh) / 2, dw, dh);
        g.restore();
      }
      const u = texW / rect.w;
      const X = (x: number) => (x - rect.x) * u, Y = (y: number) => (rect.y + rect.h - y) * u;
      const tall = rect.h > rect.w;
      const v = view(0, 0);
      const bottom = Math.max(onWall(v, 0, -0.5)[1], onWall(v, -0.5 * v.aspect, -0.5)[1]);
      // the type hangs from the same left margin as the line of small capitals at the top of the frame
      const margin = cssW >= 1024 ? 64 : cssW >= 640 ? 40 : 24;
      const left = onWall(v, margin / cssH - 0.5 * v.aspect, -0.28)[0] + 0.04, maxW = Math.min(2 * HALF - 0.4, onWall(v, 0.5 * v.aspect - margin / cssH, -0.28)[0] - left);
      const ctx = g as CanvasRenderingContext2D & { letterSpacing?: string };
      g.fillStyle = p.ink; g.textBaseline = "alphabetic"; g.textAlign = "left";
      // the title, as big as the pill is long if the word allows
      const small = tall ? 0.165 : 0.118;
      const deckSize = tall ? 0.36 : 0.265;
      // on a wide frame the type stands on the bottom margin and may only grow until its top line clears the pill
      const room = -0.86 - (bottom + 1.02) - small * 2.3;
      let fs = tall ? 1.86 : Math.max(0.9, Math.min(1.86, room / 0.74));
      ctx.letterSpacing = `${-0.05 * fs * u}px`;
      g.font = `700 ${fs * u}px ${FONT}`;
      const tw = g.measureText(p.title).width / u;
      if (tw > maxW) { fs *= maxW / tw; ctx.letterSpacing = `${-0.05 * fs * u}px`; g.font = `700 ${fs * u}px ${FONT}`; }
      // on a tall one it hangs just under that shadow and leaves the rest of the photograph alone
      const base = tall ? -1.95 - small * 2.3 - fs * 0.74 : bottom + 1.02;
      g.fillText(p.title, X(left - 0.075 * fs), Y(base));
      // a line of small capitals above it
      ctx.letterSpacing = `${0.3 * small * u}px`;
      g.font = `600 ${small * u}px ${FONT}`;
      const top = base + fs * 0.74 + small * 2.3;
      const num = `0${i + 1}`;
      g.fillText(num, X(left), Y(top));
      const nw = g.measureText(num).width / u;
      g.globalAlpha = 0.7;
      g.fillRect(X(left + nw + small * 0.9), Y(top + small * 0.36) - 0.5, small * 3.4 * u, Math.max(1.5, 0.012 * u));
      g.globalAlpha = 1;
      g.fillText(`0${pages.length}`, X(left + nw + small * 5.4), Y(top));
      g.fillText(p.place.toUpperCase(), X(left + nw + small * 5.4 + (g.measureText(`0${pages.length}`).width / u) + small * 2.6), Y(top));
      // the standfirst under it
      ctx.letterSpacing = "0px";
      g.font = `italic 400 ${deckSize * u}px ${SERIF}`;
      const words = p.deck.split(" "); const lines: string[] = []; let line = "";
      for (const w of words) { const t = line ? `${line} ${w}` : w; if (g.measureText(t).width / u > maxW && line) { lines.push(line); line = w; } else line = t; }
      lines.push(line);
      lines.forEach((l, k) => g.fillText(l, X(left), Y(base - deckSize * 1.75 - k * deckSize * 1.32)));
      return scratch;
    };
    const load = (i: number) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => {
        imgs[i] = im;
        if (i === s.page && !s.sliding) { upload(0, texA, paint(i)); s.count = 0; s.fresh = true; wake(); }
      };
      im.src = pages[i].src;
    };

    const layout = () => {
      const v = view(0, 0);
      // the page has to cover everything the lens can see of the wall, with a little to spare for the lean
      const cs = [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, y]) => onWall(v, x * v.aspect, y));
      let x0 = Math.min(...cs.map((c) => c[0])) - 0.7, x1 = Math.max(...cs.map((c) => c[0])) + 0.7;
      let y0 = Math.min(...cs.map((c) => c[1])) - 0.6, y1 = Math.max(...cs.map((c) => c[1])) + 0.6;
      const ratio = (x1 - x0) / (y1 - y0);
      const big = !!gl2 && !software && cssW >= 900;
      const shape = ratio > 1.4 ? [2, 1] : ratio < 0.72 ? [1, 2] : [1, 1];
      const unit = gl2 ? (big ? 1536 : 1024) : 1024;
      texW = shape[0] * unit; texH = shape[1] * unit;
      const want = texW / texH;
      if (ratio < want) { const w = (y1 - y0) * want, c = (x0 + x1) / 2; x0 = c - w / 2; x1 = c + w / 2; }
      else { const h = (x1 - x0) / want, c = (y0 + y1) / 2; y0 = c - h / 2; y1 = c + h / 2; }
      rect.x = x0; rect.y = y0; rect.w = x1 - x0; rect.h = y1 - y0;
      upload(0, texA, paint(s.page));
      if (s.sliding && s.next >= 0) upload(1, texB, paint(s.next)); else upload(1, texB, paint(s.page));
      // where each real link sits over its lettering
      setBoxes(centres.map((c, i) => {
        const pts = [[c - halves[i], -0.5], [c + halves[i], -0.5], [c - halves[i], 0.5], [c + halves[i], 0.5]].map(([x, y]) => project(v, [x, y, T2]));
        const l = Math.min(...pts.map((q) => q[0])), r = Math.max(...pts.map((q) => q[0]));
        const t = Math.min(...pts.map((q) => q[1])), b = Math.max(...pts.map((q) => q[1]));
        const hh = Math.max(40, (b - t) * 0.6);
        return { left: l, top: (t + b) / 2 - hh / 2, width: r - l, height: hh };
      }));
      s.count = 0; s.fresh = true;
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      const changed = Math.abs(r.width - cssW) > 0.5 || Math.abs(r.height - cssH) > 0.5;
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      // never more than about a million and a half pixels of ray marching
      const k = Math.min(1, Math.sqrt(1.5e6 / (cssW * cssH * dpr * dpr)));
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

    const draw = (alpha: number, sample: number) => {
      const v = view(s.sx, s.sy);
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.075 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texA);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texB);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform3f(su.uCam, v.cam[0], v.cam[1], v.cam[2]); gl.uniform3f(su.uTgt, 0, 0, 0);
      gl.uniform1f(su.uFoc, v.foc); gl.uniform2f(su.uShift, v.shift[0], v.shift[1]);
      gl.uniform1f(su.uFocus, v.dist); gl.uniform1f(su.uDof, 0.35);
      const kl = Math.hypot(-0.52, 0.8, 0.72);
      gl.uniform3f(su.uKey, -0.52 / kl, 0.8 / kl, 0.72 / kl);
      gl.uniform3f(su.uKeyP, (-0.52 / kl) * 10.5 - 1.2, (0.8 / kl) * 10.5, (0.72 / kl) * 10.5);
      gl.uniform1f(su.uSoft, s.soft);
      gl.uniform3f(su.uLight, LIGHT[0], LIGHT[1], LIGHT[2]);
      const len = Math.max(0.3, s.b - s.a), rest = 2 * (halves[s.idx] ?? 0.6);
      const rad = 0.275 * Math.min(1.14, Math.max(0.52, Math.sqrt(rest / len)));
      gl.uniform4f(su.uBead, s.a, s.b, Math.min(rad, len / 2), GLOW * s.glow);
      gl.uniform2f(su.uHov, s.hovX, s.hovS);
      gl.uniform4f(su.uRect, rect.x, rect.y, rect.w, rect.h);
      const run = rect.w + SEAM;
      const offA = s.sliding ? -s.sdir * s.slide * run : 0;
      gl.uniform2f(su.uOff, offA, s.sliding ? offA + s.sdir * run : 1e4);
      gl.uniform1f(su.uBlur, s.sliding ? Math.min(1.6, Math.abs(s.slideV) * run / 70) : 0);
      gl.uniform1f(su.uFrost, FROST);
      gl.uniform1f(su.uFrostLod, Math.max(0, Math.log2((FROST * texW) / rect.w / 2.6)));
      gl.uniform1i(su.uA, 0); gl.uniform1i(su.uB, 1); gl.uniform1i(su.uLab, 2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 3); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, 0.5, 0.5 + v.shift[1] * 0.6);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const go = (i: number, fromUser: boolean) => {
      if (fromUser) s.touched = true;
      if (i === s.idx || i < 0 || i >= pages.length) return;
      s.dir = i > s.idx ? 1 : -1; s.from = s.dir > 0 ? s.b : s.a;
      s.idx = i; s.sel = performance.now(); s.arrived = false;
      if (i !== activeRef.current) { activeRef.current = i; setActive(i); }
      if (reduce) {
        s.a = centres[i] - halves[i]; s.b = centres[i] + halves[i]; s.av = 0; s.bv = 0; s.arrived = true;
        s.page = i; s.sliding = false; upload(0, texA, paint(i)); s.count = 0; s.fresh = true;
      }
      wake();
    };
    const hover = (i: number) => { s.hov = i; if (i >= 0 && s.hovS < 0.02) s.hovX = centres[i]; wake(); };
    api.current = { go, hover };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 3800; }

      // the self-running demo: it opens settled, holds, then walks the links until someone touches it
      if (!still && !s.touched && now > s.demoAt) {
        if (s.idx + s.demoDir >= pages.length || s.idx + s.demoDir < 0) s.demoDir *= -1;
        go(s.idx + s.demoDir, false);
        s.demoAt = now + 3300;
      }

      let moving = false, fast = false;
      if (!reduce) {
        const ta = centres[s.idx] - halves[s.idx], tb = centres[s.idx] + halves[s.idx];
        const since = (now - s.sel) / 1000;
        // the leading end draws back a hair, then goes; the trailing end lets go late and has to catch up
        const wind = !s.arrived && since < 0.085;
        const steps = 4, h = dt / steps;
        const right = s.dir > 0;
        let lp = right ? s.b : s.a, lv = right ? s.bv : s.av, tp = right ? s.a : s.b, tv = right ? s.av : s.bv;
        const lt0 = wind ? s.from - s.dir * 0.11 : right ? tb : ta, tt0 = right ? ta : tb;
        for (let k = 0; k < steps; k++) {
          lv += ((wind ? 900 : 215) * (lt0 - lp) - (wind ? 46 : 19.5) * lv) * h; lp += lv * h;
          if (!wind && (s.arrived || since > 0.13)) { tv += (185 * (tt0 - tp) - 17 * tv) * h; tp += tv * h; }
        }
        if (right) { s.b = lp; s.bv = lv; s.a = tp; s.av = tv; } else { s.a = lp; s.av = lv; s.b = tp; s.bv = tv; }
        if (s.b - s.a < 0.34) { const m = (s.a + s.b) / 2; s.a = m - 0.17; s.b = m + 0.17; }
        const lead = s.dir > 0 ? s.b : s.a, lt = s.dir > 0 ? tb : ta;
        if (!s.arrived && since > 0.1 && Math.abs(lead - lt) < 0.07) { s.arrived = true; s.flare = 1; }
        const err = Math.abs(s.a - ta) + Math.abs(s.b - tb) + Math.abs(s.av) * 0.05 + Math.abs(s.bv) * 0.05;
        if (err > 0.0015 || !s.arrived) moving = true; else { s.a = ta; s.b = tb; s.av = 0; s.bv = 0; }
        if (Math.abs(s.av) + Math.abs(s.bv) > 0.5) fast = true;
        if (s.flare > 0.004) { s.flare *= Math.exp(-dt * 6.5); moving = true; } else s.flare = 0;
        const stretch = Math.max(0, (s.b - s.a) / (2 * halves[s.idx]) - 1);
        s.glow = 1 + 0.7 * s.flare + 0.12 * Math.min(1, stretch);

        // the page: the old sheet runs off, the new one follows it in and settles with the smallest overrun
        if (!s.sliding && s.page !== s.idx && since > 0.09) {
          s.next = s.idx; s.sdir = s.next > s.page ? 1 : -1; s.sliding = true; s.slide = 0; s.slideV = 0;
          upload(1, texB, paint(s.next));
        }
        if (s.sliding) {
          for (let k = 0; k < 4; k++) { s.slideV += (34 * (1 - s.slide) - 9.6 * s.slideV) * (dt / 4); s.slide += s.slideV * (dt / 4); }
          moving = true; if (Math.abs(s.slideV) > 0.004) fast = true;
          if (Math.abs(1 - s.slide) < 0.0006 && Math.abs(s.slideV) < 0.01) {
            const t = texA; texA = texB; texB = t;
            s.page = s.next; s.sliding = false; s.slide = 0; s.slideV = 0; s.count = 0;
          }
        }
        const hs = (s.hov >= 0 && s.hov !== s.idx ? 1 : 0) - s.hovS;
        if (s.hov >= 0) s.hovX += (centres[s.hov] - s.hovX) * (1 - Math.exp(-dt * 16));
        if (Math.abs(hs) > 0.004) { s.hovS += hs * (1 - Math.exp(-dt * 9)); moving = true; } else if (s.hov < 0) s.hovS = 0;
      }
      if (!still) {
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        s.soft = Math.sin(((now - s.t0) / 1000) * 0.42 + 0.6) * 0.16 + s.sx * 0.1;
        moving = true;
      }

      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(fast ? 0.72 : still ? 0.5 : 0.12, 1 + (s.frame % 64)); s.count = still ? 1 : 6; }
      else if (s.count < 48) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      // measured, not guessed: if frames run long for a while, give up some resolution
      if (!still && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 45 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 48 || (!still && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    pages.forEach((_, i) => load(i));
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
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
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      cv.removeEventListener("webglcontextlost", lost);
      imgs.forEach((im) => { if (im) im.onload = null; });
      api.current = null;
    };
  }, []);

  const pick = (i: number) => {
    if (api.current) api.current.go(i, true);
    else if (i !== activeRef.current) { activeRef.current = i; setActive(i); }
  };

  const still = shown === "still";
  const page = pages[active];

  return (
    <section className="relative isolate overflow-hidden bg-[#0a7bdc] text-white" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes ray-marched-frosted-glass-pill-navbar-rise { from { opacity: 0; transform: translateY(0.1em); filter: blur(10px); } to { opacity: 1; transform: none; filter: blur(0); } }
        .ray-marched-frosted-glass-pill-navbar-word { animation: ray-marched-frosted-glass-pill-navbar-rise 520ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .ray-marched-frosted-glass-pill-navbar-word { animation: none; } }
      `}</style>
      <div ref={stage} className="relative h-[720px] w-full lg:h-[760px]" style={{ background: `linear-gradient(${page.back[0]}, ${page.back[1]})` }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />

        {still && (
          <div className="absolute inset-0">
            {pages.map((p, i) => (
              <img key={p.src} src={p.src} alt={i === active ? p.alt : ""} aria-hidden={i === active ? undefined : true} width={1600} height={1067} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${i === active ? "opacity-100" : "opacity-0"}`} style={{ transform: p.flip ? "scaleX(-1)" : undefined, backgroundColor: p.back[0] }} />
            ))}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/25 to-transparent" />
            <div className="absolute inset-x-6 bottom-12 sm:inset-x-10 lg:inset-x-auto lg:bottom-16 lg:left-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: page.ink }}>0{active + 1} <span className="mx-2 inline-block h-px w-10 bg-current align-middle opacity-70" /> 0{pages.length} <span className="ml-3">{page.place}</span></p>
              <p key={page.title} className="ray-marched-frosted-glass-pill-navbar-word mt-3 text-[84px] font-bold leading-[0.86] tracking-[-0.05em] sm:text-[140px] lg:text-[200px]" style={{ color: page.ink }}>{page.title}</p>
              <p className="mt-4 max-w-[30rem] text-[19px] italic leading-snug lg:text-[26px]" style={{ color: page.ink, fontFamily: SERIF }}>{page.deck}</p>
            </div>
          </div>
        )}

        <p className="pointer-events-none absolute left-6 top-7 text-[11px] font-semibold uppercase tracking-[0.34em] text-white sm:left-10 lg:left-16 lg:top-12">{BRAND} <span className="hidden sm:inline"><span className="mx-2 text-white/50">/</span> painted streets of the coast</span></p>

        <nav aria-label="Sections" className={still ? "absolute left-1/2 top-[30%] w-[min(94%,760px)] -translate-x-1/2 rounded-full border border-white/60 bg-white/35 p-1.5 shadow-[0_34px_50px_-18px_rgba(8,20,60,0.55),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-10px_18px_rgba(255,255,255,0.18)] backdrop-blur-xl lg:top-[34%]" : "absolute inset-0"}>
          <ul className={still ? "flex items-stretch justify-between" : ""}>
            {pages.map((p, i) => (
              <li key={p.label} className={still ? "flex-1" : ""}>
                <a
                  href="#"
                  aria-current={i === active ? "page" : undefined}
                  onClick={(e) => { e.preventDefault(); pick(i); }}
                  onPointerEnter={() => api.current?.hover(i)}
                  onPointerLeave={() => api.current?.hover(-1)}
                  onFocus={() => api.current?.hover(i)}
                  onBlur={() => api.current?.hover(-1)}
                  className={still
                    ? `flex h-12 items-center justify-center rounded-full text-[13px] font-semibold tracking-[-0.01em] text-[#0b0c12] outline-none transition-[background-color,box-shadow] duration-300 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-[#0b0c12] sm:h-16 sm:text-[17px] ${i === active ? "bg-[#d6ff7a] shadow-[0_0_34px_6px_rgba(200,255,90,0.8),inset_0_0_14px_rgba(255,255,255,0.9)]" : "hover:bg-white/40"}`
                    : "absolute block rounded-full text-[15px] text-transparent outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"}
                  style={still ? undefined : boxes[i] ? { left: boxes[i].left, top: boxes[i].top, width: boxes[i].width, height: boxes[i].height } : { left: `${10 + i * 16}%`, top: "30%", width: "14%", height: 48 }}
                >
                  {p.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p aria-live="polite" className="sr-only">{page.title}. {page.deck}</p>
      </div>
    </section>
  );
}
