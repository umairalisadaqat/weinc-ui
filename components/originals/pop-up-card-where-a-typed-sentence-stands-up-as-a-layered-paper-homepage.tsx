import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

/** Everything printed on the card. Change the business here. */
const site = {
  sentence: "A sourdough bakery in Lisbon that takes orders for Saturday pickup.",
  brand: "Forno Lume",
  links: ["Bread", "Mornings", "Find us"],
  headline: ["Bread worth", "waking up", "for."],
  sub: "Slow dough, shaped by hand in Alfama.",
  cta: "Order for Saturday",
  note: ["Saturday pickup", "8 until 1"],
  hero: { src: "https://images.pexels.com/photos/4881596/pexels-photo-4881596.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Round sourdough loaf on a dark surface dusted with flour" },
  tiles: [
    { label: "Country loaf", src: "https://images.pexels.com/photos/4881589/pexels-photo-4881589.jpeg?auto=compress&cs=tinysrgb&w=300", alt: "Sliced sourdough seen from above on a floured black table", tone: "#2a2420" },
    { label: "Almond croissant", src: "https://images.pexels.com/photos/13439695/pexels-photo-13439695.jpeg?auto=compress&cs=tinysrgb&w=300", alt: "Two almond croissants on white paper", tone: "#d9d2c8" },
    { label: "Seeded rye", src: "https://images.pexels.com/photos/17890200/pexels-photo-17890200.jpeg?auto=compress&cs=tinysrgb&w=300", alt: "Dark crusted loaf cut open on a cloth", tone: "#3a2c22" },
  ],
};

const BLUE = "#4F98FB";
const INK = "#0B0D12";
const PAPER = "#F8F6F1";
// Design pixels. The whole scene is scaled to fit its frame.
const W = 580; // card width
const H = 360; // height of the leaf that stands up
const D = 330; // depth of the leaf that lies on the table
const SCENE_W = 900;
const SCENE_H = 740;
const OPEN = 97; // degrees between the two leaves when the card is standing
const FLAT = 7;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const stand = "rotateX(calc(var(--a) * 1deg - 90deg))";

/** A die-cut piece that stands parallel to the back leaf, `d` pixels in front of the fold, held by paper tabs. */
function Flat({ x, w, h, d, radius, tabs, edge = "#cfcabf", children }: { x: number; w: number; h: number; d: number; radius: string; tabs: number[]; edge?: string; children: ReactNode }) {
  return (
    <div className="absolute" style={{ left: x - W / 2, top: -h, width: w, height: h, transformOrigin: "50% 100%", transform: `translateZ(${d}px) ${stand}`, transformStyle: "preserve-3d" }}>
      {tabs.map((tx) => (
        <div
          key={tx}
          aria-hidden="true"
          className="absolute"
          style={{ left: tx, top: 10, width: 20, height: d, transformOrigin: "50% 0", transform: "rotateX(calc(var(--a) * -1deg))", background: "linear-gradient(180deg, #e9e5dc 0%, #d2cdc2 100%)", boxShadow: "inset 1px 0 0 rgba(255,255,255,0.7), inset -1px 0 0 rgba(0,0,0,0.12)" }}
        />
      ))}
      <div aria-hidden="true" className="absolute inset-0" style={{ borderRadius: radius, background: edge, transform: "translateZ(-2.5px)" }} />
      <div aria-hidden="true" className="absolute inset-0" style={{ borderRadius: radius, background: edge, transform: "translateZ(-1.2px)" }} />
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: radius, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(0,0,0,0.14)" }}>
        {children}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 30%, rgba(20,14,4,0.10) 100%)" }} />
      </div>
    </div>
  );
}

/** The soft shadow a standing piece throws on the leaf behind it. */
function Cast({ x, w, h, d, radius }: { x: number; w: number; h: number; d: number; radius: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute"
      style={{ left: x + d * 0.3, top: H - h + d * 0.2, width: w, height: h + 30, borderRadius: radius, background: "rgba(38,28,10,0.34)", filter: `blur(${(5 + d * 0.09).toFixed(1)}px)`, opacity: "var(--s)" as unknown as number }}
    />
  );
}

/** The shadow at the foot of a standing piece, lying on the base leaf. */
function Foot({ x, w, d }: { x: number; w: number; d: number }) {
  return (
    <div aria-hidden="true" className="absolute" style={{ left: x + 6, top: d - 26, width: w + 16, height: 30, borderRadius: 12, background: "linear-gradient(180deg, rgba(38,28,10,0), rgba(38,28,10,0.38))", filter: "blur(5px)", opacity: "var(--s)" as unknown as number }} />
  );
}

export default function PopUpHomepageCard() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  const [standing, setStanding] = useState(true);
  const sim = useRef({ a: 58, va: 0, target: OPEN, yaw: -10, tyaw: 0, dragging: false, y0: 0, a0: 0, moved: 0, scale: 1, nextDip: 0, held: false, user: false });

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    const card = cardRef.current;
    if (!wrap || !scene || !card) return;
    const s = sim.current;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    const t0 = last;
    s.nextDip = last + 5200;
    if (reduce) s.a = s.target;

    const measure = () => {
      const sc = clamp(wrap.clientWidth / 770, 0.4, 1);
      s.scale = sc;
      wrap.style.height = `${Math.round(SCENE_H * sc)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);

    const paint = (now: number) => {
      const idle = reduce ? 0 : Math.sin((now - t0) / 2600) * 5;
      s.yaw += (-10 + idle + s.tyaw - s.yaw) * 0.08;
      card.style.setProperty("--a", s.a.toFixed(2));
      card.style.setProperty("--s", clamp((s.a - 30) / 55, 0, 1).toFixed(3));
      card.style.setProperty("--dim", clamp((70 - s.a) / 90, 0, 0.55).toFixed(3));
      card.style.transform = `rotateX(-27deg) rotateY(${(reduce ? -10 : s.yaw).toFixed(2)}deg)`;
      const t = typedRef.current;
      if (t) {
        const n = Math.round(site.sentence.length * clamp((s.a - 20) / 52, 0, 1));
        if (t.dataset.n !== String(n)) {
          t.dataset.n = String(n);
          t.textContent = site.sentence.slice(0, n);
        }
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (reduce) {
        s.a = s.target;
      } else if (!s.dragging) {
        const acc = 58 * (s.target - s.a) - 8.2 * s.va;
        s.va += acc * dt;
        s.a = clamp(s.a + s.va * dt, 2, 112);
        // the idle demo: press the card down, let the sentence clear, and let it stand again
        if (!s.user && !s.held && now > s.nextDip) {
          if (s.target === OPEN) {
            s.target = 16;
            s.nextDip = now + 1500;
          } else {
            s.target = OPEN;
            s.nextDip = now + 6200;
          }
        }
      }
      paint(now);
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
    io.observe(wrap);
    raf = requestAnimationFrame(tick);

    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
      s.dragging = true;
      s.y0 = e.clientY;
      s.a0 = s.a;
      s.moved = 0;
      s.va = 0;
      scene.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      s.tyaw = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1) * 12;
      if (!s.dragging) return;
      const dy = (s.y0 - e.clientY) / s.scale;
      s.moved = Math.max(s.moved, Math.abs(dy));
      const next = clamp(s.a0 + dy * 0.42, 2, 110);
      s.va = (next - s.a) * 30;
      s.a = next;
    };
    const up = () => {
      if (!s.dragging) return;
      s.dragging = false;
      const open = s.moved < 5 ? s.target !== OPEN : s.a + s.va * 0.12 > 46;
      s.target = open ? OPEN : FLAT;
      s.user = !open;
      s.nextDip = performance.now() + 9000;
      setStanding(open);
    };
    const leave = () => {
      s.tyaw = 0;
    };
    scene.addEventListener("pointerdown", down);
    scene.addEventListener("pointermove", move);
    scene.addEventListener("pointerup", up);
    scene.addEventListener("pointercancel", up);
    scene.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      scene.removeEventListener("pointerdown", down);
      scene.removeEventListener("pointermove", move);
      scene.removeEventListener("pointerup", up);
      scene.removeEventListener("pointercancel", up);
      scene.removeEventListener("pointerleave", leave);
    };
  }, [reduce]);

  const toggle = () => {
    const s = sim.current;
    const open = s.target !== OPEN;
    s.target = open ? OPEN : FLAT;
    s.user = !open;
    s.nextDip = performance.now() + 9000;
    setStanding(open);
  };
  const hold = (v: boolean) => () => {
    sim.current.held = v;
    if (!v) sim.current.nextDip = performance.now() + 4000;
  };

  const grain: CSSProperties = { backgroundImage: "repeating-linear-gradient(92deg, rgba(120,100,60,0.018) 0px, rgba(120,100,60,0) 3px, rgba(120,100,60,0.014) 7px), repeating-linear-gradient(1deg, rgba(120,100,60,0.014) 0px, rgba(120,100,60,0) 4px)" };
  const arch = "104px 104px 4px 4px";
  const sans = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

  return (
    <section className="relative overflow-hidden bg-[#0B0D12]" style={{ fontFamily: sans }} onMouseEnter={hold(true)} onMouseLeave={hold(false)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(58% 60% at 50% 46%, #2b2f3a 0%, #191c25 42%, #0e1016 74%, #0B0D12 100%)" }} />
      <div ref={wrapRef} className="relative mx-auto w-full overflow-hidden" style={{ height: SCENE_H }}>
        <div
          ref={sceneRef}
          className="absolute left-1/2 top-0 touch-pan-x select-none"
          style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "1500px", perspectiveOrigin: "50% 38%", cursor: "grab" }}
        >
          <div ref={cardRef} className="absolute" style={{ left: SCENE_W / 2, top: 404, width: 0, height: 0, transformStyle: "preserve-3d", transform: "rotateX(-27deg) rotateY(-10deg)", ["--a" as string]: reduce ? OPEN : 58, ["--s" as string]: 1, ["--dim" as string]: 0 }}>
            {/* shadow of the whole card on the table */}
            <div aria-hidden="true" className="absolute" style={{ left: -W / 2 - 30, top: 0, width: W + 150, height: D + 70, transformOrigin: "50% 0", transform: "translate3d(0,4px,-70px) rotateX(90deg)", background: "rgba(0,0,0,0.75)", filter: "blur(34px)" }} />
            <div aria-hidden="true" className="absolute" style={{ left: -W / 2 + 2, top: 0, width: W + 8, height: D + 6, transformOrigin: "50% 0", transform: "translate3d(0,2.5px,0) rotateX(90deg)", background: "rgba(0,0,0,0.8)", filter: "blur(7px)" }} />

            {/* the leaf that lies on the table: it carries the sentence */}
            <div className="absolute overflow-hidden" style={{ left: -W / 2, top: 0, width: W, height: D, transformOrigin: "50% 0", transform: "rotateX(90deg)", background: PAPER, borderRadius: "0 0 10px 10px", ...grain }}>
              <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(38,28,10,0.30) 0%, rgba(38,28,10,0.10) 9%, rgba(38,28,10,0) 30%, rgba(255,255,255,0.35) 100%)" }} />
              <Foot x={338} w={208} d={52} />
              <Foot x={28} w={282} d={96} />
              <Foot x={336} w={212} d={150} />
              <p className="absolute left-[30px] right-[30px] font-mono text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ top: 192, color: BLUE }}>
                One sentence
              </p>
              <p className="absolute left-[28px] right-[40px] text-[31px] font-extrabold leading-[1.12] tracking-[-0.035em]" style={{ top: 212, color: INK }}>
                <span className="sr-only">{site.sentence}</span>
                <span aria-hidden="true">
                  <span ref={typedRef}>{site.sentence}</span>
                  <span className="pop-up-card-sentence-caret ml-[3px] inline-block h-[28px] w-[4px] translate-y-[4px] rounded-full" style={{ background: BLUE }} />
                </span>
              </p>
              <div aria-hidden="true" className="absolute inset-0" style={{ background: "rgba(8,9,14,1)", opacity: "var(--dim)" as unknown as number }} />
            </div>

            {/* the leaf that stands up: the page itself */}
            <div className="absolute" style={{ left: -W / 2, top: -H, width: W, height: H, transformOrigin: "50% 100%", transform: stand, transformStyle: "preserve-3d" }}>
              <div className="absolute inset-0 overflow-hidden" style={{ background: INK, borderRadius: "10px 10px 0 0", transform: "rotateY(180deg) translateZ(1px)", backfaceVisibility: "hidden" }} aria-hidden="true">
                <div className="absolute inset-0" style={{ background: "linear-gradient(165deg, #39404f 0%, #232834 45%, #171b24 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 -2px 0 rgba(255,255,255,0.16)" }} />
                <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: BLUE, boxShadow: `0 0 24px ${BLUE}` }} />
              </div>
              <div className="absolute inset-0 overflow-hidden" style={{ background: PAPER, borderRadius: "10px 10px 0 0", backfaceVisibility: "hidden", ...grain }}>
                <Cast x={338} w={208} h={276} d={52} radius={arch} />
                <Cast x={28} w={282} h={104} d={96} radius="8px" />
                <div className="absolute left-[28px] right-[28px] top-[20px] flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] font-extrabold tracking-[-0.02em]" style={{ color: INK }}>
                    <span aria-hidden="true" className="h-[9px] w-[9px] rounded-full" style={{ background: BLUE }} />
                    {site.brand}
                  </span>
                  <span className="flex items-center gap-[18px] text-[10.5px] font-semibold text-neutral-600">
                    {site.links.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </span>
                </div>
                <div aria-hidden="true" className="absolute left-[28px] right-[28px] top-[50px] h-px bg-neutral-900/10" />
                <h2 className="absolute left-[28px] top-[74px] text-[50px] font-black leading-[0.94] tracking-[-0.055em]" style={{ color: INK }}>
                  {site.headline.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </h2>
                <p className="absolute left-[30px] top-[226px] w-[250px] text-[12.5px] font-semibold leading-snug text-neutral-600">
                  {site.sub} <span style={{ color: "#0B0D12" }}>{site.note[0]}, {site.note[1]}.</span>
                </p>
                <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 35%, rgba(38,28,10,0.16) 100%)" }} />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "rgba(8,9,14,1)", opacity: "var(--dim)" as unknown as number }} />
              </div>
            </div>

            {/* the pieces that stand in front of the page, back to front */}
            <Flat x={338} w={208} h={276} d={52} radius={arch} tabs={[94]}>
              <div className="absolute inset-0 bg-[#fbfaf7]" />
              <div className="absolute inset-[9px] overflow-hidden bg-[#15171c]" style={{ borderRadius: "96px 96px 2px 2px" }}>
                <img src={site.hero.src} alt={site.hero.alt} width={190} height={258} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: "50% 62%" }} />
              </div>
            </Flat>

            <Flat x={28} w={282} h={104} d={96} radius="8px" tabs={[38, 224]}>
              <div className="absolute inset-0 bg-[#fbfaf7]" />
              <ul className="absolute inset-[7px] grid grid-cols-3 gap-[7px]">
                {site.tiles.map((t) => (
                  <li key={t.label} className="relative overflow-hidden rounded-[4px]" style={{ background: t.tone }}>
                    <img src={t.src} alt={t.alt} width={85} height={98} draggable={false} className="h-full w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-black/0 px-[6px] pb-[6px] pt-5 text-[8.5px] font-bold leading-none text-white">{t.label}</span>
                  </li>
                ))}
              </ul>
            </Flat>

            <Flat x={336} w={212} h={54} d={150} radius="27px" tabs={[96]} edge="#2f69c0">
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, #6aa9fc 0%, ${BLUE} 45%, #3f86ea 100%)` }} />
              <span className="absolute inset-0 flex items-center justify-center gap-2 text-[15px] font-extrabold tracking-[-0.02em]" style={{ color: INK }}>
                {site.cta}
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </span>
            </Flat>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-5 flex justify-center sm:bottom-8">
          <button
            type="button"
            onClick={toggle}
            aria-pressed={standing}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 text-[13px] font-bold tracking-[-0.01em] text-white transition hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB]"
          >
            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: standing ? BLUE : "rgba(255,255,255,0.4)" }} />
            {standing ? "Press it flat" : "Stand it up"}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes pop-up-card-sentence-caret-blink { 0%, 55% { opacity: 1 } 56%, 100% { opacity: 0 } }
        .pop-up-card-sentence-caret { animation: pop-up-card-sentence-caret-blink 1.1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) { .pop-up-card-sentence-caret { animation: none; } }
      `}</style>
    </section>
  );
}
