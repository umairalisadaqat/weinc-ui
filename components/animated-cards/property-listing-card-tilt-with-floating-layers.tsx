import { useEffect, useRef } from "react";

const MAX_TILT = 9; // degrees at the card's edge
const EASE = 0.09; // how quickly the card follows the pointer
const PHOTO = "https://images.pexels.com/photos/32029072/pexels-photo-32029072.jpeg?auto=compress&cs=tinysrgb&w=1000";

const specs = [
  { label: "2 bedrooms", d: "M3 17V9h14v8M3 13h14M6 9V6h8v3" },
  { label: "1 bathroom", d: "M3 11h14v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-2ZM5 11V5a2 2 0 0 1 3-1" },
  { label: "Tiled patio", d: "M3 3h14v14H3zM3 10h14M10 3v14" },
];

const css = `
  .w4prl { --w4prl-bg: #eef1f4; --w4prl-ink: #1c2530; --w4prl-muted: #4f5b69; --w4prl-accent: #2f6b4f;
    background: var(--w4prl-bg); color: var(--w4prl-ink); padding: 72px 20px; font-family: ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
  .w4prl-wrap { max-width: 62rem; margin: 0 auto; display: grid; gap: 48px; align-items: center; }
  @media (min-width: 820px) { .w4prl-wrap { grid-template-columns: 1fr 1.05fr; } }
  .w4prl-kicker { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: var(--w4prl-accent); }
  .w4prl-title { margin: 14px 0 0; font-size: clamp(28px, 3.8vw, 40px); font-weight: 650; line-height: 1.12; letter-spacing: -.02em; }
  .w4prl-copy { margin: 16px 0 0; max-width: 26rem; font-size: 16px; line-height: 1.65; color: var(--w4prl-muted); }
  .w4prl-stage { display: flex; justify-content: center; perspective: 1000px; touch-action: pan-y; padding: 8px 0 16px; }
  .w4prl-card { position: relative; display: block; width: 100%; max-width: 380px; padding: 14px 14px 20px; box-sizing: border-box; color: inherit; text-decoration: none;
    transform-style: preserve-3d; will-change: transform; outline: none; }
  .w4prl-base { position: absolute; inset: 0; border-radius: 22px; background: #fff; box-shadow: 0 1px 2px rgba(20, 30, 40, .08), 0 24px 50px -24px rgba(20, 30, 40, .35); }
  .w4prl-card:focus-visible .w4prl-base { outline: 3px solid var(--w4prl-accent); outline-offset: 5px; }
  .w4prl-photo { position: relative; display: block; aspect-ratio: 4 / 3; border-radius: 14px; overflow: hidden; background: #c9b98e; transform: translateZ(26px);
    box-shadow: 0 14px 26px -16px rgba(20, 30, 40, .55); }
  .w4prl-photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .w4prl-hl { position: absolute; inset: -60%; opacity: .15; pointer-events: none; background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, .55), rgba(255, 255, 255, 0) 36%); }
  .w4prl-price { position: absolute; left: 26px; top: 26px; padding: 8px 14px; border-radius: 999px; background: var(--w4prl-ink); color: #fff; font-size: 15px; font-weight: 650;
    transform: translateZ(60px); box-shadow: 0 10px 20px -8px rgba(10, 20, 30, .6); }
  .w4prl-price small { font-weight: 500; opacity: .8; }
  .w4prl-tag { position: absolute; right: 26px; top: 28px; padding: 6px 11px; border-radius: 999px; background: #fff; color: var(--w4prl-accent); font-size: 12px; font-weight: 650;
    transform: translateZ(44px); box-shadow: 0 8px 16px -8px rgba(10, 20, 30, .45); }
  .w4prl-info { position: relative; display: block; padding: 18px 6px 0; transform: translateZ(34px); }
  .w4prl-addr { display: block; font-size: 19px; font-weight: 650; letter-spacing: -.01em; }
  .w4prl-area { display: block; margin-top: 3px; font-size: 14px; color: var(--w4prl-muted); }
  .w4prl-specs { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 14px; padding-top: 14px; border-top: 1px solid #e3e7ec; font-size: 13.5px; color: #34404d; }
  .w4prl-specs span { display: inline-flex; align-items: center; gap: 6px; }
  .w4prl-specs svg { width: 18px; height: 18px; fill: none; stroke: var(--w4prl-accent); stroke-width: 1.6; stroke-linejoin: round; }
  .w4prl-cta { display: inline-flex; align-items: center; min-height: 46px; margin-top: 26px; padding: 0 22px; border-radius: 12px; background: var(--w4prl-accent); color: #fff;
    font-size: 15px; font-weight: 600; text-decoration: none; }
  .w4prl-cta:hover { background: #245540; }
  .w4prl-cta:focus-visible { outline: 3px solid var(--w4prl-ink); outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) { .w4prl-card { transform: rotateX(5deg) rotateY(-7deg) !important; will-change: auto; } .w4prl-hl { transform: translate(-14%, -18%) !important; opacity: .35 !important; } }
`;

export default function PropertyListingCardTiltWithFloatingLayers() {
  const root = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const hl = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current, card = cardRef.current, light = hl.current;
    if (!el || !card || !light) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, idle = true, frame = 0, visible = true, timer = 0;
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const go = () => { if (!frame && visible) frame = requestAnimationFrame(tick); };
    const aim = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1);
      ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1);
      idle = false; go();
    };
    const flat = () => { tx = 0; ty = 0; go(); };
    const tick = (now: number) => {
      frame = 0;
      // idle demo: a slow drift around the corners until real input arrives
      if (idle) { tx = Math.cos(now / 2600) * 0.75; ty = Math.sin(now / 1900) * 0.6; }
      x += (tx - x) * EASE; y += (ty - y) * EASE;
      card.style.transform = `rotateX(${(-y * MAX_TILT).toFixed(2)}deg) rotateY(${(x * MAX_TILT).toFixed(2)}deg)`;
      light.style.transform = `translate(${(x * 24).toFixed(1)}%, ${(y * 24).toFixed(1)}%)`;
      light.style.opacity = (0.12 + 0.55 * Math.min(1, Math.hypot(x, y))).toFixed(3);
      if (idle || Math.abs(tx - x) + Math.abs(ty - y) > 0.002) go();
    };
    const onMove = (e: PointerEvent) => { if (e.pointerType === "mouse" || e.buttons) aim(e); };
    const onDown = (e: PointerEvent) => { clearTimeout(timer); aim(e); };
    const onUp = (e: PointerEvent) => { if (e.pointerType !== "mouse") timer = window.setTimeout(flat, 700); };
    const onLeave = (e: PointerEvent) => { if (e.pointerType === "mouse") flat(); };
    const onFocus = () => { idle = false; tx = -0.55; ty = -0.45; go(); };
    const pairs: [EventTarget, string, EventListener][] = [
      [el, "pointermove", onMove as EventListener], [el, "pointerdown", onDown as EventListener], [el, "pointerup", onUp as EventListener],
      [el, "pointerleave", onLeave as EventListener], [el, "pointercancel", flat], [card, "focus", onFocus], [card, "blur", flat],
    ];
    pairs.forEach(([t, n, f]) => t.addEventListener(n, f));
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) go(); else { cancelAnimationFrame(frame); frame = 0; }
    });
    io.observe(el);
    go();
    return () => {
      cancelAnimationFrame(frame); clearTimeout(timer); io.disconnect();
      pairs.forEach(([t, n, f]) => t.removeEventListener(n, f));
    };
  }, []);

  return (
    <section ref={root} className="w4prl">
      <style>{css}</style>
      <div className="w4prl-wrap">
        <div>
          <p className="w4prl-kicker">Larkfield Lettings</p>
          <h2 className="w4prl-title">A yellow brick bungalow with green shutters, two streets from the beach.</h2>
          <p className="w4prl-copy">Single storey, south facing, with a tiled patio out front and a quiet lane behind. Unfurnished, pets considered.</p>
          <a href="#" className="w4prl-cta">Book a viewing</a>
        </div>
        <div className="w4prl-stage">
          <a ref={cardRef} href="#" className="w4prl-card" aria-label="7 Quayside Lane, Seacombe, two bedroom bungalow to let at 1,450 pounds a month, view listing">
            <span className="w4prl-base" aria-hidden="true" />
            <span className="w4prl-photo" aria-hidden="true">
              <img src={PHOTO} alt="Yellow brick bungalow with green shutters and a tiled patio" width={1000} height={667} loading="lazy" />
              <span ref={hl} className="w4prl-hl" />
            </span>
            <span className="w4prl-price" aria-hidden="true">£1,450 <small>pcm</small></span>
            <span className="w4prl-tag" aria-hidden="true">From 1 Dec</span>
            <span className="w4prl-info" aria-hidden="true">
              <span className="w4prl-addr">7 Quayside Lane</span>
              <span className="w4prl-area">Seacombe, bungalow</span>
              <span className="w4prl-specs">
                {specs.map((s) => (
                  <span key={s.label}><svg viewBox="0 0 20 20"><path d={s.d} /></svg>{s.label}</span>
                ))}
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
