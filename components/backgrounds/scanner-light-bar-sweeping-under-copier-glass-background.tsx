import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const css = `
/* Change these: glass colour, colour of the light bar, seconds for one pass, text colour */
.cpy{--cpy-glass:#121618;--cpy-light:rgba(196,255,238,.9);--cpy-speed:6.5s;--cpy-ink:#eef3f2}
.cpy{position:relative;isolation:isolate;overflow:hidden;min-height:560px;display:flex;align-items:center;background:radial-gradient(90% 80% at 72% 50%,#1e2528 0,var(--cpy-glass) 70%);color:var(--cpy-ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.cpy-fx{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.cpy-fx *{position:absolute;pointer-events:none}
.cpy-hero{position:relative;z-index:1;width:100%;max-width:1120px;margin:0 auto;padding:72px 24px;box-sizing:border-box}
.cpy-eyebrow{margin:0 0 14px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.cpy-title{margin:0;max-width:15ch;font-size:clamp(34px,5.6vw,60px);line-height:1.04;letter-spacing:-.025em;font-weight:650}
.cpy-copy{margin:20px 0 30px;max-width:44ch;font-size:clamp(16px,1.6vw,18px);line-height:1.6}
.cpy-btn{display:inline-block;padding:13px 24px;border-radius:999px;font-size:15px;font-weight:600;text-decoration:none;transition:transform .2s ease}
.cpy-btn:hover{transform:translateY(-1px)}
.cpy-btn:focus-visible{outline:3px solid currentColor;outline-offset:4px}
.cpy[data-paused] *,.cpy[data-paused] *::before,.cpy[data-paused] *::after{animation-play-state:paused!important}
.cpy[data-reduced] *,.cpy[data-reduced] *::before,.cpy[data-reduced] *::after{animation:none!important}
@media (prefers-reduced-motion:reduce){.cpy *,.cpy *::before,.cpy *::after{animation:none!important}}
.cpy-page{width:min(44%,500px);aspect-ratio:.77;right:7%;top:50%;transform:translateY(-50%) rotate(2.5deg);background:#272e31;box-shadow:0 30px 60px rgba(0,0,0,.45)}
.cpy-head{left:11%;top:9%;width:46%;height:5%;background:#384246}
.cpy-lines{left:11%;right:11%;top:20%;bottom:22%;background:repeating-linear-gradient(180deg,#353e42 0,#353e42 5px,rgba(0,0,0,0) 5px,rgba(0,0,0,0) 17px);-webkit-mask-image:linear-gradient(90deg,#000 62%,rgba(0,0,0,.35) 88%,transparent);mask-image:linear-gradient(90deg,#000 62%,rgba(0,0,0,.35) 88%,transparent)}
.cpy-stamp{right:11%;bottom:8%;width:22%;aspect-ratio:1;border-radius:50%;border:3px solid #3a4549}
.cpy-bar{left:0;right:0;top:0;height:100%;background:linear-gradient(180deg,rgba(120,220,200,0) 36%,rgba(120,220,200,.10) 44%,rgba(170,245,225,.45) 49%,var(--cpy-light) 49.7%,#ffffff 50%,var(--cpy-light) 50.3%,rgba(170,245,225,.45) 51%,rgba(120,220,200,.12) 56%,rgba(120,220,200,0) 64%);mix-blend-mode:screen;animation:cpy-scan var(--cpy-speed) cubic-bezier(.45,0,.55,1) infinite alternate;animation-delay:calc(var(--cpy-speed) * -.4);transform:translateY(12%)}
.cpy-dust{inset:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");opacity:.06;mix-blend-mode:screen}
.cpy-sheen{inset:0;background:linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.035) 42%,rgba(255,255,255,0) 52%),linear-gradient(90deg,rgba(18,22,24,.9) 0,rgba(18,22,24,.55) 40%,rgba(18,22,24,0) 60%)}
.cpy-eyebrow{color:#8fe8cf}
.cpy-copy{color:#c2cdcb}
.cpy-btn{background:#cdf7ea;color:#0f1716}
@keyframes cpy-scan{from{transform:translateY(-48%)}to{transform:translateY(48%)}}
@media (max-width:700px){.cpy-page{width:78%;right:-14%;top:auto;bottom:-24%;transform:rotate(6deg);opacity:.75}.cpy-sheen{background:linear-gradient(180deg,rgba(18,22,24,.75) 0,rgba(18,22,24,.5) 60%,rgba(18,22,24,.2))}}
`;

export default function ScannerLightBarUnderGlass() {
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
    <section ref={ref} className="cpy" data-reduced={reduce ? "" : undefined}>
      <style>{css}</style>
      <div className="cpy-fx" aria-hidden="true"><div className="cpy-page"><div className="cpy-head" /><div className="cpy-lines" /><div className="cpy-stamp" /></div><div className="cpy-bar" /><div className="cpy-dust" /><div className="cpy-sheen" /></div>
      <div className="cpy-hero"><p className="cpy-eyebrow">Paper Trail Archive</p><h1 className="cpy-title">Boxes of old records, turned into files you can search</h1><p className="cpy-copy">We scan deeds, ledgers and family letters at full resolution, then return every original page in the order it arrived.</p><a className="cpy-btn" href="#">Get a scanning quote</a></div>
    </section>
  );
}
