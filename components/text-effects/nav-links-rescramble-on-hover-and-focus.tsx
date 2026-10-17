import { useEffect, useRef } from "react";

const LINKS = ["Projects", "Studio", "Journal", "Process", "Contact"];
const WORK = ["Hollin House, 2025", "Brae Studio, 2024", "Marl Lane Barn, 2024"];
const GLYPHS = "ABCDEFHKLMNPRSTVXZ0123456789/+#"; // characters shown while scrambling
const STEP = 38; // ms between one letter settling and the next
const LEAD = 160; // ms of noise before the first letter settles
const IDLE = 2600; // ms between demo scrambles until a visitor arrives

export default function NavLinksRescrambleOnHoverAndFocus() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>(".w3nvs-links a"));
    const frames = new Map<HTMLAnchorElement, number>();
    const scramble = (a: HTMLAnchorElement, delay = 0) => {
      const out = a.firstElementChild as HTMLElement;
      const text = a.getAttribute("aria-label") || "";
      const t0 = performance.now() + delay;
      cancelAnimationFrame(frames.get(a) || 0);
      const frame = (now: number) => {
        const t = now - t0;
        let s = "";
        let done = true;
        for (let i = 0; i < text.length; i++) {
          if (t > LEAD + i * STEP) s += text[i];
          else {
            done = false;
            s += t < 0 && delay ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
        }
        out.textContent = s;
        frames.set(a, done ? 0 : requestAnimationFrame(frame));
      };
      frame(t0);
    };
    let idle = 0;
    let n = 0;
    let live = false;
    let seen = false;
    const clearDemo = () => links.forEach((l) => l.removeAttribute("data-demo"));
    const demo = () => {
      clearDemo();
      const a = links[n++ % links.length];
      a.setAttribute("data-demo", "");
      scramble(a);
    };
    const startDemo = () => {
      const step = () => { demo(); idle = window.setTimeout(step, IDLE); };
      idle = window.setTimeout(step, 1800);
    };
    const stopDemo = () => { live = true; clearTimeout(idle); clearDemo(); };
    const offs = links.map((a) => {
      const on = () => { stopDemo(); scramble(a); };
      a.addEventListener("pointerenter", on);
      a.addEventListener("focus", on);
      return () => { a.removeEventListener("pointerenter", on); a.removeEventListener("focus", on); };
    });
    const io = new IntersectionObserver(([e]) => {
      clearTimeout(idle);
      if (!e.isIntersecting) return;
      if (!seen) { seen = true; links.forEach((a, i) => scramble(a, i * 50)); }
      if (!live) startDemo();
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(idle);
      offs.forEach((f) => f());
      frames.forEach((f) => cancelAnimationFrame(f));
    };
  }, []);

  return (
    <section ref={root} className="w3nvs bg-[#f3ede2] px-5 pb-24 text-[#1f1b16]">
      <style>{`
        .w3nvs-links a { font: 500 13px/1 ui-monospace, "SF Mono", Menlo, Consolas, monospace; letter-spacing: .12em; white-space: pre; }
        .w3nvs-links a::after { content: ""; position: absolute; left: 12px; right: 12px; bottom: 10px; height: 1px; background: #8f4528;
          transform: scaleX(0); transform-origin: left; transition: transform .35s ease; }
        .w3nvs-links a:hover::after, .w3nvs-links a:focus-visible::after, .w3nvs-links a[data-demo]::after { transform: scaleX(1); }
        .w3nvs a:focus-visible { outline: 2px solid #8f4528; outline-offset: 2px; border-radius: 4px; }
        .w3nvs-list a { letter-spacing: .06em; }
        .w3nvs-list a::after { left: 0; right: auto; width: 2.5em; bottom: 14px; }
        @media (prefers-reduced-motion: reduce) { .w3nvs-links a::after { transition: none; } }
      `}</style>
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-[#d8cdbb] py-5">
        <a href="#" className="inline-flex min-h-[40px] items-center text-[17px] font-semibold tracking-tight">Ostrand Atelier</a>
        <nav aria-label="Main">
          <ul className="w3nvs-links -mx-3 flex flex-wrap gap-x-1">
            {LINKS.map((l) => (
              <li key={l}>
                <a href="#" aria-label={l} className="relative inline-flex min-h-[44px] items-center px-3 uppercase">
                  <span aria-hidden="true">{l}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <div className="mx-auto grid max-w-6xl gap-14 pt-[72px] min-[900px]:grid-cols-[1fr_300px] min-[900px]:items-end">
        <div>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-[#6b5e4d]">Architecture and interiors</p>
        <h2 className="mt-[18px] max-w-[40rem] font-serif text-[clamp(34px,5.4vw,60px)] font-normal leading-[1.08] tracking-[-0.02em]">
          Houses drawn around the light of one plot.
        </h2>
        <p className="mt-[22px] max-w-[34rem] text-[17px] leading-relaxed text-[#4e4438]">
          A four-person practice working on homes, small studios and careful renovations, from the first site walk to the last coat of lime wash.
        </p>
        <a href="#" className="mt-8 inline-flex min-h-[48px] items-center rounded-full bg-[#1f1b16] px-6 text-[15px] font-semibold text-[#f3ede2] hover:bg-[#8f4528]">
          See recent houses
        </a>
        </div>
        <div>
          <h3 className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-[#6b5e4d]">Recent work</h3>
          <ul className="w3nvs-links w3nvs-list border-t border-[#d8cdbb]">
            {WORK.map((w) => (
              <li key={w} className="border-b border-[#d8cdbb]">
                <a href="#" aria-label={w} className="relative flex min-h-[56px] items-center uppercase">
                  <span aria-hidden="true">{w}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
