import { useEffect, useRef, useState } from "react";

// Nine hairlines that swell and pinch like a recorded voice. The amplitude envelope is built into
// each path (it falls to nothing twice per period), three groups slide at different speeds and
// one group runs backwards, and each group slowly breathes taller and shorter.
const INK = "#0d1315";
const GROUPS = [
  { seconds: 18, breathe: 6.5, reverse: false },
  { seconds: 26, breathe: 8.5, reverse: true },
  { seconds: 22, breathe: 5.5, reverse: false },
];
// [amplitude, waves per period, phase, colour, stroke width, group]
const LINES: [number, number, number, string, number, number][] = [[62,3,0,"#9cc7bf",1.1,0],[48,4,1.1,"#e7efe9",0.8,1],[70,3,2.3,"#9cc7bf",0.7,2],[36,5,0.6,"#e7efe9",0.6,0],[55,4,3,"#d9b58a",1.2,1],[44,3,4.1,"#9cc7bf",0.6,2],[66,5,5,"#e7efe9",0.5,0],[30,6,1.9,"#9cc7bf",0.9,1],[52,3,2.9,"#e7efe9",0.6,2]];

// One wave edge across 2880 units: two copies of a 1440-unit period, so sliding the SVG left by
// half its width loops with no seam. Each harm entry is [amplitude, waves per period, phase,
// sharpness?]; with a sharpness the crests come to narrow peaks over broad troughs, like real swell.
function wavePath(base: number, harm: number[][], h: number, close: "bottom" | "top" | "none" = "bottom", step = 36, env?: [number, number]) {
  const pts: number[][] = [];
  for (let x = -step; x <= 2880 + step; x += step) {
    const e = env ? 1 - env[0] + env[0] * Math.abs(Math.sin((Math.PI * env[1] * x) / 1440)) : 1;
    let y = base;
    for (const [a, c, ph, k] of harm) {
      const t = (2 * Math.PI * c * x) / 1440 + ph;
      y += k ? e * (a - 2 * a * Math.pow((1 + Math.cos(t)) / 2, k)) : a * e * Math.sin(t);
    }
    pts.push([x, y]);
  }
  const r = (n: number) => Math.round(n * 10) / 10;
  let d = "M0 " + r(pts[1][1]);
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    d += "C" + r(p1[0] + (p2[0] - p0[0]) / 6) + " " + r(p1[1] + (p2[1] - p0[1]) / 6) + " " + r(p2[0] - (p3[0] - p1[0]) / 6) + " " + r(p2[1] - (p3[1] - p1[1]) / 6) + " " + r(p2[0]) + " " + r(p2[1]);
  }
  if (close === "bottom") d += "L2880 " + h + "L0 " + h + "Z";
  if (close === "top") d += "L2880 0L0 0Z";
  return d;
}

function useOnScreen<T extends Element>() {
  const ref = useRef<T>(null);
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, onScreen] as const;
}

const css = `
@keyframes sswl-slide { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
@keyframes sswl-breathe { 0%,100% { transform: scaleY(.72); } 50% { transform: scaleY(1.08); } }
.sswl-slide { animation: sswl-slide linear infinite; will-change: transform; }
.sswl-breathe { animation: sswl-breathe ease-in-out infinite; transform-origin: 50% 50%; }
.sswl-root[data-paused="true"] .sswl-slide, .sswl-root[data-paused="true"] .sswl-breathe { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .sswl-slide, .sswl-breathe { animation: none !important; } }
`;

export default function ThinSoundWaveLines() {
  const [ref, onScreen] = useOnScreen<HTMLElement>();
  return (
    <section ref={ref} data-paused={!onScreen} className="sswl-root relative isolate min-h-[640px] overflow-hidden" style={{ background: INK }}>
      <style>{css}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background:radial-gradient(70%_50%_at_50%_72%,rgba(70,110,108,.28),transparent)]" />
        <div className="absolute inset-x-0 bottom-[6%] h-[46%] min-h-[220px] [mask-image:linear-gradient(90deg,transparent,#000_18%,#000_82%,transparent)]">
          {GROUPS.map((g, gi) => (
            <div key={gi} className="sswl-breathe absolute inset-0" style={{ animationDuration: `${g.breathe}s` }}>
              <svg className="sswl-slide absolute left-0 top-0 h-full w-[200%] min-w-[1800px]" style={{ animationDuration: `${g.seconds}s`, animationDirection: g.reverse ? "reverse" : "normal" }} viewBox="0 0 2880 240" preserveAspectRatio="none">
                {LINES.filter((l) => l[5] === gi).map(([a, c, ph, colour, w], i) => (
                  <path key={i} d={wavePath(120, [[a, c, ph], [a * 0.18, c * 3, ph * 1.7]], 240, "none", 24, [1, 2])} fill="none" stroke={colour} strokeOpacity=".7" strokeWidth={w} vectorEffect="non-scaling-stroke" />
                ))}
              </svg>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-6 pb-[320px] pt-20 text-center sm:pt-24">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#9cc7bf]">Fieldnote Audio</p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-[#f1f4f1] sm:text-6xl">Podcasts edited by people who listen twice.</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[#b9c6c3]">Send raw tape on Monday and get a mastered episode, show notes and clips back by Thursday.</p>
        <a href="#" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#e7efe9] px-7 text-sm font-semibold text-[#0d1315] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9cc7bf] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1315]">Send a sample episode</a>
      </div>
    </section>
  );
}
