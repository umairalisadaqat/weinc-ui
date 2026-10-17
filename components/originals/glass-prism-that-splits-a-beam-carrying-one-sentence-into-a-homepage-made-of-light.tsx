import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The sentence that goes in and the page that comes out. `rows` are the bottom edges of the five bands the light paints. */
const site = {
  sentence: "A florist in Porto that delivers bouquets on Sundays.",
  brand: "Ramo Flores",
  links: ["Bouquets", "Weddings", "Visit"],
  headline: ["Sundays,", "in bloom."],
  photo: { src: "https://images.pexels.com/photos/31074939/pexels-photo-31074939.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "White tulips wrapped in brown paper in a shaft of sunlight" },
  chips: ["Tied by hand", "Seasonal stems", "Porto and Gaia"],
  cta: "Send a bouquet",
  note: "Order by Friday noon",
};

const BLUE = "#4F98FB";
const INK = "#0B0D12";
// Design pixels; the scene is scaled to fit.
const SCENE_W = 900;
const SCENE_H = 520;
const BEAM_Y = 262;
const LENS_X = 232;
const PAGE_X = 604;
const PAGE_Y = 96;
const PAGE_W = 274;
const PAGE_H = 334;
const ROWS = [0, 42, 138, 238, 286, PAGE_H]; // band edges down the page
const TINTS = ["234,243,255", "190,217,254", "140,188,252", "79,152,251", "52,116,224"];
const CX = 372;
const CY = 285;
const SIDE = 204;
const DIM = 0.055; // how much of the page you can make out with the light off

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const ease = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
type P = { x: number; y: number };

function cross(p: P, d: P, a: P, b: P): P {
  const ex = b.x - a.x;
  const ey = b.y - a.y;
  const den = d.x * ey - d.y * ex;
  const t = ((a.x - p.x) * ey - (a.y - p.y) * ex) / (den || 1e-6);
  return { x: p.x + d.x * t, y: p.y + d.y * t };
}

export default function PrismHomepage() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(true);
  const sim = useRef({ on: true, since: -900, level: 0.6, rot: 0, trot: 0, next: 0, held: false, user: false, mask: "", redraw: () => {} });

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    const page = pageRef.current;
    if (!wrap || !scene || !canvas || !page) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = sim.current;
    const DPR = 2;
    canvas.width = SCENE_W * DPR;
    canvas.height = SCENE_H * DPR;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    s.since = last - 900;
    s.next = last + 6400;
    const h = SIDE * 0.866;
    const motes = Array.from({ length: 44 }, (_, i) => ({ u: (i * 0.618) % 1, v: (i * 0.377 + 0.13) % 1, sp: 0.012 + ((i * 7) % 10) * 0.0022, ph: i * 1.7 }));

    const measure = () => {
      const sc = clamp((wrap.clientWidth - 20) / SCENE_W, 0.36, 1.24);
      wrap.style.height = `${Math.round(SCENE_H * sc)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);

    const geo = (rot: number) => {
      const th = (rot * Math.PI) / 180;
      const rotp = (x: number, y: number): P => ({ x: CX + x * Math.cos(th) - y * Math.sin(th), y: CY + x * Math.sin(th) + y * Math.cos(th) });
      const A = rotp(0, (-h * 2) / 3);
      const B = rotp(-SIDE / 2, h / 3);
      const C = rotp(SIDE / 2, h / 3);
      const E = cross({ x: LENS_X, y: BEAM_Y }, { x: 1, y: 0 }, A, B);
      const inside = (6 + rot * 0.7) * (Math.PI / 180);
      const X = cross(E, { x: Math.cos(inside), y: Math.sin(inside) }, A, C);
      return { A, B, C, E, X };
    };
    const X0 = geo(0).X;

    const draw = (now: number) => {
      const L = s.level;
      const { A, B, C, E, X } = geo(s.rot);
      // where each edge of the fan lands on the page, and how bright each band is
      const lean = s.rot * 2.3 * (Math.PI / 180);
      const hits = ROWS.map((r) => {
        const a = Math.atan2(PAGE_Y + r - X0.y, PAGE_X - X0.x) + lean;
        return X.y + Math.tan(a) * (PAGE_X - X.x);
      });
      const t = now - s.since;
      const alpha = TINTS.map((_, i) => (reduce ? (s.on ? 1 : 0) : s.on ? ease((t - 260 - i * 150) / 620) : 1 - ease(t / 320)));

      // the page is only as visible as the light falling on it
      const at = (k: number, d: number) => `${(hits[k] - PAGE_Y + d).toFixed(1)}px`;
      const lv = alpha.map((a) => (DIM + (1 - DIM) * a).toFixed(3));
      const stops: string[] = [`rgba(0,0,0,${DIM}) 0px`, `rgba(0,0,0,${DIM}) ${at(0, -14)}`, `rgba(0,0,0,${lv[0]}) ${at(0, -3)}`];
      for (let i = 1; i < 5; i++) stops.push(`rgba(0,0,0,${lv[i - 1]}) ${at(i, -5)}`, `rgba(0,0,0,${lv[i]}) ${at(i, 5)}`);
      stops.push(`rgba(0,0,0,${lv[4]}) ${at(5, 3)}`, `rgba(0,0,0,${DIM}) ${at(5, 14)}`);
      const mask = `linear-gradient(180deg, ${stops.join(", ")})`;
      if (mask !== s.mask) {
        s.mask = mask;
        page.style.setProperty("-webkit-mask-image", mask);
        page.style.setProperty("mask-image", mask);
      }
      scene.style.setProperty("--L", L.toFixed(3));

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, SCENE_W, SCENE_H);
      ctx.lineCap = "round";

      // the beam from the torch to the glass
      ctx.globalCompositeOperation = "lighter";
      const flick = reduce ? 1 : 0.94 + 0.06 * Math.sin(now / 90);
      for (const [w, a] of [[26, 0.05], [10, 0.14], [3, 0.98]] as const) {
        ctx.strokeStyle = `rgba(226,238,255,${(a * L * flick).toFixed(3)})`;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(LENS_X, BEAM_Y);
        ctx.lineTo(E.x, E.y);
        ctx.stroke();
      }
      // a faint reflection thrown off the first face
      const refl = ctx.createLinearGradient(E.x, E.y, E.x - 70, E.y - 150);
      refl.addColorStop(0, `rgba(200,222,255,${(0.22 * L).toFixed(3)})`);
      refl.addColorStop(1, "rgba(200,222,255,0)");
      ctx.strokeStyle = refl;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(E.x, E.y);
      ctx.lineTo(E.x - 70, E.y - 150);
      ctx.stroke();

      // the fan
      for (let i = 0; i < 5; i++) {
        if (alpha[i] <= 0.004) continue;
        const g = ctx.createLinearGradient(X.x, 0, PAGE_X, 0);
        g.addColorStop(0, `rgba(${TINTS[i]},${(0.9 * alpha[i]).toFixed(3)})`);
        g.addColorStop(0.3, `rgba(${TINTS[i]},${(0.5 * alpha[i]).toFixed(3)})`);
        g.addColorStop(1, `rgba(${TINTS[i]},${(0.3 * alpha[i]).toFixed(3)})`);
        ctx.fillStyle = g;
        ctx.shadowColor = `rgba(${TINTS[i]},${(0.55 * alpha[i]).toFixed(3)})`;
        ctx.shadowBlur = 36;
        ctx.beginPath();
        ctx.moveTo(X.x, X.y);
        ctx.lineTo(PAGE_X, hits[i]);
        ctx.lineTo(PAGE_X, hits[i + 1]);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(${TINTS[i]},${(0.5 * alpha[i]).toFixed(3)})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(X.x, X.y);
        ctx.lineTo(PAGE_X, hits[i]);
        ctx.stroke();
        // the bright edge where this band meets the sheet
        ctx.strokeStyle = `rgba(${TINTS[i]},${(0.9 * alpha[i]).toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PAGE_X, hits[i] + 1);
        ctx.lineTo(PAGE_X, hits[i + 1] - 1);
        ctx.stroke();
      }
      // dust in the light
      for (const m of motes) {
        const u = reduce ? m.u : (m.u + (now / 1000) * m.sp) % 1;
        const x = X.x + 14 + (PAGE_X - X.x - 18) * u;
        const k = (x - X.x) / (PAGE_X - X.x);
        const top = X.y + (hits[0] - X.y) * k;
        const bot = X.y + (hits[5] - X.y) * k;
        const v = clamp(m.v + (reduce ? 0 : 0.03 * Math.sin(now / 1700 + m.ph)), 0.02, 0.98);
        const band = Math.min(4, Math.floor(v * 5));
        const tw = reduce ? 0.6 : 0.45 + 0.55 * Math.sin(now / 420 + m.ph) ** 2;
        ctx.fillStyle = `rgba(240,246,255,${(0.75 * alpha[band] * tw).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, top + (bot - top) * v, 0.9 + (m.ph % 1) * 0.7, 0, 6.3);
        ctx.fill();
      }

      // the prism: a block of glass with a little depth
      ctx.globalCompositeOperation = "source-over";
      const off = { x: 24, y: -15 };
      const back = [A, B, C].map((p) => ({ x: p.x + off.x, y: p.y + off.y }));
      const path = (pts: P[]) => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
      };
      path(back);
      ctx.fillStyle = "rgba(130,165,235,0.09)";
      ctx.fill();
      ctx.strokeStyle = "rgba(190,214,255,0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // right-hand side face, where the light leaves
      path([A, C, back[2], back[0]]);
      const side = ctx.createLinearGradient(A.x, A.y, C.x, C.y);
      side.addColorStop(0, "rgba(225,238,255,0.42)");
      side.addColorStop(0.6, `rgba(120,170,250,${(0.10 + 0.16 * L).toFixed(3)})`);
      side.addColorStop(1, "rgba(90,130,210,0.06)");
      ctx.fillStyle = side;
      ctx.fill();
      // front face
      path([A, B, C]);
      const face = ctx.createLinearGradient(B.x, B.y, (A.x + C.x) / 2 + 30, (A.y + C.y) / 2);
      face.addColorStop(0, "rgba(222,235,255,0.34)");
      face.addColorStop(0.42, "rgba(110,140,205,0.10)");
      face.addColorStop(0.7, "rgba(60,84,140,0.10)");
      face.addColorStop(1, "rgba(170,204,255,0.26)");
      ctx.fillStyle = face;
      ctx.fill();
      // facets seen through the glass: the far edges, bent
      const mid = (p: P, q: P, k: number): P => ({ x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k });
      path([mid(A, B, 0.34), mid(B, C, 0.3), mid(B, C, 0.52), mid(A, C, 0.2)]);
      ctx.fillStyle = "rgba(255,255,255,0.055)";
      ctx.fill();
      path([mid(A, C, 0.62), mid(B, C, 0.78), C]);
      ctx.fillStyle = "rgba(8,10,18,0.28)";
      ctx.fill();
      path([B, mid(B, A, 0.2), mid(B, C, 0.16)]);
      ctx.fillStyle = "rgba(8,10,18,0.22)";
      ctx.fill();

      ctx.save();
      path([A, B, C]);
      ctx.clip();
      ctx.globalCompositeOperation = "lighter";
      // light spreading on its way through
      const thru = ctx.createLinearGradient(E.x, E.y, X.x, X.y);
      thru.addColorStop(0, `rgba(240,246,255,${(0.9 * L).toFixed(3)})`);
      thru.addColorStop(1, `rgba(120,176,252,${(0.55 * L).toFixed(3)})`);
      ctx.fillStyle = thru;
      const nx = -(X.y - E.y);
      const ny = X.x - E.x;
      const nl = Math.hypot(nx, ny) || 1;
      ctx.beginPath();
      ctx.moveTo(E.x, E.y - 1.4);
      ctx.lineTo(X.x + (nx / nl) * 7, X.y + (ny / nl) * 7);
      ctx.lineTo(X.x - (nx / nl) * 7, X.y - (ny / nl) * 7);
      ctx.lineTo(E.x, E.y + 1.4);
      ctx.closePath();
      ctx.fill();
      for (const [p, r, a] of [[E, 58, 0.5], [X, 74, 0.6]] as const) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(190,216,255,${(a * L).toFixed(3)})`);
        g.addColorStop(1, "rgba(190,216,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      }
      // a soft streak of room light lying along the left face
      const sA = { x: A.x + (B.x - A.x) * 0.12 + 13, y: A.y + (B.y - A.y) * 0.12 + 6 };
      const sB = { x: A.x + (B.x - A.x) * 0.8 + 13, y: A.y + (B.y - A.y) * 0.8 + 6 };
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(sA.x, sA.y);
      ctx.lineTo(sB.x, sB.y);
      ctx.stroke();
      ctx.restore();

      ctx.globalCompositeOperation = "source-over";
      // chamfer line just inside the front face
      const gx = (A.x + B.x + C.x) / 3;
      const gy = (A.y + B.y + C.y) / 3;
      path([A, B, C].map((p) => ({ x: gx + (p.x - gx) * 0.84, y: gy + (p.y - gy) * 0.84 })));
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 1;
      ctx.stroke();
      for (const [p, q] of [[A, back[0]], [C, back[2]], [B, back[1]]] as const) {
        ctx.strokeStyle = "rgba(200,220,255,0.3)";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      const edge = (p: P, q: P, c0: string, c1: string, w: number) => {
        const g = ctx.createLinearGradient(p.x, p.y, q.x, q.y);
        g.addColorStop(0, c0);
        g.addColorStop(1, c1);
        ctx.strokeStyle = g;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      };
      edge(A, B, "rgba(255,255,255,1)", "rgba(190,214,255,0.55)", 2.2);
      edge(A, C, "rgba(255,255,255,0.8)", `rgba(120,176,252,${(0.4 + 0.5 * L).toFixed(3)})`, 1.8);
      edge(B, C, "rgba(170,198,245,0.35)", "rgba(220,234,255,0.8)", 2);
      ctx.globalCompositeOperation = "lighter";
      for (const [p, r, a] of [[A, 16, 0.5], [E, 12, 0.9 * L], [X, 16, 0.9 * L]] as const) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(255,255,255,${a.toFixed(3)})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (reduce) {
        s.level = s.on ? 1 : 0;
        s.rot = 0;
      } else {
        s.level += ((s.on ? 1 : 0) - s.level) * Math.min(1, dt * 9);
        const idle = Math.sin(now / 2300) * 0.6;
        s.rot += (s.trot + idle - s.rot) * Math.min(1, dt * 6);
        if (!s.user && !s.held && now > s.next) {
          s.on = !s.on;
          s.since = now;
          s.next = now + (s.on ? 7200 : 1100);
          setLit(s.on);
        }
      }
      draw(now);
      if (visible && !reduce) raf = requestAnimationFrame(tick);
    };
    s.redraw = () => tick(performance.now());

    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(wrap);
    raf = requestAnimationFrame(tick);

    const move = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      s.trot = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1) * 6;
    };
    const leave = () => {
      s.trot = 0;
    };
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerdown", move);
    wrap.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerdown", move);
      wrap.removeEventListener("pointerleave", leave);
    };
  }, [reduce]);

  const toggle = () => {
    const s = sim.current;
    s.on = !s.on;
    s.since = performance.now();
    s.user = !s.on;
    s.next = s.since + 9000;
    setLit(s.on);
    if (reduce) s.redraw();
  };
  const hold = (v: boolean) => () => {
    sim.current.held = v;
    if (!v) sim.current.next = performance.now() + 3000;
  };

  const sans = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
  const row = (i: number) => ({ top: ROWS[i], height: ROWS[i + 1] - ROWS[i] });

  return (
    <section className="relative overflow-hidden bg-[#0B0D12]" style={{ fontFamily: sans }} onMouseEnter={hold(true)} onMouseLeave={hold(false)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(52% 70% at 42% 44%, #1a1f2b 0%, #10131a 48%, #0B0D12 100%)" }} />
      <div ref={wrapRef} className="relative mx-auto mt-4 w-full max-w-[1120px] overflow-hidden sm:mt-6" style={{ height: SCENE_H }}>
        <div ref={sceneRef} className="absolute left-1/2 top-0 select-none" style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "1300px", perspectiveOrigin: "70% 50%", ["--L" as string]: 0.6 }}>
          {/* light bouncing off the sheet into the room */}
          <div aria-hidden="true" className="absolute rounded-full" style={{ left: PAGE_X - 120, top: PAGE_Y - 70, width: PAGE_W + 240, height: PAGE_H + 140, background: "radial-gradient(closest-side, rgba(79,152,251,0.20), rgba(79,152,251,0))", opacity: "var(--L)" as unknown as number }} />

          {/* the torch that carries the sentence */}
          <div aria-hidden="true" className="absolute" style={{ left: 4, top: BEAM_Y - 35, width: LENS_X - 4, height: 70 }}>
            <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(180deg, #5a606c 0%, #343842 9%, #1c1f27 38%, #12141a 62%, #23262f 90%, #0a0b0f 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.6)" }} />
            <div className="absolute inset-y-[9px] left-[12px] right-[56px] overflow-hidden rounded-full" style={{ background: "linear-gradient(180deg, #06070a, #0e1016)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.10)" }}>
              <p className="absolute inset-y-0 left-[16px] right-[8px] flex items-center text-[11.5px] font-bold leading-[1.2] tracking-[-0.01em] text-white/90">{site.sentence}</p>
            </div>
            <div className="absolute inset-y-[3px] right-[36px] w-[12px]" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.7) 0 1.5px, rgba(255,255,255,0.16) 1.5px 3px), linear-gradient(180deg, #6b717d, #1c1f27 40%, #0c0d11 70%, #2b2f39)" }} />
            <div className="absolute right-[4px] top-1/2 h-[26px] w-[26px] -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle at 50% 50%, #ffffff 0%, #cfe2ff 30%, #4F98FB 62%, #153a78 100%)", boxShadow: "0 0 0 2px #090a0d, 0 0 0 3px rgba(255,255,255,0.22)" }}>
              <div className="absolute -inset-5 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(170,205,255,0.75), rgba(79,152,251,0))", opacity: "var(--L)" as unknown as number }} />
              <div className="absolute inset-0 rounded-full bg-[#06070a]" style={{ opacity: "calc(0.86 - var(--L) * 0.86)" as unknown as number }} />
            </div>
          </div>

          {/* the sheet the light falls on */}
          <div className="absolute" style={{ left: PAGE_X, top: PAGE_Y, width: PAGE_W, height: PAGE_H, transformOrigin: "0 50%", transform: "rotateY(17deg)", transformStyle: "preserve-3d" }}>
            <div aria-hidden="true" className="absolute inset-0 rounded-[6px]" style={{ background: "#12151c", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07), 18px 26px 50px rgba(0,0,0,0.65)" }} />
            <div ref={pageRef} className="absolute inset-0 overflow-hidden rounded-[6px] bg-[#F6F4EF]">
              <div className="absolute inset-x-[18px] flex items-center justify-between" style={row(0)}>
                <span className="flex items-center gap-[6px] text-[11.5px] font-extrabold tracking-[-0.02em]" style={{ color: INK }}>
                  <span aria-hidden="true" className="h-[8px] w-[8px] rounded-full" style={{ background: BLUE }} />
                  {site.brand}
                </span>
                <span className="flex gap-[10px] text-[8.5px] font-bold text-neutral-700">
                  {site.links.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </span>
              </div>
              <h2 className="absolute inset-x-[18px] flex flex-col justify-center text-[40px] font-black leading-[0.92] tracking-[-0.055em]" style={{ ...row(1), color: INK }}>
                {site.headline.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </h2>
              <div className="absolute inset-x-[18px] overflow-hidden rounded-[4px] bg-[#231b12]" style={{ top: ROWS[2] + 3, height: ROWS[3] - ROWS[2] - 6 }}>
                <img src={site.photo.src} alt={site.photo.alt} width={232} height={94} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: "60% 58%" }} />
              </div>
              <ul className="absolute inset-x-[18px] flex items-center gap-[6px]" style={row(3)}>
                {site.chips.map((c) => (
                  <li key={c} className="flex h-[26px] flex-1 items-center justify-center rounded-full border border-neutral-900/80 text-[8px] font-extrabold tracking-[-0.01em]" style={{ color: INK }}>
                    {c}
                  </li>
                ))}
              </ul>
              <div className="absolute inset-x-[18px] flex items-center gap-[10px]" style={{ ...row(4), paddingBottom: 6 }}>
                <span className="inline-flex h-[30px] items-center gap-[6px] rounded-full px-[14px] text-[10.5px] font-extrabold tracking-[-0.01em]" style={{ background: BLUE, color: INK }}>
                  {site.cta}
                  <svg aria-hidden="true" width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10h12M11 5l5 5-5 5" />
                  </svg>
                </span>
                <span className="text-[8.5px] font-bold text-neutral-700">{site.note}</span>
              </div>
              {/* the light thins out as it crosses the sheet */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(190,216,255,0.16) 0%, rgba(255,255,255,0) 22%, rgba(11,13,18,0.12) 70%, rgba(11,13,18,0.34) 100%)" }} />
            </div>
          </div>

          <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0" style={{ width: SCENE_W, height: SCENE_H }} />
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-[1000px] flex-col items-start gap-4 px-5 pb-7 pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:pb-10">
        <p className="max-w-[440px] text-[14px] font-semibold leading-snug tracking-[-0.01em] text-white/85">
          <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: BLUE }}>
            One sentence in
          </span>
          {site.sentence}
        </p>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={lit}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 text-[13px] font-bold tracking-[-0.01em] text-white transition hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB]"
        >
          <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: lit ? BLUE : "rgba(255,255,255,0.4)", boxShadow: lit ? `0 0 10px ${BLUE}` : "none" }} />
          {lit ? "Cut the light" : "Send the light"}
        </button>
      </div>
    </section>
  );
}
