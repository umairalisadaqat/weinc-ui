import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";

/* ------------------------------------------------------------------ */
/* 1. The toast store. Copy this block into lib/toast.ts in your app.  */
/* ------------------------------------------------------------------ */

type ToastType = "success" | "error" | "info" | "loading";
type ToastAction = { label: string; onClick: () => void };
type ToastItem = {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
  duration: number;
};
type ToastOptions = Partial<Omit<ToastItem, "id" | "title" | "type">>;

const DEFAULT_DURATION = 5000;
const MAX_TOASTS = 5;
const VISIBLE_WHEN_STACKED = 3;

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => toasts;

function push(type: ToastType, title: string, opts: ToastOptions = {}) {
  const id = nextId++;
  const duration = opts.duration ?? (type === "loading" ? Infinity : type === "error" ? 8000 : DEFAULT_DURATION);
  toasts = [{ id, type, title, ...opts, duration }, ...toasts].slice(0, MAX_TOASTS);
  emit();
  return id;
}

function update(id: number, type: ToastType, title: string, opts: ToastOptions = {}) {
  toasts = toasts.map((t) =>
    t.id === id ? { ...t, type, title, description: opts.description, action: opts.action, duration: opts.duration ?? DEFAULT_DURATION } : t,
  );
  emit();
}

function dismiss(id?: number) {
  toasts = id === undefined ? [] : toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = Object.assign((title: string, opts?: ToastOptions) => push("info", title, opts), {
  success: (title: string, opts?: ToastOptions) => push("success", title, opts),
  error: (title: string, opts?: ToastOptions) => push("error", title, opts),
  info: (title: string, opts?: ToastOptions) => push("info", title, opts),
  loading: (title: string, opts?: ToastOptions) => push("loading", title, opts),
  dismiss,
  promise<T>(work: Promise<T>, msg: { loading: string; success: string; error: string }) {
    const id = push("loading", msg.loading);
    work.then(
      () => update(id, "success", msg.success),
      () => update(id, "error", msg.error),
    );
    return work;
  },
});

/* ------------------------------------------------------------------ */
/* 2. Icons and colours per type                                       */
/* ------------------------------------------------------------------ */

function TypeIcon({ type }: { type: ToastType }) {
  if (type === "loading") {
    return (
      <svg viewBox="0 0 20 20" className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
        <path d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  const paths: Record<Exclude<ToastType, "loading">, string> = {
    success: "M6.5 10.5l2.4 2.4 4.6-5.3",
    error: "M10 6.2v4.6M10 13.6v.1",
    info: "M10 9.2v4.6M10 6.4v.1",
  };
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" fill="currentColor" />
      <path d={paths[type]} fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICON_COLOUR: Record<ToastType, string> = {
  success: "text-emerald-600",
  error: "text-red-600",
  info: "text-sky-600",
  loading: "text-slate-500",
};
const ICON_COLOUR_DARK: Record<ToastType, string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  info: "text-sky-400",
  loading: "text-slate-400",
};

/* ------------------------------------------------------------------ */
/* 3. One toast: its own timer, swipe and close button                 */
/* ------------------------------------------------------------------ */

type ToastCardProps = {
  item: ToastItem;
  index: number;
  offset: number;
  frontHeight: number;
  expanded: boolean;
  paused: boolean;
  dark: boolean;
  reduced: boolean;
  onHeight: (id: number, h: number) => void;
};

function ToastCard({ item, index, offset, frontHeight, expanded, paused, dark, reduced, onHeight }: ToastCardProps) {
  const ref = useRef<HTMLLIElement>(null);
  const remaining = useRef(item.duration);
  const [progressKey, setProgressKey] = useState(0);

  // Reset the clock when the toast changes type (loading -> success).
  useEffect(() => {
    remaining.current = item.duration;
    setProgressKey((k) => k + 1);
  }, [item.type, item.duration]);

  useEffect(() => {
    if (paused || !Number.isFinite(item.duration)) return;
    const started = Date.now();
    const timer = window.setTimeout(() => dismiss(item.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, item.id, item.duration, progressKey]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => onHeight(item.id, el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [item.id, onHeight]);

  const hidden = index >= VISIBLE_WHEN_STACKED && !expanded;
  const behind = index > 0 && !expanded;
  const y = expanded ? -offset : -index * 14;
  const scale = expanded ? 1 : 1 - index * 0.05;

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 600) dismiss(item.id);
  };

  const surface = dark
    ? "bg-zinc-900 text-zinc-50 ring-1 ring-white/10 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.7)]"
    : "bg-white text-zinc-900 ring-1 ring-zinc-900/[0.07] shadow-[0_1px_2px_rgba(16,24,40,0.05),0_12px_32px_-12px_rgba(16,24,40,0.22)]";
  const muted = dark ? "text-zinc-400" : "text-zinc-600";

  return (
    <motion.li
      ref={ref}
      role={item.type === "error" ? "alert" : "status"}
      aria-atomic="true"
      tabIndex={-1}
      layout={false}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: hidden ? 0 : 1, y: reduced ? (expanded ? -offset : 0) : y, scale: reduced ? 1 : scale }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36, mass: 0.8 }}
      drag={reduced ? false : "x"}
      dragSnapToOrigin
      dragElastic={0.5}
      onDragEnd={onDragEnd}
      style={{
        zIndex: MAX_TOASTS - index,
        height: behind && frontHeight ? frontHeight : undefined,
        pointerEvents: hidden ? "none" : "auto",
        transformOrigin: "bottom center",
      }}
      aria-hidden={hidden || undefined}
      className={`absolute bottom-0 left-0 right-0 cursor-grab touch-pan-y select-none overflow-hidden rounded-2xl active:cursor-grabbing ${surface}`}
    >
      <div
        className={`flex items-start gap-3 p-4 pr-3 transition-opacity duration-200 ${behind ? "opacity-0" : "opacity-100"}`}
      >
        <span className={`mt-px shrink-0 ${dark ? ICON_COLOUR_DARK[item.type] : ICON_COLOUR[item.type]}`}>
          <TypeIcon type={item.type} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-5 tracking-[-0.01em]">{item.title}</p>
          {item.description && <p className={`mt-0.5 text-[13px] leading-5 ${muted}`}>{item.description}</p>}
        </div>
        {item.action && (
          <button
            type="button"
            tabIndex={behind ? -1 : 0}
            onClick={() => {
              item.action?.onClick();
              dismiss(item.id);
            }}
            className={`shrink-0 self-center rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
              dark ? "bg-white text-zinc-900 hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-700"
            }`}
          >
            {item.action.label}
          </button>
        )}
        <button
          type="button"
          tabIndex={behind ? -1 : 0}
          aria-label={`Dismiss: ${item.title}`}
          onClick={() => dismiss(item.id)}
          className={`-my-1 grid h-8 w-8 shrink-0 place-items-center self-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
            dark ? "text-zinc-400 hover:bg-white/10 hover:text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {Number.isFinite(item.duration) && !behind && (
        <span
          key={progressKey}
          aria-hidden="true"
          className={`absolute bottom-0 left-0 h-[2px] w-full origin-left motion-reduce:hidden ${dark ? "bg-white/25" : "bg-zinc-900/15"}`}
          style={{
            animation: `rtn-shrink ${item.duration}ms linear forwards`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      )}
    </motion.li>
  );
}

/* ------------------------------------------------------------------ */
/* 4. The viewport. Render once near the root of your app.             */
/* ------------------------------------------------------------------ */

function Toaster({ dark, className = "", holdOpenFor = 0 }: { dark: boolean; className?: string; holdOpenFor?: number }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const reduced = useReducedMotion() ?? false;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [heights, setHeights] = useState<Record<number, number>>({});
  // Optional: start fanned out (used by the demo so every type is visible), then fold away.
  const [held, setHeld] = useState(holdOpenFor > 0);
  useEffect(() => {
    if (!held) return;
    const t = window.setTimeout(() => setHeld(false), holdOpenFor);
    return () => window.clearTimeout(t);
  }, [held, holdOpenFor]);
  const expanded = hovered || focused || held;

  const onHeight = useCallback((id: number, h: number) => {
    setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      setHovered(false);
      setFocused(false);
    }
  }, [items.length]);

  const GAP = 10;
  const offsets = items.map((_, i) => items.slice(0, i).reduce((sum, t) => sum + (heights[t.id] ?? 72) + GAP, 0));
  const frontHeight = items[0] ? heights[items[0].id] ?? 0 : 0;
  const stackHeight = expanded ? offsets[items.length - 1] + (heights[items[items.length - 1]?.id] ?? 0) : frontHeight + 28;

  return (
    <section
      aria-label="Notifications"
      onMouseEnter={() => {
        setHeld(false);
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && items[0]) dismiss(items[0].id);
      }}
      className={className}
    >
      <ol className="relative w-full" style={{ height: items.length ? stackHeight : 0 }}>
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <ToastCard
              key={item.id}
              item={item}
              index={i}
              offset={offsets[i]}
              frontHeight={frontHeight}
              expanded={expanded}
              paused={expanded}
              dark={dark}
              reduced={reduced}
              onHeight={onHeight}
            />
          ))}
        </AnimatePresence>
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Demo: buttons that fire each kind of toast                       */
/* ------------------------------------------------------------------ */

const wait = (ms: number, fail = false) =>
  new Promise<void>((resolve, reject) => window.setTimeout(fail ? reject : resolve, ms));

const demos: { label: string; code: string; dot: string; run: () => void }[] = [
  {
    label: "Success",
    code: 'toast.success("Invoice sent")',
    dot: "bg-emerald-500",
    run: () => toast.success("Invoice sent", { description: "Maple & Rye Bakery will get it in a minute." }),
  },
  {
    label: "Error",
    code: 'toast.error("Card declined")',
    dot: "bg-red-500",
    run: () =>
      toast.error("Card declined", {
        description: "The bank refused the charge. Try another card.",
        action: { label: "Retry", onClick: () => toast.promise(wait(1400), { loading: "Charging card", success: "Payment received", error: "Still declined" }) },
      }),
  },
  {
    label: "Info",
    code: 'toast.info("New version ready")',
    dot: "bg-sky-500",
    run: () => toast.info("New version ready", { description: "Reload when it suits you to get the latest changes." }),
  },
  {
    label: "Loading",
    code: "toast.promise(save(), {...})",
    dot: "bg-zinc-400",
    run: () => toast.promise(wait(1800), { loading: "Uploading 4 photos", success: "4 photos uploaded", error: "Upload failed" }),
  },
  {
    label: "With undo",
    code: 'toast("Moved to bin", { action })',
    dot: "bg-amber-500",
    run: () =>
      toast("Project moved to bin", {
        description: "Harbour Street refit",
        action: { label: "Undo", onClick: () => toast.success("Project restored") },
      }),
  },
];

export default function ReactToastNotificationSystem() {
  const [dark, setDark] = useState(false);
  const [lastCode, setLastCode] = useState(demos[3].code);

  // Start with a full stack so the preview shows the finished state, then hold it.
  useEffect(() => {
    toast.dismiss();
    toast.promise(wait(2600), { loading: "Uploading 4 photos", success: "4 photos uploaded", error: "Upload failed" });
    toast.error("Card declined", {
      description: "The bank refused the charge.",
      duration: 20000,
      action: { label: "Retry", onClick: () => toast.success("Payment received") },
    });
    toast.success("Invoice sent", { description: "Maple & Rye Bakery will get it in a minute.", duration: 20000 });
    toast("Project moved to bin", {
      description: "Harbour Street refit",
      duration: 20000,
      action: { label: "Undo", onClick: () => toast.success("Project restored") },
    });
    return () => toast.dismiss();
  }, []);

  const stage = dark ? "bg-zinc-950" : "bg-stone-100";
  const panel = dark ? "bg-zinc-900 ring-white/10" : "bg-white ring-zinc-900/[0.06]";
  const heading = dark ? "text-zinc-50" : "text-zinc-900";
  const body = dark ? "text-zinc-400" : "text-zinc-600";

  return (
    <div
      className={`relative min-h-[880px] w-full sm:min-h-[640px] lg:flex lg:items-center overflow-hidden px-4 py-10 transition-colors duration-300 sm:px-8 ${stage}`}
      style={{ fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, sans-serif' }}
    >
      <style>{`
        @keyframes rtn-shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }
      `}</style>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className={`w-full max-w-md rounded-3xl p-6 ring-1 ${panel}`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className={`text-lg font-semibold tracking-[-0.02em] ${heading}`}>Toasts</h2>
            <button
              type="button"
              role="switch"
              aria-checked={dark}
              onClick={() => setDark((d) => !d)}
              className={`flex h-10 items-center gap-2 rounded-full px-3 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                dark ? "bg-white/10 text-zinc-100" : "bg-zinc-100 text-zinc-700"
              }`}
            >
              <span className={`relative h-4 w-7 rounded-full transition-colors ${dark ? "bg-sky-500" : "bg-zinc-300"}`}>
                <span className={`absolute left-0 top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${dark ? "translate-x-3.5" : "translate-x-0.5"}`} />
              </span>
              Dark
            </button>
          </div>
          <p className={`mt-1 text-[14px] leading-6 ${body}`}>Fire one, hover the stack to fan it out, drag a toast sideways to throw it away.</p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {demos.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => {
                  d.run();
                  setLastCode(d.code);
                }}
                className={`flex h-11 items-center gap-2 rounded-xl px-3 text-[14px] font-medium ring-1 transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 motion-reduce:active:scale-100 ${
                  dark ? "bg-zinc-800 text-zinc-100 ring-white/10 hover:bg-zinc-700" : "bg-white text-zinc-800 ring-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${d.dot}`} aria-hidden="true" />
                {d.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => toast.dismiss()}
              className={`flex h-11 items-center justify-center rounded-xl px-3 text-[14px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                dark ? "text-zinc-300 hover:bg-white/5" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              Clear all
            </button>
          </div>

          <pre
            className={`mt-5 overflow-x-auto rounded-xl px-4 py-3 text-[13px] leading-6 ${
              dark ? "bg-black/40 text-zinc-300" : "bg-zinc-950 text-zinc-200"
            }`}
          >
            <code style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{lastCode}</code>
          </pre>
        </div>

        
      </div>

      <Toaster dark={dark} holdOpenFor={6000} className="absolute bottom-6 left-4 right-4 sm:left-auto sm:right-8 sm:w-[380px]" />
    </div>
  );
}
