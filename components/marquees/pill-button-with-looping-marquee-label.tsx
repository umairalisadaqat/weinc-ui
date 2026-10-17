import { useEffect, useRef, useState } from "react";

const LABEL = "Book a fitting";
const SPEED = 4; // seconds for the label to loop once while the button is lit
const IDLE_ON = 2600; // ms the idle demo keeps the button lit, then rests the same time

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className="shrink-0 fill-none stroke-current" strokeWidth="1.8">
      <path d="M4 10h11M11 5.5 15.5 10 11 14.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PillButtonWithLoopingMarqueeLabel() {
  const root = useRef<HTMLElement>(null);
  const [demo, setDemo] = useState(true);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el || live) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDemo(false); return; }
    // idle demo: light the button now and then until a real pointer or focus arrives; only while visible
    let timer = 0;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) timer = window.setInterval(() => setDemo((d) => !d), IDLE_ON);
    });
    io.observe(el);
    const stop = () => setLive(true);
    el.addEventListener("pointerenter", stop);
    el.addEventListener("focusin", stop);
    return () => { clearInterval(timer); io.disconnect(); el.removeEventListener("pointerenter", stop); el.removeEventListener("focusin", stop); };
  }, [live]);

  return (
    <section ref={root} className="w3btn bg-[#e9eef3] px-5 py-20 text-[#13293d] sm:py-24" style={{ ["--w3btn-speed" as string]: `${SPEED}s` }}>
      <style>{`
        .w3btn-pill { position: relative; display: inline-flex; height: 60px; min-width: 240px; overflow: hidden; border-radius: 999px; background: #13293d; color: #f2f5f8; box-shadow: 0 14px 30px -18px rgba(19,41,61,.7); }
        .w3btn-still, .w3btn-run { position: absolute; inset: 0; display: flex; align-items: center; transition: transform .45s cubic-bezier(.2,.8,.2,1), opacity .3s ease; }
        .w3btn-still { justify-content: center; gap: 10px; padding: 0 32px; }
        .w3btn-run { overflow: hidden; transform: translateY(100%); opacity: 0; background: #b8d3e8; color: #13293d; }
        .w3btn-track { display: flex; width: max-content; animation: w3btn-run var(--w3btn-speed) linear infinite; animation-play-state: paused; }
        .w3btn-group { display: flex; align-items: center; gap: 14px; padding-right: 14px; white-space: nowrap; font-weight: 600; }
        .w3btn-on .w3btn-still, .w3btn-pill:focus-visible .w3btn-still { transform: translateY(-100%); opacity: 0; }
        .w3btn-on .w3btn-run, .w3btn-pill:focus-visible .w3btn-run { transform: none; opacity: 1; }
        .w3btn-on .w3btn-track, .w3btn-pill:focus-visible .w3btn-track { animation-play-state: running; }
        @media (hover: hover) {
          .w3btn-pill:hover .w3btn-still { transform: translateY(-100%); opacity: 0; }
          .w3btn-pill:hover .w3btn-run { transform: none; opacity: 1; }
          .w3btn-pill:hover .w3btn-track { animation-play-state: running; }
        }
        .w3btn-pill:focus-visible { outline: 2px solid #13293d; outline-offset: 4px; }
        @keyframes w3btn-run { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .w3btn-still, .w3btn-run { transition: none; }
          .w3btn-track { animation: none; padding-left: 24px; }
        }
      `}</style>
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#3d5a74]">Mercer Row Tailoring</p>
        <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">A suit cut to you takes three fittings and about six weeks.</h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#3d5a74]">Bring a jacket you already love. We measure, choose cloth together and pin a first try-on the same afternoon.</p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a href="#" className={`w3btn-pill ${!live && demo ? "w3btn-on" : ""}`}>
            <span className="w3btn-still">{LABEL}<Arrow /></span>
            <span className="w3btn-run" aria-hidden="true">
              <span className="w3btn-track">
                {[0, 1].map((k) => (
                  <span key={k} className="w3btn-group">
                    {[0, 1, 2].map((n) => <span key={n} className="flex items-center gap-3.5">{LABEL}<Arrow /></span>)}
                  </span>
                ))}
              </span>
            </span>
          </a>
          <a href="#" className="inline-flex h-12 items-center rounded-full px-5 text-sm font-semibold text-[#13293d] underline decoration-[#8aa3b8] underline-offset-4 hover:decoration-[#13293d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#13293d]">See cloths and prices</a>
        </div>
      </div>
    </section>
  );
}
