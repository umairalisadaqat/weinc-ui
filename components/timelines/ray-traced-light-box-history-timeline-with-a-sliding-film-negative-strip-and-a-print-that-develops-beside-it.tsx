import { useEffect, useRef, useState } from "react";

// The years. Each one is a frame on the strip of negatives, and the print on the desk beside the box.
const years = [
  { year: "1968", title: "A wheel in the coal shed", body: "Ada Marrow buys a kick wheel at a school sale and throws her first mugs in the shed behind the house, firing them in a neighbour's kiln.", photo: "https://images.pexels.com/photos/2556276/pexels-photo-2556276.jpeg?auto=compress&cs=tinysrgb&w=640", tone: "#8a7a6c" },
  { year: "1974", title: "Slabs, tools and a first order", body: "A café on the high street asks for sixty plates. She learns slab work to make them all the same size, and the kitchen table becomes a bench.", photo: "https://images.pexels.com/photos/5642023/pexels-photo-5642023.jpeg?auto=compress&cs=tinysrgb&w=640", tone: "#a39a90" },
  { year: "1981", title: "The big kiln is lit", body: "The pottery moves into a brick workshop on Tenter Street and builds its own kiln. Whole shelves of plates go in at once and come out warm a day later.", photo: "https://images.pexels.com/photos/9736509/pexels-photo-9736509.jpeg?auto=compress&cs=tinysrgb&w=640", tone: "#8c6a4f" },
  { year: "1993", title: "Bowls by the stack", body: "Four throwers now share the wheel room. The plain brown bowl that started as a seconds line becomes the piece people ask for by name.", photo: "https://images.pexels.com/photos/33703946/pexels-photo-33703946.jpeg?auto=compress&cs=tinysrgb&w=640", tone: "#6b4a34" },
  { year: "2006", title: "A shop with the door open", body: "The front room is cleared and shelved. Visitors can buy straight from the racks and watch the kiln being loaded through the back window.", photo: "https://images.pexels.com/photos/6611184/pexels-photo-6611184.jpeg?auto=compress&cs=tinysrgb&w=640", tone: "#9a9894" },
  { year: "2019", title: "Handed to the next pair", body: "Ada's apprentice of twelve years takes over the kiln book. The glazes, the stamp on the foot and the Friday firing all stay the same.", photo: "https://images.pexels.com/photos/6023601/pexels-photo-6023601.jpeg?auto=compress&cs=tinysrgb&w=640", tone: "#b49a80" },
];
const START = 2; // the year it opens on
const COMPANY = "Marrow Lane Pottery";
const STRAP = "Our story, one frame at a time";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const N = years.length;

// Scene units. Frame k of the strip sits at x = (k - strip) * PITCH, so the chosen frame comes to rest at x = 0.
const PITCH = 1.1, TOP = 0.42;

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const TONE = `
vec3 tone(vec3 x){ x *= 0.85; vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return pow(clamp(a / b, 0.0, 1.0), vec3(1.0 / 2.2)); }
`;

// A light box in a dim room: opal glass lit from inside, a strip of colour negatives across it,
// a desk lamp over a print lying on a dark walnut desk.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform float uSel; uniform float uHot; uniform float uCur; uniform float uDev;
uniform vec2 uBox; uniform vec4 uPrint; uniform float uRot; uniform vec3 uLamp;
uniform sampler2D uTex; uniform float uDirect;
const float H = ${TOP.toFixed(2)}; const float FY = ${(TOP + 0.008).toFixed(3)}; const float SW = 0.52; const float P = ${PITCH.toFixed(2)};
const float IX = 0.5; const float IZ = 0.335; const float NF = ${N.toFixed(1)};
const vec3 GLOW = vec3(1.0, 0.95, 0.86);
const vec3 LAMP = vec3(1.0, 0.74, 0.46);
const vec3 BASE = vec3(0.98, 0.6, 0.3);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float sd2Box(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
vec2 boxSpan(vec3 ro, vec3 rd, vec3 lo, vec3 hi){
  vec3 inv = 1.0 / (rd + vec3(1e-6)); vec3 a = (lo - ro) * inv; vec3 b = (hi - ro) * inv;
  vec3 mn = min(a, b); vec3 mx = max(a, b);
  return vec2(max(max(mn.x, mn.y), max(mn.z, 0.0)), min(mx.x, min(mx.y, mx.z)));
}
float rnd(float k){ return h21(gl_FragCoord.xy * 0.913 + vec2(uSeed * 97.1 + k, k * 13.7)); }

// ---- the photographs, from the atlas: 3 across, 2 down ----
vec3 photoS(float k, vec2 uv){
  uv = clamp(uv, 0.003, 0.997);
  vec2 cell = vec2(mod(k, 3.0), floor(k / 3.0));
  return texture2D(uTex, (cell + vec2(uv.x, 1.0 - uv.y)) / vec2(3.0, 2.0)).rgb;
}
vec3 photo(float k, vec2 uv){ return pow(photoS(k, uv), vec3(2.2)); }

// ---- the opal glass: an even glow, brighter where the lamp inside sits under the chosen frame ----
float glassEmit(vec2 xz){
  float edge = min(uBox.x - abs(xz.x), uBox.y - abs(xz.y));
  float e = 0.9 * (0.62 + 0.38 * smoothstep(0.0, 1.2, edge)) * (1.0 - 0.18 * smoothstep(0.0, 1.0, abs(xz.x) / uBox.x));
  float r = sd2Box(xz, vec2(IX + 0.1, SW + 0.02), 0.1);
  e += uHot * 0.75 * smoothstep(0.05, -0.03, r) + uHot * 0.25 * smoothstep(0.5, 0.0, r);
  e *= 0.97 + 0.06 * n2(xz * 23.0);
  return e;
}

// ---- the film: orange base, clear sprocket holes, the image as a colour negative ----
vec3 filmTrans(vec2 xz){
  float u = xz.x / P + uSel;
  float k = floor(u + 0.5);
  float fx = (u - k) * P;
  float az = abs(xz.y);
  vec3 tr = BASE * 0.62;
  if (az > 0.39 && az < 0.48) {
    float hx = mod(xz.x + uSel * P, P / 8.0) - P / 16.0;
    float hole = sd2Box(vec2(hx, az - 0.435), vec2(0.026, 0.02), 0.008);
    tr = mix(vec3(1.0), tr, smoothstep(-0.002, 0.003, hole));
  }
  if (abs(fx) < IX && az < IZ) {
    vec2 uv = vec2(fx / (2.0 * IX) + 0.5, xz.y / (2.0 * IZ) + 0.5);
    float inside = smoothstep(0.0, 0.006, IX - abs(fx)) * smoothstep(0.0, 0.006, IZ - az);
    vec3 neg;
    if (k >= 0.0 && k < NF) {
      vec3 ph = photoS(k, uv);
      neg = BASE * (vec3(0.02) + 0.95 * pow(clamp(1.0 - ph * 1.08, 0.0, 1.0), vec3(2.3)));
    } else {
      neg = BASE * 0.06; // the fogged leader and tail
    }
    tr = mix(tr, neg, inside);
  }
  // a little edge printing along the far side: dashes and a frame mark
  if (xz.y < -0.355 && xz.y > -0.385) {
    float d = mod(xz.x + uSel * P + 0.2, P);
    float mark = step(0.08, d) * step(d, 0.2) + step(0.5, d) * step(d, 0.53) + step(0.58, d) * step(d, 0.61);
    tr *= 1.0 - 0.75 * mark;
  }
  tr *= 0.35 + 0.65 * smoothstep(0.0, 0.012, SW - az);
  return tr;
}
bool onStrip(vec2 xz){
  float a = (-1.4 - uSel) * P, b = (NF + 0.4 - uSel) * P;
  return abs(xz.y) < SW && xz.x > a && xz.x < b;
}

// What glossy things see: a dark room, a pale ceiling bounce, and the lamp's warm bulb.
vec3 env(vec3 r){
  vec3 c = mix(vec3(0.010, 0.009, 0.008), vec3(0.03, 0.028, 0.026), smoothstep(-0.1, 0.8, r.y));
  vec3 d = normalize(uLamp - vec3(0.0, 0.4, 1.0));
  c += LAMP * 22.0 * smoothstep(0.986, 0.996, dot(r, d));
  return c;
}

// Light at a point on the desk or print: the lamp (with a shadow from the box) and the box's spill.
vec3 deskLight(vec3 p, vec3 n){
  vec3 lp = uLamp + vec3(rnd(1.0) - 0.5, 0.0, rnd(2.0) - 0.5) * 0.7;
  vec3 L = lp - p; float d = length(L); L /= d;
  float spot = smoothstep(0.8, 0.95, dot(-L, normalize(vec3(uPrint.x, 0.0, uPrint.y) - uLamp)));
  float sh = 1.0;
  vec2 tb = boxSpan(p + n * 0.002, L, vec3(-uBox.x, 0.0, -uBox.y), vec3(uBox.x, H, uBox.y));
  if (tb.x < tb.y && tb.x < d) sh = 0.0;
  vec3 c = LAMP * 30.0 * max(dot(n, L), 0.0) / (d * d) * (0.04 + 0.96 * spot) * sh;
  float fd = sd2Box(p.xz, uBox, 0.04);
  c += GLOW * 0.85 * exp(-max(fd, 0.0) * 2.6) * (0.35 + 0.65 * smoothstep(0.0, 0.2, fd));
  c += vec3(0.012, 0.011, 0.01);
  return c;
}

// The box seen in a reflection: its glowing glass edge and its dark painted body.
vec3 boxSeen(vec3 ro, vec3 rd){
  vec2 tb = boxSpan(ro, rd, vec3(-uBox.x, 0.0, -uBox.y), vec3(uBox.x, H, uBox.y));
  if (tb.x < tb.y && tb.x > 0.001) {
    vec3 p = ro + rd * tb.x;
    if (p.y > H - 0.055) return GLOW * 0.9;
    return vec3(0.02, 0.019, 0.018);
  }
  return env(rd);
}

vec3 shadeDesk(vec3 p, vec3 rd){
  float w = n2(vec2(p.x * 0.35, p.z * 2.2)) * 1.6 + n2(vec2(p.x * 1.4, p.z * 6.0)) * 0.3;
  float ring = sin(p.z * 34.0 + w * 6.0);
  float fine = n2(vec2(p.x * 2.0, p.z * 160.0));
  vec3 a = vec3(0.075, 0.045, 0.028) * (0.82 + 0.12 * ring + 0.14 * fine);
  float fd = sd2Box(p.xz, uBox, 0.04);
  float occ = 0.3 + 0.7 * smoothstep(0.0, 0.35, fd);
  vec2 q = p.xz - uPrint.xy; float cr = cos(uRot), sr = sin(uRot); q = vec2(cr * q.x - sr * q.y, sr * q.x + cr * q.y);
  occ *= 0.45 + 0.55 * smoothstep(-0.01, 0.07, sd2Box(q, uPrint.zw, 0.01));
  // the end of the strip that hangs past the case throws a soft shadow just beside it
  vec2 sp = p.xz + vec2(0.0, 0.12);
  if (onStrip(vec2(sp.x, 0.0)) && fd > 0.0) occ *= mix(1.0, 0.35, smoothstep(SW + 0.08, SW - 0.12, abs(sp.y)));
  vec3 n = vec3(0.0, 1.0, 0.0);
  vec3 col = a * deskLight(p, n) * occ;
  // satin varnish: a blurred reflection of the box edge and the lamp
  vec3 nn = normalize(n + vec3(rnd(3.0) - 0.5, 0.0, rnd(4.0) - 0.5) * 0.16);
  vec3 r = reflect(rd, nn);
  float F = 0.03 + 0.97 * pow(1.0 - clamp(dot(-rd, nn), 0.0, 1.0), 5.0);
  col += F * boxSeen(p + n * 0.002, r) * 0.55 * occ;
  return col;
}

vec3 shadePrint(vec3 p, vec3 rd, vec2 q){
  vec2 inner = uPrint.zw - vec2(0.085);
  vec3 paper = vec3(0.86, 0.84, 0.8);
  vec3 a = paper;
  if (abs(q.x) < inner.x && abs(q.y) < inner.y) {
    vec2 uv = vec2(q.x / (2.0 * inner.x) + 0.5, q.y / (2.0 * inner.y) + 0.5);
    vec3 ph = photo(uCur, uv) * 0.92;
    float l = dot(ph, vec3(0.3, 0.55, 0.15));
    // shadows come up first, then the mid tones, then the colour settles
    float dev = smoothstep(0.0, 1.0, uDev * 1.7 - pow(l, 0.5) * 0.7);
    vec3 warm = mix(paper, ph * vec3(1.08, 0.96, 0.84), dev);
    a = mix(warm, ph, smoothstep(0.55, 1.0, uDev));
  }
  vec3 n = vec3(0.0, 1.0, 0.0);
  vec3 col = a * deskLight(p, n);
  vec3 r = reflect(rd, normalize(n + vec3(rnd(5.0) - 0.5, 0.0, rnd(6.0) - 0.5) * 0.2));
  float F = 0.035 + 0.965 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  col += F * boxSeen(p + n * 0.002, r) * 0.6;
  return col;
}

vec3 shadeFilm(vec3 p, vec3 rd, bool over){
  vec3 tr = filmTrans(p.xz);
  vec3 col;
  if (over) col = GLOW * glassEmit(p.xz) * tr;
  else col = tr * 0.25 * deskLight(p, vec3(0.0, 1.0, 0.0)) * vec3(0.5, 0.35, 0.25) + BASE * 0.006;
  vec3 n = normalize(vec3(0.0, 1.0, 0.0) + vec3(n2(p.xz * 3.0) - 0.5, 0.0, n2(p.zx * 3.0 + 7.0) - 0.5) * 0.03);
  vec3 r = reflect(rd, n);
  float F = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  col += F * env(r) * 1.2;
  return col;
}

vec3 shadeBox(vec3 p, vec3 rd){
  vec3 q = p / vec3(uBox.x, H, uBox.y);
  vec3 a = abs(q);
  vec3 n = a.x > a.z ? vec3(sign(q.x), 0.0, 0.0) : vec3(0.0, 0.0, sign(q.z));
  if (a.y > max(a.x, a.z) && q.y > 0.0) n = vec3(0.0, 1.0, 0.0);
  if (n.y > 0.5) {
    // a satin aluminium bezel holds the glass
    float rim = min(uBox.x - abs(p.x), uBox.y - abs(p.z));
    if (rim < 0.11) {
      vec3 r = reflect(rd, n);
      float lip = smoothstep(0.11, 0.095, rim) * smoothstep(0.0, 0.02, rim);
      vec3 al = vec3(0.09, 0.088, 0.085) * deskLight(p, n) * 2.0 + env(r) * 0.35;
      al += GLOW * 0.5 * exp(-(0.11 - rim) * 30.0) * 0.4;
      return mix(al, al * 1.8, 1.0 - lip) * (0.6 + 0.4 * smoothstep(0.0, 0.015, rim));
    }
    // the bare glass round the strip
    vec3 col = GLOW * glassEmit(p.xz);
    vec3 r = reflect(rd, n);
    col += (0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0)) * env(r);
    return col;
  }
  // the edge of the opal glass shows as a glowing band along the top of the case
  float band = smoothstep(H - 0.058, H - 0.05, p.y);
  float lip = smoothstep(H - 0.075, H - 0.06, p.y) * (1.0 - band);
  vec3 body = vec3(0.03, 0.029, 0.028);
  vec3 col = body * deskLight(p, n) * 1.4;
  vec3 r = reflect(rd, n);
  col += (0.05 + 0.95 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0)) * env(r) * 0.8;
  col += vec3(0.5, 0.48, 0.45) * lip * 0.08;
  col = mix(col, GLOW * vec3(0.92, 1.0, 0.94) * 0.9, band);
  // the case sits in its own glow at the foot
  col *= 0.55 + 0.45 * smoothstep(0.0, 0.12, p.y);
  return col;
}

void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))); vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * uJit.z + up * uJit.w; rd = normalize(fp - ro);

  float best = 1e9; int what = 0; vec2 pq = vec2(0.0);
  if (rd.y < 0.0) {
    float tf = (FY - ro.y) / rd.y; vec3 p = ro + rd * tf;
    if (onStrip(p.xz)) { best = tf; what = 1; }
    float tp = (0.006 - ro.y) / rd.y; p = ro + rd * tp;
    vec2 q = p.xz - uPrint.xy; float cr = cos(uRot), sr = sin(uRot); q = vec2(cr * q.x - sr * q.y, sr * q.x + cr * q.y);
    if (tp < best && abs(q.x) < uPrint.z && abs(q.y) < uPrint.w) { best = tp; what = 2; pq = q; }
  }
  vec2 tb = boxSpan(ro, rd, vec3(-uBox.x, 0.0, -uBox.y), vec3(uBox.x, H, uBox.y));
  if (tb.x < tb.y && tb.x < best) { best = tb.x; what = 3; }
  if (what == 0 && rd.y < 0.0) { best = -ro.y / rd.y; what = 4; }

  vec3 col = vec3(0.004);
  vec3 p = ro + rd * best;
  if (what == 1) col = shadeFilm(p, rd, abs(p.x) < uBox.x && abs(p.z) < uBox.y);
  else if (what == 2) col = shadePrint(p, rd, pq);
  else if (what == 3) col = shadeBox(p, rd);
  else if (what == 4) col = shadeDesk(p, rd) * exp(-max(best - 18.0, 0.0) * 0.15);
  col = min(col, vec3(30.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the plate: bloom off the glass, the filmic curve, a vignette and grain.
const POST = `
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain; uniform vec2 uCentre;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uAcc, uv).rgb;
  vec3 b = vec3(0.0);
  for (int i = 0; i < 24; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 24.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.035 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.6, 0.0), vec3(8.0)) * (1.0 - 0.7 * r);
  }
  c += b * 0.012 * vec3(1.0, 0.9, 0.76);
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.35 * smoothstep(0.3, 1.2, length(q));
  c = tone(c);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.022;
  outC = vec4(c, 1.0);
}
`;

// No WebGL: the same desk built from CSS, with the photographs themselves.
function Still({ act }: { act: number }) {
  return (
    <div aria-hidden="true" className="absolute inset-x-4 top-[14%] sm:inset-x-10">
      <div className="relative mx-auto h-[170px] max-w-[900px] overflow-hidden rounded-[6px]" style={{ background: "#f3ede2", boxShadow: "0 0 80px 10px rgba(255,236,205,0.18), inset 0 0 40px rgba(220,200,170,0.6)" }}>
        <div className="absolute left-1/2 top-[30px] flex h-[110px] items-center gap-[6px] px-2 transition-transform duration-700 ease-[cubic-bezier(0.3,1.3,0.5,1)] motion-reduce:transition-none" style={{ background: "rgba(214,128,62,0.82)", transform: `translateX(${-(78 + act * 146)}px)`, width: N * 146 + 10 }}>
          {years.map((y, i) => (
            <div key={y.year} className="h-[86px] w-[140px] shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${y.photo})`, backgroundColor: y.tone, filter: "invert(1) sepia(0.6) saturate(2.2) hue-rotate(-12deg)", opacity: i === act ? 1 : 0.8 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LightBoxHistoryTimeline() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tags = useRef<(HTMLButtonElement | null)[]>([]);
  const [act, setAct] = useState(START);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const actRef = useRef(START);
  const api = useRef<{ go: (i: number, fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts = { antialias: false, alpha: false, powerPreference: "high-performance" as const };
    const gl2 = cv.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? cv.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) { setShown("still"); return; }
    const canAcc = !!gl2 && (!!gl2.getExtension("EXT_color_buffer_float") || !!gl2.getExtension("EXT_color_buffer_half_float"));
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    const still = reduce || software;

    const head = gl2 ? "#version 300 es\n#define ATTR in\n" : "#define ATTR attribute\n";
    const fhead = gl2 ? "#version 300 es\n#define texture2D texture\nprecision highp float;\nout vec4 outC;\n" : "#define outC gl_FragColor\n";
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const link = (frag: string) => {
      const v = compile(gl.VERTEX_SHADER, head + VERT), f = compile(gl.FRAGMENT_SHADER, fhead + frag);
      const p = gl.createProgram();
      if (!v || !f || !p) return null;
      gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    };
    const scene = link(SCENE), post = canAcc ? link(POST) : null;
    if (!scene || (canAcc && !post)) { setShown("still"); return; }
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uSel", "uHot", "uCur", "uDev", "uBox", "uPrint", "uRot", "uLamp", "uTex", "uDirect"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // The photographs go into one atlas, 3 across and 2 down, each cropped to the 3:2 frame.
    const CW = 480, CH = 320;
    const atlas = document.createElement("canvas");
    atlas.width = CW * 3; atlas.height = CH * 2;
    const ag = atlas.getContext("2d");
    const tex = gl.createTexture();
    const upload = () => {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    if (ag) years.forEach((y, i) => { ag.fillStyle = y.tone; ag.fillRect((i % 3) * CW, Math.floor(i / 3) * CH, CW, CH); });
    upload();
    let alive = true;
    years.forEach((y, i) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (!alive || !ag) return;
        const k = Math.max(CW / img.naturalWidth, CH / img.naturalHeight);
        const w = img.naturalWidth * k, h = img.naturalHeight * k;
        ag.drawImage(img, (i % 3) * CW + (CW - w) / 2, Math.floor(i / 3) * CH + (CH - h) / 2, w, h);
        upload(); s.count = 0; s.fresh = true; wake();
      };
      img.src = y.photo;
    });

    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const s = {
      sel: START, v: 0, target: START, hot: 1, cur: START, dev: 1, want: START,
      px: 0, py: 0, sx: 0, sy: 0, count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, first: true,
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.4e6 / (cssW * cssH * dpr * dpr)));
      const w = Math.max(2, Math.round(cssW * dpr * k)), h = Math.max(2, Math.round(cssH * dpr * k));
      if (w === W && h === H) return;
      W = w; H = h; cv.width = W; cv.height = H;
      if (gl2 && acc && fbo) {
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, acc);
        gl2.texImage2D(gl.TEXTURE_2D, 0, gl2.RGBA16F, W, H, 0, gl.RGBA, gl2.HALF_FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, acc, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      s.count = 0; s.fresh = true;
    };
    const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

    // Wide screens: a long box across the top, the print lying in front of it to the left.
    // Narrow screens: a shorter box seen from higher up, the print below it.
    const layout = () => {
      const wide = cssW >= 900, aspect = cssW / cssH;
      if (wide) return {
        wide, box: [4.6, 1.4], print: [-2.55, 3.55, 1.42, 0.98], rot: 0.075, lamp: [-3.6, 5.2, 5.6],
        tgt: [0.15, 0.0, 1.75], el: 0.74, az: 0.04, dist: 13.2, foc: 1.95 * Math.min(1, aspect / 1.75), shift: [0.0, -0.02],
      };
      return {
        wide, box: [2.25, 1.15], print: [0.05, 3.25, 1.32, 0.9], rot: -0.06, lamp: [-1.6, 5.4, 5.2],
        tgt: [0.0, 0.0, 1.9], el: 1.0, az: 0.0, dist: 11.0, foc: 1.12 * Math.min(1.2, aspect / 0.5), shift: [0.0, 0.15],
      };
    };
    const camera = () => {
      const l = layout();
      const el = l.el - s.sy * 0.02, az = l.az + s.sx * 0.05;
      const tgt = l.tgt;
      const cam = [tgt[0] + l.dist * Math.sin(az) * Math.cos(el), tgt[1] + l.dist * Math.sin(el), tgt[2] + l.dist * Math.cos(az) * Math.cos(el)];
      const fw = [tgt[0] - cam[0], tgt[1] - cam[1], tgt[2] - cam[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]); fw[0] /= fl; fw[1] /= fl; fw[2] /= fl;
      const rt = [-fw[2], 0, fw[0]]; const rl = Math.hypot(rt[0], rt[2]); rt[0] /= rl; rt[2] /= rl;
      const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      return { ...l, cam, fw, rt, up };
    };
    type Cam = ReturnType<typeof camera>;
    const project = (c: Cam, p: number[]) => {
      const d = [p[0] - c.cam[0], p[1] - c.cam[1], p[2] - c.cam[2]];
      const z = d[0] * c.fw[0] + d[1] * c.fw[1] + d[2] * c.fw[2];
      const x = (c.foc * (d[0] * c.rt[0] + d[1] * c.rt[1] + d[2] * c.rt[2])) / z + c.shift[0];
      const y = (c.foc * (d[0] * c.up[0] + d[1] * c.up[1] + d[2] * c.up[2])) / z + c.shift[1];
      return [cssW / 2 + x * cssH, cssH / 2 - y * cssH];
    };
    // The year buttons ride on the desk under their frames and slide with the strip.
    const placeTags = (c: Cam) => {
      for (let i = 0; i < N; i++) {
        const el = tags.current[i];
        if (!el) continue;
        const x = (i - s.sel) * PITCH;
        const [sx, sy] = project(c, [x, 0, c.box[1] + 0.28]);
        const off = Math.abs(x) > c.box[0] + 0.3;
        el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, 0)`;
        el.style.opacity = off ? "0.35" : "1";
      }
    };

    const draw = (alpha: number, sample: number) => {
      const c = camera();
      placeTags(c);
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.05 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0.37);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]); gl.uniform3f(su.uTgt, c.tgt[0], c.tgt[1], c.tgt[2]);
      gl.uniform1f(su.uFoc, c.foc);
      gl.uniform2f(su.uShift, c.shift[0], c.shift[1]);
      // focus halfway between the lit frame and the print, so both stay crisp and the far desk falls away
      const fx = (c.print[0]) * 0.4, fz = c.print[1] * 0.45;
      gl.uniform1f(su.uFocus, (fx - c.cam[0]) * c.fw[0] + (0.2 - c.cam[1]) * c.fw[1] + (fz - c.cam[2]) * c.fw[2]);
      gl.uniform1f(su.uSel, s.sel); gl.uniform1f(su.uHot, s.hot);
      gl.uniform1f(su.uCur, s.cur); gl.uniform1f(su.uDev, s.dev);
      gl.uniform2f(su.uBox, c.box[0], c.box[1]);
      gl.uniform4f(su.uPrint, c.print[0], c.print[1], c.print[2], c.print[3]);
      gl.uniform1f(su.uRot, c.rot);
      gl.uniform3f(su.uLamp, c.lamp[0], c.lamp[1], c.lamp[2]);
      gl.uniform1i(su.uTex, 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, acc);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, 0.45, c.wide ? 0.55 : 0.6);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const go = (i: number, fromUser: boolean) => {
      const k = Math.max(0, Math.min(N - 1, i));
      if (fromUser) s.touched = true;
      s.target = k; s.want = k;
      if (k !== actRef.current) { actRef.current = k; setAct(k); }
      if (reduce) { s.sel = k; s.v = 0; s.cur = k; s.dev = 1; s.hot = 1; s.count = 0; }
      wake();
    };
    api.current = { go };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 4200; }

      // the self-running demo: it opens on a finished print, holds, then walks the years until touched
      if (!still && !s.touched && now > s.demoAt) {
        const order = [3, 4, 5, 0, 1, 2];
        go(order[Math.floor((now - s.t0 - 4200) / 5200) % order.length] ?? START, false);
        s.demoAt = now + 5200;
      }

      let moving = false;
      if (!reduce) {
        const sub = 4, h = dt / sub;
        for (let k = 0; k < sub; k++) {
          // the strip has a little weight: it is pushed, coasts a hair past and settles
          const a = Math.max(-14, Math.min(14, 38 * (s.target - s.sel) - 9.5 * s.v));
          s.v += a * h; s.sel += s.v * h;
        }
        const far = Math.abs(s.target - s.sel);
        // the lamp under the glass dims while the strip is moving, then swells under the new frame
        const hotGoal = far < 0.04 && Math.abs(s.v) < 0.15 ? 1 : 0.15;
        s.hot += (hotGoal - s.hot) * (1 - Math.exp(-dt * (hotGoal > s.hot ? 3.2 : 9)));
        // the print: the old one clears to paper, then the new one comes up in the developer
        if (s.cur !== s.want) { s.dev = Math.max(0, s.dev - dt * 3.2); if (s.dev === 0) s.cur = s.want; }
        else if (s.hot > 0.5) s.dev = Math.min(1, s.dev + dt / 2.6);
        moving = Math.abs(s.v) > 0.002 || far > 0.0005 || Math.abs(s.hot - hotGoal) > 0.004 || s.dev < 1 || s.cur !== s.want;
        if (!moving) { s.sel = s.target; s.v = 0; }
      }
      if (!still) {
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        if (Math.abs(s.px - s.sx) > 0.002 || Math.abs(s.py - s.sy) > 0.002) moving = true;
      }

      const fast = Math.abs(s.v) > 0.25;
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(fast ? 0.7 : 0.35, 1 + (s.frame % 64)); s.count = 3; }
      else if (s.count < 48) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      if (!still && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 45 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 48 || (!still && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    placeTags(camera());
    const ro = new ResizeObserver(() => { size(); placeTags(camera()); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);

    // A press on the strip brings that frame to the lamp.
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      const r = box.getBoundingClientRect(), c = camera();
      let best = -1, bd = 70;
      for (let i = 0; i < N; i++) {
        const [x, y] = project(c, [(i - s.sel) * PITCH, TOP, 0]);
        const d = Math.hypot(x - (e.clientX - r.left), (y - (e.clientY - r.top)) * 0.7);
        if (d < bd) { bd = d; best = i; }
      }
      if (best >= 0) go(best, true);
    };
    const move = (e: PointerEvent) => {
      if (still) return;
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      wake();
    };
    const leave = () => { s.px = 0; s.py = 0; wake(); };
    box.addEventListener("pointerdown", down);
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      alive = false;
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointerdown", down); box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerleave", leave); cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const choose = (i: number) => {
    if (api.current) api.current.go(i, true); else { actRef.current = i; setAct(i); }
  };
  const keys = (e: React.KeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? N - 1 : -9;
    if (next === -9) return;
    e.preventDefault();
    const k = Math.max(0, Math.min(N - 1, next));
    choose(k);
    tags.current[k]?.focus();
  };
  const y = years[act];
  const fallback = shown === "still";

  return (
    <section className="relative isolate overflow-hidden bg-[#0c0a08] text-[#f3ebdf]" style={{ fontFamily: FONT }}>
      <div ref={stage} className="relative mx-auto h-[800px] w-full max-w-[1600px] sm:h-[820px] lg:h-[740px]" style={{ background: "radial-gradient(70% 60% at 45% 30%, #2a221a 0%, #120e0a 60%, #0a0806 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        {fallback && <Still act={act} />}
        {fallback && <img src={y.photo} alt="" aria-hidden="true" className="absolute bottom-[12%] left-[9%] hidden h-[200px] w-[300px] rotate-[-3deg] border-[8px] border-[#e8e3da] object-cover shadow-2xl lg:block" style={{ backgroundColor: y.tone }} />}

        <p className="pointer-events-none absolute left-6 top-6 text-[11px] font-medium uppercase tracking-[0.32em] text-[#f3ebdf]/60 sm:left-10 lg:left-14 lg:top-10">
          {COMPANY}<span className="mx-2 text-[#f3ebdf]/30">/</span><span className="hidden sm:inline">{STRAP}</span><span className="sm:hidden">Our story</span>
        </p>

        <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-8 sm:px-10 lg:left-auto lg:right-0 lg:w-[46%] lg:pb-16 lg:pr-14">
          {fallback && <img src={y.photo} alt="" className="mb-5 h-[150px] w-[225px] -rotate-2 border-[6px] border-[#e8e3da] object-cover shadow-2xl lg:hidden" style={{ backgroundColor: y.tone }} />}
          <p className="text-[86px] leading-[0.8] tracking-[-0.04em] text-[#f6e7cf] tabular-nums sm:text-[112px] lg:text-[136px]" style={{ fontFamily: SERIF }}>{y.year}</p>
          <h2 className="mt-4 text-[26px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[32px] lg:mt-6 lg:text-[38px]">{y.title}</h2>
          <p className="mt-3 max-w-[27rem] text-[16px] leading-snug text-[#f3ebdf]/72 lg:text-[18px]" style={{ fontFamily: SERIF }}>{y.body}</p>
        </div>

        <ol aria-label="Years in our history" className={`pointer-events-none ${fallback ? "absolute inset-x-4 top-[calc(14%+186px)] flex justify-center gap-0 sm:gap-3" : "absolute inset-0"}`}>
          {years.map((it, i) => {
            const on = i === act;
            return (
              <li key={it.year}>
                <button
                  ref={(el) => { tags.current[i] = el; }}
                  type="button"
                  onClick={() => choose(i)}
                  onKeyDown={(e) => keys(e, i)}
                  aria-current={on ? "step" : undefined}
                  aria-label={`${it.year}: ${it.title}`}
                  tabIndex={on ? 0 : -1}
                  className={`pointer-events-auto flex min-h-[40px] min-w-[44px] items-center justify-center rounded-full px-1.5 text-[12px] sm:px-2.5 sm:text-[13px] font-semibold tabular-nums tracking-[0.06em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#f0b979] motion-reduce:transition-none ${fallback ? "relative" : "absolute left-0 top-0 opacity-0"} ${on ? "text-[#f6c48a]" : "text-[#f3ebdf]/50 hover:text-[#f3ebdf]"}`}
                  style={fallback ? { opacity: 1 } : undefined}
                >
                  <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full transition-colors duration-300 ${on ? "bg-[#f6c48a]" : "bg-[#f3ebdf]/25"}`} />
                  {it.year}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
