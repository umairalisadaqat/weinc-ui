import { useEffect, useRef, useState } from "react";

// Everything about the garden. Colours are red, green, blue from 0 to 1.
const garden = {
  speed: 1, // how fast the sun and the branch move; 0 stops the afternoon
  grooves: 34, // rake lines across the short side of the block
  rings: 5, // rake lines circling each stone before the straight lines take over
  relief: 0.24, // how deep the rake cut; 0.15 is a light comb, 0.45 a heavy one
  canopy: 0.8, // darkness of the branch shadow in the corner; 0 clears the sky
  quality: 0.9, // share of the device pixels that are drawn
  maxPixels: 1000000, // the canvas never draws more pixels than this
  sand: [0.93, 0.85, 0.71],
  skylight: [0.64, 0.61, 0.66], // the colour of the shadows
  stone: [0.25, 0.25, 0.27],
  // x and y place a stone, from -0.5 to 0.5 across the block. size is in rake lines, stretch makes it long,
  // turn spins it (in radians) and height says how far it stands out of the sand.
  stones: [
    { x: 0.2, y: 0.08, size: 3.3, stretch: 1.45, turn: 0.5, height: 3.4 },
    { x: -0.27, y: -0.2, size: 2.1, stretch: 1.2, turn: -0.9, height: 2.0 },
    { x: -0.14, y: 0.27, size: 1.25, stretch: 1.3, turn: 2.2, height: 1.1 },
  ],
};

const STONES = garden.stones.length;

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uGrooves;
uniform float uRings;
uniform float uRelief;
uniform float uCanopy;
uniform vec2 uSun;
uniform vec4 uStones[${STONES}];
uniform vec2 uShape[${STONES}];
uniform vec3 uSand;
uniform vec3 uSky;
uniform vec3 uStone;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

// One stone. x is the distance from its edge in rake lines (negative inside); y runs from 0 at its
// middle to 1 at its edge. The outline is an ellipse with a few lumps, so no two stones match.
vec2 stoneEdge(vec2 p, vec4 s, vec2 shape) {
  vec2 d = p - s.xy + 0.001;
  float c = cos(shape.x);
  float si = sin(shape.x);
  d = vec2(d.x * c + d.y * si, -d.x * si + d.y * c);
  float a = atan(d.y, d.x * 0.8);
  float lumps = 1.0 + 0.05 * sin(3.0 * a + shape.x * 7.0) + 0.03 * sin(5.0 * a + 1.3 + shape.x * 3.0);
  vec2 r = s.z * lumps * vec2(s.w, 1.0);
  float k1 = length(d / r);
  float k2 = length(d / (r * r));
  return vec2(k1 * (k1 - 1.0) / k2, k1);
}

// Height of the garden at a point: x is the height, y the distance to the nearest stone.
vec2 ground(vec2 p) {
  float near = 1000.0;
  float rock = 0.0;
  for (int i = 0; i < ${STONES}; i++) {
    vec2 d = stoneEdge(p, uStones[i], uShape[i]);
    near = min(near, d.x);
    // A river stone: steep where it meets the sand, nearly flat on top.
    float t = min(d.y, 1.0);
    rock = max(rock, uShape[i].y * sqrt(1.0 - t * t * t * t));
  }
  // Straight lines pulled by hand are never quite straight.
  float line = p.y * 0.9 + p.x * 0.44 + 0.3 * sin(p.x * 0.19 + 1.3) + 0.14 * sin(p.x * 0.47 + p.y * 0.13);
  float c = near < uRings ? near : line;
  float s = sin(3.14159265 * c);
  float furrow = 1.0 - sqrt(s * s + 0.035);
  // The comb lifts where the straight lines meet the outermost ring, which leaves a smooth seam.
  float sandH = uRelief * furrow * smoothstep(0.0, 0.5, near) * smoothstep(0.0, 0.3, abs(near - uRings));
  sandH += 0.34 * exp(-max(near, 0.0) * 2.2);
  sandH += 0.12 * sin(p.x * 0.11 + 0.7) * sin(p.y * 0.14 + 2.1);
  return vec2(max(sandH, rock), near);
}

void main() {
  float unit = min(uRes.x, uRes.y);
  float pxSize = uGrooves / unit;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) * pxSize;

  vec2 here = ground(p);
  float e = 0.05;
  vec2 slope = vec2(ground(p + vec2(e, 0.0)).x - here.x, ground(p + vec2(0.0, e)).x - here.x) / e;
  float isStone = smoothstep(pxSize, -pxSize, here.y);

  // Grains: every pixel of sand leans its own way a little, which is what makes it glitter in low sun.
  vec2 fc = floor(gl_FragCoord.xy);
  vec2 grit = vec2(hash(fc), hash(fc + 19.19)) - 0.5;
  vec2 lumps = vec2(noise(p * 5.0), noise(p * 5.0 + 31.0)) - 0.5;
  vec2 rough = mix(grit * 0.36 + lumps * 0.2, (vec2(noise(p * 1.5), noise(p * 1.5 + 9.0)) - 0.5) * 0.16 + grit * 0.07, isStone);
  vec3 n = normalize(vec3(-slope + rough, 1.0));

  float ce = cos(uSun.y);
  vec3 L = vec3(cos(uSun.x) * ce, sin(uSun.x) * ce, sin(uSun.y));

  // Walk toward the sun. Anything standing above the ray, a stone or the next ridge of sand, shades this point.
  vec3 at = vec3(p, here.x);
  float shade = 1.0;
  float stepLen = 0.07;
  float along = 0.0;
  for (int i = 0; i < 18; i++) {
    along += stepLen;
    stepLen *= 1.33;
    vec3 s = at + L * along;
    float gap = s.z - ground(s.xy).x;
    shade = min(shade, 0.55 + 5.0 * gap / along);
  }
  shade = smoothstep(0.0, 1.0, clamp(shade, 0.0, 1.0));

  // A branch overhangs one corner. Its leaves throw soft, shifting patches.
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 lp = p * 0.085 - L.xy * 1.1 + vec2(sin(uTime * 0.31), cos(uTime * 0.23)) * 0.09;
  float leaves = 0.58 * noise(lp * 1.5 + 3.0) + 0.3 * noise(lp * 3.7 + vec2(uTime * 0.04, 0.0)) + 0.12 * noise(lp * 8.1);
  float corner = smoothstep(0.85, 1.5, uv.x * 0.85 + uv.y * 0.95 + 0.3 * noise(lp * 0.8));
  float canopy = smoothstep(0.52, 0.4, leaves) * corner * uCanopy;

  float lit = max(dot(n, L), 0.0);
  float direct = lit * shade * (1.0 - canopy);
  vec3 sun = vec3(1.0, 0.93, 0.8);

  // Sand.
  float tone = 0.92 + 0.12 * noise(p * 1.7) + 0.05 * (hash(fc + 3.0) - 0.5);
  vec3 sand = uSand * tone;
  sand *= 1.0 - 0.3 * step(0.992, hash(fc + 71.3));
  sand *= 1.0 - 0.3 * exp(-max(here.y, 0.0) * 1.6);
  vec3 col = sand * (uSky * 0.78 + sun * direct * 1.5);
  col += sun * pow(lit, 24.0) * shade * (1.0 - canopy) * step(0.93, hash(fc + 5.5)) * 0.35;

  // Stone: dark, a little speckled, with a dull shine where it faces the sun.
  float speck = noise(p * 6.0) * 0.5 + hash(fc) * 0.5;
  vec3 rock = uStone * (0.9 + 0.2 * noise(p * 0.9 + 4.0)) * (0.9 + 0.2 * speck);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  vec3 rockCol = rock * (uSky * 0.85 + sun * direct * 2.6) + sun * pow(max(dot(n, H), 0.0), 26.0) * shade * (1.0 - canopy) * 0.22;
  col = mix(col, rockCol, isStone);

  vec2 c = uv - 0.5;
  col *= 1.0 - 0.3 * dot(c, c);
  col = mix(col, 1.0 - exp(-col * 1.4), 0.35);
  gl_FragColor = vec4(pow(max(col, 0.0), vec3(0.95)), 1.0);
}`;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** One fragment shader fills the block. `onLive` reports when a frame has been painted. */
function SandCanvas({ onLive }: { onLive: (live: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { antialias: false, alpha: false });
    if (!canvas || !gl) return; // no WebGL: the CSS garden underneath stays

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
    const u = { res: at("uRes"), time: at("uTime"), sun: at("uSun"), stones: at("uStones"), shape: at("uShape") };
    gl.uniform1f(at("uGrooves"), garden.grooves);
    gl.uniform1f(at("uRings"), garden.rings);
    gl.uniform1f(at("uRelief"), garden.relief);
    gl.uniform1f(at("uCanopy"), garden.canopy);
    gl.uniform3fv(at("uSand"), garden.sand);
    gl.uniform3fv(at("uSky"), garden.skylight);
    gl.uniform3fv(at("uStone"), garden.stone);
    gl.uniform2fv(u.shape, garden.stones.flatMap((s) => [s.turn, s.height]));

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The sun: its compass direction and its height above the horizon, both in radians.
    const sun = { turn: 2.5, lift: 0.42, toTurn: 2.5, toLift: 0.42, touched: -1e9 };
    let raf = 0;
    let visible = true;
    let time = 12;
    let before = 0;

    const draw = () => {
      gl.uniform1f(u.time, time);
      gl.uniform2f(u.sun, sun.turn, sun.lift);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      const scale = Math.min(Math.min(Math.max(window.devicePixelRatio || 1, 1), 2) * garden.quality, Math.sqrt(garden.maxPixels / (w * h)));
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      // Stones are placed as a share of the block, so they stay in frame on a tall phone.
      const short = Math.min(w, h);
      gl.uniform4fv(u.stones, garden.stones.flatMap((s) => [(s.x * w * garden.grooves) / short, (s.y * h * garden.grooves) / short, s.size, s.stretch]));
      draw();
      onLive(true);
    };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - (before || now)) / 1000, 0.05);
      before = now;
      time += dt * garden.speed;
      // Left alone, the afternoon runs by itself: the sun swings round and sinks, then comes back.
      if (now - sun.touched > 2600) {
        sun.toTurn = 2.55 + 0.75 * Math.sin(time * 0.21);
        sun.toLift = 0.4 + 0.14 * Math.sin(time * 0.33 + 1.0);
      }
      const k = 1 - Math.exp(-dt * 2.6);
      sun.turn = mix(sun.turn, sun.toTurn, k);
      sun.lift = mix(sun.lift, sun.toLift, k);
      draw();
    };
    const start = () => {
      cancelAnimationFrame(raf);
      before = 0;
      if (still) draw();
      else if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const onPointer = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width - 0.5;
      const y = 0.5 - (e.clientY - box.top) / box.height;
      if (Math.abs(x) > 0.5 || Math.abs(y) > 0.5) return;
      // The sun stands where the pointer is: its direction from the middle of the garden, and lower the further out it goes.
      sun.toTurn = Math.atan2(y * box.height, x * box.width);
      // Take the short way round when the pointer crosses behind the centre.
      while (sun.toTurn - sun.turn > Math.PI) sun.toTurn -= Math.PI * 2;
      while (sun.toTurn - sun.turn < -Math.PI) sun.toTurn += Math.PI * 2;
      sun.toLift = mix(0.85, 0.24, Math.min(1, Math.hypot(x, y) * 2));
      sun.touched = performance.now();
    };
    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      onLive(false);
    };

    const sizeWatcher = new ResizeObserver(resize);
    sizeWatcher.observe(canvas);
    const viewWatcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    viewWatcher.observe(canvas);
    document.addEventListener("visibilitychange", start);
    if (!still) window.addEventListener("pointermove", onPointer, { passive: true });
    canvas.addEventListener("webglcontextlost", onLost);
    resize();
    start();

    return () => {
      cancelAnimationFrame(raf);
      sizeWatcher.disconnect();
      viewWatcher.disconnect();
      document.removeEventListener("visibilitychange", start);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [onLive]);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}

/** The garden without a shader: CSS rake lines, two stones and their rings. Shown first, and kept when WebGL is missing. */
function StillSand() {
  const lines = "repeating-linear-gradient(176deg, #e9dcc3 0px, #d9c8a8 9px, #b9a481 15px, #efe3cc 19px, #e9dcc3 22px)";
  const rings = "repeating-radial-gradient(ellipse at center, #e9dcc3 0px, #d9c8a8 9px, #b9a481 15px, #efe3cc 19px, #e9dcc3 22px)";
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#dccdb0]" style={{ backgroundImage: lines }}>
      {[
        { left: "70%", top: "42%", w: 190, h: 132, turn: -28 },
        { left: "23%", top: "70%", w: 110, h: 92, turn: 40 },
      ].map((s) => (
        <span key={s.left} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%]" style={{ left: s.left, top: s.top, width: s.w + 220, height: s.h + 220, backgroundImage: rings, transform: `translate(-50%, -50%) rotate(${s.turn}deg)` }}>
          <span className="absolute left-1/2 top-1/2 rounded-[46%_54%_52%_48%/55%_48%_52%_45%] bg-[radial-gradient(circle_at_34%_30%,#5b5a5c_0%,#2c2b2e_55%,#1a191c_100%)] shadow-[26px_30px_26px_-6px_rgba(60,52,70,0.55)]" style={{ width: s.w, height: s.h, transform: "translate(-50%, -50%)" }} />
        </span>
      ))}
      <div className="raked-zen-sand-garden-webgl-background-with-basalt-stones-and-a-slow-turning-sun-shadow-shade absolute -inset-[10%] bg-[radial-gradient(34%_30%_at_88%_14%,rgba(70,66,84,0.5)_0%,rgba(70,66,84,0)_100%),radial-gradient(22%_26%_at_66%_6%,rgba(70,66,84,0.4)_0%,rgba(70,66,84,0)_100%),radial-gradient(20%_30%_at_98%_44%,rgba(70,66,84,0.38)_0%,rgba(70,66,84,0)_100%)]" />
    </div>
  );
}

export default function RakedZenSandGardenWebglBackgroundWithBasaltStonesAndASlowTurningSunShadow() {
  const [live, setLive] = useState(false);

  return (
    <section className="relative isolate h-[620px] overflow-hidden bg-[#dccdb0] sm:h-[760px]">
      <style>{`
        @keyframes raked-zen-sand-garden-webgl-background-with-basalt-stones-and-a-slow-turning-sun-shadow-shade { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(-2.5%, 2%, 0); } }
        .raked-zen-sand-garden-webgl-background-with-basalt-stones-and-a-slow-turning-sun-shadow-shade { animation: raked-zen-sand-garden-webgl-background-with-basalt-stones-and-a-slow-turning-sun-shadow-shade 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .raked-zen-sand-garden-webgl-background-with-basalt-stones-and-a-slow-turning-sun-shadow-shade { animation: none; } }
      `}</style>
      <StillSand />
      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${live ? "opacity-100" : "opacity-0"}`}>
        <SandCanvas onLive={setLive} />
      </div>
      <p className="absolute bottom-5 left-5 rounded-full bg-[#211d18]/85 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-stone-50 sm:bottom-7 sm:left-7">
        Raked sand <span className="text-stone-300">/ three stones, late sun</span>
      </p>
    </section>
  );
}
