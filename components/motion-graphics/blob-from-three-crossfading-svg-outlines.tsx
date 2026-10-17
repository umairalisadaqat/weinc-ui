import { useEffect, useRef } from "react";

// Colours and timings live at the top of the CSS below; every shape is fixed and only its transform or opacity moves.
const CSS = `
.m2xfd { --m2xfd-bg: #f7f1ea; --m2xfd-f1: #e9c4b8; --m2xfd-f2: #f0d3bf; --m2xfd-f3: #e4b2a6; --m2xfd-ink: #2a2421; --m2xfd-btn: #3f5a3c; }
.m2xfd *, .m2xfd *::before, .m2xfd *::after { box-sizing: border-box; }
.m2xfd { box-sizing: border-box; background: var(--m2xfd-bg); color: var(--m2xfd-ink); padding: clamp(48px, 8vw, 96px) 20px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
.m2xfd-in { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1.2fr; align-items: center; gap: 48px; }
.m2xfd-art { width: min(360px, 74vw); aspect-ratio: 1; margin: 0 auto; }
.m2xfd-svg { width: 100%; height: 100%; overflow: visible; }
.m2xfd-base { fill: var(--m2xfd-f2); opacity: .35; }
.m2xfd-s { transform-box: fill-box; transform-origin: center; opacity: 0; }
.m2xfd-s1 { fill: var(--m2xfd-f1); opacity: 1; }
.m2xfd-s2 { fill: var(--m2xfd-f2); }
.m2xfd-s3 { fill: var(--m2xfd-f3); }
.m2xfd-s { animation: m2xfd-x 12s ease-in-out infinite; }
.m2xfd-s2 { animation-delay: -8s; }
.m2xfd-s3 { animation-delay: -4s; }
@keyframes m2xfd-x {
0% { opacity: 1; transform: rotate(0) scale(1); }
30% { opacity: 1; transform: rotate(8deg) scale(1.02); }
46% { opacity: 0; transform: rotate(14deg) scale(1.03); }
84% { opacity: 0; transform: rotate(-10deg) scale(.98); }
100% { opacity: 1; transform: rotate(0) scale(1); }
}
.m2xfd[data-off] .m2xfd-s { animation-play-state: paused; }
.m2xfd-kicker { margin: 0; color: #8a4a3a; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
.m2xfd-h { margin: 14px 0 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(28px, 3.8vw, 40px); line-height: 1.15; }
.m2xfd-p { margin: 16px 0 0; max-width: 32rem; color: #5a4e48; font-size: 16px; line-height: 1.65; }
.m2xfd-form { margin-top: 28px; max-width: 30rem; }
.m2xfd-label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 600; }
.m2xfd-row { display: flex; gap: 8px; }
.m2xfd-input { flex: 1; min-width: 0; height: 48px; padding: 0 14px; border: 1px solid #c9b9ab; border-radius: 12px; background: #fffdf9; color: var(--m2xfd-ink); font: inherit; font-size: 16px; }
.m2xfd-input::placeholder { color: #7d716a; }
.m2xfd-input:focus-visible { outline: 2px solid var(--m2xfd-btn); outline-offset: 1px; border-color: var(--m2xfd-btn); }
.m2xfd-btn { height: 48px; padding: 0 22px; border: 0; border-radius: 12px; background: var(--m2xfd-btn); color: #fff; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
.m2xfd-btn:hover { background: #2f452d; }
.m2xfd-btn:focus-visible { outline: 2px solid var(--m2xfd-btn); outline-offset: 3px; }
.m2xfd-note { margin: 10px 0 0; color: #6a5d56; font-size: 13px; }
@media (max-width: 760px) { .m2xfd-in { grid-template-columns: 1fr; gap: 28px; } .m2xfd-art { width: min(260px, 70vw); } }
@media (max-width: 400px) { .m2xfd-row { flex-direction: column; } .m2xfd-input { flex: none; width: 100%; } }
@media (prefers-reduced-motion: reduce) { .m2xfd-s { animation: none; } }
`;

export default function BlobFromThreeCrossfadingSvgOutlines() {
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
<section ref={rootRef} className="m2xfd" aria-labelledby="m2xfd-h">
<style>{CSS}</style>
  <div className="m2xfd-in">
    <div className="m2xfd-art" aria-hidden="true">
      <svg className="m2xfd-svg" viewBox="0 0 200 200">
        <path className="m2xfd-base" d="M186.9 104.3C187.6 127.0 168.2 164.9 148.9 178.8C129.6 192.7 89.7 192.8 71.0 187.5C52.2 182.2 43.0 169.8 36.5 147.0C29.9 124.2 21.9 69.9 31.7 50.6C41.5 31.3 76.8 32.6 95.6 31.3C114.4 29.9 129.4 30.4 144.6 42.6C159.8 54.8 186.1 81.6 186.9 104.3Z" />
        <path className="m2xfd-s m2xfd-s1" d="M184.5 99.1C182.1 123.2 139.8 158.1 117.1 167.6C94.3 177.1 63.7 174.9 48.1 156.1C32.5 137.2 9.7 76.6 23.6 54.4C37.5 32.3 104.7 15.9 131.6 23.3C158.4 30.8 186.9 75.1 184.5 99.1Z" />
        <path className="m2xfd-s m2xfd-s2" d="M176.3 98.9C178.4 125.5 161.9 171.2 140.1 181.2C118.3 191.2 60.4 180.4 45.7 158.9C31.0 137.3 38.4 74.8 52.1 51.9C65.7 28.9 106.8 13.5 127.5 21.3C148.2 29.1 174.2 72.2 176.3 98.9Z" />
        <path className="m2xfd-s m2xfd-s3" d="M188.8 100.8C186.8 121.4 154.2 151.9 134.7 165.3C115.3 178.7 88.5 187.8 72.1 181.2C55.7 174.6 43.9 142.6 36.2 125.8C28.5 109.0 16.8 96.7 25.9 80.3C35.0 64.0 70.7 34.2 90.9 27.7C111.0 21.3 130.3 29.4 146.6 41.6C163.0 53.8 190.8 80.2 188.8 100.8Z" />
        <g className="m2xfd-stem" fill="none" stroke="#3f5a3c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M100 160C100 132 98 110 92 84" />
          <path d="M96 120C110 114 120 104 124 90C110 92 100 102 96 120Z" />
          <path d="M94 100C82 96 74 86 72 74C84 76 92 86 94 100Z" />
          <circle cx="91" cy="72" r="11" />
        </g>
      </svg>
    </div>
    <div className="m2xfd-copy">
      <p className="m2xfd-kicker">Mossgate Flowers</p>
      <h2 className="m2xfd-h" id="m2xfd-h">One letter on Fridays about what is in bloom this week.</h2>
      <p className="m2xfd-p">Which stems came in from the growers, how long they last in a vase and a short note on arranging them at home.</p>
      <form className="m2xfd-form" action="#">
        <label className="m2xfd-label" htmlFor="m2xfd-email">Email address</label>
        <div className="m2xfd-row">
          <input className="m2xfd-input" id="m2xfd-email" type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
          <button className="m2xfd-btn" type="submit">Sign up</button>
        </div>
        <p className="m2xfd-note">You can leave the list from any letter.</p>
      </form>
    </div>
  </div>
</section>
  );
}
