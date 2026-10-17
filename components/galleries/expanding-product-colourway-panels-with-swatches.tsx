import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

// Closed panels show a flat glaze swatch; the open one fades its swatch away to reveal
// the photo. Layers slide with transforms only.
const GLAZES = [
  { name: "Oat bud vase", hex: "#d8c2ad", ink: "#3b2f25", note: "A warm, satin cream that looks like unbleached linen in daylight.", img: "https://images.pexels.com/photos/7663201/pexels-photo-7663201.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Small cream bud vase standing on a blush-coloured backdrop" },
  { name: "Celadon speckled vase", hex: "#7c9a88", ink: "#142019", note: "Sage green with dark iron flecks that pool where the glaze runs thick.", img: "https://images.pexels.com/photos/11889250/pexels-photo-11889250.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Speckled green glazed vase on a plain white backdrop" },
  { name: "Lake bottle vase", hex: "#3d7fb0", ink: "#ffffff", note: "A glossy mid blue, brightest on the shoulder and deeper near the foot.", img: "https://images.pexels.com/photos/8725870/pexels-photo-8725870.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Slim blue vase holding a single white flower in a bright room" },
  { name: "Coal stoneware jug", hex: "#2a2a2d", ink: "#ffffff", note: "Matte black stoneware with a faint sheen where your hand will hold it.", img: "https://images.pexels.com/photos/28055261/pexels-photo-28055261.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Black stoneware jug resting on a book on a white shelf" },
  { name: "Chalk ring vase", hex: "#e7e3da", ink: "#2d2b27", note: "Dry white, soft to the touch, and the quietest of the five on a shelf.", img: "https://images.pexels.com/photos/33105316/pexels-photo-33105316.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "White ring-shaped vase on a shelf in deep shadow" },
];
const HOVER_DELAY = 70; // ms before a hovered panel opens

const CSS = `
.w5clr-stage{--c:64px;--n:5;--ow:calc(100% - (var(--n) - 1) * var(--c));position:relative;height:540px;overflow:hidden;border-radius:16px;background:#e2e8f0}
.w5clr-panel{position:absolute;inset:0;z-index:var(--i);transform:translateX(calc(var(--i) * var(--c)));transition:transform .7s cubic-bezier(.22,1,.36,1);box-shadow:-6px 0 18px rgba(15,23,42,.14)}
.w5clr-panel.is-after{transform:translateX(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5clr-media{position:absolute;top:0;left:0;bottom:0;width:var(--ow);overflow:hidden}
.w5clr-media img{display:block;width:100%;height:100%;object-fit:cover;transform:translateX(calc(var(--c) / 2 - 50%)) scale(1.05);transition:transform .8s cubic-bezier(.22,1,.36,1)}
.is-open .w5clr-media img{transform:none}
.w5clr-swatch{position:absolute;inset:0;background:var(--hex);transition:opacity .55s .1s}
.is-open .w5clr-swatch{opacity:0;transition:opacity .6s .15s}
.w5clr-tab{position:absolute;top:0;left:0;bottom:0;width:var(--c);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:14px;padding:22px 0;box-sizing:border-box;color:var(--ink);pointer-events:none;transition:opacity .3s}
.is-open .w5clr-tab{opacity:0}
.w5clr-name{writing-mode:vertical-rl;transform:rotate(180deg);font-size:13px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;white-space:nowrap}
.w5clr-tag{position:absolute;top:18px;left:18px;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,.92);color:#0f172a;font-size:12px;font-weight:600;letter-spacing:.04em;opacity:0;transform:translateY(-6px);transition:opacity .25s,transform .25s;pointer-events:none}
.is-open .w5clr-tag{opacity:1;transform:none;transition:opacity .4s .4s,transform .5s .4s}
.w5clr-hit{position:absolute;top:0;left:0;bottom:0;width:var(--c);padding:0;border:0;background:transparent;cursor:pointer}
.is-open .w5clr-hit{width:var(--ow);cursor:default}
.w5clr-hit:focus-visible{outline:3px solid #0f172a;outline-offset:-6px;border-radius:12px;box-shadow:inset 0 0 0 6px #fff}
@media (max-width:640px){
.w5clr-stage{--c:52px;height:520px}
.w5clr-panel{transform:translateY(calc(var(--i) * var(--c)));box-shadow:0 -6px 18px rgba(15,23,42,.14)}
.w5clr-panel.is-after{transform:translateY(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5clr-media{right:0;bottom:auto;width:auto;height:var(--ow)}
.w5clr-media img{transform:translateY(calc(var(--c) / 2 - 50%)) scale(1.05)}
.w5clr-tab{right:0;bottom:auto;width:auto;height:var(--c);flex-direction:row;justify-content:flex-start;padding:0 18px}
.w5clr-name{writing-mode:horizontal-tb;transform:none}
.w5clr-hit{right:0;bottom:auto;width:auto;height:var(--c)}
.is-open .w5clr-hit{width:auto;height:var(--ow)}
}
@media (prefers-reduced-motion:reduce){.w5clr-panel,.w5clr-media img,.w5clr-swatch,.is-open .w5clr-swatch,.w5clr-tab,.w5clr-tag,.is-open .w5clr-tag{transition:none}}
`;

export default function ExpandingProductColourwayPanelsWithSwatches() {
  const [open, setOpen] = useState(0);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const onEnter = (i: number) => (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(i), HOVER_DELAY);
  };
  const g = GLAZES[open];

  return (
    <section className="bg-white px-4 py-14 sm:px-8 sm:py-16">
      <style>{CSS}</style>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12 lg:items-center">
        <div className="w5clr-stage lg:col-span-7">
          {GLAZES.map((c, i) => (
            <div key={c.name} className={`w5clr-panel${i === open ? " is-open" : ""}${i > open ? " is-after" : ""}`} style={{ "--i": i, "--hex": c.hex, "--ink": c.ink } as CSSProperties}>
              <div className="w5clr-media">
                <img src={c.img} alt={c.alt} loading={i === 0 ? "eager" : "lazy"} />
                <div className="w5clr-swatch" />
              </div>
              <span className="w5clr-tag" aria-hidden="true">{c.name}</span>
              <div className="w5clr-tab" aria-hidden="true">
                <span className="w5clr-name">{c.name}</span>
              </div>
              <button type="button" className="w5clr-hit" aria-expanded={i === open} aria-label={`${c.name}`} onPointerEnter={onEnter(i)} onPointerLeave={() => window.clearTimeout(timer.current)} onFocus={() => setOpen(i)} onClick={() => setOpen(i)} />
            </div>
          ))}
        </div>
        <div className="lg:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Kiln &amp; Field Pottery</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Five glazes from the studio</h2>
          <p className="mt-3 text-2xl font-medium tabular-nums text-slate-900">$48</p>
          <div className="mt-6 border-t border-slate-200 pt-6" aria-live="polite">
            <p className="text-sm font-semibold text-slate-900">Showing: {g.name}</p>
            <p className="mt-1 max-w-sm text-base leading-relaxed text-slate-600">{g.note}</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3" role="group" aria-label="Choose a glaze">
            {GLAZES.map((c, i) => (
              <button key={c.name} type="button" aria-pressed={i === open} aria-label={c.name} onClick={() => setOpen(i)} className={`h-11 w-11 rounded-full border border-slate-300 ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${i === open ? "ring-2 ring-slate-900" : ""}`} style={{ background: c.hex }} />
            ))}
          </div>
          <button type="button" className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 sm:w-auto">Add {g.name} to bag</button>
          <p className="mt-4 text-sm text-slate-600">Each piece is thrown and glazed by hand, so no two are quite alike.</p>
        </div>
      </div>
    </section>
  );
}
