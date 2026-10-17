import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";

// Same styles as the plain HTML version; the comment at the top names the values to change.
const STYLES = `
  /* Change these: page colour, curtain colour, text on the curtain, accent, curtain speed. */
  .w7cur { --w7cur-paper: #f4ece2; --w7cur-curtain: #9a4426; --w7cur-cream: #fbf3ea; --w7cur-ink: #2b1d16; --w7cur-speed: .6s; }
  .w7cur { position: relative; height: 600px; overflow: hidden; background: var(--w7cur-paper); color: var(--w7cur-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .w7cur *, .w7cur *::before, .w7cur *::after { box-sizing: border-box; }
  .w7cur-bar { position: absolute; z-index: 30; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 14px clamp(16px, 4vw, 48px); }
  .w7cur-brand { margin: 0; font-family: ui-serif, Georgia, "Times New Roman", serif; font-size: 20px; letter-spacing: .01em; }
  .w7cur-btn { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 18px; border: 1px solid currentColor; border-radius: 999px; background: transparent; color: inherit; font: inherit; font-size: 14px; font-weight: 600; line-height: 1; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
  .w7cur-icon { position: relative; width: 18px; height: 10px; }
  .w7cur-icon i { position: absolute; left: 0; right: 0; height: 2px; background: currentColor; transition: transform .35s ease; }
  .w7cur-icon i:first-child { top: 0; } .w7cur-icon i:last-child { bottom: 0; }
  .w7cur-open .w7cur-icon i:first-child { transform: translateY(4px) rotate(45deg); }
  .w7cur-open .w7cur-icon i:last-child { transform: translateY(-4px) rotate(-45deg); }
  .w7cur-open .w7cur-bar { color: var(--w7cur-cream); }
  .w7cur a:focus-visible, .w7cur-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
  .w7cur-page { display: grid; gap: 24px; height: 100%; padding: 84px clamp(16px, 4vw, 48px) 28px; align-content: center; }
  .w7cur-eye { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: #8a3a1f; }
  .w7cur-title { margin: 12px 0 0; max-width: 14ch; font: 400 clamp(32px, 5vw, 56px)/1.05 ui-serif, Georgia, "Times New Roman", serif; letter-spacing: -.01em; }
  .w7cur-text { margin: 16px 0 0; max-width: 34ch; font-size: 16px; line-height: 1.6; color: #5b4537; }
  .w7cur-cta { display: inline-flex; align-items: center; min-height: 44px; margin-top: 22px; padding: 0 22px; border-radius: 999px; background: var(--w7cur-curtain); color: var(--w7cur-cream); font-size: 15px; font-weight: 600; text-decoration: none; }
  .w7cur-pic { overflow: hidden; border-radius: 6px; aspect-ratio: 16 / 9; box-shadow: 0 24px 50px -28px rgba(60, 30, 15, .55); }
  .w7cur-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
  @media (min-width: 760px) { .w7cur-page { grid-template-columns: 1fr 1.05fr; align-items: center; gap: 48px; } .w7cur-pic { aspect-ratio: 4 / 5; max-height: 440px; } }
  @media (max-width: 759px) { .w7cur-text { display: none; } .w7cur-pic { max-height: 170px; } }

  /* The curtain: a full-size layer that drops from above with transform only. */
  .w7cur-menu { position: absolute; z-index: 20; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 92px clamp(16px, 4vw, 48px) 32px; background: var(--w7cur-curtain); color: var(--w7cur-cream);
    visibility: hidden; transform: translateY(-100%); transition: transform calc(var(--w7cur-speed) * .8) cubic-bezier(.7, 0, .3, 1), visibility 0s calc(var(--w7cur-speed) * .8); }
  .w7cur-menu::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 10px; background: linear-gradient(rgba(0, 0, 0, .18), transparent); transform: translateY(100%); }
  .w7cur-open .w7cur-menu { visibility: visible; transform: none; transition: transform var(--w7cur-speed) cubic-bezier(.7, 0, .2, 1), visibility 0s; }
  .w7cur-nav ul { margin: 0; padding: 0; list-style: none; }
  .w7cur-nav a { display: block; overflow: hidden; padding: 2px 4px; margin-left: -4px; color: inherit; text-decoration: none; font: 400 clamp(34px, 6.4vw, 64px)/1.12 ui-serif, Georgia, "Times New Roman", serif; letter-spacing: -.01em; }
  .w7cur-nav a span { display: inline-block; transform: translateY(110%); transition: transform .25s ease-in; }
  .w7cur-open .w7cur-nav a span { transform: none; transition: transform .45s cubic-bezier(.2, .8, .2, 1) calc(var(--w7cur-speed) * .4 + var(--i) * .04s); }
  .w7cur-nav a[aria-current="page"] span::before { content: ""; display: inline-block; width: .3em; height: .3em; margin: 0 .3em .18em 0; border-radius: 50%; background: #f0b892; }
  @media (hover: hover) { .w7cur-nav a:hover span { font-style: italic; } }
  .w7cur-side { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 32px; border-top: 1px solid rgba(251, 243, 234, .35); padding-top: 16px; font-size: 14px; line-height: 1.55; opacity: 0; transition: opacity .2s; }
  .w7cur-open .w7cur-side { opacity: 1; transition: opacity .3s ease calc(var(--w7cur-speed) * .9); }
  .w7cur-side p { margin: 0; } .w7cur-side a { display: inline-flex; align-items: center; min-height: 40px; color: inherit; }
  @media (prefers-reduced-motion: reduce) {
    .w7cur-menu, .w7cur-open .w7cur-menu, .w7cur-nav a span, .w7cur-side, .w7cur-icon i { transition: none !important; }
  }
`; // end STYLES

// When the demo opens the menu by itself (ms). Set 0 on a real site.
const AUTO_OPEN = 500;
const LINKS = ["Home", "Dinner menu", "Wine list", "Private room", "Find us"];

export default function TerracottaCurtainMenu() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const used = useRef(false);
  const focusNext = useRef<"menu" | "button" | null>(null);

  useEffect(() => {
    if (!AUTO_OPEN) return;
    const t = window.setTimeout(() => { if (!used.current) setOpen(true); }, AUTO_OPEN);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    menuRef.current?.toggleAttribute("inert", !open);
    pageRef.current?.toggleAttribute("inert", open); // on a real page, make main and footer inert instead
    const target = focusNext.current;
    focusNext.current = null;
    if (target === "button") btnRef.current?.focus();
    if (target === "menu") menuRef.current?.querySelector<HTMLElement>("a")?.focus();
  }, [open]);

  const set = (next: boolean) => { used.current = true; focusNext.current = next ? "menu" : "button"; setOpen(next); };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); set(false); return; }
    if (e.key !== "Tab" || !btnRef.current || !menuRef.current) return;
    // focus trap: the button plus everything in the menu
    const f = [btnRef.current, ...Array.from(menuRef.current.querySelectorAll<HTMLElement>("a[href], button"))];
    const i = f.indexOf(document.activeElement as HTMLElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  };

  const choose = (e: MouseEvent<HTMLAnchorElement>, i?: number) => {
    e.preventDefault(); // remove on a real site so the link navigates
    if (i !== undefined) setCurrent(i);
    set(false);
  };

  return (
    <div
      ref={rootRef}
      className={`w7cur${open ? " w7cur-open" : ""}`}
      onKeyDown={onKeyDown}
      onPointerDown={() => { used.current = true; }}
      onFocus={() => { used.current = true; }}
    >
      <style>{STYLES}</style>
      <header className="w7cur-bar">
        <p className="w7cur-brand">Osteria Calce</p>
        <button ref={btnRef} className="w7cur-btn" type="button" aria-expanded={open} aria-controls="w7cur-menu" onClick={() => set(!open)}>
          <span className="w7cur-word">{open ? "Close" : "Menu"}</span>
          <span className="w7cur-icon" aria-hidden="true"><i /><i /></span>
        </button>
      </header>
      <div ref={pageRef} className="w7cur-page">
        <div className="w7cur-copy">
          <p className="w7cur-eye">Trattoria in the old bakery</p>
          <h2 className="w7cur-title">Pasta rolled by hand every morning.</h2>
          <p className="w7cur-text">Forty seats, one wood oven and a short list that follows the market. Lunch from noon, dinner until the last plate.</p>
          <a className="w7cur-cta" href="#">Book a table</a>
        </div>
        <div className="w7cur-pic">
          <img
            src="https://images.pexels.com/photos/3184191/pexels-photo-3184191.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="A long wooden table seen from above, set with plates of pasta, bread and salads"
            width={1200}
            height={801}
            loading="lazy"
          />
        </div>
      </div>
      <div ref={menuRef} className="w7cur-menu" id="w7cur-menu">
        <nav className="w7cur-nav" aria-label="Main">
          <ul>
            {LINKS.map((label, i) => (
              <li key={label} style={{ "--i": i } as CSSProperties}>
                <a href="#" aria-current={current === i ? "page" : undefined} onClick={(e) => choose(e, i)}><span>{label}</span></a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="w7cur-side">
          <p>Via del Forno 14<br />Open Tuesday to Sunday</p>
          <p><a href="#" onClick={(e) => choose(e)}>Call the restaurant</a></p>
        </div>
      </div>
    </div>
  );
}
