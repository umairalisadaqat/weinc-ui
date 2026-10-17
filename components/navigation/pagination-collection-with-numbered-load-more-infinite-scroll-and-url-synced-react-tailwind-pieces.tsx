import { useEffect, useRef, useState } from "react";

/*
  Pagination collection.
  Every piece below is a live React component, and next to it sits the exact source you copy.
  The page-number logic lives in one function, pageItems(), which the live demos, the
  usePagination hook you copy and the generated HTML snapshots all share, so the numbers you
  see are the numbers you get.
*/

type Fam = "numbered" | "simple" | "loading" | "logic";
type Lang = "react" | "html";
type Item = { f: Fam; name: string; note: string; Demo: () => JSX.Element; code: Partial<Record<Lang, string>>; wide?: boolean };

const FAMILIES: Record<Fam, string> = {
  numbered: "Numbered",
  simple: "Previous and next",
  loading: "Load more and infinite",
  logic: "Hook and URL",
};
const LANGS: Record<Lang, string> = { react: "React + Tailwind", html: "HTML + Tailwind" };

/* ---------- shared logic ---------- */
type PageItem = number | "gap";
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function pageItems(current: number, total: number, siblings = 1): PageItem[] {
  const slots = siblings * 2 + 5;
  if (total <= slots) return range(1, total);
  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  const leftGap = left > 3;
  const rightGap = right < total - 2;
  const edge = 3 + siblings * 2;
  if (!leftGap) return [...range(1, edge), "gap", total];
  if (!rightGap) return [1, "gap", ...range(total - edge + 1, total)];
  return [1, "gap", ...range(left, right), "gap", total];
}

function usePagination({ total, initial = 1, siblings = 1 }: { total: number; initial?: number; siblings?: number }) {
  const [page, setRaw] = useState(initial);
  const setPage = (p: number) => setRaw(Math.min(Math.max(p, 1), total));
  return {
    page,
    setPage,
    items: pageItems(page, total, siblings),
    hasPrev: page > 1,
    hasNext: page < total,
  };
}

const HOOK = `import { useState } from "react";

type PageItem = number | "gap";
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Returns the buttons to draw: first page, a window around the current page, last page,
// and "gap" where an ellipsis goes. The list always has the same length (siblings * 2 + 5)
// once there are enough pages, so the control never jumps in width.
export function pageItems(current: number, total: number, siblings = 1): PageItem[] {
  const slots = siblings * 2 + 5;
  if (total <= slots) return range(1, total);
  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  const leftGap = left > 3;
  const rightGap = right < total - 2;
  const edge = 3 + siblings * 2;
  if (!leftGap) return [...range(1, edge), "gap", total];
  if (!rightGap) return [1, "gap", ...range(total - edge + 1, total)];
  return [1, "gap", ...range(left, right), "gap", total];
}

export function usePagination({ total, initial = 1, siblings = 1 }: { total: number; initial?: number; siblings?: number }) {
  const [page, setRaw] = useState(initial);
  const setPage = (p: number) => setRaw(Math.min(Math.max(p, 1), total));
  return {
    page,
    setPage,
    items: pageItems(page, total, siblings),
    hasPrev: page > 1,
    hasNext: page < total,
  };
}`;

const CHEV = `function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}`;

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

const SVG_L = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4"><path d="m15 18-6-6 6-6"/></svg>`;
const SVG_R = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4"><path d="m9 18 6-6-6-6"/></svg>`;

/* ---------- 1. Numbered with ellipsis ---------- */
function NumberedPagination({ total = 20, initial = 7 }: { total?: number; initial?: number }) {
  const { page, setPage, items, hasPrev, hasNext } = usePagination({ total, initial });
  const base = "inline-flex h-10 min-w-[2rem] items-center justify-center rounded-lg px-1.5 text-sm sm:min-w-[2.5rem] sm:px-3 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";
  return (
    <nav aria-label="Pagination">
      <ul className="flex flex-wrap items-center gap-0.5 sm:gap-1">
        <li>
          <button type="button" onClick={() => setPage(page - 1)} disabled={!hasPrev} className={base + " gap-1 text-slate-700 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"}>
            <Chevron dir="left" />
            <span className="sr-only sm:not-sr-only">Previous</span>
          </button>
        </li>
        {items.map((it, i) =>
          it === "gap" ? (
            <li key={"gap" + i} aria-hidden="true" className="px-1 text-sm text-slate-500">
              …
            </li>
          ) : (
            <li key={it}>
              <button
                type="button"
                onClick={() => setPage(it)}
                aria-label={"Page " + it}
                aria-current={it === page ? "page" : undefined}
                className={base + (it === page ? " bg-slate-900 text-white" : " text-slate-700 hover:bg-slate-100")}
              >
                {it}
              </button>
            </li>
          )
        )}
        <li>
          <button type="button" onClick={() => setPage(page + 1)} disabled={!hasNext} className={base + " gap-1 text-slate-700 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"}>
            <span className="sr-only sm:not-sr-only">Next</span>
            <Chevron dir="right" />
          </button>
        </li>
      </ul>
    </nav>
  );
}

const NUMBERED_REACT = `${HOOK}

${CHEV}

export function NumberedPagination({ total = 20, initial = 7 }: { total?: number; initial?: number }) {
  const { page, setPage, items, hasPrev, hasNext } = usePagination({ total, initial });
  const base = "inline-flex h-10 min-w-[2rem] items-center justify-center rounded-lg px-1.5 text-sm sm:min-w-[2.5rem] sm:px-3 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";
  return (
    <nav aria-label="Pagination">
      <ul className="flex flex-wrap items-center gap-0.5 sm:gap-1">
        <li>
          <button type="button" onClick={() => setPage(page - 1)} disabled={!hasPrev} className={base + " gap-1 text-slate-700 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"}>
            <Chevron dir="left" />
            <span className="sr-only sm:not-sr-only">Previous</span>
          </button>
        </li>
        {items.map((it, i) =>
          it === "gap" ? (
            <li key={"gap" + i} aria-hidden="true" className="px-1 text-sm text-slate-500">…</li>
          ) : (
            <li key={it}>
              <button
                type="button"
                onClick={() => setPage(it)}
                aria-label={"Page " + it}
                aria-current={it === page ? "page" : undefined}
                className={base + (it === page ? " bg-slate-900 text-white" : " text-slate-700 hover:bg-slate-100")}
              >
                {it}
              </button>
            </li>
          )
        )}
        <li>
          <button type="button" onClick={() => setPage(page + 1)} disabled={!hasNext} className={base + " gap-1 text-slate-700 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"}>
            <span className="sr-only sm:not-sr-only">Next</span>
            <Chevron dir="right" />
          </button>
        </li>
      </ul>
    </nav>
  );
}`;

function numberedHtml(current: number, total: number) {
  const base = "inline-flex h-10 min-w-[2rem] items-center justify-center rounded-lg px-1.5 text-sm sm:min-w-[2.5rem] sm:px-3 font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";
  const cur = "inline-flex h-10 min-w-[2rem] items-center justify-center rounded-lg px-1.5 text-sm sm:min-w-[2.5rem] sm:px-3 font-medium bg-slate-900 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";
  const rows = pageItems(current, total).map((it) =>
    it === "gap"
      ? `    <li aria-hidden="true" class="px-1 text-sm text-slate-500">…</li>`
      : it === current
        ? `    <li><a href="?page=${it}" aria-current="page" aria-label="Page ${it}" class="${cur}">${it}</a></li>`
        : `    <li><a href="?page=${it}" aria-label="Page ${it}" class="${base}">${it}</a></li>`
  );
  return `<!-- Server-rendered page ${current} of ${total}. Each link is a real URL, so crawlers and people without JavaScript can page through. -->
<nav aria-label="Pagination">
  <ul class="flex flex-wrap items-center gap-0.5 sm:gap-1">
    <li><a href="?page=${current - 1}" rel="prev" class="${base} gap-1">${SVG_L}<span class="sr-only sm:not-sr-only">Previous</span></a></li>
${rows.join("\n")}
    <li><a href="?page=${current + 1}" rel="next" class="${base} gap-1"><span class="sr-only sm:not-sr-only">Next</span>${SVG_R}</a></li>
  </ul>
</nav>`;
}

/* ---------- 2. Bordered segmented, with first and last ---------- */
function SegmentedPagination() {
  const total = 48;
  const { page, setPage, items, hasPrev, hasNext } = usePagination({ total, initial: 24 });
  const cell = "flex h-10 w-full min-w-0 items-center justify-center px-1 text-sm sm:min-w-[2.75rem] sm:px-2 tabular-nums focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700";
  return (
    <nav aria-label="Search results pages" className="overflow-x-auto">
      <ul className="flex w-full overflow-hidden rounded-md border border-stone-300 bg-white sm:inline-flex sm:w-auto">
        <li className="flex flex-1 border-l border-stone-300 first:border-l-0 sm:flex-none">
          <button type="button" aria-label="First page" disabled={!hasPrev} onClick={() => setPage(1)} className={cell + " text-stone-700 hover:bg-stone-50 disabled:text-stone-400"}>
            «
          </button>
        </li>
        <li className="flex flex-1 border-l border-stone-300 first:border-l-0 sm:flex-none">
          <button type="button" aria-label="Previous page" disabled={!hasPrev} onClick={() => setPage(page - 1)} className={cell + " text-stone-700 hover:bg-stone-50 disabled:text-stone-400"}>
            ‹
          </button>
        </li>
        {items.map((it, i) =>
          it === "gap" ? (
            <li key={"g" + i} aria-hidden="true" className={cell + " flex-1 border-l border-stone-300 text-stone-500 sm:flex-none"}>
              …
            </li>
          ) : (
            <li key={it} className="flex flex-1 border-l border-stone-300 first:border-l-0 sm:flex-none">
              <button
                type="button"
                aria-label={"Page " + it}
                aria-current={it === page ? "page" : undefined}
                onClick={() => setPage(it)}
                className={cell + (it === page ? " bg-emerald-50 font-semibold text-emerald-900 shadow-[inset_0_-2px_0_#047857]" : " text-stone-700 hover:bg-stone-50")}
              >
                {it}
              </button>
            </li>
          )
        )}
        <li className="flex flex-1 border-l border-stone-300 first:border-l-0 sm:flex-none">
          <button type="button" aria-label="Next page" disabled={!hasNext} onClick={() => setPage(page + 1)} className={cell + " text-stone-700 hover:bg-stone-50 disabled:text-stone-400"}>
            ›
          </button>
        </li>
        <li className="flex flex-1 border-l border-stone-300 first:border-l-0 sm:flex-none">
          <button type="button" aria-label="Last page" disabled={!hasNext} onClick={() => setPage(total)} className={cell + " text-stone-700 hover:bg-stone-50 disabled:text-stone-400"}>
            »
          </button>
        </li>
      </ul>
    </nav>
  );
}

const SEGMENTED_REACT = `${HOOK}

export function SegmentedPagination() {
  const total = 48;
  const { page, setPage, items, hasPrev, hasNext } = usePagination({ total, initial: 24 });
  const cell = "flex h-10 w-full min-w-0 items-center justify-center px-1 text-sm sm:min-w-[2.75rem] sm:px-2 tabular-nums focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700";
  return (
    <nav aria-label="Search results pages" className="overflow-x-auto">
      <ul className="flex w-full overflow-hidden rounded-md border border-stone-300 bg-white sm:inline-flex sm:w-auto">
        <li className="flex flex-1 border-l border-stone-300 first:border-l-0 sm:flex-none">
          <button type="button" aria-label="First page" disabled={!hasPrev} onClick={() => setPage(1)} className={cell + " text-stone-700 hover:bg-stone-50 disabled:text-stone-400"}>«</button>
        </li>
        <li className="flex flex-1 border-l border-stone-300 first:border-l-0 sm:flex-none">
          <button type="button" aria-label="Previous page" disabled={!hasPrev} onClick={() => setPage(page - 1)} className={cell + " text-stone-700 hover:bg-stone-50 disabled:text-stone-400"}>‹</button>
        </li>
        {items.map((it, i) =>
          it === "gap" ? (
            <li key={"g" + i} aria-hidden="true" className={cell + " flex-1 border-l border-stone-300 text-stone-500 sm:flex-none"}>…</li>
          ) : (
            <li key={it} className="flex flex-1 border-l border-stone-300 first:border-l-0 sm:flex-none">
              <button
                type="button"
                aria-label={"Page " + it}
                aria-current={it === page ? "page" : undefined}
                onClick={() => setPage(it)}
                className={cell + (it === page ? " bg-emerald-50 font-semibold text-emerald-900 shadow-[inset_0_-2px_0_#047857]" : " text-stone-700 hover:bg-stone-50")}
              >
                {it}
              </button>
            </li>
          )
        )}
        <li className="flex flex-1 border-l border-stone-300 first:border-l-0 sm:flex-none">
          <button type="button" aria-label="Next page" disabled={!hasNext} onClick={() => setPage(page + 1)} className={cell + " text-stone-700 hover:bg-stone-50 disabled:text-stone-400"}>›</button>
        </li>
        <li className="flex flex-1 border-l border-stone-300 first:border-l-0 sm:flex-none">
          <button type="button" aria-label="Last page" disabled={!hasNext} onClick={() => setPage(total)} className={cell + " text-stone-700 hover:bg-stone-50 disabled:text-stone-400"}>»</button>
        </li>
      </ul>
    </nav>
  );
}`;

/* ---------- 3. Previous and next only ---------- */
function PrevNextPagination() {
  const total = 12;
  const [page, setPage] = useState(3);
  const link = "group flex min-h-[64px] flex-1 flex-col justify-center rounded-xl border border-stone-200 bg-white px-4 py-3 transition-colors hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-40";
  return (
    <nav aria-label="Older and newer posts" className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className={link + " text-left"}>
        <span className="text-xs text-stone-600">Newer posts</span>
        <span className="mt-0.5 text-sm font-semibold text-stone-900">← Page {Math.max(page - 1, 1)}</span>
      </button>
      <p className="flex items-center justify-center px-2 text-sm tabular-nums text-stone-600" aria-live="polite">
        Page {page} of {total}
      </p>
      <button type="button" disabled={page === total} onClick={() => setPage(page + 1)} className={link + " text-right"}>
        <span className="text-xs text-stone-600">Older posts</span>
        <span className="mt-0.5 text-sm font-semibold text-stone-900">Page {Math.min(page + 1, total)} →</span>
      </button>
    </nav>
  );
}

const PREVNEXT_REACT = `import { useState } from "react";

export function PrevNextPagination() {
  const total = 12;
  const [page, setPage] = useState(3);
  const link = "group flex min-h-[64px] flex-1 flex-col justify-center rounded-xl border border-stone-200 bg-white px-4 py-3 transition-colors hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-40";
  return (
    <nav aria-label="Older and newer posts" className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className={link + " text-left"}>
        <span className="text-xs text-stone-600">Newer posts</span>
        <span className="mt-0.5 text-sm font-semibold text-stone-900">← Page {Math.max(page - 1, 1)}</span>
      </button>
      <p className="flex items-center justify-center px-2 text-sm tabular-nums text-stone-600" aria-live="polite">
        Page {page} of {total}
      </p>
      <button type="button" disabled={page === total} onClick={() => setPage(page + 1)} className={link + " text-right"}>
        <span className="text-xs text-stone-600">Older posts</span>
        <span className="mt-0.5 text-sm font-semibold text-stone-900">Page {Math.min(page + 1, total)} →</span>
      </button>
    </nav>
  );
}`;

const PREVNEXT_HTML = `<!-- Page 3 of 12 on a blog archive. On the first or last page, drop that link. -->
<nav aria-label="Older and newer posts" class="flex flex-col gap-3 sm:flex-row sm:items-stretch">
  <a href="?page=2" rel="prev" class="flex min-h-[64px] flex-1 flex-col justify-center rounded-xl border border-stone-200 bg-white px-4 py-3 text-left transition-colors hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
    <span class="text-xs text-stone-600">Newer posts</span>
    <span class="mt-0.5 text-sm font-semibold text-stone-900">← Page 2</span>
  </a>
  <p class="flex items-center justify-center px-2 text-sm tabular-nums text-stone-600">Page 3 of 12</p>
  <a href="?page=4" rel="next" class="flex min-h-[64px] flex-1 flex-col justify-center rounded-xl border border-stone-200 bg-white px-4 py-3 text-right transition-colors hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
    <span class="text-xs text-stone-600">Older posts</span>
    <span class="mt-0.5 text-sm font-semibold text-stone-900">Page 4 →</span>
  </a>
</nav>`;

/* ---------- 4. Mobile compact with page select ---------- */
function CompactPagination() {
  const total = 20;
  const [page, setPage] = useState(4);
  const icon = "grid h-11 w-11 place-items-center rounded-full text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:pointer-events-none disabled:opacity-35";
  return (
    <nav aria-label="Gallery pages" className="mx-auto flex w-full max-w-xs items-center justify-between rounded-full bg-slate-900 p-1 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.6)]">
      <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)} className={icon}>
        <Chevron dir="left" />
      </button>
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <label htmlFor="pg-compact-select">Page</label>
        <select
          id="pg-compact-select"
          value={page}
          onChange={(e) => setPage(Number(e.target.value))}
          className="h-9 rounded-full border border-slate-600 bg-slate-800 px-3 text-sm font-semibold tabular-nums text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          {range(1, total).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="tabular-nums">of {total}</span>
      </div>
      <button type="button" aria-label="Next page" disabled={page === total} onClick={() => setPage(page + 1)} className={icon}>
        <Chevron dir="right" />
      </button>
    </nav>
  );
}

const COMPACT_REACT = `import { useState } from "react";

${CHEV}

// Fits a 320px screen: two 44px buttons and a native select the phone opens as a wheel or list.
// To show it on phones only and full numbers on wider screens, wrap it in "sm:hidden"
// and the numbered version in "hidden sm:block".
export function CompactPagination() {
  const total = 20;
  const [page, setPage] = useState(4);
  const icon = "grid h-11 w-11 place-items-center rounded-full text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:pointer-events-none disabled:opacity-35";
  return (
    <nav aria-label="Gallery pages" className="mx-auto flex w-full max-w-xs items-center justify-between rounded-full bg-slate-900 p-1 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.6)]">
      <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)} className={icon}>
        <Chevron dir="left" />
      </button>
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <label htmlFor="pg-compact-select">Page</label>
        <select
          id="pg-compact-select"
          value={page}
          onChange={(e) => setPage(Number(e.target.value))}
          className="h-9 rounded-full border border-slate-600 bg-slate-800 px-3 text-sm font-semibold tabular-nums text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="tabular-nums">of {total}</span>
      </div>
      <button type="button" aria-label="Next page" disabled={page === total} onClick={() => setPage(page + 1)} className={icon}>
        <Chevron dir="right" />
      </button>
    </nav>
  );
}`;

/* ---------- 5. Table footer with rows per page ---------- */
const CLIENTS = ["Harbor Dental", "Oakline Bakery", "Pemberton Law", "Siltstone Gym", "Marlow Florist", "Quayside Optics", "Brindle Pet Care", "Ashgrove Clinic"];
const INVOICES = Array.from({ length: 47 }, (_, i) => ({
  id: "INV-" + String(2041 + i),
  client: CLIENTS[(i * 5) % CLIENTS.length],
  amount: 180 + ((i * 137) % 940),
}));

function TableFooterPagination() {
  const [size, setSize] = useState(5);
  const [page, setPage] = useState(3);
  const pages = Math.ceil(INVOICES.length / size);
  const start = (page - 1) * size;
  const rows = INVOICES.slice(start, start + size);
  const btn = "grid h-10 w-10 place-items-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:pointer-events-none disabled:opacity-40";
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Invoices, page {page} of {pages}</caption>
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">Invoice</th>
            <th scope="col" className="px-4 py-2.5 font-medium">Client</th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{r.id}</td>
              <td className="px-4 py-2.5 text-slate-900">{r.client}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">${r.amount}.00</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <label htmlFor="pg-rows">Rows</label>
          <select
            id="pg-rows"
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-10 rounded-md border border-slate-300 bg-white px-2 text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            {[5, 10, 25].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <p className="tabular-nums" aria-live="polite">
          {start + 1}–{Math.min(start + size, INVOICES.length)} of {INVOICES.length}
        </p>
        <nav aria-label="Table pages" className="flex gap-1.5">
          <button type="button" aria-label="First page" disabled={page === 1} onClick={() => setPage(1)} className={btn}>«</button>
          <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)} className={btn}>‹</button>
          <button type="button" aria-label="Next page" disabled={page === pages} onClick={() => setPage(page + 1)} className={btn}>›</button>
          <button type="button" aria-label="Last page" disabled={page === pages} onClick={() => setPage(pages)} className={btn}>»</button>
        </nav>
      </div>
    </div>
  );
}

const TABLE_REACT = `import { useState } from "react";

const CLIENTS = ["Harbor Dental", "Oakline Bakery", "Pemberton Law", "Siltstone Gym", "Marlow Florist", "Quayside Optics", "Brindle Pet Care", "Ashgrove Clinic"];
const INVOICES = Array.from({ length: 47 }, (_, i) => ({
  id: "INV-" + String(2041 + i),
  client: CLIENTS[(i * 5) % CLIENTS.length],
  amount: 180 + ((i * 137) % 940),
}));

export function TableFooterPagination() {
  const [size, setSize] = useState(5);
  const [page, setPage] = useState(3);
  const pages = Math.ceil(INVOICES.length / size);
  const start = (page - 1) * size;
  const rows = INVOICES.slice(start, start + size);
  const btn = "grid h-10 w-10 place-items-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:pointer-events-none disabled:opacity-40";
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Invoices, page {page} of {pages}</caption>
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">Invoice</th>
            <th scope="col" className="px-4 py-2.5 font-medium">Client</th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{r.id}</td>
              <td className="px-4 py-2.5 text-slate-900">{r.client}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">\${r.amount}.00</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <label htmlFor="pg-rows">Rows</label>
          <select
            id="pg-rows"
            value={size}
            onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}
            className="h-10 rounded-md border border-slate-300 bg-white px-2 text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            {[5, 10, 25].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <p className="tabular-nums" aria-live="polite">
          {start + 1}–{Math.min(start + size, INVOICES.length)} of {INVOICES.length}
        </p>
        <nav aria-label="Table pages" className="flex gap-1.5">
          <button type="button" aria-label="First page" disabled={page === 1} onClick={() => setPage(1)} className={btn}>«</button>
          <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)} className={btn}>‹</button>
          <button type="button" aria-label="Next page" disabled={page === pages} onClick={() => setPage(page + 1)} className={btn}>›</button>
          <button type="button" aria-label="Last page" disabled={page === pages} onClick={() => setPage(pages)} className={btn}>»</button>
        </nav>
      </div>
    </div>
  );
}`;

/* ---------- 6. Load more ---------- */
const POSTS = [
  "Choosing a font pair for a bakery menu",
  "Writing alt text that describes, not decorates",
  "How many photos a portfolio page needs",
  "Pricing pages for a two-person studio",
  "When a contact form should ask for a phone number",
  "Colour contrast on photographs",
  "Keeping a long services page readable",
  "Opening hours that search engines understand",
  "A checklist before you change your domain",
  "Booking buttons that people actually press",
  "What to put in a site footer",
  "Writing a short about page",
  "Menus with more than seven links",
  "Getting reviews onto your own site",
];

function LoadMore() {
  const step = 4;
  const [shown, setShown] = useState(4);
  const firstNew = useRef<HTMLAnchorElement | null>(null);
  const added = useRef(false);
  useEffect(() => {
    if (added.current) firstNew.current?.focus();
  }, [shown]);
  const more = () => {
    added.current = true;
    setShown((n) => Math.min(n + step, POSTS.length));
  };
  return (
    <div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {POSTS.slice(0, shown).map((t, i) => (
          <li key={t}>
            <a
              href="#"
              ref={i === shown - step && i > 0 ? firstNew : undefined}
              className="flex min-h-[56px] items-center rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-900 hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {t}
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-col items-center gap-2">
        <p className="text-sm tabular-nums text-stone-600" aria-live="polite">
          Showing {shown} of {POSTS.length} articles
        </p>
        {shown < POSTS.length ? (
          <button type="button" onClick={more} className="h-11 rounded-full bg-stone-900 px-6 text-sm font-semibold text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
            Load {Math.min(step, POSTS.length - shown)} more
          </button>
        ) : (
          <p className="text-sm font-medium text-stone-900">That is every article.</p>
        )}
      </div>
    </div>
  );
}

const LOADMORE_REACT = `import { useEffect, useRef, useState } from "react";

const POSTS = [
  "Choosing a font pair for a bakery menu",
  "Writing alt text that describes, not decorates",
  "How many photos a portfolio page needs",
  "Pricing pages for a two-person studio",
  "When a contact form should ask for a phone number",
  "Colour contrast on photographs",
  "Keeping a long services page readable",
  "Opening hours that search engines understand",
  "A checklist before you change your domain",
  "Booking buttons that people actually press",
  "What to put in a site footer",
  "Writing a short about page",
  "Menus with more than seven links",
  "Getting reviews onto your own site",
];

// After loading, focus moves to the first new article so keyboard and screen reader
// users continue where the new items start instead of being left on the button.
export function LoadMore() {
  const step = 4;
  const [shown, setShown] = useState(4);
  const firstNew = useRef<HTMLAnchorElement | null>(null);
  const added = useRef(false);
  useEffect(() => {
    if (added.current) firstNew.current?.focus();
  }, [shown]);
  const more = () => {
    added.current = true;
    setShown((n) => Math.min(n + step, POSTS.length));
  };
  return (
    <div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {POSTS.slice(0, shown).map((t, i) => (
          <li key={t}>
            <a
              href="#"
              ref={i === shown - step && i > 0 ? firstNew : undefined}
              className="flex min-h-[56px] items-center rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-900 hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {t}
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-col items-center gap-2">
        <p className="text-sm tabular-nums text-stone-600" aria-live="polite">
          Showing {shown} of {POSTS.length} articles
        </p>
        {shown < POSTS.length ? (
          <button type="button" onClick={more} className="h-11 rounded-full bg-stone-900 px-6 text-sm font-semibold text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
            Load {Math.min(step, POSTS.length - shown)} more
          </button>
        ) : (
          <p className="text-sm font-medium text-stone-900">That is every article.</p>
        )}
      </div>
    </div>
  );
}`;

/* ---------- 7. Infinite scroll with a sentinel ---------- */
const ORDERS = Array.from({ length: 36 }, (_, i) => ({
  n: 5120 - i,
  who: ["M. Okafor", "L. Brandt", "R. Iyer", "S. Novak", "T. Hale", "J. Moreau"][i % 6],
  total: 24 + ((i * 53) % 210),
}));

function InfiniteList() {
  const batch = 8;
  const [count, setCount] = useState(batch);
  const [loading, setLoading] = useState(false);
  const frame = useRef<HTMLDivElement | null>(null);
  const sentinel = useRef<HTMLLIElement | null>(null);
  const done = count >= ORDERS.length;

  useEffect(() => {
    const root = frame.current;
    const target = sentinel.current;
    if (!root || !target || done || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setLoading(true);
          timer = setTimeout(() => {
            setCount((c) => Math.min(c + batch, ORDERS.length));
            setLoading(false);
          }, 650);
        }
      },
      { root, rootMargin: "0px 0px 120px 0px" }
    );
    io.observe(target);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [count, loading, done]);

  return (
    <div ref={frame} className="relative h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white" tabIndex={0} aria-label="Recent orders, loads more as you scroll">
      <ul aria-busy={loading} className="divide-y divide-slate-100">
        {ORDERS.slice(0, count).map((o) => (
          <li key={o.n} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-mono text-xs text-slate-600">#{o.n}</span>
            <span className="flex-1 px-4 text-slate-900">{o.who}</span>
            <span className="tabular-nums text-slate-900">${o.total}.00</span>
          </li>
        ))}
        <li ref={sentinel} className="flex h-14 items-center justify-center text-sm text-slate-600">
          {done ? (
            "All 36 orders loaded"
          ) : loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 motion-reduce:animate-none" aria-hidden="true" />
              Loading more orders
            </span>
          ) : (
            <button type="button" onClick={() => setCount((c) => Math.min(c + batch, ORDERS.length))} className="h-10 rounded-md px-3 font-medium text-slate-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              Load more orders
            </button>
          )}
        </li>
      </ul>
    </div>
  );
}

const INFINITE_REACT = `import { useEffect, useRef, useState } from "react";

const ORDERS = Array.from({ length: 36 }, (_, i) => ({
  n: 5120 - i,
  who: ["M. Okafor", "L. Brandt", "R. Iyer", "S. Novak", "T. Hale", "J. Moreau"][i % 6],
  total: 24 + ((i * 53) % 210),
}));

// A sentinel row at the end of the list is watched with IntersectionObserver. When it comes
// within 120px of view, the next batch loads. The observer's root is the scrolling box here;
// set root to null to watch the whole window instead. The sentinel also holds a real button,
// so keyboard users and anyone whose observer never fires can still load more.
export function InfiniteList() {
  const batch = 8;
  const [count, setCount] = useState(batch);
  const [loading, setLoading] = useState(false);
  const frame = useRef<HTMLDivElement | null>(null);
  const sentinel = useRef<HTMLLIElement | null>(null);
  const done = count >= ORDERS.length;

  useEffect(() => {
    const root = frame.current;
    const target = sentinel.current;
    if (!root || !target || done || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setLoading(true);
          // Replace this timeout with your request for the next page.
          timer = setTimeout(() => {
            setCount((c) => Math.min(c + batch, ORDERS.length));
            setLoading(false);
          }, 650);
        }
      },
      { root, rootMargin: "0px 0px 120px 0px" }
    );
    io.observe(target);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [count, loading, done]);

  return (
    <div ref={frame} className="relative h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white" tabIndex={0} aria-label="Recent orders, loads more as you scroll">
      <ul aria-busy={loading} className="divide-y divide-slate-100">
        {ORDERS.slice(0, count).map((o) => (
          <li key={o.n} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-mono text-xs text-slate-600">#{o.n}</span>
            <span className="flex-1 px-4 text-slate-900">{o.who}</span>
            <span className="tabular-nums text-slate-900">\${o.total}.00</span>
          </li>
        ))}
        <li ref={sentinel} className="flex h-14 items-center justify-center text-sm text-slate-600">
          {done ? (
            "All 36 orders loaded"
          ) : loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 motion-reduce:animate-none" aria-hidden="true" />
              Loading more orders
            </span>
          ) : (
            <button type="button" onClick={() => setCount((c) => Math.min(c + batch, ORDERS.length))} className="h-10 rounded-md px-3 font-medium text-slate-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              Load more orders
            </button>
          )}
        </li>
      </ul>
    </div>
  );
}`;

/* ---------- 8. URL ?page sync ---------- */
function UrlSynced() {
  const total = 9;
  const [page, setPageState] = useState(3);
  const [history, setHistory] = useState<number[]>([3]);
  const go = (p: number) => {
    if (p === page) return;
    setPageState(p);
    setHistory((h) => [...h, p]);
  };
  const back = () => {
    if (history.length < 2) return;
    const h = history.slice(0, -1);
    setHistory(h);
    setPageState(h[h.length - 1]);
  };
  return (
    <div className="overflow-hidden rounded-xl border border-stone-300 bg-white">
      <div className="flex items-center gap-2 border-b border-stone-200 bg-stone-100 px-2 py-1.5">
        <button type="button" onClick={back} disabled={history.length < 2} aria-label="Browser back" className="grid h-10 w-10 place-items-center rounded-md text-stone-700 hover:bg-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-40">
          <Chevron dir="left" />
        </button>
        <p className="min-w-0 flex-1 truncate rounded-md bg-white px-3 py-1.5 font-mono text-xs text-stone-700" aria-live="polite">
          <span className="sr-only">Address: </span>
          shop.example/prints?page=<strong className="font-semibold text-blue-700">{page}</strong>
        </p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2" aria-hidden="true">
          {range(1, 6).map((k) => (
            <div key={k} className="aspect-[4/3] rounded-md bg-gradient-to-br from-stone-200 to-stone-300" style={{ filter: `hue-rotate(${(page * 37 + k * 11) % 60}deg)` }} />
          ))}
        </div>
        <nav aria-label="Print pages" className="mt-4">
          <ul className="flex flex-wrap justify-center gap-1">
            {range(1, total).map((n) => (
              <li key={n}>
                <a
                  href={"?page=" + n}
                  onClick={(e) => {
                    e.preventDefault();
                    go(n);
                  }}
                  aria-current={n === page ? "page" : undefined}
                  className={
                    "grid h-10 w-10 place-items-center rounded-full text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 " +
                    (n === page ? "bg-blue-700 text-white" : "text-stone-700 hover:bg-stone-100")
                  }
                >
                  {n}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

const URL_REACT = `import { useEffect, useState } from "react";

// Keeps the page number in the address bar (?page=3), so a refresh, a shared link
// and the browser's back button all land on the same page. Next.js and React Router
// users can swap the body for useSearchParams; the idea is the same.
function readPage(total: number) {
  const n = Number(new URLSearchParams(window.location.search).get("page"));
  return Number.isInteger(n) && n >= 1 && n <= total ? n : 1;
}

export function useUrlPage(total: number) {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(readPage(total));
    const onPop = () => setPage(readPage(total));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [total]);
  const go = (p: number) => {
    if (p === page) return;
    const url = new URL(window.location.href);
    if (p === 1) url.searchParams.delete("page");
    else url.searchParams.set("page", String(p));
    window.history.pushState(null, "", url);
    setPage(p);
  };
  return [page, go] as const;
}

export function UrlSyncedPagination() {
  const total = 9;
  const [page, go] = useUrlPage(total);
  return (
    <nav aria-label="Print pages">
      <ul className="flex flex-wrap justify-center gap-1">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <a
              href={"?page=" + n}
              onClick={(e) => { e.preventDefault(); go(n); }}
              aria-current={n === page ? "page" : undefined}
              className={
                "grid h-10 w-10 place-items-center rounded-full text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 " +
                (n === page ? "bg-blue-700 text-white" : "text-stone-700 hover:bg-stone-100")
              }
            >
              {n}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}`;

/* ---------- 9. usePagination playground ---------- */
function HookPlayground() {
  const [total, setTotal] = useState(30);
  const [current, setCurrent] = useState(12);
  const [siblings, setSiblings] = useState(1);
  const cur = Math.min(current, total);
  const items = pageItems(cur, total, siblings);
  const field = "w-full accent-slate-900";
  return (
    <div className="grid gap-5 sm:grid-cols-[1fr_1.3fr]">
      <div className="space-y-3 text-sm text-slate-700">
        <div>
          <label htmlFor="pg-total" className="flex justify-between"><span>Total pages</span><span className="font-mono tabular-nums">{total}</span></label>
          <input id="pg-total" type="range" min={1} max={60} value={total} onChange={(e) => setTotal(Number(e.target.value))} className={field} />
        </div>
        <div>
          <label htmlFor="pg-cur" className="flex justify-between"><span>Current page</span><span className="font-mono tabular-nums">{cur}</span></label>
          <input id="pg-cur" type="range" min={1} max={total} value={cur} onChange={(e) => setCurrent(Number(e.target.value))} className={field} />
        </div>
        <div>
          <label htmlFor="pg-sib" className="flex justify-between"><span>Siblings each side</span><span className="font-mono tabular-nums">{siblings}</span></label>
          <input id="pg-sib" type="range" min={0} max={3} value={siblings} onChange={(e) => setSiblings(Number(e.target.value))} className={field} />
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-600">pageItems({cur}, {total}, {siblings})</p>
        <output htmlFor="pg-total pg-cur pg-sib" className="mt-2 block break-words rounded-lg bg-slate-900 p-3 font-mono text-xs leading-relaxed text-emerald-200">
          [{items.map((x) => (x === "gap" ? '"gap"' : x)).join(", ")}]
        </output>
        <div className="mt-3 flex flex-wrap gap-1" aria-hidden="true">
          {items.map((x, i) => (
            <span key={i} className={"grid h-8 min-w-[2rem] place-items-center rounded-md px-1.5 text-xs tabular-nums " + (x === cur ? "bg-slate-900 text-white" : x === "gap" ? "text-slate-500" : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200")}>
              {x === "gap" ? "…" : x}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- catalogue ---------- */
const ITEMS: Item[] = [
  { f: "numbered", name: "Numbered with ellipsis", note: "First, last and one page either side. Labels collapse to arrows on phones.", Demo: () => <NumberedPagination />, code: { react: NUMBERED_REACT, html: numberedHtml(7, 20) } },
  { f: "numbered", name: "Segmented with first and last", note: "Joined cells for search results and long archives.", Demo: SegmentedPagination, code: { react: SEGMENTED_REACT } },
  { f: "numbered", name: "Table footer with rows per page", note: "Range text, page size select and four jump buttons.", Demo: TableFooterPagination, code: { react: TABLE_REACT }, wide: true },
  { f: "simple", name: "Previous and next only", note: "Blog archives and changelogs where page numbers mean little.", Demo: PrevNextPagination, code: { react: PREVNEXT_REACT, html: PREVNEXT_HTML } },
  { f: "simple", name: "Mobile compact with page select", note: "Two thumb-size arrows and a native select. Fits 320px.", Demo: CompactPagination, code: { react: COMPACT_REACT } },
  { f: "loading", name: "Load more button", note: "Adds items in place and moves focus to the first new one.", Demo: LoadMore, code: { react: LOADMORE_REACT } },
  { f: "loading", name: "Infinite scroll with a sentinel", note: "IntersectionObserver on a last row, with a button fallback.", Demo: InfiniteList, code: { react: INFINITE_REACT } },
  { f: "logic", name: "URL ?page sync", note: "Back button, refresh and shared links keep the page. Press a number, then the arrow.", Demo: UrlSynced, code: { react: URL_REACT } },
  { f: "logic", name: "usePagination hook", note: "Move the sliders to see what the hook returns for any page.", Demo: HookPlayground, code: { react: HOOK } },
];

const REF: [string, string, string][] = [
  ["Numbered", "Catalogues, search results, admin tables", "Each page has its own URL, so people can bookmark it and crawlers can reach every item through plain links."],
  ["Previous and next", "Blogs, changelogs, timelines", "Fine when position matters less than order. Show the current page number in text."],
  ["Load more", "Product grids, galleries, comment threads", "Keeps the footer reachable. Move focus to the first new item after loading."],
  ["Infinite scroll", "Feeds people browse without a goal", "Footer becomes hard to reach. Give each batch a URL if the items should be found in search."],
  ["Cursor based", "APIs and live data that change while you page", "Use Next and Previous only; page numbers drift when rows are added in between."],
];

const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f5f1]";

function Card({ item, n }: { item: Item; n: number }) {
  const langs = Object.keys(item.code) as Lang[];
  const [lang, setLang] = useState<Lang>(langs[0]);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const code = item.code[lang] ?? "";
  const id = `pg-code-${n}`;
  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(code);
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) setOpen(true);
    setCopied(ok);
    setMsg(ok ? `${item.name}, ${LANGS[lang]}, copied` : "Copy was blocked. The code is open below so you can select it.");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }
  const Demo = item.Demo;
  const tool = `inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${RING}`;
  return (
    <li className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(22,24,29,0.04)] ${item.wide || open ? "lg:col-span-2" : ""}`}>
      <div className="flex items-start gap-3 px-5 pt-4">
        <span className="mt-0.5 font-mono text-[11px] text-stone-500">{String(n).padStart(2, "0")}</span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#16181d]">{item.name}</h3>
          <p className="mt-0.5 text-[13px] leading-snug text-stone-600">{item.note}</p>
        </div>
      </div>
      <div className="flex flex-1 items-center px-5 py-6">
        <div className="w-full min-w-0">
          <Demo />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-stone-200 bg-stone-50/70 px-3 py-2">
        {langs.length > 1 && (
          <div role="group" aria-label={`Code version for ${item.name}`} className="flex rounded-lg bg-stone-200/70 p-0.5">
            {langs.map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={`h-9 rounded-md px-2.5 text-[12px] font-medium ${RING} ${lang === l ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}>
                {LANGS[l]}
              </button>
            ))}
          </div>
        )}
        {langs.length === 1 && <span className="px-1 text-[12px] font-medium text-stone-600">{LANGS[lang]}</span>}
        <span className="flex-1" />
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className={`${tool} text-stone-700 hover:bg-stone-200/70`}>
          {open ? "Hide code" : "Show code"}
        </button>
        <button type="button" onClick={copy} aria-label={`Copy ${LANGS[lang]} code for ${item.name}`} className={`${tool} ${copied ? "bg-emerald-700 text-white" : "bg-[#16181d] text-white hover:bg-stone-700"}`}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {msg}
      </p>
      {open && (
        <pre id={id} tabIndex={0} aria-label={`${item.name} code`} className={`max-h-96 overflow-auto border-t border-stone-800 bg-[#111318] p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200 ${RING}`}>
          <code>{code}</code>
        </pre>
      )}
    </li>
  );
}

const FAM_KEYS = Object.keys(FAMILIES) as Fam[];

export default function PaginationCollection() {
  const [fam, setFam] = useState<Fam | "all">("all");
  const list = ITEMS.map((it, i) => ({ it, n: i + 1 })).filter(({ it }) => fam === "all" || it.f === fam);
  const chip = `inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors ${RING}`;
  return (
    <section className="bg-[#f6f5f1] px-4 py-12 text-[#16181d] sm:px-8 sm:py-14" style={{ fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">React · Tailwind · HTML</p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">Pagination components</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone-600">
              Nine working patterns, from numbered pages to infinite scroll, all driven by one small hook. Click through any of them, then copy the React source or the server-rendered HTML.
            </p>
          </div>
          <dl className="flex gap-8 font-mono text-[12px] text-stone-600">
            <div>
              <dt className="uppercase tracking-[0.14em]">Patterns</dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#16181d]">{ITEMS.length}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.14em]">Libraries</dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#16181d]">None</dd>
            </div>
          </dl>
        </header>

        <div className="mt-8 flex flex-wrap gap-1.5 border-y border-stone-300/70 py-4" role="group" aria-label="Filter by kind of pagination">
          {(["all", ...FAM_KEYS] as const).map((f) => {
            const on = fam === f;
            const count = f === "all" ? ITEMS.length : ITEMS.filter((it) => it.f === f).length;
            return (
              <button key={f} type="button" aria-pressed={on} onClick={() => setFam(f)} className={`${chip} ${on ? "bg-[#16181d] text-white" : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"}`}>
                {f === "all" ? "All" : FAMILIES[f]}
                <span className={`font-mono text-[11px] ${on ? "opacity-70" : "text-stone-500"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 h-[1120px] overflow-y-auto overscroll-contain rounded-2xl pr-1" tabIndex={0} aria-label="Pagination examples and reference">
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {list.map(({ it, n }) => (
              <Card key={n} item={it} n={n} />
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h3 className="text-lg font-semibold tracking-tight">Which pattern to use</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-600">
                    <th scope="col" className="py-2 pr-4 font-medium">Pattern</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Good for</th>
                    <th scope="col" className="py-2 font-medium">What to watch</th>
                  </tr>
                </thead>
                <tbody>
                  {REF.map(([a, b, c]) => (
                    <tr key={a} className="border-b border-stone-100 align-top">
                      <th scope="row" className="py-2.5 pr-4 font-semibold">{a}</th>
                      <td className="py-2.5 pr-4 text-stone-700">{b}</td>
                      <td className="py-2.5 text-stone-700">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-5 grid gap-3 text-[13px] leading-relaxed text-stone-700 sm:grid-cols-3">
              <li><strong className="text-stone-900">Landmark.</strong> Wrap the control in a nav element with its own aria-label, such as "Pagination", so it is distinct from the main menu.</li>
              <li><strong className="text-stone-900">Current page.</strong> Mark it with aria-current="page" and do not rely on colour alone; the filled background is a second cue.</li>
              <li><strong className="text-stone-900">Ellipsis.</strong> The gap is hidden from screen readers with aria-hidden, since the page labels already say where you are.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
