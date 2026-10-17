import { useEffect, useRef, useState } from "react";

const DELAY = 2000; // ms between idle reveals while nobody is pointing or tabbing

const walks = [
  { name: "Fog meadow huts", dist: "9 km", climb: "320 m climb", time: "3 hours", img: "https://images.pexels.com/photos/5865768/pexels-photo-5865768.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Dark wooden huts in a misty meadow below a pine forest" },
  { name: "Headland lighthouse", dist: "12 km", climb: "180 m climb", time: "4 hours", img: "https://images.pexels.com/photos/5736585/pexels-photo-5736585.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "A white lighthouse on a wooded headland above rocks and surf" },
  { name: "Old town lanes", dist: "5 km", climb: "60 m climb", time: "2 hours", img: "https://images.pexels.com/photos/18587007/pexels-photo-18587007.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "A narrow street curving between old houses with red tiled roofs" },
];

const css = `
.w8wlk-row { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 30px 4px; border-top: 1px solid #c9c6b6; color: #23261f; text-decoration: none; outline: none; }
.w8wlk-row:focus-visible { outline: 2px solid #4b5d2e; outline-offset: 2px; border-radius: 6px; }
.w8wlk-name { display: inline-block; transition: transform .5s cubic-bezier(.2,.8,.2,1); }
.w8wlk-fan { position: absolute; z-index: 2; right: 170px; top: 50%; width: 168px; height: 128px; margin-top: -64px; pointer-events: none; }
.w8wlk-card { position: absolute; inset: 0; border-radius: 4px; opacity: 0; transform: translate(-40px, 24px) rotate(-12deg) scale(.9); transition: opacity .3s ease, transform .65s cubic-bezier(.2,.9,.3,1.1); }
.w8wlk-back { background: #f7f4ea; box-shadow: 0 10px 24px -14px rgba(30,30,20,.6); padding: 12px 14px; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end; text-align: right; font-size: 12px; color: #3c4234; }
.w8wlk-front { background: #fff; padding: 6px; box-shadow: 0 16px 30px -14px rgba(30,30,20,.65); transition-delay: .06s; }
.w8wlk-mask { display: block; width: 100%; height: 100%; overflow: hidden; border-radius: 2px; }
.w8wlk-mask img { display: block; width: 100%; height: 100%; object-fit: cover; transform: scale(1.3) translateX(-12%); transition: transform .8s cubic-bezier(.2,.8,.2,1); }
.w8wlk-row[data-on] .w8wlk-back, .w8wlk-row:hover .w8wlk-back, .w8wlk-row:focus-visible .w8wlk-back { opacity: 1; transform: translate(96px, -8px) rotate(8deg); }
.w8wlk-row[data-on] .w8wlk-front, .w8wlk-row:hover .w8wlk-front, .w8wlk-row:focus-visible .w8wlk-front { opacity: 1; transform: translateX(-24px) rotate(-5deg); }
.w8wlk-row[data-on] .w8wlk-mask img, .w8wlk-row:hover .w8wlk-mask img, .w8wlk-row:focus-visible .w8wlk-mask img { transform: none; }
.w8wlk-row[data-on] .w8wlk-name, .w8wlk-row:hover .w8wlk-name, .w8wlk-row:focus-visible .w8wlk-name { transform: translateX(10px); }
.w8wlk-thumb { display: none; }
@media (max-width: 767px), (prefers-reduced-motion: reduce) {
  .w8wlk-fan { display: none; }
  .w8wlk-name { transform: none !important; transition: none; }
  .w8wlk-row { justify-content: flex-start; padding: 16px 0; }
  .w8wlk-thumb { display: block; flex: none; width: 92px; height: 70px; object-fit: cover; border: 4px solid #fff; border-radius: 3px; transform: rotate(-3deg); box-shadow: 0 6px 14px -8px rgba(30,30,20,.6); }
}
`;

export default function WalkingRoutesWithAPostcardPairFanningOut() {
  const root = useRef<HTMLElement>(null);
  const [on, setOn] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0, visible = true, live = true;
    const run = () => {
      window.clearInterval(timer);
      timer = 0;
      if (live && visible) timer = window.setInterval(() => setOn((n) => (n + 1) % walks.length), DELAY);
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
    <section ref={root} className="bg-[#e9e7df] px-5 py-16 text-[#23261f] sm:py-20">
      <style>{css}</style>
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#4b5d2e]">Fieldnote Walks</p>
        <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Three routes for this weekend</h2>
        <p className="mt-3 max-w-md text-base text-[#4f5446]">Each route opens a printable map with the turns, water stops and the bus home.</p>
        <ul className="mt-10 border-b border-[#c9c6b6]">
          {walks.map((w, i) => (
            <li key={w.name}>
              <a href="#" className="w8wlk-row" data-on={on === i ? "" : undefined}>
                <img className="w8wlk-thumb" src={w.img} alt={w.alt} width={92} height={70} loading="lazy" decoding="async" />
                <span className="mr-auto">
                  <span className="w8wlk-name font-serif text-2xl sm:text-4xl">{w.name}</span>
                  <span className="mt-1 block text-sm text-[#4f5446]">{w.dist}, {w.climb}</span>
                </span>
                <span className="w8wlk-fan" aria-hidden="true">
                  <span className="w8wlk-card w8wlk-back">
                    <span className="font-semibold">Route {i + 1}</span>
                    <span>{w.dist} · {w.time}</span>
                  </span>
                  <span className="w8wlk-card w8wlk-front">
                    <span className="w8wlk-mask"><img src={w.img} alt="" width={500} height={380} loading="lazy" decoding="async" /></span>
                  </span>
                </span>
                <span className="hidden text-sm text-[#4f5446] md:block">{w.time}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
