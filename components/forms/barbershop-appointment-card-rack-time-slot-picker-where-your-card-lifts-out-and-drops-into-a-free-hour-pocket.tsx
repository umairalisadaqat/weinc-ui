import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

const SHOP = "Marlowe Street Barbers"; // small line under the rack
const DAY = "Friday 16 October"; // printed on the enamel plate
const CHAIRS = ["Ines", "Tomas"]; // one column of pockets each
const HOURS = ["10:00 am", "10:45 am", "11:30 am", "12:15 pm", "1:00 pm", "1:45 pm", "2:30 pm", "3:15 pm"]; // one row each
const MINE = { name: "You", job: "Cut and beard trim" }; // what is typed on the card being placed
const START = "6-0"; // row-column the card sits in at first
const AUTOPLAY = true; // move the card between free pockets until someone picks one
// Cards already in the rack, keyed row-column. Everything not listed is a free pocket.
const TAKEN: Record<string, { name: string; job: string; stock: string; no: string }> = {
  "0-0": { name: "D. Achterberg", job: "Skin fade", stock: "#e6cf9c", no: "0412" },
  "0-1": { name: "S. Lindqvist", job: "Hot towel shave", stock: "#b7cddd", no: "0388" },
  "1-0": { name: "M. Okafor", job: "Cut and wash", stock: "#eeb39c", no: "0431" },
  "2-1": { name: "J. Petrakis", job: "Beard shape", stock: "#e6cf9c", no: "0297" },
  "3-0": { name: "A. Whitcombe", job: "Scissor cut", stock: "#bcd6b8", no: "0440" },
  "3-1": { name: "R. Balogun", job: "Skin fade", stock: "#eeb39c", no: "0356" },
  "5-0": { name: "T. Nakamura", job: "Cut and shave", stock: "#b7cddd", no: "0419" },
  "5-1": { name: "L. Fairweather", job: "Restyle", stock: "#ece3cc", no: "0402" },
  "7-1": { name: "C. Moreau", job: "Buzz cut", stock: "#bcd6b8", no: "0375" },
};

const LEAN = -11; // degrees the rack is turned away from the viewer; the pointer adds a little more
const UP = 68; // how far a card is lifted to clear the lip of its pocket
const noise = (f: number, o: number) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${f}' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='${o}'/%3E%3C/svg%3E")`;
const PAPER = noise(0.9, 0.55), HAMMER = noise(0.16, 0.9), PLASTER = noise(0.7, 0.35);
const tilt = (id: string) => ((id.charCodeAt(0) * 7 + id.charCodeAt(2) * 13) % 9) / 6 - 0.66;

function Card({ name, job, stock, no, mine }: { name: string; job: string; stock: string; no: string; mine?: boolean }) {
  return (
    <div className="h-full w-full" style={{ filter: "drop-shadow(0 -1px 0 rgba(255,255,255,0.35)) drop-shadow(0 3px 3px rgba(6,14,11,0.55))" }}>
      <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: stock, clipPath: "polygon(0 0,calc(100% - 13px) 0,100% 13px,100% 100%,0 100%)", borderRadius: "3px 0 0 0" }}>
        <div className="absolute inset-0 mix-blend-multiply" style={{ backgroundImage: PAPER, opacity: 0.5 }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.5) 0,rgba(255,255,255,0) 3px,rgba(255,255,255,0) 30px,rgba(40,24,6,0.1) 74px)" }} />
        {mine && <div className="absolute inset-x-0 top-0 h-[7px] bg-[#d5432b]" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)" }} />}
        <p className={`absolute left-2.5 right-5 truncate font-mono text-[11.5px] font-bold uppercase leading-none tracking-[0.06em] text-[#1d1a16] sm:left-3 sm:text-[12.5px] ${mine ? "top-[13px]" : "top-[9px]"}`}>
          {name} <span className="font-normal normal-case tracking-normal text-[#4a4338]">· {job}</span>
        </p>
        <div className={`absolute inset-x-2.5 h-px bg-[#c0392b]/70 sm:inset-x-3 ${mine ? "top-[29px]" : "top-[25px]"}`} />
        <p className="absolute right-4 top-[32px] font-mono text-[9px] tracking-[0.12em] text-[#b03324]">No. {no}</p>
      </div>
    </div>
  );
}

function Screw({ className }: { className: string }) {
  return <span aria-hidden="true" className={`absolute h-[11px] w-[11px] rounded-full ${className}`} style={{ background: "radial-gradient(circle at 35% 30%,#f4f1e8,#b9b4a6 45%,#6f6b60 100%)", boxShadow: "0 1px 1px rgba(0,0,0,0.6), inset 0 -1px 1px rgba(0,0,0,0.35)" }}><span className="absolute left-[2px] right-[2px] top-[5px] h-px rotate-[28deg] bg-[#3a372f]" /></span>;
}

export default function BarbershopAppointmentCardRack() {
  const reduce = useReducedMotion();
  const [slot, setSlot] = useState(START); // the pocket chosen
  const [seat, setSeat] = useState(START); // the pocket the card is drawn in (it lags behind while the card is in the air)
  const [flight, setFlight] = useState<{ x0: number; y0: number; x1: number; y1: number; w: number } | null>(null);
  const [thud, setThud] = useState({ id: "", n: 0 });
  const y = useMotionValue(0), px = useMotionValue(0), py = useMotionValue(0), sway = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 70, damping: 15 }), sy = useSpring(py, { stiffness: 70, damping: 15 });
  const rotateY = useTransform([sx, sway], ([a, b]: number[]) => LEAN + a * 7 + b * 1.6), rotateX = useTransform(sy, (v) => -v * 3.5);
  const rack = useRef<HTMLDivElement>(null), pockets = useRef<Record<string, HTMLLabelElement | null>>({}), touched = useRef(false), run = useRef(0), seatRef = useRef(START);

  useEffect(() => {
    if (slot === seatRef.current) return;
    const me = ++run.current, from = seatRef.current, land = () => { seatRef.current = slot; setSeat(slot); setFlight(null); };
    const a = pockets.current[from], b = pockets.current[slot];
    if (reduce || !a || !b) { land(); y.set(0); return; }
    // measured in the rack's own flat coordinates, so the turn of the rack does not matter
    const at = (el: HTMLElement) => { const row = el.offsetParent as HTMLElement; return { x: el.offsetLeft + row.offsetLeft, y: el.offsetTop + row.offsetTop }; };
    const pa = at(a), pb = at(b);
    (async () => {
      await animate(y, -UP, { duration: 0.2, ease: [0.3, 0, 0.3, 1] }); // pulled up out of the old pocket
      if (me !== run.current) return;
      setFlight({ x0: pa.x, y0: pa.y, x1: pb.x, y1: pb.y, w: a.offsetWidth });
      await new Promise((done) => window.setTimeout(done, 430)); // carried across the front of the rack
      if (me !== run.current) return;
      land(); y.set(-UP);
      await animate(y, 0, { type: "spring", stiffness: 520, damping: 19, mass: 0.9 }); // dropped behind the lip
      if (me === run.current) setThud((t) => ({ id: slot, n: t.n + 1 }));
    })();
  }, [slot, reduce, y]);

  useEffect(() => {
    if (reduce) return;
    const s = animate(sway, [-1, 1], { duration: 6.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" });
    if (!AUTOPLAY) return () => s.stop();
    const tour = ["4-1", "2-0", "6-1", "1-1", "6-0"]; let i = 0, timer = 0;
    const first = window.setTimeout(() => {
      const tick = () => { if (touched.current || document.hidden) return; setSlot(tour[i % tour.length]); i++; };
      tick(); timer = window.setInterval(tick, 3000);
    }, 3100);
    return () => { s.stop(); window.clearTimeout(first); window.clearInterval(timer); };
  }, [reduce, sway]);

  const [row, col] = slot.split("-").map(Number);
  const choose = (id: string) => { touched.current = true; setSlot(id); };
  const onMove = (e: ReactPointerEvent) => { if (e.pointerType !== "mouse") return; const b = e.currentTarget.getBoundingClientRect(); px.set(((e.clientX - b.left) / b.width - 0.5) * 2); py.set(((e.clientY - b.top) / b.height - 0.5) * 2); };
  const deep: CSSProperties = { transformStyle: "preserve-3d" };
  const plate = "linear-gradient(180deg,#f7f2e4,#e3dac4)", plateEdge = "inset 0 1px 0 #fff, inset 0 0 0 1px rgba(60,48,20,0.3), 0 2px 3px rgba(0,0,0,0.5)";
  const cols = "grid grid-cols-[46px_1fr_1fr] gap-x-2 sm:grid-cols-[72px_1fr_1fr] sm:gap-x-3";

  return (
    <div onPointerMove={onMove} onPointerLeave={() => { px.set(0); py.set(0); }} className="relative flex min-h-[820px] w-full flex-col items-center justify-center overflow-hidden bg-[#e4ddcf] px-4 py-10 sm:px-6" style={{ backgroundImage: "radial-gradient(90% 70% at 30% 20%,#f4efe4 0%,#e4ddcf 55%,#cfc7b6 100%)" }}>
      <style>{`@keyframes barbershop-appointment-card-rack-rattle{0%,100%{transform:translate3d(0,0,var(--z)) rotate(var(--tilt))}30%{transform:translate3d(0,2px,var(--z)) rotate(calc(var(--tilt) + .9deg))}60%{transform:translate3d(0,-1px,var(--z)) rotate(calc(var(--tilt) - .5deg))}}
@media (prefers-reduced-motion:reduce){.barbershop-appointment-card-rack-rattle{animation:none!important}}`}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 mix-blend-multiply" style={{ backgroundImage: PLASTER, opacity: 0.5 }} />
      <div className="relative w-full max-w-[600px]" style={{ perspective: 1700 }}>
        <motion.div className="relative px-3 pb-7 pt-3 sm:px-5" style={{ ...deep, rotateY, rotateX }}>
          <div aria-hidden="true" className="absolute inset-x-3 bottom-[-10px] top-6 rounded-[20px] bg-[#3d3018]/80 blur-2xl" style={{ transform: "translate3d(44px,34px,-60px)" }} />
          <div aria-hidden="true" className="absolute right-0 top-0 h-full w-[26px] origin-right" style={{ transform: "rotateY(-90deg)", background: "linear-gradient(90deg,#0c1f19,#17342b 60%,#1f4338)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)" }} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[10px] bg-[#23473d]" style={{ backgroundImage: "linear-gradient(115deg,rgba(255,255,255,0.16) 0%,rgba(255,255,255,0.03) 28%,rgba(255,255,255,0.07) 44%,rgba(0,0,0,0.05) 60%,rgba(0,0,0,0.2) 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 0 0 1px rgba(0,0,0,0.25), 0 14px 18px -4px rgba(70,56,30,0.4)" }}>
            <div className="absolute inset-0 mix-blend-overlay" style={{ backgroundImage: HAMMER, opacity: 0.55 }} />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ transform: "translateZ(2px)" }}><Screw className="left-2.5 top-2.5" /><Screw className="right-2.5 top-2.5" /><Screw className="bottom-2.5 left-2.5" /><Screw className="bottom-2.5 right-2.5" /></div>
          <div className="relative mx-auto mb-3 w-fit rounded-[4px] px-5 py-2 text-center" style={{ background: plate, boxShadow: plateEdge, transform: "translateZ(4px)" }}>
            <p className="font-mono text-[10px] uppercase leading-4 tracking-[0.24em] text-[#5c5443]">Appointments</p>
            <p className="text-[15px] font-bold uppercase leading-5 tracking-[0.14em] text-[#1d1a16] sm:text-[17px]">{DAY}</p>
          </div>
          <div className={`relative ${cols}`} style={{ transform: "translateZ(3px)" }}>
            <span />
            {CHAIRS.map((c, i) => (
              <p key={c} className="mx-auto mb-[46px] w-fit rounded-[3px] px-2 py-1 font-mono text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-[#2b2110] sm:px-3 sm:text-[11px] sm:tracking-[0.16em]" style={{ background: "linear-gradient(180deg,#e2c078,#b8914a 55%,#d2ad62)", boxShadow: "inset 0 1px 0 rgba(255,246,214,0.8), 0 1px 2px rgba(0,0,0,0.5)" }}>Chair {i + 1} · {c}</p>
            ))}
          </div>
          <div ref={rack} role="radiogroup" aria-label={`Appointment time on ${DAY}`} className="relative" style={deep}>
            {HOURS.map((h, r) => (
              <div key={h} className={`relative h-[62px] ${cols}`} style={deep}>
                <div aria-hidden="true" className="relative" style={{ transform: "translateZ(4px)" }}>
                  <span className="absolute inset-x-0 bottom-[5px] rounded-[3px] py-1 text-center text-[11px] font-bold leading-4 tracking-tight text-[#1d1a16] sm:text-[13px]" style={{ background: plate, boxShadow: plateEdge }}>{h.replace(/ [ap]m/, "")}<span className="hidden text-[9px] font-normal uppercase text-[#5c5443] sm:inline"> {h.slice(-2)}</span></span>
                </div>
                {CHAIRS.map((chair, c) => {
                  const id = `${r}-${c}`, card = TAKEN[id], here = seat === id && !flight, near = thud.id.endsWith(`-${c}`) && Math.abs(Number(thud.id.split("-")[0]) - r) === 1, z = r * 3; // lower pockets stand a little further out, as on a real rack
                  return (
                    <label key={id} ref={(el) => { pockets.current[id] = el; }} className={`group relative block h-full ${card ? "cursor-not-allowed" : "cursor-pointer"}`} style={deep}>
                      <input type="radio" name="barbershop-appointment-card-rack-slot" className="peer sr-only" checked={slot === id} disabled={!!card} onChange={() => choose(id)} aria-label={`${h} with ${chair}${card ? ", taken" : ""}`} />
                      <span aria-hidden="true" className="absolute inset-x-0 bottom-[18px] top-[-6px] rounded-t-[5px]" style={{ transform: `translateZ(${z + 1}px)`, background: "linear-gradient(180deg,#1d3d34 0,#19362e 55%,#07100d 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 0 0 1px rgba(0,0,0,0.35), inset 0 -10px 10px -2px rgba(0,0,0,0.75)" }} />
                      {card && (
                        <span key={near ? thud.n : 0} aria-hidden="true" className={`absolute inset-x-[5px] top-[-12px] block h-[70px] ${near ? "barbershop-appointment-card-rack-rattle" : ""}`} style={{ ["--tilt" as string]: `${tilt(id)}deg`, ["--z" as string]: `${z + 8}px`, marginTop: Math.round((tilt(id) + 0.66) * 3), transform: `translate3d(0,0,${z + 8}px) rotate(${tilt(id)}deg)`, animation: near ? "barbershop-appointment-card-rack-rattle .34s ease-out" : undefined }}>
                          <Card {...card} />
                        </span>
                      )}
                      {here && (
                        <motion.span aria-hidden="true" className="absolute inset-x-[5px] top-[-12px] block h-[70px]" style={{ y, z: z + 8 }}>
                          <Card name={MINE.name} job={MINE.job} stock="#fbf8f0" no="0447" mine />
                        </motion.span>
                      )}
                      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 top-[30px] rounded-b-[4px] rounded-t-[2px] transition-[filter] duration-150 group-hover:brightness-110 motion-reduce:transition-none" style={{ transform: `translateZ(${z + 10}px)`, background: "linear-gradient(180deg,#a5d2c2 0,#5d9382 2px,#356356 5px,#2a5247 9px,#264a40 60%,#1b3830 100%)", boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.5), inset 1px 0 0 rgba(255,255,255,0.08), inset -1px 0 0 rgba(0,0,0,0.25), 0 4px 5px rgba(0,0,0,0.55), 0 1px 1px rgba(0,0,0,0.6)" }}>
                        <span className="absolute inset-0 rounded-b-[4px] mix-blend-overlay" style={{ backgroundImage: HAMMER, opacity: 0.5 }} />
                        <span className="absolute left-[7px] top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%,#a9cdbf,#2a5045 70%)", boxShadow: "0 1px 0 rgba(0,0,0,0.5)" }} />
                        <span className="absolute right-[7px] top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%,#a9cdbf,#2a5045 70%)", boxShadow: "0 1px 0 rgba(0,0,0,0.5)" }} />
                        {!card && slot !== id && <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] uppercase tracking-[0.22em] text-[#c5e0d5] opacity-0 transition-opacity duration-150 group-hover:opacity-100 motion-reduce:transition-none">free</span>}
                      </span>
                      <span aria-hidden="true" className="pointer-events-none absolute -inset-x-1 -top-4 bottom-[14px] rounded-md opacity-0 ring-2 ring-white peer-focus-visible:opacity-100" style={{ transform: `translateZ(${z + 12}px)` }} />
                    </label>
                  );
                })}
              </div>
            ))}
            {flight && (
              <motion.div aria-hidden="true" className="pointer-events-none absolute h-[70px]" style={{ left: 5, top: -12 - UP, width: flight.w - 10, z: 36 }} initial={{ x: flight.x0, y: flight.y0, rotate: 0, scale: 1 }} animate={{ x: flight.x1, y: [flight.y0, Math.min(flight.y0, flight.y1) - 34, flight.y1], rotate: [0, flight.x1 > flight.x0 ? 5 : flight.x1 < flight.x0 ? -5 : 2, 0], scale: [1, 1.06, 1] }} transition={{ duration: 0.43, ease: [0.4, 0, 0.3, 1] }}>
                <Card name={MINE.name} job={MINE.job} stock="#fbf8f0" no="0447" mine />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
      <p aria-live="polite" className="relative mt-10 text-center">
        <span className="block text-[17px] font-semibold leading-6 tracking-tight text-stone-900">{DAY}, {HOURS[row]} with {CHAIRS[col]}</span>
        <span className="block font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-stone-600">{SHOP} <span className="mx-1 hidden text-stone-400 sm:inline">/</span> <span className="block sm:inline">drop your card in a free pocket</span></span>
      </p>
    </div>
  );
}
