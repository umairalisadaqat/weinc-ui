import { useEffect, useRef } from "react";

function Arrow({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

export default function ArrowButtonWhereATwinArrowSlidesIn() {
  const root = useRef<HTMLElement>(null);

  // pauses the idle loop while the section is off screen
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([en]) => { el.toggleAttribute("data-paused", !en.isIntersecting); });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={root} className="w3arr bg-[#0f1d33] px-5 py-16 text-[#e8edf5] sm:py-24">
      <style>{`
        .w3arr-box { position: relative; overflow: hidden; display: inline-flex; flex-shrink: 0; }
        .w3arr-a, .w3arr-b { transition: transform .45s cubic-bezier(.65,0,.35,1); }
        .w3arr-b { position: absolute; inset: 0; margin: auto; transform: translateX(-160%); }
        .w3arr-btn:focus-visible .w3arr-a { transform: translateX(160%); }
        .w3arr-btn:focus-visible .w3arr-b { transform: none; }
        .w3arr-btn:focus-visible { outline: 2px solid #e8edf5; outline-offset: 4px; }
        @media (hover: hover) and (pointer: fine) {
          .w3arr-btn:hover .w3arr-a { transform: translateX(160%); }
          .w3arr-btn:hover .w3arr-b { transform: none; }
        }
        /* idle demo on the first button: swap, then reset while both arrows look identical */
        @keyframes w3arr-out { 0%, 45% { transform: none; } 62% { transform: translateX(160%); } 62.1%, 100% { transform: none; } }
        @keyframes w3arr-in { 0%, 45% { transform: translateX(-160%); } 62% { transform: none; } 62.1%, 100% { transform: translateX(-160%); } }
        .w3arr-demo .w3arr-a { animation: w3arr-out 2.8s cubic-bezier(.65,0,.35,1) infinite; }
        .w3arr-demo .w3arr-b { animation: w3arr-in 2.8s cubic-bezier(.65,0,.35,1) infinite; }
        .w3arr:hover .w3arr-demo .w3arr-a, .w3arr:hover .w3arr-demo .w3arr-b,
        .w3arr:focus-within .w3arr-demo .w3arr-a, .w3arr:focus-within .w3arr-demo .w3arr-b { animation: none; }
        .w3arr[data-paused] .w3arr-a, .w3arr[data-paused] .w3arr-b { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .w3arr-demo .w3arr-a, .w3arr-demo .w3arr-b { animation: none; }
          .w3arr-a, .w3arr-b { transition: none; }
        }
      `}</style>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9fb3d1]">Harbour Tide Sailing School</p>
        <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">Learn to sail a dinghy in four Saturday mornings.</h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#b9c6da]">Small boats, two learners per instructor, and a warm clubhouse to dry off in. Lifejackets and wetsuits are on us.</p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
          <a href="#" className="w3arr-btn w3arr-demo inline-flex h-14 items-center gap-4 rounded-full bg-[#e8edf5] pl-7 pr-2 text-base font-semibold text-[#0f1d33]">
            Choose a start date
            <span className="w3arr-box h-10 w-10 items-center justify-center rounded-full bg-[#0f1d33] text-[#e8edf5]">
              <Arrow className="w3arr-a h-5 w-5" />
              <Arrow className="w3arr-b h-5 w-5" />
            </span>
          </a>
          <a href="#" className="w3arr-btn inline-flex h-12 items-center gap-2 text-base font-semibold text-[#e8edf5]">
            See what a lesson covers
            <span className="w3arr-box h-5 w-5">
              <Arrow className="w3arr-a h-5 w-5" />
              <Arrow className="w3arr-b h-5 w-5" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
