import { useEffect, useRef } from "react";

// A tilted floor grid rolls toward the viewer while a warm glow slides along the horizon.
// Pure CSS: the decorative layer is aria-hidden and animates transform and opacity.
// The effect pauses while the section is off screen and stays still for reduced motion.

const css = `
.pfg-root{
  /* Change these: */
  --pfg-line: rgba(255,178,128,.42);   /* grid line colour */
  --pfg-glow: rgba(255,150,100,.9);     /* travelling glow colour */
  --pfg-cell: 46px;                    /* grid cell size */
  --pfg-speed: 3.2s;                   /* time to roll one cell toward you */
  --pfg-sweep: 14s;                    /* time for the glow to cross and return */
}
@property --pfg-heat{syntax:"<number>";inherits:false;initial-value:.7}
.pfg-root{position:relative;display:flex;align-items:flex-start;min-height:640px;isolation:isolate;overflow:hidden;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  background:linear-gradient(180deg,#070b16 0%,#0e1226 34%,#241a36 52%,#4a2a3c 58%,#1a1020 66%,#0a0710 100%)}
.pfg-art{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.pfg-sky{position:absolute;inset:0;background:radial-gradient(60% 40% at 50% 58%,rgba(255,150,110,.22),transparent 70%),radial-gradient(90% 60% at 50% 0%,rgba(70,90,160,.18),transparent 70%)}
.pfg-sun{position:absolute;left:50%;top:62%;width:min(1100px,140%);height:260px;transform:translate(-50%,-55%);border-radius:50%;
  background:radial-gradient(closest-side,rgba(255,196,150,calc(var(--pfg-heat)*.75)),rgba(255,120,90,calc(var(--pfg-heat)*.22)) 55%,transparent 100%);animation:pfg-breathe 9s ease-in-out infinite alternate}
.pfg-stage{position:absolute;left:0;right:0;top:62%;bottom:0;perspective:520px;perspective-origin:50% 0;
  -webkit-mask-image:linear-gradient(180deg,transparent 0%,#000 38%);mask-image:linear-gradient(180deg,transparent 0%,#000 38%)}
.pfg-plane{position:absolute;left:-150%;right:-150%;top:0;height:420%;transform-origin:50% 0;transform:rotateX(76deg);overflow:hidden}
.pfg-lines{position:absolute;left:0;right:0;top:calc(var(--pfg-cell) * -1);bottom:0;will-change:transform;
  background-image:linear-gradient(var(--pfg-line) 2px,transparent 2px),linear-gradient(90deg,var(--pfg-line) 2px,transparent 2px);
  background-size:var(--pfg-cell) var(--pfg-cell);background-position:50% 0;animation:pfg-roll var(--pfg-speed) linear infinite}
.pfg-glow{position:absolute;left:50%;top:0;width:700px;height:2200px;margin-left:-350px;border-radius:50%;mix-blend-mode:screen;will-change:transform;
  background:radial-gradient(closest-side,var(--pfg-glow),rgba(255,120,80,.18) 45%,transparent 75%);animation:pfg-sweep var(--pfg-sweep) ease-in-out infinite alternate;transform:translateX(-26vw)}
.pfg-haze{position:absolute;left:0;right:0;top:50%;height:22%;background:linear-gradient(180deg,transparent,rgba(255,170,140,.10) 45%,rgba(40,20,40,.0));filter:none}
.pfg-shade{position:absolute;inset:0;background:radial-gradient(120% 70% at 50% 100%,transparent 40%,rgba(5,4,10,.65) 100%)}
@keyframes pfg-roll{to{transform:translateY(var(--pfg-cell))}}
@keyframes pfg-sweep{0%{transform:translateX(-26vw)}100%{transform:translateX(26vw)}}
@keyframes pfg-breathe{0%{--pfg-heat:.7;opacity:.9}100%{--pfg-heat:1;opacity:1}}
.pfg-hero{position:relative;z-index:1;box-sizing:border-box;width:100%;max-width:720px;margin:0 auto;padding:84px 20px 290px;text-align:center}
.pfg-hero > *{max-width:none}
.pfg-eyebrow{margin:0 0 18px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#ffc9a8}
.pfg-title{margin:0;font-size:clamp(2.1rem,5.4vw,3.6rem);line-height:1.06;letter-spacing:-.025em;font-weight:650;color:#fff7f0;text-wrap:balance}
.pfg-copy{margin:20px auto 0;max-width:34em;font-size:clamp(1rem,1.6vw,1.125rem);line-height:1.6;color:#e9dcd6}
.pfg-btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;margin-top:32px;padding:0 24px;border-radius:999px;background:#ffb48a;color:#24121a;font-size:15px;font-weight:600;text-decoration:none;box-shadow:0 10px 30px -10px rgba(255,150,100,.6);transition:transform .2s ease,background-color .2s ease}
.pfg-btn:hover{transform:translateY(-1px);background:#ffc3a0}
.pfg-btn:focus-visible{outline:2px solid #ffd9c2;outline-offset:3px}
@media (max-width:640px){.pfg-hero{padding:64px 20px 250px}}
.pfg-root[data-paused] *,.pfg-root[data-paused] *::before,.pfg-root[data-paused] *::after{animation-play-state:paused!important}
@media (prefers-reduced-motion: reduce){
.pfg-glow{transform:translateX(-12vw)}
.pfg-root *,.pfg-root *::before,.pfg-root *::after{animation:none!important;transition:none!important}
}
`;

export default function PerspectiveFloorGrid() {
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
    <section ref={root} className="pfg-root relative w-full overflow-hidden">
      <style>{css}</style>
      <div className="pfg-art" aria-hidden="true">
        <div className="pfg-sky"></div>
        <div className="pfg-sun"></div>
        <div className="pfg-haze"></div>
        <div className="pfg-stage"><div className="pfg-plane"><div className="pfg-lines"></div><div className="pfg-glow"></div></div></div>
        <div className="pfg-shade"></div>
      </div>
      <div className="pfg-hero">
      <p className="pfg-eyebrow">Night shift synth rentals</p>
      <h1 className="pfg-title">Analog gear, delivered before soundcheck.</h1>
      <p className="pfg-copy">Modular racks, drum machines and vintage keys, tested the morning they ship and collected after the show.</p>
      <a className="pfg-btn" href="#">Browse tonight's racks</a>
      </div>
    </section>
  );
}
