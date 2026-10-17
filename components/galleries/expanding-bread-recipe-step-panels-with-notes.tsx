import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

// Recipe steps as sliding layers. A closed step is a paper strip with its number;
// the open step lifts the paper cover off a photo and a page of notes.
const STEPS = [
  { word: "Mix", title: "Mix and rest", time: "30 min", body: "Stir flour, water and a spoon of starter until no dry flour is left. Cover the bowl and leave it alone for half an hour.", tip: "Use water at about hand warmth.", img: "https://images.pexels.com/photos/35369570/pexels-photo-35369570.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Hands mixing a soft yellow dough in a metal bowl" },
  { word: "Fold", title: "Fold and shape", time: "4 hours", body: "Every 45 minutes, lift one side of the dough and fold it over. After four rounds, shape it into a tight ball on a floured board.", tip: "Wet hands stop the dough sticking.", img: "https://images.pexels.com/photos/6287300/pexels-photo-6287300.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Floured hands pressing a ball of dough on a wooden table" },
  { word: "Proof", title: "Proof and score", time: "Overnight", body: "Rest the shaped loaf in the fridge overnight. In the morning, cut one confident slash or a leaf pattern across the top.", tip: "A cold loaf is far easier to score.", img: "https://images.pexels.com/photos/38699003/pexels-photo-38699003.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Two raw scored loaves resting on parchment beside a wooden board" },
  { word: "Bake", title: "Bake it hot", time: "45 min", body: "Bake in a lidded pot at the highest heat for 20 minutes, then take the lid off and finish until the crust is deep brown.", tip: "Wait an hour before slicing.", img: "https://images.pexels.com/photos/38667647/pexels-photo-38667647.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "A baked sourdough loaf with a leaf pattern cut into its crust" },
];
const HOVER_DELAY = 80; // ms before a hovered step opens

const CSS = `
.w5brd-stage{--c:96px;--n:4;--ow:calc(100% - (var(--n) - 1) * var(--c));position:relative;height:500px;overflow:hidden;border-radius:14px;background:#e9dccb;border:1px solid #dcc9b3}
.w5brd-panel{position:absolute;inset:0;z-index:var(--i);transform:translateX(calc(var(--i) * var(--c)));transition:transform .7s cubic-bezier(.22,1,.36,1);background:#f8f1e7;border-left:1px solid #dcc9b3}
.w5brd-panel:first-child{border-left:0}
.w5brd-panel.is-after{transform:translateX(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5brd-body{position:absolute;top:0;left:0;bottom:0;width:var(--ow);display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)}
.w5brd-photo{position:relative;overflow:hidden;background:#d9c4ab}
.w5brd-photo img{display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.12);transition:transform 1s cubic-bezier(.22,1,.36,1)}
.is-open .w5brd-photo img{transform:none}
.w5brd-text{padding:36px 32px;box-sizing:border-box;color:#3a2418;opacity:0;transform:translateX(18px);transition:opacity .25s,transform .25s}
.is-open .w5brd-text{opacity:1;transform:none;transition:opacity .45s .35s,transform .6s .35s cubic-bezier(.22,1,.36,1)}
.w5brd-cover{position:absolute;inset:0;background:#f8f1e7;transition:opacity .45s .1s;pointer-events:none}
.is-open .w5brd-cover{opacity:0}
.w5brd-tab{position:absolute;top:0;left:0;bottom:0;width:var(--c);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:26px 0;box-sizing:border-box;color:#a3401c;pointer-events:none;transition:opacity .3s}
.is-open .w5brd-tab{opacity:0}
.w5brd-num{font-size:34px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
.w5brd-word{writing-mode:vertical-rl;transform:rotate(180deg);font-size:15px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#3a2418}
.w5brd-time{font-size:12px;font-weight:600;color:#6b4a36}
.w5brd-hit{position:absolute;top:0;left:0;bottom:0;width:var(--c);padding:0;border:0;background:transparent;cursor:pointer}
.is-open .w5brd-hit{width:calc(var(--ow) * 0.52);cursor:default}
.w5brd-hit:focus-visible{outline:3px solid #a3401c;outline-offset:-6px;border-radius:10px}
@media (max-width:640px){
.w5brd-stage{--c:60px;height:640px}
.w5brd-panel{transform:translateY(calc(var(--i) * var(--c)));border-left:0;border-top:1px solid #dcc9b3}
.w5brd-panel:first-child{border-top:0}
.w5brd-panel.is-after{transform:translateY(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5brd-body{right:0;bottom:auto;width:auto;height:var(--ow);grid-template-columns:none;grid-template-rows:170px minmax(0,1fr)}
.w5brd-text{padding:18px 20px;transform:translateY(12px)}
.w5brd-tab{right:0;bottom:auto;width:auto;height:var(--c);flex-direction:row;justify-content:flex-start;gap:16px;padding:0 20px}
.w5brd-num{font-size:24px}
.w5brd-word{writing-mode:horizontal-tb;transform:none}
.w5brd-time{margin-left:auto}
.w5brd-hit{right:0;bottom:auto;width:auto;height:var(--c)}
.is-open .w5brd-hit{width:auto;height:170px}
}
@media (prefers-reduced-motion:reduce){.w5brd-panel,.w5brd-photo img,.w5brd-text,.is-open .w5brd-text,.w5brd-cover,.w5brd-tab{transition:none}}
`;

export default function ExpandingBreadRecipeStepPanelsWithNotes() {
  const [open, setOpen] = useState(0);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const onEnter = (i: number) => (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(i), HOVER_DELAY);
  };
  const go = (d: number) => setOpen((o) => Math.min(STEPS.length - 1, Math.max(0, o + d)));

  return (
    <section className="bg-[#f3e9dc] px-4 py-14 sm:px-8 sm:py-16">
      <style>{CSS}</style>
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a3401c]">Crumb School · Home baking notes</p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-[#3a2418] sm:text-4xl">Your first sourdough, in four steps</h2>
        <div className="w5brd-stage mt-8">
          {STEPS.map((s, i) => (
            <div key={s.word} className={`w5brd-panel${i === open ? " is-open" : ""}${i > open ? " is-after" : ""}`} style={{ "--i": i } as CSSProperties}>
              <div className="w5brd-body">
                <div className="w5brd-photo"><img src={s.img} alt={s.alt} loading={i === 0 ? "eager" : "lazy"} /></div>
                <div className="w5brd-text" id={`w5brd-text-${i}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a3401c]">Step {i + 1} · {s.time}</p>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight">{s.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#5a3d2c]">{s.body}</p>
                  <p className="mt-4 border-l-2 border-[#a3401c] pl-3 text-sm italic text-[#6b4a36]">{s.tip}</p>
                </div>
              </div>
              <div className="w5brd-cover" />
              <div className="w5brd-tab" aria-hidden="true">
                <span className="w5brd-num">0{i + 1}</span>
                <span className="w5brd-word">{s.word}</span>
                <span className="w5brd-time">{s.time}</span>
              </div>
              <button type="button" className="w5brd-hit" aria-expanded={i === open} aria-controls={`w5brd-text-${i}`} onPointerEnter={onEnter(i)} onPointerLeave={() => window.clearTimeout(timer.current)} onFocus={() => setOpen(i)} onClick={() => setOpen(i)}>
                <span className="sr-only">Step {i + 1}: {s.title}</span>
              </button>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm font-medium tabular-nums text-[#5a3d2c]" aria-live="polite">Step {open + 1} of {STEPS.length}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => go(-1)} disabled={open === 0} className="inline-flex h-11 items-center rounded-full border border-[#c9ad90] px-5 text-sm font-semibold text-[#3a2418] transition hover:bg-[#ead9c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3401c] disabled:opacity-40">Back</button>
            <button type="button" onClick={() => go(1)} disabled={open === STEPS.length - 1} className="inline-flex h-11 items-center rounded-full bg-[#a3401c] px-5 text-sm font-semibold text-white transition hover:bg-[#8a3415] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3401c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3e9dc] disabled:opacity-40">Next step</button>
          </div>
        </div>
      </div>
    </section>
  );
}
