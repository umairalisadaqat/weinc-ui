import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** First page on the pad (year, month 0-11, day). Every tear moves one day on. */
const START = { year: 2026, month: 9, day: 12 };
/** One short line printed at the foot of each page, used in order and repeated. */
const notes = [
  "Water the fig before nine.",
  "Post the parcel to Ines.",
  "Bread is ready at four.",
  "Call the framer about the print.",
  "Market closes early today.",
  "Leave the window open tonight.",
  "Return the library books.",
];

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const PAGE_W = 248;
const PAGE_H = 296;
const STRIPS = 18;
const STRIP_H = PAGE_H / STRIPS;
const BAND = 10;
const PEEL_DEG = 168;
const DAY_MS = 86400000;

function pageFor(index: number) {
  const first = Date.UTC(START.year, START.month, START.day);
  const date = new Date(first + index * DAY_MS);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.round((date.getTime() - yearStart) / DAY_MS) + 1;
  const yearEnd = Date.UTC(date.getUTCFullYear() + 1, 0, 1);
  const total = Math.round((yearEnd - yearStart) / DAY_MS);
  return {
    weekday: WEEKDAYS[date.getUTCDay()],
    month: MONTHS[date.getUTCMonth()],
    day: date.getUTCDate(),
    year: date.getUTCFullYear(),
    dayOfYear,
    left: total - dayOfYear,
    weekend: date.getUTCDay() === 0 || date.getUTCDay() === 6,
    note: notes[((index % notes.length) + notes.length) % notes.length],
  };
}

function PageFace({ index }: { index: number }) {
  const page = pageFor(index);
  return (
    <div
      className="flex flex-col items-center px-5 pb-4 pt-5 text-stone-900"
      style={{ width: PAGE_W, height: PAGE_H, background: "linear-gradient(180deg,#fbf9f4 0%,#f6f2ea 100%)" }}
    >
      <div className="flex w-full items-baseline justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
        <span>{page.month}</span>
        <span>{page.year}</span>
      </div>
      <div
        className={`mt-1 font-black leading-none tracking-[-0.06em] ${page.weekend ? "text-[#c8371f]" : "text-stone-900"}`}
        style={{ fontSize: 168, fontVariantNumeric: "tabular-nums" }}
      >
        {page.day}
      </div>
      <div className="mt-1 text-[13px] font-bold uppercase tracking-[0.34em] text-[#c8371f]">{page.weekday}</div>
      <div className="mt-auto w-full border-t border-stone-300 pt-2">
        <div className="flex items-center justify-between text-[10px] font-medium tracking-wide text-stone-500">
          <span>Day {page.dayOfYear}</span>
          <span>{page.left} left</span>
        </div>
        <p className="mt-1 text-center font-serif text-[12px] italic text-stone-600">{page.note}</p>
      </div>
    </div>
  );
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function TearOffDeskCalendar() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [touched, setTouched] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const stripRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frontShade = useRef<(HTMLDivElement | null)[]>([]);
  const backShade = useRef<(HTMLDivElement | null)[]>([]);
  const castRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const sim = useRef({
    mode: "rest" as "rest" | "drag" | "peel" | "back" | "fly",
    p: 0,
    from: 0,
    t0: 0,
    raf: 0,
    side: 1,
    angles: new Array(STRIPS).fill(0) as number[],
    held: new Array(STRIPS).fill(0) as number[],
    dragY: 0,
    moved: false,
    visible: true,
  });

  /** Bend the sheet: `angles[i]` is how far strip i folds relative to the strip above it. */
  const paint = useCallback((angles: number[], cast: number, castAt: number) => {
    let sum = 0;
    let frontWas = 0;
    let backWas = 0.54;
    for (let i = 0; i < STRIPS; i++) {
      sum += angles[i];
      const strip = stripRefs.current[i];
      if (strip) strip.style.transform = `rotateX(${angles[i].toFixed(2)}deg)`;
      const rad = (sum * Math.PI) / 180;
      // Each strip fades from the shade of the strip above to its own, so the bend reads as one curve.
      const frontNow = clamp(0.5 * (1 - Math.cos(rad)), 0, 0.62);
      const backNow = clamp(0.04 + 0.5 * Math.pow((1 + Math.cos(rad)) / 2, 0.8) + 0.07 * Math.sin(rad * 2), 0, 0.6);
      const front = frontShade.current[i];
      if (front) front.style.background = `linear-gradient(180deg,rgba(42,28,16,${frontWas.toFixed(3)}),rgba(42,28,16,${frontNow.toFixed(3)}))`;
      const back = backShade.current[i];
      if (back) back.style.background = `linear-gradient(0deg,rgba(42,28,16,${backWas.toFixed(3)}),rgba(42,28,16,${backNow.toFixed(3)}))`;
      frontWas = frontNow;
      backWas = backNow;
    }
    const shadow = castRef.current;
    if (shadow) {
      shadow.style.opacity = cast.toFixed(3);
      shadow.style.transform = `translateY(${(castAt * STRIP_H).toFixed(1)}px)`;
    }
  }, []);

  /** Angles for a sheet lifted from the bottom edge, p = 0 flat to 1 held up by its top edge. */
  const peelPose = useCallback((p: number, out: number[]) => {
    const front = STRIPS - p * (STRIPS - 0.4);
    const norm = (BAND * 2) / Math.PI;
    for (let i = 0; i < STRIPS; i++) {
      const x = (i + 0.5 - front) / BAND;
      out[i] = x > 0 && x < 1 ? (PEEL_DEG * Math.sin(Math.PI * x)) / norm : 0;
    }
    return front;
  }, []);

  const rest = useCallback(() => {
    const s = sim.current;
    s.mode = "rest";
    s.p = 0;
    s.angles.fill(0);
    paint(s.angles, 0, STRIPS);
    const sheet = sheetRef.current;
    if (sheet) {
      sheet.style.transform = "translate3d(0,0,0)";
      sheet.style.opacity = "1";
    }
    if (dropRef.current) dropRef.current.style.opacity = "0";
  }, [paint]);

  const frame = useCallback(
    (now: number) => {
      const s = sim.current;
      s.raf = 0;
      if (s.mode === "peel" || s.mode === "back") {
        const length = s.mode === "peel" ? 520 * (1 - s.from) + 120 : 380;
        const k = clamp((now - s.t0) / length, 0, 1);
        const target = s.mode === "peel" ? 1 : 0;
        s.p = s.from + (target - s.from) * (s.mode === "peel" ? k * k * (3 - 2 * k) : ease(k));
        const front = peelPose(s.p, s.angles);
        paint(s.angles, Math.min(1, s.p * 3) * 0.8, front);
        if (k >= 1) {
          if (s.mode === "peel") {
            s.mode = "fly";
            s.t0 = now;
            for (let i = 0; i < STRIPS; i++) s.held[i] = s.angles[i];
          } else {
            rest();
            return;
          }
        }
      } else if (s.mode === "fly") {
        const t = (now - s.t0) / 1000;
        const blend = ease(clamp(t / 0.32, 0, 1));
        const flutter = 46 + 30 * Math.sin(t * 9.5);
        for (let i = 0; i < STRIPS; i++) {
          const loose = (flutter / STRIPS) * (0.6 + 0.8 * Math.sin((i / STRIPS) * Math.PI));
          s.angles[i] = s.held[i] + (loose - s.held[i]) * blend;
        }
        paint(s.angles, 0.55 * (1 - clamp(t / 0.18, 0, 1)), 0.4);
        const sheet = sheetRef.current;
        if (sheet) {
          const x = s.side * (150 * t + 26 * Math.sin(t * 6));
          const y = -210 * t + 1050 * t * t;
          const spin = s.side * (10 + 62 * t);
          const tip = -34 * Math.sin(t * 5.2);
          sheet.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${(70 * Math.min(1, t * 3)).toFixed(1)}px) rotateZ(${spin.toFixed(1)}deg) rotateX(${tip.toFixed(1)}deg)`;
          sheet.style.opacity = clamp((1.02 - t) / 0.16, 0, 1).toFixed(3);
          const drop = dropRef.current;
          if (drop) {
            drop.style.transform = `translate(${(x * 0.8).toFixed(1)}px,${(y * 0.8 + 34).toFixed(1)}px) rotate(${spin.toFixed(1)}deg)`;
            drop.style.opacity = (0.5 * clamp(t / 0.15, 0, 1) * clamp(1 - t / 0.75, 0, 1)).toFixed(3);
          }
        }
        if (t >= 1.02) {
          s.side = -s.side;
          s.mode = "rest";
          if (sheet) sheet.style.opacity = "0";
          setIndex((v) => v + 1);
          return;
        }
      }
      if (s.mode !== "rest" && s.mode !== "drag") s.raf = requestAnimationFrame(frame);
    },
    [paint, peelPose, rest],
  );

  const run = useCallback(
    (mode: "peel" | "back") => {
      const s = sim.current;
      s.mode = mode;
      s.from = s.p;
      s.t0 = performance.now();
      if (!s.raf) s.raf = requestAnimationFrame(frame);
    },
    [frame],
  );

  const tear = useCallback(() => {
    const s = sim.current;
    if (s.mode === "fly" || s.mode === "peel") return;
    if (reduce) {
      setIndex((v) => v + 1);
      return;
    }
    run("peel");
  }, [reduce, run]);

  // Tears a page by itself until someone takes over, and only while it is on screen.
  useEffect(() => {
    if (reduce || touched) return;
    const s = sim.current;
    const node = rootRef.current;
    const watcher =
      node && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            s.visible = entry.isIntersecting;
          })
        : null;
    if (node && watcher) watcher.observe(node);
    const first = window.setTimeout(() => s.visible && !document.hidden && tear(), 800);
    const loop = window.setInterval(() => s.visible && !document.hidden && tear(), 2500);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
      watcher?.disconnect();
    };
  }, [reduce, touched, tear]);

  // The new top page is laid flat only once React has printed the next date on it.
  useEffect(() => {
    rest();
  }, [index, rest]);

  useEffect(() => {
    const s = sim.current;
    return () => {
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, []);

  const onDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    setTouched(true);
    if (reduce || s.mode === "fly" || s.mode === "peel") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    s.mode = "drag";
    s.dragY = event.clientY + s.p * 230;
    s.moved = false;
  };
  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (s.mode !== "drag") return;
    const p = clamp((s.dragY - event.clientY) / 230, 0, 0.94);
    if (Math.abs(p - s.p) > 0.01) s.moved = true;
    s.p = p;
    const front = peelPose(p, s.angles);
    paint(s.angles, Math.min(1, p * 3) * 0.8, front);
  };
  const onUp = () => {
    const s = sim.current;
    if (s.mode !== "drag") return;
    if (!s.moved) {
      s.mode = "rest";
      return;
    }
    run(s.p > 0.42 ? "peel" : "back");
  };
  const onClick = () => {
    const s = sim.current;
    setTouched(true);
    if (s.moved) {
      s.moved = false;
      return;
    }
    tear();
  };

  const today = pageFor(index);

  // Nested strips: each one hangs from the strip above, so small folds add up to a curl.
  const buildStrip = (i: number): React.ReactNode => (
    <div
      ref={(node) => {
        stripRefs.current[i] = node;
      }}
      className="absolute left-0"
      style={{ top: i === 0 ? 0 : STRIP_H, width: PAGE_W, height: STRIP_H, transformOrigin: "50% 0", transformStyle: "preserve-3d" }}
    >
      <div className="absolute left-0 top-0 overflow-hidden" style={{ width: PAGE_W, height: STRIP_H + 1.2, backfaceVisibility: "hidden" }}>
        <div style={{ transform: `translateY(${-i * STRIP_H}px)` }}>
          <PageFace index={index} />
        </div>
        <div
          ref={(node) => {
            frontShade.current[i] = node;
          }}
          className="absolute inset-0"
        />
      </div>
      <div
        className="absolute left-0 overflow-hidden"
        style={{ top: -0.6, width: PAGE_W, height: STRIP_H + 1.8, backfaceVisibility: "hidden", transform: "rotateX(180deg)", transformOrigin: `50% ${STRIP_H / 2 + 0.6}px`, background: "#f3eee5" }}
      >
        <div
          ref={(node) => {
            backShade.current[i] = node;
          }}
          className="absolute inset-0"
        />
      </div>
      {i < STRIPS - 1 ? buildStrip(i + 1) : null}
    </div>
  );

  const edge: string[] = [];
  for (let i = 1; i <= 13; i++) edge.push(`${(i * 0.35).toFixed(2)}px ${i}px 0 ${i % 2 ? "#cfc8ba" : "#f3efe6"}`);
  edge.push("6px 26px 30px -8px rgba(40,26,12,0.5)");

  return (
    <section
      ref={rootRef}
      className="relative flex w-full select-none flex-col items-center justify-center overflow-hidden px-4 py-14"
      style={{ minHeight: 660, background: "radial-gradient(120% 90% at 50% 28%,#f1ece3 0%,#e4ddd1 58%,#d3cabb 100%)" }}
    >
      <div className="relative z-10" style={{ width: 288, perspective: 950, perspectiveOrigin: "50% 40%" }}>
        {/* nail and backing card */}
        <div className="absolute left-1/2 top-[-9px] z-10 h-[14px] w-[14px] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%,#fff7d6,#c9a24a 45%,#6d5320)", boxShadow: "0 3px 4px rgba(0,0,0,.4)" }} aria-hidden="true" />
        <div
          className="relative rounded-[10px] px-5 pb-6 pt-8"
          style={{
            background: "linear-gradient(160deg,#2e3a33 0%,#1f2924 60%,#19211d 100%)",
            boxShadow: "0 1px 0 rgba(255,255,255,.12) inset, 0 -2px 0 rgba(0,0,0,.35) inset, 0 34px 50px -18px rgba(54,38,20,.55), 0 10px 16px -8px rgba(54,38,20,.4)",
            transformStyle: "preserve-3d",
            transform: "rotateX(7deg) rotateY(-19deg)",
          }}
        >
          <div className="absolute left-1/2 top-[7px] h-[9px] w-[9px] -translate-x-1/2 rounded-full bg-[#0d1210] shadow-[inset_0_1px_2px_rgba(0,0,0,.9),0_1px_0_rgba(255,255,255,.12)]" aria-hidden="true" />

          {/* binding strip with two staples */}
          <div
            className="relative z-20 mx-auto flex items-center justify-between rounded-t-[3px] px-9"
            style={{ width: PAGE_W, height: 30, background: "linear-gradient(180deg,#dd4a30 0%,#c8371f 55%,#a82b17 100%)", boxShadow: "0 3px 5px -1px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.3)" }}
            aria-hidden="true"
          >
            {[0, 1].map((n) => (
              <span key={n} className="block h-[5px] w-7 rounded-full" style={{ background: "linear-gradient(180deg,#f4f4f2,#9b9b96)", boxShadow: "0 1px 1px rgba(0,0,0,.5)" }} />
            ))}
          </div>
          {/* torn stubs left under the binding */}
          <div className="relative z-10 mx-auto" style={{ width: PAGE_W, height: 5, background: "repeating-linear-gradient(90deg,#f1ede4 0 5px,#d8d1c3 5px 6px,#f7f4ee 6px 13px,#cfc7b8 13px 14px)", clipPath: "polygon(0 0,100% 0,100% 55%,96% 100%,91% 60%,85% 95%,78% 55%,70% 100%,63% 62%,55% 96%,47% 58%,39% 100%,31% 60%,23% 95%,15% 58%,8% 100%,0 60%)" }} aria-hidden="true" />

          {/* the pad */}
          <div
            className="relative mx-auto cursor-grab touch-none select-none active:cursor-grabbing"
            style={{ width: PAGE_W, height: PAGE_H, marginTop: -3, marginBottom: 14, transformStyle: "preserve-3d" }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onClick={onClick}
          >
            <div className="absolute inset-0 overflow-hidden rounded-b-[2px]" style={{ boxShadow: edge.join(",") }}>
              <PageFace index={index + 1} />
              <div
                ref={castRef}
                className="pointer-events-none absolute left-0 top-0 w-full"
                style={{ height: 120, opacity: 0, background: "linear-gradient(180deg,rgba(42,28,16,.5) 0%,rgba(42,28,16,.16) 38%,rgba(42,28,16,0) 100%)", transform: `translateY(${PAGE_H}px)` }}
                aria-hidden="true"
              />
            </div>
            <div
              ref={dropRef}
              className="pointer-events-none absolute left-[6%] top-[4%] h-[88%] w-[88%] rounded-[30px]"
              style={{ opacity: 0, background: "rgba(30,18,8,.7)", filter: "blur(22px)", transformOrigin: "50% 0" }}
              aria-hidden="true"
            />
            <div ref={sheetRef} className="absolute inset-0" style={{ transformOrigin: "50% 0", transformStyle: "preserve-3d", willChange: "transform" }} aria-hidden="true">
              {buildStrip(0)}
            </div>
            <button
              type="button"
              className="absolute inset-0 z-30 cursor-grab touch-none rounded-[2px] outline-none focus-visible:ring-2 focus-visible:ring-[#c8371f] focus-visible:ring-offset-4 focus-visible:ring-offset-[#1f2924] active:cursor-grabbing"
              style={{ transform: "translateZ(1px)" }}
              aria-label={`Tear off ${today.weekday} ${today.day} ${today.month}`}
            />
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c9b27a]" aria-hidden="true">
            <span>Halden &amp; Rowe</span>
            <span>Stationers</span>
          </div>
        </div>
      </div>

      <p className="relative mt-9 text-center text-[13px] text-stone-600">Pull the page up, or press Enter to tear it off.</p>
      <p className="sr-only" aria-live="polite">
        Showing {today.weekday} {today.day} {today.month} {today.year}
      </p>
    </section>
  );
}
