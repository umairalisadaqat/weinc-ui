import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

/** One wall chart per tab, front roller first. `tab` is the word in the brass holder on its bottom slat. */
const school = { name: "Saltmarsh Sailing School", hint: "Pull a brass tab to change the chart" };
const charts = [
  { tab: "Clouds", title: "Reading the sky", paper: "#dfe8ea", text: "#1f2a33", ink: "#1d3f66", tone: "#3f7fc4", photo: "https://images.pexels.com/photos/8726326/pexels-photo-8726326.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Tall white cumulus clouds piling up against a deep blue sky", fig: "Cumulus building before noon", body: "Flat-bottomed heaps that stay small mean a settled afternoon. When they grow taller than they are wide before lunch, expect gusts underneath them and reef early.", notes: ["Small and scattered: fair", "Towering by noon: squalls", "Anvil on top: stay ashore"] },
  { tab: "Tides", title: "Working the tide", paper: "#efe5cf", text: "#2a251d", ink: "#0f5257", tone: "#1c7f8a", photo: "https://images.pexels.com/photos/9940655/pexels-photo-9940655.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Turquoise sea breaking white over dark rocks, seen from directly above", fig: "The ebb over Gull Ledge", body: "The harbour dries for two hours either side of low water. Leave on the flood so that a grounding lifts you off again, and keep clear of the bar when the ebb runs against an onshore wind.", notes: ["Flood: the water is rising", "Ebb: the water is falling", "Slack: the pause between"] },
  { tab: "Knots", title: "Three good knots", paper: "#e9d3ae", text: "#2a2118", ink: "#7a2f22", tone: "#8f9aa3", photo: "https://images.pexels.com/photos/2347466/pexels-photo-2347466.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Thick grey mooring rope knotted round a steel rail", fig: "A stern line made fast", body: "Learn three before you learn thirty. A bowline for a loop that will not slip, a clove hitch for a fender, and a round turn with two half hitches for anything you want to find again in the morning.", notes: ["Bowline: a fixed loop", "Clove hitch: quick to adjust", "Round turn: takes the strain"] },
  { tab: "Lights", title: "Lights after dark", paper: "#1c2b3d", text: "#e9e1cc", ink: "#f0c46a", tone: "#e9e2d6", photo: "https://images.pexels.com/photos/12323409/pexels-photo-12323409.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "A pale lighthouse tower above a sand dune in hazy evening light", fig: "The dune light at dusk", body: "Every light has a rhythm of its own, printed on the chart beside it. Count the flashes against your watch for a full minute before you trust the name you have given it.", notes: ["Fl: one flash at a time", "Oc: lit, with short darks", "Iso: light and dark equal"] },
];

// Two sets of measurements in pixels: one for desks, one for phones.
const WIDE = { w: 720, L: 486, pad: 34, holder: 112, title: 42, text: 15.5, lead: 24, photoH: 262, two: true };
const SLIM = { w: 300, L: 580, pad: 16, holder: 60, title: 26, text: 12.5, lead: 19, photoH: 150, two: false };
type Dims = typeof WIDE;
const STEP = 44; // each roller hangs this much lower than the one in front of it
const ROLL = 24; // roller diameter
const SLAT = 26; // the black bar along the bottom of each chart
const EXT = 22; // how far a roller runs past the paper at each end
const TOP = 44;

const svgUrl = (body: string, w: number, h: number) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`)}")`;
const PAPER = svgUrl(`<filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.36  0 0 0 0 0.26  0 0 0 0 0.1  0 0 0 0.6 -0.17'/></filter><rect width='240' height='240' filter='url(#p)'/>`, 240, 240);
const PLASTER = svgUrl(`<filter id='w'><feTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' seed='11'/><feColorMatrix values='0 0 0 0 0.12  0 0 0 0 0.16  0 0 0 0 0.12  0 0 0 0.34 -0.12'/></filter><rect width='300' height='300' filter='url(#w)'/>`, 300, 300);
const WOOD = svgUrl(`<filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.006 0.5' numOctaves='3' seed='8'/><feColorMatrix values='0 0 0 0 0.25  0 0 0 0 0.12  0 0 0 0 0.03  1.6 0 0 0 -0.62'/></filter><rect width='700' height='40' filter='url(#g)'/>`, 700, 40);
const BRASS = "linear-gradient(180deg, #fff3c4 0%, #e2bf68 20%, #b98d33 55%, #8a6519 80%, #d9b660 100%)";

function Chart({ i, d, up, wait, reduce, active, uid, onPick, onKey, onFocus, setRef }: { i: number; d: Dims; up: boolean; wait: number; reduce: boolean; active: boolean; uid: string; onPick: () => void; onKey: (e: KeyboardEvent) => void; onFocus: (on: boolean) => void; setRef: (el: HTMLButtonElement | null) => void }) {
  const c = charts[i];
  const upY = ROLL + 4 - ROLL / 2 - (d.L - SLAT); // rolled: only the slat is left showing under the roller
  const y = useMotionValue(up ? upY : 0);
  const rattle = useMotionValue(0);
  const fat = useTransform(y, [upY, 0], [1.42, 1]);
  const swing = useTransform(rattle, (v) => v * 5);
  const was = useRef(up);

  useEffect(() => {
    if (was.current === up || reduce) {
      was.current = up;
      y.set(up ? upY : 0);
      return;
    }
    was.current = up;
    let live = true;
    let tail: { stop: () => void } | null = null;
    // going up the spring takes it, faster and faster, and the slat rattles against the roller; coming down a hand pulls it
    const run = up ? animate(y, upY, { duration: 0.44, delay: wait, ease: [0.6, 0, 0.9, 0.5] }) : animate(y, 0, { type: "spring", stiffness: 150, damping: 15, mass: 0.9, delay: wait });
    run.then(() => {
      if (live) tail = animate(rattle, up ? [0, -1.6, 1.2, -0.7, 0.3, 0] : [0, 0.5, -0.3, 0], { duration: up ? 0.7 : 0.5, ease: "easeOut" });
    });
    return () => {
      live = false;
      run.stop();
      tail?.stop();
    };
  }, [up, reduce, upY, wait, y, rattle]);

  const left = EXT + 14;
  const holderLeft = d.pad - 6 + (i * (d.w - 2 * d.pad + 12 - d.holder)) / (charts.length - 1);
  return (
    <div className="absolute" style={{ left: 0, top: TOP + i * STEP, width: d.w + 2 * left, height: d.L + 80 }}>
      {/* the paper is cut off at the middle of its roller, which is where it winds on */}
      <div className="absolute inset-0" style={{ clipPath: `inset(${ROLL / 2}px -40px -90px -40px)` }}>
        <motion.div className="absolute" style={{ left, top: ROLL / 2, width: d.w, height: d.L, y, rotate: rattle, transformOrigin: "50% 100%" }}>
          <div className="absolute inset-0" style={{ background: c.paper, backgroundImage: `linear-gradient(180deg, rgba(40,26,8,0.42) 0, rgba(40,26,8,0.12) 22px, rgba(40,26,8,0) 60px), linear-gradient(90deg, rgba(60,40,10,0.16), rgba(60,40,10,0) 7%, rgba(255,255,255,0.14) 40%, rgba(60,40,10,0) 90%, rgba(60,40,10,0.2)), repeating-linear-gradient(180deg, rgba(90,60,20,0) 0 71px, rgba(60,40,10,0.09) 71px 72px, rgba(255,255,255,0.1) 72px 73px), ${PAPER}`, boxShadow: "0 10px 22px rgba(22,28,20,0.38), 0 2px 4px rgba(22,28,20,0.3)" }} />
          {/* cloth tape down both edges */}
          {[0, 1].map((s) => (
            <span key={s} aria-hidden="true" className="absolute inset-y-0 block w-[5px]" style={{ [s ? "right" : "left"]: 0, background: "linear-gradient(90deg, #14110f, #37322d 45%, #1b1816)", boxShadow: s ? "-1px 0 0 rgba(0,0,0,0.25)" : "1px 0 0 rgba(0,0,0,0.25)" }} />
          ))}

          <div id={`${uid}-p${i}`} role="tabpanel" aria-labelledby={`${uid}-t${i}`} aria-hidden={!active} className="absolute inset-x-0 top-0 font-serif" style={{ padding: `26px ${d.pad}px 0`, color: c.text }}>
            <div className="flex items-baseline justify-between gap-3 font-mono uppercase tracking-[0.2em]" style={{ fontSize: d.two ? 10 : 8.5, color: c.ink }}>
              <span>Plate {["I", "II", "III", "IV", "V", "VI"][i]}</span>
              <span aria-hidden="true">{school.name}</span>
            </div>
            <h3 className="m-0 font-serif font-bold leading-none tracking-[-0.01em]" style={{ fontSize: d.title, color: c.ink, marginTop: d.two ? 10 : 8 }}>
              {c.title}
            </h3>
            <div aria-hidden="true" className="mt-3 h-[5px]" style={{ borderTop: `2px solid ${c.ink}`, borderBottom: `1px solid ${c.ink}` }} />
            <div className={d.two ? "mt-4 grid grid-cols-[1.02fr_1fr] gap-6" : "mt-3"}>
              <figure className="m-0">
                <div className="p-[4px]" style={{ border: `1px solid ${c.ink}` }}>
                  <img src={c.photo} alt={c.alt} width={600} height={400} loading="eager" className="block w-full object-cover" style={{ height: d.photoH, background: c.tone }} />
                </div>
                <figcaption className="mt-[6px] italic" style={{ fontSize: d.two ? 12 : 11, color: c.ink }}>
                  Fig. {i + 1}. {c.fig}
                </figcaption>
              </figure>
              <div style={{ marginTop: d.two ? -3 : 10 }}>
                <p className="m-0" style={{ fontSize: d.text, lineHeight: `${d.lead}px` }}>
                  {c.body}
                </p>
                <ol className="m-0 mt-3 list-none p-0 font-mono" style={{ fontSize: d.two ? 11.5 : 10.5 }}>
                  {c.notes.map((n, k) => (
                    <li key={n} className="flex items-center gap-2 py-[5px]" style={{ borderTop: `1px solid ${c.ink}55` }}>
                      <span aria-hidden="true" className="grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full text-[9px] font-bold" style={{ background: c.ink, color: c.paper }}>
                        {k + 1}
                      </span>
                      {n}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
          <p aria-hidden="true" className="absolute inset-x-0 m-0 text-center font-mono uppercase tracking-[0.24em]" style={{ bottom: SLAT + 5, fontSize: 7, color: c.text, opacity: 0.6 }}>
            Chart {i + 1} of {charts.length} · Hang out of direct sun
          </p>

          {/* the bottom slat, with the tab on it */}
          <div className="absolute rounded-[3px]" style={{ left: -5, right: -5, bottom: 0, height: SLAT, background: "#1b1816", backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.32) 0, rgba(255,255,255,0.06) 4px, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%), ${WOOD}`, backgroundSize: "auto, 100% 100%", boxShadow: "0 5px 8px rgba(15,20,14,0.45), inset 0 0 0 0.5px rgba(0,0,0,0.9)" }}>
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
              onFocus={() => onFocus(true)}
              onBlur={() => onFocus(false)}
              className="group absolute top-[-2px] block cursor-pointer rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-[#12365c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ead6]"
              style={{ left: holderLeft + 5, width: d.holder, height: SLAT + 22 }}
            >
              <span aria-hidden="true" className="absolute inset-x-0 top-[5px] block rounded-[2.5px] p-[3px]" style={{ height: 20, background: BRASS, boxShadow: "0 2px 3px rgba(0,0,0,0.7), inset 0 0 0 0.5px rgba(70,44,0,0.9), inset 0 1px 0 rgba(255,250,220,0.7)" }}>
                <span className="grid h-full place-items-center rounded-[1px] font-mono font-bold uppercase leading-none transition-colors" style={{ fontSize: d.two ? 9.5 : 8, letterSpacing: d.two ? "0.2em" : "0.1em", background: active ? "#fbf4e1" : "#e6dbc2", color: active ? "#a3271b" : "#2a251d", boxShadow: "inset 0 1.5px 2.5px rgba(50,28,0,0.6)" }}>
                  {c.tab}
                </span>
              </span>
              <motion.span aria-hidden="true" className="absolute left-1/2 block" style={{ top: SLAT - 3, width: 16, height: 22, marginLeft: -8, rotate: swing, transformOrigin: "50% 2px" }}>
                <span className="absolute left-1/2 top-0 block h-[7px] w-[3px] -translate-x-1/2 rounded-b-[2px]" style={{ background: "linear-gradient(90deg, #7a5814, #f3d98a, #8a6519)" }} />
                <span className="absolute inset-x-0 bottom-0 block h-[16px] rounded-full transition-transform duration-200 group-hover:translate-y-[2px]" style={{ border: "3px solid #c9a24a", borderTopColor: "#f6e3a1", borderBottomColor: "#8a6519", boxShadow: "0 2px 3px rgba(0,0,0,0.5), inset 0 1px 1px rgba(0,0,0,0.35)" }} />
              </motion.span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* the roller: varnished wood, fatter while the chart is wound on it, brass at both ends */}
      <div aria-hidden="true" className="absolute" style={{ left: 14, right: 14, top: 0, height: ROLL }}>
        <motion.div className="absolute inset-0 rounded-[3px]" style={{ scaleY: fat, background: "#a8642b", backgroundImage: `linear-gradient(180deg, rgba(40,16,0,0.5) 0%, rgba(255,226,170,0.75) 20%, rgba(255,210,150,0.15) 40%, rgba(40,16,0,0.25) 70%, rgba(20,8,0,0.75) 100%), ${WOOD}`, backgroundSize: "auto, 100% 100%", boxShadow: "0 7px 9px rgba(15,20,14,0.5), inset 0 0 0 0.5px rgba(40,16,0,0.8)" }} />
        {[0, 1].map((s) => (
          <span key={s} className="absolute block rounded-[2px]" style={{ [s ? "right" : "left"]: -7, top: 4, width: 13, height: ROLL - 8, background: BRASS, boxShadow: "0 2px 3px rgba(0,0,0,0.5), inset 0 0 0 0.5px rgba(70,44,0,0.9)" }} />
        ))}
      </div>
    </div>
  );
}

export default function PullDownWallChartTabs() {
  const reduce = !!useReducedMotion();
  const uid = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [slim, setSlim] = useState(false);
  const [scale, setScale] = useState(1);
  const [sel, setSel] = useState({ now: 1, was: 1 });
  const idle = useRef({ touched: false, paused: false });

  const d = slim ? SLIM : WIDE;
  const n = charts.length;
  const W = d.w + 2 * (EXT + 14);
  const H = TOP + (n - 1) * STEP + ROLL / 2 + d.L + 34;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const w = wrap.clientWidth;
      const narrow = w < 760;
      setSlim(narrow);
      setScale(Math.min(1, (w - 8) / ((narrow ? SLIM : WIDE).w + 2 * (EXT + 14))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // until someone touches it, the charts go up one at a time and then all come back down
  useEffect(() => {
    if (reduce) return;
    const s = idle.current;
    const t = window.setInterval(() => {
      if (s.touched || s.paused || document.hidden) return;
      setSel((v) => ({ now: (v.now + 1) % n, was: v.now }));
    }, 3300);
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

  return (
    <section className="relative overflow-hidden bg-[#9fae9c]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: `radial-gradient(80% 70% at 42% 30%, rgba(238,244,232,0.6) 0%, rgba(200,212,196,0.12) 48%, rgba(60,78,62,0.42) 100%), ${PLASTER}` }} />
      <div ref={wrapRef} onPointerEnter={() => (idle.current.paused = true)} onPointerLeave={() => (idle.current.paused = false)} className="relative mx-auto w-full max-w-[1100px]" style={{ height: Math.round(H * scale) + (slim ? 104 : 84) }}>
        <h2 className="sr-only">{school.name}: wall charts</h2>
        <div role="tablist" aria-label="Wall charts" aria-owns={charts.map((_, i) => `${uid}-t${i}`).join(" ")} />
        <div className="absolute left-1/2 top-0" style={{ width: W, height: H, transformOrigin: "50% 0", transform: `translateX(-50%) scale(${scale})` }}>
          {/* what the whole rack throws on the wall */}
          <div aria-hidden="true" className="absolute" style={{ left: 30, top: TOP + 26, width: d.w + 30, height: d.L + (n - 1) * STEP, background: "rgba(30,44,32,0.42)", filter: "blur(26px)" }} />
          {/* two flat steel hangers screwed to the wall */}
          {[0, 1].map((s) => (
            <div key={s} aria-hidden="true" className="absolute rounded-[4px]" style={{ [s ? "right" : "left"]: 2, top: TOP - 26, width: 22, height: (n - 1) * STEP + ROLL + 46, background: "linear-gradient(90deg, #15181a 0%, #3b4144 30%, #565d61 46%, #23272a 72%, #0c0e0f 100%)", boxShadow: "3px 6px 10px rgba(20,30,22,0.5), inset 0 1px 0 rgba(255,255,255,0.25)" }}>
              {[9, (n - 1) * STEP + ROLL + 29].map((t) => (
                <span key={t} className="absolute left-1/2 block h-[9px] w-[9px] -translate-x-1/2 rounded-full" style={{ top: t, background: "radial-gradient(circle at 35% 30%, #e8ecee, #6d7477 55%, #24282a)", boxShadow: "0 1px 1px rgba(0,0,0,0.8), inset 0 0 0 0.5px #0c0e0f" }}>
                  <span className="absolute left-[1.5px] top-[4px] block h-[1px] w-[6px] rotate-[30deg] bg-[#16191b]" />
                </span>
              ))}
            </div>
          ))}
          {/* drawn back to front, so the nearest chart covers the ones behind it */}
          {charts
            .map((_, i) => i)
            .reverse()
            .map((i) => {
              const up = i < sel.now;
              const wait = sel.now > sel.was ? Math.max(0, i - sel.was) * 0.13 : Math.max(0, sel.was - 1 - i) * 0.13;
              return <Chart key={i} i={i} d={d} up={up} wait={wait} reduce={reduce} active={sel.now === i} uid={uid} onPick={() => pick(i)} onKey={onKey(i)} onFocus={(on) => (idle.current.paused = on)} setRef={(el) => (tabs.current[i] = el)} />;
            })}
        </div>
        <p className="absolute bottom-5 left-5 m-0 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#33402f] sm:bottom-7 sm:left-8">
          <span className="text-[#141c13]">{school.name}</span>
          <span className="block">{school.hint}</span>
        </p>
      </div>
      {/* afternoon light through a window somewhere to the left: two soft bars across wall and charts alike */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ mixBlendMode: "soft-light" }}>
        {[0, 1].map((k) => (
          <span key={k} className="absolute block" style={{ left: `${k ? 46 : 8}%`, top: "-30%", width: k ? "30%" : "26%", height: "170%", transform: "rotate(24deg)", background: "linear-gradient(90deg, rgba(255,246,214,0), rgba(255,246,214,0.85) 18%, rgba(255,246,214,0.85) 82%, rgba(255,246,214,0))", filter: "blur(26px)", opacity: 0.42 }} />
        ))}
      </div>
    </section>
  );
}
