import { useState } from "react";

// Four pure-CSS animated backgrounds. Every moving layer animates `transform`
// only, so the browser composites them on the GPU without repainting.
// Copy the <style> block and the one background you want.

const heroes = [
  {
    id: "mesh",
    label: "Gradient mesh",
    eyebrow: "Studio scheduling",
    title: "Book the studio without the email chain.",
    copy: "Clients pick a slot, pay the deposit and get a reminder the day before.",
    cta: "Start a booking page",
    theme: "light",
  },
  {
    id: "grid",
    label: "Dot grid spotlight",
    eyebrow: "Release notes",
    title: "Ship on Friday without the dread.",
    copy: "Every deploy gets a preview link, a checklist and a one-click rollback.",
    cta: "Read the changelog",
    theme: "dark",
  },
  {
    id: "aurora",
    label: "Aurora bands",
    eyebrow: "Night field trips",
    title: "Four nights north of the tree line.",
    copy: "Small groups, heated cabins and a guide who checks the forecast hourly.",
    cta: "See March dates",
    theme: "dark",
  },
  {
    id: "grain",
    label: "Grain and light",
    eyebrow: "Ceramics journal",
    title: "Notes from a slow kiln.",
    copy: "Glaze tests, firing logs and the occasional crack, written up every Sunday.",
    cta: "Subscribe for free",
    theme: "light",
  },
] as const;

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const css = `
.cab-root[data-paused="true"] .cab-move { animation-play-state: paused; }
@keyframes cab-drift-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(18%,12%,0) scale(1.15); } }
@keyframes cab-drift-b { 0%,100% { transform: translate3d(0,0,0) scale(1.1); } 50% { transform: translate3d(-16%,-10%,0) scale(.95); } }
@keyframes cab-drift-c { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(-10%,16%,0); } }
@keyframes cab-spot { 0% { transform: translate3d(-20%,-15%,0); } 25% { transform: translate3d(55%,5%,0); } 50% { transform: translate3d(40%,45%,0); } 75% { transform: translate3d(-5%,35%,0); } 100% { transform: translate3d(-20%,-15%,0); } }
@keyframes cab-band-a { 0%,100% { transform: translate3d(-8%,0,0) rotate(-12deg) scaleY(1); } 50% { transform: translate3d(10%,4%,0) rotate(-6deg) scaleY(1.25); } }
@keyframes cab-band-b { 0%,100% { transform: translate3d(6%,0,0) rotate(-20deg) scaleY(1.1); } 50% { transform: translate3d(-10%,-5%,0) rotate(-26deg) scaleY(.85); } }
@keyframes cab-band-c { 0%,100% { transform: translate3d(0,0,0) rotate(-8deg); } 50% { transform: translate3d(14%,6%,0) rotate(-14deg); } }
@keyframes cab-light { 0%,100% { transform: translate3d(-25%,-10%,0); } 50% { transform: translate3d(35%,20%,0); } }
@keyframes cab-grain { 0% { transform: translate3d(0,0,0); } 25% { transform: translate3d(-3%,2%,0); } 50% { transform: translate3d(2%,-3%,0); } 75% { transform: translate3d(-2%,-1%,0); } 100% { transform: translate3d(1%,3%,0); } }
.cab-dots-holes {
  background: #0b1120;
  -webkit-mask-image: radial-gradient(circle, transparent 1.6px, #000 2.2px);
          mask-image: radial-gradient(circle, transparent 1.6px, #000 2.2px);
  -webkit-mask-size: 22px 22px; mask-size: 22px 22px;
}
@media (prefers-reduced-motion: reduce) { .cab-move { animation: none !important; } }
`;

function MeshBg() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#fbf7f1]">
      <div className="cab-move absolute -left-[20%] -top-[30%] h-[90%] w-[80%] rounded-full animate-[cab-drift-a_18s_ease-in-out_infinite] [background:radial-gradient(closest-side,rgba(251,146,60,.55),transparent)]" />
      <div className="cab-move absolute -right-[15%] -top-[10%] h-[85%] w-[75%] rounded-full animate-[cab-drift-b_22s_ease-in-out_infinite] [background:radial-gradient(closest-side,rgba(244,114,182,.42),transparent)]" />
      <div className="cab-move absolute -bottom-[35%] left-[15%] h-[90%] w-[80%] rounded-full animate-[cab-drift-c_26s_ease-in-out_infinite] [background:radial-gradient(closest-side,rgba(56,189,248,.38),transparent)]" />
    </div>
  );
}

function GridBg() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#0b1120]">
      <div className="absolute inset-0 [background-image:radial-gradient(circle,#1e293b_1.5px,transparent_1.9px)] [background-size:22px_22px]" />
      <div className="cab-move absolute left-0 top-0 h-[80%] w-[60%] animate-[cab-spot_16s_ease-in-out_infinite] [background:radial-gradient(closest-side,rgba(94,234,212,1),rgba(45,212,191,.45)_50%,transparent)]" />
      <div className="cab-dots-holes absolute inset-0" />
      <div className="cab-move absolute left-0 top-0 h-[80%] w-[60%] opacity-20 animate-[cab-spot_16s_ease-in-out_infinite] [background:radial-gradient(closest-side,rgba(45,212,191,.6),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0b1120] to-transparent" />
    </div>
  );
}

function AuroraBg() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#06121a]">
      <div className="cab-move absolute -left-[20%] top-[5%] h-[38%] w-[140%] animate-[cab-band-a_20s_ease-in-out_infinite] [background:radial-gradient(50%_50%_at_50%_50%,rgba(52,211,153,.8),rgba(52,211,153,.2)_55%,transparent)]" />
      <div className="cab-move absolute -left-[10%] top-[18%] h-[30%] w-[130%] animate-[cab-band-b_26s_ease-in-out_infinite] [background:radial-gradient(50%_50%_at_50%_50%,rgba(45,212,191,.6),transparent_70%)]" />
      <div className="cab-move absolute -left-[30%] top-[-6%] h-[30%] w-[120%] animate-[cab-band-c_30s_ease-in-out_infinite] [background:radial-gradient(50%_50%_at_50%_50%,rgba(244,114,182,.45),transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#06121a] via-[#06121a]/60 to-transparent" />
    </div>
  );
}

function GrainBg() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#d6ccbc]">
      <div className="absolute inset-0 [background:radial-gradient(120%_90%_at_50%_120%,rgba(120,98,72,.35),transparent_60%)]" />
      <div className="cab-move absolute -left-[10%] -top-[20%] h-[120%] w-[80%] animate-[cab-light_14s_ease-in-out_infinite] [background:radial-gradient(closest-side,rgba(255,252,245,1),rgba(255,244,224,.55)_45%,transparent)]" />
      <div
        className="cab-move absolute -inset-[10%] opacity-[.35] mix-blend-multiply animate-[cab-grain_.8s_steps(4)_infinite]"
        style={{ backgroundImage: NOISE }}
      />
    </div>
  );
}

const backgrounds = { mesh: MeshBg, grid: GridBg, aurora: AuroraBg, grain: GrainBg };

export default function CssAnimatedBackgrounds() {
  const [paused, setPaused] = useState(false);

  return (
    <section
      className="cab-root bg-white px-4 py-12 font-['Inter_Tight',Inter,ui-sans-serif,system-ui] text-slate-900 sm:px-8"
      data-paused={paused}
    >
      <style>{css}</style>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-600">CSS only, transform animations</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Four animated backgrounds</h2>
          </div>
          <button
            type="button"
            aria-pressed={paused}
            onClick={() => setPaused((p) => !p)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M4 2h3v12H4zM9 2h3v12H9z" />}
            </svg>
            {paused ? "Play motion" : "Pause motion"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {heroes.map((h) => {
            const Bg = backgrounds[h.id];
            const dark = h.theme === "dark";
            return (
              <article
                key={h.id}
                aria-labelledby={`cab-${h.id}`}
                className={`relative isolate flex min-h-[300px] flex-col justify-end overflow-hidden rounded-2xl p-6 sm:p-8 ${dark ? "text-white ring-1 ring-white/10" : "text-slate-900 ring-1 ring-slate-900/10"}`}
              >
                <Bg />
                <span className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-medium ${dark ? "bg-white/10 text-white" : "bg-white/70 text-slate-800"}`}>
                  {h.label}
                </span>
                <div className="relative max-w-md">
                  <p className={`text-xs font-semibold uppercase tracking-[.14em] ${dark ? "text-teal-200" : "text-slate-700"}`}>{h.eyebrow}</p>
                  <h3 id={`cab-${h.id}`} className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]">
                    {h.title}
                  </h3>
                  <p className={`mt-2 text-sm leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>{h.copy}</p>
                  <a
                    href="#"
                    className={`mt-5 inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${dark ? "bg-white text-slate-900 hover:bg-slate-200 focus-visible:ring-white focus-visible:ring-offset-slate-900" : "bg-slate-900 text-white hover:bg-slate-700 focus-visible:ring-slate-900"}`}
                  >
                    {h.cta}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
