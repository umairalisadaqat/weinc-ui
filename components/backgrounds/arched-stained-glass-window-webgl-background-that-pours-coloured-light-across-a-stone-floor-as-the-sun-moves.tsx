import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

/** The glass. Change these and the light on the floor changes with them. */
const glass = {
  sky: ["#12308f", "#1f5fcf", "#2f8fd8", "#8cc8ea", "#432a94", "#1a4cb8"],
  sun: ["#ffcf2e", "#f47c12", "#cf1b2b"],
  rays: ["#f6a21a", "#ffd866"],
  hills: ["#6a2f98", "#0f8a6c", "#5fb233", "#0b5c36"],
  /** How many wedges of sky fan out from the sun. */
  wedges: 20,
};

const room = {
  /** Limestone floor and plaster wall, as linear red, green, blue from 0 to 1. */
  floor: [0.62, 0.55, 0.46],
  wall: [0.8, 0.73, 0.64],
  /** How thick the air is. 0 removes the shafts of light, 0.1 is a dusty chapel. */
  haze: 0.085,
  /** The hours the slider covers, and where the day starts when the page loads. */
  from: 8,
  to: 18,
  start: 0.24,
  quality: 0.9,
  maxPixels: 760000,
};

// The window opening in metres: the texture covers a slightly larger box so its edges are dark.
const BOX = { x: -0.9, y: 0.9, w: 1.8, h: 3.375 };
const TEX_W = 512;
const TEX_H = 960;

/** Paints the leaded window: a sun behind hills with a fan of sky panes, drawn back to front. */
function paintGlass() {
  const cv = document.createElement("canvas");
  cv.width = TEX_W;
  cv.height = TEX_H;
  const c = cv.getContext("2d")!;
  const k = TEX_W / BOX.w;
  const X = (x: number) => (x - BOX.x) * k;
  const Y = (y: number) => TEX_H - (y - BOX.y) * k;
  c.fillStyle = "#000";
  c.fillRect(0, 0, TEX_W, TEX_H);
  const arch = () => {
    c.beginPath();
    c.moveTo(X(-0.8), Y(1.0));
    c.lineTo(X(-0.8), Y(3.4));
    c.arc(X(0), Y(3.4), 0.8 * k, Math.PI, 0);
    c.lineTo(X(0.8), Y(1.0));
    c.closePath();
  };
  c.save();
  arch();
  c.clip();
  c.lineJoin = "round";
  c.strokeStyle = "#060505";
  c.lineWidth = 7;
  let seed = 5;
  const pane = (fill: string) => {
    c.fillStyle = fill;
    c.fill();
    // No two pieces come off the sheet the same: each is a touch lighter or darker.
    seed = (seed * 16807) % 2147483647;
    const tone = seed / 2147483647 - 0.5;
    c.fillStyle = tone > 0 ? `rgba(255,255,255,${tone * 0.34})` : `rgba(0,0,20,${-tone * 0.5})`;
    c.fill();
    c.stroke();
  };
  const sx = X(0.06);
  const sy = Y(2.08);
  // Sky: rings of wedges, the widest ring first so nearer rings cover it.
  const rings = [3.2, 2.2, 1.72, 1.3, 0.94];
  const step = (Math.PI * 2) / glass.wedges;
  rings.forEach((radius, ri) => {
    for (let i = 0; i < glass.wedges; i++) {
      const a0 = i * step + ri * step * 0.5 + 0.11;
      c.beginPath();
      c.moveTo(sx, sy);
      c.arc(sx, sy, radius * k, a0, a0 + step);
      c.closePath();
      pane(glass.sky[(i * 2 + ri * 3 + (i % 4 === 0 ? 1 : 0)) % glass.sky.length]);
    }
  });
  // The sun's rays, then the sun itself in three rings.
  for (let i = 0; i < glass.wedges * 2; i++) {
    c.beginPath();
    c.moveTo(sx, sy);
    c.arc(sx, sy, 0.66 * k, (i * step) / 2, ((i + 1) * step) / 2);
    c.closePath();
    pane(glass.rays[i % 2]);
  }
  [0.46, 0.33, 0.2].forEach((radius, i) => {
    c.beginPath();
    c.arc(sx, sy, radius * k, 0, Math.PI * 2);
    pane(glass.sun[2 - i]);
  });
  // Four ranges of hills, far to near, each cut into panes by a few slanting leads.
  const ranges = [
    { base: 2.02, rise: 0.13, wave: 3.1, shift: 0.4 },
    { base: 1.74, rise: 0.11, wave: 4.2, shift: 2.1 },
    { base: 1.47, rise: 0.09, wave: 3.4, shift: 4.0 },
    { base: 1.2, rise: 0.07, wave: 5.0, shift: 1.2 },
  ];
  ranges.forEach((r, i) => {
    const top = (x: number) => r.base + r.rise * Math.sin(x * r.wave + r.shift);
    const cuts = [-0.9, -0.42 + i * 0.07, 0.02 - i * 0.09, 0.45 + i * 0.05, 0.9];
    for (let j = 0; j < cuts.length - 1; j++) {
      c.beginPath();
      for (let s = 0; s <= 12; s++) {
        const x = cuts[j] + ((cuts[j + 1] - cuts[j]) * s) / 12;
        if (s === 0) c.moveTo(X(x), Y(top(x)));
        else c.lineTo(X(x), Y(top(x)));
      }
      c.lineTo(X(cuts[j + 1] + 0.08), Y(0.8));
      c.lineTo(X(cuts[j] + 0.08), Y(0.8));
      c.closePath();
      c.globalAlpha = 1;
      pane(glass.hills[i]);
      // Alternate panes are a shade lighter, as hand-cut glass from different sheets would be.
      if ((i + j) % 2 === 0) {
        c.fillStyle = "rgba(255,255,255,0.13)";
        c.fill();
        c.stroke();
      }
    }
  });
  // Iron saddle bars across the panel, and the heavy lead round the edge.
  c.lineWidth = 4;
  for (const y of [1.62, 2.5, 3.38]) {
    c.beginPath();
    c.moveTo(X(-0.9), Y(y));
    c.lineTo(X(0.9), Y(y));
    c.stroke();
  }
  c.restore();
  c.strokeStyle = "#060505";
  c.lineWidth = 12;
  arch();
  c.stroke();
  return cv;
}

const VERTEX = `attribute vec2 position; void main(){ gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAGMENT = `precision highp float;
uniform vec2 uRes;
uniform float uZoom;
uniform float uPan;
uniform vec3 uSun;
uniform vec3 uSunCol;
uniform vec3 uMean;
uniform vec3 uFloor;
uniform vec3 uWall;
uniform float uHaze;
uniform sampler2D uSharp;
uniform sampler2D uMid;
uniform sampler2D uSoft;

const vec2 BMIN = vec2(${BOX.x.toFixed(3)}, ${BOX.y.toFixed(3)});
const vec2 BSIZE = vec2(${BOX.w.toFixed(3)}, ${BOX.h.toFixed(3)});
const float SIDE = -3.6;
const float PAIR = 1.3;
const vec3 BALL = vec3(-0.02, 0.42, 1.95);
const float BALLR = 0.42;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){ return noise(p) * 0.55 + noise(p * 2.1 + 7.0) * 0.3 + noise(p * 4.3 + 19.0) * 0.15; }

// The colour of the glass at a point on the window wall, at a chosen softness from 0 to 2.
vec3 glassAt(vec2 xy, float soft){
  // Two lancets side by side, the second a mirror image of the first.
  xy.x = abs(xy.x) - PAIR;
  vec2 uv = (xy - BMIN) / BSIZE;
  if (uv.x < -0.3 || uv.x > 1.3 || uv.y < -0.3 || uv.y > 1.3) return vec3(0.0);
  uv = clamp(uv, 0.0, 1.0);
  vec3 a = texture2D(uSharp, uv).rgb;
  vec3 b = texture2D(uMid, uv).rgb;
  vec3 c = texture2D(uSoft, uv).rgb;
  vec3 col = soft < 1.0 ? mix(a, b, clamp(soft, 0.0, 1.0)) : mix(b, c, clamp(soft - 1.0, 0.0, 1.0));
  return col * col;
}

// Distance outside the arched opening (negative inside).
float archDist(vec2 p){
  p.x = abs(abs(p.x) - PAIR);
  if (p.y > 3.4) return length(p - vec2(0.0, 3.4)) - 0.8;
  vec2 d = vec2(p.x - 0.8, 1.0 - p.y);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

// Sunlight that has come through the window to reach p, with the stone ball in the way or not.
vec3 sunAt(vec3 p, float extraSoft, bool ballShadow){
  if (p.z <= 0.001) return vec3(0.0);
  float u = p.z / uSun.z;
  vec3 q = p - uSun * u;
  vec3 g = glassAt(q.xy, clamp(u * 0.24 + extraSoft, 0.12, 2.0));
  if (ballShadow) {
    vec3 oc = BALL - p;
    float along = dot(oc, -uSun);
    if (along > 0.0) {
      float miss = length(oc + uSun * along);
      float pen = 0.012 + 0.03 * along;
      g *= smoothstep(BALLR - pen, BALLR + pen, miss);
    }
  }
  return g * uSunCol;
}

void main(){
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y * uZoom;
  vec3 ro = vec3(uPan, 2.8, 6.6);
  vec3 ta = vec3(uPan, 1.9, 1.0);
  vec3 fw = normalize(ta - ro);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  // A little downward shift of the lens, as an architectural camera has, keeps the window upright.
  vec3 rd = normalize(fw * 1.7 + rt * uv.x + up * (uv.y - 0.2));
  vec3 L = -uSun;

  // What the ray meets first: floor, window wall, side wall or the ball.
  float t = 1e5;
  float id = 0.0;
  if (rd.y < 0.0) { float tf = -ro.y / rd.y; if (tf < t) { t = tf; id = 1.0; } }
  if (rd.z < 0.0) { float tw = -ro.z / rd.z; if (tw < t) { t = tw; id = 2.0; } }
  if (rd.x < 0.0) { float ts = (SIDE - ro.x) / rd.x; if (ts < t) { t = ts; id = 3.0; } }
  vec3 oc = ro - BALL;
  float bb = dot(oc, rd);
  float disc = bb * bb - dot(oc, oc) + BALLR * BALLR;
  if (disc > 0.0) { float tb = -bb - sqrt(disc); if (tb > 0.0 && tb < t) { t = tb; id = 4.0; } }
  vec3 p = ro + rd * t;

  // Where the pool of light lies on the floor: it lights the rest of the room from below.
  float poolReach = 2.4 / -uSun.y;
  vec3 pool = vec3(uSun.x * poolReach, 0.0, uSun.z * poolReach);
  vec3 bounceCol = uMean * uSunCol * uFloor;
  vec3 skylight = vec3(0.05, 0.044, 0.04);
  vec3 col = vec3(0.0);

  if (id < 1.5) {
    // Limestone flags laid in courses, each a slightly different tone, with fine joints.
    vec2 g = vec2(p.x / 1.3, p.z / 0.86);
    g.x += floor(g.y) * 0.5;
    vec2 cell = floor(g);
    vec2 f = fract(g);
    float joint = smoothstep(0.0, 0.012, min(min(f.x, 1.0 - f.x) * 1.3, min(f.y, 1.0 - f.y) * 0.86));
    vec3 albedo = uFloor * (0.9 + 0.14 * hash(cell)) * (0.84 + 0.3 * fbm(p.xz * 3.0 + cell * 3.0)) * (0.94 + 0.12 * noise(p.xz * 60.0));
    albedo = mix(albedo * 0.68, albedo, joint);
    vec3 direct = sunAt(p, 0.0, true) * max(L.y, 0.0) * 4.4;
    float under = 1.0 - 0.55 * exp(-dot(p.xz - BALL.xz, p.xz - BALL.xz) * 5.5);
    float corner = (1.0 - 0.35 * exp(-p.z * 3.2)) * (1.0 - 0.3 * exp(-(p.x - SIDE) * 3.0));
    vec3 amb = skylight * 1.25 + bounceCol * 0.16 / (1.0 + dot(p - pool, p - pool) * 0.3);
    col = albedo * (direct + amb * under * corner);
    // Worn stone has a soft polish: it mirrors the bright window, more so at a glancing angle.
    vec3 r = vec3(rd.x, -rd.y, rd.z);
    if (r.z < 0.0) {
      vec3 q = p + r * (-p.z / r.z);
      float fres = 0.03 + 0.6 * pow(1.0 - max(-rd.y, 0.0), 5.0);
      float rough = 0.75 + 0.5 * fbm(p.xz * 7.0);
      col += glassAt(q.xy, rough + q.y * 0.12) * fres * 2.0 * (0.6 + 0.4 * joint) * under;
    }
  } else if (id < 2.5) {
    float d = archDist(p.xy);
    if (d < 0.0) {
      // The glass itself: streaky, a little seedy, brightest where the sun stands behind it.
      vec3 g = glassAt(p.xy, 0.0);
      float streak = 0.74 + 0.5 * fbm(vec2(p.x * 2.2 + p.y * 0.8, p.y * 5.0 - p.x * 2.6));
      float seed = smoothstep(0.84, 0.9, noise(p.xy * 70.0));
      float toSun = pow(max(dot(rd, L), 0.0), 14.0);
      col = g * (streak * 0.74 + seed * 0.2) * (0.8 + 0.5 * uSunCol) + g * uSunCol * toSun * 4.0;
      col += uSunCol * pow(max(dot(rd, L), 0.0), 900.0) * dot(g, vec3(0.4)) * 4.0;
    } else {
      // Plaster, with a dressed stone surround and a dark reveal where the wall is cut through.
      float m = fbm(p.xy * 1.6) * 0.6 + fbm(p.xy * 9.0) * 0.4;
      vec3 albedo = uWall * (0.88 + 0.2 * m);
      float surround = 1.0 - smoothstep(0.12, 0.124, d);
      albedo = mix(albedo, uWall * vec3(1.08, 1.05, 1.0) * (0.92 + 0.16 * noise(p.xy * 26.0)), surround);
      float groove = smoothstep(0.008, 0.0, abs(d - 0.124)) * 0.35 + smoothstep(0.03, 0.0, d) * 0.8;
      float lowGlow = 1.0 / (1.0 + dot(p - pool, p - pool) * 0.2);
      vec3 amb = skylight + bounceCol * 0.5 * lowGlow * (0.4 + 0.6 * smoothstep(3.6, 0.0, p.y));
      float corner = (1.0 - 0.3 * exp(-p.y * 2.6)) * (1.0 - 0.34 * exp(-(p.x - SIDE) * 2.4));
      col = albedo * amb * corner * (1.0 - groove);
      // Glare: the bright glass spreads a little light onto the stone round it.
      col += glassAt(p.xy, 2.0) * uSunCol * 0.5 * albedo * exp(-d * 2.2);
    }
  } else if (id < 3.5) {
    float m = fbm(p.zy * 1.6) * 0.6 + fbm(p.zy * 9.0) * 0.4;
    vec3 albedo = uWall * (0.88 + 0.2 * m);
    vec3 direct = sunAt(p, 0.0, true) * max(L.x, 0.0) * 4.4;
    float lowGlow = 1.0 / (1.0 + dot(p - pool, p - pool) * 0.2);
    vec3 amb = skylight * 1.1 + bounceCol * 0.45 * lowGlow;
    float corner = (1.0 - 0.3 * exp(-p.y * 2.6)) * (1.0 - 0.34 * exp(-p.z * 2.4));
    col = albedo * (direct + amb * corner);
  } else {
    // A ball of pale stone: the pattern wraps round it and its own far side stays in shade.
    vec3 n = normalize(p - BALL);
    float speck = fbm(n.xy * 9.0 + n.z * 5.0);
    vec3 albedo = vec3(0.84, 0.81, 0.76) * (0.92 + 0.12 * speck);
    vec3 direct = sunAt(p, 0.7, false) * max(dot(n, L), 0.0) * 4.4;
    vec3 fromFloor = (sunAt(vec3(p.x, 0.0, p.z + 0.2), 1.2, false) * uFloor * 0.9 + bounceCol * 0.2) * (0.5 - 0.5 * n.y);
    vec3 amb = skylight * (0.75 + 0.5 * n.y) * 1.3;
    col = albedo * (direct + fromFloor + amb * (0.6 + 0.4 * smoothstep(-1.0, 0.2, n.y)));
  }

  // Dust in the air: every shaft carries the colour of the pane it came through.
  if (uHaze > 0.0) {
    float far = min(t, 11.0);
    float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    vec3 shafts = vec3(0.0);
    for (int i = 0; i < 16; i++) {
      vec3 at = ro + rd * ((float(i) + jitter) / 16.0 * far);
      if (at.z > 0.001) {
        vec2 back = (at - uSun * (at.z / uSun.z)).xy;
        back.x = abs(back.x) - PAIR;
        vec2 quv = (back - BMIN) / BSIZE;
        if (quv.x > 0.0 && quv.x < 1.0 && quv.y > 0.0 && quv.y < 1.0) {
          vec3 g = texture2D(uMid, quv).rgb;
          shafts += g * g;
        }
      }
    }
    shafts *= uSunCol;
    float forward = 0.35 + 2.6 * pow(max(dot(rd, L), 0.0), 5.0);
    col += shafts / 16.0 * far * uHaze * forward;
  }

  col *= 1.3;
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(0.4545));
  vec2 v = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - dot(v, v) * 0.42;
  col += (fract(52.9829189 * fract(dot(gl_FragCoord.xy + 31.0, vec2(0.06711056, 0.00583715)))) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}`;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** The sun for a moment of the day (0 morning, 1 evening): its direction into the room and its colour. */
function sunFor(day: number) {
  const turn = (0.5 - day) * 2.1;
  const lift = 0.6 + 0.2 * Math.sin(Math.PI * day);
  const low = 1 - Math.sin(Math.PI * day);
  return {
    dir: [Math.sin(turn) * Math.cos(lift), -Math.sin(lift), Math.cos(turn) * Math.cos(lift)],
    tint: [1.0, mix(0.95, 0.74, low), mix(0.86, 0.5, low)],
  };
}

function clock(day: number) {
  const hours = room.from + (room.to - room.from) * day;
  const h = Math.floor(hours);
  const m = Math.floor(((hours - h) * 60) / 5) * 5;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export default function StainedGlassWindow() {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const [day, setDay] = useState(room.start);
  const [pick, setPick] = useState(room.start);
  const want = useRef({ day: room.start, touched: -1e9 });

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
    const u = { res: at("uRes"), zoom: at("uZoom"), pan: at("uPan"), sun: at("uSun"), sunCol: at("uSunCol") };

    // The window is painted once, then kept at three sharpnesses: light blurs as it travels.
    const sharp = paintGlass();
    const shrink = (from: HTMLCanvasElement, w: number, h: number) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const x = c.getContext("2d")!;
      x.imageSmoothingQuality = "high";
      x.drawImage(from, 0, 0, w, h);
      return c;
    };
    const mid = shrink(shrink(sharp, 256, 480), 112, 210);
    const soft = shrink(shrink(mid, 56, 105), 26, 49);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    [sharp, mid, soft].forEach((source, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(at(["uSharp", "uMid", "uSoft"][i]), i);
    });
    // The average colour of the glass tints the light that bounces round the room.
    const px = soft.getContext("2d")!.getImageData(0, 0, soft.width, soft.height).data;
    const sum = [0, 0, 0];
    for (let i = 0; i < px.length; i += 4) for (let c = 0; c < 3; c++) sum[c] += (px[i + c] / 255) ** 2;
    const count = px.length / 4;
    gl.uniform3f(at("uMean"), (sum[0] / count) * 2.2, (sum[1] / count) * 2.2, (sum[2] / count) * 2.2);
    gl.uniform3fv(at("uFloor"), room.floor);
    gl.uniform3fv(at("uWall"), room.wall);
    gl.uniform1f(at("uHaze"), room.haze);

    let now = want.current.day;
    let raf = 0;
    let visible = true;
    let before = 0;
    let time = 0;
    let shown = clock(now);

    const draw = () => {
      const s = sunFor(now);
      gl.uniform3fv(u.sun, s.dir);
      gl.uniform3fv(u.sunCol, s.tint);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      const w = cv.clientWidth || 1;
      const h = cv.clientHeight || 1;
      const scale = Math.min(Math.min(Math.max(window.devicePixelRatio || 1, 1), 2) * room.quality, Math.sqrt(room.maxPixels / (w * h)));
      cv.width = Math.max(1, Math.round(w * scale));
      cv.height = Math.max(1, Math.round(h * scale));
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(u.res, cv.width, cv.height);
      gl.uniform1f(u.zoom, Math.max(1, 0.82 / (w / h)));
      // Wide screens stand to one side, so the window sits left and the light falls across the middle.
      const wide = Math.min(1, Math.max(0, (w / h - 0.9) / 0.7));
      gl.uniform1f(u.pan, 0.35 + 1.25 * wide * wide * (3 - 2 * wide));
      draw();
      setLive(true);
    };
    const loop = (stamp: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((stamp - (before || stamp)) / 1000, 0.05);
      before = stamp;
      time += dt;
      const w = want.current;
      // Left alone, the afternoon drifts on and comes back.
      if (!reduce && stamp - w.touched > 3000) w.day = room.start + 0.11 * Math.sin(time * 0.22);
      now = reduce ? w.day : mix(now, w.day, 1 - Math.exp(-dt * 3));
      draw();
      const label = clock(now);
      if (label !== shown) {
        shown = label;
        setDay(now);
        // The slider follows the sun unless a hand is on it.
        if (stamp > w.touched) setPick(now);
      }
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

  /** The pointer carries the sun: left edge is morning, right edge is evening. */
  function steer(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" && e.type === "pointermove" && e.buttons === 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    want.current = { day: Math.min(1, Math.max(0, ((e.clientX - r.left) / r.width - 0.08) / 0.84)), touched: performance.now() };
  }

  return (
    <section className="relative isolate w-full overflow-hidden bg-[#141211]">
      <div ref={stage} onPointerMove={steer} onPointerDown={steer} className="relative h-[560px] w-full touch-pan-y select-none sm:h-[700px] lg:h-[760px]">
        {/* The still version, shown until the first frame is drawn and wherever WebGL is missing. */}
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(180deg, #171514 0%, #25211e 58%, #3d342b 58.2%, #171412 100%)" }} />
        <div
          aria-hidden="true"
          className="absolute left-[30%] top-[8%] h-[46%] w-[16%] min-w-[110px] -translate-x-1/2 rounded-t-full"
          style={{ background: "conic-gradient(from 200deg at 52% 62%, #12308f, #3aa0e0, #1f5fcf, #9fd4ee, #4a2f9c, #1f5fcf, #12308f)", boxShadow: "0 0 60px 6px rgba(140,170,255,0.25), inset 0 0 0 5px #0b0a0a" }}
        />
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[66%] h-[26%] w-[30%] min-w-[150px] -translate-x-[40%] opacity-80 blur-xl"
          style={{ background: "linear-gradient(180deg, #5fb233 0%, #f47c12 30%, #ffcf2e 45%, #1f5fcf 70%, #4a2f9c 100%)", transform: "translateX(-40%) skewX(-18deg)" }}
        />
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 pb-5 sm:px-8 sm:pb-7">
        <p className="text-[13px] leading-5 text-[#ddd5ca]">
          <span className="font-semibold text-white">South window</span>
          <span className="mx-2 text-[#8d857a]">/</span>
          <span className="tabular-nums">{clock(day)}</span>
        </p>
        <div className="pointer-events-auto flex h-10 shrink-0 items-center gap-3 rounded-full bg-black/45 pl-4 pr-4 ring-1 ring-white/15 backdrop-blur">
          <label htmlFor="sgw-day" className="hidden text-[13px] font-medium text-white sm:inline">
            Time of day
          </label>
          <input
            id="sgw-day"
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(pick * 100)}
            aria-label="Time of day"
            aria-valuetext={clock(day)}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              setPick(v);
              setDay(v);
              want.current = { day: v, touched: performance.now() + 8000 };
            }}
            className="h-1.5 w-24 cursor-pointer accent-[#ffcf2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:w-32"
          />
        </div>
      </div>
    </section>
  );
}
