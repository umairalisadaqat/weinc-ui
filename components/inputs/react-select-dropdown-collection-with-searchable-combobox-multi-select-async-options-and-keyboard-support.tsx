import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from "react";

/*
  Every piece below is written once: the function renders the live demo and the
  string next to it is that same source file, so the code you copy is the code you see.
*/

type Lang = "react" | "html";
type Piece = {
  id: string;
  name: string;
  blurb: string;
  group: string;
  Demo: () => ReactElement;
  react: string;
  html?: string;
  stage: string;
};

const r1Demo = (() => {
const STATUSES = [
  { label: "Backlog", dot: "bg-stone-400" },
  { label: "Planned", dot: "bg-sky-500" },
  { label: "In progress", dot: "bg-amber-500" },
  { label: "In review", dot: "bg-violet-500" },
  { label: "Done", dot: "bg-emerald-500" },
  { label: "Cancelled", dot: "bg-rose-500" },
];

// Select-only combobox from the WAI-ARIA Authoring Practices: focus stays on the
// combobox and aria-activedescendant points at the highlighted option.
function SelectOnlyCombobox() {
  const [value, setValue] = useState(2);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(2);
  const rootRef = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function choose(i: number) {
    setValue(i);
    setActive(i);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const last = STATUSES.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setActive(value);
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") setActive(Math.min(last, active + 1));
    else if (e.key === "ArrowUp") setActive(Math.max(0, active - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" || e.key === " ") choose(active);
    else if (e.key === "Escape") setOpen(false);
    else if (e.key === "Tab") return choose(active);
    else if (e.key.length === 1) {
      // Type-ahead: jump to the first option starting with the typed letters.
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const hit = STATUSES.findIndex((s) => s.label.toLowerCase().startsWith(typed.current.text));
      if (hit >= 0) setActive(hit);
    } else return;
    e.preventDefault();
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-[15rem]">
      <span id="status-label" className="block text-sm font-semibold text-slate-900">
        Status
      </span>
      <div
        role="combobox"
        tabIndex={0}
        aria-labelledby="status-label"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="status-listbox"
        aria-activedescendant={open ? `status-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : (setActive(value), setOpen(true)))}
        onKeyDown={onKeyDown}
        className="mt-2 flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:border-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
      >
        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUSES[value].dot}`} />
        <span className="flex-1">{STATUSES[value].label}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true" className={`h-4 w-4 fill-none stroke-slate-500 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8l4 4 4-4" />
        </svg>
      </div>
      {open && (
        <ul id="status-listbox" role="listbox" aria-labelledby="status-label" className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {STATUSES.map((s, i) => (
            <li
              key={s.label}
              id={`status-opt-${i}`}
              role="option"
              aria-selected={i === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
              onMouseEnter={() => setActive(i)}
              className={`flex h-10 cursor-pointer items-center gap-2 px-3 text-sm text-slate-800 ${i === active ? "bg-sky-50" : ""}`}
            >
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${s.dot}`} />
              <span className="flex-1">{s.label}</span>
              {i === value && (
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-sky-700" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 10.5l3.5 3.5L15 7" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
  return SelectOnlyCombobox;
})();
const r1React = "import { useEffect, useRef, useState, type KeyboardEvent } from \"react\";\n\nconst STATUSES = [\n  { label: \"Backlog\", dot: \"bg-stone-400\" },\n  { label: \"Planned\", dot: \"bg-sky-500\" },\n  { label: \"In progress\", dot: \"bg-amber-500\" },\n  { label: \"In review\", dot: \"bg-violet-500\" },\n  { label: \"Done\", dot: \"bg-emerald-500\" },\n  { label: \"Cancelled\", dot: \"bg-rose-500\" },\n];\n\n// Select-only combobox from the WAI-ARIA Authoring Practices: focus stays on the\n// combobox and aria-activedescendant points at the highlighted option.\nexport default function SelectOnlyCombobox() {\n  const [value, setValue] = useState(2);\n  const [open, setOpen] = useState(false);\n  const [active, setActive] = useState(2);\n  const rootRef = useRef<HTMLDivElement>(null);\n  const typed = useRef({ text: \"\", at: 0 });\n\n  useEffect(() => {\n    if (!open) return;\n    const close = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);\n    document.addEventListener(\"mousedown\", close);\n    return () => document.removeEventListener(\"mousedown\", close);\n  }, [open]);\n\n  function choose(i: number) {\n    setValue(i);\n    setActive(i);\n    setOpen(false);\n  }\n\n  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {\n    const last = STATUSES.length - 1;\n    if (!open) {\n      if ([\"ArrowDown\", \"ArrowUp\", \"Enter\", \" \"].includes(e.key)) {\n        e.preventDefault();\n        setActive(value);\n        setOpen(true);\n      }\n      return;\n    }\n    if (e.key === \"ArrowDown\") setActive(Math.min(last, active + 1));\n    else if (e.key === \"ArrowUp\") setActive(Math.max(0, active - 1));\n    else if (e.key === \"Home\") setActive(0);\n    else if (e.key === \"End\") setActive(last);\n    else if (e.key === \"Enter\" || e.key === \" \") choose(active);\n    else if (e.key === \"Escape\") setOpen(false);\n    else if (e.key === \"Tab\") return choose(active);\n    else if (e.key.length === 1) {\n      // Type-ahead: jump to the first option starting with the typed letters.\n      const now = Date.now();\n      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : \"\") + e.key.toLowerCase(), at: now };\n      const hit = STATUSES.findIndex((s) => s.label.toLowerCase().startsWith(typed.current.text));\n      if (hit >= 0) setActive(hit);\n    } else return;\n    e.preventDefault();\n  }\n\n  return (\n    <div ref={rootRef} className=\"relative w-full max-w-[15rem]\">\n      <span id=\"status-label\" className=\"block text-sm font-semibold text-slate-900\">\n        Status\n      </span>\n      <div\n        role=\"combobox\"\n        tabIndex={0}\n        aria-labelledby=\"status-label\"\n        aria-haspopup=\"listbox\"\n        aria-expanded={open}\n        aria-controls=\"status-listbox\"\n        aria-activedescendant={open ? `status-opt-${active}` : undefined}\n        onClick={() => (open ? setOpen(false) : (setActive(value), setOpen(true)))}\n        onKeyDown={onKeyDown}\n        className=\"mt-2 flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:border-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30\"\n      >\n        <span aria-hidden=\"true\" className={`h-2 w-2 rounded-full ${STATUSES[value].dot}`} />\n        <span className=\"flex-1\">{STATUSES[value].label}</span>\n        <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className={`h-4 w-4 fill-none stroke-slate-500 transition-transform ${open ? \"rotate-180\" : \"\"}`} strokeWidth={2} strokeLinecap=\"round\" strokeLinejoin=\"round\">\n          <path d=\"M6 8l4 4 4-4\" />\n        </svg>\n      </div>\n      {open && (\n        <ul id=\"status-listbox\" role=\"listbox\" aria-labelledby=\"status-label\" className=\"absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg\">\n          {STATUSES.map((s, i) => (\n            <li\n              key={s.label}\n              id={`status-opt-${i}`}\n              role=\"option\"\n              aria-selected={i === value}\n              onMouseDown={(e) => e.preventDefault()}\n              onClick={() => choose(i)}\n              onMouseEnter={() => setActive(i)}\n              className={`flex h-10 cursor-pointer items-center gap-2 px-3 text-sm text-slate-800 ${i === active ? \"bg-sky-50\" : \"\"}`}\n            >\n              <span aria-hidden=\"true\" className={`h-2 w-2 rounded-full ${s.dot}`} />\n              <span className=\"flex-1\">{s.label}</span>\n              {i === value && (\n                <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className=\"h-4 w-4 fill-none stroke-sky-700\" strokeWidth={2} strokeLinecap=\"round\" strokeLinejoin=\"round\">\n                  <path d=\"M5 10.5l3.5 3.5L15 7\" />\n                </svg>\n              )}\n            </li>\n          ))}\n        </ul>\n      )}\n    </div>\n  );\n}\n";

const r2Demo = (() => {
const PEOPLE = [
  { name: "Maya Lindqvist", role: "Design lead" },
  { name: "Marcus Oyelaran", role: "Backend" },
  { name: "Priya Raman", role: "Product" },
  { name: "Tomás Herrera", role: "Frontend" },
  { name: "Amara Osei", role: "Support" },
  { name: "Jonah Feld", role: "Data" },
  { name: "Lena Marsh", role: "Marketing" },
];

// Editable combobox with list autocomplete (WAI-ARIA Authoring Practices pattern).
function SearchableCombobox() {
  const [query, setQuery] = useState("ma");
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = PEOPLE.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    const close = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Keep the highlighted option visible inside the list without scrolling the page.
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-i="${active}"]`);
    if (!list || !el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
  }, [active]);

  function pick(name: string) {
    setSelected(name);
    setQuery(name);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (open) setActive(Math.min(results.length - 1, active + 1));
      else setOpen(true);
    } else if (e.key === "ArrowUp") {
      if (open) setActive(Math.max(0, active - 1));
    } else if (e.key === "Enter" && open && results[active]) pick(results[active].name);
    else if (e.key === "Escape") {
      if (open) setOpen(false);
      else setQuery("");
    } else return;
    e.preventDefault();
  }

  const bold = (name: string) => {
    const i = name.toLowerCase().indexOf(query.trim().toLowerCase());
    if (!query.trim() || i < 0) return name;
    const n = query.trim().length;
    return (
      <>
        {name.slice(0, i)}
        <strong className="font-semibold text-slate-950">{name.slice(i, i + n)}</strong>
        {name.slice(i + n)}
      </>
    );
  };

  return (
    <div ref={rootRef} className="relative w-full max-w-[16rem]">
      <label htmlFor="assignee" className="block text-sm font-semibold text-slate-900">
        Assign to
      </label>
      <div className="relative mt-2">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-slate-500" strokeWidth={2} strokeLinecap="round">
          <circle cx="9" cy="9" r="5.5" />
          <path d="M13 13l3.5 3.5" />
        </svg>
        <input
          id="assignee"
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="assignee-list"
          aria-activedescendant={open && results[active] ? `assignee-${active}` : undefined}
          value={query}
          placeholder="Search teammates"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/30 sm:text-sm"
        />
      </div>
      {open && (
        <ul ref={listRef} id="assignee-list" role="listbox" aria-label="Teammates" className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {results.map((p, i) => (
            <li
              key={p.name}
              id={`assignee-${i}`}
              data-i={i}
              role="option"
              aria-selected={p.name === selected}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(p.name)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-slate-700 ${i === active ? "bg-sky-50" : ""}`}
            >
              <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">
                {p.name.split(" ").map((w) => w[0]).join("")}
              </span>
              <span className="min-w-0">
                <span className="block truncate">{bold(p.name)}</span>
                <span className="block text-xs text-slate-500">{p.role}</span>
              </span>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-2 text-sm text-slate-600">No teammate matches "{query}"</li>}
        </ul>
      )}
    </div>
  );
}
  return SearchableCombobox;
})();
const r2React = "import { useEffect, useRef, useState, type KeyboardEvent } from \"react\";\n\nconst PEOPLE = [\n  { name: \"Maya Lindqvist\", role: \"Design lead\" },\n  { name: \"Marcus Oyelaran\", role: \"Backend\" },\n  { name: \"Priya Raman\", role: \"Product\" },\n  { name: \"Tomás Herrera\", role: \"Frontend\" },\n  { name: \"Amara Osei\", role: \"Support\" },\n  { name: \"Jonah Feld\", role: \"Data\" },\n  { name: \"Lena Marsh\", role: \"Marketing\" },\n];\n\n// Editable combobox with list autocomplete (WAI-ARIA Authoring Practices pattern).\nexport default function SearchableCombobox() {\n  const [query, setQuery] = useState(\"ma\");\n  const [selected, setSelected] = useState(\"\");\n  const [open, setOpen] = useState(true);\n  const [active, setActive] = useState(0);\n  const rootRef = useRef<HTMLDivElement>(null);\n  const listRef = useRef<HTMLUListElement>(null);\n\n  const results = PEOPLE.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));\n\n  useEffect(() => {\n    const close = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);\n    document.addEventListener(\"mousedown\", close);\n    return () => document.removeEventListener(\"mousedown\", close);\n  }, []);\n\n  // Keep the highlighted option visible inside the list without scrolling the page.\n  useEffect(() => {\n    const list = listRef.current;\n    const el = list?.querySelector<HTMLElement>(`[data-i=\"${active}\"]`);\n    if (!list || !el) return;\n    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;\n    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;\n  }, [active]);\n\n  function pick(name: string) {\n    setSelected(name);\n    setQuery(name);\n    setOpen(false);\n  }\n\n  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {\n    if (e.key === \"ArrowDown\") {\n      if (open) setActive(Math.min(results.length - 1, active + 1));\n      else setOpen(true);\n    } else if (e.key === \"ArrowUp\") {\n      if (open) setActive(Math.max(0, active - 1));\n    } else if (e.key === \"Enter\" && open && results[active]) pick(results[active].name);\n    else if (e.key === \"Escape\") {\n      if (open) setOpen(false);\n      else setQuery(\"\");\n    } else return;\n    e.preventDefault();\n  }\n\n  const bold = (name: string) => {\n    const i = name.toLowerCase().indexOf(query.trim().toLowerCase());\n    if (!query.trim() || i < 0) return name;\n    const n = query.trim().length;\n    return (\n      <>\n        {name.slice(0, i)}\n        <strong className=\"font-semibold text-slate-950\">{name.slice(i, i + n)}</strong>\n        {name.slice(i + n)}\n      </>\n    );\n  };\n\n  return (\n    <div ref={rootRef} className=\"relative w-full max-w-[16rem]\">\n      <label htmlFor=\"assignee\" className=\"block text-sm font-semibold text-slate-900\">\n        Assign to\n      </label>\n      <div className=\"relative mt-2\">\n        <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className=\"pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-slate-500\" strokeWidth={2} strokeLinecap=\"round\">\n          <circle cx=\"9\" cy=\"9\" r=\"5.5\" />\n          <path d=\"M13 13l3.5 3.5\" />\n        </svg>\n        <input\n          id=\"assignee\"\n          type=\"text\"\n          role=\"combobox\"\n          autoComplete=\"off\"\n          aria-autocomplete=\"list\"\n          aria-expanded={open}\n          aria-controls=\"assignee-list\"\n          aria-activedescendant={open && results[active] ? `assignee-${active}` : undefined}\n          value={query}\n          placeholder=\"Search teammates\"\n          onChange={(e) => {\n            setQuery(e.target.value);\n            setActive(0);\n            setOpen(true);\n          }}\n          onClick={() => setOpen(true)}\n          onKeyDown={onKeyDown}\n          className=\"h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/30 sm:text-sm\"\n        />\n      </div>\n      {open && (\n        <ul ref={listRef} id=\"assignee-list\" role=\"listbox\" aria-label=\"Teammates\" className=\"absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg\">\n          {results.map((p, i) => (\n            <li\n              key={p.name}\n              id={`assignee-${i}`}\n              data-i={i}\n              role=\"option\"\n              aria-selected={p.name === selected}\n              onMouseDown={(e) => e.preventDefault()}\n              onClick={() => pick(p.name)}\n              onMouseEnter={() => setActive(i)}\n              className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-slate-700 ${i === active ? \"bg-sky-50\" : \"\"}`}\n            >\n              <span aria-hidden=\"true\" className=\"grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700\">\n                {p.name.split(\" \").map((w) => w[0]).join(\"\")}\n              </span>\n              <span className=\"min-w-0\">\n                <span className=\"block truncate\">{bold(p.name)}</span>\n                <span className=\"block text-xs text-slate-500\">{p.role}</span>\n              </span>\n            </li>\n          ))}\n          {results.length === 0 && <li className=\"px-3 py-2 text-sm text-slate-600\">No teammate matches \"{query}\"</li>}\n        </ul>\n      )}\n    </div>\n  );\n}\n";

const r5Demo = (() => {
const CITIES = ["Lisbon, Portugal", "Lima, Peru", "Lille, France", "Lyon, France", "Leeds, United Kingdom", "Linz, Austria", "Ljubljana, Slovenia", "Lagos, Nigeria", "Oslo, Norway", "Osaka, Japan"];

// Stand-in for a network call. Replace the body with your own request and keep the abort signal.
function searchCities(q: string, signal: AbortSignal): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => resolve(CITIES.filter((c) => c.toLowerCase().startsWith(q.toLowerCase()))), 500);
    signal.addEventListener("abort", () => {
      clearTimeout(id);
      reject(new DOMException("aborted", "AbortError"));
    });
  });
}

function AsyncCombobox() {
  const [query, setQuery] = useState("li");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(0);

  // Debounce 250ms, cancel the previous request, then load.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      searchCities(query.trim(), ac.signal)
        .then((r) => {
          setResults(r);
          setActive(0);
          setLoading(false);
        })
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [query]);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") (open ? setActive(Math.min(results.length - 1, active + 1)) : setOpen(true));
    else if (e.key === "ArrowUp") setActive(Math.max(0, active - 1));
    else if (e.key === "Enter" && open && results[active]) {
      setQuery(results[active]);
      setOpen(false);
    } else if (e.key === "Escape") setOpen(false);
    else return;
    e.preventDefault();
  }

  const message = query.trim().length < 2 ? "Type at least 2 letters" : loading ? "Searching" : results.length ? `${results.length} cities found` : "No cities match";

  return (
    <div className="relative w-full max-w-[16rem]" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <label htmlFor="city" className="block text-sm font-semibold text-slate-900">
        Office city
      </label>
      <div className="relative mt-2">
        <input
          id="city"
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="city-list"
          aria-activedescendant={open && !loading && results[active] ? `city-${active}` : undefined}
          aria-describedby="city-status"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-9 text-base text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/30 sm:text-sm"
        />
        {loading && <span aria-hidden="true" className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600 motion-reduce:animate-none" />}
      </div>
      <p id="city-status" role="status" className="mt-1 text-xs text-slate-600">
        {message}
      </p>
      {open && !loading && results.length > 0 && (
        <ul id="city-list" role="listbox" aria-label="Cities" className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {results.map((c, i) => (
            <li
              key={c}
              id={`city-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery(c);
                setOpen(false);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex h-10 cursor-pointer items-center justify-between px-3 text-sm text-slate-800 ${i === active ? "bg-sky-50" : ""}`}
            >
              <span>{c.split(",")[0]}</span>
              <span className="text-xs text-slate-500">{c.split(", ")[1]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
  return AsyncCombobox;
})();
const r5React = "import { useEffect, useState, type KeyboardEvent } from \"react\";\n\nconst CITIES = [\"Lisbon, Portugal\", \"Lima, Peru\", \"Lille, France\", \"Lyon, France\", \"Leeds, United Kingdom\", \"Linz, Austria\", \"Ljubljana, Slovenia\", \"Lagos, Nigeria\", \"Oslo, Norway\", \"Osaka, Japan\"];\n\n// Stand-in for a network call. Replace the body with your own request and keep the abort signal.\nfunction searchCities(q: string, signal: AbortSignal): Promise<string[]> {\n  return new Promise((resolve, reject) => {\n    const id = setTimeout(() => resolve(CITIES.filter((c) => c.toLowerCase().startsWith(q.toLowerCase()))), 500);\n    signal.addEventListener(\"abort\", () => {\n      clearTimeout(id);\n      reject(new DOMException(\"aborted\", \"AbortError\"));\n    });\n  });\n}\n\nexport default function AsyncCombobox() {\n  const [query, setQuery] = useState(\"li\");\n  const [results, setResults] = useState<string[]>([]);\n  const [loading, setLoading] = useState(false);\n  const [open, setOpen] = useState(true);\n  const [active, setActive] = useState(0);\n\n  // Debounce 250ms, cancel the previous request, then load.\n  useEffect(() => {\n    if (query.trim().length < 2) {\n      setResults([]);\n      setLoading(false);\n      return;\n    }\n    const ac = new AbortController();\n    setLoading(true);\n    const t = setTimeout(() => {\n      searchCities(query.trim(), ac.signal)\n        .then((r) => {\n          setResults(r);\n          setActive(0);\n          setLoading(false);\n        })\n        .catch(() => {});\n    }, 250);\n    return () => {\n      clearTimeout(t);\n      ac.abort();\n    };\n  }, [query]);\n\n  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {\n    if (e.key === \"ArrowDown\") (open ? setActive(Math.min(results.length - 1, active + 1)) : setOpen(true));\n    else if (e.key === \"ArrowUp\") setActive(Math.max(0, active - 1));\n    else if (e.key === \"Enter\" && open && results[active]) {\n      setQuery(results[active]);\n      setOpen(false);\n    } else if (e.key === \"Escape\") setOpen(false);\n    else return;\n    e.preventDefault();\n  }\n\n  const message = query.trim().length < 2 ? \"Type at least 2 letters\" : loading ? \"Searching\" : results.length ? `${results.length} cities found` : \"No cities match\";\n\n  return (\n    <div className=\"relative w-full max-w-[16rem]\" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>\n      <label htmlFor=\"city\" className=\"block text-sm font-semibold text-slate-900\">\n        Office city\n      </label>\n      <div className=\"relative mt-2\">\n        <input\n          id=\"city\"\n          type=\"text\"\n          role=\"combobox\"\n          autoComplete=\"off\"\n          aria-autocomplete=\"list\"\n          aria-expanded={open}\n          aria-controls=\"city-list\"\n          aria-activedescendant={open && !loading && results[active] ? `city-${active}` : undefined}\n          aria-describedby=\"city-status\"\n          value={query}\n          onChange={(e) => {\n            setQuery(e.target.value);\n            setOpen(true);\n          }}\n          onFocus={() => setOpen(true)}\n          onKeyDown={onKeyDown}\n          className=\"h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-9 text-base text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/30 sm:text-sm\"\n        />\n        {loading && <span aria-hidden=\"true\" className=\"absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600 motion-reduce:animate-none\" />}\n      </div>\n      <p id=\"city-status\" role=\"status\" className=\"mt-1 text-xs text-slate-600\">\n        {message}\n      </p>\n      {open && !loading && results.length > 0 && (\n        <ul id=\"city-list\" role=\"listbox\" aria-label=\"Cities\" className=\"absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg\">\n          {results.map((c, i) => (\n            <li\n              key={c}\n              id={`city-${i}`}\n              role=\"option\"\n              aria-selected={i === active}\n              onMouseDown={(e) => e.preventDefault()}\n              onClick={() => {\n                setQuery(c);\n                setOpen(false);\n              }}\n              onMouseEnter={() => setActive(i)}\n              className={`flex h-10 cursor-pointer items-center justify-between px-3 text-sm text-slate-800 ${i === active ? \"bg-sky-50\" : \"\"}`}\n            >\n              <span>{c.split(\",\")[0]}</span>\n              <span className=\"text-xs text-slate-500\">{c.split(\", \")[1]}</span>\n            </li>\n          ))}\n        </ul>\n      )}\n    </div>\n  );\n}\n";

const r6Demo = (() => {
const GROUPS = [
  { label: "Americas", zones: [{ name: "Pacific Time", cities: "Vancouver, Los Angeles" }, { name: "Eastern Time", cities: "Toronto, New York" }, { name: "Brasília Time", cities: "São Paulo" }] },
  { label: "Europe", zones: [{ name: "Greenwich Mean Time", cities: "London, Dublin" }, { name: "Central European Time", cities: "Berlin, Madrid" }] },
  { label: "Asia Pacific", zones: [{ name: "India Standard Time", cities: "Mumbai, Bengaluru" }, { name: "Japan Standard Time", cities: "Tokyo" }, { name: "Australian Eastern Time", cities: "Sydney" }] },
];
const FLAT = GROUPS.flatMap((g) => g.zones);

// Grouped listbox: each group is role="group" labelled by its heading.
function GroupedSelect() {
  const [value, setValue] = useState(4);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(4);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-i="${active}"]`);
    if (!list || !el) return;
    if (el.offsetTop < list.scrollTop + 28) list.scrollTop = Math.max(0, el.offsetTop - 28);
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
  }, [active, open]);

  function choose(i: number) {
    setValue(i);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const last = FLAT.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setActive(value);
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") setActive(Math.min(last, active + 1));
    else if (e.key === "ArrowUp") setActive(Math.max(0, active - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" || e.key === " ") choose(active);
    else if (e.key === "Escape") setOpen(false);
    else if (e.key === "Tab") return setOpen(false);
    else return;
    e.preventDefault();
  }

  let n = -1;
  return (
    <div ref={rootRef} className="relative w-full max-w-[16rem]">
      <span id="tz-label" className="block text-sm font-semibold text-slate-900">
        Time zone
      </span>
      <div
        role="combobox"
        tabIndex={0}
        aria-labelledby="tz-label"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="tz-list"
        aria-activedescendant={open ? `tz-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : (setActive(value), setOpen(true)))}
        onKeyDown={onKeyDown}
        className="mt-2 flex h-12 cursor-pointer flex-col justify-center rounded-lg border border-slate-300 bg-white px-3 focus-visible:border-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
      >
        <span className="text-sm leading-tight text-slate-900">{FLAT[value].name}</span>
        <span className="text-xs leading-tight text-slate-500">{FLAT[value].cities}</span>
      </div>
      {open && (
        <div ref={listRef} id="tz-list" role="listbox" aria-labelledby="tz-label" className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white pb-1 shadow-lg">
          {GROUPS.map((g, gi) => (
            <ul key={g.label} role="group" aria-labelledby={`tz-g-${gi}`}>
              <li role="presentation" id={`tz-g-${gi}`} className="sticky top-0 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                {g.label}
              </li>
              {g.zones.map((z) => {
                n += 1;
                const i = n;
                return (
                  <li
                    key={z.name}
                    id={`tz-${i}`}
                    data-i={i}
                    role="option"
                    aria-selected={i === value}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(i)}
                    onMouseEnter={() => setActive(i)}
                    className={`cursor-pointer px-3 py-2 ${i === active ? "bg-sky-50" : ""}`}
                  >
                    <span className={`block text-sm ${i === value ? "font-semibold text-sky-900" : "text-slate-800"}`}>{z.name}</span>
                    <span className="block text-xs text-slate-500">{z.cities}</span>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      )}
    </div>
  );
}
  return GroupedSelect;
})();
const r6React = "import { useEffect, useRef, useState, type KeyboardEvent } from \"react\";\n\nconst GROUPS = [\n  { label: \"Americas\", zones: [{ name: \"Pacific Time\", cities: \"Vancouver, Los Angeles\" }, { name: \"Eastern Time\", cities: \"Toronto, New York\" }, { name: \"Brasília Time\", cities: \"São Paulo\" }] },\n  { label: \"Europe\", zones: [{ name: \"Greenwich Mean Time\", cities: \"London, Dublin\" }, { name: \"Central European Time\", cities: \"Berlin, Madrid\" }] },\n  { label: \"Asia Pacific\", zones: [{ name: \"India Standard Time\", cities: \"Mumbai, Bengaluru\" }, { name: \"Japan Standard Time\", cities: \"Tokyo\" }, { name: \"Australian Eastern Time\", cities: \"Sydney\" }] },\n];\nconst FLAT = GROUPS.flatMap((g) => g.zones);\n\n// Grouped listbox: each group is role=\"group\" labelled by its heading.\nexport default function GroupedSelect() {\n  const [value, setValue] = useState(4);\n  const [open, setOpen] = useState(false);\n  const [active, setActive] = useState(4);\n  const rootRef = useRef<HTMLDivElement>(null);\n  const listRef = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    if (!open) return;\n    const close = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);\n    document.addEventListener(\"mousedown\", close);\n    return () => document.removeEventListener(\"mousedown\", close);\n  }, [open]);\n\n  useEffect(() => {\n    const list = listRef.current;\n    const el = list?.querySelector<HTMLElement>(`[data-i=\"${active}\"]`);\n    if (!list || !el) return;\n    if (el.offsetTop < list.scrollTop + 28) list.scrollTop = Math.max(0, el.offsetTop - 28);\n    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;\n  }, [active, open]);\n\n  function choose(i: number) {\n    setValue(i);\n    setOpen(false);\n  }\n\n  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {\n    const last = FLAT.length - 1;\n    if (!open) {\n      if ([\"ArrowDown\", \"ArrowUp\", \"Enter\", \" \"].includes(e.key)) {\n        e.preventDefault();\n        setActive(value);\n        setOpen(true);\n      }\n      return;\n    }\n    if (e.key === \"ArrowDown\") setActive(Math.min(last, active + 1));\n    else if (e.key === \"ArrowUp\") setActive(Math.max(0, active - 1));\n    else if (e.key === \"Home\") setActive(0);\n    else if (e.key === \"End\") setActive(last);\n    else if (e.key === \"Enter\" || e.key === \" \") choose(active);\n    else if (e.key === \"Escape\") setOpen(false);\n    else if (e.key === \"Tab\") return setOpen(false);\n    else return;\n    e.preventDefault();\n  }\n\n  let n = -1;\n  return (\n    <div ref={rootRef} className=\"relative w-full max-w-[16rem]\">\n      <span id=\"tz-label\" className=\"block text-sm font-semibold text-slate-900\">\n        Time zone\n      </span>\n      <div\n        role=\"combobox\"\n        tabIndex={0}\n        aria-labelledby=\"tz-label\"\n        aria-haspopup=\"listbox\"\n        aria-expanded={open}\n        aria-controls=\"tz-list\"\n        aria-activedescendant={open ? `tz-${active}` : undefined}\n        onClick={() => (open ? setOpen(false) : (setActive(value), setOpen(true)))}\n        onKeyDown={onKeyDown}\n        className=\"mt-2 flex h-12 cursor-pointer flex-col justify-center rounded-lg border border-slate-300 bg-white px-3 focus-visible:border-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30\"\n      >\n        <span className=\"text-sm leading-tight text-slate-900\">{FLAT[value].name}</span>\n        <span className=\"text-xs leading-tight text-slate-500\">{FLAT[value].cities}</span>\n      </div>\n      {open && (\n        <div ref={listRef} id=\"tz-list\" role=\"listbox\" aria-labelledby=\"tz-label\" className=\"absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white pb-1 shadow-lg\">\n          {GROUPS.map((g, gi) => (\n            <ul key={g.label} role=\"group\" aria-labelledby={`tz-g-${gi}`}>\n              <li role=\"presentation\" id={`tz-g-${gi}`} className=\"sticky top-0 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600\">\n                {g.label}\n              </li>\n              {g.zones.map((z) => {\n                n += 1;\n                const i = n;\n                return (\n                  <li\n                    key={z.name}\n                    id={`tz-${i}`}\n                    data-i={i}\n                    role=\"option\"\n                    aria-selected={i === value}\n                    onMouseDown={(e) => e.preventDefault()}\n                    onClick={() => choose(i)}\n                    onMouseEnter={() => setActive(i)}\n                    className={`cursor-pointer px-3 py-2 ${i === active ? \"bg-sky-50\" : \"\"}`}\n                  >\n                    <span className={`block text-sm ${i === value ? \"font-semibold text-sky-900\" : \"text-slate-800\"}`}>{z.name}</span>\n                    <span className=\"block text-xs text-slate-500\">{z.cities}</span>\n                  </li>\n                );\n              })}\n            </ul>\n          ))}\n        </div>\n      )}\n    </div>\n  );\n}\n";

const r3Demo = (() => {
const TEAMS = ["Design", "Engineering", "Marketing", "Operations", "Sales", "Support"];

// Select-only combobox whose listbox allows several choices (aria-multiselectable).
function MultiSelectCheckmarks() {
  const [picked, setPicked] = useState<string[]>(["Design", "Marketing"]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = (t: string) => setPicked(picked.includes(t) ? picked.filter((p) => p !== t) : [...picked, t]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!open) {
      if (["ArrowDown", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") setActive(Math.min(TEAMS.length - 1, active + 1));
    else if (e.key === "ArrowUp") setActive(Math.max(0, active - 1));
    else if (e.key === "Enter" || e.key === " ") toggle(TEAMS[active]);
    else if (e.key === "Escape") setOpen(false);
    else if (e.key === "Tab") return setOpen(false);
    else return;
    e.preventDefault();
  }

  const summary = picked.length === 0 ? "Any team" : picked.length <= 2 ? picked.join(", ") : `${picked[0]}, ${picked[1]} +${picked.length - 2}`;

  return (
    <div ref={rootRef} className="relative w-full max-w-[16rem]">
      <div className="flex items-center justify-between">
        <span id="teams-label" className="text-sm font-semibold text-slate-900">
          Visible to teams
        </span>
        {picked.length > 0 && (
          <button type="button" onClick={() => setPicked([])} className="h-10 rounded-md px-2 text-xs font-medium text-sky-800 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
            Clear
          </button>
        )}
      </div>
      <div
        role="combobox"
        tabIndex={0}
        aria-labelledby="teams-label"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="teams-list"
        aria-activedescendant={open ? `team-${active}` : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={onKeyDown}
        className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:border-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30"
      >
        <span className="flex-1 truncate">{summary}</span>
        <span className="rounded bg-slate-100 px-1.5 text-xs tabular-nums text-slate-700">{picked.length}</span>
      </div>
      {open && (
        <ul id="teams-list" role="listbox" aria-multiselectable="true" aria-labelledby="teams-label" className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {TEAMS.map((t, i) => {
            const on = picked.includes(t);
            return (
              <li
                key={t}
                id={`team-${i}`}
                role="option"
                aria-selected={on}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => toggle(t)}
                onMouseEnter={() => setActive(i)}
                className={`flex h-10 cursor-pointer items-center gap-2.5 px-3 text-sm text-slate-800 ${i === active ? "bg-sky-50" : ""}`}
              >
                <span aria-hidden="true" className={`grid h-4 w-4 place-items-center rounded border ${on ? "border-sky-700 bg-sky-700" : "border-slate-400 bg-white"}`}>
                  {on && (
                    <svg viewBox="0 0 20 20" className="h-3 w-3 fill-none stroke-white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 10.5l3.5 3.5L15 7" />
                    </svg>
                  )}
                </span>
                {t}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
  return MultiSelectCheckmarks;
})();
const r3React = "import { useEffect, useRef, useState, type KeyboardEvent } from \"react\";\n\nconst TEAMS = [\"Design\", \"Engineering\", \"Marketing\", \"Operations\", \"Sales\", \"Support\"];\n\n// Select-only combobox whose listbox allows several choices (aria-multiselectable).\nexport default function MultiSelectCheckmarks() {\n  const [picked, setPicked] = useState<string[]>([\"Design\", \"Marketing\"]);\n  const [open, setOpen] = useState(false);\n  const [active, setActive] = useState(0);\n  const rootRef = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    if (!open) return;\n    const close = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);\n    document.addEventListener(\"mousedown\", close);\n    return () => document.removeEventListener(\"mousedown\", close);\n  }, [open]);\n\n  const toggle = (t: string) => setPicked(picked.includes(t) ? picked.filter((p) => p !== t) : [...picked, t]);\n\n  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {\n    if (!open) {\n      if ([\"ArrowDown\", \"Enter\", \" \"].includes(e.key)) {\n        e.preventDefault();\n        setOpen(true);\n      }\n      return;\n    }\n    if (e.key === \"ArrowDown\") setActive(Math.min(TEAMS.length - 1, active + 1));\n    else if (e.key === \"ArrowUp\") setActive(Math.max(0, active - 1));\n    else if (e.key === \"Enter\" || e.key === \" \") toggle(TEAMS[active]);\n    else if (e.key === \"Escape\") setOpen(false);\n    else if (e.key === \"Tab\") return setOpen(false);\n    else return;\n    e.preventDefault();\n  }\n\n  const summary = picked.length === 0 ? \"Any team\" : picked.length <= 2 ? picked.join(\", \") : `${picked[0]}, ${picked[1]} +${picked.length - 2}`;\n\n  return (\n    <div ref={rootRef} className=\"relative w-full max-w-[16rem]\">\n      <div className=\"flex items-center justify-between\">\n        <span id=\"teams-label\" className=\"text-sm font-semibold text-slate-900\">\n          Visible to teams\n        </span>\n        {picked.length > 0 && (\n          <button type=\"button\" onClick={() => setPicked([])} className=\"h-10 rounded-md px-2 text-xs font-medium text-sky-800 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600\">\n            Clear\n          </button>\n        )}\n      </div>\n      <div\n        role=\"combobox\"\n        tabIndex={0}\n        aria-labelledby=\"teams-label\"\n        aria-haspopup=\"listbox\"\n        aria-expanded={open}\n        aria-controls=\"teams-list\"\n        aria-activedescendant={open ? `team-${active}` : undefined}\n        onClick={() => setOpen(!open)}\n        onKeyDown={onKeyDown}\n        className=\"flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:border-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30\"\n      >\n        <span className=\"flex-1 truncate\">{summary}</span>\n        <span className=\"rounded bg-slate-100 px-1.5 text-xs tabular-nums text-slate-700\">{picked.length}</span>\n      </div>\n      {open && (\n        <ul id=\"teams-list\" role=\"listbox\" aria-multiselectable=\"true\" aria-labelledby=\"teams-label\" className=\"absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg\">\n          {TEAMS.map((t, i) => {\n            const on = picked.includes(t);\n            return (\n              <li\n                key={t}\n                id={`team-${i}`}\n                role=\"option\"\n                aria-selected={on}\n                onMouseDown={(e) => e.preventDefault()}\n                onClick={() => toggle(t)}\n                onMouseEnter={() => setActive(i)}\n                className={`flex h-10 cursor-pointer items-center gap-2.5 px-3 text-sm text-slate-800 ${i === active ? \"bg-sky-50\" : \"\"}`}\n              >\n                <span aria-hidden=\"true\" className={`grid h-4 w-4 place-items-center rounded border ${on ? \"border-sky-700 bg-sky-700\" : \"border-slate-400 bg-white\"}`}>\n                  {on && (\n                    <svg viewBox=\"0 0 20 20\" className=\"h-3 w-3 fill-none stroke-white\" strokeWidth={3} strokeLinecap=\"round\" strokeLinejoin=\"round\">\n                      <path d=\"M5 10.5l3.5 3.5L15 7\" />\n                    </svg>\n                  )}\n                </span>\n                {t}\n              </li>\n            );\n          })}\n        </ul>\n      )}\n    </div>\n  );\n}\n";

const r4Demo = (() => {
const TOOLS = ["Figma", "Framer", "Notion", "Linear", "GitHub", "Slack", "Webflow", "Airtable", "Miro"];

// Multi-select with chips and a search box. Only known options can be added.
function TagMultiSelect() {
  const [tags, setTags] = useState<string[]>(["Figma", "Notion"]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const options = TOOLS.filter((t) => !tags.includes(t) && t.toLowerCase().includes(query.toLowerCase()));

  function add(t: string) {
    setTags([...tags, t]);
    setQuery("");
    setActive(0);
    inputRef.current?.focus();
  }

  function remove(t: string) {
    setTags(tags.filter((x) => x !== t));
    inputRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      setOpen(true);
      setActive(Math.min(options.length - 1, active + 1));
    } else if (e.key === "ArrowUp") setActive(Math.max(0, active - 1));
    else if (e.key === "Enter" && open && options[active]) add(options[active]);
    else if (e.key === "Escape") setOpen(false);
    else if (e.key === "Backspace" && !query && tags.length) return setTags(tags.slice(0, -1));
    else return;
    e.preventDefault();
  }

  return (
    <div className="relative w-full max-w-[17rem]" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <label htmlFor="tools-input" className="block text-sm font-semibold text-slate-900">
        Tools you use
      </label>
      <div className="mt-2 flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white p-1.5 focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-600/30">
        <ul aria-label="Selected tools" className="contents">
          {tags.map((t) => (
            <li key={t} className="flex h-8 items-center gap-1 rounded-md bg-sky-50 pl-2 text-sm text-sky-900 ring-1 ring-inset ring-sky-200">
              {t}
              <button type="button" aria-label={`Remove ${t}`} onClick={() => remove(t)} className="grid h-8 w-7 place-items-center rounded-md text-sky-800 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3 w-3 fill-none stroke-current" strokeWidth={2.4} strokeLinecap="round">
                  <path d="M6 6l8 8M14 6l-8 8" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        <input
          ref={inputRef}
          id="tools-input"
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="tools-list"
          aria-activedescendant={open && options[active] ? `tool-${active}` : undefined}
          value={query}
          placeholder={tags.length ? "Add more" : "Search tools"}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-8 min-w-[6rem] flex-1 bg-transparent px-1 text-base text-slate-900 outline-none placeholder:text-slate-500 sm:text-sm"
        />
      </div>
      {open && (
        <ul id="tools-list" role="listbox" aria-label="Tools" className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((t, i) => (
            <li
              key={t}
              id={`tool-${i}`}
              role="option"
              aria-selected={false}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(t)}
              onMouseEnter={() => setActive(i)}
              className={`flex h-10 cursor-pointer items-center px-3 text-sm text-slate-800 ${i === active ? "bg-sky-50" : ""}`}
            >
              {t}
            </li>
          ))}
          {options.length === 0 && <li className="px-3 py-2 text-sm text-slate-600">Nothing left to add</li>}
        </ul>
      )}
      <p className="mt-2 text-xs text-slate-600">Backspace in the empty box removes the last tool.</p>
    </div>
  );
}
  return TagMultiSelect;
})();
const r4React = "import { useRef, useState, type KeyboardEvent } from \"react\";\n\nconst TOOLS = [\"Figma\", \"Framer\", \"Notion\", \"Linear\", \"GitHub\", \"Slack\", \"Webflow\", \"Airtable\", \"Miro\"];\n\n// Multi-select with chips and a search box. Only known options can be added.\nexport default function TagMultiSelect() {\n  const [tags, setTags] = useState<string[]>([\"Figma\", \"Notion\"]);\n  const [query, setQuery] = useState(\"\");\n  const [open, setOpen] = useState(false);\n  const [active, setActive] = useState(0);\n  const inputRef = useRef<HTMLInputElement>(null);\n\n  const options = TOOLS.filter((t) => !tags.includes(t) && t.toLowerCase().includes(query.toLowerCase()));\n\n  function add(t: string) {\n    setTags([...tags, t]);\n    setQuery(\"\");\n    setActive(0);\n    inputRef.current?.focus();\n  }\n\n  function remove(t: string) {\n    setTags(tags.filter((x) => x !== t));\n    inputRef.current?.focus();\n  }\n\n  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {\n    if (e.key === \"ArrowDown\") {\n      setOpen(true);\n      setActive(Math.min(options.length - 1, active + 1));\n    } else if (e.key === \"ArrowUp\") setActive(Math.max(0, active - 1));\n    else if (e.key === \"Enter\" && open && options[active]) add(options[active]);\n    else if (e.key === \"Escape\") setOpen(false);\n    else if (e.key === \"Backspace\" && !query && tags.length) return setTags(tags.slice(0, -1));\n    else return;\n    e.preventDefault();\n  }\n\n  return (\n    <div className=\"relative w-full max-w-[17rem]\" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>\n      <label htmlFor=\"tools-input\" className=\"block text-sm font-semibold text-slate-900\">\n        Tools you use\n      </label>\n      <div className=\"mt-2 flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white p-1.5 focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-600/30\">\n        <ul aria-label=\"Selected tools\" className=\"contents\">\n          {tags.map((t) => (\n            <li key={t} className=\"flex h-8 items-center gap-1 rounded-md bg-sky-50 pl-2 text-sm text-sky-900 ring-1 ring-inset ring-sky-200\">\n              {t}\n              <button type=\"button\" aria-label={`Remove ${t}`} onClick={() => remove(t)} className=\"grid h-8 w-7 place-items-center rounded-md text-sky-800 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600\">\n                <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className=\"h-3 w-3 fill-none stroke-current\" strokeWidth={2.4} strokeLinecap=\"round\">\n                  <path d=\"M6 6l8 8M14 6l-8 8\" />\n                </svg>\n              </button>\n            </li>\n          ))}\n        </ul>\n        <input\n          ref={inputRef}\n          id=\"tools-input\"\n          type=\"text\"\n          role=\"combobox\"\n          autoComplete=\"off\"\n          aria-autocomplete=\"list\"\n          aria-expanded={open}\n          aria-controls=\"tools-list\"\n          aria-activedescendant={open && options[active] ? `tool-${active}` : undefined}\n          value={query}\n          placeholder={tags.length ? \"Add more\" : \"Search tools\"}\n          onChange={(e) => {\n            setQuery(e.target.value);\n            setActive(0);\n            setOpen(true);\n          }}\n          onFocus={() => setOpen(true)}\n          onKeyDown={onKeyDown}\n          className=\"h-8 min-w-[6rem] flex-1 bg-transparent px-1 text-base text-slate-900 outline-none placeholder:text-slate-500 sm:text-sm\"\n        />\n      </div>\n      {open && (\n        <ul id=\"tools-list\" role=\"listbox\" aria-label=\"Tools\" className=\"absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg\">\n          {options.map((t, i) => (\n            <li\n              key={t}\n              id={`tool-${i}`}\n              role=\"option\"\n              aria-selected={false}\n              onMouseDown={(e) => e.preventDefault()}\n              onClick={() => add(t)}\n              onMouseEnter={() => setActive(i)}\n              className={`flex h-10 cursor-pointer items-center px-3 text-sm text-slate-800 ${i === active ? \"bg-sky-50\" : \"\"}`}\n            >\n              {t}\n            </li>\n          ))}\n          {options.length === 0 && <li className=\"px-3 py-2 text-sm text-slate-600\">Nothing left to add</li>}\n        </ul>\n      )}\n      <p className=\"mt-2 text-xs text-slate-600\">Backspace in the empty box removes the last tool.</p>\n    </div>\n  );\n}\n";

const PIECES: Piece[] = [
  { id: "r1", name: "Select-only dropdown", blurb: "A styled replacement for a native select, with status dots and type-ahead.", group: "single", Demo: r1Demo, react: r1React, stage: "min-h-[320px] bg-slate-50 ring-1 ring-inset ring-slate-200/80" },
  { id: "r2", name: "Searchable combobox", blurb: "Filters teammates as you type and bolds the matching letters.", group: "single", Demo: r2Demo, react: r2React, stage: "min-h-[320px] bg-slate-50 ring-1 ring-inset ring-slate-200/80" },
  { id: "r5", name: "Async options with debounce", blurb: "Waits for a pause, cancels the old request and announces the result count.", group: "single", Demo: r5Demo, react: r5React, stage: "min-h-[320px] bg-slate-50 ring-1 ring-inset ring-slate-200/80" },
  { id: "r6", name: "Grouped options with descriptions", blurb: "Time zones in labelled groups with sticky headings.", group: "single", Demo: r6Demo, react: r6React, stage: "min-h-[320px] bg-slate-50 ring-1 ring-inset ring-slate-200/80" },
  { id: "r3", name: "Multi-select with checkmarks", blurb: "The list stays open while you toggle, and the field sums up the choice.", group: "multi", Demo: r3Demo, react: r3React, stage: "min-h-[320px] bg-slate-50 ring-1 ring-inset ring-slate-200/80" },
  { id: "r4", name: "Chip multi-select", blurb: "Search a fixed list, add chips, remove with a button or Backspace.", group: "multi", Demo: r4Demo, react: r4React, stage: "min-h-[320px] bg-slate-50 ring-1 ring-inset ring-slate-200/80" }
];
const GROUPS: { key: string; label: string }[] = [{"key":"single","label":"Single select"},{"key":"multi","label":"Multi select"}];
const TEXT: { eyebrow: string; title: string; lead: string; refTitle: string; refNote: string } = {"eyebrow":"React · Tailwind · no dependencies","title":"React select and searchable dropdowns","lead":"Six dropdowns built on the combobox pattern: a select-only menu with type-ahead, a searchable autocomplete, grouped options, a checkmark multi-select, a chip multi-select and a search that loads results as you type. No package, full keyboard support.","refTitle":"Combobox keyboard and ARIA reference","refNote":"Roles, states and keys follow the combobox and listbox patterns in the WAI-ARIA Authoring Practices Guide. DOM focus never leaves the combobox; aria-activedescendant tells assistive technology which option is highlighted."};
const REF_HEAD: string[] = ["Key or attribute","Behaviour","Pieces"];
const REF_ROWS: string[][] = [
  [
    "Down Arrow / Up Arrow",
    "Open the list if closed, otherwise move the highlight to the next or previous option.",
    "All six."
  ],
  [
    "Enter",
    "Accept the highlighted option and close the list. In the multi-selects it toggles or adds the option instead.",
    "All six."
  ],
  [
    "Escape",
    "Close the list. In the searchable field, a second Escape clears the text.",
    "All six."
  ],
  [
    "Home / End",
    "Highlight the first or last option while the list is open.",
    "Select-only and grouped."
  ],
  [
    "Printable letters",
    "Type-ahead in the select-only menu; filter the options in the editable ones.",
    "Status (type-ahead), assignee, tools, city."
  ],
  [
    "role=\"combobox\" + aria-expanded",
    "Marks the field that controls a popup list and says whether the list is shown.",
    "All six."
  ],
  [
    "aria-controls + aria-activedescendant",
    "Point from the combobox to the listbox and to the id of the highlighted option.",
    "All six."
  ],
  [
    "aria-autocomplete=\"list\"",
    "Says the options are filtered by what is typed, without inline completion.",
    "Assignee, tools, city."
  ],
  [
    "aria-multiselectable=\"true\"",
    "On the listbox, tells users that more than one option can be selected.",
    "Team visibility."
  ]
];

const COPY_ICON = "M9 9h10v10H9zM5 15V5h10";
const CHECK_ICON = "M5 12.5l4.5 4.5L19 7.5";
const CODE_ICON = "M8 7l-5 5 5 5M16 7l5 5-5 5";

export default function ReactSelectDropdownCollection() {
  const [group, setGroup] = useState("all");
  const [langs, setLangs] = useState<Record<string, Lang>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const shown = group === "all" ? PIECES : PIECES.filter((p) => p.group === group);
  const langOf = (p: Piece): Lang => (p.html ? langs[p.id] ?? "react" : "react");
  const codeOf = (p: Piece) => (langOf(p) === "html" && p.html ? p.html : p.react);
  const langName = (l: Lang) => (l === "html" ? "HTML, CSS and JS" : "React and Tailwind");

  async function copy(p: Piece) {
    let ok = false;
    try {
      await navigator.clipboard.writeText(codeOf(p));
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) setOpen(p.id);
    setCopied(ok ? p.id : null);
    setAnnounce(ok ? `${p.name}: ${langName(langOf(p))} copied` : "Copy was blocked, so the code is shown under the demo for you to select");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  }

  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2";
  const chip = `inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-colors ${ring}`;

  return (
    <section
      className="bg-[#f8fafc] px-4 py-12 sm:px-8 sm:py-14"
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}
    >
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">{TEXT.eyebrow}</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] text-stone-950 sm:text-[42px]">{TEXT.title}</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-stone-600">{TEXT.lead}</p>
        </header>

        <div role="group" aria-label="Filter the collection" className="mt-8 flex flex-wrap gap-1.5 border-y border-stone-300/70 py-4">
          {[{ key: "all", label: "All" }, ...GROUPS, { key: "ref", label: "Reference table" }].map((g) => {
            const on = group === g.key;
            const n = g.key === "ref" ? REF_ROWS.length : g.key === "all" ? PIECES.length : PIECES.filter((p) => p.group === g.key).length;
            return (
              <button
                key={g.key}
                type="button"
                aria-pressed={on}
                onClick={() => setGroup(g.key)}
                className={`${chip} ${on ? "bg-sky-800 text-white" : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"}`}
              >
                {g.label}
                <span className={`font-mono text-[11px] ${on ? "opacity-75" : "text-stone-500"}`}>{n}</span>
              </button>
            );
          })}
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>

        {group !== "ref" && (
        <ul className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => {
            const isOpen = open === p.id;
            const l = langOf(p);
            return (
              <li
                key={p.id}
                className={`flex min-w-0 flex-col rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.05)] ${isOpen ? "md:col-span-2 lg:col-span-3" : ""}`}
              >
                <div className="px-4 pt-4">
                  <h3 className="text-[14px] font-semibold text-stone-950">{p.name}</h3>
                  <p className="mt-0.5 text-[13px] leading-snug text-stone-600">{p.blurb}</p>
                </div>
                <div className={`relative mx-3 mt-3 flex min-w-0 items-start justify-center rounded-xl px-3 py-6 sm:px-5 ${p.stage}`}>
                  <p.Demo />
                </div>
                <div className="flex flex-wrap items-center gap-2 px-3 py-3">
                  {p.html && (
                    <div role="group" aria-label={`Code version for ${p.name}`} className="inline-flex rounded-lg bg-stone-100 p-0.5">
                      {(["react", "html"] as Lang[]).map((x) => (
                        <button
                          key={x}
                          type="button"
                          aria-pressed={l === x}
                          onClick={() => setLangs({ ...langs, [p.id]: x })}
                          className={`h-9 rounded-md px-2.5 text-[12px] font-semibold ${ring} ${l === x ? "bg-white text-stone-950 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
                        >
                          {x === "react" ? "React" : "HTML"}
                        </button>
                      ))}
                    </div>
                  )}
                  <span className="flex-1" />
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`code-${p.id}`}
                    onClick={() => setOpen(isOpen ? null : p.id)}
                    className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold text-stone-700 hover:bg-stone-100 ${ring}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                      <path d={CODE_ICON} />
                    </svg>
                    {isOpen ? "Hide code" : "Code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(p)}
                    aria-label={`Copy ${langName(l)} for ${p.name}`}
                    className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${ring} ${copied === p.id ? "bg-emerald-700 text-white" : "bg-stone-900 text-white hover:bg-stone-700"}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                      <path d={copied === p.id ? CHECK_ICON : COPY_ICON} />
                    </svg>
                    {copied === p.id ? "Copied" : "Copy"}
                  </button>
                </div>
                {isOpen && (
                  <pre
                    id={`code-${p.id}`}
                    tabIndex={0}
                    aria-label={`${langName(l)} for ${p.name}`}
                    className="max-h-[440px] overflow-auto rounded-b-2xl border-t border-stone-800 bg-[#121316] p-4 font-mono text-[12px] leading-[1.65] text-stone-200"
                  >
                    <code>{codeOf(p)}</code>
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
        )}

        {group === "ref" && (
        <div className="mt-6">
          <h3 className="text-[17px] font-semibold tracking-tight text-stone-950">{TEXT.refTitle}</h3>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-stone-600">{TEXT.refNote}</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white" tabIndex={0} role="region" aria-label={TEXT.refTitle}>
            <table className="w-full min-w-[600px] text-left text-[13px]">
              <thead className="bg-stone-50 text-stone-700">
                <tr>
                  {REF_HEAD.map((h) => (
                    <th key={h} scope="col" className="px-4 py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REF_ROWS.map((r, i) => (
                  <tr key={i} className="border-t border-stone-200 align-top">
                    {r.map((c, j) =>
                      j === 0 ? (
                        <th key={j} scope="row" className="whitespace-nowrap px-4 py-2.5 font-mono text-[12px] font-medium text-stone-900">
                          {c}
                        </th>
                      ) : (
                        <td key={j} className="px-4 py-2.5 leading-relaxed text-stone-700">
                          {c}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
