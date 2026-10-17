import { useEffect, useRef } from "react";

const DELAY = 2000; // ms between idle switches while nobody is pointing or tabbing
const PUSH = 25; // % the old photo drifts while the new one covers it

const projects = [
  { name: "Linden Court House", kind: "Private house", year: "2025", img: "https://images.pexels.com/photos/13041129/pexels-photo-13041129.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "A pale concrete house with a tall glass wall beside a planted garden path" },
  { name: "Birch Hollow Cabin", kind: "Holiday cabin", year: "2024", img: "https://images.pexels.com/photos/10849919/pexels-photo-10849919.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "A small timber cabin with an open porch standing among birch trees" },
  { name: "Westgate Reading Room", kind: "Public library", year: "2023", img: "https://images.pexels.com/photos/35378714/pexels-photo-35378714.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "A library hall with long curved wooden bookshelves under warm light" },
  { name: "Quarry Lane Flats", kind: "Housing", year: "2022", img: "https://images.pexels.com/photos/34916272/pexels-photo-34916272.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "A grey concrete apartment block with an outdoor steel staircase and trees" },
];

const css = `
.w8arc-frame { position: relative; overflow: hidden; aspect-ratio: 4 / 5; border-radius: 4px; background: #2a2c30; }
.w8arc-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: translateY(100%); transition: transform .8s cubic-bezier(.7,0,.2,1); }
.w8arc-img:first-child { transform: none; z-index: 2; }
.w8arc-img[data-z="2"] { z-index: 2; } .w8arc-img[data-z="1"] { z-index: 1; } .w8arc-img[data-z="0"] { z-index: 0; }
.w8arc-row { display: grid; grid-template-columns: 2.5rem 1fr auto; align-items: baseline; gap: 12px; padding: 18px 8px; border-top: 1px solid #3a3d42; color: #a7abb2; text-decoration: none; outline: none; transition: color .3s; }
.w8arc-row .w8arc-name { display: inline-block; transition: transform .5s cubic-bezier(.2,.8,.2,1); }
.w8arc-row[data-on] { color: #f2f0eb; }
.w8arc-row[data-on] .w8arc-name { transform: translateX(8px); }
.w8arc-row:focus-visible { outline: 2px solid #e8c37a; outline-offset: 2px; border-radius: 4px; }
.w8arc-thumb { display: none; }
@media (max-width: 767px) {
  .w8arc-side { display: none; }
  .w8arc-row { grid-template-columns: 72px 1fr; color: #f2f0eb; align-items: center; }
  .w8arc-row .w8arc-num, .w8arc-row .w8arc-year { display: none; }
  .w8arc-row .w8arc-name { transform: none !important; }
  .w8arc-thumb { display: block; width: 72px; height: 90px; object-fit: cover; border-radius: 3px; }
}
@media (prefers-reduced-motion: reduce) { .w8arc-img, .w8arc-name, .w8arc-row { transition: none; } }
`;

export default function ProjectIndexWithOneFrameThatWipesByDirection() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const imgs = Array.from(el.querySelectorAll<HTMLImageElement>(".w8arc-img"));
    const rows = Array.from(el.querySelectorAll<HTMLAnchorElement>(".w8arc-row"));
    const count = el.querySelector(".w8arc-count");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cur = 0, timer = 0, visible = true, live = !still;
    const show = (n: number) => {
      if (n === cur) return;
      const dir = n > cur ? 1 : -1, inc = imgs[n], out = imgs[cur];
      imgs.forEach((im) => { im.dataset.z = "0"; });
      out.dataset.z = "1";
      inc.dataset.z = "2";
      inc.style.transition = "none";
      inc.style.transform = `translateY(${dir * 100}%)`;
      void inc.offsetWidth; // place the new photo outside the frame before it slides in
      inc.style.transition = "";
      inc.style.transform = "none";
      out.style.transform = `translateY(${-dir * PUSH}%)`;
      rows.forEach((r, k) => r.toggleAttribute("data-on", k === n));
      if (count) count.textContent = `0${n + 1} / 0${imgs.length}`;
      cur = n;
    };
    imgs[0].style.transform = "none";
    imgs[0].dataset.z = "2";
    const run = () => {
      window.clearInterval(timer);
      timer = 0;
      if (live && visible) timer = window.setInterval(() => show((cur + 1) % imgs.length), DELAY);
    };
    const stop = () => { live = false; run(); };
    const enter = (e: PointerEvent) => { if (e.pointerType === "mouse") stop(); };
    const pick = (e: Event) => { const i = rows.indexOf(e.currentTarget as HTMLAnchorElement); stop(); show(i); };
    rows.forEach((r) => { r.addEventListener("pointerenter", pick); r.addEventListener("focus", pick); });
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; run(); });
    io.observe(el);
    el.addEventListener("pointerenter", enter);
    run();
    return () => {
      window.clearInterval(timer);
      io.disconnect();
      el.removeEventListener("pointerenter", enter);
      rows.forEach((r) => { r.removeEventListener("pointerenter", pick); r.removeEventListener("focus", pick); });
    };
  }, []);

  return (
    <section ref={root} className="bg-[#1c1d20] px-5 py-16 text-[#f2f0eb] sm:py-20">
      <style>{css}</style>
      <div className="mx-auto grid max-w-5xl items-start gap-12 md:grid-cols-[1fr_340px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#e8c37a]">Okafor Lund Studio</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Selected buildings</h2>
          <p className="mt-3 max-w-md text-base text-[#b9bcc2]">Four recent projects, from a one-room cabin to a public library. Each name leads to drawings and notes.</p>
          <ul className="mt-10 border-b border-[#3a3d42]">
            {projects.map((p, i) => (
              <li key={p.name}>
                <a href="#" className="w8arc-row" data-on={i === 0 ? "" : undefined}>
                  <span className="w8arc-num text-sm tabular-nums text-[#8d9198]">0{i + 1}</span>
                  <img className="w8arc-thumb" src={p.img} alt="" width={72} height={90} loading="lazy" decoding="async" />
                  <span>
                    <span className="w8arc-name text-xl font-medium sm:text-2xl">{p.name}</span>
                    <span className="block text-sm text-[#a7abb2] md:hidden">{p.kind}, {p.year}</span>
                  </span>
                  <span className="w8arc-year text-sm text-[#a7abb2]">{p.kind}, {p.year}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="w8arc-side md:sticky md:top-8">
          <div className="w8arc-frame">
            {projects.map((p) => (
              <img key={p.name} className="w8arc-img" src={p.img} alt={p.alt} width={800} height={1000} loading="lazy" decoding="async" />
            ))}
          </div>
          <p className="w8arc-count mt-3 text-right text-sm tabular-nums text-[#8d9198]" aria-hidden="true">01 / 04</p>
        </div>
      </div>
    </section>
  );
}
