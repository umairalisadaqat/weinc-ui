import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

/** Everything a visitor is likely to change. Colours are linear red, green, blue from 0 to 1. */
const lamp = {
  /** The enamel on the shade and the foot. */
  enamel: [0.78, 0.085, 0.03],
  /** The painted wall behind the desk. */
  wall: [0.085, 0.2, 0.185],
  /** The colour of the bulb. Lower the last number for a warmer lamp. */
  bulb: [1.0, 0.8, 0.56],
  /** Lengths of the lower and upper arm, in scene units (the vase is 0.62 tall). */
  lower: 0.92,
  upper: 0.8,
  /** How wide the shade lets the light spread. 0.56 is a broad task lamp, 0.8 a tight spot. */
  spread: 0.56,
  /** Where the head rests when nobody is steering it: across the desk, then height. */
  rest: [-0.2, 1.36],
  /** The share of full resolution drawn. Lower it if the scene runs hot on old phones. */
  quality: 0.9,
  maxPixels: 820000,
};

// The camera and the lamp's foot. The same numbers are used by the shader and by the pointer maths.
const CAM = [-0.08, 1.14, 4.6];
const LOOK = [-0.14, 0.84, 0.0];
const FOCAL = 3.4;
const PIVOT = [-1.05, 0.17, 0.25];
const SUBJECT = [0.5, 0.42, -0.26];

const VERTEX = `attribute vec2 position; void main(){ gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAGMENT = `precision highp float;
uniform vec2 uRes;
uniform float uZoom;
uniform vec3 uJ1;
uniform vec3 uJ2;
uniform vec3 uAim;
uniform float uOn;
uniform float uSpread;
uniform vec3 uEnamel;
uniform vec3 uWall;
uniform vec3 uBulb;

const vec3 PIVOT = vec3(${PIVOT[0].toFixed(3)}, ${PIVOT[1].toFixed(3)}, ${PIVOT[2].toFixed(3)});
const vec3 VASE = vec3(0.46, 0.0, -0.28);
const float WALLZ = -0.86;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){ return noise(p) * 0.55 + noise(p * 2.1 + 7.0) * 0.3 + noise(p * 4.3 + 19.0) * 0.15; }

float capsule(vec3 p, vec3 a, vec3 b, float r){
  vec3 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)) - r;
}
float cylY(vec3 p, float r, float h){
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}
float cylZ(vec3 p, float r, float h){
  vec2 d = abs(vec2(length(p.xy), p.z)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}
float cone(vec3 p, vec3 a, vec3 b, float ra, float rb){
  float rba = rb - ra;
  float baba = dot(b - a, b - a);
  float papa = dot(p - a, p - a);
  float paba = dot(p - a, b - a) / baba;
  float x = sqrt(max(papa - paba * paba * baba, 0.0));
  float cax = max(0.0, x - ((paba < 0.5) ? ra : rb));
  float cay = abs(paba - 0.5) - 0.5;
  float k = rba * rba + baba;
  float f = clamp((rba * (x - ra) + paba * baba) / k, 0.0, 1.0);
  float cbx = x - ra - f * rba;
  float cby = paba - f;
  float s = (cbx < 0.0 && cay < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(cax * cax + cay * cay * baba, cbx * cbx + cby * cby * baba));
}

vec2 join(vec2 a, vec2 b){ return a.x < b.x ? a : b; }

float vaseShape(vec3 q){
  float t = clamp(q.y / 0.62, 0.0, 1.0);
  float r = mix(0.082, 0.05, t) + 0.125 * pow(sin(3.14159 * min(t * 1.2, 1.0)), 1.3) + 0.03 * smoothstep(0.86, 1.0, t);
  float side = (length(q.xz) - r) * 0.62;
  return max(side, abs(q.y - 0.31) - 0.31) - 0.004;
}

// Three dried stems with round seed heads, the vase, two pieces of fruit.
vec2 stillLife(vec3 p){
  vec3 q = p - VASE;
  vec2 d = vec2(vaseShape(q), 7.0);
  vec3 neck = vec3(0.0, 0.6, 0.0);
  vec3 f1 = vec3(-0.17, 1.1, 0.04), f2 = vec3(0.05, 1.3, -0.05), f3 = vec3(0.23, 0.98, 0.06);
  float stems = min(capsule(q, neck, f1, 0.0065), min(capsule(q, neck, f2, 0.0065), capsule(q, neck, f3, 0.0065)));
  d = join(d, vec2(stems, 8.0));
  float heads = min(length(q - f1) - 0.052, min(length(q - f2) - 0.058, length(q - f3) - 0.047));
  d = join(d, vec2(heads, 9.0));
  d = join(d, vec2(length(q - vec3(0.35, 0.088, 0.2)) - 0.088, 10.0));
  vec3 a = q - vec3(0.17, 0.066, 0.36);
  d = join(d, vec2(length(a * vec3(1.0, 1.08, 1.0)) - 0.066, 11.0));
  return d;
}

// The foot, the post and the two arms. These can stand between the bulb and the desk.
vec2 frame(vec3 p){
  vec3 foot = vec3(PIVOT.x, 0.0, PIVOT.z);
  vec2 d = vec2(cylY(p - foot - vec3(0.0, 0.03, 0.0), 0.24, 0.014) - 0.016, 13.0);
  d = join(d, vec2(capsule(p, foot + vec3(0.0, 0.05, 0.0), PIVOT, 0.026), 4.0));
  vec3 off = vec3(0.0, 0.0, 0.034);
  float rods = min(capsule(p, PIVOT + off, uJ1 + off, 0.0105), capsule(p, PIVOT - off, uJ1 - off, 0.0105));
  rods = min(rods, min(capsule(p, uJ1 + off, uJ2 + off, 0.0105), capsule(p, uJ1 - off, uJ2 - off, 0.0105)));
  d = join(d, vec2(rods, 5.0));
  float knuckles = min(cylZ(p - PIVOT, 0.036, 0.052), min(cylZ(p - uJ1, 0.034, 0.052), cylZ(p - uJ2, 0.03, 0.05))) - 0.006;
  d = join(d, vec2(knuckles, 4.0));
  // The tension spring that runs beside the lower arm.
  vec3 s0 = PIVOT + vec3(0.07, 0.0, 0.0);
  vec3 s1 = mix(PIVOT, uJ1, 0.42);
  d = join(d, vec2(capsule(p, s0, s1, 0.012), 12.0));
  return d;
}

vec2 head(vec3 p){
  vec3 a = uJ2 + uAim * 0.05;
  vec3 b = uJ2 + uAim * 0.37;
  float shell = abs(cone(p, a, b, 0.07, 0.215)) - 0.006;
  shell = max(shell, dot(p - b, uAim) + 0.014);
  vec2 d = vec2(shell, 3.0);
  d = join(d, vec2(capsule(p, uJ2 - uAim * 0.03, uJ2 + uAim * 0.07, 0.058), 3.0));
  d = join(d, vec2(length(p - (uJ2 + uAim * 0.2)) - 0.058, 6.0));
  return d;
}

vec2 map(vec3 p){
  vec2 d = vec2(p.y, 1.0);
  d = join(d, vec2(p.z - WALLZ, 2.0));
  d = join(d, stillLife(p));
  d = join(d, frame(p));
  d = join(d, head(p));
  return d;
}
float blockers(vec3 p){ return min(stillLife(p).x, frame(p).x); }

vec3 normalAt(vec3 p){
  vec2 e = vec2(0.0012, -0.0012);
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}

float shadow(vec3 ro, vec3 rd, float far){
  float res = 1.0;
  float t = 0.015;
  for (int i = 0; i < 56; i++) {
    float h = blockers(ro + rd * t);
    res = min(res, 24.0 * h / t);
    t += clamp(h, 0.008, 0.1);
    if (res < 0.004 || t > far) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}

float occlusion(vec3 p, vec3 n){
  float o = 0.0, w = 1.0;
  for (int i = 1; i <= 4; i++) {
    float h = 0.035 * float(i);
    o += (h - map(p + n * h).x) * w;
    w *= 0.62;
  }
  return clamp(1.0 - 2.4 * o, 0.0, 1.0);
}

// How much lamp light reaches a point, before anything gets in the way.
float beam(vec3 p, vec3 light, out vec3 L, out float far){
  L = light - p;
  float d2 = dot(L, L);
  far = sqrt(d2);
  L /= far;
  float inCone = smoothstep(uSpread - 0.2, uSpread + 0.16, dot(-L, uAim));
  return uOn * 2.3 * inCone / (0.22 + d2);
}

void main(){
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y * uZoom;
  vec3 ro = vec3(${CAM[0].toFixed(2)}, ${CAM[1].toFixed(2)}, ${CAM[2].toFixed(2)});
  vec3 ta = vec3(${LOOK[0].toFixed(2)}, ${LOOK[1].toFixed(2)}, ${LOOK[2].toFixed(2)});
  vec3 fw = normalize(ta - ro);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw * ${FOCAL.toFixed(1)} + rt * uv.x + up * uv.y);

  float t = 0.5;
  vec2 hit = vec2(0.0);
  for (int i = 0; i < 90; i++) {
    hit = map(ro + rd * t);
    if (hit.x < 0.0007 * t || t > 14.0) break;
    t += hit.x * 0.92;
  }
  vec3 p = ro + rd * t;
  vec3 n = normalAt(p);
  float id = hit.y;
  vec3 light = uJ2 + uAim * 0.2;

  vec3 albedo = vec3(0.5);
  float gloss = 0.0, shine = 20.0, metal = 0.0;
  vec3 glow = vec3(0.0);
  if (id < 1.5) {
    // An oiled walnut top: long grain, darker streaks, a seam between boards.
    float g = fbm(vec2(p.x * 1.3 + 3.0, p.z * 26.0)) * 0.7 + fbm(vec2(p.x * 7.0, p.z * 90.0)) * 0.3;
    float ring = sin((p.z * 9.0 + fbm(vec2(p.x * 0.8, p.z * 3.0)) * 5.0) * 3.0) * 0.5 + 0.5;
    albedo = mix(vec3(0.115, 0.052, 0.026), vec3(0.36, 0.185, 0.09), g * 0.75 + ring * 0.2);
    float seam = smoothstep(0.012, 0.0, abs(fract(p.z * 1.9 + 0.31) - 0.5) * 0.52);
    albedo *= 1.0 - seam * 0.45;
    gloss = 0.22; shine = 46.0;
  } else if (id < 2.5) {
    float m = fbm(p.xy * 2.2) * 0.6 + fbm(p.xy * 11.0) * 0.4;
    albedo = uWall * (0.86 + m * 0.3);
    n = normalize(n + vec3(noise(p.xy * 70.0) - 0.5, noise(p.yx * 70.0 + 9.0) - 0.5, 0.0) * 0.05);
  } else if (id < 3.5) {
    albedo = uEnamel; gloss = 1.0; shine = 90.0;
    // Inside, the shade is white enamel that glows with the bulb.
    vec3 q = p - uJ2;
    vec3 radial = q - uAim * dot(q, uAim);
    if (dot(n, radial) < 0.0 && dot(q, uAim) > 0.06) {
      albedo = vec3(0.86, 0.84, 0.8);
      glow = uBulb * uOn * (0.5 + 0.9 * smoothstep(0.34, 0.1, dot(q, uAim)));
      gloss = 0.1;
    }
  } else if (id < 4.5) {
    albedo = vec3(0.86, 0.6, 0.27); metal = 1.0; gloss = 1.0; shine = 60.0;
  } else if (id < 5.5) {
    albedo = vec3(0.78, 0.78, 0.8); metal = 1.0; gloss = 1.0; shine = 120.0;
  } else if (id < 6.5) {
    albedo = vec3(0.8, 0.78, 0.74);
    glow = uBulb * uOn * 3.2;
  } else if (id < 7.5) {
    // Unglazed stoneware with a few iron specks; the mouth is dark.
    float speck = smoothstep(0.78, 0.86, noise(p.xy * 85.0 + p.z * 40.0));
    albedo = vec3(0.82, 0.78, 0.7) * (0.93 + fbm(p.xy * 9.0) * 0.12) - speck * 0.22;
    vec3 q = p - VASE;
    if (q.y > 0.61 && length(q.xz) < 0.062) albedo = vec3(0.03);
    gloss = 0.12; shine = 24.0;
  } else if (id < 8.5) {
    albedo = vec3(0.36, 0.31, 0.16);
  } else if (id < 9.5) {
    albedo = vec3(0.8, 0.5, 0.045);
    n = normalize(n + (vec3(noise(p.xy * 110.0), noise(p.yz * 110.0), noise(p.zx * 110.0)) - 0.5) * 0.7);
  } else if (id < 10.5) {
    float bloom = fbm(p.xy * 14.0 + p.z * 9.0);
    albedo = mix(vec3(0.12, 0.022, 0.1), vec3(0.2, 0.09, 0.26), bloom * 0.7);
    gloss = 0.5; shine = 70.0;
  } else if (id < 11.5) {
    albedo = mix(vec3(0.9, 0.42, 0.07), vec3(0.86, 0.2, 0.06), smoothstep(0.3, 0.75, fbm(p.xy * 9.0 + 4.0)));
    gloss = 0.16; shine = 18.0;
  } else if (id > 12.5) {
    albedo = uEnamel; gloss = 0.7; shine = 90.0;
  } else {
    albedo = vec3(0.72, 0.72, 0.74); metal = 1.0; gloss = 0.9; shine = 80.0;
    albedo *= 0.55 + 0.45 * sin(dot(p - PIVOT, normalize(uJ1 - PIVOT)) * 520.0);
  }

  float ao = occlusion(p, n);
  vec3 col = vec3(0.0);

  // The lamp.
  vec3 L; float far;
  float I = beam(p, light, L, far);
  bool ownHead = (id > 2.5 && id < 3.5) || (id > 5.5 && id < 6.5);
  float sh = 1.0;
  if (I > 0.002 && !ownHead) sh = shadow(p + n * 0.004, L, far - 0.12);
  if (ownHead) I = 0.0;
  float ndl = max(dot(n, L), 0.0);
  vec3 hv = normalize(L - rd);
  float spec = pow(max(dot(n, hv), 0.0), shine) * gloss;
  vec3 direct = uBulb * I * sh;
  col += albedo * direct * ndl * (1.0 - metal * 0.75);
  col += mix(vec3(1.0), albedo, metal) * direct * spec * (0.6 + metal * 2.4) * step(0.0, dot(n, L));

  // Warm light coming back up off the desk and off the lit wall.
  vec3 Lb; float fb;
  float pool = beam(vec3(p.x, 0.0, p.z), light, Lb, fb) * max(Lb.y, 0.0);
  col += albedo * uBulb * vec3(0.55, 0.3, 0.16) * pool * 0.22 * (0.5 - 0.5 * n.y) * exp(-2.2 * p.y) * ao;
  float back = beam(vec3(p.x, p.y, WALLZ), light, Lb, fb) * max(Lb.z * -1.0, 0.0);
  col += albedo * uBulb * uWall * back * 0.5 * max(-n.z, 0.0) * ao;

  // The rest of the room: a cool evening window somewhere behind the camera.
  vec3 fill = normalize(vec3(0.5, 0.62, 0.78));
  float fd = max(dot(n, fill), 0.0);
  vec3 room = vec3(0.36, 0.45, 0.68) * 0.08 + uBulb * vec3(0.55, 0.42, 0.32) * 0.11 * uOn;
  col += albedo * room * (0.3 + 0.7 * fd) * ao * (1.0 - metal * 0.6);
  vec3 r = reflect(rd, n);
  // Polished parts mirror a soft bright window and the dark of the room.
  float win = smoothstep(0.72, 0.9, dot(r, fill)) * 1.6 + 0.25 * smoothstep(-0.2, 0.9, r.y);
  float fres = pow(1.0 - max(dot(n, -rd), 0.0), 4.0);
  col += mix(vec3(1.0), albedo, metal) * vec3(0.5, 0.6, 0.85) * win * (metal * 0.6 + gloss * (0.11 + fres * 0.45)) * ao;
  col += mix(vec3(1.0), albedo, metal) * uBulb * metal * uOn * 0.1 * smoothstep(0.2, 1.0, dot(r, normalize(light - p)));

  col += glow;

  // The bulb seen through the air: a little bloom round the mouth of the shade.
  vec3 toLight = light - ro;
  float along = dot(toLight, rd);
  float miss = length(toLight - rd * along);
  float facing = smoothstep(-0.25, 0.6, dot(normalize(ro - light), uAim));
  float clear = step(along, t + 0.25);
  col += uBulb * uOn * (0.012 * exp(-miss * miss * 26.0) + 0.5 * facing * exp(-miss * miss * 240.0)) * clear;

  // Film response, a soft corner fall-off and enough grain to stop banding in the dark wall.
  col *= 1.25;
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(0.4545));
  vec2 v = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - dot(v, v) * 0.55;
  col += (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}`;

type V3 = [number, number, number];
const sub = (a: number[], b: number[]): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: number[], b: number[]): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: number[]): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The two-bone arm: where the elbow and the head end up for a wanted head position. */
function pose(x: number, y: number) {
  let dx = x - PIVOT[0];
  let dy = y - PIVOT[1];
  const reach = clamp(Math.hypot(dx, dy), Math.abs(lamp.lower - lamp.upper) + 0.22, lamp.lower + lamp.upper - 0.03);
  const len = Math.hypot(dx, dy) || 1;
  dx = (dx / len) * reach;
  dy = (dy / len) * reach;
  const bend = Math.acos(clamp((lamp.lower * lamp.lower + reach * reach - lamp.upper * lamp.upper) / (2 * lamp.lower * reach), -1, 1));
  const a = Math.atan2(dy, dx) + bend;
  const j1: V3 = [PIVOT[0] + Math.cos(a) * lamp.lower, PIVOT[1] + Math.sin(a) * lamp.lower, PIVOT[2]];
  const j2: V3 = [PIVOT[0] + dx, PIVOT[1] + dy, PIVOT[2]];
  return { j1, j2 };
}

/** Keeps a wanted head position somewhere the lamp can really go. */
function tidy(x: number, y: number): [number, number] {
  return [clamp(x, -1.0, 0.66), clamp(y, 0.74, 1.62)];
}

export default function PosableDeskLamp() {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const [on, setOn] = useState(true);
  const [reachValue, setReachValue] = useState(50);
  const [liftValue, setLiftValue] = useState(60);
  const want = useRef({ x: lamp.rest[0], y: lamp.rest[1], touched: -1e9 });
  const power = useRef(true);
  power.current = on;

  useEffect(() => {
    const cv = canvas.current;
    const el = stage.current;
    const gl = cv?.getContext("webgl", { antialias: false, alpha: false });
    if (!cv || !el || !gl) return; // no WebGL: the painted still underneath stays

    const compile = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const at = (name: string) => gl.getUniformLocation(program, name);
    const u = { res: at("uRes"), zoom: at("uZoom"), j1: at("uJ1"), j2: at("uJ2"), aim: at("uAim"), on: at("uOn") };
    gl.uniform1f(at("uSpread"), lamp.spread);
    gl.uniform3fv(at("uEnamel"), lamp.enamel);
    gl.uniform3fv(at("uWall"), lamp.wall);
    gl.uniform3fv(at("uBulb"), lamp.bulb);

    // The head is on a spring, so it overshoots a little and settles, as a sprung arm does.
    const headAt = { x: lamp.rest[0], y: lamp.rest[1], vx: 0, vy: 0 };
    const aim = { v: unit(sub(SUBJECT, [lamp.rest[0], lamp.rest[1], PIVOT[2]])) };
    let glowNow = power.current ? 1 : 0;
    let raf = 0;
    let visible = true;
    let before = 0;
    let clock = 0;

    const draw = () => {
      const { j1, j2 } = pose(headAt.x, headAt.y);
      gl.uniform3fv(u.j1, j1);
      gl.uniform3fv(u.j2, j2);
      gl.uniform3fv(u.aim, aim.v);
      gl.uniform1f(u.on, glowNow);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      const w = cv.clientWidth || 1;
      const h = cv.clientHeight || 1;
      const scale = Math.min(Math.min(Math.max(window.devicePixelRatio || 1, 1), 2) * lamp.quality, Math.sqrt(lamp.maxPixels / (w * h)));
      cv.width = Math.max(1, Math.round(w * scale));
      cv.height = Math.max(1, Math.round(h * scale));
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(u.res, cv.width, cv.height);
      gl.uniform1f(u.zoom, Math.max(0.82, 1.2 / (w / h)));
      draw();
      setLive(true);
    };
    const step = (dt: number, now: number) => {
      clock += dt;
      const w = want.current;
      let tx = w.x;
      let ty = w.y;
      // Left alone, the lamp is slowly swung across the desk and back.
      if (!reduce && now - w.touched > 2800) {
        tx = lamp.rest[0] + 0.52 * Math.sin(clock * 0.42 - 0.5);
        ty = lamp.rest[1] + 0.2 * Math.sin(clock * 0.31 + 1.2);
        w.x = tx;
        w.y = ty;
      }
      if (reduce) {
        headAt.x = tx;
        headAt.y = ty;
      } else {
        headAt.vx += ((tx - headAt.x) * 70 - headAt.vx * 9.5) * dt;
        headAt.vy += ((ty - headAt.y) * 70 - headAt.vy * 9.5) * dt;
        headAt.x += headAt.vx * dt;
        headAt.y += headAt.vy * dt;
      }
      // The shade keeps looking at the still life, and nods a little with the arm's speed.
      const { j2 } = pose(headAt.x, headAt.y);
      const to = unit(sub([SUBJECT[0] + headAt.vx * 0.12, SUBJECT[1] + headAt.vy * 0.12, SUBJECT[2]], j2));
      const k = reduce ? 1 : 1 - Math.exp(-dt * 9);
      aim.v = unit([aim.v[0] + (to[0] - aim.v[0]) * k, aim.v[1] + (to[1] - aim.v[1]) * k, aim.v[2] + (to[2] - aim.v[2]) * k]);
      // A filament does not switch instantly: quick to light, slower to die.
      const goal = power.current ? 1 : 0;
      glowNow += (goal - glowNow) * (reduce ? 1 : 1 - Math.exp(-dt * (goal ? 9 : 5)));
    };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - (before || now)) / 1000, 0.04);
      before = now;
      step(dt, now);
      draw();
    };
    const wake = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      before = 0;
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    resize();
    wake();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
    };
  }, [reduce]);

  /** Turns a pointer position into a place on the upright plane the arm moves in. */
  function steer(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" && e.type === "pointermove" && e.buttons === 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    const zoom = Math.max(0.82, 1.2 / (r.width / r.height));
    const ux = (((e.clientX - r.left) / r.width) * 2 - 1) * (r.width / r.height) * zoom;
    const uy = (1 - ((e.clientY - r.top) / r.height) * 2) * zoom;
    const fw = unit(sub(LOOK, CAM));
    const rt = unit(cross(fw, [0, 1, 0]));
    const up = cross(rt, fw);
    const rd = unit([fw[0] * FOCAL + rt[0] * ux + up[0] * uy, fw[1] * FOCAL + rt[1] * ux + up[1] * uy, fw[2] * FOCAL + rt[2] * ux + up[2] * uy]);
    const t = (PIVOT[2] - CAM[2]) / rd[2];
    const [x, y] = tidy(CAM[0] + rd[0] * t, CAM[1] + rd[1] * t);
    want.current = { x, y, touched: performance.now() };
    setReachValue(Math.round(((x + 1.0) / 1.66) * 100));
    setLiftValue(Math.round(((y - 0.74) / 0.88) * 100));
  }
  function slide(reach: number, lift: number) {
    setReachValue(reach);
    setLiftValue(lift);
    want.current = { x: -1.0 + (reach / 100) * 1.66, y: 0.74 + (lift / 100) * 0.88, touched: performance.now() + 6000 };
  }

  return (
    <section className="relative isolate w-full overflow-hidden bg-[#0d1614]">
      <div
        ref={stage}
        onPointerMove={steer}
        onPointerDown={steer}
        className="relative h-[540px] w-full cursor-grab touch-pan-y select-none active:cursor-grabbing sm:h-[680px]"
      >
        {/* The still version, shown until the first frame is drawn and wherever WebGL is missing. */}
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(46% 40% at 62% 60%, #6f7f60 0%, #2f4a41 34%, #15231f 62%, #0d1614 100%)" }} />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[30%]" style={{ background: "linear-gradient(180deg, #3a1f12 0%, #150b06 100%)" }} />
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`} />

        <label htmlFor="pdl-reach" className="sr-only">Lamp head, left to right</label>
        <input id="pdl-reach" type="range" min={0} max={100} step={2} value={reachValue} onChange={(e) => slide(Number(e.target.value), liftValue)} className="peer/reach sr-only" />
        <label htmlFor="pdl-lift" className="sr-only">Lamp head, low to high</label>
        <input id="pdl-lift" type="range" min={0} max={100} step={2} value={liftValue} onChange={(e) => slide(reachValue, Number(e.target.value))} className="peer/lift sr-only" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-2xl ring-2 ring-white/80 opacity-0 peer-focus-visible/reach:opacity-100 peer-focus-visible/lift:opacity-100" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 pb-5 sm:px-8 sm:pb-7">
        <p className="text-[13px] leading-5 text-[#c9d3cc]">
          <span className="font-semibold text-white">Task lamp</span>
          <span className="mx-2 text-[#7f8f87]">/</span>
          move its head
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => setOn((v) => !v)}
          className="pointer-events-auto inline-flex h-10 shrink-0 items-center gap-2.5 rounded-full bg-black/45 pl-3 pr-4 text-[13px] font-medium text-white ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${on ? "bg-[#ffcf8a] shadow-[0_0_10px_3px_rgba(255,190,110,0.7)]" : "bg-[#4a544f]"}`} />
          {on ? "Lamp on" : "Lamp off"}
        </button>
      </div>
    </section>
  );
}
