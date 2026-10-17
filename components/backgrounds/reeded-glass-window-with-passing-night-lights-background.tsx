import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const css = `
/* Change these: night colour, width of one glass reed, base seconds for a passing light, main lamp colour */
.rdg{--rdg-night:#0c1626;--rdg-reed:22px;--rdg-speed:14s;--rdg-amber:#ffb45e}
.rdg{position:relative;isolation:isolate;overflow:hidden;min-height:560px;display:flex;align-items:center;background:linear-gradient(180deg,#0f1b2e,var(--rdg-night));color:#f4efe6;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.rdg-fx{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.rdg-fx *{position:absolute;pointer-events:none}
.rdg-hero{position:relative;z-index:1;width:100%;max-width:1120px;margin:0 auto;padding:72px 24px;box-sizing:border-box}
.rdg-eyebrow{margin:0 0 14px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.rdg-title{margin:0;max-width:15ch;font-size:clamp(34px,5.6vw,60px);line-height:1.04;letter-spacing:-.025em;font-weight:650}
.rdg-copy{margin:20px 0 30px;max-width:44ch;font-size:clamp(16px,1.6vw,18px);line-height:1.6}
.rdg-btn{display:inline-block;padding:13px 24px;border-radius:999px;font-size:15px;font-weight:600;text-decoration:none;transition:transform .2s ease}
.rdg-btn:hover{transform:translateY(-1px)}
.rdg-btn:focus-visible{outline:3px solid currentColor;outline-offset:4px}
.rdg[data-paused] *,.rdg[data-paused] *::before,.rdg[data-paused] *::after{animation-play-state:paused!important}
.rdg[data-reduced] *,.rdg[data-reduced] *::before,.rdg[data-reduced] *::after{animation:none!important}
@media (prefers-reduced-motion:reduce){.rdg *,.rdg *::before,.rdg *::after{animation:none!important}}
.rdg-lights{inset:0;-webkit-mask-image:repeating-linear-gradient(90deg,rgba(0,0,0,.3) 0,#000 calc(var(--rdg-reed) * .45),rgba(0,0,0,.3) var(--rdg-reed));mask-image:repeating-linear-gradient(90deg,rgba(0,0,0,.3) 0,#000 calc(var(--rdg-reed) * .45),rgba(0,0,0,.3) var(--rdg-reed))}
.rdg-l{left:-22%;width:18%;height:80%;border-radius:50%;animation:rdg-pass var(--rdg-speed) linear infinite}
.rdg-l1{top:8%;background:radial-gradient(closest-side,var(--rdg-amber),rgba(255,180,94,0));animation-duration:calc(var(--rdg-speed) * .8);animation-delay:calc(var(--rdg-speed) * -.35)}
.rdg-l2{top:22%;height:70%;background:radial-gradient(closest-side,rgba(255,244,222,.9),rgba(255,244,222,0));animation-duration:calc(var(--rdg-speed) * 1.25);animation-delay:calc(var(--rdg-speed) * -.6)}
.rdg-l3{top:30%;width:12%;background:radial-gradient(closest-side,rgba(255,86,64,.85),rgba(255,86,64,0));animation-direction:reverse;animation-delay:calc(var(--rdg-speed) * -.25)}
.rdg-l4{top:2%;width:22%;background:radial-gradient(closest-side,rgba(255,170,80,.75),rgba(255,170,80,0));animation-direction:reverse;animation-duration:calc(var(--rdg-speed) * 1.6);animation-delay:calc(var(--rdg-speed) * -1.1)}
.rdg-l5{top:-10%;width:34%;height:100%;background:radial-gradient(closest-side,rgba(150,210,220,.35),rgba(150,210,220,0));animation-duration:calc(var(--rdg-speed) * 3);animation-delay:calc(var(--rdg-speed) * -1.4)}
.rdg-l6{top:14%;width:14%;background:radial-gradient(closest-side,rgba(255,200,120,.9),rgba(255,200,120,0));animation-duration:calc(var(--rdg-speed) * .65);animation-delay:calc(var(--rdg-speed) * -.1)}
.rdg-reeds{inset:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.09) 0,rgba(255,255,255,0) 3px,rgba(0,0,0,0) calc(var(--rdg-reed) * .55),rgba(0,0,0,.32) calc(var(--rdg-reed) - 2px),rgba(255,255,255,.12) var(--rdg-reed))}
.rdg-scrim{inset:0;background:linear-gradient(90deg,rgba(9,16,29,.86) 0,rgba(9,16,29,.6) 42%,rgba(9,16,29,.08) 78%)}
.rdg-eyebrow{color:var(--rdg-amber)}
.rdg-copy{color:#d5d0c7}
.rdg-btn{background:var(--rdg-amber);color:#1b1206}
@keyframes rdg-pass{from{transform:translateX(0)}to{transform:translateX(720%)}}
@media (max-width:700px){.rdg-scrim{background:linear-gradient(180deg,rgba(9,16,29,.55),rgba(9,16,29,.78))}}
`;

export default function ReededGlassNightLights() {
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
    <section ref={ref} className="rdg" data-reduced={reduce ? "" : undefined}>
      <style>{css}</style>
      <div className="rdg-fx" aria-hidden="true"><div className="rdg-lights"><div className="rdg-l rdg-l1" /><div className="rdg-l rdg-l2" /><div className="rdg-l rdg-l3" /><div className="rdg-l rdg-l4" /><div className="rdg-l rdg-l5" /><div className="rdg-l rdg-l6" /></div><div className="rdg-reeds" /><div className="rdg-scrim" /></div>
      <div className="rdg-hero"><p className="rdg-eyebrow">Lantern Street Wine Bar</p><h1 className="rdg-title">Natural wine and small plates behind the fluted glass</h1><p className="rdg-copy">Open from five until late, six nights a week. Walk-ins welcome at the counter; tables can be held for groups of six or more.</p><a className="rdg-btn" href="#">Hold a table</a></div>
    </section>
  );
}
