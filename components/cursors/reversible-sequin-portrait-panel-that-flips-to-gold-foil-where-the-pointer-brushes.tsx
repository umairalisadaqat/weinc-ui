import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

// The picture printed across the fronts of the sequins.
const portrait = {
  name: "Ultramarine",
  src: "https://images.pexels.com/photos/28969185/pexels-photo-28969185.jpeg?auto=compress&cs=tinysrgb&w=900",
  alt: "A person with short bleached hair looking upward, one hand in their hair, lit pink against a bright blue backdrop",
};
/** The colour of the backs, as red, green and blue from 0 to 1. */
const FOIL = { name: "Gold", rgb: [0.86, 0.61, 0.2] };

/** Sequins across the panel. Fewer makes each disc larger. */
const COLS = 30;
/** Row spacing as a share of the column spacing. Below 1 the rows overlap like scales. */
const ROW = 0.8;
/** Brush width in sequins: the pointer, and the hand that strokes the cloth when nobody is touching it. */
const BRUSH = 2.3;
const DEMO_BRUSH = 2.9;

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `precision highp float;
uniform vec2 u_res;
uniform vec2 u_grid;
uniform vec2 u_span;
uniform vec2 u_shift;
uniform float u_pitch;
uniform float u_rp;
uniform sampler2D u_a;
uniform vec3 u_foil;
uniform sampler2D u_state;
uniform float u_img;
uniform vec3 u_light;
const float R = 0.66;
const float OFF = 0.28;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 cover(vec2 uv, float img){
  float A = u_span.x / u_span.y;
  vec2 t = uv;
  if (img > A) t.x = (uv.x - 0.5) * A / img + 0.5;
  else t.y = (uv.y - 0.5) * img / A + 0.5;
  return clamp(t, 0.0, 1.0);
}

void main(){
  vec2 px = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec2 q = px / u_pitch - u_shift;
  float r0 = floor((q.y - 0.7) / u_rp + 0.5);
  float best = -1.0e5;
  vec4 outc = vec4(0.0);
  // The net the sequins are sewn to, seen in the gaps while one is on edge.
  vec2 inner = step(vec2(0.55, 0.7), q) * step(q, u_span - u_shift * 2.0 - vec2(0.6, 0.7));
  outc = vec4(vec3(0.07, 0.06, 0.07), 1.0) * inner.x * inner.y;
  float aa = 1.6 / (u_pitch * R);
  vec3 L = normalize(u_light);
  vec3 Hh = normalize(L + vec3(0.0, 0.0, 1.0));

  for (int j = -2; j <= 2; j++){
    float r = r0 + float(j);
    if (r < 0.0 || r >= u_grid.y) continue;
    float odd = mod(r, 2.0);
    float c0 = floor(q.x - 0.6 - 0.5 * odd + 0.5);
    for (int i = -1; i <= 1; i++){
      float c = c0 + float(i);
      if (c < 0.0 || c >= u_grid.x) continue;
      float f = texture2D(u_state, (vec2(c, r) + 0.5) / u_grid).r;
      float ang = f * 3.14159265;
      float ca = cos(ang);
      float sa = sin(ang);
      vec2 hinge = vec2(c + 0.5 * odd + 0.6, r * u_rp + 0.7);
      vec2 cen = hinge + vec2(0.0, OFF * ca);
      float ry = R * max(abs(ca), 0.07);
      vec2 l = (q - cen) / vec2(R, ry);
      float d = length(l);
      if (d > 1.0) continue;
      // Hanging down, a row lies over the row beneath it. Flipped up it is the other way round. One on edge stands proud of both.
      float z = mix(-r, r, f) + 5.0 * sa;
      if (z < best) continue;
      best = z;

      float front = step(0.0, ca);
      float sgn = front * 2.0 - 1.0;
      float id = hash(vec2(c, r));
      float id2 = hash(vec2(r + 7.3, c + 1.7));
      vec2 uvp = (mix(q, cen, 0.45) + u_shift) / u_span;
      vec3 foil = u_foil * (0.74 + 0.42 * id2) + vec3(0.07, -0.01, -0.05) * (id - 0.5);
      vec3 base = mix(foil, texture2D(u_a, cover(uvp, u_img)).rgb, front);
      // A sequin is a flat disc of foil, barely dished, sewn on at its own small angle. So each one lights up whole, at a different moment from its neighbours.
      vec2 tilt = (vec2(id, id2) - 0.5) * 0.84;
      vec3 n = normalize(vec3(l.x * 0.07 + tilt.x, l.y * 0.07 * sgn + tilt.y - sa * 1.5, 1.0));
      float dif = max(dot(n, L), 0.0);
      float facing = max(dot(n, Hh), 0.0);
      float away = l.y * sgn;
      // The row lying over this one shades the half nearest the stitch.
      float ao = mix(0.5, 1.0, smoothstep(-0.95, -0.05, away));
      float metal = mix(1.0, 0.72, front);
      vec3 col = base * (0.50 + 0.62 * dif) * ao;
      col += base * pow(facing, 14.0) * 0.55 * metal * ao;
      col += mix(vec3(1.0), base, 0.35) * pow(facing, 90.0) * 0.95 * metal;
      // The stamped edge is a hair proud: lit on the side facing the lamp, dark on the other.
      float rim = smoothstep(0.84, 0.96, d);
      col *= 1.0 + 0.42 * rim * dot(normalize(l + 0.0001), normalize(L.xy));
      // The sewing hole.
      float hd = length(q - hinge);
      col = mix(col, vec3(0.05, 0.04, 0.05), (1.0 - smoothstep(0.035, 0.07, hd)) * 0.8);
      float edge = 1.0 - smoothstep(1.0 - aa, 1.0, d);
      outc = mix(outc, vec4(col, 1.0), edge);
    }
  }
  gl_FragColor = vec4(outc.rgb * outc.a, outc.a);
}`;

/** A small repeatable random source, so the idle strokes are the same on every load. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export default function ReversibleSequinPortraitPanelThatFlipsToGoldFoilWhereThePointerBrushes() {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const first = useRef<HTMLImageElement>(null);
  /** The pointer in panel fractions, the face the current stroke lays down, and when it last moved. */
  const hand = useRef({ x: 0.5, y: 0.5, px: 0.5, py: 0.5, side: 1, at: -1e6, fresh: true, moved: false });
  const sweep = useRef<{ side: number; at: number } | null>(null);
  const [live, setLive] = useState(false);
  const [top, setTop] = useState(0);

  useEffect(() => {
    const el = panel.current;
    const cv = canvas.current;
    const one = first.current;
    if (!el || !cv || !one) return;
    const gl = cv.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true });
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
    gl.uniform1i(u("u_state"), 1);
    gl.uniform3f(u("u_foil"), FOIL.rgb[0], FOIL.rgb[1], FOIL.rgb[2]);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    const texture = (unit: number, filter: number) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    };

    // The cloth: how far over each sequin is (0 hangs down showing the first face, 1 is flipped up), how fast it is turning, and where it is headed.
    let rows = 1;
    let spanW = COLS + 0.76;
    let spanH = 1;
    let shiftY = 0.3;
    let flip = new Float32Array(0);
    let vel = new Float32Array(0);
    let goal = new Float32Array(0);
    let stiff = new Float32Array(0);
    let bytes = new Uint8Array(0);
    const cellX = (c: number, r: number) => c + 0.5 * (r % 2) + 0.6;
    const cellY = (r: number) => r * ROW + 0.7;

    const layout = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(el.clientWidth * ratio));
      cv.height = Math.max(1, Math.round(el.clientHeight * ratio));
      gl.viewport(0, 0, cv.width, cv.height);
      const pitch = cv.width / spanW;
      spanH = cv.height / pitch;
      const fit = Math.max(2, Math.floor((spanH - 2.0) / ROW) + 1);
      shiftY = (spanH - ((fit - 1) * ROW + 1.4)) / 2;
      const fresh = fit !== rows || flip.length !== COLS * fit;
      if (fresh) {
        rows = fit;
        const n = COLS * rows;
        flip = new Float32Array(n);
        vel = new Float32Array(n);
        goal = new Float32Array(n);
        stiff = new Float32Array(n);
        bytes = new Uint8Array(n);
        const rnd = seeded(7);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < COLS; c++) {
            const i = r * COLS + c;
            stiff[i] = 70 + rnd() * 90;
            flip[i] = 0;
            goal[i] = 0;
          }
        }
      }
      if (fresh) opening();
      gl.uniform2f(u("u_res"), cv.width, cv.height);
      gl.uniform2f(u("u_grid"), COLS, rows);
      gl.uniform2f(u("u_span"), spanW, spanH);
      gl.uniform2f(u("u_shift"), 0.02, shiftY);
      gl.uniform1f(u("u_pitch"), pitch);
      gl.uniform1f(u("u_rp"), ROW);
    };

    /** Lay every sequin within reach of the segment over to one face. Distances are in sequins. */
    const brush = (x0: number, y0: number, x1: number, y1: number, reach: number, side: number) => {
      const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.6));
      for (let s = 0; s <= steps; s++) {
        const x = x0 + ((x1 - x0) * s) / steps;
        const y = y0 + ((y1 - y0) * s) / steps;
        const rA = Math.max(0, Math.floor((y - reach - 0.7) / ROW));
        const rB = Math.min(rows - 1, Math.ceil((y + reach - 0.7) / ROW));
        for (let r = rA; r <= rB; r++) {
          const cA = Math.max(0, Math.floor(x - reach - 1.1));
          const cB = Math.min(COLS - 1, Math.ceil(x + reach));
          for (let c = cA; c <= cB; c++) {
            if (Math.hypot(cellX(c, r) - x, cellY(r) - y) < reach) goal[r * COLS + c] = side;
          }
        }
      }
    };
    const sideAt = (x: number, y: number) => {
      const r = Math.min(rows - 1, Math.max(0, Math.round((y - 0.7) / ROW)));
      const c = Math.min(COLS - 1, Math.max(0, Math.round(x - 0.6 - 0.5 * (r % 2))));
      return goal[r * COLS + c] > 0.5 ? 1 : 0;
    };

    let ready = false;
    let visible = true;
    let raf = 0;
    let last = 0;
    const started = performance.now();
    const rnd = seeded(21);
    // The idle hand. It lays a stroke of foil, lays a second, then goes back and brushes the first away, so there are never more than two on the cloth.
    type Path = { x0: number; y0: number; x1: number; y1: number; bend: number; tall: boolean };
    const along = (p: Path, k: number): [number, number] => {
      const e = k * k * (3 - 2 * k);
      const arc = Math.sin(Math.PI * e) * p.bend;
      return [p.x0 + (p.x1 - p.x0) * e + (p.tall ? arc : 0), p.y0 + (p.y1 - p.y0) * e + (p.tall ? 0 : arc)];
    };
    const slant = (): Path => {
      const tall = rnd() > 0.5;
      const a = rnd() > 0.5 ? 0.06 + rnd() * 0.3 : 0.64 + rnd() * 0.3;
      const b = a < 0.5 ? 0.6 + rnd() * 0.34 : 0.06 + rnd() * 0.34;
      return tall
        ? { x0: a * spanW, y0: -2, x1: b * spanW, y1: spanH + 2, bend: (rnd() - 0.5) * spanW * 0.4, tall }
        : { x0: -2, y0: a * spanH, x1: spanW + 2, y1: b * spanH, bend: (rnd() - 0.5) * spanH * 0.3, tall };
    };
    const laid: Path[] = [];
    let demo: { path: Path; side: number; from: number; lx: number; ly: number } | null = null;
    let demoNext = started + 1100;
    let turn = 0;
    const opening = () => {
      // It opens with one stroke of foil already brushed up from the lower corner.
      const first: Path = { x0: -2, y0: spanH * 0.5, x1: spanW * 0.66, y1: spanH + 2, bend: spanH * 0.1, tall: false };
      laid.length = 0;
      laid.push(first);
      let [lx, ly] = along(first, 0);
      for (let k = 0.02; k <= 1; k += 0.02) {
        const [x, y] = along(first, k);
        brush(lx, ly, x, y, DEMO_BRUSH, 1);
        lx = x;
        ly = y;
      }
      for (let i = 0; i < flip.length; i++) flip[i] = goal[i];
    };

    const draw = (t: number) => {
      for (let i = 0; i < flip.length; i++) bytes[i] = Math.max(0, Math.min(255, Math.round(flip[i] * 255)));
      gl.activeTexture(gl.TEXTURE1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, COLS, rows, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes);
      const h = hand.current;
      // The lamp drifts a little, and leans toward the pointer, which is what makes the glints travel.
      gl.uniform3f(u("u_light"), -0.42 + 0.3 * Math.sin(t * 0.55) + (h.x - 0.5) * 0.5, -0.5 + 0.22 * Math.cos(t * 0.41) + (h.y - 0.5) * 0.4, 0.78);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const applyHand = () => {
      const h = hand.current;
      const w = spanW;
      const hgt = spanH;
      if (h.moved) {
        const x = h.x * w - 0.02;
        const y = h.y * hgt - shiftY;
        const px = h.px * w - 0.02;
        const py = h.py * hgt - shiftY;
        if (h.fresh) {
          h.side = 1 - sideAt(x, y);
          h.fresh = false;
          brush(x, y, x, y, BRUSH, h.side);
        } else brush(px, py, x, y, BRUSH, h.side);
        h.px = h.x;
        h.py = h.y;
        h.moved = false;
      }
    };
    // With motion reduced nothing swings: a stroke or the button turns its sequins over at once and the cloth is drawn again.
    const still = () => {
      if (!reduce || !ready) return;
      applyHand();
      const sw = sweep.current;
      if (sw) goal.fill(sw.side);
      sweep.current = null;
      flip.set(goal);
      draw(0);
    };

    const loop = (stamp: number) => {
      if (ready) {
        const t = (stamp - started) / 1000;
        const dt = Math.min(last ? (stamp - last) / 1000 : 0.016, 0.033);
        last = stamp;
        const h = hand.current;

        applyHand();

        // With nobody touching it, an unseen hand strokes the cloth one way and then the other.
        if (stamp - h.at > 2600) {
          if (stamp >= demoNext) {
            const lay = turn % 2 === 0 || !laid.length;
            const path = lay ? slant() : laid.shift()!;
            if (lay) laid.push(path);
            const [sx, sy] = along(path, 0);
            demo = { path, side: lay ? 1 : 0, from: stamp, lx: sx, ly: sy };
            turn++;
            demoNext = stamp + 2500;
          }
          if (demo) {
            const k = (stamp - demo.from) / 1500;
            if (k <= 1) {
              const [x, y] = along(demo.path, k);
              brush(demo.lx, demo.ly, x, y, DEMO_BRUSH + (demo.side ? 0 : 0.7), demo.side);
              demo.lx = x;
              demo.ly = y;
            } else demo = null;
          }
        } else demoNext = stamp + 600;

        // The button below sends one stroke across the whole panel.
        const sw = sweep.current;
        if (sw) {
          const p = (stamp - sw.at) / 900;
          for (let r = 0; r < rows; r++) for (let c = 0; c < COLS; c++) if (c / COLS + 0.12 * Math.sin(r * 0.7) < p * 1.2 - 0.1) goal[r * COLS + c] = sw.side;
          if (p > 1.1) sweep.current = null;
        }

        // Each sequin swings over on its own spring and settles with a small wobble.
        for (let i = 0; i < flip.length; i++) {
          const k = stiff[i];
          vel[i] += ((goal[i] - flip[i]) * k - vel[i] * 1.25 * Math.sqrt(k)) * dt;
          flip[i] += vel[i] * dt;
        }
        draw(t);
      }
      raf = visible && !document.hidden && !reduce ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (!raf && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    const upload = () => {
      if (ready || !one.complete || !one.naturalWidth) return;
      try {
        texture(0, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, one);
        texture(1, gl.NEAREST);
        gl.uniform1f(u("u_img"), one.naturalWidth / one.naturalHeight);
        ready = true;
        setLive(true);
        if (reduce) draw(0);
      } catch {
        // A picture could not be read into the shader: the still version underneath stays on show.
        ready = false;
      }
    };

    const ro = new ResizeObserver(() => {
      layout();
      if (reduce && ready) draw(0);
    });
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    el.addEventListener("sequins-touched", still);
    one.addEventListener("load", upload);
    layout();
    upload();
    wake();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      el.removeEventListener("sequins-touched", still);
      one.removeEventListener("load", upload);
    };
  }, [reduce]);

  function stroke(e: ReactPointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const h = hand.current;
    const now = performance.now();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    // A new stroke starts on a press, on entering the cloth, or after the hand has rested. It lays down whichever face is not showing where it begins.
    if (e.type !== "pointermove" || now - h.at > 320) {
      h.fresh = true;
      h.px = x;
      h.py = y;
    }
    h.x = x;
    h.y = y;
    h.at = now;
    h.moved = true;
    e.currentTarget.dispatchEvent(new Event("sequins-touched"));
  }

  function sweepAll() {
    const side = top === 0 ? 1 : 0;
    setTop(side);
    sweep.current = { side, at: performance.now() };
    hand.current.at = performance.now();
    panel.current?.dispatchEvent(new Event("sequins-touched"));
  }

  const next = top === 0 ? FOIL.name : portrait.name;

  return (
    <section className="relative isolate flex min-h-[800px] w-full flex-col items-center justify-center overflow-hidden bg-[#e7e3dc] px-4 py-14">
      <style>{`
        .rsp-still { clip-path: polygon(0 52%, 22% 62%, 46% 100%, 12% 100%, 0 84%); }
        @media (prefers-reduced-motion: reduce) { .rsp-fade { transition: none; } }
      `}</style>
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(62% 52% at 44% 36%, #f4f1ec 0%, #e7e3dc 60%, #d9d4cb 100%)" }} />

      <div
        ref={panel}
        onPointerMove={stroke}
        onPointerDown={stroke}
        onPointerEnter={stroke}
        className="relative aspect-[4/5] w-[min(88vw,480px)] cursor-crosshair touch-pan-y"
      >
        <div aria-hidden="true" className="absolute inset-x-[7%] bottom-[-4%] top-[12%] rounded-[40px] bg-[#4a3d2c]/60 blur-2xl" />
        <div aria-hidden="true" className="absolute inset-x-[3%] bottom-[0.5%] top-[4%] rounded-[10px] bg-[#2b241b]/55 blur-[6px]" />
        {/* The still version, on show until the shader is ready and whenever WebGL is missing. */}
        <div className={`rsp-fade absolute inset-[2.5%] overflow-hidden rounded-md bg-[#3b6fd0] transition-opacity duration-500 ${live ? "opacity-0" : "opacity-100"}`}>
          <img ref={first} src={portrait.src} alt={portrait.alt} crossOrigin="anonymous" width={900} height={1350} className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden="true" className="rsp-still absolute inset-0 bg-[#e0ad3f]" />
        </div>
        <canvas ref={canvas} aria-hidden="true" className={`rsp-fade absolute inset-0 h-full w-full transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`} />
      </div>

      <div className="mt-8 flex w-[min(88vw,480px)] items-center justify-between gap-4 px-1 text-[13px]">
        <p className="text-neutral-700">Stroke the sequins.</p>
        <button
          type="button"
          onClick={sweepAll}
          className="min-h-[40px] shrink-0 rounded-full bg-neutral-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7e3dc]"
        >
          Brush it all to {next}
        </button>
      </div>
    </section>
  );
}
