import { useEffect, useRef, useState } from "react";

// The line the demo types, how much of it is already there on load, and the longest line the field holds.
const PHRASE = "the quick brown fox jumps over ";
const START = 18;
const MAX = 28;
const STEM = [38, 118, 232]; // stem plastic, as red, green, blue
const WIRE = [222, 174, 66]; // spring wire
const maker = { name: "Kestrel KS-1", kind: "clicky" };
const W = 440, H = 344, OX = 30, OY = -112;
const TRAVEL = 40; // how far the stem goes, in drawing units

type Pt = [number, number];

export default function MechanicalKeySwitchCutawayInput() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState(PHRASE.slice(0, START));
  const [closed, setClosed] = useState(false);
  const idx = useRef(START);
  const focused = useRef(false);
  const api = useRef<{ press: (down: boolean) => void; tap: () => void } | null>(null);
  const typeNext = useRef(() => {});
  typeNext.current = () => {
    const ch = PHRASE[idx.current % PHRASE.length];
    idx.current += 1;
    setText((v) => (v.length >= MAX ? ch : v + ch));
  };

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.25;
    cv.width = W * dpr; cv.height = H * dpr;
    const stem = (k: number, a = 1) => `rgba(${Math.min(255, STEM[0] * k) | 0},${Math.min(255, STEM[1] * k) | 0},${Math.min(255, STEM[2] * k) | 0},${a})`;
    const wire = (k: number) => `rgb(${Math.min(255, WIRE[0] * k) | 0},${Math.min(255, WIRE[1] * k) | 0},${Math.min(255, WIRE[2] * k) | 0})`;

    const poly = (c: CanvasRenderingContext2D, pts: Pt[]) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
    // A sawn face: flat colour, fine diagonal hatching, a light arris.
    const cut = (c: CanvasRenderingContext2D, path: () => void, base: string | CanvasGradient, hatch: string, edge: string, step = 4.5) => {
      path(); c.fillStyle = base; c.fill();
      c.save(); path(); c.clip();
      c.strokeStyle = hatch; c.lineWidth = 0.7; c.beginPath();
      for (let k = -500; k < 900; k += step) { c.moveTo(k, 500); c.lineTo(k + 500, 0); }
      c.stroke(); c.restore();
      path(); c.lineWidth = 0.9; c.strokeStyle = edge; c.stroke();
    };
    const layer = () => { const el = document.createElement("canvas"); el.width = cv.width; el.height = cv.height; const c = el.getContext("2d"); if (c) { c.scale(dpr, dpr); c.translate(OX, OY); } return [el, c] as const; };

    // ---------- Everything that never moves: board, pins, plate, both housing halves, labels ----------
    const [still, sc] = layer();
    if (sc) {
      // Soft pool of shadow under the board.
      sc.save(); sc.translate(190, 424); sc.scale(1, 0.085);
      const sh = sc.createRadialGradient(0, 0, 0, 0, 0, 215); sh.addColorStop(0, "rgba(40,34,22,0.5)"); sh.addColorStop(0.6, "rgba(40,34,22,0.16)"); sh.addColorStop(1, "rgba(40,34,22,0)");
      sc.fillStyle = sh; sc.fillRect(-215, -215, 430, 430); sc.restore();

      // Circuit board, seen edge on: glass laminate between two skins of green mask.
      const lam = sc.createLinearGradient(0, 380, 0, 395); lam.addColorStop(0, "#decd8f"); lam.addColorStop(1, "#bca965");
      sc.save(); sc.shadowColor = "rgba(40,34,22,0.35)"; sc.shadowBlur = 8 * dpr; sc.shadowOffsetY = 5 * dpr; sc.fillStyle = "#bca965"; sc.fillRect(26, 380, 328, 14); sc.restore();
      sc.fillStyle = lam; sc.fillRect(26, 380, 328, 14);
      for (let y = 382.4; y < 393; y += 2.1) { sc.fillStyle = "rgba(118,92,30,0.26)"; sc.fillRect(26, y, 328, 0.5); }
      for (let x = 28; x < 354; x += 3) { sc.fillStyle = "rgba(255,246,205,0.13)"; sc.fillRect(x, 380, 0.6, 14); }
      sc.fillStyle = "#1f6f54"; sc.fillRect(26, 377.6, 328, 3);
      sc.fillStyle = "rgba(190,255,225,0.5)"; sc.fillRect(26, 377.6, 328, 0.6);
      sc.fillStyle = "#17503d"; sc.fillRect(26, 393.4, 328, 2.2);
      sc.fillStyle = "rgba(0,0,0,0.22)"; sc.fillRect(26, 377.6, 1, 18); sc.fillRect(353, 377.6, 1, 18);
      // Copper track on the top skin running out to the lamp, and the pads the pins are soldered to.
      sc.fillStyle = "#cf8748"; sc.fillRect(285, 376.9, 36, 0.9);
      for (const px of [108.7, 136.5]) { sc.fillStyle = "#d58d4c"; sc.fillRect(px - 6, 395.4, 12, 1.5); }
      // The two legs, through the board, with a cone of solder each.
      for (const px of [108.7, 136.5]) {
        const pg = sc.createLinearGradient(px - 1.5, 0, px + 1.5, 0); pg.addColorStop(0, "#8a6a26"); pg.addColorStop(0.4, "#f0d68a"); pg.addColorStop(1, "#9a7630");
        sc.fillStyle = "rgba(60,44,10,0.5)"; sc.fillRect(px - 2.4, 380, 4.8, 14);
        sc.fillStyle = pg; sc.fillRect(px - 1.4, 366, 2.8, 45);
        const so = sc.createLinearGradient(px - 6, 0, px + 6, 0); so.addColorStop(0, "#7d858c"); so.addColorStop(0.3, "#fbfcfd"); so.addColorStop(0.55, "#aab2b9"); so.addColorStop(1, "#5b6269");
        sc.beginPath(); sc.moveTo(px - 6.2, 396.6); sc.quadraticCurveTo(px - 2.2, 398.5, px - 1.5, 405.5); sc.lineTo(px + 1.5, 405.5); sc.quadraticCurveTo(px + 2.2, 398.5, px + 6.2, 396.6); sc.closePath();
        sc.fillStyle = so; sc.fill(); sc.lineWidth = 0.5; sc.strokeStyle = "rgba(40,44,50,0.55)"; sc.stroke();
      }
      // Locating peg of the housing.
      const peg = sc.createLinearGradient(180, 0, 200, 0); peg.addColorStop(0, "#1c1e22"); peg.addColorStop(0.3, "#4a4f57"); peg.addColorStop(1, "#15171a");
      sc.fillStyle = peg; sc.beginPath(); sc.moveTo(181, 380); sc.lineTo(199, 380); sc.lineTo(199, 398); sc.quadraticCurveTo(199, 403, 194, 403); sc.lineTo(186, 403); sc.quadraticCurveTo(181, 403, 181, 398); sc.closePath(); sc.fill();
      // Surface-mount lamp at the end of the track: two tinned ends, a milky body.
      sc.fillStyle = "#b9c0c6"; sc.fillRect(313, 372.2, 3, 5.6); sc.fillRect(326, 372.2, 3, 5.6);
      sc.fillStyle = "#efe6cc"; sc.beginPath(); sc.moveTo(316, 377.8); sc.lineTo(316, 373.5); sc.quadraticCurveTo(321, 368.6, 326, 373.5); sc.lineTo(326, 377.8); sc.closePath(); sc.fill();
      sc.lineWidth = 0.5; sc.strokeStyle = "rgba(60,50,20,0.5)"; sc.stroke();

      // Steel mounting plate, either side of the hole the switch sits in.
      for (const [x0, x1] of [[20, 93], [287, 360]] as Pt[]) {
        const pl = sc.createLinearGradient(0, 295, 0, 304); pl.addColorStop(0, "#f6f8f9"); pl.addColorStop(0.25, "#c3c9ce"); pl.addColorStop(0.7, "#8d949b"); pl.addColorStop(1, "#5f666d");
        sc.save(); sc.shadowColor = "rgba(40,34,22,0.3)"; sc.shadowBlur = 5 * dpr; sc.shadowOffsetY = 4 * dpr; sc.fillStyle = "#8d949b"; sc.fillRect(x0, 295, x1 - x0, 9); sc.restore();
        cut(sc, () => { sc.beginPath(); sc.rect(x0, 295, x1 - x0, 9); }, pl, "rgba(40,46,54,0.22)", "rgba(52,58,66,0.7)", 3);
        sc.fillStyle = "rgba(255,255,255,0.85)"; sc.fillRect(x0, 295.3, x1 - x0, 0.7);
      }

      // Lower housing in black nylon: the hollow first, then the sawn walls, floor and centre tube.
      const hollow = sc.createLinearGradient(0, 300, 0, 366); hollow.addColorStop(0, "#2b2f35"); hollow.addColorStop(1, "#15171a");
      sc.fillStyle = hollow; sc.fillRect(107, 300, 166, 66);
      const side = sc.createLinearGradient(107, 0, 273, 0); side.addColorStop(0, "rgba(0,0,0,0.45)"); side.addColorStop(0.2, "rgba(0,0,0,0)"); side.addColorStop(0.8, "rgba(0,0,0,0)"); side.addColorStop(1, "rgba(0,0,0,0.4)");
      sc.fillStyle = side; sc.fillRect(107, 300, 166, 66);
      sc.fillStyle = "#0c0d0f"; sc.fillRect(180, 338, 20, 28);
      const lower: Pt[] = [[95, 300], [107, 300], [107, 366], [174, 366], [174, 338], [180, 338], [180, 366], [200, 366], [200, 338], [206, 338], [206, 366], [273, 366], [273, 300], [285, 300], [285, 380], [95, 380]];
      const ny = sc.createLinearGradient(0, 300, 0, 380); ny.addColorStop(0, "#4b5059"); ny.addColorStop(1, "#33373d");
      cut(sc, () => poly(sc, lower), ny, "rgba(255,255,255,0.075)", "rgba(10,11,13,0.9)");
      sc.strokeStyle = "rgba(255,255,255,0.3)"; sc.lineWidth = 0.7;
      sc.beginPath(); sc.moveTo(95.5, 379); sc.lineTo(95.5, 300.5); sc.lineTo(106.5, 300.5); sc.moveTo(107.5, 366.6); sc.lineTo(173.5, 366.6); sc.moveTo(206.5, 366.6); sc.lineTo(272.5, 366.6); sc.moveTo(273.5, 300.5); sc.lineTo(284.5, 300.5); sc.stroke();

      // Upper housing in smoked polycarbonate.
      const backTop: Pt[] = [[156, 222], [224, 222], [224, 233], [249, 233], [273, 300], [107, 300], [131, 233], [156, 233]];
      const smoke = sc.createLinearGradient(0, 222, 0, 300); smoke.addColorStop(0, "#7f8c98"); smoke.addColorStop(1, "#414a53");
      poly(sc, backTop); sc.fillStyle = smoke; sc.fill();
      sc.save(); poly(sc, backTop); sc.clip();
      const gloss = sc.createLinearGradient(120, 230, 215, 300); gloss.addColorStop(0, "rgba(255,255,255,0)"); gloss.addColorStop(0.42, "rgba(255,255,255,0)"); gloss.addColorStop(0.5, "rgba(255,255,255,0.13)"); gloss.addColorStop(0.58, "rgba(255,255,255,0)"); gloss.addColorStop(1, "rgba(255,255,255,0)");
      sc.fillStyle = gloss; sc.fillRect(100, 220, 180, 82);
      const seam = sc.createLinearGradient(0, 292, 0, 300); seam.addColorStop(0, "rgba(0,0,0,0)"); seam.addColorStop(1, "rgba(0,0,0,0.4)"); sc.fillStyle = seam; sc.fillRect(100, 292, 180, 8);
      sc.restore();
      // Guide rail the stem's right leg runs against.
      const rail = sc.createLinearGradient(236, 0, 243, 0); rail.addColorStop(0, "#565c65"); rail.addColorStop(1, "#22252a");
      sc.fillStyle = rail; sc.fillRect(236.5, 268, 5, 98);
      const pc = sc.createLinearGradient(0, 222, 0, 300); pc.addColorStop(0, "#b9c4ce"); pc.addColorStop(1, "#7f8b97");
      for (const m of [1, -1]) {
        const X = (x: number) => (m > 0 ? x : 380 - x);
        const wall: Pt[] = [[X(89), 300], [X(89), 292], [X(95), 292], [X(120), 222], [X(156), 222], [X(156), 233], [X(131), 233], [X(107), 300]];
        cut(sc, () => poly(sc, wall), pc, "rgba(255,255,255,0.3)", "rgba(40,48,58,0.75)");
        sc.strokeStyle = "rgba(255,255,255,0.9)"; sc.lineWidth = 0.9; sc.beginPath(); sc.moveTo(X(96.2), 291); sc.lineTo(X(120.8), 222.8); sc.lineTo(X(155), 222.8); sc.stroke();
      }

      // Fixed contact: a copper post up the wall with a gold pip.
      const post = sc.createLinearGradient(107, 0, 111, 0); post.addColorStop(0, "#8e4c22"); post.addColorStop(0.45, "#f0a871"); post.addColorStop(1, "#a65d2b");
      sc.fillStyle = post; sc.fillRect(107.2, 266, 3.4, 100);
      const pip = sc.createRadialGradient(111.6, 274.8, 0, 112.4, 276, 3.6); pip.addColorStop(0, "#fff6cf"); pip.addColorStop(0.5, "#e5bb4d"); pip.addColorStop(1, "#8f6a17");
      sc.beginPath(); sc.arc(112.4, 276, 3.3, 0, Math.PI * 2); sc.fillStyle = pip; sc.fill();

      // Call-outs, as on a parts drawing.
      const call = (text: string, x: number, y: number, ex: number, ey: number, tx: number, right: boolean) => {
        sc.strokeStyle = "#cf4f25"; sc.lineWidth = 0.75; sc.beginPath(); sc.moveTo(x, y); sc.lineTo(ex, ey); sc.lineTo(tx, ey); sc.stroke();
        sc.beginPath(); sc.arc(x, y, 1.9, 0, Math.PI * 2); sc.fillStyle = "#cf4f25"; sc.fill();
        sc.beginPath(); sc.arc(x, y, 0.7, 0, Math.PI * 2); sc.fillStyle = "#fff"; sc.fill();
        sc.font = '600 7.6px ui-monospace, "SF Mono", Menlo, Consolas, monospace'; sc.textBaseline = "middle"; sc.fillStyle = "#3d4450";
        const gap = 1.5, widths = [...text].map((ch) => sc.measureText(ch).width + gap), total = widths.reduce((a, b) => a + b, 0) - gap;
        let cx = right ? tx + 5 : tx - 5 - total;
        [...text].forEach((ch, i) => { sc.fillText(ch, cx, ey + 0.4); cx += widths[i]; });
      };
      call("KEYCAP", 292, 190, 316, 172, 330, true);
      call("STEM", 228, 247, 300, 247, 330, true);
      call("PLATE", 322, 299.5, 330, 283, 334, true);
      call("SPRING", 209, 340, 300, 340, 330, true);
      call("LAMP", 321, 371, 338, 356, 342, true);
      call("CONTACT", 112.4, 276, 76, 322, 64, false);
      call("LEAF", 136, 350, 80, 350, 64, false);
    }

    // ---------- Keycap, drawn once at rest and slid down with the stem ----------
    const [cap, kc] = layer();
    if (kc) {
      const inner: Pt[] = [[81, 216], [101.5, 167], [278.5, 167], [299, 216]];
      const dim = kc.createLinearGradient(0, 165, 0, 216); dim.addColorStop(0, "#6d6652"); dim.addColorStop(0.3, "#958d76"); dim.addColorStop(0.85, "#c2b9a0"); dim.addColorStop(1, "#d9d0b8");
      poly(kc, inner); kc.fillStyle = dim; kc.fill();
      kc.save(); poly(kc, inner); kc.clip();
      const wallsIn = kc.createLinearGradient(81, 0, 299, 0); wallsIn.addColorStop(0, "rgba(40,32,12,0.5)"); wallsIn.addColorStop(0.16, "rgba(40,32,12,0)"); wallsIn.addColorStop(0.8, "rgba(255,250,235,0)"); wallsIn.addColorStop(1, "rgba(255,250,235,0.4)");
      kc.fillStyle = wallsIn; kc.fillRect(81, 165, 218, 52);
      kc.fillStyle = "rgba(255,252,240,0.55)"; kc.fillRect(81, 214.6, 218, 1.4);
      // The round sleeve that grips the stem, and the stem's hole through it.
      const sleeve = kc.createLinearGradient(166, 0, 214, 0); sleeve.addColorStop(0, "#857d66"); sleeve.addColorStop(0.3, "#e4dcc6"); sleeve.addColorStop(0.6, "#bdb49b"); sleeve.addColorStop(1, "#6f6853");
      kc.fillStyle = sleeve; kc.fillRect(166, 165, 48, 41);
      kc.restore();
      kc.fillStyle = "rgba(30,24,8,0.55)"; kc.fillRect(178, 180, 24, 26);
      const shell = () => {
        kc.beginPath(); kc.moveTo(70, 216); kc.lineTo(96.4, 160.5); kc.quadraticCurveTo(99.4, 152.6, 108.5, 152.9); kc.quadraticCurveTo(190, 159.5, 271.5, 152.9); kc.quadraticCurveTo(280.6, 152.6, 283.6, 160.5); kc.lineTo(310, 216); kc.lineTo(299, 216);
        kc.lineTo(278.5, 170); kc.quadraticCurveTo(276.6, 165.5, 271.5, 165.5); kc.lineTo(214, 165.5); kc.lineTo(214, 206); kc.lineTo(202, 206); kc.lineTo(202, 180); kc.lineTo(178, 180); kc.lineTo(178, 206); kc.lineTo(166, 206); kc.lineTo(166, 165.5); kc.lineTo(108.5, 165.5); kc.quadraticCurveTo(103.4, 165.5, 101.5, 170); kc.lineTo(81, 216); kc.closePath();
      };
      kc.save(); kc.shadowColor = "rgba(40,34,22,0.32)"; kc.shadowBlur = 8 * dpr; kc.shadowOffsetY = 6 * dpr; shell(); kc.fillStyle = "#ece5d2"; kc.fill(); kc.restore();
      const abs = kc.createLinearGradient(60, 150, 320, 220); abs.addColorStop(0, "#faf6e9"); abs.addColorStop(0.5, "#ede6d3"); abs.addColorStop(1, "#d6cdb5");
      cut(kc, shell, abs, "rgba(110,92,48,0.17)", "rgba(96,84,52,0.8)");
      kc.strokeStyle = "rgba(255,255,255,0.95)"; kc.lineWidth = 1; kc.beginPath(); kc.moveTo(71.6, 214.5); kc.lineTo(97.4, 160.8); kc.quadraticCurveTo(100.2, 153.9, 108.5, 154); kc.quadraticCurveTo(190, 160.6, 270, 154.1); kc.stroke();
    }

    // press: 0 at rest, 1 bottomed out. lit: how bright the lamp is. spark: the flash at the pips.
    const s = { x: 0, v: 0, held: false, pulse: 0, lit: 0, spark: 0, closed: false };

    const coil = (front: boolean, top: number) => {
      const turns = 6.5, per = 30, N = Math.round(turns * per), bot = 364.5, cx = 190, R = 18.6;
      ctx.lineCap = "round";
      for (let i = 0; i < N; i++) {
        const a0 = (i / per) * Math.PI * 2 + 0.6, a1 = ((i + 1) / per) * Math.PI * 2 + 0.6, am = (a0 + a1) / 2;
        if ((Math.sin(am) > 0) !== front) continue;
        const x0 = cx + Math.cos(a0) * R, x1 = cx + Math.cos(a1) * R, y0 = top + ((bot - top) * i) / N, y1 = top + ((bot - top) * (i + 1)) / N;
        if (!front && y0 > 336 && x0 > 173 && x0 < 207) continue; // behind the centre tube
        const face = -Math.cos(am); // lit from the left
        const k = front ? 0.72 + 0.4 * Math.max(0, face) + 0.25 * Math.pow(Math.max(0, Math.sin(am)), 6) : 0.3 + 0.16 * (face + 1);
        ctx.strokeStyle = wire(k); ctx.lineWidth = 4.3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        if (front) { ctx.strokeStyle = `rgba(255,248,214,${0.2 + 0.6 * Math.pow(Math.max(0, Math.sin(am)), 3)})`; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x0 - 0.4, y0 - 1.1); ctx.lineTo(x1 - 0.4, y1 - 1.1); ctx.stroke(); }
        else { ctx.strokeStyle = "rgba(0,0,0,0.28)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0 + 1.6); ctx.lineTo(x1, y1 + 1.6); ctx.stroke(); }
      }
      ctx.lineCap = "butt";
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(still, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, OX * dpr, OY * dpr);
      const T = Math.max(0, Math.min(1, s.x)) * TRAVEL;

      coil(false, 263 + T);

      // ---- Stem ----
      ctx.save(); ctx.translate(0, T);
      const edge = "rgba(6,28,74,0.7)";
      const round = ctx.createLinearGradient(178, 0, 202, 0); round.addColorStop(0, stem(0.62)); round.addColorStop(0.28, stem(1.32)); round.addColorStop(0.55, stem(1)); round.addColorStop(1, stem(0.55));
      ctx.fillStyle = round; ctx.fillRect(178, 181, 24, 42); ctx.lineWidth = 0.7; ctx.strokeStyle = edge; ctx.strokeRect(178, 181, 24, 42);
      const pole = ctx.createLinearGradient(182, 0, 198, 0); pole.addColorStop(0, stem(0.6)); pole.addColorStop(0.3, stem(1.3)); pole.addColorStop(0.6, stem(0.95)); pole.addColorStop(1, stem(0.5));
      ctx.beginPath(); ctx.moveTo(182, 262); ctx.lineTo(198, 262); ctx.lineTo(198, 312); ctx.quadraticCurveTo(198, 319, 190, 319); ctx.quadraticCurveTo(182, 319, 182, 312); ctx.closePath(); ctx.fillStyle = pole; ctx.fill(); ctx.stroke();
      for (const leg of [[[146.3, 262], [157, 262], [157, 302], [155.6, 302], [146.3, 288]], [[223, 262], [234, 262], [234, 293], [231, 297], [223, 297]]] as Pt[][]) {
        const lg = ctx.createLinearGradient(leg[0][0], 0, leg[1][0], 0); lg.addColorStop(0, stem(1.12)); lg.addColorStop(1, stem(0.7));
        poly(ctx, leg); ctx.fillStyle = lg; ctx.fill(); ctx.stroke();
      }
      const body: Pt[] = [[158, 222], [222, 222], [222, 233], [234, 233], [234, 262], [146, 262], [146, 233], [158, 233]];
      const bg = ctx.createLinearGradient(0, 222, 0, 262); bg.addColorStop(0, stem(1.2)); bg.addColorStop(0.3, stem(1.02)); bg.addColorStop(1, stem(0.74));
      poly(ctx, body); ctx.fillStyle = bg; ctx.fill(); ctx.stroke();
      const sideShade = ctx.createLinearGradient(146, 0, 234, 0); sideShade.addColorStop(0, "rgba(255,255,255,0.16)"); sideShade.addColorStop(0.25, "rgba(255,255,255,0)"); sideShade.addColorStop(0.75, "rgba(0,0,0,0)"); sideShade.addColorStop(1, "rgba(0,10,40,0.3)");
      poly(ctx, body); ctx.fillStyle = sideShade; ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.62)"; ctx.fillRect(159, 222.7, 62, 0.9); ctx.fillRect(147, 233.7, 11, 0.8); ctx.fillRect(222, 233.7, 11, 0.8);
      ctx.fillStyle = "rgba(255,255,255,0.26)"; ctx.beginPath(); ctx.ellipse(170, 241, 14, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      coil(true, 263 + T);

      // ---- Moving leaf: the wedge on the stem's left leg bends it over until the pips meet ----
      const local = 306 - (262 + T);
      const legX = local > 40 ? 999 : local > 26 ? 146.3 + ((local - 26) * 9.7) / 14 : 146.3;
      const defl = Math.min(7.74, Math.max(0, 154 - legX));
      const lx = (h: number) => 136 - defl * Math.pow(h / 60, 1.3) + (h > 46 && h < 74 ? 18 * (1 - Math.abs(h - 60) / 14) : 0);
      const leafPath = (dx: number) => { ctx.beginPath(); for (let h = 0; h <= 99; h += 1.5) ctx.lineTo(lx(h) + dx, 366 - h); };
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      leafPath(0.9); ctx.strokeStyle = "rgba(0,0,0,0.45)"; ctx.lineWidth = 3; ctx.stroke();
      leafPath(0); ctx.strokeStyle = "#b9682f"; ctx.lineWidth = 2.7; ctx.stroke();
      leafPath(-0.55); ctx.strokeStyle = "#ffd0a3"; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.lineCap = "butt";
      const px = lx(90) - 4.4;
      const pip = ctx.createRadialGradient(px - 0.8, 274.8, 0, px, 276, 3.6); pip.addColorStop(0, "#fff6cf"); pip.addColorStop(0.5, "#e5bb4d"); pip.addColorStop(1, "#8f6a17");
      ctx.beginPath(); ctx.arc(px, 276, 3.3, 0, Math.PI * 2); ctx.fillStyle = pip; ctx.fill();
      const isClosed = defl >= 7.6;
      if (isClosed !== s.closed) { s.closed = isClosed; if (isClosed) s.spark = 1; setClosed(isClosed); }

      // ---- Keycap rides on the stem, and shades whatever is under its skirt ----
      ctx.save(); poly(ctx, [[89, 300], [89, 292], [95, 292], [120, 222], [260, 222], [285, 292], [291, 292], [291, 300]]); ctx.clip();
      const under = ctx.createLinearGradient(0, 214 + T, 0, 236 + T); under.addColorStop(0, "rgba(10,12,16,0.5)"); under.addColorStop(1, "rgba(10,12,16,0)");
      ctx.fillStyle = under; ctx.fillRect(80, 200 + T, 220, 36); ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(cap, 0, Math.round(T * dpr * 100) / 100);
      ctx.setTransform(dpr, 0, 0, dpr, OX * dpr, OY * dpr);
      // The top of the stem shows again inside the sawn-open sleeve.
      const inSock = ctx.createLinearGradient(178, 0, 202, 0); inSock.addColorStop(0, stem(0.5)); inSock.addColorStop(0.3, stem(1.2)); inSock.addColorStop(0.6, stem(0.9)); inSock.addColorStop(1, stem(0.42));
      ctx.fillStyle = inSock; ctx.fillRect(179.2, 182.5 + T, 21.6, 23.5);
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(179.2, 180 + T, 21.6, 2.5);

      // ---- Light: a flash where the pips touch, then the lamp on the board ----
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      if (s.spark > 0.01) {
        const g = ctx.createRadialGradient(117.6, 276, 0, 117.6, 276, 22); g.addColorStop(0, `rgba(255,244,210,${0.95 * s.spark})`); g.addColorStop(0.3, `rgba(255,190,110,${0.4 * s.spark})`); g.addColorStop(1, "rgba(255,170,80,0)");
        ctx.fillStyle = g; ctx.fillRect(95, 254, 45, 45);
      }
      if (s.lit > 0.01) {
        const L = s.lit;
        const g = ctx.createRadialGradient(321, 372, 0, 321, 372, 46); g.addColorStop(0, `rgba(255,214,120,${0.95 * L})`); g.addColorStop(0.16, `rgba(255,160,40,${0.6 * L})`); g.addColorStop(0.5, `rgba(255,130,20,${0.14 * L})`); g.addColorStop(1, "rgba(255,120,10,0)");
        ctx.fillStyle = g; ctx.fillRect(275, 326, 92, 92);
        ctx.fillStyle = `rgba(255,190,90,${0.8 * L})`; ctx.fillRect(285, 376.7, 31, 1.2);
      }
      ctx.restore();
      if (s.lit > 0.01) { ctx.fillStyle = `rgba(255,236,170,${s.lit})`; ctx.beginPath(); ctx.moveTo(316, 377.8); ctx.lineTo(316, 373.5); ctx.quadraticCurveTo(321, 368.6, 326, 373.5); ctx.lineTo(326, 377.8); ctx.closePath(); ctx.fill(); }
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, t0 = 0, nextDown = 1.75, first = true, count = 0;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      if (now - touched > 6000 && !focused.current && !s.held && s.pulse <= 0 && t > nextDown) {
        // The first press is held long enough to study; after that it types at a steady pace.
        s.pulse = first ? 1.7 : 0.15; typeNext.current(); count += 1;
        nextDown = t + (first ? 2.5 : count % 6 === 0 ? 1.5 : 0.46); first = false;
      }
      if (s.pulse > 0) s.pulse -= dt;
      const down = s.held || s.pulse > 0, k = down ? 1150 : 760, c = down ? 44 : 22;
      // Two short steps a frame keep the stiff spring stable.
      for (let i = 0; i < 2; i++) {
        s.v += (k * ((down ? 1.06 : -0.06) - s.x) - c * s.v) * (dt / 2); s.x += s.v * (dt / 2);
        if (s.x > 1) { s.x = 1; s.v *= -0.22; }
        if (s.x < 0) { s.x = 0; s.v *= -0.28; }
      }
      s.lit += ((s.closed ? 1 : 0) - s.lit) * Math.min(1, dt * (s.closed ? 30 : 12));
      s.spark = Math.max(0, s.spark - dt * 5);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { s.x = s.held ? 1 : 0; s.v = 0; draw(); s.lit = s.closed ? 1 : 0; s.spark = 0; draw(); };

    api.current = {
      press: (down) => { touched = performance.now(); s.held = down; if (reduce) settle(); else wake(); },
      tap: () => { touched = performance.now(); s.pulse = 0.14; if (!reduce) wake(); },
    };
    if (reduce) settle(); else wake();

    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const held = useRef(false);
  const release = () => { if (held.current) { held.current = false; api.current?.press(false); } };

  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#e6e2d8] bg-[radial-gradient(90%_70%_at_50%_38%,#f3f0e8_0%,#e6e2d8_70%)] px-4 py-10 sm:min-h-[760px]">
      <div className="relative h-[258px] w-[330px] sm:h-[500px] sm:w-[640px]">
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <button
          type="button"
          aria-label="Press the key to type the next letter"
          onPointerDown={() => { held.current = true; api.current?.press(true); typeNext.current(); }}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          onClick={(e) => { if (e.detail === 0) { api.current?.tap(); typeNext.current(); } }}
          className="absolute left-[21%] top-[9%] h-[24%] w-[58%] cursor-pointer touch-manipulation rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#cf4f25] focus-visible:ring-offset-4 focus-visible:ring-offset-[#e6e2d8]"
        />
      </div>
      <div className="mt-6 w-full max-w-[300px] sm:mt-8">
        <label htmlFor="key-switch-cutaway-line" className="sr-only">Type here to press the switch</label>
        <input
          id="key-switch-cutaway-line"
          type="text"
          value={text}
          maxLength={MAX}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Type here"
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          onKeyDown={(e) => { if (!e.repeat && !e.metaKey && !e.ctrlKey && e.key !== "Tab") api.current?.press(true); }}
          onKeyUp={() => api.current?.press(false)}
          onFocus={() => { focused.current = true; }}
          onBlur={() => { focused.current = false; api.current?.press(false); }}
          className="h-11 w-full border-0 border-b border-slate-400 bg-transparent text-center font-mono text-[15px] tracking-[0.04em] text-slate-900 caret-[#cf4f25] outline-none placeholder:text-slate-500 focus:border-b-2 focus:border-[#cf4f25]"
        />
        <p className="mt-3 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${closed ? "bg-[#e8891c]" : "bg-slate-400"}`} aria-hidden="true" />
          <span className="font-semibold text-slate-900">{maker.name}</span>
          <span className="text-slate-500">/</span>
          <span>{maker.kind}</span>
          <span className="text-slate-500">/</span>
          <span aria-live="off">{closed ? "closed" : "open"}</span>
        </p>
      </div>
    </div>
  );
}
