import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion } from "framer-motion";

// One pleat per link, left to right. Five to seven short words suit the fan.
const links = ["Home", "Work", "Prints", "Journal", "About", "Contact"];
const SPREAD = 150; // degrees from the first edge of the open fan to the last
const MAX_R = 320; // length of a stick in pixels on a wide screen
const DYE = "#d8431b"; // the colour soaked into the paper near the sticks
const PAPER = "#f4ead6";

const rad = (d: number) => (d * Math.PI) / 180;

export default function PaperFoldingFanMenu() {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const [R, setR] = useState(MAX_R);
  const [open, setOpen] = useState(false); // it arrives folded and opens itself a moment later
  const [active, setActive] = useState(3);
  const [lifted, setLifted] = useState<number | null>(null);
  const [wave, setWave] = useState<number | null>(null);
  const tilt = useMotionValue(0);
  const tassel = useMotionValue(0);
  const world = useRef({ lean: 0, kick: 0, touched: -1e9 });

  const step = SPREAD / links.length, half = step / 2;
  const bw = 2 * R * Math.sin(rad(half)) + 1; // width of one pleat at the rim
  const fanW = 2 * R * Math.sin(rad(SPREAD / 2)) + 28;
  const top = Math.round(R * 0.07) + 12, drop = Math.round(R * 0.55) + 8;
  const small = R < 230;

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => setR(Math.max(120, Math.min(MAX_R, Math.floor((el.clientWidth - 30) / (2 * Math.sin(rad(SPREAD / 2)))))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduce) { setOpen(true); return; }
    const id = window.setTimeout(() => setOpen(true), 180);
    return () => window.clearTimeout(id);
  }, [reduce]);

  // The fan breathes a little, leans toward the pointer, and the tassel hangs from it with real swing.
  useEffect(() => {
    if (reduce) { tilt.set(0); tassel.set(0); return; }
    const el = stage.current;
    if (!el) return;
    let raf = 0, last = 0, t0 = 0, seen = true, lean = 0, phi = 0, vel = 0, nextWave = 3600;
    const timers: number[] = [];
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0, w = world.current;
      lean += (w.lean - lean) * Math.min(1, dt * 5);
      const fan = 1.5 * Math.sin(t / 1700) + lean;
      vel += w.kick; w.kick = 0;
      vel += (-46 * (phi + fan) - 2.1 * vel) * dt; phi += vel * dt;
      tilt.set(fan); tassel.set(phi);
      if (now - w.touched > 5200 && t > nextWave) {
        nextWave = t + 5200;
        links.forEach((_, i) => timers.push(window.setTimeout(() => setWave(i), i * 95)));
        timers.push(window.setTimeout(() => setWave(null), links.length * 95 + 130));
      }
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    wake();
    const onMove = (e: PointerEvent) => { const b = el.getBoundingClientRect(); world.current.lean = Math.max(-1, Math.min(1, (e.clientX - b.left - b.width / 2) / (b.width / 2))) * 3.2; world.current.touched = performance.now(); };
    const onLeave = () => { world.current.lean = 0; };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(el);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); timers.forEach((id) => window.clearTimeout(id));
      el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerleave", onLeave);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduce, tilt, tassel]);

  const touch = (kick: number) => { world.current.touched = performance.now(); world.current.kick += kick; };
  const spring = (i: number) => (reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 150, damping: 13.5, mass: 0.9, delay: (open ? i : links.length - 1 - i) * 0.028 });
  const quick = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 22 };

  // The paper of one pleat: a wedge from the sticks to the rim, peaked where it is glued to its stick.
  const sinA = Math.sin(rad(half)), cosA = Math.cos(rad(half)), r0 = R * 0.4;
  const wedge = `polygon(0px ${(R * (1 - cosA)).toFixed(1)}px, ${(bw / 2).toFixed(1)}px 0px, ${bw.toFixed(1)}px ${(R * (1 - cosA)).toFixed(1)}px, ${(bw / 2 + r0 * sinA).toFixed(1)}px ${(R - r0 * cosA).toFixed(1)}px, ${(bw / 2).toFixed(1)}px ${(R - r0 * 0.985).toFixed(1)}px, ${(bw / 2 - r0 * sinA).toFixed(1)}px ${(R - r0 * cosA).toFixed(1)}px)`;
  const px = (f: number) => `${(R * f).toFixed(1)}px`;
  const paper = [
    `linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 38%, rgba(90,40,10,0.04) 49.3%, rgba(70,28,8,0.24) 50.2%, rgba(70,28,8,0.1) 70%, rgba(70,28,8,0.0) 100%)`,
    `radial-gradient(circle at 50% 100%, transparent ${px(0.928)}, rgba(38,26,18,0.8) ${px(0.93)}, rgba(38,26,18,0.8) ${px(0.934)}, transparent ${px(0.936)}, transparent ${px(0.946)}, rgba(38,26,18,0.55) ${px(0.948)}, rgba(38,26,18,0.55) ${px(0.95)}, transparent ${px(0.952)}, transparent ${px(0.972)}, #b98a2e ${px(0.975)}, #ecd08a ${px(0.99)}, #a87a22 ${px(1.01)})`,
    `radial-gradient(circle at 50% 100%, #a92c0e ${px(0.4)}, ${DYE} ${px(0.47)}, #e8763c ${px(0.58)}, #f1c79a ${px(0.69)}, ${PAPER} ${px(0.79)})`,
  ].join(", ");
  const lacquer = "linear-gradient(90deg, #060504 0%, #2b241d 30%, #6b5d4d 44%, #1b1611 58%, #050403 100%)";

  return (
    <div ref={stage} className="relative flex min-h-[560px] w-full flex-col items-center justify-center overflow-hidden bg-[#0e1c18] bg-[radial-gradient(90%_70%_at_50%_30%,#1e3a32_0%,#0e1c18_60%,#08110f_100%)] px-3 py-12 sm:min-h-[680px]">
      <style>{`
        .paper-folding-fan-menu-grain { background-image: repeating-linear-gradient(92deg, rgba(90,60,30,0.035) 0 1px, transparent 1px 3px), repeating-linear-gradient(178deg, rgba(90,60,30,0.025) 0 1px, transparent 1px 7px); }
      `}</style>
      <motion.nav aria-label="Fan menu" className="relative" style={{ width: fanW, height: top + R + drop, rotate: tilt, transformOrigin: `50% ${top + R}px`, filter: "drop-shadow(0 26px 22px rgba(0,0,0,0.5)) drop-shadow(0 4px 4px rgba(0,0,0,0.4))" }}>
        <ul id="paper-folding-fan-menu-links" className="absolute inset-0" aria-hidden={!open}>
          {links.map((label, i) => {
            const angle = -SPREAD / 2 + step * (i + 0.5);
            const up = !open ? 0 : active === i ? R * 0.05 : lifted === i || wave === i ? R * 0.028 : 0;
            const edge = i === 0 ? -1 : i === links.length - 1 ? 1 : 0;
            return (
              <motion.li
                key={label}
                className="absolute"
                style={{ left: fanW / 2 - bw / 2, top, width: bw, height: R, transformOrigin: "50% 100%", zIndex: i + 1 }}
                initial={false}
                animate={{ rotate: open ? angle : (i - (links.length - 1) / 2) * 0.9 }}
                transition={spring(i)}
              >
                <motion.div className="absolute inset-0" style={{ filter: up > 0 ? "drop-shadow(0 3px 5px rgba(0,0,0,0.42))" : undefined }} initial={false} animate={{ y: -up }} transition={quick}>
                  <span aria-hidden="true" className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ bottom: -R * 0.07, width: Math.max(5, R * 0.024), height: R * 0.5, background: lacquer }} />
                  <motion.a
                    href="#"
                    tabIndex={open ? 0 : -1}
                    aria-current={active === i ? "page" : undefined}
                    onClick={(e) => { e.preventDefault(); setActive(i); touch(i < links.length / 2 ? 34 : -34); }}
                    onPointerEnter={() => { setLifted(i); world.current.touched = performance.now(); }}
                    onPointerLeave={() => setLifted((v) => (v === i ? null : v))}
                    onFocus={() => { setLifted(i); world.current.touched = performance.now(); }}
                    onBlur={() => setLifted((v) => (v === i ? null : v))}
                    className="group absolute inset-0 block outline-none"
                    style={{ clipPath: wedge, transformOrigin: "50% 100%", backgroundColor: PAPER, backgroundImage: paper }}
                    initial={false}
                    animate={{ scaleX: open ? 1 : 0.1 }}
                    transition={spring(i)}
                  >
                    <span aria-hidden="true" className="paper-folding-fan-menu-grain absolute inset-0 mix-blend-multiply" />
                    <span className="absolute inset-x-0 flex flex-col items-center" style={{ top: R * (small ? 0.105 : 0.1) }}>
                      <span aria-hidden="true" className={`mb-1.5 h-1.5 w-1.5 rounded-full transition-colors duration-300 motion-reduce:transition-none ${active === i ? "bg-[#c8370f]" : "bg-transparent"}`} />
                      <span className={`rounded-sm px-1 font-serif font-semibold uppercase text-[#231710] group-focus-visible:ring-2 group-focus-visible:ring-[#231710] ${small ? "text-[9.5px] tracking-[0.06em]" : "text-[13px] tracking-[0.14em]"}`}>{label}</span>
                      <span aria-hidden="true" className={`mt-1 font-serif italic text-[#5b4636] ${small ? "text-[9px]" : "text-[11px]"}`}>{`no. ${i + 1}`}</span>
                    </span>
                  </motion.a>
                  {edge !== 0 && (
                    <motion.span
                      aria-hidden="true"
                      className="absolute left-1/2 overflow-hidden rounded-t-full rounded-b-md shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                      style={{ bottom: -R * 0.07, width: Math.max(9, R * 0.044), marginLeft: -Math.max(9, R * 0.044) / 2, height: R * 1.085, transformOrigin: `50% ${((1.015 / 1.085) * 100).toFixed(2)}%`, background: lacquer }}
                      initial={false}
                      animate={{ rotate: open ? edge * half : 0 }}
                      transition={spring(i)}
                    >
                      <span className="absolute inset-x-0 bg-[linear-gradient(90deg,#7a5a17,#f1d889_45%,#8a671c)]" style={{ bottom: R * 0.3, height: Math.max(3, R * 0.014) }} />
                      <span className="absolute inset-x-0 bg-[linear-gradient(90deg,#7a5a17,#f1d889_45%,#8a671c)]" style={{ bottom: R * 0.33, height: Math.max(2, R * 0.007) }} />
                    </motion.span>
                  )}
                </motion.div>
              </motion.li>
            );
          })}
        </ul>

        {/* Silk cord and tassel, hung from the rivet. */}
        <motion.div aria-hidden="true" className="pointer-events-none absolute" style={{ left: fanW / 2 - R * 0.11, top: top + R, width: R * 0.22, height: R * 0.55, rotate: tassel, transformOrigin: "50% 0%", zIndex: 20 }}>
          <svg viewBox="0 0 60 150" className="block h-full w-full">
          <defs>
            <linearGradient id="paper-folding-fan-menu-silk" x1="0" x2="1">
              <stop offset="0" stopColor="#7d5a12" /><stop offset="0.4" stopColor="#f0cf78" /><stop offset="0.62" stopColor="#c8982f" /><stop offset="1" stopColor="#6d4d0e" />
            </linearGradient>
          </defs>
          <path d="M30 0 V62" stroke="#caa03c" strokeWidth="2.2" />
          <path d="M30 0 V62" stroke="#f3dc98" strokeWidth="0.7" strokeDasharray="2 2.4" />
          <circle cx="30" cy="66" r="7" fill="url(#paper-folding-fan-menu-silk)" />
          <path d="M22 74 Q30 70 38 74 L43 146 Q30 150 17 146 Z" fill="url(#paper-folding-fan-menu-silk)" />
          {[20.5, 24, 27.5, 31, 34.5, 38].map((x, k) => <path key={x} d={`M${24 + k * 2.4} 80 L${x} 147`} stroke="rgba(70,45,5,0.45)" strokeWidth="0.7" />)}
          <rect x="21.5" y="76" width="17" height="5" rx="1.5" fill="#b6321a" />
          <rect x="21.5" y="77.2" width="17" height="1" fill="rgba(255,255,255,0.35)" />
          </svg>
        </motion.div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="paper-folding-fan-menu-links"
          aria-label={open ? "Fold the menu" : "Unfold the menu"}
          onClick={() => { setOpen((v) => !v); touch(open ? 60 : -60); }}
          className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#f1d889] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1c18]"
          style={{ left: fanW / 2, top: top + R, zIndex: 30 }}
        >
          <span aria-hidden="true" className="block rounded-full bg-[radial-gradient(circle_at_34%_28%,#fff4c9_0%,#e9c768_22%,#a97b1f_62%,#5b3f0b_100%)] shadow-[0_2px_3px_rgba(0,0,0,0.7),inset_0_-1px_1px_rgba(0,0,0,0.45)] transition-transform duration-150 active:scale-90 motion-reduce:transition-none" style={{ width: Math.max(16, R * 0.075), height: Math.max(16, R * 0.075) }} />
        </button>
      </motion.nav>
      <p aria-live="polite" className="mt-2 text-center font-serif text-[13px] italic text-[#c9d6cf]">
        {open ? `Open at ${links[active]}. Press the rivet to fold it away.` : "Folded. Press the rivet to open it."}
      </p>
    </div>
  );
}
