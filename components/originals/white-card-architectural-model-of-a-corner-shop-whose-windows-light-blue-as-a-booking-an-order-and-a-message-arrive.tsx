import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// What arrives at the shop. An invented bakery; edit the three lines freely.
const arrivals = [
  { kind: "Booking", text: "Table for two, Friday at seven" },
  { kind: "Order", text: "Six cardamom buns to collect" },
  { kind: "Message", text: "Do you cater for birthdays?" },
];
const SHOP = "MARLOW & FIG"; // debossed on the fascia strip
const BLUE = "#4F98FB";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

// The model, in card millimetres (well, pixels). y is 0 at the top of the baseboard and negative going up.
const W = 300, H = 250, D = 200; // the building
const BW = 540, BD = 420; // the baseboard
const BOX = 860, BOXH = 560; // the box the whole model is laid out in
const TILT = -23; // how far the camera looks down
const HOME = -31; // resting turn of the model

type FaceProps = { w: number; h: number; t: string; bg?: string; style?: CSSProperties; className?: string; children?: ReactNode };
function Face({ w, h, t, bg, style, className, children }: FaceProps) {
  return (
    <div aria-hidden="true" className={"absolute left-0 top-0 " + (className || "")} style={{ width: w, height: h, transform: t, transformOrigin: "0 0", background: bg, backfaceVisibility: "hidden", ...style }}>
      {children}
    </div>
  );
}
// A closed card box: x and z are its centre on the board, y its underside.
function Box({ x, y, z, w, h, d, top, front, right, left }: { x: number; y: number; z: number; w: number; h: number; d: number; top: string; front: string; right: string; left: string }) {
  const edge: CSSProperties = { boxShadow: "inset 0 0 0 0.6px rgba(60,54,40,0.10)" };
  return (
    <>
      <Face w={w} h={h} bg={front} style={edge} t={`translate3d(${x - w / 2}px,${y - h}px,${z + d / 2}px)`} />
      <Face w={d} h={h} bg={right} style={edge} t={`translate3d(${x + w / 2}px,${y - h}px,${z + d / 2}px) rotateY(90deg)`} />
      <Face w={d} h={h} bg={left} style={edge} t={`translate3d(${x - w / 2}px,${y - h}px,${z - d / 2}px) rotateY(-90deg)`} />
      <Face w={w} h={h} bg={left} style={edge} t={`translate3d(${x + w / 2}px,${y - h}px,${z - d / 2}px) rotateY(180deg)`} />
      <Face w={w} h={d} bg={top} style={edge} t={`translate3d(${x - w / 2}px,${y - h}px,${z - d / 2}px) rotateX(90deg)`} />
    </>
  );
}

// Openings cut in the front sheet: [x, y, w, h, which arrival lights it]
const UP_L = [38, 34, 84, 64], UP_R = [178, 34, 84, 64], SHOPWIN = [22, 150, 158, 78], DOOR = [202, 146, 62, 104];
const panes = (r: number[], cols: number, rows: number, bar = 4) => {
  const pw = (r[2] - bar * (cols - 1)) / cols, ph = (r[3] - bar * (rows - 1)) / rows;
  let d = "";
  for (let c = 0; c < cols; c++) for (let q = 0; q < rows; q++) d += `M${r[0] + c * (pw + bar)} ${r[1] + q * (ph + bar)}h${pw}v${ph}h${-pw}z`;
  return d;
};
const FRONT_CUT = `M0 0H${W}V${H}H0Z` + panes(UP_L, 2, 2) + panes(UP_R, 2, 2) + panes(SHOPWIN, 3, 1) + `M${DOOR[0]} ${DOOR[1]}h${DOOR[2]}v${DOOR[3]}h${-DOOR[2]}z`;
const SIDE_WIN = [58, 34, 84, 64];
const SIDE_CUT = `M0 0H${D}V${H}H0Z` + panes(SIDE_WIN, 2, 2);

const CARD = "linear-gradient(180deg,#FBF9F5 0%,#F3F0EA 100%)";
const CARD_SIDE = "linear-gradient(180deg,#E6E2DA 0%,#DAD6CD 100%)";
const CARD_DARK = "linear-gradient(180deg,#D6D2C9 0%,#CAC5BB 100%)";
const UNLIT = "linear-gradient(180deg,#B9B4AA 0%,#CBC6BC 100%)";
const LIT = `radial-gradient(120% 120% at 50% 35%,#FFFFFF 0%,#D9E9FF 30%,${BLUE} 100%)`;

export default function CardModelShop() {
  const stage = useRef<HTMLDivElement>(null);
  const model = useRef<HTMLDivElement>(null);
  const touched = useRef(-1e9);
  const [zoom, setZoom] = useState(1);
  const [lit, setLit] = useState([true, true, true]); // starts with every room lit, then plays
  const [said, setSaid] = useState("");

  useEffect(() => {
    const st = stage.current, el = model.current;
    if (!st || !el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fit = () => setZoom(Math.max(0.4, Math.min(1, (st.clientWidth + 24) / BOX)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(st);
    if (reduce) { el.style.transform = `rotateX(${TILT}deg) rotateY(${HOME}deg)`; return () => ro.disconnect(); }

    // the turntable: a spring towards a slow sway, or towards wherever it was last dropped
    const s = { a: HOME - 7, v: 0, off: 0, drag: false, gx: 0, ga: 0, lx: 0, lt: 0 };
    let raf = 0, last = 0, seen = true;
    const t0 = performance.now();
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.max(0.004, Math.min(0.032, (now - last) / 1000 || 0.016)); last = now;
      if (!s.drag) {
        const to = HOME + s.off + 6 * Math.sin((now - t0) / 2600);
        s.v += (26 * (to - s.a) - 7.5 * s.v) * dt; s.a += s.v * dt;
      }
      el.style.transform = `rotateX(${TILT}deg) rotateY(${s.a.toFixed(3)}deg)`;
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      s.drag = true; s.gx = e.clientX; s.ga = s.a; s.lx = e.clientX; s.lt = performance.now(); s.v = 0; touched.current = performance.now();
      st.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!s.drag) return;
      const now = performance.now(), next = Math.max(-74, Math.min(14, s.ga + (e.clientX - s.gx) * 0.32));
      s.v = (next - s.a) / Math.max(0.008, (now - s.lt) / 1000) * 0.6; s.a = next; s.lt = now;
    };
    const up = () => { if (!s.drag) return; s.drag = false; s.off = Math.max(-36, Math.min(38, s.a + s.v * 0.12 - HOME)); };
    st.addEventListener("pointerdown", down);
    st.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(st);
    const vis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", vis);
    wake();

    // The demo: rooms go dark, then a booking, an order and a message arrive one at a time.
    const steps: [number, () => void][] = [
      [3800, () => setLit([false, false, false])],
      [1300, () => setLit([true, false, false])],
      [1500, () => setLit([true, true, false])],
      [1500, () => setLit([true, true, true])],
      [3600, () => {}],
    ];
    let timer = 0, i = 0;
    const next = () => {
      const [wait, run] = steps[i];
      timer = window.setTimeout(() => {
        if (performance.now() - touched.current > 9000 && seen && !document.hidden) { run(); i = i === steps.length - 1 ? 0 : i + 1; if (i === 0) steps[0][0] = 400; }
        next();
      }, wait);
    };
    next();
    return () => {
      cancelAnimationFrame(raf); window.clearTimeout(timer); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      st.removeEventListener("pointerdown", down); st.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
    };
  }, []);

  const press = (i: number) => {
    touched.current = performance.now();
    setLit((was) => was.map((on, k) => (k === i ? !on : on)));
    setSaid(lit[i] ? `${arrivals[i].kind} cleared` : `${arrivals[i].kind}: ${arrivals[i].text}`);
  };

  const fz = D / 2; // z of the front sheet
  const on = (i: number, extra?: CSSProperties): CSSProperties => ({ opacity: lit[i] ? 1 : 0, transition: "opacity 420ms ease-out", ...extra });
  const lamp = (i: number) => (lit[i] ? "card-model-shop-catch" : "");
  // a lit room behind an opening in the front sheet
  const room = (r: number[], i: number, key: string) => (
    <Face key={key} w={r[2] + 16} h={r[3] + 16} bg={UNLIT} t={`translate3d(${-W / 2 + r[0] - 8}px,${-H + r[1] - 8}px,${fz - 16}px)`}>
      <div className={"absolute inset-0 " + lamp(i)} style={on(i, { background: LIT })} />
    </Face>
  );
  const halo = (r: number[], i: number, key: string) => (
    <Face key={key} w={r[2] + 70} h={r[3] + 70} t={`translate3d(${-W / 2 + r[0] - 35}px,${-H + r[1] - 35}px,${fz + 1.5}px)`} className={lamp(i)} style={on(i, { background: "radial-gradient(closest-side,rgba(79,152,251,0.42),rgba(79,152,251,0.12) 60%,rgba(79,152,251,0))" })} />
  );

  return (
    <div className="relative flex min-h-[620px] w-full flex-col items-center justify-center overflow-hidden bg-[#F6F4EF] bg-[radial-gradient(70%_55%_at_50%_42%,#FFFFFF_0%,#F6F4EF_55%,#E9E5DC_100%)] px-4 py-10 text-[#0B0D12] sm:min-h-[760px]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes card-model-shop-catch { 0% { opacity: 0; } 18% { opacity: .8; } 30% { opacity: .25; } 48% { opacity: .9; } 60% { opacity: .6; } 100% { opacity: 1; } }
        .card-model-shop-catch { animation: card-model-shop-catch 620ms ease-out both; }
        .card-model-shop-flag { transition: transform 520ms cubic-bezier(.3,1.6,.5,1); }
        @media (prefers-reduced-motion: reduce) { .card-model-shop-catch { animation: none; } .card-model-shop-flag { transition: none; } }
      `}</style>

      <div ref={stage} className="relative flex w-full max-w-[900px] cursor-grab touch-pan-y justify-center active:cursor-grabbing" style={{ height: BOXH * zoom }}>
        <div className="relative shrink-0" style={{ width: BOX, height: BOXH, zoom, perspective: 1700, perspectiveOrigin: "50% 30%" }}>
          <div ref={model} className="absolute" style={{ left: BOX / 2 + 10, top: 392, width: 0, height: 0, transformStyle: "preserve-3d", transform: `rotateX(${TILT}deg) rotateY(${HOME}deg)` }}>
            {/* shadow the baseboard throws on the table */}
            <Face w={BW + 220} h={BD + 220} t={`translate3d(${-(BW + 220) / 2 - 26}px,27px,${-(BD + 220) / 2 - 10}px) rotateX(90deg)`} style={{ background: "radial-gradient(closest-side,rgba(40,34,20,0.34),rgba(40,34,20,0.16) 55%,rgba(40,34,20,0))", filter: "blur(10px)", backfaceVisibility: "visible" }} />
            {/* black base, then the grey modelling board */}
            <Box x={0} y={26} z={0} w={BW + 16} h={8} d={BD + 16} top="#1B1E25" front="linear-gradient(180deg,#22252D,#0B0D12)" right="#0B0D12" left="#0B0D12" />
            <Box x={0} y={18} z={0} w={BW} h={18} d={BD} top="linear-gradient(180deg,#E6E2DA,#EDEAE3)" front="linear-gradient(180deg,#D3CEC4,#C4BFB4)" right="linear-gradient(180deg,#BFBAAF,#B1ACA0)" left="#B1ACA0" />
            {/* on the board: the building's shadow, a scored pavement line, and the light that falls out of the shop */}
            <Face w={BW} h={BD} t={`translate3d(${-BW / 2}px,-0.5px,${-BD / 2}px) rotateX(90deg)`}>
              <div className="absolute" style={{ left: BW / 2 - W / 2 - 92, top: BD / 2 - D / 2 - 30, width: W + 84, height: D + 40, background: "rgba(52,46,32,0.4)", filter: "blur(14px)", borderRadius: 8 }} />
              <div className="absolute" style={{ left: BW / 2 - W / 2 - 5, top: BD / 2 + D / 2 - 4, width: W + 8, height: 10, background: "rgba(52,46,32,0.3)", filter: "blur(4px)" }} />
              {[[122, D / 2 + 44, 30], [-96, D / 2 + 96, 30], [-212, D / 2 + 40, 54]].map(([x, z, w], k) => (
                <div key={k} className="absolute rounded-full" style={{ left: BW / 2 + x - w * 0.9, top: BD / 2 + z - w * 0.32, width: w * 1.3, height: w * 0.5, background: "rgba(52,46,32,0.34)", filter: "blur(4px)" }} />
              ))}
              <div className="absolute" style={{ left: 22, right: 22, top: BD / 2 + D / 2 + 62, height: 1, background: "rgba(60,54,40,0.16)", boxShadow: "0 1px 0 rgba(255,255,255,0.7)" }} />
              <div className={"absolute " + lamp(1)} style={on(1, { left: BW / 2 - W / 2 - 14, top: BD / 2 + D / 2, width: 250, height: 104, clipPath: "polygon(14% 0,86% 0,100% 100%,0 100%)", background: "linear-gradient(180deg,rgba(79,152,251,0.5),rgba(79,152,251,0.1) 70%,rgba(79,152,251,0))", filter: "blur(5px)" })} />
            </Face>

            {/* the walls that are plain sheets */}
            <Face w={D} h={H} bg={CARD_DARK} t={`translate3d(${-W / 2}px,${-H}px,${-D / 2}px) rotateY(-90deg)`} />
            <Face w={W} h={H} bg={CARD_DARK} t={`translate3d(${W / 2}px,${-H}px,${-D / 2}px) rotateY(180deg)`} />
            <Face w={W} h={D} bg="#E9E6DF" t={`translate3d(${-W / 2}px,${-H + 9}px,${-D / 2}px) rotateX(90deg)`} style={{ boxShadow: "inset 10px 12px 14px rgba(60,54,40,0.16)" }} />
            {/* inside faces of the parapet, seen over the roof */}
            <Face w={W} h={9} bg="#E0DCD4" t={`translate3d(${-W / 2}px,${-H}px,${-D / 2 + 3}px)`} />
            <Face w={D} h={9} bg="#D2CEC5" t={`translate3d(${-W / 2 + 3}px,${-H}px,${D / 2}px) rotateY(90deg)`} />
            <Box x={-70} y={-H + 9} z={-36} w={46} h={26} d={46} top="#FBF9F5" front={CARD} right={CARD_SIDE} left={CARD_DARK} />

            {/* rooms behind the openings */}
            {room(UP_L, 0, "r0")}
            {room(SHOPWIN, 1, "r1")}
            {room(UP_R, 2, "r2")}
            <Face w={SIDE_WIN[2] + 16} h={SIDE_WIN[3] + 16} bg={UNLIT} t={`translate3d(${W / 2 - 16}px,${-H + SIDE_WIN[1] - 8}px,${fz - SIDE_WIN[0] + 8}px) rotateY(90deg)`}>
              <div className={"absolute inset-0 " + lamp(2)} style={on(2, { background: LIT })} />
            </Face>
            {/* shelves of loaves standing just inside the shop window */}
            <Face w={SHOPWIN[2]} h={SHOPWIN[3]} t={`translate3d(${-W / 2 + SHOPWIN[0]}px,${-H + SHOPWIN[1]}px,${fz - 9}px)`}>
              <svg viewBox="0 0 158 78" className="h-full w-full">
                <g fill="#2B3445" opacity="0.72">
                  <rect x="6" y="36" width="146" height="2.4" /><rect x="6" y="70" width="146" height="2.4" />
                  {[14, 44, 76, 108, 132].map((x, k) => <ellipse key={k} cx={x + 9} cy={k % 2 ? 30 : 29} rx={k % 2 ? 12 : 10} ry={k % 2 ? 6 : 7} />)}
                  {[20, 58, 96, 126].map((x, k) => <rect key={k} x={x} y={k % 2 ? 54 : 50} width={k % 2 ? 22 : 26} height={k % 2 ? 16 : 20} rx="7" />)}
                </g>
              </svg>
            </Face>
            {/* the door, set back in its opening, with one glazed pane */}
            <Face w={DOOR[2]} h={DOOR[3]} bg={CARD_SIDE} t={`translate3d(${-W / 2 + DOOR[0]}px,${-H + DOOR[1]}px,${fz - 7}px)`} style={{ boxShadow: "inset 5px 6px 8px rgba(60,54,40,0.22)" }}>
              <div className="absolute overflow-hidden" style={{ left: 12, top: 12, width: 38, height: 46, background: UNLIT, boxShadow: "inset 1px 2px 3px rgba(40,34,20,0.35)" }}>
                <div className={"absolute inset-0 " + lamp(1)} style={on(1, { background: LIT })} />
              </div>
              <div className="absolute rounded-full" style={{ left: 9, top: 68, width: 5, height: 5, background: "#8E897E", boxShadow: "0 1px 1px rgba(0,0,0,0.3)" }} />
            </Face>

            {/* the cut sheets: three layers so the openings show the thickness of the card */}
            {[4, 2, 0].map((back) => (
              <Face key={"f" + back} w={W} h={H} t={`translate3d(${-W / 2}px,${-H}px,${fz - back}px)`}>
                <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
                  <defs><linearGradient id={"card-model-shop-f" + back} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={back ? "#CFCAC0" : "#FCFAF6"} /><stop offset="1" stopColor={back ? "#C3BEB3" : "#F1EEE7"} /></linearGradient></defs>
                  <path d={FRONT_CUT} fillRule="evenodd" fill={`url(#card-model-shop-f${back})`} stroke="rgba(60,54,40,0.14)" strokeWidth="0.6" />
                </svg>
              </Face>
            ))}
            {[4, 2, 0].map((back) => (
              <Face key={"s" + back} w={D} h={H} t={`translate3d(${W / 2 - back}px,${-H}px,${fz}px) rotateY(90deg)`}>
                <svg viewBox={`0 0 ${D} ${H}`} className="h-full w-full">
                  <path d={SIDE_CUT} fillRule="evenodd" fill={back ? "#B5B0A5" : "#E1DDD5"} stroke="rgba(60,54,40,0.14)" strokeWidth="0.6" />
                  {!back && <rect x="0" y="0" width={D} height={H} fill="url(#card-model-shop-sg)" />}
                  <defs><linearGradient id="card-model-shop-sg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0.18" /><stop offset="1" stopColor="#000" stopOpacity="0.05" /></linearGradient></defs>
                </svg>
              </Face>
            ))}
            {/* blue that leaks onto the card round each lit opening */}
            {halo(UP_L, 0, "h0")}
            {halo(SHOPWIN, 1, "h1")}
            {halo(UP_R, 2, "h2")}
            <Face w={SIDE_WIN[2] + 70} h={SIDE_WIN[3] + 70} t={`translate3d(${W / 2 + 1.5}px,${-H + SIDE_WIN[1] - 35}px,${fz - SIDE_WIN[0] + 35}px) rotateY(90deg)`} className={lamp(2)} style={on(2, { background: "radial-gradient(closest-side,rgba(79,152,251,0.36),rgba(79,152,251,0.1) 60%,rgba(79,152,251,0))" })} />

            {/* fascia strip with the name pressed into it, sills, and the awning */}
            <Box x={0} y={-H + 138} z={fz + 2.5} w={W - 20} h={22} d={5} top="#FFFFFF" front={CARD} right={CARD_SIDE} left={CARD_DARK} />
            <Face w={W - 20} h={22} t={`translate3d(${-W / 2 + 10}px,${-H + 116}px,${fz + 5.2}px)`} className="flex items-center justify-center">
              <span className="text-[11px] font-extrabold tracking-[0.34em]" style={{ color: "#A7A297", textShadow: "0 1px 0 rgba(255,255,255,0.9), 0 -0.5px 0 rgba(60,54,40,0.35)" }}>{SHOP}</span>
            </Face>
            {[UP_L, UP_R].map((r, k) => <Box key={k} x={-W / 2 + r[0] + r[2] / 2} y={-H + r[1] + r[3] + 5} z={fz + 3} w={r[2] + 12} h={5} d={6} top="#FFFFFF" front={CARD} right={CARD_SIDE} left={CARD_DARK} />)}
            <Face w={SHOPWIN[2] + 14} h={50} t={`translate3d(${-W / 2 + SHOPWIN[0] - 7}px,${-H + 139}px,${fz + 5}px) rotateX(62deg)`} style={{ background: "repeating-linear-gradient(90deg,#FDFCF9 0 14px,#E7E3DB 14px 28px)", boxShadow: "inset 0 0 0 0.6px rgba(60,54,40,0.16)", backfaceVisibility: "visible" }} />

            {/* scale figures and a slotted card tree */}
            {[{ x: 122, z: 44, flip: 1 }, { x: -96, z: 96, flip: -1 }].map((p, k) => (
              <Face key={k} w={34} h={84} t={`translate3d(${p.x}px,-84px,${fz + p.z}px)`} style={{ backfaceVisibility: "visible" }}>
                <svg viewBox="0 0 34 84" className="h-full w-full" style={{ transform: `scaleX(${p.flip})`, filter: "drop-shadow(-1.5px 1px 0 #BDB8AD)" }}>
                  <path d="M17 2a6.5 6.5 0 1 1 0 13a6.5 6.5 0 0 1 0-13ZM9 20c2-3 14-3 16 0l3 24h-4l-1-12v20l2 30h-6l-2-26l-2 26H9l2-30V32l-1 12H6Z" fill="#FAF8F4" stroke="rgba(60,54,40,0.2)" strokeWidth="0.6" />
                </svg>
              </Face>
            ))}
            {[0, 90].map((r) => (
              <div key={r} aria-hidden="true" className="absolute left-0 top-0" style={{ transformStyle: "preserve-3d", transform: `translate3d(-212px,0,${fz + 40}px) rotateY(${r}deg)` }}>
                <div className="absolute" style={{ left: -1.5, top: -64, width: 3, height: 64, background: "#C9C4BA" }} />
                <div className="absolute rounded-full" style={{ left: -44, top: -138, width: 88, height: 88, background: r ? "#EDEAE3" : "radial-gradient(circle at 35% 30%,#FFFFFF,#EFECE5 70%)", boxShadow: "inset 0 0 0 0.6px rgba(60,54,40,0.2)" }} />
              </div>
            ))}

            {/* three paper flags on pins that stand up as each thing arrives */}
            {arrivals.map((a, i) => (
              <div key={a.kind} aria-hidden="true" className="absolute left-0 top-0" style={{ transformStyle: "preserve-3d", transform: `translate3d(${-56 + i * 88}px,0,${fz + 88}px)` }}>
                <div className="absolute rounded-full" style={{ left: -5, top: -2, width: 10, height: 4, background: "rgba(40,34,20,0.25)", filter: "blur(1.5px)", transform: "rotateX(90deg)" }} />
                <div className="card-model-shop-flag absolute left-0 top-0" style={{ transformStyle: "preserve-3d", transformOrigin: "0 0", transform: lit[i] ? "rotateX(0deg)" : "rotateX(84deg)" }}>
                  <div className="absolute" style={{ left: -1, top: -46, width: 2, height: 46, background: "linear-gradient(90deg,#8D929B,#E9ECF0 45%,#70757E)" }} />
                  <div className="absolute rounded-full" style={{ left: -3.5, top: -51, width: 7, height: 7, background: "radial-gradient(circle at 35% 30%,#FFFFFF,#9AA0AA 60%,#5A5F68)" }} />
                  <div className="absolute flex items-center justify-center" style={{ left: 1, top: -45, width: 56, height: 19, background: `linear-gradient(180deg,#6BA9FC,${BLUE})`, clipPath: "polygon(0 0,100% 0,90% 50%,100% 100%,0 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)" }}>
                    <span className="pr-1.5 text-[8px] font-extrabold uppercase tracking-[0.1em] text-white">{a.kind}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ul className="relative z-10 mt-6 flex w-full max-w-[860px] flex-col items-stretch justify-center gap-2 sm:flex-row sm:gap-3">
        {arrivals.map((a, i) => (
          <li key={a.kind} className="sm:min-w-0 sm:flex-1">
            <button type="button" aria-pressed={lit[i]} onClick={() => press(i)} className="flex min-h-[48px] w-full items-center gap-3 rounded-full bg-white px-4 py-2 text-left shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_1px_2px_rgba(40,34,20,0.12),0_10px_24px_-12px_rgba(40,34,20,0.3)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F4EF] active:scale-[0.98] motion-reduce:transition-none">
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full transition-all duration-300 motion-reduce:transition-none" style={{ background: lit[i] ? BLUE : "#D5D1C8", boxShadow: lit[i] ? "0 0 0 4px rgba(79,152,251,0.18), 0 0 12px rgba(79,152,251,0.8)" : "inset 0 1px 1px rgba(0,0,0,0.2)" }} />
              <span className="min-w-0 leading-tight">
                <span className="block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0B0D12]">{a.kind}</span>
                <span className="block truncate text-[13px] font-semibold tracking-tight transition-colors duration-300" style={{ color: lit[i] ? "#3F434C" : "#6E6A61" }}>{lit[i] ? a.text : "Nothing in yet"}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="relative z-10 mt-5 text-center text-[12px] font-semibold tracking-tight text-[#5F5B52]">Marlow &amp; Fig is an invented bakery. The model plays by itself: drag to turn it, press a slip to light a room.</p>
      <p className="sr-only" role="status" aria-live="polite">{said}</p>
    </div>
  );
}
