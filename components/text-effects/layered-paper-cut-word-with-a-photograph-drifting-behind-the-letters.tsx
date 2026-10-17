import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// The word that is cut through the sheets, and the pictures that pass behind it.
const WORD = "BLOOM";
const CAPTION = "Four sheets of card, one word";
const photos = [
  {
    src: "https://images.pexels.com/photos/33966527/pexels-photo-33966527.jpeg?auto=compress&cs=tinysrgb&w=1400",
    alt: "Pink chrysanthemums in full bloom, photographed close up",
  },
  {
    src: "https://images.pexels.com/photos/38017379/pexels-photo-38017379.jpeg?auto=compress&cs=tinysrgb&w=1400",
    alt: "Red poppies and wildflowers in a green meadow",
  },
  {
    src: "https://images.pexels.com/photos/33978371/pexels-photo-33978371.jpeg?auto=compress&cs=tinysrgb&w=1400",
    alt: "A lilac chrysanthemum surrounded by bright yellow flowers",
  },
];

// Top sheet first. `grow` widens the cut (in drawing units) so each sheet above shows a rim of the one below.
const sheets = [
  { fill: "#fbfaf5", grow: 27, depth: 0 },
  { fill: "#f5f2ea", grow: 18, depth: 1 },
  { fill: "#eeeadf", grow: 9, depth: 2 },
  { fill: "#e6e1d3", grow: 0, depth: 3 },
];
const VB_W = 1200;
const VB_H = 560;
const SECONDS_PER_PHOTO = 4.2;

export default function LayeredPaperCutWord() {
  const reduce = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const boxRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const photoRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);

  // Pictures change on a timer; with motion reduced the first one stays.
  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => {
      if (!document.hidden) setShown((n) => (n + 1) % photos.length);
    }, SECONDS_PER_PHOTO * 1000);
    return () => window.clearInterval(t);
  }, [reduce]);

  // Looking around the box: deeper sheets slide further, the photograph furthest of all.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || reduce) return;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    let t = 0;
    const view = { x: 0, y: 0, vx: 0, vy: 0 };
    const pointer = { on: false, x: 0, y: 0 };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      // Idle: a slow look from side to side, as if someone were walking past the frame.
      const tx = pointer.on ? pointer.x : Math.sin(t * 0.9) * 0.85;
      const ty = pointer.on ? pointer.y : Math.sin(t * 0.55 + 1) * 0.45;
      // A soft spring, so the sheets lag and settle instead of tracking the pointer rigidly.
      view.vx += ((tx - view.x) * 60 - view.vx * 13) * dt;
      view.vy += ((ty - view.y) * 60 - view.vy * 13) * dt;
      view.x += view.vx * dt;
      view.y += view.vy * dt;
      const unit = box.clientWidth / 100;
      for (let i = 0; i < sheets.length; i++) {
        const el = layerRefs.current[i];
        if (!el) continue;
        const k = sheets[i].depth * 0.34 * unit;
        el.style.transform = `translate3d(${(-view.x * k).toFixed(2)}px, ${(-view.y * k).toFixed(2)}px, 0)`;
      }
      if (tiltRef.current) {
        // the whole stack leans a few degrees toward the viewer's side
        tiltRef.current.style.transform = `perspective(1400px) rotateY(${(view.x * 5).toFixed(2)}deg) rotateX(${(-view.y * 4).toFixed(2)}deg)`;
      }
      if (photoRef.current) {
        const k = 2.3 * unit;
        photoRef.current.style.transform = `translate3d(${(-view.x * k).toFixed(2)}px, ${(-view.y * k).toFixed(2)}px, 0)`;
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      start();
    });
    io.observe(box);
    const onVis = () => start();
    document.addEventListener("visibilitychange", onVis);
    const move = (ev: PointerEvent) => {
      const r = box.getBoundingClientRect();
      pointer.on = true;
      pointer.x = Math.max(-1, Math.min(1, ((ev.clientX - r.left) / r.width) * 2 - 1));
      pointer.y = Math.max(-1, Math.min(1, ((ev.clientY - r.top) / r.height) * 2 - 1));
    };
    const leave = () => {
      pointer.on = false;
    };
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerdown", move);
    box.addEventListener("pointerleave", leave);
    box.addEventListener("pointercancel", leave);
    start();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerdown", move);
      box.removeEventListener("pointerleave", leave);
      box.removeEventListener("pointercancel", leave);
    };
  }, [reduce]);

  return (
    <section className="relative flex min-h-[620px] w-full flex-col items-center justify-center overflow-hidden bg-[#1f3329] px-4 py-14 sm:px-8 sm:py-20">
      <style>{`
        @keyframes layered-paper-cut-word-drift { 0% { transform: scale(1.14) translate3d(-2.5%, 1.5%, 0); } 100% { transform: scale(1.24) translate3d(2.5%, -2.5%, 0); } }
        .layered-paper-cut-word-photo { animation: layered-paper-cut-word-drift 9s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .layered-paper-cut-word-photo { animation: none; transform: scale(1.16); } }
      `}</style>

      {/* The word itself, for screen readers and search. The cut sheets below are decoration. */}
      <h2 className="sr-only">{WORD.charAt(0) + WORD.slice(1).toLowerCase()}</h2>

      <div
        ref={boxRef}
        className="relative w-full max-w-[940px] [container-type:inline-size] [touch-action:pan-y]"
        style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
      >
        {/* shadow the whole stack throws on the table */}
        <div aria-hidden="true" className="absolute inset-x-[3%] bottom-[-5%] top-[12%] rounded-[50%] bg-black/55 blur-3xl" />

        <div ref={tiltRef} className="absolute inset-0 will-change-transform">
        {/* the edges of the lower sheets, seen along the bottom of the stack */}
        {[3, 2, 1].map((n) => (
          <div
            key={n}
            aria-hidden="true"
            className="absolute inset-0 rounded-[6px] shadow-[0_1px_0_rgba(0,0,0,0.22)]"
            style={{ transform: `translateY(${n * 3}px)`, background: sheets[n].fill, filter: `brightness(${1 - n * 0.045})` }}
          />
        ))}
        <div className="absolute inset-0 overflow-hidden rounded-[6px] bg-[#2a1a12]">
          {/* the photograph at the back of the box */}
          <div ref={photoRef} className="absolute inset-0 will-change-transform">
            {photos.map((p, i) => (
              <img
                key={p.src}
                src={p.src}
                alt={p.alt}
                loading={i === 0 ? "eager" : "lazy"}
                width={1400}
                height={933}
                draggable={false}
                className="layered-paper-cut-word-photo absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out motion-reduce:transition-none"
                style={{ opacity: i === shown ? 1 : 0, animationDelay: `${-i * 3}s`, animationPlayState: i === shown || i === (shown + photos.length - 1) % photos.length ? "running" : "paused" }}
              />
            ))}
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(0,0,0,0)_40%,rgba(20,10,0,0.3)_100%)]" />
          </div>

          {/* the sheets, deepest first so the top sheet is painted last */}
          {[...sheets].reverse().map((s) => {
            const i = sheets.indexOf(s);
            const maskId = `${uid}-cut-${i}`;
            const grainId = `${uid}-grain-${i}`;
            const lightId = `${uid}-light-${i}`;
            return (
              <div
                key={i}
                ref={(el) => {
                  layerRefs.current[i] = el;
                }}
                aria-hidden="true"
                className="absolute -inset-[4%] will-change-transform"
                style={{
                  filter:
                    i === 0
                      ? "drop-shadow(0 0.2cqw 0.2cqw rgba(38,30,18,0.34)) drop-shadow(0 0.95cqw 1.05cqw rgba(38,30,18,0.3))"
                      : "drop-shadow(0 0.2cqw 0.2cqw rgba(38,30,18,0.36)) drop-shadow(0 0.85cqw 0.95cqw rgba(38,30,18,0.32))",
                }}
              >
                <svg viewBox={`${-VB_W * 0.04} ${-VB_H * 0.04} ${VB_W * 1.08} ${VB_H * 1.08}`} preserveAspectRatio="none" className="block h-full w-full">
                  <defs>
                    <mask id={maskId} maskUnits="userSpaceOnUse" x={-VB_W * 0.04} y={-VB_H * 0.04} width={VB_W * 1.08} height={VB_H * 1.08}>
                      <rect x={-VB_W * 0.04} y={-VB_H * 0.04} width={VB_W * 1.08} height={VB_H * 1.08} fill="#fff" />
                      <text
                        x={VB_W / 2}
                        y={VB_H * 0.705}
                        textAnchor="middle"
                        textLength={VB_W * 0.8}
                        lengthAdjust="spacingAndGlyphs"
                        fontSize={300}
                        fontWeight={900}
                        fontFamily="'Arial Black', 'Helvetica Neue', Impact, 'Segoe UI', system-ui, sans-serif"
                        fill="#000"
                        stroke="#000"
                        strokeWidth={s.grow * 2}
                        strokeLinejoin="miter"
                        strokeMiterlimit={6}
                      >
                        {WORD}
                      </text>
                    </mask>
                    <filter id={grainId} x="0" y="0" width="100%" height="100%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={11 + i * 7} />
                      <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.26  0 0 0 0 0.2  0 0 0 0.5 0" />
                    </filter>
                    <linearGradient id={lightId} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
                      <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
                      <stop offset="1" stopColor="#4a3c22" stopOpacity="0.12" />
                    </linearGradient>
                  </defs>
                  <g mask={`url(#${maskId})`}>
                    <rect x={-VB_W * 0.04} y={-VB_H * 0.04} width={VB_W * 1.08} height={VB_H * 1.08} fill={s.fill} />
                    <rect x={-VB_W * 0.04} y={-VB_H * 0.04} width={VB_W * 1.08} height={VB_H * 1.08} filter={`url(#${grainId})`} opacity="0.35" />
                    <rect x={-VB_W * 0.04} y={-VB_H * 0.04} width={VB_W * 1.08} height={VB_H * 1.08} fill={`url(#${lightId})`} />
                  </g>
                </svg>
              </div>
            );
          })}
          {/* a soft bevel around the top sheet */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[6px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" />
        </div>
        </div>
      </div>

      <p className="relative mt-9 text-center text-[12px] uppercase tracking-[0.24em] text-[#a9bcae] sm:mt-12">{CAPTION}</p>
    </section>
  );
}
