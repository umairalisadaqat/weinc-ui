import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// A made-up pottery's kiln opening. If the date has passed, the same day next year is used.
const EVENT = "Winter kiln opening";
const TARGET = "2026-12-05T10:00:00";
const INTRO_MS = 1300; // how long the first count-up from zero takes

const two = new Intl.NumberFormat("en-US", { minimumIntegerDigits: 2 });
const plain = new Intl.NumberFormat("en-US");
const dateLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function targetDate(now: number) {
  const d = new Date(TARGET);
  while (d.getTime() < now) d.setFullYear(d.getFullYear() + 1);
  return d;
}
function remaining(now: number) {
  const ms = Math.max(0, targetDate(now).getTime() - now);
  const mins = Math.floor(ms / 60000);
  return { days: Math.floor(mins / 1440), hours: Math.floor((mins % 1440) / 60), minutes: mins % 60, sec: (ms % 60000) / 1000 };
}

export default function CalmCountdownTimer() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [now, setNow] = useState(() => Date.now());
  const [intro, setIntro] = useState(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let raf = 0;
    let timer = 0;
    let introDone = !!reduce;
    let started = 0;
    if (!reduce) setIntro(0);
    const step = (t: number) => {
      if (!started) started = t;
      const p = Math.min(1, (t - started) / INTRO_MS);
      setIntro(p);
      if (p < 1) raf = requestAnimationFrame(step);
      else introDone = true;
    };
    // Ticks once a minute, lined up with the clock, and only while on screen.
    const schedule = () => {
      setNow(Date.now());
      timer = window.setTimeout(schedule, 60000 - (Date.now() % 60000) + 20);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(timer);
        cancelAnimationFrame(raf);
        setPaused(!entry.isIntersecting);
        if (!entry.isIntersecting) return;
        schedule();
        if (!introDone) {
          started = 0;
          raf = requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  const r = remaining(now);
  const e = easeOut(intro);
  const units = [
    { label: "Days", value: r.days, show: plain.format(Math.round(r.days * e)), size: plain.format(r.days) },
    { label: "Hours", value: r.hours, show: two.format(Math.round(r.hours * e)), size: "00" },
    { label: "Minutes", value: r.minutes, show: two.format(Math.round(r.minutes * e)), size: "00" },
  ];
  const when = targetDate(now);
  const sentence = `${EVENT} in ${plain.format(r.days)} days, ${r.hours} hours and ${r.minutes} minutes.`;

  return (
    <section
      ref={rootRef}
      data-paused={paused}
      className="relative overflow-hidden px-5 py-16 text-[#3a2a22] sm:py-20"
      style={{ background: "linear-gradient(170deg, #f8ecdd 0%, #f4dccb 55%, #eecdbd 100%)" }}
    >
      <style>{`
        @keyframes cdn-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .cdn-bar { transform: scaleX(0); animation: cdn-fill 60s linear infinite; }
        [data-paused="true"] .cdn-bar { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .cdn-bar { animation: none; transform: scaleX(0); } }
      `}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(255,246,228,.9), rgba(255,246,228,0))" }}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#94512f]">Linden Pottery</p>
        <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">{EVENT}</h2>
        <p className="mt-3 text-base text-[#5d463a]">
          <time dateTime={when.toISOString()}>{dateLabel.format(when)}</time>, at the studio
        </p>
        <p className="sr-only">{sentence}</p>
        <div aria-hidden="true" className="mt-10 flex items-start justify-center gap-3 sm:gap-6">
          {units.map((u, i) => (
            <div key={u.label} className="flex items-start gap-3 sm:gap-6">
              {i > 0 && <span className="pt-2 text-4xl font-extralight text-[#3a2a22]/30 sm:pt-5 sm:text-6xl">:</span>}
              <div className="flex flex-col items-center">
                <span className="grid text-[clamp(3rem,13vw,6.5rem)] font-extralight leading-none tracking-tight tabular-nums">
                  <span className="invisible col-start-1 row-start-1">{u.size}</span>
                  <span className="col-start-1 row-start-1 text-center">{u.show}</span>
                </span>
                <span className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-[#6b5245]">{u.label}</span>
                {u.label === "Minutes" && (
                  <span className="mt-3 h-px w-full overflow-hidden bg-[#3a2a22]/15">
                    <span
                      key={now}
                      className="cdn-bar block h-full origin-left bg-[#94512f]"
                      style={{ animationDelay: `-${r.sec.toFixed(2)}s` }}
                    />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-md text-sm leading-relaxed text-[#5d463a]">
          The figures change once a minute and only a hairline creeps under the minutes, so it can sit beside your booking button without nagging. The studio and date are made up for this demo.
        </p>
      </div>
    </section>
  );
}
