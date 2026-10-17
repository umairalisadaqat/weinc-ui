import { useEffect, useRef } from "react";

const MAX_TILT = 11; // degrees at the ticket's edge
const EASE = 0.085; // how quickly the ticket follows

const css = `
  .w4tkt { --w4tkt-bg: #0f1b2d; --w4tkt-paper: #f4efe4; --w4tkt-ink: #14202f; --w4tkt-foil: #c9a45c;
    background: radial-gradient(80% 70% at 50% 20%, #1b2c45, var(--w4tkt-bg) 70%); color: #eef1f6; padding: 64px 18px 72px;
    font-family: ui-sans-serif, system-ui, sans-serif; text-align: center; overflow: hidden; }
  .w4tkt-kicker { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .24em; text-transform: uppercase; color: #d9c08a; }
  .w4tkt-title { margin: 12px 0 0; font-size: clamp(28px, 4vw, 40px); font-weight: 650; letter-spacing: -.02em; line-height: 1.15; }
  .w4tkt-copy { margin: 12px auto 0; max-width: 30rem; font-size: 16px; line-height: 1.6; color: #c3cbd8; }
  .w4tkt-stage { display: flex; justify-content: center; margin-top: 40px; perspective: 1000px; touch-action: pan-y; }
  .w4tkt-card { position: relative; display: grid; grid-template-columns: 1fr 112px; width: 100%; max-width: 540px; min-height: 210px; color: var(--w4tkt-ink);
    text-align: left; text-decoration: none; transform-style: preserve-3d; will-change: transform; outline: none; }
  .w4tkt-base { position: absolute; inset: 0; border-radius: 16px; overflow: hidden; background: var(--w4tkt-paper);
    box-shadow: 0 30px 50px -22px rgba(0, 0, 0, .7); }
  .w4tkt-card:focus-visible .w4tkt-base { outline: 3px solid #f4efe4; outline-offset: 6px; }
  .w4tkt-base::before { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(20, 32, 47, .035) 0 1px, transparent 1px 4px); }
  .w4tkt-perf { position: absolute; top: 14px; bottom: 14px; right: 112px; border-left: 2px dashed rgba(20, 32, 47, .28); }
  .w4tkt-notch { position: absolute; right: 101px; width: 22px; height: 22px; border-radius: 50%; background: #16263e; }
  .w4tkt-notch.t { top: -11px; } .w4tkt-notch.b { bottom: -11px; }
  .w4tkt-hl { position: absolute; inset: -70%; opacity: .15; pointer-events: none; background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, .9), rgba(255, 255, 255, 0) 30%); }
  .w4tkt-main { position: relative; padding: 24px 24px 22px; transform: translateZ(18px); display: flex; flex-direction: column; }
  .w4tkt-venue { font-size: 11px; font-weight: 650; letter-spacing: .22em; text-transform: uppercase; color: #6a5520; }
  .w4tkt-act { margin-top: 10px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(24px, 4.6vw, 32px); line-height: 1.05; padding-right: 64px; }
  .w4tkt-sub { margin-top: 8px; font-size: 14px; color: #3b4859; }
  .w4tkt-when { margin-top: auto; padding-top: 18px; display: flex; flex-wrap: wrap; gap: 4px 20px; font-size: 13px; color: #3b4859; }
  .w4tkt-when b { display: block; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: #6b7685; font-weight: 600; }
  .w4tkt-seal { position: absolute; right: 128px; top: 20px; width: 60px; height: 60px; border-radius: 50%; overflow: hidden; transform: translateZ(46px);
    background: radial-gradient(circle at 35% 30%, #f3dfa8, var(--w4tkt-foil) 45%, #8a6a2c); box-shadow: 0 10px 16px -8px rgba(20, 15, 5, .7);
    display: flex; align-items: center; justify-content: center; }
  .w4tkt-seal svg { position: relative; width: 30px; height: 30px; fill: none; stroke: #4a3711; stroke-width: 1.6; stroke-linecap: round; }
  .w4tkt-shine { position: absolute; inset: -40%; opacity: .5; background: linear-gradient(105deg, transparent 40%, rgba(255, 252, 238, .9) 50%, transparent 60%); }
  .w4tkt-stub { position: relative; padding: 22px 12px; transform: translateZ(26px); display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 10px; }
  .w4tkt-admit { font-size: 10px; font-weight: 650; letter-spacing: .2em; text-transform: uppercase; color: #6b7685; }
  .w4tkt-seat { font-family: ui-monospace, Menlo, monospace; font-size: 28px; font-weight: 600; }
  .w4tkt-bars { width: 72px; height: 34px; background: repeating-linear-gradient(90deg, var(--w4tkt-ink) 0 2px, transparent 2px 4px, var(--w4tkt-ink) 4px 5px, transparent 5px 8px); }
  .w4tkt-cta { display: inline-flex; align-items: center; min-height: 46px; margin-top: 40px; padding: 0 22px; border-radius: 999px; border: 1px solid rgba(244, 239, 228, .5);
    color: #f4efe4; font-size: 15px; font-weight: 600; text-decoration: none; }
  .w4tkt-cta:hover { background: rgba(244, 239, 228, .1); }
  .w4tkt-cta:focus-visible { outline: 3px solid #f4efe4; outline-offset: 3px; }
  @media (max-width: 480px) { .w4tkt-card { grid-template-columns: 1fr 88px; } .w4tkt-perf { right: 88px; } .w4tkt-notch { right: 77px; }
    .w4tkt-seal { right: 98px; width: 48px; height: 48px; } .w4tkt-act { padding-right: 46px; } .w4tkt-main { padding: 20px 16px 18px; } .w4tkt-seat { font-size: 22px; } .w4tkt-bars { width: 56px; } }
  @media (prefers-reduced-motion: reduce) { .w4tkt-card { transform: rotateX(6deg) rotateY(-5deg) !important; will-change: auto; } .w4tkt-hl, .w4tkt-shine { transform: none !important; } }
`;

export default function ConcertTicketTiltWithFoilSealAndStub() {
  const root = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const hl = useRef<HTMLSpanElement>(null);
  const shine = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current, card = cardRef.current, light = hl.current, foil = shine.current;
    if (!el || !card || !light || !foil) return;
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
      // idle demo: a side-to-side rock so the foil seal catches the light
      if (idle) { tx = Math.sin(now / 1900) * 0.8; ty = Math.cos(now / 2700) * 0.4; }
      x += (tx - x) * EASE; y += (ty - y) * EASE;
      card.style.transform = `rotateX(${(-y * MAX_TILT).toFixed(2)}deg) rotateY(${(x * MAX_TILT).toFixed(2)}deg)`;
      light.style.transform = `translate(${(x * 26).toFixed(1)}%, ${(y * 20).toFixed(1)}%)`;
      light.style.opacity = (0.1 + 0.3 * Math.min(1, Math.hypot(x, y))).toFixed(3);
      foil.style.transform = `translateX(${(x * 45).toFixed(1)}%)`;
      if (idle || Math.abs(tx - x) + Math.abs(ty - y) > 0.002) go();
    };
    const onMove = (e: PointerEvent) => { if (e.pointerType === "mouse" || e.buttons) aim(e); };
    const onDown = (e: PointerEvent) => { clearTimeout(timer); aim(e); };
    const onUp = (e: PointerEvent) => { if (e.pointerType !== "mouse") timer = window.setTimeout(flat, 700); };
    const onLeave = (e: PointerEvent) => { if (e.pointerType === "mouse") flat(); };
    const onFocus = () => { idle = false; tx = 0.6; ty = 0.35; go(); };
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
    <section ref={root} className="w4tkt">
      <style>{css}</style>
      <p className="w4tkt-kicker">Harbour Street Hall</p>
      <h2 className="w4tkt-title">See you on Friday, Sam.</h2>
      <p className="w4tkt-copy">Show this at the door on your phone or on paper. Doors open at half past seven and the trio starts at eight.</p>
      <div className="w4tkt-stage">
        <a ref={cardRef} href="#" className="w4tkt-card" aria-label="Ticket: Mira Okafor Trio at Harbour Street Hall, Friday 14 November, doors 19:30, row F seat 12. Open ticket">
          <span className="w4tkt-base" aria-hidden="true">
            <span ref={hl} className="w4tkt-hl" />
            <span className="w4tkt-perf" />
            <span className="w4tkt-notch t" />
            <span className="w4tkt-notch b" />
          </span>
          <span className="w4tkt-main" aria-hidden="true">
            <span className="w4tkt-venue">Harbour Street Hall</span>
            <span className="w4tkt-act">Mira Okafor Trio</span>
            <span className="w4tkt-sub">Two sets, interval at nine</span>
            <span className="w4tkt-when">
              <span><b>Date</b>Fri 14 Nov</span>
              <span><b>Doors</b>19:30</span>
              <span><b>Row</b>F, stalls</span>
            </span>
          </span>
          <span className="w4tkt-seal" aria-hidden="true">
            <span ref={shine} className="w4tkt-shine" />
            <svg viewBox="0 0 24 24"><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></svg>
          </span>
          <span className="w4tkt-stub" aria-hidden="true">
            <span className="w4tkt-admit">Admit one</span>
            <span className="w4tkt-seat">F12</span>
            <span className="w4tkt-bars" />
          </span>
        </a>
      </div>
      <a href="#" className="w4tkt-cta">Download as PDF</a>
    </section>
  );
}
