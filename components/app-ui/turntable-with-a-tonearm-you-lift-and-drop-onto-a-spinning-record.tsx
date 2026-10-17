import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// The record on the platter. Change the names and the bands on the vinyl follow.
const record = { artist: "Marlowe Vane Quartet", side: "A", label: "#e2512b", ink: "#fbeedd" };
const tracks = ["Low Tide Motel", "Glass Harbour", "Nine Lamps", "Paper Weather", "Slow Ferry Home"];
const SIDE_SECONDS = 150; // how long the needle takes to cross the whole side
const ACCENT = "#e2512b"; // lamps, cartridge and focus ring

// Geometry in design pixels. The plinth is 660 by 500.
const W = 660, H = 500, CX = 252, CY = 250, RIM = 208, REC = 192, LBL = 61, OUTER = 185, INNER = 76;
const TX = 566, TY = 104; // tonearm pivot
const TUBE = 288, SHELL = 0.36, TIP = 50; // tube length, headshell angle, pivot of the shell to the stylus
const SX = TUBE + TIP * Math.cos(SHELL), SY = TIP * Math.sin(SHELL);
const LA = Math.hypot(SX, SY), SKEW = Math.atan2(SY, SX);
const D = Math.hypot(CX - TX, CY - TY), BETA = Math.atan2(CY - TY, CX - TX);
// phi is the angle at the pivot between the stylus and the spindle: small near the label, large at the rest.
const phiOf = (r: number) => Math.acos((LA * LA + D * D - r * r) / (2 * LA * D));
const rOf = (phi: number) => Math.sqrt(LA * LA + D * D - 2 * LA * D * Math.cos(phi));
const REST = (59 * Math.PI) / 180, PHI_OUT = phiOf(OUTER), PHI_IN = phiOf(INNER);
const BAND = (OUTER - INNER) / tracks.length;
const trackAt = (phi: number) => (phi > PHI_OUT + 0.01 ? 0 : Math.max(1, Math.min(tracks.length, Math.floor((OUTER - rOf(phi)) / BAND) + 1)));
const cuePhi = (track: number) => phiOf(OUTER - (track - 1) * BAND - 1.2);

export default function TurntableWithTonearm() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const armHit = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState({ track: 1, state: "Playing" });
  const [fast, setFast] = useState(false);
  const live = useRef({ track: 1, state: "Playing", fast: false });
  const api = useRef<{ cue: (track: number) => void; toggle: () => void; poke: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, pad = armHit.current;
    if (!cv || !pad) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasConic = typeof ctx.createConicGradient === "function";
    let k = 1;

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    const disc = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); };
    // Spun aluminium: bright and dark wedges round a centre.
    const spun = (c: CanvasRenderingContext2D, x: number, y: number, r: number, turn: number, lo: number, hi: number) => {
      if (!hasConic) { const g = c.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, `rgb(${hi},${hi},${hi})`); g.addColorStop(0.5, `rgb(${lo},${lo},${lo})`); g.addColorStop(1, `rgb(${hi},${hi},${hi})`); return g; }
      const g = c.createConicGradient(turn, x, y), mid = (lo + hi) / 2;
      const stops: [number, number][] = [[0, hi], [0.07, mid + 16], [0.17, lo], [0.27, mid - 8], [0.38, mid + 22], [0.5, hi - 8], [0.58, mid + 6], [0.68, lo + 4], [0.8, mid - 4], [0.91, mid + 30], [1, hi]];
      for (const [o, v] of stops) g.addColorStop(o, `rgb(${(v - 3) | 0},${v | 0},${Math.min(255, v + 5) | 0})`);
      return g;
    };
    const tubeFill = (c: CanvasRenderingContext2D, half: number, dark = false) => {
      const g = c.createLinearGradient(0, -half, 0, half);
      if (dark) { g.addColorStop(0, "#3d3f44"); g.addColorStop(0.28, "#8b8e94"); g.addColorStop(0.5, "#33353a"); g.addColorStop(1, "#111214"); }
      else { g.addColorStop(0, "#9da0a6"); g.addColorStop(0.26, "#ffffff"); g.addColorStop(0.55, "#b9bcc1"); g.addColorStop(1, "#5d6066"); }
      return g;
    };

    const base = document.createElement("canvas");
    const label = document.createElement("canvas");

    const build = () => {
      const b = base.getContext("2d");
      if (!b) return;
      base.width = cv.width; base.height = cv.height;
      b.setTransform(k, 0, 0, k, 0, 0);
      // Powder-coated plinth with a faint orange-peel grain.
      const coat = b.createLinearGradient(0, 0, W * 0.4, H);
      coat.addColorStop(0, "#f7f6f2"); coat.addColorStop(0.6, "#ecebe6"); coat.addColorStop(1, "#e0dfd9");
      rr(b, 0, 0, W, H, 20); b.fillStyle = coat; b.fill();
      b.save(); rr(b, 0, 0, W, H, 20); b.clip();
      let seed = 5;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 9000; i++) { const v = rand(); b.fillStyle = v > 0.5 ? "rgba(255,255,255,0.35)" : "rgba(60,58,50,0.07)"; b.fillRect(rand() * W, rand() * H, 0.9, 0.9); }
      b.restore();
      const edge = b.createLinearGradient(0, 0, 0, H);
      edge.addColorStop(0, "rgba(255,255,255,1)"); edge.addColorStop(0.5, "rgba(255,255,255,0.2)"); edge.addColorStop(1, "rgba(90,86,76,0.5)");
      rr(b, 0.75, 0.75, W - 1.5, H - 1.5, 19.3); b.lineWidth = 1.5; b.strokeStyle = edge; b.stroke();

      // Printed legends.
      b.font = "600 7.5px ui-monospace, SFMono-Regular, Menlo, monospace"; b.textAlign = "center"; b.textBaseline = "middle"; b.fillStyle = "rgba(60,58,52,0.72)";
      b.fillText("START", 48, 417); b.fillText("STOP", 48, 487); b.fillText("33", 36, 84); b.fillText("45", 62, 84);
      b.textAlign = "right"; b.fillText("BELT DRIVE  /  TWO SPEED", W - 22, H - 20);

      // Platter well, platter and the record lying on it.
      b.save(); b.shadowColor = "rgba(40,36,28,0.5)"; b.shadowBlur = 26 * k; b.shadowOffsetX = 7 * k; b.shadowOffsetY = 13 * k; disc(b, CX, CY, RIM); b.fillStyle = "#777"; b.fill(); b.restore();
      b.save(); b.shadowColor = "rgba(20,18,14,0.75)"; b.shadowBlur = 5 * k; b.shadowOffsetX = 1 * k; b.shadowOffsetY = 2.5 * k; disc(b, CX, CY, RIM); b.fillStyle = "#777"; b.fill(); b.restore();
      disc(b, CX, CY, RIM); b.fillStyle = spun(b, CX, CY, RIM, -2.2, 96, 250); b.fill();
      b.lineWidth = 1; b.strokeStyle = "rgba(255,255,255,0.75)"; disc(b, CX, CY, RIM - 0.8); b.stroke();
      b.strokeStyle = "rgba(0,0,0,0.3)"; disc(b, CX, CY, RIM - 3); b.stroke();
      disc(b, CX, CY, REC + 5.5); b.lineWidth = 3; b.strokeStyle = "rgba(0,0,0,0.16)"; b.stroke();
      // Rubber mat showing as a thin line, then the vinyl.
      b.save(); b.shadowColor = "rgba(0,0,0,0.8)"; b.shadowBlur = 5 * k; b.shadowOffsetX = 1.5 * k; b.shadowOffsetY = 2.5 * k; disc(b, CX, CY, REC); b.fillStyle = "#0b0b0c"; b.fill(); b.restore();
      for (let r = LBL + 3; r < REC - 4.5; r += 0.62) {
        const v = rand(); disc(b, CX, CY, r); b.lineWidth = 0.45;
        b.strokeStyle = v > 0.45 ? `rgba(255,255,255,${(v - 0.45) * 0.13})` : `rgba(0,0,0,${(0.45 - v) * 0.9})`; b.stroke();
      }
      // Gaps between tracks, the lead-in and the run-out are smooth vinyl.
      const smooth = (r: number, w: number) => { disc(b, CX, CY, r); b.lineWidth = w; b.strokeStyle = "#08080a"; b.stroke(); disc(b, CX, CY, r + w / 2); b.lineWidth = 0.4; b.strokeStyle = "rgba(255,255,255,0.16)"; b.stroke(); };
      for (let i = 1; i < tracks.length; i++) smooth(OUTER - i * BAND, 2.2);
      smooth(REC - 3, 5.5); smooth((LBL + INNER) / 2 - 0.5, INNER - LBL - 3);
      disc(b, CX, CY, (LBL + INNER) / 2 + 2); b.lineWidth = 0.5; b.strokeStyle = "rgba(255,255,255,0.12)"; b.stroke();
      disc(b, CX, CY, REC - 0.6); b.lineWidth = 1; b.strokeStyle = "rgba(255,255,255,0.22)"; b.stroke();

      // Tonearm base, armrest and the small anti-skate dial.
      b.save(); b.shadowColor = "rgba(40,36,28,0.5)"; b.shadowBlur = 14 * k; b.shadowOffsetX = 4 * k; b.shadowOffsetY = 8 * k; disc(b, TX, TY, 39); b.fillStyle = "#18191b"; b.fill(); b.restore();
      const baseG = b.createLinearGradient(TX - 39, TY - 39, TX + 39, TY + 39);
      baseG.addColorStop(0, "#4a4c51"); baseG.addColorStop(0.5, "#1b1c1f"); baseG.addColorStop(1, "#0c0c0e");
      disc(b, TX, TY, 39); b.fillStyle = baseG; b.fill();
      disc(b, TX, TY, 38.2); b.lineWidth = 1; b.strokeStyle = "rgba(255,255,255,0.3)"; b.stroke();
      disc(b, TX, TY, 29); b.fillStyle = spun(b, TX, TY, 29, -2.2, 80, 235); b.fill(); b.lineWidth = 0.8; b.strokeStyle = "rgba(0,0,0,0.5)"; b.stroke();
      disc(b, TX, TY, 23); b.fillStyle = "#101113"; b.fill();
      const rest = BETA - REST - SKEW, ax = TX + Math.cos(rest) * 214, ay = TY + Math.sin(rest) * 214;
      b.save(); b.translate(ax, ay); b.rotate(rest);
      b.shadowColor = "rgba(40,36,28,0.5)"; b.shadowBlur = 8 * k; b.shadowOffsetX = 3 * k; b.shadowOffsetY = 5 * k;
      rr(b, -9, -15, 18, 30, 5); b.fillStyle = "#1a1b1e"; b.fill(); b.shadowColor = "transparent";
      rr(b, -9, -15, 18, 30, 5); b.lineWidth = 0.8; b.strokeStyle = "rgba(255,255,255,0.28)"; b.stroke();
      rr(b, -9.5, -5.5, 19, 11, 2); b.fillStyle = "#050506"; b.fill();
      b.restore();
      const dx = TX + 56, dy = TY + 62;
      b.save(); b.shadowColor = "rgba(40,36,28,0.5)"; b.shadowBlur = 7 * k; b.shadowOffsetX = 2 * k; b.shadowOffsetY = 4 * k; disc(b, dx, dy, 13); b.fillStyle = "#1a1b1e"; b.fill(); b.restore();
      for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; b.beginPath(); b.moveTo(dx + Math.cos(a) * 10, dy + Math.sin(a) * 10); b.lineTo(dx + Math.cos(a) * 13, dy + Math.sin(a) * 13); b.lineWidth = 0.8; b.strokeStyle = `rgba(255,255,255,${0.1 + 0.3 * Math.max(0, Math.cos(a + 2.2))})`; b.stroke(); }
      disc(b, dx, dy, 9.6); b.fillStyle = spun(b, dx, dy, 9.6, -2.2, 90, 240); b.fill();
      b.beginPath(); b.moveTo(dx, dy - 2); b.lineTo(dx, dy - 8.5); b.lineWidth = 1.4; b.strokeStyle = "#141416"; b.stroke();

      // Start button and speed key: bodies only, their lamps are drawn live.
      b.save(); b.shadowColor = "rgba(40,36,28,0.55)"; b.shadowBlur = 8 * k; b.shadowOffsetX = 2 * k; b.shadowOffsetY = 4 * k; disc(b, 48, 452, 22); b.fillStyle = "#888"; b.fill(); b.restore();
      disc(b, 48, 452, 22); b.fillStyle = spun(b, 48, 452, 22, -2.2, 110, 252); b.fill(); b.lineWidth = 0.8; b.strokeStyle = "rgba(0,0,0,0.35)"; b.stroke();
      disc(b, 48, 452, 16.5); b.lineWidth = 0.8; b.strokeStyle = "rgba(0,0,0,0.3)"; b.stroke(); disc(b, 48, 452, 17.4); b.strokeStyle = "rgba(255,255,255,0.7)"; b.stroke();
      b.save(); b.shadowColor = "rgba(40,36,28,0.55)"; b.shadowBlur = 6 * k; b.shadowOffsetX = 2 * k; b.shadowOffsetY = 3 * k; rr(b, 24, 38, 50, 24, 12); b.fillStyle = "#888"; b.fill(); b.restore();
      const key = b.createLinearGradient(0, 38, 0, 62); key.addColorStop(0, "#fbfbfc"); key.addColorStop(0.5, "#c3c6cb"); key.addColorStop(1, "#8d9096");
      rr(b, 24, 38, 50, 24, 12); b.fillStyle = key; b.fill(); b.lineWidth = 0.8; b.strokeStyle = "rgba(0,0,0,0.35)"; b.stroke();
      b.beginPath(); b.moveTo(49, 42); b.lineTo(49, 58); b.lineWidth = 0.8; b.strokeStyle = "rgba(0,0,0,0.3)"; b.stroke();

      // The paper label, drawn once and spun every frame.
      const l = label.getContext("2d");
      if (!l) return;
      const S = LBL * 2;
      label.width = Math.ceil(S * k); label.height = Math.ceil(S * k);
      l.setTransform(k, 0, 0, k, 0, 0);
      const paper = l.createRadialGradient(LBL - 12, LBL - 16, 4, LBL, LBL, LBL);
      paper.addColorStop(0, "#f06a40"); paper.addColorStop(1, record.label);
      disc(l, LBL, LBL, LBL); l.fillStyle = paper; l.fill();
      for (let i = 0; i < 900; i++) { l.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"; l.fillRect(rand() * S, rand() * S, 1, 1); }
      disc(l, LBL, LBL, LBL - 5); l.lineWidth = 0.7; l.strokeStyle = record.ink; l.stroke();
      disc(l, LBL, LBL, 27); l.lineWidth = 0.7; l.stroke();
      const arc = (text: string, radius: number, mid: number, size: number, flip: boolean) => {
        l.font = `700 ${size}px ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif`; l.textAlign = "center"; l.textBaseline = "middle"; l.fillStyle = record.ink;
        const stepA = (size * 0.78) / radius, start = mid - ((text.length - 1) * stepA * (flip ? -1 : 1)) / 2;
        [...text].forEach((ch, i) => { const a = start + i * stepA * (flip ? -1 : 1); l.save(); l.translate(LBL + Math.cos(a) * radius, LBL + Math.sin(a) * radius); l.rotate(a + (flip ? -Math.PI / 2 : Math.PI / 2)); l.fillText(ch, 0, 0); l.restore(); });
      };
      arc(record.artist.toUpperCase(), 43, -Math.PI / 2, 6.8, false);
      arc(`SIDE ${record.side} · STEREO · ${tracks.length} TITLES`, 44, Math.PI / 2, 5.6, true);
      l.font = `800 17px ui-sans-serif, system-ui, sans-serif`; l.fillStyle = record.ink; l.textAlign = "center"; l.textBaseline = "middle";
      l.fillText(record.side, LBL - 16, LBL + 1); l.font = `700 6px ui-sans-serif, system-ui, sans-serif`; l.fillText("33", LBL + 16, LBL + 1);
    };

    const fit = () => {
      const w = cv.clientWidth || W;
      k = (w / W) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * k); cv.height = Math.round(H * k);
      build();
    };

    const first = phiOf(OUTER - BAND * 0.45);
    const s = { rot: 0, om: 3.49, phi: first, pv: 0, target: first, h: 0, drag: false, raw: first, light: 0, lightTo: 0, lampOn: 1, lampFast: 0, press: 0 };

    const arm = () => {
      const wob = s.h < 0.01 && s.target !== REST ? 0.0022 * Math.sin(s.rot) : 0;
      const a = BETA - (s.phi + wob) - SKEW, lift = s.h;
      const shadow = (blur: number, far: number, alpha: number) => { ctx.shadowColor = `rgba(30,26,20,${alpha})`; ctx.shadowBlur = (blur + lift * 12) * k; ctx.shadowOffsetX = (far * 0.55 + lift * 9) * k; ctx.shadowOffsetY = (far + lift * 16) * k; };
      ctx.save(); ctx.translate(TX, TY); ctx.rotate(a); ctx.scale(1 + lift * 0.022, 1 + lift * 0.022);
      // Counterweight and its stub.
      ctx.save(); shadow(9, 9, 0.42);
      ctx.fillStyle = tubeFill(ctx, 5); ctx.fillRect(-46, -5, 40, 10);
      rr(ctx, -92, -19, 48, 38, 5); ctx.fillStyle = tubeFill(ctx, 19, true); ctx.fill(); ctx.restore();
      for (let x = -89; x < -78; x += 2.2) { ctx.beginPath(); ctx.moveTo(x, -18); ctx.lineTo(x, 18); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.stroke(); }
      ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillRect(-52, -19, 1.2, 38);
      // The tube.
      ctx.save(); shadow(6, 8, 0.45); ctx.fillStyle = tubeFill(ctx, 3.8); ctx.fillRect(0, -3.8, TUBE - 6, 7.6); ctx.restore();
      // Locking collar and headshell.
      ctx.save(); ctx.translate(TUBE, 0);
      ctx.save(); shadow(5, 7, 0.45); rr(ctx, -16, -6, 15, 12, 2); ctx.fillStyle = tubeFill(ctx, 6); ctx.fill(); ctx.restore();
      for (let x = -14; x < -3; x += 2) { ctx.beginPath(); ctx.moveTo(x, -6); ctx.lineTo(x, 6); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.stroke(); }
      ctx.rotate(SHELL);
      ctx.save(); shadow(6, 7, 0.5);
      // Finger lift first, so the shell sits over its root.
      ctx.beginPath(); ctx.moveTo(34, -9); ctx.lineTo(41, -9); ctx.lineTo(54, -33); ctx.quadraticCurveTo(52, -38, 47, -35); ctx.closePath();
      const liftG = ctx.createLinearGradient(34, -9, 54, -33); liftG.addColorStop(0, "#8e9197"); liftG.addColorStop(0.5, "#fdfdfd"); liftG.addColorStop(1, "#aeb1b6"); ctx.fillStyle = liftG; ctx.fill();
      // Cartridge body poking out in front of the shell.
      rr(ctx, 30, -9, 34, 18, 2.5); ctx.fillStyle = ACCENT; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-2, -5); ctx.lineTo(12, -12); ctx.lineTo(56, -12); ctx.quadraticCurveTo(60, -12, 60, -8); ctx.lineTo(60, 8); ctx.quadraticCurveTo(60, 12, 56, 12); ctx.lineTo(12, 12); ctx.lineTo(-2, 5); ctx.closePath();
      const shell = ctx.createLinearGradient(0, -12, 0, 12); shell.addColorStop(0, "#f6f7f8"); shell.addColorStop(0.3, "#c9ccd1"); shell.addColorStop(0.7, "#a3a6ac"); shell.addColorStop(1, "#6f7278"); ctx.fillStyle = shell; ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(12, -11.2); ctx.lineTo(56, -11.2); ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, 11.4); ctx.lineTo(56, 11.4); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.stroke();
      ctx.fillStyle = "#17181a"; rr(ctx, 20, -7, 22, 2.8, 1.4); ctx.fill(); rr(ctx, 20, 4.2, 22, 2.8, 1.4); ctx.fill();
      for (const y of [-5.6, 5.6]) { disc(ctx, 31, y, 2.3); ctx.fillStyle = "#2a2b2e"; ctx.fill(); disc(ctx, 30.5, y - 0.5, 0.9); ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fill(); }
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fillRect(60, -8, 3.2, 16);
      ctx.restore();
      // Pivot housing on top of everything.
      ctx.save(); shadow(6, 6, 0.5); disc(ctx, 0, 0, 16.5); ctx.fillStyle = "#222"; ctx.fill(); ctx.restore();
      ctx.restore();
      disc(ctx, TX, TY, 16.5); ctx.fillStyle = spun(ctx, TX, TY, 16.5, -2.2 + s.light * 0.4, 96, 252); ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(0,0,0,0.45)"; ctx.stroke();
      disc(ctx, TX, TY, 6); ctx.fillStyle = "#17181a"; ctx.fill(); disc(ctx, TX - 1.2, TY - 1.4, 1.6); ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.fill();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      // Strobe marks on the rim of the platter.
      ctx.fillStyle = "rgba(20,20,22,0.78)";
      for (let i = 0; i < 90; i++) { const a = s.rot + (i / 90) * Math.PI * 2; ctx.save(); ctx.translate(CX + Math.cos(a) * (RIM - 7.5), CY + Math.sin(a) * (RIM - 7.5)); ctx.rotate(a); ctx.fillRect(-2.6, -2.1, 5.2, 4.2); ctx.restore(); }
      // Light on the grooves. It stays where the lamp is; a slight warp in the pressing makes it breathe.
      const la = -2.25 + s.light * 0.35 + 0.035 * Math.sin(s.rot);
      ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, REC - 1, 0, Math.PI * 2); ctx.arc(CX, CY, LBL, 0, Math.PI * 2, true); ctx.clip("evenodd");
      if (hasConic) {
        const g = ctx.createConicGradient(la, CX, CY);
        const st: [number, string][] = [[0, "rgba(255,246,232,0.5)"], [0.022, "rgba(255,246,232,0.2)"], [0.07, "rgba(255,255,255,0.05)"], [0.16, "rgba(255,255,255,0)"], [0.36, "rgba(255,255,255,0)"], [0.45, "rgba(214,228,255,0.07)"], [0.485, "rgba(214,228,255,0.24)"], [0.5, "rgba(230,238,255,0.4)"], [0.515, "rgba(214,228,255,0.22)"], [0.56, "rgba(255,255,255,0.05)"], [0.66, "rgba(255,255,255,0)"], [0.84, "rgba(255,255,255,0)"], [0.93, "rgba(255,255,255,0.06)"], [0.978, "rgba(255,246,232,0.2)"], [1, "rgba(255,246,232,0.5)"]];
        for (const [o, c] of st) g.addColorStop(o, c);
        ctx.fillStyle = g; ctx.fillRect(CX - REC, CY - REC, REC * 2, REC * 2);
      }
      ctx.restore();
      // Label, printed a hair off centre like every pressing.
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(s.rot); ctx.drawImage(label, -LBL + 0.7, -LBL, LBL * 2, LBL * 2); ctx.restore();
      const dome = ctx.createLinearGradient(CX - LBL, CY - LBL, CX + LBL, CY + LBL);
      dome.addColorStop(0, "rgba(255,255,255,0.16)"); dome.addColorStop(0.5, "rgba(255,255,255,0)"); dome.addColorStop(1, "rgba(0,0,0,0.2)");
      disc(ctx, CX, CY, LBL); ctx.fillStyle = dome; ctx.fill();
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 4 * k; ctx.shadowOffsetX = 2 * k; ctx.shadowOffsetY = 3 * k; disc(ctx, CX, CY, 5); ctx.fillStyle = "#999"; ctx.fill(); ctx.restore();
      const pin = ctx.createRadialGradient(CX - 1.6, CY - 1.8, 0.4, CX, CY, 5); pin.addColorStop(0, "#fff"); pin.addColorStop(0.5, "#b8bbc0"); pin.addColorStop(1, "#55585d");
      disc(ctx, CX, CY, 5); ctx.fillStyle = pin; ctx.fill();

      // Lamps: one in the start button, one for each speed.
      const lamp = (x: number, y: number, r: number, on: number) => {
        disc(ctx, x, y, r + 1.2); ctx.fillStyle = "rgba(20,18,16,0.85)"; ctx.fill();
        ctx.save(); ctx.shadowColor = ACCENT; ctx.shadowBlur = 10 * k * on; ctx.globalAlpha = 0.22 + 0.78 * on; disc(ctx, x, y, r); ctx.fillStyle = on > 0.5 ? "#ff8a4a" : ACCENT; ctx.fill(); ctx.restore();
        disc(ctx, x - r * 0.3, y - r * 0.35, r * 0.3); ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.6 * on})`; ctx.fill();
      };
      lamp(48, 452 + s.press, 3.4, s.lampOn); lamp(36, 72, 2.4, 1 - s.lampFast); lamp(62, 72, 2.4, s.lampFast);
      arm();
      // Keep the invisible handle over the headshell.
      const ha = BETA - s.phi, hx = TX + Math.cos(ha) * (LA - 18), hy = TY + Math.sin(ha) * (LA - 18);
      pad.style.left = `${((hx - 48) / W) * 100}%`; pad.style.top = `${((hy - 48) / H) * 100}%`;
    };

    const report = () => {
      const track = s.drag ? trackAt(s.phi) : s.target === REST ? 0 : trackAt(s.target);
      const state = s.drag ? "Arm lifted" : s.h > 0.04 ? (s.target === REST ? "Returning" : "Cueing") : track === 0 ? "Stopped" : "Playing";
      if (track !== live.current.track || state !== live.current.state) { live.current.track = track; live.current.state = state; setStatus({ track, state }); }
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 2300;
    const RATE = (PHI_OUT - PHI_IN) / SIDE_SECONDS;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      const t = now - t0, motor = s.target !== REST || s.drag;
      const want = motor ? (live.current.fast ? 4.712 : 3.491) : 0;
      s.om += (want - s.om) * Math.min(1, dt * (motor ? 1.7 : 1.1)); s.rot = (s.rot + s.om * dt) % (Math.PI * 2);
      let up = false;
      if (s.drag) { up = true; s.phi += (s.raw - s.phi) * Math.min(1, dt * 16); s.pv = 0; }
      else if (Math.abs(s.target - s.phi) > 0.003 || Math.abs(s.pv) > 0.03) {
        up = true;
        if (s.h > 0.8) { s.pv += (46 * (s.target - s.phi) - 12.5 * s.pv) * dt; s.phi += s.pv * dt; }
      } else { s.phi = s.target; s.pv = 0; }
      // Up is quick, down is slowed by the cueing damper.
      s.h = up ? s.h + (1 - s.h) * Math.min(1, dt * 9) : Math.max(0, s.h - dt * (0.35 + s.h * 2.2));
      if (!up && s.h === 0 && s.target !== REST && s.om > 1) {
        s.target -= RATE * dt * (s.om / 3.491); s.phi = s.target;
        if (s.target <= PHI_IN) s.target = REST; // end of the side: the arm goes home by itself
      }
      if (now - touched > 6000) {
        s.lightTo = Math.sin(t / 2600);
        if (t > nextDemo && !s.drag) { const n = s.target === REST ? 1 : trackAt(s.target) + 1; s.target = n > tracks.length ? REST : cuePhi(n); nextDemo = t + 5200; }
      }
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
      s.lampOn += ((motor ? 1 : 0) - s.lampOn) * Math.min(1, dt * 10);
      s.lampFast += ((live.current.fast ? 1 : 0) - s.lampFast) * Math.min(1, dt * 10);
      s.press = Math.max(0, s.press - dt * 6);
      draw(); report();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => { s.phi = s.drag ? s.raw : s.target; s.pv = 0; s.h = s.drag ? 1 : 0; s.om = 0; s.lampOn = s.target !== REST ? 1 : 0; s.lampFast = live.current.fast ? 1 : 0; s.press = 0; draw(); report(); };
    const wake = () => { if (reduce) still(); else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = {
      cue: (track) => { touched = performance.now(); s.target = track <= 0 ? REST : cuePhi(Math.min(tracks.length, track)); wake(); },
      toggle: () => { touched = performance.now(); s.press = 1.4; s.target = s.target === REST ? cuePhi(1) : REST; wake(); },
      poke: () => { touched = performance.now(); wake(); },
    };
    fit(); wake();

    // Lifting the arm by the headshell.
    let lastA = 0;
    const angleAt = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); return Math.atan2(((e.clientY - b.top) / b.height) * H - TY, ((e.clientX - b.left) / b.width) * W - TX); };
    const onDown = (e: PointerEvent) => { touched = performance.now(); s.drag = true; s.raw = s.phi; lastA = angleAt(e); pad.setPointerCapture(e.pointerId); e.preventDefault(); wake(); };
    const onMove = (e: PointerEvent) => {
      if (!s.drag) return;
      touched = performance.now();
      const a = angleAt(e); let d = a - lastA; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; lastA = a;
      s.raw = Math.max(PHI_IN - 0.02, Math.min(REST + 0.03, s.raw - d));
      if (reduce) still();
    };
    const onUp = () => {
      if (!s.drag) return;
      s.drag = false; touched = performance.now();
      // Let go beyond the edge of the record and the arm goes back to its rest; anywhere else it comes down where it is.
      s.target = s.raw > PHI_OUT + 0.07 ? REST : Math.max(PHI_IN + 0.004, Math.min(phiOf(OUTER + 2), s.raw));
      wake();
    };
    const onLight = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); if (!s.drag) touched = Math.max(touched, performance.now() - 4000); s.lightTo = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1)); };
    pad.addEventListener("pointerdown", onDown); pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp); pad.addEventListener("pointercancel", onUp);
    const host = cv.parentElement;
    host?.addEventListener("pointermove", onLight);
    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      pad.removeEventListener("pointerdown", onDown); pad.removeEventListener("pointermove", onMove);
      pad.removeEventListener("pointerup", onUp); pad.removeEventListener("pointercancel", onUp);
      host?.removeEventListener("pointermove", onLight);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const onKey = (e: ReactKeyboardEvent) => {
    const t = status.track;
    const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? Math.min(tracks.length, t + 1) : e.key === "ArrowLeft" || e.key === "ArrowDown" ? Math.max(0, t - 1) : e.key === "Home" ? 0 : e.key === "End" ? tracks.length : -1;
    if (next < 0) return;
    e.preventDefault(); api.current?.cue(next);
  };
  const speed = () => { live.current.fast = !live.current.fast; setFast(live.current.fast); api.current?.poke(); };
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[#e2512b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efeeea]";

  return (
    <div className="flex min-h-[720px] w-full flex-col items-center justify-center bg-[#e3e1db] bg-[radial-gradient(80%_70%_at_50%_40%,#f1f0ec_0%,#e3e1db_60%,#d6d3cc_100%)] px-4 py-14">
      <div
        className="relative w-full max-w-[660px] rounded-[20px] shadow-[0_1px_1px_rgba(60,54,44,0.35),0_10px_14px_-6px_rgba(60,54,44,0.35),0_34px_44px_-14px_rgba(60,54,44,0.4),0_80px_90px_-30px_rgba(60,54,44,0.45)]"
        style={{ aspectRatio: `${W} / ${H}` }}
      >
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full rounded-[20px]" />
        <button
          type="button"
          aria-label={status.track === 0 ? "Start the record" : "Stop and return the arm"}
          aria-pressed={status.track !== 0}
          onClick={() => api.current?.toggle()}
          style={{ left: pct(8, W), top: pct(412, H), width: pct(80, W), height: pct(80, H) }}
          className={`absolute cursor-pointer rounded-full ${ring}`}
        />
        <button
          type="button"
          aria-label="Play at 45 revolutions a minute"
          aria-pressed={fast}
          onClick={speed}
          style={{ left: pct(9, W), top: pct(14, H), width: pct(80, W), height: pct(80, H) }}
          className={`absolute cursor-pointer rounded-2xl ${ring}`}
        />
        <div
          ref={armHit}
          role="slider"
          tabIndex={0}
          aria-label="Tonearm"
          aria-valuemin={0}
          aria-valuemax={tracks.length}
          aria-valuenow={status.track}
          aria-valuetext={status.track === 0 ? "On the armrest" : `Track ${status.track}, ${tracks[status.track - 1]}`}
          onKeyDown={onKey}
          style={{ width: pct(96, W), height: pct(96, H) }}
          className={`absolute cursor-grab touch-none rounded-full active:cursor-grabbing ${ring}`}
        />
      </div>
      <p aria-live="polite" className="mt-10 min-h-[20px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-stone-600">
        <span className="text-stone-900">{status.state}</span>
        <span className="mx-2 text-stone-400">/</span>
        {status.track === 0 ? `${record.artist}, side ${record.side}` : `${record.side}${status.track} ${tracks[status.track - 1]}`}
        <span className="mx-2 text-stone-400">/</span>
        {fast ? "45" : "33"} rpm
      </p>
    </div>
  );
}
