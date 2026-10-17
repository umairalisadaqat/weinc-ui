import { useEffect, useRef, type CSSProperties } from "react";

// Same styles as the plain HTML version; the comment at the top names the values to change.
const STYLES = `
  /* Change these: page colour, circle colour, text on the circle, accent, how long the circle takes. */
  .w7cir { --w7cir-bg: #f2f5f8; --w7cir-ink: #10213a; --w7cir-sea: #0f2847; --w7cir-foam: #eef3f8; --w7cir-acc: #f2b25c; --w7cir-speed: .65s; --w7cir-out: .5s; }
  .w7cir { position: relative; height: 600px; overflow: hidden; background: var(--w7cir-bg); color: var(--w7cir-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .w7cir *, .w7cir *::before, .w7cir *::after { box-sizing: border-box; }
  .w7cir-bar { position: absolute; z-index: 30; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 14px clamp(16px, 4vw, 48px); pointer-events: none; }
  .w7cir-bar > * { pointer-events: auto; }
  .w7cir-brand { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: .01em; }
  .w7cir-btn { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 18px; border: 1px solid currentColor; border-radius: 999px; background: transparent; color: inherit; font: inherit; font-size: 14px; font-weight: 600; line-height: 1; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
  .w7cir-icon { position: relative; width: 18px; height: 10px; }
  .w7cir-icon i { position: absolute; left: 0; right: 0; height: 2px; background: currentColor; transition: transform .35s ease; }
  .w7cir-icon i:first-child { top: 0; } .w7cir-icon i:last-child { bottom: 0; }
  .w7cir-open .w7cir-icon i:first-child { transform: translateY(4px) rotate(45deg); }
  .w7cir-open .w7cir-icon i:last-child { transform: translateY(-4px) rotate(-45deg); }
  .w7cir a:focus-visible, .w7cir-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
  .w7cir-menu { visibility: hidden; transition: visibility 0s var(--w7cir-out, .5s); }
  .w7cir-open .w7cir-menu { visibility: visible; transition: visibility 0s; }
  .w7cir-nav ul { margin: 0; padding: 0; list-style: none; }
  .w7cir-nav a { color: inherit; text-decoration: none; }

  .w7cir-page { position: relative; height: 100%; }
  .w7cir-pic { position: absolute; inset: 0; }
  .w7cir-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .w7cir-pic::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(8, 22, 42, .78), rgba(8, 22, 42, .2) 70%); }
  .w7cir-copy { position: relative; display: flex; flex-direction: column; justify-content: flex-end; height: 100%; padding: 84px clamp(16px, 4vw, 48px) 48px; color: var(--w7cir-foam); }
  .w7cir-eye { margin: 0; font-size: 13px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--w7cir-acc); }
  .w7cir-title { margin: 12px 0 0; max-width: 14ch; font-size: clamp(32px, 5vw, 58px); font-weight: 700; line-height: 1.02; letter-spacing: -.03em; }
  .w7cir-cta { align-self: flex-start; display: inline-flex; align-items: center; min-height: 44px; margin-top: 24px; padding: 0 22px; border-radius: 999px; background: var(--w7cir-foam); color: var(--w7cir-sea); font-size: 15px; font-weight: 700; text-decoration: none; }
  .w7cir-bar { color: var(--w7cir-foam); }
  .w7cir-btn { background: rgba(8, 22, 42, .35); }
  .w7cir-menu { position: absolute; z-index: 20; inset: 0; color: var(--w7cir-foam); }
  /* A circle sized to cover the whole box, centred on the button and scaled up from nothing. */
  .w7cir-disc { position: absolute; width: 3400px; height: 3400px; top: calc(36px - 1700px); right: calc(clamp(16px, 4vw, 48px) + 52px - 1700px); border-radius: 50%; background: var(--w7cir-sea);
    transform: scale(0); transition: transform var(--w7cir-out) cubic-bezier(.6, 0, .4, 1); }
  .w7cir-open .w7cir-disc { transform: scale(1); transition: transform var(--w7cir-speed) cubic-bezier(.55, 0, .2, 1); }
  .w7cir-in { position: relative; display: flex; flex-direction: column; justify-content: center; height: 100%; padding: 84px clamp(16px, 4vw, 48px) 32px; text-align: right; }
  .w7cir-nav a { display: inline-flex; align-items: center; min-height: 48px; font-size: clamp(30px, 5vw, 56px); font-weight: 700; letter-spacing: -.03em; }
  .w7cir-nav li { opacity: 0; transform: translate(20px, -12px) scale(.96); transform-origin: right top; transition: opacity .15s, transform .2s; }
  .w7cir-open .w7cir-nav li { opacity: 1; transform: none; transition: opacity .4s, transform .6s cubic-bezier(.2, .8, .2, 1); transition-duration: .4s; transition-delay: calc(var(--w7cir-speed) * .4 + var(--i) * .04s); }
  .w7cir-nav a[aria-current="page"] span { border-bottom: 3px solid var(--w7cir-acc); }
  @media (hover: hover) { .w7cir-nav a:hover { color: var(--w7cir-acc); } }
  .w7cir-note { margin: 20px 0 0; font-size: 14px; color: #b8c6d8; opacity: 0; transition: opacity .2s; }
  .w7cir-open .w7cir-note { opacity: 1; transition: opacity .3s calc(var(--w7cir-speed) * .8); }
  @media (prefers-reduced-motion: reduce) { .w7cir-disc, .w7cir-nav li, .w7cir-note, .w7cir-icon i { transition: none !important; } }
`; // end STYLES

// When the demo opens the menu by itself (ms). Set 0 on a real site.
const AUTO_OPEN = 500;

export default function NavyCircleGrowMenu() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const btn = root.querySelector<HTMLButtonElement>(".w7cir-btn")!, word = root.querySelector<HTMLElement>(".w7cir-word")!;
    const menu = root.querySelector<HTMLElement>(".w7cir-menu")!, page = root.querySelector<HTMLElement>(".w7cir-page")!;
    let used = false;
    const isOpen = () => root.classList.contains("w7cir-open");
    const set = (open: boolean, moveFocus: boolean) => {
      root.classList.toggle("w7cir-open", open);
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
    <div ref={ref} className="w7cir">
      <style>{STYLES}</style>
      <header className="w7cir-bar">
        <p className="w7cir-brand">Harbourline Sailing</p>
        <button className="w7cir-btn" type="button" aria-expanded="false" aria-controls="w7cir-menu">
          <span className="w7cir-word">Menu</span><span className="w7cir-icon" aria-hidden="true"><i></i><i></i></span>
        </button>
      </header>
      <div className="w7cir-page">
        <div className="w7cir-pic"><img src="https://images.pexels.com/photos/15305793/pexels-photo-15305793.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="A single white sailboat far out on deep blue open water" width="1200" height="801" loading="lazy" /></div>
        <div className="w7cir-copy">
          <p className="w7cir-eye">Dinghy and keelboat courses</p>
          <h2 className="w7cir-title">Learn to sail in the shelter of the bay.</h2>
          <a className="w7cir-cta" href="#">See summer courses</a>
        </div>
      </div>
      <div className="w7cir-menu" id="w7cir-menu">
        <span className="w7cir-disc" aria-hidden="true"></span>
        <div className="w7cir-in">
          <nav className="w7cir-nav" aria-label="Main">
            <ul>
            <li style={{ "--i": 0 } as CSSProperties}><a href="#" aria-current="page"><span>Home</span></a></li>
            <li style={{ "--i": 1 } as CSSProperties}><a href="#"><span>Courses</span></a></li>
            <li style={{ "--i": 2 } as CSSProperties}><a href="#"><span>Boats and kit</span></a></li>
            <li style={{ "--i": 3 } as CSSProperties}><a href="#"><span>Tides and weather</span></a></li>
            <li style={{ "--i": 4 } as CSSProperties}><a href="#"><span>Contact the club</span></a></li>
            </ul>
          </nav>
          <p className="w7cir-note">Slipway open from 8 each morning, tide permitting.</p>
        </div>
      </div>
    </div>
  );
}
