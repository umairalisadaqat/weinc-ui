import { useEffect, useRef, useState } from "react";

// The site in the window. An invented bakery.
const site = {
  name: "Oat Street Bakery",
  links: ["Bread", "Pastry", "Find us"],
  headline: "Bread out of the oven at seven.",
  copy: "Sourdough, rye and seeded loaves, baked through the night on Oat Street.",
  cta: "See today's bake",
  photo: "https://images.pexels.com/photos/30884563/pexels-photo-30884563.jpeg?auto=compress&cs=tinysrgb&w=1200",
};
const STENCIL = "DRAFT"; // painted on the shutter
const BLUE = "#4F98FB";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const W = 640; // width of the shutter box
const OW = 584, OH = 420; // the window opening
const SLAT = 24; // height of one slat
const TRAVEL = OH - 22; // the bottom rail stays in sight under the box
const HOLD = 9000; // how long the demo stays open before pulling the shutter down again

type Api = { set: (open: boolean) => void };

export default function SteelRollerShutter() {
  const stage = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const [zoom, setZoom] = useState(1);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const st = stage.current, el = root.current, cur = curtain.current;
    if (!st || !el || !cur) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = () => Math.max(0.46, Math.min(1.08, (st.clientWidth - 16) / (W + 36)));
    const fit = () => setZoom(scale());
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(st);

    // p: 0 shut, 1 fully rolled up. lit: how bright the shop lights are.
    const s = { p: reduce ? 1 : 0, v: 0, to: reduce ? 1 : 0, drag: false, grabY: 0, grabP: 0, lastY: 0, lastT: 0, on: reduce, onAt: -1e9, lit: reduce ? 1 : 0, shake: 0, touched: -1e9, live: false };
    const paint = () => {
      el.style.setProperty("--p", s.p.toFixed(4));
      el.style.setProperty("--lit", s.lit.toFixed(3));
      cur.style.transform = `translate(${s.shake.toFixed(2)}px, ${(-s.p * TRAVEL).toFixed(2)}px)`;
    };
    const tell = () => { const now = s.to === 1; if (now !== s.live) { s.live = now; setLive(now); } };

    let raf = 0, last = 0, seen = true, timer = 0, begin = () => {};
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.max(0.004, Math.min(0.032, (now - last) / 1000 || 0.016)); last = now;
      if (!s.drag) {
        // sprung roller going up, dead weight coming down, and a stop at each end that it bounces off
        const pull = s.to === 1 ? 13 * (1.08 - s.p) + 1 : -5.5 - 16 * s.p;
        s.v += (pull - 3.4 * s.v) * dt; s.p += s.v * dt;
        if (s.p > 1) { s.p = 1; if (s.v > 0.25) s.shake = 2.6; s.v = s.v > 0.3 ? -s.v * 0.24 : 0; }
        if (s.p < 0) { s.p = 0; if (s.v < -0.25) s.shake = 3.4; s.v = s.v < -0.3 ? -s.v * 0.2 : 0; }
      }
      s.shake *= -0.72; if (Math.abs(s.shake) < 0.08) s.shake = 0;
      // the tubes inside catch a moment after the shutter clears them, and go out when it shuts
      if (!s.on && s.p > 0.1) { s.on = true; s.onAt = now; }
      if (s.on && s.p < 0.015 && s.to === 0) s.on = false;
      const t = now - s.onAt;
      s.lit = !s.on ? 0 : t < 70 ? 0.55 : t < 150 ? 0.08 : t < 230 ? 0.8 : t < 320 ? 0.3 : t < 380 ? 0.9 : 1;
      paint();
      const rest = !s.drag && s.shake === 0 && Math.abs(s.v) < 0.004 && (s.p === 0 || s.p === 1 || Math.abs(s.p - s.to) < 0.001) && (!s.on || t > 400);
      if (rest) return;
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const go = (open: boolean) => {
      s.to = open ? 1 : 0; tell();
      if (reduce) { s.p = s.to; s.on = open; s.lit = open ? 1 : 0; paint(); return; }
      s.v += open ? 0.5 : -0.2; wake();
    };
    api.current = { set: (open) => { s.touched = performance.now(); go(open); } };

    const down = (e: PointerEvent) => {
      if (reduce) return;
      s.drag = true; s.touched = performance.now(); s.grabY = e.clientY; s.grabP = s.p; s.lastY = e.clientY; s.lastT = performance.now(); s.v = 0;
      cur.setPointerCapture(e.pointerId); wake();
    };
    const move = (e: PointerEvent) => {
      if (!s.drag) return;
      const now = performance.now(), next = Math.max(0, Math.min(1, s.grabP - (e.clientY - s.grabY) / (TRAVEL * scale())));
      s.v = ((next - s.p) / Math.max(0.008, (now - s.lastT) / 1000)) * 0.5; s.p = next; s.lastT = now;
    };
    const up = () => {
      if (!s.drag) return;
      s.drag = false; s.touched = performance.now();
      s.v = Math.max(-2.5, Math.min(2.5, s.v));
      s.to = s.v > 0.5 || (s.v > -0.5 && s.p > 0.4) ? 1 : 0; tell(); wake();
    };
    cur.addEventListener("pointerdown", down);
    cur.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    paint(); tell();
    if (reduce) { s.to = 1; tell(); }
    else {
      // The demo: up, hold, down, wait. It stands down while someone is using the shutter.
      const loop = (wait: number, open: boolean) => { timer = window.setTimeout(() => { if (seen && !document.hidden && performance.now() - s.touched > 8000) go(open); loop(open ? HOLD : 2400, !open); }, wait); };
      // wait for the photograph, so the first thing anyone sees open is a finished window
      begin = () => loop(380, true);
      if (document.readyState === "complete") begin(); else window.addEventListener("load", begin, { once: true });
    }
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen && (s.p !== s.to || s.drag)) wake(); });
    io.observe(st);
    const vis = () => { if (!document.hidden && s.p !== s.to) wake(); };
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(raf); window.clearTimeout(timer); window.removeEventListener("load", begin); api.current = null;
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", vis);
      cur.removeEventListener("pointerdown", down); cur.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
    };
  }, []);

  const BW = W + 36, BH = 56 + OH + 16 + 84; // box the whole shopfront is laid out in
  const L = (BW - OW) / 2; // left edge of the opening

  return (
    <div
      className="relative flex min-h-[560px] w-full flex-col items-center justify-center overflow-hidden bg-[#0B0D12] bg-[radial-gradient(80%_60%_at_50%_30%,#171B24_0%,#0B0D12_60%,#06070A_100%)] px-2 py-8 text-[#F6F4EF] sm:min-h-[800px]"
      style={{ fontFamily: FONT }}
    >
      <style>{`
        .steel-roller-shutter-root { --p: 0; --lit: 0; }
        @media (prefers-reduced-motion: reduce) { .steel-roller-shutter-root { --p: 1; --lit: 1; } }
      `}</style>
      <div ref={stage} className="relative flex w-full max-w-[1000px] justify-center" style={{ height: BH * zoom }}>
        <div ref={root} className="steel-roller-shutter-root relative shrink-0" style={{ width: BW, height: BH, zoom }}>
          {/* light the open shop throws on the wall round it and on the pavement */}
          <div aria-hidden="true" className="pointer-events-none absolute" style={{ left: L - 150, top: -40, width: OW + 300, height: OH + 220, background: "radial-gradient(closest-side,rgba(255,226,170,0.2),rgba(255,226,170,0.05) 60%,rgba(255,226,170,0))", opacity: "calc(var(--p) * var(--lit))" }} />
          <div aria-hidden="true" className="pointer-events-none absolute" style={{ left: L - 90, top: 56 + OH + 16, width: OW + 180, height: 84, clipPath: "polygon(15% 0,85% 0,100% 100%,0 100%)", background: "linear-gradient(180deg,rgba(255,232,186,0.5),rgba(255,232,186,0.12) 55%,rgba(255,232,186,0))", filter: "blur(5px)", opacity: "calc(var(--p) * var(--lit))" }} />

          {/* the window: plate glass with the site standing in it */}
          <div className="absolute overflow-hidden bg-[#14110c]" style={{ left: L, top: 50, width: OW, height: OH + 6 }}>
            <div role="img" aria-label={`The ${site.name} homepage on show in a shop window`} className="absolute inset-0 bg-[#F6F4EF] text-[#0B0D12]">
              <div className="absolute left-[26px] right-[26px] top-[36px] flex h-[34px] items-center justify-between">
                <span className="flex items-center gap-[7px] whitespace-nowrap text-[14px] font-extrabold tracking-[-0.03em]"><span className="h-[10px] w-[10px] rounded-full" style={{ background: BLUE }} />{site.name}</span>
                <span className="flex gap-[18px] text-[11.5px] font-bold text-[#0B0D12]/70">{site.links.map((l) => <span key={l}>{l}</span>)}</span>
              </div>
              <div className="absolute left-[26px] top-[112px] w-[262px] text-[45px] font-extrabold leading-[0.95] tracking-[-0.05em]">{site.headline}</div>
              <div className="absolute left-[26px] top-[264px] w-[240px] text-[13px] font-semibold leading-[1.38] text-[#0B0D12]/70">{site.copy}</div>
              <div className="absolute left-[26px] top-[338px] flex h-[42px] items-center rounded-full bg-[#0B0D12] px-[20px] text-[13.5px] font-extrabold tracking-[-0.01em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_16px_-10px_rgba(11,13,18,0.7)]"><span className="mr-[8px] h-[7px] w-[7px] rounded-full" style={{ background: BLUE }} />{site.cta}</div>
              <div className="absolute right-[22px] top-[84px] h-[312px] w-[250px] overflow-hidden rounded-[18px] bg-[#8a5a2b]">
                <img src={site.photo} alt="" width={1200} height={800} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: "30% 40%" }} />
              </div>
            </div>
            {/* warm tubes overhead, the dark before they catch, and the street in the glass */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(255,214,150,0.3) 0%,rgba(255,214,150,0.06) 30%,rgba(255,214,150,0) 55%,rgba(40,24,6,0.1) 100%)", mixBlendMode: "multiply" }} />
            <div className="absolute inset-0 bg-[#07080b]" style={{ opacity: "calc(0.94 - var(--lit) * 0.94)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(104deg,rgba(255,255,255,0) 18%,rgba(190,214,255,0.16) 30%,rgba(255,255,255,0.03) 37%,rgba(255,255,255,0) 52%,rgba(190,214,255,0.1) 70%,rgba(255,255,255,0) 82%)" }} />
            <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 2px #0a0b0e, inset 0 0 0 5px #2b2f36, inset 0 0 0 6px #0a0b0e, inset 0 26px 30px -18px rgba(0,0,0,0.75)" }} />

            {/* the shutter curtain */}
            <div ref={curtain} className="absolute left-0 top-0 touch-none select-none" style={{ width: OW, height: OH + 6, cursor: "grab", willChange: "transform" }}>
              <div className="absolute inset-x-0 top-0" style={{ height: OH - 22, backgroundColor: "#565b63", backgroundImage: `repeating-linear-gradient(180deg,#2c3037 0px,#a7adb5 2px,#8a9098 5px,#6b7179 11px,#4d525a 17px,#2a2d33 20.5px,#0b0c0f 22px,#08090b 23px,#2c3037 ${SLAT}px)` }}>
                {/* wear: long streaks, a soft sheen, and the shadow of the box above */}
                <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "repeating-linear-gradient(90deg,rgba(255,255,255,0) 0 31px,rgba(255,255,255,0.05) 31px 33px,rgba(255,255,255,0) 33px 71px,rgba(0,0,0,0.1) 71px 74px,rgba(255,255,255,0) 74px 113px),linear-gradient(100deg,rgba(255,255,255,0) 20%,rgba(200,220,255,0.13) 38%,rgba(255,255,255,0) 54%,rgba(0,0,0,0.14) 100%)" }} />
                <div aria-hidden="true" className="absolute inset-x-0 flex items-center justify-center" style={{ top: 96, height: 168, WebkitMaskImage: `repeating-linear-gradient(180deg,#000 0 18px,rgba(0,0,0,0.35) 18px ${SLAT}px)`, maskImage: `repeating-linear-gradient(180deg,#000 0 18px,rgba(0,0,0,0.35) 18px ${SLAT}px)` }}>
                  <span className="text-[136px] font-black leading-none tracking-[0.02em]" style={{ color: "rgba(246,244,239,0.86)", textShadow: "0 1px 0 rgba(0,0,0,0.35)" }}>{STENCIL}</span>
                </div>
              </div>
              {/* bottom rail with a pull handle and two shoot bolts */}
              <div className="absolute inset-x-0" style={{ top: OH - 22, height: 24, background: "linear-gradient(180deg,#c3c8ce 0%,#8d939b 18%,#5d626a 55%,#383c43 86%,#17191d 100%)", boxShadow: "0 8px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                <div className="absolute left-1/2 top-[6px] h-[12px] w-[92px] -translate-x-1/2 rounded-full" style={{ background: "linear-gradient(180deg,#0a0b0d,#2a2d33)", boxShadow: "inset 0 2px 3px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.45)" }} />
                {[18, OW - 30].map((x) => <span key={x} className="absolute top-[6px] h-[12px] w-[12px] rounded-full" style={{ left: x, background: "radial-gradient(circle at 36% 30%,#f2f4f6,#8a9098 45%,#2e3238)", boxShadow: "0 1px 1px rgba(0,0,0,0.7)" }} />)}
              </div>
              <div className="absolute inset-x-0 bg-[#050608]" style={{ top: OH + 2, height: 4 }} />
            </div>
          </div>

          {/* guide rails, sill and the box the shutter rolls into */}
          {[L - 14, L + OW - 2].map((x) => (
            <div key={x} aria-hidden="true" className="absolute" style={{ left: x, top: 50, width: 16, height: OH + 8, background: "linear-gradient(90deg,#1c1f24 0%,#8e949c 22%,#5a5f67 48%,#30343a 70%,#9197a0 86%,#22252a 100%)", boxShadow: "0 0 0 0.5px #000, 4px 0 8px -2px rgba(0,0,0,0.5)" }} />
          ))}
          <div aria-hidden="true" className="absolute" style={{ left: L - 26, top: 56 + OH, width: OW + 52, height: 16, background: "linear-gradient(180deg,#3a3d44 0%,#24262b 40%,#101114 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 14px rgba(0,0,0,0.6)" }}>
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(255,226,170,0.55),rgba(255,226,170,0.1))", opacity: "calc(var(--p) * var(--lit))" }} />
          </div>
          <div aria-hidden="true" className="absolute rounded-[5px]" style={{ left: (BW - W) / 2, top: 0, width: W, height: 56, background: "linear-gradient(180deg,#6d737b 0%,#aeb4bc 7%,#858b93 20%,#5b6068 48%,#3a3e45 82%,#1e2025 100%)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.75), inset 0 1.5px 0 rgba(255,255,255,0.5), 0 14px 20px -4px rgba(0,0,0,0.75)" }}>
            <div className="absolute inset-0 rounded-[5px] opacity-50" style={{ backgroundImage: "repeating-linear-gradient(0deg,rgba(255,255,255,0.1) 0 1px,rgba(0,0,0,0.12) 1px 2px)" }} />
            {[0, W - 22].map((x) => <div key={x} className="absolute top-0 h-full w-[22px]" style={{ left: x, background: "linear-gradient(90deg,rgba(0,0,0,0.35),rgba(255,255,255,0.14) 40%,rgba(0,0,0,0.4))", borderRadius: 5 }} />)}
            {[34, 220, W - 232, W - 46].map((x) => <span key={x} className="absolute top-[10px] h-[7px] w-[7px] rounded-full" style={{ left: x, background: "radial-gradient(circle at 36% 30%,#f2f4f6,#737981 55%,#22252a)", boxShadow: "0 1px 1px rgba(0,0,0,0.8)" }} />)}
            {/* pilot lamp: dark while the site is a draft, blue once it is open */}
            <div className="absolute left-1/2 top-[15px] flex h-[26px] -translate-x-1/2 items-center gap-[9px] rounded-full bg-[#0b0c0f] pl-[8px] pr-[13px]" style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.3)" }}>
              <span className="relative block h-[12px] w-[12px] rounded-full" style={{ background: "radial-gradient(circle at 36% 30%,#3a4352,#12151b 70%)", boxShadow: "inset 0 0 0 1px #000" }}>
                <span className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 36% 30%,#ffffff 0%,#a9d0ff 22%,#4F98FB 55%,#1f63c8 100%)", boxShadow: "0 0 10px 3px rgba(79,152,251,0.75), 0 0 28px 10px rgba(79,152,251,0.3)", opacity: "calc(var(--p) * var(--lit))" }} />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: live ? "#F6F4EF" : "rgba(246,244,239,0.62)" }}>{live ? "Live" : "Draft"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-1 flex items-center gap-[10px]">
        <button
          type="button"
          aria-pressed={live}
          onClick={() => api.current?.set(!live)}
          className="flex h-[52px] items-center gap-[10px] rounded-full bg-[#F6F4EF] pl-[20px] pr-[24px] text-[15px] font-extrabold tracking-[-0.01em] text-[#0B0D12] shadow-[inset_0_-3px_0_rgba(11,13,18,0.14),0_18px_30px_-14px_rgba(0,0,0,0.9)] outline-none transition-transform duration-150 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12] motion-reduce:transition-none"
        >
          <span aria-hidden="true" className="h-[9px] w-[9px] rounded-full" style={{ background: live ? BLUE : "#0B0D12", boxShadow: live ? "0 0 0 4px rgba(79,152,251,0.25)" : "none" }} />
          {live ? "Back to draft" : "Go live"}
        </button>
      </div>
      <p aria-live="polite" className="mt-[12px] text-center text-[12px] font-semibold tracking-[-0.005em] text-[#F6F4EF]/75">
        {live ? `${site.name}: shutter up, lights on, open to the street` : "Draft: finished inside, shutter still down"}
      </p>
    </div>
  );
}
