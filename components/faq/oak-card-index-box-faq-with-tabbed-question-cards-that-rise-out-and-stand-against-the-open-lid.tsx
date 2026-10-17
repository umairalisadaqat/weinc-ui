import { useEffect, useId, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

/** The name on the brass holder and one card per question. `tab` is the short word cut into the card's tab. */
const library = { name: "Halewood Tool Library", drawer: "Questions", note: "Ask at the counter" };
const cards = [
  { tab: "Joining", q: "How do I become a member?", a: "Call in on any open day with something that shows your address. We take your details, hand you a card and you can borrow that same afternoon." },
  { tab: "Hours", q: "When is the library open?", a: "Tuesday and Thursday from four until eight, and Saturday from nine until one. The shutter on Mill Lane is up whenever we are in." },
  { tab: "Loans", q: "How long can I keep a tool?", a: "A week for most things. Ladders, the tile cutter and the floor sander go out for three days because there is always a queue for them." },
  { tab: "Late", q: "What if I bring something back late?", a: "Tell us before the due date and we will extend it if nobody is waiting. After that it is fifty pence a day, which goes into the blade fund." },
  { tab: "Repairs", q: "What happens if a tool breaks?", a: "Bring it back and say what happened. Wear is ours to fix. We only ask for help with the cost when something has plainly been misused." },
  { tab: "Demos", q: "Can someone show me how to use it?", a: "Yes. A volunteer will run through any tool at the counter, and the first Saturday of each month is a hands-on morning with the kettle on." },
];

// Two sets of measurements in pixels: one for desks, one for phones. Everything is drawn from these.
const WIDE = { boxW: 560, wall: 16, boxH: 168, cardW: 468, cardH: 292, tabW: 86, tabH: 28, step: 12, lidH: 340, pad: 22, head: 62, line: 24, text: 14, ask: 15, tabText: 10.5 };
const SLIM = { boxW: 336, wall: 11, boxH: 122, cardW: 292, cardH: 300, tabW: 54, tabH: 28, step: 12, lidH: 350, pad: 14, head: 60, line: 21, text: 12, ask: 12.5, tabText: 8 };
type Dims = typeof WIDE;
const TOP = 64; // room above the lid for a card at the top of its flight
const CLEAR = 60; // how far a card overshoots so it clears the tabs before dropping behind them
const SEAT = 60; // how far above the rim the standing card's bottom edge sits
const PEEK = 22; // how much of the front card shows above the rim

const svgUrl = (body: string, w: number, h: number) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`)}")`;
/** Oak figure: stretched noise turned into dark streaks. fx is along the grain, fy across it. */
const grain = (fx: number, fy: number, seed: number, strength = 1.5) =>
  svgUrl(`<filter id='g' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${fx} ${fy}' numOctaves='4' seed='${seed}'/><feColorMatrix values='0 0 0 0 0.33  0 0 0 0 0.17  0 0 0 0 0.05  ${strength} 0 0 0 ${-strength * 0.42}'/></filter><rect width='600' height='400' filter='url(#g)'/>`, 600, 400);
const PAPER_GRAIN = svgUrl(`<filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.4  0 0 0 0 0.28  0 0 0 0 0.1  0 0 0 0.55 -0.16'/></filter><rect width='220' height='220' filter='url(#p)'/>`, 220, 220);
const OAK_FACE = `${grain(0.011, 0.82, 7, 2.6)}, ${grain(0.0022, 0.06, 3, 1.5)}`;
const OAK_LID = `${grain(0.012, 0.7, 21, 2.4)}, ${grain(0.002, 0.05, 9, 1.4)}`;
const OAK_UP = `${grain(0.8, 0.012, 4, 2.2)}, ${grain(0.05, 0.002, 5, 1.2)}`;
const BRASS = "linear-gradient(180deg, #fff1bd 0%, #e0bb62 22%, #b98d33 55%, #8a6519 78%, #d9b660 100%)";
const TONES = ["#f4ebd7", "#f1e6cf", "#f5edda", "#efe3ca", "#f3e9d3", "#f0e5cd"];
const JITTER = [
  { x: -1, r: 0.25 },
  { x: 2, r: -0.3 },
  { x: 0, r: 0.15 },
  { x: -2, r: -0.2 },
  { x: 1, r: 0.3 },
  { x: -1, r: -0.15 },
];
/** A card dropped on its edge: one firm landing and one small hop. */
const landing = (t: number) => (t < 0.62 ? (t / 0.62) * (t / 0.62) : 1 - 0.09 * Math.sin(((t - 0.62) / 0.38) * Math.PI));

function IndexCard({ i, d, rimY, active, reduce, onPick, uid }: { i: number; d: Dims; rimY: number; active: boolean; reduce: boolean; onPick: () => void; uid: string }) {
  const item = cards[i];
  const rowTop = rimY - PEEK - i * d.step;
  const rise = rowTop - (rimY - SEAT - d.cardH);
  const y = useMotionValue(active ? -rise : 0);
  const rotate = useTransform(y, [0, -rise * 0.5, -rise], [JITTER[i].r, -0.9, 0]);
  const [behind, setBehind] = useState(active);
  const [out, setOut] = useState(active);
  const was = useRef({ active, behind: active, greeted: false });

  useEffect(() => {
    const put = (b: boolean) => {
      was.current.behind = b;
      setBehind(b);
    };
    if (was.current.active === active || reduce) {
      // nothing was pressed (first paint, or the frame changed size): sit where it belongs
      was.current.active = active;
      y.set(active ? -rise : 0);
      put(active);
      setOut(active);
      if (active || reduce || was.current.greeted) return;
      // once, on arrival, a finger runs along the tabs
      was.current.greeted = true;
      const hop = animate(y, [0, -9, 0], { duration: 0.5, delay: 0.75 + i * 0.11, ease: "easeInOut" });
      return () => hop.stop();
    }
    was.current.active = active;
    let live = true;
    let run = animate(y, y.get(), { duration: 0 });
    const home = () => {
      run = animate(y, 0, { type: "spring", stiffness: 210, damping: 25 });
      run.then(() => live && setOut(false));
    };
    if (active) {
      setOut(true);
      run = animate(y, -(rise + CLEAR), { duration: 0.44, ease: [0.3, 0, 0.12, 1] });
      run.then(() => {
        if (!live) return;
        put(true);
        run = animate(y, -rise, { duration: 0.42, ease: landing });
      });
    } else if (was.current.behind) {
      run = animate(y, -(rise + CLEAR), { duration: 0.24, ease: [0.4, 0, 0.5, 1] });
      run.then(() => {
        if (!live) return;
        put(false);
        home();
      });
    } else home();
    return () => {
      live = false;
      run.stop();
    };
  }, [active, reduce, rise, y]);

  const tabLeft = (i * (d.cardW - d.tabW)) / (cards.length - 1);
  const paper = TONES[i % TONES.length];
  return (
    <motion.div className="absolute" style={{ left: (d.boxW + 48 - d.cardW) / 2 + JITTER[i].x, top: rowTop, width: d.cardW, height: d.cardH, y, rotate, zIndex: behind ? 1 : 30 - i, transformOrigin: "50% 100%" }}>
      {/* the tab is the control: it is cut from the same sheet as the card */}
      <h3 className="absolute m-0" style={{ left: tabLeft, top: -d.tabH, width: d.tabW, height: d.tabH + 14 }}>
        <button
          type="button"
          id={`${uid}-q${i}`}
          aria-expanded={active}
          aria-controls={`${uid}-a${i}`}
          onClick={onPick}
          className="group relative block h-full w-full cursor-pointer rounded-t-[7px] outline-none focus-visible:ring-2 focus-visible:ring-[#1f4f8f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ebd7]"
        >
          <span aria-hidden="true" className="absolute inset-x-0 top-0 rounded-t-[7px]" style={{ height: d.tabH + 1, background: paper, backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 60%), ${PAPER_GRAIN}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), inset 1px 0 0 rgba(120,90,40,0.16), inset -1px 0 0 rgba(120,90,40,0.2), 0 -1px 2px rgba(60,35,10,0.18)" }} />
          <span aria-hidden="true" className={`absolute inset-x-0 top-0 grid place-items-center font-mono font-bold uppercase tracking-[0.08em] transition-colors ${active ? "text-[#b3301f]" : "text-[#3b3128] group-hover:text-[#b3301f]"}`} style={{ height: d.tabH, fontSize: d.tabText }}>
            {item.tab}
          </span>
          <span className="sr-only">{item.q}</span>
        </button>
      </h3>

      <div className="absolute inset-0 overflow-hidden rounded-[3px]" style={{ background: paper, backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0) 30%, rgba(120,84,30,0.07)), ${PAPER_GRAIN}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 0 0 1px rgba(120,90,40,0.14), 0 -2px 3px rgba(50,28,6,0.2), 0 10px 18px rgba(50,28,6,0.28)" }}>
        {/* printed rules: one red, the rest blue */}
        <div aria-hidden="true" className="absolute inset-x-0" style={{ top: d.head, height: 1.5, background: "#c9483a", opacity: 0.75 }} />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0" style={{ top: d.head + 10, backgroundImage: `repeating-linear-gradient(180deg, rgba(70,112,165,0) 0 ${d.line - 1}px, rgba(70,112,165,0.38) ${d.line - 1}px ${d.line}px)` }} />
        <div id={`${uid}-a${i}`} role="region" aria-labelledby={`${uid}-q${i}`} className="absolute inset-0 font-mono text-[#2a2420]" style={{ padding: `0 ${d.pad}px`, visibility: out ? "visible" : "hidden" }}>
          <div className="flex items-end justify-between gap-3" style={{ height: d.head - 7 }}>
            <p className="m-0 font-bold leading-[1.25]" style={{ fontSize: d.ask }}>
              {item.q}
            </p>
            <p aria-hidden="true" className="m-0 shrink-0 font-bold tracking-[0.1em] text-[#b3301f]" style={{ fontSize: d.tabText }}>
              {String(i + 1).padStart(2, "0")}/{String(cards.length).padStart(2, "0")}
            </p>
          </div>
          <p className="m-0" style={{ marginTop: 17, fontSize: d.text, lineHeight: `${d.line}px` }}>
            {item.a}
          </p>
        </div>
        <span aria-hidden="true" className="absolute grid place-items-center rounded-[2px] font-mono font-bold uppercase tracking-[0.14em] text-[#7a2a55]" style={{ left: d.pad, bottom: 66, height: 26, padding: "0 8px", fontSize: d.tabText - 1, border: "1.5px solid #7a2a55", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0), inset 0 0 0 3px rgba(122,42,85,0.55)", opacity: 0.5, transform: "rotate(-4deg)", visibility: out ? "visible" : "hidden" }}>
          Halewood T.L.
        </span>
        {/* the hole for the drawer rod */}
        <span aria-hidden="true" className="absolute left-1/2 h-[13px] w-[13px] -translate-x-1/2 rounded-full" style={{ bottom: 72, background: "#5a3d1d", boxShadow: "inset 0 2px 3px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.7)" }} />
      </div>
    </motion.div>
  );
}

export default function OakCardIndexFaq() {
  const reduce = !!useReducedMotion();
  const uid = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [slim, setSlim] = useState(false);
  const [scale, setScale] = useState(1);
  const [open, setOpen] = useState(0);
  const idle = useRef({ touched: false, paused: false });

  const d = slim ? SLIM : WIDE;
  const back = cards.length * d.step + 12; // how far up the screen the box runs from its front rim to its hinge
  const rimY = TOP + d.lidH + back;
  const W = d.boxW + 48;
  const H = rimY + d.boxH + 44;
  const x0 = 24;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const w = wrap.clientWidth;
      const narrow = w < 640;
      setSlim(narrow);
      setScale(Math.min(1, w / ((narrow ? SLIM : WIDE).boxW + 20)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // until someone touches it, the box leafs through its own cards
  useEffect(() => {
    if (reduce) return;
    const s = idle.current;
    const t = window.setInterval(() => {
      if (s.touched || s.paused || document.hidden) return;
      setOpen((v) => (v + 1) % cards.length);
    }, 3600);
    return () => window.clearInterval(t);
  }, [reduce]);

  const pick = (i: number) => {
    idle.current.touched = true;
    setOpen((v) => (v === i ? -1 : i));
  };
  const frame = d.wall;
  const fingers = [0, 1, 2, 3, 4];

  return (
    <section className="relative overflow-hidden bg-[#e4dfd3]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 62% at 46% 34%, #f6f3ea 0%, #e6e1d5 52%, #cfc9ba 100%)" }} />
      <div
        ref={wrapRef}
        onPointerEnter={() => (idle.current.paused = true)}
        onPointerLeave={() => (idle.current.paused = false)}
        onFocus={() => (idle.current.paused = true)}
        onBlur={() => (idle.current.paused = false)}
        className="relative mx-auto w-full max-w-[1100px]"
        style={{ height: Math.round(H * scale) + (slim ? 96 : 64) }}
      >
        <h2 className="sr-only">{library.name}: questions and answers</h2>
        <div className="absolute left-1/2 top-0" style={{ width: W, height: H, transformOrigin: "50% 0", transform: `translateX(-50%) scale(${scale})` }}>
          {/* what the box does to the table and the wall behind it */}
          <div aria-hidden="true" className="absolute rounded-[50%]" style={{ left: x0 - 30, top: rimY + d.boxH - 26, width: d.boxW + 90, height: 64, background: "rgba(40,28,12,0.5)", filter: "blur(22px)" }} />
          <div aria-hidden="true" className="absolute" style={{ left: x0 + 18, top: TOP + 26, width: d.boxW + 12, height: d.lidH + back, background: "rgba(60,44,22,0.3)", filter: "blur(26px)" }} />

          {/* the lid, standing open: a shallow tray seen from inside */}
          <div aria-hidden="true" className="absolute overflow-hidden rounded-t-[7px]" style={{ left: x0, top: TOP, width: d.boxW, height: d.lidH, background: "#b98749", backgroundImage: OAK_LID, backgroundSize: "100% 100%, 100% 100%", boxShadow: "inset 0 0 0 1px rgba(60,32,8,0.5)" }}>
            <div className="absolute" style={{ inset: frame, background: "#9a6a33", backgroundImage: `linear-gradient(180deg, rgba(30,14,0,0.5), rgba(30,14,0,0.08) 22%, rgba(30,14,0,0) 60%, rgba(30,14,0,0.25)), linear-gradient(90deg, rgba(30,14,0,0.34), rgba(30,14,0,0) 9%, rgba(30,14,0,0) 93%, rgba(30,14,0,0.2)), ${OAK_FACE}`, backgroundSize: "auto, auto, 100% 100%, 100% 100%", boxShadow: "inset 0 0 0 1px rgba(40,20,4,0.7)" }} />
            {/* mitred frame: each rail catches the light differently */}
            <div className="absolute inset-x-0 top-0" style={{ height: frame, clipPath: `polygon(0 0, 100% 0, calc(100% - ${frame}px) 100%, ${frame}px 100%)`, background: "linear-gradient(180deg, rgba(255,236,190,0.7), rgba(255,226,170,0.2))" }} />
            <div className="absolute inset-y-0 left-0" style={{ width: frame, clipPath: `polygon(0 0, 100% ${frame}px, 100% 100%, 0 100%)`, background: "linear-gradient(90deg, rgba(255,232,180,0.38), rgba(255,226,170,0.05))" }} />
            <div className="absolute inset-y-0 right-0" style={{ width: frame, clipPath: `polygon(0 ${frame}px, 100% 0, 100% 100%, 0 100%)`, background: "linear-gradient(90deg, rgba(40,18,0,0.12), rgba(40,18,0,0.36))" }} />
          </div>

          {/* inside the box, with the tops of its side walls running back to the hinge */}
          <div aria-hidden="true" className="absolute" style={{ left: x0, top: rimY - back, width: d.boxW, height: back + 8, background: "linear-gradient(180deg, #2a1a0b, #170d05)" }} />
          {[0, 1].map((side) => (
            <div key={side} aria-hidden="true" className="absolute" style={{ left: side ? x0 + d.boxW - frame : x0, top: rimY - back, width: frame, height: back, background: "#d6ab6c", backgroundImage: `linear-gradient(180deg, rgba(60,30,4,0.35), rgba(255,240,205,0.3) 30%, rgba(255,240,205,0.45)), ${OAK_UP}`, backgroundSize: "auto, 100% 100%, 100% 100%", boxShadow: "inset 0 2px 0 rgba(40,20,4,0.6), inset 0 0 0 1px rgba(60,32,8,0.4)" }}>
              <span className="absolute inset-x-[2px] top-[-5px] block h-[10px] rounded-[2px]" style={{ background: BRASS, boxShadow: "0 1px 2px rgba(0,0,0,0.5), inset 0 0 0 0.5px rgba(80,50,0,0.7)" }} />
            </div>
          ))}

          {/* cards are taller than the box is deep on screen, so they are cut off where its floor would be */}
          <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: rimY + d.boxH - 8 }}>
            {cards.map((_, i) => (
              <IndexCard key={i} i={i} d={d} rimY={rimY} active={open === i} reduce={reduce} onPick={() => pick(i)} uid={uid} />
            ))}
          </div>

          {/* the front of the box: rim, oak face, finger joints, brass holder */}
          <div aria-hidden="true" className="absolute" style={{ left: x0, top: rimY - 7, width: d.boxW, height: d.boxH + 7, zIndex: 40 }}>
            <div className="absolute inset-x-0 top-0 h-[8px] rounded-t-[2px]" style={{ background: "#dcb478", backgroundImage: `linear-gradient(180deg, rgba(255,244,214,0.75), rgba(255,236,196,0.2)), ${OAK_FACE}`, backgroundSize: "auto, 100% 100%, 100% 100%", boxShadow: "0 -3px 5px rgba(0,0,0,0.35)" }} />
            <div className="absolute inset-x-0 bottom-0 overflow-hidden rounded-b-[5px]" style={{ top: 7, background: "#c2924f", backgroundImage: `linear-gradient(180deg, rgba(255,238,198,0.5) 0, rgba(255,238,198,0.12) 5px, rgba(255,232,186,0) 34%, rgba(46,22,2,0.14) 74%, rgba(46,22,2,0.42) 100%), linear-gradient(90deg, rgba(255,236,196,0.2), rgba(255,236,196,0) 22%, rgba(40,18,0,0) 80%, rgba(40,18,0,0.2)), ${OAK_FACE}`, backgroundSize: "auto, auto, 100% 100%, 100% 100%", boxShadow: "inset 0 0 0 1px rgba(64,34,8,0.55), inset 0 -2px 0 rgba(30,12,0,0.4), inset 0 2px 0 rgba(255,240,205,0.45), inset 2px 0 0 rgba(255,236,196,0.18), inset -2px 0 0 rgba(30,12,0,0.2), inset 0 0 50px rgba(60,28,0,0.22)" }}>
              {[0, 1].map((side) =>
                fingers.map((f) =>
                  f % 2 === 0 ? (
                    <span key={`${side}-${f}`} className="absolute block" style={{ [side ? "right" : "left"]: 0, top: `${f * 20}%`, height: "20%", width: frame, background: "#8a5b29", backgroundImage: "repeating-linear-gradient(90deg, rgba(40,18,0,0.28) 0 1px, rgba(255,220,160,0.1) 1px 3px), linear-gradient(180deg, rgba(255,230,180,0.25), rgba(0,0,0,0.22))", boxShadow: "inset 0 0 0 1px rgba(50,24,2,0.6)" }} />
                  ) : null,
                ),
              )}
              {/* brass label holder with a finger pull */}
              <div className="absolute left-1/2 -translate-x-1/2" style={{ top: slim ? "20%" : "23%", width: slim ? 132 : 176 }}>
                <div className="relative rounded-[3px] p-[7px]" style={{ background: BRASS, boxShadow: "0 3px 5px rgba(30,12,0,0.55), 0 1px 0 rgba(255,246,210,0.5) inset, 0 0 0 0.5px rgba(70,44,0,0.9)" }}>
                  <div className="rounded-[1px] px-2 py-[6px] text-center font-mono uppercase text-[#2a2420]" style={{ background: "#f3ead4", backgroundImage: PAPER_GRAIN, boxShadow: "inset 0 2px 4px rgba(50,28,0,0.55), inset 0 0 0 0.5px rgba(50,28,0,0.6)" }}>
                    <span className="block font-bold tracking-[0.22em]" style={{ fontSize: slim ? 10 : 12.5 }}>
                      {library.drawer}
                    </span>
                    <span className="block tracking-[0.12em] text-[#6b5a44]" style={{ fontSize: slim ? 6.5 : 7.5 }}>
                      {library.note}
                    </span>
                  </div>
                  {[
                    { left: 1.5, top: 1.5 },
                    { right: 1.5, top: 1.5 },
                    { left: 1.5, bottom: 1.5 },
                    { right: 1.5, bottom: 1.5 },
                  ].map((p, k) => (
                    <span key={k} className="absolute block h-[4px] w-[4px] rounded-full" style={{ ...p, background: "radial-gradient(circle at 35% 30%, #fff3c4, #8a6519 70%)", boxShadow: "0 0 0 0.5px rgba(60,36,0,0.8)" }} />
                  ))}
                </div>
                <div className="mx-auto h-[15px] w-[46%] rounded-b-[14px]" style={{ background: "linear-gradient(180deg, #7a5814 0%, #c9a24a 28%, #fff0b8 58%, #b58a30 100%)", boxShadow: "0 4px 5px rgba(30,12,0,0.5), inset 0 0 0 0.5px rgba(70,44,0,0.9)" }} />
              </div>
            </div>
          </div>
        </div>

        <p className="absolute bottom-5 left-5 m-0 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#5b5445] sm:bottom-7 sm:left-8">
          <span className="text-[#231d15]">{library.name}</span>
          <span className="block">Press a tab to pull its card</span>
        </p>
      </div>
    </section>
  );
}
