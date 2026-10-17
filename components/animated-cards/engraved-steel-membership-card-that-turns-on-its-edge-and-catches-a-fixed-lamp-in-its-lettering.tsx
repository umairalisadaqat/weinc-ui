import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// Everything engraved on the card. Change the words here and both faces redraw.
const card = {
  house: "NORTHLIGHT",
  kind: "MEMBERS' STUDIO",
  member: "Ines Calloway",
  tier: "FOUNDING MEMBER",
  number: "0417",
  since: "SINCE 2019",
  monogram: "N",
  backLine: "ADMITS THE BEARER AND ONE GUEST",
  address: "14 TALLOW LANE  /  RING THE BRASS BELL",
};
const W = 460; // card width in CSS pixels
const H = 290; // card height
const THICK = 9; // card thickness, a little more than a real one so the edge reads
const RADIUS = 18;
const SWAY = 0.5; // how far it rocks either side while idle, in radians
const TURN_EVERY = 7.5; // seconds between turning itself over
const SERIF = '"Didot","Bodoni 72","Bodoni MT","Playfair Display",Georgia,"Times New Roman",serif';
const SANS = '"Helvetica Neue",Helvetica,Arial,sans-serif';

type Face = {
  ctx: CanvasRenderingContext2D;
  base: HTMLCanvasElement;
  mask: HTMLCanvasElement;
  recess: HTMLCanvasElement;
  hi: HTMLCanvasElement[]; // bright walls: light from left, right, above, below
  lo: HTMLCanvasElement[]; // the same walls in shadow
  dark: boolean;
};

const blank = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };

// Tracked capitals, drawn letter by letter so it works where canvas letter spacing does not.
const tracked = (c: CanvasRenderingContext2D, text: string, x: number, y: number, gap: number, align: "left" | "right" | "center" = "left") => {
  let w = 0;
  for (const ch of text) w += c.measureText(ch).width + gap;
  w -= gap;
  let cx = align === "left" ? x : align === "right" ? x - w : x - w / 2;
  c.textAlign = "left";
  for (const ch of text) { c.fillText(ch, cx, y); cx += c.measureText(ch).width + gap; }
};

// The artwork of each face, drawn in white. Its outline becomes the engraving.
const drawFront = (c: CanvasRenderingContext2D) => {
  c.fillStyle = "#fff"; c.strokeStyle = "#fff"; c.textBaseline = "alphabetic";
  c.font = `600 13px ${SANS}`; tracked(c, card.house, 30, 44, 4.6);
  c.font = `500 7.5px ${SANS}`; tracked(c, card.kind, 30, 60, 2.6);
  c.font = `400 37px ${SERIF}`; c.textAlign = "left"; c.fillText(card.member, 28, 176);
  c.font = `600 8px ${SANS}`; tracked(c, card.tier, 30, 198, 3);
  c.font = `500 12px ${SANS}`; tracked(c, `No. ${card.number}`, 30, H - 30, 2.4);
  c.font = `500 8px ${SANS}`; tracked(c, card.since, W - 30, H - 30.5, 2.8, "right");
  // An engine-turned rosette: thirty ellipses round one centre.
  const rx = W - 98, ry = H / 2 - 6;
  c.lineWidth = 0.85;
  for (let i = 0; i < 30; i++) {
    c.beginPath(); c.ellipse(rx, ry, 66, 25, (i * Math.PI) / 30, 0, Math.PI * 2); c.stroke();
  }
  c.lineWidth = 1.4; c.beginPath(); c.arc(rx, ry, 72, 0, Math.PI * 2); c.stroke();
  c.globalCompositeOperation = "destination-out"; c.beginPath(); c.arc(rx, ry, 21, 0, Math.PI * 2); c.fill();
  c.globalCompositeOperation = "source-over";
  c.lineWidth = 1; c.beginPath(); c.arc(rx, ry, 21, 0, Math.PI * 2); c.stroke();
  c.font = `400 26px ${SERIF}`; c.textAlign = "center"; c.fillText(card.monogram, rx, ry + 9.5);
};
const drawBack = (c: CanvasRenderingContext2D) => {
  c.fillStyle = "#fff"; c.strokeStyle = "#fff"; c.textBaseline = "alphabetic";
  c.lineWidth = 1.1; c.beginPath(); c.roundRect(15, 15, W - 30, H - 30, 9); c.stroke();
  c.lineWidth = 0.7; c.beginPath(); c.roundRect(20, 20, W - 40, H - 40, 6); c.stroke();
  c.font = `600 11px ${SANS}`; tracked(c, card.house, W / 2, 58, 5, "center");
  c.font = `400 86px ${SERIF}`; tracked(c, card.number, W / 2, 176, 5, "center");
  c.fillRect(W / 2 - 96, 197, 192, 1);
  c.font = `600 8px ${SANS}`; tracked(c, card.backLine, W / 2, 218, 3, "center");
  c.font = `500 7.5px ${SANS}`; tracked(c, card.address, W / 2, H - 42, 2.6, "center");
};

export default function EngravedSteelMembershipCard() {
  const root = useRef<HTMLDivElement>(null);
  const spin = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLCanvasElement>(null);
  const back = useRef<HTMLCanvasElement>(null);
  const [showsBack, setShowsBack] = useState(false);
  const [scale, setScale] = useState(1);
  const api = useRef<{ flip: () => void; nudge: (d: number) => void } | null>(null);

  useEffect(() => {
    const el = root.current, sp = spin.current, fc = front.current, bc = back.current, sh = shadow.current;
    if (!el || !sp || !fc || !bc || !sh) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const d = Math.min(2.4, Math.min(2, window.devicePixelRatio || 1) * Math.max(1, Math.min(1.3, (el.clientWidth - 44) / W)));
    const PW = Math.round(W * d), PH = Math.round(H * d);

    const build = (cv: HTMLCanvasElement, art: (c: CanvasRenderingContext2D) => void, dark: boolean): Face | null => {
      cv.width = PW; cv.height = PH;
      const ctx = cv.getContext("2d");
      if (!ctx) return null;
      // Brushed plate: thousands of short horizontal scratches over one flat tone.
      const base = blank(PW, PH), b = base.getContext("2d");
      if (!b) return null;
      b.fillStyle = dark ? "#17382f" : "#bdb6a8"; b.fillRect(0, 0, PW, PH);
      let seed = dark ? 41 : 17;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let y = 0; y < PH; y++) {
        const row = rand();
        b.fillStyle = row > 0.5 ? `rgba(255,255,255,${(row - 0.5) * (dark ? 0.08 : 0.14)})` : `rgba(0,0,0,${(0.5 - row) * (dark ? 0.26 : 0.1)})`;
        b.fillRect(0, y, PW, 1);
        for (let k = 0; k < 5; k++) {
          const x = rand() * PW, len = (30 + rand() * 260) * d, v = rand();
          b.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * (dark ? 0.13 : 0.26)})` : `rgba(0,0,0,${(0.5 - v) * (dark ? 0.36 : 0.13)})`;
          b.fillRect(x, y, len, 1);
        }
      }
      // The artwork, then a slightly softened copy whose slopes are the walls of the cut.
      const mask = blank(PW, PH), m = mask.getContext("2d");
      const soft = blank(PW, PH), s = soft.getContext("2d");
      if (!m || !s) return null;
      m.scale(d, d); art(m);
      if ("filter" in s) s.filter = `blur(${0.42 * d}px)`;
      s.drawImage(mask, 0, 0);
      const a = s.getImageData(0, 0, PW, PH).data;
      const out = [0, 1, 2, 3].map(() => new ImageData(PW, PH));
      for (let y = 1; y < PH - 1; y++) {
        for (let x = 1; x < PW - 1; x++) {
          const i = (y * PW + x) * 4 + 3;
          const gx = a[i + 4] - a[i - 4], gy = a[i + PW * 4] - a[i - PW * 4];
          if (gx === 0 && gy === 0) continue;
          // 0 lit from the left, 1 lit from the right, 2 lit from above, 3 lit from below
          const set = (n: number, v: number) => { const o = out[n].data; o[i - 3] = 255; o[i - 2] = 255; o[i - 1] = 255; o[i] = Math.min(255, v * 1.7); };
          if (gx < 0) set(0, -gx); else if (gx > 0) set(1, gx);
          if (gy < 0) set(2, -gy); else if (gy > 0) set(3, gy);
        }
      }
      const hi = out.map((im) => { const c = blank(PW, PH); c.getContext("2d")?.putImageData(im, 0, 0); return c; });
      const lo = hi.map((src) => {
        const c = blank(PW, PH), x = c.getContext("2d");
        if (x) { x.drawImage(src, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "#000"; x.fillRect(0, 0, PW, PH); }
        return c;
      });
      // The floor of the cut: darker and matt on the bright face, bare steel on the black one.
      const recess = blank(PW, PH), r = recess.getContext("2d");
      if (r) { r.drawImage(soft, 0, 0); r.globalCompositeOperation = "source-in"; r.fillStyle = dark ? "#a3a39c" : "#2b2722"; r.fillRect(0, 0, PW, PH); }
      return { ctx, base, mask: soft, recess, hi, lo, dark };
    };
    const faces = [build(fc, drawFront, false), build(bc, drawBack, true)];
    const tmp = blank(PW, PH), tx = tmp.getContext("2d");

    const s = { th: 0, v: 0, side: 0, drag: false, t: 0, idle: 0, tiltX: 0, tiltTo: 0, moved: 0, lastX: 0, lastT: 0, shown: 0 };
    if (reduce) s.th = -0.36;

    // One face. `a` is how far the face is turned from square on, `lx` where the lamp sits for it.
    const paint = (f: Face, a: number) => {
      const { ctx } = f;
      const lx = Math.sin(-0.3 - a); // the lamp is up and to the left of the camera
      ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
      ctx.drawImage(f.base, 0, 0);
      const facing = Math.max(0, Math.cos(a + 0.3));
      ctx.fillStyle = `rgba(6,6,8,${(f.dark ? 0.34 : 0.4) * (1 - facing) + 0.04})`; ctx.fillRect(0, 0, PW, PH);
      // The lamp and a weaker window light, each a soft band that slides across as the card turns.
      const band = (centre: number, width: number, strength: number, warm: boolean) => {
        const g = ctx.createLinearGradient((centre - width) * PW, 0, (centre + width) * PW, PH * 0.22);
        const c = warm ? "255,246,232" : "226,236,255";
        g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.36, `rgba(${c},${strength * 0.32})`); g.addColorStop(0.5, `rgba(${c},${strength})`);
        g.addColorStop(0.62, `rgba(${c},${strength * 0.3})`); g.addColorStop(1, `rgba(${c},0)`);
        return g;
      };
      const c1 = 0.5 + (a + 0.16) * 1.25, c2 = 0.5 + (a - 0.62) * 1.25;
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = band(c1, 0.6, f.dark ? 0.28 : 0.7, true); ctx.fillRect(0, 0, PW, PH);
      ctx.fillStyle = band(c1 + 0.015, 0.1, f.dark ? 0.12 : 0.5, true); ctx.fillRect(0, 0, PW, PH);
      ctx.fillStyle = band(c2, 0.36, f.dark ? 0.14 : 0.3, false); ctx.fillRect(0, 0, PW, PH);
      // The room below is darker than the room above, and the plate shows it.
      ctx.globalCompositeOperation = "source-over";
      const fall = ctx.createLinearGradient(0, 0, 0, PH);
      fall.addColorStop(0, "rgba(255,255,255,0.07)"); fall.addColorStop(0.5, "rgba(0,0,0,0)"); fall.addColorStop(1, "rgba(0,0,0,0.24)");
      ctx.fillStyle = fall; ctx.fillRect(0, 0, PW, PH);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = f.dark ? 0.94 : 0.9; ctx.drawImage(f.recess, 0, 0); ctx.globalAlpha = 1;
      // The same two lights again, but only inside the lettering, tighter and much brighter.
      if (tx) {
        tx.globalCompositeOperation = "source-over"; tx.clearRect(0, 0, PW, PH); tx.drawImage(f.mask, 0, 0);
        tx.globalCompositeOperation = "source-in";
        const g = tx.createLinearGradient((c1 - 0.3) * PW, 0, (c1 + 0.3) * PW, PH * 0.22);
        const k = f.dark ? 1 : 0.5;
        g.addColorStop(0, "rgba(255,250,240,0)"); g.addColorStop(0.42, `rgba(255,250,240,${0.3 * k})`); g.addColorStop(0.5, `rgba(255,252,246,${k})`); g.addColorStop(0.58, `rgba(255,250,240,${0.3 * k})`); g.addColorStop(1, "rgba(255,250,240,0)");
        tx.fillStyle = g; tx.fillRect(0, 0, PW, PH);
        ctx.globalCompositeOperation = f.dark ? "lighter" : "screen"; ctx.drawImage(tmp, 0, 0);
      }
      // Walls of the cut. Which side is lit depends on which side of the lamp the face is turned to.
      const side = Math.min(1, Math.abs(lx) * 2.3), glint = Math.pow(side, 1.4);
      const lit = lx < 0 ? 0 : 1, shade = lx < 0 ? 1 : 0;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.15 + 0.45 * side; ctx.drawImage(f.lo[shade], 0, 0);
      ctx.globalAlpha = 0.4; ctx.drawImage(f.lo[3], 0, 0);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.08 + (f.dark ? 0.8 : 0.62) * glint; ctx.drawImage(f.hi[lit], 0, 0);
      ctx.globalAlpha = f.dark ? 0.36 : 0.34; ctx.drawImage(f.hi[2], 0, 0);
      // Polished chamfer round the rim.
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      const rim = ctx.createLinearGradient(0, 0, PW, PH);
      const p = Math.max(0.02, Math.min(0.98, c1));
      rim.addColorStop(0, "rgba(255,255,255,0.5)"); rim.addColorStop(Math.max(0.01, p - 0.2), "rgba(255,255,255,0.14)"); rim.addColorStop(p, "rgba(255,255,255,0.95)");
      rim.addColorStop(Math.min(0.99, p + 0.2), "rgba(255,255,255,0.1)"); rim.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.lineWidth = 1.6 * d; ctx.strokeStyle = rim;
      ctx.beginPath(); ctx.roundRect(0.8 * d, 0.8 * d, PW - 1.6 * d, PH - 1.6 * d, (RADIUS - 0.8) * d); ctx.stroke();
    };

    const render = () => {
      const turn = ((s.th % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI; // -PI..PI, 0 is the front square on
      const frontUp = Math.abs(turn) < Math.PI / 2;
      const f = faces[frontUp ? 0 : 1];
      if (f) paint(f, frontUp ? turn : turn > 0 ? turn - Math.PI : turn + Math.PI);
      sp.style.transform = `rotateX(${(7 + s.tiltX).toFixed(2)}deg) rotateY(${((s.th * 180) / Math.PI).toFixed(2)}deg)`;
      const edge = Math.abs(Math.sin(s.th)), e = Math.round(70 + 150 * Math.pow(edge, 0.7));
      sp.style.setProperty("--edge", `linear-gradient(180deg, rgb(${e + 26},${e + 22},${e + 14}) 0%, rgb(${e},${e - 2},${e - 6}) 38%, rgb(${Math.round(e * 0.55)},${Math.round(e * 0.55)},${Math.round(e * 0.57)}) 100%)`);
      const flat = Math.abs(Math.cos(s.th));
      sh.style.transform = `translateX(-50%) scaleX(${(0.12 + 0.88 * flat).toFixed(3)})`;
      sh.style.opacity = (0.55 + 0.35 * flat).toFixed(3);
      const side = frontUp ? 0 : 1;
      if (side !== s.shown) { s.shown = side; setShowsBack(side === 1); }
    };

    let raf = 0, last = 0, visible = true;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
      s.t += dt;
      if (!s.drag) {
        s.idle += dt;
        if (!reduce && s.idle > TURN_EVERY) { s.idle = 0; s.side += 1; }
        const target = s.side * Math.PI + (reduce ? -0.36 : SWAY * Math.sin(s.t * 0.62));
        s.v += ((target - s.th) * 15 - s.v * 4.4) * dt;
        s.th += s.v * dt;
      }
      s.tiltX += (s.tiltTo - s.tiltX) * Math.min(1, dt * 6);
      render();
      const resting = reduce && !s.drag && Math.abs(s.v) < 0.002 && Math.abs(s.side * Math.PI - 0.36 - s.th) < 0.002;
      if (visible && !document.hidden && !resting) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };

    api.current = {
      flip: () => { s.side += 1; s.idle = 0; if (reduce) { s.th = s.side * Math.PI - 0.36; s.v = 0; render(); } else wake(); },
      nudge: (dir: number) => { s.v += dir * 5; s.idle = 0; wake(); },
    };

    const down = (e: PointerEvent) => {
      s.drag = true; s.moved = 0; s.lastX = e.clientX; s.lastT = performance.now(); s.v = 0;
      sp.setPointerCapture(e.pointerId); wake();
    };
    const move = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      s.tiltTo = -((e.clientY - box.top) / box.height - 0.5) * 10;
      if (!s.drag) return;
      const dx = e.clientX - s.lastX, now = performance.now(), dt = Math.max(8, now - s.lastT) / 1000;
      s.moved += Math.abs(dx); s.th += dx * 0.011; s.v = s.v * 0.5 + ((dx * 0.011) / dt) * 0.5;
      s.lastX = e.clientX; s.lastT = now;
      if (reduce) render();
    };
    const up = () => {
      if (!s.drag) return;
      s.drag = false; s.idle = 0;
      if (s.moved < 5) { s.v = 0; s.side += 1; }
      else {
        if (performance.now() - s.lastT > 90) s.v = 0;
        s.v = Math.max(-16, Math.min(16, s.v));
        s.side = Math.round((s.th + s.v * 0.3) / Math.PI);
      }
      if (reduce) { s.th = s.side * Math.PI - 0.36; s.v = 0; render(); } else wake();
    };
    const leave = () => { s.tiltTo = 0; };
    sp.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    sp.addEventListener("pointerup", up);
    sp.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", leave);

    const fit = () => setScale(Math.min(1.3, (el.clientWidth - 44) / W));
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !reduce) wake(); });
    io.observe(el);
    const vis = () => { if (!document.hidden && !reduce) wake(); };
    document.addEventListener("visibilitychange", vis);
    render();
    if (!reduce) wake();

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      sp.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move);
      sp.removeEventListener("pointerup", up); sp.removeEventListener("pointercancel", up); el.removeEventListener("pointerleave", leave);
      api.current = null;
    };
  }, []);

  const onKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); api.current?.nudge(e.key === "ArrowLeft" ? -1 : 1); }
  };

  const layers = Array.from({ length: THICK - 1 }, (_, i) => i + 1 - THICK / 2);

  return (
    <div ref={root} className="relative flex min-h-[660px] w-full items-center justify-center overflow-hidden bg-[#0b0b0d] py-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 46% at 50% 44%, #2b2a2c 0%, #17171a 46%, #0b0b0d 100%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[64%] h-40 w-[720px] max-w-[130%] -translate-x-1/2 rounded-[50%]" style={{ background: "radial-gradient(closest-side, rgba(255,240,220,0.07), rgba(255,240,220,0))" }} />

      <div className="relative" style={{ width: W * scale, height: H * scale }}>
        <div className="absolute left-0 top-0" style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0", perspective: 1500 }}>
          <div ref={shadow} aria-hidden="true" className="pointer-events-none absolute left-1/2 h-12 rounded-[50%]" style={{ top: H + 40, width: W * 0.94, transform: "translateX(-50%)", background: "radial-gradient(closest-side, rgba(0,0,0,0.9), rgba(0,0,0,0.5) 55%, rgba(0,0,0,0))", filter: "blur(10px)" }} />
          <div ref={spin} className="absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing" style={{ transformStyle: "preserve-3d", transform: "rotateX(7deg) rotateY(0deg)" }}>
            {layers.map((z) => (
              <div key={z} aria-hidden="true" className="absolute inset-0" style={{ borderRadius: RADIUS, background: "var(--edge, #777)", transform: `translateZ(${z}px)` }} />
            ))}
            <canvas ref={front} aria-hidden="true" className="absolute inset-0 h-full w-full bg-[#bdb6a8]" style={{ borderRadius: RADIUS, transform: `translateZ(${THICK / 2}px)`, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }} />
            <canvas ref={back} aria-hidden="true" className="absolute inset-0 h-full w-full bg-[#17382f]" style={{ borderRadius: RADIUS, transform: `rotateY(180deg) translateZ(${THICK / 2}px)`, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }} />
            <button
              type="button"
              onClick={(e) => { if (e.detail === 0) api.current?.flip(); }}
              onKeyDown={onKey}
              aria-pressed={showsBack}
              aria-label={`${card.house} membership card, ${showsBack ? "back" : "front"} showing. Press to turn it over, or use the left and right arrow keys to spin it.`}
              className="absolute inset-0 cursor-grab rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b0b0d] active:cursor-grabbing"
              style={{ transform: `translateZ(${THICK / 2 + 1}px)`, touchAction: "pan-y" }}
            />
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {showsBack ? `Back of the card: number ${card.number}. ${card.backLine.toLowerCase()}. ${card.address.toLowerCase()}.` : `Front of the card: ${card.house}, ${card.kind.toLowerCase()}. ${card.member}, ${card.tier.toLowerCase()}, number ${card.number}, ${card.since.toLowerCase()}.`}
      </p>
      <p className="pointer-events-none absolute bottom-7 left-7 font-mono text-[10px] font-semibold uppercase leading-5 tracking-[0.22em] text-zinc-100">
        {card.house} card no. {card.number}
        <span className="block font-medium text-zinc-400">Drag to spin it, tap to turn it over</span>
      </p>
    </div>
  );
}
