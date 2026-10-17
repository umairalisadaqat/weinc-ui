import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const DUST = 6; // specks shed per frame of movement
const MAX = 500; // speck pool size
const RGB = "240,237,228"; // chalk colour
const menu = [
  { dish: "Leek and potato soup, sourdough", price: "7" },
  { dish: "Smoked mackerel, beetroot, horseradish", price: "11" },
  { dish: "Mushrooms on toast, thyme butter", price: "9" },
  { dish: "Pear and almond tart, cream", price: "6" },
];
const hand = { fontFamily: '"Chalkboard SE", "Segoe Print", Georgia, serif' };

export default function ChalkDustCursorTrailOnASlateMenuBoard() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current, board = boardRef.current, cv = cvRef.current;
    if (!root || !board || !cv || reduce) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = new Float32Array(MAX), py = new Float32Array(MAX), vx = new Float32Array(MAX), vy = new Float32Array(MAX), life = new Float32Array(MAX), sz = new Float32Array(MAX);
    let W = 0, H = 0, n = 0, hx = -1, hy = -1, tx = 0, ty = 0, live = false, frame = 0, idle = 0, vis = true;
    const t0 = performance.now();
    const size = () => { W = board.clientWidth; H = board.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const add = (x: number, y: number, spread: number) => {
      const i = n++ % MAX;
      px[i] = x + (Math.random() - 0.5) * spread; py[i] = y + (Math.random() - 0.5) * spread;
      vx[i] = (Math.random() - 0.5) * 0.5; vy[i] = Math.random() * 0.4; life[i] = 1; sz[i] = 0.6 + Math.random() * 1.8;
    };
    const loop = (now: number) => {
      let alive = 0;
      if (fine) {
        if (!live) {
          const t = (now - t0) / 1000;
          tx = W * (0.66 + 0.2 * Math.sin(t * 0.7)) + 28 * Math.cos(t * 4.2);
          ty = H * (0.5 + 0.26 * Math.sin(t * 1.1)) + 22 * Math.sin(t * 4.2);
        }
        if (hx < 0) { hx = tx; hy = ty; }
        const dx = tx - hx, dy = ty - hy, d = Math.min(1, Math.hypot(dx, dy) / 6);
        for (let k = 0; k < DUST * d; k++) { const f = Math.random(); add(hx + dx * f, hy + dy * f, 6); }
        hx = tx; hy = ty;
      }
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < MAX; i++) {
        if (life[i] <= 0) continue;
        alive++;
        vy[i] += 0.03; px[i] += vx[i]; py[i] += vy[i]; life[i] -= 0.01;
        ctx.fillStyle = `rgba(${RGB},${life[i] * 0.8})`;
        ctx.fillRect(px[i], py[i], sz[i], sz[i]);
      }
      frame = vis && (fine || alive) ? requestAnimationFrame(loop) : 0;
    };
    const start = () => { if (!frame && vis) frame = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const at = (e: PointerEvent) => { const r = board.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; };
    // Touch: each tap knocks a small puff of dust off the board.
    const onTap = (e: PointerEvent) => { at(e); for (let k = 0; k < 40; k++) add(tx, ty, 18); start(); };
    const onMove = (e: PointerEvent) => { if (e.pointerType !== "touch") { at(e); live = true; clearTimeout(idle); root.removeAttribute("data-kb"); } };
    const onLeave = () => { idle = window.setTimeout(() => { live = false; hx = -1; }, 1500); };
    const onFocus = () => { if (root.querySelector(":focus-visible")) root.setAttribute("data-kb", ""); };
    const onBlur = () => root.removeAttribute("data-kb");
    size();
    const ro = new ResizeObserver(size);
    ro.observe(board);
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && fine) start(); else stop(); });
    io.observe(root);
    if (fine) {
      board.addEventListener("pointermove", onMove);
      board.addEventListener("pointerleave", onLeave);
      root.addEventListener("focusin", onFocus);
      root.addEventListener("focusout", onBlur);
    } else board.addEventListener("pointerdown", onTap);
    return () => {
      stop(); io.disconnect(); ro.disconnect(); clearTimeout(idle);
      board.removeEventListener("pointermove", onMove);
      board.removeEventListener("pointerleave", onLeave);
      board.removeEventListener("pointerdown", onTap);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", onBlur);
    };
  }, [reduce]);

  return (
    <section ref={rootRef} className="w2chk-root bg-[#d9cfbf] px-4 py-10 sm:px-10 sm:py-14">
      <style>{`
        .w2chk-cv { transition: opacity .4s ease; }
        .w2chk-root[data-kb] .w2chk-cv { opacity: 0; }
        @media (prefers-reduced-motion: reduce) { .w2chk-cv { display: none; } }
      `}</style>
      <div
        ref={boardRef}
        className="relative mx-auto max-w-[60rem] overflow-hidden rounded-md border-[12px] border-[#7b5a3c] text-[#f0ede4] shadow-[inset_0_0_0_1px_rgba(0,0,0,.35),inset_0_0_60px_rgba(0,0,0,.45),0_24px_50px_-24px_rgba(40,28,16,.6)]"
        style={{ background: "radial-gradient(40% 30% at 70% 30%, rgba(255,255,255,.06), transparent 70%), radial-gradient(30% 25% at 20% 80%, rgba(255,255,255,.05), transparent 70%), #2c3633" }}
      >
        <canvas ref={cvRef} className="w2chk-cv pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
        <div className="relative px-6 pb-10 pt-9 sm:px-14 sm:pb-[52px] sm:pt-12">
          <p className="text-xs uppercase tracking-[0.24em] text-[#cfd8d2]">Corner Table, Mill Street</p>
          <h2 className="mt-3 text-[clamp(2rem,5vw,3.2rem)] font-normal italic leading-[1.1] [text-shadow:0_0_1px_rgba(240,237,228,.6)]" style={hand}>On the board today</h2>
          <ul className="mt-6 max-w-lg">
            {menu.map((m) => (
              <li key={m.dish} className="flex items-baseline justify-between gap-4 border-b border-dashed border-[#f0ede4]/30 py-2.5 text-[17px]" style={hand}>
                <span>{m.dish}</span>
                <b className="text-xl font-normal">{m.price}</b>
              </li>
            ))}
          </ul>
          <a href="#" className="mt-7 inline-flex min-h-[44px] items-center rounded border-2 border-[#f0ede4] px-5 text-sm font-semibold hover:bg-[#f0ede4]/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#f2c94c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2c3633]">Book a table for lunch</a>
        </div>
      </div>
    </section>
  );
}
