import { useEffect, useRef, useState } from "react";

// Everything about the pool. Colours are red, green, blue from 0 to 1.
const pool = {
  speed: 1, // how fast the water moves; 0.5 is a still afternoon
  tiles: 17, // mosaic tiles across the short side of the block
  depth: 0.6, // how far the floor is below the surface; deeper water draws finer, brighter light
  chop: 1, // height of the waves; 0.6 is a calm pool, 1.4 one somebody just left
  bend: 0.05, // how much the water bends the view of the tiles
  ripple: 1, // strength of the rings under the pointer; 0 switches them off
  quality: 0.9, // share of the device pixels that are drawn
  maxPixels: 1200000, // the canvas never draws more pixels than this
  tileLight: [0.62, 0.9, 0.93], // palest tile
  tileDark: [0.15, 0.64, 0.83], // deepest tile
  lane: [0.03, 0.12, 0.36], // the lane line
  grout: [0.88, 0.96, 0.95], // the lines between tiles
};

const RINGS = 4;

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uTiles;
uniform float uDepth;
uniform float uChop;
uniform float uBend;
uniform vec4 uRings[${RINGS}];
uniform vec3 uTileLight;
uniform vec3 uTileDark;
uniform vec3 uLane;
uniform vec3 uGrout;

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

vec2 wave(vec2 w, vec2 dir, float freq, float rate, float amp) {
  return dir * (amp * freq * cos(dot(w, dir) * freq + uTime * rate));
}

// The slope of the water surface at a point: seven swells crossing each other,
// pushed around by slow noise so they never line up, plus a ring for each recent touch.
vec2 slope(vec2 p) {
  vec2 w = p + 0.5 * vec2(noise(p * 0.55 + vec2(0.0, uTime * 0.11)), noise(p * 0.55 + vec2(4.1, -uTime * 0.09)));
  vec2 g = wave(w, vec2(0.92, 0.39), 1.9, 1.05, 0.2);
  g += wave(w, vec2(-0.45, 0.89), 2.6, 1.3, 0.12);
  g += wave(w, vec2(0.2, -0.98), 3.7, 1.6, 0.065);
  g += wave(w, vec2(-0.83, -0.56), 5.3, 2.0, 0.036);
  g += wave(w, vec2(0.71, 0.7), 7.1, 2.5, 0.022);
  g += wave(w, vec2(-0.98, 0.17), 9.7, 3.0, 0.013);
  g += wave(w, vec2(0.36, 0.93), 13.1, 3.6, 0.008);
  for (int i = 0; i < ${RINGS}; i++) {
    vec2 d = p - uRings[i].xy;
    float r = length(d) + 0.0001;
    float age = uTime - uRings[i].z;
    float x = r - age * 1.5;
    float env = uRings[i].w * exp(-age * 1.1) * exp(-x * x * 5.0) * smoothstep(0.0, 0.25, age);
    g -= d / r * (env * 0.85 * sin(x * 11.0));
  }
  return g * uChop;
}

float focus(float d, float tr, float det) {
  return 1.0 / (abs(1.0 + d * tr + d * d * det) + 0.055);
}

void main() {
  float unit = min(uRes.x, uRes.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / unit * 4.0;

  float e = 0.012;
  vec2 g = slope(p);
  vec2 gx = (slope(p + vec2(e, 0.0)) - g) / e;
  vec2 gy = (slope(p + vec2(0.0, e)) - g) / e;
  float tr = gx.x + gy.y;
  float det = gx.x * gy.y - gy.x * gx.y;

  // Light: where the surface curves like a lens the sun is gathered into bright threads on the floor.
  // Red, green and blue bend by slightly different amounts, which puts a faint rainbow on each thread.
  vec3 gather = vec3(focus(uDepth * 0.92, tr, det), focus(uDepth, tr, det), focus(uDepth * 1.08, tr, det));
  vec3 light = 0.8 + 0.17 * (gather - 0.95) / (1.0 + 0.035 * gather);

  // The floor, seen through the moving surface.
  float scale = uTiles / 4.0;
  vec2 f0 = p - g * uBend;
  vec2 fl = vec2(f0.x * 0.966 + f0.y * 0.259, -f0.x * 0.259 + f0.y * 0.966) * scale;
  vec2 cell = floor(fl);
  vec2 f = fract(fl);
  float px = uTiles / unit;
  float inset = min(min(f.x, f.y), min(1.0 - f.x, 1.0 - f.y));
  float tile = smoothstep(0.045, 0.045 + px * 1.6 + 0.02, inset);

  float r = hash(cell);
  float r2 = hash(cell + 31.7);
  vec3 glaze = mix(uTileDark, uTileLight, r * r) * (0.9 + 0.2 * hash(cell + 7.7));
  glaze = mix(glaze, uTileLight * 1.08, step(0.9, r2) * 0.55);
  // The lane line, three tiles wide, ending in a crossbar the way they do short of the wall.
  float laneX = abs(cell.x - 4.0);
  float inLane = step(laneX, 1.0) * step(-5.0, cell.y);
  float inBar = step(laneX, 4.0) * step(-7.0, cell.y) * step(cell.y, -5.0);
  float dark = max(inLane, inBar);
  glaze = mix(glaze, uLane * (0.75 + 0.6 * r), dark);
  // Each tile is a little pillow of glass: brighter toward the top left edge, darker on the far side.
  float rim = 1.0 - smoothstep(0.0, 0.3, inset);
  glaze *= 0.93 + 0.07 * smoothstep(0.0, 0.22, inset);
  glaze += 0.07 * rim * (f.y - f.x);
  glaze *= 0.95 + 0.1 * noise(fl * 3.1 + r * 20.0);
  vec3 grout = uGrout * (0.86 + 0.14 * noise(fl * 9.0));
  vec3 floorCol = mix(grout, glaze, tile);

  vec3 col = floorCol * (0.8 + (light - 0.8) * vec3(1.0, 0.97, 0.88));
  // Water takes the red out and adds its own blue green.
  col *= vec3(0.86, 0.98, 1.0);
  col = mix(col, vec3(0.3, 0.78, 0.88) * (0.75 + 0.25 * light.g), 0.07);

  // Glints of sun on the surface itself.
  vec3 ns = normalize(vec3(-g * 0.42, 1.0));
  float glint = pow(max(dot(ns, normalize(vec3(0.22, 0.34, 1.0))), 0.0), 2600.0);
  col += vec3(1.0, 0.99, 0.94) * glint * 0.75;

  vec2 c = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - 0.32 * dot(c, c);
  col = mix(col, 1.0 - exp(-col * 1.35), 0.5);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 13.0) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}`;

/** One fragment shader fills the block. `onLive` reports when a frame has been painted. */
function PoolCanvas({ onLive }: { onLive: (live: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { antialias: false, alpha: false });
    if (!canvas || !gl) return; // no WebGL: the CSS pool underneath stays

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
    const u = { res: at("uRes"), time: at("uTime"), rings: at("uRings") };
    gl.uniform1f(at("uTiles"), pool.tiles);
    gl.uniform1f(at("uDepth"), pool.depth);
    gl.uniform1f(at("uChop"), pool.chop);
    gl.uniform1f(at("uBend"), pool.bend);
    gl.uniform3fv(at("uTileLight"), pool.tileLight);
    gl.uniform3fv(at("uTileDark"), pool.tileDark);
    gl.uniform3fv(at("uLane"), pool.lane);
    gl.uniform3fv(at("uGrout"), pool.grout);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Each ring: where it started (in floor units), when, and how strong.
    const rings = new Float32Array(RINGS * 4);
    for (let i = 0; i < RINGS; i++) rings[i * 4 + 2] = -100;
    let next = 0;
    let raf = 0;
    let visible = true;
    let time = 30;
    let before = 0;
    let w = 1;
    let h = 1;
    let lastDrop = 0;
    let touched = -1e9;
    const last = { x: 0, y: 0 };

    const drop = (x: number, y: number, strength: number) => {
      rings.set([x, y, time, strength * pool.ripple], next * 4);
      next = (next + 1) % RINGS;
      lastDrop = time;
    };
    const draw = () => {
      gl.uniform1f(u.time, time);
      gl.uniform4fv(u.rings, rings);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      w = canvas.clientWidth || 1;
      h = canvas.clientHeight || 1;
      const scale = Math.min(Math.min(Math.max(window.devicePixelRatio || 1, 1), 2) * pool.quality, Math.sqrt(pool.maxPixels / (w * h)));
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      draw();
      onLive(true);
    };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - (before || now)) / 1000, 0.05);
      before = now;
      time += dt * pool.speed;
      // Nobody in the water: something small drops in every few seconds.
      if (now - touched > 2500 && time - lastDrop > 2.6) {
        const wide = (w / Math.min(w, h)) * 2;
        const tall = (h / Math.min(w, h)) * 2;
        drop(Math.sin(time * 1.31) * wide * 0.6, Math.cos(time * 0.83) * tall * 0.55, 0.85);
      }
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
      const inside = e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom;
      if (!inside) return;
      const short = Math.min(box.width, box.height);
      const x = ((e.clientX - box.left - box.width / 2) / short) * 4;
      const y = (-(e.clientY - box.top - box.height / 2) / short) * 4;
      touched = performance.now();
      // A new ring only after the pointer has travelled a little, so a slow drag leaves a wake of them.
      if (Math.hypot(x - last.x, y - last.y) > 0.45 && time - lastDrop > 0.16) {
        last.x = x;
        last.y = y;
        drop(x, y, 1);
      }
    };
    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      onLive(false);
    };

    drop(1.1, 0.3, 0.9);
    rings[2] = time - 0.9; // the first ring is already on its way out when the block appears
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

/** The pool without a shader: a tiled floor in CSS with soft patches of light sliding over it. Shown first, and kept when WebGL is missing. */
function StillPool() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#3fb4cf]">
      <div className="absolute -inset-[40%] rotate-[-15deg] bg-[linear-gradient(90deg,rgba(8,34,96,0)_56%,rgba(8,34,96,0.92)_56%,rgba(8,34,96,0.92)_59.6%,rgba(8,34,96,0)_59.6%),linear-gradient(135deg,#63cfe0_0%,#2a9cc6_50%,#57c6dc_100%)]" />
      <div className="absolute -inset-[40%] rotate-[-15deg] bg-[linear-gradient(90deg,rgba(214,244,244,0.75)_0,rgba(214,244,244,0.75)_3px,rgba(214,244,244,0)_3px),linear-gradient(0deg,rgba(214,244,244,0.75)_0,rgba(214,244,244,0.75)_3px,rgba(214,244,244,0)_3px)] bg-[length:44px_44px]" />
      <div className="swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light-sway absolute -inset-[20%] bg-[radial-gradient(22%_14%_at_24%_30%,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0)_100%),radial-gradient(18%_26%_at_62%_44%,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0)_100%),radial-gradient(26%_12%_at_78%_72%,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0)_100%),radial-gradient(16%_20%_at_36%_78%,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0)_100%)]" />
    </div>
  );
}

export default function SwimmingPoolFloorWebglBackgroundWithMosaicTilesUnderDriftingCausticLight() {
  const [live, setLive] = useState(false);

  return (
    <section className="relative isolate h-[620px] overflow-hidden bg-[#3fb4cf] sm:h-[760px]">
      <style>{`
        @keyframes swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light-sway { 0%, 100% { transform: translate3d(-3%, 2%, 0) scale(1); } 50% { transform: translate3d(4%, -3%, 0) scale(1.08); } }
        .swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light-sway { animation: swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light-sway 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light-sway { animation: none; } }
      `}</style>
      <StillPool />
      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${live ? "opacity-100" : "opacity-0"}`}>
        <PoolCanvas onLive={setLive} />
      </div>
      <p className="absolute bottom-5 left-5 rounded-full bg-[#04163f]/85 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-50 sm:bottom-7 sm:left-7">
        Pool floor <span className="text-cyan-200">/ 1.4 m, noon, nobody in</span>
      </p>
    </section>
  );
}
