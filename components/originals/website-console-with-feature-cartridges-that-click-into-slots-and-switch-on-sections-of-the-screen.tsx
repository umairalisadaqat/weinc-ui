import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

// One cartridge per feature. `shell` is the plastic colour, `ink` the colour of the moulded name on its top band.
const carts = [
  { id: "book", name: "Bookings", code: "A", shell: ["#6aabff", "#4F98FB", "#3b7fdc"], edge: "#2d62ae", ink: "#0B0D12" },
  { id: "shop", name: "Shop", code: "B", shell: ["#2a2f3c", "#161a23", "#0B0D12"], edge: "#030406", ink: "#F6F4EF" },
  { id: "blog", name: "Journal", code: "C", shell: ["#e9e5dc", "#d8d3c7", "#c6c1b4"], edge: "#a39e91", ink: "#0B0D12" },
] as const;
const shopName = "Marlow & Fern";
const days = ["Thu 12", "Fri 13", "Sat 14", "Sun 15"];
const products = [
  { name: "White tulips", price: "$28", src: "https://images.pexels.com/photos/33934121/pexels-photo-33934121.jpeg?auto=compress&cs=tinysrgb&w=240", bg: "#d9cdb8" },
  { name: "Blush bunch", price: "$34", src: "https://images.pexels.com/photos/8393921/pexels-photo-8393921.jpeg?auto=compress&cs=tinysrgb&w=240", bg: "#3a3440" },
  { name: "Dried posy", price: "$22", src: "https://images.pexels.com/photos/9957266/pexels-photo-9957266.jpeg?auto=compress&cs=tinysrgb&w=240", bg: "#b9b3ad" },
];
const hero = { src: "https://images.pexels.com/photos/39753063/pexels-photo-39753063.jpeg?auto=compress&cs=tinysrgb&w=480", bg: "#d8cfc9" };

const BLUE = "#4F98FB";
const W = 460, H = 632; // drawn at this size, then scaled as one object
const OUT = 0, IN = 58; // how far a cartridge travels down into its slot
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function Icon({ id, color }: { id: string; color: string }) {
  const p = { fill: "none", stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px]">
      {id === "book" && <g {...p}><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /><path d="M9 15l2 2 4-4" /></g>}
      {id === "shop" && <g {...p}><path d="M5 8h14l-1.2 11.5H6.2z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></g>}
      {id === "blog" && <g {...p}><path d="M6 3.5h9l3.5 3.5v13.5H6z" /><path d="M9.5 11h6M9.5 14.5h6M9.5 18h3" /></g>}
    </svg>
  );
}

// A section of the little site. It is dark and dashed until its cartridge is seated, then it wipes on behind a blue scan line.
function Row({ on, label, children }: { on: boolean; label: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  const t = reduce ? { duration: 0 } : { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number], delay: on ? 0.16 : 0 };
  return (
    <div className="relative h-[60px] overflow-hidden rounded-[9px]">
      <div className="absolute inset-0 flex items-center justify-center rounded-[9px] border border-dashed border-[#0B0D12]/25 bg-[#0B0D12]/[0.035]">
        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.22em] text-[#0B0D12]/45">Slot {label} empty</span>
      </div>
      <motion.div initial={false} animate={{ clipPath: on ? "inset(0% 0% 0% 0%)" : "inset(0% 100% 0% 0%)" }} transition={t} className="absolute inset-0 rounded-[9px] bg-white shadow-[inset_0_0_0_1px_rgba(11,13,18,0.08)]">
        {children}
      </motion.div>
      <motion.span aria-hidden="true" initial={false} animate={{ left: on ? "100%" : "0%", opacity: on ? [0, 1, 1, 0] : 0 }} transition={t} className="absolute inset-y-0 w-[3px] -translate-x-1/2 bg-[#4F98FB] shadow-[0_0_12px_3px_rgba(79,152,251,0.7)]" />
    </div>
  );
}

export default function WebsiteFeatureCartridgeConsole() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [seated, setSeated] = useState<boolean[]>([true, true, true]);
  const [auto, setAuto] = useState(true);
  const [day, setDay] = useState(1);
  const [said, setSaid] = useState("");

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1.16, (el.clientWidth - 24) / W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The self-running demo: three cartridges click home one after another, then every so often one is pulled and pushed back.
  useIsoLayoutEffect(() => {
    if (reduce || !auto) return;
    const ids: number[] = [];
    const at = (ms: number, fn: () => void) => { ids.push(window.setTimeout(fn, ms)); };
    const put = (i: number, v: boolean) => setSeated((s) => s.map((x, k) => (k === i ? v : x)));
    setSeated([false, false, false]);
    at(320, () => put(0, true));
    at(780, () => put(1, true));
    at(4300, () => put(2, true)); // the last one waits, so the first still picture shows a cartridge standing proud
    let n = 0;
    const cycle = () => {
      const i = [1, 0, 2][n++ % 3];
      put(i, false);
      at(2400, () => put(i, true));
      at(5400, cycle);
    };
    at(7800, cycle);
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [reduce, auto]);

  // The booking marker steps along the days while its cartridge is in, so the screen never sits still.
  useEffect(() => {
    if (reduce || !seated[0]) return;
    const id = window.setInterval(() => setDay((d) => (d + 1) % days.length), 1700);
    return () => window.clearInterval(id);
  }, [reduce, seated]);

  const toggle = (i: number) => {
    setAuto(false);
    setSeated((s) => s.map((x, k) => (k === i ? !x : x)));
    setSaid(`${carts[i].name} cartridge ${seated[i] ? "ejected" : "seated"}.`);
  };
  const all = seated.every(Boolean);
  const setAll = () => { setAuto(false); setSeated([!all, !all, !all]); setSaid(all ? "All cartridges ejected." : "All cartridges seated."); };
  const live = seated.filter(Boolean).length;

  return (
    <div ref={root} style={{ fontFamily: FONT }} className="relative flex min-h-[560px] w-full items-center justify-center overflow-hidden bg-[#F6F4EF] bg-[radial-gradient(85%_65%_at_50%_40%,#ffffff_0%,#F6F4EF_46%,#e3dfd4_100%)] py-8 sm:min-h-[820px]">
      <div style={{ width: W * scale, height: H * scale }} className="relative">
        <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0" }} className="absolute left-0 top-0">
          {/* Shadow on the table */}
          <span aria-hidden="true" className="absolute left-[34px] top-[588px] h-[40px] w-[392px] rounded-[50%] bg-[#0B0D12]/40 blur-[18px]" />

          {/* The top face of the console, seen at a glancing angle, with the three slot mouths */}
          <div aria-hidden="true" className="absolute left-[26px] top-[138px] h-[26px] w-[408px] rounded-t-[22px] bg-[linear-gradient(180deg,#d6d1c5_0%,#f1eee7_55%,#ffffff_100%)] shadow-[inset_0_1px_0_rgba(11,13,18,0.18)]">
            {carts.map((c, i) => (
              <span key={c.id} className="absolute top-[5px] h-[21px] w-[118px] rounded-t-[6px] bg-[#07080b] shadow-[inset_0_2px_3px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.9)]" style={{ left: 19 + i * 126 }} />
            ))}
          </div>

          {/* Cartridges. They sit behind the front of the console, so pushing one down hides its label and leaves only the grip showing. */}
          {carts.map((c, i) => (
            <motion.button
              key={c.id}
              type="button"
              aria-pressed={seated[i]}
              aria-label={`${c.name} cartridge`}
              onClick={() => toggle(i)}
              initial={false}
              animate={{ y: seated[i] ? IN : OUT }}
              whileHover={reduce ? undefined : { y: seated[i] ? IN - 5 : OUT - 6 }}
              transition={reduce ? { duration: 0 } : seated[i] ? { type: "spring", stiffness: 520, damping: 24, mass: 0.9 } : { type: "spring", stiffness: 300, damping: 13, mass: 0.8 }}
              style={{ left: 50 + i * 126, background: `linear-gradient(180deg, ${c.shell[0]} 0%, ${c.shell[1]} 30%, ${c.shell[2]} 100%)`, boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.55), inset 2px 0 0 rgba(255,255,255,0.16), inset -2px 0 0 rgba(0,0,0,0.18), 0 0 0 1px ${c.edge}, 8px 10px 14px -6px rgba(11,13,18,0.45)` }}
              className="group absolute top-[34px] h-[170px] w-[108px] cursor-pointer rounded-t-[13px] rounded-b-[4px] outline-none focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F4EF]"
            >
              {/* moulded grip */}
              <span aria-hidden="true" className="absolute inset-x-[16px] top-[7px] h-[9px] rounded-full opacity-90" style={{ background: "repeating-linear-gradient(90deg, rgba(0,0,0,0.34) 0 2px, rgba(255,255,255,0.3) 2px 3px, transparent 3px 6px)" }} />
              <span className="absolute inset-x-0 top-[19px] text-center text-[11.5px] font-extrabold uppercase tracking-[0.1em]" style={{ color: c.ink }}>{c.name}</span>
              {/* paper label, recessed into the shell */}
              <span aria-hidden="true" className="absolute inset-x-[9px] top-[42px] flex h-[60px] flex-col justify-between rounded-[6px] bg-[#fffdf8] bg-[linear-gradient(120deg,#ffffff_0%,#fffdf8_45%,#eeeadf_100%)] p-[7px] text-left shadow-[inset_0_1px_2px_rgba(11,13,18,0.5),0_1px_0_rgba(255,255,255,0.25)]">
                <span className="flex items-start justify-between">
                  <Icon id={c.id} color="#0B0D12" />
                  <span className="font-mono text-[8px] font-bold tracking-[0.16em] text-[#0B0D12]/60">0{i + 1}</span>
                </span>
                <span className="flex items-center gap-[4px]"><i className="h-[5px] w-[5px] rounded-full bg-[#4F98FB]" /><span className="h-[3px] flex-1 rounded-full bg-[#0B0D12]/15" /><span className="h-[3px] w-[14px] rounded-full bg-[#0B0D12]/15" /></span>
              </span>
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-t-[13px] bg-[linear-gradient(100deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_22%,rgba(255,255,255,0)_70%,rgba(0,0,0,0.16)_100%)]" />
            </motion.button>
          ))}

          {/* The front of the console */}
          <div className="absolute left-[20px] top-[160px] h-[440px] w-[420px] rounded-b-[38px] rounded-t-[10px] bg-[#F1EEE7] bg-[linear-gradient(180deg,#fdfcf9_0%,#f3f0e9_42%,#e6e2d8_100%)] shadow-[inset_0_2px_0_#ffffff,inset_0_-2px_3px_rgba(11,13,18,0.1),inset_3px_0_3px_-2px_rgba(255,255,255,0.9),inset_-3px_0_4px_-2px_rgba(11,13,18,0.12),0_2px_0_#cfcabe,0_4px_0_#c4bfb2,0_6px_0_#b9b4a7,0_22px_26px_-10px_rgba(11,13,18,0.4),0_50px_60px_-26px_rgba(11,13,18,0.45)]">
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full rounded-b-[38px] rounded-t-[10px] opacity-[0.22] mix-blend-multiply">
              <filter id="website-console-cartridges-grain"><feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" seed="7" /><feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.38  0 0 0 0 0.34  0 0 0 0.9 -0.28" /></filter>
              <rect width="100%" height="100%" filter="url(#website-console-cartridges-grain)" />
            </svg>

            {/* slot lamps */}
            <div aria-hidden="true" className="absolute inset-x-0 top-[13px] h-[12px]">
              {carts.map((c, i) => (
                <span key={c.id} className="absolute flex w-[108px] items-center justify-center gap-[7px]" style={{ left: 30 + i * 126 }}>
                  <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-[#0B0D12]/55">{c.code}</span>
                  <span style={{ background: seated[i] ? `radial-gradient(circle at 35% 30%, #d6e8ff 0%, ${BLUE} 55%, #2d62ae 100%)` : "radial-gradient(circle at 35% 30%, #8c887d 0%, #5d5a52 70%)", boxShadow: seated[i] ? "0 0 10px 2px rgba(79,152,251,0.75), inset 0 0 0 1px rgba(11,13,18,0.25)" : "inset 0 1px 1px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.9)", transitionDelay: seated[i] ? "140ms" : "0ms" }} className="h-[7px] w-[7px] rounded-full transition-[background,box-shadow] duration-200" />
                </span>
              ))}
            </div>

            {/* The screen: a black bezel, then glass, then the little site */}
            <div className="absolute left-[22px] top-[38px] h-[340px] w-[376px] rounded-[22px] bg-[#0B0D12] p-[9px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),inset_0_0_0_1px_#000,0_1px_0_#ffffff,0_-1px_0_rgba(11,13,18,0.18)]">
              <div aria-hidden="true" className="relative h-full w-full overflow-hidden rounded-[14px] bg-[#F6F4EF] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.5)]">
                <div className="flex h-[28px] items-center justify-between px-[11px]">
                  <span className="text-[11px] font-extrabold tracking-[-0.03em] text-[#0B0D12]">{shopName}</span>
                  <span className="flex items-center gap-[9px] text-[8px] font-bold tracking-[-0.01em] text-[#0B0D12]/70">
                    {carts.map((c, i) => <span key={c.id} className="transition-opacity duration-300" style={{ opacity: seated[i] ? 1 : 0.25 }}>{c.name}</span>)}
                  </span>
                </div>
                <div className="relative mx-[6px] h-[88px] overflow-hidden rounded-[9px]" style={{ background: hero.bg }}>
                  <img src={hero.src} alt="" width={344} height={88} className="absolute inset-0 h-full w-full object-cover object-[50%_42%]" />
                  <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,13,18,0.7)_0%,rgba(11,13,18,0.28)_42%,rgba(11,13,18,0)_66%)]" />
                  <span className="absolute left-[11px] top-[14px] w-[150px] text-[19px] font-extrabold leading-[1.02] tracking-[-0.045em] text-white">Flowers, cut this morning.</span>
                  <span className="absolute bottom-[11px] left-[11px] rounded-full bg-[#4F98FB] px-[8px] py-[3px] text-[8px] font-extrabold text-[#0B0D12]">See the stems</span>
                </div>
                <div className="flex flex-col gap-[6px] p-[6px]">
                  <Row on={seated[0]} label="A">
                    <div className="flex h-full items-center gap-[8px] px-[9px]">
                      <span className="w-[76px] shrink-0">
                        <span className="block text-[7px] font-bold uppercase tracking-[0.16em] text-[#0B0D12]/60">Workshops</span>
                        <span className="block text-[11.5px] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#0B0D12]">Hand-tied basics</span>
                      </span>
                      <span className="relative flex h-[38px] flex-1 rounded-[8px] bg-[#0B0D12]/[0.06] p-[3px]">
                        <motion.span initial={false} animate={{ x: `${day * 100}%` }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 28 }} className="absolute bottom-[3px] left-[3px] top-[3px] w-[calc((100%-6px)/4)] rounded-[6px] bg-[#4F98FB] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_4px_rgba(47,104,190,0.45)]" />
                        {days.map((d) => (
                          <span key={d} className="relative flex flex-1 flex-col items-center justify-center leading-none text-[#0B0D12]">
                            <span className="text-[6.5px] font-bold uppercase tracking-[0.1em] opacity-70">{d.split(" ")[0]}</span>
                            <span className="mt-[2px] text-[12px] font-extrabold tracking-[-0.04em]">{d.split(" ")[1]}</span>
                          </span>
                        ))}
                      </span>
                      <span className="rounded-full bg-[#0B0D12] px-[9px] py-[5px] text-[8px] font-extrabold text-[#F6F4EF]">Book</span>
                    </div>
                  </Row>
                  <Row on={seated[1]} label="B">
                    <div className="grid h-full grid-cols-3 gap-[6px] p-[6px]">
                      {products.map((p) => (
                        <span key={p.name} className="flex items-center gap-[6px]">
                          <span className="h-[48px] w-[44px] shrink-0 overflow-hidden rounded-[6px]" style={{ background: p.bg }}><img src={p.src} alt="" width={44} height={48} className="h-full w-full object-cover" /></span>
                          <span className="min-w-0">
                            <span className="block truncate text-[8.5px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#0B0D12]">{p.name}</span>
                            <span className="block text-[8.5px] font-bold text-[#0B0D12]/60">{p.price}</span>
                            <span className="mt-[3px] inline-block rounded-full bg-[#4F98FB] px-[5px] py-[1.5px] text-[6.5px] font-extrabold text-[#0B0D12]">Add</span>
                          </span>
                        </span>
                      ))}
                    </div>
                  </Row>
                  <Row on={seated[2]} label="C">
                    <div className="flex h-full items-center gap-[9px] px-[9px]">
                      <span className="flex-1">
                        <span className="block text-[7px] font-bold uppercase tracking-[0.16em] text-[#0B0D12]/60">Journal</span>
                        <span className="block text-[12.5px] font-extrabold leading-[1.1] tracking-[-0.035em] text-[#0B0D12]">Why tulips keep growing in the vase</span>
                        <span className="mt-[5px] block h-[3px] w-[120px] rounded-full bg-[#0B0D12]/15" />
                      </span>
                      <span className="h-[44px] w-[62px] shrink-0 overflow-hidden rounded-[6px] bg-[#1c1a1c]"><img src="https://images.pexels.com/photos/11016869/pexels-photo-11016869.jpeg?auto=compress&cs=tinysrgb&w=240" alt="" width={62} height={44} className="h-full w-full object-cover object-[50%_40%]" /></span>
                      <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#0B0D12]">
                        <svg viewBox="0 0 16 16" className="h-[11px] w-[11px]" fill="none" stroke={BLUE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                      </span>
                    </div>
                  </Row>
                </div>
                {/* reflection on the glass */}
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0.08)_18%,rgba(255,255,255,0)_32%)]" />
                <span className="pointer-events-none absolute inset-0 rounded-[14px] shadow-[inset_0_6px_14px_-6px_rgba(11,13,18,0.45)]" />
              </div>
            </div>

            {/* The strip under the screen: speaker holes, an engraved line and one real button */}
            <div className="absolute inset-x-[30px] bottom-[18px] flex h-[40px] items-center justify-between">
              <span aria-hidden="true" className="grid grid-cols-6 gap-[5px]">
                {Array.from({ length: 18 }, (_, i) => <i key={i} className="h-[4px] w-[4px] rounded-full bg-[#0B0D12]/75 shadow-[0_1px_0_rgba(255,255,255,0.95)]" />)}
              </span>
              <span className="font-mono text-[8.5px] font-bold uppercase tracking-[0.24em] text-[#0B0D12]/60 [text-shadow:0_1px_0_#ffffff]">Site / {live} of 3 on</span>
              <button type="button" onClick={setAll} className="h-[40px] rounded-full bg-[#0B0D12] bg-[linear-gradient(180deg,#2a2f3c_0%,#0B0D12_100%)] px-[16px] text-[11px] font-extrabold tracking-[-0.01em] text-[#F6F4EF] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_0_#000,0_4px_6px_rgba(11,13,18,0.35),0_0_0_3px_rgba(11,13,18,0.08)] outline-none transition-transform duration-100 active:translate-y-[2px] focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1EEE7] motion-reduce:transition-none">
                {all ? "Eject all" : "Load all"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">{said}</p>
    </div>
  );
}
