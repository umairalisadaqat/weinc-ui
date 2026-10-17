import { useCallback, useEffect, useRef, useState } from "react";

// The bank, the account holder and the currency are invented. Change them here.
const BANK = "Larkmoor & Wren";
const BRANCH = "Savings bank, Quay Street branch";
const HOLDER = "Imogen Castellane";
const UNIT = "vale";
const DATE = "11 October";
const SERIAL = "004417";
// What the self-writing demo fills in before anyone types.
const samples = [
  { payee: "Odile Fairweather", amount: "1240.50", memo: "Studio rent, October" },
  { payee: "Tobias Marchetti", amount: "386.00", memo: "Bicycle repair and parts" },
];
const INK = "#1d2a63";
const HAND = '"Snell Roundhand", "Savoye LET", "Segoe Script", "Lucida Handwriting", "Apple Chancery", cursive';
const W = 680, H = 300; // the cheque is laid out at this size and scaled to fit

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const under1000 = (n: number) => {
  const out: string[] = [];
  if (n >= 100) { out.push(`${ONES[Math.floor(n / 100)]} hundred`); n %= 100; }
  if (n >= 20) out.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
  else if (n > 0 || !out.length) out.push(ONES[n]);
  return out.join(" ");
};
const parse = (raw: string) => Math.min(999999.99, Math.max(0, parseFloat(raw.replace(/[^0-9.]/g, "")) || 0));
const figures = (raw: string) => (raw.trim() ? parse(raw).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
const inWords = (raw: string) => {
  if (!raw.trim()) return "";
  const v = parse(raw), whole = Math.floor(v), cents = Math.round((v - whole) * 100);
  const big = whole >= 1000 ? `${under1000(Math.floor(whole / 1000))} thousand${whole % 1000 ? ` ${under1000(whole % 1000)}` : ""}` : under1000(whole);
  return `${big[0].toUpperCase()}${big.slice(1)} ${UNIT} and ${String(cents).padStart(2, "0")}/100`;
};

// Text that is written a letter at a time. It reports where the nib is after every stroke.
function Ink({ text, live, onInk, size = 27 }: { text: string; live: boolean; onInk: (el: HTMLElement) => void; size?: number }) {
  const [shown, setShown] = useState(text);
  const end = useRef<HTMLSpanElement>(null);
  const target = useRef(text);
  useEffect(() => {
    target.current = text;
    if (!live) { setShown(text); return; }
    const id = window.setInterval(() => {
      setShown((cur) => {
        const goal = target.current;
        if (cur === goal) { window.clearInterval(id); return cur; }
        let same = 0;
        while (same < cur.length && same < goal.length && cur[same] === goal[same]) same++;
        return cur.length > same ? goal.slice(0, same) : goal.slice(0, cur.length + 1);
      });
    }, 12);
    return () => window.clearInterval(id);
  }, [text, live]);
  useEffect(() => { if (live && shown && end.current) onInk(end.current); }, [shown, live, onInk]);
  return (
    <span className="whitespace-nowrap font-bold leading-none" style={{ fontFamily: HAND, fontSize: size, color: INK }}>
      {shown.split("").map((ch, i) => (
        <span key={`${i}${ch}`} className="cheque-pen-ink inline-block whitespace-pre">{ch}</span>
      ))}
      <span ref={end} className="inline-block h-0 w-0" />
    </span>
  );
}

export default function PaperChequeForm() {
  const [payee, setPayee] = useState(samples[0].payee);
  const [amount, setAmount] = useState(samples[0].amount);
  const [memo, setMemo] = useState(samples[0].memo);
  const [words, setWords] = useState(inWords(samples[0].amount));
  const [signed, setSigned] = useState(true);
  const [live, setLive] = useState(false);
  const [scale, setScale] = useState(1);
  const stage = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLCanvasElement>(null);
  const pen = useRef<HTMLDivElement>(null);
  const sig = useRef<SVGPathElement>(null);
  const park = useRef(0);
  const touched = useRef(false);
  const signing = useRef(0);

  const place = useCallback((x: number, y: number, resting: boolean) => {
    const p = pen.current;
    if (!p) return;
    p.style.transitionDuration = resting ? "700ms" : "90ms";
    p.style.transform = `translate(${x}px, ${y}px) rotate(${resting ? -21 : -54 + Math.sin(x * 0.21) * 3}deg)`;
  }, []);
  const rest = useCallback(() => place(W - 30, H - 86, true), [place]);
  const onInk = useCallback((el: HTMLElement) => {
    let x = 0, y = 0, node: HTMLElement | null = el;
    while (node && node !== sheet.current) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent as HTMLElement | null; }
    place(x + 2, y, false);
    window.clearTimeout(park.current);
    park.current = window.setTimeout(rest, 520);
  }, [place, rest]);

  // The amount in words follows the figures a moment later, the way a person fills a cheque in.
  useEffect(() => {
    const id = window.setTimeout(() => setWords(inWords(amount)), live ? 130 : 0);
    return () => window.clearTimeout(id);
  }, [amount, live]);

  const sign = useCallback(() => {
    setSigned(true);
    const path = sig.current;
    if (!path || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const len = path.getTotalLength(), start = performance.now();
    window.clearTimeout(park.current); cancelAnimationFrame(signing.current);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 560), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, pt = path.getPointAtLength(len * e);
      place(424 + pt.x, 160 + pt.y, false);
      if (t < 1) signing.current = requestAnimationFrame(step); else park.current = window.setTimeout(rest, 260);
    };
    signing.current = requestAnimationFrame(step);
  }, [place, rest]);

  // Fit the cheque to the space it is given.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1.22, el.clientWidth / W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Security printing: two families of fine waves, two rosettes and a ruled border, drawn once.
  useEffect(() => {
    const cv = art.current, c = cv?.getContext("2d");
    if (!cv || !c) return;
    const d = 2;
    cv.width = W * d; cv.height = H * d; c.scale(d, d);
    const tint = c.createLinearGradient(0, 0, W, H);
    tint.addColorStop(0, "#e6efe2"); tint.addColorStop(0.38, "#f3ecd9"); tint.addColorStop(0.62, "#f4e6dc"); tint.addColorStop(1, "#dfeee9");
    c.fillStyle = tint; c.fillRect(0, 0, W, H);
    c.lineWidth = 0.45;
    for (let fam = 0; fam < 2; fam++) {
      c.strokeStyle = fam ? "rgba(176,92,112,0.2)" : "rgba(30,128,112,0.24)";
      for (let y = -10; y < H + 10; y += 3.4) {
        c.beginPath();
        for (let x = 0; x <= W; x += 3) {
          const yy = y + Math.sin(x / (fam ? 23 : 37) + y * (fam ? 0.09 : -0.06)) * (fam ? 3.2 : 5.4) + Math.sin(x / 140 + fam) * 6;
          if (x) c.lineTo(x, yy); else c.moveTo(x, yy);
        }
        c.stroke();
      }
    }
    const rosette = (cx: number, cy: number, R: number, n: number, colour: string, turns: number) => {
      c.strokeStyle = colour; c.lineWidth = 0.5;
      for (let k = 0; k < turns; k++) {
        c.beginPath();
        for (let i = 0; i <= 360; i++) {
          const a = (i / 360) * Math.PI * 2, r = R * (0.66 + 0.3 * Math.cos(n * a + (k / turns) * Math.PI * 2) + 0.04 * Math.cos(3 * n * a));
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          if (i) c.lineTo(x, y); else c.moveTo(x, y);
        }
        c.closePath(); c.stroke();
      }
    };
    rosette(566, 150, 118, 9, "rgba(24,120,104,0.3)", 16);
    rosette(566, 150, 52, 7, "rgba(176,82,104,0.34)", 10);
    rosette(92, 236, 70, 11, "rgba(176,82,104,0.2)", 12);
    // Border: a chain of tiny waves between two hairlines.
    c.strokeStyle = "rgba(20,84,74,0.75)"; c.lineWidth = 0.7;
    c.strokeRect(11.5, 11.5, W - 23, H - 23); c.strokeRect(17.5, 17.5, W - 35, H - 35);
    c.lineWidth = 0.5; c.strokeStyle = "rgba(20,84,74,0.6)";
    c.beginPath();
    for (let x = 12; x <= W - 12; x += 0.75) { const o = Math.sin(x * 1.05) * 2.1; c.moveTo(x, 14.5 + o); c.lineTo(x + 0.75, 14.5 + Math.sin((x + 0.75) * 1.05) * 2.1); c.moveTo(x, H - 14.5 + o); c.lineTo(x + 0.75, H - 14.5 + Math.sin((x + 0.75) * 1.05) * 2.1); }
    for (let y = 12; y <= H - 12; y += 0.75) { const o = Math.sin(y * 1.05) * 2.1; c.moveTo(14.5 + o, y); c.lineTo(14.5 + Math.sin((y + 0.75) * 1.05) * 2.1, y + 0.75); c.moveTo(W - 14.5 + o, y); c.lineTo(W - 14.5 + Math.sin((y + 0.75) * 1.05) * 2.1, y + 0.75); }
    c.stroke();
    // Paper tooth.
    let seed = 5;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 5200; i++) { c.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.22)" : "rgba(60,50,30,0.07)"; c.fillRect(rand() * W, rand() * H, 1, 1); }
  }, []);

  // Until someone types, the cheque writes itself: clear, fill each line in turn, sign, wait, next sample.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setLive(true);
    const timers: number[] = [];
    const run = (n: number, lead: number) => {
      const s = samples[n % samples.length];
      const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => { if (!touched.current) fn(); }, lead + ms));
      at(0, () => { setSigned(false); setPayee(""); setAmount(""); setMemo(""); });
      at(90, () => setPayee(s.payee));
      at(380, () => setAmount(s.amount));
      at(1080, () => setMemo(s.memo));
      at(1400, sign);
      at(8200, () => run(n + 1, 0));
    };
    run(0, 0);
    return () => { timers.forEach((t) => window.clearTimeout(t)); window.clearTimeout(park.current); cancelAnimationFrame(signing.current); };
  }, [sign]);

  const mine = () => { touched.current = true; };
  const edit = (set: (v: string) => void) => (e: { target: { value: string } }) => { mine(); setSigned(false); set(e.target.value); };
  const fresh = () => { touched.current = true; setSigned(false); setPayee(""); setAmount(""); setMemo(""); };
  const ready = payee.trim() !== "" && parse(amount) > 0;
  const field = "h-11 w-full rounded-lg border border-emerald-100/20 bg-[#0c2620] px-3 text-[15px] text-emerald-50 placeholder:text-emerald-100/40 outline-none transition-colors focus:border-[#e9dfc4] focus-visible:ring-2 focus-visible:ring-[#e9dfc4]/60 motion-reduce:transition-none";
  const label = "mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100/80";
  const print = "font-mono text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#14544a]";

  return (
    <div className="relative flex min-h-[620px] w-full flex-col items-center justify-center overflow-hidden bg-[#123a2f] bg-[radial-gradient(80%_60%_at_40%_25%,#1c5444_0%,#123a2f_55%,#0b271f_100%)] px-4 py-12 sm:min-h-[780px]">
      <style>{`
        @keyframes paper-cheque-payment-form-ink { from { clip-path: inset(-20% 100% -20% 0); opacity: .4 } to { clip-path: inset(-20% -30% -20% -30%); opacity: 1 } }
        .cheque-pen-ink { animation: paper-cheque-payment-form-ink 110ms ease-out both }
        @media (prefers-reduced-motion: reduce) { .cheque-pen-ink { animation: none } .cheque-pen-move { transition: none !important } .cheque-pen-sign { transition: none !important } }
      `}</style>
      <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0"><filter id="cheque-pen-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" /><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 -.12" /></filter></svg>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay" style={{ filter: "url(#cheque-pen-grain)" }} />
      <div className="relative w-full max-w-[830px]">
        <div ref={stage} className="relative w-full" style={{ height: H * scale }}>
          <div className="absolute left-1/2 top-0" style={{ width: W, height: H, marginLeft: -W / 2, transform: `scale(${scale})`, transformOrigin: "50% 0" }}>
            <div ref={sheet} className="absolute inset-0 -rotate-[1.6deg]">
              <div
                role="img"
                aria-label={`Cheque drawn on ${BANK}. Pay ${payee || "nobody yet"}, ${figures(amount) || "0.00"} ${UNIT}. ${signed ? "Signed" : "Not signed"}.`}
                className="absolute inset-0"
                style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,.35)) drop-shadow(0 14px 16px rgba(0,0,0,.28)) drop-shadow(0 40px 46px rgba(0,0,0,.34))" }}
              >
                <div
                  className="absolute inset-0 overflow-hidden rounded-r-[3px] bg-[#efeada]"
                  style={{ WebkitMaskImage: "radial-gradient(circle at 0 50%, transparent 2.6px, #000 3.1px)", maskImage: "radial-gradient(circle at 0 50%, transparent 2.6px, #000 3.1px)", WebkitMaskSize: "100% 10px", maskSize: "100% 10px" }}
                >
                  <canvas ref={art} aria-hidden="true" className="absolute inset-0 h-full w-full" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(255,255,255,.5)_0%,rgba(255,255,255,0)_32%,rgba(0,0,0,0)_70%,rgba(40,30,10,.1)_100%)]" />

                  <div className="absolute left-[34px] top-[27px] flex items-center gap-2.5">
                    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
                      <circle cx="15" cy="15" r="14" fill="none" stroke="#14544a" strokeWidth="1" />
                      <circle cx="15" cy="15" r="11.2" fill="none" stroke="#14544a" strokeWidth=".5" strokeDasharray="1 1.4" />
                      <path d="M8 19c3-9 11-9 14 0M11 19c1.5-5 6.500-5 8 0M15 8v11" fill="none" stroke="#14544a" strokeWidth="1.1" strokeLinecap="round" />
                    </svg>
                    <div>
                      <p className="font-serif text-[19px] font-bold leading-none tracking-[0.01em] text-[#0f3f38]">{BANK}</p>
                      <p className={`${print} mt-1`}>{BRANCH}</p>
                    </div>
                  </div>
                  <p className="absolute right-[34px] top-[26px] font-mono text-[13px] font-bold tracking-[0.12em] text-[#a23246]">No. {SERIAL}</p>
                  <div className="absolute right-[34px] top-[50px] flex w-[178px] items-end gap-2 border-b border-[#14544a]/70 pb-[3px]">
                    <span className={print}>Date</span>
                    <span className="whitespace-nowrap font-bold leading-none" style={{ fontFamily: HAND, fontSize: 22, color: INK }}>{DATE}</span>
                  </div>

                  <div className="absolute left-[34px] top-[92px] flex h-[40px] w-[438px] items-end gap-2 border-b border-[#14544a]/70 pb-[3px]">
                    <span className={`${print} shrink-0 pb-[2px]`}>Pay</span>
                    <Ink text={payee} live={live} onInk={onInk} size={payee.length > 26 ? 21 : 28} />
                  </div>
                  <div className="absolute right-[34px] top-[92px] flex h-[42px] w-[158px] items-center gap-2 border border-[#14544a]/80 bg-[repeating-linear-gradient(135deg,rgba(20,84,74,.13)_0_1px,rgba(255,255,255,.5)_1px_4px)] px-2.5 shadow-[inset_0_1px_2px_rgba(0,0,0,.14)]">
                    <span className="font-serif text-[15px] font-bold italic text-[#14544a]">V.</span>
                    <Ink text={figures(amount)} live={live} onInk={onInk} size={25} />
                  </div>

                  <div className="absolute left-[34px] top-[142px] flex h-[40px] w-[612px] items-end gap-2 border-b border-[#14544a]/70 pb-[3px]">
                    <span className={`${print} shrink-0 pb-[2px]`}>The sum of</span>
                    <Ink text={words} live={live} onInk={onInk} size={words.length > 52 ? 17 : words.length > 40 ? 21 : 26} />
                  </div>

                  <div className="absolute left-[34px] top-[196px] flex h-[36px] w-[300px] items-end gap-2 border-b border-[#14544a]/70 pb-[3px]">
                    <span className={`${print} shrink-0 pb-[2px]`}>For</span>
                    <Ink text={memo} live={live} onInk={onInk} size={memo.length > 26 ? 18 : 23} />
                  </div>
                  <div className="absolute right-[34px] top-[196px] h-[36px] w-[222px] border-b border-[#14544a]/70">
                    <svg className="absolute left-0 top-[-36px] overflow-visible" width="222" height="72" viewBox="0 0 222 72" aria-hidden="true">
                      <path
                        ref={sig}
                        className="cheque-pen-sign"
                        d="M10 52C16 20 30 6 34 18c5 15-18 44-12 46 8 3 20-34 30-32 7 1-6 22 2 22 8 0 10-20 18-20 6 0-4 18 4 18s10-22 20-22c7 0-6 20 2 22 10 2 16-30 28-34 9-3-10 34 2 34 12 0 22-16 40-22 16-5 30-4 44-10M18 64c50-10 110-12 190-16"
                        fill="none"
                        stroke={INK}
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        pathLength={1}
                        strokeDasharray="1"
                        style={{ strokeDashoffset: signed ? 0 : 1, transition: signed ? "stroke-dashoffset 560ms ease-in-out" : "none" }}
                      />
                    </svg>
                    <span className={`${print} absolute left-0 top-[40px]`}>{HOLDER}</span>
                  </div>

                  <p className="absolute bottom-[26px] left-[34px] font-mono text-[14px] font-bold tracking-[0.3em] text-[#22302c]">
                    <span aria-hidden="true">|: {SERIAL} :| 20 88 13 |: 0073 5521 ||</span>
                  </p>
                </div>
              </div>

              {/* The fountain pen. Its nib is at the element's origin. */}
              <div ref={pen} aria-hidden="true" className="cheque-pen-move pointer-events-none absolute left-0 top-0 origin-top-left transition-transform ease-out" style={{ transform: `translate(${W - 30}px, ${H - 86}px) rotate(-21deg)`, transitionDuration: "700ms", filter: "drop-shadow(5px 12px 7px rgba(0,0,0,.42))" }}>
                <svg width="236" height="22" viewBox="0 0 236 22" className="-translate-y-1/2 overflow-visible">
                  <defs>
                    <linearGradient id="cheque-pen-resin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#3a4250" /><stop offset=".22" stopColor="#8f9bb0" /><stop offset=".34" stopColor="#1b1f27" /><stop offset=".8" stopColor="#07080b" /><stop offset="1" stopColor="#2a2f3a" />
                    </linearGradient>
                    <linearGradient id="cheque-pen-gold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#8a5f18" /><stop offset=".3" stopColor="#fff0b8" /><stop offset=".55" stopColor="#d8a53a" /><stop offset="1" stopColor="#6e480c" />
                    </linearGradient>
                  </defs>
                  <path d="M0 11C10 9 24 5.500 36 4.200V17.800C24 16.500 10 13 0 11Z" fill="url(#cheque-pen-gold)" />
                  <path d="M2 11H27" stroke="#5a3a08" strokeWidth=".7" />
                  <circle cx="28" cy="11" r="1.5" fill="#3a2504" />
                  <path d="M36 3.800C50 3 62 1.600 74 1.200V20.800C62 20.400 50 19 36 18.200Z" fill="url(#cheque-pen-resin)" />
                  <rect x="74" y=".6" width="5" height="20.800" rx="1" fill="url(#cheque-pen-gold)" />
                  <rect x="79" y="0" width="118" height="22" rx="2" fill="url(#cheque-pen-resin)" />
                  <rect x="150" y="0" width="3.500" height="22" fill="url(#cheque-pen-gold)" />
                  <rect x="156" y="0" width="1.500" height="22" fill="url(#cheque-pen-gold)" />
                  <path d="M197 0h26c8 0 13 5 13 11s-5 11-13 11h-26Z" fill="url(#cheque-pen-resin)" />
                  <rect x="197" y="0" width="3" height="22" fill="url(#cheque-pen-gold)" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <form className="mx-auto mt-12 grid w-full max-w-[760px] grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-[1.5fr_0.8fr_1.4fr_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); if (ready && !signed) { touched.current = true; sign(); } else if (signed) fresh(); }}>
          <div>
            <label htmlFor="cheque-payee" className={label}>Pay to</label>
            <input id="cheque-payee" value={payee} onFocus={mine} onChange={edit(setPayee)} maxLength={34} autoComplete="off" placeholder="Name on the cheque" className={field} />
          </div>
          <div>
            <label htmlFor="cheque-amount" className={label}>Amount</label>
            <input id="cheque-amount" value={amount} onFocus={mine} onChange={edit(setAmount)} inputMode="decimal" maxLength={9} autoComplete="off" placeholder="0.00" className={`${field} [font-variant-numeric:tabular-nums]`} />
          </div>
          <div>
            <label htmlFor="cheque-memo" className={label}>For</label>
            <input id="cheque-memo" value={memo} onFocus={mine} onChange={edit(setMemo)} maxLength={34} autoComplete="off" placeholder="What it pays for" className={field} />
          </div>
          <button type="submit" disabled={!ready && !signed} className="h-11 rounded-lg bg-[#efe6cb] px-5 text-[14px] font-semibold text-[#0d2a22] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#efe6cb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#123a2f] disabled:opacity-50 motion-reduce:transition-none">
            {signed ? "New cheque" : "Sign cheque"}
          </button>
          <p aria-live="polite" className="font-mono text-[11px] uppercase leading-5 tracking-[0.14em] text-emerald-100/80 sm:col-span-4">
            {signed ? `Signed by ${HOLDER} and ready to post` : ready ? "Check the words match the figures, then sign" : "Add a name and an amount to write the cheque"}
          </p>
        </form>
      </div>
    </div>
  );
}
