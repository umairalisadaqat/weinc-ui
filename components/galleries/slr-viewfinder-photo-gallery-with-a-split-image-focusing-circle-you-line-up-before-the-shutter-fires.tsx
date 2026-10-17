import { useEffect, useRef, useState } from "react";

// The frames on the roll. `focus` is where on the ring (0 near, 1 far) this picture is sharp.
const shots = [
  { photo: "https://images.pexels.com/photos/3765140/pexels-photo-3765140.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200&h=800", alt: "Young woman in oversized pale blue sunglasses and a mustard roll-neck against a turquoise wall", tone: "#3aa9c4", focus: 0.58, speed: "250", stop: "2.8" },
  { photo: "https://images.pexels.com/photos/14793008/pexels-photo-14793008.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200&h=800", alt: "Woman with long hair lit deep blue in front of a yellow backdrop", tone: "#8a7a10", focus: 0.3, speed: "125", stop: "2" },
  { photo: "https://images.pexels.com/photos/9769861/pexels-photo-9769861.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200&h=800", alt: "Woman with braided hair lifting green oval sunglasses, wearing a pale green jacket", tone: "#8f9499", focus: 0.76, speed: "500", stop: "4" },
  { photo: "https://images.pexels.com/photos/20829098/pexels-photo-20829098.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200&h=800", alt: "Woman with bright red hair falling across half her face in low evening sun", tone: "#6b5a4c", focus: 0.44, speed: "1000", stop: "1.4" },
];
const distances = ["0.45", "0.5", "0.6", "0.7", "0.85", "1", "1.2", "1.5", "2", "3", "5", "10", "∞"]; // metres, engraved round the ring
const SPAN = 2.7; // radians the ring turns from nearest focus to infinity
const SHARP = 0.012; // how close the ring must be to count as in focus
const INDEX = "#ff8a3c"; // the painted index line under the ring

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>')}")`;
const PRISM = "repeating-conic-gradient(#000 0 25%, transparent 0 50%)";

export default function SlrViewfinderSplitImageGallery() {
  const view = useRef<HTMLDivElement>(null);
  const glass = useRef<HTMLDivElement>(null);
  const ringBox = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [index, setIndex] = useState(0);
  const [sharp, setSharp] = useState(false);
  const [ringValue, setRingValue] = useState(0.2);
  const [firing, setFiring] = useState(false);
  const api = useRef<{ fire: (fromUser: boolean) => void; turnTo: (v: number) => void } | null>(null);

  useEffect(() => {
    const root = view.current, pane = glass.current, box = ringBox.current, cv = canvas.current;
    if (!root || !pane || !box || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const s = { v: reduce ? shots[0].focus : shots[0].focus - 0.3, vel: 0, target: null as number | null, drag: false, idx: 0, sharp: false, busy: false, W: 300, H: 78 };
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };

    const size = () => {
      const g = pane.getBoundingClientRect();
      root.style.setProperty("--slrvf-w", `${g.width}px`); root.style.setProperty("--slrvf-h", `${g.height}px`);
      s.W = box.clientWidth; s.H = box.clientHeight;
      cv.width = Math.round(s.W * dpr); cv.height = Math.round(s.H * dpr);
    };

    // The focus ring, seen from above: a cylinder, so everything bunches up towards the two edges.
    const drawRing = () => {
      const { W, H } = s, cx = W / 2, R = W / 2 - 1, GRIP = Math.round(H * 0.56), TL = -0.5;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#070708"; ctx.fillRect(cx - R, 0, R * 2, H);
      const phi = s.v * SPAN, step = 0.074;
      const k0 = Math.floor((phi - Math.PI / 2) / step);
      for (let k = k0; k <= k0 + Math.ceil(Math.PI / step) + 1; k++) {
        const th = k * step - phi;
        if (th < -Math.PI / 2 || th > Math.PI / 2) continue;
        const x0 = cx + R * Math.sin(th), x1 = cx + R * Math.sin(Math.min(Math.PI / 2, th + step * 0.56));
        const light = Math.pow(Math.max(0, Math.cos(th - TL)), 4), body = Math.max(0, Math.cos(th));
        const v = 17 + 64 * light + 16 * body;
        const g = ctx.createLinearGradient(0, 2, 0, GRIP - 2);
        g.addColorStop(0, `rgb(${v * 0.45},${v * 0.45},${v * 0.48})`); g.addColorStop(0.12, `rgb(${v + 14},${v + 14},${v + 17})`); g.addColorStop(0.22, `rgb(${v},${v},${v + 3})`); g.addColorStop(0.85, `rgb(${v * 0.9},${v * 0.9},${v * 0.93})`); g.addColorStop(1, `rgb(${v * 0.35},${v * 0.35},${v * 0.38})`);
        ctx.fillStyle = g; ctx.fillRect(x0, 2, Math.max(0.6, x1 - x0), GRIP - 4);
        ctx.fillStyle = `rgba(255,255,255,${0.05 + 0.3 * light})`; ctx.fillRect(x0, 2, 0.7, GRIP - 4);
      }
      // bright metal band under the rubber
      const chrome = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
      ([[0, 12], [0.1, 60], [0.2, 120], [0.265, 250], [0.31, 150], [0.45, 72], [0.62, 44], [0.8, 86], [0.93, 40], [1, 8]] as [number, number][]).forEach(([p, v]) => chrome.addColorStop(p, `rgb(${v},${v},${Math.min(255, v + 6)})`));
      ctx.fillStyle = chrome; ctx.fillRect(cx - R, GRIP, R * 2, 4);
      ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(cx - R, GRIP + 4, R * 2, 1);
      // engraved distance scale
      ctx.fillStyle = "#121214"; ctx.fillRect(cx - R, GRIP + 5, R * 2, H - GRIP - 5);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const n = distances.length, mid = GRIP + 5 + (H - GRIP - 5) * 0.56;
      for (let i = 0; i < n * 4 - 3; i++) {
        const th = (i / (n * 4 - 4) - s.v) * SPAN;
        if (Math.abs(th) > 1.5) continue;
        const x = cx + R * Math.sin(th), c = Math.cos(th), major = i % 4 === 0;
        ctx.fillStyle = `rgba(238,240,243,${(major ? 0.85 : 0.4) * (0.25 + 0.75 * c)})`;
        ctx.fillRect(x - 0.5, GRIP + 6, 1, major ? 5 : 3);
        if (!major) continue;
        ctx.save(); ctx.translate(x, mid + 1.5); ctx.scale(Math.max(0.05, c), 1);
        ctx.font = `600 ${distances[i / 4] === "∞" ? 15 : 11}px ui-sans-serif, system-ui, -apple-system, Helvetica, Arial, sans-serif`;
        ctx.fillStyle = `rgba(0,0,0,0.8)`; ctx.fillText(distances[i / 4], 0, 0.8);
        ctx.fillStyle = `rgba(238,240,243,${0.2 + 0.75 * c})`; ctx.fillText(distances[i / 4], 0, 0);
        ctx.restore();
      }
      // roundness: dark limbs and one long highlight where the lamp hits the barrel
      const limb = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
      limb.addColorStop(0, "rgba(0,0,0,0.94)"); limb.addColorStop(0.16, "rgba(0,0,0,0.3)"); limb.addColorStop(0.255, "rgba(255,255,255,0.1)"); limb.addColorStop(0.3, "rgba(255,255,255,0.02)"); limb.addColorStop(0.6, "rgba(0,0,0,0.08)"); limb.addColorStop(0.86, "rgba(0,0,0,0.5)"); limb.addColorStop(1, "rgba(0,0,0,0.96)");
      ctx.fillStyle = limb; ctx.fillRect(cx - R, 0, R * 2, H);
    };

    const apply = () => {
      const want = shots[s.idx].focus;
      const e = Math.max(-1, Math.min(1, (s.v - want) * 3.2));
      root.style.setProperty("--slrvf-e", e.toFixed(4)); root.style.setProperty("--slrvf-a", Math.abs(e).toFixed(4));
      const ok = Math.abs(s.v - want) < SHARP;
      root.dataset.focus = ok ? "ok" : e < 0 ? "near" : "far";
      if (ok !== s.sharp) { s.sharp = ok; setSharp(ok); }
      drawRing();
    };

    let raf = 0, last = 0, seen = true, touched = -1e9, heldSince = 0, startAt = performance.now() + 350, hold = 5200;
    const fire = (fromUser: boolean) => {
      if (fromUser) touched = performance.now();
      if (s.busy) return;
      s.busy = true;
      const next = () => { s.idx = (s.idx + 1) % shots.length; setIndex(s.idx); heldSince = 0; startAt = performance.now() + 900; s.target = null; apply(); };
      if (reduce) { next(); s.busy = false; return; }
      setFiring(true);
      later(next, 150);
      later(() => { setFiring(false); s.busy = false; wake(); }, 460);
    };
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const idle = now - touched > 8000;
      if (idle && !s.drag && !s.busy) {
        if (s.target === null && now > startAt) s.target = shots[s.idx].focus;
        if (s.sharp) { if (!heldSince) heldSince = now; else if (now - heldSince > hold) { hold = 2600; fire(false); } } else heldSince = 0;
      }
      if (s.target !== null && !s.drag) {
        // hunt a little past the mark and come back, the way a hand does
        s.vel += (62 * (s.target - s.v) - 9.5 * s.vel) * dt; s.v += s.vel * dt;
        if (Math.abs(s.target - s.v) < 0.0006 && Math.abs(s.vel) < 0.004) { s.v = s.target; s.vel = 0; s.target = null; setRingValue(s.v); }
      }
      apply();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = {
      fire,
      turnTo: (v) => { touched = performance.now(); s.target = null; s.vel = 0; s.v = v; setRingValue(v); if (reduce) apply(); else wake(); },
    };

    // Dragging the ring: the surface follows the finger, and it drops into focus when let go close enough.
    let lastX = 0;
    const onDown = (e: PointerEvent) => { s.drag = true; s.target = null; s.vel = 0; lastX = e.clientX; touched = performance.now(); box.setPointerCapture(e.pointerId); e.preventDefault(); wake(); };
    const onMove = (e: PointerEvent) => {
      if (!s.drag) return;
      touched = performance.now();
      s.v = Math.max(0, Math.min(1, s.v - (e.clientX - lastX) / ((s.W / 2) * SPAN))); lastX = e.clientX;
      if (reduce) apply();
    };
    const onUp = () => {
      if (!s.drag) return;
      s.drag = false; touched = performance.now();
      const want = shots[s.idx].focus;
      if (Math.abs(s.v - want) < 0.05) { if (reduce) { s.v = want; apply(); } else s.target = want; }
      setRingValue(s.v);
    };
    box.addEventListener("pointerdown", onDown); box.addEventListener("pointermove", onMove);
    box.addEventListener("pointerup", onUp); box.addEventListener("pointercancel", onUp);
    const ro = new ResizeObserver(() => { size(); apply(); });
    ro.observe(pane); ro.observe(box);
    size(); apply(); wake();
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(root);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); timers.forEach((t) => window.clearTimeout(t)); api.current = null;
      box.removeEventListener("pointerdown", onDown); box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerup", onUp); box.removeEventListener("pointercancel", onUp);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const shot = shots[index];
  // One copy of the picture, sized and placed to sit exactly over the ground glass wherever it is nested.
  const copy = (extra = "") => (
    <img src={shot.photo} alt="" width={1200} height={800} draggable={false} className={`absolute max-w-none object-cover ${extra}`} style={{ width: "var(--slrvf-w)", height: "var(--slrvf-h)", left: "calc(50% - var(--slrvf-w) / 2)", top: "calc(50% - var(--slrvf-h) / 2)" }} />
  );
  const prism = (shift: string, offset: string) => (
    <div className="absolute inset-0" style={{ WebkitMaskImage: PRISM, maskImage: PRISM, WebkitMaskSize: "7px 7px", maskSize: "7px 7px", WebkitMaskPosition: offset, maskPosition: offset }}>
      <div className="absolute inset-0 will-change-transform" style={{ transform: `translate3d(calc(var(--slrvf-e) * ${shift}), 0, 0)` }}>{copy()}</div>
    </div>
  );

  return (
    <div ref={view} data-focus="near" className="slrvf flex min-h-[560px] w-full flex-col items-center justify-center overflow-hidden bg-[#050506] px-3 py-8 sm:min-h-[780px] sm:px-6" style={{ ["--slrvf-e" as string]: "-0.96", ["--slrvf-a" as string]: "0.96", ["--slrvf-w" as string]: "300px", ["--slrvf-h" as string]: "200px" }}>
      <style>{`
        @keyframes slrvf-slap { 0% { transform: translateY(-102%); } 22% { transform: translateY(0); } 62% { transform: translateY(0); } 100% { transform: translateY(-102%); } }
        .slrvf .slrvf-mirror { transform: translateY(-102%); }
        .slrvf .slrvf-mirror[data-on="true"] { animation: slrvf-slap 460ms cubic-bezier(0.5, 0, 0.3, 1) both; }
        .slrvf .slrvf-led { color: #ff4a36; text-shadow: 0 0 6px rgba(255, 60, 40, 0.85), 0 0 1px #ff9a8a; }
        .slrvf .slrvf-arrow, .slrvf .slrvf-dot { opacity: 0.16; transition: opacity 120ms linear; }
        .slrvf[data-focus="near"] .slrvf-arrow-r, .slrvf[data-focus="far"] .slrvf-arrow-l { opacity: 1; }
        .slrvf[data-focus="ok"] .slrvf-dot { opacity: 1; }
        .slrvf .slrvf-dot { color: #5dff8c; text-shadow: 0 0 7px rgba(70, 255, 130, 0.9); }
        @media (prefers-reduced-motion: reduce) { .slrvf .slrvf-mirror[data-on="true"] { animation: none; } .slrvf .slrvf-arrow, .slrvf .slrvf-dot { transition: none; } }
      `}</style>

      {/* The view through the eyepiece: nothing but black round the screen. */}
      <div className="w-full max-w-[820px]">
        <div className="overflow-hidden rounded-[6px] bg-black sm:rounded-[10px]">
          {/* The ground glass. */}
          <div ref={glass} role="img" aria-label={shot.alt} className="relative aspect-[3/2] w-full overflow-hidden" style={{ backgroundColor: shot.tone }}>
            <img src={shot.photo} alt="" width={1200} height={800} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ opacity: "calc(var(--slrvf-a) * 2.6)" }}>
              <img src={shot.photo} alt="" width={1200} height={800} draggable={false} className="absolute inset-0 h-full w-full scale-[1.02] object-cover blur-[3px] sm:blur-[5px]" />
            </div>
            <div className="absolute inset-0" style={{ opacity: "calc((var(--slrvf-a) - 0.3) * 2.2)" }}>
              <img src={shot.photo} alt="" width={1200} height={800} draggable={false} className="absolute inset-0 h-full w-full scale-[1.06] object-cover blur-[9px] sm:blur-[18px]" />
            </div>
            {/* fresnel rings and the grain of the screen */}
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.5] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
            <div aria-hidden="true" className="absolute inset-0 bg-[repeating-radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.035)_0_1px,rgba(0,0,0,0)_1px_4px)]" />

            {/* microprism collar: two copies seen through opposite squares of a fine check, pulled apart when out of focus */}
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 aspect-square h-[40%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.42),0_0_0_2px_rgba(255,255,255,0.14)]">
              {prism("5.5%", "0 0")}
              {prism("-5.5%", "3.5px 0")}
              <div className="absolute inset-0 bg-black" style={{ opacity: "calc(var(--slrvf-a) * 0.22)" }} />
              <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: PRISM, backgroundSize: "7px 7px" }} />
            </div>
            {/* split image: the top half slides one way and the bottom half the other until the edges meet */}
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 aspect-square h-[23%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_0_0_2px_rgba(255,255,255,0.18)]">
              <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden">
                <div className="absolute left-0 top-0 h-[200%] w-full will-change-transform" style={{ transform: "translate3d(calc(var(--slrvf-e) * 17%), 0, 0)" }}>{copy()}</div>
              </div>
              <div className="absolute inset-x-0 top-1/2 h-1/2 overflow-hidden">
                <div className="absolute left-0 top-[-100%] h-[200%] w-full will-change-transform" style={{ transform: "translate3d(calc(var(--slrvf-e) * -17%), 0, 0)" }}>{copy()}</div>
              </div>
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/45" />
              <div className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0)_45%,rgba(0,0,0,0.08))]" />
            </div>

            {/* the edge of the eyepiece and the mirror that swings up when the shutter fires */}
            <div aria-hidden="true" className="absolute inset-0 shadow-[inset_0_0_90px_10px_rgba(0,0,0,0.55),inset_0_0_10px_1px_rgba(0,0,0,0.7)]" />
            <div aria-hidden="true" data-on={firing} className="slrvf-mirror absolute inset-0 bg-black" />
          </div>

          {/* readout along the bottom of the finder */}
          <div className="flex h-[26px] items-center justify-between bg-black px-3 font-mono text-[11px] font-bold tracking-[0.12em] sm:h-[38px] sm:px-6 sm:text-[15px]">
            <span className="slrvf-led">{shot.speed}<span className="mx-2 opacity-60 sm:mx-3">F{shot.stop}</span></span>
            <span aria-hidden="true" className="flex items-center gap-2 sm:gap-3">
              <span className="slrvf-led slrvf-arrow slrvf-arrow-r">{"▶"}</span>
              <span className="slrvf-dot text-[13px] sm:text-[17px]">{"●"}</span>
              <span className="slrvf-led slrvf-arrow slrvf-arrow-l">{"◀"}</span>
            </span>
            <span className="slrvf-led">{String(index + 1).padStart(2, "0")}<span className="opacity-60">/{String(shots.length).padStart(2, "0")}</span></span>
          </div>
        </div>
      </div>

      {/* The lens barrel from above, and the shutter release. */}
      <div className="mt-6 flex w-full max-w-[620px] items-center gap-4 sm:mt-8 sm:gap-7">
        <div className="relative min-w-0 flex-1">
          <div ref={ringBox} className="relative h-[66px] w-full cursor-ew-resize touch-none overflow-hidden rounded-[5px] shadow-[0_16px_26px_-10px_rgba(0,0,0,1),0_0_0_1px_rgba(0,0,0,1)] sm:h-[82px]">
            <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
          </div>
          <span aria-hidden="true" className="absolute left-1/2 top-full mt-[5px] h-[9px] w-[2px] -translate-x-1/2 rounded-full" style={{ backgroundColor: INDEX }} />
          <label htmlFor="slrvf-ring" className="sr-only">Focus ring</label>
          <input
            id="slrvf-ring"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={Math.round(ringValue * 100) / 100}
            onChange={(e) => api.current?.turnTo(Number(e.target.value))}
            aria-valuetext={sharp ? "In focus" : "Out of focus"}
            className="peer pointer-events-none absolute inset-0 h-full w-full opacity-0"
          />
          <span aria-hidden="true" className="pointer-events-none absolute -inset-[5px] rounded-[9px] ring-2 ring-[#ff8a3c] opacity-0 peer-focus-visible:opacity-100" />
        </div>
        <button
          type="button"
          onClick={() => api.current?.fire(true)}
          aria-label="Release the shutter and wind on to the next frame"
          className="group relative h-[58px] w-[58px] shrink-0 rounded-full bg-[conic-gradient(from_210deg,#f4f5f7,#6d7178_14%,#d9dbdf_28%,#3d4046_44%,#babdc3_58%,#55585e_72%,#eceef0_86%,#f4f5f7)] shadow-[0_14px_22px_-8px_rgba(0,0,0,1),0_2px_3px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(0,0,0,0.45)] outline-none transition-transform duration-100 focus-visible:ring-2 focus-visible:ring-[#ff8a3c] focus-visible:ring-offset-4 focus-visible:ring-offset-[#050506] active:translate-y-[1px] active:scale-[0.97] motion-reduce:transition-none sm:h-[72px] sm:w-[72px]"
        >
          <span aria-hidden="true" className="absolute inset-[7px] rounded-full bg-[conic-gradient(from_30deg,#2a2c30,#8d9097_18%,#e9eaed_30%,#7a7d84_46%,#33353a_62%,#a9acb2_80%,#2a2c30)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.55)]" />
          <span aria-hidden="true" className="absolute inset-[11px] rounded-full bg-[radial-gradient(circle_at_50%_70%,#f3f4f6_0%,#b3b6bc_38%,#5c5f66_78%,#2c2e32_100%)] shadow-[inset_0_3px_5px_rgba(0,0,0,0.55),inset_0_-1px_1px_rgba(255,255,255,0.7)] transition-shadow group-active:shadow-[inset_0_5px_8px_rgba(0,0,0,0.75)]" />
          <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#050506_45%,#3a3c41_60%,#0c0c0d_100%)] shadow-[0_1px_0_rgba(255,255,255,0.55)] sm:h-[12px] sm:w-[12px]" />
        </button>
      </div>
      <p aria-live="polite" className="mt-6 min-h-[20px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-zinc-400 sm:mt-7">
        <span className="text-zinc-100">{sharp ? "In focus" : "Turn the ring"}</span>
        <span className="mx-2 text-zinc-600">/</span>
        {sharp ? "press the release" : "line up the two halves"}
      </p>
    </div>
  );
}
