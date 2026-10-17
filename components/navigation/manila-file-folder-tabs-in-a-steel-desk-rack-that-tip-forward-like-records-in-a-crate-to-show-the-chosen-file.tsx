import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

/** One folder per tab, front of the rack first. `tab` is typed on the label; `band` is the colour stripe on it. */
const studio = { name: "Vale Street Studio", drawer: "Shoot files", hint: "Press a tab to flip to that file" };
const files = [
  {
    tab: "Citrus", band: "#f07d1a", ref: "041", set: "Studio 2, orange cove", light: "One hard key, no fill",
    photo: "https://images.pexels.com/photos/18505997/pexels-photo-18505997.jpeg?auto=compress&cs=tinysrgb&w=700", tone: "#e8791c",
    alt: "A woman in a white top lying on an orange floor among scattered oranges, holding half an orange up to one eye",
    notes: "The whole set is painted the colour of the fruit, so only the white top and the skin read. Shoot from the ladder. Keep six spare oranges for the cut halves.",
  },
  {
    tab: "Cobalt", band: "#2f63d6", ref: "042", set: "Studio 1, blue paper", light: "Soft top light, floor flagged",
    photo: "https://images.pexels.com/photos/30755172/pexels-photo-30755172.jpeg?auto=compress&cs=tinysrgb&w=700", tone: "#1f5fae",
    alt: "A woman in pale blue denim crouching with her arms crossed against a deep blue backdrop",
    notes: "Tone on tone: washed denim against nine metres of cobalt paper. Hair goes up as high as it will stand. Leave the floor seam in, because it gives the frame a horizon.",
  },
  {
    tab: "Halo", band: "#f2c21b", ref: "043", set: "Studio 3, grey wall", light: "Snooted spot, yellow gel",
    photo: "https://images.pexels.com/photos/8542206/pexels-photo-8542206.jpeg?auto=compress&cs=tinysrgb&w=700", tone: "#b58a12",
    alt: "A figure in a black hat and a beige suit standing in front of a glowing yellow circle of light",
    notes: "One spot with a yellow gel makes the sun. The subject stands a metre off the wall so that the shadow falls inside the circle. The hat brim stays level in every frame.",
  },
  {
    tab: "Mesa", band: "#b5482a", ref: "044", set: "Red quarry, east track", light: "Open shade, last hour",
    photo: "https://images.pexels.com/photos/15047595/pexels-photo-15047595.jpeg?auto=compress&cs=tinysrgb&w=700", tone: "#b9b4a8",
    alt: "A woman in a long white dress sitting on pale ground in front of a red sandstone outcrop",
    notes: "Drive out for the last hour, when the rock turns from orange to brick. The dress is spread wide and pinned to the ground. Bring water, boards and a broom for the footprints.",
  },
  {
    tab: "Ember", band: "#e2341d", ref: "045", set: "Studio 2, red wall", light: "Two heads, bare bulbs",
    photo: "https://images.pexels.com/photos/39325164/pexels-photo-39325164.jpeg?auto=compress&cs=tinysrgb&w=700", tone: "#e2401a",
    alt: "A woman in an orange vest and a lime skirt seated against a saturated red and orange wall",
    notes: "A neon vest, a lime skirt and a wall mixed two shades hotter than either. Bare bulbs for a hard shine on the skin. The white arm wraps stay on: they are the styling.",
  },
];

// Two sets of measurements in pixels: one for desks, one for phones.
const WIDE = { fw: 640, fh: 344, tabW: 126, tabH: 32, m: 16, photoW: 204, photoH: 266, title: 50, text: 14.5, lead: 22.5, mono: 11, label: 11.5, wide: true };
const SLIM = { fw: 300, fh: 326, tabW: 66, tabH: 28, m: 9, photoW: 104, photoH: 138, title: 30, text: 12.5, lead: 18.5, mono: 9.5, label: 9, wide: false };
type Dims = typeof WIDE;
const GAP = 26; // distance between one folder's hinge and the next, going back
const PITCH = 27; // how far the camera looks down on the desk, in degrees
const LEAN = 8; // standing folders lean back on the rest this much
const flat = (i: number) => -(87.5 - 2.4 * i); // a tipped folder lies on the ones in front of it

const svgUrl = (body: string, w: number, h: number) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`)}")`;
const FIBRE = svgUrl(`<filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.75 0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.42  0 0 0 0 0.27  0 0 0 0 0.06  0 0 0 0.75 -0.24'/></filter><rect width='260' height='260' filter='url(#f)'/>`, 260, 260);
const BRUSHED = svgUrl(`<filter id='b'><feTurbulence type='fractalNoise' baseFrequency='0.004 0.9' numOctaves='2' seed='5'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 -0.16'/></filter><rect width='500' height='200' filter='url(#b)'/>`, 500, 200);
const MANILA = "#e6c98f";
/** A folder dropped on the pile: it falls faster and faster, lands, and hops once. */
const fall = (t: number) => (t < 0.7 ? Math.pow(t / 0.7, 2.2) : 1 - 0.035 * Math.sin(((t - 0.7) / 0.3) * Math.PI));

function Clip({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 44" className={className} style={style} fill="none">
      <path d="M11.5 12.5v20a4 4 0 0 1-8 0V8.5a6 6 0 0 1 12 0V34" stroke="#3b3f44" strokeWidth="2.6" strokeLinecap="round" opacity="0.35" transform="translate(0.8 1.2)" />
      <path d="M11.5 12.5v20a4 4 0 0 1-8 0V8.5a6 6 0 0 1 12 0V34" stroke="#c9cfd4" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M11.5 12.5v20a4 4 0 0 1-8 0V8.5a6 6 0 0 1 12 0V34" stroke="#ffffff" strokeWidth="0.6" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

function Label({ i, d, active, focused }: { i: number; d: Dims; active: boolean; focused: boolean }) {
  const f = files[i];
  return (
    <span aria-hidden="true" className="absolute flex items-center overflow-hidden rounded-[2px] font-mono font-bold uppercase" style={{ left: d.wide ? 13 : 8, right: d.wide ? 13 : 8, top: 5, height: d.tabH - 9, background: "#fbf8ef", boxShadow: `0 0.5px 1px rgba(70,45,10,0.6)${focused ? ", 0 0 0 2px #e6c98f, 0 0 0 4.5px #1f5fbf" : ""}`, fontSize: d.label, letterSpacing: d.wide ? "0.14em" : "0.04em", color: active ? "#1b1712" : "#4a4032" }}>
      <span className="block h-full shrink-0" style={{ width: d.wide ? 9 : 5, background: f.band }} />
      <span className="min-w-0 flex-1 text-center">{f.tab}</span>
    </span>
  );
}

function Folder({ i, d, tipped, wait, reduce, active, shaded, covered, focused, uid, onPick, onKey, onFocus, setRef }: { i: number; d: Dims; tipped: boolean; wait: number; reduce: boolean; active: boolean; shaded: boolean; covered: boolean; focused: boolean; uid: string; onPick: () => void; onKey: (e: KeyboardEvent) => void; onFocus: (e: { on: boolean; el: HTMLElement }) => void; setRef: (el: HTMLButtonElement | null) => void }) {
  const f = files[i];
  const n = files.length;
  const angle = useMotionValue(tipped ? flat(i) : LEAN);
  const frontDim = useTransform(angle, [LEAN, -60], [0, 0.5]);
  const was = useRef(tipped);

  useEffect(() => {
    if (was.current === tipped || reduce) {
      was.current = tipped;
      angle.set(tipped ? flat(i) : LEAN);
      return;
    }
    was.current = tipped;
    const run = tipped ? animate(angle, flat(i), { duration: 0.62, delay: wait, ease: fall }) : animate(angle, LEAN, { type: "spring", stiffness: 150, damping: 19, delay: wait });
    return () => run.stop();
  }, [tipped, reduce, wait, angle, i]);

  const tl = (i * (d.fw - d.tabW)) / (n - 1);
  const cut = 9;
  const H = d.fh + d.tabH;
  const shapeFront = `polygon(0 ${d.tabH}px, ${tl}px ${d.tabH}px, ${tl + cut}px 0, ${tl + d.tabW - cut}px 0, ${tl + d.tabW}px ${d.tabH}px, 100% ${d.tabH}px, 100% 100%, 0 100%)`;
  const shapeBack = `polygon(0 0, 100% 0, 100% ${d.fh}px, ${tl + d.tabW}px ${d.fh}px, ${tl + d.tabW - cut}px 100%, ${tl + cut}px 100%, ${tl}px ${d.fh}px, 0 ${d.fh}px)`;
  const face = { backfaceVisibility: "hidden" as const, WebkitBackfaceVisibility: "hidden" as const };

  return (
    <motion.div className="absolute" style={{ left: -d.fw / 2, top: -H, width: d.fw, height: H, z: -i * GAP, rotateX: angle, transformOrigin: "50% 100%", transformStyle: "preserve-3d" }}>
      {/* front: the folder with its sheet and print clipped on */}
      <div className="absolute inset-0" style={face}>
        <div aria-hidden="true" className="absolute inset-0" style={{ clipPath: shapeFront, background: MANILA, backgroundImage: `linear-gradient(180deg, rgba(255,246,215,0.75) 0, rgba(255,246,215,0.2) ${d.tabH + 6}px, rgba(255,240,200,0) 45%, rgba(110,70,10,0.2) 100%), linear-gradient(90deg, rgba(110,70,10,0.16), rgba(110,70,10,0) 5%, rgba(110,70,10,0) 95%, rgba(110,70,10,0.2)), ${FIBRE}` }}>
          <span className="absolute inset-x-0 block" style={{ top: d.tabH, height: 1.5, background: "rgba(255,250,230,0.9)" }} />
        </div>
        <div className="absolute" style={{ left: tl, top: 0, width: d.tabW, height: d.tabH }}>
          <Label i={i} d={d} active={active} focused={focused} />
        </div>
        <div className="absolute" style={{ left: d.m, right: d.m, top: d.tabH + (d.wide ? 13 : 9), bottom: d.wide ? 11 : 8, background: "#fbfaf5", backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0) 30%, rgba(90,70,30,0.07))", boxShadow: "0 1px 2.5px rgba(70,45,10,0.55), 0 0 0 0.5px rgba(70,45,10,0.25)" }}>
          <div id={`${uid}-p${i}`} role="tabpanel" aria-labelledby={`${uid}-t${i}`} aria-hidden={!active} className="absolute inset-0 text-[#221d17]" style={{ padding: d.wide ? "20px 26px 0 252px" : "14px 13px 0 13px" }}>
            <div className={d.wide ? "absolute" : "relative float-right"} style={d.wide ? { left: 22, top: 16, width: d.photoW, height: d.photoH, transform: "rotate(-1.6deg)" } : { width: d.photoW, height: d.photoH, margin: "2px 0 6px 10px", transform: "rotate(1.8deg)" }}>
              <img src={f.photo} alt={f.alt} width={420} height={560} loading="eager" className="block h-full w-full object-cover" style={{ background: f.tone, border: `${d.wide ? 7 : 4}px solid #fff`, boxShadow: "0 2px 5px rgba(40,25,5,0.5), 0 0 0 0.5px rgba(40,25,5,0.3)" }} />
              <span aria-hidden="true" className="pointer-events-none absolute block" style={{ inset: d.wide ? 7 : 4, background: "linear-gradient(118deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.28) 44%, rgba(255,255,255,0.05) 52%, rgba(255,255,255,0) 60%)" }} />
              <Clip className="absolute" style={{ left: d.wide ? 22 : 12, top: d.wide ? -17 : -12, width: d.wide ? 15 : 11, height: d.wide ? 42 : 30 }} />
            </div>
            <div className="flex items-center justify-between font-mono uppercase text-[#6a5d49]" style={{ fontSize: d.mono - 1.5, letterSpacing: "0.2em" }}>
              <span>Shoot file {f.ref}</span>
              {d.wide ? <span aria-hidden="true">{studio.name}</span> : null}
            </div>
            <h3 className="m-0 font-serif font-bold italic leading-none tracking-[-0.02em]" style={{ fontSize: d.title, marginTop: d.wide ? 16 : 12 }}>
              {f.tab}
            </h3>
            <span aria-hidden="true" className="block" style={{ width: d.wide ? 44 : 26, height: d.wide ? 5 : 4, margin: d.wide ? "14px 0 14px" : "9px 0", background: f.band }} />
            <dl className="m-0 font-mono" style={{ fontSize: d.mono, lineHeight: 1.55 }}>
              {[["Set", f.set], ["Light", f.light]].map(([k, v]) => (
                <div key={k} className="flex gap-2" style={{ borderBottom: "1px dotted rgba(70,55,30,0.45)", padding: "3px 0" }}>
                  <dt className="shrink-0 uppercase text-[#6a5d49]" style={{ width: d.wide ? 50 : 38, letterSpacing: "0.1em" }}>
                    {k}
                  </dt>
                  <dd className="m-0 min-w-0">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="m-0 font-serif" style={{ clear: d.wide ? "none" : "both", fontSize: d.text, lineHeight: `${d.lead}px`, marginTop: d.wide ? 14 : 10 }}>
              {f.notes}
            </p>
          </div>
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 block transition-opacity duration-500" style={{ clipPath: shapeFront, background: "linear-gradient(180deg, #2a1d08, #5a4320)", opacity: shaded ? 0.3 : 0 }} />
        <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 block" style={{ clipPath: shapeFront, background: "#1c1408", opacity: frontDim }} />
      </div>

      {/* back: what you see when it lies on the pile, with the label repeated so the tab still reads */}
      <div className="absolute inset-0" style={{ ...face, transform: "rotateX(180deg)" }}>
        <div aria-hidden="true" className="absolute inset-0" style={{ clipPath: shapeBack, background: "#ecd29b", backgroundImage: `linear-gradient(180deg, rgba(70,40,0,0.5) 0, rgba(70,40,0,0.12) 16%, rgba(255,246,215,0.1) 40%, rgba(255,248,222,0.6) 100%), ${FIBRE}` }}>
          <div className="absolute font-mono uppercase text-[#7b5b25]" style={{ left: d.wide ? 34 : 16, top: d.wide ? 96 : 120, width: d.wide ? 250 : 150, fontSize: d.wide ? 11 : 8.5, letterSpacing: "0.16em", opacity: 0.75 }}>
            <span className="block pb-1 font-bold">{studio.name}</span>
            {["Out", "By", "Back"].map((k) => (
              <span key={k} className="block" style={{ borderTop: "1px solid rgba(110,75,20,0.6)", padding: d.wide ? "7px 0" : "5px 0" }}>
                {k}
              </span>
            ))}
          </div>
          {[10, 17].map((y) => (
            <span key={y} className="absolute inset-x-0 block" style={{ top: y, height: 2, background: "linear-gradient(180deg, rgba(90,55,5,0.45), rgba(255,248,222,0.55))" }} />
          ))}
          <span className="absolute inset-x-0 block" style={{ top: d.fh - 3, height: 3, background: "rgba(255,250,232,0.7)" }} />
          <span className="absolute inset-x-0 block transition-opacity duration-500" style={{ top: d.fh + d.tabH - GAP - 16, height: 30, background: "linear-gradient(180deg, rgba(60,35,0,0) 0, rgba(60,35,0,0.55) 45%, rgba(60,35,0,0) 100%)", opacity: covered ? 1 : 0 }} />
          <span className="absolute grid place-items-center rounded-[3px] font-mono font-bold uppercase text-[#a0321f]" style={{ right: d.wide ? 44 : 16, top: d.wide ? 118 : 150, height: d.wide ? 44 : 30, padding: d.wide ? "0 14px" : "0 8px", fontSize: d.wide ? 13 : 9, letterSpacing: "0.16em", border: "2px solid #a0321f", opacity: 0.55, transform: "rotate(-7deg)" }}>
            File {f.ref}
          </span>
        </div>
        <div className="absolute" style={{ left: tl, bottom: 0, width: d.tabW, height: d.tabH }}>
          <Label i={i} d={d} active={active} focused={focused} />
        </div>
      </div>

      {/* the control sits on the tab itself and goes over with the folder */}
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
        style={{ left: tl, top: -6, width: d.tabW, height: d.tabH + 16 }}
      >
        <span className="sr-only">{f.tab}</span>
      </button>
    </motion.div>
  );
}

export default function ManilaFolderTabs() {
  const reduce = !!useReducedMotion();
  const uid = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [slim, setSlim] = useState(false);
  const [scale, setScale] = useState(1);
  const [sel, setSel] = useState({ now: 2, was: 2 });
  const [focus, setFocus] = useState(-1);
  const idle = useRef({ touched: false, paused: false });

  const d = slim ? SLIM : WIDE;
  const n = files.length;
  const rad = Math.PI / 180;
  const tall = d.fh + d.tabH;
  const W = d.fw + 64;
  const floorY = 58 + Math.round(tall * Math.cos((PITCH - LEAN) * rad) + (n - 1) * GAP * Math.sin(PITCH * rad));
  const H = floorY + Math.round(tall * Math.sin((PITCH + 3) * rad) * 1.2) + 26;
  const baseW = d.fw + 56;
  const baseD = (n - 1) * GAP + 74;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const w = wrap.clientWidth;
      const narrow = w < 780;
      setSlim(narrow);
      setScale(Math.min(narrow ? 1.5 : 1, (w - 6) / ((narrow ? SLIM : WIDE).fw + 56)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // until someone touches it, a hand flips through the rack
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
    const to = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i + n - 1) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    pick(to, true);
  };
  const steel = { background: "#aab1b7", backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0) 40%, rgba(0,0,0,0.25)), ${BRUSHED}` };

  return (
    <section className="relative overflow-hidden bg-[#1a2230]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(64% 58% at 50% 46%, #3b4a63 0%, #232d40 46%, #121824 100%)" }} />
      <div ref={wrapRef} onPointerEnter={() => (idle.current.paused = true)} onPointerLeave={() => (idle.current.paused = false)} className="relative mx-auto w-full max-w-[1100px]" style={{ height: Math.round(H * scale) + (slim ? 96 : 70) }}>
        <h2 className="sr-only">
          {studio.name}: {studio.drawer}
        </h2>
        <div role="tablist" aria-label={studio.drawer} aria-owns={files.map((_, i) => `${uid}-t${i}`).join(" ")} />
        <div className="absolute left-1/2 top-0" style={{ width: W, height: H, transformOrigin: "50% 0", transform: `translateX(-50%) scale(${scale})`, perspective: 2600, perspectiveOrigin: `50% ${floorY - tall * 0.45}px` }}>
          <div className="absolute" style={{ left: W / 2, top: floorY, width: 0, height: 0, transformStyle: "preserve-3d", transform: `rotateX(${-PITCH}deg)` }}>
            {/* shadow on the desk, under the rack and under the pile */}
            <div aria-hidden="true" className="absolute rounded-[40px]" style={{ left: -baseW / 2 - 30, top: -baseD - 60, width: baseW + 60, height: baseD + 110, transformOrigin: "50% 100%", transform: "translateY(9px) translateZ(60px) rotateX(90deg)", background: "rgba(4,7,12,0.7)", filter: "blur(22px)" }} />
            <div aria-hidden="true" className="absolute rounded-[30px] transition-opacity duration-700" style={{ left: -d.fw / 2 - 6, top: -tall, width: d.fw + 12, height: tall, transformOrigin: "50% 100%", transform: `translateY(9px) translateZ(${tall + 6}px) rotateX(90deg)`, background: "rgba(4,7,12,0.75)", filter: "blur(16px)", opacity: sel.now > 0 ? 1 : 0 }} />
            {/* the rack: a brushed steel base and an angled rest behind */}
            <div aria-hidden="true" className="absolute rounded-[5px]" style={{ left: -baseW / 2, top: -baseD, width: baseW, height: baseD, transformOrigin: "50% 100%", transform: "translateY(3px) translateZ(30px) rotateX(90deg)", ...steel, boxShadow: "inset 0 0 0 1px rgba(20,24,28,0.6), inset 0 -3px 0 rgba(255,255,255,0.5)" }} />
            <div aria-hidden="true" className="absolute rounded-b-[4px]" style={{ left: -baseW / 2, top: 3, width: baseW, height: 7, transform: "translateZ(30px)", background: "linear-gradient(180deg, #eef1f3, #7d858c 40%, #3c4248)" }} />
            <div aria-hidden="true" className="absolute rounded-t-[6px]" style={{ left: -baseW / 2, top: -tall * 0.82, width: baseW, height: tall * 0.82, transformOrigin: "50% 100%", transform: `translateZ(${-(n - 1) * GAP - 18}px) rotateX(${LEAN}deg)`, ...steel, boxShadow: "inset 0 0 0 1px rgba(20,24,28,0.6), inset 0 2px 0 rgba(255,255,255,0.7)" }} />

            {files.map((_, i) => {
              const tipped = i < sel.now;
              const wait = sel.now > sel.was ? Math.max(0, i - sel.was) * 0.11 : Math.max(0, sel.was - 1 - i) * 0.11;
              return (
                <Folder key={i} i={i} d={d} tipped={tipped} wait={wait} reduce={reduce} active={sel.now === i} shaded={i > sel.now} covered={i + 1 < sel.now} focused={focus === i} uid={uid} onPick={() => pick(i)} onKey={onKey(i)} setRef={(el) => (tabs.current[i] = el)} onFocus={({ on, el }) => { idle.current.paused = on; setFocus((v) => (on ? (el.matches(":focus-visible") ? i : v) : v === i ? -1 : v)); }} />
              );
            })}
          </div>
        </div>
        <p className="absolute bottom-5 left-5 m-0 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#93a0b5] sm:bottom-7 sm:left-8">
          <span className="text-[#eef2f8]">
            {studio.name}: {studio.drawer}
          </span>
          <span className="block">{studio.hint}</span>
        </p>
      </div>
    </section>
  );
}
