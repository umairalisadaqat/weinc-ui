import { useEffect, useRef } from "react";

// How far the heat bends the horizon, and how long one shimmer cycle takes.
const BEND = 10;
const SHIMMER = "8s";

const MESAS = "M-20 386 L130 386 L158 356 L262 352 L284 386 L560 386 L586 370 L640 368 L662 386 L960 386 L992 344 L1146 338 L1172 386 L1460 386 L1460 392 L-20 392 Z";
const MIRAGE = "M-20 392 L130 392 L158 414 L262 418 L284 392 L560 392 L586 404 L640 406 L662 392 L960 392 L992 424 L1146 430 L1172 392 L1460 392 Z";

const css = `
.hts-grain{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23g%29'/%3E%3C/svg%3E");mix-blend-mode:multiply;opacity:.3}
`;

export default function HeatShimmerDesertGradient() {
  const rootRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // The shimmer is an SVG animation: stop it for reduced motion and pause it off screen.
  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    if (!root || !svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      svg.pauseAnimations();
      return;
    }
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations()));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="relative isolate flex min-h-[640px] items-start overflow-hidden bg-[#f1dfc0]">
      <style>{css}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <svg ref={svgRef} className="absolute inset-0 block h-full w-full" viewBox="0 0 1440 640" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="hts-air" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#efe3cc" />
              <stop offset=".45" stopColor="#f4dfba" />
              <stop offset=".72" stopColor="#f6d6a4" />
            </linearGradient>
            <linearGradient id="hts-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e9c08c" />
              <stop offset=".35" stopColor="#d49a62" />
              <stop offset="1" stopColor="#a86a3c" />
            </linearGradient>
            <radialGradient id="hts-glare" cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor="#fffaf0" stopOpacity=".95" />
              <stop offset=".4" stopColor="#fff3dc" stopOpacity=".45" />
              <stop offset="1" stopColor="#fff3dc" stopOpacity="0" />
            </radialGradient>
            <filter id="hts-wobble" x="-2%" y="-20%" width="104%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency=".004 .07" numOctaves={2} seed={4} result="air">
                <animate attributeName="baseFrequency" dur={SHIMMER} values=".004 .07;.005 .085;.004 .07" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="air" scale={BEND} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <rect width="1440" height="640" fill="url(#hts-air)" />
          <circle cx="1060" cy="90" r="320" fill="url(#hts-glare)" />
          <g transform="translate(0 92)">
          <g filter="url(#hts-wobble)">
            <rect x="-20" y="384" width="1480" height="200" fill="url(#hts-ground)" />
            <path d={MESAS} fill="#cf9a6c" opacity=".45" />
            <path d={MIRAGE} fill="#f6dcb2" opacity=".5" />
            <rect x="-20" y="372" width="1480" height="30" fill="#f8dfb6" opacity=".55" />
            </g>
          </g>
        </svg>
        <div className="hts-grain absolute inset-0" />
      </div>
      <div className="mx-auto w-full max-w-5xl px-6 pb-[200px] pt-[88px] sm:px-10 sm:pb-[210px] sm:pt-[96px]">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#8a4a1e]">Saltpan Overland</p>
        <h1 className="mt-4 max-w-[42rem] text-[32px] font-bold leading-[1.08] tracking-tight text-[#2b1a0c] sm:text-[56px]">Three days across the dry lakes, with camp set before dusk.</h1>
        <p className="mt-[18px] max-w-[32rem] text-lg leading-relaxed text-[#4d3420]">Guided four-wheel-drive trips for up to eight people. We carry the water, the shade and the spare tyres.</p>
        <a href="#" className="mt-7 inline-flex h-12 items-center rounded-lg bg-[#2b1a0c] px-6 text-[15px] font-semibold text-[#fbefdc] hover:bg-[#4a2d16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b1a0c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1dfc0]">See the route</a>
      </div>
    </section>
  );
}
