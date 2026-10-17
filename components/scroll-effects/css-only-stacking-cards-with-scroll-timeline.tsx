import { useEffect, useRef, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";

const rooms = [
  { no: "Room 1", title: "Salt and slate", text: "Coastal paintings from the north shore, hung low so you meet the horizon at eye level.", works: "14 works", bg: "#ffffff", ink: "#1b2433", sub: "#4b5565" },
  { no: "Room 2", title: "The weavers' table", text: "Hand-loomed wool from three generations of one family, laid flat under soft daylight.", works: "22 pieces", bg: "#1f3a5f", ink: "#f2f5f9", sub: "#c6d2e2" },
  { no: "Room 3", title: "Small hours", text: "Night photographs of an empty market town, printed small and hung far apart.", works: "9 prints", bg: "#dfe6ee", ink: "#1b2433", sub: "#465163" },
  { no: "Room 4", title: "Kiln marks", text: "Stoneware bowls shown with the shelves they were fired on, ash glaze and all.", works: "31 objects", bg: "#121a26", ink: "#eef2f7", sub: "#b4bfcd" },
];

export default function CssOnlyStackingCardsWithScrollTimeline() {
  const reduce = useReducedMotion();
  const deckRef = useRef<HTMLDivElement>(null);

  // Only for browsers without scroll-driven animations: an IntersectionObserver marks a card once the next one pins over it.
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck || reduce || CSS.supports("animation-timeline: scroll()")) return;
    deck.setAttribute("data-fallback", "");
    const cards = Array.from(deck.querySelectorAll<HTMLElement>(".w4cvt-card"));
    // A thin band from the top of the deck down to the pin line: a card inside it has pinned over the one before.
    const band = deck.clientHeight - parseFloat(getComputedStyle(cards[0]).top) - 2;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => cards[cards.indexOf(e.target as HTMLElement) - 1]?.toggleAttribute("data-under", e.isIntersecting)),
      { root: deck, rootMargin: `0px 0px -${band}px 0px` },
    );
    cards.slice(1).forEach((c) => io.observe(c));
    const onScroll = () => deck.toggleAttribute("data-scrolled", deck.scrollTop > 8);
    deck.addEventListener("scroll", onScroll, { passive: true });
    return () => { io.disconnect(); deck.removeEventListener("scroll", onScroll); };
  }, [reduce]);

  return (
    <section className="w4cvt-root flex flex-col">
      <style>{`
        .w4cvt-root { height: 640px; background: #e8edf3; color: #1b2433; }
        .w4cvt-deck { --h: 340px; --g: 24px; --p: 24px; position: relative; flex: 1; min-height: 0; overflow-y: auto; padding: var(--p) 20px 150px; scrollbar-width: thin; scrollbar-color: #b9c4d2 transparent; }
        .w4cvt-deck:focus-visible { outline: 3px solid #1f3a5f; outline-offset: -3px; }
        .w4cvt-hint { position: sticky; top: 0; z-index: 20; height: 0; display: flex; justify-content: center; pointer-events: none; transition: opacity .4s ease; }
        .w4cvt-hint span { margin-top: -18px; padding: 3px 12px; border-radius: 999px; background: #1b2433; color: #f2f5f9; font-size: 12px; letter-spacing: .04em; }
        .w4cvt-deck[data-scrolled] .w4cvt-hint { opacity: 0; }
        .w4cvt-list { display: grid; gap: var(--g); max-width: 44rem; margin: 0 auto; padding: 0; list-style: none; }
        .w4cvt-card { position: sticky; top: var(--p); height: var(--h); }
        .w4cvt-face { height: 100%; transform-origin: 50% 0; }
        .w4cvt-shade { position: absolute; inset: 0; border-radius: inherit; background: #0b111a; opacity: 0; pointer-events: none; }
        .w4cvt-deck[data-fallback] .w4cvt-face, .w4cvt-deck[data-fallback] .w4cvt-shade { transition: transform .5s cubic-bezier(.2,.7,.2,1), opacity .5s ease; }
        .w4cvt-deck[data-fallback] .w4cvt-card[data-under] .w4cvt-face { transform: scale(.92); }
        .w4cvt-deck[data-fallback] .w4cvt-card[data-under] .w4cvt-shade { opacity: .45; }
        @supports (animation-timeline: scroll()) {
          .w4cvt-face, .w4cvt-shade { animation-timing-function: linear; animation-fill-mode: both; animation-timeline: scroll(nearest block);
            animation-range: calc(var(--i) * (var(--h) + var(--g)) + var(--g)) calc((var(--i) + 1) * (var(--h) + var(--g))); }
          .w4cvt-face { animation-name: w4cvt-sink; }
          .w4cvt-shade { animation-name: w4cvt-dim; }
          .w4cvt-card:last-child .w4cvt-face, .w4cvt-card:last-child .w4cvt-shade { animation: none; }
          .w4cvt-hint { animation: w4cvt-hide linear both; animation-timeline: scroll(nearest block); animation-range: 0 40px; }
        }
        @keyframes w4cvt-sink { to { transform: scale(.92); } }
        @keyframes w4cvt-dim { to { opacity: .45; } }
        @keyframes w4cvt-hide { to { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .w4cvt-face, .w4cvt-shade, .w4cvt-hint { animation: none !important; transition: none !important; transform: none !important; } .w4cvt-shade { opacity: 0 !important; } .w4cvt-hint { display: none; } }
      `}</style>
      <div className="mx-auto w-full max-w-[44rem] px-5 pb-6 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1f3a5f]">Harlow Street Gallery, winter show</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Four rooms, one floor</h2>
          <a href="#" className="inline-flex min-h-[44px] items-center rounded-full bg-[#1f3a5f] px-5 text-sm font-semibold text-white transition hover:bg-[#2b4c78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f3a5f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8edf3]">Plan your visit</a>
        </div>
      </div>
      <div ref={deckRef} className="w4cvt-deck" tabIndex={0} role="region" aria-label="Exhibition rooms, scrollable">
        <div className="w4cvt-hint" aria-hidden="true"><span>Scroll inside</span></div>
        <ul className="w4cvt-list">
          {rooms.map((r, i) => (
            <li key={r.title} className="w4cvt-card" style={{ "--i": i } as CSSProperties}>
              <article className="w4cvt-face relative flex flex-col rounded-3xl p-7 shadow-[0_24px_50px_-26px_rgba(15,23,42,0.55)] sm:p-9" style={{ background: r.bg, color: r.ink }}>
                <div className="flex items-center justify-between text-sm font-medium" style={{ color: r.sub }}>
                  <span>{r.no}</span><span>{r.works}</span>
                </div>
                <h3 className="mt-auto text-4xl font-semibold tracking-tight sm:text-5xl">{r.title}</h3>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed" style={{ color: r.sub }}>{r.text}</p>
                <span className="w4cvt-shade" aria-hidden="true" />
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
