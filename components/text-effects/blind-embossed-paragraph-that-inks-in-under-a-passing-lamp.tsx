import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// The paragraph. Edit the sentence here; it is split into words for you.
const TEXT =
  "A good page is pressed, not printed. The type bites into cotton paper and leaves a small valley at every stroke, and you only see it when the light comes in low from the side.";
const COLOPHON = "Set by hand, proof no. 14";

const PAPER = [236, 229, 214]; // floor of a blind (un-inked) letter where the lamp is brightest
const PAPER_SHADE = [190, 168, 140]; // the same floor out in the unlit part of the sheet
const INK = [38, 27, 22]; // colour of a fully inked letter
const PASS_SECONDS = 3.4; // how long the lamp takes to cross the sheet
const HOLD_SECONDS = 2.6; // how long the inked page rests before it starts again

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 .25 0 0 0 0 .18 0 0 0 0 .1 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")";

type Box = { x: number; y: number };

export default function BlindEmbossedParagraph() {
  const reduce = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);
  const lampRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [run, setRun] = useState(0);
  const words = TEXT.split(" ");
  const all = [...words, COLOPHON];

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const els = wordRefs.current.filter(Boolean) as HTMLSpanElement[];
    const ink = els.map(() => (reduce ? 1 : 0));
    let boxes: Box[] = [];
    let W = 1;
    let H = 1;

    const measure = () => {
      const r = sheet.getBoundingClientRect();
      W = r.width;
      H = r.height;
      boxes = els.map((el) => {
        const b = el.getBoundingClientRect();
        return { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2 };
      });
    };

    // Paints every word for a lamp at (lx, ly): which way its bevel catches light, and how inked it is.
    const paint = (lx: number, ly: number, power: number) => {
      const R = Math.max(170, Math.min(W, H) * 0.62);
      for (let i = 0; i < els.length; i++) {
        const b = boxes[i];
        if (!b) continue;
        const dx = b.x - lx;
        const dy = b.y - ly;
        const d = Math.hypot(dx, dy) || 1;
        const ux = dx / d;
        const uy = dy / d;
        const lit = Math.exp(-(d * d) / (R * R)) * power;
        const k = ink[i];
        const tone = Math.pow(Math.min(1, lit * 1.1), 1.4);
        const c = PAPER.map((p, j) => {
          const floor = (PAPER_SHADE[j] + (p - PAPER_SHADE[j]) * tone) * 0.975;
          return Math.round(floor + (INK[j] - floor) * k);
        });
        // A pressed letter: the wall nearest the lamp falls into shadow, the far wall catches the light.
        const reach = 0.55 + Math.min(0.85, d / 420);
        const dark = (0.3 + 0.38 * lit) * (1 - 0.6 * k);
        const glint = (0.2 + 0.6 * lit) * (1 - 0.78 * k);
        const s = els[i].style;
        s.color = `rgb(${c[0]},${c[1]},${c[2]})`;
        s.textShadow =
          `${(-ux * reach).toFixed(2)}px ${(-uy * reach).toFixed(2)}px ${(0.25 + reach * 0.35).toFixed(2)}px rgba(52,36,20,${dark.toFixed(3)}),` +
          `${(ux * 0.8).toFixed(2)}px ${(uy * 0.8).toFixed(2)}px 0.3px rgba(255,252,243,${glint.toFixed(3)})`;
      }
      if (lampRef.current) lampRef.current.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
      if (shadeRef.current) shadeRef.current.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
    };

    measure();
    const ro = new ResizeObserver(() => {
      measure();
      if (reduce) paint(W * 0.3, -H * 0.1, 0.9);
    });
    ro.observe(sheet);

    if (reduce) {
      paint(W * 0.3, -H * 0.1, 0.9);
      return () => ro.disconnect();
    }

    let raf = 0;
    let visible = true;
    let last = performance.now();
    let clock = 0; // seconds into the current cycle
    let lx = -200;
    let ly = 0;
    let first = true;
    const pointer = { on: false, x: 0, y: 0 };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      const total = PASS_SECONDS + HOLD_SECONDS + 1.1;
      if (clock > total) clock = 0;

      // The lamp's own route: along the long side of the sheet, a little off the diagonal.
      const p = Math.min(1, clock / PASS_SECONDS);
      const e = p * p * (3 - 2 * p);
      const wide = W >= H;
      const m = Math.max(W, H) * 0.34;
      const fading = clock > PASS_SECONDS + HOLD_SECONDS;
      // It comes to rest over the page, breathing a little, then glides back while the ink dries.
      const rest = clock > PASS_SECONDS ? Math.sin((clock - PASS_SECONDS) * 1.1) * 14 : 0;
      let tx = wide ? -m + (W * 0.68 + m) * e + rest : W * (0.25 + 0.3 * e);
      let ty = wide ? H * (0.16 + 0.22 * e) : -m + (H * 0.42 + m) * e + rest;
      if (fading) {
        tx = wide ? -m : W * 0.25;
        ty = wide ? H * 0.16 : -m;
      }
      if (pointer.on) {
        tx = pointer.x;
        ty = pointer.y;
      }
      if (first) {
        lx = tx;
        ly = ty;
        first = false;
      }
      const follow = 1 - Math.exp(-dt * (pointer.on ? 9 : fading ? 3.5 : 14));
      lx += (tx - lx) * follow;
      ly += (ty - ly) * follow;

      // Ink develops where the light has rested, and dries back to blind at the end of the cycle.
      const R = Math.max(170, Math.min(W, H) * 0.62);
      for (let i = 0; i < ink.length; i++) {
        const b = boxes[i];
        if (!b) continue;
        if (fading && !pointer.on) {
          ink[i] = Math.max(0, ink[i] - dt * 1.4);
          continue;
        }
        const d = Math.hypot(b.x - lx, b.y - ly);
        const lit = Math.exp(-(d * d) / (R * R));
        if (lit > 0.42) ink[i] = Math.min(1, ink[i] + dt * 3.2 * (lit - 0.3));
        else if (!pointer.on && clock > PASS_SECONDS) ink[i] = Math.min(1, ink[i] + dt * 2);
      }
      paint(lx, ly, 1);
      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      start();
    });
    io.observe(sheet);
    const onVis = () => start();
    document.addEventListener("visibilitychange", onVis);

    const move = (ev: PointerEvent) => {
      const r = sheet.getBoundingClientRect();
      pointer.on = true;
      pointer.x = ev.clientX - r.left;
      pointer.y = ev.clientY - r.top;
    };
    const leave = () => {
      pointer.on = false;
    };
    sheet.addEventListener("pointermove", move);
    sheet.addEventListener("pointerdown", move);
    sheet.addEventListener("pointerleave", leave);
    sheet.addEventListener("pointercancel", leave);
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      sheet.removeEventListener("pointermove", move);
      sheet.removeEventListener("pointerdown", move);
      sheet.removeEventListener("pointerleave", leave);
      sheet.removeEventListener("pointercancel", leave);
    };
  }, [reduce, run]);

  return (
    <section className="relative flex min-h-[640px] w-full items-center justify-center overflow-hidden bg-[#161310] px-4 py-14 sm:px-8 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(96,74,48,0.38), rgba(22,19,16,0) 62%)" }}
      />
      <div className="relative w-full max-w-[820px]">
        <div
          ref={sheetRef}
          className="relative overflow-hidden rounded-[2px] bg-[#efe8d8] px-7 py-12 shadow-[0_1px_0_rgba(255,255,255,0.55)_inset,0_-1px_0_rgba(90,70,45,0.35)_inset,0_2px_0_#b9ad97,0_3px_0_#8f8470,0_34px_60px_-16px_rgba(0,0,0,0.8),0_10px_18px_-8px_rgba(0,0,0,0.6)] [touch-action:pan-y] sm:px-16 sm:py-20"
        >
          {/* paper tooth */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.5] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
          {/* the room: everything the lamp does not reach sits in warm shade */}
          <div
            ref={shadeRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-0 w-0 will-change-transform"
            style={{ transform: "translate3d(30%, -10%, 0)" }}
          >
            <div
              className="absolute -left-[1600px] -top-[1600px] h-[3200px] w-[3200px] mix-blend-multiply"
              style={{
                background:
                  "radial-gradient(circle closest-side, rgba(150,108,64,0) 0%, rgba(150,108,64,0) 5%, rgba(150,108,64,0.2) 13%, rgba(150,108,64,0.4) 24%, rgba(140,98,58,0.5) 100%)",
              }}
            />
          </div>
          {/* the lamp's warm pool */}
          <div ref={lampRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-0 w-0 will-change-transform">
            <div
              className="absolute -left-[340px] -top-[340px] h-[680px] w-[680px]"
              style={{ background: "radial-gradient(circle closest-side, rgba(255,244,214,0.5), rgba(255,236,196,0.16) 45%, rgba(255,236,196,0) 100%)" }}
            />
          </div>

          <p className="relative select-none text-balance font-serif text-[27px] font-medium leading-[1.32] tracking-[-0.012em] text-[#ece5d6] sm:text-[42px] sm:leading-[1.24]">
            {words.map((w, i) => (
              <span key={i}>
                <span
                  ref={(el) => {
                    wordRefs.current[i] = el;
                  }}
                  className="inline-block"
                  style={reduce ? { color: "rgb(38,27,22)" } : undefined}
                >
                  {w}
                </span>
                {i < words.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
          <div className="relative mt-10 flex items-center gap-4 sm:mt-14">
            <span aria-hidden="true" className="h-px w-6 shrink-0 bg-[#261b16]/25 sm:w-10" />
            <span
              ref={(el) => {
                wordRefs.current[all.length - 1] = el;
              }}
              className="whitespace-nowrap font-serif text-[10.5px] uppercase tracking-[0.2em] text-[#e9e2d3] sm:text-[13px] sm:tracking-[0.28em]"
              style={reduce ? { color: "rgb(38,27,22)" } : undefined}
            >
              {COLOPHON}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 px-1">
          <p className="text-[12px] tracking-wide text-[#a89a86]">Move a light over the page.</p>
          <button
            type="button"
            onClick={() => setRun((n) => n + 1)}
            className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-[#4a4034] px-4 text-[12px] font-medium tracking-wide text-[#e6dccb] transition-colors hover:bg-[#241f1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6dccb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161310]"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10a6 6 0 1 0 2-4.5" />
              <path d="M4 4v3.2h3.2" />
            </svg>
            Pass the lamp again
          </button>
        </div>
      </div>
    </section>
  );
}
