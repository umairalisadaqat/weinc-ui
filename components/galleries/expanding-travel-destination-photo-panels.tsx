import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

// Each panel is a full-size layer. Opening one slides the layers with translateX
// (translateY on phones); nothing animates width, so photos never stretch.
const TRIPS = [
  { place: "Atlantic coast", title: "Cliff villages on foot", line: "Harbour to harbour along the headlands, with your bags carried ahead each morning.", nights: "8 nights", price: "From $2,140", img: "https://images.pexels.com/photos/13313578/pexels-photo-13313578.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "White houses on a green clifftop above a rough grey sea" },
  { place: "Sahara edge", title: "Two nights in the sand sea", line: "Camel trains at first light and a camp lit only by lanterns and the stars.", nights: "6 nights", price: "From $1,860", img: "https://images.pexels.com/photos/37818878/pexels-photo-37818878.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Tall orange sand dunes with soft shadows under a pale sky" },
  { place: "High Alps", title: "Glacier lakes hut to hut", line: "Mountain huts, cold green water and one long day over a high pass.", nights: "7 nights", price: "From $2,390", img: "https://images.pexels.com/photos/28283858/pexels-photo-28283858.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A turquoise lake below a rocky slope and a snowy glacier" },
  { place: "Old quarter", title: "Lantern towns by night", line: "Slow evenings in lamp-lit lanes, with a local cook as your guide.", nights: "5 nights", price: "From $1,480", img: "https://images.pexels.com/photos/15210782/pexels-photo-15210782.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A narrow street of old houses with lanterns hanging overhead at dusk" },
  { place: "Hill country", title: "Rice terraces at harvest", line: "Stay with farming families and walk the green steps as the crop comes in.", nights: "9 nights", price: "From $2,020", img: "https://images.pexels.com/photos/28747444/pexels-photo-28747444.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Bright green rice terraces curving down a hillside with a small hut" },
];
const HOVER_DELAY = 70; // ms the pointer must rest on a strip before it opens

const CSS = `
.w5trv-stage{--c:76px;--n:5;--ow:calc(100% - (var(--n) - 1) * var(--c));position:relative;height:520px;overflow:hidden;border-radius:22px;background:#2b2118}
.w5trv-panel{position:absolute;inset:0;z-index:var(--i);transform:translateX(calc(var(--i) * var(--c)));transition:transform .75s cubic-bezier(.22,1,.36,1);box-shadow:-12px 0 28px rgba(24,14,4,.35)}
.w5trv-panel.is-after{transform:translateX(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5trv-media{position:absolute;top:0;left:0;bottom:0;width:var(--ow);overflow:hidden;background:#3a2c20}
.w5trv-media img{display:block;width:100%;height:100%;object-fit:cover;transform:translateX(calc(var(--c) / 2 - 50%)) scale(1.1);transition:transform .9s cubic-bezier(.22,1,.36,1)}
.is-open .w5trv-media img{transform:none}
.w5trv-shade{position:absolute;inset:0;background:linear-gradient(to top,rgba(26,16,6,.85),rgba(26,16,6,.15) 55%,rgba(26,16,6,0))}
.w5trv-dim{position:absolute;inset:0;background:rgba(34,22,10,.5);transition:opacity .5s}
.is-open .w5trv-dim{opacity:0}
.w5trv-tab{position:absolute;top:0;left:0;bottom:0;width:var(--c);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:24px 0;color:#f8efe2;transition:opacity .3s;pointer-events:none}
.is-open .w5trv-tab{opacity:0}
.w5trv-name{writing-mode:vertical-rl;transform:rotate(180deg);font-size:15px;font-weight:600;letter-spacing:.06em;white-space:nowrap}
.w5trv-cap{position:absolute;left:0;bottom:0;width:var(--ow);box-sizing:border-box;padding:32px;color:#fbf6ee;opacity:0;transform:translateY(16px);transition:opacity .3s,transform .3s;pointer-events:none}
.is-open .w5trv-cap{opacity:1;transform:none;transition:opacity .5s .3s,transform .6s .3s cubic-bezier(.22,1,.36,1)}
.w5trv-cap a{pointer-events:auto}
.w5trv-hit{position:absolute;top:0;left:0;bottom:0;width:var(--c);padding:0;border:0;background:transparent;cursor:pointer}
.is-open .w5trv-hit{width:var(--ow);cursor:default}
.w5trv-hit:focus-visible{outline:3px solid #f2c98c;outline-offset:-7px;border-radius:16px}
@media (max-width:640px){
.w5trv-stage{--c:60px;height:600px}
.w5trv-panel{transform:translateY(calc(var(--i) * var(--c)));box-shadow:0 -12px 28px rgba(24,14,4,.35)}
.w5trv-panel.is-after{transform:translateY(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5trv-media{right:0;bottom:auto;width:auto;height:var(--ow)}
.w5trv-media img{transform:translateY(calc(var(--c) / 2 - 50%)) scale(1.1)}
.w5trv-tab{right:0;bottom:auto;width:auto;height:var(--c);flex-direction:row;padding:0 20px}
.w5trv-name{writing-mode:horizontal-tb;transform:none}
.w5trv-cap{width:auto;right:0;bottom:calc((var(--n) - 1) * var(--c));padding:22px}
.w5trv-hit{right:0;bottom:auto;width:auto;height:var(--c)}
.is-open .w5trv-hit{width:auto;height:var(--ow)}
}
@media (prefers-reduced-motion:reduce){.w5trv-panel,.w5trv-media img,.w5trv-cap,.is-open .w5trv-cap,.w5trv-tab,.w5trv-dim{transition:none}}
`;

export default function ExpandingTravelDestinationPhotoPanels() {
  const [open, setOpen] = useState(0);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onEnter = (i: number) => (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(i), HOVER_DELAY);
  };
  const onLeave = () => window.clearTimeout(timer.current);

  return (
    <section className="bg-[#efe6d8] px-4 py-14 sm:px-8 sm:py-16">
      <style>{CSS}</style>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7a4f2a]">Saltroad Journeys</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-[#2b2118] sm:text-4xl">Five slow routes for next spring</h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-[#5a4634]">Small groups of ten, local guides and no early flights. Point at a route, tab to it or tap it to read more.</p>
        </div>
        <div className="w5trv-stage">
          {TRIPS.map((t, i) => (
            <div key={t.title} className={`w5trv-panel${i === open ? " is-open" : ""}${i > open ? " is-after" : ""}`} style={{ "--i": i } as CSSProperties}>
              <div className="w5trv-media">
                <img src={t.img} alt={t.alt} loading={i === 0 ? "eager" : "lazy"} />
                <div className="w5trv-shade" />
                <div className="w5trv-dim" />
              </div>
              <div className="w5trv-tab" aria-hidden="true">
                <span className="text-xs font-semibold tabular-nums">0{i + 1}</span>
                <span className="w5trv-name">{t.place}</span>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 4v12M4 10h12" /></svg>
              </div>
              <button
                type="button"
                className="w5trv-hit"
                aria-expanded={i === open}
                aria-controls={`w5trv-cap-${i}`}
                onPointerEnter={onEnter(i)}
                onPointerLeave={onLeave}
                onFocus={() => setOpen(i)}
                onClick={() => setOpen(i)}
              >
                <span className="sr-only">{t.place}: {t.title}</span>
              </button>
              <div className="w5trv-cap" id={`w5trv-cap-${i}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f2c98c]">{t.place}</p>
                <h3 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{t.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[#efe3d2] sm:text-base">{t.line}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
                  <span className="tabular-nums text-[#efe3d2]">{t.nights} · {t.price}</span>
                  <a
                    href="#"
                    tabIndex={i === open ? 0 : -1}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-[#fbf6ee] px-5 font-semibold text-[#2b2118] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c98c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2b2118]"
                  >
                    See the route
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
