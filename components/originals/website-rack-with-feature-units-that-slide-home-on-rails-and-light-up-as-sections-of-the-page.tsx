import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

// The units that slide into the rack, top to bottom. Each one becomes a section of the page when it reaches the back.
const units = [
  { id: "shop", name: "Shop" },
  { id: "blog", name: "Blog" },
  { id: "form", name: "Contact" },
] as const;
const bakery = "Oat & Ember";
const headline = "Bread at seven. Gone by ten.";
const loaves = [
  { name: "Country loaf", price: "$9", bg: "#b08a63", src: "https://images.pexels.com/photos/4444069/pexels-photo-4444069.jpeg?auto=compress&cs=tinysrgb&w=240" },
  { name: "Seeded batard", price: "$8", bg: "#cdb79a", src: "https://images.pexels.com/photos/5567093/pexels-photo-5567093.jpeg?auto=compress&cs=tinysrgb&w=240" },
  { name: "Almond twist", price: "$5", bg: "#c9a273", src: "https://images.pexels.com/photos/13439698/pexels-photo-13439698.jpeg?auto=compress&cs=tinysrgb&w=240" },
];
const heroPhoto = { bg: "#b08a63", src: "https://images.pexels.com/photos/4444069/pexels-photo-4444069.jpeg?auto=compress&cs=tinysrgb&w=600" };

const BLUE = "#4F98FB";
const W = 500, H = 580; // the drawing; scaled as one object
const IW = 300, FR = 14, CW = IW + FR * 2, D = 160; // inner width, frame, cabinet width, depth
const HEAD = 146, UH = 76, GAP = 6;
const CH = FR + HEAD + (UH + GAP) * units.length + GAP + FR;
const OUT = 104; // how far a unit stands proud of the rack when pulled
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const P3 = { transformStyle: "preserve-3d" as const };
const METAL = "linear-gradient(180deg,#2b303c 0%,#171a22 100%)";
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// The glass window in a faceplate. Dark until the unit is home, then the section wipes on behind a blue line.
function Glass({ on, className, children }: { on: boolean; className: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  const t = reduce ? { duration: 0 } : { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number], delay: on ? 0.2 : 0 };
  return (
    <span aria-hidden="true" className={`absolute overflow-hidden rounded-[6px] bg-[#0B0D12] shadow-[inset_0_0_0_1.5px_#000,inset_0_2px_5px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.95)] ${className}`}>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[7.5px] font-bold uppercase tracking-[0.3em] text-[#F6F4EF]/35">Not connected</span>
      <motion.span initial={false} animate={{ clipPath: on ? "inset(0% 0% 0% 0%)" : "inset(0% 100% 0% 0%)" }} transition={t} className="absolute inset-[1.5px] block rounded-[5px] bg-[#fffdf8]">{children}</motion.span>
      <motion.span initial={false} animate={{ left: on ? "100%" : "0%", opacity: on ? [0, 1, 1, 0] : 0 }} transition={t} className="absolute inset-y-0 w-[3px] -translate-x-1/2 bg-[#4F98FB] shadow-[0_0_12px_3px_rgba(79,152,251,0.75)]" />
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.05)_20%,rgba(255,255,255,0)_34%)]" />
    </span>
  );
}

const PLATE = "bg-[#F1EEE7] bg-[linear-gradient(180deg,#ffffff_0%,#f4f1ea_30%,#e3dfd4_100%)] shadow-[inset_0_1px_0_#ffffff,inset_0_-1px_0_rgba(11,13,18,0.25),inset_1px_0_0_rgba(255,255,255,0.8),inset_-1px_0_0_rgba(11,13,18,0.12)]";

export default function WebsiteFeatureRack() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [home, setHome] = useState<boolean[]>(units.map(() => true));
  const [auto, setAuto] = useState(true);
  const [said, setSaid] = useState("");

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1.3, (el.clientWidth - 16) / W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The self-running demo: the units roll home in turn, then one is drawn out and pushed back every few seconds.
  useIsoLayoutEffect(() => {
    if (reduce || !auto) return;
    const ids: number[] = [];
    const at = (ms: number, fn: () => void) => { ids.push(window.setTimeout(fn, ms)); };
    const put = (i: number, v: boolean) => setHome((s) => s.map((x, k) => (k === i ? v : x)));
    setHome(units.map(() => false));
    // The last unit waits outside for a few seconds so the first still picture shows a part on its way in.
    units.forEach((_, i) => at(i === units.length - 1 ? 4300 : 300 + i * 420, () => put(i, true)));
    let n = 0;
    const cycle = () => {
      const i = [1, 0, 2][n++ % 3];
      put(i, false);
      at(2600, () => put(i, true));
      at(5600, cycle);
    };
    at(7800, cycle);
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [reduce, auto]);

  const toggle = (i: number) => {
    setAuto(false);
    setHome((s) => s.map((x, k) => (k === i ? !x : x)));
    setSaid(`${units[i].name} unit ${home[i] ? "drawn out" : "pushed home"}.`);
  };

  // The rack turns a few degrees towards the pointer.
  const px = useMotionValue(-26), py = useMotionValue(-21);
  const rotateY = useSpring(px, { stiffness: 90, damping: 16 }), rotateX = useSpring(py, { stiffness: 90, damping: 16 });
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType === "touch") return;
    const b = e.currentTarget.getBoundingClientRect();
    px.set(-26 + ((e.clientX - b.left) / b.width - 0.5) * 12);
    py.set(-21 + ((e.clientY - b.top) / b.height - 0.5) * 8);
  };

  const content: Record<string, ReactNode> = {
    shop: (
      <span className="grid h-full grid-cols-3 gap-[5px] p-[5px]">
        {loaves.map((l) => (
          <span key={l.name} className="flex items-center gap-[5px]">
            <span className="h-full w-[30px] shrink-0 overflow-hidden rounded-[4px]" style={{ background: l.bg }}><img src={l.src} alt="" width={30} height={48} className="h-full w-full object-cover" /></span>
            <span className="min-w-0">
              <span className="block text-[8px] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#0B0D12]">{l.name}</span>
              <span className="mt-[2px] flex items-center gap-[4px]"><span className="text-[8px] font-bold text-[#0B0D12]/65">{l.price}</span><span className="rounded-full bg-[#4F98FB] px-[4px] py-[1px] text-[6px] font-extrabold text-[#0B0D12]">Add</span></span>
            </span>
          </span>
        ))}
      </span>
    ),
    blog: (
      <span className="flex h-full items-center gap-[8px] p-[5px]">
        <span className="h-full w-[62px] shrink-0 overflow-hidden rounded-[4px]" style={{ background: loaves[1].bg }}><img src={loaves[1].src} alt="" width={62} height={48} className="h-full w-full object-cover" /></span>
        <span className="flex-1">
          <span className="block text-[6.5px] font-bold uppercase tracking-[0.18em] text-[#0B0D12]/60">From the bakehouse</span>
          <span className="block text-[12px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#0B0D12]">How we feed the starter</span>
          <span className="mt-[4px] block h-[2.5px] w-[92px] rounded-full bg-[#0B0D12]/15" />
        </span>
      </span>
    ),
    form: (
      <span className="flex h-full items-center gap-[6px] p-[6px]">
        <span className="flex flex-1 flex-col gap-[4px]">
          <span className="flex h-[19px] items-center rounded-[4px] bg-[#0B0D12]/[0.06] px-[6px] text-[7.5px] font-semibold text-[#0B0D12]/60 shadow-[inset_0_0_0_1px_rgba(11,13,18,0.1)]">Your name</span>
          <span className="flex h-[19px] items-center rounded-[4px] bg-[#0B0D12]/[0.06] px-[6px] text-[7.5px] font-semibold text-[#0B0D12]/60 shadow-[inset_0_0_0_1px_rgba(11,13,18,0.1)]">Order a cake for Saturday</span>
        </span>
        <span className="rounded-full bg-[#4F98FB] px-[11px] py-[6px] text-[8.5px] font-extrabold text-[#0B0D12] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">Send</span>
      </span>
    ),
  };

  return (
    <div ref={root} onPointerMove={onMove} onPointerLeave={() => { px.set(-26); py.set(-21); }} style={{ fontFamily: FONT }} className="relative flex min-h-[500px] w-full items-center justify-center overflow-hidden bg-[#D7E3F4] bg-[radial-gradient(80%_62%_at_50%_42%,#f3f8ff_0%,#D7E3F4_50%,#b9cbe4_100%)] py-6 sm:min-h-[820px]">
      <div style={{ width: W * scale, height: H * scale }} className="relative">
        <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0", perspective: 1700 }} className="absolute left-0 top-0">
          <motion.div style={{ ...P3, width: CW, height: CH, left: (W - CW) / 2 + 22, top: (H - CH) / 2 + 22, rotateX: reduce ? -21 : rotateX, rotateY: reduce ? -26 : rotateY }} className="absolute">
            {/* shadow lying on the table */}
            <span aria-hidden="true" style={{ width: CW + 120, height: D + 190, left: -60, top: CH, transformOrigin: "50% 0", transform: `translateZ(${-(D + 40)}px) rotateX(90deg)` }} className="absolute rounded-[40px] bg-[radial-gradient(closest-side,rgba(20,34,60,0.62),rgba(20,34,60,0.3)_60%,rgba(20,34,60,0))] blur-[10px]" />

            {/* inside of the cabinet */}
            <span aria-hidden="true" style={{ width: CW, height: CH, transform: `translateZ(${-(D - 2)}px)` }} className="absolute left-0 top-0 bg-[#050609]" />
            {/* top of the cabinet */}
            <span aria-hidden="true" style={{ width: CW, height: D, transformOrigin: "50% 0", transform: `translateZ(${-D}px) rotateX(90deg)` }} className="absolute left-0 top-0 rounded-[3px] bg-[#59606e] bg-[linear-gradient(90deg,#7c8494_0%,#5d6473_45%,#4a505e_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]">
              <i className="absolute inset-0 opacity-60 [background:repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0_1px,rgba(0,0,0,0.06)_1px_3px)]" />
              <i className="absolute inset-x-[90px] top-[58px] h-[44px] rounded-[10px] bg-[#1d2029] shadow-[inset_0_2px_3px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.2)]" />
            </span>
            {/* right side of the cabinet with cooling slots */}
            <span aria-hidden="true" style={{ width: D, height: CH, left: CW, transformOrigin: "0 50%", transform: "rotateY(90deg)" }} className="absolute top-0 rounded-[3px] bg-[#161a22] bg-[linear-gradient(90deg,#2a2f3b_0%,#1a1e27_30%,#10131a_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_1px_0_0_rgba(255,255,255,0.22),inset_0_0_0_1px_rgba(255,255,255,0.06)]">
              <i className="absolute left-[34px] top-[40px] h-[120px] w-[92px] opacity-90 [background:repeating-linear-gradient(180deg,#040507_0_4px,transparent_4px_11px)]" />
              <i className="absolute left-[34px] top-[41px] h-[120px] w-[92px] opacity-30 [background:repeating-linear-gradient(180deg,transparent_0_4px,#ffffff_4px_5px,transparent_5px_11px)]" />
            </span>

            {/* front frame, in strips so nothing cuts through the sliding units */}
            <span aria-hidden="true" style={{ width: CW, height: FR, background: METAL }} className="absolute left-0 top-0 rounded-t-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]" />
            <span aria-hidden="true" style={{ width: CW, height: FR, top: CH - FR, background: METAL }} className="absolute left-0" />
            <span aria-hidden="true" style={{ width: FR, height: CH, background: METAL }} className="absolute left-0 top-0 shadow-[inset_1px_0_0_rgba(255,255,255,0.2)]" />
            <span aria-hidden="true" style={{ width: FR, height: CH, left: CW - FR, background: METAL }} className="absolute top-0 shadow-[inset_-1px_0_0_rgba(255,255,255,0.28)]" />
            {units.map((u, i) => <span key={u.id} aria-hidden="true" style={{ width: IW, height: GAP, left: FR, top: FR + HEAD + i * (UH + GAP) }} className="absolute bg-[#07080b]" />)}
            <span aria-hidden="true" style={{ width: IW, height: GAP, left: FR, top: CH - FR - GAP }} className="absolute bg-[#07080b]" />
            {/* rack-ear holes */}
            {[0, 1].map((side) => (
              <span key={side} aria-hidden="true" style={{ left: side ? CW - FR + 4 : 4, top: FR + 6, height: CH - FR * 2 - 12 }} className="absolute w-[6px] [background:repeating-linear-gradient(180deg,#000_0_5px,transparent_5px_19px)]" />
            ))}

            {/* the fixed head of the page: menu and hero */}
            <div aria-hidden="true" style={{ width: IW, height: HEAD, left: FR, top: FR }} className={`absolute rounded-[3px] ${PLATE}`}>
              <span className="absolute inset-[7px] overflow-hidden rounded-[6px] bg-[#fffdf8] shadow-[0_0_0_1.5px_#0B0D12,0_1px_0_2px_rgba(255,255,255,0.9)]">
                <span className="flex h-[24px] items-center justify-between px-[9px]">
                  <span className="text-[10.5px] font-extrabold tracking-[-0.03em] text-[#0B0D12]">{bakery}</span>
                  <span className="flex gap-[9px] text-[7.5px] font-bold text-[#0B0D12]/75">
                    {units.map((u, i) => <span key={u.id} className="transition-opacity duration-300 motion-reduce:transition-none" style={{ opacity: home[i] ? 1 : 0.22 }}>{u.name}</span>)}
                  </span>
                </span>
                <span className="absolute inset-x-[5px] bottom-[5px] top-[24px] overflow-hidden rounded-[5px]" style={{ background: heroPhoto.bg }}>
                  <img src={heroPhoto.src} alt="" width={276} height={103} className="absolute inset-0 h-full w-full object-cover object-[60%_55%]" />
                  <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,13,18,0.78)_0%,rgba(11,13,18,0.4)_50%,rgba(11,13,18,0)_82%)]" />
                  <span className="absolute left-[10px] top-[14px] w-[136px] text-[18px] font-extrabold leading-[1.02] tracking-[-0.045em] text-white">{headline}</span>
                  <span className="absolute bottom-[10px] left-[10px] rounded-full bg-[#4F98FB] px-[8px] py-[3px] text-[7.5px] font-extrabold text-[#0B0D12]">Today's bake</span>
                </span>
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0.05)_20%,rgba(255,255,255,0)_34%)]" />
              </span>
            </div>

            {/* the sliding units */}
            {units.map((u, i) => (
              <motion.div
                key={u.id}
                initial={false}
                animate={{ z: home[i] ? 2 : OUT }}
                transition={reduce ? { duration: 0 } : home[i] ? { type: "spring", stiffness: 260, damping: 22, mass: 1 } : { type: "spring", stiffness: 150, damping: 17, mass: 1 }}
                style={{ ...P3, width: IW, height: UH, left: FR, top: FR + HEAD + GAP + i * (UH + GAP) }}
                className="absolute"
              >
                {/* top of the unit: brushed lid with a paper label you only see when it is out */}
                <span aria-hidden="true" style={{ width: IW, height: D, transformOrigin: "50% 0", transform: `translateZ(${-D}px) rotateX(90deg)` }} className="absolute left-0 top-[1px] bg-[#c9c5ba] bg-[linear-gradient(90deg,#f1eee7_0%,#d9d5ca_45%,#c3bfb3_100%)] shadow-[inset_0_0_0_1px_rgba(11,13,18,0.18)]">
                  <i className="absolute inset-0 opacity-70 [background:repeating-linear-gradient(90deg,rgba(255,255,255,0.22)_0_1px,rgba(0,0,0,0.035)_1px_3px)]" />
                  <span className="absolute bottom-[14px] left-[14px] flex h-[78px] w-[168px] items-center justify-between rounded-[3px] bg-[#fffdf8] px-[12px] shadow-[0_1px_2px_rgba(11,13,18,0.35),inset_0_0_0_1px_rgba(11,13,18,0.08)]">
                    <span className="origin-left scale-y-[2.3] text-[20px] font-extrabold uppercase tracking-[-0.02em] text-[#0B0D12]">{u.name}</span>
                    <span className="h-[30px] w-[13px] rounded-full bg-[#4F98FB]" />
                  </span>
                  <span className="absolute bottom-[34px] right-[18px] scale-y-[2.3] font-mono text-[12px] font-bold tracking-[0.2em] text-[#0B0D12]/60">U{i + 1}</span>
                  <i className="absolute bottom-[4px] left-1/2 h-[5px] w-[70px] -translate-x-1/2 rounded-full bg-[#0B0D12]/25 shadow-[0_1px_0_rgba(255,255,255,0.7)]" />
                </span>
                {/* right side of the unit with its slide rail */}
                <span aria-hidden="true" style={{ width: D, height: UH, left: IW, transformOrigin: "0 50%", transform: "rotateY(90deg)" }} className="absolute top-0 bg-[#8d897f] bg-[linear-gradient(180deg,#a7a398_0%,#8d897f_50%,#77736a_100%)] shadow-[inset_0_0_0_1px_rgba(11,13,18,0.25)]">
                  <i className="absolute inset-x-0 top-[30px] h-[16px] bg-[linear-gradient(180deg,#30343f_0%,#6f7684_30%,#d5d9e0_50%,#59606d_70%,#1c1f27_100%)]" />
                  <i className="absolute left-[10px] top-[35px] h-[6px] w-[6px] rounded-full bg-[#0B0D12]" />
                  <i className="absolute left-[60px] top-[35px] h-[6px] w-[6px] rounded-full bg-[#0B0D12]" />
                </span>
                {/* faceplate */}
                <button
                  type="button"
                  aria-pressed={home[i]}
                  aria-label={`${u.name} unit`}
                  onClick={() => toggle(i)}
                  className={`group absolute inset-0 cursor-pointer rounded-[3px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12] ${PLATE}`}
                >
                  {/* handle on two standoffs */}
                  <span aria-hidden="true" className="absolute left-[11px] top-[14px] h-[48px] w-[13px] rounded-full bg-[linear-gradient(90deg,#4a505d_0%,#1a1d25_45%,#0B0D12_100%)] shadow-[inset_1px_0_0_rgba(255,255,255,0.35),4px_3px_5px_rgba(11,13,18,0.4)] transition-transform duration-200 group-hover:translate-x-[-2px] motion-reduce:transition-none" />
                  <span aria-hidden="true" style={{ background: home[i] ? `radial-gradient(circle at 35% 30%, #e1eeff 0%, ${BLUE} 55%, #2d62ae 100%)` : "radial-gradient(circle at 35% 30%, #8c887d 0%, #55524a 70%)", boxShadow: home[i] ? "0 0 9px 2px rgba(79,152,251,0.8), inset 0 0 0 1px rgba(11,13,18,0.3)" : "inset 0 1px 1px rgba(0,0,0,0.5), 0 1px 0 #ffffff", transitionDelay: home[i] ? "180ms" : "0ms" }} className="absolute left-[34px] top-[12px] h-[7px] w-[7px] rounded-full transition-[background,box-shadow] duration-200 motion-reduce:transition-none" />
                  <span aria-hidden="true" className="absolute bottom-[10px] left-[31px] font-mono text-[7.5px] font-bold tracking-[0.12em] text-[#0B0D12]/70">U{i + 1}</span>
                  <Glass on={home[i]} className="bottom-[7px] left-[50px] right-[7px] top-[7px]">{content[u.id]}</Glass>
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">{said}</p>
    </div>
  );
}
