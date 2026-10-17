import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

// One picture per side of the prisms. Exactly three, framed alike.
const sides = [
  {
    name: "Vermilion",
    src: "https://images.pexels.com/photos/15689960/pexels-photo-15689960.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Close portrait of a man with a tall afro in a white striped shirt against a red wall",
    tone: "#b5372a",
  },
  {
    name: "Saffron",
    src: "https://images.pexels.com/photos/6976854/pexels-photo-6976854.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "A woman in a mustard beret and mustard jumper leaning on a tan suitcase against a yellow wall",
    tone: "#e2a12c",
  },
  {
    name: "Cobalt",
    src: "https://images.pexels.com/photos/35707519/pexels-photo-35707519.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "A woman with an afro and sunglasses crouching in a pink dress and black boots against a bright blue wall",
    tone: "#1f7fd6",
  },
];

/** How many prisms the picture is cut into. Up to 20. */
const SLATS = 14;
/** Seconds between one prism starting to turn and its neighbour following. */
const STAGGER = 0.052;
/** Seconds the billboard rests on a picture before it turns by itself. */
const REST = 3.5;

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `precision highp float;
uniform vec2 u_res;
uniform sampler2D u_t0;
uniform sampler2D u_t1;
uniform sampler2D u_t2;
uniform vec3 u_img;
uniform float u_ang[20];
uniform float u_n;

vec2 cover(vec2 uv, float img){
  float A = u_res.x / u_res.y;
  vec2 t = uv;
  if (img > A) t.x = (uv.x - 0.5) * A / img + 0.5;
  else t.y = (uv.y - 0.5) * img / A + 0.5;
  return clamp(t, 0.0, 1.0);
}
float hash(float n){ return fract(sin(n * 91.345) * 47453.5453); }

void main(){
  vec2 uv = vec2(gl_FragCoord.x / u_res.x, 1.0 - gl_FragCoord.y / u_res.y);
  float x = uv.x * u_n;
  float i = floor(x);
  float lx = fract(x) - 0.5;
  float ang = 0.0;
  for (int k = 0; k < 20; k++) { if (float(k) == i) ang = u_ang[k]; }

  // Each prism is an equilateral triangle seen from the front, a little narrower than its bay.
  float side = 0.972;
  float R = side / 1.7320508;
  float pxw = u_n / u_res.x;
  // The dark of the housing seen between prisms, with a little light leaking in from the front.
  vec3 col = vec3(0.016, 0.017, 0.020) + vec3(0.02) * smoothstep(0.42, 0.5, abs(lx));

  vec2 lamp = normalize(vec2(-0.42, 0.91));
  vec2 half_ = normalize(lamp + vec2(0.0, 1.0));
  for (int f = 0; f < 3; f++) {
    float n = float(f) * 2.0943951 - ang;
    float c = cos(n);
    if (c <= 0.0) continue;
    float x1 = R * sin(n - 1.0471976);
    float x2 = R * sin(n + 1.0471976);
    float e = min(lx - x1, x2 - lx);
    float inside = clamp(e / pxw + 0.5, 0.0, 1.0);
    if (inside <= 0.0) continue;
    float w = clamp((lx - x1) / (x2 - x1), 0.0, 1.0);
    vec2 at = vec2((i + w) / u_n, uv.y);
    vec3 pic;
    if (f == 0) pic = texture2D(u_t0, cover(at, u_img.x)).rgb;
    else if (f == 1) pic = texture2D(u_t1, cover(at, u_img.y)).rgb;
    else pic = texture2D(u_t2, cover(at, u_img.z)).rgb;

    vec2 nor = vec2(sin(n), c);
    float diffuse = max(dot(nor, lamp), 0.0);
    // How far back this point of the face sits. Faces turned into the housing fall into shade.
    float z = R * mix(cos(n - 1.0471976), cos(n + 1.0471976), w);
    float depth = smoothstep(-0.45 * R, 0.5 * R, z);
    vec3 lit = pic * (0.10 + 0.99 * diffuse) * mix(0.42, 1.0, depth);
    // The printed vinyl is glossy: a band of the lamp slides across a face as it swings past.
    float gloss = pow(max(dot(nor, half_), 0.0), 130.0);
    lit += vec3(1.0, 0.98, 0.94) * gloss * 0.30 * (0.4 + 0.6 * depth);
    // Folded aluminium lip down each long edge of a face.
    float lip = 1.0 - smoothstep(0.0, 0.022 / max(c, 0.25), min(w, 1.0 - w));
    vec3 metal = vec3(0.62, 0.64, 0.67) * (0.25 + 0.95 * diffuse) + vec3(1.0) * gloss * 0.6;
    lit = mix(lit, metal, lip * 0.45);
    col = mix(col, lit, inside);
  }

  // Lamps above the board: brighter at the top, and the rails shade the very ends of the prisms.
  col *= 1.07 - 0.20 * uv.y;
  col *= 0.55 + 0.45 * smoothstep(0.0, 0.035, uv.y);
  col *= 0.70 + 0.30 * smoothstep(0.0, 0.022, 1.0 - uv.y);
  // No two prisms are hung perfectly true, so each takes the light a touch differently.
  col *= 0.975 + 0.05 * hash(i + 3.0);
  gl_FragColor = vec4(col, 1.0);
}`;

export default function ThreeSidedBillboardPhotoGalleryWithPrismSlatsThatRotateInAWaveBetweenPictures() {
  const reduce = useReducedMotion();
  const face = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pics = useRef<(HTMLImageElement | null)[]>([]);
  /** Requests from the page to the draw loop: turns to make, and where the pointer is over the board. */
  const ask = useRef<{ turns: { by: number; from: number }[]; x: number; at: number; touched: number }>({ turns: [], x: 0.5, at: -1e6, touched: -1e6 });
  const [live, setLive] = useState(false);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const el = face.current;
    const cv = canvas.current;
    const imgs = pics.current;
    if (reduce || !el || !cv || imgs.length < 3 || imgs.some((img) => !img)) return;
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
    gl.uniform1i(u("u_t0"), 0);
    gl.uniform1i(u("u_t1"), 1);
    gl.uniform1i(u("u_t2"), 2);
    gl.uniform1f(u("u_n"), SLATS);
    const uni = { res: u("u_res"), img: u("u_img"), ang: u("u_ang[0]") };

    const third = (Math.PI * 2) / 3;
    const angle = new Float32Array(20);
    const speed = new Float32Array(20);
    const goal = new Float32Array(20);
    const lean = new Float32Array(20);
    /** Each prism hangs a hair off true. */
    const off = Array.from({ length: 20 }, (_, i) => Math.sin(i * 12.9898) * 0.022);
    const queue: { col: number; when: number; to: number }[] = [];
    let step = 0;
    let ready = false;
    let visible = true;
    let raf = 0;
    let last = 0;
    let clock = 0;
    let nextTurn = 0.9;

    const upload = () => {
      if (ready || imgs.some((img) => !img || !img.complete || !img.naturalWidth)) return;
      try {
        imgs.forEach((img, unit) => {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img!);
        });
        const ratio = (img: HTMLImageElement | null) => (img ? img.naturalWidth / img.naturalHeight : 1);
        gl.uniform3f(uni.img, ratio(imgs[0]), ratio(imgs[1]), ratio(imgs[2]));
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
      gl.uniform2f(uni.res, cv.width, cv.height);
    };

    const loop = (stamp: number) => {
      if (ready) {
        const dt = Math.min(last ? (stamp - last) / 1000 : 0.016, 0.033);
        last = stamp;
        clock += dt;
        const a = ask.current;
        // With nobody near it, the board turns to its next picture on a timer, starting from the left.
        if (clock >= nextTurn && stamp - a.touched > 4200) a.turns.push({ by: 1, from: 0 });
        while (a.turns.length) {
          const turn = a.turns.shift()!;
          step += turn.by;
          for (let i = 0; i < SLATS; i++) queue.push({ col: i, when: clock + Math.abs(i - turn.from) * STAGGER, to: step });
          nextTurn = clock + REST + SLATS * STAGGER;
          setShown(((step % 3) + 3) % 3);
        }
        for (let q = queue.length - 1; q >= 0; q--) {
          if (queue[q].when <= clock) {
            goal[queue[q].col] = queue[q].to;
            queue.splice(q, 1);
          }
        }
        const near = stamp - a.at < 900;
        for (let i = 0; i < SLATS; i++) {
          // A hand passing over the board nudges the prisms beneath it part of the way round.
          const away = a.x * SLATS - (i + 0.5);
          const want = near ? 0.5 * Math.exp(-(away * away) / 3.2) : 0;
          lean[i] += (want - lean[i]) * Math.min(1, dt * 9);
          const target = goal[i] * third + off[i] + lean[i];
          // A firm spring, slightly under-damped, so each prism overshoots and clacks back onto its stop.
          speed[i] += ((target - angle[i]) * 95 - speed[i] * 9.6) * dt;
          angle[i] += speed[i] * dt;
        }
        gl.uniform1fv(uni.ang, angle);
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
    imgs.forEach((img) => img?.addEventListener("load", upload));
    upload();
    resize();
    wake();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      imgs.forEach((img) => img?.removeEventListener("load", upload));
    };
  }, [reduce]);

  /** Turn the board by a number of sides, the wave starting at a given prism. Without the canvas the pictures simply swap. */
  function turn(by: number, from: number) {
    if (live) ask.current.turns.push({ by, from });
    else setShown((n) => (((n + by) % 3) + 3) % 3);
    ask.current.touched = performance.now();
  }
  function over(e: ReactPointerEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    ask.current.x = (e.clientX - r.left) / r.width;
    ask.current.at = performance.now();
    ask.current.touched = ask.current.at;
  }
  function onKey(e: ReactKeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      turn(1, 0);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      turn(-1, SLATS - 1);
    }
  }

  return (
    <section className="relative isolate flex min-h-[800px] w-full flex-col items-center justify-center overflow-hidden bg-[#0d0e12] px-4 py-14">
      <style>{`
        .tsb-seams { background-image: linear-gradient(90deg, rgba(0,0,0,0) calc(100% - 2px), rgba(0,0,0,0.7) calc(100% - 2px)); background-size: calc(100% / ${SLATS}) 100%; }
        .tsb-case { background: linear-gradient(100deg, #9a9ea6 0%, #d5d8dd 16%, #b3b7be 34%, #e3e5e9 52%, #a4a8b0 70%, #c9ccd2 86%, #8b8f97 100%); }
        .tsb-well { box-shadow: 0 0 0 1px rgba(0,0,0,0.75), 0 1px 0 1px rgba(255,255,255,0.5), inset 0 0 0 1px #000; }
        .tsb-rail { background: linear-gradient(180deg, #4a4d55 0%, #2a2c32 18%, #1b1c21 55%, #101114 100%); }
      `}</style>
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(55% 45% at 50% 30%, #23262f 0%, #0d0e12 72%)" }} />

      {/* The housing: a top rail, the turning face and a bottom rail. */}
      <div className="tsb-case relative w-[min(86vw,430px)] rounded-[7px] p-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(0,0,0,0.45),inset_1px_0_0_rgba(255,255,255,0.35),inset_-1px_0_0_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.8),0_50px_80px_-30px_rgba(0,0,0,0.95)]">
        <div className="tsb-well rounded-[2px] bg-[#08080a]">
        <div aria-hidden="true" className="tsb-rail flex h-[18px] items-center justify-between rounded-t-[2px] px-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_3px_5px_rgba(0,0,0,0.6)]">
          <span className="h-[5px] w-[5px] rounded-full bg-[#0b0b0d] shadow-[0_1px_0_rgba(255,255,255,0.18)]" />
          <span className="h-[5px] w-[5px] rounded-full bg-[#0b0b0d] shadow-[0_1px_0_rgba(255,255,255,0.18)]" />
        </div>
        <button
          ref={face}
          type="button"
          aria-label={`Billboard showing ${sides[shown].name}, picture ${shown + 1} of 3. Press to turn to the next picture. Left and right arrows turn it either way.`}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            turn(1, e.detail === 0 ? 0 : Math.min(SLATS - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * SLATS))));
          }}
          onPointerMove={over}
          onKeyDown={onKey}
          className="relative block aspect-[4/5] w-full cursor-pointer touch-pan-y overflow-hidden bg-[#08080a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-inset"
        >
          {sides.map((side, i) => (
            <img
              key={side.name}
              src={side.src}
              alt={side.alt}
              ref={(node) => {
                pics.current[i] = node;
              }}
              crossOrigin="anonymous"
              width={900}
              height={1125}
              style={{ backgroundColor: side.tone }}
              className={`absolute inset-0 h-full w-full object-cover ${i === shown ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          <span aria-hidden="true" className="tsb-seams absolute inset-0 block" />
          <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`} />
        </button>
        <div aria-hidden="true" className="tsb-rail h-[14px] rounded-b-[2px] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]" />
        </div>
      </div>

      <div className="mt-6 flex w-[min(86vw,430px)] items-center justify-between gap-3">
        <div className="flex gap-1.5" role="group" aria-label="Choose a picture">
          {sides.map((side, i) => (
            <button
              key={side.name}
              type="button"
              aria-pressed={i === shown}
              onClick={() => {
                const by = (((i - shown) % 3) + 3) % 3;
                if (by) turn(by === 2 ? -1 : 1, by === 2 ? SLATS - 1 : 0);
              }}
              className={`flex h-10 items-center gap-2 rounded-full px-3 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${i === shown ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: side.tone }} />
              {side.name}
            </button>
          ))}
        </div>
        <p className="hidden whitespace-nowrap text-[13px] text-zinc-400 sm:block">Click to turn</p>
      </div>
    </section>
  );
}
