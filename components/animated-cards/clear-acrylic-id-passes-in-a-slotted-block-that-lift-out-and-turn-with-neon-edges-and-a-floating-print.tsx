import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

// One entry per pass. `edge` is the colour of the fluorescent sheet it is cut from.
const passes = [
  {
    name: "Tobi Adeyemi",
    role: "SPEAKER",
    no: "014",
    edge: "#c4ff3d",
    tone: "#8a2bd6",
    photo: "https://images.pexels.com/photos/9363613/pexels-photo-9363613.jpeg?auto=compress&cs=tinysrgb&w=600",
    alt: "A man with a round afro in a white shirt, lit violet against a bright purple wall",
    at: "50% 18%",
  },
  {
    name: "Mara Vidal",
    role: "CREW",
    no: "102",
    edge: "#4fd8ff",
    tone: "#c40f3c",
    photo: "https://images.pexels.com/photos/21352926/pexels-photo-21352926.jpeg?auto=compress&cs=tinysrgb&w=600",
    alt: "A woman in a green top and black jacket with one arm raised behind her head, against a red backdrop",
    at: "50% 12%",
  },
  {
    name: "Sam Okoro",
    role: "ARTIST",
    no: "057",
    edge: "#ff8a2a",
    tone: "#1f4a37",
    photo: "https://images.pexels.com/photos/7301578/pexels-photo-7301578.jpeg?auto=compress&cs=tinysrgb&w=600",
    alt: "A man seen from behind his shoulder in a blue knitted beanie and jumper, against a dark green wall",
    at: "60% 20%",
  },
];
const event = { name: "OFFCUT", year: "26" };
const BW = 188; // pass width
const BH = 268; // pass height
const THICK = 16; // sheet thickness
const RIM = 12; // clear margin round the print
const TOP = 36; // clear margin above the print, where the strap slot is cut
const GAP = 208; // distance between pass centres
const REST = -22; // angle a pass sits at in its slot, in degrees
const LIFT = 58; // how far the chosen pass rises
const HOLD = 3400; // milliseconds each pass is held up while it plays by itself
const BLOCK = { w: 644, h: 38, d: 96 };
const SCENE_H = BH + LIFT + BLOCK.h + 8;
const PW = BW - RIM * 2, PH = BH - TOP - RIM; // size of the printed photograph

export default function ClearAcrylicIdPasses() {
  const root = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [picked, setPicked] = useState(1);
  const [scale, setScale] = useState(1);
  const touched = useRef(0);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const turn = useSpring(mx, { stiffness: 60, damping: 14 });
  const tip = useSpring(my, { stiffness: 60, damping: 14 });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1.36, (el.clientWidth - 32) / BLOCK.w));
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Plays by itself until someone picks a pass, and again a while after they stop.
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      if (document.hidden || performance.now() - touched.current < 9000) return;
      setPicked((p) => (p + 1) % passes.length);
    }, HOLD);
    return () => window.clearInterval(id);
  }, [reduce]);

  const pick = (i: number) => { touched.current = performance.now(); setPicked(i); };
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 120, damping: 13, mass: 1.1 };
  const layers = Array.from({ length: THICK / 2 - 1 }, (_, i) => -THICK / 2 + 2 + i * 2);

  return (
    <div
      ref={root}
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width - 0.5) * 16); my.set(((e.clientY - r.top) / r.height - 0.5) * -6);
      }}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
      className="relative flex min-h-[680px] w-full items-center justify-center overflow-hidden bg-[#161924] pb-24 pt-16"
    >
      <style>{`
        @keyframes clear-acrylic-id-passes-sway { 0%, 100% { transform: rotateY(-7deg); } 50% { transform: rotateY(7deg); } }
        .clear-acrylic-id-passes-sway { animation: clear-acrylic-id-passes-sway 5.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .clear-acrylic-id-passes-sway { animation: none; } }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 60% at 50% 40%, #343a50 0%, #1f2331 48%, #161924 100%)" }} />

      {/* Sized with zoom, not a scale transform, so the lettering is drawn sharp at the final size. */}
      <div className="relative" style={{ zoom: scale }}>
        <div className="relative" style={{ width: BLOCK.w, height: SCENE_H, perspective: 1700, perspectiveOrigin: "50% 30%" }}>
          <motion.div className="absolute inset-0" style={{ transformStyle: "preserve-3d", rotateX: -11, rotateY: turn, x: 0, y: tip }}>
            {/* Shadow of the block on the floor. */}
            <div aria-hidden="true" className="absolute rounded-[50%]" style={{ left: -30, top: SCENE_H - 70, width: BLOCK.w + 60, height: 140, background: "radial-gradient(closest-side, rgba(0,0,0,0.7), rgba(0,0,0,0.3) 60%, rgba(0,0,0,0))", transform: "rotateX(90deg)", filter: "blur(6px)" }} />

            {/* The anodised block: a top with three diagonal slots and a brushed front. */}
            <div aria-hidden="true" className="absolute left-0 rounded-[3px]" style={{ top: SCENE_H - BLOCK.h - BLOCK.d / 2, width: BLOCK.w, height: BLOCK.d, transform: "rotateX(90deg)", background: "linear-gradient(180deg, #a9acb4 0%, #c6c8ce 55%, #dcdde2 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.3)" }}>
              {passes.map((p, i) => (
                <div key={p.no} className="absolute" style={{ left: BLOCK.w / 2 + (i - 1) * GAP - BW / 2 - 3, top: BLOCK.d / 2 - (THICK + 4) / 2, width: BW + 6, height: THICK + 4, transform: `rotate(${-REST}deg)` }}>
                  <div className="absolute rounded-[50%] bg-black transition-opacity duration-500" style={{ left: 6, right: 6, top: -8, height: THICK + 30, filter: "blur(9px)", opacity: picked === i ? 0.35 : 0 }} />
                  <div className="absolute inset-0 rounded-[3px] bg-[#0b0b0d]" style={{ boxShadow: `inset 0 2px 3px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.6), 0 0 ${picked === i ? 10 : 22}px ${picked === i ? 1 : 3}px ${p.edge}${picked === i ? "30" : "66"}` }} />
                </div>
              ))}
            </div>
            <div aria-hidden="true" className="absolute left-0 overflow-hidden rounded-b-[3px]" style={{ top: SCENE_H - BLOCK.h, width: BLOCK.w, height: BLOCK.h, transform: `translateZ(${BLOCK.d / 2}px)`, background: "linear-gradient(180deg, #f4f5f7 0%, #b9bcc3 7%, #8f929a 58%, #5f626a 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }}>
              <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0 1px, rgba(0,0,0,0.06) 1px 3px)" }} />
              {/* Each sheet throws a little of its colour onto the metal below it. */}
              {passes.map((p, i) => (
                <div key={p.no} className="absolute top-0 h-full transition-opacity duration-500" style={{ left: BLOCK.w / 2 + (i - 1) * GAP - BW / 2 + 6, width: BW - 12, background: `linear-gradient(180deg, ${p.edge}aa 0%, ${p.edge}33 45%, ${p.edge}00 100%)`, filter: "blur(7px)", opacity: picked === i ? 0.3 : 0.75 }} />
              ))}
              <p className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[8px] font-semibold tracking-[0.34em] text-[#2a2c33]/70">{event.name} / {event.year}</p>
            </div>

            {passes.map((p, i) => {
              const up = picked === i;
              return (
                <motion.div
                  key={p.no}
                  className="absolute"
                  style={{ left: BLOCK.w / 2 + (i - 1) * GAP - BW / 2, top: SCENE_H - BLOCK.h - BH, width: BW, height: BH, transformStyle: "preserve-3d" }}
                  initial={false}
                  animate={{ y: up ? -LIFT : 0, rotateY: up ? 6 : REST }}
                  transition={spring}
                >
                  <div className={`absolute inset-0 ${up ? "clear-acrylic-id-passes-sway" : ""}`} style={{ transformStyle: "preserve-3d" }}>
                    {/* Back of the sheet: the photograph is printed here and seen through the plastic. */}
                    <div className="absolute inset-0 rounded-[16px]" style={{ transform: `translateZ(${-THICK / 2}px)`, border: `2px solid ${p.edge}`, background: "rgba(255,255,255,0.04)" }}>
                      <div className="absolute overflow-hidden rounded-[5px]" style={{ left: RIM - 2, top: TOP - 2, width: PW, height: PH, backgroundColor: p.tone }}>
                        <img src={p.photo} alt={p.alt} width={PW} height={PH} loading="eager" draggable={false} className="h-full w-full select-none object-cover" style={{ objectPosition: p.at }} />
                        <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 56%, rgba(0,0,0,0.66) 100%)" }} />
                      </div>
                    </div>
                    {/* Shadow that the white ink on the front throws back onto the print. */}
                    <div aria-hidden="true" className="absolute inset-0 text-black/50" style={{ transform: `translateZ(${-THICK / 2 + 1}px)`, filter: "blur(1.4px)" }}>
                      <Ink p={p} />
                    </div>
                    {/* The body of the sheet: stacked outlines that read as one glowing edge from the side. */}
                    {layers.map((z) => (
                      <div key={z} aria-hidden="true" className="absolute inset-0 rounded-[16px]" style={{ transform: `translateZ(${z}px)`, border: `2.5px solid ${p.edge}`, opacity: 0.62, boxShadow: z === 0 ? `0 0 22px 0 ${p.edge}77` : undefined }} />
                    ))}
                    {/* Light bent at the cut edges: the print mirrored into the clear margin. */}
                    <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[16px]" style={{ transform: "translateZ(2px)", opacity: 0.36 }}>
                      {[
                        { box: { left: 3, top: TOP, width: RIM - 3, height: PH }, inner: { left: RIM - 3 - PW, top: 0 }, flip: "scaleX(-1)" },
                        { box: { left: BW - RIM, top: TOP, width: RIM - 3, height: PH }, inner: { left: 0, top: 0 }, flip: "scaleX(-1)" },
                        { box: { left: RIM, top: BH - RIM, width: PW, height: RIM - 3 }, inner: { left: 0, top: 0 }, flip: "scaleY(-1)" },
                      ].map((r, k) => (
                        <div key={k} className="absolute overflow-hidden" style={{ ...r.box, filter: "blur(0.6px) saturate(1.3) brightness(1.15)" }}>
                          <div className="absolute" style={{ ...r.inner, width: PW, height: PH, backgroundImage: `url(${p.photo})`, backgroundSize: "cover", backgroundPosition: p.at, backgroundColor: p.tone, transform: r.flip }} />
                        </div>
                      ))}
                    </div>
                    {/* Front of the sheet: white ink, the strap slot, bevel and gloss. */}
                    <div className="absolute inset-0 overflow-hidden rounded-[16px] text-white" style={{ transform: `translateZ(${THICK / 2}px)`, border: `1.5px solid ${p.edge}`, boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.55), inset 2px 2px 3px rgba(255,255,255,0.6), inset -3px -4px 7px ${p.edge}aa, inset 0 0 18px ${p.edge}2e`, background: "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02) 30%, rgba(255,255,255,0.05))" }}>
                      <div aria-hidden="true" className="absolute left-1/2 top-[13px] h-[10px] w-[50px] -translate-x-1/2 rounded-full bg-[#1b1e2b]" style={{ boxShadow: `inset 0 2px 2px rgba(0,0,0,0.5), inset 0 -1.5px 0 ${p.edge}, 0 0 0 1.5px ${p.edge}cc, 0 1px 0 2px rgba(255,255,255,0.35)` }} />
                      <Ink p={p} />
                      <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(118deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 16%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 54%, rgba(255,255,255,0.2) 60%, rgba(255,255,255,0.04) 68%, rgba(255,255,255,0) 76%)" }} />
                    </div>
                    <button
                      type="button"
                      onClick={() => pick(i)}
                      aria-pressed={up}
                      aria-label={`${p.name}, ${p.role.toLowerCase()}, pass number ${p.no}. ${up ? "Lifted out." : "Press to lift it out of the block."}`}
                      className="absolute inset-0 cursor-pointer rounded-[16px] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#161924]"
                      style={{ transform: `translateZ(${THICK / 2 + 1}px)` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-7 left-7 font-mono text-[10px] font-semibold uppercase leading-5 tracking-[0.22em] text-zinc-100">
        {event.name} {event.year} passes
        <span className="block font-medium text-zinc-400">Pick a pass to lift it out of the block</span>
      </p>
    </div>
  );
}

// Everything printed in white on the front. Drawn twice: once as ink and once, blurred, as its shadow.
function Ink({ p }: { p: (typeof passes)[number] }) {
  return (
    <div className="absolute" style={{ left: RIM, top: TOP, width: PW, height: PH }}>
      <p className="absolute left-[11px] top-[10px] text-[11px] font-black tracking-[0.26em]">{event.name}</p>
      <p className="absolute right-[11px] top-[10px] font-mono text-[10px] font-bold tracking-[0.1em]">{event.year}</p>
      <p className="absolute bottom-[40px] left-[11px] text-[7.5px] font-bold tracking-[0.3em]">{p.role}</p>
      <p className="absolute bottom-[14px] left-[10px] right-[10px] text-[21px] font-bold leading-[0.95] tracking-[-0.02em]">{p.name}</p>
      <p className="absolute bottom-[42px] right-[11px] font-mono text-[7.5px] font-bold tracking-[0.16em]">No. {p.no}</p>
    </div>
  );
}
