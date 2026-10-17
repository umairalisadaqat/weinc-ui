import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const css = `
/* Change these: metal colour, sheen colour, seconds between sheens, brush texture strength */
.bst{--bst-metal:#2b3035;--bst-sheen:rgba(230,236,244,.13);--bst-speed:11s;--bst-grain:.85}
.bst{position:relative;isolation:isolate;overflow:hidden;min-height:560px;display:flex;align-items:center;background:linear-gradient(180deg,#323840,var(--bst-metal) 55%,#24282d);color:#f2f4f6;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.bst-fx{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.bst-fx *{position:absolute;pointer-events:none}
.bst-hero{position:relative;z-index:1;width:100%;max-width:1120px;margin:0 auto;padding:72px 24px;box-sizing:border-box}
.bst-eyebrow{margin:0 0 14px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.bst-title{margin:0;max-width:15ch;font-size:clamp(34px,5.6vw,60px);line-height:1.04;letter-spacing:-.025em;font-weight:650}
.bst-copy{margin:20px 0 30px;max-width:44ch;font-size:clamp(16px,1.6vw,18px);line-height:1.6}
.bst-btn{display:inline-block;padding:13px 24px;border-radius:999px;font-size:15px;font-weight:600;text-decoration:none;transition:transform .2s ease}
.bst-btn:hover{transform:translateY(-1px)}
.bst-btn:focus-visible{outline:3px solid currentColor;outline-offset:4px}
.bst[data-paused] *,.bst[data-paused] *::before,.bst[data-paused] *::after{animation-play-state:paused!important}
.bst[data-reduced] *,.bst[data-reduced] *::before,.bst[data-reduced] *::after{animation:none!important}
@media (prefers-reduced-motion:reduce){.bst *,.bst *::before,.bst *::after{animation:none!important}}
.bst-brush{inset:0;opacity:var(--bst-grain);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.0015 .55' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .22 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.003 .9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .45 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");mix-blend-mode:normal}
.bst-sheen{top:-25%;bottom:-25%;left:-50%;width:42%;background:linear-gradient(90deg,rgba(230,236,244,0),var(--bst-sheen) 42%,rgba(255,255,255,.2) 50%,var(--bst-sheen) 58%,rgba(230,236,244,0));mix-blend-mode:screen;transform:translateX(250%) skewX(-22deg);animation:bst-sweep var(--bst-speed) cubic-bezier(.55,0,.35,1) infinite;animation-delay:calc(var(--bst-speed) * -.2)}
.bst-wide{width:80%;left:-85%;opacity:.55;mix-blend-mode:soft-light;transform:translateX(120%) skewX(-22deg);animation-duration:calc(var(--bst-speed) * 1.9);animation-delay:calc(var(--bst-speed) * -1.2)}
.bst-edge{inset:0;background:linear-gradient(180deg,rgba(255,255,255,.14) 0,rgba(255,255,255,0) 3px),linear-gradient(0deg,rgba(0,0,0,.35) 0,rgba(0,0,0,0) 4px),linear-gradient(90deg,rgba(20,23,27,.55) 0,rgba(20,23,27,0) 55%)}
.bst-eyebrow{color:#b3c0cd}
.bst-copy{color:#ccd3da}
.bst-btn{background:#e8edf2;color:#1b1f24}
@keyframes bst-sweep{0%{transform:translateX(0) skewX(-22deg)}62%,100%{transform:translateX(420%) skewX(-22deg)}}
`;

export default function BrushedSteelSlidingSheen() {
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
    <section ref={ref} className="bst" data-reduced={reduce ? "" : undefined}>
      <style>{css}</style>
      <div className="bst-fx" aria-hidden="true"><div className="bst-brush" /><div className="bst-sheen" /><div className="bst-sheen bst-wide" /><div className="bst-edge" /></div>
      <div className="bst-hero"><p className="bst-eyebrow">Kessler Tool Works</p><h1 className="bst-title">Precision parts machined from solid steel</h1><p className="bst-copy">Five-axis milling and turning for small runs and prototypes, with inspection reports shipped alongside every order.</p><a className="bst-btn" href="#">Request a quote</a></div>
    </section>
  );
}
