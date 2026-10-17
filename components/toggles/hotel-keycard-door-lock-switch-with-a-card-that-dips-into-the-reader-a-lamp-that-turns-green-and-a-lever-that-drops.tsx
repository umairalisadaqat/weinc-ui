import { useEffect, useRef, useState } from "react";

const ROOM = "412"; // printed on the card and read out in the label
const HOTEL = "MERIDIAN"; // a made-up house name on the card
const RED = [255, 64, 48], AMBER = [255, 176, 32], GREEN = [56, 230, 132]; // the lamp: locked, reading, open
const CARD = { paper: "#f2e8d5", sun: "#dc5a32", sea: "#1f3a5c" };

const W = 560, H = 730;
const PX = 196, PY = 250, PW = 168, PH = 450; // the steel plate
const SLOT = 269; // the card vanishes below this line
const PIVOT = { x: 280, y: 522 };

export default function HotelKeycardDoorLockSwitch() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(true);
  const onRef = useRef(true);
  const api = useRef<{ set: (v: boolean, fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, box = wrap.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let K = 1;
    const s = { card: 1, cardV: 0, lever: 1, leverV: 0, lamp: GREEN.slice(), stage: 2, since: 0 };

    // Fine vertical brushing for the plate, made once.
    const brush = document.createElement("canvas"); brush.width = PW * 2; brush.height = 64;
    const bx = brush.getContext("2d");
    if (bx) { let seed = 11; const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let x = 0; x < brush.width; x++) { const v = rand(); bx.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.34})` : `rgba(0,0,0,${(0.5 - v) * 0.22})`; bx.fillRect(x, 0, 1, 64); } }

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    };
    const lin = (x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); for (const [p, c] of stops) g.addColorStop(p, c); return g; };
    const shadow = (shape: () => void, blur: number, dx: number, dy: number, alpha: number) => {
      ctx.save(); ctx.shadowColor = `rgba(2,10,8,${alpha})`; ctx.shadowBlur = blur * K; ctx.shadowOffsetX = (dx + 3000) * K; ctx.shadowOffsetY = dy * K;
      ctx.translate(-3000, 0); ctx.fillStyle = "#000"; shape(); ctx.restore();
    };
    const CHROME: [number, string][] = [[0, "#fbfcfc"], [0.16, "#d9dce0"], [0.4, "#9ba0a7"], [0.5, "#5f646b"], [0.56, "#8d9299"], [0.74, "#d2d5d9"], [0.9, "#f1f2f4"], [1, "#868b92"]];
    const arm = () => { ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(178, -13); ctx.arc(178, 0, 13, -Math.PI / 2, Math.PI / 2); ctx.lineTo(0, 18); ctx.closePath(); };
    const hasConic = typeof ctx.createConicGradient === "function";

    const draw = (time: number) => {
      ctx.setTransform(K, 0, 0, K, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = "round";
      const c = Math.max(-0.08, Math.min(1.06, s.card)), hover = 1 - Math.max(0, Math.min(1, c));
      const bob = reduce ? 0 : Math.sin(time / 700) * 4 * hover;
      const lamp = `rgb(${s.lamp[0] | 0},${s.lamp[1] | 0},${s.lamp[2] | 0})`;
      const glow = 0.82 + (reduce ? 0 : 0.18 * Math.sin(time / 520));
      const ang = (Math.max(-0.1, s.lever) * 25 * Math.PI) / 180;

      // The plate: shadow on the door, brushed face, bevel.
      shadow(() => { rr(PX, PY, PW, PH, 30); ctx.fill(); }, 34, 12, 30, 0.62);
      shadow(() => { rr(PX, PY, PW, PH, 30); ctx.fill(); }, 8, 3, 7, 0.55);
      rr(PX, PY, PW, PH, 30); ctx.fillStyle = lin(PX, 0, PX + PW, 0, [[0, "#7f848a"], [0.05, "#e4e6e9"], [0.28, "#c3c7cc"], [0.5, "#f0f1f3"], [0.76, "#b4b8be"], [0.95, "#dcdfe2"], [1, "#74797f"]]); ctx.fill();
      ctx.save(); rr(PX, PY, PW, PH, 30); ctx.clip();
      for (let y = PY; y < PY + PH; y += 64) ctx.drawImage(brush, PX, y, PW, 64);
      ctx.fillStyle = lin(0, PY, 0, PY + PH, [[0, "rgba(255,255,255,0.3)"], [0.25, "rgba(255,255,255,0)"], [0.7, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0.26)"]]); ctx.fillRect(PX, PY, PW, PH);
      ctx.restore();
      ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(20,24,28,0.7)"; rr(PX + 0.6, PY + 0.6, PW - 1.2, PH - 1.2, 30); ctx.stroke();
      ctx.lineWidth = 1.6; ctx.strokeStyle = lin(0, PY, 0, PY + PH, [[0, "rgba(255,255,255,0.95)"], [0.5, "rgba(255,255,255,0.3)"], [1, "rgba(0,0,0,0.35)"]]); rr(PX + 3, PY + 3, PW - 6, PH - 6, 27); ctx.stroke();

      // The reader: a gloss black block. Its top face holds the slot.
      const BX = PX + 12, BY = 262, BW = PW - 24, BH = 160;
      shadow(() => { rr(BX, BY, BW, BH, 15); ctx.fill(); }, 9, 3, 8, 0.6);
      rr(BX, BY, BW, BH, 15); ctx.fillStyle = lin(0, BY, 0, BY + BH, [[0, "#3a3e45"], [0.08, "#1c1e22"], [0.6, "#0c0d0f"], [1, "#030304"]]); ctx.fill();
      ctx.save(); rr(BX, BY, BW, BH, 15); ctx.clip();
      ctx.fillStyle = lin(0, BY, 0, BY + 15, [[0, "#6a6f78"], [1, "#2b2e34"]]); ctx.fillRect(BX, BY, BW, 15);
      ctx.beginPath(); ctx.moveTo(BX, BY + 15); ctx.lineTo(BX + 84, BY + 15); ctx.lineTo(BX + 26, BY + BH); ctx.lineTo(BX, BY + BH); ctx.closePath(); ctx.fillStyle = "rgba(255,255,255,0.055)"; ctx.fill();
      const spill = ctx.createRadialGradient(280, 374, 4, 280, 374, 74); spill.addColorStop(0, `rgba(${s.lamp[0] | 0},${s.lamp[1] | 0},${s.lamp[2] | 0},${0.34 * glow})`); spill.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = spill; ctx.fillRect(BX, BY, BW, BH);
      ctx.restore();
      ctx.fillStyle = "#000"; rr(218, SLOT - 4, 124, 8, 4); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(222, SLOT + 4, 116, 0.9);
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.16)"; rr(BX + 0.5, BY + 0.5, BW - 1, BH - 1, 15); ctx.stroke();
      // engraved pictogram: a card and the way it goes
      ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1.3; rr(268, 303, 24, 34, 3.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(280, 310); ctx.lineTo(280, 328); ctx.moveTo(274.5, 322.5); ctx.lineTo(280, 328); ctx.lineTo(285.5, 322.5); ctx.stroke();
      // the lamp behind a domed lens
      ctx.beginPath(); ctx.arc(280, 374, 15, 0, Math.PI * 2); ctx.fillStyle = lin(0, 359, 0, 389, [[0, "#0a0a0b"], [1, "#4a4e55"]]); ctx.fill();
      ctx.save(); ctx.shadowColor = lamp; ctx.shadowBlur = 26 * glow * K; ctx.beginPath(); ctx.arc(280, 374, 10.5, 0, Math.PI * 2); ctx.fillStyle = lamp; ctx.fill(); ctx.restore();
      const dome = ctx.createRadialGradient(277, 370, 1, 280, 374, 10.5); dome.addColorStop(0, "rgba(255,255,255,0.75)"); dome.addColorStop(0.45, "rgba(255,255,255,0.12)"); dome.addColorStop(1, "rgba(0,0,0,0.38)");
      ctx.beginPath(); ctx.arc(280, 374, 10.5, 0, Math.PI * 2); ctx.fillStyle = dome; ctx.fill();
      ctx.beginPath(); ctx.ellipse(276.4, 369.6, 3.4, 2, -0.6, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.fill();
      // lamp colour caught on the plate under the reader
      ctx.save(); rr(PX, PY, PW, PH, 30); ctx.clip(); const wash = ctx.createRadialGradient(280, BY + BH, 2, 280, BY + BH, 70); wash.addColorStop(0, `rgba(${s.lamp[0] | 0},${s.lamp[1] | 0},${s.lamp[2] | 0},${0.2 * glow})`); wash.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = wash; ctx.fillRect(PX, BY + BH, PW, 70); ctx.restore();

      // The key card, cut off where it enters the slot.
      const cw = 112, ch = 176;
      const cx = 280 + 26 * hover, bottom = SLOT + 48 - (48 + 34) * hover + bob, rot = (-7 * Math.PI) / 180 * hover;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, SLOT); ctx.clip();
      ctx.translate(cx, bottom); ctx.rotate(rot);
      shadow(() => { rr(-cw / 2, -ch, cw, ch, 9); ctx.fill(); }, 8 + 14 * hover, 5 + 9 * hover, 6 + 20 * hover, 0.5 - 0.14 * hover);
      rr(-cw / 2 + 1.2, -ch + 1.6, cw, ch, 9); ctx.fillStyle = "#b9ad95"; ctx.fill();
      rr(-cw / 2, -ch, cw, ch, 9); ctx.fillStyle = CARD.paper; ctx.fill();
      ctx.save(); rr(-cw / 2, -ch, cw, ch, 9); ctx.clip();
      ctx.beginPath(); ctx.arc(0, -ch + 86, 34, Math.PI, 0); ctx.fillStyle = CARD.sun; ctx.fill();
      for (let j = 0; j < 5; j++) { ctx.fillStyle = CARD.sea; ctx.globalAlpha = 1 - j * 0.17; ctx.fillRect(-34 - j * 0.5 + j * 5, -ch + 90 + j * 7.5, 68 - j * 10, 3.2); }
      ctx.globalAlpha = 1; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = CARD.sea; ctx.font = "700 10px ui-sans-serif, 'Helvetica Neue', Arial, sans-serif"; ctx.fillText(HOTEL.split("").join(" "), 0, -ch + 26);
      ctx.font = "600 7px ui-monospace, SFMono-Regular, Menlo, monospace"; ctx.fillStyle = "rgba(31,58,92,0.75)"; ctx.fillText(`ROOM ${ROOM}`, 0, -ch + 142);
      ctx.beginPath(); ctx.moveTo(-6, -22); ctx.lineTo(0, -15); ctx.lineTo(6, -22); ctx.lineWidth = 1.6; ctx.strokeStyle = CARD.sun; ctx.stroke();
      ctx.fillStyle = lin(-cw / 2, -ch, cw / 2, 0, [[0, "rgba(255,255,255,0.5)"], [0.35, "rgba(255,255,255,0)"], [0.62, "rgba(255,255,255,0)"], [0.7, "rgba(255,255,255,0.22)"], [0.78, "rgba(255,255,255,0)"], [1, "rgba(60,40,10,0.12)"]]); ctx.fillRect(-cw / 2, -ch, cw, ch);
      ctx.restore();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.8)"; rr(-cw / 2 + 0.5, -ch + 0.5, cw - 1, ch - 1, 9); ctx.stroke();
      ctx.restore();

      // Key override below the handle.
      ctx.beginPath(); ctx.arc(280, 646, 17, 0, Math.PI * 2); ctx.fillStyle = lin(0, 629, 0, 663, [[0, "#5d6168"], [1, "#f4f5f6"]]); ctx.fill();
      ctx.beginPath(); ctx.arc(280, 646, 14, 0, Math.PI * 2); ctx.fillStyle = lin(0, 632, 0, 660, CHROME); ctx.fill();
      ctx.fillStyle = "#0b0c0d"; rr(278, 637, 4, 18, 2); ctx.fill(); ctx.beginPath(); ctx.arc(280, 640.5, 3.6, 0, Math.PI * 2); ctx.fill();

      // The lever: rose, arm with its shadow, hub.
      shadow(() => { ctx.beginPath(); ctx.arc(PIVOT.x, PIVOT.y, 46, 0, Math.PI * 2); ctx.fill(); }, 10, 4, 9, 0.5);
      ctx.beginPath(); ctx.arc(PIVOT.x, PIVOT.y, 46, 0, Math.PI * 2);
      if (hasConic) { const g = ctx.createConicGradient(-2.1, PIVOT.x, PIVOT.y); const st: [number, number][] = [[0, 250], [0.09, 196], [0.2, 128], [0.3, 176], [0.42, 232], [0.5, 150], [0.58, 206], [0.7, 122], [0.82, 168], [0.93, 226], [1, 250]]; for (const [q, v] of st) g.addColorStop(q, `rgb(${v - 6},${v},${v + 5})`); ctx.fillStyle = g; }
      else ctx.fillStyle = lin(0, PIVOT.y - 46, 0, PIVOT.y + 46, CHROME);
      ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(20,24,28,0.6)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(PIVOT.x, PIVOT.y, 43, 0, Math.PI * 2); ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.stroke();
      ctx.save(); ctx.translate(PIVOT.x, PIVOT.y); ctx.rotate(ang);
      shadow(() => { arm(); ctx.fill(); }, 15, 8 * Math.cos(ang) + 22 * Math.sin(ang), 22 * Math.cos(ang) - 8 * Math.sin(ang), 0.5);
      shadow(() => { arm(); ctx.fill(); }, 4, 1, 4, 0.45);
      arm(); ctx.fillStyle = lin(0, -18, 0, 18, CHROME); ctx.fill();
      ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(20,24,28,0.55)"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(24, -15.6); ctx.lineTo(174, -11.4); ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(PIVOT.x, PIVOT.y, 25, 0, Math.PI * 2); ctx.fillStyle = lin(0, PIVOT.y - 25, 0, PIVOT.y + 25, [[0, "#ffffff"], [0.45, "#b3b8be"], [0.55, "#7c8188"], [1, "#d9dcdf"]]); ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(20,24,28,0.5)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(PIVOT.x, PIVOT.y, 19, 0, Math.PI * 2); ctx.fillStyle = lin(0, PIVOT.y - 19, 0, PIVOT.y + 19, [[0, "#8d9299"], [1, "#eceef0"]]); ctx.fill();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, demoAt = 3500;
    const snap = () => { const v = onRef.current; s.card = v ? 1 : 0; s.lever = v ? 1 : 0; s.lamp = (v ? GREEN : RED).slice(); s.stage = v ? 2 : 0; draw(0); };
    const set = (v: boolean, fromUser: boolean) => {
      if (fromUser) touched = performance.now();
      onRef.current = v; setOn(v);
      if (reduce) snap(); else wake();
    };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0, want = onRef.current;
      s.cardV += (170 * ((want ? 1 : 0) - s.card) - 17 * s.cardV) * dt; s.card += s.cardV * dt;
      // The reader thinks for a moment in amber before it lets you in.
      if (!want) s.stage = 0;
      else if (s.stage === 0 && s.card > 0.9) { s.stage = 1; s.since = t; }
      else if (s.stage === 1 && t - s.since > 300) s.stage = 2;
      const tone = s.stage === 2 ? GREEN : s.stage === 1 ? (Math.floor((t - s.since) / 75) % 2 ? [70, 46, 8] : AMBER) : RED;
      s.lamp = s.lamp.map((v, i) => v + (tone[i] - v) * Math.min(1, dt * 22));
      s.leverV += (230 * ((s.stage === 2 ? 1 : 0) - s.lever) - 13 * s.leverV) * dt; s.lever += s.leverV * dt;
      if (now - touched > 8000 && t > demoAt) { set(!want, false); demoAt = t + (want ? 2200 : 3400); }
      draw(t);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const size = () => {
      const w = box.clientWidth, dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round((w * H) / W * dpr); K = cv.width / W; draw(0);
    };
    const ro = new ResizeObserver(size); ro.observe(box); size();
    api.current = { set };
    wake();
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const toggle = () => { const v = !onRef.current; onRef.current = v; setOn(v); api.current?.set(v, true); };

  return (
    <div className="flex min-h-[720px] w-full flex-col items-center justify-center bg-[#1c3a34] bg-[linear-gradient(101deg,rgba(255,255,255,0)_22%,rgba(255,255,255,0.06)_31%,rgba(255,255,255,0)_40%),radial-gradient(90%_70%_at_40%_30%,#2a5249_0%,#1c3a34_55%,#11241f_100%)] px-4 py-8 sm:min-h-[800px]">
      <div ref={wrap} onClick={toggle} className="relative w-full max-w-[520px] cursor-pointer" style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={`Room ${ROOM} door unlocked`}
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          style={{ left: `${(PX / W) * 100}%`, top: `${(PY / H) * 100}%`, width: `${(PW / W) * 100}%`, height: `${(PH / H) * 100}%`, borderRadius: "18% / 6.7%" }}
          className="absolute cursor-pointer bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#1c3a34]"
        />
      </div>
      <p aria-live="polite" className="mt-1 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-emerald-100/70">
        <span className="font-semibold text-white">Room {ROOM}</span>
        <span className="mx-2 text-emerald-100/40">/</span>
        {on ? "Unlocked, handle free" : "Locked, card out"}
      </p>
    </div>
  );
}
