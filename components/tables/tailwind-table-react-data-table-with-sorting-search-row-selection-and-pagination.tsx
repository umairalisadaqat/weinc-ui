import { useEffect, useMemo, useRef, useState } from "react";

// Demo data (made up). Replace with your own rows; keep the same keys or update COLUMNS.
type Status = "Paid" | "Pending" | "Overdue" | "Refunded";
type Row = { id: string; customer: string; email: string; plan: string; amount: number; status: Status; date: string };

const ROWS: Row[] = [
  { id: "INV-1042", customer: "Marta Okafor", email: "marta@northfield.example", plan: "Studio", amount: 240, status: "Paid", date: "2026-10-02" },
  { id: "INV-1041", customer: "Callum Reyes", email: "callum@tidewater.example", plan: "Starter", amount: 49, status: "Pending", date: "2026-10-01" },
  { id: "INV-1040", customer: "Ines Lindqvist", email: "ines@birchandco.example", plan: "Team", amount: 590, status: "Overdue", date: "2026-09-28" },
  { id: "INV-1039", customer: "Dev Raman", email: "dev@quarrylane.example", plan: "Studio", amount: 240, status: "Paid", date: "2026-09-27" },
  { id: "INV-1038", customer: "Hana Kowalski", email: "hana@pinecrest.example", plan: "Starter", amount: 49, status: "Refunded", date: "2026-09-25" },
  { id: "INV-1037", customer: "Tomasz Ellery", email: "tomasz@saltmarsh.example", plan: "Team", amount: 590, status: "Paid", date: "2026-09-22" },
  { id: "INV-1036", customer: "Priya Achebe", email: "priya@foundry.example", plan: "Studio", amount: 240, status: "Pending", date: "2026-09-20" },
  { id: "INV-1035", customer: "Oscar Muller", email: "oscar@lowmoor.example", plan: "Starter", amount: 49, status: "Paid", date: "2026-09-18" },
  { id: "INV-1034", customer: "Yara Benedetti", email: "yara@ashgrove.example", plan: "Team", amount: 590, status: "Overdue", date: "2026-09-15" },
  { id: "INV-1033", customer: "Felix Adeyemi", email: "felix@kestrel.example", plan: "Studio", amount: 240, status: "Paid", date: "2026-09-12" },
  { id: "INV-1032", customer: "Lena Hartmann", email: "lena@riverbend.example", plan: "Starter", amount: 49, status: "Paid", date: "2026-09-10" },
  { id: "INV-1031", customer: "Samir Castillo", email: "samir@oldmill.example", plan: "Team", amount: 590, status: "Pending", date: "2026-09-07" },
];

type Key = "customer" | "plan" | "amount" | "status" | "date";
const COLUMNS: { key: Key; label: string; align?: "right" }[] = [
  { key: "customer", label: "Customer" },
  { key: "plan", label: "Plan" },
  { key: "status", label: "Status" },
  { key: "date", label: "Issued" },
  { key: "amount", label: "Amount", align: "right" },
];
const STATUSES: ("All" | Status)[] = ["All", "Paid", "Pending", "Overdue", "Refunded"];
const PAGE_SIZE = 6;

const BADGE: Record<Status, string> = {
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Pending: "bg-amber-50 text-amber-800 ring-amber-600/25",
  Overdue: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Refunded: "bg-slate-100 text-slate-700 ring-slate-500/20",
};
const DOT: Record<Status, string> = { Paid: "bg-emerald-500", Pending: "bg-amber-500", Overdue: "bg-rose-500", Refunded: "bg-slate-400" };

const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });
const day = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function Badge({ s }: { s: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE[s]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[s]}`} aria-hidden="true" />
      {s}
    </span>
  );
}

function Check({ checked, mixed, onChange, label }: { checked: boolean; mixed?: boolean; onChange: () => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!mixed && !checked; }, [mixed, checked]);
  return (
    <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={label}
      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2" />
  );
}

function SortIcon({ dir }: { dir: "asc" | "desc" | null }) {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
      <path d="M6 2 9 5H3z" className={dir === "asc" ? "fill-slate-900" : "fill-slate-300"} />
      <path d="M6 10 3 7h6z" className={dir === "desc" ? "fill-slate-900" : "fill-slate-300"} />
    </svg>
  );
}

export default function DataTable() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | Status>("All");
  const [sort, setSort] = useState<{ key: Key; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(["INV-1040"]));
  const [dense, setDense] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = ROWS.filter((r) =>
      (status === "All" || r.status === status) &&
      (!q || [r.customer, r.email, r.id, r.plan].some((v) => v.toLowerCase().includes(q))));
    const m = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = a[sort.key], y = b[sort.key];
      const d = (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * m;
      return d || b.date.localeCompare(a.date); // ties: newest first
    });
  }, [query, status, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  const allOnPage = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const someOnPage = visible.some((r) => selected.has(r.id));

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const togglePage = () => setSelected((s) => {
    const n = new Set(s);
    visible.forEach((r) => (allOnPage ? n.delete(r.id) : n.add(r.id)));
    return n;
  });
  const sortBy = (key: Key) => { setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" })); setPage(0); };
  const cell = dense ? "py-2" : "py-3.5";
  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500";

  return (
    <section className="min-h-[600px] bg-slate-50 px-4 py-10 font-[Inter,ui-sans-serif,system-ui] text-slate-900 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Invoices</h2>
            <p className="mt-1 text-sm text-slate-600">Demo data. {ROWS.length} invoices from the last 30 days.</p>
          </div>
          <div role="group" aria-label="Row density" className="inline-flex rounded-lg bg-slate-200/70 p-0.5 text-sm">
            {[false, true].map((d) => (
              <button key={String(d)} type="button" aria-pressed={dense === d} onClick={() => setDense(d)}
                className={`min-h-[40px] rounded-md px-3 font-medium transition-colors ${ring} ${dense === d ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                {d ? "Compact" : "Comfortable"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:w-72">
              <label htmlFor="dt-search" className="sr-only">Search invoices</label>
              <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-slate-400" aria-hidden="true">
                <path d="M8.5 3a5.5 5.5 0 0 1 4.38 8.83l3.64 3.65-1.06 1.06-3.65-3.64A5.5 5.5 0 1 1 8.5 3Zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
              </svg>
              <input id="dt-search" type="search" value={query} placeholder="Search name, email or invoice"
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
            </div>
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1" role="group" aria-label="Filter by status">
              {STATUSES.map((s) => (
                <button key={s} type="button" aria-pressed={status === s} onClick={() => { setStatus(s); setPage(0); }}
                  className={`h-10 shrink-0 rounded-lg px-3 text-sm font-medium transition-colors ${ring} ${status === s ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Selection bar */}
          <div aria-live="polite" className={`flex items-center justify-between gap-3 border-b px-4 text-sm transition-colors ${selected.size ? "border-sky-100 bg-sky-50 py-2" : "border-transparent py-0"}`}>
            {selected.size > 0 && (
              <>
                <span className="font-medium text-sky-900">{selected.size} selected</span>
                <div className="flex gap-1">
                  <button type="button" className={`min-h-[40px] rounded-md px-3 font-medium text-sky-900 hover:bg-sky-100 ${ring}`}>Send reminder</button>
                  <button type="button" onClick={() => setSelected(new Set())} className={`min-h-[40px] rounded-md px-3 text-slate-700 hover:bg-sky-100 ${ring}`}>Clear</button>
                </div>
              </>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-100">
                <svg viewBox="0 0 20 20" className="h-5 w-5 fill-slate-500" aria-hidden="true"><path d="M3 4h14v2H3zm2 5h10v2H5zm3 5h4v2H8z" /></svg>
              </div>
              <p className="mt-3 font-medium">No invoices match</p>
              <p className="mt-1 text-sm text-slate-600">Try another name or clear the filters.</p>
              <button type="button" onClick={() => { setQuery(""); setStatus("All"); }}
                className={`mt-4 h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-50 ${ring}`}>Clear filters</button>
            </div>
          ) : (
            <>
              {/* Desktop and tablet: real table with a sticky header */}
              <div className="hidden max-h-[420px] overflow-auto md:block">
                <table className="w-full border-separate border-spacing-0 text-sm">
                  <caption className="sr-only">Invoices, sorted by {sort.key} {sort.dir === "asc" ? "ascending" : "descending"}</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="sticky top-0 z-10 w-12 border-b border-slate-200 bg-slate-50/95 py-3 pl-4 text-left backdrop-blur">
                        <Check checked={allOnPage} mixed={someOnPage} onChange={togglePage} label="Select all rows on this page" />
                      </th>
                      {COLUMNS.map((c) => {
                        const active = sort.key === c.key;
                        return (
                          <th key={c.key} scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                            className={`sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 px-4 py-2 font-medium text-slate-600 backdrop-blur ${c.align === "right" ? "text-right" : "text-left"}`}>
                            <button type="button" onClick={() => sortBy(c.key)}
                              className={`-mx-1.5 inline-flex min-h-[32px] items-center gap-1.5 rounded px-1.5 hover:text-slate-900 ${ring} ${active ? "text-slate-900" : ""}`}>
                              {c.label}<SortIcon dir={active ? sort.dir : null} />
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => {
                      const on = selected.has(r.id);
                      return (
                        <tr key={r.id} className={`transition-colors ${on ? "bg-sky-50/70" : "hover:bg-slate-50"}`}>
                          <td className={`border-b border-slate-100 pl-4 ${cell}`}><Check checked={on} onChange={() => toggle(r.id)} label={`Select ${r.id}`} /></td>
                          <td className={`border-b border-slate-100 px-4 ${cell}`}>
                            <div className="font-medium text-slate-900">{r.customer}</div>
                            {!dense && <div className="text-xs text-slate-600">{r.email}</div>}
                          </td>
                          <td className={`border-b border-slate-100 px-4 text-slate-700 ${cell}`}>{r.plan}</td>
                          <td className={`border-b border-slate-100 px-4 ${cell}`}><Badge s={r.status} /></td>
                          <td className={`whitespace-nowrap border-b border-slate-100 px-4 text-slate-700 ${cell}`}>{day(r.date)}</td>
                          <td className={`border-b border-slate-100 px-4 text-right font-medium tabular-nums ${cell}`}>{money(r.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phone: each row becomes a card */}
              <div className="md:hidden">
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2 text-sm text-slate-600">
                  <Check checked={allOnPage} mixed={someOnPage} onChange={togglePage} label="Select all rows on this page" />
                  <label htmlFor="dt-sort" className="sr-only">Sort by</label>
                  <select id="dt-sort" value={`${sort.key}:${sort.dir}`}
                    onChange={(e) => { const [key, dir] = e.target.value.split(":"); setSort({ key: key as Key, dir: dir as "asc" | "desc" }); setPage(0); }}
                    className={`ml-auto h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 ${ring}`}>
                    <option value="date:desc">Newest first</option>
                    <option value="date:asc">Oldest first</option>
                    <option value="amount:desc">Amount, high to low</option>
                    <option value="amount:asc">Amount, low to high</option>
                    <option value="customer:asc">Customer A to Z</option>
                  </select>
                </div>
                <ul>
                  {visible.map((r) => {
                    const on = selected.has(r.id);
                    return (
                      <li key={r.id} className={`flex gap-3 border-b border-slate-100 px-4 ${dense ? "py-2.5" : "py-4"} ${on ? "bg-sky-50/70" : ""}`}>
                        <div className="pt-0.5"><Check checked={on} onChange={() => toggle(r.id)} label={`Select ${r.id}`} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="truncate font-medium">{r.customer}</span>
                            <span className="font-medium tabular-nums">{money(r.amount)}</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                            <Badge s={r.status} /><span>{r.plan}</span><span aria-hidden="true">·</span><span>{day(r.date)}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Pagination */}
              <nav aria-label="Pagination" className="flex border-t border-slate-200 items-center justify-between gap-3 px-4 py-3 text-sm">
                <p className="text-slate-600">
                  <span className="font-medium text-slate-900">{current * PAGE_SIZE + 1}</span>–<span className="font-medium text-slate-900">{current * PAGE_SIZE + visible.length}</span> of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)}
                    className={`h-10 rounded-lg border border-slate-300 px-3 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${ring}`}>Previous</button>
                  {Array.from({ length: pages }, (_, i) => (
                    <button key={i} type="button" onClick={() => setPage(i)} aria-current={i === current ? "page" : undefined} aria-label={`Page ${i + 1}`}
                      className={`hidden h-10 w-10 rounded-lg font-medium sm:block ${ring} ${i === current ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}>{i + 1}</button>
                  ))}
                  <button type="button" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}
                    className={`h-10 rounded-lg border border-slate-300 px-3 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${ring}`}>Next</button>
                </div>
              </nav>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
