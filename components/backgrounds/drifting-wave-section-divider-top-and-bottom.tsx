import { useEffect, useRef, useState } from "react";

// A dark band between two paper sections, with a two-layer wave on its top and bottom edges.
// The paler back layer and the solid front layer drift at different speeds, so the edge never
// repeats in an obvious way. Copy the Divider component to use the edge on any block.
const PAPER = "#f4efe6";
const BAND = "#1f2e33";
const BACK_TINT = "#7fa29e";
const SECONDS = { back: 34, front: 22 };
const BACK = [[9,2,1.2],[5,5,0.3]];
const FRONT = [[11,3,0.2],[4,7,2.1]];
const facts = ["Oak, ash and walnut from British mills", "Drawings agreed before any deposit", "A two-year guarantee on every finish"];

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
@keyframes wvdv-slide { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
.wvdv-slide { animation: wvdv-slide linear infinite; will-change: transform; }
.wvdv-root[data-paused="true"] .wvdv-slide { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .wvdv-slide { animation: none !important; } }
`;

function Divider({ edge }: { edge: "top" | "bottom" }) {
  const top = edge === "top";
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 h-[70px] overflow-hidden sm:h-[100px] ${top ? "bottom-full -mb-px" : "top-full -mt-px"}`}>
      <svg className="wvdv-slide absolute left-0 top-0 h-full w-[200%] min-w-[1800px]" style={{ animationDuration: `${SECONDS.back}s` }} viewBox="0 0 2880 100" preserveAspectRatio="none">
        <path d={wavePath(top ? 46 : 54, BACK, 100, top ? "bottom" : "top")} fill={BACK_TINT} fillOpacity=".55" />
      </svg>
      <svg className="wvdv-slide absolute left-0 top-0 h-full w-[200%] min-w-[1800px]" style={{ animationDuration: `${SECONDS.front}s`, animationDirection: "reverse" }} viewBox="0 0 2880 100" preserveAspectRatio="none">
        <path d={wavePath(top ? 58 : 42, FRONT, 100, top ? "bottom" : "top")} fill={BAND} />
      </svg>
    </div>
  );
}

export default function DriftingWaveDivider() {
  const [ref, onScreen] = useOnScreen<HTMLElement>();
  return (
    <section ref={ref} data-paused={!onScreen} className="wvdv-root relative overflow-hidden" style={{ background: PAPER }}>
      <style>{css}</style>
      <div className="mx-auto max-w-5xl px-6 pb-[110px] pt-16 sm:pb-[140px]">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6b4e2e]">Hollin and Pike Joinery</p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-[#231a12] sm:text-4xl">Furniture that starts with a tape measure.</h2>
      </div>
      <div className="relative" style={{ background: BAND }}>
        <Divider edge="top" />
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-14 sm:grid-cols-[1.4fr_1fr] sm:items-end sm:py-16">
          <div>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-[#f4efe6] sm:text-5xl">Built to fit the room you already have.</h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#c3cfcc]">Fitted shelving, window seats and kitchens made in our workshop and installed in a single day.</p>
          </div>
          <div className="sm:text-right">
            <a href="#" className="inline-flex h-12 items-center rounded-md bg-[#e9dcc4] px-7 text-sm font-semibold text-[#1f2e33] transition hover:bg-[#f4ead8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9dcc4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f2e33]">Request a site visit</a>
          </div>
        </div>
        <Divider edge="bottom" />
      </div>
      <ul className="mx-auto grid max-w-5xl gap-4 px-6 pb-16 pt-[110px] sm:grid-cols-3 sm:pt-[140px]">
        {facts.map((f) => (
          <li key={f} className="border-t border-[#d8ccb8] pt-4 text-base text-[#3d2f22]">{f}</li>
        ))}
      </ul>
    </section>
  );
}
