import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** The goods on the cards. Change a line here and its printed card and caption follow. */
const shop = { name: "Larder & Lathe", season: "Spring kitchen goods" };
const items = [
  {
    name: "Terracotta stacking mugs",
    note: "Wheel thrown, left raw outside and glazed within. Sold as a set of four.",
    price: "$84",
    care: ["Hand wash in warm water.", "The bare clay darkens with use", "and that is meant to happen."],
    photo: "https://images.pexels.com/photos/6611421/pexels-photo-6611421.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Terracotta mugs stacked beside white cups and plates on a pottery shelf",
    tone: "#b9876a",
  },
  {
    name: "Enamel lidded pots",
    note: "Steel shells in poppy, ink and chalk, with turned beech knobs on the lids.",
    price: "$136",
    care: ["Medium heat only.", "Lift, never drag, on glass hobs.", "Oil the beech knobs each season."],
    photo: "https://images.pexels.com/photos/20430668/pexels-photo-20430668.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Red, navy and white enamel pots with wooden knobs on a checked cloth beside peppers",
    tone: "#c9b49a",
  },
  {
    name: "Striped linen towels",
    note: "Washed flax with indigo stripes, folded and tied three to a bundle.",
    price: "$42",
    care: ["Wash at forty degrees.", "Line dry and press while damp.", "Softer every time it is washed."],
    photo: "https://images.pexels.com/photos/4794900/pexels-photo-4794900.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Blue and white striped linen towels folded on a woven rattan tray with cotton flowers",
    tone: "#a8a49a",
  },
  {
    name: "Copper saucepans",
    note: "Tin lined, with riveted iron handles. Three sizes that nest on one hook.",
    price: "$310",
    care: ["Polish the copper with lemon and salt.", "Retin when the grey wears through.", "Never heat one empty."],
    photo: "https://images.pexels.com/photos/35225640/pexels-photo-35225640.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Copper saucepans lined up on shelves and an old iron range in a tiled kitchen",
    tone: "#8a6a50",
  },
  {
    name: "Clip-top pantry jars",
    note: "Thick glass with wire bails and fresh rubber seals, for oil, salt and sugar.",
    price: "$28",
    care: ["Dishwasher safe without the seal.", "Boil the seals to refresh them.", "Keep the oil jar out of the sun."],
    photo: "https://images.pexels.com/photos/5590955/pexels-photo-5590955.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Glass oil bottle and clip-top jars of salt and sugar on a wooden worktop",
    tone: "#b39b78",
  },
];
const OAK = "https://images.pexels.com/photos/6544938/pexels-photo-6544938.jpeg?auto=compress&cs=tinysrgb&w=1280";
const WALNUT = "https://images.pexels.com/photos/9996341/pexels-photo-9996341.jpeg?auto=compress&cs=tinysrgb&w=1280";

const AUTOPLAY_MS = 4600; // time between self-playing flips
const FIRST_FLIP_MS = 3400; // the stand holds still first so it is seen complete
const FLIGHT_S = 1.3; // how long one card takes to go over the top
const LIFT = 0.98; // how high it is lifted while it turns
const LEAN = 0.2; // radians the cards lean back in the slot
const SLOT_GAP = 0.074; // distance between cards in the slot
const SLOT_SPRING = 150;
const SLOT_DAMPING = 15; // lower for more knock-on wobble
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const N = items.length;
const TW = 960;
const TH = 640;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const smoother = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;
uniform vec2 uRes; uniform vec3 uCam; uniform vec3 uTgt; uniform vec2 uShift; uniform float uFov;
uniform vec3 uCC[5]; uniform mat3 uCI[5]; uniform float uLay[5];
uniform float uSS; uniform float uFocus; uniform float uSeed;
uniform sampler2DArray uCards; uniform sampler2D uOak; uniform sampler2D uWal;
out vec4 fragColor;
const vec3 L = vec3(-0.62, 0.62, -0.48);
const vec3 SUN = vec3(1.0, 0.8, 0.6) * 3.1;
const vec3 SKY = vec3(0.64, 0.67, 0.74) * 0.5;
const float WALLZ = 4.0;
const vec3 BMIN = vec3(-1.3, -0.01, -1.55);
const vec3 BMAX = vec3(1.3, 3.1, 1.05);

float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + 1.0), f.x), f.y); }
float sdRR(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float sdCard(vec3 p){ float d = sdRR(p.xy, vec2(0.75, 0.5), 0.042);
  vec2 w = vec2(d + 0.003, abs(p.z) - 0.008); return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.003; }
float sdRBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdHolder(vec3 p){
  float b = sdRBox(p - vec3(0.0, 0.19, -0.1), vec3(1.02, 0.19, 0.5), 0.05);
  float t = sdRBox(p - vec3(0.0, 0.5, -0.13), vec3(0.93, 0.3, 0.25), 0.014);
  return max(b, -t);
}
float map(vec3 p, out float id){
  float d = sdHolder(p); id = 1.0;
  for (int i = 0; i < 5; i++){
    vec3 q = p - uCC[i]; float bd = length(q) - 0.93; if (bd > d) continue;
    float c = sdCard(uCI[i] * q); if (c < d){ d = c; id = 2.0 + float(i); }
  }
  return d;
}
float mapD(vec3 p){ float id; return map(p, id); }
vec2 box(vec3 ro, vec3 rd){ vec3 i = 1.0 / rd; vec3 a = (BMIN - ro) * i, b = (BMAX - ro) * i;
  vec3 lo = min(a, b), hi = max(a, b); return vec2(max(max(lo.x, lo.y), lo.z), min(min(hi.x, hi.y), hi.z)); }
float march(vec3 ro, vec3 rd, float tmax, out float id){
  id = 0.0; vec2 bb = box(ro, rd); if (bb.x > bb.y || bb.y < 0.0) return 1e9;
  float t = max(bb.x, 0.0); float te = min(bb.y, tmax);
  for (int i = 0; i < 120; i++){ float d = map(ro + rd * t, id); if (d < 0.00025 * t) return t; t += d * 0.92; if (t > te) break; }
  return 1e9;
}
float shadow(vec3 p){
  vec2 bb = box(p, L); if (bb.x > bb.y || bb.y < 0.0) return 1.0;
  float t = max(bb.x, 0.0) + 0.002; float res = 1.0; float ph = 1e10;
  for (int i = 0; i < 60; i++){ if (t > bb.y) break; float h = mapD(p + L * t); if (h < 0.0004) return 0.0;
    float y = h * h / (2.0 * ph); float d = sqrt(max(h * h - y * y, 0.0)); res = min(res, 11.0 * d / max(0.0001, t - y)); ph = h; t += clamp(h, 0.005, 0.2); }
  return clamp(res, 0.0, 1.0);
}
float ao(vec3 p, vec3 n){
  if (any(lessThan(p, BMIN - 0.5)) || any(greaterThan(p, BMAX + 0.5))) return 1.0;
  float o = 0.0, s = 1.0;
  for (int i = 1; i <= 5; i++){ float h = 0.01 + 0.06 * float(i); o += (h - mapD(p + n * h)) * s; s *= 0.72; }
  return clamp(1.0 - 1.7 * o, 0.0, 1.0);
}
vec3 nrm(vec3 p){ const vec2 k = vec2(1, -1); float e = 0.0005;
  return normalize(k.xyy * mapD(p + k.xyy * e) + k.yyx * mapD(p + k.yyx * e) + k.yxy * mapD(p + k.yxy * e) + k.xxx * mapD(p + k.xxx * e)); }
// Sun through a tall window on the left: its frame and glazing bars land on everything.
float win(vec3 p){
  float t = (-5.0 - p.x) / L.x; vec3 q = p + L * t; float s = 0.015 + t * 0.012;
  float inside = smoothstep(-s, s, q.y - 0.9) * smoothstep(-s, s, 5.6 - q.y) * smoothstep(-s, s, q.z + 4.4) * smoothstep(-s, s, 4.6 - q.z);
  float bars = smoothstep(0.035 - s, 0.035 + s, abs(fract(q.z / 1.7 + 0.15) - 0.5) * 1.7);
  float hb = smoothstep(0.03 - s, 0.03 + s, abs(q.y - 3.5));
  return inside * bars * hb;
}
vec3 env(vec3 r){
  vec3 c = mix(vec3(0.36, 0.3, 0.24), vec3(0.8, 0.76, 0.7), smoothstep(-0.25, 0.6, r.y));
  float w = smoothstep(0.82, 0.95, dot(r, normalize(vec3(-1.0, 0.5, -0.4))));
  return c + vec3(2.4, 2.1, 1.75) * w;
}
vec3 light(vec3 p, vec3 n, vec3 v, vec3 alb, float rough, float f0, float occ, float sh, float refl){
  float ndl = max(dot(n, L), 0.0); vec3 h = normalize(L + v);
  float ndh = max(dot(n, h), 0.0); float a = rough * rough; float a2 = a * a; float dd = ndh * ndh * (a2 - 1.0) + 1.0;
  float D = a2 / (3.14159 * dd * dd); float ndv = max(dot(n, v), 0.001);
  float F = f0 + (1.0 - f0) * pow(1.0 - max(dot(h, v), 0.0), 5.0);
  float k = (rough + 1.0) * (rough + 1.0) / 8.0; float G = ndl / (ndl * (1.0 - k) + k) * ndv / (ndv * (1.0 - k) + k);
  float spec = D * F * G / (4.0 * ndl * ndv + 0.001);
  vec3 col = (alb * (1.0 - F) + spec * 3.14159) * SUN * ndl * sh;
  col += alb * (SKY * (0.55 + 0.45 * n.y) + vec3(0.42, 0.31, 0.2) * (0.5 - 0.5 * n.y) * 0.8) * occ;
  float Fr = f0 + (1.0 - f0) * pow(1.0 - ndv, 5.0);
  col += env(reflect(-v, n)) * Fr * occ * refl;
  return col;
}
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 render(vec2 fc){
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 f = normalize(uTgt - uCam); vec3 r = normalize(cross(vec3(0, 1, 0), f)); vec3 u = cross(f, r);
  vec3 rd = normalize(f * uFov + uv.x * r + uv.y * u); vec3 ro = uCam; vec3 v = -rd;
  float tp = rd.y < 0.0 ? -ro.y / rd.y : 1e9; float tw = rd.z > 0.0 ? (WALLZ - ro.z) / rd.z : 1e9;
  float id; float tm = march(ro, rd, min(tp, tw), id);
  vec3 col;
  if (tm < 1e8){
    vec3 p = ro + rd * tm; vec3 n = nrm(p);
    float occ = ao(p, n); float sh = shadow(p + n * 0.003) * win(p);
    if (id > 1.5){
      int i = int(id - 2.0 + 0.5); vec3 lp = uCI[i] * (p - uCC[i]);
      vec2 cu = vec2(lp.x / 1.5 + 0.5, 0.5 - lp.y);
      float bl = clamp(abs(tm - uFocus) * 1.4, 0.0, 2.5);
      vec3 alb; float rough = 0.55; float refl = 0.35;
      float grain = 0.965 + 0.035 * vn(lp.xy * vec2(420.0, 380.0)) + 0.02 * vn(lp.xy * 60.0);
      if (lp.z < -0.0055){ alb = texture(uCards, vec3(cu, uLay[i]), bl).rgb; rough = 0.38; refl = 0.55; }
      else if (lp.z > 0.0055){ alb = texture(uCards, vec3(cu.x, 1.0 - cu.y, uLay[i] + 5.0), bl).rgb; }
      else { alb = vec3(0.8, 0.76, 0.68) * (0.9 + 0.1 * vn(vec2(lp.x + lp.y, lp.z) * 900.0)); }
      alb *= grain;
      col = light(p, n, v, alb, rough, 0.04, occ, sh, refl);
      float back = max(dot(-n, L), 0.0);
      if (back > 0.0) col += alb * SUN * 0.07 * back * shadow(p - n * 0.02) * win(p);
    } else {
      vec3 an = pow(abs(n), vec3(4.0)); an /= an.x + an.y + an.z;
      vec3 tx = texture(uWal, vec2(p.y * 0.8, p.z * 0.3) + 0.21).rgb;
      vec3 ty = texture(uWal, vec2(p.z * 0.8, p.x * 0.3) + 0.57).rgb;
      vec3 tz = texture(uWal, vec2(p.y * 0.8, p.x * 0.3) + 0.83).rgb;
      vec3 alb = (tx * an.x + ty * an.y + tz * an.z) * vec3(0.6, 0.5, 0.45);
      float sheen = 0.5 + 0.5 * vn(vec2(p.x * 2.0, p.y * 40.0 + p.z * 40.0));
      col = light(p, n, v, alb, 0.34 + 0.08 * sheen, 0.045, occ, sh, 0.6);
    }
  } else if (tp < tw){
    vec3 p = ro + rd * tp; vec3 n = vec3(0, 1, 0);
    float bl = clamp(abs(tp - uFocus) * 1.1, 0.0, 6.0);
    vec3 alb = texture(uOak, vec2(p.x * 0.36, p.z * 0.62) + 0.37, bl).rgb * vec3(0.98, 0.9, 0.8);
    float occ = ao(p, n) * mix(0.55, 1.0, smoothstep(0.0, 0.45, WALLZ - p.z));
    float sh = shadow(p + n * 0.002) * win(p);
    col = light(p, n, v, alb, 0.46, 0.04, occ, sh, 0.5);
  } else {
    vec3 p = ro + rd * tw; vec3 n = vec3(0, 0, -1);
    vec3 alb = vec3(0.76, 0.7, 0.62) * (0.95 + 0.05 * vn(p.xy * 2.3)) ;
    float occ = mix(0.5, 1.0, smoothstep(0.0, 0.5, p.y));
    col = light(p, n, v, alb, 0.9, 0.02, occ, shadow(p + n * 0.01) * win(p), 0.0);
  }
  col = aces(col * 0.82);
  return pow(col, vec3(1.0 / 2.2));
}
void main(){
  vec3 c;
  if (uSS > 1.5) c = 0.5 * (render(gl_FragCoord.xy + vec2(-0.25, 0.25)) + render(gl_FragCoord.xy + vec2(0.25, -0.25)));
  else c = render(gl_FragCoord.xy);
  vec2 q = gl_FragCoord.xy / uRes; c *= 0.88 + 0.12 * smoothstep(1.15, 0.35, length(q - vec2(0.55, 0.55)));
  c += (h21(gl_FragCoord.xy + uSeed) - 0.5) * 0.018;
  fragColor = vec4(c, 1.0);
}`;

type Sim = { slot: number; vel: number; target: number; lean: number; leanV: number; y: number; yV: number };

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

/** Paints the printed face (photo, number, name, price) and the ruled reverse of one card. */
function paintCard(ctx: CanvasRenderingContext2D, i: number, side: "front" | "back", img: HTMLImageElement | null) {
  const it = items[i];
  const num = `No. ${String(i + 1).padStart(2, "0")}`;
  ctx.save();
  ctx.fillStyle = side === "front" ? "#f3eee4" : "#f5f0e5";
  ctx.fillRect(0, 0, TW, TH);
  if (side === "front") {
    ctx.fillStyle = "#6b5b4a";
    ctx.font = `600 19px ${GROTESK}`;
    ctx.fillText(num.toUpperCase(), 44, 76);
    ctx.fillStyle = "#2a2018";
    ctx.font = `italic 36px ${SERIF}`;
    ctx.fillText(it.name, 150, 78);
    ctx.textAlign = "right";
    ctx.font = `500 26px ${GROTESK}`;
    ctx.fillText(it.price, TW - 44, 77);
    ctx.fillStyle = it.tone;
    ctx.fillRect(40, 112, TW - 80, 488);
    if (img) cover(ctx, img, 40, 112, TW - 80, 488);
    ctx.fillStyle = "rgba(40,30,20,0.22)";
    ctx.fillRect(40, 112, TW - 80, 1);
  } else {
    ctx.strokeStyle = "rgba(186,70,58,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 132);
    ctx.lineTo(TW, 132);
    ctx.stroke();
    ctx.strokeStyle = "rgba(108,148,190,0.5)";
    ctx.lineWidth = 1.5;
    for (let y = 196; y < TH - 20; y += 62) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(TW, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#3a2c20";
    ctx.font = `600 22px ${GROTESK}`;
    ctx.fillText(`${shop.name.toUpperCase()}  ·  ${num.toUpperCase()}`, 52, 96);
    ctx.font = `italic 38px ${SERIF}`;
    ctx.fillStyle = "#2f3a52";
    it.care.forEach((line, k) => ctx.fillText(line, 64, 184 + k * 62));
  }
  ctx.restore();
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
  return s;
}

export default function RecipeCardHolderGallery() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const [noGL, setNoGL] = useState(false);
  const cmd = useRef<{ queue: number[]; pausedUntil: number }>({ queue: [], pausedUntil: 0 });

  const go = useCallback((dir: number, user = true) => {
    if (user) cmd.current.pausedUntil = performance.now() + 12000;
    if (cmd.current.queue.length < 2) cmd.current.queue.push(dir);
    if (noGL) setActive((a) => (a + dir + N) % N);
  }, [noGL]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) {
      setNoGL(true);
      return;
    }
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
    } catch (e) {
      console.warn(e);
      setNoGL(true);
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      res: U("uRes"), cam: U("uCam"), tgt: U("uTgt"), shift: U("uShift"), fov: U("uFov"), cc: U("uCC"), ci: U("uCI"),
      lay: U("uLay"), ss: U("uSS"), focus: U("uFocus"), seed: U("uSeed"),
    };
    gl.uniform1i(U("uCards"), 0);
    gl.uniform1i(U("uOak"), 1);
    gl.uniform1i(U("uWal"), 2);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");

    // Card faces and backs live in one array texture: layers 0-4 fronts, 5-9 reverses.
    const cardTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, cardTex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 10, gl.SRGB8_ALPHA8, TW, TH, N * 2);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    const pc = document.createElement("canvas");
    pc.width = TW;
    pc.height = TH;
    const pctx = pc.getContext("2d")!;
    let dirty = true;
    const upload = (layer: number, i: number, side: "front" | "back", img: HTMLImageElement | null) => {
      paintCard(pctx, i, side, img);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, cardTex);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, TW, TH, 1, gl.RGBA, gl.UNSIGNED_BYTE, pc);
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      dirty = true;
    };
    items.forEach((_, i) => {
      upload(i, i, "front", null);
      upload(N + i, i, "back", null);
    });
    let alive = true;
    let loaded = 0;
    items.forEach((it, i) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (!alive) return;
        upload(i, i, "front", img);
        loaded++;
      };
      img.src = it.photo;
    });
    const woodTex = (unit: number, src: string, fill: [number, number, number]) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([...fill, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (!alive) return;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
        dirty = true;
      };
      img.src = src;
      return t;
    };
    const oak = woodTex(1, OAK, [214, 186, 150]);
    const wal = woodTex(2, WALNUT, [96, 60, 38]);

    // Physical state of each card. order[k] is the card standing in slot k (0 = front).
    const order = items.map((_, i) => i);
    const sims: Sim[] = items.map((_, i) => ({ slot: i, vel: 0, target: i, lean: 0, leanV: 0, y: 0, yV: 0 }));
    const jitter = items.map((_, i) => ({ x: Math.sin(i * 12.9) * 0.022, yaw: Math.sin(i * 7.3) * 0.018 }));
    let flight: { card: number; t: number; dir: number; shuffled: boolean } | null = null;
    const pending: { card: number; at: number; target: number }[] = [];
    const cc = new Float32Array(15);
    const ci = new Float32Array(45);
    const lay = new Float32Array(N);
    const zSlot = (s: number) => -0.262 + s * SLOT_GAP;

    const pose = (i: number, k: number, s: Sim, extra: { pitch: number; yaw: number; roll: number; lift: number; z: number | null }) => {
      const pitch = LEAN + s.lean + extra.pitch;
      const yaw = jitter[i].yaw + extra.yaw;
      const roll = extra.roll;
      // Rotation = Ry(yaw) * Rz(roll) * Rx(pitch); columns are the card's right, up and back axes.
      const cx = Math.cos(pitch), sx = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw), cz = Math.cos(roll), sz = Math.sin(roll);
      const rx = [[1, 0, 0], [0, cx, -sx], [0, sx, cx]];
      const rz = [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]];
      const ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]];
      const mul = (a: number[][], b: number[][]) => a.map((r) => [0, 1, 2].map((c) => r[0] * b[0][c] + r[1] * b[1][c] + r[2] * b[2][c]));
      const m = mul(ry, mul(rz, rx));
      const restUp = [0, Math.cos(LEAN + s.lean), Math.sin(LEAN + s.lean)];
      const base = [jitter[i].x, 0.201 + s.y, extra.z ?? zSlot(s.slot)];
      const c = [base[0] + restUp[0] * 0.5, base[1] + restUp[1] * 0.5 + extra.lift, base[2] + restUp[2] * 0.5];
      cc.set(c, k * 3);
      // Inverse rotation = transpose; GLSL reads mat3 column by column, so write rows of m as columns.
      for (let col = 0; col < 3; col++) for (let row = 0; row < 3; row++) ci[k * 9 + col * 3 + row] = m[col][row];
      lay[k] = i;
      return c;
    };

    let W = 0, H = 0, scale = 1, ss = 2;
    let phone = false;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      phone = r.width < 640;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = r.width * dpr * scale, h = r.height * dpr * scale;
      const cap = 1400000 / (ss > 1.5 ? 1.6 : 1);
      if (w * h > cap) {
        const k = Math.sqrt(cap / (w * h));
        w *= k;
        h *= k;
      }
      W = Math.max(2, Math.round(w));
      H = Math.max(2, Math.round(h));
      canvas.width = W;
      canvas.height = H;
      gl.viewport(0, 0, W, H);
      dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const ptr = { x: 0, y: 0, sx: 0, sy: 0, vx: 0, vy: 0 };
    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      ptr.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      ptr.y = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    };
    const onLeave = () => {
      ptr.x = 0;
      ptr.y = 0;
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);

    const start = performance.now();
    let clock = 0; // seconds of drawn time, so a slow first load never flips early
    let nextAuto = FIRST_FLIP_MS / 1000;
    let raf = 0, last = start, visible = true, frames = 0, acc = 0;
    const step = (dt: number, now: number) => {
      // Start a new flight when the stand is free.
      if (!flight && cmd.current.queue.length) {
        const dir = cmd.current.queue.shift()!;
        const card = dir > 0 ? order[0] : order[N - 1];
        if (reduce) {
          if (dir > 0) order.push(order.shift()!);
          else order.unshift(order.pop()!);
          order.forEach((c, k) => Object.assign(sims[c], { slot: k, target: k, vel: 0 }));
          setActive(order[0]);
        } else {
          flight = { card, t: 0, dir, shuffled: false };
          if (dir < 0) {
            order.unshift(order.pop()!);
            order.forEach((c, k) => c !== card && pending.push({ card: c, at: now + (N - k) * 55, target: k }));
            setActive(card);
          }
        }
        dirty = true;
      }
      clock += dt;
      if (!reduce && clock > nextAuto && (loaded >= N || clock > 7) && now > cmd.current.pausedUntil && !flight && !cmd.current.queue.length) {
        cmd.current.queue.push(1);
        nextAuto = clock + AUTOPLAY_MS / 1000;
      }
      if (flight) {
        flight.t += dt / FLIGHT_S;
        if (flight.dir > 0 && !flight.shuffled && flight.t > 0.3) {
          flight.shuffled = true;
          order.push(order.shift()!);
          order.forEach((c, k) => c !== flight!.card && pending.push({ card: c, at: now + (k - 0) * 70, target: k }));
          setActive(order[0]);
        }
        if (flight.t >= 1) {
          const s = sims[flight.card];
          const k = order.indexOf(flight.card);
          Object.assign(s, { slot: k, target: k, vel: 0, y: 0.045, yV: -1.6, lean: flight.dir > 0 ? -0.05 : 0.06, leanV: flight.dir > 0 ? 1.4 : -1.2 });
          // The landing knocks the neighbours.
          order.forEach((c) => c !== flight!.card && (sims[c].leanV += (flight!.dir > 0 ? 0.35 : -0.5) * (0.6 + Math.random() * 0.4)));
          flight = null;
          nextAuto = Math.max(nextAuto, clock + (AUTOPLAY_MS - 1200) / 1000);
        }
      }
      for (let p = pending.length - 1; p >= 0; p--) if (now >= pending[p].at) {
        sims[pending[p].card].target = pending[p].target;
        pending.splice(p, 1);
      }
      sims.forEach((s, i) => {
        if (flight && flight.card === i) return;
        const a = -SLOT_SPRING * (s.slot - s.target) - SLOT_DAMPING * s.vel;
        s.vel += a * dt;
        s.slot += s.vel * dt;
        // Sliding forward tips the top back a touch, then the card rocks to rest.
        const la = -90 * s.lean - 7 * s.leanV + s.vel * -1.9 * 0;
        s.leanV += (la - a * 0.0016) * dt;
        s.lean += s.leanV * dt;
        s.yV -= 9.8 * dt;
        s.y += s.yV * dt;
        if (s.y < 0) {
          s.y = 0;
          s.yV = Math.abs(s.yV) > 0.25 ? -s.yV * 0.32 : 0;
        }
      });
      ptr.vx += (-60 * (ptr.sx - ptr.x) - 11 * ptr.vx) * dt;
      ptr.vy += (-60 * (ptr.sy - ptr.y) - 11 * ptr.vy) * dt;
      ptr.sx += ptr.vx * dt;
      ptr.sy += ptr.vy * dt;
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const aspect = W / H;
      let k = 0;
      order.forEach((i) => {
        const s = sims[i];
        if (flight && flight.card === i) return;
        const sway = reduce ? 0 : 0;
        pose(i, k++, s, { pitch: sway, yaw: 0, roll: 0, lift: 0, z: null });
      });
      if (flight) {
        const i = flight.card;
        const s = sims[i];
        const p = flight.dir > 0 ? flight.t : 1 - flight.t;
        const z0 = zSlot(0), z1 = zSlot(N - 1);
        const ant = flight.dir > 0 ? Math.sin(Math.PI * clamp(p / 0.13, 0, 1)) * (p < 0.13 ? 1 : 0) : 0;
        const lift = LIFT * Math.pow(Math.sin(Math.PI * smooth(0.03, 0.96, p)), 0.6) - ant * 0.02;
        const spin = Math.PI * 2 * smoother(0.02, 0.76, p); // edge-on to the sky at the top of the arc
        pose(i, k++, s, {
          pitch: spin - ant * 0.14,
          yaw: 0.16 * Math.sin(Math.PI * p),
          roll: -0.07 * Math.sin(Math.PI * 2 * p),
          lift,
          z: z0 + (z1 - z0) * smoother(0.18, 0.84, p) - 0.18 * Math.sin(Math.PI * smooth(0.0, 0.5, p)) * (1 - smooth(0.5, 0.9, p)),
        });
      }
      const az = 0.4 + (reduce ? 0 : ptr.sx * 0.05 + Math.sin(t * 0.21) * 0.025);
      const el = 0.3 + (reduce ? 0 : -ptr.sy * 0.02 + Math.sin(t * 0.17) * 0.012);
      const dist = phone ? 6.6 + Math.max(0, 0.9 - aspect) * 3.0 : 5.75;
      const tgt = [0, phone ? 1.05 : 1.1, -0.12];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] - dist * Math.cos(az) * Math.cos(el)];
      const front = cc.subarray(0, 3);
      const focus = Math.hypot(front[0] - cam[0], front[1] - cam[1], front[2] - cam[2]);
      gl.uniform2f(u.res, W, H);
      gl.uniform3fv(u.cam, cam);
      gl.uniform3fv(u.tgt, tgt);
      gl.uniform2f(u.shift, phone ? 0 : clamp((aspect - 1) * 0.28, 0, 0.36), phone ? 0.1 : 0.1);
      gl.uniform1f(u.fov, 2.1);
      gl.uniform3fv(u.cc, cc);
      gl.uniformMatrix3fv(u.ci, false, ci);
      gl.uniform1fv(u.lay, lay);
      gl.uniform1f(u.ss, ss);
      gl.uniform1f(u.focus, focus);
      gl.uniform1f(u.seed, reduce ? 0 : (t * 60) % 97);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      const ft = now - last;
      last = now;
      step(dt, now);
      const moving = !reduce || dirty || !!flight;
      if (!moving) return;
      dirty = false;
      draw(now);
      if (!reduce) {
        frames++;
        acc += ft;
        if (frames === 40) {
          const avg = acc / frames;
          (root as HTMLElement).dataset.fps = String(Math.round(1000 / avg));
          if (avg > 24 && (ss > 1.5 || scale > 0.5)) {
            if (ss > 1.5) ss = 1;
            else scale = Math.max(0.5, scale * 0.85);
            resize();
          } else if (avg < 15 && scale < 1) {
            scale = Math.min(1, scale * 1.08);
            resize();
          }
          frames = 0;
          acc = 0;
        }
      }
    };
    const run = () => {
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      run();
    });
    io.observe(root);
    const onVis = () => run();
    document.addEventListener("visibilitychange", onVis);
    run();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      gl.deleteTexture(cardTex);
      gl.deleteTexture(oak);
      gl.deleteTexture(wal);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [reduce]);

  const it = items[active];
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      go(-1);
    }
  };
  const btn =
    "grid h-12 w-12 place-items-center rounded-full border border-[#2a2018]/20 bg-[#f6f1e8]/80 text-[#2a2018] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_14px_-8px_rgba(60,40,20,0.5)] backdrop-blur-sm transition hover:bg-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a2018] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8dccb]";

  return (
    <section
      ref={rootRef}
      aria-labelledby="rch-title"
      className="relative w-full overflow-hidden bg-[#e5d9c6]"
      style={{ fontFamily: GROTESK }}
    >
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`${shop.name} product cards`}
        tabIndex={0}
        onKeyDown={onKey}
        className="relative h-[560px] w-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2a2018] sm:h-[740px]"
      >
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        {noGL && (
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,#efe5d6_0%,#e6d8c3_58%,#c9a77f_58%,#b48c62_100%)]">
            <div className="absolute bottom-[14%] left-1/2 w-[min(78vw,520px)] -translate-x-1/2 sm:left-[64%]" style={{ perspective: "1200px" }}>
              {[2, 1, 0].map((d) => {
                const ix = (active + d) % N;
                return (
                  <div
                    key={d}
                    className="absolute bottom-[34px] left-0 right-0 rounded-[10px] bg-[#f3eee4] p-[4%] shadow-[0_18px_30px_-18px_rgba(40,25,10,0.7)]"
                    style={{ transform: `translateY(${-d * 24}px) translateX(${d * 6}px) scale(${1 - d * 0.035}) rotateX(${12 + d}deg)`, transformOrigin: "bottom" }}
                  >
                    <img src={items[ix].photo} alt="" className="aspect-[888/478] w-full object-cover" style={{ backgroundColor: items[ix].tone }} />
                    <div className="h-8" />
                  </div>
                );
              })}
              <div className="relative h-[70px] rounded-[10px] bg-[linear-gradient(180deg,#6b4429,#4a2c19)] shadow-[0_24px_30px_-16px_rgba(40,20,5,0.8)]" />
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute left-5 top-5 sm:left-12 sm:top-11">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#4a3b2c]">{shop.name}</p>
          <p className="mt-1 text-[13px] text-[#5a4a3a]">{shop.season}, one card at a time</p>
        </div>
        <div className="absolute bottom-10 left-12 hidden w-[min(40%,440px)] sm:block">
          <Caption it={it} index={active} reduce={!!reduce} />
          <Controls go={go} btn={btn} />
        </div>
      </div>
      <div className="px-5 pb-8 pt-2 sm:hidden">
        <Caption it={it} index={active} reduce={!!reduce} />
        <Controls go={go} btn={btn} />
      </div>
      <p className="sr-only" aria-live="polite">
        {`Card ${active + 1} of ${N}: ${it.name}, ${it.price}. ${it.alt}.`}
      </p>
    </section>
  );
}

function Caption({ it, index, reduce }: { it: (typeof items)[number]; index: number; reduce: boolean }) {
  return (
    <div className="min-h-[188px] sm:min-h-[214px]">
      <p className="text-[13px] font-semibold tabular-nums tracking-[0.18em] text-[#5a4a3a]">
        {String(index + 1).padStart(2, "0")} <span className="text-[#8a7864]">/ {String(N).padStart(2, "0")}</span>
      </p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={reduce ? false : { opacity: 0, y: 14, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduce ? undefined : { opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.38, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <h2 id="rch-title" className="mt-3 text-[34px] leading-[1.02] tracking-[-0.02em] text-[#231a12] sm:text-[52px]" style={{ fontFamily: SERIF }}>
            {it.name}
          </h2>
          <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-[#4a3b2c]">{it.note}</p>
          <p className="mt-2 text-[17px] font-semibold tabular-nums text-[#231a12]">{it.price}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Controls({ go, btn }: { go: (d: number) => void; btn: string }) {
  return (
    <div className="mt-5 flex items-center gap-3">
      <button type="button" aria-label="Previous card" onClick={() => go(-1)} className={btn}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button type="button" aria-label="Next card" onClick={() => go(1)} className={btn}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="ml-2 text-[13px] text-[#5a4a3a]">Flip to the next card</span>
    </div>
  );
}
