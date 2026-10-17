import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

/*
  Sidebar navigation collection.
  Each sidebar is drawn inside its own relatively positioned app frame with a fixed height, so
  drawers and overlays stay inside the preview. In your app, swap the frame for the full viewport
  (h-screen, or fixed inset-0 for the drawer). The copied code is the same component you see.
*/

type Fam = "desktop" | "mobile" | "plain";
type Lang = "react" | "html";
type Item = { f: Fam; name: string; note: string; Demo: () => JSX.Element; code: Partial<Record<Lang, string>> };

const FAMILIES: Record<Fam, string> = { desktop: "Desktop sidebars", mobile: "Mobile drawer", plain: "HTML only" };
const LANGS: Record<Lang, string> = { react: "React + Tailwind", html: "HTML + Tailwind" };

/* ---------- shared icons ---------- */
const PATHS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  inbox: "M3 13h5l1.5 3h5L16 13h5M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  users: "M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  file: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  calendar: "M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  chevron: "m9 18 6-6-6-6",
  panel: "M3 5h18v14H3zM9 5v14",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6 6 18",
  box: "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
} as const;
type IconName = keyof typeof PATHS;

function Icon({ name, className = "h-[18px] w-[18px]" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={"shrink-0 " + className}>
      <path d={PATHS[name]} />
    </svg>
  );
}

const ICON_SRC = `const PATHS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  inbox: "M3 13h5l1.5 3h5L16 13h5M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  users: "M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  file: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5",
  gear: "${PATHS.gear}",
  calendar: "M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  chevron: "m9 18 6-6-6-6",
  panel: "M3 5h18v14H3zM9 5v14",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6 6 18",
  box: "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
} as const;
type IconName = keyof typeof PATHS;

function Icon({ name, className = "h-[18px] w-[18px]" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={"shrink-0 " + className}>
      <path d={PATHS[name]} />
    </svg>
  );
}`;

/* A plain page body used behind every sidebar so the frame reads as a real app. */
function PageBody({ title, dark = false }: { title: string; dark?: boolean }) {
  return (
    <div className="min-w-0 flex-1 p-5">
      <h4 className={"text-base font-semibold " + (dark ? "text-white" : "text-slate-900")}>{title}</h4>
      <p className={"mt-1 text-sm " + (dark ? "text-slate-400" : "text-slate-600")}>Your page content goes here.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((k) => (
          <div key={k} className={"h-20 rounded-lg " + (dark ? "bg-white/[0.04] ring-1 ring-white/10" : "bg-white ring-1 ring-slate-200")} />
        ))}
      </div>
      <div className={"mt-3 h-28 rounded-lg " + (dark ? "bg-white/[0.04] ring-1 ring-white/10" : "bg-white ring-1 ring-slate-200")} aria-hidden="true" />
    </div>
  );
}

const PAGEBODY_SRC = `function PageBody({ title, dark = false }: { title: string; dark?: boolean }) {
  return (
    <div className="min-w-0 flex-1 p-5">
      <h4 className={"text-base font-semibold " + (dark ? "text-white" : "text-slate-900")}>{title}</h4>
      <p className={"mt-1 text-sm " + (dark ? "text-slate-400" : "text-slate-600")}>Your page content goes here.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((k) => (
          <div key={k} className={"h-20 rounded-lg " + (dark ? "bg-white/[0.04] ring-1 ring-white/10" : "bg-white ring-1 ring-slate-200")} />
        ))}
      </div>
      <div className={"mt-3 h-28 rounded-lg " + (dark ? "bg-white/[0.04] ring-1 ring-white/10" : "bg-white ring-1 ring-slate-200")} aria-hidden="true" />
    </div>
  );
}`;

/* ---------- 1. Collapsible sidebar ---------- */
const MAIN_LINKS: { label: string; icon: IconName; count?: number }[] = [
  { label: "Overview", icon: "home" },
  { label: "Bookings", icon: "calendar", count: 4 },
  { label: "Customers", icon: "users" },
  { label: "Reports", icon: "chart" },
  { label: "Settings", icon: "gear" },
];

function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("Bookings");
  return (
    <div className="relative flex h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <aside className={"flex shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 motion-reduce:transition-none " + (collapsed ? "w-[64px]" : "w-[232px]")}>
        <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-emerald-700 text-sm font-bold text-white" aria-hidden="true">F</span>
          {!collapsed && <span className="truncate text-sm font-semibold text-slate-900">Fernhill Physio</span>}
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {MAIN_LINKS.map((l) => {
              const on = l.label === active;
              return (
                <li key={l.label}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActive(l.label);
                    }}
                    aria-current={on ? "page" : undefined}
                    aria-label={collapsed ? l.label : undefined}
                    title={collapsed ? l.label : undefined}
                    className={
                      "flex h-10 items-center gap-3 rounded-md px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 " +
                      (on ? "bg-emerald-50 font-medium text-emerald-900" : "text-slate-700 hover:bg-slate-100")
                    }
                  >
                    <Icon name={l.icon} />
                    {!collapsed && <span className="flex-1 truncate">{l.label}</span>}
                    {!collapsed && l.count ? <span className="rounded-full bg-emerald-700 px-1.5 text-[11px] font-semibold text-white">{l.count}</span> : null}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="m-2 flex h-10 items-center gap-3 rounded-md px-3 text-sm text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
        >
          <Icon name="panel" />
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>
      <PageBody title={active} />
    </div>
  );
}

const COLLAPSIBLE_REACT = `import { useState } from "react";

${ICON_SRC}

${PAGEBODY_SRC}

const MAIN_LINKS: { label: string; icon: IconName; count?: number }[] = [
  { label: "Overview", icon: "home" },
  { label: "Bookings", icon: "calendar", count: 4 },
  { label: "Customers", icon: "users" },
  { label: "Reports", icon: "chart" },
  { label: "Settings", icon: "gear" },
];

// Collapses from 232px to a 64px icon rail. In the rail each link keeps its name
// through aria-label (read aloud) and title (shown on hover).
// In an app, replace h-[420px] on the outer div with h-screen.
export function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("Bookings");
  return (
    <div className="relative flex h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <aside className={"flex shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 motion-reduce:transition-none " + (collapsed ? "w-[64px]" : "w-[232px]")}>
        <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-emerald-700 text-sm font-bold text-white" aria-hidden="true">F</span>
          {!collapsed && <span className="truncate text-sm font-semibold text-slate-900">Fernhill Physio</span>}
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {MAIN_LINKS.map((l) => {
              const on = l.label === active;
              return (
                <li key={l.label}>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setActive(l.label); }}
                    aria-current={on ? "page" : undefined}
                    aria-label={collapsed ? l.label : undefined}
                    title={collapsed ? l.label : undefined}
                    className={
                      "flex h-10 items-center gap-3 rounded-md px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 " +
                      (on ? "bg-emerald-50 font-medium text-emerald-900" : "text-slate-700 hover:bg-slate-100")
                    }
                  >
                    <Icon name={l.icon} />
                    {!collapsed && <span className="flex-1 truncate">{l.label}</span>}
                    {!collapsed && l.count ? <span className="rounded-full bg-emerald-700 px-1.5 text-[11px] font-semibold text-white">{l.count}</span> : null}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="m-2 flex h-10 items-center gap-3 rounded-md px-3 text-sm text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
        >
          <Icon name="panel" />
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>
      <PageBody title={active} />
    </div>
  );
}`;

/* ---------- 2. Icon rail with a secondary panel ---------- */
const SECTIONS: { id: string; label: string; icon: IconName; links: string[] }[] = [
  { id: "inbox", label: "Inbox", icon: "inbox", links: ["Unassigned", "Mine", "Mentions", "Archived"] },
  { id: "orders", label: "Orders", icon: "box", links: ["Open", "Awaiting payment", "Shipped", "Returns"] },
  { id: "reports", label: "Reports", icon: "chart", links: ["Sales", "Products", "Traffic"] },
  { id: "team", label: "Team", icon: "users", links: ["Members", "Roles", "Invites"] },
];

function RailSidebar() {
  const [section, setSection] = useState("orders");
  const [link, setLink] = useState("Awaiting payment");
  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
  return (
    <div className="relative flex h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <nav aria-label="Sections" className="flex w-[60px] shrink-0 flex-col items-center gap-1 bg-[#14161b] py-3">
        {SECTIONS.map((s) => {
          const on = s.id === section;
          return (
            <button
              key={s.id}
              type="button"
              aria-label={s.label}
              aria-pressed={on}
              title={s.label}
              onClick={() => {
                setSection(s.id);
                setLink(s.links[0]);
              }}
              className={"relative grid h-10 w-10 place-items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 " + (on ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100")}
            >
              {on && <span aria-hidden="true" className="absolute -left-[10px] h-5 w-[3px] rounded-r bg-sky-300" />}
              <Icon name={s.icon} />
            </button>
          );
        })}
        <span className="mt-auto grid h-9 w-9 place-items-center rounded-full bg-sky-200 text-xs font-semibold text-sky-950" aria-label="Signed in as Priya Raman" role="img">
          PR
        </span>
      </nav>
      <nav aria-label={current.label} className="hidden w-[200px] shrink-0 border-r border-slate-200 bg-white p-3 sm:block">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">{current.label}</p>
        <ul className="space-y-0.5">
          {current.links.map((l) => (
            <li key={l}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setLink(l);
                }}
                aria-current={l === link ? "page" : undefined}
                className={"flex h-10 items-center rounded-md px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 " + (l === link ? "bg-slate-100 font-medium text-slate-900" : "text-slate-700 hover:bg-slate-50")}
              >
                {l}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <PageBody title={current.label + " · " + link} />
    </div>
  );
}

const RAIL_REACT = `import { useState } from "react";

${ICON_SRC}

${PAGEBODY_SRC}

const SECTIONS: { id: string; label: string; icon: IconName; links: string[] }[] = [
  { id: "inbox", label: "Inbox", icon: "inbox", links: ["Unassigned", "Mine", "Mentions", "Archived"] },
  { id: "orders", label: "Orders", icon: "box", links: ["Open", "Awaiting payment", "Shipped", "Returns"] },
  { id: "reports", label: "Reports", icon: "chart", links: ["Sales", "Products", "Traffic"] },
  { id: "team", label: "Team", icon: "users", links: ["Members", "Roles", "Invites"] },
];

// Two levels: a dark 60px rail picks the section, a 200px panel lists its pages.
// Below 640px the panel hides and the rail stands alone.
export function RailSidebar() {
  const [section, setSection] = useState("orders");
  const [link, setLink] = useState("Awaiting payment");
  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
  return (
    <div className="relative flex h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <nav aria-label="Sections" className="flex w-[60px] shrink-0 flex-col items-center gap-1 bg-[#14161b] py-3">
        {SECTIONS.map((s) => {
          const on = s.id === section;
          return (
            <button
              key={s.id}
              type="button"
              aria-label={s.label}
              aria-pressed={on}
              title={s.label}
              onClick={() => { setSection(s.id); setLink(s.links[0]); }}
              className={"relative grid h-10 w-10 place-items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 " + (on ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100")}
            >
              {on && <span aria-hidden="true" className="absolute -left-[10px] h-5 w-[3px] rounded-r bg-sky-300" />}
              <Icon name={s.icon} />
            </button>
          );
        })}
        <span className="mt-auto grid h-9 w-9 place-items-center rounded-full bg-sky-200 text-xs font-semibold text-sky-950" aria-label="Signed in as Priya Raman" role="img">
          PR
        </span>
      </nav>
      <nav aria-label={current.label} className="hidden w-[200px] shrink-0 border-r border-slate-200 bg-white p-3 sm:block">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">{current.label}</p>
        <ul className="space-y-0.5">
          {current.links.map((l) => (
            <li key={l}>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setLink(l); }}
                aria-current={l === link ? "page" : undefined}
                className={"flex h-10 items-center rounded-md px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 " + (l === link ? "bg-slate-100 font-medium text-slate-900" : "text-slate-700 hover:bg-slate-50")}
              >
                {l}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <PageBody title={current.label + " · " + link} />
    </div>
  );
}`;

/* ---------- 3. Nested groups with search ---------- */
const GROUPS = [
  { title: "Getting started", links: ["Install", "Your first page", "Project structure"] },
  { title: "Content", links: ["Pages", "Blog posts", "Images", "Forms"] },
  { title: "Publishing", links: ["Custom domains", "Redirects", "Search settings"] },
  { title: "Account", links: ["Billing", "Team members"] },
];

function NestedSidebar() {
  const [open, setOpen] = useState<Record<string, boolean>>({ "Getting started": false, Content: true, Publishing: true, Account: false });
  const [active, setActive] = useState("Images");
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  return (
    <div className="relative flex h-[420px] overflow-hidden rounded-xl border border-stone-200 bg-[#fbfaf8]">
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-stone-200 bg-[#f4f2ee]">
        <div className="p-3">
          <label htmlFor="sn-docs-filter" className="sr-only">Filter pages</label>
          <input id="sn-docs-filter" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter pages" className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 placeholder:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700" />
        </div>
        <nav aria-label="Documentation" className="flex-1 overflow-y-auto px-2 pb-3">
          <ul className="space-y-1">
            {GROUPS.map((g) => {
              const links = g.links.filter((l) => !query || l.toLowerCase().includes(query));
              if (query && links.length === 0) return null;
              const isOpen = query ? true : !!open[g.title];
              const id = "sn-group-" + g.title.replace(/\s+/g, "-").toLowerCase();
              return (
                <li key={g.title}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={id}
                    onClick={() => setOpen({ ...open, [g.title]: !open[g.title] })}
                    className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-semibold text-stone-900 hover:bg-stone-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                  >
                    <Icon name="chevron" className={"h-4 w-4 text-stone-500 transition-transform motion-reduce:transition-none " + (isOpen ? "rotate-90" : "")} />
                    {g.title}
                  </button>
                  {isOpen && (
                    <ul id={id} className="ml-[15px] border-l border-stone-300 pl-2">
                      {links.map((l) => (
                        <li key={l}>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setActive(l);
                            }}
                            aria-current={l === active ? "page" : undefined}
                            className={"-ml-[9px] flex h-9 items-center border-l-2 pl-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 " + (l === active ? "border-amber-700 font-medium text-amber-900" : "border-transparent text-stone-700 hover:text-stone-950")}
                          >
                            {l}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          {query && GROUPS.every((g) => !g.links.some((l) => l.toLowerCase().includes(query))) && <p className="px-2 py-3 text-sm text-stone-600">No page matches "{q}".</p>}
        </nav>
      </aside>
      <PageBody title={active} />
    </div>
  );
}

const NESTED_REACT = `import { useState } from "react";

${ICON_SRC}

${PAGEBODY_SRC}

const GROUPS = [
  { title: "Getting started", links: ["Install", "Your first page", "Project structure"] },
  { title: "Content", links: ["Pages", "Blog posts", "Images", "Forms"] },
  { title: "Publishing", links: ["Custom domains", "Redirects", "Search settings"] },
  { title: "Account", links: ["Billing", "Team members"] },
];

// Each group is a disclosure: a button with aria-expanded that shows or hides its list.
// Typing in the filter opens every group with a match and hides the rest.
export function NestedSidebar() {
  const [open, setOpen] = useState<Record<string, boolean>>({ "Getting started": false, Content: true, Publishing: true, Account: false });
  const [active, setActive] = useState("Images");
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  return (
    <div className="relative flex h-[420px] overflow-hidden rounded-xl border border-stone-200 bg-[#fbfaf8]">
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-stone-200 bg-[#f4f2ee]">
        <div className="p-3">
          <label htmlFor="sn-docs-filter" className="sr-only">Filter pages</label>
          <input id="sn-docs-filter" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter pages" className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 placeholder:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700" />
        </div>
        <nav aria-label="Documentation" className="flex-1 overflow-y-auto px-2 pb-3">
          <ul className="space-y-1">
            {GROUPS.map((g) => {
              const links = g.links.filter((l) => !query || l.toLowerCase().includes(query));
              if (query && links.length === 0) return null;
              const isOpen = query ? true : !!open[g.title];
              const id = "sn-group-" + g.title.replace(/\\s+/g, "-").toLowerCase();
              return (
                <li key={g.title}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={id}
                    onClick={() => setOpen({ ...open, [g.title]: !open[g.title] })}
                    className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-semibold text-stone-900 hover:bg-stone-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                  >
                    <Icon name="chevron" className={"h-4 w-4 text-stone-500 transition-transform motion-reduce:transition-none " + (isOpen ? "rotate-90" : "")} />
                    {g.title}
                  </button>
                  {isOpen && (
                    <ul id={id} className="ml-[15px] border-l border-stone-300 pl-2">
                      {links.map((l) => (
                        <li key={l}>
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); setActive(l); }}
                            aria-current={l === active ? "page" : undefined}
                            className={"-ml-[9px] flex h-9 items-center border-l-2 pl-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 " + (l === active ? "border-amber-700 font-medium text-amber-900" : "border-transparent text-stone-700 hover:text-stone-950")}
                          >
                            {l}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          {query && GROUPS.every((g) => !g.links.some((l) => l.toLowerCase().includes(query))) && <p className="px-2 py-3 text-sm text-stone-600">No page matches "{q}".</p>}
        </nav>
      </aside>
      <PageBody title={active} />
    </div>
  );
}`;

/* ---------- 4. Mobile drawer ---------- */
const DRAWER_LINKS: { label: string; icon: IconName }[] = [
  { label: "Today", icon: "home" },
  { label: "Schedule", icon: "calendar" },
  { label: "Clients", icon: "users" },
  { label: "Invoices", icon: "file" },
  { label: "Settings", icon: "gear" },
];

function MobileDrawer() {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState("Schedule");
  const opener = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (open) panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    else opener.current?.focus();
  }, [open]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key !== "Tab" || !panel.current) return;
    const items = panel.current.querySelectorAll<HTMLElement>("a,button");
    const a = items[0];
    const z = items[items.length - 1];
    if (e.shiftKey && document.activeElement === a) {
      e.preventDefault();
      z.focus();
    } else if (!e.shiftKey && document.activeElement === z) {
      e.preventDefault();
      a.focus();
    }
  };

  return (
    <div className="relative mx-auto h-[460px] w-full max-w-[380px] overflow-hidden rounded-[28px] border-[6px] border-[#1d1f24] bg-white">
      <header className="flex h-14 items-center gap-2 border-b border-slate-200 px-2">
        <button ref={opener} type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="sn-drawer" aria-label="Open menu" className="grid h-11 w-11 place-items-center rounded-lg text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700">
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-slate-900">{active}</span>
      </header>
      <PageBody title={active} />

      <div aria-hidden="true" onClick={() => setOpen(false)} className={"absolute inset-0 bg-slate-900/40 transition-opacity duration-200 motion-reduce:transition-none " + (open ? "opacity-100" : "pointer-events-none opacity-0")} />
      <div
        ref={panel}
        id="sn-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        onKeyDown={onKeyDown}
        className={"absolute inset-y-0 left-0 flex w-[78%] max-w-[300px] flex-col bg-white shadow-[8px_0_32px_-12px_rgba(15,23,42,0.35)] transition-transform duration-300 ease-out motion-reduce:transition-none " + (open ? "translate-x-0" : "invisible -translate-x-full")}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-100 pl-4 pr-2">
          <span className="text-sm font-semibold text-slate-900">Copperleaf Studio</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-11 w-11 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {DRAWER_LINKS.map((l) => (
              <li key={l.label}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActive(l.label);
                    setOpen(false);
                  }}
                  aria-current={l.label === active ? "page" : undefined}
                  className={"flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 " + (l.label === active ? "bg-violet-50 font-medium text-violet-900" : "text-slate-700 hover:bg-slate-50")}
                >
                  <Icon name={l.icon} />
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="border-t border-slate-100 p-4 text-xs text-slate-600">Signed in as Maya Lindqvist</p>
      </div>
    </div>
  );
}

const DRAWER_REACT = `import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

${ICON_SRC}

${PAGEBODY_SRC}

const DRAWER_LINKS: { label: string; icon: IconName }[] = [
  { label: "Today", icon: "home" },
  { label: "Schedule", icon: "calendar" },
  { label: "Clients", icon: "users" },
  { label: "Invoices", icon: "file" },
  { label: "Settings", icon: "gear" },
];

// A modal drawer: focus moves into it on open, Tab stays inside, Escape or the dim
// overlay closes it, and focus returns to the menu button. Here it is drawn inside a
// phone frame; in a real page change the outer div to "fixed inset-0 z-50" for the
// overlay and drawer, and use h-screen for the layout.
export function MobileDrawer() {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState("Schedule");
  const opener = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (open) panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    else opener.current?.focus();
  }, [open]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key !== "Tab" || !panel.current) return;
    const items = panel.current.querySelectorAll<HTMLElement>("a,button");
    const a = items[0];
    const z = items[items.length - 1];
    if (e.shiftKey && document.activeElement === a) {
      e.preventDefault();
      z.focus();
    } else if (!e.shiftKey && document.activeElement === z) {
      e.preventDefault();
      a.focus();
    }
  };

  return (
    <div className="relative mx-auto h-[460px] w-full max-w-[380px] overflow-hidden rounded-[28px] border-[6px] border-[#1d1f24] bg-white">
      <header className="flex h-14 items-center gap-2 border-b border-slate-200 px-2">
        <button ref={opener} type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="sn-drawer" aria-label="Open menu" className="grid h-11 w-11 place-items-center rounded-lg text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700">
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-slate-900">{active}</span>
      </header>
      <PageBody title={active} />

      <div aria-hidden="true" onClick={() => setOpen(false)} className={"absolute inset-0 bg-slate-900/40 transition-opacity duration-200 motion-reduce:transition-none " + (open ? "opacity-100" : "pointer-events-none opacity-0")} />
      <div
        ref={panel}
        id="sn-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        onKeyDown={onKeyDown}
        className={"absolute inset-y-0 left-0 flex w-[78%] max-w-[300px] flex-col bg-white shadow-[8px_0_32px_-12px_rgba(15,23,42,0.35)] transition-transform duration-300 ease-out motion-reduce:transition-none " + (open ? "translate-x-0" : "invisible -translate-x-full")}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-100 pl-4 pr-2">
          <span className="text-sm font-semibold text-slate-900">Copperleaf Studio</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-11 w-11 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {DRAWER_LINKS.map((l) => (
              <li key={l.label}>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setActive(l.label); setOpen(false); }}
                  aria-current={l.label === active ? "page" : undefined}
                  className={"flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 " + (l.label === active ? "bg-violet-50 font-medium text-violet-900" : "text-slate-700 hover:bg-slate-50")}
                >
                  <Icon name={l.icon} />
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="border-t border-slate-100 p-4 text-xs text-slate-600">Signed in as Maya Lindqvist</p>
      </div>
    </div>
  );
}`;

/* ---------- 5. Dark workspace sidebar ---------- */
const WORKSPACES = ["Harbourline Studio", "Mesa Ceramics", "Personal"];
const DARK_GROUPS: { title: string; links: { label: string; icon: IconName; badge?: string }[] }[] = [
  { title: "Workspace", links: [{ label: "Dashboard", icon: "home" }, { label: "Projects", icon: "box", badge: "12" }, { label: "Messages", icon: "inbox", badge: "3" }] },
  { title: "Insights", links: [{ label: "Analytics", icon: "chart" }, { label: "Documents", icon: "file" }] },
];

function DarkSidebar() {
  const [ws, setWs] = useState(0);
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState("Projects");
  return (
    <div className="relative flex h-[420px] overflow-hidden rounded-xl border border-slate-800 bg-[#0d0f12]">
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-white/10 bg-[#111317]">
        <div className="relative p-3">
          <button type="button" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-haspopup="true" aria-controls="sn-ws-list" className="flex h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-orange-300 text-xs font-bold text-[#111317]" aria-hidden="true">{WORKSPACES[ws][0]}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{WORKSPACES[ws]}</span>
              <span className="block text-[11px] text-slate-400">Switch workspace</span>
            </span>
            <Icon name="chevron" className={"h-4 w-4 text-slate-400 transition-transform motion-reduce:transition-none " + (menu ? "-rotate-90" : "rotate-90")} />
          </button>
          {menu && (
            <ul id="sn-ws-list" className="absolute left-3 right-3 top-[60px] z-10 rounded-lg border border-white/10 bg-[#1a1d22] p-1 shadow-xl">
              {WORKSPACES.map((w, i) => (
                <li key={w}>
                  <button
                    type="button"
                    aria-pressed={i === ws}
                    onClick={() => {
                      setWs(i);
                      setMenu(false);
                    }}
                    className={"flex h-10 w-full items-center rounded-md px-2.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 " + (i === ws ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5")}
                  >
                    {w}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3">
          {DARK_GROUPS.map((g) => (
            <div key={g.title} className="mb-4">
              <h5 className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{g.title}</h5>
              <ul className="space-y-0.5">
                {g.links.map((l) => {
                  const on = l.label === active;
                  return (
                    <li key={l.label}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActive(l.label);
                        }}
                        aria-current={on ? "page" : undefined}
                        className={"flex h-10 items-center gap-3 rounded-lg px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 " + (on ? "bg-white/[0.08] text-white" : "text-slate-300 hover:bg-white/5 hover:text-white")}
                      >
                        <Icon name={l.icon} />
                        <span className="flex-1">{l.label}</span>
                        {l.badge && <span className="font-mono text-[11px] text-slate-400">{l.badge}</span>}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-2.5 border-t border-white/10 p-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-700 text-xs font-semibold text-white" aria-hidden="true">DA</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-white">Dara Achebe</span>
            <span className="block truncate text-[11px] text-slate-400">Owner</span>
          </span>
          <a href="#" aria-label="Account settings" className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
            <Icon name="gear" />
          </a>
        </div>
      </aside>
      <PageBody title={active} dark />
    </div>
  );
}

const DARK_REACT = `import { useState } from "react";

${ICON_SRC}

${PAGEBODY_SRC}

const WORKSPACES = ["Harbourline Studio", "Mesa Ceramics", "Personal"];
const DARK_GROUPS: { title: string; links: { label: string; icon: IconName; badge?: string }[] }[] = [
  { title: "Workspace", links: [{ label: "Dashboard", icon: "home" }, { label: "Projects", icon: "box", badge: "12" }, { label: "Messages", icon: "inbox", badge: "3" }] },
  { title: "Insights", links: [{ label: "Analytics", icon: "chart" }, { label: "Documents", icon: "file" }] },
];

// Workspace switcher on top, grouped links with counts, the signed-in person at the foot.
export function DarkSidebar() {
  const [ws, setWs] = useState(0);
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState("Projects");
  return (
    <div className="relative flex h-[420px] overflow-hidden rounded-xl border border-slate-800 bg-[#0d0f12]">
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-white/10 bg-[#111317]">
        <div className="relative p-3">
          <button type="button" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-haspopup="true" aria-controls="sn-ws-list" className="flex h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-orange-300 text-xs font-bold text-[#111317]" aria-hidden="true">{WORKSPACES[ws][0]}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{WORKSPACES[ws]}</span>
              <span className="block text-[11px] text-slate-400">Switch workspace</span>
            </span>
            <Icon name="chevron" className={"h-4 w-4 text-slate-400 transition-transform motion-reduce:transition-none " + (menu ? "-rotate-90" : "rotate-90")} />
          </button>
          {menu && (
            <ul id="sn-ws-list" className="absolute left-3 right-3 top-[60px] z-10 rounded-lg border border-white/10 bg-[#1a1d22] p-1 shadow-xl">
              {WORKSPACES.map((w, i) => (
                <li key={w}>
                  <button
                    type="button"
                    aria-pressed={i === ws}
                    onClick={() => { setWs(i); setMenu(false); }}
                    className={"flex h-10 w-full items-center rounded-md px-2.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 " + (i === ws ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5")}
                  >
                    {w}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3">
          {DARK_GROUPS.map((g) => (
            <div key={g.title} className="mb-4">
              <h5 className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{g.title}</h5>
              <ul className="space-y-0.5">
                {g.links.map((l) => {
                  const on = l.label === active;
                  return (
                    <li key={l.label}>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setActive(l.label); }}
                        aria-current={on ? "page" : undefined}
                        className={"flex h-10 items-center gap-3 rounded-lg px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 " + (on ? "bg-white/[0.08] text-white" : "text-slate-300 hover:bg-white/5 hover:text-white")}
                      >
                        <Icon name={l.icon} />
                        <span className="flex-1">{l.label}</span>
                        {l.badge && <span className="font-mono text-[11px] text-slate-400">{l.badge}</span>}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-2.5 border-t border-white/10 p-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-700 text-xs font-semibold text-white" aria-hidden="true">DA</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-white">Dara Achebe</span>
            <span className="block truncate text-[11px] text-slate-400">Owner</span>
          </span>
          <a href="#" aria-label="Account settings" className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
            <Icon name="gear" />
          </a>
        </div>
      </aside>
      <PageBody title={active} dark />
    </div>
  );
}`;

/* ---------- 6. HTML only, using details and summary ---------- */
const HTML_GROUPS = [
  { title: "Menu", open: true, links: ["Breakfast", "Lunch", "Cakes to order"] },
  { title: "Visit", open: true, links: ["Opening hours", "Find us"] },
  { title: "About", open: false, links: ["Our bakers", "Suppliers"] },
];

function HtmlSidebar() {
  return (
    <div className="relative flex h-[420px] overflow-hidden rounded-xl border border-sky-100 bg-white">
      <nav aria-label="Site" className="w-[220px] shrink-0 overflow-y-auto border-r border-sky-100 bg-sky-50/60 p-3">
        <a href="#" className="mb-3 flex h-10 items-center px-2 text-sm font-semibold text-sky-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700">
          Tidewater Bakery
        </a>
        {HTML_GROUPS.map((g) => (
          <details key={g.title} open={g.open} className="group mb-1">
            <summary className="flex h-10 cursor-pointer list-none items-center justify-between rounded-md px-2 text-sm font-medium text-slate-900 hover:bg-sky-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 [&::-webkit-details-marker]:hidden">
              {g.title}
              <Icon name="chevron" className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-90 motion-reduce:transition-none" />
            </summary>
            <ul className="pb-1 pl-2">
              {g.links.map((l) => (
                <li key={l}>
                  <a href="#" aria-current={l === "Opening hours" ? "page" : undefined} className={"flex h-9 items-center rounded-md px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 " + (l === "Opening hours" ? "bg-white font-medium text-sky-900 shadow-sm ring-1 ring-sky-100" : "text-slate-700 hover:text-slate-950")}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </nav>
      <PageBody title="Opening hours" />
    </div>
  );
}

const SUMMARY_CLS = "flex h-10 cursor-pointer list-none items-center justify-between rounded-md px-2 text-sm font-medium text-slate-900 hover:bg-sky-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 [&::-webkit-details-marker]:hidden";
const LINK_ON = "flex h-9 items-center rounded-md px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 bg-white font-medium text-sky-900 shadow-sm ring-1 ring-sky-100";
const LINK_OFF = "flex h-9 items-center rounded-md px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 text-slate-700 hover:text-slate-950";
const linkHtml = (l: string) => (l === "Opening hours" ? `      <li><a href="#" aria-current="page" class="${LINK_ON}">${l}</a></li>` : `      <li><a href="#" class="${LINK_OFF}">${l}</a></li>`);
const groupHtml = (g: (typeof HTML_GROUPS)[number]) => `  <details${g.open ? " open" : ""} class="group mb-1">
    <summary class="${SUMMARY_CLS}">
      ${g.title}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-90 motion-reduce:transition-none"><path d="m9 18 6-6-6-6"/></svg>
    </summary>
    <ul class="pb-1 pl-2">
${g.links.map(linkHtml).join("\n")}
    </ul>
  </details>`;
const HTML_SRC = `<!-- No JavaScript: each group is a details element, so it opens and closes natively
     and announces its state. Mark the current page with aria-current="page". -->
<nav aria-label="Site" class="w-[220px] shrink-0 overflow-y-auto border-r border-sky-100 bg-sky-50/60 p-3">
  <a href="/" class="mb-3 flex h-10 items-center px-2 text-sm font-semibold text-sky-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700">Tidewater Bakery</a>
${HTML_GROUPS.map(groupHtml).join("\n")}
</nav>`;

/* ---------- catalogue ---------- */
const ITEMS: Item[] = [
  { f: "desktop", name: "Collapsible to an icon rail", note: "232px with labels, 64px with icons. Press Collapse.", Demo: CollapsibleSidebar, code: { react: COLLAPSIBLE_REACT } },
  { f: "mobile", name: "Mobile drawer", note: "Opens over the page with a dim overlay; Escape, the overlay or a link closes it and focus returns to the menu button.", Demo: MobileDrawer, code: { react: DRAWER_REACT } },
  { f: "desktop", name: "Icon rail with a section panel", note: "Rail chooses the section, the panel lists its pages.", Demo: RailSidebar, code: { react: RAIL_REACT } },
  { f: "desktop", name: "Nested groups with a filter", note: "Disclosure groups for docs and help centres. Type to filter.", Demo: NestedSidebar, code: { react: NESTED_REACT } },
  { f: "desktop", name: "Dark sidebar with workspace switcher", note: "Grouped links, counts and the signed-in person at the foot.", Demo: DarkSidebar, code: { react: DARK_REACT } },
  { f: "plain", name: "HTML sidebar with details groups", note: "Opens and closes with no JavaScript at all.", Demo: HtmlSidebar, code: { html: HTML_SRC } },
];

const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#17191d]";

function Card({ item, n }: { item: Item; n: number }) {
  const langs = Object.keys(item.code) as Lang[];
  const [lang] = useState<Lang>(langs[0]);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const code = item.code[lang] ?? "";
  const id = `sn-code-${n}`;
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
    <li className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#1d2025]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
        <span className="font-mono text-[11px] text-slate-400">{String(n).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold tracking-tight text-white">{item.name}</h3>
          <p className="mt-0.5 text-[13px] leading-snug text-slate-400">{item.note}</p>
        </div>
        <span className="text-[12px] font-medium text-slate-400">{LANGS[lang]}</span>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className={`${tool} text-slate-200 hover:bg-white/10`}>
          {open ? "Hide code" : "Show code"}
        </button>
        <button type="button" onClick={copy} aria-label={`Copy ${LANGS[lang]} code for ${item.name}`} className={`${tool} ${copied ? "bg-emerald-600 text-white" : "bg-white text-slate-900 hover:bg-slate-200"}`}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {msg}
      </p>
      <div className="overflow-x-auto bg-[#26292f] p-3 sm:p-5">
        <div className="min-w-[340px]">
          <Demo />
        </div>
      </div>
      {open && (
        <pre id={id} tabIndex={0} aria-label={`${item.name} code`} className={`max-h-96 overflow-auto border-t border-white/10 bg-[#0e1013] p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200 ${RING}`}>
          <code>{code}</code>
        </pre>
      )}
    </li>
  );
}

const FAM_KEYS = Object.keys(FAMILIES) as Fam[];

export default function SidebarNavigationCollection() {
  const [fam, setFam] = useState<Fam | "all">("all");
  const list = ITEMS.map((it, i) => ({ it, n: i + 1 })).filter(({ it }) => fam === "all" || it.f === fam);
  const chip = `inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors ${RING}`;
  return (
    <section className="bg-[#17191d] px-4 py-12 text-slate-100 sm:px-8 sm:py-14" style={{ fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-slate-400">React · Tailwind · HTML</p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-[44px]">Sidebar navigation layouts</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-400">
              Six sidebars that each solve a different layout problem: collapsing to icons, two levels of navigation, long nested docs, a phone drawer, a workspace switcher, and a version with no script. Every one works in its frame.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter sidebars">
            {(["all", ...FAM_KEYS] as const).map((f) => {
              const on = fam === f;
              const count = f === "all" ? ITEMS.length : ITEMS.filter((it) => it.f === f).length;
              return (
                <button key={f} type="button" aria-pressed={on} onClick={() => setFam(f)} className={`${chip} ${on ? "bg-white text-slate-900" : "bg-white/5 text-slate-200 ring-1 ring-inset ring-white/15 hover:bg-white/10"}`}>
                  {f === "all" ? "All" : FAMILIES[f]}
                  <span className={`font-mono text-[11px] ${on ? "text-slate-600" : "text-slate-400"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </header>
        <div className="mt-8 h-[1200px] overflow-y-auto overscroll-contain border-t border-white/10 pr-1 pt-6" tabIndex={0} aria-label="Sidebar examples">
          <ul className="grid grid-cols-1 gap-5">
            {list.map(({ it, n }) => (
              <Card key={n} item={it} n={n} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
