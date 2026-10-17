import { useEffect, useRef, useState } from "react";

// Everything about the cloth. Colours are red, green, blue from 0 to 1.
const silk = {
  speed: 1, // how fast the folds travel; 0 holds the cloth still
  folds: 2.5, // how many folds cross the view; higher gathers the cloth tighter
  depth: 0.42, // how deep the folds are; 0.2 is a pressed sheet, 0.6 a heavy drape
  gloss: 1, // strength of the satin highlight; 0 gives matt cotton
  lampHeight: 1.35, // how far the lamp hangs above the cloth; lower gives longer shadows
  quality: 0.85, // share of the device pixels that are drawn
  maxPixels: 1100000, // the canvas never draws more pixels than this
  deep: [0.085, 0.006, 0.022], // the cloth in the bottom of a fold
  body: [0.52, 0.035, 0.085], // the cloth facing the lamp
  sheen: [1.0, 0.5, 0.46], // the colour the weave turns where it catches the light
};

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uLamp;
uniform float uFolds;
uniform float uDepth;
uniform float uGloss;
uniform float uLampHeight;
uniform vec3 uDeep;
uniform vec3 uBody;
uniform vec3 uSheen;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

// The height of the cloth. Long folds run up one diagonal; a slow warp makes them pinch,
// fork and wander the way a length of satin does when it is dropped on a table.
float cloth(vec2 p) {
  float t = uTime * 0.05;
  vec2 q = vec2(p.x * 0.82 + p.y * 0.57, -p.x * 0.57 + p.y * 0.82);
  vec2 w = vec2(noise(q * 0.42 + vec2(0.0, t)), noise(q * 0.42 + vec2(7.3, -t * 0.8))) - 0.5;
  q += w * 1.5;
  float a = q.x * uFolds + 1.25 * sin(q.y * 0.62 + t * 1.6);
  float h = 0.56 * sin(a);
  h += 0.25 * sin(a * 2.03 + 1.7 + 1.1 * sin(q.y * 1.15 - t * 2.3));
  h += 0.11 * sin(a * 4.1 + q.y * 0.9 + 5.0 * w.x);
  h += 0.04 * sin(a * 8.3 + q.y * 2.3 + 9.0 * w.y);
  h += 0.32 * (noise(q * vec2(0.9, 0.5) + vec2(t, 3.0)) - 0.5);
  // Satin folds are round on top and pinched underneath.
  return h - 0.34 * h * h;
}

void main() {
  float unit = min(uRes.x, uRes.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / unit * 4.6;

  float e = 0.014;
  float h = cloth(p);
  vec2 slope = vec2(cloth(p + vec2(e, 0.0)) - h, cloth(p + vec2(0.0, e)) - h) / e;
  vec3 n = normalize(vec3(-slope * uDepth, 1.0));

  vec3 here = vec3(p, h * uDepth);
  vec3 lamp = vec3(uLamp * 2.4, uLampHeight);
  vec3 toLamp = lamp - here;
  float reach = length(toLamp);
  vec3 L = toLamp / reach;
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));

  // Walk toward the lamp: any fold that rises above the ray puts this point in soft shadow.
  float shade = 1.0;
  float step = 0.07;
  float along = 0.0;
  for (int i = 0; i < 9; i++) {
    along += step;
    step *= 1.32;
    vec3 s = here + L * along;
    float gap = s.z - cloth(s.xy) * uDepth;
    shade = min(shade, 0.5 + 8.0 * gap / along);
  }
  shade = smoothstep(0.0, 1.0, clamp(shade, 0.0, 1.0));

  float fall = 1.0 / (1.0 + 0.075 * reach * reach);
  float lit = max(dot(n, L), 0.0);
  float hollow = smoothstep(-0.95, 0.45, h);

  vec3 base = mix(uDeep, uBody, hollow);
  vec3 col = base * (0.13 + 1.55 * lit * shade * fall);
  col += uDeep * 0.5 * (1.0 - n.z);

  // Satin: the floats of the weave run one way, so the highlight smears across the folds
  // into long bands, with a tighter, whiter core where the cloth faces the lamp exactly.
  vec3 thread = normalize(vec3(-0.57, 0.82, 0.0));
  vec3 T = normalize(thread - n * dot(n, thread));
  float tdh = dot(T, H);
  float band = pow(max(1.0 - tdh * tdh, 0.0), 90.0);
  float nh = max(dot(n, H), 0.0);
  float wide = band * pow(nh, 5.0);
  float core = pow(nh, 150.0);
  float glint = (wide * 0.8 + core * 0.7) * shade * fall * uGloss * smoothstep(0.0, 0.25, lit);
  col += mix(uBody * 2.4, uSheen, 0.72) * glint * 1.5;

  // Shot silk: seen edge on, the cloth goes pale and pink.
  float edge = pow(1.0 - n.z, 2.0);
  col += uSheen * uBody * edge * 1.1 * (0.2 + 0.8 * shade) * fall;

  // The weave itself, a hair wide, and a little grain.
  float weft = sin((gl_FragCoord.x * 0.82 + gl_FragCoord.y * 0.57) * 2.1);
  col *= 1.0 + 0.035 * weft * (0.4 + glint * 2.0);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 17.0) - 0.5) * 0.014;

  vec2 c = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - 0.55 * dot(c, c);
  col = mix(col, 1.0 - exp(-col * 1.5), 0.6);
  gl_FragColor = vec4(pow(max(col, 0.0), vec3(0.92)), 1.0);
}`;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** One fragment shader fills the block. `onLive` reports when a frame has been painted. */
function SilkCanvas({ onLive }: { onLive: (live: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { antialias: false, alpha: false });
    if (!canvas || !gl) return; // no WebGL: the CSS cloth underneath stays

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
    const u = { res: at("uRes"), time: at("uTime"), lamp: at("uLamp") };
    gl.uniform1f(at("uFolds"), silk.folds);
    gl.uniform1f(at("uDepth"), silk.depth);
    gl.uniform1f(at("uGloss"), silk.gloss);
    gl.uniform1f(at("uLampHeight"), silk.lampHeight);
    gl.uniform3fv(at("uDeep"), silk.deep);
    gl.uniform3fv(at("uBody"), silk.body);
    gl.uniform3fv(at("uSheen"), silk.sheen);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lamp = { x: -0.3, y: 0.25, tx: -0.3, ty: 0.25, touched: -1e9 };
    let raf = 0;
    let visible = true;
    let time = 20;
    let before = 0;

    const draw = () => {
      gl.uniform1f(u.time, time);
      gl.uniform2f(u.lamp, lamp.x, lamp.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight || 1;
      const scale = Math.min(Math.min(Math.max(window.devicePixelRatio || 1, 1), 2) * silk.quality, Math.sqrt(silk.maxPixels / Math.max(1, w * h)));
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
      time += dt * silk.speed;
      // Left alone for a few seconds, the lamp goes back to a slow figure of eight.
      if (now - lamp.touched > 2600) {
        const a = now / 1000;
        lamp.tx = 0.62 * Math.sin(a * 0.42);
        lamp.ty = 0.3 * Math.sin(a * 0.84 + 0.6);
      }
      const k = 1 - Math.exp(-dt * 3.4);
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
      const wide = Math.max(1, box.width / box.height);
      const tall = Math.max(1, box.height / box.width);
      lamp.tx = x * wide;
      lamp.ty = y * tall;
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

/** The cloth without a shader: the same folds as stacked CSS gradients. Shown first, and kept when WebGL is missing. */
function StillSilk() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#3d0611]">
      <div className="absolute -inset-[60%] rotate-[-35deg] bg-[linear-gradient(90deg,#1c0308_0%,#5e0a17_7%,#b0283a_12%,#f0a39a_14.5%,#a51f33_17%,#4a0812_24%,#1c0308_30%,#3d0611_36%,#8e1527_43%,#e58f8a_46%,#8e1527_49%,#2a040b_58%,#16020a_63%,#6d0d1c_70%,#c94a55_75%,#f4b1a6_77%,#9a1a2d_80%,#3d0611_88%,#1c0308_100%)]" />
      <div className="absolute -inset-[60%] rotate-[-28deg] bg-[linear-gradient(90deg,rgba(20,2,8,0)_0%,rgba(20,2,8,0.75)_22%,rgba(20,2,8,0)_40%,rgba(20,2,8,0.6)_61%,rgba(20,2,8,0)_78%,rgba(20,2,8,0.7)_100%)] blur-2xl" />
      <div className="oxblood-silk-satin-webgl-background-with-folds-lit-by-a-lamp-that-follows-the-pointer-lamp absolute -inset-[15%] bg-[radial-gradient(50%_45%_at_40%_42%,rgba(255,190,180,0.2)_0%,rgba(20,2,8,0)_60%,rgba(20,2,8,0.6)_100%)]" />
    </div>
  );
}

export default function OxbloodSilkSatinWebglBackgroundWithFoldsLitByALampThatFollowsThePointer() {
  const [live, setLive] = useState(false);

  return (
    <section className="relative isolate h-[620px] overflow-hidden bg-[#3d0611] sm:h-[760px]">
      <style>{`
        @keyframes oxblood-silk-satin-webgl-background-with-folds-lit-by-a-lamp-that-follows-the-pointer-lamp { 0%, 100% { transform: translate3d(-6%, 0, 0); } 50% { transform: translate3d(8%, -3%, 0); } }
        .oxblood-silk-satin-webgl-background-with-folds-lit-by-a-lamp-that-follows-the-pointer-lamp { animation: oxblood-silk-satin-webgl-background-with-folds-lit-by-a-lamp-that-follows-the-pointer-lamp 8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .oxblood-silk-satin-webgl-background-with-folds-lit-by-a-lamp-that-follows-the-pointer-lamp { animation: none; } }
      `}</style>
      <StillSilk />
      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${live ? "opacity-100" : "opacity-0"}`}>
        <SilkCanvas onLive={setLive} />
      </div>
      <p className="absolute bottom-5 left-5 rounded-full bg-[#16020a]/80 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-rose-50 sm:bottom-7 sm:left-7">
        Silk drape <span className="text-rose-200">/ oxblood satin, one lamp</span>
      </p>
    </section>
  );
}
