import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

// The print lying on the glass floor of the tray.
const print = {
  src: "https://images.pexels.com/photos/9955200/pexels-photo-9955200.jpeg?auto=compress&cs=tinysrgb&w=900",
  alt: "A man in a white beret and white jacket against a blue wall, holding a pink gerbera daisy in front of one eye",
};

/** Sand grid across the tray. The picture is drawn far finer than this: the grid only holds how deep the sand lies. */
const GW = 128;
const GH = 160;
/** Width of the fingertip, as a share of the tray width. */
const FINGER = 0.07;
/** The steepest wall the sand will hold, as depth per grid cell. Anything steeper collapses at once. */
const REPOSE = 0.3;
/** How quickly the walls of a furrow creep inward, and how quickly grains sift back over bare glass (per second). */
const CREEP = 0.55;
const LEVEL = 0.011;

const WALNUT =
  "repeating-linear-gradient(91deg, rgba(255,220,180,0.05) 0 1px, rgba(0,0,0,0.07) 1px 3px, rgba(255,220,180,0.02) 3px 7px, rgba(0,0,0,0.04) 7px 12px), linear-gradient(135deg, #7a5333 0%, #4a311d 55%, #36220f 100%)";

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `precision highp float;
uniform vec2 u_res;
uniform vec2 u_grid;
uniform sampler2D u_sand;
uniform sampler2D u_photo;
uniform float u_img;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
vec3 bed(vec2 uv){
  vec2 o = 0.5 / u_grid;
  return (texture2D(u_sand, uv + o).rgb + texture2D(u_sand, uv - o).rgb + texture2D(u_sand, uv + vec2(o.x, -o.y)).rgb + texture2D(u_sand, uv + vec2(-o.x, o.y)).rgb) * 0.25;
}
vec2 cover(vec2 uv){
  float A = u_res.x / u_res.y;
  vec2 t = uv;
  if (u_img > A) t.x = (uv.x - 0.5) * A / u_img + 0.5;
  else t.y = (uv.y - 0.5) * u_img / A + 0.5;
  return clamp(t, 0.0, 1.0);
}

void main(){
  vec2 px = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec2 uv = px / u_res;
  vec3 s = bed(uv);
  float h = s.r * 2.5;
  vec2 slope = (s.gb - 0.5) / 1.2;

  // Grains about one screen pixel across, whatever the density of the display.
  vec2 gp = px / max(1.0, floor(u_res.x / 700.0 + 0.5));
  float n1 = hash(floor(gp));
  float n1b = hash(floor(gp) + 19.7);
  float n2 = hash(floor(gp / 2.0) + 3.1);
  float mottle = vnoise(gp / 16.0);

  vec2 lamp = normalize(vec2(-0.6, -0.8));
  vec3 L = normalize(vec3(lamp * 0.92, 0.5));

  // Sand does not end in a line. Where the bed thins it breaks into single grains, and a few are always left behind on the glass.
  float cov = smoothstep(0.12, 0.48, h + (n2 - 0.5) * 0.36 + (n1 - 0.5) * 0.18);
  float stray = step(0.9925, hash(floor(gp / 1.5) + 71.3));
  cov = max(cov, stray * 0.92);

  vec3 n = normalize(vec3(-slope * 3.4 + (vec2(n1, n1b) - 0.5) * 0.6, 1.0));
  float dif = max(dot(n, L), 0.0);
  float toward = bed(uv + lamp * 0.011).r * 2.5;
  float occluded = clamp((toward - h) * 1.3 - 0.05, 0.0, 1.0);

  vec3 grain = mix(vec3(0.80, 0.71, 0.58), vec3(0.60, 0.50, 0.39), n1 * n1);
  grain = mix(grain, vec3(0.93, 0.88, 0.79), step(0.88, n1b) * 0.6);
  grain *= 0.92 + 0.16 * mottle;
  vec3 sand = grain * (0.30 + 1.0 * dif) * (1.0 - 0.5 * occluded);
  // Flecks of quartz that flash where a slope faces the lamp.
  sand += vec3(1.0, 0.97, 0.9) * step(0.985, n2) * step(0.5, n1b) * pow(dif, 3.0) * 0.3;

  vec3 photo = texture2D(u_photo, cover(uv)).rgb;
  // The wall of the furrow nearest the lamp throws its shadow onto the print.
  photo *= 1.0 - 0.5 * smoothstep(0.15, 0.9, toward) * (1.0 - cov);
  // A thin film of dust and the faint reflection of the lamp in the glass.
  photo = photo * 0.93 + 0.035 + 0.05 * smoothstep(0.55, 0.0, abs(uv.x * 0.8 + uv.y - 0.62));

  gl_FragColor = vec4(mix(photo, sand, cov), 1.0);
}`;

export default function PortraitBuriedUnderSandInATrayWhereThePointerDragsAFingerTrailThatSiftsShut() {
  const reduce = useReducedMotion();
  const well = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  /** The fingertip in tray fractions, where it was a frame ago, and when a person last moved it. */
  const finger = useRef({ x: 0.5, y: 0.5, px: 0.5, py: 0.5, at: -1e6, moved: false, fresh: true });
  /** 1 while the sand is brushed off the whole print, and how long the bed is still rushing to its new level. */
  const bare = useRef({ on: 0, rush: 0 });
  const [live, setLive] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const el = well.current;
    const cv = canvas.current;
    const img = photo.current;
    if (!el || !cv || !img) return;
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
    gl.uniform1i(u("u_sand"), 1);
    gl.uniform2f(u("u_grid"), GW, GH);
    const texture = (unit: number) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };

    // Depth of sand in every cell. 1 is the level bed, 0 is bare glass, above 1 is a ridge pushed up beside a furrow.
    let depth = new Float32Array(GW * GH).fill(1);
    let spare = new Float32Array(GW * GH);
    const packed = new Uint8Array(GW * GH * 4);
    const reach = GW * FINGER;

    /** Press the fingertip down at one spot: scoop out what is under it and bank it up around the edge. */
    const press = (cx: number, cy: number) => {
      const out = reach * 1.8;
      const x0 = Math.max(0, Math.floor(cx - out));
      const x1 = Math.min(GW - 1, Math.ceil(cx + out));
      const y0 = Math.max(0, Math.floor(cy - out));
      const y1 = Math.min(GH - 1, Math.ceil(cy + out));
      let moved = 0;
      let room = 0;
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const i = y * GW + x;
          const d = Math.hypot(x - cx, y - cy);
          if (d < reach) {
            const a = Math.max(0, (d / reach - 0.45) / 0.55);
            const left = Math.min(depth[i], a * a * (3 - 2 * a) * 1.15);
            moved += depth[i] - left;
            depth[i] = left;
          } else if (d < out) {
            // Only bank sand onto sand: none of it falls back into the furrow behind the finger.
            room += Math.sin((Math.PI * (d - reach)) / (out - reach)) * Math.min(1, Math.max(0, (depth[i] - 0.35) / 0.5));
          }
        }
      }
      if (moved <= 0 || room <= 0) return;
      const share = (moved * 0.7) / room;
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const i = y * GW + x;
          const d = Math.hypot(x - cx, y - cy);
          if (d >= reach && d < out) {
            const w = Math.sin((Math.PI * (d - reach)) / (out - reach)) * Math.min(1, Math.max(0, (depth[i] - 0.35) / 0.5));
            depth[i] = Math.min(2.3, depth[i] + w * share);
          }
        }
      }
    };
    const drag = (ax: number, ay: number, bx: number, by: number) => {
      const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 1.2));
      for (let s = 1; s <= steps; s++) press(ax + ((bx - ax) * s) / steps, ay + ((by - ay) * s) / steps);
    };

    /** Let the bed settle for one tick: walls steeper than sand can hold collapse, the rest creeps, and grains sift back. */
    const settle = (dt: number, rate: number, level: number) => {
      const creep = Math.min(0.2, CREEP * dt);
      const back = Math.min(1, rate * dt);
      const flow = (d: number) => (d > REPOSE ? (d - REPOSE) * 0.22 : d < -REPOSE ? (d + REPOSE) * 0.22 : 0) + d * creep * 0.25;
      for (let y = 0; y < GH; y++) {
        const up = y > 0 ? -GW : 0;
        const down = y < GH - 1 ? GW : 0;
        for (let x = 0; x < GW; x++) {
          const i = y * GW + x;
          const here = depth[i];
          const v = here + flow(depth[i + up] - here) + flow(depth[i + down] - here) + flow(depth[x > 0 ? i - 1 : i] - here) + flow(depth[x < GW - 1 ? i + 1 : i] - here);
          spare[i] = v + (level - v) * back;
        }
      }
      const swap = depth;
      depth = spare;
      spare = swap;
    };

    // With nobody touching it, a slow hand draws one long wandering line.
    const wander = (t: number): [number, number] => [
      GW * (0.5 + 0.3 * Math.sin(t * 0.5 + 0.2) + 0.07 * Math.sin(t * 1.31 + 1.0)),
      GH * (0.47 + 0.33 * Math.sin(t * 0.37 + 1.9) + 0.05 * Math.cos(t * 1.13)),
    ];

    const draw = () => {
      for (let y = 0; y < GH; y++) {
        for (let x = 0; x < GW; x++) {
          const i = y * GW + x;
          const sx = (depth[x < GW - 1 ? i + 1 : i] - depth[x > 0 ? i - 1 : i]) * 0.5;
          const sy = (depth[y < GH - 1 ? i + GW : i] - depth[y > 0 ? i - GW : i]) * 0.5;
          packed[i * 4] = Math.max(0, Math.min(255, depth[i] * 102));
          packed[i * 4 + 1] = Math.max(0, Math.min(255, 127.5 + sx * 153));
          packed[i * 4 + 2] = Math.max(0, Math.min(255, 127.5 + sy * 153));
          packed[i * 4 + 3] = 255;
        }
      }
      gl.activeTexture(gl.TEXTURE1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GW, GH, 0, gl.RGBA, gl.UNSIGNED_BYTE, packed);
      gl.uniform2f(u("u_res"), cv.width, cv.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    // It opens with twenty-two seconds of that line already drawn, the oldest end half sifted shut.
    const LEAD = 22;
    let lead = wander(-LEAD);
    for (let t = -LEAD; t < 0; t += 1 / 30) {
      const next = wander(t);
      drag(lead[0], lead[1], next[0], next[1]);
      lead = next;
      settle(1 / 30, LEVEL, 1);
    }

    let ready = false;
    let visible = true;
    let raf = 0;
    let last = 0;
    const started = performance.now();

    const loop = (stamp: number) => {
      if (ready) {
        const t = (stamp - started) / 1000;
        const dt = Math.min(last ? (stamp - last) / 1000 : 0.016, 0.033);
        last = stamp;
        const f = finger.current;
        const b = bare.current;
        if (f.moved) {
          const x = f.x * GW;
          const y = f.y * GH;
          if (f.fresh) press(x, y);
          else drag(f.px * GW, f.py * GH, x, y);
          f.fresh = false;
          f.px = f.x;
          f.py = f.y;
          f.moved = false;
        }
        if (reduce) {
          // No drifting sand: a stroke stays as it was drawn, and the button changes the whole tray at once.
          if (b.rush > 0) {
            depth.fill(b.on ? 0 : 1);
            b.rush = 0;
          }
        } else {
          if (stamp - f.at > 2600 && !b.on) {
            const next = wander(t);
            drag(lead[0], lead[1], next[0], next[1]);
            lead = next;
          } else lead = wander(t);
          b.rush = Math.max(0, b.rush - dt);
          settle(dt, b.rush > 0 ? 2.4 : b.on ? 0.6 : LEVEL, b.on ? 0 : 1);
        }
        draw();
      }
      raf = visible && !document.hidden && !reduce ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (!raf && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(el.clientWidth * ratio));
      cv.height = Math.max(1, Math.round(el.clientHeight * ratio));
      gl.viewport(0, 0, cv.width, cv.height);
      if (reduce && ready) draw();
    };
    const upload = () => {
      if (ready || !img.complete || !img.naturalWidth) return;
      try {
        texture(0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        texture(1);
        gl.uniform1f(u("u_img"), img.naturalWidth / img.naturalHeight);
        ready = true;
        setLive(true);
        wake();
      } catch {
        // The picture could not be read into the shader: the still version underneath stays on show.
        ready = false;
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
    img.addEventListener("load", upload);
    // With motion reduced the loop is not running, so each stroke or button press asks for one redraw.
    el.addEventListener("sand-touched", wake);
    resize();
    upload();
    wake();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      img.removeEventListener("load", upload);
      el.removeEventListener("sand-touched", wake);
    };
  }, [reduce]);

  function touch(e: ReactPointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const f = finger.current;
    const now = performance.now();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    // A press, or a move after a rest, sets the finger down afresh so no line is drawn from where it last was.
    if (e.type !== "pointermove" || now - f.at > 400) {
      f.fresh = true;
      f.px = x;
      f.py = y;
    }
    f.x = x;
    f.y = y;
    f.at = now;
    f.moved = true;
    e.currentTarget.dispatchEvent(new Event("sand-touched"));
  }

  function toggle() {
    const next = !cleared;
    setCleared(next);
    bare.current = { on: next ? 1 : 0, rush: 1.6 };
    well.current?.dispatchEvent(new Event("sand-touched"));
  }

  return (
    <section className="relative isolate flex min-h-[800px] w-full flex-col items-center justify-center overflow-hidden bg-[#14110e] px-4 py-14">
      <style>{`
        .pbs-grain { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.27 0 0 0 0 0.18 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .pbs-furrow { -webkit-mask: radial-gradient(42% 16% at 46% 30%, transparent 62%, #000 100%); mask: radial-gradient(42% 16% at 46% 30%, transparent 62%, #000 100%); }
        @media (prefers-reduced-motion: reduce) { .pbs-fade { transition: none; } }
      `}</style>
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(60% 50% at 44% 38%, #2a241e 0%, #14110e 70%)" }} />

      {/* The tray: a lacquered rim round a shallow well. */}
      <div className="relative w-[min(88vw,470px)] rounded-[22px] bg-[#4a311d] p-[22px] shadow-[inset_0_2px_0_rgba(255,226,190,0.42),inset_2px_0_0_rgba(255,226,190,0.2),inset_0_-4px_6px_rgba(0,0,0,0.6),inset_-3px_0_5px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,0,0,0.7),0_40px_60px_-20px_rgba(0,0,0,0.9),0_90px_120px_-50px_rgba(0,0,0,0.9)]" style={{ backgroundImage: WALNUT }}>
        <div
          ref={well}
          onPointerMove={touch}
          onPointerDown={touch}
          onPointerEnter={touch}
          className="relative aspect-[4/5] w-full cursor-crosshair touch-pan-y overflow-hidden rounded-[7px] bg-[#b9a585] shadow-[0_1.5px_0_rgba(255,226,190,0.3),1.5px_0_0_rgba(255,226,190,0.14),0_-1px_0_rgba(0,0,0,0.6)]"
        >
          <img ref={photo} src={print.src} alt={print.alt} crossOrigin="anonymous" width={900} height={1350} className="absolute inset-0 h-full w-full object-cover" />
          {/* The still version: sand with one cleared patch. On show until the shader is ready and whenever WebGL is missing. */}
          <div aria-hidden="true" className={`pbs-grain pbs-furrow absolute inset-0 bg-[#c9b796] ${cleared ? "hidden" : ""}`} />
          <canvas ref={canvas} aria-hidden="true" className={`pbs-fade absolute inset-0 h-full w-full transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`} />
          {/* The wall of the well shades the sand along the two edges nearest the lamp. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[7px] shadow-[inset_8px_11px_14px_rgba(30,18,6,0.55),inset_2px_3px_3px_rgba(30,18,6,0.5),inset_-1px_-1px_0_rgba(255,255,255,0.16),inset_0_0_0_1px_rgba(0,0,0,0.6)]" />
        </div>
      </div>

      <div className="mt-8 flex w-[min(88vw,470px)] items-center justify-between gap-4 px-1 text-[13px]">
        <p className="text-stone-300">Draw in the sand.</p>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={cleared}
          className="min-h-[40px] shrink-0 rounded-full border border-white/15 bg-white/5 px-4 text-[13px] font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110e]"
        >
          {cleared ? "Pour the sand back" : "Brush the sand off"}
        </button>
      </div>
    </section>
  );
}
