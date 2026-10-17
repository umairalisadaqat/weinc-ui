import { useEffect, useRef } from "react";

// A rotating conic beam sweeps out from a headland lamp through slow layers of sea fog.
// Pure CSS: the decorative layer is aria-hidden and animates transform and opacity.
// The effect pauses while the section is off screen and stays still for reduced motion.

const css = `
.lhb-root{
  /* Change these: */
  --lhb-beam: 255,236,196;   /* beam colour as r,g,b */
  --lhb-turn: 16s;           /* one full turn of the lamp */
  --lhb-fog: 22s;            /* drift time of the fog banks */
  --lhb-x: 84%;              /* lamp position across */
  --lhb-y: 46%;              /* lamp position down */
}
.lhb-root{position:relative;display:flex;align-items:center;min-height:640px;isolation:isolate;overflow:hidden;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  background:linear-gradient(180deg,#0c141d 0%,#16222e 45%,#1d2a36 62%,#0e161e 74%,#0a1016 100%)}
.lhb-art{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.lhb-sky{position:absolute;inset:0;background:radial-gradient(50% 45% at var(--lhb-x) var(--lhb-y),rgba(120,150,170,.22),transparent 70%)}
.lhb-beams{position:absolute;left:var(--lhb-x);top:var(--lhb-y);width:3000px;height:3000px;margin:-1500px 0 0 -1500px;border-radius:50%;will-change:transform;
  background:conic-gradient(from 0deg,
    rgba(var(--lhb-beam),0) 0deg,rgba(var(--lhb-beam),.05) 3deg,rgba(var(--lhb-beam),.30) 9deg,rgba(var(--lhb-beam),.42) 12deg,rgba(var(--lhb-beam),.30) 15deg,rgba(var(--lhb-beam),.05) 21deg,rgba(var(--lhb-beam),0) 25deg,
    rgba(var(--lhb-beam),0) 180deg,rgba(var(--lhb-beam),.04) 183deg,rgba(var(--lhb-beam),.24) 189deg,rgba(var(--lhb-beam),.34) 192deg,rgba(var(--lhb-beam),.24) 195deg,rgba(var(--lhb-beam),.04) 201deg,rgba(var(--lhb-beam),0) 205deg);
  -webkit-mask-image:radial-gradient(circle,#000 0,rgba(0,0,0,.85) 8%,rgba(0,0,0,.35) 26%,transparent 46%);mask-image:radial-gradient(circle,#000 0,rgba(0,0,0,.85) 8%,rgba(0,0,0,.35) 26%,transparent 46%);
  transform:rotate(200deg);animation:lhb-turn var(--lhb-turn) linear infinite}
.lhb-fog{position:absolute;left:-30%;width:160%;border-radius:50%;will-change:transform}
.lhb-fog-a{top:28%;height:46%;background:radial-gradient(closest-side,rgba(170,190,205,.20),transparent);animation:lhb-drift var(--lhb-fog) ease-in-out infinite alternate}
.lhb-fog-b{top:50%;height:36%;background:radial-gradient(closest-side,rgba(150,172,190,.18),transparent);animation:lhb-drift var(--lhb-fog) ease-in-out -9s infinite alternate-reverse}
.lhb-fog-c{top:8%;height:40%;left:-10%;width:90%;background:radial-gradient(closest-side,rgba(140,160,180,.12),transparent);animation:lhb-drift calc(var(--lhb-fog) * 1.4) ease-in-out -4s infinite alternate}
.lhb-sea{position:absolute;left:0;right:0;top:74%;bottom:0;background:linear-gradient(180deg,#121c25 0%,#0a1117 100%)}
.lhb-glint{position:absolute;left:50%;right:-10%;top:74%;height:10%;background:radial-gradient(40% 70% at 70% 0%,rgba(var(--lhb-beam),.16),transparent 70%);animation:lhb-glint calc(var(--lhb-turn) / 2) ease-in-out infinite}
.lhb-land{position:absolute;left:calc(var(--lhb-x) - 30%);width:60%;top:calc(var(--lhb-y) + 7%);height:60%;left:calc(var(--lhb-x) - 45%);width:80%;border-radius:60% 40% 0 0/22% 18% 0 0;background:#070c11;-webkit-mask-image:linear-gradient(90deg,transparent,#000 35%);mask-image:linear-gradient(90deg,transparent,#000 35%)}
.lhb-tower{position:absolute;left:var(--lhb-x);top:var(--lhb-y);width:14px;height:12%;margin-left:-7px;background:linear-gradient(90deg,#0b1218,#16212b 60%,#0b1218);clip-path:polygon(20% 0,80% 0,100% 100%,0 100%)}
.lhb-lamp{position:absolute;left:var(--lhb-x);top:var(--lhb-y);width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(255,250,235,1) 0,rgba(var(--lhb-beam),.85) 8%,rgba(var(--lhb-beam),.25) 30%,transparent 100%);animation:lhb-flare calc(var(--lhb-turn) / 2) ease-in-out infinite}
.lhb-veil{position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,14,20,.55) 0%,rgba(9,14,20,.25) 45%,transparent 70%)}
@keyframes lhb-turn{from{transform:rotate(200deg)}to{transform:rotate(560deg)}}
@keyframes lhb-drift{from{transform:translateX(-8%)}to{transform:translateX(8%)}}
@keyframes lhb-flare{0%,100%{opacity:.75;transform:scale(.9)}50%{opacity:1;transform:scale(1.1)}}
@keyframes lhb-glint{0%,100%{opacity:.3}50%{opacity:1}}
@media (max-width:640px){.lhb-root{--lhb-x:80%;--lhb-y:22%}}
.lhb-hero{position:relative;z-index:1;box-sizing:border-box;width:100%;max-width:1120px;margin:0 auto;padding:112px 20px;text-align:left}
.lhb-hero > *{max-width:560px}
.lhb-eyebrow{margin:0 0 18px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#f3d9a4}
.lhb-title{margin:0;font-size:clamp(2.1rem,5.4vw,3.6rem);line-height:1.06;letter-spacing:-.025em;font-weight:650;color:#f6f2ea;text-wrap:balance}
.lhb-copy{margin:20px 0 0;max-width:34em;font-size:clamp(1rem,1.6vw,1.125rem);line-height:1.6;color:#d3dbe2}
.lhb-btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;margin-top:32px;padding:0 24px;border-radius:6px;background:#f1d9a8;color:#14202b;font-size:15px;font-weight:600;text-decoration:none;box-shadow:none;transition:transform .2s ease,background-color .2s ease}
.lhb-btn:hover{transform:translateY(-1px);background:#f7e4bd}
.lhb-btn:focus-visible{outline:2px solid #f8e7c5;outline-offset:3px}
@media (max-width:640px){.lhb-hero{padding:88px 20px}}
.lhb-root[data-paused] *,.lhb-root[data-paused] *::before,.lhb-root[data-paused] *::after{animation-play-state:paused!important}
@media (prefers-reduced-motion: reduce){
.lhb-beams{transform:rotate(206deg)}
.lhb-root *,.lhb-root *::before,.lhb-root *::after{animation:none!important;transition:none!important}
}
`;

export default function LighthouseBeamSeaFog() {
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
    <section ref={root} className="lhb-root relative w-full overflow-hidden">
      <style>{css}</style>
      <div className="lhb-art" aria-hidden="true">
        <div className="lhb-sky"></div>
        <div className="lhb-fog lhb-fog-c"></div>
        <div className="lhb-beams"></div>
        <div className="lhb-fog lhb-fog-a"></div>
        <div className="lhb-sea"></div>
        <div className="lhb-glint"></div>
        <div className="lhb-land"></div>
        <div className="lhb-tower"></div>
        <div className="lhb-lamp"></div>
        <div className="lhb-fog lhb-fog-b"></div>
        <div className="lhb-veil"></div>
      </div>
      <div className="lhb-hero">
      <p className="lhb-eyebrow">Harbour pilots, est. 1974</p>
      <h1 className="lhb-title">Bringing you in, whatever the weather.</h1>
      <p className="lhb-copy">Licensed pilots guide cargo and charter boats through the narrows day and night, with radio cover every hour of the tide.</p>
      <a className="lhb-btn" href="#">Request a pilot</a>
      </div>
    </section>
  );
}
