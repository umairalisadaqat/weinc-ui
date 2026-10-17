import { useEffect, useRef, type CSSProperties } from "react";

// Same styles as the plain HTML version; the comment at the top names the values to change.
const STYLES = `
  /* Change these: page colour, menu colour, ink, accent, how often the demo moves to the next photo. */
  .w7img { --w7img-bg: #f6f1e8; --w7img-ink: #2a241d; --w7img-sheet: #efe6d7; --w7img-acc: #8c5a2b; --w7img-out: .45s; }
  .w7img { position: relative; height: 600px; overflow: hidden; background: var(--w7img-bg); color: var(--w7img-ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .w7img *, .w7img *::before, .w7img *::after { box-sizing: border-box; }
  .w7img-bar { position: absolute; z-index: 30; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 14px clamp(16px, 4vw, 48px); pointer-events: none; }
  .w7img-bar > * { pointer-events: auto; }
  .w7img-brand { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: .01em; }
  .w7img-btn { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 18px; border: 1px solid currentColor; border-radius: 999px; background: transparent; color: inherit; font: inherit; font-size: 14px; font-weight: 600; line-height: 1; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
  .w7img-icon { position: relative; width: 18px; height: 10px; }
  .w7img-icon i { position: absolute; left: 0; right: 0; height: 2px; background: currentColor; transition: transform .35s ease; }
  .w7img-icon i:first-child { top: 0; } .w7img-icon i:last-child { bottom: 0; }
  .w7img-open .w7img-icon i:first-child { transform: translateY(4px) rotate(45deg); }
  .w7img-open .w7img-icon i:last-child { transform: translateY(-4px) rotate(-45deg); }
  .w7img a:focus-visible, .w7img-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
  .w7img-menu { visibility: hidden; transition: visibility 0s var(--w7img-out, .5s); }
  .w7img-open .w7img-menu { visibility: visible; transition: visibility 0s; }
  .w7img-nav ul { margin: 0; padding: 0; list-style: none; }
  .w7img-nav a { color: inherit; text-decoration: none; }

  .w7img-page { display: flex; flex-direction: column; justify-content: center; height: 100%; padding: 84px clamp(16px, 4vw, 48px) 32px; }
  .w7img-brand { font-family: ui-serif, Georgia, "Times New Roman", serif; font-weight: 400; font-size: 19px; }
  .w7img-eye { margin: 0; font-size: 13px; font-style: italic; color: var(--w7img-acc); }
  .w7img-title { margin: 12px 0 0; max-width: 16ch; font: 400 clamp(32px, 5vw, 60px)/1.05 ui-serif, Georgia, "Times New Roman", serif; }
  .w7img-text { margin: 18px 0 0; max-width: 40ch; font-size: 16px; line-height: 1.6; color: #5a4f43; }
  .w7img-cta { align-self: flex-start; display: inline-flex; align-items: center; min-height: 44px; margin-top: 22px; padding: 0 22px; border: 1px solid var(--w7img-ink); border-radius: 2px; color: inherit; font-size: 15px; text-decoration: none; }
  .w7img-menu { position: absolute; z-index: 20; inset: 0; display: grid; align-items: center; gap: 32px; padding: 84px clamp(16px, 4vw, 48px) 32px; background: var(--w7img-sheet);
    opacity: 0; transition: opacity var(--w7img-out) ease, visibility 0s var(--w7img-out); }
  .w7img-open .w7img-menu { opacity: 1; transition: opacity .4s ease, visibility 0s; }
  @media (min-width: 760px) { .w7img-menu { grid-template-columns: 1fr 1fr; } }
  .w7img-nav li { border-bottom: 1px solid #d6c9b4; transform: translateY(18px); opacity: 0; transition: transform .2s, opacity .2s; }
  .w7img-open .w7img-nav li { transform: none; opacity: 1; transition: transform .6s cubic-bezier(.2, .8, .2, 1), opacity .4s; transition-duration: .45s; transition-delay: calc(.1s + var(--i) * .07s); }
  .w7img-nav a { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; min-height: 56px; padding: 10px 0; font: 400 clamp(28px, 4.4vw, 50px)/1.1 ui-serif, Georgia, "Times New Roman", serif; }
  .w7img-nav small { font: 500 12px/1 ui-sans-serif, system-ui, sans-serif; color: #75654f; }
  .w7img-nav a span { transition: transform .35s cubic-bezier(.2, .8, .2, 1); }
  .w7img-nav a[aria-current="page"] small { color: var(--w7img-acc); }
  /* The link whose photo is showing shifts right a little. */
  .w7img[data-show="0"] [data-n="0"] span, .w7img[data-show="1"] [data-n="1"] span, .w7img[data-show="2"] [data-n="2"] span, .w7img[data-show="3"] [data-n="3"] span { transform: translateX(14px); font-style: italic; }
  .w7img-fig { position: relative; overflow: hidden; aspect-ratio: 4 / 3; border-radius: 3px; background: #ddd0bb; box-shadow: 0 30px 60px -36px rgba(60, 40, 20, .6); transform: scale(.96); transition: transform .6s cubic-bezier(.2, .8, .2, 1); }
  .w7img-open .w7img-fig { transform: none; }
  .w7img-ph { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transform: scale(1.06); transition: opacity .5s ease, transform .8s cubic-bezier(.2, .8, .2, 1); }
  .w7img[data-show="0"] .w7img-ph[data-n="0"], .w7img[data-show="1"] .w7img-ph[data-n="1"], .w7img[data-show="2"] .w7img-ph[data-n="2"], .w7img[data-show="3"] .w7img-ph[data-n="3"] { opacity: 1; transform: none; }
  @media (max-width: 759px) { .w7img-fig { display: none; } }
  @media (prefers-reduced-motion: reduce) { .w7img-menu, .w7img-open .w7img-menu, .w7img-nav li, .w7img-nav a span, .w7img-fig, .w7img-ph, .w7img-icon i { transition: none !important; } }
`; // end STYLES

// When the demo opens the menu by itself (ms). Set 0 on a real site.
const AUTO_OPEN = 500;

export default function PaperMenuWithPhotoPreview() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const btn = root.querySelector<HTMLButtonElement>(".w7img-btn")!, word = root.querySelector<HTMLElement>(".w7img-word")!;
    const menu = root.querySelector<HTMLElement>(".w7img-menu")!, page = root.querySelector<HTMLElement>(".w7img-page")!;
    let used = false;
    const isOpen = () => root.classList.contains("w7img-open");
    const set = (open: boolean, moveFocus: boolean) => {
      root.classList.toggle("w7img-open", open);
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
    // ms between photos while the demo runs on its own
    const CYCLE = 2600;
    let shown = 0, seen = true;
    const show = (n: number) => { shown = n; root.setAttribute("data-show", String(n)); };
    show(0);
    const follow = (e: Event) => { const a = (e.target as HTMLElement).closest("[data-n]"); if (a && a.closest("nav")) show(Number(a.getAttribute("data-n"))); };
    menu.addEventListener("pointerover", follow);
    menu.addEventListener("focusin", follow);
    // idle demo: steps through the photos while nobody is using the piece and it is on screen
    const io = new IntersectionObserver((en) => { seen = en[0].isIntersecting; });
    io.observe(root);
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cyc = rm ? 0 : window.setInterval(() => { if (!used && seen && isOpen()) show((shown + 1) % 4); }, CYCLE);
    const t = AUTO_OPEN ? window.setTimeout(() => { if (!used) set(true, false); }, AUTO_OPEN) : 0;
    return () => {
      window.clearTimeout(t);
      window.clearInterval(cyc);
      io.disconnect();
      menu.removeEventListener("pointerover", follow);
      menu.removeEventListener("focusin", follow);
      btn.removeEventListener("click", onClick);
      root.removeEventListener("pointerdown", touch);
      root.removeEventListener("focusin", touch);
      root.removeEventListener("keydown", onKey);
      menu.removeEventListener("click", onPick);
    };
  }, []);

  return (
    <div ref={ref} className="w7img">
      <style>{STYLES}</style>
      <header className="w7img-bar">
        <p className="w7img-brand">The Saltmarsh Rooms</p>
        <button className="w7img-btn" type="button" aria-expanded="false" aria-controls="w7img-menu">
          <span className="w7img-word">Menu</span><span className="w7img-icon" aria-hidden="true"><i></i><i></i></span>
        </button>
      </header>
      <div className="w7img-page">
        <p className="w7img-eye">Six rooms by the estuary</p>
        <h2 className="w7img-title">A quiet house at the end of the lane.</h2>
        <p className="w7img-text">Breakfast in the kitchen, boots by the door, and the coast path ten minutes from the gate.</p>
        <a className="w7img-cta" href="#">Check dates</a>
      </div>
      <div className="w7img-menu" id="w7img-menu">
        <nav className="w7img-nav" aria-label="Main">
          <ul>
            <li style={{ "--i": 0 } as CSSProperties}><a href="#" data-n="0" aria-current="page"><span>Rooms</span><small>01</small></a></li>
            <li style={{ "--i": 1 } as CSSProperties}><a href="#" data-n="1"><span>Breakfast</span><small>02</small></a></li>
            <li style={{ "--i": 2 } as CSSProperties}><a href="#" data-n="2"><span>The terrace</span><small>03</small></a></li>
            <li style={{ "--i": 3 } as CSSProperties}><a href="#" data-n="3"><span>The coast path</span><small>04</small></a></li>
          </ul>
        </nav>
        <div className="w7img-fig" aria-hidden="true">
          <img className="w7img-ph" data-n="0" src="https://images.pexels.com/photos/34636330/pexels-photo-34636330.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Rolled white towels on a made bed with a dark headboard" width="1200" height="800" decoding="async" />
          <img className="w7img-ph" data-n="1" src="https://images.pexels.com/photos/18654566/pexels-photo-18654566.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="A bowl and cup on a wooden table by a chair in warm morning light" width="1200" height="800" decoding="async" />
          <img className="w7img-ph" data-n="2" src="https://images.pexels.com/photos/30280895/pexels-photo-30280895.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Green metal garden chairs on a flagstone terrace against a stone wall" width="1200" height="800" decoding="async" />
          <img className="w7img-ph" data-n="3" src="https://images.pexels.com/photos/6725997/pexels-photo-6725997.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Waves breaking white against dark rocky cliffs under a bright sky" width="1200" height="800" decoding="async" />
        </div>
      </div>
    </div>
  );
}
