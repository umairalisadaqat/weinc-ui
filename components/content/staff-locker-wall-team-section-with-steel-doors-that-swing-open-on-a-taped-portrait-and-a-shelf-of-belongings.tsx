import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useSpring, useTransform, useVelocity } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Shelf = "mug" | "books" | "flask" | "jar";
type Hung = "apron" | "tote" | "keys" | "towel";

/** One locker per person. `plate` is the card in the door holder, `tape` the note under the photograph. */
const team: { name: string; plate: string; role: string; tape: string; shelf: [Shelf, Shelf]; hung: Hung; tilt: number; photo: { src: string; alt: string; tone: string; focus: string } }[] = [
  {
    name: "Odile Marchetti",
    plate: "MARCHETTI",
    role: "Throws the tableware",
    tape: "wheel two, mornings",
    shelf: ["jar", "mug"],
    hung: "apron",
    tilt: -2.2,
    photo: { src: "https://images.pexels.com/photos/6794113/pexels-photo-6794113.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Woman with long braids in a rust jumper against a yellow wall, hand at her neck", tone: "#e9b423", focus: "50% 22%" },
  },
  {
    name: "Tobias Wren",
    plate: "WREN",
    role: "Fires both kilns",
    tape: "do not open at 900",
    shelf: ["flask", "books"],
    hung: "keys",
    tilt: 1.6,
    photo: { src: "https://images.pexels.com/photos/36511044/pexels-photo-36511044.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Man with a moustache in a cream knitted jumper against a terracotta wall", tone: "#b5604d", focus: "50% 24%" },
  },
  {
    name: "Ines Abara",
    plate: "ABARA",
    role: "Mixes every glaze",
    tape: "celadon batch 14",
    shelf: ["books", "jar"],
    hung: "tote",
    tilt: -1.4,
    photo: { src: "https://images.pexels.com/photos/11989029/pexels-photo-11989029.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Woman in round glasses and a black roll neck against a bright green wall", tone: "#16b88a", focus: "50% 26%" },
  },
  {
    name: "Rafa Quintero",
    plate: "QUINTERO",
    role: "Packs and runs the shop",
    tape: "back at two",
    shelf: ["mug", "flask"],
    hung: "towel",
    tilt: 2.4,
    photo: { src: "https://images.pexels.com/photos/8801041/pexels-photo-8801041.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Smiling man with short curly hair in a pale pink sweatshirt against a pink wall", tone: "#d79aa0", focus: "50% 22%" },
  },
];

const studio = "Marchetti and Wren Pottery";

// Design pixels. The whole wall is drawn at this size and scaled to fit.
const SCENE_W = 940;
const SCENE_H = 640;
const CELL = 196; // one locker, frame included
const DOOR_W = 184;
const DOOR_H = 468;
const THICK = 9; // folded edge of the door
const BANK_X = (SCENE_W - CELL * team.length) / 2;
const BANK_Y = 70;
const SWING = 96; // degrees a door opens
const PEEK = 9; // degrees a door lifts off its catch under the pointer

const PAINT = "#2f6377";
const PAINT_DARK = "#1c4252";
const chrome = "linear-gradient(180deg,#fbfcfc 0%,#b4bcc0 26%,#f1f4f5 48%,#7c868b 74%,#c9d0d3 100%)";
const chromeAcross = "linear-gradient(90deg,#8b959a 0%,#f6f8f8 30%,#aab3b7 55%,#eef1f2 72%,#6d777c 100%)";
const speckle =
  "radial-gradient(circle at 22% 31%, rgba(255,255,255,0.045) 0 0.6px, rgba(0,0,0,0) 1.1px), radial-gradient(circle at 71% 64%, rgba(0,0,0,0.07) 0 0.7px, rgba(0,0,0,0) 1.2px), radial-gradient(circle at 44% 83%, rgba(255,255,255,0.035) 0 0.6px, rgba(0,0,0,0) 1.1px)";
const speckleSize = "5px 7px, 11px 9px, 13px 17px";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function Louvres({ top }: { top: number }) {
  return (
    <div aria-hidden="true" className="absolute left-1/2 w-[112px] -translate-x-1/2 space-y-[7px]" style={{ top }}>
      {[0, 1, 2, 3].map((n) => (
        <div
          key={n}
          className="h-[8px] rounded-[2px]"
          style={{
            background: "linear-gradient(180deg,#071820 0%,#0e2a35 52%,#6fa6ba 58%,#3f7b90 78%,#2f6377 100%)",
            boxShadow: "inset 0 2px 2px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.22), 0 -1px 0 rgba(0,0,0,0.28)",
          }}
        />
      ))}
    </div>
  );
}

function ShelfThing({ kind, id }: { kind: Shelf; id: string }) {
  if (kind === "mug")
    return (
      <svg aria-hidden="true" viewBox="0 0 46 40" className="h-[40px] w-[46px]">
        <defs>
          <linearGradient id={`${id}-m`} x1="0" x2="1">
            <stop offset="0" stopColor="#c9c4b8" />
            <stop offset="0.3" stopColor="#fbf8f0" />
            <stop offset="0.62" stopColor="#e9e3d6" />
            <stop offset="1" stopColor="#9b9589" />
          </linearGradient>
        </defs>
        <path d="M33 13c8-2 12 2 11 8s-6 9-12 8" fill="none" stroke="#d9d3c6" strokeWidth="4" strokeLinecap="round" />
        <path d="M33 13c8-2 12 2 11 8s-6 9-12 8" fill="none" stroke="#8a857a" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <path d="M4 6h30v26c0 4-3 7-7 7H11c-4 0-7-3-7-7z" fill={`url(#${id}-m)`} />
        <ellipse cx="19" cy="6" rx="15" ry="3.6" fill="#24323c" />
        <ellipse cx="19" cy="6" rx="15" ry="3.6" fill="none" stroke="#2c4a9a" strokeWidth="1.6" />
        <path d="M9 12v18" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <circle cx="27" cy="27" r="1.6" fill="#3b3a36" opacity="0.5" />
      </svg>
    );
  if (kind === "books")
    return (
      <svg aria-hidden="true" viewBox="0 0 60 34" className="h-[34px] w-[60px]">
        <rect x="3" y="23" width="54" height="11" rx="1.5" fill="#b7452f" />
        <rect x="3" y="23" width="54" height="3" fill="#000" opacity="0.14" />
        <rect x="49" y="25" width="7" height="7" fill="#f1e8d2" />
        <path d="M50 27h6M50 29h6M50 31h6" stroke="#c9bfa6" strokeWidth="0.6" />
        <rect x="7" y="13" width="48" height="10" rx="1.5" fill="#e3c260" />
        <rect x="12" y="16" width="14" height="4" fill="#3a2f12" opacity="0.55" />
        <rect x="47" y="15" width="7" height="6" fill="#f1e8d2" />
        <rect x="1" y="4" width="50" height="9" rx="1.5" fill="#1f3d35" />
        <rect x="6" y="6.5" width="20" height="1.4" fill="#d8c98f" />
        <rect x="6" y="9.2" width="12" height="1.2" fill="#d8c98f" opacity="0.7" />
        <rect x="43" y="6" width="7" height="5" fill="#f1e8d2" />
        <rect x="1" y="4" width="50" height="2" fill="#fff" opacity="0.14" />
      </svg>
    );
  if (kind === "flask")
    return (
      <svg aria-hidden="true" viewBox="0 0 26 66" className="h-[66px] w-[26px]">
        <defs>
          <linearGradient id={`${id}-f`} x1="0" x2="1">
            <stop offset="0" stopColor="#6c757a" />
            <stop offset="0.22" stopColor="#f3f6f7" />
            <stop offset="0.5" stopColor="#aab2b6" />
            <stop offset="0.78" stopColor="#dde2e4" />
            <stop offset="1" stopColor="#525b60" />
          </linearGradient>
          <linearGradient id={`${id}-c`} x1="0" x2="1">
            <stop offset="0" stopColor="#8e2a1c" />
            <stop offset="0.3" stopColor="#e2553d" />
            <stop offset="1" stopColor="#7a2216" />
          </linearGradient>
        </defs>
        <rect x="6" y="1" width="14" height="13" rx="2.5" fill={`url(#${id}-c)`} />
        <rect x="3" y="12" width="20" height="5" rx="1.5" fill={`url(#${id}-f)`} />
        <rect x="2" y="16" width="22" height="50" rx="3.5" fill={`url(#${id}-f)`} />
        <rect x="2" y="27" width="22" height="1" fill="#000" opacity="0.25" />
        <rect x="2" y="56" width="22" height="1" fill="#000" opacity="0.25" />
      </svg>
    );
  return (
    <svg aria-hidden="true" viewBox="0 0 40 66" className="h-[66px] w-[40px]">
      <defs>
        <linearGradient id={`${id}-j`} x1="0" x2="1">
          <stop offset="0" stopColor="#6f8f86" />
          <stop offset="0.28" stopColor="#cfe2d8" />
          <stop offset="0.6" stopColor="#a4c3b6" />
          <stop offset="1" stopColor="#567168" />
        </linearGradient>
      </defs>
      <path d="M13 34L9 4" stroke="#c99a5b" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M9 4l-1-3" stroke="#3b2b1a" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M19 34V2" stroke="#2c2c2c" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M17 2h4v7h-4z" fill="#b9c1c5" />
      <path d="M24 34l5-28" stroke="#b5442e" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M29 6c2-4 4-5 5-4-0 3-2 5-5 4z" fill="#d9d2c2" />
      <path d="M29 34l7-22" stroke="#d8b271" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 32h28l-2 29c0 3-2 5-5 5H13c-3 0-5-2-5-5z" fill={`url(#${id}-j)`} />
      <ellipse cx="20" cy="32" rx="14" ry="3.2" fill="#2c3c37" />
      <path d="M8 46c8 3 16 3 24 0" stroke="#fff" strokeWidth="1" fill="none" opacity="0.35" />
      <path d="M11 37v20" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

function HungThing({ kind, id }: { kind: Hung; id: string }) {
  if (kind === "apron")
    return (
      <svg aria-hidden="true" viewBox="0 0 110 132" className="h-[132px] w-[110px]">
        <defs>
          <linearGradient id={`${id}-a`} x1="0" x2="1">
            <stop offset="0" stopColor="#8f8672" />
            <stop offset="0.14" stopColor="#d4cbb5" />
            <stop offset="0.3" stopColor="#b3aa94" />
            <stop offset="0.46" stopColor="#ded6c2" />
            <stop offset="0.62" stopColor="#b9b09a" />
            <stop offset="0.8" stopColor="#d6ceb9" />
            <stop offset="1" stopColor="#8a826e" />
          </linearGradient>
        </defs>
        <path d="M42 26C44 10 50 3 55 3s11 7 13 23" fill="none" stroke="#6b5a3e" strokeWidth="3" />
        <path d="M40 24h30l6 30c10 4 20 8 26 14l-4 62H12L8 68c6-6 16-10 26-14z" fill={`url(#${id}-a)`} />
        <path d="M34 54c14-4 28-4 42 0" fill="none" stroke="#000" strokeWidth="1" opacity="0.12" />
        <rect x="34" y="78" width="42" height="30" rx="2" fill="#000" opacity="0.07" />
        <rect x="34" y="78" width="42" height="30" rx="2" fill="none" stroke="#6b5a3e" strokeWidth="0.9" strokeDasharray="3 2" />
        <ellipse cx="30" cy="104" rx="11" ry="7" fill="#9b5a3c" opacity="0.28" />
        <ellipse cx="78" cy="66" rx="8" ry="5" fill="#9b5a3c" opacity="0.2" />
        <ellipse cx="66" cy="118" rx="14" ry="6" fill="#7b6a57" opacity="0.2" />
      </svg>
    );
  if (kind === "tote")
    return (
      <svg aria-hidden="true" viewBox="0 0 100 132" className="h-[132px] w-[100px]">
        <defs>
          <linearGradient id={`${id}-t`} x1="0" x2="1">
            <stop offset="0" stopColor="#a89a7c" />
            <stop offset="0.2" stopColor="#efe5cb" />
            <stop offset="0.52" stopColor="#d9cdb0" />
            <stop offset="0.78" stopColor="#eadfc4" />
            <stop offset="1" stopColor="#9c8f72" />
          </linearGradient>
        </defs>
        <path d="M30 52C32 20 44 4 50 4s18 16 20 48" fill="none" stroke="#cfc2a3" strokeWidth="6" />
        <path d="M30 52C32 20 44 4 50 4s18 16 20 48" fill="none" stroke="#8d8064" strokeWidth="0.8" strokeDasharray="3 2" />
        <path d="M12 48h76l5 80H7z" fill={`url(#${id}-t)`} />
        <path d="M12 52h76" stroke="#8d8064" strokeWidth="0.8" strokeDasharray="3 2" />
        <circle cx="50" cy="90" r="19" fill="#c2452d" opacity="0.9" />
        <path d="M33 96c10-12 24-12 34 0" fill="none" stroke="#efe5cb" strokeWidth="2.4" />
        <path d="M24 60v62M74 58v66" stroke="#000" strokeWidth="5" opacity="0.05" />
      </svg>
    );
  if (kind === "keys")
    return (
      <svg aria-hidden="true" viewBox="0 0 60 132" className="h-[132px] w-[60px]">
        <defs>
          <linearGradient id={`${id}-k`} x1="0" x2="1">
            <stop offset="0" stopColor="#8a6a1e" />
            <stop offset="0.35" stopColor="#f5dc8a" />
            <stop offset="0.7" stopColor="#c59a35" />
            <stop offset="1" stopColor="#7b5c16" />
          </linearGradient>
        </defs>
        <path d="M24 82C16 50 22 14 30 4c8 10 14 46 6 78z" fill="#d96a2b" />
        <path d="M27 80C21 50 25 18 30 8" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.35" />
        <path d="M33 80c6-30 2-62-3-72" fill="none" stroke="#000" strokeWidth="1.4" opacity="0.18" />
        <rect x="24" y="78" width="12" height="9" rx="2" fill="#b9c1c5" stroke="#6d777c" strokeWidth="0.8" />
        <circle cx="30" cy="94" r="7" fill="none" stroke="#c9d0d3" strokeWidth="2" />
        <g transform="rotate(14 30 100)">
          <circle cx="30" cy="106" r="6.5" fill={`url(#${id}-k)`} />
          <circle cx="30" cy="104.5" r="2" fill="#16303a" />
          <path d="M27.5 111h5v17l-2.5 3-2.5-3z" fill={`url(#${id}-k)`} />
          <path d="M32.5 116h2.6v3h-2.6zM32.5 122h3.4v2.6h-3.4z" fill="#c59a35" />
        </g>
        <g transform="rotate(-16 30 100)">
          <rect x="24" y="100" width="12" height="11" rx="3" fill="#c9d0d3" stroke="#6d777c" strokeWidth="0.7" />
          <circle cx="30" cy="104" r="1.8" fill="#16303a" />
          <path d="M28 111h4v15l-2 2.5-2-2.5z" fill="#aab3b7" />
        </g>
      </svg>
    );
  return (
    <svg aria-hidden="true" viewBox="0 0 86 132" className="h-[132px] w-[86px]">
      <defs>
        <linearGradient id={`${id}-w`} x1="0" x2="1">
          <stop offset="0" stopColor="#b7b1a2" />
          <stop offset="0.2" stopColor="#f6f2e7" />
          <stop offset="0.5" stopColor="#dcd6c7" />
          <stop offset="0.8" stopColor="#f3eee2" />
          <stop offset="1" stopColor="#a9a394" />
        </linearGradient>
      </defs>
      <path d="M14 6c18-5 40-5 58 0l4 118H10z" fill={`url(#${id}-w)`} />
      <path d="M12 76h62M11 84h64M11 100h64" stroke="#2f55a4" strokeWidth="3" opacity="0.85" />
      <path d="M11 92h64" stroke="#c2452d" strokeWidth="1.6" opacity="0.85" />
      <path d="M30 8v114M56 8v114" stroke="#000" strokeWidth="6" opacity="0.05" />
      <path d="M14 6c18-5 40-5 58 0" fill="none" stroke="#000" strokeWidth="3" opacity="0.12" />
      <path d="M10 124c22 3 44 3 66 0" fill="none" stroke="#8d8778" strokeWidth="1" strokeDasharray="1.5 2" />
    </svg>
  );
}

function Locker({ person, index, open, reduce, onToggle }: { person: (typeof team)[number]; index: number; open: boolean; reduce: boolean; onToggle: () => void }) {
  const [peek, setPeek] = useState(false);
  const target = open ? SWING : peek ? PEEK : 0;
  const raw = useSpring(open ? SWING : 0, { stiffness: 58, damping: 8.5, mass: 1.2 });
  // a door cannot swing through its own frame: the spring's undershoot is the slam
  const angle = useTransform(raw, (v) => clamp(v, 0, 125));
  const speed = useVelocity(angle);
  const lockSwing = useSpring(useTransform(speed, (v) => clamp(v * 0.07, -34, 34)), { stiffness: 120, damping: 5 });
  const hungSwing = useSpring(useTransform(speed, (v) => clamp(v * -0.022, -9, 9)), { stiffness: 46, damping: 3.2 });
  const door = useTransform(angle, (v) => `rotateY(${(-v).toFixed(2)}deg)`);
  const inside = useTransform(angle, (v) => 0.42 + clamp(v / 70, 0, 1) * 0.58);
  const doorShade = useTransform(angle, (v) => clamp(v / 100, 0, 1) * 0.3);
  const fall = useTransform(angle, (v) => clamp((v - 20) / 70, 0, 1));
  const id = `locker-${index}`;
  const no = String(index * 3 + 11).padStart(2, "0");

  useEffect(() => {
    if (reduce) raw.jump(open ? SWING : 0);
    else raw.set(target);
  }, [open, raw, reduce, target]);

  return (
    <li className="absolute top-0 list-none" style={{ left: index * CELL, width: CELL, height: DOOR_H + 12, perspective: 1400, perspectiveOrigin: "50% 42%" }}>
      {/* the opening and what is kept in it */}
      <div className="absolute overflow-hidden" style={{ left: 6, top: 6, width: DOOR_W, height: DOOR_H, background: "#081a21" }}>
        <motion.div className="absolute inset-0" style={{ opacity: inside }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,#0b222b 0,#19404d 13px,#19404d calc(100% - 13px),#0b222b 100%)" }} />
          <div className="absolute inset-x-[13px] bottom-[18px] top-[9px]" style={{ backgroundColor: "#2b5a6b", backgroundImage: `${speckle}, linear-gradient(180deg,#1b3f4c 0%,#2f6173 30%,#356a7d 70%,#28515f 100%)`, backgroundSize: `${speckleSize}, auto`, boxShadow: "inset 0 0 22px rgba(0,0,0,0.5)" }} />
          <div className="absolute inset-x-0 bottom-0 h-[18px]" style={{ background: "linear-gradient(180deg,#123039,#2b5969)" }} />
          {/* shelf */}
          <div className="absolute inset-x-[13px] top-[96px] h-[22px]" style={{ background: "linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0))" }} />
          <div className="absolute inset-x-[5px] top-[91px] h-[6px] rounded-[1px]" style={{ background: "linear-gradient(180deg,#8fc0d2 0%,#4d8a9f 30%,#2a5868 100%)", boxShadow: "0 1px 0 rgba(0,0,0,0.5)" }} />
          <div className="absolute inset-x-[20px] top-[25px] flex h-[66px] items-end justify-around">
            <ShelfThing kind={person.shelf[0]} id={`${id}-s0`} />
            <ShelfThing kind={person.shelf[1]} id={`${id}-s1`} />
          </div>
          {/* the portrait, taped to the back wall */}
          <figure className="absolute left-1/2 top-[108px] m-0 w-[136px]" style={{ transform: `translateX(-50%) rotate(${person.tilt}deg)` }}>
            <div className="p-[6px] pb-[7px]" style={{ background: "linear-gradient(170deg,#fdfbf5,#ebe6d9)", boxShadow: "0 1px 1px rgba(0,0,0,0.5), 2px 7px 12px rgba(0,0,0,0.45)" }}>
              <div className="relative h-[156px] overflow-hidden" style={{ backgroundColor: person.photo.tone }}>
                <img src={person.photo.src} alt={person.photo.alt} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: person.photo.focus }} />
                <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(118deg,rgba(255,255,255,0.22) 0%,rgba(255,255,255,0) 30%,rgba(0,0,0,0) 70%,rgba(0,0,0,0.14) 100%)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)" }} />
              </div>
            </div>
            {[0, 1].map((n) => (
              <span
                key={n}
                aria-hidden="true"
                className="absolute top-[-7px] h-[15px] w-[40px]"
                style={{
                  [n ? "right" : "left"]: -9,
                  transform: `rotate(${n ? 38 : -34}deg)`,
                  background: "linear-gradient(180deg,rgba(240,226,180,0.94),rgba(222,205,152,0.9))",
                  clipPath: "polygon(0 12%,6% 0,12% 14%,100% 4%,96% 50%,100% 96%,90% 86%,84% 100%,0 92%,4% 50%)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.35)",
                }}
              />
            ))}
            <figcaption className="relative mx-auto mt-[7px] w-[124px] px-[6px] py-[3px] text-center" style={{ transform: `rotate(${-person.tilt * 1.4}deg)`, background: "linear-gradient(180deg,#f0e2b4,#dfcd98)", boxShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
              <span className="block truncate font-serif text-[11.5px] font-semibold italic leading-[1.15] text-[#1d2a30]">{person.name}</span>
              <span className="block truncate font-serif text-[9.5px] italic leading-[1.2] text-[#3c4a50]">{person.tape}</span>
            </figcaption>
          </figure>
          {/* hook and whatever hangs on it */}
          <div aria-hidden="true" className="absolute left-1/2 top-[318px] h-[10px] w-[28px] -translate-x-1/2 rounded-[2px]" style={{ background: chrome, boxShadow: "0 2px 3px rgba(0,0,0,0.5)" }} />
          <motion.div aria-hidden="true" className="absolute left-1/2 top-[322px]" style={{ x: "-50%", rotate: hungSwing, transformOrigin: "50% 4px", filter: "drop-shadow(3px 6px 5px rgba(0,0,0,0.45))" }}>
            <HungThing kind={person.hung} id={`${id}-h`} />
          </motion.div>
          <div aria-hidden="true" className="absolute left-1/2 top-[320px] h-[9px] w-[9px] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%,#fff,#aab3b7 45%,#59636a)" }} />
          {/* light falling in from the room */}
          <motion.div aria-hidden="true" className="absolute inset-0" style={{ opacity: fall, background: "linear-gradient(200deg,rgba(0,0,0,0.5) 0%,rgba(0,0,0,0.12) 26%,rgba(255,255,255,0) 52%,rgba(255,240,214,0.09) 100%)" }} />
        </motion.div>
        <div aria-hidden="true" className="absolute inset-0" style={{ boxShadow: "inset 0 10px 14px rgba(0,0,0,0.6), inset 9px 0 12px rgba(0,0,0,0.38), inset -6px 0 10px rgba(0,0,0,0.3)" }} />
      </div>

      {/* the door */}
      <motion.div aria-hidden="true" className="absolute" style={{ left: 6, top: 6, width: DOOR_W, height: DOOR_H, transformOrigin: "0% 50%", transformStyle: "preserve-3d", transform: door }}>
        <div
          className="absolute inset-0 overflow-hidden rounded-[3px]"
          style={{
            backfaceVisibility: "hidden",
            backgroundColor: PAINT,
            backgroundImage: `${speckle}, linear-gradient(90deg,rgba(255,255,255,0) 8%,rgba(255,255,255,0.13) 15%,rgba(255,255,255,0.02) 26%,rgba(0,0,0,0) 62%,rgba(0,0,0,0.17) 100%), linear-gradient(180deg,#3d7a90 0%,#2f6377 46%,#27556a 100%)`,
            backgroundSize: `${speckleSize}, auto, auto`,
            boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(0,0,0,0.38), inset 0 0 0 3px rgba(0,0,0,0.05)",
          }}
        >
          <Louvres top={26} />
          <Louvres top={388} />
          {/* pressed panel */}
          <div className="absolute inset-x-[14px] bottom-[96px] top-[100px] rounded-[4px]" style={{ boxShadow: "inset 1px 1px 0 rgba(0,0,0,0.22), inset -1px -1px 0 rgba(255,255,255,0.16), 1px 1px 0 rgba(255,255,255,0.1), -1px -1px 0 rgba(0,0,0,0.14)" }} />
          {/* card holder */}
          <div className="absolute left-[20px] top-[118px] h-[38px] w-[108px] rounded-[3px] p-[3px]" style={{ background: chrome, boxShadow: "0 2px 3px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(0,0,0,0.5)" }}>
            <div className="flex h-full items-center gap-[6px] rounded-[1px] px-[6px]" style={{ background: "linear-gradient(180deg,#f7f1e1,#e6dec8)", boxShadow: "inset 0 2px 3px rgba(0,0,0,0.35)" }}>
              <span className="font-mono text-[11px] font-bold leading-none text-[#b3341f]">{no}</span>
              <span className="truncate font-mono text-[9px] font-bold leading-none tracking-[0.06em] text-[#1c2529]">{person.plate}</span>
            </div>
          </div>
          {/* recessed pull with a padlock through the hasp */}
          <div className="absolute right-[16px] top-[196px] h-[74px] w-[30px] rounded-[15px]" style={{ background: "linear-gradient(180deg,#0a1e26,#1d4756)", boxShadow: "inset 0 4px 6px rgba(0,0,0,0.75), inset 0 -1px 0 rgba(255,255,255,0.2), 0 1px 0 rgba(255,255,255,0.2)" }}>
            <div className="absolute left-1/2 top-[9px] h-[38px] w-[11px] -translate-x-1/2 rounded-[5px]" style={{ background: chromeAcross, boxShadow: "0 2px 3px rgba(0,0,0,0.6)" }} />
            <div className="absolute left-1/2 top-[44px] h-[12px] w-[16px] -translate-x-1/2 rounded-[3px]" style={{ background: chrome, boxShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
              <span className="absolute left-1/2 top-[3px] h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-[#0a1e26]" />
            </div>
            <motion.svg viewBox="0 0 26 38" className="absolute left-[2px] top-[46px] h-[38px] w-[26px]" style={{ rotate: lockSwing, transformOrigin: "50% 3px", filter: "drop-shadow(1px 3px 2px rgba(0,0,0,0.5))" }}>
              <defs>
                <linearGradient id={`${id}-pl`} x1="0" x2="1">
                  <stop offset="0" stopColor="#7d5d17" />
                  <stop offset="0.3" stopColor="#f7df90" />
                  <stop offset="0.62" stopColor="#c99d37" />
                  <stop offset="1" stopColor="#6f5113" />
                </linearGradient>
              </defs>
              <path d="M7 18V9a6 6 0 0 1 12 0v9" fill="none" stroke="#d5dadc" strokeWidth="3" />
              <path d="M7 18V9a6 6 0 0 1 12 0v9" fill="none" stroke="#6d777c" strokeWidth="0.7" />
              <rect x="2" y="16" width="22" height="20" rx="3.5" fill={`url(#${id}-pl)`} />
              <rect x="2" y="16" width="22" height="3" rx="1.5" fill="#fff" opacity="0.3" />
              <circle cx="13" cy="26" r="2.2" fill="#3a2a08" />
              <path d="M12.2 27h1.6v4.4h-1.6z" fill="#3a2a08" />
            </motion.svg>
          </div>
          {/* scuffs low down where boots catch it */}
          <div className="absolute inset-x-0 bottom-0 h-[60px]" style={{ background: "linear-gradient(8deg,rgba(255,255,255,0.07) 0 1px,rgba(0,0,0,0) 2px), linear-gradient(-5deg,rgba(0,0,0,0) 44%,rgba(255,255,255,0.06) 45%,rgba(0,0,0,0) 47%), linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.12))" }} />
          <motion.div className="absolute inset-0 bg-black" style={{ opacity: doorShade }} />
        </div>
        {/* folded edge */}
        <div className="absolute top-0 h-full" style={{ left: DOOR_W, width: THICK, transformOrigin: "0% 50%", transform: "rotateY(90deg)", background: `linear-gradient(90deg,#3f7d93,${PAINT_DARK})` }} />
        {/* inside face */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[3px]"
          style={{ backfaceVisibility: "hidden", transform: `translateZ(${-THICK}px) rotateY(180deg)`, backgroundColor: "#3a7388", backgroundImage: `${speckle}, linear-gradient(90deg,#4b8aa0 0%,#356c80 40%,#24505f 100%)`, backgroundSize: `${speckleSize}, auto`, boxShadow: "inset 0 0 0 5px rgba(0,0,0,0.12), inset 0 0 0 6px rgba(255,255,255,0.14)" }}
        >
          <div className="absolute inset-x-[30px] bottom-[26px] top-[26px] rounded-[3px]" style={{ boxShadow: "inset 2px 2px 0 rgba(255,255,255,0.14), inset -2px -2px 0 rgba(0,0,0,0.2)" }} />
          <div className="absolute left-[44px] top-[120px] h-[150px] w-[96px] rounded-[2px]" style={{ background: "linear-gradient(135deg,#eef4f6 0%,#9fb4bc 45%,#dfe9ec 60%,#8aa0a8 100%)", boxShadow: "0 0 0 4px #1c4252, 0 3px 6px rgba(0,0,0,0.4)" }} />
          <div className="absolute left-[52px] top-[300px] h-[58px] w-[80px]" style={{ background: "linear-gradient(180deg,#f7f1e1,#e2dac4)", boxShadow: "0 2px 4px rgba(0,0,0,0.4)", transform: "rotate(-3deg)" }} />
        </div>
      </motion.div>

      {/* hinges stay with the frame */}
      {[58, 232, 406].map((y) => (
        <span key={y} aria-hidden="true" className="absolute left-[2px] h-[26px] w-[8px] rounded-[3px]" style={{ top: y, background: chromeAcross, boxShadow: "0 1px 2px rgba(0,0,0,0.6)" }} />
      ))}

      <button
        type="button"
        aria-expanded={open}
        aria-label={`${open ? "Close" : "Open"} locker ${no}, ${person.name}, ${person.role.toLowerCase()}`}
        onClick={onToggle}
        onPointerEnter={(e) => e.pointerType === "mouse" && setPeek(true)}
        onPointerLeave={() => setPeek(false)}
        className="absolute rounded-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-300"
        style={{ left: 6, top: 6, width: DOOR_W, height: DOOR_H }}
      />
    </li>
  );
}

const SETS = [
  [true, false, true, false],
  [false, true, false, true],
];

export default function StaffLockerWall() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<boolean[]>(SETS[0]);
  const [focus, setFocus] = useState(1);
  const hold = useRef({ touched: false, over: false, scale: 1, width: SCENE_W });
  const pan = useSpring(0, { stiffness: 90, damping: 18 });

  // fit the wall to the frame; on narrow screens keep it large and slide to the locker in play
  const place = useCallback(
    (jump: boolean) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const w = wrap.clientWidth;
      const sc = clamp(w / SCENE_W, 0.72, 1.1);
      hold.current.scale = sc;
      wrap.style.height = `${Math.round(SCENE_H * sc + (w < 640 ? 44 : 0))}px`;
      const centre = (BANK_X + CELL * (focus + 0.5)) * sc;
      const x = SCENE_W * sc <= w ? (w - SCENE_W * sc) / 2 : clamp(w / 2 - centre, w - SCENE_W * sc + 20 * sc, -20 * sc);
      if (sceneRef.current) sceneRef.current.style.transform = `scale(${sc.toFixed(4)})`;
      if (jump || reduce) pan.jump(x);
      else pan.set(x);
    },
    [focus, pan, reduce],
  );

  useEffect(() => {
    place(true);
    const ro = new ResizeObserver(() => place(true));
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => place(false), [place]);

  // two lockers stand open from the first frame; the pairs then swap by themselves until someone takes over
  useEffect(() => {
    if (reduce) return;
    let n = 0;
    const timers: number[] = [];
    const swap = () => {
      const s = hold.current;
      if (s.touched || s.over || document.hidden) return;
      n += 1;
      const next = SETS[n % 2];
      setOpen((cur) => cur.map(() => false));
      timers.push(
        window.setTimeout(() => {
          if (hold.current.touched) return;
          setOpen(next);
          setFocus(n % 2 ? 2 : 1);
        }, 620),
      );
    };
    const first = window.setTimeout(swap, 3000);
    const loop = window.setInterval(swap, 4200);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [reduce]);

  const toggle = (i: number) => {
    hold.current.touched = true;
    setOpen((cur) => cur.map((v, k) => (k === i ? !v : v)));
    setFocus(i);
  };
  const step = (d: number) => {
    hold.current.touched = true;
    const to = (focus + d + team.length) % team.length;
    setFocus(to);
    setOpen(team.map((_, k) => k === to));
  };

  const shown = open[focus] ? focus : open.indexOf(true);
  const person = team[shown < 0 ? focus : shown];

  return (
    <section aria-label={`The people of ${studio}`} className="relative overflow-hidden bg-[#e4dccb]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 62% at 40% 30%, #f4eee0 0%, #e6decd 52%, #cfc5b0 100%)" }} />
      <div
        ref={wrapRef}
        onPointerEnter={() => (hold.current.over = true)}
        onPointerLeave={() => (hold.current.over = false)}
        className="relative w-full overflow-hidden"
        style={{ height: SCENE_H }}
      >
        <motion.div className="absolute left-0 top-0" style={{ x: pan }}>
          <div ref={sceneRef} className="relative origin-top-left" style={{ width: SCENE_W, height: SCENE_H }}>
            {/* floor */}
            <div aria-hidden="true" className="absolute inset-x-[-400px] bottom-[-200px]" style={{ top: BANK_Y + DOOR_H + 32, background: "linear-gradient(180deg,#b9ad95 0px,#cbbfa8 14px,#d8ceb9 90px,#d8ceb9 100%)" }} />
            <div aria-hidden="true" className="absolute inset-x-[-400px] h-[3px]" style={{ top: BANK_Y + DOOR_H + 30, background: "linear-gradient(180deg,rgba(0,0,0,0.16),rgba(255,255,255,0.3))" }} />
            {/* shadow the bank throws on wall and floor */}
            <div aria-hidden="true" className="absolute rounded-[10px]" style={{ left: BANK_X + 14, top: BANK_Y + 10, width: CELL * team.length + 26, height: DOOR_H + 20, background: "rgba(70,52,30,0.4)", filter: "blur(22px)" }} />
            <div aria-hidden="true" className="absolute" style={{ left: BANK_X - 30, top: BANK_Y + DOOR_H + 30, width: CELL * team.length + 90, height: 34, background: "radial-gradient(50% 100% at 50% 0%, rgba(40,28,12,0.55), rgba(40,28,12,0))" }} />
            {/* plinth */}
            <div aria-hidden="true" className="absolute" style={{ left: BANK_X + 6, top: BANK_Y + DOOR_H + 12, width: CELL * team.length - 12, height: 24, background: "linear-gradient(180deg,#0c1f27,#16343f)" }} />
            {/* carcass */}
            <div
              aria-hidden="true"
              className="absolute rounded-[4px]"
              style={{
                left: BANK_X - 4,
                top: BANK_Y - 6,
                width: CELL * team.length + 8,
                height: DOOR_H + 22,
                background: `linear-gradient(180deg,#4a8aa1 0,#27566a 5px,${PAINT_DARK} 100%)`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.4), 0 1px 0 rgba(0,0,0,0.4)",
              }}
            />
            <ul className="absolute m-0 p-0" style={{ left: BANK_X, top: BANK_Y, width: CELL * team.length, height: DOOR_H + 12 }}>
              {team.map((p, i) => (
                <Locker key={p.name} person={p} index={i} open={open[i]} reduce={reduce} onToggle={() => toggle(i)} />
              ))}
            </ul>
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-7">
        <p aria-live="polite" className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-[#2a2620] sm:text-[11px]">
          <span className="font-bold">{person.name}</span>
          <br />
          <span className="text-[#4c4638]">{person.role}</span>
        </p>
        <div className="pointer-events-auto flex gap-2">
          <button type="button" onClick={() => step(-1)} aria-label="Open the locker to the left" className="grid h-10 w-10 place-items-center rounded-full border border-[#2a2620]/30 bg-[#f4eee0]/80 text-[#2a2620] transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1c4252] active:scale-95">
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Open the locker to the right" className="grid h-10 w-10 place-items-center rounded-full border border-[#2a2620]/30 bg-[#f4eee0]/80 text-[#2a2620] transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1c4252] active:scale-95">
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
