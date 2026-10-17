import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Sample figures for a made-up restaurant. Each row gets one flap per digit.
const rows = [
  { label: "Covers served this week", value: 1486 },
  { label: "Tables turned", value: 312 },
  { label: "Oysters shucked", value: 2040 },
];
const STEP = 170; // ms between flips; each leaf takes most of this to fall

const fmt = new Intl.NumberFormat("en-US");
const css = `
.sfc-card{position:relative;display:inline-block;width:.92em;height:1.36em;perspective:3.5em;border-radius:.09em;box-shadow:0 .06em .12em rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,255,255,.04)}
.sfc-half{position:absolute;left:0;right:0;height:50%;overflow:hidden;background:#24282e;color:#efe9dc;backface-visibility:hidden}
.sfc-top{top:0;border-radius:.09em .09em 0 0;background:linear-gradient(180deg,#2b3037,#24282e);transform-origin:50% 100%}
.sfc-bot{bottom:0;border-radius:0 0 .09em .09em;background:linear-gradient(180deg,#1f2328,#262a30);transform-origin:50% 0}
.sfc-face{position:absolute;left:0;right:0;height:200%;display:flex;align-items:center;justify-content:center}
.sfc-top .sfc-face{top:0}.sfc-bot .sfc-face{top:-100%}
.sfc-fall{z-index:2;animation:sfc-fall var(--sfc-d) cubic-bezier(.55,0,.9,.4) both}
.sfc-rise{z-index:2;animation:sfc-rise var(--sfc-d) cubic-bezier(.2,.7,.35,1) calc(var(--sfc-d)*.92) both}
.sfc-fall::after{content:"";position:absolute;inset:0;background:#000;animation:sfc-dim var(--sfc-d) ease-in both}
.sfc-seam{position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;background:rgba(0,0,0,.7);z-index:3}
.sfc-pin{position:absolute;top:50%;width:.06em;height:.16em;margin-top:-.08em;background:#0b0d10;z-index:3;border-radius:1px}
@keyframes sfc-fall{from{transform:rotateX(0)}to{transform:rotateX(-90deg)}}
@keyframes sfc-rise{from{transform:rotateX(90deg)}to{transform:rotateX(0)}}
@keyframes sfc-dim{from{opacity:0}to{opacity:.45}}
@media (prefers-reduced-motion: reduce){.sfc-fall,.sfc-rise{display:none}}
`;

function Flap({ digit }: { digit: string }) {
  const [s, setS] = useState({ prev: digit, cur: digit, n: 0 });
  useEffect(() => {
    setS((o) => (o.cur === digit ? o : { prev: o.cur, cur: digit, n: o.n + 1 }));
  }, [digit]);
  const half = (cls: string, ch: string, key?: string) => (
    <span key={key} className={`sfc-half ${cls}`}>
      <span className="sfc-face">{ch}</span>
    </span>
  );
  return (
    <span className="sfc-card" style={{ ["--sfc-d" as string]: `${STEP * 0.45}ms` }}>
      {half("sfc-top", s.cur)}
      {half("sfc-bot", s.prev)}
      {s.n > 0 && half("sfc-top sfc-fall", s.prev, `f${s.n}`)}
      {s.n > 0 && half("sfc-bot sfc-rise", s.cur, `r${s.n}`)}
      <span className="sfc-seam" />
      <span className="sfc-pin left-0" />
      <span className="sfc-pin right-0" />
    </span>
  );
}

export default function SplitFlapNumberCounter() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const finals = rows.map((r) => String(r.value).split("").map(Number));
  const [digits, setDigits] = useState<number[][]>(finals);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduce) {
      setDigits(finals);
      return;
    }
    let current = finals.map((d) => d.map(() => 0));
    setDigits(current);
    let timer = 0;
    const step = () => {
      let moving = false;
      current = current.map((row, r) =>
        row.map((d, i) => {
          if (d < finals[r][i]) {
            moving = true;
            return d + 1;
          }
          return d;
        }),
      );
      setDigits(current);
      if (!moving) window.clearInterval(timer);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        window.clearInterval(timer);
        if (entry.isIntersecting) timer = window.setInterval(step, STEP);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
    // finals is derived from the constant rows array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  return (
    <section ref={rootRef} className="bg-[#0f1318] px-5 py-16 text-[#efe9dc] sm:py-20">
      <style>{css}</style>
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#e0b860]">Harbour Kitchen, Pier 4</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">The week on the pass</h2>
        <div className="mt-10 rounded-xl border border-white/5 bg-[#161a20] p-4 shadow-[inset_0_2px_12px_rgba(0,0,0,.6)] sm:p-6">
          <dl className="divide-y divide-white/5">
            {rows.map((r, ri) => {
              const groups = fmt.format(r.value);
              let k = 0;
              return (
                <div key={r.label} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-sm uppercase tracking-[0.14em] text-[#a9b0b9]">{r.label}</dt>
                  <dd className="font-sans text-[2.6rem] font-semibold leading-none tabular-nums sm:text-6xl">
                    <span className="sr-only">{groups}</span>
                    <span aria-hidden="true" className="flex items-end gap-[0.07em]">
                      {groups.split("").map((ch, ci) =>
                        /\d/.test(ch) ? (
                          <Flap key={ci} digit={String(digits[ri][k++])} />
                        ) : (
                          <span key={ci} className="w-[0.22em] pb-[0.08em] text-center text-[0.55em] text-[#6f7782]">{ch}</span>
                        ),
                      )}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
        <p className="mt-6 text-sm text-[#a9b0b9]">Sample numbers for a made-up restaurant. Each leaf flips one step at a time, the way a station board does.</p>
      </div>
    </section>
  );
}
