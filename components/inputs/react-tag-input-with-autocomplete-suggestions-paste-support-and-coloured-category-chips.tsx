import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ---------- Content: edit these ---------- */

type Category = { label: string; chip: string; dot: string };

const CATEGORIES: Record<string, Category> = {
  area: { label: "Area", chip: "bg-sky-50 text-sky-800 ring-sky-200", dot: "bg-sky-500" },
  priority: { label: "Priority", chip: "bg-rose-50 text-rose-800 ring-rose-200", dot: "bg-rose-500" },
  team: { label: "Team", chip: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
  custom: { label: "Custom", chip: "bg-stone-100 text-stone-700 ring-stone-300", dot: "bg-stone-400" },
};

type Option = { value: string; category?: keyof typeof CATEGORIES };

const SKILLS: Option[] = ["React", "TypeScript", "Tailwind", "Node.js", "GraphQL", "Postgres", "Figma", "Testing", "Accessibility", "Animation", "Rust", "Go", "Python", "Docker"].map((value) => ({ value }));

const LABELS: Option[] = [
  { value: "checkout", category: "area" },
  { value: "search", category: "area" },
  { value: "onboarding", category: "area" },
  { value: "billing", category: "area" },
  { value: "urgent", category: "priority" },
  { value: "low", category: "priority" },
  { value: "design", category: "team" },
  { value: "platform", category: "team" },
  { value: "growth", category: "team" },
];

const SPLIT = /[,;\n]+/;

/* ---------- The reusable tag input ---------- */

type TagInputProps = {
  label: string;
  hint: string;
  placeholder: string;
  initial: Option[];
  suggestions?: Option[];
  max?: number;
  coloured?: boolean;
  startQuery?: string;
  startOpen?: boolean;
};

function TagInput({ label, hint, placeholder, initial, suggestions = [], max = 10, coloured = false, startQuery = "", startOpen = false }: TagInputProps) {
  const id = useId();
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tags, setTags] = useState<Option[]>(initial);
  const [query, setQuery] = useState(startQuery);
  const [open, setOpen] = useState(startOpen);
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState("");
  const [focused, setFocused] = useState(startOpen);
  const [shake, setShake] = useState<string | null>(null);

  const full = tags.length >= max;
  const has = (v: string) => tags.some((t) => t.value.toLowerCase() === v.toLowerCase());

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = suggestions.filter((s) => !has(s.value) && (q === "" || s.value.toLowerCase().includes(q)));
    // Words that start with the query come first, then words that merely contain it.
    const rank = (s: Option) => (s.value.toLowerCase().startsWith(q) ? 0 : 1);
    return [...pool].sort((a, b) => rank(a) - rank(b)).slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, suggestions, tags]);

  const showList = open && suggestions.length > 0 && matches.length > 0 && !full;

  useEffect(() => setActive(0), [query]);

  // The demo opens one list before anyone focuses it; close it once the visitor works elsewhere.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open && !focused) return;
    const away = (e: Event) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("focusin", away);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("focusin", away);
    };
  }, [open, focused]);
  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(null), 500);
    return () => clearTimeout(t);
  }, [shake]);

  function add(raw: string | Option): boolean {
    const opt: Option = typeof raw === "string" ? suggestions.find((s) => s.value.toLowerCase() === raw.trim().toLowerCase()) ?? { value: raw.trim(), category: coloured ? "custom" : undefined } : raw;
    if (!opt.value) return false;
    if (has(opt.value)) {
      setShake(tags.find((t) => t.value.toLowerCase() === opt.value.toLowerCase())!.value);
      setNotice(`"${opt.value}" is already added`);
      return false;
    }
    if (tags.length >= max) {
      setNotice(`You can add up to ${max} tags`);
      return false;
    }
    setTags((prev) => [...prev, opt]);
    setNotice(`Added ${opt.value}`);
    return true;
  }

  function remove(value: string) {
    setTags((prev) => prev.filter((t) => t.value !== value));
    setNotice(`Removed ${value}`);
    inputRef.current?.focus();
  }

  function addMany(parts: string[]) {
    let count = 0;
    const seen = new Set(tags.map((t) => t.value.toLowerCase()));
    const next = [...tags];
    for (const p of parts.map((s) => s.trim()).filter(Boolean)) {
      if (seen.has(p.toLowerCase()) || next.length >= max) continue;
      seen.add(p.toLowerCase());
      next.push(suggestions.find((s) => s.value.toLowerCase() === p.toLowerCase()) ?? { value: p, category: coloured ? "custom" : undefined });
      count++;
    }
    setTags(next);
    setNotice(`Added ${count} tag${count === 1 ? "" : "s"} from paste`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && suggestions.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (matches.length ? (a + 1) % matches.length : 0));
    } else if (e.key === "ArrowUp" && showList) {
      e.preventDefault();
      setActive((a) => (a - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter" || e.key === "," || (e.key === "Tab" && query.trim())) {
      if (e.key === "Enter" && showList && matches[active]) {
        e.preventDefault();
        if (add(matches[active])) setQuery("");
        return;
      }
      if (!query.trim()) return;
      e.preventDefault();
      if (add(query)) setQuery("");
    } else if (e.key === "Backspace" && query === "" && tags.length) {
      remove(tags[tags.length - 1].value);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function onChange(v: string) {
    if (SPLIT.test(v)) {
      addMany(v.split(SPLIT));
      setQuery("");
      return;
    }
    setQuery(v);
    setOpen(true);
    setNotice("");
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (!SPLIT.test(text)) return;
    e.preventDefault();
    addMany((query + text).split(SPLIT));
    setQuery("");
  }

  const listId = `${id}-list`;
  const optId = (i: number) => `${id}-opt-${i}`;
  const chipClass = (t: Option) =>
    coloured ? CATEGORIES[t.category ?? "custom"].chip : "bg-slate-900 text-white ring-slate-900";

  return (
    <div ref={rootRef} className="relative">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-slate-900">
          {label}
        </label>
        <span className={`text-xs tabular-nums ${full ? "font-semibold text-rose-600" : "text-slate-500"}`}>
          {full ? "Limit reached \u00b7 " : ""}
          {tags.length}/{max}
        </span>
      </div>

      <div className="relative">
      <div
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            inputRef.current?.focus();
          }
        }}
        className={`flex min-h-[48px] cursor-text flex-wrap items-center gap-1.5 rounded-xl border border-slate-300 bg-white p-1.5 shadow-sm transition-colors ${focused ? "border-slate-900 ring-4 ring-slate-900/10" : "hover:border-slate-400"}`}
      >
        <ul className="contents" aria-label={`${label} selected`}>
          <AnimatePresence initial={false}>
            {tags.map((t) => (
              <motion.li
                key={t.value}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                animate={shake === t.value && !reduce ? { opacity: 1, scale: 1, x: [0, -5, 5, -3, 3, 0] } : { opacity: 1, scale: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, transition: { duration: 0.12 } }}
                transition={{ type: "spring", stiffness: 520, damping: 32 }}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg pl-2.5 pr-1 text-[13px] font-medium ring-1 ring-inset ${chipClass(t)}`}
              >
                {coloured && <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${CATEGORIES[t.category ?? "custom"].dot}`} />}
                <span>{t.value}</span>
                <button
                  type="button"
                  onClick={() => remove(t.value)}
                  aria-label={`Remove ${t.value}`}
                  className={`grid h-6 w-6 place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 ${coloured ? "hover:bg-black/5 focus-visible:ring-slate-900" : "hover:bg-white/15 focus-visible:ring-white"}`}
                >
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l8 8M14 6l-8 8" />
                  </svg>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <input
          ref={inputRef}
          id={id}
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onFocus={() => {
            setOpen(true);
            setFocused(true);
          }}
          onBlur={() => {
            setOpen(false);
            setFocused(false);
          }}
          placeholder={full ? "" : tags.length ? "" : placeholder}
          aria-describedby={`${id}-hint`}
          role={suggestions.length ? "combobox" : undefined}
          aria-autocomplete={suggestions.length ? "list" : undefined}
          aria-expanded={suggestions.length ? showList : undefined}
          aria-controls={suggestions.length ? listId : undefined}
          aria-activedescendant={showList ? optId(active) : undefined}
          className={`h-8 flex-1 bg-transparent ${full ? "w-0 min-w-0" : "min-w-[5rem]"} px-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none`}
        />
      </div>

      <AnimatePresence>
        {showList && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label={`${label} suggestions`}
            initial={reduce ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 600, damping: 38 }}
            className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg shadow-slate-900/10"
          >
            {matches.map((m, i) => {
              const cat = m.category ? CATEGORIES[m.category] : null;
              const q = query.trim();
              const at = q ? m.value.toLowerCase().indexOf(q.toLowerCase()) : -1;
              return (
                <li
                  key={m.value}
                  id={optId(i)}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (add(m)) setQuery("");
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-sm ${i === active ? "bg-slate-100 text-slate-900" : "text-slate-700"}`}
                >
                  <span className="flex items-center gap-2.5">
                    {cat && <span aria-hidden="true" className={`h-2 w-2 rounded-full ${cat.dot}`} />}
                    <span>
                      {at >= 0 ? (
                        <>
                          {m.value.slice(0, at)}
                          <span className="font-semibold text-slate-900">{m.value.slice(at, at + q.length)}</span>
                          {m.value.slice(at + q.length)}
                        </>
                      ) : (
                        m.value
                      )}
                    </span>
                  </span>
                  {cat ? <span className="text-xs text-slate-500">{cat.label}</span> : i === active ? <kbd className="rounded border border-slate-300 px-1.5 text-[11px] font-sans text-slate-500">Enter</kbd> : null}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
      </div>

      <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-slate-600">
        {hint}
      </p>
      <p className="sr-only" aria-live="polite">
        {notice}
      </p>
      <AnimatePresence>
        {notice && (notice.startsWith('"') || notice.startsWith("You can")) && (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            aria-hidden="true"
            className="mt-1 text-xs font-medium text-rose-600"
          >
            {notice}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Demo: three variants ---------- */

export default function ReactTagInputDemo() {
  return (
    <section className="min-h-[760px] bg-stone-50 px-4 pb-72 pt-14 sm:px-8" style={{ fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Tag input</h2>
        <p className="mt-1 text-sm text-slate-600">Press Enter or comma to add. Backspace removes the last tag. Paste a comma separated list to add many.</p>

        <div className="mt-10 space-y-12">
          <TagInput
            label="Skills"
            hint="Plain: free text, no list. Duplicates are refused and the existing chip shakes."
            placeholder="Add a skill"
            initial={[{ value: "React" }, { value: "TypeScript" }, { value: "Figma" }]}
            max={8}
          />
          <TagInput
            label="Issue labels"
            hint="Coloured by category: area, priority and team. Anything typed that is not on the list becomes a grey custom label."
            placeholder="Add a label"
            initial={[
              { value: "checkout", category: "area" },
              { value: "urgent", category: "priority" },
              { value: "platform", category: "team" },
              { value: "needs-repro", category: "custom" },
            ]}
            suggestions={LABELS}
            coloured
            max={8}
          />
          <TagInput
            label="Tech stack"
            hint="With suggestions: use the arrow keys to move through the list and Enter to pick."
            placeholder="Search technologies"
            initial={[{ value: "Tailwind" }, { value: "Postgres" }]}
            suggestions={SKILLS}
            max={6}
            startQuery="t"
            startOpen
          />
        </div>
      </div>
    </section>
  );
}
