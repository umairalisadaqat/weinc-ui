import { useEffect, useRef, useState } from "react";

// The whole hero fills with water up to the fundraising level. The wave surface is a CSS mask:
// a one-period SVG wave tiled across a layer twice the width of the hero, which slides left by
// half its width so the tiles line up again at the end of every loop. No SVG in the DOM at all.
const LEVEL = 38; // percent of the goal raised, also how high the water stands
const RAISED = "£15,200";
const GOAL = "£40,000";

const css = `
.lqfl-root { --lqfl-level: 38%; }
.lqfl-water { position: absolute; left: 0; bottom: 0; width: 200%; min-width: 1800px; height: calc(var(--lqfl-level) + 40px); animation: lqfl-rise 1.4s cubic-bezier(.2,.7,.2,1) both; }
.lqfl-layer { position: absolute; left: 0; right: 0; bottom: 0; animation: lqfl-slide linear infinite; will-change: transform; }
.lqfl-back { top: 0; background: linear-gradient(180deg, #a7cbc4, #7aa8a3); animation-duration: 11s; animation-direction: reverse; -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 40' preserveAspectRatio='none'%3E%3Cpath d='M0 26.1C8 27.2 16 27.5 24 27.5C32 27.5 40 26.7 48 26.2C56 25.8 64 25.1 72 25C80 24.8 88 25.1 96 25.3C104 25.5 112 26.2 120 26.1C128 26 136 25.8 144 24.8C152 23.8 160 21.9 168 20.2C176 18.4 184 15.8 192 14.1C200 12.4 208 10.8 216 10.2C224 9.5 232 9.8 240 10.4C248 11 256 12.6 264 13.7C272 14.8 280 16.2 288 16.9C296 17.7 304 18 312 18.3C320 18.6 328 18.2 336 18.5C344 18.8 352 19.2 360 20.1C368 21.1 376 22.7 384 24.2C392 25.6 400 27.7 408 28.9C416 30 424 31 432 31C440 30.9 448 29.9 456 28.7C464 27.4 472 25.2 480 23.5C488 21.9 496 19.9 504 18.8C512 17.7 520 17.2 528 16.8C536 16.5 544 16.8 552 16.7C560 16.6 568 16.6 576 16.1C584 15.6 592 14.6 600 13.7C608 12.9 616 11.5 624 11C632 10.6 640 10.3 648 11C656 11.6 664 13.2 672 14.9C680 16.6 688 19.3 696 21.2C704 23 712 25 720 26.1L720 40L0 40Z'/%3E%3C/svg%3E") 0 0 / 50% 40px repeat-x, linear-gradient(#000,#000) 0 39px / 100% 100% no-repeat; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 40' preserveAspectRatio='none'%3E%3Cpath d='M0 26.1C8 27.2 16 27.5 24 27.5C32 27.5 40 26.7 48 26.2C56 25.8 64 25.1 72 25C80 24.8 88 25.1 96 25.3C104 25.5 112 26.2 120 26.1C128 26 136 25.8 144 24.8C152 23.8 160 21.9 168 20.2C176 18.4 184 15.8 192 14.1C200 12.4 208 10.8 216 10.2C224 9.5 232 9.8 240 10.4C248 11 256 12.6 264 13.7C272 14.8 280 16.2 288 16.9C296 17.7 304 18 312 18.3C320 18.6 328 18.2 336 18.5C344 18.8 352 19.2 360 20.1C368 21.1 376 22.7 384 24.2C392 25.6 400 27.7 408 28.9C416 30 424 31 432 31C440 30.9 448 29.9 456 28.7C464 27.4 472 25.2 480 23.5C488 21.9 496 19.9 504 18.8C512 17.7 520 17.2 528 16.8C536 16.5 544 16.8 552 16.7C560 16.6 568 16.6 576 16.1C584 15.6 592 14.6 600 13.7C608 12.9 616 11.5 624 11C632 10.6 640 10.3 648 11C656 11.6 664 13.2 672 14.9C680 16.6 688 19.3 696 21.2C704 23 712 25 720 26.1L720 40L0 40Z'/%3E%3C/svg%3E") 0 0 / 50% 40px repeat-x, linear-gradient(#000,#000) 0 39px / 100% 100% no-repeat; }
.lqfl-front { top: 12px; background: linear-gradient(180deg, #4d8a8a 0, #2c6266 22%, #163b40 100%); animation-duration: 7s; -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 40' preserveAspectRatio='none'%3E%3Cpath d='M0 31.2C8 31.1 16 30.5 24 29.5C32 28.5 40 26.8 48 25C56 23.3 64 20.9 72 19C80 17.1 88 15 96 13.6C104 12.2 112 11.2 120 10.8C128 10.5 136 10.8 144 11.4C152 12 160 13.4 168 14.6C176 15.8 184 17.5 192 18.7C200 19.9 208 21.1 216 22C224 22.9 232 23.5 240 24C248 24.5 256 24.7 264 25.1C272 25.5 280 25.8 288 26.4C296 26.9 304 27.7 312 28.3C320 29 328 29.9 336 30.4C344 30.9 352 31.4 360 31.2C368 31.1 376 30.5 384 29.5C392 28.5 400 26.8 408 25C416 23.3 424 20.9 432 19C440 17.1 448 15 456 13.6C464 12.2 472 11.2 480 10.8C488 10.5 496 10.8 504 11.4C512 12 520 13.4 528 14.6C536 15.8 544 17.5 552 18.7C560 19.9 568 21.1 576 22C584 22.9 592 23.5 600 24C608 24.5 616 24.7 624 25.1C632 25.5 640 25.8 648 26.4C656 26.9 664 27.7 672 28.3C680 29 688 29.9 696 30.4C704 30.9 712 31.4 720 31.2L720 40L0 40Z'/%3E%3C/svg%3E") 0 0 / 50% 40px repeat-x, linear-gradient(#000,#000) 0 39px / 100% 100% no-repeat; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 40' preserveAspectRatio='none'%3E%3Cpath d='M0 31.2C8 31.1 16 30.5 24 29.5C32 28.5 40 26.8 48 25C56 23.3 64 20.9 72 19C80 17.1 88 15 96 13.6C104 12.2 112 11.2 120 10.8C128 10.5 136 10.8 144 11.4C152 12 160 13.4 168 14.6C176 15.8 184 17.5 192 18.7C200 19.9 208 21.1 216 22C224 22.9 232 23.5 240 24C248 24.5 256 24.7 264 25.1C272 25.5 280 25.8 288 26.4C296 26.9 304 27.7 312 28.3C320 29 328 29.9 336 30.4C344 30.9 352 31.4 360 31.2C368 31.1 376 30.5 384 29.5C392 28.5 400 26.8 408 25C416 23.3 424 20.9 432 19C440 17.1 448 15 456 13.6C464 12.2 472 11.2 480 10.8C488 10.5 496 10.8 504 11.4C512 12 520 13.4 528 14.6C536 15.8 544 17.5 552 18.7C560 19.9 568 21.1 576 22C584 22.9 592 23.5 600 24C608 24.5 616 24.7 624 25.1C632 25.5 640 25.8 648 26.4C656 26.9 664 27.7 672 28.3C680 29 688 29.9 696 30.4C704 30.9 712 31.4 720 31.2L720 40L0 40Z'/%3E%3C/svg%3E") 0 0 / 50% 40px repeat-x, linear-gradient(#000,#000) 0 39px / 100% 100% no-repeat; }
.lqfl-sheen { position: absolute; left: 0; right: 0; top: 12px; height: 40px; background: linear-gradient(180deg, rgba(255,255,255,.18), transparent); animation: lqfl-slide 7s linear infinite; -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 40' preserveAspectRatio='none'%3E%3Cpath d='M0 31.2C8 31.1 16 30.5 24 29.5C32 28.5 40 26.8 48 25C56 23.3 64 20.9 72 19C80 17.1 88 15 96 13.6C104 12.2 112 11.2 120 10.8C128 10.5 136 10.8 144 11.4C152 12 160 13.4 168 14.6C176 15.8 184 17.5 192 18.7C200 19.9 208 21.1 216 22C224 22.9 232 23.5 240 24C248 24.5 256 24.7 264 25.1C272 25.5 280 25.8 288 26.4C296 26.9 304 27.7 312 28.3C320 29 328 29.9 336 30.4C344 30.9 352 31.4 360 31.2C368 31.1 376 30.5 384 29.5C392 28.5 400 26.8 408 25C416 23.3 424 20.9 432 19C440 17.1 448 15 456 13.6C464 12.2 472 11.2 480 10.8C488 10.5 496 10.8 504 11.4C512 12 520 13.4 528 14.6C536 15.8 544 17.5 552 18.7C560 19.9 568 21.1 576 22C584 22.9 592 23.5 600 24C608 24.5 616 24.7 624 25.1C632 25.5 640 25.8 648 26.4C656 26.9 664 27.7 672 28.3C680 29 688 29.9 696 30.4C704 30.9 712 31.4 720 31.2L720 40L0 40Z'/%3E%3C/svg%3E") 0 0 / 50% 40px repeat-x, linear-gradient(#000,#000) 0 39px / 100% 100% no-repeat; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 40' preserveAspectRatio='none'%3E%3Cpath d='M0 31.2C8 31.1 16 30.5 24 29.5C32 28.5 40 26.8 48 25C56 23.3 64 20.9 72 19C80 17.1 88 15 96 13.6C104 12.2 112 11.2 120 10.8C128 10.5 136 10.8 144 11.4C152 12 160 13.4 168 14.6C176 15.8 184 17.5 192 18.7C200 19.9 208 21.1 216 22C224 22.9 232 23.5 240 24C248 24.5 256 24.7 264 25.1C272 25.5 280 25.8 288 26.4C296 26.9 304 27.7 312 28.3C320 29 328 29.9 336 30.4C344 30.9 352 31.4 360 31.2C368 31.1 376 30.5 384 29.5C392 28.5 400 26.8 408 25C416 23.3 424 20.9 432 19C440 17.1 448 15 456 13.6C464 12.2 472 11.2 480 10.8C488 10.5 496 10.8 504 11.4C512 12 520 13.4 528 14.6C536 15.8 544 17.5 552 18.7C560 19.9 568 21.1 576 22C584 22.9 592 23.5 600 24C608 24.5 616 24.7 624 25.1C632 25.5 640 25.8 648 26.4C656 26.9 664 27.7 672 28.3C680 29 688 29.9 696 30.4C704 30.9 712 31.4 720 31.2L720 40L0 40Z'/%3E%3C/svg%3E") 0 0 / 50% 40px repeat-x, linear-gradient(#000,#000) 0 39px / 100% 100% no-repeat; }
@keyframes lqfl-slide { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
@keyframes lqfl-rise { from { transform: translate3d(0,16%,0); } to { transform: translate3d(0,0,0); } }
.lqfl-root[data-paused="true"] .lqfl-layer, .lqfl-root[data-paused="true"] .lqfl-sheen { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .lqfl-layer, .lqfl-water, .lqfl-sheen { animation: none !important; } }
`;

export default function LiquidFillLevelWave() {
  const ref = useRef<HTMLElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section ref={ref} data-paused={!onScreen} className="lqfl-root relative isolate min-h-[660px] overflow-hidden bg-[#eef2f0]" style={{ ["--lqfl-level" as string]: `${LEVEL}%` }}>
      <style>{css}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background:radial-gradient(80%_60%_at_80%_10%,#ffffff,transparent)]" />
        <div className="lqfl-water">
          <div className="lqfl-layer lqfl-back" />
          <div className="lqfl-layer lqfl-front" />
          <div className="lqfl-sheen" />
        </div>
      </div>
      <div className="mx-auto flex min-h-[660px] max-w-5xl flex-col px-6">
        <div className="pt-20 sm:pt-24">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2c5a5c]">Alder Hill Water Fund</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-[#10292c] sm:text-6xl">Help us fill the tank for Alder Hill school.</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#3a5052]">Every gift goes toward a rainwater tank and filter so pupils drink clean water all year.</p>
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pb-12">
          <p className="text-white">
            <span className="block text-5xl font-semibold tabular-nums sm:text-6xl">{LEVEL}%</span>
            <span className="mt-1 block text-base text-[#d3e3e0]">{RAISED} raised of {GOAL}</span>
          </p>
          <a href="#" className="inline-flex h-12 items-center rounded-full bg-[#f3efe4] px-7 text-sm font-semibold text-[#10292c] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1d4a4e]">Give to the fund</a>
        </div>
      </div>
    </section>
  );
}
