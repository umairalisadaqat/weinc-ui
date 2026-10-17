import { createElement, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

/* ---------- one tree, two outputs ----------
  Every piece is written once as a small tree of elements. The same tree renders the live
  preview and the HTML you copy, so the code you take is the code you saw working.
  "&" in a class, id or CSS rule is replaced with the piece's own class name. */
type Attrs = Record<string, string | boolean | undefined>;
type El = { t: string; a: Attrs; k: HNode[] };
type HNode = string | El;
type Kid = HNode | (HNode | null | undefined)[] | null | false | undefined;

function h(t: string, a: Attrs = {}, ...k: Kid[]): El {
  const kids: HNode[] = [];
  for (const x of k) {
    if (x === null || x === false || x === undefined) continue;
    if (Array.isArray(x)) kids.push(...x.filter((y) => y !== null && y !== undefined));
    else kids.push(x);
  }
  return { t, a, k: kids };
}

const sc = (s: string, name: string) => s.replace(/&/g, name);
const esc = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
const SVG_SELF = new Set(["path", "circle", "line", "rect", "polyline"]);

function attrStr(a: Attrs, name: string): string {
  return Object.entries(a)
    .filter(([, v]) => v !== undefined && v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${sc(String(v), name)}"`))
    .join("");
}

function toHtml(n: HNode, name: string, d = 0): string {
  const pad = "  ".repeat(d);
  if (typeof n === "string") return pad + esc(n);
  const open = `<${n.t}${attrStr(n.a, name)}`;
  if (SVG_SELF.has(n.t)) return `${pad}${open} />`;
  if (n.t === "input") return `${pad}${open}>`;
  if (!n.k.length) return `${pad}${open}></${n.t}>`;
  if (n.k.every((c) => typeof c === "string")) return `${pad}${open}>${n.k.map((c) => esc(c as string)).join("")}</${n.t}>`;
  return `${pad}${open}>\n${n.k.map((c) => toHtml(c, name, d + 1)).join("\n")}\n${pad}</${n.t}>`;
}

const RMAP: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  checked: "defaultChecked",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
};

function toReact(n: HNode, name: string, key?: number): ReactNode {
  if (typeof n === "string") return n;
  const p: Record<string, unknown> = { key };
  for (const [k, v] of Object.entries(n.a)) {
    if (v === undefined || v === false) continue;
    p[RMAP[k] ?? k] = v === true ? (k.startsWith("aria-") || k.startsWith("data-") ? "" : true) : sc(String(v), name);
  }
  return createElement(n.t, p, ...n.k.map((c, i) => toReact(c, name, i)));
}

/* ---------- copy helpers and shared UI ---------- */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const ICON_COPY = "M9 9h11v11H9zM5 15H4V4h11v1";
const ICON_CHECK = "M5 12.5l4.5 4.5L19 7";
const ICON_CODE = "M8 7l-5 5 5 5M16 7l5 5-5 5";

function Svg({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={d} />
    </svg>
  );
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

/** A live piece with its own Show code and Copy buttons. */
function Card({
  id,
  name,
  note,
  code,
  copyLabel,
  stage,
  stageClass,
  wide,
  ring,
  onAnnounce,
}: {
  id: string;
  name: string;
  note?: string;
  code: string;
  copyLabel: string;
  stage: ReactNode;
  stageClass: string;
  wide?: boolean;
  ring: string;
  onAnnounce: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  async function copy() {
    const ok = await copyText(code);
    if (!ok) setOpen(true);
    setCopied(ok);
    onAnnounce(ok ? `${name}: ${copyLabel} copied` : "Copy was blocked, the code is shown so you can select it");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }
  return (
    <li className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(22,24,29,0.04)] ${wide || open ? "col-span-full" : ""}`}>
      <div className={stageClass}>{stage}</div>
      <div className="flex flex-wrap items-center gap-2 border-t border-stone-200 px-3 py-2.5">
        <div className="min-w-[7.5rem] flex-1">
          <p className="text-[13px] font-semibold leading-snug text-stone-900">{name}</p>
          {note && <p className="text-[12px] leading-snug text-stone-600">{note}</p>}
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-code`}
          aria-label={`${open ? "Hide" : "Show"} code for ${name}`}
          onClick={() => setOpen(!open)}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 ${FOCUS} ${ring}`}
        >
          <Svg d={ICON_CODE} />
        </button>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${copyLabel} for ${name}`}
          className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${FOCUS} ${ring} ${copied ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-900 hover:bg-stone-200"}`}
        >
          <Svg d={copied ? ICON_CHECK : ICON_COPY} className="h-3.5 w-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {open && (
        <pre id={`${id}-code`} tabIndex={0} className="max-h-96 overflow-auto whitespace-pre-wrap break-words border-t border-stone-800 bg-[#111318] p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200">
          <code>{code}</code>
        </pre>
      )}
    </li>
  );
}

/** The view switcher at the top of each collection. */
function Views<T extends string>({ views, value, onChange, ring, label }: { views: [T, string, number?][]; value: T; onChange: (v: T) => void; ring: string; label: string }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {views.map(([k, text, n]) => {
        const on = value === k;
        return (
          <button
            key={k}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(k)}
            className={`inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-colors ${FOCUS} ${ring} ${on ? "bg-[#16181d] text-white" : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"}`}
          >
            {text}
            {n !== undefined && <span className={`font-mono text-[11px] ${on ? "text-white/70" : "text-stone-500"}`}>{n}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** A block of source code with one Copy button, used for the React + Tailwind versions. */
function CodeBlock({ code, label, ring, onAnnounce, id }: { code: string; label: string; ring: string; onAnnounce: (s: string) => void; id: string }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(true);
  async function copy() {
    const ok = await copyText(code);
    setCopied(ok);
    if (!ok) setShow(true);
    onAnnounce(ok ? `${label} copied` : "Copy was blocked, the code is shown so you can select it");
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-800 bg-[#111318]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <p className="font-mono text-[12px] text-slate-300">{label}</p>
        <div className="flex gap-1.5">
          <button type="button" aria-expanded={show} aria-controls={id} onClick={() => setShow(!show)} className={`h-10 rounded-lg px-3 text-[12.5px] font-semibold text-slate-200 hover:bg-white/10 ${FOCUS} ${ring} focus-visible:ring-offset-[#111318]`}>
            {show ? "Hide code" : "Show code"}
          </button>
          <button type="button" onClick={copy} className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold ${FOCUS} ${ring} focus-visible:ring-offset-[#111318] ${copied ? "bg-emerald-600 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
            <Svg d={copied ? ICON_CHECK : ICON_COPY} className="h-3.5 w-3.5" />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      {show && (
        <pre id={id} tabIndex={0} className="max-h-[520px] overflow-auto p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

const SECTION_FONT = { fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' };

/* ---------- tabs ---------- */
type Tech = "radio" | "target" | "aria";
type Tab = { label: string; count?: string; body: HNode[] };
type TItem = { name: string; cls: string; note: string; tech: Tech; tabs: Tab[]; css: string; vertical?: boolean; manual?: boolean; listLabel: string };

const REDUCE = `@media (prefers-reduced-motion: reduce) {
  .& * { transition-duration: .01ms !important; animation: none !important; }
}`;

const FONT = `font: 15px/1.55 system-ui, sans-serif; color: #0f172a;`;

/* Shared rules for the radio technique: hidden radios, label tabs, panels shown by :checked. */
const radioCore = (n: number) => `.&__radio { position: absolute; width: 1px; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
.&__tab { cursor: pointer; }
.&__panel { display: none; }
${Array.from({ length: n }, (_, i) => `.&__radio:nth-of-type(${i + 1}):checked ~ .&__panels .&__panel:nth-child(${i + 1})`).join(",\n")} { display: block; }
.&__radio:focus-visible + .&__tab { outline: 2px solid #2563eb; outline-offset: 2px; }`;

const p = (t: string) => h("p", {}, t);
const ul = (items: string[]) => h("ul", {}, items.map((t) => h("li", {}, t)));
const code = (t: string) => h("pre", {}, h("code", {}, t));

const TABS: TItem[] = [
  {
    name: "Radio tabs, sliding underline",
    cls: "tabs-line",
    note: "CSS only: radios, labels and :checked",
    tech: "radio",
    listLabel: "Lamp details",
    tabs: [
      { label: "Overview", body: [p("The Arbor desk lamp pairs a turned ash stem with a linen shade. One dimmer ring sets the light from reading bright to a low evening glow."), ul(["Warm 2700K light", "Weighted base, no clamp needed"])] },
      { label: "Specs", body: [ul(["Height 46 cm, shade 28 cm across", "Takes one E27 bulb up to 9 W LED", "2 m braided cable with inline switch"])] },
      { label: "Delivery", body: [p("Ships in five working days in recycled card. Returns are free within 30 days if the lamp is unused and boxed.")] },
    ],
    css: `.& { position: relative; display: flex; flex-wrap: wrap; ${FONT} }
${radioCore(3)}
.&__tab { flex: 1; padding: 12px 8px; text-align: center; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; transition: color .2s; }
.&__radio:checked + .&__tab { color: #1d4ed8; }
.&__bar { position: absolute; top: 46px; left: 0; width: calc(100% / 3); height: 2px; background: #1d4ed8; transition: transform .3s cubic-bezier(.2, .7, .2, 1); }
.&__radio:nth-of-type(2):checked ~ .&__bar { transform: translateX(100%); }
.&__radio:nth-of-type(3):checked ~ .&__bar { transform: translateX(200%); }
.&__panels { flex-basis: 100%; padding: 16px 4px 0; }
.&__panel p { margin: 0 0 10px; }
.&__panel ul { margin: 0; padding-left: 20px; list-style: disc; color: #334155; }
${REDUCE}`,
  },
  {
    name: "Radio tabs, segmented pill",
    cls: "tabs-pill",
    note: "CSS only, a sliding pill behind the labels",
    tech: "radio",
    listLabel: "Report period",
    tabs: [
      { label: "Day", body: [h("p", { class: "&__big" }, "1,284 visits"), p("Up from 1,102 on the same weekday last week. Most arrived from the spring newsletter.")] },
      { label: "Week", body: [h("p", { class: "&__big" }, "8,930 visits"), p("A steady week. The pricing page held its share at a little under a fifth of all views.")] },
      { label: "Month", body: [h("p", { class: "&__big" }, "36,410 visits"), p("The best month this year, mostly from search traffic to the new guides section.")] },
    ],
    css: `.& { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); padding: 4px; ${FONT} }
.&::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 48px; border-radius: 999px; background: #f1f5f9; }
${radioCore(3)}
.&__tab { position: relative; z-index: 1; display: grid; place-items: center; height: 40px; border-radius: 999px; text-align: center; font-weight: 600; color: #475569; transition: color .2s; }
.&__radio:checked + .&__tab { color: #0f172a; }
.&__pill { position: absolute; top: 4px; left: 4px; width: calc((100% - 8px) / 3); height: 40px; border-radius: 999px; background: #fff; box-shadow: 0 1px 2px rgba(15, 23, 42, .12), 0 2px 8px rgba(15, 23, 42, .06); transition: transform .3s cubic-bezier(.2, .7, .2, 1); }
.&__radio:nth-of-type(2):checked ~ .&__pill { transform: translateX(100%); }
.&__radio:nth-of-type(3):checked ~ .&__pill { transform: translateX(200%); }
.&__panels { grid-column: 1 / -1; padding: 18px 8px 0; }
.&__panel p { margin: 0; color: #334155; }
.&__panel .&__big { margin-bottom: 4px; color: #0f172a; font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
${REDUCE}`,
  },
  {
    name: "Radio tabs, vertical",
    cls: "tabs-side",
    note: "CSS only, sidebar that stacks when narrow",
    tech: "radio",
    listLabel: "Account settings",
    tabs: [
      { label: "Profile", body: [p("Your name and photo appear on shared boards and in comment threads. Your email address is only shown to workspace admins.")] },
      { label: "Notifications", body: [p("Choose a daily summary or one email per mention. Mobile alerts follow the quiet hours set on your phone.")] },
      { label: "Billing", body: [p("You are on the Team plan, billed yearly. The next invoice is due on 3 March and goes to accounts@ledgerline.example.")] },
      { label: "Security", body: [p("Two-step sign-in is on. You signed in from two devices this week; sign either out from here.")] },
    ],
    css: `.& { container-type: inline-size; ${FONT} }
.&__grid { display: grid; grid-template-columns: 170px 1fr; column-gap: 20px; }
${radioCore(4).replace(/\.&__radio:nth-of-type/g, ".&__radio:nth-of-type")}
.&__tab { grid-column: 1; padding: 10px 12px; border-radius: 8px; font-weight: 550; color: #475569; }
.&__tab:hover { background: #f1f5f9; }
.&__radio:checked + .&__tab { background: #eef2ff; color: #3730a3; box-shadow: inset 3px 0 0 #4f46e5; }
.&__panels { grid-column: 2; grid-row: 1 / span 4; padding: 6px 4px; }
.&__panel p { margin: 0; color: #334155; }
@container (max-width: 460px) {
  .&__grid { grid-template-columns: 1fr; }
  .&__panels { grid-column: 1; grid-row: auto; padding-top: 14px; }
}
${REDUCE}`,
  },
  {
    name: ":target tabs",
    cls: "tabs-target",
    note: "CSS only, each tab is a link with its own URL",
    tech: "target",
    listLabel: "Setup steps",
    tabs: [
      { label: "Install", body: [p("Add the package to your project."), code("npm install ledger-sync")] },
      { label: "Configure", body: [p("Create a config file at the project root."), code("ledger-sync init --region eu")] },
      { label: "Deploy", body: [p("Push the schema, then start the worker."), code("ledger-sync push\nledger-sync start")] },
    ],
    css: `.& { ${FONT} }
.&__list { display: flex; gap: 4px; border-bottom: 1px solid #cbd5e1; }
.&__tab { margin-bottom: -1px; padding: 10px 16px; border: 1px solid transparent; border-radius: 8px 8px 0 0; color: #475569; font-weight: 600; text-decoration: none; }
.&__tab:hover { color: #0f172a; }
.&__tab:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.&__panel { display: none; padding: 16px; border: 1px solid #cbd5e1; border-top: 0; border-radius: 0 0 10px 10px; background: #fff; scroll-margin-top: 80px; }
.&__panel:target { display: block; }
.&__panels:not(:has(:target)) .&__panel:first-child { display: block; }
.&:not(:has(:target)) .&__tab:first-child,
${["install", "configure", "deploy"].map((k) => `.&:has(#&-${k}:target) .&__tab[href="#&-${k}"]`).join(",\n")} { border-color: #cbd5e1; border-bottom-color: #fff; background: #fff; color: #0f172a; }
.&__panel p { margin: 0 0 10px; color: #334155; }
.&__panel pre { margin: 0; padding: 10px 12px; border-radius: 8px; background: #0f172a; color: #e2e8f0; font: 13px/1.5 ui-monospace, monospace; overflow-x: auto; }`,
  },
  {
    name: "ARIA tabs, automatic",
    cls: "tabs-aria",
    note: "JavaScript: arrow keys select, one tab stop",
    tech: "aria",
    listLabel: "Itinerary",
    tabs: [
      { label: "Day 1", body: [p("Arrive in Porto by noon. Check in at the riverside guesthouse, then a slow walk up through Ribeira to the cathedral terrace for the evening light.")] },
      { label: "Day 2", body: [p("Morning train up the Douro valley. Lunch at a quinta above Pinhão and a boat back down the river before dinner.")] },
      { label: "Day 3", body: [p("Market breakfast at Bolhão, a tile workshop in the afternoon and the late flight home.")] },
    ],
    css: `.& { ${FONT} }
.&__list { display: flex; gap: 20px; border-bottom: 1px solid #e2e8f0; }
.&__tab { position: relative; padding: 12px 2px; border: 0; background: none; color: #475569; font: inherit; font-weight: 600; cursor: pointer; }
.&__tab::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: #0f766e; transform: scaleX(0); transition: transform .25s cubic-bezier(.2, .7, .2, 1); }
.&__tab[aria-selected="true"] { color: #0f172a; }
.&__tab[aria-selected="true"]::after { transform: none; }
.&__tab:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; border-radius: 4px; }
.&__panel { padding: 16px 2px 0; }
.&__panel:focus-visible { outline: 2px solid #2563eb; outline-offset: 4px; border-radius: 4px; }
.&__panel p { margin: 0; color: #334155; }
${REDUCE}`,
  },
  {
    name: "ARIA tabs, vertical with counts",
    cls: "tabs-queue",
    note: "JavaScript: arrows move focus, Enter or Space selects",
    tech: "aria",
    vertical: true,
    manual: true,
    listLabel: "Support queue",
    tabs: [
      { label: "Open", count: "12", body: [p("Twelve tickets wait for a first reply. The oldest came in 3 hours ago about a double charge on an annual plan.")] },
      { label: "Assigned to me", count: "4", body: [p("Four tickets are yours. Two are waiting on the customer and two need an answer today.")] },
      { label: "Closed", count: "31", body: [p("Thirty-one tickets closed this week, most within a day. Reopened tickets come back to Open.")] },
    ],
    css: `.& { container-type: inline-size; ${FONT} }
.&__wrap { display: grid; grid-template-columns: 190px 1fr; gap: 16px; }
.&__list { display: grid; align-content: start; gap: 4px; }
.&__tab { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; padding: 0 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; color: #334155; font: inherit; font-weight: 600; text-align: left; cursor: pointer; }
.&__tab:hover { border-color: #cbd5e1; }
.&__tab[aria-selected="true"] { border-color: #0f172a; background: #0f172a; color: #fff; }
.&__count { min-width: 26px; padding: 1px 7px; border-radius: 999px; background: #f1f5f9; color: #0f172a; font-size: 12px; text-align: center; }
.&__tab[aria-selected="true"] .&__count { background: rgba(255, 255, 255, .16); color: #fff; }
.&__tab:focus-visible, .&__panel:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.&__panel { padding: 14px 16px; border-radius: 12px; background: #f8fafc; }
.&__panel p { margin: 0; color: #334155; }
@container (max-width: 460px) {
  .&__wrap { grid-template-columns: 1fr; }
}`,
  },
];

const slugOf = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");

function tabsTree(it: TItem): El {
  const n = it.tabs.length;
  if (it.tech === "radio") {
    const pairs = it.tabs.flatMap((t, i) => [
      h("input", { class: "&__radio", type: "radio", name: "&", id: `&-${i + 1}`, checked: i === 0 || undefined }),
      h("label", { class: "&__tab", for: `&-${i + 1}` }, t.label),
    ]);
    const extra = it.cls === "tabs-line" ? h("span", { class: "&__bar", "aria-hidden": "true" }) : it.cls === "tabs-pill" ? h("span", { class: "&__pill", "aria-hidden": "true" }) : null;
    const panels = h("div", { class: "&__panels" }, it.tabs.map((t) => h("div", { class: "&__panel" }, t.body)));
    const inner = [...pairs, extra, panels];
    return it.cls === "tabs-side"
      ? h("div", { class: "&", role: "group", "aria-label": it.listLabel }, h("div", { class: "&__grid" }, inner))
      : h("div", { class: "&", role: "group", "aria-label": it.listLabel }, inner);
  }
  if (it.tech === "target") {
    return h(
      "div",
      { class: "&" },
      h("nav", { class: "&__list", "aria-label": it.listLabel }, it.tabs.map((t) => h("a", { class: "&__tab", href: `#&-${slugOf(t.label)}` }, t.label))),
      h("div", { class: "&__panels" }, it.tabs.map((t) => h("section", { class: "&__panel", id: `&-${slugOf(t.label)}`, "aria-label": t.label }, t.body))),
    );
  }
  const list = h(
    "div",
    { class: "&__list", role: "tablist", "aria-label": it.listLabel, "aria-orientation": it.vertical ? "vertical" : undefined },
    it.tabs.map((t, i) =>
      h(
        "button",
        { class: "&__tab", type: "button", role: "tab", id: `&-tab-${i + 1}`, "aria-selected": i === 0 ? "true" : "false", "aria-controls": `&-panel-${i + 1}`, tabindex: i === 0 ? undefined : "-1" },
        t.count ? [h("span", {}, t.label), h("span", { class: "&__count" }, t.count)] : t.label,
      ),
    ),
  );
  const panels = it.tabs.map((t, i) => h("div", { class: "&__panel", role: "tabpanel", id: `&-panel-${i + 1}`, "aria-labelledby": `&-tab-${i + 1}`, tabindex: "0", hidden: i !== 0 || undefined }, t.body));
  void n;
  return it.vertical
    ? h("div", { class: "&", "data-manual": it.manual ? "" : undefined }, h("div", { class: "&__wrap" }, list, h("div", {}, panels)))
    : h("div", { class: "&", "data-manual": it.manual ? "" : undefined }, list, panels);
}

const TABS_JS = `  // WAI-ARIA tabs: one tab stop, arrow keys move between tabs, Home and End jump to the ends.
  // Add data-manual to the root to make arrows only move focus; Enter or Space then selects.
  document.querySelectorAll(".&").forEach(function (root) {
    var list = root.querySelector("[role=tablist]");
    var tabs = Array.prototype.slice.call(list.querySelectorAll("[role=tab]"));
    var manual = root.hasAttribute("data-manual");
    var vertical = list.getAttribute("aria-orientation") === "vertical";
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        if (on) t.removeAttribute("tabindex"); else t.setAttribute("tabindex", "-1");
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (event) {
        var next = vertical ? "ArrowDown" : "ArrowRight";
        var prev = vertical ? "ArrowUp" : "ArrowLeft";
        var target = null;
        if (event.key === next) target = tabs[(i + 1) % tabs.length];
        else if (event.key === prev) target = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (event.key === "Home") target = tabs[0];
        else if (event.key === "End") target = tabs[tabs.length - 1];
        if (!target) return;
        event.preventDefault();
        if (!manual) select(target);
        target.focus();
      });
    });
  });`;

function attachTabs(root: HTMLElement): () => void {
  const list = root.querySelector<HTMLElement>("[role=tablist]");
  if (!list) return () => undefined;
  const tabs = Array.from(list.querySelectorAll<HTMLElement>("[role=tab]"));
  const manual = root.hasAttribute("data-manual");
  const vertical = list.getAttribute("aria-orientation") === "vertical";
  const select = (tab: HTMLElement) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      if (on) t.removeAttribute("tabindex");
      else t.setAttribute("tabindex", "-1");
      const panel = root.querySelector<HTMLElement>(`#${t.getAttribute("aria-controls")}`);
      if (panel) panel.hidden = !on;
    });
  };
  const offs = tabs.map((tab, i) => {
    const onClick = () => select(tab);
    const onKey = (event: KeyboardEvent) => {
      const next = vertical ? "ArrowDown" : "ArrowRight";
      const prev = vertical ? "ArrowUp" : "ArrowLeft";
      let target: HTMLElement | null = null;
      if (event.key === next) target = tabs[(i + 1) % tabs.length];
      else if (event.key === prev) target = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (event.key === "Home") target = tabs[0];
      else if (event.key === "End") target = tabs[tabs.length - 1];
      if (!target) return;
      event.preventDefault();
      if (!manual) select(target);
      target.focus();
    };
    tab.addEventListener("click", onClick);
    tab.addEventListener("keydown", onKey);
    return () => {
      tab.removeEventListener("click", onClick);
      tab.removeEventListener("keydown", onKey);
    };
  });
  return () => offs.forEach((f) => f());
}

const tabsCode = (it: TItem) =>
  `<!-- ${it.name} -->\n${toHtml(tabsTree(it), it.cls)}\n\n<style>\n${sc(it.css, it.cls)}\n</style>\n` + (it.tech === "aria" ? `\n<script>\n${sc(TABS_JS, it.cls)}\n</script>\n` : "");

const TECH_LABEL: Record<Tech, string> = { radio: "Radio", target: ":target", aria: "ARIA + JS" };

const REF: [string, string, string, string][] = [
  ["JavaScript", "None", "None", "About 30 lines"],
  ["Announced as", "Radio buttons in a group, for example \"Specs, radio button, 2 of 3\"", "Links, then the section you land on", "Tabs, for example \"Day 2, tab, selected, 2 of 3\""],
  ["Keyboard", "Tab reaches the group; arrow keys move and select", "Tab stops on every link; Enter follows it", "One Tab stop; arrows, Home and End; Tab again enters the panel"],
  ["Address bar", "Unchanged", "Each tab sets a #hash, adds history and can be shared", "Unchanged unless you add it"],
  ["Watch out for", "Panels are not tied to their label for screen readers", "The page may scroll to the panel; default panel needs :has()", "Script must run before people use the tabs"],
];

type View = "all" | Tech | "ref";

export default function CssTabsCollection() {
  const [view, setView] = useState<View>("all");
  const [announce, setAnnounce] = useState("");
  const gridRef = useRef<HTMLUListElement>(null);
  const styleSheet = useMemo(() => TABS.map((it, i) => sc(it.css, `tbx${i}`)).join("\n"), []);
  const codes = useMemo(() => TABS.map(tabsCode), []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const offs: (() => void)[] = [];
    TABS.forEach((it, i) => {
      if (it.tech !== "aria") return;
      const el = grid.querySelector<HTMLElement>(`.tbx${i}`);
      if (el) offs.push(attachTabs(el));
    });
    return () => offs.forEach((f) => f());
  }, [view]);

  const ring = "focus-visible:ring-blue-700 focus-visible:ring-offset-[#f8fafc]";
  const shown = TABS.map((it, i) => ({ it, i })).filter(({ it }) => view === "all" || view === it.tech);

  return (
    <section className="bg-[#f8fafc] px-4 py-12 text-slate-900 sm:px-8 sm:py-14" style={SECTION_FONT}>
      <style>{styleSheet}</style>
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-slate-600">HTML · CSS · optional JavaScript</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">CSS tabs in three techniques</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-600">
            Six working tab sets. Three use hidden radio buttons, one uses links and the :target selector, and two follow the WAI-ARIA tabs pattern with a short script. Click and use the keyboard on each, then copy the HTML, CSS and any script it needs.
          </p>
        </header>

        <div className="mt-7 border-y border-slate-200 py-4">
          <Views
            label="Filter by technique"
            ring={ring}
            value={view}
            onChange={setView}
            views={[
              ["all", "All", TABS.length],
              ["radio", "Radio, no JS", TABS.filter((t) => t.tech === "radio").length],
              ["target", ":target, no JS", 1],
              ["aria", "ARIA with JS", TABS.filter((t) => t.tech === "aria").length],
              ["ref", "Compare techniques"],
            ]}
          />
        </div>
        <p className="sr-only" aria-live="polite">{announce}</p>

        <div className="mt-6 h-[820px] overflow-y-auto overscroll-contain pr-1" tabIndex={0} aria-label="Tab examples">
          {view !== "ref" ? (
            <ul ref={gridRef} className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
              {shown.map(({ it, i }) => (
                <Card
                  key={it.cls}
                  id={`tb-${i}`}
                  name={it.name}
                  note={`${TECH_LABEL[it.tech]} · ${it.note}`}
                  code={codes[i]}
                  copyLabel={it.tech === "aria" ? "HTML, CSS, JS" : "HTML and CSS"}
                  ring={ring}
                  onAnnounce={setAnnounce}
                  stageClass="min-h-[250px] bg-white p-5 sm:p-6"
                  stage={toReact(tabsTree(it), `tbx${i}`)}
                />
              ))}
            </ul>
          ) : (
            <div className="space-y-5">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full min-w-[720px] border-collapse text-left text-[13.5px]">
                  <caption className="sr-only">Radio, :target and ARIA tabs compared</caption>
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="w-36 px-4 py-3 font-semibold"><span className="sr-only">Property</span></th>
                      <th scope="col" className="px-4 py-3 font-semibold">Radio tabs</th>
                      <th scope="col" className="px-4 py-3 font-semibold">:target tabs</th>
                      <th scope="col" className="px-4 py-3 font-semibold">ARIA tabs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REF.map((r) => (
                      <tr key={r[0]} className="border-t border-slate-200 align-top">
                        <th scope="row" className="px-4 py-3 font-semibold">{r[0]}</th>
                        <td className="px-4 py-3 text-slate-700">{r[1]}</td>
                        <td className="px-4 py-3 text-slate-700">{r[2]}</td>
                        <td className="px-4 py-3 text-slate-700">{r[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-[15px] font-semibold">Which one to pick</h3>
                <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-slate-600">
                  Reach for the ARIA version in an app, where people expect tab keyboard behaviour and screen readers should hear tabs. Radio tabs suit a static page with short, simple panels. Use :target when each panel deserves its own shareable address, such as setup steps in documentation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
