import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const GRID = 8; // snap step in px
const BIG = 40; // arrow-key step with Shift held
const blocks = [
  { l: 8, t: 8, w: 30, h: 6, o: 1 },
  { l: 62, t: 8, w: 30, h: 6, o: 0.5 },
  { l: 8, t: 22, w: 50, h: 44, o: 1, img: true },
  { l: 62, t: 22, w: 30, h: 4, o: 1 },
  { l: 62, t: 30, w: 26, h: 4, o: 0.5 },
  { l: 62, t: 38, w: 28, h: 4, o: 0.5 },
  { l: 62, t: 54, w: 20, h: 9, o: 1, cta: true },
  { l: 8, t: 74, w: 84, h: 4, o: 0.4 },
  { l: 8, t: 82, w: 60, h: 4, o: 0.4 },
];
const keys: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

export default function PrecisionCrosshairCursorWithLiveCoordinateReadout() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const srRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = rootRef.current, board = boardRef.current, sr = srRef.current;
    if (!root || !board || !sr) return;
    const q = (s: string) => root.querySelector<HTMLElement>(s)!;
    const h = q(".w2crs-h"), v = q(".w2crs-v"), c = q(".w2crs-c"), tag = q(".w2crs-tag"), mx = q(".w2crs-mx"), my = q(".w2crs-my");
    // No idle drift for reduced motion or touch screens: the crosshair rests until moved.
    const still = reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches;
    let X = 0, Y = 0, live = false, frame = 0, idle = 0;
    const t0 = performance.now();
    const set = (x: number, y: number) => {
      const W = board.clientWidth, H = board.clientHeight;
      X = Math.max(0, Math.min(W - 1, Math.round(x / GRID) * GRID));
      Y = Math.max(0, Math.min(H - 1, Math.round(y / GRID) * GRID));
      h.style.transform = my.style.transform = `translateY(${Y}px)`;
      v.style.transform = mx.style.transform = `translateX(${X}px)`;
      c.style.transform = `translate(${X}px, ${Y}px)`;
      tag.textContent = `X ${X}  Y ${Y}`;
      tag.style.transform = `translate(${X > W - 120 ? X - 104 : X + 12}px, ${Y > H - 40 ? Y - 30 : Y + 12}px)`;
    };
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      set(board.clientWidth * (0.5 + 0.36 * Math.sin(t * 0.45)), board.clientHeight * (0.5 + 0.34 * Math.sin(t * 0.8 + 0.6)));
      frame = requestAnimationFrame(loop);
    };
    const start = () => { if (!frame && !live && !still) frame = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const take = () => { live = true; stop(); clearTimeout(idle); };
    const at = (e: PointerEvent) => { const r = board.getBoundingClientRect(); take(); set(e.clientX - r.left, e.clientY - r.top); };
    const onMove = (e: PointerEvent) => { board.setAttribute("data-live", ""); at(e); };
    const onLeave = () => { board.removeAttribute("data-live"); idle = window.setTimeout(() => { live = false; start(); }, 2000); };
    // Keyboard: arrows nudge the crosshair along the grid, and the new position is announced.
    const onKey = (e: KeyboardEvent) => {
      const d = keys[e.key];
      if (!d) return;
      e.preventDefault(); take();
      const s = e.shiftKey ? BIG : GRID;
      set(X + d[0] * s, Y + d[1] * s);
      sr.textContent = `X ${X}, Y ${Y}`;
    };
    set(board.clientWidth * 0.62, board.clientHeight * 0.4);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(root);
    board.addEventListener("pointermove", onMove);
    board.addEventListener("pointerdown", at);
    board.addEventListener("pointerleave", onLeave);
    board.addEventListener("keydown", onKey);
    return () => {
      stop(); io.disconnect(); clearTimeout(idle);
      board.removeEventListener("pointermove", onMove);
      board.removeEventListener("pointerdown", at);
      board.removeEventListener("pointerleave", onLeave);
      board.removeEventListener("keydown", onKey);
    };
  }, [reduce]);

  const tick = (dir: string) => `repeating-linear-gradient(${dir}, #5a5c63 0 1px, transparent 1px 8px), repeating-linear-gradient(${dir}, #8a8c93 0 1px, transparent 1px 64px)`;

  return (
    <section ref={rootRef} className="bg-[#1b1c1f] px-5 py-14 text-[#ececea] sm:px-10 sm:py-[72px]">
      <style>{`
        .w2crs-h, .w2crs-v, .w2crs-c, .w2crs-tag { position: absolute; left: 0; top: 0; pointer-events: none; will-change: transform; }
        @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) { .w2crs-board[data-live] { cursor: none; } }
      `}</style>
      <div className="mx-auto grid max-w-6xl items-center gap-10 min-[900px]:grid-cols-[22rem_1fr] min-[900px]:gap-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f08a74]">Gridwell</p>
          <h2 className="mt-3.5 text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold leading-[1.12] tracking-tight">Place every element to the pixel, then forget about it.</h2>
          <p className="mt-4 leading-relaxed text-[#b9bab6]">A layout tool for print and screen with an 8 point grid, true rulers and guides that stay where you put them.</p>
          <a href="#" className="mt-7 inline-flex min-h-[44px] items-center rounded-md bg-[#ececea] px-5 text-sm font-semibold text-[#1b1c1f] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb4ff] focus-visible:ring-offset-4 focus-visible:ring-offset-[#1b1c1f]">Start a blank board</a>
        </div>
        <div className="relative pl-5 pt-5">
          <div aria-hidden="true" className="absolute left-5 right-0 top-0 h-5 overflow-hidden bg-[#26272b] bg-repeat-x" style={{ backgroundImage: tick("90deg"), backgroundSize: "100% 6px, 100% 12px", backgroundPosition: "0 100%, 0 100%" }}>
            <span className="w2crs-mx absolute left-0 top-0 h-5 w-px bg-[#c03d1f]" />
          </div>
          <div aria-hidden="true" className="absolute bottom-0 left-0 top-5 w-5 overflow-hidden bg-[#26272b] bg-repeat-y" style={{ backgroundImage: tick("180deg"), backgroundSize: "6px 100%, 12px 100%", backgroundPosition: "100% 0, 100% 0" }}>
            <span className="w2crs-my absolute left-0 top-0 h-px w-5 bg-[#c03d1f]" />
          </div>
          <div
            ref={boardRef}
            tabIndex={0}
            role="group"
            aria-label="Sample artboard. Arrow keys move the crosshair by 8 pixels, hold Shift for 40."
            className="w2crs-board relative h-[380px] overflow-hidden rounded-sm bg-[#f4f4f1] bg-[length:8px_8px] bg-[linear-gradient(rgba(0,0,0,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.05)_1px,transparent_1px)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fb4ff] focus-visible:ring-offset-4 focus-visible:ring-offset-[#1b1c1f]"
          >
            <div aria-hidden="true">
              {blocks.map((b, i) => (
                <i
                  key={i}
                  className={`absolute ${b.cta ? "rounded-full bg-[#2b2c30]" : b.img ? "rounded-[3px] bg-gradient-to-br from-[#b9c3c9] to-[#8f9ca5]" : "rounded-[3px] bg-[#c9cac4]"}`}
                  style={{ left: `${b.l}%`, top: `${b.t}%`, width: `${b.w}%`, height: `${b.h}%`, opacity: b.o }}
                />
              ))}
            </div>
            <span aria-hidden="true" className="w2crs-h h-px w-full bg-[#c03d1f]" />
            <span aria-hidden="true" className="w2crs-v h-full w-px bg-[#c03d1f]" />
            <span aria-hidden="true" className="w2crs-c -ml-[5px] -mt-[5px] h-[11px] w-[11px] border border-[#c03d1f] bg-[#f4f4f1]" />
            <span aria-hidden="true" className="w2crs-tag whitespace-pre rounded-[3px] bg-[#c03d1f] px-[7px] py-[3px] font-mono text-[11px] font-semibold leading-[1.4] text-white">X 0  Y 0</span>
          </div>
          <p ref={srRef} aria-live="polite" className="sr-only" />
        </div>
      </div>
    </section>
  );
}
