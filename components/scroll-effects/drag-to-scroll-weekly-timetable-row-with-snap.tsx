import { useEffect, useRef } from "react";

const days = [
  {
    "day": "Monday",
    "note": "Late opening",
    "rows": [
      {
        "t": "7:00",
        "n": "Early bouldering",
        "lv": "a",
        "lvl": "All levels"
      },
      {
        "t": "12:30",
        "n": "Lunch hour circuits",
        "lv": "i",
        "lvl": "Improver"
      },
      {
        "t": "18:00",
        "n": "First time on the wall",
        "lv": "b",
        "lvl": "Beginner"
      },
      {
        "t": "20:00",
        "n": "Lead skills",
        "lv": "i",
        "lvl": "Improver"
      }
    ]
  },
  {
    "day": "Tuesday",
    "note": "",
    "rows": [
      {
        "t": "10:00",
        "n": "Parent and toddler",
        "lv": "a",
        "lvl": "All levels"
      },
      {
        "t": "17:30",
        "n": "Youth squad",
        "lv": "i",
        "lvl": "Improver"
      },
      {
        "t": "19:30",
        "n": "Technique clinic",
        "lv": "i",
        "lvl": "Improver"
      }
    ]
  },
  {
    "day": "Wednesday",
    "note": "Women's night",
    "rows": [
      {
        "t": "7:00",
        "n": "Early bouldering",
        "lv": "a",
        "lvl": "All levels"
      },
      {
        "t": "18:00",
        "n": "First time on the wall",
        "lv": "b",
        "lvl": "Beginner"
      },
      {
        "t": "19:30",
        "n": "Women's social climb",
        "lv": "a",
        "lvl": "All levels"
      }
    ]
  },
  {
    "day": "Thursday",
    "note": "",
    "rows": [
      {
        "t": "12:30",
        "n": "Lunch hour circuits",
        "lv": "i",
        "lvl": "Improver"
      },
      {
        "t": "18:00",
        "n": "Belay course, part one",
        "lv": "b",
        "lvl": "Beginner"
      },
      {
        "t": "20:00",
        "n": "Strength and fingers",
        "lv": "i",
        "lvl": "Improver"
      }
    ]
  },
  {
    "day": "Friday",
    "note": "Open until 11",
    "rows": [
      {
        "t": "17:00",
        "n": "After school club",
        "lv": "b",
        "lvl": "Beginner"
      },
      {
        "t": "19:00",
        "n": "Friday social",
        "lv": "a",
        "lvl": "All levels"
      },
      {
        "t": "21:00",
        "n": "Late bouldering",
        "lv": "a",
        "lvl": "All levels"
      }
    ]
  },
  {
    "day": "Saturday",
    "note": "",
    "rows": [
      {
        "t": "9:00",
        "n": "Kids' taster",
        "lv": "b",
        "lvl": "Beginner"
      },
      {
        "t": "11:00",
        "n": "Belay course, part two",
        "lv": "b",
        "lvl": "Beginner"
      },
      {
        "t": "14:00",
        "n": "Outdoor trip briefing",
        "lv": "i",
        "lvl": "Improver"
      }
    ]
  },
  {
    "day": "Sunday",
    "note": "Closes at 6",
    "rows": [
      {
        "t": "10:00",
        "n": "Family climb",
        "lv": "a",
        "lvl": "All levels"
      },
      {
        "t": "13:00",
        "n": "Route setting preview",
        "lv": "a",
        "lvl": "All levels"
      },
      {
        "t": "15:00",
        "n": "Stretch and mobility",
        "lv": "a",
        "lvl": "All levels"
      }
    ]
  }
];

const css = `
.w5drg-root { --w5drg-stone: #e6eaed; --w5drg-signal: #c2410c; --w5drg-col: 250px; --w5drg-pad: max(20px, calc((100% - 1160px) / 2)); padding: 52px 0 44px; background: var(--w5drg-stone); color: #15202b; font-family: ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
.w5drg-root *, .w5drg-root *::before { box-sizing: border-box; }
.w5drg-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 0 var(--w5drg-pad); }
.w5drg-label { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: #9a3412; }
.w5drg-label::before { content: ""; width: 18px; height: 3px; background: var(--w5drg-signal); }
.w5drg-title { margin: 8px 0 0; font-size: clamp(28px, 4vw, 40px); font-weight: 750; letter-spacing: -.025em; line-height: 1.05; }
.w5drg-lede { margin: 8px 0 0; font-size: 15px; color: #3d4a57; }
.w5drg-btns { display: flex; gap: 8px; }
.w5drg-btns button { display: grid; place-items: center; width: 46px; height: 46px; padding: 0; border: 0; border-radius: 8px; background: #15202b; color: #fff; cursor: pointer; transition: background-color .2s ease, transform .15s ease; }
.w5drg-btns button:hover { background: #2a3846; }
.w5drg-btns button:active { transform: scale(.94); }
.w5drg-btns button[aria-disabled="true"] { background: #b8c1c9; color: #3d4a57; cursor: default; }
.w5drg-btns button:focus-visible, .w5drg-row:focus-visible, .w5drg-book:focus-visible { outline: 3px solid var(--w5drg-signal); outline-offset: 3px; }
.w5drg-row { display: flex; gap: 14px; margin: 26px 0 0; padding: 4px var(--w5drg-pad) 10px; list-style: none; overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding-inline: var(--w5drg-pad); scrollbar-width: none; overscroll-behavior-x: contain; }
.w5drg-row::-webkit-scrollbar { display: none; }
.w5drg-root[data-drag] .w5drg-row { scroll-snap-type: none; cursor: grabbing; user-select: none; }
@media (hover: hover) and (pointer: fine) { .w5drg-row { cursor: grab; } }
.w5drg-day { flex: 0 0 var(--w5drg-col); scroll-snap-align: start; padding: 18px 18px 8px; border-radius: 12px; background: #fff; box-shadow: 0 1px 0 rgba(21, 32, 43, .06), 0 14px 30px -24px rgba(21, 32, 43, .5); }
.w5drg-dh { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin: 0 0 6px; }
.w5drg-dn { margin: 0; font-size: 18px; font-weight: 700; }
.w5drg-note { font-size: 12px; font-weight: 600; color: #9a3412; }
.w5drg-list { margin: 0; padding: 0; list-style: none; }
.w5drg-s { display: grid; grid-template-columns: 52px 1fr; gap: 2px 10px; padding: 12px 0; border-top: 1px solid #e3e7eb; }
.w5drg-t { grid-row: span 2; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
.w5drg-c { font-size: 15px; line-height: 1.35; }
.w5drg-lv { justify-self: start; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.w5drg-b { background: #e3efe6; color: #1d5130; }
.w5drg-i { background: #fde7d9; color: #8a2c0a; }
.w5drg-a { background: #e5e9f2; color: #2f3c5c; }
.w5drg-foot { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; margin: 22px var(--w5drg-pad) 0; font-size: 14px; color: #3d4a57; }
.w5drg-book { display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 8px; background: var(--w5drg-signal); color: #fff; font-weight: 600; text-decoration: none; }
.w5drg-book:hover { background: #9a3412; }
@media (max-width: 639px) { .w5drg-head { flex-direction: column; align-items: flex-start; } .w5drg-root { --w5drg-col: 236px; } }
@media (prefers-reduced-motion: reduce) { .w5drg-btns button { transition: none; } }
`;

// Same script as the HTML version. It also checks prefers-reduced-motion itself.
function init(root: HTMLElement): () => void {
  var $ = function (s: string): any { return root.querySelector(s); };
  var row = $(".w5drg-row"), prev = $(".w5drg-prev"), next = $(".w5drg-next");
  var rm = matchMedia("(prefers-reduced-motion: reduce)");
  var ac = new AbortController(), o = { passive: true, signal: ac.signal };
  var go = function (d: number) { row.scrollBy({ left: d * row.clientWidth * 0.8, behavior: rm.matches ? "auto" : "smooth" }); };
  var DRAG = 6; // pixels a mouse press must travel before it becomes a drag
  var drag: any = null, moved = false;
  row.addEventListener("pointerdown", function (e: any) {
    if (e.pointerType !== "mouse" || e.button) return;
    drag = { x: e.clientX, s: row.scrollLeft, id: e.pointerId };
    moved = false;
  }, o);
  row.addEventListener("pointermove", function (e: any) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!moved && Math.abs(dx) > DRAG) { moved = true; root.setAttribute("data-drag", ""); row.setPointerCapture(drag.id); }
    if (moved) row.scrollLeft = drag.s - dx;
  }, o);
  function end() { drag = null; root.removeAttribute("data-drag"); }
  row.addEventListener("pointerup", end, o);
  row.addEventListener("pointercancel", end, o);
  // A drag that ends on a link should not follow it.
  row.addEventListener("click", function (e: any) { if (moved) { e.preventDefault(); moved = false; } }, { capture: true, signal: ac.signal });
  function paint() {
    var max = row.scrollWidth - row.clientWidth, x = row.scrollLeft;
    prev.setAttribute("aria-disabled", String(x < 4));
    next.setAttribute("aria-disabled", String(x > max - 4));

  }
  prev.addEventListener("click", function () { go(-1); }, o);
  next.addEventListener("click", function () { go(1); }, o);
  row.addEventListener("scroll", paint, o);
  window.addEventListener("resize", paint, o);
  paint();
  return function () {
    ac.abort();

  };
}

export default function DragToScrollWeeklyTimetableRowWithSnap() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? init(ref.current) : undefined), []);
  return (
    <section ref={ref} className="w5drg-root" data-w5drg aria-labelledby="w5drg-title">
    <style>{css}</style>
      <div className="w5drg-head">
        <div>
          <p className="w5drg-label">Northwall Climbing</p>
          <h2 className="w5drg-title" id="w5drg-title">This week on the wall</h2>
          <p className="w5drg-lede">Drag, swipe or use the arrows to see every day.</p>
        </div>
        <div className="w5drg-btns">
          <button type="button" className="w5drg-prev" aria-controls="w5drg-row" aria-label="Earlier days"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <button type="button" className="w5drg-next" aria-controls="w5drg-row" aria-label="Later days"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
      </div>
      <ul className="w5drg-row" id="w5drg-row" role="list" tabIndex="0" aria-label="Timetable by day, scroll sideways">
        {days.map((it, i) => (
    <li key={i} className="w5drg-day">
          <div className="w5drg-dh"><h3 className="w5drg-dn">{it.day}</h3><span className="w5drg-note">{it.note}</span></div>
          <ul className="w5drg-list" role="list">
            {it.rows.map((r, j) => (
    <li key={j} className="w5drg-s"><span className="w5drg-t">{r.t}</span><span className="w5drg-c">{r.n}</span><span className={`w5drg-lv w5drg-${r.lv}`}>{r.lvl}</span></li>
    ))}
          </ul>
        </li>
    ))}
      </ul>
      <div className="w5drg-foot">
        <span>Classes are booked by the session. Drop-in climbing needs no booking.</span>
        <a href="#" className="w5drg-book">Book a class</a>
      </div>
    </section>
  );
}
