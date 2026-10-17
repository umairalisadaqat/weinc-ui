import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

// One shared base, then one string per variant and per size.
// The same strings work as plain HTML on a button element.
const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold tracking-[-0.01em] " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
  "disabled:pointer-events-none disabled:opacity-45 aria-busy:cursor-progress motion-reduce:transition-none motion-reduce:active:translate-y-0 motion-reduce:active:scale-100";

const variants = {
  primary:
    "bg-blue-600 text-white shadow-[0_1px_0_0_rgba(255,255,255,0.22)_inset,0_1px_2px_rgba(15,23,42,0.25)] hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-600",
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-500",
  outline:
    "border border-slate-300 bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-slate-500",
  ghost:
    "text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:ring-slate-500",
  destructive:
    "bg-red-600 text-white shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_1px_2px_rgba(127,29,29,0.3)] hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-600",
  dark:
    "bg-slate-900 text-white hover:bg-slate-800 active:bg-black focus-visible:ring-slate-900",
} as const;

const sizes = {
  sm: "min-h-[36px] px-3 text-[13px]",
  md: "min-h-[42px] px-4 text-sm",
  lg: "min-h-[50px] px-6 text-base",
  icon: "h-[42px] w-[42px] p-0 [&_svg]:h-[18px] [&_svg]:w-[18px]",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;
const btn = (variant: Variant = "primary", size: Size = "md") => `${base} ${variants[variant]} ${sizes[size]}`;

const icon = "h-4 w-4 shrink-0";
const Plus = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={icon}><path d="M10 4.5v11M4.5 10h11" /></svg>
);
const Arrow = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`${icon} transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none`}><path d="M4 10h11M11 5.5 15.5 10 11 14.5" /></svg>
);
const Download = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={icon}><path d="M10 3.5v9M6 8.5l4 4 4-4M4 16h12" /></svg>
);
const Trash = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={icon}><path d="M4 6h12M8 6V4.5h4V6M6 6l.7 9.5h6.6L14 6" /></svg>
);
const Pencil = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={icon}><path d="M12.5 4.5l3 3L7 16H4v-3l8.5-8.5Z" /></svg>
);
const Dots = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={icon}><circle cx="4.5" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="15.5" cy="10" r="1.5" /></svg>
);
const Spinner = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`${icon} animate-spin motion-reduce:animate-none`}>
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.2" />
    <path d="M17 10a7 7 0 0 0-7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

// Frozen copies of each interaction state, so the page shows them without a mouse.
const forced: { variant: Variant; label: string; note: string; cls: string }[] = [
  { variant: "primary", label: "Publish", note: "Rest", cls: "" },
  { variant: "primary", label: "Publish", note: "Hover", cls: "!bg-blue-700" },
  { variant: "primary", label: "Publish", note: "Pressed", cls: "!bg-blue-800 translate-y-px scale-[0.98]" },
  { variant: "primary", label: "Publish", note: "Keyboard focus", cls: "ring-2 ring-blue-600 ring-offset-2" },
  { variant: "ghost", label: "Archive", note: "Ghost hover", cls: "!bg-slate-100 !text-slate-900" },
];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 border-t border-slate-200 py-5 first:border-t-0 sm:grid-cols-[156px_1fr] sm:items-center sm:gap-6">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-600">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

// A real loading button: click it and it holds a busy state, then confirms.
function SaveButton() {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const run = () => {
    if (state !== "idle") return;
    setState("loading");
    timer.current = window.setTimeout(() => {
      setState("done");
      timer.current = window.setTimeout(() => setState("idle"), 1600);
    }, 1800);
  };
  return (
    <button type="button" onClick={run} aria-busy={state === "loading"} className={`${btn("primary")} min-w-[148px]`}>
      {state === "loading" ? <Spinner /> : null}
      <span>{state === "loading" ? "Saving" : state === "done" ? "Saved" : "Save changes"}</span>
      <span className="sr-only" aria-live="polite">{state === "done" ? "Changes saved" : ""}</span>
    </button>
  );
}

export default function HtmlCssButtonSet() {
  return (
    <div className="min-h-[640px] bg-slate-50 px-4 py-10 sm:px-10 sm:py-14" style={{ fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[52rem] rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] sm:px-8">
        <Row label="Variants">
          <button type="button" className={btn("primary")}>Primary</button>
          <button type="button" className={btn("secondary")}>Secondary</button>
          <button type="button" className={btn("outline")}>Outline</button>
          <button type="button" className={btn("ghost")}>Ghost</button>
          <button type="button" className={btn("destructive")}>Delete</button>
        </Row>
        <Row label="Sizes">
          <button type="button" className={btn("dark", "sm")}>Small</button>
          <button type="button" className={btn("dark", "md")}>Medium</button>
          <button type="button" className={btn("dark", "lg")}>Large</button>
        </Row>
        <Row label="With icons">
          <button type="button" className={btn("primary")}><Plus />New project</button>
          <button type="button" className={`group ${btn("outline")}`}>Continue<Arrow /></button>
          <button type="button" className={btn("secondary")}><Download />Export</button>
          <span className="flex items-center gap-1.5">
            <button type="button" aria-label="Edit" className={btn("outline", "icon")}><Pencil /></button>
            <button type="button" aria-label="More actions" className={btn("ghost", "icon")}><Dots /></button>
            <button type="button" aria-label="Delete file" className={btn("destructive", "icon")}><Trash /></button>
          </span>
        </Row>
        <Row label="Hover, press, focus">
          {forced.map((f) => (
            <span key={f.note} className="flex flex-col items-center gap-1.5">
              <span aria-hidden="true" className={`${btn(f.variant)} pointer-events-none ${f.cls}`}>{f.label}</span>
              <span className="text-[11px] font-medium text-slate-600">{f.note}</span>
            </span>
          ))}
        </Row>
        <Row label="Loading and disabled">
          <SaveButton />
          <button type="button" aria-busy="true" aria-disabled="true" className={`${btn("outline")} pointer-events-none text-slate-600`}><Spinner />Uploading</button>
          <button type="button" disabled className={btn("primary")}>Disabled</button>
          <button type="button" disabled className={btn("outline")}>Disabled</button>
        </Row>
      </div>
      <p className="mx-auto mt-5 max-w-[52rem] text-center text-[13px] text-slate-600">Tab through to see focus rings. Press any button to feel it give.</p>
    </div>
  );
}
