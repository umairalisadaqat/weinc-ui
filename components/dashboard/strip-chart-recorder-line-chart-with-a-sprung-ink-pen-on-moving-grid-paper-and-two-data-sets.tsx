import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here. The figures are invented demo data.
const UNIT = "bookings";
const FULL = 100; // the value at the top grid line
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const sets = [
  { key: "A", label: "This year", ink: "#c3202b", values: [34, 41, 38, 52, 61, 74, 88, 93, 70, 58, 49, 66] },
  { key: "B", label: "Last year", ink: "#1c4fb0", values: [22, 27, 35, 33, 46, 52, 63, 71, 66, 44, 37, 48] },
];
const FEED = 15; // design pixels of paper a second when idling
const LAMP = "#ffb84a"; // the digits in the reading window

const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 380, H: 590, u: 0.82, bed: { x0: 14, x1: 366, y0: 14, y1: 360 }, pen: 308, mw: 24.4, read: { x: 22, y: 384, w: 146, h: 78 }, keys: [{ x: 186, y: 384, w: 82, h: 50 }, { x: 278, y: 384, w: 82, h: 50 }], knob: { x: 318, y: 524, r: 25 }, plate: { x: 26, y: 524 } }
    : { W: 900, H: 500, u: 1, bed: { x0: 30, x1: 664, y0: 40, y1: 460 }, pen: 594, mw: 46, read: { x: 696, y: 52, w: 174, h: 96 }, keys: [{ x: 696, y: 196, w: 82, h: 54 }, { x: 788, y: 196, w: 82, h: 54 }], knob: { x: 783, y: 372, r: 36 }, plate: { x: 783, y: 444 } };

export default function StripChartRecorderLineChart() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [set, setSet] = useState(0);
  const [touched, setTouched] = useState(false);
  const live = useRef({ set: 0, touched: false });
  const api = useRef<{ poke: () => void; swap: () => void; knock: (f: number) => void } | null>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 760));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const L = layoutFor(narrow), u = L.u, B = L.bed, N = months.length, yearW = L.mw * N;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const margin = 21 * u; // sprocket strip top and bottom
    const yTop = B.y0 + margin + 26 * u, yBot = B.y1 - margin - 34 * u;
    const vy = (v: number) => yBot - (v / FULL) * (yBot - yTop);
    const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
    let k = 1;

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    const chrome = (c: CanvasRenderingContext2D, x0: number, x1: number) => {
      const g = c.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, "#4a4f57"); g.addColorStop(0.25, "#fbfcfd"); g.addColorStop(0.45, "#aeb3bb"); g.addColorStop(0.75, "#5a5f67"); g.addColorStop(1, "#8d939b");
      return g;
    };
    const steel = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      const g = c.createLinearGradient(x - r, y - r, x + r, y + r);
      g.addColorStop(0, "#f4f5f7"); g.addColorStop(0.35, "#9da1a8"); g.addColorStop(0.55, "#dcdee2"); g.addColorStop(0.8, "#5c6067"); g.addColorStop(1, "#abafb6");
      return g;
    };
    const engrave = (c: CanvasRenderingContext2D, text: string, x: number, y: number, size = 8.5, alpha = 0.62, align: CanvasTextAlign = "center") => {
      c.font = `600 ${size}px ${MONO}`; c.textAlign = align; c.textBaseline = "middle";
      c.fillStyle = "rgba(0,0,0,0.75)"; c.fillText(text, x, y + 0.8);
      c.fillStyle = `rgba(226,230,236,${alpha})`; c.fillText(text, x, y);
    };

    // Smooth curve through the twelve monthly values; the year repeats, so the paper can run for ever.
    const valueAt = (si: number, p: number) => {
      const v = sets[si].values, m = p / L.mw - 0.5, i = Math.floor(m), t = m - i;
      const at = (j: number) => v[(((i + j) % N) + N) % N];
      const a = at(-1), b = at(0), c = at(1), d = at(2);
      return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - 3 * c + d - a) * t * t * t);
    };

    const base = document.createElement("canvas"), grain = document.createElement("canvas");
    const build = () => {
      base.width = cv.width; base.height = cv.height;
      const b = base.getContext("2d");
      if (!b) return;
      b.setTransform(k, 0, 0, k, 0, 0);
      // The case: hammered enamel over pressed steel.
      const coat = b.createLinearGradient(0, 0, 0, L.H);
      coat.addColorStop(0, "#3c4654"); coat.addColorStop(0.5, "#2b3340"); coat.addColorStop(1, "#1f2530");
      rr(b, 0, 0, L.W, L.H, 16); b.fillStyle = coat; b.fill();
      b.save(); rr(b, 0, 0, L.W, L.H, 16); b.clip();
      let seed = 5;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < L.W * L.H * 0.022; i++) {
        const x = rand() * L.W, y = rand() * L.H, r0 = 0.7 + rand() * 1.9, lit = rand() > 0.5;
        b.beginPath(); b.arc(x, y, r0, 0, Math.PI * 2); b.fillStyle = lit ? `rgba(190,205,225,${0.03 + rand() * 0.06})` : `rgba(0,0,0,${0.05 + rand() * 0.12})`; b.fill();
        if (lit) { b.beginPath(); b.arc(x + 0.5, y + 0.6, r0, 0, Math.PI * 2); b.fillStyle = "rgba(0,0,0,0.07)"; b.fill(); }
      }
      const wash = b.createLinearGradient(0, 0, L.W, L.H * 0.7);
      wash.addColorStop(0, "rgba(255,255,255,0.1)"); wash.addColorStop(0.35, "rgba(255,255,255,0)"); wash.addColorStop(0.7, "rgba(255,255,255,0.03)"); wash.addColorStop(1, "rgba(0,0,0,0.2)");
      b.fillStyle = wash; b.fillRect(0, 0, L.W, L.H);
      b.restore();
      const rim = b.createLinearGradient(0, 0, 0, L.H);
      rim.addColorStop(0, "rgba(255,255,255,0.5)"); rim.addColorStop(0.06, "rgba(255,255,255,0.1)"); rim.addColorStop(0.92, "rgba(0,0,0,0.35)"); rim.addColorStop(1, "rgba(0,0,0,0.8)");
      rr(b, 0.7, 0.7, L.W - 1.4, L.H - 1.4, 15.4); b.lineWidth = 1.4; b.strokeStyle = rim; b.stroke();

      // The bed the paper runs through, with a polished trim round it.
      rr(b, B.x0 - 7, B.y0 - 7, B.x1 - B.x0 + 14, B.y1 - B.y0 + 14, 9); b.fillStyle = steel(b, (B.x0 + B.x1) / 2, (B.y0 + B.y1) / 2, 240); b.fill();
      rr(b, B.x0 - 7, B.y0 - 7, B.x1 - B.x0 + 14, B.y1 - B.y0 + 14, 9); b.lineWidth = 0.8; b.strokeStyle = "rgba(0,0,0,0.6)"; b.stroke();
      rr(b, B.x0 - 2.5, B.y0 - 2.5, B.x1 - B.x0 + 5, B.y1 - B.y0 + 5, 5); b.fillStyle = "#07080a"; b.fill();

      // Screws.
      const sx = narrow ? [12, L.W - 12] : [14, L.W - 14];
      for (const x of sx) for (const y of [narrow ? L.H - 12 : 14, L.H - 14]) {
        if (narrow && y === L.H - 14) continue;
        b.beginPath(); b.arc(x, y + 0.8, 5.4, 0, Math.PI * 2); b.fillStyle = "rgba(0,0,0,0.7)"; b.fill();
        b.beginPath(); b.arc(x, y, 4.8, 0, Math.PI * 2); b.fillStyle = steel(b, x, y, 4.8); b.fill();
        b.save(); b.translate(x, y); b.rotate(x * 0.3 + y); b.fillStyle = "#101114"; b.fillRect(-3.6, -0.6, 7.2, 1.2); b.restore();
      }

      // Reading window recess.
      const R = L.read;
      b.save(); b.shadowColor = "rgba(255,255,255,0.14)"; b.shadowOffsetY = 1.2 * k; rr(b, R.x, R.y, R.w, R.h, 8); b.fillStyle = "#050607"; b.fill(); b.restore();
      rr(b, R.x + 3, R.y + 3, R.w - 6, R.h - 6, 5.5); b.lineWidth = 1; b.strokeStyle = "rgba(255,255,255,0.1)"; b.stroke();
      engrave(b, `${UNIT.toUpperCase()}  /  DEMO DATA`, R.x + R.w / 2, R.y + R.h + 14, 7.5 * Math.max(0.94, u), 0.5);

      // Key wells and legends.
      L.keys.forEach((q, i) => {
        b.save(); b.shadowColor = "rgba(255,255,255,0.13)"; b.shadowOffsetY = 1.2 * k; rr(b, q.x - 3, q.y - 3, q.w + 6, q.h + 6, 9); b.fillStyle = "#06070a"; b.fill(); b.restore();
        engrave(b, sets[i].label.toUpperCase(), q.x + q.w / 2, q.y + q.h + 16, 8, 0.6);
      });
      // Feed knob scale and the maker's plate.
      const K = L.knob;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2, long = i % 6 === 0;
        b.beginPath(); b.moveTo(K.x + Math.sin(a) * (K.r + 7), K.y - Math.cos(a) * (K.r + 7)); b.lineTo(K.x + Math.sin(a) * (K.r + (long ? 14 : 11)), K.y - Math.cos(a) * (K.r + (long ? 14 : 11)));
        b.lineWidth = long ? 1.4 : 0.9; b.strokeStyle = long ? "rgba(226,230,236,0.8)" : "rgba(226,230,236,0.32)"; b.stroke();
      }
      if (narrow) { engrave(b, "CHART RECORDER", L.plate.x, L.plate.y - 8, 9, 0.7, "left"); engrave(b, "ONE PEN  /  TWO SPEED", L.plate.x, L.plate.y + 8, 7.5, 0.42, "left"); engrave(b, "FEED", K.x, K.y + K.r + 26, 7.5, 0.5); }
      else { engrave(b, "PAPER FEED", K.x, K.y - K.r - 26, 8, 0.5); engrave(b, "CHART RECORDER  /  ONE PEN", L.plate.x, L.plate.y, 7.5, 0.4); }

      // A tile of paper fibre that scrolls with the chart.
      grain.width = 256; grain.height = 256;
      const g = grain.getContext("2d");
      if (!g) return;
      g.clearRect(0, 0, 256, 256);
      for (let i = 0; i < 2600; i++) {
        const x = rand() * 256, y = rand() * 256, len = 2 + rand() * 7, a = rand() * Math.PI;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.lineWidth = 0.6;
        g.strokeStyle = rand() > 0.5 ? `rgba(120,96,50,${0.03 + rand() * 0.05})` : `rgba(255,255,255,${0.05 + rand() * 0.1})`; g.stroke();
      }
    };

    const fit = () => {
      const w = cv.clientWidth || L.W;
      k = (w / L.W) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(L.W * k); cv.height = Math.round(L.H * k);
      build();
    };

    // P is how much paper has gone under the pen. Everything inked is stored in paper coordinates.
    type Dot = { p: number; v: number; s: number };
    const lead = L.pen - B.x0 + 30;
    const s = {
      P: yearW * 3 + L.mw * 0.9, to: 0, y: 0, yv: 0, quake: 0, trace: [] as Dot[], dots: [] as Dot[], swaps: [{ p: -1e9, s: live.current.set }],
      key: sets.map((_, i) => (i === live.current.set ? 1 : 0)), light: 0, lightTo: 0, lit: 0,
    };
    const setAt = (p: number) => { let v = s.swaps[0].s; for (const q of s.swaps) if (q.p <= p) v = q.s; return v; };
    const stamp = (from: number, to: number) => {
      // Month dots the pen has just passed.
      const a = Math.ceil(from / L.mw - 0.5), z = Math.floor(to / L.mw - 0.5);
      for (let m = a; m <= z; m++) { const p = (m + 0.5) * L.mw; if (p > from - 1e-6) s.dots.push({ p, v: sets[setAt(p)].values[((m % N) + N) % N], s: setAt(p) }); }
    };
    const prefill = () => {
      s.trace = []; s.dots = [];
      const from = s.P - lead;
      for (let p = from; p <= s.P; p += 1.5) s.trace.push({ p, v: valueAt(setAt(p), p), s: setAt(p) });
      stamp(from, s.P);
      s.y = valueAt(live.current.set, s.P); s.yv = 0;
    };
    prefill();

    const paper = () => {
      const X = (p: number) => L.pen - (s.P - p), h = B.y1 - B.y0;
      ctx.save(); rr(ctx, B.x0, B.y0, B.x1 - B.x0, h, 3); ctx.clip();
      const sheet = ctx.createLinearGradient(0, B.y0, 0, B.y1);
      sheet.addColorStop(0, "#efe7d2"); sheet.addColorStop(0.5, "#f8f2e2"); sheet.addColorStop(1, "#ebe2cb");
      ctx.fillStyle = sheet; ctx.fillRect(B.x0, B.y0, B.x1 - B.x0, h);
      const off = ((s.P % 256) + 256) % 256;
      for (let x = B.x0 - off; x < B.x1; x += 256) for (let y = B.y0; y < B.y1; y += 256) ctx.drawImage(grain, x, y, 256, 256);

      // Printed grid in machine green: value lines stand still, time lines travel with the paper.
      const GREEN = "62,140,110";
      for (let v = 0; v <= FULL; v += 5) {
        const y = vy(v), major = v % 25 === 0;
        ctx.beginPath(); ctx.moveTo(B.x0, y); ctx.lineTo(B.x1, y); ctx.lineWidth = major ? 0.9 : 0.5; ctx.strokeStyle = `rgba(${GREEN},${major ? 0.62 : 0.3})`; ctx.stroke();
      }
      const step = L.mw / 4, first = Math.floor((s.P - (L.pen - B.x0)) / step) - 1, lastI = Math.ceil((s.P + (B.x1 - L.pen)) / step) + 1;
      ctx.textBaseline = "middle";
      for (let i = first; i <= lastI; i++) {
        const x = X(i * step), month = i % 4 === 0, m = (((i / 4) % N) + N) % N, year = month && m === 0;
        ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x, yBot); ctx.lineWidth = year ? 1.5 : month ? 0.9 : 0.5; ctx.strokeStyle = `rgba(${GREEN},${year ? 0.85 : month ? 0.6 : 0.3})`; ctx.stroke();
        if (month) {
          ctx.font = `700 ${Math.max(8, 9.5 * u)}px ${MONO}`; ctx.textAlign = "center"; ctx.fillStyle = `rgba(${GREEN},0.95)`;
          ctx.fillText(narrow ? months[m][0] : months[m].toUpperCase(), x + L.mw / 2, yBot + 15 * u);
        }
        if (year) {
          ctx.font = `700 ${Math.max(7.5, 8.5 * u)}px ${MONO}`; ctx.textAlign = "left"; ctx.fillStyle = `rgba(${GREEN},0.9)`;
          for (const v of [0, 25, 50, 75, 100]) ctx.fillText(String(v), x + 4, vy(v) - 6 * u);
          // The run is rubber-stamped at the start of each year.
          const si = setAt(i * step + 1), ink = sets[si].ink;
          ctx.save(); ctx.translate(x + 9 * u, yTop - 15 * u); ctx.rotate(-0.035);
          ctx.font = `800 ${Math.max(8.5, 10 * u)}px ${MONO}`; ctx.fillStyle = ink; ctx.globalAlpha = 0.82;
          const text = `${sets[si].key}  ${sets[si].label.toUpperCase()}`, tw = ctx.measureText(text).width;
          ctx.fillText(text, 6 * u, 0); ctx.lineWidth = 1.2; ctx.strokeStyle = ink; rr(ctx, 0, -8.5 * u, tw + 12 * u, 17 * u, 2.5); ctx.stroke(); ctx.restore();
        }
      }
      // Sprocket holes along both edges.
      const pitch = L.mw / 2, hole = 3.1 * u;
      for (let i = Math.floor((s.P - (L.pen - B.x0)) / pitch) - 1; i <= Math.ceil((s.P + (B.x1 - L.pen)) / pitch); i++) for (const y of [B.y0 + margin * 0.5, B.y1 - margin * 0.5]) {
        const x = X((i + 0.5) * pitch);
        ctx.beginPath(); ctx.arc(x, y, hole, 0, Math.PI * 2); ctx.fillStyle = "#0b0c0e"; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, hole, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, hole + 0.4, 1.15 * Math.PI, 1.85 * Math.PI); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(90,70,30,0.35)"; ctx.stroke();
      }
      for (const y of [B.y0 + margin, B.y1 - margin]) { ctx.beginPath(); ctx.moveTo(B.x0, y); ctx.lineTo(B.x1, y); ctx.lineWidth = 0.6; ctx.strokeStyle = `rgba(${GREEN},0.5)`; ctx.stroke(); }

      // The ink line. Runs of one colour are stroked together.
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      let i0 = 0;
      while (i0 < s.trace.length - 1) {
        let i1 = i0 + 1;
        while (i1 < s.trace.length - 1 && s.trace[i1].s === s.trace[i0].s) i1++;
        ctx.beginPath(); ctx.moveTo(X(s.trace[i0].p), vy(s.trace[i0].v));
        for (let j = i0 + 1; j <= i1; j++) ctx.lineTo(X(s.trace[j].p), vy(s.trace[j].v));
        const ink = sets[s.trace[i0].s].ink;
        ctx.lineWidth = 3.6 * u; ctx.strokeStyle = ink; ctx.globalAlpha = 0.13; ctx.stroke(); // ink soaking into the fibres
        ctx.lineWidth = 1.9 * u; ctx.globalAlpha = 0.95; ctx.stroke(); ctx.globalAlpha = 1;
        i0 = i1;
      }
      // Month marks and the figure pencilled beside each one.
      for (const d of s.dots) {
        const x = X(d.p), y = vy(d.v);
        if (x < B.x0 - 30) continue;
        ctx.beginPath(); ctx.arc(x, y, 3.3 * u, 0, Math.PI * 2); ctx.fillStyle = "#f8f2e2"; ctx.fill(); ctx.lineWidth = 1.7 * u; ctx.strokeStyle = sets[d.s].ink; ctx.stroke();
        ctx.font = `700 ${Math.max(9.5, 11.5 * u)}px ${MONO}`; ctx.textAlign = "center"; ctx.fillStyle = "#2a2622"; ctx.fillText(String(d.v), x, y - 13 * u);
      }

      // Where the sheet rolls away over the take-up drum, and the shade under the top lip of the bed.
      const roll = ctx.createLinearGradient(B.x0, 0, B.x0 + 46 * u, 0);
      roll.addColorStop(0, "rgba(24,18,6,0.8)"); roll.addColorStop(0.16, "rgba(40,30,10,0.34)"); roll.addColorStop(0.4, "rgba(40,30,10,0.06)"); roll.addColorStop(0.62, "rgba(255,255,255,0.16)"); roll.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = roll; ctx.fillRect(B.x0, B.y0, 46 * u, h);
      const lip = ctx.createLinearGradient(0, B.y0, 0, B.y0 + 22);
      lip.addColorStop(0, "rgba(20,14,4,0.6)"); lip.addColorStop(0.4, "rgba(20,14,4,0.16)"); lip.addColorStop(1, "rgba(20,14,4,0)");
      ctx.fillStyle = lip; ctx.fillRect(B.x0, B.y0, B.x1 - B.x0, 22);
      const lamp = ctx.createRadialGradient(B.x0 + (B.x1 - B.x0) * (0.42 + 0.2 * s.light), B.y0 + h * 0.3, 20, B.x0 + (B.x1 - B.x0) * 0.5, B.y0 + h * 0.5, (B.x1 - B.x0) * 0.72);
      lamp.addColorStop(0, "rgba(255,250,235,0.16)"); lamp.addColorStop(0.5, "rgba(255,250,235,0)"); lamp.addColorStop(1, "rgba(40,26,6,0.3)");
      ctx.fillStyle = lamp; ctx.fillRect(B.x0, B.y0, B.x1 - B.x0, h);
      ctx.restore();
    };

    const pen = () => {
      const y = vy(s.y), x = L.pen, r1 = x + 36 * u, r2 = x + 56 * u, rw = 7 * u, ink = sets[live.current.set].ink, dx = 7 + s.light * 3;
      // Shadows first: the two guide rods, then the carriage, all a little to the right of what casts them.
      ctx.save(); rr(ctx, B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0, 3); ctx.clip();
      for (const rx of [r1, r2]) {
        const sh = ctx.createLinearGradient(rx + dx - rw, 0, rx + dx + rw, 0);
        sh.addColorStop(0, "rgba(40,28,8,0)"); sh.addColorStop(0.5, "rgba(40,28,8,0.3)"); sh.addColorStop(1, "rgba(40,28,8,0)");
        ctx.fillStyle = sh; ctx.fillRect(rx + dx - rw, B.y0, rw * 2, B.y1 - B.y0);
      }
      const cs = ctx.createRadialGradient(x + 44 * u + dx, y + 14 * u, 6, x + 44 * u + dx, y + 14 * u, 54 * u);
      cs.addColorStop(0, "rgba(30,20,4,0.5)"); cs.addColorStop(0.6, "rgba(30,20,4,0.2)"); cs.addColorStop(1, "rgba(30,20,4,0)");
      ctx.fillStyle = cs; ctx.fillRect(x - 20 * u, y - 50 * u, 140 * u, 130 * u);
      ctx.beginPath(); ctx.moveTo(x + 3, y + 3.5); ctx.lineTo(x + 28 * u + 4, y + 8 * u); ctx.lineWidth = 4 * u; ctx.strokeStyle = "rgba(30,20,4,0.28)"; ctx.lineCap = "round"; ctx.stroke();
      ctx.restore();

      for (const rx of [r1, r2]) { ctx.fillStyle = chrome(ctx, rx - rw / 2, rx + rw / 2); ctx.fillRect(rx - rw / 2, B.y0 - 2, rw, B.y1 - B.y0 + 4); }
      // Blocks that clamp the rods to the case.
      for (const by of [B.y0 - 14, B.y1 - 6]) {
        const g = ctx.createLinearGradient(0, by, 0, by + 20);
        g.addColorStop(0, "#f2f3f5"); g.addColorStop(0.4, "#a7abb2"); g.addColorStop(1, "#5d6168");
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 5 * k; ctx.shadowOffsetY = 2 * k; rr(ctx, r1 - 9 * u, by, r2 - r1 + 18 * u, 20, 3); ctx.fillStyle = g; ctx.fill(); ctx.restore();
        for (const rx of [r1, r2]) { ctx.beginPath(); ctx.arc(rx, by + 10, 2.4, 0, Math.PI * 2); ctx.fillStyle = "#1b1c20"; ctx.fill(); }
      }
      // The stylus: a tapered steel tube from the carriage down to the paper.
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 28 * u, y - 4.2 * u); ctx.lineTo(x + 28 * u, y + 4.2 * u); ctx.closePath();
      const st = ctx.createLinearGradient(0, y - 4.2 * u, 0, y + 4.2 * u);
      st.addColorStop(0, "#fdfdfd"); st.addColorStop(0.45, "#a3a8b0"); st.addColorStop(1, "#4b4f56");
      ctx.fillStyle = st; ctx.fill();
      ctx.beginPath(); ctx.arc(x + 0.4, y, 1.7 * u, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.fill();
      const collar = ctx.createLinearGradient(0, y - 6 * u, 0, y + 6 * u);
      collar.addColorStop(0, "#fff0b8"); collar.addColorStop(0.4, "#c79a3a"); collar.addColorStop(1, "#6e4f12");
      ctx.fillStyle = collar; ctx.fillRect(x + 19 * u, y - 6 * u, 7 * u, 12 * u);
      // Carriage body.
      const cx0 = x + 24 * u, cw = 44 * u, ch = 46 * u, cy0 = y - ch / 2;
      const body = ctx.createLinearGradient(0, cy0, 0, cy0 + ch);
      body.addColorStop(0, "#5a5f69"); body.addColorStop(0.12, "#2a2d33"); body.addColorStop(0.85, "#131519"); body.addColorStop(1, "#050506");
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 4 * k; ctx.shadowOffsetY = 1.5 * k; rr(ctx, cx0, cy0, cw, ch, 4 * u); ctx.fillStyle = body; ctx.fill(); ctx.restore();
      rr(ctx, cx0 + 0.6, cy0 + 0.6, cw - 1.2, ch - 1.2, 3.6 * u); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.stroke();
      for (const sy of [cy0 + 6.5 * u, cy0 + ch - 6.5 * u]) for (const sx of [cx0 + 7 * u, cx0 + cw - 7 * u]) {
        ctx.beginPath(); ctx.arc(sx, sy, 2.6 * u, 0, Math.PI * 2); ctx.fillStyle = steel(ctx, sx, sy, 2.6 * u); ctx.fill();
        ctx.beginPath(); ctx.arc(sx, sy, 1.1 * u, 0, Math.PI * 2); ctx.fillStyle = "#0a0a0c"; ctx.fill();
      }
      // Ink cartridge: a small glass cylinder lying across the carriage.
      const ty = y - 9 * u, th = 18 * u, tx0 = cx0 + 6 * u, tw = cw - 12 * u;
      const tube = ctx.createLinearGradient(0, ty, 0, ty + th);
      tube.addColorStop(0, "#ffffff"); tube.addColorStop(0.18, ink); tube.addColorStop(0.5, ink); tube.addColorStop(0.72, "#2a0508"); tube.addColorStop(1, ink);
      rr(ctx, tx0, ty, tw, th, th / 2); ctx.fillStyle = tube; ctx.fill();
      ctx.globalAlpha = 0.35; ctx.fillStyle = "#000"; rr(ctx, tx0, ty, tw, th, th / 2); ctx.fill(); ctx.globalAlpha = 1;
      rr(ctx, tx0 + 3 * u, ty + 2 * u, tw - 6 * u, 3 * u, 1.5 * u); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fill();
      for (const bx of [tx0 + 2 * u, tx0 + tw - 5 * u]) { ctx.fillStyle = chrome(ctx, bx, bx + 3 * u); ctx.fillRect(bx, ty - 0.5, 3 * u, th + 1); }
    };

    const panel = () => {
      // Reading window: amber digits behind smoked glass.
      const R = L.read, on = s.lit;
      const now = Math.max(0, Math.min(FULL, Math.round(s.y))), m = ((Math.floor(s.P / L.mw) % N) + N) % N;
      ctx.save(); rr(ctx, R.x + 4, R.y + 4, R.w - 8, R.h - 8, 5); ctx.clip();
      const glassBg = ctx.createLinearGradient(0, R.y, 0, R.y + R.h);
      glassBg.addColorStop(0, "#141008"); glassBg.addColorStop(1, "#0a0703");
      ctx.fillStyle = glassBg; ctx.fillRect(R.x, R.y, R.w, R.h);
      const size = R.h * 0.5;
      ctx.textBaseline = "middle"; ctx.textAlign = "right"; ctx.font = `700 ${size}px ${MONO}`;
      ctx.fillStyle = "rgba(255,184,74,0.07)"; ctx.fillText("888", R.x + R.w - 16 * u, R.y + R.h * 0.56);
      ctx.save(); ctx.shadowColor = LAMP; ctx.shadowBlur = 14 * k * on; ctx.globalAlpha = 0.25 + 0.75 * on; ctx.fillStyle = LAMP; ctx.fillText(String(now).padStart(3, " "), R.x + R.w - 16 * u, R.y + R.h * 0.56); ctx.restore();
      ctx.textAlign = "left"; ctx.font = `700 ${Math.max(9, 11 * u)}px ${MONO}`; ctx.fillStyle = `rgba(255,184,74,${0.3 + 0.6 * on})`;
      ctx.fillText(months[m].toUpperCase(), R.x + 15 * u, R.y + R.h * 0.34); ctx.fillStyle = sets[live.current.set].ink; ctx.globalAlpha = 0.95;
      ctx.beginPath(); ctx.arc(R.x + 19 * u, R.y + R.h * 0.68, 3.4 * u, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,184,74,0.8)"; ctx.font = `700 ${Math.max(8, 9.5 * u)}px ${MONO}`; ctx.fillText(sets[live.current.set].key, R.x + 27 * u, R.y + R.h * 0.69);
      const gl = ctx.createLinearGradient(R.x, R.y, R.x + R.w, R.y + R.h);
      gl.addColorStop(0, "rgba(255,255,255,0.16)"); gl.addColorStop(0.32 + 0.1 * s.light, "rgba(255,255,255,0.03)"); gl.addColorStop(0.33 + 0.1 * s.light, "rgba(255,255,255,0)");
      ctx.fillStyle = gl; ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore();

      // The two channel keys. The one that is in sits lower and glows in its ink colour.
      L.keys.forEach((q, i) => {
        const d = s.key[i], dy = 2.6 * d, ink = sets[i].ink;
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = (7 - 5 * d) * k; ctx.shadowOffsetY = (4 - 3 * d) * k;
        const cap = ctx.createLinearGradient(0, q.y + dy, 0, q.y + q.h + dy);
        cap.addColorStop(0, "#f3efe4"); cap.addColorStop(0.5, "#e0dbcd"); cap.addColorStop(1, "#b9b3a2");
        rr(ctx, q.x, q.y + dy, q.w, q.h, 6); ctx.fillStyle = cap; ctx.fill(); ctx.restore();
        ctx.save(); rr(ctx, q.x, q.y + dy, q.w, q.h, 6); ctx.clip();
        const glow = ctx.createRadialGradient(q.x + q.w / 2, q.y + q.h * 0.55 + dy, 2, q.x + q.w / 2, q.y + q.h * 0.55 + dy, q.w * 0.75);
        glow.addColorStop(0, ink); glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = 0.5 * d; ctx.fillStyle = glow; ctx.fillRect(q.x, q.y, q.w, q.h + 4); ctx.globalAlpha = 1;
        const dish = ctx.createLinearGradient(0, q.y + dy, 0, q.y + q.h + dy);
        dish.addColorStop(0, "rgba(0,0,0,0.1)"); dish.addColorStop(0.3, "rgba(0,0,0,0)"); dish.addColorStop(0.75, "rgba(255,255,255,0.22)"); dish.addColorStop(1, "rgba(255,255,255,0.4)");
        rr(ctx, q.x + 4, q.y + 4 + dy, q.w - 8, q.h - 9, 4); ctx.fillStyle = dish; ctx.fill(); ctx.restore();
        rr(ctx, q.x + 0.5, q.y + 0.5 + dy, q.w - 1, q.h - 1, 5.6); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.stroke();
        ctx.font = `800 ${q.h * 0.4}px ${MONO}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = d > 0.5 ? ink : "#3a3833"; ctx.fillText(sets[i].key, q.x + q.w / 2 - 7 * u, q.y + q.h / 2 + 1 + dy);
        ctx.beginPath(); ctx.arc(q.x + q.w / 2 + 15 * u, q.y + q.h / 2 + dy, 3.6 * u, 0, Math.PI * 2);
        ctx.save(); ctx.shadowColor = ink; ctx.shadowBlur = 10 * k * d; ctx.fillStyle = d > 0.5 ? ink : "#8d8779"; ctx.fill(); ctx.restore();
      });

      // Feed knob: knurled rim, turned face, and a white index that goes round as the paper runs.
      const K = L.knob, ang = s.P / (K.r * 1.6);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = 14 * k; ctx.shadowOffsetX = 4 * k; ctx.shadowOffsetY = 9 * k;
      ctx.beginPath(); ctx.arc(K.x, K.y, K.r, 0, Math.PI * 2); ctx.fillStyle = "#0b0c0e"; ctx.fill(); ctx.restore();
      const teeth = 44, stp = (Math.PI * 2) / teeth;
      for (let i = 0; i < teeth; i++) {
        const a = ang + i * stp, f = Math.cos(a + 2.2 - s.light * 0.5), v = 22 + (0.5 + 0.5 * f) * 60 + Math.pow(Math.max(0, f), 8) * 120;
        ctx.beginPath(); ctx.arc(K.x, K.y, K.r, a, a + stp * 0.55); ctx.arc(K.x, K.y, K.r * 0.72, a + stp * 0.55, a, true); ctx.closePath();
        ctx.fillStyle = `rgb(${v | 0},${(v + 2) | 0},${(v + 6) | 0})`; ctx.fill();
      }
      const face = typeof ctx.createConicGradient === "function" ? ctx.createConicGradient(-2.2 + s.light * 0.5, K.x, K.y) : null;
      if (face) for (const [o, v] of [[0, 246], [0.1, 170], [0.22, 100], [0.34, 160], [0.5, 232], [0.62, 150], [0.74, 96], [0.88, 170], [1, 246]]) face.addColorStop(o, `rgb(${v - 4},${v},${Math.min(255, v + 6)})`);
      ctx.beginPath(); ctx.arc(K.x, K.y, K.r * 0.74, 0, Math.PI * 2); ctx.fillStyle = "#0b0c0e"; ctx.fill();
      ctx.beginPath(); ctx.arc(K.x, K.y, K.r * 0.7, 0, Math.PI * 2); ctx.fillStyle = face || steel(ctx, K.x, K.y, K.r); ctx.fill();
      for (let q = 3; q < K.r * 0.7; q += 1.7) { ctx.beginPath(); ctx.arc(K.x, K.y, q, 0, Math.PI * 2); ctx.lineWidth = 0.5; ctx.strokeStyle = q % 3.4 < 1.7 ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)"; ctx.stroke(); }
      ctx.save(); ctx.translate(K.x, K.y); ctx.rotate(ang); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, -K.r * 0.22); ctx.lineTo(0, -K.r * 0.58); ctx.lineWidth = 3.4; ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -K.r * 0.24); ctx.lineTo(0, -K.r * 0.56); ctx.lineWidth = 2; ctx.strokeStyle = "#17181c"; ctx.stroke(); ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      paper(); pen(); panel();
      // A perspex door over the bed: two slanted reflections that slide with the light.
      const bw = B.x1 - B.x0, bh = B.y1 - B.y0, gx = B.x0 + bw * (0.3 + 0.16 * s.light);
      ctx.save(); rr(ctx, B.x0, B.y0, bw, bh, 3); ctx.clip();
      const door = ctx.createLinearGradient(0, B.y0, 0, B.y1);
      door.addColorStop(0, "rgba(255,255,255,0.2)"); door.addColorStop(0.7, "rgba(255,255,255,0.04)"); door.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = door;
      ctx.beginPath(); ctx.moveTo(gx, B.y0); ctx.lineTo(gx + bw * 0.13, B.y0); ctx.lineTo(gx - bw * 0.1, B.y1); ctx.lineTo(gx - bw * 0.23, B.y1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(gx + bw * 0.16, B.y0); ctx.lineTo(gx + bw * 0.19, B.y0); ctx.lineTo(gx - bw * 0.04, B.y1); ctx.lineTo(gx - bw * 0.07, B.y1); ctx.closePath(); ctx.fill();
      ctx.restore();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, moved = -1e9, nextSwap = 7;
    const swap = () => {
      // Race the rest of this year and one whole year more, so a complete new curve ends up on the bed.
      s.swaps.push({ p: s.P, s: live.current.set });
      s.to = (Math.floor(s.P / yearW) + 2) * yearW + L.mw * 0.9;
      if (reduce) { s.swaps = [{ p: -1e9, s: live.current.set }]; s.P = s.to; s.to = 0; prefill(); }
    };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000, cur = live.current.set;
      if (!live.current.touched && t > nextSwap) { nextSwap = t + 7; live.current.set = (cur + 1) % sets.length; setSet(live.current.set); swap(); }
      if (now - moved > 2600) s.lightTo = 0.6 * Math.sin(t * 0.45);
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
      s.lit += (1 - s.lit) * Math.min(1, dt * 4);
      sets.forEach((_, i) => { s.key[i] += ((i === live.current.set ? 1 : 0) - s.key[i]) * Math.min(1, dt * 22); });

      const racing = s.to > s.P + 0.5, speed = racing ? Math.min(1500 * u, (s.to - s.P) * 3.4 + 60) : FEED * (narrow ? 0.7 : 1);
      const from = s.P, adv = Math.min(speed * dt, racing ? s.to - s.P : 1e9);
      if (racing && speed > 90) {
        // Fast feed: the pen keeps up, so sample the curve every couple of pixels of paper.
        for (let p = from + 2; p < from + adv; p += 2) s.trace.push({ p, v: valueAt(setAt(p), p) + (Math.random() - 0.5) * 0.8, s: setAt(p) });
        s.P = from + adv; s.y = valueAt(live.current.set, s.P); s.yv = 0;
      } else {
        s.P = from + adv; if (!racing) s.to = 0;
        // Slow feed: the pen is a weight on a spring, and a knock on the desk shakes it.
        const goal = valueAt(live.current.set, s.P);
        for (let i = 0; i < 4; i++) {
          const h = dt / 4, shake = s.quake * (Math.random() - 0.5) * 9000;
          s.yv += (520 * (goal - s.y) - 15 * s.yv + shake) * h; s.y += s.yv * h;
        }
        s.quake *= Math.exp(-dt * 3.2);
      }
      s.trace.push({ p: s.P, v: s.y, s: live.current.set });
      stamp(from + 1e-4, s.P);
      const cut = s.P - lead - 20;
      if (s.trace.length > 40 && s.trace[20].p < cut) s.trace = s.trace.filter((q) => q.p >= cut);
      if (s.dots.length && s.dots[0].p < cut - 20) s.dots = s.dots.filter((q) => q.p >= cut - 20);
      if (s.swaps.length > 1 && s.swaps[1].p < cut) s.swaps.shift();
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => { s.lit = 1; sets.forEach((_, i) => { s.key[i] = i === live.current.set ? 1 : 0; }); draw(); };
    const wake = () => { if (reduce) still(); else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = { poke: wake, swap: () => { swap(); wake(); }, knock: (f) => { s.quake = Math.min(1.6, s.quake + f); s.yv += (Math.random() - 0.5) * 260 * f; wake(); } };
    fit(); wake();

    const host = cv.parentElement;
    let px = 0, py = 0, pt = 0;
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect(), now = performance.now();
      moved = now; s.lightTo = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1));
      // A fast hand over the desk is felt by the pen as a faint tremor.
      if (pt && !reduce) { const sp = Math.hypot(e.clientX - px, e.clientY - py) / Math.max(8, now - pt); if (sp > 1.2) s.quake = Math.min(0.5, s.quake + sp * 0.012); }
      px = e.clientX; py = e.clientY; pt = now;
    };
    host?.addEventListener("pointermove", onMove);
    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      host?.removeEventListener("pointermove", onMove);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, [narrow]);

  const L = layoutFor(narrow);
  const touch = () => { if (!live.current.touched) { live.current.touched = true; setTouched(true); } };
  const choose = (i: number) => { touch(); if (i === live.current.set) return; live.current.set = i; setSet(i); api.current?.swap(); };
  const values = sets[set].values, peak = values.indexOf(Math.max(...values)), low = values.indexOf(Math.min(...values));
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <div ref={stage} className="flex min-h-[760px] w-full flex-col items-center justify-center bg-[#0c0e12] bg-[radial-gradient(100%_75%_at_50%_38%,#232a35_0%,#0c0e12_68%)] px-4 py-12">
      <div
        className="relative w-full rounded-2xl shadow-[0_1px_0_rgba(255,255,255,0.06),0_2px_3px_rgba(0,0,0,0.7),0_22px_34px_-10px_rgba(0,0,0,0.75),0_70px_100px_-24px_rgba(0,0,0,0.9)]"
        style={{ maxWidth: L.W, aspectRatio: `${L.W} / ${L.H}` }}
      >
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full rounded-2xl" />
        <button
          type="button"
          aria-label="Knock the recorder to jolt the pen"
          onClick={() => { touch(); api.current?.knock(1); }}
          style={{ left: pct(L.bed.x0, L.W), top: pct(L.bed.y0, L.H), width: pct(L.bed.x1 - L.bed.x0, L.W), height: pct(L.bed.y1 - L.bed.y0, L.H) }}
          className="absolute cursor-pointer rounded outline-none focus-visible:ring-2 focus-visible:ring-[#ffb84a]"
        />
        <div role="group" aria-label="Data set">
          {sets.map((d, i) => (
            <button
              key={d.key}
              type="button"
              aria-pressed={set === i}
              aria-label={`${d.label}, channel ${d.key}`}
              onClick={() => choose(i)}
              style={{ left: pct(L.keys[i].x - 3, L.W), top: pct(L.keys[i].y - 3, L.H), width: pct(L.keys[i].w + 6, L.W), height: pct(L.keys[i].h + 26, L.H) }}
              className="absolute cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#ffb84a]"
            />
          ))}
        </div>
      </div>

      <p aria-live={touched ? "polite" : "off"} className="mt-10 max-w-[560px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-slate-400">
        <span className="text-slate-100">{sets[set].label}</span>
        <span className="mx-2 text-slate-600">/</span>
        High {values[peak]} in {monthNames[peak]}, low {values[low]} in {monthNames[low]}
        <span className="mx-2 text-slate-600">/</span>
        Demo data
      </p>

      <table className="sr-only">
        <caption>{`${sets[set].label}: ${UNIT} per month (demo data)`}</caption>
        <thead>
          <tr><th scope="col">Month</th><th scope="col">{UNIT}</th></tr>
        </thead>
        <tbody>
          {months.map((m, i) => (
            <tr key={m}><th scope="row">{monthNames[i]}</th><td>{values[i]}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
