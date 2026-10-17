import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";

// The cards the block feeds itself while nobody is typing. Each sentence comes back as the page beside it.
const briefs = [
  { sentence: "A sourdough bakery in Leith with a weekly bread subscription", brand: "Crumb & Tide", links: ["Loaves", "Subscribe", "Find us"], headline: "Bread worth setting an alarm for.", cta: "Start a bread box", note: "Baked from four each morning", focus: "50% 62%", src: "https://images.pexels.com/photos/30350350/pexels-photo-30350350.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "Round sourdough loaves cooling on a wire rack in a bakery kitchen" },
  { sentence: "A surf school in Ericeira where families book lessons online", brand: "Saltline Surf", links: ["Lessons", "Kids", "Book"], headline: "Stand up on your first morning.", cta: "Book a lesson", note: "Boards and wetsuits included", focus: "50% 45%", src: "https://images.pexels.com/photos/5689762/pexels-photo-5689762.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "A surfer in a wetsuit carrying a board through shallow water under a clear sky" },
  { sentence: "A florist in Bath that delivers peony bunches every Friday", brand: "Halloway Stems", links: ["Bunches", "Weddings", "Deliver"], headline: "Fridays should smell like peonies.", cta: "Send a bunch", note: "Cut to order, wrapped in paper", focus: "50% 55%", src: "https://images.pexels.com/photos/32375838/pexels-photo-32375838.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "Pink peonies standing in glass vases" },
];
const BLUE = "#4F98FB";
const INK = "#0B0D12";
const PAPER = "#F6F4EF";
const HOLD = 4400; // how long the self-running demo leaves a finished page standing
const MAX = 78; // characters that fit on the card

const W = 560, H = 640; // the scene is drawn at this size and scaled to fit
const SLOT_Y = 404; // where the card meets the block
const BRIEF_H = 232, PAGE_H = 376;
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const BRUSH = "repeating-linear-gradient(0deg,rgba(255,255,255,0.07) 0 1px,rgba(0,0,0,0.05) 1px 2px,rgba(255,255,255,0) 2px 3px), repeating-linear-gradient(0deg,rgba(0,0,0,0) 0 11px,rgba(0,0,0,0.035) 11px 12px,rgba(255,255,255,0.05) 12px 13px)";

type Phase = "type" | "down" | "read" | "show";
type Page = { brand: string; links: string[]; headline: string; cta: string; note: string; src?: string; alt?: string; focus?: string };

const pageFrom = (words: string): Page => {
  const clean = words.trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
  const head = clean.length > 52 ? `${clean.slice(0, 50).replace(/\s+\S*$/, "")}...` : clean;
  return { brand: "Your page", links: ["About", "Work", "Contact"], headline: `${head.charAt(0).toUpperCase()}${head.slice(1)}.`, cta: "Get in touch", note: "Set from the sentence on your card" };
};

function Screw({ style }: { style: CSSProperties }) {
  return (
    <span aria-hidden="true" className="absolute h-[13px] w-[13px] rounded-full" style={{ background: "radial-gradient(circle at 36% 30%,#eef1f5,#9aa1ac 48%,#4a4f58 78%,#22252a)", boxShadow: "0 1px 0 rgba(255,255,255,0.55), inset 0 0 0 1px rgba(0,0,0,0.35), 0 0 0 2px rgba(0,0,0,0.16)", ...style }}>
      <span className="absolute left-[3.5px] top-[3.5px] h-[6px] w-[6px] bg-[#15171b]" style={{ clipPath: "polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)" }} />
    </span>
  );
}

export default function MachinedPromptBlock() {
  const reduce = !!useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [k, setK] = useState(1);
  const [text, setText] = useState(() => briefs[0].sentence.slice(0, briefs[0].sentence.length - 4));
  const [phase, setPhase] = useState<Phase>("type");
  const [page, setPage] = useState<Page>(briefs[0]);
  const [said, setSaid] = useState("");
  const mine = useRef(false); // a visitor has taken the card
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const stop = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };

  // Card down, light across, page up.
  const feed = (result: Page, after?: () => void) => {
    setPage(result);
    setSaid("");
    if (reduce) { setPhase("show"); setSaid(`Printed: ${result.headline}`); return; }
    setPhase("down");
    later(() => setPhase("read"), 380);
    later(() => { setPhase("show"); setSaid(`Printed: ${result.headline}`); if (after) after(); }, 900);
  };

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => setK(Math.max(0.5, Math.min(1.14, (el.clientWidth - 16) / W)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    // The light on the metal follows the pointer.
    const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); el.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`); };
    el.addEventListener("pointermove", move);
    return () => { ro.disconnect(); el.removeEventListener("pointermove", move); };
  }, []);

  useEffect(() => {
    if (reduce) { setText(briefs[0].sentence); setPage(briefs[0]); setPhase("show"); return; }
    const play = (i: number, from: number) => {
      const s = briefs[i].sentence;
      let n = from;
      setPhase("type"); setText(s.slice(0, n));
      const key = () => {
        if (mine.current) return;
        n += 1; setText(s.slice(0, n));
        if (n < s.length) later(key, 34 + ((n * 37) % 46));
        else later(() => feed(briefs[i], () => later(() => { setPhase("down"); later(() => play((i + 1) % briefs.length, 0), 520); }, HOLD)), from ? 140 : 300);
      };
      later(key, from ? 90 : 620);
    };
    play(0, briefs[0].sentence.length - 4);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const take = () => {
    if (mine.current && phase === "type") return;
    mine.current = true; stop();
    setText(""); setPhase("type"); setSaid("");
  };
  const submit = () => {
    if (phase === "show" || phase === "read" || phase === "down") { take(); field.current?.focus(); return; }
    if (!text.trim()) { field.current?.focus(); return; }
    const demo = briefs.find((b) => b.sentence === text);
    mine.current = true; stop();
    feed(demo ?? pageFrom(text));
  };
  const onKey = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter") { e.preventDefault(); submit(); } };

  const lit = phase === "read" || phase === "show";
  const up = { type: "spring" as const, stiffness: 150, damping: 15, mass: 0.9 };
  const down = { duration: 0.36, ease: [0.5, 0, 0.9, 0.4] as [number, number, number, number] };

  return (
    <div ref={root} className="relative flex min-h-[460px] sm:min-h-[720px] w-full items-center justify-center overflow-hidden bg-[#0B0D12] py-6" style={{ fontFamily: FONT, backgroundImage: "radial-gradient(60% 46% at 50% 30%,rgba(120,140,180,0.16),rgba(11,13,18,0) 70%), radial-gradient(70% 30% at 50% 84%,rgba(255,255,255,0.05),rgba(11,13,18,0) 70%)" }}>
      <style>{`
        @keyframes machined-prompt-block-caret { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
        @keyframes machined-prompt-block-breathe { 0%,100% { opacity: 0.72 } 50% { opacity: 1 } }
        .machined-prompt-block-field::placeholder { color: rgba(11,13,18,0.34); }
        .machined-prompt-block-field::selection { background: rgba(79,152,251,0.3); }
        @media (prefers-reduced-motion: reduce) { .machined-prompt-block-anim { animation: none !important; } }
      `}</style>
      <div style={{ width: W * k, height: H * k }}>
        <div className="relative" style={{ width: W, height: H, transform: `scale(${k})`, transformOrigin: "0 0" }}>

          {/* What the table sees: a soft shadow, and blue spilling out while the block reads. */}
          <div aria-hidden="true" className="absolute left-[10px] top-[556px] h-[70px] w-[540px] rounded-[50%]" style={{ background: "radial-gradient(closest-side,rgba(0,0,0,0.85),rgba(0,0,0,0))" }} />
          <div aria-hidden="true" className="absolute left-[40px] top-[548px] h-[80px] w-[480px] rounded-[50%] transition-opacity duration-500" style={{ background: "radial-gradient(closest-side,rgba(79,152,251,0.5),rgba(79,152,251,0))", opacity: lit ? 0.9 : 0.12 }} />

          <div aria-hidden="true" className="absolute left-[30px] top-[584px] h-[44px] w-[500px] opacity-40" style={{ background: "linear-gradient(180deg,rgba(150,160,180,0.5),rgba(150,160,180,0) 80%)", filter: "blur(3px)", borderRadius: "0 0 40px 40px" }} />
          <div aria-hidden="true" className="absolute left-[64px] top-[578px] h-[9px] w-[64px] rounded-b-[5px] bg-[#050608]" />
          <div aria-hidden="true" className="absolute left-[432px] top-[578px] h-[9px] w-[64px] rounded-b-[5px] bg-[#050608]" />

          {/* Top face of the block, with the slot milled into it. */}
          <div aria-hidden="true" className="absolute left-[30px] top-[386px] h-[36px] w-[500px]" style={{ clipPath: "polygon(22px 0,478px 0,500px 100%,0 100%)", background: `${BRUSH}, linear-gradient(180deg,#70777f 0%,#a9afb9 26%,#d9dde3 70%,#f4f6f9 100%)` }} />
          <div aria-hidden="true" className="absolute left-[88px] top-[398px] h-[11px] w-[384px] rounded-[6px]" style={{ background: "linear-gradient(180deg,#000 0%,#07090d 60%,#1b1f27 100%)", boxShadow: "0 1px 0 rgba(255,255,255,0.9), 0 -1px 0 rgba(0,0,0,0.35), inset 0 2px 3px #000" }} />
          <div aria-hidden="true" className="absolute left-[96px] top-[400px] h-[7px] w-[368px] rounded-full transition-opacity duration-300" style={{ background: BLUE, boxShadow: `0 0 12px 3px ${BLUE}, 0 -10px 34px 12px rgba(79,152,251,0.5)`, opacity: lit ? 1 : 0.1 }} />

          {/* The two cards ride in a window that ends at the slot, so they vanish into the metal. */}
          <div className="absolute left-0 top-0" style={{ width: W, height: SLOT_Y, clipPath: "inset(-300px -200px 0 -200px)" }}>
            {/* The page that comes back. */}
            <motion.div aria-hidden={phase !== "show"} className="absolute left-[102px] w-[356px] cursor-pointer" style={{ height: PAGE_H, top: SLOT_Y - PAGE_H + 22 }} initial={false} animate={{ y: phase === "show" ? 0 : PAGE_H + 8 }} transition={reduce ? { duration: 0 } : phase === "show" ? up : down} onClick={() => { take(); field.current?.focus(); }}>
              <div className="relative h-full w-full overflow-hidden rounded-[12px]" style={{ background: `linear-gradient(180deg,#fdfcf9 0%,${PAPER} 70%,#e9e6de 100%)`, boxShadow: "0 0 0 1px rgba(0,0,0,0.25), 0 30px 60px -10px rgba(0,0,0,0.8), 0 0 44px -6px rgba(79,152,251,0.45)" }}>
                <div className="flex items-center justify-between px-[18px] pt-[15px]">
                  <span className="flex items-center gap-[6px] text-[12px] font-extrabold tracking-[-0.02em] text-[#0B0D12]"><span className="h-[8px] w-[8px] rounded-full" style={{ background: BLUE }} />{page.brand}</span>
                  <span className="flex gap-[11px] text-[9.5px] font-semibold text-[#0B0D12]/60">{page.links.map((l) => <span key={l}>{l}</span>)}</span>
                </div>
                <p className="px-[18px] pt-[13px] text-[31px] font-black leading-[0.94] tracking-[-0.045em] text-[#0B0D12]">{page.headline}</p>
                <div className="relative mx-[18px] mt-[13px] h-[128px] overflow-hidden rounded-[9px]" style={{ background: page.src ? "#93a4bd" : `linear-gradient(135deg,#2f74dc,${BLUE} 55%,#b9d8ff)` }}>
                  {page.src ? (
                    <img src={page.src} alt={page.alt} width={640} height={427} className="h-full w-full object-cover" style={{ objectPosition: page.focus }} />
                  ) : (
                    <span aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.22) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.22) 1px,transparent 1px)", backgroundSize: "20px 20px" }}>
                      <span className="absolute left-[16px] top-[18px] h-[52px] w-[104px] rounded-[6px] border-[1.5px] border-white/80" />
                      <span className="absolute left-[134px] top-[18px] h-[8px] w-[120px] rounded-full bg-white/85" />
                      <span className="absolute left-[134px] top-[34px] h-[8px] w-[84px] rounded-full bg-white/55" />
                      <span className="absolute left-[16px] top-[86px] h-[24px] w-[290px] rounded-[6px] border-[1.5px] border-dashed border-white/70" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-[11px] px-[18px] pt-[13px]">
                  <span className="rounded-full px-[14px] py-[8px] text-[11.5px] font-extrabold tracking-[-0.01em] text-[#0B0D12]" style={{ background: BLUE, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 3px 8px -2px rgba(79,152,251,0.8)" }}>{page.cta}</span>
                  <span className="text-[10px] font-semibold leading-tight text-[#0B0D12]/60">{page.note}</span>
                </div>
                <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(0deg,rgba(79,152,251,0.38) 0%,rgba(79,152,251,0) 17%)" }} />
              </div>
            </motion.div>

            {/* The card you type on. */}
            <motion.div className="absolute left-[102px] w-[356px]" style={{ height: BRIEF_H, top: SLOT_Y - BRIEF_H + 26 }} initial={false} animate={{ y: phase === "type" ? 0 : BRIEF_H + 8, rotate: phase === "type" ? -0.6 : 0 }} transition={reduce ? { duration: 0 } : phase === "type" ? up : down}>
              <div className="relative h-full w-full" style={{ filter: "drop-shadow(0 26px 30px rgba(0,0,0,0.7))" }}>
                <div className="absolute inset-0" style={{ clipPath: "polygon(0 12px,12px 0,calc(100% - 30px) 0,100% 30px,100% 100%,0 100%)", background: `linear-gradient(180deg,#fefdfb 0%,${PAPER} 62%,#e4e0d7 100%)` }}>
                  <span aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(102deg,rgba(255,255,255,0.7) 0%,rgba(255,255,255,0) 30%)" }} />
                  <span aria-hidden="true" className="absolute left-0 top-0 h-full w-[7px]" style={{ background: BLUE }} />
                  <div aria-hidden="true" className="absolute left-[24px] right-[40px] top-[16px] flex items-center justify-between font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#0B0D12]/55">
                    <span style={{ color: "#2f74dc" }}>Brief card</span>
                    <span>{String(text.length).padStart(2, "0")} / {MAX}</span>
                  </div>
                  <div aria-hidden="true" className="absolute left-[24px] right-[24px] top-[36px] h-px bg-[#0B0D12]/15" />
                  <label htmlFor="machined-prompt-block-field" className="sr-only">Describe the website you want in one sentence</label>
                  <textarea
                    id="machined-prompt-block-field"
                    ref={field}
                    value={text}
                    maxLength={MAX}
                    rows={3}
                    spellCheck={false}
                    placeholder="Describe your business in one sentence"
                    onFocus={() => { if (!mine.current) take(); }}
                    onChange={(e) => { mine.current = true; stop(); setPhase("type"); setText(e.target.value.replace(/\n/g, "")); }}
                    onKeyDown={onKey}
                    className="machined-prompt-block-field absolute left-[24px] top-[46px] h-[100px] w-[310px] resize-none overflow-hidden border-0 bg-transparent p-0 text-[26px] font-extrabold leading-[1.14] tracking-[-0.035em] text-[#0B0D12] outline-none"
                    style={{ caretColor: BLUE, fontFamily: FONT }}
                  />
                  {/* A printed caret for the self-typing demo, where the field is not focused. */}
                  {!mine.current && phase === "type" && (
                    <span aria-hidden="true" className="machined-prompt-block-anim absolute left-[24px] top-[150px] flex items-center gap-[6px] font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#2f74dc]"><span className="machined-prompt-block-anim h-[9px] w-[5px]" style={{ background: BLUE, animation: "machined-prompt-block-caret 1s steps(1) infinite" }} />Typing</span>
                  )}
                  <div aria-hidden="true" className="absolute bottom-[38px] left-[24px] right-[24px] flex items-center justify-between">
                    <span className="flex gap-[5px]">{[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} className="h-[9px] w-[5px] rounded-[1px] bg-[#0B0D12]" style={{ opacity: i % 3 === 1 ? 0.2 : 0.75 }} />)}</span>
                    <span className="flex items-center gap-[6px] font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#0B0D12]/55">This end in
                      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="#2f74dc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Front lip of the slot and the face of the block. */}
          <div aria-hidden="true" className="absolute left-[30px] top-[420px] h-[3px] w-[500px] rounded-full" style={{ background: "linear-gradient(90deg,rgba(255,255,255,0.5),#fff 30%,#fff 70%,rgba(255,255,255,0.5))" }} />
          <div className="absolute left-[30px] top-[422px] h-[160px] w-[500px] overflow-hidden rounded-b-[16px] rounded-t-[3px]" style={{ background: `${BRUSH}, linear-gradient(180deg,#dfe3e9 0%,#b4bac4 7%,#9aa1ac 40%,#7b828d 78%,#555a63 100%)`, boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.45), inset 2px 0 0 rgba(255,255,255,0.25), inset -2px 0 0 rgba(0,0,0,0.25), 0 26px 40px -12px rgba(0,0,0,0.9)" }}>
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-[300px] -translate-x-1/2" style={{ left: "var(--mx, 34%)", background: "linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.42) 50%,rgba(255,255,255,0))" }} />
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[60px] transition-opacity duration-500" style={{ background: "linear-gradient(180deg,rgba(79,152,251,0.55),rgba(79,152,251,0))", opacity: lit ? 1 : 0 }} />
            <Screw style={{ left: 14, top: 14 }} /><Screw style={{ right: 14, top: 14 }} /><Screw style={{ left: 14, bottom: 16 }} /><Screw style={{ right: 14, bottom: 16 }} />

            {/* Light pipe: fills as the card is read and stays lit while the page stands. */}
            <div aria-hidden="true" className="absolute left-[46px] top-[30px] h-[10px] w-[408px] overflow-hidden rounded-full" style={{ background: "#05070a", boxShadow: "inset 0 2px 3px #000, 0 1px 0 rgba(255,255,255,0.6)" }}>
              <motion.span className="machined-prompt-block-anim absolute inset-y-[2px] left-[2px] right-[2px] origin-left rounded-full" style={{ background: `linear-gradient(180deg,#d6e8ff,${BLUE} 55%,#2f74dc)`, boxShadow: `0 0 10px ${BLUE}`, animation: phase === "show" ? "machined-prompt-block-breathe 2.4s ease-in-out infinite" : undefined }} initial={false} animate={{ scaleX: lit ? 1 : 0, opacity: lit ? 1 : 0 }} transition={reduce ? { duration: 0 } : { scaleX: { duration: lit ? 0.5 : 0.01, ease: "easeInOut" }, opacity: { duration: 0.2 } }} />
              <span className="absolute inset-x-[6px] top-[1.5px] h-[2px] rounded-full bg-white/25" />
            </div>

            <div aria-hidden="true" className="absolute left-[46px] top-[58px] font-mono text-[9.5px] font-bold uppercase leading-[1.9] tracking-[0.24em] text-[#1c1f25]/80" style={{ textShadow: "0 1px 0 rgba(255,255,255,0.5)" }}>
              <div>Sentence in</div>
              <div>Page out</div>
              <div className="mt-[5px] flex items-center gap-[7px] tracking-[0.2em]"><span className="h-[6px] w-[6px] rounded-full transition-colors duration-300" style={{ background: lit ? BLUE : "#3a3e46", boxShadow: lit ? `0 0 8px 2px ${BLUE}` : "inset 0 1px 1px #000" }} />{phase === "show" ? "Printed" : phase === "type" ? "Ready" : "Reading"}</div>
            </div>

            <span aria-hidden="true" className="absolute inset-x-0 bottom-[11px] h-[2px]" style={{ background: "rgba(0,0,0,0.3)", boxShadow: "0 1px 0 rgba(255,255,255,0.35)" }} />
            <span aria-hidden="true" className="absolute bottom-[20px] left-[46px] font-mono text-[7.5px] font-bold uppercase tracking-[0.3em] text-[#1c1f25]/55" style={{ textShadow: "0 1px 0 rgba(255,255,255,0.4)" }}>Milled from one billet / No. 0417</span>
            <button type="button" onClick={submit} className="absolute right-[44px] top-[70px] flex h-[58px] w-[170px] items-center justify-center gap-[10px] rounded-full text-[16px] font-extrabold tracking-[-0.02em] text-white outline-none transition-transform duration-100 focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#9aa1ac] active:translate-y-[2px]" style={{ background: "linear-gradient(180deg,#2a2e37 0%,#12141a 46%,#07080b 100%)", boxShadow: "0 0 0 3px #5b616b, 0 0 0 4px rgba(255,255,255,0.5), 0 5px 0 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -2px 3px rgba(0,0,0,0.8)", fontFamily: FONT }}>
              <span aria-hidden="true" className="h-[8px] w-[8px] rounded-full" style={{ background: BLUE, boxShadow: `0 0 8px 1px ${BLUE}` }} />
              {phase === "type" ? "Feed card" : "New card"}
            </button>
          </div>
          <p className="absolute left-0 top-[602px] w-full text-center text-[12px] font-semibold tracking-[-0.005em] text-[#9aa3b5]">Type a sentence on the card, then press Enter</p>
          <p className="sr-only" role="status">{said}</p>
        </div>
      </div>
    </div>
  );
}
