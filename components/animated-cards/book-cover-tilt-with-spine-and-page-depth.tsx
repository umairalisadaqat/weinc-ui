import { useEffect, useRef } from "react";

const MAX_TILT = 13; // degrees the book turns at the edge of its cover
const BASE_TURN = 24; // resting turn so the spine shows
const EASE = 0.08; // how quickly the book follows (0.05 slow, 0.15 snappy)

const css = `
  .w4bkc { --w4bkc-paper: #efe6d6; --w4bkc-cover: #24433d; --w4bkc-ink: #2a2520; --w4bkc-cream: #f3ead8; --w4bkc-thick: 36px;
    background: var(--w4bkc-paper); color: var(--w4bkc-ink); padding: 72px 20px; font-family: ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
  .w4bkc-wrap { max-width: 60rem; margin: 0 auto; display: grid; gap: 56px; align-items: center; }
  @media (min-width: 768px) { .w4bkc-wrap { grid-template-columns: 1fr 1fr; } }
  .w4bkc-stage { position: relative; display: flex; justify-content: center; padding: 10px 0 34px; perspective: 1100px; touch-action: pan-y; }
  .w4bkc-floor { position: absolute; left: 50%; bottom: 14px; width: 260px; height: 34px; margin-left: -130px; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(60, 40, 20, .32), rgba(60, 40, 20, 0)); }
  .w4bkc-book { position: relative; display: block; width: 236px; height: 340px; transform-style: preserve-3d; transform: rotateY(24deg);
    color: inherit; text-decoration: none; outline: none; will-change: transform; }
  .w4bkc-ring { position: absolute; inset: -10px; border: 3px solid #24433d; border-radius: 10px; opacity: 0; transform: translateZ(calc(var(--w4bkc-thick) / 2 + 12px)); pointer-events: none; }
  .w4bkc-book:focus-visible .w4bkc-ring { opacity: 1; }
  .w4bkc-cover, .w4bkc-back { position: absolute; inset: 0; border-radius: 2px 6px 6px 2px; }
  .w4bkc-cover { transform: translateZ(calc(var(--w4bkc-thick) / 2)); overflow: hidden; background: var(--w4bkc-cover); color: var(--w4bkc-cream);
    box-shadow: inset 6px 0 10px -4px rgba(0, 0, 0, .45); }
  .w4bkc-back { transform: translateZ(calc(var(--w4bkc-thick) / -2)); background: #1b322d; box-shadow: 18px 26px 40px -10px rgba(50, 30, 10, .45); }
  .w4bkc-spine { position: absolute; left: 0; top: 0; width: var(--w4bkc-thick); height: 100%; transform-origin: left center;
    transform: translateZ(calc(var(--w4bkc-thick) / -2)) rotateY(-90deg); background: linear-gradient(90deg, #1a302b, #2c5049 45%, #1d3631);
    display: flex; align-items: center; justify-content: center; }
  .w4bkc-spine span { writing-mode: vertical-rl; transform: rotate(180deg); font-family: Georgia, serif; font-size: 12px; letter-spacing: .14em; color: var(--w4bkc-cream); white-space: nowrap; }
  .w4bkc-pages { position: absolute; right: 0; top: 3px; width: calc(var(--w4bkc-thick) - 4px); height: calc(100% - 6px); transform-origin: right center;
    transform: translateZ(calc(var(--w4bkc-thick) / -2 + 2px)) rotateY(90deg); background: repeating-linear-gradient(90deg, #f6f0e2 0 2px, #ddd2bd 2px 3px); }
  .w4bkc-face { position: absolute; inset: 14px; border: 1px solid rgba(243, 234, 216, .45); display: flex; flex-direction: column; padding: 22px 18px 58px; }
  .w4bkc-series { font-size: 10px; letter-spacing: .28em; text-transform: uppercase; opacity: .8; }
  .w4bkc-name { margin-top: 18px; font-family: Georgia, "Times New Roman", serif; font-size: 34px; line-height: 1.02; }
  .w4bkc-art { margin-top: auto; width: 100%; height: 76px; }
  .w4bkc-author { margin-top: 10px; font-size: 11px; letter-spacing: .24em; text-transform: uppercase; }
  .w4bkc-hl { position: absolute; inset: -60%; pointer-events: none; opacity: .2;
    background: radial-gradient(circle at 50% 50%, rgba(255, 248, 230, .5), rgba(255, 248, 230, 0) 38%); }
  .w4bkc-band { position: absolute; left: -2px; right: -4px; bottom: 30px; height: 40px; transform: translateZ(calc(var(--w4bkc-thick) / 2 + 9px));
    background: #c9733f; color: #fff7ec; display: flex; align-items: center; justify-content: center; font-size: 11px; letter-spacing: .2em; text-transform: uppercase;
    box-shadow: 0 10px 14px -8px rgba(0, 0, 0, .5); }
  .w4bkc-kicker { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .24em; text-transform: uppercase; color: #6b5a44; }
  .w4bkc-title { margin: 14px 0 0; font-family: Georgia, "Times New Roman", serif; font-size: clamp(32px, 4.4vw, 46px); font-weight: 400; line-height: 1.08; }
  .w4bkc-copy { margin: 18px 0 0; max-width: 27rem; font-size: 16px; line-height: 1.65; color: #4a4034; }
  .w4bkc-facts { margin: 22px 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px 22px; font-size: 14px; color: #4a4034; }
  .w4bkc-facts b { color: var(--w4bkc-ink); font-weight: 600; }
  .w4bkc-cta { display: inline-flex; align-items: center; min-height: 46px; margin-top: 28px; padding: 0 22px; border-radius: 999px; background: var(--w4bkc-ink);
    color: var(--w4bkc-paper); font-size: 15px; font-weight: 600; text-decoration: none; }
  .w4bkc-cta:hover { background: #24433d; }
  .w4bkc-cta:focus-visible { outline: 3px solid #24433d; outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) { .w4bkc-book { transform: rotateX(-4deg) rotateY(26deg) !important; will-change: auto; } .w4bkc-hl { transform: translate(-12%, -16%) !important; } }
`;

export default function BookCoverTiltWithSpineAndPageDepth() {
  const root = useRef<HTMLElement>(null);
  const book = useRef<HTMLAnchorElement>(null);
  const hl = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current, card = book.current, light = hl.current;
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
      // idle demo: a slow sway until a real pointer, finger or focus arrives
      if (idle) { tx = Math.sin(now / 2300) * 0.7; ty = Math.sin(now / 1700 + 1) * 0.45; }
      x += (tx - x) * EASE; y += (ty - y) * EASE;
      card.style.transform = `rotateX(${(-y * MAX_TILT).toFixed(2)}deg) rotateY(${(BASE_TURN + x * MAX_TILT).toFixed(2)}deg)`;
      light.style.transform = `translate(${(x * 22).toFixed(1)}%, ${(y * 22).toFixed(1)}%)`;
      light.style.opacity = (0.18 + 0.6 * Math.min(1, Math.hypot(x, y))).toFixed(3);
      if (idle || Math.abs(tx - x) + Math.abs(ty - y) > 0.002) go();
    };
    const onMove = (e: PointerEvent) => { if (e.pointerType === "mouse" || e.buttons) aim(e); };
    const onDown = (e: PointerEvent) => { clearTimeout(timer); aim(e); };
    const onUp = (e: PointerEvent) => { if (e.pointerType !== "mouse") timer = window.setTimeout(flat, 700); };
    const onLeave = (e: PointerEvent) => { if (e.pointerType === "mouse") flat(); };
    const onFocus = () => { idle = false; tx = 0.5; ty = -0.4; go(); };
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
    <section ref={root} className="w4bkc">
      <style>{css}</style>
      <div className="w4bkc-wrap">
        <div className="w4bkc-stage">
          <span className="w4bkc-floor" aria-hidden="true" />
          <a ref={book} href="#" className="w4bkc-book" aria-label="The Salt Marsh Year by Edie Calloway, view the book">
            <span className="w4bkc-back" aria-hidden="true" />
            <span className="w4bkc-spine" aria-hidden="true"><span>The Salt Marsh Year · Calloway</span></span>
            <span className="w4bkc-pages" aria-hidden="true" />
            <span className="w4bkc-cover" aria-hidden="true">
              <span className="w4bkc-face">
                <span className="w4bkc-series">Fernhill Press</span>
                <span className="w4bkc-name">The Salt Marsh Year</span>
                <svg className="w4bkc-art" viewBox="0 0 180 92" fill="none" stroke="#f3ead8" strokeWidth="1.2" strokeLinecap="round">
                  <circle cx="132" cy="30" r="16" />
                  <path d="M0 78 Q45 70 90 78 T180 76" />
                  <path d="M0 88 Q45 82 90 88 T180 86" opacity=".6" />
                  <path d="M22 78 L18 44 M28 78 L30 50 M34 78 L40 40 M150 76 L146 52 M156 76 L160 46" />
                </svg>
                <span className="w4bkc-author">Edie Calloway</span>
              </span>
              <span ref={hl} className="w4bkc-hl" />
            </span>
            <span className="w4bkc-band" aria-hidden="true">A year of tides and weather</span>
            <span className="w4bkc-ring" aria-hidden="true" />
          </a>
        </div>
        <div>
          <p className="w4bkc-kicker">Fernhill Press · Autumn list</p>
          <h2 className="w4bkc-title">The Salt Marsh Year</h2>
          <p className="w4bkc-copy">Edie Calloway walked the same mile of estuary every morning for twelve months and wrote down the birds, the mud and the light. This is that notebook, set in type.</p>
          <ul className="w4bkc-facts">
            <li><b>Hardback</b>, cloth spine</li>
            <li><b>312</b> pages</li>
            <li><b>£18</b></li>
          </ul>
          <a href="#" className="w4bkc-cta">Read the first chapter</a>
        </div>
      </div>
    </section>
  );
}
