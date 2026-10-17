import { useEffect, useRef } from "react";

// Colours and timings live at the top of the CSS below; every shape is fixed and only its transform or opacity moves.
const CSS = `
.m2rng { --m2rng-bg: #22252a; --m2rng-card: #2c3036; --m2rng-l1: #d6b47a; --m2rng-l2: #9fb0a3; --m2rng-l3: #e8e2d6; --m2rng-ink: #f2eee6; --m2rng-btn: #d6b47a; }
.m2rng *, .m2rng *::before, .m2rng *::after { box-sizing: border-box; }
.m2rng { box-sizing: border-box; background: var(--m2rng-bg); color: var(--m2rng-ink); padding: clamp(40px, 7vw, 88px) 16px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
.m2rng-card { max-width: 880px; margin: 0 auto; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: clamp(24px, 5vw, 56px); padding: clamp(24px, 4vw, 44px); border-radius: 24px; background: var(--m2rng-card); }
.m2rng-stage { position: relative; width: 240px; aspect-ratio: 1; margin: 0 auto; }
.m2rng-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.m2rng-o { fill: none; stroke-width: 1.5; stroke-linecap: round; transform-box: fill-box; transform-origin: center; }
.m2rng-halo { fill: #383e46; }
.m2rng-o1 { stroke: var(--m2rng-l1); }
.m2rng-o2 { stroke: var(--m2rng-l2); opacity: .8; }
.m2rng-o3 { stroke: var(--m2rng-l3); opacity: .45; }
.m2rng-o1 { animation: m2rng-a 18s linear infinite; }
.m2rng-o2 { animation: m2rng-b 26s linear infinite; }
.m2rng-o3 { animation: m2rng-c 22s ease-in-out infinite; }
@keyframes m2rng-a { to { transform: rotate(360deg); } }
@keyframes m2rng-b { from { transform: rotate(40deg) scale(.94); } to { transform: rotate(-320deg) scale(.94); } }
@keyframes m2rng-c { 0%, 100% { transform: rotate(0) scale(.86); } 50% { transform: rotate(120deg) scale(.92, .84); } }
.m2rng[data-off] .m2rng-o { animation-play-state: paused; }
.m2rng-play { position: absolute; left: 50%; top: 50%; width: 88px; height: 88px; margin: -44px 0 0 -44px; display: grid; place-items: center; border-radius: 50%; background: var(--m2rng-btn); color: #22252a; transition: transform .25s ease; }
.m2rng-play svg { width: 30px; height: 30px; margin-left: 4px; fill: currentColor; }
.m2rng-play:hover { transform: scale(1.05); }
.m2rng-play:focus-visible { outline: 2px solid var(--m2rng-l3); outline-offset: 5px; }
.m2rng-kicker { margin: 0; color: var(--m2rng-l1); font-size: 13px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
.m2rng-h { margin: 12px 0 0; font-size: clamp(26px, 3.4vw, 34px); font-weight: 600; line-height: 1.15; letter-spacing: -.02em; }
.m2rng-p { margin: 14px 0 0; color: #c9c5bc; font-size: 16px; line-height: 1.6; }
.m2rng-meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0 0; font-size: 13px; color: #c9c5bc; }
.m2rng-meta span { padding: 6px 12px; border: 1px solid #454a52; border-radius: 999px; }
@media (max-width: 680px) { .m2rng-card { grid-template-columns: 1fr; } .m2rng-stage { width: 200px; } }
@media (prefers-reduced-motion: reduce) { .m2rng-o { animation: none; } .m2rng-o2 { transform: rotate(40deg) scale(.94); } .m2rng-o3 { transform: scale(.86); } .m2rng-play { transition: none; } }
`;

export default function MorphingOutlineRingAroundListenButton() {
  const rootRef = useRef<HTMLElement>(null);

  // Pause the keyframes whenever the piece is scrolled out of view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) root.removeAttribute("data-off");
      else root.setAttribute("data-off", "");
    });
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
<section ref={rootRef} className="m2rng" aria-labelledby="m2rng-h">
<style>{CSS}</style>
  <div className="m2rng-card">
    <div className="m2rng-stage">
      <svg className="m2rng-svg" viewBox="0 0 200 200" aria-hidden="true">
        <circle className="m2rng-halo" cx="100" cy="100" r="74" />
        <path className="m2rng-o m2rng-o1" d="M168.2 92.8C168.2 113.2 153.3 145.9 137.5 159.2C121.7 172.5 94.3 184.8 73.5 172.5C52.7 160.2 13.0 108.3 12.6 85.2C12.1 62.2 50.0 42.3 70.8 34.2C91.7 26.1 121.5 27.1 137.7 36.8C153.9 46.6 168.2 72.4 168.2 92.8Z" />
        <path className="m2rng-o m2rng-o2" d="M181.7 98.4C180.8 122.9 154.8 155.5 138.1 169.2C121.4 182.9 99.0 184.6 81.4 180.4C63.8 176.1 42.4 164.2 32.6 143.7C22.7 123.2 15.9 76.3 22.4 57.5C29.0 38.8 51.8 37.0 72.0 31.2C92.1 25.3 125.1 11.2 143.4 22.4C161.7 33.6 182.6 74.0 181.7 98.4Z" />
        <path className="m2rng-o m2rng-o3" d="M177.9 102.2C177.2 126.9 155.8 151.5 133.8 163.0C111.8 174.5 63.3 182.4 46.0 171.2C28.7 159.9 27.1 118.4 29.9 95.7C32.8 72.9 45.0 48.1 63.0 34.7C81.1 21.3 119.1 3.9 138.2 15.2C157.4 26.4 178.7 77.6 177.9 102.2Z" />
      </svg>
      <a className="m2rng-play" href="#" aria-label="Listen to episode 14, Hedges and the second hay cut">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
      </a>
    </div>
    <div className="m2rng-info">
      <p className="m2rng-kicker">Ashgrove Farm Notes &middot; Episode 14</p>
      <h2 className="m2rng-h" id="m2rng-h">Hedges and the second hay cut</h2>
      <p className="m2rng-p">Maren walks the north boundary with the hedge layer from the next valley and talks through which stems to keep, which to cut and why the birds care.</p>
      <p className="m2rng-meta"><span>38 minutes</span><span>Recorded in the field</span></p>
    </div>
  </div>
</section>
  );
}
