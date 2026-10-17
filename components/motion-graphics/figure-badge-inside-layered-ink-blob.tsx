import { useEffect, useRef } from "react";

// Colours and timings live at the top of the CSS below; every shape is fixed and only its transform or opacity moves.
const CSS = `
.m2fig { --m2fig-bg: #f4f5f7; --m2fig-i1: #2c3c63; --m2fig-i2: #cfd6e6; --m2fig-i3: #2c3c63; --m2fig-ink: #1b2233; --m2fig-on: #f7f3ea; }
.m2fig *, .m2fig *::before, .m2fig *::after { box-sizing: border-box; }
.m2fig { box-sizing: border-box; background: var(--m2fig-bg); color: var(--m2fig-ink); padding: clamp(48px, 8vw, 96px) 20px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
.m2fig-in { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1.3fr 1fr; align-items: center; gap: 48px; }
.m2fig-kicker { margin: 0; color: #46557a; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
.m2fig-h { margin: 14px 0 0; font-size: clamp(28px, 3.8vw, 40px); font-weight: 600; line-height: 1.12; letter-spacing: -.02em; }
.m2fig-p { margin: 18px 0 0; max-width: 32rem; color: #4a5368; font-size: 16px; line-height: 1.65; }
.m2fig-list { margin: 22px 0 0; padding: 0; list-style: none; display: grid; gap: 8px; font-size: 15px; font-weight: 500; }
.m2fig-list li { display: flex; align-items: center; gap: 10px; }
.m2fig-list li::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--m2fig-i1); }
.m2fig-badge { position: relative; width: min(340px, 78vw); aspect-ratio: 1; margin: 0 auto; }
.m2fig-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.m2fig-b { transform-box: fill-box; transform-origin: center; }
.m2fig-b1 { fill: var(--m2fig-i1); }
.m2fig-b2 { fill: var(--m2fig-i2); }
.m2fig-b3 { fill: none; stroke: #c8b98f; stroke-width: .7; }
.m2fig-core { fill: var(--m2fig-i3); }
.m2fig-fig { position: absolute; inset: 0; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--m2fig-on); text-align: center; padding-top: 4%; }
.m2fig-num { font-family: Georgia, "Times New Roman", serif; font-size: clamp(44px, 7vw, 64px); line-height: 1; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.m2fig-unit { margin-top: 8px; font-size: 13px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: #d9d2c0; }
.m2fig-b1 { animation: m2fig-a 21s ease-in-out infinite; }
.m2fig-b2 { animation: m2fig-b 27s ease-in-out infinite; }
.m2fig-b3 { animation: m2fig-c 34s linear infinite; }
@keyframes m2fig-a { 0%, 100% { transform: rotate(0) scale(1); } 50% { transform: rotate(-48deg) scale(1.04, .97); } }
@keyframes m2fig-b { 0%, 100% { transform: rotate(20deg) scale(1.08); } 50% { transform: rotate(80deg) scale(1.02, 1.12); } }
@keyframes m2fig-c { to { transform: rotate(360deg); } }
.m2fig[data-off] .m2fig-b { animation-play-state: paused; }
@media (max-width: 760px) { .m2fig-in { grid-template-columns: 1fr; gap: 36px; } .m2fig-badge { width: min(280px, 78vw); } }
@media (prefers-reduced-motion: reduce) { .m2fig-b { animation: none; } }
`;

export default function FigureBadgeInsideLayeredInkBlob() {
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
<section ref={rootRef} className="m2fig" aria-labelledby="m2fig-h">
<style>{CSS}</style>
  <div className="m2fig-in">
    <div className="m2fig-copy">
      <p className="m2fig-kicker">Calder Street Bakery</p>
      <h2 className="m2fig-h" id="m2fig-h">Bread that is still warm when the shutters go up.</h2>
      <p className="m2fig-p">Sourdough, rye and a short list of morning buns, mixed the night before and baked in one deck oven behind the counter. Whatever is left at two goes to the shelter on Mill Lane.</p>
      <ul className="m2fig-list">
        <li>Open Tuesday to Sunday</li>
        <li>Loaves can be held until noon</li>
      </ul>
    </div>
    <div className="m2fig-badge">
      <svg className="m2fig-svg" viewBox="0 0 200 200" aria-hidden="true">
        <path className="m2fig-b m2fig-b2" d="M179.3 95.6C181.1 117.1 161.3 153.4 141.5 166.6C121.7 179.8 81.2 184.5 60.4 174.7C39.6 164.9 18.1 129.8 16.5 108.1C14.9 86.3 32.0 55.9 51.0 44.1C70.1 32.4 109.4 28.9 130.8 37.5C152.2 46.1 177.5 74.1 179.3 95.6Z" />
        <path className="m2fig-b m2fig-b1" d="M184.9 91.8C185.4 115.6 158.0 168.6 139.2 181.1C120.3 193.6 90.4 178.4 72.0 166.6C53.6 154.8 28.8 131.7 28.6 110.1C28.5 88.5 53.1 48.9 71.1 37.0C89.1 25.0 117.7 29.2 136.7 38.3C155.6 47.4 184.5 68.0 184.9 91.8Z" />
        <circle className="m2fig-core" cx="100" cy="102" r="56" />
        <path className="m2fig-b m2fig-b3" d="M184.0 89.2C185.7 112.1 151.2 156.5 126.5 166.2C101.7 175.9 50.7 165.9 35.6 147.2C20.5 128.5 22.5 73.9 35.9 54.2C49.3 34.5 91.2 23.0 115.9 28.8C140.6 34.7 182.2 66.3 184.0 89.2Z" />
      </svg>
      <p className="m2fig-fig"><span className="m2fig-num">4:30</span><span className="m2fig-unit">am, ovens lit</span></p>
    </div>
  </div>
</section>
  );
}
