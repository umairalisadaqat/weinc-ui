import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

// The print lying in the tray. Swap the address and the alt text together.
const PHOTO = "https://images.pexels.com/photos/35024256/pexels-photo-35024256.jpeg?auto=compress&cs=tinysrgb&w=900";
const PHOTO_ALT = "A person in a pale yellow suit and a wide flat-brimmed black hat, standing against a deep red wall";
const tray = { label: "Tray 3", bath: "Wash, 20 °C", action: "Let a drop fall" };

// Water surface grid. More cells give finer rings and cost more per frame.
const GW = 168;
const GH = 210;
/** How much of its height a wave keeps each step: closer to 1 means the water rings for longer. */
const CALM = 0.983;
/** Tilt of the print in the tray, in radians. Keep the still print's rotate() in step with it. */
const TILT = -0.061;

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `precision highp float;
uniform vec2 u_res;
uniform sampler2D u_photo;
uniform sampler2D u_wave;
uniform float u_img;
uniform float u_tilt;

float box(vec2 p, vec2 b, float r){
  vec2 d = abs(p) - b + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// What lies on the bottom of the tray at a point: the enamel floor, the paper border or the picture.
vec3 bed(vec2 uv){
  float A = u_res.x / u_res.y;
  vec2 q = (uv - 0.5) * vec2(A, 1.0);
  float c = cos(-u_tilt), s = sin(-u_tilt);
  vec2 l = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
  vec2 half_ = vec2(0.36 * A, 0.45 * A);
  float edge = 0.03 * A;

  vec3 enamel = vec3(0.965, 0.962, 0.945);
  float wall = box(q, vec2(0.5 * A, 0.5), 0.07);
  enamel *= 0.90 + 0.10 * smoothstep(0.0, -0.10, wall);
  enamel -= (hash(floor(uv * u_res * 0.5)) - 0.5) * 0.012;
  float shade = box(l - vec2(0.010, 0.016), half_, 0.004);
  enamel *= 1.0 - 0.42 * (1.0 - smoothstep(-0.012, 0.040, shade));

  vec2 inner = half_ - edge;
  vec2 t = l / inner * 0.5 + 0.5;
  float ia = inner.x / inner.y;
  if (u_img > ia) t.x = (t.x - 0.5) * ia / u_img + 0.5;
  else t.y = (t.y - 0.5) * u_img / ia + 0.5;
  vec3 photo = texture2D(u_photo, clamp(t, 0.0, 1.0)).rgb;
  // A wet print is a touch deeper and richer than a dry one.
  photo = pow(photo, vec3(1.08));
  float px = 1.5 / u_res.y;
  vec3 paper = vec3(0.965, 0.96, 0.94) - (hash(floor(uv * u_res * 0.7)) - 0.5) * 0.015;
  vec3 print = mix(photo, paper, smoothstep(-px, px, box(l, inner, 0.0)));
  return mix(print, enamel, smoothstep(-px, px, box(l, half_, 0.004)));
}

void main(){
  vec2 uv = vec2(gl_FragCoord.x / u_res.x, 1.0 - gl_FragCoord.y / u_res.y);
  float A = u_res.x / u_res.y;
  vec4 w = texture2D(u_wave, uv);
  vec2 slope = (w.xy - 0.50196) * 2.0;
  float bend = (w.z - 0.50196) * 2.0;

  // Looking down through the surface: each colour is bent a little differently.
  vec3 col;
  col.r = bed(uv + slope * 0.040).r;
  col.g = bed(uv + slope * 0.043).g;
  col.b = bed(uv + slope * 0.046).b;
  col *= vec3(0.955, 0.982, 1.0);
  // Crests focus the light on the bottom and troughs spread it.
  col *= 1.0 + pow(clamp(bend, 0.0, 1.0), 1.4) * 0.95 - clamp(-bend, 0.0, 1.0) * 0.22;

  // The window above the bench, mirrored in the surface and torn apart by every wave.
  vec2 r = (uv - vec2(0.26, 0.15)) * vec2(A, 1.0) + slope * 0.55;
  r = vec2(r.x + r.y * 0.30, r.y);
  float pane = 1.0 - smoothstep(-0.03, 0.05, box(r, vec2(0.17, 0.085), 0.03));
  col = mix(col, vec3(1.0, 0.995, 0.98), pane * 0.36);

  // Sharp glints where the surface tips toward the light.
  vec3 n = normalize(vec3(-slope * 3.2, 1.0));
  float glint = pow(max(dot(n, normalize(vec3(-0.34, -0.42, 0.84))), 0.0), 60.0);
  col += glint * 0.32;

  gl_FragColor = vec4(col, 1.0);
}`;

export default function PhotographInAnEnamelDarkroomTrayUnderWaterThatRipplesWhereThePointerDrags() {
  const reduce = useReducedMotion();
  const well = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useRef<HTMLImageElement>(null);
  /** Pushes the water down at a point of the tray (0 to 1 each way). Set once the shader is running. */
  const poke = useRef<((x: number, y: number, radius: number, amount: number) => void) | null>(null);
  const hand = useRef({ x: 0, y: 0, down: false, at: 0 });
  const [wet, setWet] = useState(false);
  const [drops, setDrops] = useState(0);

  useEffect(() => {
    const el = well.current;
    const cv = canvas.current;
    const img = image.current;
    if (reduce || !el || !cv || !img) return;
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
    gl.uniform1i(u("u_photo"), 0);
    gl.uniform1i(u("u_wave"), 1);
    gl.uniform1f(u("u_tilt"), TILT);
    const uRes = u("u_res");

    const texture = (unit: number) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };

    // The water: two height fields, this step and the one before, on a small grid.
    let now = new Float32Array(GW * GH);
    let before = new Float32Array(GW * GH);
    const pixels = new Uint8Array(GW * GH * 4);
    texture(1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GW, GH, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    const push = (x: number, y: number, radius: number, amount: number) => {
      const cx = x * GW;
      const cy = y * GH;
      const reach = Math.ceil(radius * 2.4);
      for (let j = Math.max(1, Math.floor(cy - reach)); j <= Math.min(GH - 2, Math.ceil(cy + reach)); j++) {
        for (let i = Math.max(1, Math.floor(cx - reach)); i <= Math.min(GW - 2, Math.ceil(cx + reach)); i++) {
          const d = ((i - cx) * (i - cx) + (j - cy) * (j - cy)) / (radius * radius);
          now[j * GW + i] += amount * Math.exp(-d);
        }
      }
    };
    const step = () => {
      for (let j = 0; j < GH; j++) {
        const row = j * GW;
        const up = j > 0 ? row - GW : row;
        const down = j < GH - 1 ? row + GW : row;
        for (let i = 0; i < GW; i++) {
          const left = i > 0 ? i - 1 : i;
          const right = i < GW - 1 ? i + 1 : i;
          // Each cell heads for the average of its neighbours and overshoots. The walls of the tray send waves back.
          before[row + i] = ((now[row + left] + now[row + right] + now[up + i] + now[down + i]) * 0.5 - before[row + i]) * CALM;
        }
      }
      const swap = now;
      now = before;
      before = swap;
    };
    const pack = (v: number) => (v > 127 ? 255 : v < -127 ? 1 : 128 + v);
    const encode = () => {
      for (let j = 0; j < GH; j++) {
        const row = j * GW;
        const up = j > 0 ? row - GW : row;
        const down = j < GH - 1 ? row + GW : row;
        for (let i = 0; i < GW; i++) {
          const left = now[row + (i > 0 ? i - 1 : i)];
          const right = now[row + (i < GW - 1 ? i + 1 : i)];
          const o = (row + i) * 4;
          pixels[o] = pack((left - right) * 330);
          pixels[o + 1] = pack((now[up + i] - now[down + i]) * 330);
          pixels[o + 2] = pack((now[row + i] * 4 - left - right - now[up + i] - now[down + i]) * 700);
          pixels[o + 3] = 255;
        }
      }
    };

    let ready = false;
    let visible = true;
    let raf = 0;
    let last = 0;
    let owed = 0;
    let nextDrip = 1.9;
    const started = performance.now();

    const upload = () => {
      try {
        texture(0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.uniform1f(u("u_img"), img.naturalWidth / img.naturalHeight);
        ready = true;
        setWet(true);
        poke.current = (x, y, radius, amount) => {
          push(x, y, radius, amount);
          wake();
        };
        // One drop straight away, so the water is already moving when the tray first shows.
        push(0.64, 0.34, 3.2, -1.0);
      } catch {
        // The picture could not be read into the shader: the still print underneath stays on show.
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
        owed = Math.min(owed + (last ? (stamp - last) / 1000 : 0.016), 0.05);
        last = stamp;
        // Left alone, something stirs the water: a slow unseen fingertip and the odd falling drop.
        if (stamp - hand.current.at > 2600) {
          push(0.5 + 0.31 * Math.sin(t * 0.83), 0.52 + 0.33 * Math.sin(t * 0.61 + 1.3), 2.4, -0.016);
          if (t > nextDrip) {
            nextDrip = t + 1.9 + Math.random() * 1.6;
            push(0.14 + Math.random() * 0.72, 0.14 + Math.random() * 0.72, 2.8, -0.6 - Math.random() * 0.4);
          }
        }
        while (owed >= 1 / 60) {
          step();
          owed -= 1 / 60;
        }
        encode();
        gl.activeTexture(gl.TEXTURE1);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, GW, GH, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        gl.uniform2f(uRes, cv.width, cv.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    function wake() {
      if (!raf && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    }

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    if (img.complete && img.naturalWidth) upload();
    else img.addEventListener("load", upload);
    resize();
    wake();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      img.removeEventListener("load", upload);
      poke.current = null;
    };
  }, [reduce]);

  const place = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  /** A fingertip pressed into the water. */
  function onDown(e: ReactPointerEvent<HTMLDivElement>) {
    const p = place(e);
    hand.current = { ...p, down: true, at: performance.now() };
    poke.current?.(p.x, p.y, 3, -0.9);
  }
  /** Dragging through the water leaves a wake: the faster the drag, the deeper the furrow. */
  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    const p = place(e);
    const h = hand.current;
    const fresh = performance.now() - h.at < 300;
    const from = fresh ? h : p;
    const dx = p.x - from.x;
    const dy = p.y - from.y;
    const travel = Math.hypot(dx * GW, dy * GH);
    const steps = Math.max(1, Math.min(14, Math.round(travel / 2)));
    const depth = Math.min(0.2, 0.02 + travel * 0.016) / Math.sqrt(steps);
    for (let k = 1; k <= steps; k++) poke.current?.(from.x + (dx * k) / steps, from.y + (dy * k) / steps, 2.4, -depth);
    hand.current = { ...p, down: h.down, at: performance.now() };
  }
  function drip() {
    setDrops((n) => n + 1);
    hand.current.at = performance.now() - 1800;
    poke.current?.(0.2 + Math.random() * 0.6, 0.2 + Math.random() * 0.6, 3.2, -1.1);
  }

  return (
    <section className="relative isolate flex min-h-[760px] w-full flex-col items-center justify-center overflow-hidden bg-[#d9d5cd] px-4 py-14">
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(90% 70% at 32% 18%, #ece9e3 0%, #d9d5cd 55%, #c6c1b7 100%)" }} />

      {/* The tray: white enamel, a dark rolled rim, and a well with the water in it. */}
      <div
        className="relative w-[min(82vw,410px)] rounded-[44px] p-[22px]"
        style={{
          background: "linear-gradient(150deg, #ffffff 0%, #f4f2ee 38%, #e3e0d9 100%)",
          boxShadow:
            "0 0 0 3px #1c2740, 0 0 0 4px rgba(255,255,255,0.35), 0 70px 80px -40px rgba(58,44,28,0.55), 0 26px 34px -18px rgba(58,44,28,0.35), inset 0 2px 1px #ffffff, inset 0 -5px 8px rgba(70,60,45,0.14)",
        }}
      >
        <div
          ref={well}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => (hand.current.down = false)}
          className="relative aspect-[4/5] touch-pan-y overflow-hidden rounded-[24px] bg-[#e9e7e0]"
        >
          {/* The still print. It is what shows with reduced motion or without WebGL. */}
          <div className="absolute left-1/2 top-1/2 aspect-[4/5] w-[72%] -translate-x-1/2 -translate-y-1/2 rotate-[-3.5deg] bg-[#f6f5f0] p-[3%] shadow-[3px_6px_14px_rgba(60,50,35,0.35)]">
            <img ref={image} src={PHOTO} alt={PHOTO_ALT} crossOrigin="anonymous" width={900} height={1125} className="h-full w-full object-cover" />
          </div>
          <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${wet ? "opacity-100" : "opacity-0"}`} />
          {/* The wall of the well throws a shadow onto the water, and the water climbs it in a thin bright line. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[24px] shadow-[inset_0_14px_20px_-6px_rgba(45,38,26,0.5),inset_10px_0_16px_-10px_rgba(45,38,26,0.3),inset_0_-2px_2px_rgba(255,255,255,0.75),inset_0_0_0_1px_rgba(255,255,255,0.35)]" />
        </div>
      </div>

      <div className="mt-9 flex w-[min(82vw,410px)] items-center justify-between gap-4 px-1">
        <p className="whitespace-nowrap text-[13px] leading-tight text-stone-700">
          <span className="font-semibold text-stone-900">{tray.label}</span>
          <span className="mx-2 text-stone-500">/</span>
          {tray.bath}
        </p>
        <button
          type="button"
          onClick={drip}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#1c2740] px-4 text-[13px] font-medium text-white shadow-[0_6px_14px_-6px_rgba(28,39,64,0.7)] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c2740] focus-visible:ring-offset-2 focus-visible:ring-offset-[#d9d5cd] motion-reduce:transition-none"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <path d="M10 2.2c2.6 3.3 5 6.2 5 9.3a5 5 0 0 1-10 0c0-3.1 2.4-6 5-9.3Z" />
          </svg>
          {tray.action}
        </button>
        <span className="sr-only" aria-live="polite">
          {drops > 0 ? `${drops} ${drops === 1 ? "drop has" : "drops have"} fallen into the tray.` : ""}
        </span>
      </div>
    </section>
  );
}
