import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** What gets printed, in order. `alert: true` prints the heading bar in red. */
const feed = [
  { kind: "New order", ref: "0412", time: "09:14", lines: ["2  Flat white", "1  Croissant"], foot: "Table 6", alert: false },
  { kind: "Paid", ref: "0409", time: "09:11", lines: ["Card payment", "$18.40 settled"], foot: "Tip added", alert: false },
  { kind: "Booking", ref: "B-77", time: "09:08", lines: ["Table for five", "Today at 12:30"], foot: "Name: Okafor", alert: false },
  { kind: "Low stock", ref: "S-03", time: "09:02", lines: ["Oat milk", "2 cartons left"], foot: "Reorder by noon", alert: true },
  { kind: "Collected", ref: "0410", time: "08:57", lines: ["Order 0410", "Left with rider"], foot: "Rider: Imre", alert: false },
  { kind: "Message", ref: "M-21", time: "09:16", lines: ["Can we move our", "table to 1 pm?"], foot: "From: Lena", alert: false },
  { kind: "New order", ref: "0413", time: "09:18", lines: ["1  Shakshuka", "1  Orange juice", "   no coriander"], foot: "Table 2", alert: false },
  { kind: "Refund", ref: "0398", time: "09:21", lines: ["Order 0398", "$6.50 returned"], foot: "Reason: wrong milk", alert: true },
];

const EVERY = 3800; // milliseconds between tickets while the rail feeds itself
const RAIL_TOP = 104;

type Ticket = { uid: number; item: number; leaving: boolean };
type Body = { x: number; vx: number; a: number; va: number; y: number; vy: number; spin: number; falling: boolean };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const BARS = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 1, 3, 2];

// glazed brick tiles, drawn once as a repeating picture
const TILES = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='168' height='148'><defs><linearGradient id='g' x1='0' y1='0' x2='0.25' y2='1'><stop offset='0' stop-color='#3aa39a'/><stop offset='0.16' stop-color='#23837b'/><stop offset='0.7' stop-color='#1b6c66'/><stop offset='1' stop-color='#145650'/></linearGradient></defs><rect width='168' height='148' fill='#0a2f2d'/><g fill='url(#g)'><rect x='1.5' y='1.5' width='165' height='71' rx='3'/><rect x='-82.5' y='75.5' width='165' height='71' rx='3'/><rect x='85.5' y='75.5' width='165' height='71' rx='3'/></g><g fill='none' stroke='#ffffff' stroke-opacity='0.34' stroke-width='1.2' stroke-linecap='round'><path d='M6 4.2h156M-78 78.2h156M90 78.2h156'/></g><g fill='none' stroke='#000000' stroke-opacity='0.3' stroke-width='1.4'><path d='M6 70.6h156M-78 144.6h156M90 144.6h156'/></g><rect x='85.5' y='75.5' width='165' height='71' rx='3' fill='#000' fill-opacity='0.07'/><rect x='1.5' y='1.5' width='165' height='71' rx='3' fill='#fff' fill-opacity='0.03'/></svg>`,
)}")`;

function layout(width: number) {
  const small = width < 600;
  const tw = small ? 142 : 188;
  const gap = small ? 14 : 26;
  const slot = tw + gap;
  const cap = clamp(Math.floor((width - 28 + gap) / slot), 2, 5);
  const left = (width - cap * slot + gap) / 2;
  return { tw, slot, cap, left, rail: Math.min(width - 20, cap * slot - gap + 120) };
}

export default function KitchenOrderRailNotifications() {
  const reduce = !!useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<number, HTMLLIElement>());
  const bodies = useRef(new Map<number, Body>());
  const sim = useRef({ order: [] as number[], lay: layout(1100), uid: 5, item: 5, seen: true, ready: false, lastX: 0, lastT: 0, held: false });
  const [tickets, setTickets] = useState<Ticket[]>(() => [0, 1, 2, 3, 4].map((i) => ({ uid: i, item: i, leaving: false })));
  const [lay, setLay] = useState(() => layout(1100));
  const [said, setSaid] = useState("");

  const place = useCallback((uid: number) => {
    const el = nodes.current.get(uid);
    const b = bodies.current.get(uid);
    if (!el || !b) return;
    const bend = clamp(-b.va * 1.5, -5, 5);
    el.style.transform = `translate3d(${b.x.toFixed(2)}px, ${b.y.toFixed(1)}px, 0) rotate(${(b.a + b.spin + (((uid * 37) % 7) - 3) * 0.0045).toFixed(4)}rad) skewX(${bend.toFixed(2)}deg)`;
    el.style.opacity = b.falling ? String(clamp(1.2 - b.y / 420, 0, 1)) : "1";
  }, []);

  // keep the list the physics reads in step with what React shows
  useEffect(() => {
    const s = sim.current;
    s.order = tickets.filter((t) => !t.leaving).map((t) => t.uid);
    s.order.forEach((uid, i) => {
      if (!bodies.current.has(uid)) {
        // a ticket nobody has seen yet starts off the left end of the rail, unless the rail is still being laid out
        bodies.current.set(uid, { x: s.ready && !reduce ? -s.lay.tw - 40 : s.lay.left + i * s.lay.slot, vx: 0, a: 0, va: 0, y: 0, vy: 0, spin: 0, falling: false });
      }
      if (reduce || !s.ready) {
        const b = bodies.current.get(uid)!;
        b.x = s.lay.left + i * s.lay.slot;
        b.a = 0;
      }
      place(uid);
    });
    bodies.current.forEach((_, uid) => {
      if (!tickets.some((t) => t.uid === uid)) bodies.current.delete(uid);
    });
  }, [tickets, lay, place, reduce]);

  const drop = useCallback(
    (uid: number, tell: boolean) => {
      const b = bodies.current.get(uid);
      if (!b || b.falling) return;
      if (reduce) {
        setTickets((list) => list.filter((t) => t.uid !== uid));
      } else {
        b.falling = true;
        b.vy = 180;
        b.va = b.va + (uid % 2 ? 1.4 : -1.4);
        setTickets((list) => list.map((t) => (t.uid === uid ? { ...t, leaving: true } : t)));
      }
      if (tell) setSaid("Ticket pulled off the rail.");
    },
    [reduce],
  );

  const print = useCallback(() => {
    const s = sim.current;
    const item = s.item % feed.length;
    const uid = s.uid;
    s.uid += 1;
    s.item += 1;
    const f = feed[item];
    setSaid(`New ticket. ${f.kind} ${f.ref}: ${f.lines.join(", ").replace(/\s+/g, " ")}. ${f.foot}.`);
    // the oldest ticket makes room when the rail is full
    if (s.order.length >= s.lay.cap) drop(s.order[s.order.length - 1], false);
    setTickets((list) => [{ uid, item, leaving: false }, ...list]);
  }, [drop]);

  const pull = (uid: number, byKey: boolean) => {
    const s = sim.current;
    s.held = true;
    if (byKey) {
      const at = s.order.indexOf(uid);
      const next = s.order[at + 1] ?? s.order[at - 1];
      const target = next === undefined ? stageRef.current?.querySelector<HTMLElement>("[data-print]") : nodes.current.get(next)?.querySelector<HTMLElement>("button");
      target?.focus();
    }
    drop(uid, true);
  };

  // measure the wall and decide how many tickets fit
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const s = sim.current;
    const measure = () => {
      const next = layout(stage.clientWidth);
      const first = !s.ready;
      s.lay = next;
      setLay(next);
      if (first) {
        setTickets((list) => list.slice(0, next.cap));
        list_ready();
      } else {
        const extra = s.order.slice(next.cap);
        extra.forEach((uid) => drop(uid, false));
      }
    };
    const list_ready = () => window.setTimeout(() => (s.ready = true), 60);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    const io = new IntersectionObserver(([e]) => (s.seen = e.isIntersecting));
    io.observe(stage);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [drop]);

  // the rail: tickets are sprung to their places, hang as pendulums and are swung by how hard they are shoved
  useEffect(() => {
    if (reduce) return;
    const s = sim.current;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      if (!s.seen || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.03, (now - last) / 1000);
      last = now;
      const done: number[] = [];
      bodies.current.forEach((b, uid) => {
        if (b.falling) {
          b.vy += 2900 * dt;
          b.y += b.vy * dt;
          b.spin += b.va * dt * 0.5;
          if (b.y > 620) done.push(uid);
        } else {
          const i = s.order.indexOf(uid);
          const ax = (s.lay.left + i * s.lay.slot - b.x) * 74 - b.vx * 13.5;
          b.vx += ax * dt;
          b.x += b.vx * dt;
          const draught = Math.sin(now / 760 + uid * 1.9) * 0.42 + Math.sin(now / 310 + uid) * 0.14;
          b.va += (-b.a * 44 - b.va * 2.3 - ax * 0.00042 + draught) * dt;
          b.a = clamp(b.a + b.va * dt, -0.6, 0.6);
        }
        place(uid);
      });
      if (done.length) setTickets((list) => list.filter((t) => !done.includes(t.uid)));
    };
    raf = requestAnimationFrame(step);
    // the first ticket waits a little longer, so the rail is seen full and still before anything moves
    let loop = 0;
    const feedOne = () => {
      if (s.seen && !document.hidden && !s.held) print();
      loop = window.setTimeout(feedOne, EVERY);
    };
    loop = window.setTimeout(feedOne, EVERY + 1400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(loop);
    };
  }, [place, print, reduce]);

  // a hand moving past sets the paper swinging
  const brush = (e: React.PointerEvent) => {
    const s = sim.current;
    const box = stageRef.current?.getBoundingClientRect();
    if (!box || reduce) return;
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const dx = performance.now() - s.lastT < 80 ? x - s.lastX : 0;
    s.lastX = x;
    s.lastT = performance.now();
    if (y < RAIL_TOP + 40 || y > RAIL_TOP + 360) return;
    bodies.current.forEach((b) => {
      if (!b.falling && x > b.x && x < b.x + s.lay.tw) b.va = clamp(b.va + dx * 0.012 * ((y - RAIL_TOP) / 300), -3, 3);
    });
  };

  return (
    <section className="relative overflow-hidden bg-[#1b6c66]">
      <div ref={stageRef} onPointerMove={brush} onPointerLeave={() => (sim.current.held = false)} className="relative h-[600px] sm:h-[660px]">
        {/* the tiled wall and the light on its glaze */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: TILES, backgroundSize: "168px 148px", backgroundPosition: "50% 18px" }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(104deg, rgba(255,255,255,0) 18%, rgba(255,255,255,0.1) 19%, rgba(255,255,255,0.1) 27%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 33%, rgba(255,255,255,0.07) 34%, rgba(255,255,255,0.07) 37%, rgba(255,255,255,0) 38%), radial-gradient(70% 62% at 46% 26%, rgba(255,236,190,0.3) 0%, rgba(255,236,190,0.06) 46%, rgba(2,22,22,0.62) 100%)" }} />

        {/* the tickets */}
        <ul className="absolute inset-0 m-0 list-none p-0" style={{ top: RAIL_TOP + 26 }}>
          {tickets.map((t) => {
            const f = feed[t.item];
            return (
              <li
                key={t.uid}
                ref={(el) => {
                  if (el) nodes.current.set(t.uid, el);
                  else nodes.current.delete(t.uid);
                }}
                aria-hidden={t.leaving}
                className="absolute left-0 top-0"
                style={{ width: lay.tw, transformOrigin: "50% 0", willChange: "transform", filter: "drop-shadow(9px 13px 9px rgba(1,24,22,0.5))" }}
              >
                <button
                  type="button"
                  tabIndex={t.leaving ? -1 : 0}
                  onClick={(e) => pull(t.uid, e.detail === 0)}
                  onKeyDown={(e) => {
                    if (e.key === "Delete" || e.key === "Backspace" || e.key === "Escape") {
                      e.preventDefault();
                      pull(t.uid, true);
                    }
                  }}
                  className="korn-ticket group relative block w-full cursor-pointer bg-[#faf6ea] px-3 pb-7 pt-9 text-left font-mono text-[#1b1a17] outline-none sm:px-[18px] sm:pb-9 sm:pt-10"
                  style={{ backgroundImage: "linear-gradient(90deg, rgba(40,40,30,0.12) 0%, rgba(255,255,255,0) 14%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0) 70%, rgba(40,40,30,0.13) 100%), linear-gradient(180deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.16) 22px, rgba(0,0,0,0) 46px, rgba(0,0,0,0) 78%, rgba(60,50,30,0.07) 89%, rgba(255,255,255,0.7) 95%, rgba(60,50,30,0.1) 100%)" }}
                >
                  <span className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.12em] text-[#56524a]">
                    <span>No. {f.ref}</span>
                    <span>{f.time}</span>
                  </span>
                  <span className={`mt-2 block px-2 py-[5px] text-center text-[12px] font-bold uppercase tracking-[0.16em] text-[#faf6ea] sm:py-[7px] sm:text-[14px] ${f.alert ? "bg-[#b3261c]" : "bg-[#1b1a17]"}`}>{f.kind}</span>
                  <span className="mt-3 block min-h-[62px] whitespace-pre text-[12px] font-semibold leading-[1.55] sm:min-h-[76px] sm:text-[14.5px]">{f.lines.join("\n")}</span>
                  <span aria-hidden="true" className="mt-2 block border-t border-dashed border-[#1b1a17]/50" />
                  <span className={`mt-2 block text-[10.5px] uppercase tracking-[0.1em] ${f.alert ? "font-bold text-[#b3261c]" : "text-[#3a372f]"}`}>{f.foot}</span>
                  <span aria-hidden="true" className="mt-3 flex h-[22px] items-stretch gap-[2px] opacity-80 sm:mt-4 sm:h-[30px]">
                    {BARS.map((w, i) => (
                      <span key={i} className="bg-[#1b1a17]" style={{ width: w + ((i + t.uid) % 3 === 0 ? 1 : 0) }} />
                    ))}
                  </span>
                  <span className="sr-only">Press to pull this ticket off the rail.</span>
                  <span aria-hidden="true" className="pointer-events-none absolute inset-x-1 bottom-[9px] top-8 rounded-[2px] opacity-0 ring-2 ring-[#b3261c] transition-opacity group-hover:opacity-40 group-focus-visible:opacity-100" />
                </button>
              </li>
            );
          })}
        </ul>

        {/* the rail: an aluminium extrusion screwed to the wall, its lip gripping the paper */}
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 -translate-x-1/2" style={{ top: RAIL_TOP, width: lay.rail, height: 50 }}>
          <div className="absolute inset-x-2 -bottom-5 top-6 rounded-[6px] bg-[#021a18]/70" style={{ filter: "blur(10px)", transform: "translate(8px, 6px)" }} />
          <div className="absolute inset-0 overflow-hidden rounded-[5px]" style={{ background: "linear-gradient(180deg, #fbfcfc 0%, #dfe3e5 5%, #b3babe 15%, #8a9298 30%, #c3c9cc 40%, #eef0f1 47%, #a9b0b5 55%, #6f777d 70%, #9aa1a6 82%, #4c5257 93%, #23272a 100%)", boxShadow: "0 1px 0 rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.18)" }}>
            <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.09) 0 1px, rgba(0,0,0,0.05) 1px 2px)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 8%, rgba(255,255,255,0.4) 22%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.12) 62%, rgba(255,255,255,0.22) 80%, rgba(0,0,0,0.3) 100%)" }} />
            <div className="absolute inset-x-0 top-[19px] h-[3px]" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.42), rgba(255,255,255,0.5))" }} />
          </div>
          {[0, 1].map((side) => (
            <div key={side} className="absolute top-[-2px] h-[54px] w-[18px] rounded-[4px]" style={{ [side ? "right" : "left"]: -5, background: "linear-gradient(180deg, #4b4f52 0%, #1d2022 30%, #0c0d0e 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 3px 4px 6px rgba(0,0,0,0.4)" }} />
          ))}
          {["11%", "50%", "89%"].map((x) => (
            <div key={x} className="absolute top-[5px] h-[10px] w-[10px] -translate-x-1/2 rounded-full" style={{ left: x, background: "radial-gradient(circle at 36% 30%, #ffffff 0%, #b9c0c4 38%, #5d656a 100%)", boxShadow: "0 1px 1px rgba(0,0,0,0.6), inset 0 0 0 0.5px rgba(0,0,0,0.4)" }}>
              <div className="absolute left-1/2 top-1/2 h-[1.5px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-[24deg] bg-[#2c3033]" />
            </div>
          ))}
        </div>

        {/* the pass: a steel shelf under the rail */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[86px] h-[34px]" style={{ background: "linear-gradient(180deg, rgba(2,20,19,0) 0%, rgba(2,20,19,0.55) 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 h-[86px]" style={{ background: "linear-gradient(180deg, #f4f6f6 0px, #cdd3d6 3px, #aab2b6 18px, #c4cacd 30px, #8f979c 31px, #eef1f2 33px, #9da5aa 38px, #6d757a 62%, #3f4549 100%)" }}>
          <div aria-hidden="true" className="absolute inset-0" style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 1px, rgba(0,0,0,0.04) 1px 2px), linear-gradient(90deg, rgba(0,0,0,0.28) 0%, rgba(255,255,255,0.3) 26%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.14) 70%, rgba(255,255,255,0.16) 86%, rgba(0,0,0,0.3) 100%)" }} />
          <p className="absolute bottom-4 left-5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-[#1d2224] sm:bottom-5 sm:left-8 sm:text-[11px] sm:tracking-[0.18em]">
            <span className="font-bold text-black">Order rail</span>
            <span className="block">Press a ticket to pull it</span>
          </p>
          <button
            type="button"
            data-print
            aria-label="Print a new ticket"
            onClick={() => {
              sim.current.held = true;
              print();
            }}
            className="absolute bottom-4 right-5 flex h-11 items-center gap-2 rounded-full bg-[#15191b] pl-4 pr-5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white outline-none transition-transform active:translate-y-px focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6d757a] sm:bottom-5 sm:right-8"
            style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.5), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -2px 3px rgba(0,0,0,0.6)" }}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M10 4v12M4 10h12" />
            </svg>
            Print<span className="hidden sm:inline">ticket</span>
          </button>
        </div>

        <p role="status" aria-live="polite" className="sr-only">
          {said}
        </p>
      </div>
      <style>{`.korn-ticket { clip-path: polygon(0 0, 100% 0, 100% calc(100% - 6px), 96% 100%, 92% calc(100% - 6px), 88% 100%, 84% calc(100% - 6px), 80% 100%, 76% calc(100% - 6px), 72% 100%, 68% calc(100% - 6px), 64% 100%, 60% calc(100% - 6px), 56% 100%, 52% calc(100% - 6px), 48% 100%, 44% calc(100% - 6px), 40% 100%, 36% calc(100% - 6px), 32% 100%, 28% calc(100% - 6px), 24% 100%, 20% calc(100% - 6px), 16% 100%, 12% calc(100% - 6px), 8% 100%, 4% calc(100% - 6px), 0 100%); } @media (prefers-reduced-motion: reduce) { .korn-ticket { transition: none; } }`}</style>
    </section>
  );
}
