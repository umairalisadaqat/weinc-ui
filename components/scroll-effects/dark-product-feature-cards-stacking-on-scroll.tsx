import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const WAVE = [18, 34, 52, 40, 70, 88, 60, 46, 74, 96, 80, 58, 42, 66, 84, 62, 38, 54, 72, 50];
const features = [
  { kicker: "Inputs", title: "Two microphones, one clean take", text: "Plug in a lapel mic and a shotgun at once. Each one records to its own track, so a cough on one never ruins the other.", spec: "2 locking XLR inputs", visual: "wave" },
  { kicker: "Control", title: "A gain dial you can find blind", text: "The large knob clicks in half-decibel steps and stays where you left it, even in a coat pocket on a windy walk.", spec: "Detented, 60 steps", visual: "dial" },
  { kicker: "Battery", title: "A long day on one charge", text: "Record from first light to the last interview and charge from any USB-C brick while it keeps running.", spec: "USB-C, records while charging", visual: "battery" },
  { kicker: "Files", title: "Takes named the way you think", text: "Say a short label after you press stop and the file is named for it, ready to drag into your editor.", spec: "WAV and MP3 side by side", visual: "files" },
];
const SCALE_STEP = 0.05; // shrink per covering card
const LIFT = 16; // px each buried card rises so its top edge shows
const AUTO_PX_PER_SEC = 30; // demo scroll speed; 0 turns it off

function Visual({ kind }: { kind: string }) {
  if (kind === "wave")
    return (
      <div className="flex h-full items-center justify-center gap-1.5 px-6 py-[15%]">
        {WAVE.map((h, i) => <span key={i} className="w-1.5 rounded-full bg-[#d9895a]" style={{ height: `${h}%`, opacity: 0.8 }} />)}
      </div>
    );
  if (kind === "dial")
    return (
      <div className="grid h-full place-items-center">
        <div className="relative h-40 w-40">
          <div className="absolute inset-0 rounded-full" style={{ background: "repeating-conic-gradient(#6b6660 0 1.5deg, transparent 1.5deg 10deg)", WebkitMask: "radial-gradient(circle, transparent 64%, #000 65%)", mask: "radial-gradient(circle, transparent 64%, #000 65%)" }} />
          <div className="absolute inset-6 rounded-full bg-gradient-to-b from-[#3a3733] to-[#201e1c] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_24px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 rotate-[38deg]"><span className="absolute left-1/2 top-2 -ml-0.5 h-8 w-1 rounded-full bg-[#d9895a]" /></div>
          </div>
        </div>
      </div>
    );
  if (kind === "battery")
    return (
      <div className="grid h-full place-items-center">
        <div className="flex items-center">
          <div className="flex gap-1.5 rounded-xl border-2 border-[#6b6660] p-2">
            {[1, 1, 1, 1, 0].map((on, i) => <span key={i} className={`h-14 w-7 rounded-md ${on ? "bg-[#d9895a]" : "bg-[#2e2b28]"}`} />)}
          </div>
          <span className="ml-1 h-6 w-1.5 rounded-r bg-[#6b6660]" />
        </div>
      </div>
    );
  return (
    <ul className="grid h-full content-center gap-2 px-6 text-sm">
      {[["Bakery owner, part 1", "18:42"], ["Street ambience", "04:10"], ["Bakery owner, part 2", "22:05"]].map(([n, t], i) => (
        <li key={n} className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${i === 0 ? "bg-[#d9895a] text-[#1a1816]" : "bg-[#262321] text-[#d8d1c6]"}`}>
          <span className="truncate">{n}.wav</span><span className="font-mono text-xs">{t}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DarkProductFeatureCardsStackingOnScroll() {
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || reduce) return;
    const cards = Array.from(box.querySelectorAll<HTMLElement>(".w4dpf-card"));
    let raf = 0;
    const paint = () => {
      raf = 0;
      const top = box.getBoundingClientRect().top;
      const cover = cards.map((c) => {
        const d = c.getBoundingClientRect().top - top - parseFloat(getComputedStyle(c).top);
        return Math.min(1, Math.max(0, 1 - d / c.offsetHeight));
      });
      cards.forEach((c, i) => {
        let depth = 0;
        for (let j = i + 1; j < cards.length; j++) depth += cover[j];
        (c.firstElementChild as HTMLElement).style.transform = `translateY(${-LIFT * depth}px) scale(${1 - SCALE_STEP * depth})`;
        c.querySelector<HTMLElement>(".w4dpf-shade")!.style.opacity = String(Math.min(0.7, 0.35 * depth));
        c.querySelector<HTMLElement>(".w4dpf-glow")!.style.opacity = String(cover[i] * Math.max(0, 1 - depth));
      });
      box.toggleAttribute("data-scrolled", box.scrollTop > 8);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
    box.addEventListener("scroll", onScroll, { passive: true });
    paint();

    let demo = 0, last = 0, pos = box.scrollTop, seen = true, done = !AUTO_PX_PER_SEC;
    const step = (now: number) => {
      const dt = last ? Math.min(now - last, 50) : 0;
      last = now;
      pos += (AUTO_PX_PER_SEC * dt) / 1000;
      if (pos >= box.scrollHeight - box.clientHeight) { done = true; demo = 0; return; }
      box.scrollTop = pos;
      demo = requestAnimationFrame(step);
    };
    const start = () => { if (!done && seen && !demo) { last = 0; demo = requestAnimationFrame(step); } };
    const stop = () => { cancelAnimationFrame(demo); demo = 0; };
    const handOver = () => { done = true; stop(); };
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) start(); else stop(); });
    io.observe(box);
    const evs = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    evs.forEach((ev) => box.addEventListener(ev, handOver, { passive: true }));
    start();
    return () => {
      stop();
      cancelAnimationFrame(raf);
      io.disconnect();
      box.removeEventListener("scroll", onScroll);
      evs.forEach((ev) => box.removeEventListener(ev, handOver));
    };
  }, [reduce]);

  return (
    <section ref={boxRef} tabIndex={0} aria-label="Recorder features, scrollable" className="w4dpf-root">
      <style>{`
        .w4dpf-root { height: 640px; overflow-y: auto; position: relative; background: #121212; color: #ece6dc; scrollbar-width: thin; scrollbar-color: #3a3632 transparent; }
        .w4dpf-root:focus-visible { outline: 3px solid #d9895a; outline-offset: -3px; }
        .w4dpf-hint { position: sticky; top: 0; z-index: 20; height: 0; display: flex; justify-content: center; pointer-events: none; transition: opacity .4s ease; }
        .w4dpf-hint span { margin-top: 10px; padding: 4px 12px; border-radius: 999px; background: #2a2724; color: #ece6dc; font-size: 12px; letter-spacing: .04em; }
        .w4dpf-root[data-scrolled] .w4dpf-hint { opacity: 0; }
        .w4dpf-card { position: sticky; top: 72px; }
        .w4dpf-face { transform-origin: 50% 0; will-change: transform; }
        .w4dpf-shade { position: absolute; inset: 0; border-radius: inherit; background: #050505; opacity: 0; pointer-events: none; }
        .w4dpf-glow { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0; box-shadow: inset 0 1px 0 rgba(217,137,90,.55), 0 30px 80px -30px rgba(217,137,90,.45); }
        @media (prefers-reduced-motion: reduce) { .w4dpf-face { transform: none !important; } .w4dpf-shade { opacity: 0 !important; } .w4dpf-glow { opacity: .6 !important; } .w4dpf-hint { display: none; } }
      `}</style>
      <div className="w4dpf-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="mx-auto max-w-5xl px-5 pb-28 pt-12 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d9895a]">Wrenfield R2 field recorder</p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">Built for interviews that happen outdoors</h2>
        <ul className="mt-10 grid gap-8">
          {features.map((f) => (
            <li key={f.title} className="w4dpf-card">
              <article className="w4dpf-face relative grid overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#1f1d1b] to-[#171615] md:grid-cols-2">
                <div className="flex flex-col p-7 sm:p-9">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9895a]">{f.kicker}</p>
                  <h3 className="mt-3 text-2xl font-semibold leading-snug sm:text-[28px]">{f.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#b9b1a5]">{f.text}</p>
                  <p className="mt-6 inline-flex self-start rounded-full border border-white/15 px-3 py-1 font-mono text-xs text-[#d8d1c6] md:mt-auto">{f.spec}</p>
                </div>
                <div className="h-48 border-t border-white/10 bg-[#141312] md:h-auto md:min-h-[300px] md:border-l md:border-t-0" aria-hidden="true">
                  <div className="relative h-full"><Visual kind={f.visual} /></div>
                </div>
                <span className="w4dpf-glow" aria-hidden="true" />
                <span className="w4dpf-shade" aria-hidden="true" />
              </article>
            </li>
          ))}
        </ul>
        <a href="#" className="mt-14 inline-flex min-h-[44px] items-center rounded-full bg-[#ece6dc] px-6 text-sm font-semibold text-[#121212] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9895a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]">See the full spec sheet</a>
      </div>
    </section>
  );
}
