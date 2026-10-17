import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const EASE = 0.1; // how softly the light trails the pointer (0 to 1)
const RADIUS = 260; // spotlight radius in px
const PHOTO = "https://images.pexels.com/photos/2946621/pexels-photo-2946621.jpeg?auto=compress&cs=tinysrgb&w=1600";

export default function PointerSpotlightRevealingADimmedCellarPhoto() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current, shade = shadeRef.current;
    if (!root || !shade || reduce) return;
    let W = root.clientWidth, H = root.clientHeight, x = W * 0.7, y = H * 0.4, tx = x, ty = y;
    let live = false, frame = 0, idle = 0, t0 = performance.now();
    const place = () => { shade.style.transform = `translate(${x}px, ${y}px)`; };
    const at = (e: PointerEvent) => { const r = root.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; };
    place();
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) {
      // Touch: the light rests in one spot and moves to wherever someone taps.
      const onTap = (e: PointerEvent) => { at(e); x = tx; y = ty; shade.style.transition = "transform .6s ease"; place(); };
      root.addEventListener("pointerdown", onTap);
      return () => root.removeEventListener("pointerdown", onTap);
    }
    const loop = (now: number) => {
      W = root.clientWidth; H = root.clientHeight;
      if (!live) {
        const t = (now - t0) / 1000;
        tx = W * (0.68 + 0.2 * Math.sin(t * 0.5)); ty = H * (0.45 + 0.25 * Math.sin(t * 0.8 + 1));
      }
      x += (tx - x) * EASE; y += (ty - y) * EASE; place();
      frame = requestAnimationFrame(loop);
    };
    const start = () => { if (!frame) frame = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const onMove = (e: PointerEvent) => { if (e.pointerType !== "touch") { at(e); live = true; clearTimeout(idle); } };
    const onLeave = () => { idle = window.setTimeout(() => { live = false; t0 = performance.now(); }, 1500); };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(root);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      stop(); io.disconnect(); clearTimeout(idle);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce]);

  const btn = "inline-flex min-h-[44px] items-center rounded px-[22px] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5ede2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0907]";

  return (
    <section ref={rootRef} className="relative flex min-h-[600px] items-end overflow-hidden bg-[#0e0907] text-[#f5ede2]">
      <style>{`
        .w2spt-shade { position: absolute; left: -100%; top: -100%; width: 200%; height: 200%; pointer-events: none; will-change: transform;
          background: radial-gradient(circle ${RADIUS}px at 50% 50%, rgba(14,9,7,0) 0%, rgba(14,9,7,.2) 45%, rgba(14,9,7,.9) 100%); }
        @media (prefers-reduced-motion: reduce) { .w2spt-shade { display: none; } }
      `}</style>
      <img src={PHOTO} alt="Oak wine barrels with red wine stains racked four high on steel frames in a cellar" loading="lazy" width={1600} height={1084} className="absolute inset-0 h-full w-full object-cover" />
      <div ref={shadeRef} className="w2spt-shade" aria-hidden="true" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(14,9,7,.95)_0%,rgba(14,9,7,.85)_55%,rgba(14,9,7,.1)_100%)] sm:bg-[linear-gradient(90deg,rgba(14,9,7,.92)_0%,rgba(14,9,7,.6)_38%,rgba(14,9,7,0)_62%)]" />
      <div className="relative max-w-[30rem] px-5 py-12 sm:px-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e6c48f]">Harrow Ridge Cellars</p>
        <h2 className="mt-3.5 font-serif text-[clamp(2rem,4.6vw,3rem)] font-normal leading-[1.1]">The barrel room opens for evening tastings</h2>
        <p className="mt-4 leading-relaxed text-[#e3d8ca]">Walk the racks by lamplight with our cellar hand, then taste three wines drawn straight from the cask.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#" className={`${btn} bg-[#e6c48f] text-[#1c130d] hover:bg-[#f0d4a6]`}>Book an evening</a>
          <a href="#" className={`${btn} border border-[#f5ede2]/40 bg-[#140d0a]/55 hover:bg-[#140d0a]/80`}>See the wines</a>
        </div>
        <p className="mt-5 text-[13px] text-[#cfc2b2]">Thursday to Saturday, from six</p>
      </div>
    </section>
  );
}
