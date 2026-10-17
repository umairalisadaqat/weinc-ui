import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const css = `
/* Change these: cloth colour, lamp colour, seconds for one lamp circuit, thread spacing */
.lnw{--lnw-cloth:#e0d4bf;--lnw-lamp:rgba(255,228,176,.95);--lnw-speed:24s;--lnw-thread:3px}
.lnw{position:relative;isolation:isolate;overflow:hidden;min-height:560px;display:flex;align-items:center;background:var(--lnw-cloth);color:#2b241c;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.lnw-fx{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.lnw-fx *{position:absolute;pointer-events:none}
.lnw-hero{position:relative;z-index:1;width:100%;max-width:1120px;margin:0 auto;padding:72px 24px;box-sizing:border-box}
.lnw-eyebrow{margin:0 0 14px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.lnw-title{margin:0;max-width:15ch;font-size:clamp(34px,5.6vw,60px);line-height:1.04;letter-spacing:-.025em;font-weight:650}
.lnw-copy{margin:20px 0 30px;max-width:44ch;font-size:clamp(16px,1.6vw,18px);line-height:1.6}
.lnw-btn{display:inline-block;padding:13px 24px;border-radius:999px;font-size:15px;font-weight:600;text-decoration:none;transition:transform .2s ease}
.lnw-btn:hover{transform:translateY(-1px)}
.lnw-btn:focus-visible{outline:3px solid currentColor;outline-offset:4px}
.lnw[data-paused] *,.lnw[data-paused] *::before,.lnw[data-paused] *::after{animation-play-state:paused!important}
.lnw[data-reduced] *,.lnw[data-reduced] *::before,.lnw[data-reduced] *::after{animation:none!important}
@media (prefers-reduced-motion:reduce){.lnw *,.lnw *::before,.lnw *::after{animation:none!important}}
.lnw-weave{inset:0;background:repeating-linear-gradient(0deg,rgba(90,68,40,.13) 0,rgba(90,68,40,.13) 1px,rgba(0,0,0,0) 1px,rgba(0,0,0,0) var(--lnw-thread)),repeating-linear-gradient(90deg,rgba(255,250,238,.22) 0,rgba(255,250,238,.22) 1px,rgba(0,0,0,0) 1px,rgba(0,0,0,0) var(--lnw-thread)),repeating-linear-gradient(90deg,rgba(90,68,40,.09) 0,rgba(90,68,40,.09) 1px,rgba(0,0,0,0) 1px,rgba(0,0,0,0) calc(var(--lnw-thread) * 1.7))}
.lnw-slub{inset:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.006 .32' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .24 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.28 .008' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .16 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .18 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");mix-blend-mode:multiply}
.lnw-crease{inset:0;background:linear-gradient(112deg,rgba(255,255,255,0) 50%,rgba(255,250,240,.22) 57%,rgba(70,50,28,.14) 60%,rgba(70,50,28,0) 67%)}
.lnw-lamp{width:110%;aspect-ratio:1;left:22%;top:-48%;background:radial-gradient(closest-side,var(--lnw-lamp),rgba(255,228,176,.35) 45%,rgba(255,228,176,0) 78%);mix-blend-mode:soft-light;opacity:1;transform:translate(10%,-6%);animation:lnw-orbit var(--lnw-speed) ease-in-out infinite;animation-delay:calc(var(--lnw-speed) * -.2)}
.lnw-lamp2{mix-blend-mode:screen;opacity:.32}
.lnw-vignette{inset:0;background:radial-gradient(120% 100% at 62% 35%,rgba(60,42,22,0) 50%,rgba(60,42,22,.3))}
.lnw-eyebrow{color:#6b4a26}
.lnw-copy{color:#3e3428}
.lnw-btn{background:#2b241c;color:#f4ede1}
@keyframes lnw-orbit{0%,100%{transform:translate(10%,-6%)}33%{transform:translate(-12%,10%)}66%{transform:translate(18%,14%)}}
`;

export default function LinenWeaveUnderMovingLamp() {
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
    <section ref={ref} className="lnw" data-reduced={reduce ? "" : undefined}>
      <style>{css}</style>
      <div className="lnw-fx" aria-hidden="true"><div className="lnw-weave" /><div className="lnw-slub" /><div className="lnw-crease" /><div className="lnw-lamp" /><div className="lnw-lamp lnw-lamp2" /><div className="lnw-vignette" /></div>
      <div className="lnw-hero"><p className="lnw-eyebrow">Flax and Fold</p><h1 className="lnw-title">Washed linen bedding that softens every year</h1><p className="lnw-copy">Stone washed in a small mill, cut in our workshop and shipped folded in paper with no plastic anywhere.</p><a className="lnw-btn" href="#">Shop the sheets</a></div>
    </section>
  );
}
