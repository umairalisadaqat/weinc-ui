import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* ---------- Content: edit the tabs here ---------- */

const underlineTabs = [
  { label: "Overview", body: "Fernleigh Ledger keeps every invoice, receipt and payout in one searchable place. Most teams finish setup in an afternoon." },
  { label: "Integrations", body: "Connect your bank feeds, payroll and storefront. Transactions arrive overnight and are matched to open invoices automatically." },
  { label: "Billing", body: "You are on the Team plan, billed yearly. Your next renewal is on 14 March for $1,140 across six seats." },
  { label: "Activity", body: "Priya approved three expense reports and Tomasz exported the Q3 profit and loss statement this morning." },
];

const segmentTabs = [
  { label: "Day", value: "$2,480", note: "Revenue today, up from $2,110 yesterday" },
  { label: "Week", value: "$16,920", note: "Revenue this week across 412 orders" },
  { label: "Month", value: "$71,305", note: "Revenue in October so far, 18 days in" },
  { label: "Year", value: "$604,770", note: "Revenue since January across all stores" },
];

const verticalTabs = [
  { label: "Profile", title: "Public profile", body: "Your name, photo and short bio appear on shared documents and in comment threads." },
  { label: "Security", title: "Sign-in and security", body: "Two-step sign-in is on. You last changed your password 41 days ago from a laptop in Lisbon." },
  { label: "Notifications", title: "Email notifications", body: "You get a daily summary at 8:00 and an instant email when someone mentions you." },
  { label: "Team", title: "Team members", body: "Six people share this workspace. Two invitations are still waiting to be accepted." },
];

type IconName = "inbox" | "flag" | "check" | "archive";
const iconTabs: { label: string; icon: IconName; count: number; rows: string[] }[] = [
  { label: "Inbox", icon: "inbox", count: 12, rows: ["Refund request from Mara Okafor", "Shipping question on order 4471", "Invoice copy for Hollis & Reed"] },
  { label: "Flagged", icon: "flag", count: 3, rows: ["Chargeback opened on order 4390", "Address mismatch on order 4462"] },
  { label: "Solved", icon: "check", count: 128, rows: ["Password reset for Dev Kapoor", "Bulk discount for Linden School"] },
  { label: "Archive", icon: "archive", count: 0, rows: [] },
];

/** Preview only: the first two demos step through their tabs until someone touches them. Set to false in your app. */
const DEMO_AUTOPLAY = true;

/* ---------- Shared keyboard behaviour (WAI-ARIA tabs pattern) ---------- */

function useTabs(count: number, orientation: "horizontal" | "vertical" = "horizontal", autoplay = false) {
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!DEMO_AUTOPLAY || !autoplay || touched || reduce) return;
    const t = window.setInterval(() => setActive((a) => (a + 1) % count), 1400);
    return () => window.clearInterval(t);
  }, [autoplay, touched, reduce, count]);

  const focusTab = (i: number) => {
    setTouched(true);
    setActive(i);
    refs.current[i]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const next = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    const prev = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    let target: number | null = null;
    if (e.key === next) target = (active + 1) % count;
    else if (e.key === prev) target = (active - 1 + count) % count;
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = count - 1;
    if (target !== null) {
      e.preventDefault();
      focusTab(target);
    }
  };

  const tabProps = (i: number) => ({
    ref: (el: HTMLButtonElement | null) => {
      refs.current[i] = el;
    },
    id: `${baseId}-tab-${i}`,
    role: "tab" as const,
    type: "button" as const,
    "aria-selected": active === i,
    "aria-controls": `${baseId}-panel-${i}`,
    tabIndex: active === i ? 0 : -1,
    onClick: () => {
      setTouched(true);
      setActive(i);
    },
    onFocus: () => setTouched(true),
    onKeyDown,
  });

  const panelProps = (i: number) => ({
    id: `${baseId}-panel-${i}`,
    role: "tabpanel" as const,
    "aria-labelledby": `${baseId}-tab-${i}`,
    tabIndex: 0,
    hidden: active !== i,
  });

  return { active, tabProps, panelProps, layoutKey: baseId };
}

function useSpring() {
  const reduce = useReducedMotion();
  return reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 520, damping: 40, mass: 0.9 };
}

/* ---------- Variant 1: underline with sliding indicator ---------- */

function UnderlineTabs() {
  const { active, tabProps, panelProps, layoutKey } = useTabs(underlineTabs.length, "horizontal", true);
  const spring = useSpring();
  return (
    <div>
      <div role="tablist" aria-label="Account sections" className="flex gap-1 overflow-x-auto border-b border-stone-200 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_85%,transparent)] sm:[mask-image:none]">
        {underlineTabs.map((t, i) => (
          <button
            key={t.label}
            {...tabProps(i)}
            className={`relative shrink-0 rounded-t-md px-3 pb-3 pt-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1d4ed8] ${
              active === i ? "text-stone-900" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {t.label}
            {active === i && (
              <motion.span
                layoutId={`${layoutKey}-underline`}
                transition={spring}
                className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-blue-700"
              />
            )}
          </button>
        ))}
      </div>
      {underlineTabs.map((t, i) => (
        <div key={t.label} {...panelProps(i)} className="-mx-2 mt-2 rounded-md px-2 py-2 text-sm leading-6 text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]">
          {t.body}
        </div>
      ))}
    </div>
  );
}

/* ---------- Variant 2: pill / segmented control ---------- */

function SegmentedTabs() {
  const { active, tabProps, panelProps, layoutKey } = useTabs(segmentTabs.length, "horizontal", true);
  const spring = useSpring();
  return (
    <div>
      <div role="tablist" aria-label="Revenue period" className="grid grid-cols-4 rounded-full bg-stone-200/70 p-1">
        {segmentTabs.map((t, i) => (
          <button
            key={t.label}
            {...tabProps(i)}
            className={`relative h-10 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] ${
              active === i ? "text-stone-900" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {active === i && (
              <motion.span
                layoutId={`${layoutKey}-pill`}
                transition={spring}
                className="absolute inset-0 rounded-full bg-white shadow-[0_1px_2px_rgba(28,25,23,0.12),0_2px_8px_rgba(28,25,23,0.06)]"
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>
      {segmentTabs.map((t, i) => (
        <div key={t.label} {...panelProps(i)} className="rounded-md pt-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-4">
          <p className="text-3xl font-semibold tracking-tight text-stone-900 [font-variant-numeric:tabular-nums]">{t.value}</p>
          <p className="mt-1 text-sm text-stone-600">{t.note}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------- Variant 3: vertical ---------- */

function VerticalTabs() {
  const { active, tabProps, panelProps, layoutKey } = useTabs(verticalTabs.length, "vertical");
  const spring = useSpring();
  return (
    <div className="flex gap-5">
      <div role="tablist" aria-label="Settings" aria-orientation="vertical" className="flex w-32 shrink-0 flex-col gap-0.5 border-l border-stone-200 sm:w-36">
        {verticalTabs.map((t, i) => (
          <button
            key={t.label}
            {...tabProps(i)}
            className={`relative -ml-px h-10 rounded-r-md pl-4 pr-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0f766e] ${
              active === i ? "text-[#0f766e]" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {active === i && (
              <motion.span
                layoutId={`${layoutKey}-rail`}
                transition={spring}
                className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-[#0f766e]"
              />
            )}
            {active === i && (
              <motion.span
                layoutId={`${layoutKey}-wash`}
                transition={spring}
                className="absolute inset-y-0 left-[2px] right-0 rounded-r-md bg-[#0f766e]/[0.07]"
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>
      {verticalTabs.map((t, i) => (
        <div key={t.label} {...panelProps(i)} className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]">
          <h3 className="text-sm font-semibold text-stone-900">{t.title}</h3>
          <p className="mt-1.5 text-sm leading-6 text-stone-600">{t.body}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------- Variant 4: icons and counts ---------- */

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    inbox: <path d="M3 12h4l1.5 2.5h3L13 12h4M4.5 5h11l1.5 7v3.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V12l1.5-7Z" />,
    flag: <path d="M5 17V3.5m0 0h9l-2 3.5 2 3.5H5" />,
    check: <path d="m4.5 10.5 3.5 3.5 7.5-8" />,
    archive: <path d="M3 4.5h14v3H3zM4.5 7.5V16h11V7.5M8 10.5h4" />,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function IconCountTabs() {
  const { active, tabProps, panelProps, layoutKey } = useTabs(iconTabs.length);
  const spring = useSpring();
  return (
    <div>
      <div role="tablist" aria-label="Support queues" className="flex gap-0.5 overflow-x-auto [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_82%,transparent)] sm:[mask-image:none]">
        {iconTabs.map((t, i) => (
          <button
            key={t.label}
            {...tabProps(i)}
            aria-label={`${t.label}, ${t.count} ${t.count === 1 ? "conversation" : "conversations"}`}
            className={`relative flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbbf24] ${
              active === i ? "text-white" : "text-stone-400 hover:text-stone-100"
            }`}
          >
            {active === i && (
              <motion.span layoutId={`${layoutKey}-chip`} transition={spring} className="absolute inset-0 rounded-lg bg-white/[0.09] ring-1 ring-inset ring-white/10" />
            )}
            <span className="relative z-10"><Icon name={t.icon} /></span>
            <span className="relative z-10">{t.label}</span>
            {t.count > 0 && <span
              className={`relative z-10 min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-xs font-semibold [font-variant-numeric:tabular-nums] transition-colors ${
                active === i ? "bg-[#fbbf24] text-stone-950" : "bg-white/[0.08] text-stone-400"
              }`}
            >
              {t.count}
            </span>}
          </button>
        ))}
      </div>
      {iconTabs.map((t, i) => (
        <div key={t.label} {...panelProps(i)} className="mt-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbbf24]">
          {t.rows.length ? (
            <ul className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {t.rows.map((r) => (
                <li key={r} className="py-2.5 text-sm text-stone-300">{r}</li>
              ))}
            </ul>
          ) : (
            <p className="py-2.5 text-sm text-stone-400">Nothing archived yet. Closed conversations move here after 30 days.</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Showcase ---------- */

function Card({ title, dark, children }: { title: string; dark?: boolean; children: ReactNode }) {
  return (
    <section
      className={`min-w-0 rounded-2xl p-5 sm:p-6 ${
        dark ? "bg-[#161412] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_10px_30px_-12px_rgba(0,0,0,0.5)]" : "bg-white shadow-[0_0_0_1px_rgba(28,25,23,0.06),0_8px_24px_-12px_rgba(28,25,23,0.18)]"
      }`}
    >
      <h2 className={`mb-4 text-xs font-semibold uppercase tracking-[0.12em] ${dark ? "text-stone-400" : "text-stone-500"}`}>{title}</h2>
      {children}
    </section>
  );
}

export default function ReactTabsVariants() {
  return (
    <div className="flex min-h-[640px] items-center bg-[#f3f1ec] px-4 py-10 font-['Inter_Tight','Inter',ui-sans-serif,system-ui,sans-serif] sm:px-8 sm:py-14">
      <div className="mx-auto grid w-full max-w-5xl gap-5 md:grid-cols-2">
        <Card title="Underline">
          <UnderlineTabs />
        </Card>
        <Card title="Segmented">
          <SegmentedTabs />
        </Card>
        <Card title="Vertical">
          <VerticalTabs />
        </Card>
        <Card title="Icons and counts" dark>
          <IconCountTabs />
        </Card>
      </div>
    </div>
  );
}
