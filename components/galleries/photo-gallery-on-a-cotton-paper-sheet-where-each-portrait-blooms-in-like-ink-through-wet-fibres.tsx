import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// One entry per plate: the picture, its title, and the colour of ink it soaks in with.
const plates = [
  {
    title: "Carmine",
    ink: "#3b0d16",
    src: "https://images.pexels.com/photos/32174976/pexels-photo-32174976.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "A woman with a full round afro, both hands raised to her hair, in a black top against a bright red wall",
  },
  {
    title: "Verdigris",
    ink: "#0b2c36",
    src: "https://images.pexels.com/photos/19342936/pexels-photo-19342936.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "A woman with long straight hair in a dark open jacket, lit in teal with a warm edge of light, looking down into the camera",
  },
  {
    title: "Rose madder",
    ink: "#1c2038",
    src: "https://images.pexels.com/photos/15227249/pexels-photo-15227249.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "A woman with dark hair tied back, a navy blazer pulled around bare shoulders, against a soft peach wall",
  },
  {
    title: "Saffron",
    ink: "#47200a",
    src: "https://images.pexels.com/photos/38164214/pexels-photo-38164214.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "A woman with a shaved head in a white sleeveless top and dark trousers, leaning one elbow on a tall white plinth against an orange backdrop",
  },
];

/** Seconds one bloom takes, and seconds a finished plate rests before the next one starts. */
const BLOOM = 2.6;
const REST = 2.4;
/** Where on the sheet each bloom starts (0 to 1 each way). They are used in turn. */
const SEEDS = [
  [0.34, 0.3],
  [0.7, 0.62],
  [0.3, 0.74],
  [0.68, 0.24],
];

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `precision highp float;
uniform vec2 u_res;
uniform sampler2D u_from;
uniform sampler2D u_to;
uniform vec2 u_img;
uniform float u_blank;
uniform float u_p;
uniform vec2 u_seed;
uniform vec3 u_ink;
uniform float u_shift;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}
vec2 cover(vec2 uv, float img){
  float A = u_res.x / u_res.y;
  vec2 t = uv;
  if (img > A) t.x = (uv.x - 0.5) * A / img + 0.5;
  else t.y = (uv.y - 0.5) * img / A + 0.5;
  return clamp(t, 0.0, 1.0);
}

void main(){
  vec2 uv = vec2(gl_FragCoord.x / u_res.x, 1.0 - gl_FragCoord.y / u_res.y);
  float A = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * A, uv.y);

  // The sheet: long fibres one way, a finer tooth across them.
  float fibre = fbm(p * vec2(34.0, 150.0)) * 0.6 + fbm(p * 210.0) * 0.4;
  vec3 paper = vec3(0.972, 0.958, 0.925) * (0.95 + 0.09 * fibre);

  // How long the wet front takes to reach this point. Big soft lobes, then fine feathering along the fibres.
  vec2 q = p * 2.1 + u_shift;
  vec2 warp = vec2(fbm(q), fbm(q + 7.3)) - 0.5;
  float d = length(p - vec2(u_seed.x * A, u_seed.y) + warp * 0.34);
  float reach = d * 0.86 + (fbm(p * 5.0 + warp * 2.4 + u_shift * 1.7) - 0.5) * 0.46 + (fibre - 0.5) * 0.13;
  float s = (u_p * 2.35 - 0.24) - reach;

  float soaked = smoothstep(0.0, 0.03, s);
  float settled = smoothstep(0.14, 0.58, s);
  // Pigment gathers where the water stops: a darker line riding the front.
  float tide = smoothstep(0.0, 0.016, s) * (1.0 - smoothstep(0.016, 0.085, s));
  float damp = smoothstep(-0.11, 0.0, s) * (1.0 - soaked);

  // The paper swells a little where it is wettest, which shifts the picture under it.
  vec2 swell = warp * 0.022 * (1.0 - settled) * soaked;
  vec3 next = texture2D(u_to, cover(uv + swell, u_img.y)).rgb;
  vec3 prev = mix(texture2D(u_from, cover(uv, u_img.x)).rgb, paper, u_blank);
  prev = mix(prev, prev * vec3(0.86, 0.85, 0.84), damp);

  // First the picture arrives in one ink only, then its own colours come up behind the front.
  float tone = dot(next, vec3(0.299, 0.587, 0.114));
  float load = clamp(1.22 - tone * 1.08, 0.0, 1.0);
  load = load * (0.82 + 0.36 * fbm(p * 9.0 + u_shift));
  vec3 wash = mix(paper, u_ink, clamp(load, 0.0, 1.0));
  wash = mix(wash, u_ink, tide * 0.8);

  vec3 col = mix(prev, wash, soaked);
  col = mix(col, next, settled);
  // Everything is printed on the same sheet, so the tooth shows through the finished plate too.
  col *= 0.955 + 0.075 * fibre;
  gl_FragColor = vec4(col, 1.0);
}`;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

export default function PhotoGalleryOnACottonPaperSheetWhereEachPortraitBloomsInLikeInkThroughWetFibres() {
  const reduce = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const images = useRef<(HTMLImageElement | null)[]>([]);
  const want = useRef(0);
  const playing = useRef(true);
  const held = useRef(0);
  const [index, setIndex] = useState(0);
  const [play, setPlay] = useState(true);
  const [live, setLive] = useState(false);

  useEffect(() => {
    want.current = index;
  }, [index]);
  useEffect(() => {
    playing.current = play;
  }, [play]);

  useEffect(() => {
    const el = frame.current;
    const cv = canvas.current;
    if (reduce || !el || !cv) return;
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
    gl.uniform1i(u("u_from"), 0);
    gl.uniform1i(u("u_to"), 1);
    const uni = { res: u("u_res"), img: u("u_img"), blank: u("u_blank"), p: u("u_p"), seed: u("u_seed"), ink: u("u_ink"), shift: u("u_shift") };

    const textures: (WebGLTexture | null)[] = plates.map(() => null);
    const shapes = plates.map(() => 0.8);
    const cleanups: (() => void)[] = [];
    let broken = false;
    plates.forEach((_, i) => {
      const img = images.current[i];
      if (!img) return;
      const upload = () => {
        if (textures[i] || broken || !img.naturalWidth) return;
        try {
          const tex = gl.createTexture();
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
          textures[i] = tex;
          shapes[i] = img.naturalWidth / img.naturalHeight;
          wake();
        } catch {
          // A picture could not be read into the shader: the plain pictures underneath stay on show.
          broken = true;
          setLive(false);
        }
      };
      if (img.complete) upload();
      img.addEventListener("load", upload);
      cleanups.push(() => img.removeEventListener("load", upload));
    });

    let shown = -1; // the plate that is soaking in, or has finished
    let under = -1; // what it is soaking over: -1 is the bare sheet
    let begun = 0;
    let count = 0;
    let visible = true;
    let raf = 0;
    const started = performance.now();

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(el.clientWidth * ratio));
      cv.height = Math.max(1, Math.round(el.clientHeight * ratio));
      gl.viewport(0, 0, cv.width, cv.height);
    };

    const loop = (stamp: number) => {
      const t = (stamp - started) / 1000;
      if (!broken) {
        let p = shown < 0 ? 1 : Math.min(1, (t - begun) / BLOOM);
        // The next plate can start once the last has settled and its own picture has arrived.
        if (p >= 1 && want.current !== shown && textures[want.current]) {
          under = shown;
          shown = want.current;
          begun = t;
          count += 1;
          p = 0;
          if (count === 1) setLive(true);
        } else if (p >= 1 && shown >= 0 && playing.current && stamp > held.current && t - begun > BLOOM + (count === 1 ? REST * 0.3 : REST)) {
          const following = (shown + 1) % plates.length;
          if (textures[following]) setIndex(following);
        }
        if (shown >= 0) {
          const seed = SEEDS[(count - 1) % SEEDS.length];
          const ink = rgb(plates[shown].ink);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, textures[under < 0 ? shown : under]);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, textures[shown]);
          gl.uniform2f(uni.res, cv.width, cv.height);
          gl.uniform2f(uni.img, shapes[under < 0 ? shown : under], shapes[shown]);
          gl.uniform1f(uni.blank, under < 0 ? 1 : 0);
          // Quick to spread at first, slow to finish, the way a wet front runs out of water.
          gl.uniform1f(uni.p, 1 - Math.pow(1 - p, 1.35));
          gl.uniform2f(uni.seed, seed[0], seed[1]);
          gl.uniform3f(uni.ink, ink[0], ink[1], ink[2]);
          gl.uniform1f(uni.shift, count * 3.71);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }
      raf = visible && !document.hidden && !broken ? requestAnimationFrame(loop) : 0;
    };
    function wake() {
      if (!raf && visible && !document.hidden && !broken) raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    resize();
    wake();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      cleanups.forEach((off) => off());
    };
  }, [reduce]);

  function choose(i: number) {
    held.current = performance.now() + 7000;
    setIndex(i);
  }
  const plate = plates[index];

  return (
    <section className="relative isolate flex min-h-[820px] w-full flex-col items-center justify-center overflow-hidden bg-[#e9e2d3] px-4 py-12">
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(80% 65% at 50% 30%, #f3eee2 0%, #e9e2d3 60%, #dbd2bf 100%)" }} />

      {/* The sheet: heavy cotton paper with the plate printed on it and its title set beneath. */}
      <figure
        className="relative w-[min(86vw,430px)] rounded-[3px] bg-[#f8f4ea] p-[18px] pb-0 sm:p-[22px] sm:pb-0"
        style={{ boxShadow: "0 1px 0 #ffffff inset, 0 0 0 1px rgba(120,100,70,0.10), 0 2px 3px rgba(80,60,30,0.12), 0 50px 60px -34px rgba(80,60,30,0.55), 0 18px 24px -16px rgba(80,60,30,0.30)" }}
      >
        <div ref={frame} className="relative aspect-[4/5] overflow-hidden bg-[#f1ecdf]">
          {plates.map((item, i) => (
            <img
              key={item.src}
              src={item.src}
              alt={item.alt}
              ref={(node) => {
                images.current[i] = node;
              }}
              aria-hidden={i === index ? undefined : true}
              crossOrigin="anonymous"
              width={900}
              height={1125}
              className={`absolute inset-0 h-full w-full object-cover ${i === index ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full ${live ? "opacity-100" : "opacity-0"}`} />
          {/* The plate mark: the press leaves the picture sitting a hair below the surface of the sheet. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_2px_rgba(60,45,20,0.35),inset_0_0_0_1px_rgba(60,45,20,0.08)]" />
        </div>
        <figcaption className="flex h-[58px] items-center justify-between text-[13px] text-stone-700">
          <span aria-live="polite" className="font-serif text-[17px] italic text-stone-900">
            {plate.title}
          </span>
          <span className="tabular-nums tracking-wide">
            Plate {index + 1} of {plates.length}
          </span>
        </figcaption>
      </figure>

      {/* One pot of ink per plate, and a way to stop the sheet changing by itself. */}
      <div className="mt-7 flex items-center gap-1">
        {plates.map((item, i) => (
          <button
            key={item.title}
            type="button"
            onClick={() => choose(i)}
            aria-label={`Show ${item.title}, plate ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
            className="group grid h-11 w-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
          >
            <span
              className={`block rounded-full shadow-[inset_0_2px_3px_rgba(255,255,255,0.35),inset_0_-3px_5px_rgba(0,0,0,0.45),0_3px_6px_-2px_rgba(60,45,20,0.6)] transition-all duration-300 motion-reduce:transition-none ${i === index ? "h-7 w-7 ring-2 ring-stone-900 ring-offset-[3px] ring-offset-[#e9e2d3]" : "h-5 w-5 group-hover:h-6 group-hover:w-6"}`}
              style={{ backgroundColor: item.ink }}
            />
          </button>
        ))}
        <span aria-hidden="true" className="mx-2 h-5 w-px bg-stone-400" />
        <button
          type="button"
          onClick={() => setPlay((v) => !v)}
          aria-pressed={!play}
          aria-label="Pause the slideshow"
          className="grid h-11 w-11 place-items-center rounded-full text-stone-800 transition-colors hover:bg-stone-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 motion-reduce:hidden"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            {play ? <path d="M5 3.5h3.4v13H5zM11.6 3.5H15v13h-3.4z" /> : <path d="M6 3.2 16.5 10 6 16.8z" />}
          </svg>
        </button>
      </div>
    </section>
  );
}
