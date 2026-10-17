import { createElement, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, SyntheticEvent } from "react";

/*
  HTML form examples.
  Every form is written once as a small tree of elements. Each element carries two class lists:
  Tailwind utilities and a plain semantic class (f-field, f-input...). The same tree renders the
  live preview, the plain HTML + CSS you copy and the Tailwind HTML you copy.
*/

type Attrs = Record<string, string>;
type El = { t: string; c?: string; s?: string; a?: Attrs; k: N[] };
type N = string | El;
type Kid = N | { $: Attrs } | null | false | undefined;

function h(t: string, c: string, s: string, ...kids: Kid[]): El {
  const el: El = { t, c: c || undefined, s: s || undefined, k: [] };
  for (const kid of kids) {
    if (kid === null || kid === false || kid === undefined) continue;
    if (typeof kid === "object" && "$" in kid) el.a = { ...(el.a ?? {}), ...kid.$ };
    else el.k.push(kid);
  }
  return el;
}
const $ = (a: Attrs) => ({ $: a });

/* ---------- themes: literal Tailwind fragments + the matching plain CSS values ---------- */
type Css = { bg: string; card: string; text: string; muted: string; border: string; input: string; accent: string; on: string; err: string; ok: string; r: string; r2: string; font: string };
type ThIn = {
  wrap: string; card: string; title: string; eyebrow: string; muted: string; label: string; input: string;
  acc: string; btn: string; btn2: string; err: string; stat: string; sw: string; file: string; css: Css;
};
type Th = ThIn & { help: string; check: string; range: string; color: string; btnBase: string };

const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const mk = (t: ThIn): Th => ({
  ...t,
  help: `text-[13px] leading-5 ${t.muted}`,
  check: `h-[18px] w-[18px] shrink-0 cursor-pointer ${t.acc}`,
  range: `h-2 w-full cursor-pointer ${t.acc}`,
  color: "h-11 w-20 cursor-pointer rounded-md border border-current/20 bg-transparent p-1",
  btnBase: "inline-flex min-h-[44px] items-center justify-center gap-2 px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
});

const T = {
  stone: mk({
    wrap: "bg-[#efebe4]", card: "rounded-2xl bg-white shadow-sm ring-1 ring-stone-200", title: "font-serif text-stone-900", eyebrow: "text-teal-800",
    muted: "text-stone-600", label: "text-stone-900",
    input: "rounded-lg border border-stone-300 bg-white text-stone-900 placeholder:text-stone-500 focus:border-teal-700 focus:ring-4 focus:ring-teal-700/15 aria-[invalid=true]:border-red-600",
    acc: "accent-teal-700", btn: "rounded-lg bg-teal-800 text-white hover:bg-teal-900 focus-visible:ring-teal-700", btn2: "rounded-lg border border-stone-300 text-stone-800 hover:bg-stone-100 focus-visible:ring-teal-700",
    err: "text-red-700", stat: "data-[state=ok]:text-teal-800 data-[state=error]:text-red-700", sw: "bg-stone-300 checked:bg-teal-700 focus-visible:ring-teal-700", file: "file:bg-teal-800 file:text-white",
    css: { bg: "#efebe4", card: "#ffffff", text: "#1c1917", muted: "#57534e", border: "#d6d3d1", input: "#ffffff", accent: "#115e59", on: "#ffffff", err: "#b91c1c", ok: "#115e59", r: "16px", r2: "8px", font: SERIF },
  }),
  tide: mk({
    wrap: "bg-[#0b1626]", card: "rounded-none border border-amber-300/30 bg-[#0f1f35]", title: "text-amber-50", eyebrow: "text-amber-300",
    muted: "text-slate-300", label: "text-amber-50",
    input: "rounded-none border border-slate-500 bg-[#0b1626] text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-4 focus:ring-amber-300/20 aria-[invalid=true]:border-rose-400",
    acc: "accent-amber-400", btn: "rounded-none bg-amber-300 text-[#0b1626] hover:bg-amber-200 focus-visible:ring-amber-300 focus-visible:ring-offset-[#0f1f35]", btn2: "rounded-none border border-slate-500 text-slate-100 hover:bg-white/5 focus-visible:ring-amber-300",
    err: "text-rose-300", stat: "data-[state=ok]:text-amber-200 data-[state=error]:text-rose-300", sw: "bg-slate-600 checked:bg-amber-400 focus-visible:ring-amber-300", file: "file:bg-amber-300 file:text-slate-900",
    css: { bg: "#0b1626", card: "#0f1f35", text: "#fffbeb", muted: "#cbd5e1", border: "#64748b", input: "#0b1626", accent: "#fcd34d", on: "#0b1626", err: "#fda4af", ok: "#fde68a", r: "0", r2: "0", font: SERIF },
  }),
  violet: mk({
    wrap: "bg-violet-50", card: "rounded-3xl bg-white shadow-[0_10px_40px_-20px_rgba(76,29,149,0.35)] ring-1 ring-violet-100", title: "text-slate-900", eyebrow: "text-violet-700",
    muted: "text-slate-600", label: "text-slate-800",
    input: "rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:border-violet-600 focus:bg-white focus:ring-4 focus:ring-violet-600/15 aria-[invalid=true]:border-rose-600",
    acc: "accent-violet-600", btn: "rounded-full bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-600", btn2: "rounded-full border border-slate-300 text-slate-800 hover:bg-slate-50 focus-visible:ring-violet-600",
    err: "text-rose-700", stat: "data-[state=ok]:text-violet-700 data-[state=error]:text-rose-700", sw: "bg-slate-300 checked:bg-violet-600 focus-visible:ring-violet-600", file: "file:bg-violet-600 file:text-white",
    css: { bg: "#f5f3ff", card: "#ffffff", text: "#0f172a", muted: "#475569", border: "#cbd5e1", input: "#f8fafc", accent: "#7c3aed", on: "#ffffff", err: "#be123c", ok: "#6d28d9", r: "24px", r2: "12px", font: SANS },
  }),
  quarry: mk({
    wrap: "bg-slate-950", card: "rounded-xl border border-slate-800 bg-slate-900", title: "text-white", eyebrow: "text-emerald-400",
    muted: "text-slate-400", label: "text-slate-100",
    input: "rounded-lg border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/15 aria-[invalid=true]:border-rose-400",
    acc: "accent-emerald-500", btn: "rounded-lg bg-emerald-400 text-slate-950 hover:bg-emerald-300 focus-visible:ring-emerald-400 focus-visible:ring-offset-slate-900", btn2: "rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 focus-visible:ring-emerald-400",
    err: "text-rose-300", stat: "data-[state=ok]:text-emerald-300 data-[state=error]:text-rose-300", sw: "bg-slate-700 checked:bg-emerald-500 focus-visible:ring-emerald-400", file: "file:bg-emerald-400 file:text-slate-950",
    css: { bg: "#020617", card: "#0f172a", text: "#f1f5f9", muted: "#94a3b8", border: "#334155", input: "#020617", accent: "#34d399", on: "#020617", err: "#fda4af", ok: "#6ee7b7", r: "12px", r2: "8px", font: SANS },
  }),
  roast: mk({
    wrap: "bg-[#f7efe3]", card: "rounded-2xl bg-[#fffaf2] ring-1 ring-amber-900/15", title: "text-[#3b2412]", eyebrow: "text-amber-800",
    muted: "text-[#6b4f36]", label: "text-[#3b2412]",
    input: "rounded-md border border-[#d9c3a5] bg-white text-[#3b2412] placeholder:text-[#8a6d52] focus:border-amber-700 focus:ring-4 focus:ring-amber-700/15 aria-[invalid=true]:border-red-700",
    acc: "accent-amber-700", btn: "rounded-md bg-[#3b2412] text-amber-50 hover:bg-[#2a190c] focus-visible:ring-amber-700", btn2: "rounded-md border border-[#d9c3a5] text-[#3b2412] hover:bg-amber-50 focus-visible:ring-amber-700",
    err: "text-red-700", stat: "data-[state=ok]:text-green-800 data-[state=error]:text-red-700", sw: "bg-[#d9c3a5] checked:bg-amber-700 focus-visible:ring-amber-700", file: "file:bg-[#3b2412] file:text-amber-50",
    css: { bg: "#f7efe3", card: "#fffaf2", text: "#3b2412", muted: "#6b4f36", border: "#d9c3a5", input: "#ffffff", accent: "#3b2412", on: "#fffbeb", err: "#b91c1c", ok: "#166534", r: "16px", r2: "6px", font: SANS },
  }),
  field: mk({
    wrap: "bg-emerald-950", card: "rounded-2xl bg-[#f4f7f1]", title: "text-emerald-950", eyebrow: "text-emerald-700",
    muted: "text-slate-600", label: "text-emerald-950",
    input: "rounded-lg border-2 border-emerald-900/15 bg-white text-slate-900 placeholder:text-slate-500 focus:border-emerald-600 focus:ring-0 aria-[invalid=true]:border-red-600",
    acc: "accent-emerald-700", btn: "rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-700", btn2: "rounded-lg border-2 border-emerald-900/15 text-emerald-950 hover:bg-white focus-visible:ring-emerald-700",
    err: "text-red-700", stat: "data-[state=ok]:text-emerald-800 data-[state=error]:text-red-700", sw: "bg-slate-300 checked:bg-emerald-700 focus-visible:ring-emerald-700", file: "file:bg-emerald-700 file:text-white",
    css: { bg: "#022c22", card: "#f4f7f1", text: "#022c22", muted: "#475569", border: "#cfd8d3", input: "#ffffff", accent: "#047857", on: "#ffffff", err: "#b91c1c", ok: "#065f46", r: "16px", r2: "8px", font: SANS },
  }),
  rose: mk({
    wrap: "bg-rose-50", card: "rounded-[28px] bg-white ring-1 ring-rose-200", title: "text-rose-950", eyebrow: "text-rose-700",
    muted: "text-slate-600", label: "text-slate-900",
    input: "rounded-2xl border border-rose-200 bg-white text-slate-900 placeholder:text-slate-500 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 aria-[invalid=true]:border-red-600",
    acc: "accent-rose-600", btn: "rounded-full bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600", btn2: "rounded-full border border-rose-200 text-rose-900 hover:bg-rose-50 focus-visible:ring-rose-600",
    err: "text-red-700", stat: "data-[state=ok]:text-rose-800 data-[state=error]:text-red-700", sw: "bg-rose-200 checked:bg-rose-600 focus-visible:ring-rose-600", file: "file:bg-rose-600 file:text-white",
    css: { bg: "#fff1f2", card: "#ffffff", text: "#0f172a", muted: "#475569", border: "#fecdd3", input: "#ffffff", accent: "#e11d48", on: "#ffffff", err: "#b91c1c", ok: "#9f1239", r: "28px", r2: "16px", font: SANS },
  }),
  beam: mk({
    wrap: "bg-[#0d0b1f]", card: "rounded-2xl border border-indigo-400/20 bg-[#151233]", title: "text-white", eyebrow: "text-indigo-300",
    muted: "text-indigo-200", label: "text-white",
    input: "rounded-lg border border-indigo-400/30 bg-[#0d0b1f] text-white placeholder:text-indigo-300/70 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-400/20 aria-[invalid=true]:border-rose-400",
    acc: "accent-indigo-400", btn: "rounded-lg bg-indigo-400 text-[#0d0b1f] hover:bg-indigo-300 focus-visible:ring-indigo-300 focus-visible:ring-offset-[#151233]", btn2: "rounded-lg border border-indigo-400/30 text-indigo-100 hover:bg-white/5 focus-visible:ring-indigo-300",
    err: "text-rose-300", stat: "data-[state=ok]:text-indigo-200 data-[state=error]:text-rose-300", sw: "bg-indigo-900 checked:bg-indigo-400 focus-visible:ring-indigo-300", file: "file:bg-indigo-400 file:text-[#0d0b1f]",
    css: { bg: "#0d0b1f", card: "#151233", text: "#ffffff", muted: "#c7d2fe", border: "#3f3a7a", input: "#0d0b1f", accent: "#818cf8", on: "#0d0b1f", err: "#fda4af", ok: "#c7d2fe", r: "16px", r2: "8px", font: SANS },
  }),
  sky: mk({
    wrap: "bg-sky-100", card: "rounded-xl bg-white shadow-sm ring-1 ring-sky-200", title: "text-slate-900", eyebrow: "text-sky-800",
    muted: "text-slate-600", label: "text-slate-800",
    input: "rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:border-sky-700 focus:ring-4 focus:ring-sky-600/15 aria-[invalid=true]:border-red-600",
    acc: "accent-sky-700", btn: "rounded-md bg-sky-700 text-white hover:bg-sky-800 focus-visible:ring-sky-700", btn2: "rounded-md border border-slate-300 text-slate-800 hover:bg-slate-50 focus-visible:ring-sky-700",
    err: "text-red-700", stat: "data-[state=ok]:text-sky-800 data-[state=error]:text-red-700", sw: "bg-slate-300 checked:bg-sky-700 focus-visible:ring-sky-700", file: "file:bg-sky-700 file:text-white",
    css: { bg: "#e0f2fe", card: "#ffffff", text: "#0f172a", muted: "#475569", border: "#cbd5e1", input: "#ffffff", accent: "#0369a1", on: "#ffffff", err: "#b91c1c", ok: "#075985", r: "12px", r2: "6px", font: SANS },
  }),
  plum: mk({
    wrap: "bg-[#2a0f24]", card: "rounded-[22px] border border-fuchsia-200/15 bg-[#3a1532]", title: "font-serif text-[#ffe9c7]", eyebrow: "text-orange-300",
    muted: "text-fuchsia-100/80", label: "text-[#ffe9c7]",
    input: "rounded-xl border border-fuchsia-200/25 bg-[#2a0f24] text-white placeholder:text-fuchsia-200/60 focus:border-orange-300 focus:ring-4 focus:ring-orange-300/20 aria-[invalid=true]:border-rose-400",
    acc: "accent-orange-400", btn: "rounded-xl bg-orange-300 text-[#2a0f24] hover:bg-orange-200 focus-visible:ring-orange-300 focus-visible:ring-offset-[#3a1532]", btn2: "rounded-xl border border-fuchsia-200/25 text-fuchsia-50 hover:bg-white/5 focus-visible:ring-orange-300",
    err: "text-rose-300", stat: "data-[state=ok]:text-orange-200 data-[state=error]:text-rose-300", sw: "bg-fuchsia-950 checked:bg-orange-400 focus-visible:ring-orange-300", file: "file:bg-orange-300 file:text-[#2a0f24]",
    css: { bg: "#2a0f24", card: "#3a1532", text: "#ffe9c7", muted: "#f5d0fe", border: "#6b3a60", input: "#2a0f24", accent: "#fdba74", on: "#2a0f24", err: "#fda4af", ok: "#fed7aa", r: "22px", r2: "12px", font: SERIF },
  }),
  harbour: mk({
    wrap: "bg-white", card: "rounded-lg border border-slate-200 bg-slate-50", title: "text-slate-900", eyebrow: "text-blue-700",
    muted: "text-slate-600", label: "text-slate-800",
    input: "rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 aria-[invalid=true]:border-red-600",
    acc: "accent-blue-600", btn: "rounded-md bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600", btn2: "rounded-md border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 focus-visible:ring-blue-600",
    err: "text-red-700", stat: "data-[state=ok]:text-blue-800 data-[state=error]:text-red-700", sw: "bg-slate-300 checked:bg-blue-600 focus-visible:ring-blue-600", file: "file:bg-blue-600 file:text-white",
    css: { bg: "#ffffff", card: "#f8fafc", text: "#0f172a", muted: "#475569", border: "#cbd5e1", input: "#ffffff", accent: "#2563eb", on: "#ffffff", err: "#b91c1c", ok: "#1e40af", r: "8px", r2: "6px", font: SANS },
  }),
  pine: mk({
    wrap: "bg-zinc-900", card: "rounded-2xl bg-zinc-800 ring-1 ring-white/10", title: "text-zinc-50", eyebrow: "text-teal-300",
    muted: "text-zinc-400", label: "text-zinc-100",
    input: "rounded-lg border border-zinc-600 bg-zinc-900 text-zinc-50 placeholder:text-zinc-500 focus:border-teal-300 focus:ring-4 focus:ring-teal-300/15 aria-[invalid=true]:border-rose-400",
    acc: "accent-teal-400", btn: "rounded-lg bg-teal-300 text-zinc-900 hover:bg-teal-200 focus-visible:ring-teal-300 focus-visible:ring-offset-zinc-800", btn2: "rounded-lg border border-zinc-600 text-zinc-100 hover:bg-zinc-700 focus-visible:ring-teal-300",
    err: "text-rose-300", stat: "data-[state=ok]:text-teal-300 data-[state=error]:text-rose-300", sw: "bg-zinc-600 checked:bg-teal-400 focus-visible:ring-teal-300", file: "file:bg-teal-300 file:text-zinc-900",
    css: { bg: "#18181b", card: "#27272a", text: "#fafafa", muted: "#a1a1aa", border: "#52525b", input: "#18181b", accent: "#5eead4", on: "#18181b", err: "#fda4af", ok: "#5eead4", r: "16px", r2: "8px", font: SANS },
  }),
  grid: mk({
    wrap: "bg-[#f3f4f6]", card: "rounded-md border-t-4 border-orange-500 bg-white shadow-sm", title: "text-slate-900", eyebrow: "text-orange-700",
    muted: "text-slate-600", label: "text-slate-900",
    input: "rounded border border-slate-300 bg-white font-mono text-slate-900 placeholder:text-slate-500 focus:border-orange-600 focus:ring-4 focus:ring-orange-500/15 aria-[invalid=true]:border-red-600",
    acc: "accent-orange-600", btn: "rounded bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-orange-500", btn2: "rounded border border-slate-300 text-slate-800 hover:bg-slate-50 focus-visible:ring-orange-500",
    err: "text-red-700", stat: "data-[state=ok]:text-green-800 data-[state=error]:text-red-700", sw: "bg-slate-300 checked:bg-orange-600 focus-visible:ring-orange-500", file: "file:bg-slate-900 file:text-white",
    css: { bg: "#f3f4f6", card: "#ffffff", text: "#0f172a", muted: "#475569", border: "#cbd5e1", input: "#ffffff", accent: "#0f172a", on: "#ffffff", err: "#b91c1c", ok: "#166534", r: "6px", r2: "4px", font: SANS },
  }),
  brick: mk({
    wrap: "bg-[#fbf7f4]", card: "rounded-none border-2 border-stone-900 bg-white shadow-[6px_6px_0_0_#1c1917]", title: "uppercase tracking-wide text-stone-900", eyebrow: "text-red-700",
    muted: "text-stone-600", label: "text-stone-900",
    input: "rounded-none border-2 border-stone-900 bg-white text-stone-900 placeholder:text-stone-500 focus:border-red-700 focus:ring-0 aria-[invalid=true]:border-red-700 aria-[invalid=true]:bg-red-50",
    acc: "accent-red-700", btn: "rounded-none border-2 border-stone-900 bg-red-700 text-white hover:bg-red-800 focus-visible:ring-stone-900", btn2: "rounded-none border-2 border-stone-900 text-stone-900 hover:bg-stone-100 focus-visible:ring-stone-900",
    err: "text-red-700", stat: "data-[state=ok]:text-green-800 data-[state=error]:text-red-700", sw: "bg-stone-300 checked:bg-red-700 focus-visible:ring-stone-900", file: "file:bg-stone-900 file:text-white",
    css: { bg: "#fbf7f4", card: "#ffffff", text: "#1c1917", muted: "#57534e", border: "#1c1917", input: "#ffffff", accent: "#b91c1c", on: "#ffffff", err: "#b91c1c", ok: "#166534", r: "0", r2: "0", font: SANS },
  }),
  lumen: mk({
    wrap: "bg-gradient-to-br from-cyan-950 to-slate-950", card: "rounded-3xl border border-cyan-300/15 bg-slate-900/80", title: "text-white", eyebrow: "text-cyan-300",
    muted: "text-slate-300", label: "text-cyan-50",
    input: "rounded-xl border border-slate-600 bg-slate-950 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/15 aria-[invalid=true]:border-rose-400",
    acc: "accent-cyan-400", btn: "rounded-xl bg-cyan-300 text-slate-950 hover:bg-cyan-200 focus-visible:ring-cyan-300 focus-visible:ring-offset-slate-900", btn2: "rounded-xl border border-slate-600 text-slate-100 hover:bg-white/5 focus-visible:ring-cyan-300",
    err: "text-rose-300", stat: "data-[state=ok]:text-cyan-200 data-[state=error]:text-rose-300", sw: "bg-slate-600 checked:bg-cyan-400 focus-visible:ring-cyan-300", file: "file:bg-cyan-300 file:text-slate-950",
    css: { bg: "#083344", card: "#0f172a", text: "#ecfeff", muted: "#cbd5e1", border: "#475569", input: "#020617", accent: "#67e8f9", on: "#020617", err: "#fda4af", ok: "#a5f3fc", r: "24px", r2: "12px", font: SANS },
  }),
};

/* ---------- builders ---------- */
const INPUT = "block min-h-[44px] w-full px-3 py-2 text-[15px] outline-none transition";
const FILE = "block w-full cursor-pointer text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:px-3 file:py-2 file:text-sm file:font-semibold";

type Opt = [string, string];
type FieldO = {
  id: string; label: string; type?: string; tag?: "input" | "select" | "textarea"; a?: Attrs;
  help?: string; err?: string; opts?: Opt[]; list?: string[]; span?: boolean;
};

function describe(id: string, help?: string): Attrs {
  return help ? { "aria-describedby": `${id}-help` } : {};
}
const helpP = (t: Th, id: string, text?: string) => (text ? h("p", t.help, "f-help", $({ id: `${id}-help` }), text) : null);
const errP = (t: Th, id: string, text?: string) => (text ? h("p", `text-[13px] font-medium ${t.err}`, "f-error", $({ id: `${id}-err`, hidden: "" }), text) : null);

function field(t: Th, o: FieldO): El {
  const tag = o.tag ?? "input";
  const type = o.type ?? "text";
  const base: Attrs = { id: o.id, name: o.a?.name ?? o.id, ...describe(o.id, o.help), ...(o.a ?? {}) };
  let control: El;
  let after: El | null = null;
  if (tag === "select") {
    control = h("select", `${INPUT} ${t.input}`, "f-input", $(base), h("option", "", "", $({ value: "" }), "Choose one"), ...(o.opts ?? []).map(([v, l]) => h("option", "", "", $({ value: v }), l)));
  } else if (tag === "textarea") {
    control = h("textarea", `${INPUT} min-h-[104px] ${t.input}`, "f-input", $({ rows: "4", ...base }));
  } else if (type === "file") {
    control = h("input", `${FILE} ${t.muted} ${t.file} rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current`, "f-file", $({ type, ...base }));
  } else if (type === "color") {
    control = h("input", t.color, "f-color", $({ type, ...base }));
  } else {
    const listA: Attrs = o.list ? { list: `${o.id}-list` } : {};
    control = h("input", `${INPUT} ${t.input}`, "f-input", $({ type, ...base, ...listA }));
    if (o.list) after = h("datalist", "", "", $({ id: `${o.id}-list` }), ...o.list.map((v) => h("option", "", "", $({ value: v }))));
  }
  return h("div", `flex flex-col gap-1.5 ${o.span ? "sm:col-span-2" : ""}`.trim(), o.span ? "f-field f-span" : "f-field",
    h("label", `text-sm font-medium ${t.label}`, "f-label", $({ for: o.id }), o.label),
    control, after, helpP(t, o.id, o.help), errP(t, o.id, o.err));
}

function group(t: Th, o: { name: string; legend: string; type: "radio" | "checkbox"; opts: Opt[]; req?: boolean; help?: string; err?: string; span?: boolean; row?: boolean; checked?: string }): El {
  return h("fieldset", `min-w-0 ${o.span ? "sm:col-span-2" : ""}`.trim(), o.span ? "f-fieldset f-span" : "f-fieldset",
    h("legend", `mb-2 text-sm font-medium ${t.label}`, "f-legend", o.legend),
    h("div", o.row ? "flex flex-wrap gap-x-5 gap-y-2" : "grid gap-2", o.row ? "f-options f-row" : "f-options",
      ...o.opts.map(([v, l]) => {
        const id = `${o.name}-${v}`;
        const a: Attrs = { type: o.type, id, name: o.name, value: v };
        if (o.req) a.required = "";
        if (o.checked === v) a.checked = "";
        if (o.help) a["aria-describedby"] = `${o.name}-help`;
        return h("div", "flex min-h-[32px] items-center gap-2.5", "f-check",
          h("input", t.check, "", $(a)),
          h("label", `cursor-pointer text-[15px] ${t.label}`, "", $({ for: id }), l));
      })),
    helpP(t, o.name, o.help), errP(t, o.name, o.err));
}

function single(t: Th, o: { id: string; label: string; a?: Attrs; err?: string; help?: string; sw?: boolean; span?: boolean }): El {
  const a: Attrs = { type: "checkbox", id: o.id, name: o.id, ...describe(o.id, o.help), ...(o.a ?? {}) };
  if (o.sw) a.role = "switch";
  const cls = o.sw
    ? `relative h-6 w-10 shrink-0 cursor-pointer appearance-none rounded-full transition before:absolute before:left-[3px] before:top-[3px] before:h-[18px] before:w-[18px] before:rounded-full before:bg-white before:transition before:content-[''] checked:before:translate-x-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${t.sw}`
    : t.check;
  return h("div", `${o.span ? "sm:col-span-2 " : ""}flex flex-col gap-1`, o.span ? "f-field f-span" : "f-field",
    h("div", o.sw ? "flex min-h-[40px] items-center justify-between gap-4" : "flex items-start gap-2.5", o.sw ? "f-check f-between" : "f-check",
      o.sw ? null : h("input", `${cls} mt-0.5`, "", $(a)),
      h("label", `cursor-pointer text-[15px] leading-6 ${t.label}`, "", $({ for: o.id }), o.label),
      o.sw ? h("input", cls, "f-switch", $(a)) : null),
    helpP(t, o.id, o.help), errP(t, o.id, o.err));
}

function range(t: Th, o: { id: string; label: string; min: string; max: string; step: string; value: string; unit: string; help?: string; span?: boolean }): El {
  return h("div", `flex flex-col gap-2 ${o.span ? "sm:col-span-2" : ""}`.trim(), o.span ? "f-field f-span" : "f-field",
    h("div", "flex items-baseline justify-between gap-3", "f-between",
      h("label", `text-sm font-medium ${t.label}`, "f-label", $({ for: o.id }), o.label),
      h("output", `text-sm font-bold tabular-nums ${t.label}`, "f-output", $({ for: o.id, id: `${o.id}-out`, "data-unit": o.unit }), `${o.value}${o.unit}`)),
    h("input", t.range, "f-range", $({ type: "range", id: o.id, name: o.id, min: o.min, max: o.max, step: o.step, value: o.value, ...describe(o.id, o.help) })),
    helpP(t, o.id, o.help));
}

const hidden = (name: string, value: string) => h("input", "", "", $({ type: "hidden", name, value }));

function actions(t: Th, list: [string, string][]): El {
  return h("div", "mt-6 flex flex-wrap items-center gap-3", "f-actions",
    ...list.map(([type, label], i) => h("button", `${t.btnBase} ${i === 0 ? t.btn : t.btn2}`, i === 0 ? "f-btn" : "f-btn f-btn2",
      $({ type, ...(type === "button" ? { "data-reveal": "", "aria-pressed": "false" } : {}) }), label)));
}

function form(t: Th, o: { id: string; biz: string; title: string; lead: string; kids: Kid[]; acts: El; enctype?: boolean; narrow?: boolean }): El {
  const fa: Attrs = { id: o.id, action: "#", method: "post", novalidate: "" };
  if (o.enctype) fa.enctype = "multipart/form-data";
  return h("div", `${t.wrap} px-4 py-8 sm:px-8 sm:py-10`, "f-wrap",
    h("form", `mx-auto ${o.narrow ? "max-w-md" : "max-w-xl"} ${t.card} p-6 sm:p-8`, o.narrow ? "f-card f-narrow" : "f-card", $(fa),
      h("p", `text-xs font-semibold uppercase tracking-[0.14em] ${t.eyebrow}`, "f-eyebrow", o.biz),
      h("h3", `mt-2 text-2xl font-semibold tracking-tight ${t.title}`, "f-title", o.title),
      h("p", `mt-1.5 text-sm leading-6 ${t.muted}`, "f-lead", o.lead),
      h("div", `mt-6 grid gap-4 ${o.narrow ? "" : "sm:grid-cols-2"}`.trim(), o.narrow ? "f-grid f-one" : "f-grid", ...o.kids),
      o.acts,
      h("p", `mt-4 text-sm font-medium empty:hidden ${t.stat}`, "f-status", $({ role: "status", "aria-live": "polite" }))));
}

/* ---------- the 15 forms ---------- */
const FAMILIES = { contact: "Contact", account: "Account", commerce: "Checkout", booking: "Booking", data: "Survey and data" } as const;
type Family = keyof typeof FAMILIES;
type Item = { f: Family; name: string; theme: Th; types: string[]; node: El };
const ITEMS: Item[] = [];
const add = (f: Family, name: string, theme: Th, types: string[], node: El) => ITEMS.push({ f, name, theme, types, node });

{
  const t = T.stone;
  add("contact", "Studio contact form", t, ["text", "email", "tel", "select", "textarea", "checkbox", "submit"], form(t, {
    id: "contact-form", biz: "Hollis & Wren Architects", title: "Start a conversation", lead: "Tell us about the site and what you have in mind. One of the partners replies within two working days.",
    kids: [
      field(t, { id: "cf-name", label: "Full name", a: { autocomplete: "name", required: "" }, err: "Please tell us your name." }),
      field(t, { id: "cf-email", label: "Email", type: "email", a: { autocomplete: "email", required: "" }, err: "Enter an email like name@example.com." }),
      field(t, { id: "cf-phone", label: "Phone (optional)", type: "tel", a: { autocomplete: "tel", pattern: "[0-9 +()-]{7,20}" }, help: "Digits, spaces and + only.", err: "That does not look like a phone number." }),
      field(t, { id: "cf-type", label: "Project type", tag: "select", a: { required: "" }, opts: [["extension", "Extension"], ["new-build", "New build"], ["renovation", "Renovation"], ["commercial", "Commercial fit-out"]], err: "Pick the closest project type." }),
      field(t, { id: "cf-msg", label: "About the project", tag: "textarea", span: true, a: { minlength: "20", maxlength: "1200", required: "" }, help: "Budget, timing and anything unusual about the plot. At least 20 characters.", err: "A few more words, please: at least 20 characters." }),
      single(t, { id: "cf-consent", label: "I agree to be contacted about this enquiry.", span: true, a: { required: "" }, err: "We need your agreement before we can reply." }),
    ],
    acts: actions(t, [["submit", "Send enquiry"]]),
  }));
}
{
  const t = T.tide;
  add("contact", "Newsletter signup", t, ["email", "radio", "hidden", "submit"], form(t, {
    id: "newsletter-form", narrow: true, biz: "The Low Tide Letter", title: "Coastal notes, by post and by email", lead: "Tide tables, walking routes and one long read about the shoreline. Unsubscribe from any issue.",
    kids: [
      hidden("source", "footer-signup"),
      field(t, { id: "nl-email", label: "Email address", type: "email", a: { autocomplete: "email", required: "", placeholder: "you@example.com" }, err: "Enter a valid email address." }),
      group(t, { name: "nl-freq", legend: "How often?", type: "radio", row: true, req: true, checked: "weekly", opts: [["weekly", "Weekly"], ["monthly", "Monthly digest"]] }),
    ],
    acts: actions(t, [["submit", "Subscribe"]]),
  }));
}
{
  const t = T.violet;
  add("account", "Create account", t, ["text", "email", "password", "url", "checkbox", "submit"], form(t, {
    id: "signup-form", biz: "Brightloom", title: "Create your studio account", lead: "Free for one project. Upgrade when your client signs off.",
    kids: [
      field(t, { id: "su-user", label: "Username", a: { autocomplete: "username", required: "", pattern: "[a-z0-9_]{3,20}", minlength: "3", maxlength: "20" }, help: "3 to 20 lowercase letters, numbers or underscores.", err: "Use 3 to 20 lowercase letters, numbers or underscores." }),
      field(t, { id: "su-email", label: "Work email", type: "email", a: { autocomplete: "email", required: "" }, err: "Enter a valid email address." }),
      field(t, { id: "su-pass", label: "Password", type: "password", span: true, a: { autocomplete: "new-password", required: "", minlength: "10" }, help: "At least 10 characters. A short sentence works well.", err: "Your password needs at least 10 characters." }),
      field(t, { id: "su-site", label: "Portfolio link (optional)", type: "url", span: true, a: { autocomplete: "url" }, help: "Include the https part at the start.", err: "Enter a full address that starts with https." }),
      single(t, { id: "su-terms", label: "I accept the terms of service and privacy policy.", span: true, a: { required: "" }, err: "Tick this box to create an account." }),
    ],
    acts: actions(t, [["submit", "Create account"]]),
  }));
}
{
  const t = T.quarry;
  add("account", "Sign in", t, ["email", "password", "checkbox", "button", "submit"], form(t, {
    id: "login-form", narrow: true, biz: "Quarry Ledger", title: "Sign in to your books", lead: "Use the email you registered with.",
    kids: [
      field(t, { id: "li-email", label: "Email", type: "email", a: { autocomplete: "email", required: "" }, err: "Enter the email you signed up with." }),
      field(t, { id: "li-pass", label: "Password", type: "password", a: { autocomplete: "current-password", required: "" }, err: "Enter your password." }),
      single(t, { id: "li-keep", label: "Keep me signed in on this device" }),
    ],
    acts: actions(t, [["submit", "Sign in"], ["button", "Show password"]]),
  }));
}
{
  const t = T.roast;
  add("commerce", "Card payment", t, ["text", "month", "number", "hidden", "submit"], form(t, {
    id: "payment-form", biz: "Saltmarsh Coffee Roasters", title: "Pay for your subscription", lead: "Two bags of whole bean coffee every month. You can pause or skip from your account.",
    kids: [
      hidden("order", "SCR-20418"),
      field(t, { id: "pay-name", label: "Name on card", span: true, a: { autocomplete: "cc-name", required: "" }, err: "Enter the name printed on the card." }),
      field(t, { id: "pay-card", label: "Card number", span: true, a: { autocomplete: "cc-number", inputmode: "numeric", pattern: "[0-9 ]{13,23}", required: "", placeholder: "1234 5678 9012 3456" }, help: "Typed as text, not number, so leading zeros and spaces survive.", err: "Card numbers are 13 to 19 digits." }),
      field(t, { id: "pay-exp", label: "Expiry", type: "month", a: { autocomplete: "cc-exp", min: "2026-10", required: "" }, err: "Choose an expiry month that has not passed." }),
      field(t, { id: "pay-cvc", label: "Security code", a: { autocomplete: "cc-csc", inputmode: "numeric", pattern: "[0-9]{3,4}", required: "" }, help: "3 or 4 digits on the back.", err: "Enter the 3 or 4 digit code." }),
      field(t, { id: "pay-bags", label: "Bags per month", type: "number", a: { min: "1", max: "6", step: "1", value: "2", required: "" }, help: "1 to 6 bags at $19 each.", err: "Choose between 1 and 6 bags." }),
    ],
    acts: actions(t, [["submit", "Pay $38.00"]]),
  }));
}
{
  const t = T.field;
  add("commerce", "Shipping address", t, ["text", "datalist", "tel", "checkbox", "submit"], form(t, {
    id: "shipping-form", biz: "Fieldnote Supply Co.", title: "Where should we send it?", lead: "Notebooks ship in two working days from our warehouse.",
    kids: [
      field(t, { id: "sh-name", label: "Recipient", span: true, a: { autocomplete: "shipping name", required: "" }, err: "Who should the parcel be addressed to?" }),
      field(t, { id: "sh-line1", label: "Street address", span: true, a: { autocomplete: "shipping address-line1", required: "" }, err: "Enter the street and house number." }),
      field(t, { id: "sh-city", label: "Town or city", a: { autocomplete: "shipping address-level2", required: "" }, err: "Enter a town or city." }),
      field(t, { id: "sh-post", label: "Postal code", a: { autocomplete: "shipping postal-code", required: "", pattern: "[A-Za-z0-9 -]{3,10}" }, err: "Check the postal code." }),
      field(t, { id: "sh-country", label: "Country", a: { autocomplete: "shipping country-name", required: "" }, list: ["Australia", "Canada", "Ireland", "New Zealand", "United Kingdom", "United States"], help: "Start typing to see suggestions.", err: "Enter the country." }),
      field(t, { id: "sh-tel", label: "Phone for the courier", type: "tel", a: { autocomplete: "tel", required: "" }, err: "The courier needs a phone number." }),
      single(t, { id: "sh-same", label: "Use this as my billing address too", span: true, a: { checked: "" } }),
    ],
    acts: actions(t, [["submit", "Continue to payment"]]),
  }));
}
{
  const t = T.rose;
  add("data", "Customer feedback survey", t, ["radio", "range", "output", "checkbox", "textarea", "submit"], form(t, {
    id: "survey-form", biz: "Kettle & Crumb Bakery", title: "How was your visit?", lead: "Three quick questions. Every answer goes straight to the bakers.",
    kids: [
      group(t, { name: "sv-rating", legend: "Overall, how did we do?", type: "radio", row: true, req: true, span: true, opts: [["1", "Poor"], ["2", "Fair"], ["3", "Good"], ["4", "Great"], ["5", "Loved it"]], err: "Pick one rating." }),
      range(t, { id: "sv-wait", label: "How long did you wait?", min: "0", max: "30", step: "1", value: "6", unit: " min", span: true, help: "Drag the slider; the number updates as you go." }),
      group(t, { name: "sv-bought", legend: "What did you buy?", type: "checkbox", span: true, row: true, opts: [["bread", "Bread"], ["pastry", "Pastry"], ["cake", "Cake"], ["coffee", "Coffee"]] }),
      field(t, { id: "sv-note", label: "Anything we should change?", tag: "textarea", span: true, a: { maxlength: "600" }, help: "Optional, up to 600 characters." }),
    ],
    acts: actions(t, [["submit", "Send feedback"]]),
  }));
}
{
  const t = T.beam;
  add("data", "Job application", t, ["text", "email", "url", "select", "number", "file", "textarea", "submit"], form(t, {
    id: "job-form", enctype: true, biz: "Northbeam Labs", title: "Apply: Frontend Engineer", lead: "Remote within two hours of UTC. We read every application in full.",
    kids: [
      field(t, { id: "job-name", label: "Full name", a: { autocomplete: "name", required: "" }, err: "Enter your name." }),
      field(t, { id: "job-email", label: "Email", type: "email", a: { autocomplete: "email", required: "" }, err: "Enter a valid email address." }),
      field(t, { id: "job-link", label: "Portfolio or code samples", type: "url", a: { required: "" }, err: "Add a full link that starts with https." }),
      field(t, { id: "job-years", label: "Years of experience", type: "number", a: { min: "0", max: "40", required: "" }, err: "Enter a number from 0 to 40." }),
      field(t, { id: "job-level", label: "Level", tag: "select", span: true, a: { required: "" }, opts: [["mid", "Mid-level"], ["senior", "Senior"], ["staff", "Staff"]], err: "Choose the level you are applying for." }),
      field(t, { id: "job-cv", label: "CV", type: "file", span: true, a: { accept: ".pdf,.doc,.docx", required: "" }, help: "PDF or Word document.", err: "Attach your CV as a PDF or Word file." }),
      field(t, { id: "job-why", label: "Why this role?", tag: "textarea", span: true, a: { minlength: "50", required: "" }, help: "A short paragraph is plenty: at least 50 characters.", err: "Write at least 50 characters." }),
    ],
    acts: actions(t, [["submit", "Submit application"]]),
  }));
}
{
  const t = T.sky;
  add("booking", "Appointment booking", t, ["date", "time", "select", "radio", "tel", "submit"], form(t, {
    id: "booking-form", biz: "Cedar Row Physio", title: "Book an appointment", lead: "Clinic hours are 8:00 to 18:00, Monday to Saturday.",
    kids: [
      field(t, { id: "bk-date", label: "Date", type: "date", a: { min: "2026-10-14", max: "2026-12-23", required: "" }, help: "Bookings open up to 10 weeks ahead.", err: "Choose a date between 14 Oct and 23 Dec." }),
      field(t, { id: "bk-time", label: "Time", type: "time", a: { min: "08:00", max: "17:15", step: "900", required: "" }, help: "Quarter-hour slots.", err: "Pick a time between 08:00 and 17:15." }),
      field(t, { id: "bk-who", label: "Physiotherapist", tag: "select", a: { required: "" }, opts: [["any", "First available"], ["ines", "Ines Moreau"], ["dev", "Dev Rathore"], ["kate", "Kate Okafor"]], err: "Choose who you would like to see." }),
      field(t, { id: "bk-tel", label: "Mobile for reminders", type: "tel", a: { autocomplete: "tel", required: "" }, err: "Add a number for your text reminder." }),
      group(t, { name: "bk-kind", legend: "Appointment", type: "radio", span: true, req: true, checked: "new", opts: [["new", "New patient assessment, 45 min"], ["follow", "Follow-up, 30 min"]] }),
    ],
    acts: actions(t, [["submit", "Request booking"]]),
  }));
}
{
  const t = T.plum;
  add("booking", "Supper club RSVP", t, ["text", "email", "radio", "number", "datetime-local", "select", "submit"], form(t, {
    id: "rsvp-form", biz: "Marigold Hall", title: "Harvest supper, RSVP", lead: "Seven courses at one long table. Doors open at seven on Saturday 15 November.",
    kids: [
      field(t, { id: "rs-name", label: "Your name", a: { autocomplete: "name", required: "" }, err: "Tell us who is coming." }),
      field(t, { id: "rs-email", label: "Email", type: "email", a: { autocomplete: "email", required: "" }, err: "Enter an email for your ticket." }),
      group(t, { name: "rs-coming", legend: "Will you join us?", type: "radio", row: true, req: true, span: true, opts: [["yes", "Joyfully, yes"], ["no", "Sadly, no"]], err: "Let us know either way." }),
      field(t, { id: "rs-guests", label: "Extra guests", type: "number", a: { min: "0", max: "3", value: "0" }, help: "Up to 3.", err: "You can bring up to 3 guests." }),
      field(t, { id: "rs-arrive", label: "Arriving around", type: "datetime-local", a: { min: "2026-11-15T18:30", max: "2026-11-15T21:00", value: "2026-11-15T19:00" }, err: "Pick a time on the night, 18:30 to 21:00." }),
      field(t, { id: "rs-diet", label: "Dietary needs", tag: "select", span: true, opts: [["none", "None"], ["veg", "Vegetarian"], ["vegan", "Vegan"], ["gf", "Gluten free"], ["other", "Something else, we will email"]] }),
    ],
    acts: actions(t, [["submit", "Send RSVP"]]),
  }));
}
{
  const t = T.harbour;
  add("data", "Property search filters", t, ["search", "datalist", "number", "checkbox", "reset", "submit"], form(t, {
    id: "search-form", biz: "Harbour Lettings", title: "Find a place to rent", lead: "214 homes across the waterfront districts.",
    kids: [
      field(t, { id: "ps-q", label: "Search", type: "search", span: true, a: { placeholder: "Street, school or postcode", name: "q" } }),
      field(t, { id: "ps-area", label: "Neighbourhood", span: true, list: ["Old Harbour", "Chandlers Quay", "Ropewalk", "North Basin", "Lighthouse Hill"] }),
      field(t, { id: "ps-min", label: "Min rent per month", type: "number", a: { min: "500", max: "6000", step: "50", placeholder: "500" }, err: "Between 500 and 6,000." }),
      field(t, { id: "ps-max", label: "Max rent per month", type: "number", a: { min: "500", max: "6000", step: "50", placeholder: "2500" }, err: "Between 500 and 6,000." }),
      group(t, { name: "ps-feat", legend: "Must have", type: "checkbox", row: true, span: true, opts: [["pets", "Pets allowed"], ["parking", "Parking"], ["garden", "Garden"], ["furnished", "Furnished"]] }),
    ],
    acts: actions(t, [["submit", "Show homes"], ["reset", "Clear filters"]]),
  }));
}
{
  const t = T.pine;
  add("account", "Settings and preferences", t, ["color", "checkbox switch", "range", "output", "radio", "select", "reset", "submit"], form(t, {
    id: "settings-form", biz: "Pinecone Notes", title: "Workspace preferences", lead: "Changes apply to every device signed in to this workspace.",
    kids: [
      field(t, { id: "st-accent", label: "Accent colour", type: "color", a: { value: "#2dd4bf" }, help: "Used for links and highlights." }),
      field(t, { id: "st-lang", label: "Language", tag: "select", opts: [["en", "English"], ["es", "Espanol"], ["fr", "Francais"], ["de", "Deutsch"]] }),
      range(t, { id: "st-size", label: "Editor text size", min: "12", max: "22", step: "1", value: "16", unit: "px", span: true }),
      group(t, { name: "st-theme", legend: "Theme", type: "radio", row: true, span: true, checked: "system", opts: [["light", "Light"], ["dark", "Dark"], ["system", "Match system"]] }),
      single(t, { id: "st-digest", label: "Weekly digest email", sw: true, span: true, a: { checked: "" } }),
      single(t, { id: "st-sound", label: "Sound when a note syncs", sw: true, span: true }),
    ],
    acts: actions(t, [["submit", "Save preferences"], ["reset", "Reset"]]),
  }));
}
{
  const t = T.grid;
  add("contact", "Support ticket", t, ["email", "text", "select", "url", "file", "textarea", "submit"], form(t, {
    id: "ticket-form", enctype: true, biz: "Gridline Hosting", title: "Open a support ticket", lead: "Urgent tickets are answered around the clock. Everything else within one business day.",
    kids: [
      field(t, { id: "tk-email", label: "Account email", type: "email", a: { autocomplete: "email", required: "" }, err: "Enter the email on your account." }),
      field(t, { id: "tk-prio", label: "Priority", tag: "select", a: { required: "" }, opts: [["low", "Low: a question"], ["normal", "Normal: something is off"], ["urgent", "Urgent: site is down"]], err: "Choose a priority." }),
      field(t, { id: "tk-subject", label: "Subject", span: true, a: { required: "", maxlength: "90" }, err: "Add a short subject." }),
      field(t, { id: "tk-url", label: "Affected address", type: "url", span: true, a: {}, help: "The page where you saw the problem.", err: "Paste the full address, including the https part." }),
      field(t, { id: "tk-body", label: "What happened?", tag: "textarea", span: true, a: { required: "", minlength: "30" }, help: "What you expected, what you saw, and when it started.", err: "Please add a little more detail: at least 30 characters." }),
      field(t, { id: "tk-shots", label: "Screenshots", type: "file", span: true, a: { accept: "image/*", multiple: "" }, help: "Optional. PNG or JPG, several allowed." }),
    ],
    acts: actions(t, [["submit", "Open ticket"]]),
  }));
}
{
  const t = T.brick;
  add("commerce", "Quote request", t, ["text", "tel", "select", "week", "number", "radio", "hidden", "textarea", "submit"], form(t, {
    id: "quote-form", biz: "Brickfield Roofing", title: "Get a roofing quote", lead: "Free survey within 20 miles. Written quote within three days of the visit.",
    kids: [
      hidden("form-name", "quote"),
      field(t, { id: "qt-name", label: "Name", a: { autocomplete: "name", required: "" }, err: "Enter your name." }),
      field(t, { id: "qt-tel", label: "Phone", type: "tel", a: { autocomplete: "tel", required: "" }, err: "Enter a phone number." }),
      field(t, { id: "qt-job", label: "Type of job", tag: "select", a: { required: "" }, opts: [["repair", "Repair or leak"], ["reroof", "Full re-roof"], ["flat", "Flat roof"], ["gutters", "Gutters and fascias"]], err: "Choose a job type." }),
      field(t, { id: "qt-week", label: "Preferred start week", type: "week", a: { min: "2026-W43" }, help: "Pick any week from late October.", err: "Choose a week from W43 onwards." }),
      field(t, { id: "qt-area", label: "Roof area (sq m, rough)", type: "number", a: { min: "5", max: "1000", step: "5" }, err: "Between 5 and 1,000 square metres." }),
      group(t, { name: "qt-storeys", legend: "Storeys", type: "radio", row: true, checked: "2", opts: [["1", "1"], ["2", "2"], ["3", "3+"]] }),
      field(t, { id: "qt-notes", label: "Anything else?", tag: "textarea", span: true }),
    ],
    acts: actions(t, [["submit", "Request my quote"]]),
  }));
}
{
  const t = T.lumen;
  add("account", "Password reset", t, ["email", "text", "password", "submit"], form(t, {
    id: "reset-form", narrow: true, biz: "Lumen Savings", title: "Choose a new password", lead: "We sent a 6 digit code to your email. It expires in 15 minutes.",
    kids: [
      field(t, { id: "rp-email", label: "Email", type: "email", a: { autocomplete: "email", required: "" }, err: "Enter your email." }),
      field(t, { id: "rp-code", label: "6 digit code", a: { autocomplete: "one-time-code", inputmode: "numeric", pattern: "[0-9]{6}", maxlength: "6", required: "" }, err: "The code is exactly 6 digits." }),
      field(t, { id: "rp-new", label: "New password", type: "password", a: { autocomplete: "new-password", minlength: "12", required: "" }, help: "At least 12 characters.", err: "Use at least 12 characters." }),
    ],
    acts: actions(t, [["submit", "Update password"]]),
  }));
}

/* ---------- serialisers ---------- */
const VOID = new Set(["input", "br", "hr", "img"]);
const JSX_ATTR: Record<string, string> = {
  for: "htmlFor", autocomplete: "autoComplete", minlength: "minLength", maxlength: "maxLength", inputmode: "inputMode",
  novalidate: "noValidate", enctype: "encType", tabindex: "tabIndex", readonly: "readOnly",
};
const BOOL = new Set(["required", "novalidate", "multiple", "checked", "hidden"]);
const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function toReact(n: N, key: string | number): ReactNode {
  if (typeof n === "string") return n;
  const props: Record<string, unknown> = { key };
  if (n.c) props.className = n.c;
  for (const [k, v] of Object.entries(n.a ?? {})) {
    if (k === "checked") props.defaultChecked = true;
    else if (k === "value" && (n.t === "input" && n.a?.type !== "hidden" && n.a?.type !== "button" && n.a?.type !== "reset")) props.defaultValue = v;
    else props[JSX_ATTR[k] ?? k] = BOOL.has(k) ? true : v;
  }
  return createElement(n.t, props, ...(VOID.has(n.t) || n.t === "textarea" ? [] : n.k.map((k, i) => toReact(k, i))));
}

function serial(n: N, mode: "css" | "tw", depth: number): string {
  const pad = "  ".repeat(depth);
  if (typeof n === "string") return pad + escHtml(n);
  const attrs: string[] = [];
  const cls = mode === "tw" ? n.c : n.s;
  if (cls) attrs.push(`class="${cls}"`);
  for (const [k, v] of Object.entries(n.a ?? {})) attrs.push(BOOL.has(k) ? k : `${k}="${v}"`);
  const open = `<${n.t}${attrs.length ? " " + attrs.join(" ") : ""}`;
  if (VOID.has(n.t)) return `${pad}${open}>`;
  if (n.k.every((k) => typeof k === "string")) return `${pad}${open}>${n.k.map((k) => serial(k, mode, 0)).join("")}</${n.t}>`;
  return `${pad}${open}>\n${n.k.map((k) => serial(k, mode, depth + 1)).join("\n")}\n${pad}</${n.t}>`;
}

function cssFor(th: Th): string {
  const c = th.css;
  return `<style>
  .f-wrap { background: ${c.bg}; color: ${c.text}; padding: 40px 16px; font-family: ${c.font}; }
  .f-card { max-width: 576px; margin: 0 auto; padding: 28px; background: ${c.card}; border: 1px solid ${c.border}; border-radius: ${c.r}; }
  .f-narrow { max-width: 448px; }
  .f-eyebrow { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: ${c.accent}; }
  .f-title { margin: 8px 0 0; font-size: 24px; line-height: 1.2; }
  .f-lead, .f-help { margin: 6px 0 0; color: ${c.muted}; font-size: 14px; line-height: 1.5; }
  .f-help { margin: 0; font-size: 13px; }
  .f-grid { display: grid; gap: 16px; margin-top: 24px; }
  @media (min-width: 640px) { .f-grid:not(.f-one) { grid-template-columns: 1fr 1fr; } .f-span { grid-column: 1 / -1; } }
  .f-field, .f-fieldset { display: flex; flex-direction: column; gap: 6px; min-width: 0; margin: 0; padding: 0; border: 0; }
  .f-label, .f-legend { font-size: 14px; font-weight: 600; padding: 0; }
  .f-input { min-height: 44px; padding: 8px 12px; font: inherit; font-size: 15px; color: inherit; background: ${c.input}; border: 1px solid ${c.border}; border-radius: ${c.r2}; }
  .f-input:focus, .f-color:focus, .f-file:focus-visible, .f-check input:focus-visible { outline: 3px solid ${c.accent}; outline-offset: 1px; }
  .f-input[aria-invalid="true"] { border-color: ${c.err}; }
  .f-error { margin: 0; font-size: 13px; font-weight: 600; color: ${c.err}; }
  .f-options { display: grid; gap: 8px; }
  .f-row { display: flex; flex-wrap: wrap; gap: 8px 20px; }
  .f-check { display: flex; align-items: center; gap: 10px; min-height: 32px; }
  .f-check input[type="checkbox"]:not(.f-switch), .f-check input[type="radio"] { width: 18px; height: 18px; accent-color: ${c.accent}; }
  .f-between { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .f-range { width: 100%; accent-color: ${c.accent}; }
  .f-output { font-weight: 700; font-variant-numeric: tabular-nums; }
  .f-color { width: 80px; height: 44px; padding: 4px; background: transparent; border: 1px solid ${c.border}; border-radius: 6px; }
  .f-switch { appearance: none; position: relative; flex-shrink: 0; width: 40px; height: 24px; margin: 0; border-radius: 999px; background: ${c.border}; cursor: pointer; }
  .f-switch::before { content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .2s; }
  .f-switch:checked { background: ${c.accent}; }
  .f-switch:checked::before { transform: translateX(16px); }
  .f-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
  .f-btn { min-height: 44px; padding: 0 20px; font: inherit; font-size: 14px; font-weight: 600; color: ${c.on}; background: ${c.accent}; border: 1px solid ${c.accent}; border-radius: ${c.r2}; cursor: pointer; }
  .f-btn2 { color: inherit; background: transparent; border-color: ${c.border}; }
  .f-status { margin: 16px 0 0; font-size: 14px; font-weight: 600; }
  .f-status:empty { display: none; }
  .f-status[data-state="ok"] { color: ${c.ok}; }
  .f-status[data-state="error"] { color: ${c.err}; }
  [hidden] { display: none !important; }
</style>`;
}

const SCRIPT = `<script>
  // Demo behaviour: checks every field with the browser's own rules, shows the
  // matching error text and a status line. Nothing is sent while action="#".
  document.querySelectorAll("form[novalidate]").forEach(function (form) {
    var status = form.querySelector("[role=status]");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var firstBad = null;
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.willValidate) return;
        var key = el.type === "radio" || (el.type === "checkbox" && !el.id) ? el.name : el.id;
        var err = document.getElementById(key + "-err");
        var bad = !el.checkValidity();
        if (bad) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
        if (err) {
          err.hidden = !bad;
          var ids = (el.getAttribute("aria-describedby") || "").split(" ").filter(function (id) { return id && id !== err.id; });
          if (bad) ids.push(err.id);
          if (ids.length) el.setAttribute("aria-describedby", ids.join(" ")); else el.removeAttribute("aria-describedby");
        }
        if (bad && !firstBad) firstBad = el;
      });
      if (firstBad) {
        status.dataset.state = "error";
        status.textContent = "Please fix the highlighted fields.";
        firstBad.focus();
        return;
      }
      status.dataset.state = "ok";
      status.textContent = "Thanks, that all checks out.";
      if (form.getAttribute("action") !== "#") form.submit();
    });
    form.addEventListener("reset", function () {
      form.querySelectorAll("[aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });
      form.querySelectorAll(".f-error, [id$='-err']").forEach(function (el) { el.hidden = true; });
      status.textContent = "";
      setTimeout(function () { form.querySelectorAll("output").forEach(sync); });
    });
    form.addEventListener("input", function (event) {
      if (event.target.type === "range") form.querySelectorAll("output").forEach(sync);
    });
    form.querySelectorAll("[data-reveal]").forEach(function (button) {
      button.addEventListener("click", function () {
        var pw = form.querySelector("input[autocomplete=current-password]");
        var show = pw.type === "password";
        pw.type = show ? "text" : "password";
        button.setAttribute("aria-pressed", String(show));
        button.textContent = show ? "Hide password" : "Show password";
      });
    });
  });
  function sync(out) {
    var input = document.getElementById(out.htmlFor.value);
    if (input) out.value = input.value + (out.dataset.unit || "");
  }
</script>`;

const pascal = (s: string) => s.replace(/(^|[^a-zA-Z0-9]+)([a-zA-Z0-9])/g, (_, __, c: string) => c.toUpperCase());
const cssCode = (it: Item) => `<!-- ${it.name}: plain HTML + CSS, no framework -->\n${cssFor(it.theme)}\n\n${serial(it.node, "css", 0)}\n\n${SCRIPT}\n`;
const twCode = (it: Item) => `<!-- ${it.name}: needs Tailwind CSS v3.2+ or v4 on the page -->\n${serial(it.node, "tw", 0)}\n\n${SCRIPT}\n`;

/* ---------- live behaviour inside the preview (same logic as SCRIPT) ---------- */
function syncOutputs(form: HTMLFormElement) {
  form.querySelectorAll("output").forEach((out) => {
    const input = form.querySelector<HTMLInputElement>(`#${out.htmlFor.value}`);
    if (input) out.value = input.value + (out.dataset.unit ?? "");
  });
}

function validate(form: HTMLFormElement) {
  const status = form.querySelector<HTMLElement>("[role=status]");
  let firstBad: HTMLElement | null = null;
  for (const node of Array.from(form.elements)) {
    const el = node as HTMLInputElement;
    if (!el.willValidate) continue;
    const key = el.type === "radio" ? el.name : el.id;
    const err = form.querySelector<HTMLElement>(`#${key}-err`);
    const bad = !el.checkValidity();
    if (bad) el.setAttribute("aria-invalid", "true");
    else el.removeAttribute("aria-invalid");
    if (err) {
      err.hidden = !bad;
      const ids = (el.getAttribute("aria-describedby") ?? "").split(" ").filter((id) => id && id !== err.id);
      if (bad) ids.push(err.id);
      if (ids.length) el.setAttribute("aria-describedby", ids.join(" "));
      else el.removeAttribute("aria-describedby");
    }
    if (bad && !firstBad) firstBad = el;
  }
  if (!status) return;
  if (firstBad) {
    status.dataset.state = "error";
    status.textContent = "Please fix the highlighted fields.";
    firstBad.focus();
  } else {
    status.dataset.state = "ok";
    status.textContent = "Thanks, that all checks out. This demo sends nothing.";
  }
}

function LiveForm({ node }: { node: El }) {
  const tree = useMemo(() => toReact(node, 0), [node]);
  const onSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    validate(e.target as HTMLFormElement);
  };
  const onReset = (e: SyntheticEvent) => {
    const form = e.target as HTMLFormElement;
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    form.querySelectorAll<HTMLElement>(".f-error, [id$='-err']").forEach((el) => { el.hidden = true; });
    const status = form.querySelector<HTMLElement>("[role=status]");
    if (status) status.textContent = "";
    setTimeout(() => syncOutputs(form), 0);
  };
  const onInput = (e: SyntheticEvent) => {
    const el = e.target as HTMLInputElement;
    if (el.type === "range" && el.form) syncOutputs(el.form);
  };
  const onClick = (e: SyntheticEvent) => {
    const b = e.target as HTMLButtonElement;
    if (!b.hasAttribute?.("data-reveal") || !b.form) return;
    const pw = b.form.querySelector<HTMLInputElement>("input[autocomplete=current-password]");
    if (!pw) return;
    const show = pw.type === "password";
    pw.type = show ? "text" : "password";
    b.setAttribute("aria-pressed", String(show));
    b.textContent = show ? "Hide password" : "Show password";
  };
  return <div onSubmitCapture={onSubmit} onResetCapture={onReset} onInputCapture={onInput} onClickCapture={onClick}>{tree}</div>;
}

/* ---------- reference data ---------- */
const REF: [string, string, string, string][] = [
  ["text", "Names, subjects, codes", "minlength, maxlength, pattern", "Plain box. Add inputmode=\"numeric\" for digit codes."],
  ["email", "One or more email addresses", "multiple, pattern", "Checks for a name@domain shape; phones show an @ key."],
  ["password", "Secrets", "minlength, autocomplete", "Characters are masked; use new-password or current-password so managers fill it."],
  ["tel", "Phone numbers", "pattern, autocomplete=\"tel\"", "No format check of its own; phones open a dial pad."],
  ["url", "Web addresses", "pattern, placeholder", "Only valid with a scheme, such as https at the start."],
  ["number", "Quantities and counts", "min, max, step", "Spin buttons. Not for card numbers, postcodes or phone numbers."],
  ["search", "Search boxes", "name=\"q\", placeholder", "Behaves like text; some browsers add a clear button."],
  ["date", "A calendar day", "min, max", "Picker varies by browser; value is always YYYY-MM-DD."],
  ["time", "A time of day", "min, max, step (seconds)", "step=\"900\" gives 15 minute slots; value is HH:MM."],
  ["datetime-local", "Date and time, no time zone", "min, max, step", "Value looks like 2026-11-15T19:00."],
  ["month", "A year and month", "min, max", "Value YYYY-MM. Firefox and desktop Safari show a plain text box."],
  ["week", "A numbered week", "min, max", "Value like 2026-W43. Same support gaps as month."],
  ["color", "A colour", "value (hex)", "Opens the system colour picker; value is #rrggbb, default #000000."],
  ["range", "An approximate value", "min, max, step, value", "Slider that is always valid; pair it with output to show the number."],
  ["file", "Uploads", "accept, multiple", "Form needs method=\"post\" and enctype=\"multipart/form-data\"."],
  ["checkbox", "Yes or no, or many of a list", "name, value, checked, required", "Unticked boxes send nothing; a ticked box with no value sends \"on\"."],
  ["radio", "One choice from a few", "same name, value, required", "required on the group means one must be picked."],
  ["hidden", "Data the user does not edit", "name, value", "Invisible but visible in the page source; never trust it on the server."],
  ["submit", "Sends the form", "formaction, formnovalidate", "A button element with type=\"submit\" does the same and can hold icons."],
  ["reset", "Restores defaults", "value", "Easy to press by accident; keep it secondary."],
  ["button", "Runs your script", "value", "Does nothing on its own; used here for Show password."],
  ["textarea", "Longer text", "rows, minlength, maxlength", "Its own element, not an input type."],
  ["select", "One option from a list", "required, multiple", "A first option with value=\"\" makes required work."],
  ["datalist", "Suggestions for a text input", "id, matched by list", "Suggests but does not restrict what can be typed."],
  ["output", "A calculated result", "for, name", "Announced politely to screen readers when it changes."],
  ["fieldset + legend", "Groups related controls", "disabled", "The legend is read before each radio or checkbox inside."],
];

/* ---------- page ---------- */
const FAMILY_KEYS = Object.keys(FAMILIES) as Family[];
type Lang = "css" | "tw";

export default function HtmlFormExamplesCollection() {
  const [family, setFamily] = useState<Family | "all">("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [lang, setLang] = useState<Lang>("css");
  const [copied, setCopied] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const q = query.trim().toLowerCase();
  const visible = ITEMS.map((it, i) => ({ it, i })).filter(({ it }) => (family === "all" || it.f === family) && (!q || `${it.name} ${FAMILIES[it.f]} ${it.types.join(" ")}`.toLowerCase().includes(q)));

  async function copy(i: number, l: Lang) {
    const it = ITEMS[i];
    let ok = false;
    try {
      await navigator.clipboard.writeText(l === "css" ? cssCode(it) : twCode(it));
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) { setOpen(i); setLang(l); }
    setCopied(ok ? `${i}-${l}` : null);
    setAnnounce(ok ? `${it.name} ${l === "css" ? "HTML and CSS" : "Tailwind HTML"} copied` : "Copy was blocked, the code is shown below so you can select it");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  }

  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-1";
  const chip = `inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors ${ring}`;
  const tool = `inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${ring}`;
  const LABEL: Record<Lang, string> = { css: "HTML + CSS", tw: "Tailwind" };

  return (
    <section className="bg-[#f5f5f2] px-4 py-12 text-[#16181d] sm:px-8 sm:py-14" style={{ fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">HTML · CSS · Tailwind</p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">{ITEMS.length} HTML form examples, every input type</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone-600">
              Each form is live: fill it in and press the button to see the browser's own validation at work. Copy it as plain HTML with a small CSS block, or as Tailwind HTML.
            </p>
          </div>
          <dl className="flex gap-8 font-mono text-[12px] text-stone-600">
            <div><dt className="uppercase tracking-[0.14em]">Forms</dt><dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#16181d]">{ITEMS.length}</dd></div>
            <div><dt className="uppercase tracking-[0.14em]">Input types</dt><dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#16181d]">21</dd></div>
          </dl>
        </header>

        <div className="mt-8 flex flex-col gap-3 border-y border-stone-300/70 py-4 lg:flex-row lg:items-center">
          <label htmlFor="hfe-search" className="sr-only">Search forms or input types</label>
          <div className="relative lg:w-64 lg:shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500">
              <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />
            </svg>
            <input id="hfe-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try date, file or login"
              className="h-10 w-full rounded-full border border-stone-300 bg-white pl-9 pr-4 text-[14px] text-stone-900 placeholder:text-stone-500 focus:border-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700" />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by kind of form">
            {(["all", ...FAMILY_KEYS] as const).map((f) => {
              const on = family === f;
              const n = f === "all" ? ITEMS.length : ITEMS.filter((it) => it.f === f).length;
              return (
                <button key={f} type="button" aria-pressed={on} onClick={() => setFamily(f)} className={`${chip} ${on ? "bg-[#16181d] text-white" : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"}`}>
                  {f === "all" ? "All" : FAMILIES[f]}
                  <span className={`font-mono text-[11px] ${on ? "text-stone-300" : "text-stone-500"}`}>{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">{announce}</p>

        <div className="relative mt-6 h-[1180px] overflow-y-auto overscroll-contain rounded-2xl pr-1" tabIndex={0} aria-label="Form examples and input type reference">
          {visible.length === 0 && (
            <div className="grid h-48 place-items-center rounded-2xl border border-dashed border-stone-300 px-4 text-center text-[14px] text-stone-600">No form matches "{query}". Try email, range or checkout.</div>
          )}
          <ul className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            {visible.map(({ it, i }) => {
              const isOpen = open === i;
              return (
                <li key={i} className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(22,24,29,0.04)] ${isOpen ? "lg:col-span-2" : ""}`}>
                  <LiveForm node={it.node} />
                  <div className="border-t border-stone-200 px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-stone-500">{String(i + 1).padStart(2, "0")}</span>
                      <span className="min-w-0 flex-1 basis-36 truncate text-[13px] font-medium text-stone-800">{it.name}</span>
                      <button type="button" aria-expanded={isOpen} aria-controls={`hfe-code-${i}`} onClick={() => setOpen(isOpen ? null : i)} className={`${tool} text-stone-700 hover:bg-stone-100`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5" /></svg>
                        Code
                      </button>
                      {(["css", "tw"] as const).map((l) => {
                        const done = copied === `${i}-${l}`;
                        return (
                          <button key={l} type="button" onClick={() => copy(i, l)} aria-label={`Copy ${LABEL[l]} for ${it.name}`} className={`${tool} ${done ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-900 hover:bg-stone-200"}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5"><path d={done ? "M5 12.5l4.5 4.5L19 7" : "M9 9h11v11H9zM5 15H4V4h11v1"} /></svg>
                            {done ? "Copied" : LABEL[l]}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1.5 font-mono text-[11px] leading-5 text-stone-600">{it.types.join(" · ")}</p>
                  </div>
                  {isOpen && (
                    <div id={`hfe-code-${i}`} className="border-t border-stone-800 bg-[#111318]">
                      <div className="flex gap-1 border-b border-white/10 px-3 pt-2" role="group" aria-label="Code format">
                        {(["css", "tw"] as const).map((l) => (
                          <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={`rounded-t-md px-3 py-2 text-[12px] font-semibold ${ring} ${lang === l ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>
                            {LABEL[l]}
                          </button>
                        ))}
                      </div>
                      <pre tabIndex={0} className="max-h-96 overflow-auto p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200">
                        <code>{lang === "css" ? cssCode(it) : twCode(it)}</code>
                      </pre>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
              <h3 className="text-lg font-semibold tracking-tight">Input type reference</h3>
              <p className="mt-1 text-[14px] text-stone-600">Every type used above, what it is for and what the browser adds.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                  <caption className="sr-only">HTML input types and related form elements</caption>
                  <thead>
                    <tr className="border-b border-stone-300 text-stone-600">
                      <th scope="col" className="py-2 pr-4 font-semibold">Type</th>
                      <th scope="col" className="py-2 pr-4 font-semibold">For</th>
                      <th scope="col" className="py-2 pr-4 font-semibold">Key attributes</th>
                      <th scope="col" className="py-2 font-semibold">Browser note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REF.map(([ty, use, attr, note]) => (
                      <tr key={ty} className="border-b border-stone-100 align-top">
                        <th scope="row" className="whitespace-nowrap py-2 pr-4 font-mono font-semibold text-stone-900">{ty}</th>
                        <td className="py-2 pr-4 text-stone-700">{use}</td>
                        <td className="py-2 pr-4 font-mono text-[12px] text-stone-700">{attr}</td>
                        <td className="py-2 text-stone-700">{note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <aside className="h-fit rounded-2xl bg-[#16181d] p-6 text-stone-200">
              <h3 className="text-lg font-semibold tracking-tight text-white">Send it without a backend</h3>
              <p className="mt-3 text-[14px] leading-6">
                Every form here uses <code className="rounded bg-white/10 px-1 font-mono text-[12.5px] text-white">action="#"</code> and <code className="rounded bg-white/10 px-1 font-mono text-[12.5px] text-white">method="post"</code>. To receive real submissions, set <code className="rounded bg-white/10 px-1 font-mono text-[12.5px] text-white">action</code> to the address a form-handling service gives you.
              </p>
              <p className="mt-3 text-[14px] leading-6">
                Keep a <code className="rounded bg-white/10 px-1 font-mono text-[12.5px] text-white">name</code> on every field, since only named fields are sent. Forms with a file input also need <code className="rounded bg-white/10 px-1 font-mono text-[12.5px] text-white">enctype="multipart/form-data"</code>.
              </p>
              <p className="mt-3 text-[14px] leading-6">
                The script only calls submit once every field passes, so the browser's checks still run first. Always validate again on the receiving side.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
