import { useEffect, useRef } from "react";

// A field of isometric cubes where rings of light roll outward across the top faces only.
// Pure CSS: the decorative layer is aria-hidden and animates transform and opacity.
// The effect pauses while the section is off screen and stays still for reduced motion.

const css = `
.icr-root{
  /* Change these: */
  --icr-light: 176,240,222;   /* ripple light as r,g,b */
  --icr-pulse: 7s;            /* time for one ring to cross the field */
  --icr-x: 26%;               /* where the ripple starts, across */
  --icr-y: 70%;               /* where the ripple starts, down */
}
.icr-root{position:relative;display:flex;align-items:center;min-height:640px;isolation:isolate;overflow:hidden;background:#0c2724;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.icr-art{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.icr-cubes{position:absolute;inset:0;background-image:url(data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2756%27%20height%3D%2796.994%27%20viewBox%3D%270%200%2056%2096.994%27%20shape-rendering%3D%27geometricPrecision%27%3E%3Cpolygon%20points%3D%2728%2C0%2056%2C16.17%2028%2C32.33%200%2C16.17%27%20fill%3D%27%231f4f48%27%2F%3E%3Cpolygon%20points%3D%270%2C16.17%2028%2C32.33%2028%2C64.66%200%2C48.5%27%20fill%3D%27%23143a35%27%2F%3E%3Cpolygon%20points%3D%2728%2C32.33%2056%2C16.17%2056%2C48.5%2028%2C64.66%27%20fill%3D%27%230c2825%27%2F%3E%3Cpolygon%20points%3D%270%2C48.5%2028%2C64.66%200%2C80.83%20-28%2C64.66%27%20fill%3D%27%231f4f48%27%2F%3E%3Cpolygon%20points%3D%27-28%2C64.66%200%2C80.83%200%2C113.16%20-28%2C96.99%27%20fill%3D%27%23143a35%27%2F%3E%3Cpolygon%20points%3D%270%2C80.83%2028%2C64.66%2028%2C96.99%200%2C113.16%27%20fill%3D%27%230c2825%27%2F%3E%3Cpolygon%20points%3D%2756%2C48.5%2084%2C64.66%2056%2C80.83%2028%2C64.66%27%20fill%3D%27%231f4f48%27%2F%3E%3Cpolygon%20points%3D%2728%2C64.66%2056%2C80.83%2056%2C113.16%2028%2C96.99%27%20fill%3D%27%23143a35%27%2F%3E%3Cpolygon%20points%3D%2756%2C80.83%2084%2C64.66%2084%2C96.99%2056%2C113.16%27%20fill%3D%27%230c2825%27%2F%3E%3Cpolygon%20points%3D%270%2C-48.5%2028%2C-32.33%200%2C-16.17%20-28%2C-32.33%27%20fill%3D%27%231f4f48%27%2F%3E%3Cpolygon%20points%3D%27-28%2C-32.33%200%2C-16.17%200%2C16.17%20-28%2C0%27%20fill%3D%27%23143a35%27%2F%3E%3Cpolygon%20points%3D%270%2C-16.17%2028%2C-32.33%2028%2C0%200%2C16.17%27%20fill%3D%27%230c2825%27%2F%3E%3Cpolygon%20points%3D%2756%2C-48.5%2084%2C-32.33%2056%2C-16.17%2028%2C-32.33%27%20fill%3D%27%231f4f48%27%2F%3E%3Cpolygon%20points%3D%2728%2C-32.33%2056%2C-16.17%2056%2C16.17%2028%2C0%27%20fill%3D%27%23143a35%27%2F%3E%3Cpolygon%20points%3D%2756%2C-16.17%2084%2C-32.33%2084%2C0%2056%2C16.17%27%20fill%3D%27%230c2825%27%2F%3E%3Cpolygon%20points%3D%2728%2C96.99%2056%2C113.16%2028%2C129.33%200%2C113.16%27%20fill%3D%27%231f4f48%27%2F%3E%3Cpolygon%20points%3D%270%2C113.16%2028%2C129.33%2028%2C161.66%200%2C145.49%27%20fill%3D%27%23143a35%27%2F%3E%3Cpolygon%20points%3D%2728%2C129.33%2056%2C113.16%2056%2C145.49%2028%2C161.66%27%20fill%3D%27%230c2825%27%2F%3E%3Cpolygon%20points%3D%2728%2C0%2056%2C16.17%2028%2C32.33%200%2C16.17%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%270%2C16.17%2028%2C32.33%2028%2C64.66%200%2C48.5%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%2728%2C32.33%2056%2C16.17%2056%2C48.5%2028%2C64.66%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%270%2C48.5%2028%2C64.66%200%2C80.83%20-28%2C64.66%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%27-28%2C64.66%200%2C80.83%200%2C113.16%20-28%2C96.99%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%270%2C80.83%2028%2C64.66%2028%2C96.99%200%2C113.16%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%2756%2C48.5%2084%2C64.66%2056%2C80.83%2028%2C64.66%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%2728%2C64.66%2056%2C80.83%2056%2C113.16%2028%2C96.99%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%2756%2C80.83%2084%2C64.66%2084%2C96.99%2056%2C113.16%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%270%2C-48.5%2028%2C-32.33%200%2C-16.17%20-28%2C-32.33%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%27-28%2C-32.33%200%2C-16.17%200%2C16.17%20-28%2C0%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%270%2C-16.17%2028%2C-32.33%2028%2C0%200%2C16.17%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%2756%2C-48.5%2084%2C-32.33%2056%2C-16.17%2028%2C-32.33%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%2728%2C-32.33%2056%2C-16.17%2056%2C16.17%2028%2C0%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%2756%2C-16.17%2084%2C-32.33%2084%2C0%2056%2C16.17%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%2728%2C96.99%2056%2C113.16%2028%2C129.33%200%2C113.16%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%270%2C113.16%2028%2C129.33%2028%2C161.66%200%2C145.49%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3Cpolygon%20points%3D%2728%2C129.33%2056%2C113.16%2056%2C145.49%2028%2C161.66%27%20fill%3D%27none%27%20stroke%3D%27rgba(150%2C210%2C195%2C0.10)%27%20stroke-width%3D%27.6%27%2F%3E%3C%2Fsvg%3E);background-size:56px 96.994px}
.icr-lit{position:absolute;inset:0;-webkit-mask-image:url(data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2756%27%20height%3D%2796.994%27%20viewBox%3D%270%200%2056%2096.994%27%20shape-rendering%3D%27geometricPrecision%27%3E%3Cpolygon%20points%3D%2728%2C0%2056%2C16.17%2028%2C32.33%200%2C16.17%27%20fill%3D%27%23fff%27%2F%3E%3Cpolygon%20points%3D%270%2C48.5%2028%2C64.66%200%2C80.83%20-28%2C64.66%27%20fill%3D%27%23fff%27%2F%3E%3Cpolygon%20points%3D%2756%2C48.5%2084%2C64.66%2056%2C80.83%2028%2C64.66%27%20fill%3D%27%23fff%27%2F%3E%3Cpolygon%20points%3D%270%2C-48.5%2028%2C-32.33%200%2C-16.17%20-28%2C-32.33%27%20fill%3D%27%23fff%27%2F%3E%3Cpolygon%20points%3D%2756%2C-48.5%2084%2C-32.33%2056%2C-16.17%2028%2C-32.33%27%20fill%3D%27%23fff%27%2F%3E%3Cpolygon%20points%3D%2728%2C96.99%2056%2C113.16%2028%2C129.33%200%2C113.16%27%20fill%3D%27%23fff%27%2F%3E%3C%2Fsvg%3E);mask-image:url(data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2756%27%20height%3D%2796.994%27%20viewBox%3D%270%200%2056%2096.994%27%20shape-rendering%3D%27geometricPrecision%27%3E%3Cpolygon%20points%3D%2728%2C0%2056%2C16.17%2028%2C32.33%200%2C16.17%27%20fill%3D%27%23fff%27%2F%3E%3Cpolygon%20points%3D%270%2C48.5%2028%2C64.66%200%2C80.83%20-28%2C64.66%27%20fill%3D%27%23fff%27%2F%3E%3Cpolygon%20points%3D%2756%2C48.5%2084%2C64.66%2056%2C80.83%2028%2C64.66%27%20fill%3D%27%23fff%27%2F%3E%3Cpolygon%20points%3D%270%2C-48.5%2028%2C-32.33%200%2C-16.17%20-28%2C-32.33%27%20fill%3D%27%23fff%27%2F%3E%3Cpolygon%20points%3D%2756%2C-48.5%2084%2C-32.33%2056%2C-16.17%2028%2C-32.33%27%20fill%3D%27%23fff%27%2F%3E%3Cpolygon%20points%3D%2728%2C96.99%2056%2C113.16%2028%2C129.33%200%2C113.16%27%20fill%3D%27%23fff%27%2F%3E%3C%2Fsvg%3E);-webkit-mask-size:56px 96.994px;mask-size:56px 96.994px}
.icr-ring{position:absolute;left:var(--icr-x);top:var(--icr-y);width:1800px;height:1800px;margin:-900px 0 0 -900px;border-radius:50%;opacity:0;will-change:transform,opacity;
  background:radial-gradient(closest-side,transparent 72%,rgba(var(--icr-light),.0) 78%,rgba(var(--icr-light),.55) 88%,rgba(var(--icr-light),.9) 92%,rgba(var(--icr-light),0) 97%);
  animation:icr-ring var(--icr-pulse) cubic-bezier(.25,.6,.4,1) infinite}
.icr-ring:nth-child(2){animation-delay:calc(var(--icr-pulse) / -3)}
.icr-ring:nth-child(3){animation-delay:calc(var(--icr-pulse) * -2 / 3)}
.icr-pool{position:absolute;left:var(--icr-x);top:var(--icr-y);width:700px;height:700px;margin:-350px 0 0 -350px;border-radius:50%;background:radial-gradient(closest-side,rgba(var(--icr-light),.35),transparent);animation:icr-pool calc(var(--icr-pulse) / 3) ease-in-out infinite}
.icr-scrim{position:absolute;inset:0;background:radial-gradient(60% 55% at 50% 48%,rgba(6,22,20,.86),rgba(6,22,20,.55) 60%,rgba(6,22,20,.2) 100%)}
@keyframes icr-ring{0%{transform:scale(.04);opacity:0}8%{opacity:1}70%{opacity:.55}100%{transform:scale(1);opacity:0}}
@keyframes icr-pool{0%,100%{opacity:.55;transform:scale(.9)}50%{opacity:1;transform:scale(1.05)}}
.icr-hero{position:relative;z-index:1;box-sizing:border-box;width:100%;max-width:720px;margin:0 auto;padding:112px 20px;text-align:center}
.icr-hero > *{max-width:none}
.icr-eyebrow{margin:0 0 18px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#a8e6d4}
.icr-title{margin:0;font-size:clamp(2.1rem,5.4vw,3.6rem);line-height:1.06;letter-spacing:-.025em;font-weight:650;color:#f2fbf8;text-wrap:balance}
.icr-copy{margin:20px auto 0;max-width:34em;font-size:clamp(1rem,1.6vw,1.125rem);line-height:1.6;color:#cfe4de}
.icr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;margin-top:32px;padding:0 24px;border-radius:10px;background:#b4ecdc;color:#0b2522;font-size:15px;font-weight:600;text-decoration:none;box-shadow:none;transition:transform .2s ease,background-color .2s ease}
.icr-btn:hover{transform:translateY(-1px);background:#c9f3e6}
.icr-btn:focus-visible{outline:2px solid #d6f6ec;outline-offset:3px}
@media (max-width:640px){.icr-hero{padding:88px 20px}}
.icr-root[data-paused] *,.icr-root[data-paused] *::before,.icr-root[data-paused] *::after{animation-play-state:paused!important}
@media (prefers-reduced-motion: reduce){
.icr-ring{opacity:.6;transform:scale(.42)}.icr-ring:nth-child(2){opacity:.3;transform:scale(.75)}.icr-ring:nth-child(3){opacity:0}
.icr-root *,.icr-root *::before,.icr-root *::after{animation:none!important;transition:none!important}
}
`;

export default function IsometricCubeRipple() {
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
    <section ref={root} className="icr-root relative w-full overflow-hidden">
      <style>{css}</style>
      <div className="icr-art" aria-hidden="true">
        <div className="icr-cubes"></div>
        <div className="icr-lit"><div className="icr-ring"></div><div className="icr-ring"></div><div className="icr-ring"></div><div className="icr-pool"></div></div>
        <div className="icr-scrim"></div>
      </div>
      <div className="icr-hero">
      <p className="icr-eyebrow">Modular shelving studio</p>
      <h1 className="icr-title">Storage that clicks together like tiles.</h1>
      <p className="icr-copy">Birch ply cubes in three depths, joined without tools and rearranged whenever the room changes.</p>
      <a className="icr-btn" href="#">Plan your wall</a>
      </div>
    </section>
  );
}
