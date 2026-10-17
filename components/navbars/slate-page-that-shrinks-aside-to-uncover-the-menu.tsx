import { useEffect, useRef, type CSSProperties } from "react";

// Same styles as the plain HTML version; the comment at the top names the values to change.
const STYLES = `
  /* Change these: menu colour under the page, ink, accent, how far the page moves, how small it gets. */
  .w7psh { --w7psh-bg: #dfe5ec; --w7psh-ink: #17212c; --w7psh-card: #ffffff; --w7psh-acc: #2d6fb3; --w7psh-shift: -58%; --w7psh-shrink: .86; --w7psh-out: .55s; }
  .w7psh { position: relative; height: 600px; overflow: hidden; background: var(--w7psh-bg); color: var(--w7psh-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .w7psh *, .w7psh *::before, .w7psh *::after { box-sizing: border-box; }
  .w7psh-bar { position: absolute; z-index: 30; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 14px clamp(16px, 4vw, 48px); pointer-events: none; }
  .w7psh-bar > * { pointer-events: auto; }
  .w7psh-brand { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: .01em; }
  .w7psh-btn { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 18px; border: 1px solid currentColor; border-radius: 999px; background: transparent; color: inherit; font: inherit; font-size: 14px; font-weight: 600; line-height: 1; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
  .w7psh-icon { position: relative; width: 18px; height: 10px; }
  .w7psh-icon i { position: absolute; left: 0; right: 0; height: 2px; background: currentColor; transition: transform .35s ease; }
  .w7psh-icon i:first-child { top: 0; } .w7psh-icon i:last-child { bottom: 0; }
  .w7psh-open .w7psh-icon i:first-child { transform: translateY(4px) rotate(45deg); }
  .w7psh-open .w7psh-icon i:last-child { transform: translateY(-4px) rotate(-45deg); }
  .w7psh a:focus-visible, .w7psh-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
  .w7psh-menu { visibility: hidden; transition: visibility 0s var(--w7psh-out, .5s); }
  .w7psh-open .w7psh-menu { visibility: visible; transition: visibility 0s; }
  .w7psh-nav ul { margin: 0; padding: 0; list-style: none; }
  .w7psh-nav a { color: inherit; text-decoration: none; }

  .w7psh-page { position: absolute; z-index: 10; inset: 0; display: grid; align-items: center; gap: 24px; padding: 84px clamp(16px, 4vw, 48px) 32px; background: var(--w7psh-card);
    transform-origin: 50% 50%; transition: transform var(--w7psh-out) cubic-bezier(.7, 0, .3, 1); }
  .w7psh-page::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: 0 40px 80px -30px rgba(15, 25, 40, .45); opacity: 0; transition: opacity .4s; pointer-events: none; }
  .w7psh-open .w7psh-page { transform: translateX(var(--w7psh-shift)) scale(var(--w7psh-shrink)); border-radius: 14px; transition: transform .7s cubic-bezier(.7, 0, .2, 1); }
  .w7psh-open .w7psh-page::after { opacity: 1; }
  @media (min-width: 760px) { .w7psh-page { grid-template-columns: 1fr 1fr; } }
  .w7psh-eye { margin: 0; font-size: 13px; font-weight: 600; color: var(--w7psh-acc); }
  .w7psh-title { margin: 12px 0 0; max-width: 16ch; font-size: clamp(28px, 4.4vw, 50px); font-weight: 700; line-height: 1.05; letter-spacing: -.03em; }
  .w7psh-cta { display: inline-flex; align-items: center; min-height: 44px; margin-top: 22px; padding: 0 22px; border-radius: 8px; background: var(--w7psh-ink); color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; }
  .w7psh-pic { overflow: hidden; border-radius: 10px; aspect-ratio: 4 / 3; }
  .w7psh-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
  @media (max-width: 759px) { .w7psh-pic { max-height: 180px; } }
  .w7psh-bar { z-index: 30; }
  .w7psh-btn { background: var(--w7psh-card); }
  .w7psh-menu { position: absolute; z-index: 1; inset: 0; display: flex; flex-direction: column; justify-content: center; padding: 84px clamp(16px, 4vw, 48px) 32px 46%; }
  @media (max-width: 759px) { .w7psh-menu { padding-left: 34%; } .w7psh { --w7psh-shift: -74%; } }
  .w7psh-nav a { display: inline-flex; align-items: center; min-height: 46px; font-size: clamp(24px, 3.8vw, 44px); font-weight: 700; letter-spacing: -.03em; }
  .w7psh-nav li { transform: translateX(40px); opacity: 0; transition: transform .2s, opacity .2s; }
  .w7psh-open .w7psh-nav li { transform: none; opacity: 1; transition: transform .6s cubic-bezier(.2, .8, .2, 1), opacity .4s; transition-duration: .4s; transition-delay: calc(.2s + var(--i) * .04s); }
  .w7psh-nav a[aria-current="page"] { color: var(--w7psh-acc); }
  @media (hover: hover) { .w7psh-nav a:hover { color: var(--w7psh-acc); } }
  .w7psh-note { margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #3d4a58; opacity: 0; transition: opacity .2s; }
  .w7psh-open .w7psh-note { opacity: 1; transition: opacity .3s .5s; }
  .w7psh-note a { display: inline-flex; align-items: center; min-height: 40px; color: var(--w7psh-acc); font-weight: 600; }
  @media (prefers-reduced-motion: reduce) { .w7psh-page, .w7psh-open .w7psh-page, .w7psh-page::after, .w7psh-nav li, .w7psh-note, .w7psh-icon i { transition: none !important; } }
`; // end STYLES

// When the demo opens the menu by itself (ms). Set 0 on a real site.
const AUTO_OPEN = 500;

export default function SlatePagePushAsideMenu() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const btn = root.querySelector<HTMLButtonElement>(".w7psh-btn")!, word = root.querySelector<HTMLElement>(".w7psh-word")!;
    const menu = root.querySelector<HTMLElement>(".w7psh-menu")!, page = root.querySelector<HTMLElement>(".w7psh-page")!;
    let used = false;
    const isOpen = () => root.classList.contains("w7psh-open");
    const set = (open: boolean, moveFocus: boolean) => {
      root.classList.toggle("w7psh-open", open);
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
    <div ref={ref} className="w7psh">
      <style>{STYLES}</style>
      <header className="w7psh-bar">
        <p className="w7psh-brand">Northbank Cycle Works</p>
        <button className="w7psh-btn" type="button" aria-expanded="false" aria-controls="w7psh-menu">
          <span className="w7psh-word">Menu</span><span className="w7psh-icon" aria-hidden="true"><i></i><i></i></span>
        </button>
      </header>
      <div className="w7psh-menu" id="w7psh-menu">
        <nav className="w7psh-nav" aria-label="Main">
          <ul>
            <li style={{ "--i": 0 } as CSSProperties}><a href="#" aria-current="page"><span>Home</span></a></li>
            <li style={{ "--i": 1 } as CSSProperties}><a href="#"><span>Servicing</span></a></li>
            <li style={{ "--i": 2 } as CSSProperties}><a href="#"><span>Wheel builds</span></a></li>
            <li style={{ "--i": 3 } as CSSProperties}><a href="#"><span>Bike fitting</span></a></li>
            <li style={{ "--i": 4 } as CSSProperties}><a href="#"><span>Book a slot</span></a></li>
          </ul>
        </nav>
        <p className="w7psh-note">Workshop open Tuesday to Saturday.<br /><a href="#">Ask about a repair</a></p>
      </div>
      <div className="w7psh-page">
        <div className="w7psh-copy">
          <p className="w7psh-eye">Repairs, servicing and wheel builds</p>
          <h2 className="w7psh-title">Bring it in on Monday, ride it home on Wednesday.</h2>
          <a className="w7psh-cta" href="#">Book a service</a>
        </div>
        <div className="w7psh-pic"><img src="https://images.pexels.com/photos/34185192/pexels-photo-34185192.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Two mechanics in blue overalls working on a bicycle in a workshop" width="1200" height="833" loading="lazy" /></div>
      </div>
    </div>
  );
}
