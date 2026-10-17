import { createElement, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

/*
  CSS gradient border collection.
  Every piece is written once as a small element tree. CSS pieces also carry a block of CSS written with
  "&" for the piece's own selector and "K-" as the prefix for keyframes, custom properties and SVG ids.
  The page scopes each one to its own class (gb-i0, gb-i1 ...) and Copy rewrites the same rules to a plain
  ".gradient-card" class, so what you copy is exactly what you see. Tailwind pieces copy their own classes.
*/

type Attrs = Record<string, string>;
type El = { t: string; c?: string; a?: Attrs; k: N[] };
type N = string | El;
type Kid = N | { $: Attrs } | null | false | undefined;

function h(t: string, c: string, ...kids: Kid[]): El {
  const el: El = { t, c: c || undefined, k: [] };
  for (const kid of kids) {
    if (kid === null || kid === false || kid === undefined) continue;
    if (typeof kid === "object" && "$" in kid) el.a = { ...(el.a ?? {}), ...kid.$ };
    else el.k.push(kid);
  }
  return el;
}
const $ = (a: Attrs) => ({ $: a });

const FAMILIES = {
  square: "Square corners",
  rounded: "Rounded corners",
  clear: "Transparent inside",
  glow: "Glow and motion",
  focus: "On focus",
  tailwind: "Tailwind only",
} as const;
type FamilyKey = keyof typeof FAMILIES;

type Item = {
  f: FamilyKey;
  name: string;
  /** One line on how the technique works, shown on the tile. */
  how: string;
  node: El;
  /** Scoped CSS. Absent for Tailwind pieces, whose classes live on the tree. */
  css?: string;
  /** Tailwind classes for the preview stage behind the piece (not copied). */
  stage?: string;
};

/* ---------- shared base for the CSS pieces (copied with each one) ---------- */
const BASE = `& {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 290px;
  padding: 20px;
  border-radius: 16px;
  color: #d9dde5;
  background-color: #16181d;
  font: 400 14px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}
& *, &::before, &::after { box-sizing: border-box; }
& h3 { margin: 0; color: #fff; font-size: 16px; font-weight: 600; letter-spacing: -.01em; }
& p { margin: 6px 0 0; color: #a7adb9; }
& .eyebrow { margin: 0 0 8px; color: #c9ced8; font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
@media (prefers-reduced-motion: reduce) {
  &, &::before, &::after, & * { animation: none !important; transition: none !important; }
}`;

const CHECK = "M5 12.5l4.5 4.5L19 7";
const tick = (cls: string) =>
  h("svg", cls, $({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" }), h("path", "", $({ d: CHECK })));

/* ---------- the collection ---------- */
const ITEMS: Item[] = [
  {
    f: "square",
    name: "border-image",
    how: "One line, any gradient, but border-image ignores border-radius, so corners stay square.",
    node: h("article", "",
      h("p", "eyebrow", "Release 2.4"),
      h("h3", "", "Exports finish in the background"),
      h("p", "", "Large reports now build while you keep working. We email a link when the file is ready."),
      h("a", "more", $({ href: "#" }), "Read the changelog"),
    ),
    css: `& { border: 2px solid; border-image: linear-gradient(135deg, #f59e0b, #ef4444 50%, #8b5cf6) 1; border-radius: 0; }
& .more { display: inline-flex; align-items: center; min-height: 40px; margin-top: 6px; color: #fbbf24; font-weight: 600; text-decoration: none; }
& .more:hover { text-decoration: underline; }
& .more:focus-visible { outline: 2px solid #fbbf24; outline-offset: 2px; }`,
  },
  {
    f: "square",
    name: "One side with border-image",
    how: "Give only the top a border width and border-image paints just that edge.",
    node: h("aside", "", $({ role: "note" }),
      h("p", "eyebrow", "Scheduled maintenance"),
      h("h3", "", "Sunday, 02:00 to 03:00 UTC"),
      h("p", "", "Dashboards stay readable. Imports and webhooks queue up and run when we are back."),
    ),
    css: `& { border-style: solid; border-width: 3px 0 0; border-image: linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6) 1; border-radius: 0 0 14px 14px; background-color: #14161b; }`,
  },
  {
    f: "rounded",
    name: "padding-box and border-box",
    how: "Two backgrounds: a solid fill clipped to the padding box over a gradient that reaches the border box.",
    node: h("article", "",
      h("p", "eyebrow", "Studio plan"),
      h("p", "price", h("strong", "", "$24"), " per seat, monthly"),
      h("ul", "",
        h("li", "", tick("tick"), "Unlimited projects"),
        h("li", "", tick("tick"), "Version history for 90 days"),
        h("li", "", tick("tick"), "Priority email support"),
      ),
      h("a", "cta", $({ href: "#" }), "Start the trial"),
    ),
    css: `& { border: 2px solid transparent; border-radius: 18px; background: linear-gradient(#16181d, #16181d) padding-box, linear-gradient(135deg, #22d3ee, #6366f1 55%, #d946ef) border-box; }
& .price { margin: 0; color: #a7adb9; }
& .price strong { color: #fff; font-size: 30px; font-weight: 650; letter-spacing: -.02em; margin-right: 4px; }
& ul { display: grid; gap: 6px; margin: 14px 0 16px; padding: 0; list-style: none; }
& li { display: flex; align-items: center; gap: 8px; }
& .tick { width: 16px; height: 16px; flex: none; color: #67e8f9; }
& .cta { display: flex; align-items: center; justify-content: center; min-height: 42px; border-radius: 10px; background: #e0e7ff; color: #1e1b4b; font-weight: 600; text-decoration: none; }
& .cta:hover { background: #fff; }
& .cta:focus-visible { outline: 2px solid #a5b4fc; outline-offset: 3px; }`,
  },
  {
    f: "rounded",
    name: "Gradient wrapper with padding",
    how: "An outer element is the gradient, its padding is the border width, and an inner element holds the fill.",
    node: h("figure", "",
      h("div", "inner",
        h("blockquote", "", "We moved the whole booking flow over in an afternoon, and support tickets about payments stopped."),
        h("figcaption", "",
          h("span", "avatar", $({ "aria-hidden": "true" }), "MO"),
          h("span", "", h("strong", "", "Maren Osei"), h("span", "role", "Operations, Tidewater Rentals")),
        ),
      ),
    ),
    css: `& { margin: 0; padding: 1.5px; border-radius: 18px; background: linear-gradient(160deg, #fcd34d, #fb7185 45%, #6366f1); }
& .inner { padding: 20px; border-radius: 16.5px; background: #16181d; }
& blockquote { margin: 0; color: #e5e7eb; font-size: 15px; line-height: 1.55; }
& figcaption { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
& .avatar { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: #3f2a3a; color: #fecdd3; font-size: 12px; font-weight: 700; }
& strong { display: block; color: #fff; font-size: 13px; }
& .role { display: block; color: #a7adb9; font-size: 12px; }`,
  },
  {
    f: "clear",
    name: "Mask on a pseudo-element",
    how: "A masked ::before keeps only the padding ring, so the middle stays see-through over photos and gradients.",
    stage: "bg-[radial-gradient(120%_90%_at_20%_10%,#3b2a5c_0%,#1c2038_45%,#0d1b2a_100%)]",
    node: h("button", "", $({ type: "button" }),
      h("span", "", "Book a walkthrough"),
      h("svg", "arrow", $({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" }), h("path", "", $({ d: "M5 12h14M13 6l6 6-6 6" }))),
    ),
    css: `& { display: inline-flex; align-items: center; gap: 8px; width: auto; min-height: 46px; padding: 0 22px; border: 0; border-radius: 999px; background: transparent; color: #fff; font-weight: 600; cursor: pointer; }
&::before { content: ""; position: absolute; inset: 0; padding: 1.5px; border-radius: inherit; background: linear-gradient(90deg, #fde68a, #f472b6, #a78bfa); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); pointer-events: none; }
& .arrow { width: 18px; height: 18px; transition: transform .2s ease; }
&:hover .arrow { transform: translateX(3px); }
&:focus-visible { outline: 2px solid #fde68a; outline-offset: 4px; }`,
  },
  {
    f: "clear",
    name: "SVG stroke with dashes",
    how: "An SVG rect draws the edge, so you get rounded corners, dashes and a gradient stroke together.",
    node: h("div", "",
      h("svg", "edge", $({ "aria-hidden": "true" }),
        h("defs", "", h("linearGradient", "", $({ id: "K-grad", x1: "0", y1: "0", x2: "1", y2: "1" }),
          h("stop", "", $({ offset: "0", "stop-color": "#34d399" })),
          h("stop", "", $({ offset: "1", "stop-color": "#38bdf8" })),
        )),
        h("rect", "", $({ width: "100%", height: "100%", rx: "15", fill: "none", stroke: "url(#K-grad)", "stroke-width": "2", "stroke-dasharray": "7 6" })),
      ),
      h("h3", "", "Drop invoices here"),
      h("p", "", "PDF or CSV, up to 10 MB each. We read the totals and dates for you."),
      h("button", "pick", $({ type: "button" }), "Browse files"),
    ),
    css: `& { background: transparent; text-align: center; padding: 26px 20px; }
& .edge { position: absolute; inset: 1px; width: calc(100% - 2px); height: calc(100% - 2px); overflow: visible; pointer-events: none; }
& .edge rect { animation: K-march 1.6s linear infinite; }
@keyframes K-march { to { stroke-dashoffset: -26; } }
& .pick { min-height: 40px; margin-top: 14px; padding: 0 16px; border: 0; border-radius: 10px; background: #ecfdf5; color: #064e3b; font: inherit; font-weight: 600; cursor: pointer; }
& .pick:focus-visible { outline: 2px solid #6ee7b7; outline-offset: 3px; }`,
  },
  {
    f: "glow",
    name: "Edge with a soft glow",
    how: "Two pseudo-elements share one gradient: one sharp for the edge, one blurred for the glow.",
    node: h("article", "",
      h("div", "body",
        h("p", "eyebrow", "Active teams"),
        h("p", "stat", "1,284"),
        h("p", "", "Up 86 on last month, mostly from the referral link."),
      ),
    ),
    css: `& { isolation: isolate; padding: 0; background: none; }
&::before, &::after { content: ""; position: absolute; inset: -1.5px; z-index: -1; border-radius: 17.5px; background: linear-gradient(140deg, #34d399, #0ea5e9 60%, #6366f1); }
&::after { inset: 4px; filter: blur(18px); opacity: .55; z-index: -2; }
& .body { position: relative; padding: 20px; border-radius: inherit; background: #16181d; }
& .stat { margin: 0; color: #fff; font-size: 34px; font-weight: 650; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }`,
  },
  {
    f: "glow",
    name: "Rotating conic border",
    how: "@property makes the conic start angle animatable, so the colours turn around the edge.",
    node: h("article", "",
      h("p", "eyebrow", "Now syncing"),
      h("h3", "", "Shared calendar, 3 of 5 sources"),
      h("div", "bar", $({ role: "progressbar", "aria-label": "Sync progress", "aria-valuenow": "60", "aria-valuemin": "0", "aria-valuemax": "100" }), h("span", "")),
      h("p", "", "Room bookings and holidays are in. Rotas arrive next."),
    ),
    css: `@property --K-a { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
& { border: 2px solid transparent; background: linear-gradient(#16181d, #16181d) padding-box, conic-gradient(from var(--K-a), #6366f1, #22d3ee, #a3e635, #6366f1) border-box; animation: K-turn 5s linear infinite; }
@keyframes K-turn { to { --K-a: 360deg; } }
& .bar { height: 6px; margin-top: 14px; border-radius: 999px; background: #262a33; overflow: hidden; }
& .bar span { display: block; width: 60%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #6366f1, #22d3ee); }`,
  },
  {
    f: "glow",
    name: "Light that runs the edge",
    how: "A mostly transparent conic gradient leaves one bright arc; a blurred copy behind it adds the glow.",
    node: h("article", "",
      h("div", "body",
        h("p", "eyebrow", "Deploy preview"),
        h("h3", "", "checkout-redesign"),
        h("p", "", "Built in 48 seconds. Two pages changed, no new warnings."),
        h("a", "open", $({ href: "#" }), "Open preview"),
      ),
    ),
    css: `@property --K-a { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
& { isolation: isolate; padding: 0; background: none; }
&::before, &::after { content: ""; position: absolute; inset: -1.5px; z-index: -1; border-radius: 17.5px; background: conic-gradient(from var(--K-a), #2a2e37 0 62%, #f97316 80%, #fde047 90%, #2a2e37 100%); animation: K-turn 3.2s linear infinite; }
&::after { z-index: -2; filter: blur(16px); opacity: .6; }
@keyframes K-turn { to { --K-a: 360deg; } }
& .body { position: relative; padding: 20px; border-radius: inherit; background: #16181d; }
& .open { display: inline-flex; align-items: center; min-height: 40px; margin-top: 8px; color: #fdba74; font-weight: 600; text-decoration: none; }
& .open:hover { text-decoration: underline; }
& .open:focus-visible { outline: 2px solid #fdba74; outline-offset: 2px; }`,
  },
  {
    f: "focus",
    name: "Gradient edge on focus",
    how: ":focus-within swaps a plain border for the padding-box and border-box gradient while the field is in use.",
    node: h("form", "", $({ action: "#" }),
      h("label", "", $({ for: "K-email" }), "Invite a teammate"),
      h("div", "field",
        h("input", "", $({ id: "K-email", type: "email", name: "email", placeholder: "name@company.com", autocomplete: "email" })),
        h("button", "", $({ type: "submit" }), "Invite"),
      ),
      h("p", "", "They get view access until you change it."),
    ),
    css: `& label { display: block; margin-bottom: 8px; color: #fff; font-weight: 600; }
& .field { display: flex; gap: 6px; padding: 4px; border: 1.5px solid #343944; border-radius: 12px; background: #101216; transition: border-color .2s ease; }
& .field:focus-within { border-color: transparent; background: linear-gradient(#101216, #101216) padding-box, linear-gradient(90deg, #f43f5e, #f59e0b) border-box; }
& input { flex: 1; min-width: 0; min-height: 40px; padding: 0 10px; border: 0; background: transparent; color: #fff; font: inherit; outline: none; }
& input::placeholder { color: #8b919e; }
& button { min-height: 40px; padding: 0 14px; border: 0; border-radius: 9px; background: #fde68a; color: #422006; font: inherit; font-weight: 600; cursor: pointer; }
& button:focus-visible { outline: 2px solid #fde68a; outline-offset: 2px; }`,
  },
  {
    f: "tailwind",
    name: "Tailwind padding-box utility",
    how: "An arbitrary background property carries both layers; border-transparent leaves room for the gradient.",
    node: h("article", "w-full max-w-[290px] rounded-2xl border-2 border-transparent p-5 text-[14px] text-slate-300 [background:linear-gradient(#16181d,#16181d)_padding-box,linear-gradient(120deg,#f43f5e,#f59e0b)_border-box]",
      h("div", "flex items-center gap-3",
        h("span", "grid h-11 w-11 place-items-center rounded-full bg-rose-950 text-[13px] font-bold text-rose-200", $({ "aria-hidden": "true" }), "IV"),
        h("div", "",
          h("h3", "text-[16px] font-semibold text-white", "Ines Varga"),
          h("p", "text-[13px] text-slate-400", "Lead designer, Northfield"),
        ),
      ),
      h("p", "mt-4 leading-relaxed", "Reviews pull requests on Tuesdays and Thursdays. Ping in the design channel for anything urgent."),
    ),
  },
  {
    f: "tailwind",
    name: "Tailwind wrapper with p-px",
    how: "A gradient parent with one pixel of padding and an inner panel one pixel less rounded.",
    node: h("div", "w-full max-w-[290px] rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-sky-600 p-px",
      h("div", "rounded-[15px] bg-[#16181d] p-5 text-[14px] text-slate-300",
        h("span", "inline-flex rounded-full bg-emerald-950 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300", "Most chosen"),
        h("h3", "mt-3 text-[16px] font-semibold text-white", "Team workspace"),
        h("p", "mt-1 text-slate-400", "Ten editors, shared brand kit and approvals before anything goes live."),
        h("a", "mt-4 flex min-h-[42px] items-center justify-center rounded-xl bg-emerald-300 font-semibold text-emerald-950 hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#16181d]", $({ href: "#" }), "Choose Team"),
      ),
    ),
  },
];

const ALL: Item[] = (Object.keys(FAMILIES) as FamilyKey[]).flatMap((f) => ITEMS.filter((it) => it.f === f));

/* ---------- rendering ---------- */
const VOID = new Set(["input", "br", "img", "stop", "rect", "path", "circle"]);
const JSX_ATTR: Record<string, string> = { for: "htmlFor", autocomplete: "autoComplete", tabindex: "tabIndex", viewbox: "viewBox" };
const reactKey = (k: string) => (k.startsWith("aria-") || k.startsWith("data-") ? k : JSX_ATTR[k] ?? k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));
const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const scope = (css: string, sel: string, kf: string) => css.replace(/&/g, sel).replace(/\bK-/g, `${kf}-`);
const subK = (s: string, kf: string) => s.replace(/\bK-/g, `${kf}-`);

function toReact(n: N, key: string | number, kf: string, rootCls?: string): ReactNode {
  if (typeof n === "string") return n;
  const props: Record<string, unknown> = { key };
  const cls = rootCls ?? n.c;
  if (cls) props.className = cls;
  for (const [k, v] of Object.entries(n.a ?? {})) props[reactKey(k)] = subK(v, kf);
  return createElement(n.t, props, ...(VOID.has(n.t) ? [] : n.k.map((k, i) => toReact(k, i, kf))));
}

function serial(n: N, depth: number, kf: string, rootCls?: string): string {
  const pad = "  ".repeat(depth);
  if (typeof n === "string") return pad + escHtml(n);
  const attrs: string[] = [];
  const cls = rootCls ?? n.c;
  if (cls) attrs.push(`class="${cls}"`);
  for (const [k, v] of Object.entries(n.a ?? {})) attrs.push(`${k}="${subK(v, kf)}"`);
  const open = `<${n.t}${attrs.length ? " " + attrs.join(" ") : ""}`;
  if (VOID.has(n.t) && !n.k.length) return n.t === "input" || n.t === "br" || n.t === "img" ? `${pad}${open}>` : `${pad}${open} />`;
  if (n.k.every((k) => typeof k === "string")) return `${pad}${open}>${n.k.map((k) => serial(k, 0, kf)).join("")}</${n.t}>`;
  return `${pad}${open}>\n${n.k.map((k) => serial(k, depth + 1, kf)).join("\n")}\n${pad}</${n.t}>`;
}

function snippetFor(it: Item): string {
  if (!it.css) return serial(it.node, 0, "card") + "\n";
  return `${serial(it.node, 0, "card", "gradient-card")}\n\n<style>\n${scope(BASE, ".gradient-card", "card")}\n${scope(it.css, ".gradient-card", "card")}\n</style>\n`;
}

/* ---------- reference table ---------- */
const COMPARE: { tech: string; round: string; clear: string; anim: string; note: string }[] = [
  { tech: "border-image", round: "No", clear: "Yes", anim: "With @property", note: "Shortest code. Corners are square because border-radius has no effect once border-image is set." },
  { tech: "padding-box + border-box", round: "Yes", clear: "No", anim: "With @property", note: "One element, no pseudo-elements. The inner fill must be a solid colour or its own gradient." },
  { tech: "Gradient wrapper", round: "Yes", clear: "No", anim: "Yes", note: "Extra element, works everywhere. Inner radius is the outer radius minus the border width." },
  { tech: "Mask on ::before", round: "Yes", clear: "Yes", anim: "Yes", note: "Needs the -webkit-mask-composite: xor line as well as mask-composite: exclude for older WebKit." },
  { tech: "SVG rect stroke", round: "Yes", clear: "Yes", anim: "Yes", note: "The only option here that also does dashes and dotted edges with a gradient." },
  { tech: "Pseudo-element + blur", round: "Yes", clear: "No", anim: "With @property", note: "Adds glow. Put isolation: isolate on the card so negative z-index layers stay inside it." },
];

const COPY_ICON = "M9 9h11v11H9zM5 15H4V4h11v1";
const FAMILY_KEYS = Object.keys(FAMILIES) as FamilyKey[];

export default function CssGradientBorderCollection() {
  const [family, setFamily] = useState<FamilyKey | "all">("all");
  const [open, setOpen] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styleSheet = useMemo(
    () => ALL.map((it, i) => (it.css ? `${scope(BASE, `.gb-i${i}`, `gb${i}`)}\n${scope(it.css, `.gb-i${i}`, `gb${i}`)}` : "")).join("\n"),
    [],
  );
  const visible = ALL.map((it, i) => ({ it, i })).filter(({ it }) => family === "all" || it.f === family);

  async function copy(i: number) {
    let ok = false;
    try {
      await navigator.clipboard.writeText(snippetFor(ALL[i]));
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) setOpen(i);
    setCopied(ok ? i : null);
    setAnnounce(ok ? `${ALL[i].name} code copied` : "Copy was blocked, the code is shown below the piece so you can select it");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  }

  const chip =
    "inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c0f]";

  return (
    <section className="bg-[#0b0c0f] px-4 py-12 text-slate-100 sm:px-8 sm:py-16" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <style>{styleSheet}</style>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-slate-400">CSS and Tailwind · copy and paste</p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
              {ALL.length} ways to draw a gradient border
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-400">
              Each card names its technique and what it trades away. Copy gives you the HTML with its style block, or the Tailwind markup, exactly as rendered here.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 md:max-w-md md:justify-end" role="group" aria-label="Filter by technique">
            {(["all", ...FAMILY_KEYS] as const).map((f) => {
              const on = family === f;
              return (
                <button key={f} type="button" aria-pressed={on} onClick={() => setFamily(f)} className={`${chip} ${on ? "bg-slate-100 text-slate-900" : "bg-[#14161b] text-slate-300 ring-1 ring-inset ring-slate-700 hover:bg-slate-800"}`}>
                  {f === "all" ? "All" : FAMILIES[f]}
                </button>
              );
            })}
          </div>
        </header>

        <p className="sr-only" aria-live="polite">{announce}</p>

        <div className="mt-8 max-h-[1060px] overflow-y-auto overscroll-contain rounded-2xl pr-1" tabIndex={0} aria-label="Gradient border techniques">
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map(({ it, i }) => {
              const isOpen = open === i;
              return (
                <li key={i} className={`flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#111317] ${isOpen ? "md:col-span-2 lg:col-span-3" : ""}`}>
                  <div className={`isolate grid min-h-[260px] flex-1 place-items-center px-6 py-8 ${it.stage ?? "bg-[#0e1014]"}`}>
                    {toReact(it.node, "root", `gb${i}`, it.css ? `gb-i${i}` : undefined)}
                  </div>
                  <div className="border-t border-slate-800 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <h3 className="min-w-0 flex-1 truncate text-[14px] font-semibold">{it.name}</h3>
                      <span className="rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">{it.css ? "CSS" : "Tailwind"}</span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{it.how}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`gb-code-${i}`}
                        onClick={() => setOpen(isOpen ? null : i)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-slate-300 ring-1 ring-inset ring-slate-700 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                          <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
                        </svg>
                        {isOpen ? "Hide code" : "View code"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copy(i)}
                        aria-label={`Copy code for ${it.name}`}
                        className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${copied === i ? "bg-emerald-300 text-emerald-950" : "bg-slate-100 text-slate-900 hover:bg-white"}`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                          <path d={copied === i ? "M5 12.5l4.5 4.5L19 7" : COPY_ICON} />
                        </svg>
                        {copied === i ? "Copied" : it.css ? "Copy HTML + CSS" : "Copy Tailwind"}
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <pre id={`gb-code-${i}`} tabIndex={0} className="max-h-80 overflow-auto whitespace-pre-wrap break-words border-t border-slate-800 bg-[#08090b] p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200">
                      <code>{snippetFor(it)}</code>
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-10">
            <h3 className="text-[16px] font-semibold">Which technique to pick</h3>
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <caption className="sr-only">Gradient border techniques compared</caption>
                <thead className="bg-[#14161b] text-slate-300">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Technique</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Rounded</th>
                    <th scope="col" className="px-4 py-3 font-semibold">See-through middle</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Animate the colours</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Worth knowing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {COMPARE.map((r) => (
                    <tr key={r.tech}>
                      <th scope="row" className="px-4 py-3 font-mono text-[12px] font-medium text-white">{r.tech}</th>
                      <td className="px-4 py-3">{r.round}</td>
                      <td className="px-4 py-3">{r.clear}</td>
                      <td className="px-4 py-3">{r.anim}</td>
                      <td className="px-4 py-3 text-slate-400">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
