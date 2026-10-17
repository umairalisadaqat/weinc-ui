import { useEffect, useRef, useState } from "react";

const DELAY = 2200; // ms between idle swaps while nobody is pointing or tabbing

const rooms = [
  {
    name: "Shore Room",
    note: "Queen bed, sheer curtains, a step out to the terrace",
    rate: "From $210 a night",
    a: { src: "https://images.pexels.com/photos/2899687/pexels-photo-2899687.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "A hotel room with sheer curtains open onto a terrace and palm trees", label: "The room" },
    b: { src: "https://images.pexels.com/photos/3225561/pexels-photo-3225561.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Glass doors opening onto a balcony with chairs and palm trees outside", label: "The balcony" },
  },
  {
    name: "Ridge Room",
    note: "Low bed, reading chair, a west window for the evening light",
    rate: "From $180 a night",
    a: { src: "https://images.pexels.com/photos/2346091/pexels-photo-2346091.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "A dim bedroom whose window looks out on mountains at sunset", label: "The room" },
    b: { src: "https://images.pexels.com/photos/18311189/pexels-photo-18311189.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "A green alpine valley below snowy mountain peaks", label: "The valley" },
  },
];

const css = `
.w8rom-frame { position: relative; overflow: hidden; aspect-ratio: 4 / 3; border-radius: 14px; background: #cbd5e1; }
.w8rom-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(.65,0,.2,1); }
.w8rom-b { transform: translateX(100%); }
.w8rom-chip { position: absolute; left: 14px; bottom: 14px; height: 30px; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.92); color: #0f172a; font-size: 13px; font-weight: 600; }
.w8rom-chip span { display: block; height: 30px; line-height: 30px; padding: 0 12px; transition: transform .6s cubic-bezier(.65,0,.2,1); }
.w8rom-card[data-on] .w8rom-a { transform: translateX(-35%); }
.w8rom-card[data-on] .w8rom-b { transform: none; }
.w8rom-card[data-on] .w8rom-chip span { transform: translateY(-100%); }
@media (hover: hover) and (pointer: fine) {
  .w8rom-card:hover .w8rom-a { transform: translateX(-35%); }
  .w8rom-card:hover .w8rom-b { transform: none; }
  .w8rom-card:hover .w8rom-chip span { transform: translateY(-100%); }
}
.w8rom-btn:focus-visible, .w8rom-link:focus-visible { outline: 2px solid #0f172a; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .w8rom-img, .w8rom-chip span { transition: none; } }
`;

export default function HotelRoomCardsSlidingToASecondView() {
  const root = useRef<HTMLElement>(null);
  const [on, setOn] = useState<boolean[]>([true, false]);
  const live = useRef(true);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0, visible = true, step = 0;
    const run = () => {
      window.clearInterval(timer);
      timer = 0;
      if (live.current && visible) timer = window.setInterval(() => { step = (step + 1) % 4; setOn([step === 0, step === 2]); }, DELAY);
    };
    // a real mouse, a tap on a button, or the keyboard takes over from the idle demo
    const stop = () => { if (!live.current) return; live.current = false; setOn([false, false]); run(); };
    const enter = (e: PointerEvent) => { if (e.pointerType === "mouse") stop(); };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; run(); });
    io.observe(el);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("focusin", stop);
    run();
    return () => {
      window.clearInterval(timer);
      io.disconnect();
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("focusin", stop);
    };
  }, []);

  const toggle = (i: number) => {
    live.current = false;
    setOn((cur) => cur.map((v, k) => (k === i ? !v : v)));
  };

  return (
    <section ref={root} className="bg-white px-5 py-16 text-slate-900 sm:py-20">
      <style>{css}</style>
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Larkspur House</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Two rooms, two outlooks</h2>
          <p className="max-w-sm text-base text-slate-600">Hover a room, or press its view button, to see what lies past the window.</p>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {rooms.map((r, i) => (
            <article key={r.name} className="w8rom-card" data-on={on[i] ? "" : undefined}>
              <div className="w8rom-frame">
                <img className="w8rom-img w8rom-a" src={r.a.src} alt={r.a.alt} width={800} height={600} loading="lazy" decoding="async" />
                <img className="w8rom-img w8rom-b" src={r.b.src} alt={r.b.alt} width={800} height={600} loading="lazy" decoding="async" />
                <span className="w8rom-chip" aria-hidden="true"><span>{r.a.label}</span><span>{r.b.label}</span></span>
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    <a href="#" className="w8rom-link rounded">{r.name}</a>
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{r.note}</p>
                  <p className="mt-2 text-sm font-medium text-slate-800">{r.rate}</p>
                </div>
                <button type="button" className="w8rom-btn h-10 shrink-0 rounded-full border border-slate-300 px-4 text-sm font-medium text-slate-800 hover:bg-slate-50" aria-pressed={on[i]} onClick={() => toggle(i)}>
                  {on[i] ? "Show room" : "Show view"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
