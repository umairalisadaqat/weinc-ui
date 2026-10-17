import { useEffect, useRef, useState } from "react";

const words = ["Oak", "Limestone", "Daylight", "Lime plaster", "Reclaimed brick", "Larch"];
const SPEED = 28; // seconds per loop at rest
const BOOST = 0.12; // how much each pixel of scroll per frame adds to the speed
const MAX = 7; // fastest playback multiple

function Track({ dir }: { dir: "l" | "r" }) {
  const group = (dup: boolean) => (
    <span className="w3vel-group" aria-hidden={dup ? "true" : undefined}>
      {words.map((w, i) => (
        <span key={w} className={i % 2 ? "w3vel-ghost" : ""}>{w}</span>
      ))}
    </span>
  );
  return (
    <div className={`w3vel-track w3vel-${dir}`}>
      {group(false)}
      {group(true)}
    </div>
  );
}

export default function ScrollVelocityMarqueeThatSpeedsAndReverses() {
  const root = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [off, setOff] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOff(!e.isIntersecting));
    io.observe(el);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => io.disconnect();
    // The box scrolls itself in the preview. On a real page, listen to window and read scrollY instead.
    const anims = Array.from(el.querySelectorAll<HTMLElement>(".w3vel-track")).map((t) => t.getAnimations()[0]).filter(Boolean);
    let last = el.scrollTop, push = 0, rate = 1, sign = 1, frame = 0;
    const tick = () => {
      const target = sign * (1 + Math.min(Math.abs(push) * BOOST, MAX - 1));
      rate += (target - rate) * 0.12;
      push *= 0.88;
      anims.forEach((a) => (a.playbackRate = rate));
      frame = Math.abs(push) > 0.1 || Math.abs(rate - target) > 0.01 ? requestAnimationFrame(tick) : 0;
    };
    const onScroll = () => {
      const d = el.scrollTop - last;
      last = el.scrollTop;
      if (d) sign = d > 0 ? 1 : -1;
      push += d;
      setScrolled(true);
      if (!frame) frame = requestAnimationFrame(tick);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={root}
      data-paused={paused ? "" : undefined}
      data-off={off ? "" : undefined}
      className="w3vel relative h-[620px] overflow-y-auto bg-[#1c1d1f] text-[#ecebe7]"
      style={{ ["--w3vel-speed" as string]: `${SPEED}s` }}
    >
      <style>{`
        .w3vel-view { overflow: hidden; border-block: 1px solid #36383c; padding: 14px 0; }
        .w3vel-track { display: flex; width: max-content; animation: w3vel-run var(--w3vel-speed) linear infinite; }
        .w3vel-r { animation-direction: reverse; }
        .w3vel-group { display: flex; gap: 48px; padding-right: 48px; white-space: nowrap; font-size: clamp(40px, 7vw, 88px); font-weight: 600; letter-spacing: -0.04em; line-height: 1.05; }
        .w3vel-ghost { color: transparent; -webkit-text-stroke: 1.2px #a8a6a0; }
        .w3vel[data-paused] .w3vel-track, .w3vel[data-off] .w3vel-track { animation-play-state: paused; }
        .w3vel-hint { transition: opacity .4s ease; }
        @keyframes w3vel-run { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .w3vel-track { animation: none; width: auto; padding: 0 20px; }
          .w3vel-group { flex-wrap: wrap; white-space: normal; row-gap: 0; column-gap: 28px; font-size: clamp(32px, 5vw, 56px); }
          .w3vel-group[aria-hidden], .w3vel-r, .w3vel-toggle { display: none; }
        }
      `}</style>
      <div className="sticky top-0 z-10 flex items-center justify-between bg-[#1c1d1f]/95 px-5 py-3">
        <p className={`w3vel-hint text-xs font-medium uppercase tracking-[0.2em] text-[#a8a6a0] ${scrolled ? "opacity-0" : ""}`}>Scroll inside</p>
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
          className="w3vel-toggle inline-flex h-10 items-center rounded-full border border-[#4a4c50] px-4 text-sm font-medium hover:bg-[#2a2b2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ecebe7]"
        >
          {paused ? "Play words" : "Pause words"}
        </button>
      </div>
      <div className="mx-auto max-w-4xl px-5 pb-12 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c9a46a]">Arden and Pell Architects</p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Small buildings made from a short list of honest materials.</h2>
      </div>
      <div className="w3vel-view space-y-2" aria-hidden="true">
        <Track dir="l" />
        <Track dir="r" />
      </div>
      <div className="mx-auto max-w-4xl space-y-6 px-5 py-14 text-base leading-relaxed text-[#c4c2bc]">
        <p>We design houses, studios and small public rooms. Most of our work uses oak and larch frames, limestone bases, lime plaster walls and reclaimed brick, chosen so a building ages well and can be repaired by a local trade.</p>
        <p>Every project starts with a site visit at two times of day, because daylight decides where we put the windows before anything else is drawn.</p>
        <p>We take on a few commissions a year so each one keeps the same two partners from first sketch to handover.</p>
        <p>Recent work includes a timber reading room for a village library, a pair of limestone holiday cottages and a brick workshop behind a terrace house.</p>
        <p>Write to the studio with a rough budget and a photo of the site, and we will reply with whether we are the right fit.</p>
      </div>
    </section>
  );
}
