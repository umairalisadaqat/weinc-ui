import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// The full stops on the ring, widest first. `mid` and `heavy` are how much of each blurred copy of the
// background shows at that stop (0 to 1), and `speed` is the shutter time that keeps the exposure equal.
const stops = [
  { f: "1.4", speed: "1/4000", mid: 1, heavy: 1, note: "Background melts" },
  { f: "2", speed: "1/2000", mid: 1, heavy: 0.62, note: "Blossom as colour" },
  { f: "2.8", speed: "1/1000", mid: 1, heavy: 0.28, note: "Shapes return" },
  { f: "4", speed: "1/500", mid: 0.82, heavy: 0, note: "Petals separate" },
  { f: "5.6", speed: "1/250", mid: 0.56, heavy: 0, note: "Branches appear" },
  { f: "8", speed: "1/125", mid: 0.32, heavy: 0, note: "Tree mostly crisp" },
  { f: "11", speed: "1/60", mid: 0.13, heavy: 0, note: "Nearly all sharp" },
  { f: "16", speed: "1/30", mid: 0, heavy: 0, note: "Everything sharp" },
];
const PHOTO = "https://images.pexels.com/photos/31599702/pexels-photo-31599702.jpeg?auto=compress&cs=tinysrgb&w=900";
const PHOTO_ALT = "Woman in a brown leather coat with her hands in her hair, standing in front of a tree covered in pink blossom";
const BLADES = 9; // iris blades; an odd count gives the classic rounded polygon
const PAINT = "#ff8a3c"; // index dot on the ring, the chosen stop and the focus ring
const ENGRAVING = "ORWIN  PORTRAIT  1:1.4 / 85      Ø72      NO 2041176"; // text around the name ring
const DEMO_ORDER = [2, 5, 7, 3, 0]; // stops the self-running demo visits

// Outline of the sitter in a 100 by 150 box (x across, y down). Inside it the print always stays sharp.
const SITTER = "43.5 34.4 50 31.6 57.5 33.8 62.8 37.6 67 37 75.8 38.5 85.2 44.2 88 51.2 86 66 83 78 84.5 105 86 131.5 71.5 140.8 66.5 165 27 165 26.5 120 25 96.5 20 75 16 60 16.5 50 22.5 45.1 33.2 38.5 38.2 35.5";
// The two patches of blossom that show between her arms and her head: these blur with the background.
const GAPS = ["35 43 41 48 41 60 33 60 26 53", "62 41 68 44 72 52 66 58 60 59 59.5 48"];
const toPath = (pts: string) => "M" + pts.split(" ").map((v, i) => (i % 2 || !i ? v : "L" + v)).join(" ") + "Z";
const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150" preserveAspectRatio="none"><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.9"/></filter><path filter="url(#b)" fill-rule="evenodd" d="M-40 -40H140V200H-40Z ${toPath(SITTER)} ${GAPS.map(toPath).join(" ")}"/></svg>`;
const MASK = `url("data:image/svg+xml,${encodeURIComponent(maskSvg)}")`;

const S = 400, C = 200; // canvas edge and centre in CSS pixels
const GLASS = 96, IRIS = 76;
const holeRadius = (a: number) => 71 * Math.pow(2, -a / 2); // each full stop halves the area of the opening

export default function CameraLensApertureSwitch() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const [stop, setStop] = useState(2);
  const stopRef = useRef(2);
  const api = useRef<{ go: (i: number, fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, stage = root.current;
    if (!cv || !stage) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = S * dpr; cv.height = S * dpr;
    const hasConic = typeof ctx.createConicGradient === "function";
    const TAU = Math.PI * 2;
    const s = { a: 0, v: 0, target: 2, lx: -0.55, ly: -0.62, tx: -0.55, ty: -0.62 };

    const ring = (r0: number, r1: number) => { ctx.beginPath(); ctx.arc(C, C, r0, 0, TAU); ctx.arc(C, C, r1, 0, TAU, true); };
    // Black anodised metal: mostly dark, with two narrow bright streaks where the lamp and its bounce land.
    const sheen = (angle: number, lo: number, hi: number, tint = 1) => {
      const col = (v: number) => `rgb(${v | 0},${(v * (1 + 0.02 * tint)) | 0},${(v * (1 + 0.09 * tint)) | 0})`;
      if (!hasConic) return col((lo + hi) / 2);
      const g = ctx.createConicGradient(angle, C, C);
      const m = (lo + hi) / 2;
      const pts: [number, number][] = [[0, hi], [0.035, m], [0.12, lo], [0.3, lo + 6], [0.42, m - 8], [0.5, hi * 0.72], [0.56, m - 10], [0.7, lo], [0.88, lo + 4], [0.96, m], [1, hi]];
      for (const [p, v] of pts) g.addColorStop(p, col(v));
      return g;
    };

    // One iris blade: everything outside its straight inner edge, starting at the corner it shares with the blade before.
    const blade = (k: number, r: number, rot: number, la: number) => {
      const phi = rot + (k * TAU) / BLADES, half = Math.PI / BLADES;
      const vr = r / Math.cos(half), a0 = phi - half;
      const ax = C + Math.cos(a0) * vr, ay = C + Math.sin(a0) * vr;
      const tx = -Math.sin(phi), ty = Math.cos(phi), nx = Math.cos(phi), ny = Math.sin(phi);
      const L = 260;
      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(ax + tx * L, ay + ty * L); ctx.lineTo(ax + tx * L + nx * L, ay + ty * L + ny * L); ctx.lineTo(ax + nx * L, ay + ny * L); ctx.closePath();
      const lit = 0.5 + 0.5 * Math.cos(phi - la + 0.6);
      const v = 22 + lit * 34;
      const g = ctx.createLinearGradient(ax, ay, ax + tx * 110, ay + ty * 110);
      g.addColorStop(0, `rgb(${v + 20},${v + 22},${v + 28})`); g.addColorStop(0.45, `rgb(${v},${v + 1},${v + 5})`); g.addColorStop(1, `rgb(${v - 12},${v - 11},${v - 8})`);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = 7 * dpr; ctx.fillStyle = g; ctx.fill(); ctx.restore();
      // the ground edge of the blade catches a thin line of light
      const side = 2 * vr * Math.sin(half);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + tx * (side + 26), ay + ty * (side + 26));
      ctx.lineWidth = 0.9; ctx.strokeStyle = `rgba(210,220,235,${0.1 + lit * 0.3})`; ctx.stroke();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      const la = Math.atan2(s.ly, s.lx);
      const turn = s.a * 0.2; // the aperture ring turns a little with every stop

      // Knurled aperture ring.
      ring(176, 0); ctx.fillStyle = "#0b0b0c"; ctx.fill();
      const teeth = 150, step = TAU / teeth;
      for (let i = 0; i < teeth; i++) {
        const t0 = turn + i * step, face = Math.cos(t0 - la);
        const lit = 0.5 + 0.5 * face, glint = Math.pow(Math.max(0, face), 10) + 0.4 * Math.pow(Math.max(0, -face), 12);
        for (let h = 0; h < 2; h++) {
          const a0 = t0 + h * step * 0.5, a1 = a0 + step * 0.5 + 0.003;
          const v = h === 0 ? 30 + lit * 34 + glint * 120 : 9 + lit * 12 + glint * 30;
          ctx.beginPath(); ctx.arc(C, C, 176, a0, a1); ctx.arc(C, C, 160, a1, a0, true); ctx.closePath();
          ctx.fillStyle = `rgb(${v | 0},${v | 0},${(v * 1.07) | 0})`; ctx.fill();
        }
      }
      const round = ctx.createRadialGradient(C, C, 160, C, C, 176);
      round.addColorStop(0, "rgba(0,0,0,0.6)"); round.addColorStop(0.35, "rgba(0,0,0,0)"); round.addColorStop(0.7, "rgba(0,0,0,0)"); round.addColorStop(1, "rgba(0,0,0,0.75)");
      ring(176, 160); ctx.fillStyle = round; ctx.fill();
      // the painted index dot travels with the ring
      const da = turn - Math.PI / 2 - 0.5;
      ctx.beginPath(); ctx.arc(C + Math.cos(da) * 168, C + Math.sin(da) * 168, 3, 0, TAU); ctx.fillStyle = PAINT; ctx.fill();
      ctx.beginPath(); ctx.arc(C + Math.cos(da) * 168 - 0.8, C + Math.sin(da) * 168 - 0.9, 0.9, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fill();

      // Polished chamfer, then the flat satin front of the barrel.
      ring(160, 153); ctx.fillStyle = sheen(la, 16, 215); ctx.fill();
      ring(153, 133); ctx.fillStyle = sheen(la + 0.25, 15, 62); ctx.fill();
      const flat = ctx.createRadialGradient(C, C, 133, C, C, 153);
      flat.addColorStop(0, "rgba(0,0,0,0.45)"); flat.addColorStop(0.25, "rgba(0,0,0,0)"); flat.addColorStop(1, "rgba(0,0,0,0.3)");
      ring(153, 133); ctx.fillStyle = flat; ctx.fill();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(0,0,0,0.8)"; ctx.beginPath(); ctx.arc(C, C, 153, 0, TAU); ctx.stroke();
      // fixed white index line the dot is read against
      ctx.save(); ctx.translate(C, C); ctx.rotate(-0.5);
      ctx.fillStyle = "rgba(240,242,245,0.9)"; ctx.fillRect(-1, -151, 2, 9);
      ctx.restore();

      // Filter thread: fine grooves that light up on the two sides facing the lamp.
      ring(133, 119); ctx.fillStyle = "#050506"; ctx.fill();
      for (let r = 119.6; r < 133; r += 1.5) {
        ctx.beginPath(); ctx.arc(C, C, r, 0, TAU); ctx.lineWidth = 0.7; ctx.strokeStyle = sheen(la + 0.1 + (r - 119) * 0.004, 10, 150); ctx.stroke();
      }
      const well = ctx.createRadialGradient(C, C, 119, C, C, 133);
      well.addColorStop(0, "rgba(0,0,0,0.25)"); well.addColorStop(1, "rgba(0,0,0,0.65)");
      ring(133, 119); ctx.fillStyle = well; ctx.fill();

      // Name ring with engraved, paint-filled lettering.
      const name = ctx.createRadialGradient(C, C, 100, C, C, 119);
      name.addColorStop(0, "#09090a"); name.addColorStop(0.5, "#151517"); name.addColorStop(1, "#1d1d20");
      ring(119, 100); ctx.fillStyle = name; ctx.fill();
      ring(119, 100); ctx.globalAlpha = 0.35; ctx.fillStyle = sheen(la, 0, 70); ctx.globalCompositeOperation = "lighter"; ctx.fill(); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(C, C);
      ctx.font = "600 8.6px ui-sans-serif, system-ui, -apple-system, Helvetica, Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const pitch = 0.062, start = -(ENGRAVING.length - 1) * pitch * 0.5;
      for (let i = 0; i < ENGRAVING.length; i++) {
        const ch = ENGRAVING[i]; if (ch === " ") continue;
        const ang = start + i * pitch, lit = 0.62 + 0.38 * Math.cos(ang - Math.PI / 2 - la);
        ctx.save(); ctx.rotate(ang);
        ctx.fillStyle = "rgba(0,0,0,0.9)"; ctx.fillText(ch, 0, -108.8);
        ctx.fillStyle = `rgba(236,238,242,${0.5 + 0.45 * lit})`; ctx.fillText(ch, 0, -109.5);
        ctx.restore();
      }
      ctx.restore();
      // retaining ring that holds the front glass
      ring(100, GLASS); ctx.fillStyle = sheen(la - 0.2, 8, 150); ctx.fill();

      // Inside the barrel, seen through the glass.
      ctx.save(); ctx.beginPath(); ctx.arc(C, C, GLASS, 0, TAU); ctx.clip();
      const deep = ctx.createRadialGradient(C, C, 10, C, C, GLASS);
      deep.addColorStop(0, "#07090d"); deep.addColorStop(0.7, "#0b0d12"); deep.addColorStop(1, "#010102");
      ctx.fillStyle = deep; ctx.fillRect(C - GLASS, C - GLASS, GLASS * 2, GLASS * 2);
      for (let r = IRIS + 3; r < GLASS; r += 4.5) { ctx.beginPath(); ctx.arc(C, C, r, 0, TAU); ctx.lineWidth = 1; ctx.strokeStyle = sheen(la + 0.4, 4, 58); ctx.stroke(); }

      ctx.save(); ctx.beginPath(); ctx.arc(C, C, IRIS, 0, TAU); ctx.clip();
      // what shows through the opening: the rear elements, far down, with their coatings
      const rear = ctx.createRadialGradient(C + s.lx * 6, C + s.ly * 6, 2, C, C, IRIS);
      rear.addColorStop(0, "#151b26"); rear.addColorStop(0.45, "#080a10"); rear.addColorStop(1, "#000");
      ctx.fillStyle = rear; ctx.fillRect(C - IRIS, C - IRIS, IRIS * 2, IRIS * 2);
      ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(70,190,160,0.34)"; ctx.beginPath(); ctx.arc(C - s.lx * 5, C - s.ly * 5, 31, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(150,110,235,0.4)"; ctx.beginPath(); ctx.arc(C - s.lx * 9, C - s.ly * 9, 17, 0, TAU); ctx.stroke();
      ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(240,180,90,0.26)"; ctx.beginPath(); ctx.arc(C - s.lx * 2, C - s.ly * 2, 48, 0, TAU); ctx.stroke();
      const pin = ctx.createRadialGradient(C - s.lx * 14, C - s.ly * 14, 0, C - s.lx * 14, C - s.ly * 14, 7);
      pin.addColorStop(0, "rgba(220,235,255,0.75)"); pin.addColorStop(1, "rgba(220,235,255,0)");
      ctx.fillStyle = pin; ctx.fillRect(C - 40, C - 40, 80, 80);

      const r = holeRadius(s.a), rot = 0.35 + s.a * 0.13;
      const corner = rot - Math.PI / BLADES;
      for (let k = 0; k < BLADES; k++) blade(k, r, rot, la);
      // the first two blades tuck back over the last, so the overlap runs the same way all round
      ctx.save(); ctx.beginPath(); ctx.moveTo(C, C); ctx.arc(C, C, 200, corner, corner + (2 * TAU) / BLADES); ctx.closePath(); ctx.clip();
      blade(0, r, rot, la); blade(1, r, rot, la);
      ctx.restore();
      const rim = ctx.createRadialGradient(C, C, IRIS * 0.72, C, C, IRIS);
      rim.addColorStop(0, "rgba(0,0,0,0)"); rim.addColorStop(1, "rgba(0,0,0,0.82)");
      ctx.fillStyle = rim; ctx.fillRect(C - IRIS, C - IRIS, IRIS * 2, IRIS * 2);
      ctx.restore();

      // The front glass itself: coating colours, a window reflection and the softbox.
      ctx.globalCompositeOperation = "lighter";
      const spot = (k: number, rad: number, col: string, a: number, hollow = false) => {
        const x = C + s.lx * GLASS * k, y = C + s.ly * GLASS * k;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        if (hollow) { g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.72, `rgba(${col},${a * 0.25})`); g.addColorStop(0.9, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); }
        else { g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.7, `rgba(${col},${a * 0.55})`); g.addColorStop(1, `rgba(${col},0)`); }
        ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      };
      spot(0.72, 96, "120,150,255", 0.2);
      spot(0.5, 30, "200,70,190", 0.3);
      spot(0.2, 15, "60,220,150", 0.3);
      spot(-0.28, 40, "255,170,70", 0.12, true);
      spot(-0.56, 22, "140,90,255", 0.26);
      spot(-0.74, 9, "255,120,90", 0.3);
      // crescent of sky along the edge nearest the lamp
      ctx.beginPath(); ctx.arc(C, C, GLASS - 3, 0, TAU); ctx.arc(C - s.lx * 22, C - s.ly * 22, GLASS + 4, 0, TAU, true);
      const sky = ctx.createLinearGradient(C + s.lx * GLASS, C + s.ly * GLASS, C, C);
      sky.addColorStop(0, "rgba(190,215,255,0.34)"); sky.addColorStop(1, "rgba(190,215,255,0)");
      ctx.fillStyle = sky; ctx.fill("evenodd");
      ctx.globalCompositeOperation = "source-over";
      // softbox: a bright, slightly bowed rectangle
      ctx.save(); ctx.translate(C + s.lx * 62, C + s.ly * 62); ctx.rotate(la + Math.PI / 2);
      ctx.shadowColor = "rgba(235,242,255,0.9)"; ctx.shadowBlur = 9 * dpr;
      ctx.beginPath(); ctx.moveTo(-17, -6); ctx.quadraticCurveTo(0, -11, 17, -6); ctx.lineTo(14, 6); ctx.quadraticCurveTo(0, 2, -14, 6); ctx.closePath();
      ctx.fillStyle = "rgba(245,249,255,0.72)"; ctx.fill();
      ctx.restore();
      const edge = ctx.createRadialGradient(C, C, GLASS * 0.78, C, C, GLASS);
      edge.addColorStop(0, "rgba(0,0,0,0)"); edge.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.fillStyle = edge; ctx.fillRect(C - GLASS, C - GLASS, GLASS * 2, GLASS * 2);
      ctx.restore();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(0,0,0,0.9)"; ctx.beginPath(); ctx.arc(C, C, GLASS, 0, TAU); ctx.stroke();
      // rim light round the whole barrel
      const lip = ctx.createLinearGradient(C + s.lx * 176, C + s.ly * 176, C - s.lx * 176, C - s.ly * 176);
      lip.addColorStop(0, "rgba(255,255,255,0.5)"); lip.addColorStop(0.4, "rgba(255,255,255,0.02)"); lip.addColorStop(1, "rgba(0,0,0,0.7)");
      ctx.lineWidth = 1.2; ctx.strokeStyle = lip; ctx.beginPath(); ctx.arc(C, C, 175.4, 0, TAU); ctx.stroke();
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, t0 = 0, nextDemo = 4300, demoAt = 1;
    const select = (i: number) => { if (stopRef.current !== i) { stopRef.current = i; setStop(i); } };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      s.v += (150 * (s.target - s.a) - 21 * s.v) * dt; s.a += s.v * dt;
      if (now - touched > 5000) {
        s.tx = -0.55 + 0.2 * Math.sin(t / 1900); s.ty = -0.62 + 0.14 * Math.cos(t / 2300);
        if (t > nextDemo) { const n = DEMO_ORDER[demoAt % DEMO_ORDER.length]; demoAt++; s.target = n; select(n); nextDemo = t + 2300; }
      }
      s.lx += (s.tx - s.lx) * Math.min(1, dt * 5); s.ly += (s.ty - s.ly) * Math.min(1, dt * 5);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { s.a = s.target; s.v = 0; s.lx = s.tx; s.ly = s.ty; draw(); };
    api.current = { go: (i, fromUser) => { if (fromUser) touched = performance.now(); s.target = i; select(i); if (reduce) settle(); else wake(); } };
    if (reduce) settle(); else wake();

    // Drag across the lens to turn the ring; a plain tap closes it one stop and wraps round.
    let drag = false, startX = 0, startStop = 0, moved = 0;
    const onDown = (e: PointerEvent) => { drag = true; startX = e.clientX; startStop = stopRef.current; moved = 0; touched = performance.now(); cv.setPointerCapture(e.pointerId); e.preventDefault(); };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      touched = performance.now(); moved = Math.max(moved, Math.abs(e.clientX - startX));
      const n = Math.max(0, Math.min(stops.length - 1, startStop + Math.round((e.clientX - startX) / 26)));
      if (n !== stopRef.current) api.current?.go(n, true);
    };
    const onUp = () => { if (!drag) return; drag = false; if (moved < 5) api.current?.go((stopRef.current + 1) % stops.length, true); };
    const onLight = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2), d = Math.max(60, Math.hypot(dx, dy));
      touched = Math.max(touched, performance.now() - 3600);
      s.tx = (dx / d) * 0.82; s.ty = (dy / d) * 0.82;
      if (reduce) settle();
    };
    cv.addEventListener("pointerdown", onDown); cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp); cv.addEventListener("pointercancel", onUp);
    stage.addEventListener("pointermove", onLight);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp); cv.removeEventListener("pointercancel", onUp);
      stage.removeEventListener("pointermove", onLight);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const choose = (i: number) => { stopRef.current = i; setStop(i); api.current?.go(i, true); };
  const onKey = (e: ReactKeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? Math.min(stops.length - 1, i + 1) : e.key === "ArrowLeft" || e.key === "ArrowUp" ? Math.max(0, i - 1) : e.key === "Home" ? 0 : e.key === "End" ? stops.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault(); choose(next); radios.current[next]?.focus();
  };
  const now = stops[stop];
  const soft = "absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none";

  return (
    <div ref={root} className="flex min-h-[680px] w-full flex-col items-center justify-center overflow-hidden bg-[#0d0d0e] bg-[radial-gradient(110%_80%_at_38%_30%,#232325_0%,#0d0d0e_64%)] px-4 py-10 sm:min-h-[760px]">
      <div className="relative h-[430px] w-[328px] sm:h-[560px] sm:w-[700px]">
        {/* The print lying on the table. Two blurred copies sit over the sharp one, cut away round the sitter. */}
        <div className="absolute left-[10px] top-0 w-[216px] -rotate-[2.5deg] bg-[#f4f1ea] p-[7px] shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_30px_50px_-18px_rgba(0,0,0,0.9),0_6px_12px_rgba(0,0,0,0.5)] sm:left-[34px] sm:top-[6px] sm:w-[360px] sm:p-[11px]">
          <div className="relative aspect-[2/3] overflow-hidden bg-[#7a2a44]">
            <img src={PHOTO} alt={PHOTO_ALT} width={900} height={1350} className="absolute inset-0 h-full w-full object-cover" />
            <div aria-hidden="true" className={soft} style={{ opacity: now.mid, WebkitMaskImage: MASK, maskImage: MASK, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }}>
              <img src={PHOTO} alt="" width={900} height={1350} className="absolute inset-0 h-full w-full origin-[50%_32%] scale-[1.02] object-cover blur-[2px] sm:blur-[3px]" />
            </div>
            <div aria-hidden="true" className={soft} style={{ opacity: now.heavy, WebkitMaskImage: MASK, maskImage: MASK, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }}>
              <img src={PHOTO} alt="" width={900} height={1350} className="absolute inset-0 h-full w-full origin-[50%_32%] scale-[1.04] object-cover blur-[5px] sm:blur-[8px]" />
            </div>
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_32%,rgba(0,0,0,0.12)_100%)]" />
          </div>
        </div>

        {/* The lens, standing on the table with its front element up. */}
        <div className="absolute left-[112px] top-[214px] h-[216px] w-[216px] sm:left-[306px] sm:top-[160px] sm:h-[400px] sm:w-[400px]">
          <div aria-hidden="true" className="absolute inset-[7%] rounded-full shadow-[26px_34px_46px_rgba(0,0,0,0.8),8px_12px_16px_rgba(0,0,0,0.7)]" />
          <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full cursor-ew-resize touch-none" />
        </div>
      </div>

      <div role="radiogroup" aria-label="Aperture" className="relative mt-7 flex items-end rounded-full border border-white/10 bg-[#141416] px-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-8px_14px_rgba(0,0,0,0.5)] sm:px-3">
        {stops.map((st, i) => (
          <button
            key={st.f}
            ref={(el) => { radios.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={stop === i}
            aria-label={`f/${st.f}`}
            tabIndex={stop === i ? 0 : -1}
            onClick={() => choose(i)}
            onKeyDown={(e) => onKey(e, i)}
            className={`relative flex h-11 w-10 flex-col items-center justify-center rounded-full font-mono text-[12px] font-semibold outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#ff8a3c] motion-reduce:transition-none sm:w-12 sm:text-[13px] ${stop === i ? "text-[#ff8a3c]" : "text-zinc-400 hover:text-zinc-100"}`}
          >
            <span aria-hidden="true" className={`absolute top-[5px] h-[5px] w-[2px] rounded-full transition-colors duration-300 motion-reduce:transition-none ${stop === i ? "bg-[#ff8a3c]" : "bg-white/25"}`} />
            <span className="mt-2">{st.f}</span>
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-5 min-h-[20px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-zinc-400">
        <span className="text-zinc-100">f/{now.f}</span>
        <span className="mx-2 text-zinc-600">/</span>
        {now.speed} s
        <span className="mx-2 text-zinc-600">/</span>
        {now.note}
      </p>
    </div>
  );
}
