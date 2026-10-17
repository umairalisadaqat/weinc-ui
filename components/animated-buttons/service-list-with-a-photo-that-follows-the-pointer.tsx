import { useEffect, useRef } from "react";

const FOLLOW = 0.14; // how quickly the photo catches up with the pointer (0 to 1)
const DEMO_EVERY = 1900; // ms per row in the idle demo

const services = [
  { name: "Handbuilding evenings", line: "Pinch, coil and slab over six Tuesdays", price: "$210", src: "https://images.pexels.com/photos/6693557/pexels-photo-6693557.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Hands shaping a small clay pot on a wooden table among tools and bisque pieces" },
  { name: "Open studio membership", line: "Your own shelf, wheels and kiln space", price: "$95 a month", src: "https://images.pexels.com/photos/34004100/pexels-photo-34004100.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Rows of freshly thrown clay pots drying side by side in a workshop" },
  { name: "Glaze and firing service", line: "Bring finished pieces, collect them in a week", price: "From $6 a piece", src: "https://images.pexels.com/photos/8063833/pexels-photo-8063833.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Black and white photo of stacked ceramic bowls and small round pots" },
];

export default function ServiceListWithAPhotoThatFollowsThePointer() {
  const list = useRef<HTMLDivElement>(null);
  const prev = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ul = list.current, pv = prev.current;
    if (!ul || !pv) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rows = Array.from(ul.querySelectorAll<HTMLAnchorElement>("a"));
    const imgs = Array.from(pv.querySelectorAll<HTMLImageElement>("img"));
    let active = -1, tx = 0, ty = 0, x = -1, y = 0, live = false, focused = false, frame = 0, visible = true, timer = 0, n = 0;
    const show = (i: number) => {
      active = i;
      pv.toggleAttribute("data-on", i >= 0);
      imgs.forEach((im, k) => im.toggleAttribute("data-on", k === i));
    };
    // parks the photo near the right end of a row (focus and idle demo)
    const park = (i: number) => {
      const r = rows[i];
      tx = ul.clientWidth * 0.7;
      ty = r.offsetTop + r.offsetHeight / 2;
      show(i);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const b = ul.getBoundingClientRect();
      tx = e.clientX - b.left;
      ty = e.clientY - b.top;
      live = true;
    };
    const over = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const i = rows.indexOf((e.target as HTMLElement).closest("a") as HTMLAnchorElement);
      if (i >= 0) show(i);
    };
    const leave = () => { live = false; show(-1); };
    const focusIn = (e: FocusEvent) => { const i = rows.indexOf(e.target as HTMLAnchorElement); if (i >= 0) { focused = true; park(i); } };
    const focusOut = () => { focused = false; show(-1); };
    const demo = () => { if (!live && !focused) park(n++ % rows.length); };
    const tick = () => {
      if (x < 0) { x = tx; y = ty; }
      x += (tx - x) * FOLLOW;
      y += (ty - y) * FOLLOW;
      pv.style.transform = `translate(${(x - pv.offsetWidth / 2).toFixed(1)}px, ${(y - pv.offsetHeight / 2).toFixed(1)}px)`;
      frame = requestAnimationFrame(tick);
    };
    const play = () => { if (!frame && visible) { frame = requestAnimationFrame(tick); timer = window.setInterval(demo, DEMO_EVERY); } };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; window.clearInterval(timer); };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) play(); else stop(); });
    io.observe(ul);
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      ul.addEventListener("pointermove", move);
      ul.addEventListener("pointerover", over);
      ul.addEventListener("pointerleave", leave);
    }
    ul.addEventListener("focusin", focusIn);
    ul.addEventListener("focusout", focusOut);
    demo();
    play();
    return () => {
      stop();
      io.disconnect();
      ul.removeEventListener("pointermove", move);
      ul.removeEventListener("pointerover", over);
      ul.removeEventListener("pointerleave", leave);
      ul.removeEventListener("focusin", focusIn);
      ul.removeEventListener("focusout", focusOut);
    };
  }, []);

  return (
    <section className="bg-[#f3ece4] px-5 py-16 text-[#2a1f1a] sm:py-20">
      <style>{`
        .w3row-pv { will-change: transform; }
        .w3row-in { opacity: 0; transform: scale(.85) rotate(-3deg); transition: opacity .35s ease, transform .5s cubic-bezier(.2,.8,.2,1); }
        .w3row-pv[data-on] .w3row-in { opacity: 1; transform: none; }
        .w3row-in img { opacity: 0; transition: opacity .35s ease; }
        .w3row-in img[data-on] { opacity: 1; }
        .w3row-a:focus-visible { outline: 2px solid #2a1f1a; outline-offset: 2px; }
        .w3row-name { transition: transform .4s cubic-bezier(.2,.8,.2,1); }
        .w3row-a:focus-visible .w3row-name { transform: translateX(10px); }
        .w3row-thumb { display: none; }
        @media (hover: hover) and (pointer: fine) { .w3row-a:hover .w3row-name { transform: translateX(10px); } }
        /* touch and reduced motion: no follower, each row shows its own small photo */
        @media (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce) {
          .w3row-pv { display: none; }
          .w3row-thumb { display: block; }
          .w3row-name { transition: none; }
        }
      `}</style>
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a4b32]">Tidewater Clay Studio</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Ways to get your hands dirty</h2>
        <div ref={list} className="relative mt-10">
        <ul className="border-t border-[#d9cabb]">
          {services.map((s, i) => (
            <li key={s.name} className="border-b border-[#d9cabb]">
              <a href="#" className="w3row-a relative z-10 flex items-center gap-4 py-6 sm:gap-6">
                <span className="w-8 shrink-0 font-mono text-sm text-[#7a5a48]">0{i + 1}</span>
                <img src={s.src} alt="" aria-hidden="true" loading="lazy" width={64} height={48} className="w3row-thumb h-12 w-16 shrink-0 rounded-md object-cover" />
                <span className="w3row-name min-w-0 flex-1">
                  <span className="block text-xl font-semibold sm:text-2xl">{s.name}</span>
                  <span className="mt-1 block text-sm text-[#5e4a3f] sm:text-base">{s.line}</span>
                </span>
                <span className="shrink-0 text-right text-sm font-semibold sm:text-base">{s.price}</span>
              </a>
            </li>
          ))}
        </ul>
          <div ref={prev} aria-hidden="true" className="w3row-pv pointer-events-none absolute left-0 top-0 z-20 w-56 sm:w-64">
            <div className="w3row-in relative aspect-[4/3] overflow-hidden rounded-xl bg-[#d9cabb] shadow-[0_20px_40px_-12px_rgba(42,31,26,0.45)]">
              {services.map((s) => (
                <img key={s.name} src={s.src} alt={s.alt} width={256} height={192} className="absolute inset-0 h-full w-full object-cover" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
