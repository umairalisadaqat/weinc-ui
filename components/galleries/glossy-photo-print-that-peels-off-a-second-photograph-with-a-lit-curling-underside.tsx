import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

// Two prints stacked on the table. Peeling the top one off uncovers the other.
const prints = [
  {
    name: "Rosé",
    src: "https://images.pexels.com/photos/28209648/pexels-photo-28209648.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "A woman in a red dress, patterned headscarf and cat-eye sunglasses resting her chin on her hand against a pale pink wall",
    tone: "#e3c3cb",
  },
  {
    name: "Verdigris",
    src: "https://images.pexels.com/photos/9489589/pexels-photo-9489589.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "A woman in a green beret, green jacket and green gloves looking down at a green ball in her hands against a green wall",
    tone: "#2f6b3a",
  },
];

/** Radius of the curl as a share of the print's height. Bigger is a lazier, fatter roll. */
const CURL = 0.085;
/** How far the corner has to travel (in print heights) before letting go pulls the print right off. */
const LET_GO = 0.8;

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `precision highp float;
uniform vec2 u_res;
uniform vec4 u_rect;
uniform sampler2D u_a;
uniform sampler2D u_b;
uniform vec2 u_img;
uniform vec2 u_c;
uniform vec2 u_d;
uniform float u_r;
uniform float u_fade;
uniform float u_top;
float A;
float PX;
const float PI = 3.14159265;

// Each print has a white border, as a lab print does. BORDER is its width as a share of the print height.
const float BORDER = 0.026;
vec2 fit(vec2 q, float img){
  vec2 size = vec2(A, 1.0) - 2.0 * BORDER;
  vec2 uv = (q - BORDER) / size;
  float inner = size.x / size.y;
  if (img > inner) uv.x = (uv.x - 0.5) * inner / img + 0.5;
  else uv.y = (uv.y - 0.5) * img / inner + 0.5;
  return clamp(uv, 0.0, 1.0);
}
vec3 bordered(vec3 c, vec2 q){
  vec2 e = min(q, vec2(A, 1.0) - q);
  return mix(vec3(0.958, 0.952, 0.936), c, smoothstep(BORDER - PX, BORDER + PX, min(e.x, e.y)));
}
vec3 topPrint(vec2 q){ return bordered(mix(texture2D(u_a, fit(q, u_img.x)).rgb, texture2D(u_b, fit(q, u_img.y)).rgb, u_top), q); }
vec3 lowPrint(vec2 q){ return bordered(mix(texture2D(u_b, fit(q, u_img.y)).rgb, texture2D(u_a, fit(q, u_img.x)).rgb, u_top), q); }
// 1 inside the sheet, 0 outside, with an edge w wide.
float cov(vec2 q, float w){
  vec2 e = min(q, vec2(A, 1.0) - q);
  return clamp(min(e.x, e.y) / w + 0.5, 0.0, 1.0);
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// How much of the lifted paper (the roll and the flap that has come over) sits above q.
float lifted(vec2 q, float w){
  float t = dot(q - u_c, u_d);
  float ridge = 1.0 - smoothstep(u_r - w * 0.5, u_r + w * 0.5, t);
  if (t < 0.0) return cov(q + u_d * (PI * u_r - 2.0 * t), w);
  float th = asin(clamp(t / u_r, 0.0, 1.0));
  return cov(q + u_d * (u_r * (PI - th) - min(t, u_r)), w) * ridge;
}

void main(){
  vec2 px = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  PX = 1.0 / u_rect.w;
  A = u_rect.z / u_rect.w;
  vec2 q = (px - u_rect.xy) * PX;
  float t = dot(q - u_c, u_d);
  vec2 fall = normalize(vec2(0.50, 0.86));
  float lift = 2.0 * u_r;

  // Shadow of the lifted paper: a tight dark one where it leaves the table and a wide soft one further out.
  float near = lifted(q - fall * lift * 0.30, 0.018 + lift * 0.10);
  float far = lifted(q - fall * lift * 0.95, 0.03 + lift * 0.30);
  float dark = clamp(near * 0.42 + far * 0.34, 0.0, 1.0) * u_fade;

  vec3 col = vec3(0.0);
  float al = dark * 0.36 * cov(q, 0.30);

  // The print underneath.
  float lowIn = cov(q, PX);
  vec3 low = lowPrint(q);
  low *= 1.0 - dark;
  col = mix(col, low, lowIn);
  al = mix(al, 1.0, lowIn);

  // The top print, picture side. Flat where it still lies down, then climbing the roll.
  float frontIn;
  vec3 front;
  if (t < 0.0) {
    frontIn = cov(q, PX);
    front = topPrint(q) * (1.0 - dark * 0.85);
    // The gloss coat picks up a breath of light just before the paper leaves the table.
    front += vec3(1.0) * 0.07 * exp(t / (u_r * 0.9));
  } else {
    float th = asin(clamp(t / u_r, 0.0, 1.0));
    vec2 qo = q + u_d * (u_r * th - t);
    frontIn = cov(qo, PX) * (1.0 - smoothstep(u_r - PX, u_r + PX, t));
    float up = sin(th);
    front = topPrint(qo) * mix(1.0, 0.36, pow(up, 1.6));
    front += vec3(1.0, 0.98, 0.95) * 0.34 * exp(-pow((th - 0.50) / 0.20, 2.0));
  }
  col = mix(col, front, frontIn * u_fade);
  al = mix(al, 1.0, frontIn * u_fade);

  // The back of the top print: over the roll, then lying flat, lit from above.
  float backIn;
  float lit;
  vec2 qb;
  float turn;
  if (t < 0.0) {
    qb = q + u_d * (PI * u_r - 2.0 * t);
    backIn = cov(qb, PX);
    lit = 0.985 - 0.07 * smoothstep(0.0, 0.7, -t);
    turn = 0.0;
  } else {
    float th = asin(clamp(t / u_r, 0.0, 1.0));
    qb = q + u_d * (u_r * (PI - th) - t);
    backIn = cov(qb, PX) * (1.0 - smoothstep(u_r - PX, u_r + PX, t));
    float k = cos(th);
    lit = 0.50 + 0.50 * pow(k, 0.8) + 0.05 * exp(-pow((k - 0.78) / 0.16, 2.0));
    turn = 1.0 - k;
  }
  vec3 paper = vec3(0.972, 0.962, 0.940) * lit;
  // Colour thrown up onto the underside by the print below it.
  vec2 under = q + u_d * u_r;
  vec3 bounce = (lowPrint(under + vec2(0.07, 0.0)) + lowPrint(under - vec2(0.07, 0.0)) + lowPrint(under + vec2(0.0, 0.07)) + lowPrint(under - vec2(0.0, 0.07))) * 0.25;
  paper = mix(paper, paper * (0.45 + bounce * 1.1), 0.36 * turn * lowIn);
  // Paper tooth, and the maker's ruled marks that photo paper carries on its back.
  paper *= 1.0 - 0.030 * hash(floor(qb * vec2(1100.0, 420.0)));
  float rule = step(0.90, fract((qb.x + qb.y) * 9.0)) * step(0.45, fract((qb.y - qb.x) * 4.5));
  paper *= 1.0 - 0.045 * rule;
  col = mix(col, paper, backIn * u_fade);
  al = mix(al, 1.0, backIn * u_fade);

  gl_FragColor = vec4(col, al);
}`;

export default function GlossyPhotoPrintThatPeelsOffASecondPhotographWithALitCurlingUnderside() {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLElement>(null);
  const print = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const first = useRef<HTMLImageElement>(null);
  const second = useRef<HTMLImageElement>(null);
  /** Where a person is holding the corner (in print heights from its top left), when they last moved, and a request to pull it off. */
  const hand = useRef({ x: 0, y: 0, at: -1e6, pull: false });
  const [live, setLive] = useState(false);
  const [top, setTop] = useState(0);

  useEffect(() => {
    const host = stage.current;
    const el = print.current;
    const cv = canvas.current;
    const one = first.current;
    const two = second.current;
    if (reduce || !host || !el || !cv || !one || !two) return;
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
    gl.uniform1i(u("u_b"), 1);
    const uni = { res: u("u_res"), rect: u("u_rect"), img: u("u_img"), c: u("u_c"), d: u("u_d"), r: u("u_r"), fade: u("u_fade"), top: u("u_top") };

    let ready = false;
    let visible = true;
    let raf = 0;
    let last = 0;
    let ratio = 1;
    let aspect = 0.8;
    let onTop = 0;
    let flying = false;
    let idle = 0;
    const started = performance.now();
    // The corner starts already lifted so the first frame shows what the piece is.
    const pos = { x: 0.8 - 0.36, y: 1 - 0.3 };
    const vel = { x: 0, y: 0 };

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
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(host.clientWidth * ratio));
      cv.height = Math.max(1, Math.round(host.clientHeight * ratio));
      gl.viewport(0, 0, cv.width, cv.height);
      const outer = host.getBoundingClientRect();
      const inner = el.getBoundingClientRect();
      aspect = inner.width / inner.height;
      gl.uniform2f(uni.res, cv.width, cv.height);
      gl.uniform4f(uni.rect, (inner.left - outer.left) * ratio, (inner.top - outer.top) * ratio, inner.width * ratio, inner.height * ratio);
    };

    const loop = (stamp: number) => {
      if (ready) {
        const t = (stamp - started) / 1000;
        const dt = Math.min(last ? (stamp - last) / 1000 : 0.016, 0.033);
        last = stamp;
        const kx = aspect;
        const ky = 1;
        const held = stamp - hand.current.at < 2200;
        if (hand.current.pull) {
          hand.current.pull = false;
          flying = true;
        }
        let tx: number;
        let ty: number;
        let stiff = 46;
        if (flying) {
          // Pulled clean off: the corner heads up and away past the far side of the print.
          tx = kx - 3.4;
          ty = ky - 1.5;
          stiff = 9;
        } else if (held) {
          tx = hand.current.x;
          ty = hand.current.y;
          idle = 0;
        } else {
          // Nobody is holding it: the corner lifts and settles by itself, and now and then the print comes away.
          idle += dt;
          const reach = 0.46 + 0.2 * Math.sin(t * 0.85 - 0.6);
          const lean = -2.5 + 0.2 * Math.sin(t * 0.53);
          tx = kx + Math.cos(lean) * reach;
          ty = ky + Math.sin(lean) * reach;
          if (idle > 6.4) flying = true;
        }
        // The paper does not stretch: the corner cannot go further from the two pinned corners than the edges are long.
        if (!flying) {
          const pin = (cx: number, cy: number, max: number) => {
            const dx = tx - cx;
            const dy = ty - cy;
            const far = Math.hypot(dx, dy);
            if (far > max) {
              tx = cx + (dx / far) * max;
              ty = cy + (dy / far) * max;
            }
          };
          pin(kx, 0, 1);
          pin(0, ky, kx);
        }
        const damp = 2 * Math.sqrt(stiff) * (flying ? 1 : 0.72);
        vel.x += ((tx - pos.x) * stiff - vel.x * damp) * dt;
        vel.y += ((ty - pos.y) * stiff - vel.y * damp) * dt;
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;

        let dx = kx - pos.x;
        let dy = ky - pos.y;
        let gone = Math.hypot(dx, dy);
        if (flying && gone > 2.9) {
          // The top print has left. The one underneath is now on top, with the other slid in below it.
          onTop = 1 - onTop;
          setTop(onTop);
          flying = false;
          idle = 0;
          pos.x = kx - 0.02;
          pos.y = ky - 0.015;
          vel.x = 0;
          vel.y = 0;
          dx = 0.02;
          dy = 0.015;
          gone = 0.025;
        }
        if (gone < 0.004) {
          dx = 0.0032;
          dy = 0.0024;
          gone = 0.004;
        }
        const r = Math.min(CURL, (gone / Math.PI) * 0.8);
        const along = (gone + Math.PI * r) / 2;
        gl.uniform2f(uni.d, dx / gone, dy / gone);
        gl.uniform2f(uni.c, kx - (dx / gone) * along, ky - (dy / gone) * along);
        gl.uniform1f(uni.r, r);
        gl.uniform1f(uni.fade, flying ? 1 - Math.min(1, Math.max(0, (gone - 2.0) / 0.8)) : 1);
        gl.uniform1f(uni.top, onTop);
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
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(host);
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

  function hold(e: ReactPointerEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    hand.current = { ...hand.current, x: (e.clientX - r.left) / r.height, y: (e.clientY - r.top) / r.height, at: performance.now() };
  }
  /** Letting go far enough from the corner, or pressing the button from the keyboard, takes the print off. */
  function release(e: ReactPointerEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const far = Math.hypot(r.width / r.height - hand.current.x, 1 - hand.current.y);
    if (far > LET_GO) hand.current = { ...hand.current, pull: true, at: -1e6 };
    void e;
  }
  function takeOff() {
    if (live) hand.current = { ...hand.current, pull: true, at: -1e6 };
    else setTop((n) => 1 - n);
  }

  const upper = prints[top];
  const lower = prints[1 - top];

  return (
    <section ref={stage} className="relative isolate flex min-h-[780px] w-full flex-col items-center justify-center overflow-hidden bg-[#e7e2d8] px-4 py-16">
      <style>{`
        .gpp-cut { clip-path: polygon(0 0, 100% 0, 100% 58%, 46% 100%, 0 100%); }
        .gpp-flap { clip-path: polygon(100% 0, 0 100%, 21% 9%); background: linear-gradient(128deg, #b9b3a6 0%, #f7f4ec 34%, #fffdf8 62%, #dcd6c9 100%); }
      `}</style>
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(70% 60% at 42% 34%, #f6f2ea 0%, #e7e2d8 55%, #d6d0c4 100%)" }} />

      <button
        ref={print}
        type="button"
        aria-label={`Peel off the ${upper.name} print to show ${lower.name} underneath. Move the pointer over the print to lift its corner.`}
        onClick={takeOff}
        onPointerMove={hold}
        onPointerDown={hold}
        onPointerUp={release}
        className="relative block aspect-[4/5] w-[min(78vw,400px)] cursor-grab touch-pan-y bg-[#cfc9bc] shadow-[0_1px_1px_rgba(60,48,30,0.25),0_18px_26px_-14px_rgba(60,48,30,0.45),0_50px_70px_-36px_rgba(60,48,30,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-8 focus-visible:ring-offset-[#e7e2d8] active:cursor-grabbing"
      >
        {/* The still version: the lower print with the top one cut back at its corner. Shown with reduced motion or without WebGL. */}
        <img ref={first} src={prints[0].src} alt={prints[0].alt} crossOrigin="anonymous" width={900} height={1125} style={{ backgroundColor: prints[0].tone }} className={`absolute inset-0 box-border h-full w-full border-[10px] border-[#f5f3ee] object-cover ${top === 0 ? "gpp-cut z-10" : ""}`} />
        <img ref={second} src={prints[1].src} alt={prints[1].alt} crossOrigin="anonymous" width={900} height={1125} style={{ backgroundColor: prints[1].tone }} className={`absolute inset-0 box-border h-full w-full border-[10px] border-[#f5f3ee] object-cover ${top === 1 ? "gpp-cut z-10" : ""}`} />
        <span aria-hidden="true" className="gpp-flap absolute bottom-0 right-0 z-10 block h-[42%] w-[54%] drop-shadow-[6px_10px_10px_rgba(40,30,15,0.35)]" />
      </button>
      <canvas ref={canvas} aria-hidden="true" className={`pointer-events-none absolute inset-0 z-20 h-full w-full transition-opacity duration-300 ${live ? "opacity-100" : "opacity-0"}`} />

      <div className="relative z-30 mt-9 flex w-[min(78vw,400px)] items-baseline justify-between gap-4 text-[13px]">
        <p className="text-stone-600">
          <span className="font-semibold text-stone-900">{upper.name}</span>
          <span className="mx-2 text-stone-500">on</span>
          {lower.name}
        </p>
        <p className="text-stone-600">Peel the corner</p>
      </div>
    </section>
  );
}
