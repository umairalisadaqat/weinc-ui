import { useEffect, useRef, type CSSProperties } from "react";

// Same styles as the plain HTML version; the comment at the top names the values to change.
const STYLES = `
  /* Change these: sand page colour, clay slat colour, text on the slats, accent, delay between slats. */
  .w7bld { --w7bld-bg: #ece2d2; --w7bld-ink: #2e221a; --w7bld-clay: #6b4632; --w7bld-cream: #f6eee3; --w7bld-acc: #e7b48d; --w7bld-step: .05s; --w7bld-out: .55s; }
  .w7bld { position: relative; height: 600px; overflow: hidden; background: var(--w7bld-bg); color: var(--w7bld-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .w7bld *, .w7bld *::before, .w7bld *::after { box-sizing: border-box; }
  .w7bld-bar { position: absolute; z-index: 30; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 14px clamp(16px, 4vw, 48px); pointer-events: none; }
  .w7bld-bar > * { pointer-events: auto; }
  .w7bld-brand { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: .01em; }
  .w7bld-btn { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 18px; border: 1px solid currentColor; border-radius: 999px; background: transparent; color: inherit; font: inherit; font-size: 14px; font-weight: 600; line-height: 1; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
  .w7bld-icon { position: relative; width: 18px; height: 10px; }
  .w7bld-icon i { position: absolute; left: 0; right: 0; height: 2px; background: currentColor; transition: transform .35s ease; }
  .w7bld-icon i:first-child { top: 0; } .w7bld-icon i:last-child { bottom: 0; }
  .w7bld-open .w7bld-icon i:first-child { transform: translateY(4px) rotate(45deg); }
  .w7bld-open .w7bld-icon i:last-child { transform: translateY(-4px) rotate(-45deg); }
  .w7bld a:focus-visible, .w7bld-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
  .w7bld-menu { visibility: hidden; transition: visibility 0s var(--w7bld-out, .5s); }
  .w7bld-open .w7bld-menu { visibility: visible; transition: visibility 0s; }
  .w7bld-nav ul { margin: 0; padding: 0; list-style: none; }
  .w7bld-nav a { color: inherit; text-decoration: none; }

  .w7bld-page { display: grid; align-items: center; gap: 24px; height: 100%; padding: 84px clamp(16px, 4vw, 48px) 32px; }
  @media (min-width: 760px) { .w7bld-page { grid-template-columns: 1fr 1.1fr; } .w7bld-copy { order: 2; } }
  .w7bld-eye { margin: 0; font-size: 13px; font-weight: 600; color: #7a4f36; }
  .w7bld-title { margin: 12px 0 0; max-width: 14ch; font-size: clamp(30px, 4.8vw, 54px); font-weight: 600; line-height: 1.05; letter-spacing: -.03em; }
  .w7bld-cta { display: inline-flex; align-items: center; min-height: 44px; margin-top: 22px; padding: 0 22px; border-radius: 999px; background: var(--w7bld-clay); color: var(--w7bld-cream); font-size: 15px; font-weight: 600; text-decoration: none; }
  .w7bld-pots { display: flex; align-items: flex-end; justify-content: center; gap: 18px; height: 300px; }
  .w7bld-pots i { display: block; background: radial-gradient(circle at 35% 30%, #e3d3bd, #b99c7c 60%, #8f7258); box-shadow: 0 26px 30px -22px rgba(60, 35, 20, .7); }
  .w7bld-pots i:nth-child(1) { width: 110px; height: 150px; border-radius: 40% 40% 30% 30% / 30% 30% 20% 20%; }
  .w7bld-pots i:nth-child(2) { width: 150px; height: 230px; border-radius: 30% 30% 40% 40% / 20% 20% 30% 30%; background: radial-gradient(circle at 35% 30%, #6e5547, #4a372c 60%, #33251d); }
  .w7bld-pots i:nth-child(3) { width: 130px; height: 80px; border-radius: 10% 10% 50% 50% / 10% 10% 60% 60%; }
  @media (max-width: 759px) { .w7bld-pots { height: 150px; transform: scale(.55); margin: -40px 0; } }
  .w7bld-open .w7bld-bar { color: var(--w7bld-cream); }
  .w7bld-menu { position: absolute; z-index: 20; inset: 0; color: var(--w7bld-cream); }
  /* Six slats, each a sixth of the height, unroll downward one after another with scaleY. */
  .w7bld-slats { position: absolute; inset: 0; display: grid; grid-template-rows: repeat(6, 1fr); }
  .w7bld-slats i { display: block; margin-bottom: -1px; background: var(--w7bld-clay); transform: scaleY(0); transform-origin: top; transition: transform .3s cubic-bezier(.6, 0, .4, 1) calc((5 - var(--i)) * .03s); }
  .w7bld-slats i:nth-child(even) { background: #634130; }
  .w7bld-open .w7bld-slats i { transform: none; transition: transform .45s cubic-bezier(.6, 0, .2, 1) calc(var(--i) * var(--w7bld-step)); }
  .w7bld-in { position: relative; display: flex; flex-direction: column; justify-content: center; height: 100%; padding: 84px clamp(16px, 4vw, 48px) 32px; }
  .w7bld-nav a { display: inline-flex; align-items: center; min-height: 48px; font-size: clamp(28px, 4.8vw, 54px); font-weight: 600; letter-spacing: -.03em; }
  .w7bld-nav li { opacity: 0; transition: opacity .15s; }
  .w7bld-open .w7bld-nav li { opacity: 1; transition: opacity .3s calc(.35s + var(--i) * .04s); }
  .w7bld-nav a span { display: inline-block; transition: transform .3s cubic-bezier(.2, .8, .2, 1); }
  .w7bld-nav a[aria-current="page"] { color: var(--w7bld-acc); }
  @media (hover: hover) { .w7bld-nav a:hover span { transform: translateX(12px); } }
  .w7bld-nav a:focus-visible span { transform: translateX(12px); }
  .w7bld-note { margin: 22px 0 0; font-size: 14px; color: #e6d6c4; opacity: 0; transition: opacity .15s; }
  .w7bld-open .w7bld-note { opacity: 1; transition: opacity .3s .5s; }
  @media (prefers-reduced-motion: reduce) { .w7bld-slats i, .w7bld-nav li, .w7bld-nav a span, .w7bld-note, .w7bld-icon i { transition: none !important; } }
`; // end STYLES

// When the demo opens the menu by itself (ms). Set 0 on a real site.
const AUTO_OPEN = 500;

export default function ClayBlindSlatsMenu() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const btn = root.querySelector<HTMLButtonElement>(".w7bld-btn")!, word = root.querySelector<HTMLElement>(".w7bld-word")!;
    const menu = root.querySelector<HTMLElement>(".w7bld-menu")!, page = root.querySelector<HTMLElement>(".w7bld-page")!;
    let used = false;
    const isOpen = () => root.classList.contains("w7bld-open");
    const set = (open: boolean, moveFocus: boolean) => {
      root.classList.toggle("w7bld-open", open);
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
    <div ref={ref} className="w7bld">
      <style>{STYLES}</style>
      <header className="w7bld-bar">
        <p className="w7bld-brand">Studio Marl</p>
        <button className="w7bld-btn" type="button" aria-expanded="false" aria-controls="w7bld-menu">
          <span className="w7bld-word">Menu</span><span className="w7bld-icon" aria-hidden="true"><i></i><i></i></span>
        </button>
      </header>
      <div className="w7bld-page">
        <div className="w7bld-pots" aria-hidden="true"><i></i><i></i><i></i></div>
        <div className="w7bld-copy">
          <p className="w7bld-eye">Stoneware made in small firings</p>
          <h2 className="w7bld-title">Cups, bowls and jugs for every day.</h2>
          <a className="w7bld-cta" href="#">Shop the latest firing</a>
        </div>
      </div>
      <div className="w7bld-menu" id="w7bld-menu">
        <div className="w7bld-slats" aria-hidden="true"><i style={{ "--i": 0 } as CSSProperties}></i><i style={{ "--i": 1 } as CSSProperties}></i><i style={{ "--i": 2 } as CSSProperties}></i><i style={{ "--i": 3 } as CSSProperties}></i><i style={{ "--i": 4 } as CSSProperties}></i><i style={{ "--i": 5 } as CSSProperties}></i></div>
        <div className="w7bld-in">
          <nav className="w7bld-nav" aria-label="Main">
            <ul>
            <li style={{ "--i": 0 } as CSSProperties}><a href="#" aria-current="page"><span>Shop</span></a></li>
            <li style={{ "--i": 1 } as CSSProperties}><a href="#"><span>Classes</span></a></li>
            <li style={{ "--i": 2 } as CSSProperties}><a href="#"><span>Commissions</span></a></li>
            <li style={{ "--i": 3 } as CSSProperties}><a href="#"><span>About the studio</span></a></li>
            <li style={{ "--i": 4 } as CSSProperties}><a href="#"><span>Visit</span></a></li>
            </ul>
          </nav>
          <p className="w7bld-note">Next open studio: first Saturday of the month.</p>
        </div>
      </div>
    </div>
  );
}
