import { createElement, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

/*
  Testimonial section examples.
  Every section below is written once as plain HTML with Tailwind classes. The page shows that exact
  markup in a scaled preview, Copy HTML puts the same markup on the clipboard, and Copy JSX converts it
  to a React component (class becomes className and so on). The two interactive sections (the slider
  and the person tabs) ship a small script for HTML and a hand-written useState version for React.

  Every name, business and quote here is an invented example. Replace them with words your customers
  actually said, with their permission. There are no star ratings or review counts on purpose: do not
  add ones you cannot back up.
*/

type Person = { name: string; role: string; img: string; quote: string; short: string; pos?: string };

const P: Person[] = [
  { name: "Amara Okafor", role: "Physiotherapist, Bridgeway Physio", img: "https://images.pexels.com/photos/3534962/pexels-photo-3534962.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Patients book themselves now.", quote: "Patients used to ring between sessions to book, and I missed half of those calls. Now they pick a slot on the site the evening before and I walk in to a full, tidy calendar." },
  { name: "Helena Marsh", role: "Founder, Marsh & Vale Interiors", img: "https://images.pexels.com/photos/27086922/pexels-photo-27086922.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Our portfolio finally looks like our work.", quote: "We design calm, considered rooms, and our old site looked like a car boot sale. The new portfolio pages let the photos breathe, and clients now arrive at the first meeting already knowing which project they loved." },
  { name: "Ruth Calder", role: "Operations lead, Northline Freight", img: "https://images.pexels.com/photos/30609905/pexels-photo-30609905.jpeg?auto=compress&cs=tinysrgb&w=600", pos: "object-top", short: "The quote form does the sorting for us.", quote: "Every request now comes in with the pallet count, the pickup postcode and the date filled in. My team stopped spending mornings chasing details and started spending them moving freight." },
  { name: "Adaeze Nwosu", role: "Managing partner, Harbor Lane Law", img: "https://images.pexels.com/photos/37118090/pexels-photo-37118090.jpeg?auto=compress&cs=tinysrgb&w=600", short: "People call us already knowing what we do.", quote: "We rewrote every practice page in plain language. The calls we get now start with a real question instead of asking whether we handle tenancy cases at all." },
  { name: "Lucía Ferrer", role: "Owner, Casa Ferrer Dental", img: "https://images.pexels.com/photos/34381971/pexels-photo-34381971.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Nervous patients read the page first.", quote: "We added a page that walks through a first visit step by step, with photos of the actual room. Nervous patients tell us at the desk that reading it is the reason they booked." },
  { name: "Signe Holm", role: "Ceramicist, Holm Clay Studio", img: "https://images.pexels.com/photos/33867539/pexels-photo-33867539.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Workshop places fill without me posting.", quote: "I used to announce every workshop by hand and hope. Now the dates sit on one page with a waiting list, and I spend the time at the wheel instead of in my inbox." },
  { name: "Brooke Delaney", role: "Owner, Delaney Hair Rooms", img: "https://images.pexels.com/photos/33867516/pexels-photo-33867516.jpeg?auto=compress&cs=tinysrgb&w=600", short: "The price list ended the awkward questions.", quote: "Putting clear prices next to each service was scary, but it stopped the awkward phone calls. People book the right appointment length the first time." },
  { name: "Nia Campbell", role: "Founder, Petal & Post", img: "https://images.pexels.com/photos/7552059/pexels-photo-7552059.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Checkout went from five steps to two.", quote: "Gift buyers are in a hurry. Cutting the checkout down to a delivery date and a card message was the single best change we made all year." },
  { name: "Priya Raman", role: "Teacher, Saltwater Yoga", img: "https://images.pexels.com/photos/2530364/pexels-photo-2530364.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Beginners feel welcome before they arrive.", quote: "The class pages now say what to bring, what each class feels like and that nobody will be watching you. Beginners turn up relaxed, which changes the whole room." },
  { name: "Leyla Aliyeva", role: "Owner, Greenroom Plants", img: "https://images.pexels.com/photos/18499064/pexels-photo-18499064.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Care guides sell more than discounts.", quote: "We wrote a short care guide for every plant we stock. Customers come back to read them, and they come back to buy the next plant from the same page." },
  { name: "Elena Petrova", role: "Freelance translator", img: "https://images.pexels.com/photos/2112714/pexels-photo-2112714.jpeg?auto=compress&cs=tinysrgb&w=600", short: "I look like a studio, not a side gig.", quote: "One clean page with my languages, my specialist fields and a simple enquiry form. Agencies started treating me as a partner instead of a name on a spreadsheet." },
  { name: "Mateo Alvarez", role: "Manager, Corner Table Café", img: "https://images.pexels.com/photos/5920775/pexels-photo-5920775.jpeg?auto=compress&cs=tinysrgb&w=600", short: "The menu is right on every phone.", quote: "Our menu changes every week. Updating it takes two minutes on my phone now, so the specials people see online are the ones actually in the kitchen." },
  { name: "Dinesh Kumar", role: "Owner, Leaf & Kettle Tea", img: "https://images.pexels.com/photos/36330752/pexels-photo-36330752.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Regulars reorder in one tap.", quote: "Most of my customers buy the same three teas. A reorder button on their account page did more for us than any newsletter I have ever sent." },
  { name: "Chloe Bennett", role: "Founder, Thread Assembly", img: "https://images.pexels.com/photos/7289739/pexels-photo-7289739.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Size questions dropped right away.", quote: "We put real measurements and photos of three different people wearing each piece on the product page. The size emails nearly stopped, and so did the returns." },
  { name: "Rafi Hossain", role: "Product designer, Lumen Labs", img: "https://images.pexels.com/photos/39087408/pexels-photo-39087408.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Handoff is a link, not a meeting.", quote: "I share a working page instead of a stack of screenshots. Engineers click around, leave comments on the actual buttons, and we skip the walkthrough meeting entirely." },
  { name: "Daniel Sousa", role: "Owner, Sousa Build Co.", img: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Homeowners see the finished jobs first.", quote: "Before-and-after photos of real kitchens we fitted do the selling. People phone us having already picked the finish they want, so quotes take half the time." },
  { name: "Kwame Asante", role: "Music teacher", img: "https://images.pexels.com/photos/15929275/pexels-photo-15929275.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Parents can see when I am free.", quote: "Parents can see my open lesson times and book a trial without three rounds of messages. I teach more and text less, which is exactly the trade I wanted." },
  { name: "Farid Rahman", role: "Owner, Saffron House", img: "https://images.pexels.com/photos/14816709/pexels-photo-14816709.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Table bookings come in overnight.", quote: "We close at eleven, and by morning there are bookings for the weekend waiting. My family used to take those on the phone during the dinner rush." },
  { name: "Peter Lindqvist", role: "Principal, Lindqvist Studio", img: "https://images.pexels.com/photos/10223581/pexels-photo-10223581.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Fewer words, better clients.", quote: "We cut the site to twelve projects and one paragraph about how we work. The enquiries that arrive now are smaller in number and far better suited to us." },
  { name: "Jordan Ellis", role: "Barber, Fade Room", img: "https://images.pexels.com/photos/5496471/pexels-photo-5496471.jpeg?auto=compress&cs=tinysrgb&w=600", short: "No more no-shows on Saturdays.", quote: "Reminders go out the day before, and people can move their slot themselves. Saturday mornings are full again instead of full of gaps." },
  { name: "Omar Haddad", role: "Lead developer, Quillstack", img: "https://images.pexels.com/photos/32321525/pexels-photo-32321525.jpeg?auto=compress&cs=tinysrgb&w=600", short: "The docs answer before support does.", quote: "We rebuilt the help pages around the questions people actually send us. Support tickets got shorter, and the ones left are the interesting ones." },
  { name: "Giorgio Bianchi", role: "Tailor, Bianchi Sartoria", img: "https://images.pexels.com/photos/18225736/pexels-photo-18225736.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Customers arrive with the cloth chosen.", quote: "I put my cloth books online with honest photos in daylight. People now come to the first fitting with two or three swatches already in mind." },
  { name: "Tomás Herrera", role: "Guide, Old Town Walks", img: "https://images.pexels.com/photos/39271268/pexels-photo-39271268.jpeg?auto=compress&cs=tinysrgb&w=600", short: "Visitors find the walk before they land.", quote: "Thirty years teaching history, and now I walk it with visitors. They book from the hotel the night before, and they arrive having read the route." },
];
const WIDE = {
  coach: { name: "Mei Lin", role: "Career coach", img: "https://images.pexels.com/photos/8369774/pexels-photo-8369774.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  podcast: { name: "Andre Silva", role: "Host, The Long Table", img: "https://images.pexels.com/photos/36917956/pexels-photo-36917956.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  bakery: { name: "Hana Sato", role: "Owner, Little Oven Bakery", img: "https://images.pexels.com/photos/8902305/pexels-photo-8902305.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  cafe: { name: "Sun and Min Park", role: "Owners, Two Spoons Café", img: "https://images.pexels.com/photos/34164498/pexels-photo-34164498.jpeg?auto=compress&cs=tinysrgb&w=1200" },
};

/* ---------- small HTML helpers (all classes are written out in full so Tailwind can find them) ---------- */
const av = (p: Person, cls: string) =>
  `<img src="${p.img}" alt="Portrait of ${p.name}" width="96" height="96" loading="lazy" class="${cls} object-cover ${p.pos ?? ""}">`;
const QUOTE_SVG = (cls: string) =>
  `<svg class="${cls}" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M13 7C7.5 9 4 13.3 4 19.2 4 23 6.3 25 9 25c2.6 0 4.6-2 4.6-4.5 0-2.4-1.8-4.2-4.1-4.2-.5 0-.9.1-1.1.2.5-3 3-5.9 5.9-7.2L13 7zm15 0c-5.5 2-9 6.3-9 12.2 0 3.8 2.3 5.8 5 5.8 2.6 0 4.6-2 4.6-4.5 0-2.4-1.8-4.2-4.1-4.2-.5 0-.9.1-1.1.2.5-3 3-5.9 5.9-7.2L28 7z"/></svg>`;
const ARROW = `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const PLAY = `<svg class="h-6 w-6 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/></svg>`;
const initials = (n: string) => n.split(" ").filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join("");

type Family = "grid" | "masonry" | "single" | "slider" | "marquee" | "video" | "case" | "text";
const FAMILIES: Record<Family, string> = {
  grid: "Grids",
  masonry: "Masonry walls",
  single: "Single big quote",
  slider: "Sliders and tabs",
  marquee: "Marquees",
  video: "Video style",
  case: "Case studies",
  text: "Text only and minimal",
};
type Section = { id: string; f: Family; name: string; html: string; jsx?: string; wire?: (el: HTMLElement) => () => void };

const MARQUEE_CSS = `<style>
  @keyframes ctm-left { to { transform: translateX(-50%); } }
  @keyframes ctm-up { to { transform: translateY(-50%); } }
</style>`;

/* ---------- interactive pieces ---------- */
const SLIDES = [P[1], P[18], P[4], P[21]];
const sliderHtml = `<section class="bg-[#f3efe8] px-6 py-20 sm:py-24" aria-label="What clients say">
  <div class="mx-auto max-w-4xl" data-tslider>
    <p class="text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#8a4b2a]">Client stories</p>
    <div class="relative mt-8 min-h-[300px] sm:min-h-[260px]" role="group" aria-roledescription="carousel" aria-label="Client quotes, use the arrow keys to move" tabindex="0" data-track>
${SLIDES.map(tpl1).join("\n")}
    </div>
    <div class="mt-10 flex items-center justify-center gap-4">
      <button type="button" class="grid h-11 w-11 place-items-center rounded-full border border-stone-400 text-stone-900 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a4b2a]" aria-label="Previous quote" data-prev><svg class="h-4 w-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      <div class="flex gap-1">
${SLIDES.map(tpl2).join("\n")}
      </div>
      <button type="button" class="grid h-11 w-11 place-items-center rounded-full border border-stone-400 text-stone-900 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a4b2a]" aria-label="Next quote" data-next>${ARROW}</button>
    </div>
    <p class="sr-only" aria-live="polite" data-status>Quote 1 of ${SLIDES.length}</p>
  </div>
</section>`;
const SLIDER_SCRIPT = `
<script>
  document.querySelectorAll("[data-tslider]").forEach((root) => {
    const slides = root.querySelectorAll("[data-slide]");
    const dots = root.querySelectorAll("[data-dot]");
    let i = 0;
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("hidden", k !== i));
      dots.forEach((d, k) => {
        d.toggleAttribute("aria-current", k === i);
        d.firstElementChild.className = "h-2 w-2 rounded-full " + (k === i ? "bg-stone-900" : "bg-stone-400");
      });
      root.querySelector("[data-status]").textContent = "Quote " + (i + 1) + " of " + slides.length;
    };
    root.querySelector("[data-prev]").onclick = () => show(i - 1);
    root.querySelector("[data-next]").onclick = () => show(i + 1);
    dots.forEach((d, k) => (d.onclick = () => show(k)));
    root.querySelector("[data-track]").addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(i - 1);
      if (e.key === "ArrowRight") show(i + 1);
    });
  });
</script>`;
function wireSlider(root: HTMLElement) {
  const slides = Array.from(root.querySelectorAll<HTMLElement>("[data-slide]"));
  const dots = Array.from(root.querySelectorAll<HTMLElement>("[data-dot]"));
  let i = 0;
  const show = (n: number) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("hidden", k !== i));
    dots.forEach((d, k) => {
      d.toggleAttribute("aria-current", k === i);
      (d.firstElementChild as HTMLElement).className = "h-2 w-2 rounded-full " + (k === i ? "bg-stone-900" : "bg-stone-400");
    });
    const st = root.querySelector("[data-status]");
    if (st) st.textContent = `Quote ${i + 1} of ${slides.length}`;
  };
  const prev = () => show(i - 1);
  const next = () => show(i + 1);
  const key = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };
  const p = root.querySelector("[data-prev]");
  const nx = root.querySelector("[data-next]");
  const tr = root.querySelector("[data-track]") as HTMLElement | null;
  const dotFns = dots.map((_, k) => () => show(k));
  p?.addEventListener("click", prev);
  nx?.addEventListener("click", next);
  tr?.addEventListener("keydown", key);
  dots.forEach((d, k) => d.addEventListener("click", dotFns[k]));
  return () => {
    p?.removeEventListener("click", prev);
    nx?.removeEventListener("click", next);
    tr?.removeEventListener("keydown", key);
    dots.forEach((d, k) => d.removeEventListener("click", dotFns[k]));
  };
}
const sliderJsx = `import { useState } from "react";

// Example names and quotes. Replace them with real customer words, used with permission.
const quotes = [
${SLIDES.map(tpl3).join("\n")}
];

export default function TestimonialSlider() {
  const [i, setI] = useState(0);
  const go = (n: number) => setI((n + quotes.length) % quotes.length);
  const q = quotes[i];
  return (
    <section className="bg-[#f3efe8] px-6 py-20 sm:py-24" aria-label="What clients say">
      <div className="mx-auto max-w-4xl">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#8a4b2a]">Client stories</p>
        <div
          className="relative mt-8 min-h-[300px] sm:min-h-[260px]"
          role="group"
          aria-roledescription="carousel"
          aria-label="Client quotes, use the arrow keys to move"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") go(i - 1);
            if (e.key === "ArrowRight") go(i + 1);
          }}
        >
          <figure key={i} className="text-center" role="group" aria-roledescription="slide" aria-label={\`\${i + 1} of \${quotes.length}\`}>
            <blockquote className="font-serif text-2xl leading-snug text-stone-900 sm:text-[34px] sm:leading-[1.25]">
              <p>“{q.quote}”</p>
            </blockquote>
            <figcaption className="mt-8 flex items-center justify-center gap-3">
              <img src={q.img} alt={\`Portrait of \${q.name}\`} width={96} height={96} className="h-12 w-12 rounded-full object-cover" />
              <span className="text-left">
                <span className="block font-semibold text-stone-900">{q.name}</span>
                <span className="block text-sm text-stone-600">{q.role}</span>
              </span>
            </figcaption>
          </figure>
        </div>
        <div className="mt-10 flex items-center justify-center gap-4">
          <button type="button" onClick={() => go(i - 1)} aria-label="Previous quote" className="grid h-11 w-11 place-items-center rounded-full border border-stone-400 text-stone-900 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a4b2a]">
            <svg className="h-4 w-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
          <div className="flex gap-1">
            {quotes.map((x, k) => (
              <button key={x.name} type="button" onClick={() => go(k)} aria-label={\`Show quote \${k + 1}, \${x.name}\`} aria-current={k === i ? "true" : undefined} className="grid h-10 w-6 place-items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a4b2a]">
                <span className={\`h-2 w-2 rounded-full \${k === i ? "bg-stone-900" : "bg-stone-400"}\`} />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => go(i + 1)} aria-label="Next quote" className="grid h-11 w-11 place-items-center rounded-full border border-stone-400 text-stone-900 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a4b2a]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
        <p className="sr-only" aria-live="polite">Quote {i + 1} of {quotes.length}</p>
      </div>
    </section>
  );
}
`;

const TABS = [P[14], P[20], P[2], P[10]];
const tabsHtml = `<section class="bg-slate-950 px-6 py-20 text-white sm:py-24">
  <div class="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center" data-ttabs>
    <div>
      <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Teams that ship with us</h2>
      <p class="mt-4 max-w-md text-slate-300">Pick a person to read what changed for their team. Arrow keys move between them.</p>
      <div class="mt-8 flex flex-wrap gap-3" role="tablist" aria-label="Choose a customer">
${TABS.map(tpl4).join("\n")}
      </div>
    </div>
${TABS.map(tpl5).join("\n")}
  </div>
</section>`;
const TABS_SCRIPT = `
<script>
  document.querySelectorAll("[data-ttabs]").forEach((root) => {
    const tabs = [...root.querySelectorAll("[data-tab]")];
    const panels = root.querySelectorAll("[data-panel]");
    const pick = (n, focus) => {
      tabs.forEach((t, k) => {
        t.setAttribute("aria-selected", k === n);
        t.tabIndex = k === n ? 0 : -1;
        panels[k].hidden = k !== n;
      });
      if (focus) tabs[n].focus();
    };
    tabs.forEach((t, k) => {
      t.onclick = () => pick(k);
      t.onkeydown = (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); pick((k + 1) % tabs.length, true); }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); pick((k - 1 + tabs.length) % tabs.length, true); }
      };
    });
  });
</script>`;
function wireTabs(root: HTMLElement) {
  const tabs = Array.from(root.querySelectorAll<HTMLElement>("[data-tab]"));
  const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-panel]"));
  const pick = (n: number, focus?: boolean) => {
    tabs.forEach((t, k) => {
      t.setAttribute("aria-selected", String(k === n));
      t.tabIndex = k === n ? 0 : -1;
      panels[k].hidden = k !== n;
    });
    if (focus) tabs[n].focus();
  };
  const offs = tabs.map((t, k) => {
    const click = () => pick(k);
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); pick((k + 1) % tabs.length, true); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); pick((k - 1 + tabs.length) % tabs.length, true); }
    };
    t.addEventListener("click", click);
    t.addEventListener("keydown", key);
    return () => {
      t.removeEventListener("click", click);
      t.removeEventListener("keydown", key);
    };
  });
  return () => offs.forEach((f) => f());
}
const tabsJsx = `import { useRef, useState } from "react";

// Example names and quotes. Replace them with real customer words, used with permission.
const people = [
${TABS.map(tpl6).join("\n")}
];

export default function TestimonialTabs() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (n: number) => {
    const k = (n + people.length) % people.length;
    setActive(k);
    tabs.current[k]?.focus();
  };
  const p = people[active];
  return (
    <section className="bg-slate-950 px-6 py-20 text-white sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Teams that ship with us</h2>
          <p className="mt-4 max-w-md text-slate-300">Pick a person to read what changed for their team. Arrow keys move between them.</p>
          <div className="mt-8 flex flex-wrap gap-3" role="tablist" aria-label="Choose a customer">
            {people.map((x, k) => (
              <button
                key={x.name}
                ref={(el) => { tabs.current[k] = el; }}
                type="button"
                role="tab"
                aria-selected={k === active}
                tabIndex={k === active ? 0 : -1}
                onClick={() => setActive(k)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(k + 1); }
                  if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(k - 1); }
                }}
                className="flex items-center gap-3 rounded-full border border-slate-700 py-1.5 pl-1.5 pr-4 text-left text-sm text-slate-300 hover:border-slate-500 aria-selected:border-sky-400 aria-selected:bg-sky-400/10 aria-selected:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <img src={x.img} alt={\`Portrait of \${x.name}\`} width={96} height={96} className="h-9 w-9 rounded-full object-cover" />
                {x.name}
              </button>
            ))}
          </div>
        </div>
        <figure role="tabpanel" aria-label={p.name} className="rounded-3xl border border-slate-800 bg-slate-900 p-8 sm:p-10">
          <svg className="h-8 w-8 text-sky-400" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M13 7C7.5 9 4 13.3 4 19.2 4 23 6.3 25 9 25c2.6 0 4.6-2 4.6-4.5 0-2.4-1.8-4.2-4.1-4.2-.5 0-.9.1-1.1.2.5-3 3-5.9 5.9-7.2L13 7zm15 0c-5.5 2-9 6.3-9 12.2 0 3.8 2.3 5.8 5 5.8 2.6 0 4.6-2 4.6-4.5 0-2.4-1.8-4.2-4.1-4.2-.5 0-.9.1-1.1.2.5-3 3-5.9 5.9-7.2L28 7z" /></svg>
          <blockquote className="mt-6 text-xl leading-relaxed text-slate-100 sm:text-2xl"><p>{p.quote}</p></blockquote>
          <figcaption className="mt-8 border-t border-slate-800 pt-6">
            <span className="block font-semibold">{p.name}</span>
            <span className="block text-sm text-slate-400">{p.role}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
`;

/* ---------- the sections ---------- */
const card3 = (p: Person) => `    <figure class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <blockquote class="text-[15px] leading-relaxed text-slate-700"><p>“${p.quote}”</p></blockquote>
      <figcaption class="mt-6 flex items-center gap-3">
        ${av(p, "h-11 w-11 rounded-full")}
        <div><div class="font-semibold text-slate-900">${p.name}</div><div class="text-sm text-slate-600">${p.role}</div></div>
      </figcaption>
    </figure>`;

const masonryCard = (p: Person, accent: string) => `    <figure class="mb-5 break-inside-avoid rounded-2xl bg-white p-6 ring-1 ring-stone-200">
      <blockquote class="text-[15px] leading-relaxed text-stone-700"><p><strong class="font-semibold ${accent}">${p.short}</strong> ${p.quote}</p></blockquote>
      <figcaption class="mt-5 flex items-center gap-3">${av(p, "h-10 w-10 rounded-full")}<div class="text-sm"><div class="font-semibold text-stone-900">${p.name}</div><div class="text-stone-600">${p.role}</div></div></figcaption>
    </figure>`;

const marqueeCard = (p: Person) => `<figure class="w-[340px] shrink-0 rounded-2xl border border-emerald-900/10 bg-white p-6">
          <blockquote class="text-[15px] leading-relaxed text-stone-700"><p>${p.quote}</p></blockquote>
          <figcaption class="mt-5 flex items-center gap-3">${av(p, "h-9 w-9 rounded-full")}<div class="text-sm"><div class="font-semibold text-stone-900">${p.name}</div><div class="text-stone-600">${p.role}</div></div></figcaption>
        </figure>`;
const marqueeRow = (list: Person[], anim: string) => `    <div class="flex w-max gap-5 ${anim} hover:[animation-play-state:paused] motion-reduce:animate-none">
      <div class="flex gap-5">
        ${list.map(marqueeCard).join("\n        ")}
      </div>
      <div class="flex gap-5" aria-hidden="true">
        ${list.map(marqueeCard).join("\n        ")}
      </div>
    </div>`;

const vCol = (list: Person[], anim: string, extra: string) => {
  const c = (p: Person) => `<figure class="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10"><blockquote class="text-sm leading-relaxed text-zinc-300"><p>${p.quote}</p></blockquote><figcaption class="mt-4 flex items-center gap-2.5">${av(p, "h-8 w-8 rounded-full")}<span class="text-sm font-medium text-white">${p.name}</span></figcaption></figure>`;
  return `      <div class="${extra} flex flex-col gap-4 ${anim} motion-reduce:animate-none">
        ${list.map(c).join("\n        ")}
        <div class="flex flex-col gap-4" aria-hidden="true">
          ${list.map(c).join("\n          ")}
        </div>
      </div>`;
};

const SECTIONS: Section[] = [
  /* grids */
  {
    id: "three-column-cards",
    f: "grid",
    name: "Three column cards",
    html: `<section class="bg-slate-50 px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-6xl">
    <div class="max-w-2xl">
      <h2 class="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Small studios, fewer phone calls</h2>
      <p class="mt-4 text-lg text-slate-600">Three owners on what changed once booking moved online.</p>
    </div>
    <div class="mt-12 grid gap-6 md:grid-cols-3">
${[P[0], P[6], P[19]].map(card3).join("\n")}
    </div>
  </div>
</section>`,
  },
  {
    id: "photo-top-cards",
    f: "grid",
    name: "Two cards with large photos",
    html: `<section class="bg-white px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-5xl">
    <h2 class="text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">Made by people who make things</h2>
    <div class="mt-12 grid gap-8 md:grid-cols-2">
${[P[5], P[21]].map(tpl7).join("\n")}
    </div>
  </div>
</section>`,
  },
  {
    id: "bento-featured",
    f: "grid",
    name: "Bento grid with a featured quote",
    html: `<section class="bg-[#f6f5f1] px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-6xl">
    <h2 class="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">What our customers tell us</h2>
    <div class="mt-12 grid gap-5 md:grid-cols-4 md:grid-rows-2">
      <figure class="flex flex-col justify-between rounded-3xl bg-indigo-700 p-8 text-white md:col-span-2 md:row-span-2 sm:p-10">
        <blockquote class="text-2xl font-medium leading-snug sm:text-3xl"><p>“${P[13].quote}”</p></blockquote>
        <figcaption class="mt-10 flex items-center gap-4">${av(P[13], "h-14 w-14 rounded-full ring-2 ring-white/40")}<div><div class="font-semibold">${P[13].name}</div><div class="text-sm text-indigo-100">${P[13].role}</div></div></figcaption>
      </figure>
${[P[7], P[9], P[12], P[11]].map(tpl8).join("\n")}
    </div>
  </div>
</section>`,
  },
  {
    id: "dark-grid",
    f: "grid",
    name: "Dark grid with hairlines",
    html: `<section class="bg-zinc-950 px-6 py-20 text-white sm:py-24">
  <div class="mx-auto max-w-6xl">
    <p class="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">From the people using it</p>
    <h2 class="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Less admin, more of the actual work</h2>
    <div class="mt-12 grid gap-px overflow-hidden rounded-2xl bg-zinc-800 sm:grid-cols-2 lg:grid-cols-3">
${[P[14], P[20], P[2], P[16], P[10], P[3]].map(tpl9).join("\n")}
    </div>
  </div>
</section>`,
  },
  {
    id: "industry-label-grid",
    f: "grid",
    name: "Cards labelled by trade",
    html: `<section class="bg-white px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-6xl">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <h2 class="max-w-xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Trusted by local trades and shops</h2>
      <a href="#" class="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded">Read more stories ${ARROW}</a>
    </div>
    <div class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
${[["Building", P[15]], ["Hospitality", P[17]], ["Retail", P[12]], ["Tailoring", P[21]]].map(tpl101).join("\n")}
    </div>
  </div>
</section>`,
  },
  /* masonry */
  {
    id: "masonry-wall",
    f: "masonry",
    name: "Masonry wall",
    html: `<section class="bg-stone-100 px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-6xl">
    <h2 class="text-center text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">The wall of kind words</h2>
    <p class="mx-auto mt-4 max-w-xl text-center text-stone-600">Short and long, from shop owners, teachers and studios.</p>
    <div class="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3">
${[P[0], P[8], P[15], P[4], P[11], P[19], P[9], P[16], P[22]].map((p) => masonryCard(p, "text-rose-700")).join("\n")}
    </div>
  </div>
</section>`,
  },
  {
    id: "masonry-dark-accent",
    f: "masonry",
    name: "Dark masonry with colour bars",
    html: `<section class="bg-[#0d1117] px-6 py-20 text-white sm:py-24">
  <div class="mx-auto max-w-6xl">
    <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Notes from the people who build with it</h2>
    <div class="mt-12 columns-1 gap-5 md:columns-2 lg:columns-3">
${[[P[14], "border-sky-400"], [P[20], "border-amber-400"], [P[3], "border-emerald-400"], [P[10], "border-rose-400"], [P[2], "border-violet-400"], [P[18], "border-sky-400"]].map(tpl102).join("\n")}
    </div>
  </div>
</section>`,
  },
  {
    id: "masonry-fade-more",
    f: "masonry",
    name: "Masonry that fades into a button",
    html: `<section class="bg-white px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-6xl">
    <h2 class="text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">Hundreds of small businesses, one honest page</h2>
    <div class="relative mt-12 max-h-[620px] overflow-hidden">
      <div class="columns-1 gap-5 sm:columns-2 lg:columns-3">
${[P[7], P[13], P[1], P[17], P[6], P[12], P[5], P[21], P[0]].map((p) => masonryCard(p, "text-violet-700")).join("\n")}
      </div>
      <div class="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white to-transparent"></div>
    </div>
    <div class="mt-4 text-center">
      <a href="#" class="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">Read all stories ${ARROW}</a>
    </div>
  </div>
</section>`,
  },
  /* single */
  {
    id: "centered-serif-quote",
    f: "single",
    name: "Centered serif quote",
    html: `<section class="bg-white px-6 py-24 sm:py-32">
  <figure class="mx-auto max-w-3xl text-center">
    ${QUOTE_SVG("mx-auto h-10 w-10 text-amber-500")}
    <blockquote class="mt-8 font-serif text-3xl leading-tight text-stone-900 sm:text-[42px] sm:leading-[1.15]"><p>${P[18].quote}</p></blockquote>
    <figcaption class="mt-10">
      ${av(P[18], "mx-auto h-16 w-16 rounded-full")}
      <div class="mt-4 font-semibold text-stone-900">${P[18].name}</div>
      <div class="text-sm text-stone-600">${P[18].role}</div>
    </figcaption>
  </figure>
</section>`,
  },
  {
    id: "split-photo-quote",
    f: "single",
    name: "Split photo and quote",
    html: `<section class="bg-emerald-950 text-white">
  <div class="mx-auto grid max-w-7xl md:grid-cols-2">
    <img src="${P[9].img}" alt="Portrait of ${P[9].name}" width="800" height="900" loading="lazy" class="h-80 w-full object-cover md:h-full">
    <figure class="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16 lg:py-24">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Customer story</p>
      <blockquote class="mt-6 text-2xl leading-snug sm:text-3xl"><p>“${P[9].quote}”</p></blockquote>
      <figcaption class="mt-10"><div class="font-semibold">${P[9].name}</div><div class="text-sm text-emerald-200">${P[9].role}</div></figcaption>
    </figure>
  </div>
</section>`,
  },
  {
    id: "oversized-quote-mark",
    f: "single",
    name: "Oversized quote mark on colour",
    html: `<section class="relative overflow-hidden bg-amber-300 px-6 py-24 sm:py-28">
  <svg class="pointer-events-none absolute -left-6 -top-10 h-72 w-72 text-amber-400" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M13 7C7.5 9 4 13.3 4 19.2 4 23 6.3 25 9 25c2.6 0 4.6-2 4.6-4.5 0-2.4-1.8-4.2-4.1-4.2-.5 0-.9.1-1.1.2.5-3 3-5.9 5.9-7.2L13 7zm15 0c-5.5 2-9 6.3-9 12.2 0 3.8 2.3 5.8 5 5.8 2.6 0 4.6-2 4.6-4.5 0-2.4-1.8-4.2-4.1-4.2-.5 0-.9.1-1.1.2.5-3 3-5.9 5.9-7.2L28 7z"/></svg>
  <figure class="relative mx-auto max-w-4xl">
    <blockquote class="text-3xl font-semibold leading-tight tracking-tight text-amber-950 sm:text-5xl"><p>${P[17].short} ${P[17].quote.split(". ")[0]}.</p></blockquote>
    <figcaption class="mt-10 flex items-center gap-4">${av(P[17], "h-14 w-14 rounded-full ring-4 ring-amber-200")}<div><div class="font-semibold text-amber-950">${P[17].name}</div><div class="text-sm text-amber-900">${P[17].role}</div></div></figcaption>
  </figure>
</section>`,
  },
  {
    id: "pull-quote-rule",
    f: "single",
    name: "Pull quote with a side rule",
    html: `<section class="bg-[#fbfaf7] px-6 py-20">
  <figure class="mx-auto flex max-w-3xl flex-col gap-8 sm:flex-row sm:items-start">
    ${av(P[1], "h-24 w-24 shrink-0 rounded-2xl")}
    <div class="border-l-2 border-rose-600 pl-6">
      <blockquote class="text-xl leading-relaxed text-stone-800 sm:text-2xl"><p>${P[1].quote}</p></blockquote>
      <figcaption class="mt-6 text-sm"><span class="font-semibold text-stone-900">${P[1].name}</span><span class="text-stone-600">, ${P[1].role}</span></figcaption>
    </div>
  </figure>
</section>`,
  },
  {
    id: "full-bleed-photo",
    f: "single",
    name: "Quote over a full bleed photo",
    html: `<section class="relative isolate overflow-hidden px-6 py-28 sm:py-36">
  <img src="${WIDE.cafe.img}" alt="${WIDE.cafe.name} behind the counter of their café" width="1600" height="900" loading="lazy" class="absolute inset-0 -z-10 h-full w-full object-cover">
  <div class="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/60 to-black/20"></div>
  <figure class="mx-auto max-w-6xl">
    <blockquote class="max-w-2xl text-3xl font-medium leading-tight text-white sm:text-4xl"><p>“We opened on a Monday with no sign outside. By Friday people were walking in holding the map from our site.”</p></blockquote>
    <figcaption class="mt-8 text-white"><div class="font-semibold">${WIDE.cafe.name}</div><div class="text-sm text-white/80">${WIDE.cafe.role}</div></figcaption>
  </figure>
</section>`,
  },
  /* sliders and tabs */
  { id: "keyboard-slider", f: "slider", name: "Slider with arrows, dots and keys", html: sliderHtml + SLIDER_SCRIPT, jsx: sliderJsx, wire: wireSlider },
  { id: "person-tabs", f: "slider", name: "Pick a person tabs", html: tabsHtml + TABS_SCRIPT, jsx: tabsJsx, wire: wireTabs },
  {
    id: "snap-row",
    f: "slider",
    name: "Swipe row with scroll snap",
    html: `<section class="bg-sky-50 py-20 sm:py-24">
  <div class="mx-auto max-w-6xl px-6">
    <h2 class="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Swipe through a few stories</h2>
    <p class="mt-3 text-slate-600">Scroll sideways, swipe, or focus the row and use the arrow keys.</p>
  </div>
  <div class="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-6 px-6 pb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600 lg:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]" tabindex="0" role="region" aria-label="Customer stories, scrolls sideways">
${[P[8], P[16], P[4], P[12], P[22], P[6]].map(tpl10).join("\n")}
  </div>
</section>`,
  },
  /* marquees */
  {
    id: "two-row-marquee",
    f: "marquee",
    name: "Two rows moving in opposite directions",
    html: `${MARQUEE_CSS}
<section class="overflow-hidden bg-emerald-50 py-20 sm:py-24">
  <h2 class="px-6 text-center text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">Owners in their own words</h2>
  <p class="mt-3 px-6 text-center text-emerald-900">Hover to pause. Motion stops if your device asks for less of it.</p>
  <div class="mt-12 flex flex-col gap-5 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
${marqueeRow([P[0], P[5], P[11], P[15], P[9]], "animate-[ctm-left_60s_linear_infinite]")}
${marqueeRow([P[7], P[17], P[19], P[13], P[22]], "animate-[ctm-left_70s_linear_infinite_reverse]")}
  </div>
</section>`,
  },
  {
    id: "pill-ticker",
    f: "marquee",
    name: "Short quote ticker",
    html: `${MARQUEE_CSS}
<section class="overflow-hidden bg-[#111] py-14">
  <h2 class="sr-only">Short things customers say</h2>
  <div class="flex w-max animate-[ctm-left_45s_linear_infinite] gap-4 hover:[animation-play-state:paused] motion-reduce:animate-none">
${[0, 1].map(tpl12).join("\n")}
  </div>
</section>`,
  },
  {
    id: "vertical-columns-marquee",
    f: "marquee",
    name: "Columns scrolling upward",
    html: `${MARQUEE_CSS}
<section class="bg-zinc-950 px-6 py-20 text-white sm:py-24">
  <div class="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.6fr] lg:items-center">
    <div>
      <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">People keep telling us this</h2>
      <p class="mt-4 max-w-sm text-zinc-400">A slow, quiet column of real-sounding feedback beside your pitch. Replace each quote with one your customers sent you.</p>
      <a href="#" class="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950">Start your own ${ARROW}</a>
    </div>
    <div class="grid h-[560px] grid-cols-1 gap-4 overflow-hidden [mask-image:linear-gradient(transparent,#000_12%,#000_88%,transparent)] sm:grid-cols-3">
${vCol([P[14], P[2], P[10]], "animate-[ctm-up_40s_linear_infinite]", "")}
${vCol([P[20], P[3], P[18]], "animate-[ctm-up_52s_linear_infinite]", "hidden sm:flex")}
${vCol([P[1], P[16], P[21]], "animate-[ctm-up_46s_linear_infinite]", "hidden sm:flex")}
    </div>
  </div>
</section>`,
  },
  /* video style */
  {
    id: "video-poster-transcript",
    f: "video",
    name: "Video poster with transcript",
    html: `<section class="bg-white px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-5xl">
    <h2 class="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Hear it from Mei</h2>
    <div class="relative mt-10 overflow-hidden rounded-3xl bg-slate-900">
      <img src="${WIDE.coach.img}" alt="${WIDE.coach.name} recording a video message at her desk" width="1600" height="900" loading="lazy" class="aspect-video w-full object-cover opacity-80">
      <a href="#" class="absolute inset-0 grid place-items-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white" aria-label="Play ${WIDE.coach.name}'s video, 1 minute 40 seconds">
        <span class="grid h-20 w-20 place-items-center rounded-full bg-white text-slate-900 shadow-xl transition-transform hover:scale-105 motion-reduce:transition-none">${PLAY}</span>
      </a>
      <div class="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
        <div><div class="font-semibold">${WIDE.coach.name}</div><div class="text-sm text-white/80">${WIDE.coach.role}</div></div>
        <span class="rounded-full bg-black/50 px-3 py-1 text-xs font-medium">1:40</span>
      </div>
    </div>
    <details class="group mt-4 rounded-2xl border border-slate-200 p-5">
      <summary class="cursor-pointer list-none text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded">Read the transcript <span class="text-slate-500 group-open:hidden">+</span><span class="hidden text-slate-500 group-open:inline">−</span></summary>
      <p class="mt-3 leading-relaxed text-slate-700">“My clients find me through one page now. It says who I help, what a first session looks like and when I am free. People book a call already knowing whether I am the right coach for them, so the first ten minutes are about their goals instead of my prices.”</p>
    </details>
  </div>
</section>`,
  },
  {
    id: "story-reels",
    f: "video",
    name: "Three vertical story posters",
    html: `<section class="bg-rose-50 px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-5xl">
    <h2 class="text-center text-3xl font-semibold tracking-tight text-rose-950 sm:text-4xl">Thirty second stories</h2>
    <ul class="mt-12 grid gap-6 sm:grid-cols-3">
${[[P[6], "0:28"], [P[11], "0:34"], [P[7], "0:31"]].map(tpl103).join("\n")}
    </ul>
  </div>
</section>`,
  },
  {
    id: "poster-beside-quote",
    f: "video",
    name: "Poster beside a written quote",
    html: `<section class="bg-[#14110f] px-6 py-20 text-white sm:py-24">
  <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
    <div class="relative overflow-hidden rounded-2xl">
      <img src="${WIDE.podcast.img}" alt="${WIDE.podcast.name} speaking into a microphone in his studio" width="1600" height="900" loading="lazy" class="aspect-video w-full object-cover">
      <a href="#" class="absolute inset-0 grid place-items-center bg-black/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-orange-400" aria-label="Play ${WIDE.podcast.name}'s video, 2 minutes 5 seconds">
        <span class="grid h-16 w-16 place-items-center rounded-full bg-orange-500 text-white">${PLAY}</span>
      </a>
    </div>
    <figure>
      <blockquote class="text-2xl leading-snug sm:text-3xl"><p>“Every episode gets its own page with notes and links the same day it goes out. Listeners stopped emailing to ask where to find the book we mentioned.”</p></blockquote>
      <figcaption class="mt-8"><div class="font-semibold">${WIDE.podcast.name}</div><div class="text-sm text-orange-200">${WIDE.podcast.role}</div></figcaption>
    </figure>
  </div>
</section>`,
  },
  /* case studies */
  {
    id: "before-after-cards",
    f: "case",
    name: "Before and after case cards",
    html: `<section class="bg-slate-50 px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-6xl">
    <h2 class="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">What changed, in their words</h2>
    <div class="mt-12 grid gap-6 lg:grid-cols-3">
${[[P[2], "Quotes arrived missing half the details.", "Every request lands complete and ready to price."], [P[0], "Bookings by phone, between patients.", "Patients choose a slot online the night before."], [P[13], "A steady stream of size questions and returns.", "Measurements and fit photos answer them first."]].map(tpl104).join("\n")}
    </div>
  </div>
</section>`,
  },
  {
    id: "long-case-feature",
    f: "case",
    name: "Feature case study",
    html: `<section class="bg-white px-6 py-20 sm:py-24">
  <article class="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
    <img src="${WIDE.bakery.img}" alt="${WIDE.bakery.name} packing cupcakes in her bakery" width="1200" height="900" loading="lazy" class="aspect-[4/3] w-full rounded-3xl object-cover">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.18em] text-orange-700">Case study · Little Oven Bakery</p>
      <h2 class="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Pre-orders instead of a sold out sign</h2>
      <dl class="mt-8 grid gap-6 sm:grid-cols-2">
        <div><dt class="text-sm font-semibold text-stone-900">The problem</dt><dd class="mt-2 text-stone-600">Weekend cakes sold out by ten, and people who came later left empty handed and a little annoyed.</dd></div>
        <div><dt class="text-sm font-semibold text-stone-900">What changed</dt><dd class="mt-2 text-stone-600">A pre-order page with a Thursday cut off, so the kitchen bakes to real numbers instead of guesses.</dd></div>
      </dl>
      <figure class="mt-8 rounded-2xl bg-orange-50 p-6">
        <blockquote class="text-lg leading-relaxed text-stone-800"><p>“I know on Thursday night exactly what Saturday looks like. We waste less, and nobody leaves disappointed.”</p></blockquote>
        <figcaption class="mt-4 text-sm"><span class="font-semibold text-stone-900">${WIDE.bakery.name}</span><span class="text-stone-600">, ${WIDE.bakery.role}</span></figcaption>
      </figure>
    </div>
  </article>
</section>`,
  },
  {
    id: "case-list-rows",
    f: "case",
    name: "Case study list rows",
    html: `<section class="bg-[#f4f4f0] px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-5xl">
    <h2 class="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">Customer stories</h2>
    <ul class="mt-10 divide-y divide-neutral-300 border-y border-neutral-300">
${[P[3], P[18], P[15], P[5]].map(tpl13).join("\n")}
    </ul>
  </div>
</section>`,
  },
  /* text only and minimal */
  {
    id: "editorial-list",
    f: "text",
    name: "Editorial list, no photos",
    html: `<section class="bg-[#fffdf8] px-6 py-20 sm:py-24">
  <div class="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_2fr]">
    <h2 class="font-serif text-4xl leading-tight text-stone-900 sm:text-5xl">Said by people we work for</h2>
    <div class="divide-y divide-stone-200">
${[P[19], P[4], P[11]].map(tpl14).join("\n")}
    </div>
  </div>
</section>`,
  },
  {
    id: "initials-avatars",
    f: "text",
    name: "Cards with initials instead of photos",
    html: `<section class="bg-white px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-6xl">
    <h2 class="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">No photo? Initials work fine</h2>
    <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
${[[P[10], "bg-violet-100 text-violet-800"], [P[16], "bg-amber-100 text-amber-900"], [P[20], "bg-teal-100 text-teal-800"]].map(tpl105).join("\n")}
    </div>
  </div>
</section>`,
  },
  {
    id: "handwritten-notes",
    f: "text",
    name: "Pinned paper notes",
    html: `<section class="bg-[#e9e4da] px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-6xl">
    <h2 class="text-center text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Thank you notes on our wall</h2>
    <div class="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
${[[P[8], "bg-yellow-100 -rotate-2"], [P[22], "bg-sky-100 rotate-1"], [P[5], "bg-rose-100 -rotate-1"], [P[17], "bg-lime-100 rotate-2"]].map(tpl106).join("\n")}
    </div>
  </div>
</section>`,
  },
  {
    id: "chat-bubbles",
    f: "text",
    name: "Message bubbles",
    html: `<section class="bg-indigo-50 px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-3xl">
    <h2 class="text-center text-3xl font-semibold tracking-tight text-indigo-950 sm:text-4xl">Messages we keep</h2>
    <ul class="mt-12 space-y-6">
${[P[12], P[7], P[16], P[0]].map(tpl15).join("\n")}
    </ul>
  </div>
</section>`,
  },
  {
    id: "journey-timeline",
    f: "text",
    name: "One customer over time",
    html: `<section class="bg-white px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-3xl">
    <div class="flex items-center gap-4">${av(P[15], "h-14 w-14 rounded-full")}<div><h2 class="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">A year with ${P[15].name.split(" ")[0]}</h2><p class="text-sm text-slate-600">${P[15].role}</p></div></div>
    <ol class="mt-10 space-y-10 border-l-2 border-slate-200 pl-8">
      <li class="relative"><span class="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-2 border-white bg-slate-400 ring-2 ring-slate-200" aria-hidden="true"></span><p class="text-sm font-semibold uppercase tracking-wider text-slate-500">First week</p><blockquote class="mt-2 text-lg leading-relaxed text-slate-800"><p>“I mostly wanted somewhere to send people instead of my phone number.”</p></blockquote></li>
      <li class="relative"><span class="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-2 border-white bg-slate-500 ring-2 ring-slate-200" aria-hidden="true"></span><p class="text-sm font-semibold uppercase tracking-wider text-slate-500">Three months in</p><blockquote class="mt-2 text-lg leading-relaxed text-slate-800"><p>“I added photos of every kitchen we finished. That page gets read more than anything else.”</p></blockquote></li>
      <li class="relative"><span class="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-2 border-white bg-blue-600 ring-2 ring-blue-200" aria-hidden="true"></span><p class="text-sm font-semibold uppercase tracking-wider text-blue-700">Now</p><blockquote class="mt-2 text-lg leading-relaxed text-slate-800"><p>“${P[15].quote}”</p></blockquote></li>
    </ol>
  </div>
</section>`,
  },
  {
    id: "quote-in-cta",
    f: "text",
    name: "Quote inside a call to action",
    html: `<section class="bg-white px-6 py-20">
  <div class="mx-auto grid max-w-6xl gap-10 overflow-hidden rounded-3xl bg-teal-900 p-8 text-white sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
    <div>
      <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Your booking page, ready this afternoon</h2>
      <p class="mt-4 max-w-md text-teal-100">Set your hours, add your services and share one link.</p>
      <a href="#" class="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-teal-950 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-900">Get started ${ARROW}</a>
    </div>
    <figure class="rounded-2xl bg-white/10 p-6 ring-1 ring-white/15">
      <blockquote class="leading-relaxed text-white"><p>“${P[16].quote}”</p></blockquote>
      <figcaption class="mt-5 flex items-center gap-3">${av(P[16], "h-10 w-10 rounded-full")}<div class="text-sm"><div class="font-semibold">${P[16].name}</div><div class="text-teal-100">${P[16].role}</div></div></figcaption>
    </figure>
  </div>
</section>`,
  },
  {
    id: "compact-strip",
    f: "text",
    name: "Compact strip under a form",
    html: `<section class="border-y border-neutral-200 bg-neutral-50 px-6 py-10">
  <h2 class="sr-only">What customers say</h2>
  <div class="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
${[P[6], P[17], P[11]].map(tpl16).join("\n")}
  </div>
</section>`,
  },
  {
    id: "big-type-name-list",
    f: "text",
    name: "Big type with names in the margin",
    html: `<section class="bg-black px-6 py-20 text-white sm:py-28">
  <div class="mx-auto max-w-6xl space-y-16">
${[P[21], P[13], P[3]].map(tpl17).join("\n")}
  </div>
</section>`,
  },
  {
    id: "photo-row-quote-below",
    f: "grid",
    name: "Avatar row with one quote at a time",
    html: `<section class="bg-violet-50 px-6 py-20 sm:py-24">
  <div class="mx-auto max-w-4xl text-center">
    <h2 class="text-3xl font-semibold tracking-tight text-violet-950 sm:text-4xl">Owners who switched this year</h2>
    <ul class="mt-10 flex justify-center -space-x-3" aria-label="Customers quoted on this page">
${[P[0], P[7], P[12], P[19], P[9], P[22]].map(tpl18).join("\n")}
    </ul>
    <figure class="mt-10">
      <blockquote class="text-xl leading-relaxed text-violet-950 sm:text-2xl"><p>“${P[22].quote}”</p></blockquote>
      <figcaption class="mt-6 text-sm"><span class="font-semibold text-violet-950">${P[22].name}</span><span class="text-violet-800">, ${P[22].role}</span></figcaption>
    </figure>
  </div>
</section>`,
  },
];

/* ---------- copy formats ---------- */
const HTML_NOTE = `<!-- Tailwind CSS (v3 or v4). Names, photos and quotes are invented examples: replace them with real customer words used with permission. -->\n`;

function toJsx(html: string, name: string): string {
  const styles: string[] = [];
  let s = html.replace(/<style>([\s\S]*?)<\/style>\n?/g, (_, css) => {
    styles.push(css);
    return "";
  });
  s = s
    .replace(/<!--([\s\S]*?)-->/g, "{/*$1*/}")
    .replace(/\sclass="/g, ' className="')
    .replace(/\sfor="/g, ' htmlFor="')
    .replace(/\stabindex="(-?\d+)"/g, " tabIndex={$1}")
    .replace(/\s(stroke|fill|clip)-(width|linecap|linejoin|rule)="/g, (_, a, b) => ` ${a}${b[0].toUpperCase()}${b.slice(1)}="`)
    .replace(/\swidth="(\d+)"/g, " width={$1}")
    .replace(/\sheight="(\d+)"/g, " height={$1}")
    .replace(/<(img|input|br|hr|source)\b([^>]*?)\s*\/?>/g, "<$1$2 />")
    ;
  const body = s.trim().split("\n").map((l) => "    " + l).join("\n");
  const css = styles.length ? `      <style>{\`${styles.join("\n").trim()}\`}</style>\n` : "";
  return `// Tailwind CSS (v3 or v4). Names, photos and quotes are invented examples: replace them with real customer words used with permission.
export default function ${name}() {
  return (
${css ? `    <>\n${css}${body.replace(/^/gm, "  ")}\n    </>` : body}
  );
}
`;
}
const pascal = (id: string) => "Testimonials" + id.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
const htmlFor = (s: Section) => HTML_NOTE + s.html + "\n";
const jsxFor = (s: Section) => s.jsx ?? toJsx(s.html, pascal(s.id));

/* ---------- preview tile ---------- */
const DESIGN_W = 1280;

function Preview({ s, full }: { s: Section; full: boolean }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ scale: 1, h: 0, wide: true });
  const markup = useMemo(() => s.html.replace(/<script>[\s\S]*?<\/script>/g, "").replace(/<style>[\s\S]*?<\/style>/g, ""), [s]);
  const nodes = useMemo(() => markupToReact(markup), [markup]);

  useLayoutEffect(() => {
    const o = outer.current;
    const n = inner.current;
    if (!o || !n) return;
    const measure = () => {
      const wide = window.innerWidth >= 1024 && !full;
      const scale = wide ? Math.min(1, o.clientWidth / DESIGN_W) : 1;
      setBox({ scale, h: n.offsetHeight * scale, wide });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(n);
    return () => ro.disconnect();
  }, [full]);

  useEffect(() => {
    if (!s.wire || !inner.current) return;
    const root = inner.current.querySelector<HTMLElement>("[data-tslider],[data-ttabs]");
    return root ? s.wire(root) : undefined;
  }, [s]);

  return (
    <div ref={outer} className="relative overflow-hidden bg-white" style={{ height: box.h || undefined }}>
      <div
        ref={inner}
        className="origin-top-left"
        style={box.wide ? { width: DESIGN_W, transform: `scale(${box.scale})` } : undefined}
        {...(box.wide && box.scale < 1 ? { inert: "" as unknown as boolean } : {})}
      >
        {nodes}
      </div>
    </div>
  );
}

/* ---------- markup to React (renders our own fixed markup strings without innerHTML) ---------- */
const VOID_TAGS = new Set(["area", "br", "col", "hr", "img", "input", "meta", "link", "source", "wbr"]);
const ATTR_NAMES: Record<string, string> = { class: "className", for: "htmlFor", tabindex: "tabIndex", srcset: "srcSet", readonly: "readOnly", maxlength: "maxLength", colspan: "colSpan", rowspan: "rowSpan", datetime: "dateTime", viewbox: "viewBox", autoplay: "autoPlay", playsinline: "playsInline", crossorigin: "crossOrigin", value: "defaultValue", checked: "defaultChecked" };
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0", rarr: "\u2192", larr: "\u2190", middot: "\u00b7", mdash: "\u2014", ndash: "\u2013", hellip: "\u2026", copy: "\u00a9", times: "\u00d7" };
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITIES[e.toLowerCase()] ?? m,
  );
const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
function styleObject(s: string): Record<string, string> {
  const o: Record<string, string> = {};
  for (const part of s.split(";")) {
    const at = part.indexOf(":");
    if (at < 1) continue;
    const k = part.slice(0, at).trim();
    o[k.startsWith("--") ? k : camel(k)] = part.slice(at + 1).trim();
  }
  return o;
}
function markupProps(attrs: string, key: string): Record<string, unknown> {
  const props: Record<string, unknown> = { key };
  for (const m of attrs.matchAll(/([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    const raw = m[1];
    const val = m[2] ?? m[3] ?? m[4];
    const v = val === undefined ? true : decode(val);
    if (raw === "style" && typeof v === "string") props.style = styleObject(v);
    else if (/^(aria|data)-/.test(raw)) props[raw] = v;
    else props[ATTR_NAMES[raw.toLowerCase()] ?? (raw.includes("-") || raw.includes(":") ? camel(raw.replace(":", "-")) : raw)] = v === true && raw === "inert" ? "" : v;
  }
  return props;
}
function markupToReact(html: string): ReactNode[] {
  const root: ReactNode[] = [];
  const stack: { tag: string; props: Record<string, unknown>; kids: ReactNode[] }[] = [];
  const top = () => (stack.length ? stack[stack.length - 1].kids : root);
  let n = 0;
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+)/g;
  for (const m of html.matchAll(re)) {
    if (m[0].startsWith("<!--")) continue;
    if (m[4] !== undefined) {
      top().push(decode(m[4]));
    } else if (m[1]) {
      const tag = m[1].toLowerCase();
      if (!stack.some((el) => el.tag.toLowerCase() === tag)) continue;
      while (stack.length) {
        const el = stack.pop()!;
        top().push(createElement(el.tag, el.props, ...el.kids));
        if (el.tag.toLowerCase() === tag) break;
      }
    } else if (m[2]) {
      const tag = m[2];
      const selfClose = /\/\s*$/.test(m[3]);
      const props = markupProps(m[3].replace(/\/\s*$/, ""), `m${n++}`);
      if (selfClose || VOID_TAGS.has(tag.toLowerCase())) top().push(createElement(tag, props));
      else stack.push({ tag, props, kids: [] });
    }
  }
  while (stack.length) {
    const el = stack.pop()!;
    top().push(createElement(el.tag, el.props, ...el.kids));
  }
  return root;
}

/* ---------- repeated markup pieces ---------- */
function tpl101(row: (Person | string)[]): string {
  const [t, p] = row;
  const q = p as Person;
  return `      <figure class="flex flex-col rounded-2xl border border-slate-200 p-6">
        <span class="w-fit rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">${t}</span>
        <blockquote class="mt-5 flex-1 text-[15px] leading-relaxed text-slate-700"><p>${q.quote}</p></blockquote>
        <figcaption class="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">${av(q, "h-10 w-10 rounded-lg")}<div class="text-sm"><div class="font-semibold text-slate-900">${q.name}</div><div class="text-slate-600">${q.role}</div></div></figcaption>
      </figure>`;
}
function tpl102(row: (Person | string)[]): string {
  const [p, b] = row;
  const q = p as Person;
  return `      <figure class="mb-5 break-inside-avoid border-l-2 ${b} bg-white/[0.03] p-6">
        <blockquote class="leading-relaxed text-slate-300"><p>${q.quote}</p></blockquote>
        <figcaption class="mt-5 text-sm"><span class="font-semibold text-white">${q.name}</span><span class="block text-slate-400">${q.role}</span></figcaption>
      </figure>`;
}
function tpl103(row: (Person | string)[]): string {
  const [p, t] = row;
  const q = p as Person;
  return `      <li class="relative overflow-hidden rounded-3xl bg-rose-900">
        <img src="${q.img}" alt="Portrait of ${q.name}" width="600" height="1066" loading="lazy" class="aspect-[9/16] w-full object-cover ${q.pos ?? ""}">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
        <a href="#" class="absolute inset-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white" aria-label="Play ${q.name}'s story, ${t}"></a>
        <span class="pointer-events-none absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-rose-950">${PLAY}</span>
        <div class="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-white">
          <p class="text-lg font-semibold leading-snug">“${q.short}”</p>
          <p class="mt-2 text-sm text-white/80">${q.name} · ${t}</p>
        </div>
      </li>`;
}
function tpl104(row: (Person | string)[]): string {
  const [p, b, a] = row;
  const q = p as Person;
  return `      <article class="flex flex-col rounded-2xl bg-white p-7 ring-1 ring-slate-200">
        <dl class="grid gap-4 text-sm">
          <div><dt class="font-semibold uppercase tracking-wider text-slate-500">Before</dt><dd class="mt-1 text-slate-700">${b}</dd></div>
          <div><dt class="font-semibold uppercase tracking-wider text-blue-700">After</dt><dd class="mt-1 font-medium text-slate-900">${a}</dd></div>
        </dl>
        <figure class="mt-6 flex-1 border-t border-slate-100 pt-6">
          <blockquote class="text-[15px] leading-relaxed text-slate-700"><p>“${q.short}”</p></blockquote>
          <figcaption class="mt-4 flex items-center gap-3">${av(q, "h-10 w-10 rounded-full")}<div class="text-sm"><div class="font-semibold text-slate-900">${q.name}</div><div class="text-slate-600">${q.role}</div></div></figcaption>
        </figure>
        <a href="#" class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded">Read the case study ${ARROW}</a>
      </article>`;
}
function tpl105(row: (Person | string)[]): string {
  const [p, c] = row;
  const q = p as Person;
  return `      <figure class="rounded-2xl border border-slate-200 p-7">
        <blockquote class="text-[15px] leading-relaxed text-slate-700"><p>${q.quote}</p></blockquote>
        <figcaption class="mt-6 flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-full ${c} text-sm font-semibold" aria-hidden="true">${initials(q.name)}</span><div class="text-sm"><div class="font-semibold text-slate-900">${q.name}</div><div class="text-slate-600">${q.role}</div></div></figcaption>
      </figure>`;
}
function tpl106(row: (Person | string)[]): string {
  const [p, c] = row;
  const q = p as Person;
  return `      <figure class="relative ${c} p-6 pt-8 shadow-[0_10px_20px_-12px_rgba(0,0,0,0.35)] motion-safe:transition-transform motion-safe:hover:rotate-0">
        <span class="absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-red-600 shadow" aria-hidden="true"></span>
        <blockquote class="font-serif text-lg italic leading-relaxed text-stone-800"><p>${q.short} ${q.quote.split(". ").slice(-1)[0]}</p></blockquote>
        <figcaption class="mt-4 text-sm font-semibold text-stone-900">${q.name.split(" ")[0]}, ${q.role.split(",")[0].toLowerCase()}</figcaption>
      </figure>`;
}
function tpl1(p: Person, i: number): string {
  return `      <figure class="text-center${i ? " hidden" : ""}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${SLIDES.length}" data-slide>
        <blockquote class="font-serif text-2xl leading-snug text-stone-900 sm:text-[34px] sm:leading-[1.25]"><p>“${p.quote}”</p></blockquote>
        <figcaption class="mt-8 flex items-center justify-center gap-3">
          ${av(p, "h-12 w-12 rounded-full")}
          <span class="text-left"><span class="block font-semibold text-stone-900">${p.name}</span><span class="block text-sm text-stone-600">${p.role}</span></span>
        </figcaption>
      </figure>`;
}
function tpl2(p: Person, i: number): string {
  return `        <button type="button" class="grid h-10 w-6 place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a4b2a] rounded" aria-label="Show quote ${i + 1}, ${p.name}"${i ? "" : ' aria-current="true"'} data-dot><span class="h-2 w-2 rounded-full ${i ? "bg-stone-400" : "bg-stone-900"}"></span></button>`;
}
function tpl3(p: Person): string {
  return `  {\n    name: ${JSON.stringify(p.name)},\n    role: ${JSON.stringify(p.role)},\n    img: ${JSON.stringify(p.img)},\n    quote: ${JSON.stringify(p.quote)},\n  },`;
}
function tpl4(p: Person, i: number): string {
  return `        <button type="button" role="tab" aria-selected="${i === 0}" tabindex="${i ? -1 : 0}" class="group flex items-center gap-3 rounded-full border border-slate-700 py-1.5 pl-1.5 pr-4 text-left text-sm text-slate-300 hover:border-slate-500 aria-selected:border-sky-400 aria-selected:bg-sky-400/10 aria-selected:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400" data-tab>${av(p, "h-9 w-9 rounded-full")}${p.name}</button>`;
}
function tpl5(p: Person, i: number): string {
  return `    <figure role="tabpanel" aria-label="${p.name}" class="rounded-3xl border border-slate-800 bg-slate-900 p-8 sm:p-10"${i ? " hidden" : ""} data-panel>
      ${QUOTE_SVG("h-8 w-8 text-sky-400")}
      <blockquote class="mt-6 text-xl leading-relaxed text-slate-100 sm:text-2xl"><p>${p.quote}</p></blockquote>
      <figcaption class="mt-8 border-t border-slate-800 pt-6"><span class="block font-semibold">${p.name}</span><span class="block text-sm text-slate-400">${p.role}</span></figcaption>
    </figure>`;
}
function tpl6(p: Person): string {
  return `  {\n    name: ${JSON.stringify(p.name)},\n    role: ${JSON.stringify(p.role)},\n    img: ${JSON.stringify(p.img)},\n    quote: ${JSON.stringify(p.quote)},\n  },`;
}
function tpl7(p: Person): string {
  return `      <figure class="overflow-hidden rounded-3xl bg-zinc-100">
        <img src="${p.img}" alt="Portrait of ${p.name}" width="800" height="560" loading="lazy" class="aspect-[4/3] w-full object-cover object-top">
        <div class="p-8">
          <blockquote class="text-lg leading-relaxed text-zinc-800"><p>“${p.quote}”</p></blockquote>
          <figcaption class="mt-6 text-sm"><span class="font-semibold text-zinc-900">${p.name}</span> <span class="text-zinc-600">· ${p.role}</span></figcaption>
        </div>
      </figure>`;
}
function tpl8(p: Person): string {
  return `      <figure class="flex flex-col justify-between rounded-3xl bg-white p-6 ring-1 ring-stone-200">
        <blockquote class="text-[15px] leading-relaxed text-stone-700"><p>${p.short} ${p.quote.split(". ")[0]}.</p></blockquote>
        <figcaption class="mt-5 flex items-center gap-3">${av(p, "h-9 w-9 rounded-full")}<div class="text-sm"><div class="font-semibold text-stone-900">${p.name}</div><div class="text-stone-600">${p.role}</div></div></figcaption>
      </figure>`;
}
function tpl9(p: Person): string {
  return `      <figure class="bg-zinc-950 p-7">
        <blockquote class="text-[15px] leading-relaxed text-zinc-300"><p>${p.quote}</p></blockquote>
        <figcaption class="mt-6 flex items-center gap-3">${av(p, "h-10 w-10 rounded-full grayscale")}<div class="text-sm"><div class="font-medium text-white">${p.name}</div><div class="text-zinc-400">${p.role}</div></div></figcaption>
      </figure>`;
}
function tpl10(p: Person): string {
  return `    <figure class="flex w-[85%] shrink-0 snap-start flex-col justify-between rounded-3xl bg-white p-7 shadow-sm ring-1 ring-sky-100 sm:w-[380px]">
      <blockquote class="text-[15px] leading-relaxed text-slate-700"><p>${p.quote}</p></blockquote>
      <figcaption class="mt-6 flex items-center gap-3">${av(p, "h-11 w-11 rounded-full")}<div class="text-sm"><div class="font-semibold text-slate-900">${p.name}</div><div class="text-slate-600">${p.role}</div></div></figcaption>
    </figure>`;
}
function tpl11(p: Person): string {
  return `      <li class="flex shrink-0 items-center gap-3 rounded-full border border-white/10 bg-white/5 py-2 pl-2 pr-5">${av(p, "h-8 w-8 rounded-full")}<span class="text-sm text-white">“${p.short}”</span><span class="text-sm text-neutral-400">${p.name}</span></li>`;
}
function tpl12(k: number): string {
  return `    <ul class="flex gap-4"${k ? ' aria-hidden="true"' : ""}>
${[P[0], P[6], P[12], P[16], P[19], P[20], P[7], P[3]].map(tpl11).join("\n")}
    </ul>`;
}
function tpl13(p: Person): string {
  return `      <li>
        <a href="#" class="group grid gap-4 py-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-8">
          ${av(p, "h-16 w-16 rounded-xl")}
          <span><span class="block text-lg font-medium leading-snug text-neutral-900">“${p.short}”</span><span class="mt-1 block text-sm text-neutral-600">${p.name}, ${p.role}</span></span>
          <span class="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 group-hover:underline">Read story ${ARROW}</span>
        </a>
      </li>`;
}
function tpl14(p: Person): string {
  return `      <figure class="py-8 first:pt-0">
        <blockquote class="font-serif text-xl leading-relaxed text-stone-800 sm:text-2xl"><p>${p.quote}</p></blockquote>
        <figcaption class="mt-4 text-sm uppercase tracking-[0.14em] text-stone-600">${p.name} · ${p.role}</figcaption>
      </figure>`;
}
function tpl15(p: Person, i: number): string {
  return `      <li class="flex items-end gap-3${i % 2 ? " flex-row-reverse" : ""}">
        ${av(p, "h-10 w-10 shrink-0 rounded-full")}
        <figure class="max-w-[80%] rounded-3xl ${i % 2 ? "rounded-br-md bg-indigo-700 text-white" : "rounded-bl-md bg-white text-slate-800 shadow-sm"} px-5 py-4">
          <blockquote class="text-[15px] leading-relaxed"><p>${p.quote}</p></blockquote>
          <figcaption class="mt-2 text-xs font-semibold ${i % 2 ? "text-indigo-100" : "text-slate-600"}">${p.name}</figcaption>
        </figure>
      </li>`;
}
function tpl16(p: Person): string {
  return `    <figure class="flex gap-4">
      ${av(p, "h-12 w-12 shrink-0 rounded-full")}
      <div><blockquote class="text-sm leading-relaxed text-neutral-800"><p>“${p.short}”</p></blockquote><figcaption class="mt-1 text-xs text-neutral-600">${p.name}, ${p.role}</figcaption></div>
    </figure>`;
}
function tpl17(p: Person): string {
  return `    <figure class="grid gap-4 md:grid-cols-[200px_1fr] md:gap-12">
      <figcaption class="text-sm md:pt-3"><span class="block font-semibold text-white">${p.name}</span><span class="block text-neutral-400">${p.role}</span></figcaption>
      <blockquote class="text-2xl font-medium leading-snug tracking-tight sm:text-4xl"><p>${p.short} <span class="text-neutral-400">${p.quote.split(". ")[0]}.</span></p></blockquote>
    </figure>`;
}
function tpl18(p: Person): string {
  return `      <li>${av(p, "h-14 w-14 rounded-full ring-4 ring-violet-50")}</li>`;
}

export default function TestimonialSectionExamples() {
  const [family, setFamily] = useState<Family | "all">("all");
  const [full, setFull] = useState<string | null>(null);
  const [code, setCode] = useState<{ id: string; kind: "jsx" | "html" } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const keys = Object.keys(FAMILIES) as Family[];
  const list = SECTIONS.filter((s) => family === "all" || s.f === family).sort((a, b) => keys.indexOf(a.f) - keys.indexOf(b.f));

  async function copy(s: Section, kind: "jsx" | "html") {
    const text = kind === "jsx" ? jsxFor(s) : htmlFor(s);
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) setCode({ id: s.id, kind });
    setCopied(ok ? `${s.id}:${kind}` : null);
    setAnnounce(ok ? `${s.name} ${kind === "jsx" ? "React" : "HTML"} copied` : "Copy was blocked, the code is shown so you can select it");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  }

  const chip =
    "inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";
  const btn =
    "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

  return (
    <section className="bg-[#f5f4f0] px-4 py-12 text-[#16181d] sm:px-8 sm:py-16" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <style>{`@keyframes ctm-left { to { transform: translateX(-50%); } } @keyframes ctm-up { to { transform: translateY(-50%); } }`}</style>
      <div className="mx-auto max-w-7xl">
        <header className="max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">React + Tailwind · plain HTML</p>
          <h2 className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">{SECTIONS.length} testimonial section examples</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-stone-600">
            Grids, masonry walls, sliders, marquees, video posters and case studies. Every section copies as a React component or as plain HTML with Tailwind classes. The people and quotes are invented, so swap in words your customers really said.
          </p>
        </header>

        <div className="mt-8 flex flex-wrap gap-1.5 border-y border-stone-300/70 py-4" role="group" aria-label="Filter by layout">
          {(["all", ...keys] as const).map((f) => {
            const on = family === f;
            const n = f === "all" ? SECTIONS.length : SECTIONS.filter((s) => s.f === f).length;
            return (
              <button key={f} type="button" aria-pressed={on} onClick={() => setFamily(f)} className={`${chip} ${on ? "bg-[#16181d] text-white" : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"}`}>
                {f === "all" ? "All" : FAMILIES[f]}
                <span className={`font-mono text-[11px] ${on ? "text-stone-300" : "text-stone-500"}`}>{n}</span>
              </button>
            );
          })}
        </div>
        <p className="sr-only" aria-live="polite">{announce}</p>

        <div className="mt-6 h-[1140px] overflow-y-auto overscroll-contain pr-1" tabIndex={0} aria-label="Testimonial sections">
          <ul className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            {list.map((s) => {
              const isFull = full === s.id;
              const shown = code?.id === s.id ? code.kind : null;
              return (
                <li key={s.id} className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(22,24,29,0.04)] ${isFull ? "lg:col-span-2" : ""}`}>
                  <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 px-3 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-stone-900">{s.name}</span>
                    <span className="hidden font-mono text-[11px] text-stone-500 sm:inline">{FAMILIES[s.f]}</span>
                    <button type="button" aria-pressed={isFull} onClick={() => setFull(isFull ? null : s.id)} className={`${btn} hidden lg:inline-flex ${isFull ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"}`}>
                      {isFull ? "Scaled" : "Full size"}
                    </button>
                  </div>
                  <Preview s={s} full={isFull} />
                  <div className="flex flex-wrap items-center gap-2 border-t border-stone-200 px-3 py-2.5">
                    {(["jsx", "html"] as const).map((k) => (
                      <button key={k} type="button" aria-expanded={shown === k} aria-controls={`ctm-code-${s.id}`} onClick={() => setCode(shown === k ? null : { id: s.id, kind: k })} className={`${btn} ${shown === k ? "bg-stone-200 text-stone-900" : "text-stone-700 hover:bg-stone-100"}`}>
                        {shown === k ? "Hide" : "View"} {k === "jsx" ? "React" : "HTML"}
                      </button>
                    ))}
                    <span className="flex-1" />
                    {(["jsx", "html"] as const).map((k) => {
                      const done = copied === `${s.id}:${k}`;
                      return (
                        <button key={k} type="button" onClick={() => copy(s, k)} aria-label={`Copy ${k === "jsx" ? "React and Tailwind JSX" : "HTML"} for ${s.name}`} className={`${btn} ${done ? "bg-emerald-700 text-white" : k === "jsx" ? "bg-[#16181d] text-white hover:bg-stone-700" : "bg-stone-100 text-stone-900 hover:bg-stone-200"}`}>
                          {done ? "Copied" : k === "jsx" ? "Copy JSX" : "Copy HTML"}
                        </button>
                      );
                    })}
                  </div>
                  {shown && (
                    <pre id={`ctm-code-${s.id}`} tabIndex={0} className="max-h-96 overflow-auto whitespace-pre border-t border-stone-800 bg-[#111318] p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200">
                      <code>{shown === "jsx" ? jsxFor(s) : htmlFor(s)}</code>
                    </pre>
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
