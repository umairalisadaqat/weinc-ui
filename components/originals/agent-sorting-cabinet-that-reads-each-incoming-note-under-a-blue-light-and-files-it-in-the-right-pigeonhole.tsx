import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// One pigeonhole per kind of note. `pile` is how many notes it holds at load. The note
// is what the agent reads when it files one there: `key` is the phrase it marks in blue.
const holes = [
  { name: "Repairs", pile: 6, from: "Tomas", before: "My ", key: "back brake squeals", after: " on every hill." },
  { name: "Bookings", pile: 3, from: "Leona", before: "Could you fit in a full service on ", key: "Thursday morning", after: "?" },
  { name: "Quotes", pile: 5, from: "Idris", before: "", key: "How much", after: " to rebuild two wheels?" },
  { name: "Bills", pile: 2, from: "Northway Tyres", before: "", key: "Invoice 0412", after: " for the spring order is attached." },
  { name: "Parts", pile: 7, from: "Hub Supply", before: "Your ten ", key: "inner tubes ship", after: " on Monday." },
  { name: "Thanks", pile: 4, from: "Wren", before: "The bike rides like new. ", key: "Thank you", after: "!" },
];
const ORDER = [1, 3, 0, 5, 2, 4]; // the order notes arrive in
const HOLD_FIRST = 2800; // milliseconds the opening note stays up, so it is seen read and labelled
const HOLD = 1500; // milliseconds a labelled note waits before it is filed
const W = 520, H = 606; // design size; the whole cabinet scales to its box
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const STEEL = "conic-gradient(from 200deg,#f4f6f9,#8a919c,#ffffff,#69707b,#e3e6eb,#7d8590,#f4f6f9)";

type Phase = "rise" | "read" | "tag";
type Flight = { id: number; hole: number; to: number };
const holeX = (i: number) => 109 + (i % 3) * 151; // centre of a pigeonhole, in design pixels
const pileTop = (i: number, n: number) => 337 + Math.floor(i / 3) * 170 - Math.min(n, 12) * 4;
// Notes in a pile are never square to each other: a small fixed shuffle per sheet.
const nudge = (i: number, n: number) => ((i * 37 + n * 53) % 11) - 5;

export default function AgentSortingCabinet() {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [piles, setPiles] = useState(() => holes.map((h) => h.pile));
  const [note, setNote] = useState({ id: 0, hole: ORDER[0] });
  const [phase, setPhase] = useState<Phase>("tag");
  const [flight, setFlight] = useState<Flight | null>(null); // the note on its way into a pigeonhole
  const [fresh, setFresh] = useState(-1);
  const turn = useRef(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.getBoundingClientRect().width / W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The agent's routine: a note comes up, is read, is labelled, then filed while the next one comes up.
  useEffect(() => {
    if (reduce) return;
    const wait = phase === "rise" ? 620 : phase === "read" ? 950 : note.id === 0 ? HOLD_FIRST : HOLD;
    const t = window.setTimeout(() => {
      if (phase === "rise") setPhase("read");
      else if (phase === "read") setPhase("tag");
      else {
        setFlight({ id: note.id, hole: note.hole, to: pileTop(note.hole, piles[note.hole]) });
        turn.current += 1;
        setNote({ id: note.id + 1, hole: ORDER[turn.current % ORDER.length] });
        setPhase("rise");
      }
    }, wait);
    return () => window.clearTimeout(t);
  }, [phase, note, piles, reduce]);

  // A note in flight lands on its pile, which then shows one more sheet.
  useEffect(() => {
    if (!flight) return;
    const land = window.setTimeout(() => { setPiles((p) => p.map((n, i) => (i === flight.hole ? n + 1 : n))); setFresh(flight.hole); }, 440);
    const clear = window.setTimeout(() => setFlight(null), 560);
    return () => { window.clearTimeout(land); window.clearTimeout(clear); };
  }, [flight]);

  // Pressing a pigeonhole takes its newest note back out and stands it up to be read again.
  const takeOut = useCallback((i: number) => {
    // the note already standing goes into its own pigeonhole without ceremony
    setPiles((p) => p.map((n, j) => Math.max(0, n - (j === i ? 1 : 0) + (j === note.hole ? 1 : 0))));
    setFresh(-1);
    setNote((n) => ({ id: n.id + 1, hole: i }));
    setPhase(reduce ? "tag" : "rise");
  }, [note.hole, reduce]);

  const marked = phase !== "rise";
  const tagged = phase === "tag";
  const face = (hole: number, mark: boolean, tag: boolean, reading: boolean) => {
    const h = holes[hole];
    return (
      <>
        <p className="m-0 font-mono text-[9px] font-bold uppercase leading-none tracking-[0.22em] text-[#0B0D12]/55">From {h.from}</p>
        <p className="m-0 mt-[12px] text-[20px] font-extrabold leading-[25px] tracking-[-0.03em] text-[#0B0D12]">
          {h.before}
          <span className="relative inline-block whitespace-nowrap">
            <motion.span aria-hidden="true" initial={false} animate={{ scaleX: mark ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.34, delay: reading ? 0.42 : 0, ease: "easeOut" }} className="absolute inset-x-[-3px] bottom-[1px] top-[3px] origin-left rounded-[3px] bg-[#4F98FB]/35" />
            <span className="relative">{h.key}</span>
          </span>
          {h.after}
        </p>
        <motion.span initial={false} animate={tag ? { scale: 1, opacity: 1, rotate: -5 } : { scale: 1.7, opacity: 0, rotate: -12 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 22 }}
          className="absolute bottom-[26px] right-[18px] rounded-[5px] border-[2px] border-[#4F98FB] px-[9px] py-[5px] font-mono text-[10px] font-bold uppercase leading-none tracking-[0.2em] text-[#2f74dc]">
          File: {h.name}
        </motion.span>
        {/* the lamp's light falling on the top of the sheet */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[70px] rounded-t-[5px] bg-[linear-gradient(180deg,rgba(79,152,251,0.2),rgba(79,152,251,0))]" />
      </>
    );
  };
  const PAPER = "absolute left-[116px] top-[28px] h-[172px] w-[288px] rounded-[5px] bg-[#FBFAF6] bg-[linear-gradient(176deg,#ffffff_0%,#FBFAF6_45%,#ece8de_100%)] px-[22px] pt-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_22px_-6px_rgba(0,0,0,0.7)]";

  return (
    <div style={{ fontFamily: FONT }} className="flex min-h-[640px] w-full items-center justify-center overflow-hidden bg-[#0B0D12] bg-[radial-gradient(75%_60%_at_50%_30%,#232834_0%,#0B0D12_58%,#050608_100%)] px-4 py-8 sm:min-h-[800px]">
      <div ref={box} className="relative aspect-[520/606] w-full max-w-[600px]">
        <div style={{ width: W, height: H, transform: `scale(${scale})` }} className="absolute left-0 top-0 origin-top-left">
          {/* the reading lamp: a blue tube in a steel hood, held on two posts above the slot */}
          <div aria-hidden="true" className="absolute left-[84px] top-[0px] h-[198px] w-[352px]">
            <span className="absolute left-[6px] top-[12px] h-[186px] w-[7px] rounded-full bg-[linear-gradient(90deg,#f4f6f9,#8a919c_45%,#3d434c)] shadow-[3px_0_6px_rgba(0,0,0,0.5)]" />
            <span className="absolute right-[6px] top-[12px] h-[186px] w-[7px] rounded-full bg-[linear-gradient(90deg,#f4f6f9,#8a919c_45%,#3d434c)] shadow-[3px_0_6px_rgba(0,0,0,0.5)]" />
            <span className={`absolute inset-x-[20px] top-[16px] h-[150px] bg-[linear-gradient(180deg,rgba(79,152,251,0.34),rgba(79,152,251,0.08)_55%,rgba(79,152,251,0))] transition-opacity duration-500 [clip-path:polygon(4%_0,96%_0,100%_100%,0_100%)] motion-reduce:transition-none ${phase === "read" ? "opacity-100" : "opacity-55"}`} />
            <span className="absolute inset-x-0 top-0 h-[20px] rounded-[10px] bg-[linear-gradient(180deg,#fdfdfe_0%,#b4bac4_30%,#6b727d_62%,#2c3038_100%)] shadow-[inset_0_1px_0_#ffffff,0_8px_14px_rgba(0,0,0,0.65)]" />
            <span className="absolute inset-x-[10px] top-[4px] h-[2px] rounded-full bg-white/70" />
            <span className={`absolute inset-x-[16px] top-[16px] h-[6px] rounded-b-full bg-[#d5eaff] transition-shadow duration-500 motion-reduce:transition-none ${phase === "read" ? "shadow-[0_0_16px_5px_rgba(79,152,251,1),0_14px_50px_14px_rgba(79,152,251,0.55)]" : "shadow-[0_0_10px_3px_rgba(79,152,251,0.8),0_10px_36px_8px_rgba(79,152,251,0.28)]"}`} />
          </div>

          {/* the note standing in the slot */}
          <motion.div key={note.id} initial={reduce || note.id === 0 ? false : { y: 178 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 210, damping: 21 }} className={PAPER}>
            {face(note.hole, marked, tagged, phase === "read")}
            {phase === "read" && !reduce && (
              <motion.span aria-hidden="true" initial={{ top: 4, opacity: 0 }} animate={{ top: 150, opacity: [0, 1, 1, 0] }} transition={{ duration: 0.85, ease: "easeInOut" }} className="pointer-events-none absolute inset-x-0 h-[22px] bg-[linear-gradient(180deg,rgba(79,152,251,0)_0%,rgba(79,152,251,0.34)_46%,rgba(210,232,255,0.95)_50%,rgba(79,152,251,0.34)_54%,rgba(79,152,251,0)_100%)]" />
            )}
          </motion.div>
          {/* the note just filed: it tips flat and slides into its pigeonhole */}
          {flight && (
            <motion.div key={`f${flight.id}`} aria-hidden="true" initial={{ x: 0, y: 0, scale: 1, rotateX: 0, opacity: 1 }} animate={{ x: holeX(flight.hole) - 260, y: flight.to - 114, scale: 0.36, rotateX: 80, opacity: [1, 1, 1, 0] }} transition={{ duration: 0.5, ease: [0.5, 0, 0.75, 0.4] }} style={{ transformPerspective: 900 }} className={`${PAPER} z-30`}>
              {face(flight.hole, true, true, false)}
            </motion.div>
          )}

          {/* the cabinet */}
          <div className="absolute left-[20px] top-[196px] z-10 h-[376px] w-[480px] rounded-[26px] bg-[#F6F4EF] bg-[linear-gradient(168deg,#ffffff_0%,#F6F4EF_38%,#e7e3d9_100%)] shadow-[inset_0_1.5px_0_#ffffff,inset_0_-3px_2px_rgba(11,13,18,0.12),0_2px_0_#cfcabe,0_4px_0_#bdb8ac,0_6px_0_#a9a498,0_26px_30px_-10px_rgba(0,0,0,0.7),0_70px_80px_-30px_rgba(0,0,0,0.9)]">
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[26px] bg-[linear-gradient(116deg,rgba(255,255,255,0)_16%,rgba(255,255,255,0.8)_27%,rgba(255,255,255,0)_40%,rgba(255,255,255,0)_72%,rgba(255,255,255,0.4)_80%,rgba(255,255,255,0)_90%)]" />
            {/* the slot in the top that notes come up through */}
            <span aria-hidden="true" className="absolute left-[84px] top-[-3px] h-[8px] w-[312px] rounded-full bg-[#020305] shadow-[0_1px_0_#ffffff,inset_0_2px_3px_#000000]" />
            <ul aria-label="Pigeonholes" className="absolute inset-0 m-0 list-none p-0">
              {holes.map((hole, i) => {
                const n = piles[i], aimed = (tagged && note.hole === i) || flight?.hole === i || fresh === i;
                return (
                  <li key={hole.name} style={{ left: 22 + (i % 3) * 151, top: 24 + Math.floor(i / 3) * 170 }} className="absolute h-[166px] w-[134px]">
                    <button type="button" disabled={n === 0} onClick={() => takeOut(i)} aria-label={`${hole.name}: ${n} notes. Take out the newest one`}
                      className="group relative block h-[130px] w-[134px] overflow-hidden rounded-[11px] bg-[#020304] shadow-[0_1.5px_0_#ffffff,0_-1px_0_rgba(11,13,18,0.3),0_0_0_1px_rgba(11,13,18,0.12)] outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F4EF]">
                      {/* the inside of the box in perspective: ceiling, two walls and a floor that catches the light */}
                      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[22px] bg-[linear-gradient(180deg,#000000,#06070b)] [clip-path:polygon(0_0,100%_0,88%_100%,12%_100%)]" />
                      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[16px] bg-[linear-gradient(90deg,#161a23,#07090d)] [clip-path:polygon(0_0,100%_17%,100%_77%,0_100%)]" />
                      <span aria-hidden="true" className="absolute inset-y-0 right-0 w-[16px] bg-[linear-gradient(270deg,#0e1118,#05060a)] [clip-path:polygon(100%_0,0_17%,0_77%,100%_100%)]" />
                      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[30px] bg-[linear-gradient(180deg,#0b0e14,#2b3140)] [clip-path:polygon(12%_0,88%_0,100%_100%,0_100%)]" />
                      <span aria-hidden="true" className={`absolute inset-x-[16px] bottom-[30px] top-[22px] bg-[radial-gradient(80%_90%_at_50%_100%,rgba(79,152,251,0.6),rgba(79,152,251,0))] transition-opacity duration-700 motion-reduce:transition-none ${aimed ? "opacity-100" : "opacity-0"}`} />
                      <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-[30px] bg-[linear-gradient(180deg,rgba(79,152,251,0.5),rgba(79,152,251,0.1))] transition-opacity duration-700 [clip-path:polygon(12%_0,88%_0,100%_100%,0_100%)] motion-reduce:transition-none ${aimed ? "opacity-100" : "opacity-0"}`} />
                      <span aria-hidden="true" className="absolute inset-0 rounded-[11px] shadow-[inset_0_10px_14px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(0,0,0,0.9)]" />
                      <span aria-hidden="true" className="absolute inset-x-[13px] bottom-[5px] flex flex-col-reverse items-center transition-transform duration-200 group-hover:-translate-y-[2px] motion-reduce:transition-none">
                        {Array.from({ length: Math.min(n, 12) }, (_, s) => (
                          <span key={s} style={{ width: `${90 + (nudge(i, s) % 4) * 2}%`, marginLeft: nudge(i, s) * 1.4 }}
                            className={`mt-[1px] block h-[3px] rounded-[0.5px] shadow-[0_1px_0_rgba(0,0,0,0.7)] ${s % 3 === 1 ? "bg-[linear-gradient(180deg,#f3f0e8,#c9c4b7)]" : "bg-[linear-gradient(180deg,#ffffff,#d8d4c8)]"}`} />
                        ))}
                        {n > 0 && (
                          <motion.span key={n} initial={reduce || fresh !== i ? false : { y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 520, damping: 19 }} style={{ marginLeft: nudge(i, n - 1) * 1.4 }}
                            className={`relative block h-[19px] w-[88%] transition-colors duration-[1600ms] [clip-path:polygon(8%_0,92%_0,100%_100%,0_100%)] motion-reduce:transition-none ${fresh === i ? "bg-[#a9cdff]" : "bg-[#f4f1e9]"}`}>
                            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,13,18,0.5),rgba(11,13,18,0.05)_70%,rgba(255,255,255,0.5))]" />
                            <span className="absolute left-[22%] top-[7px] h-[1.5px] w-[30%] bg-[#0B0D12]/45" />
                            <span className="absolute left-[20%] top-[12px] h-[1.5px] w-[48%] bg-[#0B0D12]/45" />
                          </motion.span>
                        )}
                      </span>
                    </button>
                    <span aria-hidden="true" className="absolute left-[10px] top-[139px] flex h-[22px] w-[114px] items-center rounded-[4px] p-[2px] shadow-[0_1px_2px_rgba(11,13,18,0.45)]" style={{ backgroundImage: STEEL }}>
                      <span className="flex h-full w-full items-center gap-[6px] rounded-[2.5px] bg-[#FBFAF6] px-[6px] shadow-[inset_0_1px_2px_rgba(11,13,18,0.35)]">
                        <span className={`h-[6px] w-[6px] shrink-0 rounded-full transition-[background-color,box-shadow] duration-500 motion-reduce:transition-none ${aimed ? "bg-[#4F98FB] shadow-[0_0_6px_2px_rgba(79,152,251,0.8)]" : "bg-[#0B0D12]/25"}`} />
                        <span className="font-mono text-[8.5px] font-bold uppercase leading-none tracking-[0.18em] text-[#0B0D12]/85">{hole.name}</span>
                        <span className="ml-auto font-mono text-[8.5px] font-bold leading-none text-[#0B0D12]/45">{String(n).padStart(2, "0")}</span>
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <span className="absolute bottom-[-24px] left-0 right-0 text-center font-mono text-[9px] font-semibold uppercase leading-none tracking-[0.26em] text-[#F6F4EF]/45">Spoke and Sprocket Cycles / front desk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
