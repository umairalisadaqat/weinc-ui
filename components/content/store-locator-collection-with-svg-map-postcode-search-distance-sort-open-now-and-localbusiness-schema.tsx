import { useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

/*
  Store locator with no map library and no plugin.
  The map is an inline SVG of a made-up town; stores are placed on it by projecting their latitude and
  longitude into the SVG's box. Everything else (postcode search, haversine distance sort, "open now"
  from opening hours, directions links, JSON-LD) is plain code you can reuse with a real map.
  Directions links are href="#" in this demo. On a real site build them from the store's coordinates:
    Google Maps: www.google.com/maps/dir/?api=1&destination=LAT,LNG   (prefix with the https scheme)
    Apple Maps:  maps.apple.com/?daddr=LAT,LNG
  All names, postcodes and coordinates below are invented.
*/

type Day = "su" | "mo" | "tu" | "we" | "th" | "fr" | "sa";
type Store = {
  id: string;
  name: string;
  street: string;
  town: string;
  postcode: string;
  phone: string;
  lat: number;
  lng: number;
  hours: Record<Day, string>;
};

/* ---------- data: edit this list ---------- */
const WEEKDAY = "08:00-18:00";
const STORES: Store[] = [
  { id: "quay", name: "Fieldstone Hardware, Kestrel Quay", street: "4 Ropewalk Lane", town: "Kestrel Quay", postcode: "KQ1 4RL", phone: "01632 960 114", lat: 52.0412, lng: -1.0388, hours: { mo: WEEKDAY, tu: WEEKDAY, we: WEEKDAY, th: WEEKDAY, fr: "08:00-20:00", sa: "09:00-17:00", su: "10:00-16:00" } },
  { id: "market", name: "Fieldstone Hardware, Market Square", street: "21 Corn Exchange Row", town: "Ashby Centre", postcode: "AC2 1CX", phone: "01632 960 227", lat: 52.0335, lng: -1.0021, hours: { mo: "07:30-19:00", tu: "07:30-19:00", we: "07:30-19:00", th: "07:30-19:00", fr: "07:30-19:00", sa: "08:00-18:00", su: "closed" } },
  { id: "millbrook", name: "Fieldstone Hardware, Millbrook", street: "88 Weir Road", town: "Millbrook", postcode: "MB4 8WR", phone: "01632 960 381", lat: 52.0558, lng: -0.9702, hours: { mo: WEEKDAY, tu: WEEKDAY, we: WEEKDAY, th: WEEKDAY, fr: WEEKDAY, sa: "09:00-16:00", su: "closed" } },
  { id: "rise", name: "Fieldstone Trade Counter, Ashby Rise", street: "Unit 6, Larkspur Park", town: "Ashby Rise", postcode: "AR3 6LP", phone: "01632 960 402", lat: 52.0178, lng: -0.9563, hours: { mo: "06:30-17:00", tu: "06:30-17:00", we: "06:30-17:00", th: "06:30-17:00", fr: "06:30-16:00", sa: "07:00-12:00", su: "closed" } },
  { id: "green", name: "Fieldstone Hardware, Harrow Green", street: "3 Chapel Parade", town: "Harrow Green", postcode: "HG5 3CP", phone: "01632 960 519", lat: 52.0121, lng: -1.0296, hours: { mo: "09:00-17:30", tu: "09:00-17:30", we: "closed", th: "09:00-17:30", fr: "09:00-17:30", sa: "09:00-17:00", su: "closed" } },
  { id: "docks", name: "Fieldstone Garden Centre, Old Docks", street: "Basin Wharf", town: "Old Docks", postcode: "OD7 2BW", phone: "01632 960 640", lat: 52.0467, lng: -1.0119, hours: { mo: "09:00-18:00", tu: "09:00-18:00", we: "09:00-18:00", th: "09:00-21:00", fr: "09:00-18:00", sa: "08:30-18:00", su: "10:00-17:00" } },
];

/* Places a visitor can search for. A real site would call a geocoder here. */
const PLACES: { label: string; keys: string[]; lat: number; lng: number }[] = [
  { label: "Ashby Centre", keys: ["ashby centre", "ac2", "town hall"], lat: 52.0312, lng: -1.0055 },
  { label: "Kestrel Quay", keys: ["kestrel quay", "kq1"], lat: 52.0431, lng: -1.0432 },
  { label: "Millbrook", keys: ["millbrook", "mb4"], lat: 52.0581, lng: -0.9741 },
  { label: "Ashby Rise", keys: ["ashby rise", "ar3"], lat: 52.0159, lng: -0.9601 },
  { label: "Harrow Green", keys: ["harrow green", "hg5"], lat: 52.0102, lng: -1.0331 },
  { label: "Old Docks", keys: ["old docks", "od7"], lat: 52.0489, lng: -1.0151 },
  { label: "Fenwick Hill", keys: ["fenwick hill", "fh6"], lat: 52.0247, lng: -0.9858 },
];

/* ---------- logic (the same functions appear in the copyable code) ---------- */
const DAYS: Day[] = ["su", "mo", "tu", "we", "th", "fr", "sa"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

function openState(store: Store, at: Date): { open: boolean; text: string } {
  const day = at.getDay();
  const now = at.getHours() * 60 + at.getMinutes();
  const today = store.hours[DAYS[day]];
  if (today !== "closed") {
    const [o, c] = today.split("-");
    if (now >= toMin(o) && now < toMin(c)) return { open: true, text: `Open now, closes ${c}` };
    if (now < toMin(o)) return { open: false, text: `Closed, opens ${o} today` };
  }
  for (let i = 1; i <= 7; i++) {
    const next = store.hours[DAYS[(day + i) % 7]];
    if (next !== "closed") return { open: false, text: `Closed, opens ${next.split("-")[0]} ${i === 1 ? "tomorrow" : DAY_NAMES[(day + i) % 7]}` };
  }
  return { open: false, text: "Closed" };
}

const SCHEME = "https:" + "//";
const SCHEMA_DAYS: Record<Day, string> = { mo: "Monday", tu: "Tuesday", we: "Wednesday", th: "Thursday", fr: "Friday", sa: "Saturday", su: "Sunday" };

function jsonLd(s: Store): string {
  const spec = (Object.keys(SCHEMA_DAYS) as Day[])
    .filter((d) => s.hours[d] !== "closed")
    .map((d) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: SCHEMA_DAYS[d], opens: s.hours[d].split("-")[0], closes: s.hours[d].split("-")[1] }));
  const data = {
    "@context": `${SCHEME}schema.org`,
    "@type": "HardwareStore",
    "@id": `${SCHEME}example.com/stores/${s.id}#store`,
    name: s.name,
    telephone: s.phone,
    address: { "@type": "PostalAddress", streetAddress: s.street, addressLocality: s.town, postalCode: s.postcode, addressCountry: "GB" },
    geo: { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng },
    openingHoursSpecification: spec,
  };
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>\n`;
}

const VANILLA = `// store-locator.js: no libraries. stores is the JSON array shown in the Data tab.
function distanceKm(aLat, aLng, bLat, bLng) {
  const R = 6371; // mean Earth radius in km (use 3959 for miles)
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h)); // haversine formula
}

const DAYS = ["su", "mo", "tu", "we", "th", "fr", "sa"];
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

function isOpen(store, at = new Date()) {
  // Uses the visitor's clock. If stores span time zones, convert "at" first.
  const spec = store.hours[DAYS[at.getDay()]];
  if (spec === "closed") return false;
  const [open, close] = spec.split("-");
  const now = at.getHours() * 60 + at.getMinutes();
  return now >= toMin(open) && now < toMin(close);
}

function directionsUrl(store) {
  // Opens turn-by-turn directions from wherever the visitor is.
  return "${SCHEME}www.google.com/maps/dir/?api=1&destination=" + store.lat + "," + store.lng;
  // Apple Maps: "${SCHEME}maps.apple.com/?daddr=" + store.lat + "," + store.lng
}

function nearest(stores, origin, openOnly = false) {
  return stores
    .map((s) => ({ ...s, km: distanceKm(origin.lat, origin.lng, s.lat, s.lng) }))
    .filter((s) => !openOnly || isOpen(s))
    .sort((a, b) => a.km - b.km);
}

function render(list, el) {
  el.replaceChildren(...list.map((s) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = directionsUrl(s);
    a.textContent = "Directions";
    li.append(s.name + ", " + s.km.toFixed(1) + " km, " + (isOpen(s) ? "open now" : "closed") + " ");
    li.append(a);
    return li;
  }));
}
`;

const REACT = `import { useMemo, useState } from "react";
// distanceKm, isOpen and directionsUrl: paste them from the vanilla tab.

export function useStoreLocator(stores, start) {
  const [origin, setOrigin] = useState(start); // { lat, lng, label }
  const [openOnly, setOpenOnly] = useState(false);
  const [selected, setSelected] = useState(null);

  const results = useMemo(() => stores
    .map((s) => ({ ...s, km: distanceKm(origin.lat, origin.lng, s.lat, s.lng), open: isOpen(s) }))
    .filter((s) => !openOnly || s.open)
    .sort((a, b) => a.km - b.km), [stores, origin, openOnly]);

  return { results, origin, setOrigin, openOnly, setOpenOnly, selected, setSelected };
}

// Map pins and list rows both call setSelected(store.id); both read selected
// to highlight, which keeps the list and the map in step.
`;

/* ---------- SVG map projection ---------- */
const W = 640;
const H = 440;
const BOUNDS = { minLat: 52.004, maxLat: 52.064, minLng: -1.052, maxLng: -0.948 };
const px = (lat: number, lng: number) => ({
  x: ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * W,
  y: ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * H,
});

type Tab = "data" | "jsonld" | "vanilla" | "react";
const TABS: { k: Tab; label: string }[] = [
  { k: "data", label: "stores.json" },
  { k: "jsonld", label: "LocalBusiness JSON-LD" },
  { k: "vanilla", label: "Vanilla JS" },
  { k: "react", label: "React hook" },
];

export default function StoreLocatorCollection() {
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState(PLACES[0]);
  const [message, setMessage] = useState(`Showing stores nearest ${PLACES[0].label}.`);
  const [openOnly, setOpenOnly] = useState(false);
  const [selected, setSelected] = useState<string>("market");
  const [tab, setTab] = useState<Tab>("jsonld");
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const now = useMemo(() => new Date(), []);

  const results = useMemo(
    () =>
      STORES.map((s) => ({ s, km: distanceKm(origin.lat, origin.lng, s.lat, s.lng), st: openState(s, now) }))
        .filter((r) => !openOnly || r.st.open)
        .sort((a, b) => a.km - b.km),
    [origin, openOnly, now],
  );
  const sel = STORES.find((s) => s.id === selected) ?? STORES[0];

  function search(e: FormEvent) {
    e.preventDefault();
    const q = query.trim().toLowerCase().replace(/\s+/g, " ");
    if (!q) return;
    const hit = PLACES.find((p) => p.keys.some((k) => k.startsWith(q) || q.startsWith(k)));
    if (!hit) {
      setMessage(`No match for "${query}". Try a town such as Millbrook or a postcode start such as KQ1.`);
      return;
    }
    setOrigin(hit);
    const first = STORES.map((s) => ({ s, km: distanceKm(hit.lat, hit.lng, s.lat, s.lng) })).sort((a, b) => a.km - b.km)[0];
    setSelected(first.s.id);
    setMessage(`Showing stores nearest ${hit.label}. Closest is ${first.s.name.split(", ")[1]}, ${first.km.toFixed(1)} km away.`);
  }

  function pick(id: string, fromMap: boolean) {
    setSelected(id);
    if (fromMap && listRef.current) {
      const row = listRef.current.querySelector<HTMLElement>(`[data-id="${id}"]`);
      if (row) listRef.current.scrollTo({ top: row.offsetTop - listRef.current.offsetTop - 8, behavior: "smooth" });
    }
  }

  function pinKey(e: KeyboardEvent<SVGGElement>, id: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(id, true);
    }
  }

  function tabKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const n = e.key === "ArrowRight" ? (i + 1) % TABS.length : e.key === "ArrowLeft" ? (i + TABS.length - 1) % TABS.length : -1;
    if (n < 0) return;
    e.preventDefault();
    setTab(TABS[n].k);
    tabRefs.current[n]?.focus();
  }

  const code =
    tab === "data" ? JSON.stringify(STORES, null, 2) + "\n" : tab === "jsonld" ? jsonLd(sel) : tab === "vanilla" ? VANILLA : REACT;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setShowAll(true);
      setMessage("Copy was blocked, the full code is shown so you can select it.");
    }
  }

  const o = px(origin.lat, origin.lng);
  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2";

  return (
    <section className="bg-[#f6f5f1] px-4 py-12 text-stone-900 sm:px-8 sm:py-14" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <style>{`@media (prefers-reduced-motion: reduce) { .sl-pin { transition: none !important; } }`}</style>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">Store locator · no plugin · no map library</p>
            <h2 className="mt-3 text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[40px]">Find a Fieldstone store</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-stone-600">Search a town or postcode. Results sort by straight-line distance and show which stores are open right now.</p>
          </div>
        </header>

        <form onSubmit={search} className="mt-6 flex flex-col gap-3 rounded-2xl bg-white p-3 ring-1 ring-stone-200 sm:flex-row sm:items-center">
          <label htmlFor="sl-q" className="sr-only">Town or postcode</label>
          <div className="relative flex-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500">
              <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />
            </svg>
            <input id="sl-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Town or postcode, e.g. Millbrook or KQ1" autoComplete="postal-code" className="h-11 w-full rounded-xl border border-stone-300 pl-9 pr-3 text-[15px] placeholder:text-stone-500 focus:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-700/15" />
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="sl-open" className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-[14px] text-stone-700">
              <input id="sl-open" type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="h-[18px] w-[18px] accent-emerald-700" />
              Open now only
            </label>
            <button type="submit" className={`h-11 rounded-xl bg-emerald-800 px-5 text-[14px] font-semibold text-white hover:bg-emerald-900 ${ring}`}>Search</button>
          </div>
        </form>
        <p className="mt-2 text-[13px] text-stone-600" role="status" aria-live="polite">{message}</p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
          <ul ref={listRef} className="relative order-2 max-h-[460px] space-y-2 overflow-y-auto pr-1 lg:order-1" aria-label="Stores, nearest first">
            {results.length === 0 && <li className="rounded-xl border border-dashed border-stone-300 p-6 text-[14px] text-stone-600">No store is open at this hour. Clear "Open now only" to see them all.</li>}
            {results.map(({ s, km, st }, i) => {
              const on = s.id === selected;
              return (
                <li key={s.id} data-id={s.id} className={`rounded-xl bg-white p-4 ring-1 transition-shadow ${on ? "ring-2 ring-emerald-700 shadow-[0_6px_18px_-10px_rgba(6,78,59,0.5)]" : "ring-stone-200"}`}>
                  <button type="button" aria-pressed={on} onClick={() => pick(s.id, false)} className={`flex w-full items-start gap-3 rounded-lg text-left ${ring}`}>
                    <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${on ? "bg-emerald-800 text-white" : "bg-stone-100 text-stone-700"}`}>{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold leading-snug">{s.name.split(", ")[1]}</span>
                      <span className="block text-[13px] text-stone-600">{s.street}, {s.postcode}</span>
                      <span className={`mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium ${st.open ? "text-emerald-800" : "text-stone-600"}`}>
                        <span className={`h-2 w-2 rounded-full ${st.open ? "bg-emerald-600" : "bg-stone-400"}`} aria-hidden="true" />
                        {st.text}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[13px] tabular-nums text-stone-700">{km.toFixed(1)} km</span>
                  </button>
                  {on && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
                      {/* Demo link. Real one: Google Maps dir/?api=1&destination=LAT,LNG or Apple Maps ?daddr=LAT,LNG */}
                      <a href="#" className={`inline-flex min-h-[40px] items-center rounded-lg bg-emerald-800 px-3.5 text-[13px] font-semibold text-white hover:bg-emerald-900 ${ring}`}>Directions</a>
                      <a href="#" className={`inline-flex min-h-[40px] items-center rounded-lg px-3.5 text-[13px] font-semibold text-stone-800 ring-1 ring-inset ring-stone-300 hover:bg-stone-50 ${ring}`}>Call {s.phone}</a>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <figure className="order-1 overflow-hidden rounded-2xl bg-[#e9ebe4] ring-1 ring-stone-200 lg:order-2">
            <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="group" aria-label="Map of stores. Use the pins or the list to choose a store.">
              <rect width={W} height={H} fill="#eceee7" />
              {/* parks */}
              <path d="M410 250 L520 232 L548 300 L470 338 L404 312 Z" fill="#d5e3cc" />
              <path d="M70 330 C110 300 170 312 190 350 C170 392 98 400 70 370 Z" fill="#d5e3cc" />
              <path d="M300 40 L370 34 L380 92 L310 98 Z" fill="#d5e3cc" />
              {/* river and docks */}
              <path d="M-10 128 C80 120 140 168 230 150 S360 92 430 120 S560 190 650 170" fill="none" stroke="#b9d3df" strokeWidth={26} strokeLinecap="round" />
              <rect x={232} y={118} width={40} height={22} rx={3} fill="#b9d3df" />
              {/* minor streets */}
              <g stroke="#fbfbf8" strokeWidth={5} fill="none">
                {[60, 120, 180, 240, 300, 360, 420, 480, 540, 600].map((x) => <path key={`v${x}`} d={`M${x} 170 V${H}`} opacity={0.9} />)}
                {[200, 250, 300, 350, 400].map((y) => <path key={`h${y}`} d={`M0 ${y} H${W}`} />)}
                {[20, 60, 100].map((y) => <path key={`n${y}`} d={`M0 ${y} H${W}`} />)}
              </g>
              {/* main roads */}
              <g stroke="#ffffff" strokeWidth={11} fill="none" strokeLinecap="round">
                <path d="M0 236 C160 228 280 250 400 226 S560 200 650 214" />
                <path d="M330 -10 C320 120 350 260 318 450" />
                <path d="M120 450 C180 330 260 250 330 230" />
              </g>
              <g stroke="#f2c97a" strokeWidth={5} fill="none" strokeLinecap="round">
                <path d="M0 236 C160 228 280 250 400 226 S560 200 650 214" />
              </g>
              {/* labels */}
              <g fill="#6b6f66" fontSize={11} fontWeight={600} letterSpacing="0.08em">
                <text x={30} y={86}>KESTREL QUAY</text>
                <text x={470} y={74}>MILLBROOK</text>
                <text x={250} y={300}>ASHBY CENTRE</text>
                <text x={470} y={372}>ASHBY RISE</text>
                <text x={92} y={420}>HARROW GREEN</text>
                <text x={282} y={98}>OLD DOCKS</text>
              </g>
              <text x={500} y={150} fill="#6f8f9c" fontSize={11} fontStyle="italic">River Lune</text>
              {/* search origin */}
              <g aria-hidden="true">
                <circle cx={o.x} cy={o.y} r={16} fill="#2563eb" opacity={0.15} />
                <circle cx={o.x} cy={o.y} r={6} fill="#2563eb" stroke="#fff" strokeWidth={2.5} />
              </g>
              {/* pins */}
              {results.map(({ s }, i) => {
                const p = px(s.lat, s.lng);
                const on = s.id === selected;
                return (
                  <g
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${s.name}, result ${i + 1}`}
                    aria-pressed={on}
                    onClick={() => pick(s.id, true)}
                    onKeyDown={(e) => pinKey(e, s.id)}
                    className="sl-pin cursor-pointer outline-none [&:focus-visible>circle.sl-focus]:opacity-100"
                    style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
                  >
                    <circle className="sl-focus" r={24} fill="none" stroke="#047857" strokeWidth={2.5} opacity={0} />
                    <ellipse cx={0} cy={2} rx={7} ry={2.5} fill="#000" opacity={0.18} />
                    <path d="M0 0 C-3 -8 -13 -14 -13 -24 A13 13 0 1 1 13 -24 C13 -14 3 -8 0 0 Z" fill={on ? "#065f46" : "#ffffff"} stroke={on ? "#022c22" : "#57534e"} strokeWidth={1.5} />
                    <text y={-20} textAnchor="middle" fontSize={12} fontWeight={700} fill={on ? "#ffffff" : "#1c1917"}>{i + 1}</text>
                  </g>
                );
              })}
            </svg>
            <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 bg-white px-4 py-2.5 text-[12.5px] text-stone-600">
              <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden="true" />Searched from {origin.label}</span>
              <span>Illustrated map of an invented town, drawn in SVG</span>
            </figcaption>
          </figure>
        </div>

        <div className="mt-6 rounded-2xl bg-white ring-1 ring-stone-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 px-3 pt-3">
            <div role="tablist" aria-label="Code" className="flex gap-1 overflow-x-auto">
              {TABS.map((t, i) => (
                <button
                  key={t.k}
                  ref={(el) => { tabRefs.current[i] = el; }}
                  type="button"
                  role="tab"
                  id={`sl-tab-${t.k}`}
                  aria-selected={tab === t.k}
                  aria-controls="sl-code"
                  tabIndex={tab === t.k ? 0 : -1}
                  onClick={() => setTab(t.k)}
                  onKeyDown={(e) => tabKey(e, i)}
                  className={`min-h-[40px] shrink-0 border-b-2 px-3 text-[13px] font-medium ${ring} ${tab === t.k ? "border-emerald-700 text-stone-900" : "border-transparent text-stone-600 hover:text-stone-900"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="mb-2 flex gap-2">
              <button type="button" aria-expanded={showAll} aria-controls="sl-code" onClick={() => setShowAll(!showAll)} className={`min-h-[40px] rounded-lg px-3 text-[13px] font-medium text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-50 ${ring}`}>{showAll ? "Shorter" : "Show all"}</button>
              <button type="button" onClick={copy} className={`min-h-[40px] rounded-lg px-3 text-[13px] font-semibold text-white ${ring} ${copied ? "bg-emerald-700" : "bg-stone-900 hover:bg-stone-700"}`}>{copied ? "Copied" : "Copy"}</button>
            </div>
          </div>
          <div role="tabpanel" id="sl-code" aria-labelledby={`sl-tab-${tab}`} className="p-3">
            {tab === "jsonld" && <p className="mb-2 px-1 text-[13px] text-stone-600">Structured data for the selected store, {sel.name.split(", ")[1]}. Put one block on each store's own page.</p>}
            <pre tabIndex={0} className={`overflow-auto rounded-xl bg-[#14161a] p-4 font-mono text-[11.5px] leading-[1.6] text-stone-100 ${showAll ? "max-h-[640px]" : "max-h-[260px]"}`}>
              <code>{code}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
