import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/** What is printed on the pocket and typed on the card. `ink` is the colour a date was stamped in. */
const library = { name: "Fennel Street Reading Room", card: "Evenings, autumn list", number: "No. 0417" };
const INKS = { violet: "#43349a", red: "#b3271c", navy: "#1c2b55" };
const dates: { date: string; what: string; where: string; ink: keyof typeof INKS; turn: number; dx: number; dy: number }[] = [
  { date: "02 OCT 2026", what: "Poetry open mic", where: "Upstairs, 7 pm", ink: "red", turn: -2.4, dx: 1, dy: 1 },
  { date: "09 OCT 2026", what: "Mending circle", where: "Bring a jumper", ink: "red", turn: 1.6, dx: -2, dy: -1 },
  { date: "16 OCT 2026", what: "Zine fair", where: "Whole ground floor", ink: "navy", turn: -0.8, dx: 2, dy: 2 },
  { date: "23 OCT 2026", what: "Ghost stories", where: "Candles, 8 pm", ink: "violet", turn: 3.1, dx: -1, dy: 0 },
  { date: "30 OCT 2026", what: "Seed swap", where: "Courtyard, noon", ink: "violet", turn: -1.9, dx: 3, dy: -2 },
  { date: "06 NOV 2026", what: "Letterpress hour", where: "Print room", ink: "navy", turn: 0.9, dx: -3, dy: 1 },
  { date: "13 NOV 2026", what: "Translators read", where: "Upstairs, 7 pm", ink: "violet", turn: -2.8, dx: 1, dy: -1 },
  { date: "20 NOV 2026", what: "Quiet disco", where: "Stacks, 9 pm", ink: "violet", turn: 2.2, dx: -1, dy: 2 },
];

// Sizes in the scene's own pixels. Two layouts: stamp beside the pocket, or under it on narrow screens.
const PW = 330; // pocket
const CW = 262; // card
const CH = 430;
const HEAD = 74; // printed heading of the card
const ROW = 37;
const OUT = 270; // how far the card travels out of the pocket
const CARD_IN = 318; // top of the card when tucked in
const FRONT_Y = 418; // top edge of the pocket front
const BACK_Y = 340;
const FLOOR = 620;
const SW = 152; // stamp
const SH = 74;
const WIDE = { W: 920, H: 684, px: 196, restX: 700, restY: 498, restTurn: 11 };
const TALL = { W: 430, H: 800, px: 50, restX: 292, restY: 706, restTurn: -7 };
type Layout = typeof WIDE;
const STAGE = "#c9c6ea";
const fibre = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.24 0 0 0 0 0.08 0 0 0 0.3 -0.06'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")";
const manila = "#e3c283";
const INK_FILTER = "library-date-due-card-ink";

export default function LibraryDateDueCard() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [tall, setTall] = useState(false);
  const [stamped, setStamped] = useState(6);
  const [out, setOut] = useState(true);
  const [busy, setBusy] = useState(false);
  const live = useRef({ paused: false, touched: false, busy: false, alive: true, stamped: 6, out: true });
  const L: Layout = tall ? TALL : WIDE;
  const lay = useRef(L);
  lay.current = L;

  const cardY = useMotionValue(reduce ? -OUT : -OUT + 30);
  const sx = useMotionValue(WIDE.restX);
  const sy = useMotionValue(WIDE.restY);
  const turn = useMotionValue(WIDE.restTurn);
  const lift = useMotionValue(0.35); // 0 pressed on the card, 1 carried in the hand
  const body = useTransform([sx, sy, turn, lift], ([x, y, r, l]: number[]) => `translate3d(${x - SW / 2}px, ${y - SH / 2}px, ${14 + l * 90}px) rotate(${r}deg) scale(${1 + l * 0.03})`);
  const shade = useTransform([sx, sy, turn, lift], ([x, y, r, l]: number[]) => `translate3d(${x - SW / 2 + 4 + l * 20}px, ${y - SH / 2 + 5 + l * 30}px, 11px) rotate(${r}deg) scale(${1 + l * 0.05})`);
  const shadeBlur = useTransform(lift, (l) => `blur(${5 + l * 15}px)`);
  const shadeFade = useTransform(lift, (l) => 0.5 - l * 0.22);

  // the whole flat lay is one tray that tips a few degrees: with the pointer, and slowly by itself
  const px = useSpring(0, { stiffness: 45, damping: 14 });
  const py = useSpring(0, { stiffness: 45, damping: 14 });
  const drift = useMotionValue(0);
  const tipY = useTransform([px, drift], ([a, b]: number[]) => a * 5 + b);
  const tipX = useTransform([py, drift], ([a, b]: number[]) => 5 - a * 4 + b * 0.4);
  useEffect(() => {
    if (reduce) return;
    const a = animate(drift, [-2.6, 2.6], { duration: 6, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" });
    return () => a.stop();
  }, [drift, reduce]);

  const slide = useCallback(
    (to: boolean) => {
      live.current.out = to;
      setOut(to);
      if (reduce) cardY.set(to ? -OUT : 0);
      else animate(cardY, to ? -OUT : 0, { type: "spring", stiffness: 130, damping: 17, mass: 1.1 });
    },
    [cardY, reduce],
  );

  /** Carry the dater to the next empty row, press it, and bring it home. */
  const stamp = useCallback(async () => {
    const s = live.current;
    if (s.busy) return;
    if (s.stamped >= dates.length) {
      // a full card goes back in the pocket and a fresh one comes out
      s.busy = true;
      setBusy(true);
      slide(false);
      await new Promise((r) => window.setTimeout(r, reduce ? 0 : 750));
      if (!s.alive) return;
      s.stamped = 4;
      setStamped(4);
      slide(true);
      s.busy = false;
      setBusy(false);
      return;
    }
    s.busy = true;
    setBusy(true);
    if (!s.out) {
      slide(true);
      await new Promise((r) => window.setTimeout(r, reduce ? 0 : 520));
    }
    const n = s.stamped;
    const row = dates[n];
    const now = lay.current;
    const tx = now.px + (PW - CW) / 2 + 53 + row.dx;
    const ty = CARD_IN - OUT + HEAD + n * ROW + ROW / 2 + row.dy;
    if (!reduce) {
      const go = { duration: 0.46, ease: [0.3, 0.7, 0.3, 1] } as const;
      animate(lift, 1, { duration: 0.2 });
      animate(turn, row.turn, go);
      animate(sx, tx, go);
      await animate(sy, ty, go);
      await animate(lift, 0, { duration: 0.1, ease: "easeIn" });
    }
    if (!s.alive) return;
    s.stamped = n + 1;
    setStamped(n + 1);
    if (!reduce) {
      await new Promise((r) => window.setTimeout(r, 130));
      await animate(lift, 1, { duration: 0.16, ease: "easeOut" });
      const home = { type: "spring", stiffness: 120, damping: 17 } as const;
      animate(turn, now.restTurn, home);
      animate(sx, now.restX, home);
      animate(sy, now.restY, home);
      await animate(lift, 0.35, { duration: 0.5, delay: 0.25 });
    }
    s.busy = false;
    setBusy(false);
  }, [lift, reduce, slide, sx, sy, turn]);

  useEffect(() => {
    const s = live.current;
    s.alive = true;
    return () => {
      s.alive = false;
    };
  }, []);

  // the card settles the last little way as the page loads, then the dater works down the list by itself
  useEffect(() => {
    if (reduce) return;
    const settle = animate(cardY, -OUT, { type: "spring", stiffness: 120, damping: 11, delay: 0.25 });
    let timer = 0;
    const tick = () => {
      const s = live.current;
      if (s.touched) return;
      if (!s.paused && !document.hidden) stamp();
      timer = window.setTimeout(tick, s.stamped >= dates.length ? 3200 : 2500);
    };
    timer = window.setTimeout(tick, 2750);
    return () => {
      settle.stop();
      window.clearTimeout(timer);
    };
  }, [cardY, reduce, stamp]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    if (!wrap || !scene) return;
    const measure = () => {
      const isTall = wrap.clientWidth < 700;
      const now = isTall ? TALL : WIDE;
      setTall(isTall);
      if (!live.current.busy) {
        sx.set(now.restX);
        sy.set(now.restY);
        turn.set(now.restTurn);
      }
      const sc = Math.min(1.06, wrap.clientWidth / now.W);
      wrap.style.height = `${Math.round(now.H * sc)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [sx, sy, turn]);

  const hand = () => (live.current.touched = true);
  const full = stamped >= dates.length;
  const next = dates[Math.min(stamped, dates.length - 1)];
  const cardX = L.px + (PW - CW) / 2;
  const paper = { backgroundColor: manila, backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0) 45%, rgba(120,80,20,0.14)), ${fibre}` } as const;

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: STAGE }} onPointerEnter={() => (live.current.paused = true)}
      onPointerMove={(e) => {
        if (reduce || e.pointerType === "touch") return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set(((e.clientX - r.left) / r.width) * 2 - 1);
        py.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => {
        live.current.paused = false;
        px.set(0);
        py.set(0);
      }}
      onFocus={() => (live.current.paused = true)} onBlur={() => (live.current.paused = false)}>
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <filter id={INK_FILTER} x="-6%" y="-25%" width="112%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="rough" />
          <feDisplacementMap in="SourceGraphic" in2="rough" scale="1.15" xChannelSelector="R" yChannelSelector="G" result="bitten" />
          <feTurbulence type="fractalNoise" baseFrequency="0.09 0.3" numOctaves="2" seed="11" result="blot" />
          <feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -0.3" result="patchy" />
          <feComposite in="bitten" in2="patchy" operator="in" />
        </filter>
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(75% 70% at 42% 34%, #dedcf6 0%, #c9c6ea 52%, #a9a5d2 100%)" }} />
      <div ref={wrapRef} className="relative mx-auto w-full overflow-hidden" style={{ height: WIDE.H }}>
        <div ref={sceneRef} className="absolute left-1/2 top-0 select-none" style={{ width: L.W, height: L.H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "1500px", perspectiveOrigin: "50% 45%" }}>
         <motion.div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: `${L.px + PW / 2}px 400px`, rotateX: reduce ? 0 : tipX, rotateY: reduce ? 0 : tipY }}>
          {/* shadow the whole pocket throws on the table */}
          <div aria-hidden="true" className="absolute rounded-[10px]" style={{ left: L.px + 12, top: BACK_Y + 18, width: PW - 6, height: FLOOR - BACK_Y - 14, background: "rgba(40,30,90,0.5)", filter: "blur(16px)" }} />
          <div aria-hidden="true" className="absolute rounded-[6px]" style={{ left: L.px + 3, top: BACK_Y + 4, width: PW, height: FLOOR - BACK_Y, background: "rgba(40,30,90,0.45)", filter: "blur(5px)" }} />
          {/* back of the pocket */}
          <div aria-hidden="true" className="absolute rounded-t-[7px] rounded-b-[3px]" style={{ left: L.px, top: BACK_Y, width: PW, height: FLOOR - BACK_Y, transform: "translateZ(1px)", ...paper, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 0 0 1px rgba(120,80,20,0.18)" }}>
            <div className="absolute inset-x-0 top-0 h-[80px]" style={{ background: "linear-gradient(180deg, rgba(90,60,10,0) 0, rgba(90,60,10,0.32) 100%)" }} />
          </div>

          {/* the card, cut off where it passes the glued bottom of the pocket */}
          <div className="pointer-events-none absolute left-0 overflow-hidden" style={{ top: -120, width: L.W, height: FLOOR + 120 - 5, transform: "translateZ(5px)" }}>
          <motion.div
            className="pointer-events-auto absolute cursor-grab touch-none active:cursor-grabbing"
            style={{ left: cardX, top: CARD_IN + 120, width: CW, height: CH, y: cardY }}
            drag={reduce ? false : "y"}
            dragConstraints={{ top: -OUT, bottom: 0 }}
            dragElastic={0.06}
            dragMomentum={false}
            onDragStart={hand}
            onDragEnd={(_, info) => slide(cardY.get() + info.velocity.y * 0.18 < -OUT / 2)}
          >
            <div className="absolute inset-0 rounded-[4px]" style={{ backgroundColor: "#f3ead3", backgroundImage: `linear-gradient(120deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 40%, rgba(120,90,30,0.1)), ${fibre}`, boxShadow: "inset 0 0 0 1px rgba(120,90,40,0.2), inset 0 1px 0 rgba(255,255,255,0.8), 3px 4px 7px rgba(60,40,10,0.3), 1px 1px 1px rgba(60,40,10,0.25)" }}>
              <div className="px-[14px] pt-[13px] text-center">
                <p className="font-serif text-[9px] uppercase tracking-[0.3em] text-[#a3261b]">{library.name}</p>
                <p className="mt-[5px] font-serif text-[17px] italic leading-none text-[#2c2620]">{library.card}</p>
              </div>
              <div className="absolute inset-x-0 border-y-[1.5px] border-[#b23a2e]/80" style={{ top: HEAD - 21, height: 21 }}>
                <span className="absolute left-0 top-0 flex h-full w-[106px] items-center justify-center font-serif text-[8px] font-semibold uppercase tracking-[0.26em] text-[#a3261b]">Date</span>
                <span className="absolute left-[116px] top-0 flex h-full items-center font-serif text-[8px] font-semibold uppercase tracking-[0.26em] text-[#a3261b]">What is on</span>
              </div>
              <div aria-hidden="true" className="absolute bottom-0 w-px bg-[#b23a2e]/70" style={{ left: 106, top: HEAD - 21 }} />
              <ol className="absolute inset-x-0" style={{ top: HEAD }}>
                {dates.map((d, i) => (
                  <li key={d.date} className="relative border-b border-[#7f9fc4]/60" style={{ height: ROW }}>
                    <span className="absolute left-0 top-0 flex h-full w-[106px] items-center justify-center">
                      {i < stamped ? (
                        <span className="library-date-due-struck block whitespace-nowrap font-mono text-[12.5px] font-bold tracking-[0.02em]" style={{ color: INKS[d.ink], transform: `translate(${d.dx}px, ${d.dy}px) rotate(${d.turn}deg)`, filter: `url(#${INK_FILTER})`, mixBlendMode: "multiply" }}>
                          {d.date}
                        </span>
                      ) : (
                        <span className="sr-only">Date to be announced</span>
                      )}
                    </span>
                    <span className="absolute left-[116px] right-[8px] top-0 flex h-full flex-col justify-center font-mono leading-none text-[#2b2925]">
                      <span className="text-[11px] font-semibold tracking-[-0.01em]">{d.what}</span>
                      <span className="mt-[4px] text-[8.5px] text-[#5d564b]">{d.where}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => {
                  hand();
                  slide(!out);
                }}
                aria-expanded={out}
                aria-label={out ? "Tuck the card back into its pocket" : "Pull the card out of its pocket"}
                className="absolute inset-x-0 top-0 h-[52px] cursor-pointer rounded-t-[4px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#43349a]"
              />
            </div>
          </motion.div>
          </div>

          {/* front of the pocket: a thumb notch cut in its top edge, glued down both sides */}
          <div aria-hidden="true" className="pointer-events-none absolute" style={{ left: L.px, top: FRONT_Y, width: PW, height: FLOOR - FRONT_Y, transform: "translateZ(10px)", filter: "drop-shadow(0 -1px 1px rgba(70,45,5,0.4)) drop-shadow(0 -3px 5px rgba(70,45,5,0.18))" }}>
            <div className="absolute inset-0 rounded-b-[3px]" style={{ ...paper, WebkitMaskImage: "radial-gradient(circle 31px at 50% -3px, rgba(0,0,0,0) 30px, #000 31px)", maskImage: "radial-gradient(circle 31px at 50% -3px, rgba(0,0,0,0) 30px, #000 31px)" }}>
              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(120,80,20,0.2) 0, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0) 12px, rgba(120,80,20,0.16) 13px, rgba(0,0,0,0) 15px, rgba(0,0,0,0) calc(100% - 15px), rgba(120,80,20,0.16) calc(100% - 13px), rgba(255,255,255,0) calc(100% - 12px), rgba(90,60,10,0.25) 100%)" }} />
              <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0))" }} />
              <div className="absolute inset-x-0 bottom-0 h-[16px]" style={{ background: "linear-gradient(0deg, rgba(90,60,10,0.3), rgba(90,60,10,0))" }} />
              <div className="absolute inset-x-[30px] top-[50px] text-center text-[#3a2a12]" style={{ mixBlendMode: "multiply" }}>
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="mx-auto">
                  <circle cx="15" cy="15" r="13.5" stroke="currentColor" strokeWidth="1" />
                  <path d="M8 20V11l7-3 7 3v9M8 20h14M12 20v-6M15 20v-6M18 20v-6" stroke="currentColor" strokeWidth="1" />
                </svg>
                <p className="mt-[9px] font-serif text-[12.5px] uppercase tracking-[0.24em]">{library.name}</p>
                <div className="mx-auto mt-[9px] h-px w-[150px] bg-[#3a2a12]/60" />
                <p className="mx-auto mt-[9px] max-w-[220px] font-serif text-[10.5px] italic leading-[1.5]">A date is stamped on this card each time an evening is announced. Please leave it in the pocket.</p>
              </div>
              <span className="absolute right-[20px] top-[14px] font-mono text-[10px] font-bold tracking-[0.12em] text-[#a3261b]" style={{ mixBlendMode: "multiply" }}>
                {library.number}
              </span>
            </div>
          </div>

          {/* the dater, seen from straight above */}
          <motion.div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 rounded-[14px] bg-[#1f1750]" style={{ width: SW, height: SH, transform: shade, filter: shadeBlur, opacity: shadeFade }} />
          <motion.button
            type="button"
            onClick={() => {
              hand();
              stamp();
            }}
            aria-disabled={busy}
            aria-label={full ? "Put this card away and start a new one" : `Stamp the next date, ${next.date}, ${next.what}`}
            className="absolute left-0 top-0 block cursor-pointer rounded-[13px] outline-none focus-visible:ring-[3px] focus-visible:ring-[#43349a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#c9c6ea]"
            style={{ width: SW, height: SH, transform: body, backgroundColor: "#17171a", backgroundImage: "linear-gradient(180deg, #4a4a52 0%, #26262b 12%, #141417 55%, #0a0a0c 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 3px rgba(0,0,0,0.8), inset 2px 0 2px rgba(255,255,255,0.08), inset -2px 0 3px rgba(0,0,0,0.6), 0 0 0 1px #050506, 0 0 0 4px #1b1b1f, 0 0 0 5px #000, 0 1px 0 5px rgba(255,255,255,0.18)" }}
          >
            {/* ridged grips at either end */}
            {[0, 1].map((side) => (
              <span key={side} aria-hidden="true" className="absolute inset-y-[9px] w-[13px] rounded-[3px]" style={{ [side ? "right" : "left"]: 6, backgroundImage: "repeating-linear-gradient(180deg, #050506 0 1.5px, #3c3c44 1.5px 2.5px, #1c1c20 2.5px 4px)", boxShadow: "inset 0 0 2px rgba(0,0,0,0.9)" }} />
            ))}
            {/* four knurled wheels that set day, month and year */}
            <span aria-hidden="true" className="absolute left-1/2 top-[7px] flex -translate-x-1/2 gap-[5px]">
              {[0, 1, 2, 3].map((w) => (
                <span key={w} className="block h-[11px] w-[19px] rounded-[2px]" style={{ backgroundImage: "repeating-linear-gradient(90deg, #6f7178 0 1px, #e9eaee 1px 2px, #9b9da5 2px 3px), linear-gradient(180deg, rgba(255,255,255,0.5), rgba(0,0,0,0.3))", backgroundBlendMode: "multiply, normal", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 1px rgba(0,0,0,0.6), 0 1px 1px rgba(0,0,0,0.8)" }} />
              ))}
            </span>
            {/* the index window: a paper slip under clear plastic that shows what it will print */}
            <span aria-hidden="true" className="absolute left-1/2 top-[25px] flex h-[34px] w-[104px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-[4px] bg-[#f1ead8]" style={{ boxShadow: "inset 0 2px 3px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1.5px #050506" }}>
              <span className="font-mono text-[12px] font-bold tracking-[0.04em]" style={{ color: INKS.violet }}>
                {full ? "NEW CARD" : next.date}
              </span>
              <span className="absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.1) 26%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.12) 100%)" }} />
            </span>
            {/* a dot of the ink it is loaded with, and the long reflection of the lamp across its gloss top */}
            <span aria-hidden="true" className="absolute bottom-[5px] left-1/2 h-[5px] w-[22px] -translate-x-1/2 rounded-full" style={{ backgroundColor: INKS.violet, boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5), 0 0 0 1px #050506" }} />
            <span aria-hidden="true" className="absolute inset-0 rounded-[13px]" style={{ background: "linear-gradient(108deg, rgba(255,255,255,0) 18%, rgba(255,255,255,0.16) 24%, rgba(255,255,255,0.03) 34%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.07) 78%, rgba(255,255,255,0) 84%)" }} />
            <span aria-hidden="true" className="absolute inset-x-[16px] top-[2px] h-[5px] rounded-full" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.15) 70%, rgba(255,255,255,0))" }} />
          </motion.button>
         </motion.div>
        </div>
      </div>

      <div className="relative flex items-end justify-between gap-4 px-5 pb-5 sm:px-8 sm:pb-7">
        <p aria-live="polite" className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#3f3a75]">
          <span className="text-[#17143a]">
            {stamped} of {dates.length} dates stamped
          </span>
          <span className="block">{full ? "Card full: press the stamp for a new one" : `Next: ${next.what}`}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            hand();
            stamp();
          }}
          aria-disabled={busy}
          className="min-h-[40px] shrink-0 rounded-full border border-[#17143a]/40 bg-white/40 px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[#17143a] outline-none transition-colors hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-[#17143a]"
        >
          {full ? "New card" : "Stamp next"}
        </button>
      </div>
      <style>{`@keyframes library-date-due-card-strike { 0% { opacity: 0; } 100% { opacity: 1; } }
.library-date-due-struck { animation: library-date-due-card-strike 60ms linear both; }
@media (prefers-reduced-motion: reduce) { .library-date-due-struck { animation: none; } }`}</style>
    </section>
  );
}
