import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Suggestions typed into the placeholder. Typing stops as soon as the field is focused or filled.
const SUGGESTIONS = ["brass cabinet hinges", "linseed oil for oak", "a cast iron door knocker", "wood glue that sets fast"];
const STATIC_HINT = "Search hinges, oils, tools and more";

export default function SearchPlaceholderTyper() {
  const rootRef = useRef<HTMLElement>(null);
  const [hint, setHint] = useState(`Try: ${SUGGESTIONS[0]}`);
  const [active, setActive] = useState(false);
  const [value, setValue] = useState("");
  const reduce = useReducedMotion();
  const stopped = active || value.length > 0 || !!reduce;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || stopped) return;
    let alive = true;
    let visible = true;
    let timer = 0;
    let resume: null | (() => void) = null;
    const wait = (ms: number) =>
      new Promise<void>((done) => {
        const go = () => { timer = window.setTimeout(done, ms); };
        if (visible) go();
        else resume = go;
      });
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && resume) { const r = resume; resume = null; r(); }
    });
    io.observe(el);
    (async () => {
      let i = 0;
      await wait(800);
      while (alive) {
        const cur = SUGGESTIONS[i];
        for (let n = cur.length; n >= 0 && alive; n--) { setHint(`Try: ${cur.slice(0, n)}`); await wait(22); }
        i = (i + 1) % SUGGESTIONS.length;
        const next = SUGGESTIONS[i];
        await wait(260);
        for (let n = 1; n <= next.length && alive; n++) {
          setHint(`Try: ${next.slice(0, n)}`);
          await wait(55 + Math.random() * 60 + (next[n - 1] === " " ? 60 : 0));
        }
        await wait(1600);
      }
    })();
    return () => { alive = false; window.clearTimeout(timer); io.disconnect(); };
  }, [stopped]);

  return (
    <section ref={rootRef} className="bg-gradient-to-b from-[#e3f0ec] to-[#cfe4de] px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-serif text-3xl font-medium text-[#12403a] sm:text-4xl">Pennick &amp; Sons Hardware</h2>
        <p className="mt-3 text-base text-[#2f5a53]">Four floors of fittings, finishes and hand tools, all in stock.</p>
        <form role="search" className="mt-8" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="sph-q" className="sr-only">Search the shop</label>
          <div className="flex items-center gap-2 rounded-2xl border border-[#9cc3b9] bg-white p-2 shadow-[0_18px_40px_-24px_rgba(18,64,58,0.45)] focus-within:border-[#12403a]">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="ml-2 h-5 w-5 shrink-0 text-[#3f6b64]" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input
              id="sph-q"
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setActive(true)}
              onBlur={() => setActive(false)}
              placeholder={stopped ? STATIC_HINT : hint}
              className="h-11 min-w-0 flex-1 bg-transparent text-base text-[#12403a] placeholder:text-[#4b6b66] focus:outline-none"
            />
            <button type="submit" className="h-11 shrink-0 rounded-xl bg-[#12403a] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12403a] focus-visible:ring-offset-2">Search</button>
          </div>
        </form>
        <p className="mt-4 text-sm text-[#2f5a53]">Popular this week: hinges, beeswax, chisels</p>
      </div>
    </section>
  );
}
