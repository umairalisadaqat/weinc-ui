import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

/** One divider per section. `tab` is the word on the coloured tab; the photograph faces the text across the rings. */
const kitchen = { name: "Marlowe Kitchen", book: "The year in four menus", hint: "Press a coloured tab to turn to it" };
const sections = [
  {
    tab: "Spring", colour: "#7fae4c", deep: "#3c641f", title: "First of the green",
    photo: "https://images.pexels.com/photos/6608620/pexels-photo-6608620.jpeg?auto=compress&cs=tinysrgb&w=900", tone: "#c9c7b4",
    alt: "A white bowl of green peas and asparagus tips with an egg yolk in the middle, seen from above", caption: "Peas, asparagus, cured yolk",
    body: "The menu turns over in the week the first asparagus arrives from the farm at Hollin Cross. Everything is cooked for seconds, dressed with good oil and left alone.",
    dishes: [["Peas, asparagus, cured yolk", "11"], ["Jersey royals, wild garlic butter", "8"], ["Rhubarb, buttermilk, ginger crumb", "9"]],
  },
  {
    tab: "Summer", colour: "#f0b429", deep: "#8a5a00", title: "Tomatoes all day",
    photo: "https://images.pexels.com/photos/6461772/pexels-photo-6461772.jpeg?auto=compress&cs=tinysrgb&w=900", tone: "#eeb7c4",
    alt: "Yellow tomatoes and peppers cut open on a pink plate beside a small pan of pink salt", caption: "Yellow tomatoes, sea salt",
    body: "By July the kitchen barely needs the stove. Tomatoes come in warm from the tunnel, get salt and twenty minutes on the counter, and go out before they have ever seen a fridge.",
    dishes: [["Yellow tomatoes, sea salt, basil oil", "10"], ["Grilled courgette, ricotta, mint", "12"], ["Peaches, brown sugar, cold cream", "9"]],
  },
  {
    tab: "Autumn", colour: "#dd6a2c", deep: "#8f3a0e", title: "Slow oven season",
    photo: "https://images.pexels.com/photos/9443902/pexels-photo-9443902.jpeg?auto=compress&cs=tinysrgb&w=900", tone: "#2f5d5c",
    alt: "Scored wedges of roasted pumpkin on a dark teal plate with a sprig of dill", caption: "Roast pumpkin, brown butter",
    body: "Once the squash is cut the ovens stay on low from breakfast. Roots, brassicas and the last of the orchard fruit go in whole and come out soft enough to eat with a spoon.",
    dishes: [["Roast pumpkin, brown butter, dill", "11"], ["Hispi cabbage, anchovy, crumbs", "12"], ["Baked apple, oat cream", "8"]],
  },
  {
    tab: "Winter", colour: "#4a78c2", deep: "#1f3f7a", title: "Out of the larder",
    photo: "https://images.pexels.com/photos/19185775/pexels-photo-19185775.jpeg?auto=compress&cs=tinysrgb&w=900", tone: "#1a1614",
    alt: "A black bowl of bright red tomato soup on a black table, seen from above", caption: "Bottled tomato soup",
    body: "January cooking is whatever we put away in September. Bottled tomatoes, dried beans and a shelf of pickles carry the menu until the ground wakes up again.",
    dishes: [["Bottled tomato soup, sour cream", "8"], ["White beans, kale, parmesan rind", "12"], ["Marmalade sponge, custard", "9"]],
  },
];

// Two sets of measurements in pixels: one for desks, one for phones.
const WIDE = { pageW: 350, pageH: 470, gut: 44, tabW: 32, rim: 14, padY: 18, pad: 30, title: 38, text: 15, lead: 24, small: 12.5, tabText: 11.5, hit: 0 };
const SLIM = { pageW: 146, pageH: 374, gut: 20, tabW: 17, rim: 4, padY: 10, pad: 11, title: 19, text: 11.5, lead: 16.5, small: 9.8, tabText: 8.5, hit: 24 };
type Dims = typeof WIDE;
const RINGS = [0.14, 0.5, 0.86];
const TILT = 21; // how far the binder leans away from the camera, in degrees

const svgUrl = (body: string, w: number, h: number) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`)}")`;
const PAPER = svgUrl(`<filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.4  0 0 0 0 0.32  0 0 0 0 0.2  0 0 0 0.42 -0.13'/></filter><rect width='240' height='240' filter='url(#p)'/>`, 240, 240);
const CLOTH = svgUrl(`<filter id='c'><feTurbulence type='turbulence' baseFrequency='1.1 1.3' numOctaves='2' seed='3'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.34 -0.1'/></filter><rect width='200' height='200' filter='url(#c)'/>`, 200, 200);
const CHROME = "linear-gradient(180deg, #5c6166 0%, #f7f9fa 16%, #c3c9ce 30%, #70777d 52%, #2d3135 66%, #9ba3a9 82%, #e4e8eb 92%, #4b5055 100%)";
const PAGE = "#f7f2e6";

/** The printed side of a divider: the words for its section. */
function TextPage({ i, d, uid, active }: { i: number; d: Dims; uid: string; active: boolean }) {
  const s = sections[i];
  return (
    <div id={`${uid}-p${i}`} role="tabpanel" aria-labelledby={`${uid}-t${i}`} aria-hidden={!active} className="absolute inset-0 flex flex-col font-serif text-[#2b2620]" style={{ padding: `${d.pad}px ${d.pad}px ${d.pad - 4}px ${d.pad + (d.hit ? 6 : 12)}px` }}>
      <div className="flex items-center justify-between font-mono uppercase" style={{ fontSize: d.small - 3, letterSpacing: "0.18em", color: s.deep }}>
        <span>{kitchen.name}</span>
        <span aria-hidden="true">0{i + 1}</span>
      </div>
      <h3 className="m-0 font-serif font-bold leading-[1.02] tracking-[-0.015em]" style={{ fontSize: d.title, marginTop: d.hit ? 12 : 26, color: s.deep }}>
        {s.title}
      </h3>
      <span aria-hidden="true" className="block rounded-full" style={{ width: d.hit ? 22 : 40, height: d.hit ? 3 : 4, margin: d.hit ? "9px 0" : "18px 0", background: s.colour }} />
      <p className="m-0" style={{ fontSize: d.text, lineHeight: `${d.lead}px` }}>
        {s.body}
      </p>
      <ul className="m-0 mt-auto list-none p-0">
        {s.dishes.map(([dish, price]) => (
          <li key={dish} className="flex items-baseline gap-2" style={{ fontSize: d.small, padding: d.hit ? "4px 0" : "7px 0", borderTop: "1px solid rgba(60,45,25,0.22)" }}>
            <span className="min-w-0 flex-1 leading-snug">{dish}</span>
            <span className="font-mono font-bold" style={{ color: s.deep }}>
              {price}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The other side: a full plate photograph of the section that follows. */
function PhotoPage({ i, d, active }: { i: number; d: Dims; active: boolean }) {
  const s = sections[i];
  const m = d.hit ? 8 : 18;
  return (
    <figure aria-hidden={!active} className="absolute inset-0 m-0 flex flex-col" style={{ padding: `${m}px ${m + (d.hit ? 5 : 10)}px ${m - 2}px ${m}px` }}>
      <img src={s.photo} alt={s.alt} width={600} height={900} loading="eager" className="block min-h-0 w-full flex-1 object-cover" style={{ background: s.tone, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)" }} />
      <figcaption className="flex items-baseline justify-between gap-2 font-serif italic text-[#3a332a]" style={{ fontSize: d.small - 0.5, paddingTop: d.hit ? 5 : 9 }}>
        <span className="min-w-0 truncate">{s.caption}</span>
        {d.hit ? null : (
          <span aria-hidden="true" className="shrink-0 font-mono not-italic uppercase" style={{ fontSize: d.small - 3, letterSpacing: "0.16em", color: s.deep }}>
            {s.tab}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function Sheet({ d, side, children, edge }: { d: Dims; side: "right" | "left"; children: ReactNode; edge?: boolean }) {
  const inner = side === "right" ? "left" : "right";
  return (
    <div className="absolute inset-y-0 overflow-hidden" style={{ [inner]: side === "right" ? d.gut / 2 : d.gut / 2, width: d.pageW, borderRadius: side === "right" ? "1px 4px 4px 1px" : "4px 1px 1px 4px", background: PAGE, backgroundImage: `linear-gradient(${side === "right" ? 90 : 270}deg, rgba(40,28,10,0.3) 0, rgba(40,28,10,0.1) 4%, rgba(40,28,10,0) 13%, rgba(255,255,255,0.35) 30%, rgba(40,28,10,0) 70%, rgba(40,28,10,0.06) 100%), ${PAPER}`, boxShadow: edge ? "0 0 0 0.5px rgba(70,55,30,0.35)" : "0 0 0 0.5px rgba(70,55,30,0.35), 0 1px 3px rgba(30,20,5,0.25)" }}>
      {children}
      {RINGS.map((r) => (
        <span key={r} aria-hidden="true" className="absolute block rounded-full" style={{ [inner]: d.hit ? 3 : 7, top: `${r * 100}%`, width: d.hit ? 6 : 10, height: d.hit ? 6 : 10, marginTop: d.hit ? -3 : -5, background: "#17181a", boxShadow: "inset 0 1.5px 2px rgba(0,0,0,0.9), 0 0.5px 0 rgba(255,255,255,0.9)" }} />
      ))}
    </div>
  );
}

function Tab({ i, d, side, active, focused }: { i: number; d: Dims; side: "right" | "left"; active: boolean; focused: boolean }) {
  const s = sections[i];
  const h = d.pageH / sections.length;
  const out = side === "right";
  return (
    <span aria-hidden="true" className="absolute grid place-items-center font-sans font-bold uppercase" style={{ [out ? "right" : "left"]: 0, top: i * h + 4, height: h - 8, width: d.tabW + 6, paddingLeft: out ? 6 : 0, paddingRight: out ? 0 : 6, borderRadius: out ? "0 7px 7px 0" : "7px 0 0 7px", background: s.colour, backgroundImage: `linear-gradient(${out ? 90 : 270}deg, rgba(0,0,0,0.22) 0, rgba(0,0,0,0) 26%, rgba(255,255,255,0.34) 52%, rgba(255,255,255,0) 72%, rgba(0,0,0,0.16) 100%), linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0) 18%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.18))`, boxShadow: `${out ? 2 : -2}px 2px 4px rgba(0,0,0,0.45), inset 0 0 0 0.5px rgba(0,0,0,0.3)${focused ? ", 0 0 0 2px #f7f2e6, 0 0 0 4.5px #1f5fbf" : ""}`, fontSize: d.tabText, letterSpacing: "0.16em", color: active ? "#fffdf6" : "rgba(30,22,10,0.72)", textShadow: active ? "0 1px 1px rgba(0,0,0,0.35)" : "0 1px 0 rgba(255,255,255,0.25)" }}>
      <span style={{ writingMode: "vertical-rl", transform: out ? "none" : "rotate(180deg)" }}>{s.tab}</span>
    </span>
  );
}

function Leaf({ i, d, turned, wait, reduce, active, next, focused, uid, onPick, onKey, onFocus, setRef }: { i: number; d: Dims; turned: boolean; wait: number; reduce: boolean; active: boolean; next: boolean; focused: boolean; uid: string; onPick: () => void; onKey: (e: KeyboardEvent) => void; onFocus: (e: { on: boolean; el: HTMLElement }) => void; setRef: (el: HTMLButtonElement | null) => void }) {
  const n = sections.length;
  const angle = useMotionValue(turned ? -180 : 0);
  const z = useTransform(angle, [0, -90, -180], [(n - i) * 0.7, 30, (i + 1) * 0.7]);
  const frontShade = useTransform(angle, [0, -90], [0, 0.42]);
  const backShade = useTransform(angle, [-90, -180], [0.5, 0]);
  const was = useRef(turned);

  useEffect(() => {
    if (was.current === turned || reduce) {
      was.current = turned;
      angle.set(turned ? -180 : 0);
      return;
    }
    was.current = turned;
    const run = animate(angle, turned ? -180 : 0, { duration: 0.95, delay: wait, ease: [0.42, 0, 0.18, 1] });
    return () => run.stop();
  }, [turned, reduce, wait, angle]);

  const w = d.gut / 2 + d.pageW + d.tabW;
  const h = d.pageH / n;
  return (
    <motion.div className="absolute" style={{ left: "50%", top: d.padY, width: w, height: d.pageH, rotateY: angle, z, transformOrigin: "0% 50%", transformStyle: "preserve-3d" }}>
      <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
        <Tab i={i} d={d} side="right" active={active} focused={focused} />
        <Sheet d={d} side="right">
          <TextPage i={i} d={d} uid={uid} active={active} />
          <span aria-hidden="true" className="absolute inset-y-0 right-0 block" style={{ width: d.hit ? 3 : 5, background: sections[i].colour, opacity: 0.9 }} />
          <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 block" style={{ background: "linear-gradient(90deg, #1a140a, #5a4a30)", opacity: frontShade }} />
        </Sheet>
      </div>
      <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
        <Tab i={i} d={d} side="left" active={active} focused={focused} />
        <Sheet d={d} side="left">
          {i + 1 < n ? <PhotoPage i={i + 1} d={d} active={next} /> : null}
          <span aria-hidden="true" className="absolute inset-y-0 left-0 block" style={{ width: d.hit ? 3 : 5, background: sections[i].colour, opacity: 0.9 }} />
          <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 block" style={{ background: "linear-gradient(270deg, #1a140a, #5a4a30)", opacity: backShade }} />
        </Sheet>
      </div>
      {/* the control rides on the divider itself, so it stays under your finger while the page turns */}
      <button
        type="button"
        ref={setRef}
        id={`${uid}-t${i}`}
        role="tab"
        aria-selected={active}
        aria-controls={`${uid}-p${i}`}
        tabIndex={active ? 0 : -1}
        onClick={onPick}
        onKeyDown={onKey}
        onFocus={(e) => onFocus({ on: true, el: e.currentTarget })}
        onBlur={(e) => onFocus({ on: false, el: e.currentTarget })}
        className="absolute cursor-pointer bg-transparent outline-none"
        style={{ right: -4, top: i * h + 2, height: h - 4, width: d.tabW + 6 + d.hit }}
      >
        <span className="sr-only">{sections[i].tab}</span>
      </button>
    </motion.div>
  );
}

export default function RingBinderTabs() {
  const reduce = !!useReducedMotion();
  const uid = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [slim, setSlim] = useState(false);
  const [scale, setScale] = useState(1);
  const [sel, setSel] = useState({ now: 1, was: 1 });
  const [focus, setFocus] = useState(-1);
  const idle = useRef({ touched: false, paused: false });

  const d = slim ? SLIM : WIDE;
  const n = sections.length;
  const half = d.gut / 2 + d.pageW + d.tabW + d.rim;
  const W = half * 2;
  const H = d.pageH + d.padY * 2;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const w = wrap.clientWidth;
      const narrow = w < 900;
      const m = narrow ? SLIM : WIDE;
      setSlim(narrow);
      setScale(Math.min(narrow ? 1.5 : 1, (w - (narrow ? 24 : 10)) / ((m.gut / 2 + m.pageW + m.tabW + m.rim) * 2)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // until someone touches it, the binder leafs through the year
  useEffect(() => {
    if (reduce) return;
    const s = idle.current;
    const t = window.setInterval(() => {
      if (s.touched || s.paused || document.hidden) return;
      setSel((v) => ({ now: (v.now + 1) % n, was: v.now }));
    }, 3400);
    return () => window.clearInterval(t);
  }, [reduce, n]);

  const pick = (i: number, focusIt = false) => {
    idle.current.touched = true;
    setSel((v) => (v.now === i ? v : { now: i, was: v.now }));
    if (focusIt) tabs.current[i]?.focus();
  };
  const onKey = (i: number) => (e: KeyboardEvent) => {
    const to = e.key === "ArrowDown" || e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (i + n - 1) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    pick(to, true);
  };
  const top = d.hit ? 26 : 62;

  return (
    <section className="relative overflow-hidden bg-[#e3ddd0]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(72% 64% at 44% 36%, #f6f2e9 0%, #e5dfd2 50%, #c9c1b0 100%)" }} />
      <div ref={wrapRef} onPointerEnter={() => (idle.current.paused = true)} onPointerLeave={() => (idle.current.paused = false)} className="relative mx-auto w-full max-w-[1100px]" style={{ height: Math.round(H * scale) + top + (d.hit ? 100 : 104) }}>
        <h2 className="sr-only">
          {kitchen.name}: {kitchen.book}
        </h2>
        <div role="tablist" aria-label="Seasons" aria-orientation="vertical" aria-owns={sections.map((_, i) => `${uid}-t${i}`).join(" ")} />
        <div className="absolute left-1/2" style={{ top, width: W, height: H, transformOrigin: "50% 0", transform: `translateX(-50%) scale(${scale})`, perspective: 2400, perspectiveOrigin: "50% 20%" }}>
          <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "50% 50%", transform: `rotateX(${TILT}deg)` }}>
          {/* the shadow the binder leaves on the desk */}
          <div aria-hidden="true" className="absolute rounded-[20px]" style={{ left: 10, right: -6, top: 22, bottom: -26, background: "rgba(48,38,22,0.5)", filter: "blur(26px)" }} />
          <div aria-hidden="true" className="absolute rounded-[12px]" style={{ inset: "2px -1px -5px -1px", background: "rgba(30,22,10,0.55)", filter: "blur(4px)" }} />
          {/* cloth-covered boards, with the two hinge grooves either side of the spine */}
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ borderRadius: d.hit ? 7 : 11, background: "#24303a", backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0) 14%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.3)), ${CLOTH}`, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.6), inset 0 1.5px 0 rgba(255,255,255,0.22), inset 0 -2px 0 rgba(0,0,0,0.45)" }}>
            <span className="absolute inset-y-0 left-1/2 block" style={{ width: d.gut + (d.hit ? 14 : 26), transform: "translateX(-50%)", background: "linear-gradient(90deg, rgba(0,0,0,0.55) 0, rgba(255,255,255,0.1) 3px, rgba(0,0,0,0.12) 8px, rgba(0,0,0,0.12) calc(100% - 8px), rgba(255,255,255,0.1) calc(100% - 3px), rgba(0,0,0,0.55) 100%)" }} />
          </div>

          <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
              {/* what is always on the left: the flyleaf, showing the first photograph, on the pages already turned */}
              <div className="absolute" style={{ right: "50%", top: d.padY, width: d.gut / 2 + d.pageW, height: d.pageH }}>
                <div aria-hidden="true" className="absolute inset-y-0 rounded-[4px]" style={{ left: 0, width: d.pageW, background: "#d9d2c2", boxShadow: "-1px 1px 0 #f1ecdf, -2px 2px 0 #cfc7b5, -3px 3px 0 #efe9da, -4px 4px 0 #c2baa7, -8px 10px 16px rgba(0,0,0,0.5)" }} />
                <Sheet d={d} side="left" edge>
                  <PhotoPage i={0} d={d} active={sel.now === 0} />
                </Sheet>
              </div>
              {/* and on the right: the rest of the block under the dividers */}
              <div aria-hidden="true" className="absolute rounded-[4px]" style={{ left: `calc(50% + ${d.gut / 2}px)`, top: d.padY, width: d.pageW, height: d.pageH, background: "#d9d2c2", boxShadow: "1px 1px 0 #f1ecdf, 2px 2px 0 #cfc7b5, 3px 3px 0 #efe9da, 4px 4px 0 #c2baa7, 5px 5px 0 #ece6d7, 10px 12px 18px rgba(0,0,0,0.5)" }} />
              {sections.map((_, i) => {
                const turned = i < sel.now;
                const wait = sel.now > sel.was ? Math.max(0, i - sel.was) * 0.14 : Math.max(0, sel.was - 1 - i) * 0.14;
                return (
                  <Leaf key={i} i={i} d={d} turned={turned} wait={wait} reduce={reduce} active={sel.now === i} next={sel.now === i + 1} focused={focus === i} uid={uid} onPick={() => pick(i)} onKey={onKey(i)} setRef={(el) => (tabs.current[i] = el)} onFocus={({ on, el }) => { idle.current.paused = on; setFocus((f) => (on ? (el.matches(":focus-visible") ? i : f) : f === i ? -1 : f)); }} />
                );
              })}
            </div>
          </div>

          {/* the mechanism: a steel plate down the spine and three chrome rings standing up over it */}
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2" style={{ top: d.padY + d.pageH * 0.045, bottom: d.padY + d.pageH * 0.045, width: d.hit ? 11 : 24, marginLeft: d.hit ? -5.5 : -12, borderRadius: d.hit ? 3 : 5, transform: "translateZ(0.4px)", background: "linear-gradient(90deg, #2c3034 0%, #8d959b 9%, #d8dde0 22%, #b4bbc0 50%, #cfd4d8 76%, #7b8389 91%, #25292c 100%)", boxShadow: "0 2px 5px rgba(0,0,0,0.55), inset 0 0 0 0.5px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.8)" }}>
            {[0.3, 0.7].map((r) => (
              <span key={r} className="absolute left-1/2 block rounded-full" style={{ top: `${r * 100}%`, width: d.hit ? 5 : 9, height: d.hit ? 5 : 9, transform: "translate(-50%, -50%)", background: "radial-gradient(circle at 35% 30%, #ffffff, #8b9399 55%, #2b2f33)", boxShadow: "0 0 0 0.5px rgba(0,0,0,0.8)" }} />
            ))}
          </div>
          {RINGS.map((r, k) => {
            const span = d.gut + (d.hit ? 12 : 24);
            const t = d.hit ? 3.4 : 6.5;
            const tall = span * 0.56;
            const y = d.padY + d.pageH * r;
            const arch = `M${t / 2} ${tall + t / 2} A${span / 2} ${tall} 0 0 1 ${span + t / 2} ${tall + t / 2}`;
            const gid = `${uid.replace(/:/g, "")}-ring${k}`;
            return (
              <div key={r} aria-hidden="true" className="pointer-events-none absolute left-1/2" style={{ top: 0, width: 0, height: 0, transformStyle: "preserve-3d" }}>
                <span className="absolute block rounded-full" style={{ left: -span / 2 - 2, top: y + (d.hit ? 1 : 2), width: span + 4, height: d.hit ? 5 : 9, transform: "translateZ(1.2px)", background: "rgba(20,14,6,0.5)", filter: `blur(${d.hit ? 2 : 3.5}px)` }} />
                <svg className="absolute block overflow-visible" width={span + t} height={tall + t / 2} viewBox={`0 0 ${span + t} ${tall + t / 2}`} fill="none" style={{ left: -(span + t) / 2, top: y - tall - t / 2, transformOrigin: "50% 100%", transform: "rotateX(-90deg)" }}>
                  <defs>
                    <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#2e3337" />
                      <stop offset="0.12" stopColor="#aeb6bc" />
                      <stop offset="0.3" stopColor="#ffffff" />
                      <stop offset="0.44" stopColor="#8f979d" />
                      <stop offset="0.58" stopColor="#3d4347" />
                      <stop offset="0.74" stopColor="#c9d0d5" />
                      <stop offset="0.9" stopColor="#f4f6f7" />
                      <stop offset="1" stopColor="#3a3f44" />
                    </linearGradient>
                  </defs>
                  <path d={arch} stroke="#0c0d0e" strokeWidth={t + 1.2} strokeLinecap="round" opacity="0.7" />
                  <path d={arch} stroke={`url(#${gid})`} strokeWidth={t} strokeLinecap="round" />
                  <path d={arch} stroke="#ffffff" strokeWidth={t * 0.18} strokeLinecap="round" opacity="0.85" transform={`translate(0 ${-t * 0.2})`} />
                </svg>
              </div>
            );
          })}
          </div>
        </div>
        <p className="absolute bottom-5 left-5 m-0 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#5d5646] sm:bottom-7 sm:left-8">
          <span className="text-[#231d15]">
            {kitchen.name}: {kitchen.book}
          </span>
          <span className="block">{kitchen.hint}</span>
        </p>
      </div>
    </section>
  );
}
