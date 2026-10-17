import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The cards in the file. The wheel repeats them, so any number works. */
const people = [
  {
    name: "Margit Lindqvist",
    role: "Owner, Lindqvist Upholstery",
    quote: "I described the shop over the phone. Two days later it was on my screen, down to the brass tacks.",
    tab: "#e0a422",
    photo: { src: "https://images.pexels.com/photos/6625914/pexels-photo-6625914.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Smiling woman with wavy blonde hair in a quilted jacket against a lilac backdrop", tone: "#9c86c4", focus: "50% 22%" },
  },
  {
    name: "Felix Brandt",
    role: "Baker, Brandt and Crumb",
    quote: "The order form is so plain my grandfather uses it. He is ninety one and he hates everything.",
    tab: "#2f8f86",
    photo: { src: "https://images.pexels.com/photos/6345373/pexels-photo-6345373.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Young man in a striped top tilting his head with his eyes closed against a pale blue backdrop", tone: "#a9c9cf", focus: "60% 78%" },
  },
  {
    name: "Amara Diallo",
    role: "Trainer, Diallo Movement Studio",
    quote: "Class bookings used to live in my head. Now they live on one page and I get my evenings back.",
    tab: "#d9543a",
    photo: { src: "https://images.pexels.com/photos/3535468/pexels-photo-3535468.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Woman with long blonde braids resting an arm over her head against a pale yellow dotted wall", tone: "#ecd98c", focus: "58% 26%" },
  },
  {
    name: "Matteo Greco",
    role: "Chef, Osteria Greco",
    quote: "They photographed the ragu like it was a film star. Fully deserved, and the menu reads the same way.",
    tab: "#3b62c4",
    photo: { src: "https://images.pexels.com/photos/24876042/pexels-photo-24876042.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Chef in a yellow jacket, yellow hat and yellow glasses with his arms folded against a dark backdrop", tone: "#2a2014", focus: "50% 20%" },
  },
  {
    name: "Rafiq Islam",
    role: "Director, Northlight Films",
    quote: "First agency in ten years to send the files, the logins and a thank you note on the same day.",
    tab: "#7a8a3a",
    photo: { src: "https://images.pexels.com/photos/1486055/pexels-photo-1486055.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Man in dark sunglasses crossing his fists in front of his chest against a blue backdrop", tone: "#1d4f9c", focus: "56% 16%" },
  },
];

// Design pixels. Angles are measured from the reading position: 0 faces you, more is further over the top.
const N = 15; // cards on the wheel
const SW = 520; // scene
const SH = 606;
const AX = 338; // height of the spindle in the scene
const CARD_W = 400;
const LEN = 300; // spindle to the top edge of a card
const BODY = 262; // the card itself, the rest is the hub
const PITCH = 42; // how far above the file you are looking from
const BACK_STEP = 4.5; // spacing of the cards waiting behind
const FRONT_AT = 104; // where a card that has gone over comes to rest
const FRONT_STEP = 6;
const GRAVITY = 2100;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const mod = (v: number, n: number) => ((v % n) + n) % n;
const slot = (r: number) => (r === 0 ? 0 : r <= 7 ? -BACK_STEP * r : FRONT_AT + FRONT_STEP * (N - r - 1));
const TYPE = `"American Typewriter", "Courier New", Courier, monospace`;
const svg = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const FIBRE = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='p' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' seed='9' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.1  0 0 0 0.55 -0.17'/></filter><rect width='180' height='180' filter='url(#p)'/></svg>`,
);

type Card = { phi: number; v: number; target: number; fall: number };

export default function RotaryCardFile() {
  const reduce = !!useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const knobRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [cur, setCur] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const curRef = useRef(0);
  const sim = useRef<Card[]>(Array.from({ length: N }, (_, j) => ({ phi: slot(j), v: 0, target: slot(j), fall: 0 })));
  const env = useRef({ touched: false, inside: false, visible: true, knob: 0, knobV: 0, wake: () => {}, drag: null as null | { y: number; moved: boolean } });

  const paint = useCallback((j: number) => {
    const el = cardRefs.current[j];
    if (!el) return;
    const c = sim.current[j];
    const m = mod(c.phi, 360);
    const hidden = m > 125 && m < 322; // under the base, on its way round to the back
    el.style.visibility = hidden ? "hidden" : "visible";
    if (hidden) return;
    el.style.transform = `rotateX(${(-c.phi).toFixed(2)}deg)`;
    // the face dims as it turns away from the lamp, the back brightens as it comes up to it
    const over = m > 180 ? 0 : m;
    el.style.setProperty("--dim", (clamp(over / 95, 0, 1) * 0.5).toFixed(3));
    el.style.setProperty("--deep", clamp((over - FRONT_AT) / 24, 0, 1).toFixed(3));
  }, []);

  const step = useCallback(
    (dir: 1 | -1, byHand: boolean) => {
      if (byHand) env.current.touched = true;
      const before = curRef.current;
      curRef.current = before + dir;
      setCur(curRef.current);
      sim.current.forEach((c, j) => {
        const rOld = mod(j - before, N);
        const base = slot(mod(j - curRef.current, N));
        let t = base + 360 * Math.round((c.target - base) / 360);
        if (dir > 0 && t < c.target - 0.5) t += 360;
        if (dir < 0 && t > c.target + 0.5) t -= 360;
        c.target = t;
        if ((dir > 0 && rOld === 0) || (dir < 0 && rOld === N - 1)) c.fall = dir;
        if (reduce) {
          c.phi = t;
          c.v = 0;
          c.fall = 0;
          paint(j);
        }
      });
      env.current.wake();
    },
    [paint, reduce],
  );

  useEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    if (!root || !scene) return;
    const measure = () => {
      const sc = clamp((root.clientWidth - 8) / SW, 0.55, 1.14);
      root.style.height = `${Math.round(SH * sc + 84)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
      setNarrow(root.clientWidth < 560);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    sim.current.forEach((_, j) => paint(j));
    return () => ro.disconnect();
  }, [paint]);

  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current;
    if (!root) return;
    const e = env.current;
    let raf = 0;
    let last = performance.now();
    let wait = 0.5;
    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.03, (now - last) / 1000);
      last = now;
      if (!e.touched && !e.inside) {
        wait -= dt;
        if (wait < 0) {
          wait = 3.6;
          step(1, false);
        }
      }
      let hit = 0;
      sim.current.forEach((c, j) => {
        if (c.fall) {
          // pushed up to the top of its arc by a thumb, then it is gravity's
          const a = c.phi - PITCH;
          const push = c.fall * a < 6 ? c.fall * (GRAVITY * 0.92 + 1500) : 0;
          c.v += (GRAVITY * Math.sin((a * Math.PI) / 180) + push - 0.6 * c.v) * dt;
          c.phi += c.v * dt;
          if ((c.fall > 0 && c.phi >= c.target && c.v > 0) || (c.fall < 0 && c.phi <= c.target && c.v < 0)) {
            c.phi = c.target;
            if (Math.abs(c.v) > 120) hit = c.v;
            c.v *= -0.3;
            if (Math.abs(c.v) < 46) c.fall = 0;
          }
          paint(j);
        } else if (Math.abs(c.target - c.phi) > 0.01 || Math.abs(c.v) > 0.05) {
          c.v += (190 * (c.target - c.phi) - 21 * c.v) * dt;
          c.phi += c.v * dt;
          paint(j);
        }
      });
      // the pile it lands on gives a little
      if (hit) {
        sim.current.forEach((c) => {
          const m = mod(c.target, 360);
          if (!c.fall && (hit > 0 ? m >= FRONT_AT && m < 125 : m > 320)) c.v += hit * 0.09;
        });
      }
      e.knobV += (150 * (curRef.current * 22 - e.knob) - 19 * e.knobV) * dt;
      e.knob += e.knobV * dt;
      knobRefs.current.forEach((k) => k && (k.style.backgroundPositionY = `${e.knob.toFixed(1)}px`));
      const busy = sim.current.some((c) => c.fall || Math.abs(c.target - c.phi) > 0.01 || Math.abs(c.v) > 0.05) || Math.abs(e.knobV) > 0.2;
      if (e.visible && !document.hidden && (busy || (!e.touched && !e.inside))) raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf && e.visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    e.wake = start;
    const io = new IntersectionObserver(([en]) => {
      e.visible = en.isIntersecting;
      start();
    });
    io.observe(root);
    document.addEventListener("visibilitychange", start);
    start();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", start);
      e.wake = () => {};
    };
  }, [paint, reduce, step]);

  // flick the cards: pull down to send one over, push up to bring one back
  const onDown = (ev: React.PointerEvent) => {
    if (ev.button !== 0) return;
    env.current.drag = { y: ev.clientY, moved: false };
    ev.currentTarget.setPointerCapture(ev.pointerId);
  };
  const onDrag = (ev: React.PointerEvent) => {
    const d = env.current.drag;
    if (!d) return;
    const dy = ev.clientY - d.y;
    if (Math.abs(dy) > 34) {
      step(dy > 0 ? 1 : -1, true);
      d.y = ev.clientY;
      d.moved = true;
    }
  };
  const onUp = () => {
    const d = env.current.drag;
    env.current.drag = null;
    if (d && !d.moved) step(1, true);
  };

  const now = people[mod(cur, people.length)];
  const knob = (side: "left" | "right") => (
    <button
      type="button"
      onClick={() => step(side === "right" ? 1 : -1, true)}
      aria-label={side === "right" ? "Next card" : "Previous card"}
      className="group absolute h-[104px] w-[40px] rounded-[9px] focus:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#c8412b] active:brightness-125"
      style={{ top: AX - 52, [side]: 0, background: "linear-gradient(180deg, #050505 0%, #2c2c2e 9%, #6d6d72 20%, #3a3a3d 31%, #1b1b1d 55%, #0c0c0d 82%, #000 100%)", boxShadow: "0 22px 26px -12px rgba(60,8,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.06)" }}
    >
      <span ref={(el) => void (knobRefs.current[side === "left" ? 0 : 1] = el)} aria-hidden="true" className="absolute inset-y-0 rounded-[3px]" style={{ left: side === "left" ? 9 : 4, right: side === "left" ? 4 : 9, backgroundImage: "repeating-linear-gradient(180deg, rgba(0,0,0,0.75) 0 2px, rgba(255,255,255,0.16) 2px 3px, rgba(0,0,0,0) 3px 7.33px)", WebkitMaskImage: "linear-gradient(180deg, transparent 2%, #000 14%, #000 86%, transparent 98%)", maskImage: "linear-gradient(180deg, transparent 2%, #000 14%, #000 86%, transparent 98%)" }} />
      <span aria-hidden="true" className="absolute inset-y-[3px] w-[6px] rounded-full" style={{ [side]: 1, background: "linear-gradient(180deg, #55585e 0%, #f6f8fb 18%, #9da2aa 34%, #4a4d53 60%, #d9dde3 84%, #3b3d42 100%)" }} />
    </button>
  );

  return (
    <section ref={rootRef} aria-label="Client card file" className="relative w-full select-none overflow-hidden bg-[#c8412b]" style={{ height: SH + 84, backgroundImage: "radial-gradient(90% 70% at 50% 34%, #e2573a 0%, #cf462d 45%, #a9301d 100%)" }}>
      <style>{`
        .rotary-card-file-face::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: #1a0d05; opacity: var(--dim, 0); pointer-events: none; }
        .rotary-card-file-back::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(180deg, rgba(255,255,255,0.22) 0, rgba(60,30,5,0) 26px, rgba(60,30,5,0.12) 80px, rgba(40,20,5,0.55) 210px); opacity: 1; pointer-events: none; }
        .rotary-card-file-back::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: #2a1408; opacity: calc(var(--deep, 0) * 0.3); pointer-events: none; }
      `}</style>

      <div ref={sceneRef} className="absolute left-1/2 top-7 origin-top" style={{ width: SW, height: SH, transform: "translateX(-50%)" }}>
        {/* shadow on the table */}
        <div aria-hidden="true" className="absolute left-1/2 h-[70px] w-[560px] -translate-x-1/2 rounded-[50%]" style={{ top: AX + 196, background: "radial-gradient(closest-side, rgba(70,10,0,0.62), rgba(70,10,0,0.3) 55%, rgba(70,10,0,0) 100%)" }} />

        {/* top of the base running back to the posts */}
        <div aria-hidden="true" className="absolute left-1/2 -translate-x-1/2" style={{ top: AX + 70, width: 496, height: 96, background: "linear-gradient(180deg, #050505, #1c1c1e 60%, #2a2a2d)", clipPath: "polygon(4% 0, 96% 0, 100% 100%, 0 100%)" }} />
        {/* posts and the bosses the spindle runs in */}
        {[-1, 1].map((sd) => (
          <div key={sd} aria-hidden="true">
            <span className="absolute w-[16px] rounded-t-[8px]" style={{ left: SW / 2 + sd * 214 - 8, top: AX - 10, height: 150, background: "linear-gradient(90deg, #4b4e54 0%, #f3f5f8 28%, #a3a8b0 46%, #54575d 72%, #c9cdd3 90%, #55585e 100%)", boxShadow: "0 0 0 0.5px rgba(0,0,0,0.5)" }} />
            <span className="absolute h-[44px] w-[44px] rounded-full" style={{ left: SW / 2 + sd * 214 - 22, top: AX - 22, background: "conic-gradient(from 210deg, #6a6d73, #f7f8fa 12%, #8e9299 25%, #e9ecf0 40%, #5a5d63 55%, #dfe2e7 70%, #777a80 85%, #6a6d73)", boxShadow: "0 3px 5px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.25)" }} />
          </div>
        ))}
        {knob("left")}
        {knob("right")}

        {/* the wheel */}
        <div className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing" style={{ perspective: 2600, perspectiveOrigin: `50% ${AX - 130}px` }} onPointerDown={onDown} onPointerMove={onDrag} onPointerUp={onUp} onPointerCancel={() => (env.current.drag = null)} onPointerEnter={() => (env.current.inside = true)} onPointerLeave={() => (env.current.inside = false)}>
          <div aria-hidden="true" className="absolute" style={{ left: SW / 2, top: AX, width: 0, height: 0, transformStyle: "preserve-3d" }}>
            {/* hub */}
            <div className="absolute rounded-[5px]" style={{ left: -206, top: -34, width: 412, height: 68, background: "linear-gradient(180deg, #000 0%, #222224 16%, #47474b 30%, #232325 46%, #0b0b0c 78%, #000 100%)" }}>
              {[-120, 84].map((x) => (
                <span key={x} className="absolute inset-y-0 w-[36px]" style={{ left: 206 + x, background: "linear-gradient(180deg, #3a3c41 0%, #eceef2 22%, #9da1a8 38%, #46484d 62%, #17181a 100%)", boxShadow: "0 0 0 1px rgba(0,0,0,0.6)" }} />
              ))}
            </div>
            <div className="absolute" style={{ transformStyle: "preserve-3d" }}>
              {sim.current.map((_, j) => {
                const p = people[mod(j, people.length)];
                const tabbed = j % 2 === 0;
                const tabX = 30 + ((j * 97) % 250);
                const tab = (
                  <span className="absolute -top-[19px] flex h-[22px] w-[74px] items-start justify-center rounded-t-[7px] pt-[3px] text-[11px] font-bold leading-none text-white" style={{ left: tabX, background: `linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 60%), ${p.tab}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)", fontFamily: TYPE }}>
                    {p.name.split(" ")[1][0]}
                  </span>
                );
                return (
                  <div key={j} ref={(el) => void (cardRefs.current[j] = el)} className="absolute" style={{ left: -CARD_W / 2, top: -LEN, width: CARD_W, height: LEN, transformOrigin: "50% 100%", transformStyle: "preserve-3d", transform: `rotateX(${-slot(j)}deg)`, visibility: slot(j) > 125 ? "hidden" : "visible" }}>
                    {/* face */}
                    <div className="rotary-card-file-face absolute inset-x-0 top-0 rounded-b-[3px] rounded-t-[13px] bg-[#f4ecd9]" style={{ height: BODY, backfaceVisibility: "hidden", backgroundImage: `${FIBRE}, linear-gradient(180deg, #fbf5e6 0%, #f3ead4 62%, #d9cdb2 100%)`, boxShadow: "inset 0 0 0 1px rgba(90,60,20,0.22), inset 0 2px 0 rgba(255,255,255,0.7)" }}>
                      {tabbed && tab}
                      <span className="absolute right-[18px] top-[13px] font-serif text-[30px] font-bold leading-none text-[#c8412b]/85">{p.name.split(" ")[1][0]}</span>
                      <div className="absolute inset-x-0 top-0 px-[24px] pt-[26px]" style={{ fontFamily: TYPE, color: "#26211c" }}>
                        <div className="relative float-left mr-[18px] mt-[6px] -rotate-[3deg] bg-white p-[6px]" style={{ width: narrow ? 88 : 116, height: narrow ? 110 : 146, boxShadow: "0 1px 2px rgba(60,30,0,0.4), 0 6px 10px -4px rgba(60,30,0,0.35)" }}>
                          <div className="h-full w-full overflow-hidden" style={{ background: p.photo.tone }}>
                            <img src={p.photo.src} alt="" width={104} height={134} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: p.photo.focus }} />
                          </div>
                          <svg viewBox="0 0 22 56" className="absolute -top-[18px] left-[10px] h-[56px] w-[22px]" fill="none" strokeLinecap="round">
                            <path d="M6 44V14a5 5 0 0 1 10 0v32a8 8 0 0 1-16 0V12" transform="translate(3 2)" stroke="rgba(40,20,0,0.35)" strokeWidth="2.4" />
                            <path d="M6 44V14a5 5 0 0 1 10 0v32a8 8 0 0 1-16 0V12" transform="translate(2 0)" stroke="#c9ced6" strokeWidth="2.2" />
                            <path d="M6 44V14a5 5 0 0 1 10 0v32a8 8 0 0 1-16 0V12" transform="translate(1.5 -0.4)" stroke="#fff" strokeWidth="0.7" opacity="0.85" />
                          </svg>
                        </div>
                        <div className="overflow-hidden">
                        <p className="pr-[22px] font-medium" style={{ fontSize: narrow ? 18.5 : 17, lineHeight: narrow ? "25px" : "26px" }}>{p.quote}</p>
                        <p className="mt-[12px] font-bold" style={{ fontSize: narrow ? 14.5 : 14 }}>{p.name}</p>
                        <p className="text-[#5b4a36]" style={{ fontSize: narrow ? 12.5 : 12 }}>{p.role}</p>
                        </div>
                      </div>
                      {[92, 296].map((x) => (
                        <span key={x} className="absolute bottom-0 h-[11px] w-[12px] rounded-t-full bg-[#191310]" style={{ left: x, boxShadow: "inset 0 2px 2px rgba(0,0,0,0.9), 0 -1px 0 rgba(255,255,255,0.35)" }} />
                      ))}
                      <span className="absolute inset-x-0 bottom-0 h-[70px] rounded-b-[3px]" style={{ background: "linear-gradient(180deg, rgba(60,30,5,0), rgba(60,30,5,0.34))" }} />
                    </div>
                    {/* back */}
                    <div className="rotary-card-file-back absolute inset-x-0 top-0 rounded-b-[3px] rounded-t-[13px] bg-[#efe5cf]" style={{ height: BODY, backfaceVisibility: "hidden", transform: "rotateY(180deg)", backgroundImage: `${FIBRE}, linear-gradient(180deg, #fdf8ea, #efe5cf)`, boxShadow: "inset 0 0 0 1px rgba(90,60,20,0.25), inset 0 3px 0 rgba(255,255,255,0.85)" }}>
                      {tabbed && <span className="absolute -top-[19px] h-[22px] w-[74px] rounded-t-[7px]" style={{ right: tabX, background: `linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05)), ${p.tab}` }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* front of the base, which the cards that have gone over disappear behind */}
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-b-[20px] rounded-t-[10px]" style={{ top: AX + 152, width: 506, height: 84, background: "linear-gradient(180deg, #5c5c61 0%, #2b2b2e 5%, #151516 30%, #0a0a0b 72%, #000 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -10px 16px rgba(0,0,0,0.7), 0 18px 22px -8px rgba(50,5,0,0.6)" }}>
          <span className="absolute inset-x-[14px] top-[13px] h-[3px] rounded-full" style={{ background: "linear-gradient(90deg, #6f7379, #f4f6f9 20%, #a6abb3 50%, #f4f6f9 80%, #6f7379)" }} />
          <span className="absolute left-1/2 top-[32px] flex h-[26px] -translate-x-1/2 items-center rounded-[3px] px-[14px] text-[9px] font-bold uppercase tracking-[0.34em] text-[#2a2a2d]" style={{ background: "linear-gradient(180deg, #f1f3f6, #b9bec6 55%, #8d929a)", boxShadow: "inset 0 1px 0 #fff, 0 1px 2px rgba(0,0,0,0.8)" }}>
            Kind words
          </span>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-4 left-5 text-[10px] font-bold uppercase leading-relaxed tracking-[0.22em] text-white">
        Card file
        <span className="block font-medium text-[#ffe3da]">Turn a knob or flick the cards</span>
      </p>

      <figure className="sr-only" aria-live="polite">
        <blockquote>{now.quote}</blockquote>
        <figcaption>
          {now.name}, {now.role}
        </figcaption>
      </figure>
    </section>
  );
}
