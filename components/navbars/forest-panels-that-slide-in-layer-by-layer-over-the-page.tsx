import { useEffect, useRef, type CSSProperties } from "react";

// Same styles as the plain HTML version; the comment at the top names the values to change.
const STYLES = `
  /* Change these: page colour, the three panel greens, text colour, stagger between panels. */
  .w7pnl { --w7pnl-bg: #eef1ea; --w7pnl-ink: #1d2a20; --w7pnl-g1: #8fa98a; --w7pnl-g2: #4f6f52; --w7pnl-g3: #1f3a28; --w7pnl-cream: #f1f4ec; --w7pnl-step: .09s; --w7pnl-out: .7s; }
  .w7pnl { position: relative; height: 600px; overflow: hidden; background: var(--w7pnl-bg); color: var(--w7pnl-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .w7pnl *, .w7pnl *::before, .w7pnl *::after { box-sizing: border-box; }
  .w7pnl-bar { position: absolute; z-index: 30; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 14px clamp(16px, 4vw, 48px); pointer-events: none; }
  .w7pnl-bar > * { pointer-events: auto; }
  .w7pnl-brand { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: .01em; }
  .w7pnl-btn { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 18px; border: 1px solid currentColor; border-radius: 999px; background: transparent; color: inherit; font: inherit; font-size: 14px; font-weight: 600; line-height: 1; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
  .w7pnl-icon { position: relative; width: 18px; height: 10px; }
  .w7pnl-icon i { position: absolute; left: 0; right: 0; height: 2px; background: currentColor; transition: transform .35s ease; }
  .w7pnl-icon i:first-child { top: 0; } .w7pnl-icon i:last-child { bottom: 0; }
  .w7pnl-open .w7pnl-icon i:first-child { transform: translateY(4px) rotate(45deg); }
  .w7pnl-open .w7pnl-icon i:last-child { transform: translateY(-4px) rotate(-45deg); }
  .w7pnl a:focus-visible, .w7pnl-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
  .w7pnl-menu { visibility: hidden; transition: visibility 0s var(--w7pnl-out, .5s); }
  .w7pnl-open .w7pnl-menu { visibility: visible; transition: visibility 0s; }
  .w7pnl-nav ul { margin: 0; padding: 0; list-style: none; }
  .w7pnl-nav a { color: inherit; text-decoration: none; }

  .w7pnl-page { display: grid; height: 100%; }
  .w7pnl-copy { align-self: center; padding: 84px clamp(16px, 4vw, 48px) 24px; }
  .w7pnl-eye { margin: 0; font-size: 13px; font-weight: 600; color: #3d5a41; }
  .w7pnl-title { margin: 12px 0 0; max-width: 15ch; font-size: clamp(30px, 4.6vw, 52px); font-weight: 600; line-height: 1.06; letter-spacing: -.025em; }
  .w7pnl-text { margin: 16px 0 0; max-width: 36ch; font-size: 16px; line-height: 1.6; color: #44544a; }
  .w7pnl-cta { display: inline-flex; align-items: center; min-height: 44px; margin-top: 22px; padding: 0 20px; border-radius: 8px; background: var(--w7pnl-g3); color: var(--w7pnl-cream); font-size: 15px; font-weight: 600; text-decoration: none; }
  .w7pnl-pic { display: none; overflow: hidden; }
  .w7pnl-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
  @media (min-width: 760px) { .w7pnl-page { grid-template-columns: 1fr 1fr; } .w7pnl-pic { display: block; } }
  .w7pnl-open .w7pnl-bar { color: var(--w7pnl-cream); }
  .w7pnl-menu { position: absolute; z-index: 20; inset: 0; color: var(--w7pnl-cream); }
  /* Three full-size panels: each slides in from the right a moment after the last. */
  .w7pnl-sl { position: absolute; inset: 0; transform: translateX(101%); transition: transform .45s cubic-bezier(.7, 0, .3, 1) calc((2 - var(--n)) * var(--w7pnl-step)); }
  .w7pnl-s1 { --n: 0; background: var(--w7pnl-g1); } .w7pnl-s2 { --n: 1; background: var(--w7pnl-g2); } .w7pnl-s3 { --n: 2; background: var(--w7pnl-g3); }
  .w7pnl-open .w7pnl-sl { transform: none; transition: transform .6s cubic-bezier(.7, 0, .2, 1) calc(var(--n) * var(--w7pnl-step)); }
  .w7pnl-in { position: relative; display: grid; gap: 24px; align-content: center; height: 100%; padding: 84px clamp(16px, 4vw, 48px) 24px; }
  @media (min-width: 760px) { .w7pnl-in { grid-template-columns: 1.6fr 1fr; align-items: end; padding-bottom: 56px; } }
  .w7pnl-nav li { border-top: 1px solid rgba(241, 244, 236, .2); }
  .w7pnl-nav a { display: flex; align-items: center; min-height: 52px; overflow: hidden; font-size: clamp(24px, 3.6vw, 40px); font-weight: 600; letter-spacing: -.02em; }
  .w7pnl-nav a span { display: inline-block; transform: translateX(-24px); opacity: 0; transition: transform .2s, opacity .2s; }
  .w7pnl-open .w7pnl-nav a span { transform: none; opacity: 1; transition: transform .55s cubic-bezier(.2, .8, .2, 1), opacity .4s; transition-duration: .4s; transition-delay: calc(.3s + var(--i) * .04s); }
  .w7pnl-nav a[aria-current="page"] { color: #b9d3a8; }
  @media (hover: hover) { .w7pnl-nav a:hover span { transform: translateX(10px); } }
  .w7pnl-side { font-size: 14px; line-height: 1.5; opacity: 0; transition: opacity .2s; }
  .w7pnl-open .w7pnl-side { opacity: 1; transition: opacity .3s .5s; }
  .w7pnl-side p { margin: 0 0 4px; } .w7pnl-k { margin-top: 12px !important; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: #b9d3a8; }
  .w7pnl-side a { display: inline-flex; align-items: center; min-height: 40px; margin-top: 8px; color: inherit; }
  @media (max-width: 759px) { .w7pnl-side { display: none; } }
  @media (prefers-reduced-motion: reduce) { .w7pnl-sl, .w7pnl-nav a span, .w7pnl-side, .w7pnl-icon i { transition: none !important; } }
`; // end STYLES

// When the demo opens the menu by itself (ms). Set 0 on a real site.
const AUTO_OPEN = 500;

export default function ForestLayeredPanelMenu() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const btn = root.querySelector<HTMLButtonElement>(".w7pnl-btn")!, word = root.querySelector<HTMLElement>(".w7pnl-word")!;
    const menu = root.querySelector<HTMLElement>(".w7pnl-menu")!, page = root.querySelector<HTMLElement>(".w7pnl-page")!;
    let used = false;
    const isOpen = () => root.classList.contains("w7pnl-open");
    const set = (open: boolean, moveFocus: boolean) => {
      root.classList.toggle("w7pnl-open", open);
      btn.setAttribute("aria-expanded", String(open));
      word.textContent = open ? "Close" : "Menu";
      menu.toggleAttribute("inert", !open);
      page.toggleAttribute("inert", open); // on a real page, make main and footer inert instead
      if (moveFocus) (open ? menu.querySelector<HTMLElement>("a")! : btn).focus();
    };
    menu.toggleAttribute("inert", true);
    const touch = () => { used = true; };
    const onClick = () => { touch(); set(!isOpen(), true); };
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen()) return;
      if (e.key === "Escape") { e.preventDefault(); set(false, true); return; }
      if (e.key !== "Tab") return;
      // focus trap: the button plus everything in the menu
      const f: HTMLElement[] = [btn, ...Array.from(menu.querySelectorAll<HTMLElement>("a[href], button"))];
      const i = f.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    };
    const onPick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      e.preventDefault(); // remove on a real site so the link navigates
      if (a.closest("nav")) { menu.querySelectorAll("[aria-current]").forEach((x) => x.removeAttribute("aria-current")); a.setAttribute("aria-current", "page"); }
      set(false, true);
    };
    btn.addEventListener("click", onClick);
    root.addEventListener("pointerdown", touch);
    root.addEventListener("focusin", touch);
    root.addEventListener("keydown", onKey);
    menu.addEventListener("click", onPick);
    const t = AUTO_OPEN ? window.setTimeout(() => { if (!used) set(true, false); }, AUTO_OPEN) : 0;
    return () => {
      window.clearTimeout(t);
      btn.removeEventListener("click", onClick);
      root.removeEventListener("pointerdown", touch);
      root.removeEventListener("focusin", touch);
      root.removeEventListener("keydown", onKey);
      menu.removeEventListener("click", onPick);
    };
  }, []);

  return (
    <div ref={ref} className="w7pnl">
      <style>{STYLES}</style>
      <header className="w7pnl-bar">
        <p className="w7pnl-brand">Fernhill Nursery</p>
        <button className="w7pnl-btn" type="button" aria-expanded="false" aria-controls="w7pnl-menu">
          <span className="w7pnl-word">Menu</span><span className="w7pnl-icon" aria-hidden="true"><i></i><i></i></span>
        </button>
      </header>
      <div className="w7pnl-page">
        <div className="w7pnl-copy">
          <p className="w7pnl-eye">Plant nursery and glasshouse</p>
          <h2 className="w7pnl-title">Seedlings, shrubs and slow-grown hedging.</h2>
          <p className="w7pnl-text">Grown outdoors on the hill so they arrive used to wind and frost. Open for collection on Fridays and Saturdays.</p>
          <a className="w7pnl-cta" href="#">See what is ready now</a>
        </div>
        <div className="w7pnl-pic"><img src="https://images.pexels.com/photos/6508425/pexels-photo-6508425.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Rows of potted plants on long benches inside a glasshouse with hanging baskets above" width="1200" height="800" loading="lazy" /></div>
      </div>
      <div className="w7pnl-menu" id="w7pnl-menu">
        <span className="w7pnl-sl w7pnl-s1" aria-hidden="true"></span><span className="w7pnl-sl w7pnl-s2" aria-hidden="true"></span><span className="w7pnl-sl w7pnl-s3" aria-hidden="true"></span>
        <div className="w7pnl-in">
          <nav className="w7pnl-nav" aria-label="Main">
            <ul>
            <li style={{ "--i": 0 } as CSSProperties}><a href="#" aria-current="page"><span>Home</span></a></li>
            <li style={{ "--i": 1 } as CSSProperties}><a href="#"><span>Plants in stock</span></a></li>
            <li style={{ "--i": 2 } as CSSProperties}><a href="#"><span>Hedging by the metre</span></a></li>
            <li style={{ "--i": 3 } as CSSProperties}><a href="#"><span>Growing notes</span></a></li>
            <li style={{ "--i": 4 } as CSSProperties}><a href="#"><span>Visit the nursery</span></a></li>
            </ul>
          </nav>
          <div className="w7pnl-side">
            <p className="w7pnl-k">Collection days</p>
            <p>Friday and Saturday, 9 until 4</p>
            <p className="w7pnl-k">Find us</p>
            <p>Top Lane, Fernhill</p>
            <a href="#">Order by email</a>
          </div>
        </div>
      </div>
    </div>
  );
}
