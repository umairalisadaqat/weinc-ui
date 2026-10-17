import { useEffect, useRef, useState } from "react";

const DELAY = 2000; // ms between idle reveals while nobody is pointing or tabbing
const SLATS = 5; // vertical strips the photo drops in through

const pieces = [
  { name: "Ember vases", detail: "Wood-fired, painted lotus glaze", price: "$64", glaze: "#4f2216", img: "https://images.pexels.com/photos/28867382/pexels-photo-28867382.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Hand-painted ceramic vases and lidded jars on a dark shelf" },
  { name: "Shoreline bowls", detail: "Stoneware, ink and sand glazes", price: "$38", glaze: "#3f5560", img: "https://images.pexels.com/photos/3847438/pexels-photo-3847438.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Ceramic bowls and plates in white, black and red seen from above" },
  { name: "Bisque mugs", detail: "Thrown in batches, glazed to order", price: "$26", glaze: "#6b5a45", img: "https://images.pexels.com/photos/8063803/pexels-photo-8063803.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Rows of unglazed pale clay mugs on a workshop shelf" },
];

const css = `
.w8cer-card { position: relative; display: block; overflow: hidden; aspect-ratio: 3 / 4; border-radius: 6px; color: #f6ece0; text-decoration: none; outline: none; }
.w8cer-card:focus-visible { box-shadow: 0 0 0 3px #a9482a, 0 0 0 5px #f6ece0; }
.w8cer-swatch { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 22px; }
.w8cer-slat { position: absolute; top: 0; bottom: 0; overflow: hidden; }
.w8cer-drop { position: absolute; inset: 0; transform: translateY(-101%); transition: transform .7s cubic-bezier(.7,0,.2,1); }
.w8cer-drop img { position: absolute; top: 0; height: 100%; max-width: none; object-fit: cover; }
.w8cer-cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 48px 22px 20px; background: linear-gradient(to top, rgba(20,10,6,.82), rgba(20,10,6,0)); opacity: 0; transition: opacity .4s ease .25s; }
.w8cer-card[data-on] .w8cer-drop, .w8cer-card:hover .w8cer-drop, .w8cer-card:focus-visible .w8cer-drop { transform: none; }
.w8cer-card[data-on] .w8cer-cap, .w8cer-card:hover .w8cer-cap, .w8cer-card:focus-visible .w8cer-cap { opacity: 1; }
@media (max-width: 767px), (prefers-reduced-motion: reduce) {
  .w8cer-drop { transform: none; transition: none; }
  .w8cer-cap { opacity: 1; transition: none; }
}
`;

export default function CeramicsCardsRevealedThroughFallingSlats() {
  const root = useRef<HTMLElement>(null);
  const [on, setOn] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0, visible = true, live = true;
    const run = () => {
      window.clearInterval(timer);
      timer = 0;
      if (live && visible) timer = window.setInterval(() => setOn((n) => (n + 1) % pieces.length), DELAY);
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
    <section ref={root} className="bg-[#a9482a] px-5 py-16 text-[#f6ece0] sm:py-20">
      <style>{css}</style>
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f3d9c4]">Kiln Row Pottery</p>
        <h2 className="mt-3 font-serif text-3xl sm:text-4xl">This month on the shelf</h2>
        <p className="mt-3 max-w-md text-base text-[#f3dccb]">Each card starts as its glaze colour. Point at one, or tab to it, and the piece drops in strip by strip.</p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {pieces.map((p, i) => (
            <li key={p.name}>
              <a href="#" className="w8cer-card" style={{ background: p.glaze }} data-on={on === i ? "" : undefined}>
                <span className="w8cer-swatch">
                  <span className="text-xs uppercase tracking-[0.25em] text-[#f3dccb]">Glaze {i + 1}</span>
                  <span className="font-serif text-2xl">{p.name}</span>
                </span>
                {Array.from({ length: SLATS }, (_, s) => (
                  <span key={s} className="w8cer-slat" style={{ left: `${(s * 100) / SLATS}%`, width: `${100 / SLATS}%` }}>
                    <span className="w8cer-drop" style={{ transitionDelay: `${s * 70}ms` }}>
                      <img src={p.img} alt={s === 0 ? p.alt : ""} width={600} height={800} loading="lazy" decoding="async" style={{ width: `${SLATS * 100}%`, left: `${-s * 100}%` }} />
                    </span>
                  </span>
                ))}
                <span className="w8cer-cap">
                  <span className="block font-serif text-2xl">{p.name}</span>
                  <span className="mt-1 flex justify-between text-sm text-[#f3dccb]"><span>{p.detail}</span><span>{p.price}</span></span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
