import { createElement, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

/*
  Bento grid collection.
  Each layout is one element tree. Placement uses grid-template-areas written as Tailwind arbitrary
  properties ([grid-template-areas:'a_a_b'_'c_d_b'] on the grid, [grid-area:a] on each tile), so the
  same names drive three outputs: the live preview, the Tailwind HTML or JSX you copy, and a plain CSS
  layout generated from those classes, with @media rules for the 768px and 1024px breakpoints.
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
const hide = $({ "aria-hidden": "true" });

type Layout = { name: string; kind: string; note: string; node: El };

/* small visual helpers, all plain elements */
const bars = (vals: number[], cls: string) =>
  h("div", "mt-4 flex h-20 items-end gap-1.5", hide, ...vals.map((v) => h("span", `flex-1 rounded-t ${cls}`, $({ style: `height:${v}%` }))));
const spark = (stroke: string, fill: string) =>
  h("svg", "mt-4 h-24 w-full", $({ viewBox: "0 0 300 90", preserveAspectRatio: "none", "aria-hidden": "true" }),
    h("path", "", $({ d: "M0 70 C30 62 45 74 70 58 S120 40 150 46 S200 22 230 28 S270 12 300 8 L300 90 L0 90 Z", fill })),
    h("path", "", $({ d: "M0 70 C30 62 45 74 70 58 S120 40 150 46 S200 22 230 28 S270 12 300 8", fill: "none", stroke, "stroke-width": "2.5", "vector-effect": "non-scaling-stroke" })),
  );
const initials = (list: string[], cls: string) =>
  h("div", "mt-4 flex -space-x-2", hide, ...list.map((s) => h("span", `grid h-9 w-9 place-items-center rounded-full text-[11px] font-bold ring-2 ${cls}`, s)));

/* ---------- the ten layouts ---------- */
const LAYOUTS: Layout[] = [
  {
    name: "Product analytics features",
    kind: "Feature",
    note: "One hero tile spans two rows on desktop; on tablets it takes the full first row.",
    node: h("div", "grid gap-3 auto-rows-[minmax(150px,auto)] [grid-template-areas:'a'_'b'_'c'_'d'_'e'] md:grid-cols-2 md:[grid-template-areas:'a_a'_'b_c'_'d_e'] lg:grid-cols-4 lg:[grid-template-areas:'a_a_b_c'_'a_a_d_e']",
      h("article", "[grid-area:a] flex flex-col rounded-2xl bg-white p-6 ring-1 ring-slate-200",
        h("p", "text-[12px] font-semibold uppercase tracking-wider text-indigo-700", "Live funnels"),
        h("h3", "mt-2 text-[22px] font-semibold tracking-tight text-slate-900", "See where sign-ups stall, as it happens"),
        h("p", "mt-2 text-[14px] text-slate-600", "Every step updates within seconds of a visit, with no sampling."),
        h("div", "mt-auto", spark("#4f46e5", "#eef2ff")),
      ),
      h("article", "[grid-area:b] rounded-2xl bg-indigo-600 p-5 text-white",
        h("p", "text-[32px] font-semibold tracking-tight", "4 min"),
        h("p", "mt-1 text-[14px] text-indigo-100", "Typical set-up, one script tag"),
      ),
      h("article", "[grid-area:c] rounded-2xl bg-white p-5 ring-1 ring-slate-200",
        h("h3", "font-semibold text-slate-900", "Session replays"),
        h("p", "mt-1 text-[14px] text-slate-600", "Jump from a drop-off straight to the recording."),
      ),
      h("article", "[grid-area:d] rounded-2xl bg-white p-5 ring-1 ring-slate-200",
        h("h3", "font-semibold text-slate-900", "Cohorts"),
        bars([30, 48, 42, 66, 58, 80], "bg-indigo-200"),
      ),
      h("article", "[grid-area:e] rounded-2xl bg-slate-900 p-5 text-white",
        h("h3", "font-semibold", "Your data stays yours"),
        h("p", "mt-1 text-[14px] text-slate-300", "Export raw events any time, as CSV or Parquet."),
      ),
    ),
  },
  {
    name: "Designer portfolio",
    kind: "Portfolio",
    note: "Tall and wide project tiles; on phones they become a single column in reading order.",
    node: h("div", "grid gap-3 auto-rows-[minmax(140px,auto)] [grid-template-areas:'a'_'b'_'c'_'d'_'e'] md:grid-cols-2 md:[grid-template-areas:'a_b'_'a_c'_'d_e'] lg:grid-cols-3 lg:[grid-template-areas:'a_b_b'_'a_c_d'_'e_e_d']",
      h("article", "[grid-area:a] flex flex-col justify-end rounded-2xl bg-[#e9e4da] p-6",
        h("p", "text-[12px] uppercase tracking-[0.2em] text-stone-600", "Hello"),
        h("h3", "mt-2 font-serif text-[30px] leading-tight text-stone-900", "Ama Lindqvist designs quiet brands for loud markets."),
        h("a", "mt-5 inline-flex min-h-[40px] w-fit items-center rounded-full bg-stone-900 px-4 text-[14px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2", $({ href: "#" }), "Start a project"),
      ),
      h("a", "[grid-area:b] group relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#1f3b2d,#3f6b4f_55%,#c9b27c)] p-5 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900", $({ href: "#" }),
        h("span", "absolute right-5 top-5 h-24 w-24 rounded-full border border-white/40", hide),
        h("p", "text-[12px] uppercase tracking-wider text-white/80", "Identity, 2026"),
        h("h3", "mt-16 text-[20px] font-semibold", "Fernhill Cider"),
      ),
      h("a", "[grid-area:c] rounded-2xl bg-[#d8603f] p-5 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900", $({ href: "#" }),
        h("p", "text-[12px] uppercase tracking-wider text-white/85", "Packaging"),
        h("h3", "mt-8 text-[18px] font-semibold", "Kiln & Co. tea tins"),
      ),
      h("article", "[grid-area:d] rounded-2xl bg-white p-5 ring-1 ring-stone-200",
        h("h3", "font-semibold text-stone-900", "Recent clients"),
        h("ul", "mt-3 space-y-2 text-[14px] text-stone-600",
          h("li", "", "Harbour Rowing Club"), h("li", "", "Ostra Ceramics"), h("li", "", "Northgate Library"), h("li", "", "Pell & Wren Architects")),
      ),
      h("article", "[grid-area:e] flex items-center justify-between gap-4 rounded-2xl bg-stone-900 p-5 text-white",
        h("p", "text-[15px]", "Booking projects for March onward."),
        h("span", "inline-flex items-center gap-2 text-[13px] text-emerald-300", h("span", "h-2 w-2 rounded-full bg-emerald-400", hide), "Available"),
      ),
    ),
  },
  {
    name: "Monthly numbers",
    kind: "Stats",
    note: "Six equal cells on desktop, with the headline figure doubled in width.",
    node: h("div", "grid gap-3 auto-rows-[minmax(120px,auto)] [grid-template-areas:'a'_'b'_'c'_'d'_'e'] md:grid-cols-2 md:[grid-template-areas:'a_a'_'b_c'_'d_e'] lg:grid-cols-4 lg:[grid-template-areas:'a_a_b_c'_'a_a_d_e']",
      h("article", "[grid-area:a] flex flex-col rounded-2xl bg-emerald-950 p-6 text-white",
        h("p", "text-[13px] text-emerald-200", "Revenue, October"),
        h("p", "mt-1 text-[44px] font-semibold tracking-tight tabular-nums", "$84,210"),
        h("p", "text-[14px] text-emerald-200", "Up 12.4% on September"),
        h("div", "mt-auto", bars([40, 52, 46, 61, 58, 70, 66, 78, 74, 88], "bg-emerald-400/80")),
      ),
      ...([
        ["b", "Orders", "1,932", "+8.1%"],
        ["c", "Average basket", "$43.58", "+3.9%"],
        ["d", "Returning", "61%", "+2 pts"],
        ["e", "Refunds", "0.8%", "-0.3 pts"],
      ] as const).map(([a, l, v, d]) =>
        h("article", `[grid-area:${a}] rounded-2xl bg-white p-5 ring-1 ring-emerald-900/10`,
          h("p", "text-[13px] text-slate-600", l),
          h("p", "mt-1 text-[28px] font-semibold tracking-tight tabular-nums text-slate-900", v),
          h("p", "text-[13px] font-medium text-emerald-700", d),
        ),
      ),
    ),
  },
  {
    name: "Headphones product page",
    kind: "Product",
    note: "A wide image tile on top, three spec tiles below; tablets keep two columns.",
    node: h("div", "grid gap-3 auto-rows-[minmax(140px,auto)] [grid-template-areas:'a'_'b'_'c'_'d'] md:grid-cols-2 md:[grid-template-areas:'a_a'_'b_c'_'d_d'] lg:grid-cols-3 lg:[grid-template-areas:'a_a_b'_'c_d_d']",
      h("article", "[grid-area:a] relative min-h-[220px] overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_70%_40%,#3a3f4a,#16181d_60%)] p-6 text-white",
        h("p", "text-[12px] uppercase tracking-[0.18em] text-slate-400", "Arden One"),
        h("h3", "mt-2 max-w-xs text-[26px] font-semibold leading-tight", "Quiet when you want it, open when you don't."),
        h("span", "absolute bottom-[-40px] right-10 h-44 w-44 rounded-full border-[14px] border-slate-500/60", hide),
        h("span", "absolute bottom-6 right-6 h-20 w-12 rounded-2xl bg-slate-300/80 shadow-[inset_-6px_-8px_12px_rgba(0,0,0,0.35)]", hide),
      ),
      h("article", "[grid-area:b] rounded-3xl bg-[#f1ede6] p-5",
        h("p", "text-[40px] font-semibold tracking-tight text-stone-900", "38 h"),
        h("p", "text-[14px] text-stone-600", "Battery with noise cancelling on. Ten minutes of charge gives four hours."),
      ),
      h("article", "[grid-area:c] rounded-3xl bg-white p-5 ring-1 ring-stone-200",
        h("h3", "font-semibold text-stone-900", "Three finishes"),
        h("div", "mt-4 flex gap-2", hide, h("span", "h-8 w-8 rounded-full bg-stone-900 ring-2 ring-offset-2 ring-stone-900"), h("span", "h-8 w-8 rounded-full bg-[#c8bca8]"), h("span", "h-8 w-8 rounded-full bg-[#5b6b5a]")),
      ),
      h("article", "[grid-area:d] flex flex-col justify-between gap-4 rounded-3xl bg-white p-5 ring-1 ring-stone-200 sm:flex-row sm:items-center",
        h("div", "", h("h3", "font-semibold text-stone-900", "$249, free returns for 30 days"), h("p", "text-[14px] text-stone-600", "Ships in two working days.")),
        h("a", "inline-flex min-h-[44px] items-center justify-center rounded-full bg-stone-900 px-5 text-[14px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2", $({ href: "#" }), "Add to bag"),
      ),
    ),
  },
  {
    name: "Developer tool, dark",
    kind: "Feature",
    note: "A code tile anchors the left; three narrow tiles stack beside it.",
    node: h("div", "grid gap-3 auto-rows-[minmax(120px,auto)] [grid-template-areas:'a'_'b'_'c'_'d'] md:grid-cols-2 md:[grid-template-areas:'a_a'_'b_c'_'d_d'] lg:grid-cols-3 lg:[grid-template-areas:'a_a_b'_'a_a_c'_'a_a_d']",
      h("article", "[grid-area:a] rounded-2xl bg-[#0d1117] p-6 ring-1 ring-white/10",
        h("p", "text-[12px] font-semibold uppercase tracking-wider text-sky-400", "Typed client"),
        h("h3", "mt-2 text-[22px] font-semibold text-white", "Your schema becomes autocomplete"),
        h("pre", "mt-5 overflow-x-auto rounded-xl bg-black/40 p-4 font-mono text-[12.5px] leading-6 text-slate-300",
          h("code", "", "const order = await db.orders.get(\"ord_81\");\norder.total;    // number\norder.customer; // Customer\norder.notes;    // string | null")),
      ),
      h("article", "[grid-area:b] rounded-2xl bg-[#11161d] p-5 ring-1 ring-white/10",
        h("h3", "font-semibold text-white", "Branches for data"),
        h("p", "mt-1 text-[14px] text-slate-400", "Every pull request gets its own copy."),
      ),
      h("article", "[grid-area:c] rounded-2xl bg-[#11161d] p-5 ring-1 ring-white/10",
        h("h3", "font-semibold text-white", "Point-in-time restore"),
        h("p", "mt-1 text-[14px] text-slate-400", "Roll back to any second in the last week."),
      ),
      h("article", "[grid-area:d] rounded-2xl bg-sky-400 p-5 text-slate-950",
        h("h3", "font-semibold", "Free for side projects"),
        h("p", "mt-1 text-[14px] text-slate-800", "Up to 3 databases, no card needed."),
      ),
    ),
  },
  {
    name: "About me page",
    kind: "Personal",
    note: "A mix of square and wide cells, like a profile; it keeps two columns from 768px.",
    node: h("div", "grid gap-3 auto-rows-[minmax(130px,auto)] [grid-template-areas:'a'_'b'_'c'_'d'_'e'] md:grid-cols-2 md:[grid-template-areas:'a_a'_'b_c'_'d_e'] lg:grid-cols-4 lg:[grid-template-areas:'a_a_b_c'_'d_e_e_c']",
      h("article", "[grid-area:a] flex items-center gap-5 rounded-[28px] bg-[#fff4e6] p-6",
        h("span", "grid h-20 w-20 shrink-0 place-items-center rounded-full bg-amber-600 text-[24px] font-semibold text-white", hide, "TO"),
        h("div", "", h("h3", "text-[22px] font-semibold text-stone-900", "Tobi Okafor"), h("p", "mt-1 text-[14px] text-stone-600", "Frontend engineer in Lisbon. Writes about forms, type and slow software.")),
      ),
      h("a", "[grid-area:b] flex flex-col justify-between rounded-[28px] bg-[#1d2733] p-5 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600", $({ href: "#" }),
        h("span", "text-[13px] text-slate-300", "Newsletter"), h("span", "text-[18px] font-semibold", "Field Notes, every other Sunday"),
      ),
      h("article", "[grid-area:c] rounded-[28px] bg-white p-5 ring-1 ring-stone-200",
        h("h3", "font-semibold text-stone-900", "Now"),
        h("ul", "mt-3 space-y-2 text-[14px] text-stone-600", h("li", "", "Rebuilding a train timetable app"), h("li", "", "Reading about colour spaces"), h("li", "", "Learning to bake rye")),
      ),
      h("article", "[grid-area:d] rounded-[28px] bg-amber-100 p-5",
        h("p", "text-[34px] font-semibold text-stone-900", "11 yrs"), h("p", "text-[14px] text-stone-700", "shipping for the web"),
      ),
      h("article", "[grid-area:e] flex flex-wrap content-center gap-2 rounded-[28px] bg-white p-5 ring-1 ring-stone-200",
        ...["TypeScript", "CSS layout", "Accessibility", "Design systems", "Svelte"].map((s) => h("span", "rounded-full bg-stone-100 px-3 py-1.5 text-[13px] text-stone-700", s)),
      ),
    ),
  },
  {
    name: "Café homepage",
    kind: "Local business",
    note: "Opening hours and the map tile sit side by side; the menu tile spans the full width below.",
    node: h("div", "grid gap-3 auto-rows-[minmax(130px,auto)] [grid-template-areas:'a'_'b'_'c'_'d'] md:grid-cols-2 md:[grid-template-areas:'a_a'_'b_c'_'d_d'] lg:grid-cols-4 lg:[grid-template-areas:'a_a_b_c'_'d_d_d_c']",
      h("article", "[grid-area:a] rounded-2xl bg-[#3d2b1f] p-6 text-[#f6ede1]",
        h("p", "text-[12px] uppercase tracking-[0.2em] text-[#d9c3a5]", "Since 2014"),
        h("h3", "mt-2 font-serif text-[30px] leading-tight", "Small Hours Coffee"),
        h("p", "mt-2 text-[14px] text-[#e8d8c3]", "Roasted on Tuesdays, baked every morning, open late on Fridays."),
      ),
      h("article", "[grid-area:b] rounded-2xl bg-[#f3e9dc] p-5",
        h("h3", "font-semibold text-[#3d2b1f]", "Hours"),
        h("dl", "mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[14px] text-[#5a4636]",
          h("dt", "", "Mon to Thu"), h("dd", "text-right", "7:00 to 17:00"), h("dt", "", "Fri"), h("dd", "text-right", "7:00 to 22:00"), h("dt", "", "Sat, Sun"), h("dd", "text-right", "8:00 to 16:00")),
      ),
      h("article", "[grid-area:c] relative min-h-[200px] overflow-hidden rounded-2xl bg-[#e4ddd1] p-5",
        h("svg", "absolute inset-0 h-full w-full", $({ viewBox: "0 0 200 200", preserveAspectRatio: "xMidYMid slice", "aria-hidden": "true" }),
          h("path", "", $({ d: "M0 60 H200 M0 140 H200 M60 0 V200 M150 0 V200", stroke: "#fbf8f3", "stroke-width": "10", fill: "none" })),
          h("path", "", $({ d: "M0 100 C60 90 120 120 200 96", stroke: "#bcd3dc", "stroke-width": "14", fill: "none" })),
          h("circle", "", $({ cx: "104", cy: "64", r: "9", fill: "#b45309" })),
        ),
        h("p", "relative mt-auto rounded-lg bg-white/90 px-3 py-2 text-[13px] text-stone-700", "14 Quay Lane, by the footbridge"),
      ),
      h("article", "[grid-area:d] rounded-2xl bg-white p-5 ring-1 ring-[#3d2b1f]/10",
        h("h3", "font-semibold text-[#3d2b1f]", "On the counter today"),
        h("ul", "mt-3 grid gap-2 text-[14px] text-[#5a4636] sm:grid-cols-3",
          h("li", "", "Cardamom bun, $4.20"), h("li", "", "Leek and gruyère tart, $7.50"), h("li", "", "Batch brew, $3.10")),
      ),
    ),
  },
  {
    name: "Company and hiring",
    kind: "Content",
    note: "An asymmetric grid where the hiring tile reaches down two rows on desktop.",
    node: h("div", "grid gap-3 auto-rows-[minmax(130px,auto)] [grid-template-areas:'a'_'b'_'c'_'d'_'e'] md:grid-cols-2 md:[grid-template-areas:'a_b'_'c_b'_'d_e'] lg:grid-cols-3 lg:[grid-template-areas:'a_a_b'_'c_d_b'_'c_e_e']",
      h("article", "[grid-area:a] rounded-xl bg-[#0f2a44] p-6 text-white",
        h("h3", "text-[24px] font-semibold leading-tight", "We build tools for people who run warehouses."),
        h("p", "mt-2 text-[14px] text-sky-100", "Thirty-two of us, across four time zones, one shared calendar."),
      ),
      h("article", "[grid-area:b] flex flex-col rounded-xl bg-white p-5 ring-1 ring-slate-200",
        h("p", "text-[12px] font-semibold uppercase tracking-wider text-sky-800", "Hiring"),
        h("ul", "mt-3 divide-y divide-slate-100 text-[14px]",
          ...[["Senior backend engineer", "Remote, EU"], ["Product designer", "Rotterdam"], ["Support lead", "Remote, US"]].map(([a, b]) => h("li", "py-2.5", h("strong", "block font-semibold text-slate-900", a), h("span", "text-slate-600", b)))),
        h("a", "mt-auto inline-flex min-h-[40px] items-center text-[14px] font-semibold text-sky-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-800", $({ href: "#" }), "All open roles"),
      ),
      h("article", "[grid-area:c] rounded-xl bg-sky-50 p-5",
        h("h3", "font-semibold text-slate-900", "How we work"),
        h("ul", "mt-3 space-y-2 text-[14px] text-slate-700", h("li", "", "Written proposals before meetings"), h("li", "", "Four-day weeks in August"), h("li", "", "Customers on every planning call")),
      ),
      h("article", "[grid-area:d] rounded-xl bg-white p-5 ring-1 ring-slate-200",
        h("h3", "font-semibold text-slate-900", "The team"), initials(["RM", "JK", "AL", "SP", "+28"], "bg-sky-100 text-sky-900 ring-white"),
      ),
      h("article", "[grid-area:e] rounded-xl bg-white p-5 ring-1 ring-slate-200",
        h("h3", "font-semibold text-slate-900", "Offices"), h("p", "mt-1 text-[14px] text-slate-600", "Rotterdam, Halifax and a long table in Porto."),
      ),
    ),
  },
  {
    name: "Changelog highlights",
    kind: "Content",
    note: "Three columns of news where the latest release takes two columns and two rows.",
    node: h("div", "grid gap-3 auto-rows-[minmax(120px,auto)] [grid-template-areas:'a'_'b'_'c'_'d'] md:grid-cols-2 md:[grid-template-areas:'a_a'_'b_c'_'d_d'] lg:grid-cols-3 lg:[grid-template-areas:'a_a_b'_'a_a_c'_'d_d_d']",
      h("article", "[grid-area:a] rounded-2xl bg-white p-6 ring-1 ring-rose-200",
        h("p", "font-mono text-[12px] text-rose-700", "v5.0 · Oct 9"),
        h("h3", "mt-2 text-[24px] font-semibold text-slate-900", "Offline mode"),
        h("p", "mt-2 max-w-md text-[14px] text-slate-600", "Edit on a train, sync when you are back. Conflicts show side by side so you choose which change wins."),
        h("div", "mt-5 grid grid-cols-2 gap-2", hide, h("span", "h-20 rounded-lg bg-rose-50 ring-1 ring-rose-100"), h("span", "h-20 rounded-lg bg-rose-100")),
      ),
      h("article", "[grid-area:b] rounded-2xl bg-rose-700 p-5 text-white",
        h("p", "font-mono text-[12px] text-rose-100", "v4.9 · Sep 24"), h("h3", "mt-1 font-semibold", "Keyboard shortcuts you can change"),
      ),
      h("article", "[grid-area:c] rounded-2xl bg-white p-5 ring-1 ring-rose-200",
        h("p", "font-mono text-[12px] text-slate-600", "v4.8 · Sep 3"), h("h3", "mt-1 font-semibold text-slate-900", "Export to Markdown"),
      ),
      h("article", "[grid-area:d] flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 p-5 text-white",
        h("p", "text-[14px]", "Get one email when a release ships. Nothing else."),
        h("a", "inline-flex min-h-[40px] items-center rounded-lg bg-white px-4 text-[14px] font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900", $({ href: "#" }), "Subscribe"),
      ),
    ),
  },
  {
    name: "Mobile app launch",
    kind: "Product",
    note: "A phone tile in the middle column with features either side; it centres the phone on tablets.",
    node: h("div", "grid gap-3 auto-rows-[minmax(120px,auto)] [grid-template-areas:'c'_'a'_'b'_'d'_'e'] md:grid-cols-2 md:[grid-template-areas:'c_c'_'a_b'_'d_e'] lg:grid-cols-3 lg:[grid-template-areas:'a_c_b'_'d_c_e']",
      h("article", "[grid-area:a] rounded-3xl bg-violet-50 p-5",
        h("h3", "font-semibold text-violet-950", "Plans that move with you"), h("p", "mt-1 text-[14px] text-violet-900/80", "Miss a session and the week rearranges itself."),
      ),
      h("article", "[grid-area:b] rounded-3xl bg-violet-50 p-5",
        h("h3", "font-semibold text-violet-950", "Ten-minute days"), h("p", "mt-1 text-[14px] text-violet-900/80", "Short routines for when the calendar is full."),
      ),
      h("article", "[grid-area:c] grid place-items-center rounded-3xl bg-violet-700 p-6",
        h("div", "mx-auto w-40 rounded-[28px] border-[6px] border-violet-950 bg-white p-3 shadow-xl", hide,
          h("div", "mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200"),
          h("p", "text-[11px] font-semibold text-slate-900", "Today"),
          h("div", "mt-2 h-16 rounded-xl bg-violet-100"),
          h("div", "mt-2 h-3 w-3/4 rounded bg-slate-100"),
          h("div", "mt-1.5 h-3 w-1/2 rounded bg-slate-100"),
          h("div", "mt-3 h-8 rounded-lg bg-violet-600"),
        ),
      ),
      h("article", "[grid-area:d] rounded-3xl bg-white p-5 ring-1 ring-violet-200",
        h("p", "text-[30px] font-semibold text-violet-950", "Free"), h("p", "text-[14px] text-slate-600", "for the first month, then $6.99"),
      ),
      h("article", "[grid-area:e] flex flex-col justify-center gap-2 rounded-3xl bg-white p-5 ring-1 ring-violet-200",
        h("a", "inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-900 text-[14px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2", $({ href: "#" }), "Download for iPhone"),
        h("a", "inline-flex min-h-[44px] items-center justify-center rounded-xl ring-1 ring-slate-300 text-[14px] font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700", $({ href: "#" }), "Download for Android"),
      ),
    ),
  },
];

/* ---------- serialising ---------- */
const VOID = new Set(["path", "circle", "rect", "input", "img", "br"]);
const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const reactKey = (k: string) => (k.startsWith("aria-") || k.startsWith("data-") ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));
const styleObj = (s: string) =>
  Object.fromEntries(s.split(";").filter(Boolean).map((d) => { const [k, v] = d.split(":"); return [reactKey(k.trim()), v.trim()]; }));

function toReact(n: N, key: string | number): ReactNode {
  if (typeof n === "string") return n;
  const props: Record<string, unknown> = { key };
  if (n.c) props.className = n.c;
  for (const [k, v] of Object.entries(n.a ?? {})) props[k === "style" ? "style" : reactKey(k)] = k === "style" ? styleObj(v) : v;
  return createElement(n.t, props, ...n.k.map((k, i) => toReact(k, i)));
}

function serial(n: N, depth: number, jsx: boolean, inPre = false): string {
  const pad = inPre ? "" : "  ".repeat(depth);
  if (typeof n === "string") return pad + (jsx && !inPre ? escHtml(n).replace(/[{}]/g, (c) => `{"${c}"}`) : escHtml(n));
  const attrs: string[] = [];
  if (n.c) attrs.push(`${jsx ? "className" : "class"}="${n.c}"`);
  for (const [k, v] of Object.entries(n.a ?? {})) {
    if (jsx && k === "style") attrs.push(`style={${JSON.stringify(styleObj(v))}}`);
    else attrs.push(`${jsx ? reactKey(k) : k}="${v}"`);
  }
  const open = `<${n.t}${attrs.length ? " " + attrs.join(" ") : ""}`;
  if (VOID.has(n.t) && !n.k.length) return `${pad}${open} />`;
  const pre = inPre || n.t === "pre";
  if (pre && jsx) return `${pad}${open}>{${JSON.stringify(textOf(n))}}</${n.t}>`;
  if (pre || n.k.every((k) => typeof k === "string")) return `${pad}${open}>${n.k.map((k) => serial(k, 0, jsx, pre)).join("")}</${n.t}>`;
  return `${pad}${open}>\n${n.k.map((k) => serial(k, depth + 1, jsx)).join("\n")}\n${pad}</${n.t}>`;
}
const textOf = (n: N): string => (typeof n === "string" ? n : n.k.map(textOf).join(""));

type Areas = { cols: number; rows: string[] };
/** Reads the grid classes back into column counts and area rows for each breakpoint. */
function areasOf(cls: string): Record<"base" | "md" | "lg", Areas> {
  const out: Record<string, Areas> = { base: { cols: 1, rows: [] }, md: { cols: 1, rows: [] }, lg: { cols: 1, rows: [] } };
  for (const m of cls.matchAll(/(?:(md|lg):)?\[grid-template-areas:([^\]]+)\]/g)) out[m[1] ?? "base"].rows = m[2].split("_'").map((r) => r.replace(/'/g, "").replace(/_/g, " "));
  for (const m of cls.matchAll(/(md|lg):grid-cols-(\d+)/g)) out[m[1]].cols = Number(m[2]);
  return out as Record<"base" | "md" | "lg", Areas>;
}
function cssOf(l: Layout): string {
  const a = areasOf(l.node.c ?? "");
  const names = [...new Set(a.base.rows.join(" ").split(" "))];
  const minRow = /auto-rows-\[minmax\((\d+px)/.exec(l.node.c ?? "")?.[1] ?? "140px";
  const tpl = (x: Areas) => x.rows.map((r) => `"${r}"`).join("\n    ");
  return `/* ${l.name}: layout only. Put class="bento" on the grid and tile-a, tile-b ... on the tiles. */
.bento {
  display: grid;
  gap: 12px;
  grid-auto-rows: minmax(${minRow}, auto);
  grid-template-columns: 1fr;
  grid-template-areas:
    ${tpl(a.base)};
}
${names.map((n) => `.tile-${n} { grid-area: ${n}; }`).join("\n")}

@media (min-width: 768px) {
  .bento {
    grid-template-columns: repeat(${a.md.cols}, minmax(0, 1fr));
    grid-template-areas:
    ${tpl(a.md)};
  }
}
@media (min-width: 1024px) {
  .bento {
    grid-template-columns: repeat(${a.lg.cols}, minmax(0, 1fr));
    grid-template-areas:
    ${tpl(a.lg)};
  }
}
`;
}

type Lang = "html" | "jsx" | "css";
const LANGS: { k: Lang; label: string }[] = [
  { k: "html", label: "Tailwind HTML" },
  { k: "jsx", label: "React JSX" },
  { k: "css", label: "CSS layout" },
];
function codeFor(l: Layout, lang: Lang): string {
  if (lang === "css") return cssOf(l);
  const body = serial(l.node, lang === "jsx" ? 2 : 0, lang === "jsx");
  if (lang === "html") return body + "\n";
  const fn = l.name.replace(/[^A-Za-z ]/g, "").split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  return `export default function ${fn}Bento() {\n  return (\n${body}\n  );\n}\n`;
}

const TILE_TINT = ["bg-indigo-200", "bg-amber-200", "bg-emerald-200", "bg-rose-200", "bg-sky-200", "bg-violet-200"];

function Wire({ a, label }: { a: Areas; label: string }) {
  const names = [...new Set(a.rows.join(" ").split(" "))].sort();
  return (
    <figure className="min-w-0">
      <div
        className="grid gap-1 rounded-lg bg-white p-1.5 ring-1 ring-stone-200"
        style={{ gridTemplateColumns: `repeat(${a.cols}, minmax(0, 1fr))`, gridTemplateAreas: a.rows.map((r) => `"${r}"`).join(" "), gridAutoRows: "22px" }}
        aria-hidden="true"
      >
        {names.map((n) => (
          <span key={n} className={`grid place-items-center rounded font-mono text-[11px] font-semibold text-stone-800 ${TILE_TINT[n.charCodeAt(0) % TILE_TINT.length]}`} style={{ gridArea: n }}>
            {n}
          </span>
        ))}
      </div>
      <figcaption className="mt-1.5 font-mono text-[11px] text-stone-600">{label}</figcaption>
    </figure>
  );
}

export default function BentoGridCollection() {
  const [sel, setSel] = useState(0);
  const [lang, setLang] = useState<Lang>("html");
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const l = LAYOUTS[sel];
  const areas = useMemo(() => areasOf(l.node.c ?? ""), [l]);
  const code = codeFor(l, lang);

  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const last = LAYOUTS.length - 1;
    const next = e.key === "ArrowRight" ? (i === last ? 0 : i + 1) : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (next < 0) return;
    e.preventDefault();
    setSel(next);
    tabs.current[next]?.focus();
  }

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(code);
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) setShowCode(true);
    setCopied(ok ? lang : null);
    setAnnounce(ok ? `${LANGS.find((x) => x.k === lang)?.label} for ${l.name} copied` : "Copy was blocked, the code is shown so you can select it");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  }

  const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f2ee]";

  return (
    <section className="bg-[#f4f2ee] px-4 py-12 text-stone-900 sm:px-8 sm:py-16" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">Tailwind · React · plain CSS</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">{LAYOUTS.length} bento grid layouts</h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone-600">
            Every layout is placed with named grid areas, so the map of tiles below the preview is the actual layout code. Pick one, resize the window to watch it collapse, then copy it.
          </p>
        </header>

        <div role="tablist" aria-label="Bento layouts" className="mt-7 flex gap-1.5 overflow-x-auto pb-2 lg:flex-wrap">
          {LAYOUTS.map((x, i) => (
            <button
              key={x.name}
              ref={(el) => { tabs.current[i] = el; }}
              type="button"
              role="tab"
              id={`bt-tab-${i}`}
              aria-selected={sel === i}
              aria-controls="bt-panel"
              tabIndex={sel === i ? 0 : -1}
              onClick={() => setSel(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={`inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-colors ${focus} ${sel === i ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"}`}
            >
              <span className={`font-mono text-[11px] ${sel === i ? "text-stone-300" : "text-stone-500"}`}>{String(i + 1).padStart(2, "0")}</span>
              {x.name}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="bt-panel" aria-labelledby={`bt-tab-${sel}`} className="mt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[18px] font-semibold tracking-tight">{l.name}</h3>
            <span className="rounded-full bg-white px-2.5 py-1 text-[12px] font-medium text-stone-700 ring-1 ring-stone-200">{l.kind}</span>
          </div>
          <div className="mt-3 rounded-[22px] bg-[#e9e6e0] p-3 sm:p-4">{toReact(l.node, sel)}</div>

          <div className="mt-5 grid gap-5 rounded-2xl bg-white p-5 ring-1 ring-stone-200 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <h4 className="text-[14px] font-semibold">How it collapses</h4>
              <p className="mt-1 text-[13px] leading-relaxed text-stone-600">{l.note} Each letter is a grid area name; the same names appear in the classes and the CSS.</p>
              <div className="mt-4 grid grid-cols-[0.6fr_1fr_1.6fr] items-start gap-3">
                <Wire a={areas.base} label="Phone, 1 column" />
                <Wire a={areas.md} label={`768px, ${areas.md.cols} columns`} />
                <Wire a={areas.lg} label={`1024px, ${areas.lg.cols} columns`} />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div role="group" aria-label="Code format" className="flex rounded-lg bg-stone-100 p-1">
                  {LANGS.map((x) => (
                    <button key={x.k} type="button" aria-pressed={lang === x.k} onClick={() => setLang(x.k)} className={`min-h-[36px] rounded-md px-2.5 text-[12.5px] font-medium ${focus} ${lang === x.k ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}>
                      {x.label}
                    </button>
                  ))}
                </div>
                <button type="button" aria-expanded={showCode} aria-controls="bt-code" onClick={() => setShowCode(!showCode)} className={`min-h-[40px] rounded-lg px-3 text-[13px] font-medium text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100 ${focus}`}>
                  {showCode ? "Hide code" : "View code"}
                </button>
                <button type="button" onClick={copy} className={`min-h-[40px] rounded-lg px-3 text-[13px] font-semibold text-white ${focus} ${copied === lang ? "bg-emerald-700" : "bg-stone-900 hover:bg-stone-700"}`}>
                  {copied === lang ? "Copied" : `Copy ${LANGS.find((x) => x.k === lang)?.label}`}
                </button>
              </div>
              <pre id="bt-code" tabIndex={0} className={`mt-3 overflow-auto whitespace-pre rounded-xl bg-[#16181d] p-4 font-mono text-[11.5px] leading-[1.6] text-stone-100 ${showCode ? "max-h-[420px]" : "max-h-[170px]"}`}>
                <code>{code}</code>
              </pre>
            </div>
          </div>
          <p className="sr-only" aria-live="polite">{announce}</p>
        </div>
      </div>
    </section>
  );
}
