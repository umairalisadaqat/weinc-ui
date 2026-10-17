import { useEffect, useRef, useState } from "react";

const DELAY = 2100; // ms between idle swaps while nobody is pointing or tabbing

const teas = [
  { name: "Sencha", origin: "Steamed green, light and grassy", price: "$14 / 50 g",
    leaf: { src: "https://images.pexels.com/photos/8329977/pexels-photo-8329977.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Dark twisted green tea leaves in a glass jar with a wooden scoop" },
    cup: { src: "https://images.pexels.com/photos/5946681/pexels-photo-5946681.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Green tea poured into a small celadon cup on a saucer" } },
  { name: "Highland black", origin: "Malty, dark, good with milk", price: "$12 / 50 g",
    leaf: { src: "https://images.pexels.com/photos/8329983/pexels-photo-8329983.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Loose black tea leaves spilling from a tipped glass jar" },
    cup: { src: "https://images.pexels.com/photos/1493080/pexels-photo-1493080.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Deep red black tea steaming in a tulip glass on a saucer" } },
  { name: "Jasmine green", origin: "Green leaf layered with blossom", price: "$16 / 50 g",
    leaf: { src: "https://images.pexels.com/photos/8330328/pexels-photo-8330328.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "A scattered pile of curled green tea leaves on linen" },
    cup: { src: "https://images.pexels.com/photos/7138780/pexels-photo-7138780.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Golden tea in a glass cup beside fresh white jasmine flowers" } },
];

const css = `
.w8tea-frame { position: relative; overflow: hidden; aspect-ratio: 1 / 1; border-radius: 18px; background: #d9ccb4; }
.w8tea-base { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.w8tea-lens { position: absolute; left: -25%; top: -25%; width: 150%; height: 150%; border-radius: 50%; overflow: hidden; opacity: 0; transform: scale(.08); transition: transform .8s cubic-bezier(.65,0,.25,1), opacity .25s ease; }
.w8tea-lens img { position: absolute; left: 16.667%; top: 16.667%; width: 66.667%; height: 66.667%; max-width: none; object-fit: cover; transform: scale(12.5); transition: transform .8s cubic-bezier(.65,0,.25,1); }
.w8tea-tag { position: absolute; right: 12px; top: 12px; height: 28px; overflow: hidden; border-radius: 999px; background: rgba(250,246,238,.92); color: #2f2a22; font-size: 12px; font-weight: 600; letter-spacing: .04em; }
.w8tea-tag span { display: block; height: 28px; line-height: 28px; padding: 0 11px; transition: transform .5s cubic-bezier(.65,0,.25,1); }
.w8tea-card[data-on] .w8tea-lens { opacity: 1; transform: none; }
.w8tea-card[data-on] .w8tea-lens img { transform: none; }
.w8tea-card[data-on] .w8tea-tag span { transform: translateY(-100%); }
@media (hover: hover) and (pointer: fine) {
  .w8tea-card:hover .w8tea-lens { opacity: 1; transform: none; }
  .w8tea-card:hover .w8tea-lens img { transform: none; }
  .w8tea-card:hover .w8tea-tag span { transform: translateY(-100%); }
}
.w8tea-btn:focus-visible, .w8tea-link:focus-visible { outline: 2px solid #2f2a22; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .w8tea-lens, .w8tea-lens img, .w8tea-tag span { transition: none; } }
`;

export default function TeaCardsWithACircleOpeningToTheCup() {
  const root = useRef<HTMLElement>(null);
  const [on, setOn] = useState<boolean[]>([true, false, false]);
  const live = useRef(true);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0, visible = true, step = 0;
    const run = () => {
      window.clearInterval(timer);
      timer = 0;
      if (live.current && visible) timer = window.setInterval(() => { step = (step + 1) % 6; setOn(teas.map((_, k) => step === k * 2)); }, DELAY);
    };
    // a real mouse or the keyboard takes over from the idle demo
    const stop = () => { if (!live.current) return; live.current = false; setOn(teas.map(() => false)); run(); };
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
    <section ref={root} className="bg-[#ece3d3] px-5 py-16 text-[#2f2a22] sm:py-20">
      <style>{css}</style>
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7d5b2e]">Oldmill Tea Room</p>
        <h2 className="mt-3 font-serif text-3xl sm:text-4xl">From the tin to the cup</h2>
        <p className="mt-3 max-w-md text-base text-[#5a5042]">Each card shows the dry leaf. Hover it, or press the cup button, to see how it pours.</p>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {teas.map((t, i) => (
            <article key={t.name} className="w8tea-card" data-on={on[i] ? "" : undefined}>
              <div className="w8tea-frame">
                <img className="w8tea-base" src={t.leaf.src} alt={t.leaf.alt} width={600} height={600} loading="lazy" decoding="async" />
                <span className="w8tea-lens"><img src={t.cup.src} alt={t.cup.alt} width={600} height={600} loading="lazy" decoding="async" /></span>
                <span className="w8tea-tag" aria-hidden="true"><span>Dry leaf</span><span>In the cup</span></span>
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-xl"><a href="#" className="w8tea-link rounded">{t.name}</a></h3>
                  <p className="mt-1 text-sm text-[#5a5042]">{t.origin}</p>
                  <p className="mt-1 text-sm font-medium">{t.price}</p>
                </div>
                <button type="button" className="w8tea-btn h-10 shrink-0 rounded-full bg-[#2f2a22] px-4 text-sm font-medium text-[#f6efe2] hover:bg-[#463e33]" aria-pressed={on[i]} onClick={() => toggle(i)}>
                  {on[i] ? "Show leaf" : "Show cup"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
