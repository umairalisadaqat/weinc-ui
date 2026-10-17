import { useEffect, useRef } from "react";

// Colours and timings live at the top of the CSS below; every shape is fixed and only its transform or opacity moves.
const CSS = `
.m2peb { --m2peb-bg: #e9e2d6; --m2peb-card: #f6f2ea; --m2peb-ink: #2b2925; --m2peb-quiet: #5e584f; --m2peb-btn: #3e4943; }
.m2peb *, .m2peb *::before, .m2peb *::after { box-sizing: border-box; }
.m2peb { box-sizing: border-box; background: var(--m2peb-bg); color: var(--m2peb-ink); padding: clamp(32px, 6vw, 72px) 16px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
.m2peb-card { max-width: 920px; margin: 0 auto; display: grid; grid-template-columns: minmax(200px, 300px) 1fr; align-items: center; gap: clamp(24px, 5vw, 56px); padding: clamp(24px, 4vw, 44px); border-radius: 28px; background: var(--m2peb-card); }
.m2peb-stage { width: 100%; max-width: 260px; margin: 0 auto; }
.m2peb-svg { display: block; width: 100%; height: auto; overflow: visible; }
.m2peb-s { transform-box: fill-box; transform-origin: 50% 90%; }
.m2peb-s1 { animation: m2peb-r 13s ease-in-out infinite; }
.m2peb-s2 { animation: m2peb-r 9s ease-in-out -3s infinite reverse; }
.m2peb-s3 { animation: m2peb-r 11s ease-in-out -6s infinite; }
.m2peb-s4 { animation: m2peb-t 7s ease-in-out -2s infinite; }
.m2peb-s5 { animation: m2peb-t 15s ease-in-out -5s infinite reverse; }
.m2peb-s6 { animation: m2peb-t 12s ease-in-out infinite; }
.m2peb-shadow { animation: m2peb-o 9s ease-in-out infinite; }
@keyframes m2peb-r { 0%, 100% { transform: rotate(-1.4deg); } 50% { transform: rotate(1.6deg) scale(1.01, .99); } }
@keyframes m2peb-t { 0%, 100% { transform: rotate(-4deg) translateX(-2%); } 50% { transform: rotate(5deg) translateX(2%); } }
@keyframes m2peb-o { 0%, 100% { opacity: 1; } 50% { opacity: .7; } }
.m2peb[data-off] .m2peb-s, .m2peb[data-off] .m2peb-shadow { animation-play-state: paused; }
.m2peb-kicker { margin: 0; color: #6b5a3f; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
.m2peb-h { margin: 12px 0 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(26px, 3.4vw, 36px); line-height: 1.18; }
.m2peb-hours { width: 100%; margin-top: 24px; border-collapse: collapse; font-size: 15px; }
.m2peb-hours caption { text-align: left; padding-bottom: 8px; color: var(--m2peb-quiet); font-size: 13px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
.m2peb-hours th, .m2peb-hours td { padding: 10px 0; border-top: 1px solid #ddd4c6; text-align: left; font-weight: 400; }
.m2peb-hours td { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
.m2peb-btn { display: inline-flex; align-items: center; min-height: 48px; margin-top: 24px; padding: 0 22px; border-radius: 999px; background: var(--m2peb-btn); color: #f6f2ea; font-size: 15px; font-weight: 600; text-decoration: none; }
.m2peb-btn:hover { background: #2c3530; }
.m2peb-btn:focus-visible { outline: 2px solid var(--m2peb-btn); outline-offset: 3px; }
@media (max-width: 700px) { .m2peb-card { grid-template-columns: 1fr; } .m2peb-stage { max-width: 170px; } }
@media (prefers-reduced-motion: reduce) { .m2peb-s, .m2peb-shadow { animation: none; } }
`;

export default function BalancedPebbleClusterBesideOpeningHours() {
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
<section ref={rootRef} className="m2peb" aria-labelledby="m2peb-h">
<style>{CSS}</style>
  <div className="m2peb-card">
    <div className="m2peb-stage">
      <svg className="m2peb-svg" viewBox="0 180 200 168" aria-hidden="true">
        <defs>
          <radialGradient id="m2peb-g1r" cx="40%" cy="30%" r="80%"><stop offset="0" stopColor="#c9c0b1" /><stop offset="1" stopColor="#8f8576" /></radialGradient>
          <radialGradient id="m2peb-g2r" cx="40%" cy="30%" r="80%"><stop offset="0" stopColor="#e2d6c2" /><stop offset="1" stopColor="#a9987f" /></radialGradient>
          <radialGradient id="m2peb-g3r" cx="40%" cy="30%" r="80%"><stop offset="0" stopColor="#9aa39b" /><stop offset="1" stopColor="#5f6a63" /></radialGradient>
          <radialGradient id="m2peb-g4r" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#6b5d48" stopOpacity=".35" /><stop offset="1" stopColor="#6b5d48" stopOpacity="0" /></radialGradient>
        </defs>
        <ellipse className="m2peb-shadow" cx="100" cy="330" rx="92" ry="14" fill="url(#m2peb-g4r)" />
        <g transform="translate(17.9 317.4) scale(0.168 0.081)"><path className="m2peb-s m2peb-s6" fill="url(#m2peb-g3r)" d="M178.6 102.2C178.4 126.6 156.9 154.5 135.1 165.5C113.4 176.6 66.0 180.4 47.9 168.7C29.8 157.0 24.3 118.1 26.7 95.5C29.0 72.9 43.9 46.0 62.2 33.3C80.5 20.5 117.1 7.6 136.5 19.1C155.9 30.6 178.8 77.8 178.6 102.2Z" /></g>
        <g transform="translate(143.4 309.5) scale(0.254 0.118)"><path className="m2peb-s m2peb-s5" fill="url(#m2peb-g2r)" d="M183.2 92.0C183.1 115.6 156.4 165.2 137.7 178.1C119.0 190.9 89.6 180.2 71.0 169.0C52.4 157.7 26.3 133.1 26.0 110.5C25.8 88.0 50.9 46.2 69.6 33.7C88.3 21.3 119.1 26.2 138.1 35.9C157.0 45.7 183.2 68.3 183.2 92.0Z" /></g>
        <g transform="translate(28.5 282.9) scale(0.726 0.279)"><path className="m2peb-s m2peb-s1" fill="url(#m2peb-g1r)" d="M179.5 95.6C181.1 117.7 161.5 154.1 141.7 167.0C122.0 180.0 81.8 183.2 61.1 173.4C40.5 163.5 19.7 129.7 17.8 108.0C15.9 86.2 30.7 54.9 49.8 42.7C68.9 30.4 110.7 25.6 132.3 34.4C153.9 43.2 177.9 73.5 179.5 95.6Z" /></g>
        <g transform="translate(42.1 247.9) scale(0.619 0.261)"><path className="m2peb-s m2peb-s2" fill="url(#m2peb-g2r)" d="M173.1 94.8C174.3 116.8 150.9 152.3 132.1 164.2C113.3 176.2 78.8 174.8 60.3 166.5C41.8 158.1 23.0 135.1 21.1 114.1C19.2 93.1 31.5 53.9 48.8 40.2C66.1 26.6 104.1 23.2 124.8 32.3C145.6 41.4 171.9 72.8 173.1 94.8Z" /></g>
        <g transform="translate(55.7 217.1) scale(0.496 0.209)"><path className="m2peb-s m2peb-s3" fill="url(#m2peb-g3r)" d="M172.0 92.4C172.1 113.5 155.8 148.5 139.3 162.0C122.8 175.5 93.8 186.1 73.2 173.4C52.6 160.7 16.0 109.3 15.4 85.7C14.8 62.1 49.2 40.2 69.7 31.8C90.3 23.3 121.8 24.9 138.8 35.0C155.9 45.1 171.9 71.2 172.0 92.4Z" /></g>
        <g transform="translate(65.0 194.7) scale(0.338 0.160)"><path className="m2peb-s m2peb-s4" fill="url(#m2peb-g1r)" d="M185.3 106.1C186.3 129.0 160.7 157.6 139.5 169.8C118.4 182.0 77.3 190.0 58.6 179.4C39.8 168.8 27.4 129.6 27.0 106.2C26.6 82.7 38.5 50.9 56.2 38.6C73.9 26.3 111.7 20.9 133.2 32.1C154.7 43.4 184.2 83.1 185.3 106.1Z" /></g>
      </svg>
    </div>
    <div className="m2peb-info">
      <p className="m2peb-kicker">Saltmere Bathhouse</p>
      <h2 className="m2peb-h" id="m2peb-h">Warm pools, a cold plunge and a quiet room with no phones.</h2>
      <table className="m2peb-hours">
        <caption>Opening hours</caption>
        <tbody>
          <tr><th scope="row">Monday to Thursday</th><td>7:00 to 21:00</td></tr>
          <tr><th scope="row">Friday</th><td>7:00 to 22:00</td></tr>
          <tr><th scope="row">Weekends</th><td>8:00 to 20:00</td></tr>
        </tbody>
      </table>
      <a className="m2peb-btn" href="#">Book a two-hour session</a>
    </div>
  </div>
</section>
  );
}
