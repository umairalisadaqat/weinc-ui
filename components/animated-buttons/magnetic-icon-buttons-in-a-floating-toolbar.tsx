import { useEffect, useRef } from "react";

const PULL = 0.4; // share of the pointer distance each icon moves toward it
const RADIUS = 60; // px from an icon's centre where the pull starts

const tools = [
  { label: "Notes", d: "M5 4h10l4 4v12H5z M15 4v4h4 M8 12h8 M8 16h6" },
  { label: "Search", d: "M11 4a7 7 0 1 1 0 14a7 7 0 0 1 0-14z M16 16l4 4" },
  { label: "Calendar", d: "M4 6h16v14H4z M4 10h16 M8 3v5 M16 3v5" },
  { label: "Inbox", d: "M4 13l3-8h10l3 8v6H4z M4 13h5l1 2h4l1-2h5" },
  { label: "Settings", d: "M12 9a3 3 0 1 1 0 6a3 3 0 0 1 0-6z M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M5.6 18.4l2.1-2.1 M16.3 7.7l2.1-2.1" },
];

export default function MagneticIconButtonsInAFloatingToolbar() {
  const bar = useRef<HTMLElement>(null);
  const btns = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const list = btns.current.filter(Boolean) as HTMLAnchorElement[];
    const pos = list.map(() => ({ x: 0, y: 0 }));
    let px = 0, py = 0, live = false, frame = 0, visible = true;
    const move = (e: PointerEvent) => { if (e.pointerType === "mouse") { live = true; px = e.clientX; py = e.clientY; } };
    const leave = () => { live = false; };
    const tick = (now: number) => {
      const b = el.getBoundingClientRect();
      if (!live && el.contains(document.activeElement)) { px = -9999; py = -9999; }
      else if (!live) {
        // idle demo: a pretend pointer glides along the bar
        px = b.left + b.width / 2 + Math.sin(now / 1600) * b.width * 0.42;
        py = b.top + b.height / 2 - 10;
      }
      let best = -1, bestD = RADIUS * 0.55;
      list.forEach((btn, i) => {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2 - pos[i].x, cy = r.top + r.height / 2 - pos[i].y;
        const dx = px - cx, dy = py - cy;
        const near = Math.hypot(dx, dy) < RADIUS;
        pos[i].x += ((near ? dx * PULL : 0) - pos[i].x) * 0.15;
        pos[i].y += ((near ? dy * PULL : 0) - pos[i].y) * 0.15;
        btn.style.transform = `translate(${pos[i].x.toFixed(2)}px, ${pos[i].y.toFixed(2)}px)`;
        if (Math.hypot(dx, dy) < bestD) { bestD = Math.hypot(dx, dy); best = i; }
      });
      list.forEach((btn, i) => btn.toggleAttribute("data-near", i === best));
      frame = requestAnimationFrame(tick);
    };
    const play = () => { if (!frame && visible) frame = requestAnimationFrame(tick); };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) play(); else stop(); });
    io.observe(el);
    if (fine) { el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave); }
    play();
    return () => {
      stop();
      io.disconnect();
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <section className="bg-[#e9edf1] px-5 py-16 sm:py-20">
      <style>{`
        .w3nav-btn { will-change: transform; }
        .w3nav-bg, .w3nav-tip { opacity: 0; transition: opacity .25s ease, transform .25s ease; }
        .w3nav-tip { transform: translate(-50%, 6px); }
        .w3nav-btn[data-near] .w3nav-bg, .w3nav-btn:focus-visible .w3nav-bg { opacity: 1; }
        .w3nav-btn[data-near] .w3nav-tip, .w3nav-btn:focus-visible .w3nav-tip { opacity: 1; transform: translate(-50%, 0); }
        .w3nav-btn:focus-visible { outline: 2px solid #1e293b; outline-offset: 3px; }
        @media (hover: hover) and (pointer: fine) {
          .w3nav-btn:hover .w3nav-bg { opacity: 1; }
          .w3nav-btn:hover .w3nav-tip { opacity: 1; transform: translate(-50%, 0); }
        }
        @media (prefers-reduced-motion: reduce) { .w3nav-btn { transform: none !important; will-change: auto; } .w3nav-bg, .w3nav-tip { transition: none; } }
      `}</style>
      <div className="mx-auto max-w-xl rounded-3xl bg-white px-6 pb-8 pt-8 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_12px_40px_rgba(15,23,42,0.08)] sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Thursday, 14 March</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Site visit, Larch Street</h2>
        <p className="mt-3 text-base leading-relaxed text-slate-600">Measure the back stairs again before ordering treads. Ask Mira about the lead time on the oak.</p>
        <div className="mt-6 space-y-2" aria-hidden="true">
          <div className="h-2.5 w-11/12 rounded-full bg-slate-100" />
          <div className="h-2.5 w-3/4 rounded-full bg-slate-100" />
        </div>
        <nav ref={bar} aria-label="Workspace" className="mx-auto mt-12 flex w-fit items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-2 sm:gap-2">
          {tools.map((t, i) => (
            <a
              key={t.label}
              ref={(n) => { btns.current[i] = n; }}
              href="#"
              aria-label={t.label}
              aria-current={i === 0 ? "page" : undefined}
              className="w3nav-btn relative flex h-12 w-12 items-center justify-center rounded-full text-slate-700"
            >
              <span aria-hidden="true" className="w3nav-bg absolute inset-0 rounded-full bg-white shadow-[0_4px_14px_rgba(15,23,42,0.14)]" />
              {i === 0 && <span aria-hidden="true" className="absolute bottom-1 h-1 w-1 rounded-full bg-slate-900" />}
              <svg aria-hidden="true" viewBox="0 0 24 24" className="relative h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={t.d} /></svg>
              <span aria-hidden="true" className="w3nav-tip pointer-events-none absolute -top-9 left-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white">{t.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
