import { useEffect, useRef, useState } from "react";

// Everything a visitor would edit first.
const brand = {
  word: "ARENTA", // cut into the stone in capitals, as wide as the block allows (up to nine letters)
  name: "Arenta Stoneworks",
  line: "Stone cut by hand, and set to outlast the building around it.",
  place: ["The Yard, 4 Lime Kiln Row", "letters@arenta.example"],
  legal: "© 2026 Arenta Stoneworks",
};
const columns = [
  { title: "Workshop", links: ["Our masons", "How we carve", "Apprentices", "Jobs"] },
  { title: "Commissions", links: ["Inscriptions", "House names", "Memorials", "Fireplaces"] },
  { title: "Stone", links: ["Travertine", "Portland", "Slate", "Samples"] },
  { title: "Visit", links: ["Open yard days", "Directions", "Contact", "Journal"] },
];
const small = ["Privacy", "Terms", "Cookies"];
const SUN = { start: -1.16, height: 0.27 }; // where the evening sun stands when the page opens: radians round from the front, and up from the ground
const CUT = { slope: 1.05, deepest: 0.3 }; // how steep the chisel walls are, and the deepest a cut may go (scene units; the block is 2.6 tall)
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const WEIGHT = 600;

const TW = 2048, TH = 448, UNIT = 2048 / 11.4; // the plate the word is drawn on, and its pixels per scene unit

const VERT = `#version 300 es
in vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outC;
uniform vec2 uRes; uniform vec3 uCam; uniform float uFoc; uniform float uShift; uniform float uPitch;
uniform vec3 uSun; uniform float uGrain; uniform sampler2D uSdf; uniform vec3 uPlate;
const vec3 BC = vec3(0.0, 1.3, 0.85); const vec3 BH = vec3(6.1, 1.3, 0.85);
const float ZW = 4.4;
const float SLOPE = ${CUT.slope.toFixed(3)}; const float CMAX = ${CUT.deepest.toFixed(3)};
const vec3 SUNC = vec3(1.0, 0.64, 0.36) * 3.3;
const vec3 SKYC = vec3(0.30, 0.38, 0.58) * 0.62;

float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * n2(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }

// how far inside a letter a point of the front face is (negative outside)
float ins(vec2 xy){
  vec2 uv = vec2(xy.x / (2.0 * uPlate.x) + 0.5, (xy.y - uPlate.y) / uPlate.z);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return -1.0;
  return texture(uSdf, uv).r;
}
// a V cut: deepest down the middle of each stroke, the two walls meeting in a crisp line
float cut(vec2 xy){ float s = max(ins(xy), 0.0) * SLOPE; return s - max(s - CMAX, 0.0) * 0.85; }
float rbox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float block(vec3 p){
  float b = rbox(p - BC, BH, 0.045);
  if (p.z < 0.3 && p.z > -0.1) { float c = cut(p.xy); if (c > 0.0) b = max(b, (c - p.z) * 0.6); }
  return b;
}
vec2 boxHit(vec3 ro, vec3 rd, vec3 c, vec3 b){
  vec3 m = 1.0 / (rd + vec3(1e-6)); vec3 n = m * (ro - c); vec3 k = abs(m) * b; vec3 a = -n - k; vec3 z = -n + k;
  return vec2(max(max(a.x, a.y), a.z), min(min(z.x, z.y), z.z));
}
float marchBlock(vec3 ro, vec3 rd){
  vec2 tb = boxHit(ro, rd, BC, BH + 0.02); if (tb.y < max(tb.x, 0.0)) return -1.0;
  float t = max(tb.x, 0.0);
  for (int i = 0; i < 130; i++) { float d = block(ro + rd * t); if (d < 0.0004) return t; t += d * 0.9; if (t > tb.y) break; }
  return -1.0;
}
vec3 nrmBlock(vec3 p){
  vec2 e = vec2(0.0065, 0.0);
  return normalize(vec3(block(p + e.xyy) - block(p - e.xyy), block(p + e.yxy) - block(p - e.yxy), block(p + e.yyx) - block(p - e.yyx)));
}
// the sun is a disc, not a point: shadows harden where they start and soften as they reach away
float shadow(vec3 p, vec3 L){
  vec2 tb = boxHit(p, L, BC, BH + 0.02); if (tb.y < max(tb.x, 0.0)) return 1.0;
  float t = max(tb.x, 0.0) + 0.003; float r = 1.0;
  for (int i = 0; i < 56; i++) { float h = block(p + L * t); r = min(r, 22.0 * h / t); if (r < 0.002 || t > tb.y) break; t += clamp(h, 0.003, 0.3); }
  return smoothstep(0.0, 1.0, clamp(r, 0.0, 1.0));
}
float occl(vec3 p, vec3 n){
  float o = 0.0, w = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.025 * float(i * i); float d = min(block(p + n * h), p.y + n.y * h); o += (h - d) * w; w *= 0.6; }
  return clamp(1.0 - 2.2 * o, 0.0, 1.0);
}
// a roof edge out of frame keeps the top of the back wall in shade: the slanting line of evening light
float roof(vec3 p){ if (p.z < 2.5) return 1.0; float edge = 3.35 - 0.11 * p.x * sign(-uSun.x) - (0.32 - uSun.y) * 2.2; return smoothstep(0.18, -0.18, p.y - edge); }

float pitAt(vec2 q, float w){
  float v = n2(vec2(q.x * 7.0 + w * 2.0, q.y * 22.0 + w * 6.0));
  float k = smoothstep(0.87, 0.95, v) * smoothstep(0.55, 0.7, n2(q * 3.0 + 2.0));
  k += smoothstep(0.88, 0.97, n2(q * vec2(40.0, 70.0) + 5.0)) * 0.8;
  return clamp(k, 0.0, 1.0);
}
// travertine: warm cream, laid down in beds, with the small holes the stone is known for
vec3 travertine(vec3 p, vec3 n, out float pit){
  vec2 q = p.z < 0.35 ? p.xy : abs(n.y) > 0.7 ? vec2(p.x, p.z * 3.0) : vec2(p.z * 2.0, p.y); // inside the cuts the grain carries on from the face
  float w = fbm(q * vec2(0.5, 1.2) + 3.0);
  float bed = n2(vec2(q.x * 0.22 + w * 1.4, q.y * 5.5 + w * 3.2));
  float hair = n2(vec2(q.x * 0.6 + w, q.y * 40.0 + w * 6.0));
  vec3 a = vec3(0.86, 0.78, 0.65);
  a = mix(a, vec3(0.74, 0.62, 0.47), smoothstep(0.45, 0.78, bed) * 0.85);
  a = mix(a, vec3(0.93, 0.88, 0.79), smoothstep(0.55, 0.85, n2(q * vec2(2.0, 9.0) + 11.0)) * 0.35);
  a *= 0.96 + 0.06 * hair;
  pit = pitAt(q, w);
  // a hole is a hole: its wall nearest the sun is in shade, the far lip catches light
  vec2 off = normalize(uSun.xy + 1e-4) * 0.012;
  float near = pitAt(q + off, w), far = pitAt(q - off, w);
  float lip = max(far - pit, 0.0);
  pit = clamp(pit * (0.55 + 0.6 * near), 0.0, 1.0);
  a *= 0.93 + 0.1 * smoothstep(0.0, 2.4, p.y); // rain and dust darken the stone near the ground
  a *= 0.95 + 0.08 * fbm(p.xy * 0.4 + 9.0);
  return a * (1.0 - 0.7 * pit) * (1.0 + 0.18 * lip);
}

vec3 sky(vec3 rd){ return mix(vec3(0.5, 0.4, 0.38), vec3(0.32, 0.36, 0.5), clamp(rd.y * 2.0, 0.0, 1.0)); }

vec3 light(vec3 p, vec3 n, vec3 rd, vec3 alb, float sh, float ao, float rough){
  float dif = max(dot(n, uSun), 0.0);
  vec3 h = normalize(uSun - rd);
  float fr = 0.04 + 0.96 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
  float sp = pow(max(dot(n, h), 0.0), rough) * (rough + 2.0) / 8.0 * fr;
  vec3 sun = SUNC * sh * roof(p);
  vec3 amb = SKYC * (0.55 + 0.45 * n.y) * ao;
  vec3 bounce = vec3(0.5, 0.33, 0.22) * 0.32 * clamp(-n.y * 0.5 + 0.5, 0.0, 1.0) * ao;
  return alb * (sun * dif + amb + bounce) + sun * sp * dif * 0.6;
}

vec3 shade(vec3 ro, vec3 rd){
  float tb = marchBlock(ro, rd);
  float tg = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  float tw = rd.z > 0.0 ? (ZW - ro.z) / rd.z : 1e9;
  if (tb > 0.0 && tb < tg && tb < tw) {
    vec3 p = ro + rd * tb; vec3 n = nrmBlock(p);
    float pit; vec3 alb = travertine(p, n, pit);
    float inCut = smoothstep(0.002, 0.02, p.z) * step(p.z, 0.25) * step(abs(n.z), 0.995);
    alb *= 1.0 + 0.06 * inCut; // freshly cut stone is a shade paler than the weathered face
    float sh = shadow(p + n * 0.006, uSun);
    float ao = occl(p, n) * (1.0 - 0.5 * pit);
    vec3 c = light(p, n, rd, alb, sh, ao, 18.0);
    // the sunlit wall of a cut throws warm light across onto the wall in shade
    c += alb * SUNC * 0.16 * inCut * (1.0 - sh) * max(dot(uSun, vec3(0.0, 0.0, -1.0)) + 0.3, 0.0);
    return c;
  }
  if (tg < tw) {
    vec3 p = ro + rd * tg; vec3 n = vec3(0.0, 1.0, 0.0);
    // the paving: big honed flags with dark joints
    vec2 g = p.xz * vec2(0.42, 0.55); vec2 f = fract(g + vec2(0.5 * floor(g.y), 0.0)); vec2 id = floor(g + vec2(0.5 * floor(g.y), 0.0));
    float joint = smoothstep(0.0, 0.007, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)) / 0.55);
    vec3 alb = vec3(0.5, 0.43, 0.36) * (0.9 + 0.16 * h21(id)) * (0.9 + 0.16 * fbm(p.xz * 1.7 + id * 3.0));
    alb *= 0.35 + 0.65 * joint;
    alb *= 0.93 + 0.14 * n2(p.xz * 60.0) * n2(p.xz * 23.0 + 4.0);
    float foot = smoothstep(0.0, 0.5, max(abs(p.x) - BH.x, 0.0) + max(-p.z, 0.0)) ; alb *= 0.6 + 0.4 * foot;
    float sh = shadow(p + n * 0.002, uSun);
    float ao = occl(p, n);
    vec3 c = light(p, n, rd, alb, sh, ao, 30.0);
    return mix(c, sky(rd) * 0.4, 1.0 - exp(-tg * 0.012));
  }
  if (tw < 1e8) {
    vec3 p = ro + rd * tw; vec3 n = vec3(0.0, 0.0, -1.0);
    float m = fbm(p.xy * vec2(0.35, 0.5)); float fine = n2(p.xy * 14.0);
    vec3 alb = mix(vec3(0.6, 0.38, 0.28), vec3(0.68, 0.46, 0.34), m) * (0.96 + 0.06 * fine);
    float sh = p.y < 4.0 ? shadow(p + n * 0.002, uSun) : 1.0;
    return light(p, n, rd, alb, sh, 1.0, 8.0);
  }
  return sky(rd);
}

vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 fw = vec3(0.0, -sin(uPitch), cos(uPitch)); vec3 up = vec3(0.0, cos(uPitch), sin(uPitch));
  vec3 rd = normalize(vec3(1.0, 0.0, 0.0) * uv.x + up * (uv.y + uShift) + fw * uFoc);
  vec3 col = shade(uCam, rd);
  col = aces(col * 0.8);
  col = pow(col, vec3(1.0 / 2.2));
  vec2 q = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - 0.22 * dot(q, q);
  col += (h21(gl_FragCoord.xy + uGrain * 37.0) - 0.5) * 0.018;
  outC = vec4(col, 1.0);
}
`;

// One pass of the exact squared distance transform (Felzenszwalb and Huttenlocher).
function edt1d(f: Float32Array, n: number, d: Float32Array, v: Int32Array, z: Float32Array) {
  let k = 0;
  v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = 0;
    for (;;) { const p = v[k]; s = (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p); if (s <= z[k] && k > 0) k--; else break; }
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const p = v[k]; d[q] = (q - p) * (q - p) + f[p]; }
}
function edt(grid: Float32Array, w: number, h: number) {
  const n = Math.max(w, h), f = new Float32Array(n), d = new Float32Array(n), v = new Int32Array(n), z = new Float32Array(n + 1);
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = grid[y * w + x]; edt1d(f, h, d, v, z); for (let y = 0; y < h; y++) grid[y * w + x] = d[y]; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = grid[y * w + x]; edt1d(f, w, d, v, z); for (let x = 0; x < w; x++) grid[y * w + x] = Math.sqrt(d[x]); }
}

// Draw the word once and turn it into a field: for every point of the face, how far it lies inside a letter.
function bakeWord(text: string) {
  const out = new Float32Array(TW * TH).fill(-0.2);
  const cv = document.createElement("canvas");
  cv.width = TW; cv.height = TH;
  const g = cv.getContext("2d", { willReadFrequently: true });
  if (!g) return out;
  const word = text.toUpperCase().slice(0, 9);
  const px = 300;
  g.font = `${WEIGHT} ${px}px ${SERIF}`;
  const track = px * 0.06;
  const m = g.measureText(word);
  const width = m.width + track * (word.length - 1);
  const asc = m.actualBoundingBoxAscent || px * 0.7;
  const k = Math.min((TW * 0.88) / width, (TH * 0.66) / asc);
  g.font = `${WEIGHT} ${px * k}px ${SERIF}`;
  g.fillStyle = "#fff"; g.textBaseline = "alphabetic";
  let x = (TW - width * k) / 2;
  const base = TH / 2 + (asc * k) / 2;
  for (const ch of word) { g.fillText(ch, x, base); x += g.measureText(ch).width + track * k; }
  const img = g.getImageData(0, 0, TW, TH).data;
  const outer = new Float32Array(TW * TH), inner = new Float32Array(TW * TH);
  for (let y = 0; y < TH; y++) for (let xx = 0; xx < TW; xx++) {
    const a = img[((TH - 1 - y) * TW + xx) * 4 + 3] / 255, i = y * TW + xx; // rows bottom first: up on the plate is up in the scene
    if (a >= 1) { outer[i] = 0; inner[i] = 1e12; } else if (a <= 0) { outer[i] = 1e12; inner[i] = 0; }
    else { const dd = 0.5 - a; outer[i] = dd > 0 ? dd * dd : 0; inner[i] = dd < 0 ? dd * dd : 0; }
  }
  edt(outer, TW, TH); edt(inner, TW, TH);
  for (let i = 0; i < out.length; i++) out[i] = Math.max(-0.2, (inner[i] - outer[i]) / UNIT);
  // two soft passes take the stair steps off the chisel walls
  const tmp = new Float32Array(TW * TH);
  for (let pass = 0; pass < 3; pass++) {
    tmp.set(out);
    for (let y = 1; y < TH - 1; y++) for (let xx = 1; xx < TW - 1; xx++) {
      const i = y * TW + xx;
      out[i] = (tmp[i] * 4 + (tmp[i - 1] + tmp[i + 1] + tmp[i - TW] + tmp[i + TW]) * 2 + tmp[i - TW - 1] + tmp[i - TW + 1] + tmp[i + TW - 1] + tmp[i + TW + 1]) / 16;
    }
  }
  return out;
}

// No WebGL, or a still is wanted: the block drawn in CSS with the word set as an incised inscription.
function Still() {
  return (
    <div aria-hidden="true" className="absolute inset-x-4 bottom-[96px] flex select-none justify-center sm:inset-x-10 lg:bottom-[118px]">
      <div className="relative w-full max-w-[1300px] rounded-[3px] py-[3.2vw] text-center" style={{ background: "linear-gradient(176deg, #ead9bd 0%, #dcc6a3 55%, #c9ae86 100%)", boxShadow: "0 1px 0 #f3e5cc inset, 0 -10px 0 #b89a72 inset, 40px 40px 60px -20px rgba(40,20,10,0.55)" }}>
        <span className="block whitespace-nowrap text-[13vw] leading-none tracking-[0.06em] lg:text-[min(13vw,180px)]" style={{ fontFamily: SERIF, fontWeight: WEIGHT, color: "#b99c74", textShadow: "-3px -3px 2px rgba(70,40,20,0.55), 2px 2px 1px rgba(255,240,215,0.85)" }}>{brand.word.toUpperCase()}</span>
      </div>
    </div>
  );
}

export default function TravertineCarvedWordmarkFooter() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [hour, setHour] = useState(15.75);
  const api = useRef<{ set: (a: number) => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" }) as WebGL2RenderingContext | null;
    if (!gl) { setShown("still"); return; }
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const software = /swiftshader|llvmpipe|software|basic render/i.test(info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "");
    const compile = (type: number, src: string) => { const sh = gl.createShader(type); if (!sh) return null; gl.shaderSource(sh, src); gl.compileShader(sh); return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null; };
    const v = compile(gl.VERTEX_SHADER, VERT), f = compile(gl.FRAGMENT_SHADER, FRAG), prog = gl.createProgram();
    if (!v || !f || !prog) { setShown("still"); return; }
    gl.attachShader(prog, v); gl.attachShader(prog, f); gl.bindAttribLocation(prog, 0, "aPos"); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setShown("still"); return; }
    const u = Object.fromEntries(["uRes", "uCam", "uFoc", "uShift", "uPitch", "uSun", "uGrain", "uSdf", "uPlate"].map((n) => [n, gl.getUniformLocation(prog, n)]));
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    const upload = () => {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, TW, TH, 0, gl.RED, gl.FLOAT, bakeWord(brand.word));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    upload();

    const s = { a: SUN.start, va: 0, target: SUN.start, e: SUN.height, te: SUN.height, touched: false, t0: 0, last: 0, raf: 0, visible: true, alive: true, dirty: true, slow: 0, frames: 0, fpsT: 0 };
    let W = 0, H = 0, cssW = 1, cssH = 1, scale = 1;
    const size = () => {
      const r = box.getBoundingClientRect(); cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt((software ? 3e5 : 1.3e6) / (cssW * cssH * dpr * dpr))); // never more than about 1.3 million traced pixels
      const w = Math.round(cssW * dpr * k), h = Math.round(cssH * dpr * k);
      if (w !== W || h !== H) { W = w; H = h; cv.width = W; cv.height = H; s.dirty = true; }
    };
    // A view camera above the paving: the lens is shifted so the block sits low in the frame with its uprights upright.
    const DIST = 12.5, EYE = 4.0, PITCH = 0.1;
    const draw = (now: number) => {
      const aspect = cssW / cssH, wide = cssW >= 1024;
      const zc = (DIST + 0.0) * Math.cos(PITCH) + (EYE - 1.3) * Math.sin(PITCH), yc = (1.3 - EYE) * Math.cos(PITCH) + DIST * Math.sin(PITCH);
      const foc = Math.min((0.44 * aspect * zc) / 6.25, (0.36 * zc) / 2.6);
      const base = wide ? 0.71 : cssW >= 640 ? 0.75 : 0.79;
      const shift = (foc * yc) / zc - (0.5 - base);
      const L = [Math.sin(s.a) * Math.cos(s.e), Math.sin(s.e), -Math.cos(s.a) * Math.cos(s.e)];
      gl.viewport(0, 0, W, H);
      gl.useProgram(prog);
      gl.uniform2f(u.uRes, W, H);
      gl.uniform3f(u.uCam, 0, EYE, -DIST);
      gl.uniform1f(u.uFoc, foc); gl.uniform1f(u.uShift, shift); gl.uniform1f(u.uPitch, PITCH);
      gl.uniform3f(u.uSun, L[0], L[1], L[2]);
      gl.uniform1f(u.uGrain, reduce ? 1 : (now / 41) % 64);
      gl.uniform3f(u.uPlate, TW / UNIT / 2, 1.3 - TH / UNIT / 2, TH / UNIT);
      gl.uniform1i(u.uSdf, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible || !s.alive) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016, dt = Math.min(0.04, dtRaw);
      s.last = now;
      if (!s.t0) s.t0 = now;
      const t = (now - s.t0) / 1000;
      // opens finished: low raking sun from the left, held; then the sun drifts slowly round until someone takes over
      if (!reduce && !s.touched && t > 3.4) { const k = (t - 3.4) / 16; s.target = SUN.start + 0.62 * (1 - Math.cos(k * Math.PI * 2)) * 0.5 + 0.0 * k; }
      // the sun has weight: it is pulled toward where it is wanted and leans a little past before it settles
      const pa = s.a, pe = s.e;
      if (reduce) { s.a = s.target; s.e = s.te; }
      else {
        for (let i = 0; i < 3; i++) { s.va += (26 * (s.target - s.a) - 7.5 * s.va) * (dt / 3); s.a += s.va * (dt / 3); }
        s.e += (s.te - s.e) * (1 - Math.exp(-dt * 3));
      }
      const moved = Math.abs(s.a - pa) + Math.abs(s.e - pe) > 1e-5;
      if (moved || s.dirty) { draw(now); s.dirty = false; }
      if (!s.alive) return;
      if (shown0) { shown0 = false; setShown("gl"); }
      s.frames++;
      if (now - s.fpsT > 1000) { (box as HTMLElement).dataset.fps = String(s.frames); s.frames = 0; s.fpsT = now; }
      if (!reduce && dtRaw > 0.024) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && scale > 0.5) { scale *= 0.84; s.slow = 0; size(); }
      const idle = reduce || (s.touched && !moved && Math.abs(s.va) < 1e-4);
      if (!idle) s.raf = requestAnimationFrame(frame);
    };
    let shown0 = true;
    const wake = () => { if (!s.raf && s.visible && s.alive) { s.last = 0; s.raf = requestAnimationFrame(frame); } };
    api.current = { set: (a) => { s.touched = true; s.target = a; wake(); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.02 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    const hadFont = !!document.fonts?.check(`${WEIGHT} 40px ${SERIF.split(",")[0]}`);
    document.fonts?.ready.then(() => { if (s.alive && !!document.fonts.check(`${WEIGHT} 40px ${SERIF.split(",")[0]}`) !== hadFont) { upload(); s.dirty = true; wake(); } });

    // over the stone the pointer is the sun: left and right walk it round the block, up and down raise and lower it
    const move = (e: PointerEvent) => {
      if (reduce) return;
      const r = box.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      if (y < 0.5) return;
      s.touched = true;
      s.target = -1.3 + 2.6 * Math.min(1, Math.max(0, x));
      s.te = 0.42 - 0.26 * Math.min(1, Math.max(0, (y - 0.5) / 0.5));
      wake();
    };
    box.addEventListener("pointermove", move);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();
    return () => {
      s.alive = false; cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis); box.removeEventListener("pointermove", move); cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  // the slider speaks in hours of the evening; 15 is high in the south-west, 21 is down on the right
  const toAngle = (h: number) => -1.3 + ((h - 15) / 6) * 2.6;
  const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[#f3e6d2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#3a2620]";
  return (
    <footer className="relative isolate overflow-hidden bg-[#3a2620] text-[#f6ead8]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes travertine-block-footer-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .travertine-block-footer-rise { animation: travertine-block-footer-rise 800ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        .travertine-block-footer-link { background-image: linear-gradient(currentColor, currentColor); background-repeat: no-repeat; background-position: 0 100%; background-size: 0% 1px; transition: background-size 320ms cubic-bezier(0.2, 0.9, 0.2, 1), color 200ms; }
        .travertine-block-footer-link:hover, .travertine-block-footer-link:focus-visible { background-size: 100% 1px; color: #ffd9a8; }
        .travertine-block-footer-range { -webkit-appearance: none; appearance: none; background: transparent; }
        .travertine-block-footer-range::-webkit-slider-runnable-track { height: 2px; background: rgba(246,234,216,0.45); }
        .travertine-block-footer-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; margin-top: -7px; border-radius: 9999px; background: #ffc98a; box-shadow: 0 0 0 4px rgba(255,201,138,0.25); }
        .travertine-block-footer-range::-moz-range-track { height: 2px; background: rgba(246,234,216,0.45); }
        .travertine-block-footer-range::-moz-range-thumb { width: 16px; height: 16px; border: 0; border-radius: 9999px; background: #ffc98a; }
        @media (prefers-reduced-motion: reduce) { .travertine-block-footer-rise { animation: none; } .travertine-block-footer-link { transition: none; } }
      `}</style>
      <div ref={stage} className="relative h-[960px] w-full sm:h-[880px] lg:h-[840px]" style={{ background: "linear-gradient(180deg, #3b2721 0%, #4a2f25 50%, #7a5440 72%, #4a3a30 100%)" }}>
        {shown === "still" && <Still />}
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[52%]" style={{ background: "linear-gradient(180deg, rgba(36,22,17,0.55) 0%, rgba(36,22,17,0.25) 60%, rgba(36,22,17,0) 100%)" }} />

        <div className="pointer-events-none absolute inset-0 mx-auto flex max-w-[1440px] flex-col justify-between px-6 pb-5 pt-10 sm:px-10 lg:px-16 lg:pb-6 lg:pt-14">
          <div className="travertine-block-footer-rise grid gap-x-12 gap-y-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#e9d3b6]">{brand.name}</p>
              <p className="mt-4 max-w-[18ch] text-[30px] leading-[1.08] tracking-[-0.01em] sm:text-[34px] lg:mt-5 lg:text-[42px]" style={{ fontFamily: SERIF }}>{brand.line}</p>
              <p className="mt-5 hidden text-[13px] leading-[1.6] text-[#e9d3b6] lg:block">{brand.place[0]}<br />{brand.place[1]}</p>
            </div>
            <nav aria-label="Footer" className="pointer-events-auto grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
              {columns.map((col) => (
                <div key={col.title}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#e9d3b6]">{col.title}</h3>
                  <ul className="mt-3 lg:mt-4">
                    {col.links.map((l) => (
                      <li key={l}><a href="#" className={`travertine-block-footer-link inline-flex h-10 items-center whitespace-nowrap text-[16px] font-medium tracking-[-0.01em] lg:text-[18px] ${ring}`}>{l}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-1 text-[12px] font-medium tracking-[0.02em] text-[#f6ead8]">
            <p>{brand.legal}</p>
            <div className="pointer-events-auto flex flex-wrap items-center gap-x-6">
              {shown === "gl" && (
                <label className="hidden h-10 items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] sm:inline-flex">
                  Sun
                  <input type="range" min={15} max={21} step={0.25} value={hour} aria-valuetext={`${Math.floor(hour)}:${String(Math.round((hour % 1) * 60)).padStart(2, "0")}`}
                    onChange={(e) => { const h = Number(e.target.value); setHour(h); api.current?.set(toAngle(h)); }}
                    className={`travertine-block-footer-range h-10 w-32 cursor-pointer rounded-full ${ring}`} />
                </label>
              )}
              <ul className="flex items-center gap-x-5">
                {small.map((l) => (
                  <li key={l}><a href="#" className={`travertine-block-footer-link inline-flex h-10 items-center ${ring}`}>{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
