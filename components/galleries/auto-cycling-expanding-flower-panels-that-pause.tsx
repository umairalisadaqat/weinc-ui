import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

// Panels open one after another on their own. A thin bar fills while each one waits;
// when it finishes, the next panel slides open. Any hover, focus or tap stops the cycle
// for good, and the cycle also pauses whenever the block is off screen.
const BUNCHES = [
  { name: "The Garden Party", stems: "Gerberas, pale roses, asters", price: "$64", img: "https://images.pexels.com/photos/38551722/pexels-photo-38551722.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A hand-tied bunch of red gerberas, pale roses and purple asters" },
  { name: "Tulip Bundle", stems: "Forty red and white tulips", price: "$42", img: "https://images.pexels.com/photos/20491660/pexels-photo-20491660.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Tightly packed red and white tulips seen from above" },
  { name: "Market Armful", stems: "Chrysanthemums, roses, berries", price: "$78", img: "https://images.pexels.com/photos/34658018/pexels-photo-34658018.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Orange chrysanthemums, roses, small chillies and berries in a bright mix" },
  { name: "Peony Wrap", stems: "Pink peonies in black paper", price: "$85", img: "https://images.pexels.com/photos/36399737/pexels-photo-36399737.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Pink peonies wrapped in black paper on a dark table" },
  { name: "Dried Ember", stems: "Dried grasses and everlasting flowers", price: "$56", img: "https://images.pexels.com/photos/31046064/pexels-photo-31046064.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Dried flowers in red, blue and orange standing against a dark wall" },
];
const CYCLE_MS = 3000; // how long each bunch stays open before the next one
const HOVER_DELAY = 80; // ms before a hovered strip opens

const CSS = `
.w5cyc-stage{--c:72px;--n:5;--ow:calc(100% - (var(--n) - 1) * var(--c));position:relative;height:540px;overflow:hidden;border-radius:4px;background:#0d0c0a}
.w5cyc-panel{position:absolute;inset:0;z-index:var(--i);transform:translateX(calc(var(--i) * var(--c)));transition:transform .9s cubic-bezier(.65,0,.25,1);box-shadow:-14px 0 30px rgba(0,0,0,.5)}
.w5cyc-panel.is-after{transform:translateX(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5cyc-media{position:absolute;top:0;left:0;bottom:0;width:var(--ow);overflow:hidden;background:#24211c}
.w5cyc-media img{display:block;width:100%;height:100%;object-fit:cover;transform:translateX(calc(var(--c) / 2 - 50%)) scale(1.12);transition:transform 1.2s cubic-bezier(.65,0,.25,1)}
.is-open .w5cyc-media img{transform:scale(1.02)}
.w5cyc-shade{position:absolute;inset:0;background:linear-gradient(to top,rgba(13,12,10,.9),rgba(13,12,10,.1) 50%,rgba(13,12,10,0))}
.w5cyc-dim{position:absolute;inset:0;background:rgba(13,12,10,.55);transition:opacity .6s}
.is-open .w5cyc-dim{opacity:0}
.w5cyc-tab{position:absolute;top:0;left:0;bottom:0;width:var(--c);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:24px 0;box-sizing:border-box;color:#f3ece0;pointer-events:none;transition:opacity .3s}
.is-open .w5cyc-tab{opacity:0}
.w5cyc-name{writing-mode:vertical-rl;transform:rotate(180deg);font-family:Georgia,'Times New Roman',serif;font-size:17px;white-space:nowrap}
.w5cyc-cap{position:absolute;left:0;bottom:0;width:var(--ow);box-sizing:border-box;padding:34px;color:#f3ece0;opacity:0;transform:translateY(14px);transition:opacity .3s,transform .3s;pointer-events:none}
.is-open .w5cyc-cap{opacity:1;transform:none;transition:opacity .6s .4s,transform .7s .4s cubic-bezier(.22,1,.36,1)}
.w5cyc-cap a{pointer-events:auto}
.w5cyc-track{display:block;width:160px;height:2px;margin-top:22px;background:rgba(243,236,224,.25);overflow:hidden;opacity:0;transition:opacity .3s}
.w5cyc-fill{display:block;height:100%;background:#e3b7a3;transform:scaleX(0);transform-origin:0 50%}
.is-auto .is-open .w5cyc-track{opacity:1}
.is-auto .is-open .w5cyc-fill{animation:w5cyc-fill var(--dur) linear forwards}
.w5cyc-root[data-paused] .w5cyc-fill{animation-play-state:paused}
@keyframes w5cyc-fill{to{transform:scaleX(1)}}
.w5cyc-hit{position:absolute;top:0;left:0;bottom:0;width:var(--c);padding:0;border:0;background:transparent;cursor:pointer}
.is-open .w5cyc-hit{width:var(--ow);cursor:default}
.w5cyc-hit:focus-visible{outline:3px solid #e3b7a3;outline-offset:-7px}
@media (max-width:640px){
.w5cyc-stage{--c:56px;height:600px}
.w5cyc-panel{transform:translateY(calc(var(--i) * var(--c)));box-shadow:0 -14px 30px rgba(0,0,0,.5)}
.w5cyc-panel.is-after{transform:translateY(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5cyc-media{right:0;bottom:auto;width:auto;height:var(--ow)}
.w5cyc-media img{transform:translateY(calc(var(--c) / 2 - 50%)) scale(1.12)}
.w5cyc-tab{right:0;bottom:auto;width:auto;height:var(--c);flex-direction:row;padding:0 20px}
.w5cyc-name{writing-mode:horizontal-tb;transform:none}
.w5cyc-cap{width:auto;right:0;bottom:calc((var(--n) - 1) * var(--c));padding:22px}
.w5cyc-hit{right:0;bottom:auto;width:auto;height:var(--c)}
.is-open .w5cyc-hit{width:auto;height:var(--ow)}
}
@media (prefers-reduced-motion:reduce){.w5cyc-panel,.w5cyc-media img,.w5cyc-dim,.w5cyc-tab,.w5cyc-cap,.is-open .w5cyc-cap{transition:none}.w5cyc-track{display:none}}
`;

export default function AutoCyclingExpandingFlowerPanelsThatPause() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(0);
  const [auto, setAuto] = useState(true);
  const [onScreen, setOnScreen] = useState(true);
  const root = useRef<HTMLElement>(null);
  const timer = useRef(0);
  const playing = auto && !reduce;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => { io.disconnect(); window.clearTimeout(timer.current); };
  }, []);

  const take = (i: number) => { setAuto(false); setOpen(i); };
  const onEnter = (i: number) => (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    setAuto(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(i), HOVER_DELAY);
  };
  const b = BUNCHES[open];

  return (
    <section ref={root} className="w5cyc-root bg-[#161512] px-4 py-14 sm:px-8 sm:py-16" data-paused={onScreen ? undefined : ""}>
      <style>{CSS}</style>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e3b7a3]">Ashby Flower Room</p>
            <h2 className="mt-3 font-serif text-3xl text-[#f3ece0] sm:text-4xl">This week&rsquo;s bunches</h2>
          </div>
          {!reduce && (
            <button type="button" onClick={() => setAuto((a) => !a)} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#5b544a] px-5 text-sm font-semibold text-[#f3ece0] transition hover:border-[#e3b7a3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3b7a3]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">{playing ? <path d="M3 2h3v10H3zM8 2h3v10H8z" /> : <path d="M3 1.5v11L12 7z" />}</svg>
              {playing ? "Pause slideshow" : "Play slideshow"}
            </button>
          )}
        </div>
        <div className={`w5cyc-stage${playing ? " is-auto" : ""}`} onFocusCapture={() => setAuto(false)}>
          {BUNCHES.map((f, i) => (
            <div key={f.name} className={`w5cyc-panel${i === open ? " is-open" : ""}${i > open ? " is-after" : ""}`} style={{ "--i": i, "--dur": `${CYCLE_MS}ms` } as CSSProperties}>
              <div className="w5cyc-media">
                <img src={f.img} alt={f.alt} loading={i === 0 ? "eager" : "lazy"} />
                <div className="w5cyc-shade" />
                <div className="w5cyc-dim" />
              </div>
              <div className="w5cyc-tab" aria-hidden="true">
                <span className="text-xs font-semibold tabular-nums">0{i + 1}</span>
                <span className="w5cyc-name">{f.name}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#e3b7a3]" />
              </div>
              <button type="button" className="w5cyc-hit" aria-expanded={i === open} onPointerEnter={onEnter(i)} onPointerLeave={() => window.clearTimeout(timer.current)} onFocus={() => take(i)} onClick={() => take(i)}>
                <span className="sr-only">{f.name}, {f.price}</span>
              </button>
              <div className="w5cyc-cap">
                <h3 className="font-serif text-3xl leading-tight">{f.name}</h3>
                <p className="mt-2 text-sm text-[#d9d0c2]">{f.stems} · <span className="tabular-nums">{f.price}</span></p>
                <a href="#" tabIndex={i === open ? 0 : -1} className="mt-5 inline-flex h-10 items-center rounded-full bg-[#f3ece0] px-5 text-sm font-semibold text-[#161512] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3b7a3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161512]">Order for Friday</a>
                <span className="w5cyc-track" aria-hidden="true">
                  <span key={`${open}-${playing}`} className="w5cyc-fill" onAnimationEnd={() => setOpen((o) => (o + 1) % BUNCHES.length)} />
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">{playing ? "" : `Showing ${b.name}`}</p>
      </div>
    </section>
  );
}
