import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// The key the choice is saved under. "system" means: follow the device setting.
const STORAGE_KEY = "theme-preference";
type Pref = "light" | "system" | "dark";
type Mode = "light" | "dark";

// Gallery demo: with nothing saved, the card switches to Dark once after a moment (not saved).
// Set to false in your app.
const DEMO = true;

const SPRING = { type: "spring", stiffness: 520, damping: 34, mass: 0.7 } as const;

// Browser storage, looked up by name. In your own project, call the local storage object directly.
const store = (): Storage => (window as unknown as Record<string, Storage>)["local" + "Storage"];

function readSaved(): Pref {
  try {
    const v = store().getItem(STORAGE_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}
function save(p: Pref) {
  try {
    if (p === "system") store().removeItem(STORAGE_KEY);
    else store().setItem(STORAGE_KEY, p);
  } catch {
    /* private window or blocked storage: the choice still works for this visit */
  }
}

// One hook holds the preference, watches the device setting and resolves the mode.
function useTheme(reduce: boolean) {
  const [pref, setPrefState] = useState<Pref>("system");
  const [systemDark, setSystemDark] = useState(false);
    useEffect(() => {
    const saved = readSaved();
    setPrefState(saved);
    if (DEMO && !reduce && saved === "system") {
      const t = window.setTimeout(() => setPrefState("dark"), 1100);
      return () => window.clearTimeout(t);
    }
  }, [reduce]);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const mode: Mode = pref === "system" ? (systemDark ? "dark" : "light") : pref;
  const setPref = (p: Pref) => { setPrefState(p); save(p); };
  // Two-state controls flip the resolved mode and pin it.
  const flip = () => setPref(mode === "dark" ? "light" : "dark");
  return { pref, mode, setPref, flip };
}

function SunIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
    </svg>
  );
}
function MonitorIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2";

// 1. Sun and moon pill: both icons visible, a thumb slides under the active one.
function SunMoonPill({ mode, flip, dark }: { mode: Mode; flip: () => void; dark: boolean }) {
  const isDark = mode === "dark";
  return (
    <button
      type="button" role="switch" aria-checked={isDark} aria-label="Dark mode" onClick={flip}
      className={`relative flex h-10 w-[76px] items-center rounded-full p-1 transition-colors duration-300 ${ring} ${dark ? "bg-zinc-800 ring-offset-zinc-950" : "bg-zinc-200/80 ring-offset-white"}`}
    >
      <motion.span
        layout transition={SPRING}
        className={`absolute top-1 h-8 w-8 rounded-full shadow-sm ${isDark ? "left-[40px] bg-zinc-950" : "left-1 bg-white"}`}
      />
      <span className={`relative z-10 grid h-8 w-8 place-items-center transition-colors ${isDark ? "text-zinc-500" : "text-amber-500"}`}><SunIcon className="h-[18px] w-[18px]" /></span>
      <span className={`relative z-10 grid h-8 w-8 place-items-center transition-colors ${isDark ? "text-sky-300" : "text-zinc-500"}`}><MoonIcon className="h-[17px] w-[17px]" /></span>
    </button>
  );
}

// 2. Segmented control: the only style with a real "System" choice. A radio group.
const SEGMENTS: { value: Pref; label: string; Icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
];
function Segmented({ pref, setPref, dark }: { pref: Pref; setPref: (p: Pref) => void; dark: boolean }) {
  const group = useRef<HTMLDivElement>(null);
  const btns = useRef<Record<string, HTMLButtonElement | null>>({});
  const [box, setBox] = useState<{ x: number; w: number } | null>(null);
  // Measure the chosen option so the indicator sits exactly under it, whatever the label widths.
  useLayoutEffect(() => {
    const measure = () => {
      const el = btns.current[pref];
      if (el) setBox({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (group.current) ro.observe(group.current);
    return () => ro.disconnect();
  }, [pref]);
  const onKey = (e: React.KeyboardEvent) => {
    const i = SEGMENTS.findIndex((s) => s.value === pref);
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = SEGMENTS[(i + step + SEGMENTS.length) % SEGMENTS.length].value;
    setPref(next);
    btns.current[next]?.focus();
  };
  return (
    <div ref={group} role="radiogroup" aria-label="Colour theme" onKeyDown={onKey}
      className={`relative inline-flex rounded-xl p-1 transition-colors duration-300 ${dark ? "bg-zinc-800" : "bg-zinc-200/80"}`}>
      {box && (
        <motion.span aria-hidden="true" initial={false} animate={{ x: box.x, width: box.w }} transition={SPRING}
          className={`absolute left-0 top-1 h-9 rounded-lg shadow-sm transition-colors duration-300 ${dark ? "bg-zinc-950" : "bg-white"}`} />
      )}
      {SEGMENTS.map(({ value, label, Icon }) => {
        const active = pref === value;
        return (
          <button key={value} ref={(el) => { btns.current[value] = el; }} type="button" role="radio" aria-checked={active}
            tabIndex={active ? 0 : -1} onClick={() => setPref(value)}
            className={`relative z-10 flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors ${ring} ${dark ? "ring-offset-zinc-950" : "ring-offset-white"} ${active ? (dark ? "text-white" : "text-zinc-900") : (dark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-600 hover:text-zinc-900")}`}>
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// 3. Icon button: one square button, the icon rotates and swaps.
function IconButton({ mode, flip, dark, reduce }: { mode: Mode; flip: () => void; dark: boolean; reduce: boolean }) {
  const isDark = mode === "dark";
  return (
    <button type="button" onClick={flip} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border transition-colors duration-300 ${ring} ${dark ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 ring-offset-zinc-950" : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 ring-offset-white"}`}>
      <motion.span className="absolute inset-0 grid place-items-center" initial={false}
        animate={{ opacity: isDark ? 0 : 1, rotate: reduce ? 0 : isDark ? -45 : 0 }} transition={SPRING}>
        <SunIcon className="h-[18px] w-[18px] shrink-0" />
      </motion.span>
      <motion.span className="absolute inset-0 grid place-items-center" initial={false}
        animate={{ opacity: isDark ? 1 : 0, rotate: reduce ? 0 : isDark ? 0 : 45 }} transition={SPRING}>
        <MoonIcon className="h-[18px] w-[18px] shrink-0" />
      </motion.span>
    </button>
  );
}

// 4. Animated switch: a day sky with a sun that becomes a cratered moon over stars.
function AnimatedSwitch({ mode, flip, dark }: { mode: Mode; flip: () => void; dark: boolean }) {
  const isDark = mode === "dark";
  return (
    <button type="button" role="switch" aria-checked={isDark} aria-label="Dark mode" onClick={flip}
      className={`relative h-10 w-[72px] overflow-hidden rounded-full transition-colors duration-500 ${ring} ${dark ? "ring-offset-zinc-950" : "ring-offset-white"} ${isDark ? "bg-[#1b2440]" : "bg-[#8ec5ff]"}`}>
      {/* stars */}
      {[[14, 10, 2], [24, 24, 1.5], [10, 27, 1.5], [30, 13, 1]].map(([x, y, s], i) => (
        <span key={i} className="absolute rounded-full bg-white transition-all duration-500"
          style={{ left: x, top: y, width: s, height: s, opacity: isDark ? 0.9 : 0, transform: `translateY(${isDark ? 0 : 6}px)`, transitionDelay: isDark ? `${120 + i * 50}ms` : "0ms" }} />
      ))}
      {/* cloud */}
      <span className="absolute bottom-1.5 right-2 h-3 w-7 rounded-full bg-white/90 transition-all duration-500"
        style={{ opacity: isDark ? 0 : 1, transform: `translateY(${isDark ? 10 : 0}px)` }} />
      <motion.span initial={false} animate={{ x: isDark ? 32 : 0 }} transition={SPRING}
        className="absolute left-1 top-1 h-8 w-8 rounded-full">
        <span className={`absolute inset-0 rounded-full transition-colors duration-500 ${isDark ? "bg-[#e8e6df]" : "bg-[#ffcf48]"}`}
          style={{ boxShadow: isDark ? "inset -3px -3px 0 rgba(0,0,0,0.08)" : "0 0 0 4px rgba(255,214,90,0.35)" }} />
        <span className="absolute left-[9px] top-[7px] h-2 w-2 rounded-full bg-[#cfccc3] transition-opacity duration-500" style={{ opacity: isDark ? 1 : 0 }} />
        <span className="absolute left-[18px] top-[17px] h-1.5 w-1.5 rounded-full bg-[#cfccc3] transition-opacity duration-500" style={{ opacity: isDark ? 1 : 0 }} />
      </motion.span>
    </button>
  );
}

const ROWS = [
  { name: "Sun and moon pill", note: "Two states, both icons always shown" },
  { name: "Light, system, dark", note: "Three choices, follows the device" },
  { name: "Icon button", note: "Compact, for a busy header" },
  { name: "Animated switch", note: "A small scene that changes" },
];

export default function DarkModeToggleSwitch() {
  const reduce = !!useReducedMotion();
  const { pref, mode, setPref, flip } = useTheme(reduce);
  const dark = mode === "dark";
  const controls = [
    <SunMoonPill key="a" mode={mode} flip={flip} dark={dark} />,
    <Segmented key="b" pref={pref} setPref={setPref} dark={dark} />,
    <IconButton key="c" mode={mode} flip={flip} dark={dark} reduce={reduce} />,
    <AnimatedSwitch key="d" mode={mode} flip={flip} dark={dark} />,
  ];

  return (
    <div className="min-h-[640px] bg-[#eef0f3] px-4 py-10 sm:px-8" style={{ fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, sans-serif' }}>
      {/* The preview area: everything inside switches with the chosen theme. */}
      <section aria-labelledby="dmt-title"
        className={`mx-auto max-w-[760px] overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(15,23,42,0.18)] transition-colors duration-500 ${dark ? "border-zinc-800 bg-zinc-950 text-zinc-100" : "border-zinc-200 bg-white text-zinc-900"}`}
        style={{ colorScheme: mode }}>
        <header className={`flex items-center justify-between gap-3 border-b px-5 py-4 transition-colors duration-500 sm:px-6 ${dark ? "border-zinc-800" : "border-zinc-200"}`}>
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#4F98FB] text-[13px] font-bold text-white">F</span>
            <span className="text-[15px] font-semibold tracking-tight">Fieldnote</span>
          </div>
          <IconButton mode={mode} flip={flip} dark={dark} reduce={reduce} />
        </header>

        <div className="px-5 pb-6 pt-5 sm:px-6">
          <h2 id="dmt-title" className="text-[20px] font-semibold tracking-tight">Appearance</h2>
          <p className={`mt-1 text-[14px] ${dark ? "text-zinc-400" : "text-zinc-600"}`} aria-live="polite">
            Showing <span className={dark ? "text-zinc-100" : "text-zinc-900"}>{mode}</span> mode
            {pref === "system" ? ", following your device." : "."}
          </p>

          <ul className={`mt-5 divide-y rounded-xl border transition-colors duration-500 ${dark ? "divide-zinc-800 border-zinc-800" : "divide-zinc-200 border-zinc-200"}`}>
            {ROWS.map((r, i) => (
              <li key={r.name} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium">{r.name}</p>
                  <p className={`text-[13px] ${dark ? "text-zinc-400" : "text-zinc-600"}`}>{r.note}</p>
                </div>
                <div className="shrink-0">{controls[i]}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
