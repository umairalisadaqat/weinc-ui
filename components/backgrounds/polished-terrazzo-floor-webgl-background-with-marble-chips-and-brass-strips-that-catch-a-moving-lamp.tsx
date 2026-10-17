import { useEffect, useRef, useState } from "react";

// Everything about the floor. Colours are red, green, blue from 0 to 1.
const floor = {
  speed: 1, // how fast the lamp swings when nobody is steering it; 0 parks it
  span: 4.6, // how much floor the shorter side of a wide screen shows
  spanNarrow: 3.0, // the same for a phone
  chipSize: 1, // 0.7 gives a fine Venetian mix, 1.5 big Palladiana slabs
  fill: 0.56, // share of the floor taken by the large chips
  polish: 1, // how mirror-like the grind is; 0.3 is a honed, satin floor
  lampHeight: 2.2, // how far the lamp hangs above the floor
  lampSize: 0.52, // radius of the lamp's glass shade
  strips: 1, // 1 lays the brass divider strips, 0 pours one seamless slab
  quality: 0.85, // share of the device pixels that are drawn
  maxPixels: 1100000, // the canvas never draws more pixels than this
  cement: [0.86, 0.82, 0.75], // the binder between the chips
  brass: [0.78, 0.58, 0.26],
  stones: [
    [0.94, 0.92, 0.88], // white Carrara
    [0.71, 0.34, 0.24], // terracotta
    [0.15, 0.29, 0.24], // green serpentine
    [0.84, 0.63, 0.27], // Siena yellow
    [0.13, 0.15, 0.22], // blue-black slate
    [0.87, 0.67, 0.62], // rose marble
  ],
};

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uSpan;
uniform vec2 uLamp;
uniform vec2 uStrip;
uniform float uChip;
uniform float uFill;
uniform float uPolish;
uniform float uLampHeight;
uniform float uLampSize;
uniform float uStrips;
uniform vec3 uCement;
uniform vec3 uBrass;
uniform vec3 uStoneA;
uniform vec3 uStoneB;
uniform vec3 uStoneC;
uniform vec3 uStoneD;
uniform vec3 uStoneE;
uniform vec3 uStoneF;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec2 hash2(vec2 p) { return vec2(hash(p), hash(p.yx + 19.19)); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

vec3 stone(float h) {
  vec3 c = uStoneA;
  c = mix(c, uStoneB, step(0.34, h));
  c = mix(c, uStoneC, step(0.5, h));
  c = mix(c, uStoneD, step(0.64, h));
  c = mix(c, uStoneE, step(0.76, h));
  c = mix(c, uStoneF, step(0.88, h));
  return c;
}

// Broken stone: the plane is split into cells and each cell is one fragment. Returns the
// distance to the nearest break and the fragment's own number.
vec3 shards(vec2 x) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  vec2 mg = vec2(0.0);
  vec2 mr = vec2(0.0);
  float md = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 r = g + hash2(n + g) - f;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  md = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j));
    vec2 r = g + hash2(n + g) - f;
    if (dot(mr - r, mr - r) > 0.0001) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
  }
  return vec3(md, n + mg);
}

// One grade of chip thrown into the mix. Each fragment is shrunk away from its neighbours
// so cement shows between them, and given its own colour, figure, tilt and polish.
void scatter(vec2 p, float scale, float seed, float keep, float px, inout vec3 albedo, inout vec4 finish) {
  vec2 x = p * scale + seed * vec2(7.3, 3.1);
  x += (vec2(noise(x * 3.0), noise(x * 3.0 + 9.1)) - 0.5) * 0.07;
  vec3 c = shards(x);
  vec2 id = c.yz + seed * 13.0;
  float there = step(hash(id), keep);
  float d = c.x - (0.08 + 0.2 * hash(id + 1.7));
  float aa = px * scale;
  float m = there * smoothstep(-aa, aa, d);
  // A hairline of shadow where the cement has shrunk back from the stone.
  albedo *= 1.0 - 0.22 * there * smoothstep(0.02, 0.0, abs(d + 0.004)) * (1.0 - m);

  float kind = hash(id + 5.1);
  vec3 col = stone(kind);
  float turn = 6.283 * hash(id + 8.8);
  vec2 grain = vec2(cos(turn) * x.x + sin(turn) * x.y, -sin(turn) * x.x + cos(turn) * x.y);
  float cloud = noise(grain * vec2(2.2, 6.0) + id);
  float vein = smoothstep(0.05, 0.0, abs(noise(grain * vec2(1.5, 4.0) + id * 1.7) - 0.5));
  col *= 0.76 + 0.44 * cloud;
  col = mix(col, col * 0.66 + 0.1, vein * 0.4);
  col *= 0.94 + 0.12 * hash(id + 2.2);

  albedo = mix(albedo, col, m);
  vec2 tilt = (hash2(id + 4.4) - 0.5) * 0.05;
  finish = mix(finish, vec4(tilt, 0.025 + 0.05 * hash(id + 6.6), 0.5 + 0.2 * hash(id + 7.7)), m);
}

// The lamp's glass shade as the floor mirrors it from the point p.
float mirrored(vec2 p, vec3 n, float blur, out float glow) {
  vec3 view = normalize(vec3(-p, 6.0));
  vec3 r = reflect(-view, n);
  vec2 hit = p + r.xy * (uLampHeight / max(r.z, 0.05));
  float d = length(hit - uLamp * (1.0 + uLampHeight / 6.0));
  glow = exp(-d * d * 0.7);
  float shade = smoothstep(uLampSize + blur, uLampSize - blur, d);
  // The bulb sits brighter in the middle of the shade.
  return shade * (0.5 + 0.5 * smoothstep(uLampSize * 0.42 + blur, uLampSize * 0.42 - blur, d));
}

void main() {
  float unit = min(uRes.x, uRes.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / unit * uSpan;
  float px = uSpan / unit;

  // Cement first: fine sand, a little mottling and the odd pinhole.
  vec3 albedo = uCement * (0.93 + 0.1 * noise(p * 2.1) + 0.05 * noise(p * 46.0));
  albedo *= 1.0 - 0.2 * smoothstep(0.88, 0.96, noise(p * 70.0));
  vec4 finish = vec4(0.0, 0.0, 0.11, 0.3); // tilt x, tilt y, blur of reflections, mirror strength

  scatter(p, 9.5 / uChip, 3.0, 0.34, px, albedo, finish);
  scatter(p, 4.6 / uChip, 2.0, 0.42, px, albedo, finish);
  scatter(p, 2.1 / uChip, 1.0, uFill, px, albedo, finish);

  // Brass divider strips, set on edge in the screed and ground flush with the stone.
  vec2 off = abs(p - uStrip);
  float line = min(off.x, off.y);
  float strip = uStrips * smoothstep(0.03 + px, 0.03 - px, line);
  float along = off.x < off.y ? p.y : p.x;
  float across = off.x < off.y ? p.x : p.y;
  vec3 brass = uBrass * (0.82 + 0.3 * noise(vec2(along * 3.0, across * 260.0)) + 0.1 * noise(vec2(along * 40.0, across * 30.0)));
  albedo *= 1.0 - 0.35 * uStrips * smoothstep(0.046, 0.03, line) * (1.0 - strip);
  albedo = mix(albedo, brass * 0.62, strip);
  finish = mix(finish, vec4(0.0, 0.0, 0.1, 0.8), strip);

  finish.z = mix(0.5, finish.z, uPolish);
  finish.w *= mix(0.35, 1.0, uPolish);
  vec3 n = normalize(vec3(finish.xy + (vec2(noise(p * 30.0), noise(p * 30.0 + 7.7)) - 0.5) * 0.008, 1.0));

  vec3 toLamp = vec3(uLamp * (1.0 + uLampHeight / 6.0), uLampHeight) - vec3(p, 0.0);
  float reach = length(toLamp);
  float lit = max(dot(n, toLamp / reach), 0.0) / (1.0 + 0.14 * reach * reach);
  vec3 warm = vec3(1.0, 0.95, 0.86);
  vec3 col = albedo * (vec3(0.36, 0.37, 0.42) + warm * lit * 1.5);

  float glow;
  float shade = mirrored(p, n, finish.z, glow);
  vec3 tint = mix(vec3(1.0), uBrass * 1.5, strip);
  col += warm * tint * shade * finish.w * 1.1;
  col += warm * tint * glow * 0.1 * finish.w;

  // A run of skylights overhead, mirrored faintly whatever the lamp is doing.
  vec3 view = normalize(vec3(-p, 6.0));
  vec3 r = reflect(-view, n);
  vec2 sky = p + r.xy * (5.0 / max(r.z, 0.05));
  sky = vec2(sky.x * 0.94 + sky.y * 0.34, -sky.x * 0.34 + sky.y * 0.94);
  float bay = smoothstep(0.62 + finish.z, 0.62 - finish.z, abs(mod(sky.x + 1.2, 2.4) - 1.2)) * smoothstep(3.4 + finish.z, 3.4 - finish.z, abs(sky.y - 1.0));
  col += vec3(0.88, 0.92, 1.0) * bay * finish.w * 0.26;

  vec2 c = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - 0.42 * dot(c, c);
  col = mix(col, 1.0 - exp(-col * 1.6), 0.4);
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.012;
  gl_FragColor = vec4(pow(max(col, 0.0), vec3(0.9)), 1.0);
}`;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** One fragment shader fills the block. `onLive` reports when a frame has been painted. */
function FloorCanvas({ onLive }: { onLive: (live: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { antialias: false, alpha: false });
    if (!canvas || !gl) return; // no WebGL: the drawn floor underneath stays

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
    const u = { res: at("uRes"), span: at("uSpan"), lamp: at("uLamp"), strip: at("uStrip") };
    gl.uniform1f(at("uChip"), floor.chipSize);
    gl.uniform1f(at("uFill"), floor.fill);
    gl.uniform1f(at("uPolish"), floor.polish);
    gl.uniform1f(at("uLampHeight"), floor.lampHeight);
    gl.uniform1f(at("uLampSize"), floor.lampSize);
    gl.uniform1f(at("uStrips"), floor.strips);
    gl.uniform3fv(at("uCement"), floor.cement);
    gl.uniform3fv(at("uBrass"), floor.brass);
    ["uStoneA", "uStoneB", "uStoneC", "uStoneD", "uStoneE", "uStoneF"].forEach((name, i) => gl.uniform3fv(at(name), floor.stones[i]));

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const half = { x: 2.3, y: 2.3 }; // half the view, in the shader's units
    const lamp = { x: 0.1, y: 0.12, tx: 0.1, ty: 0.12, touched: -1e9 };
    let raf = 0;
    let visible = true;
    let time = 0;
    let before = 0;

    const draw = () => {
      gl.uniform2f(u.lamp, lamp.x * half.x, lamp.y * half.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight || 1;
      const scale = Math.min(Math.min(Math.max(window.devicePixelRatio || 1, 1), 2) * floor.quality, Math.sqrt(floor.maxPixels / Math.max(1, w * h)));
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      const span = w < 640 ? floor.spanNarrow : floor.span;
      half.x = (span * 0.5 * w) / Math.min(w, h);
      half.y = (span * 0.5 * h) / Math.min(w, h);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.span, span);
      gl.uniform2f(u.strip, -half.x * 0.44, half.y * 0.46);
      draw();
      onLive(true);
    };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - (before || now)) / 1000, 0.05);
      before = now;
      time += dt * floor.speed;
      // Left alone for a few seconds, the lamp goes back to swinging in a slow figure of eight.
      if (now - lamp.touched > 2600) {
        lamp.tx = 0.1 + 0.5 * Math.sin(time * 0.5);
        lamp.ty = 0.12 + 0.34 * Math.sin(time * 1.0 + 0.5);
      }
      const k = 1 - Math.exp(-dt * 3.2);
      lamp.x = mix(lamp.x, lamp.tx, k);
      lamp.y = mix(lamp.y, lamp.ty, k);
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
      const x = ((e.clientX - box.left) / box.width) * 2 - 1;
      const y = 1 - ((e.clientY - box.top) / box.height) * 2;
      if (Math.abs(x) > 1 || Math.abs(y) > 1) return;
      lamp.tx = x;
      lamp.ty = y;
      lamp.touched = performance.now();
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

// The fallback floor: a fixed scatter of four-sided chips, worked out once from a seed.
const stillChips = (() => {
  const fills = ["#f1ece2", "#b5573d", "#264a3d", "#d6a145", "#21263a", "#deaba0", "#f1ece2", "#b5573d"];
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const chips: { points: string; fill: string }[] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 15; col++) {
      if (next() < 0.22) continue;
      const cx = col * 70 + 20 + next() * 40;
      const cy = row * 70 + 20 + next() * 40;
      const size = 12 + next() * 22;
      const turn = next() * Math.PI;
      const points = [0, 1, 2, 3]
        .map((corner) => {
          const a = turn + corner * (Math.PI / 2) + (next() - 0.5) * 0.9;
          const r = size * (0.6 + next() * 0.5);
          return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
        })
        .join(" ");
      chips.push({ points, fill: fills[Math.floor(next() * fills.length)] });
    }
  }
  return chips;
})();

/** The floor without a shader: an SVG of flat chips under a soft pool of light. Shown first, and kept when WebGL is missing. */
function StillFloor() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#d9d0bf]">
      <svg viewBox="0 0 1050 630" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {stillChips.map((chip) => (
          <polygon key={chip.points} points={chip.points} fill={chip.fill} />
        ))}
        <rect x="290" y="0" width="5" height="630" fill="#b08a3e" />
        <rect x="0" y="168" width="1050" height="5" fill="#b08a3e" />
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(34%_42%_at_55%_44%,rgba(255,250,235,0.55)_0%,rgba(255,250,235,0)_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(90%_90%_at_50%_50%,rgba(60,50,40,0)_55%,rgba(60,50,40,0.28)_100%)]" />
    </div>
  );
}

export default function PolishedTerrazzoFloorWebglBackgroundWithMarbleChipsAndBrassStripsThatCatchAMovingLamp() {
  const [live, setLive] = useState(false);

  return (
    <section className="relative isolate h-[620px] overflow-hidden bg-[#d9d0bf] sm:h-[760px]">
      <StillFloor />
      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${live ? "opacity-100" : "opacity-0"}`}>
        <FloorCanvas onLive={setLive} />
      </div>
      <p className="absolute bottom-5 left-5 rounded-full bg-stone-900/90 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-stone-50 sm:bottom-7 sm:left-7">
        Terrazzo <span className="hidden text-amber-200 sm:inline">/ six stones, brass strips, one lamp</span>
      </p>
    </section>
  );
}
