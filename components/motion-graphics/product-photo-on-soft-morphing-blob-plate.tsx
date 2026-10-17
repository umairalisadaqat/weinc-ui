import { useEffect, useRef } from "react";

// Colours and timings live at the top of the CSS below; every shape is fixed and only its transform or opacity moves.
const CSS = `
.m2plt { --m2plt-bg: #efe4d6; --m2plt-card: #fbf6ef; --m2plt-ink: #2a1d15; --m2plt-quiet: #66554a; --m2plt-btn: #2a1d15; }
.m2plt *, .m2plt *::before, .m2plt *::after { box-sizing: border-box; }
.m2plt { box-sizing: border-box; background: var(--m2plt-bg); color: var(--m2plt-ink); padding: clamp(32px, 6vw, 72px) 16px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
.m2plt-card { max-width: 980px; margin: 0 auto; display: grid; grid-template-columns: 1.15fr 1fr; align-items: center; gap: 40px; padding: clamp(20px, 4vw, 48px); border-radius: 28px; background: var(--m2plt-card); box-shadow: 0 30px 60px -40px rgba(60, 30, 10, .4); }
.m2plt-stage { position: relative; width: 100%; max-width: 440px; margin: 0 auto; aspect-ratio: 1; }
.m2plt-plate { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.m2plt-p { transform-box: fill-box; transform-origin: center; }
.m2plt-img { position: absolute; left: 21%; top: 19%; width: 58%; height: 58%; border-radius: 22px; object-fit: cover; background: #3a2116; box-shadow: 0 24px 34px -20px rgba(50, 20, 5, .6); }
.m2plt-kicker { margin: 0; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #8a4b2b; }
.m2plt-h { margin: 10px 0 0; font-size: clamp(28px, 3.6vw, 38px); font-weight: 600; letter-spacing: -.02em; }
.m2plt-p0 { margin: 14px 0 0; font-size: 16px; line-height: 1.6; color: var(--m2plt-quiet); }
.m2plt-dl { margin: 22px 0 0; border-top: 1px solid #e6d9c9; }
.m2plt-dl div { display: flex; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid #e6d9c9; font-size: 15px; }
.m2plt-dl dt { color: var(--m2plt-quiet); }
.m2plt-dl dd { margin: 0; font-weight: 500; }
.m2plt-btn { display: inline-flex; align-items: center; min-height: 48px; margin-top: 26px; padding: 0 24px; border-radius: 14px; background: var(--m2plt-btn); color: #fbf6ef; font-size: 15px; font-weight: 600; text-decoration: none; }
.m2plt-btn:hover { background: #4a3326; }
.m2plt-btn:focus-visible { outline: 2px solid var(--m2plt-btn); outline-offset: 3px; }
.m2plt-p1 { animation: m2plt-a 19s ease-in-out infinite; }
.m2plt-p2 { animation: m2plt-b 27s ease-in-out infinite; }
@keyframes m2plt-a { 0%, 100% { transform: rotate(-8deg) scale(1); } 50% { transform: rotate(28deg) scale(.95, 1.04); } }
@keyframes m2plt-b { 0%, 100% { transform: rotate(10deg) translate(2%, 1%) scale(1); } 50% { transform: rotate(-36deg) translate(-3%, -2%) scale(1.06, .97); } }
.m2plt[data-off] .m2plt-p { animation-play-state: paused; }
@media (max-width: 760px) { .m2plt-card { grid-template-columns: 1fr; gap: 24px; } .m2plt-stage { max-width: 320px; } }
@media (prefers-reduced-motion: reduce) { .m2plt-p { animation: none; } }
`;

export default function ProductPhotoOnSoftMorphingBlobPlate() {
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
<section ref={rootRef} className="m2plt" aria-labelledby="m2plt-h">
<style>{CSS}</style>
  <div className="m2plt-card">
    <div className="m2plt-stage">
      <svg className="m2plt-plate" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <radialGradient id="m2plt-g1r" cx="45%" cy="40%" r="65%"><stop offset="0" stopColor="#d9a277" /><stop offset="1" stopColor="#b8734a" /></radialGradient>
          <radialGradient id="m2plt-g2r" cx="60%" cy="55%" r="60%"><stop offset="0" stopColor="#ecc9a6" /><stop offset="1" stopColor="#e2b286" stopOpacity=".6" /></radialGradient>
        </defs>
        <path className="m2plt-p m2plt-p1" fill="url(#m2plt-g1r)" d="M191.4 116.9C192.2 134.6 171.4 134.1 151.1 144.9C130.8 155.6 89.6 184.1 69.5 181.3C49.5 178.4 38.0 147.8 30.9 127.7C23.7 107.6 17.5 76.9 26.7 60.8C36.0 44.7 66.7 34.8 86.6 31.1C106.5 27.4 128.8 24.3 146.3 38.5C163.7 52.8 190.5 99.1 191.4 116.9Z" />
        <path className="m2plt-p m2plt-p2" fill="url(#m2plt-g2r)" d="M169.8 95.1C170.9 115.8 148.4 148.8 130.2 160.6C112.1 172.3 79.2 173.1 61.0 165.4C42.8 157.6 23.0 134.9 21.0 114.1C19.1 93.3 32.1 53.7 49.2 40.7C66.3 27.7 103.4 26.9 123.5 36.0C143.6 45.0 168.6 74.3 169.8 95.1Z" />
      </svg>
      <img className="m2plt-img" src="https://images.pexels.com/photos/29904622/pexels-photo-29904622.jpeg?auto=compress&cs=tinysrgb&w=800" width="600" height="600" decoding="async" alt="A cream ceramic vase made of two stacked round discs, lit by low sun on a brown table" />
    </div>
    <div className="m2plt-info">
      <p className="m2plt-kicker">Orsa Ceramics</p>
      <h2 className="m2plt-h" id="m2plt-h">Two Stone Vase</h2>
      <p className="m2plt-p0">Two rounded halves joined while still soft, with a single narrow neck for one stem or a dried grass head.</p>
      <dl className="m2plt-dl">
        <div><dt>Height</dt><dd>24 cm</dd></div>
        <div><dt>Glaze</dt><dd>Matte bone</dd></div>
        <div><dt>Care</dt><dd>Hand wash only</dd></div>
      </dl>
      <a className="m2plt-btn" href="#">Ask about this piece</a>
    </div>
  </div>
</section>
  );
}
