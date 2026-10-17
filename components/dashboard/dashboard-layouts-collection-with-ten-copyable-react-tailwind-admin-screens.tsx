import { createElement, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, SyntheticEvent } from "react";

/*
  Dashboard UI layouts.
  Every screen is built once as a small tree of elements and Tailwind classes, assembled from
  blocks (sidebar, KPI row, chart, side panel, table). The same tree renders the live preview,
  the React JSX you copy and the plain HTML you copy, for the whole screen or one block.
  Charts are inline SVG computed from the data arrays below.
*/

type Attrs = Record<string, string>;
type El = { t: string; c?: string; a?: Attrs; k: N[] };
type N = string | El;
type Kid = N | { $: Attrs } | null | false;

function h(t: string, c: string, ...kids: Kid[]): El {
  const el: El = { t, c: c || undefined, k: [] };
  for (const kid of kids) {
    if (kid === null || kid === false) continue;
    if (typeof kid === "object" && "$" in kid) el.a = { ...(el.a ?? {}), ...kid.$ };
    else el.k.push(kid);
  }
  return el;
}
const $ = (a: Attrs) => ({ $: a });

/* ---------- icons: plain 24px stroke drawings ---------- */
const ICONS = {
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M18 14a6 6 0 0 1 4 7",
  cart: "M3 4h2l2.5 11h11L21 7H6.2M9 20h.01M18 20h.01",
  box: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",
  wallet: "M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3zM3 7l12-4v4M16 14h.01",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .3-1.4-1.4L17 5l-3-1-1 2h-2L10 4 7 5l.4 2.3L6 8.7 4 8.4l-1 3 2 1v1l-2 1 1 3 2-.3 1.4 1.4L7 19l3 1 1-2h2l1 2 3-1-.4-2.3 1.4-1.4 2 .3 1-3-2-1z",
  inbox: "M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5",
  truck: "M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01",
  calendar: "M4 5h16v15H4zM4 10h16M9 3v4M15 3v4",
  megaphone: "M3 10v4h4l8 4V6l-8 4zM18 9a4 4 0 0 1 0 6",
  folder: "M3 6h6l2 2h10v11H3z",
  file: "M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6",
  pulse: "M3 12h4l2-5 4 10 2-5h6",
  map: "M9 4l6 2 6-2v14l-6 2-6-2-6 2V6zM9 4v14M15 6v14",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  download: "M12 4v11M7 10l5 5 5-5M4 20h16",
  plus: "M12 5v14M5 12h14",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4",
  code: "M8 7l-5 5 5 5M16 7l5 5-5 5",
  check: "M5 12.5l4.5 4.5L19 7",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z",
} as const;
type IconName = keyof typeof ICONS;
const SVG_A: Attrs = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" };
const ico = (n: IconName, c = "h-5 w-5") => h("svg", c, $(SVG_A), h("path", "", $({ d: ICONS[n] })));

/* ---------- themes ---------- */
type Th = {
  page: string; side: string; mob: string; brand: string; link: string; active: string; card: string;
  title: string; muted: string; line: string; divide: string; grid: string; track: string; thead: string;
  up: string; down: string; btn: string; btn2: string; input: string; ring: string; s: string[];
};
const LIGHT: Th = {
  page: "bg-slate-50 text-slate-900", side: "border-r border-slate-200 bg-white", mob: "border-b border-slate-200 bg-white",
  brand: "bg-indigo-600 text-white", link: "text-slate-600 hover:bg-slate-100 hover:text-slate-900", active: "bg-indigo-50 text-indigo-700",
  card: "rounded-xl border border-slate-200 bg-white", title: "text-slate-900", muted: "text-slate-600", line: "border-slate-200",
  divide: "divide-slate-100", grid: "text-slate-200", track: "text-slate-100", thead: "bg-slate-50 text-slate-600",
  up: "bg-emerald-50 text-emerald-700", down: "bg-rose-50 text-rose-700", btn: "bg-indigo-600 text-white hover:bg-indigo-700",
  btn2: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50", input: "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500",
  ring: "focus-visible:ring-indigo-600", s: ["text-indigo-600", "text-sky-400", "text-amber-500", "text-slate-300"],
};
const DARK: Th = {
  page: "bg-zinc-950 text-zinc-100", side: "border-r border-zinc-800 bg-zinc-900", mob: "border-b border-zinc-800 bg-zinc-900",
  brand: "bg-emerald-400 text-zinc-950", link: "text-zinc-400 hover:bg-zinc-800 hover:text-white", active: "bg-zinc-800 text-white",
  card: "rounded-xl border border-zinc-800 bg-zinc-900", title: "text-white", muted: "text-zinc-400", line: "border-zinc-800",
  divide: "divide-zinc-800", grid: "text-zinc-800", track: "text-zinc-800", thead: "bg-zinc-900 text-zinc-400",
  up: "bg-emerald-500/10 text-emerald-300", down: "bg-rose-500/10 text-rose-300", btn: "bg-emerald-400 text-zinc-950 hover:bg-emerald-300",
  btn2: "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800", input: "border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-400",
  ring: "focus-visible:ring-emerald-400", s: ["text-emerald-400", "text-sky-400", "text-amber-400", "text-zinc-600"],
};
const th = (base: Th, o: Partial<Th>): Th => ({ ...base, ...o });

/* ---------- config types ---------- */
type Series = { name: string; data: number[]; cls?: number };
type Chart =
  | { kind: "line"; labels: string[]; series: Series[]; area?: boolean; unit?: string }
  | { kind: "bars"; labels: string[]; series: Series[]; unit?: string }
  | { kind: "funnel"; items: [string, number, string][] };
type Panel =
  | { kind: "donut"; title: string; center: [string, string]; items: [string, number][] }
  | { kind: "meters"; title: string; items: [string, string, number][] }
  | { kind: "list"; title: string; items: [string, string, string][] };
type Table = { title: string; cols: string[]; rows: string[][]; num?: number[]; status?: number; badge: Record<string, string> };
type Cfg = {
  name: string; f: Family; brand: string; mark: string; nav: [string, IconName][]; rail?: boolean; dark?: boolean;
  title: string; sub: string; range: string; action: string;
  kpis: [string, string, string, boolean, string][];
  chartTitle: string; chartNote: string; chart: Chart; panel: Panel; table: Table; layout: "a" | "b"; th: Th;
};

/* ---------- block builders ---------- */
const fx = (t: Th) => `focus-visible:outline-none focus-visible:ring-2 ${t.ring}`;
const short = (v: number, unit = "") => {
  const s = v >= 1000000 ? `${+(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : `${v}`;
  return unit === "%" ? `${s}%` : `${unit}${s}`;
};
function niceMax(m: number) {
  const raw = m / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const step = ([1, 2, 2.5, 5, 10].find((x) => x * mag >= raw) ?? 10) * mag;
  return step * 4;
}
const r1 = (n: number) => String(Math.round(n * 10) / 10);

function brandRow(c: Cfg, t: Th) {
  return h("a", `flex items-center gap-2.5 rounded-lg ${fx(t)}`, $({ href: "#" }),
    h("span", `grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold ${t.brand}`, c.mark),
    c.rail ? null : h("span", `text-[15px] font-semibold tracking-tight ${t.title}`, c.brand));
}

function sidebar(c: Cfg, t: Th): El {
  const items = c.nav.map(([label, icon], i) =>
    h("li", "", h("a", `flex min-h-10 items-center gap-3 rounded-lg ${c.rail ? "justify-center px-2" : "px-3"} text-sm font-medium ${i === 0 ? t.active : t.link} ${fx(t)}`,
      $(i === 0 ? { href: "#", "aria-current": "page" } : { href: "#" }), ...(c.rail ? [{ $: { "aria-label": label } }, ico(icon)] : [ico(icon, "h-[18px] w-[18px] shrink-0"), label]))));
  return h("aside", `hidden shrink-0 flex-col gap-6 p-4 lg:flex ${c.rail ? "w-[72px] items-center" : "w-60"} ${t.side}`,
    brandRow(c, t),
    h("nav", "flex-1", $({ "aria-label": "Main" }), h("ul", "space-y-1", ...items)),
    h("a", `flex min-h-10 items-center gap-3 rounded-lg ${c.rail ? "justify-center px-2" : "px-3"} text-sm font-medium ${t.link} ${fx(t)}`, $(c.rail ? { href: "#", "aria-label": "Settings" } : { href: "#" }), ico("settings", "h-[18px] w-[18px] shrink-0"), c.rail ? null : "Settings"));
}

function mobileBar(c: Cfg, t: Th): El {
  return h("div", `lg:hidden ${t.mob}`,
    h("div", "flex items-center justify-between px-4 pt-3",
      brandRow({ ...c, rail: false }, t),
      h("a", `grid h-10 w-10 place-items-center rounded-lg ${t.link} ${fx(t)}`, $({ href: "#", "aria-label": "Notifications" }), ico("bell"))),
    h("nav", "", $({ "aria-label": "Main mobile" }),
      h("ul", "flex gap-1 overflow-x-auto px-3 py-2",
        ...c.nav.map(([label], i) => h("li", "shrink-0", h("a", `inline-flex min-h-10 items-center whitespace-nowrap rounded-lg px-3 text-sm font-medium ${i === 0 ? t.active : t.link} ${fx(t)}`, $(i === 0 ? { href: "#", "aria-current": "page" } : { href: "#" }), label))))));
}

function header(c: Cfg, t: Th, id: string): El {
  return h("div", "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
    h("div", "", h("h2", `text-2xl font-semibold tracking-tight ${t.title}`, c.title), h("p", `mt-1 text-sm ${t.muted}`, c.sub)),
    h("div", "flex flex-wrap items-center gap-2",
      h("div", "relative w-full sm:w-56",
        h("label", "sr-only", $({ for: id }), "Search"),
        ico("search", `pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${t.muted}`),
        h("input", `h-10 w-full rounded-lg border pl-9 pr-3 text-sm ${t.input} focus:outline-none ${fx(t)}`, $({ id, type: "search", placeholder: "Search" }))),
      h("button", `inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium ${t.btn2} ${fx(t)}`, $({ type: "button" }), ico("calendar", "h-4 w-4"), c.range),
      h("button", `inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${t.btn} ${fx(t)}`, $({ type: "button" }), ico(c.action === "Export" ? "download" : "plus", "h-4 w-4"), c.action)));
}

function kpis(c: Cfg, t: Th): El {
  return h("ul", "grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4",
    ...c.kpis.map(([label, value, delta, good, note]) =>
      h("li", `${t.card} p-4`,
        h("p", `text-xs font-medium ${t.muted}`, label),
        h("p", `mt-2 text-2xl font-semibold tabular-nums tracking-tight ${t.title}`, value),
        h("p", "mt-2 flex flex-wrap items-center gap-1.5 text-xs",
          h("span", `rounded-md px-1.5 py-0.5 font-semibold tabular-nums ${good ? t.up : t.down}`, delta),
          h("span", t.muted, note)))));
}

function legend(series: Series[], t: Th): El {
  return h("ul", `flex flex-wrap gap-4 text-xs ${t.muted}`, ...series.map((s, i) =>
    h("li", "flex items-center gap-1.5", h("span", `h-2 w-2 rounded-full bg-current ${t.s[s.cls ?? i]}`), s.name)));
}

const W = 600;
const H = 200;
function axis(max: number, labels: string[], unit: string | undefined, t: Th, svg: El): El {
  const ticks = [4, 3, 2, 1, 0].map((p) => short((max / 4) * p, unit));
  return h("div", "mt-4",
    h("div", "flex gap-3",
      h("div", `flex h-48 w-10 shrink-0 flex-col justify-between text-right text-[11px] tabular-nums ${t.muted}`, ...ticks.map((x) => h("span", "-my-1.5", x))),
      h("div", "min-w-0 flex-1", svg)),
    h("div", `ml-[52px] mt-2 flex justify-between text-[11px] ${t.muted}`, ...labels.map((l, i) => h("span", `whitespace-nowrap ${labels.length > 6 && i % 2 ? "hidden sm:inline" : ""}`, l))));
}
function gridLines(t: Th): El {
  return h("g", t.grid, ...[0, 1, 2, 3, 4].map((i) => h("line", "", $({ x1: "0", x2: String(W), y1: String((H / 4) * i), y2: String((H / 4) * i), stroke: "currentColor", "stroke-width": "1", "vector-effect": "non-scaling-stroke" }))));
}

function chartSvg(ch: Chart, t: Th, summary: string): El {
  if (ch.kind === "funnel") {
    const top = ch.items[0][1];
    return h("ul", "mt-5 space-y-4", ...ch.items.map(([label, v, note], i) =>
      h("li", "", h("div", "flex items-baseline justify-between gap-3 text-sm",
        h("span", `font-medium ${t.title}`, label), h("span", `tabular-nums ${t.muted}`, note)),
        h("svg", "mt-2 h-3 w-full", $({ viewBox: "0 0 100 6", preserveAspectRatio: "none", role: "img", "aria-label": `${label}: ${note}` }),
          h("rect", t.track, $({ width: "100", height: "6", rx: "1.5", fill: "currentColor" })),
          h("rect", t.s[i === ch.items.length - 1 ? 1 : 0], $({ width: r1((v / top) * 100), height: "6", rx: "1.5", fill: "currentColor" }))))));
  }
  const max = niceMax(Math.max(...ch.series.flatMap((s) => s.data)));
  const y = (v: number) => r1(H - (v / max) * H);
  const n = ch.labels.length;
  const svgA = { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none", role: "img", "aria-label": summary };
  if (ch.kind === "line") {
    const x = (i: number) => r1((i / (ch.series[0].data.length - 1)) * W);
    const paths = ch.series.map((s, si) => {
      const pts = s.data.map((v, i) => `${x(i)},${y(v)}`);
      return h("g", t.s[s.cls ?? si],
        ch.area && si === 0 ? h("path", "", $({ d: `M0,${H} L${pts.join(" L")} L${W},${H} Z`, fill: "currentColor", opacity: "0.12" })) : null,
        h("polyline", "", $({ points: pts.join(" "), fill: "none", stroke: "currentColor", "stroke-width": si === 0 ? "2.5" : "2", "stroke-linejoin": "round", "vector-effect": "non-scaling-stroke", ...(si > 0 ? { "stroke-dasharray": "5 4" } : {}) })));
    });
    return axis(max, ch.labels, ch.unit, t, h("svg", "block h-48 w-full overflow-visible", $(svgA), gridLines(t), ...paths));
  }
  const gw = W / n;
  const k = ch.series.length;
  const bw = (gw * 0.62) / k;
  const groups = ch.series.map((s, si) => h("g", t.s[s.cls ?? si], ...s.data.map((v, i) =>
    h("rect", "", $({ x: r1(i * gw + gw * 0.19 + si * bw), y: y(v), width: r1(bw - (k > 1 ? 2 : 0)), height: r1(H - Number(y(v))), rx: "2", fill: "currentColor" })))));
  return axis(max, ch.labels, ch.unit, t, h("svg", "block h-48 w-full", $(svgA), gridLines(t), ...groups));
}

function chartCard(c: Cfg, t: Th, extra: string): El {
  const ch = c.chart;
  return h("section", `${t.card} p-5 ${extra}`, $({ "aria-label": c.chartTitle }),
    h("div", "flex flex-wrap items-start justify-between gap-3",
      h("div", "", h("h3", `text-sm font-semibold ${t.title}`, c.chartTitle), h("p", `mt-0.5 text-xs ${t.muted}`, c.chartNote)),
      ch.kind === "funnel" ? null : legend(ch.series, t)),
    chartSvg(ch, t, `${c.chartTitle}, ${c.chartNote}`));
}

function panelCard(c: Cfg, t: Th): El {
  const p = c.panel;
  let body: El;
  if (p.kind === "donut") {
    const total = p.items.reduce((a, [, v]) => a + v, 0);
    let cum = 0;
    const rings = p.items.map(([, v], i) => {
      const pct = (v / total) * 100;
      const el = h("circle", t.s[i], $({ cx: "21", cy: "21", r: "15.915", fill: "none", stroke: "currentColor", "stroke-width": "5", "stroke-dasharray": `${r1(pct - 0.8)} ${r1(100 - pct + 0.8)}`, "stroke-dashoffset": r1(25 - cum) }));
      cum += pct;
      return el;
    });
    body = h("div", "mt-4 flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row",
      h("div", "relative h-36 w-36 shrink-0",
        h("svg", "h-36 w-36", $({ viewBox: "0 0 42 42", role: "img", "aria-label": `${p.title}: ${p.items.map(([l, v]) => `${l} ${Math.round((v / total) * 100)}%`).join(", ")}` }),
          h("circle", t.track, $({ cx: "21", cy: "21", r: "15.915", fill: "none", stroke: "currentColor", "stroke-width": "5" })), ...rings),
        h("div", "absolute inset-0 grid place-content-center text-center",
          h("span", `text-xl font-semibold tabular-nums ${t.title}`, p.center[0]), h("span", `text-[11px] ${t.muted}`, p.center[1]))),
      h("ul", "w-full space-y-2.5 text-sm", ...p.items.map(([l, v], i) =>
        h("li", "flex items-center justify-between gap-3",
          h("span", `flex items-center gap-2 ${t.muted}`, h("span", `h-2.5 w-2.5 rounded-sm bg-current ${t.s[i]}`), l),
          h("span", `font-medium tabular-nums ${t.title}`, `${Math.round((v / total) * 100)}%`)))));
  } else if (p.kind === "meters") {
    body = h("ul", "mt-4 space-y-4", ...p.items.map(([l, v, pct]) =>
      h("li", "", h("div", "flex justify-between gap-3 text-sm", h("span", `truncate ${t.muted}`, l), h("span", `font-medium tabular-nums ${t.title}`, v)),
        h("svg", "mt-1.5 h-1.5 w-full", $({ viewBox: "0 0 100 4", preserveAspectRatio: "none", "aria-hidden": "true" }),
          h("rect", t.track, $({ width: "100", height: "4", rx: "2", fill: "currentColor" })),
          h("rect", t.s[pct > 90 ? 2 : 0], $({ width: String(pct), height: "4", rx: "2", fill: "currentColor" }))))));
  } else {
    body = h("ul", `mt-3 divide-y ${t.divide}`, ...p.items.map(([a, b, m]) =>
      h("li", "flex items-start justify-between gap-3 py-3",
        h("div", "min-w-0", h("p", `truncate text-sm font-medium ${t.title}`, a), h("p", `mt-0.5 truncate text-xs ${t.muted}`, b)),
        h("span", `shrink-0 text-xs tabular-nums ${t.muted}`, m))));
  }
  return h("section", `${t.card} p-5`, $({ "aria-label": p.title }), h("h3", `text-sm font-semibold ${t.title}`, p.title), body);
}

function tableCard(c: Cfg, t: Th, extra: string): El {
  const tb = c.table;
  const al = (i: number) => (tb.num?.includes(i) ? "text-right" : "text-left");
  return h("section", `${t.card} overflow-hidden ${extra}`, $({ "aria-label": tb.title }),
    h("div", `flex items-center justify-between gap-3 border-b px-5 py-4 ${t.line}`,
      h("h3", `text-sm font-semibold ${t.title}`, tb.title),
      h("a", `rounded text-sm font-medium ${t.muted} hover:underline ${fx(t)}`, $({ href: "#" }), "View all")),
    h("div", "overflow-x-auto",
      h("table", "w-full min-w-[600px] text-sm",
        h("thead", t.thead, h("tr", "", ...tb.cols.map((col, i) => h("th", `px-5 py-2.5 text-xs font-semibold uppercase tracking-wide ${al(i)}`, $({ scope: "col" }), col)))),
        h("tbody", `divide-y ${t.divide}`, ...tb.rows.map((row) => h("tr", "", ...row.map((cell, i) =>
          i === 0
            ? h("th", `whitespace-nowrap px-5 py-3 text-left font-medium ${t.title}`, $({ scope: "row" }), cell)
            : h("td", `whitespace-nowrap px-5 py-3 tabular-nums ${al(i)} ${t.muted}`,
              i === tb.status ? h("span", `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tb.badge[cell] ?? ""}`, cell) : cell))))))));
}

type Block = { name: string; nodes: El[] };
type Item = { f: Family; name: string; dark: boolean; node: El; blocks: Block[] };

function screen(c: Cfg, idx: number): Item {
  const t = c.th;
  const side = sidebar(c, t);
  const mob = mobileBar(c, t);
  const kp = kpis(c, t);
  const ch = chartCard(c, t, c.layout === "a" ? "lg:col-span-2" : "");
  const pn = panelCard(c, t);
  const tb = tableCard(c, t, c.layout === "b" ? "lg:col-span-2" : "");
  const body = c.layout === "a"
    ? [h("div", "grid gap-4 lg:grid-cols-3", ch, pn), tb]
    : [ch, h("div", "grid items-start gap-4 lg:grid-cols-3", tb, pn)];
  const node = h("div", `flex min-h-[760px] w-full ${t.page}`,
    side,
    h("div", "flex min-w-0 flex-1 flex-col", mob,
      h("main", "flex-1 space-y-5 p-4 sm:p-6 lg:p-8", header(c, t, `dash-${idx}-search`), kp, ...body)));
  return {
    f: c.f, name: c.name, dark: !!c.dark, node,
    blocks: [
      { name: "Sidebar", nodes: [side, mob] },
      { name: "KPI row", nodes: [kp] },
      { name: "Chart", nodes: [ch] },
      { name: c.panel.kind === "donut" ? "Donut panel" : "Side panel", nodes: [pn] },
      { name: "Table", nodes: [tb] },
    ],
  };
}

/* ---------- the ten screens ---------- */
const FAMILIES = { analytics: "Analytics", saas: "SaaS admin", commerce: "Ecommerce", sales: "CRM", finance: "Finance", ops: "Operations", health: "Healthcare", marketing: "Marketing" };
type Family = keyof typeof FAMILIES;
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LB = (good: string, mid: string, bad: string, light = true) => light
  ? { [good]: "bg-emerald-50 text-emerald-700", [mid]: "bg-amber-50 text-amber-800", [bad]: "bg-rose-50 text-rose-700" }
  : { [good]: "bg-emerald-500/15 text-emerald-300", [mid]: "bg-amber-500/15 text-amber-300", [bad]: "bg-rose-500/15 text-rose-300" };

const CFGS: Cfg[] = [
  {
    name: "Site analytics", f: "analytics", brand: "Fernhill Analytics", mark: "F", layout: "a", th: LIGHT,
    nav: [["Overview", "home"], ["Audience", "users"], ["Pages", "file"], ["Sources", "map"], ["Events", "pulse"]],
    title: "Traffic overview", sub: "fernhillgardens.example, last 30 days", range: "Sep 13 to Oct 12", action: "Export",
    kpis: [["Visitors", "48,210", "+12.4%", true, "vs prior 30 days"], ["Sessions", "71,935", "+8.1%", true, "1.49 per visitor"], ["Bounce rate", "41.2%", "+2.3 pts", false, "watch blog pages"], ["Avg. time on site", "2m 48s", "+14s", true, "longest on guides"]],
    chartTitle: "Visitors per week", chartNote: "This period against the previous one",
    chart: { kind: "line", area: true, labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7", "Wk 8"], series: [{ name: "This period", data: [8200, 9100, 8800, 10400, 11900, 11200, 12600, 13800] }, { name: "Previous", data: [7600, 8000, 8400, 8100, 9300, 9800, 9600, 10200], cls: 3 }] },
    panel: { kind: "meters", title: "Top pages", items: [["/guides/raised-beds", "9,412", 100], ["/shop/seed-kits", "6,880", 73], ["/blog/autumn-planting", "5,205", 55], ["/pricing", "3,118", 33], ["/about", "1,640", 17]] },
    table: { title: "Traffic sources", cols: ["Source", "Visitors", "Sessions", "Conv. rate", "Trend"], num: [1, 2, 3], status: 4, badge: LB("Rising", "Steady", "Falling"),
      rows: [["Organic search", "21,480", "30,102", "3.8%", "Rising"], ["Direct", "11,250", "17,940", "4.6%", "Steady"], ["Email newsletter", "6,930", "10,488", "6.1%", "Rising"], ["Social", "5,104", "8,210", "1.2%", "Falling"], ["Referral", "3,446", "5,195", "2.9%", "Steady"]] },
  },
  {
    name: "SaaS revenue admin", f: "saas", brand: "Quillstack", mark: "Q", layout: "b", dark: true, th: DARK,
    nav: [["Revenue", "chart"], ["Accounts", "users"], ["Plans", "wallet"], ["Invoices", "file"], ["Activity", "pulse"]],
    title: "Revenue", sub: "Subscription metrics, updated 5 minutes ago", range: "Last 12 months", action: "Export",
    kpis: [["Monthly recurring", "$84,320", "+6.2%", true, "vs September"], ["Active accounts", "1,286", "+41", true, "net new this month"], ["Logo churn", "1.9%", "+0.3 pts", false, "11 accounts lost"], ["Trial to paid", "23.5%", "+1.8 pts", true, "of 196 trials"]],
    chartTitle: "Monthly recurring revenue", chartNote: "Nov 2025 to Oct 2026, in US dollars",
    chart: { kind: "line", area: true, unit: "$", labels: ["Nov", "Jan", "Mar", "May", "Jul", "Sep"], series: [{ name: "MRR", data: [52100, 54800, 56900, 58200, 61500, 64900, 67300, 70100, 73800, 76600, 79400, 84320] }, { name: "Target", data: [52000, 54500, 57000, 59500, 62000, 64500, 67000, 69500, 72000, 74500, 77000, 79500], cls: 3 }] },
    panel: { kind: "donut", title: "Revenue by plan", center: ["$84k", "this month"], items: [["Team", 41], ["Business", 33], ["Starter", 18], ["Add-ons", 8]] },
    table: { title: "Newest accounts", cols: ["Account", "Plan", "Seats", "MRR", "Status"], num: [2, 3], status: 4, badge: LB("Active", "Trial", "Past due", false),
      rows: [["Harbor & Pine Legal", "Business", "24", "$1,176", "Active"], ["Kettle Row Bakery", "Starter", "3", "$57", "Trial"], ["Northbeam Studio", "Team", "11", "$319", "Active"], ["Osprey Freight Co.", "Business", "38", "$1,862", "Past due"], ["Lumen Dental Group", "Team", "9", "$261", "Active"]] },
  },
  {
    name: "Shop orders", f: "commerce", brand: "Saltmarsh Goods", mark: "S", layout: "a",
    th: th(LIGHT, { page: "bg-stone-100 text-stone-900", side: "border-r border-stone-200 bg-stone-50", mob: "border-b border-stone-200 bg-stone-50", brand: "bg-orange-600 text-white", link: "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900", active: "bg-orange-100 text-orange-800", card: "rounded-lg border border-stone-200 bg-white", title: "text-stone-900", muted: "text-stone-600", line: "border-stone-200", divide: "divide-stone-100", grid: "text-stone-200", track: "text-stone-100", thead: "bg-stone-50 text-stone-600", btn: "bg-orange-600 text-white hover:bg-orange-700", btn2: "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50", input: "border-stone-300 bg-white text-stone-900 placeholder:text-stone-500", ring: "focus-visible:ring-orange-600", s: ["text-orange-600", "text-stone-400", "text-amber-400", "text-teal-600"] }),
    nav: [["Orders", "cart"], ["Products", "box"], ["Customers", "users"], ["Shipping", "truck"], ["Reports", "chart"]],
    title: "Orders", sub: "All channels, this week", range: "Oct 6 to Oct 12", action: "New order",
    kpis: [["Orders", "1,204", "+9.7%", true, "vs last week"], ["Revenue", "$63,918", "+11.2%", true, "after discounts"], ["Average order", "$53.09", "+$0.81", true, "per checkout"], ["Return rate", "3.4%", "+0.6 pts", false, "mostly sizing"]],
    chartTitle: "Orders per day", chartNote: "Web shop and market stall",
    chart: { kind: "bars", labels: days, series: [{ name: "Web shop", data: [142, 156, 133, 171, 198, 214, 120] }, { name: "Market stall", data: [12, 9, 14, 11, 18, 61, 44] }] },
    panel: { kind: "list", title: "Needs attention", items: [["14 orders waiting to ship", "Oldest placed Thursday 4:12 pm", "Ship"], ["Linen apron, sage", "Only 6 left in stock", "Stock"], ["Refund request #SG-4418", "Item arrived with a torn seam", "2h"], ["Address check #SG-4431", "Postcode does not match the city", "5h"]] },
    table: { title: "Latest orders", cols: ["Order", "Customer", "Items", "Total", "Status"], num: [2, 3], status: 4, badge: LB("Shipped", "Packing", "Refund"),
      rows: [["#SG-4436", "Maya Okafor", "3", "$118.00", "Packing"], ["#SG-4435", "Tomas Reyes", "1", "$42.50", "Shipped"], ["#SG-4434", "Ingrid Haugen", "2", "$76.00", "Shipped"], ["#SG-4433", "Dev Malhotra", "5", "$214.90", "Packing"], ["#SG-4418", "Clara Beaumont", "1", "$38.00", "Refund"]] },
  },
  {
    name: "CRM pipeline", f: "sales", brand: "Bridgewell CRM", mark: "B", layout: "a",
    th: th(LIGHT, { page: "bg-sky-50/60 text-slate-900", brand: "bg-sky-700 text-white", active: "bg-sky-100 text-sky-800", btn: "bg-sky-700 text-white hover:bg-sky-800", ring: "focus-visible:ring-sky-600", s: ["text-sky-600", "text-emerald-500", "text-amber-500", "text-slate-300"] }),
    nav: [["Pipeline", "chart"], ["Deals", "wallet"], ["Contacts", "users"], ["Tasks", "check"], ["Calendar", "calendar"]],
    title: "Sales pipeline", sub: "Q4 2026, whole team", range: "This quarter", action: "New deal",
    kpis: [["Open pipeline", "$1.42M", "+$186k", true, "added this month"], ["Won this quarter", "$318k", "64% of target", true, "target $500k"], ["Win rate", "27%", "-3 pts", false, "vs Q3"], ["Sales cycle", "38 days", "-4 days", true, "median"]],
    chartTitle: "Deals by stage", chartNote: "Count and value of open deals",
    chart: { kind: "funnel", items: [["Qualified", 64, "64 deals · $1.42M"], ["Demo booked", 41, "41 deals · $968k"], ["Proposal sent", 23, "23 deals · $611k"], ["Negotiation", 12, "12 deals · $344k"], ["Won", 9, "9 deals · $318k"]] },
    panel: { kind: "list", title: "Recent activity", items: [["Priya moved Alder Homes to Proposal", "$48,000 annual contract", "9:40"], ["Call logged with Westfold Clinics", "Asked for a security review", "9:12"], ["Kenji won Rowan Print Works", "$22,500, signed today", "8:55"], ["Meeting set with Cobalt Schools", "Thursday at 2:00 pm", "Yday"]] },
    table: { title: "Deals closing soon", cols: ["Deal", "Owner", "Value", "Close date", "Stage"], num: [2], status: 4, badge: { Negotiation: "bg-amber-50 text-amber-800", Proposal: "bg-sky-50 text-sky-800", Demo: "bg-slate-100 text-slate-700" },
      rows: [["Alder Homes", "Priya Nair", "$48,000", "Oct 24", "Proposal"], ["Westfold Clinics", "Sam Ortiz", "$96,500", "Oct 30", "Negotiation"], ["Cobalt Schools", "Kenji Mori", "$31,200", "Nov 4", "Demo"], ["Juniper Hotels", "Priya Nair", "$74,000", "Nov 7", "Negotiation"], ["Tidewater Marine", "Ana Silva", "$18,900", "Nov 12", "Proposal"]] },
  },
  {
    name: "Budget and spending", f: "finance", brand: "Ledgerleaf", mark: "L", layout: "b",
    th: th(LIGHT, { page: "bg-white text-slate-900", side: "border-r border-emerald-900 bg-emerald-950", mob: "border-b border-emerald-900 bg-emerald-950", brand: "bg-emerald-300 text-emerald-950", link: "text-emerald-100/80 hover:bg-emerald-900 hover:text-white", active: "bg-emerald-800 text-white", card: "rounded-2xl border border-slate-200 bg-white", btn: "bg-emerald-700 text-white hover:bg-emerald-800", ring: "focus-visible:ring-emerald-600", s: ["text-emerald-600", "text-slate-300", "text-amber-500", "text-sky-500"] }),
    nav: [["Budget", "wallet"], ["Transactions", "file"], ["Cards", "box"], ["Reports", "chart"], ["Team", "users"]],
    title: "Budget vs spending", sub: "Operating budget, fiscal year 2026", range: "Year to date", action: "Export",
    kpis: [["Spent so far", "$412,780", "79% of plan", true, "plan $522,000"], ["Left this month", "$18,240", "-$6,110", false, "vs same day last month"], ["Biggest overrun", "Travel", "+22%", false, "$4,380 over"], ["Cash runway", "19 months", "+2", true, "at current burn"]],
    chartTitle: "Spending against budget", chartNote: "Monthly, in thousands of dollars",
    chart: { kind: "bars", unit: "$", labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"], series: [{ name: "Spent", data: [41, 44, 39, 47, 52, 46, 38] }, { name: "Budget", data: [45, 45, 45, 48, 48, 48, 50], cls: 1 }] },
    panel: { kind: "donut", title: "Where it went", center: ["$413k", "year to date"], items: [["Payroll", 58], ["Software", 16], ["Office", 11], ["Travel", 9]] },
    table: { title: "Recent transactions", cols: ["Merchant", "Category", "Card", "Amount", "Receipt"], num: [3], status: 4, badge: LB("Matched", "Pending", "Missing"),
      rows: [["Cloudharbor Hosting", "Software", "•• 4021", "$1,240.00", "Matched"], ["Greyline Rail", "Travel", "•• 7713", "$312.60", "Missing"], ["Paper & Ink Supply", "Office", "•• 4021", "$86.15", "Matched"], ["Northlake Hotel", "Travel", "•• 7713", "$689.00", "Pending"], ["Formwise Design", "Software", "•• 1188", "$49.00", "Matched"]] },
  },
  {
    name: "Project tracker", f: "ops", brand: "Taskmoor", mark: "T", layout: "a", rail: true,
    th: th(LIGHT, { page: "bg-rose-50/40 text-slate-900", brand: "bg-rose-600 text-white", active: "bg-rose-100 text-rose-700", btn: "bg-rose-600 text-white hover:bg-rose-700", ring: "focus-visible:ring-rose-600", s: ["text-rose-600", "text-slate-400", "text-amber-500", "text-sky-500"] }),
    nav: [["Projects", "folder"], ["Board", "chart"], ["Schedule", "calendar"], ["Team", "users"], ["Inbox", "inbox"]],
    title: "Website relaunch", sub: "Sprint 14 of 16, ends Friday", range: "Sprint 14", action: "New task",
    kpis: [["Tasks done", "46 / 72", "64%", true, "on track"], ["Open bugs", "9", "+3", false, "2 high priority"], ["Hours logged", "312h", "of 360h", true, "this sprint"], ["Due this week", "11", "4 at risk", false, "see table"]],
    chartTitle: "Sprint burndown", chartNote: "Story points left, actual against ideal",
    chart: { kind: "line", labels: ["Day 1", "Day 3", "Day 5", "Day 7", "Day 9", "Day 10"], series: [{ name: "Actual", data: [120, 112, 104, 101, 88, 79, 70, 58, 49, 38] }, { name: "Ideal", data: [120, 107, 93, 80, 67, 53, 40, 27, 13, 0], cls: 1 }] },
    panel: { kind: "meters", title: "Team workload", items: [["Rhea Castillo, design", "34h", 85], ["Omar Haddad, front end", "39h", 97], ["Lena Fischer, back end", "28h", 70], ["Joon Park, content", "22h", 55], ["Ade Bello, QA", "31h", 78]] },
    table: { title: "Due this week", cols: ["Task", "Assignee", "Due", "Points", "Status"], num: [3], status: 4, badge: LB("Done", "In review", "Blocked"),
      rows: [["Pricing page layout", "Rhea Castillo", "Tue", "5", "In review"], ["Checkout error states", "Omar Haddad", "Wed", "8", "Blocked"], ["Search index rebuild", "Lena Fischer", "Wed", "3", "Done"], ["Rewrite help articles", "Joon Park", "Thu", "5", "In review"], ["Regression pass", "Ade Bello", "Fri", "8", "Blocked"]] },
  },
  {
    name: "Support desk", f: "ops", brand: "Helpwick", mark: "H", layout: "b", dark: true,
    th: th(DARK, { page: "bg-slate-950 text-slate-100", side: "border-r border-slate-800 bg-[#0b1426]", mob: "border-b border-slate-800 bg-[#0b1426]", brand: "bg-amber-400 text-slate-950", link: "text-slate-400 hover:bg-slate-800 hover:text-white", active: "bg-amber-400/10 text-amber-300", card: "rounded-xl border border-slate-800 bg-[#0e1a30]", muted: "text-slate-400", line: "border-slate-800", divide: "divide-slate-800", grid: "text-slate-800", track: "text-slate-800", thead: "bg-[#0b1426] text-slate-400", btn: "bg-amber-400 text-slate-950 hover:bg-amber-300", btn2: "border border-slate-700 bg-[#0e1a30] text-slate-200 hover:bg-slate-800", input: "border-slate-700 bg-slate-950 text-white placeholder:text-slate-400", ring: "focus-visible:ring-amber-400", s: ["text-amber-400", "text-sky-400", "text-violet-400", "text-slate-500"] }),
    nav: [["Queue", "inbox"], ["My tickets", "file"], ["Customers", "users"], ["Reports", "chart"], ["Help centre", "folder"]],
    title: "Support queue", sub: "All teams, today", range: "Today", action: "New ticket",
    kpis: [["Open tickets", "184", "-12", true, "since 9 am"], ["First reply", "14 min", "-3 min", true, "median today"], ["Satisfaction", "94%", "+1 pt", true, "212 ratings"], ["Over 24 hours", "17", "+5", false, "need an owner"]],
    chartTitle: "New tickets by hour", chartNote: "Today, email against live chat",
    chart: { kind: "bars", labels: ["8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm"], series: [{ name: "Email", data: [18, 26, 31, 29, 22, 24, 27, 19] }, { name: "Live chat", data: [9, 17, 22, 25, 14, 18, 21, 16] }] },
    panel: { kind: "donut", title: "Open by channel", center: ["184", "open"], items: [["Email", 92], ["Live chat", 51], ["Phone", 28], ["Forms", 13]] },
    table: { title: "Oldest open tickets", cols: ["Ticket", "Subject", "Customer", "Waiting", "Priority"], num: [3], status: 4, badge: LB("Low", "Normal", "Urgent", false),
      rows: [["#20931", "Card charged twice", "Elena Rossi", "31h", "Urgent"], ["#20947", "Cannot reset password", "Marcus Lee", "28h", "Normal"], ["#20952", "Export missing columns", "Aiko Tanaka", "26h", "Normal"], ["#20960", "Change billing email", "Femi Adeyemi", "25h", "Low"], ["#20964", "App crashes on upload", "Noor Hassan", "24h", "Urgent"]] },
  },
  {
    name: "Fleet tracking", f: "ops", brand: "Routeline", mark: "R", layout: "a", dark: true,
    th: th(DARK, { page: "bg-neutral-950 text-neutral-100", side: "border-r border-neutral-800 bg-neutral-950", mob: "border-b border-neutral-800 bg-neutral-950", brand: "bg-lime-400 text-neutral-950", link: "text-neutral-400 hover:bg-neutral-900 hover:text-white", active: "bg-lime-400 text-neutral-950", card: "rounded-md border border-neutral-800 bg-neutral-900", muted: "text-neutral-400", line: "border-neutral-800", divide: "divide-neutral-800", grid: "text-neutral-800", track: "text-neutral-800", thead: "bg-neutral-900 text-neutral-400", btn: "bg-lime-400 text-neutral-950 hover:bg-lime-300", btn2: "border border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800", input: "border-neutral-700 bg-neutral-950 text-white placeholder:text-neutral-400", ring: "focus-visible:ring-lime-400", s: ["text-lime-400", "text-neutral-500", "text-orange-400", "text-sky-400"] }),
    nav: [["Live map", "map"], ["Vehicles", "truck"], ["Drivers", "users"], ["Routes", "pulse"], ["Depots", "home"]],
    title: "Fleet today", sub: "East region, 3 depots", range: "Today", action: "Export",
    kpis: [["Vehicles out", "58 / 64", "91%", true, "6 in service"], ["On-time drops", "96.2%", "+1.4 pts", true, "1,912 of 1,987"], ["Fuel per 100 km", "11.8 L", "+0.4 L", false, "idle time up"], ["Late routes", "4", "-2", true, "vs yesterday"]],
    chartTitle: "On-time rate", chartNote: "Last 14 days, against the 95% target",
    chart: { kind: "line", unit: "%", labels: ["Sep 29", "Oct 2", "Oct 5", "Oct 8", "Oct 12"], series: [{ name: "On time", data: [88, 90, 89, 92, 91, 93, 90, 94, 95, 93, 96, 95, 97, 96] }, { name: "Target", data: [95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95], cls: 1 }] },
    panel: { kind: "list", title: "Alerts", items: [["Van 22 idling 18 minutes", "Harbour Rd depot gate", "Now"], ["Truck 07 service due", "Brake check, 600 km left", "Today"], ["Route E-14 running late", "Roadworks on Mill Lane", "12m"], ["Van 31 back at depot", "Shift ended 15:40", "20m"]] },
    table: { title: "Active routes", cols: ["Route", "Driver", "Stops", "ETA", "Status"], num: [2], status: 4, badge: LB("On time", "Loading", "Late", false),
      rows: [["E-11", "Callum Price", "18 / 24", "16:20", "On time"], ["E-14", "Rosa Mendes", "9 / 22", "17:45", "Late"], ["E-16", "Yusuf Kaya", "21 / 21", "15:05", "On time"], ["E-19", "Hanna Berg", "0 / 19", "18:10", "Loading"], ["E-23", "Theo Grant", "14 / 26", "17:00", "On time"]] },
  },
  {
    name: "Clinic schedule", f: "health", brand: "Brookside Clinic", mark: "B", layout: "b",
    th: th(LIGHT, { page: "bg-cyan-50/50 text-slate-900", side: "border-r border-cyan-100 bg-white", brand: "bg-teal-700 text-white", active: "bg-teal-50 text-teal-800", card: "rounded-2xl border border-cyan-100 bg-white", btn: "bg-teal-700 text-white hover:bg-teal-800", ring: "focus-visible:ring-teal-600", thead: "bg-cyan-50 text-slate-600", s: ["text-teal-600", "text-cyan-300", "text-rose-500", "text-slate-300"] }),
    nav: [["Today", "calendar"], ["Patients", "users"], ["Rooms", "home"], ["Messages", "inbox"], ["Billing", "wallet"]],
    title: "Monday, 13 October", sub: "Front desk view, 4 clinicians on", range: "Today", action: "Book visit",
    kpis: [["Appointments", "86", "+7", true, "vs last Monday"], ["Average wait", "11 min", "-2 min", true, "check-in to room"], ["No-shows", "4", "+1", false, "reminders sent"], ["Free slots", "9", "3 this afternoon", true, "open to booking"]],
    chartTitle: "Visits by hour", chartNote: "Booked and walk-in",
    chart: { kind: "bars", labels: ["8", "9", "10", "11", "12", "1", "2", "3", "4"], series: [{ name: "Booked", data: [8, 11, 12, 10, 6, 9, 11, 10, 6] }, { name: "Walk-in", data: [2, 1, 3, 2, 4, 1, 2, 1, 3] }] },
    panel: { kind: "meters", title: "Clinician time booked", items: [["Dr. Amara Osei", "92%", 92], ["Dr. Lucas Brandt", "81%", 81], ["Nurse Mei Lin", "74%", 74], ["Dr. Sofia Varga", "63%", 63]] },
    table: { title: "Next appointments", cols: ["Time", "Patient", "Clinician", "Room", "Status"], status: 4, badge: LB("Checked in", "Booked", "Running late"),
      rows: [["10:30", "Grace Whitfield", "Dr. Osei", "2", "Checked in"], ["10:45", "Daniel Ferreira", "Dr. Brandt", "4", "Booked"], ["10:50", "Ruth Adler", "Nurse Lin", "1", "Running late"], ["11:00", "Kofi Mensah", "Dr. Varga", "3", "Booked"], ["11:15", "Isla Moreau", "Dr. Osei", "2", "Booked"]] },
  },
  {
    name: "Campaign performance", f: "marketing", brand: "Brightloom", mark: "B", layout: "a",
    th: th(LIGHT, { page: "bg-fuchsia-50/40 text-slate-900", brand: "bg-fuchsia-700 text-white", active: "bg-fuchsia-100 text-fuchsia-800", btn: "bg-fuchsia-700 text-white hover:bg-fuchsia-800", ring: "focus-visible:ring-fuchsia-600", s: ["text-fuchsia-600", "text-amber-500", "text-sky-500", "text-slate-300"] }),
    nav: [["Campaigns", "megaphone"], ["Audiences", "users"], ["Content", "file"], ["Budget", "wallet"], ["Reports", "chart"]],
    title: "Campaigns", sub: "Autumn launch, all channels", range: "Last 28 days", action: "New campaign",
    kpis: [["Spend", "$24,860", "82% of budget", true, "$30,000 cap"], ["Clicks", "61,402", "+18%", true, "CTR 2.7%"], ["Sign-ups", "2,148", "+9%", true, "3.5% of clicks"], ["Cost per sign-up", "$11.57", "+$0.92", false, "target $10.50"]],
    chartTitle: "Clicks and sign-ups", chartNote: "Daily, last 4 weeks",
    chart: { kind: "line", labels: ["Sep 15", "Sep 22", "Sep 29", "Oct 6", "Oct 12"], series: [{ name: "Clicks", data: [1600, 1900, 1750, 2100, 2300, 2050, 2400, 2600, 2350, 2550, 2800, 2700] }, { name: "Sign-ups x 20", data: [1100, 1300, 1200, 1500, 1640, 1480, 1700, 1820, 1660, 1760, 1900, 1860] }] },
    panel: { kind: "donut", title: "Sign-ups by channel", center: ["2,148", "sign-ups"], items: [["Search ads", 812], ["Email", 604], ["Social", 471], ["Partners", 261]] },
    table: { title: "Campaigns", cols: ["Campaign", "Channel", "Spend", "Sign-ups", "Status"], num: [2, 3], status: 4, badge: LB("Live", "Scheduled", "Paused"),
      rows: [["Autumn launch, search", "Search ads", "$9,420", "812", "Live"], ["Welcome series", "Email", "$1,150", "604", "Live"], ["Customer stories", "Social", "$7,830", "471", "Paused"], ["Partner webinar", "Partners", "$3,960", "261", "Live"], ["Black Friday teaser", "Email", "$0", "0", "Scheduled"]] },
  },
];
const ITEMS: Item[] = CFGS.map(screen);

/* ---------- serialisers: one tree, three outputs ---------- */
const VOID = new Set(["input", "path", "circle", "rect", "line", "polyline"]);
const JSX_ATTR: Record<string, string> = {
  for: "htmlFor", "stroke-width": "strokeWidth", "stroke-linecap": "strokeLinecap", "stroke-linejoin": "strokeLinejoin",
  "stroke-dasharray": "strokeDasharray", "stroke-dashoffset": "strokeDashoffset", "vector-effect": "vectorEffect",
};
const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function toReact(n: N, key: string | number): ReactNode {
  if (typeof n === "string") return n;
  const props: Record<string, unknown> = { key };
  if (n.c) props.className = n.c;
  for (const [k, v] of Object.entries(n.a ?? {})) props[JSX_ATTR[k] ?? k] = v;
  return createElement(n.t, props, ...(VOID.has(n.t) ? [] : n.k.map((k, i) => toReact(k, i))));
}

function serial(n: N, jsx: boolean, depth: number): string {
  const pad = "  ".repeat(depth);
  if (typeof n === "string") return pad + (jsx ? n.replace(/[{}]/g, (m) => `{"${m}"}`) : escHtml(n));
  const attrs: string[] = [];
  if (n.c) attrs.push(`${jsx ? "className" : "class"}="${n.c}"`);
  for (const [k, v] of Object.entries(n.a ?? {})) attrs.push(`${jsx ? JSX_ATTR[k] ?? k : k}="${v}"`);
  const open = `<${n.t}${attrs.length ? " " + attrs.join(" ") : ""}`;
  if (VOID.has(n.t)) return `${pad}${open}${jsx || n.t !== "input" ? " />" : ">"}`;
  const flat = n.k.every((k) => typeof k === "string") || (n.t === "svg" && n.k.length === 1);
  if (flat) return `${pad}${open}>${n.k.map((k) => serial(k, jsx, 0)).join("")}</${n.t}>`;
  return `${pad}${open}>\n${n.k.map((k) => serial(k, jsx, depth + 1)).join("\n")}\n${pad}</${n.t}>`;
}

const pascal = (s: string) => s.replace(/(^|[^a-zA-Z0-9]+)([a-zA-Z0-9])/g, (_, __, c: string) => c.toUpperCase());
function codeFor(it: Item, block: number, jsx: boolean) {
  const nodes = block < 0 ? [it.node] : it.blocks[block].nodes;
  const label = block < 0 ? "Dashboard" : it.blocks[block].name;
  if (!jsx) return `<!-- ${it.name}: ${label}. Needs Tailwind CSS v3 or v4 on the page -->\n${nodes.map((x) => serial(x, false, 0)).join("\n")}\n`;
  const inner = nodes.length > 1 ? `    <>\n${nodes.map((x) => serial(x, true, 3)).join("\n")}\n    </>` : serial(nodes[0], true, 2);
  return `export default function ${pascal(it.name)}${pascal(label)}() {\n  return (\n${inner}\n  );\n}\n`;
}

/* ---------- scaled preview ---------- */
const BASE_W = 1280;
function Preview({ node, full }: { node: El; full: boolean }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ s: 1, h: 0, w: BASE_W });
  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const avail = o.clientWidth;
      const w = window.innerWidth >= 768 ? BASE_W : avail;
      const s = full ? 1 : Math.min(1, avail / w);
      setBox({ s, w: full ? avail : w, h: i.scrollHeight * s });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [full]);
  const stop = (e: SyntheticEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("a")) e.preventDefault();
  };
  return (
    <div ref={outer} className="relative overflow-hidden" style={{ height: box.h || undefined }} onClickCapture={stop}>
      <div ref={inner} className="origin-top-left" style={{ width: box.w, transform: box.s === 1 ? undefined : `scale(${box.s})` }}>
        {toReact(node, 0)}
      </div>
    </div>
  );
}

/* ---------- page ---------- */
const RULES: [string, string][] = [
  ["Four numbers first", "Put the handful of figures people check every morning at the top, and push everything else below them."],
  ["One loud colour", "Give the main series the accent and draw comparisons, targets and grid lines in quiet greys."],
  ["Numbers line up", "Right-align figures and use tabular digits so a column of totals can be scanned in one glance."],
  ["Two weights do the work", "Small, muted labels and large, bold values. Avoid a third size unless it is the page title."],
  ["One spacing step", "Keep the same gap between every card and the same padding inside them, so rows read as rows."],
  ["Say the period", "Every chart and tile names its time range and what it is compared with, or the number means little."],
];
const FAMILY_KEYS = Object.keys(FAMILIES) as Family[];
type Lang = "jsx" | "html";

export default function DashboardLayoutsCollection() {
  const [family, setFamily] = useState<Family | "all">("all");
  const [dark, setDark] = useState(false);
  const [full, setFull] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [block, setBlock] = useState(-1);
  const [lang, setLang] = useState<Lang>("jsx");
  const [copied, setCopied] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const indexed = useMemo(() => ITEMS.map((it, i) => ({ it, i })), []);
  const visible = indexed.filter(({ it }) => family === "all" || it.f === family);

  async function copy(i: number, l: Lang, b: number) {
    const it = ITEMS[i];
    const text = codeFor(it, b, l === "jsx");
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) { setOpen(i); setLang(l); setBlock(b); }
    setCopied(ok ? `${i}-${l}-${b}` : null);
    setAnnounce(ok ? `${it.name} ${b < 0 ? "screen" : it.blocks[b].name} copied as ${l === "jsx" ? "React JSX" : "HTML"}` : "Copy was blocked, the code is shown below so you can select it");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  }

  const k = dark
    ? { page: "bg-[#0f1115] text-zinc-100", sub: "text-zinc-400", card: "border-zinc-800 bg-zinc-900", chipOff: "bg-zinc-900 text-zinc-300 ring-1 ring-inset ring-zinc-700 hover:bg-zinc-800", chipOn: "bg-white text-zinc-900", tool: "text-zinc-300 hover:bg-zinc-800", copy: "bg-zinc-800 text-white hover:bg-zinc-700", line: "border-zinc-800", stripe: "bg-[repeating-linear-gradient(45deg,#16181d_0_8px,#1b1e24_8px_16px)]" }
    : { page: "bg-[#f6f6f4] text-[#15171c]", sub: "text-stone-600", card: "border-stone-200 bg-white", chipOff: "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100", chipOn: "bg-[#15171c] text-white", tool: "text-stone-700 hover:bg-stone-100", copy: "bg-stone-100 text-stone-900 hover:bg-stone-200", line: "border-stone-300/70", stripe: "bg-[repeating-linear-gradient(45deg,#f3f3f1_0_8px,#ececea_8px_16px)]" };
  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1";
  const chip = `inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors ${ring}`;
  const tool = `inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${ring}`;
  const Icon = ({ d, c = "h-4 w-4" }: { d: string; c?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={c}><path d={d} /></svg>
  );

  return (
    <section className={`px-4 py-12 transition-colors sm:px-8 sm:py-14 ${k.page}`} style={{ fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className={`font-mono text-[12px] uppercase tracking-[0.18em] ${k.sub}`}>React · Tailwind · HTML</p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">{ITEMS.length} dashboard layouts you can copy</h2>
            <p className={`mt-4 max-w-xl text-[15px] leading-relaxed ${k.sub}`}>
              Complete admin screens with a sidebar, KPI row, charts drawn in SVG and a real data table. Copy a whole screen or just one block, as React or plain HTML.
            </p>
          </div>
          <button type="button" role="switch" aria-checked={dark} onClick={() => setDark(!dark)} className={`${tool} h-10 self-start border ${k.card} md:self-auto`}>
            <Icon d={dark ? ICONS.moon : ICONS.sun} />
            Gallery: {dark ? "Dark" : "Light"}
          </button>
        </header>

        <section aria-labelledby="dlc-rules" className={`mt-8 rounded-2xl border p-5 ${k.card}`}>
          <h3 id="dlc-rules" className="text-[13px] font-semibold uppercase tracking-[0.14em]">Design rules for density and hierarchy</h3>
          <ol className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {RULES.map(([a, b], i) => (
              <li key={a} className="flex gap-3 text-[13px] leading-snug">
                <span className={`font-mono text-[11px] ${k.sub}`}>{String(i + 1).padStart(2, "0")}</span>
                <span><span className="font-semibold">{a}.</span> <span className={k.sub}>{b}</span></span>
              </li>
            ))}
          </ol>
        </section>

        <div className={`mt-6 flex flex-wrap gap-1.5 border-y py-4 ${k.line}`} role="group" aria-label="Filter by kind of dashboard">
          {(["all", ...FAMILY_KEYS] as const).map((f) => {
            const on = family === f;
            const n = f === "all" ? ITEMS.length : ITEMS.filter((it) => it.f === f).length;
            return (
              <button key={f} type="button" aria-pressed={on} onClick={() => setFamily(f)} className={`${chip} ${on ? k.chipOn : k.chipOff}`}>
                {f === "all" ? "All" : FAMILIES[f]}
                <span className="font-mono text-[11px] opacity-70">{n}</span>
              </button>
            );
          })}
        </div>

        <p className="sr-only" aria-live="polite">{announce}</p>

        <div className="mt-6 h-[1000px] overflow-y-auto overscroll-contain rounded-2xl pr-1" tabIndex={0} aria-label="Dashboard examples">
          <ul className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            {visible.map(({ it, i }) => {
              const isFull = full === i;
              const isOpen = open === i;
              const b = isOpen ? block : -1;
              return (
                <li key={i} className={`overflow-hidden rounded-2xl border ${k.card} ${isFull || isOpen ? "lg:col-span-2" : ""}`}>
                  <div className={`${k.stripe} p-3`}>
                    <div className="overflow-hidden rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
                      <Preview node={it.node} full={isFull} />
                    </div>
                  </div>
                  <div className={`flex flex-wrap items-center gap-2 border-t px-3 py-2.5 ${k.line}`}>
                    <span className={`font-mono text-[11px] ${k.sub}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 basis-40 truncate text-[13px] font-medium">
                      {it.name} <span className={`font-normal ${k.sub}`}>· {FAMILIES[it.f]}{it.dark ? " · dark" : ""}</span>
                    </span>
                    <button type="button" aria-pressed={isFull} onClick={() => setFull(isFull ? null : i)} className={`${tool} ${k.tool}`}>
                      {isFull ? "Scaled" : "Full size"}
                    </button>
                    <button type="button" aria-expanded={isOpen} aria-controls={`dlc-code-${i}`} onClick={() => { setOpen(isOpen ? null : i); setBlock(-1); }} className={`${tool} ${k.tool}`}>
                      <Icon d={ICONS.code} />
                      Code
                    </button>
                    {(["jsx", "html"] as const).map((l) => {
                      const done = copied === `${i}-${l}--1`;
                      return (
                        <button key={l} type="button" onClick={() => copy(i, l, -1)} aria-label={`Copy ${l === "jsx" ? "React JSX" : "HTML"} for the ${it.name} screen`} className={`${tool} ${done ? "bg-emerald-700 text-white" : k.copy}`}>
                          <Icon d={done ? ICONS.check : ICONS.copy} c="h-3.5 w-3.5" />
                          {done ? "Copied" : l === "jsx" ? "JSX" : "HTML"}
                        </button>
                      );
                    })}
                  </div>
                  {isOpen && (
                    <div id={`dlc-code-${i}`} className="border-t border-zinc-800 bg-[#111318]">
                      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
                        <div className="flex flex-wrap gap-1" role="group" aria-label="Which block">
                          {[-1, ...it.blocks.map((_, j) => j)].map((j) => (
                            <button key={j} type="button" aria-pressed={b === j} onClick={() => setBlock(j)} className={`min-h-9 rounded-md px-2.5 text-[12px] font-semibold ${ring} ${b === j ? "bg-white text-zinc-900" : "text-zinc-300 hover:bg-white/10 hover:text-white"}`}>
                              {j < 0 ? "Whole screen" : it.blocks[j].name}
                            </button>
                          ))}
                        </div>
                        <div className="ml-auto flex gap-1" role="group" aria-label="Code format">
                          {(["jsx", "html"] as const).map((l) => (
                            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={`min-h-9 rounded-md px-2.5 text-[12px] font-semibold ${ring} ${lang === l ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"}`}>
                              {l === "jsx" ? "React JSX" : "HTML"}
                            </button>
                          ))}
                          <button type="button" onClick={() => copy(i, lang, b)} className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold ${ring} ${copied === `${i}-${lang}-${b}` ? "bg-emerald-600 text-white" : "bg-white text-zinc-900 hover:bg-zinc-200"}`}>
                            <Icon d={copied === `${i}-${lang}-${b}` ? ICONS.check : ICONS.copy} c="h-3.5 w-3.5" />
                            {copied === `${i}-${lang}-${b}` ? "Copied" : `Copy ${b < 0 ? "screen" : it.blocks[b].name}`}
                          </button>
                        </div>
                      </div>
                      <pre tabIndex={0} aria-label="Code" className="max-h-96 overflow-auto p-4 font-mono text-[11.5px] leading-[1.65] text-zinc-200">
                        <code>{codeFor(it, b, lang === "jsx")}</code>
                      </pre>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
