import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type TransitionEvent } from "react";

// Room photos as separated cards that slide with translateX. The caption waits until
// the slide has finished (transitionend, with a timer as a backstop) and then fades in,
// so text never rides along with a moving card.
const ROOMS = [
  { name: "Garden room", line: "Morning sun, a deep sofa and the ferns we cannot stop buying.", spec: "Lime plaster · Linen · South light", img: "https://images.pexels.com/photos/3334699/pexels-photo-3334699.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A sunlit corner with a pale sofa, potted plants and window shadows on the wall" },
  { name: "Kitchen", line: "Oak fronts, a proper kettle and room for two people to cook.", spec: "Oiled oak · Terrazzo · Brass", img: "https://images.pexels.com/photos/7303782/pexels-photo-7303782.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A small kitchen with wooden cabinets, a pale chair and a vase of dried leaves" },
  { name: "Main bedroom", line: "Heavy curtains, a firm mattress and nothing that hums at night.", spec: "Washed cotton · Wool · Blackout", img: "https://images.pexels.com/photos/4153150/pexels-photo-4153150.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "An unmade bed with white sheets beneath a tall window" },
  { name: "Bathroom", line: "A deep tub under a soft ceiling light, with towels warmed on the rail.", spec: "Microcement · Black enamel · Teak", img: "https://images.pexels.com/photos/10919439/pexels-photo-10919439.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A black freestanding bathtub in a stone-coloured room lit from above" },
  { name: "Reading nook", line: "A chair, a lamp and three shelves of novels left by past guests.", spec: "Walnut · Wool rug · Paper lamp", img: "https://images.pexels.com/photos/34438566/pexels-photo-34438566.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A tall plant beside bookshelves in warm afternoon light" },
];
const SETTLE_BACKSTOP = 900; // ms; caption appears by then even if no transitionend fires
const HOVER_DELAY = 80; // ms before a hovered card opens

const CSS = `
.w5rom-stage{--c:70px;--g:10px;--n:5;--ow:calc(100% - (var(--n) - 1) * var(--c));position:relative;height:540px;overflow:hidden;background:#faf7f2}
.w5rom-panel{position:absolute;inset:0;z-index:var(--i);background:#faf7f2;transform:translateX(calc(var(--i) * var(--c)));transition:transform .8s cubic-bezier(.3,1,.3,1)}
.w5rom-panel.is-after{transform:translateX(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5rom-media{position:absolute;top:0;bottom:0;left:var(--g);width:calc(var(--ow) - var(--g));overflow:hidden;border-radius:14px;background:#e6ddd0}
.w5rom-panel:first-child .w5rom-media{left:0}
.w5rom-media img{display:block;width:100%;height:100%;object-fit:cover;transform:translateX(calc(var(--c) / 2 - 50%)) scale(1.06);transition:transform 1s cubic-bezier(.3,1,.3,1)}
.is-open .w5rom-media img{transform:none}
.w5rom-veil{position:absolute;inset:0;background:rgba(46,42,37,.28);transition:opacity .5s}
.is-open .w5rom-veil{opacity:0}
.w5rom-tab{position:absolute;top:0;bottom:0;left:var(--g);width:calc(var(--c) - var(--g));display:flex;align-items:flex-end;justify-content:center;padding-bottom:22px;box-sizing:border-box;color:#fff;pointer-events:none;transition:opacity .3s}
.w5rom-panel:first-child .w5rom-tab{left:0;width:var(--c)}
.is-open .w5rom-tab{opacity:0}
.w5rom-name{writing-mode:vertical-rl;transform:rotate(180deg);font-size:14px;font-weight:600;letter-spacing:.06em;white-space:nowrap;text-shadow:0 1px 10px rgba(0,0,0,.45)}
.w5rom-cap{position:absolute;left:calc(var(--g) + 20px);top:20px;max-width:min(360px,calc(var(--ow) - var(--g) - 40px));box-sizing:border-box;padding:18px 20px;border-radius:10px;background:rgba(250,247,242,.94);color:#2e2a25;pointer-events:none;box-shadow:0 12px 30px rgba(46,42,37,.18);opacity:0;transform:translateY(-10px);transition:opacity .2s,transform .2s}
.w5rom-panel:first-child .w5rom-cap{left:20px}
.w5rom-cap>*{opacity:0;transform:translateY(6px);transition:opacity .2s,transform .2s}
.is-settled .w5rom-cap,.is-settled .w5rom-cap>*{opacity:1;transform:none;transition:opacity .45s,transform .55s cubic-bezier(.22,1,.36,1)}
.is-settled .w5rom-cap>:nth-child(2){transition-delay:.08s}
.is-settled .w5rom-cap>:nth-child(3){transition-delay:.16s}
.w5rom-hit{position:absolute;top:0;bottom:0;left:0;width:var(--c);padding:0;border:0;background:transparent;cursor:pointer}
.is-open .w5rom-hit{width:var(--ow);cursor:default}
.w5rom-hit:focus-visible{outline:3px solid #8a6a3f;outline-offset:-4px;border-radius:16px}
@media (max-width:640px){
.w5rom-stage{--c:58px;height:620px}
.w5rom-panel{transform:translateY(calc(var(--i) * var(--c)))}
.w5rom-panel.is-after{transform:translateY(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5rom-media{left:0;right:0;top:var(--g);bottom:auto;width:auto;height:calc(var(--ow) - var(--g))}
.w5rom-panel:first-child .w5rom-media{top:0}
.w5rom-media img{transform:translateY(calc(var(--c) / 2 - 50%)) scale(1.06)}
.w5rom-tab,.w5rom-panel:first-child .w5rom-tab{left:0;right:0;top:var(--g);bottom:auto;width:auto;height:calc(var(--c) - var(--g));align-items:center;justify-content:flex-start;padding:0 18px}
.w5rom-panel:first-child .w5rom-tab{top:0;height:var(--c)}
.w5rom-name{writing-mode:horizontal-tb;transform:none}
.w5rom-cap,.w5rom-panel:first-child .w5rom-cap{left:12px;right:12px;top:calc(var(--g) + 12px);max-width:none}
.w5rom-hit{right:0;bottom:auto;width:auto;height:var(--c)}
.is-open .w5rom-hit{width:auto;height:var(--ow)}
}
@media (prefers-reduced-motion:reduce){.w5rom-panel,.w5rom-media img,.w5rom-veil,.w5rom-tab,.w5rom-cap,.w5rom-cap>*,.is-settled .w5rom-cap,.is-settled .w5rom-cap>*{transition:none}}
`;

export default function InteriorRoomGalleryWithCaptionsAfterSettle() {
  const [open, setOpen] = useState(0);
  const [settled, setSettled] = useState(true);
  const timer = useRef(0);
  const backstop = useRef(0);
  useEffect(() => () => { window.clearTimeout(timer.current); window.clearTimeout(backstop.current); }, []);

  const choose = (i: number) => {
    if (i === open) return;
    setOpen(i);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSettled(reduce);
    window.clearTimeout(backstop.current);
    if (!reduce) backstop.current = window.setTimeout(() => setSettled(true), SETTLE_BACKSTOP);
  };
  const onEnter = (i: number) => (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => choose(i), HOVER_DELAY);
  };
  const onSlideEnd = (e: TransitionEvent) => {
    if (e.propertyName !== "transform" || !(e.target as HTMLElement).classList.contains("w5rom-panel")) return;
    window.clearTimeout(backstop.current);
    setSettled(true);
  };

  return (
    <section className="bg-[#faf7f2] px-4 py-14 sm:px-8 sm:py-16">
      <style>{CSS}</style>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-4 md:grid-cols-2 md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7a5c34]">Linden House · Stays</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#2e2a25] sm:text-4xl">Walk through the house</h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-[#5b5248] md:justify-self-end">A restored 1890s townhouse for up to four guests. Open a room to see what it is made of.</p>
        </div>
        <div className="w5rom-stage" onTransitionEnd={onSlideEnd}>
          {ROOMS.map((r, i) => (
            <div key={r.name} className={`w5rom-panel${i === open ? " is-open" : ""}${i > open ? " is-after" : ""}${i === open && settled ? " is-settled" : ""}`} style={{ "--i": i } as CSSProperties}>
              <div className="w5rom-media">
                <img src={r.img} alt={r.alt} loading={i === 0 ? "eager" : "lazy"} />
                <div className="w5rom-veil" />
              </div>
              <div className="w5rom-tab" aria-hidden="true"><span className="w5rom-name">{r.name}</span></div>
              <button type="button" className="w5rom-hit" aria-expanded={i === open} aria-controls={`w5rom-cap-${i}`} onPointerEnter={onEnter(i)} onPointerLeave={() => window.clearTimeout(timer.current)} onFocus={() => choose(i)} onClick={() => choose(i)}>
                <span className="sr-only">{r.name}</span>
              </button>
              <div className="w5rom-cap" id={`w5rom-cap-${i}`}>
                <h3 className="text-lg font-semibold">{r.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#4d453c]">{r.line}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#7a5c34]">{r.spec}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
