import { useEffect, useRef, useState } from "react";

// The dies. `word` is cut into the rubber, `note` is what a screen reader hears.
const statuses = [
  { word: "PAID", note: "Marked as paid" },
  { word: "APPROVED", note: "Marked as approved" },
  { word: "ON HOLD", note: "Marked as on hold" },
];
const DOCKET = {
  title: "Delivery note",
  number: "No. 0417",
  date: "12 OCT 2026",
  lines: ["40 giclee prints, A2, cotton rag", "2 portfolio boxes, slate grey", "1 roll of glassine, 50 m", "Collected by Hallam Couriers"],
};
const INK = [198, 38, 44]; // red, green, blue of the ink in the pad
const FADE = 0.62; // how much ink is left on the rubber after each impression

const SW = 560, SH = 440; // scene, in design pixels
const OX = 292, OY = 252; // where the middle of the desk sits in the scene
const TIP = 50, TURN = -24; // camera: degrees tipped back, degrees turned
const PAPER = { x: -196, y: -146, w: 236, h: 302 };
const PAD = { x: 88, y: -132, w: 124, h: 88, z: 15 };
const PARK = { x: 158, y: 78, z: 0, r: 9 };
const MW = 164, MD = 60, MH = 37, RUB = 7; // mount width, depth, height and the rubber under it
const IW = 152, IH = 52; // the impression
const HOVER = 44;

type Seg = { dur: number; start?: () => void; step: (k: number) => void; end?: () => void };
const inOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** One impression: the die drawn solid, then starved of ink where the noise and the lean of the hand say so. */
function impress(word: string, ink: number, seed: number) {
  const R = 2, cv = document.createElement("canvas");
  cv.width = IW * R; cv.height = IH * R;
  const c = cv.getContext("2d");
  if (!c) return cv;
  c.scale(R, R);
  const box = (x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  c.strokeStyle = "#000"; c.fillStyle = "#000";
  c.lineWidth = 3.2; box(2.6, 2.6, IW - 5.2, IH - 5.2, 6); c.stroke();
  c.lineWidth = 1; box(7.5, 7.5, IW - 15, IH - 15, 2.5); c.stroke();
  c.textAlign = "center"; c.textBaseline = "alphabetic";
  c.font = "900 25px 'Arial Narrow','Helvetica Neue',Helvetica,Arial,sans-serif";
  const wide = c.measureText(word).width + (word.length - 1) * 3.4;
  const fit = Math.min(1.25, (IW - 34) / wide);
  c.save(); c.translate(IW / 2, 30); c.scale(fit, 1);
  let pen = -wide / 2;
  for (const ch of word) { const w = c.measureText(ch).width; c.fillText(ch, pen + w / 2, 0); pen += w + 3.4; }
  c.restore();
  c.font = "700 6.4px ui-monospace,SFMono-Regular,Menlo,monospace";
  const sub = DOCKET.date.split("").join(" ");
  c.fillText(sub, IW / 2, 41.5);
  const subW = c.measureText(sub).width / 2 + 7;
  c.fillRect(13, 38.6, IW / 2 - subW - 13, 1.1); c.fillRect(IW / 2 + subW, 38.6, IW / 2 - subW - 13, 1.1);

  const hash = (x: number, y: number) => { const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453; return n - Math.floor(n); };
  const smooth = (x: number, y: number) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy); return (hash(xi, yi) * (1 - ux) + hash(xi + 1, yi) * ux) * (1 - uy) + (hash(xi, yi + 1) * (1 - ux) + hash(xi + 1, yi + 1) * ux) * uy; };
  const lean = hash(3, 9) * Math.PI * 2, lx = Math.cos(lean), ly = Math.sin(lean), rock = 0.25 + hash(5, 2) * 0.35;
  const img = c.getImageData(0, 0, cv.width, cv.height), d = img.data, w = cv.width, h = cv.height;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = d[i + 3];
      if (!a) continue;
      const u = x / w, v = y / h;
      const blotch = smooth(u * 7, v * 3.2) * 0.62 + smooth(u * 19 + 4, v * 9 + 4) * 0.38;
      const cover = ink * 1.3 - 0.42 + (blotch - 0.5) * 1.05 + (lx * (u - 0.5) * 2 + ly * (v - 0.5) * 2) * rock;
      let t = clamp(cover / 0.5, 0, 1); t = t * t * (3 - 2 * t);
      const fibre = hash(x, y), tooth = hash(Math.floor(x / 2) + 40, Math.floor(y / 2));
      let alpha = t * (0.8 + 0.2 * fibre);
      if (tooth < 0.05 + 0.2 * (1 - t)) alpha *= 0.25;
      const deep = 1 - 0.16 * t * blotch;
      d[i] = INK[0] * deep; d[i + 1] = INK[1] * deep; d[i + 2] = INK[2] * deep; d[i + 3] = a * alpha * 0.94;
    }
  }
  c.putImageData(img, 0, 0);
  return cv;
}

function Docket() {
  return (
    <div className="absolute inset-0 px-[18px] pt-[18px] text-[#3b3f46]">
      <div className="flex items-baseline justify-between border-b-[1.5px] border-[#3b3f46] pb-[7px]">
        <span className="font-serif text-[19px] italic leading-none text-[#22252b]">{DOCKET.title}</span>
        <span className="font-mono text-[9px] font-semibold tracking-[0.14em]">{DOCKET.number}</span>
      </div>
      <p className="mt-[7px] font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-[#6a6f78]">Alder &amp; Finch Editions</p>
      <ul className="m-0 mt-[9px] list-none p-0 font-serif text-[11.5px]">
        {DOCKET.lines.map((line) => (
          <li key={line} className="border-b border-dotted border-[#9aa0a8] py-[6px] leading-tight">{line}</li>
        ))}
      </ul>
      <p className="absolute bottom-[14px] left-[18px] font-mono text-[7.5px] uppercase tracking-[0.2em] text-[#8a8f98]">Status</p>
    </div>
  );
}

export default function RubberStampAndInkPad() {
  const [status, setStatus] = useState(0);
  const [scale, setScale] = useState(1);
  const [said, setSaid] = useState("");
  const statusRef = useRef(0);
  const root = useRef<HTMLElement>(null);
  const ground = useRef<HTMLDivElement>(null);
  const marker = useRef<(HTMLSpanElement | null)[]>([]);
  const stamp = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const prints = useRef<HTMLDivElement>(null);
  const wet = useRef<HTMLDivElement>(null);
  const api = useRef<{ press: () => void; fresh: () => void } | null>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const fit = () => setScale(clamp((node.clientWidth - 16) / SW, 0.56, 1.22));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const node = root.current, g = ground.current, st = stamp.current, hd = handle.current, sh = shadow.current, paper = sheet.current, layer = prints.current, dab = wet.current;
    if (!node || !g || !st || !hd || !sh || !paper || !layer || !dab) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pose = { ...PARK, sq: 0 };
    const s = { ink: 1, onSheet: 0, seed: 3, touched: false, seen: true, hover: false, tx: 0, ty: 0, busy: false, spot: 0, demo: 0 };
    const spots = [{ x: -62, y: 92, r: -7 }, { x: -96, y: 8, r: 5 }, { x: -54, y: -58, r: -3 }];

    const paint = () => {
      st.style.transform = `translate3d(${pose.x.toFixed(2)}px,${pose.y.toFixed(2)}px,${(pose.z + 4.6).toFixed(2)}px) rotateZ(${pose.r.toFixed(2)}deg)`;
      hd.style.transform = `translateZ(${MH}px) rotateZ(${(-TURN - pose.r).toFixed(2)}deg) rotateX(-90deg) scaleY(${(1 - pose.sq).toFixed(3)})`;
      const lift = Math.max(0, pose.z);
      sh.style.transform = `translate(${(pose.x + 9 + lift * 0.5).toFixed(2)}px,${(pose.y + 8 + lift * 0.3).toFixed(2)}px) rotate(${pose.r.toFixed(2)}deg)`;
      sh.style.opacity = (0.5 - lift * 0.003).toFixed(3);
      // Resting, the shadow is the tight one; in the air it gives way to the wide soft one.
      const air = clamp(lift / 16, 0, 1); (sh.children[0] as HTMLElement).style.opacity = (1 - air).toFixed(3); (sh.children[1] as HTMLElement).style.opacity = (0.6 * (1 - air * 0.6)).toFixed(3); (sh.children[2] as HTMLElement).style.opacity = air.toFixed(3);
    };

    const queue: Seg[] = [];
    let cur: (Seg & { t: number }) | null = null, raf = 0, last = 0;
    const glide = (to: () => { x: number; y: number; z: number; r: number }, dur: number, arc = 0): Seg => {
      let a = { ...pose }, b = { ...pose };
      return { dur, start: () => { a = { ...pose }; b = { ...pose, ...to() }; }, step: (k) => { const e = inOut(k); pose.x = a.x + (b.x - a.x) * e; pose.y = a.y + (b.y - a.y) * e; pose.z = a.z + (b.z - a.z) * e + Math.sin(k * Math.PI) * arc; pose.r = a.r + (b.r - a.r) * e; } };
    };
    const drop = (floor: number, hit: () => void): Seg[] => [
      { dur: 105, start: () => { pose.sq = 0; }, step: (k) => { pose.z = HOVER + (floor - HOVER) * k * k; } },
      { dur: 95, start: hit, step: (k) => { pose.z = floor - 1.6 * Math.sin(k * Math.PI); pose.sq = 0.07 * Math.sin(k * Math.PI); } },
      { dur: 240, step: (k) => { const e = 1 - Math.pow(1 - k, 3); pose.z = floor + (HOVER - floor) * e; pose.sq = 0; pose.r += Math.sin(k * Math.PI * 2) * 0.12; } },
    ];
    const mark = (x: number, y: number, r: number) => {
      const word = statuses[statusRef.current].word, cv = impress(word, s.ink, s.seed++);
      cv.style.cssText = `position:absolute;left:${(x - PAPER.x - IW / 2).toFixed(1)}px;top:${(y - PAPER.y - IH / 2).toFixed(1)}px;width:${IW}px;height:${IH}px;transform:rotate(${r.toFixed(1)}deg);mix-blend-mode:multiply;`;
      layer.appendChild(cv);
      while (layer.childElementCount > 7) layer.removeChild(layer.firstElementChild as Element);
      s.ink *= FADE; s.onSheet++;
      setSaid(`${statuses[statusRef.current].note}. ${s.onSheet} on this sheet.`);
    };
    const reInk = (): Seg[] => [
      glide(() => ({ x: PAD.x + PAD.w / 2, y: PAD.y + PAD.h / 2, z: HOVER + PAD.z, r: 0 }), 300, 10),
      ...drop(PAD.z, () => { s.ink = 1; dab.style.transition = "none"; dab.style.opacity = "0.85"; }).map((seg, n) => (n === 2 ? { ...seg, start: () => { dab.style.transition = "opacity 1.6s ease-out"; dab.style.opacity = "0.25"; } } : seg)),
    ];
    const stampAt = (x: number, y: number, r: number) => {
      if (s.busy) return;
      s.busy = true;
      if (s.ink < 0.3) queue.push(...reInk());
      queue.push(
        glide(() => ({ x, y, z: HOVER, r }), 300, 12),
        ...drop(0, () => mark(x, y, r)),
        glide(() => ({ ...PARK, z: 0 }), 400, 34),
        { dur: 1, step: () => {}, end: () => { s.busy = false; } },
      );
      wake();
    };
    const freshSheet = () => {
      if (reduce) { layer.replaceChildren(); s.onSheet = 0; return; }
      paper.style.transition = "transform 0.5s cubic-bezier(0.5,0,0.8,0.4), opacity 0.22s ease-in 0.28s";
      paper.style.transform = "translate(-430px,60px) rotate(-16deg)"; paper.style.opacity = "0";
      window.setTimeout(() => { layer.replaceChildren(); s.onSheet = 0; paper.style.transition = "none"; paper.style.transform = "none"; paper.style.opacity = "1"; }, 520);
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(34, now - last); last = now;
      if (!cur && queue.length) { cur = { ...(queue.shift() as Seg), t: 0 }; cur.start?.(); }
      let live = false;
      if (cur) { cur.t += dt; const k = Math.min(1, cur.t / cur.dur); cur.step(k); if (k >= 1) { const done = cur; cur = null; done.end?.(); } live = true; }
      else if (!s.busy) {
        // Nothing queued: hang over the paper under the pointer, or settle back beside the pad.
        const to = s.hover ? { x: s.tx, y: s.ty, z: HOVER, r: -4 } : PARK, f = 1 - Math.pow(0.0006, dt / 1000);
        pose.x += (to.x - pose.x) * f; pose.y += (to.y - pose.y) * f; pose.z += (to.z - pose.z) * f; pose.r += (to.r - pose.r) * f;
        live = Math.abs(to.x - pose.x) + Math.abs(to.y - pose.y) + Math.abs(to.z - pose.z) > 0.05;
      }
      paint();
      if ((live || queue.length) && s.seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    // Screen point to a point on the desk. Three markers on the desk give the camera, whatever the scale.
    const toDesk = (cx: number, cy: number) => {
      const [o, a, b] = marker.current.map((m) => (m as HTMLSpanElement).getBoundingClientRect());
      const ax = (a.left - o.left) / 100, ay = (a.top - o.top) / 100, bx = (b.left - o.left) / 100, by = (b.top - o.top) / 100;
      const det = ax * by - bx * ay, px = cx - o.left, py = cy - o.top + HOVER * 0.4 * (Math.hypot(ax, ay) + Math.hypot(bx, by)) * 0.5;
      return { x: (px * by - py * bx) / det, y: (py * ax - px * ay) / det };
    };
    const onPaper = (p: { x: number; y: number }) => ({ x: clamp(p.x, PAPER.x + IW / 2 + 4, PAPER.x + PAPER.w - IW / 2 - 4), y: clamp(p.y, PAPER.y + 96, PAPER.y + PAPER.h - IH / 2 - 6) });
    const near = (p: { x: number; y: number }) => p.x > PAPER.x - 40 && p.x < PAPER.x + PAPER.w + 40 && p.y > PAPER.y - 40 && p.y < PAPER.y + PAPER.h + 40;
    const onMove = (e: PointerEvent) => { if (e.pointerType !== "mouse" || reduce) return; const p = toDesk(e.clientX, e.clientY); s.hover = near(p); if (s.hover) { s.touched = true; const q = onPaper(p); s.tx = q.x; s.ty = q.y; } wake(); };
    const onLeave = () => { s.hover = false; wake(); };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      const p = toDesk(e.clientX, e.clientY);
      if (!near(p)) return;
      s.touched = true;
      const q = onPaper(p), r = -9 + ((s.seed * 37) % 17);
      if (reduce) { mark(q.x, q.y, r); if (s.ink < 0.3) s.ink = 1; return; }
      stampAt(q.x, q.y, r);
    };
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    node.addEventListener("pointerdown", onDown);

    api.current = {
      press: () => { s.touched = true; const sp = spots[s.spot++ % spots.length]; if (reduce) { mark(sp.x, sp.y, sp.r); if (s.ink < 0.3) s.ink = 1; return; } stampAt(sp.x, sp.y, sp.r); },
      fresh: () => { s.touched = true; freshSheet(); },
    };
    paint();
    if (reduce) { mark(spots[0].x, spots[0].y, spots[0].r); s.spot = 1; }

    // Unattended, it stamps three times, takes a new sheet, moves to the next die and inks up when the red runs thin.
    const demo = () => {
      if (s.touched || reduce || !s.seen || document.hidden || s.busy) return;
      if (s.onSheet >= 3) { freshSheet(); statusRef.current = (statusRef.current + 1) % statuses.length; setStatus(statusRef.current); window.setTimeout(demo, 700); return; }
      const sp = spots[s.demo++ % spots.length];
      stampAt(sp.x, sp.y, sp.r);
    };
    const first = window.setTimeout(demo, 240);
    const loop = window.setInterval(demo, 2700);
    const io = new IntersectionObserver(([entry]) => { s.seen = entry.isIntersecting; if (s.seen) wake(); });
    io.observe(node);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); window.clearTimeout(first); window.clearInterval(loop); api.current = null; io.disconnect();
      node.removeEventListener("pointermove", onMove); node.removeEventListener("pointerleave", onLeave); node.removeEventListener("pointerdown", onDown);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const choose = (i: number) => { statusRef.current = i; setStatus(i); };
  const ink = `rgb(${INK.join(",")})`;
  const beech = "repeating-linear-gradient(90deg,rgba(120,66,18,0.07) 0 1px,rgba(120,66,18,0) 1px 9px,rgba(120,66,18,0.04) 9px 11px,rgba(120,66,18,0) 11px 23px),repeating-linear-gradient(90deg,rgba(255,240,210,0.1) 0 3px,rgba(255,240,210,0) 3px 17px)";
  const tin = "linear-gradient(180deg,#f3f5f6 0%,#c3c9ce 14%,#9aa1a8 52%,#70777e 100%)";
  const sheetEdge: string[] = [];
  for (let i = 1; i <= 6; i++) sheetEdge.push(`${(-i * 0.5).toFixed(1)}px ${i}px 0 ${i % 2 ? "#c9ced2" : "#f4f5f4"}`);

  return (
    <section
      ref={root}
      className="relative flex min-h-[640px] w-full select-none flex-col items-center justify-center overflow-hidden bg-[#a9b9bf] px-2 py-10 sm:min-h-[740px]"
      style={{ backgroundImage: "radial-gradient(100% 78% at 40% 30%,#c6d2d6 0%,#a9b9bf 55%,#8799a0 100%)" }}
    >
      <div style={{ width: SW * scale, height: SH * scale }}>
        <div className="relative" style={{ width: SW, height: SH, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          <div ref={ground} className="absolute" style={{ left: OX, top: OY, width: 0, height: 0, transformStyle: "preserve-3d", transform: `rotateX(${TIP}deg) rotateZ(${TURN}deg)` }}>
            {[[0, 0], [100, 0], [0, 100]].map(([x, y], i) => (
              <span key={i} ref={(el) => { marker.current[i] = el; }} aria-hidden="true" className="absolute block h-0 w-0" style={{ left: x, top: y }} />
            ))}

            {/* everything that lies flat on the desk is one layer, so the browser never has to sort it against the solid objects */}
            <div className="absolute left-0 top-0 h-0 w-0" style={{ transform: "translateZ(0)" }}>
            <div aria-hidden="true" className="absolute rounded-[6px] bg-[#1c2b32]" style={{ left: PAPER.x + 3, top: PAPER.y + 6, width: PAPER.w + 8, height: PAPER.h + 8, filter: "blur(9px)", opacity: 0.4 }} />
            <div aria-hidden="true" className="absolute rounded-[10px] bg-[#1c2b32]" style={{ left: PAD.x + 10, top: PAD.y - 30, width: PAD.w + 34, height: PAD.h + 44, filter: "blur(11px)", opacity: 0.42 }} />

            {/* a few sheets, the top one loose */}
            <div className="absolute cursor-pointer" style={{ left: PAPER.x, top: PAPER.y, width: PAPER.w, height: PAPER.h }}>
              <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[2px]" style={{ background: "linear-gradient(150deg,#fdfdfb 0%,#f3f3ef 100%)", boxShadow: sheetEdge.join(",") }}>
                <Docket />
              </div>
              <div ref={sheet} className="absolute inset-0 overflow-hidden rounded-[2px]" style={{ background: "linear-gradient(150deg,#ffffff 0%,#f8f8f4 55%,#eeeeea 100%)", boxShadow: "0 0 0 0.5px rgba(40,50,56,0.18)" }}>
                <Docket />
                <div ref={prints} aria-hidden="true" className="absolute inset-0" />
              </div>
            </div>

            {/* shadow of the stamp */}
            <div ref={shadow} aria-hidden="true" className="pointer-events-none absolute" style={{ left: -MW / 2, top: -MD / 2, width: MW, height: MD, transformOrigin: "50% 50%" }}>
              <div className="absolute rounded-[6px]" style={{ inset: 5, background: "#16242b", boxShadow: "0 0 6px 1px #16242b" }} />
              <div className="absolute rounded-full" style={{ background: "#16242b", left: MW / 2 - 40, top: MD / 2 - 24, width: 140, height: 26, opacity: 0.6, transformOrigin: "0 50%", transform: "rotate(27deg)", boxShadow: "0 0 10px 2px #16242b" }} />
              <div className="absolute" style={{ left: -34, top: -30, width: MW + 68, height: MD + 60, opacity: 0, background: "radial-gradient(closest-side,rgba(22,36,43,0.95) 0%,rgba(22,36,43,0.8) 42%,rgba(22,36,43,0.3) 74%,rgba(22,36,43,0) 100%)" }} />
            </div>
            </div>

            {/* ink pad: tin, felt and the lid standing open behind */}
            <div aria-hidden="true" className="absolute" style={{ left: PAD.x, top: PAD.y, width: PAD.w, height: PAD.h, transformStyle: "preserve-3d" }}>
              <div className="absolute left-0 rounded-[7px]" style={{ top: -PAD.h, width: PAD.w, height: PAD.h, transformOrigin: "50% 100%", transform: "rotateX(-76deg)", background: "linear-gradient(180deg,#eef1f3 0%,#b9c0c6 30%,#dfe3e6 58%,#8f979e 100%)", boxShadow: "inset 0 0 0 5px rgba(255,255,255,0.35), inset 0 0 0 6px rgba(70,80,88,0.35)" }}>
                <div className="absolute inset-[9px] rounded-[4px]" style={{ background: "linear-gradient(200deg,#d6dbdf 0%,#a8b0b7 60%,#c9cfd4 100%)", boxShadow: "inset 0 2px 5px rgba(40,50,58,0.45)" }} />
              </div>
              <div className="absolute" style={{ left: 0, top: PAD.h - PAD.z, width: PAD.w, height: PAD.z, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", background: tin, borderRadius: "0 0 5px 5px" }} />
              <div className="absolute" style={{ left: -PAD.z, top: 0, width: PAD.z, height: PAD.h, transformOrigin: "100% 50%", transform: "rotateY(90deg)", background: "linear-gradient(90deg,#f3f5f6 0%,#b3bac0 16%,#868d94 55%,#5f666d 100%)" }} />
              <div className="absolute inset-0 rounded-[7px]" style={{ transform: `translateZ(${PAD.z}px)`, background: "linear-gradient(140deg,#f6f8f9 0%,#c3c9ce 40%,#e6e9eb 62%,#9aa1a8 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.7)" }}>
                <div className="absolute inset-[7px] overflow-hidden rounded-[3px]" style={{ background: `radial-gradient(120% 90% at 28% 18%,rgba(255,255,255,0.22),rgba(255,255,255,0) 55%),linear-gradient(160deg,rgba(0,0,0,0.18),rgba(0,0,0,0.42)),${ink}`, boxShadow: "inset 0 2px 4px rgba(40,0,0,0.75), inset 0 -1px 0 rgba(255,255,255,0.18)" }}>
                  <div className="absolute inset-0 opacity-30" style={{ background: "repeating-linear-gradient(0deg,rgba(0,0,0,0.2) 0 1px,rgba(0,0,0,0) 1px 2px),repeating-linear-gradient(90deg,rgba(0,0,0,0.2) 0 1px,rgba(0,0,0,0) 1px 2px)" }} />
                  <div ref={wet} className="absolute left-1/2 top-1/2 rounded-[3px]" style={{ width: 96, height: 48, marginLeft: -48, marginTop: -24, opacity: 0.25, background: "linear-gradient(150deg,rgba(255,255,255,0.3),rgba(60,0,0,0.6) 40%,rgba(40,0,0,0.75))", boxShadow: "0 0 5px rgba(40,0,0,0.6)" }} />
                </div>
              </div>
            </div>

            {/* the stamp */}
            <div ref={stamp} aria-hidden="true" className="pointer-events-none absolute" style={{ left: 0, top: 0, width: 0, height: 0, transformStyle: "preserve-3d" }}>
              {/* left end and front of the mount, rubber underneath */}
              <div className="absolute" style={{ left: -MW / 2 - MH, top: -MD / 2, width: MH, height: MD, transformOrigin: "100% 50%", transform: "rotateY(90deg)", background: `linear-gradient(90deg,rgba(0,0,0,0.05),rgba(0,0,0,0.28)),linear-gradient(90deg,#c99e68 0 ${MH - RUB - 1}px,#3a1512 ${MH - RUB - 1}px ${MH - RUB}px,#7a1f22 ${MH - RUB}px 100%)` }} />
              <div className="absolute overflow-hidden" style={{ left: -MW / 2, top: MD / 2 - MH, width: MW, height: MH, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", background: `linear-gradient(180deg,rgba(255,255,255,0.3) 0,rgba(255,255,255,0) 5px),${beech},linear-gradient(180deg,#e6c08a 0 ${MH - RUB - 1}px,#3a1512 ${MH - RUB - 1}px ${MH - RUB}px,#9b2a2c ${MH - RUB}px 100%)` }}>
                <div className="absolute left-0 w-full" style={{ bottom: 0, height: RUB, background: "linear-gradient(180deg,#8f2426,#6a1719)" }} />
                <div className="absolute flex items-center justify-center rounded-[1.5px] font-black uppercase leading-none" style={{ left: 22, top: 5, width: MW - 44, height: 19, color: ink, fontSize: 12.5, letterSpacing: "0.22em", background: "linear-gradient(180deg,#fdfcf8,#ece9e0)", boxShadow: "0 0 0 1px rgba(90,50,14,0.5), 0 1px 0 1.5px rgba(255,255,255,0.3), inset 0 0 0 1.5px rgba(198,38,44,0.3)", fontFamily: "'Arial Narrow','Helvetica Neue',Helvetica,Arial,sans-serif" }}>
                  {statuses[status].word}
                </div>
              </div>
              {/* top of the mount */}
              <div className="absolute rounded-[2px]" style={{ left: -MW / 2, top: -MD / 2, width: MW, height: MD, transform: `translateZ(${MH}px)`, background: `linear-gradient(118deg,rgba(255,255,255,0.5) 0%,rgba(255,255,255,0.06) 30%,rgba(255,255,255,0) 60%,rgba(80,40,6,0.14) 100%),${beech},#efcd9b`, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4)" }}>
                <div className="absolute left-1/2 top-1/2 rounded-full" style={{ width: 86, height: 46, marginLeft: -36, marginTop: -25, background: "radial-gradient(closest-side,rgba(50,24,4,0.55),rgba(50,24,4,0))" }} />
                <div className="absolute left-1/2 top-1/2 rounded-full" style={{ width: 46, height: 46, marginLeft: -23, marginTop: -23, background: "radial-gradient(circle at 36% 30%,#fff3c4 0%,#d7b25a 34%,#8a6722 78%,#5b4212 100%)", boxShadow: "0 1px 0 rgba(255,255,255,0.5), 0 2px 3px rgba(40,18,0,0.5)" }} />
              </div>
              {/* the turned handle always faces the camera */}
              <div ref={handle} className="absolute" style={{ left: -37, top: -138, width: 74, height: 138, transformOrigin: "50% 100%" }}>
                <svg width="74" height="138" viewBox="0 0 72 130" preserveAspectRatio="none" className="block overflow-visible">
                  <defs>
                    <linearGradient id="rubber-stamp-pad-lacquer" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0.14" stopColor="#050506" /><stop offset="0.27" stopColor="#3c3c44" /><stop offset="0.36" stopColor="#8b8b96" /><stop offset="0.43" stopColor="#26262b" /><stop offset="0.66" stopColor="#0d0d0f" /><stop offset="0.8" stopColor="#2e2e35" /><stop offset="0.87" stopColor="#060607" />
                    </linearGradient>
                    <linearGradient id="rubber-stamp-pad-brass" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0.24" stopColor="#6b4f17" /><stop offset="0.38" stopColor="#fff0bd" /><stop offset="0.5" stopColor="#cfa64c" /><stop offset="0.72" stopColor="#8a6722" /><stop offset="0.8" stopColor="#e3c373" /><stop offset="0.86" stopColor="#5b4212" />
                    </linearGradient>
                    <linearGradient id="rubber-stamp-pad-fall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity="0.2" /><stop offset="0.25" stopColor="#ffffff" stopOpacity="0" /><stop offset="0.8" stopColor="#000000" stopOpacity="0" /><stop offset="1" stopColor="#000000" stopOpacity="0.5" /></linearGradient>
                    <filter id="rubber-stamp-pad-glint" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.1" /></filter>
                    <clipPath id="rubber-stamp-pad-shape"><path d="M36 2C50 2 58 12 57 24C56 33 50 37 50 41C50 48 61 52 61 64C61 76 53 84 51 94C49.5 101 48 104 48 106L51 112C52 120 58 124 59 130L13 130C14 124 20 120 21 112L24 106C24 104 22.5 101 21 94C19 84 11 76 11 64C11 52 22 48 22 41C22 37 16 33 15 24C14 12 22 2 36 2Z" /></clipPath>
                  </defs>
                  <g clipPath="url(#rubber-stamp-pad-shape)">
                    <rect width="72" height="130" fill="url(#rubber-stamp-pad-lacquer)" />
                    <rect width="72" height="130" fill="url(#rubber-stamp-pad-fall)" />
                    <ellipse cx="36" cy="40.5" rx="16" ry="2.4" fill="#000" opacity="0.6" />
                    <rect x="10" y="104.5" width="52" height="8.5" fill="url(#rubber-stamp-pad-brass)" />
                    <rect x="10" y="104.5" width="52" height="0.8" fill="#fff6d0" opacity="0.7" />
                    <rect x="10" y="112.2" width="52" height="1" fill="#000" opacity="0.6" />
                    <g filter="url(#rubber-stamp-pad-glint)" fill="none" stroke="#fff" strokeLinecap="round">
                      <path d="M26.5 9C22.5 13 21.5 20 23 27" strokeWidth="3.4" opacity="0.95" />
                      <path d="M22.5 53C18.5 60 19.5 72 25 83" strokeWidth="3.2" opacity="0.9" />
                      <path d="M27.5 116C26.5 121 23 125 21 128" strokeWidth="2.2" opacity="0.7" />
                      <path d="M52 56C55 62 54.5 72 50 82" strokeWidth="1.4" opacity="0.4" />
                      <path d="M50 12C52.5 17 52.5 23 50.5 28" strokeWidth="1.2" opacity="0.4" />
                    </g>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-2 flex w-full max-w-[520px] flex-wrap items-center justify-center gap-x-2 gap-y-3">
        <div role="radiogroup" aria-label="Stamp" className="flex items-center gap-1 rounded-full bg-[#1f2c32]/10 p-1">
          {statuses.map((st, i) => (
            <button
              key={st.word}
              type="button"
              role="radio"
              aria-checked={status === i}
              onClick={() => choose(i)}
              className={`h-10 rounded-full px-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#1f2c32] motion-reduce:transition-none ${status === i ? "bg-[#fbfbf8] text-[#a31d24] shadow-[0_1px_2px_rgba(20,30,36,0.35)]" : "text-[#1f2c32] hover:bg-white/40"}`}
            >
              {st.word}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => api.current?.press()} className="h-11 rounded-full bg-[#1f2c32] px-6 font-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-white outline-none transition-transform duration-150 hover:bg-[#121b1f] focus-visible:ring-2 focus-visible:ring-[#1f2c32] focus-visible:ring-offset-2 focus-visible:ring-offset-[#a9b9bf] active:scale-95 motion-reduce:transition-none">
          Stamp
        </button>
        <button type="button" onClick={() => api.current?.fresh()} className="h-11 rounded-full px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1f2c32] underline decoration-[#1f2c32]/40 underline-offset-4 outline-none hover:decoration-[#1f2c32] focus-visible:ring-2 focus-visible:ring-[#1f2c32]">
          New sheet
        </button>
      </div>
      <p className="sr-only" aria-live="polite">{said}</p>
    </section>
  );
}
