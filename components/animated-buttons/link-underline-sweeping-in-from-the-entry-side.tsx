import { useEffect, useRef } from "react";

const DEMO_EVERY = 1500; // ms between idle demo steps
const groups = [
  { title: "Visit", links: ["Opening hours", "Find the shop", "Reading room"] },
  { title: "Read", links: ["New this month", "Staff shelves", "Poetry corner"] },
  { title: "Join", links: ["Book club", "Gift cards", "Write to us"] },
];

export default function LinkUnderlineSweepingInFromTheEntrySide() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>(".w3und-a"));
    const side = (a: HTMLElement, e: PointerEvent) => {
      const r = a.getBoundingClientRect();
      return e.clientX < r.left + r.width / 2 ? "left" : "right";
    };
    const enter = (e: PointerEvent) => {
      const a = e.currentTarget as HTMLElement;
      a.style.setProperty("--w3und-o", side(a, e));
      a.setAttribute("data-on", "");
    };
    const leave = (e: PointerEvent) => {
      const a = e.currentTarget as HTMLElement;
      a.style.setProperty("--w3und-o", side(a, e));
      a.removeAttribute("data-on");
    };
    links.forEach((a) => { a.addEventListener("pointerenter", enter); a.addEventListener("pointerleave", leave); });
    // idle demo: walks through the links, sweeping in from the left and out to the right
    let i = 0, timer = 0, busy = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = () => {
      if (busy) return;
      const prev = links[(i + links.length - 1) % links.length];
      prev.style.setProperty("--w3und-o", "right");
      prev.removeAttribute("data-on");
      links[i].style.setProperty("--w3und-o", "left");
      links[i].setAttribute("data-on", "");
      i = (i + 1) % links.length;
    };
    const clear = () => { links.forEach((a) => a.removeAttribute("data-on")); };
    const hold = () => { if (!busy) { busy = true; clear(); } };
    const resume = () => { busy = false; };
    el.addEventListener("pointerenter", hold);
    el.addEventListener("pointerleave", resume);
    el.addEventListener("focusin", hold);
    el.addEventListener("focusout", resume);
    const io = new IntersectionObserver(([en]) => {
      window.clearInterval(timer);
      if (en.isIntersecting && !reduce) { step(); timer = window.setInterval(step, DEMO_EVERY); }
    });
    io.observe(el);
    return () => {
      window.clearInterval(timer);
      io.disconnect();
      links.forEach((a) => { a.removeEventListener("pointerenter", enter); a.removeEventListener("pointerleave", leave); });
      el.removeEventListener("pointerenter", hold);
      el.removeEventListener("pointerleave", resume);
      el.removeEventListener("focusin", hold);
      el.removeEventListener("focusout", resume);
    };
  }, []);

  return (
    <footer ref={root} className="bg-[#f4efe6] px-5 py-16 text-[#2b2620] sm:px-10 sm:py-20">
      <style>{`
        .w3und-a { position: relative; display: inline-block; padding: 6px 0; }
        .w3und-a::after { content: ""; position: absolute; left: 0; right: 0; bottom: 4px; height: 2px; background: #9a3b25; transform: scaleX(0); transform-origin: var(--w3und-o, left); transition: transform .45s cubic-bezier(.65,0,.35,1); }
        .w3und-a[data-on]::after, .w3und-a:focus-visible::after { transform: scaleX(1); }
        .w3und-a:focus-visible { outline: 2px solid #2b2620; outline-offset: 4px; border-radius: 2px; }
        @media (hover: hover) and (pointer: fine) { .w3und-a:hover::after { transform: scaleX(1); } }
        @media (prefers-reduced-motion: reduce) { .w3und-a::after { transition: none; } }
      `}</style>
      <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-[1.2fr_2fr]">
        <div>
          <h2 className="font-serif text-3xl leading-tight">Marrow &amp; Quill Books</h2>
          <p className="mt-4 max-w-xs text-base leading-relaxed text-[#5b5248]">A small shop of new and secondhand books on Ferry Lane. Kettle always on.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5f52]">{g.title}</h3>
              <ul className="mt-4 space-y-2">
                {g.links.map((l) => (
                  <li key={l}><a href="#" className="w3und-a text-lg">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
