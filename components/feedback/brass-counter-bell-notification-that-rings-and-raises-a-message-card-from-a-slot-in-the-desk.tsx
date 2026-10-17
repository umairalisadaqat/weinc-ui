import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";

/** The messages the bell hands over, in order. Ringing the bell shows the next one. */
const notes = [
  { from: "Front desk", time: "7:42 pm", title: "Your table is ready", body: "Table nine by the window, laid for four." },
  { from: "Bookings", time: "7:45 pm", title: "New booking confirmed", body: "Mara Ellison, two nights from Friday." },
  { from: "Payments", time: "7:51 pm", title: "Deposit received", body: "The garden room is paid for and held." },
  { from: "Housekeeping", time: "8:03 pm", title: "Room 14 is made up", body: "Fresh linen in, key back on its hook." },
];

const SOUND = false; // set to true for a short ding on each ring (it only ever plays after the visitor has pressed the bell)
const HOLD = 4200; // milliseconds a card stays up while the piece plays by itself
const TRAVEL = 400; // how far the card sinks into the desk

// The bell is a turned object, so it is drawn as one: each part is a profile of [radius, height] points spun round the centre.
type Pt = [number, number];
const CW = 320; // drawing size in CSS pixels at phone width
const CH = 260;
const CX = 160;
const FOOT = 214; // screen y of the centre of the underside
const TILT = (14 * Math.PI) / 180; // how far above the desk the eye is
const BASE: Pt[] = [[0, 0], [116, 0], [116, 0], [125, 2], [125, 10], [125, 10], [119, 16], [103, 19], [92, 24], [92, 24], [40, 25], [0, 25]];
const DOME: Pt[] = [[104, 19], [104, 19], [112, 20], [113.5, 23], [112, 26.5], [112, 26.5], [109, 34], [103, 50], [93, 70], [78, 90], [58, 106], [36, 117], [18, 122], [10, 123], [10, 123], [9.5, 129], [9.5, 129], [5, 130], [0, 130]];
const STEM: Pt[] = [[0, 100], [3.4, 100], [3.4, 100], [3.4, 151], [3.4, 151], [10, 151.5], [13, 155], [13.5, 160], [12, 165], [7, 168.5], [0, 169]];

// long wood grain for the desk, as a repeating picture
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='900' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.0035 0.18' numOctaves='4' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.04  0 0 0 0 0.01  0 0 0 -2.6 1.5'/></filter><rect width='900' height='300' filter='url(#n)'/></svg>")}")`;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const band = (v: number, a: number, b: number, s: number) => smooth(a - s, a + s, v) * (1 - smooth(b - s, b + s, v));

/** Round every corner of a profile a little, the way a lathe tool leaves it. Doubled points stay sharp. */
function soften(pts: Pt[], rounds: number): Pt[] {
  let out = pts;
  for (let k = 0; k < rounds; k++) {
    const next: Pt[] = [out[0]];
    for (let i = 0; i < out.length - 1; i++) {
      const [r0, h0] = out[i];
      const [r1, h1] = out[i + 1];
      next.push([r0 * 0.75 + r1 * 0.25, h0 * 0.75 + h1 * 0.25], [r0 * 0.25 + r1 * 0.75, h0 * 0.25 + h1 * 0.75]);
    }
    next.push(out[out.length - 1]);
    out = next;
  }
  return out;
}

/** What the polished metal sees: a dim lobby, a tall window up to the left, a lamp to the right and the desk below. */
function room(x: number, y: number, z: number): [number, number, number] {
  const el = Math.asin(clamp(y, -1, 1));
  const az = Math.atan2(x, z);
  const high = Math.max(0, el);
  let r = 0.07 + 0.34 * high * high;
  let g = 0.05 + 0.3 * high * high;
  let b = 0.05 + 0.28 * high * high;
  const win = band(az, -1.2, -0.42, 0.07) * band(el, 0.16, 1.02, 0.07) * (1 - 0.9 * band(az, -0.84, -0.78, 0.022)) * (1 - 0.9 * band(el, 0.56, 0.61, 0.022));
  r += win * 4.6;
  g += win * 4.5;
  b += win * 4.2;
  const slit = band(az, -0.3, -0.16, 0.03) * band(el, 0.2, 0.95, 0.07);
  r += slit * 2.4;
  g += slit * 2.3;
  b += slit * 2.1;
  const lamp = band(az, 0.7, 1.0, 0.08) * band(el, 0.04, 0.5, 0.1);
  r += lamp * 2.3;
  g += lamp * 1.7;
  b += lamp * 1.0;
  const fill = band(az, -0.2, 0.3, 0.22) * band(el, 0.5, 1.2, 0.2);
  r += fill * 0.55;
  g += fill * 0.5;
  b += fill * 0.46;
  const wall = band(el, 0.0, 0.14, 0.04) * (1 - win) * 0.7;
  r *= 1 - wall;
  g *= 1 - wall;
  b *= 1 - wall;
  if (el < 0.02) {
    const d = smooth(0.02, -0.7, el);
    const k = smooth(0.02, -0.05, el);
    r = r * (1 - k) + (0.5 - 0.44 * d) * k;
    g = g * (1 - k) + (0.27 - 0.24 * d) * k;
    b = b * (1 - k) + (0.13 - 0.12 * d) * k;
  }
  return [r, g, b];
}

type Part = { pts: Pt[]; metal: 1 | 2 };

/** Spin the profiles, keep the nearest surface at each pixel, then light every pixel once. Drawn at three times size and scaled down for clean edges. */
function turn(parts: Part[]): HTMLCanvasElement {
  const S = 3;
  const W = CW * S;
  const H = CH * S;
  const sinT = Math.sin(TILT);
  const cosT = Math.cos(TILT);
  const depth = new Float32Array(W * H).fill(-1e9);
  const nx = new Float32Array(W * H);
  const ny = new Float32Array(W * H);
  const nz = new Float32Array(W * H);
  const hh = new Float32Array(W * H);
  const kind = new Uint8Array(W * H);
  for (const part of parts) {
    const p = soften(part.pts, 3);
    const tn: Pt[] = p.map((_, i) => {
      const a = p[Math.max(0, i - 1)];
      const c = p[Math.min(p.length - 1, i + 1)];
      const dr = c[0] - a[0];
      const dh = c[1] - a[1];
      const l = Math.hypot(dr, dh) || 1;
      return [dh / l, -dr / l];
    });
    for (let i = 0; i < p.length - 1; i++) {
      const steps = Math.max(1, Math.ceil(Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]) * S * 2));
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const r = p[i][0] + (p[i + 1][0] - p[i][0]) * t;
        const h = p[i][1] + (p[i + 1][1] - p[i][1]) * t;
        let nr = tn[i][0] + (tn[i + 1][0] - tn[i][0]) * t;
        let nh = tn[i][1] + (tn[i + 1][1] - tn[i][1]) * t;
        const nl = Math.hypot(nr, nh) || 1;
        nr /= nl;
        nh /= nl;
        const count = Math.ceil(Math.PI * 2 * r * S * 2) + 8;
        const da = (Math.PI * 2) / count;
        const ca = Math.cos(da);
        const sa = Math.sin(da);
        let c = 1;
        let sn = 0;
        for (let k = 0; k < count; k++) {
          const z = r * sn;
          const facing = nh * sinT + nr * sn * cosT;
          if (facing > 0) {
            const px = Math.round((CX + r * c) * S);
            const py = Math.round((FOOT - (h * cosT - z * sinT)) * S);
            if (px >= 0 && px < W && py >= 0 && py < H) {
              const d = z * cosT + h * sinT;
              const at = py * W + px;
              if (d > depth[at]) {
                depth[at] = d;
                nx[at] = nr * c;
                ny[at] = nh;
                nz[at] = nr * sn;
                hh[at] = h;
                kind[at] = part.metal;
              }
            }
          }
          const c2 = c * ca - sn * sa;
          sn = sn * ca + c * sa;
          c = c2;
        }
      }
    }
  }
  const sheet = document.createElement("canvas");
  sheet.width = W;
  sheet.height = H;
  const g2 = sheet.getContext("2d");
  if (!g2) return sheet;
  const img = g2.createImageData(W, H);
  const px = img.data;
  for (let i = 0; i < W * H; i++) {
    if (!kind[i]) continue;
    let a = nx[i];
    let b = ny[i];
    let c = nz[i];
    const brass = kind[i] === 1;
    if (brass) {
      // the faint rings a spinning chuck leaves in the metal
      b += 0.02 * Math.sin(hh[i] * 2.6) + 0.012 * Math.sin(hh[i] * 7.1);
      const l = Math.hypot(a, b, c);
      a /= l;
      b /= l;
      c /= l;
    }
    const nv = b * sinT + c * cosT;
    const [er, eg, eb] = room(2 * nv * a, 2 * nv * b - sinT, 2 * nv * c - cosT);
    const key = Math.max(0, a * -0.56 + b * 0.6 + c * 0.57);
    const edge = Math.pow(1 - clamp(nv, 0, 1), 4);
    let r: number;
    let g: number;
    let bl: number;
    if (brass) {
      const shade = hh[i] < 30 ? 0.55 + 0.45 * smooth(19, 30, hh[i]) : 1;
      const body = 0.03 + 0.15 * key;
      const hot = Math.max(0, (er + eg + eb) / 3 - 1.1);
      r = (body + er) * 1.0 * shade + hot * 0.5 + edge * er * 0.3;
      g = (body + eg) * 0.63 * shade + hot * 0.46 + edge * eg * 0.22;
      bl = (body + eb) * 0.15 * shade + hot * 0.3 + edge * eb * 0.1;
    } else {
      // black stove enamel: nearly no colour of its own, a soft mirror on top
      const shade = hh[i] > 18 ? 0.35 : 1;
      const f = 0.008 + 0.06 * edge + (er > 1.2 ? 0.07 : 0);
      r = (0.003 + er * f) * shade;
      g = (0.003 + eg * f) * shade;
      bl = (0.004 + eb * f) * shade;
    }
    const o = i * 4;
    px[o] = 255 * Math.pow(1 - Math.exp(-r * 1.5), 0.4545);
    px[o + 1] = 255 * Math.pow(1 - Math.exp(-g * 1.5), 0.4545);
    px[o + 2] = 255 * Math.pow(1 - Math.exp(-bl * 1.5), 0.4545);
    px[o + 3] = 255;
  }
  g2.putImageData(img, 0, 0);
  return sheet;
}

export default function BrassCounterBellNotification() {
  const reduce = !!useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [index, setIndex] = useState(0);
  const [up, setUp] = useState(true);
  const [said, setSaid] = useState("");
  const live = useRef({ index: 0, up: true, press: 0, pressTo: 0, pressVel: 0, rang: -1e9, paused: false, touched: false, seen: true, kick: () => {}, audio: null as AudioContext | null });
  const timers = useRef<number[]>([]);

  const y = useSpring(0, { stiffness: 210, damping: 15, mass: 1 });
  const lean = useSpring(-1.6, { stiffness: 150, damping: 5, mass: 1 });

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const ding = useCallback(() => {
    const s = live.current;
    if (!SOUND || !s.touched) return;
    try {
      s.audio = s.audio || new AudioContext();
      const t = s.audio.currentTime;
      [2093, 4186, 5587].forEach((f, i) => {
        const osc = s.audio!.createOscillator();
        const gain = s.audio!.createGain();
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.12 / (i + 1), t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6 - i * 0.4);
        osc.connect(gain).connect(s.audio!.destination);
        osc.start(t);
        osc.stop(t + 1.7);
      });
    } catch {
      // no audio available: the bell stays silent
    }
  }, []);

  const lower = useCallback(
    (tell: boolean) => {
      const s = live.current;
      if (!s.up) return;
      s.up = false;
      setUp(false);
      if (reduce) y.jump(TRAVEL);
      else y.set(TRAVEL);
      if (tell) {
        setSaid("Message put away. Ring the bell for the next one.");
        // the button on the card is about to leave the tab order, so hand focus to the bell
        if (rootRef.current?.contains(document.activeElement)) bellRef.current?.focus();
      }
    },
    [reduce, y],
  );

  const raise = useCallback(
    (to: number) => {
      const s = live.current;
      s.index = to;
      s.up = true;
      setIndex(to);
      setUp(true);
      const n = notes[to];
      setSaid(`${n.from}: ${n.title}. ${n.body}`);
      if (reduce) {
        y.jump(0);
        return;
      }
      y.set(0);
      lean.jump(to % 2 ? 3.5 : -5);
      lean.set(to % 2 ? 1.2 : -1.6);
    },
    [lean, reduce, y],
  );

  const ring = useCallback(() => {
    const s = live.current;
    const next = (s.index + 1) % notes.length;
    s.rang = performance.now();
    s.pressTo = 1;
    later(() => {
      s.pressTo = 0;
      s.kick();
    }, 110);
    s.kick();
    ding();
    if (s.up) {
      lower(false);
      later(() => raise(next), reduce ? 0 : 330);
    } else later(() => raise(next), reduce ? 0 : 140);
  }, [ding, later, lower, raise, reduce]);

  // the bell itself: turned once, then redrawn only while it is moving
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const s = live.current;
    const body = turn([{ pts: BASE, metal: 2 }, { pts: DOME, metal: 1 }]);
    const plunger = turn([{ pts: STEM, metal: 1 }]);
    const dpr = Math.min(2.6, (window.devicePixelRatio || 1) * 1.3);
    canvas.width = Math.round(CW * dpr);
    canvas.height = Math.round(CH * dpr);
    let raf = 0;
    let last = 0;

    const paint = (now: number) => {
      raf = 0;
      const dt = Math.min(0.032, (now - (last || now)) / 1000);
      last = now;
      s.pressVel += ((s.pressTo - s.press) * 900 - s.pressVel * 34) * dt;
      s.press += s.pressVel * dt;
      const age = (now - s.rang) / 1000;
      const hum = reduce || age > 1.3 ? 0 : Math.exp(-age * 3.4) * Math.sin(age * 150) * 1.5;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, CW, CH);
      ctx.imageSmoothingQuality = "high";
      // where the bell sits on the polished wood: a soft pool of shade and a faint upside-down bell
      ctx.save();
      ctx.translate(CX + 4, FOOT + 6);
      ctx.scale(1, 0.25);
      const pool = ctx.createRadialGradient(0, 0, 60, 0, 0, 148);
      pool.addColorStop(0, "rgba(8,3,2,0.7)");
      pool.addColorStop(0.6, "rgba(8,3,2,0.34)");
      pool.addColorStop(1, "rgba(8,3,2,0)");
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.arc(0, 0, 148, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, FOOT + 4, CW, CH);
      ctx.clip();
      ctx.globalAlpha = 0.16;
      ctx.translate(0, FOOT * 2 + 34);
      ctx.scale(1, -0.62);
      ctx.drawImage(body, hum * 0.6, FOOT - FOOT / 0.62 + 2, CW, CH);
      ctx.restore();
      ctx.drawImage(plunger, 0, s.press * 8, CW, CH);
      if (Math.abs(hum) > 0.12) {
        // a ringing dome is a blur at its edges
        ctx.globalAlpha = 0.32;
        ctx.drawImage(body, -hum * 1.3, 0, CW, CH);
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(body, hum, 0, CW, CH);
      const busy = Math.abs(s.pressTo - s.press) > 0.002 || Math.abs(s.pressVel) > 0.02 || (!reduce && age < 1.3);
      if (busy && s.seen && !document.hidden) raf = requestAnimationFrame(paint);
      else last = 0;
    };
    s.kick = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    s.kick();
    const io = new IntersectionObserver(([e]) => {
      s.seen = e.isIntersecting;
      if (s.seen) s.kick();
    });
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      s.kick = () => {};
    };
  }, [reduce]);

  // plays by itself until someone takes over
  useEffect(() => {
    const first = notes[0];
    setSaid(`${first.from}: ${first.title}. ${first.body}`);
    if (reduce) return;
    const s = live.current;
    const loop = window.setInterval(() => {
      if (s.paused || s.touched || document.hidden || !s.seen) return;
      ring();
    }, HOLD);
    const pending = timers.current;
    return () => {
      window.clearInterval(loop);
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, [reduce, ring]);

  const note = notes[index];

  return (
    <section
      ref={rootRef}
      onKeyDown={(e) => {
        if (e.key === "Escape" && live.current.up) {
          live.current.touched = true;
          lower(true);
        }
      }}
      onPointerEnter={() => (live.current.paused = true)}
      onPointerLeave={() => (live.current.paused = false)}
      onFocus={() => (live.current.paused = true)}
      onBlur={() => (live.current.paused = false)}
      className="relative h-[590px] overflow-hidden bg-[#2b0f17] sm:h-[700px]"
    >
      <style>{`@keyframes brass-counter-bell-notification-sway { 0%, 100% { transform: rotate(-0.55deg); } 50% { transform: rotate(0.6deg); } } .bcb-sway { animation: brass-counter-bell-notification-sway 3.1s ease-in-out infinite; } @media (prefers-reduced-motion: reduce) { .bcb-sway { animation: none; } }`}</style>
      {/* the wall: painted plaster with the light from the window falling across it */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 62% at 30% 22%, #6c2a36 0%, #4a1a25 42%, #2a0e16 100%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "linear-gradient(112deg, rgba(255,214,170,0) 12%, rgba(255,214,170,0.07) 13%, rgba(255,214,170,0.07) 27%, rgba(255,214,170,0) 28%, rgba(255,214,170,0) 31%, rgba(255,214,170,0.06) 32%, rgba(255,214,170,0.06) 46%, rgba(255,214,170,0) 47%)" }} />

      {/* everything above the slot: the card and the rod it stands on */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[197px] overflow-hidden sm:bottom-[243px]">
        <motion.div className="absolute bottom-[150px] left-1/2 w-[min(312px,calc(100%-40px))] sm:bottom-[190px] sm:w-[372px]" style={{ x: "-50%", y, rotate: lean, transformOrigin: "50% 240%" }}>
          <div className="bcb-sway relative" style={{ transformOrigin: "50% 240%" }}>
          <div aria-hidden="true" className="absolute left-[7%] top-[9%] h-full w-full rounded-[3px] bg-black/50" style={{ filter: "blur(22px)" }} />
          <div aria-hidden="true" className="absolute left-1/2 top-[calc(100%-4px)] h-[460px] w-[9px] -translate-x-1/2 rounded-[2px]" style={{ background: "linear-gradient(90deg, #4f3510 0%, #b98a34 22%, #ffe9a8 40%, #d9a742 55%, #7a5417 82%, #3c2709 100%)", boxShadow: "6px 4px 8px rgba(0,0,0,0.4)" }} />
          <div className={`relative rounded-[3px] bg-[#f3ead6] px-5 pb-4 pt-4 text-[#2a1d14] sm:px-6 sm:pb-5 sm:pt-5 ${up ? "pointer-events-auto" : ""}`} style={{ backgroundImage: "linear-gradient(118deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0) 52%, rgba(94,60,24,0.1) 100%), repeating-linear-gradient(0deg, rgba(120,90,50,0.035) 0 1px, rgba(0,0,0,0) 1px 3px)", boxShadow: "0 1px 0 #d9ccb0, 0 2px 0 #c2b393, 0 3px 0 #a99a79, inset 0 0 0 1px rgba(255,255,255,0.5), inset 0 -18px 24px -18px rgba(96,64,28,0.3)" }}>
            <div className="flex items-baseline justify-between border-b-2 border-[#a3231c] pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a3231c] sm:text-[11px]">
              <span>{note.from}</span>
              <span className="text-[#5a4433]">{note.time}</span>
            </div>
            <p className="mt-3 font-serif text-[27px] font-semibold leading-[1.05] tracking-[-0.01em] sm:mt-4 sm:text-[34px]">{note.title}</p>
            <p className="mt-2 text-[14px] leading-snug text-[#4a382a] sm:text-[15px]">{note.body}</p>
            <div className="mt-4 flex items-center justify-between border-t border-dashed border-[#bdaa86] pt-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5a4433]">
                Card {index + 1} of {notes.length}
              </span>
              <button
                type="button"
                tabIndex={up ? 0 : -1}
                aria-hidden={!up}
                onClick={() => {
                  live.current.touched = true;
                  lower(true);
                }}
                className="flex h-10 items-center gap-2 rounded-full border border-[#2a1d14]/30 bg-[#2a1d14]/[0.04] pl-4 pr-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2a1d14] outline-none transition-colors hover:bg-[#2a1d14]/10 focus-visible:ring-2 focus-visible:ring-[#a3231c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ead6]"
              >
                Put away
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M10 4v10M5.5 10.5 10 15l4.5-4.5" />
                </svg>
              </button>
            </div>
            {/* the brass channel that grips the bottom edge */}
            <div aria-hidden="true" className="absolute inset-x-[22%] -bottom-[9px] h-[15px] rounded-[2px]" style={{ background: "linear-gradient(180deg, #fff0b8 0%, #e0b24c 18%, #b98a2e 52%, #7d5a17 86%, #4b340c 100%)", boxShadow: "0 3px 5px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.6)" }}>
              <span className="absolute left-[9px] top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #fff3c4, #8a6418 70%)", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.5)" }} />
              <span className="absolute right-[9px] top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #fff3c4, #8a6418 70%)", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.5)" }} />
            </div>
          </div>
          </div>
        </motion.div>
      </div>

      {/* the desk: a polished top seen from just above, and its front edge */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[110px] h-[100px] sm:bottom-[130px] sm:h-[126px]" style={{ background: "linear-gradient(180deg, #2a1509 0%, #4a2812 16%, #6b3c1c 58%, #7e4821 100%)" }}>
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: GRAIN, backgroundSize: "900px 100%" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(46% 120% at 34% 100%, rgba(255,214,160,0.2), rgba(255,214,160,0) 70%), linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 22%)" }} />
        {/* the slot the card lives in, trimmed in brass */}
        <div className="absolute left-1/2 top-[7px] h-[12px] w-[min(356px,calc(100%-16px))] -translate-x-1/2 rounded-[6px] sm:w-[424px]" style={{ background: "linear-gradient(180deg, #6a4a14 0%, #e7bd58 30%, #fbe6a4 48%, #b98a2e 74%, #5c3f0f 100%)", boxShadow: "0 2px 3px rgba(0,0,0,0.5)" }}>
          <div className="absolute inset-x-[5px] inset-y-[3px] rounded-[3px] bg-[#0b0503]" style={{ boxShadow: "inset 0 2px 2px rgba(0,0,0,0.9)" }} />
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[110px] sm:h-[130px]" style={{ background: "linear-gradient(180deg, #c58a4a 0px, #8f5526 3px, #5a3115 9px, #3d200d 40%, #1f0f06 100%)" }}>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: GRAIN, backgroundSize: "1500px 100%", backgroundPosition: "140px 0" }} />
      </div>

      {/* the bell */}
      <div className="absolute bottom-[109px] left-1/2 h-[260px] w-[320px] -translate-x-1/2 sm:bottom-[126px] sm:h-[338px] sm:w-[416px]">
        <canvas ref={canvasRef} aria-hidden="true" className="h-full w-full" />
        <button
          ref={bellRef}
          type="button"
          aria-label="Ring the bell for the next message"
          onPointerDown={() => {
            live.current.pressTo = 1;
            live.current.kick();
          }}
          onPointerLeave={() => {
            live.current.pressTo = 0;
            live.current.kick();
          }}
          onClick={() => {
            live.current.touched = true;
            ring();
          }}
          className="absolute left-[14%] top-[12%] h-[70%] w-[72%] cursor-pointer rounded-[50%_50%_18%_18%] outline-none focus-visible:ring-2 focus-visible:ring-[#ffe2a0] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
        />
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
      <p className="absolute bottom-5 left-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#e8c9a0]/80 sm:bottom-8 sm:left-8">
        <span className="text-white">Desk bell</span>
        <span className="block">{up ? "Press the plunger for the next card" : "Press the plunger to ring"}</span>
      </p>
    </section>
  );
}
