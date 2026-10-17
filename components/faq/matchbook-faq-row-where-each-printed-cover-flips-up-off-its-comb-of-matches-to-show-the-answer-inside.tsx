import { useEffect, useId, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

type Motif = "sun" | "arcs" | "check" | "bars" | "moon" | "slant";
/** The bar, and one matchbook per question: cover colour, ink, the colour of the match heads and the printed motif. */
const bar = { name: "The Lantern Room", line: "Close cover before striking" };
const books: { q: string; a: string; cover: string; ink: string; head: string; motif: Motif }[] = [
  { q: "Do we need to book?", a: "Not at the bar or the six stools by the window. For a table after eight on a Friday or Saturday, book online or ring us after four.", cover: "#d8432b", ink: "#fff1d8", head: "#f4ead2", motif: "sun" },
  { q: "How late are you open?", a: "Until one, Tuesday to Saturday. Last orders are called at half past twelve and the kitchen hatch closes at eleven.", cover: "#e5a91f", ink: "#1b1510", head: "#c8321f", motif: "arcs" },
  { q: "Anything without alcohol?", a: "A whole page of it. Five drinks built from our own cordials and teas, made with the same care and served in the same glasses.", cover: "#14573f", ink: "#f3e7c6", head: "#e8b63c", motif: "check" },
  { q: "Can we bring a big group?", a: "Up to twelve fit in the back snug. Write to us a week ahead and we will hold it for you and set out the long table.", cover: "#efe4cb", ink: "#1c2957", head: "#1c2957", motif: "bars" },
  { q: "Is there a dress code?", a: "No. Come as you are, from work or from the allotment. We only ask that hats come off at the bar so Ada can see who is ordering.", cover: "#2548ad", ink: "#f6ecd4", head: "#f4ead2", motif: "moon" },
  { q: "Do you serve food?", a: "Small plates until eleven: toasties, pickles, a cheese board and whatever the bakery next door had left at closing.", cover: "#ee9bb0", ink: "#57101f", head: "#201418", motif: "slant" },
];

const TOUR = [2, 0, 5, 3, 1, 4]; // the order the row opens its own books in while nobody is touching it
const REST = 171; // degrees an open cover lies back at: card is springy and never goes quite flat
const STICKS = 10;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const svgUrl = (body: string, w: number, h: number) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`)}")`;
const CARD = svgUrl(`<filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.05  0 0 0 0.75 -0.24'/></filter><rect width='200' height='200' filter='url(#p)'/>`, 200, 200);
const GRIT = svgUrl(`<filter id='s'><feTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.85  0 0 0 0 0.7  0 0 0 0 0.55  0 0 0 2.4 -1.25'/></filter><rect width='120' height='120' filter='url(#s)'/>`, 120, 120);
// how each book was dropped on the bar
const LAY = [
  { r: -1.1, y: 4 },
  { r: 0.8, y: -3 },
  { r: -0.5, y: 6 },
  { r: 1.2, y: 0 },
  { r: -0.9, y: -4 },
  { r: 0.6, y: 5 },
];

/** What is printed across the lower part of the cover, drawn with gradients in the cover's ink. */
function motif(kind: Motif, ink: string): React.CSSProperties {
  switch (kind) {
    case "sun":
      return { backgroundImage: `radial-gradient(circle at 50% 100%, ${ink} 0 30%, rgba(0,0,0,0) 30.8%), repeating-conic-gradient(from -90deg at 50% 100%, ${ink} 0 6deg, rgba(0,0,0,0) 6deg 15deg)` };
    case "arcs":
      return { backgroundImage: `repeating-radial-gradient(circle at 50% 118%, ${ink} 0 5px, rgba(0,0,0,0) 5px 13px)` };
    case "check":
      return { backgroundImage: `conic-gradient(${ink} 25%, rgba(0,0,0,0) 0 50%, ${ink} 0 75%, rgba(0,0,0,0) 0)`, backgroundSize: "24px 24px" };
    case "bars":
      return { backgroundImage: `repeating-linear-gradient(90deg, ${ink} 0 9px, rgba(0,0,0,0) 9px 18px)` };
    case "moon":
      return { backgroundImage: `radial-gradient(circle at 68% 62%, ${ink} 0 27px, rgba(0,0,0,0) 27.8px), radial-gradient(circle at 24% 30%, ${ink} 0 2px, rgba(0,0,0,0) 2.6px), radial-gradient(circle at 40% 74%, ${ink} 0 1.6px, rgba(0,0,0,0) 2.2px), radial-gradient(circle at 12% 66%, ${ink} 0 1.4px, rgba(0,0,0,0) 2px)` };
    default:
      return { backgroundImage: `repeating-linear-gradient(-52deg, ${ink} 0 7px, rgba(0,0,0,0) 7px 17px)` };
  }
}

function Matchbook({ i, open, onPick, reduce, uid }: { i: number; open: boolean; onPick: () => void; reduce: boolean; uid: string }) {
  const b = books[i];
  const angle = useMotionValue(open ? REST : 0);
  const started = useRef(false);

  useEffect(() => {
    if (reduce) {
      angle.set(open ? REST : 0);
      return;
    }
    if (!started.current) {
      // first paint: books that start open let their covers bob once
      started.current = true;
      if (!open) return;
      const bob = animate(angle, [REST, REST - 30, REST], { duration: 1, delay: 0.6 + i * 0.12, ease: "easeInOut" });
      return () => bob.stop();
    }
    const run = animate(angle, open ? REST : 0, open ? { type: "spring", stiffness: 150, damping: 12.5, mass: 1 } : { type: "spring", stiffness: 230, damping: 24 });
    return () => run.stop();
  }, [angle, i, open, reduce]);

  const flip = useTransform(angle, (v) => `rotateX(${clamp(v, 0, 178).toFixed(2)}deg)`);
  const frontShade = useTransform(angle, (v) => clamp(v / 90, 0, 1) * 0.5);
  const backShade = useTransform(angle, (v) => clamp((REST - v) / 80, 0, 1) * 0.42);
  const inside = useTransform(angle, (v) => (v > 88 ? "visible" : "hidden"));
  const thrown = useTransform(angle, (v) => clamp((v - 96) / 70, 0, 1) * 0.62);
  const lifted = useTransform(angle, (v) => Math.sin((clamp(v, 0, 180) * Math.PI) / 180) * 0.55);
  const light = b.ink.toLowerCase() > "#8";

  return (
    <div className="relative mx-auto w-full max-w-[184px] text-[15px] sm:text-[17px]" style={{ transform: `translateY(${LAY[i].y}px) rotate(${LAY[i].r}deg)`, perspective: 950, perspectiveOrigin: "50% 62%" }}>
      {/* empty bar top the cover falls back onto */}
      <div aria-hidden="true" className="relative aspect-[184/170]">
        <motion.div className="absolute inset-x-1 bottom-0 top-3 rounded-[4px] bg-black" style={{ opacity: thrown, filter: "blur(9px)" }} />
      </div>

      <div className="relative">
        <div aria-hidden="true" className="absolute -inset-x-1 -bottom-2 top-2 rounded-[6px] bg-black" style={{ opacity: 0.75, filter: "blur(11px)", transform: "translateY(9px)" }} />
        <motion.div aria-hidden="true" className="absolute inset-x-0 top-0 h-full rounded-[4px] bg-black" style={{ opacity: lifted, filter: "blur(14px)", transform: "translateY(18px) scale(1.05)" }} />

        {/* inside the book: the back card and two combs of matches */}
        <div aria-hidden="true" className="relative aspect-[184/170] overflow-hidden rounded-t-[3px]" style={{ background: "#cfc2a6", backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.55) 0, rgba(0,0,0,0.16) 9%, rgba(0,0,0,0) 26%, rgba(0,0,0,0.25) 100%), ${CARD}`, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)" }}>
          {[1, 0].map((row) => (
            <div key={row} className="absolute bottom-0 flex justify-between" style={{ left: row ? "9%" : "5.5%", right: row ? "5.5%" : "9%", top: row ? "13%" : "24%", filter: row ? "brightness(0.74)" : "drop-shadow(0 3px 3px rgba(0,0,0,0.55))" }}>
              {Array.from({ length: STICKS }, (_, k) => (
                <span key={k} className="relative block h-full" style={{ width: `${80 / STICKS}%`, background: "linear-gradient(90deg, #a98a55 0%, #ecd9ab 26%, #f7e9c4 52%, #d2b982 82%, #8f7343 100%)", transform: `translateY(${[0, 3, -2, 2, 0, -3, 1, 3, -1, 2][(k + row * 3) % 10]}px)` }}>
                  <span className="absolute -inset-x-[22%] -top-[6px] block h-[21px] rounded-[48%_48%_42%_42%]" style={{ background: `radial-gradient(70% 60% at 36% 28%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 46%), radial-gradient(90% 90% at 50% 40%, ${b.head} 40%, rgba(0,0,0,0.55) 130%)`, backgroundColor: b.head, boxShadow: "0 1px 2px rgba(0,0,0,0.6), inset 0 -3px 3px rgba(0,0,0,0.3)" }} />
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* the cover: printed outside, answer inside, hinged along its top fold */}
        <motion.div className="absolute inset-x-0 top-0 aspect-[184/170]" style={{ transformOrigin: "50% 0", transformStyle: "preserve-3d", transform: flip }}>
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-t-[3px] rounded-b-[1px]" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: b.cover, color: b.ink }}>
            <div className="absolute inset-x-0 bottom-0 top-[60%]" style={{ ...motif(b.motif, b.ink), opacity: 0.94 }} />
            <div className="absolute inset-x-[9%] top-[8%]">
              <div className="flex items-baseline justify-between font-mono text-[0.44em] font-bold uppercase tracking-[0.16em]">
                <span>{bar.name}</span>
                <span>No. {i + 1}</span>
              </div>
              <div className="mt-[0.55em] h-[2px]" style={{ background: b.ink }} />
              <div className="mt-[0.5em] text-[1em] font-black uppercase leading-[1.02] tracking-[-0.01em]">{b.q}</div>
            </div>
            <div className="absolute inset-[5px] rounded-[1px]" style={{ border: `1.5px solid ${b.ink}`, opacity: 0.9 }} />
            <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.12) 4px, rgba(255,255,255,0) 14px), linear-gradient(118deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 34%, rgba(0,0,0,0) 64%, rgba(0,0,0,0.2) 100%), ${CARD}`, boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.35)" }} />
            <motion.div className="absolute inset-0 bg-black" style={{ opacity: frontShade }} />
          </div>
          <motion.div
            id={`${uid}-a${i}`}
            role="region"
            aria-labelledby={`${uid}-q${i}`}
            onClick={onPick}
            className="absolute inset-0 cursor-pointer overflow-hidden rounded-t-[3px] rounded-b-[1px] text-[#221a14]"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateX(180deg)", visibility: inside, background: "#f6eeda", backgroundImage: `linear-gradient(180deg, rgba(60,40,10,0.12) 0, rgba(60,40,10,0) 12%, rgba(60,40,10,0) 84%, rgba(40,25,5,0.28) 100%), linear-gradient(112deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 45%)`, boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.2), inset 0 3px 0 ${b.cover}` }}
          >
            <div className="absolute inset-x-[9%] top-[9%]">
              <div className="flex items-baseline justify-between font-mono text-[0.44em] font-bold uppercase tracking-[0.16em]" style={{ color: light ? b.cover : b.ink }}>
                <span>Answer</span>
                <span aria-hidden="true">No. {i + 1}</span>
              </div>
              <p className="m-0 mt-[0.6em] text-[0.73em] font-medium leading-[1.36]">{b.a}</p>
            </div>
            <motion.div aria-hidden="true" className="absolute inset-0 bg-black" style={{ opacity: backShade }} />
          </motion.div>
        </motion.div>

        {/* the folded front flap: staple, striking strip */}
        <div aria-hidden="true" className="relative -mt-[5px] h-[31px] overflow-hidden rounded-b-[3px]" style={{ background: b.cover, boxShadow: "0 -2px 3px rgba(0,0,0,0.45), inset 0 0 0 0.5px rgba(0,0,0,0.35)" }}>
          <div className="absolute inset-x-0 bottom-[5px] h-[13px]" style={{ background: "#2a1b14", backgroundImage: GRIT, boxShadow: "inset 0 1px 0 rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.12)" }} />
          <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.45) 0, rgba(255,255,255,0) 4px, rgba(0,0,0,0) 80%, rgba(0,0,0,0.35) 100%), ${CARD}` }} />
          <span className="absolute left-1/2 top-[4px] block h-[3.5px] w-[26px] -translate-x-1/2 rounded-full" style={{ background: "linear-gradient(180deg, #ffffff, #a9adb3 55%, #5c6068)", boxShadow: "0 1px 1px rgba(0,0,0,0.6)" }} />
        </div>

        <h3 className="absolute inset-0 m-0">
          <button type="button" id={`${uid}-q${i}`} aria-expanded={open} aria-controls={`${uid}-a${i}`} onClick={onPick} className="block h-full w-full cursor-pointer rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#15110f]">
            <span className="sr-only">{b.q}</span>
          </button>
        </h3>
      </div>
    </div>
  );
}

export default function MatchbookFaq() {
  const reduce = !!useReducedMotion();
  const uid = useId();
  const [open, setOpen] = useState<number[]>([1, 4]);
  const idle = useRef({ touched: false, paused: false, step: 0 });

  // until someone touches it, the row opens the next book and shuts the oldest
  useEffect(() => {
    if (reduce) return;
    const s = idle.current;
    const t = window.setInterval(() => {
      if (s.touched || s.paused || document.hidden) return;
      const n = TOUR[s.step % TOUR.length];
      s.step += 1;
      setOpen((v) => [...v.filter((x) => x !== n).slice(-1), n]);
    }, 4000);
    return () => window.clearInterval(t);
  }, [reduce]);

  const pick = (i: number) => {
    idle.current.touched = true;
    setOpen((v) => (v.includes(i) ? v.filter((x) => x !== i) : [...v, i]));
  };

  return (
    <section className="relative overflow-hidden bg-[#15110f]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 70% at 50% 44%, #3a2a20 0%, #211813 46%, #0d0a09 100%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: CARD }} />
      <div onPointerEnter={() => (idle.current.paused = true)} onPointerLeave={() => (idle.current.paused = false)} onFocus={() => (idle.current.paused = true)} onBlur={() => (idle.current.paused = false)} className="relative mx-auto w-full max-w-[1280px] px-4 pb-28 pt-10 sm:px-6 sm:pt-16 xl:pb-40 xl:pt-28">
        <h2 className="sr-only">{bar.name}: questions and answers</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 sm:gap-x-6 xl:grid-cols-6 xl:gap-x-5">
          {books.map((_, i) => (
            <Matchbook key={i} i={i} open={open.includes(i)} onPick={() => pick(i)} reduce={reduce} uid={uid} />
          ))}
        </div>
        <p className="absolute bottom-5 left-5 m-0 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#b9a48c] sm:bottom-7 sm:left-8">
          <span className="text-[#fff1d8]">{bar.name}</span>
          <span className="block">Press a matchbook to lift its cover</span>
        </p>
      </div>
    </section>
  );
}
