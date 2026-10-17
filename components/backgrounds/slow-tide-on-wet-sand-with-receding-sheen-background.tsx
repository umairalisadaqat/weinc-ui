import { useEffect, useRef, useState } from "react";

// A thin sheet of sea runs up the sand, pauses, and slides back, leaving a darker wet band
// with a glassy sheen that fades after it. The swash is one translateY on a sliding SVG.
const SAND_TOP = "#e6d7ba";
const SAND_BOTTOM = "#d2bd97";
const SECONDS = 12; // one full run up and back
const EDGE = [[14,2,0.6],[8,5,2.2],[4,9,0.9]];

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
@keyframes swtd-swash { 0% { transform: translate3d(0,50%,0); } 38% { transform: translate3d(0,14%,0); } 48% { transform: translate3d(0,17%,0); } 86% { transform: translate3d(0,54%,0); } 100% { transform: translate3d(0,50%,0); } }
@keyframes swtd-wet { 0% { opacity: .35; } 38% { opacity: 1; } 60% { opacity: .9; } 100% { opacity: .35; } }
@keyframes swtd-drift { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
.swtd-swash { animation: swtd-swash ${SECONDS}s cubic-bezier(.45,.05,.4,1) -4s infinite; }
.swtd-wet { animation: swtd-wet ${SECONDS}s ease-in-out -4s infinite; }
.swtd-drift { animation: swtd-drift 70s linear infinite; }
.swtd-root[data-paused="true"] .swtd-swash, .swtd-root[data-paused="true"] .swtd-wet, .swtd-root[data-paused="true"] .swtd-drift { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .swtd-swash, .swtd-wet, .swtd-drift { animation: none !important; } .swtd-swash { transform: translate3d(0,26%,0); } }
`;

export default function SlowTideOnWetSand() {
  const [ref, onScreen] = useOnScreen<HTMLElement>();
  return (
    <section ref={ref} data-paused={!onScreen} className="swtd-root relative isolate min-h-[700px] overflow-hidden" style={{ background: `linear-gradient(180deg, ${SAND_TOP}, ${SAND_BOTTOM})` }}>
      <style>{css}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 bottom-0 h-[52%] min-h-[260px]">
          <svg className="swtd-wet absolute inset-y-0 left-0 h-full w-full min-w-[900px]" viewBox="0 0 1440 400" preserveAspectRatio="none">
            <defs>
              <linearGradient id="swtd-wetg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#b59d76" stopOpacity="0" />
                <stop offset=".12" stopColor="#ae9670" stopOpacity=".9" />
                <stop offset=".3" stopColor="#c7b598" />
                <stop offset=".42" stopColor="#a68e68" />
                <stop offset="1" stopColor="#9c845f" />
              </linearGradient>
            </defs>
            <path d={wavePath(80, [[16, 2, 0.5], [9, 5, 2.4]], 400)} fill="url(#swtd-wetg)" />
          </svg>
          <div className="swtd-swash absolute inset-0">
            <svg className="swtd-drift absolute inset-y-0 left-0 h-full w-[200%] min-w-[1800px]" viewBox="0 0 2880 400" preserveAspectRatio="none">
              <defs>
                <linearGradient id="swtd-water" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#f4f2ea" stopOpacity=".7" />
                  <stop offset=".1" stopColor="#b9d0c8" stopOpacity=".3" />
                  <stop offset=".4" stopColor="#8fb3ad" stopOpacity=".45" />
                  <stop offset=".78" stopColor="#5d918f" stopOpacity=".88" />
                  <stop offset="1" stopColor="#3f6f74" />
                </linearGradient>
              </defs>
              <path d={wavePath(60, EDGE, 400)} fill="url(#swtd-water)" />
              <path d={wavePath(60, EDGE, 400, "none")} fill="none" stroke="#fbfaf5" strokeOpacity=".22" strokeWidth="9" vectorEffect="non-scaling-stroke" />
              <path d={wavePath(60, EDGE, 400, "none")} fill="none" stroke="#fbfaf5" strokeOpacity=".85" strokeWidth="1.8" strokeDasharray="90 5 20 9 160 7" vectorEffect="non-scaling-stroke" />
              <path d={wavePath(74, [[12, 2, 0.9], [7, 5, 2.0], [5, 11, 1.4]], 400, "none")} fill="none" stroke="#fbfaf5" strokeOpacity=".35" strokeWidth="1" strokeDasharray="30 14 8 22" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
        <svg className="absolute inset-0 h-full w-full opacity-60 mix-blend-multiply">
          <filter id="swtd-grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .26  0 0 0 0 .16  0 0 0 .55 0"/></filter>
          <rect width="100%" height="100%" filter="url(#swtd-grain)" />
        </svg>
      </div>
      <div className="mx-auto max-w-5xl px-6 pb-[350px] pt-20 sm:pt-24">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5a4127]">Dune Row Cottages</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-[#2e1f10] sm:text-6xl">Wake up a short walk from the tide line.</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#4a3722]">Six timber cottages on the dunes, open all year with wood stoves and outdoor showers.</p>
        <a href="#" className="mt-8 inline-flex h-12 items-center rounded-md bg-[#2e1f10] px-7 text-sm font-semibold text-[#f5ecdc] transition hover:bg-[#4a3420] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e1f10] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e6d7ba]">Check availability</a>
      </div>
    </section>
  );
}
