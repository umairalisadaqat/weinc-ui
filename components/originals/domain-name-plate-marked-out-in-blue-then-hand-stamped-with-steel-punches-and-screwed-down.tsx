import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

// The names the self-running demo stamps, one plate each. Invented businesses.
const names = ["hallowayflowers.example", "lowtidesurf.example", "saltandrye.example"];
const BLUE = "#4F98FB"; // marking-out ink, then the enamel in the letters
const MAX = 20; // longest name the plate takes
const STEP = 64; // milliseconds between punch strikes
const HOLD = 3600; // how long the demo leaves a finished plate before turning it over

const W = 720, H = 330; // drawing size; the canvas scales to its box
const PX = 40, PY = 66, PW = 640, PH = 160, RAD = 18;
const CX = W / 2, CY = PY + PH / 2;
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const clean = (v: string) => v.toLowerCase().replace(/[^a-z0-9.-]/g, "").slice(0, MAX);
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const noise = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

type Api = { type: (v: string) => void; connect: () => void };

export default function DomainNamePlate() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<Api | null>(null);
  const [text, setText] = useState(names[0]);
  const [status, setStatus] = useState<"blank" | "marked" | "stamping" | "done">("marked");
  const touched = useRef(-1e9);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasConic = typeof ctx.createConicGradient === "function";
    let k = 1; // canvas pixels per drawing unit
    const tex = document.createElement("canvas");

    const round = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };

    // The brushed face of the plate: thousands of short horizontal scratches, drawn once.
    const build = () => {
      k = clamp((cv.clientWidth / W) * Math.min(2, window.devicePixelRatio || 1), 1, 2.6);
      cv.width = Math.round(W * k); cv.height = Math.round(H * k);
      tex.width = Math.round(PW * k); tex.height = Math.round(PH * k);
      const tx = tex.getContext("2d");
      if (!tx) return;
      tx.scale(k, k);
      const g = tx.createLinearGradient(0, 0, 0, PH);
      g.addColorStop(0, "#e9ecef"); g.addColorStop(0.45, "#cfd3d8"); g.addColorStop(1, "#b2b7be");
      tx.fillStyle = g; tx.fillRect(0, 0, PW, PH);
      let seed = 11;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let y = 0; y < PH; y += 0.5) {
        let x = -rand() * 90;
        while (x < PW) {
          const len = 24 + rand() * 240, v = rand();
          tx.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.3})` : `rgba(18,24,32,${(0.5 - v) * 0.2})`;
          tx.fillRect(x, y, len, 0.5);
          x += len + rand() * 16;
        }
      }
    };

    const s = {
      text: names[0], pending: names[0], stampAt: null as number | null, flipAt: null as number | null, flipThen: null as (() => void) | null,
      kick: 0, kv: 0, rot: 0, rv: 0, light: 0.3, lightTo: 0.3, hits: 0, screwHits: 0, status: "marked", doneAt: 0,
      demo: 0, typing: null as { name: string; start: number } | null,
    };

    // Letters are set like loose punches: each takes its own width, then gets a small error in height and angle.
    let cache: { key: string; cell: number; size: number; items: { ch: string; x: number; jy: number; jr: number }[] } | null = null;
    const layout = (t: string) => {
      if (cache && cache.key === t) return cache;
      const base = 48, chars = t.toUpperCase().split("");
      ctx.font = `800 ${base}px ${FONT}`;
      const adv = chars.map((ch) => Math.max(ctx.measureText(ch).width, base * 0.3) + base * 0.15);
      const total = adv.reduce((a, b) => a + b, 0), f = Math.min(1, (PW - 140) / Math.max(total, 1));
      let x = CX - (total * f) / 2;
      const items = chars.map((ch, i) => { const w = adv[i] * f; x += w; return { ch, x: x - w / 2, jy: (noise(i * 3 + ch.charCodeAt(0)) - 0.5) * 3 * f, jr: (noise(i * 7 + ch.charCodeAt(0) * 1.7) - 0.5) * 0.075 }; });
      cache = { key: t, cell: (total * f) / Math.max(chars.length, 1), size: base * f, items };
      return cache;
    };

    const steel = (x: number, y: number, r: number, turn: number) => {
      if (!hasConic) { const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, "#f2f4f6"); g.addColorStop(0.5, "#7d838c"); g.addColorStop(1, "#dfe2e6"); return g; }
      const g = ctx.createConicGradient(turn, x, y);
      const stops: [number, string][] = [[0, "#f4f6f8"], [0.1, "#aab0b8"], [0.22, "#5f656e"], [0.36, "#c4c9d0"], [0.5, "#f1f3f5"], [0.62, "#8a9099"], [0.75, "#4f555d"], [0.88, "#b9bec6"], [1, "#f4f6f8"]];
      for (const [p, c] of stops) g.addColorStop(p, c);
      return g;
    };

    const draw = (now: number) => {
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const L = layout(s.text), n = L.items.length, st = s.stampAt;
      const struck = st == null ? 0 : clamp(Math.floor((now - st) / STEP) + 1, 0, n);
      const tEnamel = st == null ? Infinity : st + n * STEP + 200;
      const tScrew = tEnamel + 300;
      let sy = 1;
      if (s.flipAt != null) {
        const f = (now - s.flipAt) / 340;
        if (f >= 0.5 && s.flipThen) { const fn = s.flipThen; s.flipThen = null; fn(); }
        if (f >= 1) s.flipAt = null; else sy = Math.max(0.02, Math.abs(Math.cos(Math.PI * clamp(f))));
      }

      // Shadow on the bench.
      ctx.save();
      ctx.translate(CX, CY + s.kick); ctx.rotate(s.rot); ctx.scale(1, sy); ctx.translate(-CX, -CY);
      ctx.shadowColor = "rgba(44,34,18,0.34)"; ctx.shadowBlur = 30 * k; ctx.shadowOffsetY = (24 - s.kick * 2) * k;
      round(ctx, PX + 6, PY + 6, PW - 12, PH - 6, RAD); ctx.fillStyle = "#5b6067"; ctx.fill();
      ctx.shadowColor = "rgba(30,22,10,0.5)"; ctx.shadowBlur = 7 * k; ctx.shadowOffsetY = 5 * k;
      round(ctx, PX + 2, PY + 4, PW - 4, PH, RAD); ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(CX, CY + s.kick); ctx.rotate(s.rot); ctx.scale(1, sy); ctx.translate(-CX, -CY);
      // The sawn edge of the plate, then its face.
      const wall = ctx.createLinearGradient(0, PY + PH - 10, 0, PY + PH + 6);
      wall.addColorStop(0, "#9aa0a8"); wall.addColorStop(0.6, "#6c727a"); wall.addColorStop(1, "#484d54");
      round(ctx, PX, PY + 6, PW, PH, RAD); ctx.fillStyle = wall; ctx.fill();
      ctx.save();
      round(ctx, PX, PY, PW, PH, RAD); ctx.clip();
      ctx.drawImage(tex, PX, PY, PW, PH);
      // Brushed metal throws the lamp back as a tall band across the grain. It follows the light, not the plate.
      const lx = PX + s.light * PW;
      const band = (x: number, half: number, colour: string, mode: GlobalCompositeOperation) => {
        const g = ctx.createLinearGradient(x - half, 0, x + half, 0);
        g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.5, colour); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalCompositeOperation = mode; ctx.fillStyle = g; ctx.fillRect(x - half, PY, half * 2, PH);
      };
      band(lx, 120, "rgba(255,255,255,0.75)", "overlay");
      band(lx, 46, "rgba(255,255,255,0.3)", "source-over");
      band(lx + PW * 0.42, 150, "rgba(255,255,255,0.4)", "overlay");
      band(lx - PW * 0.3, 130, "rgba(16,22,32,0.3)", "source-over");
      band(lx + PW * 0.75, 150, "rgba(16,22,32,0.28)", "source-over");
      ctx.globalCompositeOperation = "source-over";
      if (sy < 1) { ctx.fillStyle = `rgba(20,24,30,${(1 - sy) * 0.55})`; ctx.fillRect(PX, PY, PW, PH); }
      ctx.restore();
      // Chamfer: one bright line round the top edge and a machined border inside it.
      const edge = ctx.createLinearGradient(0, PY, 0, PY + PH);
      edge.addColorStop(0, "rgba(255,255,255,0.95)"); edge.addColorStop(0.5, "rgba(255,255,255,0.25)"); edge.addColorStop(1, "rgba(30,36,44,0.5)");
      round(ctx, PX + 0.75, PY + 0.75, PW - 1.5, PH - 1.5, RAD - 0.75); ctx.lineWidth = 1.5; ctx.strokeStyle = edge; ctx.stroke();
      round(ctx, PX + 9, PY + 9, PW - 18, PH - 18, RAD - 7); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(24,30,38,0.3)"; ctx.stroke();
      round(ctx, PX + 10, PY + 10, PW - 20, PH - 20, RAD - 8); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.stroke();

      const enamelAll = st == null ? 0 : clamp((now - tEnamel - n * 26) / 300);
      const y0 = CY + L.size * 0.355;

      if (n) {
        // Marking out: two scribed lines and the letters drawn in layout ink. Wiped off once the enamel is in.
        ctx.globalAlpha = 1 - enamelAll;
        ctx.strokeStyle = "rgba(79,152,251,0.5)"; ctx.lineWidth = 0.7;
        for (const y of [y0 + 3, y0 - L.size * 0.72 - 3]) { ctx.beginPath(); ctx.moveTo(PX + 56, y); ctx.lineTo(PX + PW - 56, y); ctx.stroke(); }
        ctx.globalAlpha = 1;
        ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.lineJoin = "round";
        ctx.font = `800 ${L.size}px ${FONT}`;
        L.items.forEach((c, i) => {
          if (i >= struck) {
            ctx.lineWidth = 1; ctx.strokeStyle = "rgba(60,128,236,0.92)"; ctx.strokeText(c.ch, c.x, y0);
            ctx.fillStyle = "rgba(79,152,251,0.14)"; ctx.fillText(c.ch, c.x, y0);
            return;
          }
          const e = clamp((now - tEnamel - i * 26) / 280);
          ctx.save(); ctx.translate(c.x, y0 + c.jy); ctx.rotate(c.jr);
          // metal pushed up round the letter, then the cut: lit lower edge, shadowed upper edge, floor
          ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.strokeText(c.ch, 0.5, 0.8);
          ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.fillText(c.ch, 0.75, 1.05);
          ctx.fillStyle = "rgba(12,16,22,0.92)"; ctx.fillText(c.ch, -0.7, -0.95);
          const floor = ctx.createLinearGradient(0, -L.size * 0.72, 0, 0);
          floor.addColorStop(0, "#3d434b"); floor.addColorStop(0.35, "#5f656e"); floor.addColorStop(1, "#7c828b");
          ctx.fillStyle = floor; ctx.fillText(c.ch, 0, 0);
          if (e > 0) {
            ctx.globalAlpha = e; ctx.fillStyle = BLUE; ctx.fillText(c.ch, 0, 0);
            const gloss = ctx.createLinearGradient(0, -L.size * 0.72, 0, 0);
            gloss.addColorStop(0, "rgba(8,34,96,0.6)"); gloss.addColorStop(0.22, "rgba(8,34,96,0.08)"); gloss.addColorStop(0.6, "rgba(255,255,255,0)"); gloss.addColorStop(0.86, "rgba(255,255,255,0.2)"); gloss.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = gloss; ctx.fillText(c.ch, 0, 0);
          }
          ctx.restore();
        });
      }

      // Two countersunk holes, and the screws that go in last.
      let screwsIn = 0;
      [PX + 32, PX + PW - 32].forEach((x, i) => {
        const hole = ctx.createRadialGradient(x - 1, CY - 1.5, 1, x, CY, 11);
        hole.addColorStop(0, "#15181c"); hole.addColorStop(0.62, "#2c3036"); hole.addColorStop(1, "#7b8189");
        ctx.beginPath(); ctx.arc(x, CY, 11, 0, Math.PI * 2); ctx.fillStyle = hole; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.beginPath(); ctx.arc(x, CY, 11.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
        ctx.strokeStyle = "rgba(10,14,20,0.55)"; ctx.beginPath(); ctx.arc(x, CY, 11.4, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
        const q = st == null ? 0 : clamp((now - tScrew - i * 230) / 420);
        if (q <= 0) return;
        if (q >= 1) screwsIn++;
        const e = 1 - Math.pow(1 - q, 3), r = 9.4 * (1 + (1 - e) * 0.85), turn = (1 - e) * Math.PI * 5 + (i ? 0.6 : -0.35);
        ctx.save(); ctx.globalAlpha = Math.min(1, q * 5);
        ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = (2 + (1 - e) * 16) * k; ctx.shadowOffsetY = (1 + (1 - e) * 12) * k;
        ctx.beginPath(); ctx.arc(x, CY, r, 0, Math.PI * 2); ctx.fillStyle = steel(x, CY, r, turn + s.light * 2); ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(10,14,20,0.6)"; ctx.stroke();
        ctx.translate(x, CY); ctx.rotate(turn);
        ctx.lineCap = "round";
        ctx.lineWidth = r * 0.3; ctx.strokeStyle = "rgba(12,15,20,0.9)"; ctx.beginPath(); ctx.moveTo(-r * 0.68, 0); ctx.lineTo(r * 0.68, 0); ctx.stroke();
        ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.beginPath(); ctx.moveTo(-r * 0.66, r * 0.2); ctx.lineTo(r * 0.66, r * 0.2); ctx.stroke();
        ctx.restore();
      });
      ctx.restore();

      // The punch, seen end on from above: big and faint while high, sharp at each strike, hopping letter to letter.
      if (st != null && !reduce && n) {
        const u = (now - st) / STEP, r0 = Math.max(13, L.size * 0.44);
        let h = -1, x = 0;
        if (u < 0 && u > -3) { h = Math.pow(-u / 3, 0.8); x = L.items[0].x; }
        else if (u >= 0 && u < n - 1) { const i = Math.floor(u), f = u - i, ease = f * f * (3 - 2 * f); h = Math.sin(Math.PI * f) * 0.46; x = L.items[i].x + (L.items[i + 1].x - L.items[i].x) * ease; }
        else if (u >= n - 1 && u < n + 3) { h = Math.pow((u - n + 1) / 4, 0.7); x = L.items[n - 1].x; }
        if (h >= 0) {
          const yl = y0 - L.size * 0.36;
          const px = CX + (x - CX) * (1 + h * 0.45), py = CY + (yl - CY) * (1 + h * 0.45) - h * 34 + s.kick, r = r0 * (1 + h * 1.5);
          const sx = x + h * 26, sy2 = yl + h * 36 + s.kick, sr = r0 * (1.2 + h * 1.7);
          const sh = ctx.createRadialGradient(sx, sy2, r0 * 0.4 * (1 - h), sx, sy2, sr);
          sh.addColorStop(0, `rgba(10,12,16,${0.55 * (1 - h * 0.7)})`); sh.addColorStop(1, "rgba(10,12,16,0)");
          ctx.fillStyle = sh; ctx.fillRect(sx - sr, sy2 - sr, sr * 2, sr * 2);
          ctx.save(); ctx.globalAlpha = clamp(1.05 - h * 1.05);
          ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fillStyle = "#1a1d22"; ctx.fill();
          // knurled grip round the rim
          for (let a = 0; a < 40; a++) { const t0 = (a / 40) * Math.PI * 2; ctx.beginPath(); ctx.arc(px, py, r, t0, t0 + Math.PI / 40); ctx.arc(px, py, r * 0.86, t0 + Math.PI / 40, t0, true); ctx.closePath(); ctx.fillStyle = `rgba(215,220,226,${0.25 + 0.55 * Math.pow(Math.max(0, Math.cos(t0 + 2.2)), 2)})`; ctx.fill(); }
          ctx.beginPath(); ctx.arc(px, py, r * 0.84, 0, Math.PI * 2); ctx.fillStyle = steel(px, py, r, -0.9); ctx.fill();
          ctx.lineWidth = r * 0.06; ctx.strokeStyle = "rgba(10,14,20,0.5)"; ctx.beginPath(); ctx.arc(px, py, r * 0.56, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = "rgba(255,255,255,0.65)"; ctx.lineWidth = r * 0.035; ctx.beginPath(); ctx.arc(px, py, r * 0.6, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }
      }
      return { struck, n, screwsIn, enamelAll };
    };

    const say = (v: "blank" | "marked" | "stamping" | "done") => { if (s.status !== v) { s.status = v; setStatus(v); } };
    const finish = () => { s.stampAt = -1e7; s.hits = 99; s.screwHits = 2; };

    let raf = 0, last = 0, seen = true;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.033, (now - last) / 1000 || 0.016); last = now;
      // Demo: type the next name onto a fresh plate.
      if (s.typing) {
        const chars = clamp(Math.floor((now - s.typing.start) / 64), 0, s.typing.name.length);
        const v = s.typing.name.slice(0, chars);
        if (v !== s.text) { s.text = v; s.pending = v; setText(v); }
        if (chars === s.typing.name.length && now - s.typing.start > s.typing.name.length * 64 + 420) { s.typing = null; s.stampAt = now + 240; s.hits = 0; s.screwHits = 0; }
      }
      const r = draw(now);
      if (r.struck > s.hits) { for (let i = s.hits; i < r.struck; i++) { s.kv += 150; s.rv += ((layout(s.text).items[i]?.x ?? CX) - CX) / PW * 0.22; } s.hits = r.struck; }
      if (r.screwsIn > s.screwHits) { s.kv += 260; s.rv += s.screwHits ? 0.1 : -0.1; s.screwHits = r.screwsIn; if (r.screwsIn === 2) s.doneAt = now; }
      s.kv += (-1400 * s.kick - 34 * s.kv) * dt; s.kick += s.kv * dt;
      s.rv += (-1100 * s.rot - 30 * s.rv) * dt; s.rot += s.rv * dt;
      const idle = now - touched.current > 9000;
      if (idle) s.lightTo = 0.34 + 0.2 * Math.sin(now / 2300);
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
      say(s.stampAt == null ? (s.text ? "marked" : "blank") : r.screwsIn === 2 ? "done" : "stamping");
      if (idle && !s.typing && s.flipAt == null && s.status === "done" && now - s.doneAt > HOLD) {
        s.demo = (s.demo + 1) % names.length;
        const name = names[s.demo];
        s.flipAt = now; s.pending = "";
        s.flipThen = () => { s.stampAt = null; s.text = ""; setText(""); s.typing = { name, start: now + 420 }; };
      }
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { const r = draw(performance.now()); say(s.stampAt == null ? (s.text ? "marked" : "blank") : r.screwsIn === 2 ? "done" : "stamping"); };

    build();
    if (reduce) { finish(); still(); } else { s.stampAt = performance.now() + 300; wake(); }

    api.current = {
      type: (v) => {
        touched.current = performance.now(); s.typing = null; s.pending = v;
        if (reduce) { s.stampAt = null; s.text = v; still(); return; }
        // Stamped metal cannot be edited: a changed name turns the plate over to its clean side.
        if (s.stampAt != null && s.flipAt == null) { s.flipAt = performance.now(); s.flipThen = () => { s.stampAt = null; s.text = s.pending; }; }
        else if (s.flipThen) s.flipThen = () => { s.stampAt = null; s.text = s.pending; };
        else s.text = v;
        wake();
      },
      connect: () => {
        touched.current = performance.now(); s.typing = null;
        if (!s.pending) return;
        if (reduce) { s.text = s.pending; finish(); still(); return; }
        const go = () => { s.text = s.pending; s.stampAt = performance.now() + 260; s.hits = 0; s.screwHits = 0; };
        if (s.stampAt != null && s.flipAt == null) { s.flipAt = performance.now(); s.flipThen = go; } else if (s.flipAt != null) s.flipThen = go; else go();
        wake();
      },
    };

    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      touched.current = Math.max(touched.current, performance.now() - 7000);
      s.lightTo = clamp((e.clientX - b.left) / b.width, -0.1, 1.1);
      if (reduce) { s.light = s.lightTo; still(); }
    };
    const stage = cv.parentElement;
    stage?.addEventListener("pointermove", onMove);
    let resizeTimer = 0;
    const ro = new ResizeObserver(() => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => { build(); if (reduce) still(); }, 120); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); window.clearTimeout(resizeTimer); api.current = null;
      stage?.removeEventListener("pointermove", onMove); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const onSubmit = (e: FormEvent) => { e.preventDefault(); api.current?.connect(); };
  const line = status === "done" ? `${text} is stamped, filled and screwed down` : status === "stamping" ? `Stamping ${text}` : status === "marked" ? "Marked out in blue. Press Connect to stamp it." : "Type a name to mark it out";

  return (
    <div
      className="relative flex min-h-[600px] w-full flex-col items-center justify-center overflow-hidden bg-[#D8D4CC] bg-[radial-gradient(80%_70%_at_42%_30%,#EDEAE3_0%,#D8D4CC_52%,#BDB8AE_100%)] px-4 py-10 text-[#0B0D12] sm:min-h-[780px]"
      style={{ fontFamily: FONT }}
    >
      <canvas ref={canvas} aria-hidden="true" className="w-full max-w-[1000px]" style={{ aspectRatio: `${W} / ${H}` }} />
      <form onSubmit={onSubmit} className="relative mt-2 flex h-[54px] w-full max-w-[400px] items-center rounded-full bg-[#F6F4EF] pl-[22px] pr-[7px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_0_0_1px_rgba(11,13,18,0.07),0_18px_36px_-16px_rgba(50,38,18,0.5)] transition-shadow duration-200 focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_0_0_2px_#4F98FB,0_18px_36px_-16px_rgba(50,38,18,0.5)] motion-reduce:transition-none sm:mt-0">
        <label htmlFor="domain-name-plate-input" className="sr-only">Domain name</label>
        <input
          id="domain-name-plate-input"
          value={text}
          onChange={(e) => { const v = clean(e.target.value); setText(v); api.current?.type(v); }}
          onFocus={() => { touched.current = performance.now(); }}
          placeholder="yourname.com"
          maxLength={MAX}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="url"
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] font-bold tracking-[-0.01em] text-[#0B0D12] outline-none placeholder:text-[#0B0D12]/40"
        />
        <button type="submit" className="flex h-[40px] shrink-0 items-center gap-[8px] rounded-full bg-[#0B0D12] px-[18px] text-[14px] font-bold tracking-[-0.01em] text-white outline-none transition-transform duration-150 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F4EF] motion-reduce:transition-none">
          <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: BLUE }} />
          Connect
        </button>
      </form>
      <p aria-live="polite" className="mt-[16px] min-h-[18px] text-center text-[12px] font-semibold tracking-[-0.005em] text-[#0B0D12]/70">{line}</p>
    </div>
  );
}
