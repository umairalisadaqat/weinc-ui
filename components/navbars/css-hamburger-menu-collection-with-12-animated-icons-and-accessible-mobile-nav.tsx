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

/* ---------- hamburger icons ---------- */
const OPEN = `.&[aria-expanded="true"]`;

const iconBase = (chrome: string, box = "width: 22px; height: 16px;") => `.& {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  min-width: 44px; height: 44px; padding: 0; border: 0; cursor: pointer;
  font: 600 14px/1 system-ui, sans-serif;
  -webkit-tap-highlight-color: transparent;
  ${chrome}
}
.&:focus-visible { outline: 2px solid #2563eb; outline-offset: 3px; }
.&__box { position: relative; display: block; ${box} }
.&__line {
  position: absolute; left: 0; width: 100%; height: 2px; border-radius: 2px;
  background: currentColor;
  transition: transform .3s cubic-bezier(.2, .7, .2, 1), opacity .2s;
}
.&__line:nth-child(1) { top: 0; }
.&__line:nth-child(2) { top: 7px; }
.&__line:nth-child(3) { top: 14px; }`;

const REDUCED = `@media (prefers-reduced-motion: reduce) {
  .&, .& * { transition-duration: .01ms !important; transition-delay: 0s !important; }
}`;

const cross = (o = OPEN) => `${o} .&__line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
${o} .&__line:nth-child(2) { opacity: 0; }
${o} .&__line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }`;

const INK = "background: #16181d; color: #fff; border-radius: 10px;";
const LIGHT = "background: #fff; color: #16181d; border-radius: 10px; box-shadow: inset 0 0 0 1px #d6d3d1;";
const ROUND = "background: #16181d; color: #fff; border-radius: 50%;";
const GHOST = "background: transparent; color: #16181d; border-radius: 10px;";
const TEAL = "background: #0f766e; color: #fff; border-radius: 12px;";
const BLUE = "background: #1d4ed8; color: #fff; border-radius: 999px;";
const PILL = "background: #fff; color: #16181d; border-radius: 999px; box-shadow: inset 0 0 0 1px #d6d3d1; padding: 0 16px 0 14px;";
const TINT = "background: #efedea; color: #16181d; border-radius: 8px;";

const ICON_JS = `  // Flips aria-expanded on click. The CSS draws the open state from that attribute.
  // In a real header, also add aria-controls="your-menu-id" and show that menu here.
  document.querySelectorAll(".&").forEach(function (button) {
    button.addEventListener("click", function () {
      var open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
    });
  });`;

function iconTree(lines = 3, text?: string): El {
  return h(
    "button",
    { class: "&", type: "button", "aria-expanded": "false", "aria-label": text ? undefined : "Menu" },
    h("span", { class: "&__box", "aria-hidden": "true" }, Array.from({ length: lines }, () => h("span", { class: "&__line" }))),
    text ? h("span", {}, text) : null,
  );
}

type Item = { name: string; cls: string; note: string; css: string; tree: El; js?: string; beh: "icon" | "menu" | "none"; demoOpen?: boolean };

const ICONS: Item[] = [
  { name: "Cross", cls: "menu-cross", note: "Top and bottom bars meet in an X", beh: "icon", js: ICON_JS, tree: iconTree(), css: `${iconBase(INK)}\n${cross()}\n${REDUCED}` },
  {
    name: "Spin", cls: "menu-spin", note: "The whole icon turns half a circle", beh: "icon", js: ICON_JS, tree: iconTree(),
    css: `${iconBase(ROUND)}\n.&__box { transition: transform .45s cubic-bezier(.2, .7, .2, 1); }\n${OPEN} .&__box { transform: rotate(180deg); }\n${cross()}\n${REDUCED}`,
  },
  {
    name: "Squeeze", cls: "menu-squeeze", note: "Bars gather in the middle, then turn", beh: "icon", js: ICON_JS, tree: iconTree(),
    css: `${iconBase(TEAL)}
.&__line { transition: top .16s .16s, transform .16s 0s, opacity 0s .16s; }
${OPEN} .&__line { transition: top .16s 0s, transform .16s .16s, opacity 0s .16s; }
${OPEN} .&__line:nth-child(1) { top: 7px; transform: rotate(45deg); }
${OPEN} .&__line:nth-child(2) { opacity: 0; }
${OPEN} .&__line:nth-child(3) { top: 7px; transform: rotate(-45deg); }
${REDUCED}`,
  },
  {
    name: "Arrow back", cls: "menu-arrow-back", note: "Folds into a left arrow for sub-menus", beh: "icon", js: ICON_JS, tree: iconTree(),
    css: `${iconBase(GHOST)}
.&:hover { background: #f0efec; }
.&__line { transform-origin: left center; }
${OPEN} .&__line:nth-child(1) { transform: translateY(7px) rotate(-40deg) scaleX(.55); }
${OPEN} .&__line:nth-child(3) { transform: translateY(-7px) rotate(40deg) scaleX(.55); }
${REDUCED}`,
  },
  {
    name: "Arrow forward", cls: "menu-arrow-forward", note: "Points right, for a panel that slides in", beh: "icon", js: ICON_JS, tree: iconTree(),
    css: `${iconBase(LIGHT)}
.&__line { transform-origin: right center; }
${OPEN} .&__line:nth-child(1) { transform: translateY(7px) rotate(40deg) scaleX(.55); }
${OPEN} .&__line:nth-child(3) { transform: translateY(-7px) rotate(-40deg) scaleX(.55); }
${REDUCED}`,
  },
  {
    name: "Collapse", cls: "menu-collapse", note: "All three bars stack into one line", beh: "icon", js: ICON_JS, tree: iconTree(),
    css: `${iconBase(INK.replace("10px", "6px"))}
.&__box { transition: transform .3s cubic-bezier(.2, .7, .2, 1); }
${OPEN} .&__box { transform: scaleX(.75); }
${OPEN} .&__line:nth-child(1) { transform: translateY(7px); }
${OPEN} .&__line:nth-child(3) { transform: translateY(-7px); }
${REDUCED}`,
  },
  {
    name: "Two bars with label", cls: "menu-two-bar", note: "Visible word, two bars that cross", beh: "icon", js: ICON_JS, tree: iconTree(2, "Menu"),
    css: `${iconBase(PILL, "width: 18px; height: 10px;")}
.&__line:nth-child(1) { top: 1px; }
.&__line:nth-child(2) { top: 7px; }
${OPEN} .&__line:nth-child(1) { transform: translateY(3px) rotate(45deg); }
${OPEN} .&__line:nth-child(2) { transform: translateY(-3px) rotate(-45deg); }
${REDUCED}`,
  },
  {
    name: "Uneven bars", cls: "menu-uneven", note: "Short bars grow to full width as they cross", beh: "icon", js: ICON_JS, tree: iconTree(),
    css: `${iconBase(TINT)}
.&__line { left: auto; right: 0; transition: transform .3s cubic-bezier(.2, .7, .2, 1), width .3s, opacity .2s; }
.&__line:nth-child(2) { width: 60%; }
.&__line:nth-child(3) { width: 80%; }
${OPEN} .&__line { width: 100%; }
${cross()}
${REDUCED}`,
  },
  {
    name: "Plus", cls: "menu-plus", note: "Turns into a plus for expanding panels", beh: "icon", js: ICON_JS, tree: iconTree(),
    css: `${iconBase(BLUE)}
.&__box { transition: transform .4s cubic-bezier(.2, .7, .2, 1); }
${OPEN} .&__box { transform: rotate(180deg) scale(.85); }
${OPEN} .&__line:nth-child(1) { transform: translateY(7px); }
${OPEN} .&__line:nth-child(2) { opacity: 0; }
${OPEN} .&__line:nth-child(3) { transform: translateY(-7px) rotate(90deg); }
${REDUCED}`,
  },
  {
    name: "Ring", cls: "menu-ring", note: "A circle draws in around a smaller X", beh: "icon", js: ICON_JS, tree: iconTree(),
    css: `${iconBase(GHOST.replace("10px", "50%"))}
.& { position: relative; }
.&::before {
  content: ""; position: absolute; inset: 3px; border-radius: 50%;
  border: 2px solid currentColor; opacity: 0; transform: scale(.6);
  transition: transform .35s cubic-bezier(.2, .7, .2, 1), opacity .25s;
}
.&__box { transition: transform .35s cubic-bezier(.2, .7, .2, 1); }
${OPEN}::before { opacity: 1; transform: none; }
${OPEN} .&__box { transform: scale(.72); }
${cross()}
${REDUCED}`,
  },
  {
    name: "Elastic", cls: "menu-elastic", note: "Middle bar slides out, the rest overshoot", beh: "icon", js: ICON_JS, tree: iconTree(),
    css: `${iconBase(INK)}
.& { overflow: hidden; }
.&__line { transition: transform .5s cubic-bezier(.68, -.55, .27, 1.55), opacity .3s; }
${OPEN} .&__line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
${OPEN} .&__line:nth-child(2) { transform: translateX(24px); opacity: 0; }
${OPEN} .&__line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
${REDUCED}`,
  },
  {
    name: "Flip", cls: "menu-flip", note: "Tips over on its horizontal axis", beh: "icon", js: ICON_JS, tree: iconTree(),
    css: `${iconBase(LIGHT.replace("10px", "14px"))}
.& { perspective: 120px; }
.&__box { transition: transform .5s cubic-bezier(.2, .7, .2, 1); }
${OPEN} .&__box { transform: rotateX(180deg); }
${cross()}
${REDUCED}`,
  },
];

/* ---------- full mobile menus ---------- */
const MENU_JS = `  // Opens and closes the menu, keeps aria-expanded in step, closes on Escape.
  // With data-trap on the root, focus moves into the panel and Tab stays inside it.
  document.querySelectorAll(".&").forEach(function (root) {
    var toggle = root.querySelector("[aria-controls]");
    var panel = document.getElementById(toggle.getAttribute("aria-controls"));
    var trap = root.hasAttribute("data-trap");
    function setOpen(open, moveFocus) {
      toggle.setAttribute("aria-expanded", String(open));
      root.classList.toggle("is-open", open);
      if (!moveFocus) return;
      if (open) panel.querySelector("a, button").focus();
      else toggle.focus();
    }
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true", trap);
    });
    root.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", function () { setOpen(false, true); });
    });
    root.addEventListener("keydown", function (event) {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (event.key === "Escape") { setOpen(false, true); return; }
      if (event.key !== "Tab" || !trap) return;
      var items = panel.querySelectorAll("a, button");
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey ? document.activeElement === first : document.activeElement === last) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    });
  });`;

const LINKS = ["Work", "Services", "Studio", "Journal", "Contact"];

const menuBase = `/* The demo sits in a 420px frame. On a real page, make the panel and scrim position: fixed. */
.& { position: relative; height: 420px; overflow: hidden; background: #fafaf9; color: #16181d; font: 15px/1.5 system-ui, sans-serif; }
.& a { color: inherit; text-decoration: none; }
.& a:focus-visible, .& button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.&__bar { position: relative; z-index: 3; display: flex; align-items: center; justify-content: space-between; height: 60px; padding: 0 8px 0 18px; background: #fff; border-bottom: 1px solid #e7e5e4; }
.&__brand { font-weight: 650; letter-spacing: -.01em; border-radius: 6px; }
.&__toggle { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 10px; background: transparent; color: #16181d; cursor: pointer; }
.&__box { position: relative; display: block; width: 22px; height: 16px; }
.&__line { position: absolute; left: 0; width: 100%; height: 2px; border-radius: 2px; background: currentColor; transition: transform .3s cubic-bezier(.2, .7, .2, 1), opacity .2s; }
.&__line:nth-child(1) { top: 0; }
.&__line:nth-child(2) { top: 7px; }
.&__line:nth-child(3) { top: 14px; }
.&__page { padding: 24px 18px; }
.&__page p { margin: 0; color: #57534e; }
.&__page p:first-child { margin-bottom: 10px; color: #16181d; font-size: 25px; line-height: 1.15; font-weight: 650; letter-spacing: -.02em; }`;

const page = () =>
  h("div", { class: "&__page" }, h("p", {}, "Fitted kitchens and joinery, drawn and built in one workshop."), h("p", {}, "Book a site visit and we will measure up within the week."));

const lines3 = () => h("span", { class: "&__box", "aria-hidden": "true" }, h("span", { class: "&__line" }), h("span", { class: "&__line" }), h("span", { class: "&__line" }));
const closeSvg = () =>
  h("svg", { viewBox: "0 0 24 24", width: "20", height: "20", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "aria-hidden": "true" }, h("path", { d: "M6 6l12 12M18 6L6 18" }));
const linkList = (cls: string) => h("ul", { class: cls }, LINKS.map((l, i) => h("li", {}, h("a", { href: "#", "aria-current": i === 0 ? "page" : undefined }, l))));

const MENUS: Item[] = [
  {
    name: "Slide-in drawer",
    cls: "nav-drawer",
    note: "JavaScript, aria-expanded, focus trap, Escape",
    beh: "menu",
    demoOpen: true,
    js: MENU_JS,
    tree: h(
      "div",
      { class: "&", "data-trap": "" },
      h("header", { class: "&__bar" }, h("a", { class: "&__brand", href: "#" }, "Fernbrook Studio"), h("button", { class: "&__toggle", type: "button", "aria-expanded": "false", "aria-controls": "&-panel", "aria-label": "Menu" }, lines3())),
      page(),
      h("div", { class: "&__scrim", "data-close": "" }),
      h(
        "nav",
        { class: "&__panel", id: "&-panel", "aria-label": "Main" },
        h("button", { class: "&__close", type: "button", "data-close": "", "aria-label": "Close menu" }, closeSvg()),
        linkList("&__links"),
        h("a", { class: "&__cta", href: "#" }, "Start a project"),
      ),
    ),
    css: `${menuBase}
.&__scrim { position: absolute; inset: 0; z-index: 4; background: rgba(12, 10, 9, .42); opacity: 0; visibility: hidden; transition: opacity .3s, visibility 0s .3s; }
.&__panel { position: absolute; top: 0; right: 0; bottom: 0; z-index: 5; display: flex; flex-direction: column; width: min(300px, 84%); padding: 10px 16px 18px; background: #fff; box-shadow: -18px 0 40px -20px rgba(0, 0, 0, .35); transform: translateX(100%); visibility: hidden; transition: transform .35s cubic-bezier(.2, .7, .2, 1), visibility 0s .35s; }
.&.is-open .&__scrim { opacity: 1; visibility: visible; transition: opacity .3s; }
.&.is-open .&__panel { transform: none; visibility: visible; transition: transform .35s cubic-bezier(.2, .7, .2, 1); }
.&.is-open .&__line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.&.is-open .&__line:nth-child(2) { opacity: 0; }
.&.is-open .&__line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
.&__close { align-self: flex-end; display: grid; place-items: center; width: 44px; height: 44px; border: 0; border-radius: 10px; background: #f5f5f4; color: #16181d; cursor: pointer; }
.&__links { list-style: none; margin: 8px 0 0; padding: 0; }
.&__links a { display: block; padding: 10px 10px; border-radius: 8px; font-size: 18px; font-weight: 550; }
.&__links a:hover { background: #f5f5f4; }
.&__links a[aria-current="page"] { color: #0f766e; }
.&__cta { margin-top: auto; padding: 12px 16px; border-radius: 10px; background: #0f766e; color: #fff !important; text-align: center; font-weight: 600; }
${REDUCED}`,
  },
  {
    name: "Dropdown panel",
    cls: "nav-dropdown",
    note: "JavaScript, aria-expanded, Escape returns focus",
    beh: "menu",
    demoOpen: true,
    js: MENU_JS,
    tree: h(
      "div",
      { class: "&" },
      h("header", { class: "&__bar" }, h("a", { class: "&__brand", href: "#" }, "Fernbrook Studio"), h("button", { class: "&__toggle", type: "button", "aria-expanded": "false", "aria-controls": "&-panel", "aria-label": "Menu" }, lines3())),
      h(
        "nav",
        { class: "&__panel", id: "&-panel", "aria-label": "Main" },
        linkList("&__links"),
        h("div", { class: "&__actions" }, h("a", { href: "#" }, "Sign in"), h("a", { href: "#" }, "Get a quote")),
      ),
      page(),
    ),
    css: `${menuBase}
.&__panel { position: absolute; top: 60px; left: 0; right: 0; z-index: 2; padding: 6px 14px 16px; background: #fff; border-bottom: 1px solid #e7e5e4; box-shadow: 0 30px 40px -28px rgba(0, 0, 0, .35); opacity: 0; transform: translateY(-10px); visibility: hidden; transition: opacity .2s, transform .25s cubic-bezier(.2, .7, .2, 1), visibility 0s .25s; }
.&.is-open .&__panel { opacity: 1; transform: none; visibility: visible; transition: opacity .2s, transform .25s cubic-bezier(.2, .7, .2, 1); }
.&.is-open .&__line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.&.is-open .&__line:nth-child(2) { opacity: 0; }
.&.is-open .&__line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
.&__links { list-style: none; margin: 0; padding: 0; }
.&__links li + li { border-top: 1px solid #f0efec; }
.&__links a { display: flex; align-items: center; min-height: 46px; padding: 0 4px; font-weight: 550; }
.&__links a[aria-current="page"] { color: #1d4ed8; }
.&__actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
.&__actions a { display: grid; place-items: center; height: 44px; border-radius: 10px; font-weight: 600; box-shadow: inset 0 0 0 1px #d6d3d1; }
.&__actions a + a { background: #16181d; color: #fff; box-shadow: none; }
${REDUCED}`,
  },
  {
    name: "Pure CSS overlay",
    cls: "nav-css",
    note: "No JavaScript: a hidden checkbox and a label",
    beh: "none",
    tree: h(
      "div",
      { class: "&" },
      h("input", { class: "&__check", type: "checkbox", id: "&-check" }),
      h(
        "header",
        { class: "&__bar" },
        h("a", { class: "&__brand", href: "#" }, "Fernbrook Studio"),
        h("label", { class: "&__toggle", for: "&-check" }, h("span", { class: "&__sr" }, "Menu"), lines3()),
      ),
      h("nav", { class: "&__panel", "aria-label": "Main" }, linkList("&__links")),
      page(),
    ),
    css: `${menuBase}
.&__check { position: absolute; top: 8px; right: 8px; z-index: 6; width: 44px; height: 44px; margin: 0; opacity: 0; cursor: pointer; }
.&__check:focus-visible ~ .&__bar .&__toggle { outline: 2px solid #2563eb; outline-offset: 2px; }
.&__check:checked ~ .&__bar { background: #16181d; color: #fff; border-color: #16181d; }
.&__check:checked ~ .&__bar .&__toggle { color: #fff; }
.&__check:checked ~ .&__bar .&__line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.&__check:checked ~ .&__bar .&__line:nth-child(2) { opacity: 0; }
.&__check:checked ~ .&__bar .&__line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
.&__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.&__panel { position: absolute; inset: 60px 0 0; z-index: 2; padding: 12px 18px; background: #16181d; color: #fff; clip-path: inset(0 0 100% 0); visibility: hidden; transition: clip-path .4s cubic-bezier(.2, .7, .2, 1), visibility 0s .4s; }
.&__check:checked ~ .&__panel { clip-path: inset(0); visibility: visible; transition: clip-path .4s cubic-bezier(.2, .7, .2, 1); }
.&__links { list-style: none; margin: 0; padding: 0; }
.&__links li { opacity: 0; transform: translateY(10px); transition: opacity .3s, transform .3s; border-bottom: 1px solid rgba(255, 255, 255, .12); }
.&__check:checked ~ .&__panel li { opacity: 1; transform: none; }
.&__check:checked ~ .&__panel li:nth-child(2) { transition-delay: .05s; }
.&__check:checked ~ .&__panel li:nth-child(3) { transition-delay: .1s; }
.&__check:checked ~ .&__panel li:nth-child(4) { transition-delay: .15s; }
.&__check:checked ~ .&__panel li:nth-child(5) { transition-delay: .2s; }
.&__links a { display: block; padding: 12px 0; font-size: 26px; font-weight: 600; letter-spacing: -.02em; }
.&__links a[aria-current="page"] { color: #5eead4; }
${REDUCED}`,
  },
];

const ALL: Item[] = [...ICONS, ...MENUS];
const nameOf = (i: number) => `hbx${i}`;
const codeFor = (it: Item) =>
  `<!-- ${it.name} -->\n${toHtml(it.tree, it.cls)}\n\n<style>\n${sc(it.css, it.cls)}\n</style>\n` + (it.js ? `\n<script>\n${sc(it.js, it.cls)}\n</script>\n` : "");

/* ---------- the same behaviour inside the preview ---------- */
function attachIcon(button: HTMLElement): () => void {
  const onClick = () => button.setAttribute("aria-expanded", String(button.getAttribute("aria-expanded") !== "true"));
  button.addEventListener("click", onClick);
  return () => button.removeEventListener("click", onClick);
}

function attachMenu(root: HTMLElement, demoOpen: boolean): () => void {
  const toggle = root.querySelector<HTMLElement>("[aria-controls]");
  const panel = toggle ? root.querySelector<HTMLElement>(`#${toggle.getAttribute("aria-controls")}`) : null;
  if (!toggle || !panel) return () => undefined;
  const trap = root.hasAttribute("data-trap");
  const setOpen = (open: boolean, moveFocus: boolean) => {
    toggle.setAttribute("aria-expanded", String(open));
    root.classList.toggle("is-open", open);
    if (!moveFocus) return;
    if (open) panel.querySelector<HTMLElement>("a, button")?.focus();
    else toggle.focus();
  };
  const onToggle = () => setOpen(toggle.getAttribute("aria-expanded") !== "true", trap);
  const onClose = () => setOpen(false, true);
  const onKey = (event: KeyboardEvent) => {
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    if (event.key === "Escape") {
      setOpen(false, true);
      return;
    }
    if (event.key !== "Tab" || !trap) return;
    const items = panel.querySelectorAll<HTMLElement>("a, button");
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey ? document.activeElement === first : document.activeElement === last) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  };
  const closers = Array.from(root.querySelectorAll<HTMLElement>("[data-close]"));
  toggle.addEventListener("click", onToggle);
  closers.forEach((el) => el.addEventListener("click", onClose));
  root.addEventListener("keydown", onKey);
  if (demoOpen) setOpen(true, false);
  return () => {
    toggle.removeEventListener("click", onToggle);
    closers.forEach((el) => el.removeEventListener("click", onClose));
    root.removeEventListener("keydown", onKey);
  };
}

/* ---------- React + Tailwind version (the code below is this exact component) ---------- */
const NAV_LINKS = ["Work", "Services", "Studio", "Journal", "Contact"];

function MobileNav() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = panelRef.current.querySelectorAll<HTMLElement>("a, button");
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  const bar = "absolute left-0 h-0.5 w-full rounded bg-current transition duration-300 motion-reduce:transition-none";

  return (
    <header className="relative flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4">
      <a href="#" className="rounded text-[15px] font-semibold text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
        Fernbrook Studio
      </a>
      <button
        ref={toggleRef}
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(!open)}
        className="grid h-11 w-11 place-items-center rounded-lg bg-stone-900 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
      >
        <span aria-hidden="true" className="relative block h-4 w-[22px]">
          <span className={bar + " top-0 " + (open ? "translate-y-[7px] rotate-45" : "")} />
          <span className={bar + " top-[7px] " + (open ? "opacity-0" : "")} />
          <span className={bar + " top-[14px] " + (open ? "-translate-y-[7px] -rotate-45" : "")} />
        </span>
      </button>
      <div
        onClick={close}
        className={"fixed inset-0 z-40 bg-stone-950/40 transition-opacity duration-300 motion-reduce:transition-none " + (open ? "opacity-100" : "pointer-events-none opacity-0")}
      />
      <nav
        ref={panelRef}
        id="mobile-nav"
        aria-label="Main"
        className={"fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85%] flex-col bg-white p-4 shadow-2xl transition-[transform,visibility] duration-300 motion-reduce:transition-none " + (open ? "visible translate-x-0" : "invisible translate-x-full")}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close menu"
          className="grid h-11 w-11 place-items-center self-end rounded-lg bg-stone-100 text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <ul className="mt-2">
          {NAV_LINKS.map((label, i) => (
            <li key={label}>
              <a
                href="#"
                aria-current={i === 0 ? "page" : undefined}
                className="block rounded-lg px-3 py-2.5 text-[17px] font-medium text-stone-800 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 aria-[current=page]:text-teal-700"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <a href="#" className="mt-auto rounded-lg bg-teal-700 px-4 py-3 text-center font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
          Start a project
        </a>
      </nav>
    </header>
  );
}

const REACT_CODE = `import { useEffect, useRef, useState } from "react";

const NAV_LINKS = ["Work", "Services", "Studio", "Journal", "Contact"];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = panelRef.current.querySelectorAll<HTMLElement>("a, button");
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  const bar = "absolute left-0 h-0.5 w-full rounded bg-current transition duration-300 motion-reduce:transition-none";

  return (
    <header className="relative flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4">
      <a href="#" className="rounded text-[15px] font-semibold text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
        Fernbrook Studio
      </a>
      <button
        ref={toggleRef}
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(!open)}
        className="grid h-11 w-11 place-items-center rounded-lg bg-stone-900 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
      >
        <span aria-hidden="true" className="relative block h-4 w-[22px]">
          <span className={bar + " top-0 " + (open ? "translate-y-[7px] rotate-45" : "")} />
          <span className={bar + " top-[7px] " + (open ? "opacity-0" : "")} />
          <span className={bar + " top-[14px] " + (open ? "-translate-y-[7px] -rotate-45" : "")} />
        </span>
      </button>
      <div
        onClick={close}
        className={"fixed inset-0 z-40 bg-stone-950/40 transition-opacity duration-300 motion-reduce:transition-none " + (open ? "opacity-100" : "pointer-events-none opacity-0")}
      />
      <nav
        ref={panelRef}
        id="mobile-nav"
        aria-label="Main"
        className={"fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85%] flex-col bg-white p-4 shadow-2xl transition-[transform,visibility] duration-300 motion-reduce:transition-none " + (open ? "visible translate-x-0" : "invisible translate-x-full")}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close menu"
          className="grid h-11 w-11 place-items-center self-end rounded-lg bg-stone-100 text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <ul className="mt-2">
          {NAV_LINKS.map((label, i) => (
            <li key={label}>
              <a
                href="#"
                aria-current={i === 0 ? "page" : undefined}
                className="block rounded-lg px-3 py-2.5 text-[17px] font-medium text-stone-800 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 aria-[current=page]:text-teal-700"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <a href="#" className="mt-auto rounded-lg bg-teal-700 px-4 py-3 text-center font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
          Start a project
        </a>
      </nav>
    </header>
  );
}
`;

/* ---------- reference ---------- */
const REF: [string, string, string, string][] = [
  ["Checkbox and label", "No", "A checkbox named Menu, checked or not checked", "Space toggles it. Escape does nothing and focus is not managed."],
  ["Button with aria-expanded", "A few lines", "A button named Menu, expanded or collapsed", "Enter and Space toggle it. You add Escape and outside click."],
  ["Drawer with focus trap", "Yes", "Expanded state, then focus lands on the first item in the panel", "Tab cycles inside the panel, Escape closes and focus returns to the button."],
];

type View = "icons" | "menus" | "react" | "ref";

export default function CssHamburgerMenuCollection() {
  const [view, setView] = useState<View>("icons");
  const [announce, setAnnounce] = useState("");
  const gridRef = useRef<HTMLUListElement>(null);
  const reduce = useRef(false);
  const styleSheet = useMemo(() => ALL.map((it, i) => sc(it.css, nameOf(i))).join("\n"), []);
  const codes = useMemo(() => ALL.map(codeFor), []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const offs: (() => void)[] = [];
    ALL.forEach((it, i) => {
      const el = grid.querySelector<HTMLElement>(`.${nameOf(i)}`);
      if (!el) return;
      if (it.beh === "icon") offs.push(attachIcon(el));
      if (it.beh === "menu") offs.push(attachMenu(el, !!it.demoOpen));
    });
    // A gentle demo: the icons open and close on their own until someone touches one.
    let timer: ReturnType<typeof setInterval> | null = null;
    reduce.current = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (view === "icons" && !reduce.current) {
      let open = false;
      timer = setInterval(() => {
        open = !open;
        grid.querySelectorAll<HTMLElement>("button[aria-label='Menu'], button[aria-expanded]").forEach((b) => {
          if (b.closest("[data-icon]")) b.setAttribute("aria-expanded", String(open));
        });
      }, 1300);
      const stop = () => {
        if (timer) clearInterval(timer);
        timer = null;
      };
      grid.addEventListener("pointerdown", stop);
      grid.addEventListener("keydown", stop);
      offs.push(() => {
        grid.removeEventListener("pointerdown", stop);
        grid.removeEventListener("keydown", stop);
      });
    }
    return () => {
      if (timer) clearInterval(timer);
      offs.forEach((f) => f());
    };
  }, [view]);

  const ring = "focus-visible:ring-teal-700 focus-visible:ring-offset-[#f7f6f3]";
  const list = view === "icons" ? ICONS.map((it, i) => ({ it, i })) : MENUS.map((it, k) => ({ it, i: ICONS.length + k }));

  return (
    <section className="bg-[#f7f6f3] px-4 py-12 text-[#16181d] sm:px-8 sm:py-14" style={SECTION_FONT}>
      <style>{styleSheet}</style>
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">HTML · CSS · React and Tailwind</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">CSS hamburger menus that open a real menu</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-stone-600">
            Twelve animated menu icons, three complete phone menus and a React version. Each icon is a button whose aria-expanded value drives the animation, so the state you see is the state a screen reader hears. Press any icon to try it.
          </p>
        </header>

        <div className="mt-7 border-y border-stone-300/70 py-4">
          <Views
            label="Choose what to show"
            ring={ring}
            value={view}
            onChange={setView}
            views={[
              ["icons", "Animated icons", ICONS.length],
              ["menus", "Mobile menus", MENUS.length],
              ["react", "React + Tailwind"],
              ["ref", "Which to use"],
            ]}
          />
        </div>
        <p className="sr-only" aria-live="polite">{announce}</p>

        <div className="mt-6 h-[700px] overflow-y-auto overscroll-contain pr-1" tabIndex={0} aria-label="Hamburger menu examples">
          {(view === "icons" || view === "menus") && (
            <ul ref={gridRef} className={`grid items-start gap-3 ${view === "icons" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
              {list.map(({ it, i }) => (
                <Card
                  key={i}
                  id={`hb-${i}`}
                  name={it.name}
                  note={it.note}
                  code={codes[i]}
                  copyLabel={it.js ? "HTML, CSS, JS" : "HTML and CSS"}
                  ring={ring}
                  onAnnounce={setAnnounce}
                  stageClass={view === "icons" ? "grid h-28 place-items-center bg-white sm:h-36" : "bg-stone-100 p-3"}
                  stage={
                    view === "icons" ? (
                      <div data-icon="">{toReact(it.tree, nameOf(i))}</div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-stone-200">{toReact(it.tree, nameOf(i))}</div>
                    )
                  }
                />
              ))}
            </ul>
          )}

          {view === "react" && (
            <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
              <div>
                <div className="relative h-[460px] overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 [transform:translateZ(0)]">
                  <MobileNav />
                  <div className="p-5">
                    <p className="text-[24px] font-semibold leading-tight tracking-[-0.02em]">Fitted kitchens and joinery, drawn and built in one workshop.</p>
                    <p className="mt-2 text-[15px] text-stone-600">Press the menu button. Tab stays inside the drawer and Escape closes it.</p>
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-stone-600">
                  The drawer and scrim use position fixed. This preview frame has a transform on it, which makes fixed elements stay inside the frame; on your page they cover the screen.
                </p>
              </div>
              <CodeBlock id="hb-react-code" code={REACT_CODE} label="MobileNav.tsx" ring={ring} onAnnounce={setAnnounce} />
            </div>
          )}

          {view === "ref" && (
            <div className="space-y-6">
              <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
                <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
                  <caption className="sr-only">How the three menu techniques compare</caption>
                  <thead className="bg-stone-50 text-stone-900">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Technique</th>
                      <th scope="col" className="px-4 py-3 font-semibold">JavaScript</th>
                      <th scope="col" className="px-4 py-3 font-semibold">What a screen reader hears</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Keyboard</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REF.map((r) => (
                      <tr key={r[0]} className="border-t border-stone-200 align-top">
                        <th scope="row" className="px-4 py-3 font-semibold text-stone-900">{r[0]}</th>
                        <td className="px-4 py-3 text-stone-700">{r[1]}</td>
                        <td className="px-4 py-3 text-stone-700">{r[2]}</td>
                        <td className="px-4 py-3 text-stone-700">{r[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["Name the button", "An icon has no text, so give the button aria-label=\"Menu\" and leave the label alone when it opens. The expanded state already tells people it is open."],
                  ["Hide what is closed", "A closed panel should use visibility: hidden or display: none, not just a transform. Otherwise its links stay in the tab order while nobody can see them."],
                  ["Respect reduced motion", "Every snippet ends with a prefers-reduced-motion rule that removes the transitions, so the icon and panel switch state at once."],
                ].map(([t, d]) => (
                  <div key={t} className="rounded-2xl border border-stone-200 bg-white p-5">
                    <h3 className="text-[15px] font-semibold">{t}</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-stone-600">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
