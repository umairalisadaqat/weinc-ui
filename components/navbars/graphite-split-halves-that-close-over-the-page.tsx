import { useEffect, useRef, type CSSProperties } from "react";

// Same styles as the plain HTML version; the comment at the top names the values to change.
const STYLES = `
  /* Change these: page colour, upper half, lower half, text colour, accent, slide time. */
  .w7spl { --w7spl-bg: #e9e7e3; --w7spl-ink: #1f2023; --w7spl-up: #26272b; --w7spl-low: #34363b; --w7spl-pale: #ecebe8; --w7spl-acc: #d4c3a3; --w7spl-speed: .6s; --w7spl-out: .5s; }
  .w7spl { position: relative; height: 600px; overflow: hidden; background: var(--w7spl-bg); color: var(--w7spl-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .w7spl *, .w7spl *::before, .w7spl *::after { box-sizing: border-box; }
  .w7spl-bar { position: absolute; z-index: 30; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 14px clamp(16px, 4vw, 48px); pointer-events: none; }
  .w7spl-bar > * { pointer-events: auto; }
  .w7spl-brand { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: .01em; }
  .w7spl-btn { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 18px; border: 1px solid currentColor; border-radius: 999px; background: transparent; color: inherit; font: inherit; font-size: 14px; font-weight: 600; line-height: 1; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
  .w7spl-icon { position: relative; width: 18px; height: 10px; }
  .w7spl-icon i { position: absolute; left: 0; right: 0; height: 2px; background: currentColor; transition: transform .35s ease; }
  .w7spl-icon i:first-child { top: 0; } .w7spl-icon i:last-child { bottom: 0; }
  .w7spl-open .w7spl-icon i:first-child { transform: translateY(4px) rotate(45deg); }
  .w7spl-open .w7spl-icon i:last-child { transform: translateY(-4px) rotate(-45deg); }
  .w7spl a:focus-visible, .w7spl-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
  .w7spl-menu { visibility: hidden; transition: visibility 0s var(--w7spl-out, .5s); }
  .w7spl-open .w7spl-menu { visibility: visible; transition: visibility 0s; }
  .w7spl-nav ul { margin: 0; padding: 0; list-style: none; }
  .w7spl-nav a { color: inherit; text-decoration: none; }

  .w7spl-page { display: flex; flex-direction: column; justify-content: center; height: 100%; padding: 84px clamp(16px, 4vw, 48px) 32px; }
  .w7spl-eye { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: #5c5a55; }
  .w7spl-title { margin: 14px 0 0; max-width: 18ch; font-size: clamp(30px, 5vw, 60px); font-weight: 500; line-height: 1.04; letter-spacing: -.035em; }
  .w7spl-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; max-width: 560px; margin-top: 28px; }
  .w7spl-grid i { height: 64px; border: 1px solid #b9b5ad; background: linear-gradient(135deg, transparent 49.5%, #c9c5bd 50%, transparent 50.5%); }
  .w7spl-text { margin: 24px 0 0; max-width: 46ch; font-size: 15px; line-height: 1.6; color: #4b4a46; }
  .w7spl-open .w7spl-bar { color: var(--w7spl-pale); }
  .w7spl-menu { position: absolute; z-index: 20; inset: 0; color: var(--w7spl-pale); }
  /* Two halves: the upper one comes down, the lower one comes up, and they meet at the middle line. */
  .w7spl-half { position: absolute; left: 0; right: 0; height: 50%; display: flex; padding: 0 clamp(16px, 4vw, 48px); transition: transform var(--w7spl-out) cubic-bezier(.7, 0, .3, 1); }
  .w7spl-top { top: 0; align-items: flex-end; padding-bottom: 20px; background: var(--w7spl-up); transform: translateY(-100%); }
  .w7spl-bot { bottom: 0; align-items: flex-start; padding-top: 22px; background: var(--w7spl-low); transform: translateY(100%); }
  .w7spl-open .w7spl-half { transform: none; transition: transform var(--w7spl-speed) cubic-bezier(.7, 0, .2, 1); }
  .w7spl-nav ul { display: flex; flex-wrap: wrap; gap: 0 clamp(16px, 3.5vw, 48px); }
  .w7spl-nav li { overflow: hidden; }
  .w7spl-nav a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 2px; font-size: clamp(30px, 6vw, 72px); font-weight: 500; letter-spacing: -.04em; line-height: 1.1; }
  .w7spl-nav a span { display: inline-block; transform: translateY(105%); transition: transform .2s; }
  .w7spl-open .w7spl-nav a span { transform: none; transition: transform .4s cubic-bezier(.2, .8, .2, 1) calc(var(--w7spl-speed) * .5 + var(--i) * .04s); }
  .w7spl-nav a[aria-current="page"] { color: var(--w7spl-acc); }
  @media (hover: hover) { .w7spl-nav a:hover { color: var(--w7spl-acc); } }
  .w7spl-info { display: flex; flex-wrap: wrap; gap: 12px 48px; font-size: 15px; line-height: 1.5; opacity: 0; transform: translateY(-10px); transition: opacity .2s, transform .2s; }
  .w7spl-open .w7spl-info { opacity: 1; transform: none; transition: opacity .3s, transform .3s; transition-delay: calc(var(--w7spl-speed) * .8); }
  .w7spl-info p { margin: 0; } .w7spl-k { display: block; margin-bottom: 4px; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: #b3b0a9; }
  .w7spl-info a { display: inline-flex; align-items: center; min-height: 40px; color: inherit; }
  @media (max-width: 600px) { .w7spl-nav ul { flex-direction: column; } .w7spl-nav a { min-height: 40px; } }
  @media (prefers-reduced-motion: reduce) { .w7spl-half, .w7spl-nav a span, .w7spl-info, .w7spl-icon i { transition: none !important; } }
`; // end STYLES

// When the demo opens the menu by itself (ms). Set 0 on a real site.
const AUTO_OPEN = 500;

export default function GraphiteSplitHalvesMenu() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const btn = root.querySelector<HTMLButtonElement>(".w7spl-btn")!, word = root.querySelector<HTMLElement>(".w7spl-word")!;
    const menu = root.querySelector<HTMLElement>(".w7spl-menu")!, page = root.querySelector<HTMLElement>(".w7spl-page")!;
    let used = false;
    const isOpen = () => root.classList.contains("w7spl-open");
    const set = (open: boolean, moveFocus: boolean) => {
      root.classList.toggle("w7spl-open", open);
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
    <div ref={ref} className="w7spl">
      <style>{STYLES}</style>
      <header className="w7spl-bar">
        <p className="w7spl-brand">Okafor Lane Architects</p>
        <button className="w7spl-btn" type="button" aria-expanded="false" aria-controls="w7spl-menu">
          <span className="w7spl-word">Menu</span><span className="w7spl-icon" aria-hidden="true"><i></i><i></i></span>
        </button>
      </header>
      <div className="w7spl-page">
        <p className="w7spl-eye">Architecture and interiors</p>
        <h2 className="w7spl-title">Buildings that keep their shape for a long time.</h2>
        <div className="w7spl-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <p className="w7spl-text">A practice of nine working on homes, small schools and workshop conversions, mostly within a day's drive of the studio.</p>
      </div>
      <div className="w7spl-menu" id="w7spl-menu">
        <div className="w7spl-half w7spl-top">
          <nav className="w7spl-nav" aria-label="Main">
            <ul>
            <li style={{ "--i": 0 } as CSSProperties}><a href="#" aria-current="page"><span>Projects</span></a></li>
            <li style={{ "--i": 1 } as CSSProperties}><a href="#"><span>Practice</span></a></li>
            <li style={{ "--i": 2 } as CSSProperties}><a href="#"><span>Journal</span></a></li>
            <li style={{ "--i": 3 } as CSSProperties}><a href="#"><span>Contact</span></a></li>
            </ul>
          </nav>
        </div>
        <div className="w7spl-half w7spl-bot">
          <div className="w7spl-info">
            <p><span className="w7spl-k">Studio</span>4 Tanner Yard, second floor</p>
            <p><span className="w7spl-k">New work</span><a href="#">Send us a brief</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
