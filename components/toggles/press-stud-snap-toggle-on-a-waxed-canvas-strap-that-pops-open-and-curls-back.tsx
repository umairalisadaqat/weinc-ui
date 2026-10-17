import { useEffect, useRef, useState } from "react";

// The setting this switch controls, and the two words woven and printed on the strap.
const SETTING = "Notifications";
const WORD_ON = "ON"; // on the label sewn to the tab, seen when it is fastened
const WORD_OFF = "OFF"; // printed on the webbing underneath, seen when the tab is up
const TAB: [number, number, number] = [214, 98, 36]; // waxed canvas of the tab
const LINING: [number, number, number] = [232, 190, 74]; // its inside face
const WEB: [number, number, number] = [30, 40, 62]; // the webbing it is sewn to
const THREAD = "#f1e6cf";

// World units. The strap lies along x, y runs across it, z is up off the table.
const BASE_L = 380, BASE_W = 104, TAB_L = 280, TAB_W = 66, SEWN = 70, FREE = TAB_L - SEWN, STUD_S = 256, TH = 3.4;
const VW = 450, VH = 336; // the drawing is made for this box and scaled to fit
const YAW = -0.42, EL = 0.9; // camera: turned a little to the right, looking down at about 52 degrees
const TS = 4; // texture pixels per world unit
const LIGHT = (() => { const v = [0.4, -0.3, 0.86], n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; })();
const CAM = [-Math.cos(EL) * Math.sin(YAW), -Math.cos(EL) * Math.cos(YAW), Math.sin(EL)];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function PressStudSnapToggle() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const api = useRef<{ set: (on: boolean) => void } | null>(null);
  const [on, setOn] = useState(true);
  const onRef = useRef(true);

  useEffect(() => {
    const cv = canvas.current, wrap = box.current;
    if (!cv || !wrap) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let k = 1;

    // ---- Cloth and hardware are painted once into flat textures, then bent in the frame loop. ----
    let seed = 5;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const sheet = (wu: number, hu: number) => { const c = document.createElement("canvas"); c.width = Math.round(wu * TS); c.height = Math.round(hu * TS); return c; };
    const woven = (c: HTMLCanvasElement, col: [number, number, number], p: number, ribbed: boolean) => {
      const x = c.getContext("2d");
      if (!x) return;
      const im = x.createImageData(c.width, c.height);
      for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
        const fx = (i % p) / p, fy = (j % p) / p, over = (Math.floor(i / p) + Math.floor(j / p)) & 1;
        const bump = ribbed
          ? Math.pow(Math.sin(Math.PI * (((j + (Math.floor(i / (p * 2)) & 1) * p * 0.5) % p) / p)), 0.6) * (0.8 + 0.2 * Math.sin(Math.PI * (((i % (p * 2)) / (p * 2)))))
          : Math.pow(Math.sin(Math.PI * (over ? fx : fy)), 0.55) * (0.72 + 0.28 * Math.sin(Math.PI * (over ? fy : fx)));
        const cloud = Math.sin(i / 47 + 1) * Math.sin(j / 31 + 2) * 0.04;
        const v = (ribbed ? 0.62 : 0.72) + (ribbed ? 0.5 : 0.32) * bump + (rand() - 0.5) * 0.09 + cloud, o = (j * c.width + i) * 4;
        im.data[o] = clamp(col[0] * v, 0, 255); im.data[o + 1] = clamp(col[1] * v, 0, 255); im.data[o + 2] = clamp(col[2] * v, 0, 255); im.data[o + 3] = 255;
      }
      x.putImageData(im, 0, 0);
    };
    const pen = (c: HTMLCanvasElement) => { const x = c.getContext("2d"); if (x) x.setTransform(TS, 0, 0, TS, 0, 0); return x; };
    // Trim a finished texture to its outline, so nothing painted on it spills past the rounded ends.
    const cut = (x: CanvasRenderingContext2D, shape: (x: CanvasRenderingContext2D) => void) => {
      x.shadowColor = "transparent"; x.globalCompositeOperation = "destination-in"; x.fillStyle = "#000"; shape(x); x.fill(); x.globalCompositeOperation = "source-over";
    };
    const stitch = (x: CanvasRenderingContext2D, path: () => void) => {
      x.setLineDash([4.4, 2.6]); x.lineCap = "butt"; x.lineWidth = 1.5;
      x.save(); x.translate(0.5, 0.7); x.strokeStyle = "rgba(0,0,0,0.45)"; path(); x.stroke(); x.restore();
      x.strokeStyle = THREAD; path(); x.stroke();
      x.lineWidth = 0.5; x.strokeStyle = "rgba(255,255,255,0.55)"; x.save(); x.translate(-0.2, -0.4); path(); x.stroke(); x.restore();
      x.setLineDash([]);
    };
    const nickel = (x: CanvasRenderingContext2D, cx: number, cy: number, r: number, hx: number, hy: number) => {
      const g = x.createRadialGradient(cx + hx, cy + hy, r * 0.05, cx, cy, r);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.22, "#e9edf0"); g.addColorStop(0.55, "#a9b1b8"); g.addColorStop(0.8, "#6c747c"); g.addColorStop(0.93, "#c3cad0"); g.addColorStop(1, "#4d545b");
      return g;
    };
    const tabShape = (x: CanvasRenderingContext2D) => { x.beginPath(); x.roundRect(0, 0, TAB_L, TAB_W, [5, 30, 30, 5]); };
    const baseShape = (x: CanvasRenderingContext2D) => { x.beginPath(); x.roundRect(0, 0, BASE_L, BASE_W, 15); };

    const front = sheet(TAB_L, TAB_W), back = sheet(TAB_L, TAB_W), base = sheet(BASE_L, BASE_W);
    const baseDark = sheet(BASE_L, BASE_W);
    woven(front, TAB, 8, false); woven(back, LINING, 6, false); woven(base, WEB, 12, true);
    const dx = baseDark.getContext("2d");
    if (dx) { dx.setTransform(TS, 0, 0, TS, 0, 0); dx.fillStyle = "#0b101b"; baseShape(dx); dx.fill(); }
    const fx = pen(front);
    if (fx) {
      const mid = TAB_W / 2;
      // Wax wears pale along the edges and where the cloth is handled.
      const wear = fx.createLinearGradient(0, 0, 0, TAB_W);
      wear.addColorStop(0, "rgba(255,226,190,0.28)"); wear.addColorStop(0.12, "rgba(255,226,190,0)"); wear.addColorStop(0.88, "rgba(60,20,0,0)"); wear.addColorStop(1, "rgba(60,20,0,0.3)");
      fx.fillStyle = wear; fx.fillRect(0, 0, TAB_L, TAB_W);
      stitch(fx, () => { fx.beginPath(); fx.roundRect(6, 6, TAB_L - 12, TAB_W - 12, [3, 24, 24, 3]); });
      stitch(fx, () => { fx.beginPath(); fx.rect(12, 12, SEWN - 22, TAB_W - 24); fx.moveTo(12, 12); fx.lineTo(SEWN - 10, TAB_W - 12); fx.moveTo(SEWN - 10, 12); fx.lineTo(12, TAB_W - 12); });
      // The woven label.
      fx.save(); fx.translate(128, mid - 13); fx.shadowColor = "rgba(40,12,0,0.6)"; fx.shadowBlur = 3 * TS; fx.shadowOffsetY = 1 * TS;
      fx.fillStyle = "#efe6d0"; fx.fillRect(0, 0, 56, 26); fx.shadowColor = "transparent";
      fx.strokeStyle = "rgba(90,70,40,0.16)"; fx.lineWidth = 0.4; for (let y = 1; y < 26; y += 1.3) { fx.beginPath(); fx.moveTo(0, y); fx.lineTo(56, y); fx.stroke(); }
      fx.fillStyle = `rgb(${WEB[0]},${WEB[1]},${WEB[2]})`; fx.font = "800 15px ui-sans-serif, system-ui, -apple-system, Helvetica, Arial, sans-serif"; fx.textAlign = "center"; fx.textBaseline = "middle";
      fx.fillText(WORD_ON.split("").join("\u200a"), 28, 13.8);
      fx.setLineDash([2, 1.6]); fx.lineWidth = 1; fx.strokeStyle = "#b5482b"; for (const px of [3, 53]) { fx.beginPath(); fx.moveTo(px, 1.5); fx.lineTo(px, 24.5); fx.stroke(); }
      fx.setLineDash([]); fx.restore();
      // The cap of the press stud: a domed nickel button seen from the camera's side.
      fx.save(); fx.shadowColor = "rgba(40,12,0,0.75)"; fx.shadowBlur = 5 * TS; fx.shadowOffsetX = -2.2 * TS; fx.shadowOffsetY = 3 * TS;
      fx.fillStyle = "#3d444b"; fx.beginPath(); fx.arc(STUD_S, mid + 1.4, 13.2, 0, Math.PI * 2); fx.fill(); fx.restore();
      fx.fillStyle = nickel(fx, STUD_S, mid, 13, 4.5, -4.5); fx.beginPath(); fx.arc(STUD_S, mid, 13, 0, Math.PI * 2); fx.fill();
      fx.lineWidth = 0.8; fx.strokeStyle = "rgba(255,255,255,0.75)"; fx.beginPath(); fx.arc(STUD_S, mid, 10.4, -1.9, 0.3); fx.stroke();
      fx.strokeStyle = "rgba(30,36,42,0.5)"; fx.beginPath(); fx.arc(STUD_S, mid, 10.4, 1.1, 3.4); fx.stroke();
      fx.fillStyle = "rgba(255,255,255,0.9)"; fx.beginPath(); fx.ellipse(STUD_S + 4.6, mid - 4.8, 3.4, 2, -0.7, 0, Math.PI * 2); fx.fill();
      cut(fx, tabShape);
    }
    const bx = pen(back);
    if (bx) {
      const mid = TAB_W / 2;
      bx.strokeStyle = "rgba(120,80,10,0.35)"; bx.lineWidth = 1.2; for (let y = 9; y < TAB_W; y += 12) { bx.beginPath(); bx.moveTo(0, y); bx.lineTo(TAB_L, y); bx.stroke(); }
      stitch(bx, () => { bx.beginPath(); bx.roundRect(6, 6, TAB_L - 12, TAB_W - 12, [3, 24, 24, 3]); });
      // The socket: a pressed ring with a sprung hole that grips the stud.
      bx.save(); bx.shadowColor = "rgba(70,40,0,0.6)"; bx.shadowBlur = 4 * TS; bx.shadowOffsetY = 1.6 * TS;
      bx.fillStyle = nickel(bx, STUD_S, mid, 13, -4, -5); bx.beginPath(); bx.arc(STUD_S, mid, 13, 0, Math.PI * 2); bx.fill(); bx.restore();
      bx.fillStyle = "#59616a"; bx.beginPath(); bx.arc(STUD_S, mid, 8.6, 0, Math.PI * 2); bx.fill();
      bx.fillStyle = nickel(bx, STUD_S, mid, 8, 3, 3.5); bx.beginPath(); bx.arc(STUD_S, mid, 7.6, 0, Math.PI * 2); bx.fill();
      const hole = bx.createRadialGradient(STUD_S - 1, mid - 1.4, 0.5, STUD_S, mid, 5.4);
      hole.addColorStop(0, "#05070a"); hole.addColorStop(0.75, "#1b2026"); hole.addColorStop(1, "#6d757d");
      bx.fillStyle = hole; bx.beginPath(); bx.arc(STUD_S, mid, 5.2, 0, Math.PI * 2); bx.fill();
      bx.lineWidth = 0.7; bx.strokeStyle = "rgba(255,255,255,0.8)"; bx.beginPath(); bx.arc(STUD_S, mid, 12, 3.6, 5.6); bx.stroke();
      cut(bx, tabShape);
    }
    const gx = pen(base);
    if (gx) {
      const edge = gx.createLinearGradient(0, 0, 0, BASE_W);
      edge.addColorStop(0, "rgba(200,220,255,0.2)"); edge.addColorStop(0.1, "rgba(200,220,255,0)"); edge.addColorStop(0.9, "rgba(0,0,0,0)"); edge.addColorStop(1, "rgba(0,0,0,0.4)");
      gx.fillStyle = edge; gx.fillRect(0, 0, BASE_L, BASE_W);
      stitch(gx, () => { gx.beginPath(); gx.roundRect(7, 7, BASE_L - 14, BASE_W - 14, 9); });
      // The word under the tab, screen printed and a little worn.
      gx.font = "800 34px ui-sans-serif, system-ui, -apple-system, Helvetica, Arial, sans-serif"; gx.textAlign = "center"; gx.textBaseline = "middle";
      gx.fillStyle = "rgba(241,230,207,0.9)"; gx.fillText(WORD_OFF.split("").join("\u2009"), 202, BASE_W / 2 + 1.5);
      cut(gx, baseShape);
    }

    // Two working copies of the tab get relit every frame, so the shading runs smoothly along the bend with no seams.
    const litFront = sheet(TAB_L, TAB_W), litBack = sheet(TAB_L, TAB_W);
    const relight = (dst: HTMLCanvasElement, src: HTMLCanvasElement, tones: [number, number][]) => {
      const x = dst.getContext("2d");
      if (!x) return;
      x.globalCompositeOperation = "copy"; x.drawImage(src, 0, 0); x.globalCompositeOperation = "source-atop";
      const dark = x.createLinearGradient(0, 0, dst.width, 0), bright = x.createLinearGradient(0, 0, dst.width, 0);
      for (const [u, lam] of tones) {
        const tone = 0.46 + 0.66 * lam, at = clamp(u / TAB_L, 0, 1);
        dark.addColorStop(at, `rgba(8,6,10,${clamp((1 - tone) * 0.9, 0, 1).toFixed(3)})`);
        bright.addColorStop(at, `rgba(255,250,240,${clamp((tone - 1) * 0.55 + Math.pow(lam, 14) * 0.2, 0, 1).toFixed(3)})`);
      }
      x.fillStyle = dark; x.fillRect(0, 0, dst.width, dst.height); x.fillStyle = bright; x.fillRect(0, 0, dst.width, dst.height);
    };

    // ---- Camera ----
    const P = (x: number, y: number, z: number): [number, number] => {
      const xr = x * Math.cos(YAW) - y * Math.sin(YAW), yr = x * Math.sin(YAW) + y * Math.cos(YAW);
      return [(VW / 2 + 8 + xr) * k, (VH / 2 + 22 - yr * Math.sin(EL) - z * Math.cos(EL)) * k];
    };
    // Lay a slice of a flat texture onto the parallelogram a, b, c (far start, far end, near start).
    const lay = (tex: HTMLCanvasElement, u0: number, u1: number, a: number[], b: number[], c: number[], alpha = 1) => {
      const du = (u1 - u0) * TS, hh = tex.height;
      ctx.setTransform((b[0] - a[0]) / du, (b[1] - a[1]) / du, (c[0] - a[0]) / hh, (c[1] - a[1]) / hh, a[0], a[1]);
      ctx.globalAlpha = alpha; ctx.drawImage(tex, u0 * TS, 0, Math.min(du + 2, tex.width - u0 * TS), hh, 0, 0, Math.min(du + 2, tex.width - u0 * TS), hh); ctx.globalAlpha = 1;
    };

    const s = { a: 0, av: 0, target: 0, held: 0, m: 0, mv: 0, b: 0, bv: 0, press: 0 };
    const NS = 44;

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      const hw = BASE_W / 2, tw = TAB_W / 2, x0 = -BASE_L / 2, tabX = -152;

      // Webbing: its shadow on the table, six stacked silhouettes for its thickness, then the face.
      const baseAt = (z: number, tex: HTMLCanvasElement, alpha = 1) => lay(tex, 0, BASE_L, P(x0, hw, z), P(x0 + BASE_L, hw, z), P(x0, -hw, z), alpha);
      const ground = (blur: number, alpha: number, ox: number, oy: number) => {
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.save(); ctx.shadowColor = `rgba(20,28,44,${alpha})`; ctx.shadowBlur = blur * k; ctx.shadowOffsetX = 9000 + ox * k; ctx.shadowOffsetY = oy * k; ctx.translate(-9000, 0);
        ctx.beginPath();
        for (const [cx, cy, a0] of [[x0 + BASE_L - 15, hw - 15, 0], [x0 + 15, hw - 15, 1], [x0 + 15, -hw + 15, 2], [x0 + BASE_L - 15, -hw + 15, 3]])
          for (let j = 0; j <= 6; j++) { const an = (a0 + j / 6) * Math.PI * 0.5, q = P(cx + Math.cos(an) * 15, cy + Math.sin(an) * 15, -7); ctx.lineTo(q[0], q[1]); }
        ctx.closePath(); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      };
      ground(30, 0.36, -14, 20); ground(6, 0.55, -3, 4);
      for (let z = -6; z < 0; z += 1) baseAt(z, baseDark);
      baseAt(0, base);

      // The bent tab: walk along it adding up the bend, so it keeps its length whatever shape it takes.
      const pts: { x: number; z: number; f: number }[] = [{ x: tabX, z: TH, f: 0 }, { x: tabX + SEWN, z: TH, f: 0 }];
      let px = tabX + SEWN, pz = TH;
      for (let i = 1; i <= NS; i++) {
        const t = i / NS, sl = t * FREE, ds = FREE / NS;
        const f = Math.max(0, s.a) * (1 - Math.exp(-sl / 50)) + s.b * t * t + s.m * 0.045 * Math.sin(Math.PI * Math.min(1, sl / (STUD_S - SEWN))) * (sl < STUD_S - SEWN ? Math.cos(Math.PI * Math.min(1, sl / (STUD_S - SEWN))) : 0);
        px += Math.cos(f) * ds; pz += Math.sin(f) * ds;
        pts.push({ x: px, z: Math.max(TH - s.press, pz), f });
      }
      const sAt = (i: number) => (i === 0 ? 0 : SEWN + ((i - 1) / NS) * FREE);
      // Half the width of the tab at a point along it: full until the last stretch, then the rounded tip.
      const halfAt = (i: number) => { const d = sAt(i) - (TAB_L - 30); return d <= 0 ? tw : tw - 30 + Math.sqrt(Math.max(0, 900 - d * d)); };

      // Its shadow, thrown along the light onto the webbing and the table.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const cast = (blur: number, alpha: number, below: number) => {
        const low = pts.filter((p) => p.z < below);
        if (low.length < 2) return;
        ctx.save(); ctx.shadowColor = `rgba(10,14,26,${alpha})`; ctx.shadowBlur = blur * k; ctx.shadowOffsetX = 9000; ctx.translate(-9000, 0);
        ctx.beginPath();
        const down = (p: { x: number; z: number }, y: number) => { const q = (Math.max(0, p.z) + (below < 10 ? 5 : 0)) / LIGHT[2]; return P(p.x - LIGHT[0] * q, y - LIGHT[1] * q, 0); };
        low.forEach((p, i) => { const q = down(p, halfAt(pts.indexOf(p))); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
        for (let i = low.length - 1; i >= 0; i--) { const q = down(low[i], -halfAt(pts.indexOf(low[i]))); ctx.lineTo(q[0], q[1]); }
        ctx.closePath(); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      };
      cast(16, 0.2, 1e9); cast(7, 0.22, 60); cast(6, 0.5, 9); cast(2, 0.5, 9);

      // The stud riveted through the webbing.
      const studX = tabX + STUD_S, [sx, sy] = P(studX, 0, 0), ry = Math.sin(EL), up = Math.cos(EL) * k;
      ctx.setTransform(k, 0, 0, k, sx, sy);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 5 * k; ctx.shadowOffsetX = -3 * k; ctx.shadowOffsetY = 3 * k;
      ctx.fillStyle = nickel(ctx, 0, 0, 12.5, 4, -3); ctx.beginPath(); ctx.ellipse(0, -1.2 * up / k, 12.5, 12.5 * ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(40,46,54,0.55)"; ctx.beginPath(); ctx.ellipse(0, -1.2 * up / k, 9, 9 * ry, 0, 0, Math.PI * 2); ctx.stroke();
      const ph = 6.2 * Math.cos(EL), post = ctx.createLinearGradient(-6, 0, 6, 0);
      post.addColorStop(0, "#50575e"); post.addColorStop(0.3, "#9aa2a9"); post.addColorStop(0.62, "#f6f8f9"); post.addColorStop(0.82, "#b4bbc1"); post.addColorStop(1, "#5d646b");
      ctx.fillStyle = post; ctx.beginPath(); ctx.ellipse(0, -1.4, 6, 6 * ry, 0, 0, Math.PI); ctx.lineTo(-6.6, -1.4 - ph); ctx.ellipse(0, -1.4 - ph, 6.6, 6.6 * ry, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
      ctx.fillStyle = nickel(ctx, 0, -1.4 - ph, 6.6, 2, -1.5); ctx.beginPath(); ctx.ellipse(0, -1.4 - ph, 6.6, 6.6 * ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(40,46,54,0.5)"; ctx.beginPath(); ctx.ellipse(0, -1.2 - ph, 2.2, 2.2 * ry, 0, 0, Math.PI * 2); ctx.fill();

      // Tab segments, farthest from the camera first. Each shows its outside or its lining, whichever faces us.
      const order: number[] = [];
      for (let i = 0; i < pts.length - 1; i++) order.push(i);
      const depth = (i: number) => ((pts[i].x + pts[i + 1].x) / 2) * CAM[0] + ((pts[i].z + pts[i + 1].z) / 2) * CAM[2];
      order.sort((p, q) => depth(p) - depth(q));
      const outTone: [number, number][] = [], inTone: [number, number][] = [];
      pts.forEach((p, i) => { const l = -Math.sin(p.f) * LIGHT[0] + Math.cos(p.f) * LIGHT[2]; outTone.push([sAt(i), Math.max(0, l)]); inTone.push([sAt(i), Math.max(0, -l)]); });
      relight(litFront, front, outTone); relight(litBack, back, inTone);
      for (const i of order) {
        const p = pts[i], q = pts[i + 1], f = q.f, n = [-Math.sin(f), 0, Math.cos(f)];
        const facing = n[0] * CAM[0] + n[2] * CAM[2];
        const outside = facing >= 0;
        const a = P(p.x, tw, p.z), b = P(q.x, tw, q.z), c = P(p.x, -tw, p.z);
        const u0 = sAt(i), u1 = sAt(i + 1);
        lay(outside ? litFront : litBack, u0, u1, a, b, c);
        // Cut edge on the near side, which gives the cloth its thickness.
        const h0 = halfAt(i), h1 = halfAt(i + 1), c2 = P(p.x, -h0, p.z), d2 = P(q.x, -h1, q.z);
        const e0 = P(p.x + Math.sin(p.f) * TH, -h0, p.z - Math.cos(p.f) * TH), e1 = P(q.x + Math.sin(f) * TH, -h1, q.z - Math.cos(f) * TH);
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.moveTo(c2[0], c2[1]); ctx.lineTo(d2[0], d2[1]); ctx.lineTo(e1[0], e1[1]); ctx.lineTo(e0[0], e0[1]); ctx.closePath();
        ctx.fillStyle = `rgb(${(TAB[0] * 0.5) | 0},${(TAB[1] * 0.42) | 0},${(TAB[2] * 0.4) | 0})`; ctx.fill();
      }
    };

    let raf = 0, last = 0, seen = true, t0 = 0, touched = -1e9, demoAt = 750;
    const size = () => { const w = wrap.clientWidth; k = (w / VW) * dpr; cv.width = Math.round(VW * k); cv.height = Math.round(VH * k); };
    const OPEN = 1.98;
    const fire = (toOn: boolean) => {
      if (toOn) { s.target = 0; s.held = 0; }
      else { s.target = OPEN; s.held = 0.085; s.mv += 150; } // the cloth bulges for a moment while the stud still holds
    };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      if (now - touched > 7000 && t > demoAt) { const next = !onRef.current; onRef.current = next; setOn(next); fire(next); demoAt = t + (next ? 1900 : 3600); }
      const before = s.av;
      if (s.held > 0) { s.held -= dt; if (s.held <= 0) s.av = 11.5; } // released: it pops
      else if (s.target > 0) { s.av += (120 * (s.target - s.a) - 6.2 * s.av) * dt; s.a += s.av * dt; }
      else {
        s.av += (150 * (s.target - s.a) - 15 * s.av - 14) * dt; s.a += s.av * dt;
        if (s.a < 0) { if (s.av < -1.2) { s.press = 1.6; s.mv -= 60; } s.a = 0; s.av = -s.av * 0.18; }
      }
      s.mv += (-900 * s.m - 34 * s.mv) * dt; s.m += s.mv * dt;
      s.bv += (-210 * s.b - 9 * s.bv) * dt - (s.av - before) * 0.055; s.b += s.bv * dt;
      s.press *= Math.pow(0.0001, dt);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { s.a = s.target; s.av = 0; s.m = 0; s.mv = 0; s.b = 0; s.bv = 0; s.press = 0; s.held = 0; draw(); };

    size();
    if (reduce) settle(); else { draw(); wake(); }
    api.current = { set: (toOn) => { touched = performance.now(); fire(toOn); if (reduce) settle(); else wake(); } };

    const ro = new ResizeObserver(() => { size(); draw(); });
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const toggle = () => { const next = !onRef.current; onRef.current = next; setOn(next); api.current?.set(next); };

  return (
    <div className="flex min-h-[560px] w-full flex-col items-center justify-center overflow-hidden bg-[#d3dade] bg-[radial-gradient(80%_70%_at_60%_30%,#e9eef0_0%,#d3dade_55%,#bcc6cc_100%)] px-4 py-6 sm:min-h-[740px]">
      <div ref={box} className="relative aspect-[450/336] w-full max-w-[900px]">
        <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
        <button
          type="button" role="switch" aria-checked={on} aria-label={SETTING} onClick={toggle}
          className="absolute inset-x-[6%] inset-y-[8%] cursor-pointer rounded-[40px] outline-none focus-visible:ring-2 focus-visible:ring-[#1e283e]"
        />
      </div>
      <p aria-live="polite" className="mt-1 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-slate-600">
        <span className="text-slate-900">{SETTING}</span>
        <span className="mx-2 text-slate-400">/</span>
        {on ? "On, fastened" : "Off, undone"}
      </p>
    </div>
  );
}
