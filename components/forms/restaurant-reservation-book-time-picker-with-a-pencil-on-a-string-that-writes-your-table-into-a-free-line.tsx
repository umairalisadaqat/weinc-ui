import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const PLACE = "Osteria Brandello"; // small line under the book
const COVERS = 2; // the party size pencilled beside your name (2 to 8)
const OPEN_ON = 5; // weekday the book opens at (0 Sunday ... 6 Saturday), the next one after today
const AUTOPLAY = true; // the pencil books a couple of lines and turns a page until someone takes over
const SITTINGS = [
  { name: "Lunch", times: ["11:30 am", "12:00 pm", "12:30 pm", "1:00 pm", "1:30 pm", "2:00 pm", "2:30 pm", "3:00 pm"] },
  { name: "Dinner", times: ["5:30 pm", "6:00 pm", "6:30 pm", "7:00 pm", "7:30 pm", "8:00 pm", "8:30 pm", "9:00 pm"] },
];
const FULLNESS = 0.52; // share of lines that already hold a name

const ID = "restaurant-reservation-book";
const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SERIF = 'Georgia, "Times New Roman", serif';
const noise = (f: number, o: number) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${f}' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='${o}'/%3E%3C/svg%3E")`;
const FIBRE = noise(0.8, 0.5), LEATHER = noise(0.42, 0.9);
const rnd = (a: number, b: number, c: number) => { const n = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719 + 4.1) * 43758.5453; return n - Math.floor(n); };
// Who is already written on a line. The same day always gives the same page.
const entryAt = (day: number, part: number, row: number) => (rnd(day, part * 9 + row, 1) < FULLNESS ? { seed: Math.floor(rnd(day, row, part + 5) * 9000) + 11, covers: [2, 2, 3, 4, 4, 5, 6, 8][Math.floor(rnd(row, day, part + 2) * 8)], struck: rnd(day + 3, row, part) < 0.05 } : null);

// A line of joined-up pencil writing: loops and humps that read as a name without spelling one.
function scrawl(seed: number) {
  let s = seed * 48271 + 7;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const cap = () => `c ${4 + r() * 2} -2 ${6 + r() * 2} -${17 + r() * 3} ${3 + r()} -${17 + r() * 3} s -3 ${13 + r() * 2} ${6 + r() * 2} ${17 + r() * 3}`;
  const letter = () => {
    const k = 0.85 + r() * 0.4, p = r();
    if (p < 0.34) return `q ${3 * k} -${6 + r() * 2} ${6 * k} 0`;
    if (p < 0.62) return `c ${2 * k} 0 ${5 * k} -7 ${3 * k} -7 s ${-2 * k} 6 ${4.5 * k} 7`;
    if (p < 0.76) return `q ${2 * k} ${3 + r() * 2} ${4 * k} 0`;
    if (p < 0.9) return `c ${3 * k} -1 ${4 * k} -15 ${2 * k} -15 s ${-1 * k} 12 ${5 * k} 15`;
    return `c ${3 * k} 0 ${3 * k} 9 0 9 s 0 -7 ${6 * k} -9`;
  };
  let d = `M3 29 ${cap()}`;
  for (let i = 3 + Math.floor(r() * 3); i > 0; i--) d += ` ${letter()}`;
  d += ` m ${7 + r() * 3} 0 ${cap()}`;
  for (let i = 4 + Math.floor(r() * 4); i > 0; i--) d += ` ${letter()}`;
  return d;
}
const DIGIT: Record<number, string> = {
  2: "M9 18 q 5 -6 8 0 q 0 5 -8 11 h 9", 3: "M9 17 q 8 -4 7 2 q -1 4 -4 4 q 6 0 5 5 q -1 5 -9 2", 4: "M15 15 l -6 10 h 11 m -3 -5 v 10",
  5: "M17 16 h -7 l -1 6 q 8 -3 8 3 q 0 6 -9 5", 6: "M16 15 q -8 4 -7 11 q 1 5 5 4 q 4 -1 3 -5 q -1 -4 -7 -1", 8: "M13 22 q -5 -4 0 -7 q 5 3 0 7 q -6 4 0 8 q 6 -4 0 -8",
};
const RING = "M10 23 C 6 10, 50 6, 54 20 C 57 36, 12 40, 8 25 C 6 15, 20 9, 32 9";

type Booking = { day: number; part: number; row: number; n: number };

// One page of the book: a printed head and eight ruled lines, some already written on.
function Sheet({ date, day, part, booking, onPick, live, rows }: { date: Date; day: number; part: number; booking: Booking; onPick?: (part: number, row: number) => void; live: boolean; rows?: { current: Record<string, HTMLElement | null> } }) {
  const sit = SITTINGS[part], still = useReducedMotion();
  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#f1e7d0] ${part === 0 ? "sm:pr-5" : "sm:pl-5"}`} style={{ fontFamily: SERIF }}>
      <div className="absolute inset-0 mix-blend-multiply" style={{ backgroundImage: FIBRE, opacity: 0.4 }} />
      <div className={`absolute inset-0 hidden sm:block`} style={{ background: part === 0 ? "linear-gradient(90deg,rgba(90,60,20,0.06) 0,rgba(255,255,255,0.14) 55%,rgba(255,255,255,0.2) 78%,rgba(70,44,12,0.12) 92%,rgba(40,24,6,0.42) 100%)" : "linear-gradient(270deg,rgba(90,60,20,0.08) 0,rgba(255,255,255,0.14) 55%,rgba(255,255,255,0.2) 78%,rgba(70,44,12,0.12) 92%,rgba(40,24,6,0.42) 100%)" }} />
      <div className={`absolute inset-0 sm:hidden`} style={{ background: part === 0 ? "linear-gradient(180deg,rgba(255,255,255,0.1) 0,rgba(255,255,255,0.2) 86%,rgba(70,44,12,0.1) 96%,rgba(40,24,6,0.34) 100%)" : "linear-gradient(0deg,rgba(90,60,20,0.08) 0,rgba(255,255,255,0.2) 86%,rgba(70,44,12,0.1) 96%,rgba(40,24,6,0.34) 100%)" }} />
      <div className="relative flex h-[58px] items-end justify-between border-b-2 border-[#8d2f27] px-4 pb-2 sm:h-[78px] sm:px-6">
        <p className="flex items-baseline gap-2 text-[#8d2f27]">
          <span className="text-[30px] font-bold leading-none sm:text-[42px]">{date.getDate()}</span>
          <span className="text-[11px] font-bold uppercase leading-none tracking-[0.2em] sm:text-[12px]">{DOW[date.getDay()]}<span className="hidden font-normal sm:inline"> · {MON[date.getMonth()]}</span></span>
        </p>
        <p className="text-[11px] font-bold uppercase leading-none tracking-[0.26em] text-[#8d2f27] sm:text-[12px]">{sit.name}</p>
      </div>
      <div className="relative">
        <span className="absolute bottom-0 left-[62px] top-0 w-px bg-[#c4674f]/60 sm:left-[76px]" />
        <span className="absolute bottom-0 right-[44px] top-0 w-px bg-[#c4674f]/60 sm:right-[52px]" />
        {sit.times.map((t, row) => {
          const mine = booking.day === day && booking.part === part && booking.row === row, taken = mine ? null : entryAt(day, part, row), fresh = mine && booking.n > 0 && live && !still;
          const pencil = { fill: "none", stroke: mine ? "#2f2f36" : "#55555e", strokeWidth: mine ? 1.5 : 1.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, filter: `url(#${ID}-graphite)` };
          const draw = (delay: number, duration: number) => (fresh ? { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { pathLength: { delay, duration, ease: "linear" as const }, opacity: { delay, duration: 0.01 } } } : {});
          return (
            <button
              key={t}
              ref={live && rows ? (el) => { rows.current[`${part}-${row}`] = el; } : undefined}
              type="button"
              disabled={!!taken || !live}
              tabIndex={live ? undefined : -1}
              aria-pressed={live && !taken ? mine : undefined}
              aria-label={`${t}, ${sit.name.toLowerCase()}, ${mine ? "your table" : taken ? "taken" : "free"}`}
              onClick={() => onPick?.(part, row)}
              className={`group relative flex h-[40px] w-full items-center border-b border-[#9fb2bf]/70 text-left outline-none sm:h-[46px] ${taken ? "cursor-default" : "cursor-pointer hover:bg-[#8d2f27]/[0.05] focus-visible:bg-[#8d2f27]/[0.08] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8d2f27]"}`}
            >
              <span className="w-[62px] shrink-0 pl-4 text-[14px] font-bold leading-none text-[#8d2f27] sm:w-[76px] sm:pl-6 sm:text-[15px]" style={{ fontVariantNumeric: "lining-nums tabular-nums" }}>{t.replace(/ [ap]m/, "")}</span>
              {(taken || mine) && (
                <svg aria-hidden="true" className="pointer-events-none absolute left-[62px] top-1/2 h-[44px] w-[190px] -translate-y-1/2 overflow-visible sm:left-[78px]" viewBox="0 0 190 44">
                  <g transform="translate(6 2) skewX(-12)" style={{ transformOrigin: "0 29px" }}>
                    <motion.path key={`n${booking.n}`} d={scrawl(mine ? 4242 : taken!.seed)} {...pencil} opacity={mine ? 1 : 0.86} {...draw(0.62, 0.8)} />
                    {taken?.struck && <path d="M-2 22 q 50 -5 128 -1" {...pencil} />}
                  </g>
                </svg>
              )}
              {(taken || mine) && !taken?.struck && (
                <svg aria-hidden="true" className="pointer-events-none absolute right-[8px] top-1/2 h-[44px] w-[30px] -translate-y-1/2 overflow-visible sm:right-[12px]" viewBox="0 0 30 44">
                  <motion.path key={`c${booking.n}`} d={DIGIT[mine ? COVERS : taken!.covers] ?? DIGIT[2]} {...pencil} {...draw(1.44, 0.22)} />
                </svg>
              )}
              {mine && (
                <svg aria-hidden="true" className="pointer-events-none absolute left-0 top-1/2 h-[44px] w-[62px] -translate-y-1/2 overflow-visible sm:left-[8px]" viewBox="0 0 62 44">
                  <motion.path key={`r${booking.n}`} d={RING} {...pencil} {...draw(0.3, 0.32)} />
                </svg>
              )}
              {!taken && !mine && live && <span className="ml-auto mr-[52px] font-sans text-[10px] uppercase tracking-[0.2em] text-[#8d2f27] opacity-0 group-hover:opacity-70 group-focus-visible:opacity-70 sm:mr-[64px]">free</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RestaurantReservationBook() {
  const reduce = useReducedMotion();
  const [today] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); });
  const [first] = useState(() => (((OPEN_ON - today.getDay()) % 7) + 7) % 7 || 7);
  const [day, setDay] = useState(first);
  const [booking, setBooking] = useState<Booking>(() => { let row = 3; while (row < 7 && entryAt(first, 1, row)) row++; return { day: first, part: 1, row, n: 0 }; });
  const [flip, setFlip] = useState<{ from: number; to: number; dir: number } | null>(null);
  const [stacked, setStacked] = useState(false);
  const stage = useRef<HTMLDivElement>(null), book = useRef<HTMLDivElement>(null), eyelet = useRef<HTMLSpanElement>(null), pen = useRef<HTMLDivElement>(null), penTurn = useRef<HTMLDivElement>(null);
  const twine = useRef<SVGPathElement>(null), twist = useRef<SVGPathElement>(null), shade = useRef<SVGPathElement>(null);
  const rows = useRef<Record<string, HTMLElement | null>>({}), touched = useRef(false), api = useRef<{ write: (el: HTMLElement | null) => void; rest: () => void } | null>(null);
  const live = useRef({ day, flip, booking }); live.current = { day, flip, booking };
  const dateOf = (d: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + d);

  const pick = (part: number, row: number) => {
    if (live.current.flip || row < 0) return;
    const b = live.current.booking, d = live.current.day;
    if (b.day === d && b.part === part && b.row === row) return;
    setBooking({ day: d, part, row, n: b.n + 1 });
    api.current?.write(rows.current[`${part}-${row}`] ?? null);
  };
  const turn = (dir: number) => {
    if (live.current.flip) return;
    const from = live.current.day, to = from + dir;
    if (to < 0) return;
    api.current?.rest(); setDay(to);
    if (!reduce) setFlip({ from, to, dir });
  };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)"), on = () => setStacked(mq.matches);
    on(); mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // The pencil and its string. The string is a chain of points dragged across the table with friction; the pencil is sprung towards wherever it is wanted.
  useEffect(() => {
    const st = stage.current, bk = book.current, ey = eyelet.current, pe = pen.current, pt = penTurn.current;
    if (!st || !bk || !ey || !pe || !pt) return;
    const N = 30, LEN = 222, RAD = Math.PI / 180, HOLD = 40, LIE = 9;
    const P = new Float32Array(N * 2), O = new Float32Array(N * 2);
    let g = { ax: 0, ay: 0, bx: 0, by: 0, bw: 0, bh: 0 }, seg = 10, raf = 0, seen = true, calm = 0;
    const p = { x: 0, y: 0, a: LIE, vx: 0, vy: 0, va: 0 };
    let aim = { x: 0, y: 0, a: LIE }, hover: { x: number; y: number } | null = null, script: { t0: number; x: number; y: number; w: number } | null = null;
    const home = () => ({ x: g.bx + g.bw - Math.min(230, g.bw * 0.62), y: g.by + g.bh - 30, a: LIE });
    const tail = (x: number, y: number, a: number) => [x + Math.cos(a * RAD) * LEN, y - Math.sin(a * RAD) * LEN];
    const solve = (rounds: number) => {
      const [ex, ey2] = tail(p.x, p.y, p.a);
      for (let k = 0; k < rounds; k++) {
        P[0] = g.ax; P[1] = g.ay; P[N * 2 - 2] = ex; P[N * 2 - 1] = ey2;
        for (let i = 0; i < N - 1; i++) {
          const dx = P[i * 2 + 2] - P[i * 2], dy = P[i * 2 + 3] - P[i * 2 + 1], d = Math.sqrt(dx * dx + dy * dy) || 0.001, f = ((d - seg) / d) * 0.5;
          if (i > 0) { P[i * 2] += dx * f; P[i * 2 + 1] += dy * f; }
          if (i < N - 2) { P[i * 2 + 2] -= dx * f; P[i * 2 + 3] -= dy * f; }
        }
        for (let i = 0; i < N - 2; i++) { // a little stiffness so the string cannot fold flat on itself
          const dx = P[i * 2 + 4] - P[i * 2], dy = P[i * 2 + 5] - P[i * 2 + 1], d = Math.sqrt(dx * dx + dy * dy) || 0.001;
          if (d < seg * 1.5) { const f = ((d - seg * 1.5) / d) * 0.12; if (i > 0) { P[i * 2] += dx * f; P[i * 2 + 1] += dy * f; } if (i < N - 3) { P[i * 2 + 4] -= dx * f; P[i * 2 + 5] -= dy * f; } }
        }
      }
    };
    const paint = () => {
      let d = `M${P[0].toFixed(1)} ${P[1].toFixed(1)}`;
      for (let i = 1; i < N - 1; i++) d += ` Q${P[i * 2].toFixed(1)} ${P[i * 2 + 1].toFixed(1)} ${((P[i * 2] + P[i * 2 + 2]) / 2).toFixed(1)} ${((P[i * 2 + 1] + P[i * 2 + 3]) / 2).toFixed(1)}`;
      d += ` L${P[N * 2 - 2].toFixed(1)} ${P[N * 2 - 1].toFixed(1)}`;
      twine.current?.setAttribute("d", d); twist.current?.setAttribute("d", d); shade.current?.setAttribute("d", d);
      pe.style.transform = `translate3d(${p.x.toFixed(1)}px,${(p.y - 9).toFixed(1)}px,0)`; pt.style.transform = `rotate(${(-p.a).toFixed(2)}deg)`;
    };
    const measure = () => {
      const s = st.getBoundingClientRect(), b = bk.getBoundingClientRect(), e = ey.getBoundingClientRect();
      g = { ax: e.left + e.width / 2 - s.left, ay: e.top + e.height / 2 - s.top, bx: b.left - s.left, by: b.top - s.top, bw: b.width, bh: b.height };
      const h = home(); let reach = 0;
      for (const [x, y, a] of [[h.x, h.y, h.a], [g.bx, g.by + g.bh, HOLD], [g.bx + g.bw, g.by + g.bh, HOLD], [g.bx, g.by, HOLD], [g.bx + g.bw, g.by, HOLD]]) { const [tx, ty] = tail(x, y, a); reach = Math.max(reach, Math.hypot(tx - g.ax, ty - g.ay)); }
      seg = (reach + 24) / (N - 1);
      p.x = h.x; p.y = h.y; p.a = h.a; p.vx = p.vy = p.va = 0; aim = h; script = null;
      // lay the string out in a loose arc beside the straight line, then let it find its length
      const [ex, ey2] = tail(p.x, p.y, p.a), cx = ex - g.ax, cy = ey2 - g.ay, c = Math.hypot(cx, cy) || 1, bow = Math.sqrt(Math.max(0, (seg * (N - 1)) ** 2 - c * c)) * 0.42;
      for (let i = 0; i < N; i++) { const t = i / (N - 1), b2 = Math.sin(t * Math.PI) * bow; P[i * 2] = g.ax + cx * t - (cy / c) * b2 * (cx > 0 ? -1 : 1); P[i * 2 + 1] = g.ay + cy * t + (cx / c) * b2 * (cx > 0 ? -1 : 1); }
      solve(60); O.set(P); paint();
    };
    const frame = (now: number) => {
      raf = 0;
      if (script) {
        const e = (now - script.t0) / 1000, mid = script.y;
        if (e < 0.3) aim = { x: script.x + 12, y: mid + 2, a: HOLD };
        else if (e < 0.62) { const t = ((e - 0.3) / 0.32) * Math.PI * 2.5; aim = { x: script.x + 34 - Math.cos(t) * 22, y: mid - Math.sin(t) * 12, a: HOLD + Math.sin(t) * 3 }; }
        else if (e < 1.42) { const u = (e - 0.62) / 0.8, nx = script.w < 300 ? 66 : 86; aim = { x: script.x + nx + u * 104, y: mid + 3 + Math.sin(u * 46) * 4, a: HOLD + Math.sin(u * 46) * 2.5 }; }
        else if (e < 1.7) aim = { x: script.x + script.w - 24, y: mid + Math.sin((e - 1.42) * 30) * 5, a: HOLD };
        else { script = null; aim = home(); }
      } else aim = hover ? { x: hover.x, y: hover.y, a: HOLD } : home();
      const k = script ? 420 : 150, c = script ? 30 : 20, dt = 1 / 60;
      p.vx += (k * (aim.x - p.x) - c * p.vx) * dt; p.vy += (k * (aim.y - p.y) - c * p.vy) * dt; p.va += (120 * (aim.a - p.a) - 18 * p.va) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
      let moved = Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.va);
      for (let i = 1; i < N - 1; i++) { // dragged over the table: most of the speed is lost each step
        const x = P[i * 2], y = P[i * 2 + 1], vx = (x - O[i * 2]) * 0.8, vy = (y - O[i * 2 + 1]) * 0.8;
        O[i * 2] = x; O[i * 2 + 1] = y; P[i * 2] = x + vx; P[i * 2 + 1] = y + vy; moved += Math.abs(vx) + Math.abs(vy);
      }
      solve(8); paint();
      calm = moved < 0.6 && !script ? calm + 1 : 0;
      if (seen && !document.hidden && calm < 20) raf = requestAnimationFrame(frame);
    };
    const wake = () => { calm = 0; if (!raf && !reduce) raf = requestAnimationFrame(frame); };
    api.current = {
      write: (el) => { if (!el || reduce) return; const s = st.getBoundingClientRect(), r = el.getBoundingClientRect(); hover = null; script = { t0: performance.now(), x: r.left - s.left, y: r.top - s.top + r.height / 2, w: r.width }; wake(); },
      rest: () => { script = null; hover = null; wake(); },
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || script) return;
      const s = st.getBoundingClientRect(), x = e.clientX - s.left, y = e.clientY - s.top;
      hover = x > g.bx && x < g.bx + g.bw && y > g.by && y < g.by + g.bh ? { x: x + 7, y: y + 5 } : null; wake();
    };
    const onLeave = () => { hover = null; wake(); };
    measure();
    st.addEventListener("pointermove", onMove); st.addEventListener("pointerleave", onLeave);
    const ro = new ResizeObserver(() => { measure(); wake(); }); ro.observe(st);
    const io = new IntersectionObserver(([en]) => { seen = en.isIntersecting; if (seen) wake(); }); io.observe(st);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; st.removeEventListener("pointermove", onMove); st.removeEventListener("pointerleave", onLeave); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [reduce, stacked]);

  useEffect(() => {
    if (!AUTOPLAY || reduce) return;
    let step = 0, timer = 0;
    const freeRow = (d: number, part: number, start: number) => { for (let i = 0; i < 8; i++) { const r = (start + i) % 8; if (!entryAt(d, part, r) && !(live.current.booking.day === d && live.current.booking.part === part && live.current.booking.row === r)) return r; } return -1; };
    const tick = () => {
      if (touched.current || document.hidden) return;
      const d = live.current.day, k = step++ % 4;
      if (k === 0) pick(1, freeRow(d, 1, 5)); else if (k === 1) turn(1); else if (k === 2) pick(0, freeRow(d, 0, 2)); else turn(-1);
    };
    const start = window.setTimeout(() => { tick(); timer = window.setInterval(tick, 3200); }, 3100);
    return () => { window.clearTimeout(start); window.clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const left = flip ? (flip.dir > 0 ? flip.from : flip.to) : day, right = flip ? (flip.dir > 0 ? flip.to : flip.from) : day;
  const date = dateOf(day), mineDate = dateOf(booking.day), take = () => { touched.current = true; };
  const arrow = "flex h-10 w-10 items-center justify-center rounded-full text-[#d9c9b4] outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white disabled:opacity-30 motion-reduce:transition-none";
  const sheet = (d: number, part: number, on: boolean) => <Sheet date={dateOf(d)} day={d} part={part} booking={booking} live={on} onPick={on ? (a, b) => { take(); pick(a, b); } : undefined} rows={on ? rows : undefined} />;

  return (
    <div ref={stage} className="relative flex min-h-[1000px] w-full flex-col items-center justify-center overflow-hidden bg-[#1b1512] px-3 py-12 sm:min-h-[780px] sm:px-6" style={{ backgroundImage: "radial-gradient(90% 75% at 42% 34%,#4a3a30 0%,#2a211c 48%,#15100d 100%)" }}>
      <svg aria-hidden="true" className="absolute h-0 w-0"><filter id={`${ID}-graphite`} x="-5%" y="-20%" width="110%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="t" /><feDisplacementMap in="SourceGraphic" in2="t" scale="1.6" /></filter></svg>
      <div ref={book} className="relative w-full max-w-[380px] rounded-[14px] bg-[#5e211e] p-[10px] sm:max-w-[900px] sm:p-[15px]" style={{ boxShadow: "inset 0 1px 0 rgba(255,200,180,0.35), inset 0 0 0 1px rgba(0,0,0,0.4), 0 2px 0 #3d1412, 0 4px 0 #2e0f0d, 0 50px 60px -20px rgba(0,0,0,0.85), 0 16px 22px -6px rgba(0,0,0,0.6)" }}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[14px] mix-blend-overlay" style={{ backgroundImage: LEATHER, opacity: 0.6 }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-[4px] rounded-[11px] border border-dashed border-[#e8b89a]/45" />
        <span ref={eyelet} aria-hidden="true" className="absolute left-1/2 top-[-3px] z-20 h-[13px] w-[13px] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(circle at 50% 50%,#140c08 0 32%,#8a6a2c 36%,#f1d58a 52%,#a8843a 70%,#5a4418 100%)", boxShadow: "0 1px 2px rgba(0,0,0,0.7)" }} />
        <div className="relative rounded-[3px]" style={{ boxShadow: "0 0 0 1px #cfc2a3, 1px 1px 0 1px #efe6d0, 2px 2px 0 1px #c9bc9c, 3px 3px 0 1px #efe6d0, 4px 4px 0 1px #bfb292, 5px 6px 6px rgba(0,0,0,0.5)", perspective: 2400 }}>
          <div role="group" aria-label={`Reservations for ${DOW[date.getDay()]} ${date.getDate()} ${MON[date.getMonth()]}`} className="relative grid grid-cols-1 sm:grid-cols-2">
            <div className="relative">{sheet(left, 0, !flip)}</div>
            <div className="relative">{sheet(right, 1, !flip)}</div>
            {flip && (
              <motion.div
                aria-hidden="true"
                className={`absolute z-10 ${stacked ? "inset-x-0 bottom-0 h-1/2" : "inset-y-0 right-0 w-1/2"}`}
                style={{ transformStyle: "preserve-3d", transformOrigin: stacked ? "50% 0" : "0 50%" }}
                initial={stacked ? { rotateX: flip.dir > 0 ? 0 : 180 } : { rotateY: flip.dir > 0 ? 0 : -180 }}
                animate={stacked ? { rotateX: flip.dir > 0 ? 180 : 0 } : { rotateY: flip.dir > 0 ? -180 : 0 }}
                transition={{ duration: 0.8, ease: [0.45, 0.05, 0.3, 1] }}
                onAnimationComplete={() => setFlip(null)}
              >
                <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", boxShadow: "0 0 30px rgba(0,0,0,0.35)" }}>{sheet(flip.dir > 0 ? flip.from : flip.to, 1, false)}</div>
                <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: stacked ? "rotateX(180deg)" : "rotateY(180deg)", boxShadow: "0 0 30px rgba(0,0,0,0.35)" }}>{sheet(flip.dir > 0 ? flip.to : flip.from, 0, false)}</div>
              </motion.div>
            )}
          </div>
        </div>
        <svg aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[6px] z-10 hidden h-[calc(100%+40px)] w-[18px] -translate-x-1/2 overflow-visible sm:block" viewBox="0 0 18 600" preserveAspectRatio="none">
          <defs><linearGradient id={`${ID}-satin`} x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#0f3d4a" /><stop offset="0.3" stopColor="#2b8298" /><stop offset="0.5" stopColor="#7cc4d4" /><stop offset="0.72" stopColor="#1f6d82" /><stop offset="1" stopColor="#0c3340" /></linearGradient></defs>
          <path d="M3 0 C 0 150, 8 300, 4 450 S 8 560, 4 600 l 5 -8 l 5 8 C 18 560, 14 520, 15 450 S 11 150, 15 0 Z" fill="rgba(0,0,0,0.4)" transform="translate(3 2)" />
          <path d="M3 0 C 0 150, 8 300, 4 450 S 8 560, 4 600 l 5 -8 l 5 8 C 18 560, 14 520, 15 450 S 11 150, 15 0 Z" fill={`url(#${ID}-satin)`} />
        </svg>
      </div>
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible">
        <path ref={shade} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="3" strokeLinecap="round" transform="translate(2 4)" style={{ filter: "blur(1.5px)" }} />
        <path ref={twine} fill="none" stroke="#d8c49a" strokeWidth="2.6" strokeLinecap="round" />
        <path ref={twist} fill="none" stroke="#8a7447" strokeWidth="2.6" strokeDasharray="1.6 3.4" opacity="0.8" />
      </svg>
      <div ref={pen} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-30 h-[18px] w-[232px]" style={{ filter: "drop-shadow(5px 9px 4px rgba(0,0,0,0.5))" }}>
        <div ref={penTurn} className="h-full w-full" style={{ transformOrigin: "0 50%" }}>
          <svg width="232" height="18" viewBox="0 0 232 18">
            <defs>
              <linearGradient id={`${ID}-brass`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff3c4" /><stop offset="0.3" stopColor="#d8b25a" /><stop offset="0.6" stopColor="#8f6c22" /><stop offset="1" stopColor="#5a4210" /></linearGradient>
              <linearGradient id={`${ID}-rubber`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f6b3ac" /><stop offset="0.5" stopColor="#e2877f" /><stop offset="1" stopColor="#a9544e" /></linearGradient>
              <linearGradient id={`${ID}-cedar`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f3dcb6" /><stop offset="0.5" stopColor="#dcb886" /><stop offset="1" stopColor="#a47c4e" /></linearGradient>
            </defs>
            <path d="M0 9 L13 6.2 L13 11.8 Z" fill="#2b2b30" /><path d="M0 9 L13 6.2 L13 8 Z" fill="#5a5a62" />
            <path d="M13 6.2 L38 1 L38 17 L13 11.8 Z" fill={`url(#${ID}-cedar)`} />
            <path d="M38 1 q -5 2.6 0 5.3 q -5 2.7 0 5.4 q -5 2.6 0 5.3 H200 V1 Z" fill="#e9b213" />
            <path d="M38 1 q -5 2.6 0 5.3 H200 V1 Z" fill="#fad64b" /><path d="M38 11.7 q -5 2.6 0 5.3 H200 V11.7 Z" fill="#b07f06" />
            <path d="M40 2.2 H200" stroke="#fff3b0" strokeWidth="0.8" opacity="0.8" /><path d="M118 9 h30 M154 9 h10" stroke="#7a5a08" strokeWidth="1.6" opacity="0.55" />
            <rect x="198" y="0.5" width="19" height="17" rx="1" fill={`url(#${ID}-brass)`} /><path d="M202 1v16M205 1v16M210 1v16M213 1v16" stroke="#4d380c" strokeWidth="0.7" opacity="0.6" />
            <path d="M217 1 H226 q 6 0 6 8 q 0 8 -6 8 H217 Z" fill={`url(#${ID}-rubber)`} />
          </svg>
        </div>
      </div>
      <div className="relative z-40 mt-12 flex items-center gap-1">
        <button type="button" onClick={() => { take(); turn(-1); }} disabled={day <= 0} aria-label="Previous day" className={arrow}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.5 6.5 10l5.5 5.5" /></svg>
        </button>
        <p aria-live="polite" className="min-w-[236px] text-center">
          <span className="block text-[17px] font-semibold leading-6 tracking-tight text-white">{DOW[mineDate.getDay()]} {mineDate.getDate()} {MON[mineDate.getMonth()]}, {SITTINGS[booking.part].times[booking.row]}</span>
          <span className="block font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-[#d9c9b4]">{PLACE} <span className="mx-1 hidden text-[#8f7f6c] sm:inline">/</span> <span className="block sm:inline">table for {COVERS}, in pencil</span></span>
        </p>
        <button type="button" onClick={() => { take(); turn(1); }} aria-label="Next day" className={arrow}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m8 4.5 5.5 5.5L8 15.5" /></svg>
        </button>
      </div>
    </div>
  );
}
