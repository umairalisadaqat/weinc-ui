import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

/** One card per person, top pocket first. `week` is Monday to Wednesday, in and out; today's line is stamped when the card is pulled. */
const staff: { name: string; role: string; dept: string; since: string; band: string; week: [string, string][]; photo: { src: string; alt: string; tone: string; focus: string } }[] = [
  {
    name: "Adaeze Nwosu",
    role: "Head baker",
    dept: "Bench",
    since: "2015",
    band: "#b3341f",
    week: [["03:58", "11:34"], ["04:01", "11:40"], ["03:56", "12:05"]],
    photo: { src: "https://images.pexels.com/photos/32222061/pexels-photo-32222061.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in a mustard headwrap and dark top lit against a burnt orange wall", tone: "#8a3c1c", focus: "50% 22%" },
  },
  {
    name: "Kofi Mensah",
    role: "Ovens, nights",
    dept: "Deck oven",
    since: "2019",
    band: "#1f5f8a",
    week: [["21:47", "05:32"], ["21:52", "05:30"], ["21:49", "05:41"]],
    photo: { src: "https://images.pexels.com/photos/15689960/pexels-photo-15689960.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Young man in a white striped shirt looking into the lens against a red wall", tone: "#b33a22", focus: "50% 30%" },
  },
  {
    name: "Mina Sato",
    role: "Pastry",
    dept: "Lamination",
    since: "2021",
    band: "#2f7d57",
    week: [["04:28", "12:02"], ["04:31", "12:10"], ["04:26", "11:58"]],
    photo: { src: "https://images.pexels.com/photos/35537926/pexels-photo-35537926.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Smiling woman with a dark bob and orange tinted glasses in a blue jumper against a pink wall", tone: "#f2b9bd", focus: "50% 30%" },
  },
  {
    name: "Priya Nair",
    role: "Counter",
    dept: "Shop",
    since: "2022",
    band: "#c98a12",
    week: [["06:44", "14:31"], ["06:47", "14:30"], ["06:41", "15:02"]],
    photo: { src: "https://images.pexels.com/photos/37851040/pexels-photo-37851040.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman with long wavy hair in a black top against a bright yellow wall", tone: "#f1d93c", focus: "50% 34%" },
  },
  {
    name: "Douglas Hart",
    role: "Deliveries",
    dept: "Van and bike",
    since: "2012",
    band: "#5a3f8c",
    week: [["05:12", "10:48"], ["05:15", "10:52"], ["05:09", "11:20"]],
    photo: { src: "https://images.pexels.com/photos/32063767/pexels-photo-32063767.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Bald man with a long grey beard in a leather jacket, hand at his chin, dark green backdrop", tone: "#2c3a30", focus: "40% 26%" },
  },
  {
    name: "Bruno Albani",
    role: "Mills the flour",
    dept: "Stone mill",
    since: "2009",
    band: "#3a3a3a",
    week: [["07:02", "13:15"], ["07:00", "13:22"], ["07:05", "13:11"]],
    photo: { src: "https://images.pexels.com/photos/7322082/pexels-photo-7322082.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "White haired man in a white shirt resting his chin on his hand against a grey wall", tone: "#9a9894", focus: "46% 24%" },
  },
];

const bakery = "Fallow and Rye Bakehouse";
const days = ["Mon", "Tue", "Wed", "Thu"];

// Design pixels: the wall is drawn at this size and scaled to the frame.
const SCENE_W = 940;
const SCENE_H = 664;
const CARD_W = 170;
const CARD_H = 380;
const TIER = 58; // how much of each card shows above the one in front
const LIP = 12; // folded steel edge of each pocket
const RACK_X = 556; // left edge of the cards in the rack
const RACK_Y = 98; // top of the first card
const PLATE_L = 38; // bare plate to the left of the cards, for the pocket numbers
const SHOW_X = 198;
const SHOW_Y = 40;
const SHOW_SCALE = 1.38;
const LIFT = 30; // a card rises this far before it will slide out sideways
const FLOOR = RACK_Y + TIER * staff.length + 150; // bottom of the rack

const INK = "#3a2d86";
const RULE = "rgba(150,66,38,0.6)";
const fibre =
  "radial-gradient(circle at 18% 26%, rgba(255,255,255,0.14) 0 0.5px, rgba(0,0,0,0) 1px), radial-gradient(circle at 66% 58%, rgba(120,80,20,0.1) 0 0.6px, rgba(0,0,0,0) 1.1px), radial-gradient(circle at 40% 88%, rgba(120,80,20,0.07) 0 0.5px, rgba(0,0,0,0) 1px)";
const hammered =
  "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.07) 0 1.4px, rgba(0,0,0,0) 2.6px), radial-gradient(circle at 70% 66%, rgba(0,0,0,0.28) 0 1.5px, rgba(0,0,0,0) 2.8px), radial-gradient(circle at 52% 12%, rgba(255,255,255,0.05) 0 1.2px, rgba(0,0,0,0) 2.4px)";
const screw = "radial-gradient(circle at 35% 30%,#fff,#b1b7ba 50%,#565e62)";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const wobble = (n: number) => ((n * 37) % 11) / 11 - 0.5; // the same small error every render, like a worn mechanism
const clock = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

function Stamp({ text, n, faint }: { text: string; n: number; faint?: boolean }) {
  return (
    <span className="relative inline-block font-mono text-[10px] font-bold leading-none tracking-[0.02em]" style={{ color: INK, opacity: faint ? 0.62 + wobble(n + 3) * 0.3 : 0.94, transform: `translate(${(wobble(n) * 3).toFixed(1)}px, ${(wobble(n + 5) * 2).toFixed(1)}px) rotate(${(wobble(n + 1) * 5).toFixed(1)}deg)` }}>
      {text}
      <span aria-hidden="true" className="absolute left-[0.6px] top-[0.5px] opacity-30 blur-[0.4px]">
        {text}
      </span>
    </span>
  );
}

export default function ClockingInCardRack() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [out, setOut] = useState(2);
  const [back, setBack] = useState(-1);
  const [peek, setPeek] = useState(-1);
  const [stamps, setStamps] = useState<Record<number, string>>({});
  const hold = useRef({ touched: false, over: false });
  const pan = useSpring(0, { stiffness: 90, damping: 18 });

  useEffect(() => {
    const place = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const w = wrap.clientWidth;
      const sc = clamp(w / SCENE_W, 0.62, 1.1);
      wrap.style.height = `${Math.round(SCENE_H * sc + (w < 640 ? 40 : 0))}px`;
      const centre = ((SHOW_X + RACK_X + CARD_W) / 2 + 4) * sc;
      if (sceneRef.current) sceneRef.current.style.transform = `scale(${sc.toFixed(4)})`;
      pan.jump(SCENE_W * sc <= w ? (w - SCENE_W * sc) / 2 : w / 2 - centre);
    };
    place();
    const ro = new ResizeObserver(place);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [pan]);

  const pull = useCallback((i: number) => {
    setOut((cur) => {
      if (cur !== i) setBack(cur);
      return i;
    });
  }, []);

  // the clock strikes once the card has come to rest
  useEffect(() => {
    if (stamps[out]) return;
    const t = window.setTimeout(() => setStamps((s) => ({ ...s, [out]: clock() })), reduce ? 0 : 1250);
    return () => window.clearTimeout(t);
  }, [out, reduce, stamps]);

  // cards are pulled one after another until somebody takes over
  useEffect(() => {
    if (reduce) return;
    const order = [4, 0, 3, 1, 5, 2];
    let n = 0;
    const go = () => {
      const s = hold.current;
      if (s.touched || s.over || document.hidden) return;
      pull(order[n % order.length]);
      n += 1;
    };
    const first = window.setTimeout(go, 3000);
    const loop = window.setInterval(go, 4800);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
    };
  }, [pull, reduce]);

  const choose = (i: number) => {
    hold.current.touched = true;
    pull(i);
  };

  const dur = reduce ? 0 : 1.05;
  const person = staff[out];

  return (
    <section aria-label={`The people of ${bakery}`} className="relative overflow-hidden bg-[#a8452f]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(40% 30% at 78% 80%, rgba(255,210,170,0.07), rgba(255,210,170,0)), radial-gradient(75% 72% at 36% 34%, #c45b3f 0%, #a8452f 52%, #78291a 100%)" }} />
      <div ref={wrapRef} onPointerEnter={() => (hold.current.over = true)} onPointerLeave={() => (hold.current.over = false)} className="relative w-full overflow-hidden" style={{ height: SCENE_H }}>
        <motion.div className="absolute left-0 top-0" style={{ x: pan }}>
          <div ref={sceneRef} className="relative origin-top-left" style={{ width: SCENE_W, height: SCENE_H }}>
            {/* shadow of the rack on the wall, then its back plate */}
            <div aria-hidden="true" className="absolute rounded-[10px]" style={{ left: RACK_X - PLATE_L + 14, top: RACK_Y - 40, width: CARD_W + PLATE_L + 34, height: FLOOR - RACK_Y + 62, background: "rgba(40,8,0,0.5)", filter: "blur(18px)" }} />
            <div
              aria-hidden="true"
              className="absolute rounded-[7px]"
              style={{ left: RACK_X - PLATE_L, top: RACK_Y - 52, width: CARD_W + PLATE_L + 14, height: FLOOR - RACK_Y + 52, backgroundColor: "#2c3531", backgroundImage: `${hammered}, linear-gradient(90deg,#3d4843 0%,#2c3531 30%,#222a27 100%)`, backgroundSize: "9px 9px, 13px 11px, 7px 13px, auto", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28), inset 1px 0 0 rgba(255,255,255,0.14), inset -1px -1px 0 rgba(0,0,0,0.5)" }}
            >
              <span className="absolute left-[10px] top-[10px] h-[11px] w-[11px] rounded-full" style={{ background: screw, boxShadow: "0 1px 2px rgba(0,0,0,0.6)" }} />
              <span className="absolute right-[10px] top-[10px] h-[11px] w-[11px] rounded-full" style={{ background: screw, boxShadow: "0 1px 2px rgba(0,0,0,0.6)" }} />
              <div className="absolute left-1/2 top-[9px] w-[132px] -translate-x-1/2 rounded-[2px] px-[8px] py-[5px] text-center" style={{ background: "linear-gradient(180deg,#f0d78a,#c9a443 55%,#a9842b)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.6)" }}>
                <p className="font-mono text-[8.5px] font-bold uppercase leading-[1.3] tracking-[0.2em] text-[#3a2a08]" style={{ textShadow: "0 1px 0 rgba(255,255,255,0.45)" }}>
                  Staff in
                </p>
                <p className="font-mono text-[6px] uppercase leading-[1.3] tracking-[0.16em] text-[#4a3710]">Own pocket, please</p>
              </div>
              {staff.map((_, i) => (
                <span key={i} className="absolute left-[9px] grid h-[18px] w-[18px] place-items-center rounded-full font-mono text-[9px] font-bold text-[#1c2220]" style={{ top: 52 + TIER * i + (TIER - LIP) / 2 - 9, background: "radial-gradient(circle at 35% 30%,#fbf7ea,#d9d2bd)", boxShadow: "0 1px 1px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,0,0,0.2)" }}>
                  {i + 1}
                </span>
              ))}
            </div>

            {/* cards and pocket lips, back to front; nothing shows below the rack */}
            <ul className="absolute left-0 top-0 m-0 list-none p-0" style={{ width: SCENE_W, height: FLOOR, clipPath: "inset(-200px -600px 0px -600px)" }}>
              {staff.map((p, i) => {
                const y = RACK_Y + TIER * i;
                const isOut = out === i;
                const dx = SHOW_X - RACK_X;
                const dy = SHOW_Y - y;
                const state = isOut ? "out" : back === i ? "back" : peek === i ? "peek" : "rack";
                const stamp = stamps[i];
                return (
                  <li key={p.name}>
                    {/* the empty pocket behind the card */}
                    <div aria-hidden="true" className="absolute" style={{ left: RACK_X - 4, top: y - 2, width: CARD_W + 8, height: TIER, background: "linear-gradient(180deg,#0e1312,#1b2220)", boxShadow: "inset 0 5px 7px rgba(0,0,0,0.7)" }} />
                    <motion.div
                      className="absolute"
                      initial={false}
                      animate={state}
                      variants={{
                        rack: { x: 0, y: 0, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 320, damping: 24 } },
                        peek: { x: 0, y: -10, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 320, damping: 18 } },
                        out: { x: [0, 0, dx * 0.66, dx], y: [0, -LIFT, -LIFT, dy], scale: [1, 1, 1, SHOW_SCALE], rotate: [0, 0, -0.6, -2.4], transition: { duration: dur, times: [0, 0.2, 0.6, 1], ease: [0.3, 0.6, 0.2, 1], delay: reduce ? 0 : 0.28 } },
                        back: { x: [dx, dx * 0.66, 0, 0], y: [dy, -LIFT, -LIFT, 0], scale: [SHOW_SCALE, 1, 1, 1], rotate: [-2.4, -0.6, 0, 0], transition: { duration: dur * 0.86, times: [0, 0.42, 0.8, 1], ease: [0.4, 0, 0.3, 1] } },
                      }}
                      style={{ left: RACK_X, top: y, width: CARD_W, height: CARD_H, transformOrigin: "0px 0px", filter: isOut ? "drop-shadow(10px 18px 14px rgba(48,10,0,0.5))" : "drop-shadow(0 1px 1.5px rgba(0,0,0,0.5))", transition: "filter 0.5s ease 0.5s" }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          clipPath: "polygon(0 0,100% 0,100% 100%,18px 100%,0 calc(100% - 18px))",
                          backgroundColor: "#e7d2a0",
                          backgroundImage: `${fibre}, linear-gradient(100deg,rgba(255,255,255,0.22) 0%,rgba(255,255,255,0) 34%,rgba(120,80,20,0.1) 100%), linear-gradient(180deg,#efdcae,#e2ca94)`,
                          backgroundSize: "3px 5px, 7px 4px, 5px 9px, auto, auto",
                        }}
                      >
                        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[6px]" style={{ background: p.band }} />
                        <div aria-hidden="true" className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 0.5px rgba(90,60,10,0.5), inset 1px 1px 0 rgba(255,255,255,0.4)" }} />
                        <div className="absolute inset-x-[10px] top-[13px] flex items-baseline justify-between">
                          <p className="truncate font-mono text-[11.5px] font-bold uppercase leading-none tracking-[0.04em] text-[#241a0c]">{p.name}</p>
                          <p aria-hidden="true" className="font-mono text-[7px] font-bold leading-none" style={{ color: p.band }}>
                            No. {String(i * 7 + 12).padStart(3, "0")}
                          </p>
                        </div>
                        <p className="absolute inset-x-[10px] top-[29px] font-mono text-[7px] uppercase leading-none tracking-[0.18em] text-[#5a4420]">{p.role}</p>
                        <div aria-hidden="true" className="absolute inset-x-[8px] top-[43px] h-px" style={{ background: RULE }} />

                        {/* the portrait, stapled on */}
                        <div className="absolute left-[11px] top-[57px] w-[148px] p-[5px]" style={{ transform: `rotate(${(wobble(i + 2) * 3.2).toFixed(1)}deg)`, background: "linear-gradient(170deg,#fdfbf5,#ece7da)", boxShadow: "0 1px 1px rgba(60,30,0,0.45), 1px 4px 7px rgba(60,30,0,0.35)" }}>
                          <div className="relative h-[146px] overflow-hidden" style={{ backgroundColor: p.photo.tone }}>
                            <img src={p.photo.src} alt={p.photo.alt} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: p.photo.focus }} />
                            <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(120deg,rgba(255,255,255,0.2) 0%,rgba(255,255,255,0) 32%)", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.25)" }} />
                          </div>
                          {[0, 1].map((n) => (
                            <span key={n} aria-hidden="true" className="absolute top-[1.5px] h-[2.2px] w-[13px] rounded-full" style={{ [n ? "right" : "left"]: 14, transform: `rotate(${n ? 5 : -7}deg)`, background: "linear-gradient(180deg,#f4f6f6,#8b9396)", boxShadow: "0 1px 0.5px rgba(0,0,0,0.5)" }} />
                          ))}
                        </div>

                        <dl className="absolute inset-x-[10px] top-[221px] m-0 flex justify-between font-mono uppercase">
                          {[
                            ["Dept", p.dept],
                            ["Since", p.since],
                            ["Week", "41"],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <dt className="text-[5.5px] leading-none tracking-[0.2em]" style={{ color: "#8a4a2a" }}>
                                {k}
                              </dt>
                              <dd className="m-0 mt-[3px] text-[8px] font-bold leading-none tracking-[0.04em] text-[#241a0c]">{v}</dd>
                            </div>
                          ))}
                        </dl>

                        {/* the printed grid and what the clock has struck on it */}
                        <table className="absolute left-[8px] top-[245px] w-[154px] border-collapse font-mono" style={{ border: `1px solid ${RULE}` }}>
                          <thead>
                            <tr style={{ background: "rgba(150,66,38,0.12)" }}>
                              {["Day", "In", "Out"].map((h) => (
                                <th key={h} scope="col" className="h-[14px] text-[6px] font-bold uppercase leading-none tracking-[0.2em]" style={{ color: "#8a4a2a", border: `1px solid ${RULE}` }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {days.map((d, r) => {
                              const today = r === days.length - 1;
                              const row = p.week[r];
                              return (
                                <tr key={d}>
                                  <th scope="row" className="h-[21px] w-[38px] text-[6.5px] font-bold uppercase leading-none tracking-[0.16em]" style={{ color: "#8a4a2a", border: `1px solid ${RULE}`, background: today ? "rgba(150,66,38,0.1)" : undefined }}>
                                    {d}
                                  </th>
                                  <td className="h-[21px] p-0 text-center" style={{ border: `1px solid ${RULE}` }}>
                                    {row ? (
                                      <Stamp text={row[0]} n={i * 8 + r * 2} faint />
                                    ) : stamp ? (
                                      <motion.span key={stamp} className="inline-block" initial={reduce ? false : { scale: 1.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.09, ease: "easeIn" }}>
                                        <Stamp text={stamp} n={i * 8 + 7} />
                                      </motion.span>
                                    ) : null}
                                  </td>
                                  <td className="h-[21px] p-0 text-center" style={{ border: `1px solid ${RULE}` }}>
                                    {row ? <Stamp text={row[1]} n={i * 8 + r * 2 + 1} faint /> : null}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <p aria-hidden="true" className="absolute bottom-[9px] left-[24px] right-[10px] flex items-end justify-between font-mono text-[5.5px] uppercase leading-none tracking-[0.2em]" style={{ color: "#8a4a2a" }}>
                          <span>{bakery}</span>
                          <span>F.12</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-pressed={isOut}
                        aria-label={`${p.name}, ${p.role.toLowerCase()}. ${isOut ? "Card is out" : "Pull this card"}`}
                        onClick={() => choose(i)}
                        onPointerEnter={(e) => e.pointerType === "mouse" && !isOut && setPeek(i)}
                        onPointerLeave={() => setPeek((v) => (v === i ? -1 : v))}
                        onFocus={() => !isOut && setPeek(i)}
                        onBlur={() => setPeek((v) => (v === i ? -1 : v))}
                        className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1f5f8a]"
                      />
                    </motion.div>
                    {/* the folded lip of this pocket, in front of its card */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute"
                      style={{
                        left: RACK_X - 8,
                        top: y + TIER - LIP,
                        width: CARD_W + 16,
                        height: i === staff.length - 1 ? FLOOR - (y + TIER - LIP) : LIP,
                        borderRadius: i === staff.length - 1 ? "0 0 7px 7px" : 0,
                        backgroundColor: "#39443f",
                        backgroundImage: i === staff.length - 1 ? `${hammered}, linear-gradient(180deg,#8f9c95 0,#4a5651 4px,#333d39 14px,#262e2b 100%)` : "linear-gradient(180deg,#a3b0a9 0,#5c6964 3px,#3a4541 8px,#262e2b 100%)",
                        backgroundSize: i === staff.length - 1 ? "9px 9px, 13px 11px, 7px 13px, auto" : "auto",
                        boxShadow: "0 3px 4px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(0,0,0,0.5)",
                      }}
                    >
                      {i === staff.length - 1 ? (
                        <div className="absolute inset-x-[16px] bottom-[18px] top-[34px] grid place-items-center rounded-[5px]" style={{ boxShadow: "inset 1px 1px 0 rgba(0,0,0,0.45), inset -1px -1px 0 rgba(255,255,255,0.13), 1px 1px 0 rgba(255,255,255,0.08)" }}>
                          <p className="text-center font-mono text-[11px] font-bold uppercase leading-[1.5] tracking-[0.34em] text-[#56635d]" style={{ textShadow: "0 -1px 0 rgba(0,0,0,0.75), 0 1px 0 rgba(255,255,255,0.16)" }}>
                            Fallow
                            <br />
                            and Rye
                          </p>
                          <span className="absolute bottom-[8px] left-[8px] h-[8px] w-[8px] rounded-full" style={{ background: screw, boxShadow: "0 1px 1px rgba(0,0,0,0.6)" }} />
                          <span className="absolute bottom-[8px] right-[8px] h-[8px] w-[8px] rounded-full" style={{ background: screw, boxShadow: "0 1px 1px rgba(0,0,0,0.6)" }} />
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-7">
        <p aria-live="polite" className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-[#fdebd8] sm:text-[11px]">
          <span className="font-bold">{person.name}</span>
          <br />
          <span className="text-[#f6cdb6]">
            {person.role}, {bakery}
          </span>
        </p>
        <div className="pointer-events-auto flex gap-2">
          <button type="button" onClick={() => choose((out - 1 + staff.length) % staff.length)} aria-label="Pull the card above" className="grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-black/25 text-white transition hover:bg-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95">
            <ChevronUp aria-hidden="true" className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => choose((out + 1) % staff.length)} aria-label="Pull the card below" className="grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-black/25 text-white transition hover:bg-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95">
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
