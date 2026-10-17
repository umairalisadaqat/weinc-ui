import { useEffect, useRef } from "react";

// Colours and timings live at the top of the CSS below; every shape is fixed and only its transform or opacity moves.
const CSS = `
.m2quo { --m2quo-bg: #121b2e; --m2quo-t1: #1a2741; --m2quo-t2: #1f2f4f; --m2quo-ink: #f2ede3; --m2quo-acc: #d9b26f; }
.m2quo *, .m2quo *::before, .m2quo *::after { box-sizing: border-box; }
.m2quo { box-sizing: border-box; background: var(--m2quo-bg); color: var(--m2quo-ink); padding: clamp(48px, 8vw, 96px) 20px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; overflow: hidden; text-align: center; }
.m2quo-h { margin: 0; color: var(--m2quo-acc); font-size: 13px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
.m2quo-wrap { position: relative; max-width: 820px; margin: 28px auto 0; padding: clamp(48px, 8vw, 88px) clamp(16px, 8vw, 96px); }
.m2quo-svg { position: absolute; left: -6%; top: -3%; width: 112%; height: 106%; overflow: visible; }
.m2quo-b { transform-box: fill-box; transform-origin: center; }
.m2quo-b1 { fill: var(--m2quo-t1); }
.m2quo-b2 { fill: var(--m2quo-t2); opacity: .8; }
.m2quo-b1 { animation: m2quo-a 30s ease-in-out infinite; }
.m2quo-b2 { animation: m2quo-b 23s ease-in-out infinite; }
@keyframes m2quo-a { 0%, 100% { transform: rotate(0) scale(1); } 50% { transform: rotate(14deg) scale(1.04, .96); } }
@keyframes m2quo-b { 0%, 100% { transform: rotate(-6deg) scale(.94, 1); } 50% { transform: rotate(12deg) scale(1, .92); } }
.m2quo[data-off] .m2quo-b { animation-play-state: paused; }
.m2quo-fig { position: relative; margin: 0; }
.m2quo-mark { display: block; margin: 0 auto; width: 34px; height: 28px; fill: var(--m2quo-acc); }
.m2quo-q { margin: 18px 0 0; }
.m2quo-q p { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: clamp(22px, 3.2vw, 32px); line-height: 1.35; }
.m2quo-cap { display: flex; flex-direction: column; gap: 4px; margin-top: 26px; font-size: 15px; }
.m2quo-name { font-weight: 600; }
.m2quo-role { color: #c4c8d2; }
.m2quo-foot { margin: 28px 0 0; color: #c4c8d2; font-size: 14px; }
.m2quo-foot a { color: var(--m2quo-ink); text-decoration: underline; text-underline-offset: 4px; display: inline-flex; align-items: center; min-height: 40px; }
.m2quo-foot a:focus-visible { outline: 2px solid var(--m2quo-acc); outline-offset: 2px; border-radius: 4px; }
@media (prefers-reduced-motion: reduce) { .m2quo-b { animation: none; } }
`;

export default function SlowNavyBlobBehindClientQuote() {
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
<section ref={rootRef} className="m2quo" aria-labelledby="m2quo-h">
<style>{CSS}</style>
  <h2 className="m2quo-h" id="m2quo-h">What clients say</h2>
  <div className="m2quo-wrap">
    <svg className="m2quo-svg" viewBox="0 0 200 200" preserveAspectRatio="none" aria-hidden="true">
      <path className="m2quo-b m2quo-b1" d="M189.5 107.6C193.7 135.9 165.5 176.9 140.3 185.3C115.0 193.7 57.6 178.7 37.9 157.9C18.2 137.2 9.0 84.6 21.9 60.8C34.7 37.0 87.0 7.6 114.9 15.4C142.9 23.2 185.2 79.3 189.5 107.6Z" />
      <path className="m2quo-b m2quo-b2" d="M191.6 115.7C191.9 135.6 152.2 149.2 133.6 159.1C115.0 169.1 96.0 180.1 79.9 175.2C63.8 170.2 46.2 146.0 37.2 129.3C28.1 112.6 19.6 92.2 25.7 74.9C31.9 57.6 56.4 31.6 74.1 25.7C91.7 19.8 112.0 24.7 131.6 39.7C151.2 54.7 191.3 95.8 191.6 115.7Z" />
    </svg>
    <figure className="m2quo-fig">
      <svg className="m2quo-mark" viewBox="0 0 40 32" aria-hidden="true"><path d="M4 30V18C4 9 9 3 17 2v6c-4 1-6 4-6 9h6v13zM23 30V18c0-9 5-15 13-16v6c-4 1-6 4-6 9h6v13z" /></svg>
      <blockquote className="m2quo-q"><p>They fitted the kitchen around a crooked old wall instead of fighting it, and every drawer still closes with one finger two winters later.</p></blockquote>
      <figcaption className="m2quo-cap"><span className="m2quo-name">Hanna Ostrowski</span><span className="m2quo-role">Kitchen in a Victorian terrace, Leith</span></figcaption>
    </figure>
  </div>
  <p className="m2quo-foot">Brannock &amp; Lowe Joinery &middot; <a href="#">Read more client notes</a></p>
</section>
  );
}
