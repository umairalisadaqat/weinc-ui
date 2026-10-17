import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// Each planet is one repeating job. `every` is its cycle in days, `first` is any date it fell due.
// Stones: "moonstone", "carnelian", "malachite" or "lapis". Three or four entries fit the plate.
const cycles = [
  { name: "Team review", every: 7, first: "2026-01-02", stone: "moonstone", dot: "#e6eaf2" },
  { name: "Sprint demo", every: 14, first: "2026-01-08", stone: "carnelian", dot: "#e2622c" },
  { name: "Payroll run", every: 28, first: "2026-01-23", stone: "malachite", dot: "#35a873" },
  { name: "Board report", every: 91, first: "2026-01-19", stone: "lapis", dot: "#4a72dc" },
];
const TURN = 7; // days that pass for one full turn of your hand
const CRUISE = 1.15; // days per second while the orrery runs by itself
const JEWEL = "#ff3b3b"; // the stone in the pointer that lights when something falls due

const SIZE = 600, C = 300;
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MLEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DAY = 864e5;
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const fromIso = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const mod = (a: number, n: number) => ((a % n) + n) % n;
const orbit = (i: number) => 100 + i * 34;
const ballSize = (i: number) => [12.5, 15.5, 18.5, 15][i] ?? 14;

export default function BrassOrrerySchedule() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<HTMLDivElement>(null);
  const [today] = useState(() => midnight(new Date()));
  // Days from today until each job is next due.
  const [due0] = useState(() => cycles.map((c) => mod(Math.round((fromIso(c.first).getTime() - today.getTime()) / DAY), c.every)));
  const [day, setDay] = useState(0);
  const dayRef = useRef(0);
  const api = useRef<{ go: (d: number) => void; aim: () => number } | null>(null);

  useEffect(() => {
    const cv = canvas.current, el = pad.current;
    if (!cv || !el) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = SIZE * dpr; cv.height = SIZE * dpr;
    const TAU = Math.PI * 2, LIGHT = -2.2;
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const ramp = (stops: number[][]) => (v: number, a = 1) => {
      const x = clamp(v) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(x)), f = x - i;
      const p = stops[i], q = stops[i + 1];
      return `rgba(${(p[0] + (q[0] - p[0]) * f) | 0},${(p[1] + (q[1] - p[1]) * f) | 0},${(p[2] + (q[2] - p[2]) * f) | 0},${a})`;
    };
    const brass = ramp([[30, 20, 6], [96, 66, 18], [176, 132, 48], [232, 196, 108], [255, 247, 218]]);
    const silver = ramp([[46, 50, 58], [112, 116, 124], [172, 175, 180], [214, 216, 218], [248, 248, 246]]);
    const BANDS: [number, number][] = [[0, 1], [0.03, 0.96], [0.085, 0.6], [0.16, 0.3], [0.23, 0.1], [0.31, 0.24], [0.4, 0.52], [0.455, 0.76], [0.5, 0.94], [0.54, 0.72], [0.6, 0.44], [0.69, 0.14], [0.76, 0.3], [0.84, 0.42], [0.92, 0.72], [0.97, 0.95], [1, 1]];
    // Turned metal: bright and dark wedges that meet at the centre and never rotate with the part.
    const sheen = (x: CanvasRenderingContext2D, cx: number, cy: number, ang: number, lo: number, hi: number, col: (v: number, a?: number) => string) => {
      if (typeof x.createConicGradient !== "function") return col((lo + hi) / 2);
      const g = x.createConicGradient(ang, cx, cy);
      for (const [p, v] of BANDS) g.addColorStop(p, col(lo + (hi - lo) * v));
      return g;
    };
    const layer = (w = SIZE, h = SIZE) => { const c = document.createElement("canvas"); c.width = w * dpr; c.height = h * dpr; const x = c.getContext("2d")!; x.scale(dpr, dpr); return { c, x }; };
    const disc = (x: CanvasRenderingContext2D, cx: number, cy: number, r: number) => { x.beginPath(); x.arc(cx, cy, r, 0, TAU); };
    const band = (x: CanvasRenderingContext2D, r0: number, r1: number) => { x.beginPath(); x.arc(C, C, r1, 0, TAU); x.arc(C, C, r0, 0, TAU, true); };
    // Letters set along a circle, each advanced by its own width. `flip` reads along the bottom of the circle.
    const arcText = (x: CanvasRenderingContext2D, text: string, r: number, mid: number, track: number, flip = false) => {
      const ws = [...text].map((ch) => x.measureText(ch).width + track), total = ws.reduce((a, b) => a + b, 0);
      let at = -total / 2;
      [...text].forEach((ch, i) => {
        const a = mid + ((at + ws[i] / 2) / r) * (flip ? -1 : 1); at += ws[i];
        x.save(); x.translate(C, C); x.rotate(a); x.translate(0, flip ? r : -r); x.fillText(ch, 0, 0); x.restore();
      });
    };
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // ---- The plate: brass rim, lacquered field, inlaid orbits. Drawn once.
    const base = layer();
    {
      const x = base.x;
      disc(x, C, C, 290); x.fillStyle = "#120c03"; x.fill();
      band(x, 264, 289); x.fillStyle = sheen(x, C, C, LIGHT, 0.08, 1, brass); x.fill();
      band(x, 268.5, 284); x.fillStyle = sheen(x, C, C, LIGHT + 0.5, 0.14, 0.9, brass); x.fill();
      // coin edge
      for (let k = 0; k < 240; k++) { const a = (k / 240) * TAU, sn = Math.sin(a), cs = Math.cos(a); x.beginPath(); x.moveTo(C + sn * 285.2, C - cs * 285.2); x.lineTo(C + sn * 289, C - cs * 289); x.lineWidth = 1.1; x.strokeStyle = "rgba(20,12,0,0.5)"; x.stroke(); }
      // fine circular brushing on the rim
      for (let r = 269.5; r < 284; r += 0.7) { const v = rand(); x.beginPath(); x.arc(C, C, r, 0, TAU); x.lineWidth = 0.5; x.strokeStyle = v > 0.5 ? `rgba(255,244,200,${(v - 0.5) * 0.22})` : `rgba(40,24,0,${(0.5 - v) * 0.3})`; x.stroke(); }
      for (const [r, c] of [[268.5, "rgba(30,18,0,0.8)"], [284, "rgba(30,18,0,0.8)"], [269.5, "rgba(255,246,210,0.35)"], [285, "rgba(255,246,210,0.55)"], [289.4, "rgba(0,0,0,0.9)"]] as [number, string][]) { x.beginPath(); x.arc(C, C, r, 0, TAU); x.lineWidth = 0.9; x.strokeStyle = c; x.stroke(); }
      // engraved legend on the rim
      x.font = "700 8.5px Georgia, 'Times New Roman', serif"; x.textAlign = "center"; x.textBaseline = "middle";
      const legend = `ONE TURN OF THE HAND  ·  ${TURN} DAYS`;
      x.fillStyle = "rgba(255,244,205,0.55)"; x.save(); x.translate(0.5, 0.7); arcText(x, legend, 276.5, 0, 1.6, true); x.restore();
      x.fillStyle = "rgba(34,20,2,0.92)"; arcText(x, legend, 276.5, 0, 1.6, true);
      // lacquered field
      const lac = x.createRadialGradient(C - 70, C - 90, 10, C, C, 240);
      lac.addColorStop(0, "#1f3157"); lac.addColorStop(0.5, "#131f3b"); lac.addColorStop(1, "#090f1f");
      disc(x, C, C, 226); x.fillStyle = lac; x.fill();
      x.save(); disc(x, C, C, 226); x.clip();
      const gloss = x.createRadialGradient(C - 110, C - 150, 0, C - 110, C - 150, 230);
      gloss.addColorStop(0, "rgba(170,200,255,0.2)"); gloss.addColorStop(0.5, "rgba(170,200,255,0.05)"); gloss.addColorStop(1, "rgba(170,200,255,0)");
      x.fillStyle = gloss; x.fillRect(0, 0, SIZE, SIZE);
      // the raised ring throws a shadow onto the near edge of the field
      const well = x.createRadialGradient(C + 7, C + 10, 196, C + 7, C + 10, 232);
      well.addColorStop(0, "rgba(0,0,0,0)"); well.addColorStop(1, "rgba(0,0,0,0.72)");
      x.fillStyle = well; x.fillRect(0, 0, SIZE, SIZE);
      x.restore();
      // inlaid orbits with one pin for each day (or each week on the long cycles)
      cycles.forEach((c, i) => {
        const r = orbit(i), n = c.every <= 28 ? c.every : Math.round(c.every / 7);
        x.beginPath(); x.arc(C, C, r, 0, TAU); x.lineWidth = 1.1; x.strokeStyle = "rgba(4,7,16,0.8)"; x.stroke();
        x.beginPath(); x.arc(C, C, r - 0.6, 0, TAU); x.lineWidth = 0.8; x.strokeStyle = "rgba(214,172,86,0.62)"; x.stroke();
        for (let k = 0; k < n; k++) {
          const a = (k / n) * TAU, px = C + Math.sin(a) * r, py = C - Math.cos(a) * r, pr = k === 0 ? 3 : 1.7;
          disc(x, px + 0.5, py + 0.8, pr + 0.4); x.fillStyle = "rgba(0,0,0,0.6)"; x.fill();
          const g = x.createRadialGradient(px - pr * 0.4, py - pr * 0.5, 0, px, py, pr);
          g.addColorStop(0, "#fff3c4"); g.addColorStop(0.5, "#d2a548"); g.addColorStop(1, "#6a4810");
          disc(x, px, py, pr); x.fillStyle = g; x.fill();
        }
      });
      // the due line, inlaid from the hub to the ring
      x.lineCap = "round";
      x.beginPath(); x.moveTo(C + 0.6, C - 222); x.lineTo(C + 0.6, C - 62); x.lineWidth = 2.2; x.strokeStyle = "rgba(0,0,0,0.6)"; x.stroke();
      const inlay = x.createLinearGradient(0, C - 222, 0, C - 62);
      inlay.addColorStop(0, "#f6dc8e"); inlay.addColorStop(1, "#a97c26");
      x.beginPath(); x.moveTo(C, C - 222); x.lineTo(C, C - 62); x.lineWidth = 1.5; x.strokeStyle = inlay; x.stroke();
      // step between the field and the calendar ring
      band(x, 222, 227); x.fillStyle = sheen(x, C, C, LIGHT + 0.9, 0.25, 1, brass); x.fill();
      x.beginPath(); x.arc(C, C, 222, 0, TAU); x.lineWidth = 1; x.strokeStyle = "rgba(0,0,0,0.75)"; x.stroke();
    }

    // ---- The calendar ring: silvered, engraved with the year. Drawn once, turned every frame.
    const cal = layer();
    {
      const x = cal.x;
            x.save(); band(x, 227, 264); x.clip();
      for (let k = 0; k < 900; k++) { // radial graining
        const a = rand() * TAU, r0 = 227 + rand() * 30, len = 3 + rand() * 9, v = rand();
        x.beginPath(); x.moveTo(C + Math.sin(a) * r0, C - Math.cos(a) * r0); x.lineTo(C + Math.sin(a) * (r0 + len), C - Math.cos(a) * (r0 + len));
        x.lineWidth = 0.5; x.strokeStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.3})` : `rgba(40,44,52,${(0.5 - v) * 0.16})`; x.stroke();
      }
      x.restore();
      x.font = "700 12.5px Georgia, 'Times New Roman', serif"; x.textAlign = "center"; x.textBaseline = "middle";
      let start = 0;
      const ink = "rgba(22,18,12,0.94)", lite = "rgba(255,255,255,0.75)";
      const tick = (a: number, r0: number, r1: number, w: number) => {
        const s = Math.sin(a), co = -Math.cos(a);
        x.lineCap = "butt"; x.lineWidth = w;
        x.strokeStyle = lite; x.beginPath(); x.moveTo(C + s * r0 + 0.5, C + co * r0 + 0.6); x.lineTo(C + s * r1 + 0.5, C + co * r1 + 0.6); x.stroke();
        x.strokeStyle = ink; x.beginPath(); x.moveTo(C + s * r0, C + co * r0); x.lineTo(C + s * r1, C + co * r1); x.stroke();
      };
      MLEN.forEach((len, m) => {
        for (let d = 0; d < len; d++) {
          const a = ((start + d) / 365) * TAU;
          if (d === 0) tick(a, 231, 264, 1.3); else tick(a, d % 10 === 0 ? 252 : d % 5 === 0 ? 255 : 258, 264, d % 10 === 0 ? 0.9 : 0.6);
        }
        const mid = ((start + len / 2) / 365) * TAU;
        x.fillStyle = lite; x.save(); x.translate(0.5, 0.7); arcText(x, MON[m].toUpperCase(), 241, mid, 3); x.restore();
        x.fillStyle = ink; arcText(x, MON[m].toUpperCase(), 241, mid, 3);
        start += len;
      });
    }

    // ---- Stone balls, drawn once each.
    const stones = cycles.map((c, i) => {
      const r = ballSize(i), half = Math.ceil(r + 3), L = layer(half * 2, half * 2), x = L.x;
      x.translate(half, half);
      const pal: Record<string, string[]> = {
        moonstone: ["#ffffff", "#dfe5f0", "#9aa6bd", "#4a556d"], carnelian: ["#ffc59a", "#e2622c", "#9a2a0c", "#3f0e02"],
        malachite: ["#a6f0c8", "#2f9e6b", "#0f5c3a", "#04271a"], lapis: ["#9db6ff", "#3558c4", "#152a78", "#070f33"],
      };
      const p = pal[c.stone] ?? pal.lapis;
      const g = x.createRadialGradient(-r * 0.38, -r * 0.44, r * 0.05, -r * 0.1, -r * 0.12, r * 1.18);
      g.addColorStop(0, p[0]); g.addColorStop(0.28, p[1]); g.addColorStop(0.72, p[2]); g.addColorStop(1, p[3]);
      disc(x, 0, 0, r); x.fillStyle = g; x.fill();
      x.save(); disc(x, 0, 0, r); x.clip();
      if (c.stone === "malachite") for (let k = 1; k < 9; k++) { x.beginPath(); x.arc(r * 0.5, r * 0.7, k * r * 0.24, 0, TAU); x.lineWidth = r * 0.09; x.strokeStyle = k % 2 ? "rgba(3,40,24,0.38)" : "rgba(170,255,210,0.2)"; x.stroke(); }
      if (c.stone === "lapis") for (let k = 0; k < 16; k++) { const a = rand() * TAU, d = Math.sqrt(rand()) * r * 0.9; disc(x, Math.cos(a) * d, Math.sin(a) * d, 0.35 + rand() * 0.6); x.fillStyle = `rgba(246,214,130,${0.5 + rand() * 0.5})`; x.fill(); }
      if (c.stone === "carnelian") for (let k = 0; k < 3; k++) { x.beginPath(); x.ellipse(-r * 0.2, r * (k * 0.5 - 0.3), r * 1.4, r * 0.12, 0.5, 0, TAU); x.fillStyle = "rgba(255,214,170,0.16)"; x.fill(); }
      if (c.stone === "moonstone") { const m = x.createRadialGradient(r * 0.25, r * 0.3, 0, r * 0.25, r * 0.3, r * 0.8); m.addColorStop(0, "rgba(140,190,255,0.5)"); m.addColorStop(1, "rgba(140,190,255,0)"); x.fillStyle = m; x.fillRect(-r, -r, r * 2, r * 2); }
      const dark = x.createRadialGradient(-r * 0.3, -r * 0.36, r * 0.5, -r * 0.12, -r * 0.14, r * 1.12);
      dark.addColorStop(0, "rgba(0,0,0,0)"); dark.addColorStop(1, "rgba(0,0,8,0.62)");
      x.fillStyle = dark; x.fillRect(-r, -r, r * 2, r * 2);
      const bounce = x.createRadialGradient(r * 0.62, r * 0.7, 0, r * 0.62, r * 0.7, r * 0.6);
      bounce.addColorStop(0, "rgba(160,190,255,0.3)"); bounce.addColorStop(1, "rgba(160,190,255,0)");
      x.fillStyle = bounce; x.fillRect(-r, -r, r * 2, r * 2);
      x.restore();
      x.save(); x.translate(-r * 0.4, -r * 0.46); x.rotate(-0.7); x.shadowColor = "rgba(255,255,255,0.9)"; x.shadowBlur = 3 * dpr;
      x.beginPath(); x.ellipse(0, 0, r * 0.24, r * 0.13, 0, 0, TAU); x.fillStyle = "rgba(255,255,255,0.95)"; x.fill(); x.restore();
      disc(x, 0, 0, r - 0.3); x.lineWidth = 0.6; x.strokeStyle = "rgba(0,0,0,0.5)"; x.stroke();
      // the brass pin that holds the ball on its arm
      const pr = Math.max(1.7, r * 0.15);
      disc(x, 0.3, 0.5, pr + 0.7); x.fillStyle = "rgba(0,0,0,0.55)"; x.fill();
      const pg = x.createRadialGradient(-pr * 0.4, -pr * 0.5, 0, 0, 0, pr);
      pg.addColorStop(0, "#fff6cf"); pg.addColorStop(0.55, "#cfa046"); pg.addColorStop(1, "#5e3f0c");
      disc(x, 0, 0, pr); x.fillStyle = pg; x.fill();
      return { c: L.c, half, r };
    });

    const s = { day: 0, v: 0, target: null as number | null, drag: false, jewel: 0 };
    const angleOf = (i: number, d: number) => ((d - due0[i]) / cycles[i].every) * TAU;
    const base0 = Math.round((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / DAY);

    const shade = (fn: () => void, dx: number, dy: number, blur: number, a: number) => {
      ctx.save(); ctx.shadowColor = `rgba(0,0,6,${a})`; ctx.shadowBlur = blur * dpr; ctx.shadowOffsetX = (dx + 2000) * dpr; ctx.shadowOffsetY = dy * dpr;
      ctx.translate(-2000, 0); ctx.fillStyle = "#000"; ctx.strokeStyle = "#000"; fn(); ctx.restore();
    };
    const gearPath = (cx: number, cy: number, rp: number, teeth: number, rot: number, spokes: number) => {
      const st = TAU / teeth, r0 = rp - 1.7, r1 = rp + 1.9;
      ctx.beginPath();
      for (let k = 0; k < teeth; k++) {
        const a = rot + k * st;
        for (const [da, rr] of [[-0.29, r0], [-0.13, r1], [0.13, r1], [0.29, r0]] as [number, number][]) ctx.lineTo(cx + Math.cos(a + da * st) * rr, cy + Math.sin(a + da * st) * rr);
      }
      ctx.closePath();
      const w = (TAU / spokes) * 0.36;
      for (let k = 0; k < spokes; k++) {
        const a = rot + (k / spokes) * TAU;
        ctx.moveTo(cx + Math.cos(a - w) * rp * 0.8, cy + Math.sin(a - w) * rp * 0.8);
        ctx.arc(cx, cy, rp * 0.8, a - w, a + w); ctx.arc(cx, cy, rp * 0.4, a + w * 0.8, a - w * 0.8, true); ctx.closePath();
      }
    };
    const gear = (cx: number, cy: number, rp: number, teeth: number, rot: number, spokes: number, tone: number) => {
      shade(() => { gearPath(cx, cy, rp, teeth, rot, spokes); ctx.fill("evenodd"); }, 2.4, 3.6, 3.5, 0.75);
      gearPath(cx + 0.7, cy + 1.1, rp, teeth, rot, spokes); ctx.fillStyle = "#3a2706"; ctx.fill("evenodd");
      gearPath(cx, cy, rp, teeth, rot, spokes); ctx.fillStyle = sheen(ctx, cx, cy, LIGHT + tone, 0.16, 0.94, brass); ctx.fill("evenodd");
      ctx.lineWidth = 0.5; ctx.strokeStyle = "rgba(30,18,0,0.7)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, rp * 0.87, 0, TAU); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(30,18,0,0.55)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, rp * 0.87 + 0.9, 0, TAU); ctx.strokeStyle = "rgba(255,246,206,0.4)"; ctx.stroke();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base.c, 0, 0);
      // the year ring turns so that the date sits under the pointer
      const ring = -(mod(base0 + s.day, 365) / 365) * TAU;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      band(ctx, 227, 264); ctx.fillStyle = sheen(ctx, C, C, LIGHT + 0.2, 0.42, 1, silver); ctx.fill();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(C * dpr, C * dpr); ctx.rotate(ring); ctx.drawImage(cal.c, -C * dpr, -C * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const lip = ctx.createRadialGradient(C, C, 227, C, C, 264);
      lip.addColorStop(0, "rgba(0,0,0,0.42)"); lip.addColorStop(0.12, "rgba(0,0,0,0)"); lip.addColorStop(0.8, "rgba(0,0,0,0)"); lip.addColorStop(1, "rgba(0,0,0,0.5)");
      band(ctx, 227, 264); ctx.fillStyle = lip; ctx.fill();

      // going train under the hub
      const a0 = angleOf(0, s.day) - Math.PI / 2;
      gear(C, C, 52, 48, a0, 6, 0.3);
      for (const phi of [2.5, 5.7]) gear(C + Math.cos(phi) * 68.25, C + Math.sin(phi) * 68.25, 16.25, 15, -(48 / 15) * (a0 - phi) + phi + Math.PI + Math.PI / 15, 5, 1.4);

      // shadows first, so every arm and ball sits above every shadow
      const pos = cycles.map((_, i) => { const a = angleOf(i, s.day); return { a, x: C + Math.sin(a) * orbit(i), y: C - Math.cos(a) * orbit(i), h: 12 + (cycles.length - 1 - i) * 7 }; });
      pos.forEach((p, i) => {
        shade(() => { ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(C, C); ctx.lineTo(p.x, p.y); ctx.stroke(); }, p.h * 0.4, p.h * 0.62, 3 + p.h * 0.12, 0.42);
        const hh = p.h + stones[i].r;
        shade(() => { disc(ctx, p.x, p.y, stones[i].r * 0.96); ctx.fill(); }, hh * 0.4, hh * 0.62, 4 + hh * 0.14, 0.62);
      });
      for (let i = cycles.length - 1; i >= 0; i--) {
        const p = pos[i], sx = Math.sin(p.a), sy = -Math.cos(p.a), nx = -sy, ny = sx;
        const facing = nx * -0.56 + ny * -0.83; // which long edge of the bar looks at the lamp
        const w0 = 3.8, w1 = 2.5, r0 = 10, r1 = orbit(i);
        const quad = (o: number, k: number) => { ctx.beginPath(); ctx.moveTo(C + sx * r0 + nx * (w0 * k + o), C + sy * r0 + ny * (w0 * k + o)); ctx.lineTo(C + sx * r1 + nx * (w1 * k + o), C + sy * r1 + ny * (w1 * k + o)); ctx.lineTo(C + sx * r1 - nx * (w1 * k - o), C + sy * r1 - ny * (w1 * k - o)); ctx.lineTo(C + sx * r0 - nx * (w0 * k - o), C + sy * r0 - ny * (w0 * k - o)); ctx.closePath(); };
        quad(0, 1.25); ctx.fillStyle = "rgba(26,16,2,0.95)"; ctx.fill();
        quad(0, 1); ctx.fillStyle = brass(0.5 + 0.12 * Math.abs(facing)); ctx.fill();
        quad(facing > 0 ? 1.5 : -1.5, 0.42); ctx.fillStyle = brass(0.97, 0.95); ctx.fill();
        quad(facing > 0 ? -1.8 : 1.8, 0.38); ctx.fillStyle = brass(0.2, 0.9); ctx.fill();
        // collar where the arm takes the ball
        disc(ctx, p.x, p.y, stones[i].r * 0.55 + 2); ctx.fillStyle = brass(0.3); ctx.fill();
        const st = stones[i];
        ctx.drawImage(st.c, (p.x - st.half), (p.y - st.half), st.half * 2, st.half * 2);
      }

      // stacked collars and the polished sun
      for (const [r, off, lo] of [[35, 0, 0.12], [29, 0.8, 0.2], [23.5, 1.7, 0.1]] as [number, number, number][]) {
        shade(() => { disc(ctx, C, C, r); ctx.fill(); }, 2.2, 3.4, 4, 0.7);
        disc(ctx, C, C, r); ctx.fillStyle = sheen(ctx, C, C, LIGHT + off, lo, 1, brass); ctx.fill();
        ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(24,14,0,0.8)"; ctx.stroke();
        ctx.beginPath(); ctx.arc(C, C, r - 1.4, 0, TAU); ctx.strokeStyle = "rgba(255,247,214,0.5)"; ctx.stroke();
      }
      shade(() => { disc(ctx, C, C, 19); ctx.fill(); }, 3.4, 5.2, 4.5, 0.85);
      const sun = ctx.createRadialGradient(C - 7, C - 8.4, 0.5, C - 1.8, C - 2.4, 23);
      sun.addColorStop(0, "#fffbe6"); sun.addColorStop(0.16, "#ffe289"); sun.addColorStop(0.45, "#c9962c"); sun.addColorStop(0.78, "#5d3f08"); sun.addColorStop(1, "#231501");
      disc(ctx, C, C, 20); ctx.fillStyle = sun; ctx.fill();
      ctx.save(); disc(ctx, C, C, 20); ctx.clip();
      const under = ctx.createRadialGradient(C + 11, C + 13, 0, C + 11, C + 13, 13);
      under.addColorStop(0, "rgba(255,206,120,0.55)"); under.addColorStop(1, "rgba(255,206,120,0)");
      ctx.fillStyle = under; ctx.fillRect(C - 24, C - 24, 48, 48);
      // each stone shows as a small coloured glint in the polished ball
      pos.forEach((p, i) => { disc(ctx, C + Math.sin(p.a) * 15.4, C - Math.cos(p.a) * 15.4, 1.8 + i * 0.3); ctx.fillStyle = cycles[i].dot; ctx.globalAlpha = 0.42; ctx.fill(); });
      ctx.restore();
      ctx.save(); ctx.translate(C - 7.6, C - 8.8); ctx.rotate(-0.7); ctx.shadowColor = "#fff"; ctx.shadowBlur = 5 * dpr;
      ctx.beginPath(); ctx.ellipse(0, 0, 5.4, 3, 0, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.96)"; ctx.fill(); ctx.restore();

      // blued steel pointer, its brass foot and the jewel
      const tip = () => { ctx.beginPath(); ctx.moveTo(C - 4.2, C - 278); ctx.lineTo(C - 0.9, C - 229); ctx.lineTo(C + 0.9, C - 229); ctx.lineTo(C + 4.2, C - 278); ctx.closePath(); };
      shade(() => { tip(); ctx.fill(); }, 2, 3, 2.5, 0.6);
      const blue = ctx.createLinearGradient(C - 4, 0, C + 4, 0);
      blue.addColorStop(0, "#5e86e6"); blue.addColorStop(0.42, "#22366e"); blue.addColorStop(0.58, "#0f1a3c"); blue.addColorStop(1, "#2c4489");
      tip(); ctx.fillStyle = blue; ctx.fill(); ctx.lineWidth = 0.5; ctx.strokeStyle = "rgba(0,0,10,0.8)"; ctx.stroke();
      const foot = () => { ctx.beginPath(); ctx.moveTo(C - 11, C - 293); ctx.lineTo(C + 11, C - 293); ctx.lineTo(C + 11, C - 277); ctx.quadraticCurveTo(C, C - 268, C - 11, C - 277); ctx.closePath(); };
      shade(() => { foot(); ctx.fill(); }, 1.6, 2.4, 2.5, 0.7);
      const fg = ctx.createLinearGradient(C - 11, C - 293, C + 11, C - 270);
      fg.addColorStop(0, "#fff0b8"); fg.addColorStop(0.45, "#c2932f"); fg.addColorStop(1, "#6d4c10");
      foot(); ctx.fillStyle = fg; ctx.fill(); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(24,14,0,0.85)"; ctx.stroke();
      const jy = C - 282.5, on = s.jewel;
      disc(ctx, C, jy, 5.6); ctx.fillStyle = "#1a0f02"; ctx.fill();
      ctx.save(); ctx.shadowColor = JEWEL; ctx.shadowBlur = 18 * on * dpr;
      const ruby = ctx.createRadialGradient(C - 1.5, jy - 1.8, 0, C, jy, 4.6);
      ruby.addColorStop(0, on > 0.5 ? "#ffd0c8" : "#d06a6a"); ruby.addColorStop(0.45, JEWEL); ruby.addColorStop(1, "#3c0006");
      disc(ctx, C, jy, 4.5); ctx.globalAlpha = 0.5 + 0.5 * on; ctx.fillStyle = ruby; ctx.fill(); ctx.restore();
      disc(ctx, C - 1.4, jy - 1.6, 1); ctx.fillStyle = `rgba(255,255,255,${0.45 + 0.5 * on})`; ctx.fill();
    };

    let raf = 0, last = 0, seen = true, cruise = CRUISE !== 0, lastAngle = 0; // the cruise ends for good at the first touch
    const publish = () => { const d = Math.round(s.day); if (d !== dayRef.current) { dayRef.current = d; setDay(d); } };
    const dueNow = () => cycles.some((c, i) => Math.abs(mod(s.day - due0[i] + c.every / 2, c.every) - c.every / 2) < 0.5);
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (!s.drag) {
        if (s.target !== null) {
          s.v += (64 * (s.target - s.day) - 13 * s.v) * dt; s.day += s.v * dt;
          if (Math.abs(s.target - s.day) < 0.002 && Math.abs(s.v) < 0.02) { s.day = s.target; s.v = 0; }
        } else if (cruise) {
          s.v += (CRUISE - s.v) * Math.min(1, dt * 1.4); s.day += s.v * dt;
        } else {
          // free running after a throw: the flywheel slows, then the nearest day catches it
          s.v *= Math.exp(-1.5 * dt); s.day += s.v * dt;
          if (Math.abs(s.v) < 1.4) s.target = Math.round(s.day + s.v * 0.3);
        }
      }
      s.jewel += ((dueNow() ? 1 : 0) - s.jewel) * Math.min(1, dt * 9);
      publish(); draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } };
    const settle = () => { if (s.target !== null) s.day = s.target; s.day = Math.round(s.day); s.v = 0; s.target = null; s.jewel = dueNow() ? 1 : 0; publish(); draw(); };
    api.current = { go: (d) => { cruise = false; s.target = d; if (reduce) settle(); else wake(); }, aim: () => s.target ?? Math.round(s.day) };
    if (reduce) settle(); else wake();

    const angleAt = (e: PointerEvent) => { const b = el.getBoundingClientRect(); return Math.atan2(e.clientX - (b.left + b.width / 2), -(e.clientY - (b.top + b.height / 2))); };
    const onDown = (e: PointerEvent) => { cruise = false; s.drag = true; s.target = null; s.v = 0; lastAngle = angleAt(e); el.setPointerCapture(e.pointerId); wake(); };
    let lastMove = 0;
    const onMove = (e: PointerEvent) => {
      if (!s.drag) return;
      const now = performance.now(), a = angleAt(e); let d = a - lastAngle; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
      lastAngle = a;
      const dd = (d / TAU) * TURN, dt = Math.max(0.008, (now - lastMove) / 1000); lastMove = now;
      s.day += dd; s.v = Math.max(-45, Math.min(45, s.v * 0.6 + (dd / dt) * 0.4));
      if (reduce) { publish(); draw(); }
    };
    const onUp = () => { if (!s.drag) return; s.drag = false; if (performance.now() - lastMove > 120) s.v = 0; if (reduce) settle(); };
    el.addEventListener("pointerdown", onDown); el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp); el.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      el.removeEventListener("pointerdown", onDown); el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp); el.removeEventListener("pointercancel", onUp);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, [today, due0]);

  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + day);
  const dateText = `${DOW[date.getDay()]} ${date.getDate()} ${MON[date.getMonth()]} ${date.getFullYear()}`;
  const wait = (i: number) => mod(due0[i] - day, cycles[i].every);
  const go = (d: number) => api.current?.go(d);
  const onKey = (e: ReactKeyboardEvent) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : e.key === "PageUp" ? 7 : e.key === "PageDown" ? -7 : 0;
    if (e.key === "Home") { e.preventDefault(); go(0); return; }
    if (!step) return;
    e.preventDefault(); go((api.current?.aim() ?? dayRef.current) + step); // steps add up even while the arms are still travelling
  };

  return (
    <div className="flex min-h-[700px] w-full flex-col items-center justify-center bg-[#090d18] bg-[radial-gradient(110%_75%_at_50%_34%,#1a2440_0%,#090d18_64%)] px-4 py-10 sm:min-h-[800px]">
      <div
        ref={pad}
        role="slider"
        tabIndex={0}
        aria-label="Schedule date, in days from today"
        aria-valuemin={-3650}
        aria-valuemax={3650}
        aria-valuenow={day}
        aria-valuetext={`${dateText}. ${cycles.map((c, i) => `${c.name} ${wait(i) === 0 ? "due" : `in ${wait(i)} d`}`).join(", ")}`}
        onKeyDown={onKey}
        className="relative aspect-square w-full max-w-[580px] cursor-grab touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#e8c56e] focus-visible:ring-offset-4 focus-visible:ring-offset-[#090d18] active:cursor-grabbing"
      >
        <div aria-hidden="true" className="absolute inset-[3%] rounded-full shadow-[0_46px_70px_-18px_rgba(0,0,0,0.9),0_10px_18px_rgba(0,0,0,0.7)]" />
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      </div>
      <p aria-live="polite" className="mt-7 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-slate-400">
        <span className="text-slate-100">{dateText}</span>
        <span className="mx-2 text-slate-600">/</span>
        {day === 0 ? "Today" : `${Math.abs(day)} ${Math.abs(day) === 1 ? "day" : "days"} ${day > 0 ? "ahead" : "back"}`}
      </p>
      <ul className="mt-4 grid w-full max-w-[640px] grid-cols-2 gap-2 sm:grid-cols-4">
        {cycles.map((c, i) => (
          <li key={c.name}>
            <button
              type="button"
              onClick={() => go(day + (wait(i) === 0 ? c.every : wait(i)))}
              aria-label={`${c.name}, every ${c.every} days, ${wait(i) === 0 ? "due on this date" : `due in ${wait(i)} days`}. Turn to its next date.`}
              className={`flex min-h-[48px] w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#e8c56e] motion-reduce:transition-none ${wait(i) === 0 ? "border-[#e8c56e]/70 bg-[#e8c56e]/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}
            >
              <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full shadow-[inset_-2px_-2px_3px_rgba(0,0,0,0.45)]" style={{ backgroundColor: c.dot }} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium leading-4 text-slate-100">{c.name}</span>
                <span className={`block font-mono text-[10px] uppercase leading-4 tracking-[0.14em] ${wait(i) === 0 ? "text-[#f1d588]" : "text-slate-400"}`}>{wait(i) === 0 ? "Due" : `In ${wait(i)} d`}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
