import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ---------- Edit the menu here: the desktop bar and the phone menu both read from it ---------- */
type Item = { label: string; text: string; icon: string };
type NavLink = { label: string; href: string; mega?: Item[]; menu?: Item[] };

const brand = "Larkspur";
const ACTIVE = "Pricing"; // the page you are on: gets aria-current="page"
const COMPACT_BELOW = 768; // the bar switches to the hamburger below this width (of its own box)

const links: NavLink[] = [
  {
    label: "Product",
    href: "#",
    mega: [
      { label: "Booking pages", text: "One link clients use to pick a free hour.", icon: "M4 5h16v15H4zM4 10h16M9 3v4M15 3v4" },
      { label: "Team calendars", text: "See every chair, room and person at once.", icon: "M4 6h16M4 12h16M4 18h10" },
      { label: "Reminders", text: "Texts and emails that cut no-shows.", icon: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4" },
      { label: "Payments", text: "Take deposits when the slot is booked.", icon: "M3 7h18v10H3zM3 11h18M7 15h3" },
      { label: "Reports", text: "Busy hours, repeat clients, takings.", icon: "M5 20V10M12 20V4M19 20v-7" },
      { label: "Integrations", text: "Sync with the calendar you already use.", icon: "M9 7h6v4H9zM12 11v4M6 15h12v5H6z" },
    ],
  },
  { label: "Pricing", href: "#" },
  { label: "Customers", href: "#" },
  {
    label: "Resources",
    href: "#",
    menu: [
      { label: "Help centre", text: "Guides for every setting.", icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01" },
      { label: "Changelog", text: "What shipped this month.", icon: "M5 4h14v16H5zM9 9h6M9 13h6" },
      { label: "Templates", text: "Ready booking pages by trade.", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
    ],
  },
  { label: "Docs", href: "#" },
];

const variants = {
  light: { name: "Light", bar: "bg-white/95 text-slate-900 border-slate-200", link: "text-slate-600 hover:text-slate-900 hover:bg-slate-100", on: "text-slate-900", dot: "bg-emerald-600", cta: "bg-slate-900 text-white hover:bg-slate-700", ghost: "text-slate-700 hover:bg-slate-100", page: "bg-slate-50", ring: "focus-visible:ring-emerald-600 focus-visible:ring-offset-white" },
  dark: { name: "Dark", bar: "bg-[#0d1412]/95 text-white border-white/10", link: "text-slate-300 hover:text-white hover:bg-white/10", on: "text-white", dot: "bg-emerald-400", cta: "bg-emerald-400 text-[#0d1412] hover:bg-emerald-300", ghost: "text-slate-200 hover:bg-white/10", page: "bg-[#0a0f0e]", ring: "focus-visible:ring-emerald-400 focus-visible:ring-offset-[#0d1412]" },
  pill: { name: "Floating", bar: "bg-white/95 text-slate-900 border-slate-200", link: "text-slate-600 hover:text-slate-900 hover:bg-slate-100", on: "text-slate-900", dot: "bg-orange-500", cta: "bg-orange-600 text-white hover:bg-orange-700", ghost: "text-slate-700 hover:bg-slate-100", page: "bg-[#f4efe8]", ring: "focus-visible:ring-orange-600 focus-visible:ring-offset-white" },
} as const;
type VariantKey = keyof typeof variants;

/* ---------- Small hooks ---------- */
/** True once the scroll box (or the window when no ref is given) has moved past `offset`. */
function useScrolled(box?: RefObject<HTMLElement>, offset = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el: HTMLElement | Window = box?.current ?? window;
    const read = () => setScrolled((box?.current ? box.current.scrollTop : window.scrollY) > offset);
    read();
    el.addEventListener("scroll", read, { passive: true });
    return () => el.removeEventListener("scroll", read);
  }, [box, offset]);
  return scrolled;
}

/** Width of the navbar's own box, so it is responsive inside any container. */
function useCompact(ref: RefObject<HTMLElement>) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCompact(e.contentRect.width < COMPACT_BELOW));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return compact;
}

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Logo({ dot }: { dot: string }) {
  return (
    <span className="flex items-center gap-2 font-semibold tracking-tight">
      <span className={`grid h-7 w-7 place-items-center rounded-lg ${dot}`}>
        <svg viewBox="0 0 16 16" className="h-4 w-4 text-white" fill="currentColor" aria-hidden="true"><path d="M8 2c2 2.5 2 4.5 0 6-2-1.5-2-3.5 0-6zM3 9c2.5-.5 4 .5 5 3-2.5.5-4-.5-5-3zm10 0c-1 2.5-2.5 3.5-5 3 1-2.5 2.5-3.5 5-3z" /></svg>
      </span>
      {brand}
    </span>
  );
}

/* ---------- The animated hamburger: three bars that fold into an X ---------- */
function Burger({ open, reduce }: { open: boolean; reduce: boolean }) {
  const t = reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 30 };
  return (
    <span className="relative block h-4 w-5" aria-hidden="true">
      <motion.span className="absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current" animate={open ? { y: 7, rotate: 45 } : { y: 0, rotate: 0 }} transition={t} />
      <motion.span className="absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current" animate={{ opacity: open ? 0 : 1, scaleX: open ? 0.2 : 1 }} transition={t} />
      <motion.span className="absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-current" animate={open ? { y: -7, rotate: -45 } : { y: 0, rotate: 0 }} transition={t} />
    </span>
  );
}

/* ---------- The navbar itself ---------- */
type NavbarProps = { variant: VariantKey; scrollBox?: RefObject<HTMLElement>; startOpen?: string | null; startMobileOpen?: boolean; forceScrolled?: boolean };

export function Navbar({ variant, scrollBox, startOpen = null, startMobileOpen = false, forceScrolled }: NavbarProps) {
  const v = variants[variant];
  const reduce = !!useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const compact = useCompact(root);
  const scrolledLive = useScrolled(scrollBox);
  const scrolled = forceScrolled ?? scrolledLive;
  const [open, setOpen] = useState<string | null>(startOpen);
  const [mobile, setMobile] = useState(startMobileOpen);
  const [section, setSection] = useState<string | null>("Product");
  const uid = useId();
  const burgerRef = useRef<HTMLButtonElement>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const ring = `focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${v.ring}`;
  const spring = reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 };

  useEffect(() => setOpen(startOpen), [startOpen]);
  // Close an open menu once the page has really scrolled (not on the tiny scroll a focus jump can cause).
  useEffect(() => {
    const box = scrollBox?.current;
    const top = () => (box ? box.scrollTop : window.scrollY);
    let start = top();
    const onScroll = () => { if (Math.abs(top() - start) > 48) { setOpen(null); start = top(); } };
    const target: HTMLElement | Window = box ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [scrollBox, open]);
  useEffect(() => {
    const away = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(null); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, []);

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (open) { triggers.current[open]?.focus(); setOpen(null); }
    if (mobile) { setMobile(false); burgerRef.current?.focus(); }
  };
  const openWithArrow = (e: KeyboardEvent, label: string) => {
    if (e.key !== "ArrowDown") return;
    e.preventDefault();
    setOpen(label);
    requestAnimationFrame(() => document.getElementById(`${uid}-${label}`)?.querySelector("a")?.focus());
  };

  const pill = variant === "pill";
  const shell = pill
    ? `mx-auto mt-3 w-[calc(100%-1.5rem)] border ${mobile ? "rounded-3xl" : "rounded-full"} shadow-[0_8px_30px_-12px_rgba(15,23,42,0.25)] ${scrolled ? "max-w-4xl" : "max-w-5xl"}`
    : `w-full border-b ${scrolled ? "shadow-[0_6px_24px_-14px_rgba(0,0,0,0.35)]" : "border-transparent"}`;

  return (
    <header ref={root} onKeyDown={onKey} className="sticky top-0 z-30">
      <div className={`${shell} ${v.bar} backdrop-blur transition-all duration-300 motion-reduce:transition-none`}>
        <nav aria-label="Main" className={`mx-auto flex max-w-6xl items-center gap-2 px-4 transition-[padding] duration-300 motion-reduce:transition-none sm:px-5 ${scrolled ? "py-2" : pill ? "py-2.5" : "py-4"}`}>
          <a href="#" className={`mr-auto rounded-lg ${ring}`} aria-label={`${brand} home`}><Logo dot={v.dot} /></a>

          {!compact && (
            <ul className="flex items-center gap-1 text-[15px]">
              {links.map((l) => {
                const panel = l.mega ?? l.menu;
                const isOpen = open === l.label;
                const current = l.label === ACTIVE;
                if (!panel)
                  return (
                    <li key={l.label}>
                      <a href={l.href} aria-current={current ? "page" : undefined} className={`relative flex h-10 items-center rounded-full px-3.5 font-medium transition-colors ${current ? v.on : v.link} ${ring}`}>
                        {l.label}
                        {current && <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${v.dot}`} aria-hidden="true" />}
                      </a>
                    </li>
                  );
                return (
                  <li key={l.label} className={l.mega ? "" : "relative"}>
                    <button
                      ref={(el) => { triggers.current[l.label] = el; }}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`${uid}-${l.label}`}
                      onClick={() => setOpen(isOpen ? null : l.label)}
                      onKeyDown={(e) => openWithArrow(e, l.label)}
                      className={`flex h-10 items-center gap-1 rounded-full px-3.5 font-medium transition-colors ${isOpen ? `${v.on} ${variant === "dark" ? "bg-white/10" : "bg-slate-100"}` : v.link} ${ring}`}
                    >
                      {l.label}
                      <motion.svg viewBox="0 0 16 16" className="h-3.5 w-3.5" animate={{ rotate: isOpen ? 180 : 0 }} transition={spring} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6l4 4 4-4" /></motion.svg>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          id={`${uid}-${l.label}`}
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 34 }}
                          className={`absolute z-40 mt-2 origin-top rounded-2xl border p-2 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] ${variant === "dark" ? "border-white/10 bg-[#121a18] text-white" : "border-slate-200 bg-white text-slate-900"} ${l.mega ? "left-3 right-3 mx-auto max-w-[760px]" : "right-0 w-72"}`}
                        >
                          {l.mega ? <Mega items={l.mega} dark={variant === "dark"} ring={ring} dot={v.dot} /> : <List items={panel} dark={variant === "dark"} ring={ring} />}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            {!compact && <a href="#" className={`flex h-10 items-center whitespace-nowrap rounded-full px-3.5 text-[15px] font-medium ${v.ghost} ${ring}`}>Sign in</a>}
            <a href="#" className={`flex h-10 items-center whitespace-nowrap rounded-full px-4 text-[15px] font-semibold transition-colors ${v.cta} ${ring}`}>Start free</a>
            {compact && (
              <button ref={burgerRef} type="button" aria-expanded={mobile} aria-controls={`${uid}-mobile`} aria-label={mobile ? "Close menu" : "Open menu"} onClick={() => setMobile((m) => !m)} className={`grid h-10 w-10 place-items-center rounded-full ${v.ghost} ${ring}`}>
                <Burger open={mobile} reduce={reduce} />
              </button>
            )}
          </div>
        </nav>

        <AnimatePresence initial={false}>
          {compact && mobile && (
            <motion.div id={`${uid}-mobile`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 34 }} className="overflow-hidden">
              <ul className={`space-y-0.5 px-3 pb-4 pt-1 text-[15px] ${pill ? "rounded-b-3xl" : ""}`}>
                {links.map((l, i) => {
                  const panel = l.mega ?? l.menu;
                  const expanded = section === l.label;
                  return (
                    <motion.li key={l.label} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? { duration: 0 } : { delay: 0.04 * i }}>
                      {panel ? (
                        <>
                          <button type="button" aria-expanded={expanded} onClick={() => setSection(expanded ? null : l.label)} className={`flex h-11 w-full items-center justify-between rounded-xl px-3 font-medium ${v.ghost} ${ring}`}>
                            {l.label}
                            <motion.svg viewBox="0 0 16 16" className="h-4 w-4" animate={{ rotate: expanded ? 180 : 0 }} transition={spring} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6l4 4 4-4" /></motion.svg>
                          </button>
                          <AnimatePresence initial={false}>
                            {expanded && (
                              <motion.ul initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={spring} className="overflow-hidden pl-3">
                                {panel.slice(0, 4).map((it) => (
                                  <li key={it.label}>
                                    <a href="#" className={`flex h-10 items-center gap-2.5 rounded-lg px-3 text-[14px] ${v.link} ${ring}`}><Icon d={it.icon} className="h-4 w-4" />{it.label}</a>
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <a href={l.href} aria-current={l.label === ACTIVE ? "page" : undefined} className={`flex h-11 items-center justify-between rounded-xl px-3 font-medium ${l.label === ACTIVE ? v.on : v.ghost} ${ring}`}>
                          {l.label}
                          {l.label === ACTIVE && <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} aria-hidden="true" />}
                        </a>
                      )}
                    </motion.li>
                  );
                })}
                <li className={`mt-2 border-t pt-3 ${variant === "dark" ? "border-white/10" : "border-slate-200"}`}>
                  <a href="#" className={`flex h-11 items-center justify-center rounded-full border text-[15px] font-medium ${variant === "dark" ? "border-white/15" : "border-slate-300"} ${v.ghost} ${ring}`}>Sign in</a>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function Mega({ items, dark, ring, dot }: { items: Item[]; dark: boolean; ring: string; dot: string }) {
  return (
    <div className="grid gap-2 md:grid-cols-[1fr_220px]">
      <ul className="grid gap-1 sm:grid-cols-2">
        {items.map((it) => (
          <li key={it.label}>
            <a href="#" className={`group flex gap-3 rounded-xl p-3 transition-colors ${dark ? "hover:bg-white/5" : "hover:bg-slate-50"} ${ring}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${dark ? "border-white/10 bg-white/5 text-emerald-300" : "border-slate-200 bg-white text-slate-700 group-hover:text-emerald-700"}`}><Icon d={it.icon} className="h-[18px] w-[18px]" /></span>
              <span>
                <span className="block text-[14px] font-semibold">{it.label}</span>
                <span className={`block text-[13px] leading-snug ${dark ? "text-slate-400" : "text-slate-600"}`}>{it.text}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <a href="#" className={`flex flex-col justify-between rounded-xl p-4 ${dark ? "bg-emerald-400/10" : "bg-slate-900 text-white"} ${ring}`}>
        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${dark ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white"}`}><span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />New</span>
        <span className="mt-4 grid grid-cols-5 gap-1" aria-hidden="true">
          {Array.from({ length: 15 }, (_, i) => (
            <span key={i} className={`h-4 rounded ${[2, 6, 11].includes(i) ? (dark ? "bg-emerald-400/70" : "bg-emerald-400") : [4, 8].includes(i) ? (dark ? "bg-white/25" : "bg-white/30") : dark ? "bg-white/10" : "bg-white/10"}`} />
          ))}
        </span>
        <span className="mt-4 block">
          <span className="block text-[15px] font-semibold leading-snug">Waitlists that fill cancelled slots for you</span>
          <span className={`mt-1 block text-[13px] ${dark ? "text-slate-300" : "text-slate-300"}`}>See how it works</span>
        </span>
      </a>
    </div>
  );
}

function List({ items, dark, ring }: { items: Item[]; dark: boolean; ring: string }) {
  return (
    <ul>
      {items.map((it) => (
        <li key={it.label}>
          <a href="#" className={`flex items-start gap-3 rounded-xl p-3 ${dark ? "hover:bg-white/5" : "hover:bg-slate-50"} ${ring}`}>
            <Icon d={it.icon} className={`mt-0.5 h-[18px] w-[18px] ${dark ? "text-emerald-300" : "text-slate-500"}`} />
            <span>
              <span className="block text-[14px] font-semibold">{it.label}</span>
              <span className={`block text-[13px] ${dark ? "text-slate-400" : "text-slate-600"}`}>{it.text}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Preview: desktop page on the left, phone with the menu open on the right ---------- */
function FakePage({ dark }: { dark: boolean }) {
  const line = dark ? "bg-white/10" : "bg-slate-200";
  return (
    <div className="mx-auto max-w-5xl px-6 pb-40 pt-16">
      <p className={`text-[13px] font-semibold uppercase tracking-wider ${dark ? "text-emerald-300" : "text-slate-500"}`}>Pricing</p>
      <h2 className={`mt-2 max-w-md text-3xl font-semibold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>One price per chair, every feature included.</h2>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[["Solo", "$19"], ["Studio", "$15"], ["Salon", "$12"]].map(([plan, price]) => (
          <div key={plan} className={`h-40 rounded-2xl border p-4 ${dark ? "border-white/10 bg-white/[0.03] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
            <p className={`text-[13px] font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>{plan}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{price}<span className={`text-[13px] font-normal ${dark ? "text-slate-400" : "text-slate-500"}`}> / chair / month</span></p>
            <div className={`mt-4 h-px ${line}`} />
          </div>
        ))}
      </div>
      <img src="https://images.pexels.com/photos/10318038/pexels-photo-10318038.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Hairdresser styling a client's hair in a bright salon" width={1200} height={800} loading="lazy" className="mt-8 aspect-[16/7] h-auto w-full rounded-2xl object-cover" />
    </div>
  );
}

function Frame({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <figure className={`flex min-w-0 flex-col ${className}`}>
      <figcaption className="mb-2 text-[12px] font-medium uppercase tracking-wider text-slate-600">{label}</figcaption>
      {children}
    </figure>
  );
}

export default function ResponsiveReactNavbar() {
  const [variant, setVariant] = useState<VariantKey>("light");
  const [demoOpen, setDemoOpen] = useState<string | null>("Product");
  const desk = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [touched, setTouched] = useState(false); // any click or key press ends the self-playing demo
  const dark = variant === "dark";

  // Idle demo: show the mega menu, then scroll the page so the bar shrinks. Stops on any input.
  useEffect(() => {
    const box = desk.current;
    if (reduce || touched) return;
    const t = window.setTimeout(() => { setDemoOpen(null); box?.scrollTo({ top: 160, behavior: "smooth" }); }, 2200);
    return () => window.clearTimeout(t);
  }, [reduce, touched]);

  return (
    <div onPointerDownCapture={() => setTouched(true)} onKeyDownCapture={() => setTouched(true)} className="min-h-[640px] bg-[#eef0ec] px-4 py-8 font-['Inter_Tight','Inter',ui-sans-serif,system-ui] sm:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div role="radiogroup" aria-label="Navbar style" className="mb-5 inline-flex rounded-full border border-slate-300 bg-white p-1">
          {(Object.keys(variants) as VariantKey[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={variant === k} onClick={() => setVariant(k)} className={`h-9 rounded-full px-4 text-[14px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${variant === k ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}>
              {variants[k].name}
            </button>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Frame label="Sticky bar: scroll inside to see it shrink">
            <div ref={desk} className={`relative h-[480px] overflow-y-auto rounded-2xl border border-slate-300 ${variants[variant].page}`}>
              <Navbar key={variant} variant={variant} scrollBox={desk} startOpen={demoOpen} />
              <FakePage dark={dark} />
            </div>
          </Frame>
          <Frame label="Phone, menu open" className="hidden sm:flex">
            <div className={`relative h-[480px] w-full overflow-hidden rounded-[28px] border-[6px] border-slate-900 ${variants[variant].page}`}>
              <Navbar key={variant} variant={variant} startMobileOpen forceScrolled={false} />
              <FakePage dark={dark} />
            </div>
          </Frame>
        </div>
      </div>
    </div>
  );
}
