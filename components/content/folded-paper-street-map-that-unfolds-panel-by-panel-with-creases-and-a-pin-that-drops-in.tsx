import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/** What is printed on the cover and in the title box of the plan. */
const town = { name: "Quillhaven", sub: "Old Town and Harbour", edition: "Pocket plan No. 4", scale: "1 : 7 500" };

/** Where the pin can land. x and y are fractions of the open sheet, measured from its top left corner. */
const places = [
  { id: "lantern", name: "Lantern Coffee Roasters", note: "Open from seven", x: 0.165, y: 0.31 },
  { id: "tidewater", name: "Tidewater Books", note: "Second floor maps", x: 0.345, y: 0.8 },
  { id: "glasshouse", name: "Glasshouse Gardens", note: "Palm house and pond", x: 0.615, y: 0.3 },
  { id: "ferry", name: "Ferry Steps", note: "Boats to Marrow Isle", x: 0.875, y: 0.375 },
];

const streets = ["Anchor Row", "Bellfounder Ave", "Candlewick Lane", "Dyers Yard", "Eel Pie Stairs", "Fathom Street", "Gull Passage", "Hawser Lane", "Inkwell Court", "Juniper Rise", "Kiln Street", "Lantern Row", "Mizzen Walk", "Netmakers Lane", "Oyster Quay", "Pilot Street", "Quill Bridge", "Ropewalk", "Saltway", "Tanners Green", "Umber Lane", "Vesper Street"];

// Design pixels. The sheet is COLS panels wide and two panels tall.
const COLS = 4;
const PW = 176;
const PH = 236;
const MW = PW * COLS;
const MH = PH * 2;
const SCENE_W = 980;
const SCENE_H = 610;
const TIP = 47; // camera: how far the table leans away
const TURN = -15; // camera: how far the sheet is turned on the table
const REST = 5; // degrees each panel keeps after unfolding, so the creases still catch the light
const FOLD = 176; // degrees a panel swings to lie on its neighbour

const PAPER = "#f3ead6";
const BACK = "#ece2cc";
const RED = "#e2442b";
const INK = "#54463a";
const SERIF = 'Georgia, "Times New Roman", serif';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Draws the whole plan once. Everything here is made up: no map service is involved. */
function drawPlan(ctx: CanvasRenderingContext2D, W: number, H: number) {
  let seed = 23;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const coast = () => {
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H + 10);
    ctx.bezierCurveTo(W * 0.6, H * 0.86, W * 0.74, H * 0.9, W * 0.79, H * 0.7);
    ctx.bezierCurveTo(W * 0.83, H * 0.56, W * 0.93, H * 0.6, W + 10, H * 0.47);
    ctx.lineTo(W + 10, H + 10);
    ctx.closePath();
  };
  const river = () => {
    ctx.beginPath();
    ctx.moveTo(W * 0.29, -10);
    ctx.bezierCurveTo(W * 0.38, H * 0.22, W * 0.2, H * 0.4, W * 0.36, H * 0.55);
    ctx.bezierCurveTo(W * 0.46, H * 0.64, W * 0.56, H * 0.66, W * 0.7, H * 0.93);
  };
  const label = (t: string, x: number, y: number, o: { size?: number; italic?: boolean; bold?: boolean; color?: string; gap?: number; rot?: number; halo?: string } = {}) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.rot ?? 0);
    ctx.font = `${o.italic ? "italic " : ""}${o.bold ? "700 " : ""}${o.size ?? 8}px ${SERIF}`;
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${o.gap ?? 0}px`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (o.halo !== "none") {
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = o.halo ?? "rgba(243,234,214,0.9)";
      ctx.strokeText(t, 0, 0);
    }
    ctx.fillStyle = o.color ?? INK;
    ctx.fillText(t, 0, 0);
    ctx.restore();
  };
  const grid = (cx: number, cy: number, ang: number, sx: number, sy: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    const n = 22;
    for (let i = -n; i < n; i++)
      for (let j = -n; j < n; j++) {
        const r = rnd();
        if (r > 0.7) continue;
        ctx.fillStyle = r < 0.05 ? "#e0a590" : r < 0.3 ? "#dccaa6" : "#e4d5b6";
        const w = r < 0.3 ? sx - 9 : (sx - 9) * (0.35 + rnd() * 0.5);
        const h = r < 0.3 ? sy - 9 : (sy - 9) * (0.5 + rnd() * 0.5);
        ctx.fillRect(i * sx + 4.5, j * sy + 4.5, w, h);
      }
    for (const pass of [0, 1]) {
      ctx.strokeStyle = pass ? "#fffdf6" : "#cdbb99";
      for (let i = -n; i <= n; i++) {
        ctx.lineWidth = (i % 4 === 0 ? 4.6 : 2.8) + (pass ? 0 : 1.3);
        ctx.beginPath();
        ctx.moveTo(i * sx, -n * sy);
        ctx.lineTo(i * sx, n * sy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-n * sx, i * sy);
        ctx.lineTo(n * sx, i * sy);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  // land, then two street grids that meet at the river
  ctx.fillStyle = "#efe3c9";
  ctx.fillRect(0, 0, W, H);
  grid(W * 0.1, H * 0.4, -0.2, 34, 27);
  ctx.save();
  river();
  ctx.lineTo(W + 10, H + 10);
  ctx.lineTo(W + 10, -10);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = "#efe3c9";
  ctx.fillRect(0, 0, W, H);
  grid(W * 0.7, H * 0.3, 0.3, 38, 30);
  ctx.restore();

  // parks
  const park = (x: number, y: number, rx: number, ry: number, rot: number, pond: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#c3d7a6";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#9db985";
    ctx.stroke();
    ctx.clip();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "#f4ecd8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-rx, ry * 0.3);
    ctx.quadraticCurveTo(0, -ry * 0.8, rx, ry * 0.2);
    ctx.moveTo(-rx * 0.2, -ry);
    ctx.quadraticCurveTo(rx * 0.3, 0, -rx * 0.1, ry);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < rx * 0.9; i++) {
      const a = rnd() * Math.PI * 2;
      const d = Math.sqrt(rnd());
      const tx = Math.cos(a) * d * rx * 0.92;
      const ty = Math.sin(a) * d * ry * 0.9;
      ctx.fillStyle = "rgba(70,100,60,0.25)";
      ctx.beginPath();
      ctx.arc(tx + 0.8, ty + 1, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rnd() < 0.5 ? "#93b77c" : "#a4c48b";
      ctx.beginPath();
      ctx.arc(tx, ty, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (pond) {
      ctx.beginPath();
      ctx.ellipse(rx * 0.25, ry * 0.2, rx * 0.26, ry * 0.26, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "#a9cfd8";
      ctx.fill();
      ctx.strokeStyle = "#7fb0bd";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.restore();
  };
  park(W * 0.615, H * 0.3, 66, 42, -0.25, true);
  park(W * 0.115, H * 0.76, 48, 35, 0.2, false);
  park(W * 0.47, H * 0.2, 26, 18, 0.5, false);

  // river and sea, each with a darker bank and paler shallows
  ctx.lineCap = "round";
  river();
  ctx.strokeStyle = "#7fb0bd";
  ctx.lineWidth = 25;
  ctx.stroke();
  river();
  ctx.strokeStyle = "#a9cfd8";
  ctx.lineWidth = 22.5;
  ctx.stroke();
  coast();
  ctx.fillStyle = "#a9cfd8";
  ctx.fill();
  ctx.save();
  coast();
  ctx.clip();
  for (const [w, c] of [[64, "#b3d6dd"], [40, "#bedde2"], [18, "#cbe5e8"]] as const) {
    coast();
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.stroke();
  }
  coast();
  ctx.strokeStyle = "#7fb0bd";
  ctx.lineWidth = 2.4;
  ctx.stroke();
  // ferry route
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "#5d8e9c";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(W * 0.885, H * 0.58);
  ctx.quadraticCurveTo(W * 0.9, H * 0.78, W * 0.8, H + 4);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  river();
  ctx.strokeStyle = "#a9cfd8";
  ctx.lineWidth = 22.5;
  ctx.stroke();

  // piers in the harbour
  for (const [px, py, len, a] of [[0.772, 0.76, 40, 0.5], [0.795, 0.705, 46, 0.42], [0.83, 0.622, 34, 0.9]] as const) {
    ctx.save();
    ctx.translate(W * px, H * py);
    ctx.rotate(a);
    ctx.fillStyle = "#cdbb99";
    ctx.fillRect(-0.8, -3.3, len + 1.6, 6.6);
    ctx.fillStyle = "#fffdf6";
    ctx.fillRect(0, -2.5, len, 5);
    ctx.restore();
  }

  // avenues, drawn over the river so they read as bridges; kept off the sea
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  coast();
  ctx.clip("evenodd");
  const avenues = [
    () => { ctx.moveTo(-10, H * 0.56); ctx.bezierCurveTo(W * 0.2, H * 0.5, W * 0.4, H * 0.36, W * 0.56, H * 0.46); ctx.bezierCurveTo(W * 0.7, H * 0.55, W * 0.85, H * 0.3, W + 10, H * 0.26); },
    () => { ctx.moveTo(W * 0.5, -10); ctx.bezierCurveTo(W * 0.5, H * 0.3, W * 0.62, H * 0.5, W * 0.76, H * 0.76); },
    () => { ctx.moveTo(W * 0.06, -10); ctx.bezierCurveTo(W * 0.02, H * 0.5, W * 0.22, H * 0.86, W * 0.48, H + 10); },
    () => { ctx.moveTo(W * 0.22, H * 0.73); ctx.bezierCurveTo(W * 0.4, H * 0.86, W * 0.5, H * 0.74, W * 0.63, H * 0.62); },
  ];
  for (const pass of [0, 1])
    for (const a of avenues) {
      ctx.beginPath();
      a();
      ctx.strokeStyle = pass ? "#f7cc66" : "#c79a3c";
      ctx.lineWidth = pass ? 5.4 : 7.2;
      ctx.stroke();
    }
  ctx.restore();

  // railway and station
  const rail = () => {
    ctx.beginPath();
    ctx.moveTo(-10, H * 0.3);
    ctx.bezierCurveTo(W * 0.2, H * 0.02, W * 0.56, H * 0.2, W + 10, H * 0.085);
  };
  ctx.lineCap = "butt";
  rail();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();
  rail();
  ctx.setLineDash([7, 7]);
  ctx.strokeStyle = "#fffdf6";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.save();
  ctx.translate(W * 0.795, H * 0.13);
  ctx.rotate(-0.1);
  ctx.fillStyle = INK;
  ctx.fillRect(-17, -5, 34, 10);
  ctx.restore();

  // lettering
  label("OLD TOWN", W * 0.15, H * 0.5, { size: 10.5, gap: 4, color: "#8a745a" });
  label("LANTERN QUARTER", W * 0.14, H * 0.16 + 26, { size: 7.5, gap: 2.4, color: "#8a745a" });
  label("EASTBANK", W * 0.8, H * 0.24, { size: 10.5, gap: 4, color: "#8a745a" });
  label("THE STAITHES", W * 0.6, H * 0.62 + 12, { size: 7.5, gap: 2.4, color: "#8a745a", rot: 0.5 });
  label("Quill River", W * 0.305, H * 0.335, { size: 8.5, italic: true, color: "#3f7482", rot: 1.25, halo: "none" });
  label("Marrow Sound", W * 0.885, H * 0.85, { size: 13, italic: true, gap: 1.5, color: "#3f7482", rot: -0.5, halo: "none" });
  label("Glasshouse Gardens", W * 0.6, H * 0.3 + 30, { size: 7.5, italic: true, color: "#4f7040", rot: -0.25, halo: "rgba(195,215,166,0.9)" });
  label("Tanners Green", W * 0.115, H * 0.76 + 2, { size: 7, italic: true, color: "#4f7040", rot: 0.2, halo: "rgba(195,215,166,0.9)" });
  label("Bellfounder Avenue", W * 0.445, H * 0.405 - 9, { size: 6.6, color: "#7a5a1c", rot: -0.08 });
  label("Saltway", W * 0.565, H * 0.36, { size: 6.6, color: "#7a5a1c", rot: 1.1 });
  label("Ropewalk", W * 0.115, H * 0.615, { size: 6.6, color: "#7a5a1c", rot: 1.02 });
  label("Quillhaven Central", W * 0.795, H * 0.13 - 13, { size: 6.6, bold: true, rot: -0.1 });
  label("to Marrow Isle", W * 0.925, H * 0.72, { size: 6.4, italic: true, color: "#3f7482", rot: 1.35, halo: "none" });

  // numbered spots the pin lands on
  places.forEach((p, i) => {
    const x = W * p.x;
    const y = H * p.y;
    ctx.beginPath();
    ctx.arc(x, y, 6.6, 0, Math.PI * 2);
    ctx.fillStyle = "#fffdf6";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 5.2, 0, Math.PI * 2);
    ctx.fillStyle = "#b5321d";
    ctx.fill();
    label(String(i + 1), x, y + 0.4, { size: 7, bold: true, color: "#fffdf6", halo: "none" });
    label(p.name, x, y + 13.5, { size: 6.8, bold: true, color: "#3b2f26" });
  });

  // north point
  ctx.save();
  ctx.translate(W * 0.925, H * 0.565 + 44);
  ctx.strokeStyle = "#3f7482";
  ctx.fillStyle = "#3f7482";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.stroke();
  for (let k = 0; k < 4; k++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(3, 0);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    k === 3 ? ctx.fill() : ctx.stroke();
  }
  ctx.restore();
  label("N", W * 0.925, H * 0.565 + 22, { size: 7.5, bold: true, color: "#3f7482", halo: "none" });

  // margin, neat line and grid letters
  const M = 15;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, M);
  ctx.fillRect(0, H - M, W, M);
  ctx.fillRect(0, 0, M, H);
  ctx.fillRect(W - M, 0, M, H);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;
  ctx.strokeRect(M, M, W - M * 2, H - M * 2);
  ctx.lineWidth = 0.5;
  ctx.strokeRect(M - 3, M - 3, W - M * 2 + 6, H - M * 2 + 6);
  for (let c = 0; c < COLS; c++) {
    label("ABCDEFGH"[c], (c + 0.5) * (W / COLS), 6.4, { size: 6.5, bold: true, halo: "none" });
    label("ABCDEFGH"[c], (c + 0.5) * (W / COLS), H - 5.6, { size: 6.5, bold: true, halo: "none" });
  }
  for (let r = 0; r < 2; r++) {
    label(String(r + 1), 6, (r + 0.5) * (H / 2), { size: 6.5, bold: true, halo: "none" });
    label(String(r + 1), W - 6, (r + 0.5) * (H / 2), { size: 6.5, bold: true, halo: "none" });
  }

  // title box and scale bar
  ctx.fillStyle = PAPER;
  ctx.fillRect(M + 9, M + 9, 138, 50);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.strokeRect(M + 9, M + 9, 138, 50);
  ctx.lineWidth = 0.4;
  ctx.strokeRect(M + 11.5, M + 11.5, 133, 45);
  label(town.name.toUpperCase(), M + 78, M + 24, { size: 12.5, bold: true, gap: 2.6, halo: "none" });
  label(town.sub, M + 78, M + 37, { size: 7.4, italic: true, halo: "none" });
  for (let k = 0; k < 4; k++) {
    ctx.fillStyle = k % 2 ? PAPER : INK;
    ctx.fillRect(M + 30 + k * 16, M + 46.5, 16, 2.6);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(M + 30, M + 46.5, 64, 2.6);
  label(town.scale, M + 116, M + 48, { size: 5.6, halo: "none" });

  // paper tooth, and fibres rubbed pale along every fold
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = rnd() < 0.6 ? "rgba(90,70,40,0.05)" : "rgba(255,255,255,0.08)";
    ctx.fillRect(rnd() * W, rnd() * H, 1, 1);
  }
  const rub = (x0: number, y0: number, x1: number, y1: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let i = 0; i < len * 1.6; i++) {
      const t = rnd();
      const off = (rnd() - 0.5) * (rnd() < 0.85 ? 1.6 : 5);
      ctx.fillStyle = `rgba(255,252,244,${0.25 + rnd() * 0.5})`;
      ctx.fillRect(x0 + (x1 - x0) * t + (x0 === x1 ? off : 0), y0 + (y1 - y0) * t + (y0 === y1 ? off : 0), x0 === x1 ? 1 : 1 + rnd() * 3, y0 === y1 ? 1 : 1 + rnd() * 3);
    }
  };
  for (let c = 1; c < COLS; c++) rub((W / COLS) * c, 0, (W / COLS) * c, H);
  rub(0, H / 2, W, H / 2);
}

/** Soft shading at whichever edges of a panel meet a fold. */
function creases(c: number, r: number, back: boolean) {
  const dark = (dir: string, a: number) => `linear-gradient(${dir}, rgba(70,48,22,${a}) 0, rgba(70,48,22,${a * 0.35}) 5px, rgba(70,48,22,0) 22px)`;
  const out: string[] = [];
  // valleys shade both sides, ridges shade only the side facing away from the lamp
  const ridgeRight = c % 2 === 1; // fold on this panel's right edge is a ridge
  if (c < COLS - 1) out.push(dark("270deg", ridgeRight ? 0.05 : 0.26));
  if (c > 0) out.push(dark("90deg", ridgeRight ? 0.24 : 0.3));
  out.push(r === 0 ? dark("0deg", 0.13) : dark("180deg", 0.2));
  // the lamp is up and to the left: panels leaning toward it are lifted, the others dimmed
  out.push(c % 2 === 1 ? "linear-gradient(100deg, rgba(255,255,255,0.2), rgba(255,255,255,0.04))" : "linear-gradient(100deg, rgba(60,40,15,0.05), rgba(60,40,15,0.17))");
  if (back) out.push("linear-gradient(0deg, rgba(60,40,15,0.06), rgba(60,40,15,0.06))");
  return out.join(", ");
}

const face = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" } as const;

export default function FoldedPaperStreetMap() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [mapUrl, setMapUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [tucked, setTucked] = useState(true);
  const [pin, setPin] = useState(-1);
  const flags = useRef({ paused: false, touched: false, open: false });

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rz = useSpring(useTransform(px, (v) => TURN + v * 4), { stiffness: 60, damping: 14 });
  const rx = useSpring(useTransform(py, (v) => TIP - v * 4), { stiffness: 60, damping: 14 });

  // print the plan once and hand it to every panel as one picture
  useEffect(() => {
    const cv = document.createElement("canvas");
    cv.width = MW * 3;
    cv.height = MH * 3;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.scale(3, 3);
    drawPlan(ctx, MW, MH);
    let url = "";
    cv.toBlob((b) => {
      if (!b) return;
      url = URL.createObjectURL(b);
      setMapUrl(url);
    }, "image/png");
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  const unfold = useCallback((to: boolean) => {
    flags.current.open = to;
    setOpen(to);
    if (to) setTucked(false);
    else setPin(-1);
  }, []);

  // once it is shut, the lower panels are put away so nothing shows through the cover
  useEffect(() => {
    if (open) return;
    const t = window.setTimeout(() => !flags.current.open && setTucked(true), reduce ? 0 : 1500);
    return () => window.clearTimeout(t);
  }, [open, reduce]);

  // self-playing demo: unfold, drop the pin, then move it from place to place
  useEffect(() => {
    if (reduce) {
      unfold(true);
      setPin(1);
      return;
    }
    const first = window.setTimeout(() => unfold(true), 220);
    return () => window.clearTimeout(first);
  }, [reduce, unfold]);
  useEffect(() => {
    if (!open || reduce) return;
    const f = flags.current;
    const drop = window.setTimeout(() => setPin((p) => (p < 0 ? 1 : p)), 1250);
    const loop = window.setInterval(() => {
      if (f.paused || f.touched || document.hidden) return;
      setPin((p) => (p + 1) % places.length);
    }, 3400);
    return () => {
      window.clearTimeout(drop);
      window.clearInterval(loop);
    };
  }, [open, reduce]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    if (!wrap || !scene) return;
    const measure = () => {
      const sc = clamp(wrap.clientWidth / 870, 0.4, 1.12);
      wrap.style.height = `${Math.round(SCENE_H * sc)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  const spring = (delay: number) => (reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 105, damping: 13.5, mass: 1, delay });
  const colDelay = (i: number) => (open ? Math.max(0, i - 1) * 0.09 : 0.4 + (COLS - 1 - i) * 0.08);
  const rowDelay = (i: number) => (open ? 0.36 + i * 0.1 : (COLS - 1 - i) * 0.06);
  const colAngle = (i: number) => (open ? (i === 0 ? REST : i % 2 ? -2 * REST : 2 * REST) : i === 0 ? 0 : i % 2 ? -FOLD : FOLD);

  const active = pin >= 0 ? places[pin] : null;
  const pinAt = (c: number, r: number) => {
    if (!active || !open) return null;
    const x = active.x * MW;
    const y = active.y * MH;
    if (Math.floor(x / PW) !== c || Math.floor(y / PH) !== r) return null;
    return { id: active.id, x: x - c * PW, y: y - r * PH };
  };

  const front = (c: number, r: number) => (
    <div className="absolute inset-0" style={{ ...face, backgroundColor: PAPER, backgroundImage: mapUrl ? `url(${mapUrl})` : undefined, backgroundSize: `${MW}px ${MH}px`, backgroundPosition: `${-c * PW}px ${-r * PH}px` }}>
      <div className="absolute inset-0" style={{ background: creases(c, r, false) }} />
    </div>
  );
  const index = (c: number, r: number) => (
    <div className="absolute inset-0 overflow-hidden" style={{ ...face, transform: r ? "rotateX(180deg)" : "rotateY(180deg)", backgroundColor: BACK }}>
      <div aria-hidden="true" className="absolute inset-[14px] font-mono text-[5.6px] leading-[8.6px]" style={{ color: INK }}>
        <div className="mb-[5px] flex justify-between border-b pb-[3px] text-[6px] font-bold uppercase tracking-[0.2em]" style={{ borderColor: INK }}>
          <span>Street index</span>
          <span>{"ABCD"[c]}</span>
        </div>
        {Array.from({ length: 21 }, (_, k) => {
          const s = streets[(k + c * 5 + r * 9) % streets.length];
          return (
            <div key={k} className="flex justify-between gap-1">
              <span className="truncate">{s}</span>
              <span>{"ABCD"[(k + c) % 4]}{(k % 2) + 1}</span>
            </div>
          );
        })}
      </div>
      <div className="absolute inset-0" style={{ background: creases(c, r, true) }} />
    </div>
  );
  const cover = (
    <div className="absolute inset-0 overflow-hidden" style={{ ...face, transform: "rotateY(180deg)", backgroundColor: RED }}>
      <div aria-hidden="true" className="absolute -right-[58px] top-[70px] h-[190px] w-[190px] rounded-full" style={{ border: "1.5px solid rgba(255,244,226,0.5)", boxShadow: "0 0 0 16px rgba(226,68,43,1), 0 0 0 17.5px rgba(255,244,226,0.42), 0 0 0 34px rgba(226,68,43,1), 0 0 0 35.5px rgba(255,244,226,0.32), 0 0 0 54px rgba(226,68,43,1), 0 0 0 55.5px rgba(255,244,226,0.22)" }} />
      <div className="absolute left-[14px] right-[12px] top-[16px] text-[#fff4e2]">
        <div className="font-mono text-[6.5px] font-semibold uppercase tracking-[0.26em]">{town.edition}</div>
        <div className="mt-[9px] text-[25px] font-black uppercase leading-[0.92] tracking-[-0.02em]">{town.name}</div>
        <div className="mt-[7px] text-[9px] font-medium leading-tight">{town.sub}</div>
      </div>
      <div className="absolute bottom-[14px] left-[14px] right-[14px] flex items-end justify-between font-mono text-[6.5px] font-semibold uppercase tracking-[0.2em] text-[#fff4e2]">
        <span>Street plan</span>
        <span>{town.scale}</span>
      </div>
      <div aria-hidden="true" className="absolute inset-[6px]" style={{ border: "1px solid rgba(255,244,226,0.7)" }} />
      <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(118deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.03) 34%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.18) 100%)" }} />
    </div>
  );

  const pinNode = (c: number, r: number) => {
    const at = pinAt(c, r);
    return (
      <AnimatePresence>
        {at && (
          <div key={at.id} className="absolute left-0 top-0" style={{ transformStyle: "preserve-3d", transform: `translate3d(${at.x}px, ${at.y}px, 0.8px)` }}>
            {/* its shadow slides in across the paper as the pin comes down */}
            <motion.div aria-hidden="true" className="absolute left-0 top-0" style={{ width: 0, height: 0 }} initial={reduce ? false : { x: 150, y: 120, opacity: 0, scale: 1.7 }} animate={{ x: 0, y: 0, opacity: 1, scale: 1 }} exit={{ x: 80, y: 64, opacity: 0, transition: { duration: 0.16 } }} transition={{ duration: 0.36, ease: [0.5, 0, 0.9, 0.6] }}>
              <div className="absolute rounded-full" style={{ left: -1, top: -1.5, width: 44, height: 3, transformOrigin: "0 50%", transform: "rotate(37deg)", background: "linear-gradient(90deg, rgba(40,25,10,0.55), rgba(40,25,10,0.3))", filter: "blur(0.9px)" }} />
              <div className="absolute rounded-full" style={{ left: 22, top: 13, width: 26, height: 20, transform: "rotate(37deg)", background: "rgba(40,25,10,0.42)", filter: "blur(3.5px)" }} />
            </motion.div>
            <motion.div className="absolute left-0 top-0" style={{ transformStyle: "preserve-3d", width: 0, height: 0 }} initial={reduce ? false : { z: 300 }} animate={{ z: 0 }} exit={{ z: 170, transition: { duration: 0.16, ease: "easeIn" } }} transition={{ duration: 0.36, ease: [0.5, 0, 0.9, 0.6] }}>
              <div className="absolute left-0 top-0" style={{ transformStyle: "preserve-3d", transform: `rotateZ(${-TURN}deg) rotateX(-80deg)` }}>
                <motion.div className="absolute" style={{ left: -15, top: -68, width: 30, height: 68, transformOrigin: "50% 100%" }} initial={reduce ? false : { rotate: 0, opacity: 0 }} animate={reduce ? { rotate: 4, opacity: 1 } : { rotate: [0, 0, -11, 8, -4, 5, 4], opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16 } }} transition={{ rotate: { duration: 1.05, times: [0, 0.34, 0.46, 0.6, 0.74, 0.88, 1], ease: "easeOut" }, opacity: { duration: 0.1 } }}>
                  <div className="absolute bottom-0 left-1/2 h-[42px] w-[2.4px] -translate-x-1/2 rounded-b-full" style={{ background: "linear-gradient(90deg, #6c7178 0%, #f4f6f8 38%, #b9bec4 60%, #50545a 100%)" }} />
                  <div className="absolute left-1/2 top-[25px] h-[4px] w-[7px] -translate-x-1/2 rounded-[2px]" style={{ background: "linear-gradient(90deg, #7a0f06, #d93a26 45%, #7a0f06)" }} />
                  <div className="absolute left-1/2 top-0 h-[28px] w-[28px] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(circle at 34% 28%, #ffd9cf 0%, #ff7d66 9%, #ea3f27 30%, #c22512 58%, #7c1207 86%, #9a2a18 100%)", boxShadow: "inset -2px -3px 5px rgba(60,5,0,0.55), inset 1px 1px 1px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.35)" }}>
                    <span className="absolute left-[6px] top-[4.5px] h-[6px] w-[9px] rounded-full" style={{ background: "rgba(255,255,255,0.9)", filter: "blur(1px)", transform: "rotate(-28deg)" }} />
                    <span className="absolute bottom-[3px] right-[4px] h-[7px] w-[12px] rounded-full" style={{ background: "rgba(255,170,140,0.45)", filter: "blur(2px)", transform: "rotate(-30deg)" }} />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  const column = (i: number): React.ReactNode => (
    <motion.div key={i} className="absolute top-0" style={{ left: i === 0 ? 0 : PW, width: PW, height: PH, transformStyle: "preserve-3d", transformOrigin: i === 0 ? "100% 50%" : "0 50%" }} initial={false} animate={{ rotateY: colAngle(i) }} transition={spring(colDelay(i))}>
      {front(i, 0)}
      {i === COLS - 1 ? cover : index(i, 0)}
      {pinNode(i, 0)}
      <div className="absolute left-0" style={{ top: PH, width: PW, height: PH, transformStyle: "preserve-3d", transform: "translateZ(0.6px)", visibility: tucked ? "hidden" : "visible" }}>
        <motion.div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "50% 0" }} initial={false} animate={{ rotateX: open ? 0 : 179.4 }} transition={spring(rowDelay(i))}>
          {front(i, 1)}
          {index(i, 1)}
          {pinNode(i, 1)}
        </motion.div>
      </div>
      {i < COLS - 1 && column(i + 1)}
    </motion.div>
  );

  return (
    <section className="relative overflow-hidden bg-[#1c3fb0]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 62% at 46% 40%, #3f69e6 0%, #2549c4 42%, #152f8e 100%)" }} />
      <div
        ref={wrapRef}
        onPointerMove={onMove}
        onPointerEnter={() => (flags.current.paused = true)}
        onPointerLeave={() => {
          flags.current.paused = false;
          px.set(0);
          py.set(0);
        }}
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: SCENE_H }}
      >
        <div ref={sceneRef} className="absolute left-1/2 top-0 select-none" style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "2400px", perspectiveOrigin: "50% 40%" }}>
          <motion.div className="absolute" style={{ left: (SCENE_W - MW) / 2, top: (SCENE_H - MH) / 2 + 6, width: MW, height: MH, transformStyle: "preserve-3d", rotateX: rx, rotateZ: rz }}>
            <motion.div className={`absolute inset-0 ${open ? "" : "cursor-pointer"}`} style={{ transformStyle: "preserve-3d" }} initial={false} animate={{ x: open ? 0 : PW * 1.5, y: open ? 0 : PH * 0.5 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 70, damping: 16 }} onClick={() => !open && ((flags.current.touched = true), unfold(true))}>
              {/* shadow on the table, growing with the sheet */}
              <motion.div aria-hidden="true" className="absolute left-0 top-0 rounded-[6px] bg-[#040d33]" style={{ width: MW, height: MH, transformOrigin: "0 0", filter: "blur(22px)", opacity: 0.55, x: 22, y: 30 }} initial={false} animate={{ scaleX: open ? 1 : 1 / COLS, scaleY: open ? 1 : 0.5 }} transition={reduce ? { duration: 0 } : { duration: 0.9, ease: [0.3, 0.7, 0.3, 1] }} />
              <motion.div aria-hidden="true" className="absolute left-0 top-0 bg-[#040d33]" style={{ width: MW, height: MH, transformOrigin: "0 0", filter: "blur(5px)", opacity: 0.5, x: 5, y: 7 }} initial={false} animate={{ scaleX: open ? 1 : 1 / COLS, scaleY: open ? 1 : 0.5 }} transition={reduce ? { duration: 0 } : { duration: 0.9, ease: [0.3, 0.7, 0.3, 1] }} />
              {column(0)}
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="relative flex flex-col gap-3 px-5 pb-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-8">
        <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-blue-100">
          <span className="text-white">
            {town.name} / {town.edition}
          </span>
          <span className="block" aria-live="polite">
            {active ? `${pin + 1}. ${active.name}, ${active.note}` : open ? "Pick a place to pin" : "Press the cover to unfold"}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {places.map((p, i) => (
            <button
              key={p.id}
              type="button"
              disabled={!open}
              aria-pressed={pin === i}
              aria-label={`Drop the pin on ${p.name}`}
              onClick={() => {
                flags.current.touched = true;
                setPin(i);
              }}
              className={`h-10 min-w-[40px] rounded-full px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c3fb0] disabled:opacity-50 ${pin === i ? "bg-white text-[#152f8e]" : "bg-[#10277a] text-white hover:bg-[#0c1f66]"}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            aria-expanded={open}
            onClick={() => {
              flags.current.touched = true;
              unfold(!open);
            }}
            className="h-10 rounded-full bg-[#10277a] px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white outline-none transition-colors hover:bg-[#0c1f66] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c3fb0]"
          >
            {open ? "Fold it up" : "Unfold"}
          </button>
        </div>
      </div>
    </section>
  );
}
