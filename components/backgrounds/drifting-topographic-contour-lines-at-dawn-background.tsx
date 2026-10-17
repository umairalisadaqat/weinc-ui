import { useEffect, useRef } from "react";

// Two sheets of topographic contour lines drift past each other over a dawn gradient.
// Pure CSS: the decorative layer is aria-hidden and animates transform and opacity.
// The effect pauses while the section is off screen and stays still for reduced motion.

const css = `
.ctr-root{
  /* Change these: */
  --ctr-line: #7b4b63;      /* contour line colour */
  --ctr-strength: .38;      /* how visible the near sheet of lines is */
  --ctr-drift: 34s;         /* time for one drift, there and back */
}
.ctr-root{position:relative;display:flex;align-items:center;min-height:620px;isolation:isolate;overflow:hidden;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  background:linear-gradient(160deg,#f8e9dc 0%,#f3dcd3 38%,#e7d6e3 72%,#dcd7ea 100%)}
.ctr-art{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.ctr-sun{position:absolute;left:12%;top:-20%;width:70%;height:80%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,226,196,.9),transparent);will-change:transform;animation:ctr-sun calc(var(--ctr-drift) * 1.3) ease-in-out infinite alternate}
.ctr-sheet{position:absolute;inset:-12%;color:var(--ctr-line);will-change:transform}
.ctr-sheet svg{display:block;width:100%;height:100%}
.ctr-near{opacity:var(--ctr-strength);animation:ctr-near var(--ctr-drift) ease-in-out infinite alternate}
.ctr-far{opacity:calc(var(--ctr-strength) * .5);transform:scale(1.25);animation:ctr-far calc(var(--ctr-drift) * 1.5) ease-in-out infinite alternate}
.ctr-calm{position:absolute;left:50%;top:50%;width:min(820px,115%);height:430px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(246,228,224,.85),rgba(246,228,224,.4) 60%,transparent)}
@keyframes ctr-near{from{transform:translate(-3%,-2%)}to{transform:translate(3%,2%)}}
@keyframes ctr-far{from{transform:scale(1.25) translate(2%,1%) rotate(0deg)}to{transform:scale(1.25) translate(-2%,-2%) rotate(3deg)}}
@keyframes ctr-sun{from{transform:translateX(0)}to{transform:translateX(30%)}}
.ctr-hero{position:relative;z-index:1;box-sizing:border-box;width:100%;max-width:720px;margin:0 auto;padding:112px 20px;text-align:center}
.ctr-hero > *{max-width:none}
.ctr-eyebrow{margin:0 0 18px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#7b3f5c}
.ctr-title{margin:0;font-size:clamp(2.1rem,5.4vw,3.6rem);line-height:1.06;letter-spacing:-.025em;font-weight:650;color:#2a1622;text-wrap:balance}
.ctr-copy{margin:20px auto 0;max-width:34em;font-size:clamp(1rem,1.6vw,1.125rem);line-height:1.6;color:#5b4250}
.ctr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;margin-top:32px;padding:0 24px;border-radius:999px;background:#3a1f30;color:#fbefe9;font-size:15px;font-weight:600;text-decoration:none;box-shadow:none;transition:transform .2s ease,background-color .2s ease}
.ctr-btn:hover{transform:translateY(-1px);background:#4e2a40}
.ctr-btn:focus-visible{outline:2px solid #7b3f5c;outline-offset:3px}
@media (max-width:640px){.ctr-hero{padding:88px 20px}}
.ctr-root[data-paused] *,.ctr-root[data-paused] *::before,.ctr-root[data-paused] *::after{animation-play-state:paused!important}
@media (prefers-reduced-motion: reduce){

.ctr-root *,.ctr-root *::before,.ctr-root *::after{animation:none!important;transition:none!important}
}
`;

export default function DriftingContourLines() {
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
    <section ref={root} className="ctr-root relative w-full overflow-hidden">
      <style>{css}</style>
      <div className="ctr-art" aria-hidden="true">
        <div className="ctr-sun"></div>
        <div className="ctr-sheet ctr-far"><svg viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice"><filter id="ctr-far-f" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.003" numOctaves="1" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0"/><feGaussianBlur stdDeviation="4"/><feComponentTransfer><feFuncA type="discrete" tableValues="0 .07 .14 .21 .28 .35 .42 .49 .56 .63 .70 .77 .84 .91 1"/></feComponentTransfer><feConvolveMatrix order="3" kernelMatrix="0 -1 0 -1 4 -1 0 -1 0" preserveAlpha="false"/><feComponentTransfer result="e"><feFuncA type="linear" slope="40"/></feComponentTransfer><feFlood floodColor="currentColor"/><feComposite operator="in" in2="e"/></filter><rect width="900" height="600" filter="url(#ctr-far-f)"/></svg></div>
        <div className="ctr-sheet ctr-near"><svg viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice"><filter id="ctr-near-f" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.0042" numOctaves="2" seed="4"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0"/><feGaussianBlur stdDeviation="4"/><feComponentTransfer><feFuncA type="discrete" tableValues="0 .05 .1 .15 .2 .25 .3 .35 .4 .45 .5 .55 .6 .65 .7 .75 .8 .85 .9 .95 1"/></feComponentTransfer><feConvolveMatrix order="3" kernelMatrix="0 -1 0 -1 4 -1 0 -1 0" preserveAlpha="false"/><feComponentTransfer result="e"><feFuncA type="linear" slope="40"/></feComponentTransfer><feFlood floodColor="currentColor"/><feComposite operator="in" in2="e"/></filter><rect width="900" height="600" filter="url(#ctr-near-f)"/></svg></div>
        <div className="ctr-calm"></div>
      </div>
      <div className="ctr-hero">
      <p className="ctr-eyebrow">Guided ridge walks</p>
      <h1 className="ctr-title">Up before the light, home by lunch.</h1>
      <p className="ctr-copy">Small-group dawn hikes on the high moor, with flasks of coffee at the summit cairn and a guide who knows every path.</p>
      <a className="ctr-btn" href="#">Pick a morning</a>
      </div>
    </section>
  );
}
