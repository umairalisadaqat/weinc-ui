import { useEffect, useRef, useState } from "react";

// The lines on the card. `done` is how each one starts.
const tasks = [
  { text: "Proof the cover in daylight", done: true },
  { text: "Order the cream 80 gsm stock", done: true },
  { text: "Trim the test sheets", done: false },
  { text: "Send the plates to Marit", done: false },
];
const CARD = { title: "Before the print run", date: "Mon 12 Oct" };
const LACQUER: [number, number, number] = [214, 62, 38]; // the paint on the pencil
const FOIL = "ALDER & FINCH   2B"; // stamped along the top flat

const SW = 480, SH = 486; // scene, in design pixels
const CX = 40, CY = 52, CW = 400, HEAD = 78, ROW = 56; // the card
const CH = HEAD + ROW * tasks.length + 22;
const PAD = 150; // spare canvas round the scene so the pencil is never cut off
const LEN = 250, THICK = 13, PS = 1.2, G = LEN * PS; // the pencil as drawn, how much it is enlarged, and its real length
const REST = { x: 70, y: CY + CH + 66, a: -0.23, tl: 0, el: 0 };

type Seg = { dur: number; start?: () => void; step: (k: number) => void; end?: () => void };
type Crumb = { x: number; y: number; vx: number; vy: number; r: number; len: number; tone: number; life: number };

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const mix = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t)))).join(",")})`;
const shade = (c: number[], k: number) => c.map((v) => Math.max(0, Math.min(255, v * k)));

export default function PencilAndEraserIndexCard() {
  const [done, setDone] = useState(tasks.map((t) => t.done));
  const doneRef = useRef(tasks.map((t) => t.done));
  const [scale, setScale] = useState(1);
  const root = useRef<HTMLElement>(null);
  const marks = useRef<HTMLCanvasElement>(null);
  const over = useRef<HTMLCanvasElement>(null);
  const texts = useRef<(HTMLSpanElement | null)[]>([]);
  const api = useRef<{ toggle: (i: number, fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const fit = () => setScale(Math.max(0.6, Math.min(1.16, (node.clientWidth - 24) / SW)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mc = marks.current, oc = over.current, node = root.current;
    if (!mc || !oc || !node) return;
    const g = mc.getContext("2d"), o = oc.getContext("2d");
    if (!g || !o) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const px = Math.min(2, window.devicePixelRatio || 1) * 1.16;
    mc.width = CW * px; mc.height = CH * px;
    oc.width = (SW + PAD * 2) * px; oc.height = (SH + PAD * 2) * px;
    g.setTransform(px, 0, 0, px, 0, 0);

    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const tooth = (x: number, y: number) => { const n = Math.sin(Math.floor(x * 1.6) * 12.9898 + Math.floor(y * 1.6) * 78.233) * 43758.5453; return n - Math.floor(n); };

    // Geometry of a row, in card pixels.
    const rowY = (i: number) => HEAD + ROW * i + ROW / 2;
    const tickPath = (i: number) => {
      const bx = 35, by = rowY(i), pts: number[][] = [];
      for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([bx - 8.5 + 7 * t, by - 1 + 10 * t * (0.7 + 0.3 * t)]); }
      for (let k = 1; k <= 18; k++) { const t = k / 18; pts.push([bx - 1.5 + 22 * t + 2 * Math.sin(t * Math.PI), by + 9 - 31 * t + 3 * Math.sin(t * Math.PI)]); }
      return pts;
    };
    const strikePath = (i: number) => {
      const w = texts.current[i]?.offsetWidth ?? 220, x0 = 56, x1 = 62 + w + 8, y = rowY(i) + 1.5, pts: number[][] = [];
      const lift = 1.5 + rand() * 2.5, ph = rand() * 6;
      for (let k = 0; k <= 40; k++) { const t = k / 40; pts.push([x0 + (x1 - x0) * t, y - lift * t + 0.9 * Math.sin(t * 7 + ph) + 0.5 * Math.sin(t * 19 + ph)]); }
      return pts;
    };
    const measure = (pts: number[][]) => { const acc = [0]; for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return acc; };
    const at = (pts: number[][], acc: number[], d: number) => {
      let i = 1; while (i < acc.length - 1 && acc[i] < d) i++;
      const t = Math.max(0, Math.min(1, (d - acc[i - 1]) / Math.max(0.0001, acc[i] - acc[i - 1])));
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
    };

    // Graphite is laid as specks that skip the low spots in the paper.
    const speck = (x: number, y: number, press: number, wide: number) => {
      for (let n = 0; n < 9; n++) {
        const dx = (rand() + rand() - 1) * wide, dy = (rand() + rand() - 1) * wide;
        if (tooth(x + dx, y + dy) < 0.2) continue;
        const s = 0.5 + rand() * 0.6;
        g.fillStyle = `rgba(50,52,60,${((0.07 + 0.25 * rand()) * press).toFixed(3)})`;
        g.fillRect(x + dx - s / 2, y + dy - s / 2, s, s);
      }
    };
    const lay = (pts: number[][], acc: number[], from: number, to: number, wide = 1.05) => {
      const total = acc[acc.length - 1];
      for (let d = from; d < to; d += 0.45) { const p = at(pts, acc, d), t = d / total; speck(p[0], p[1], 0.7 + 0.5 * Math.sin(Math.min(1, t * 1.15) * Math.PI) ** 0.6, wide); }
    };
    const layAll = (i: number) => { [tickPath(i), strikePath(i)].forEach((pts, n) => { const acc = measure(pts); lay(pts, acc, 0, acc[acc.length - 1], n ? 1.05 : 1.5); }); };
    const rub = (x: number, y: number, power: number) => {
      g.save(); g.globalCompositeOperation = "destination-out";
      const r = g.createRadialGradient(x, y, 0, x, y, 11);
      r.addColorStop(0, `rgba(0,0,0,${power})`); r.addColorStop(0.6, `rgba(0,0,0,${power * 0.7})`); r.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = r; g.fillRect(x - 12, y - 12, 24, 24); g.restore();
    };
    const wipeRow = (i: number, alpha: number) => { g.save(); g.globalCompositeOperation = "destination-out"; g.fillStyle = `rgba(0,0,0,${alpha})`; g.fillRect(0, rowY(i) - ROW / 2 - 2, CW, ROW + 2); g.restore(); };

    const pose = { ...REST };
    const light = { x: -0.5, y: -0.86, to: -0.5 };
    const crumbs: Crumb[] = [];
    let sweep = 0;

    const drawPencil = () => {
      const { x, y, a, tl, el } = pose, c = Math.cos(a), s = Math.sin(a), h = THICK / 2;
      // Shadow: it parts from the pencil at whichever end is lifted off the card.
      o.save();
      o.shadowColor = "rgba(8,14,12,0.5)"; o.shadowBlur = (2.5 + (tl + el) * 0.1) * px; o.shadowOffsetX = 4000 * px; o.shadowOffsetY = 0;
      o.lineCap = "round"; o.lineWidth = THICK * PS - 3; o.strokeStyle = "#000";
      o.beginPath(); o.moveTo(x + c * 9 + (tl + 1.5) * 0.55 - 4000, y + s * 9 + (tl + 1.5) * 0.9); o.lineTo(x + c * (G - 8) + (el + 1.5) * 0.55 - 4000, y + s * (G - 8) + (el + 1.5) * 0.9); o.stroke();
      o.restore();

      o.save(); o.translate(x, y); o.rotate(a); o.scale(PS, PS);
      // How much each long side faces the lamp. The lamp does not turn with the pencil.
      const up = 0.5 + 0.5 * (s * light.x - c * light.y), dn = 1 - up;
      const band = (col: number[], f: number) => mix(shade(col, 0.52), shade(col, 1.22), f);
      const across = (col: number[]) => { const gr = o.createLinearGradient(0, -h, 0, h); gr.addColorStop(0, band(col, up)); gr.addColorStop(0.5, mix(col, [255, 255, 255], 0.1)); gr.addColorStop(1, band(col, dn)); return gr; };

      // Eraser, a little grey at the working end.
      o.beginPath(); o.moveTo(LEN - 20, -h + 0.4); o.lineTo(LEN - 6, -h + 0.4); o.quadraticCurveTo(LEN, -h + 0.4, LEN, 0); o.quadraticCurveTo(LEN, h - 0.4, LEN - 6, h - 0.4); o.lineTo(LEN - 20, h - 0.4); o.closePath();
      o.fillStyle = across([226, 142, 140]); o.fill();
      const grime = o.createLinearGradient(LEN - 9, 0, LEN, 0); grime.addColorStop(0, "rgba(70,62,66,0)"); grime.addColorStop(1, "rgba(70,62,66,0.42)"); o.fillStyle = grime; o.fill();

      // Ferrule: brass tube with two crimped rings.
      const brass = o.createLinearGradient(0, -h - 0.7, 0, h + 0.7);
      brass.addColorStop(0, band([196, 150, 62], up)); brass.addColorStop(0.2 + 0.25 * dn, "#fff3c4"); brass.addColorStop(0.55, "#c9a04a"); brass.addColorStop(1, band([150, 106, 34], dn));
      o.fillStyle = brass; o.fillRect(LEN - 42, -h - 0.7, 23, THICK + 1.4);
      for (const fx of [LEN - 38, LEN - 34.5, LEN - 27, LEN - 23.5]) { o.fillStyle = "rgba(60,36,6,0.5)"; o.fillRect(fx, -h - 0.7, 1, THICK + 1.4); o.fillStyle = "rgba(255,244,200,0.55)"; o.fillRect(fx + 1, -h - 0.7, 0.7, THICK + 1.4); }
      o.fillStyle = "rgba(40,20,0,0.35)"; o.fillRect(LEN - 42.6, -h, 0.9, THICK);

      // Hexagonal body: three flats, each one colour.
      o.fillStyle = band(LACQUER, up); o.fillRect(27, -h, LEN - 69, h / 2);
      o.fillStyle = band(LACQUER, dn); o.fillRect(27, h / 2, LEN - 69, h / 2);
      const flat = o.createLinearGradient(0, -h / 2, 0, h / 2); flat.addColorStop(0, mix(LACQUER, [255, 255, 255], 0.2)); flat.addColorStop(0.5, mix(LACQUER, [255, 255, 255], 0.04)); flat.addColorStop(1, mix(shade(LACQUER, 0.86), [0, 0, 0], 0));
      o.fillStyle = flat; o.fillRect(27, -h / 2, LEN - 69, h);
      o.fillStyle = "rgba(0,0,0,0.16)"; o.fillRect(27, (up > dn ? h / 2 : -h / 2) - 0.3, LEN - 69, 0.6);
      o.fillStyle = "rgba(255,255,255,0.3)"; o.fillRect(27, (up > dn ? -h / 2 : h / 2) - 0.3, LEN - 69, 0.6);
      // Lamp streak on the top flat, and the foil stamp.
      const streakY = -h / 2 + 1.4 + (up > dn ? 0 : h - 2.8);
      const streak = o.createLinearGradient(40, 0, LEN - 46, 0); streak.addColorStop(0, "rgba(255,255,255,0)"); streak.addColorStop(0.12, "rgba(255,255,255,0.75)"); streak.addColorStop(0.5, "rgba(255,255,255,0.38)"); streak.addColorStop(0.9, "rgba(255,255,255,0.7)"); streak.addColorStop(1, "rgba(255,255,255,0)");
      o.fillStyle = streak; o.fillRect(40, streakY - 0.55, LEN - 86, 1.1);
      o.font = "700 4.6px ui-sans-serif, system-ui, Helvetica, Arial, sans-serif"; o.textBaseline = "middle"; o.textAlign = "right";
      o.fillStyle = "rgba(60,14,4,0.55)"; o.fillText(FOIL, LEN - 52, 1.5);
      o.fillStyle = "#f6dc93"; o.fillText(FOIL, LEN - 52, 1.1);

      // Sharpened wood: the paint ends in scallops, one to a flat.
      o.beginPath(); o.moveTo(7, -1.3); o.lineTo(29, -h); o.lineTo(37, -h);
      o.quadraticCurveTo(26, -h * 0.75, 37, -h / 2); o.quadraticCurveTo(19, 0, 37, h / 2); o.quadraticCurveTo(26, h * 0.75, 37, h);
      o.lineTo(29, h); o.lineTo(7, 1.3); o.closePath();
      o.fillStyle = across([228, 190, 140]); o.fill();
      o.lineWidth = 0.7; o.strokeStyle = "rgba(70,24,8,0.45)"; o.beginPath(); o.moveTo(37, -h); o.quadraticCurveTo(26, -h * 0.75, 37, -h / 2); o.quadraticCurveTo(19, 0, 37, h / 2); o.quadraticCurveTo(26, h * 0.75, 37, h); o.stroke();
      o.lineWidth = 0.4; o.strokeStyle = "rgba(120,76,30,0.3)";
      for (let k = -3; k <= 3; k++) { o.beginPath(); o.moveTo(8, k * 0.3); o.lineTo(27 + Math.abs(k), k * 1.75); o.stroke(); }
      // Graphite point.
      o.beginPath(); o.moveTo(0, 0); o.lineTo(7.4, -1.45); o.lineTo(7.4, 1.45); o.closePath(); o.fillStyle = "#34353b"; o.fill();
      o.lineWidth = 0.5; o.strokeStyle = "rgba(255,255,255,0.4)"; o.beginPath(); o.moveTo(1.5, up > dn ? -0.2 : 0.2); o.lineTo(7, up > dn ? -1 : 1); o.stroke();
      o.restore();
    };

    const drawOver = () => {
      o.setTransform(px, 0, 0, px, PAD * px, PAD * px);
      o.clearRect(-PAD, -PAD, SW + PAD * 2, SH + PAD * 2);
      for (const cr of crumbs) {
        const dx = Math.cos(cr.r) * cr.len, dy = Math.sin(cr.r) * cr.len, al = Math.min(1, cr.life);
        o.lineCap = "round";
        o.lineWidth = 1.5; o.strokeStyle = `rgba(20,20,24,${0.26 * al})`; o.beginPath(); o.moveTo(cr.x - dx + 0.8, cr.y - dy + 1.2); o.lineTo(cr.x + dx + 0.8, cr.y + dy + 1.2); o.stroke();
        o.lineWidth = 1.35; o.strokeStyle = `rgba(${Math.round(158 + cr.tone * 44)},${Math.round(132 + cr.tone * 14)},${Math.round(134 + cr.tone * 12)},${al})`; o.beginPath(); o.moveTo(cr.x - dx, cr.y - dy); o.lineTo(cr.x + dx, cr.y + dy); o.stroke();
      }
      drawPencil();
    };

    // A small queue of timed moves; the pencil does one thing at a time.
    const queue: Seg[] = [];
    let cur: (Seg & { t: number }) | null = null;
    const jobs: { i: number; on: boolean }[] = [];
    let busy = false;

    const glide = (to: () => { x: number; y: number; a: number; tl: number; el: number }, dur: number): Seg => {
      let from = { ...pose }, target = { ...pose };
      return {
        dur,
        start: () => { from = { ...pose }; target = to(); let d = target.a - from.a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; target.a = from.a + d; },
        step: (k) => { const e = ease(k); pose.x = from.x + (target.x - from.x) * e; pose.y = from.y + (target.y - from.y) * e; pose.a = from.a + (target.a - from.a) * e; pose.tl = from.tl + (target.tl - from.tl) * e + Math.sin(k * Math.PI) * 6; pose.el = from.el + (target.el - from.el) * e + Math.sin(k * Math.PI) * 6; },
      };
    };
        const write = (pts: number[][], dur: number, wide: number): Seg[] => {
      const acc = measure(pts), total = acc[acc.length - 1]; let laid = 0;
      const lean = (x: number) => 0.92 + 0.36 * Math.max(0, Math.min(1, (x - 40) / 320));
      return [
        glide(() => ({ x: CX + pts[0][0], y: CY + pts[0][1], a: lean(pts[0][0]), tl: 9, el: 44 }), 300),
        { dur: 70, step: (k) => { pose.tl = 9 * (1 - k); } },
        { dur, step: (k) => { const d = total * ease(k); lay(pts, acc, laid, d, wide); laid = d; const p = at(pts, acc, d); pose.x = CX + p[0]; pose.y = CY + p[1]; pose.a = lean(p[0]) + 0.025 * Math.sin(d * 0.5); pose.tl = 0; pose.el = 44; } },
        { dur: 90, step: (k) => { pose.tl = 9 * k; } },
      ];
    };
    const home = (): Seg => glide(() => ({ ...REST }), 460);
    const finish = (): Seg => ({ dur: 1, step: () => {}, end: () => { busy = false; next(); } });

    const tick = (i: number) => { queue.push(...write(tickPath(i), 240, 1.5), ...write(strikePath(i), 360, 1.05), home(), finish()); };
    const erase = (i: number) => {
      const strike = strikePath(i), acc = measure(strike), total = acc[acc.length - 1], by = rowY(i);
      // The rubbing end is the eraser, so the point is worked out from where the eraser touches.
      const place = (ex: number, ey: number, a: number) => { pose.a = a; pose.x = CX + ex - Math.cos(a) * G; pose.y = CY + ey - Math.sin(a) * G; pose.el = 0; pose.tl = 46; };
      const lean = (x: number) => Math.PI + 0.92 + 0.36 * Math.max(0, Math.min(1, (x - 40) / 320));
      let spawn = 0;
      queue.push(
        glide(() => { const a = lean(strike[strike.length - 1][0]); return { x: CX + strike[strike.length - 1][0] - Math.cos(a) * G, y: CY + strike[strike.length - 1][1] - Math.sin(a) * G, a, tl: 46, el: 8 }; }, 520),
        {
          dur: 1150,
          step: (k) => {
            // Work back along the line in short scrubbing strokes, then finish on the tick.
            const run = Math.min(1, k / 0.72), d = total * (1 - run) + 14 * Math.sin(k * 46), p = at(strike, acc, Math.max(0, Math.min(total, d)));
            const onTick = k > 0.72, tk = (k - 0.72) / 0.28;
            const ex = onTick ? 37 + 9 * Math.sin(tk * 30) : p[0], ey = onTick ? by - 4 + 9 * Math.cos(tk * 19) : p[1] + 4 * Math.sin(k * 71);
            rub(ex, ey, 0.34); place(ex, ey, lean(ex) + 0.03 * Math.sin(k * 46));
            if (++spawn % 3 === 0 && crumbs.length < 46) { const dir = rand() * Math.PI * 2, v = 30 + rand() * 70; crumbs.push({ x: CX + ex + (rand() - 0.5) * 10, y: CY + ey + (rand() - 0.5) * 8, vx: Math.cos(dir) * v, vy: Math.sin(dir) * v * 0.7 + 14, r: rand() * Math.PI, len: 0.4 + rand() * 1.3, tone: rand(), life: 1 }); }
          },
          end: () => { wipeRow(i, 0.9); },
        },
        home(),
        { dur: 1, step: () => {}, end: () => { sweep = 1; busy = false; next(); } },
      );
    };
    const next = () => {
      if (busy) return;
      const job = jobs.shift();
      if (!job) return;
      busy = true;
      if (job.on) tick(job.i); else erase(job.i);
      wake();
    };

    let raf = 0, last = 0, seen = true;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.034, (now - last) / 1000); last = now;
      if (!cur && queue.length) { cur = { ...(queue.shift() as Seg), t: 0 }; cur.start?.(); }
      if (cur) { cur.t += dt * 1000; const k = Math.min(1, cur.t / cur.dur); cur.step(k); if (k >= 1) { const ended = cur; cur = null; ended.end?.(); } }
      let moving = false;
      for (let n = crumbs.length - 1; n >= 0; n--) {
        const cr = crumbs[n];
        if (sweep > 0) { cr.vx += 900 * dt; cr.vy += 260 * dt; cr.life -= dt * 1.5; }
        cr.x += cr.vx * dt; cr.y += cr.vy * dt; cr.vx *= Math.pow(0.002, dt); cr.vy *= Math.pow(0.002, dt); cr.r += cr.vx * dt * 0.08;
        if (Math.abs(cr.vx) + Math.abs(cr.vy) > 2) moving = true;
        if (cr.life <= 0) crumbs.splice(n, 1);
      }
      if (sweep > 0 && crumbs.length === 0) sweep = 0;
      const lamp = light.to - light.x; light.x += lamp * Math.min(1, dt * 5); light.y = -Math.sqrt(Math.max(0.05, 1 - light.x * light.x));
      drawOver();
      if ((cur || queue.length || moving || sweep > 0 || Math.abs(lamp) > 0.01) && seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    let touched = false;
    api.current = {
      toggle: (i, fromUser) => {
        if (fromUser) touched = true;
        const on = !doneRef.current[i];
        doneRef.current = doneRef.current.map((v, n) => (n === i ? on : v));
        setDone(doneRef.current);
        if (reduce) { if (on) layAll(i); else wipeRow(i, 1); return; }
        jobs.push({ i, on }); next();
      },
    };

    tasks.forEach((_, i) => { if (doneRef.current[i]) layAll(i); });
    drawOver();

    // Until someone clicks, it works down the card by itself.
    let step = 0;
    const order = [2, 0, 3, 1];
    const demo = () => { if (touched || reduce || !seen || document.hidden || busy) return; api.current?.toggle(order[step++ % order.length] % tasks.length, false); };
    const first = window.setTimeout(demo, 380);
    const loop = window.setInterval(demo, 3900);

    const onMove = (e: PointerEvent) => { const b = node.getBoundingClientRect(); light.to = -0.5 + ((e.clientX - b.left) / b.width - 0.5) * 0.9; wake(); };
    node.addEventListener("pointermove", onMove);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(node);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); window.clearTimeout(first); window.clearInterval(loop); api.current = null;
      node.removeEventListener("pointermove", onMove); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const left = done.filter((v) => !v).length;

  return (
    <section
      ref={root}
      className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#1c2a27] px-3 py-10 sm:min-h-[760px]"
      style={{ backgroundImage: "radial-gradient(110% 80% at 50% 36%,rgba(120,170,150,0.2) 0%,rgba(0,0,0,0) 55%,rgba(0,0,0,0.42) 100%),linear-gradient(rgba(214,240,226,0.085) 1px,transparent 1px),linear-gradient(90deg,rgba(214,240,226,0.085) 1px,transparent 1px),linear-gradient(rgba(214,240,226,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(214,240,226,0.04) 1px,transparent 1px)", backgroundSize: "100% 100%,120px 120px,120px 120px,24px 24px,24px 24px", backgroundPosition: "0 0,center,center,center,center" }}
    >
      <div className="relative z-10" style={{ width: SW * scale, height: SH * scale }}>
        <div className="relative" style={{ width: SW, height: SH, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          {/* a spare card under the one in use */}
          <div aria-hidden="true" className="absolute rounded-[5px]" style={{ left: CX + 6, top: CY + 5, width: CW, height: CH, background: "#e9e3d3", transform: "rotate(2.4deg)", boxShadow: "0 1px 0 #cfc8b6, 0 14px 22px -8px rgba(0,0,0,0.55)" }} />
          <div
            className="absolute overflow-hidden rounded-[5px] text-[#2b2d33]"
            style={{ left: CX, top: CY, width: CW, height: CH, background: "linear-gradient(168deg,#fbf8ef 0%,#f4efe2 62%,#ebe5d5 100%)", boxShadow: "0 1px 0 #fffdf6 inset, 0 1.5px 0 #cdc6b3, 0 3px 4px rgba(0,0,0,0.25), 0 22px 34px -12px rgba(0,0,0,0.6)" }}
          >
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16] mix-blend-multiply">
              <filter id="index-card-pencil-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" /><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0.9 0" /></filter>
              <rect width="100%" height="100%" filter="url(#index-card-pencil-grain)" />
            </svg>
            <div className="flex items-end justify-between px-[26px] pt-[26px]">
              <h2 className="font-serif text-[23px] italic leading-none tracking-[-0.01em]">{CARD.title}</h2>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6b6f78]">{CARD.date}</span>
            </div>
            <div aria-hidden="true" className="absolute left-0 w-full" style={{ top: HEAD - 13, height: 1.5, background: "#d5604e" }} />
            {tasks.map((t, i) => (
              <button
                key={t.text}
                type="button"
                role="checkbox"
                aria-checked={done[i]}
                onClick={() => api.current?.toggle(i, true)}
                className="absolute left-0 flex w-full cursor-pointer items-center text-left outline-none focus-visible:bg-[#2b6cb0]/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2b6cb0]"
                style={{ top: HEAD + ROW * i, height: ROW, borderBottom: "1px solid rgba(92,140,190,0.42)" }}
              >
                <span aria-hidden="true" className="absolute rounded-[2px]" style={{ left: 26, top: ROW / 2 - 9, width: 18, height: 18, border: "1.4px solid #6c7f96" }} />
                <span ref={(el) => { texts.current[i] = el; }} className="absolute whitespace-nowrap font-serif text-[18px]" style={{ left: 62 }}>{t.text}</span>
              </button>
            ))}
            <canvas ref={marks} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 mix-blend-multiply" style={{ width: CW, height: CH }} />
          </div>
          <canvas ref={over} aria-hidden="true" className="pointer-events-none absolute" style={{ left: -PAD, top: -PAD, width: SW + PAD * 2, height: SH + PAD * 2 }} />
        </div>
      </div>
      <p className="relative mt-8 max-w-[340px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-[#a9c4b8]">
        Tick a line and the pencil writes it. Untick it and the eraser takes it back.
      </p>
      <p className="sr-only" aria-live="polite">{left === 0 ? "Everything is done" : `${left} of ${tasks.length} still to do`}</p>
    </section>
  );
}
