import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// One roll of twelve. `photo` is a square crop from Pexels; `tone` is the grey shown while the picture loads.
const frames = [
  { photo: "https://images.pexels.com/photos/10856898/pexels-photo-10856898.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800", tone: "#1b1b1b", alt: "Woman in a black vest top with her hair blown sideways against a dark studio wall" },
  { photo: "https://images.pexels.com/photos/12022522/pexels-photo-12022522.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800", tone: "#8d8d8d", alt: "Young woman with long dark hair resting her cheek on her hand" },
  { photo: "https://images.pexels.com/photos/16307205/pexels-photo-16307205.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800", tone: "#6f6f6f", alt: "Woman in a dark jumper with both arms raised above her head" },
  { photo: "https://images.pexels.com/photos/16929699/pexels-photo-16929699.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800", tone: "#7a7a7a", alt: "Model in a sleeveless top with her hands on her head and her face in shadow" },
  { photo: "https://images.pexels.com/photos/17040863/pexels-photo-17040863.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800", tone: "#bdbdbd", alt: "Woman in a trench coat, hat and round sunglasses seen in profile" },
  { photo: "https://images.pexels.com/photos/20459101/pexels-photo-20459101.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800", tone: "#1e1e1e", alt: "Woman in a black halter top holding one hand beside her face" },
  { photo: "https://images.pexels.com/photos/20480963/pexels-photo-20480963.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800", tone: "#c4c4c4", alt: "Model bent over backwards with her hair hanging down, in a white T-shirt and jeans" },
  { photo: "https://images.pexels.com/photos/24972993/pexels-photo-24972993.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800", tone: "#555555", alt: "Woman with short curly hair in a slip dress resting her chin on her hand" },
  { photo: "https://images.pexels.com/photos/39553398/pexels-photo-39553398.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800", tone: "#6a6a6a", alt: "Woman with a short bob touching her collar and chin with both hands" },
  { photo: "https://images.pexels.com/photos/37524408/pexels-photo-37524408.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800", tone: "#3a3a3a", alt: "Woman in an oversized white shirt in profile in front of a round light" },
  { photo: "https://images.pexels.com/photos/36298417/pexels-photo-36298417.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800", tone: "#cfcfcf", alt: "Dancer in a patterned blouse and short skirt caught mid step with ribbons flying" },
  { photo: "https://images.pexels.com/photos/9251126/pexels-photo-9251126.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=800&h=800", tone: "#909090", alt: "Woman looking down under the wide brim of a black felt hat" },
];
const GREASE = "#f2463a"; // the wax colour: circles, slashes and the pencil itself
const STOCK = "ORWIN PAN 400"; // edge lettering printed along each strip
const JOB = { roll: "ROLL 14", sitter: "N. ROSSET", date: "6 MAR" };
const REJECTS = [2, 7]; // frames that arrive already struck through
const START = [1, 9]; // frames that arrive already circled, oldest first
const DEMO = [5, 3, 10, 0, 8]; // frames the self-running demo circles in turn
const PER_STRIP = 3;


// A hand-drawn ring: a little more than one turn, never quite closing on itself, different for every frame.
const ringPath = (seed: number) => {
  let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const rx = 55 + rnd() * 5, ry = 53 + rnd() * 5, tilt = (rnd() - 0.5) * 0.6, a0 = -2.4 + rnd() * 1.3, sweep = 6.9 + rnd() * 0.6, wob = rnd() * 6;
  const pts: string[] = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64, a = a0 + sweep * t, grow = 0.95 + 0.11 * t + 0.025 * Math.sin(t * 8 + wob);
    const x = Math.cos(a) * rx * grow, y = Math.sin(a) * ry * grow;
    pts.push(`${(50 + x * Math.cos(tilt) - y * Math.sin(tilt)).toFixed(1)} ${(50 + x * Math.sin(tilt) + y * Math.cos(tilt)).toFixed(1)}`);
  }
  return "M" + pts.join("L");
};

export default function ContactSheetGreasePencilGallery() {
  const reduce = useReducedMotion();
  const [picked, setPicked] = useState<number[]>(START);
  const [shown, setShown] = useState(START[START.length - 1]);
  const [drawn, setDrawn] = useState<number[]>([]); // frames whose ring should animate (anything circled after load)
  const touched = useRef(0);
  const rings = useMemo(() => frames.map((_, i) => ringPath(i + 3)), []);
  const strips = useMemo(() => {
    const out: number[][] = [];
    for (let i = 0; i < frames.length; i += PER_STRIP) out.push(frames.slice(i, i + PER_STRIP).map((_, k) => i + k));
    return out;
  }, []);

  const toggle = (i: number, fromUser: boolean) => {
    if (fromUser) touched.current = Date.now();
    setPicked((p) => {
      if (p.includes(i)) { const rest = p.filter((v) => v !== i); if (rest.length) setShown(rest[rest.length - 1]); return rest; }
      setShown(i); setDrawn((d) => (d.includes(i) ? d : [...d, i]));
      return [...p, i];
    });
  };

  // Until someone touches it, the pencil keeps working down the sheet by itself.
  useEffect(() => {
    if (reduce) return;
    let step = 0;
    let timer = window.setTimeout(function tick() {
      if (Date.now() - touched.current > 8000 && !document.hidden) {
        const i = DEMO[step % DEMO.length]; step++;
        setPicked((p) => {
          const next = p.filter((v) => v !== i);
          while (next.length > 2) next.shift();
          return [...next, i];
        });
        setDrawn((d) => (d.includes(i) ? d : [...d, i]));
        setShown(i);
      }
      timer = window.setTimeout(tick, 3400);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [reduce]);

  const order = picked.indexOf(shown) + 1;

  return (
    <div className="relative flex min-h-[800px] w-full flex-col items-center justify-center overflow-hidden bg-[#dedad1] bg-[radial-gradient(90%_70%_at_30%_20%,#efece5_0%,#dedad1_55%,#cbc6bb_100%)] px-4 py-10 sm:min-h-[760px]">
      <style>{`
        .csgp-gloss { background: linear-gradient(118deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.2) 44%, rgba(255,255,255,0.05) 52%, rgba(255,255,255,0) 64%); }
        @media (prefers-reduced-motion: reduce) { .csgp-frame img { transition: none !important; } }
      `}</style>
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <defs>
          {/* Wax on gloss: the line wobbles and skips where the pencil rode over the surface. */}
          <filter id="csgp-wax" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="9" result="g" />
            <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 1.95" result="skip" />
            <feComposite in="d" in2="skip" operator="in" />
          </filter>
        </defs>
      </svg>

      <div className="relative h-[720px] w-[328px] sm:h-[640px] sm:w-[800px]">
        {/* The contact sheet: glossy paper, exposed black except for the easel margin. */}
        <div className="absolute left-0 top-0 w-[300px] -rotate-[2.2deg] bg-[#f6f4ee] p-[9px] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_40px_50px_-24px_rgba(40,32,20,0.55),0_10px_18px_-6px_rgba(40,32,20,0.35),0_1px_2px_rgba(40,32,20,0.4)] sm:left-[10px] sm:top-[8px] sm:w-[400px] sm:p-[12px]">
          <div className="relative bg-[#050505] px-[4%] pb-[13%] pt-[4%]">
            <div className="flex flex-col gap-[7px] sm:gap-[10px]">
              {strips.map((strip, r) => (
                <div key={r} className="relative bg-[#101010] px-[5px] py-[11px] shadow-[0_0_0_1px_rgba(255,255,255,0.035)] sm:px-[7px] sm:py-[14px]">
                  <div aria-hidden="true" className="absolute inset-x-[7px] top-[2px] flex justify-between font-mono text-[5.5px] font-semibold leading-[8px] tracking-[0.18em] text-[#e9e6dc]/80 sm:top-[3px] sm:text-[7px] sm:leading-[9px]">
                    {strip.map((i) => <span key={i}>{STOCK}</span>)}
                  </div>
                  <ul className="grid grid-cols-3 gap-[5px] sm:gap-[7px]">
                    {strip.map((i) => {
                      const on = picked.includes(i);
                      return (
                        <li key={i} className="relative">
                          <button
                            type="button"
                            aria-pressed={on}
                            aria-label={`Frame ${i + 1}: ${frames[i].alt}`}
                            onClick={() => toggle(i, true)}
                            style={{ backgroundColor: frames[i].tone }}
                            className="csgp-frame group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-[1.5px] outline-none focus-visible:ring-2 focus-visible:ring-[#f2463a] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                          >
                            <img src={frames[i].photo} alt="" width={800} height={800} className="h-full w-full object-cover contrast-[1.12] grayscale transition-[filter] duration-300 group-hover:brightness-110" />
                          </button>
                          <svg aria-hidden="true" viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
                            {REJECTS.includes(i) && <path d="M10 92 C 34 70, 58 40, 91 9" fill="none" stroke={GREASE} strokeWidth="5" strokeLinecap="round" filter="url(#csgp-wax)" opacity="0.92" />}
                            <AnimatePresence>
                              {on && (
                                <motion.path
                                  key="ring"
                                  d={rings[i]}
                                  fill="none"
                                  stroke={GREASE}
                                  strokeWidth="5.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  filter="url(#csgp-wax)"
                                  initial={drawn.includes(i) && !reduce ? { pathLength: 0, opacity: 1 } : false}
                                  animate={{ pathLength: 1, opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ pathLength: { duration: 0.55, ease: [0.3, 0.1, 0.25, 1] }, opacity: { duration: 0.25 } }}
                                />
                              )}
                            </AnimatePresence>
                          </svg>
                        </li>
                      );
                    })}
                  </ul>
                  <div aria-hidden="true" className="absolute inset-x-[5px] bottom-[1.5px] grid grid-cols-3 gap-[5px] font-mono text-[6px] font-bold leading-[8px] text-[#e9e6dc]/85 sm:inset-x-[7px] sm:bottom-[2.5px] sm:text-[7.5px] sm:leading-[9px]">
                    {strip.map((i) => <span key={i} className="flex justify-between px-[2px]"><span>{"▸"} {i + 1}</span><span>{i + 1}A</span></span>)}
                  </div>
                </div>
              ))}
            </div>
            {/* typed job label stuck along the bottom */}
            <div aria-hidden="true" className="absolute bottom-[3.2%] left-[4%] -rotate-[0.6deg] bg-[#efe9d6] px-2 py-[3px] font-mono text-[7px] font-semibold uppercase tracking-[0.16em] text-[#2b2620] shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-[9px]">
              {JOB.roll} <span className="mx-1 text-[#2b2620]/40">/</span> {JOB.sitter} <span className="mx-1 text-[#2b2620]/40">/</span> {JOB.date}
            </div>
            <div aria-hidden="true" className="csgp-gloss pointer-events-none absolute inset-0" />
          </div>
        </div>

        {/* The work print of the frame circled last. */}
        <div className="absolute left-[100px] top-[462px] h-[236px] w-[224px] sm:left-[420px] sm:top-[84px] sm:h-[408px] sm:w-[376px]">
          <AnimatePresence initial={false}>
            <motion.figure
              key={shown}
              initial={reduce ? false : { opacity: 0, y: -26, x: -30, rotate: (shown % 2 ? 1 : -1) * 7, scale: 1.05 }}
              animate={{ opacity: 1, y: 0, x: 0, rotate: 2.4 + ((shown * 37) % 5) * 0.5 - 1, scale: 1 }}
              exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.985, transition: { duration: 0.5, delay: 0.25 } }}
              transition={{ type: "spring", stiffness: 190, damping: 21, mass: 0.9 }}
              className="absolute inset-0 m-0 bg-[#fbfaf6] p-[9px] pb-[21px] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_46px_56px_-26px_rgba(40,32,20,0.6),0_12px_20px_-6px_rgba(40,32,20,0.35),0_1px_2px_rgba(40,32,20,0.4)] sm:p-[18px] sm:pb-[50px]"
            >
              <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: frames[shown].tone }}>
                <img src={frames[shown].photo} alt={frames[shown].alt} width={800} height={800} className="h-full w-full object-cover contrast-[1.1] grayscale" />
                <div aria-hidden="true" className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.14)]" />
              </div>
              <figcaption className="absolute bottom-[5px] left-[10px] font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-[#3b362e] sm:bottom-[18px] sm:left-[18px] sm:text-[10px]">
                Frame {String(shown + 1).padStart(2, "0")}
                <span className="mx-2 text-[#3b362e]/35">/</span>
                {order > 0 ? `Keeper ${order} of ${picked.length}` : "Work print"}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {/* The grease pencil: paper-wrapped barrel, torn back from a blunt wax point. */}
        <div aria-hidden="true" className="absolute left-[0px] top-[650px] h-[13px] w-[150px] -rotate-[14deg] sm:left-[452px] sm:top-[556px] sm:h-[18px] sm:w-[290px] sm:-rotate-[7deg]">
          <div className="absolute -bottom-[7px] left-[6px] right-0 h-[9px] rounded-full bg-[#3a2c1c]/55 blur-[5px]" />
          <div className="absolute inset-y-0 left-0 w-[11%] bg-[linear-gradient(180deg,#ff8f84_0%,#e23a2e_38%,#a81d15_78%,#6d100b_100%)] [clip-path:polygon(0_38%,100%_0,100%_100%,0_68%)]" style={{ backgroundColor: GREASE }} />
          <div className="absolute inset-y-0 left-[10.5%] w-[5%] bg-[linear-gradient(180deg,#fff7ea_0%,#eadfca_45%,#b7a98d_100%)] [clip-path:polygon(0_0,100%_0,82%_22%,100%_46%,78%_70%,100%_100%,0_100%)]" />
          <div className="absolute inset-y-0 left-[14.5%] right-0 overflow-hidden rounded-r-[3px] bg-[linear-gradient(180deg,#ff8a7d_0%,#ee4a3d_22%,#d8342a_50%,#9c1b14_84%,#6a0f0b_100%)]">
            <div className="absolute inset-x-0 top-[17%] h-[13%] bg-white/45 blur-[0.6px]" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(118deg,rgba(0,0,0,0)_0_21px,rgba(60,8,5,0.28)_21px_22px)]" />
            <div className="absolute right-[9%] top-1/2 -translate-y-1/2 font-mono text-[5.5px] font-bold tracking-[0.22em] text-[#ffe9df]/90 sm:text-[7px]">CHINA MARKER 164T RED</div>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        Frame {shown + 1} printed. {picked.length} {picked.length === 1 ? "frame" : "frames"} circled.
      </p>
    </div>
  );
}
