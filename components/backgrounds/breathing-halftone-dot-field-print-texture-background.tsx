import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const css = `
/* Change these: paper colour, ink colour, dot cell size, seconds for one slow swell */
.htn{--htn-paper:#f2e8d5;--htn-ink:#1d3452;--htn-cell:11px;--htn-speed:14s}
.htn{position:relative;isolation:isolate;overflow:hidden;min-height:560px;display:flex;align-items:center;background:var(--htn-paper);color:var(--htn-ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.htn-fx{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.htn-fx *{position:absolute;pointer-events:none}
.htn-hero{position:relative;z-index:1;width:100%;max-width:1120px;margin:0 auto;padding:72px 24px;box-sizing:border-box}
.htn-eyebrow{margin:0 0 14px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.htn-title{margin:0;max-width:15ch;font-size:clamp(34px,5.6vw,60px);line-height:1.04;letter-spacing:-.025em;font-weight:650}
.htn-copy{margin:20px 0 30px;max-width:44ch;font-size:clamp(16px,1.6vw,18px);line-height:1.6}
.htn-btn{display:inline-block;padding:13px 24px;border-radius:999px;font-size:15px;font-weight:600;text-decoration:none;transition:transform .2s ease}
.htn-btn:hover{transform:translateY(-1px)}
.htn-btn:focus-visible{outline:3px solid currentColor;outline-offset:4px}
.htn[data-paused] *,.htn[data-paused] *::before,.htn[data-paused] *::after{animation-play-state:paused!important}
.htn[data-reduced] *,.htn[data-reduced] *::before,.htn[data-reduced] *::after{animation:none!important}
@media (prefers-reduced-motion:reduce){.htn *,.htn *::before,.htn *::after{animation:none!important}}
.htn-screen{inset:0;background:#fff;filter:contrast(18)}
.htn-tone{inset:0;background:linear-gradient(100deg,#fff 50%,#e8e8e8 72%,#cdcdcd 100%)}
.htn-blob{aspect-ratio:1;border-radius:50%;background:radial-gradient(closest-side,#8c8c8c,#bcbcbc 45%,#ececec 78%,rgba(255,255,255,0));mix-blend-mode:multiply}
.htn-a{width:70%;right:-26%;top:-36%;animation:htn-a var(--htn-speed) ease-in-out infinite alternate;animation-delay:calc(var(--htn-speed) * -.3)}
.htn-b{width:58%;right:2%;bottom:-48%;animation:htn-b calc(var(--htn-speed) * 1.35) ease-in-out infinite alternate;animation-delay:calc(var(--htn-speed) * -.7)}
.htn-dots{inset:0;background:radial-gradient(closest-side,#6e6e6e,#fff) 0 0/var(--htn-cell) var(--htn-cell);mix-blend-mode:multiply}
.htn-ink{inset:0;background:var(--htn-ink);mix-blend-mode:screen}
.htn-paper{inset:0;background:var(--htn-paper);mix-blend-mode:multiply}
.htn-grain{inset:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");mix-blend-mode:multiply;opacity:.6}
.htn-eyebrow{color:#8a3b22}
.htn-copy{color:#2c3e55}
.htn-btn{background:var(--htn-ink);color:var(--htn-paper)}
@keyframes htn-a{from{transform:translate(0,0) scale(.9)}to{transform:translate(-8%,16%) scale(1.1)}}
@keyframes htn-b{from{transform:translate(0,0) scale(1.1)}to{transform:translate(-18%,-12%) scale(.85)}}
@media (max-width:700px){.htn-tone{background:linear-gradient(180deg,#fff 55%,#d4d4d4)}.htn-a{width:110%;right:-40%;top:auto;bottom:-55%}.htn-b{width:80%;right:auto;left:-40%;bottom:-50%}}
`;

export default function BreathingHalftoneDotField() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.removeAttribute("data-paused");
      else el.setAttribute("data-paused", "");
    });
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <section ref={ref} className="htn" data-reduced={reduce ? "" : undefined}>
      <style>{css}</style>
      <div className="htn-fx" aria-hidden="true"><div className="htn-screen"><div className="htn-tone" /><div className="htn-blob htn-a" /><div className="htn-blob htn-b" /><div className="htn-dots" /></div><div className="htn-ink" /><div className="htn-paper" /><div className="htn-grain" /></div>
      <div className="htn-hero"><p className="htn-eyebrow">Fieldnote Press</p><h1 className="htn-title">Riso prints, zines and posters in two inks</h1><p className="htn-copy">Bring a file or a sketch. We print short runs on recycled stock and you can watch the drum turn while you wait.</p><a className="htn-btn" href="#">See this month's paper</a></div>
    </section>
  );
}
