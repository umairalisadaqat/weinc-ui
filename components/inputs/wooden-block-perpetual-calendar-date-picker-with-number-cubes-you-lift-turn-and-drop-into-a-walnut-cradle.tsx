import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";

const VENUE = "Kiln & Ash supper club"; // the small line under the date
const NOTE = "one long table, 7 pm"; // second half of that line
const AUTOPLAY = true; // turn a block every few seconds until the calendar is first touched
const OPEN_ON = 6; // weekday the calendar opens on (0 Sunday ... 6 Saturday), the next one after today

const S = 200, BAR = 66, GAP = 6, W = S * 2 + GAP, CHEEK = 28, CHEEK_H = 178, BASE_H = 30, DEPTH = 236, BASE_W = W + CHEEK * 2 + 34;
const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const NUMERALS = '"Bodoni 72", Didot, "Bodoni MT", "Times New Roman", serif';
const mod = (a: number, n: number) => ((a % n) + n) % n;

// Wood drawn once into a small canvas: long grain, upright grain or end grain.
function wood(w: number, h: number, lo: number[], hi: number[], seed: number, kind: "long" | "upright" | "end") {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); if (!x) return "";
  const img = x.createImageData(w, h), d = img.data;
  const hash = (i: number, j: number) => { const n = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453; return n - Math.floor(n); };
  const noise = (a: number, b: number) => {
    const i = Math.floor(a), j = Math.floor(b), u = a - i, v = b - j, p = u * u * (3 - 2 * u), q = v * v * (3 - 2 * v);
    return hash(i, j) * (1 - p) * (1 - q) + hash(i + 1, j) * p * (1 - q) + hash(i, j + 1) * (1 - p) * q + hash(i + 1, j + 1) * p * q;
  };
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const a = kind === "upright" ? py : px, b = kind === "upright" ? px : py;
    let t: number;
    if (kind === "end") {
      const dx = px - w * 0.15, dy = py - h * 1.5, r = Math.sqrt(dx * dx + dy * dy) + 16 * noise(px * 0.011, py * 0.011);
      t = 0.34 + 0.3 * (0.5 + 0.5 * Math.sin(r * 0.36 + 4 * noise(r * 0.015, 2))) + 0.3 * noise(px * 0.35, py * 0.35) + 0.12 * noise(px * 0.05, py * 0.05);
    } else {
      const u = b + 30 * noise(a * 0.0035, b * 0.011) + 7 * noise(a * 0.018, b * 0.05);
      t = 0.5 * noise(u * 0.2, a * 0.0018) + 0.32 * noise(u * 0.62, a * 0.005) + 0.2 * noise(u * 1.9, a * 0.02) + 0.06 * hash(px, py);
      const pore = noise(a * 0.04, u * 1.7); if (pore > 0.76) t -= (pore - 0.76) * 1.5;
      t += 0.1 * Math.sin(a * 0.011 + 5 * noise(u * 0.02, 7)); // slow shimmer along the board
    }
    t = Math.max(0, Math.min(1, t)); const q = (py * w + px) * 4;
    d[q] = lo[0] + (hi[0] - lo[0]) * t; d[q + 1] = lo[1] + (hi[1] - lo[1]) * t; d[q + 2] = lo[2] + (hi[2] - lo[2]) * t; d[q + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c.toDataURL("image/jpeg", 0.88);
}
type Tex = { maple: string; mapleEnd: string; walnut: string; walnutUp: string; walnutEnd: string };
// Each face shows its own patch of the sheet, chosen so the edge of the sheet never crosses it.
const skin = (url: string, fallback: string, seed: number, w: number, h: number, size = 512): CSSProperties => ({ backgroundColor: fallback, backgroundImage: url ? `url(${url})` : undefined, backgroundSize: `${size}px ${size}px`, backgroundPosition: `-${Math.round(mod(seed * 97.3, Math.max(1, size - w)))}px -${Math.round(mod(seed * 61.7, Math.max(1, size - h)))}px` });
const BEVEL = "inset 0 3px 2px -1px rgba(255,247,230,0.55), inset 3px 0 2px -1px rgba(255,247,230,0.28), inset 0 -4px 3px -1px rgba(70,36,8,0.55), inset -4px 0 3px -1px rgba(70,36,8,0.45), inset 0 0 18px rgba(120,70,24,0.3)";

// A fixed block of wood: front, top and both ends, each shaded for one light from the upper left.
function Box({ w, h, d, x, y, z, front, top, side, children }: { w: number; h: number; d: number; x: number; y: number; z: number; front: CSSProperties; top: CSSProperties; side: CSSProperties; children?: ReactNode }) {
  const face = (fw: number, fh: number, transform: string, s: CSSProperties, shade: string) => (
    <div style={{ position: "absolute", left: -fw / 2, top: -fh / 2, width: fw, height: fh, transform, borderRadius: 3, ...s }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 3, background: shade, boxShadow: "inset 0 2px 1px -1px rgba(255,226,190,0.34), inset 2px 0 1px -1px rgba(255,226,190,0.12), inset 0 -3px 3px -1px rgba(8,3,0,0.6), inset -3px 0 3px -1px rgba(8,3,0,0.5), inset 0 0 12px rgba(20,8,0,0.35)" }} />
    </div>
  );
  return (
    <div style={{ position: "absolute", transformStyle: "preserve-3d", transform: `translate3d(${x}px,${y}px,${z}px)` }}>
      {face(w, h, `translateZ(${d / 2}px)`, front, "linear-gradient(180deg,rgba(255,225,190,0.1),rgba(20,8,0,0.2) 55%,rgba(10,4,0,0.42))")}
      {face(w, d, `rotateX(90deg) translateZ(${h / 2}px)`, top, "linear-gradient(180deg,rgba(255,240,215,0.02),rgba(255,236,205,0.2))")}
      {face(d, h, `rotateY(90deg) translateZ(${w / 2}px)`, side, "linear-gradient(90deg,rgba(10,4,0,0.5),rgba(10,4,0,0.66))")}
      {face(d, h, `rotateY(-90deg) translateZ(${w / 2}px)`, side, "rgba(10,4,0,0.2)")}
      {children}
    </div>
  );
}

// One of the four long faces of a turning block. Its shade follows the angle it is held at.
function Side({ i, rot, w, s, style, ring, children }: { i: number; rot: MotionValue<number>; w: number; s: number; style: CSSProperties; ring: boolean; children: ReactNode }) {
  const lit = (r: number) => { const a = ((r + i * 90) * Math.PI) / 180; return Math.max(0, 0.86 * Math.sin(a) + 0.5 * Math.cos(a)); };
  const dark = useTransform(rot, (r) => Math.min(0.62, (1 - lit(r)) * 0.56));
  const shine = useTransform(rot, (r) => Math.max(0, lit(r) - 0.7) * 0.55);
  return (
    <div style={{ position: "absolute", left: -w / 2, top: -s / 2, width: w, height: s, transform: `rotateX(${i * 90}deg) translateZ(${s / 2}px)`, borderRadius: 5, backfaceVisibility: "hidden", ...style }}>
      <div className="flex h-full w-full select-none items-center justify-center">{children}</div>
      <motion.div style={{ position: "absolute", inset: 0, borderRadius: 5, background: "#1c0d02", opacity: dark }} />
      <motion.div style={{ position: "absolute", inset: 0, borderRadius: 5, background: "linear-gradient(180deg,#fff8ea,rgba(255,248,234,0.4))", opacity: shine }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 5, boxShadow: ring ? "inset 0 0 0 4px #fff, inset 0 0 0 7px #0f2a2e" : BEVEL }} />
    </div>
  );
}

// A block that shows `value` on its front. A new value comes up from underneath (or down from the top when it is already there):
// the block is lifted clear, turned a quarter and dropped back.
function Turner({ value, before, w, s, x, y, z, slide, tex, seed, ring, render }: { value: string; before: string; w: number; s: number; x: number; y: number; z: number; slide: boolean; tex: Tex | null; seed: number; ring: boolean; render: (v: string) => ReactNode }) {
  const reduce = useReducedMotion();
  const st = useRef({ step: 0, faces: [value, before, "", ""] });
  const [, bump] = useState(0);
  const rot = useMotionValue(0), lift = useMotionValue(0);
  const my = useTransform(lift, (v) => y - v * (slide ? 5 : 78)), mz = useTransform(lift, (v) => z + (slide ? v * 96 : 0));
  const shadow = useTransform(lift, (v) => 0.85 - v * 0.5), spread = useTransform(lift, (v) => 1 + v * 0.14);
  useEffect(() => {
    const q = st.current, f = mod(q.step, 4);
    if (q.faces[f] === value) return;
    if (q.faces[mod(f + 1, 4)] === value) { q.step += 1; q.faces[mod(q.step + 1, 4)] = before; }
    else { q.faces[mod(f - 1, 4)] = value; q.step -= 1; }
    bump((n) => n + 1);
    if (reduce) { rot.set(-90 * q.step); return; }
    const a = animate(lift, [0, 1, 1, 0, 0.07, 0], { duration: 0.74, times: [0, 0.24, 0.56, 0.8, 0.9, 1], ease: ["easeOut", "linear", "easeIn", "easeOut", "easeIn"] });
    const b = animate(rot, -90 * q.step, { delay: 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] });
    return () => { a.stop(); b.stop(); rot.set(-90 * q.step); lift.set(0); };
  }, [value, before, reduce, rot, lift]);
  const maple = tex?.maple ?? "", core = s - 6;
  return (
    <>
      {!slide && (
        <div aria-hidden="true" style={{ position: "absolute", left: x - w / 2, top: -DEPTH / 2 + 18, width: w, height: DEPTH - 36, transform: `translate3d(0,${y + s / 2 - 0.6}px,0) rotateX(90deg)` }}>
          <motion.div style={{ position: "absolute", inset: 0, background: "radial-gradient(closest-side,rgba(12,5,0,0.9),rgba(12,5,0,0.5) 70%,rgba(12,5,0,0))", filter: "blur(5px)", opacity: shadow, scale: spread }} />
        </div>
      )}
      <motion.div style={{ position: "absolute", transformStyle: "preserve-3d", x, y: my, z: mz }}>
        <motion.div style={{ position: "absolute", transformStyle: "preserve-3d", rotateX: rot }}>
          {[0, 1, 2, 3].map((i) => <div key={`c${i}`} style={{ position: "absolute", left: -(w - 6) / 2, top: -core / 2, width: w - 6, height: core, transform: `rotateX(${i * 90}deg) translateZ(${core / 2}px)`, background: "#b98a52" }} />)}
          {[0, 1, 2, 3].map((i) => (
            <Side key={i} i={i} rot={rot} w={w} s={s} ring={ring} style={skin(maple, "#dcb680", seed * 3.1 + i * 1.7, w, s)}>{render(st.current.faces[i])}</Side>
          ))}
          {[1, -1].map((dir) => (
            <div key={dir} style={{ position: "absolute", left: -s / 2, top: -s / 2, width: s, height: s, borderRadius: 5, transform: `rotateY(${dir * 90}deg) translateZ(${w / 2}px)`, boxShadow: BEVEL, ...skin(tex?.mapleEnd ?? "", "#c9a06a", seed + dir, s, s, 256) }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 5, background: dir > 0 ? "linear-gradient(90deg,rgba(24,10,0,0.42),rgba(24,10,0,0.6))" : "rgba(24,10,0,0.2)" }} />
            </div>
          ))}
        </motion.div>
      </motion.div>
    </>
  );
}

export default function WoodenBlockPerpetualCalendar() {
  const reduce = useReducedMotion();
  const [today] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); });
  const [pick, setPick] = useState(() => { const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (mod(OPEN_ON - today.getDay(), 7) || 7)); return { m: d.getMonth(), d: d.getDate() }; });
  const [tex, setTex] = useState<Tex | null>(null);
  const [focus, setFocus] = useState<"" | "day" | "month">("");
  const touched = useRef(false), stage = useRef<HTMLDivElement>(null), drag = useRef({ y: 0, moved: false, on: false });
  const px = useMotionValue(0), py = useMotionValue(0), sway = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 14 }), sy = useSpring(py, { stiffness: 60, damping: 14 });
  const rotateY = useTransform([sx, sway], ([a, b]: number[]) => -25 + a * 9 + b * 2.4), rotateX = useTransform(sy, (v) => -17 - v * 5);

  // The year is not on the blocks: it is the next time that date comes round.
  const yearOf = (m: number, d: number) => (new Date(today.getFullYear(), m, d) < today ? today.getFullYear() + 1 : today.getFullYear());
  const lengthOf = (m: number) => new Date(yearOf(m, 28), m + 1, 0).getDate();
  const date = new Date(yearOf(pick.m, pick.d), pick.m, pick.d), len = lengthOf(pick.m);
  const label = `${DOW[date.getDay()]} ${pick.d} ${MON[pick.m]}`;
  const stepDay = (n: number) => setPick((p) => { const y = new Date(today.getFullYear(), p.m, p.d) < today ? today.getFullYear() + 1 : today.getFullYear(), d = new Date(y, p.m, p.d + n); return { m: d.getMonth(), d: d.getDate() }; });
  const setDay = (d: number) => setPick((p) => ({ m: p.m, d: Math.max(1, Math.min(lengthOf(p.m), d)) }));
  const stepMonth = (n: number) => setPick((p) => { const m = mod(p.m + n, 12); return { m, d: Math.min(p.d, lengthOf(m)) }; });
  const touch = () => { touched.current = true; };

  useEffect(() => {
    setTex({ maple: wood(512, 512, [200, 154, 98], [240, 212, 166], 3, "long"), mapleEnd: wood(256, 256, [168, 120, 70], [226, 190, 140], 5, "end"), walnut: wood(512, 512, [44, 26, 16], [122, 80, 48], 8, "long"), walnutUp: wood(512, 512, [44, 26, 16], [118, 76, 46], 11, "upright"), walnutEnd: wood(256, 256, [40, 24, 14], [104, 68, 40], 13, "end") });
  }, []);
  useEffect(() => {
    if (reduce) return;
    const s = animate(sway, [-1, 1], { duration: 7, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" });
    let seen = true;
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; });
    if (stage.current) io.observe(stage.current);
    let timer = 0;
    const first = window.setTimeout(() => {
      const tick = () => { if (!touched.current && seen && !document.hidden) stepDay(1); };
      if (AUTOPLAY) { tick(); timer = window.setInterval(tick, 2600); }
    }, 3050);
    return () => { s.stop(); io.disconnect(); window.clearTimeout(first); window.clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const onMove = (e: ReactPointerEvent) => { const b = e.currentTarget.getBoundingClientRect(); px.set(((e.clientX - b.left) / b.width - 0.5) * 2); py.set(((e.clientY - b.top) / b.height - 0.5) * 2); };
  const onLeave = () => { px.set(0); py.set(0); };
  // Drag a block up to roll on, down to roll back; a plain press rolls it on once.
  const grab = (step: (n: number) => void, press: () => void) => ({
    onPointerDown: (e: ReactPointerEvent) => { touch(); drag.current = { y: e.clientY, moved: false, on: true }; e.currentTarget.setPointerCapture(e.pointerId); },
    onPointerMove: (e: ReactPointerEvent) => { const g = drag.current; if (!g.on) return; const dy = e.clientY - g.y; if (Math.abs(dy) > 34) { step(dy < 0 ? 1 : -1); g.y = e.clientY; g.moved = true; } },
    onPointerUp: () => { const g = drag.current; if (g.on && !g.moved) press(); g.on = false; },
    onPointerCancel: () => { drag.current.on = false; },
  });
  const keys = (step: (n: number) => void, big: number, home: () => void, end: () => void) => (e: ReactKeyboardEvent) => {
    const k = e.key;
    if (k === "ArrowUp" || k === "ArrowRight") step(1); else if (k === "ArrowDown" || k === "ArrowLeft") step(-1); else if (k === "PageUp") step(big); else if (k === "PageDown") step(-big); else if (k === "Home") home(); else if (k === "End") end(); else return;
    e.preventDefault(); touch();
  };
  const watch = (name: "day" | "month") => ({ onFocus: (e: { currentTarget: Element }) => setFocus(e.currentTarget.matches(":focus-visible") ? name : ""), onBlur: () => setFocus("") });

  const tens = Math.floor(pick.d / 10), ones = pick.d % 10;
  const prev = new Date(date.getFullYear(), pick.m, pick.d - 1).getDate();
  const digit = (v: string) => <span style={{ fontFamily: NUMERALS, fontSize: 176, lineHeight: 1, fontWeight: 700, color: "#2a1608", opacity: 0.92, mixBlendMode: "multiply", textShadow: "0 1.5px 0 rgba(255,240,214,0.6)", transform: "translateY(-4px)" }}>{v}</span>;
  const word = (v: string) => <span style={{ fontFamily: NUMERALS, fontSize: 34, lineHeight: 1, fontWeight: 700, letterSpacing: "0.34em", marginRight: "-0.34em", color: "#2a1608", opacity: 0.9, mixBlendMode: "multiply", textShadow: "0 1px 0 rgba(255,240,214,0.6)", textTransform: "uppercase" }}>{v}</span>;
  const wal = (seed: number, w: number, h: number) => skin(tex?.walnut ?? "", "#5a3a22", seed, w, h), walUp = (seed: number, w: number) => skin(tex?.walnutUp ?? "", "#573821", seed, w, CHEEK_H), walEnd = (seed: number) => skin(tex?.walnutEnd ?? "", "#4a2e1a", seed, DEPTH, BASE_H, 256);
  const map = (seed: number, h: number) => skin(tex?.maple ?? "", "#dcb680", seed, W, h);
  const arrow = "flex h-10 w-10 items-center justify-center rounded-full text-[#b9d2cf] outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none";
  const cubeY = -BAR - S / 2, barZ = (DEPTH - 38) / 3;

  return (
    <div ref={stage} onPointerMove={onMove} onPointerLeave={onLeave} className="relative flex min-h-[720px] w-full flex-col items-center justify-center overflow-hidden bg-[#0f2a2e] bg-[radial-gradient(95%_70%_at_38%_30%,#2a5f63_0%,#143438_52%,#0a1d20_100%)] px-4 py-10">
      <div className="-my-[86px] h-[470px] w-[640px] shrink-0 scale-[0.56] sm:-my-6 sm:scale-[0.86] lg:my-0 lg:scale-100">
        <div className="relative h-full w-full" style={{ perspective: 1900, perspectiveOrigin: "50% 30%" }}>
          <motion.div role="group" aria-label="Date" style={{ position: "absolute", left: "50%", top: 340, transformStyle: "preserve-3d", rotateX, rotateY }}>
            <div aria-hidden="true" style={{ position: "absolute", left: -470, top: -330, width: 1020, height: 660, transform: `translate3d(60px,${BASE_H + 1}px,30px) rotateX(90deg)`, background: "radial-gradient(closest-side,rgba(2,8,9,0.78),rgba(2,8,9,0.5) 46%,rgba(2,8,9,0) 100%)", filter: "blur(16px)" }} />
            <div aria-hidden="true" style={{ position: "absolute", left: -BASE_W / 2 - 14, top: -DEPTH / 2 - 14, width: BASE_W + 60, height: DEPTH + 28, transform: `translate3d(14px,${BASE_H + 0.5}px,6px) rotateX(90deg)`, background: "rgba(0,4,5,0.85)", borderRadius: 12, filter: "blur(9px)" }} />
            <Box w={BASE_W} h={BASE_H} d={DEPTH} x={0} y={BASE_H / 2} z={0} front={wal(2, BASE_W, BASE_H)} top={wal(5, BASE_W, DEPTH)} side={walEnd(1)} />
            {[-1, 1].map((dir) => <Box key={dir} w={CHEEK} h={CHEEK_H} d={DEPTH - 30} x={dir * (W / 2 + CHEEK / 2 + 3)} y={-CHEEK_H / 2} z={0} front={walUp(dir + 3, CHEEK)} top={wal(dir + 7, CHEEK, DEPTH)} side={walUp(dir + 9, DEPTH)} />)}
            {[-1, 0].map((k) => <Box key={k} w={W} h={BAR} d={barZ} x={0} y={-BAR / 2} z={k * barZ} front={map(k + 11, BAR)} top={map(k + 14, barZ)} side={skin(tex?.mapleEnd ?? "", "#c9a06a", k + 4, barZ, BAR, 256)} />)}
            <div role="spinbutton" tabIndex={0} aria-label="Month" aria-valuemin={1} aria-valuemax={12} aria-valuenow={pick.m + 1} aria-valuetext={MON[pick.m]} onKeyDown={keys(stepMonth, 3, () => setPick((p) => ({ m: 0, d: Math.min(p.d, lengthOf(0)) })), () => setPick((p) => ({ m: 11, d: p.d })))} {...watch("month")} {...grab(stepMonth, () => stepMonth(1))} className="cursor-grab touch-none outline-none active:cursor-grabbing" style={{ position: "absolute", transformStyle: "preserve-3d" }}>
              <Turner value={MON[pick.m]} before={MON[mod(pick.m - 1, 12)]} w={W} s={BAR} x={0} y={-BAR / 2} z={barZ + (BAR - barZ) / 2 - 1} slide tex={tex} seed={4} ring={focus === "month"} render={word} />
            </div>
            <div role="spinbutton" tabIndex={0} aria-label="Day" aria-valuemin={1} aria-valuemax={len} aria-valuenow={pick.d} aria-valuetext={label} onKeyDown={keys(stepDay, 7, () => setDay(1), () => setDay(31))} {...watch("day")} className="cursor-grab touch-none outline-none active:cursor-grabbing" style={{ position: "absolute", transformStyle: "preserve-3d" }}>
              <div {...grab((n) => stepDay(n * 10), () => setDay(pick.d + 10 <= len ? pick.d + 10 : pick.d % 10 || 10))} style={{ position: "absolute", transformStyle: "preserve-3d" }}>
                <Turner value={String(tens)} before={String(mod(tens - 1, 4))} w={S} s={S} x={-(S + GAP) / 2} y={cubeY} z={0} slide={false} tex={tex} seed={1} ring={focus === "day"} render={digit} />
              </div>
              <div {...grab(stepDay, () => stepDay(1))} style={{ position: "absolute", transformStyle: "preserve-3d" }}>
                <Turner value={String(ones)} before={String(prev % 10)} w={S} s={S} x={(S + GAP) / 2} y={cubeY} z={0} slide={false} tex={tex} seed={2} ring={focus === "day"} render={digit} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="relative mt-4 flex items-center gap-1 sm:mt-8">
        <button type="button" onClick={() => { touch(); stepDay(-1); }} aria-label="Previous day" className={arrow}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.5 6.5 10l5.5 5.5" /></svg>
        </button>
        <p aria-live="polite" className="min-w-[230px] text-center">
          <span className="block text-[17px] font-semibold leading-6 tracking-tight text-white">{label} <span className="font-normal text-[#b9d2cf]">{date.getFullYear()}</span></span>
          <span className="block font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-[#b9d2cf]">{VENUE} <span className="mx-1 hidden text-[#6f9794] sm:inline">/</span> <span className="block sm:inline">{NOTE}</span></span>
        </p>
        <button type="button" onClick={() => { touch(); stepDay(1); }} aria-label="Next day" className={arrow}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m8 4.5 5.5 5.5L8 15.5" /></svg>
        </button>
      </div>
    </div>
  );
}
