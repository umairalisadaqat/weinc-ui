import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const plans = [
  { name: "Sole trader", price: "$24", blurb: "For one person keeping their own books tidy between tax seasons.", features: ["Bank feeds from two accounts", "Receipt capture by photo", "Quarterly tax estimate"], cta: "Start with Sole trader", dark: false },
  { name: "Small team", price: "$68", blurb: "Payroll and invoicing for a shop with a handful of staff.", features: ["Payroll for up to 12 people", "Invoices with card payments", "A bookkeeper checks each month"], cta: "Start with Small team", dark: true },
  { name: "Practice", price: "$165", blurb: "For accountants who look after many clients from one login.", features: ["Unlimited client files", "Review queue and sign-off", "Shared notes on every entry"], cta: "Talk to us about Practice", dark: false },
];
const SCALE_STEP = 0.05; // shrink per card stacked on top
const FADE_STEP = 0.55; // how far a covered plan's text fades
const AUTO_PX_PER_SEC = 30; // demo scroll speed; 0 turns it off

export default function StackedPricingPlanCardsThatPileUpOnScroll() {
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || reduce) return;
    const cards = Array.from(box.querySelectorAll<HTMLElement>(".w4spp-card"));
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
        (c.firstElementChild as HTMLElement).style.transform = `scale(${1 - SCALE_STEP * depth})`;
        c.querySelector<HTMLElement>(".w4spp-body")!.style.opacity = String(1 - FADE_STEP * Math.min(1, depth));
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
    <section ref={boxRef} tabIndex={0} aria-label="Pricing plans, scrollable" className="w4spp-root">
      <style>{`
        .w4spp-root { height: 640px; overflow-y: auto; position: relative; background: #f8fafc; color: #0f172a; scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
        .w4spp-root:focus-visible { outline: 3px solid #0f766e; outline-offset: -3px; }
        .w4spp-hint { position: sticky; top: 0; z-index: 20; height: 0; display: flex; justify-content: center; pointer-events: none; transition: opacity .4s ease; }
        .w4spp-hint span { margin-top: 10px; padding: 4px 12px; border-radius: 999px; background: #0f172a; color: #f8fafc; font-size: 12px; letter-spacing: .04em; }
        .w4spp-root[data-scrolled] .w4spp-hint { opacity: 0; }
        .w4spp-card { position: sticky; top: 32px; }
        .w4spp-face { transform-origin: 50% 0; will-change: transform; }
        @media (prefers-reduced-motion: reduce) { .w4spp-face { transform: none !important; } .w4spp-body { opacity: 1 !important; } .w4spp-hint { display: none; } }
      `}</style>
      <div className="w4spp-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f766e]">Tallyhouse pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Pick the books you need to keep</h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-slate-600">Monthly prices in US dollars. Change plans or cancel from your settings at any time.</p>
        </div>
        <ul className="mt-10 grid gap-6">
          {plans.map((p) => (
            <li key={p.name} className="w4spp-card">
              <article className={`w4spp-face rounded-2xl border p-6 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.5)] sm:p-8 ${p.dark ? "border-slate-800 bg-slate-900 text-white" : "border-slate-200 bg-white"}`}>
                <div className="w4spp-body grid gap-6 sm:grid-cols-2 sm:gap-10">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{p.name}</h3>
                      {p.dark && <span className="rounded-full bg-teal-400/15 px-2.5 py-0.5 text-xs font-semibold text-teal-300">Most chosen</span>}
                    </div>
                    <p className="mt-4 flex items-baseline gap-1"><span className="text-5xl font-semibold tracking-tight">{p.price}</span><span className={p.dark ? "text-slate-300" : "text-slate-600"}>/month</span></p>
                    <p className={`mt-3 text-sm leading-relaxed ${p.dark ? "text-slate-300" : "text-slate-600"}`}>{p.blurb}</p>
                    <a href="#" className={`mt-6 inline-flex min-h-[44px] items-center rounded-lg px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${p.dark ? "bg-teal-400 text-slate-900 hover:bg-teal-300 focus-visible:ring-teal-300 focus-visible:ring-offset-slate-900" : "bg-slate-900 text-white hover:bg-slate-700 focus-visible:ring-teal-700"}`}>{p.cta}</a>
                  </div>
                  <ul className={`grid content-start gap-3 border-t pt-5 text-sm sm:border-l sm:border-t-0 sm:pl-8 sm:pt-1 ${p.dark ? "border-slate-700" : "border-slate-200"}`}>
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-3">
                        <svg viewBox="0 0 20 20" className={`mt-0.5 h-5 w-5 shrink-0 ${p.dark ? "text-teal-300" : "text-teal-700"}`} aria-hidden="true"><path d="M5 10.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-center text-sm text-slate-600">Cancel anytime, and export your data whenever you like.</p>
      </div>
    </section>
  );
}
