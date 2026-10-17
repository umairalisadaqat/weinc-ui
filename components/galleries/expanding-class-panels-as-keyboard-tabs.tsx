import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

// Expanding panels that behave as a real tab set: arrow keys, Home and End move between
// classes, and only the open class's panel is exposed. All motion is translate and opacity.
const CLASSES = [
  { name: "Wheel throwing", when: "Thursdays, 6:30 to 9 pm", length: "6 weeks", price: "$320", line: "Centre, open and pull your first cylinders, then trim and keep the best four.", img: "https://images.pexels.com/photos/36370411/pexels-photo-36370411.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Two hands shaping a clay pot on a spinning potter's wheel" },
  { name: "Hand building", when: "Saturdays, 10 am to 1 pm", length: "4 weeks", price: "$240", line: "Pinch, coil and slab your way to a set of cups without touching a wheel.", img: "https://images.pexels.com/photos/7302675/pexels-photo-7302675.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Clay coils and small rings laid out with tools on a pale table" },
  { name: "Glaze lab", when: "Tuesdays, 7 to 9 pm", length: "3 weeks", price: "$180", line: "Mix test tiles, layer colours and learn why a glaze runs or crawls.", img: "https://images.pexels.com/photos/6800483/pexels-photo-6800483.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A potter painting a bowl beside trays of coloured glazes" },
  { name: "Kiln and firing", when: "One Sunday, 10 am to 4 pm", length: "1 day", price: "$150", line: "Load, fire and unload with our kiln tech, and see how heat changes clay.", img: "https://images.pexels.com/photos/9736510/pexels-photo-9736510.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Stacks of unglazed earthenware plates inside an open kiln" },
];
const HOVER_DELAY = 90; // ms before a hovered tab opens

const CSS = `
.w5tab-stage{--c:80px;--n:4;--ow:calc(100% - (var(--n) - 1) * var(--c));position:relative;height:500px;overflow:hidden;border-radius:20px;background:#0a1420}
.w5tab-slot,.w5tab-panel{position:absolute;inset:0;transform:translateX(calc(var(--i) * var(--c)));transition:transform .7s cubic-bezier(.22,1,.36,1)}
.w5tab-panel{z-index:var(--i);box-shadow:-10px 0 26px rgba(4,10,18,.45)}
.w5tab-slot{pointer-events:none}
.w5tab-slot.is-after,.w5tab-panel.is-after{transform:translateX(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5tab-media{position:absolute;top:0;left:0;bottom:0;width:var(--ow);overflow:hidden;background:#15253a}
.w5tab-media img{display:block;width:100%;height:100%;object-fit:cover;transform:translateX(calc(var(--c) / 2 - 50%)) scale(1.08);transition:transform .9s cubic-bezier(.22,1,.36,1)}
.is-open .w5tab-media img{transform:none}
.w5tab-tint{position:absolute;inset:0;background:rgba(14,26,43,.42);transition:opacity .5s}
.is-open .w5tab-tint{opacity:0}
.w5tab-shade{position:absolute;inset:0;background:linear-gradient(to right,rgba(10,20,32,.9),rgba(10,20,32,.55) 45%,rgba(10,20,32,0) 75%)}
.w5tab-list{position:absolute;inset:0;z-index:20;pointer-events:none}
.w5tab-tab{position:absolute;top:0;left:0;bottom:0;width:var(--c);display:flex;align-items:center;justify-content:center;padding:0;border:0;background:transparent;color:#f4ead8;font:inherit;cursor:pointer;pointer-events:auto}
.w5tab-tab[aria-selected="true"]{width:var(--ow);cursor:default}
.w5tab-tab:focus-visible{outline:3px solid #e9c58f;outline-offset:-7px;border-radius:14px}
.w5tab-label{writing-mode:vertical-rl;transform:rotate(180deg);font-size:15px;font-weight:600;letter-spacing:.06em;white-space:nowrap;transition:opacity .3s}
.w5tab-tab[aria-selected="true"] .w5tab-label{opacity:0}
.w5tab-pane{position:absolute;top:0;left:0;bottom:0;width:var(--ow);box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;padding:40px;color:#f4ead8;z-index:30;pointer-events:none;animation:w5tab-in .6s .3s both cubic-bezier(.22,1,.36,1)}
.w5tab-pane:focus-visible{outline:3px solid #e9c58f;outline-offset:-7px;border-radius:14px}
@keyframes w5tab-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (max-width:640px){
.w5tab-stage{--c:56px;height:600px}
.w5tab-slot,.w5tab-panel{transform:translateY(calc(var(--i) * var(--c)))}
.w5tab-panel{box-shadow:0 -10px 26px rgba(4,10,18,.45)}
.w5tab-slot.is-after,.w5tab-panel.is-after{transform:translateY(calc(100% - (var(--n) - var(--i)) * var(--c)))}
.w5tab-media{right:0;bottom:auto;width:auto;height:var(--ow)}
.w5tab-media img{transform:translateY(calc(var(--c) / 2 - 50%)) scale(1.08)}
.w5tab-shade{background:linear-gradient(to top,rgba(10,20,32,.92),rgba(10,20,32,.5) 55%,rgba(10,20,32,0) 80%)}
.w5tab-tab{right:0;bottom:auto;width:auto;height:var(--c);justify-content:flex-start;padding:0 20px}
.w5tab-tab[aria-selected="true"]{width:auto;height:var(--ow)}
.w5tab-label{writing-mode:horizontal-tb;transform:none}
.w5tab-pane{right:0;bottom:auto;width:auto;height:var(--ow);justify-content:flex-end;padding:22px}
}
@media (prefers-reduced-motion:reduce){.w5tab-slot,.w5tab-panel,.w5tab-media img,.w5tab-tint,.w5tab-label{transition:none}.w5tab-pane{animation:none}}
`;

export default function ExpandingClassPanelsAsKeyboardTabs() {
  const [open, setOpen] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const n = CLASSES.length;

  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: open + 1, ArrowDown: open + 1, ArrowLeft: open - 1, ArrowUp: open - 1, Home: 0, End: n - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    const k = (map[e.key] + n) % n;
    setOpen(k);
    tabs.current[k]?.focus();
  };
  const onEnter = (i: number) => (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(i), HOVER_DELAY);
  };
  const c = CLASSES[open];

  return (
    <section className="bg-[#0e1a2b] px-4 py-14 sm:px-8 sm:py-16">
      <style>{CSS}</style>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e9c58f]">Slow Clay Studio</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#f4ead8] sm:text-4xl">Winter classes</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#c3cbd6]">Hover, tap or use the arrow keys to move between classes. Clay, glazes and firing are included.</p>
        </div>
        <div className="w5tab-stage">
          <div className="w5tab-list" role="tablist" aria-label="Pottery classes" aria-orientation="horizontal" onKeyDown={onKey}>
            {CLASSES.map((k, i) => (
              <div key={k.name} className={`w5tab-slot${i > open ? " is-after" : ""}`} style={{ "--i": i } as CSSProperties}>
                <button
                  ref={(el) => { tabs.current[i] = el; }}
                  type="button"
                  role="tab"
                  id={`w5tab-tab-${i}`}
                  aria-selected={i === open}
                  aria-controls={i === open ? `w5tab-pane-${i}` : undefined}
                  tabIndex={i === open ? 0 : -1}
                  className="w5tab-tab"
                  onPointerEnter={onEnter(i)}
                  onPointerLeave={() => window.clearTimeout(timer.current)}
                  onFocus={() => setOpen(i)}
                  onClick={() => setOpen(i)}
                >
                  <span className="w5tab-label">{k.name}</span>
                </button>
              </div>
            ))}
          </div>
          {CLASSES.map((k, i) => (
            <div key={k.name} className={`w5tab-panel${i === open ? " is-open" : ""}${i > open ? " is-after" : ""}`} style={{ "--i": i } as CSSProperties}>
              <div className="w5tab-media">
                <img src={k.img} alt={k.alt} loading={i === 0 ? "eager" : "lazy"} />
                <div className="w5tab-shade" />
                <div className="w5tab-tint" />
              </div>
              {i === open && (
                <div role="tabpanel" id={`w5tab-pane-${i}`} aria-labelledby={`w5tab-tab-${i}`} tabIndex={0} className="w5tab-pane" key={open}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e9c58f]">{k.length} · {k.price}</p>
                  <h3 className="mt-2 text-3xl font-semibold leading-tight">{k.name}</h3>
                  <p className="mt-3 max-w-xs text-base leading-relaxed text-[#dfe4ea]">{k.line}</p>
                  <p className="mt-4 text-sm font-medium text-[#f4ead8]">{k.when}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#c3cbd6]">Eight places per class. Aprons and tools are ready on your bench.</p>
          <a href="#" className="inline-flex h-11 items-center justify-center rounded-full bg-[#e9c58f] px-6 text-sm font-semibold text-[#0e1a2b] transition hover:bg-[#f2d6ab] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9c58f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1a2b]">Book {c.name.toLowerCase()}</a>
        </div>
      </div>
    </section>
  );
}
