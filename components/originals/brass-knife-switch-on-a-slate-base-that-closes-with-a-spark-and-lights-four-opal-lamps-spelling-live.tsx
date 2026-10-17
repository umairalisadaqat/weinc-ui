import { useEffect, useRef, useState } from "react";

const LAMPS = ["L", "I", "V", "E"]; // one opal globe per letter
const site = { name: "Saltmarsh Surf School", address: "saltmarshsurf.example" };
const BLUE = "#4F98FB";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const W = 800, H = 470; // the stage everything is laid out in
const SX = 30, SW = 740; // the slate base
const TOP = 336, FACE = 364, BOT = 410; // back of its top, its front edge, its underside
const FEET = 351; // the line the fittings stand on
const PX = 356, PY = 301; // hinge pin of the blade
const BL = 188; // hinge to jaw
const JX = PX - BL;
const A_OPEN = 0.96; // how far the blade lifts, in radians
const LAMP_X = [476, 556, 636, 716];
const FIRST = 5200, OPEN_FOR = 1700, HOLD = 7600; // the demo
const BRASS = "linear-gradient(180deg,#fff2c0 0%,#e2bf68 14%,#b98d30 46%,#8a651a 78%,#4a340a 100%)";
const BRASS_X = "linear-gradient(90deg,#4f370a 0%,#a67a22 16%,#f1d587 36%,#fff4c8 44%,#d2a846 58%,#8c661a 82%,#402c07 100%)";

type Api = { set: (closed: boolean) => void };
type Bit = { x: number; y: number; vx: number; vy: number; life: number; max: number };

function Screw({ left, top, size = 9 }: { left: number; top: number; size?: number }) {
  return (
    <span className="absolute rounded-full" style={{ left, top, width: size, height: size, background: "radial-gradient(circle at 36% 30%,#fff7d6,#c79c3e 48%,#4a340a)", boxShadow: "0 1px 1px rgba(0,0,0,0.7)" }}>
      <span className="absolute left-[15%] right-[15%] top-1/2 h-[1.4px] -translate-y-1/2 rotate-[28deg] bg-[#2e2006]" />
    </span>
  );
}

export default function BrassKnifeSwitch() {
  const stage = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const blade = useRef<HTMLDivElement>(null);
  const grip = useRef<HTMLDivElement>(null);
  const sparks = useRef<HTMLCanvasElement>(null);
  const api = useRef<Api | null>(null);
  const [zoom, setZoom] = useState(1);
  const [live, setLive] = useState(true);

  useEffect(() => {
    const st = stage.current, el = root.current, bl = blade.current, gr = grip.current, cv = sparks.current;
    const ctx = cv?.getContext("2d");
    if (!st || !el || !bl || !gr || !cv || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = 260 * dpr; cv.height = 260 * dpr;
    const scale = () => Math.max(0.4, Math.min(1.12, (st.clientWidth - 12) / W));
    const fit = () => setZoom(scale());
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(st);

    // a: angle of the blade, 0 when it is home in the jaw. The piece opens closed and lit.
    const s = { a: 0, w: 0, to: 0, drag: false, made: true, onAt: LAMPS.map(() => -1e9), offAt: LAMPS.map(() => 1e12), lv: LAMPS.map(() => 1), flash: 0, bits: [] as Bit[], touched: -1e9, live: true };
    const paint = () => {
      bl.style.transform = `rotate(${s.a.toFixed(4)}rad)`;
      el.style.setProperty("--a", (s.a / A_OPEN).toFixed(3));
      let sum = 0;
      s.lv.forEach((v, i) => { el.style.setProperty(`--l${i}`, v.toFixed(3)); sum += v; });
      el.style.setProperty("--lit", (sum / LAMPS.length).toFixed(3));
      el.style.setProperty("--flash", s.flash.toFixed(3));
    };
    const tell = () => { const now = s.to === 0; if (now !== s.live) { s.live = now; setLive(now); } };
    const arc = (n: number, power: number) => {
      if (reduce) return;
      s.flash = Math.max(s.flash, power);
      for (let i = 0; i < n; i++) {
        const dir = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, v = (120 + Math.random() * 380) * power, max = 0.22 + Math.random() * 0.42;
        s.bits.push({ x: 130 + (Math.random() - 0.5) * 8, y: 126, vx: Math.cos(dir) * v, vy: Math.sin(dir) * v, life: max, max });
      }
    };
    const drawBits = (dt: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, 260, 260);
      if (s.flash > 0.01) {
        const g = ctx.createRadialGradient(130, 126, 0, 130, 126, 70 * s.flash + 20);
        g.addColorStop(0, `rgba(255,255,255,${0.95 * s.flash})`); g.addColorStop(0.25, `rgba(170,210,255,${0.6 * s.flash})`); g.addColorStop(1, "rgba(79,152,251,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 260, 260);
      }
      ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.shadowColor = "rgba(79,152,251,0.9)"; ctx.shadowBlur = 7 * dpr;
      for (const b of s.bits) {
        const ox = b.x, oy = b.y;
        b.vy += 900 * dt; b.vx *= 1 - 2.2 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
        const k = Math.max(0, b.life / b.max);
        ctx.strokeStyle = `rgba(${170 + 85 * k},${210 + 45 * k},255,${Math.min(1, k * 1.6)})`; ctx.lineWidth = 1 + 2.2 * k;
        ctx.beginPath(); ctx.moveTo(ox - b.vx * dt * 2.2, oy - b.vy * dt * 2.2); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.beginPath(); ctx.arc(b.x, b.y, 1.1 + k, 0, 6.3); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over"; ctx.shadowBlur = 0;
      s.bits = s.bits.filter((b) => b.life > 0 && b.y < 172);
    };

    let raf = 0, last = 0, seen = true, timer = 0, begin = () => {};
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.max(0.004, Math.min(0.032, (now - last) / 1000 || 0.016)); last = now;
      const before = s.a;
      if (!s.drag) {
        // thrown down by hand weight, gripped by the jaw for the last few degrees, sprung up when pulled
        const inJaw = s.a < 0.12;
        const pull = s.to === 0 ? -20 - 16 * s.a : 30 * (A_OPEN + 0.06 - s.a) + 4;
        s.w += (pull - (inJaw ? 13 : 3.6) * s.w) * dt; s.a += s.w * dt;
        if (s.a < 0) { s.a = 0; s.w = s.w < -1.6 ? -s.w * 0.1 : 0; }
        if (s.a > A_OPEN) { s.a = A_OPEN; s.w = s.w > 0.5 ? -s.w * 0.3 : 0; }
      }
      // the arc jumps just before the blade lands, and a smaller one as it leaves
      if (before > 0.1 && s.a <= 0.1 && s.a < before) arc(38, 1);
      const made = s.a < 0.06;
      if (made && !s.made) { s.onAt = LAMPS.map((_, i) => now + 70 + i * 140); s.offAt = LAMPS.map(() => 1e12); }
      if (!made && s.made) { arc(12, 0.55); s.offAt = LAMPS.map((_, i) => now + i * 45); s.onAt = LAMPS.map(() => 1e12); }
      s.made = made;
      let busy = false;
      s.lv = s.lv.map((v, i) => {
        const t = now - s.onAt[i];
        if (now >= s.offAt[i]) { const n = v * Math.exp(-dt / 0.14); if (n > 0.004) busy = true; return n > 0.004 ? n : 0; }
        if (t < 0) { if (s.onAt[i] < 1e11) busy = true; return v; }
        if (t < 520) busy = true;
        return t < 55 ? 0.6 : t < 115 ? 0.12 : t < 180 ? 0.85 : t < 250 ? 0.45 : t < 520 ? 0.8 + 0.2 * ((t - 250) / 270) : 1;
      });
      s.flash *= Math.exp(-dt / 0.09); if (s.flash < 0.01) s.flash = 0;
      paint(); drawBits(dt);
      const rest = !s.drag && !busy && s.flash === 0 && s.bits.length === 0 && Math.abs(s.w) < 0.003 && (s.a === 0 || s.a === A_OPEN);
      if (rest) return;
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const go = (closed: boolean) => {
      s.to = closed ? 0 : A_OPEN; tell();
      if (reduce) { s.a = s.to; s.w = 0; s.made = closed; s.lv = LAMPS.map(() => (closed ? 1 : 0)); s.onAt = LAMPS.map(() => -1e9); s.offAt = LAMPS.map(() => (closed ? 1e12 : -1e9)); paint(); return; }
      s.w += closed ? -1.2 : 2.6; wake();
    };
    api.current = { set: (closed) => { s.touched = performance.now(); go(closed); } };

    // take hold of the grip and throw the switch yourself
    const angle = (e: PointerEvent) => {
      const r = el.getBoundingClientRect(), k = r.width / W;
      return Math.max(0, Math.min(A_OPEN, Math.atan2(r.top + PY * k - e.clientY, r.left + PX * k - e.clientX)));
    };
    let lastA = 0, lastT = 0;
    const down = (e: PointerEvent) => { if (reduce) return; s.drag = true; s.touched = performance.now(); lastA = s.a; lastT = performance.now(); gr.setPointerCapture(e.pointerId); wake(); };
    const move = (e: PointerEvent) => {
      if (!s.drag) return;
      const now = performance.now(), next = angle(e);
      s.w = ((next - lastA) / Math.max(0.008, (now - lastT) / 1000)) * 0.6; s.a = next; lastA = next; lastT = now;
    };
    const up = () => {
      if (!s.drag) return;
      s.drag = false; s.touched = performance.now(); s.w = Math.max(-6, Math.min(6, s.w));
      s.to = s.w < -1 || (s.w < 1 && s.a < A_OPEN * 0.45) ? 0 : A_OPEN; tell(); wake();
    };
    gr.addEventListener("pointerdown", down);
    gr.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    paint();
    // while the circuit is made and nothing else is moving, the lamps breathe very slightly
    const hum = window.setInterval(() => {
      if (reduce || raf || !seen || document.hidden || !s.made || s.a !== 0) return;
      const t = performance.now() / 1000;
      LAMPS.forEach((_, i) => el.style.setProperty(`--l${i}`, (0.94 + 0.06 * Math.sin(t * 2.3 + i * 1.7)).toFixed(3)));
    }, 110);
    if (!reduce) {
      // The demo: lit, open, close with a spark, hold. It stands down while someone is using the switch.
      const loop = (wait: number, closed: boolean) => { timer = window.setTimeout(() => { if (seen && !document.hidden && performance.now() - s.touched > 9000) go(closed); loop(closed ? HOLD : OPEN_FOR, !closed); }, wait); };
      begin = () => loop(FIRST, false);
      if (document.readyState === "complete") begin(); else window.addEventListener("load", begin, { once: true });
    }
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen && (s.a !== s.to || s.drag)) wake(); });
    io.observe(st);
    const vis = () => { if (!document.hidden && s.a !== s.to) wake(); };
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(raf); window.clearTimeout(timer); window.clearInterval(hum); window.removeEventListener("load", begin); api.current = null;
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", vis);
      gr.removeEventListener("pointerdown", down); gr.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
    };
  }, []);

  const wire = `M ${PX + 40} ${FEET - 5} C ${PX + 62} ${FEET + 4} ${LAMP_X[0] - 50} ${FEET + 5} ${LAMP_X[0] - 23} ${FEET - 6} ${LAMP_X.slice(1).map((x, i) => `M ${LAMP_X[i] + 23} ${FEET - 6} C ${LAMP_X[i] + 38} ${FEET + 6} ${x - 38} ${FEET + 6} ${x - 23} ${FEET - 6}`).join(" ")} M ${JX - 40} ${FEET - 5} C ${JX - 62} ${FEET - 2} ${JX - 78} ${FEET + 4} ${JX - 84} ${FACE + 2} C ${JX - 88} ${FACE + 20} ${JX - 86} ${BOT - 8} ${JX - 92} ${BOT + 6}`;

  return (
    <div
      className="relative flex min-h-[540px] w-full flex-col items-center justify-center overflow-hidden overflow-clip bg-[#0B0D12] bg-[radial-gradient(80%_60%_at_50%_40%,#161A23_0%,#0B0D12_60%,#06070A_100%)] px-2 py-8 text-[#F6F4EF] sm:min-h-[760px]"
      style={{ fontFamily: FONT }}
    >
      <style>{`
        .brass-knife-switch-root { --a: 0; --lit: 1; --flash: 0; --l0: 1; --l1: 1; --l2: 1; --l3: 1; }
        @media (prefers-reduced-motion: reduce) { .brass-knife-switch-root * { transition: none !important; } }
      `}</style>
      <div ref={stage} className="relative flex w-full max-w-[1000px] justify-center" style={{ height: H * zoom }}>
        <div ref={root} className="brass-knife-switch-root relative shrink-0" style={{ width: W, height: H, zoom }}>
          {/* light the lamps throw up the wall, and the cold flash of the arc */}
          <div aria-hidden="true" className="pointer-events-none absolute" style={{ left: 196, top: -20, width: 800, height: 620, background: "radial-gradient(closest-side,rgba(79,152,251,0.34),rgba(79,152,251,0.1) 55%,rgba(79,152,251,0))", opacity: "var(--lit)" }} />
          <div aria-hidden="true" className="pointer-events-none absolute" style={{ left: JX - 300, top: PY - 300, width: 600, height: 600, background: "radial-gradient(closest-side,rgba(190,220,255,0.3),rgba(79,152,251,0))", opacity: "var(--flash)" }} />
          {/* what the lit globes leave on the dark table in front */}
          <div aria-hidden="true" className="pointer-events-none absolute" style={{ left: LAMP_X[0] - 120, top: BOT + 4, width: LAMP_X[3] - LAMP_X[0] + 240, height: 60, background: "radial-gradient(closest-side,rgba(79,152,251,0.3),rgba(79,152,251,0))", opacity: "var(--lit)" }} />
          <div aria-hidden="true" className="absolute" style={{ left: SX - 30, top: BOT - 6, width: SW + 60, height: 34, background: "radial-gradient(closest-side,rgba(0,0,0,0.9),rgba(0,0,0,0))" }} />

          {/* the slate: riven top, sawn front edge with a chamfer */}
          <div aria-hidden="true" className="absolute overflow-hidden" style={{ left: SX, top: TOP, width: SW, height: BOT - TOP, borderRadius: "5px 5px 4px 4px", background: "#1b1e24", boxShadow: "0 0 0 0.5px #000" }}>
            <div className="absolute inset-x-0 top-0" style={{ height: FACE - TOP, background: "linear-gradient(180deg,#23272e 0%,#31363f 55%,#414752 100%)" }} />
            <div className="absolute inset-x-0" style={{ top: FACE - TOP, bottom: 0, background: "linear-gradient(180deg,#2a2e36 0%,#1f2228 18%,#17191e 70%,#0c0d10 100%)" }} />
            <svg className="absolute inset-0 h-full w-full opacity-[0.42] mix-blend-overlay" preserveAspectRatio="none">
              <filter id="brass-knife-switch-slate" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.018 0.12" numOctaves="5" seed="11" />
                <feDiffuseLighting surfaceScale="1.8" diffuseConstant="1.15" lightingColor="#c8d2e6"><feDistantLight azimuth="260" elevation="48" /></feDiffuseLighting>
              </filter>
              <rect width="100%" height="100%" filter="url(#brass-knife-switch-slate)" />
            </svg>
            <div className="absolute inset-x-0" style={{ top: FACE - TOP - 1, height: 3, background: "linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.08))" }} />
            {/* pools of lamplight on the stone */}
            {LAMP_X.map((x, i) => <div key={x} className="absolute" style={{ left: x - SX - 70, top: 0, width: 140, height: BOT - TOP, background: "radial-gradient(70px 26px at 50% 15px,rgba(214,232,255,0.7),rgba(79,152,251,0.28) 55%,rgba(79,152,251,0)),radial-gradient(66px 44px at 50% 30px,rgba(79,152,251,0.2),rgba(79,152,251,0))", opacity: `var(--l${i})` }} />)}
            {/* engraved maker's plate */}
            <div className="absolute flex items-center justify-center rounded-[2px]" style={{ left: 262, top: FACE - TOP + 12, width: 216, height: 22, background: "linear-gradient(180deg,#e9cd82 0%,#c29a3e 40%,#9a7424 100%)", boxShadow: "inset 0 1px 0 rgba(255,250,220,0.7), inset 0 -1px 0 rgba(50,32,4,0.6), 0 1px 2px rgba(0,0,0,0.7)" }}>
              <Screw left={5} top={7.5} size={7} /><Screw left={204} top={7.5} size={7} />
              <span className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-[#3a2806]" style={{ textShadow: "0 1px 0 rgba(255,244,200,0.7)" }}>{site.address}</span>
            </div>
          </div>

          {/* shadow of the blade on the stone */}
          <div aria-hidden="true" className="absolute" style={{ left: JX - 70, top: FEET - 5, width: BL + 80, height: 12, background: "radial-gradient(closest-side,rgba(0,0,0,0.65),rgba(0,0,0,0))", opacity: "calc(1 - var(--a) * 0.75)", transform: "scaleX(calc(1 - var(--a) * 0.45))", transformOrigin: "100% 50%" }} />

          {/* cloth-covered wire from the switch along the row of holders */}
          <svg aria-hidden="true" className="absolute left-0 top-0" width={W} height={H} style={{ overflow: "visible" }}>
            <path d={wire} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="6" strokeLinecap="round" transform="translate(1.5,3)" />
            <path d={wire} fill="none" stroke="#1d4da6" strokeWidth="5.6" strokeLinecap="round" />
            <path d={wire} fill="none" stroke={BLUE} strokeWidth="3.6" strokeLinecap="round" />
            <path d={wire} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeDasharray="1.6 3.2" transform="translate(0,-1)" />
          </svg>

          {/* back leaves of the hinge and the jaw */}
          {[PX, JX].map((x, i) => (
            <div key={x} aria-hidden="true" className="absolute" style={{ left: x - (i ? 9 : 11), top: PY - (i ? 21 : 15), width: i ? 22 : 26, height: FEET - PY + (i ? 20 : 14), borderRadius: i ? "3px 9px 0 0" : "12px 12px 0 0", background: BRASS_X, filter: "brightness(0.62)" }} />
          ))}

          {/* the blade and its grip, turning on the hinge pin */}
          <div ref={blade} className="absolute" style={{ left: PX, top: PY, width: 0, height: 0, willChange: "transform" }}>
            <div aria-hidden="true" className="absolute" style={{ left: -(BL + 26), top: -6, width: BL + 36, height: 12, borderRadius: "2px 6px 6px 2px", background: BRASS, boxShadow: "0 0 0 0.5px #2e2006, inset 0 1px 0 rgba(255,252,230,0.9)" }}>
              <div className="absolute inset-x-[10px] top-[4px] h-[1px] bg-[rgba(60,40,6,0.28)]" />
            </div>
            <div aria-hidden="true" className="absolute" style={{ left: -(BL + 38), top: -10, width: 16, height: 20, borderRadius: 3, background: BRASS, boxShadow: "0 0 0 0.5px #2e2006, inset 0 1px 0 rgba(255,252,230,0.9)" }}>
              <div className="absolute inset-y-0 left-[4px] w-[1px] bg-[rgba(60,40,6,0.45)]" /><div className="absolute inset-y-0 right-[4px] w-[1px] bg-[rgba(60,40,6,0.45)]" />
            </div>
            <div ref={grip} className="absolute touch-none select-none" style={{ left: -(BL + 128), top: -22, width: 104, height: 44, cursor: "grab" }}>
              {/* turned ebonite grip */}
              <div aria-hidden="true" className="absolute" style={{ left: 8, top: 7, width: 84, height: 30, borderRadius: "15px 9px 9px 15px / 15px 12px 12px 15px", background: "linear-gradient(180deg,#7b8190 0%,#3a3e48 10%,#16181d 32%,#08090b 62%,#23262d 86%,#050506 100%)", boxShadow: "0 0 0 0.5px #000, inset 0 0 0 0.5px rgba(255,255,255,0.12), 0 8px 10px -4px rgba(0,0,0,0.8)" }}>
                <div className="absolute left-[10px] right-[12px] top-[4px] h-[3px] rounded-full" style={{ background: "linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.8) 30%,rgba(255,255,255,0.3) 70%,rgba(255,255,255,0))", filter: "blur(0.6px)" }} />
                {[58, 64, 70].map((x) => <div key={x} className="absolute inset-y-0 w-[2px]" style={{ left: x, background: "linear-gradient(90deg,rgba(0,0,0,0.9),rgba(255,255,255,0.14))" }} />)}
                <div className="absolute inset-x-[8px] bottom-[5px] h-[5px] rounded-full" style={{ background: "linear-gradient(90deg,rgba(79,152,251,0),rgba(79,152,251,0.5),rgba(79,152,251,0))", filter: "blur(2px)", opacity: "var(--lit)" }} />
              </div>
            </div>
          </div>

          {/* front leaves: the blade passes between each pair */}
          <div aria-hidden="true" className="absolute" style={{ left: PX - 13, top: PY - 17, width: 26, height: FEET - PY + 15, borderRadius: "13px 13px 0 0", background: BRASS_X, boxShadow: "0 0 0 0.5px #2e2006, 2px 0 4px rgba(0,0,0,0.5)" }}>
            <span className="absolute left-[5px] top-[9px] h-[16px] w-[16px] rounded-full" style={{ background: "radial-gradient(circle at 36% 30%,#fffbe2,#d2aa4c 42%,#5a3f0d)", boxShadow: "0 1.5px 2px rgba(0,0,0,0.7), 0 0 0 0.5px #2e2006" }} />
          </div>
          <div aria-hidden="true" className="absolute" style={{ left: JX - 11, top: PY - 23, width: 22, height: FEET - PY + 21, borderRadius: "9px 3px 0 0", clipPath: "polygon(0 0,34% 0,50% 9px,66% 0,100% 0,100% 100%,0 100%)", background: BRASS_X, boxShadow: "0 0 0 0.5px #2e2006" }}>
            <div className="absolute inset-x-[4px] top-[20px] h-[14px] rounded-[2px]" style={{ background: "linear-gradient(180deg,rgba(60,40,6,0.4),rgba(255,250,220,0.3))" }} />
          </div>
          {/* feet, fixing screws and knurled terminals */}
          {[PX, JX].map((x, i) => (
            <div key={x} aria-hidden="true" className="absolute" style={{ left: x - (i ? 44 : 22), top: FEET - 6, width: 66, height: 8, borderRadius: 2, background: BRASS, boxShadow: "0 0 0 0.5px #2e2006, 0 3px 4px rgba(0,0,0,0.7)" }}>
              <div className="absolute" style={{ left: i ? 2 : 46, top: -14, width: 18, height: 14, borderRadius: "3px 3px 1px 1px", background: "repeating-linear-gradient(90deg,#fff0bb 0 1px,#b98d30 1px 2.4px,#6b4c12 2.4px 3.4px)", boxShadow: "0 0 0 0.5px #2e2006, inset 0 2px 0 rgba(255,250,220,0.5), inset 0 -3px 3px rgba(40,26,2,0.6)" }} />
              <div className="absolute" style={{ left: i ? 7 : 51, top: -19, width: 8, height: 6, borderRadius: "2px 2px 0 0", background: BRASS_X }} />
            </div>
          ))}
          <canvas ref={sparks} aria-hidden="true" className="pointer-events-none absolute" style={{ left: JX - 130, top: PY - 126, width: 260, height: 260 }} />

          {/* four opal globes in porcelain holders */}
          <div role="img" aria-label={live ? "Four lamps lit, spelling live" : "Four lamps, unlit"}>
            {LAMPS.map((ch, i) => (
              <div key={ch} className="absolute" style={{ left: LAMP_X[i], top: FEET }}>
                <div className="absolute" style={{ left: -34, top: -3, width: 68, height: 10, background: "radial-gradient(closest-side,rgba(0,0,0,0.7),rgba(0,0,0,0))" }} />
                <div className="absolute" style={{ left: -25, top: -24, width: 50, height: 24, borderRadius: "7px 7px 4px 4px / 8px 8px 4px 4px", background: "linear-gradient(90deg,#6d6f76 0%,#c9c8c2 18%,#fbfaf5 38%,#ffffff 46%,#dcdad2 66%,#9a9b9f 88%,#55575e 100%)", boxShadow: "inset 0 -5px 6px rgba(20,24,40,0.35), inset 0 2px 1px rgba(255,255,255,0.9), 0 0 0 0.5px #000", filter: `brightness(calc(0.5 + 0.5 * var(--l${i})))` }}>
                  <div className="absolute inset-x-0 top-[9px] h-[1.5px] bg-[rgba(20,24,40,0.22)]" />
                </div>
                <div className="absolute" style={{ left: -16, top: -37, width: 32, height: 14, borderRadius: "3px 3px 1px 1px", background: "repeating-linear-gradient(180deg,rgba(60,40,6,0) 0 3px,rgba(60,40,6,0.45) 3px 4px),linear-gradient(90deg,#4f370a 0%,#a67a22 16%,#f1d587 36%,#fff4c8 44%,#d2a846 58%,#8c661a 82%,#402c07 100%)", boxShadow: "0 0 0 0.5px #2e2006" }} />
                <div className="absolute rounded-full" style={{ left: -32, top: -98, width: 64, height: 64, background: "radial-gradient(circle at 34% 27%,#dfe3ea 0%,#b4bac6 16%,#878e9c 44%,#5c6372 72%,#353b48 100%)", boxShadow: "0 0 0 0.5px #000, inset -6px -8px 12px rgba(10,12,20,0.5)" }}>
                  <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 50% 56%,#ffffff 0%,#f4f9ff 34%,#c4deff 62%,#7db4ff 86%,#4F98FB 100%)", boxShadow: "0 0 18px 4px rgba(79,152,251,0.85), 0 0 60px 18px rgba(79,152,251,0.42), 0 0 130px 46px rgba(79,152,251,0.2)", opacity: `var(--l${i})` }} />
                  <div className="absolute inset-0 flex items-center justify-center text-[31px] font-black leading-none tracking-[-0.02em] text-[#0B0D12]" style={{ opacity: 0.9 }}>{ch}</div>
                  <div className="absolute left-[11px] top-[7px] h-[14px] w-[22px] rounded-full" style={{ background: "radial-gradient(closest-side,rgba(255,255,255,0.85),rgba(255,255,255,0))", transform: "rotate(-32deg)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-2 flex items-center gap-[12px]">
        <span className="flex h-[30px] items-center gap-[8px] rounded-full bg-[#F6F4EF]/[0.08] pl-[10px] pr-[13px] text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#F6F4EF]">
          <span aria-hidden="true" className="h-[9px] w-[9px] rounded-full" style={{ background: live ? BLUE : "#5b6170", boxShadow: live ? "0 0 0 4px rgba(79,152,251,0.25)" : "none" }} />
          {live ? "Live" : "Draft"}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={live}
          onClick={() => api.current?.set(!live)}
          className="flex h-[52px] items-center rounded-full bg-[#F6F4EF] px-[26px] text-[15px] font-extrabold tracking-[-0.01em] text-[#0B0D12] shadow-[inset_0_-3px_0_rgba(11,13,18,0.14),0_18px_30px_-14px_rgba(0,0,0,0.9)] outline-none transition-transform duration-150 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12] motion-reduce:transition-none"
        >
          {live ? "Open the switch" : "Throw the switch"}
        </button>
      </div>
      <p aria-live="polite" className="mt-[12px] text-center text-[12px] font-semibold tracking-[-0.005em] text-[#F6F4EF]/75">
        {live ? `${site.name} is live: blade home, all four lamps lit` : "Draft: blade up, circuit open, lamps dark"}
      </p>
    </div>
  );
}
