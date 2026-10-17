import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** One postcard per person: the photograph is the front, the words are written on the back. */
const cards = [
  {
    name: "Imani Okafor",
    role: "Founder",
    company: "Saltmarsh Ceramics",
    city: "Porto",
    date: "14 MAR",
    quote: "You rebuilt our shop in three weeks and it finally looks the way the pots feel in your hand. My mother rang to ask who took the pictures.",
    sign: "Imani",
    pin: "#d7352a",
    photo: { src: "https://images.pexels.com/photos/30878711/pexels-photo-30878711.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Woman with sculpted braids and red eye make-up in a red striped top against a yellow wall", tone: "#f0b400", focus: "50% 22%" },
  },
  {
    name: "Tomas Rivera",
    role: "Owner",
    company: "Rivera Cycle Works",
    city: "Valencia",
    date: "02 JUN",
    quote: "I sent a page of scribbles on a Sunday night. By Wednesday there was a booking page my mechanics could actually use with greasy thumbs.",
    sign: "Tomas",
    pin: "#f2c230",
    photo: { src: "https://images.pexels.com/photos/11492642/pexels-photo-11492642.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Man in a black jacket sitting on a wooden stool in front of an orange studio backdrop", tone: "#e8860c", focus: "50% 30%" },
  },
  {
    name: "Noor Haddad",
    role: "Head of Brand",
    company: "Fieldnote Coffee",
    city: "Amman",
    date: "27 SEP",
    quote: "Every agency told us to pick one colour and behave. You let the bags stay loud and made the rest of the page quiet enough to hear them.",
    sign: "Noor x",
    pin: "#1f55d8",
    photo: { src: "https://images.pexels.com/photos/7515731/pexels-photo-7515731.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Profile of a woman with slicked-back hair in a red top, half lit against a yellow and red backdrop", tone: "#e9a60a", focus: "50% 40%" },
  },
  {
    name: "Desmond Achebe",
    role: "Florist",
    company: "Stem and Thorn",
    city: "Accra",
    date: "09 DEC",
    quote: "The launch went out on a Friday and I spent Saturday wrapping peonies instead of answering emails. That has never happened before.",
    sign: "Des",
    pin: "#f4efe6",
    photo: { src: "https://images.pexels.com/photos/9955031/pexels-photo-9955031.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Man in a white beret and white jacket holding a pink peony against a deep blue backdrop", tone: "#1d4f86", focus: "50% 26%" },
  },
  {
    name: "Leila Mbeki",
    role: "Director",
    company: "Longroom Records",
    city: "Durban",
    date: "21 JAN",
    quote: "We asked for a site. We got somebody who listened to the whole back catalogue first and then argued with us about the running order.",
    sign: "Leila",
    pin: "#18996b",
    photo: { src: "https://images.pexels.com/photos/32174976/pexels-photo-32174976.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Woman with an afro and silver bracelets holding her hands to her hair against a red backdrop", tone: "#d2332b", focus: "50% 24%" },
  },
];

// A card is drawn at reading size and scaled down while it hangs.
const CW = 340;
const CH = 480;
const PIN_Y = 22; // where the pin goes through, measured from the top edge
// Two arrangements: a wide board and a tall one for phones. homes are [pin x, pin y, hanging angle].
const WIDE = { w: 1100, h: 680, rest: 0.56, open: 1, cx: 550, cy: 346, homes: [[152, 66, -3], [296, 372, 2.4], [550, 92, -1.4], [812, 366, -2.2], [950, 62, 3.2]] };
const TALL = { w: 400, h: 700, rest: 0.365, open: 0.92, cx: 200, cy: 416, homes: [[74, 46, -3], [200, 62, 1.6], [112, 262, 2.4], [326, 42, 3], [292, 270, -2.6]] };
const ORDER = [2, 0, 4, 1, 3]; // the order the board reads itself out in

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

const svg = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
// pressed cork: coarse granules, dark crevices between them and fine grit on top
const CORK = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'><filter id='g' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.2' numOctaves='3' seed='7' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.3  0 0 0 0 0.16  0 0 0 0 0.06  4.2 0 0 0 -1.95'/></filter><filter id='h' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.3' numOctaves='2' seed='23' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.9  0 0 0 0 0.72  0 0 0 0 0.48  0 3.6 0 0 -1.9'/></filter><filter id='s' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' seed='3' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.13  0 0 0 0 0.06  0 0 0 0 0.02  0 0 6 0 -3.25'/></filter><filter id='t' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='2' seed='5' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.25  0 0 0 0 0.12  0 0 0 0 0.02  2.2 0 0 0 -0.95'/></filter><rect width='360' height='360' fill='#b27f4e'/><rect width='360' height='360' filter='url(#t)' opacity='0.5'/><rect width='360' height='360' filter='url(#g)' opacity='0.62'/><rect width='360' height='360' filter='url(#h)' opacity='0.4'/><rect width='360' height='360' filter='url(#s)' opacity='0.85'/></svg>`,
);
const GRAIN = svg(
  `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='p' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='11' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0 0.1  0 0 0 0.5 -0.14'/></filter><rect width='160' height='160' filter='url(#p)'/></svg>`,
);
const HAND = `"Bradley Hand", "Segoe Print", "Noteworthy", "Marker Felt", cursive`;
const INK = "#1c2a5a";

type Sim = { th: number; w: number; o: number; ov: number; target: number; pin: number; pinV: number; pinUp: boolean };

export default function CorkBoardPostcards() {
  const reduce = !!useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const wrapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const glareRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [tall, setTall] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const openRef = useRef<number | null>(open);
  const sim = useRef<Sim[]>(cards.map(() => ({ th: 0, w: 0, o: 0, ov: 0, target: 0, pin: 0, pinV: 0, pinUp: false })));
  const env = useRef({ scale: 1, touched: false, inside: false, visible: true, layout: WIDE });

  const paint = useCallback((i: number) => {
    const L = env.current.layout;
    const c = sim.current[i];
    const [px, py, rest] = L.homes[i];
    const e = clamp(c.o, 0, 1);
    const s = lerp(L.rest, L.open, c.o);
    const x = (L.cx - px) * e;
    const y = (L.cy - (CH / 2 - PIN_Y) * L.open - py) * e + Math.sin(e * Math.PI) * 20;
    const ang = (rest + c.th) * (1 - e) - 1.6 * e;
    const flip = 180 * ease(clamp((c.o - 0.12) / 0.74, 0, 1));
    const card = cardRefs.current[i];
    const shade = shadeRefs.current[i];
    const wrap = wrapRefs.current[i];
    const glare = glareRefs.current[i];
    const pin = pinRefs.current[i];
    const base = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${ang.toFixed(3)}deg) scale(${s.toFixed(4)})`;
    if (card) card.style.transform = `${base} rotateY(${flip.toFixed(2)}deg)`;
    if (shade) {
      shade.style.transform = `${base} scaleX(${Math.max(0.06, Math.abs(Math.cos((flip * Math.PI) / 180))).toFixed(3)})`;
      shade.style.setProperty("--lift", e.toFixed(3));
    }
    // the card stays under its pin until the pin has let go, then comes forward of everything
    if (wrap) wrap.style.zIndex = c.o > 0.28 ? "40" : c.o > 0.015 ? "20" : "10";
    if (glare) glare.style.transform = `translate3d(${(c.th * 9).toFixed(1)}px, 0, 0)`;
    if (pin) pin.style.setProperty("--up", clamp(c.pin, 0, 1.3).toFixed(3));
  }, []);

  const toggle = useCallback(
    (i: number | null, byHand: boolean) => {
      if (byHand) env.current.touched = true;
      const next = i !== null && openRef.current === i ? null : i;
      openRef.current = next;
      setOpen(next);
      sim.current.forEach((c, k) => {
        const t = k === next ? 1 : 0;
        if (c.target !== t) {
          c.target = t;
          c.pinUp = true;
        }
        if (reduce) {
          c.o = t;
          c.th = 0;
          c.pinUp = false;
          c.pin = 0;
          paint(k);
        }
      });
    },
    [paint, reduce],
  );

  // size the scene to its box and pick the arrangement
  useEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    if (!root || !scene) return;
    const measure = () => {
      const narrow = root.clientWidth < 700;
      const L = narrow ? TALL : WIDE;
      const sc = clamp(root.clientWidth / L.w, 0.5, 1.12);
      env.current.scale = sc;
      env.current.layout = L;
      root.style.height = `${Math.round(L.h * sc)}px`;
      scene.style.width = `${L.w}px`;
      scene.style.height = `${L.h}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
      setTall(narrow);
      cards.forEach((_, i) => paint(i));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [paint]);

  useEffect(() => {
    cards.forEach((_, i) => paint(i));
  }, [tall, paint]);

  // the swing of every card on its pin, and the trip out to the middle and back
  useEffect(() => {
    if (reduce) {
      toggle(ORDER[0], false);
      return;
    }
    const root = rootRef.current;
    if (!root) return;
    const e = env.current;
    let raf = 0;
    let last = performance.now();
    let gust = 1.4;
    let step = 0;
    let wait = 0.45;
    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      // a draught crosses the board now and then
      gust -= dt;
      if (gust < 0) {
        gust = 3.4 + Math.random() * 1.6;
        const dir = Math.random() < 0.5 ? -1 : 1;
        sim.current.forEach((c, i) => {
          if (c.target === 0) c.w += dir * (14 + ((i * 37) % 11));
        });
      }
      // read the board out by itself until somebody touches it
      if (!e.touched && !e.inside) {
        wait -= dt;
        if (wait < 0) {
          if (openRef.current === null) {
            toggle(ORDER[step % ORDER.length], false);
            step += 1;
            wait = 4.6;
          } else {
            toggle(null, false);
            wait = 1.1;
          }
        }
      }
      sim.current.forEach((c, i) => {
        const rest = c.target === 0 && c.o < 0.02;
        // pendulum about the pin
        c.w += (-40 * c.th - 1.5 * c.w) * dt;
        c.th = clamp(c.th + c.w * dt, -38, 38);
        // travel
        c.ov += (72 * (c.target - c.o) - 13.5 * c.ov) * dt;
        c.o += c.ov * dt;
        if (c.pinUp && c.target === 1 && c.o > 0.3) c.pinUp = false;
        if (c.pinUp && c.target === 0 && c.o < 0.045) {
          c.pinUp = false;
          c.w += (i % 2 ? 1 : -1) * 46; // pressed home a little off centre
        }
        c.pinV += (260 * ((c.pinUp ? 1 : 0) - c.pin) - 22 * c.pinV) * dt;
        c.pin += c.pinV * dt;
        if (!rest || Math.abs(c.w) > 0.02 || Math.abs(c.th) > 0.02 || Math.abs(c.pinV) > 0.01) paint(i);
      });
      if (e.visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf && e.visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const io = new IntersectionObserver(([en]) => {
      e.visible = en.isIntersecting;
      start();
    });
    io.observe(root);
    document.addEventListener("visibilitychange", start);
    start();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", start);
    };
  }, [paint, reduce, toggle]);

  // a passing pointer knocks the hanging cards
  const onMove = (ev: React.PointerEvent) => {
    const scene = sceneRef.current;
    if (!scene || reduce) return;
    const e = env.current;
    const L = e.layout;
    const r = scene.getBoundingClientRect();
    const x = (ev.clientX - r.left) / e.scale;
    const y = (ev.clientY - r.top) / e.scale;
    const hw = (CW * L.rest) / 2;
    L.homes.forEach(([px, py], i) => {
      const c = sim.current[i];
      if (c.target !== 0) return;
      const below = y - py;
      if (Math.abs(x - px) < hw + 10 && below > 10 && below < CH * L.rest) c.w -= clamp(ev.movementX, -40, 40) * 0.34 * (below / (CH * L.rest));
    });
  };

  const L = tall ? TALL : WIDE;

  return (
    <section
      ref={rootRef}
      aria-label="Notes from clients"
      className="relative w-full select-none overflow-hidden bg-[#b08052]"
      style={{ height: WIDE.h, backgroundImage: CORK, backgroundSize: "360px 360px" }}
      onPointerMove={onMove}
      onPointerEnter={() => (env.current.inside = true)}
      onPointerLeave={() => (env.current.inside = false)}
    >
      <style>{`
        .cork-board-postcards-shade > i { position: absolute; inset: 0; border-radius: 5px; background: #2a1404; }
        .cork-board-postcards-shade > i:nth-child(1) { opacity: calc(0.7 * (1 - var(--lift, 0))); transform: translate(4px, 6px); filter: blur(5px); }
        .cork-board-postcards-shade > i:nth-child(2) { top: 45%; opacity: calc(0.55 * (1 - var(--lift, 0))); transform: translate(13px, 20px) skewX(2deg); filter: blur(16px); }
        .cork-board-postcards-shade > i:nth-child(3) { opacity: calc(0.52 * var(--lift, 0)); transform: translate(36px, 50px) scale(0.97); filter: blur(32px); }
        .cork-board-postcards-pin b { transform: translate(calc(var(--up, 0) * -9px), calc(var(--up, 0) * -15px)) scale(calc(1 + var(--up, 0) * 0.16)); }
        .cork-board-postcards-pin u { transform: translate(calc(5px + var(--up, 0) * 9px), calc(8px + var(--up, 0) * 13px)) scale(calc(1 + var(--up, 0) * 0.25)); opacity: calc(0.6 - var(--up, 0) * 0.22); }
        .cork-board-postcards-pin s { transform: rotate(-31deg) scaleY(var(--up, 0)); }
      `}</style>

      {/* light falling across the board from the top left, and the corners going dim */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 90% at 22% 8%, rgba(255,226,170,0.34), rgba(255,226,170,0) 55%), radial-gradient(140% 120% at 50% 45%, rgba(40,18,0,0) 55%, rgba(40,18,0,0.5) 100%)" }} />

      <div ref={sceneRef} className="absolute left-1/2 top-0 origin-top" style={{ width: L.w, height: L.h, transform: "translateX(-50%)" }}>
        {/* holes left by older pins */}
        {[[0.12, 0.62], [0.31, 0.2], [0.45, 0.83], [0.66, 0.12], [0.72, 0.9], [0.9, 0.52], [0.58, 0.55]].map(([hx, hy], i) => (
          <span key={i} aria-hidden="true" className="absolute h-[5px] w-[5px] rounded-full" style={{ left: `${hx * 100}%`, top: `${hy * 100}%`, background: "radial-gradient(circle at 40% 35%, #1a0c02 0 45%, rgba(26,12,2,0.35) 70%, rgba(26,12,2,0) 100%)", boxShadow: "0.5px 1px 0 rgba(255,225,180,0.35)" }} />
        ))}

        {cards.map((c, i) => {
          const [px, py, hang] = L.homes[i];
          const isOpen = open === i;
          const first = `rotate(${hang}deg) scale(${L.rest})`; // until the frame loop takes over
          return (
            <div key={c.name} ref={(el) => void (wrapRefs.current[i] = el)} className="pointer-events-none absolute inset-0" style={{ perspective: 1700, zIndex: 10 }}>
              <div ref={(el) => void (shadeRefs.current[i] = el)} aria-hidden="true" className="cork-board-postcards-shade absolute" style={{ left: px - CW / 2, top: py - PIN_Y, width: CW, height: CH, transformOrigin: `50% ${PIN_Y}px`, transform: first }}>
                <i />
                <i />
                <i />
              </div>
              <div
                ref={(el) => void (cardRefs.current[i] = el)}
                className="pointer-events-auto absolute cursor-pointer"
                style={{ left: px - CW / 2, top: py - PIN_Y, width: CW, height: CH, transformOrigin: `50% ${PIN_Y}px`, transformStyle: "preserve-3d", transform: first }}
                onClick={() => toggle(i, true)}
              >
                {/* front: the photograph */}
                <div className="absolute inset-0 overflow-hidden rounded-[5px] bg-[#f6f1e7]" style={{ backfaceVisibility: "hidden", boxShadow: "inset 0 0 0 1px rgba(60,40,20,0.18), inset 0 -2px 3px rgba(60,40,20,0.12)" }}>
                  <div className="absolute inset-[13px] overflow-hidden rounded-[1px]" style={{ background: c.photo.tone, boxShadow: "0 0 0 1px rgba(0,0,0,0.14)" }}>
                    <img src={c.photo.src} alt={c.photo.alt} width={314} height={454} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: c.photo.focus }} />
                    <div ref={(el) => void (glareRefs.current[i] = el)} aria-hidden="true" className="absolute -inset-x-1/2 inset-y-0" style={{ background: "linear-gradient(104deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.2) 47%, rgba(255,255,255,0.03) 54%, rgba(255,255,255,0) 62%)" }} />
                    <div aria-hidden="true" className="absolute inset-0" style={{ boxShadow: "inset 0 0 26px rgba(0,0,0,0.2)" }} />
                  </div>
                  <span aria-hidden="true" className="absolute left-1/2 h-[7px] w-[7px] -translate-x-1/2 rounded-full bg-[#1c0e04]" style={{ top: PIN_Y - 3.5, boxShadow: "0 1px 0 rgba(255,255,255,0.5)" }} />
                  <button
                    type="button"
                    tabIndex={isOpen ? -1 : 0}
                    aria-expanded={isOpen}
                    aria-label={`Unpin the postcard from ${c.name} and read the back`}
                    className="absolute inset-0 rounded-[5px] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1c2a5a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e7]"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      toggle(i, true);
                    }}
                  />
                </div>

                {/* back: the note */}
                <figure className="absolute inset-0 m-0 overflow-hidden rounded-[5px] bg-[#f3ead6]" aria-hidden={!isOpen} style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", backgroundImage: `${GRAIN}, linear-gradient(160deg, #f8f1e0, #ecdfc4)`, boxShadow: "inset 0 0 0 1px rgba(90,60,20,0.2), inset 0 0 40px rgba(150,110,50,0.14)" }}>
                  <span aria-hidden="true" className="absolute left-1/2 h-[7px] w-[7px] -translate-x-1/2 rounded-full bg-[#1c0e04]" style={{ top: PIN_Y - 3.5, boxShadow: "0 1px 0 rgba(255,255,255,0.6)" }} />
                  <div aria-hidden="true" className="absolute left-[26px] top-[44px] text-[#8a3a22]">
                    <p className="font-serif text-[19px] font-bold uppercase leading-none tracking-[0.3em]">Post card</p>
                    <p className="mt-[7px] text-[7.5px] font-semibold uppercase tracking-[0.34em] opacity-80">This side for the kind words</p>
                  </div>
                  {/* stamp */}
                  <div aria-hidden="true" className="absolute right-[24px] top-[34px] h-[92px] w-[76px] rotate-[2.5deg]" style={{ background: "radial-gradient(circle at 4px 4px, rgba(251,247,238,0) 0 2.5px, #fbf7ee 3.1px) -4px -4px / 8px 8px", filter: "drop-shadow(0 1px 1.5px rgba(60,30,0,0.4))" }}>
                    <div className="absolute inset-[3px] bg-[#fbf7ee] p-[4px]">
                      <div className="relative h-full w-full overflow-hidden" style={{ background: c.photo.tone }}>
                        <img src={c.photo.src} alt="" width={62} height={78} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: c.photo.focus, filter: "saturate(0.8) contrast(1.06)" }} />
                        <span className="absolute bottom-0 left-0 right-0 bg-[#fbf7ee] pt-[2px] text-center text-[5.5px] font-bold uppercase leading-none tracking-[0.18em] text-[#5b2a1a]">{c.city} 45</span>
                      </div>
                    </div>
                  </div>
                  {/* postmark */}
                  <svg aria-hidden="true" viewBox="0 0 150 80" className="absolute right-[62px] top-[66px] h-[72px] w-[136px] -rotate-[9deg] opacity-[0.72]" fill="none" stroke="#27324f" strokeWidth="1.5">
                    <circle cx="38" cy="40" r="30" />
                    <circle cx="38" cy="40" r="20" strokeWidth="1" />
                    <text x="38" y="38" textAnchor="middle" fontSize="9" fontWeight="700" fill="#27324f" stroke="none" fontFamily="ui-monospace, Menlo, monospace">{c.date}</text>
                    <text x="38" y="49" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#27324f" stroke="none" fontFamily="ui-monospace, Menlo, monospace" letterSpacing="1">{c.city.toUpperCase()}</text>
                    {[20, 30, 40, 50, 60].map((yy) => (
                      <path key={yy} d={`M72 ${yy} q9 -6 18 0 t18 0 t18 0 t18 0`} strokeLinecap="round" />
                    ))}
                  </svg>

                  <blockquote className="absolute left-[28px] right-[26px] top-[150px] m-0 text-[20.5px] leading-[31px]" style={{ fontFamily: HAND, color: INK, backgroundImage: "linear-gradient(rgba(60,80,140,0) 30px, rgba(60,80,140,0.2) 30px)", backgroundSize: "100% 31px", transform: "rotate(-0.7deg)" }}>
                    {c.quote}
                    <span aria-hidden="true" className="mt-[6px] block pr-[6px] text-right text-[27px] leading-[40px]" style={{ transform: "rotate(-4deg)" }}>
                      {c.sign}
                    </span>
                  </blockquote>
                  <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(104deg, rgba(255,255,255,0.4), rgba(255,255,255,0) 36%, rgba(110,70,10,0) 62%, rgba(110,70,10,0.16))" }} />
                  <figcaption className="absolute bottom-[24px] left-[28px] right-[26px] border-t border-[#8a3a22]/50 pt-[11px]">
                    <span className="block text-[8px] font-bold uppercase tracking-[0.32em] text-[#8a3a22]">Sent by</span>
                    <span className="mt-[5px] block font-serif text-[17px] font-semibold leading-tight text-[#2a1c10]">{c.name}</span>
                    <span className="mt-[2px] block text-[10.5px] font-medium uppercase tracking-[0.16em] text-[#4a3524]">
                      {c.role}, {c.company}
                    </span>
                  </figcaption>
                  <button
                    type="button"
                    tabIndex={isOpen ? 0 : -1}
                    aria-label={`Pin the postcard from ${c.name} back on the board`}
                    className="absolute inset-0 rounded-[5px] focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#8a3a22]"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      toggle(i, true);
                    }}
                  />
                </figure>
              </div>
            </div>
          );
        })}

        {/* the pins stay in the board; each lifts to let its card go and presses home when it comes back */}
        {cards.map((c, i) => {
          const [px, py] = L.homes[i];
          const d = Math.round(30 * (tall ? 0.74 : 1));
          return (
            <div key={c.name} ref={(el) => void (pinRefs.current[i] = el)} aria-hidden="true" className="cork-board-postcards-pin pointer-events-none absolute" style={{ left: px - d / 2, top: py - d / 2, width: d, height: d, zIndex: 30 }}>
              <u className="absolute inset-0 rounded-full bg-[#1d0d02] no-underline" style={{ filter: "blur(4px)" }} />
              <s className="absolute left-1/2 top-1/2 -ml-[1px] h-[22px] w-[2px] origin-top no-underline" style={{ marginTop: -22, transformOrigin: "50% 100%", background: "linear-gradient(90deg, #6d6f76, #f4f6fa 45%, #7c7f88)" }} />
              <b className="absolute inset-0 block rounded-full" style={{ background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,0.98) 0 5%, rgba(255,255,255,0.5) 11%, rgba(255,255,255,0) 30%), radial-gradient(circle at 62% 70%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.42) 78%), radial-gradient(circle at 70% 78%, rgba(255,255,255,0.22) 0 10%, rgba(255,255,255,0) 26%), ${c.pin}`, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.18)" }} />
            </div>
          );
        })}
      </div>

      <p className="pointer-events-none absolute bottom-4 left-5 rounded-[2px] bg-[#f6f1e7] px-2.5 py-1.5 text-[9px] font-bold uppercase leading-none tracking-[0.24em] text-[#2a1c10]" style={{ boxShadow: "1px 2px 3px rgba(40,18,0,0.45)", transform: "rotate(-1.2deg)" }}>
        {open === null ? "Press a card to unpin it" : "Press it again to pin it back"}
      </p>
    </section>
  );
}
