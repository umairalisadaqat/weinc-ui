import { useCallback, useEffect, useRef, useState } from "react";

/** Everything written on the door. */
const shop = {
  open: { word: "Open", line: "Please come in" },
  closed: { word: "Closed", line: "Back at nine tomorrow" },
  hours: "Tuesday to Sunday, nine to six",
  photo: {
    src: "https://images.pexels.com/photos/37309559/pexels-photo-37309559.jpeg?auto=compress&cs=tinysrgb&w=1400",
    alt: "Buckets of pink carnations and wild flowers on wooden crates inside a florist",
    tone: "#b9a184",
  },
};

const PAINT = "#1c2a45"; // the door
const RED = "#c8321f"; // sign enamel
const CREAM = "#f6efdc";
const SCENE_W = 640;
const SCENE_H = 680;
const SWING = 40; // how hard the sign is knocked when it is flipped, 0 for none
const BELL_SOUND = false; // reserved: the piece is silent, wire your own audio to `ring` if you want it

const BRASS = "linear-gradient(90deg, #4f3508 0%, #b98b2f 16%, #fff0b4 30%, #e3b64f 42%, #8f6418 68%, #c99c3e 86%, #47300a 100%)";

export default function ShopDoorSignToggle() {
  const [open, setOpen] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const hangRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const armRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const clapRef = useRef<SVGGElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const sim = useRef({ th: 0.1, thV: 0, ph: 0, phV: 0, turns: 0, be: 0.2, beV: 0, cl: 0, clV: 0, px: 0, pxTo: 0, touched: -1e9, wake: () => {}, reduce: false });

  const flip = useCallback((fromUser: boolean) => {
    const s = sim.current;
    if (fromUser) s.touched = performance.now();
    s.turns += 1;
    setOpen(s.turns % 2 === 0);
    if (s.reduce) { s.ph = s.turns * Math.PI; s.th = 0; s.be = 0; s.cl = 0; }
    else { s.thV += (SWING / 100) * (s.turns % 2 ? 1 : -1) * 2.4; s.beV += 5.5; if (BELL_SOUND) { /* play your sound here */ } }
    s.wake();
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current, scene = sceneRef.current;
    if (!wrap || !scene) return;
    const s = sim.current;
    s.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (s.reduce) { s.th = 0; s.be = 0; }
    const measure = () => {
      const sc = Math.min(1.08, wrap.clientWidth / (SCENE_W + 12), wrap.clientHeight / SCENE_H);
      scene.style.transform = `translate(-50%, -50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);

    const paint = () => {
      const c = Math.cos(s.ph);
      if (hangRef.current) hangRef.current.style.transform = `rotateZ(${s.th.toFixed(4)}rad) rotateY(${s.ph.toFixed(4)}rad)`;
      if (shadeRef.current) shadeRef.current.style.transform = `translateX(${(-s.th * 250 + 14).toFixed(1)}px) scaleX(${Math.max(0.06, Math.abs(c)).toFixed(3)})`;
      if (armRef.current) armRef.current.style.transform = `rotate(${(s.be * 0.16).toFixed(4)}rad)`;
      if (bellRef.current) bellRef.current.style.transform = `rotate(${s.be.toFixed(4)}rad)`;
      if (clapRef.current) clapRef.current.style.transform = `rotate(${s.cl.toFixed(4)}rad)`;
      if (photoRef.current) photoRef.current.style.transform = `translate3d(${(-s.px * 14).toFixed(2)}px, 0, 0) scale(1.08)`;
      if (glareRef.current) glareRef.current.style.transform = `translate3d(${(s.px * 46).toFixed(2)}px, 0, 0)`;
      // the gloss on the enamel slides as the plate turns and swings
      hangRef.current?.style.setProperty("--gloss", `${(50 + Math.sin(s.ph) * 60 + s.th * 160 + s.px * 12).toFixed(1)}%`);
    };

    let raf = 0, last = 0, seen = true, t0 = 0, nextDemo = 3600, nextBreeze = 1500;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const t = now - t0;
      const sub = 2;
      for (let k = 0; k < sub; k++) {
        const h = dt / sub;
        s.thV += (-36 * Math.sin(s.th) - 0.9 * s.thV) * h; s.th += s.thV * h;
        // the chain is wound a half turn at a time and unwinds past the mark before it settles
        s.phV += (46 * (s.turns * Math.PI - s.ph) - 4.6 * s.phV) * h; s.ph += s.phV * h;
        const beA = -120 * Math.sin(s.be) - 1.5 * s.beV;
        s.beV += beA * h; s.be += s.beV * h;
        s.clV += (-70 * s.cl - 3.2 * s.clV - beA * 0.9) * h; s.cl += s.clV * h;
        s.cl = Math.max(-0.5, Math.min(0.5, s.cl));
      }
      s.px += (s.pxTo - s.px) * Math.min(1, dt * 5);
      if (now - s.touched > 7000) {
        s.pxTo = 0.5 * Math.sin(t / 2600);
        if (t > nextBreeze) { s.thV += 0.25 * (Math.sin(t) > 0 ? 1 : -1); nextBreeze = t + 2800; }
        if (t > nextDemo) { nextDemo = t + 4200; flip(false); }
      }
      paint();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    s.wake = () => { if (s.reduce) paint(); else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    s.wake();

    const onMove = (e: PointerEvent) => {
      const b = wrap.getBoundingClientRect();
      s.touched = Math.max(s.touched, performance.now() - 3000);
      const x = ((e.clientX - b.left) / b.width) * 2 - 1;
      // brushing past the sign nudges it
      if (!s.reduce && e.target instanceof Element && e.target.closest("[data-sign]")) s.thV += Math.max(-0.5, Math.min(0.5, (x - s.pxTo) * 6));
      s.pxTo = x;
      if (s.reduce) { s.px = x; paint(); }
    };
    wrap.addEventListener("pointermove", onMove);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) s.wake(); });
    io.observe(wrap);
    const onVis = () => { if (!document.hidden) s.wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [flip]);

  const face = (side: "open" | "closed") => {
    const dark = side === "closed";
    const ink = dark ? CREAM : RED;
    return (
      <span
        aria-hidden="true"
        className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[18px]"
        style={{
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: dark ? "rotateY(180deg) translateZ(2px)" : "translateZ(2px)",
          background: dark ? `radial-gradient(120% 90% at 30% 18%, #e2452d 0%, ${RED} 46%, #99200f 100%)` : `radial-gradient(120% 90% at 30% 18%, #fffaf0 0%, ${CREAM} 48%, #dccfae 100%)`,
          boxShadow: "inset 0 0 0 1.5px rgba(20,12,6,0.95), inset 0 0 0 3px rgba(255,255,255,0.4), inset 0 0 0 6px rgba(0,0,0,0.07), inset 0 -12px 18px rgba(60,20,0,0.28), inset 0 8px 12px rgba(255,255,255,0.35), inset 10px 0 14px -6px rgba(255,255,255,0.25), inset -12px 0 16px -6px rgba(40,10,0,0.22)",
        }}
      >
        {/* painted keyline, fired under the glaze */}
        <span className="absolute inset-[13px] rounded-[9px]" style={{ border: `2.5px solid ${ink}` }} />
        <span className="absolute inset-[19px] rounded-[5px]" style={{ border: `1px solid ${ink}`, opacity: 0.7 }} />
        <span className="relative font-sans font-black uppercase leading-none" style={{ color: ink, fontSize: dark ? 59 : 76, letterSpacing: dark ? "0.03em" : "0.07em", marginTop: dark ? 20 : 12, textShadow: dark ? "0 1.5px 0 rgba(90,14,4,0.55)" : "0 1.5px 0 rgba(255,255,255,0.9)" }}>
          {shop[side].word}
        </span>
        <span className="relative mt-2.5 font-serif text-[17px] italic leading-none" style={{ color: ink }}>
          {shop[side].line}
        </span>
        {/* chips at the edge where the steel has rusted through */}
        <span className="absolute left-[3px] top-[58%] h-[13px] w-[7px] rounded-r-full" style={{ background: "radial-gradient(circle at 0 50%, #2a1408 0 45%, #6e3a1a 46% 75%, rgba(0,0,0,0) 78%)" }} />
        <span className="absolute bottom-[2px] right-[22%] h-[6px] w-[16px] rounded-t-full" style={{ background: "radial-gradient(60% 100% at 50% 100%, #2a1408 0 50%, #6e3a1a 51% 80%, rgba(0,0,0,0) 84%)" }} />
        {/* eyelets */}
        {[22, 278].map((x) => (
          <span key={x} className="absolute top-[12px] h-[15px] w-[15px] -translate-x-1/2 rounded-full" style={{ left: x, background: "radial-gradient(circle, #0a0c12 0 34%, #6b4a10 36%, #ffe9a6 52%, #b98b2f 66%, #4f3508 80%)", boxShadow: "0 1px 1px rgba(0,0,0,0.5)" }} />
        ))}
        {/* the glaze: a soft sky reflection up top and one hard window streak that slides */}
        <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.16) 9%, rgba(255,255,255,0) 26%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.2) 100%)" }} />
        <span className="absolute inset-y-0 w-[230%]" style={{ left: "-65%", background: "linear-gradient(104deg, rgba(255,255,255,0) 45.5%, rgba(255,255,255,0.34) 46.5%, rgba(255,255,255,0.3) 48.6%, rgba(255,255,255,0) 49.2%, rgba(255,255,255,0) 50.4%, rgba(255,255,255,0.2) 50.8%, rgba(255,255,255,0.18) 51.5%, rgba(255,255,255,0) 52%)", transform: "translateX(calc((var(--gloss, 50%) - 50%) * 0.5))" }} />
      </span>
    );
  };

  const ballChain = "radial-gradient(circle at 36% 32%, #fff6cc 0 14%, #dcb04c 34%, #8a6216 62%, #3d2905 78%, rgba(0,0,0,0) 80%)";

  return (
    <section ref={wrapRef} className="relative h-[640px] w-full overflow-hidden sm:h-[720px]" style={{ backgroundColor: PAINT }}>
      {/* brushed gloss paint: long vertical strokes and a fall of light from the street */}
      <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(90% 80% at 30% 0%, rgba(120,150,210,0.3) 0%, rgba(0,0,0,0) 60%), repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, rgba(0,0,0,0) 1px 5px, rgba(0,0,0,0.03) 5px 6px, rgba(0,0,0,0) 6px 13px), linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.4) 100%)" }} />
      <div ref={sceneRef} className="absolute left-1/2 top-1/2 select-none" style={{ width: SCENE_W, height: SCENE_H, transform: "translate(-50%, -50%)" }}>
        {/* the door leaf: its edge against the frame, and a raised field around the glass */}
        <div aria-hidden="true" className="absolute -inset-y-[400px] left-0 right-0" style={{ boxShadow: "-1px 0 0 rgba(0,0,0,0.75), -3px 0 0 rgba(255,255,255,0.07), 1px 0 0 rgba(0,0,0,0.75), 3px 0 0 rgba(255,255,255,0.07), inset 14px 0 18px -14px rgba(0,0,0,0.5), inset -14px 0 18px -14px rgba(0,0,0,0.5)" }} />

        {/* glazing bead */}
        <div aria-hidden="true" className="absolute rounded-[5px]" style={{ left: 54, top: 64, width: 532, height: 552, background: "linear-gradient(135deg, #34476e 0%, #1c2a45 40%, #111a2e 100%)", boxShadow: "0 0 0 1px rgba(0,0,0,0.7), 0 1px 0 2px rgba(255,255,255,0.06), 0 18px 30px -8px rgba(0,0,0,0.5), inset 0 2px 1px rgba(255,255,255,0.2), inset 0 -2px 1px rgba(0,0,0,0.5)" }} />
        <div aria-hidden="true" className="absolute rounded-[3px]" style={{ left: 64, top: 74, width: 512, height: 532, background: "linear-gradient(135deg, #0d1424 0%, #1a2742 60%, #2c3d62 100%)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.6)" }} />

        {/* the pane */}
        <div className="absolute overflow-hidden rounded-[2px]" style={{ left: 72, top: 82, width: 496, height: 516, backgroundColor: shop.photo.tone, boxShadow: "0 0 0 1px rgba(0,0,0,0.85)" }}>
          <div ref={photoRef} className="absolute inset-0" style={{ transform: "scale(1.08)" }}>
            <img src={shop.photo.src} alt={shop.photo.alt} draggable={false} className="h-full w-full object-cover transition-[filter] duration-700 ease-out motion-reduce:transition-none" style={{ objectPosition: "42% 60%", filter: open ? "blur(1.8px) brightness(0.8) contrast(1.1) saturate(1.3)" : "blur(1.6px) brightness(0.3) contrast(1.05) saturate(0.55) hue-rotate(-12deg)" }} />
          </div>
          {/* lamp light inside when open, street dusk when closed */}
          <div aria-hidden="true" className="absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none" style={{ opacity: open ? 1 : 0, background: "radial-gradient(70% 55% at 50% 0%, rgba(255,206,140,0.2) 0%, rgba(255,200,120,0) 70%), linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(40,20,0,0.35) 100%)" }} />
          <div aria-hidden="true" className="absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none" style={{ opacity: open ? 0 : 1, background: "linear-gradient(180deg, rgba(20,34,70,0.55) 0%, rgba(6,10,22,0.7) 100%)" }} />
          {/* shadow the frame throws onto whatever is behind the glass */}
          <div aria-hidden="true" className="absolute inset-0" style={{ boxShadow: "inset 0 22px 30px -12px rgba(0,0,0,0.6), inset 14px 0 22px -12px rgba(0,0,0,0.45), inset -8px 0 18px -12px rgba(0,0,0,0.3)" }} />

          {/* the bell on its sprung arm, screwed to the top of the frame */}
          <div aria-hidden="true" className="absolute" style={{ left: 402, top: 0, transform: "scale(1.32)", transformOrigin: "60px 0" }}>
            <div ref={armRef} style={{ transformOrigin: "60px 0px", width: 0, height: 0 }}>
              <svg width="96" height="72" viewBox="0 0 96 72" className="absolute left-[-18px] top-0 overflow-visible">
                <defs>
                  <linearGradient id="door-bell-steel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#f1f4f8" /><stop offset="0.35" stopColor="#8d96a3" /><stop offset="0.7" stopColor="#3a414d" /><stop offset="1" stopColor="#141820" />
                  </linearGradient>
                </defs>
                <path d="M78 4 C 80 34, 58 46, 36 38 C 20 32, 14 44, 18 58" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="6" strokeLinecap="round" transform="translate(3 5)" style={{ filter: "blur(3px)" }} />
                <path d="M78 4 C 80 34, 58 46, 36 38 C 20 32, 14 44, 18 58" fill="none" stroke="url(#door-bell-steel)" strokeWidth="5.5" strokeLinecap="round" />
                <path d="M78 4 C 80 34, 58 46, 36 38 C 20 32, 14 44, 18 58" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" strokeLinecap="round" transform="translate(-1 -1)" />
                <rect x="66" y="0" width="24" height="12" rx="2" fill="#2a303a" stroke="#0b0d12" />
                <circle cx="72" cy="6" r="2.2" fill="#aab2be" /><circle cx="84" cy="6" r="2.2" fill="#aab2be" />
              </svg>
              <div ref={bellRef} className="absolute" style={{ left: 0, top: 56, width: 0, height: 0, transformOrigin: "0 0" }}>
                <svg width="92" height="104" viewBox="-46 -8 92 104" className="absolute left-[-46px] top-[-8px] overflow-visible">
                  <defs>
                    <linearGradient id="door-bell-brass" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#3f2a06" /><stop offset="0.14" stopColor="#a97d26" /><stop offset="0.27" stopColor="#fff4c2" /><stop offset="0.36" stopColor="#edc35a" /><stop offset="0.62" stopColor="#8a6016" /><stop offset="0.82" stopColor="#d1a546" /><stop offset="0.93" stopColor="#7a5412" /><stop offset="1" stopColor="#332104" />
                    </linearGradient>
                    <linearGradient id="door-bell-shade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="rgba(255,250,220,0.35)" /><stop offset="0.45" stopColor="rgba(0,0,0,0)" /><stop offset="1" stopColor="rgba(40,18,0,0.5)" />
                    </linearGradient>
                  </defs>
                  <path d="M0 6 C 13 6, 18 16, 19 28 C 21 50, 25 62, 40 74 L -40 74 C -25 62, -21 50, -19 28 C -18 16, -13 6, 0 6 Z" fill="rgba(0,0,0,0.5)" transform="translate(8 9)" style={{ filter: "blur(6px)" }} />
                  <circle cx="0" cy="2" r="6" fill="none" stroke="url(#door-bell-brass)" strokeWidth="3.2" />
                  <g ref={clapRef} style={{ transformOrigin: "0px 20px", transformBox: "view-box" }}>
                    <rect x="-1.4" y="40" width="2.8" height="42" fill="#5a3f10" />
                    <circle cx="0" cy="85" r="6.5" fill="url(#door-bell-brass)" stroke="#2c1c03" strokeWidth="0.8" />
                    <circle cx="-2" cy="83" r="1.8" fill="rgba(255,250,220,0.8)" />
                  </g>
                  <ellipse cx="0" cy="74" rx="40" ry="7" fill="#1f1403" />
                  <path d="M0 6 C 13 6, 18 16, 19 28 C 21 50, 25 62, 40 74 C 20 79, -20 79, -40 74 C -25 62, -21 50, -19 28 C -18 16, -13 6, 0 6 Z" fill="url(#door-bell-brass)" />
                  <path d="M0 6 C 13 6, 18 16, 19 28 C 21 50, 25 62, 40 74 C 20 79, -20 79, -40 74 C -25 62, -21 50, -19 28 C -18 16, -13 6, 0 6 Z" fill="url(#door-bell-shade)" />
                  <path d="M-21.5 44 C -8 47.5, 8 47.5, 21.5 44" fill="none" stroke="rgba(52,30,0,0.7)" strokeWidth="1.1" /><path d="M-21.8 45.6 C -8 49, 8 49, 21.8 45.6" fill="none" stroke="rgba(255,246,200,0.6)" strokeWidth="0.8" />
                  <path d="M-23.5 51 C -9 54.8, 9 54.8, 23.5 51" fill="none" stroke="rgba(52,30,0,0.7)" strokeWidth="1.1" /><path d="M-23.9 52.6 C -9 56.4, 9 56.4, 23.9 52.6" fill="none" stroke="rgba(255,246,200,0.6)" strokeWidth="0.8" />
                  <path d="M-39 74 C -20 78.6, 20 78.6, 39 74" fill="none" stroke="rgba(255,248,214,0.85)" strokeWidth="1.2" />
                  <ellipse cx="-9" cy="24" rx="3.2" ry="12" fill="rgba(255,255,255,0.55)" transform="rotate(8 -9 24)" style={{ filter: "blur(1.5px)" }} />
                </svg>
              </div>
            </div>
          </div>

          {/* the sign's soft shadow on the room behind it */}
          <div ref={shadeRef} aria-hidden="true" className="absolute rounded-[30px] bg-black" style={{ left: 98, top: 238, width: 300, height: 178, opacity: 0.4, filter: "blur(22px)" }} />

          {/* hook, chain and plate: everything that turns */}
          <div className="absolute" style={{ left: 248, top: 96, width: 0, height: 0, perspective: "1100px" }}>
            {/* suction cup on the glass */}
            <span aria-hidden="true" className="absolute left-[-26px] top-[-26px] h-[52px] w-[52px] rounded-full" style={{ background: "radial-gradient(circle at 38% 30%, rgba(255,255,255,0.55) 0 8%, rgba(255,255,255,0.12) 22%, rgba(255,255,255,0.04) 55%, rgba(255,255,255,0.3) 66%, rgba(255,255,255,0.05) 71%)", boxShadow: "0 0 0 1px rgba(255,255,255,0.28), 0 6px 10px rgba(0,0,0,0.3), inset 0 -4px 8px rgba(0,0,0,0.25)" }} />
            <span aria-hidden="true" className="absolute left-[-8px] top-[-8px] h-[16px] w-[16px] rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #fff3c0, #d1a444 40%, #6d4b10 82%)", boxShadow: "0 3px 4px rgba(0,0,0,0.5)" }} />
            <div ref={hangRef} className="absolute left-0 top-0" style={{ width: 0, height: 0, transformStyle: "preserve-3d", transformOrigin: "0 0" }}>
              {[-1, 1].map((d) => (
                <span key={d} aria-hidden="true" className="absolute left-[-3.5px] top-0 w-[7px]" style={{ height: 187, transformOrigin: "50% 0", transform: `rotate(${-d * 43.2}deg)`, backgroundImage: ballChain, backgroundSize: "7px 7px", filter: "drop-shadow(0 2px 1px rgba(0,0,0,0.35))" }} />
              ))}
              <button
                type="button"
                role="switch"
                data-sign=""
                aria-checked={open}
                aria-label="Shop open"
                onClick={() => flip(true)}
                className="absolute block cursor-pointer rounded-[18px] outline-none focus-visible:ring-4 focus-visible:ring-amber-300 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
                style={{ left: -150, top: 118, width: 300, height: 184, transformStyle: "preserve-3d" }}
              >
                {/* the steel the enamel is fired onto: three layers give the plate an edge when it is side on */}
                {[-1.2, 0, 1.2].map((z) => (
                  <span key={z} aria-hidden="true" className="absolute inset-0 rounded-[18px]" style={{ transform: `translateZ(${z}px)`, background: "linear-gradient(180deg, #7b808a, #23262e)" }} />
                ))}
                {face("open")}
                {face("closed")}
              </button>
            </div>
          </div>

          {/* gilded hours on the inside of the glass */}
          <p className="absolute inset-x-0 bottom-[30px] text-center font-serif text-[15px] font-bold uppercase leading-none tracking-[0.3em]" style={{ backgroundImage: "linear-gradient(180deg, #fff2bc 0%, #e2b44c 45%, #9b6d18 55%, #f0cf7a 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 1px 0 rgba(30,14,0,0.9)) drop-shadow(0 0 1px rgba(30,14,0,0.9))" }}>
            {shop.hours}
          </p>

          {/* the glass itself: the street reflected in it, brighter when the shop is dark */}
          <div ref={glareRef} aria-hidden="true" className="pointer-events-none absolute -inset-x-[80px] inset-y-0 transition-opacity duration-700 motion-reduce:transition-none" style={{ opacity: open ? 0.75 : 1, background: "linear-gradient(112deg, rgba(255,255,255,0) 6%, rgba(214,230,255,0.3) 9%, rgba(214,230,255,0.1) 19%, rgba(255,255,255,0) 19.4%, rgba(255,255,255,0) 22%, rgba(214,230,255,0.22) 22.4%, rgba(214,230,255,0.06) 26%, rgba(255,255,255,0) 26.3%, rgba(255,255,255,0) 68%, rgba(214,230,255,0.12) 72%, rgba(214,230,255,0.16) 78%, rgba(255,255,255,0) 78.4%)" }} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14), inset 0 1px 0 1px rgba(255,255,255,0.12)" }} />
        </div>

        {/* brass pull on the stile */}
        <div aria-hidden="true" className="absolute" style={{ left: 600, top: 270, width: 16, height: 190 }}>
          <span className="absolute left-[6px] top-[10px] h-full w-full rounded-full bg-black" style={{ opacity: 0.45, filter: "blur(6px)" }} />
          {[14, 162].map((y) => (
            <span key={y} className="absolute left-[-3px] h-[22px] w-[22px] rounded-full" style={{ top: y - 4, background: "radial-gradient(circle at 35% 30%, #ffefb2, #c59735 45%, #5a3d0b 90%)", boxShadow: "0 2px 3px rgba(0,0,0,0.6)" }} />
          ))}
          <span className="absolute inset-0 rounded-full" style={{ background: BRASS, boxShadow: "inset 0 3px 3px rgba(255,250,220,0.5), inset 0 -6px 8px rgba(40,20,0,0.5), 0 0 0 0.5px rgba(30,14,0,0.8)" }} />
        </div>
      </div>

      <p className="absolute bottom-5 left-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-slate-300 sm:bottom-8 sm:left-8">
        <span className="text-white" aria-live="polite">{open ? "The shop is open" : "The shop is closed"}</span>
        <span className="block">Press the sign to turn it over</span>
      </p>
    </section>
  );
}
