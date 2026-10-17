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

/* ---------- toggle switches ----------
  Every switch is a real <input type="checkbox" role="switch"> inside its label, so it submits
  with a form, toggles with Space and is announced as a switch. The track and thumb are drawn
  next to it and read the input's state through :checked, :focus-visible and :disabled. */
const BASE = `.& {
  position: relative; display: inline-flex; align-items: center; gap: .75em;
  min-height: 44px; color: #1c1917; cursor: pointer;
  font: 500 SIZE/1.3 system-ui, sans-serif;
  --dir: 1; --origin: left;
}
.&[dir="rtl"], [dir="rtl"] .& { --dir: -1; --origin: right; }
.&__input { position: absolute; width: 1px; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
.&__track { position: relative; flex: none; display: inline-block; box-sizing: border-box; transition: background-color .2s, border-color .2s, box-shadow .2s; }
.&__thumb { position: absolute; box-sizing: border-box; transition: transform .22s cubic-bezier(.2, .7, .2, 1), background-color .2s, border-color .2s, width .2s, box-shadow .2s; }
.&__input:focus-visible + .&__track { outline: 2px solid #2563eb; outline-offset: 3px; }
.&__input:disabled + .&__track { opacity: .45; }
.&__input:disabled ~ .&__text { color: #78716c; }
@media (prefers-reduced-motion: reduce) {
  .& *, .& *::before { transition-duration: .01ms !important; }
}`;

const move = (em: string, extra = "") => `transform: translateX(calc(${em} * var(--dir)))${extra};`;
const ON = ".&__input:checked + .&__track";

type Kind = "plain" | "row" | "two" | "onoff" | "icon" | "rocker";
type Sw = { name: string; cls: string; note: string; text: string; on: boolean; kind: Kind; css: string; desc?: string; aria?: string };

const SWITCHES: Sw[] = [
  {
    name: "Classic", cls: "switch-classic", note: "Rounded track, white thumb", text: "Email alerts", on: true, kind: "plain",
    css: `.&__track { width: 2.75em; height: 1.5em; border-radius: 999px; background: #a8a29e; }
.&__thumb { top: .1875em; inset-inline-start: .1875em; width: 1.125em; height: 1.125em; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .25); }
${ON} { background: #15803d; }
${ON} .&__thumb { ${move("1.25em")} }`,
  },
  {
    name: "Thin track", cls: "switch-thin", note: "Thumb larger than the track", text: "Sync over mobile data", on: false, kind: "plain",
    css: `.&__track { width: 2.25em; height: .875em; border-radius: 999px; background: #a8a29e; }
.&__thumb { top: -.1875em; inset-inline-start: -.125em; width: 1.25em; height: 1.25em; border-radius: 50%; background: #fafaf9; box-shadow: 0 1px 3px rgba(0, 0, 0, .35); }
${ON} { background: #93b4f5; }
${ON} .&__thumb { background: #1d4ed8; ${move("1.25em")} }`,
  },
  {
    name: "Square", cls: "switch-square", note: "Sharp corners for dense admin UI", text: "Maintenance mode", on: false, kind: "plain",
    css: `.&__track { width: 3em; height: 1.5em; border-radius: 3px; background: #57534e; }
.&__thumb { top: .1875em; inset-inline-start: .1875em; width: 1.125em; height: 1.125em; border-radius: 2px; background: #fff; }
${ON} { background: #b45309; }
${ON} .&__thumb { ${move("1.5em")} }`,
  },
  {
    name: "On and off text", cls: "switch-text", note: "Words inside the track", text: "Auto-renew", on: true, kind: "onoff",
    css: `.&__track { width: 3.5em; height: 1.625em; border-radius: 999px; background: #e7e5e4; box-shadow: inset 0 0 0 1px #d6d3d1; }
.&__thumb { top: .1875em; inset-inline-start: .1875em; width: 1.25em; height: 1.25em; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .3); }
.&__on, .&__off { position: absolute; top: 50%; transform: translateY(-50%); font-size: .625em; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.&__on { inset-inline-start: .8em; color: #fff; opacity: 0; }
.&__off { inset-inline-end: .8em; color: #57534e; }
${ON} { background: #0f766e; box-shadow: none; }
${ON} .&__thumb { ${move("1.875em")} }
${ON} .&__on { opacity: 1; }
${ON} .&__off { opacity: 0; }`,
  },
  {
    name: "Icon thumb", cls: "switch-icon", note: "Cross or tick inside the thumb", text: "Two-step sign-in", on: true, kind: "icon",
    css: `.&__track { width: 2.75em; height: 1.5em; border-radius: 999px; background: #78716c; }
.&__thumb { top: .1875em; inset-inline-start: .1875em; display: grid; place-items: center; width: 1.125em; height: 1.125em; border-radius: 50%; background: #fff; color: #57534e; }
.&__thumb svg { grid-area: 1 / 1; width: .75em; height: .75em; transition: opacity .2s; }
.&__thumb svg + svg { opacity: 0; }
${ON} { background: #15803d; }
${ON} .&__thumb { color: #15803d; ${move("1.25em")} }
${ON} .&__thumb svg { opacity: 0; }
${ON} .&__thumb svg + svg { opacity: 1; }`,
  },
  {
    name: "Outline", cls: "switch-outline", note: "Bordered track, thumb grows when on", text: "Show weekends", on: false, kind: "plain",
    css: `.&__track { width: 2.75em; height: 1.5em; border-radius: 999px; border: .125em solid #57534e; background: transparent; }
.&__thumb { top: .1875em; inset-inline-start: .1875em; width: .875em; height: .875em; border-radius: 50%; background: #57534e; }
${ON} { border-color: #4338ca; background: #eef2ff; }
${ON} .&__thumb { background: #4338ca; ${move("1.25em", " scale(1.15)")} }`,
  },
  {
    name: "Inset", cls: "switch-inset", note: "Recessed track, raised thumb", text: "Sound effects", on: true, kind: "plain",
    css: `.&__track { width: 3em; height: 1.625em; border-radius: 999px; background: #e7e5e4; box-shadow: inset 0 2px 4px rgba(0, 0, 0, .18), inset 0 0 0 1px rgba(0, 0, 0, .08); }
.&__thumb { top: .1875em; inset-inline-start: .1875em; width: 1.25em; height: 1.25em; border-radius: 50%; background: linear-gradient(#fff, #f1f0ee); box-shadow: 0 1px 2px rgba(0, 0, 0, .3), 0 2px 6px rgba(0, 0, 0, .12); }
${ON} { background: #0369a1; box-shadow: inset 0 2px 4px rgba(0, 0, 0, .3); }
${ON} .&__thumb { ${move("1.375em")} }`,
  },
  {
    name: "Settings row", cls: "switch-row", note: "Text and hint first, switch at the end", text: "Public profile", desc: "Anyone with the link can see your projects.", on: true, kind: "row",
    css: `.& { justify-content: space-between; gap: 1em; width: 100%; max-width: 21em; padding: .75em 1em; border: 1px solid #e7e5e4; border-radius: .75em; background: #fff; }
.&__copy { display: grid; gap: .15em; }
.&__desc { color: #57534e; font-size: .8125em; font-weight: 400; }
.&:has(.&__input:disabled) .&__text { color: #78716c; }
.&__track { width: 2.75em; height: 1.5em; border-radius: 999px; background: #a8a29e; }
.&__thumb { top: .1875em; inset-inline-start: .1875em; width: 1.125em; height: 1.125em; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .25); }
${ON} { background: #16181d; }
${ON} .&__thumb { ${move("1.25em")} }`,
  },
  {
    name: "Day and night", cls: "switch-sky", note: "Sun thumb becomes a crescent", text: "Dark theme", on: false, kind: "plain",
    css: `.&__track { width: 3.25em; height: 1.75em; border-radius: 999px; background: linear-gradient(#38bdf8, #7dd3fc); }
.&__thumb { top: .1875em; inset-inline-start: .1875em; width: 1.375em; height: 1.375em; border-radius: 50%; background: #fcd34d; box-shadow: 0 0 0 .2em rgba(253, 224, 71, .35); }
${ON} { background: #1e293b; }
${ON} .&__thumb { background: #e2e8f0; box-shadow: inset -.35em -.1em 0 0 #94a3b8; ${move("1.5em")} }`,
  },
  {
    name: "Stretch", cls: "switch-stretch", note: "Thumb widens while pressed", text: "Location sharing", on: true, kind: "plain",
    css: `.&__track { width: 2.75em; height: 1.5em; border-radius: 999px; background: #a8a29e; }
.&__thumb { top: .1875em; inset-inline-start: .1875em; width: 1.125em; height: 1.125em; border-radius: 999px; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .25); }
.&:active .&__thumb { width: 1.5em; }
${ON} { background: #be123c; }
${ON} .&__thumb { ${move("1.25em")} }
.&:active ${ON} .&__thumb { ${move(".875em")} }`,
  },
  {
    name: "Two options", cls: "switch-choice", note: "Both choices named, like a billing period", text: "", aria: "Yearly billing", on: true, kind: "two",
    css: `.&__track { width: 2.5em; height: 1.375em; border-radius: 999px; background: #16181d; }
.&__thumb { top: .1875em; inset-inline-start: .1875em; width: 1em; height: 1em; border-radius: 50%; background: #fff; }
${ON} .&__thumb { ${move("1.125em")} }
.&__a { order: -1; }
.&__a, .&__b { color: #57534e; }
.&__input:not(:checked) ~ .&__a, .&__input:checked ~ .&__b { color: #16181d; font-weight: 650; }`,
  },
  {
    name: "Compact", cls: "switch-compact", note: "Small, for tables and dense lists", text: "Compact rows", on: true, kind: "plain",
    css: `.& { font-size: .875em; }
.&__track { width: 2em; height: 1.125em; border-radius: 999px; background: #a8a29e; }
.&__thumb { top: .1875em; inset-inline-start: .1875em; width: .75em; height: .75em; border-radius: 50%; background: #fff; }
${ON} { background: #4338ca; }
${ON} .&__thumb { ${move(".875em")} }`,
  },
  {
    name: "Rocker", cls: "switch-rocker", note: "Panel with I and O marks", text: "Studio lights", on: true, kind: "rocker",
    css: `.&__track { display: inline-flex; width: 3.5em; height: 1.75em; padding: .125em; border-radius: .375em; background: #d6d3d1; box-shadow: inset 0 1px 2px rgba(0, 0, 0, .2); }
.&__mark { flex: 1; display: grid; place-items: center; color: #44403c; font-size: .75em; font-weight: 700; }
.&__thumb { top: .125em; inset-inline-start: .125em; width: 1.625em; height: 1.5em; border-radius: .25em; background: linear-gradient(#fff, #efedea); box-shadow: 0 1px 0 #a8a29e, 0 3px 6px rgba(0, 0, 0, .14); }
${ON} { background: #1c1917; }
${ON} .&__mark { color: #e7e5e4; }
${ON} .&__thumb { ${move("1.625em")} }`,
  },
  {
    name: "Line", cls: "switch-line", note: "Thin rule with a ringed dot", text: "Captions", on: false, kind: "plain",
    css: `.&__track { width: 2.5em; height: .25em; border-radius: 999px; background: #a8a29e; }
.&__thumb { top: -.375em; inset-inline-start: 0; width: 1em; height: 1em; border-radius: 50%; border: .125em solid #57534e; background: #fff; }
${ON} { background: #0f766e; }
${ON} .&__thumb { border-color: #0f766e; background: #0f766e; ${move("1.5em")} }`,
  },
  {
    name: "Fill sweep", cls: "switch-sweep", note: "Colour washes in behind the thumb", text: "Focus mode", on: true, kind: "plain",
    css: `.&__track { width: 2.75em; height: 1.5em; border-radius: 999px; overflow: hidden; background: #a8a29e; }
.&__track::before { content: ""; position: absolute; inset: 0; background: #4338ca; transform: scaleX(0); transform-origin: var(--origin); transition: transform .3s cubic-bezier(.2, .7, .2, 1); }
.&__thumb { z-index: 1; top: .1875em; inset-inline-start: .1875em; width: 1.125em; height: 1.125em; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .25); }
${ON}::before { transform: none; }
${ON} .&__thumb { ${move("1.25em")} }`,
  },
];

const ICON_X = () => h("svg", { viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round" }, h("path", { d: "M3 3l6 6M9 3L3 9" }));
const ICON_TICK = () => h("svg", { viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }, h("path", { d: "M2.5 6.5l2.5 2.5 4.5-6" }));

type Opts = { disabled: boolean; rtl: boolean };

function swTree(it: Sw, o: Opts): El {
  const input = h("input", {
    class: "&__input",
    id: "&-input",
    type: "checkbox",
    role: "switch",
    checked: it.on || undefined,
    disabled: o.disabled || undefined,
    "aria-label": it.aria,
    "aria-describedby": it.desc ? "&-desc" : undefined,
  });
  const trackKids =
    it.kind === "onoff" ? [h("span", { class: "&__on" }, "On"), h("span", { class: "&__off" }, "Off")] : it.kind === "rocker" ? [h("span", { class: "&__mark" }, "O"), h("span", { class: "&__mark" }, "I")] : [];
  const thumb = h("span", { class: "&__thumb" }, it.kind === "icon" ? [ICON_X(), ICON_TICK()] : []);
  const track = h("span", { class: "&__track", "aria-hidden": "true" }, trackKids, thumb);
  const root = { class: "&", for: "&-input", dir: o.rtl ? "rtl" : undefined };
  if (it.kind === "row") return h("label", root, h("span", { class: "&__copy" }, h("span", { class: "&__text" }, it.text), h("span", { class: "&__desc", id: "&-desc" }, it.desc ?? "")), input, track);
  if (it.kind === "two") return h("label", root, input, track, h("span", { class: "&__a" }, "Monthly"), h("span", { class: "&__b" }, "Yearly"));
  return h("label", root, input, track, h("span", { class: "&__text" }, it.text));
}

const SIZES: [string, string, string][] = [
  ["sm", "Small", "14px"],
  ["md", "Medium", "16px"],
  ["lg", "Large", "20px"],
];
const cssOf = (it: Sw, size: string) => `${BASE}\n${it.css}`.replace(/SIZE/g, size);
const codeOf = (it: Sw, o: Opts, size: string) => `<!-- ${it.name} switch -->\n${toHtml(swTree(it, o), it.cls)}\n\n<style>\n${sc(cssOf(it, size), it.cls)}\n</style>\n`;

/* ---------- React + Tailwind version (the code below is this exact component) ---------- */
const SW_SIZES = {
  sm: { track: "h-5 w-9", thumb: "h-4 w-4", on: "translate-x-4 rtl:-translate-x-4" },
  md: { track: "h-6 w-11", thumb: "h-5 w-5", on: "translate-x-5 rtl:-translate-x-5" },
  lg: { track: "h-8 w-14", thumb: "h-7 w-7", on: "translate-x-6 rtl:-translate-x-6" },
};

type SwitchProps = {
  label: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  size?: keyof typeof SW_SIZES;
  onChange?: (checked: boolean) => void;
};

function Switch({ label, defaultChecked = false, disabled = false, size = "md", onChange }: SwitchProps) {
  const id = useId();
  const [on, setOn] = useState(defaultChecked);
  const s = SW_SIZES[size];
  return (
    <label htmlFor={id} className={"flex min-h-[44px] items-center gap-3 " + (disabled ? "cursor-not-allowed" : "cursor-pointer")}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={on}
        disabled={disabled}
        onChange={(e) => {
          setOn(e.target.checked);
          onChange?.(e.target.checked);
        }}
      />
      <span
        aria-hidden="true"
        className={"inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 motion-reduce:transition-none peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600 peer-focus-visible:ring-offset-2 peer-disabled:opacity-50 " + s.track + " " + (on ? "bg-emerald-700" : "bg-stone-400")}
      >
        <span className={"rounded-full bg-white shadow transition-transform duration-200 motion-reduce:transition-none " + s.thumb + " " + (on ? s.on : "translate-x-0")} />
      </span>
      <span className="text-[15px] text-stone-900 peer-disabled:text-stone-500">{label}</span>
    </label>
  );
}

const REACT_CODE = `import { useId, useState } from "react";

const SW_SIZES = {
  sm: { track: "h-5 w-9", thumb: "h-4 w-4", on: "translate-x-4 rtl:-translate-x-4" },
  md: { track: "h-6 w-11", thumb: "h-5 w-5", on: "translate-x-5 rtl:-translate-x-5" },
  lg: { track: "h-8 w-14", thumb: "h-7 w-7", on: "translate-x-6 rtl:-translate-x-6" },
};

type SwitchProps = {
  label: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  size?: keyof typeof SW_SIZES;
  onChange?: (checked: boolean) => void;
};

export function Switch({ label, defaultChecked = false, disabled = false, size = "md", onChange }: SwitchProps) {
  const id = useId();
  const [on, setOn] = useState(defaultChecked);
  const s = SW_SIZES[size];
  return (
    <label htmlFor={id} className={"flex min-h-[44px] items-center gap-3 " + (disabled ? "cursor-not-allowed" : "cursor-pointer")}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={on}
        disabled={disabled}
        onChange={(e) => {
          setOn(e.target.checked);
          onChange?.(e.target.checked);
        }}
      />
      <span
        aria-hidden="true"
        className={"inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 motion-reduce:transition-none peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600 peer-focus-visible:ring-offset-2 peer-disabled:opacity-50 " + s.track + " " + (on ? "bg-emerald-700" : "bg-stone-400")}
      >
        <span className={"rounded-full bg-white shadow transition-transform duration-200 motion-reduce:transition-none " + s.thumb + " " + (on ? s.on : "translate-x-0")} />
      </span>
      <span className="text-[15px] text-stone-900 peer-disabled:text-stone-500">{label}</span>
    </label>
  );
}

// Usage
// <Switch label="Email alerts" defaultChecked />
// <Switch label="Sync over mobile data" size="sm" onChange={(on) => savePreference(on)} />
// <Switch label="Beta features" disabled />
`;

/* ---------- reference ---------- */
const REF: [string, string][] = [
  ["role=\"switch\" on a checkbox", "The input keeps its checkbox behaviour (Space toggles it, it submits with a form) while assistive technology reports a switch that is on or off. Leave aria-checked off: the checked state already comes from the input."],
  ["The label is the click target", "Wrapping the input, track and text in one label element makes the words and the drawn track toggle the input, and gives the switch its accessible name."],
  ["Focus ring on the track", "The input is visually hidden, so .input:focus-visible + .track draws the ring where people are looking. Never remove it without a replacement."],
  ["disabled", "A disabled input cannot be focused or changed and is left out of form submission. The snippets dim the track and the text so the state is visible too."],
  ["Right to left", "The thumb is placed with inset-inline-start and moved by a --dir custom property that flips to -1 under dir=\"rtl\", so one stylesheet serves both directions."],
  ["Switch or checkbox", "Use a switch for a setting that takes effect at once, such as turning alerts on. Use a checkbox for a choice that is confirmed later with a Save or Submit button."],
];

type View = "styles" | "react" | "ref";

export default function CssToggleSwitchCollection() {
  const [view, setView] = useState<View>("styles");
  const [size, setSize] = useState("16px");
  const [disabled, setDisabled] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [announce, setAnnounce] = useState("");
  const opts = { disabled, rtl };
  const styleSheet = useMemo(() => SWITCHES.map((it, i) => sc(cssOf(it, size), `tsw${i}`)).join("\n"), [size]);
  const ring = "focus-visible:ring-emerald-700 focus-visible:ring-offset-white";
  const tool = (on: boolean) =>
    `inline-flex h-10 items-center rounded-lg px-3 text-[13px] font-medium transition-colors ${FOCUS} ${ring} ${on ? "bg-[#16181d] text-white" : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"}`;

  return (
    <section className="bg-white px-4 py-12 text-[#16181d] sm:px-8 sm:py-14" style={SECTION_FONT}>
      <style>{styleSheet}</style>
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">Checkbox · role=switch · no JavaScript</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">CSS toggle switches, built on a real checkbox</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-stone-600">
            Fifteen switch styles that differ in shape, not only colour. Each one is a native checkbox with role=switch inside its label, so clicking the words works, Space toggles it and forms submit it. Pick a size, try the disabled look and flip the page to right to left; the code you copy follows those choices.
          </p>
        </header>

        <div className="mt-7 flex flex-col gap-3 border-y border-stone-200 py-4 lg:flex-row lg:items-center lg:justify-between">
          <Views
            label="Choose what to show"
            ring={ring}
            value={view}
            onChange={setView}
            views={[
              ["styles", "Switch styles", SWITCHES.length],
              ["react", "React + Tailwind"],
              ["ref", "How it works"],
            ]}
          />
          {view === "styles" && (
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex gap-1.5" role="group" aria-label="Size">
                {SIZES.map(([k, label, px]) => (
                  <button key={k} type="button" aria-pressed={size === px} onClick={() => setSize(px)} className={tool(size === px)}>
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" aria-pressed={disabled} onClick={() => setDisabled(!disabled)} className={tool(disabled)}>
                Disabled
              </button>
              <button type="button" aria-pressed={rtl} onClick={() => setRtl(!rtl)} className={tool(rtl)}>
                Right to left
              </button>
            </div>
          )}
        </div>
        <p className="sr-only" aria-live="polite">{announce}</p>

        <div className="mt-6 h-[780px] overflow-y-auto overscroll-contain pr-1" tabIndex={0} aria-label="Toggle switch examples">
          {view === "styles" && (
            <ul className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SWITCHES.map((it, i) => (
                <Card
                  key={it.cls}
                  id={`tsw-${i}`}
                  name={it.name}
                  note={it.note}
                  code={codeOf(it, opts, size)}
                  copyLabel="HTML and CSS"
                  ring={ring}
                  onAnnounce={setAnnounce}
                  stageClass="grid h-28 place-items-center bg-stone-50 px-4"
                  stage={toReact(swTree(it, opts), `tsw${i}`)}
                />
              ))}
            </ul>
          )}

          {view === "react" && (
            <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-stone-600">Live</p>
                <div className="mt-3 divide-y divide-stone-200">
                  <Switch label="Email alerts" defaultChecked />
                  <Switch label="Sync over mobile data" size="sm" />
                  <Switch label="Large type" size="lg" defaultChecked />
                  <Switch label="Beta features" disabled />
                </div>
                <div dir="rtl" className="mt-4 rounded-xl border border-stone-200 bg-white px-4">
                  <Switch label="Right to left" defaultChecked />
                </div>
              </div>
              <CodeBlock id="tsw-react-code" code={REACT_CODE} label="Switch.tsx" ring={ring} onAnnounce={setAnnounce} />
            </div>
          )}

          {view === "ref" && (
            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full min-w-[560px] border-collapse text-left text-[13.5px]">
                <caption className="sr-only">What each part of the switch markup does</caption>
                <thead className="bg-stone-50">
                  <tr>
                    <th scope="col" className="w-56 px-4 py-3 font-semibold">Part</th>
                    <th scope="col" className="px-4 py-3 font-semibold">What it does</th>
                  </tr>
                </thead>
                <tbody>
                  {REF.map(([k, v]) => (
                    <tr key={k} className="border-t border-stone-200 align-top">
                      <th scope="row" className="px-4 py-3 font-semibold text-stone-900">{k}</th>
                      <td className="px-4 py-3 leading-relaxed text-stone-700">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
