import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, SyntheticEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Page = { brand: string; nav: string[]; head: string[]; sub: string; facts: string[]; cta: string; src?: string; alt?: string; focus?: string };

// The sentences the board sets by itself, and the page each one turns into. Headline rows hold ten letters.
const pages: (Page & { sentence: string })[] = [
  { sentence: "A coffee roastery in Porto that posts fresh beans weekly", brand: "DRUM & DRIP", nav: ["BEANS", "VISIT", "POST"], head: ["FRESH", "ROAST BY", "FRIDAY"], sub: "SMALL BATCHES, POSTED WEEKLY", facts: ["OPEN 7 TO 4", "ROASTED HERE", "BEANS BY POST"], cta: "Order beans", focus: "62% 50%", src: "https://images.pexels.com/photos/31986827/pexels-photo-31986827.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "Hot water poured from a kettle over ground coffee in a glass dripper" },
  { sentence: "A bike workshop in Ghent with same day puncture repairs", brand: "SPOKE HOUSE", nav: ["REPAIRS", "HIRE", "VISIT"], head: ["BACK ON", "TWO WHEELS", "TODAY"], sub: "PUNCTURES MENDED WHILE YOU WAIT", facts: ["DROP IN BY TEN", "LOAN BIKES", "OPEN SIX DAYS"], cta: "Book a repair", focus: "50% 40%", src: "https://images.pexels.com/photos/31452612/pexels-photo-31452612.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "A bicycle hanging in a lit workshop seen through a window from the street" },
  { sentence: "A plant shop in Lyon that runs repotting evenings", brand: "FERN & CO", nav: ["PLANTS", "EVENINGS", "VISIT"], head: ["GREEN", "THINGS,", "WELL KEPT"], sub: "REPOTTING EVENINGS ON THURSDAYS", facts: ["BRING A POT", "SOIL SUPPLIED", "TEA AT SEVEN"], cta: "Save a seat", focus: "50% 45%", src: "https://images.pexels.com/photos/14515146/pexels-photo-14515146.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "A small plant shop crowded with potted and hanging plants on wooden shelves" },
];
const BLUE = "#4F98FB";
const HOLD = 4600; // how long the self-running demo leaves a finished page on the board
const MAX = 72; // most characters the board accepts
const COLS = 17, ROWS = 5; // the sentence is set in a grid of this many letters
const CELL = 21, PITCH = 39; // letter width and row spacing for the sentence, in pixels

const W = 560, H = 704; // the scene is drawn at this size and scaled to fit
const FELT_W = 396, FELT_H = 520, PAD = 20;
const SX = Math.round((FELT_W - COLS * CELL) / 2), SY = 132;
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const svg = (w: number, h: number, body: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}<rect width='${w}' height='${h}' filter='url(#f)'/></svg>`)}")`;
const FELT = svg(240, 240, "<filter id='f'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' seed='3'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 -0.2'/></filter>");
const GRAIN_H = svg(640, 64, "<filter id='f' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.005 0.5' numOctaves='3' seed='11'/><feColorMatrix values='0 0 0 0 0.32 0 0 0 0 0.19 0 0 0 0 0.07 0 0 0 1.3 -0.5'/></filter>");
const GRAIN_V = svg(64, 640, "<filter id='f' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.5 0.005' numOctaves='3' seed='5'/><feColorMatrix values='0 0 0 0 0.32 0 0 0 0 0.19 0 0 0 0 0.07 0 0 0 1.3 -0.5'/></filter>");

// Every letter sits a little crooked, the same way each time.
const wobble = (n: number) => { const v = Math.sin(n * 127.1 + 31.7) * 43758.5453; return (v - Math.floor(v)) * 2 - 1; };
const WHITE = "0 -1px 0 #ffffff, 0 1.5px 0 #9c978b, 0 4px 4px rgba(0,0,0,0.9)";
const INKED = "0 -1px 0 #cfe3ff, 0 1.5px 0 #1f5fc4, 0 4px 4px rgba(0,0,0,0.9)";

// Break a sentence into rows of the grid without splitting words.
function setType(s: string, cols: number) {
  const at: { r: number; c: number }[] = [];
  let r = 0, c = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === " ") { at.push({ r, c }); c += 1; continue; }
    if (i === 0 || s[i - 1] === " ") {
      let len = 0;
      while (i + len < s.length && s[i + len] !== " ") len += 1;
      if (c > 0 && c + len > cols) { r += 1; c = 0; }
    }
    if (c >= cols) { r += 1; c = 0; }
    at.push({ r, c }); c += 1;
  }
  const end = c >= cols ? { r: r + 1, c: 0 } : { r, c };
  return { at, end, rows: r + 1 };
}

const pageFrom = (words: string): Page => {
  const clean = words.trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "").toUpperCase();
  const set = setType(clean, 10);
  const head: string[] = [];
  set.at.forEach((p, i) => { if (p.r < 3 && p.c < 10) head[p.r] = (head[p.r] ?? "") + clean[i]; });
  // Do not end the headline on a joining word.
  const rows = head.map((h) => h.trim()).filter(Boolean);
  if (set.rows > 3 && rows.length) rows[rows.length - 1] = rows[rows.length - 1].replace(/\s+(WITH|IN|THAT|FOR|AND|A|AN|THE|OF|WHERE|TO|ON|AT)$/, "") || rows[rows.length - 1];
  return { brand: "YOUR PAGE", nav: ["ABOUT", "WORK", "CONTACT"], head: rows, sub: "SET FROM YOUR OWN SENTENCE", facts: ["WORDS BY YOU", "LAYOUT BY US", "YOURS TO EDIT"], cta: "Get in touch" };
};

type Fall = { d: number; j: number };
const drop = { hide: { opacity: 0, scale: 1.7 }, show: (f: Fall) => ({ opacity: 1, scale: 1, y: 0, rotate: f.j * 2.4, transition: { delay: f.d, type: "spring" as const, stiffness: 520, damping: 24 } }), gone: (f: Fall) => ({ y: FELT_H + 40, rotate: f.j * 70, transition: { duration: 0.5 + Math.abs(f.j) * 0.2, delay: Math.abs(wobble(f.j * 9)) * 0.16, ease: [0.55, 0, 1, 0.55] as [number, number, number, number] } }) };

// One row of plastic letters pushed into the grooves.
function Line({ text, x, y, cell, size, row, blue, dim, right }: { text: string; x?: number; y: number; cell: number; size: number; row: number; blue?: boolean; dim?: boolean; right?: boolean }) {
  const left = right ? FELT_W - PAD - text.length * cell : x ?? PAD;
  return (
    <>
      {text.split("").map((ch, i) => ch === " " ? null : (
        <motion.span key={`${y}-${i}`} variants={drop} custom={{ d: 0.34 + row * 0.085 + i * 0.016, j: wobble(y * 3 + i) }} className="absolute block text-center font-extrabold" style={{ left: left + i * cell, top: y + wobble(y + i * 7) * 0.9, width: cell, fontSize: size, lineHeight: 1, color: blue ? BLUE : dim ? "#bdb9ae" : "#F6F4EF", textShadow: blue ? INKED : WHITE }}>{ch}</motion.span>
      ))}
    </>
  );
}

export default function FeltLetterBoardPrompt() {
  const reduce = !!useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [k, setK] = useState(1);
  const [text, setText] = useState(() => pages[0].sentence.slice(0, pages[0].sentence.length - 3));
  const [caret, setCaret] = useState(-1); // -1 follows the end of the text
  const [page, setPage] = useState<Page | null>(null);
  const [focus, setFocus] = useState(false);
  const [said, setSaid] = useState("");
  const mine = useRef(false); // a visitor has started typing
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const stop = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };

  const shown = text.toUpperCase();
  const set = useMemo(() => setType(shown, COLS), [shown]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => setK(Math.max(0.5, Math.min(1.08, (el.clientWidth - 16) / W)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    // The board leans a few degrees towards the pointer.
    const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); el.style.setProperty("--ry", `${(((e.clientX - r.left) / r.width - 0.5) * 9).toFixed(2)}deg`); el.style.setProperty("--rx", `${((0.5 - (e.clientY - r.top) / r.height) * 6).toFixed(2)}deg`); };
    const leave = () => { el.style.setProperty("--ry", "0deg"); el.style.setProperty("--rx", "0deg"); };
    el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
    return () => { ro.disconnect(); el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, []);

  useEffect(() => {
    if (reduce) { setText(pages[0].sentence); setPage(pages[0]); return; }
    const play = (i: number, from: number) => {
      const s = pages[i].sentence;
      let n = from;
      setPage(null); setText(s.slice(0, n));
      const key = () => {
        if (mine.current) return;
        n += 1; setText(s.slice(0, n));
        if (n < s.length) later(key, 40 + ((n * 43) % 50));
        else later(() => { setPage(pages[i]); setSaid(`Page set: ${pages[i].head.join(" ")}`); later(() => { setText(""); play((i + 1) % pages.length, 0); }, HOLD); }, from ? 160 : 420);
      };
      later(key, from ? 70 : 900);
    };
    play(0, pages[0].sentence.length - 3);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const take = () => { mine.current = true; stop(); setPage(null); setText(""); setCaret(-1); setSaid(""); };
  const submit = () => {
    if (page) { take(); field.current?.focus(); return; }
    if (!text.trim()) { field.current?.focus(); return; }
    const demo = pages.find((p) => p.sentence === text);
    const next = demo ?? pageFrom(text);
    mine.current = true; stop();
    setPage(next); setSaid(`Page set: ${next.head.join(" ")}`);
  };
  const onKey = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter") { e.preventDefault(); submit(); } };
  const onSelect = (e: SyntheticEvent<HTMLTextAreaElement>) => setCaret(e.currentTarget.selectionStart ?? -1);
  const onChange = (value: string, where: number) => {
    const v = value.replace(/\n/g, "");
    if (setType(v.toUpperCase(), COLS).rows > ROWS) return; // the board is full
    mine.current = true; stop(); setPage(null); setText(v); setCaret(where);
  };

  const ci = caret < 0 || caret > shown.length ? shown.length : caret;
  const cpos = ci < shown.length ? set.at[ci] : set.end;
  const ease = reduce ? { duration: 0 } : undefined;
  const side: CSSProperties = { position: "absolute" };

  return (
    <div ref={root} className="relative flex min-h-[480px] w-full items-center justify-center overflow-hidden bg-[#DAD5CB] py-4 sm:min-h-[770px]" style={{ fontFamily: FONT, backgroundImage: "radial-gradient(80% 70% at 30% 10%,#efebe3 0%,rgba(239,235,227,0) 62%), linear-gradient(180deg,rgba(218,213,203,0) 55%,#c4beb1 100%)" }}>
      <style>{`
        @keyframes felt-letter-board-caret { 0%,54% { opacity: 1 } 55%,100% { opacity: 0.15 } }
        .felt-letter-board-field::selection { background: transparent; }
        @media (prefers-reduced-motion: reduce) { .felt-letter-board-anim { animation: none !important; } .felt-letter-board-tilt { transform: none !important; } }
      `}</style>
      <div style={{ width: W * k, height: H * k }}>
        <div className="relative" style={{ width: W, height: H, transform: `scale(${k})`, transformOrigin: "0 0" }}>
          <div className="felt-letter-board-tilt absolute left-[62px] top-[18px] h-[560px] w-[436px]" style={{ transform: "perspective(1500px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))", transition: "transform 0.6s cubic-bezier(0.2,0.8,0.2,1)" }}>
            {/* Shadow on the wall, then the four mitred lengths of oak. */}
            <div aria-hidden="true" className="absolute inset-[6px] rounded-[4px]" style={{ boxShadow: "0 50px 60px -18px rgba(50,40,20,0.55), 0 14px 18px -4px rgba(50,40,20,0.35), 16px 30px 50px -10px rgba(50,40,20,0.25)" }} />
            <div aria-hidden="true" style={{ ...side, left: 0, top: 0, width: 436, height: 20, clipPath: "polygon(0 0,100% 0,calc(100% - 20px) 100%,20px 100%)", backgroundImage: `${GRAIN_H}, linear-gradient(180deg,#f3dcb8 0%,#dfbf93 22%,#c9a472 100%)` }} />
            <div aria-hidden="true" style={{ ...side, left: 0, bottom: 0, width: 436, height: 20, clipPath: "polygon(20px 0,calc(100% - 20px) 0,100% 100%,0 100%)", backgroundImage: `${GRAIN_H}, linear-gradient(180deg,#c39c69 0%,#a9814f 80%,#7d5c33 100%)`, backgroundPosition: "-90px -30px" }} />
            <div aria-hidden="true" style={{ ...side, left: 0, top: 0, width: 20, height: 560, clipPath: "polygon(0 0,100% 20px,100% calc(100% - 20px),0 100%)", backgroundImage: `${GRAIN_V}, linear-gradient(90deg,#ecd3ac 0%,#d2ae7e 30%,#bd9764 100%)` }} />
            <div aria-hidden="true" style={{ ...side, right: 0, top: 0, width: 20, height: 560, clipPath: "polygon(0 20px,100% 0,100% 100%,0 calc(100% - 20px))", backgroundImage: `${GRAIN_V}, linear-gradient(90deg,#c7a06c 0%,#b08652 70%,#8b673a 100%)`, backgroundPosition: "-30px -60px" }} />

            {/* The felt, with its ribs. Letters that fall are cut off at its edge. */}
            <div className="absolute left-[20px] top-[20px] bg-[#0B0D12]" style={{ width: FELT_W, height: FELT_H, clipPath: "inset(0)", backgroundImage: `radial-gradient(90% 70% at 22% 6%,rgba(255,255,255,0.1),rgba(255,255,255,0) 60%), ${FELT}, repeating-linear-gradient(180deg,rgba(255,255,255,0.075) 0 1px,rgba(255,255,255,0) 1px 8px,rgba(0,0,0,0.75) 8px 12px,rgba(0,0,0,0) 12px 13px)` }}>
              {/* The request: a blue heading, the sentence as it is typed, and a hint. */}
              <div aria-hidden="true" className="absolute inset-0">
                <div className="absolute inset-0 transition-opacity duration-200" style={{ opacity: page ? 0 : 1 }}>
                  {"WHAT SHOULD WE BUILD?".split("").map((ch, i) => ch === " " ? null : <span key={i} className="absolute block text-center font-extrabold" style={{ left: PAD + i * 12, top: 28 + wobble(i * 5) * 0.8, width: 12, fontSize: 13.5, lineHeight: 1, color: BLUE, textShadow: INKED, transform: `rotate(${wobble(i) * 2.4}deg)` }}>{ch}</span>)}
                  {/* The caret is one blue peg. */}
                  <span className="felt-letter-board-anim absolute block rounded-[2px]" style={{ left: SX + Math.min(cpos.c, COLS - 1) * CELL + (cpos.c >= COLS ? CELL - 4 : 2), top: SY + Math.min(cpos.r, ROWS - 1) * PITCH - 1, width: 5, height: 24, background: `linear-gradient(180deg,#b9d8ff,${BLUE} 40%,#2f74dc)`, boxShadow: `0 3px 4px rgba(0,0,0,0.9), 0 0 12px rgba(79,152,251,0.8)`, animation: "felt-letter-board-caret 1.1s steps(1) infinite" }} />
                  {"PRESS ENTER TO SET THE PAGE".split("").map((ch, i) => ch === " " ? null : <span key={i} className="absolute block text-center font-extrabold" style={{ left: PAD + i * 11, top: 470 + wobble(i * 13) * 0.8, width: 11, fontSize: 12, lineHeight: 1, color: "#bdb9ae", textShadow: WHITE, transform: `rotate(${wobble(i * 2) * 2.4}deg)` }}>{ch}</span>)}
                </div>
                <AnimatePresence>
                  {(page ? "" : shown).split("").map((ch, i) => ch === " " ? null : (
                    <motion.span key={`${i}${ch}`} className="absolute left-0 top-0 block text-center font-extrabold" style={{ width: CELL, fontSize: 24, lineHeight: 1, color: "#F6F4EF", textShadow: WHITE }} initial={reduce ? false : { opacity: 0, scale: 1.8, x: SX + set.at[i].c * CELL, y: SY + set.at[i].r * PITCH }} animate={{ opacity: 1, scale: 1, rotate: wobble(i) * 2.6, x: SX + set.at[i].c * CELL, y: SY + set.at[i].r * PITCH + wobble(i * 3) }} exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: FELT_H + 40, rotate: wobble(i) * 80, transition: { duration: 0.46 + Math.abs(wobble(i * 5)) * 0.24, delay: Math.abs(wobble(i * 11)) * 0.14, ease: [0.55, 0, 1, 0.55] } }} transition={ease ?? { type: "spring", stiffness: 540, damping: 26 }}>{ch}</motion.span>
                  ))}
                </AnimatePresence>
              </div>
              <AnimatePresence>
                {page && (
                  <motion.div key={`page-${page.brand}-${page.head.join("")}`} aria-hidden="true" className="absolute inset-0" variants={{ hide: {}, show: {}, gone: { opacity: 0.999, transition: { duration: 0.85 } } }} initial={reduce ? false : "hide"} animate="show" exit={reduce ? undefined : "gone"}>
                    <Line text={page.brand} y={26} cell={12.5} size={14} row={0} />
                    <Line text={page.nav.join("  ")} y={28} cell={9} size={10.5} row={0} dim right />
                    {page.head.map((h, i) => <Line key={h + i} text={h} y={70 + i * 52} cell={34} size={41} row={1 + i} />)}
                    <Line text={page.sub} y={236} cell={11.5} size={12.5} row={4} blue />
                    <motion.div variants={{ hide: { opacity: 0, scale: 1.25, rotate: -9 }, show: { opacity: 1, scale: 1, rotate: -2.4, y: 0, transition: { delay: 0.8, type: "spring", stiffness: 300, damping: 20 } }, gone: { y: FELT_H, rotate: 24, transition: { duration: 0.6, ease: [0.55, 0, 1, 0.55] } } }} className="absolute left-[22px] top-[274px] h-[148px] w-[196px] p-[6px]" style={{ background: "linear-gradient(180deg,#fdfcf9,#ebe7dd)", boxShadow: "0 12px 14px -4px rgba(0,0,0,0.9), 0 1px 0 #fff inset" }}>
                      <div className="relative h-full w-full overflow-hidden" style={{ background: page.src ? "#6b5a48" : `linear-gradient(135deg,#2f74dc,${BLUE} 55%,#b9d8ff)` }}>
                        {page.src ? <img src={page.src} alt={page.alt} width={640} height={427} className="h-full w-full object-cover" style={{ objectPosition: page.focus }} /> : (
                          <span className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.22) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.22) 1px,transparent 1px)", backgroundSize: "18px 18px" }}>
                            <span className="absolute left-[14px] top-[16px] h-[46px] w-[70px] rounded-[5px] border-[1.5px] border-white/80" />
                            <span className="absolute left-[96px] top-[18px] h-[7px] w-[68px] rounded-full bg-white/85" />
                            <span className="absolute left-[96px] top-[32px] h-[7px] w-[46px] rounded-full bg-white/55" />
                            <span className="absolute left-[14px] top-[78px] h-[40px] w-[156px] rounded-[5px] border-[1.5px] border-dashed border-white/70" />
                          </span>
                        )}
                        <span className="absolute inset-0" style={{ background: "linear-gradient(115deg,rgba(255,255,255,0.28),rgba(255,255,255,0) 34%)" }} />
                      </div>
                    </motion.div>
                    {page.facts.map((f, i) => <Line key={f} text={f} x={236} y={292 + i * 39} cell={10} size={11.5} row={5 + i} dim={i > 0} />)}
                    <motion.div variants={{ hide: { opacity: 0, scale: 1.3 }, show: { opacity: 1, scale: 1, y: 0, rotate: 0.8, transition: { delay: 1.05, type: "spring", stiffness: 420, damping: 22 } }, gone: { y: FELT_H, rotate: -30, transition: { duration: 0.55, ease: [0.55, 0, 1, 0.55] } } }} className="absolute left-[22px] top-[448px] flex h-[44px] items-center rounded-full px-[22px] text-[16px] font-extrabold tracking-[-0.02em] text-[#0B0D12]" style={{ background: `linear-gradient(180deg,#a9d0ff 0%,${BLUE} 38%,#3d83ea 100%)`, boxShadow: "0 8px 10px -2px rgba(0,0,0,0.9), 0 2px 0 #1f5fc4, inset 0 1.5px 0 rgba(255,255,255,0.75), 0 0 26px rgba(79,152,251,0.35)" }}>{page.cta}</motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <label htmlFor="felt-letter-board-field" className="sr-only">Describe what you want built in one sentence</label>
              <textarea
                id="felt-letter-board-field"
                ref={field}
                value={text}
                maxLength={MAX}
                spellCheck={false}
                autoCapitalize="characters"
                onFocus={() => { setFocus(true); if (!mine.current || page) take(); }}
                onBlur={() => setFocus(false)}
                onChange={(e) => onChange(e.target.value, e.target.selectionStart ?? -1)}
                onSelect={onSelect}
                onKeyDown={onKey}
                className="felt-letter-board-field absolute inset-0 h-full w-full cursor-text resize-none overflow-hidden border-0 bg-transparent p-[20px] text-[16px] text-transparent outline-none"
                style={{ caretColor: "transparent" }}
              />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ boxShadow: `inset 0 8px 14px rgba(0,0,0,0.95), inset 5px 0 9px rgba(0,0,0,0.6), inset -3px 0 6px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.12)${focus ? `, inset 0 0 0 2px ${BLUE}` : ""}` }} />
            </div>
          </div>

          <button type="button" onClick={submit} className="absolute left-1/2 top-[596px] flex h-[48px] w-[212px] -translate-x-1/2 items-center justify-center gap-[10px] rounded-full text-[15px] font-extrabold tracking-[-0.02em] text-white outline-none transition-transform duration-100 focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#DAD5CB] active:translate-y-[1px]" style={{ background: "linear-gradient(180deg,#2a2e37 0%,#12141a 46%,#07080b 100%)", boxShadow: "0 12px 18px -8px rgba(40,30,15,0.7), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -2px 3px rgba(0,0,0,0.8)", fontFamily: FONT }}>
            <span aria-hidden="true" className="h-[8px] w-[8px] rounded-full" style={{ background: BLUE, boxShadow: `0 0 8px 1px ${BLUE}` }} />
            {page ? "Clear the board" : "Set the page"}
          </button>
          <p className="absolute left-0 top-[662px] w-full text-center text-[12px] font-semibold tracking-[-0.005em] text-[#4a4840]">Click the board and type a sentence</p>
          <p className="sr-only" role="status">{said}</p>
        </div>
      </div>
    </div>
  );
}
