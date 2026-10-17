import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useReducedMotion } from "framer-motion";

// The picture behind the glass. A warm one reads best against the cold of the frost.
const view = {
  src: "https://images.pexels.com/photos/3760817/pexels-photo-3760817.jpeg?auto=compress&cs=tinysrgb&w=1200",
  alt: "A woman with slicked-back hair in a red jumper against an orange wall, a band of red light across her face",
  tone: "#e08a1c",
};

/** Width of the patch a fingertip warms, as a share of the pane's height. */
const FINGER = 0.062;
/** How much warmth the glass loses each second. Raise it and the frost closes in sooner. */
const CHILL = 0.1;
/** The warmth is tracked on a coarse grid this many cells wide and tall. */
const GW = 56;
const GH = 70;

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `precision highp float;
uniform vec2 u_res;
uniform sampler2D u_pic;
uniform sampler2D u_heat;

vec2 hash2(vec2 p){
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash2(i).x;
  float b = hash2(i + vec2(1.0, 0.0)).x;
  float c = hash2(i + vec2(0.0, 1.0)).x;
  float d = hash2(i + vec2(1.0, 1.0)).x;
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) { v += amp * noise(p); p = p * 2.03 + 17.0; amp *= 0.5; }
  return v;
}
// Window frost grows outward from scattered seeds. This finds the nearest seed: xy is the vector from it to p,
// z is how close p is to the border with the next crystal, and who is a random pair for the seed.
vec3 seed(vec2 p, out vec2 who){
  vec2 cell = floor(p);
  vec2 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  vec2 r = vec2(0.0);
  who = vec2(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = hash2(cell + g);
      vec2 v = f - g - (0.15 + 0.7 * o);
      float d = length(v);
      if (d < d1) { d2 = d1; d1 = d; r = v; who = o; }
      else if (d < d2) { d2 = d; }
    }
  }
  return vec3(r, d2 - d1);
}
// One crystal: straight arms from the seed, each feathered with slanted barbs, and finer needles between them.
float crystal(vec2 p, out vec2 away, out float gap){
  vec2 who;
  vec3 s = seed(p, who);
  gap = s.z;
  float rho = length(s.xy);
  away = s.xy / max(rho, 0.0001);
  // The arms bow a little as they grow, and no two are the same length.
  float th = atan(s.y, s.x) + who.x * 6.2831 + rho * (who.y - 0.5) * 2.2;
  float arms = 4.0 + floor(who.y * 4.0);
  float slice = 6.2831 / arms;
  float which = floor(th / slice + 0.5);
  float reach = 0.30 + 0.55 * hash2(vec2(which, who.x * 91.0)).x;
  float off = abs(fract(th / slice + 0.5) - 0.5) * slice;
  float lat = rho * sin(min(off, 1.5));
  float along = rho * cos(min(off, 1.5));
  float tip = 1.0 - smoothstep(reach * 0.75, reach, along);
  float arm = exp(-lat * lat * 1700.0) * tip;
  float barb = pow(abs(sin((along - lat * 1.25) * 58.0)), 5.0) * exp(-lat * (7.0 + 9.0 * along / reach)) * smoothstep(0.02, 0.10, along) * tip;
  float needle = pow(abs(cos(th * arms * 2.5 + rho * 7.0)), 16.0) * smoothstep(0.04, 0.2, rho) * (1.0 - smoothstep(0.25, 0.5, rho));
  return clamp(arm + barb * 0.9 + needle * 0.14, 0.0, 1.0) * (0.25 + 0.75 * smoothstep(0.0, 0.10, gap));
}

void main(){
  vec2 uv = vec2(gl_FragCoord.x / u_res.x, 1.0 - gl_FragCoord.y / u_res.y);
  float A = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * A, uv.y);

  // Two sizes of crystal laid over each other: broad ferns, and a fine fur between them.
  vec2 awayBig;
  vec2 awayFine;
  float gapBig;
  float gapFine;
  vec2 wobble = (vec2(fbm(p * 2.6), fbm(p * 2.6 + 9.0)) - 0.5) * 0.30;
  float big = crystal((p + wobble) * 3.4, awayBig, gapBig);
  float fine = crystal((p + wobble * 0.5) * 9.5 + 4.0, awayFine, gapFine);
  float fur = pow(1.0 - abs(2.0 * noise(p * 58.0 + wobble * 30.0) - 1.0), 5.0);
  float thick = fbm(p * 2.2 + 5.0);
  float frost = max(big, fine * 0.62);
  float grain = hash2(gl_FragCoord.xy).x;

  float warmth = texture2D(u_heat, uv).r * 1.6;
  // Frost always holds on round the edge of the pane. The feathered arms are the thickest ice, so they are the last to go.
  vec2 rim = min(uv, 1.0 - uv);
  warmth -= 0.42 * (1.0 - smoothstep(0.0, 0.16, min(rim.x * A, rim.y)));
  float h = warmth + (fbm(p * 7.0) - 0.5) * 0.30 - frost * 0.20 + 0.06;
  float clear = smoothstep(0.44, 0.58, h);
  float mist = 1.0 - smoothstep(0.56, 0.86, h);
  float wet = smoothstep(0.30, 0.46, h) * (1.0 - smoothstep(0.64, 1.0, h));

  // Frost: the picture seen through it is only a blur of colour, pushed about by the crystals.
  vec2 bend = awayBig * big * 0.010 + awayFine * fine * 0.005;
  vec3 ice = texture2D(u_pic, clamp(uv + bend, 0.0, 1.0), 4.4).rgb;
  // Thick in some places and a thin glaze in others.
  float body = clamp(0.56 + 0.44 * (thick - 0.5), 0.0, 0.86);
  ice = mix(ice, vec3(dot(ice, vec3(0.3, 0.6, 0.1))), 0.18) * 1.08;
  ice = mix(ice, vec3(0.80, 0.87, 0.93), body);
  ice += vec3(0.93, 0.97, 1.0) * (0.34 * big + 0.20 * fine * (0.5 + thick) + 0.10 * fur * thick);
  // Where two crystals met the ice is thin, and a little more of the picture's colour comes through.
  ice *= 0.95 + 0.05 * smoothstep(0.0, 0.10, gapBig);
  ice += (grain - 0.5) * 0.05;
  // A few crystal faces happen to throw the light straight back.
  vec2 glint = hash2(floor(p * 190.0));
  ice += vec3(1.0) * 0.55 * step(0.975, glint.x) * frost * glint.y;

  // Thawed glass: sharp where it is warm, still a little fogged where it has only just cleared.
  vec3 sharp = texture2D(u_pic, uv).rgb;
  vec3 foggy = mix(texture2D(u_pic, uv, 2.0).rgb, vec3(0.88, 0.92, 0.95), 0.14);
  vec3 open = mix(sharp, foggy, mist * 0.7);

  // Meltwater: beads left standing where the ice has just gone. Each one is a tiny lens.
  vec2 g = p * 46.0;
  vec2 id = floor(g);
  vec2 rnd = hash2(id);
  vec2 rnd2 = hash2(id + 31.7);
  vec2 centre = id + 0.5 + (rnd - 0.5) * 0.5;
  float rad = 0.09 + 0.30 * rnd2.x * rnd2.x;
  float there = step(rnd2.y, wet * 0.5) * clear;
  vec2 off = (g - centre) / rad;
  float dd = length(off);
  float bead = there * (1.0 - smoothstep(0.86, 1.0, dd));
  vec3 inBead = texture2D(u_pic, clamp(uv - off * rad / 46.0 * 0.9, 0.0, 1.0)).rgb;
  inBead = inBead * (0.86 + 0.34 * smoothstep(-1.0, 1.0, off.x * 0.5 + off.y * 0.85)) + 0.05;
  inBead += vec3(1.0) * 0.80 * (1.0 - smoothstep(0.0, 0.24, length(off - vec2(-0.38, -0.42))));
  inBead *= 1.0 - 0.22 * smoothstep(0.70, 1.0, dd);

  vec3 col = mix(ice, open, clear);
  // A dark wet line where the ice ends, with a glint just inside it.
  float brink = smoothstep(0.40, 0.50, h) * (1.0 - smoothstep(0.50, 0.66, h));
  col *= 1.0 - 0.22 * brink;
  col += vec3(1.0) * 0.10 * smoothstep(0.50, 0.56, h) * (1.0 - smoothstep(0.56, 0.64, h));
  col = mix(col, inBead, bead);

  // The pane itself: a long reflection of the room across it and shade under the frame.
  float streak = 1.0 - smoothstep(0.0, 0.16, abs(uv.x * 0.9 + uv.y * 0.42 - 0.36));
  float streak2 = 1.0 - smoothstep(0.0, 0.045, abs(uv.x * 0.9 + uv.y * 0.42 - 0.60));
  col += vec3(0.92, 0.96, 1.0) * (0.085 * streak + 0.06 * streak2) * (1.0 - 0.45 * clear);
  float edge = min(rim.x * A, rim.y);
  col *= 0.72 + 0.28 * smoothstep(0.0, 0.035, edge);
  gl_FragColor = vec4(col, 1.0);
}`;

export default function FrostedWindowPaneOverAPhotographThatThawsUnderAWarmFingertipAndFreezesOverAgain() {
  const reduce = useReducedMotion();
  const pane = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  /** Where the fingertip is on the glass (0 to 1 each way), when it last moved, and how many breaths are waiting. */
  const finger = useRef({ x: 0.5, y: 0.36, at: -1e6, breaths: 0 });
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = pane.current;
    const cv = canvas.current;
    const img = photo.current;
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
    gl.uniform1i(u("u_pic"), 0);
    gl.uniform1i(u("u_heat"), 1);
    const uRes = u("u_res");

    // Warmth of the glass, 0 (frozen) to 1.6 (hot), on a coarse grid. Two copies so it can spread without smearing.
    let heat = new Float32Array(GW * GH);
    let next = new Float32Array(GW * GH);
    const bytes = new Uint8Array(GW * GH);
    const aspect = () => el.clientWidth / Math.max(1, el.clientHeight);
    const warm = (fx: number, fy: number, size: number, amount: number) => {
      const A = aspect();
      const reach = Math.ceil(size * 3 * GH);
      const cx = Math.round(fx * (GW - 1));
      const cy = Math.round(fy * (GH - 1));
      for (let y = Math.max(0, cy - reach); y <= Math.min(GH - 1, cy + reach); y++) {
        for (let x = Math.max(0, cx - reach); x <= Math.min(GW - 1, cx + reach); x++) {
          const dx = (x / (GW - 1) - fx) * A;
          const dy = y / (GH - 1) - fy;
          const add = amount * Math.exp(-(dx * dx + dy * dy) / (2 * size * size));
          heat[y * GW + x] = Math.min(1.6, heat[y * GW + x] + add);
        }
      }
    };
    // The glass starts with a patch already rubbed clear over the face.
    warm(0.5, 0.36, 0.15, 1.5);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let ready = false;
    let visible = true;
    let raf = 0;
    let last = 0;
    const started = performance.now();

    const upload = () => {
      if (ready || !img.complete || !img.naturalWidth) return;
      try {
        // The picture is cropped to the pane and drawn into a square sheet, so the card can keep ready-made blurred copies of it.
        const sheet = document.createElement("canvas");
        sheet.width = 1024;
        sheet.height = 1024;
        const pen = sheet.getContext("2d");
        if (!pen) return;
        const A = aspect();
        const ia = img.naturalWidth / img.naturalHeight;
        const sw = ia > A ? img.naturalHeight * A : img.naturalWidth;
        const sh = ia > A ? img.naturalHeight : img.naturalWidth / A;
        pen.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, 1024, 1024);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, sheet);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        ready = true;
        setLive(true);
      } catch {
        // The picture could not be read into the shader: the still version underneath stays on show.
        ready = false;
      }
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(el.clientWidth * ratio));
      cv.height = Math.max(1, Math.round(el.clientHeight * ratio));
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(uRes, cv.width, cv.height);
    };

    const loop = (stamp: number) => {
      if (ready) {
        const t = (stamp - started) / 1000;
        const dt = Math.min(last ? (stamp - last) / 1000 : 0.016, 0.033);
        last = stamp;
        const f = finger.current;
        if (stamp - f.at < 260) {
          warm(f.x, f.y, FINGER, dt * 9);
        } else if (stamp - f.at > 2600) {
          // Nobody is touching the glass: an unseen finger draws slow loops on it so the frost is always on the move.
          const fx = 0.5 + 0.27 * Math.sin(t * 0.62 + 0.3) + 0.06 * Math.sin(t * 1.7);
          const fy = 0.36 + 0.2 * Math.sin(t * 0.47 + 1.4) + 0.05 * Math.cos(t * 1.3);
          warm(fx, fy, FINGER * 1.15, dt * 5.5);
        }
        while (f.breaths > 0) {
          f.breaths--;
          warm(f.x, f.y, 0.2, 1.3);
        }
        // The warmth spreads a little into its neighbours and leaks away, so the frost creeps back from the outside in.
        const spread = Math.min(0.2, dt * 2.4);
        const loss = dt * CHILL;
        for (let y = 0; y < GH; y++) {
          for (let x = 0; x < GW; x++) {
            const i = y * GW + x;
            const around = (heat[y > 0 ? i - GW : i] + heat[y < GH - 1 ? i + GW : i] + heat[x > 0 ? i - 1 : i] + heat[x < GW - 1 ? i + 1 : i]) * 0.25;
            const v = heat[i] + (around - heat[i]) * spread - loss;
            next[i] = v > 0 ? v : 0;
            bytes[i] = Math.min(255, next[i] * 159.4);
          }
        }
        [heat, next] = [next, heat];
        gl.activeTexture(gl.TEXTURE1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, GW, GH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes);
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
    img.addEventListener("load", upload);
    upload();
    resize();
    wake();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      img.removeEventListener("load", upload);
    };
  }, [reduce]);

  function rub(e: { clientX: number; clientY: number; currentTarget: HTMLButtonElement }) {
    const r = e.currentTarget.getBoundingClientRect();
    finger.current = { ...finger.current, x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, at: performance.now() };
  }
  /** Arrow keys slide the fingertip across the glass. Enter and Space, like a click, breathe a wide warm patch onto it. */
  function onKey(e: ReactKeyboardEvent<HTMLButtonElement>) {
    const move: Record<string, [number, number]> = { ArrowLeft: [-0.06, 0], ArrowRight: [0.06, 0], ArrowUp: [0, -0.05], ArrowDown: [0, 0.05] };
    const by = move[e.key];
    if (!by) return;
    e.preventDefault();
    const f = finger.current;
    finger.current = { ...f, x: Math.min(0.95, Math.max(0.05, f.x + by[0])), y: Math.min(0.95, Math.max(0.05, f.y + by[1])), at: performance.now() };
  }

  return (
    <section className="relative isolate flex min-h-[780px] w-full flex-col items-center justify-center overflow-hidden bg-[#d9e0e6] px-4 py-14">
      <style>{`
        .fwp-still { -webkit-backdrop-filter: blur(16px) brightness(1.12) saturate(0.7); backdrop-filter: blur(16px) brightness(1.12) saturate(0.7); background: rgba(226, 236, 244, 0.42); -webkit-mask-image: radial-gradient(62% 48% at 50% 38%, transparent 0 46%, #000 78%); mask-image: radial-gradient(62% 48% at 50% 38%, transparent 0 46%, #000 78%); }
      `}</style>
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(65% 55% at 50% 36%, #f1f5f8 0%, #d9e0e6 60%, #c3ccd4 100%)" }} />

      {/* The window: a slim painted frame with the pane set back inside it. */}
      <div className="relative w-[min(84vw,420px)] rounded-[5px] bg-[linear-gradient(145deg,#3b3f45_0%,#23262a_45%,#17191c_100%)] p-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(0,0,0,0.6),0_2px_3px_rgba(40,55,70,0.35),0_30px_44px_-22px_rgba(40,55,70,0.55),0_70px_90px_-50px_rgba(40,55,70,0.6)]">
        <button
          ref={pane}
          type="button"
          aria-label="Frosted window over a photograph. Move the pointer across the glass to melt the frost, or press Enter to breathe on it. Arrow keys move the warm spot."
          onClick={(e) => {
            if (e.detail !== 0) rub(e);
            finger.current.breaths++;
            finger.current.at = performance.now();
          }}
          onPointerMove={rub}
          onPointerDown={rub}
          onKeyDown={onKey}
          className="relative block aspect-[4/5] w-full cursor-pointer touch-pan-y overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.7),inset_0_0_0_1px_rgba(255,255,255,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-[14px] focus-visible:ring-offset-[#d9e0e6]"
          style={{ backgroundColor: view.tone }}
        >
          {/* The still version: the photograph with frost left round the edges. Shown with reduced motion or without WebGL. */}
          <img ref={photo} src={view.src} alt={view.alt} crossOrigin="anonymous" width={1200} height={1800} className="absolute inset-0 h-full w-full object-cover" />
          <span aria-hidden="true" className="fwp-still absolute inset-0 block" />
          <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`} />
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 block shadow-[inset_0_10px_14px_-8px_rgba(0,0,0,0.55),inset_6px_0_10px_-8px_rgba(0,0,0,0.4)]" />
        </button>
      </div>

      <div className="mt-8 flex w-[min(84vw,420px)] items-baseline justify-between gap-4 px-0.5 text-[13px]">
        <p className="whitespace-nowrap font-semibold text-slate-800">Minus four</p>
        <p className="text-right text-slate-600">Rub the glass, or click to breathe</p>
      </div>
    </section>
  );
}
