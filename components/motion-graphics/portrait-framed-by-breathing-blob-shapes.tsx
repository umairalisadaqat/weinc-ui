import { useEffect, useRef } from "react";

// Colours and timings live at the top of the CSS below; every shape is fixed and only its transform or opacity moves.
const CSS = `
.m2prt { --m2prt-bg: #f6efe6; --m2prt-fill1: #e3b89a; --m2prt-fill2: #eed6bf; --m2prt-line: #9a4f32; --m2prt-ink: #2b211b; --m2prt-btn: #8c3f24; }
.m2prt *, .m2prt *::before, .m2prt *::after { box-sizing: border-box; }
.m2prt { box-sizing: border-box; background: var(--m2prt-bg); color: var(--m2prt-ink); padding: clamp(48px, 8vw, 96px) 20px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
.m2prt-in { max-width: 1040px; margin: 0 auto; display: grid; grid-template-columns: 1.1fr 1fr; gap: 48px; align-items: center; }
.m2prt-kicker { margin: 0; font-size: 13px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--m2prt-btn); }
.m2prt-h { margin: 16px 0 0; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(28px, 4vw, 42px); line-height: 1.15; letter-spacing: -.01em; }
.m2prt-p { margin: 18px 0 0; max-width: 30rem; font-size: 16px; line-height: 1.65; color: #5b4c41; }
.m2prt-btn { display: inline-flex; align-items: center; min-height: 46px; margin-top: 28px; padding: 0 24px; border-radius: 999px; background: var(--m2prt-btn); color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; }
.m2prt-btn:hover { background: #6f3019; }
.m2prt-btn:focus-visible { outline: 2px solid var(--m2prt-btn); outline-offset: 3px; }
.m2prt-fig { position: relative; margin: 0 auto; width: min(400px, 82vw); aspect-ratio: 1; }
.m2prt-blobs { position: absolute; inset: -6%; width: 112%; height: 112%; overflow: visible; }
.m2prt-b { transform-box: fill-box; transform-origin: center; }
.m2prt-b1 { fill: var(--m2prt-fill2); }
.m2prt-b2 { fill: var(--m2prt-fill1); opacity: .85; }
.m2prt-b3 { fill: none; stroke: var(--m2prt-line); stroke-width: .8; stroke-linecap: round; }
.m2prt-img { position: absolute; left: 17%; top: 17%; width: 66%; height: 66%; border-radius: 50%; object-fit: cover; object-position: 50% 22%; background: #2a2420; box-shadow: 0 18px 40px -18px rgba(70, 35, 18, .45); }
.m2prt-cap { position: absolute; left: 50%; bottom: 2%; transform: translateX(-50%); padding: 6px 14px; border-radius: 999px; background: #fffaf4; font-size: 13px; font-weight: 500; white-space: nowrap; box-shadow: 0 4px 14px -6px rgba(70, 35, 18, .35); }
.m2prt-b1 { animation: m2prt-a 22s ease-in-out infinite; }
.m2prt-b2 { animation: m2prt-b 29s ease-in-out infinite; }
.m2prt-b3 { animation: m2prt-c 36s linear infinite; }
@keyframes m2prt-a { 0%, 100% { transform: rotate(0) scale(1); } 50% { transform: rotate(40deg) scale(1.05, .97); } }
@keyframes m2prt-b { 0%, 100% { transform: rotate(0) scale(.96); } 50% { transform: rotate(-55deg) scale(1.02, 1.05); } }
@keyframes m2prt-c { to { transform: rotate(360deg); } }
.m2prt[data-off] .m2prt-b { animation-play-state: paused; }
@media (max-width: 760px) { .m2prt-in { grid-template-columns: 1fr; gap: 40px; } .m2prt-fig { width: min(320px, 80vw); } }
@media (prefers-reduced-motion: reduce) { .m2prt-b { animation: none; } }
`;

export default function PortraitFramedByBreathingBlobShapes() {
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
<section ref={rootRef} className="m2prt" aria-labelledby="m2prt-h">
<style>{CSS}</style>
  <div className="m2prt-in">
    <div className="m2prt-copy">
      <p className="m2prt-kicker">Hollow Kiln Studio</p>
      <h2 className="m2prt-h" id="m2prt-h">Ines Varga throws every bowl on one wheel by the window.</h2>
      <p className="m2prt-p">Stoneware for the table, glazed in small firings of twenty pieces. Ines teaches a Saturday morning class for people who have never touched clay.</p>
      <a className="m2prt-btn" href="#">Meet the studio</a>
    </div>
    <figure className="m2prt-fig">
      <svg className="m2prt-blobs" viewBox="0 0 200 200" aria-hidden="true">
        <path className="m2prt-b m2prt-b1" d="M189.0 86.9C186.0 108.3 151.0 153.1 129.6 166.7C108.3 180.2 80.5 180.1 60.9 168.1C41.2 156.1 12.3 114.6 11.8 94.6C11.4 74.7 35.3 58.0 57.9 48.6C80.6 39.2 125.9 31.9 147.7 38.2C169.6 44.6 192.1 65.5 189.0 86.9Z" />
        <path className="m2prt-b m2prt-b2" d="M180.8 91.5C183.2 116.2 152.6 169.9 129.7 177.5C106.8 185.1 62.0 156.1 43.5 136.9C25.0 117.7 6.6 80.2 18.6 62.3C30.6 44.4 88.6 24.5 115.6 29.4C142.7 34.2 178.5 66.8 180.8 91.5Z" />
        <path className="m2prt-b m2prt-b3" d="M188.7 110.5C188.7 136.1 147.3 160.8 123.0 169.4C98.7 178.1 58.5 182.4 42.7 162.4C27.0 142.4 15.3 73.9 28.6 49.4C42.0 24.9 96.2 5.1 122.9 15.2C149.5 25.4 188.6 84.8 188.7 110.5Z" />
      </svg>
      <img className="m2prt-img" src="https://images.pexels.com/photos/9304494/pexels-photo-9304494.jpeg?auto=compress&cs=tinysrgb&w=800" width="560" height="560" decoding="async" alt="A potter in a grey apron shaping a lump of clay on a spinning wheel" />
      <figcaption className="m2prt-cap">Ines at the wheel</figcaption>
    </figure>
  </div>
</section>
  );
}
