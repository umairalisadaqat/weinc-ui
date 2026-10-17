import { useEffect, useRef, useState } from "react";

// Everything about the tray. Colours are red, green, blue from 0 to 1.
const bath = {
  speed: 1, // how fast the liquid creeps; 0 holds the bath still
  rake: 0.62, // how far the first rake pulled the inks sideways
  comb: 0.42, // how far the fine comb pulled them into arches; 0 leaves plain raked bands
  span: 4.4, // how much of the tray the shorter side of a wide screen shows
  spanNarrow: 2.5, // the same for a phone
  teeth: 0.22, // gap between comb teeth; smaller makes finer feathers
  stylus: 1, // how hard the pointer drags the ink; 0 switches the stylus off
  gloss: 1, // strength of the window reflected in the wet surface
  quality: 0.85, // share of the device pixels that are drawn
  maxPixels: 1000000, // the canvas never draws more pixels than this
  size: [0.93, 0.88, 0.76], // the bare bath that shows between the inks
  ground: [0.07, 0.11, 0.3], // the ink laid first, which fills most of the tray
  inks: [
    [0.11, 0.19, 0.47], // indigo
    [0.76, 0.2, 0.13], // vermilion
    [0.87, 0.64, 0.22], // ochre
    [0.95, 0.9, 0.79], // bone white
    [0.1, 0.36, 0.33], // bottle green
  ],
};

const SEGMENTS = 24; // how many short stylus moves the bath remembers
const SEGMENT_LENGTH = 0.14;
const SEGMENT_LIFE = 11; // seconds before a move has fully relaxed

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uSpan;
uniform vec4 uSeg[${SEGMENTS}];
uniform vec2 uWindow;
uniform float uRake;
uniform float uComb;
uniform float uTeeth;
uniform float uGloss;
uniform vec3 uSize;
uniform vec3 uGround;
uniform vec3 uInkA;
uniform vec3 uInkB;
uniform vec3 uInkC;
uniform vec3 uInkD;
uniform vec3 uInkE;

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

vec3 pick(float h) {
  vec3 c = uInkA;
  c = mix(c, uInkB, step(0.26, h));
  c = mix(c, uInkC, step(0.47, h));
  c = mix(c, uInkD, step(0.66, h));
  c = mix(c, uInkE, step(0.84, h));
  return c;
}

// One throw of the brush: a scatter of round drops, each with pigment gathered at its rim
// and a hairline of bare bath pushed out around it.
vec3 throwDrops(vec2 q, float seed, float scale, float fill, vec3 under) {
  vec2 g = q * scale + seed * vec2(13.1, 7.7);
  g += (vec2(noise(g * 0.8 + seed), noise(g * 0.8 + seed + 5.2)) - 0.5) * 0.5;
  vec2 id = floor(g);
  vec2 f = fract(g);
  float there = step(hash(id + seed * 2.3), fill);
  vec2 c = 0.5 + (vec2(hash(id + seed), hash(id.yx + seed + 3.7)) - 0.5) * 0.34;
  float r = 0.15 + 0.17 * hash(id + seed * 3.1);
  float d = length(f - c) - r;
  float aa = 0.016 * scale;
  vec3 ink = pick(hash(id + seed * 9.7));
  ink *= 1.0 - 0.3 * smoothstep(-0.07, 0.0, d);
  ink *= 0.9 + 0.2 * noise(g * 9.0);
  vec3 col = mix(under, uSize, there * 0.85 * smoothstep(0.03 + aa, 0.0, abs(d - 0.022)));
  return mix(col, ink, there * smoothstep(aa, -aa, d));
}

// Distance from p to the short line the stylus travelled.
float toSegment(vec2 p, vec2 c, vec2 m) {
  vec2 a = c - 0.5 * m;
  float along = clamp(dot(p - a, m) / max(dot(m, m), 1e-6), 0.0, 1.0);
  return length(p - a - m * along);
}

// Where the ink now at p lay before anything was dragged through the bath. Each tool moves
// ink along its own direction by an amount that dies away with distance, so it can be undone
// exactly by moving the other way, newest stroke first.
vec2 unwind(vec2 p) {
  for (int i = 0; i < ${SEGMENTS}; i++) {
    vec4 s = uSeg[i];
    p -= s.zw * exp(-toSegment(p, s.xy, s.zw) / 0.2);
  }
  float t = uTime * 0.035;
  p += (vec2(noise(p * 0.45 + vec2(t, 0.0)), noise(p * 0.45 + vec2(4.1, -t))) - 0.5) * 0.5;
  // The fine comb, drawn up the tray: pointed arches between the teeth.
  float gap = uTeeth;
  float fromTooth = gap * (0.5 - abs(fract(p.x / gap) - 0.5));
  p.y -= uComb * exp(-fromTooth / (gap * 0.3));
  // The rake before it, drawn left then right on alternate rows.
  float row = p.y / 0.62;
  float fromRow = 0.62 * (0.5 - abs(fract(row) - 0.5));
  float way = mod(floor(row), 2.0) * 2.0 - 1.0;
  p.x -= uRake * way * exp(-fromRow / 0.2);
  return p;
}

vec3 inks(vec2 p) {
  vec2 q = unwind(p);
  vec3 col = uGround * (0.85 + 0.3 * noise(q * 6.0));
  col = throwDrops(q, 1.0, 1.3, 0.8, col);
  col = throwDrops(vec2(q.x * 0.8 + q.y * 0.6, -q.x * 0.6 + q.y * 0.8), 2.0, 1.9, 0.75, col);
  col = throwDrops(vec2(q.x * 0.6 - q.y * 0.8, q.x * 0.8 + q.y * 0.6), 3.0, 2.7, 0.7, col);
  col = throwDrops(q, 4.0, 4.3, 0.5, col);
  return col;
}

float swell(vec2 p) {
  float t = uTime * 0.12;
  return noise(p * 0.9 + vec2(t, -t * 0.7)) + 0.4 * noise(p * 2.3 - vec2(t * 1.3, t));
}

void main() {
  float unit = min(uRes.x, uRes.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / unit * uSpan;
  float px = uSpan / unit;

  // Four taps inside the pixel keep the hair-thin feathers from crawling.
  vec3 col = inks(p + px * vec2(0.38, 0.13));
  col += inks(p + px * vec2(-0.13, 0.38));
  col += inks(p + px * vec2(-0.38, -0.13));
  col += inks(p + px * vec2(0.13, -0.38));
  col *= 0.25;

  // Daylight falls from the window side of the room.
  vec2 c = gl_FragCoord.xy / uRes - 0.5;
  col *= 0.86 + 0.3 * (c.y * 0.7 - c.x * 0.5) + 0.06;

  // The surface is liquid: it carries a slow swell, and mirrors the window above the bench.
  float e = 0.05;
  float h = swell(p);
  vec2 slope = vec2(swell(p + vec2(e, 0.0)) - h, swell(p + vec2(0.0, e)) - h) / e;
  vec3 n = normalize(vec3(-slope * 0.0045, 1.0));
  vec3 view = normalize(vec3(-p * 0.25, 1.0));
  vec3 r = reflect(-view, n);
  vec2 w = r.xy / r.z - uWindow;
  w = vec2(w.x * 0.97 + w.y * 0.24, -w.x * 0.24 + w.y * 0.97);
  vec2 pane = abs(w) - vec2(0.085, 0.13);
  float glass = smoothstep(0.007, -0.007, max(pane.x, pane.y));
  float bars = smoothstep(0.003, 0.008, abs(w.x)) * smoothstep(0.003, 0.008, abs(w.y + 0.015));
  float halo = exp(-dot(w, w) * 9.0);
  float fres = 0.05 + 0.95 * pow(1.0 - max(dot(view, n), 0.0), 5.0);
  col += vec3(0.82, 0.9, 1.0) * uGloss * (glass * bars * (0.2 + 0.14 * smoothstep(-0.13, 0.13, w.y)) + halo * 0.06);
  col += vec3(0.6, 0.7, 0.85) * fres * 0.2 * uGloss;

  col *= 1.0 - 0.5 * dot(c, c);
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.012;
  gl_FragColor = vec4(pow(max(col, 0.0), vec3(0.94)), 1.0);
}`;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

type Move = { x: number; y: number; mx: number; my: number; born: number };

/** One fragment shader fills the block. `onLive` reports when a frame has been painted. */
function BathCanvas({ onLive }: { onLive: (live: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { antialias: false, alpha: false });
    if (!canvas || !gl) return; // no WebGL: the CSS pattern underneath stays

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
    const u = { res: at("uRes"), time: at("uTime"), span: at("uSpan"), seg: at("uSeg[0]"), window: at("uWindow") };
    gl.uniform1f(at("uRake"), bath.rake);
    gl.uniform1f(at("uComb"), bath.comb);
    gl.uniform1f(at("uTeeth"), bath.teeth);
    gl.uniform1f(at("uGloss"), bath.gloss);
    gl.uniform3fv(at("uSize"), bath.size);
    gl.uniform3fv(at("uGround"), bath.ground);
    ["uInkA", "uInkB", "uInkC", "uInkD", "uInkE"].forEach((name, i) => gl.uniform3fv(at(name), bath.inks[i]));

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const half = { x: 2.3, y: 2.3 }; // half the view, in the shader's units
    const moves: Move[] = []; // newest first
    const packed = new Float32Array(SEGMENTS * 4);
    const tip = { x: 0, y: 0, down: false };
    let touched = -1e9;
    let raf = 0;
    let visible = true;
    let time = 40;
    let before = 0;

    // Left alone, a stylus nobody is holding wanders the tray in slow loops.
    const wander = (t: number) => ({
      x: half.x * (0.56 * Math.sin(t * 0.21 + 0.4) + 0.2 * Math.sin(t * 0.67)),
      y: half.y * (0.5 * Math.sin(t * 0.33 + 1.9) + 0.2 * Math.cos(t * 0.83)),
    });
    const dragTo = (x: number, y: number, when: number) => {
      if (!tip.down) {
        tip.x = x;
        tip.y = y;
        tip.down = true;
        return;
      }
      let steps = 0;
      for (;;) {
        const dx = x - tip.x;
        const dy = y - tip.y;
        const far = Math.hypot(dx, dy);
        if (far < SEGMENT_LENGTH || steps++ > 5) break;
        const mx = (dx / far) * SEGMENT_LENGTH;
        const my = (dy / far) * SEGMENT_LENGTH;
        moves.unshift({ x: tip.x + mx / 2, y: tip.y + my / 2, mx, my, born: when });
        if (moves.length > SEGMENTS) moves.pop();
        tip.x += mx;
        tip.y += my;
      }
    };
    const draw = () => {
      packed.fill(0);
      moves.forEach((m, i) => {
        // A move fades in as it is made and relaxes with age, and the oldest are let go first.
        const age = time - m.born;
        const hold = ease(age / 0.25) * (1 - ease((age - SEGMENT_LIFE * 0.5) / (SEGMENT_LIFE * 0.5))) * (1 - ease((i - SEGMENTS + 8) / 7));
        packed.set([m.x, m.y, m.mx * hold * bath.stylus, m.my * hold * bath.stylus], i * 4);
      });
      gl.uniform4fv(u.seg, packed);
      gl.uniform1f(u.time, time);
      gl.uniform2f(u.window, half.x * (0.12 + 0.012 * Math.sin(time * 0.11)), half.y * (0.1 + 0.012 * Math.sin(time * 0.17 + 1)));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const seed = () => {
      // Start with a flourish already drawn, as if the marbler has just lifted the stylus.
      moves.length = 0;
      tip.down = false;
      for (let t = time - 5; t <= time; t += 0.05) {
        const g = wander(t);
        dragTo(g.x, g.y, t);
      }
    };
    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight || 1;
      const scale = Math.min(Math.min(Math.max(window.devicePixelRatio || 1, 1), 2) * bath.quality, Math.sqrt(bath.maxPixels / Math.max(1, w * h)));
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      // A narrow screen looks at less of the tray, so the feathers stay the same size in the hand.
      const span = w < 640 ? bath.spanNarrow : bath.span;
      half.x = (span * 0.5 * w) / Math.min(w, h);
      half.y = (span * 0.5 * h) / Math.min(w, h);
      gl.uniform1f(u.span, span);
      seed();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      draw();
      onLive(true);
    };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - (before || now)) / 1000, 0.05);
      before = now;
      time += dt * bath.speed;
      if (now - touched > 2400) {
        const g = wander(time);
        // Coming back from the pointer, lift the stylus and set it down again where the loop is.
        if (touched > 0) {
          tip.down = false;
          touched = -1e9;
        }
        dragTo(g.x, g.y, time);
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
      const x = ((e.clientX - box.left) / box.width) * 2 - 1;
      const y = 1 - ((e.clientY - box.top) / box.height) * 2;
      if (Math.abs(x) > 1 || Math.abs(y) > 1) {
        if (touched > 0) tip.down = false;
        return;
      }
      if (touched < 0) tip.down = false;
      touched = performance.now();
      dragTo(x * half.x, y * half.y, time);
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

/** The sheet without a shader: rows of combed arches from one repeating CSS gradient. Shown first, and kept when WebGL is missing. */
function StillBath() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#16224f]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#f2e6c9_0%,#f2e6c9_9%,#16224f_10%,#16224f_19%,#c23321_20%,#c23321_29%,#f2e6c9_30%,#f2e6c9_33%,#1c3078_34%,#1c3078_45%,#dea338_46%,#dea338_53%,#16224f_54%,#16224f_62%,#1a5c54_63%,#1a5c54_69%,#f2e6c9_70%,#f2e6c9_72%,#16224f_73%)] bg-[length:58px_44px]" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_58%_34%,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_55%,rgba(8,12,34,0.5)_100%)]" />
    </div>
  );
}

export default function MarbledPaperWebglBackgroundWithFloatingInksCombedIntoFeathersOnAWetSizeBath() {
  const [live, setLive] = useState(false);

  return (
    <section className="relative isolate h-[620px] overflow-hidden bg-[#16224f] sm:h-[760px]">
      <StillBath />
      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${live ? "opacity-100" : "opacity-0"}`}>
        <BathCanvas onLive={setLive} />
      </div>
      <p className="absolute bottom-5 left-5 rounded-full bg-[#0b1230]/85 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-50 sm:bottom-7 sm:left-7">
        Marbling bath <span className="hidden text-amber-200 sm:inline">/ five inks, raked and combed</span>
      </p>
    </section>
  );
}
