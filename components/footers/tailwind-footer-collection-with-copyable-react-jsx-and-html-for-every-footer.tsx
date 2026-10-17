import { createElement, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, SyntheticEvent } from "react";

/*
  Tailwind footer collection.
  Every footer is written once as a small tree of elements and Tailwind classes. The same tree
  renders the live preview, the React JSX you copy and the plain HTML you copy, so the code
  always matches the picture.
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

/* ---------- icons: generic 24px stroke drawings, no brand logos ---------- */
const ICONS = {
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9S14.5 18.4 12 21c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z",
  rss: "M5 5a14 14 0 0 1 14 14M5 11a8 8 0 0 1 8 8M6 19h.01",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  video: "M3 6h13v12H3zM16 10l5-3v10l-5-3",
  chat: "M4 5h16v11H9l-5 4z",
  at: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z",
  pin: "M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  arrow: "M5 12h14M13 6l6 6-6 6",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  arrowUR: "M7 17L17 7M8 7h9v9",
  code: "M8 7l-5 5 5 5M16 7l5 5-5 5",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M18 14a6 6 0 0 1 4 7",
  device: "M7 2h10v20H7zM11 18h2",
  check: "M5 12.5l4.5 4.5L19 7",
  truck: "M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01",
  back: "M9 14l-5-5 5-5M4 9h11a5 5 0 0 1 0 10h-3",
  lock: "M6 11h12v10H6zM9 11V8a3 3 0 0 1 6 0v3",
  mic: "M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zM6 11a6 6 0 0 0 12 0M12 17v4",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  gift: "M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-1.5-3-5-3-5 0M12 7c1.5-3 5-3 5 0",
  pen: "M4 20l4-1 11-11-3-3L5 16zM14 6l3 3",
  book: "M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4zM5 16a4 4 0 0 1 4-4h10",
  play: "M8 5v14l11-7z",
} as const;
type IconName = keyof typeof ICONS;

const SVG_A: Attrs = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" };
const ico = (n: IconName, c = "h-5 w-5") => h("svg", c, $(SVG_A), h("path", "", $({ d: ICONS[n] })));
const A = (text: string, c: string, ...more: Kid[]) => h("a", c, $({ href: "#" }), text, ...more);
const soc = (n: IconName, label: string, c: string, ic = "h-5 w-5") => h("a", c, $({ href: "#", "aria-label": label }), ico(n, ic));
const list = (ul: string, li: string, items: N[]) => h("ul", ul, ...items.map((x) => h("li", li, x)));
const col = (title: string, links: string[], o: { h: string; ul: string; a: string; wrap?: string }) =>
  h("div", o.wrap ?? "", h("h2", o.h, title), list(o.ul, "", links.map((l) => A(l, o.a))));
const mark = (shape: "dot" | "square" | "ring" | "split" | "arc", c: string) => {
  const paths: Record<string, Kid[]> = {
    dot: [h("circle", "", $({ cx: "12", cy: "12", r: "9", fill: "currentColor" }))],
    square: [h("rect", "", $({ x: "3", y: "3", width: "18", height: "18", rx: "5", fill: "currentColor" }))],
    ring: [h("circle", "", $({ cx: "12", cy: "12", r: "8", fill: "none", stroke: "currentColor", "stroke-width": "4" }))],
    split: [h("path", "", $({ d: "M3 12a9 9 0 0 1 18 0z", fill: "currentColor" })), h("path", "", $({ d: "M3 14h18a9 9 0 0 1-18 0z", fill: "currentColor", opacity: ".45" }))],
    arc: [h("path", "", $({ d: "M4 20V12a8 8 0 0 1 16 0v8h-5v-8a3 3 0 0 0-6 0v8z", fill: "currentColor" }))],
  };
  return h("svg", c, $({ viewBox: "0 0 24 24", "aria-hidden": "true" }), ...paths[shape]);
};
const focus = (ring: string) => `rounded focus-visible:outline-none focus-visible:ring-2 ${ring}`;

/* ---------- the collection ---------- */
const FAMILIES = {
  columns: "Multi-column",
  newsletter: "Newsletter",
  wordmark: "Big wordmark",
  minimal: "Minimal",
  dark: "Dark",
  app: "App download",
  contact: "Contact and map",
  social: "Social icons",
  legal: "Legal bar",
  sitemap: "Sitemap",
  local: "Local business",
  shop: "Ecommerce",
} as const;
type Family = keyof typeof FAMILIES;
type Item = { f: Family; name: string; node: El };

const fz = focus("focus-visible:ring-indigo-600");
const ITEMS: Item[] = [];
const add = (f: Family, name: string, node: El) => ITEMS.push({ f, name, node });

/* 1. Five column product footer */
{
  const o = { h: "text-sm font-semibold text-slate-900", ul: "mt-4 space-y-3", a: `text-sm text-slate-600 hover:text-slate-900 ${fz}` };
  add("columns", "Five column product", h("footer", "border-t border-slate-200 bg-white",
    h("div", "mx-auto max-w-7xl px-6 py-16",
      h("div", "grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]",
        h("div", "col-span-2 max-w-xs lg:col-span-1",
          h("a", `inline-flex items-center gap-2 ${fz}`, $({ href: "#" }), mark("split", "h-7 w-7 text-indigo-600"), h("span", "text-lg font-semibold tracking-tight text-slate-900", "Northwind Ledger")),
          h("p", "mt-4 text-sm leading-6 text-slate-600", "Bookkeeping, invoices and payroll for small teams that would rather be doing the work."),
          h("div", "mt-6 flex gap-2",
            soc("mail", "Email us", `grid h-10 w-10 place-items-center rounded-lg text-slate-500 ring-1 ring-slate-200 hover:text-slate-900 ${fz}`),
            soc("rss", "Blog feed", `grid h-10 w-10 place-items-center rounded-lg text-slate-500 ring-1 ring-slate-200 hover:text-slate-900 ${fz}`),
            soc("video", "Video tutorials", `grid h-10 w-10 place-items-center rounded-lg text-slate-500 ring-1 ring-slate-200 hover:text-slate-900 ${fz}`))),
        h("nav", "contents", $({ "aria-label": "Footer" }),
          col("Product", ["Invoicing", "Expenses", "Payroll", "Reports", "Pricing"], o),
          col("Solutions", ["Freelancers", "Agencies", "Retail", "Nonprofits"], o),
          col("Resources", ["Help centre", "Guides", "Templates", "Webinars"], o),
          col("Company", ["About", "Careers", "Press", "Contact"], o))),
      h("div", "mt-16 flex flex-col gap-4 border-t border-slate-200 pt-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between",
        h("p", "", "© 2026 Northwind Ledger Ltd. All rights reserved."),
        list("flex flex-wrap gap-x-6 gap-y-2", "", [A("Privacy", `hover:text-slate-900 ${fz}`), A("Terms", `hover:text-slate-900 ${fz}`), A("Security", `hover:text-slate-900 ${fz}`)])))));
}

/* 2. Centered four columns, warm stone */
{
  const r = focus("focus-visible:ring-stone-900");
  const o = { h: "text-xs font-semibold uppercase tracking-[0.16em] text-stone-500", ul: "mt-5 space-y-3", a: `text-[15px] text-stone-800 hover:underline underline-offset-4 ${r}` };
  add("columns", "Stone four column", h("footer", "bg-[#f4f1ec]",
    h("div", "mx-auto max-w-6xl px-6 pb-10 pt-20",
      h("div", "flex flex-col items-center text-center",
        h("p", "font-serif text-3xl tracking-tight text-stone-900", "Fernhill Studio"),
        h("p", "mt-3 max-w-md text-[15px] leading-7 text-stone-600", "Handmade stoneware from a small workshop on the edge of the moors.")),
      h("nav", "mt-16 grid grid-cols-2 gap-10 border-y border-stone-300 py-12 md:grid-cols-4", $({ "aria-label": "Footer" }),
        col("Shop", ["Tableware", "Vases", "Seconds", "Gift cards"], o),
        col("Studio", ["Our story", "The kiln", "Stockists"], o),
        col("Classes", ["Wheel basics", "Glaze weekends", "Private lessons"], o),
        col("Help", ["Delivery", "Care guide", "Contact"], o)),
      h("p", "mt-8 text-center text-sm text-stone-600", "© 2026 Fernhill Studio. Made by hand, packed with care."))));
}

/* 3. Dark developer tool with status */
{
  const r = focus("focus-visible:ring-sky-400");
  const o = { h: "text-sm font-medium text-white", ul: "mt-4 space-y-2.5", a: `text-sm text-slate-400 hover:text-white ${r}` };
  add("dark", "Developer tool with status", h("footer", "bg-slate-950 text-slate-400",
    h("div", "mx-auto max-w-7xl px-6 py-16",
      h("div", "grid gap-12 md:grid-cols-2 lg:grid-cols-6",
        h("div", "lg:col-span-2",
          h("a", `inline-flex items-center gap-2 text-white ${r}`, $({ href: "#" }), ico("code", "h-6 w-6 text-sky-400"), h("span", "font-mono text-lg font-semibold", "quillstack")),
          h("p", "mt-4 max-w-xs text-sm leading-6", "Typed content APIs for teams who ship every day."),
          h("a", `mt-6 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-700 ${r}`, $({ href: "#" }),
            h("span", "h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.2)]"), "All systems normal")),
        h("nav", "contents", $({ "aria-label": "Footer" }),
          col("Product", ["Content API", "Schema editor", "Webhooks", "Changelog"], o),
          col("Developers", ["Docs", "CLI", "SDKs", "API status"], o),
          col("Company", ["About", "Blog", "Careers", "Brand"], o),
          col("Legal", ["Privacy", "Terms", "DPA", "Subprocessors"], o))),
      h("div", "mt-16 flex flex-col gap-4 border-t border-slate-800 pt-8 text-xs sm:flex-row sm:justify-between",
        h("p", "font-mono", "© 2026 Quillstack, Inc."),
        h("div", "flex gap-3",
          soc("code", "Source code", `grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white ${r}`),
          soc("chat", "Community forum", `grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white ${r}`),
          soc("rss", "Changelog feed", `grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white ${r}`))))));
}

/* 4. Newsletter card above links */
{
  const r = focus("focus-visible:ring-sky-700");
  add("newsletter", "Newsletter card on top", h("footer", "bg-sky-50",
    h("div", "mx-auto max-w-6xl px-6 py-16",
      h("div", "grid gap-8 rounded-3xl bg-white p-8 shadow-[0_1px_2px_rgba(2,32,71,0.06),0_12px_32px_-12px_rgba(2,32,71,0.18)] ring-1 ring-sky-100 md:grid-cols-2 md:items-center md:p-12",
        h("div", "",
          h("h2", "text-2xl font-semibold tracking-tight text-slate-900", "The Tidewater Journal"),
          h("p", "mt-2 text-[15px] leading-7 text-slate-600", "One long read about the coast every Sunday. No ads, unsubscribe in one click.")),
        h("form", "flex flex-col gap-3 sm:flex-row", $({ action: "#" }),
          h("label", "sr-only", $({ for: "f4-email" }), "Email address"),
          h("input", "h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20", $({ id: "f4-email", name: "email", type: "email", required: "", autocomplete: "email", placeholder: "you@example.com" })),
          h("button", `h-12 rounded-xl bg-sky-700 px-6 text-[15px] font-semibold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2`, $({ type: "submit" }), "Subscribe"))),
      h("div", "mt-12 flex flex-col gap-6 text-sm text-slate-600 md:flex-row md:items-center md:justify-between",
        h("p", "font-semibold text-slate-900", "Tidewater"),
        h("nav", "", $({ "aria-label": "Footer" }), list("flex flex-wrap gap-x-7 gap-y-3", "", ["Stories", "Photo essays", "Tide tables", "About", "Advertise"].map((l) => A(l, `hover:text-slate-900 ${r}`)))),
        h("p", "", "© 2026 Tidewater Media")))));
}

/* 5. Coffee roaster newsletter, dark amber */
{
  const r = focus("focus-visible:ring-amber-300");
  const o = { h: "text-sm font-semibold text-amber-100", ul: "mt-4 space-y-3", a: `text-sm text-amber-100/70 hover:text-amber-50 ${r}` };
  add("newsletter", "Roaster newsletter strip", h("footer", "bg-[#2a1810] text-amber-100",
    h("div", "mx-auto max-w-7xl px-6",
      h("div", "flex flex-col gap-6 border-b border-amber-100/15 py-12 lg:flex-row lg:items-center lg:justify-between",
        h("div", "",
          h("h2", "text-2xl font-semibold tracking-tight text-amber-50", "Fresh roasts, first."),
          h("p", "mt-1 text-[15px] text-amber-100/70", "Hear about new single origins before they sell out.")),
        h("form", "flex w-full max-w-md overflow-hidden rounded-full bg-amber-50/10 p-1 ring-1 ring-amber-100/20 focus-within:ring-amber-300", $({ action: "#" }),
          h("label", "sr-only", $({ for: "f5-email" }), "Email address"),
          h("input", "h-11 min-w-0 flex-1 bg-transparent px-4 text-[15px] text-amber-50 placeholder:text-amber-100/70 focus:outline-none", $({ id: "f5-email", name: "email", type: "email", required: "", autocomplete: "email", placeholder: "Email address" })),
          h("button", "h-11 rounded-full bg-amber-300 px-5 text-sm font-semibold text-[#2a1810] hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-100", $({ type: "submit" }), "Join the list"))),
      h("div", "grid grid-cols-2 gap-10 py-12 md:grid-cols-4",
        h("div", "col-span-2 md:col-span-1",
          h("p", "font-serif text-2xl text-amber-50", "Ember & Oak"),
          h("p", "mt-3 text-sm leading-6 text-amber-100/70", "Roasted in small batches on Tanner Street since 2014.")),
        col("Coffee", ["Single origin", "Blends", "Decaf", "Subscriptions"], o),
        col("Brew", ["Pour over guide", "Espresso guide", "Grinders"], o),
        col("Visit", ["Roastery café", "Wholesale", "Contact"], o)),
      h("p", "border-t border-amber-100/15 py-6 text-xs text-amber-100/70", "© 2026 Ember & Oak Coffee Roasters"))));
}

/* 6. Big newsletter split, green */
{
  const r = focus("focus-visible:ring-emerald-900");
  add("newsletter", "Oversized signup", h("footer", "bg-emerald-200 text-emerald-950",
    h("div", "mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2",
      h("div", "",
        h("h2", "text-5xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-6xl", "Good ideas, every Friday."),
        h("p", "mt-6 max-w-md text-lg text-emerald-900", "Paperplane Weekly sends five links worth your time and one we made ourselves.")),
      h("div", "flex flex-col justify-end",
        h("form", "border-b-2 border-emerald-950 pb-3", $({ action: "#" }),
          h("label", "text-sm font-medium", $({ for: "f6-email" }), "Your email"),
          h("div", "mt-2 flex items-center gap-3",
            h("input", "h-14 min-w-0 flex-1 bg-transparent text-2xl placeholder:text-emerald-900/50 focus:outline-none", $({ id: "f6-email", name: "email", type: "email", required: "", autocomplete: "email", placeholder: "name@example.com" })),
            h("button", "grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emerald-950 text-emerald-100 hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-950 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-200", $({ type: "submit", "aria-label": "Subscribe" }), ico("arrow", "h-6 w-6")))),
        h("div", "mt-10 flex flex-wrap items-center justify-between gap-4 text-sm",
          list("flex gap-6", "", ["Archive", "About", "Sponsor"].map((l) => A(l, `font-medium hover:underline underline-offset-4 ${r}`))),
          h("p", "text-emerald-900", "© 2026 Paperplane Weekly"))))));
}

/* 7. Giant wordmark, black on cream */
{
  const r = focus("focus-visible:ring-black");
  const o = { h: "text-xs uppercase tracking-[0.2em] text-neutral-600", ul: "mt-4 space-y-2", a: `text-[15px] text-neutral-900 hover:underline underline-offset-4 ${r}` };
  add("wordmark", "Giant wordmark", h("footer", "overflow-hidden bg-[#efebe3] text-neutral-900",
    h("div", "mx-auto max-w-7xl px-6 pt-16",
      h("div", "grid gap-10 sm:grid-cols-2 lg:grid-cols-4",
        h("div", "",
          h("p", "text-xs uppercase tracking-[0.2em] text-neutral-600", "Studio"),
          h("p", "mt-4 text-[15px] leading-6", "Halden Furniture", h("br", ""), "14 Quay Lane, Bristol", h("br", ""), "hello@halden.example")),
        col("Collection", ["Chairs", "Tables", "Storage", "Lighting"], o),
        col("Company", ["Journal", "Makers", "Trade"], o),
        col("Follow", ["Photos", "Newsletter", "Videos"], o)),
      h("p", "mt-16 select-none text-[22vw] font-bold leading-[0.78] tracking-[-0.06em] lg:text-[17rem]", $({ "aria-hidden": "true" }), "HALDEN"),
      h("div", "flex justify-between border-t border-neutral-900/15 py-5 text-xs text-neutral-600",
        h("p", "", "© 2026 Halden Furniture"),
        h("p", "", "Designed and built in Bristol")))));
}

/* 8. Outlined wordmark, dark */
{
  const r = focus("focus-visible:ring-lime-300");
  add("wordmark", "Outline wordmark", h("footer", "overflow-hidden bg-zinc-950 text-zinc-300",
    h("div", "mx-auto max-w-7xl px-6 pt-16",
      h("div", "flex flex-col gap-10 md:flex-row md:items-start md:justify-between",
        h("div", "max-w-sm",
          h("p", "text-lg font-medium text-white", "Orbit is a design studio for climate companies."),
          h("a", `mt-5 inline-flex items-center gap-2 text-sm font-semibold text-lime-300 hover:text-lime-200 ${r}`, $({ href: "#" }), "Start a project", ico("arrowUR", "h-4 w-4"))),
        h("nav", "", $({ "aria-label": "Footer" }),
          list("grid grid-cols-2 gap-x-16 gap-y-3 text-[15px]", "", ["Work", "Services", "Studio", "Writing", "Careers", "Contact"].map((l) => A(l, `hover:text-white ${r}`))))),
      h("p", "mt-20 select-none text-[24vw] font-black leading-[0.8] tracking-[-0.05em] text-transparent [-webkit-text-stroke:2px_#71717a] lg:text-[19rem]", $({ "aria-hidden": "true" }), "orbit"),
      h("div", "flex flex-col gap-2 border-t border-zinc-800 py-6 text-xs text-zinc-400 sm:flex-row sm:justify-between",
        h("p", "", "© 2026 Orbit Studio"),
        list("flex gap-5", "", [A("Privacy", `hover:text-white ${r}`), A("Imprint", `hover:text-white ${r}`)])))));
}

/* 9. Colour-block wordmark */
{
  const r = focus("focus-visible:ring-rose-950");
  add("wordmark", "Colour block wordmark", h("footer", "bg-rose-600 text-rose-50",
    h("div", "mx-auto max-w-7xl px-6 py-12",
      h("div", "flex flex-col gap-8 md:flex-row md:items-end md:justify-between",
        h("p", "text-7xl font-semibold leading-none tracking-[-0.05em] text-rose-50 md:text-9xl", "Meadowlark"),
        h("div", "flex flex-col gap-1 text-sm md:items-end",
          h("p", "font-medium", "Summer festival, 18 to 20 July"),
          h("p", "text-rose-100", "Ashcombe Fields, open from 11:00"))),
      h("div", "mt-10 flex flex-col gap-5 border-t border-rose-200/40 pt-6 text-sm md:flex-row md:items-center md:justify-between",
        h("nav", "", $({ "aria-label": "Footer" }), list("flex flex-wrap gap-x-6 gap-y-2", "", ["Line-up", "Tickets", "Getting there", "Accessibility", "FAQ"].map((l) => A(l, `font-medium hover:underline underline-offset-4 ${r}`)))),
        h("div", "flex gap-2",
          soc("camera", "Photos", `grid h-10 w-10 place-items-center rounded-full bg-rose-50/15 hover:bg-rose-50/25 ${r}`),
          soc("video", "Videos", `grid h-10 w-10 place-items-center rounded-full bg-rose-50/15 hover:bg-rose-50/25 ${r}`),
          soc("mail", "Email", `grid h-10 w-10 place-items-center rounded-full bg-rose-50/15 hover:bg-rose-50/25 ${r}`))))));
}

/* 10. One line */
add("minimal", "One line", h("footer", "border-t border-slate-200 bg-white",
  h("div", "mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-600 sm:flex-row",
    h("p", "", "© 2026 Pinecrest Labs"),
    h("nav", "", $({ "aria-label": "Footer" }), list("flex gap-6", "", ["Privacy", "Terms", "Contact"].map((l) => A(l, `hover:text-slate-900 ${fz}`)))))));

/* 11. Centered logo and links */
{
  const r = focus("focus-visible:ring-violet-600");
  add("minimal", "Centered logo and links", h("footer", "bg-white",
    h("div", "mx-auto flex max-w-3xl flex-col items-center px-6 py-14 text-center",
      h("a", `inline-flex items-center gap-2 ${r}`, $({ href: "#" }), mark("ring", "h-7 w-7 text-violet-600"), h("span", "text-lg font-semibold tracking-tight text-slate-900", "Lumen Notes")),
      h("nav", "mt-8", $({ "aria-label": "Footer" }), list("flex flex-wrap justify-center gap-x-8 gap-y-3 text-[15px] text-slate-600", "", ["Features", "Pricing", "Templates", "Blog", "Help"].map((l) => A(l, `hover:text-slate-900 ${r}`)))),
      h("p", "mt-8 text-sm text-slate-600", "© 2026 Lumen Notes. Write it down, find it later."))));
}

/* 12. Two lines with back to top */
{
  const r = focus("focus-visible:ring-slate-900");
  add("minimal", "Back to top", h("footer", "bg-slate-50",
    h("div", "mx-auto max-w-7xl px-6 py-8",
      h("div", "flex items-center justify-between gap-4 border-b border-slate-200 pb-6",
        h("p", "text-[15px] font-semibold text-slate-900", "Cedar & Pine Photography"),
        h("a", `inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:text-slate-900 hover:ring-slate-300 ${r}`, $({ href: "#top" }), "Back to top", ico("arrowUp", "h-4 w-4"))),
      h("div", "flex flex-col gap-3 pt-6 text-sm text-slate-600 sm:flex-row sm:justify-between",
        h("p", "", "Weddings and portraits across the Lake District"),
        h("p", "", "© 2026 Cedar & Pine")))));
}

/* 13. Dark with language selector */
{
  const r = focus("focus-visible:ring-violet-400");
  const o = { h: "text-sm font-semibold text-white", ul: "mt-4 space-y-3", a: `text-sm text-neutral-400 hover:text-white ${r}` };
  add("dark", "Dark with language picker", h("footer", "bg-neutral-950 text-neutral-400",
    h("div", "mx-auto max-w-7xl px-6 py-16",
      h("div", "grid gap-10 sm:grid-cols-2 lg:grid-cols-5",
        h("div", "sm:col-span-2",
          h("p", "text-xl font-semibold tracking-tight text-white", "Nocturne Audio"),
          h("p", "mt-3 max-w-xs text-sm leading-6", "Closed-back headphones tuned for long sessions at the desk."),
          h("div", "mt-6 max-w-[220px]",
            h("label", "text-xs font-medium text-neutral-400", $({ for: "f13-lang" }), "Language and region"),
            h("div", "relative mt-2",
              ico("globe", "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"),
              h("select", "h-10 w-full appearance-none rounded-lg border border-neutral-800 bg-neutral-900 pl-9 pr-8 text-sm text-neutral-200 focus:border-violet-400 focus:outline-none", $({ id: "f13-lang" }),
                h("option", "", "English (UK)"), h("option", "", "English (US)"), h("option", "", "Deutsch"), h("option", "", "Français"))))),
        col("Shop", ["Headphones", "Ear pads", "Cables", "Cases"], o),
        col("Support", ["Pairing help", "Warranty", "Repairs", "Manuals"], o),
        col("About", ["Our sound", "Reviews", "Careers"], o)),
      h("div", "mt-14 flex flex-col gap-3 border-t border-neutral-800 pt-6 text-xs sm:flex-row sm:justify-between",
        h("p", "", "© 2026 Nocturne Audio GmbH"),
        list("flex gap-5", "", ["Privacy", "Terms", "Cookies"].map((l) => A(l, `hover:text-white ${r}`)))))));
}

/* 14. Dark with call to action band */
{
  const r = focus("focus-visible:ring-orange-400");
  const o = { h: "text-sm font-medium text-white", ul: "mt-4 space-y-3", a: `text-sm text-stone-400 hover:text-white ${r}` };
  add("dark", "Call to action band", h("footer", "bg-[#0c0a09] text-stone-400",
    h("div", "mx-auto max-w-7xl px-6",
      h("div", "flex flex-col items-start gap-6 border-b border-stone-800 py-16 md:flex-row md:items-center md:justify-between",
        h("h2", "max-w-xl text-4xl font-semibold leading-tight tracking-tight text-white", "Run your workloads closer to your users."),
        h("div", "flex flex-wrap gap-3",
          h("a", "inline-flex h-12 items-center rounded-lg bg-orange-500 px-6 text-[15px] font-semibold text-stone-950 hover:bg-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950", $({ href: "#" }), "Start building"),
          h("a", "inline-flex h-12 items-center rounded-lg px-6 text-[15px] font-semibold text-white ring-1 ring-stone-700 hover:bg-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400", $({ href: "#" }), "Talk to sales"))),
      h("div", "grid grid-cols-2 gap-10 py-14 md:grid-cols-4",
        col("Platform", ["Compute", "Storage", "Edge network", "Databases"], o),
        col("Developers", ["Documentation", "API reference", "Status"], o),
        col("Company", ["About Basalt", "Customers", "Careers"], o),
        col("Trust", ["Security", "Compliance", "Privacy"], o)),
      h("div", "flex flex-col gap-2 border-t border-stone-800 py-6 text-xs sm:flex-row sm:justify-between",
        h("p", "", "© 2026 Basalt Cloud, Inc."),
        h("p", "", "Data centres in Frankfurt, Virginia and Singapore")))));
}

/* 15. App download with drawn phone */
{
  const r = focus("focus-visible:ring-white");
  const store = (top: string, os: string) =>
    h("a", `inline-flex h-14 items-center gap-3 rounded-xl bg-black px-5 text-white ring-1 ring-white/20 hover:bg-neutral-900 ${r}`, $({ href: "#" }),
      ico("device", "h-6 w-6"), h("span", "flex flex-col text-left leading-tight", h("span", "text-[11px] text-neutral-300", top), h("span", "text-[15px] font-semibold", os)));
  add("app", "App download with phone", h("footer", "overflow-hidden bg-indigo-700 text-indigo-50",
    h("div", "mx-auto grid max-w-7xl items-end gap-10 px-6 pt-16 md:grid-cols-[1.2fr_1fr]",
      h("div", "pb-16",
        h("h2", "text-4xl font-semibold leading-tight tracking-tight text-white", "Take Strider on every run."),
        h("p", "mt-3 max-w-md text-indigo-100", "Plan routes, track splits and share the finish photo from your phone."),
        h("div", "mt-8 flex flex-wrap gap-3", store("Download for", "iOS"), store("Get it for", "Android")),
        h("nav", "mt-12", $({ "aria-label": "Footer" }), list("flex flex-wrap gap-x-6 gap-y-2 text-sm text-indigo-100", "", ["Routes", "Clubs", "Pricing", "Help", "Privacy"].map((l) => A(l, `hover:text-white ${r}`)))),
        h("p", "mt-4 text-xs text-indigo-200", "© 2026 Strider Sports Ltd")),
      h("div", "mx-auto hidden w-64 rounded-t-[2.5rem] border-[10px] border-b-0 border-black bg-black md:block", $({ "aria-hidden": "true" }),
        h("div", "rounded-t-[1.8rem] bg-white px-5 pb-10 pt-8",
          h("div", "mx-auto h-1.5 w-16 rounded-full bg-neutral-200"),
          h("p", "mt-6 text-xs font-medium text-neutral-500", "This week"),
          h("p", "text-3xl font-semibold tracking-tight text-neutral-900", "32.4 km"),
          h("div", "mt-5 flex h-24 items-end gap-2",
            ...["h-[40%]", "h-[65%]", "h-[30%]", "h-[85%]", "h-[55%]", "h-full", "h-[20%]"].map((hh) => h("div", `flex-1 rounded-md bg-indigo-500 ${hh}`))),
          h("div", "mt-5 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-900", "Next: Easy 6 km, Thursday"))))));
}

/* 16. Compact app row */
{
  const r = focus("focus-visible:ring-emerald-700");
  const btn = (label: string) => h("a", `inline-flex h-11 items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 hover:border-stone-400 ${r}`, $({ href: "#" }), ico("device", "h-4 w-4"), label);
  const o = { h: "text-sm font-semibold text-stone-900", ul: "mt-3 space-y-2", a: `text-sm text-stone-600 hover:text-stone-900 ${r}` };
  add("app", "Recipe app compact", h("footer", "bg-stone-100",
    h("div", "mx-auto max-w-6xl px-6 py-12",
      h("div", "grid gap-10 md:grid-cols-4",
        h("div", "md:col-span-2",
          h("p", "text-xl font-semibold tracking-tight text-stone-900", "Larder"),
          h("p", "mt-2 max-w-sm text-sm leading-6 text-stone-600", "Cook from what is already in your cupboard. Your shopping list syncs between phone and laptop."),
          h("div", "mt-5 flex flex-wrap gap-2", btn("iOS app"), btn("Android app"))),
        col("Cook", ["Recipes", "Meal plans", "Pantry"], o),
        col("Larder", ["About", "Help", "Privacy"], o)),
      h("p", "mt-10 border-t border-stone-300 pt-6 text-xs text-stone-600", "© 2026 Larder Kitchen Ltd"))));
}

/* 17. Contact details with map placeholder */
{
  const r = focus("focus-visible:ring-teal-700");
  const row = (i: IconName, title: string, body: Kid) => h("div", "flex gap-3", ico(i, "mt-0.5 h-5 w-5 shrink-0 text-teal-700"), h("div", "", h("p", "text-sm font-semibold text-slate-900", title), body));
  add("contact", "Contact with map", h("footer", "bg-white",
    h("div", "mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1.3fr]",
      h("div", "",
        h("h2", "text-2xl font-semibold tracking-tight text-slate-900", "Harbourline Dental"),
        h("p", "mt-2 text-[15px] text-slate-600", "New patients welcome. Same-week appointments most weeks."),
        h("address", "mt-8 space-y-5 not-italic",
          row("pin", "Address", h("p", "text-sm text-slate-600", "2 Harbour Row, Falmouth TR11 3AA")),
          row("phone", "Phone", A("01326 000 214", `text-sm text-slate-600 hover:text-teal-700 ${r}`)),
          row("mail", "Email", A("care@harbourline.example", `text-sm text-slate-600 hover:text-teal-700 ${r}`)),
          row("clock", "Opening hours", h("p", "text-sm text-slate-600", "Mon to Fri 8:00 to 18:00, Sat 9:00 to 13:00"))),
        h("p", "mt-10 text-xs text-slate-600", "© 2026 Harbourline Dental Practice")),
      h("div", "relative min-h-[300px] overflow-hidden rounded-2xl bg-[#e6ede9] ring-1 ring-slate-200",
        h("svg", "absolute inset-0 h-full w-full", $({ viewBox: "0 0 600 360", preserveAspectRatio: "xMidYMid slice", role: "img", "aria-label": "Map showing the practice by the harbour" }),
          h("path", "", $({ d: "M0 300 C120 260 200 330 320 290 S520 250 600 280 V360 H0z", fill: "#bcd9e6" })),
          h("rect", "", $({ x: "380", y: "40", width: "150", height: "90", rx: "10", fill: "#cfe3c9" })),
          h("path", "", $({ d: "M-10 120 H620 M200 -10 V370 M0 220 L600 180 M420 -10 L360 370", stroke: "#fff", "stroke-width": "14", fill: "none" })),
          h("path", "", $({ d: "M90 -10 V260 M0 60 H340 M500 140 V370", stroke: "#fff", "stroke-width": "6", fill: "none" }))),
        h("div", "absolute left-[46%] top-[34%] flex -translate-x-1/2 -translate-y-full flex-col items-center",
          h("span", "rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg", "Harbourline Dental"),
          h("span", "mt-1 h-3 w-3 rounded-full border-2 border-white bg-teal-600 shadow")),
        h("a", `absolute bottom-4 right-4 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-900 shadow-md hover:bg-slate-50 ${r}`, $({ href: "#" }), "Get directions", ico("arrowUR", "h-4 w-4"))))));
}

/* 18. Two offices */
{
  const r = focus("focus-visible:ring-neutral-900");
  const office = (city: string, lines: string[], phone: string) =>
    h("div", "border-t border-neutral-900 pt-5",
      h("h2", "text-sm font-semibold uppercase tracking-[0.14em] text-neutral-900", city),
      h("address", "mt-4 text-[15px] not-italic leading-7 text-neutral-700", ...lines.flatMap((l, i) => (i ? [h("br", ""), l] : [l]))),
      A(phone, `mt-3 inline-block text-[15px] text-neutral-900 underline underline-offset-4 ${r}`));
  add("contact", "Two offices", h("footer", "bg-neutral-50",
    h("div", "mx-auto max-w-7xl px-6 py-16",
      h("p", "max-w-2xl text-3xl font-light leading-snug tracking-tight text-neutral-900", "Cobalt & Finch designs schools, libraries and housing that last a hundred years."),
      h("div", "mt-14 grid gap-10 md:grid-cols-3",
        office("Edinburgh", ["9 Calton Wynd", "Edinburgh EH8 8DL"], "0131 000 4410"),
        office("Leeds", ["Unit 4, Kirkgate Works", "Leeds LS2 7HZ"], "0113 000 7788"),
        h("div", "border-t border-neutral-900 pt-5",
          h("h2", "text-sm font-semibold uppercase tracking-[0.14em] text-neutral-900", "New work"),
          h("p", "mt-4 text-[15px] leading-7 text-neutral-700", "Write to us with a short brief and a site address."),
          A("studio@cobaltfinch.example", `mt-3 inline-block text-[15px] text-neutral-900 underline underline-offset-4 ${r}`))),
      h("div", "mt-14 flex flex-col gap-2 text-xs text-neutral-600 sm:flex-row sm:justify-between",
        h("p", "", "© 2026 Cobalt & Finch Architects LLP"),
        h("p", "", "Registered in Scotland, SO300000")))));
}

/* 19. Social circles centered */
{
  const r = focus("focus-visible:ring-amber-700");
  const s = (n: IconName, l: string) => soc(n, l, `grid h-12 w-12 place-items-center rounded-full bg-white text-amber-900 shadow-sm ring-1 ring-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${r}`);
  add("social", "Social circles", h("footer", "bg-amber-50",
    h("div", "mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center",
      h("p", "font-serif text-3xl text-amber-950", "Wildgrain Bakery"),
      h("p", "mt-2 text-[15px] text-amber-900", "Sourdough from 7am until it runs out."),
      h("div", "mt-8 flex gap-3", s("camera", "Photos of the bakes"), s("video", "Baking videos"), s("chat", "Message us"), s("mail", "Email the bakery")),
      h("nav", "mt-10", $({ "aria-label": "Footer" }), list("flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-amber-900", "", ["Menu", "Orders", "Wholesale", "Jobs"].map((l) => A(l, `hover:underline underline-offset-4 ${r}`)))),
      h("p", "mt-6 text-xs text-amber-900/80", "© 2026 Wildgrain Bakery"))));
}

/* 20. Creator links list */
{
  const r = focus("focus-visible:ring-fuchsia-600");
  const item = (n: IconName, l: string, sub: string) =>
    h("a", `group flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 ${r}`, $({ href: "#" }),
      h("span", "grid h-11 w-11 place-items-center rounded-lg bg-fuchsia-50 text-fuchsia-700", ico(n)),
      h("span", "flex-1", h("span", "block text-[15px] font-semibold text-neutral-900", l), h("span", "block text-sm text-neutral-600", sub)),
      ico("arrowUR", "h-4 w-4 text-neutral-400 transition group-hover:text-neutral-900"));
  add("social", "Creator link cards", h("footer", "bg-neutral-100",
    h("div", "mx-auto max-w-5xl px-6 py-16",
      h("div", "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        h("h2", "text-2xl font-semibold tracking-tight text-neutral-900", "Follow along with Mira Okafor"),
        h("p", "text-sm text-neutral-600", "Illustrator, Lagos and Lisbon")),
      h("div", "mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
        item("camera", "Sketchbook", "Daily drawings"), item("video", "Studio videos", "Process, weekly"), item("mail", "Letters", "Monthly news"), item("book", "Prints shop", "Signed editions")),
      h("p", "mt-10 text-xs text-neutral-600", "© 2026 Mira Okafor. Artwork may not be reused without permission."))));
}

/* 21. Financial small print */
{
  const r = focus("focus-visible:ring-blue-700");
  const o = { h: "text-sm font-semibold text-slate-900", ul: "mt-3 space-y-2", a: `text-sm text-slate-600 hover:text-slate-900 ${r}` };
  add("legal", "Financial small print", h("footer", "border-t border-slate-200 bg-white",
    h("div", "mx-auto max-w-7xl px-6 py-14",
      h("div", "grid grid-cols-2 gap-8 md:grid-cols-5",
        h("div", "col-span-2", h("p", "text-lg font-semibold text-blue-800", "Clearpath Insurance"), h("p", "mt-2 text-sm text-slate-600", "Home, car and travel cover in plain English.")),
        col("Cover", ["Home", "Car", "Travel"], o),
        col("Claims", ["Make a claim", "Track a claim"], o),
        col("Help", ["Contact", "Complaints"], o)),
      h("div", "mt-12 space-y-3 border-t border-slate-200 pt-8 text-xs leading-5 text-slate-600",
        h("p", "", "Clearpath Insurance Services Ltd is authorised and regulated by the financial regulator, firm reference 000000. Registered in England and Wales, company number 00000000. Registered office: 1 Example Square, Leeds LS1 1AA."),
        h("p", "", "Cover is subject to the terms, conditions and exclusions in the policy wording. Calls may be recorded for training and quality."),
        h("div", "flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between",
          h("p", "", "© 2026 Clearpath Insurance Services Ltd"),
          list("flex flex-wrap gap-x-5 gap-y-2", "", ["Privacy notice", "Terms of use", "Accessibility", "Modern slavery statement"].map((l) => A(l, `underline underline-offset-2 hover:text-slate-900 ${r}`))))))));
}

/* 22. SaaS legal bar with cookie button */
{
  const r = focus("focus-visible:ring-slate-400");
  add("legal", "Legal bar with cookie settings", h("footer", "bg-slate-900 text-slate-400",
    h("div", "mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 text-sm lg:flex-row lg:items-center lg:justify-between",
      h("div", "flex items-center gap-3", mark("square", "h-5 w-5 text-slate-300"), h("p", "", "© 2026 Plotline Software Inc.")),
      h("nav", "", $({ "aria-label": "Legal" }), list("flex flex-wrap items-center gap-x-5 gap-y-2", "", [
        A("Privacy", `hover:text-white ${r}`), A("Terms", `hover:text-white ${r}`), A("Acceptable use", `hover:text-white ${r}`),
        h("button", `hover:text-white ${r}`, $({ type: "button" }), "Cookie settings"),
        h("span", "inline-flex items-center gap-1.5", ico("globe", "h-4 w-4"), "EU data region")])))));
}

/* 23. Dense sitemap */
{
  const r = focus("focus-visible:ring-red-800");
  const o = { h: "border-b border-stone-300 pb-2 text-[13px] font-bold uppercase tracking-wide text-red-900", ul: "mt-3 space-y-1.5", a: `text-sm text-stone-700 hover:text-red-900 hover:underline ${r}` };
  add("sitemap", "University sitemap", h("footer", "bg-[#faf8f5]",
    h("div", "mx-auto max-w-7xl px-6 py-14",
      h("div", "flex flex-wrap items-baseline justify-between gap-4",
        h("p", "font-serif text-2xl text-red-900", "Atlas Commons College"),
        h("a", `text-sm font-semibold text-red-900 underline underline-offset-4 ${r}`, $({ href: "#" }), "A to Z of the site")),
      h("nav", "mt-10 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-6", $({ "aria-label": "Site map" }),
        col("Study", ["Undergraduate", "Postgraduate", "Short courses", "Online learning", "Fees"], o),
        col("Apply", ["How to apply", "Open days", "Scholarships", "International"], o),
        col("Research", ["Centres", "Publications", "Doctoral school", "Impact"], o),
        col("Campus", ["Libraries", "Housing", "Sport", "Getting here"], o),
        col("Students", ["Timetables", "Wellbeing", "Careers service", "Union"], o),
        col("About", ["News", "Events", "Jobs", "Governance"], o)),
      h("div", "mt-12 flex flex-col gap-2 border-t border-stone-300 pt-6 text-xs text-stone-600 md:flex-row md:justify-between",
        h("p", "", "Atlas Commons College, 40 Mill Road, Cambridge CB1 0AA"),
        h("p", "", "© 2026 Atlas Commons College. Registered charity no. 0000000")))));
}

/* 24. Docs sitemap */
{
  const r = focus("focus-visible:ring-indigo-500");
  const o = { h: "flex items-center gap-2 text-sm font-semibold text-slate-900", ul: "mt-3 space-y-2 border-l border-slate-200 pl-4", a: `text-sm text-slate-600 hover:text-indigo-700 ${r}` };
  add("sitemap", "Docs sitemap", h("footer", "border-t border-slate-200 bg-white",
    h("div", "mx-auto max-w-7xl px-6 py-14",
      h("nav", "grid gap-10 sm:grid-cols-2 lg:grid-cols-4", $({ "aria-label": "Documentation" }),
        col("Getting started", ["Install", "Quickstart", "Concepts", "Upgrading to v4"], o),
        col("Guides", ["Webhooks", "Retries", "Rate limits", "Testing locally"], o),
        col("Reference", ["REST API", "Events", "Errors", "SDKs"], o),
        col("Community", ["Discussions", "Examples", "Contributing"], o)),
      h("div", "mt-12 flex flex-col gap-4 rounded-xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between",
        h("p", "text-sm text-slate-600", h("span", "font-semibold text-slate-900", "Relay Docs"), " v4.2 · Last updated 3 October 2026"),
        h("a", `inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900 ${r}`, $({ href: "#" }), ico("pen", "h-4 w-4"), "Suggest an edit")))));
}

/* 25. Restaurant hours */
{
  const r = focus("focus-visible:ring-orange-300");
  const hours: [string, string][] = [["Monday", "Closed"], ["Tue to Thu", "17:30 to 22:00"], ["Fri and Sat", "12:00 to 23:00"], ["Sunday", "12:00 to 16:00"]];
  add("local", "Restaurant with hours", h("footer", "bg-[#1f2a1f] text-[#e9e4d6]",
    h("div", "mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-3",
      h("div", "",
        h("p", "font-serif text-3xl text-[#f6f1e3]", "Marigold Kitchen"),
        h("p", "mt-3 text-sm leading-6 text-[#e9e4d6]/80", "Seasonal plates and natural wine in an old print works."),
        h("a", "mt-6 inline-flex h-11 items-center rounded-full bg-orange-300 px-5 text-sm font-semibold text-[#1f2a1f] hover:bg-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f2a1f]", $({ href: "#" }), "Book a table")),
      h("div", "",
        h("h2", "text-xs font-semibold uppercase tracking-[0.18em] text-orange-300", "Opening hours"),
        h("dl", "mt-4 divide-y divide-[#e9e4d6]/15 text-sm", ...hours.map(([d, t]) => h("div", "flex justify-between py-2.5", h("dt", "", d), h("dd", "tabular-nums text-[#f6f1e3]", t))))),
      h("div", "",
        h("h2", "text-xs font-semibold uppercase tracking-[0.18em] text-orange-300", "Find us"),
        h("address", "mt-4 text-sm not-italic leading-7", "27 Printworks Yard", h("br", ""), "Sheffield S1 4AB", h("br", ""), A("0114 000 3322", `underline underline-offset-4 ${r}`)),
        h("p", "mt-8 text-xs text-[#e9e4d6]/80", "© 2026 Marigold Kitchen")))));
}

/* 26. Plumber with emergency line */
{
  const r = focus("focus-visible:ring-blue-900");
  add("local", "Trades with emergency line", h("footer", "bg-white",
    h("div", "bg-yellow-300",
      h("div", "mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between",
        h("p", "text-[15px] font-semibold text-blue-950", "Burst pipe or no heating? We answer 24 hours a day."),
        h("a", `inline-flex h-11 items-center gap-2 rounded-lg bg-blue-950 px-5 text-[15px] font-bold text-white hover:bg-blue-900 ${r}`, $({ href: "#" }), ico("phone", "h-5 w-5"), "0161 000 9090"))),
    h("div", "mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3",
      h("div", "",
        h("p", "text-xl font-bold text-blue-950", "Brightside Plumbing & Heating"),
        h("p", "mt-2 text-sm text-slate-600", "Qualified, insured engineers. Fixed prices before we start.")),
      h("div", "",
        h("h2", "text-sm font-semibold text-slate-900", "Areas we cover"),
        h("p", "mt-3 text-sm leading-6 text-slate-600", "Stockport, Didsbury, Chorlton, Sale, Altrincham, Wilmslow and Cheadle.")),
      h("div", "",
        h("h2", "text-sm font-semibold text-slate-900", "Office hours"),
        h("p", "mt-3 text-sm leading-6 text-slate-600", "Mon to Fri 8:00 to 18:00", h("br", ""), "Sat 9:00 to 14:00", h("br", ""), "Emergency call-outs at all other times"))),
    h("div", "border-t border-slate-200",
      h("p", "mx-auto max-w-7xl px-6 py-5 text-xs text-slate-600", "© 2026 Brightside Plumbing & Heating Ltd · Reg. no. 00000000"))));
}

/* 27. Yoga studio timetable */
{
  const r = focus("focus-visible:ring-teal-800");
  const day = (d: string, classes: string) => h("li", "flex flex-col gap-0.5 rounded-xl bg-white/70 p-3 ring-1 ring-teal-900/10", h("span", "text-xs font-semibold uppercase tracking-wider text-teal-800", d), h("span", "text-sm text-teal-950", classes));
  add("local", "Studio timetable", h("footer", "bg-teal-50",
    h("div", "mx-auto max-w-7xl px-6 py-16",
      h("div", "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        h("div", "", h("p", "text-3xl font-semibold tracking-tight text-teal-950", "Juniper Yoga"), h("p", "mt-1 text-sm text-teal-900", "5 Orchard Street, Bath BA1 1AA")),
        A("Full timetable", `inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:text-teal-950 ${r}`, ico("arrow", "h-4 w-4"))),
      h("ul", "mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7", ...[
        day("Mon", "7:00 Flow, 18:30 Yin"), day("Tue", "12:15 Lunch flow"), day("Wed", "7:00 Flow, 19:00 Restore"), day("Thu", "18:30 Strength"), day("Fri", "7:00 Flow"), day("Sat", "9:30 Beginners"), day("Sun", "10:00 Slow flow")]),
      h("div", "mt-10 flex flex-col gap-3 border-t border-teal-900/15 pt-6 text-sm text-teal-900 sm:flex-row sm:justify-between",
        h("p", "", "© 2026 Juniper Yoga"),
        list("flex gap-5", "", ["Pricing", "Teachers", "Contact"].map((l) => A(l, `hover:text-teal-950 hover:underline ${r}`)))))));
}

/* 28. Shop with perks row */
{
  const r = focus("focus-visible:ring-stone-900");
  const perk = (i: IconName, t: string, s: string) => h("div", "flex items-start gap-3", ico(i, "h-6 w-6 shrink-0 text-stone-900"), h("div", "", h("p", "text-sm font-semibold text-stone-900", t), h("p", "text-sm text-stone-600", s)));
  const o = { h: "text-sm font-semibold text-stone-900", ul: "mt-4 space-y-2.5", a: `text-sm text-stone-600 hover:text-stone-900 ${r}` };
  add("shop", "Shop with delivery perks", h("footer", "bg-white",
    h("div", "border-y border-stone-200 bg-stone-50",
      h("div", "mx-auto grid max-w-7xl gap-6 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4",
        perk("truck", "Free delivery", "On UK orders over £60"), perk("back", "30 day returns", "Unworn, with tags"), perk("lock", "Secure checkout", "Encrypted card payments"), perk("gift", "Gift wrapping", "Add it at checkout"))),
    h("div", "mx-auto max-w-7xl px-6 py-14",
      h("div", "grid grid-cols-2 gap-10 md:grid-cols-5",
        h("div", "col-span-2", h("p", "text-2xl font-semibold tracking-tight text-stone-900", "Loomhouse"), h("p", "mt-2 max-w-xs text-sm leading-6 text-stone-600", "Linen bedding and throws, woven in Portugal.")),
        col("Shop", ["Bedding", "Throws", "Towels", "Sale"], o),
        col("Help", ["Delivery", "Returns", "Size guide", "Order status"], o),
        col("About", ["Our mills", "Journal", "Wholesale"], o)),
      h("div", "mt-12 flex flex-col gap-3 border-t border-stone-200 pt-6 text-xs text-stone-600 md:flex-row md:justify-between",
        h("p", "", "© 2026 Loomhouse Textiles Ltd"),
        h("p", "", "We accept credit and debit cards, bank transfer and gift cards")))));
}

/* 29. Dark shop with discount signup */
{
  const r = focus("focus-visible:ring-pink-300");
  const o = { h: "text-sm font-semibold text-white", ul: "mt-4 space-y-2.5", a: `text-sm text-zinc-400 hover:text-white ${r}` };
  const pay = (t: string) => h("li", "rounded-md border border-zinc-700 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-300", t);
  add("shop", "Dark shop with discount", h("footer", "bg-zinc-900 text-zinc-400",
    h("div", "mx-auto max-w-7xl px-6 py-16",
      h("div", "grid gap-12 lg:grid-cols-[1.2fr_2fr]",
        h("div", "",
          h("p", "text-2xl font-semibold tracking-tight text-white", "Kettle & Crumb"),
          h("p", "mt-3 text-sm text-zinc-400", "Get 10% off your first box of loose-leaf tea."),
          h("form", "mt-5 flex gap-2", $({ action: "#" }),
            h("label", "sr-only", $({ for: "f29-email" }), "Email address"),
            h("input", "h-11 min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-white placeholder:text-zinc-400 focus:border-pink-300 focus:outline-none", $({ id: "f29-email", name: "email", type: "email", required: "", autocomplete: "email", placeholder: "Email address" })),
            h("button", "h-11 rounded-lg bg-pink-300 px-4 text-sm font-semibold text-zinc-900 hover:bg-pink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900", $({ type: "submit" }), "Get code"))),
        h("div", "grid grid-cols-2 gap-10 sm:grid-cols-3",
          col("Tea", ["Black", "Green", "Herbal", "Samplers"], o),
          col("Orders", ["Track order", "Delivery", "Returns"], o),
          col("Company", ["Our growers", "Stockists", "Contact"], o))),
      h("div", "mt-14 flex flex-col gap-4 border-t border-zinc-800 pt-6 sm:flex-row sm:items-center sm:justify-between",
        h("p", "text-xs", "© 2026 Kettle & Crumb"),
        h("div", "flex flex-wrap items-center gap-2", h("span", "sr-only", "Payment methods:"), h("ul", "flex flex-wrap gap-2", pay("Card"), pay("Bank transfer"), pay("Gift card"), pay("Pay later")))))));
}

/* 30. Shop with order tracking */
{
  const r = focus("focus-visible:ring-orange-600");
  const o = { h: "text-sm font-semibold text-neutral-900", ul: "mt-4 space-y-2.5", a: `text-sm text-neutral-600 hover:text-orange-700 ${r}` };
  add("shop", "Parts store with order lookup", h("footer", "bg-neutral-100",
    h("div", "mx-auto max-w-7xl px-6 py-14",
      h("div", "grid gap-10 lg:grid-cols-5",
        h("div", "lg:col-span-2",
          h("p", "text-xl font-black uppercase tracking-tight text-neutral-900", "Velo", h("span", "text-orange-600", "Parts")),
          h("form", "mt-6 rounded-xl bg-white p-4 ring-1 ring-neutral-200", $({ action: "#" }),
            h("label", "text-sm font-semibold text-neutral-900", $({ for: "f30-order" }), "Track an order"),
            h("div", "mt-2 flex gap-2",
              h("input", "h-11 min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-orange-600 focus:outline-none", $({ id: "f30-order", name: "order", placeholder: "Order number, e.g. VP-20418" })),
              h("button", "h-11 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2", $({ type: "submit" }), "Track")))),
        col("Components", ["Drivetrain", "Brakes", "Wheels", "Cockpit"], o),
        col("Service", ["Fitting guides", "Compatibility", "Returns", "Warranty"], o),
        col("Store", ["About", "Workshop", "Contact"], o)),
      h("div", "mt-12 flex flex-col gap-2 border-t border-neutral-300 pt-6 text-xs text-neutral-600 sm:flex-row sm:justify-between",
        h("p", "", "© 2026 Velo Parts Ltd"),
        h("p", "", "Card, bank transfer and pay-in-three accepted. Prices include VAT.")))));
}

/* 31. Agency big email */
{
  const r = focus("focus-visible:ring-neutral-900");
  add("columns", "Agency big email", h("footer", "bg-[#d9e4dc] text-neutral-900",
    h("div", "mx-auto max-w-7xl px-6 py-16",
      h("p", "text-sm font-medium text-neutral-700", "Have a project in mind?"),
      h("a", `mt-3 inline-block break-all text-4xl font-semibold tracking-[-0.03em] underline decoration-2 underline-offset-8 hover:decoration-neutral-500 md:text-7xl ${r}`, $({ href: "#" }), "hi@saltmarsh.example"),
      h("div", "mt-16 grid grid-cols-2 gap-8 border-t border-neutral-900/20 pt-8 text-sm md:grid-cols-4",
        h("div", "", h("p", "font-semibold", "Studio Saltmarsh"), h("p", "mt-1 text-neutral-700", "Brand and web design")),
        h("div", "", h("p", "font-semibold", "Visit"), h("p", "mt-1 text-neutral-700", "3 Wharf Street, Whitstable")),
        h("div", "", h("p", "font-semibold", "Elsewhere"), list("mt-1 space-y-1", "", ["Case studies", "Newsletter", "Photos"].map((l) => A(l, `text-neutral-700 hover:text-neutral-900 hover:underline ${r}`)))),
        h("p", "self-end text-neutral-700 md:text-right", "© 2026")))));
}

/* 32. Nonprofit donate */
{
  const r = focus("focus-visible:ring-sky-200");
  const o = { h: "text-sm font-semibold text-white", ul: "mt-4 space-y-2.5", a: `text-sm text-sky-100/80 hover:text-white ${r}` };
  add("columns", "Charity with donate", h("footer", "bg-[#0b3a53] text-sky-100",
    h("div", "mx-auto max-w-7xl px-6 py-16",
      h("div", "grid gap-12 lg:grid-cols-[1.3fr_2fr]",
        h("div", "rounded-2xl bg-white/5 p-6 ring-1 ring-white/10",
          h("p", "text-xl font-semibold text-white", "Riverkeepers Alliance"),
          h("p", "mt-2 text-sm leading-6 text-sky-100/80", "Volunteers testing water quality on 140 miles of river, every month of the year."),
          h("div", "mt-5 flex flex-wrap gap-3",
            h("a", "inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#0b3a53] hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b3a53]", $({ href: "#" }), ico("heart", "h-4 w-4"), "Donate"),
            h("a", `inline-flex h-11 items-center rounded-lg px-5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/10 ${r}`, $({ href: "#" }), "Volunteer"))),
        h("div", "grid grid-cols-2 gap-10 sm:grid-cols-3",
          col("Our work", ["River reports", "Clean-ups", "Schools"], o),
          col("Get involved", ["Events", "Fundraise", "Leave a gift"], o),
          col("About", ["Team", "Annual report", "Contact"], o))),
      h("p", "mt-14 border-t border-white/10 pt-6 text-xs text-sky-100/80", "© 2026 Riverkeepers Alliance. Registered charity in England and Wales no. 0000000."))));
}

/* 33. Floating card footer */
{
  const r = focus("focus-visible:ring-blue-600");
  add("minimal", "Floating card", h("footer", "bg-slate-100 px-4 pb-4",
    h("div", "mx-auto flex max-w-7xl flex-col gap-6 rounded-2xl bg-white px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.15)] ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between",
      h("a", `inline-flex items-center gap-2 ${r}`, $({ href: "#" }), mark("arc", "h-6 w-6 text-blue-600"), h("span", "font-semibold text-slate-900", "Plotline")),
      h("nav", "", $({ "aria-label": "Footer" }), list("flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600", "", ["Product", "Customers", "Pricing", "Docs", "Status"].map((l) => A(l, `hover:text-slate-900 ${r}`)))),
      h("p", "text-sm text-slate-600", "© 2026 Plotline"))));
}

/* 34. Podcast */
{
  const r = focus("focus-visible:ring-yellow-300");
  const sub = (i: IconName, l: string) => h("a", `inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/20 ${r}`, $({ href: "#" }), ico(i, "h-4 w-4"), l);
  add("social", "Podcast subscribe", h("footer", "bg-[#171321] text-violet-100",
    h("div", "mx-auto max-w-7xl px-6 py-16",
      h("div", "flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between",
        h("div", "flex items-center gap-4",
          h("span", "grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-yellow-300 text-[#171321]", ico("mic", "h-8 w-8")),
          h("div", "", h("p", "text-2xl font-semibold tracking-tight text-white", "Late Shift Radio"), h("p", "text-sm text-violet-200", "New episode every Tuesday night"))),
        h("div", "flex flex-wrap gap-2", sub("rss", "RSS feed"), sub("play", "Listen on the web"), sub("video", "Watch episodes"), sub("mail", "Show notes by email"))),
      h("div", "mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-violet-200 sm:flex-row sm:justify-between",
        h("p", "", "© 2026 Late Shift Radio"),
        list("flex gap-5", "", ["Episodes", "Guests", "Sponsor the show"].map((l) => A(l, `hover:text-white ${r}`)))))));
}

/* ---------- serialisers: one tree, three outputs ---------- */
const VOID = new Set(["input", "br", "hr", "img", "path", "circle", "rect"]);
const JSX_ATTR: Record<string, string> = {
  for: "htmlFor", "stroke-width": "strokeWidth", "stroke-linecap": "strokeLinecap", "stroke-linejoin": "strokeLinejoin",
  autocomplete: "autoComplete", tabindex: "tabIndex", "stroke-dasharray": "strokeDasharray",
};
const BOOL = new Set(["required"]);
const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function toReact(n: N, key: string | number): ReactNode {
  if (typeof n === "string") return n;
  const props: Record<string, unknown> = { key };
  if (n.c) props.className = n.c;
  for (const [k, v] of Object.entries(n.a ?? {})) props[JSX_ATTR[k] ?? k] = BOOL.has(k) ? true : v;
  if (n.t === "a" && n.a?.href === "#top") props.href = "#";
  return createElement(n.t, props, ...(VOID.has(n.t) ? [] : n.k.map((k, i) => toReact(k, i))));
}

function serial(n: N, jsx: boolean, depth: number): string {
  const pad = "  ".repeat(depth);
  if (typeof n === "string") return pad + (jsx ? n.replace(/[{}]/g, (m) => `{"${m}"}`) : escHtml(n));
  const attrs: string[] = [];
  if (n.c) attrs.push(`${jsx ? "className" : "class"}="${n.c}"`);
  for (const [k, v] of Object.entries(n.a ?? {})) attrs.push(BOOL.has(k) ? k : `${jsx ? JSX_ATTR[k] ?? k : k}="${v}"`);
  const open = `<${n.t}${attrs.length ? " " + attrs.join(" ") : ""}`;
  if (VOID.has(n.t)) return `${pad}${open}${jsx || n.t === "path" || n.t === "circle" || n.t === "rect" ? " />" : ">"}`;
  const only = n.k.length === 1 && typeof n.k[0] !== "string" ? n.k[0] : null;
  const flat = (only !== null && !VOID.has(only.t) && only.k.every((k) => typeof k === "string")) || n.k.every((k) => typeof k === "string") || (n.t === "svg" && n.k.length === 1) || (n.t === "p" && n.k.length <= 5 && n.k.every((k) => typeof k === "string" || k.t === "br" || k.t === "span"));
  if (flat) return `${pad}${open}>${n.k.map((k) => serial(k, jsx, 0)).join("")}</${n.t}>`;
  return `${pad}${open}>\n${n.k.map((k) => serial(k, jsx, depth + 1)).join("\n")}\n${pad}</${n.t}>`;
}

const pascal = (s: string) => s.replace(/(^|[^a-zA-Z0-9]+)([a-zA-Z0-9])/g, (_, __, c: string) => c.toUpperCase());
const jsxFor = (it: Item) => `export default function ${pascal(it.name)}Footer() {\n  return (\n${serial(it.node, true, 2)}\n  );\n}\n`;
const htmlFor = (it: Item) => `<!-- Needs Tailwind CSS v3 or v4 on the page -->\n${serial(it.node, false, 0)}\n`;

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
    if (e.type === "submit" || t.closest("a")) e.preventDefault();
  };

  return (
    <div ref={outer} className="relative overflow-hidden" style={{ height: box.h || undefined }} onClickCapture={stop} onSubmitCapture={stop}>
      <div ref={inner} className="origin-top-left" style={{ width: box.w, transform: box.s === 1 ? undefined : `scale(${box.s})` }}>
        {toReact(node, 0)}
      </div>
    </div>
  );
}

/* ---------- page ---------- */
const FAMILY_KEYS = Object.keys(FAMILIES) as Family[];
type Lang = "jsx" | "html";

export default function TailwindFooterCollection() {
  const [family, setFamily] = useState<Family | "all">("all");
  const [query, setQuery] = useState("");
  const [full, setFull] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [lang, setLang] = useState<Lang>("jsx");
  const [copied, setCopied] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const indexed = useMemo(() => ITEMS.map((it, i) => ({ it, i })), []);
  const q = query.trim().toLowerCase();
  const visible = indexed.filter(({ it }) => (family === "all" || it.f === family) && (!q || `${it.name} ${FAMILIES[it.f]}`.toLowerCase().includes(q)));

  async function copy(i: number, l: Lang) {
    const it = ITEMS[i];
    const text = l === "jsx" ? jsxFor(it) : htmlFor(it);
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) {
      setOpen(i);
      setLang(l);
    }
    setCopied(ok ? `${i}-${l}` : null);
    setAnnounce(ok ? `${it.name} ${l === "jsx" ? "React JSX" : "HTML"} copied` : "Copy was blocked, the code is shown below so you can select it");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  }

  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1";
  const chip = `inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors ${ring}`;
  const tool = `inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${ring}`;

  return (
    <section className="bg-[#f6f6f4] px-4 py-12 text-[#15171c] sm:px-8 sm:py-16" style={{ fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">React · Tailwind · HTML</p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">{ITEMS.length} Tailwind footers you can copy</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone-600">
              Real footers for real kinds of sites. Look at each one at full size, then copy it as a React component or as plain HTML with Tailwind classes.
            </p>
          </div>
          <dl className="flex gap-8 font-mono text-[12px] text-stone-600">
            <div>
              <dt className="uppercase tracking-[0.14em]">Footers</dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#15171c]">{ITEMS.length}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.14em]">Styles</dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#15171c]">{FAMILY_KEYS.length}</dd>
            </div>
          </dl>
        </header>

        <div className="mt-8 flex flex-col gap-3 border-y border-stone-300/70 py-4 lg:flex-row lg:items-center">
          <label htmlFor="tfc-search" className="sr-only">Search footers</label>
          <div className="relative lg:w-60 lg:shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500">
              <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />
            </svg>
            <input
              id="tfc-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search footers"
              className="h-10 w-full rounded-full border border-stone-300 bg-white pl-9 pr-4 text-[14px] text-stone-900 placeholder:text-stone-500 focus:border-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by style">
            {(["all", ...FAMILY_KEYS] as const).map((f) => {
              const on = family === f;
              const n = f === "all" ? ITEMS.length : ITEMS.filter((it) => it.f === f).length;
              return (
                <button key={f} type="button" aria-pressed={on} onClick={() => setFamily(f)} className={`${chip} ${on ? "bg-[#15171c] text-white" : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"}`}>
                  {f === "all" ? "All" : FAMILIES[f]}
                  <span className={`font-mono text-[11px] ${on ? "text-stone-300" : "text-stone-500"}`}>{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">{announce}</p>

        <div className="mt-6 h-[1140px] overflow-y-auto overscroll-contain rounded-2xl pr-1" tabIndex={0} aria-label="Footer examples">
          {visible.length === 0 && (
            <div className="grid h-60 place-items-center rounded-2xl border border-dashed border-stone-300 text-[14px] text-stone-600">No footer matches "{query}". Try dark, newsletter or shop.</div>
          )}
          <ul className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            {visible.map(({ it, i }) => {
              const isFull = full === i;
              const isOpen = open === i;
              return (
                <li key={i} className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(21,23,28,0.04)] ${isFull || isOpen ? "lg:col-span-2" : ""}`}>
                  <div className="bg-[repeating-linear-gradient(45deg,#f3f3f1_0_8px,#ececea_8px_16px)] pt-6">
                    <Preview node={it.node} full={isFull} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-stone-200 px-3 py-2.5">
                    <span className="font-mono text-[11px] text-stone-500">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 basis-40 truncate text-[13px] font-medium text-stone-800">
                      {it.name} <span className="font-normal text-stone-500">· {FAMILIES[it.f]}</span>
                    </span>
                    <button type="button" aria-pressed={isFull} onClick={() => setFull(isFull ? null : i)} className={`${tool} ${isFull ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"}`}>
                      {isFull ? "Scaled" : "Full size"}
                    </button>
                    <button type="button" aria-expanded={isOpen} aria-controls={`tfc-code-${i}`} onClick={() => setOpen(isOpen ? null : i)} className={`${tool} text-stone-700 hover:bg-stone-100`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4"><path d={ICONS.code} /></svg>
                      Code
                    </button>
                    {(["jsx", "html"] as const).map((l) => {
                      const done = copied === `${i}-${l}`;
                      return (
                        <button key={l} type="button" onClick={() => copy(i, l)} aria-label={`Copy ${l === "jsx" ? "React JSX" : "HTML"} for ${it.name}`} className={`${tool} ${done ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-900 hover:bg-stone-200"}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5"><path d={done ? ICONS.check : "M9 9h11v11H9zM5 15H4V4h11v1"} /></svg>
                          {done ? "Copied" : l === "jsx" ? "JSX" : "HTML"}
                        </button>
                      );
                    })}
                  </div>
                  {isOpen && (
                    <div id={`tfc-code-${i}`} className="border-t border-stone-800 bg-[#111318]">
                      <div className="flex gap-1 border-b border-white/10 px-3 pt-2" role="group" aria-label="Code format">
                        {(["jsx", "html"] as const).map((l) => (
                          <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={`rounded-t-md px-3 py-2 text-[12px] font-semibold ${ring} ${lang === l ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>
                            {l === "jsx" ? "React JSX" : "HTML"}
                          </button>
                        ))}
                      </div>
                      <pre tabIndex={0} className="max-h-96 overflow-auto p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200">
                        <code>{lang === "jsx" ? jsxFor(it) : htmlFor(it)}</code>
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
