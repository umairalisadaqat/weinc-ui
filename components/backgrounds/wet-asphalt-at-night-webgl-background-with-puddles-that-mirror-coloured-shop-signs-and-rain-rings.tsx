import { useEffect, useRef, useState } from "react";

// Everything about the street. Colours are red, green, blue from 0 to 1.
const street = {
  speed: 1, // how fast time passes for the rain and the walk; 0 freezes the street
  water: 0.5, // how much of the road lies under puddles; 0.35 is nearly drained, 0.62 flooded
  rain: 1, // strength of the rings where drops land; 0 leaves the puddles as still mirrors
  stone: 1, // height of the stone in the road surface; 0 is fresh, smooth tarmac
  glow: 1, // brightness of the signs across the street
  patch: [25, 8], // which stretch of road you stand on; any two numbers give a new set of puddles
  paint: 1, // 1 keeps the worn white line, 0 removes it
  eye: 1.35, // height of the viewer's eye above the road
  drift: 0.7, // how far the viewer wanders left and right
  quality: 0.8, // share of the device pixels that are drawn
  maxPixels: 950000, // the canvas never draws more pixels than this
  signs: [
    [1.0, 0.1, 0.55], // magenta, the tall sign on the left
    [0.1, 0.85, 1.0], // cyan, the long sign in the middle
    [1.0, 0.6, 0.12], // amber, the ring
    [1.0, 0.16, 0.12], // red, the small square
    [0.3, 1.0, 0.5], // green, the thin sign on the right
  ],
};

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uEye;
uniform float uHeight;
uniform float uWater;
uniform float uRain;
uniform float uStone;
uniform float uGlow;
uniform float uPaint;
uniform vec2 uPatch;
uniform vec3 uSignA;
uniform vec3 uSignB;
uniform vec3 uSignC;
uniform vec3 uSignD;
uniform vec3 uSignE;

const float WALL = 14.0; // how far away the shop fronts are

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
vec2 hash2(vec2 p) { return vec2(hash(p), hash(p.yx + 19.19)); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

// The stone rolled into the tar, and the slow dips in the road where water collects.
float stones(vec2 x) { return 0.5 * noise(x * 58.0) + 0.38 * noise(x * 121.0 + 3.1) + 0.12 * noise(x * 23.0 + 8.0); }
float lie(vec2 x) {
  x += uPatch;
  return 0.62 * noise(x * 0.55 + 2.7) + 0.38 * noise(x * 1.35 + 9.4);
}

// The ring thrown out by one raindrop in each square of a loose grid.
vec2 rings(vec2 x, float seed) {
  vec2 g = x * 1.7 + seed * 5.3;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  vec2 away = f - (hash2(id + seed) - 0.5) * 0.3;
  float d = length(away);
  float age = fract(uTime * 0.6 + hash(id + seed * 3.0));
  float gap = (d - age * 0.4) * 16.0;
  float wave = sin(gap * 4.4) * exp(-gap * gap) * (1.0 - age) * (1.0 - age);
  return away / max(d, 0.001) * wave;
}

float box(vec2 d, vec2 h) {
  vec2 a = abs(d) - h;
  return length(max(a, 0.0)) + min(max(a.x, a.y), 0.0);
}
// A lit panel and a bent glass tube, each with the haze that hangs round it in damp air.
float panel(float sd, float soft) { return smoothstep(soft, -soft, sd) + 0.3 * exp(-max(sd, 0.0) / (soft * 2.0 + 0.3)); }
float tube(float sd, float soft) {
  float d = abs(sd) - 0.06;
  return 1.25 * smoothstep(soft, -soft, d) + 0.34 * exp(-max(d, 0.0) / (soft * 2.0 + 0.3));
}

// What a ray leaving the road sees across the street: tube signs on a dark frontage and a
// few lit windows above. rough smears every shape, far more up and down than side to side,
// which is what pulls a sign into a long streak on a wet road.
vec3 across(vec3 from, vec3 dir, float rough) {
  float s = (WALL - from.z) / max(dir.z, 0.02);
  vec2 q = from.xy + dir.xy * s;
  vec2 k = vec2(1.0, 1.0 / (1.0 + rough * 16.0)); // squeeze the wall, measure, and the blur comes out tall
  float soft = 0.035 + rough * 0.42;
  float thin = 1.0 / (1.0 + rough * 2.2);
  float buzz = 0.8 + 0.2 * step(0.12, noise(vec2(uTime * 9.0, 3.0)));
  vec2 d;

  // Magenta: a tall framed sign with a column of short strokes inside it.
  d = q - vec2(-5.2, 5.8);
  float a = tube(box(d * k, vec2(0.62, 2.9) * k) - 0.12, soft);
  a += panel(box(vec2(d.x, mod(d.y + 0.45, 0.9) - 0.45) * k, vec2(0.3, 0.13) * k), soft) * step(abs(d.y), 2.5);
  vec3 col = uSignA * buzz * a;
  // Cyan: a long frame with a row of upright strokes.
  d = q - vec2(0.8, 3.2);
  float c = tube(box(d * k, vec2(2.7, 0.62) * k) - 0.12, soft);
  c += panel(box(vec2(mod(d.x + 0.3, 0.6) - 0.3, d.y) * k, vec2(0.1, 0.3) * k), soft) * step(abs(d.x), 2.3);
  col += uSignB * c;
  // Amber: a ring with a dot in it.
  d = (q - vec2(5.6, 6.6)) * k;
  col += uSignC * (tube(length(d) - 1.2 * mix(1.0, k.y, 0.5), soft) + panel(length(d) - 0.3 * k.y, soft));
  // Red: one round lamp. Green: a thin upright.
  d = (q - vec2(-1.7, 8.4)) * k;
  col += uSignD * 1.1 * (tube(length(d) - 0.62 * mix(1.0, k.y, 0.5), soft) + panel(length(d) - 0.2 * k.y, soft));
  col += uSignE * panel(box((q - vec2(9.3, 4.6)) * k, vec2(0.2, 2.3) * k), soft);
  // More of the same further along and higher up.
  col += uSignB * 0.8 * tube(box((q - vec2(-10.2, 3.4)) * k, vec2(1.8, 0.5) * k) - 0.1, soft);
  col += uSignA * 0.8 * tube(box((q - vec2(2.8, 11.0)) * k, vec2(1.7, 0.4) * k) - 0.1, soft);
  col += uSignD * 0.9 * tube(box((q - vec2(7.4, 15.0)) * k, vec2(0.5, 3.2) * k) - 0.1, soft);
  col += uSignC * 0.8 * panel(box((q - vec2(-8.0, 12.0)) * k, vec2(0.22, 2.6) * k), soft);
  col += uSignE * 0.7 * tube(length((q - vec2(-2.6, 17.5)) * k) - 1.0 * mix(1.0, k.y, 0.5), soft);
  col += vec3(1.0, 0.8, 0.55) * 1.5 * panel(length((q - vec2(-3.6, 12.8)) * k) - 0.25 * k.y, soft); // a street lamp
  col *= thin * uGlow * 5.0;

  // The sky over the roofs carries the town's glow.
  col += vec3(0.17, 0.11, 0.24) * (0.3 + 0.7 * smoothstep(0.0, 26.0, q.y));
  return col;
}

// Light arriving at the road from one sign, on a surface facing n.
vec3 wash(vec3 g, vec3 n, vec3 at, vec3 tint, float power) {
  vec3 to = at - g;
  float far = dot(to, to);
  return tint * power * max(dot(n, to / sqrt(far)), 0.0) / (1.0 + far * 0.03);
}

void main() {
  // An upright screen gets a wider lens and looks further down, so it still takes in several signs.
  float tall = step(uRes.x, uRes.y);
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y * (1.0 + 0.3 * tall);
  vec3 rd = normalize(vec3(uv.x, uv.y, 1.08));
  float tilt = 0.56 + 0.1 * tall + uEye.y;
  rd = vec3(rd.x, rd.y * cos(tilt) - rd.z * sin(tilt), rd.y * sin(tilt) + rd.z * cos(tilt));
  vec3 ro = vec3(uEye.x, uHeight, 0.0);
  float t = ro.y / max(-rd.y, 0.02);
  vec3 g = ro + rd * t;
  vec2 x = g.xz;
  float near = 1.0 / (1.0 + t * 0.22); // fine detail is let go with distance so it does not shimmer

  float e = 0.003;
  float h = stones(x);
  vec2 slope = vec2(stones(x + vec2(e, 0.0)) - h, stones(x + vec2(0.0, e)) - h) / e;
  float low = lie(x);
  float depth = uWater - low - (h - 0.5) * 0.07 * uStone * near;
  float pool = smoothstep(0.0, 0.028, depth);
  float damp = smoothstep(-0.12, 0.0, depth);

  vec2 ripple = (rings(x, 1.0) + rings(x * 1.31 + 7.0, 2.0)) * 0.05 * uRain;
  ripple += (vec2(noise(x * 5.0 + uTime * 0.4), noise(x * 5.0 - uTime * 0.33 + 4.0)) - 0.5) * 0.008;
  vec3 nRoad = normalize(vec3(-slope.x * 0.009 * uStone * near * near, 1.0, -slope.y * 0.009 * uStone * near * near));
  vec3 nPool = normalize(vec3(-ripple.x, 1.0, -ripple.y));
  vec3 n = normalize(mix(nRoad, nPool, pool));

  // The road itself: black binder, paler stone showing through where tyres have worn it.
  float grit = smoothstep(0.52, 0.74, h);
  vec3 tar = mix(vec3(0.02, 0.021, 0.025), vec3(0.075, 0.076, 0.08), grit * near);
  // A worn white line running away up the street.
  float side = x.x + 0.9 - x.y * 0.16;
  float worn = smoothstep(0.38, 0.62, noise(x * 11.0) * 0.5 + noise(x * 2.2 + 5.0) * 0.5 + (0.5 - h) * 0.7);
  float line = uPaint * smoothstep(0.085, 0.07, abs(side)) * worn;
  tar = mix(tar, vec3(0.36, 0.36, 0.34) * (0.7 + 0.4 * h), line * 0.85);
  tar *= mix(1.0, 0.6, damp); // wet stone is darker
  tar *= mix(1.0, 0.3, pool); // and darker again seen through water

  vec3 light = wash(g, n, vec3(-5.2, 5.6, WALL), uSignA, 6.0);
  light += wash(g, n, vec3(0.6, 3.1, WALL), uSignB, 6.5);
  light += wash(g, n, vec3(5.4, 6.4, WALL), uSignC, 6.0);
  light += wash(g, n, vec3(9.2, 4.4, WALL), uSignE, 3.5);
  light += wash(g, n, vec3(-3.4, 12.6, 5.0), vec3(1.0, 0.8, 0.55), 7.0);
  vec3 col = tar * (light * uGlow + vec3(0.05, 0.05, 0.07));

  // The film of water on top mirrors the far side of the street.
  vec3 r = reflect(rd, n);
  float facing = max(dot(-rd, n), 0.0);
  float fres = 0.05 + 0.95 * pow(1.0 - facing, 3.0);
  float rough = mix(0.34 + 0.3 * noise(x * 3.0) + 0.25 * (1.0 - damp), 0.0, pool);
  vec3 seen = across(g, r, rough);
  col += seen * fres * mix(0.34, 1.0, pool) * (0.5 + 0.5 * damp);

  // Haze in the distance, vignette, grain.
  col += vec3(0.05, 0.02, 0.06) * smoothstep(3.5, 9.0, t) * 0.35;
  vec2 c = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - 0.7 * dot(c, c);
  col = 1.0 - exp(-col * 2.3);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 31.0) - 0.5) * 0.018;
  gl_FragColor = vec4(pow(max(col, 0.0), vec3(0.8)), 1.0);
}`;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** One fragment shader fills the block. `onLive` reports when a frame has been painted. */
function StreetCanvas({ onLive }: { onLive: (live: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { antialias: false, alpha: false });
    if (!canvas || !gl) return; // no WebGL: the CSS street underneath stays

    const compile = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const at = (name: string) => gl.getUniformLocation(program, name);
    const u = { res: at("uRes"), time: at("uTime"), eye: at("uEye") };
    gl.uniform1f(at("uHeight"), street.eye);
    gl.uniform1f(at("uWater"), street.water);
    gl.uniform1f(at("uRain"), street.rain);
    gl.uniform1f(at("uStone"), street.stone);
    gl.uniform1f(at("uGlow"), street.glow);
    gl.uniform1f(at("uPaint"), street.paint);
    gl.uniform2f(at("uPatch"), street.patch[0], street.patch[1]);
    ["uSignA", "uSignB", "uSignC", "uSignD", "uSignE"].forEach((name, i) => gl.uniform3fv(at(name), street.signs[i]));

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const eye = { x: 0, y: 0, tx: 0, ty: 0, touched: -1e9 };
    let raf = 0;
    let visible = true;
    let time = 12;
    let before = 0;

    const draw = () => {
      gl.uniform1f(u.time, time);
      gl.uniform2f(u.eye, eye.x * street.drift, eye.y * 0.05);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight || 1;
      const scale = Math.min(Math.min(Math.max(window.devicePixelRatio || 1, 1), 2) * street.quality, Math.sqrt(street.maxPixels / Math.max(1, w * h)));
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      draw();
      onLive(true);
    };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - (before || now)) / 1000, 0.05);
      before = now;
      time += dt * street.speed;
      // Left alone, the viewer shifts their weight from foot to foot, and the mirrored signs slide.
      if (now - eye.touched > 2600) {
        eye.tx = Math.sin(time * 0.35);
        eye.ty = 0.5 * Math.sin(time * 0.23 + 1);
      }
      const k = 1 - Math.exp(-dt * 2.6);
      eye.x = mix(eye.x, eye.tx, k);
      eye.y = mix(eye.y, eye.ty, k);
      draw();
    };
    const start = () => {
      cancelAnimationFrame(raf);
      before = 0;
      if (still) draw();
      else if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const onPointer = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const x = ((e.clientX - box.left) / box.width) * 2 - 1;
      const y = 1 - ((e.clientY - box.top) / box.height) * 2;
      if (Math.abs(x) > 1 || Math.abs(y) > 1) return;
      eye.tx = x * 1.6;
      eye.ty = -y;
      eye.touched = performance.now();
    };
    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      onLive(false);
    };

    const sizeWatcher = new ResizeObserver(resize);
    sizeWatcher.observe(canvas);
    const viewWatcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    viewWatcher.observe(canvas);
    document.addEventListener("visibilitychange", start);
    if (!still) window.addEventListener("pointermove", onPointer, { passive: true });
    canvas.addEventListener("webglcontextlost", onLost);
    resize();
    start();

    return () => {
      cancelAnimationFrame(raf);
      sizeWatcher.disconnect();
      viewWatcher.disconnect();
      document.removeEventListener("visibilitychange", start);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [onLive]);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}

/** The street without a shader: blurred colour streaks on near-black. Shown first, and kept when WebGL is missing. */
function StillStreet() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#07070b]">
      <div className="absolute left-[14%] top-[-10%] h-[85%] w-[7%] bg-[linear-gradient(180deg,#ff1a8c_0%,rgba(255,26,140,0.35)_55%,rgba(255,26,140,0)_100%)] blur-2xl" />
      <div className="absolute left-[38%] top-[-10%] h-[60%] w-[26%] bg-[linear-gradient(180deg,#19d9ff_0%,rgba(25,217,255,0.3)_50%,rgba(25,217,255,0)_100%)] blur-3xl" />
      <div className="absolute left-[70%] top-[-10%] h-[95%] w-[9%] bg-[linear-gradient(180deg,#ff991f_0%,rgba(255,153,31,0.35)_60%,rgba(255,153,31,0)_100%)] blur-2xl" />
      <div className="absolute left-[88%] top-[-10%] h-[70%] w-[4%] bg-[linear-gradient(180deg,#4dff80_0%,rgba(77,255,128,0.3)_55%,rgba(77,255,128,0)_100%)] blur-2xl" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(7,7,11,0)_30%,rgba(7,7,11,0.85)_100%)]" />
    </div>
  );
}

export default function WetAsphaltAtNightWebglBackgroundWithPuddlesThatMirrorColouredShopSignsAndRainRings() {
  const [live, setLive] = useState(false);

  return (
    <section className="relative isolate h-[620px] overflow-hidden bg-[#07070b] sm:h-[760px]">
      <StillStreet />
      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${live ? "opacity-100" : "opacity-0"}`}>
        <StreetCanvas onLive={setLive} />
      </div>
      <p className="absolute bottom-5 left-5 rounded-full bg-black/80 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-50 sm:bottom-7 sm:left-7">
        Wet asphalt <span className="hidden text-cyan-200 sm:inline">/ after rain, signs across the road</span>
      </p>
    </section>
  );
}
