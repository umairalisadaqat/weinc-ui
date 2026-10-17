import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/** What is printed on the box, and the two photographs: the pair on the tissue and the print inside the lid. */
const pair = {
  maker: "Halden and Rook",
  style: "Derby 204",
  colour: "Chestnut calf",
  size: "EU 43",
  price: "£245",
  shoes: { src: "https://images.pexels.com/photos/15059774/pexels-photo-15059774.jpeg?auto=compress&cs=tinysrgb&w=1100", alt: "Pair of brown leather lace-up shoes seen from above on a white sheet" },
  print: { src: "https://images.pexels.com/photos/9953932/pexels-photo-9953932.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Man in a red suit and a blue hat holding a red flower against a yellow wall", tone: "#d9a92a", focus: "50% 40%" },
};

// Design pixels in the box's own space: x runs along the box, y from the hinge toward you, z up off the table.
const W = 404;
const DP = 300;
const H = 114;
const BOARD = 5; // thickness of the card
const LIP = 46; // depth of the lid's skirt
const LID_OPEN = 97; // degrees the lid swings back
const FLAP_A = 114; // tissue: the panel fixed along the wall
const FLAP_B = 104; // tissue: the loose outer panel
const SCENE_W = 900;
const SCENE_H = 740;
const TURN = 26;
const TIP = 47;

const BLUE = "#2146b4";
const BLUE_DARK = "#152f86";
const CARD = "#d9d2c4"; // raw board on the inside

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const svg = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

// crumpled tissue: noise lit from one side, so the creases have a bright and a dark face
const CRINKLE = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='t' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.03 0.038' numOctaves='3' seed='11'/><feDiffuseLighting surfaceScale='4.2' diffuseConstant='1.2' lighting-color='#fffdf8'><feDistantLight azimuth='215' elevation='56'/></feDiffuseLighting></filter><rect width='320' height='320' filter='url(#t)'/></svg>",
);
// the tooth of printed board
const TOOTH = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' seed='3'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 0.62'/></filter><rect width='160' height='160' filter='url(#n)'/></svg>",
);

const tissue = { backgroundColor: "#fbf9f4", backgroundImage: CRINKLE, backgroundSize: "320px 320px" } as const;

export default function ShoeboxWithTissue() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const live = useRef({ open: false, paused: false, touched: false });

  const lid = useSpring(0, { stiffness: 58, damping: 8.5, mass: 1.15 });
  const part = useSpring(0, { stiffness: 46, damping: 7.5, mass: 1 });
  const curl = useSpring(0, { stiffness: 30, damping: 4.6, mass: 1 });
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rz = useSpring(useTransform(px, (v) => TURN + v * 5), { stiffness: 60, damping: 14 });
  const rx = useSpring(useTransform(py, (v) => TIP - v * 4), { stiffness: 60, damping: 14 });

  const lidTransform = useTransform(lid, (v) => `translateZ(${H + 3}px) rotateX(${v.toFixed(2)}deg)`);
  const lidShade = useTransform(lid, (v) => 0.5 - clamp(v / 90, 0, 1) * 0.5);
  const inGloss = useTransform(lid, (v) => clamp((v - 60) / 50, 0, 1));
  const boxShade = useTransform(lid, (v) => 0.62 - clamp(v / 70, 0, 1) * 0.62);
  const leftA = useTransform(part, (v) => `translateZ(${H - 5}px) rotateY(${(-(3 + v * 101)).toFixed(2)}deg)`);
  const rightA = useTransform(part, (v) => `translateZ(${H - 3.5}px) rotateY(${(2 + v * 128).toFixed(2)}deg)`);
  const leftB = useTransform(curl, (v) => `rotateY(${(4 - v * 49).toFixed(2)}deg)`);
  const rightB = useTransform(curl, (v) => `rotateY(${(-3 + v * 30).toFixed(2)}deg)`);
  const tissueShadow = useTransform(part, (v) => 0.3 * (1 - clamp(v * 1.6, 0, 1)));

  const swing = useCallback(
    (to: boolean) => {
      live.current.open = to;
      setOpen(to);
      if (reduce) {
        lid.jump(to ? LID_OPEN : 0);
        part.jump(to ? 1 : 0);
        curl.jump(to ? 1 : 0);
      } else if (to) lid.set(LID_OPEN);
      else part.set(0);
    },
    [curl, lid, part, reduce],
  );

  // the tissue waits for the lid to clear, and the lid waits for the tissue to be folded back
  useEffect(() => {
    if (reduce) return;
    const a = lid.on("change", (v) => live.current.open && v > 52 && part.set(1));
    const b = part.on("change", (v) => {
      curl.set(v);
      if (!live.current.open && v < 0.32) lid.set(0);
    });
    return () => {
      a();
      b();
    };
  }, [curl, lid, part, reduce]);

  useEffect(() => {
    if (reduce) {
      swing(true);
      return;
    }
    const s = live.current;
    let n = 0;
    const first = window.setTimeout(() => swing(true), 260);
    const loop = window.setInterval(() => {
      if (s.paused || s.touched || document.hidden) return;
      n += 1;
      swing(n % 4 !== 3);
    }, 2700);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
    };
  }, [reduce, swing]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    if (!wrap || !scene) return;
    const measure = () => {
      const sc = clamp(wrap.clientWidth / (SCENE_W - 70), 0.44, 1);
      wrap.style.height = `${Math.round(SCENE_H * sc + 70)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const toggle = () => {
    live.current.touched = true;
    swing(!live.current.open);
  };
  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  const LW = W + 8; // the lid is a little bigger than the box it covers
  const LD = DP + 6;
  const flapSpan = { top: BOARD + 2, height: DP - BOARD * 2 - 4 };
  const boardFace = { backgroundColor: BLUE, backgroundImage: TOOTH } as const;

  return (
    <section className="relative overflow-hidden bg-[#e4dccb]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 62% at 46% 40%, #f3ede0 0%, #e6dfcf 48%, #cfc5b0 100%)" }} />
      <div
        ref={wrapRef}
        onPointerMove={onMove}
        onPointerEnter={() => (live.current.paused = true)}
        onPointerLeave={() => {
          live.current.paused = false;
          px.set(0);
          py.set(0);
        }}
        onFocus={() => (live.current.paused = true)}
        onBlur={() => (live.current.paused = false)}
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: SCENE_H + 70 }}
      >
        <div ref={sceneRef} className="absolute left-1/2 top-0 select-none" style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "2400px", perspectiveOrigin: "50% 36%" }}>
          <motion.div className="absolute" style={{ left: SCENE_W / 2 - W / 2 + 6, top: SCENE_H / 2 - DP / 2 + 146, width: W, height: DP, transformStyle: "preserve-3d", rotateX: rx, rotateZ: rz }}>
            {/* shadow on the table: a wide soft one and a tight dark one under the base */}
            <div aria-hidden="true" className="absolute rounded-[20px] bg-[#3a2c12]" style={{ left: 10, top: -30, width: W + 96, height: DP + 78, filter: "blur(34px)", opacity: 0.34 }} />
            <div aria-hidden="true" className="absolute bg-[#221806]" style={{ left: 3, top: 2, width: W + 8, height: DP + 8, filter: "blur(7px)", opacity: 0.6 }} />

            {/* base of the box */}
            <div className="absolute inset-0" style={{ transform: "translateZ(1px)", background: "#b9b1a1" }} />
            {/* far wall, seen from the inside */}
            <div className="absolute overflow-hidden" style={{ left: 0, top: -H, width: W, height: H, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", backgroundColor: CARD, backgroundImage: TOOTH }}>
              <div className="absolute inset-x-0 bottom-0" style={{ ...tissue, height: H - 26, backgroundPosition: "40px 10px", clipPath: "polygon(0 14%, 9% 4%, 21% 11%, 34% 0, 48% 9%, 61% 3%, 74% 12%, 88% 2%, 100% 10%, 100% 100%, 0 100%)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(40,30,12,0) 0%, rgba(40,30,12,0.06) 45%, rgba(40,30,12,0.34) 100%)" }} />
            </div>
            {/* near wall, the printed outside */}
            <div className="absolute overflow-hidden" style={{ left: 0, top: DP - H, width: W, height: H, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", ...boardFace }}>
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.04) 5px, rgba(0,0,10,0) 46%, rgba(0,0,20,0.36) 100%)" }} />
              <div className="absolute bottom-[14px] left-[18px] font-mono text-[8px] font-semibold uppercase leading-[1.7] tracking-[0.24em] text-[#e9eeff]/80">
                {pair.maker}
                <span className="block text-[#e9eeff]/55">Made on a wooden last</span>
              </div>
              <motion.div className="absolute inset-x-0 top-0 h-[60px]" style={{ opacity: boxShade, background: "linear-gradient(180deg, rgba(0,0,20,0.5), rgba(0,0,20,0))" }} />
            </div>
            {/* left end from the inside, right end from the outside */}
            <div className="absolute overflow-hidden" style={{ left: -H, top: 0, width: H, height: DP, transformOrigin: "100% 50%", transform: "rotateY(90deg)", backgroundColor: CARD, backgroundImage: TOOTH }}>
              <div className="absolute inset-y-0 right-0" style={{ ...tissue, width: H - 26, backgroundPosition: "120px 60px", clipPath: "polygon(12% 0, 3% 12%, 10% 26%, 0 41%, 9% 55%, 2% 70%, 11% 86%, 4% 100%, 100% 100%, 100% 0)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(40,30,12,0.05) 0%, rgba(40,30,12,0.1) 50%, rgba(40,30,12,0.4) 100%)" }} />
            </div>
            <div className="absolute overflow-hidden" style={{ left: W - H, top: 0, width: H, height: DP, transformOrigin: "100% 50%", transform: "rotateY(90deg)", backgroundColor: BLUE_DARK, backgroundImage: TOOTH }}>
              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.02) 6px, rgba(0,0,20,0) 50%, rgba(0,0,20,0.4) 100%)" }} />
              {/* the size label every shoebox carries on its end */}
              <div className="absolute left-[50px] top-1/2 w-[150px] -translate-y-1/2 bg-[#f6f2e8] px-[10px] py-[8px] text-[#1b1b1b]" style={{ transform: "translateY(-50%) rotate(-90deg)", transformOrigin: "50% 50%", left: -24, boxShadow: "0 0 0 0.5px rgba(0,0,0,0.3)" }}>
                <div className="flex items-baseline justify-between font-mono text-[7px] font-semibold uppercase tracking-[0.18em]">
                  <span>{pair.style}</span>
                  <span>{pair.size}</span>
                </div>
                <div className="mt-[3px] font-mono text-[6.5px] uppercase tracking-[0.16em] text-neutral-600">{pair.colour}</div>
                <div className="mt-[5px] h-[13px]" style={{ background: "repeating-linear-gradient(90deg, #111 0 1.5px, transparent 1.5px 3px, #111 3px 4px, transparent 4px 7px, #111 7px 9.5px, transparent 9.5px 11px)" }} />
              </div>
            </div>

            {/* the bed of tissue with the pair lying on it */}
            <div className="absolute overflow-hidden" style={{ left: BOARD, top: BOARD, width: W - BOARD * 2, height: DP - BOARD * 2, transform: "translateZ(12px)", ...tissue, isolation: "isolate" }}>
              <img src={pair.shoes.src} alt={pair.shoes.alt} draggable={false} className="absolute max-w-none" style={{ width: 510, height: 340, left: -50, top: -48, mixBlendMode: "multiply", filter: "sepia(0.3) brightness(1.15) contrast(1.1) saturate(1.1)" }} />
              <div aria-hidden="true" className="absolute inset-0" style={{ boxShadow: "inset 0 -34px 40px -18px rgba(50,36,14,0.5), inset -30px 0 36px -18px rgba(50,36,14,0.42), inset 14px 0 22px -14px rgba(50,36,14,0.2), inset 0 12px 20px -12px rgba(50,36,14,0.16)" }} />
              <motion.div aria-hidden="true" className="absolute inset-0 bg-[#2c2110]" style={{ opacity: tissueShadow }} />
            </div>

            {/* cut edge of the board round the top of the box */}
            <div aria-hidden="true" className="absolute inset-0" style={{ transform: `translateZ(${H}px)`, border: `${BOARD}px solid #e9e3d6`, boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(0,0,30,0.4)" }} />

            {/* tissue: two sheets folded over the pair, each in two panels so the paper can curl */}
            <motion.div className="absolute" style={{ left: BOARD, ...flapSpan, width: FLAP_A, transformOrigin: "0 50%", transformStyle: "preserve-3d", transform: leftA }}>
              <div className="absolute inset-0" style={{ ...tissue, opacity: 0.93, backgroundPosition: "0 0" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(60,44,20,0.2), rgba(60,44,20,0) 40%, rgba(255,255,255,0.3) 100%)" }} />
              <motion.div className="absolute top-0 h-full" style={{ left: FLAP_A - 0.5, width: FLAP_B, transformOrigin: "0 50%", transform: leftB }}>
                <div className="absolute inset-0" style={{ ...tissue, opacity: 0.9, backgroundPosition: `${-FLAP_A}px 0`, clipPath: "polygon(0 0, 97% 0, 100% 9%, 95% 22%, 99% 37%, 94% 52%, 100% 66%, 96% 81%, 99% 93%, 95% 100%, 0 100%)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(60,44,20,0.14), rgba(255,255,255,0.22) 30%, rgba(60,44,20,0.1) 100%)", clipPath: "polygon(0 0, 97% 0, 100% 9%, 95% 22%, 99% 37%, 94% 52%, 100% 66%, 96% 81%, 99% 93%, 95% 100%, 0 100%)" }} />
              </motion.div>
            </motion.div>
            <motion.div className="absolute" style={{ left: W - BOARD - FLAP_A, ...flapSpan, width: FLAP_A, transformOrigin: "100% 50%", transformStyle: "preserve-3d", transform: rightA }}>
              <div className="absolute inset-0" style={{ ...tissue, opacity: 0.93, backgroundPosition: "-190px -40px" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(270deg, rgba(60,44,20,0.24), rgba(60,44,20,0) 40%, rgba(255,255,255,0.3) 100%)" }} />
              <motion.div className="absolute top-0 h-full" style={{ left: -FLAP_B + 0.5, width: FLAP_B, transformOrigin: "100% 50%", transformStyle: "preserve-3d", transform: rightB }}>
                <div className="absolute inset-0" style={{ ...tissue, opacity: 0.92, backgroundPosition: "-86px -40px", clipPath: "polygon(4% 0, 100% 0, 100% 100%, 6% 100%, 1% 90%, 5% 76%, 0 61%, 6% 47%, 2% 32%, 5% 17%, 0 7%)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(270deg, rgba(60,44,20,0.14), rgba(255,255,255,0.22) 30%, rgba(60,44,20,0.12) 100%)", clipPath: "polygon(4% 0, 100% 0, 100% 100%, 6% 100%, 1% 90%, 5% 76%, 0 61%, 6% 47%, 2% 32%, 5% 17%, 0 7%)" }} />
                {/* the seal that held the two sheets together */}
                <div className="absolute grid h-[46px] w-[46px] place-items-center rounded-full text-center font-mono text-[5.5px] font-bold uppercase leading-[1.5] tracking-[0.16em] text-[#fff3ee]" style={{ left: 5, top: "50%", marginTop: -23, transform: "translateZ(0.6px)", background: "radial-gradient(circle at 34% 28%, #ef5a3c, #cf3018 62%, #a8200e)", boxShadow: "0 1px 2px rgba(60,20,0,0.45), inset 0 0 0 2.5px rgba(255,240,230,0.0), inset 0 0 0 3.5px rgba(255,240,230,0.55)" }}>
                  <span>
                    H&amp;R
                    <br />
                    204
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* the lid, hinged along the far edge */}
            <motion.div className="absolute" style={{ left: -4, top: -1, width: LW, height: LD, transformOrigin: "50% 0", transformStyle: "preserve-3d", transform: lidTransform }}>
              {/* skirts: front and the two ends */}
              <div className="absolute overflow-hidden" style={{ left: 0, top: LD, width: LW, height: LIP, transformOrigin: "50% 0", transform: "rotateX(-90deg)", ...boardFace }}>
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.26) 0, rgba(255,255,255,0.05) 4px, rgba(0,0,20,0.04) 60%, rgba(0,0,20,0.3) 100%)" }} />
              </div>
              <div className="absolute" style={{ left: LW, top: 0, width: LIP, height: LD, transformOrigin: "0 50%", transform: "rotateY(90deg)", backgroundColor: BLUE_DARK, backgroundImage: TOOTH }}>
                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.03) 4px, rgba(0,0,20,0.3) 100%)" }} />
              </div>
              <div className="absolute" style={{ left: -LIP, top: 0, width: LIP, height: LD, transformOrigin: "100% 50%", transform: "rotateY(-90deg)", backgroundColor: BLUE_DARK, backgroundImage: TOOTH }} />
              {/* outside of the lid */}
              <button
                type="button"
                onClick={toggle}
                tabIndex={open ? -1 : 0}
                aria-label={`Lift the lid of the ${pair.maker} shoebox`}
                className="absolute inset-0 block cursor-pointer overflow-hidden outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white"
                style={{ ...boardFace, backfaceVisibility: "hidden" }}
              >
                <span className="absolute left-[30px] top-[30px] text-left text-[30px] font-black uppercase leading-[0.92] tracking-[-0.02em] text-[#f4f1e8]">
                  Halden
                  <br />
                  <span className="font-light italic normal-case tracking-[-0.01em]">and</span> Rook
                </span>
                <span className="absolute bottom-[28px] left-[30px] font-mono text-[8.5px] font-semibold uppercase leading-[1.8] tracking-[0.26em] text-[#e9eeff]/80">
                  {pair.style}
                  <span className="block">{pair.colour}</span>
                </span>
                <span className="absolute bottom-[28px] right-[30px] grid h-[58px] w-[58px] place-items-center rounded-full font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#f4f1e8]" style={{ boxShadow: "inset 0 0 0 1.5px rgba(244,241,232,0.85)" }}>
                  {pair.size.replace("EU ", "")}
                </span>
                <span aria-hidden="true" className="absolute inset-[12px]" style={{ border: "1px solid rgba(244,241,232,0.5)" }} />
                <span aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(128deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.04) 30%, rgba(0,0,30,0) 58%, rgba(0,0,30,0.26) 100%)" }} />
                <span aria-hidden="true" className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22), inset 0 -4px 6px rgba(0,0,30,0.22), inset 0 3px 5px rgba(255,255,255,0.16)" }} />
                <motion.span aria-hidden="true" className="absolute inset-0 bg-black" style={{ opacity: lidShade }} />
              </button>
              {/* inside of the lid: raw board with a print pasted in */}
              <button
                type="button"
                onClick={toggle}
                tabIndex={open ? 0 : -1}
                aria-label={`Close the lid of the ${pair.maker} shoebox`}
                className="absolute inset-0 block cursor-pointer overflow-hidden outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#2146b4]"
                style={{ transform: "rotateX(180deg) translateZ(1px)", backfaceVisibility: "hidden", backgroundColor: CARD, backgroundImage: TOOTH }}
              >
                <span className="absolute overflow-hidden" style={{ left: 16, right: 16, top: 16, bottom: 40, background: pair.print.tone, boxShadow: "0 0 0 0.5px rgba(0,0,0,0.35), 0 1px 3px rgba(40,28,8,0.35)" }}>
                  <img src={pair.print.src} alt={pair.print.alt} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: pair.print.focus }} />
                </span>
                <span className="absolute inset-x-[18px] bottom-[15px] flex items-baseline justify-between font-mono text-[8px] font-semibold uppercase tracking-[0.22em] text-[#3d372b]">
                  <span>Autumn, plate 3</span>
                  <span>
                    {pair.style} / {pair.price}
                  </span>
                </span>
                <motion.span aria-hidden="true" className="absolute inset-0" style={{ opacity: inGloss, background: "linear-gradient(200deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 34%, rgba(40,28,8,0) 62%, rgba(40,28,8,0.22) 100%)" }} />
              </button>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 sm:bottom-8 sm:left-8 sm:right-8">
          <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#5b513e]">
            <span className="text-[#1d1a14]">
              {pair.style}, {pair.colour}
            </span>
            <span className="block">
              {pair.size} / {pair.price}
            </span>
          </p>
          <button
            type="button"
            onClick={toggle}
            aria-pressed={open}
            className="min-h-[40px] shrink-0 rounded-full border border-[#1d1a14]/25 bg-[#f6f1e6]/70 px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[#1d1a14] outline-none transition-colors hover:bg-[#f6f1e6] focus-visible:ring-2 focus-visible:ring-[#2146b4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4dccb]"
          >
            {open ? "Close the box" : "Open the box"}
          </button>
        </div>
      </div>
    </section>
  );
}
