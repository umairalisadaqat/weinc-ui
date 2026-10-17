import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useReducedMotion } from "framer-motion";

const BLUE = "#4F98FB";
const INK = "#0B0D12";
const PAPER = "#F6F4EF";
const sans = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

/** What is printed straight onto the page and never moves. */
const page = {
  brand: "Ostra Ceramics",
  links: ["Shop", "Classes", "Studio"],
  sub: "Small batches, glazed in sea colours. Wheel classes every Saturday.",
};

type Side = { text: string; photo?: string; alt?: string; tone?: "paper" | "ink" | "blue" };
type Piece = { id: string; label: string; x: number; y: number; w: number; h: number; radius: number; axis: "X" | "Y"; edge: string; sides: [Side, Side] };

/** The loose pieces. Each one has a second version on its back: lift it, let go, and it lands the other way up. */
const pieces: Piece[] = [
  {
    id: "photo", label: "Photo", x: 404, y: 82, w: 182, h: 300, radius: 14, axis: "Y", edge: "#e4dfd4",
    sides: [
      { text: "Hands shaping a bowl on the wheel", photo: "https://images.pexels.com/photos/37222842/pexels-photo-37222842.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Two hands shaping a small clay bowl on a spinning wheel, seen from above" },
      { text: "Hands raising a tall clay form", photo: "https://images.pexels.com/photos/36370411/pexels-photo-36370411.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Hands raising a tall form in wet grey clay on a pottery wheel" },
    ],
  },
  {
    id: "headline", label: "Headline", x: 34, y: 84, w: 344, h: 142, radius: 12, axis: "X", edge: "#d9d3c7",
    sides: [
      { text: "Cups made slowly.", tone: "paper" },
      { text: "Thrown by hand.", tone: "ink" },
    ],
  },
  {
    id: "button", label: "Button", x: 34, y: 328, w: 204, h: 56, radius: 28, axis: "X", edge: "#2c62b8",
    sides: [
      { text: "Book a class", tone: "blue" },
      { text: "Shop the kiln", tone: "ink" },
    ],
  },
];

// Design pixels. The scene is scaled to fit its frame.
const W = 620;
const H = 420;
const SCENE_W = 900;
const SCENE_H = 500;
const T = 12; // thickness of a piece
const LIFT = 124;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function SideFace({ p, side, back }: { p: Piece; side: Side; back: boolean }) {
  const turn = back ? `rotate${p.axis}(180deg) ` : "";
  const base: CSSProperties = { borderRadius: p.radius, transform: `${turn}translateZ(${T / 2 + 0.6}px)`, backfaceVisibility: "hidden" };
  if (side.photo)
    return (
      <span className="absolute inset-0 block overflow-hidden" style={{ ...base, background: "#6f6a63" }}>
        <img src={side.photo} alt="" width={p.w} height={p.h} draggable={false} className="h-full w-full object-cover" />
        <span className="absolute inset-0" style={{ borderRadius: p.radius, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22), inset 0 1.5px 0 rgba(255,255,255,0.45)", background: "linear-gradient(140deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 32%, rgba(0,0,0,0.12) 100%)" }} />
      </span>
    );
  const ink = side.tone === "ink";
  const blue = side.tone === "blue";
  const big = p.id === "headline";
  return (
    <span
      className={`absolute inset-0 flex items-center ${big ? "px-[18px] text-[53px] font-black leading-[0.94] tracking-[-0.055em]" : "justify-center gap-2 text-[16px] font-extrabold tracking-[-0.02em]"}`}
      style={{
        ...base,
        color: ink ? "#F6F4EF" : INK,
        background: blue ? `linear-gradient(180deg, #73affd 0%, ${BLUE} 48%, #3f84e6 100%)` : ink ? "linear-gradient(180deg, #232733 0%, #10131a 100%)" : "linear-gradient(180deg, #ffffff 0%, #f8f6f1 100%)",
        boxShadow: ink ? "inset 0 1.5px 0 rgba(255,255,255,0.20), inset 0 0 0 1px rgba(255,255,255,0.07)" : blue ? "inset 0 1.5px 0 rgba(255,255,255,0.55), inset 0 -2px 0 rgba(11,13,18,0.14)" : "inset 0 1.5px 0 #ffffff, inset 0 0 0 1px rgba(11,13,18,0.07), inset 0 -2px 0 rgba(11,13,18,0.06)",
      }}
    >
      {side.text}
      {!big && (
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10h12M11 5l5 5-5 5" />
        </svg>
      )}
    </span>
  );
}

export default function LiftOutPageEdit() {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<number[]>(pieces.map(() => 0));
  const [held, setHeld] = useState(-1);
  const api = useRef<{ press: (i: number) => void } | null>(null);

  useEffect(() => {
    const stage = stageRef.current, wrap = wrapRef.current, scene = sceneRef.current, pg = pageRef.current, cursor = cursorRef.current;
    if (!stage || !wrap || !scene || !pg || !cursor) return;
    const q = (sel: string) => Array.from(pg.querySelectorAll<HTMLElement>(sel));
    const movers = q("[data-mover]"), turners = q("[data-turner]"), shadows = q("[data-shadow]"), contacts = q("[data-contact]"), sockets = q("[data-socket]"), anchors = q("[data-anchor]");
    const sim = pieces.map((p) => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, tx: 0, ty: 0, tz: 0, rot: 0, vrot: 0, trot: 0, lx: 0, ly: 0, mode: "rest" as "rest" | "held" | "turn" | "seat", until: 0, flash: 0, axis: p.axis }));
    const s = { scale: 1, dip: 0, vdip: 0, px: 0, py: 0, tpx: 0, tpy: 0, user: -1e9, drag: -1, sx: 0, sy: 0, cx: 0, cy: 0, cshow: 0, demoI: 0, demoPhase: "wait" as "wait" | "go" | "hold" | "after", demoT: performance.now() + 250, first: true };
    let raf = 0;
    let visible = true;
    let last = performance.now();

    const measure = () => {
      const sc = clamp(wrap.clientWidth / 745, 0.4, 1.3);
      s.scale = sc;
      wrap.style.height = `${Math.round(SCENE_H * sc)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    const sr0 = stage.getBoundingClientRect();
    s.cx = sr0.width * 0.78;
    s.cy = sr0.height * 0.9;

    const lift = (i: number, now: number, auto: number) => {
      const p = sim[i];
      if (reduce) return;
      p.mode = "held";
      p.tz = LIFT;
      p.until = auto ? now + auto : 0;
      setHeld(i);
    };
    const letGo = (i: number) => {
      const p = sim[i];
      p.trot += 180;
      p.tx = 0;
      p.ty = 0;
      p.until = 0;
      setShown((v) => v.map((f, k) => (k === i ? 1 - f : f)));
      setHeld(-1);
      if (reduce) {
        p.rot = p.trot;
        p.mode = "rest";
        return;
      }
      p.mode = "turn";
    };

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      // the self-playing hand: go to a piece, pick it up, hold it, let it go
      const demoOn = !reduce && now - s.user > 7000 && s.drag < 0;
      if (demoOn) {
        const i = s.demoI, p = sim[i];
        if (s.demoPhase === "wait" && now > s.demoT) {
          s.demoPhase = "go";
          s.demoT = now + (s.first ? 420 : 620);
        } else if (s.demoPhase === "go" && now > s.demoT) {
          lift(i, now, 0);
          p.tx = i === 0 ? 44 : 26;
          p.ty = i === 0 ? 10 : -14;
          s.demoPhase = "hold";
          s.demoT = now + (s.first ? 3100 : 1150);
          s.first = false;
        } else if (s.demoPhase === "hold" && now > s.demoT) {
          letGo(i);
          s.demoPhase = "after";
        } else if (s.demoPhase === "after" && p.mode === "rest") {
          s.demoI = (i + 1) % pieces.length;
          s.demoPhase = "wait";
          s.demoT = now + 700;
        }
        if (s.demoPhase === "go" || s.demoPhase === "hold") {
          const ar = anchors[i].getBoundingClientRect(), sr = stage.getBoundingClientRect();
          const k = s.demoPhase === "hold" ? 0.45 : 0.14;
          s.cx += (ar.left - sr.left - s.cx) * k;
          s.cy += (ar.top - sr.top - s.cy) * k;
        }
      } else if (s.demoPhase === "hold" && s.drag < 0) {
        // the visitor took over while the hand was holding something
        if (sim[s.demoI].mode === "held") letGo(s.demoI);
        s.demoPhase = "after";
      }
      s.cshow += ((demoOn ? 1 : 0) - s.cshow) * 0.15;
      cursor.style.opacity = s.cshow.toFixed(3);
      cursor.style.transform = `translate(${s.cx.toFixed(1)}px, ${s.cy.toFixed(1)}px) scale(${((s.demoPhase === "hold" ? 0.9 : 1) * clamp(s.scale * 1.1, 0.62, 1)).toFixed(2)})`;

      sim.forEach((p, i) => {
        if (p.mode === "held" && p.until && now > p.until) letGo(i);
        if (p.mode === "turn" && Math.abs(p.trot - p.rot) < 46) {
          p.tz = 0;
          p.mode = "seat";
        }
        if (!reduce) {
          const k = p.mode === "seat" ? 210 : 150, c = p.mode === "seat" ? 15 : 17;
          p.vx += (k * (p.tx - p.x) - c * p.vx) * dt;
          p.vy += (k * (p.ty - p.y) - c * p.vy) * dt;
          p.vz += (k * (p.tz - p.z) - c * p.vz) * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          p.vrot += (74 * (p.trot - p.rot) - 11.5 * p.vrot) * dt;
          p.rot += p.vrot * dt;
          if (p.z < 0) {
            // it lands in its socket: the page takes the knock and the light is shut in
            p.z = 0;
            if (p.mode === "seat") {
              s.vdip -= Math.min(150, Math.abs(p.vz) * 0.55);
              p.flash = 1;
              p.mode = "rest";
            }
            p.vz = -p.vz * 0.22;
          }
        }
        p.flash *= 0.93;
        const up = clamp(p.z / LIFT, 0, 1);
        const float = p.mode === "held" ? Math.sin(now / 520 + i) : 0;
        p.lx += ((p.mode === "held" ? -9 : 0) * up + float * 1.6 - clamp(p.vy * 0.05, -14, 14) - p.lx) * 0.2;
        p.ly += ((p.mode === "held" ? 13 : 0) * up + float * 2.2 + clamp(p.vx * 0.05, -14, 14) - p.ly) * 0.2;
        movers[i].style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, ${(p.z + float * 2 * up + T / 2 + 1).toFixed(2)}px)`;
        movers[i].style.zIndex = p.z > 2 ? "5" : "1";
        turners[i].style.transform = `rotateX(${p.lx.toFixed(2)}deg) rotateY(${p.ly.toFixed(2)}deg) rotate${p.axis}(${p.rot.toFixed(2)}deg)`;
        shadows[i].style.opacity = (0.62 * Math.min(1, p.z / 26) * (1 - up * 0.45)).toFixed(3);
        shadows[i].style.transform = `translate(${(p.x + p.z * 0.2).toFixed(1)}px, ${(p.y + p.z * 0.46).toFixed(1)}px) scale(${(1 + up * 0.07).toFixed(3)})`;
        contacts[i].style.opacity = (1 - Math.min(1, p.z / 18)).toFixed(3);
        sockets[i].style.setProperty("--lit", clamp(Math.min(1, p.z / 30) + p.flash * 0.9, 0, 1).toFixed(3));
      });

      s.vdip += (-420 * s.dip - 19 * s.vdip) * dt;
      s.dip += s.vdip * dt;
      s.px += (s.tpx - s.px) * 0.07;
      s.py += (s.tpy - s.py) * 0.07;
      const idle = reduce ? 0 : Math.sin(now / 2700) * 1.6;
      pg.style.transform = `rotateX(${(36 - s.py * 4).toFixed(2)}deg) rotateZ(${(-7 + s.px * 4 + idle).toFixed(2)}deg) translateZ(${s.dip.toFixed(2)}px)`;
      if (visible) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(stage);
    raf = requestAnimationFrame(tick);

    const down = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-turner]");
      if (!el || e.button !== 0) return;
      const i = turners.indexOf(el);
      if (i < 0 || sim[i].mode === "turn" || sim[i].mode === "seat") return;
      s.user = performance.now();
      if (reduce) {
        letGo(i);
        return;
      }
      s.drag = i;
      s.sx = e.clientX;
      s.sy = e.clientY;
      lift(i, s.user, 0);
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      s.tpx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
      s.tpy = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
      if (s.drag < 0) return;
      s.user = performance.now();
      sim[s.drag].tx = clamp((e.clientX - s.sx) / s.scale, -150, 150);
      sim[s.drag].ty = clamp(((e.clientY - s.sy) / s.scale) * 1.2, -130, 130);
    };
    const up = () => {
      if (s.drag < 0) return;
      const i = s.drag;
      s.drag = -1;
      s.user = performance.now();
      if (sim[i].mode === "held") letGo(i);
    };
    const leave = () => {
      s.tpx = 0;
      s.tpy = 0;
    };
    pg.addEventListener("pointerdown", down);
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", up);
    stage.addEventListener("pointerleave", leave);

    api.current = {
      press: (i) => {
        const now = performance.now();
        s.user = now;
        if (sim[i].mode !== "rest") return;
        if (reduce) letGo(i);
        else lift(i, now, 520);
      },
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      pg.removeEventListener("pointerdown", down);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerup", up);
      stage.removeEventListener("pointercancel", up);
      stage.removeEventListener("pointerleave", leave);
      api.current = null;
    };
  }, [reduce]);

  const onKey = (i: number) => (e: ReactKeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      api.current?.press(i);
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#0B0D12] px-4 pb-10 pt-10 sm:pb-12 sm:pt-8" style={{ fontFamily: sans }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 58% at 50% 44%, #262b37 0%, #171a22 44%, #0e1016 76%, #0B0D12 100%)" }} />
      <div ref={stageRef} className="relative mx-auto w-full max-w-[1000px]">
        <div ref={wrapRef} className="relative w-full" style={{ height: SCENE_H }}>
          <div ref={sceneRef} className="absolute left-1/2 top-0 select-none" style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "1500px", perspectiveOrigin: "50% 30%" }}>
            <div ref={pageRef} className="absolute" style={{ left: SCENE_W / 2 - W / 2, top: 62, width: W, height: H, transformStyle: "preserve-3d", transform: "rotateX(36deg) rotateZ(-7deg)" }}>
              {/* shadow on the table and the thickness of the page */}
              <div aria-hidden="true" className="absolute inset-0" style={{ borderRadius: 30, background: "rgba(0,0,0,0.8)", filter: "blur(40px)", transform: "translate3d(26px, 50px, -80px)" }} />
              <div aria-hidden="true" className="absolute inset-0" style={{ borderRadius: 18, background: "rgba(0,0,0,0.85)", filter: "blur(8px)", transform: "translate3d(4px, 8px, -22px)" }} />
              {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((i) => (
                <div key={i} aria-hidden="true" className="absolute inset-0" style={{ borderRadius: 16, background: i > 7 ? "#8f8878" : i % 2 ? "#d6cfc1" : "#c9c1b1", transform: `translateZ(${-i * 2}px)` }} />
              ))}
              <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 16, background: PAPER, boxShadow: "inset 0 1.5px 0 #ffffff, inset 0 -2px 0 rgba(11,13,18,0.10)" }}>
                <div className="absolute left-[38px] right-[36px] top-[26px] flex items-center justify-between">
                  <span className="flex items-center gap-[9px] text-[15px] font-extrabold tracking-[-0.025em]" style={{ color: INK }}>
                    <span aria-hidden="true" className="h-[10px] w-[10px] rounded-full" style={{ background: BLUE }} />
                    {page.brand}
                  </span>
                  <span className="flex items-center gap-[22px] text-[12px] font-bold text-neutral-700">
                    {page.links.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </span>
                </div>
                <div aria-hidden="true" className="absolute left-[36px] right-[36px] top-[62px] h-px bg-neutral-900/10" />
                <p className="absolute left-[38px] top-[250px] w-[300px] text-[14.5px] font-semibold leading-snug text-neutral-600">{page.sub}</p>
                <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 30%, rgba(40,30,10,0.07) 100%)" }} />
                {/* the sockets: dark wells with the blue light that shows through when a piece is out */}
                {pieces.map((p) => (
                  <div key={p.id} data-socket="" aria-hidden="true" className="absolute" style={{ left: p.x, top: p.y, width: p.w, height: p.h, borderRadius: p.radius, background: "#07080c", boxShadow: "inset 0 5px 10px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.9)", ["--lit" as string]: 0 }}>
                    <div className="absolute inset-0" style={{ borderRadius: p.radius, opacity: "var(--lit)" as unknown as number, background: "radial-gradient(120% 120% at 50% 100%, rgba(79,152,251,0.55) 0%, rgba(79,152,251,0.12) 55%, rgba(79,152,251,0) 100%)", boxShadow: `inset 0 0 0 1.5px ${BLUE}, inset 0 0 26px rgba(79,152,251,0.8)` }} />
                  </div>
                ))}
              </div>
              {/* blue light spilling onto the page around an open socket */}
              {pieces.map((p) => (
                <div key={p.id} aria-hidden="true" className="pointer-events-none absolute" style={{ left: p.x, top: p.y, width: p.w, height: p.h, transform: "translateZ(0.5px)" }}>
                  <div data-contact="" className="absolute inset-0" style={{ borderRadius: p.radius, background: "rgba(30,22,8,0.5)", filter: "blur(4px)", transform: "translate(2px, 5px)" }} />
                  <div data-shadow="" className="absolute inset-0" style={{ borderRadius: p.radius + 6, background: "rgba(11,13,18,0.8)", filter: "blur(16px)", opacity: 0 }} />
                </div>
              ))}
              {/* the pieces */}
              {pieces.map((p, i) => (
                <div key={p.id} data-mover="" className="absolute" style={{ left: p.x, top: p.y, width: p.w, height: p.h, transformStyle: "preserve-3d", transform: `translate3d(0,0,${T / 2 + 1}px)` }}>
                  <span data-anchor="" aria-hidden="true" className="absolute h-0 w-0" style={{ left: "64%", top: "58%", transform: `translateZ(${T}px)` }} />
                  <div
                    data-turner=""
                    role="button"
                    tabIndex={0}
                    aria-pressed={held === i}
                    aria-label={`${p.label}: ${(p.sides[shown[i]].alt || p.sides[shown[i]].text).replace(/\.$/, "")}. Pick it up to turn it over.`}
                    onKeyDown={onKey(i)}
                    className="lift-out-page-piece absolute inset-0 cursor-grab touch-none outline-none active:cursor-grabbing"
                    style={{ borderRadius: p.radius, transformStyle: "preserve-3d" }}
                  >
                    <span aria-hidden="true" className="absolute inset-0 block" style={{ transformStyle: "preserve-3d" }}>
                      {[-3, -2, -1, 0, 1, 2, 3].map((k) => (
                        <span key={k} className="absolute inset-0 block" style={{ borderRadius: p.radius, background: p.edge, transform: `translateZ(${(k * T) / 6}px)` }} />
                      ))}
                      <SideFace p={p} side={p.sides[0]} back={false} />
                      <SideFace p={p} side={p.sides[1]} back />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* the hand that plays the demo */}
        <div ref={cursorRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-20" style={{ opacity: 0, transformOrigin: "0 0" }}>
          <svg width="30" height="34" viewBox="0 0 30 34" style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.5))" }}>
            <path d="M4 3l20 12.5-9.2 1.9L10 26z" fill="#ffffff" stroke="#0B0D12" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="relative z-10 mx-auto mt-1 flex max-w-[30rem] items-center justify-center gap-[10px] text-center text-[13px] font-bold tracking-[-0.01em] text-white/70">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: held >= 0 ? BLUE : "rgba(255,255,255,0.3)", boxShadow: held >= 0 ? `0 0 12px ${BLUE}` : "none" }} />
          <span aria-live="polite">{held >= 0 ? `Holding the ${pieces[held].label.toLowerCase()}. Let go and it turns over.` : "Pick up the photo, the headline or the button."}</span>
        </p>
      </div>
      <style>{`
        .lift-out-page-piece:focus-visible { outline: 3px solid ${BLUE}; outline-offset: 5px; }
      `}</style>
    </section>
  );
}
