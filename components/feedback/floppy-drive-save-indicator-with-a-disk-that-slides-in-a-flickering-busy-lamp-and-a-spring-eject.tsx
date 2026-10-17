import { useEffect, useRef, useState } from "react";

// What is being saved, the words on the paper label, and the three status lines.
const file = { label: ["homepage", "v12 final"], maker: "ORBITA", model: "D-35" };
const words = { dirty: "Unsaved changes", busy: "Writing to disk", done: "All changes saved" };
const DISK = [236, 98, 42]; // disk shell, as red, green, blue
const CASE = [205, 208, 202]; // drive case plastic
const WRITE_SECONDS = 2.1; // how long the lamp flickers
const W = 440, H = 500;
const DX = 106, DW = 228, DH = 238, SLOT = 246, OUT = 0.29, IN = 0.975;

type Phase = "done" | "dirty" | "busy";

export default function FloppyDriveSaveIndicator() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("done");
  const api = useRef<{ save: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.25;
    cv.width = W * dpr; cv.height = H * dpr;
    const tone = (rgb: number[], k: number, a = 1) => `rgba(${Math.min(255, rgb[0] * k) | 0},${Math.min(255, rgb[1] * k) | 0},${Math.min(255, rgb[2] * k) | 0},${a})`;
    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) => {
      const [a, b, d, e] = typeof r === "number" ? [r, r, r, r] : r;
      c.beginPath(); c.moveTo(x + a, y); c.lineTo(x + w - b, y); c.arcTo(x + w, y, x + w, y + b, b); c.lineTo(x + w, y + h - d); c.arcTo(x + w, y + h, x + w - d, y + h, d); c.lineTo(x + e, y + h); c.arcTo(x, y + h, x, y + h - e, e); c.lineTo(x, y + a); c.arcTo(x, y, x + a, y, a); c.closePath();
    };
    let seed = 41;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const grain = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, n: number, light: string, dark: string, amt: number) => {
      for (let i = 0; i < n; i++) { const v = rand(); c.fillStyle = v > 0.5 ? light.replace("A", String((v - 0.5) * amt)) : dark.replace("A", String((0.5 - v) * amt)); c.fillRect(x + rand() * w, y + rand() * h, 0.9, 0.9); }
    };
    // A blurred shadow with nothing drawn on top of it: the shape itself is parked far above the canvas.
    const shade = (c: CanvasRenderingContext2D, path: () => void, color: string, blur: number, dx: number, dy: number) => {
      c.save(); c.shadowColor = color; c.shadowBlur = blur * dpr; c.shadowOffsetX = dx * dpr; c.shadowOffsetY = (dy + 3000) * dpr; c.translate(0, -3000); path(); c.fillStyle = "#000"; c.fill(); c.restore();
    };

    // ---------- The drive: cable, case top, front face, slot ----------
    const still = document.createElement("canvas");
    still.width = cv.width; still.height = cv.height;
    const sc = still.getContext("2d");
    if (sc) {
      sc.scale(dpr, dpr);
      // Cable and its ribbed boot, leaving the back of the case.
      sc.lineCap = "round";
      const cab = sc.createLinearGradient(290, 0, 320, 0); cab.addColorStop(0, "#8c908b"); cab.addColorStop(0.4, "#d9dcd6"); cab.addColorStop(1, "#7c807b");
      sc.strokeStyle = "#a9ada7"; sc.lineWidth = 10; sc.beginPath(); sc.moveTo(300, 36); sc.bezierCurveTo(300, 8, 336, 12, 368, -10); sc.stroke();
      sc.strokeStyle = "rgba(255,255,255,0.45)"; sc.lineWidth = 2; sc.beginPath(); sc.moveTo(298, 34); sc.bezierCurveTo(298, 6, 334, 9, 366, -12); sc.stroke();
      sc.lineCap = "butt";
      sc.fillStyle = cab; rr(sc, 291, 18, 18, 24, 3); sc.fill();
      for (let y = 21; y < 40; y += 4) { sc.fillStyle = "rgba(0,0,0,0.28)"; sc.fillRect(291, y, 18, 1.2); }

      // Shadow the whole case throws on the table.
      shade(sc, () => rr(sc, 66, 60, 308, 222, 12), "rgba(2,16,16,0.75)", 22, 6, 16);
      shade(sc, () => rr(sc, 62, 240, 316, 42, 6), "rgba(2,16,16,0.8)", 7, 1, 5);

      // Front face.
      const ff = sc.createLinearGradient(0, 214, 0, 282); ff.addColorStop(0, tone(CASE, 0.93)); ff.addColorStop(0.5, tone(CASE, 0.84)); ff.addColorStop(1, tone(CASE, 0.68));
      rr(sc, 60, 206, 320, 76, [0, 0, 7, 7]); sc.fillStyle = ff; sc.fill();
      sc.save(); rr(sc, 60, 206, 320, 76, [0, 0, 7, 7]); sc.clip();
      grain(sc, 60, 214, 320, 68, 5200, "rgba(255,255,255,A)", "rgba(40,44,40,A)", 0.3);
      const ends = sc.createLinearGradient(60, 0, 380, 0); ends.addColorStop(0, "rgba(255,255,255,0.3)"); ends.addColorStop(0.03, "rgba(255,255,255,0)"); ends.addColorStop(0.96, "rgba(0,0,0,0)"); ends.addColorStop(1, "rgba(0,0,0,0.3)");
      sc.fillStyle = ends; sc.fillRect(60, 214, 320, 68);
      sc.fillStyle = "rgba(0,0,0,0.3)"; sc.fillRect(60, 280.6, 320, 1.4);
      sc.restore();

      // Top of the case.
      const top = () => rr(sc, 60, 36, 320, 180, [15, 15, 3, 3]);
      const tg = sc.createLinearGradient(60, 36, 300, 216); tg.addColorStop(0, tone(CASE, 0.96)); tg.addColorStop(0.5, tone(CASE, 1.06)); tg.addColorStop(1, tone(CASE, 1.13));
      top(); sc.fillStyle = tg; sc.fill();
      sc.save(); top(); sc.clip();
      grain(sc, 60, 36, 320, 180, 15000, "rgba(255,255,255,A)", "rgba(40,44,40,A)", 0.34);
      // Rolled edges: light along the front, shade along the back and right.
      const fr = sc.createLinearGradient(0, 196, 0, 216); fr.addColorStop(0, "rgba(255,255,255,0)"); fr.addColorStop(0.75, "rgba(255,255,255,0.55)"); fr.addColorStop(1, "rgba(255,255,255,0.2)");
      sc.fillStyle = fr; sc.fillRect(60, 196, 320, 20);
      const bk = sc.createLinearGradient(0, 36, 0, 54); bk.addColorStop(0, "rgba(30,34,30,0.42)"); bk.addColorStop(1, "rgba(30,34,30,0)");
      sc.fillStyle = bk; sc.fillRect(60, 36, 320, 18);
      const rt = sc.createLinearGradient(364, 0, 380, 0); rt.addColorStop(0, "rgba(30,34,30,0)"); rt.addColorStop(1, "rgba(30,34,30,0.36)");
      sc.fillStyle = rt; sc.fillRect(364, 36, 16, 180);
      const lf = sc.createLinearGradient(60, 0, 72, 0); lf.addColorStop(0, "rgba(255,255,255,0.5)"); lf.addColorStop(1, "rgba(255,255,255,0)");
      sc.fillStyle = lf; sc.fillRect(60, 36, 12, 180);
      sc.restore();
      // Raised panel over the mechanism: a soft step all the way round.
      const panel = (x: number, y: number, w: number, h: number, r: number, raise: boolean) => {
        sc.save(); rr(sc, x, y, w, h, r); sc.clip();
        sc.lineWidth = 3; sc.strokeStyle = raise ? "rgba(255,255,255,0.75)" : "rgba(20,24,20,0.5)"; rr(sc, x + 1, y + 1.2, w, h, r); sc.stroke();
        sc.strokeStyle = raise ? "rgba(20,24,20,0.42)" : "rgba(255,255,255,0.8)"; rr(sc, x - 1, y - 1.2, w, h, r); sc.stroke();
        sc.restore();
      };
      sc.fillStyle = "rgba(255,255,255,0.1)"; rr(sc, 82, 104, 276, 92, 9); sc.fill();
      panel(82, 104, 276, 92, 9, true);
      // Shallow grooves moulded across the panel.
      for (let y = 118; y < 188; y += 11) { sc.fillStyle = "rgba(30,34,30,0.2)"; sc.fillRect(96, y, 248, 1.1); sc.fillStyle = "rgba(255,255,255,0.75)"; sc.fillRect(96, y + 1.1, 248, 0.9); }
      // Vent slots.
      for (let i = 0; i < 9; i++) {
        const x = 258 + i * 11;
        rr(sc, x, 54, 5, 34, 2.5); sc.fillStyle = "#1c1f1c"; sc.fill();
        sc.fillStyle = "rgba(255,255,255,0.75)"; sc.fillRect(x + 5, 56, 0.9, 30);
        sc.fillStyle = "rgba(0,0,0,0.5)"; sc.fillRect(x - 0.8, 56, 0.8, 30);
        const inner = sc.createLinearGradient(0, 54, 0, 88); inner.addColorStop(0, "rgba(0,0,0,0.9)"); inner.addColorStop(1, "rgba(110,116,110,0.5)");
        rr(sc, x + 0.6, 54.6, 3.8, 32.8, 2); sc.fillStyle = inner; sc.fill();
      }
      // Recessed badge with the maker's name.
      rr(sc, 82, 56, 112, 30, 4); sc.fillStyle = tone(CASE, 0.9); sc.fill(); panel(82, 56, 112, 30, 4, false);
      sc.fillStyle = "#2b302c"; sc.textBaseline = "middle";
      sc.font = '800 12.5px "Helvetica Neue", Helvetica, Arial, sans-serif';
      let lx = 92; for (const ch of file.maker) { sc.fillText(ch, lx, 71.5); lx += sc.measureText(ch).width + 2.4; }
      sc.fillStyle = "#d9442a"; sc.fillRect(lx + 3, 65, 3, 13);
      sc.fillStyle = "#4a504b"; sc.font = '600 8.5px "Helvetica Neue", Helvetica, Arial, sans-serif'; sc.fillText(file.model, lx + 11, 72);
      // Four screws in wells.
      for (const [x, y] of [[74, 50], [366, 50], [74, 201], [366, 201]]) {
        sc.beginPath(); sc.arc(x, y, 4.6, 0, Math.PI * 2); sc.fillStyle = "rgba(24,28,24,0.75)"; sc.fill();
        sc.beginPath(); sc.arc(x + 0.5, y + 0.7, 4.6, 0, Math.PI * 2); sc.lineWidth = 0.8; sc.strokeStyle = "rgba(255,255,255,0.7)"; sc.stroke();
        const sg = sc.createRadialGradient(x - 1, y - 1, 0, x, y, 3.4); sg.addColorStop(0, "#e9ecee"); sg.addColorStop(1, "#6b7177");
        sc.beginPath(); sc.arc(x, y, 3.2, 0, Math.PI * 2); sc.fillStyle = sg; sc.fill();
        sc.strokeStyle = "rgba(20,22,24,0.85)"; sc.lineWidth = 0.9; sc.beginPath(); sc.moveTo(x - 2, y - 0.6); sc.lineTo(x + 2, y + 0.6); sc.moveTo(x + 0.6, y - 2); sc.lineTo(x - 0.6, y + 2); sc.stroke();
      }
      // Front edge of the lid: the bright line where top meets face.
      sc.fillStyle = "rgba(255,255,255,0.85)"; sc.fillRect(63, 214.6, 314, 1);
      sc.fillStyle = "rgba(30,34,30,0.28)"; sc.fillRect(62, 216.2, 316, 1.2);

      // Slot: a dished surround, then the dark mouth with a sprung flap just inside.
      rr(sc, 96, 235, 248, 19, 6); sc.fillStyle = tone(CASE, 0.72); sc.fill(); panel(96, 235, 248, 19, 6, false);
      const mouth = sc.createLinearGradient(0, 240, 0, 250); mouth.addColorStop(0, "#040504"); mouth.addColorStop(0.55, "#1b1e1b"); mouth.addColorStop(1, "#3a3f3a");
      rr(sc, 100, 240, 240, 10, 2.5); sc.fillStyle = mouth; sc.fill();
      sc.fillStyle = "rgba(255,255,255,0.14)"; sc.fillRect(102, 248.2, 236, 0.8);
      // Lamp window, unlit.
      rr(sc, 72, 259, 17, 9, 2); sc.fillStyle = "#0d1a0e"; sc.fill(); panel(72, 259, 17, 9, 2, false);
      // Well the eject button lives in.
      rr(sc, 345, 252, 26, 18, 3); sc.fillStyle = "#141614"; sc.fill(); panel(345, 252, 26, 18, 3, false);
      // Small moulded legend under the slot, left of the button.
      sc.fillStyle = "rgba(40,46,40,0.6)"; sc.font = '700 5.6px "Helvetica Neue", Helvetica, Arial, sans-serif'; sc.fillText("BUSY", 72.5, 274.5); sc.fillText("EJECT", 348, 276);
    }

    // ---------- The disk, drawn once ----------
    const M = 8;
    const disk = document.createElement("canvas");
    disk.width = (DW + M * 2) * dpr; disk.height = (DH + M * 2 + 6) * dpr;
    const dc = disk.getContext("2d");
    if (dc) {
      dc.scale(dpr, dpr); dc.translate(M, M);
      const shell = (grow = 0) => { dc.beginPath(); dc.moveTo(5, -grow); dc.lineTo(DW - 13, -grow); dc.lineTo(DW + grow, 13); dc.lineTo(DW + grow, DH - 4); dc.arcTo(DW + grow, DH + grow, DW - 4, DH + grow, 4); dc.lineTo(4, DH + grow); dc.arcTo(-grow, DH + grow, -grow, DH - 4, 4); dc.lineTo(-grow, 5); dc.arcTo(-grow, -grow, 5, -grow, 5); dc.closePath(); };
      // Front edge: the thickness of the shell, with the paper label wrapped over it.
      dc.save(); dc.translate(0, 5.2); shell(); dc.fillStyle = tone(DISK, 0.5); dc.fill(); dc.restore();
      dc.fillStyle = "#b9b3a3"; dc.fillRect(17, DH, 194, 5.2);
      dc.fillStyle = "rgba(0,0,0,0.25)"; dc.fillRect(0, DH + 4.2, DW, 1);
      const bg = dc.createLinearGradient(0, 0, DW, DH); bg.addColorStop(0, tone(DISK, 1.07)); bg.addColorStop(1, tone(DISK, 0.9));
      shell(); dc.fillStyle = bg; dc.fill();
      dc.save(); shell(); dc.clip();
      grain(dc, 0, 0, DW, DH, 12000, "rgba(255,230,210,A)", "rgba(70,14,0,A)", 0.3);
      // Shutter track, sunk a little below the shell.
      dc.fillStyle = tone(DISK, 0.8); dc.fillRect(26, 0, 176, 72);
      dc.fillStyle = "rgba(60,10,0,0.5)"; dc.fillRect(26, 72, 176, 1); dc.fillRect(26, 0, 1, 72);
      dc.fillStyle = "rgba(255,225,200,0.5)"; dc.fillRect(26, 73, 176, 0.8); dc.fillRect(202, 0, 0.8, 72);
      // Label recess running off the front edge.
      rr(dc, 14, 86, 200, DH - 80, [7, 7, 0, 0]); dc.fillStyle = tone(DISK, 0.78); dc.fill();
      dc.strokeStyle = "rgba(60,10,0,0.5)"; dc.lineWidth = 1; rr(dc, 14.5, 86.5, 199, DH - 80, [7, 7, 0, 0]); dc.stroke();
      // Bevel all round the shell.
      dc.lineWidth = 2.4; dc.strokeStyle = "rgba(255,226,204,0.6)"; dc.save(); dc.translate(1.1, 1.1); shell(); dc.stroke(); dc.restore();
      dc.strokeStyle = "rgba(70,14,0,0.5)"; dc.save(); dc.translate(-1.1, -1.1); shell(); dc.stroke(); dc.restore();
      dc.restore();
      // Moulded arrow that shows which way in.
      dc.beginPath(); dc.moveTo(13, 20); dc.lineTo(19, 30); dc.lineTo(15, 30); dc.lineTo(15, 40); dc.lineTo(11, 40); dc.lineTo(11, 30); dc.lineTo(7, 30); dc.closePath(); dc.fillStyle = tone(DISK, 0.72); dc.fill();
      dc.strokeStyle = "rgba(255,226,204,0.55)"; dc.lineWidth = 0.7; dc.beginPath(); dc.moveTo(19.4, 30.6); dc.lineTo(15.4, 30.6); dc.lineTo(15.4, 40.6); dc.lineTo(11, 40.6); dc.stroke();
      // Steel shutter with its window.
      dc.save(); dc.shadowColor = "rgba(50,8,0,0.6)"; dc.shadowBlur = 3 * dpr; dc.shadowOffsetY = 1.5 * dpr; dc.fillStyle = "#9aa1a7"; dc.fillRect(64, 0, 114, 68); dc.restore();
      const steel = dc.createLinearGradient(64, 0, 178, 0); steel.addColorStop(0, "#aeb5ba"); steel.addColorStop(0.2, "#f3f5f6"); steel.addColorStop(0.45, "#c5cbd0"); steel.addColorStop(0.7, "#e7eaec"); steel.addColorStop(1, "#8d949a");
      dc.fillStyle = steel; dc.fillRect(64, 0, 114, 68);
      for (let y = 0.4; y < 68; y += 0.9) { dc.fillStyle = `rgba(${rand() > 0.5 ? "255,255,255" : "40,46,52"},${0.05 + rand() * 0.11})`; dc.fillRect(64, y, 114, 0.5); }
      dc.fillStyle = "#17191b"; dc.fillRect(84, 10, 26, 50);
      dc.fillStyle = tone(DISK, 0.5); dc.fillRect(85, 11, 24, 48);
      dc.fillStyle = "rgba(255,255,255,0.8)"; dc.fillRect(84, 60, 26, 0.8); dc.fillRect(64, 67.2, 114, 0.8);
      dc.fillStyle = "rgba(0,0,0,0.3)"; dc.fillRect(64, 0, 0.8, 68); dc.fillRect(177.2, 0, 0.8, 68);
      // Corner holes at the label end: the left one has its write tab closed.
      for (const x of [5, 215]) { rr(dc, x, DH - 22, 8, 9, 1); dc.fillStyle = "#0c1413"; dc.fill(); dc.fillStyle = "rgba(255,226,204,0.6)"; dc.fillRect(x, DH - 12.6, 8, 0.7); }
      dc.fillStyle = "#26292b"; dc.fillRect(5.6, DH - 21.4, 6.8, 5);
      // Paper label: a colour band, ruled lines, a name in marker.
      const paper = dc.createLinearGradient(17, 89, 211, DH); paper.addColorStop(0, "#fbf7ec"); paper.addColorStop(1, "#ebe4d2");
      dc.save(); dc.shadowColor = "rgba(50,8,0,0.45)"; dc.shadowBlur = 2 * dpr; dc.shadowOffsetY = 1 * dpr; rr(dc, 17, 89, 194, DH - 88, [5, 5, 0, 0]); dc.fillStyle = paper; dc.fill(); dc.restore();
      dc.save(); rr(dc, 17, 89, 194, DH - 88, [5, 5, 0, 0]); dc.clip();
      grain(dc, 17, 89, 194, DH - 88, 2600, "rgba(255,255,255,A)", "rgba(90,70,30,A)", 0.22);
      dc.fillStyle = "#17605c"; dc.fillRect(17, 89, 194, 19);
      dc.fillStyle = "#f6f1e4"; dc.font = '700 6.6px "Helvetica Neue", Helvetica, Arial, sans-serif'; dc.textBaseline = "middle";
      let tx = 25; for (const ch of `${file.maker}  2HD`) { dc.fillText(ch, tx, 99); tx += dc.measureText(ch).width + 1.6; }
      dc.textAlign = "right"; dc.fillText("1.44 MB", 203, 99); dc.textAlign = "left";
      for (let y = 141; y < DH - 6; y += 26) { dc.fillStyle = "rgba(60,110,150,0.4)"; dc.fillRect(25, y, 178, 0.7); }
      dc.translate(28, 136); dc.rotate(-0.035);
      dc.fillStyle = "#1c2a55"; dc.font = '400 25px "Marker Felt", "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive'; dc.textBaseline = "alphabetic";
      dc.fillText(file.label[0], 0, 0);
      dc.font = '400 19px "Marker Felt", "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive'; dc.fillStyle = "#b5321f";
      dc.fillText(file.label[1], 2, 28);
      dc.restore();
    }

    // p: how far in the disk is (0 out on the table, 1 swallowed). e: how far the eject button stands out.
    const s = { p: OUT, pv: 0, e: 0, ev: 0, lamp: 0, mode: "done" as "done" | "push" | "write" | "eject", clock: 0, jit: 0 };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(still, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const yTop = SLOT - s.p * DH, bottom = yTop + DH, vis = bottom - SLOT;

      // Disk shadow, on the table only: the disk floats at slot height.
      if (vis > 2) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 282, W, H - 282); ctx.clip();
        shade(ctx, () => rr(ctx, DX + 5, SLOT - 6, DW - 8, vis + 8, 6), "rgba(2,14,14,0.62)", 15, 7, 34);
        ctx.restore();
        // And a tighter one on the face of the drive under the slot.
        ctx.save(); ctx.beginPath(); ctx.rect(60, 250, 320, 32); ctx.clip();
        shade(ctx, () => rr(ctx, DX, SLOT, DW, Math.min(vis, 36), 2), "rgba(10,14,10,0.5)", 5, 3, 3);
        ctx.restore();
      }
      // Disk, clipped at the mouth of the slot.
      ctx.save(); ctx.beginPath(); ctx.rect(0, SLOT, W, H - SLOT); ctx.clip();
      ctx.drawImage(disk, 0, 0, disk.width, disk.height, DX - M + s.jit, yTop - M, disk.width / dpr, disk.height / dpr);
      const lip = ctx.createLinearGradient(0, SLOT, 0, SLOT + 13); lip.addColorStop(0, "rgba(0,0,0,0.6)"); lip.addColorStop(1, "rgba(0,0,0,0)");
      if (vis > 0) { ctx.fillStyle = lip; ctx.fillRect(DX, SLOT, DW, Math.min(13, vis)); }
      // A broad soft sheen that slides over the shell as it moves.
      if (vis > 8) {
        ctx.beginPath(); ctx.rect(DX, SLOT, DW, vis); ctx.clip();
        const sh = ctx.createLinearGradient(DX - 40, SLOT + 40 + s.p * 120, DX + 200, SLOT + 250 + s.p * 120);
        sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(0.45, "rgba(255,255,255,0)"); sh.addColorStop(0.55, "rgba(255,255,255,0.13)"); sh.addColorStop(0.66, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = sh; ctx.fillRect(DX, SLOT, DW, vis);
      }
      ctx.restore();

      // Eject button: its top shows as it stands out of the face.
      const out = Math.max(-0.5, s.e) * 5.5, bx = 347, by = 254 + out;
      if (out > 0.2) { ctx.fillStyle = tone(CASE, 1.1); rr(ctx, bx, 254, 22, out + 3, 2); ctx.fill(); }
      shade(ctx, () => rr(ctx, bx, by, 22, 14, 2), "rgba(0,0,0,0.6)", 2 + Math.max(0, out) * 0.8, 0.8, 1 + Math.max(0, out) * 0.5);
      const bf = ctx.createLinearGradient(0, by, 0, by + 14); bf.addColorStop(0, tone(CASE, 0.98)); bf.addColorStop(1, tone(CASE, 0.74));
      rr(ctx, bx, by, 22, 14, 2); ctx.fillStyle = bf; ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(bx + 1, by + 0.3, 20, 0.8);
      ctx.fillStyle = "rgba(30,34,30,0.45)"; ctx.fillRect(bx + 6, by + 6.6, 10, 1.2);

      // Busy lamp.
      const L = s.lamp;
      const lens = ctx.createLinearGradient(0, 260, 0, 267);
      lens.addColorStop(0, `rgb(${(40 + 180 * L) | 0},${(70 + 185 * L) | 0},${(40 + 130 * L) | 0})`); lens.addColorStop(1, `rgb(${(14 + 70 * L) | 0},${(34 + 200 * L) | 0},${(16 + 60 * L) | 0})`);
      rr(ctx, 73.2, 260.2, 14.6, 6.6, 1.4); ctx.fillStyle = lens; ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.22 + 0.4 * L})`; ctx.fillRect(74.4, 261, 12, 1.2);
      if (L > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(80.5, 263.5, 0, 80.5, 263.5, 44); g.addColorStop(0, `rgba(150,255,130,${0.75 * L})`); g.addColorStop(0.25, `rgba(90,240,90,${0.26 * L})`); g.addColorStop(1, "rgba(60,220,80,0)");
        ctx.fillStyle = g; ctx.fillRect(36, 219, 90, 90); ctx.restore();
      }
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, t0 = 0, nextEdit = 2.95, nextSave = 1e9;
    const begin = () => { if (s.mode !== "done") return; s.mode = "push"; s.clock = 0; setPhase("busy"); nextSave = 1e9; };
    const step = (dt: number, t: number) => {
      s.clock += dt;
      if (s.mode === "push") {
        s.pv += (95 * (IN + 0.03 - s.p) - 15 * s.pv) * dt; s.p += s.pv * dt;
        if (s.p >= IN) { s.p = IN; s.pv = 0; s.mode = "write"; s.clock = 0; }
      } else if (s.mode === "write") {
        // The lamp follows a made-up pattern of head activity: bursts, with short rests.
        const n = Math.sin(t * 31) + Math.sin(t * 17.3 + 1) + Math.sin(t * 7.1 + 2);
        const on = s.clock < 0.18 ? 0 : n > -0.5 ? 1 : 0;
        s.lamp += (on - s.lamp) * Math.min(1, dt * 60);
        s.jit = on ? Math.sin(t * 190) * 0.25 : 0;
        if (s.clock > WRITE_SECONDS) { s.mode = "eject"; s.clock = 0; s.jit = 0; s.pv = -1.5; setPhase("done"); }
      } else if (s.mode === "eject") {
        s.lamp += (0 - s.lamp) * Math.min(1, dt * 14);
        s.pv += (130 * (OUT - s.p) - 9.5 * s.pv) * dt; s.p += s.pv * dt;
        if (s.clock > 0.5 && Math.abs(s.pv) < 0.01 && Math.abs(s.p - OUT) < 0.003) { s.p = OUT; s.pv = 0; s.mode = "done"; nextEdit = t + 3.2; }
      }
      // The button stands out while a disk is seated, and dips as it throws the disk back.
      const want = s.mode === "write" ? 1 : s.mode === "eject" && s.clock < 0.13 ? -0.45 : 0;
      s.ev += (420 * (want - s.e) - 19 * s.ev) * dt; s.e += s.ev * dt;
    };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      if (now - touched > 7000 && s.mode === "done") {
        if (t > nextEdit && nextSave > 1e8) { setPhase("dirty"); nextSave = t + 1.3; }
        if (t > nextSave) begin();
      }
      step(dt / 2, t); step(dt / 2, t);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    let quiet = 0;
    api.current = {
      save: () => {
        touched = performance.now();
        if (!reduce) { begin(); wake(); return; }
        // Reduced motion: no travel, just the three states in turn.
        if (s.mode !== "done") return;
        s.mode = "write"; s.p = IN; s.e = 1; s.lamp = 1; setPhase("busy"); draw();
        quiet = window.setTimeout(() => { s.mode = "done"; s.p = OUT; s.e = 0; s.lamp = 0; setPhase("done"); draw(); }, WRITE_SECONDS * 1000);
      },
    };
    if (reduce) draw(); else wake();

    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(quiet); api.current = null; io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const busy = phase === "busy";

  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#143a39] bg-[radial-gradient(85%_65%_at_50%_40%,#216260_0%,#143a39_72%)] px-4 py-8 sm:min-h-[800px]">
      <div className="relative h-[375px] w-[330px] sm:h-[600px] sm:w-[528px]">
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Push the disk in to save"
          onClick={() => api.current?.save()}
          className="absolute left-[24%] top-[49%] h-[32%] w-[52%] cursor-pointer touch-manipulation outline-none"
        />
      </div>
      <div className="mt-1 flex flex-col items-center gap-4 sm:mt-0">
        <button
          type="button"
          onClick={() => api.current?.save()}
          aria-disabled={busy}
          className={`h-11 rounded-full px-6 font-mono text-[12px] font-semibold uppercase tracking-[0.18em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#f4efe2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#143a39] ${busy ? "cursor-default bg-[#f4efe2]/20 text-[#f4efe2]" : "bg-[#f4efe2] text-[#143a39] hover:bg-white"}`}
        >
          {busy ? "Saving" : "Save changes"}
        </button>
        <p role="status" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#d5e4e1]">
          <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 rounded-full ${phase === "dirty" ? "bg-[#ffb347]" : busy ? "bg-[#8dff7a]" : "bg-[#d5e4e1]/60"}`} />
          {words[phase]}
        </p>
      </div>
    </div>
  );
}
