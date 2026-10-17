import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

const DIAL_DARK = "#0a1733"; // deepest blue of the sunburst dial
const DIAL_LIGHT = "#3f68b8"; // the bright rays
const STRAP = "#9b5a2a"; // leather
const ACCENT = "#ff6a2b"; // seconds hand
const BEATS = 8; // steps the seconds hand takes each second, like a mechanical movement
const W = 420, H = 520, CX = 210, CY = 260, R = 118, GLASS = 98, DIAL = 91;

const pad2 = (n: number) => String(n).padStart(2, "0");
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function SteelWristwatch() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [pulled, setPulled] = useState(false);
  const [shifted, setShifted] = useState(false);
  const [label, setLabel] = useState({ date: "", time: "--:--:--" });
  // offset: how far the watch is from the real time. frozen: the time held while the crown is out.
  const live = useRef({ offset: 0, frozen: 0, pulled: false, touched: -1e9 });
  const redraw = useRef<() => void>(() => {});

  useEffect(() => {
    const cv = canvas.current, area = hit.current;
    if (!cv || !area) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.2; // drawn a fifth larger on wide screens
    cv.width = W * dpr; cv.height = H * dpr;
    const L = live.current;
    const conic = typeof ctx.createConicGradient === "function";

    // Leather grain, made once.
    const grain = document.createElement("canvas"); grain.width = 128; grain.height = 128;
    const gx = grain.getContext("2d");
    if (gx) {
      let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 1500; i++) { const v = rnd(); gx.fillStyle = v > 0.5 ? `rgba(255,225,190,${(v - 0.5) * 0.2})` : `rgba(30,10,0,${(0.5 - v) * 0.3})`; gx.beginPath(); gx.ellipse(rnd() * 128, rnd() * 128, 0.5 + rnd() * 1.5, 0.4 + rnd() * 0.8, rnd() * 3, 0, Math.PI * 2); gx.fill(); }
    }
    const grainFill = ctx.createPattern(grain, "repeat");

    const steel = (x0: number, y0: number, x1: number, y1: number) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      const st: [number, string][] = [[0, "#eef1f4"], [0.18, "#b4bac2"], [0.42, "#f7f8fa"], [0.6, "#8b929b"], [0.8, "#c9ced5"], [1, "#6d747d"]];
      for (const [p, c] of st) g.addColorStop(p, c);
      return g;
    };
    const ring = (angle: number, stops: [number, string][]) => {
      if (!conic) return steel(CX - R, CY - R, CX + R, CY + R);
      const g = ctx.createConicGradient(angle, CX, CY);
      for (const [p, c] of stops) g.addColorStop(p, c);
      return g;
    };

    const strap = (dir: number) => {
      // dir -1 is the half above the case, +1 the half below it
      const y0 = CY + dir * (R - 14), y1 = dir < 0 ? -4 : H + 4, w0 = 57, w1 = 50;
      const path = () => { ctx.beginPath(); ctx.moveTo(CX - w0, y0); ctx.lineTo(CX + w0, y0); ctx.lineTo(CX + w1, y1); ctx.lineTo(CX - w1, y1); ctx.closePath(); };
      ctx.save(); ctx.shadowColor = "rgba(40,48,60,0.45)"; ctx.shadowBlur = 18 * dpr; ctx.shadowOffsetX = 5 * dpr; ctx.shadowOffsetY = 12 * dpr;
      path(); ctx.fillStyle = STRAP; ctx.fill(); ctx.restore();
      ctx.save(); path(); ctx.clip();
      if (grainFill) { ctx.fillStyle = grainFill; ctx.fillRect(CX - w0, Math.min(y0, y1), w0 * 2, Math.abs(y1 - y0)); }
      // padded middle: light along the crown of the pad, dark toward the stitched edges
      const padG = ctx.createLinearGradient(CX - w0, 0, CX + w0, 0);
      padG.addColorStop(0, "rgba(20,6,0,0.55)"); padG.addColorStop(0.13, "rgba(20,6,0,0.12)"); padG.addColorStop(0.36, "rgba(255,230,200,0.2)"); padG.addColorStop(0.6, "rgba(255,230,200,0.02)"); padG.addColorStop(0.87, "rgba(20,6,0,0.2)"); padG.addColorStop(1, "rgba(20,6,0,0.62)");
      ctx.fillStyle = padG; ctx.fillRect(CX - w0, Math.min(y0, y1), w0 * 2, Math.abs(y1 - y0));
      const under = ctx.createLinearGradient(0, y0, 0, y0 + dir * 44);
      under.addColorStop(0, "rgba(10,4,0,0.75)"); under.addColorStop(1, "rgba(10,4,0,0)");
      ctx.fillStyle = under; ctx.fillRect(CX - w0, Math.min(y0, y0 + dir * 44), w0 * 2, 44);
      ctx.restore();
      // saddle stitching, each stitch a short slanted thread with its own shadow
      for (const sd of [-1, 1]) {
        for (let k = 0; k < 30; k++) {
          const y = y0 + dir * (26 + k * 8.4); if (y < -6 || y > H + 6) break;
          const f = Math.abs(y - y0) / Math.abs(y1 - y0), x = CX + sd * (w0 - 7 - (w0 - w1) * f);
          ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(x - 0.8, y + 1); ctx.lineTo(x + 0.8, y + 6.2); ctx.lineWidth = 2.2; ctx.strokeStyle = "rgba(30,10,0,0.55)"; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x - 0.8, y); ctx.lineTo(x + 0.8, y + 5); ctx.lineWidth = 1.5; ctx.strokeStyle = "#efe2c8"; ctx.stroke();
        }
      }
      if (dir > 0) {
        for (let k = 0; k < 3; k++) {
          const y = CY + R + 56 + k * 24;
          ctx.beginPath(); ctx.ellipse(CX, y, 3.4, 4.2, 0, 0, Math.PI * 2); ctx.fillStyle = "#1c0d04"; ctx.fill();
          ctx.beginPath(); ctx.ellipse(CX, y + 1.2, 3.4, 4.2, 0, 0.2, Math.PI - 0.2); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,225,190,0.4)"; ctx.stroke();
        }
      }
    };

    const blade = (angle: number, len: number, w: number, tail: number) => {
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(angle);
      ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 5 * dpr; ctx.shadowOffsetX = 2.5 * dpr; ctx.shadowOffsetY = 5 * dpr;
      ctx.beginPath(); ctx.moveTo(-w, tail); ctx.lineTo(-w, -len + w * 1.6); ctx.lineTo(0, -len); ctx.lineTo(w, -len + w * 1.6); ctx.lineTo(w, tail); ctx.closePath();
      ctx.fillStyle = "#cfd4da"; ctx.fill(); ctx.shadowColor = "transparent";
      // two facets: one catches the light, the other does not
      ctx.beginPath(); ctx.moveTo(-w, tail); ctx.lineTo(-w, -len + w * 1.6); ctx.lineTo(0, -len); ctx.lineTo(0, tail); ctx.closePath(); ctx.fillStyle = "#fbfcfd"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, tail); ctx.lineTo(0, -len); ctx.lineTo(w, -len + w * 1.6); ctx.lineTo(w, tail); ctx.closePath(); ctx.fillStyle = "#8d949d"; ctx.fill();
      ctx.fillStyle = "#eef6e6"; ctx.fillRect(-w * 0.42, -len + w * 2.6, w * 0.84, len * 0.5);
      ctx.restore();
    };

    const draw = (shown: number, lightA: number, crown: number, moving: boolean) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const d = new Date(shown);

      strap(-1); strap(1);

      // Lugs.
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        ctx.save(); ctx.translate(CX + sx * 56, CY + sy * 70); ctx.scale(sx, sy);
        ctx.shadowColor = "rgba(30,38,50,0.5)"; ctx.shadowBlur = 8 * dpr; ctx.shadowOffsetX = 3 * dpr; ctx.shadowOffsetY = 8 * dpr;
        const horn = () => { ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(29, 4); ctx.bezierCurveTo(28, 36, 22, 52, 16, 60); ctx.quadraticCurveTo(12, 65, 6, 65); ctx.lineTo(0, 64); ctx.closePath(); };
        horn(); ctx.fillStyle = "#aab0b8"; ctx.fill(); ctx.shadowColor = "transparent";
        // brushed top face, darker toward the tip, with a polished bevel down the outside
        const top = ctx.createLinearGradient(0, 26, 0, 66); top.addColorStop(0, "#aeb4bc"); top.addColorStop(0.6, "#868d96"); top.addColorStop(1, "#5c636c");
        horn(); ctx.fillStyle = top; ctx.fill();
        ctx.save(); horn(); ctx.clip();
        for (let y = 20; y < 78; y += 1.3) { ctx.fillStyle = Math.round(y * 10) % 3 ? "rgba(255,255,255,0.14)" : "rgba(30,36,44,0.14)"; ctx.fillRect(0, y, 32, 0.5); }
        ctx.restore();
        // polished bevel: a bright facet that follows the outside curve
        ctx.beginPath(); ctx.moveTo(26.5, 6); ctx.bezierCurveTo(25.5, 36, 20, 50, 14.4, 57.6);
        ctx.lineWidth = 4.2; ctx.lineCap = "round"; ctx.strokeStyle = "rgba(248,250,252,0.96)"; ctx.stroke();
        ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(60,68,80,0.5)"; ctx.beginPath(); ctx.moveTo(24, 8); ctx.bezierCurveTo(23, 36, 18, 48, 12.6, 55.6); ctx.stroke();
        ctx.save();
        ctx.restore();
        horn(); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(40,46,56,0.6)"; ctx.stroke();
        ctx.restore();
      }

      // Crown: sits against the case, or slides out on its stem.
      const cxo = CX + R - 3 + crown * 9;
      ctx.fillStyle = steel(0, CY - 5, 0, CY + 5); ctx.fillRect(CX + R - 6, CY - 4.5, 12 + crown * 9, 9);
      ctx.save(); ctx.shadowColor = "rgba(30,38,50,0.5)"; ctx.shadowBlur = 6 * dpr; ctx.shadowOffsetY = 5 * dpr;
      ctx.beginPath(); ctx.moveTo(cxo, CY - 15); ctx.lineTo(cxo + 17, CY - 16.5); ctx.quadraticCurveTo(cxo + 21, CY, cxo + 17, CY + 16.5); ctx.lineTo(cxo, CY + 15); ctx.closePath();
      ctx.fillStyle = steel(0, CY - 17, 0, CY + 17); ctx.fill(); ctx.restore();
      for (let k = 0; k < 10; k++) {
        const y = CY - 14.6 + k * 3.1;
        ctx.fillStyle = "rgba(20,26,34,0.6)"; ctx.fillRect(cxo + 1, y, 16.5, 1.2);
        ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillRect(cxo + 1, y + 1.2, 16.5, 0.7);
      }

      // Case: a brushed flank, a polished bezel and a dark inner wall.
      ctx.save(); ctx.shadowColor = "rgba(30,38,50,0.55)"; ctx.shadowBlur = 26 * dpr; ctx.shadowOffsetX = 6 * dpr; ctx.shadowOffsetY = 16 * dpr;
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.fillStyle = "#9aa1a9"; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.fillStyle = ring(lightA * 0.25 - 2.2, [[0, "#f4f6f8"], [0.1, "#c2c8cf"], [0.22, "#8e959e"], [0.34, "#b9bfc7"], [0.5, "#e9ecef"], [0.6, "#aab1b9"], [0.74, "#7f868f"], [0.88, "#c4cad1"], [1, "#f4f6f8"]]);
      ctx.fill();
      // brushing: fine circular scratches
      ctx.save(); ctx.globalAlpha = 0.5;
      for (let r = 107.5; r < R - 1; r += 0.9) { ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2); ctx.lineWidth = 0.4; ctx.strokeStyle = (Math.round(r * 10) % 3 === 0) ? "rgba(255,255,255,0.5)" : "rgba(40,48,58,0.35)"; ctx.stroke(); }
      ctx.restore();
      const vol = ctx.createLinearGradient(CX - R * 0.7, CY - R * 0.7, CX + R * 0.7, CY + R * 0.7);
      vol.addColorStop(0, "rgba(255,255,255,0.3)"); vol.addColorStop(0.5, "rgba(255,255,255,0)"); vol.addColorStop(1, "rgba(24,30,40,0.42)");
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.fillStyle = vol; ctx.fill();
      ctx.beginPath(); ctx.arc(CX, CY, R - 0.5, 0, Math.PI * 2); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(40,48,58,0.55)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, 107, 0, Math.PI * 2);
      ctx.fillStyle = ring(lightA - 2.3, [[0, "#ffffff"], [0.04, "#f2f4f6"], [0.11, "#6c737c"], [0.2, "#30353c"], [0.3, "#9299a2"], [0.4, "#e4e7ea"], [0.47, "#ffffff"], [0.53, "#b5bbc3"], [0.63, "#3b4047"], [0.74, "#7b828b"], [0.86, "#d7dbe0"], [0.95, "#f9fafb"], [1, "#ffffff"]]);
      ctx.fill();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(30,36,44,0.6)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, GLASS, 0, Math.PI * 2);
      const wall = ctx.createLinearGradient(0, CY - GLASS, 0, CY + GLASS); wall.addColorStop(0, "#0c0f14"); wall.addColorStop(1, "#6e7680");
      ctx.fillStyle = wall; ctx.fill();

      // Sunburst dial: the rays turn with the light, never with the hands.
      ctx.beginPath(); ctx.arc(CX, CY, DIAL, 0, Math.PI * 2);
      if (conic) {
        const g = ctx.createConicGradient(lightA, CX, CY);
        const pat = [1, 0.5, 0.1, 0.32, 0.04, 0.42, 0.86, 0.5, 0.12, 0.3, 0.02, 0.36, 0.78, 0.44, 0.08, 0.5];
        pat.forEach((v, i) => g.addColorStop(i / pat.length, v > 0.5 ? DIAL_LIGHT : DIAL_DARK));
        g.addColorStop(1, DIAL_LIGHT);
        ctx.fillStyle = DIAL_DARK; ctx.fill();
        ctx.save(); ctx.clip();
        const g2 = ctx.createConicGradient(lightA, CX, CY);
        pat.forEach((v, i) => g2.addColorStop(i / pat.length, `rgba(255,255,255,${v * 0.36})`)); g2.addColorStop(1, `rgba(255,255,255,${pat[0] * 0.36})`);
        ctx.globalAlpha = 0.62; ctx.fillStyle = g; ctx.fillRect(CX - DIAL, CY - DIAL, DIAL * 2, DIAL * 2);
        ctx.globalAlpha = 1; ctx.fillStyle = g2; ctx.fillRect(CX - DIAL, CY - DIAL, DIAL * 2, DIAL * 2);
        ctx.restore();
      } else { ctx.fillStyle = DIAL_DARK; ctx.fill(); }
      const vig = ctx.createRadialGradient(CX, CY, 20, CX, CY, DIAL);
      vig.addColorStop(0, "rgba(120,160,255,0.16)"); vig.addColorStop(0.6, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(0,0,10,0.6)");
      ctx.beginPath(); ctx.arc(CX, CY, DIAL, 0, Math.PI * 2); ctx.fillStyle = vig; ctx.fill();

      // Printed minute track and applied steel markers.
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2, s = Math.sin(a), c = -Math.cos(a);
        ctx.beginPath(); ctx.moveTo(CX + s * (i % 5 ? 85 : 83.5), CY + c * (i % 5 ? 85 : 83.5)); ctx.lineTo(CX + s * 88.5, CY + c * 88.5);
        ctx.lineWidth = i % 5 ? 0.7 : 1.3; ctx.strokeStyle = "rgba(240,244,250,0.85)"; ctx.stroke();
      }
      for (let n = 0; n < 12; n++) {
        if (n === 3) continue;
        ctx.save(); ctx.translate(CX, CY); ctx.rotate((n / 12) * Math.PI * 2);
        const w = n === 0 ? 8.4 : 4.6, y = -80, h = n % 3 === 0 ? 19 : 15;
        ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 3 * dpr; ctx.shadowOffsetX = 1.5 * dpr; ctx.shadowOffsetY = 3 * dpr;
        ctx.fillStyle = "#b9bfc7"; ctx.fillRect(-w / 2, y, w, h); ctx.shadowColor = "transparent";
        ctx.fillStyle = "#ffffff"; ctx.fillRect(-w / 2, y, w * 0.5, h);
        ctx.fillStyle = "#7d848d"; ctx.fillRect(0, y, w * 0.5, h);
        ctx.fillStyle = "#f1f7ea"; ctx.fillRect(-w / 2 + 1.1, y + 1.4, w - 2.2, h - 5);
        if (n === 0) { ctx.fillStyle = DIAL_DARK; ctx.fillRect(-0.6, y, 1.2, h); }
        ctx.restore();
      }
      // Date window with its own polished frame.
      const dx = CX + 55, dy = CY - 9.5;
      ctx.fillStyle = steel(dx - 2, dy - 2, dx + 26, dy + 21); ctx.fillRect(dx - 1.8, dy - 1.8, 26.6, 22.6);
      const paper = ctx.createLinearGradient(0, dy, 0, dy + 19); paper.addColorStop(0, "#b9b6ad"); paper.addColorStop(0.3, "#f6f3ea"); paper.addColorStop(1, "#fbf9f2");
      ctx.fillStyle = paper; ctx.fillRect(dx, dy, 23, 19);
      ctx.fillStyle = "#14161a"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = '700 14px "Helvetica Neue", Helvetica, Arial, sans-serif'; ctx.fillText(String(d.getDate()), dx + 11.5, dy + 10.4);
      // A small applied emblem instead of a maker's name, and two lines of dial text.
      ctx.save(); ctx.translate(CX, CY - 46); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(-4.2, -4.2, 4.2, 8.4); ctx.fillStyle = "#8d949d"; ctx.fillRect(0, -4.2, 4.2, 8.4); ctx.restore();
      ctx.fillStyle = "rgba(236,241,250,0.86)"; ctx.font = '600 6.4px "Helvetica Neue", Helvetica, Arial, sans-serif';
      ctx.fillText("A U T O M A T I C", CX, CY + 36);
      ctx.fillStyle = "rgba(236,241,250,0.6)"; ctx.font = '500 5.4px "Helvetica Neue", Helvetica, Arial, sans-serif';
      ctx.fillText("1 0 0 M   ·   2 8 8 0 0", CX, CY + 46);

      // Hands.
      const ms = d.getMilliseconds(), secs = d.getSeconds() + (moving ? Math.floor((ms / 1000) * BEATS) / BEATS : 0);
      const mins = d.getMinutes() + d.getSeconds() / 60, hrs = (d.getHours() % 12) + mins / 60;
      blade((hrs / 12) * Math.PI * 2, 50, 4.4, 9);
      blade((mins / 60) * Math.PI * 2, 78, 3.5, 11);
      ctx.save(); ctx.translate(CX, CY); ctx.rotate((secs / 60) * Math.PI * 2);
      ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 4 * dpr; ctx.shadowOffsetX = 3.5 * dpr; ctx.shadowOffsetY = 7 * dpr;
      ctx.fillStyle = ACCENT; ctx.fillRect(-0.75, -86, 1.5, 106);
      ctx.fillRect(-2.2, 12, 4.4, 14);
      ctx.restore();
      const cap = ctx.createRadialGradient(CX - 1.5, CY - 1.5, 0.3, CX, CY, 5);
      cap.addColorStop(0, "#ffffff"); cap.addColorStop(0.5, "#b4bac2"); cap.addColorStop(1, "#4d545c");
      ctx.beginPath(); ctx.arc(CX, CY, 4.6, 0, Math.PI * 2); ctx.fillStyle = cap; ctx.fill();

      // Sapphire crystal: a soft window band that slides with the light, a violet coating bloom, an edge glint.
      ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, GLASS, 0, Math.PI * 2); ctx.clip();
      const lx = Math.cos(lightA), ly = Math.sin(lightA);
      ctx.save(); ctx.translate(CX + lx * 26, CY + ly * 26); ctx.rotate(lightA + Math.PI / 2 + 0.5);
      const band = ctx.createLinearGradient(-70, 0, 70, 0);
      band.addColorStop(0, "rgba(255,255,255,0)"); band.addColorStop(0.3, "rgba(255,255,255,0.03)"); band.addColorStop(0.44, "rgba(235,242,255,0.2)"); band.addColorStop(0.56, "rgba(235,242,255,0.2)"); band.addColorStop(0.57, "rgba(255,255,255,0.05)"); band.addColorStop(0.72, "rgba(235,242,255,0.11)"); band.addColorStop(0.73, "rgba(255,255,255,0)");
      ctx.fillStyle = band; ctx.fillRect(-70, -220, 140, 440); ctx.restore();
      const ar = ctx.createRadialGradient(CX - lx * 70, CY - ly * 70, 4, CX - lx * 70, CY - ly * 70, 80);
      ar.addColorStop(0, "rgba(120,96,255,0.3)"); ar.addColorStop(0.5, "rgba(70,120,255,0.1)"); ar.addColorStop(1, "rgba(70,120,255,0)");
      ctx.fillStyle = ar; ctx.fillRect(CX - GLASS, CY - GLASS, GLASS * 2, GLASS * 2);
      ctx.restore();
      ctx.save(); ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(CX, CY, GLASS - 1.4, lightA - 0.5, lightA + 0.5); ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, GLASS - 1.4, lightA + Math.PI - 0.3, lightA + Math.PI + 0.3); ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(190,205,255,0.5)"; ctx.stroke();
      ctx.restore();

      // The strap runs out of the light at both ends.
      ctx.save(); ctx.globalCompositeOperation = "destination-out";
      const fade = ctx.createLinearGradient(0, 0, 0, H);
      fade.addColorStop(0, "rgba(0,0,0,1)"); fade.addColorStop(0.16, "rgba(0,0,0,0)"); fade.addColorStop(0.84, "rgba(0,0,0,0)"); fade.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = fade; ctx.fillRect(0, 0, W, H); ctx.restore();
    };

    let raf = 0, seen = true, last = 0, crown = 0, crownV = 0, lightA = -2.2, lightTo = -2.2, said = "";
    const t0 = performance.now();
    const step = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const shown = L.pulled ? L.frozen : Date.now() + L.offset;
      const to = L.pulled ? 1 : 0;
      if (reduce) { crown = to; lightA = lightTo; }
      else {
        crownV += (420 * (to - crown) - 24 * crownV) * dt; crown += crownV * dt;
        if (now - L.touched > 4000) lightTo = -2.2 + 0.55 * Math.sin((now - t0) / 2300);
        lightA += (lightTo - lightA) * Math.min(1, dt * 5);
      }
      draw(shown, lightA, Math.max(0, crown), !L.pulled && !reduce);
      const d = new Date(shown), text = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
      if (text !== said) { said = text; setLabel({ date: `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`, time: text }); }
      if (!reduce && seen && !document.hidden) raf = requestAnimationFrame(step);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(step); } };
    redraw.current = () => { if (reduce) step(performance.now()); else wake(); };
    step(performance.now());
    const slow = reduce ? window.setInterval(() => step(performance.now()), 500) : 0;

    // Dragging round the dial turns the hands, but only while the crown is out.
    let drag = false, prev = 0;
    const ang = (e: PointerEvent) => { const b = area.getBoundingClientRect(); return Math.atan2(e.clientX - (b.left + b.width / 2), -(e.clientY - (b.top + b.height / 2))); };
    const onDown = (e: PointerEvent) => { if (!L.pulled) return; drag = true; prev = ang(e); area.setPointerCapture(e.pointerId); e.preventDefault(); };
    const onMove = (e: PointerEvent) => {
      const b = area.getBoundingClientRect();
      if (!drag) { L.touched = performance.now() - 2600; lightTo = Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)); if (reduce) step(performance.now()); return; }
      const a = ang(e); let dA = a - prev; if (dA > Math.PI) dA -= Math.PI * 2; if (dA < -Math.PI) dA += Math.PI * 2; prev = a;
      L.frozen += (dA / (Math.PI * 2)) * 3600000; L.touched = performance.now();
      if (reduce) step(performance.now());
    };
    const onUp = () => { drag = false; };
    area.addEventListener("pointerdown", onDown); area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerup", onUp); area.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([en]) => { seen = en.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); if (slow) window.clearInterval(slow); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
      area.removeEventListener("pointerdown", onDown); area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerup", onUp); area.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const crownClick = () => {
    const L = live.current; L.touched = performance.now();
    if (L.pulled) { L.offset = L.frozen - Date.now(); L.pulled = false; setShifted(Math.abs(L.offset) > 999); }
    else { L.frozen = Date.now() + L.offset; L.pulled = true; }
    setPulled(L.pulled); redraw.current();
  };
  const nudge = (e: ReactKeyboardEvent) => {
    const by = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : e.key === "PageUp" ? 60 : e.key === "PageDown" ? -60 : 0;
    if (!by || !live.current.pulled) return;
    e.preventDefault(); live.current.frozen += by * 60000; live.current.touched = performance.now(); redraw.current();
  };
  const sync = () => { const L = live.current; L.offset = 0; L.frozen = Date.now(); setShifted(false); redraw.current(); };

  return (
    <div className="flex min-h-[720px] w-full flex-col items-center justify-center bg-[#d9dce0] bg-[radial-gradient(85%_60%_at_42%_34%,#f3f4f6_0%,#d9dce0_58%,#bfc4ca_100%)] px-4 py-6 sm:min-h-[780px]">
      <div className="relative w-full max-w-[420px] sm:max-w-[500px]" style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div
          ref={hit}
          role="slider"
          tabIndex={pulled ? 0 : -1}
          aria-label="Turn the hands"
          aria-disabled={!pulled}
          aria-valuemin={0}
          aria-valuemax={1439}
          aria-valuenow={Number(label.time.slice(0, 2)) * 60 + Number(label.time.slice(3, 5)) || 0}
          aria-valuetext={label.time.slice(0, 5)}
          onKeyDown={nudge}
          style={{ left: "50%", top: "50%", width: `${((GLASS * 2) / W) * 100}%` }}
          className={`absolute aspect-square -translate-x-1/2 -translate-y-1/2 touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${pulled ? "cursor-grab active:cursor-grabbing" : ""}`}
        />
        <button
          type="button"
          aria-pressed={pulled}
          aria-label={pulled ? "Push the crown in to start the watch" : "Pull the crown out to set the time"}
          onClick={crownClick}
          style={{ left: `${((CX + R + 10) / W) * 100}%`, top: "50%" }}
          className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        />
      </div>
      <div className="mt-2 flex flex-col items-center text-center">
        <time className="font-mono text-[30px] font-semibold tabular-nums leading-none tracking-tight text-slate-900">{label.time}</time>
        <p aria-live="polite" className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-600">
          {label.date}
          <span className="mx-2 text-slate-400">/</span>
          {pulled ? "Crown out: drag round the dial" : shifted ? "Running on your time" : "Click the crown to set"}
        </p>
        <button type="button" onClick={sync} disabled={!shifted && !pulled} className="mt-3 h-10 rounded-full px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-800 underline decoration-slate-400 underline-offset-4 outline-none transition-opacity hover:decoration-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 disabled:opacity-0 motion-reduce:transition-none">
          Back to the real time
        </button>
      </div>
    </div>
  );
}
