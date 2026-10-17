import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** One photograph holds all nine doughnuts. `x` and `y` are each doughnut's centre as a fraction of the picture's width. */
const PHOTO = "https://images.pexels.com/photos/18717492/pexels-photo-18717492.jpeg?auto=compress&cs=tinysrgb&w=1600";
const CROP = 0.074; // radius of paper kept round each doughnut, as a fraction of the picture's width
const doughnuts = [
  { name: "Dark chocolate, vanilla drizzle", price: 2.9, x: 0.158, y: 0.109, paper: "#e0b8d3" },
  { name: "Cookies and cream crumb", price: 3.1, x: 0.501, y: 0.112, paper: "#a9cadb" },
  { name: "Cinnamon sugar", price: 2.4, x: 0.837, y: 0.101, paper: "#dfb8d3" },
  { name: "Peanut brittle, cocoa stripe", price: 3.1, x: 0.162, y: 0.333, paper: "#a9cadb" },
  { name: "Coconut and white icing, filled", price: 3.3, x: 0.494, y: 0.329, paper: "#e0b8d3" },
  { name: "Original glazed", price: 2.2, x: 0.837, y: 0.328, paper: "#aac9db" },
  { name: "Brown sugar crumble", price: 2.6, x: 0.164, y: 0.555, paper: "#dfb8d3" },
  { name: "Caramel and chocolate curls", price: 3.3, x: 0.501, y: 0.556, paper: "#a9cadb" },
  { name: "Rocky road", price: 3.4, x: 0.837, y: 0.555, paper: "#e0b8d3" },
];
const shop = { name: "Sunday Ring Co.", line: "Nine to a box, fried this morning", currency: "£" };
const START = [1, 3, 8]; // lifted when the page loads
const DEMO = [4, 1, 6, 3, -1, 2, 8, 5, -1, 0]; // doughnuts the demo toggles in turn; -1 slides the lid on and off again
const STEP_MS = 1500;

// Design pixels
const OUT = 492; // outside of the box
const RIM = 9; // thickness of the card walls seen from above
const DIV = 6; // divider strips
const CELL = (OUT - RIM * 2 - DIV * 2) / 3;
const DISC = 134; // photographed paper round
const CASE = 152; // fluted paper case under it
const LID = OUT + 26;
const WINDOW = 58; // lid border round the cellophane
const LID_RED = "#d63f68";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function DoughnutBoxGrid() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ wide: true, sc: 1 });
  const [open, setOpen] = useState(true);
  const [chosen, setChosen] = useState<number[]>(START);
  const [last, setLast] = useState(START[START.length - 1]);
  const touched = useRef(false);

  const sceneW = view.wide ? 1130 : OUT + 56;
  const sceneH = view.wide ? 640 : Math.round(OUT * 1.5);
  const boxLeft = view.wide ? 56 : 28;
  const boxTop = view.wide ? (640 - OUT) / 2 : 34;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const wide = w >= 940;
      setView({ wide, sc: clamp(w / (wide ? 1130 : OUT + 56), 0.5, 1) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toggle = (i: number) => {
    setLast(i);
    setChosen((c) => (c.includes(i) ? c.filter((k) => k !== i) : [...c, i]));
  };

  useEffect(() => {
    if (reduce) return;
    let k = 0;
    let reopen = 0;
    const loop = window.setInterval(() => {
      if (touched.current || document.hidden) return;
      const d = DEMO[k % DEMO.length];
      k += 1;
      if (d < 0) {
        setOpen(false);
        reopen = window.setTimeout(() => !touched.current && setOpen(true), STEP_MS * 1.2);
      } else toggle(d);
    }, STEP_MS + 1100);
    return () => {
      window.clearInterval(loop);
      window.clearTimeout(reopen);
    };
  }, [reduce]);

  const bgW = DISC / (2 * CROP);
  const total = chosen.reduce((t, k) => t + doughnuts[k].price, 0);
  const lidAt = open ? (view.wide ? { x: OUT + 22, y: 4, rotate: 6 } : { x: 36, y: OUT * 0.95, rotate: -5 }) : { x: -13, y: -13, rotate: 0 };
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 120, damping: 17, mass: 1.1 };

  return (
    <section className="relative overflow-hidden bg-[#f1c84f]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 70% at 36% 30%, #f9dc7c 0%, #f1c84f 52%, #dfae2f 100%)" }} />
      <div ref={wrapRef} className="relative mx-auto w-full overflow-hidden" style={{ height: Math.round(sceneH * view.sc) + (view.wide ? 40 : 0) }}>
        <div className="absolute left-1/2 top-0 select-none" style={{ width: sceneW, height: sceneH, transformOrigin: "50% 0", transform: `translateX(-50%) scale(${view.sc.toFixed(4)})`, marginTop: view.wide ? 20 : 0 }}>
          <div className="absolute" style={{ left: boxLeft, top: boxTop, width: OUT, height: OUT }}>
            <img src={PHOTO} alt="Nine different ring doughnuts laid out in three rows on pink and blue paper, seen from above" className="sr-only" />
            {/* shadow on the table */}
            <div aria-hidden="true" className="absolute rounded-[10px]" style={{ left: 16, top: 24, width: OUT, height: OUT, background: "rgba(110,62,0,0.55)", filter: "blur(26px)" }} />
            <div aria-hidden="true" className="absolute rounded-[6px]" style={{ left: 4, top: 6, width: OUT, height: OUT, background: "rgba(90,50,0,0.5)", filter: "blur(5px)" }} />
            {/* the box: card walls seen edge on, then the floor a long way down in their shadow */}
            <div aria-hidden="true" className="absolute inset-0 rounded-[5px]" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f6f1e7 60%, #e6dece 100%)", boxShadow: "inset 0 0 0 1px rgba(120,90,50,0.22), inset 1.5px 1.5px 0 #ffffff" }} />
            <div aria-hidden="true" className="absolute rounded-[2px]" style={{ inset: RIM, background: "#e9e0d0", boxShadow: "inset 0 0 0 1px rgba(90,60,30,0.28), inset 18px 24px 30px rgba(90,56,20,0.5), inset -4px -5px 9px rgba(255,255,255,0.55)" }} />

            {doughnuts.map((d, i) => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              const cx = RIM + col * (CELL + DIV) + CELL / 2;
              const cy = RIM + row * (CELL + DIV) + CELL / 2;
              const up = open && chosen.includes(i);
              return (
                <div key={d.name} className="absolute" style={{ left: cx - CASE / 2, top: cy - CASE / 2, width: CASE, height: CASE }}>
                  {/* fluted paper case */}
                  <div aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: "repeating-conic-gradient(from 0deg, #ffffff 0deg 4.5deg, #ded4c2 4.5deg 6deg, #f4eee2 6deg 9deg)", boxShadow: "3px 5px 7px rgba(80,50,20,0.38), inset 0 0 0 1px rgba(120,95,60,0.25)" }} />
                  <div aria-hidden="true" className="absolute rounded-full" style={{ inset: (CASE - DISC) / 2 - 1, background: d.paper, boxShadow: "inset 5px 7px 10px rgba(60,30,50,0.35), 0 0 0 1px rgba(90,60,40,0.18)" }} />
                  <motion.button
                    type="button"
                    disabled={!open}
                    aria-pressed={chosen.includes(i)}
                    aria-label={`${d.name}, ${shop.currency}${d.price.toFixed(2)}${chosen.includes(i) ? ", in your box" : ""}`}
                    onClick={() => {
                      touched.current = true;
                      toggle(i);
                    }}
                    onFocus={() => setLast(i)}
                    onPointerEnter={() => setLast(i)}
                    initial={false}
                    animate={{ scale: up ? 1.1 : 1, x: up ? -5 : 0, y: up ? -8 : 0, rotate: up ? (i % 2 ? 7 : -6) : 0, boxShadow: up ? "14px 20px 14px rgba(70,38,8,0.5), 3px 4px 3px rgba(70,38,8,0.35)" : "0px 0px 0px rgba(80,44,10,0), 0px 0px 0px rgba(80,44,10,0)" }}
                    whileHover={reduce || up ? undefined : { scale: 1.05, y: -2 }}
                    whileTap={reduce ? undefined : { scale: up ? 1.1 : 0.97 }}
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 13, mass: 0.9 }}
                    className="absolute cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-[#1e3a8a] disabled:cursor-default"
                    style={{ left: (CASE - DISC) / 2, top: (CASE - DISC) / 2, width: DISC, height: DISC, zIndex: up ? 2 : 1, backgroundColor: d.paper, backgroundImage: `url(${PHOTO})`, backgroundSize: `${bgW.toFixed(1)}px auto`, backgroundPosition: `${(DISC / 2 - d.x * bgW).toFixed(1)}px ${(DISC / 2 - d.y * bgW).toFixed(1)}px` }}
                  />
                </div>
              );
            })}

            {/* divider strips of card, lit from the top left */}
            {[1, 2].map((k) => (
              <div key={`v${k}`} aria-hidden="true" className="pointer-events-none absolute" style={{ left: RIM + k * CELL + (k - 1) * DIV, top: RIM, width: DIV, height: OUT - RIM * 2, background: "linear-gradient(90deg, #ffffff, #f1eadc)", boxShadow: "7px 0 9px rgba(90,56,20,0.3), 0 0 0 0.5px rgba(120,90,50,0.35)" }} />
            ))}
            {[1, 2].map((k) => (
              <div key={`h${k}`} aria-hidden="true" className="pointer-events-none absolute" style={{ top: RIM + k * CELL + (k - 1) * DIV, left: RIM, height: DIV, width: OUT - RIM * 2, background: "linear-gradient(180deg, #ffffff, #f1eadc)", boxShadow: "0 8px 9px rgba(90,56,20,0.3), 0 0 0 0.5px rgba(120,90,50,0.35)" }} />
            ))}

            {/* the lid: printed card with a cellophane window */}
            <motion.button
              type="button"
              aria-expanded={open}
              aria-label={open ? "Slide the lid back onto the box" : "Slide the lid off the box"}
              onClick={() => {
                touched.current = true;
                setOpen((o) => !o);
              }}
              initial={false}
              animate={lidAt}
              transition={spring}
              className="absolute left-0 top-0 z-10 block cursor-pointer rounded-[7px] outline-none focus-visible:ring-4 focus-visible:ring-[#1e3a8a]"
              style={{ width: LID, height: LID, filter: "drop-shadow(10px 16px 14px rgba(100,54,0,0.42)) drop-shadow(2px 3px 2px rgba(80,40,0,0.35))" }}
            >
              <span className="absolute inset-0 overflow-hidden rounded-[7px]">
                <span className="absolute rounded-[26px]" style={{ inset: WINDOW, boxShadow: `0 0 0 600px ${LID_RED}` }} />
                {/* paper grain and light across the card */}
                <span className="absolute inset-0" style={{ background: "linear-gradient(128deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 34%, rgba(0,0,0,0) 62%, rgba(60,0,20,0.2) 100%)", WebkitMaskImage: `linear-gradient(#000,#000)`, mixBlendMode: "soft-light" }} />
                <span className="absolute inset-0 rounded-[7px]" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.28), inset 2px 2px 1px rgba(255,255,255,0.35), inset -2px -3px 2px rgba(80,0,24,0.4)" }} />
                {/* cellophane */}
                <span className="absolute rounded-[26px]" style={{ inset: WINDOW, background: "linear-gradient(118deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 13%, rgba(255,255,255,0.03) 30%, rgba(255,255,255,0.32) 41%, rgba(255,255,255,0.05) 47%, rgba(255,255,255,0.02) 70%, rgba(255,255,255,0.24) 84%, rgba(255,255,255,0.06) 100%)", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.6), inset 4px 5px 7px rgba(70,0,20,0.4), inset -1px -1px 2px rgba(255,255,255,0.4)" }} />
                <span className="absolute inset-x-0 top-0 grid place-items-center text-[19px] font-black uppercase tracking-[0.26em] text-[#fff4e4]" style={{ height: WINDOW }}>
                  {shop.name}
                </span>
                <span className="absolute inset-x-0 bottom-0 grid place-items-center font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-[#fff4e4]" style={{ height: WINDOW }}>
                  {shop.line}
                </span>
              </span>
            </motion.button>
          </div>
        </div>

      </div>
      <p className="relative px-5 pb-6 pt-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#5a3c00] sm:px-8 sm:pb-8" aria-live="polite">
        <span className="font-semibold text-[#2a1c00]">
          {chosen.length} in your box · {shop.currency}
          {total.toFixed(2)}
        </span>
        <span className="block">
          {doughnuts[last].name} · {shop.currency}
          {doughnuts[last].price.toFixed(2)}
        </span>
      </p>
    </section>
  );
}
