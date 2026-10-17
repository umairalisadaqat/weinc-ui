import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const css = `
/* Change these: room colour, beam colour (r,g,b), beam strength, seconds for one dust drift */
.pjb{--pjb-room:#13100e;--pjb-beam:255,234,196;--pjb-strength:.34;--pjb-drift:46s}
.pjb{position:relative;isolation:isolate;overflow:hidden;min-height:560px;display:flex;align-items:center;background:radial-gradient(70% 60% at 92% 0%,#2b221b 0,rgba(43,34,27,0) 65%),var(--pjb-room);color:#f3eadc;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.pjb-fx{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.pjb-fx *{position:absolute;pointer-events:none}
.pjb-hero{position:relative;z-index:1;width:100%;max-width:1120px;margin:0 auto;padding:72px 24px;box-sizing:border-box}
.pjb-eyebrow{margin:0 0 14px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.pjb-title{margin:0;max-width:15ch;font-size:clamp(34px,5.6vw,60px);line-height:1.04;letter-spacing:-.025em;font-weight:650}
.pjb-copy{margin:20px 0 30px;max-width:44ch;font-size:clamp(16px,1.6vw,18px);line-height:1.6}
.pjb-btn{display:inline-block;padding:13px 24px;border-radius:999px;font-size:15px;font-weight:600;text-decoration:none;transition:transform .2s ease}
.pjb-btn:hover{transform:translateY(-1px)}
.pjb-btn:focus-visible{outline:3px solid currentColor;outline-offset:4px}
.pjb[data-paused] *,.pjb[data-paused] *::before,.pjb[data-paused] *::after{animation-play-state:paused!important}
.pjb[data-reduced] *,.pjb[data-reduced] *::before,.pjb[data-reduced] *::after{animation:none!important}
@media (prefers-reduced-motion:reduce){.pjb *,.pjb *::before,.pjb *::after{animation:none!important}}
.pjb-beam,.pjb-halo{inset:0;animation:pjb-flicker 2.6s steps(1) infinite}
.pjb-beam{filter:blur(6px)}
.pjb-halo{filter:blur(28px);opacity:.7;animation-delay:-1.1s}
.pjb-beam::before,.pjb-halo::before{content:"";position:absolute;inset:0;background:radial-gradient(140% 140% at 93% 6%,rgba(var(--pjb-beam),var(--pjb-strength)) 0,rgba(var(--pjb-beam),calc(var(--pjb-strength) * .4)) 40%,rgba(var(--pjb-beam),0) 92%)}
.pjb-beam::before{clip-path:polygon(92% 4%,94.5% 8%,46% 100%,0 100%,0 86%)}
.pjb-halo::before{clip-path:polygon(91% 2%,96% 10%,58% 100%,0 100%,0 70%)}
.pjb-cone{inset:0;overflow:hidden;clip-path:polygon(92% 4%,94.5% 8%,46% 100%,0 100%,0 86%);-webkit-mask-image:radial-gradient(130% 130% at 93% 6%,#000 0,rgba(0,0,0,.35) 75%);mask-image:radial-gradient(130% 130% at 93% 6%,#000 0,rgba(0,0,0,.35) 75%)}
.pjb-dust{inset:-300px;background-repeat:repeat}
.pjb-d1{background-image:radial-gradient(1.8px 1.8px at 20px 30px,rgba(255,242,220,.95),rgba(255,242,220,0)),radial-gradient(1px 1px at 120px 80px,rgba(255,242,220,.8),rgba(255,242,220,0)),radial-gradient(2.2px 2.2px at 170px 190px,rgba(255,242,220,.9),rgba(255,242,220,0)),radial-gradient(1px 1px at 60px 150px,rgba(255,242,220,.7),rgba(255,242,220,0)),radial-gradient(1.2px 1.2px at 200px 20px,rgba(255,242,220,.85),rgba(255,242,220,0));background-size:220px 240px;animation:pjb-d1 var(--pjb-drift) linear infinite}
.pjb-d2{filter:blur(1px);background-image:radial-gradient(2.4px 2.4px at 40px 60px,rgba(255,236,205,.7),rgba(255,236,205,0)),radial-gradient(2px 2px at 250px 210px,rgba(255,236,205,.6),rgba(255,236,205,0)),radial-gradient(3px 3px at 150px 280px,rgba(255,236,205,.5),rgba(255,236,205,0));background-size:330px 320px;opacity:.9;animation:pjb-d2 calc(var(--pjb-drift) * 1.5) linear infinite;animation-delay:calc(var(--pjb-drift) * -.5)}
.pjb-port{right:5.5%;top:4.5%;width:26px;height:16px;border-radius:50%;background:radial-gradient(closest-side,#fffaf0,rgba(255,226,170,.7) 50%,rgba(255,226,170,0));box-shadow:0 0 44px 20px rgba(255,220,160,.22)}
.pjb-grain{inset:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");opacity:.05;mix-blend-mode:screen}
.pjb-eyebrow{color:#e6b878}
.pjb-copy{color:#d8cdbd}
.pjb-btn{background:#f3eadc;color:#13100e}
@keyframes pjb-flicker{0%{opacity:1}17%{opacity:.92}23%{opacity:1}51%{opacity:.95}58%{opacity:.88}61%{opacity:1}84%{opacity:.96}}
@keyframes pjb-d1{from{transform:translate(0,0)}to{transform:translate(-220px,240px)}}
@keyframes pjb-d2{from{transform:translate(0,0)}to{transform:translate(330px,-320px)}}
`;

export default function ProjectorBeamWithDriftingDust() {
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
    <section ref={ref} className="pjb" data-reduced={reduce ? "" : undefined}>
      <style>{css}</style>
      <div className="pjb-fx" aria-hidden="true"><div className="pjb-halo" /><div className="pjb-beam" /><div className="pjb-cone"><div className="pjb-dust pjb-d1" /><div className="pjb-dust pjb-d2" /></div><div className="pjb-port" /><div className="pjb-grain" /></div>
      <div className="pjb-hero"><p className="pjb-eyebrow">The Rialto Picture House</p><h1 className="pjb-title">One screen, ninety seats and a real reel of film</h1><p className="pjb-copy">Classic and new releases shown from a projector that has run since the cinema reopened. Tea, cake and the occasional intermission.</p><a className="pjb-btn" href="#">See what is showing</a></div>
    </section>
  );
}
