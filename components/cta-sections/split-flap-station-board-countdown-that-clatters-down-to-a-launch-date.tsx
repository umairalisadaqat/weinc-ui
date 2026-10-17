import { useEffect, useRef, useState } from "react";

// When the countdown ends, in the visitor's local time ("2027-03-01T09:00:00").
// Left empty, or once the date has passed, the board counts to DEMO_DAYS after the first view.
const TARGET = "";
const DEMO_DAYS = 12.3212;
// The top row turns through these. Twelve characters at most, capitals, digits and spaces.
const messages = ["LAUNCHING IN", "ATLAS TWO", "ALL ABOARD"];
const EVENT = "Atlas Two";

const W = 860, H = 560, OX = 50; // drawing size and the left margin kept for the shadow; the canvas scales to its box
const L_DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:"; // order of the flaps on a letter drum
const D_DRUM = "9876543210"; // number drums are wound backwards, so counting down is one flap forward
const SIZES = [[50, 62], [70, 104], [37, 48]]; // flap width and height for the message, number and date rows
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

type Cell = { x: number; y: number; kind: number; n: number; shown: number; next: number; goal: number; left: number; p: number; dur: number; wait: number; kicked: number };
const pad2 = (v: number) => String(v).padStart(2, "0");
const mod = (a: number, n: number) => ((a % n) + n) % n;
const centre = (text: string, width: number) => { const t = text.slice(0, width); const l = Math.floor((width - t.length) / 2); return (" ".repeat(l) + t).padEnd(width, " "); };
const split = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return { d: Math.min(99, Math.floor(s / 86400)), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 }; };

export default function SplitFlapStationBoardCountdown() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ shuffle: (x: number, y: number) => void } | null>(null);
  const [info, setInfo] = useState<{ left: number; when: string } | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const parsed = TARGET ? new Date(TARGET).getTime() : NaN;
    const end = Number.isFinite(parsed) && parsed > Date.now() ? parsed : Math.ceil((Date.now() + DEMO_DAYS * 86400000) / 3600000) * 3600000;
    const ed = new Date(end);
    const dateLine = `${DAYS[ed.getDay()]} ${pad2(ed.getDate())} ${MONTHS[ed.getMonth()]} ${pad2(ed.getHours())}:${pad2(ed.getMinutes())}`;
    const when = `${DAYS[ed.getDay()]} ${ed.getDate()} ${MONTHS[ed.getMonth()]}, ${pad2(ed.getHours())}:${pad2(ed.getMinutes())}`;

    // Every flap position on the board.
    const cells: Cell[] = [];
    const row = (kind: number, count: number, x0: number, y: number, gap: number, pairGap: number) => {
      const drum = kind === 1 ? D_DRUM : L_DRUM;
      let x = x0;
      for (let i = 0; i < count; i++) {
        cells.push({ x: x + OX, y, kind, n: drum.length, shown: kind === 1 ? (i * 7 + 3) % 10 : 0, next: 0, goal: 0, left: 0, p: -1, dur: 60, wait: 0, kicked: 0 });
        x += SIZES[kind][0] + (pairGap && i % 2 === 1 ? pairGap : gap);
      }
    };
    row(0, 12, 52.5, 134, 5, 0);
    row(1, 8, 51, 212, 5, 26);
    row(2, 16, 54, 352, 4, 0);
    const top = cells.slice(0, 12), nums = cells.slice(12, 20), date = cells.slice(20);

    const aim = (c: Cell, idx: number, spin: number, wait: number) => {
      if (reduce) { c.shown = idx; c.goal = idx; c.left = 0; c.p = -1; return; }
      const flying = c.p >= 0;
      const fwd = mod(idx - (flying ? c.next : c.shown), c.n);
      c.goal = idx;
      c.left = (c.kind === 1 ? (fwd === 0 && spin ? c.n : fwd) : fwd === 0 && !spin ? 0 : Math.max(1, spin)) + (flying ? 1 : 0);
      if (!flying) c.wait = wait;
    };
    const write = (set: Cell[], text: string, spin: number, stagger: number, base: number) =>
      set.forEach((c, i) => { const idx = Math.max(0, (c.kind === 1 ? D_DRUM : L_DRUM).indexOf(text[i] || " ")); if (idx !== c.goal || spin) aim(c, idx, spin ? spin + (i % 3) : 0, base + i * stagger); });

    let S = 1, bg: HTMLCanvasElement | null = null;
    let atlas: { a: HTMLCanvasElement; tw: number; th: number }[] = [];
    const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };

    // One flap card: matt black, a hinge across the middle, the pins that carry it at either side.
    const paintFlap = (g: CanvasRenderingContext2D, w: number, h: number, ch: string) => {
      rr(g, 0, 0, w, h, Math.min(4, w * 0.08)); g.save(); g.clip();
      const a = g.createLinearGradient(0, 0, 0, h / 2); a.addColorStop(0, "#303135"); a.addColorStop(1, "#1f2023");
      g.fillStyle = a; g.fillRect(0, 0, w, h / 2);
      const b = g.createLinearGradient(0, h / 2, 0, h); b.addColorStop(0, "#111213"); b.addColorStop(0.22, "#1b1c1e"); b.addColorStop(1, "#27282b");
      g.fillStyle = b; g.fillRect(0, h / 2, w, h / 2);
      const px = h * 0.74;
      g.font = `700 ${px}px "Helvetica Neue", Helvetica, Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "alphabetic";
      const squeeze = Math.min(0.88, (w * 0.76) / Math.max(1, g.measureText(ch).width));
      g.save(); g.translate(w / 2, h / 2 + px * 0.36); g.scale(squeeze, 1); g.fillStyle = "#f4f0e4"; g.fillText(ch, 0, 0); g.restore();
      g.fillStyle = "#050506"; g.fillRect(0, h / 2 - 0.9, w, 1.8);
      g.fillStyle = "rgba(255,255,255,0.09)"; g.fillRect(0, h / 2 + 0.9, w, 0.8);
      g.fillStyle = "rgba(255,255,255,0.16)"; g.fillRect(0, 0, w, 0.9);
      g.fillStyle = "#050506"; g.fillRect(0, h / 2 - h * 0.055, w * 0.05, h * 0.11); g.fillRect(w * 0.95, h / 2 - h * 0.055, w * 0.05, h * 0.11);
      g.restore();
    };

    const build = () => {
      const box = cv.getBoundingClientRect();
      S = (Math.max(280, box.width) / W) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * S); cv.height = Math.round(H * S);
      atlas = SIZES.map(([cw, ch], kind) => {
        const drum = kind === 1 ? D_DRUM : L_DRUM, tw = Math.round(cw * S), th = Math.round((ch * S) / 2) * 2;
        const a = document.createElement("canvas"); a.width = tw * drum.length; a.height = th;
        const g = a.getContext("2d");
        if (g) for (let i = 0; i < drum.length; i++) { g.save(); g.translate(i * tw, 0); g.scale(tw / cw, th / ch); paintFlap(g, cw, ch, drum[i]); g.restore(); }
        return { a, tw, th };
      });

      // The housing never changes, so it is painted once.
      bg = document.createElement("canvas"); bg.width = cv.width; bg.height = cv.height;
      const g = bg.getContext("2d");
      if (!g) return;
      g.scale(S, S); g.translate(OX, 0);
      // Shadow on the wall behind the board.
      const OFF = 4000;
      g.save(); g.shadowColor = "rgba(48,40,26,0.4)"; g.shadowBlur = 34 * S; g.shadowOffsetX = OFF * S; g.shadowOffsetY = 34 * S; rr(g, 40 - OFF, 96, 680, 338, 14); g.fill(); g.restore();
      g.save(); g.shadowColor = "rgba(40,32,20,0.5)"; g.shadowBlur = 12 * S; g.shadowOffsetX = OFF * S; g.shadowOffsetY = 9 * S; rr(g, 24 - OFF, 74, 712, 360, 12); g.fill(); g.restore();
      // Two rods to the ceiling.
      for (const x of [150, 610]) {
        const rod = g.createLinearGradient(x - 5, 0, x + 5, 0); rod.addColorStop(0, "#3a3c40"); rod.addColorStop(0.35, "#b9bcc1"); rod.addColorStop(0.55, "#74777c"); rod.addColorStop(1, "#1e2023");
        g.fillStyle = rod; g.fillRect(x - 5, 0, 10, 72);
        const col = g.createLinearGradient(x - 12, 0, x + 12, 0); col.addColorStop(0, "#26282b"); col.addColorStop(0.35, "#8d9096"); col.addColorStop(1, "#141517");
        g.fillStyle = col; rr(g, x - 12, 60, 24, 12, 2); g.fill();
      }
      // Steel body with a brushed grain.
      rr(g, 20, 70, 720, 364, 12);
      const body = g.createLinearGradient(0, 70, 0, 434); body.addColorStop(0, "#3a3d41"); body.addColorStop(0.12, "#2b2d31"); body.addColorStop(1, "#1b1c1f");
      g.fillStyle = body; g.fill();
      g.save(); g.clip();
      let seed = 11; const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let y = 70; y < 434; y += 0.7) { const v = rand(); g.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.07})` : `rgba(0,0,0,${(0.5 - v) * 0.16})`; g.fillRect(20 + rand() * 60, y, 720, 0.6); }
      const wash = g.createRadialGradient(380, 40, 20, 380, 70, 460); wash.addColorStop(0, "rgba(255,244,222,0.16)"); wash.addColorStop(1, "rgba(255,244,222,0)");
      g.fillStyle = wash; g.fillRect(20, 70, 720, 364);
      g.restore();
      g.lineWidth = 1; g.strokeStyle = "#0b0c0d"; rr(g, 20.5, 70.5, 719, 363, 12); g.stroke();
      const lip = g.createLinearGradient(0, 70, 0, 434); lip.addColorStop(0, "rgba(255,255,255,0.5)"); lip.addColorStop(0.08, "rgba(255,255,255,0.05)"); lip.addColorStop(0.9, "rgba(0,0,0,0)"); lip.addColorStop(1, "rgba(0,0,0,0.5)");
      g.strokeStyle = lip; g.lineWidth = 1.2; rr(g, 21.6, 71.6, 716.8, 360.8, 11); g.stroke();
      // The window the flaps sit in.
      rr(g, 38, 118, 684, 298, 7); g.fillStyle = "#08090a"; g.fill();
      g.save(); g.clip();
      const inner = g.createLinearGradient(0, 118, 0, 150); inner.addColorStop(0, "rgba(0,0,0,0.95)"); inner.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = "#101113"; g.fillRect(38, 118, 684, 298); g.fillStyle = inner; g.fillRect(38, 118, 684, 32);
      g.restore();
      g.lineWidth = 1; g.strokeStyle = "rgba(255,255,255,0.16)"; g.beginPath(); g.moveTo(44, 416.5); g.lineTo(716, 416.5); g.stroke();
      g.strokeStyle = "rgba(0,0,0,0.9)"; rr(g, 37.5, 117.5, 685, 299, 7); g.stroke();
      // Printed legends.
      g.textBaseline = "middle"; g.fillStyle = "rgba(240,236,224,0.86)";
      const spaced = (text: string, x: number, y: number, gap: number, align: number) => { let w = 0; for (const ch of text) w += g.measureText(ch).width + gap; let cx = x - (w - gap) * align; g.textAlign = "left"; for (const ch of text) { g.fillText(ch, cx, y); cx += g.measureText(ch).width + gap; } };
      g.font = '700 12px "Helvetica Neue", Helvetica, Arial, sans-serif'; spaced("DEPARTURES", 56, 95, 3.2, 0);
      g.fillStyle = "rgba(240,236,224,0.5)"; g.font = '600 10px "Helvetica Neue", Helvetica, Arial, sans-serif'; spaced("TRACK 2", 690, 95, 2.4, 1);
      g.fillStyle = "rgba(240,236,224,0.62)"; g.font = '600 9.5px "Helvetica Neue", Helvetica, Arial, sans-serif';
      ["DAYS", "HOURS", "MINUTES", "SECONDS"].forEach((label, i) => spaced(label, 51 + 72.5 + i * 171, 334, 2.6, 0.5));
      // Slot-head screws in the corners.
      for (const [x, y, a] of [[36, 86, 0.5], [724, 86, 2.2], [36, 422, 1.4], [724, 422, 0.2]]) {
        const sc = g.createRadialGradient(x - 1.5, y - 1.5, 0.5, x, y, 5.5); sc.addColorStop(0, "#d9dbde"); sc.addColorStop(0.6, "#7c7f85"); sc.addColorStop(1, "#2a2c2f");
        g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fillStyle = sc; g.fill(); g.lineWidth = 0.8; g.strokeStyle = "rgba(0,0,0,0.8)"; g.stroke();
        g.lineWidth = 1.3; g.strokeStyle = "rgba(10,10,12,0.85)"; g.beginPath(); g.moveTo(x - Math.cos(a) * 3.6, y - Math.sin(a) * 3.6); g.lineTo(x + Math.cos(a) * 3.6, y + Math.sin(a) * 3.6); g.stroke();
      }
      // Wells behind each flap, with the edges of the waiting cards showing above it.
      for (const c of cells) {
        const [cw, ch] = SIZES[c.kind];
        const x = c.x - OX;
        g.fillStyle = "#000"; rr(g, x - 1.5, c.y - 5, cw + 3, ch + 8, 4); g.fill();
        for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(255,255,255,${0.1 - k * 0.028})`; g.fillRect(x + 1 + k, c.y - 1.6 - k * 1.3, cw - 2 - k * 2, 0.7); }
      }
    };

    const draw = (t: number) => {
      if (!bg) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(bg, 0, 0);
      for (const c of cells) {
        const { a, tw, th } = atlas[c.kind], hh = th / 2, x = Math.round(c.x * S), y = Math.round(c.y * S);
        if (c.p < 0) { ctx.drawImage(a, c.shown * tw, 0, tw, th, x, y, tw, th); continue; }
        ctx.drawImage(a, c.next * tw, 0, tw, hh, x, y, tw, hh);
        ctx.drawImage(a, c.shown * tw, hh, tw, hh, x, y + hh, tw, hh);
        const e = c.p * c.p * (1.6 - 0.6 * c.p); // the card speeds up as it falls
        if (e < 0.5) {
          const k = Math.cos(e * Math.PI), fh = Math.max(1, hh * k);
          ctx.fillStyle = `rgba(0,0,0,${0.5 * (1 - k)})`; ctx.fillRect(x, y + hh, tw, hh * (1 - k) * 0.9);
          ctx.drawImage(a, c.shown * tw, 0, tw, hh, x - (1 - k) * S, y + hh - fh, tw + (1 - k) * 2 * S, fh);
          ctx.fillStyle = `rgba(255,255,255,${0.1 * (1 - k)})`; ctx.fillRect(x, y + hh - fh, tw, fh);
        } else {
          const k = -Math.cos(e * Math.PI), fh = Math.max(1, hh * k);
          ctx.drawImage(a, c.next * tw, hh, tw, hh, x - (1 - k) * S, y + hh, tw + (1 - k) * 2 * S, fh);
          ctx.fillStyle = `rgba(0,0,0,${0.55 * (1 - k)})`; ctx.fillRect(x, y + hh, tw, fh);
        }
      }
      ctx.setTransform(S, 0, 0, S, OX * S, 0);
      // The amber lamp that says the board is live.
      const on = reduce ? 1 : 0.6 + 0.4 * Math.sin(t / 520);
      ctx.beginPath(); ctx.arc(706, 95, 5.4, 0, Math.PI * 2); ctx.fillStyle = "#070708"; ctx.fill();
      ctx.save(); ctx.shadowColor = "#ffab2e"; ctx.shadowBlur = 16 * on * S; ctx.globalAlpha = 0.3 + 0.7 * on;
      ctx.beginPath(); ctx.arc(706, 95, 3.6, 0, Math.PI * 2); ctx.fillStyle = "#ffb13b"; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(704.8, 93.8, 1.1, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fill();
      // A pane of glass over the window.
      const glass = ctx.createLinearGradient(120, 118, 420, 416); glass.addColorStop(0, "rgba(255,255,255,0.075)"); glass.addColorStop(0.42, "rgba(255,255,255,0.02)"); glass.addColorStop(0.43, "rgba(255,255,255,0)"); glass.addColorStop(1, "rgba(255,255,255,0.03)");
      ctx.fillStyle = glass; rr(ctx, 38, 118, 684, 298, 7); ctx.fill();
    };

    let msg = 0, lastDigits = "", lastSec = -1, raf = 0, last = 0, t0 = 0, seen = true, nextMsg = 5200, touched = -1e9;
    const sync = (first: boolean) => {
      const leftMs = end - Date.now(), v = split(leftMs), digits = pad2(v.d) + pad2(v.h) + pad2(v.m) + pad2(v.s);
      if (digits !== lastDigits) { lastDigits = digits; nums.forEach((c, i) => aim(c, D_DRUM.indexOf(digits[i]), 0, first ? 160 + i * 46 : 0)); }
      const sec = Math.floor(Math.max(0, leftMs) / 1000);
      if (sec !== lastSec) { lastSec = sec; setInfo({ left: sec, when }); }
    };
    const step = (dt: number) => {
      for (const c of cells) {
        if (c.p < 0) {
          if (c.left <= 0) continue;
          if (c.wait > 0) { c.wait -= dt; continue; }
          c.next = mod(c.goal - (c.left - 1), c.n); c.p = 0; c.dur = c.left > 1 ? 52 + ((c.x * 7) % 16) : 150;
        }
        c.p += dt / c.dur;
        if (c.p >= 1) { c.shown = c.next; c.left -= 1; c.p = -1; }
      }
    };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(50, now - last); last = now;
      const t = now - t0;
      sync(false);
      if (t > nextMsg && now - touched > 2500) { msg = (msg + 1) % messages.length; write(top, centre(messages[msg], 12), 5, 34, 0); nextMsg = t + 5200; }
      step(dt); draw(t);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    build();
    write(top, centre(messages[0], 12), 6, 26, 40);
    write(date, centre(dateLine, 16), 5, 20, 330);
    sync(true);
    let timer = 0;
    if (reduce) { draw(0); timer = window.setInterval(() => { sync(false); draw(0); }, 1000); } else wake();

    const at = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); return [((e.clientX - b.left) / b.width) * W, ((e.clientY - b.top) / b.height) * H]; };
    const onMove = (e: PointerEvent) => {
      if (reduce) return;
      const [px, py] = at(e), now = performance.now();
      for (const c of cells) {
        if (c.kind === 1 || c.left > 0 || now - c.kicked < 900) continue;
        const [cw, ch] = SIZES[c.kind];
        if (Math.hypot(c.x + cw / 2 - px, c.y + ch / 2 - py) < 46) { c.kicked = now; touched = now; aim(c, c.goal, 4, 0); }
      }
    };
    api.current = {
      shuffle: (px, py) => {
        touched = performance.now();
        for (const c of cells) { const [cw, ch] = SIZES[c.kind]; if (c.left <= 0) aim(c, c.goal, c.kind === 1 ? 1 : 7, Math.hypot(c.x + cw / 2 - px, c.y + ch / 2 - py) * 1.1); }
        wake();
      },
    };
    const onDown = (e: PointerEvent) => { const [px, py] = at(e); api.current?.shuffle(px, py); };
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerdown", onDown);
    const ro = new ResizeObserver(() => { build(); if (reduce) draw(0); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); window.clearInterval(timer); api.current = null;
      cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerdown", onDown);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const v = info ? split(info.left * 1000) : null;
  return (
    <div className="flex min-h-[520px] w-full flex-col items-center justify-start bg-[#d9d5cb] bg-[radial-gradient(90%_70%_at_50%_0%,#ebe8e0_0%,#d9d5cb_55%,#c9c4b8_100%)] px-4 pb-12 sm:min-h-[760px] sm:px-8">
      <button
        type="button"
        aria-label="Shuffle the departure board"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); api.current?.shuffle(430, 250); } }}
        className="block w-full max-w-[1010px] cursor-pointer touch-manipulation rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-4 focus-visible:ring-offset-[#d9d5cb]"
      >
        <canvas ref={canvas} aria-hidden="true" className="block aspect-[860/560] w-full" />
      </button>
      <p role="timer" className="-mt-3 min-h-[20px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-stone-600 sm:-mt-12">
        <span className="text-stone-900">{EVENT} leaves {info ? info.when : "soon"}</span>
        <span className="mx-2 hidden text-stone-400 sm:inline">/</span>
        <span className="block tabular-nums sm:inline">{v ? (info && info.left === 0 ? "Departed" : `${v.d} days ${pad2(v.h)} h ${pad2(v.m)} min ${pad2(v.s)} s`) : "Counting"}</span>
      </p>
      <a href="#" className="mt-5 inline-flex h-11 items-center rounded-full bg-stone-900 px-6 text-sm font-medium text-stone-50 shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_10px_24px_-10px_rgba(40,30,10,0.6)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#d9d5cb] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
        Reserve a seat
      </a>
    </div>
  );
}
