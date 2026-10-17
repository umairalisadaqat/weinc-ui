import { useEffect, useRef, useState } from "react";

const DELAY = 1800; // ms between idle reveals while nobody is pointing or tabbing

const loaves = [
  { name: "Country sourdough", note: "Two-day ferment, dark crust, open crumb", price: "$9", img: "https://images.pexels.com/photos/28354523/pexels-photo-28354523.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "A floured sourdough loaf on a board beside a scoop of wheat grains" },
  { name: "Butter croissants", note: "Laminated by hand, baked at six", price: "$4", img: "https://images.pexels.com/photos/20002837/pexels-photo-20002837.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Golden croissants cooling on a wire rack" },
  { name: "Cinnamon rolls", note: "Rolled with brown butter, sugared at nine", price: "$5", img: "https://images.pexels.com/photos/8651023/pexels-photo-8651023.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Cinnamon rolls dusted with sugar on a wooden tray" },
  { name: "Long baguettes", note: "Thin crackling crust, out twice a day", price: "$4", img: "https://images.pexels.com/photos/30826793/pexels-photo-30826793.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Baguettes standing in paper sleeves in a bakery basket" },
];

const css = `
.w8bak { --w8bak-win: 188px; }
.w8bak-row { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 22px 4px; border-top: 1px solid #d9ccb6; color: inherit; text-decoration: none; outline: none; }
.w8bak-list li:last-child .w8bak-row { border-bottom: 1px solid #d9ccb6; }
.w8bak-text { transition: transform .5s cubic-bezier(.2,.8,.2,1); }
.w8bak-win { position: absolute; z-index: 2; right: 64px; top: 50%; margin-top: calc(var(--w8bak-win) / -3); width: var(--w8bak-win); aspect-ratio: 3 / 2; border-radius: 10px; overflow: hidden; background: #e4d8c3; opacity: 0; transform: translateX(24px) rotate(3deg); transition: opacity .35s ease, transform .6s cubic-bezier(.2,.8,.2,1); pointer-events: none; box-shadow: 0 18px 34px -16px rgba(60,40,20,.6); }
.w8bak-img { display: block; width: 100%; height: 100%; object-fit: cover; transform: translateY(100%) scale(1.25); transition: transform .7s cubic-bezier(.2,.8,.2,1); }
.w8bak-arrow { flex: none; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 999px; border: 1px solid #cdbda3; color: #7a3e1d; transition: transform .5s cubic-bezier(.2,.8,.2,1); }
.w8bak-row[data-on] .w8bak-win, .w8bak-row:hover .w8bak-win, .w8bak-row:focus-visible .w8bak-win { opacity: 1; transform: rotate(-2deg); }
.w8bak-row[data-on] .w8bak-img, .w8bak-row:hover .w8bak-img, .w8bak-row:focus-visible .w8bak-img { transform: none; }
.w8bak-row[data-on] .w8bak-text, .w8bak-row:hover .w8bak-text, .w8bak-row:focus-visible .w8bak-text { transform: translateX(10px); }
.w8bak-row[data-on] .w8bak-arrow, .w8bak-row:hover .w8bak-arrow, .w8bak-row:focus-visible .w8bak-arrow { transform: rotate(-45deg); }
.w8bak-row:focus-visible { box-shadow: 0 0 0 2px #f4ede1, 0 0 0 4px #7a3e1d; border-radius: 6px; }
@media (max-width: 640px) {
  .w8bak-row { gap: 16px; padding: 16px 0; }
  .w8bak-name { font-size: 20px; }
}
@media (max-width: 640px), (prefers-reduced-motion: reduce) {
  .w8bak-win { position: relative; right: auto; top: auto; margin: 0; flex: none; width: 112px; opacity: 1; transform: none; transition: none; box-shadow: none; }
  .w8bak-img { transform: none; transition: none; }
  .w8bak-row .w8bak-text { transform: none; transition: none; }
  .w8bak-arrow { display: none; }
}
`;

export default function BakeryMenuRowsWithPhotoRisingThroughAMask() {
  const root = useRef<HTMLElement>(null);
  const [on, setOn] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0, visible = true, live = true;
    const run = () => {
      window.clearInterval(timer);
      timer = 0;
      if (live && visible) timer = window.setInterval(() => setOn((n) => (n + 1) % loaves.length), DELAY);
    };
    // a real mouse or keyboard takes over from the idle demo
    const stop = () => { live = false; setOn(-1); run(); };
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

  return (
    <section ref={root} className="w8bak bg-[#f4ede1] px-5 py-16 text-[#2b1d12] sm:py-20">
      <style>{css}</style>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7a3e1d]">Fernhill Bakehouse</p>
        <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">Out of the oven this morning</h2>
        <p className="mt-3 max-w-md text-base text-[#5c4632]">Point at a loaf to see it. Each row opens the full counter list for that bake.</p>
        <ul className="w8bak-list mt-10">
          {loaves.map((l, i) => (
            <li key={l.name}>
              <a href="#" className="w8bak-row" data-on={on === i ? "" : undefined}>
                <span className="w8bak-text block">
                  <span className="flex items-baseline gap-3">
                    <span className="w8bak-name font-serif text-2xl">{l.name}</span>
                    <span className="text-sm font-semibold text-[#7a3e1d]">{l.price}</span>
                  </span>
                  <span className="mt-1 block text-sm text-[#5c4632]">{l.note}</span>
                </span>
                <span className="w8bak-win">
                  <img className="w8bak-img" src={l.img} alt={l.alt} width={400} height={267} loading="lazy" decoding="async" />
                </span>
                <span className="w8bak-arrow" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
