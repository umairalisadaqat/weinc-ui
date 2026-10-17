import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

// Two pictures of the same size. The first is the print, the second is what the bead shows.
const looks = [
  {
    name: "Cobalt",
    src: "https://images.pexels.com/photos/30755158/pexels-photo-30755158.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "A woman with her hair bound into a tall stack of spheres, in a pale blue oversized shirt against a blue wall, one hand at her jaw",
  },
  {
    name: "Tangerine",
    src: "https://images.pexels.com/photos/39325161/pexels-photo-39325161.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "A woman with cropped hair in an orange top and long white wrapped gloves against an orange wall",
  },
];

/** Size of each drop as a share of the print's height. The first leads, the rest trail behind and melt back in. */
const DROPS = [0.15, 0.084, 0.068, 0.054, 0.043, 0.034];
/** How quickly each drop catches up. Lower numbers lag further, so a fast move strings the bead out. */
const PULL = [130, 62, 44, 31, 22, 15];

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `precision highp float;
uniform vec2 u_res;
uniform sampler2D u_a;
uniform sampler2D u_b;
uniform vec2 u_img;
uniform vec3 u_drops[6];
uniform float u_time;
uniform float u_swap;

vec2 cover(vec2 uv, float img){
  float A = u_res.x / u_res.y;
  vec2 t = uv;
  if (img > A) t.x = (uv.x - 0.5) * A / img + 0.5;
  else t.y = (uv.y - 0.5) * img / A + 0.5;
  return clamp(t, 0.0, 1.0);
}
// The bead is a sum of soft fields, one per drop. Where the sum passes 1 there is liquid.
float field(vec2 p, float A, out vec2 grad){
  float f = 0.0;
  grad = vec2(0.0);
  for (int i = 0; i < 6; i++){
    vec2 d = p - vec2(u_drops[i].x * A, u_drops[i].y);
    float d2 = dot(d, d) + 0.00002;
    float r2 = u_drops[i].z * u_drops[i].z;
    f += r2 / d2;
    grad -= 2.0 * r2 * d / (d2 * d2);
  }
  return f;
}
vec3 outside(vec2 uv){ return mix(texture2D(u_a, cover(uv, u_img.x)).rgb, texture2D(u_b, cover(uv, u_img.y)).rgb, u_swap); }
vec3 inside(vec2 uv){ return mix(texture2D(u_b, cover(uv, u_img.y)).rgb, texture2D(u_a, cover(uv, u_img.x)).rgb, u_swap); }

void main(){
  vec2 uv = vec2(gl_FragCoord.x / u_res.x, 1.0 - gl_FragCoord.y / u_res.y);
  float A = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * A, uv.y);
  // A slow wobble so the outline never sits perfectly round.
  p += 0.006 * vec2(sin(p.y * 13.0 + u_time * 1.3), cos(p.x * 11.0 - u_time * 1.1));

  vec2 g;
  float f = field(p, A, g);
  float gl = length(g) + 0.0001;
  vec2 out_ = -g / gl;
  vec2 light = normalize(vec2(-0.55, -0.83));

  // The print, with the bead's shadow lying on it away from the light.
  vec2 gs;
  float fs = field(p + light * 0.022, A, gs);
  vec3 base = outside(uv);
  base *= 1.0 - 0.50 * smoothstep(0.62, 1.12, fs);
  // Light that has passed through the bead lands as a bright crescent just beyond it.
  vec2 gc;
  float fc = field(p + light * 0.006, A, gc);
  base += vec3(1.0, 0.96, 0.9) * 0.20 * smoothstep(0.90, 1.0, fc) * (1.0 - smoothstep(1.0, 1.05, f)) * max(dot(out_, -light), 0.0);

  // Inside: 0 at the rim, 1 where the dome is flat on top.
  float k = clamp((f - 1.0) / 1.6, 0.0, 1.0);
  float steep = pow(1.0 - k, 2.4);
  vec2 lens = out_ * steep;
  vec2 pull = vec2(lens.x / A, lens.y);
  vec3 seen;
  seen.r = inside(uv - pull * 0.060).r;
  seen.g = inside(uv - pull * 0.065).g;
  seen.b = inside(uv - pull * 0.070).b;
  // The far side of a drop glows and the side nearest the light is shaded.
  seen *= 1.0 + 0.55 * steep * dot(out_, -light);
  seen += vec3(1.0) * 0.16 * pow(1.0 - k, 7.0);
  // Two reflections of the lamp: a hard one near the rim and a soft bounce opposite.
  vec3 n = normalize(vec3(lens * 1.5, 1.0));
  float hit = max(dot(n, normalize(vec3(light * 1.05, 0.72))), 0.0);
  seen += vec3(1.0) * smoothstep(0.972, 0.992, hit) * 0.95;
  seen += vec3(1.0) * pow(hit, 9.0) * 0.16;
  // A long soft streak of the studio window curving round the shoulder of the bead.
  float facing = dot(out_, light);
  float band = smoothstep(0.30, 0.46, steep) * (1.0 - smoothstep(0.50, 0.74, steep));
  seen += vec3(1.0) * band * smoothstep(0.45, 0.95, facing) * 0.34;
  float bounce = max(dot(n, normalize(vec3(-light * 1.2, 0.6))), 0.0);
  seen += vec3(1.0, 0.97, 0.92) * smoothstep(0.93, 0.99, bounce) * 0.22;

  float edge = gl * 1.6 / u_res.y;
  float cut = smoothstep(1.0 - edge, 1.0 + edge, f);
  // A hairline of dark where the liquid meets the paper.
  base *= 1.0 - 0.35 * smoothstep(1.0 - edge * 5.0, 1.0, f) * (1.0 - cut);
  gl_FragColor = vec4(mix(base, seen, cut), 1.0);
}`;

export default function PortraitPrintWithALiquidGlassBeadThatChasesThePointerAndShowsASecondPhotograph() {
  const reduce = useReducedMotion();
  const frame = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const first = useRef<HTMLImageElement>(null);
  const second = useRef<HTMLImageElement>(null);
  /** Where the bead is heading (0 to 1 each way) and when a person last steered it. */
  const aim = useRef({ x: 0.6, y: 0.36, at: -1e6 });
  const flip = useRef(0);
  const [live, setLive] = useState(false);
  const [swapped, setSwapped] = useState(false);

  useEffect(() => {
    flip.current = swapped ? 1 : 0;
  }, [swapped]);

  useEffect(() => {
    const el = frame.current;
    const cv = canvas.current;
    const one = first.current;
    const two = second.current;
    if (reduce || !el || !cv || !one || !two) return;
    const gl = cv.getContext("webgl", { antialias: false, alpha: false });
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
    gl.uniform1i(u("u_a"), 0);
    gl.uniform1i(u("u_b"), 1);
    const uni = { res: u("u_res"), img: u("u_img"), drops: u("u_drops[0]"), time: u("u_time"), swap: u("u_swap") };

    const n = DROPS.length;
    const pos = new Float32Array(n * 2);
    const vel = new Float32Array(n * 2);
    const packed = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([aim.current.x, aim.current.y], i * 2);

    let ready = false;
    let visible = true;
    let raf = 0;
    let last = 0;
    let swap = flip.current;
    const started = performance.now();

    const upload = () => {
      if (ready || !one.complete || !two.complete || !one.naturalWidth || !two.naturalWidth) return;
      try {
        [one, two].forEach((img, unit) => {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        });
        gl.uniform2f(uni.img, one.naturalWidth / one.naturalHeight, two.naturalWidth / two.naturalHeight);
        ready = true;
        setLive(true);
      } catch {
        // A picture could not be read into the shader: the still version underneath stays on show.
        ready = false;
      }
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(el.clientWidth * ratio));
      cv.height = Math.max(1, Math.round(el.clientHeight * ratio));
      gl.viewport(0, 0, cv.width, cv.height);
    };

    const loop = (stamp: number) => {
      if (ready) {
        const t = (stamp - started) / 1000;
        const dt = Math.min(last ? (stamp - last) / 1000 : 0.016, 0.033);
        last = stamp;
        const A = cv.width / cv.height;
        // With nobody steering, the bead wanders the print in a slow, uneven loop.
        let tx = aim.current.x;
        let ty = aim.current.y;
        if (stamp - aim.current.at > 2200) {
          tx = 0.5 + 0.25 * Math.sin(t * 0.9 + 0.4) + 0.05 * Math.sin(t * 2.3);
          ty = 0.42 + 0.22 * Math.sin(t * 0.63 + 1.9) + 0.04 * Math.cos(t * 1.9);
        }
        for (let i = 0; i < n; i++) {
          // Each trailing drop orbits a little way off the one ahead, which keeps the merged outline lobed.
          const reach = i === 0 ? 0 : 0.034 + i * 0.006;
          const turn = t * (0.7 + i * 0.23) + i * 2.1;
          const gx = i === 0 ? tx : pos[(i - 1) * 2] + (Math.cos(turn) * reach) / A;
          const gy = i === 0 ? ty : pos[(i - 1) * 2 + 1] + Math.sin(turn) * reach;
          const k = PULL[i];
          const drag = 2 * Math.sqrt(k) * (i === 0 ? 0.62 : 0.8);
          vel[i * 2] += ((gx - pos[i * 2]) * k - vel[i * 2] * drag) * dt;
          vel[i * 2 + 1] += ((gy - pos[i * 2 + 1]) * k - vel[i * 2 + 1] * drag) * dt;
          pos[i * 2] += vel[i * 2] * dt;
          pos[i * 2 + 1] += vel[i * 2 + 1] * dt;
          packed.set([pos[i * 2], pos[i * 2 + 1], DROPS[i]], i * 3);
        }
        swap += (flip.current - swap) * Math.min(1, dt * 7);
        gl.uniform2f(uni.res, cv.width, cv.height);
        gl.uniform3fv(uni.drops, packed);
        gl.uniform1f(uni.time, t);
        gl.uniform1f(uni.swap, swap);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (!raf && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    one.addEventListener("load", upload);
    two.addEventListener("load", upload);
    upload();
    resize();
    wake();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      one.removeEventListener("load", upload);
      two.removeEventListener("load", upload);
    };
  }, [reduce]);

  function steer(e: ReactPointerEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    aim.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, at: performance.now() };
  }
  /** Arrow keys roll the bead. Enter and Space, like a click, swap the two pictures. */
  function onKey(e: ReactKeyboardEvent<HTMLButtonElement>) {
    const move: Record<string, [number, number]> = { ArrowLeft: [-0.08, 0], ArrowRight: [0.08, 0], ArrowUp: [0, -0.07], ArrowDown: [0, 0.07] };
    const by = move[e.key];
    if (!by) return;
    e.preventDefault();
    const a = aim.current;
    aim.current = { x: Math.min(0.9, Math.max(0.1, a.x + by[0])), y: Math.min(0.9, Math.max(0.1, a.y + by[1])), at: performance.now() + 4000 };
  }

  const [under, over] = swapped ? [looks[1], looks[0]] : looks;

  return (
    <section className="relative isolate flex min-h-[760px] w-full flex-col items-center justify-center overflow-hidden bg-[#0b0b0d] px-4 py-14">
      <style>{`
        .lgb-still { clip-path: circle(21% at 61% 35%); }
        .lgb-ring { left: 61%; top: 35%; width: 52.5%; aspect-ratio: 1; transform: translate(-50%, -50%); }
      `}</style>
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(60% 50% at 50% 42%, #1b1d24 0%, #0b0b0d 70%)" }} />

      <button
        ref={frame}
        type="button"
        aria-pressed={swapped}
        aria-label={`Swap the two portraits. ${under.name} is the print and ${over.name} shows through the bead. Arrow keys move the bead.`}
        onClick={() => setSwapped((s) => !s)}
        onPointerMove={steer}
        onPointerDown={steer}
        onKeyDown={onKey}
        className="relative block aspect-[4/5] w-[min(82vw,420px)] cursor-pointer touch-pan-y overflow-hidden rounded-[10px] bg-[#16171c] shadow-[0_60px_90px_-40px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b0b0d]"
      >
        {/* The still version: the print, and the second picture through a round window. Shown with reduced motion or without WebGL. */}
        <img ref={first} src={looks[0].src} alt={looks[0].alt} crossOrigin="anonymous" width={900} height={1350} className={`absolute inset-0 h-full w-full object-cover ${swapped ? "lgb-still z-10" : ""}`} />
        <img ref={second} src={looks[1].src} alt={looks[1].alt} crossOrigin="anonymous" width={900} height={1350} className={`absolute inset-0 h-full w-full object-cover ${swapped ? "" : "lgb-still z-10"}`} />
        <span aria-hidden="true" className="lgb-ring absolute z-10 block rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55),inset_6px_8px_14px_rgba(255,255,255,0.22),8px_12px_22px_rgba(0,0,0,0.45)]" />
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 z-20 h-full w-full transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`} />
      </button>

      <div className="mt-8 flex w-[min(82vw,420px)] items-baseline justify-between gap-4 px-0.5 text-[13px]">
        <p className="text-zinc-300">
          <span className="font-semibold text-white">{under.name}</span>
          <span className="mx-2 text-zinc-500">over</span>
          {over.name}
        </p>
        <p className="text-zinc-400">Click the print to swap</p>
      </div>
    </section>
  );
}
