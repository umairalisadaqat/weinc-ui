import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";

// The sheets, bottom to top. The names are printed beside each one while the stack is apart.
const layers = ["Shell", "Sky", "Hills", "Ground", "Hero", "Score", "Glass"];
const GAP = 60; // distance between sheets when the stack is apart
const TILT = 57, TURN = -33; // the angle the open stack is viewed from, in degrees
const BLUE = "#4F98FB";
const PW = 250, PH = 500; // phone size in design pixels
const SW = PW - 14; // screen width
const GROUND = 104, HERO = 24, HX = 52, OBW = 14, OBH = 24;
const SPEED = 118, JUMP = 540, GRAV = 1650;
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const screenBox = "absolute inset-[7px] overflow-hidden rounded-[37px]";

function Sheet({ i, open, glass, children }: { i: number; open: boolean; glass?: boolean; children: ReactNode }) {
  const reduce = useReducedMotion();
  const target = open ? (i - (layers.length - 1) / 2) * GAP : i * 0.6;
  const spring = useSpring(target, { stiffness: 150, damping: 14, mass: 0.9 });
  const now = useRef({ open, target });
  now.current = { open, target };
  // While closing, a sheet may not bounce past its resting place, or it would pass through its neighbour.
  const z = useTransform(spring, (v) => (now.current.open ? v : i < layers.length / 2 ? Math.min(v, now.current.target) : Math.max(v, now.current.target)));
  useEffect(() => {
    if (reduce) { spring.jump(target); return; }
    const id = window.setTimeout(() => spring.set(target), (open ? layers.length - 1 - i : i) * 75);
    return () => window.clearTimeout(id);
  }, [target, open, reduce, i, spring]);
  return (
    <motion.div style={{ z, transformStyle: "preserve-3d" }} className="absolute inset-0">
      {glass && (
        <div aria-hidden="true" style={{ opacity: open ? 1 : 0, transformStyle: "preserve-3d" }} className="absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none">
          {/* three stacked outlines read as the thickness of the sheet */}
          <div style={{ transform: "translateZ(-4px)" }} className="absolute inset-0 rounded-[44px] border border-[#4F98FB]/40" />
          <div style={{ transform: "translateZ(-2px)" }} className="absolute inset-0 rounded-[44px] border border-white/15" />
          <div className="absolute inset-0 rounded-[44px] border border-white/25 bg-[linear-gradient(135deg,rgba(255,255,255,0.10)_0%,rgba(160,200,255,0.03)_38%,rgba(79,152,251,0.07)_100%)] shadow-[inset_1px_1px_0_rgba(255,255,255,0.45),inset_-1px_-1px_0_rgba(79,152,251,0.55)]" />
        </div>
      )}
      {children}
      <div aria-hidden="true" style={{ opacity: open ? 1 : 0 }} className="absolute bottom-[30px] left-full flex items-center gap-2 whitespace-nowrap pl-2 transition-opacity duration-300 motion-reduce:transition-none">
        <span className="h-px w-5 bg-white/40" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">0{i + 1}</span>
        <span className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-[#F6F4EF]">{layers[i]}</span>
      </div>
    </motion.div>
  );
}

export default function PhoneGameBuiltFromGlassLayers() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const ground = useRef<HTMLDivElement>(null);
  const obstacles = useRef<(HTMLDivElement | null)[]>([]);
  const coins = useRef<(HTMLDivElement | null)[]>([]);
  const ptr = useRef({ x: 0, y: 0 });
  const tapAt = useRef(-1e9);
  const wantJump = useRef(false);
  const [open, setOpen] = useState(true);
  const [auto, setAuto] = useState(true);
  const [score, setScore] = useState(0);
  const [scale, setScale] = useState(1);
  const openRef = useRef(true);
  openRef.current = open;

  const rx = useSpring(TILT, { stiffness: 90, damping: 15 });
  const ry = useSpring(0, { stiffness: 90, damping: 15 });
  const rz = useSpring(TURN, { stiffness: 90, damping: 15 });
  const floor = useSpring(-((layers.length - 1) / 2) * GAP - 70, { stiffness: 90, damping: 16 });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1.06, (el.clientWidth - 12) / 584));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // With motion reduced the finished phone is shown and nothing loops.
  useEffect(() => { if (reduce) setOpen(false); }, [reduce]);
  useEffect(() => {
    if (!reduce) { floor.set(open ? -((layers.length - 1) / 2) * GAP - 70 : -36); return; }
    rx.jump(open ? TILT : 0); rz.jump(open ? TURN : 0); ry.jump(0); floor.jump(open ? -((layers.length - 1) / 2) * GAP - 70 : -36);
  }, [open, reduce, rx, ry, rz, floor]);

  // Left alone, the stack presses together, plays for a while and comes apart again.
  useEffect(() => {
    if (reduce || !auto) return;
    const id = window.setTimeout(() => setOpen((o) => !o), open ? 4400 : 6200);
    return () => window.clearTimeout(id);
  }, [open, auto, reduce]);

  // One loop runs the little game and the slow sway of the stack.
  useEffect(() => {
    if (reduce) return;
    const el = root.current;
    if (!el) return;
    const g = { y: 0, vy: 0, last: 0, scroll: 0, obs: [250, 430, 640], coin: [true, true, true], hurt: 0 };
    let raf = 0, seen = true, seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const frame = (now: number) => {
      raf = 0;
      if (!g.last) g.last = now;
      const dt = Math.min(0.033, (now - g.last) / 1000); g.last = now;
      g.scroll += SPEED * dt;
      const self = now - tapAt.current > 5000; // the game plays itself until someone taps
      for (let i = 0; i < g.obs.length; i++) {
        g.obs[i] -= SPEED * dt;
        if (g.obs[i] < -40) { g.obs[i] = Math.max(...g.obs, SW) + 150 + rand() * 110; g.coin[i] = true; }
        const gap = g.obs[i] - (HX + HERO);
        if (self && g.y === 0 && gap > 0 && gap < 30) g.vy = JUMP;
        if (g.obs[i] < HX + HERO - 5 && g.obs[i] + OBW > HX + 5 && g.y < OBH - 6 && now > g.hurt) g.hurt = now + 700;
        if (g.coin[i] && Math.abs(g.obs[i] + OBW / 2 - (HX + HERO / 2)) < 15 && g.y > 34) { g.coin[i] = false; setScore((s) => (s + 1) % 1000); }
      }
      if (wantJump.current && g.y === 0) g.vy = JUMP;
      wantJump.current = false;
      if (g.y > 0 || g.vy > 0) { g.vy -= GRAV * dt; g.y = Math.max(0, g.y + g.vy * dt); if (g.y === 0) g.vy = 0; }

      if (hero.current) {
        const stretch = 1 + Math.max(-0.16, Math.min(0.2, g.vy / 2800));
        hero.current.style.transform = `translate3d(${HX}px,${-g.y}px,0) scale(${2 - stretch},${stretch})`;
        hero.current.style.opacity = now < g.hurt && Math.floor(now / 90) % 2 === 0 ? "0.25" : "1";
      }
      if (ground.current) ground.current.style.backgroundPositionX = `${-g.scroll % 48}px`;
      g.obs.forEach((x, i) => {
        const o = obstacles.current[i], c = coins.current[i];
        if (o) o.style.transform = `translate3d(${x}px,0,0)`;
        if (c) { c.style.transform = `translate3d(${x + OBW / 2 - 6}px,${Math.sin(now / 260 + i) * 3}px,0)`; c.style.opacity = g.coin[i] ? "1" : "0"; }
      });

      const o = openRef.current;
      rz.set((o ? TURN + Math.sin(now / 2100) * 4 : 0) + ptr.current.x * (o ? 14 : 0));
      rx.set((o ? TILT : 0) - ptr.current.y * (o ? 9 : 7));
      ry.set(o ? 0 : ptr.current.x * 11 + Math.sin(now / 2400) * 2.5);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf) { g.last = 0; raf = requestAnimationFrame(frame); } };
    wake();
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(el);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [reduce, rx, ry, rz]);

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const b = e.currentTarget.getBoundingClientRect();
    ptr.current = { x: (e.clientX - b.left) / b.width - 0.5, y: (e.clientY - b.top) / b.height - 0.5 };
  };
  const jump = () => { tapAt.current = performance.now(); wantJump.current = true; };
  const toggle = () => { setAuto(false); setOpen((o) => !o); };

  return (
    <div
      ref={root}
      onPointerMove={onMove}
      onPointerLeave={() => { ptr.current = { x: 0, y: 0 }; }}
      style={{ fontFamily: FONT }}
      className="relative flex min-h-[640px] w-full items-center justify-center overflow-hidden bg-[#0B0D12] bg-[radial-gradient(70%_60%_at_50%_44%,#1a2233_0%,#0f131c_45%,#0B0D12_78%)] sm:min-h-[800px]"
    >
      <div style={{ width: PW, height: PH, transform: `translateX(${open ? -70 * scale : 0}px) scale(${scale})`, perspective: 1700 }} className="relative -mt-10 shrink-0 transition-transform duration-700 ease-out motion-reduce:transition-none">
        <motion.div style={{ rotateX: rx, rotateY: ry, rotateZ: rz, transformStyle: "preserve-3d" }} className="absolute inset-0">
          <motion.div aria-hidden="true" style={{ z: floor }} className="absolute -inset-6 rounded-[70px] bg-[radial-gradient(closest-side,rgba(79,152,251,0.42),rgba(79,152,251,0.12)_60%,rgba(79,152,251,0))] blur-2xl" />

          <Sheet i={0} open={open}>
            <span aria-hidden="true" className="absolute -right-[6px] top-[128px] h-[62px] w-[4px] rounded-r-[3px] bg-[linear-gradient(180deg,#6b7385,#2a2f3b)]" />
            <span aria-hidden="true" className="absolute -left-[6px] top-[108px] h-[30px] w-[4px] rounded-l-[3px] bg-[linear-gradient(180deg,#6b7385,#2a2f3b)]" />
            <span aria-hidden="true" className="absolute -left-[6px] top-[152px] h-[46px] w-[4px] rounded-l-[3px] bg-[linear-gradient(180deg,#6b7385,#2a2f3b)]" />
            <div className="absolute -inset-[4px] rounded-[48px] bg-[#0B0D12] bg-[linear-gradient(140deg,#aeb6c6_0%,#5b6272_14%,#232733_34%,#3d4454_52%,#151820_72%,#7e8798_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35),inset_0_0_0_4px_rgba(11,13,18,0.0),0_0_0_1px_#000,0_30px_60px_-20px_rgba(0,0,0,0.9)]" />
            <div className="absolute inset-0 rounded-[44px] bg-[#0B0D12] bg-[linear-gradient(150deg,#2b313f_0%,#171a23_40%,#0d0f15_100%)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.9),inset_0_0_0_6px_#07080b,inset_0_0_0_7px_rgba(255,255,255,0.08)]">
              {/* what is inside the shell: a cell, a board and one lamp */}
              <div className="absolute left-[26px] top-[150px] h-[250px] w-[120px] rounded-[14px] border border-white/20 bg-[linear-gradient(180deg,#2b3140,#1a1e28)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                <span className="absolute left-3 top-3 font-mono text-[8px] uppercase tracking-[0.2em] text-white/50">Cell</span>
              </div>
              <div className="absolute right-[26px] top-[150px] h-[150px] w-[64px] rounded-[10px] border border-[#4F98FB]/40 bg-[#131a28] bg-[repeating-linear-gradient(0deg,rgba(79,152,251,0.3)_0_1px,transparent_1px_9px)]">
                <span className="absolute left-1/2 top-4 h-7 w-7 -translate-x-1/2 rounded-[5px] bg-[#1d2330] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" />
                <span className="absolute bottom-4 left-1/2 h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-[#4F98FB] shadow-[0_0_10px_2px_rgba(79,152,251,0.9)]" />
              </div>
              <div className="absolute left-[26px] top-[40px] h-[90px] w-[198px] rounded-[14px] border border-white/20 bg-[#1a1e28]">
                <span className="absolute left-4 top-4 h-10 w-10 rounded-full border border-white/15 bg-[radial-gradient(circle_at_35%_30%,#3a4254,#0c0e13_70%)]" />
              </div>
            </div>
          </Sheet>

          <Sheet i={1} open={open}>
            <div className={`${screenBox} bg-[#0d1626] bg-[linear-gradient(180deg,#0B0D12_0%,#10203c_45%,#1f4a8f_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.14)]`}>
              <div className="absolute inset-0 opacity-80 [background-image:radial-gradient(circle,#F6F4EF_0.9px,transparent_1.3px),radial-gradient(circle,#F6F4EF_0.6px,transparent_1px),radial-gradient(circle,#9cc4ff_1.1px,transparent_1.6px)] [background-position:17px_23px,61px_9px,103px_71px] [background-size:97px_113px,61px_89px,139px_167px]" />
              <span className="absolute right-[34px] top-[86px] h-[46px] w-[46px] rounded-full bg-[#F6F4EF] shadow-[0_0_34px_8px_rgba(246,244,239,0.28),inset_-8px_-6px_0_rgba(11,13,18,0.1)]" />
            </div>
          </Sheet>

          <Sheet i={2} open={open} glass>
            <div className={screenBox}>
              <svg aria-hidden="true" viewBox="0 0 472 150" style={{ bottom: GROUND - 8 }} className="phone-game-glass-layers-far absolute left-0 h-[150px] w-[472px]">
                <path d="M0 150V92l40-44 34 30 44-62 50 70 30-26 38 32v58zM236 150V92l40-44 34 30 44-62 50 70 30-26 38 32v58z" fill="#17376c" />
              </svg>
              <svg aria-hidden="true" viewBox="0 0 472 90" style={{ bottom: GROUND - 6 }} className="phone-game-glass-layers-near absolute left-0 h-[90px] w-[472px]">
                <path d="M0 90V52l30-26 40 34 46-48 44 46 34-22 42 30v24zM236 90V52l30-26 40 34 46-48 44 46 34-22 42 30v24z" fill="#2b62b8" />
              </svg>
            </div>
          </Sheet>

          <Sheet i={3} open={open} glass>
            <div className={screenBox}>
              <div ref={ground} style={{ height: GROUND }} className="absolute inset-x-0 bottom-0 border-t-[3px] border-[#F6F4EF] bg-[#0B0D12] [background-image:linear-gradient(90deg,rgba(246,244,239,0.5)_0_14px,transparent_14px_48px),linear-gradient(90deg,transparent_0_24px,rgba(79,152,251,0.7)_24px_32px,transparent_32px_48px)] [background-position:0_12px,0_30px] [background-repeat:repeat-x] [background-size:48px_3px,48px_3px]" />
              {[0, 1, 2].map((i) => (
                <div key={i} ref={(el) => { obstacles.current[i] = el; }} style={{ bottom: GROUND, width: OBW, height: OBH, transform: `translate3d(${[150, 330, 540][i]}px,0,0)` }} className="absolute left-0 rounded-t-[4px] bg-[#4F98FB] shadow-[inset_-4px_0_0_rgba(11,13,18,0.28),inset_0_3px_0_rgba(255,255,255,0.45)]" />
              ))}
              {[0, 1, 2].map((i) => (
                <div key={i} ref={(el) => { coins.current[i] = el; }} style={{ bottom: GROUND + 68, transform: `translate3d(${[151, 331, 541][i]}px,0,0)` }} className="absolute left-0 h-3 w-3 rounded-full border-[3px] border-[#F6F4EF] shadow-[0_0_10px_rgba(246,244,239,0.6)]" />
              ))}
            </div>
          </Sheet>

          <Sheet i={4} open={open} glass>
            <div className={screenBox}>
              <div ref={hero} style={{ bottom: GROUND, width: HERO, height: HERO, transform: `translate3d(${HX}px,-46px,0)`, transformOrigin: "50% 100%" }} className="absolute left-0 rounded-[6px] bg-[#F6F4EF] shadow-[inset_-4px_-4px_0_rgba(11,13,18,0.16),0_0_18px_rgba(246,244,239,0.35)]">
                <span className="absolute right-[4px] top-[7px] h-[5px] w-[4px] rounded-[1px] bg-[#0B0D12]" />
                <span className="absolute right-[11px] top-[7px] h-[5px] w-[4px] rounded-[1px] bg-[#0B0D12]" />
                <span className="absolute -left-[9px] top-[3px] h-[5px] w-[10px] rounded-l-[2px] bg-[#4F98FB]" />
                <span className="absolute -left-[5px] top-[9px] h-[4px] w-[6px] rounded-l-[2px] bg-[#4F98FB]/70" />
              </div>
            </div>
          </Sheet>

          <Sheet i={5} open={open} glass>
            <div className={screenBox}>
              <div className="absolute inset-x-5 top-[54px] flex items-start justify-between">
                <div>
                  <span className="block font-mono text-[8px] font-semibold uppercase tracking-[0.24em] text-[#F6F4EF]/60">Rings</span>
                  <span className="block text-[30px] font-extrabold leading-8 tracking-[-0.04em] text-[#F6F4EF] [font-variant-numeric:tabular-nums]">{String(score).padStart(3, "0")}</span>
                </div>
                <span aria-hidden="true" className="mt-1 flex gap-1">
                  <span className="h-[6px] w-4 rounded-full bg-[#4F98FB]" /><span className="h-[6px] w-4 rounded-full bg-[#4F98FB]" /><span className="h-[6px] w-4 rounded-full bg-[#F6F4EF]/25" />
                </span>
              </div>
              <span className="phone-game-glass-layers-hint absolute inset-x-0 bottom-[34px] text-center text-[10px] font-extrabold uppercase tracking-[0.3em] text-[#F6F4EF]">Tap to jump</span>
            </div>
          </Sheet>

          <Sheet i={6} open={open} glass>
            <div className="absolute inset-0 overflow-hidden rounded-[44px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]">
              <span className="absolute left-1/2 top-[18px] h-[20px] w-[68px] -translate-x-1/2 rounded-full bg-[#050608] shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]" />
              <span className="absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.05)_22%,rgba(255,255,255,0)_23%,rgba(255,255,255,0)_70%,rgba(79,152,251,0.1)_100%)]" />
            </div>
          </Sheet>
        </motion.div>

        <button type="button" onClick={jump} aria-label="Jump" className="absolute inset-0 cursor-pointer rounded-[44px] outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0B0D12]" />
      </div>

      <button type="button" onClick={toggle} aria-pressed={!open} className="absolute bottom-5 left-1/2 flex h-10 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#F6F4EF] px-5 text-[13px] font-extrabold tracking-[-0.01em] text-[#0B0D12] shadow-[inset_0_-2px_0_rgba(11,13,18,0.14),0_10px_20px_-8px_rgba(0,0,0,0.8)] outline-none transition-colors duration-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12] motion-reduce:transition-none">
        <span aria-hidden="true" className="flex h-3.5 w-3.5 flex-col justify-between">
          <span style={{ transform: open ? "none" : "translateY(4px)" }} className="h-[2.5px] rounded-full bg-[#4F98FB] transition-transform duration-300 motion-reduce:transition-none" />
          <span className="h-[2.5px] rounded-full bg-[#0B0D12]" />
          <span style={{ transform: open ? "none" : "translateY(-4px)" }} className="h-[2.5px] rounded-full bg-[#4F98FB] transition-transform duration-300 motion-reduce:transition-none" />
        </span>
        {open ? "Press together" : "Take apart"}
      </button>
      <p aria-live="polite" className="sr-only">{open ? "Seven layers shown apart." : "Layers pressed together into one screen."}</p>

      <style>{`
        @keyframes phone-game-glass-layers-slide { to { transform: translate3d(-236px,0,0) } }
        @keyframes phone-game-glass-layers-pulse { 0%, 100% { opacity: 0.9 } 50% { opacity: 0.25 } }
        .phone-game-glass-layers-far { animation: phone-game-glass-layers-slide 26s linear infinite; }
        .phone-game-glass-layers-near { animation: phone-game-glass-layers-slide 11s linear infinite; }
        .phone-game-glass-layers-hint { animation: phone-game-glass-layers-pulse 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .phone-game-glass-layers-far, .phone-game-glass-layers-near, .phone-game-glass-layers-hint { animation: none } }
      `}</style>
    </div>
  );
}
