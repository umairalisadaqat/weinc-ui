import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: "w6anc-rooms", label: "Reading rooms", title: "The reading rooms stayed open late", text: "Thursday hours ran to nine all year, and the long table by the west window became the quiet study spot for the sixth form across the road. We added lamps, not rules." },
  { id: "w6anc-van", label: "Mobile library", title: "The van found three new stops", text: "The mobile library now parks at the ferry landing, the care home on Fell Road and the allotments on Saturday mornings, where most loans turned out to be seed catalogues." },
  { id: "w6anc-archive", label: "Archive", title: "The parish maps came home", text: "A volunteer team cleaned, flattened and boxed the old parish maps. They can be seen by appointment in the archive room, and the most asked-for sheets now hang in the stairwell." },
  { id: "w6anc-accounts", label: "Accounts", title: "Where the money went", text: "Most of the year's spending went on staff hours and new stock. The full accounts, with every grant listed by name, are in the downloadable report at the foot of this page." },
];

export default function AnchorLinkNavigationWithMotionSafeSmoothScroll() {
  const box = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = el.getBoundingClientRect().top + 90;
      let cur = SECTIONS[0].id;
      SECTIONS.forEach((s) => {
        const n = el.querySelector(`#${s.id}`);
        if (n && n.getBoundingClientRect().top <= top) cur = s.id;
      });
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) cur = SECTIONS[SECTIONS.length - 1].id;
      setActive(cur);
      el.classList.toggle("w6anc-moved", el.scrollTop > 8);
    };
    const req = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    el.addEventListener("scroll", req, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", req);
    };
  }, []);

  return (
    <div ref={box} className="w6anc relative h-[600px] overflow-y-auto overscroll-contain bg-white text-slate-900">
      <style>{`
        @media (prefers-reduced-motion: no-preference) { .w6anc { scroll-behavior: smooth; } }
        .w6anc section { scroll-margin-top: 76px; }
        .w6anc-hint { transition: opacity .5s ease; }
        .w6anc-moved .w6anc-hint { opacity: 0; }
      `}</style>
      <header className="px-5 pb-6 pt-10 sm:px-10">
        <div className="mx-auto flex max-w-4xl items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Northcote Library Trust</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">A year on the shelves</h2>
          </div>
          <span className="w6anc-hint mt-1 shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600" aria-hidden="true">Scroll inside</span>
        </div>
      </header>
      <nav aria-label="Report sections" className="sticky top-0 z-10 border-y border-slate-200 bg-white/95 backdrop-blur">
        <ul className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-3 py-2 sm:px-8">
          {SECTIONS.map((s) => (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? "location" : undefined}
                className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${active === s.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mx-auto max-w-4xl px-5 pb-24 sm:px-10">
        {SECTIONS.map((s, i) => (
          <section key={s.id} id={s.id} tabIndex={-1} className="grid gap-6 border-b border-slate-200 py-12 outline-none last:border-0">
            <div>
              <p className="text-sm font-medium tabular-nums text-slate-600">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-3 max-w-prose text-base leading-relaxed text-slate-600">{s.text}</p>
            </div>
          </section>
        ))}
        <a href="#" className="mt-8 inline-flex h-11 items-center rounded-lg border border-slate-300 px-5 text-sm font-semibold hover:border-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900">Download the full report</a>
      </div>
    </div>
  );
}
