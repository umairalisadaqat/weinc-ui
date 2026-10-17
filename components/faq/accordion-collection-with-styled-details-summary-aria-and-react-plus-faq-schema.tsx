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

/* ---------- accordions ---------- */
type QA = [string, string];
type AItem = { name: string; cls: string; note: string; tech: "details" | "aria"; qa: QA[]; css: string; exclusive?: boolean; numbered?: boolean; icon: "chevron" | "plus" | "none" };

const RM = `@media (prefers-reduced-motion: reduce) {
  .& *, .& *::before, .& *::after, .& ::details-content { transition-duration: .01ms !important; }
}`;

const SUMMARY_RESET = `.&__q { list-style: none; cursor: pointer; }
.&__q::-webkit-details-marker { display: none; }
.&__q:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }`;

const chevron = () =>
  h("svg", { class: "&__icon", viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" }, h("path", { d: "M6 9l6 6 6-6" }));
const plus = () => h("span", { class: "&__icon", "aria-hidden": "true" });

const ACCS: AItem[] = [
  {
    name: "Plain details",
    cls: "faq-plain",
    note: "Native details and summary, rotating chevron",
    tech: "details",
    icon: "chevron",
    qa: [
      ["How long is the beginner wheel course?", "Six Tuesday evenings, two hours each. You will throw, trim and glaze at least four pieces by the end."],
      ["Do I need to bring anything?", "Clothes you do not mind getting muddy. Aprons, tools and clay are included in the course price."],
      ["Can I keep everything I make?", "Yes. Pieces are fired twice, so allow two weeks after the last session to collect them."],
      ["What if I miss a session?", "Join the Thursday group that week instead. There is room for two catch-up places in each class."],
    ],
    css: `.& { max-width: 640px; font: 15px/1.55 system-ui, sans-serif; color: #1c1917; }
${SUMMARY_RESET}
.&__item { border-bottom: 1px solid #e7e5e4; }
.&__q { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 2px; font-weight: 600; }
.&__icon { flex: none; color: #78716c; transition: transform .25s cubic-bezier(.2, .7, .2, 1); }
.&__item[open] .&__icon { transform: rotate(180deg); }
.&__a { margin: 0; padding: 0 2px 16px; color: #57534e; }
${RM}`,
  },
  {
    name: "Cards with plus and minus",
    cls: "faq-cards",
    note: "Each question is its own card; the plus folds into a minus",
    tech: "details",
    icon: "plus",
    qa: [
      ["When will my order arrive?", "Orders placed before 2pm on a weekday leave the same day and usually arrive in two to three working days."],
      ["Can I change the delivery address?", "Yes, until the parcel is packed. Reply to your order email and we will update it."],
      ["How do returns work?", "Start a return from your account within 30 days. The prepaid label goes on the original box."],
    ],
    css: `.& { display: grid; gap: 10px; max-width: 640px; font: 15px/1.55 system-ui, sans-serif; color: #0f172a; }
${SUMMARY_RESET}
.&__item { border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; transition: border-color .2s, box-shadow .2s; }
.&__item[open] { border-color: #cbd5e1; box-shadow: 0 6px 20px -12px rgba(15, 23, 42, .25); }
.&__q { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 18px; border-radius: 14px; font-weight: 600; }
.&__icon { position: relative; flex: none; width: 14px; height: 14px; }
.&__icon::before, .&__icon::after { content: ""; position: absolute; top: 6px; left: 0; width: 14px; height: 2px; border-radius: 2px; background: #334155; transition: transform .25s cubic-bezier(.2, .7, .2, 1); }
.&__icon::after { transform: rotate(90deg); }
.&__item[open] .&__icon::after { transform: rotate(0deg); }
.&__a { margin: 0; padding: 0 18px 18px; color: #475569; }
${RM}`,
  },
  {
    name: "One open at a time",
    cls: "faq-exclusive",
    note: "details with a shared name attribute, no JavaScript",
    tech: "details",
    icon: "chevron",
    exclusive: true,
    qa: [
      ["What is included in the Studio plan?", "Ten editors, unlimited projects, version history for a year and priority email support."],
      ["Can I switch plans later?", "Any time. Upgrades apply straight away and downgrades take effect at the end of the billing period."],
      ["Do you offer a discount for charities?", "Registered charities get the Studio plan at half price. Write to us with your registration number."],
      ["Is there a free trial?", "Every plan starts with 14 days free, and no card is needed to begin."],
    ],
    css: `.& { max-width: 640px; padding: 6px 18px; border-radius: 16px; background: #f5f3ff; font: 15px/1.55 system-ui, sans-serif; color: #1e1b4b; }
${SUMMARY_RESET}
.&__item + .&__item { border-top: 1px solid #ddd6fe; }
.&__q { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0; font-weight: 600; }
.&__item[open] .&__q { color: #5b21b6; }
.&__icon { flex: none; transition: transform .25s cubic-bezier(.2, .7, .2, 1); }
.&__item[open] .&__icon { transform: rotate(180deg); }
.&__a { margin: 0; padding: 0 0 16px; color: #3b3a5c; }
${RM}`,
  },
  {
    name: "Smooth height details",
    cls: "faq-smooth",
    note: "Animates open with ::details-content where supported",
    tech: "details",
    icon: "chevron",
    qa: [
      ["How many guests does the barn hold?", "Up to 120 seated for dinner, or 180 standing. The courtyard adds room for drinks outside in summer."],
      ["Can we bring our own caterer?", "Yes, from our list of approved caterers, or your own if they hold the right food safety certificate."],
      ["What time does music have to stop?", "Amplified music ends at 11pm. Acoustic sets in the courtyard can carry on until midnight."],
    ],
    css: `.& { max-width: 640px; border-top: 2px solid #1c1917; font: 15px/1.55 system-ui, sans-serif; color: #1c1917; }
${SUMMARY_RESET}
.&__item { border-bottom: 1px solid #d6d3d1; }
.&__q { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 0; font-size: 17px; font-weight: 600; letter-spacing: -.01em; }
.&__icon { flex: none; transition: transform .3s cubic-bezier(.2, .7, .2, 1); }
.&__item[open] .&__icon { transform: rotate(180deg); }
.&__a { margin: 0; padding: 0 0 18px; color: #57534e; }
@supports (interpolate-size: allow-keywords) {
  .& { interpolate-size: allow-keywords; }
  .&__item::details-content { block-size: 0; overflow: hidden; transition: block-size .35s cubic-bezier(.2, .7, .2, 1), content-visibility .35s allow-discrete; }
  .&__item[open]::details-content { block-size: auto; }
}
${RM}`,
  },
  {
    name: "ARIA accordion",
    cls: "faq-aria",
    note: "Buttons in headings, aria-expanded, animated with grid rows",
    tech: "aria",
    icon: "chevron",
    qa: [
      ["How long does a full service take?", "Drop the bike off before 10am and it is usually ready the same afternoon. We text you when it is done."],
      ["Do you fix electric bikes?", "Yes, everything except the battery cells. Motor and display faults go to the maker under warranty."],
      ["Can I wait while you fix a puncture?", "Most punctures take twenty minutes. There is coffee and a bench by the window."],
    ],
    css: `.& { max-width: 640px; border: 1px solid #d6d3d1; border-radius: 16px; background: #fff; overflow: hidden; font: 15px/1.55 system-ui, sans-serif; color: #1c1917; }
.&__heading { margin: 0; font: inherit; }
.&__panel + .&__heading { border-top: 1px solid #e7e5e4; }
.&__trigger { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; padding: 16px 18px; border: 0; background: none; color: inherit; font: inherit; font-weight: 600; text-align: left; cursor: pointer; }
.&__trigger:hover { background: #fafaf9; }
.&__trigger:focus-visible { outline: 2px solid #2563eb; outline-offset: -2px; }
.&__icon { flex: none; color: #b45309; transition: transform .3s cubic-bezier(.2, .7, .2, 1); }
.&__trigger[aria-expanded="true"] .&__icon { transform: rotate(180deg); }
.&__panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .3s cubic-bezier(.2, .7, .2, 1); }
.&__panel[data-open] { grid-template-rows: 1fr; }
.&__inner { overflow: hidden; visibility: hidden; transition: visibility 0s .3s; }
.&__panel[data-open] .&__inner { visibility: visible; transition: visibility 0s; }
.&__a { margin: 0; padding: 0 18px 18px; color: #57534e; }
${RM}`,
  },
  {
    name: "Numbered, dark",
    cls: "faq-numbered",
    note: "details on a dark panel with large numerals",
    tech: "details",
    icon: "plus",
    numbered: true,
    qa: [
      ["Where is the conference held?", "In the old wool exchange by the canal, a ten minute walk from the main station."],
      ["Are talks recorded?", "Every main stage talk is filmed and sent to ticket holders within a week."],
      ["Can I transfer my ticket?", "Yes, to a colleague, free of charge, until the Friday before the event."],
    ],
    css: `.& { max-width: 640px; padding: 8px 22px; border-radius: 18px; background: #111318; counter-reset: q; font: 15px/1.55 system-ui, sans-serif; color: #e7e5e4; }
${SUMMARY_RESET}
.&__q:focus-visible { outline-color: #93c5fd; }
.&__item + .&__item { border-top: 1px solid rgba(255, 255, 255, .1); }
.&__q { display: flex; align-items: center; gap: 16px; padding: 16px 0; color: #fafaf9; font-weight: 600; }
.&__q::before { counter-increment: q; content: counter(q, decimal-leading-zero); flex: none; width: 28px; color: #a8a29e; font: 500 13px/1 ui-monospace, monospace; }
.&__item[open] .&__q::before { color: #fbbf24; }
.&__icon { position: relative; flex: none; width: 12px; height: 12px; margin-left: auto; }
.&__icon::before, .&__icon::after { content: ""; position: absolute; top: 5px; left: 0; width: 12px; height: 2px; background: #d6d3d1; transition: transform .25s cubic-bezier(.2, .7, .2, 1); }
.&__icon::after { transform: rotate(90deg); }
.&__item[open] .&__icon::after { transform: rotate(0deg); }
.&__a { margin: 0; padding: 0 0 18px 44px; color: #d6d3d1; }
${RM}`,
  },
];

function accTree(it: AItem): El {
  if (it.tech === "aria") {
    return h(
      "div",
      { class: "&" },
      it.qa.flatMap(([q, a], i) => [
        h("h3", { class: "&__heading" }, h("button", { class: "&__trigger", type: "button", id: `&-q${i + 1}`, "aria-expanded": i === 0 ? "true" : "false", "aria-controls": `&-a${i + 1}` }, h("span", {}, q), chevron())),
        h("div", { class: "&__panel", id: `&-a${i + 1}`, role: "region", "aria-labelledby": `&-q${i + 1}`, "data-open": i === 0 ? "" : undefined }, h("div", { class: "&__inner" }, h("p", { class: "&__a" }, a))),
      ]),
    );
  }
  return h(
    "div",
    { class: "&" },
    it.qa.map(([q, a], i) =>
      h(
        "details",
        { class: "&__item", name: it.exclusive ? "&" : undefined, open: i === 0 || undefined },
        h("summary", { class: "&__q" }, h("span", {}, q), it.icon === "plus" ? plus() : chevron()),
        h("p", { class: "&__a" }, a),
      ),
    ),
  );
}

const ACC_JS = `  // Opens and closes each panel and keeps aria-expanded in step with it.
  document.querySelectorAll(".& .&__trigger").forEach(function (button) {
    button.addEventListener("click", function () {
      var open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      document.getElementById(button.getAttribute("aria-controls")).toggleAttribute("data-open", open);
    });
  });`;

function attachAcc(root: HTMLElement): () => void {
  const buttons = Array.from(root.querySelectorAll<HTMLElement>("button[aria-controls]"));
  const offs = buttons.map((button) => {
    const onClick = () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      root.querySelector<HTMLElement>(`#${button.getAttribute("aria-controls")}`)?.toggleAttribute("data-open", open);
    };
    button.addEventListener("click", onClick);
    return () => button.removeEventListener("click", onClick);
  });
  return () => offs.forEach((f) => f());
}

const accCode = (it: AItem) =>
  `<!-- ${it.name} accordion -->\n${toHtml(accTree(it), it.cls)}\n\n<style>\n${sc(it.css, it.cls)}\n</style>\n` + (it.tech === "aria" ? `\n<script>\n${sc(ACC_JS, it.cls)}\n</script>\n` : "");

/* ---------- FAQ structured data ---------- */
const SCHEMA_ORG = "https:/" + "/schema.org";
function faqJsonLd(qa: QA[]): string {
  const data = {
    "@context": SCHEMA_ORG,
    "@type": "FAQPage",
    mainEntity: qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>\n`;
}

/* ---------- React + Tailwind version (the code below is this exact component) ---------- */
type FaqItem = { question: string; answer: string };

function Accordion({ items, multiple = false, defaultOpen = [0] }: { items: FaqItem[]; multiple?: boolean; defaultOpen?: number[] }) {
  const base = useId();
  const [open, setOpen] = useState<number[]>(defaultOpen);
  function toggle(i: number) {
    setOpen((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : multiple ? [...cur, i] : [i]));
  }
  return (
    <div className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
      {items.map((item, i) => {
        const isOpen = open.includes(i);
        return (
          <div key={item.question}>
            <h3>
              <button
                id={base + "-q" + i}
                type="button"
                aria-expanded={isOpen}
                aria-controls={base + "-a" + i}
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left text-[15px] font-semibold text-stone-900 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-600"
              >
                {item.question}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={"h-4 w-4 shrink-0 text-amber-700 transition-transform duration-300 motion-reduce:transition-none " + (isOpen ? "rotate-180" : "")}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </h3>
            <div
              id={base + "-a" + i}
              role="region"
              aria-labelledby={base + "-q" + i}
              className={"grid transition-[grid-template-rows,visibility] duration-300 motion-reduce:transition-none " + (isOpen ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]")}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-[14.5px] leading-relaxed text-stone-600">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const REACT_CODE = `import { useId, useState } from "react";

type FaqItem = { question: string; answer: string };

export function Accordion({ items, multiple = false, defaultOpen = [0] }: { items: FaqItem[]; multiple?: boolean; defaultOpen?: number[] }) {
  const base = useId();
  const [open, setOpen] = useState<number[]>(defaultOpen);
  function toggle(i: number) {
    setOpen((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : multiple ? [...cur, i] : [i]));
  }
  return (
    <div className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
      {items.map((item, i) => {
        const isOpen = open.includes(i);
        return (
          <div key={item.question}>
            <h3>
              <button
                id={base + "-q" + i}
                type="button"
                aria-expanded={isOpen}
                aria-controls={base + "-a" + i}
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left text-[15px] font-semibold text-stone-900 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-600"
              >
                {item.question}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={"h-4 w-4 shrink-0 text-amber-700 transition-transform duration-300 motion-reduce:transition-none " + (isOpen ? "rotate-180" : "")}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </h3>
            <div
              id={base + "-a" + i}
              role="region"
              aria-labelledby={base + "-q" + i}
              className={"grid transition-[grid-template-rows,visibility] duration-300 motion-reduce:transition-none " + (isOpen ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]")}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-[14.5px] leading-relaxed text-stone-600">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Usage
// <Accordion items={[{ question: "Do you ship abroad?", answer: "Yes, to most of Europe." }]} />
// <Accordion items={faqs} multiple defaultOpen={[]} />
`;

const DEMO_FAQ: FaqItem[] = [
  { question: "How do I book a tasting?", answer: "Pick a date on the bookings page. Tastings run Thursday to Sunday and last about ninety minutes." },
  { question: "Can children come along?", answer: "Under-18s are welcome in the garden and get a juice flight of their own while the adults taste." },
  { question: "Is the cellar step-free?", answer: "Yes. A lift goes down to the cellar and there is a level path from the car park." },
];

const COMPARE: [string, string, string][] = [
  ["JavaScript", "None", "A few lines per page"],
  ["Announced as", "A summary that screen readers report as expanded or collapsed", "A button with aria-expanded, inside a heading"],
  ["Headings", "A heading placed inside summary may not be announced as a heading", "Each question can be a real h2 or h3"],
  ["Find in page", "Chromium-based browsers open a closed details to show a match", "Hidden text is not searchable"],
  ["One open at a time", "Give every details the same name attribute", "Close the others in the click handler"],
  ["Animated height", "Only where interpolate-size and ::details-content are supported", "Works widely with grid-template-rows"],
];

type View = "html" | "react" | "schema";

export default function AccordionCollection() {
  const [view, setView] = useState<View>("html");
  const [announce, setAnnounce] = useState("");
  const gridRef = useRef<HTMLUListElement>(null);
  const styleSheet = useMemo(() => ACCS.map((it, i) => sc(it.css, `acx${i}`)).join("\n"), []);
  const codes = useMemo(() => ACCS.map(accCode), []);
  const jsonLd = useMemo(() => faqJsonLd(ACCS[0].qa), []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const offs: (() => void)[] = [];
    ACCS.forEach((it, i) => {
      if (it.tech !== "aria") return;
      const el = grid.querySelector<HTMLElement>(`.acx${i}`);
      if (el) offs.push(attachAcc(el));
    });
    return () => offs.forEach((f) => f());
  }, [view]);

  const ring = "focus-visible:ring-amber-700 focus-visible:ring-offset-[#fbfaf7]";

  return (
    <section className="bg-[#fbfaf7] px-4 py-12 text-stone-900 sm:px-8 sm:py-14" style={SECTION_FONT}>
      <style>{styleSheet}</style>
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">details and summary · ARIA · React</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">Accordions from native HTML up to React</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-stone-600">
            Five accordions built on the details element, styled past the default triangle, and one ARIA accordion that animates its height in every current browser. A React and Tailwind version and a FAQ structured data helper sit in the other tabs.
          </p>
        </header>

        <div className="mt-7 border-y border-stone-200 py-4">
          <Views
            label="Choose what to show"
            ring={ring}
            value={view}
            onChange={setView}
            views={[
              ["html", "HTML and CSS", ACCS.length],
              ["react", "React + Tailwind"],
              ["schema", "FAQ schema and comparison"],
            ]}
          />
        </div>
        <p className="sr-only" aria-live="polite">{announce}</p>

        <div className="mt-6 h-[860px] overflow-y-auto overscroll-contain pr-1" tabIndex={0} aria-label="Accordion examples">
          {view === "html" && (
            <ul ref={gridRef} className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
              {ACCS.map((it, i) => (
                <Card
                  key={it.cls}
                  id={`ac-${i}`}
                  name={it.name}
                  note={it.note}
                  code={codes[i]}
                  copyLabel={it.tech === "aria" ? "HTML, CSS, JS" : "HTML and CSS"}
                  ring={ring}
                  onAnnounce={setAnnounce}
                  stageClass="bg-white p-5 sm:p-6"
                  stage={toReact(accTree(it), `acx${i}`)}
                />
              ))}
            </ul>
          )}

          {view === "react" && (
            <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
              <div>
                <Accordion items={DEMO_FAQ} />
                <p className="mt-3 text-[13px] leading-relaxed text-stone-600">Pass multiple to let several answers stay open, and defaultOpen to choose which start open.</p>
              </div>
              <CodeBlock id="ac-react-code" code={REACT_CODE} label="Accordion.tsx" ring={ring} onAnnounce={setAnnounce} />
            </div>
          )}

          {view === "schema" && (
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
                <div className="rounded-2xl border border-stone-200 bg-white p-5">
                  <h3 className="text-[15px] font-semibold">FAQPage structured data</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-stone-600">
                    This is the JSON-LD for the first accordion on this page, built from its questions and answers. Paste it into the page that shows those same questions. Mark up only text that is visible on the page, word for word.
                  </p>
                  <p className="mt-3 text-[14px] leading-relaxed text-stone-600">
                    Since 2023 Google shows FAQ rich results mainly for well-known government and health sites, so for most sites the markup describes the content rather than changing how the result looks.
                  </p>
                </div>
                <CodeBlock id="ac-schema-code" code={jsonLd} label="faq-schema.html" ring={ring} onAnnounce={setAnnounce} />
              </div>
              <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
                <table className="w-full min-w-[620px] border-collapse text-left text-[13.5px]">
                  <caption className="sr-only">details and summary compared with an ARIA accordion</caption>
                  <thead className="bg-stone-50">
                    <tr>
                      <th scope="col" className="w-40 px-4 py-3 font-semibold"><span className="sr-only">Property</span></th>
                      <th scope="col" className="px-4 py-3 font-semibold">details and summary</th>
                      <th scope="col" className="px-4 py-3 font-semibold">ARIA accordion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE.map((r) => (
                      <tr key={r[0]} className="border-t border-stone-200 align-top">
                        <th scope="row" className="px-4 py-3 font-semibold">{r[0]}</th>
                        <td className="px-4 py-3 text-stone-700">{r[1]}</td>
                        <td className="px-4 py-3 text-stone-700">{r[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
