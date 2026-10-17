import { useEffect, useRef, type CSSProperties } from "react";

// Same styles as the plain HTML version; the comment at the top names the values to change.
const STYLES = `
  /* Change these: page paper, overlay ink, text on the ink, rule and number accent, row stagger. */
  .w7num { --w7num-bg: #f5f2ec; --w7num-ink: #1b1915; --w7num-dark: #171512; --w7num-paper: #f1ece2; --w7num-acc: #c9a46a; --w7num-step: .04s; --w7num-out: .4s; }
  .w7num { position: relative; height: 600px; overflow: hidden; background: var(--w7num-bg); color: var(--w7num-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .w7num *, .w7num *::before, .w7num *::after { box-sizing: border-box; }
  .w7num-bar { position: absolute; z-index: 30; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 14px clamp(16px, 4vw, 48px); pointer-events: none; }
  .w7num-bar > * { pointer-events: auto; }
  .w7num-brand { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: .01em; }
  .w7num-btn { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 18px; border: 1px solid currentColor; border-radius: 999px; background: transparent; color: inherit; font: inherit; font-size: 14px; font-weight: 600; line-height: 1; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
  .w7num-icon { position: relative; width: 18px; height: 10px; }
  .w7num-icon i { position: absolute; left: 0; right: 0; height: 2px; background: currentColor; transition: transform .35s ease; }
  .w7num-icon i:first-child { top: 0; } .w7num-icon i:last-child { bottom: 0; }
  .w7num-open .w7num-icon i:first-child { transform: translateY(4px) rotate(45deg); }
  .w7num-open .w7num-icon i:last-child { transform: translateY(-4px) rotate(-45deg); }
  .w7num a:focus-visible, .w7num-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
  .w7num-menu { visibility: hidden; transition: visibility 0s var(--w7num-out, .5s); }
  .w7num-open .w7num-menu { visibility: visible; transition: visibility 0s; }
  .w7num-nav ul { margin: 0; padding: 0; list-style: none; }
  .w7num-nav a { color: inherit; text-decoration: none; }

  .w7num-brand { font-family: ui-serif, Georgia, "Times New Roman", serif; font-weight: 400; font-size: 19px; }
  .w7num-page { display: grid; align-items: center; gap: 32px; height: 100%; padding: 84px clamp(16px, 4vw, 48px) 32px; }
  @media (min-width: 760px) { .w7num-page { grid-template-columns: 1.2fr 1fr; } }
  .w7num-eye { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: #6f5a38; }
  .w7num-title { margin: 14px 0 0; max-width: 13ch; font: 400 clamp(34px, 5.4vw, 66px)/1 ui-serif, Georgia, "Times New Roman", serif; letter-spacing: -.02em; }
  .w7num-text { margin: 18px 0 0; max-width: 40ch; font-size: 16px; line-height: 1.6; color: #575148; }
  .w7num-books { display: flex; align-items: flex-end; gap: 6px; height: 260px; justify-self: center; }
  .w7num-books i { width: 34px; border-radius: 2px 2px 0 0; box-shadow: inset -6px 0 0 rgba(0, 0, 0, .12); }
  .w7num-books i:nth-child(1) { height: 78%; background: #5b3a29; } .w7num-books i:nth-child(2) { height: 92%; background: #23384a; } .w7num-books i:nth-child(3) { height: 70%; background: #8a6a3b; }
  .w7num-books i:nth-child(4) { height: 100%; background: #2f3f30; } .w7num-books i:nth-child(5) { height: 84%; background: #6d2f2a; } .w7num-books i:nth-child(6) { height: 64%; width: 26px; background: #b7a27c; }
  @media (max-width: 759px) { .w7num-books { display: none; } }
  .w7num-open .w7num-bar { color: var(--w7num-paper); }
  .w7num-menu { position: absolute; z-index: 20; inset: 0; display: flex; align-items: center; padding: 84px clamp(16px, 4vw, 48px) 32px; background: var(--w7num-dark); color: var(--w7num-paper);
    opacity: 0; transition: opacity var(--w7num-out) ease, visibility 0s var(--w7num-out); }
  .w7num-open .w7num-menu { opacity: 1; transition: opacity .35s ease, visibility 0s; }
  .w7num-nav { width: 100%; }
  .w7num-nav li { position: relative; }
  /* Each row's rule draws from the left with scaleX, then its words lift out of a mask. */
  .w7num-nav li::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: #4a443b; transform: scaleX(0); transform-origin: left; transition: transform .2s; }
  .w7num-open .w7num-nav li::before { transform: none; transition: transform .5s cubic-bezier(.6, 0, .2, 1) calc(.1s + var(--i) * var(--w7num-step)); }
  .w7num-nav a { display: flex; align-items: baseline; gap: clamp(14px, 3vw, 40px); min-height: 52px; overflow: hidden; padding: 8px 0; }
  .w7num-nav small, .w7num-nav span { display: inline-block; transform: translateY(110%); transition: transform .2s; }
  .w7num-open .w7num-nav small, .w7num-open .w7num-nav span { transform: none; transition: transform .45s cubic-bezier(.2, .8, .2, 1) calc(.25s + var(--i) * var(--w7num-step)); }
  .w7num-nav small { width: 2.2em; font: 500 13px/1 ui-monospace, Menlo, monospace; color: var(--w7num-acc); }
  .w7num-nav span { font: 400 clamp(28px, 5vw, 58px)/1.05 ui-serif, Georgia, "Times New Roman", serif; }
  .w7num-nav a::after { content: ""; position: absolute; left: calc(2.2em + clamp(14px, 3vw, 40px)); right: 0; bottom: 6px; height: 2px; background: var(--w7num-acc); transform: scaleX(0); transform-origin: left; transition: transform .4s cubic-bezier(.2, .8, .2, 1); }
  .w7num-nav a:focus-visible::after, .w7num-nav a[aria-current="page"]::after { transform: scaleX(.18); }
  @media (hover: hover) { .w7num-nav a:hover::after { transform: scaleX(.18); } }
  @media (prefers-reduced-motion: reduce) { .w7num-menu, .w7num-open .w7num-menu, .w7num-nav li::before, .w7num-nav small, .w7num-nav span, .w7num-nav a::after, .w7num-icon i { transition: none !important; } }
`; // end STYLES

// When the demo opens the menu by itself (ms). Set 0 on a real site.
const AUTO_OPEN = 500;

export default function InkNumberedRowsMenu() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const btn = root.querySelector<HTMLButtonElement>(".w7num-btn")!, word = root.querySelector<HTMLElement>(".w7num-word")!;
    const menu = root.querySelector<HTMLElement>(".w7num-menu")!, page = root.querySelector<HTMLElement>(".w7num-page")!;
    let used = false;
    const isOpen = () => root.classList.contains("w7num-open");
    const set = (open: boolean, moveFocus: boolean) => {
      root.classList.toggle("w7num-open", open);
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
    <div ref={ref} className="w7num">
      <style>{STYLES}</style>
      <header className="w7num-bar">
        <p className="w7num-brand">Hollis &amp; Reed Bindery</p>
        <button className="w7num-btn" type="button" aria-expanded="false" aria-controls="w7num-menu">
          <span className="w7num-word">Menu</span><span className="w7num-icon" aria-hidden="true"><i></i><i></i></span>
        </button>
      </header>
      <div className="w7num-page">
        <div className="w7num-copy">
          <p className="w7num-eye">Hand bookbinding and repair</p>
          <h2 className="w7num-title">Old books, sewn back together.</h2>
          <p className="w7num-text">We rebind family bibles, recipe notebooks and thesis copies in cloth or leather, by hand, at a bench in a converted dairy.</p>
        </div>
        <div className="w7num-books" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      </div>
      <div className="w7num-menu" id="w7num-menu">
        <nav className="w7num-nav" aria-label="Main">
          <ul>
            <li style={{ "--i": 0 } as CSSProperties}><a href="#" aria-current="page"><small>01</small><span>Home</span></a></li>
            <li style={{ "--i": 1 } as CSSProperties}><a href="#"><small>02</small><span>Repairs</span></a></li>
            <li style={{ "--i": 2 } as CSSProperties}><a href="#"><small>03</small><span>New bindings</span></a></li>
            <li style={{ "--i": 3 } as CSSProperties}><a href="#"><small>04</small><span>Workshops</span></a></li>
            <li style={{ "--i": 4 } as CSSProperties}><a href="#"><small>05</small><span>Get a quote</span></a></li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
