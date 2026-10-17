import { createElement, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

/*
  Custom scrollbar collection.
  Each piece is a real scrolling panel written once as an element tree plus a block of CSS that uses "&"
  for the panel's own selector. The page scopes it to .sb-i0, .sb-i1 ... and Copy rewrites the same rules
  to a plain ".scroll-panel" class, so the copied code is exactly what scrolls here.
  Cross-browser pattern used where a style needs rounded or inset thumbs:
    ::-webkit-scrollbar rules for Chrome, Edge and Safari, and the standard scrollbar-width and
    scrollbar-color inside @supports not selector(::-webkit-scrollbar), which only Firefox reads.
  (Chrome 121+ ignores the ::-webkit-scrollbar rules on any element that also sets the standard
  properties, which is why they are kept apart.)
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
  standard: "Standard properties",
  styled: "Styled thumbs",
  dark: "Dark panels",
  sideways: "Horizontal",
  hidden: "Hidden",
  tailwind: "Tailwind only",
} as const;
type FamilyKey = keyof typeof FAMILIES;

type Item = { f: FamilyKey; name: string; how: string; node: El; css?: string; dark?: boolean };

/* ---------- sample content (edit freely) ---------- */
const ACTIVITY = [
  ["Lena merged", "pricing-page-copy", "2 min"],
  ["Build passed", "main, 41 s", "5 min"],
  ["Tomas commented", "on the hero image", "12 min"],
  ["Invoice paid", "Harbour Bakery, $480", "28 min"],
  ["Domain verified", "shop.fernhill.co", "1 h"],
  ["Ade invited", "two new editors", "2 h"],
  ["Backup finished", "1.2 GB", "3 h"],
  ["Form reply", "Catering enquiry", "4 h"],
  ["Lena published", "Spring menu", "5 h"],
];
const LOG = [
  "$ npm run build",
  "> vite build",
  "transforming (412) src/main.tsx",
  "rendering chunks...",
  "dist/index.html            0.61 kB",
  "dist/assets/index.css     18.42 kB",
  "dist/assets/vendor.js    142.07 kB",
  "dist/assets/index.js      61.90 kB",
  "built in 3.84s",
  "$ npm run preview",
  "Local: localhost:4173/",
  "press h + enter to show help",
];
const TRACKS = [
  ["Low Tide", "Marla Quinn", "3:42"],
  ["Paper Lanterns", "The Ridgeway", "4:05"],
  ["Northbound", "Kito & Sable", "2:58"],
  ["Slow Orchard", "Marla Quinn", "5:11"],
  ["Glasshouse", "Eden Park", "3:27"],
  ["Half Light", "The Ridgeway", "4:40"],
  ["Copper Sky", "June Arden", "3:15"],
  ["Last Ferry", "Kito & Sable", "3:56"],
];
const TERMS = [
  "1. Your account. You are responsible for keeping your password private and for everything done under your login.",
  "2. Payments. Plans renew each month on the date you first paid. You can cancel at any time from Billing, and the plan stays active until the end of the period.",
  "3. Your content. You keep ownership of everything you upload. We store it only to run the service for you.",
  "4. Acceptable use. Do not use the service to send spam, host malware or collect other people's data without consent.",
  "5. Changes. We will email you at least 30 days before any change to these terms takes effect.",
];
const CARDS = ["Oat flat white", "Cardamom bun", "Sourdough loaf", "Iced matcha", "Plum galette", "Cheese scone", "Cold brew"];
const NOTES = [
  ["Ward round notes", "Bed 4 stable overnight, review fluids at 10:00."],
  ["Handover", "Pharmacy delivery due after lunch."],
  ["Reminder", "Fire drill on Thursday at 14:30."],
  ["Shift swap", "Priya covers Saturday late."],
  ["Stock", "Order more 5 ml syringes."],
  ["Training", "Manual handling refresher next week."],
];

const feed = () =>
  h("ul", "", ...ACTIVITY.map(([a, b, c]) => h("li", "", h("span", "", h("strong", "", a), " ", b), h("time", "", c))));
const playlist = () =>
  h("ol", "", ...TRACKS.map(([a, b, c], i) => h("li", "", h("span", "n", String(i + 1)), h("span", "", h("strong", "", a), h("small", "", b)), h("span", "len", c))));

/* ---------- shared base, copied with every CSS piece ---------- */
const BASE = `& {
  box-sizing: border-box;
  height: 220px;
  overflow: auto;
  border: 1px solid #e7e5e4;
  border-radius: 12px;
  background: #fff;
  color: #1c1917;
  font: 400 14px/1.45 Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}
&:focus-visible { outline: 2px solid #0f766e; outline-offset: 2px; }
& ul, & ol { margin: 0; padding: 0; list-style: none; }
& li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border-bottom: 1px solid #f1efec; }
& time, & small, & .len { color: #57534e; font-size: 12.5px; white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  &, & * { transition: none !important; }
}`;

const ITEMS: Item[] = [
  {
    f: "standard",
    name: "Thin and quiet",
    how: "Only the two standard properties. Works in Chrome, Edge and Firefox; Safari keeps its own bar.",
    node: h("div", "", feed()),
    css: `& { scrollbar-width: thin; scrollbar-color: #a8a29e transparent; }`,
  },
  {
    f: "standard",
    name: "Brand colour with a tinted track",
    how: "scrollbar-color takes the thumb first, then the track.",
    node: h("div", "", playlist()),
    css: `& { scrollbar-width: auto; scrollbar-color: #0f766e #e6f2f0; }
& li .n { width: 18px; color: #57534e; font-size: 12px; font-variant-numeric: tabular-nums; }
& li > span:nth-child(2) { flex: 1; display: grid; }`,
  },
  {
    f: "styled",
    name: "Rounded pill thumb",
    how: "WebKit rules give the pill; Firefox reads the @supports block and gets a thin bar in the same colour.",
    node: h("div", "", ...TERMS.map((t) => h("p", "", t))),
    css: `& { padding: 4px 16px; }
& p { margin: 12px 0; color: #44403c; }
&::-webkit-scrollbar { width: 10px; }
&::-webkit-scrollbar-track { background: transparent; }
&::-webkit-scrollbar-thumb { border-radius: 999px; background: #c4bfba; }
&::-webkit-scrollbar-thumb:hover { background: #8f8983; }
@supports not selector(::-webkit-scrollbar) {
  & { scrollbar-width: thin; scrollbar-color: #c4bfba transparent; }
}`,
  },
  {
    f: "styled",
    name: "Floating thumb with a gap",
    how: "A transparent border plus background-clip: padding-box keeps the thumb off the edges.",
    node: h("div", "", feed()),
    css: `&::-webkit-scrollbar { width: 14px; }
&::-webkit-scrollbar-track { background: #faf8f5; border-left: 1px solid #f1efec; }
&::-webkit-scrollbar-thumb { border: 4px solid transparent; border-radius: 999px; background: #7c6f64; background-clip: padding-box; }
&::-webkit-scrollbar-thumb:hover { background-color: #57534e; }
@supports not selector(::-webkit-scrollbar) {
  & { scrollbar-color: #7c6f64 #faf8f5; }
}`,
  },
  {
    f: "styled",
    name: "Shows on hover or focus",
    how: "The thumb stays transparent until the pointer is over the panel or it has keyboard focus.",
    node: h("div", "", ...NOTES.map(([a, b]) => h("article", "", h("strong", "", a), h("p", "", b)))),
    css: `& article { padding: 10px 14px; border-bottom: 1px solid #f1efec; }
& article p { margin: 2px 0 0; color: #57534e; }
&::-webkit-scrollbar { width: 8px; }
&::-webkit-scrollbar-thumb { border-radius: 8px; background: transparent; }
&:hover::-webkit-scrollbar-thumb, &:focus-within::-webkit-scrollbar-thumb, &:focus::-webkit-scrollbar-thumb { background: #9a3412; }
@supports not selector(::-webkit-scrollbar) {
  & { scrollbar-width: thin; scrollbar-color: transparent transparent; transition: scrollbar-color .2s; }
  &:hover, &:focus, &:focus-within { scrollbar-color: #9a3412 transparent; }
}`,
  },
  {
    f: "dark",
    name: "Terminal",
    how: "A square thumb with a 1px edge, matched to a dark code panel, in both scroll directions.",
    dark: true,
    node: h("pre", "", h("code", "", LOG.join("\n"))),
    css: `& { margin: 0; padding: 14px 16px; border-color: #26292f; background: #0f1115; color: #d4d8de; font: 12.5px/1.7 ui-monospace, "SF Mono", Menlo, Consolas, monospace; white-space: pre; }
&:focus-visible { outline-color: #5eead4; }
&::-webkit-scrollbar { width: 10px; height: 10px; }
&::-webkit-scrollbar-track { background: #0f1115; }
&::-webkit-scrollbar-thumb { background: #2f343c; border: 1px solid #454b55; }
&::-webkit-scrollbar-thumb:hover { background: #3b414b; }
&::-webkit-scrollbar-corner { background: #0f1115; }
@supports not selector(::-webkit-scrollbar) {
  & { scrollbar-color: #454b55 #0f1115; }
}`,
  },
  {
    f: "dark",
    name: "Gradient thumb on dark",
    how: "WebKit can paint any background on the thumb; Firefox only takes flat colours, so it gets the middle one.",
    dark: true,
    node: h("div", "", playlist()),
    css: `& { border-color: #2a2340; background: #15121f; color: #ece9f6; }
& li { border-color: #221d33; }
& time, & small, & .len, & li .n { color: #b3abc9; }
& li .n { width: 18px; font-size: 12px; }
& li > span:nth-child(2) { flex: 1; display: grid; }
&:focus-visible { outline-color: #c4b5fd; }
&::-webkit-scrollbar { width: 12px; }
&::-webkit-scrollbar-track { background: transparent; }
&::-webkit-scrollbar-thumb { border: 3px solid #15121f; border-radius: 999px; background: linear-gradient(#f472b6, #8b5cf6); }
@supports not selector(::-webkit-scrollbar) {
  & { scrollbar-width: thin; scrollbar-color: #a78bfa #15121f; }
}`,
  },
  {
    f: "sideways",
    name: "Horizontal row with a slim rail",
    how: "Use height, not width, for a horizontal bar. Scroll snapping keeps each card aligned.",
    node: h("div", "", h("ul", "", ...CARDS.map((c, i) => h("li", "", h("span", "swatch", $({ "aria-hidden": "true" })), h("strong", "", c), h("small", "", `$${(3.4 + i * 0.6).toFixed(2)}`))))),
    css: `& { height: auto; padding: 14px; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; }
& ul { display: flex; gap: 10px; }
& li { flex: 0 0 132px; display: grid; gap: 2px; justify-items: start; padding: 10px; border: 1px solid #ece8e3; border-radius: 10px; scroll-snap-align: start; }
& .swatch { width: 100%; height: 64px; margin-bottom: 6px; border-radius: 6px; background: linear-gradient(135deg, #f5e6d3, #e9cfae); }
&::-webkit-scrollbar { height: 6px; }
&::-webkit-scrollbar-track { margin: 0 14px; border-radius: 6px; background: #f1efec; }
&::-webkit-scrollbar-thumb { border-radius: 6px; background: #b45309; }
@supports not selector(::-webkit-scrollbar) {
  & { scrollbar-width: thin; scrollbar-color: #b45309 #f1efec; }
}`,
  },
  {
    f: "hidden",
    name: "Hidden bar, still scrollable",
    how: "scrollbar-width: none plus display: none on the WebKit bar. A fade at the edge tells people there is more.",
    node: h("div", "", ...TERMS.map((t) => h("p", "", t))),
    css: `& { padding: 4px 16px 24px; scrollbar-width: none; -webkit-mask-image: linear-gradient(#000 80%, transparent); mask-image: linear-gradient(#000 80%, transparent); }
&::-webkit-scrollbar { display: none; }
& p { margin: 12px 0; color: #44403c; }`,
  },
  {
    f: "tailwind",
    name: "Tailwind thin bar, no plugin",
    how: "Arbitrary properties set the standard values straight from the class list.",
    node: h("div", "h-[220px] overflow-auto rounded-xl border border-stone-200 bg-white text-[14px] text-stone-900 [scrollbar-color:#6366f1_#eef2ff] [scrollbar-width:thin] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
      h("ul", "divide-y divide-stone-100", ...ACTIVITY.map(([a, b, c]) => h("li", "flex items-center justify-between gap-3 px-3.5 py-2.5", h("span", "", h("strong", "font-semibold", a), " ", b), h("time", "shrink-0 text-[12.5px] text-stone-600", c)))),
    ),
  },
  {
    f: "tailwind",
    name: "Tailwind WebKit variants",
    how: "Arbitrary variants reach the pseudo-elements: [&::-webkit-scrollbar]:w-2 and friends.",
    node: h("div", "h-[220px] overflow-auto rounded-xl border border-stone-200 bg-white px-4 text-[14px] text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sky-700 [&::-webkit-scrollbar-track]:bg-sky-50",
      ...NOTES.map(([a, b]) => h("p", "my-3", h("strong", "block text-stone-900", a), b)),
    ),
  },
];

const ALL: Item[] = (Object.keys(FAMILIES) as FamilyKey[]).flatMap((f) => ITEMS.filter((it) => it.f === f));

/* ---------- rendering ---------- */
const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const scope = (css: string, sel: string) => css.replace(/&/g, sel);
const reactKey = (k: string) => (k.startsWith("aria-") || k.startsWith("data-") ? k : k === "tabindex" ? "tabIndex" : k);

function rootAttrs(it: Item): Attrs {
  return { tabindex: "0", role: "region", "aria-label": it.name, ...(it.node.a ?? {}) };
}

function toReact(n: N, key: string | number, root?: { cls?: string; attrs: Attrs }): ReactNode {
  if (typeof n === "string") return n;
  const props: Record<string, unknown> = { key };
  const cls = root?.cls ?? n.c;
  if (cls) props.className = cls;
  for (const [k, v] of Object.entries(root?.attrs ?? n.a ?? {})) props[reactKey(k)] = v;
  return createElement(n.t, props, ...n.k.map((k, i) => toReact(k, i)));
}

function serial(n: N, depth: number, root?: { cls?: string; attrs: Attrs }, inPre = false): string {
  const pad = inPre ? "" : "  ".repeat(depth);
  if (typeof n === "string") return pad + escHtml(n);
  const attrs: string[] = [];
  const cls = root?.cls ?? n.c;
  if (cls) attrs.push(`class="${cls}"`);
  for (const [k, v] of Object.entries(root?.attrs ?? n.a ?? {})) attrs.push(`${k}="${v}"`);
  const open = `<${n.t}${attrs.length ? " " + attrs.join(" ") : ""}>`;
  const pre = inPre || n.t === "pre";
  if (pre || n.k.every((k) => typeof k === "string")) return `${pad}${open}${n.k.map((k) => serial(k, 0, undefined, pre)).join("")}</${n.t}>`;
  return `${pad}${open}\n${n.k.map((k) => serial(k, depth + 1)).join("\n")}\n${pad}</${n.t}>`;
}

function snippetFor(it: Item): string {
  const attrs = rootAttrs(it);
  if (!it.css) return serial(it.node, 0, { attrs }) + "\n";
  return `${serial(it.node, 0, { cls: "scroll-panel", attrs })}\n\n<style>\n${scope(BASE, ".scroll-panel")}\n${scope(it.css, ".scroll-panel")}\n</style>\n`;
}

/* ---------- reference ---------- */
const REF: { prop: string; what: string; where: string }[] = [
  { prop: "scrollbar-width: auto | thin | none", what: "Sets the bar thickness, or hides it while keeping scrolling.", where: "Standard. Chrome and Edge 121+, Firefox, Safari 18.2+." },
  { prop: "scrollbar-color: <thumb> <track>", what: "Two flat colours. No radius, no gradients, no width in pixels.", where: "Standard. Chrome and Edge 121+, Firefox. Not in Safari." },
  { prop: "::-webkit-scrollbar and its parts", what: "Full styling of the bar, thumb, track and corner, including radius and gradients.", where: "Chrome, Edge and Safari. Ignored by Chrome 121+ when the standard properties are set on the same element." },
  { prop: "scrollbar-gutter: stable", what: "Reserves room for the bar so content does not shift when it appears.", where: "Chrome, Edge, Firefox and Safari 18.2+." },
  { prop: "@supports not selector(::-webkit-scrollbar)", what: "A block only browsers without the WebKit pseudo-elements read, so both styles can live together.", where: "In practice, Firefox." },
];

const COPY_ICON = "M9 9h11v11H9zM5 15H4V4h11v1";
const FAMILY_KEYS = Object.keys(FAMILIES) as FamilyKey[];

export default function CustomScrollbarCollection() {
  const [family, setFamily] = useState<FamilyKey | "all">("all");
  const [open, setOpen] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styleSheet = useMemo(() => ALL.map((it, i) => (it.css ? `${scope(BASE, `.sb-i${i}`)}\n${scope(it.css, `.sb-i${i}`)}` : "")).join("\n"), []);
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
    setAnnounce(ok ? `${ALL[i].name} code copied` : "Copy was blocked, the code is shown below the panel so you can select it");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  }

  const chip =
    "inline-flex min-h-[40px] items-center whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f3ef]";

  return (
    <section className="bg-[#f5f3ef] px-4 py-12 text-stone-900 sm:px-8 sm:py-16" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <style>{styleSheet}</style>
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">Chrome · Edge · Safari · Firefox</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">Custom scrollbars that work in every browser</h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone-600">
            Scroll any panel to try it. Each one pairs the WebKit rules with the standard properties so Firefox gets a matching bar instead of the default.
          </p>
        </header>

        <div className="mt-6 flex flex-wrap gap-1.5" role="group" aria-label="Filter scrollbar styles">
          {(["all", ...FAMILY_KEYS] as const).map((f) => {
            const on = family === f;
            return (
              <button key={f} type="button" aria-pressed={on} onClick={() => setFamily(f)} className={`${chip} ${on ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"}`}>
                {f === "all" ? "All" : FAMILIES[f]}
              </button>
            );
          })}
        </div>

        <p className="sr-only" aria-live="polite">{announce}</p>

        <div className="mt-6 max-h-[1080px] overflow-y-auto overscroll-contain pr-1" tabIndex={0} aria-label="Scrollbar styles">
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map(({ it, i }) => {
              const isOpen = open === i;
              return (
                <li key={i} className={`flex flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] ${isOpen ? "md:col-span-2 lg:col-span-3" : ""}`}>
                  <div className={`flex flex-1 flex-col justify-center rounded-xl p-3 ${it.dark ? "bg-[#0b0c0f]" : "bg-[#f7f5f2]"}`}>
                    {toReact(it.node, "root", { cls: it.css ? `sb-i${i}` : undefined, attrs: rootAttrs(it) })}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <h3 className="min-w-0 flex-1 text-[14px] font-semibold">{it.name}</h3>
                    <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] text-stone-700">{it.css ? "CSS" : "Tailwind"}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-stone-600">{it.how}</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" aria-expanded={isOpen} aria-controls={`sb-code-${i}`} onClick={() => setOpen(isOpen ? null : i)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5" /></svg>
                      {isOpen ? "Hide code" : "View code"}
                    </button>
                    <button type="button" onClick={() => copy(i)} aria-label={`Copy code for ${it.name}`} className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 ${copied === i ? "bg-teal-800 text-white" : "bg-stone-900 text-white hover:bg-stone-700"}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5"><path d={copied === i ? "M5 12.5l4.5 4.5L19 7" : COPY_ICON} /></svg>
                      {copied === i ? "Copied" : it.css ? "Copy HTML + CSS" : "Copy Tailwind"}
                    </button>
                  </div>
                  {isOpen && (
                    <pre id={`sb-code-${i}`} tabIndex={0} className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#14161a] p-4 font-mono text-[11.5px] leading-[1.65] text-stone-100">
                      <code>{snippetFor(it)}</code>
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-10">
            <h3 className="text-[16px] font-semibold">What each property does, and where</h3>
            <div className="mt-3 overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full min-w-[620px] text-left text-[13px]">
                <caption className="sr-only">Scrollbar styling properties and browser support</caption>
                <thead className="bg-stone-50 text-stone-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Property</th>
                    <th scope="col" className="px-4 py-3 font-semibold">What it does</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Browsers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {REF.map((r) => (
                    <tr key={r.prop}>
                      <th scope="row" className="px-4 py-3 font-mono text-[12px] font-medium text-stone-900">{r.prop}</th>
                      <td className="px-4 py-3">{r.what}</td>
                      <td className="px-4 py-3 text-stone-600">{r.where}</td>
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
