import { createElement, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

/*
  Tailwind hero sections collection.
  Every hero is written once as a small element tree (tag, classes, attributes, children).
  The same tree renders the live preview, the React + Tailwind JSX you copy and the plain
  HTML + Tailwind markup you copy, so the three can never drift apart.
*/

type El = { t: string; c?: string; a?: Record<string, string>; k?: N[] };
type N = string | El;

const h = (t: string, c: string, ...k: N[]): El => ({ t, c, k });
const ha = (t: string, c: string, a: Record<string, string>, ...k: N[]): El => ({ t, c, a, k });
const a = (c: string, ...k: N[]) => ha("a", c, { href: "#" }, ...k);
const b = (c: string, ...k: N[]) => ha("button", c, { type: "button" }, ...k);
const img = (src: string, alt: string, c: string) => ha("img", c, { src, alt });
const icon = (d: string, c: string) =>
  ha("svg", c, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" }, ha("path", "", { d }));
const solid = (d: string, c: string) => ha("svg", c, { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true" }, ha("path", "", { d }));

const D = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  play: "M8 5.5v13l11-6.5z",
  check: "M5 12.5l4.5 4.5L19 7",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  phone: "M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
  cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  bag: "M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2",
  down: "M12 4v12M6 11l6 6 6-6M5 20h14",
};

const PH = {
  living: "https://images.pexels.com/photos/29012619/pexels-photo-29012619.jpeg?auto=compress&cs=tinysrgb&w=1600",
  barista: "https://images.pexels.com/photos/4349954/pexels-photo-4349954.jpeg?auto=compress&cs=tinysrgb&w=1600",
  lake: "https://images.pexels.com/photos/36103492/pexels-photo-36103492.jpeg?auto=compress&cs=tinysrgb&w=1600",
  sunsetLake: "https://images.pexels.com/photos/40090812/pexels-photo-40090812.jpeg?auto=compress&cs=tinysrgb&w=1600",
  greenLake: "https://images.pexels.com/photos/39859805/pexels-photo-39859805.jpeg?auto=compress&cs=tinysrgb&w=1600",
  concrete: "https://images.pexels.com/photos/3882638/pexels-photo-3882638.jpeg?auto=compress&cs=tinysrgb&w=1600",
  profile: "https://images.pexels.com/photos/783975/pexels-photo-783975.jpeg?auto=compress&cs=tinysrgb&w=1600",
  portrait: "https://images.pexels.com/photos/764873/pexels-photo-764873.jpeg?auto=compress&cs=tinysrgb&w=1600",
  senior: "https://images.pexels.com/photos/8727569/pexels-photo-8727569.jpeg?auto=compress&cs=tinysrgb&w=1600",
  vases: "https://images.pexels.com/photos/6805522/pexels-photo-6805522.jpeg?auto=compress&cs=tinysrgb&w=1600",
  concert: "https://images.pexels.com/photos/13230484/pexels-photo-13230484.jpeg?auto=compress&cs=tinysrgb&w=1600",
  breadShelf: "https://images.pexels.com/photos/35993723/pexels-photo-35993723.jpeg?auto=compress&cs=tinysrgb&w=1600",
  oven: "https://images.pexels.com/photos/10481790/pexels-photo-10481790.jpeg?auto=compress&cs=tinysrgb&w=1600",
  shoes: "https://images.pexels.com/photos/1456733/pexels-photo-1456733.jpeg?auto=compress&cs=tinysrgb&w=1600",
  dental: "https://images.pexels.com/photos/305567/pexels-photo-305567.jpeg?auto=compress&cs=tinysrgb&w=1600",
  greenhouse: "https://images.pexels.com/photos/28961744/pexels-photo-28961744.jpeg?auto=compress&cs=tinysrgb&w=1600",
  desk: "https://images.pexels.com/photos/1128207/pexels-photo-1128207.jpeg?auto=compress&cs=tinysrgb&w=1600",
  room: "https://images.pexels.com/photos/6980724/pexels-photo-6980724.jpeg?auto=compress&cs=tinysrgb&w=1600",
};

/* A simple top bar used by several heroes; links hide on phones. */
function nav(brand: string, links: string[], cta: string, dark = false): El {
  const link = dark ? "text-sm text-white/80 hover:text-white" : "text-sm text-slate-600 hover:text-slate-900";
  return h(
    "div",
    "mx-auto flex max-w-6xl items-center justify-between px-6 py-5",
    a(dark ? "text-base font-semibold tracking-tight text-white" : "text-base font-semibold tracking-tight text-slate-900", brand),
    ha("nav", "hidden items-center gap-8 md:flex", { "aria-label": "Main" }, ...links.map((l) => a(link, l))),
    a(dark ? "rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100" : "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700", cta),
  );
}

const ring = " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

type Family = keyof typeof FAMILIES;
const FAMILIES = {
  centered: "Centered",
  split: "Split image",
  photo: "Photo background",
  saas: "SaaS and product",
  shop: "Ecommerce",
  app: "App download",
  studio: "Portfolio and agency",
  local: "Local business",
  event: "Event",
  newsletter: "Newsletter",
  proof: "Stats and trust",
  type: "Editorial and type",
  dark: "Dark and gradient",
} as const;

type Hero = { name: string; f: Family; n: El };

const HEROES: Hero[] = [
  /* ---------------- centered ---------------- */
  {
    name: "Centered with announcement pill",
    f: "centered",
    n: h("section", "bg-white",
      nav("Parcelwise", ["Product", "Pricing", "Customers", "Docs"], "Start free"),
      h("div", "mx-auto max-w-3xl px-6 pb-24 pt-16 text-center sm:pt-24",
        a("inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700 hover:border-slate-300", h("span", "rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white", "New"), "Shared inboxes for every warehouse", icon(D.arrow, "h-4 w-4")),
        h("h1", "mt-8 text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl", "Every order, every carrier, one calm screen"),
        h("p", "mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600", "Parcelwise pulls orders from your shop, prints the cheapest label and tells customers where their box is without anyone asking."),
        h("div", "mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row",
          a("w-full rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-700 sm:w-auto" + ring + " focus-visible:ring-emerald-600", "Start a 14 day trial"),
          a("w-full rounded-lg px-6 py-3 text-base font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:w-auto", "Book a walkthrough")),
        h("p", "mt-6 text-sm text-slate-500", "No card needed. Cancel from your settings page."))),
  },
  {
    name: "Centered with search bar",
    f: "centered",
    n: h("section", "bg-amber-50",
      h("div", "mx-auto max-w-3xl px-6 py-24 text-center sm:py-32",
        h("p", "text-sm font-semibold uppercase tracking-widest text-amber-800", "Findaway"),
        h("h1", "mt-4 text-4xl font-bold tracking-tight text-stone-900 sm:text-6xl", "Find a trusted tradesperson near you"),
        h("p", "mx-auto mt-6 max-w-xl text-lg text-stone-700", "Plumbers, electricians and joiners with checked insurance and real reviews from your neighbours."),
        h("div", "mx-auto mt-10 flex max-w-xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-lg shadow-amber-900/10 ring-1 ring-stone-200 sm:flex-row",
          ha("label", "sr-only", { for: "fa-job" }, "What do you need?"),
          ha("input", "min-w-0 flex-1 rounded-xl px-4 py-3 text-base text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600", { id: "fa-job", type: "text", placeholder: "Leaking tap, new socket, fence repair" }),
          ha("label", "sr-only", { for: "fa-post" }, "Postcode"),
          ha("input", "rounded-xl px-4 py-3 text-base text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600 sm:w-32", { id: "fa-post", type: "text", placeholder: "Postcode" }),
          b("inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white hover:bg-stone-700" + ring + " focus-visible:ring-stone-900", icon(D.search, "h-5 w-5"), "Search")),
        h("p", "mt-5 text-sm text-stone-600", "Popular: boiler service, bathroom fitting, garden clearance"))),
  },
  {
    name: "Centered minimal with one link",
    f: "centered",
    n: h("section", "bg-white",
      h("div", "mx-auto max-w-2xl px-6 py-32 sm:py-44",
        h("p", "font-mono text-sm text-slate-500", "Hessel Bookkeeping"),
        h("h1", "mt-6 text-3xl font-medium leading-snug tracking-tight text-slate-900 sm:text-4xl", "Quiet, careful books for small studios. You send receipts, we send a clear report on the first of every month."),
        a("mt-10 inline-flex items-center gap-2 border-b border-slate-900 pb-1 text-base font-medium text-slate-900 hover:gap-3 motion-safe:transition-all", "Ask about a monthly plan", icon(D.arrow, "h-4 w-4")))),
  },
  {
    name: "Centered with soft gradient wash",
    f: "centered",
    n: h("section", "bg-gradient-to-b from-sky-100 via-white to-white",
      nav("Tallyroom", ["Features", "Templates", "Pricing"], "Sign in"),
      h("div", "mx-auto max-w-4xl px-6 pb-28 pt-14 text-center sm:pt-20",
        h("h1", "text-4xl font-bold tracking-tight text-slate-900 sm:text-7xl", "Run the meeting. ", h("span", "text-sky-600", "Skip the minutes.")),
        h("p", "mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600", "Tallyroom listens in, writes the decisions and owners as they happen, and posts a tidy summary to your team channel the moment you hang up."),
        h("div", "mt-10 flex flex-wrap justify-center gap-3",
          a("rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700" + ring + " focus-visible:ring-sky-600", "Try it on your next call"),
          a("inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50", solid(D.play, "h-4 w-4 text-sky-600"), "See a sample summary")))),
  },
  /* ---------------- split ---------------- */
  {
    name: "Split with photo on the right",
    f: "split",
    n: h("section", "bg-stone-50",
      h("div", "mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28",
        h("div", "",
          h("p", "text-sm font-medium text-stone-600", "Hallow Interiors, Bristol"),
          h("h1", "mt-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl", "Rooms that feel finished, without the year of decisions"),
          h("p", "mt-6 max-w-lg text-lg leading-relaxed text-stone-600", "One visit, one moodboard, one fixed fee. We source every piece, book the trades and hand you the keys to a room that is done."),
          h("div", "mt-8 flex flex-wrap gap-3",
            a("rounded-md bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700", "Book a home visit"),
            a("rounded-md px-5 py-3 text-sm font-semibold text-stone-900 ring-1 ring-inset ring-stone-300 hover:bg-white", "See finished rooms"))),
        h("div", "relative",
          img(PH.living, "Bright living room with soft white sofas and long linen curtains", "aspect-[4/5] w-full rounded-2xl bg-stone-200 object-cover sm:aspect-[5/4] lg:aspect-[4/5]"),
          h("div", "absolute bottom-4 left-4 rounded-xl bg-white/95 px-4 py-3 shadow-lg", h("p", "text-xs text-stone-500", "Typical project"), h("p", "text-sm font-semibold text-stone-900", "6 weeks, one room"))))),
  },
  {
    name: "Split with photo on the left",
    f: "split",
    n: h("section", "bg-white",
      h("div", "mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24",
        img(PH.concrete, "Curved modern concrete building against a deep blue sky", "order-last aspect-[4/3] w-full rounded-3xl bg-sky-900 object-cover lg:order-first"),
        h("div", "",
          h("p", "font-mono text-xs uppercase tracking-[0.2em] text-slate-500", "Atelier Brut, architects"),
          h("h1", "mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl", "Buildings with weight, light and a long life"),
          h("p", "mt-6 text-lg leading-relaxed text-slate-600", "We design schools, libraries and homes in honest materials, and we stay on site until the last joint is sealed."),
          h("ul", "mt-8 space-y-3 text-slate-700", ...["Planning and listed building consent", "Low carbon concrete and timber frames", "Full contract administration"].map((x) => h("li", "flex gap-3", icon(D.check, "mt-0.5 h-5 w-5 shrink-0 text-slate-900"), x))),
          a("mt-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 underline underline-offset-4", "View the project archive", icon(D.arrow, "h-4 w-4"))))),
  },
  {
    name: "Split with lead form card",
    f: "split",
    n: h("section", "bg-slate-900",
      h("div", "mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28",
        h("div", "",
          h("p", "text-sm font-semibold text-teal-300", "Greyhaven Roofing"),
          h("h1", "mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl", "A fixed price for your roof within 48 hours"),
          h("p", "mt-6 max-w-lg text-lg text-slate-300", "Tell us what is wrong. A surveyor checks it by drone, sends photos and a written price, and you only pay when the job is signed off."),
          h("dl", "mt-10 grid max-w-md grid-cols-2 gap-6",
            h("div", "", h("dt", "text-sm text-slate-400", "Guarantee"), h("dd", "mt-1 text-2xl font-semibold text-white", "15 years")),
            h("div", "", h("dt", "text-sm text-slate-400", "Callout fee"), h("dd", "mt-1 text-2xl font-semibold text-white", "None")))),
        h("div", "rounded-2xl bg-white p-6 shadow-2xl sm:p-8",
          h("h2", "text-xl font-semibold text-slate-900", "Get your price"),
          h("div", "mt-6 space-y-4",
            h("div", "", ha("label", "block text-sm font-medium text-slate-700", { for: "gr-name" }, "Name"), ha("input", "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30", { id: "gr-name", type: "text", autocomplete: "name" })),
            h("div", "", ha("label", "block text-sm font-medium text-slate-700", { for: "gr-post" }, "Postcode"), ha("input", "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30", { id: "gr-post", type: "text", autocomplete: "postal-code" })),
            h("div", "", ha("label", "block text-sm font-medium text-slate-700", { for: "gr-issue" }, "What needs fixing?"), ha("textarea", "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30", { id: "gr-issue", rows: "3" })),
            b("w-full rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700" + ring + " focus-visible:ring-teal-600", "Send my details")),
          h("p", "mt-4 text-xs text-slate-500", "We reply by phone or email, never both.")))),
  },
  {
    name: "Split with testimonial over photo",
    f: "split",
    n: h("section", "bg-orange-50",
      h("div", "mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-24",
        h("div", "",
          h("p", "text-sm font-semibold text-orange-800", "Moving Well physiotherapy"),
          h("h1", "mt-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl", "Strong knees, steady balance, at any age"),
          h("p", "mt-6 max-w-lg text-lg text-stone-700", "Small group classes and one to one sessions for people over sixty, led by chartered physiotherapists in a calm, step free studio."),
          h("div", "mt-8 flex flex-wrap gap-3",
            a("rounded-full bg-orange-700 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-800", "Book a free first session"),
            a("rounded-full px-6 py-3 text-sm font-semibold text-stone-900 ring-1 ring-stone-300 hover:bg-white", "Class timetable"))),
        h("figure", "relative",
          img(PH.senior, "Smiling older woman in a casual outfit photographed against a dark background", "aspect-[4/3] w-full rounded-3xl bg-stone-800 object-cover"),
          h("figcaption", "absolute -bottom-6 left-4 right-4 rounded-2xl bg-white p-5 shadow-xl sm:left-auto sm:w-80",
            h("blockquote", "text-sm leading-relaxed text-stone-800", "\"I can carry my shopping up the hill again. The Tuesday class is the best hour of my week.\""),
            h("p", "mt-3 text-xs font-semibold text-stone-600", "Margaret, 74, member since spring"))))),
  },
  {
    name: "Split with photo collage",
    f: "split",
    n: h("section", "bg-white",
      h("div", "mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2",
        h("div", "",
          h("p", "text-sm font-semibold text-emerald-700", "Kolm Trails"),
          h("h1", "mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl", "Small group hikes to lakes most people never see"),
          h("p", "mt-6 text-lg text-slate-600", "Eight walkers, one local guide, packed lunches and the train times worked out for you. Easy, moderate and hard routes every weekend."),
          a("mt-8 inline-flex rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800", "Browse this month's walks")),
        h("div", "grid grid-cols-2 gap-3",
          img(PH.lake, "Calm mountain lake reflecting a blue sky and green slopes", "col-span-2 aspect-[16/9] w-full rounded-2xl bg-sky-800 object-cover"),
          img(PH.sunsetLake, "Lake with a sailboat and alpine peaks at sunset", "aspect-square w-full rounded-2xl bg-amber-700 object-cover"),
          img(PH.greenLake, "Turquoise lake surrounded by forested hills", "aspect-square w-full rounded-2xl bg-emerald-800 object-cover")))),
  },
  /* ---------------- photo background ---------------- */
  {
    name: "Full bleed photo with booking bar",
    f: "photo",
    n: h("section", "relative isolate overflow-hidden bg-slate-800",
      img(PH.lake, "Mountain lake reflecting blue sky and green hills", "absolute inset-0 -z-10 h-full w-full object-cover"),
      h("div", "absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-slate-900/10"),
      nav("Fjellhus Lodges", ["Cabins", "Activities", "Getting here"], "Book", true),
      h("div", "mx-auto max-w-6xl px-6 pb-16 pt-32 sm:pt-48",
        h("h1", "max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-6xl", "Wake up to the water, not the alarm"),
        h("p", "mt-5 max-w-lg text-lg text-white/85", "Twelve timber cabins on a quiet lake, each with a wood stove, a rowing boat and no wifi unless you ask."),
        h("div", "mt-10 grid gap-2 rounded-2xl bg-white p-2 sm:grid-cols-[1fr_1fr_1fr_auto]",
          ...[["fj-in", "Arrive", "Fri 14 Nov"], ["fj-out", "Leave", "Sun 16 Nov"], ["fj-g", "Guests", "2 adults"]].map(([id, l, v]) =>
            h("div", "rounded-xl px-4 py-2 hover:bg-slate-50", ha("label", "block text-xs font-medium text-slate-500", { for: id }, l), ha("input", "w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none", { id, type: "text", value: v, readonly: "" }))),
          b("rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700", "Check dates")))),
  },
  {
    name: "Photo background with left panel",
    f: "photo",
    n: h("section", "relative isolate bg-stone-900",
      img(PH.room, "Contemporary living room with a sofa, side tables and a chandelier", "absolute inset-0 -z-10 h-full w-full object-cover"),
      h("div", "mx-auto flex min-h-[640px] max-w-6xl items-center px-6 py-16",
        h("div", "max-w-md rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur sm:p-10",
          h("p", "text-xs font-semibold uppercase tracking-widest text-stone-500", "Calder and Pike estate agents"),
          h("h1", "mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl", "Homes worth moving for"),
          h("p", "mt-4 text-stone-600", "Hand picked flats and houses across the city, with honest floor plans and every viewing hosted by the agent who knows it."),
          h("div", "mt-6 flex gap-2",
            ha("label", "sr-only", { for: "cp-area" }, "Area or postcode"),
            ha("input", "min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none", { id: "cp-area", type: "text", placeholder: "Area or postcode" }),
            b("rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700", "Search")),
          h("p", "mt-4 text-sm text-stone-500", "Or ", a("font-medium text-stone-900 underline", "book a free valuation"))))),
  },
  {
    name: "Video poster with play button",
    f: "photo",
    n: h("section", "bg-black",
      h("div", "relative isolate mx-auto max-w-6xl overflow-hidden",
        img(PH.concert, "Night concert with a crowd facing a stage lit in colour", "absolute inset-0 -z-10 h-full w-full object-cover opacity-70"),
        h("div", "absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/60 to-transparent"),
        h("div", "flex min-h-[620px] flex-col justify-center px-6 py-20 sm:px-12",
          h("p", "text-sm font-semibold uppercase tracking-widest text-pink-400", "Lowfield Festival, 12 to 14 June"),
          h("h1", "mt-4 max-w-xl text-5xl font-black uppercase leading-none tracking-tight text-white sm:text-7xl", "Three nights in the field"),
          h("p", "mt-6 max-w-md text-lg text-white/80", "Forty bands, two stages, one lake to swim in. Watch last year's film, then grab a weekend pass before the price steps up."),
          h("div", "mt-10 flex flex-wrap items-center gap-4",
            b("group inline-flex items-center gap-3 rounded-full bg-white py-2 pl-2 pr-6 text-sm font-semibold text-black hover:bg-pink-100" + ring + " focus-visible:ring-white focus-visible:ring-offset-black",
              h("span", "grid h-10 w-10 place-items-center rounded-full bg-pink-500 text-white", solid(D.play, "h-4 w-4")), "Watch the 2 minute film"),
            a("rounded-full px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/40 hover:bg-white/10", "Weekend passes"))))),
  },
  {
    name: "Warm photo with opening hours",
    f: "photo",
    n: h("section", "relative isolate bg-amber-950",
      img(PH.breadShelf, "Artisan loaves lined up on rustic wooden shelves", "absolute inset-0 -z-10 h-full w-full object-cover"),
      h("div", "absolute inset-0 -z-10 bg-amber-950/60"),
      h("div", "mx-auto max-w-4xl px-6 py-28 text-center sm:py-40",
        h("p", "font-serif text-lg italic text-amber-200", "Crumb and Co, since 1998"),
        h("h1", "mt-4 font-serif text-5xl text-white sm:text-7xl", "Bread baked at four, gone by noon"),
        h("p", "mx-auto mt-6 max-w-lg text-lg text-amber-50/90", "Sourdough, rye and seeded loaves from a wood fired oven on Mill Lane. Order the night before and we will hold yours."),
        h("div", "mt-10 flex flex-wrap justify-center gap-3",
          a("rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-amber-950 hover:bg-amber-300", "Order for tomorrow"),
          a("rounded-full px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/50 hover:bg-white/10", "Today's bake")),
        h("p", "mt-10 inline-flex items-center gap-2 text-sm text-amber-100", icon(D.clock, "h-4 w-4"), "Tue to Sat, 7am to 2pm"))),
  },
  /* ---------------- SaaS ---------------- */
  {
    name: "SaaS with product screenshot",
    f: "saas",
    n: h("section", "overflow-hidden bg-white",
      nav("Ledgerly", ["Invoices", "Expenses", "Tax", "Pricing"], "Get started"),
      h("div", "mx-auto max-w-6xl px-6 pt-16 text-center",
        h("h1", "mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl", "Bookkeeping that closes itself every month"),
        h("p", "mx-auto mt-6 max-w-xl text-lg text-slate-600", "Ledgerly matches bank lines to receipts, chases late invoices and has your VAT return ready to check, not to build."),
        h("div", "mt-8 flex justify-center gap-3", a("rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700", "Start free"), a("rounded-lg px-5 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50", "Talk to us")),
        h("div", "relative mx-auto mt-16 max-w-5xl rounded-t-2xl border border-b-0 border-slate-200 bg-slate-50 p-3 shadow-2xl shadow-indigo-900/10",
          h("div", "flex gap-1.5 px-2 pb-3", h("span", "h-3 w-3 rounded-full bg-slate-300"), h("span", "h-3 w-3 rounded-full bg-slate-300"), h("span", "h-3 w-3 rounded-full bg-slate-300")),
          h("div", "grid gap-3 rounded-t-xl bg-white p-4 text-left sm:grid-cols-[180px_1fr]",
            h("div", "hidden space-y-2 sm:block", ...["Overview", "Bank", "Invoices", "Bills", "Reports"].map((x, i) => h("div", i === 1 ? "rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700" : "rounded-md px-3 py-2 text-sm text-slate-600", x))),
            h("div", "space-y-3",
              h("div", "grid grid-cols-3 gap-3", ...[["Cash", "£48,210"], ["Owed to you", "£12,940"], ["To match", "3"]].map(([l, v]) => h("div", "rounded-lg border border-slate-200 p-3", h("p", "text-xs text-slate-500", l), h("p", "mt-1 text-lg font-semibold text-slate-900", v)))),
              ...[["Northwind Paper", "-£312.40", "Matched"], ["Client: Orla Hayes", "+£2,400.00", "Matched"], ["Fuel, M4 services", "-£68.15", "Needs receipt"]].map(([p, v, s]) =>
                h("div", "flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm", h("span", "text-slate-800", p), h("span", "flex items-center gap-3", h("span", "font-mono text-slate-700", v), h("span", s === "Matched" ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700" : "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800", s))))))))),
  },
  {
    name: "SaaS split with checklist and dashboard card",
    f: "saas",
    n: h("section", "bg-slate-50",
      h("div", "mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28",
        h("div", "",
          h("p", "text-sm font-semibold text-violet-700", "Rotawise for clinics"),
          h("h1", "mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl", "Fill every shift without a single group text"),
          h("ul", "mt-8 space-y-4", ...["Open shifts go to the right staff first", "Swaps are approved in one tap", "Hours feed straight into payroll"].map((x) => h("li", "flex items-start gap-3 text-slate-700", h("span", "grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700", icon(D.check, "h-4 w-4")), x))),
          h("div", "mt-10 flex flex-wrap gap-3", a("rounded-lg bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800", "Try Rotawise free"), a("rounded-lg px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-white", "See pricing"))),
        h("div", "rounded-2xl border border-slate-200 bg-white p-6 shadow-xl",
          h("div", "flex items-center justify-between", h("p", "font-semibold text-slate-900", "This week"), h("span", "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700", "All shifts covered")),
          h("div", "mt-6 grid grid-cols-5 gap-2 text-center text-xs text-slate-500", ...["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => h("span", "", d))),
          h("div", "mt-2 grid grid-cols-5 gap-2", ...["AK", "JL", "PM", "AK", "SR", "TB", "PM", "JL", "TB", "AK"].map((x, i) => h("div", i === 6 ? "rounded-lg bg-violet-600 py-3 text-center text-xs font-semibold text-white" : "rounded-lg bg-violet-50 py-3 text-center text-xs font-semibold text-violet-800", x))),
          h("p", "mt-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-600", "Priya swapped Wednesday late with Tom. Approved by you at 09:14.")))),
  },
  {
    name: "Developer tool with install command",
    f: "saas",
    n: h("section", "bg-zinc-950",
      h("div", "mx-auto max-w-4xl px-6 py-24 text-center sm:py-32",
        h("p", "font-mono text-sm text-lime-400", "kiteline v2.0"),
        h("h1", "mt-5 text-4xl font-semibold tracking-tight text-white sm:text-6xl", "Preview every branch at its own address"),
        h("p", "mx-auto mt-6 max-w-xl text-lg text-zinc-400", "Push a branch, get a live link in under a minute, share it with your reviewer and throw it away on merge."),
        h("div", "mx-auto mt-10 flex max-w-md items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 font-mono text-sm",
          h("code", "text-zinc-200", h("span", "text-zinc-500", "$ "), "npx kiteline init"),
          b("rounded-md px-2 py-1 text-xs text-zinc-400 ring-1 ring-zinc-700 hover:text-white", "Copy")),
        h("div", "mt-8 flex justify-center gap-6 text-sm", a("font-semibold text-white hover:text-lime-400", "Read the docs"), a("text-zinc-400 hover:text-white", "Self hosting guide")))),
  },
  {
    name: "Bento grid hero",
    f: "saas",
    n: h("section", "bg-neutral-100",
      h("div", "mx-auto max-w-6xl px-6 py-20",
        h("div", "grid gap-4 lg:grid-cols-3",
          h("div", "rounded-3xl bg-white p-8 lg:col-span-2 lg:row-span-2 lg:p-12",
            h("p", "text-sm font-semibold text-rose-600", "Plotline"),
            h("h1", "mt-4 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-6xl", "Plan the whole launch on one board"),
            h("p", "mt-6 max-w-md text-lg text-neutral-600", "Briefs, copy, assets and dates live together, so nobody ships last week's file."),
            a("mt-10 inline-flex rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700", "Start a board")),
          h("div", "rounded-3xl bg-rose-600 p-8 text-white", h("p", "text-5xl font-semibold", "1 board"), h("p", "mt-2 text-rose-100", "for briefs, files, owners and deadlines")),
          h("div", "rounded-3xl bg-neutral-900 p-8 text-white",
            h("p", "text-sm text-neutral-400", "Due Friday"),
            h("ul", "mt-4 space-y-2 text-sm", ...["Landing page copy", "Launch email", "Social cut downs"].map((x, i) => h("li", "flex items-center gap-2", h("span", i === 0 ? "h-2 w-2 rounded-full bg-emerald-400" : "h-2 w-2 rounded-full bg-neutral-600"), x))))))),
  },
  {
    name: "Product launch with version and shortcut",
    f: "saas",
    n: h("section", "bg-white",
      h("div", "mx-auto max-w-3xl px-6 py-24 sm:py-32",
        h("div", "flex items-center gap-3 text-sm", h("span", "rounded-md bg-blue-600 px-2 py-0.5 font-mono text-xs font-semibold text-white", "4.0"), h("span", "text-slate-600", "Released this week")),
        h("h1", "mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl", "Notecraft 4 finds anything you ever wrote"),
        h("p", "mt-6 text-lg leading-8 text-slate-600", "Search now reads inside scanned PDFs, photos of whiteboards and old voice memos. Press ", h("kbd", "rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono text-sm text-slate-800", "Ctrl"), " ", h("kbd", "rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono text-sm text-slate-800", "K"), " and start typing."),
        h("div", "mt-10 flex flex-wrap gap-3", a("inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700", icon(D.down, "h-4 w-4"), "Download for desktop"), a("rounded-lg px-5 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50", "What changed in 4.0")))),
  },
  {
    name: "Pricing teaser hero",
    f: "saas",
    n: h("section", "bg-emerald-950",
      h("div", "mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28",
        h("div", "",
          h("h1", "text-4xl font-semibold tracking-tight text-white sm:text-5xl", "Payroll for teams of 2 to 50, at one flat price"),
          h("p", "mt-6 text-lg text-emerald-100/80", "Payslips, pensions and tax filings handled every month. No per head fees, no setup charge, no year long contract."),
          a("mt-10 inline-flex rounded-lg bg-emerald-400 px-6 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-300", "Run your first payroll free")),
        h("div", "rounded-3xl bg-white p-8",
          h("p", "text-sm font-semibold text-emerald-800", "Paysheet Standard"),
          h("p", "mt-4 flex items-baseline gap-2", h("span", "text-5xl font-semibold tracking-tight text-slate-900", "£49"), h("span", "text-slate-500", "per month")),
          h("ul", "mt-6 space-y-3 text-sm text-slate-700", ...["Up to 50 employees", "Auto enrolment pensions", "Year end forms included", "Help by phone on payday"].map((x) => h("li", "flex gap-2", icon(D.check, "h-5 w-5 text-emerald-600"), x))),
          a("mt-8 block rounded-lg bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-700", "Choose Standard")))),
  },
  /* ---------------- ecommerce ---------------- */
  {
    name: "Ecommerce product hero with swatches",
    f: "shop",
    n: h("section", "bg-zinc-100",
      h("div", "mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24",
        img(PH.shoes, "Pair of grey knit running shoes standing heel up on a pale grey background", "aspect-square w-full rounded-3xl bg-zinc-300 object-cover"),
        h("div", "",
          h("p", "text-sm font-semibold uppercase tracking-widest text-zinc-500", "Stride Lab"),
          h("h1", "mt-3 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl", "Fog Runner 2"),
          h("p", "mt-4 text-2xl font-semibold text-zinc-900", "£118"),
          h("p", "mt-6 max-w-md text-zinc-600", "A knitted upper that breathes, a foam sole that springs back for 800 km, and a heel that stays put on wet pavements."),
          h("fieldset", "mt-8", h("legend", "text-sm font-medium text-zinc-900", "Colour: Fog grey"),
            h("div", "mt-3 flex gap-3", ...[["Fog grey", "bg-zinc-400 ring-2 ring-zinc-900 ring-offset-2"], ["Midnight", "bg-slate-800"], ["Clay", "bg-orange-300"]].map(([l, c]) => ha("button", "h-9 w-9 rounded-full " + c, { type: "button", "aria-label": l })))),
          h("div", "mt-8 flex flex-col gap-3 sm:flex-row",
            b("inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 py-3.5 font-semibold text-white hover:bg-zinc-700", icon(D.bag, "h-5 w-5"), "Add to bag"),
            b("rounded-full px-6 py-3.5 font-semibold text-zinc-900 ring-1 ring-zinc-300 hover:bg-white", "Find my size")),
          h("p", "mt-4 text-sm text-zinc-600", "Free returns within 30 days of delivery.")))),
  },
  {
    name: "Ecommerce collection launch",
    f: "shop",
    n: h("section", "bg-[#efe9e1]",
      h("div", "mx-auto max-w-6xl px-6 py-16 lg:py-20",
        h("div", "flex flex-col justify-between gap-6 md:flex-row md:items-end",
          h("div", "", h("p", "text-sm text-stone-600", "Mudroom Ceramics, autumn kiln"), h("h1", "mt-3 max-w-xl font-serif text-5xl text-stone-900 sm:text-6xl", "Thrown by hand, glazed in small batches")),
          a("inline-flex items-center gap-2 self-start rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700 md:self-auto", "Shop the collection", icon(D.arrow, "h-4 w-4"))),
        h("div", "mt-12 grid gap-4 md:grid-cols-3",
          img(PH.vases, "Group of handmade ceramic vases in neutral tones", "aspect-[4/3] w-full rounded-2xl bg-stone-300 object-cover md:col-span-2 md:aspect-auto md:h-full"),
          h("div", "flex flex-col justify-between rounded-2xl bg-white p-6",
            h("div", "", h("p", "text-xs font-semibold uppercase tracking-widest text-stone-500", "This batch"), h("p", "mt-3 text-lg text-stone-800", "Forty two pieces in oat, ash and iron glazes. Each one is signed on the base.")),
            h("p", "mt-6 text-sm text-stone-600", "Ships wrapped in recycled paper within 3 working days."))))),
  },
  {
    name: "Ecommerce sale banner hero",
    f: "shop",
    n: h("section", "bg-yellow-300",
      h("div", "mx-auto max-w-6xl px-6 py-20 sm:py-28",
        h("p", "text-sm font-bold uppercase tracking-widest text-yellow-900", "Plantpot Supply, end of season"),
        h("h1", "mt-4 text-6xl font-black uppercase leading-[0.9] tracking-tight text-neutral-950 sm:text-8xl", "Up to 40% off pots and planters"),
        h("div", "mt-10 flex flex-col gap-4 sm:flex-row sm:items-center",
          a("inline-flex justify-center rounded-none bg-neutral-950 px-8 py-4 text-base font-bold text-yellow-300 hover:bg-neutral-800", "Shop the sale"),
          h("p", "text-base font-medium text-neutral-900", "Ends Sunday at midnight. Free delivery over £40.")))),
  },
  {
    name: "Ecommerce hero with greenhouse photo",
    f: "shop",
    n: h("section", "bg-white",
      h("div", "mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:py-24",
        h("div", "",
          h("p", "text-sm font-semibold text-green-800", "Fernhouse plant shop"),
          h("h1", "mt-4 text-4xl font-semibold tracking-tight text-green-950 sm:text-5xl", "Healthy plants, delivered in their own pots"),
          h("p", "mt-6 text-lg text-slate-600", "Grown in our glasshouse, packed upright and delivered by our own van across the city. Every plant comes with a care card."),
          h("div", "mt-8 flex flex-wrap gap-3", a("rounded-full bg-green-800 px-6 py-3 text-sm font-semibold text-white hover:bg-green-900", "Shop plants"), a("rounded-full px-6 py-3 text-sm font-semibold text-green-900 ring-1 ring-green-800/30 hover:bg-green-50", "Help me choose"))),
        img(PH.greenhouse, "Greenhouse full of ferns and palms under a glass roof", "aspect-[4/3] w-full rounded-[2rem] bg-green-900 object-cover"))),
  },
  /* ---------------- app ---------------- */
  {
    name: "App download with phone mockup",
    f: "app",
    n: h("section", "overflow-hidden bg-indigo-50",
      h("div", "mx-auto grid max-w-6xl items-center gap-12 px-6 pt-20 lg:grid-cols-2 lg:pt-24",
        h("div", "pb-12 lg:pb-24",
          h("p", "text-sm font-semibold text-indigo-700", "Pocketbudget"),
          h("h1", "mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl", "Know what is safe to spend today"),
          h("p", "mt-6 max-w-md text-lg text-slate-600", "Pocketbudget sets aside bills and savings the day you are paid, then shows one number: what is left for you."),
          h("div", "mt-8 flex flex-wrap gap-3",
            a("inline-flex items-center gap-3 rounded-xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-700", icon(D.phone, "h-6 w-6"), h("span", "text-left leading-tight", h("span", "block text-xs text-slate-300", "Download for"), h("span", "block text-sm font-semibold", "iPhone"))),
            a("inline-flex items-center gap-3 rounded-xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-700", icon(D.phone, "h-6 w-6"), h("span", "text-left leading-tight", h("span", "block text-xs text-slate-300", "Download for"), h("span", "block text-sm font-semibold", "Android"))))),
        h("div", "mx-auto w-64 rounded-t-[2.5rem] border-[10px] border-b-0 border-slate-900 bg-white px-5 pb-10 pt-8 shadow-2xl sm:w-72",
          h("p", "text-xs text-slate-500", "Safe to spend today"),
          h("p", "mt-1 text-4xl font-bold tracking-tight text-slate-900", "£23.40"),
          h("div", "mt-4 h-2 rounded-full bg-slate-100", h("div", "h-2 w-2/3 rounded-full bg-indigo-600")),
          h("ul", "mt-6 space-y-3 text-sm", ...[["Rent", "Set aside"], ["Phone", "Set aside"], ["Holiday pot", "£15 saved"]].map(([l, r]) => h("li", "flex justify-between rounded-lg bg-slate-50 px-3 py-2.5", h("span", "text-slate-700", l), h("span", "font-medium text-indigo-700", r))))))),
  },
  {
    name: "Dark app hero with feature chips",
    f: "app",
    n: h("section", "bg-[#0c0a09]",
      h("div", "mx-auto max-w-4xl px-6 py-24 text-center sm:py-32",
        h("div", "mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-white", icon(D.clock, "h-8 w-8")),
        h("h1", "mt-8 text-4xl font-semibold tracking-tight text-white sm:text-6xl", "Stillpoint, a focus timer that blocks the noise"),
        h("p", "mx-auto mt-6 max-w-xl text-lg text-stone-400", "Pick a task, start the timer and your phone goes quiet. When the bell rings you get five minutes back."),
        h("ul", "mt-8 flex flex-wrap justify-center gap-2", ...["Works offline", "No account needed", "Daily streaks", "Widgets"].map((x) => h("li", "rounded-full border border-stone-800 px-3 py-1 text-sm text-stone-300", x))),
        h("div", "mt-10 flex flex-col justify-center gap-3 sm:flex-row",
          a("rounded-xl bg-white px-6 py-3 text-sm font-semibold text-stone-950 hover:bg-stone-200", "Get it for iPhone"),
          a("rounded-xl px-6 py-3 text-sm font-semibold text-white ring-1 ring-stone-700 hover:bg-stone-900", "Get it for Android")))),
  },
  /* ---------------- portfolio and agency ---------------- */
  {
    name: "Portfolio with name and availability",
    f: "studio",
    n: h("section", "bg-white",
      h("div", "mx-auto max-w-6xl px-6 py-20 sm:py-28",
        h("p", "inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-800", h("span", "h-2 w-2 rounded-full bg-emerald-500"), "Taking projects from January"),
        h("h1", "mt-8 text-5xl font-semibold tracking-tight text-neutral-900 sm:text-7xl", "Mira Okafor"),
        h("p", "mt-4 max-w-2xl text-2xl leading-snug text-neutral-500", "Product designer. I turn messy internal tools into software people are happy to open on a Monday."),
        h("ul", "mt-14 divide-y divide-neutral-200 border-y border-neutral-200",
          ...[["Harbour Freight dispatch app", "2025"], ["Kettle and Co ordering kiosk", "2024"], ["Field notes for county surveyors", "2023"]].map(([p, y]) => h("li", "", a("flex items-center justify-between py-5 text-lg text-neutral-900 hover:text-neutral-500", p, h("span", "font-mono text-sm text-neutral-500", y))))))),
  },
  {
    name: "Agency hero with giant statement",
    f: "studio",
    n: h("section", "bg-[#f3f1ec]",
      nav("Northfold", ["Work", "Services", "Studio", "Journal"], "Start a project"),
      h("div", "mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24",
        h("h1", "text-5xl font-medium leading-[0.95] tracking-tighter text-neutral-950 sm:text-8xl", "We make brands people ", h("em", "font-serif font-normal italic", "remember"), " and websites they finish reading."),
        h("div", "mt-16 grid gap-8 border-t border-neutral-300 pt-8 sm:grid-cols-3",
          ...[["Brand", "Names, identities and voice"], ["Web", "Sites built to be edited by you"], ["Campaigns", "Launches, film and print"]].map(([t, d]) => h("div", "", h("p", "text-sm font-semibold text-neutral-950", t), h("p", "mt-1 text-sm text-neutral-600", d)))))),
  },
  {
    name: "Photographer portfolio with portrait",
    f: "studio",
    n: h("section", "bg-neutral-950",
      h("div", "mx-auto grid max-w-6xl items-end gap-10 px-6 py-16 lg:grid-cols-[1.2fr_1fr] lg:py-24",
        img(PH.profile, "Black and white profile portrait of a woman looking away", "aspect-[4/3] w-full bg-neutral-800 object-cover grayscale"),
        h("div", "",
          h("p", "font-mono text-xs uppercase tracking-[0.25em] text-neutral-500", "Portraits, editorial"),
          h("h1", "mt-6 text-5xl font-light tracking-tight text-white sm:text-6xl", "Juno Vale"),
          h("p", "mt-6 text-lg text-neutral-400", "Natural light portraits for authors, musicians and founders. Shot in my north facing studio or wherever you work."),
          h("div", "mt-10 flex gap-6 text-sm", a("font-semibold text-white underline underline-offset-4", "See the portfolio"), a("text-neutral-400 hover:text-white", "Rates and booking"))))),
  },
  {
    name: "Course hero with module list",
    f: "studio",
    n: h("section", "bg-white",
      h("div", "mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:py-24",
        h("div", "",
          h("p", "text-sm font-semibold text-fuchsia-700", "Online course, 6 weeks"),
          h("h1", "mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl", "Type for Screens, a practical typography course"),
          h("p", "mt-6 text-lg text-slate-600", "Short lessons, weekly critiques and real project files. Taught by Dara Whitlock, who has set type for newspapers and banking apps."),
          h("div", "mt-8 flex items-center gap-4",
            a("rounded-lg bg-fuchsia-700 px-6 py-3 text-sm font-semibold text-white hover:bg-fuchsia-800", "Join the March cohort"),
            h("p", "text-sm text-slate-600", "£290, or 3 payments"))),
        h("ol", "space-y-3",
          ...["Reading distance and size", "Choosing two typefaces", "Line length and rhythm", "Type in components", "Numbers and tables", "Final critique"].map((x, i) => h("li", "flex items-center gap-4 rounded-xl border border-slate-200 p-4", h("span", "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-fuchsia-50 font-mono text-sm font-semibold text-fuchsia-700", String(i + 1)), h("span", "text-slate-800", x)))))),
  },
  /* ---------------- local ---------------- */
  {
    name: "Local business with photo and contact details",
    f: "local",
    n: h("section", "bg-sky-50",
      h("div", "mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2",
        h("div", "",
          h("p", "text-sm font-semibold text-sky-800", "Brightside Dental, Harrow Road"),
          h("h1", "mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl", "A dentist you will not dread visiting"),
          h("p", "mt-6 text-lg text-slate-600", "Unhurried check ups, clear prices before any treatment and evening appointments until 8pm on weekdays."),
          h("div", "mt-8 flex flex-wrap gap-3", a("rounded-full bg-sky-700 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-800", "Book online"), a("rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50", "Call 020 7946 0321")),
          h("dl", "mt-10 grid gap-4 text-sm sm:grid-cols-2",
            h("div", "flex gap-3", icon(D.pin, "h-5 w-5 text-sky-700"), h("div", "", h("dt", "font-medium text-slate-900", "Address"), h("dd", "text-slate-600", "48 Harrow Road, London W2"))),
            h("div", "flex gap-3", icon(D.clock, "h-5 w-5 text-sky-700"), h("div", "", h("dt", "font-medium text-slate-900", "Open"), h("dd", "text-slate-600", "Mon to Fri 8am to 8pm, Sat 9am to 1pm"))))),
        img(PH.dental, "Bright modern dental treatment room with a reclining chair", "aspect-[4/3] w-full rounded-3xl bg-sky-200 object-cover"))),
  },
  {
    name: "Cafe hero with menu highlights",
    f: "local",
    n: h("section", "bg-[#1f1a17]",
      h("div", "mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24",
        img(PH.barista, "Barista in an apron steaming milk at an espresso machine", "aspect-[4/3] w-full rounded-2xl bg-stone-800 object-cover"),
        h("div", "",
          h("p", "text-sm font-semibold uppercase tracking-widest text-amber-400", "Ferro Coffee"),
          h("h1", "mt-4 text-4xl font-semibold tracking-tight text-stone-50 sm:text-5xl", "Roasted on Tuesday, poured by Wednesday"),
          h("ul", "mt-8 divide-y divide-stone-800 border-y border-stone-800",
            ...[["Flat white", "£3.40"], ["Filter of the week", "£3.10"], ["Cardamom bun", "£2.90"]].map(([n, p]) => h("li", "flex justify-between py-3 text-stone-200", h("span", "", n), h("span", "font-mono text-stone-400", p)))),
          h("div", "mt-8 flex flex-wrap gap-3", a("rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-300", "Order ahead"), a("rounded-full px-6 py-3 text-sm font-semibold text-stone-100 ring-1 ring-stone-700 hover:bg-stone-800", "Buy beans"))))),
  },
  {
    name: "Restaurant hero with reservation strip",
    f: "local",
    n: h("section", "relative isolate bg-stone-950",
      img(PH.oven, "Loaves baking inside a glowing professional oven", "absolute inset-0 -z-10 h-full w-full object-cover opacity-60"),
      h("div", "mx-auto flex min-h-[620px] max-w-6xl flex-col justify-end px-6 pb-12 pt-32",
        h("h1", "max-w-3xl font-serif text-5xl text-white sm:text-7xl", "Osteria Lume"),
        h("p", "mt-4 max-w-lg text-lg text-stone-200", "Wood oven cooking, a short daily menu and wine from small growers. Tables for two to eight, walk ins at the bar."),
        h("div", "mt-10 flex flex-col gap-3 border-t border-white/20 pt-6 sm:flex-row sm:items-center sm:justify-between",
          h("p", "flex items-center gap-2 text-sm text-stone-300", icon(D.pin, "h-4 w-4"), "17 Canal Street, open Wed to Sun from 5pm"),
          a("rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-stone-950 hover:bg-stone-200", "Reserve a table")))),
  },
  {
    name: "Coworking hero with day pass price",
    f: "local",
    n: h("section", "bg-white",
      h("div", "mx-auto max-w-6xl px-6 py-16 lg:py-20",
        h("div", "relative overflow-hidden rounded-[2rem] bg-slate-200",
          img(PH.desk, "Tidy desk with a laptop and a glass of water by a bright window", "h-[520px] w-full object-cover"),
          h("div", "absolute inset-x-4 bottom-4 rounded-2xl bg-white p-6 shadow-xl sm:inset-x-auto sm:left-6 sm:max-w-md sm:p-8",
            h("p", "text-sm font-semibold text-slate-600", "Deskhaus, Leith"),
            h("h1", "mt-2 text-3xl font-semibold tracking-tight text-slate-900", "A quiet desk by the window, whenever you need one"),
            h("div", "mt-6 flex items-center justify-between gap-4",
              h("p", "text-slate-900", h("span", "text-2xl font-semibold", "£18"), h("span", "text-sm text-slate-500", " per day")),
              a("rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700", "Book a day pass")))))),
  },
  /* ---------------- event ---------------- */
  {
    name: "Conference hero with date and venue",
    f: "event",
    n: h("section", "bg-blue-700",
      h("div", "mx-auto max-w-6xl px-6 py-20 sm:py-28",
        h("div", "flex flex-wrap gap-6 text-sm font-medium text-blue-100",
          h("span", "inline-flex items-center gap-2", icon(D.cal, "h-4 w-4"), "3 to 4 March 2027"),
          h("span", "inline-flex items-center gap-2", icon(D.pin, "h-4 w-4"), "The Corn Exchange, Leeds")),
        h("h1", "mt-8 text-6xl font-bold tracking-tighter text-white sm:text-8xl", "Fieldwork 2027"),
        h("p", "mt-6 max-w-2xl text-xl text-blue-100", "Two days of talks and workshops for people who research, design and test public services."),
        h("div", "mt-10 flex flex-wrap items-center gap-4",
          a("rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-50", "Get tickets from £180"),
          a("rounded-lg px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/40 hover:bg-blue-600", "See the programme")),
        h("dl", "mt-16 grid grid-cols-2 gap-6 border-t border-blue-500 pt-8 sm:grid-cols-4",
          ...[["Talks", "28"], ["Workshops", "12"], ["Days", "2"], ["Seats", "600"]].map(([l, v]) => h("div", "", h("dt", "text-sm text-blue-200", l), h("dd", "mt-1 text-3xl font-semibold text-white", v)))))),
  },
  {
    name: "Workshop event with ticket card",
    f: "event",
    n: h("section", "bg-lime-100",
      h("div", "mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.3fr_1fr]",
        h("div", "",
          h("p", "text-sm font-bold uppercase tracking-widest text-lime-800", "Saturday workshop"),
          h("h1", "mt-4 text-5xl font-bold tracking-tight text-lime-950 sm:text-6xl", "Learn to make sourdough in one afternoon"),
          h("p", "mt-6 text-lg text-lime-900/80", "Mix, shape and bake alongside a baker, then take home your loaf, a jar of starter and the recipe card.")),
        h("div", "rounded-3xl border-2 border-dashed border-lime-700/40 bg-white p-8",
          h("p", "text-sm text-slate-500", "Sat 22 Nov, 1pm to 5pm"),
          h("p", "mt-2 text-2xl font-semibold text-slate-900", "Hearth School, Frome"),
          h("p", "mt-6 flex items-baseline gap-2", h("span", "text-4xl font-bold text-slate-900", "£65"), h("span", "text-sm text-slate-500", "ingredients included")),
          b("mt-6 w-full rounded-xl bg-lime-700 px-5 py-3 font-semibold text-white hover:bg-lime-800", "Reserve a place"),
          h("p", "mt-3 text-center text-sm text-slate-600", "4 of 10 places left")))),
  },
  {
    name: "Podcast hero with episode player",
    f: "event",
    n: h("section", "bg-violet-950",
      h("div", "mx-auto max-w-4xl px-6 py-24",
        h("p", "text-sm font-semibold text-violet-300", "Small Print, a weekly podcast"),
        h("h1", "mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl", "The stories inside the terms and conditions"),
        h("div", "mt-12 flex flex-col gap-5 rounded-2xl bg-white/10 p-5 sm:flex-row sm:items-center",
          ha("button", "grid h-14 w-14 shrink-0 place-items-center rounded-full bg-violet-400 text-violet-950 hover:bg-violet-300", { type: "button", "aria-label": "Play the episode" }, solid(D.play, "h-6 w-6")),
          h("div", "min-w-0 flex-1",
            h("p", "text-xs text-violet-300", "Episode 112, 41 min"),
            h("p", "mt-1 font-semibold text-white", "Why your gym contract is so hard to cancel"),
            h("div", "mt-3 h-1.5 rounded-full bg-white/20", h("div", "h-1.5 w-1/4 rounded-full bg-violet-400")))),
        h("p", "mt-6 text-sm text-violet-200", "New episodes every Thursday. Listen in any podcast app."))),
  },
  /* ---------------- newsletter ---------------- */
  {
    name: "Newsletter signup centered",
    f: "newsletter",
    n: h("section", "bg-white",
      h("div", "mx-auto max-w-2xl px-6 py-28 text-center",
        h("div", "mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-rose-700", icon(D.mail, "h-6 w-6")),
        h("h1", "mt-6 font-serif text-4xl text-slate-900 sm:text-5xl", "The Margin"),
        h("p", "mt-4 text-lg text-slate-600", "One email every Sunday about running a small, profitable shop. Real numbers from real owners, readable in five minutes."),
        h("div", "mx-auto mt-10 flex max-w-md flex-col gap-2 sm:flex-row",
          ha("label", "sr-only", { for: "tm-email" }, "Email address"),
          ha("input", "min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-600/30", { id: "tm-email", type: "email", placeholder: "you@shop.example", autocomplete: "email" }),
          b("rounded-lg bg-rose-700 px-5 py-3 font-semibold text-white hover:bg-rose-800", "Subscribe")),
        h("p", "mt-4 text-sm text-slate-500", "Free. Unsubscribe with one click."))),
  },
  {
    name: "Newsletter split with issue preview",
    f: "newsletter",
    n: h("section", "bg-stone-100",
      h("div", "mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2",
        h("div", "",
          h("h1", "text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl", "Field Notes for city gardeners"),
          h("p", "mt-6 text-lg text-stone-600", "What to sow, prune and harvest this fortnight, written for balconies, yards and allotments."),
          h("div", "mt-8 flex max-w-md gap-2",
            ha("label", "sr-only", { for: "fn-email" }, "Email address"),
            ha("input", "min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-5 py-3 text-stone-900 focus:border-green-700 focus:outline-none", { id: "fn-email", type: "email", placeholder: "Your email", autocomplete: "email" }),
            b("rounded-full bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900", "Join"))),
        h("article", "rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200",
          h("p", "text-xs font-semibold uppercase tracking-widest text-stone-500", "Latest issue, No. 58"),
          h("h2", "mt-3 text-2xl font-semibold text-stone-900", "Garlic goes in before the first frost"),
          h("p", "mt-4 text-stone-600", "Split the bulbs, plant the fattest cloves pointy end up, two knuckles deep. Then forget about them until June."),
          a("mt-6 inline-flex items-center gap-2 text-sm font-semibold text-green-800", "Read the full issue", icon(D.arrow, "h-4 w-4"))))),
  },
  {
    name: "Waitlist hero with progress",
    f: "newsletter",
    n: h("section", "bg-slate-950",
      h("div", "mx-auto max-w-xl px-6 py-28 text-center",
        h("p", "font-mono text-xs uppercase tracking-[0.3em] text-cyan-400", "Opening spring 2027"),
        h("h1", "mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl", "Harbourline, a sea swimming club with a sauna"),
        h("p", "mt-5 text-slate-400", "Founding members get the first year at half price. Join the list and we will email you before anyone else."),
        h("div", "mt-10 text-left",
          h("div", "flex justify-between text-sm text-slate-400", h("span", "", "Founding places taken"), h("span", "font-mono text-slate-200", "212 of 300")),
          h("div", "mt-2 h-2 rounded-full bg-slate-800", h("div", "h-2 w-[70%] rounded-full bg-cyan-400"))),
        h("div", "mt-8 flex flex-col gap-2 sm:flex-row",
          ha("label", "sr-only", { for: "hb-email" }, "Email address"),
          ha("input", "min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none", { id: "hb-email", type: "email", placeholder: "you@example.com", autocomplete: "email" }),
          b("rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300", "Join the list")))),
  },
  /* ---------------- stats and trust ---------------- */
  {
    name: "Hero with stats row",
    f: "proof",
    n: h("section", "bg-white",
      h("div", "mx-auto max-w-6xl px-6 py-20 sm:py-28",
        h("h1", "max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl", "Spot a leak in the water network before the street floods"),
        h("p", "mt-6 max-w-2xl text-lg text-slate-600", "Tidepool listens to pressure sensors across your pipes and flags the pattern of a burst hours before it surfaces."),
        a("mt-10 inline-flex rounded-lg bg-cyan-700 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-800", "Request a pilot"),
        h("dl", "mt-16 grid gap-px overflow-hidden rounded-2xl bg-slate-200 sm:grid-cols-3",
          ...[["Sensors connected", "18,400"], ["Average warning time", "6.5 hours"], ["Utilities using it", "11"]].map(([l, v]) => h("div", "bg-slate-50 p-8", h("dt", "text-sm text-slate-600", l), h("dd", "mt-2 text-4xl font-semibold tracking-tight text-slate-900", v)))))),
  },
  {
    name: "Hero with avatar trust line",
    f: "proof",
    n: h("section", "bg-teal-50",
      h("div", "mx-auto max-w-3xl px-6 py-28 text-center",
        h("h1", "text-4xl font-semibold tracking-tight text-teal-950 sm:text-6xl", "Patient notes written while you listen"),
        h("p", "mx-auto mt-6 max-w-xl text-lg text-teal-900/80", "Clinicnote turns a consultation into a structured note, ready to check and sign before the next patient sits down."),
        h("div", "mt-10 flex justify-center", a("rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800", "Start a free month")),
        h("div", "mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row",
          h("div", "flex -space-x-2", ...[["RB", "bg-rose-200 text-rose-900"], ["KO", "bg-amber-200 text-amber-900"], ["SL", "bg-sky-200 text-sky-900"], ["TM", "bg-emerald-200 text-emerald-900"]].map(([i, c]) => h("span", "grid h-10 w-10 place-items-center rounded-full text-xs font-semibold ring-2 ring-teal-50 " + c, i))),
          h("p", "text-sm text-teal-900", h("span", "font-semibold", "2,400 clinicians"), " in 300 practices write notes this way")))),
  },
  {
    name: "Nonprofit hero with donation amounts",
    f: "proof",
    n: h("section", "bg-[#fdf6ec]",
      h("div", "mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2",
        h("div", "",
          h("p", "text-sm font-semibold text-sky-800", "Clearwater Fund"),
          h("h1", "mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl", "Clean water for a village school, one well at a time"),
          h("p", "mt-6 text-lg text-slate-600", "Every well is dug by a local crew and maintained for ten years. You get a photo and the GPS point when yours is finished.")),
        h("div", "rounded-3xl bg-white p-8 shadow-lg",
          h("p", "font-semibold text-slate-900", "Choose a monthly gift"),
          h("div", "mt-5 grid grid-cols-3 gap-3", ...["£5", "£15", "£30"].map((x, i) => ha("button", i === 1 ? "rounded-xl bg-sky-700 py-4 text-lg font-semibold text-white" : "rounded-xl py-4 text-lg font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50", { type: "button", "aria-pressed": i === 1 ? "true" : "false" }, x))),
          h("p", "mt-4 text-sm text-slate-600", "£15 a month keeps a pump working for a whole term."),
          b("mt-6 w-full rounded-xl bg-amber-400 px-5 py-3.5 font-semibold text-slate-950 hover:bg-amber-300", "Give monthly")))),
  },
  /* ---------------- editorial and type ---------------- */
  {
    name: "Editorial magazine hero",
    f: "type",
    n: h("section", "bg-[#f6f3ee]",
      h("div", "mx-auto max-w-6xl px-6 py-14",
        h("div", "flex items-center justify-between border-b border-stone-900 pb-3 font-mono text-xs uppercase tracking-widest text-stone-700", h("span", "", "Quarterly"), h("span", "", "Issue 19, Winter")),
        h("div", "grid gap-10 pt-10 lg:grid-cols-[1.4fr_1fr]",
          h("div", "",
            h("p", "font-mono text-xs uppercase tracking-widest text-red-700", "Cover story"),
            h("h1", "mt-4 font-serif text-5xl leading-[1.02] text-stone-950 sm:text-7xl", "The last letterpress printers of the north"),
            h("p", "mt-6 max-w-lg font-serif text-xl leading-relaxed text-stone-700", "Eleven workshops still set metal type by hand. We spent a winter in four of them."),
            a("mt-8 inline-block border-b-2 border-red-700 pb-1 text-sm font-semibold text-stone-950", "Read the story")),
          img(PH.portrait, "Black and white portrait of a woman looking into the camera", "aspect-[3/4] w-full bg-stone-300 object-cover grayscale")))),
  },
  {
    name: "Bold typographic stacked words",
    f: "type",
    n: h("section", "bg-lime-300",
      h("div", "mx-auto max-w-6xl px-6 py-20",
        h("h1", "text-6xl font-black uppercase leading-[0.85] tracking-tighter text-neutral-950 sm:text-9xl", "Lift.", h("br", ""), "Rest.", h("br", ""), "Repeat."),
        h("div", "mt-12 flex flex-col gap-6 border-t-4 border-neutral-950 pt-6 sm:flex-row sm:items-center sm:justify-between",
          h("p", "max-w-md text-lg font-medium text-neutral-900", "Ironworks Gym. Coached strength classes at 6am, noon and 7pm, beginners welcome on every one."),
          a("inline-flex justify-center bg-neutral-950 px-8 py-4 text-base font-bold uppercase text-lime-300 hover:bg-neutral-800", "First week free")))),
  },
  {
    name: "Brutalist bordered grid hero",
    f: "type",
    n: h("section", "bg-white",
      h("div", "mx-auto max-w-6xl px-6 py-16",
        h("div", "grid border-4 border-black md:grid-cols-[2fr_1fr]",
          h("div", "border-b-4 border-black p-8 md:border-b-0 md:border-r-4 md:p-12",
            h("h1", "text-5xl font-black leading-none tracking-tight text-black sm:text-7xl", "Print shop for zines, posters and stubborn ideas"),
            h("p", "mt-6 text-lg font-medium text-black", "Risograph runs from 20 copies. Bring a file, leave with a box.")),
          h("div", "grid grid-rows-2",
            h("div", "border-b-4 border-black bg-pink-400 p-8", h("p", "font-mono text-sm font-bold uppercase text-black", "Next free slot"), h("p", "mt-2 text-3xl font-black text-black", "Thursday")),
            a("flex items-center justify-between bg-black p-8 text-2xl font-black text-white hover:bg-pink-600", "Get a quote", icon(D.arrow, "h-8 w-8")))))),
  },
  {
    name: "Serif statement with signature",
    f: "type",
    n: h("section", "bg-white",
      h("div", "mx-auto max-w-3xl px-6 py-28 sm:py-36",
        h("h1", "font-serif text-4xl leading-tight text-stone-900 sm:text-5xl", "\"We write wills, settle estates and answer the phone ourselves. That is the whole firm.\""),
        h("div", "mt-10 flex items-center gap-4",
          h("span", "grid h-12 w-12 place-items-center rounded-full bg-stone-200 font-serif text-lg text-stone-800", "AH"),
          h("div", "", h("p", "font-semibold text-stone-900", "Ada Holloway"), h("p", "text-sm text-stone-600", "Partner, Holloway and Finch solicitors"))),
        h("div", "mt-12 flex flex-wrap gap-3", a("rounded-md bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700", "Book a free 20 minute call"), a("rounded-md px-5 py-3 text-sm font-semibold text-stone-900 ring-1 ring-stone-300 hover:bg-stone-50", "Our fees")))),
  },
  /* ---------------- dark and gradient ---------------- */
  {
    name: "Dark hero with radial glow",
    f: "dark",
    n: h("section", "relative isolate overflow-hidden bg-slate-950",
      h("div", "absolute left-1/2 top-0 -z-10 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.35),transparent)]"),
      nav("Vantage", ["Platform", "Security", "Pricing"], "Request access", true),
      h("div", "mx-auto max-w-4xl px-6 pb-28 pt-16 text-center sm:pt-24",
        h("h1", "text-4xl font-semibold tracking-tight text-white sm:text-6xl", "See every login, device and permission in one place"),
        h("p", "mx-auto mt-6 max-w-xl text-lg text-slate-400", "Vantage maps who can reach what across your company tools and tells you which access nobody has used in ninety days."),
        h("div", "mt-10 flex flex-wrap justify-center gap-3",
          a("rounded-lg bg-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-300", "Run a free access scan"),
          a("rounded-lg px-6 py-3 text-sm font-semibold text-white ring-1 ring-slate-700 hover:bg-slate-900", "Read the security paper")))),
  },
  {
    name: "Warm mesh gradient hero",
    f: "dark",
    n: h("section", "bg-orange-100 bg-[radial-gradient(at_20%_20%,#fdba74_0,transparent_50%),radial-gradient(at_80%_10%,#fda4af_0,transparent_45%),radial-gradient(at_60%_90%,#fde68a_0,transparent_50%)]",
      h("div", "mx-auto max-w-4xl px-6 py-28 text-center sm:py-36",
        h("h1", "text-5xl font-semibold tracking-tight text-orange-950 sm:text-7xl", "Warm leads, not cold lists"),
        h("p", "mx-auto mt-6 max-w-xl text-lg text-orange-950/80", "Brightfield shows which visitors came back three times this week, so your team calls people who are already interested."),
        h("div", "mt-10 flex flex-wrap justify-center gap-3",
          a("rounded-full bg-orange-950 px-6 py-3 text-sm font-semibold text-orange-50 hover:bg-orange-900", "Start free"),
          a("rounded-full bg-white/70 px-6 py-3 text-sm font-semibold text-orange-950 hover:bg-white", "How it works")))),
  },
  {
    name: "Dark split with glowing card stack",
    f: "dark",
    n: h("section", "bg-[#0b1020]",
      h("div", "mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28",
        h("div", "",
          h("p", "text-sm font-semibold text-emerald-400", "Ampline energy"),
          h("h1", "mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl", "Run your home on the cheapest hours of the day"),
          h("p", "mt-6 text-lg text-slate-400", "Ampline charges your car and battery when the grid price drops, and tells you what it saved every morning."),
          a("mt-10 inline-flex rounded-lg bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300", "Check if your home fits")),
        h("div", "space-y-4",
          ...[["Overnight charge", "Car to 80% by 7am", "£1.84"], ["Battery top up", "From 2am to 4am", "£0.62"], ["Saved yesterday", "Compared with a flat rate", "£3.10"]].map(([t, s, v], i) =>
            h("div", i === 2 ? "flex items-center justify-between rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-5" : "flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5",
              h("div", "", h("p", "font-medium text-white", t), h("p", "text-sm text-slate-400", s)), h("p", "font-mono text-lg text-emerald-300", v)))))),
  },
  {
    name: "Gradient border card hero",
    f: "dark",
    n: h("section", "bg-neutral-950",
      h("div", "mx-auto max-w-5xl px-6 py-24",
        h("div", "rounded-[2rem] bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 p-px",
          h("div", "rounded-[2rem] bg-neutral-950 px-6 py-16 text-center sm:px-16",
            h("p", "text-sm font-semibold text-amber-300", "Openframe for photographers"),
            h("h1", "mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl", "Deliver galleries clients actually want to share"),
            h("p", "mx-auto mt-6 max-w-lg text-lg text-neutral-400", "Private links, full resolution downloads and print orders in one tidy page with your name on it."),
            a("mt-10 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-950 hover:bg-neutral-200", "Make your first gallery"))))),
  },
];

/* ---------- renderers: one tree, three outputs ---------- */
const VOID = new Set(["img", "input", "br", "hr", "path"]);
const camel = (k: string) => (k.startsWith("aria-") || k.startsWith("data-") ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));
const reactName = (k: string) => (k === "for" ? "htmlFor" : k === "readonly" ? "readOnly" : k === "autocomplete" ? "autoComplete" : camel(k));
const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function toReact(n: N, key: number, thumb: boolean): ReactNode {
  if (typeof n === "string") return n;
  const props: Record<string, unknown> = { key };
  if (n.c) props.className = n.c;
  for (const [k, v] of Object.entries(n.a ?? {})) {
    const name = reactName(k);
    if (name === "readOnly") props.readOnly = true;
    else if (name === "value") props.defaultValue = v;
    else if (name === "rows") props.rows = Number(v);
    else props[name] = thumb && name === "src" ? v.replace("w=1600", "w=900") : v;
  }
  if (n.t === "img") {
    // Photos: every one carries the alt text written in its tree node.
    const { key: k, ...rest } = props as { key: number; src?: string; alt?: string; className?: string };
    return <img key={k} {...rest} src={rest.src} alt={rest.alt ?? ""} decoding="async" />;
  }
  return createElement(n.t, props, ...(n.k ?? []).map((c, i) => toReact(c, i, thumb)));
}

function attrs(n: El, jsx: boolean): string {
  const out: string[] = [];
  if (n.c) out.push(`${jsx ? "className" : "class"}="${n.c}"`);
  for (const [k, v] of Object.entries(n.a ?? {})) {
    if (jsx) {
      const name = reactName(k);
      if (name === "readOnly") out.push("readOnly");
      else if (name === "value") out.push(`defaultValue="${v}"`);
      else if (name === "rows") out.push(`rows={${v}}`);
      else out.push(`${name}="${v}"`);
    } else out.push(v === "" ? k : `${k}="${escHtml(v)}"`);
  }
  return out.length ? " " + out.join(" ") : "";
}

function serialize(n: N, depth: number, jsx: boolean): string {
  const pad = "  ".repeat(depth);
  if (typeof n === "string") {
    const t = jsx ? n.replace(/[{}<>]/g, (c) => `{"${c}"}`) : escHtml(n).replace(/&quot;/g, '"');
    return pad + t;
  }
  const open = `<${n.t}${attrs(n, jsx)}`;
  const kids = n.k ?? [];
  if (VOID.has(n.t) && !kids.length) return pad + open + (jsx ? " />" : ">");
  if (kids.every((k) => typeof k === "string") && kids.join("").length < 70) {
    return `${pad}${open}>${kids.map((k) => serialize(k, 0, jsx)).join("")}</${n.t}>`;
  }
  return `${pad}${open}>\n${kids.map((k) => serialize(k, depth + 1, jsx)).join("\n")}\n${pad}</${n.t}>`;
}

const pascal = (s: string) => s.replace(/[^a-zA-Z0-9 ]/g, "").split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("") + "Hero";
const jsxFor = (hr: Hero) => `export default function ${pascal(hr.name)}() {\n  return (\n${serialize(hr.n, 2, true)}\n  );\n}\n`;
const htmlFor = (hr: Hero) => `<!-- ${hr.name}: needs Tailwind CSS (v3 or v4) -->\n${serialize(hr.n, 0, false)}\n`;

/* ---------- one gallery tile ---------- */
const DESIGN_MAX = 1280;

function Thumb({ hero, width }: { hero: Hero; width: number }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    i.setAttribute("inert", "");
    const ro = new ResizeObserver(() => setBox({ w: o.clientWidth, h: i.offsetHeight }));
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);
  const scale = box.w ? box.w / width : 0.4;
  return (
    <div ref={outer} className="relative overflow-hidden bg-stone-100" style={{ height: box.h ? Math.min(box.h, 900) * scale : 260 }} aria-hidden="true">
      <div ref={inner} className="absolute left-0 top-0 origin-top-left" style={{ width, transform: `scale(${scale})` }}>
        {toReact(hero.n, 0, true)}
      </div>
    </div>
  );
}

const FAMILY_KEYS = Object.keys(FAMILIES) as Family[];
type Panel = "preview" | "jsx" | "html" | null;

export default function TailwindHeroSectionsCollection() {
  const [family, setFamily] = useState<Family | "all">("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<{ i: number; p: Panel }>({ i: -1, p: null });
  const [copied, setCopied] = useState<string>("");
  const [announce, setAnnounce] = useState("");
  const [designW, setDesignW] = useState(DESIGN_MAX);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fit = () => setDesignW(Math.min(DESIGN_MAX, Math.max(360, window.innerWidth)));
    fit();
    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const indexed = useMemo(() => HEROES.map((hr, i) => ({ hr, i })), []);
  const q = query.trim().toLowerCase();
  const visible = indexed.filter(({ hr }) => (family === "all" || hr.f === family) && (!q || `${hr.name} ${FAMILIES[hr.f]}`.toLowerCase().includes(q)));

  async function copy(i: number, kind: "jsx" | "html") {
    const hr = HEROES[i];
    const text = kind === "jsx" ? jsxFor(hr) : htmlFor(hr);
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) setOpen({ i, p: kind });
    setCopied(ok ? `${i}-${kind}` : "");
    setAnnounce(ok ? `${hr.name} ${kind === "jsx" ? "React" : "HTML"} code copied` : "Copy was blocked, the code is shown so you can select it");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(""), 1600);
  }

  const toggle = (i: number, p: Panel) => setOpen((o) => (o.i === i && o.p === p ? { i: -1, p: null } : { i, p }));
  const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1";
  const chip = `inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors motion-reduce:transition-none ${focus}`;
  const tool = `inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors motion-reduce:transition-none ${focus}`;

  return (
    <section className="bg-[#f7f6f3] px-4 py-12 text-[#16181d] sm:px-8 sm:py-14" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">React or HTML · Tailwind classes</p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">{HEROES.length} Tailwind hero sections you can copy</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone-600">
              Open any hero at full size, then copy it as a React component or as plain HTML. Both use only stock Tailwind classes, so they paste into any project that has Tailwind set up.
            </p>
          </div>
          <dl className="flex gap-8 font-mono text-[12px] text-stone-600">
            <div>
              <dt className="uppercase tracking-[0.14em]">Heroes</dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#16181d]">{HEROES.length}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.14em]">Styles</dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#16181d]">{FAMILY_KEYS.length}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.14em]">Packages</dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#16181d]">None</dd>
            </div>
          </dl>
        </header>

        <div className="mt-8 flex flex-col gap-3 border-y border-stone-300/70 py-4 lg:flex-row lg:items-start">
          <label htmlFor="ths-search" className="sr-only">Search hero sections</label>
          <div className="relative lg:w-60 lg:shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500">
              <path d={D.search} />
            </svg>
            <input
              id="ths-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search heroes"
              className="h-10 w-full rounded-full border border-stone-300 bg-white pl-9 pr-4 text-[14px] text-stone-900 placeholder:text-stone-500 focus:border-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by style">
            {(["all", ...FAMILY_KEYS] as const).map((f) => {
              const on = family === f;
              const n = f === "all" ? HEROES.length : HEROES.filter((hr) => hr.f === f).length;
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

        <div className="mt-6 h-[1000px] overflow-y-auto overscroll-contain rounded-2xl pr-1" tabIndex={0} aria-label="Hero sections">
          {visible.length === 0 && (
            <div className="grid h-60 place-items-center rounded-2xl border border-dashed border-stone-300 text-[14px] text-stone-600">No hero matches "{query}". Try photo, dark or newsletter.</div>
          )}
          <ul className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
            {visible.map(({ hr, i }) => {
              const isOpen = open.i === i ? open.p : null;
              return (
                <li key={i} className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(22,24,29,0.04)] ${isOpen ? "md:col-span-2" : ""}`}>
                  {isOpen === "preview" ? (
                    <div id={`ths-panel-${i}`} className="max-h-[820px] overflow-auto border-b border-stone-200" onClick={(e) => (e.target as HTMLElement).closest("a") && e.preventDefault()}>
                      {toReact(hr.n, 0, false)}
                    </div>
                  ) : (
                    <Thumb hero={hr} width={designW} />
                  )}
                  <div className="flex flex-wrap items-center gap-2 border-t border-stone-200 px-3 py-2.5">
                    <span className="min-w-0 flex-1 basis-40 text-[13px] font-medium text-stone-800">
                      <span className="mr-2 font-mono text-[11px] text-stone-500">{String(i + 1).padStart(2, "0")}</span>
                      {hr.name}
                    </span>
                    <button type="button" aria-expanded={isOpen === "preview"} aria-controls={`ths-panel-${i}`} onClick={() => toggle(i, "preview")} className={`${tool} ${isOpen === "preview" ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"}`}>
                      {isOpen === "preview" ? "Close" : "Preview"}
                    </button>
                    <button type="button" aria-expanded={isOpen === "jsx" || isOpen === "html"} aria-controls={`ths-code-${i}`} aria-label={`Show code for ${hr.name}`} onClick={() => toggle(i, isOpen === "html" ? "html" : "jsx")} className={`${tool} w-9 px-0 text-stone-600 hover:bg-stone-100`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                        <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
                      </svg>
                    </button>
                    {(["jsx", "html"] as const).map((k) => (
                      <button key={k} type="button" onClick={() => copy(i, k)} aria-label={`Copy ${k === "jsx" ? "React JSX" : "HTML"} for ${hr.name}`} className={`${tool} ${copied === `${i}-${k}` ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-900 hover:bg-stone-200"}`}>
                        {copied === `${i}-${k}` ? "Copied" : k === "jsx" ? "Copy JSX" : "Copy HTML"}
                      </button>
                    ))}
                  </div>
                  {(isOpen === "jsx" || isOpen === "html") && (
                    <div id={`ths-code-${i}`} className="border-t border-stone-800 bg-[#111318]">
                      <div className="flex gap-1 px-3 pt-3" role="group" aria-label="Code format">
                        {(["jsx", "html"] as const).map((k) => (
                          <button key={k} type="button" aria-pressed={isOpen === k} onClick={() => setOpen({ i, p: k })} className={`rounded-md px-3 py-1.5 text-[12px] font-semibold ${focus} ${isOpen === k ? "bg-white text-stone-900" : "text-slate-300 hover:bg-white/10"}`}>
                            {k === "jsx" ? "React + Tailwind" : "HTML + Tailwind"}
                          </button>
                        ))}
                      </div>
                      <pre tabIndex={0} className="max-h-96 overflow-auto p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200">
                        <code>{isOpen === "jsx" ? jsxFor(hr) : htmlFor(hr)}</code>
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
