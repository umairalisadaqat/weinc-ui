import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";

/*
  React modal popup in one file, four variants.
  In your app: wrap <Modal> output in createPortal(..., document.body) from react-dom,
  change "absolute" to "fixed" on the overlay and panel, and pass document.body to
  lockScroll. The demo keeps everything inside a framed box so it can be previewed.
*/

type Variant = "center" | "sheet" | "drawer";
type Which = "confirm" | "form" | "sheet" | "drawer" | null;

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const projects = [
  { name: "Spring lookbook", pages: 6, edited: "2 hours ago", tone: "#d9e7dd", img: "https://images.pexels.com/photos/39835429/pexels-photo-39835429.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Woman in a red blouse posing on a resort balcony by the pool" },
  { name: "Harbour Dental", pages: 4, edited: "Yesterday", tone: "#dfe6f1", img: "https://images.pexels.com/photos/4270379/pexels-photo-4270379.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Dentist treating a patient in a bright modern clinic" },
  { name: "Fold & Grain bakery", pages: 8, edited: "Mon", tone: "#f1e6d6", img: "https://images.pexels.com/photos/8633662/pexels-photo-8633662.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Freshly baked rustic sourdough loaves and buns" },
  { name: "Northfield Cycling", pages: 5, edited: "Last week", tone: "#e9e1ef", img: "https://images.pexels.com/photos/5735768/pexels-photo-5735768.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Smiling cyclist racing a road bike on a sunny day" },
  { name: "Lumen Studio", pages: 3, edited: "Sep 28", tone: "#f3dfdc", img: "https://images.pexels.com/photos/30332804/pexels-photo-30332804.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Photography studio with a mocha backdrop and lighting" },
  { name: "Orchard Lane Rentals", pages: 7, edited: "Sep 21", tone: "#e1ece9", img: "https://images.pexels.com/photos/8146214/pexels-photo-8146214.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Bright empty room with wooden floors in a rental flat" },
];

const lineItems = [
  { label: "Studio plan, October", amount: 29 },
  { label: "Extra domain: harbourdental.example", amount: 12 },
  { label: "Storage, 20 GB add-on", amount: 4 },
];

/* Locks scrolling on one element and keeps the scrollbar gap so nothing shifts. */
function lockScroll(el: HTMLElement) {
  const gap = el.offsetWidth - el.clientWidth;
  const prev = { overflow: el.style.overflow, paddingRight: el.style.paddingRight };
  el.style.overflow = "hidden";
  if (gap > 0) el.style.paddingRight = `${gap}px`;
  return () => {
    el.style.overflow = prev.overflow;
    el.style.paddingRight = prev.paddingRight;
  };
}

function useDialogBehaviour(opts: {
  open: boolean;
  onClose: () => void;
  panelRef: RefObject<HTMLDivElement>;
  backgroundRef: RefObject<HTMLElement>;
  scrollRef: RefObject<HTMLElement>;
  triggerRef: RefObject<HTMLButtonElement>;
  initialFocusRef?: RefObject<HTMLElement>;
  moveFocus: boolean;
}) {
  const { open, onClose, panelRef, backgroundRef, scrollRef, triggerRef, initialFocusRef, moveFocus } = opts;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const bg = backgroundRef.current;
    const scroller = scrollRef.current;
    bg?.setAttribute("inert", "");
    bg?.setAttribute("aria-hidden", "true");
    const unlock = scroller ? lockScroll(scroller) : undefined;

    if (moveFocus) {
      const target = initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      requestAnimationFrame(() => target?.focus({ preventScroll: true }));
    }

    const onKey = (e: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.contains(document.activeElement)) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      bg?.removeAttribute("inert");
      bg?.removeAttribute("aria-hidden");
      unlock?.();
      if (moveFocus || panelRef.current?.contains(document.activeElement)) {
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
  }, [open, moveFocus, backgroundRef, scrollRef, panelRef, triggerRef, initialFocusRef]);
}

function Modal(props: {
  open: boolean;
  onClose: () => void;
  variant: Variant;
  title: string;
  description?: string;
  role?: "dialog" | "alertdialog";
  closeOnOverlay?: boolean;
  backgroundRef: RefObject<HTMLElement>;
  scrollRef: RefObject<HTMLElement>;
  triggerRef: RefObject<HTMLButtonElement>;
  initialFocusRef?: RefObject<HTMLElement>;
  moveFocus: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { open, onClose, variant, title, description, role = "dialog", closeOnOverlay = true, children, footer } = props;
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const reduce = useReducedMotion();
  useDialogBehaviour({ ...props, panelRef });

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 36, mass: 0.9 };
  const motionFor: Record<Variant, { initial: object; animate: object; exit: object }> = {
    center: { initial: { opacity: 0, y: 14, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 8, scale: 0.98 } },
    sheet: { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } },
    drawer: { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } },
  };
  const placement: Record<Variant, string> = {
    center:
      "inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(440px,calc(100%-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
    sheet: "inset-x-0 bottom-0 max-h-[88%] rounded-t-3xl sm:mx-auto sm:max-w-lg",
    drawer: "inset-y-0 right-0 w-full max-w-sm sm:rounded-l-2xl",
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            className="absolute inset-0 z-40 bg-stone-950/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={closeOnOverlay ? onClose : undefined}
            aria-hidden="true"
          />
          {/* Wrapper carries the CSS centring transform so framer-motion can own the inner one. */}
          <div className={`absolute z-50 flex flex-col ${placement[variant]}`}>
            <motion.div
              ref={panelRef}
              role={role}
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descId : undefined}
              className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-white shadow-[0_24px_60px_-12px_rgba(20,18,15,0.35),0_0_0_1px_rgba(20,18,15,0.06)] ${
                variant === "center" ? "sm:rounded-2xl" : variant === "sheet" ? "rounded-t-3xl" : "sm:rounded-l-2xl"
              }`}
              {...motionFor[variant]}
              transition={spring}
              drag={variant === "sheet" && !reduce ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={variant === "sheet" ? onDragEnd : undefined}
            >
              {variant === "sheet" && (
                <div className="flex justify-center pt-3" aria-hidden="true">
                  <span className="h-1.5 w-10 rounded-full bg-stone-300" />
                </div>
              )}
              <div className="flex items-start gap-4 px-6 pt-5">
                <div className="min-w-0 flex-1">
                  <h2 id={titleId} className="text-[17px] font-semibold tracking-tight text-stone-900">
                    {title}
                  </h2>
                  {description && (
                    <p id={descId} className="mt-1 text-sm leading-relaxed text-stone-600">
                      {description}
                    </p>
                  )}
                </div>
                {role === "dialog" && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="-mr-2 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                  >
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-4">{children}</div>
              {footer && <div className="flex flex-col-reverse gap-2 border-t border-stone-100 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

const btn =
  "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transform-none";
const btnPrimary = `${btn} bg-stone-900 text-white hover:bg-stone-800 focus-visible:ring-emerald-700`;
const btnGhost = `${btn} border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 focus-visible:ring-emerald-700`;
const btnDanger = `${btn} bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600`;

export default function ReactModalPopupDialogs() {
  // Starts open so the preview shows a dialog; nothing steals focus until someone clicks.
  const [open, setOpen] = useState<Which>("form");
  const [userOpened, setUserOpened] = useState(false);
  const [name, setName] = useState("Autumn menu");
  const [visibility, setVisibility] = useState("team");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [access, setAccess] = useState("view");

  const bgRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const confirmTrig = useRef<HTMLButtonElement>(null);
  const formTrig = useRef<HTMLButtonElement>(null);
  const sheetTrig = useRef<HTMLButtonElement>(null);
  const drawerTrig = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const show = (w: Which) => {
    setUserOpened(true);
    setError("");
    setCopied(false);
    setOpen(w);
  };
  const close = () => setOpen(null);
  const shared = { backgroundRef: bgRef, scrollRef, moveFocus: userOpened, onClose: close };

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give the project a name.");
      nameRef.current?.focus();
      return;
    }
    close();
  };
  const total = lineItems.reduce((s, i) => s + i.amount, 0);

  const triggers: { label: string; w: Exclude<Which, null>; ref: RefObject<HTMLButtonElement>; cls: string }[] = [
    { label: "Delete project", w: "confirm", ref: confirmTrig, cls: btnGhost },
    { label: "New project", w: "form", ref: formTrig, cls: btnPrimary },
    { label: "Share sheet", w: "sheet", ref: sheetTrig, cls: btnGhost },
    { label: "Invoice drawer", w: "drawer", ref: drawerTrig, cls: btnGhost },
  ];

  return (
    <div
      className="flex min-h-[640px] items-center justify-center bg-[#efece6] px-4 py-8"
      style={{ fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, sans-serif' }}
    >
      <div className="relative h-[576px] w-full max-w-4xl overflow-hidden rounded-[20px] bg-stone-50 ring-1 ring-stone-900/10">
        <div ref={bgRef} className="h-full">
          <div ref={scrollRef} className="h-full overflow-y-auto">
            <header className="flex flex-col gap-4 border-b border-stone-200 bg-white px-5 py-5 sm:px-7">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-stone-900">Projects</h2>
                <p className="text-sm text-stone-600">Open any of the four dialogs below.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {triggers.map((t) => (
                  <button
                    key={t.w}
                    ref={t.ref}
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={open === t.w}
                    onClick={() => show(t.w)}
                    className={t.cls}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </header>
            <ul className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">
              {projects.map((p) => (
                <li key={p.name} className="rounded-2xl border border-stone-200 bg-white p-3">
                  <img src={p.img} alt={p.alt} width={600} height={400} loading="lazy" className="h-24 w-full rounded-xl object-cover" style={{ background: p.tone }} />
                  <p className="mt-3 text-sm font-medium text-stone-900">{p.name}</p>
                  <p className="text-xs text-stone-600">
                    {p.pages} pages · edited {p.edited}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 1. Confirm dialog: alertdialog, safe button focused first, overlay click ignored */}
        <Modal
          {...shared}
          open={open === "confirm"}
          variant="center"
          role="alertdialog"
          closeOnOverlay={false}
          triggerRef={confirmTrig}
          initialFocusRef={cancelRef}
          title="Delete Spring lookbook?"
          description="Its 6 pages and published address go offline straight away. This cannot be undone."
          footer={
            <>
              <button ref={cancelRef} type="button" onClick={close} className={btnGhost}>
                Keep project
              </button>
              <button type="button" onClick={close} className={btnDanger}>
                Delete project
              </button>
            </>
          }
        >
          <div className="mb-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            Visitors to lookbook.example will see a not found page.
          </div>
        </Modal>

        {/* 2. Form dialog: full screen on phones, centred card from sm up */}
        <Modal
          {...shared}
          open={open === "form"}
          variant="center"
          triggerRef={formTrig}
          initialFocusRef={nameRef}
          title="New project"
          description="Name it now; you can change everything later."
          footer={
            <>
              <button type="button" onClick={close} className={btnGhost}>
                Cancel
              </button>
              <button type="submit" form="s2-modal-form" className={btnPrimary}>
                Create project
              </button>
            </>
          }
        >
          <form id="s2-modal-form" onSubmit={submit} noValidate className="space-y-5 pb-2">
            <div>
              <label htmlFor="s2-modal-name" className="text-sm font-medium text-stone-800">
                Project name
              </label>
              <input
                ref={nameRef}
                id="s2-modal-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby="s2-modal-name-hint"
                className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-3.5 text-[15px] text-stone-900 outline-none transition focus:ring-2 ${
                  error ? "border-red-500 focus:ring-red-500/30" : "border-stone-300 focus:border-emerald-700 focus:ring-emerald-700/20"
                }`}
              />
              <p id="s2-modal-name-hint" className={`mt-1.5 text-xs ${error ? "text-red-700" : "text-stone-600"}`}>
                {error || `Address: ${slug || "your-project"}.site.example`}
              </p>
            </div>
            <fieldset>
              <legend className="text-sm font-medium text-stone-800">Who can edit</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  { v: "me", t: "Only me", d: "Private draft" },
                  { v: "team", t: "My team", d: "4 editors" },
                ].map((o) => (
                  <label
                    key={o.v}
                    className={`cursor-pointer rounded-xl border px-3.5 py-3 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-700 ${
                      visibility === o.v ? "border-emerald-700 bg-emerald-50/60" : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="s2-modal-vis"
                      aria-label={`${o.t}, ${o.d}`}
                      value={o.v}
                      checked={visibility === o.v}
                      onChange={() => setVisibility(o.v)}
                      className="sr-only"
                    />
                    <span className="block text-sm font-medium text-stone-900">{o.t}</span>
                    <span className="block text-xs text-stone-600">{o.d}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </form>
        </Modal>

        {/* 3. Bottom sheet: drag the handle down to dismiss */}
        <Modal {...shared} open={open === "sheet"} variant="sheet" triggerRef={sheetTrig} title="Share Harbour Dental" description="Anyone with the link can see the draft.">
          <div className="space-y-4 pb-5">
            <div className="flex gap-2">
              <label htmlFor="s2-modal-link" className="sr-only">
                Share link
              </label>
              <input
                id="s2-modal-link"
                readOnly
                value="harbour-dental.site.example/draft"
                className="h-11 min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-emerald-700/30"
              />
              <button type="button" onClick={() => setCopied(true)} className={btnPrimary} aria-live="polite">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div role="radiogroup" aria-label="Link access" className="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
              {[
                { v: "view", t: "Can view" },
                { v: "comment", t: "Can comment" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  role="radio"
                  aria-checked={access === o.v}
                  onClick={() => setAccess(o.v)}
                  className={`h-10 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                    access === o.v ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {o.t}
                </button>
              ))}
            </div>
          </div>
        </Modal>

        {/* 4. Side drawer */}
        <Modal
          {...shared}
          open={open === "drawer"}
          variant="drawer"
          triggerRef={drawerTrig}
          title="Invoice INV-2041"
          description="Paid 3 October by card ending 4410."
          footer={
            <button type="button" onClick={close} className={btnPrimary}>
              Download PDF
            </button>
          }
        >
          <div className="mb-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
            <span className="text-sm font-medium text-emerald-900">Paid in full</span>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">Receipt sent</span>
          </div>
          <dl className="divide-y divide-stone-100">
            {lineItems.map((i) => (
              <div key={i.label} className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-stone-700">{i.label}</dt>
                <dd className="tabular-nums text-stone-900">${i.amount.toFixed(2)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 py-3 text-sm font-semibold">
              <dt className="text-stone-900">Total</dt>
              <dd className="tabular-nums text-stone-900">${total.toFixed(2)}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-xl border border-stone-200 px-4 py-3 text-sm leading-relaxed text-stone-700">
            <p className="font-medium text-stone-900">Billed to</p>
            <p>Harbour Dental Ltd</p>
            <p>14 Quay Street, Bristol BS1 4DJ</p>
            <p>accounts@harbourdental.example</p>
          </div>
        </Modal>
      </div>
    </div>
  );
}
