import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

/** The word, one balloon per letter. Four to seven capitals sit best. */
const WORD = "HELLO";
/** The paper sweep behind the balloons. The foil picks this colour up on its underside. */
const WALL = "#f2a9b8";
/** How far a balloon stands off the wall, in share of its own size. Larger throws a longer, softer shadow. */
const STANDOFF = 0.16;

const CELL = 256;

const VERT = `attribute vec2 a;
uniform vec2 u_res;
uniform vec2 u_at;
uniform vec2 u_size;
uniform float u_turn;
varying vec2 v_uv;
void main(){
  vec2 p = a * 0.5 * u_size;
  float c = cos(u_turn), s = sin(u_turn);
  p = vec2(p.x * c - p.y * s, p.x * s + p.y * c) + u_at;
  v_uv = a * 0.5 + 0.5;
  gl_Position = vec4(p.x / u_res.x * 2.0 - 1.0, 1.0 - p.y / u_res.y * 2.0, 0.0, 1.0);
}`;

const FRAG = `precision highp float;
const float CELL = 256.0;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform sampler2D u_soft;
uniform float u_cell;
uniform float u_cells;
uniform float u_turn;
uniform vec2 u_tilt;
uniform vec2 u_lamp;
uniform vec3 u_wall;
uniform float u_shadow;

// The room the foil mirrors, by the direction a ray leaves the surface (y is up here).
vec3 room(vec3 r){
  float up = r.y;
  vec3 floorNear = u_wall * 1.08 + 0.06;
  vec3 floorFar = u_wall * 0.5;
  vec3 mid = mix(vec3(0.80, 0.79, 0.84), u_wall, 0.18);
  vec3 dark = vec3(0.17, 0.13, 0.19);
  vec3 ceiling = vec3(0.50, 0.49, 0.54);
  vec3 col = mix(floorFar, floorNear, smoothstep(-0.95, -0.28, up));
  col = mix(col, mix(mid, vec3(0.93, 0.93, 0.96), smoothstep(-0.2, 0.1, up)), smoothstep(-0.3, -0.08, up));
  col = mix(col, dark, smoothstep(0.08, 0.2, up));
  col = mix(col, ceiling, smoothstep(0.62, 0.9, up));
  // The big softbox overhead. It slides with the lamp.
  float box = smoothstep(0.26, 0.34, up) * (1.0 - smoothstep(0.66, 0.78, up));
  box *= 1.0 - smoothstep(0.62, 0.78, abs(r.x - u_lamp.x * 0.55));
  col = mix(col, vec3(1.0, 0.99, 0.97), box);
  // Two tall strip lights at the sides, cut by a black flag.
  float strip = (1.0 - smoothstep(0.035, 0.07, abs(abs(r.x + u_lamp.x * 0.2) - 0.74))) * smoothstep(-0.5, -0.2, up) * (1.0 - smoothstep(0.5, 0.7, up));
  col = mix(col, vec3(1.0), strip * 0.9);
  float flag = (1.0 - smoothstep(0.03, 0.09, abs(abs(r.x) - 0.9))) * (1.0 - smoothstep(0.2, 0.6, abs(up)));
  col = mix(col, dark, flag * 0.7);
  return col;
}

vec2 facing(vec2 texel){
  vec4 p = texture2D(u_tex, vec2((texel.x / CELL + u_cell) / u_cells, texel.y / CELL)) * 255.0;
  return vec2(p.r * 256.0 + p.g, p.b * 256.0 + p.a) / 32767.5 - 1.0;
}

void main(){
  vec2 uv = vec2((v_uv.x + u_cell) / u_cells, v_uv.y);
  // t: r is height, g is the outline, b is the soft shadow, a is the shade in the crease.
  vec4 t = texture2D(u_soft, uv);
  if (u_shadow > 0.5) {
    float s = t.b * 0.36;
    gl_FragColor = vec4(u_wall * 0.2 * s, s);
    return;
  }
  if (t.g < 0.004) discard;
  // The facing direction is stored at 16 bits a side, so it is blended by hand between the four nearest texels.
  vec2 px = clamp(v_uv * CELL - 0.5, 0.0, CELL - 1.001);
  vec2 f = fract(px);
  vec2 i = floor(px) + 0.5;
  vec2 nxy = mix(mix(facing(i), facing(i + vec2(1.0, 0.0)), f.x), mix(facing(i + vec2(0.0, 1.0)), facing(i + vec2(1.0, 1.0)), f.x), f.y);
  float c = cos(u_turn), s = sin(u_turn);
  nxy = vec2(nxy.x * c - nxy.y * s, nxy.x * s + nxy.y * c);
  // Screen y runs downward, the room's y runs upward.
  vec3 n = normalize(vec3(nxy.x + u_tilt.x, -(nxy.y + u_tilt.y), sqrt(max(1.0 - dot(nxy, nxy), 0.02))));
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
  vec3 col = room(r);
  // Foil is brighter at glancing angles and never quite a perfect mirror.
  col = mix(col, vec3(1.0), pow(1.0 - n.z, 3.0) * 0.28);
  vec3 lamp = normalize(vec3(u_lamp.x * 0.7, 0.62 + u_lamp.y * 0.3, 0.75));
  float hot = pow(max(dot(n, normalize(lamp + vec3(0.0, 0.0, 1.0))), 0.0), 260.0);
  col += vec3(1.0) * hot * 1.4;
  // The crease where the pillow meets its flat welded seam sits in shade.
  col *= t.a;
  gl_FragColor = vec4(col * t.g, t.g);
}`;

/** Three passes of a box blur, which is close to a true soft blur and cheap. */
function soften(src: Float32Array, radius: number) {
  const n = CELL;
  const a = Float32Array.from(src);
  const b = new Float32Array(n * n);
  const span = radius * 2 + 1;
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < n; y++) {
      let sum = 0;
      for (let x = -radius; x <= radius; x++) sum += a[y * n + Math.min(n - 1, Math.max(0, x))];
      for (let x = 0; x < n; x++) {
        b[y * n + x] = sum / span;
        sum += a[y * n + Math.min(n - 1, x + radius + 1)] - a[y * n + Math.max(0, x - radius)];
      }
    }
    for (let x = 0; x < n; x++) {
      let sum = 0;
      for (let y = -radius; y <= radius; y++) sum += b[Math.min(n - 1, Math.max(0, y)) * n + x];
      for (let y = 0; y < n; y++) {
        a[y * n + x] = sum / span;
        sum += b[Math.min(n - 1, y + radius + 1) * n + x] - b[Math.max(0, y - radius) * n + x];
      }
    }
  }
  return a;
}

function grain(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const h = (i: number, j: number) => {
    const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const fx = x - xi;
  const fy = y - yi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
}

/** Inflate one letter: returns its surface (which way each point faces, how high it stands, its outline), its soft shadow and its width. */
function inflate(letter: string, seed: number) {
  const n = CELL;
  const cv = document.createElement("canvas");
  cv.width = n;
  cv.height = n;
  const c = cv.getContext("2d", { willReadFrequently: true })!;
  let px = 196;
  const face = (size: number) => `900 ${size}px "Arial Black", "Segoe UI Black", "Helvetica Neue", Impact, sans-serif`;
  c.font = face(px);
  const first = c.measureText(letter);
  if (first.width > 164) px *= 164 / first.width;
  c.font = face(px);
  const m = c.measureText(letter);
  const rise = m.actualBoundingBoxAscent || px * 0.72;
  const drop = m.actualBoundingBoxDescent || 0;
  c.textAlign = "center";
  c.lineJoin = "round";
  c.lineWidth = 15;
  c.fillStyle = "#fff";
  c.strokeStyle = "#fff";
  c.strokeText(letter, n / 2, n / 2 + (rise - drop) / 2);
  c.fillText(letter, n / 2, n / 2 + (rise - drop) / 2);
  const raw = c.getImageData(0, 0, n, n).data;
  const mask = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) mask[i] = raw[i * 4 + 3] / 255;

  const tight = soften(mask, 6);
  const wide = soften(mask, 15);
  const broad = soften(mask, 30);
  const round = (v: number) => Math.sqrt(Math.max(0, 1 - (1 - v) * (1 - v)));
  const height = new Float32Array(n * n);
  for (let y = 1; y < n - 1; y++) {
    for (let x = 1; x < n - 1; x++) {
      const i = y * n + x;
      const body = Math.min(1, Math.max(0, (tight[i] - 0.5) / 0.46));
      const pillow = Math.min(1, Math.max(0, (wide[i] - 0.5) / 0.4));
      let h = 0.3 * round(body) + 0.48 * round(pillow) + 0.22 * Math.min(1, broad[i] * 1.5) * body;
      // Creases run in from the welded seam, across the way the surface slopes.
      const gx = wide[i + 1] - wide[i - 1];
      const gy = wide[i + n] - wide[i - n];
      const gl = Math.hypot(gx, gy) + 1e-5;
      const along = (x * -gy + y * gx) / gl;
      const seam = Math.exp(-Math.pow((tight[i] - 0.5) / 0.2, 2));
      const flank = tight[i] > 0.5 ? (1 - h) * (1 - h) : 0;
      const ripple = Math.sin(along * 0.3 + grain(x * 0.035 + seed, y * 0.035) * 9) * (0.35 + 0.65 * grain(x * 0.07, y * 0.07 + seed));
      h += ripple * (0.009 * seam + 0.034 * flank);
      // Big, slow dents so no two balloons catch the light alike.
      h += (grain(x * 0.018 + seed * 3, y * 0.018) - 0.5) * 0.12 * body;
      height[i] = h;
    }
  }
  const smooth = soften(height, 1);
  const surface = new Uint8Array(n * n * 4).fill(128);
  const extra = new Uint8Array(n * n * 4);
  const DEPTH = 30;
  for (let y = 1; y < n - 1; y++) {
    for (let x = 1; x < n - 1; x++) {
      const i = y * n + x;
      const dx = (smooth[i + 1] - smooth[i - 1]) * 0.5 * DEPTH;
      const dy = (smooth[i + n] - smooth[i - n]) * 0.5 * DEPTH;
      const len = Math.hypot(dx, dy, 1);
      // Sixteen bits for each of the two slopes. Eight would show as rings in a mirror finish.
      const fx = Math.round(((-dx / len) * 0.5 + 0.5) * 65535);
      const fy = Math.round(((-dy / len) * 0.5 + 0.5) * 65535);
      surface[i * 4] = fx >> 8;
      surface[i * 4 + 1] = fx & 255;
      surface[i * 4 + 2] = fy >> 8;
      surface[i * 4 + 3] = fy & 255;
      extra[i * 4] = Math.round(Math.min(1, Math.max(0, smooth[i])) * 255);
      // The outline reaches a little past the letter: that margin is the flat seam.
      const edge = Math.min(1, Math.max(0, (tight[i] - 0.2) / 0.1));
      extra[i * 4 + 1] = Math.round(edge * edge * (3 - 2 * edge) * 255);
      // The crease where the pillow meets its seam sits in shade.
      extra[i * 4 + 3] = Math.round((1 - 0.42 * Math.exp(-Math.pow((tight[i] - 0.53) / 0.06, 2))) * 255);
    }
  }
  const shade = soften(mask, 11);
  for (let i = 0; i < n * n; i++) extra[i * 4 + 2] = Math.round(Math.min(1, shade[i] * 1.15) * 255);
  return { surface, extra, width: (m.width + 15) / n };
}

function rgb(hex: string) {
  const v = parseInt(hex.slice(1), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

type Body = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; a: number; va: number; w: number; vw: number; size: number };

export default function SilverFoilBalloonLettersOnStringsThatBobBumpAndMirrorTheStudio() {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const strings = useRef<SVGSVGElement>(null);
  const pointer = useRef({ x: -999, y: -999, vx: 0, vy: 0, at: -1e6, poke: false });
  const wave = useRef(0);
  const [live, setLive] = useState(false);
  const letters = [...WORD];

  useEffect(() => {
    const el = stage.current;
    const cv = canvas.current;
    const svg = strings.current;
    if (!el || !cv || !svg) return;
    const gl = cv.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const at = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(at);
    gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(program, name);
    const uni = { res: u("u_res"), at: u("u_at"), size: u("u_size"), turn: u("u_turn"), cell: u("u_cell"), tilt: u("u_tilt"), lamp: u("u_lamp"), shadow: u("u_shadow") };

    // Every letter is inflated once and packed side by side into two textures.
    const count = letters.length;
    const baked = letters.map((ch, i) => inflate(ch, i * 7.3 + 1));
    const atlas = new Uint8Array(CELL * count * CELL * 4);
    const soft = new Uint8Array(CELL * count * CELL * 4);
    baked.forEach((b, k) => {
      for (let y = 0; y < CELL; y++) {
        atlas.set(b.surface.subarray(y * CELL * 4, (y + 1) * CELL * 4), (y * CELL * count + k * CELL) * 4);
        soft.set(b.extra.subarray(y * CELL * 4, (y + 1) * CELL * 4), (y * CELL * count + k * CELL) * 4);
      }
    });
    const texture = (unit: number, filter: number, data: Uint8Array) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, CELL * count, CELL, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    };
    texture(0, gl.NEAREST, atlas);
    texture(1, gl.LINEAR, soft);
    gl.uniform1i(u("u_tex"), 0);
    gl.uniform1i(u("u_soft"), 1);
    gl.uniform1f(u("u_cells"), count);
    gl.uniform3fv(u("u_wall"), rgb(WALL));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const bodies: Body[] = letters.map(() => ({ hx: 0, hy: 0, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, w: 0, vw: 0, size: 100 }));
    const paths = Array.from(svg.querySelectorAll("path"));
    let W = 0;
    let H = 0;
    let ratio = 1;
    let raf = 0;
    let visible = true;
    let last = 0;
    let seenWave = wave.current;
    let nextGust = 1.1;
    const queue: { at: number; i: number; fx: number; fy: number }[] = [];
    const started = performance.now();
    const lamp = { x: 0.15, y: 0 };

    const layout = () => {
      W = el.clientWidth;
      H = el.clientHeight;
      if (!W || !H) return;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * ratio);
      cv.height = Math.round(H * ratio);
      gl.viewport(0, 0, cv.width, cv.height);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const total = baked.reduce((sum, b) => sum + b.width, 0);
      // Balloons crowd each other a little, the way a bunch does.
      const size = Math.min((W * 0.9) / (total * 0.93), H * 0.52, 300);
      let x = (W - total * 0.93 * size) / 2;
      bodies.forEach((b, i) => {
        const w = baked[i].width * 0.93 * size;
        b.size = size;
        b.hx = x + w / 2;
        b.hy = H * 0.43 + (i % 2 ? 1 : -1) * size * 0.035;
        x += w;
      });
    };

    const kick = (i: number, fx: number, fy: number) => {
      const b = bodies[i];
      if (!b) return;
      b.vx += fx;
      b.vy += fy;
      b.va += (fx * 0.004 + (i % 2 ? 0.4 : -0.4)) * Math.min(1, Math.hypot(fx, fy) / 300);
      b.vw += Math.hypot(fx, fy) * 0.006;
    };

    const draw = (t: number) => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uni.res, cv.width, cv.height);
      gl.uniform2f(uni.lamp, lamp.x, lamp.y);
      for (let pass = 0; pass < 2; pass++) {
        gl.uniform1f(uni.shadow, pass === 0 ? 1 : 0);
        bodies.forEach((b, i) => {
          const s = b.size * ratio;
          const lift = STANDOFF * (1 + b.y / (b.size * 0.6));
          const dx = pass === 0 ? s * lift * 0.55 : 0;
          const dy = pass === 0 ? s * lift * 0.95 : 0;
          const grow = pass === 0 ? 1.1 : 1;
          gl.uniform2f(uni.at, (b.hx + b.x) * ratio + dx, (b.hy + b.y) * ratio + dy);
          gl.uniform2f(uni.size, s * (1 + b.w) * grow, s * (1 - b.w) * grow);
          gl.uniform1f(uni.turn, b.a);
          gl.uniform1f(uni.cell, i);
          gl.uniform2f(uni.tilt, b.vx * 0.0007 + Math.sin(t * 0.7 + i * 1.9) * 0.05, b.vy * 0.0007 + Math.cos(t * 0.55 + i * 1.3) * 0.04);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        });
      }
      // Each string hangs from the foot of its balloon to a point off the bottom of the stage.
      bodies.forEach((b, i) => {
        const fx = b.hx + b.x - Math.sin(b.a) * b.size * 0.3;
        const fy = b.hy + b.y + Math.cos(b.a) * b.size * 0.3;
        const ex = W / 2 + (b.hx - W / 2) * 0.22;
        paths[i]?.setAttribute("d", `M${fx.toFixed(1)} ${fy.toFixed(1)} C${(fx + b.vx * 0.05).toFixed(1)} ${(fy + (H - fy) * 0.5).toFixed(1)} ${ex.toFixed(1)} ${(H - (H - fy) * 0.35).toFixed(1)} ${ex.toFixed(1)} ${H + 20}`);
      });
    };

    const step = (dt: number, t: number, stamp: number) => {
      const p = pointer.current;
      const idle = stamp - p.at > 1800;
      // With nobody about, a draught bumps one balloon every few seconds.
      if (idle && t > nextGust) {
        const i = Math.floor(grain(t * 3.1, 7) * count) % count;
        const dir = grain(t, 3) > 0.5 ? 1 : -1;
        queue.push({ at: t, i, fx: dir * (260 + grain(t, 9) * 160), fy: -120 });
        nextGust = t + 2.4 + grain(t, 5) * 1.6;
      }
      if (seenWave !== wave.current) {
        seenWave = wave.current;
        bodies.forEach((_, i) => queue.push({ at: t + i * 0.085, i, fx: (i % 2 ? -1 : 1) * 90, fy: -420 }));
      }
      for (let k = queue.length - 1; k >= 0; k--) {
        if (queue[k].at <= t) {
          kick(queue[k].i, queue[k].fx, queue[k].fy);
          queue.splice(k, 1);
        }
      }
      const tx = idle ? Math.sin(t * 0.35) * 0.5 : (p.x / W) * 2 - 1;
      const ty = idle ? Math.sin(t * 0.27) * 0.3 : 1 - (p.y / H) * 2;
      lamp.x += (tx - lamp.x) * Math.min(1, dt * 4);
      lamp.y += (ty - lamp.y) * Math.min(1, dt * 4);

      bodies.forEach((b, i) => {
        const cx = b.hx + b.x;
        const cy = b.hy + b.y;
        if (!idle) {
          const dx = cx - p.x;
          const dy = cy - p.y;
          const reach = b.size * 0.5;
          const d = Math.hypot(dx, dy) + 0.001;
          if (d < reach) {
            const push = 1 - d / reach;
            const speed = Math.hypot(p.vx, p.vy);
            b.vx += ((dx / d) * 1500 * push + p.vx * push * 5) * dt;
            b.vy += ((dy / d) * 1500 * push + p.vy * push * 5) * dt;
            b.va += ((dx * p.vy - dy * p.vx) / (reach * reach)) * push * 0.01 * dt * 60;
            b.vw += speed * push * 0.0009 * dt * 60;
            if (p.poke) kick(i, (dx / d) * 520, (dy / d) * 520 - 120);
          }
        }
        // A light, floaty tether: it overshoots and takes a while to settle.
        const bob = Math.sin(t * 0.9 + i * 1.7) * b.size * 0.022;
        b.vx += (-b.x * 34 - b.vx * 2.6) * dt;
        b.vy += ((bob - b.y) * 34 - b.vy * 2.6) * dt;
        const lean = Math.sin(t * 0.6 + i * 2.3) * 0.035 + (b.x / b.size) * 0.5;
        b.va += ((lean - b.a) * 30 - b.va * 2.4) * dt;
        b.vw += (-b.w * 260 - b.vw * 9) * dt;
      });
      p.poke = false;
      p.vx *= Math.pow(0.02, dt);
      p.vy *= Math.pow(0.02, dt);
      // Neighbours that swing into each other bounce apart.
      for (let i = 0; i < count - 1; i++) {
        const l = bodies[i];
        const r = bodies[i + 1];
        const rest = r.hx - l.hx;
        const gap = r.hx + r.x - (l.hx + l.x);
        const least = rest * 0.8;
        if (gap < least) {
          const fix = (least - gap) / 2;
          l.x -= fix;
          r.x += fix;
          const swap = (l.vx - r.vx) * 0.75;
          if (swap > 0) {
            l.vx -= swap;
            r.vx += swap;
            l.vw += swap * 0.0016;
            r.vw += swap * 0.0016;
            r.va += swap * 0.0012;
            l.va -= swap * 0.0012;
          }
        }
      }
      bodies.forEach((b) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.a += b.va * dt;
        b.w = Math.max(-0.16, Math.min(0.16, b.w + b.vw * dt));
      });
    };

    const loop = (stamp: number) => {
      const t = (stamp - started) / 1000;
      const dt = Math.min(last ? (stamp - last) / 1000 : 0.016, 0.033);
      last = stamp;
      step(dt, t, stamp);
      draw(t);
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (reduce) {
        draw(0);
        return;
      }
      if (!raf && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    const ro = new ResizeObserver(() => {
      layout();
      if (reduce) draw(0);
    });
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    layout();
    setLive(true);
    wake();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
    };
    // The word is a constant, so the letters never change between renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  function track(e: ReactPointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const p = pointer.current;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const now = performance.now();
    const dt = Math.max(8, now - p.at) / 1000;
    if (now - p.at < 200) {
      p.vx = p.vx * 0.5 + ((x - p.x) / dt) * 0.5;
      p.vy = p.vy * 0.5 + ((y - p.y) / dt) * 0.5;
    }
    p.x = x;
    p.y = y;
    p.at = now;
    if (e.type === "pointerdown") p.poke = true;
  }

  return (
    <section className="relative isolate flex min-h-[740px] w-full flex-col items-center overflow-hidden px-4" style={{ backgroundColor: WALL }}>
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(75% 60% at 50% 38%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 55%), linear-gradient(180deg, rgba(120,30,60,0) 55%, rgba(120,30,60,0.2) 100%)" }} />

      <style>{`
        @keyframes silver-foil-balloon-letters-sheen { from { background-position: 50% 0%; } to { background-position: 50% 100%; } }
        .sfb-still { animation: silver-foil-balloon-letters-sheen 3.4s ease-in-out infinite alternate; filter: drop-shadow(14px 22px 14px rgba(120, 30, 60, 0.3)); }
        @media (prefers-reduced-motion: reduce) { .sfb-still { animation: none; } }
      `}</style>
      <div ref={stage} onPointerMove={track} onPointerDown={track} className="absolute inset-0 touch-pan-y">
        <svg ref={strings} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`} fill="none">
          {letters.map((_, i) => (
            <path key={i} stroke="rgba(255,255,255,0.75)" strokeWidth="1.1" strokeLinecap="round" />
          ))}
        </svg>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`} />
      </div>

      {/* The real word. It is what assistive technology and search read, and what shows if the balloons cannot be drawn. */}
      <h2
        className={`pointer-events-none relative mt-[250px] select-none text-center text-[19vw] font-black leading-none tracking-tight sm:text-[150px] ${live ? "text-transparent" : "sfb-still bg-clip-text text-transparent"}`}
        style={live ? undefined : { backgroundImage: "linear-gradient(180deg, #ffffff 0%, #f4f4f8 38%, #3b2a3a 50%, #d98ea0 62%, #ffe3ea 100%)", backgroundSize: "100% 140%" }}
      >
        {WORD}
      </h2>

      <div className="pointer-events-none relative mt-auto flex w-full max-w-[880px] items-center justify-between gap-4 pb-9 text-[13px]">
        <p className="text-[#5a1f33]">
          <span className="font-semibold text-[#3a0f20]">Foil letters</span>
          <span className="mx-2 opacity-50">/</span>
          sweep through them or tap one
        </p>
        {!reduce && (
          <button
            type="button"
            onClick={() => (wave.current += 1)}
            className="pointer-events-auto min-h-[40px] shrink-0 rounded-full bg-[#3a0f20] px-5 font-medium text-white shadow-[0_10px_20px_-10px_rgba(58,15,32,0.7)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a0f20] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2a9b8]"
          >
            Bounce them
          </button>
        )}
      </div>
    </section>
  );
}
