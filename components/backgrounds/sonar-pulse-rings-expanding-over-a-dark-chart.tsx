import { useEffect, useRef } from "react";

// Rings of sound spread from one point over a dark chart, lighting three contacts as they pass.
// Pure CSS: the decorative layer is aria-hidden and animates transform and opacity.
// The effect pauses while the section is off screen and stays still for reduced motion.

const css = `
.snr-root{
  /* Change these: */
  --snr-ink: 150,226,190;   /* ring colour as r,g,b */
  --snr-period: 6s;         /* time for one ring to reach the edge */
  --snr-x: 70%;             /* source position across */
  --snr-y: 56%;             /* source position down */
}
.snr-root{position:relative;display:flex;align-items:center;min-height:640px;isolation:isolate;overflow:hidden;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  background:radial-gradient(90% 90% at var(--snr-x) var(--snr-y),#123227 0%,#0b1f19 45%,#06110d 100%)}
.snr-art{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.snr-chart{position:absolute;inset:0;
  background:repeating-radial-gradient(circle at var(--snr-x) var(--snr-y),transparent 0 119px,rgba(var(--snr-ink),.10) 119px 120px),
  linear-gradient(90deg,transparent calc(var(--snr-x) - .5px),rgba(var(--snr-ink),.10) calc(var(--snr-x) - .5px) calc(var(--snr-x) + .5px),transparent calc(var(--snr-x) + .5px)),
  linear-gradient(180deg,transparent calc(var(--snr-y) - .5px),rgba(var(--snr-ink),.10) calc(var(--snr-y) - .5px) calc(var(--snr-y) + .5px),transparent calc(var(--snr-y) + .5px)),
  linear-gradient(rgba(var(--snr-ink),.035) 1px,transparent 1px) 0 0/40px 40px,linear-gradient(90deg,rgba(var(--snr-ink),.035) 1px,transparent 1px) 0 0/40px 40px}
.snr-ring{position:absolute;left:var(--snr-x);top:var(--snr-y);width:2000px;height:2000px;margin:-1000px 0 0 -1000px;border-radius:50%;opacity:0;will-change:transform,opacity;
  background:radial-gradient(closest-side,transparent 86%,rgba(var(--snr-ink),.10) 95%,rgba(var(--snr-ink),.65) 99.2%,transparent 100%);
  animation:snr-ring var(--snr-period) cubic-bezier(.2,.5,.45,1) infinite}
.snr-ring:nth-child(3){animation-delay:calc(var(--snr-period) / -3)}
.snr-ring:nth-child(4){animation-delay:calc(var(--snr-period) * -2 / 3)}
.snr-core{position:absolute;left:var(--snr-x);top:var(--snr-y);width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:rgb(var(--snr-ink));box-shadow:0 0 0 6px rgba(var(--snr-ink),.12),0 0 30px 8px rgba(var(--snr-ink),.35)}
.snr-blip{position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:rgb(var(--snr-ink));box-shadow:0 0 14px 4px rgba(var(--snr-ink),.5);opacity:.15;animation:snr-blip calc(var(--snr-period) / 3) ease-out infinite}
.snr-b1{left:calc(var(--snr-x) - 200px);top:calc(var(--snr-y) - 120px);animation-delay:-.2s}
.snr-b2{left:calc(var(--snr-x) + 150px);top:calc(var(--snr-y) + 170px);animation-delay:-1.1s}
.snr-b3{left:calc(var(--snr-x) + 60px);top:calc(var(--snr-y) - 300px);animation-delay:-.6s}
.snr-veil{position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,15,12,.75) 0%,rgba(5,15,12,.35) 45%,transparent 70%)}
@keyframes snr-ring{0%{transform:scale(.01);opacity:0}6%{opacity:1}75%{opacity:.5}100%{transform:scale(1);opacity:0}}
@keyframes snr-blip{0%{opacity:1;transform:scale(1.3)}60%{opacity:.25;transform:scale(1)}100%{opacity:.15;transform:scale(1)}}
@media (max-width:640px){.snr-root{--snr-x:76%;--snr-y:24%}}
.snr-hero{position:relative;z-index:1;box-sizing:border-box;width:100%;max-width:1120px;margin:0 auto;padding:112px 20px;text-align:left}
.snr-hero > *{max-width:560px}
.snr-eyebrow{margin:0 0 18px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#9fe3c3}
.snr-title{margin:0;font-size:clamp(2.1rem,5.4vw,3.6rem);line-height:1.06;letter-spacing:-.025em;font-weight:650;color:#eefaf4;text-wrap:balance}
.snr-copy{margin:20px 0 0;max-width:34em;font-size:clamp(1rem,1.6vw,1.125rem);line-height:1.6;color:#c4d9cf}
.snr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;margin-top:32px;padding:0 24px;border-radius:8px;background:#9fe3c3;color:#06150f;font-size:15px;font-weight:600;text-decoration:none;box-shadow:none;transition:transform .2s ease,background-color .2s ease}
.snr-btn:hover{transform:translateY(-1px);background:#b8edd4}
.snr-btn:focus-visible{outline:2px solid #c9f3df;outline-offset:3px}
@media (max-width:640px){.snr-hero{padding:88px 20px}}
.snr-root[data-paused] *,.snr-root[data-paused] *::before,.snr-root[data-paused] *::after{animation-play-state:paused!important}
@media (prefers-reduced-motion: reduce){
.snr-ring{opacity:.5;transform:scale(.3)}.snr-ring:nth-child(3){opacity:.3;transform:scale(.62)}.snr-ring:nth-child(4){opacity:0}.snr-blip{opacity:.7}
.snr-root *,.snr-root *::before,.snr-root *::after{animation:none!important;transition:none!important}
}
`;

export default function SonarPulseRings() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) el.removeAttribute("data-paused");
        else el.setAttribute("data-paused", "");
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={root} className="snr-root relative w-full overflow-hidden">
      <style>{css}</style>
      <div className="snr-art" aria-hidden="true">
        <div className="snr-chart"></div>
        <div className="snr-ring"></div>
        <div className="snr-ring"></div>
        <div className="snr-ring"></div>
        <div className="snr-core"></div>
        <div className="snr-blip snr-b1"></div>
        <div className="snr-blip snr-b2"></div>
        <div className="snr-blip snr-b3"></div>
        <div className="snr-veil"></div>
      </div>
      <div className="snr-hero">
      <p className="snr-eyebrow">Seabed survey crews</p>
      <h1 className="snr-title">We map what lies under the hull.</h1>
      <p className="snr-copy">Multibeam surveys for marinas, wind farm routes and salvage teams, with charts delivered within the week.</p>
      <a className="snr-btn" href="#">Book a survey</a>
      </div>
    </section>
  );
}
