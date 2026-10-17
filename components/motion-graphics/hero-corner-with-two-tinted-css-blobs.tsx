import { useEffect, useRef } from "react";

// Colours and timings live at the top of the CSS below; every shape is fixed and only its transform or opacity moves.
const CSS = `
.m2hro { --m2hro-bg: #17302a; --m2hro-t1: #24473d; --m2hro-t2: #2e5b4b; --m2hro-ink: #f1ece0; --m2hro-acc: #d8c38f; }
.m2hro *, .m2hro *::before, .m2hro *::after { box-sizing: border-box; }
.m2hro { position: relative; box-sizing: border-box; overflow: hidden; min-height: 600px; background: var(--m2hro-bg); color: var(--m2hro-ink); padding: 24px clamp(20px, 5vw, 64px) 64px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; }
.m2hro a:focus-visible { outline: 2px solid var(--m2hro-acc); outline-offset: 3px; border-radius: 6px; }
.m2hro-corner { position: absolute; right: -14vw; top: -18vw; width: max(46vw, 380px); aspect-ratio: 1; pointer-events: none; }
.m2hro-blob { position: absolute; inset: 0; }
.m2hro-b1 { background: var(--m2hro-t1); border-radius: 42% 58% 63% 37% / 41% 44% 56% 59%; animation: m2hro-a 24s ease-in-out infinite; }
.m2hro-b2 { inset: 16% 2% 4% 20%; background: var(--m2hro-t2); border-radius: 61% 39% 47% 53% / 52% 61% 39% 48%; animation: m2hro-b 31s ease-in-out infinite; }
.m2hro-b3 { inset: 22% 18% 30% 26%; border: 1px solid rgba(216, 195, 143, .45); border-radius: 50% 50% 38% 62% / 57% 43% 57% 43%; animation: m2hro-c 40s linear infinite; }
@keyframes m2hro-a { 0%, 100% { transform: rotate(0) scale(1); } 50% { transform: rotate(50deg) scale(1.06, .96); } }
@keyframes m2hro-b { 0%, 100% { transform: rotate(0) scale(.97); } 50% { transform: rotate(-70deg) scale(1.03, 1.07); } }
@keyframes m2hro-c { to { transform: rotate(-360deg); } }
.m2hro[data-off] .m2hro-blob { animation-play-state: paused; }
.m2hro-bar { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 16px; max-width: 1120px; margin: 0 auto; }
.m2hro-logo { color: var(--m2hro-ink); font-family: Georgia, "Times New Roman", serif; font-size: 20px; text-decoration: none; }
.m2hro-nav { display: flex; gap: 6px; margin: 0; padding: 0; list-style: none; }
.m2hro-nav a { display: inline-flex; align-items: center; min-height: 40px; padding: 0 12px; color: var(--m2hro-ink); font-size: 15px; text-decoration: none; }
.m2hro-nav a:hover { color: var(--m2hro-acc); }
.m2hro-body { position: relative; max-width: 1120px; margin: 0 auto; padding-top: clamp(64px, 11vw, 120px); }
.m2hro-kicker { margin: 0; color: var(--m2hro-acc); font-size: 13px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
.m2hro-h { margin: 18px 0 0; max-width: 15ch; font-family: Georgia, "Times New Roman", serif; font-weight: 400; font-size: clamp(36px, 6vw, 68px); line-height: 1.05; letter-spacing: -.015em; }
.m2hro-p { margin: 22px 0 0; max-width: 34rem; color: #cfd6cc; font-size: 17px; line-height: 1.6; }
.m2hro-acts { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; margin-top: 32px; }
.m2hro-btn { display: inline-flex; align-items: center; min-height: 48px; padding: 0 24px; border-radius: 999px; background: var(--m2hro-acc); color: #17302a; font-weight: 600; font-size: 15px; text-decoration: none; }
.m2hro-btn:hover { background: #e7d6aa; }
.m2hro-link { display: inline-flex; align-items: center; min-height: 44px; color: var(--m2hro-ink); font-size: 15px; text-decoration: underline; text-underline-offset: 5px; }
@media (max-width: 640px) { .m2hro-nav li:not(:last-child) { display: none; } .m2hro-corner { right: -40%; top: -150px; width: 110vw; } }
@media (prefers-reduced-motion: reduce) { .m2hro-blob { animation: none; } }
`;

export default function HeroCornerWithTwoTintedCssBlobs() {
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
<section ref={rootRef} className="m2hro" aria-labelledby="m2hro-h">
<style>{CSS}</style>
  <div className="m2hro-corner" aria-hidden="true">
    <span className="m2hro-blob m2hro-b1"></span>
    <span className="m2hro-blob m2hro-b2"></span>
    <span className="m2hro-blob m2hro-b3"></span>
  </div>
  <header className="m2hro-bar">
    <a className="m2hro-logo" href="#">Fernwick Gardens</a>
    <nav aria-label="Main"><ul className="m2hro-nav"><li><a href="#">Projects</a></li><li><a href="#">Planting</a></li><li><a href="#">Contact</a></li></ul></nav>
  </header>
  <div className="m2hro-body">
    <p className="m2hro-kicker">Garden design, Bristol</p>
    <h1 className="m2hro-h" id="m2hro-h">Small gardens, planted to look after themselves.</h1>
    <p className="m2hro-p">We draw, plant and hand over courtyards and back gardens with a two-page care sheet written for the people who live there.</p>
    <div className="m2hro-acts">
      <a className="m2hro-btn" href="#">Book a site visit</a>
      <a className="m2hro-link" href="#">See recent gardens</a>
    </div>
  </div>
</section>
  );
}
