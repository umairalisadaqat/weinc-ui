import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/** The border posts. `kind` picks the die, `ink` is its red, green and blue. */
const entries: { place: string; kind: "round" | "box" | "oval" | "octagon"; word: string; date: string; office: string; ink: [number, number, number] }[] = [
  { place: "Port Callow", kind: "round", word: "ARRIVED", date: "14 MAR 2026", office: "IMMIGRATION", ink: [36, 58, 148] },
  { place: "Saint Elvary", kind: "box", word: "ENTRY", date: "02 APR 2026", office: "HARBOUR CONTROL", ink: [186, 38, 50] },
  { place: "Veyra Islands", kind: "oval", word: "ADMITTED", date: "19 APR 2026", office: "FERRY PORT", ink: [20, 112, 86] },
  { place: "Tarnholm", kind: "octagon", word: "DEPARTED", date: "23 APR 2026", office: "RAIL BORDER", ink: [44, 44, 52] },
  { place: "Kossu Bay", kind: "round", word: "TRANSIT", date: "06 MAY 2026", office: "AIR TERMINAL", ink: [126, 52, 146] },
  { place: "Marrowmere", kind: "box", word: "ARRIVED", date: "30 MAY 2026", office: "ROAD CROSSING", ink: [22, 100, 158] },
  { place: "Cape Ilse", kind: "oval", word: "ENTRY", date: "11 JUN 2026", office: "SEA PORT", ink: [188, 88, 22] },
  { place: "Dunmarrow", kind: "octagon", word: "ADMITTED", date: "27 JUN 2026", office: "NORTH GATE", ink: [156, 32, 78] },
];
const ISSUER = "Laurel Sound";

// Design pixels: one page, the cover that shows round it, and the scene they sit in.
const PW = 300;
const PH = 426;
const EDGE = 10;
const SCENE_W = 900;
const SCENE_H = 560;
const TIP = 24; // degrees the booklet is tipped away
const TURN = -7; // degrees it is turned on the desk
const PER_SPREAD = 8;
const SIZE = { round: [122, 122], box: [136, 86], oval: [142, 94], octagon: [116, 116] } as const;
// where stamps land on a page when nobody aims them: left page then right page
const SLOTS = {
  L: [
    { x: 96, y: 118, r: -11 },
    { x: 204, y: 202, r: 7 },
    { x: 100, y: 296, r: 5 },
    { x: 210, y: 356, r: -8 },
  ],
  R: [
    { x: 102, y: 108, r: 8 },
    { x: 202, y: 176, r: -9 },
    { x: 96, y: 262, r: -4 },
    { x: 204, y: 338, r: 12 },
  ],
};
const ORDER: ["L" | "R", number][] = [["L", 0], ["R", 1], ["L", 2], ["L", 1], ["R", 0], ["R", 2], ["L", 3], ["R", 3]];
const START = 3; // stamps already in the book when it opens

type Mark = { id: number; spread: number; side: "L" | "R"; x: number; y: number; r: number; die: number; fresh: boolean };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** One impression of a die: drawn solid, then starved of ink by noise and by the lean of the hand. */
function impress(i: number) {
  const e = entries[i];
  const [w, h] = SIZE[e.kind];
  const K = 2;
  const cv = document.createElement("canvas");
  cv.width = w * K;
  cv.height = h * K;
  const c = cv.getContext("2d");
  if (!c) return "";
  c.scale(K, K);
  c.fillStyle = "#000";
  c.strokeStyle = "#000";
  c.textAlign = "center";
  c.textBaseline = "middle";
  const cx = w / 2;
  const cy = h / 2;
  const sans = (px: number, wt = 800) => `${wt} ${px}px 'Arial Narrow','Helvetica Neue',Helvetica,Arial,sans-serif`;
  const mono = (px: number) => `700 ${px}px ui-monospace,SFMono-Regular,Menlo,monospace`;
  const spaced = (text: string, x: number, y: number, gap: number) => {
    const ws = [...text].map((ch) => c.measureText(ch).width);
    let pen = x - (ws.reduce((a, b) => a + b, 0) + gap * (text.length - 1)) / 2;
    [...text].forEach((ch, k) => {
      c.fillText(ch, pen + ws[k] / 2, y);
      pen += ws[k] + gap;
    });
  };
  const arc = (text: string, radius: number, top: boolean, gap: number) => {
    const ws = [...text].map((ch) => c.measureText(ch).width + gap);
    const total = ws.reduce((a, b) => a + b, 0) / radius;
    let a = top ? -Math.PI / 2 - total / 2 : Math.PI / 2 + total / 2;
    [...text].forEach((ch, k) => {
      const step = ws[k] / radius;
      const mid = top ? a + step / 2 : a - step / 2;
      c.save();
      c.translate(cx + Math.cos(mid) * radius, cy + Math.sin(mid) * radius);
      c.rotate(top ? mid + Math.PI / 2 : mid - Math.PI / 2);
      c.fillText(ch, 0, 0);
      c.restore();
      a = top ? a + step : a - step;
    });
  };
  const plane = (x: number, y: number, s: number) => {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.beginPath();
    c.moveTo(9, 0); c.lineTo(2, -1.4); c.lineTo(-2, -8); c.lineTo(-4.4, -8); c.lineTo(-2.2, -1.5); c.lineTo(-6.5, -1.2); c.lineTo(-8.4, -3.6); c.lineTo(-9.6, -3.6); c.lineTo(-8.6, 0);
    c.lineTo(-9.6, 3.6); c.lineTo(-8.4, 3.6); c.lineTo(-6.5, 1.2); c.lineTo(-2.2, 1.5); c.lineTo(-4.4, 8); c.lineTo(-2, 8); c.lineTo(2, 1.4);
    c.closePath();
    c.fill();
    c.restore();
  };
  const place = e.place.toUpperCase();

  if (e.kind === "round") {
    c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, w / 2 - 3, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, w / 2 - 8, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(cx, cy, w / 2 - 27, 0, Math.PI * 2); c.stroke();
    c.font = sans(11.5, 900); arc(place, w / 2 - 17.5, true, 2.2);
    c.font = sans(8.5); arc(e.office, w / 2 - 17.5, false, 2);
    c.fillRect(cx - w / 2 + 11, cy - 1.5, 5, 3); c.fillRect(cx + w / 2 - 16, cy - 1.5, 5, 3);
    plane(cx, cy - 17, 0.8);
    c.font = sans(13.5, 900); spaced(e.word, cx, cy + 1, 1);
    c.font = mono(7.2); c.fillText(e.date, cx, cy + 15);
  } else if (e.kind === "box") {
    const box = (x: number, y: number, bw: number, bh: number, r: number) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + bw, y, x + bw, y + bh, r); c.arcTo(x + bw, y + bh, x, y + bh, r); c.arcTo(x, y + bh, x, y, r); c.arcTo(x, y, x + bw, y, r); c.closePath(); c.stroke(); };
    c.lineWidth = 3; box(2.5, 2.5, w - 5, h - 5, 5);
    c.lineWidth = 1; box(7.5, 7.5, w - 15, h - 15, 2);
    c.font = sans(10.5, 900); spaced(place, cx, 19.5, 2);
    c.fillRect(14, 27, w - 28, 1.2);
    c.font = sans(24, 900); spaced(e.word, cx, 43.5, 2.4);
    c.fillRect(14, 58, w - 28, 1.2);
    c.font = mono(7.4); c.fillText(`${e.date}  ${e.office}`, cx, 67.5, w - 30);
  } else if (e.kind === "oval") {
    c.lineWidth = 2.8; c.beginPath(); c.ellipse(cx, cy, w / 2 - 3, h / 2 - 3, 0, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 1; c.beginPath(); c.ellipse(cx, cy, w / 2 - 8, h / 2 - 8, 0, 0, Math.PI * 2); c.stroke();
    c.font = sans(10.5, 900); spaced(place, cx, cy - 23, 1.8);
    c.fillRect(cx - 36, cy - 14.5, 72, 1.1);
    c.font = sans(19, 900); spaced(e.word, cx, cy - 1, 1.6);
    c.fillRect(cx - 36, cy + 11.5, 72, 1.1);
    c.font = mono(7.4); c.fillText(e.date, cx, cy + 20);
    c.font = sans(7); spaced(e.office, cx, cy + 30, 1.4);
  } else {
    const ring = (rad: number) => { c.beginPath(); for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + (k * Math.PI) / 4; c[k ? "lineTo" : "moveTo"](cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } c.closePath(); c.stroke(); };
    c.lineWidth = 3; ring(w / 2 - 3);
    c.lineWidth = 1; ring(w / 2 - 8.5);
    c.font = sans(10.5, 900); spaced(place, cx, cy - 27, 1.8);
    plane(cx, cy - 13, 0.62);
    c.font = sans(16, 900); spaced(e.word, cx, cy + 3, 1.2);
    c.fillRect(cx - 34, cy + 13, 68, 1.1);
    c.font = mono(7.2); c.fillText(e.date, cx, cy + 21);
    c.font = sans(7); spaced(e.office, cx, cy + 31, 1.2);
  }

  const seed = i * 7.31 + 2.1;
  const hash = (x: number, y: number) => { const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453; return n - Math.floor(n); };
  const soft = (x: number, y: number) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy); return (hash(xi, yi) * (1 - ux) + hash(xi + 1, yi) * ux) * (1 - uy) + (hash(xi, yi + 1) * (1 - ux) + hash(xi + 1, yi + 1) * ux) * uy; };
  const lean = hash(3, 9) * Math.PI * 2, lx = Math.cos(lean), ly = Math.sin(lean), rock = 0.2 + hash(5, 2) * 0.3, load = 0.86 + hash(8, 1) * 0.3;
  const img = c.getImageData(0, 0, cv.width, cv.height), d = img.data, W = cv.width, HH = cv.height;
  for (let y = 0; y < HH; y++) {
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4, a = d[p + 3];
      if (!a) continue;
      const u = x / W, v = y / HH;
      const blotch = soft(u * 6, v * 5) * 0.6 + soft(u * 17 + 4, v * 15 + 4) * 0.4;
      const cover = load * 1.25 - 0.4 + (blotch - 0.5) * 1.1 + (lx * (u - 0.5) * 2 + ly * (v - 0.5) * 2) * rock;
      let t = clamp(cover / 0.5, 0, 1); t = t * t * (3 - 2 * t);
      let alpha = t * (0.78 + 0.22 * hash(x, y));
      if (hash(Math.floor(x / 2) + 40, Math.floor(y / 2)) < 0.05 + 0.22 * (1 - t)) alpha *= 0.25;
      const deep = 1 - 0.2 * t * blotch;
      d[p] = e.ink[0] * deep; d[p + 1] = e.ink[1] * deep; d[p + 2] = e.ink[2] * deep; d[p + 3] = a * alpha * 0.92;
    }
  }
  c.putImageData(img, 0, 0);
  return cv.toDataURL();
}

/** The printed background of a visa page: crossing wave lines and a lobed rosette, as on any security paper. */
function Printing({ flip }: { flip: boolean }) {
  const art = useMemo(() => {
    const waves: string[] = [];
    for (let k = 0; k < 16; k++) {
      let dd = "";
      for (let x = -4; x <= PW + 4; x += 6) {
        const y = 34 + k * 24 + Math.sin(x * 0.045 + k * 0.9) * 9 + Math.sin(x * 0.11 + k) * 2.5;
        dd += `${x === -4 ? "M" : "L"}${x} ${y.toFixed(1)}`;
      }
      waves.push(dd);
    }
    const cross: string[] = [];
    for (let k = 0; k < 16; k++) {
      let dd = "";
      for (let x = -4; x <= PW + 4; x += 6) {
        const y = 46 + k * 24 - Math.sin(x * 0.045 + k * 0.9 + 1.4) * 9;
        dd += `${x === -4 ? "M" : "L"}${x} ${y.toFixed(1)}`;
      }
      cross.push(dd);
    }
    const rosette = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => {
      let dd = "";
      for (let s = 0; s <= 360; s += 1) {
        const a = (s * Math.PI) / 180;
        const rad = 50 + (n % 4) * 7 + 13 * Math.sin(a * 14 + (n * Math.PI) / 4) * (n < 4 ? 1 : 0.45);
        dd += `${s ? "L" : "M"}${(PW / 2 + Math.cos(a) * rad).toFixed(1)} ${(PH / 2 + 6 + Math.sin(a) * rad).toFixed(1)}`;
      }
      return dd + "Z";
    });
    return { waves, cross, rosette };
  }, []);
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${PW} ${PH}`} className="pointer-events-none absolute inset-0 h-full w-full" style={{ transform: flip ? "scaleX(-1)" : undefined }} fill="none">
      {art.waves.map((dd, k) => (
        <path key={k} d={dd} stroke="#4f97a3" strokeOpacity="0.3" strokeWidth="0.6" />
      ))}
      {art.cross.map((dd, k) => (
        <path key={k} d={dd} stroke="#c9836d" strokeOpacity="0.26" strokeWidth="0.6" />
      ))}
      {art.rosette.map((dd, k) => (
        <path key={k} d={dd} stroke={k % 2 ? "#c9836d" : "#3f8a97"} strokeOpacity="0.42" strokeWidth="0.45" />
      ))}
    </svg>
  );
}

function Page({ side, no, marks, inks, still, onAim }: { side: "L" | "R"; no: number; marks: Mark[]; inks: string[]; still: boolean; onAim?: (side: "L" | "R", x: number, y: number) => void }) {
  const left = side === "L";
  return (
    <div
      onClick={onAim ? (e) => onAim(side, e.nativeEvent.offsetX, e.nativeEvent.offsetY) : undefined}
      className={`absolute inset-0 overflow-hidden bg-[#efe6d0] ${left ? "rounded-l-[9px] rounded-r-[2px]" : "rounded-l-[2px] rounded-r-[9px]"} ${onAim ? "cursor-crosshair" : ""}`}
    >
      <Printing flip={left} />
      <div className={`pointer-events-none absolute top-[17px] flex items-baseline gap-[10px] font-mono text-[7.5px] font-semibold uppercase leading-none tracking-[0.3em] text-[#6b5a45] ${left ? "left-[20px]" : "right-[20px] flex-row-reverse"}`}>
        <span>Visas</span>
        <span className="text-[#93826a]">{ISSUER}</span>
      </div>
      <div className={`pointer-events-none absolute bottom-[15px] font-serif text-[13px] leading-none text-[#6b5a45] ${left ? "left-[20px]" : "right-[20px]"}`}>{no}</div>
      <div className={`pointer-events-none absolute bottom-[16px] font-mono text-[8px] font-semibold leading-none tracking-[0.34em] text-[#a3927a] ${left ? "right-[26px]" : "left-[26px]"}`}>LS 7204915</div>

      {inks.length > 0 &&
        marks.map((m) => {
          const e = entries[m.die];
          const [w, h] = SIZE[e.kind];
          const move = m.fresh && !still;
          return (
            <div key={m.id} className="pointer-events-none absolute" style={{ left: m.x - w / 2, top: m.y - h / 2, width: w, height: h, transform: `rotate(${m.r}deg)` }}>
              <motion.img
                src={inks[m.die]}
                alt={`${e.word.toLowerCase()} stamp from ${e.place}, ${e.date}`}
                draggable={false}
                className="absolute inset-0 h-full w-full mix-blend-multiply"
                initial={move ? { opacity: 0, scale: 1.05, filter: "saturate(1.9) brightness(0.62) blur(0.7px)" } : false}
                animate={{ opacity: 1, scale: 1, filter: "saturate(1) brightness(1) blur(0px)" }}
                transition={{ opacity: { delay: 0.15, duration: 0.03 }, scale: { delay: 0.15, duration: 0.09 }, filter: { delay: 0.2, duration: 1.5, ease: "easeOut" } }}
              />
              {/* the shadow of the hand stamp coming down on this spot and leaving again */}
              {move && (
                <motion.div
                  aria-hidden="true"
                  className="absolute -inset-[8px] rounded-[22px] bg-[#1b0f08]"
                  style={{ filter: "blur(9px)" }}
                  initial={{ opacity: 0, scale: 1.9, x: 46, y: 54 }}
                  animate={{ opacity: [0, 0.62, 0.5, 0], scale: [1.9, 1.02, 1.05, 1.8], x: [46, 2, 4, 40], y: [54, 3, 5, 46] }}
                  transition={{ duration: 0.52, times: [0, 0.29, 0.42, 1], ease: "easeInOut" }}
                />
              )}
            </div>
          );
        })}

      {/* the page dips into the stitching and catches light where it rises out of it */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(${left ? 270 : 90}deg, rgba(40,22,8,0.5) 0%, rgba(40,22,8,0.2) 3.5%, rgba(40,22,8,0.05) 9%, rgba(255,255,255,0.3) 17%, rgba(255,255,255,0) 36%, rgba(40,22,8,0) 74%, rgba(40,22,8,0.1) 100%)` }}
      />
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-40 mix-blend-multiply">
        <rect width="100%" height="100%" filter="url(#passport-stamps-fibre)" />
      </svg>
    </div>
  );
}

const firstMarks: Mark[] = ORDER.slice(0, START).map(([side, n], i) => ({ id: i, spread: 0, side, ...SLOTS[side][n], die: i, fresh: false }));
const fullMarks: Mark[] = ORDER.map(([side, n], i) => ({ id: i, spread: 0, side, ...SLOTS[side][n], die: i % entries.length, fresh: false }));
const stack = (dir: 1 | -1) => [1, 2, 3, 4, 5].map((n) => `${dir * n * 1.1}px ${n * 0.9}px 0 ${n % 2 ? "#cfc3a6" : "#f3ebd8"}`).join(", ");

export default function PassportStampCard() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const live = useRef({ touched: false, paused: false, clock: 0, id: 100, die: START, used: START, spread: 0, turning: false, wait: 0 });
  const [inks, setInks] = useState<string[]>([]);
  const [marks, setMarks] = useState<Mark[]>(firstMarks);
  const [spread, setSpread] = useState(0);
  const [turning, setTurning] = useState(false);
  const [said, setSaid] = useState("");
  const [nextDie, setNextDie] = useState(START);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rz = useSpring(useTransform(px, (v) => TURN + v * 4), { stiffness: 60, damping: 14 });
  const rx = useSpring(useTransform(py, (v) => TIP - v * 5), { stiffness: 60, damping: 14 });
  const jolt = useMotionValue(0);
  const dip = useTransform(jolt, (v) => -v * 9);
  const nod = useTransform(jolt, (v) => v * 1.1);
  const turn = useMotionValue(0);
  const leafAngle = useTransform(turn, (v) => -180 * v);
  const leafFront = useTransform(turn, (v) => clamp(v * 1.3, 0, 0.55));
  const leafBack = useTransform(turn, (v) => clamp((1 - v) * 1.1, 0, 0.5));
  const castRight = useTransform(turn, (v) => Math.sin(Math.min(1, v * 2) * Math.PI * 0.5) * (v < 0.5 ? 0.5 : 1 - v) * 1.1);
  const castLeft = useTransform(turn, (v) => (v > 0.4 ? Math.sin(((v - 0.4) / 0.6) * Math.PI) * 0.8 : 0));

  useEffect(() => {
    setInks(entries.map((_, i) => impress(i)));
  }, []);
  useEffect(() => {
    if (!reduce) return;
    live.current.used = PER_SPREAD;
    live.current.die = PER_SPREAD;
    setMarks(fullMarks);
    setNextDie(PER_SPREAD % entries.length);
  }, [reduce]);

  const leaf = useCallback(() => {
    const s = live.current;
    if (s.turning) return;
    s.turning = true;
    const land = () => {
      s.spread += 1;
      s.used = 0;
      s.turning = false;
      s.clock = 0;
      setSpread(s.spread);
      setMarks((all) => all.filter((m) => m.spread >= s.spread));
      setTurning(false);
      turn.set(0);
    };
    setTurning(true);
    if (reduce) land();
    else animate(turn, 1, { duration: 1.15, ease: [0.5, 0, 0.2, 1] }).then(land);
  }, [reduce, turn]);

  const stamp = useCallback(
    (at?: { side: "L" | "R"; x: number; y: number }) => {
      const s = live.current;
      if (s.turning) return;
      if (s.used >= PER_SPREAD + 4) return leaf();
      const die = s.die % entries.length;
      const [side, n] = ORDER[s.used % ORDER.length];
      const slot = SLOTS[side][n];
      const [w, h] = SIZE[entries[die].kind];
      const spot = at ? { side: at.side, x: clamp(at.x, w / 2 + 4, PW - w / 2 - 4), y: clamp(at.y, h / 2 + 26, PH - h / 2 - 26), r: ((s.id * 37) % 25) - 12 } : { side, ...slot };
      s.id += 1;
      s.die += 1;
      s.used += 1;
      s.clock = 0;
      setMarks((all) => [...all, { id: s.id, spread: s.spread, ...spot, die, fresh: true }]);
      setNextDie(s.die % entries.length);
      setSaid(`Stamped ${entries[die].place}: ${entries[die].word.toLowerCase()} ${entries[die].date}.`);
      if (!reduce) animate(jolt, [0, 0, 1, -0.25, 0], { duration: 0.5, times: [0, 0.28, 0.36, 0.6, 1], ease: "easeOut" });
    },
    [jolt, leaf, reduce],
  );

  // the demo: a stamp every half second or so, and a fresh leaf once the spread is full
  useEffect(() => {
    if (reduce) return;
    const s = live.current;
    const tick = window.setInterval(() => {
      if (s.paused || document.hidden || s.turning) return;
      s.clock += 100;
      if (s.used >= PER_SPREAD) {
        if (s.clock >= (s.touched ? 1500 : 2600)) leaf();
      } else if (!s.touched && s.clock >= (s.spread === 0 && s.used === START ? 500 : 560)) stamp();
    }, 100);
    return () => window.clearInterval(tick);
  }, [leaf, reduce, stamp]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    if (!wrap || !scene) return;
    const measure = () => {
      const sc = clamp(wrap.clientWidth / (SCENE_W - 190), 0.44, 1.26);
      wrap.style.height = `${Math.round(SCENE_H * sc + 64)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const aim = (side: "L" | "R", x: number, y: number) => {
    live.current.touched = true;
    stamp({ side, x, y });
  };
  const on = (s: number, side: "L" | "R") => marks.filter((m) => m.spread === s && m.side === side);
  const leftNo = 8 + spread * 2;
  const next = entries[nextDie];
  const BW = PW * 2 + EDGE * 2;
  const BH = PH + EDGE * 2;

  return (
    <section className="relative overflow-hidden bg-[#12343b]">
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <filter id="passport-stamps-fibre" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8 0.6" numOctaves="3" seed="11" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0 0.18  0.9 0 0 0 -0.3" />
        </filter>
        <filter id="passport-stamps-hide" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" seed="4" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 -0.5" />
        </filter>
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(66% 62% at 46% 38%, #24606a 0%, #174650 44%, #0c262c 100%)" }} />
      <div
        ref={wrapRef}
        onPointerMove={(e) => {
          if (reduce || e.pointerType === "touch") return;
          const r = e.currentTarget.getBoundingClientRect();
          px.set(((e.clientX - r.left) / r.width) * 2 - 1);
          py.set(((e.clientY - r.top) / r.height) * 2 - 1);
        }}
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") live.current.paused = true;
        }}
        onPointerLeave={() => {
          live.current.paused = false;
          px.set(0);
          py.set(0);
        }}
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: SCENE_H * 1.26 + 64 }}
      >
        <div ref={sceneRef} className="absolute left-1/2 top-0 select-none" style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "2200px", perspectiveOrigin: "50% 30%" }}>
          <motion.div className="absolute" style={{ left: SCENE_W / 2 - BW / 2, top: SCENE_H / 2 - BH / 2 - 4, width: BW, height: BH, transformStyle: "preserve-3d", rotateX: rx, rotateZ: rz }}>
            {/* shadows on the desk */}
            <div aria-hidden="true" className="absolute rounded-[20px] bg-black" style={{ left: 10, top: 22, width: BW + 26, height: BH + 22, filter: "blur(26px)", opacity: 0.5, transform: "translateZ(-16px)" }} />
            <div aria-hidden="true" className="absolute rounded-[16px] bg-black" style={{ left: 3, top: 6, width: BW, height: BH + 2, filter: "blur(5px)", opacity: 0.6, transform: "translateZ(-15px)" }} />

            <motion.div className="absolute inset-0" style={{ transformStyle: "preserve-3d", z: dip, rotateX: nod }}>
              {/* the cover, seen as a leather border round the pages */}
              <div className="absolute inset-0 overflow-hidden rounded-[15px] bg-[#641826]" style={{ boxShadow: "inset 0 1px 0 rgba(255,190,190,0.35), inset 0 -2px 2px rgba(0,0,0,0.45), 0 2px 0 #3b0c15, 0 3.5px 0 #2a080f" }}>
                <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-50">
                  <rect width="100%" height="100%" filter="url(#passport-stamps-hide)" />
                </svg>
                <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(255,200,200,0.22), rgba(255,255,255,0) 30%, rgba(0,0,0,0.25) 100%)" }} />
              </div>

              {/* left and right blocks of pages */}
              <div className="absolute" style={{ left: EDGE, top: EDGE - 3, width: PW, height: PH, borderRadius: "9px 2px 2px 9px", boxShadow: stack(-1), background: "#efe6d0" }}>
                <Page side="L" no={leftNo} marks={on(spread, "L")} inks={inks} still={reduce} onAim={turning ? undefined : aim} />
                <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-l-[9px]" style={{ opacity: castLeft, background: "linear-gradient(270deg, rgba(20,10,4,0.75), rgba(20,10,4,0.2) 60%, rgba(20,10,4,0))" }} />
              </div>
              <div className="absolute" style={{ left: EDGE + PW, top: EDGE - 3, width: PW, height: PH, borderRadius: "2px 9px 9px 2px", boxShadow: stack(1), background: "#efe6d0" }}>
                <Page side="R" no={leftNo + (turning ? 3 : 1)} marks={on(spread + (turning ? 1 : 0), "R")} inks={inks} still={reduce} onAim={turning ? undefined : aim} />
                <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-r-[9px]" style={{ opacity: castRight, background: "linear-gradient(90deg, rgba(20,10,4,0.8), rgba(20,10,4,0.25) 55%, rgba(20,10,4,0))" }} />
              </div>

              {/* the leaf in the air while a full spread turns over */}
              {turning && !reduce && (
                <motion.div className="absolute" style={{ left: EDGE + PW, top: EDGE - 3, width: PW, height: PH, transformOrigin: "0% 50%", transformStyle: "preserve-3d", rotateY: leafAngle, z: 1.5 }}>
                  <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                    <Page side="R" no={leftNo + 1} marks={on(spread, "R")} inks={inks} still />
                    <motion.div aria-hidden="true" className="absolute inset-0 rounded-r-[9px] bg-[#1c0f06]" style={{ opacity: leafFront }} />
                  </div>
                  <div className="absolute inset-0" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                    <Page side="L" no={leftNo + 2} marks={[]} inks={inks} still />
                    <motion.div aria-hidden="true" className="absolute inset-0 rounded-l-[9px] bg-[#1c0f06]" style={{ opacity: leafBack }} />
                  </div>
                </motion.div>
              )}

              {/* the stitching down the fold */}
              <div aria-hidden="true" className="pointer-events-none absolute" style={{ left: BW / 2 - 1, top: EDGE + 14, width: 2, height: PH - 34, transform: "translateZ(0.6px)", background: "repeating-linear-gradient(180deg, #f6eedb 0 30px, rgba(0,0,0,0) 30px 42px)", boxShadow: "1px 1px 1px rgba(30,15,5,0.55)", borderRadius: 1 }} />
            </motion.div>
          </motion.div>
        </div>

        <p className="pointer-events-none absolute bottom-5 left-5 hidden font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-teal-100/80 sm:bottom-8 sm:left-8 sm:block">
          <span className="text-white">
            {ISSUER} / pages {leftNo} and {leftNo + 1}
          </span>
          <span className="block">Click a page to stamp it there</span>
        </p>
        <button
          type="button"
          onClick={() => {
            live.current.touched = true;
            stamp();
          }}
          className="absolute bottom-4 right-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#efe6d0] px-5 text-[13px] font-semibold text-[#2a1508] shadow-[0_6px_18px_rgba(0,0,0,0.35)] outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#12343b] active:translate-y-0 motion-reduce:transition-none sm:bottom-7 sm:right-8"
        >
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: `rgb(${next.ink.join(",")})` }} />
          Stamp {next.place}
        </button>
        <p aria-live="polite" className="sr-only">
          {said}
        </p>
      </div>
    </section>
  );
}
