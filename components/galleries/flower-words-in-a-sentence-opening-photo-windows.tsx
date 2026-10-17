import { useEffect, useRef, useState } from "react";

const DELAY = 1900; // ms between idle reveals while nobody is pointing or tabbing

const stems = [
  { word: "peonies", img: "https://images.pexels.com/photos/36399727/pexels-photo-36399727.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "A bunch of pink peonies wrapped in black paper" },
  { word: "eucalyptus", img: "https://images.pexels.com/photos/1026237/pexels-photo-1026237.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Round silver-green eucalyptus leaves on their branches" },
  { word: "ranunculus", img: "https://images.pexels.com/photos/7409746/pexels-photo-7409746.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Pale pink ranunculus gathered in a grey metal pail" },
];

const css = `
.w8flo-hold { position: relative; display: inline-block; }
.w8flo-word { color: #f3ead7; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 6px; text-decoration-color: #c9a96a; font-style: italic; border-radius: 4px; outline: none; }
.w8flo-word:focus-visible { outline: 2px solid #c9a96a; outline-offset: 4px; }
.w8flo-pop { position: absolute; z-index: 3; left: 50%; bottom: calc(100% + 12px); width: 176px; margin-left: -88px; padding: 6px; border-radius: 12px; background: #f3ead7; opacity: 0; transform: translateY(14px) scale(.94); transform-origin: 50% 100%; transition: opacity .3s ease, transform .55s cubic-bezier(.2,.9,.25,1.15); pointer-events: none; box-shadow: 0 24px 40px -18px rgba(0,0,0,.6); }
.w8flo-mask { display: block; overflow: hidden; aspect-ratio: 4 / 3; border-radius: 8px; background: #2c4236; }
.w8flo-img { display: block; width: 100%; height: 100%; object-fit: cover; transform: translateY(100%) scale(1.2); transition: transform .7s cubic-bezier(.2,.8,.2,1); }
.w8flo-hold[data-on] .w8flo-pop, .w8flo-hold:hover .w8flo-pop, .w8flo-hold:focus-within .w8flo-pop { opacity: 1; transform: none; }
.w8flo-hold[data-on] .w8flo-img, .w8flo-hold:hover .w8flo-img, .w8flo-hold:focus-within .w8flo-img { transform: none; }
.w8flo-strip { display: none; }
@media (max-width: 767px) {
  .w8flo-pop { display: none; }
  .w8flo-strip { display: grid; }
}
@media (prefers-reduced-motion: reduce) {
  .w8flo-pop { display: none; }
  .w8flo-strip { display: grid; }
}
`;

export default function FlowerWordsInASentenceOpeningPhotoWindows() {
  const root = useRef<HTMLElement>(null);
  const [on, setOn] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0, visible = true, live = true;
    const run = () => {
      window.clearInterval(timer);
      timer = 0;
      if (live && visible) timer = window.setInterval(() => setOn((n) => (n + 1) % stems.length), DELAY);
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

  const word = (i: number) => (
    <span className="w8flo-hold" data-on={on === i ? "" : undefined}>
      <a href="#" className="w8flo-word">{stems[i].word}</a>
      <span className="w8flo-pop" aria-hidden="true">
        <span className="w8flo-mask">
          <img className="w8flo-img" src={stems[i].img} alt="" width={400} height={300} loading="lazy" decoding="async" />
        </span>
      </span>
    </span>
  );

  return (
    <section ref={root} className="bg-[#1f2f27] px-5 pb-16 pt-16 text-[#e6dcc6] md:pt-48">
      <style>{css}</style>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a96a]">Mossgate Flowers, Tuesday stock</p>
        <h2 className="mt-5 font-serif text-3xl leading-snug sm:text-5xl sm:leading-tight">
          This week the counter holds {word(0)} wrapped in black paper, {word(1)} cut by the bunch, and {word(2)} in tin pails.
        </h2>
        <div className="w8flo-strip mt-8 grid-cols-3 gap-3">
          {stems.map((s) => (
            <figure key={s.word}>
              <img className="aspect-[4/3] w-full rounded-lg object-cover" src={s.img} alt={s.alt} width={400} height={300} loading="lazy" decoding="async" />
              <figcaption className="mt-2 text-sm text-[#cfc4ab]">{s.word}</figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-10 max-w-md text-base text-[#cfc4ab]">Each name links to the stems on the counter and the colours they come in.</p>
      </div>
    </section>
  );
}
