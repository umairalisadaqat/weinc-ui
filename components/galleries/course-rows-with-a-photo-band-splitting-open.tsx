import { useEffect, useRef, useState } from "react";

const DELAY = 1900; // ms between idle reveals while nobody is pointing or tabbing

const courses = [
  { name: "Dinghy sailing", when: "Saturdays, April to September", img: "https://images.pexels.com/photos/3686785/pexels-photo-3686785.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A small sailing boat with a red and yellow sail on a calm grey sea" },
  { name: "Lake kayaking", when: "Weekday evenings", img: "https://images.pexels.com/photos/5704472/pexels-photo-5704472.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A kayaker paddling across a dark lake between wooded hills" },
  { name: "Rowing for two", when: "Sunday mornings", img: "https://images.pexels.com/photos/5022032/pexels-photo-5022032.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "An empty white rowing boat with blue seats moored on still blue water" },
  { name: "Paddleboarding", when: "Daily in July and August", img: "https://images.pexels.com/photos/7426234/pexels-photo-7426234.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A paddleboarder seen from above on clear turquoise water" },
];

const css = `
.w8sea-row { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 34px 20px; border-top: 1px solid #2a3a5c; color: #eef2f8; text-decoration: none; outline: none; isolation: isolate; }
.w8sea-row:focus-visible { outline: 2px solid #f0c987; outline-offset: -2px; }
.w8sea-half { position: absolute; left: 0; right: 0; height: 50%; overflow: hidden; z-index: -1; }
.w8sea-top { top: 0; } .w8sea-bot { bottom: 0; }
.w8sea-slide { position: absolute; inset: 0; transition: transform .75s cubic-bezier(.7,0,.2,1); }
.w8sea-top .w8sea-slide { transform: translateY(-201%); } .w8sea-bot .w8sea-slide { transform: translateY(201%); }
.w8sea-slide img { position: absolute; left: 0; width: 100%; height: 200%; max-width: none; object-fit: cover; }
.w8sea-top img { top: 0; } .w8sea-bot img { top: -100%; }
.w8sea-shade { position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(10,18,36,.78), rgba(10,18,36,.25)); opacity: 0; transition: opacity .5s ease .15s; }
.w8sea-name { display: inline-block; transition: transform .6s cubic-bezier(.2,.8,.2,1); }
.w8sea-row[data-on] .w8sea-slide, .w8sea-row:hover .w8sea-slide, .w8sea-row:focus-visible .w8sea-slide { transform: none; }
.w8sea-row[data-on] .w8sea-shade, .w8sea-row:hover .w8sea-shade, .w8sea-row:focus-visible .w8sea-shade { opacity: 1; }
.w8sea-row[data-on] .w8sea-name, .w8sea-row:hover .w8sea-name, .w8sea-row:focus-visible .w8sea-name { transform: translateX(12px); }
.w8sea-thumb { display: none; }
@media (max-width: 767px), (prefers-reduced-motion: reduce) {
  .w8sea-half, .w8sea-shade { display: none; }
  .w8sea-name { transform: none !important; transition: none; }
  .w8sea-row { justify-content: flex-start; padding: 16px 0; }
  .w8sea-thumb { display: block; flex: none; width: 96px; height: 64px; object-fit: cover; border-radius: 6px; }
}
`;

export default function CourseRowsWithAPhotoBandSplittingOpen() {
  const root = useRef<HTMLElement>(null);
  const [on, setOn] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0, visible = true, live = true;
    const run = () => {
      window.clearInterval(timer);
      timer = 0;
      if (live && visible) timer = window.setInterval(() => setOn((n) => (n + 1) % courses.length), DELAY);
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
    <section ref={root} className="bg-[#101b33] px-5 py-16 text-[#eef2f8] sm:py-20">
      <style>{css}</style>
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f0c987]">Saltmarsh Boat Club</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Pick a way onto the water</h2>
        <ul className="mt-10 border-b border-[#2a3a5c]">
          {courses.map((c, i) => (
            <li key={c.name}>
              <a href="#" className="w8sea-row" data-on={on === i ? "" : undefined}>
                <span className="w8sea-half w8sea-top" aria-hidden="true"><span className="w8sea-slide"><img src={c.img} alt="" width={1200} height={800} loading="lazy" decoding="async" /></span></span>
                <span className="w8sea-half w8sea-bot" aria-hidden="true"><span className="w8sea-slide"><img src={c.img} alt="" width={1200} height={800} loading="lazy" decoding="async" /></span></span>
                <span className="w8sea-shade" aria-hidden="true" />
                <img className="w8sea-thumb" src={c.img} alt={c.alt} width={96} height={64} loading="lazy" decoding="async" />
                <span className="mr-auto">
                  <span className="w8sea-name text-2xl font-semibold tracking-tight sm:text-4xl">{c.name}</span>
                  <span className="block text-sm text-[#c9d3e3] md:hidden">{c.when}</span>
                </span>
                <span className="hidden text-sm text-[#c9d3e3] md:block">{c.when}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
