import { useEffect, useRef, useState } from "react";

// The print on the wall. `title` is lettered across the bottom of it, as large as the frame allows.
const print = {
  kicker: "Portfolio 12",
  issue: "The coat issue",
  title: "Soft Armour",
  src: "https://images.pexels.com/photos/8004315/pexels-photo-8004315.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "A woman in an oversized pink trench coat with her hands on her hips against a deep blue backdrop",
  back: ["#1c4474", "#17365e"],
};
// The words on the glass.
const dialog = {
  trigger: "Reserve a print",
  eyebrow: "Plate 04 / Edition of 60",
  title: "Take this one home?",
  body: "Printed on cotton rag at 50 by 70 cm, numbered in pencil and posted flat between two boards.",
  cancel: "Keep looking",
  confirm: "Reserve a print",
  done: "Plate 04 is being held in your name.",
};
const TINT: [number, number, number] = [2.7, 2.45, 2.15]; // how much red, green and blue the glass swallows per unit of depth
const FROST = 0.21; // how far the etched back face smears the wall, in sheet heights
const ACCENT: [number, number, number] = [0.92, 0.2, 0.4]; // the dot of enamel beside the small capitals (linear RGB)
const YAW = 0.25; // radians the lens stands off to the left
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

// Measured in half sheet heights: the wall is G behind the wires, the glass is 2 * T2 thick.
const G = 1.15, T2 = 0.1, DIST = 9.5, U = 200;

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 curve(vec3 x){ return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 tone(vec3 x){ x *= 0.95; float m = max(max(x.r, x.g), max(x.b, 1e-4)); vec3 h = x * (curve(vec3(m)).r / m); return pow(mix(curve(x), h, 0.45), vec3(1.0 / 2.2)); }
`;

// One exposure: a printed wall, a slab of smoked glass hanging in front of it on two wires, a softbox up and to the left.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uDirect;
uniform vec3 uCam; uniform float uFoc; uniform vec2 uShift; uniform float uFocusZ;
uniform vec3 uKey; uniform float uSoft; uniform float uOn;
uniform vec3 uPos; uniform mat3 uRot; uniform vec2 uRoll; uniform float uYawC; uniform vec2 uHalf; uniform float uCx;
uniform vec4 uRect; uniform float uWB; uniform float uWLod; uniform float uWallDim; uniform float uFrost; uniform float uFrostLod;
uniform vec3 uTint; uniform vec3 uAccent; uniform vec4 uHov; uniform float uHovS;
uniform sampler2D uA; uniform sampler2D uLab;
const float G = ${G.toFixed(2)}; const float T2 = ${T2.toFixed(2)}; const float CR = 0.12; const float RIM = 0.022; const float MARGIN = 0.085; const float WR = 0.0075;
const vec3 KEYC = vec3(1.0, 0.955, 0.9);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float sdRR(vec2 p, vec2 h, float r){ vec2 d = abs(p) - h + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r; }
float sdGlass(vec3 p){ vec2 w = vec2(sdRR(p.xy, uHalf, CR), abs(p.z) - T2) + RIM; return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - RIM; }
// the fixings: a steel block that bites the top edge of the glass, and the ferrule its wire runs into
float sdMetal(vec3 p){
  vec3 q = vec3(abs(p.x) - uCx, p.y - uHalf.y, p.z);
  vec3 b = abs(q) - vec3(0.062, 0.11, T2 + 0.045) + 0.014;
  float blk = length(max(b, 0.0)) + min(max(b.x, max(b.y, b.z)), 0.0) - 0.014;
  vec2 c = vec2(length(q.xz) - 0.027, abs(q.y - 0.15) - 0.05) + 0.006;
  float fer = min(max(c.x, c.y), 0.0) + length(max(c, 0.0)) - 0.006;
  return min(blk, fer);
}
float map(vec3 p){ return min(sdGlass(p), sdMetal(p)); }
vec3 lab(vec2 p, float bias){
  vec2 uv = vec2((p.x + uHalf.x) / (2.0 * uHalf.x), (uHalf.y - p.y) / (2.0 * uHalf.y));
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec3(0.0);
  return texture2D(uLab, uv, bias).rgb;
}
vec3 page(vec2 w, float bias){
  vec2 uv = vec2((w.x - uRect.x) / uRect.z, 1.0 - (w.y - uRect.y) / uRect.w);
  vec3 c = texture2D(uA, clamp(uv, 0.0, 1.0), bias).rgb;
  return c * c * (0.5 + 0.5 * c);
}
// What lands on the wall: the key, less what the glass, its two fixings and the wires keep for themselves.
vec3 wallLight(vec2 w, float pen){
  float gz = G + uPos.z;
  vec2 p = w + uKey.xy / uKey.z * gz - uPos.xy;
  p = vec2(p.x * uRoll.x + p.y * uRoll.y, p.y * uRoll.x - p.x * uRoll.y);
  p.x /= uYawC;
  float pn = pen + 0.1 * gz;
  float s = sdRR(p, uHalf, CR);
  float sh = smoothstep(pn, -pn, s);
  float lit = 1.0 - uOn * sh * (0.55 + 0.1 * smoothstep(-0.5, -0.05, s));
  // the polished edge gathers the light it turned aside into one faint bright thread just outside the shadow
  lit += uOn * 0.05 * exp(-pow((s - pn * 1.25) / 0.06, 2.0));
  vec2 q = vec2(abs(p.x) - uCx, p.y - uHalf.y);
  vec2 bd = abs(q - vec2(0.0, 0.03)) - vec2(0.06, 0.14);
  float blk = length(max(bd, 0.0)) + min(max(bd.x, bd.y), 0.0);
  lit *= 1.0 - uOn * 0.42 * smoothstep(pn * 0.8, -pn * 0.8, blk);
  lit *= 1.0 - uOn * 0.085 * smoothstep(pn * 0.55, 0.0, abs(q.x)) * step(0.1, q.y);
  float pool = mix(0.5, 1.0, smoothstep(8.5, 0.8, length(w - vec2(-0.9, 0.7))));
  return KEYC * 1.22 * lit * pool * uWallDim + vec3(0.05, 0.056, 0.07) * uWallDim;
}
float lbox(vec3 rd, vec3 n, vec2 hs, float soft, float turn){
  float dn = dot(rd, n); if (dn < 0.05) return 0.0;
  vec3 u = normalize(cross(vec3(0.0, 1.0, 0.0), n)); vec3 v = cross(n, u);
  vec2 q = vec2(dot(rd, u), dot(rd, v)) / dn; q = vec2(q.x * cos(turn) - q.y * sin(turn), q.x * sin(turn) + q.y * cos(turn));
  vec2 d = abs(q) - hs; float e = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  return smoothstep(soft, -soft, e);
}
// The room behind the lens: dark, with the key, one tall scrim near the lens whose slanted edge lies across the glass, and a strip overhead.
vec3 env(vec3 rd){
  vec3 c = mix(vec3(0.022, 0.024, 0.03), vec3(0.13, 0.135, 0.15), smoothstep(-0.5, 0.7, rd.y));
  c += KEYC * 20.0 * lbox(rd, uKey, vec2(0.3, 0.24), 0.05, 0.15);
  c += vec3(0.9, 0.95, 1.0) * 2.6 * lbox(rd, normalize(vec3(0.52 + uSoft, 0.1, 0.85)), vec2(0.15, 0.9), 0.07, 0.38);
  // a broad scrim just beside the lens: the front face carries it as one long soft sheen with a slanted edge
  c += vec3(0.92, 0.95, 1.0) * 3.2 * lbox(rd, normalize(vec3(-0.12 + uSoft, 0.16, 0.98)), vec2(0.34, 1.4), 0.22, 0.42);
  if (rd.y > 0.05) { vec2 q = rd.xz / rd.y; c += vec3(1.0, 0.98, 0.95) * 13.0 * smoothstep(0.05, -0.05, abs(q.y - 0.25 - uSoft * 0.5) - 0.2) * smoothstep(0.3, -0.3, abs(q.x) - 1.6); }
  c += vec3(1.0, 0.9, 0.86) * 1.4 * lbox(rd, normalize(vec3(-0.5, -0.5, 0.7)), vec2(0.5, 0.14), 0.1, 0.0);
  return c;
}
vec3 glassN(vec3 p){
  vec2 e = vec2(0.0012, -0.0012);
  return normalize(e.xyy * sdGlass(p + e.xyy) + e.yyx * sdGlass(p + e.yyx) + e.yxy * sdGlass(p + e.yxy) + e.xxx * sdGlass(p + e.xxx));
}
vec3 metalN(vec3 p){
  vec2 e = vec2(0.0012, -0.0012);
  return normalize(e.xyy * sdMetal(p + e.xyy) + e.yyx * sdMetal(p + e.yyx) + e.yxy * sdMetal(p + e.yxy) + e.xxx * sdMetal(p + e.xxx));
}
float pill(vec2 p, vec4 r){ vec2 d = abs(p - r.xy) - r.zw + r.w; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r.w; }
// Out through the etched back face. The wall is more than a sheet-half behind it, so each grain of frost gathers a wide disc of the print.
vec3 frost(vec3 q, vec3 d, float ign){
  vec3 o = refract(d, vec3(0.0, 0.0, 1.0), 1.5); if (dot(o, o) < 0.5) o = d;
  vec3 qw = uPos + uRot * q; vec3 ow = uRot * o; ow.z = min(ow.z, -0.2);
  vec2 w0 = qw.xy + ow.xy * ((-G - qw.z) / ow.z);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float a = (float(i) + ign) * 2.39996; float r = sqrt((float(i) + 0.5) / 12.0);
    acc += page(w0 + r * vec2(cos(a), sin(a)) * uFrost, uFrostLod);
  }
  vec3 c = acc / 12.0 * wallLight(w0, 0.3);
  // scattering in the etch keeps the colour of the print and loses a little of its contrast
  c = max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, 1.5), 0.0) * 1.2;
  // the key comes in through the front face and whitens the frost, except in the lee of the lettering
  vec3 kl = uKey * uRot;
  vec3 lg = normalize(vec3(kl.xy / 1.5, sqrt(max(1.0 - dot(kl.xy, kl.xy) / 2.25, 0.05))));
  vec2 lp = q.xy + lg.xy / lg.z * (2.0 * T2);
  vec3 mk = lab(lp, 5.5);
  float ls = clamp(mk.r + 0.8 * mk.b + mk.g, 0.0, 1.0);
  float tooth = 0.9 + 0.2 * n2(q.xy * 230.0) + 0.08 * (n2(q.xy * 31.0) - 0.5);
  float veil = 0.15 * max(kl.z, 0.0) * (0.55 + 0.75 * exp(-dot(qw.xy - vec2(-1.3, 1.1), qw.xy - vec2(-1.3, 1.1)) / 3.2)) * (1.0 - 0.2 * ls) * tooth;
  // a control under the pointer or the focus ring takes a breath of extra light in the frost behind it
  float hp = pill(q.xy, uHov);
  veil += uHovS * (0.13 * smoothstep(0.012, -0.012, hp) + 0.12 * exp(-max(hp, 0.0) / 0.07)) * tooth;
  // the steel blocks are a dark blur at the top
  vec2 bq = vec2(abs(q.x) - uCx, q.y - uHalf.y);
  veil *= 1.0 - 0.5 * smoothstep(0.16, 0.03, length(max(abs(bq) - vec2(0.03, 0.09), 0.0)));
  c += KEYC * veil;
  return c * (0.96 + 0.08 * n2(q.xy * 300.0));
}
vec3 outside(vec3 q, vec3 o, vec2 ws){
  vec3 qw = uPos + uRot * q; vec3 ow = uRot * o;
  if (ow.z > -0.03) return min(env(ow), vec3(2.0));
  vec2 w = qw.xy + ow.xy * ((-G - qw.z) / ow.z);
  // blue bends further than red, so the three colours of the print come out of the edge a little apart
  vec2 dv = clamp(w - ws, -1.0, 1.0) * 0.05;
  vec3 c = vec3(page(w - dv, 0.6).r, page(w, 0.6).g, page(w + dv, 0.6).b);
  return c * wallLight(w, 0.08);
}
// The path inside the slab: up to three legs, bouncing off any face the ray meets too flat to leave by.
vec3 through(vec3 p, vec3 d, vec2 ws, float ign){
  vec3 res = vec3(0.03); float run = 0.0; vec3 q = p;
  for (int b = 0; b < 3; b++) {
    float t = 0.005; bool hit = false;
    for (int i = 0; i < 44; i++) {
      q = p + d * t;
      float dg = -sdGlass(q); if (dg < 0.001) { hit = true; break; }
      t += max(dg, 0.011);
    }
    run += t;
    if (!hit) { res = frost(vec3(q.xy, -T2), vec3(0.0, 0.0, -1.0), ign) * 0.7; break; }
    vec3 m = glassN(q);
    if (m.z < -0.8 && sdRR(q.xy, uHalf, CR) < -MARGIN) { res = frost(q, d, ign); break; }
    vec3 o = refract(d, -m, 1.5);
    if (dot(o, o) < 0.5) { d = reflect(d, -m); p = q - m * 0.004; continue; }
    float f = 0.04 + 0.96 * pow(1.0 - clamp(dot(o, m), 0.0, 1.0), 5.0);
    res = outside(q, o, ws) * (1.0 - f); break;
  }
  return res * exp(-run * uTint);
}
vec3 shadeGlass(vec3 p, vec3 n, vec3 rd, vec2 ws, float ign){
  float f = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 refl = env(uRot * reflect(rd, n));
  vec3 col = through(p - n * 0.004, refract(rd, n, 1.0 / 1.5), ws, ign);
  // where the steel bites, the glass sits in its shade
  col *= 0.55 + 0.45 * smoothstep(0.0, 0.07, sdMetal(p));
  col = col * (1.0 - f) + refl * f;
  // the polished top and left edges face the softbox and the strip overhead: one hard bright line along each
  float side = 1.0 - n.z * n.z;
  // (the lens stands low, so it is the rounded front bevel of those edges that it sees catching the light)
  float face = pow(max(dot(normalize(n.xy + 1e-5), normalize(vec2(-0.55, 0.83))), 0.0), 3.0);
  col += KEYC * 3.2 * face * smoothstep(0.06, 0.45, side) * (1.0 - smoothstep(0.85, 1.0, side) * 0.6);
  if (n.z > 0.9) {
    // the lettering: ceramic enamel fired onto the front face, white, a quieter grey for the running text, one dot of colour
    vec3 mk = lab(p.xy, -0.35);
    vec3 kl = uKey * uRot;
    vec3 lit = KEYC * 1.3 * max(kl.z, 0.0) + vec3(0.07, 0.075, 0.085);
    float gloss = 0.5 + 0.5 * n2(p.xy * 90.0);
    col = mix(col, vec3(0.9, 0.895, 0.88) * lit + refl * 0.035 * gloss, smoothstep(0.34, 0.62, mk.r));
    col = mix(col, vec3(0.62, 0.63, 0.65) * lit + refl * 0.03 * gloss, smoothstep(0.34, 0.62, mk.b));
    col = mix(col, uAccent * lit + refl * 0.04, smoothstep(0.34, 0.62, mk.g));
  }
  return col;
}
vec3 steel(vec3 n, vec3 rd, float rough){
  vec3 f0 = vec3(0.6, 0.61, 0.63);
  vec3 rr = reflect(rd, n);
  vec3 c = f0 * (env(uRot * rr) * 0.85 + 0.04);
  vec3 h = normalize(uKey * uRot - rd);
  c += f0 * KEYC * 1.6 * pow(max(dot(n, h), 0.0), rough);
  return c + (1.0 - f0) * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0) * 0.25;
}
vec3 shadeMetal(vec3 p, vec3 n, vec3 rd){
  vec3 q = vec3(abs(p.x) - uCx, p.y - uHalf.y, p.z);
  // brushed along its length
  vec3 nn = normalize(n + vec3(1.0, 0.0, 0.0) * (n2(vec2(p.x * 700.0, p.y * 14.0)) - 0.5) * 0.16 * (1.0 - abs(n.x)));
  vec3 c = steel(nn, rd, 22.0);
  if (n.z > 0.9) {
    // one socket screw in the front face
    vec2 hq = abs(q.xy - vec2(0.0, 0.035)); float hex = max(hq.x * 0.866 + hq.y * 0.5, hq.y) - 0.017;
    float ring = abs(length(q.xy - vec2(0.0, 0.035)) - 0.036);
    c *= mix(0.1, 1.0, smoothstep(-0.004, 0.004, hex));
    c *= 1.0 - 0.35 * exp(-pow(ring / 0.005, 2.0));
  }
  // darker where the block meets the glass and under the ferrule
  c *= 0.5 + 0.5 * smoothstep(0.0, 0.05, sdGlass(p) + 0.012);
  return c;
}
vec2 bound(vec3 ro, vec3 rd){
  vec3 inv = 1.0 / (rd + vec3(1e-6)); vec3 lo = (vec3(-uHalf.x - 0.02, -uHalf.y - 0.02, -T2 - 0.07) - ro) * inv; vec3 hi = (vec3(uHalf.x + 0.02, uHalf.y + 0.22, T2 + 0.07) - ro) * inv;
  vec3 a = min(lo, hi); vec3 b = max(lo, hi);
  return vec2(max(max(a.x, a.y), max(a.z, 0.0)), min(b.x, min(b.y, b.z)));
}
float march(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 56; i++) { float d = map(ro + rd * t); if (d < 0.0007) return t; t += d * 0.94; if (t > tb.y) break; }
  return -1.0;
}
// A wire is three pixels wide at most, so it is laid over the picture by how much of each pixel it covers.
vec4 wire(vec3 ro, vec3 rd, vec3 a, float sx, float tmax){
  vec3 b = vec3(sx * uCx, 18.0, 0.0); vec3 u = normalize(b - a);
  vec3 w0 = ro - a; float bb = dot(rd, u); float d0 = dot(rd, w0); float e = dot(u, w0); float den = max(1.0 - bb * bb, 1e-5);
  float t = (bb * e - d0) / den; float sa = (e - bb * d0) / den;
  if (t < 0.0 || t > tmax || sa < 0.0) return vec4(0.0);
  vec3 dv = ro + rd * t - (a + u * sa); float dist = length(dv);
  float pix = t / (uFoc * uRes.y);
  float cov = clamp((WR - dist) / pix + 0.5, 0.0, 1.0) * min(1.0, 2.0 * WR / pix + 0.25);
  if (cov <= 0.0) return vec4(0.0);
  vec3 side = dv / max(dist, 1e-6); float s = clamp(dist / WR, 0.0, 1.0);
  vec3 tow = normalize(rd - u * bb);
  vec3 n = normalize(side * s - tow * sqrt(1.0 - s * s));
  float sg = sign(dot(dv, cross(u, rd)));
  // seven strands laid in a twist: the highlight breaks into a rope of small lights
  float lay = 0.78 + 0.22 * sin(sa * 260.0 + sg * s * 3.4) * clamp(WR / pix - 0.5, 0.0, 1.0);
  vec3 f0 = vec3(0.6, 0.61, 0.63);
  vec3 c = f0 * (env(reflect(rd, n)) * 0.8 + 0.05) * lay + f0 * KEYC * 1.5 * pow(max(dot(n, normalize(uKey - rd)), 0.0), 14.0) * lay;
  return vec4(c, cov);
}
void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(-uCam); vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))); vec3 up = cross(rt, fw);
  vec3 rd0 = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  // a wide aperture: every sample leaves from a different point on the lens and meets the others in the plane of focus
  vec3 fp = ro + rd0 * ((uFocusZ - ro.z) / rd0.z);
  ro += rt * uJit.z + up * uJit.w; vec3 rd = normalize(fp - ro);
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uSeed);
  float tw = (-G - ro.z) / rd.z;
  vec2 ws = ro.xy + rd.xy * tw;
  vec3 col; float th = tw;
  float t = -1.0;
  vec3 lo = (ro - uPos) * uRot; vec3 ld = rd * uRot;
  if (uOn > 0.5) t = march(lo, ld);
  if (t > 0.0 && t < tw) {
    vec3 p = lo + ld * t; th = t;
    if (sdMetal(p) < sdGlass(p)) col = shadeMetal(p, metalN(p), ld);
    else col = shadeGlass(p, glassN(p), ld, ws, ign);
  } else {
    // the bare wall, as soft as its distance from the plane of focus makes it
    vec3 a = vec3(0.0);
    for (int i = 0; i < 12; i++) {
      float an = (float(i) + ign) * 2.39996; float r = sqrt((float(i) + 0.5) / 12.0);
      a += page(ws + r * vec2(cos(an), sin(an)) * uWB, uWLod);
    }
    col = a / 12.0 * wallLight(ws, 0.03 + uWB);
  }
  if (uOn > 0.5) {
    vec3 top = vec3(uCx, uHalf.y + 0.19, 0.0);
    vec4 w1 = wire(ro, rd, uPos + uRot * top, 1.0, th); col = mix(col, w1.rgb, w1.a);
    vec4 w2 = wire(ro, rd, uPos + uRot * (top * vec3(-1.0, 1.0, 1.0)), -1.0, th); col = mix(col, w2.rgb, w2.a);
  }
  col = min(col, vec3(24.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// The print from the negative: a little bloom off the hot edges, the film curve, darker corners, grain.
const POST = `
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uAcc, uv).rgb;
  vec2 px = 1.0 / uRes;
  vec3 nb = texture2D(uAcc, uv + vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv - vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv + vec2(0.0, px.y)).rgb + texture2D(uAcc, uv - vec2(0.0, px.y)).rgb;
  c = max(c + (c - nb * 0.25) * 0.35, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 20.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.03 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.2, 0.0), vec3(8.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.006;
  vec2 q = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.3 * smoothstep(0.3, 1.2, length(q));
  c = tone(c);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.02;
  outC = vec4(c, 1.0);
}
`;

type Box = { x: number; y: number; w: number; h: number }; // in sheet units, from the top left corner of the glass
type Plan = { hx: number; hy: number; eyebrow: Box; title: Box; body: Box; cancel: Box; confirm: Box; close: Box; titleSize: number; bodySize: number };

// Where everything sits on the glass. The same plan paints the enamel and places the real elements over it.
function planFor(hx: number, hy: number, measure: (text: string, font: string, track: number) => number): Plan & { titleLines: string[]; bodyLines: string[] } {
  const tall = hy > hx;
  const pad = tall ? 0.2 : 0.25;
  const inner = 2 * hx - 2 * pad;
  const wrap = (text: string, font: string, track: number, max: number) => {
    const out: string[] = []; let line = "";
    for (const w of text.split(" ")) { const t = line ? `${line} ${w}` : w; if (line && measure(t, font, track) > max) { out.push(line); line = w; } else line = t; }
    out.push(line); return out;
  };
  let titleSize = tall ? 0.3 : 0.31, titleLines: string[] = [];
  for (; titleSize > 0.12; titleSize -= 0.005) {
    titleLines = wrap(dialog.title, `700 ${titleSize}px ${FONT}`, -0.04 * titleSize, inner - (tall ? 0 : 0.1));
    if (titleLines.length <= (tall ? 2 : 1)) break;
  }
  const bodySize = tall ? 0.094 : 0.088;
  const bodyLines = wrap(dialog.body, `400 ${bodySize}px ${FONT}`, 0, Math.min(inner, 2.3));
  const eyebrowTop = pad + 0.01;
  const titleTop = eyebrowTop + 0.06 + (tall ? 0.2 : 0.17);
  const titleH = titleLines.length * titleSize * 1.02;
  const bodyTop = titleTop + titleH + (tall ? 0.1 : 0.08);
  const bodyH = bodyLines.length * bodySize * 1.48;
  const bh = tall ? 0.27 : 0.235, gap = 0.09;
  const font = `600 ${tall ? 0.086 : 0.082}px ${FONT}`;
  const by = 2 * hy - pad - bh;
  let cw = measure(dialog.confirm, font, 0) + 0.36, kw = measure(dialog.cancel, font, 0) + 0.36;
  if (tall) { cw = (inner - gap) / 2; kw = cw; }
  const confirm = { x: 2 * hx - pad - cw, y: by, w: cw, h: bh };
  const cancel = { x: confirm.x - gap - kw, y: by, w: kw, h: bh };
  return {
    hx, hy, titleSize, bodySize, titleLines, bodyLines,
    eyebrow: { x: pad, y: eyebrowTop, w: inner - 0.4, h: 0.07 },
    title: { x: pad, y: titleTop, w: inner, h: titleH },
    body: { x: pad, y: bodyTop, w: Math.min(inner, 2.3), h: bodyH },
    cancel, confirm,
    close: { x: 2 * hx - pad - 0.2 + 0.03, y: pad - 0.075, w: 0.2, h: 0.2 },
  };
}

export default function SmokedGlassDialogOnSteelWires() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sheet = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(true);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [note, setNote] = useState("");
  const byUser = useRef(false);
  const api = useRef<{ set: (open: boolean, fromUser: boolean) => void; hover: (b: Box | null) => void; push: (x: number, y: number) => void; matrix: string } | null>(null);

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
    const still = reduce || software; // nothing sways: draw, refine, rest

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
    const names = ["uRes", "uJit", "uSeed", "uDirect", "uCam", "uFoc", "uShift", "uFocusZ", "uKey", "uSoft", "uOn", "uPos", "uRot", "uRoll", "uYawC", "uHalf", "uCx", "uRect", "uWB", "uWLod", "uWallDim", "uFrost", "uFrostLod", "uTint", "uAccent", "uHov", "uHovS", "uA", "uLab"];
    const su = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain"].map((n) => [n, gl.getUniformLocation(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    const makeTex = (unit: number) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);
      return t;
    };
    const upload = (unit: number, t: WebGLTexture | null, src: HTMLCanvasElement) => {
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.generateMipmap(gl.TEXTURE_2D);
    };
    const texA = makeTex(0), texLab = makeTex(2);
    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;

    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1, hx = 1.5, hy = 1, cx = 1.08, up = 4;
    let photo: HTMLImageElement | null = null;
    let texW = 2048, texH = 1024;
    const rect = { x: -8, y: -5, w: 16, h: 8 };
    const s = {
      open: true, phase: "rest" as "rest" | "down" | "up" | "gone", pt: 0, landed: true,
      y: 0, yv: 0, yaw: 0, yawV: 0, roll: 0, rollV: 0, pitch: 0, pitchV: 0, sx: 0, sxV: 0, sz: 0, szV: 0, dim: 1,
      hov: null as Box | null, hovS: 0, hovR: [0, 0, 0.1, 0.1], px: 0, py: 0, lx: 0, ly: 0, soft: 0,
      count: 0, fresh: true, frame: 0, slow: 0, visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, first: true,
    };

    const view = (lx: number, ly: number) => {
      const aspect = cssW / cssH;
      const yaw = aspect < 0.8 ? YAW * 0.4 : YAW;
      const az = yaw + lx * 0.05, el = -0.07 + ly * 0.03;
      const cam = [-DIST * Math.sin(az) * Math.cos(el), DIST * Math.sin(el), DIST * Math.cos(az) * Math.cos(el)];
      const foc = Math.min((0.6 * DIST) / (2 * hy), (0.89 * aspect * DIST) / (2 * hx));
      const n = Math.hypot(cam[0], cam[1], cam[2]);
      const fw = [-cam[0] / n, -cam[1] / n, -cam[2] / n];
      let rt = [-fw[2], 0, fw[0]];
      const rn = Math.hypot(rt[0], rt[1], rt[2]); rt = [rt[0] / rn, rt[1] / rn, rt[2] / rn];
      const upv = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      // perspective makes the near end of the sheet bigger, so slide the frame until the glass sits in the middle of it
      const ends = [-hx, hx].map((x) => { const d = [x - cam[0], -cam[1], -cam[2]]; return (foc * (d[0] * rt[0] + d[1] * rt[1] + d[2] * rt[2])) / (d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2]); });
      const shift = [-(ends[0] + ends[1]) / 2, aspect < 0.8 ? 0.02 : 0.03];
      return { cam, fw, rt, up: upv, foc, shift, aspect };
    };
    type View = ReturnType<typeof view>;
    const project = (v: View, p: number[]) => {
      const d = [p[0] - v.cam[0], p[1] - v.cam[1], p[2] - v.cam[2]];
      const z = d[0] * v.fw[0] + d[1] * v.fw[1] + d[2] * v.fw[2];
      const ux = (v.foc * (d[0] * v.rt[0] + d[1] * v.rt[1] + d[2] * v.rt[2])) / z + v.shift[0];
      const uy = (v.foc * (d[0] * v.up[0] + d[1] * v.up[1] + d[2] * v.up[2])) / z + v.shift[1];
      return [cssW / 2 + ux * cssH, cssH / 2 - uy * cssH];
    };
    const onWall = (v: View, ux: number, uy: number) => {
      const d = [0, 1, 2].map((k) => v.fw[k] * v.foc + v.rt[k] * (ux - v.shift[0]) + v.up[k] * (uy - v.shift[1]));
      const t = (-G - v.cam[2]) / d[2];
      return [v.cam[0] + d[0] * t, v.cam[1] + d[1] * t];
    };
    // the sheet's turn: twist about the wires, then a nod, then one corner lower than the other
    const rot = () => {
      const cy = Math.cos(s.yaw), sy = Math.sin(s.yaw), cp = Math.cos(s.pitch), sp = Math.sin(s.pitch), cr = Math.cos(s.roll), sr = Math.sin(s.roll);
      // columns of Ry * Rx * Rz
      return [
        cy * cr + sy * sp * sr, cp * sr, -sy * cr + cy * sp * sr,
        -cy * sr + sy * sp * cr, cp * cr, sy * sr + cy * sp * cr,
        sy * cp, -sp, cy * cp,
      ];
    };
    const place = (m: number[], l: number[]) => [s.sx + m[0] * l[0] + m[3] * l[1] + m[6] * l[2], s.y + m[1] * l[0] + m[4] * l[1] + m[7] * l[2], s.sz + m[2] * l[0] + m[5] * l[1] + m[8] * l[2]];

    const scratch = document.createElement("canvas"), labCv = document.createElement("canvas");
    const ruler = document.createElement("canvas").getContext("2d");
    const measure = (text: string, font: string, track: number) => {
      if (!ruler) return text.length * 0.05;
      // sizes are given in sheet units: measure at 100 px to the unit
      ruler.font = font.replace(/([\d.]+)px/, (_, n) => `${Number(n) * 100}px`);
      return ruler.measureText(text).width / 100 + track * text.length;
    };
    // The enamel: white in the red channel, the quieter grey in blue, the dot of colour in green.
    const paintGlass = () => {
      const pl = planFor(hx, hy, measure);
      const u = 2048 / (2 * hx);
      labCv.width = 2048; labCv.height = Math.round(2 * hy * u);
      const g = labCv.getContext("2d") as (CanvasRenderingContext2D & { letterSpacing?: string }) | null;
      if (!g) return pl;
      g.fillStyle = "#000"; g.fillRect(0, 0, labCv.width, labCv.height);
      g.globalCompositeOperation = "lighter"; g.textBaseline = "alphabetic"; g.textAlign = "left";
      const RED = "#ff0000", BLUE = "#0000ff", GREEN = "#00ff00";
      const round = (b: Box) => { g.beginPath(); const r = b.h / 2; g.moveTo((b.x + r) * u, b.y * u); g.arcTo((b.x + b.w) * u, b.y * u, (b.x + b.w) * u, (b.y + b.h) * u, r * u); g.arcTo((b.x + b.w) * u, (b.y + b.h) * u, b.x * u, (b.y + b.h) * u, r * u); g.arcTo(b.x * u, (b.y + b.h) * u, b.x * u, b.y * u, r * u); g.arcTo(b.x * u, b.y * u, (b.x + b.w) * u, b.y * u, r * u); g.closePath(); };
      // small capitals with a dot of colour in front
      g.fillStyle = GREEN; g.beginPath(); g.arc((pl.eyebrow.x + 0.026) * u, (pl.eyebrow.y + 0.036) * u, 0.026 * u, 0, 7); g.fill();
      g.fillStyle = RED; g.letterSpacing = `${0.24 * 0.056 * u}px`; g.font = `600 ${0.056 * u}px ${FONT}`;
      g.fillText(dialog.eyebrow.toUpperCase(), (pl.eyebrow.x + 0.115) * u, (pl.eyebrow.y + 0.056) * u);
      // the question
      g.letterSpacing = `${-0.04 * pl.titleSize * u}px`; g.font = `700 ${pl.titleSize * u}px ${FONT}`;
      pl.titleLines.forEach((l, k) => g.fillText(l, (pl.title.x - 0.012 * pl.titleSize * 4) * u, (pl.title.y + pl.titleSize * 0.8 + k * pl.titleSize * 1.02) * u));
      // the running text
      g.fillStyle = BLUE; g.letterSpacing = "0px"; g.font = `400 ${pl.bodySize * u}px ${FONT}`;
      pl.bodyLines.forEach((l, k) => g.fillText(l, pl.body.x * u, (pl.body.y + pl.bodySize * 1.02 + k * pl.bodySize * 1.48) * u));
      // the two buttons: one a solid pill of enamel with its words left bare, the other only an outline
      const fs = hy > hx ? 0.086 : 0.082;
      g.font = `600 ${fs * u}px ${FONT}`; g.textAlign = "center"; g.letterSpacing = `${-0.005 * fs * u}px`;
      g.fillStyle = RED; round(pl.confirm); g.fill();
      g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";
      g.fillText(dialog.confirm, (pl.confirm.x + pl.confirm.w / 2) * u, (pl.confirm.y + pl.confirm.h / 2 + fs * 0.35) * u);
      g.globalCompositeOperation = "lighter";
      const inset = 0.006; g.strokeStyle = BLUE; g.lineWidth = 0.012 * u;
      round({ x: pl.cancel.x + inset, y: pl.cancel.y + inset, w: pl.cancel.w - 2 * inset, h: pl.cancel.h - 2 * inset }); g.stroke();
      g.fillStyle = RED; g.fillText(dialog.cancel, (pl.cancel.x + pl.cancel.w / 2) * u, (pl.cancel.y + pl.cancel.h / 2 + fs * 0.35) * u);
      // the cross in its ring
      const ccx = (pl.close.x + pl.close.w / 2) * u, ccy = (pl.close.y + pl.close.h / 2) * u, a = 0.034 * u;
      g.lineWidth = 0.009 * u; g.beginPath(); g.arc(ccx, ccy, (pl.close.w / 2 - 0.006) * u, 0, 7); g.stroke();
      g.strokeStyle = RED; g.lineWidth = 0.013 * u; g.lineCap = "round";
      g.beginPath(); g.moveTo(ccx - a, ccy - a); g.lineTo(ccx + a, ccy + a); g.moveTo(ccx + a, ccy - a); g.lineTo(ccx - a, ccy + a); g.stroke();
      g.globalCompositeOperation = "source-over";
      upload(2, texLab, labCv);
      return pl;
    };
    // The wall: the photograph cropped to cover it, with the title of the story lettered across the bottom.
    const paintWall = () => {
      scratch.width = texW; scratch.height = texH;
      const g = scratch.getContext("2d") as (CanvasRenderingContext2D & { letterSpacing?: string }) | null;
      if (!g) return;
      const grad = g.createLinearGradient(0, 0, 0, texH);
      grad.addColorStop(0, print.back[0]); grad.addColorStop(1, print.back[1]);
      g.fillStyle = grad; g.fillRect(0, 0, texW, texH);
      g.imageSmoothingQuality = "high";
      const u = texW / rect.w;
      const X = (x: number) => (x - rect.x) * u, Y = (y: number) => (rect.y + rect.h - y) * u;
      const v = view(0, 0);
      const tall = v.aspect < 0.8;
      const bl = onWall(v, -0.5 * v.aspect, -0.5), br = onWall(v, 0.5 * v.aspect, -0.5), tl = onWall(v, -0.5 * v.aspect, 0.5), tr = onWall(v, 0.5 * v.aspect, 0.5);
      if (photo) {
        // cover what the lens sees, and keep the face above the top edge of the glass
        const vw = Math.max(br[0], tr[0]) - Math.min(bl[0], tl[0]), vh = Math.max(tl[1], tr[1]) - Math.min(bl[1], br[1]);
        const k = Math.max((vw + 0.5) / photo.naturalWidth, (vh + 0.3) / photo.naturalHeight) * (tall ? 1.0 : 1.04);
        const dw = photo.naturalWidth * k, dh = photo.naturalHeight * k;
        const cxw = (Math.min(bl[0], tl[0]) + Math.max(br[0], tr[0])) / 2 + (tall ? 0.05 : 0.8);
        const top = Math.max(tl[1], tr[1]) + 0.12;
        // the backdrop colour runs on past the edges of the photograph
        g.drawImage(photo, 0, 0, 8, photo.naturalHeight, 0, Y(top), X(cxw - dw / 2) + 2, dh * u);
        g.drawImage(photo, photo.naturalWidth - 8, 0, 8, photo.naturalHeight, X(cxw + dw / 2) - 2, Y(top), texW, dh * u);
        g.drawImage(photo, X(cxw - dw / 2), Y(top), dw * u, dh * u);
      }
      const margin = (cssW >= 1024 ? 56 : cssW >= 640 ? 36 : 22) / cssH;
      const left = Math.max(onWall(v, -0.5 * v.aspect + margin, -0.4)[0], onWall(v, -0.5 * v.aspect + margin, 0.4)[0]);
      const right = Math.min(onWall(v, 0.5 * v.aspect - margin, -0.4)[0], onWall(v, 0.5 * v.aspect - margin, 0.4)[0]);
      const bottom = Math.max(onWall(v, 0, -0.5 + margin * 0.9)[1], onWall(v, -0.5 * v.aspect, -0.5 + margin * 0.9)[1]);
      g.fillStyle = "#f7f3ec"; g.textBaseline = "alphabetic"; g.textAlign = "left";
      // the title stands on the bottom margin and its heads reach just behind the lower edge of the glass
      const edge = project(v, [0, -hy, 0]);
      const capTop = onWall(v, 0, 0.5 - (edge[1] - (tall ? 4 : 30)) / cssH)[1];
      let fs = (capTop - bottom) / 0.725;
      g.letterSpacing = `${-0.055 * fs * u}px`; g.font = `800 ${fs * u}px ${FONT}`;
      const tw = g.measureText(print.title).width / u;
      if (tw > right - left) { fs *= (right - left) / tw; g.letterSpacing = `${-0.055 * fs * u}px`; g.font = `800 ${fs * u}px ${FONT}`; }
      g.fillText(print.title, X(left - 0.06 * fs), Y(bottom));
      upload(0, texA, scratch);
    };

    const layout = () => {
      const aspect = cssW / cssH;
      if (aspect < 0.8) { hx = 1.0; hy = 1.26; } else { hx = 1.5; hy = 1.0; }
      cx = hx - 0.42;
      const v = view(0, 0);
      up = (0.56 / v.foc) * DIST + hy + 1.0;
      const cs = [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, y]) => onWall(v, x * v.aspect, y));
      let x0 = Math.min(...cs.map((c) => c[0])) - 0.75, x1 = Math.max(...cs.map((c) => c[0])) + 0.75;
      let y0 = Math.min(...cs.map((c) => c[1])) - 0.5, y1 = Math.max(...cs.map((c) => c[1])) + 0.5;
      const ratio = (x1 - x0) / (y1 - y0);
      const big = !!gl2 && !software && cssW >= 900;
      const shape = ratio > 1.4 ? [2, 1] : ratio < 0.72 ? [1, 2] : [1, 1];
      const unit = big ? 1536 : 1024;
      texW = shape[0] * unit; texH = shape[1] * unit;
      const want = texW / texH;
      if (ratio < want) { const w = (y1 - y0) * want, c = (x0 + x1) / 2; x0 = c - w / 2; x1 = c + w / 2; }
      else { const h = (x1 - x0) / want, c = (y0 + y1) / 2; y0 = c - h / 2; y1 = c + h / 2; }
      rect.x = x0; rect.y = y0; rect.w = x1 - x0; rect.h = y1 - y0;
      paintWall();
      const pl = paintGlass();
      setPlan({ hx: pl.hx, hy: pl.hy, eyebrow: pl.eyebrow, title: pl.title, body: pl.body, cancel: pl.cancel, confirm: pl.confirm, close: pl.close, titleSize: pl.titleSize, bodySize: pl.bodySize });
      if (s.phase === "gone") s.y = up;
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

    // The real dialog is laid over the glass by the flat transform that best fits its four projected corners,
    // so its buttons and focus rings ride the sway. (A full perspective matrix would fit exactly, but browsers
    // then stop sending clicks to it; the sway is small enough that the difference is under a pixel or two.)
    const pin = (v: View, m: number[]) => {
      const w = 2 * hx * U, h = 2 * hy * U;
      const [tl, tr, bl, br] = [[-hx, hy], [hx, hy], [-hx, -hy], [hx, -hy]].map(([x, y]) => project(v, place(m, [x, y, T2])));
      const a = (tr[0] - tl[0] + br[0] - bl[0]) / (2 * w), b = (tr[1] - tl[1] + br[1] - bl[1]) / (2 * w);
      const c = (bl[0] - tl[0] + br[0] - tr[0]) / (2 * h), d = (bl[1] - tl[1] + br[1] - tr[1]) / (2 * h);
      const mx = (tl[0] + tr[0] + bl[0] + br[0]) / 4, my = (tl[1] + tr[1] + bl[1] + br[1]) / 4;
      const css = `matrix(${[a, b, c, d, mx - a * w / 2 - c * h / 2, my - b * w / 2 - d * h / 2].map((n) => n.toFixed(5)).join(",")})`;
      if (api.current) api.current.matrix = css;
      if (sheet.current) sheet.current.style.transform = css;
    };

    const draw = (alpha: number, sample: number) => {
      const v = view(s.lx, s.ly), m = rot();
      pin(v, m);
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.07 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texA);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, texLab);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform3f(su.uCam, v.cam[0], v.cam[1], v.cam[2]);
      gl.uniform1f(su.uFoc, v.foc); gl.uniform2f(su.uShift, v.shift[0], v.shift[1]);
      // the lens pulls focus from the wall to the glass as it comes down, and the wall gives up some of its light
      gl.uniform1f(su.uFocusZ, -G * (1 - s.dim));
      const kl = Math.hypot(-0.3, 0.44, 0.85);
      gl.uniform3f(su.uKey, -0.3 / kl, 0.44 / kl, 0.85 / kl);
      gl.uniform1f(su.uSoft, s.soft);
      gl.uniform1f(su.uOn, s.phase === "gone" ? 0 : 1);
      gl.uniform3f(su.uPos, s.sx, s.y, s.sz);
      gl.uniformMatrix3fv(su.uRot, false, m);
      gl.uniform2f(su.uRoll, Math.cos(s.roll), Math.sin(s.roll)); gl.uniform1f(su.uYawC, Math.max(0.5, Math.cos(s.yaw)));
      gl.uniform2f(su.uHalf, hx, hy); gl.uniform1f(su.uCx, cx);
      gl.uniform4f(su.uRect, rect.x, rect.y, rect.w, rect.h);
      const wb = 0.075 * s.dim;
      gl.uniform1f(su.uWB, wb); gl.uniform1f(su.uWLod, Math.max(0, Math.log2(Math.max(1e-4, (wb * texW) / rect.w / 3.0))));
      gl.uniform1f(su.uWallDim, 1 - 0.36 * s.dim);
      gl.uniform1f(su.uFrost, FROST); gl.uniform1f(su.uFrostLod, Math.max(0, Math.log2((FROST * texW) / rect.w / 2.6)));
      gl.uniform3f(su.uTint, TINT[0], TINT[1], TINT[2]); gl.uniform3f(su.uAccent, ACCENT[0], ACCENT[1], ACCENT[2]);
      gl.uniform4f(su.uHov, s.hovR[0], s.hovR[1], s.hovR[2], s.hovR[3]); gl.uniform1f(su.uHovS, s.hovS);
      gl.uniform1i(su.uA, 0); gl.uniform1i(su.uLab, 2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 3); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const set = (to: boolean, fromUser: boolean) => {
      if (fromUser) s.touched = true;
      if (to === s.open) return;
      s.open = to; s.pt = 0; s.landed = false;
      if (still) {
        s.phase = to ? "rest" : "gone"; s.y = to ? 0 : up; s.yv = 0; s.dim = to ? 1 : 0; s.count = 0; s.fresh = true;
      } else if (to) {
        // it arrives still turning from its ride down: twisted on the wires, one corner low, swung a little to one side
        if (s.phase === "gone") { s.y = up; s.yv = 0; s.yaw = -0.2; s.yawV = 0.1; s.roll = 0.042; s.rollV = 0; s.sx = 0.13; s.sxV = 0; s.pitch = -0.05; s.pitchV = 0; s.sz = 0; s.szV = 0; }
        s.phase = "down";
      } else {
        s.phase = "up"; s.rollV -= 0.3; s.yawV += 0.55;
      }
      wake();
    };
    const hover = (b: Box | null) => {
      s.hov = b;
      if (b) s.hovR = [b.x + b.w / 2 - hx, hy - b.y - b.h / 2, b.w / 2, b.h / 2];
      wake();
    };
    // a finger on the glass pushes that part of it back, and the sheet swings on its wires
    const push = (x: number, y: number) => {
      if (still) return;
      s.szV -= 0.9; s.yawV += x * 0.42; s.pitchV -= y * 0.5; s.touched = true; wake();
    };
    api.current = { set, hover, push, matrix: "" };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 5200; }

      // the self-running demo: it opens settled, holds, lifts away, shows the print, and comes back down
      if (!still && !s.touched && now > s.demoAt) {
        const to = !s.open;
        set(to, false); setOpen(to);
        s.demoAt = now + (to ? 6400 : 2300);
      }

      let moving = false, speed = 0;
      if (!still) {
        const time = (now - s.t0) / 1000;
        let target = s.open ? 0 : up;
        if (s.phase === "down") {
          s.pt += dt; const k = Math.min(1, s.pt / 0.74);
          target = up * Math.pow(1 - k, 1.75);
          // the winch stops dead and the sheet nods on past it
          if (k >= 1 && !s.landed) { s.landed = true; s.pitchV += 0.34; s.szV -= 0.3; }
          if (k >= 1 && Math.abs(s.y) < 0.002 && Math.abs(s.yv) < 0.01) { s.phase = "rest"; s.y = 0; s.yv = 0; }
        } else if (s.phase === "up") {
          s.pt += dt;
          // the wires give a hair first, then take the weight and go
          if (s.pt < 0.13) target = -0.05 * Math.sin((s.pt / 0.13) * Math.PI * 0.5);
          else { const k = Math.min(1, (s.pt - 0.13) / 0.62); target = -0.05 * (1 - k) + (up + 0.05) * Math.pow(k, 2.3); if (k >= 1 && s.y > up - 0.02) { s.phase = "gone"; s.y = up; s.yv = 0; } }
        }
        const lean = s.phase === "rest" || s.phase === "down" ? 1 : 0;
        const yawT = lean * (0.012 * Math.sin(time * 0.55) + s.px * 0.022), pitchT = lean * s.py * -0.008;
        const steps = 4, h = dt / steps;
        for (let k = 0; k < steps; k++) {
          if (s.phase === "down" || s.phase === "up") { s.yv += (460 * (target - s.y) - 16.5 * s.yv) * h; s.y += s.yv * h; }
          s.yawV += (14.2 * (yawT - s.yaw) - 2.15 * s.yawV) * h; s.yaw += s.yawV * h;
          s.rollV += (67 * -s.roll - 4.6 * s.rollV) * h; s.roll += s.rollV * h;
          s.pitchV += (36 * (pitchT - s.pitch) - 3.4 * s.pitchV) * h; s.pitch += s.pitchV * h;
          s.sxV += (9.9 * -s.sx - 1.9 * s.sxV) * h; s.sx += s.sxV * h;
          s.szV += (30 * -s.sz - 3.6 * s.szV) * h; s.sz += s.szV * h;
        }
        s.sz = Math.max(-0.5, Math.min(0.5, s.sz));
        speed = Math.abs(s.yv) * 0.5 + Math.abs(s.yawV) * 1.3 + Math.abs(s.rollV) * 3 + Math.abs(s.pitchV) * 1.5 + Math.abs(s.sxV) + Math.abs(s.szV);
        const dimT = s.open ? Math.min(1, Math.max(0, 1 - s.y / (up * 0.8))) : Math.max(0, 1 - s.y / (up * 0.5));
        s.dim += (dimT - s.dim) * (1 - Math.exp(-dt * 7));
        if (Math.abs(dimT - s.dim) > 0.002) speed += 0.2;
        const hs = (s.hov ? 1 : 0) - s.hovS;
        if (Math.abs(hs) > 0.004) { s.hovS += hs * (1 - Math.exp(-dt * 11)); speed += 0.1; } else s.hovS = s.hov ? 1 : 0;
        s.lx += (s.px - s.lx) * (1 - Math.exp(-dt * 3)); s.ly += (s.py - s.ly) * (1 - Math.exp(-dt * 3));
        s.soft = Math.sin(time * 0.4 + 0.4) * 0.07 + s.lx * 0.05;
        moving = true;
      } else {
        s.hovS = s.hov ? 1 : 0;
      }

      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(Math.min(0.85, 0.13 + speed * 1.6), 1 + (s.frame % 64)); s.count = 6; }
      else if (s.count < 56) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      // measured, not guessed: if frames run long for a while, give up some resolution
      if (!still && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 45 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 56) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (still) { s.count = 0; s.fresh = true; } if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => { photo = im; paintWall(); s.count = 0; s.fresh = true; wake(); };
    im.src = print.src;
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    const leave = () => { s.px = 0; s.py = 0; };
    const touch = () => { s.touched = true; };
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    box.addEventListener("pointerdown", touch);
    box.addEventListener("keydown", touch);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      box.removeEventListener("pointerdown", touch); box.removeEventListener("keydown", touch);
      cv.removeEventListener("webglcontextlost", lost);
      im.onload = null;
      api.current = null;
    };
  }, []);

  // Opened by a person: focus goes into the dialog. Closed by a person: it goes back to the button that opened it.
  useEffect(() => {
    if (!byUser.current) return;
    if (open) first.current?.focus(); else trigger.current?.focus();
  }, [open]);

  const change = (to: boolean, message?: string) => {
    byUser.current = true;
    api.current?.set(to, true);
    setOpen(to);
    setNote(to ? "" : message ?? "");
  };
  const keys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { e.preventDefault(); change(false); return; }
    if (e.key !== "Tab") return;
    const list = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("button"));
    if (!list.length) return;
    const at = list.indexOf(document.activeElement as HTMLElement);
    e.preventDefault();
    list[(at + (e.shiftKey ? -1 : 1) + list.length) % list.length].focus();
  };
  const press = (e: React.PointerEvent<HTMLButtonElement>, b: Box | undefined) => {
    if (!b || !plan) return;
    api.current?.push((b.x + b.w / 2 - plan.hx) / plan.hx, (plan.hy - b.y - b.h / 2) / plan.hy);
  };

  const still = shown === "still";
  const gl = !still && !!plan;
  const at = (b: Box | undefined) => (gl && b ? { position: "absolute" as const, left: b.x * U, top: b.y * U, width: b.w * U, height: b.h * U } : undefined);
  const lit = (b: Box | undefined) => ({
    onPointerEnter: () => api.current?.hover(b ?? null), onPointerLeave: () => api.current?.hover(null),
    onFocus: () => api.current?.hover(b ?? null), onBlur: () => api.current?.hover(null),
  });
  const ring = "outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#1b2433]";

  return (
    <section className="relative isolate overflow-hidden bg-[#17365e] text-white" style={{ fontFamily: FONT }}>
      <div
        ref={stage}
        className="relative h-[720px] w-full sm:h-[min(720px,62.5vw)] lg:h-[min(760px,62.5vw)]"
        style={{ background: `linear-gradient(${print.back[0]}, ${print.back[1]})` }}
        onPointerDown={(e) => { if (open && !(e.target as HTMLElement).closest("[role=dialog]") && !(e.target as HTMLElement).closest("button")) change(false); }}
      >
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />

        {still && (
          <div className="absolute inset-0 overflow-hidden">
            <img src={print.src} alt={print.alt} width={1600} height={1067} className={`absolute inset-0 h-full w-full object-cover object-[50%_12%] transition-[filter,transform] duration-500 motion-reduce:transition-none ${open ? "scale-[1.04] blur-[7px] brightness-[0.62]" : ""}`} style={{ backgroundColor: print.back[0] }} />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0c1c33]/60 to-transparent" />
            <p className={`absolute inset-x-5 bottom-6 whitespace-nowrap text-[17.5vw] font-extrabold leading-[0.8] tracking-[-0.055em] text-[#f7f3ec] transition-[filter,opacity] duration-500 motion-reduce:transition-none sm:inset-x-9 lg:inset-x-12 lg:bottom-9 lg:text-[212px] ${open ? "opacity-60 blur-[6px]" : ""}`}>{print.title}</p>
            {open && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[calc(50%-150px)] w-[min(88%,660px)] sm:h-[calc(50%-178px)]">
                <span className="absolute bottom-0 left-[14%] top-0 w-[2px] bg-gradient-to-r from-[#5d646e] via-[#eef1f4] to-[#7c838c]" />
                <span className="absolute bottom-0 right-[14%] top-0 w-[2px] bg-gradient-to-r from-[#5d646e] via-[#eef1f4] to-[#7c838c]" />
              </div>
            )}
          </div>
        )}

        <div className={`pointer-events-none absolute inset-x-6 top-7 transition-[filter,opacity] duration-500 motion-reduce:transition-none sm:inset-x-10 lg:inset-x-14 lg:top-11 ${open ? (still ? "opacity-60 blur-[5px]" : "opacity-0") : ""}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f7f3ec]">{print.kicker} <span className="mx-2 hidden h-px w-9 bg-current align-middle opacity-70 sm:inline-block" /> <span className="hidden sm:inline">{print.issue}</span></p>
        </div>

        <div className={`absolute right-5 top-5 transition-opacity duration-300 motion-reduce:transition-none sm:right-9 lg:right-12 lg:top-8 ${open ? "pointer-events-none opacity-0" : "opacity-100"}`}>
          <button
            ref={trigger}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            tabIndex={open ? -1 : 0}
            onClick={() => change(true)}
            className="inline-flex h-12 items-center gap-2.5 rounded-full bg-[#f7f3ec] pl-5 pr-4 text-[14px] font-semibold tracking-[-0.01em] text-[#0f1b2d] shadow-[0_14px_30px_-12px_rgba(4,12,28,0.7),inset_0_-2px_0_rgba(15,27,45,0.12)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#17365e] active:translate-y-0 motion-reduce:transition-none"
          >
            {dialog.trigger}
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v6M14 3v6M4 9h12v7H4z" /></svg>
          </button>
        </div>

        {open && (
          <div
            ref={(el) => { sheet.current = el; if (el && gl && api.current?.matrix) el.style.transform = api.current.matrix; }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="smoked-glass-dialog-title"
            aria-describedby="smoked-glass-dialog-body"
            onKeyDown={keys}
            className={gl
              ? "absolute left-0 top-0 origin-top-left text-transparent"
              : still
                ? "absolute left-1/2 top-1/2 w-[min(88%,660px)] -translate-x-1/2 -translate-y-1/2 rounded-[26px] border border-white/25 bg-[#141c29]/55 p-7 text-[#f7f3ec] shadow-[46px_64px_70px_-30px_rgba(3,9,22,0.75),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(255,255,255,0.12),inset_0_0_0_7px_rgba(255,255,255,0.045)] backdrop-blur-2xl sm:p-11"
                : "sr-only"}
            style={gl && plan ? { width: 2 * plan.hx * U, height: 2 * plan.hy * U } : undefined}
          >
            <p className={gl ? "absolute whitespace-nowrap text-[11px] uppercase" : "flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em]"} style={at(plan?.eyebrow)}>
              {!gl && <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#f0547d]" />}{dialog.eyebrow}
            </p>
            <h2 id="smoked-glass-dialog-title" className={gl ? "absolute font-bold leading-none tracking-[-0.04em]" : "mt-6 text-[38px] font-bold leading-[1.02] tracking-[-0.04em] sm:text-[58px]"} style={gl && plan ? { ...at(plan.title), fontSize: plan.titleSize * U } : undefined}>{dialog.title}</h2>
            <p id="smoked-glass-dialog-body" className={gl ? "absolute leading-[1.48]" : "mt-4 max-w-[27rem] text-[16px] leading-[1.5] text-[#f7f3ec]/75 sm:text-[18px]"} style={gl && plan ? { ...at(plan.body), fontSize: plan.bodySize * U } : undefined}>{dialog.body}</p>
            <div className={gl ? "" : "mt-9 flex justify-end gap-3 sm:mt-14"}>
              <button type="button" onClick={() => change(false)} onPointerDown={(e) => press(e, plan?.cancel)} {...lit(plan?.cancel)} className={gl ? `rounded-full text-[16px] ${ring}` : `h-12 flex-1 rounded-full border border-[#f7f3ec]/60 whitespace-nowrap px-4 text-[14px] font-semibold sm:px-6 sm:text-[15px] text-[#f7f3ec] transition-colors hover:bg-white/10 motion-reduce:transition-none sm:flex-none ${ring}`} style={at(plan?.cancel)}>{dialog.cancel}</button>
              <button ref={first} type="button" onClick={() => change(false, dialog.done)} onPointerDown={(e) => press(e, plan?.confirm)} {...lit(plan?.confirm)} className={gl ? `rounded-full text-[16px] ${ring}` : `h-12 flex-1 rounded-full bg-[#f7f3ec] whitespace-nowrap px-4 text-[14px] font-semibold sm:px-6 sm:text-[15px] text-[#0f1b2d] transition-colors hover:bg-white motion-reduce:transition-none sm:flex-none ${ring}`} style={at(plan?.confirm)}>{dialog.confirm}</button>
            </div>
            <button type="button" aria-label="Close" onClick={() => change(false)} onPointerDown={(e) => press(e, plan?.close)} {...lit(plan?.close)} className={gl ? `rounded-full ${ring}` : `absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-[#f7f3ec]/45 text-[#f7f3ec] transition-colors hover:bg-white/10 motion-reduce:transition-none sm:right-8 sm:top-8 ${ring}`} style={at(plan ? { x: plan.close.x - 0.04, y: plan.close.y - 0.04, w: plan.close.w + 0.08, h: plan.close.h + 0.08 } : undefined)}>
              {!gl && <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>}
            </button>
          </div>
        )}

        <p aria-live="polite" className="sr-only">{note}</p>
      </div>
    </section>
  );
}
