import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// The photo behind the glass. Glass only reads as glass over something with colour and detail.
const PHOTO = "https://images.pexels.com/photos/11143817/pexels-photo-11143817.jpeg?auto=compress&cs=tinysrgb&w=1600";

// Three strengths of frost. Each sets the blur, the tint and the edge through CSS variables.
const FROSTS = {
  light: { label: "Light", blur: "10px", tint: "0.10", edge: "0.28" },
  medium: { label: "Medium", blur: "18px", tint: "0.16", edge: "0.34" },
  heavy: { label: "Heavy", blur: "30px", tint: "0.24", edge: "0.42" },
} as const;
type Frost = keyof typeof FROSTS;

const links = ["Trips", "Cabins", "Guides", "Journal"];
const stats = [
  { label: "Water", value: "11°C" },
  { label: "Wind", value: "6 km/h" },
  { label: "Sunset", value: "21:48" },
];

// The glass recipe. Copy this block into your own stylesheet.
const CSS = `
.s2g-glass {
  background: rgba(255, 255, 255, var(--s2g-tint, 0.16));
  -webkit-backdrop-filter: blur(var(--s2g-blur, 18px)) saturate(160%);
  backdrop-filter: blur(var(--s2g-blur, 18px)) saturate(160%);
  border: 1px solid rgba(255, 255, 255, var(--s2g-edge, 0.34));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 12px 40px -12px rgba(15, 10, 5, 0.45);
}
.s2g-glass-dark {
  background: rgba(20, 16, 14, calc(var(--s2g-tint, 0.16) + 0.22));
  -webkit-backdrop-filter: blur(var(--s2g-blur, 18px)) saturate(140%);
  backdrop-filter: blur(var(--s2g-blur, 18px)) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 12px 40px -12px rgba(0, 0, 0, 0.5);
}
/* No backdrop-filter support (or the preview switch is on): solid panels that stay readable. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .s2g-glass { background: rgba(58, 44, 38, 0.92); }
  .s2g-glass-dark { background: rgba(24, 20, 18, 0.94); }
}
.s2g-nofilter .s2g-glass { background: rgba(58, 44, 38, 0.92); -webkit-backdrop-filter: none; backdrop-filter: none; }
.s2g-nofilter .s2g-glass-dark { background: rgba(24, 20, 18, 0.94); -webkit-backdrop-filter: none; backdrop-filter: none; }
`;

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900";

function GlassNavbar() {
  const [active, setActive] = useState("Trips");
  return (
    <nav aria-label="Main" className="s2g-glass flex items-center justify-between gap-3 rounded-full py-2 pl-5 pr-2 text-white">
      <a href="#" className={`rounded-full text-[15px] font-semibold tracking-tight ${ring}`}>Fjordline</a>
      <ul className="hidden items-center gap-1 sm:flex">
        {links.map((l) => (
          <li key={l}>
            <a
              href="#"
              aria-current={active === l ? "page" : undefined}
              onClick={(e) => { e.preventDefault(); setActive(l); }}
              className={`inline-flex h-10 items-center rounded-full px-4 text-sm transition-colors ${active === l ? "bg-white/25 font-medium" : "text-white/85 hover:bg-white/10"} ${ring}`}
            >
              {l}
            </a>
          </li>
        ))}
      </ul>
      <a href="#" className={`inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-stone-900 hover:bg-white/90 ${ring}`}>Book a cabin</a>
    </nav>
  );
}

function GlassCard() {
  return (
    <article className="s2g-glass rounded-3xl p-6 text-white">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/80">Frosted card</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">Lakeshore cabin, three nights</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/85">A timber cabin on the north shore with a wood stove, a rowing boat and the ridge line out of every window.</p>
      <div className="mt-6 flex items-end justify-between gap-4">
        <p><span className="text-3xl font-semibold tracking-tight">€420</span><span className="ml-1 text-sm text-white/80">total</span></p>
        <a href="#" className={`inline-flex h-11 items-center rounded-xl border border-white/40 px-4 text-sm font-medium hover:bg-white/15 ${ring}`}>See dates</a>
      </div>
    </article>
  );
}

function GlassLogin() {
  return (
    <form className="s2g-glass-dark rounded-3xl p-6 text-white" onSubmit={(e) => e.preventDefault()} aria-labelledby="s2g-login-title">
      <h2 id="s2g-login-title" className="text-xl font-semibold tracking-tight">Sign in to your trips</h2>
      <p className="mt-1 text-sm text-white/75">Glass login panel, darker tint for form contrast.</p>
      <label htmlFor="s2g-email" className="mt-5 block text-sm font-medium">Email</label>
      <input id="s2g-email" type="email" autoComplete="email" placeholder="you@mail.example"
        className="mt-1.5 h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/55 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/40" />
      <label htmlFor="s2g-pass" className="mt-4 block text-sm font-medium">Password</label>
      <input id="s2g-pass" type="password" autoComplete="current-password"
        className="mt-1.5 h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/40" />
      <button type="submit" className={`mt-5 h-11 w-full rounded-xl bg-white text-sm font-semibold text-stone-900 hover:bg-white/90 ${ring}`}>Sign in</button>
    </form>
  );
}

function StatChips() {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Conditions tonight">
      {stats.map((s) => (
        <li key={s.label} className="s2g-glass inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm text-white">
          <span className="text-white/80">{s.label}</span>
          <span className="font-semibold tabular-nums">{s.value}</span>
        </li>
      ))}
    </ul>
  );
}

export default function GlassmorphismSet() {
  const reduce = useReducedMotion();
  const [frost, setFrost] = useState<Frost>("medium");
  const [noFilter, setNoFilter] = useState(false);
  const f = FROSTS[frost];
  const enter = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 260, damping: 28, delay: reduce ? 0 : 0.08 * i },
  } as const);

  return (
    <section
      className={`relative min-h-[680px] overflow-hidden bg-stone-800 font-[Inter_Tight,Inter,ui-sans-serif,system-ui] ${noFilter ? "s2g-nofilter" : ""}`}
      style={{ ["--s2g-blur" as string]: f.blur, ["--s2g-tint" as string]: f.tint, ["--s2g-edge" as string]: f.edge }}
    >
      <style>{CSS}</style>
      <img src={PHOTO} alt="Mountain lake at sunset with a dark rock in the still water" width={1600} height={1066}
        className="absolute inset-0 h-full w-full object-cover motion-safe:animate-[s2g-drift_24s_ease-in-out_infinite_alternate]" />
      <style>{`@keyframes s2g-drift { from { transform: scale(1.04) translateX(0); } to { transform: scale(1.08) translateX(-1.5%); } }`}</style>
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/45 via-stone-900/5 to-stone-900/40" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[680px] max-w-5xl flex-col justify-between gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <motion.div {...enter(0)}><GlassNavbar /></motion.div>

        <div className="grid gap-6 md:grid-cols-[1.15fr_1fr] md:items-end md:pb-6">
          <div className="flex flex-col gap-5">
            <motion.div {...enter(1)}><GlassCard /></motion.div>
            <motion.div {...enter(2)}><StatChips /></motion.div>
            <motion.div {...enter(3)} className="s2g-glass-dark flex flex-wrap items-center gap-3 rounded-2xl p-3 text-white">
              <div role="radiogroup" aria-label="Frost strength" className="flex rounded-full bg-white/10 p-1">
                {(Object.keys(FROSTS) as Frost[]).map((k) => (
                  <button key={k} type="button" role="radio" aria-checked={frost === k} onClick={() => setFrost(k)}
                    className={`h-9 rounded-full px-3.5 text-sm transition-colors ${frost === k ? "bg-white font-semibold text-stone-900" : "text-white/85 hover:bg-white/10"} ${ring}`}>
                    {FROSTS[k].label}
                  </button>
                ))}
              </div>
              <button type="button" role="switch" aria-checked={noFilter} onClick={() => setNoFilter((v) => !v)}
                className={`inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm text-white/90 hover:bg-white/10 ${ring}`}>
                <span aria-hidden="true" className={`relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors ${noFilter ? "bg-white" : "bg-white/25"}`}>
                  <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full transition-transform ${noFilter ? "translate-x-[18px] bg-stone-900" : "translate-x-0.5 bg-white/90"}`} />
                </span>
                Preview fallback
              </button>
            </motion.div>
          </div>
          <motion.div {...enter(2)}><GlassLogin /></motion.div>
        </div>
      </div>
    </section>
  );
}
