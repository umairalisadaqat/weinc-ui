import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

// The page shown on the glass. An invented surf school.
const site = {
  name: "Low Tide",
  links: ["Lessons", "Boards", "Find us"],
  headline: "Surf lessons at low tide.",
  copy: "Small groups, soft boards and a coach in the water with you.",
  cta: "Book a lesson",
  photo: "https://images.pexels.com/photos/35567655/pexels-photo-35567655.jpeg?auto=compress&cs=tinysrgb&w=1200",
  lessons: [
    { name: "First wave", note: "Ages twelve and up" },
    { name: "Kids club", note: "Saturday mornings" },
    { name: "One to one", note: "At your own pace" },
  ],
};
const sizes = ["Phone", "Tablet", "Desktop"];
const BLUE = "#4F98FB";
const INK = "#0B0D12";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const LW = 232, LH = 470, T = 13, BZ = 9; // one leaf, its thickness and its bezel
const SWING = 820; // milliseconds for a leaf to come round
const HOLD = 7000; // how long the demo leaves the screen fully open
const SW = [LW - BZ * 2, LW * 2 - BZ * 2, LW * 3 - BZ * 2];

// Where every block of the page sits at each of the three widths.
type Box = { left: number; top: number; width: number; height?: number; fontSize?: number };
const photoAt: Box[] = [
  { left: 8, top: 42, width: 198, height: 150 },
  { left: 230, top: 44, width: 208, height: 248 },
  { left: 316, top: 44, width: 354, height: 264 },
];
const headAt: Box[] = [
  { left: 12, top: 204, width: 198, fontSize: 25 },
  { left: 16, top: 70, width: 206, fontSize: 31 },
  { left: 22, top: 78, width: 290, fontSize: 40 },
];
const copyAt: Box[] = [
  { left: 12, top: 264, width: 190, fontSize: 10.5 },
  { left: 16, top: 148, width: 190, fontSize: 11.5 },
  { left: 22, top: 176, width: 250, fontSize: 13 },
];
const ctaAt: Box[] = [
  { left: 12, top: 302, width: 112, height: 30, fontSize: 11 },
  { left: 16, top: 200, width: 120, height: 32, fontSize: 11.5 },
  { left: 22, top: 232, width: 138, height: 38, fontSize: 13 },
];
const cardAt = (m: number, i: number): Box =>
  m === 0 ? { left: 8, top: 344 + i * 36, width: 198, height: 32 }
  : m === 1 ? { left: 8 + i * 146, top: 304, width: 138, height: 138 }
  : { left: 8 + i * 224, top: 320, width: 214, height: 124 };

const MOVE = "left 760ms cubic-bezier(.2,.85,.2,1), top 760ms cubic-bezier(.2,.85,.2,1), width 760ms cubic-bezier(.2,.85,.2,1), height 760ms cubic-bezier(.2,.85,.2,1), font-size 760ms cubic-bezier(.2,.85,.2,1), opacity 400ms ease";
const METAL = "linear-gradient(180deg,#eef0f2 0%,#c2c6cc 22%,#8e949c 50%,#c9cdd2 78%,#7d838b 100%)";

// One leaf of the device: a glass front, an aluminium back and four edge walls so it has real thickness.
function Leaf({ style, hingeLeft, hingeRight, children }: { style?: CSSProperties; hingeLeft?: boolean; hingeRight?: boolean; children?: ReactNode }) {
  const radius = `${hingeLeft ? 7 : 30}px ${hingeRight ? 7 : 30}px ${hingeRight ? 7 : 30}px ${hingeLeft ? 7 : 30}px`;
  return (
    <div className="tri-fold-leaf absolute top-0" style={{ width: LW, height: LH, transformStyle: "preserve-3d", ...style }}>
      <div className="absolute" style={{ left: 0, top: 22, width: T, height: LH - 44, transformOrigin: "left", transform: "rotateY(90deg)", background: "linear-gradient(90deg,#f1f2f4,#a9aeb5 40%,#7b8189)" }} />
      <div className="absolute" style={{ left: LW, top: 22, width: T, height: LH - 44, transformOrigin: "left", transform: "rotateY(90deg)", background: "linear-gradient(90deg,#fafbfc,#b9bdc3 35%,#6f757d)" }} />
      <div className="absolute" style={{ left: 22, top: 0, width: LW - 44, height: T, transformOrigin: "top", transform: "rotateX(-90deg)", background: "linear-gradient(180deg,#ffffff,#c5c9ce)" }} />
      <div className="absolute" style={{ left: 22, top: LH, width: LW - 44, height: T, transformOrigin: "top", transform: "rotateX(-90deg)", background: "linear-gradient(180deg,#9da2a9,#5c6169)" }} />
      {/* back: bead-blasted aluminium with a lens */}
      <div className="absolute inset-0" style={{ borderRadius: radius, transform: `translateZ(${-T}px) rotateY(180deg)`, backfaceVisibility: "hidden", background: "linear-gradient(118deg,#eceef0 0%,#c6cad0 30%,#dfe2e5 48%,#a4a9b1 72%,#c9cdd3 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.7), inset 0 0 0 2px rgba(60,66,76,0.25)" }}>
        <div className="absolute inset-0 opacity-40" style={{ borderRadius: radius, backgroundImage: "repeating-linear-gradient(0deg,rgba(255,255,255,0.5) 0 1px,rgba(40,46,56,0.18) 1px 2px)" }} />
        <div className="absolute rounded-full" style={{ right: 22, top: 24, width: 34, height: 34, background: "radial-gradient(circle at 38% 34%,#5a6f96 0%,#121722 34%,#05070b 62%,#2a2f39 100%)", boxShadow: "0 0 0 3px #b4b9c0, 0 0 0 4px rgba(255,255,255,0.8), 0 2px 5px rgba(0,0,0,0.4)" }} />
      </div>
      {/* front: black glass inside a polished rim */}
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: radius, backfaceVisibility: "hidden", background: "linear-gradient(160deg,#ffffff 0%,#c9cdd2 18%,#8a9098 42%,#e4e6e9 60%,#9a9fa7 82%,#5f656d 100%)", boxShadow: "inset 0 0 0 0.5px rgba(40,46,56,0.55)" }}>
        <div className="absolute" style={{ inset: 2.5, borderRadius: `${hingeLeft ? 5 : 27.5}px ${hingeRight ? 5 : 27.5}px ${hingeRight ? 5 : 27.5}px ${hingeLeft ? 5 : 27.5}px`, background: "#07090d", boxShadow: "inset 0 0 0 1px #000, inset 0 1px 2px 1px rgba(255,255,255,0.08)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(112deg,rgba(255,255,255,0) 30%,rgba(140,170,220,0.10) 46%,rgba(255,255,255,0.02) 52%,rgba(255,255,255,0) 70%)" }} />
      </div>
      {children}
    </div>
  );
}

export default function TriFoldScreen() {
  const [open, setOpen] = useState(1); // leaves swung flat
  const [cols, setCols] = useState(1); // leaves the picture is lit across
  const [target, setTarget] = useState(1);
  const [scale, setScale] = useState(1);
  const frame = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const touched = useRef(0);
  const state = useRef({ open: 1, cols: 1 });
  const still = useRef(false);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    still.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still.current) { state.current = { open: 3, cols: 3 }; setOpen(3); setCols(3); setTarget(3); }
    const fit = () => setScale(Math.max(0.4, Math.min(1.3, (el.clientWidth - 24) / (LW * 3 + 36))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Walk one leaf at a time toward the size that was asked for: glass lights after a leaf lands, and goes dark before one folds.
  useEffect(() => {
    let timer = 0;
    const step = () => {
      const s = state.current;
      if (still.current) { s.open = target; s.cols = target; setOpen(target); setCols(target); return; }
      if (s.open < target) { s.open += 1; setOpen(s.open); timer = window.setTimeout(() => { s.cols = s.open; setCols(s.cols); timer = window.setTimeout(step, 140); }, SWING - 150); }
      else if (s.cols > target) { s.cols -= 1; setCols(s.cols); timer = window.setTimeout(() => { s.open = s.cols; setOpen(s.open); timer = window.setTimeout(step, SWING - 240); }, 300); }
    };
    step();
    return () => window.clearTimeout(timer);
  }, [target]);

  // Self-running demo: open fully, hold, fold away, and stand down while someone is using it.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0, seen = true;
    const loop = (wait: number, next: number) => {
      timer = window.setTimeout(() => {
        if (seen && !document.hidden && performance.now() - touched.current > 7000) setTarget(next);
        loop(next === 3 ? HOLD + SWING * 2 : 2600, next === 3 ? 1 : 3);
      }, wait);
    };
    touched.current = -1e9;
    // wait for the photograph before the first leaf moves
    const begin = () => loop(220, 3);
    if (document.readyState === "complete") begin(); else window.addEventListener("load", begin, { once: true });
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; });
    if (frame.current) io.observe(frame.current);
    return () => { window.clearTimeout(timer); window.removeEventListener("load", begin); io.disconnect(); };
  }, []);

  const choose = (n: number) => { touched.current = performance.now(); setTarget(n); };
  const onMove = (e: React.PointerEvent) => {
    const el = tilt.current, box = frame.current?.getBoundingClientRect();
    if (!el || !box || still.current) return;
    const x = (e.clientX - box.left) / box.width - 0.5, y = (e.clientY - box.top) / box.height - 0.5;
    el.style.transform = `rotateX(${(-y * 9).toFixed(2)}deg) rotateY(${(x * 13).toFixed(2)}deg)`;
    el.style.setProperty("--glare", `${(50 + x * 90).toFixed(1)}%`);
  };
  const onLeave = () => { if (tilt.current) { tilt.current.style.transform = ""; tilt.current.style.setProperty("--glare", "38%"); } };

  const m = cols - 1;
  const fold = (flat: boolean): CSSProperties => ({ transform: `rotateY(${flat ? 0 : 180}deg)`, transition: `transform ${SWING}ms cubic-bezier(.3,.75,.25,1.06)` });
  const place = (b: Box): CSSProperties => ({ position: "absolute", left: b.left, top: b.top, width: b.width, height: b.height, fontSize: b.fontSize, transition: MOVE });

  return (
    <div
      className="relative flex min-h-[540px] w-full flex-col items-center justify-center overflow-hidden bg-[#E9E6DF] bg-[radial-gradient(90%_70%_at_50%_34%,#F8F6F1_0%,#E9E6DF_55%,#CFCAC0_100%)] px-3 py-10 text-[#0B0D12] sm:min-h-[800px]"
      style={{ fontFamily: FONT }}
    >
      <style>{`
        @keyframes tri-fold-screen-float { 0%,100% { transform: translateY(0) rotateZ(-0.25deg); } 50% { transform: translateY(-7px) rotateZ(0.25deg); } }
        .tri-fold-screen-float { animation: tri-fold-screen-float 6.5s ease-in-out infinite; transform-style: preserve-3d; }
        .tri-fold-screen-tilt { transition: transform 420ms cubic-bezier(.2,.8,.2,1); transform-style: preserve-3d; --glare: 38%; }
        @media (prefers-reduced-motion: reduce) {
          .tri-fold-screen-float { animation: none; }
          .tri-fold-screen-root *, .tri-fold-screen-root { transition: none !important; }
        }
      `}</style>

      <div
        ref={frame}
        className="tri-fold-screen-root relative w-full max-w-[1020px] touch-pan-y"
        style={{ height: (LH + 70) * scale }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <div className="absolute inset-x-0 top-0 flex justify-center">
        {/* zoom, not a scale transform, so the type on the glass is drawn sharp at every size */}
        <div className="relative shrink-0" style={{ width: LW * 3, height: LH + 70, zoom: scale, perspective: 1900, perspectiveOrigin: "50% 42%" }}>
          {/* what the device throws onto the table */}
          <div aria-hidden="true" className="absolute rounded-[50%]" style={{ top: LH + 14, height: 44, left: LW * 1.5 - (open * LW) / 2 - 10, width: open * LW + 20, background: "radial-gradient(closest-side,rgba(52,40,20,0.42),rgba(52,40,20,0.16) 55%,rgba(52,40,20,0))", filter: "blur(9px)", transition: `left ${SWING}ms ease, width ${SWING}ms ease` }} />
          <div ref={tilt} className="tri-fold-screen-tilt absolute inset-x-0 top-0" style={{ height: LH }}>
            <div className="tri-fold-screen-float absolute inset-0">
              <button
                type="button"
                aria-label={`Screen is at ${sizes[target - 1].toLowerCase()} width. Press to ${target === 3 ? "fold it back to a phone" : "open the next leaf"}.`}
                onClick={() => choose(target === 3 ? 1 : target + 1)}
                className="absolute inset-0 block cursor-pointer rounded-[30px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-4 focus-visible:ring-offset-[#E9E6DF]"
                style={{ transformStyle: "preserve-3d", transform: `translateX(${(3 - open) * LW * 0.5}px) rotateX(9deg) rotateY(${open === 1 ? -26 : open === 2 ? -14 : -7}deg)`, transition: `transform ${SWING + 160}ms cubic-bezier(.25,.8,.25,1)` }}
              >
                <Leaf hingeRight />
                <Leaf hingeLeft hingeRight style={{ left: LW, transformOrigin: `0px 50% ${-T * 1.5}px`, ...fold(open >= 2) }}>
                  <Leaf hingeLeft style={{ left: LW, transformOrigin: `0px 50% ${-T}px`, ...fold(open >= 3) }} />
                </Leaf>

                {/* the picture: one sheet of glass that grows across whichever leaves are flat */}
                <div
                  aria-hidden="true"
                  className="absolute overflow-hidden bg-[#F6F4EF]"
                  style={{ left: BZ, top: BZ, height: LH - BZ * 2, width: SW[m], borderRadius: 22, transform: "translateZ(0.6px)", transition: "width 420ms cubic-bezier(.3,.8,.3,1)", boxShadow: "0 0 0 1px rgba(0,0,0,0.6)" }}
                >
                  <div className="absolute left-0 top-0" style={{ width: SW[2], height: LH - BZ * 2 }}>
                    {/* bar across the top */}
                    <div className="absolute left-0 top-0 flex h-[38px] items-center justify-between px-[12px]" style={{ width: SW[m], transition: "width 760ms cubic-bezier(.2,.85,.2,1)" }}>
                      <span className="flex shrink-0 items-center gap-[6px] whitespace-nowrap text-[12px] font-extrabold tracking-[-0.03em]"><span className="h-[9px] w-[9px] rounded-full" style={{ background: BLUE }} />{site.name}</span>
                      <span className="relative block h-[20px] w-[20px] shrink-0">
                        <span className="absolute right-0 top-[3px] flex gap-[14px] whitespace-nowrap text-[10px] font-bold text-[#0B0D12]/70" style={{ opacity: m ? 1 : 0, transition: "opacity 400ms ease 200ms" }}>
                          {site.links.slice(0, m === 1 ? 2 : 3).map((l) => <span key={l}>{l}</span>)}
                        </span>
                        <span className="absolute right-0 top-[6px] flex flex-col gap-[3px]" style={{ opacity: m ? 0 : 1, transition: "opacity 300ms ease" }}>
                          <span className="block h-[2px] w-[15px] rounded-full bg-[#0B0D12]" /><span className="block h-[2px] w-[15px] rounded-full bg-[#0B0D12]" />
                        </span>
                      </span>
                    </div>
                    <div className="overflow-hidden bg-[#4f8fae]" style={{ ...place(photoAt[m]), borderRadius: 16 }}>
                      <img src={site.photo} alt="" width={1200} height={675} className="h-full w-full object-cover" style={{ objectPosition: "68% 55%" }} />
                    </div>
                    <div className="font-extrabold leading-[0.98] tracking-[-0.045em]" style={place(headAt[m])}>{site.headline}</div>
                    <div className="font-semibold leading-[1.35] text-[#0B0D12]/70" style={place(copyAt[m])}>{site.copy}</div>
                    <div className="flex items-center justify-center rounded-full font-extrabold tracking-[-0.01em] text-white" style={{ ...place(ctaAt[m]), background: INK, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 12px -6px rgba(11,13,18,0.6)" }}>
                      <span className="mr-[6px] h-[6px] w-[6px] rounded-full" style={{ background: BLUE }} />{site.cta}
                    </div>
                    {site.lessons.map((l, i) => (
                      <div key={l.name} className="overflow-hidden bg-white" style={{ ...place(cardAt(m, i)), borderRadius: m ? 14 : 11, boxShadow: "0 0 0 1px rgba(11,13,18,0.07), 0 8px 14px -10px rgba(11,13,18,0.35)" }}>
                        <div className="absolute rounded-[9px]" style={{ left: m ? 10 : 8, top: m ? 10 : 7, width: m ? 30 : 18, height: m ? 30 : 18, background: i === 0 ? BLUE : i === 1 ? "#0B0D12" : "#DAD5CA", transition: MOVE }}>
                          <svg viewBox="0 0 20 20" className="h-full w-full" fill="none" stroke={i === 2 ? INK : "#fff"} strokeWidth="1.8" strokeLinecap="round"><path d="M4 12c2-3 4-3 6 0s4 3 6 0" /></svg>
                        </div>
                        <div className="absolute whitespace-nowrap font-extrabold tracking-[-0.02em]" style={{ left: m ? 10 : 34, top: m ? (m === 2 ? 54 : 60) : 9, fontSize: m ? 14 : 11, transition: MOVE }}>{l.name}</div>
                        <div className="absolute whitespace-nowrap font-semibold text-[#0B0D12]/60" style={{ left: 10, top: m === 2 ? 76 : 82, fontSize: 10.5, opacity: m ? 1 : 0, transition: MOVE }}>{l.note}</div>
                        <svg viewBox="0 0 20 20" className="absolute h-[12px] w-[12px]" style={{ right: 9, top: m ? 12 : 10, transition: MOVE }} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4l6 6-6 6" /></svg>
                      </div>
                    ))}
                  </div>
                  {/* the two soft creases where the glass bends, then the room reflected in it */}
                  {[1, 2].map((i) => (
                    <div key={i} className="absolute inset-y-0" style={{ left: i * LW - BZ - 7, width: 14, background: "linear-gradient(90deg,rgba(11,13,18,0) 0%,rgba(11,13,18,0.07) 38%,rgba(255,255,255,0.38) 52%,rgba(11,13,18,0.05) 66%,rgba(11,13,18,0) 100%)" }} />
                  ))}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(105deg,rgba(255,255,255,0) calc(var(--glare) - 26%),rgba(255,255,255,0.24) calc(var(--glare) - 4%),rgba(255,255,255,0.08) calc(var(--glare) + 3%),rgba(255,255,255,0) calc(var(--glare) + 20%))", transition: "background 300ms linear" }} />
                  <div className="absolute inset-0" style={{ borderRadius: 22, boxShadow: "inset 0 0 0 1px rgba(11,13,18,0.5), inset 0 2px 5px rgba(11,13,18,0.25)" }} />
                </div>
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      <div role="group" aria-label="Screen width" className="relative mt-5 flex rounded-full bg-[#0B0D12] p-[5px] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_30px_-16px_rgba(40,30,12,0.7)]">
        <span aria-hidden="true" className="absolute left-[5px] top-[5px] h-[40px] w-[88px] rounded-full bg-[#F6F4EF] shadow-[inset_0_-2px_0_rgba(11,13,18,0.12)] transition-transform duration-500 ease-[cubic-bezier(.3,1.3,.4,1)] motion-reduce:transition-none" style={{ transform: `translateX(${(target - 1) * 88}px)` }} />
        {sizes.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-pressed={target === i + 1}
            onClick={() => choose(i + 1)}
            className={`relative h-[40px] w-[88px] rounded-full text-[13px] font-extrabold tracking-[-0.01em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#4F98FB] motion-reduce:transition-none ${target === i + 1 ? "text-[#0B0D12]" : "text-white/75"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-[14px] text-center text-[12px] font-semibold tracking-[-0.005em] text-[#0B0D12]/70">
        {cols === 1 ? "One leaf: the page stacks in a single column" : cols === 2 ? "Two leaves: the photo moves beside the words" : "Three leaves: the same page, laid out wide"}
      </p>
    </div>
  );
}
