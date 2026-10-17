import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const css = `
/* Change these: wall colour, sunlight colour, how long one slow pass takes, slat spacing, text colour */
.vbl{--vbl-wall:#ddc9ad;--vbl-sun:rgba(255,214,150,.9);--vbl-speed:30s;--vbl-slat:36px;--vbl-ink:#3a2718}
.vbl{position:relative;isolation:isolate;overflow:hidden;min-height:560px;display:flex;align-items:center;background:linear-gradient(180deg,var(--vbl-wall),#cdb593);color:var(--vbl-ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.vbl-fx{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.vbl-fx *{position:absolute;pointer-events:none}
.vbl-hero{position:relative;z-index:1;width:100%;max-width:1120px;margin:0 auto;padding:72px 24px;box-sizing:border-box}
.vbl-eyebrow{margin:0 0 14px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.vbl-title{margin:0;max-width:15ch;font-size:clamp(34px,5.6vw,60px);line-height:1.04;letter-spacing:-.025em;font-weight:650}
.vbl-copy{margin:20px 0 30px;max-width:44ch;font-size:clamp(16px,1.6vw,18px);line-height:1.6}
.vbl-btn{display:inline-block;padding:13px 24px;border-radius:999px;font-size:15px;font-weight:600;text-decoration:none;transition:transform .2s ease}
.vbl-btn:hover{transform:translateY(-1px)}
.vbl-btn:focus-visible{outline:3px solid currentColor;outline-offset:4px}
.vbl[data-paused] *,.vbl[data-paused] *::before,.vbl[data-paused] *::after{animation-play-state:paused!important}
.vbl[data-reduced] *,.vbl[data-reduced] *::before,.vbl[data-reduced] *::after{animation:none!important}
@media (prefers-reduced-motion:reduce){.vbl *,.vbl *::before,.vbl *::after{animation:none!important}}
.vbl-patch{width:62%;height:118%;left:38%;top:-6%;transform:rotate(-14deg) skewX(-20deg);mix-blend-mode:screen;filter:blur(2px);-webkit-mask-image:radial-gradient(75% 70% at 50% 45%,#000 55%,transparent 100%);mask-image:radial-gradient(75% 70% at 50% 45%,#000 55%,transparent 100%);animation:vbl-slide var(--vbl-speed) ease-in-out infinite alternate;animation-delay:calc(var(--vbl-speed) * -.45)}
.vbl-slats{top:0;bottom:0;left:0;width:47.5%;background:repeating-linear-gradient(180deg,var(--vbl-sun) 0,var(--vbl-sun) calc(var(--vbl-slat) * .58),rgba(255,206,140,0) calc(var(--vbl-slat) * .74),rgba(255,206,140,0) var(--vbl-slat));animation:vbl-tilt 11s ease-in-out infinite alternate}
.vbl-pane2{left:51.5%;width:48.5%}
.vbl-bounce{width:70%;height:90%;right:-10%;bottom:-30%;background:radial-gradient(closest-side,rgba(255,190,120,.35),rgba(255,190,120,0));animation:vbl-glow 13s ease-in-out infinite alternate}
.vbl-grain{inset:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .42 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");mix-blend-mode:multiply;opacity:.7}
.vbl-shade{inset:0;background:radial-gradient(130% 100% at 70% 30%,rgba(80,50,20,0) 45%,rgba(80,50,20,.22))}
.vbl-eyebrow{color:#7a431c}
.vbl-copy{color:#4a3424}
.vbl-btn{background:var(--vbl-ink);color:#f7eddf}
@keyframes vbl-slide{from{transform:translate(-12%,-2%) rotate(-15deg) skewX(-22deg)}to{transform:translate(12%,4%) rotate(-11deg) skewX(-15deg)}}
@keyframes vbl-tilt{from{transform:scaleY(.95) translateY(-4px)}to{transform:scaleY(1.04) translateY(5px)}}
@keyframes vbl-glow{from{opacity:.55;transform:translateX(-4%)}to{opacity:1;transform:translateX(4%)}}
`;

export default function SlattedBlindLightOnPlasterWall() {
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
    <section ref={ref} className="vbl" data-reduced={reduce ? "" : undefined}>
      <style>{css}</style>
      <div className="vbl-fx" aria-hidden="true"><div className="vbl-patch"><div className="vbl-slats" /><div className="vbl-slats vbl-pane2" /></div><div className="vbl-bounce" /><div className="vbl-grain" /><div className="vbl-shade" /></div>
      <div className="vbl-hero"><p className="vbl-eyebrow">Alder Clay Studio</p><h1 className="vbl-title">Stoneware thrown by hand, fired in small batches</h1><p className="vbl-copy">Mugs, bowls and serving plates made in a sunny back room on Fern Street. New kiln loads go on the shelves every second Saturday.</p><a className="vbl-btn" href="#">Visit the studio</a></div>
    </section>
  );
}
