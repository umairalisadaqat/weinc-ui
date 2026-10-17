import { useEffect, useRef } from "react";

const SAILINGS = [
  ["09:10", "Skerrow Isle", "Boarding"],
  ["09:45", "Port Annet", "On time"],
  ["10:20", "Holm Bay", "On time"],
  ["11:05", "Calder Quay", "Delayed"],
  ["11:40", "Linn Point", "On time"],
  ["12:15", "Easter Ness", "On time"],
];
const WIDTHS = [5, 12, 8]; // letter tiles per column
const ROWS = 4;
const GLYPHS = "ABCDEFGHKLMNPRSTVWXYZ0123456789";
const STEP = 40; // ms between one tile settling and the next
const LEAD = 220; // ms of noise before the first tile settles
const ADVANCE = 6000; // ms between automatic board updates until someone presses the button

type Field = { sr: HTMLElement; cells: HTMLElement[]; f: number };

export default function FerryDepartureBoardRowsScrambleIntoPlace() {
  const root = useRef<HTMLElement>(null);
  const advance = useRef<() => void>(() => {});

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = reduce ? 0 : STEP;
    const lead = reduce ? 0 : LEAD;
    const rows = Array.from(el.querySelectorAll("tbody tr"));
    const fields: Field[] = [];
    rows.forEach((tr) =>
      tr.querySelectorAll("td").forEach((td) =>
        fields.push({ sr: td.firstElementChild as HTMLElement, cells: Array.from(td.querySelectorAll<HTMLElement>(".w3dbd-tiles span")), f: 0 }),
      ),
    );
    let k = 0;
    let auto = 0;
    let live = false;
    let seen = false;
    const set = (fd: Field, text: string, delay: number) => {
      const to = (text + "            ").slice(0, fd.cells.length).toUpperCase();
      const t0 = performance.now() + delay;
      fd.sr.textContent = text;
      cancelAnimationFrame(fd.f);
      const frame = (now: number) => {
        const t = now - t0;
        let busy = false;
        fd.cells.forEach((c, i) => {
          if (c.textContent === to[i] && !c.hasAttribute("data-on")) return;
          if (t > lead + i * step) { c.textContent = to[i]; c.removeAttribute("data-on"); }
          else if (t > 0) { busy = true; c.setAttribute("data-on", ""); c.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0]; }
          else busy = true;
        });
        fd.f = busy ? requestAnimationFrame(frame) : 0;
      };
      frame(t0);
    };
    const show = () =>
      fields.forEach((fd, n) => {
        const row = (n / 3) | 0;
        set(fd, SAILINGS[(k + row) % SAILINGS.length][n % 3], row * 120 + (n % 3) * 60);
      });
    const next = () => { k = (k + 1) % SAILINGS.length; show(); };
    advance.current = () => { live = true; clearInterval(auto); next(); };
    const offs = rows.map((tr, row) => {
      const flip = () => {
        if (reduce) return;
        fields.slice(row * 3, row * 3 + 3).forEach((fd) => {
          fd.cells.forEach((c) => { c.textContent = ""; });
          set(fd, fd.sr.textContent || "", 0);
        });
      };
      tr.addEventListener("pointerenter", flip);
      return () => tr.removeEventListener("pointerenter", flip);
    });
    const io = new IntersectionObserver(([e]) => {
      clearInterval(auto);
      if (!e.isIntersecting) return;
      if (!seen) { seen = true; show(); }
      if (!live && !reduce) auto = window.setInterval(next, ADVANCE);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(auto);
      offs.forEach((f) => f());
      fields.forEach((fd) => cancelAnimationFrame(fd.f));
    };
  }, []);

  return (
    <section ref={root} className="w3dbd bg-[#0e1a2b] px-5 py-[72px] text-[#e8edf4]">
      <style>{`
        .w3dbd { background: radial-gradient(120% 80% at 50% 0%, #17283f, #0e1a2b 70%); }
        .w3dbd-board { font-size: clamp(13px, 2.1vw, 19px); box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 24px 48px -24px rgba(0,0,0,.7); }
        .w3dbd td + td, .w3dbd th + th { padding-left: .9em; }
        @media (min-width: 641px) { .w3dbd td:not(:last-child), .w3dbd th:not(:last-child) { width: 1%; } }
        .w3dbd-tiles span { width: 1.3em; height: 1.75em; display: flex; align-items: center; justify-content: center; border-radius: 3px;
          background: linear-gradient(#22344f, #1a2a42 49%, #0c1626 50%, #1a2a42 52%); color: #f3e6c4;
          font: 700 1em/1 ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
        .w3dbd-tiles span[data-on] { color: #9fb2cc; }
        .w3dbd button:focus-visible { outline: 2px solid #e0b862; outline-offset: 3px; }
        @media (max-width: 640px) {
    .w3dbd-board { padding: 14px 12px; font-size: 14px; }
    .w3dbd thead tr { display: none; }
    .w3dbd tbody tr { display: grid; grid-template-columns: auto 1fr; column-gap: .9em; padding-bottom: 10px; }
    .w3dbd td:nth-child(2) { grid-column: 1 / 3; grid-row: 1; padding-left: 0; }
    .w3dbd td:last-child { padding-top: 0; }
  }
      `}</style>
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e0b862]">Harbour Line Ferries</p>
            <h2 className="mt-2.5 text-[clamp(26px,3.6vw,36px)] font-semibold tracking-tight">Departures from the north pier</h2>
          </div>
          <button
            type="button"
            onClick={() => advance.current()}
            className="min-h-[44px] rounded-full border border-[#3a4d6b] px-5 text-sm font-medium hover:bg-[#1a2a42]"
          >
            Later sailings
          </button>
        </div>
        <div className="w3dbd-board mt-7 rounded-[14px] bg-[#0a1422] p-[18px]">
          <table className="w-full border-collapse">
            <caption className="sr-only">Next four sailings</caption>
            <thead>
              <tr>
                {["Time", "Destination", "Status"].map((h) => (
                  <th key={h} scope="col" className="pb-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#93a3bb]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }, (_, r) => (
                <tr key={r}>
                  {WIDTHS.map((w, c) => (
                    <td key={c} className="py-[5px] align-top">
                      <span className="sr-only">{SAILINGS[r][c]}</span>
                      <span className="w3dbd-tiles flex gap-[2px]" aria-hidden="true">
                        {Array.from({ length: w }, (_, i) => <span key={i} />)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-[22px] max-w-xl text-[15px] leading-relaxed text-[#a9b6c9]">
          Foot passengers board from gate A. Cars queue in lanes 1 to 4 from forty minutes before sailing.
        </p>
      </div>
    </section>
  );
}
