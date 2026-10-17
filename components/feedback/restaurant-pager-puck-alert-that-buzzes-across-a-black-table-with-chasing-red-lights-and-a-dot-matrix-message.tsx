import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** What the pager is buzzed with, in order. `lcd` scrolls across the little display (capitals and digits only). */
const pages = [
  { lcd: "TABLE 9 IS READY", title: "Your table is ready", detail: "Table nine, by the window. Bring the pager with you." },
  { lcd: "DRINKS AT THE BAR", title: "Your drinks are poured", detail: "Two spritzes and a lemonade are waiting at the bar." },
  { lcd: "TAXI IS OUTSIDE", title: "Your taxi has arrived", detail: "A silver saloon is at the side door on Marlow Street." },
];
const NUMBER = "27"; // printed on the pager
const RING_FOR = 6400; // milliseconds it buzzes before the demo answers it by itself
const SOUND = false; // set to true for a low buzz while it rings (it only ever plays after the visitor has pressed the pager)

type Pt = [number, number];
type Mode = "ringing" | "answered" | "waiting";
const CW = 560;
const CH = 400;
const CX = 280;
const FOOT = 262; // screen y of the centre of the underside
const TILT = (40 * Math.PI) / 180;
const SIN = Math.sin(TILT);
const COS = Math.cos(TILT);
const R = 118;
const TOP_H = 35.4;
const LED_H = 16;
const LEDS = 16;
const LOWER: Pt[] = [[0, 0], [107, 0], [107, 0], [116, 2], [118, 6], [118, 10], [118, 10]];
const BAND: Pt[] = [[118, 10], [118, 10], [119.6, 12.5], [119.6, 19.5], [118, 22], [118, 22]];
const UPPER: Pt[] = [[118, 22], [118, 22], [118, 25], [115.5, 29], [110, 31.6], [104, 32.6], [96, 33.6], [86, 34.8], [77, 35.8], [77, 35.8], [77, 35.4], [0, 35.4]];

const FONT: Record<string, string> = {
  A: "0E11111F111111", B: "1E11111E11111E", C: "0E11101010110E", D: "1E11111111111E", E: "1F10101E10101F", F: "1F10101E101010", G: "0E11101711110F", H: "1111111F111111", I: "0E04040404040E",
  J: "0702020202120C", K: "11121418141211", L: "1010101010101F", M: "111B1515111111", N: "11191513111111", O: "0E11111111110E", P: "1E11111E101010", Q: "0E11111115120D", R: "1E11111E141211",
  S: "0F10100E01011E", T: "1F040404040404", U: "1111111111110E", V: "11111111110A04", W: "1111111515150A", X: "11110A040A1111", Y: "11110A04040404", Z: "1F01020408101F",
  "0": "0E11131519110E", "1": "040C040404040E", "2": "0E11010204081F", "3": "1F02040201110E", "4": "02060A121F0202", "5": "1F101E0101110E", "6": "0608101E11110E", "7": "1F010204080808", "8": "0E11110E11110E", "9": "0E11110F01020C",
};
const COLS = 37;

/** Turn a message into columns of seven dots. */
function columns(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    const g = FONT[ch];
    for (let c = 0; c < 5; c++) {
      let col = 0;
      if (g) for (let r = 0; r < 7; r++) if (parseInt(g.slice(r * 2, r * 2 + 2), 16) & (16 >> c)) col |= 1 << r;
      out.push(col);
    }
    out.push(0);
  }
  return out;
}

// fine mineral speckle for the table, as a repeating picture
const STONE = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.9  0 0 0 -2.2 1.05'/></filter><rect width='420' height='420' filter='url(#n)'/></svg>")}")`;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const band = (v: number, a: number, b: number, s: number) => smooth(a - s, a + s, v) * (1 - smooth(b - s, b + s, v));

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

/** What the glossy plastic mirrors: a dark bar, a long window behind the table, two strip lights low at the sides. */
function bar(x: number, y: number, z: number): number {
  const el = Math.asin(clamp(y, -1, 1));
  const az = Math.atan2(x, z);
  let v = 0.012 + 0.02 * Math.max(0, el);
  // the window behind the table: this is the bright shape that lies across the lid
  const round = az < 0 ? az + Math.PI * 2 : az;
  v += band(round, 2.5, 3.02, 0.02) * band(el, 0.47, 0.9, 0.02) * (1 - 0.92 * band(round, 2.75, 2.775, 0.008)) * (1 - 0.92 * band(el, 0.69, 0.71, 0.008)) * 4.2;
  v += band(round, 3.5, 3.62, 0.02) * band(el, 0.5, 0.86, 0.03) * 3;
  v += band(az, -1.5, -0.5, 0.1) * band(el, 0.05, 0.5, 0.09) * 2.6;
  v += band(az, 0.75, 1.25, 0.08) * band(el, 0.1, 0.42, 0.08) * 1.5;
  v += band(az, -0.25, 0.3, 0.2) * band(el, 0.2, 0.7, 0.2) * 0.25;
  if (el < 0) v = v * (1 - smooth(0, -0.1, el)) + 0.012;
  return v;
}

/** Spin each outline round the centre, keep the nearest surface for each pixel, then light the pixels once. */
function turn(parts: { pts: Pt[]; kind: 1 | 2 | 3 }[]): HTMLCanvasElement {
  const S = 3;
  const W = CW * S;
  const H = CH * S;
  const depth = new Float32Array(W * H).fill(-1e9);
  const nx = new Float32Array(W * H);
  const ny = new Float32Array(W * H);
  const nz = new Float32Array(W * H);
  const kind = new Uint8Array(W * H);
  for (const part of parts) {
    const p = soften(part.pts, 3);
    const tn: Pt[] = p.map((_, i) => {
      const a = p[Math.max(0, i - 1)];
      const c = p[Math.min(p.length - 1, i + 1)];
      const l = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1;
      return [(c[1] - a[1]) / l, -(c[0] - a[0]) / l];
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
          if (nh * SIN + nr * sn * COS > 0) {
            const z = r * sn;
            const px = Math.round((CX + r * c) * S);
            const py = Math.round((FOOT - (h * COS - z * SIN)) * S);
            if (px >= 0 && px < W && py >= 0 && py < H) {
              const d = z * COS + h * SIN;
              const at = py * W + px;
              if (d > depth[at]) {
                depth[at] = d;
                nx[at] = nr * c;
                ny[at] = nh;
                nz[at] = nr * sn;
                kind[at] = part.kind;
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
    const a = nx[i];
    const b = ny[i];
    const c = nz[i];
    const nv = b * SIN + c * COS;
    const e = bar(2 * nv * a, 2 * nv * b - SIN, 2 * nv * c - COS);
    const key = Math.max(0, a * -0.5 + b * 0.62 + c * 0.6);
    const edge = Math.pow(1 - clamp(nv, 0, 1), 4);
    let r: number;
    let g: number;
    let bl: number;
    if (kind[i] === 1) {
      const f = 0.05 + 0.55 * edge;
      r = g = bl = 0.004 + e * f + 0.006 * key;
      bl *= 1.06;
    } else if (kind[i] === 2) {
      // smoked red plastic with the lights behind it switched off
      const f = 0.05 + 0.5 * edge;
      r = 0.085 + 0.11 * key + e * f;
      g = 0.004 + 0.006 * key + e * f;
      bl = 0.008 + 0.01 * key + e * f;
    } else {
      r = g = bl = 0.006 + 0.016 * key + e * 0.02;
    }
    const o = i * 4;
    px[o] = 255 * Math.pow(1 - Math.exp(-r * 1.6), 0.4545);
    px[o + 1] = 255 * Math.pow(1 - Math.exp(-g * 1.6), 0.4545);
    px[o + 2] = 255 * Math.pow(1 - Math.exp(-bl * 1.6), 0.4545);
    px[o + 3] = 255;
  }
  g2.putImageData(img, 0, 0);
  return sheet;
}

export default function RestaurantPagerPuckAlert() {
  const reduce = !!useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("ringing");
  const [page, setPage] = useState(0);
  const live = useRef({ mode: "ringing" as Mode, page: 0, since: 0, touched: false, seen: true, audio: null as AudioContext | null, hum: null as OscillatorNode | null, kick: () => {} });
  const timers = useRef<number[]>([]);

  const buzz = useCallback((on: boolean) => {
    const s = live.current;
    if (!SOUND || !s.touched) return;
    try {
      if (on && !s.hum) {
        s.audio = s.audio || new AudioContext();
        const gain = s.audio.createGain();
        gain.gain.value = 0.05;
        s.hum = s.audio.createOscillator();
        s.hum.type = "sawtooth";
        s.hum.frequency.value = 168;
        s.hum.connect(gain).connect(s.audio.destination);
        s.hum.start();
      } else if (!on && s.hum) {
        s.hum.stop();
        s.hum = null;
      }
    } catch {
      // no audio available: the pager stays silent
    }
  }, []);

  const go = useCallback(
    (to: Mode, nextPage?: number) => {
      const s = live.current;
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      s.mode = to;
      s.since = performance.now();
      setMode(to);
      if (nextPage !== undefined) {
        s.page = nextPage;
        setPage(nextPage);
      }
      buzz(to === "ringing");
      s.kick();
      if (reduce) return;
      // the story the pager tells when left alone: it rings, is answered, waits, and is paged again
      if (to === "ringing" && !s.touched) timers.current.push(window.setTimeout(() => go("answered"), RING_FOR));
      if (to === "answered") timers.current.push(window.setTimeout(() => go("waiting"), 1700));
      if (to === "waiting") timers.current.push(window.setTimeout(() => go("ringing", (s.page + 1) % pages.length), 2600));
    },
    [buzz, reduce],
  );

  const press = () => {
    const s = live.current;
    s.touched = true;
    if (s.mode === "ringing") go("answered");
    else go("ringing", (s.page + 1) % pages.length);
  };

  useEffect(() => {
    const s = live.current;
    go("ringing", 0);
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      s.hum?.stop();
      s.hum = null;
    };
  }, [go]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const s = live.current;
    const body = turn([{ pts: LOWER, kind: 3 }, { pts: BAND, kind: 2 }, { pts: UPPER, kind: 1 }]);
    const glow = new Float32Array(LEDS);
    const texts = pages.map((p) => columns(`${p.lcd}   `));
    const words = { answered: columns("THANKS"), waiting: columns("WAIT") };
    let raf = 0;
    let last = 0;
    let scale = 0;
    let shake = 0;
    let turnBy = 0;

    const size = () => {
      const next = clamp((canvas.clientWidth / CW) * Math.min(2, window.devicePixelRatio || 1), 1, 3);
      if (Math.abs(next - scale) < 0.01) return;
      scale = next;
      canvas.width = Math.round(CW * scale);
      canvas.height = Math.round(CH * scale);
    };

    const paint = (now: number) => {
      raf = 0;
      size();
      const dt = Math.min(0.04, (now - (last || now)) / 1000);
      last = now;
      const t = now / 1000;
      const age = (now - s.since) / 1000;
      const ringing = s.mode === "ringing";
      // it buzzes in bursts, and every burst walks it a little further round
      const burst = ringing && !reduce && age % 1.5 < 0.9;
      shake += ((burst ? 1 : 0) - shake) * Math.min(1, dt * 18);
      if (burst) turnBy += dt;
      const ox = shake * (Math.sin(t * 92) * 1.15 + Math.sin(t * 57) * 0.5) + Math.sin(turnBy * 0.9) * 7;
      const oy = shake * Math.cos(t * 113) * 0.6 + Math.cos(turnBy * 0.7) * 2 - 2;
      const phi = Math.sin(turnBy * 0.8) * 0.16;

      for (let i = 0; i < LEDS; i++) {
        let want = 0;
        const at = i / LEDS;
        if (ringing) {
          if (reduce) want = 0.8;
          else {
            const head = (t * 1.25) % 1;
            const d1 = (head - at + 1) % 1;
            const d2 = (head + 0.5 - at + 1) % 1;
            want = 0.1 + Math.max(Math.exp(-d1 * 9), Math.exp(-d2 * 9));
          }
        } else if (s.mode === "waiting") {
          const head = reduce ? 0.25 : (t * 0.3) % 1;
          want = 0.03 + 0.5 * Math.exp(-((head - at + 1) % 1) * 7);
        }
        glow[i] += (want - glow[i]) * (reduce ? 1 : Math.min(1, dt * (want > glow[i] ? 40 : 9)));
      }
      let total = 0;
      for (let i = 0; i < LEDS; i++) total += glow[i];
      total /= LEDS;

      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, CW, CH);
      ctx.imageSmoothingQuality = "high";
      const cx = CX + ox;
      const fy = FOOT + oy;

      // its shadow on the stone
      ctx.save();
      ctx.translate(cx + 8, fy + 5);
      ctx.scale(1, SIN);
      const shade = ctx.createRadialGradient(0, 0, R * 0.7, 0, 0, R * 1.42);
      shade.addColorStop(0, "rgba(0,0,0,0.95)");
      shade.addColorStop(0.55, "rgba(0,0,0,0.5)");
      shade.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // red light thrown across the table by each lamp, and its streak in the polish
      ctx.globalCompositeOperation = "lighter";
      const lamp = (i: number) => {
        const a = (i / LEDS) * Math.PI * 2 + phi;
        return { c: Math.cos(a), s: Math.sin(a) };
      };
      for (let i = 0; i < LEDS; i++) {
        const v = glow[i];
        if (v < 0.02) continue;
        const { c, s: sn } = lamp(i);
        ctx.save();
        ctx.translate(cx + c * (R + 30), fy + sn * (R + 30) * SIN);
        ctx.scale(1, SIN);
        const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, 104);
        pool.addColorStop(0, `rgba(255,44,30,${(0.3 * v).toFixed(3)})`);
        pool.addColorStop(0.4, `rgba(220,20,24,${(0.12 * v).toFixed(3)})`);
        pool.addColorStop(1, "rgba(160,0,10,0)");
        ctx.fillStyle = pool;
        ctx.beginPath();
        ctx.arc(0, 0, 104, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (sn > 0.05) {
          const lx = cx + c * R;
          const ly = fy + sn * R * SIN + LED_H * COS * 0.9;
          ctx.save();
          ctx.translate(lx, ly + 3);
          ctx.scale(1, 3.4);
          const streak = ctx.createRadialGradient(0, 0, 0, 0, 0, 13);
          streak.addColorStop(0, `rgba(255,90,64,${(0.42 * v * sn).toFixed(3)})`);
          streak.addColorStop(0.5, `rgba(255,40,30,${(0.12 * v * sn).toFixed(3)})`);
          streak.addColorStop(1, "rgba(255,40,30,0)");
          ctx.fillStyle = streak;
          ctx.beginPath();
          ctx.arc(0, 0, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      ctx.drawImage(body, ox, oy, CW, CH);

      // the lamps themselves, behind the red band
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < LEDS; i++) {
        const v = glow[i];
        if (v < 0.02) continue;
        const { c, s: sn } = lamp(i);
        const front = sn > -0.08;
        const lx = cx + c * (R + 1);
        const ly = fy - LED_H * COS + sn * R * SIN - (front ? 0 : 7);
        const k = front ? v : v * 0.4;
        const halo = ctx.createRadialGradient(lx, ly, 0, lx, ly, 34);
        halo.addColorStop(0, `rgba(255,70,50,${(0.85 * k).toFixed(3)})`);
        halo.addColorStop(0.3, `rgba(255,24,24,${(0.4 * k).toFixed(3)})`);
        halo.addColorStop(1, "rgba(200,0,10,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(lx, ly, 34, 0, Math.PI * 2);
        ctx.fill();
        if (front) {
          const core = ctx.createRadialGradient(lx, ly, 0, lx, ly, 7);
          core.addColorStop(0, `rgba(255,236,220,${Math.min(1, v * 1.2).toFixed(3)})`);
          core.addColorStop(1, "rgba(255,90,60,0)");
          ctx.fillStyle = core;
          ctx.beginPath();
          ctx.ellipse(lx, ly, 8, 4.6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // the top of the pager, drawn flat and laid back at the same angle as the body
      ctx.save();
      ctx.translate(cx, fy - TOP_H * COS + 0.5);
      ctx.scale(1, SIN);
      ctx.rotate(phi);
      const well = ctx.createLinearGradient(0, -76, 0, 76);
      well.addColorStop(0, "#08080a");
      well.addColorStop(1, "#1d1d21");
      ctx.fillStyle = well;
      ctx.beginPath();
      ctx.arc(0, 0, 76, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = "rgba(0,0,0,0.9)";
      ctx.beginPath();
      ctx.arc(0, 0, 76.5, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.32)";
      ctx.beginPath();
      ctx.arc(0, 0, 76.5, Math.PI * 0.12, Math.PI * 0.88);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,60,44,${(0.34 * total).toFixed(3)})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 114, 0, Math.PI * 2);
      ctx.stroke();
      // lettering round the rim
      ctx.fillStyle = "rgba(235,235,230,0.62)";
      ctx.font = "600 6.6px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const rim = "PLEASE BRING ME BACK TO THE HOST STAND";
      for (let i = 0; i < rim.length; i++) {
        const a = Math.PI / 2 + (rim.length / 2 - i - 0.5) * 0.079;
        ctx.save();
        ctx.translate(Math.cos(a) * 67.5, Math.sin(a) * 67.5);
        ctx.rotate(a - Math.PI / 2);
        ctx.fillText(rim[i], 0, 0);
        ctx.restore();
      }
      // the display
      const dw = COLS * 3 + 7;
      ctx.fillStyle = "#030202";
      ctx.beginPath();
      ctx.rect(-dw / 2, -45, dw, 30);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(-dw / 2 + 0.5, -44.5, dw - 1, 29);
      const cols = ringing ? texts[s.page] : words[s.mode as "answered" | "waiting"];
      const shift = ringing ? (reduce ? 0 : Math.floor(Math.max(0, age - 3.2) * 13) % cols.length) : -Math.floor((COLS - cols.length) / 2);
      for (let c = 0; c < COLS; c++) {
        const at = ringing ? (c + shift) % cols.length : c + shift;
        const col = at >= 0 && at < cols.length ? cols[at] : 0;
        for (let r = 0; r < 7; r++) {
          const on = (col >> r) & 1;
          ctx.fillStyle = on ? "#ffc247" : "rgba(120,74,14,0.26)";
          if (on) {
            ctx.shadowColor = "rgba(255,150,30,0.9)";
            ctx.shadowBlur = 4 * scale;
          }
          ctx.fillRect(-dw / 2 + 4 + c * 3, -42 + r * 3.55, 2.1, 2.6);
          ctx.shadowBlur = 0;
        }
      }
      // the number
      ctx.fillStyle = "#f4f3ee";
      ctx.font = "800 50px ui-sans-serif, system-ui, -apple-system, Helvetica, Arial, sans-serif";
      ctx.fillText(NUMBER, 0, 19);
      ctx.fillStyle = "rgba(244,243,238,0.6)";
      ctx.font = "700 7.5px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText("G U E S T", 0, 48);
      ctx.restore();

      if (!reduce && s.seen && !document.hidden) raf = requestAnimationFrame(paint);
      else last = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    s.kick = kick;
    kick();
    const io = new IntersectionObserver(([e]) => {
      s.seen = e.isIntersecting;
      if (s.seen) kick();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(kick);
    ro.observe(canvas);
    document.addEventListener("visibilitychange", kick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", kick);
      s.kick = () => {};
    };
  }, [reduce]);

  const now = pages[page];
  const line = mode === "ringing" ? now.title : mode === "answered" ? "Answered. Thank you" : "Waiting for the next page";
  const hint = mode === "ringing" ? "Press the pager to answer it" : "Press the pager to buzz it again";

  return (
    <section
      onKeyDown={(e) => {
        if (e.key === "Escape" && live.current.mode === "ringing") {
          live.current.touched = true;
          go("answered");
        }
      }}
      className="relative h-[600px] overflow-hidden bg-[#0b090a] sm:h-[700px]"
    >
      {/* a black stone table under one warm lamp */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(58% 46% at 50% 44%, #2a2224 0%, #171213 44%, #0a0809 100%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.13] mix-blend-screen" style={{ backgroundImage: STONE, backgroundSize: "420px 420px" }} />

      <div className="absolute left-1/2 top-[40px] h-[400px] w-[560px] -translate-x-1/2 sm:top-[-28px] sm:h-[680px] sm:w-[952px]">
        <canvas ref={canvasRef} aria-hidden="true" className="h-full w-full" />
        <button
          type="button"
          onClick={press}
          aria-label={mode === "ringing" ? `Pager ${NUMBER} is buzzing: ${now.title}. Answer it` : `Pager ${NUMBER} is quiet. Buzz it with the next message`}
          className="absolute left-[28%] top-[41%] h-[41%] w-[44%] cursor-pointer rounded-[50%] outline-none focus-visible:ring-2 focus-visible:ring-[#ffc247] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b090a]"
        />
      </div>

      <div className="absolute inset-x-5 bottom-6 sm:inset-x-8 sm:bottom-8">
        <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#c9b8b0]">
          <span className="text-white">
            Pager {NUMBER} / {line}
          </span>
          <span className="block">{mode === "ringing" ? now.detail : hint}</span>
          {mode === "ringing" && <span className="block text-[#ff8a70]">{hint}, or press Escape</span>}
        </p>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {mode === "ringing" ? `Pager ${NUMBER}: ${now.title}. ${now.detail}` : mode === "answered" ? "Pager answered." : ""}
      </p>
    </section>
  );
}
