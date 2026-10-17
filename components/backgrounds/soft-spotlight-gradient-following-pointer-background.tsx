import { useEffect, useRef } from "react";

// How quickly the lamp catches up with the pointer (0 to 1; smaller is lazier).
const EASE = 0.06;
// Seconds without pointer movement before the lamp starts drifting on its own.
const IDLE_AFTER = 2.5;

const css = `
.spl-hero{--spl-light:255,222,184;--spl-size:900px}
.spl-lamp{width:var(--spl-size);height:var(--spl-size);margin:calc(var(--spl-size) / -2) 0 0 calc(var(--spl-size) / -2);background:radial-gradient(closest-side,rgba(var(--spl-light),.34),rgba(var(--spl-light),.16) 38%,rgba(var(--spl-light),.05) 66%,transparent);mix-blend-mode:screen;will-change:transform;transform:translate3d(65vw,260px,0)}
.spl-pool{width:70vw;height:200px;margin-left:-35vw;background:radial-gradient(closest-side,rgba(var(--spl-light),.14),transparent);will-change:transform;transform:translate3d(65vw,0,0)}
.spl-sweep{background:linear-gradient(180deg,#23211e 0%,#2b2825 58%,#34302c 74%,#1c1a18 100%)}
.spl-grain{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23g%29'/%3E%3C/svg%3E");mix-blend-mode:overlay;opacity:.34}
`;

export default function SoftSpotlightFollowingPointer() {
  const rootRef = useRef<HTMLElement>(null);
  const lampRef = useRef<HTMLDivElement>(null);
  const poolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const lamp = lampRef.current;
    const pool = poolRef.current;
    if (!root || !lamp || !pool) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, x = 0, y = 0, tx = 0, ty = 0, lastInput = -1e9, raf = 0, onScreen = true;

    const place = () => {
      lamp.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      pool.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    };
    const measure = () => {
      const box = root.getBoundingClientRect();
      w = box.width; h = box.height;
      if (!x) { x = w * 0.68; y = h * 0.42; }
      if (still) { x = w * 0.7; y = h * 0.4; }
      place();
    };
    const frame = (now: number) => {
      const t = now / 1000;
      if (t - lastInput > IDLE_AFTER) {
        // Idle: wander slowly in a loose figure of eight.
        tx = w * (0.55 + 0.3 * Math.sin(t * 0.23));
        ty = h * (0.45 + 0.22 * Math.sin(t * 0.37 + 1.2));
      }
      x += (tx - x) * EASE;
      y += (ty - y) * EASE;
      place();
      if (onScreen) raf = requestAnimationFrame(frame);
    };
    const aim = (cx: number, cy: number) => {
      const box = root.getBoundingClientRect();
      tx = cx - box.left; ty = cy - box.top;
      lastInput = performance.now() / 1000;
    };
    const onMove = (e: PointerEvent) => aim(e.clientX, e.clientY);
    // Keyboard users: the lamp swings over whatever link or button has focus.
    const onFocus = (e: FocusEvent) => {
      const r = (e.target as HTMLElement).getBoundingClientRect();
      aim(r.left + r.width / 2, r.top + r.height / 2);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    measure();
    if (still) return () => ro.disconnect();
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("focusin", onFocus);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (onScreen) raf = requestAnimationFrame(frame);
    });
    io.observe(root);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("focusin", onFocus);
    };
  }, []);

  return (
    <section ref={rootRef} className="spl-hero relative isolate flex min-h-[600px] touch-pan-y items-center overflow-hidden bg-[#1b1a19]">
      <style>{css}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="spl-sweep absolute inset-0" />
        <div ref={lampRef} className="spl-lamp absolute left-0 top-0 rounded-full" />
        <div ref={poolRef} className="spl-pool absolute bottom-[-60px] left-0 rounded-full" />
        <div className="spl-grain absolute inset-0" />
      </div>
      <div className="mx-auto w-full max-w-5xl px-6 py-24 sm:px-10 sm:py-[110px]">
        <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-[#d9c6b0]">Studio Ashgrove &middot; Portraits</p>
        <h1 className="mt-[18px] max-w-[38rem] font-serif text-[34px] font-normal leading-[1.08] text-[#faf4ec] sm:text-[58px]">Portraits lit the old way, one lamp at a time.</h1>
        <p className="mt-5 max-w-[30rem] text-lg leading-relaxed text-[#d8cfc5]">An hour in a quiet studio, a canvas backdrop that has seen forty years of sittings, and prints you choose together on the day.</p>
        <a href="#" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#f4ebe0] px-[26px] text-[15px] font-semibold text-[#1f1b17] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4ebe0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1a19]">Book a sitting</a>
      </div>
    </section>
  );
}
