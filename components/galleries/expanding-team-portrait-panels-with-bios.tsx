import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

// Portrait layers slide over each other with transforms; closed strips are shown in
// greyscale by a blend layer that fades out when the portrait opens.
const PEOPLE = [
  { initials: "MH", name: "Margit Hollis", role: "Founding partner", bio: "Thirty years of schools and libraries. Still sketches every first plan by hand.", email: "Write to Margit", img: "https://images.pexels.com/photos/8727416/pexels-photo-8727416.jpeg?auto=compress&cs=tinysrgb&w=1000", pos: "50% 30%", alt: "Smiling woman with short white hair in a white T-shirt against a blue-grey wall" },
  { initials: "TL", name: "Theo Lin", role: "Project architect", bio: "Runs our timber housing work and the studio's slightly obsessive model shop.", email: "Write to Theo", img: "https://images.pexels.com/photos/31052395/pexels-photo-31052395.jpeg?auto=compress&cs=tinysrgb&w=1000", pos: "50% 25%", alt: "Young man with curly black hair and round glasses in a black shirt" },
  { initials: "AM", name: "Arjun Mehta", role: "Site lead", bio: "Turns drawings into buildings and keeps every contractor on first-name terms.", email: "Write to Arjun", img: "https://images.pexels.com/photos/10019539/pexels-photo-10019539.jpeg?auto=compress&cs=tinysrgb&w=1000", pos: "50% 95%", alt: "Bearded man in a patterned shirt against a plain white background" },
  { initials: "CR", name: "Clara Rowe", role: "Interiors and light", bio: "Plans how each room feels at seven in the morning and at seven at night.", email: "Write to Clara", img: "https://images.pexels.com/photos/4698776/pexels-photo-4698776.jpeg?auto=compress&cs=tinysrgb&w=1000", pos: "50% 35%", alt: "Woman with long curly hair leaning by a window and looking at the camera" },
];
const HOVER_DELAY = 80; // ms before a hovered strip opens

const CSS = `
.w5tem-stage{--c:84px;--n:4;--ow:calc(100% - (var(--n) - 1) * var(--c));position:relative;height:560px;overflow:hidden;border-radius:6px;background:#1d1f22}
.w5tem-panel{position:absolute;inset:0;z-index:var(--i);transform:translateX(calc(var(--i) * var(--c)));transition:transform .7s cubic-bezier(.2,.9,.25,1);border-left:1px solid rgba(255,255,255,.35)}
.w5tem-panel:first-child{border-left:0}
.w5tem-panel.is-after{transform:translateX(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5tem-media{position:absolute;top:0;left:0;bottom:0;width:var(--ow);overflow:hidden;background:#2a2d31}
.w5tem-media img{display:block;width:100%;height:100%;object-fit:cover;transform:translateX(calc(var(--c) / 2 - 50%)) scale(1.06);transition:transform .8s cubic-bezier(.2,.9,.25,1)}
.is-open .w5tem-media img{transform:none}
.w5tem-mono{position:absolute;inset:0;background:#8a8d91;mix-blend-mode:saturation;transition:opacity .6s}
.w5tem-veil{position:absolute;inset:0;background:rgba(20,22,25,.35);transition:opacity .6s}
.is-open .w5tem-mono,.is-open .w5tem-veil{opacity:0}
.w5tem-tab{position:absolute;top:0;left:0;bottom:0;width:var(--c);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:22px 0;box-sizing:border-box;color:#fff;pointer-events:none;transition:opacity .3s}
.is-open .w5tem-tab{opacity:0}
.w5tem-ini{display:grid;place-items:center;width:40px;height:40px;border-radius:999px;background:rgba(255,255,255,.92);color:#1d1f22;font-size:13px;font-weight:700}
.w5tem-name{writing-mode:vertical-rl;transform:rotate(180deg);font-size:14px;font-weight:600;letter-spacing:.04em;white-space:nowrap;text-shadow:0 1px 8px rgba(0,0,0,.5)}
.w5tem-card{position:absolute;left:20px;bottom:20px;max-width:calc(var(--ow) - 40px);box-sizing:border-box;padding:20px 22px;border-radius:4px;background:#fff;color:#1d1f22;box-shadow:0 18px 40px rgba(0,0,0,.25);opacity:0;transform:translateY(12px);transition:opacity .25s,transform .25s;pointer-events:none}
.is-open .w5tem-card{opacity:1;transform:none;transition:opacity .45s .35s,transform .55s .35s cubic-bezier(.2,.9,.25,1)}
.w5tem-card a{pointer-events:auto}
.w5tem-hit{position:absolute;top:0;left:0;bottom:0;width:var(--c);padding:0;border:0;background:transparent;cursor:pointer}
.is-open .w5tem-hit{width:var(--ow);cursor:default}
.w5tem-hit:focus-visible{outline:3px solid #fff;outline-offset:-6px;box-shadow:inset 0 0 0 6px #1d1f22}
@media (max-width:640px){
.w5tem-stage{--c:58px;height:640px}
.w5tem-panel{transform:translateY(calc(var(--i) * var(--c)));border-left:0;border-top:1px solid rgba(255,255,255,.35)}
.w5tem-panel:first-child{border-top:0}
.w5tem-panel.is-after{transform:translateY(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5tem-media{right:0;bottom:auto;width:auto;height:var(--ow)}
.w5tem-media img{transform:translateY(calc(var(--c) / 2 - 50%)) scale(1.06)}
.w5tem-tab{right:0;bottom:auto;width:auto;height:var(--c);flex-direction:row;justify-content:flex-start;gap:14px;padding:0 14px}
.w5tem-ini{width:34px;height:34px;font-size:12px}
.w5tem-name{writing-mode:horizontal-tb;transform:none}
.w5tem-card{left:12px;right:12px;bottom:calc((var(--n) - 1) * var(--c) + 12px);max-width:none;padding:12px 16px}
.w5tem-card .w5tem-bio{margin-top:6px;font-size:13px}
.w5tem-hit{right:0;bottom:auto;width:auto;height:var(--c)}
.is-open .w5tem-hit{width:auto;height:var(--ow)}
}
@media (prefers-reduced-motion:reduce){.w5tem-panel,.w5tem-media img,.w5tem-mono,.w5tem-veil,.w5tem-tab,.w5tem-card,.is-open .w5tem-card{transition:none}}
`;

export default function ExpandingTeamPortraitPanelsWithBios() {
  const [open, setOpen] = useState(0);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const onEnter = (i: number) => (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(i), HOVER_DELAY);
  };

  return (
    <section className="bg-[#f3f3f1] px-4 py-14 sm:px-8 sm:py-20">
      <style>{CSS}</style>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Hollis &amp; Rowe Architects</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-[#1d1f22] sm:text-4xl">The four people who will draw your building</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">A small practice on purpose. Whoever meets you on the first visit stays on the job until the keys are handed over.</p>
          <a href="#" className="mt-6 inline-flex h-11 items-center rounded-full bg-[#1d1f22] px-6 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1f22] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f3f1]">Book a studio visit</a>
        </div>
        <div className="w5tem-stage">
          {PEOPLE.map((p, i) => (
            <div key={p.name} className={`w5tem-panel${i === open ? " is-open" : ""}${i > open ? " is-after" : ""}`} style={{ "--i": i } as CSSProperties}>
              <div className="w5tem-media">
                <img src={p.img} alt={p.alt} loading={i === 0 ? "eager" : "lazy"} style={{ objectPosition: p.pos }} />
                <div className="w5tem-mono" />
                <div className="w5tem-veil" />
              </div>
              <div className="w5tem-tab" aria-hidden="true">
                <span className="w5tem-ini">{p.initials}</span>
                <span className="w5tem-name">{p.name}</span>
              </div>
              <button type="button" className="w5tem-hit" aria-expanded={i === open} aria-controls={`w5tem-card-${i}`} onPointerEnter={onEnter(i)} onPointerLeave={() => window.clearTimeout(timer.current)} onFocus={() => setOpen(i)} onClick={() => setOpen(i)}>
                <span className="sr-only">{p.name}, {p.role}</span>
              </button>
              <div className="w5tem-card" id={`w5tem-card-${i}`}>
                <h3 className="text-lg font-semibold leading-tight">{p.name}</h3>
                <p className="mt-0.5 text-sm font-medium text-slate-600">{p.role}</p>
                <p className="w5tem-bio mt-3 max-w-xs text-sm leading-relaxed text-slate-700">{p.bio}</p>
                <a href="#" tabIndex={i === open ? 0 : -1} className="mt-3 inline-flex h-10 items-center text-sm font-semibold text-[#1d1f22] underline decoration-slate-400 underline-offset-4 hover:decoration-[#1d1f22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1f22]">{p.email}</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
