import { useEffect, useRef, useState } from "react";

// Four swell layers, back to front. Each SVG is twice the width of the hero and slides left by
// half of itself, which is exactly one wave period, so the loop never shows a seam.
// Change a colour pair or a duration (seconds) here.
const SWELLS = [
  { base: 62, harm: [[3,6,0.3],[2,11,1]], top: "#b7cfc9", bottom: "#9dbdb6", seconds: 60 },
  { base: 108, harm: [[7,5,2.1,2],[3,9,0.2]], top: "#8bb0aa", bottom: "#6a9893", seconds: 40 },
  { base: 166, harm: [[11,4,1,2.2],[4,7,2.6]], top: "#558690", bottom: "#3a6b72", seconds: 28 },
  { base: 232, harm: [[16,3,0.7,2.4],[5,6,1.9]], top: "#25525a", bottom: "#12313a", seconds: 19 },
];
const FOAM = "#f1f6f3";

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
@keyframes sswv-slide { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
@keyframes sswv-bob { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,7px,0); } }
.sswv-slide { animation: sswv-slide linear infinite; will-change: transform; }
.sswv-bob { animation: sswv-bob 7s ease-in-out infinite; }
.sswv-root[data-paused="true"] .sswv-slide, .sswv-root[data-paused="true"] .sswv-bob { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .sswv-slide, .sswv-bob { animation: none !important; } }
`;

export default function LayeredSeaSwellHero() {
  const [ref, onScreen] = useOnScreen<HTMLElement>();
  return (
    <section ref={ref} data-paused={!onScreen} className="sswv-root relative isolate min-h-[640px] overflow-hidden bg-[#dfe8e5]">
      <style>{css}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background:linear-gradient(180deg,#eef3f1_0%,#e2eae7_40%,#cbdcd7_62%,#b9cfc9_100%)]" />
        <div className="absolute left-[30%] top-[30%] h-64 w-[70%] [background:radial-gradient(closest-side,rgba(255,255,255,.6),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-[44%] min-h-[220px]">
          {SWELLS.map((s, i) => (
            <div key={i} className="sswv-bob absolute inset-0" style={{ animationDelay: `${-i * 1.7}s` }}>
              <svg className="sswv-slide absolute bottom-0 left-0 h-full w-[200%] min-w-[1800px]" style={{ animationDuration: `${s.seconds}s` }} viewBox="0 0 2880 320" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`sswv-g${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={s.top} />
                    <stop offset="1" stopColor={s.bottom} />
                  </linearGradient>
                </defs>
                <path d={wavePath(s.base, s.harm, 320)} fill={`url(#sswv-g${i})`} />
                {i > 0 && i < SWELLS.length - 1 && <path d={wavePath(s.base, s.harm, 320, "none")} fill="none" stroke="#ffffff" strokeOpacity=".22" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
                {i === SWELLS.length - 1 && (
                  <>
                    <path d={wavePath(s.base + 2, s.harm, 320, "none")} fill="none" stroke={FOAM} strokeOpacity=".16" strokeWidth="8" vectorEffect="non-scaling-stroke" />
                    <path d={wavePath(s.base, s.harm, 320, "none")} fill="none" stroke={FOAM} strokeOpacity=".75" strokeWidth="1.6" strokeDasharray="220 5 60 9 140 4" vectorEffect="non-scaling-stroke" />
                  </>
                )}
              </svg>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 pb-[300px] pt-20 sm:pt-28">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2c4e53]">Saltmarsh Swim School</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-[#0f262b] sm:text-6xl">Learn the open water at your own pace.</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#31474b]">Small-group sea lessons every weekend from May to September, wetsuits included.</p>
        <a href="#" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#0f262b] px-7 text-sm font-semibold text-white transition hover:bg-[#1d4249] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f262b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e2eae7]">Book a trial swim</a>
      </div>
    </section>
  );
}
