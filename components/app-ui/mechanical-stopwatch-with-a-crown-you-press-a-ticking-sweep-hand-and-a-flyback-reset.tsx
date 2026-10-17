import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const START_AT = 198.2; // seconds already on the watch when the page loads
const BEATS = 5; // steps the hand takes each second (a fifth-second movement)
const MINUTES = 30; // one turn of the small recorder dial
const ACCENT = "#e5482c"; // quarter markers, hand tip and focus ring
const DEMO = true; // press its own buttons until a visitor does

const W = 520, H = 566, CX = 260, CY = 306, R = 178, RD = 146; // design pixels: canvas, case centre, case radius, dial radius
const PUSH = (32 * Math.PI) / 180; // where the reset pusher sits, clockwise from the crown
const TAU = Math.PI * 2;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`;

type Phase = "running" | "stopped" | "zeroed";

export default function CrownStopwatch() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("running");
  const [shown, setShown] = useState(START_AT);
  const api = useRef<{ crown: (byUser: boolean) => void; reset: (byUser: boolean) => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasConic = typeof ctx.createConicGradient === "function";
    let k = 1;

    // The movement: time is kept from the clock, so it stays right while the page is hidden.
    const S = {
      base: START_AT, since: performance.now(), running: !reduce,
      hand: 0, handV: 0, min: 0, minV: 0, fly: false,
      crown: 0, crownUntil: 0, pusher: 0, pusherUntil: 0,
      lx: -0.5, ly: -0.6, tx: -0.5, ty: -0.6, auto: DEMO && !reduce, demoAt: performance.now(),
    };
    const elapsed = (now: number) => (S.running ? S.base + (now - S.since) / 1000 : S.base);
    const beat = (s: number) => Math.floor(s * BEATS + 1e-6) / BEATS;
    S.hand = (beat(START_AT) / 60) * TAU; S.min = (START_AT / 60 / MINUTES) * TAU;

    const chrome = (c: CanvasRenderingContext2D, x: number, y: number, r: number, turn: number) => {
      if (!hasConic) {
        const g = c.createLinearGradient(x - r, y - r, x + r, y + r);
        g.addColorStop(0, "#fbfbfc"); g.addColorStop(0.3, "#8d9198"); g.addColorStop(0.5, "#e6e8eb"); g.addColorStop(0.75, "#4c4f55"); g.addColorStop(1, "#b5b8bd");
        return g;
      }
      const g = c.createConicGradient(turn, x, y);
      const stops: [number, string][] = [[0, "#ffffff"], [0.05, "#d2d5da"], [0.14, "#62666d"], [0.22, "#a4a8af"], [0.31, "#f3f4f6"], [0.4, "#8b8f96"], [0.5, "#26282c"], [0.58, "#767a81"], [0.68, "#e4e6e9"], [0.77, "#9a9ea5"], [0.88, "#3f4247"], [0.95, "#b9bcc1"], [1, "#ffffff"]];
      for (const [p, col] of stops) g.addColorStop(p, col);
      return g;
    };
    // A knurled steel cylinder seen from the side: used for the crown and the pusher.
    const barrel = (c: CanvasRenderingContext2D, w: number, h: number, y: number, ridges: boolean) => {
      const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
      g.addColorStop(0, "#17181b"); g.addColorStop(0.1, "#7c8087"); g.addColorStop(0.27, "#f6f7f9"); g.addColorStop(0.42, "#b4b8be"); g.addColorStop(0.68, "#666a71"); g.addColorStop(0.9, "#2a2c31"); g.addColorStop(1, "#101113");
      c.beginPath(); c.moveTo(-w / 2, y + h); c.lineTo(-w / 2, y + 3); c.quadraticCurveTo(-w / 2, y, -w / 2 + 4, y); c.lineTo(w / 2 - 4, y); c.quadraticCurveTo(w / 2, y, w / 2, y + 3); c.lineTo(w / 2, y + h); c.closePath();
      c.fillStyle = g; c.fill();
      if (ridges) {
        for (let i = -11; i <= 11; i++) {
          const a = (i / 12) * (Math.PI / 2), x = Math.sin(a) * (w / 2);
          c.beginPath(); c.moveTo(x, y + 2.5); c.lineTo(x, y + h - 1.5); c.lineWidth = 0.6 + Math.cos(a) * 1.1; c.strokeStyle = `rgba(8,9,11,${0.34 + 0.3 * (1 - Math.cos(a))})`; c.stroke();
          c.beginPath(); c.moveTo(x + 1.2 * Math.cos(a), y + 2.5); c.lineTo(x + 1.2 * Math.cos(a), y + h - 1.5); c.lineWidth = 0.5; c.strokeStyle = `rgba(255,255,255,${0.3 * Math.cos(a)})`; c.stroke();
        }
      }
      const cap = c.createLinearGradient(0, y, 0, y + 5);
      cap.addColorStop(0, "rgba(255,255,255,0.75)"); cap.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = cap; c.fillRect(-w / 2 + 3, y + 0.5, w - 6, 5);
      const foot = c.createLinearGradient(0, y + h - 6, 0, y + h);
      foot.addColorStop(0, "rgba(0,0,0,0)"); foot.addColorStop(1, "rgba(0,0,0,0.5)");
      c.fillStyle = foot; c.fillRect(-w / 2, y + h - 6, w, 6);
    };
    const spaced = (c: CanvasRenderingContext2D, text: string, x: number, y: number, gap: number) => {
      const widths = [...text].map((ch) => c.measureText(ch).width + gap);
      let at = x - (widths.reduce((a, b) => a + b, 0) - gap) / 2;
      c.textAlign = "left";
      [...text].forEach((ch, i) => { c.fillText(ch, at, y); at += widths[i]; });
      c.textAlign = "center";
    };

    // The printed enamel dial never changes, so it is painted once.
    const face = document.createElement("canvas");
    const SUB = { y: -50, r: 35 };
    const paintFace = () => {
      const size = Math.ceil((RD * 2 + 4) * k);
      face.width = size; face.height = size;
      const f = face.getContext("2d");
      if (!f) return;
      f.setTransform(k, 0, 0, k, size / 2, size / 2);
      const enamel = f.createRadialGradient(-30, -44, 10, 0, 0, RD);
      enamel.addColorStop(0, "#fffdf6"); enamel.addColorStop(0.6, "#f6f1e3"); enamel.addColorStop(1, "#e2dac6");
      f.beginPath(); f.arc(0, 0, RD + 1, 0, TAU); f.fillStyle = enamel; f.fill();
      let seed = 7;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 900; i++) {
        const a = rand() * TAU, d = Math.sqrt(rand()) * RD;
        f.fillStyle = rand() > 0.5 ? "rgba(120,100,60,0.05)" : "rgba(255,255,255,0.35)";
        f.fillRect(Math.cos(a) * d, Math.sin(a) * d, 0.7, 0.7);
      }
      const ink = "#17181b";
      // Railway track and the fifth-second scale.
      f.strokeStyle = ink; f.lineWidth = 0.7;
      for (const r of [RD - 5, RD - 13]) { f.beginPath(); f.arc(0, 0, r, 0, TAU); f.stroke(); }
      for (let i = 0; i < 60 * BEATS; i++) {
        const a = (i / (60 * BEATS)) * TAU, five = i % (5 * BEATS) === 0, one = i % BEATS === 0;
        const r0 = RD - 5, r1 = five ? RD - 24 : one ? RD - 19 : RD - 13;
        f.beginPath(); f.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); f.lineTo(Math.sin(a) * r1, -Math.cos(a) * r1);
        f.lineWidth = five ? 2.3 : one ? 1.2 : 0.55; f.strokeStyle = five || one ? ink : "rgba(23,24,27,0.6)"; f.stroke();
      }
      f.fillStyle = ink; f.textAlign = "center"; f.textBaseline = "middle";
      for (let n = 5; n <= 60; n += 5) {
        const a = (n / 60) * TAU, big = n % 15 === 0, r = RD - (big ? 44 : 41);
        f.font = `${big ? 700 : 500} ${big ? 24 : 16}px Georgia, "Times New Roman", serif`;
        f.fillText(String(n), Math.sin(a) * r, -Math.cos(a) * r + 1);
      }
      // Red quarter markers outside the track.
      f.fillStyle = ACCENT;
      for (let q = 0; q < 4; q++) {
        f.save(); f.rotate((q * Math.PI) / 2); f.beginPath(); f.moveTo(0, -RD + 4.5); f.lineTo(-3.4, -RD - 0.5); f.lineTo(3.4, -RD - 0.5); f.closePath(); f.fill(); f.restore();
      }
      // The sunk minute recorder.
      f.save(); f.translate(0, SUB.y);
      const well = f.createRadialGradient(0, 0, SUB.r * 0.2, 0, 0, SUB.r);
      well.addColorStop(0, "#f1ebdb"); well.addColorStop(0.85, "#e9e2cf"); well.addColorStop(1, "#cfc6ae");
      f.beginPath(); f.arc(0, 0, SUB.r, 0, TAU); f.fillStyle = well; f.fill();
      for (let r = 4; r < SUB.r - 13; r += 2.2) { f.beginPath(); f.arc(0, 0, r, 0, TAU); f.lineWidth = 0.5; f.strokeStyle = "rgba(90,74,40,0.11)"; f.stroke(); }
      const lip = f.createLinearGradient(-SUB.r, -SUB.r, SUB.r, SUB.r);
      lip.addColorStop(0, "rgba(60,48,24,0.55)"); lip.addColorStop(0.5, "rgba(60,48,24,0.12)"); lip.addColorStop(1, "rgba(255,255,255,0.95)");
      f.beginPath(); f.arc(0, 0, SUB.r - 0.6, 0, TAU); f.lineWidth = 1.4; f.strokeStyle = lip; f.stroke();
      f.strokeStyle = ink; f.fillStyle = ink;
      for (let i = 0; i < MINUTES; i++) {
        const a = (i / MINUTES) * TAU, long = i % 5 === 0, r0 = SUB.r - 5, r1 = SUB.r - (long ? 12 : 9);
        f.beginPath(); f.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); f.lineTo(Math.sin(a) * r1, -Math.cos(a) * r1); f.lineWidth = long ? 1.3 : 0.6; f.stroke();
      }
      f.font = `600 8.5px Georgia, "Times New Roman", serif`;
      for (let n = MINUTES / 3; n <= MINUTES; n += MINUTES / 3) { const a = (n / MINUTES) * TAU; f.fillText(String(n), Math.sin(a) * (SUB.r - 18), -Math.cos(a) * (SUB.r - 18) + 0.5); }
      f.restore();
      f.fillStyle = ink; f.font = `600 8.5px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      spaced(f, `1/${BEATS} SECOND`, 0, 50, 2.4);
      f.fillStyle = "rgba(23,24,27,0.62)"; f.font = `500 7px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      spaced(f, `${MINUTES} MINUTE RECORDER`, 0, 64, 1.8);
    };

    const hand = (len: number, tail: number, w: number, tip: boolean) => {
      const steel = ctx.createLinearGradient(-w, 0, w, 0);
      steel.addColorStop(0, "#0b1330"); steel.addColorStop(0.45, "#3d63c9"); steel.addColorStop(0.6, "#22408f"); steel.addColorStop(1, "#080d22");
      ctx.beginPath();
      ctx.moveTo(-w * 0.5, 0); ctx.lineTo(-w * 0.22, -len); ctx.lineTo(w * 0.22, -len); ctx.lineTo(w * 0.5, 0);
      ctx.lineTo(w * 0.7, tail * 0.45); ctx.arc(0, tail * 0.72, w * 1.55, -0.5, Math.PI + 0.5); ctx.lineTo(-w * 0.7, tail * 0.45);
      ctx.closePath(); ctx.fillStyle = steel; ctx.fill();
      if (tip) { ctx.shadowColor = "transparent"; ctx.fillStyle = ACCENT; ctx.fillRect(-w * 0.26, -len, w * 0.52, 20); }
    };

    const draw = (now: number) => {
      const t = elapsed(now);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const la = Math.atan2(S.ly, S.lx); // direction the lamp sits in
      const crownY = S.crown * 6, pushY = S.pusher * 5;

      // Shadow on the table.
      ctx.save(); ctx.translate(CX - S.lx * 16, CY - S.ly * 22 + 8); ctx.scale(1, 1);
      const sh = ctx.createRadialGradient(0, 0, R * 0.7, 0, 0, R * 1.32);
      sh.addColorStop(0, "rgba(0,0,0,0.7)"); sh.addColorStop(0.55, "rgba(0,0,0,0.3)"); sh.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 0, R * 1.32, 0, TAU); ctx.fill(); ctx.restore();

      // The bow: a polished steel ring the lanyard goes through.
      const bow = { x: CX, y: CY - R - 62, r: 37 };
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 10 * k; ctx.shadowOffsetX = -S.lx * 7 * k; ctx.shadowOffsetY = (6 - S.ly * 6) * k;
      ctx.beginPath(); ctx.arc(bow.x, bow.y, bow.r, 0, TAU); ctx.lineWidth = 11; ctx.strokeStyle = "#1b1c1f"; ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(bow.x, bow.y, bow.r, 0, TAU); ctx.lineWidth = 9.4; ctx.strokeStyle = chrome(ctx, bow.x, bow.y, bow.r, la + 0.6); ctx.stroke();
      ctx.beginPath(); ctx.arc(bow.x, bow.y, bow.r + 2.2, la - 0.7, la + 0.7); ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(bow.x, bow.y, bow.r - 2.4, la + Math.PI - 0.6, la + Math.PI + 0.6); ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(bow.x, bow.y, bow.r - 4.9, 0, TAU); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(bow.x, bow.y, bow.r + 4.9, 0, TAU); ctx.stroke();

      // Pusher, then crown, each a neck fixed to the case and a cap that travels.
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(PUSH);
      barrel(ctx, 15, 16, -R - 9, false);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 6 * k; ctx.shadowOffsetY = 3 * k;
      barrel(ctx, 25, 15, -R - 22 + pushY, true); ctx.restore();
      ctx.restore();
      ctx.save(); ctx.translate(CX, CY);
      barrel(ctx, 27, 22, -R - 14, false);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 7 * k; ctx.shadowOffsetX = -S.lx * 3 * k; ctx.shadowOffsetY = 3 * k;
      barrel(ctx, 56, 30, -R - 41 + crownY, true); ctx.restore();
      ctx.restore();

      // Case: polished outer ring, a bevel that catches the opposite light, the inner bezel.
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, TAU); ctx.fillStyle = chrome(ctx, CX, CY, R, la); ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, R - 1.6, 0, TAU); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.stroke();
      const bevel = ctx.createLinearGradient(CX + S.lx * R, CY + S.ly * R, CX - S.lx * R, CY - S.ly * R);
      bevel.addColorStop(0, "#3a3c41"); bevel.addColorStop(0.45, "#8e9299"); bevel.addColorStop(1, "#fafbfc");
      ctx.beginPath(); ctx.arc(CX, CY, R - 15, 0, TAU); ctx.fillStyle = bevel; ctx.fill();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(0,0,0,0.45)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, R - 20, 0, TAU); ctx.fillStyle = chrome(ctx, CX, CY, R, la + Math.PI * 0.86); ctx.fill();
      ctx.beginPath(); ctx.arc(CX, CY, RD + 3.5, 0, TAU); ctx.fillStyle = "#0c0d0f"; ctx.fill();

      // Dial, the shadow the bezel throws on it, then the hands.
      ctx.drawImage(face, CX - RD - 2, CY - RD - 2, RD * 2 + 4, RD * 2 + 4);
      ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, RD + 1, 0, TAU); ctx.clip();
      const cast = ctx.createRadialGradient(CX - S.lx * 9, CY - S.ly * 9, RD * 0.86, CX - S.lx * 9, CY - S.ly * 9, RD + 6);
      cast.addColorStop(0, "rgba(40,28,8,0)"); cast.addColorStop(1, "rgba(40,28,8,0.36)");
      ctx.fillStyle = cast; ctx.fillRect(CX - RD - 4, CY - RD - 4, RD * 2 + 8, RD * 2 + 8);

      const drop = (lift: number) => { ctx.shadowColor = "rgba(30,20,5,0.4)"; ctx.shadowBlur = lift * 1.2 * k; ctx.shadowOffsetX = -S.lx * lift * k; ctx.shadowOffsetY = -S.ly * lift * k + lift * 0.5 * k; };
      ctx.save(); ctx.translate(CX, CY + SUB.y); ctx.rotate(S.min); drop(2.5); hand(SUB.r - 9, 9, 3.2, false); ctx.restore();
      ctx.save(); ctx.translate(CX, CY + SUB.y); ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, TAU); ctx.fillStyle = "#c9ccd1"; ctx.fill(); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(S.hand); drop(6); hand(RD - 9, 46, 5.2, true); ctx.restore();
      ctx.save(); ctx.translate(CX, CY); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 3 * k; ctx.shadowOffsetY = 1.5 * k;
      ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, TAU); ctx.fillStyle = chrome(ctx, 0, 0, 7.5, la); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(CX, CY, 2.3, 0, TAU); ctx.fillStyle = "#15161a"; ctx.fill();

      // The domed crystal: a broad soft bloom, a window, and a rim light on the far side.
      const gx = CX + S.lx * RD * 0.52, gy = CY + S.ly * RD * 0.52;
      const bloom = ctx.createRadialGradient(gx, gy, 0, gx, gy, RD * 0.95);
      bloom.addColorStop(0, "rgba(255,255,255,0.34)"); bloom.addColorStop(0.45, "rgba(255,255,255,0.09)"); bloom.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bloom; ctx.fillRect(CX - RD, CY - RD, RD * 2, RD * 2);
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(la + Math.PI / 2);
      const pane = ctx.createLinearGradient(0, -RD, 0, -RD * 0.5);
      pane.addColorStop(0, "rgba(255,255,255,0.85)"); pane.addColorStop(1, "rgba(255,255,255,0.1)");
      ctx.fillStyle = pane;
      ctx.beginPath(); ctx.arc(0, 0, RD - 7, Math.PI * 1.14, Math.PI * 1.86); ctx.arc(0, RD * 0.62, RD * 1.36, Math.PI * 1.69, Math.PI * 1.31, true); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, RD - 2.5, Math.PI / 2 - 0.55, Math.PI / 2 + 0.55); ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.stroke();
      ctx.restore();
      const dark = ctx.createRadialGradient(CX - S.lx * RD, CY - S.ly * RD, RD * 0.5, CX - S.lx * RD, CY - S.ly * RD, RD * 1.6);
      dark.addColorStop(0, "rgba(10,14,20,0.2)"); dark.addColorStop(1, "rgba(10,14,20,0)");
      ctx.fillStyle = dark; ctx.fillRect(CX - RD, CY - RD, RD * 2, RD * 2);
      ctx.restore();
      ctx.beginPath(); ctx.arc(CX, CY, RD + 1.2, 0, TAU); ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.stroke();
      return t;
    };

    const settle = (now: number) => { const t = elapsed(now); S.hand = (beat(t) / 60) * TAU; S.min = (t / 60 / MINUTES) * TAU; S.crown = 0; S.pusher = 0; };

    api.current = {
      crown: (byUser) => {
        const now = performance.now();
        if (byUser) S.auto = false;
        if (S.running) { S.base = beat(elapsed(now)); S.running = false; setShown(S.base); setPhase("stopped"); }
        else { S.since = now; S.running = true; setPhase("running"); }
        S.crownUntil = now + 130;
        if (reduce) { settle(now); draw(now); } else wake();
      },
      reset: (byUser) => {
        const now = performance.now();
        if (byUser) S.auto = false;
        S.running = false; S.base = 0; S.fly = true;
        // Fly back the short way round, as the heart cam does.
        S.hand = Math.atan2(Math.sin(S.hand), Math.cos(S.hand)); S.min = Math.atan2(Math.sin(S.min), Math.cos(S.min));
        S.pusherUntil = now + 130; setShown(0); setPhase("zeroed");
        if (reduce) { settle(now); draw(now); } else wake();
      },
    };

    let raf = 0, last = performance.now(), seen = true;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (S.auto) {
        // Self-running demo: stop, fly back, start again.
        const d = ((now - S.demoAt) / 1000) % 13;
        const stage3 = d < 8.2 ? 0 : d < 10 ? 1 : d < 11.2 ? 2 : 3;
        if (stage3 === 1 && S.running) api.current?.crown(false);
        if (stage3 === 2 && (S.base !== 0 || S.running)) api.current?.reset(false);
        if (stage3 === 3 && !S.running) api.current?.crown(false);
        S.tx = -0.5 + Math.sin(now / 2600) * 0.32; S.ty = -0.62 + Math.cos(now / 3400) * 0.14;
      }
      const t = elapsed(now);
      const goal = (beat(t) / 60) * TAU, goalM = (t / 60 / MINUTES) * TAU;
      const stiff = S.fly ? 330 : 2600, damp = S.fly ? 21 : 64;
      for (let i = 0; i < 2; i++) {
        const h = dt / 2;
        S.handV += ((goal - S.hand) * stiff - S.handV * damp) * h; S.hand += S.handV * h;
        S.minV += ((goalM - S.min) * 240 - S.minV * 19) * h; S.min += S.minV * h;
      }
      if (S.fly && Math.abs(S.hand - goal) < 0.002 && Math.abs(S.handV) < 0.02 && S.running) S.fly = false;
      if (S.fly && S.running && Math.abs(S.hand - goal) < 0.05) S.fly = false;
      S.crown += ((now < S.crownUntil ? 1 : 0) - S.crown) * Math.min(1, dt * 26);
      S.pusher += ((now < S.pusherUntil ? 1 : 0) - S.pusher) * Math.min(1, dt * 26);
      S.lx += (S.tx - S.lx) * Math.min(1, dt * 5); S.ly += (S.ty - S.ly) * Math.min(1, dt * 5);
      draw(now);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    function wake() { if (!reduce && !raf && seen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    const still = () => { const now = performance.now(); settle(now); draw(now); };

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      const dx = (e.clientX - (r.left + (CX / W) * r.width)) / r.width, dy = (e.clientY - (r.top + (CY / H) * r.height)) / r.height;
      const d = Math.hypot(dx, dy) || 1, reach = Math.min(0.85, 0.35 + d);
      S.tx = (dx / d) * reach; S.ty = (dy / d) * reach;
    };
    const onLeave = () => { S.tx = -0.5; S.ty = -0.62; };
    const size = () => {
      const w = cv.clientWidth;
      if (!w) return;
      k = (w / W) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * k); cv.height = Math.round(H * k);
      paintFace();
      if (reduce) still(); else { draw(performance.now()); wake(); }
    };
    const ro = new ResizeObserver(size); ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    box.addEventListener("pointermove", onMove); box.addEventListener("pointerleave", onLeave);
    // With motion reduced the hand still has to tell the time: redraw once a second, no springs.
    const slow = reduce ? window.setInterval(still, 1000) : 0;
    size();
    return () => {
      cancelAnimationFrame(raf); if (slow) window.clearInterval(slow);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
      box.removeEventListener("pointermove", onMove); box.removeEventListener("pointerleave", onLeave);
      api.current = null;
    };
  }, []);

  const px = CX + Math.sin(PUSH) * (R + 16), py = CY - Math.cos(PUSH) * (R + 16);
  const line = phase === "running" ? "Press the crown to stop" : phase === "stopped" ? `Held at ${clock(shown)}` : "Press the crown to start";

  return (
    <div ref={stage} className="flex min-h-[780px] w-full flex-col items-center justify-center bg-[#0d1512] bg-[radial-gradient(80%_62%_at_50%_46%,#20352c_0%,#122019_45%,#0a100e_100%)] px-4 py-12">
      <div className="relative w-full" style={{ maxWidth: 590, aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <button
          type="button"
          aria-pressed={phase === "running"}
          aria-label={phase === "running" ? "Stop the stopwatch" : "Start the stopwatch"}
          onClick={() => api.current?.crown(true)}
          style={{ left: pct(CX - 48, W), top: pct(CY - R - 106, H), width: pct(96, W), height: pct(118, H), ["--tw-ring-color" as string]: ACCENT }}
          className="absolute cursor-pointer rounded-[28px] outline-none focus-visible:ring-2"
        />
        <button
          type="button"
          aria-label="Reset to zero"
          onClick={() => api.current?.reset(true)}
          style={{ left: pct(px - 35, W), top: pct(py - 35, H), width: pct(70, W), height: pct(70, H), ["--tw-ring-color" as string]: ACCENT }}
          className="absolute cursor-pointer rounded-full outline-none focus-visible:ring-2"
        />
      </div>
      <p aria-live="polite" className="mt-6 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-emerald-100/60">
        <span className="text-emerald-50">{phase === "running" ? "Running" : phase === "stopped" ? "Stopped" : "Zeroed"}</span>
        <span className="mx-2 text-emerald-100/30">/</span>
        {line}
      </p>
    </div>
  );
}
