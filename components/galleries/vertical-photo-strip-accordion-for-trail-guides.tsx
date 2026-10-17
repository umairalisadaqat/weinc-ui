import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

// A vertical accordion built from full-size photo layers that slide with translateY.
// It stays vertical at every width, so it reads the same on a phone and a desktop.
const TRAILS = [
  { name: "Spruce Ridge Loop", grade: "Moderate", km: "9.4 km", climb: "410 m", time: "3 h 30", line: "A shaded climb through old spruce to a stony ridge with long views east.", img: "https://images.pexels.com/photos/32375565/pexels-photo-32375565.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A walker on a rocky path below a steep slope of dark conifers" },
  { name: "Birch Hollow", grade: "Easy", km: "6.1 km", climb: "120 m", time: "2 h", line: "Flat and friendly, through bare birch woods that glow in low autumn sun.", img: "https://images.pexels.com/photos/29176381/pexels-photo-29176381.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A runner on a leafy woodland trail between tall bare trees" },
  { name: "Glacier View Saddle", grade: "Hard", km: "14.8 km", climb: "980 m", time: "6 h", line: "A long day up through meadow to a saddle facing the snow peak itself.", img: "https://images.pexels.com/photos/38246300/pexels-photo-38246300.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A green path framed by trees leading toward a snow-capped mountain" },
  { name: "Summit Traverse", grade: "Hard", km: "18.2 km", climb: "1,240 m", time: "8 h", line: "Our guided route along the crest, with poles, a radio and a hot lunch.", img: "https://images.pexels.com/photos/27769494/pexels-photo-27769494.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Three hikers with packs climbing a grassy slope toward blue mountains" },
];
const HOVER_DELAY = 90; // ms before a hovered row opens

const CSS = `
.w5trl-stage{--c:64px;--n:4;--ow:calc(100% - (var(--n) - 1) * var(--c));position:relative;height:660px;overflow:hidden;border-radius:18px;background:#0b1811;box-shadow:0 30px 60px -30px rgba(0,0,0,.6)}
.w5trl-panel{position:absolute;inset:0;z-index:var(--i);transform:translateY(calc(var(--i) * var(--c)));transition:transform .7s cubic-bezier(.22,1,.36,1)}
.w5trl-panel.is-after{transform:translateY(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5trl-media{position:absolute;top:0;left:0;right:0;height:var(--ow);overflow:hidden;background:#1a3326}
.w5trl-media img{display:block;width:100%;height:100%;object-fit:cover;transform:translateY(calc(var(--c) / 2 - 50%)) scale(1.08);transition:transform .9s cubic-bezier(.22,1,.36,1)}
.is-open .w5trl-media img{transform:none}
.w5trl-shade{position:absolute;inset:0;background:linear-gradient(to top,rgba(8,20,13,.95), rgba(8,20,13,.78) 42%, rgba(8,20,13,0) 78%)}
.w5trl-bar{position:absolute;inset:0;background:rgba(17,38,27,.72);border-top:1px solid rgba(225,238,226,.14);transition:opacity .45s}
.is-open .w5trl-bar{opacity:0}
.w5trl-row{position:absolute;top:0;left:0;right:0;height:var(--c);display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 22px;color:#e8f0e6;pointer-events:none;transition:opacity .3s}
.is-open .w5trl-row{opacity:0}
.w5trl-cap{position:absolute;left:0;right:0;bottom:calc((var(--n) - 1) * var(--c));padding:24px;color:#f1f6ef;opacity:0;transform:translateY(14px);transition:opacity .25s,transform .25s;pointer-events:none}
.is-open .w5trl-cap{opacity:1;transform:none;transition:opacity .45s .3s,transform .6s .3s cubic-bezier(.22,1,.36,1)}
.w5trl-cap a{pointer-events:auto}
.w5trl-hit{position:absolute;top:0;left:0;right:0;height:var(--c);padding:0;border:0;background:transparent;cursor:pointer}
.is-open .w5trl-hit{height:var(--ow);cursor:default}
.w5trl-hit:focus-visible{outline:3px solid #b9e4a8;outline-offset:-6px;border-radius:12px}
@media (max-width:640px){.w5trl-stage{--c:60px;height:580px}.w5trl-cap{padding:18px}}
@media (prefers-reduced-motion:reduce){.w5trl-panel,.w5trl-media img,.w5trl-bar,.w5trl-row,.w5trl-cap,.is-open .w5trl-cap{transition:none}}
`;

export default function VerticalPhotoStripAccordionForTrailGuides() {
  const [open, setOpen] = useState(0);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const onEnter = (i: number) => (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(i), HOVER_DELAY);
  };

  return (
    <section className="bg-[#11241a] px-4 py-14 sm:px-8 sm:py-16">
      <style>{CSS}</style>
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a9d39a]">Fernway Trail Guides</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-[#f1f6ef] sm:text-4xl">Pick a trail for Saturday</h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-[#c5d6c3]">Four routes from the same car park, from an easy stroll to a full day on the crest. Every one is walked by a guide the week before.</p>
          <ul className="mt-6 space-y-2 text-sm text-[#c5d6c3]">
            <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#a9d39a]" aria-hidden="true" />Meet 8:00 at the Fernway hut</li>
            <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#a9d39a]" aria-hidden="true" />Maps and poles lent free</li>
          </ul>
        </div>
        <div className="w5trl-stage">
          {TRAILS.map((t, i) => (
            <div key={t.name} className={`w5trl-panel${i === open ? " is-open" : ""}${i > open ? " is-after" : ""}`} style={{ "--i": i } as CSSProperties}>
              <div className="w5trl-media">
                <img src={t.img} alt={t.alt} loading={i === 0 ? "eager" : "lazy"} />
                <div className="w5trl-shade" />
                <div className="w5trl-bar" />
              </div>
              <div className="w5trl-row" aria-hidden="true">
                <span className="text-base font-semibold">{t.name}</span>
                <span className="flex items-center gap-3 text-sm tabular-nums text-[#c5d6c3]">
                  {t.km} · {t.grade}
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 8 5 5 5-5" /></svg>
                </span>
              </div>
              <button type="button" className="w5trl-hit" aria-expanded={i === open} aria-controls={`w5trl-cap-${i}`} onPointerEnter={onEnter(i)} onPointerLeave={() => window.clearTimeout(timer.current)} onFocus={() => setOpen(i)} onClick={() => setOpen(i)}>
                <span className="sr-only">{t.name}, {t.km}, {t.grade}</span>
              </button>
              <div className="w5trl-cap" id={`w5trl-cap-${i}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a9d39a]">{t.grade}</p>
                <h3 className="mt-1 text-2xl font-semibold leading-tight">{t.name}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[#d6e3d3]">{t.line}</p>
                <dl className="mt-4 grid max-w-sm grid-cols-3 gap-3 text-sm">
                  <div><dt className="text-xs text-[#b8ccb5]">Distance</dt><dd className="font-semibold tabular-nums">{t.km}</dd></div>
                  <div><dt className="text-xs text-[#b8ccb5]">Climb</dt><dd className="font-semibold tabular-nums">{t.climb}</dd></div>
                  <div><dt className="text-xs text-[#b8ccb5]">Time</dt><dd className="font-semibold tabular-nums">{t.time}</dd></div>
                </dl>
                <a href="#" tabIndex={i === open ? 0 : -1} className="mt-4 inline-flex h-10 items-center rounded-full bg-[#a9d39a] px-5 text-sm font-semibold text-[#0b1811] transition hover:bg-[#c2e5b5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8f0e6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1811]">Get the route map</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
