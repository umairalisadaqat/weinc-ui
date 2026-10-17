import { useEffect, useRef } from "react";

// Three layers of diagonal bands slide at different speeds, so the nearest ones read as closer.
// Pure CSS: the decorative layer is aria-hidden and animates transform and opacity.
// The effect pauses while the section is off screen and stays still for reduced motion.

const css = `
.dsb-root{
  /* Change these: */
  --dsb-ground: #efe3cf;           /* background sand */
  --dsb-band: 184,98,56;           /* band colour as r,g,b */
  --dsb-speed: 18s;                /* time for the front layer to move one tile */
  --dsb-near: 240px;               /* front band tile size; the far layers scale from it */
}
.dsb-root{position:relative;display:flex;align-items:center;min-height:620px;isolation:isolate;overflow:hidden;background:var(--dsb-ground);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.dsb-art{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.dsb-layer{position:absolute;top:-10%;bottom:-10%;will-change:transform}
.dsb-far{left:calc(var(--dsb-near) * -0.45);right:0;--t:calc(var(--dsb-near) * .45);background-size:var(--t) var(--t);
  background-image:linear-gradient(45deg,rgba(var(--dsb-band),.07) 25%,transparent 25% 50%,rgba(var(--dsb-band),.07) 50% 75%,transparent 75%);animation:dsb-far calc(var(--dsb-speed) * 1.6) linear infinite}
.dsb-mid{left:calc(var(--dsb-near) * -0.7);right:0;--t:calc(var(--dsb-near) * .7);background-size:var(--t) var(--t);
  background-image:linear-gradient(45deg,rgba(var(--dsb-band),.11) 15%,transparent 15% 50%,rgba(var(--dsb-band),.11) 50% 65%,transparent 65%);animation:dsb-mid calc(var(--dsb-speed) * 1.2) linear infinite}
.dsb-near{left:calc(var(--dsb-near) * -1);right:0;--t:var(--dsb-near);background-size:var(--t) var(--t);
  background-image:linear-gradient(45deg,rgba(var(--dsb-band),.30) 0 1.2%,rgba(var(--dsb-band),.16) 1.2% 9%,rgba(255,250,240,.16) 9% 10.5%,transparent 10.5% 50%,rgba(var(--dsb-band),.30) 50% 51.2%,rgba(var(--dsb-band),.16) 51.2% 59%,rgba(255,250,240,.16) 59% 60.5%,transparent 60.5%);
  animation:dsb-near var(--dsb-speed) linear infinite}
.dsb-light{position:absolute;inset:0;background:radial-gradient(70% 60% at 30% 20%,rgba(255,248,236,.55),transparent 70%),radial-gradient(80% 70% at 100% 100%,rgba(120,60,30,.14),transparent 70%)}
.dsb-calm{position:absolute;left:50%;top:50%;width:min(900px,110%);height:520px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(239,227,207,.92),rgba(239,227,207,.6) 55%,transparent 100%)}
@keyframes dsb-far{to{transform:translateX(calc(var(--dsb-near) * .45))}}
@keyframes dsb-mid{to{transform:translateX(calc(var(--dsb-near) * .7))}}
@keyframes dsb-near{to{transform:translateX(var(--dsb-near))}}
.dsb-hero{position:relative;z-index:1;box-sizing:border-box;width:100%;max-width:720px;margin:0 auto;padding:112px 20px;text-align:center}
.dsb-hero > *{max-width:none}
.dsb-eyebrow{margin:0 0 18px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#8a3f1c}
.dsb-title{margin:0;font-size:clamp(2.1rem,5.4vw,3.6rem);line-height:1.06;letter-spacing:-.025em;font-weight:650;color:#2b1a10;text-wrap:balance}
.dsb-copy{margin:20px auto 0;max-width:34em;font-size:clamp(1rem,1.6vw,1.125rem);line-height:1.6;color:#5a4436}
.dsb-btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;margin-top:32px;padding:0 24px;border-radius:4px;background:#2b1a10;color:#f8efe2;font-size:15px;font-weight:600;text-decoration:none;box-shadow:none;transition:transform .2s ease,background-color .2s ease}
.dsb-btn:hover{transform:translateY(-1px);background:#43291a}
.dsb-btn:focus-visible{outline:2px solid #8a3f1c;outline-offset:3px}
@media (max-width:640px){.dsb-hero{padding:88px 20px}}
.dsb-root[data-paused] *,.dsb-root[data-paused] *::before,.dsb-root[data-paused] *::after{animation-play-state:paused!important}
@media (prefers-reduced-motion: reduce){

.dsb-root *,.dsb-root *::before,.dsb-root *::after{animation:none!important;transition:none!important}
}
`;

export default function LayeredDiagonalStripeBands() {
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
    <section ref={root} className="dsb-root relative w-full overflow-hidden">
      <style>{css}</style>
      <div className="dsb-art" aria-hidden="true">
        <div className="dsb-layer dsb-far"></div>
        <div className="dsb-layer dsb-mid"></div>
        <div className="dsb-layer dsb-near"></div>
        <div className="dsb-light"></div>
        <div className="dsb-calm"></div>
      </div>
      <div className="dsb-hero">
      <p className="dsb-eyebrow">Hand-loomed in small runs</p>
      <h1 className="dsb-title">Rugs woven at the pace of the river.</h1>
      <p className="dsb-copy">Flatweaves in undyed wool and madder red, each one finished by hand and numbered on the back.</p>
      <a className="dsb-btn" href="#">See the spring weaves</a>
      </div>
    </section>
  );
}
