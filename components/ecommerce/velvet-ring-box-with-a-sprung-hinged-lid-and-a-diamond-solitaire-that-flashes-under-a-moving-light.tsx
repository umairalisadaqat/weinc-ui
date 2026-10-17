import { useEffect, useRef, useState } from "react";

// The piece in the box. Change the words here; the foil stamp inside the lid uses `maker`.
const piece = {
  name: "Halcyon solitaire",
  detail: "1.2 ct round brilliant on 18k yellow gold",
  price: "£4,850",
  maker: "ORREL & VANE",
  makerLine: "GOLDSMITHS",
};
const VELVET: [number, number, number] = [15, 58, 49]; // the flock on the outside of the box
const OPEN_ANGLE = 1.76; // radians the lid rests at when open (about 100 degrees)
const VW = 520, VH = 580; // drawing space; the canvas scales this to its width

type V3 = [number, number, number];

export default function VelvetRingBox() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(true);
  const openRef = useRef(true);
  const api = useRef<{ toggle: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, pad = hit.current;
    if (!cv || !pad) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scale = 1;

    // Box measurements in millimetre-like units.
    const A = 100, RAD = 20, SEG = 6, HB = 64, HL = 48, WALL = 9;
    const PHI = 0.53, CP = Math.cos(PHI), SP = Math.sin(PHI), K = 1.3, F = 1500, OX = VW / 2 + 6, OY = 452;
    const TAU = 0.42; // how far the ring leans toward you on its cushion
    const RING = 37, TUBE = 4.3, GEM = 26;

    const foot: { x: number; z: number; nx: number; nz: number }[] = [];
    for (let q = 0; q < 4; q++) for (let i = 0; i <= SEG; i++) {
      const a = (q * 90 + (i * 90) / SEG) * (Math.PI / 180), mid = (q * 90 + 45) * (Math.PI / 180);
      const nx = Math.cos(a), nz = Math.sin(a);
      foot.push({ x: Math.sign(Math.cos(mid)) * (A - RAD) + nx * RAD, z: Math.sign(Math.sin(mid)) * (A - RAD) + nz * RAD, nx, nz });
    }
    const N = foot.length;

    // Flock grain, drawn once.
    const grainCv = document.createElement("canvas"); grainCv.width = grainCv.height = 128;
    const gx = grainCv.getContext("2d");
    if (gx) {
      let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 9000; i++) { const v = rnd(); gx.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.3})` : `rgba(0,0,0,${(0.5 - v) * 0.46})`; gx.fillRect(rnd() * 128, rnd() * 128, 0.6 + rnd() * 0.7, 0.6 + rnd() * 0.7); }
    }
    const grain = ctx.createPattern(grainCv, "repeat");

    // One seeded number per facet so the stone sparkles the same way on every load.
    const fac: { k: number; p: number; fire: number }[] = [];
    { let seed = 5; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; for (let i = 0; i < 64; i++) fac.push({ k: 5 + rnd() * 9, p: rnd() * 6.28, fire: rnd() }); }

    const s = { th: OPEN_ANGLE, v: 0, drag: false, lx: -0.35, ly: 0.1, lxTo: -0.35, lyTo: 0.1, yaw: -0.22, thud: 0 };
    let Lx = 0, Ly = 1, Lz = 0, Vx = 0, Vy = 0, Vz = 1, cyw = 1, syw = 0, cth = 1, sth = 0;

    const P = (p: V3): V3 => {
      const xr = p[0] * cyw + p[2] * syw, zr = -p[0] * syw + p[2] * cyw;
      const d = zr * CP + p[1] * SP, k = (K * F) / (F - d);
      return [OX + xr * k, OY - (p[1] * CP - zr * SP) * k, d];
    };
    // Swing a point of the lid about the hinge along the back edge.
    const LID = (p: V3): V3 => [p[0], HB + (p[1] - HB) * cth + (p[2] + A) * sth, -A + (p[2] + A) * cth - (p[1] - HB) * sth];
    const LIDN = (n: V3): V3 => [n[0], n[1] * cth + n[2] * sth, n[2] * cth - n[1] * sth];
    const ID = (p: V3): V3 => p;
    const facing = (n: V3) => n[0] * Vx + n[1] * Vy + n[2] * Vz;
    const clamp = (v: number) => Math.max(0, Math.min(255, v)) | 0;
    // Velvet goes pale where you see it edge on and stays dark where you look straight into the pile.
    const velvet = (n: V3, add = 0) => {
      const ndl = Math.max(0, n[0] * Lx + n[1] * Ly + n[2] * Lz), edge = Math.pow(1 - Math.abs(facing(n)), 2.4);
      return 0.5 + 0.62 * ndl + 1.5 * edge + add;
    };
    const tone = (v: number) => `rgb(${clamp(VELVET[0] * v + Math.max(0, v - 1) * 34)},${clamp(VELVET[1] * v + Math.max(0, v - 1) * 40)},${clamp(VELVET[2] * v + Math.max(0, v - 1) * 40)})`;
    const path = (pts: V3[]) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); };
    const fill = (pts: V3[], style: string | CanvasGradient, flock = true) => {
      path(pts); ctx.fillStyle = style; ctx.fill(); ctx.lineWidth = 0.7; ctx.strokeStyle = style; ctx.stroke();
      if (flock && grain) { ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = grain; ctx.fill(); ctx.restore(); }
    };
    const lin = (a: V3, b: V3, stops: [number, string][]) => { const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]); for (const [o, c] of stops) g.addColorStop(o, c); return g; };
    const ring = (y: number, inset: number, T: (p: V3) => V3) => foot.map((f) => P(T([f.x - f.nx * inset, y, f.z - f.nz * inset])));
    const gold = (a: V3, b: V3) => lin(a, b, [[0, "#6d4710"], [0.22, "#e9c46a"], [0.4, "#fff6d2"], [0.55, "#c9953a"], [0.8, "#7a5215"], [1, "#e2b85c"]]);

    // The upright walls of either half: one strip per edge of the footprint, lit by its own normal.
    const walls = (y0: number, y1: number, T: (p: V3) => V3, TN: (n: V3) => V3, bevel: number) => {
      for (let i = 0; i < N; i++) {
        const a = foot[i], b = foot[(i + 1) % N];
        const n = TN([(a.nx + b.nx) / 2, 0, (a.nz + b.nz) / 2]);
        if (facing(n) <= 0.001) continue;
        const p0 = P(T([a.x, y0, a.z])), p1 = P(T([b.x, y0, b.z])), p2 = P(T([b.x, y1, b.z])), p3 = P(T([a.x, y1, a.z]));
        const v = velvet(n);
        fill([p0, p1, p2, p3], lin(p3, p0, [[0, tone(v + 0.2)], [0.12, tone(v)], [0.8, tone(v - 0.1)], [1, tone(v - 0.3)]]));
        if (bevel) {
          const nb = TN([n[0] * 0.7, 0.7, n[2] * 0.7]);
          const q2 = P(T([b.x - b.nx * bevel, y1 + bevel, b.z - b.nz * bevel])), q3 = P(T([a.x - a.nx * bevel, y1 + bevel, a.z - a.nz * bevel]));
          fill([p3, p2, q2, q3], tone(velvet(nb, 0.16)));
        }
      }
    };

    const drawLid = () => {
      const up = LIDN([0, 1, 0]), down: V3 = [-up[0], -up[1], -up[2]];
      // outside
      walls(HB, HB + HL - 7, LID, LIDN, 7);
      if (facing(up) > 0.001) {
        const top = ring(HB + HL, 7, LID), v = velvet(up);
        const b = P(LID([0, HB + HL, -A])), f = P(LID([0, HB + HL, A]));
        fill(top, lin(b, f, [[0, tone(v + 0.26)], [0.5, tone(v)], [1, tone(v - 0.12)]]));
        // a soft bloom where the lamp lands on the pile
        const c = P(LID([Lx * 60, HB + HL, -Lz * 30]));
        const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], 150);
        g.addColorStop(0, "rgba(190,255,235,0.16)"); g.addColorStop(1, "rgba(190,255,235,0)");
        path(top); ctx.fillStyle = g; ctx.fill();
      }
      if (facing(down) <= 0.001) return;
      // inside, seen through the mouth of the lid
      const mouthIn = ring(HB, WALL, LID), mouthOut = ring(HB, 0, LID);
      const yT = HB + HL - 8;
      ctx.save(); path(mouthIn); ctx.clip();
      const inner = ring(yT, WALL, LID);
      const b = P(LID([0, yT, -A])), f = P(LID([0, yT, A]));
      fill(inner, lin(b, f, [[0, "#cfc4b0"], [0.2, "#ece4d5"], [0.55, "#fbf6ec"], [0.86, "#e6dccb"], [1, "#c2b6a1"]]), false);
      // satin: a broad sheen that slides as the lamp moves, and a pillowed middle
      const c = P(LID([Lx * 70, yT, 10 + Ly * 40]));
      const sh = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], 170);
      sh.addColorStop(0, "rgba(255,255,255,0.75)"); sh.addColorStop(0.5, "rgba(255,255,255,0.12)"); sh.addColorStop(1, "rgba(120,100,70,0.2)");
      path(inner); ctx.fillStyle = sh; ctx.fill();
      for (let i = 0; i < N; i++) {
        const a0 = foot[i], b0 = foot[(i + 1) % N];
        const n = LIDN([-(a0.nx + b0.nx) / 2, 0, -(a0.nz + b0.nz) / 2]);
        if (facing(n) <= 0.001) continue;
        const lit = 0.55 + 0.45 * Math.max(0, n[0] * Lx + n[1] * Ly + n[2] * Lz);
        const p0 = P(LID([a0.x - a0.nx * WALL, HB, a0.z - a0.nz * WALL])), p1 = P(LID([b0.x - b0.nx * WALL, HB, b0.z - b0.nz * WALL]));
        const p2 = P(LID([b0.x - b0.nx * WALL, yT, b0.z - b0.nz * WALL])), p3 = P(LID([a0.x - a0.nx * WALL, yT, a0.z - a0.nz * WALL]));
        fill([p0, p1, p2, p3], lin(p0, p3, [[0, `rgb(${clamp(236 * lit)},${clamp(228 * lit)},${clamp(212 * lit)})`], [1, `rgb(${clamp(176 * lit)},${clamp(166 * lit)},${clamp(148 * lit)})`]]), false);
      }
      // foil stamp, set in the plane of the lining
      const o = P(LID([0, yT, 0])), ux = P(LID([1, yT, 0])), uz = P(LID([0, yT, 1]));
      ctx.save();
      ctx.transform(ux[0] - o[0], ux[1] - o[1], -(uz[0] - o[0]), -(uz[1] - o[1]), o[0], o[1]);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const spaced = (text: string, y: number, size: number, gap: number, weight: number) => {
        ctx.font = `${weight} ${size}px "Didot","Bodoni MT","Playfair Display",Georgia,"Times New Roman",serif`;
        const w = [...text].reduce((t, ch) => t + ctx.measureText(ch).width + gap, -gap);
        let x = -w / 2;
        const foil = ctx.createLinearGradient(-w / 2 + Lx * 60, 0, w / 2 + Lx * 60, 0);
        foil.addColorStop(0, "#8a6420"); foil.addColorStop(0.35, "#c9a04a"); foil.addColorStop(0.5, "#f1dc9a"); foil.addColorStop(0.65, "#b58a34"); foil.addColorStop(1, "#8a6420");
        for (const ch of text) { const cw = ctx.measureText(ch).width; ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillText(ch, x + cw / 2, y + 0.5); ctx.fillStyle = foil; ctx.fillText(ch, x + cw / 2, y); x += cw + gap; }
      };
      spaced(piece.maker, -8, 13.5, 4.2, 500);
      spaced(piece.makerLine, 11, 6.5, 3.4, 600);
      ctx.fillStyle = "#b58a34"; ctx.fillRect(-13, 1.6, 26, 0.6);
      ctx.restore();
      ctx.restore();
      // the velvet lip round the mouth and the thin brass frame
      const v = velvet(down, 0.1);
      path(mouthOut); path2(mouthIn); ctx.fillStyle = tone(v); ctx.fill("evenodd");
      if (grain) { ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = grain; ctx.fill("evenodd"); ctx.restore(); }
      ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(226,190,110,0.85)"; path(mouthIn); ctx.stroke();
    };
    const path2 = (pts: V3[]) => { pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); };

    const drawBase = () => {
      walls(0, HB, ID, ID, 0);
      // brass press stud on the front
      const stud = P([0, HB - 15, A]);
      if (Vz > 0) {
        const r = 5.2 * K;
        ctx.beginPath(); ctx.ellipse(stud[0], stud[1] + 1.4, r + 1, r + 1, 0, 0, 6.3); ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fill();
        const g = ctx.createRadialGradient(stud[0] - r * 0.35 + Lx * 2, stud[1] - r * 0.4, 0.5, stud[0], stud[1], r);
        g.addColorStop(0, "#fff8dc"); g.addColorStop(0.35, "#e3bb5e"); g.addColorStop(0.8, "#8b5f17"); g.addColorStop(1, "#5a3b0b");
        ctx.beginPath(); ctx.arc(stud[0], stud[1], r, 0, 6.3); ctx.fillStyle = g; ctx.fill();
      }
      const out = ring(HB, 0, ID), inn = ring(HB, WALL, ID);
      const v = velvet([0, 1, 0]);
      path(out); path2(inn); ctx.fillStyle = tone(v + 0.1); ctx.fill("evenodd");
      if (grain) { ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = grain; ctx.fill("evenodd"); ctx.restore(); }
      // cushion: two rolls of suede that meet at the slot
      const yP = HB - 3;
      ctx.save(); path(inn); ctx.clip();
      const mid = P([0, yP, 0]), fr = P([0, yP, A - WALL]), bk = P([0, yP, -A + WALL]);
      const roll: [number, string][] = [[0, "#a59a86"], [0.04, "#d9d0bf"], [0.16, "#f3ede1"], [0.45, "#fbf8f0"], [0.82, "#ece4d6"], [1, "#c4b9a5"]];
      const cut = [P([-A, yP, 0]), P([A, yP, 0])];
      ctx.save(); path([cut[0], cut[1], P([A, yP, A]), P([-A, yP, A])]); ctx.clip(); path(inn); ctx.fillStyle = lin(mid, fr, roll); ctx.fill(); ctx.restore();
      ctx.save(); path([cut[0], cut[1], P([A, yP, -A]), P([-A, yP, -A])]); ctx.clip(); path(inn); ctx.fillStyle = lin(mid, bk, roll); ctx.fill(); ctx.restore();
      const l = P([-A + WALL, yP, 0]), r = P([A - WALL, yP, 0]);
      path(inn); ctx.fillStyle = lin(l, r, [[0, "rgba(80,66,44,0.42)"], [0.14, "rgba(80,66,44,0)"], [0.86, "rgba(80,66,44,0)"], [1, "rgba(80,66,44,0.42)"]]); ctx.fill();
      // the lamp pools on the suede
      const pool = P([Lx * 55, yP, 30 - Lz * 20]);
      const pg = ctx.createRadialGradient(pool[0], pool[1], 0, pool[0], pool[1], 120);
      pg.addColorStop(0, "rgba(255,255,255,0.42)"); pg.addColorStop(1, "rgba(255,255,255,0)");
      path(inn); ctx.fillStyle = pg; ctx.fill();
      if (grain) { ctx.globalAlpha = 0.14; ctx.fillStyle = grain; ctx.fill(); ctx.globalAlpha = 1; }
      ctx.lineCap = "round"; ctx.lineWidth = 2.2; ctx.strokeStyle = "rgba(52,42,26,0.78)";
      ctx.beginPath(); ctx.moveTo(P([-64, yP, 0])[0], P([-64, yP, 0])[1]); ctx.lineTo(P([64, yP, 0])[0], P([64, yP, 0])[1]); ctx.stroke();
      // shade from the lid when it hangs over the cushion
      const cover = Math.max(0, 1 - s.th / 1.1);
      if (cover > 0) { path(inn); ctx.fillStyle = `rgba(20,24,20,${cover * 0.72})`; ctx.fill(); }
      ctx.restore();
      ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(226,190,110,0.9)"; path(inn); ctx.stroke();
    };

    const drawRing = () => {
      const yP = HB - 3, cB = RING * 0.36;
      const cT = Math.cos(TAU), sT = Math.sin(TAU);
      const W = (a: number, b: number, c = 0): V3 => [a, yP + b * cT - c * sT, b * sT + c * cT]; // c runs toward you, square to the ring
      const lightDim = Math.min(1, 0.25 + s.th / 0.9);
      // shadow of the ring on the cushion
      const sp = P([-Lx * 26, yP, 12 - Lz * 8]);
      ctx.save(); ctx.translate(sp[0], sp[1]); ctx.scale(1, 0.34);
      const sg = ctx.createRadialGradient(0, 0, 4, 0, 0, 62);
      sg.addColorStop(0, "rgba(46,36,22,0.5)"); sg.addColorStop(1, "rgba(46,36,22,0)");
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, 62, 0, 6.3); ctx.fill(); ctx.restore();

      const centre = P(W(0, cB));
      const arc = (rad: number, from = -0.1) => {
        ctx.beginPath(); let first = true;
        for (let i = 0; i <= 64; i++) {
          const t = (i / 64) * Math.PI * 2, b = cB + Math.sin(t) * rad;
          if (b < from) { first = true; continue; }
          const p = P(W(Math.cos(t) * rad, b));
          if (first) { ctx.moveTo(p[0], p[1]); first = false; } else ctx.lineTo(p[0], p[1]);
        }
      };
      const la = Math.atan2(-Ly * 0.6 - 0.6, Lx);
      ctx.lineCap = "butt";
      const w = TUBE * 2 * K;
      arc(RING); ctx.lineWidth = w + 1.6; ctx.strokeStyle = "#4a2f07"; ctx.stroke();
      if (typeof ctx.createConicGradient === "function") {
        const cg = ctx.createConicGradient(la, centre[0], centre[1]);
        const stops: [number, string][] = [[0, "#fff7d6"], [0.05, "#f0cf7c"], [0.13, "#b9842a"], [0.2, "#7b5010"], [0.3, "#d8ac50"], [0.38, "#fbe9ae"], [0.46, "#a8741f"], [0.56, "#6e470d"], [0.66, "#c99b40"], [0.74, "#f6dc92"], [0.82, "#9a6a1b"], [0.9, "#d2a548"], [1, "#fff7d6"]];
        for (const [o, c] of stops) cg.addColorStop(o, c);
        ctx.strokeStyle = cg;
      } else ctx.strokeStyle = "#d8ac50";
      arc(RING); ctx.lineWidth = w; ctx.stroke();
      arc(RING - TUBE * 0.62); ctx.lineWidth = w * 0.26; ctx.strokeStyle = "rgba(70,40,4,0.55)"; ctx.stroke();
      arc(RING + TUBE * 0.36); ctx.lineWidth = w * 0.17; ctx.strokeStyle = "rgba(255,252,236,0.82)"; ctx.stroke();
      if (lightDim < 1) { arc(RING); ctx.lineWidth = w + 1.6; ctx.strokeStyle = `rgba(14,20,16,${(1 - lightDim) * 0.7})`; ctx.stroke(); }

      // the head: a tapered collet and four claws
      const gb = cB + RING + TUBE + 10.5; // height of the girdle above the slot
      const G = (u: number, v2: number, h: number): V3 => W(u, gb + h, v2);
      const c0 = P(G(-5, 0, -10.6)), c1 = P(G(5, 0, -10.6)), c2 = P(G(GEM * 0.82, 0, -0.5)), c3 = P(G(-GEM * 0.82, 0, -0.5));
      path([c0, c1, c2, c3]); ctx.fillStyle = gold(c3, c2); ctx.fill();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(60,36,4,0.7)"; ctx.stroke();
      const claws = [45, 135, 225, 315].map((d) => { const a = (d * Math.PI) / 180; return { u: Math.cos(a), v: Math.sin(a) }; });
      const claw = (c: { u: number; v: number }) => {
        const a = P(G(c.u * GEM * 0.62, c.v * GEM * 0.62, -6.5)), b = P(G(c.u * GEM * 1.02, c.v * GEM * 1.02, -0.4)), t = P(G(c.u * GEM * 0.9, c.v * GEM * 0.9, 3.6));
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(t[0], t[1]);
        ctx.lineWidth = 3.4 * K; ctx.strokeStyle = "#5a3b0b"; ctx.stroke();
        ctx.lineWidth = 2.3 * K; ctx.strokeStyle = "#d9ae54"; ctx.stroke();
        ctx.lineWidth = 0.7 * K; ctx.strokeStyle = "rgba(255,250,225,0.85)"; ctx.stroke();
      };
      claws.filter((c) => c.v < 0).forEach(claw);

      // the stone: 33 crown facets, each flashing on its own schedule as the lamp moves
      const pt = (ang: number, rad: number, h: number) => G(Math.cos(ang) * rad, Math.sin(ang) * rad, h);
      const T: V3[] = [], S: V3[] = [], Gd: V3[] = [];
      for (let i = 0; i < 8; i++) { T.push(pt((i * Math.PI) / 4, GEM * 0.56, 7.4)); S.push(pt(((i + 0.5) * Math.PI) / 4, GEM * 0.8, 4)); }
      for (let i = 0; i < 16; i++) Gd.push(pt((i * Math.PI) / 8, GEM, 0));
      const facets: V3[][] = [];
      for (let i = 0; i < 8; i++) {
        const j = (i + 1) % 8;
        facets.push([T[i], T[j], S[i]]);
        facets.push([T[i], S[i], Gd[(2 * i + 1) % 16], Gd[2 * i]]);
        facets.push([T[i], Gd[2 * i], Gd[(2 * i + 15) % 16], S[(i + 7) % 8]]);
        facets.push([S[i], T[j], Gd[(2 * i + 2) % 16], Gd[(2 * i + 1) % 16]]);
      }
      const tc = G(0, 0, 7.4);
      for (let i = 0; i < 8; i++) {
        const j = (i + 1) % 8, m: V3 = [(T[i][0] + T[j][0]) / 2, (T[i][1] + T[j][1]) / 2, (T[i][2] + T[j][2]) / 2];
        facets.push([tc, T[i], m]); facets.push([tc, m, T[j]]);
      }
      const girdle = Gd.map(P);
      path(girdle); ctx.fillStyle = "#10151f"; ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = "rgba(150,170,200,0.9)"; ctx.stroke();
      const drive = Lx * 2.3 + Ly * 1.7 + s.yaw * 4;
      let best = 0, bx = 0, by = 0;
      facets.forEach((f, i) => {
        const q = f.map(P), fc = fac[i];
        const wave = 0.5 + 0.5 * Math.sin(fc.k * drive + fc.p);
        const bright = Math.pow(wave, 2.1) * lightDim;
        let r = 44 + 211 * bright, g = 54 + 201 * bright, b = 74 + 181 * bright;
        if (fc.fire < 0.34 && wave > 0.35) {
          const hue = fc.p + wave * 7, mix = 0.24 * Math.sin(Math.min(1, (wave - 0.35) * 1.6) * Math.PI);
          r += (128 + 127 * Math.sin(hue) - r) * mix; g += (128 + 127 * Math.sin(hue + 2.1) - g) * mix; b += (128 + 127 * Math.sin(hue + 4.2) - b) * mix;
        }
        const col = `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
        path(q); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 0.45; ctx.strokeStyle = "rgba(235,244,255,0.42)"; ctx.stroke();
        if (bright > best) { best = bright; bx = q.reduce((t, p) => t + p[0], 0) / q.length; by = q.reduce((t, p) => t + p[1], 0) / q.length; }
      });
      // the table also mirrors the lamp as one soft pane
      const tab = T.map(P), tcp = P(tc);
      ctx.save(); path(tab); ctx.clip();
      const pane = ctx.createLinearGradient(tcp[0] - 16 + Lx * 14, tcp[1] - 12, tcp[0] + 10 + Lx * 14, tcp[1] + 12);
      pane.addColorStop(0, "rgba(255,255,255,0)"); pane.addColorStop(0.45, `rgba(255,255,255,${0.5 * lightDim})`); pane.addColorStop(0.55, `rgba(255,255,255,${0.1 * lightDim})`); pane.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = pane; ctx.fillRect(tcp[0] - 40, tcp[1] - 40, 80, 80); ctx.restore();
      path(girdle); ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(210,225,245,0.75)"; ctx.stroke();
      claws.filter((c) => c.v >= 0).forEach(claw);
      claws.forEach((c) => {
        const t = P(G(c.u * GEM * 0.9, c.v * GEM * 0.9, 3.9)), r = 2.5 * K;
        const g = ctx.createRadialGradient(t[0] - r * 0.35, t[1] - r * 0.4, 0.3, t[0], t[1], r);
        g.addColorStop(0, "#fffbe6"); g.addColorStop(0.4, "#e2b95c"); g.addColorStop(1, "#6a450e");
        ctx.beginPath(); ctx.arc(t[0], t[1], r, 0, 6.3); ctx.fillStyle = g; ctx.fill();
      });
      // the flash itself spills past the stone
      if (best > 0.55) {
        const a = (best - 0.55) / 0.45;
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const bl = ctx.createRadialGradient(bx, by, 0, bx, by, 34 * K);
        bl.addColorStop(0, `rgba(255,255,255,${0.95 * a})`); bl.addColorStop(0.14, `rgba(235,244,255,${0.42 * a})`); bl.addColorStop(1, "rgba(220,235,255,0)");
        ctx.fillStyle = bl; ctx.beginPath(); ctx.arc(bx, by, 34 * K, 0, 6.3); ctx.fill();
        ctx.translate(bx, by); ctx.scale(1, 0.035);
        const st = ctx.createRadialGradient(0, 0, 0, 0, 0, 60 * K);
        st.addColorStop(0, `rgba(255,255,255,${0.5 * a})`); st.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = st; ctx.beginPath(); ctx.arc(0, 0, 60 * K, 0, 6.3); ctx.fill();
        ctx.restore();
      }
    };

    const drawShadow = () => {
      // The box and its lid thrown onto the table along the lamp's direction.
      const drop = (p: V3): V3 => { const k = p[1] / Math.max(0.35, Ly); return P([p[0] - Lx * k, 0, p[2] - Lz * k]); };
      const shade = (pts: V3[], blur: number, alpha: number) => {
        ctx.save(); ctx.shadowColor = `rgba(46,34,20,${alpha})`; ctx.shadowBlur = blur * scale; ctx.shadowOffsetX = 3000 * scale; ctx.translate(-3000, 0);
        path(pts); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      };
      shade(foot.map((f) => P([f.x * 1.04 - Lx * 8, 0, f.z * 1.03 + 7])), 13, 0.85);
      shade(foot.map((f) => P([f.x * 1.2 - Lx * 20, 0, f.z * 1.16 + 6])), 46, 0.3);
      shade(foot.map((f) => drop([f.x, HB, f.z])), 26, 0.46);
      shade(foot.map((f) => drop(LID([f.x, HB + HL, f.z]))), 34, 0.3);
      shade(foot.map((f) => drop(LID([f.x, HB, f.z]))), 34, 0.22);
    };

    const draw = () => {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, VW, VH);
      cyw = Math.cos(s.yaw); syw = Math.sin(s.yaw); cth = Math.cos(s.th); sth = Math.sin(s.th);
      Vx = -syw * CP; Vy = SP; Vz = cyw * CP;
      const lx = -0.5 + s.lx * 0.75, ly = 0.95 + s.ly * 0.2, lz = 0.62, ll = Math.hypot(lx, ly, lz);
      Lx = lx / ll; Ly = ly / ll; Lz = lz / ll;
      ctx.save(); ctx.translate(0, s.thud);
      drawShadow();
      if (s.th > 0.86) { drawLid(); drawBase(); drawRing(); }
      else { drawBase(); if (s.th > 0.02) drawRing(); drawLid(); }
      ctx.restore();
    };

    const fit = () => {
      const w = cv.clientWidth; if (!w) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round(((w * VH) / VW) * dpr); scale = cv.width / VW; draw();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 4200, dragY = 0, dragTh = 0, moved = 0;
    const want = () => (openRef.current ? OPEN_ANGLE : 0);
    const setWant = (o: boolean) => { if (openRef.current !== o) { openRef.current = o; setOpen(o); } };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (!s.drag) {
        // A sprung hinge: it throws the lid open, and pulls it shut onto a hard stop.
        const target = want();
        s.v += ((target > 0 ? 150 : 210) * (target - s.th) - (target > 0 ? 9.5 : 13) * s.v) * dt; s.th += s.v * dt;
        if (s.th < 0) { if (s.v < -1.2) s.thud = 2.2; s.th = 0; s.v = -s.v * 0.24; }
      }
      s.thud *= Math.pow(0.0005, dt);
      if (now - touched > 6000) {
        s.lxTo = Math.sin(t / 1300) * 0.85; s.lyTo = Math.cos(t / 1900) * 0.5;
        if (t > nextDemo && !s.drag) { const o = !openRef.current; setWant(o); nextDemo = t + (o ? 5200 : 1500); }
      }
      s.lx += (s.lxTo - s.lx) * Math.min(1, dt * 5); s.ly += (s.lyTo - s.ly) * Math.min(1, dt * 5);
      s.yaw = -0.22 + s.lx * 0.09;
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { s.th = want(); s.v = 0; s.lx = s.lxTo; s.ly = s.lyTo; s.yaw = -0.22 + s.lx * 0.09; draw(); };

    api.current = { toggle: () => { touched = performance.now(); setWant(!openRef.current); if (reduce) still(); else wake(); } };

    const onDown = (e: PointerEvent) => { touched = performance.now(); s.drag = true; dragY = e.clientY; dragTh = s.th; moved = 0; pad.setPointerCapture(e.pointerId); wake(); };
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      s.lxTo = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1)); s.lyTo = Math.max(-1, Math.min(1, ((e.clientY - b.top) / b.height) * 2 - 1));
      touched = Math.max(touched, performance.now() - 2500);
      if (s.drag) {
        touched = performance.now();
        const dy = dragY - e.clientY; moved = Math.max(moved, Math.abs(dy));
        const next = Math.max(0, Math.min(OPEN_ANGLE + 0.12, dragTh + (dy / Math.max(120, b.height * 0.36)) * OPEN_ANGLE));
        s.v = (next - s.th) * 30; s.th = next;
      }
      if (reduce) { if (s.drag) { s.lx = s.lxTo; s.ly = s.lyTo; draw(); } else still(); }
    };
    const onUp = () => {
      if (!s.drag) return;
      s.drag = false; touched = performance.now();
      if (moved < 5) setWant(!openRef.current); // a plain press works the catch
      else setWant(s.th + s.v * 0.08 > 0.62);
      if (reduce) still();
    };
    pad.addEventListener("pointerdown", onDown);
    pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp);
    pad.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(fit); ro.observe(cv);
    const io = new IntersectionObserver(([en]) => { seen = en.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    fit();
    if (reduce) still(); else wake();
    return () => {
      cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect();
      pad.removeEventListener("pointerdown", onDown); pad.removeEventListener("pointermove", onMove);
      pad.removeEventListener("pointerup", onUp); pad.removeEventListener("pointercancel", onUp);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <section className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#e7e1d7] bg-[radial-gradient(90%_70%_at_50%_42%,#f6f2ea_0%,#e7e1d7_58%,#d6cec1_100%)] px-4 py-10 sm:min-h-[720px]">
      <div className="relative w-full max-w-[570px]">
        <canvas ref={canvas} aria-hidden="true" className="block w-full" style={{ aspectRatio: `${VW} / ${VH}` }} />
        <button
          ref={hit}
          type="button"
          aria-pressed={open}
          aria-label={`Ring box holding the ${piece.name}. ${open ? "Open. Press to close the lid." : "Closed. Press to open the lid."}`}
          onClick={(e) => { if (e.detail === 0) api.current?.toggle(); }}
          className="absolute inset-[6%] cursor-pointer touch-none rounded-[32px] outline-none transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-[#0f3a31] focus-visible:ring-offset-4 focus-visible:ring-offset-[#e7e1d7] motion-reduce:transition-none"
        />
      </div>
      <p className="pointer-events-none absolute bottom-5 left-5 text-[#3b352b] sm:bottom-8 sm:left-8">
        <span className="block font-serif text-[17px] italic leading-tight text-[#1d1a14]">{piece.name}</span>
        <span className="mt-1 block font-mono text-[10.5px] uppercase tracking-[0.18em]">{piece.detail}</span>
        <span className="mt-1 block font-mono text-[10.5px] uppercase tracking-[0.18em]">
          <span className="text-[#1d1a14]">{piece.price}</span>
          <span className="mx-2 text-[#8d8474]">/</span>
          {open ? "Press the box to shut it" : "Press the box to open it"}
        </span>
      </p>
    </section>
  );
}
