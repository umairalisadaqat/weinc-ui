import { useEffect, useRef } from "react";

/* Styles shared with the HTML version; class and keyframe names are prefixed so several pieces can share a page. */
const css = `
  /* Change these: page colour, card colour, text, sun and rain colours, and loop speed. */
  .m3wth { --m3wth-bg: #ece4d6; --m3wth-card: #13233a; --m3wth-text: #f3ede2; --m3wth-sunc: #f2b65e; --m3wth-rainc: #9cc6ea; --m3wth-speed: 1; }
  .m3wth { background: var(--m3wth-bg); padding: 64px 16px; font-family: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif; }
  .m3wth-card { max-width: 720px; margin: 0 auto; background: var(--m3wth-card); color: var(--m3wth-text); border-radius: 24px; padding: 32px; box-shadow: 0 2px 4px rgba(19,35,58,.12), 0 30px 60px -30px rgba(19,35,58,.55); }
  .m3wth-now { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding-bottom: 26px; border-bottom: 1px solid rgba(243,237,226,.14); }
  .m3wth-kicker { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #c5cfdc; }
  .m3wth-title { margin: 8px 0 0; font-size: 24px; font-weight: 600; letter-spacing: -.01em; line-height: 1.2; }
  .m3wth-temp { margin: 12px 0 0; font-size: 44px; font-weight: 500; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
  .m3wth-temp span { font-size: 15px; letter-spacing: 0; color: #c5cfdc; margin-left: 6px; }
  .m3wth-ic { width: 40px; height: 40px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; overflow: visible; }
  .m3wth-big { width: 112px; height: 112px; flex: none; stroke-width: 1.05; }
  .m3wth-ic g, .m3wth-ic path, .m3wth-ic circle { transform-box: fill-box; transform-origin: 50% 50%; }
  .m3wth-sun, .m3wth-rays { stroke: var(--m3wth-sunc); }
  .m3wth-rain, .m3wth-snow { stroke: var(--m3wth-rainc); }
  .m3wth-snow { fill: var(--m3wth-rainc); }
  .m3wth-bolt { stroke: var(--m3wth-sunc); }
  .m3wth-cloud { fill: var(--m3wth-card); }
  .m3wth-days { list-style: none; margin: 22px 0 0; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .m3wth-days li { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 4px; border-radius: 16px; background: rgba(243,237,226,.05); text-align: center; }
  .m3wth-day { font-size: 13px; font-weight: 600; color: #c5cfdc; }
  .m3wth-cond { font-size: 13px; line-height: 1.3; }
  .m3wth-hl { font-size: 13px; color: #c5cfdc; font-variant-numeric: tabular-nums; }
  .m3wth-note { margin: 18px 0 0; font-size: 12.5px; color: #aab6c6; }
  /* The loops: slow, so every frame reads as a finished icon. */
  .m3wth-rays { animation: m3wth-spin calc(24s * var(--m3wth-speed)) linear infinite; }
  .m3wth-slow { transform-box: view-box; transform-origin: 8.5px 8.5px; animation-duration: calc(36s * var(--m3wth-speed)); }
  .m3wth-drift { animation: m3wth-drift calc(7s * var(--m3wth-speed)) ease-in-out infinite; }
  .m3wth-rain path { animation: m3wth-fall calc(1.4s * var(--m3wth-speed)) linear infinite; }
  .m3wth-rain path:nth-child(2) { animation-delay: -.5s; }
  .m3wth-rain path:nth-child(3) { animation-delay: -.95s; }
  .m3wth-snow circle { animation: m3wth-flake calc(3s * var(--m3wth-speed)) linear infinite; }
  .m3wth-snow circle:nth-child(2) { animation-delay: -1s; }
  .m3wth-snow circle:nth-child(3) { animation-delay: -2s; }
  .m3wth-wind path { stroke-dasharray: .72 .28; animation: m3wth-gust calc(3.2s * var(--m3wth-speed)) linear infinite; }
  .m3wth-wind path:nth-child(2) { animation-delay: -1.2s; }
  .m3wth-wind path:nth-child(3) { animation-delay: -2.1s; }
  .m3wth-bolt { animation: m3wth-flash calc(4s * var(--m3wth-speed)) linear infinite; }
  @keyframes m3wth-spin { to { transform: rotate(360deg); } }
  @keyframes m3wth-drift { 0%,100% { transform: translateX(-.8px); } 50% { transform: translateX(1px); } }
  @keyframes m3wth-fall { 0% { transform: translateY(-1.5px); opacity: 0; } 25% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateY(2.5px); opacity: 0; } }
  @keyframes m3wth-flake { 0% { transform: translateY(-2px); opacity: 0; } 20%,75% { opacity: 1; } 100% { transform: translateY(2.5px); opacity: 0; } }
  @keyframes m3wth-gust { to { stroke-dashoffset: -1; } }
  @keyframes m3wth-flash { 0%,62%,100% { opacity: 1; } 64% { opacity: .15; } 67% { opacity: 1; } 70% { opacity: .3; } 73% { opacity: 1; } }
  .m3wth[data-off] * { animation-play-state: paused !important; }
  @media (max-width: 640px) {
    .m3wth-card { padding: 24px 16px; }
    .m3wth-big { width: 84px; height: 84px; }
    .m3wth-days { grid-template-columns: 1fr; gap: 6px; }
    .m3wth-days li { flex-direction: row; justify-content: flex-start; gap: 14px; padding: 8px 14px; text-align: left; }
    .m3wth-day { width: 34px; }
    .m3wth-cond { flex: 1; }
    .m3wth-days .m3wth-ic { width: 32px; height: 32px; }
  }
  @media (prefers-reduced-motion: reduce) { .m3wth * { animation: none !important; } }
`;

export default function WeatherForecastCardWithAnimatedIcons() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    // Pauses the loops while the card is off screen or the tab is hidden.
    let seen = true;
    const apply = () => {
      if (seen && !document.hidden) root.removeAttribute("data-off");
      else root.setAttribute("data-off", "");
    };
    const io = new IntersectionObserver(([en]) => { seen = en.isIntersecting; apply(); });
    io.observe(root);
    document.addEventListener("visibilitychange", apply);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", apply);
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      <section ref={ref} className="m3wth" aria-labelledby="m3wth-h">
        <article className="m3wth-card">
          <header className="m3wth-now">
            <div>
              <p className="m3wth-kicker">Kestrel Bay Harbour</p>
              <h2 className="m3wth-title" id="m3wth-h">Showers until mid afternoon</h2>
              <p className="m3wth-temp">14&deg; <span>feels like 11&deg;</span></p>
            </div>
            <svg className="m3wth-ic m3wth-big" viewBox="0 0 24 24" aria-hidden="true">
              <g transform="translate(0 -3)"><path className="m3wth-cloud" d="M7.5 18h9a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 6.6 11.1 3.5 3.5 0 0 0 7.5 18z"/></g>
              <g className="m3wth-rain"><path d="M9 17.5l-.6 2.5"/><path d="M12.4 17.5l-.6 2.5"/><path d="M15.8 17.5l-.6 2.5"/></g>
            </svg>
          </header>
          <ul className="m3wth-days" aria-label="Next five days">
            <li>
              <span className="m3wth-day">Thu</span>
              <svg className="m3wth-ic" viewBox="0 0 24 24" aria-hidden="true"><g className="m3wth-rays"><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></g><circle className="m3wth-sun" cx="12" cy="12" r="4"/></svg>
              <span className="m3wth-cond">Sunny</span><span className="m3wth-hl">18&deg; / 9&deg;</span>
            </li>
            <li>
              <span className="m3wth-day">Fri</span>
              <svg className="m3wth-ic" viewBox="0 0 24 24" aria-hidden="true"><g className="m3wth-rays m3wth-slow"><path d="M8.5 2.5v1.5M2.5 8.5H4M4.3 4.3l1 1M12.7 4.3l-1 1"/></g><circle className="m3wth-sun" cx="8.5" cy="8.5" r="3"/><g transform="translate(1.5 2.5)"><path className="m3wth-cloud m3wth-drift" d="M7.5 18h9a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 6.6 11.1 3.5 3.5 0 0 0 7.5 18z"/></g></svg>
              <span className="m3wth-cond">Partly cloudy</span><span className="m3wth-hl">16&deg; / 8&deg;</span>
            </li>
            <li>
              <span className="m3wth-day">Sat</span>
              <svg className="m3wth-ic" viewBox="0 0 24 24" aria-hidden="true"><g className="m3wth-wind"><path pathLength={1} d="M3 9h10.5a2.8 2.8 0 1 0-2.8-2.8"/><path pathLength={1} d="M3 13.5h15a2.8 2.8 0 1 1-2.8 2.8"/><path pathLength={1} d="M3 18h7"/></g></svg>
              <span className="m3wth-cond">Windy</span><span className="m3wth-hl">13&deg; / 7&deg;</span>
            </li>
            <li>
              <span className="m3wth-day">Sun</span>
              <svg className="m3wth-ic" viewBox="0 0 24 24" aria-hidden="true"><g transform="translate(0 -3)"><path className="m3wth-cloud" d="M7.5 18h9a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 6.6 11.1 3.5 3.5 0 0 0 7.5 18z"/></g><g className="m3wth-snow"><circle cx="9" cy="18" r="1"/><circle cx="12.4" cy="19.5" r="1"/><circle cx="15.8" cy="18" r="1"/></g></svg>
              <span className="m3wth-cond">Light snow</span><span className="m3wth-hl">3&deg; / -2&deg;</span>
            </li>
            <li>
              <span className="m3wth-day">Mon</span>
              <svg className="m3wth-ic" viewBox="0 0 24 24" aria-hidden="true"><g transform="translate(0 -3)"><path className="m3wth-cloud" d="M7.5 18h9a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 6.6 11.1 3.5 3.5 0 0 0 7.5 18z"/></g><path className="m3wth-bolt" d="M12.8 15.5l-2.3 3.4h3l-2 3.6"/></svg>
              <span className="m3wth-cond">Thunderstorms</span><span className="m3wth-hl">12&deg; / 8&deg;</span>
            </li>
          </ul>
          <p className="m3wth-note">Sample forecast for an invented harbour town.</p>
        </article>
      </section>
    </>
  );
}
