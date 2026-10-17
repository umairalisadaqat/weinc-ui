import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

// One glass valve per feature, left to right. `tag` is the short word printed on the display cell.
const parts = [
  { id: "book", name: "Bookings", tag: "Book" },
  { id: "shop", name: "Shop", tag: "Shop" },
  { id: "blog", name: "Blog", tag: "Blog" },
  { id: "form", name: "Contact", tag: "Form" },
] as const;
const school = "Tidewater Surf School";
const headline = "Lessons at first light.";

const W = 520, H = 600; // drawn at this size, then scaled as one object
const LIFT = 58; // how far a pulled valve hangs above its socket
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const LIT = "#cfe3ff";
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function Glyph({ id, size = 26, stroke = 2 }: { id: string; size?: number; stroke?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {id === "book" && <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>}
      {id === "shop" && <><path d="M5 8h14l-1.2 11.5H6.2z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>}
      {id === "blog" && <path d="M5 6h14M5 10.5h14M5 15h14M5 19.5h8" />}
      {id === "form" && <><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="M4 7.5l8 6 8-6" /></>}
    </svg>
  );
}

// Anything that glows is wrapped in this: it stutters up like a heater coming to temperature and fades out when the valve is pulled.
function Warm({ on, delay = 0, className, style, children }: { on: boolean; delay?: number; className?: string; style?: CSSProperties; children?: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden="true"
      initial={false}
      animate={{ opacity: on ? (reduce ? 1 : [0, 0.5, 0.2, 0.8, 0.62, 1]) : 0 }}
      transition={reduce ? { duration: 0 } : on ? { duration: 0.75, delay: 0.16 + delay, times: [0, 0.18, 0.3, 0.55, 0.7, 1] } : { duration: 0.35 }}
      className={className}
      style={style}
    >
      {children}
    </motion.span>
  );
}

function Valve({ part, index, on, onToggle }: { part: (typeof parts)[number]; index: number; on: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      aria-pressed={on}
      aria-label={`${part.name} valve`}
      onClick={onToggle}
      initial={false}
      animate={{ y: on ? 0 : -LIFT, rotate: on ? 0 : index % 2 ? 2.2 : -2.2 }}
      whileHover={reduce ? undefined : { y: on ? -5 : -LIFT - 6 }}
      transition={reduce ? { duration: 0 } : on ? { type: "spring", stiffness: 480, damping: 22, mass: 0.9 } : { type: "spring", stiffness: 220, damping: 16 }}
      style={{ left: 48.5 + index * 115, transformOrigin: "50% 100%" }}
      className="valve-chassis-site-valve absolute top-[134px] h-[200px] w-[78px] cursor-pointer rounded-t-[40px] outline-none"
    >
      {/* pins */}
      <span aria-hidden="true" style={{ opacity: on ? 0 : 1 }} className="absolute left-[19px] top-[184px] flex h-[14px] w-[40px] justify-between transition-opacity duration-150">
        {[0, 1, 2, 3, 4].map((p) => <i key={p} className="h-full w-[3px] rounded-b-full bg-[linear-gradient(90deg,#f1f3f7_0%,#8d93a1_55%,#4a4f5b_100%)]" />)}
      </span>
      {/* bakelite base with a chrome band */}
      <span aria-hidden="true" className="absolute left-[7px] top-[150px] h-[35px] w-[64px] rounded-b-[7px] rounded-t-[3px] bg-[linear-gradient(90deg,#3a3f4c_0%,#191c24_18%,#07080b_52%,#12141a_82%,#2c303b_100%)] shadow-[inset_0_-2px_2px_rgba(0,0,0,0.8)]">
        <span className="absolute inset-x-0 top-0 h-[6px] rounded-t-[3px] bg-[linear-gradient(90deg,#f6f8fb_0%,#9aa1ae_16%,#3c414d_48%,#7d8492_78%,#e9edf3_100%)] shadow-[0_1px_0_rgba(0,0,0,0.7)]" />
        <span className="absolute inset-x-0 top-[13px] text-center font-mono text-[7.5px] font-bold uppercase tracking-[0.16em] text-[#F6F4EF]/80">{part.name}</span>
        <Warm on={on} className="absolute inset-x-0 top-0 h-[6px] rounded-t-[3px] bg-[linear-gradient(90deg,rgba(79,152,251,0.2),rgba(150,196,255,0.95),rgba(79,152,251,0.2))] mix-blend-screen" />
      </span>
      {/* exhaust tip on the crown */}
      <span aria-hidden="true" className="absolute left-[33px] top-[-6px] h-[12px] w-[12px] rounded-t-full border border-b-0 border-white/25 bg-[linear-gradient(90deg,rgba(255,255,255,0.3),rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.14))]" />

      {/* the glass envelope and everything inside it */}
      <span aria-hidden="true" className="absolute left-[3px] top-0 h-[152px] w-[72px] overflow-hidden rounded-b-[9px] rounded-t-[36px] bg-[#0d1017]/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2),inset_0_-10px_14px_-6px_rgba(0,0,0,0.7)]">
        {/* glow filling the bottle */}
        <Warm on={on} className="absolute inset-0 bg-[radial-gradient(60%_46%_at_50%_58%,rgba(150,198,255,0.85)_0%,rgba(79,152,251,0.42)_45%,rgba(79,152,251,0)_100%)]" />
        {/* support rods */}
        <i className="absolute left-[16px] top-[34px] h-[118px] w-[1.5px] bg-[linear-gradient(180deg,#c8ccd6,#5c6170)]" />
        <i className="absolute right-[16px] top-[34px] h-[118px] w-[1.5px] bg-[linear-gradient(180deg,#c8ccd6,#5c6170)]" />
        {/* mica spacers */}
        <i className="absolute left-[8px] top-[38px] h-[5px] w-[56px] rounded-full bg-[linear-gradient(180deg,rgba(236,232,220,0.75),rgba(150,146,136,0.55))] shadow-[0_1px_0_rgba(0,0,0,0.5)]" />
        <i className="absolute left-[8px] top-[122px] h-[5px] w-[56px] rounded-full bg-[linear-gradient(180deg,rgba(236,232,220,0.7),rgba(150,146,136,0.5))] shadow-[0_1px_0_rgba(0,0,0,0.5)]" />
        {/* the plate: a folded grey metal box with the feature cut out of its face */}
        <span className="absolute left-[15px] top-[45px] h-[76px] w-[42px] rounded-[3px] bg-[linear-gradient(90deg,#5b6170_0%,#343946_14%,#20242d_50%,#2f3440_86%,#565c6b_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.6),0_2px_5px_rgba(0,0,0,0.6)]">
          <i className="absolute inset-x-[5px] top-[5px] h-[1px] bg-black/50" />
          <i className="absolute inset-x-[5px] bottom-[5px] h-[1px] bg-black/50" />
          <span className="absolute inset-0 flex items-center justify-center text-[#07080b]"><Glyph id={part.id} /></span>
          <Warm on={on} className="absolute inset-0 flex items-center justify-center text-[#e4f0ff] [filter:drop-shadow(0_0_3px_#4F98FB)_drop-shadow(0_0_9px_rgba(79,152,251,0.95))]"><Glyph id={part.id} /></Warm>
        </span>
        {/* silvered getter flash inside the crown */}
        <i className="absolute inset-x-0 top-0 h-[40px] bg-[radial-gradient(70%_100%_at_50%_0%,rgba(214,221,233,0.75)_0%,rgba(120,128,144,0.5)_45%,rgba(60,66,80,0)_100%)]" />
        {/* reflections on the glass; they slide a little with the pointer */}
        <i className="valve-chassis-site-streak absolute left-[8px] top-[20px] h-[104px] w-[5px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.85)_18%,rgba(255,255,255,0.5)_60%,rgba(255,255,255,0)_100%)] blur-[0.6px]" />
        <i className="valve-chassis-site-streak absolute left-[16px] top-[30px] h-[60px] w-[2px] rounded-full bg-white/30" />
        <i className="absolute right-[6px] top-[30px] h-[96px] w-[9px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.2)_30%,rgba(255,255,255,0.08)_80%,rgba(255,255,255,0)_100%)]" />
        <i className="absolute inset-0 rounded-b-[9px] rounded-t-[36px] bg-[linear-gradient(90deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_16%,rgba(255,255,255,0)_82%,rgba(255,255,255,0.1)_100%)]" />
      </span>
      {/* bloom outside the glass */}
      <Warm on={on} className="pointer-events-none absolute left-[-46px] top-[6px] h-[170px] w-[170px] rounded-full bg-[radial-gradient(closest-side,rgba(79,152,251,0.5),rgba(79,152,251,0.14)_55%,rgba(79,152,251,0))]" />
    </motion.button>
  );
}

// A cell of the display. The unlit drawing stays faintly visible, the way a cold fluorescent display shows its segments.
function Cell({ on, tag, delay, children }: { on: boolean; tag: string; delay: number; children: ReactNode }) {
  const body = (
    <span className="flex h-full flex-col justify-between p-[7px]">
      <span className="flex flex-1 items-center">{children}</span>
      <span className="font-mono text-[7.5px] font-bold uppercase tracking-[0.24em]">{tag}</span>
    </span>
  );
  return (
    <span className="relative block h-[70px] rounded-[5px] border border-current/30" style={{ borderColor: "rgba(79,152,251,0.16)" }}>
      <span className="absolute inset-0 text-[#4F98FB] opacity-[0.13]">{body}</span>
      <Warm on={on} delay={delay} className="absolute inset-0 rounded-[5px] bg-[#4F98FB]/[0.13] [text-shadow:0_0_6px_rgba(79,152,251,0.95)] [filter:drop-shadow(0_0_4px_rgba(79,152,251,0.75))]" style={{ color: LIT }}>{body}</Warm>
    </span>
  );
}

export default function FeatureValveChassis() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [seated, setSeated] = useState<boolean[]>([true, true, true, true]);
  const [auto, setAuto] = useState(true);
  const [tick, setTick] = useState(0);
  const [said, setSaid] = useState("");

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1.22, (el.clientWidth - 20) / W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The self-running demo: four valves drop home in turn, then one is pulled and reseated every few seconds.
  useIsoLayoutEffect(() => {
    if (reduce || !auto) return;
    const ids: number[] = [];
    const at = (ms: number, fn: () => void) => { ids.push(window.setTimeout(fn, ms)); };
    const put = (i: number, v: boolean) => setSeated((s) => s.map((x, k) => (k === i ? v : x)));
    setSeated([false, false, false, false]);
    parts.forEach((_, i) => at(240 + i * 290, () => put(i, true)));
    let n = 0;
    const cycle = () => {
      const i = [2, 0, 3, 1][n++ % 4];
      put(i, false);
      at(1700, () => put(i, true));
      at(5600, cycle);
    };
    at(6600, cycle);
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [reduce, auto]);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 900);
    return () => window.clearInterval(id);
  }, [reduce]);

  const toggle = (i: number) => {
    setAuto(false);
    setSeated((s) => s.map((x, k) => (k === i ? !x : x)));
    setSaid(`${parts[i].name} valve ${seated[i] ? "pulled" : "seated"}.`);
  };
  const all = seated.every(Boolean);
  const any = seated.some(Boolean);
  const setAll = () => { setAuto(false); setSeated(parts.map(() => !all)); setSaid(all ? "All valves pulled." : "All valves seated."); };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const b = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--valve-chassis-site-mx", String(((e.clientX - b.left) / b.width - 0.5) * 2));
  };

  return (
    <div ref={root} onPointerMove={onMove} style={{ fontFamily: FONT }} className="relative flex min-h-[520px] w-full items-center justify-center overflow-hidden bg-[#0B0D12] bg-[radial-gradient(80%_60%_at_50%_44%,#1b202c_0%,#0f1218_52%,#07080b_100%)] py-8 sm:min-h-[820px]">
      <div style={{ width: W * scale, height: H * scale }} className="relative">
        <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0" }} className="absolute left-0 top-0">
          {/* light spilling on the table */}
          <span aria-hidden="true" className="absolute left-[10px] top-[548px] h-[46px] w-[500px] rounded-[50%] bg-black/80 blur-[14px]" />
          <span aria-hidden="true" style={{ opacity: any ? 1 : 0 }} className="absolute left-[60px] top-[552px] h-[40px] w-[400px] rounded-[50%] bg-[#4F98FB]/30 blur-[22px] transition-opacity duration-700 motion-reduce:transition-none" />

          {/* The top deck of the chassis, seen from just above, with four sockets */}
          <div aria-hidden="true" className="absolute left-[30px] top-[296px] h-[36px] w-[460px] bg-[linear-gradient(180deg,#2c313d_0%,#4a505e_60%,#6b7282_100%)] [clip-path:polygon(4%_0,96%_0,100%_100%,0_100%)]">
            <span className="absolute inset-0 opacity-50 [background:repeating-linear-gradient(90deg,rgba(255,255,255,0.07)_0_1px,rgba(0,0,0,0.07)_1px_3px)]" />
            {parts.map((p, i) => (
              <span key={p.id} className="absolute top-[7px] h-[20px] w-[82px] rounded-[50%] bg-[#020203] shadow-[0_0_0_2px_#aeb5c2,0_0_0_3px_#3a3f4b,0_2px_0_3px_rgba(255,255,255,0.25),inset_0_4px_5px_rgba(0,0,0,1)]" style={{ left: 16.5 + i * 115 }}>
                <Warm on={seated[i]} className="absolute -inset-x-[14px] -inset-y-[8px] rounded-[50%] bg-[radial-gradient(closest-side,rgba(110,170,255,0.75),rgba(79,152,251,0))]" />
              </span>
            ))}
          </div>

          {parts.map((p, i) => <Valve key={p.id} part={p} index={i} on={seated[i]} onToggle={() => toggle(i)} />)}

          {/* The front of the chassis */}
          <div className="absolute left-[30px] top-[330px] h-[232px] w-[460px] rounded-b-[16px] rounded-t-[3px] bg-[#14171f] bg-[linear-gradient(180deg,#2a2f3b_0%,#181b24_10%,#11141b_70%,#0a0c11_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(255,255,255,0.06),inset_1px_0_0_rgba(255,255,255,0.08),inset_-1px_0_0_rgba(0,0,0,0.6),0_3px_0_#050608,0_24px_30px_-8px_rgba(0,0,0,0.85)]">
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-b-[16px] opacity-70 [background:repeating-linear-gradient(180deg,rgba(255,255,255,0.028)_0_1px,rgba(0,0,0,0.05)_1px_2px)]" />
            {/* blue light from the valves falling down the face */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[40px]">
              {parts.map((p, i) => <Warm key={p.id} on={seated[i]} className="absolute top-0 h-[40px] w-[110px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(79,152,251,0.42),rgba(79,152,251,0))]" style={{ left: 2.5 + i * 115 }} />)}
            </span>
            {/* engraved socket names */}
            <div aria-hidden="true" className="absolute inset-x-0 top-[11px] h-[10px]">
              {parts.map((p, i) => <span key={p.id} className="absolute w-[115px] text-center font-mono text-[7.5px] font-bold uppercase tracking-[0.26em] text-[#F6F4EF]/55 [text-shadow:0_-1px_0_rgba(0,0,0,0.9)]" style={{ left: i * 115 }}>V{i + 1}</span>)}
            </div>
            {/* corner screws */}
            {["left-[9px] top-[9px]", "right-[9px] top-[9px]", "left-[9px] bottom-[10px]", "right-[9px] bottom-[10px]"].map((c) => (
              <span key={c} aria-hidden="true" className={`absolute ${c} h-[9px] w-[9px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#dfe3ea_0%,#7b8290_55%,#2e323c_100%)] shadow-[0_1px_1px_rgba(0,0,0,0.9)]`}><i className="absolute left-[1.5px] top-[4px] h-[1px] w-[6px] rotate-[-32deg] bg-black/70" /></span>
            ))}

            {/* The display: black glass over a blue fluorescent drawing of the site */}
            <div aria-hidden="true" className="absolute left-[22px] top-[30px] h-[142px] w-[416px] overflow-hidden rounded-[9px] bg-[#020304] shadow-[inset_0_2px_6px_rgba(0,0,0,1),inset_0_0_0_1px_#000,0_1px_0_rgba(255,255,255,0.16),0_-1px_0_rgba(0,0,0,0.8)]">
              <div className="absolute inset-0 px-[13px] pt-[10px]">
                <div className="flex items-center justify-between font-mono text-[7.5px] font-bold uppercase tracking-[0.22em] [text-shadow:0_0_6px_rgba(79,152,251,0.9)]" style={{ color: LIT }}>
                  <span>{school}</span>
                  <span className="flex gap-[10px]">
                    {parts.map((p, i) => <span key={p.id} className="transition-opacity duration-500" style={{ opacity: seated[i] ? 1 : 0.16 }}>{p.tag}</span>)}
                  </span>
                </div>
                <p className="mt-[5px] text-[20px] font-extrabold leading-[1.1] tracking-[-0.035em] [text-shadow:0_0_8px_rgba(79,152,251,0.95),0_0_22px_rgba(79,152,251,0.55)]" style={{ color: "#d3e6ff" }}>{headline}</p>
                <div className="mt-[7px] grid grid-cols-4 gap-[7px]">
                  <Cell on={seated[0]} tag={parts[0].tag} delay={0.1}>
                    <span className="grid w-full grid-cols-7 gap-[2.5px]">
                      {Array.from({ length: 21 }, (_, k) => <i key={k} className="h-[6px] rounded-[1.5px] bg-current" style={{ opacity: k === 3 + ((tick * 3) % 15) ? 1 : 0.4 }} />)}
                    </span>
                  </Cell>
                  <Cell on={seated[1]} tag={parts[1].tag} delay={0.1}>
                    <span className="flex w-full justify-between">
                      {[0, 1, 2].map((k) => <span key={k} className="flex w-[22px] flex-col gap-[3px]"><i className="h-[20px] rounded-[2.5px] border-[1.5px] border-current" style={{ background: k === tick % 3 ? "currentColor" : "transparent" }} /><i className="h-[2.5px] w-[14px] rounded-full bg-current" /></span>)}
                    </span>
                  </Cell>
                  <Cell on={seated[2]} tag={parts[2].tag} delay={0.1}>
                    <span className="flex w-full flex-col gap-[4px]"><i className="h-[5px] w-[70%] rounded-full bg-current" /><i className="h-[2.5px] w-full rounded-full bg-current opacity-60" /><i className="h-[2.5px] w-full rounded-full bg-current opacity-60" /><i className="h-[2.5px] w-[55%] rounded-full bg-current opacity-60" /></span>
                  </Cell>
                  <Cell on={seated[3]} tag={parts[3].tag} delay={0.1}>
                    <span className="flex w-full flex-col gap-[3.5px]"><i className="h-[9px] rounded-[2.5px] border-[1.5px] border-current" /><i className="h-[9px] rounded-[2.5px] border-[1.5px] border-current" /><i className="h-[7px] w-[26px] self-end rounded-full bg-current" /></span>
                  </Cell>
                </div>
              </div>
              {/* fine grid of the display mesh, then the glass */}
              <span className="pointer-events-none absolute inset-0 opacity-40 [background:repeating-linear-gradient(0deg,rgba(0,0,0,0.5)_0_1px,transparent_1px_2px)]" />
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(112deg,rgba(255,255,255,0.13)_0%,rgba(255,255,255,0.03)_22%,rgba(255,255,255,0)_36%)]" />
            </div>

            {/* under the display: mains lamp, engraved line, one real button */}
            <div className="absolute inset-x-[24px] bottom-[14px] flex h-[40px] items-center justify-between">
              <span aria-hidden="true" className="flex items-center gap-[8px]">
                <span style={{ background: any ? "radial-gradient(circle at 35% 30%, #e6f1ff 0%, #4F98FB 55%, #23529a 100%)" : "radial-gradient(circle at 35% 30%, #4b505c 0%, #1c1f27 70%)", boxShadow: any ? "0 0 12px 3px rgba(79,152,251,0.7), 0 0 0 2px #05060a, 0 0 0 3px #7b8290" : "0 0 0 2px #05060a, 0 0 0 3px #7b8290" }} className="h-[10px] w-[10px] rounded-full transition-[background,box-shadow] duration-300 motion-reduce:transition-none" />
                <span className="font-mono text-[7.5px] font-bold uppercase tracking-[0.26em] text-[#F6F4EF]/55 [text-shadow:0_-1px_0_rgba(0,0,0,0.9)]">Live</span>
              </span>
              <span className="font-mono text-[7.5px] font-bold uppercase tracking-[0.26em] text-[#F6F4EF]/55 [text-shadow:0_-1px_0_rgba(0,0,0,0.9)]">Site chassis / {seated.filter(Boolean).length} of 4 warm</span>
              <button type="button" onClick={setAll} className="h-[40px] rounded-full bg-[#F6F4EF] bg-[linear-gradient(180deg,#ffffff_0%,#F6F4EF_45%,#d9d5ca_100%)] px-[16px] text-[11.5px] font-extrabold tracking-[-0.01em] text-[#0B0D12] shadow-[inset_0_1px_0_#ffffff,0_2px_0_#8f8b80,0_5px_8px_rgba(0,0,0,0.7),0_0_0_3px_rgba(0,0,0,0.5)] outline-none transition-transform duration-100 active:translate-y-[2px] focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11141b] motion-reduce:transition-none">
                {all ? "Pull all" : "Seat all"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">{said}</p>
      <style>{`
        .valve-chassis-site-streak { transform: translateX(calc(var(--valve-chassis-site-mx, 0) * 7px)); transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .valve-chassis-site-valve:focus-visible { box-shadow: 0 0 0 2px #0B0D12, 0 0 0 4px #4F98FB; }
        @media (prefers-reduced-motion: reduce) { .valve-chassis-site-streak { transition: none; transform: none; } }
      `}</style>
    </div>
  );
}
