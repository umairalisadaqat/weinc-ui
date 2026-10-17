import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const BLUE = "#4F98FB";
const INK = "#0B0D12";
const PAPER = "#F8F6F1";
const NIGHT = "#12151C";
const sans = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const site = {
  brand: "Saltline Surf School",
  links: ["Lessons", "Camps", "Find us"],
  plain: ["Surf", "lessons in", "Ericeira."],
  bold: ["Stand up on", "your first", "wave."],
  sub: "Small groups, soft boards and warm wetsuits, all year.",
  cta: "Book a lesson",
  beach: { src: "https://images.pexels.com/photos/5689762/pexels-photo-5689762.jpeg?auto=compress&cs=tinysrgb&w=600", tone: "#9db4c4" },
  wave: { src: "https://images.pexels.com/photos/14793463/pexels-photo-14793463.jpeg?auto=compress&cs=tinysrgb&w=600", tone: "#7f9c9a" },
};

/** The history, oldest first. Each sentence produced the leaf with the same number. */
const edits = ["First draft.", "Make the headline bolder.", "Use the photo of the wave.", "Give it a dark header.", "Make the button blue."];
const N = edits.length;

// Design pixels. The scene is scaled to fit its frame.
const W = 500;
const H = 360;
const HALF = H / 2;
const BOX_W = 596;
const BOX_H = 470;
const SCENE_W = 900;
const SCENE_H = 530;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The page after `i` edits. */
function Face({ i }: { i: number }) {
  const band = i >= 3;
  const bold = i >= 1;
  const photo = i >= 2 ? site.wave : site.beach;
  return (
    <div className="absolute left-0 top-0" style={{ width: W, height: H, background: PAPER, color: INK }}>
      <div className="absolute inset-x-0 top-0 flex h-[52px] items-center justify-between px-[28px]" style={{ background: band ? NIGHT : "transparent", color: band ? "#F6F4EF" : INK }}>
        <span className="flex items-center gap-2 text-[14px] font-extrabold tracking-[-0.025em]">
          <span className="h-[9px] w-[9px] rounded-full" style={{ background: BLUE }} />
          {site.brand}
        </span>
        <span className="flex items-center gap-[18px] text-[11px] font-bold" style={{ color: band ? "#C3C9D6" : "#4B505A" }}>
          {site.links.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </span>
      </div>
      <div className="absolute inset-x-[28px] top-[52px] h-px" style={{ background: band ? "transparent" : "rgba(11,13,18,0.10)" }} />
      <p className={`absolute left-[28px] top-[78px] ${bold ? "text-[47px] font-black leading-[0.95] tracking-[-0.06em]" : "text-[40px] font-semibold leading-[1] tracking-[-0.035em]"}`}>
        {(bold ? site.bold : site.plain).map((l) => (
          <span key={l} className="block whitespace-nowrap">
            {l}
          </span>
        ))}
      </p>
      <p className="absolute left-[30px] top-[236px] w-[232px] text-[12.5px] font-semibold leading-snug" style={{ color: "#565B66" }}>
        {site.sub}
      </p>
      <span className="absolute flex items-center justify-center gap-2 text-[14px] font-extrabold tracking-[-0.02em]" style={{ left: 28, top: 290, width: 170, height: 46, borderRadius: 23, background: i >= 4 ? BLUE : INK, color: i >= 4 ? INK : "#ffffff" }}>
        {site.cta}
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10h12M11 5l5 5-5 5" />
        </svg>
      </span>
      <span className="absolute block overflow-hidden" style={{ left: 300, top: 74, width: 172, height: 262, borderRadius: 12, background: photo.tone }}>
        <img src={photo.src} alt="" width={172} height={262} draggable={false} className="h-full w-full object-cover" />
      </span>
    </div>
  );
}

/** One leaf: the upper or lower half of a page, printed on a thin card. */
function Leaf({ i, lower, flip }: { i: number; lower?: boolean; flip?: boolean }) {
  return (
    <span className="absolute inset-0 block overflow-hidden" style={{ borderRadius: lower ? "0 0 10px 10px" : "10px 10px 0 0", transform: flip ? "rotateX(180deg)" : undefined, backfaceVisibility: "hidden" }}>
      <span className="absolute left-0 block" style={{ top: lower ? -HALF : 0, width: W, height: H }}>
        <Face i={i} />
      </span>
      <span className="absolute inset-0 block" style={{ background: lower ? "linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0) 16%, rgba(255,255,255,0.04) 100%)" : "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.12) 100%)", boxShadow: lower ? "inset 0 -1.5px 0 rgba(255,255,255,0.25)" : "inset 0 1.5px 0 rgba(255,255,255,0.6)" }} />
    </span>
  );
}

const all = Array.from({ length: N }, (_, i) => i);

export default function SplitFlapUndoBoard() {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [ver, setVer] = useState(N - 1);
  const api = useRef<{ step: (d: number) => void } | null>(null);

  useEffect(() => {
    const stage = stageRef.current, wrap = wrapRef.current, scene = sceneRef.current, box = boxRef.current, flap = flapRef.current, knob = knobRef.current;
    if (!stage || !wrap || !scene || !box || !flap || !knob) return;
    const q = (sel: string) => Array.from(box.querySelectorAll<HTMLElement>(sel));
    const tops = q("[data-top]"), bots = q("[data-bot]"), fronts = q("[data-front]"), backs = q("[data-back]"), lamps = q("[data-lamp]"), above = q("[data-above]"), below = q("[data-below]");
    const shadeF = box.querySelector<HTMLElement>("[data-shade-front]"), shadeB = box.querySelector<HTMLElement>("[data-shade-back]"), castT = box.querySelector<HTMLElement>("[data-cast-top]"), castB = box.querySelector<HTMLElement>("[data-cast-bot]");
    if (!shadeF || !shadeB || !castT || !castB) return;

    const s = { pos: N - 1, v: 0, target: N - 1, rate: 1.7, kick: 0, vkick: 0, px: 0, py: 0, tpx: 0, tpy: 0, user: -1e9, demoT: performance.now() + 900, demoDir: -1, shown: N - 1, lo: -1 };
    let raf = 0;
    let visible = true;
    let last = performance.now();

    const measure = () => {
      const sc = clamp(wrap.clientWidth / 760, 0.42, 1.06);
      wrap.style.height = `${Math.round(SCENE_H * sc)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);

    const paint = () => {
      const lo = clamp(Math.floor(s.pos), 0, N - 2);
      const a = clamp(s.pos - lo, 0, 1);
      const ang = 180 * a;
      if (lo !== s.lo) {
        s.lo = lo;
        // upper window shows the newer page, lower window the older one, and the leaf between them carries one half of each
        tops.forEach((el, i) => (el.style.visibility = i === lo + 1 ? "visible" : "hidden"));
        bots.forEach((el, i) => (el.style.visibility = i === lo ? "visible" : "hidden"));
        fronts.forEach((el, i) => (el.style.visibility = i === lo ? "visible" : "hidden"));
        backs.forEach((el, i) => (el.style.visibility = i === lo + 1 ? "visible" : "hidden"));
      }
      flap.style.transform = `translateZ(1.5px) rotateX(${(-ang).toFixed(2)}deg)`;
      const mid = Math.sin((ang * Math.PI) / 180);
      shadeF.style.opacity = (ang < 90 ? mid * 0.5 : 0).toFixed(3);
      shadeB.style.opacity = (ang >= 90 ? mid * 0.38 : 0).toFixed(3);
      castT.style.opacity = (a > 0.001 && a < 0.5 ? 0.42 * (1 - a * 2) + 0.12 : a >= 0.5 && a < 0.999 ? 0.12 * (1 - a) * 2 : 0).toFixed(3);
      castB.style.opacity = (ang > 90 && a < 0.999 ? 0.6 * (1 - mid) + 0.1 : ang > 4 && ang <= 90 ? 0.1 * mid : 0).toFixed(3);
      knob.style.transform = `rotate(${(s.pos * 67).toFixed(2)}deg)`;
      lamps.forEach((el, i) => el.style.setProperty("--lit", clamp(s.pos - i + 1, 0, 1).toFixed(3)));
      const now = Math.round(s.pos);
      above.forEach((el, i) => (el.style.opacity = i < N - 1 - now ? "1" : "0"));
      below.forEach((el, i) => (el.style.opacity = i < now ? "1" : "0"));
      if (now !== s.shown) {
        s.shown = now;
        setVer(now);
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      // with nobody touching it, the board rewinds to the first draft and then lets the edits fall back in
      if (!reduce && now - s.user > 7000 && s.pos === s.target && now > s.demoT) {
        if (s.demoDir < 0) {
          s.target = 0;
          s.rate = 1.55;
        } else s.target = N - 1;
        s.demoDir = -s.demoDir;
      }

      if (reduce) s.pos = s.target;
      else if (s.pos > s.target) {
        // undo: the spindle is driven backwards at a steady rate and each leaf is carried up and over
        const before = Math.ceil(s.pos - 1e-6);
        s.pos = Math.max(s.target, s.pos - s.rate * dt);
        if (Math.ceil(s.pos - 1e-6) < before || s.pos === s.target) s.vkick += 46;
        if (s.pos === s.target) s.demoT = now + 1500;
        s.v = 0;
      } else if (s.pos < s.target) {
        // redo: a leaf is let go and falls under its own weight
        const edge = Math.floor(s.pos + 1e-6) + 1;
        s.v += 26 * dt;
        s.pos += (0.7 + s.v) * dt;
        if (s.pos >= edge) {
          s.pos = edge;
          s.v = 0;
          s.vkick -= 80;
          if (s.pos === s.target) s.demoT = now + 2600;
        }
      }
      paint();

      s.vkick += (-520 * s.kick - 20 * s.vkick) * dt;
      s.kick += s.vkick * dt;
      s.px += (s.tpx - s.px) * 0.07;
      s.py += (s.tpy - s.py) * 0.07;
      const idle = reduce ? 0 : Math.sin(now / 2600) * 2.4;
      box.style.transform = `translateY(${(-s.kick).toFixed(2)}px) rotateX(${(6 - s.py * 4).toFixed(2)}deg) rotateY(${(-15 + s.px * 7 + idle).toFixed(2)}deg)`;
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
    paint();
    raf = requestAnimationFrame(tick);

    const move = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      s.tpx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
      s.tpy = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
    };
    const leave = () => {
      s.tpx = 0;
      s.tpy = 0;
    };
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerleave", leave);

    api.current = {
      step: (d) => {
        s.user = performance.now();
        s.rate = 4.6;
        s.target = clamp(Math.round(s.target) + d, 0, N - 1);
        s.demoDir = s.target === 0 ? 1 : -1;
      },
    };
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
      api.current = null;
    };
  }, [reduce]);

  const steel = "linear-gradient(180deg, #f4f5f7 0%, #b9bdc4 38%, #7d828b 62%, #d5d8dd 100%)";
  const pill = "inline-flex h-12 items-center gap-2 rounded-full px-6 text-[14px] font-extrabold tracking-[-0.01em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#4F98FB] disabled:opacity-40";

  return (
    <section className="relative overflow-hidden bg-[#4F98FB] px-4 pb-10 pt-8 sm:pb-12 sm:pt-10" style={{ fontFamily: sans }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(64% 60% at 50% 40%, #86bbff 0%, #5fa3fc 42%, #4F98FB 70%, #3f86ea 100%)" }} />
      <div ref={stageRef} className="relative mx-auto w-full max-w-[900px]">
        <div ref={wrapRef} className="relative w-full" style={{ height: SCENE_H }}>
          <div ref={sceneRef} aria-hidden="true" className="absolute left-1/2 top-0 select-none" style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "2600px", perspectiveOrigin: "50% 42%" }}>
            {/* shadow on the floor */}
            <div className="absolute" style={{ left: SCENE_W / 2 - BOX_W / 2 + 10, top: 488, width: BOX_W + 60, height: 44, borderRadius: "50%", background: "rgba(8,24,66,0.55)", filter: "blur(22px)" }} />
            <div ref={boxRef} className="absolute" style={{ left: SCENE_W / 2 - BOX_W / 2, top: 26, width: BOX_W, height: BOX_H, transformStyle: "preserve-3d", transform: "rotateX(6deg) rotateY(-15deg)" }}>
              {/* the depth of the case */}
              {[16, 14, 12, 10, 8, 6, 4, 2].map((i) => (
                <div key={i} className="absolute inset-0" style={{ borderRadius: 30, background: i > 13 ? "#020304" : i % 4 ? "#0a0c11" : "#161a23", transform: `translateZ(${-i * 4}px)` }} />
              ))}
              {/* the knob on the spindle, half hidden behind the case */}
              <div className="absolute" style={{ left: BOX_W - 56, top: 44 + HALF - 62, width: 124, height: 124, transform: "translateZ(-34px)" }}>
                <div ref={knobRef} className="absolute inset-0 rounded-full" style={{ background: "repeating-conic-gradient(#c5c9cf 0deg 1.5deg, #5d626b 1.5deg 3deg)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.5), 0 10px 18px rgba(8,24,66,0.45)" }}>
                  <div className="absolute inset-[7px] rounded-full" style={{ background: "conic-gradient(from 40deg, #eef0f2, #8d939c, #e2e5e8, #6f757e, #c9cdd2, #8d939c, #eef0f2)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.35), inset 0 0 12px rgba(0,0,0,0.25)" }} />
                  <div className="absolute left-1/2 top-[14px] h-[18px] w-[5px] -translate-x-1/2 rounded-full" style={{ background: BLUE, boxShadow: "inset 0 1px 1px rgba(0,0,0,0.4)" }} />
                </div>
              </div>
              {/* the face of the case */}
              <div className="absolute inset-0" style={{ borderRadius: 30, background: "linear-gradient(160deg, #2a2f3b 0%, #151821 34%, #0B0D12 100%)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.22), inset 1.5px 0 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.05)" }} />
              {/* the well the leaves sit in */}
              <div className="absolute" style={{ left: 38, top: 30, width: W + 20, height: H + 28, borderRadius: 16, background: "#040508", boxShadow: "inset 0 6px 14px rgba(0,0,0,0.95), 0 1px 0 rgba(255,255,255,0.12)" }} />
              {/* leaves waiting above and leaves already turned below: the history you can see */}
              {[0, 1, 2, 3].map((k) => (
                <div key={k} data-above="" className="absolute" style={{ left: 48 + 5 + k * 3, top: 44 - 4 - k * 3.2, width: W - 10 - k * 6, height: 5, borderRadius: "5px 5px 0 0", background: `linear-gradient(180deg, ${["#e9e6df", "#cfcbc3", "#b3afa7", "#96928b"][k]}, ${["#bdb9b1", "#a29e97", "#88847d", "#6d6a64"][k]})`, opacity: 0, transition: "opacity 160ms" }} />
              ))}
              {[0, 1, 2, 3].map((k) => (
                <div key={k} data-below="" className="absolute" style={{ left: 48 + 5 + k * 3, top: 44 + H - 1 + k * 3.2, width: W - 10 - k * 6, height: 5, borderRadius: "0 0 5px 5px", background: `linear-gradient(180deg, ${["#8d8a84", "#77746e", "#615e59", "#4b4945"][k]}, ${["#6f6c66", "#5a5853", "#464440", "#33322f"][k]})`, opacity: 1, transition: "opacity 160ms" }} />
              ))}
              <div className="absolute" style={{ left: 48, top: 44, width: W, height: H, transformStyle: "preserve-3d" }}>
                {/* upper window */}
                <div className="absolute left-0 top-0" style={{ width: W, height: HALF }}>
                  {all.map((i) => (
                    <div key={i} data-top="" className="absolute inset-0" style={{ visibility: i === N - 1 ? "visible" : "hidden" }}>
                      <Leaf i={i} />
                    </div>
                  ))}
                  <div data-cast-top="" className="absolute inset-0" style={{ borderRadius: "10px 10px 0 0", opacity: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.75) 100%)" }} />
                </div>
                {/* lower window */}
                <div className="absolute left-0" style={{ top: HALF, width: W, height: HALF }}>
                  {all.map((i) => (
                    <div key={i} data-bot="" className="absolute inset-0" style={{ visibility: i === N - 2 ? "visible" : "hidden" }}>
                      <Leaf i={i} lower />
                    </div>
                  ))}
                  <div data-cast-bot="" className="absolute inset-0" style={{ borderRadius: "0 0 10px 10px", opacity: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.35) 100%)" }} />
                </div>
                {/* the leaf in the air: front is the upper half of the older page, back is the lower half of the newer one */}
                <div ref={flapRef} className="absolute left-0 top-0" style={{ width: W, height: HALF, transformOrigin: "50% 100%", transformStyle: "preserve-3d", transform: "translateZ(1.5px) rotateX(-180deg)" }}>
                  {all.map((i) => (
                    <div key={i} data-front="" className="absolute inset-0" style={{ visibility: i === N - 2 ? "visible" : "hidden", transformStyle: "preserve-3d" }}>
                      <Leaf i={i} />
                    </div>
                  ))}
                  <div data-shade-front="" className="absolute inset-0" style={{ borderRadius: "10px 10px 0 0", background: "#000", opacity: 0, backfaceVisibility: "hidden", transform: "translateZ(0.2px)" }} />
                  {all.map((i) => (
                    <div key={i} data-back="" className="absolute inset-0" style={{ visibility: i === N - 1 ? "visible" : "hidden", transformStyle: "preserve-3d" }}>
                      <Leaf i={i} lower flip />
                    </div>
                  ))}
                  <div data-shade-back="" className="absolute inset-0" style={{ borderRadius: "10px 10px 0 0", background: "#000", opacity: 0, backfaceVisibility: "hidden", transform: "rotateX(180deg) translateZ(0.2px)" }} />
                </div>
                {/* the spindle line and its two pins */}
                <div className="absolute left-0" style={{ top: HALF - 2, width: W, height: 4, background: "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.55))", transform: "translateZ(3px)" }} />
                {[0, W - 13].map((x) => (
                  <div key={x} className="absolute" style={{ left: x, top: HALF - 12, width: 13, height: 24, background: "#040508", borderRadius: x ? "3px 0 0 3px" : "0 3px 3px 0", transform: "translateZ(3px)" }} />
                ))}
                {[-13, W - 5].map((x) => (
                  <div key={x} className="absolute" style={{ left: x, top: HALF - 13, width: 18, height: 26, borderRadius: 4, background: steel, boxShadow: "0 2px 4px rgba(0,0,0,0.7), inset 0 0 0 0.5px rgba(0,0,0,0.5)", transform: "translateZ(4px)" }} />
                ))}
              </div>
              {/* one lamp per version on the lip of the case */}
              <div className="absolute flex items-center gap-[14px]" style={{ left: 50, top: BOX_H - 42 }}>
                {all.map((i) => (
                  <span key={i} data-lamp="" className="relative block h-[11px] w-[11px] rounded-full" style={{ background: "#05060a", boxShadow: "inset 0 1.5px 2px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.14)", ["--lit" as string]: 1 }}>
                    <span className="absolute inset-[1.5px] rounded-full" style={{ opacity: "var(--lit)" as unknown as number, background: `radial-gradient(circle at 40% 35%, #d9eaff 0%, ${BLUE} 55%, #2f6fd0 100%)`, boxShadow: `0 0 10px ${BLUE}, 0 0 2px #ffffff` }} />
                  </span>
                ))}
              </div>
              <span className="absolute text-[10px] font-bold uppercase tracking-[0.28em] text-white/45" style={{ right: 50, top: BOX_H - 43 }}>
                History
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-2 flex flex-col items-center gap-4">
          <p aria-live="polite" className="text-center text-[15px] font-extrabold tracking-[-0.02em] text-[#0B0D12] sm:text-[17px]">
            <span className="mr-2 inline-block rounded-full bg-[#0B0D12] px-[10px] py-[3px] align-middle font-mono text-[11px] font-bold tracking-normal text-white">
              {ver === 0 ? "start" : `edit ${ver} of ${N - 1}`}
            </span>
            <span className="align-middle">{edits[ver]}</span>
          </p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => api.current?.step(-1)} disabled={ver === 0} className={`${pill} bg-[#0B0D12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_18px_-10px_rgba(8,24,66,0.9)] hover:-translate-y-px active:translate-y-0`}>
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 4L3 8l4 4M3 8h9a5 5 0 010 10H8" />
              </svg>
              Undo
            </button>
            <button type="button" onClick={() => api.current?.step(1)} disabled={ver === N - 1} className={`${pill} bg-[#F6F4EF] text-[#0B0D12] shadow-[inset_0_1px_0_#ffffff,0_10px_18px_-10px_rgba(8,24,66,0.9)] hover:-translate-y-px active:translate-y-0`}>
              Redo
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4l4 4-4 4M17 8H8a5 5 0 000 10h4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
