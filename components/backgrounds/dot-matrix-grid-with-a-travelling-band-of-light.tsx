import { useEffect, useRef } from "react";

// A pale dot grid where a soft band of colour travels across and lights only the dots.
// Pure CSS: the decorative layer is aria-hidden and animates transform and opacity.
// The effect pauses while the section is off screen and stays still for reduced motion.

const css = `
.dmx-root{
  /* Change these: */
  --dmx-gap: 20px;               /* distance between dots */
  --dmx-dot: 1.8px;              /* dot radius */
  --dmx-lit: 41,82,150;          /* colour of the travelling light as r,g,b */
  --dmx-speed: 9s;               /* time for the band to cross */
}
.dmx-root{position:relative;display:flex;align-items:center;min-height:600px;isolation:isolate;overflow:hidden;background:#f6f7f9;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.dmx-art{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.dmx-dots{position:absolute;inset:0;background-image:radial-gradient(circle,#c3cad5 var(--dmx-dot),transparent calc(var(--dmx-dot) + .6px));background-size:var(--dmx-gap) var(--dmx-gap);background-position:center}
.dmx-lit{position:absolute;inset:0;
  -webkit-mask-image:radial-gradient(circle,#000 calc(var(--dmx-dot) + .7px),transparent calc(var(--dmx-dot) + 1.3px));mask-image:radial-gradient(circle,#000 calc(var(--dmx-dot) + .7px),transparent calc(var(--dmx-dot) + 1.3px));
  -webkit-mask-size:var(--dmx-gap) var(--dmx-gap);mask-size:var(--dmx-gap) var(--dmx-gap);-webkit-mask-position:center;mask-position:center}
.dmx-band{position:absolute;top:-40%;bottom:-40%;left:0;width:45%;will-change:transform;transform:translateX(-80%) rotate(14deg);
  background:linear-gradient(90deg,transparent,rgba(var(--dmx-lit),.5) 25%,rgb(var(--dmx-lit)) 50%,rgba(var(--dmx-lit),.5) 75%,transparent);animation:dmx-pass var(--dmx-speed) cubic-bezier(.55,.1,.45,.9) infinite}
.dmx-echo{position:absolute;top:-40%;bottom:-40%;left:0;width:26%;will-change:transform;transform:translateX(330%) rotate(-10deg);
  background:linear-gradient(90deg,transparent,rgba(196,110,60,.9) 50%,transparent);animation:dmx-back calc(var(--dmx-speed) * 1.5) cubic-bezier(.55,.1,.45,.9) infinite}
.dmx-calm{position:absolute;left:50%;top:50%;width:min(860px,120%);height:380px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(246,247,249,.97) 35%,rgba(246,247,249,.6) 65%,transparent 100%)}
.dmx-edge{position:absolute;inset:0;background:linear-gradient(180deg,#f6f7f9,transparent 14%,transparent 86%,#f6f7f9)}
@keyframes dmx-pass{0%{transform:translateX(-80%) rotate(14deg)}100%{transform:translateX(260%) rotate(14deg)}}
@keyframes dmx-back{0%{transform:translateX(360%) rotate(-10deg)}100%{transform:translateX(-120%) rotate(-10deg)}}
.dmx-hero{position:relative;z-index:1;box-sizing:border-box;width:100%;max-width:720px;margin:0 auto;padding:112px 20px;text-align:center}
.dmx-hero > *{max-width:none}
.dmx-eyebrow{margin:0 0 18px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#2c4f8a}
.dmx-title{margin:0;font-size:clamp(2.1rem,5.4vw,3.6rem);line-height:1.06;letter-spacing:-.025em;font-weight:650;color:#121a2b;text-wrap:balance}
.dmx-copy{margin:20px auto 0;max-width:34em;font-size:clamp(1rem,1.6vw,1.125rem);line-height:1.6;color:#4a5568}
.dmx-btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;margin-top:32px;padding:0 24px;border-radius:8px;background:#1d3a6b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;box-shadow:none;transition:transform .2s ease,background-color .2s ease}
.dmx-btn:hover{transform:translateY(-1px);background:#264a85}
.dmx-btn:focus-visible{outline:2px solid #2c4f8a;outline-offset:3px}
@media (max-width:640px){.dmx-hero{padding:88px 20px}}
.dmx-root[data-paused] *,.dmx-root[data-paused] *::before,.dmx-root[data-paused] *::after{animation-play-state:paused!important}
@media (prefers-reduced-motion: reduce){
.dmx-band{transform:translateX(10%) rotate(14deg)}.dmx-echo{transform:translateX(240%) rotate(-10deg)}
.dmx-root *,.dmx-root *::before,.dmx-root *::after{animation:none!important;transition:none!important}
}
`;

export default function DotMatrixTravellingLight() {
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
    <section ref={root} className="dmx-root relative w-full overflow-hidden">
      <style>{css}</style>
      <div className="dmx-art" aria-hidden="true">
        <div className="dmx-dots"></div>
        <div className="dmx-lit"><div className="dmx-band"></div><div className="dmx-echo"></div></div>
        <div className="dmx-calm"></div>
        <div className="dmx-edge"></div>
      </div>
      <div className="dmx-hero">
      <p className="dmx-eyebrow">Bookkeeping for architects</p>
      <h1 className="dmx-title">Every invoice, filed before the coffee cools.</h1>
      <p className="dmx-copy">Receipts, fee stages and VAT returns kept in order by two accountants who read drawings as well as ledgers.</p>
      <a className="dmx-btn" href="#">Book a 20 minute call</a>
      </div>
    </section>
  );
}
