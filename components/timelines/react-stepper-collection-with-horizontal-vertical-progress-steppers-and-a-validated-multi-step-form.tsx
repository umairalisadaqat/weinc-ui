import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

/*
  React stepper collection.
  Each piece is a live component and, beside it, the exact source you copy. Steppers are an
  ordered list with aria-current="step" on the active item; the multi-step form validates one
  step at a time and saves its draft in the browser so a refresh does not lose it.
*/

type Fam = "steppers" | "form";
type Lang = "react" | "html";
type Item = { f: Fam; name: string; note: string; Demo: () => JSX.Element; code: Partial<Record<Lang, string>>; wide?: boolean };

const FAMILIES: Record<Fam, string> = { steppers: "Steppers", form: "Multi-step form" };
const LANGS: Record<Lang, string> = { react: "React + Tailwind", html: "HTML + Tailwind" };

const CHECK = "M5 12.5l4.5 4.5L19 7.5";

/* ---------- 1. Horizontal numbered ---------- */
const H_STEPS = ["Cart", "Shipping", "Payment", "Review"];

function HorizontalStepper() {
  const [step, setStep] = useState(1);
  const last = H_STEPS.length - 1;
  return (
    <div>
      <p className="text-sm text-slate-600 sm:hidden">
        Step {step + 1} of {H_STEPS.length}: <span className="font-semibold text-slate-900">{H_STEPS[step]}</span>
      </p>
      <ol aria-label="Checkout progress" className="mt-2 flex items-center sm:mt-0">
        {H_STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label} aria-current={current ? "step" : undefined} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!done}
                onClick={() => setStep(i)}
                className="flex min-h-[40px] items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-default"
              >
                <span
                  className={
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors " +
                    (done ? "bg-teal-700 text-white" : current ? "border-2 border-teal-700 text-teal-800" : "border border-slate-300 text-slate-500")
                  }
                >
                  {done ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                      <path d={CHECK} />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={"hidden text-sm sm:inline " + (current ? "font-semibold text-slate-900" : "text-slate-600")}>{label}</span>
                {done && <span className="sr-only">, completed</span>}
              </button>
              {i < last && <span aria-hidden="true" className={"mx-2 h-px flex-1 sm:mx-3 " + (done ? "bg-teal-700" : "bg-slate-300")} />}
            </li>
          );
        })}
      </ol>
      <div className="mt-5 flex justify-between gap-3">
        <button type="button" onClick={() => setStep(Math.max(step - 1, 0))} disabled={step === 0} className="h-10 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-40">
          Back
        </button>
        <button type="button" onClick={() => setStep(Math.min(step + 1, last))} disabled={step === last} className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:opacity-40">
          Continue
        </button>
      </div>
    </div>
  );
}

const HORIZONTAL_REACT = `import { useState } from "react";

const H_STEPS = ["Cart", "Shipping", "Payment", "Review"];
const CHECK = "M5 12.5l4.5 4.5L19 7.5";

// Completed steps are buttons you can return to; future steps stay disabled.
// Below 640px the labels hide and a "Step 2 of 4" line takes their place.
export function HorizontalStepper() {
  const [step, setStep] = useState(1);
  const last = H_STEPS.length - 1;
  return (
    <div>
      <p className="text-sm text-slate-600 sm:hidden">
        Step {step + 1} of {H_STEPS.length}: <span className="font-semibold text-slate-900">{H_STEPS[step]}</span>
      </p>
      <ol aria-label="Checkout progress" className="mt-2 flex items-center sm:mt-0">
        {H_STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label} aria-current={current ? "step" : undefined} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!done}
                onClick={() => setStep(i)}
                className="flex min-h-[40px] items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-default"
              >
                <span
                  className={
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors " +
                    (done ? "bg-teal-700 text-white" : current ? "border-2 border-teal-700 text-teal-800" : "border border-slate-300 text-slate-500")
                  }
                >
                  {done ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                      <path d={CHECK} />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={"hidden text-sm sm:inline " + (current ? "font-semibold text-slate-900" : "text-slate-600")}>{label}</span>
                {done && <span className="sr-only">, completed</span>}
              </button>
              {i < last && <span aria-hidden="true" className={"mx-2 h-px flex-1 sm:mx-3 " + (done ? "bg-teal-700" : "bg-slate-300")} />}
            </li>
          );
        })}
      </ol>
      <div className="mt-5 flex justify-between gap-3">
        <button type="button" onClick={() => setStep(Math.max(step - 1, 0))} disabled={step === 0} className="h-10 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-40">
          Back
        </button>
        <button type="button" onClick={() => setStep(Math.min(step + 1, last))} disabled={step === last} className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:opacity-40">
          Continue
        </button>
      </div>
    </div>
  );
}`;

const HORIZONTAL_HTML = `<!-- Static snapshot: step 2 of 4. Move aria-current="step" and the classes as the user advances. -->
<ol aria-label="Checkout progress" class="flex items-center">
  <li class="flex flex-1 items-center">
    <span class="flex min-h-[40px] items-center gap-2">
      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-700 text-sm font-semibold text-white">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-4 w-4"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
      </span>
      <span class="hidden text-sm text-slate-600 sm:inline">Cart</span><span class="sr-only">, completed</span>
    </span>
    <span aria-hidden="true" class="mx-2 h-px flex-1 bg-teal-700 sm:mx-3"></span>
  </li>
  <li aria-current="step" class="flex flex-1 items-center">
    <span class="flex min-h-[40px] items-center gap-2">
      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-teal-700 text-sm font-semibold text-teal-800">2</span>
      <span class="hidden text-sm font-semibold text-slate-900 sm:inline">Shipping</span>
    </span>
    <span aria-hidden="true" class="mx-2 h-px flex-1 bg-slate-300 sm:mx-3"></span>
  </li>
  <li class="flex flex-1 items-center">
    <span class="flex min-h-[40px] items-center gap-2">
      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-300 text-sm font-semibold text-slate-500">3</span>
      <span class="hidden text-sm text-slate-600 sm:inline">Payment</span>
    </span>
    <span aria-hidden="true" class="mx-2 h-px flex-1 bg-slate-300 sm:mx-3"></span>
  </li>
  <li class="flex items-center">
    <span class="flex min-h-[40px] items-center gap-2">
      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-300 text-sm font-semibold text-slate-500">4</span>
      <span class="hidden text-sm text-slate-600 sm:inline">Review</span>
    </span>
  </li>
</ol>`;

/* ---------- 2. Vertical with descriptions ---------- */
const V_STEPS = [
  { title: "Connect your domain", body: "Point the A record at the address in Settings. Changes can take a few hours to spread." },
  { title: "Add your opening hours", body: "Hours appear in the footer and on the contact page, and update both at once." },
  { title: "Upload a logo", body: "A square SVG or PNG of at least 512px looks sharp in the header and browser tab." },
  { title: "Publish", body: "Your site goes live at your domain. You can keep editing afterwards." },
];

function VerticalStepper() {
  const [step, setStep] = useState(1);
  return (
    <ol aria-label="Site setup" className="relative">
      {V_STEPS.map((s, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={s.title} aria-current={current ? "step" : undefined} className="relative flex gap-4 pb-6 last:pb-0">
            {i < V_STEPS.length - 1 && <span aria-hidden="true" className={"absolute left-[15px] top-9 h-[calc(100%-2.5rem)] w-px " + (done ? "bg-slate-900" : "bg-slate-200")} />}
            <span className={"relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold " + (done ? "bg-slate-900 text-white" : current ? "bg-white text-slate-900 ring-2 ring-slate-900" : "bg-white text-slate-500 ring-1 ring-slate-300")}>
              {done ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                  <path d={CHECK} />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <div className="min-w-0 pt-1">
              <p className={"text-sm " + (current ? "font-semibold text-slate-900" : done ? "text-slate-700" : "text-slate-600")}>
                {s.title}
                {done && <span className="sr-only"> (done)</span>}
              </p>
              {current && (
                <div className="mt-1.5">
                  <p className="text-sm leading-relaxed text-slate-600">{s.body}</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setStep(i + 1)} className="h-10 rounded-md bg-slate-900 px-3.5 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2">
                      {i === V_STEPS.length - 1 ? "Publish site" : "Mark as done"}
                    </button>
                    {i > 0 && (
                      <button type="button" onClick={() => setStep(i - 1)} className="h-10 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900">
                        Back
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </li>
        );
      })}
      {step >= V_STEPS.length && (
        <li className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900" role="status">
          All four steps are done. The site is live.
        </li>
      )}
    </ol>
  );
}

const VERTICAL_REACT = `import { useState } from "react";

const CHECK = "M5 12.5l4.5 4.5L19 7.5";
const V_STEPS = [
  { title: "Connect your domain", body: "Point the A record at the address in Settings. Changes can take a few hours to spread." },
  { title: "Add your opening hours", body: "Hours appear in the footer and on the contact page, and update both at once." },
  { title: "Upload a logo", body: "A square SVG or PNG of at least 512px looks sharp in the header and browser tab." },
  { title: "Publish", body: "Your site goes live at your domain. You can keep editing afterwards." },
];

// Only the current step shows its description and actions, which keeps a long
// checklist short on a phone. The connecting line darkens as steps complete.
export function VerticalStepper() {
  const [step, setStep] = useState(1);
  return (
    <ol aria-label="Site setup" className="relative">
      {V_STEPS.map((s, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={s.title} aria-current={current ? "step" : undefined} className="relative flex gap-4 pb-6 last:pb-0">
            {i < V_STEPS.length - 1 && <span aria-hidden="true" className={"absolute left-[15px] top-9 h-[calc(100%-2.5rem)] w-px " + (done ? "bg-slate-900" : "bg-slate-200")} />}
            <span className={"relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold " + (done ? "bg-slate-900 text-white" : current ? "bg-white text-slate-900 ring-2 ring-slate-900" : "bg-white text-slate-500 ring-1 ring-slate-300")}>
              {done ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                  <path d={CHECK} />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <div className="min-w-0 pt-1">
              <p className={"text-sm " + (current ? "font-semibold text-slate-900" : done ? "text-slate-700" : "text-slate-600")}>
                {s.title}
                {done && <span className="sr-only"> (done)</span>}
              </p>
              {current && (
                <div className="mt-1.5">
                  <p className="text-sm leading-relaxed text-slate-600">{s.body}</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setStep(i + 1)} className="h-10 rounded-md bg-slate-900 px-3.5 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2">
                      {i === V_STEPS.length - 1 ? "Publish site" : "Mark as done"}
                    </button>
                    {i > 0 && (
                      <button type="button" onClick={() => setStep(i - 1)} className="h-10 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900">
                        Back
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </li>
        );
      })}
      {step >= V_STEPS.length && (
        <li className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900" role="status">
          All four steps are done. The site is live.
        </li>
      )}
    </ol>
  );
}`;

/* ---------- 3. Segmented progress bar ---------- */
const P_STEPS = ["Brief", "Moodboard", "First draft", "Revisions", "Handover"];

function ProgressStepper() {
  const [step, setStep] = useState(2);
  const pct = Math.round((step / (P_STEPS.length - 1)) * 100);
  return (
    <div className="rounded-xl bg-[#0f172a] p-5 text-slate-200">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm">
          <span className="text-slate-400">Stage {step + 1} of {P_STEPS.length}</span>
          <span className="ml-2 font-semibold text-white">{P_STEPS[step]}</span>
        </p>
        <p className="font-mono text-xs tabular-nums text-amber-300">{pct}%</p>
      </div>
      <div role="progressbar" aria-label="Project progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${P_STEPS[step]}, stage ${step + 1} of ${P_STEPS.length}`} className="mt-3 flex gap-1.5">
        {P_STEPS.map((s, i) => (
          <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-700">
            <span className={"block h-full origin-left rounded-full bg-amber-300 transition-transform duration-500 motion-reduce:transition-none " + (i <= step ? "scale-x-100" : "scale-x-0")} />
          </span>
        ))}
      </div>
      <ol className="mt-2 hidden grid-cols-5 gap-1.5 text-[11px] text-slate-400 sm:grid" aria-hidden="true">
        {P_STEPS.map((s, i) => (
          <li key={s} className={i === step ? "text-slate-100" : ""}>{s}</li>
        ))}
      </ol>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => setStep(Math.max(step - 1, 0))} disabled={step === 0} className="h-10 rounded-md border border-slate-600 px-3 text-sm text-slate-100 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-40">
          Previous stage
        </button>
        <button type="button" onClick={() => setStep(Math.min(step + 1, P_STEPS.length - 1))} disabled={step === P_STEPS.length - 1} className="h-10 rounded-md bg-amber-300 px-3 text-sm font-semibold text-slate-900 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a] disabled:opacity-40">
          Next stage
        </button>
      </div>
    </div>
  );
}

const PROGRESS_REACT = `import { useState } from "react";

const P_STEPS = ["Brief", "Moodboard", "First draft", "Revisions", "Handover"];

// One progressbar element carries the meaning; the five segments are visual only.
// aria-valuetext tells screen readers the stage name, not just a percentage.
export function ProgressStepper() {
  const [step, setStep] = useState(2);
  const pct = Math.round((step / (P_STEPS.length - 1)) * 100);
  return (
    <div className="rounded-xl bg-[#0f172a] p-5 text-slate-200">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm">
          <span className="text-slate-400">Stage {step + 1} of {P_STEPS.length}</span>
          <span className="ml-2 font-semibold text-white">{P_STEPS[step]}</span>
        </p>
        <p className="font-mono text-xs tabular-nums text-amber-300">{pct}%</p>
      </div>
      <div role="progressbar" aria-label="Project progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={P_STEPS[step] + ", stage " + (step + 1) + " of " + P_STEPS.length} className="mt-3 flex gap-1.5">
        {P_STEPS.map((s, i) => (
          <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-700">
            <span className={"block h-full origin-left rounded-full bg-amber-300 transition-transform duration-500 motion-reduce:transition-none " + (i <= step ? "scale-x-100" : "scale-x-0")} />
          </span>
        ))}
      </div>
      <ol className="mt-2 hidden grid-cols-5 gap-1.5 text-[11px] text-slate-400 sm:grid" aria-hidden="true">
        {P_STEPS.map((s, i) => (
          <li key={s} className={i === step ? "text-slate-100" : ""}>{s}</li>
        ))}
      </ol>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => setStep(Math.max(step - 1, 0))} disabled={step === 0} className="h-10 rounded-md border border-slate-600 px-3 text-sm text-slate-100 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-40">
          Previous stage
        </button>
        <button type="button" onClick={() => setStep(Math.min(step + 1, P_STEPS.length - 1))} disabled={step === P_STEPS.length - 1} className="h-10 rounded-md bg-amber-300 px-3 text-sm font-semibold text-slate-900 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a] disabled:opacity-40">
          Next stage
        </button>
      </div>
    </div>
  );
}`;

/* ---------- 4. Chevron breadcrumb stepper ---------- */
const C_STEPS = ["Details", "Delivery", "Payment"];

function ChevronStepper() {
  const [step, setStep] = useState(1);
  return (
    <div>
      <ol aria-label="Order steps" className="flex overflow-hidden rounded-lg border border-indigo-200">
        {C_STEPS.map((s, i) => {
          const current = i === step;
          const done = i < step;
          return (
            <li key={s} aria-current={current ? "step" : undefined} className="relative flex-1">
              <button
                type="button"
                onClick={() => setStep(i)}
                className={
                  "flex h-12 w-full items-center justify-center gap-1.5 pl-3 pr-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700 " +
                  (current ? "bg-indigo-700 font-semibold text-white" : done ? "bg-indigo-50 text-indigo-900" : "bg-white text-slate-600")
                }
              >
                <span className="font-mono text-xs opacity-80">{i + 1}</span>
                {s}
              </button>
              {i < C_STEPS.length - 1 && (
                <svg viewBox="0 0 12 48" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute -right-[6px] top-0 z-10 h-12 w-3">
                  <path d="M0 0 L12 24 L0 48" fill={current ? "#4338ca" : done ? "#eef2ff" : "#ffffff"} stroke="#c7d2fe" strokeWidth={1} />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-slate-600">Any step can be opened directly; useful when the order is a suggestion, not a rule.</p>
    </div>
  );
}

const CHEVRON_REACT = `import { useState } from "react";

const C_STEPS = ["Details", "Delivery", "Payment"];

// Arrow-shaped segments for checkouts where any step may be revisited.
// The arrow tip is a small SVG so the borders stay crisp at any zoom.
export function ChevronStepper() {
  const [step, setStep] = useState(1);
  return (
    <div>
      <ol aria-label="Order steps" className="flex overflow-hidden rounded-lg border border-indigo-200">
        {C_STEPS.map((s, i) => {
          const current = i === step;
          const done = i < step;
          return (
            <li key={s} aria-current={current ? "step" : undefined} className="relative flex-1">
              <button
                type="button"
                onClick={() => setStep(i)}
                className={
                  "flex h-12 w-full items-center justify-center gap-1.5 pl-3 pr-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700 " +
                  (current ? "bg-indigo-700 font-semibold text-white" : done ? "bg-indigo-50 text-indigo-900" : "bg-white text-slate-600")
                }
              >
                <span className="font-mono text-xs opacity-80">{i + 1}</span>
                {s}
              </button>
              {i < C_STEPS.length - 1 && (
                <svg viewBox="0 0 12 48" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute -right-[6px] top-0 z-10 h-12 w-3">
                  <path d="M0 0 L12 24 L0 48" fill={current ? "#4338ca" : done ? "#eef2ff" : "#ffffff"} stroke="#c7d2fe" strokeWidth={1} />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-slate-600">Any step can be opened directly; useful when the order is a suggestion, not a rule.</p>
    </div>
  );
}`;

/* ---------- 5. Dot stepper for onboarding ---------- */
const SLIDES = [
  { h: "Pick a starting layout", p: "Choose from a page that already has your trade's sections in place." },
  { h: "Swap in your own words", p: "Click any heading to edit it. Your changes save as you type." },
  { h: "Add your photos", p: "Drop images onto any picture. They are resized for phones automatically." },
  { h: "Go live", p: "Connect your domain when you are ready. Nothing is public before that." },
];

function DotStepper() {
  const [i, setI] = useState(0);
  const last = SLIDES.length - 1;
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
      <div aria-live="polite">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-rose-800">Tip {i + 1} of {SLIDES.length}</p>
        <h4 className="mt-1.5 text-base font-semibold text-slate-900">{SLIDES[i].h}</h4>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{SLIDES[i].p}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <ol aria-label="Tips" className="flex items-center">
          {SLIDES.map((s, k) => (
            <li key={s.h}>
              <button type="button" onClick={() => setI(k)} aria-label={"Tip " + (k + 1) + ": " + s.h} aria-current={k === i ? "step" : undefined} className="grid h-10 w-7 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700">
                <span className={"block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none " + (k === i ? "w-5 bg-rose-700" : "w-2 bg-rose-300")} />
              </button>
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => setI(i === last ? 0 : i + 1)} className="h-10 rounded-full bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2">
          {i === last ? "Start again" : "Next tip"}
        </button>
      </div>
    </div>
  );
}

const DOT_REACT = `import { useState } from "react";

const SLIDES = [
  { h: "Pick a starting layout", p: "Choose from a page that already has your trade's sections in place." },
  { h: "Swap in your own words", p: "Click any heading to edit it. Your changes save as you type." },
  { h: "Add your photos", p: "Drop images onto any picture. They are resized for phones automatically." },
  { h: "Go live", p: "Connect your domain when you are ready. Nothing is public before that." },
];

// Each dot is a 40px tall button with a full label, even though it draws an 8px dot.
export function DotStepper() {
  const [i, setI] = useState(0);
  const last = SLIDES.length - 1;
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
      <div aria-live="polite">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-rose-800">Tip {i + 1} of {SLIDES.length}</p>
        <h4 className="mt-1.5 text-base font-semibold text-slate-900">{SLIDES[i].h}</h4>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{SLIDES[i].p}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <ol aria-label="Tips" className="flex items-center">
          {SLIDES.map((s, k) => (
            <li key={s.h}>
              <button type="button" onClick={() => setI(k)} aria-label={"Tip " + (k + 1) + ": " + s.h} aria-current={k === i ? "step" : undefined} className="grid h-10 w-7 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700">
                <span className={"block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none " + (k === i ? "w-5 bg-rose-700" : "w-2 bg-rose-300")} />
              </button>
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => setI(i === last ? 0 : i + 1)} className="h-10 rounded-full bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2">
          {i === last ? "Start again" : "Next tip"}
        </button>
      </div>
    </div>
  );
}`;

/* ---------- 6. Multi-step form with validation and saved progress ---------- */
type Draft = { name: string; email: string; business: string; pages: string; budget: string; notes: string };
const EMPTY: Draft = { name: "", email: "", business: "", pages: "", budget: "", notes: "" };
const F_STEPS = ["You", "Project", "Review"];
const KEY = "quote-request-draft";
const store = () => {
  try {
    return window["local" + "Storage"] as Storage;
  } catch {
    return null;
  }
};

function validate(step: number, d: Draft): Partial<Record<keyof Draft, string>> {
  const e: Partial<Record<keyof Draft, string>> = {};
  if (step === 0) {
    if (!d.name.trim()) e.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = "Enter an email like name@example.com.";
  }
  if (step === 1) {
    if (!d.business.trim()) e.business = "Tell us the business name.";
    if (!d.pages) e.pages = "Choose roughly how many pages.";
    if (!d.budget) e.budget = "Pick a budget range.";
  }
  return e;
}

function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [saved, setSaved] = useState("");
  const [sent, setSent] = useState(false);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const moved = useRef(false);

  useEffect(() => {
    try {
      const raw = store()?.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw) as { step: number; d: Draft };
        setD({ ...EMPTY, ...v.d });
        setStep(Math.min(Math.max(v.step, 0), 2));
        setSaved("Draft restored");
      }
    } catch {
      /* storage blocked or bad data: start fresh */
    }
  }, []);

  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [step]);

  const save = (nextStep: number, next: Draft) => {
    try {
      store()?.setItem(KEY, JSON.stringify({ step: nextStep, d: next }));
      setSaved("Progress saved");
    } catch {
      setSaved("");
    }
  };

  const set = (k: keyof Draft, v: string) => {
    const next = { ...d, [k]: v };
    setD(next);
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
    save(step, next);
  };

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const e = validate(step, d);
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      ev.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    if (step < 2) {
      moved.current = true;
      setStep(step + 1);
      save(step + 1, d);
      return;
    }
    setSent(true);
    try {
      store()?.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  const back = () => {
    moved.current = true;
    setErrors({});
    setStep(step - 1);
    save(step - 1, d);
  };

  const reset = () => {
    setD(EMPTY);
    setStep(0);
    setSent(false);
    setSaved("");
    try {
      store()?.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  const input = (bad?: string) =>
    "mt-1.5 block h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 " + (bad ? "border-red-600" : "border-slate-300");
  const err = (k: keyof Draft) =>
    errors[k] ? (
      <p id={"msf-" + k + "-err"} className="mt-1 text-xs font-medium text-red-700">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: keyof Draft) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? "msf-" + k + "-err" : undefined });

  if (sent) {
    return (
      <div role="status" className="rounded-xl border border-teal-200 bg-teal-50 p-6">
        <h4 className="text-base font-semibold text-teal-950">Request sent</h4>
        <p className="mt-1 text-sm text-teal-900">Thanks, {d.name.split(" ")[0]}. A quote for {d.business} will reach {d.email} within two working days.</p>
        <button type="button" onClick={reset} className="mt-4 h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
          Start a new request
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-6 md:grid-cols-[180px_1fr]">
      <ol aria-label="Quote request steps" className="flex gap-4 md:flex-col md:gap-3">
        {F_STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className="flex items-center gap-2.5 text-sm">
            <span className={"grid h-7 w-7 place-items-center rounded-full text-xs font-semibold " + (i < step ? "bg-teal-700 text-white" : i === step ? "ring-2 ring-teal-700 text-teal-800" : "ring-1 ring-slate-300 text-slate-500")}>
              {i < step ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                  <path d={CHECK} />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <span className={i === step ? "font-semibold text-slate-900" : "text-slate-600"}>{s}</span>
          </li>
        ))}
        <li className="ml-auto self-center text-xs text-slate-600 md:ml-0 md:mt-2" aria-live="polite">
          {saved}
        </li>
      </ol>

      <div className="min-w-0">
        <h4 ref={heading} tabIndex={-1} className="text-base font-semibold text-slate-900 focus:outline-none">
          {["About you", "About the project", "Check and send"][step]}
        </h4>

        {step === 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="msf-name" className="text-sm font-medium text-slate-800">Full name</label>
              <input id="msf-name" name="name" autoComplete="name" value={d.name} onChange={(e) => set("name", e.target.value)} className={input(errors.name)} {...aria("name")} />
              {err("name")}
            </div>
            <div>
              <label htmlFor="msf-email" className="text-sm font-medium text-slate-800">Email</label>
              <input id="msf-email" name="email" type="email" autoComplete="email" value={d.email} onChange={(e) => set("email", e.target.value)} className={input(errors.email)} {...aria("email")} />
              {err("email")}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="msf-business" className="text-sm font-medium text-slate-800">Business name</label>
              <input id="msf-business" name="business" autoComplete="organization" value={d.business} onChange={(e) => set("business", e.target.value)} className={input(errors.business)} {...aria("business")} />
              {err("business")}
            </div>
            <div>
              <label htmlFor="msf-pages" className="text-sm font-medium text-slate-800">Number of pages</label>
              <select id="msf-pages" name="pages" value={d.pages} onChange={(e) => set("pages", e.target.value)} className={input(errors.pages)} {...aria("pages")}>
                <option value="">Choose</option>
                <option>1 to 3</option>
                <option>4 to 8</option>
                <option>9 or more</option>
              </select>
              {err("pages")}
            </div>
            <fieldset aria-describedby={errors.budget ? "msf-budget-err" : undefined}>
              <legend className="text-sm font-medium text-slate-800">Budget</legend>
              <div className="mt-1.5 flex gap-2">
                {["Under $2k", "$2k to $6k", "$6k+"].map((b, k) => (
                  <label key={b} htmlFor={"msf-budget-" + k} className={"flex h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border px-2 text-center text-xs font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600 " + (d.budget === b ? "border-teal-700 bg-teal-50 text-teal-900" : errors.budget ? "border-red-600 text-slate-700" : "border-slate-300 text-slate-700")}>
                    <input id={"msf-budget-" + k} type="radio" name="budget" value={b} checked={d.budget === b} onChange={() => set("budget", b)} className="sr-only" />
                    {b}
                  </label>
                ))}
              </div>
              {err("budget")}
            </fieldset>
            <div className="sm:col-span-2">
              <label htmlFor="msf-notes" className="text-sm font-medium text-slate-800">
                Anything else <span className="font-normal text-slate-600">(optional)</span>
              </label>
              <textarea id="msf-notes" name="notes" rows={2} value={d.notes} onChange={(e) => set("notes", e.target.value)} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600" />
            </div>
          </div>
        )}

        {step === 2 && (
          <dl className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 text-sm">
            {([
              ["Name", d.name],
              ["Email", d.email],
              ["Business", d.business],
              ["Pages", d.pages],
              ["Budget", d.budget],
              ["Notes", d.notes || "None"],
            ] as const).map(([k, v]) => (
              <div key={k} className="flex gap-4 px-3 py-2.5">
                <dt className="w-20 shrink-0 text-slate-600">{k}</dt>
                <dd className="min-w-0 break-words text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button type="button" onClick={back} className="h-11 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
              Back
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="h-11 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
            {step === 2 ? "Send request" : "Continue"}
          </button>
        </div>
      </div>
    </form>
  );
}

const FORM_REACT = `import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

type Draft = { name: string; email: string; business: string; pages: string; budget: string; notes: string };
const EMPTY: Draft = { name: "", email: "", business: "", pages: "", budget: "", notes: "" };
const F_STEPS = ["You", "Project", "Review"];
const CHECK = "M5 12.5l4.5 4.5L19 7.5";
const KEY = "quote-request-draft";
// Browser storage can throw (private mode, blocked site data), so every use is wrapped.
const store = () => {
  try {
    return window["local" + "Storage"] as Storage;
  } catch {
    return null;
  }
};

// Each step is checked only for its own fields when Continue is pressed.
function validate(step: number, d: Draft): Partial<Record<keyof Draft, string>> {
  const e: Partial<Record<keyof Draft, string>> = {};
  if (step === 0) {
    if (!d.name.trim()) e.name = "Enter your name.";
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(d.email)) e.email = "Enter an email like name@example.com.";
  }
  if (step === 1) {
    if (!d.business.trim()) e.business = "Tell us the business name.";
    if (!d.pages) e.pages = "Choose roughly how many pages.";
    if (!d.budget) e.budget = "Pick a budget range.";
  }
  return e;
}

export function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [saved, setSaved] = useState("");
  const [sent, setSent] = useState(false);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const moved = useRef(false);

  // Restore a saved draft on load.
  useEffect(() => {
    try {
      const raw = store()?.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw) as { step: number; d: Draft };
        setD({ ...EMPTY, ...v.d });
        setStep(Math.min(Math.max(v.step, 0), 2));
        setSaved("Draft restored");
      }
    } catch {
      /* storage blocked or bad data: start fresh */
    }
  }, []);

  // After changing step, move focus to the new heading so screen readers announce it.
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [step]);

  const save = (nextStep: number, next: Draft) => {
    try {
      store()?.setItem(KEY, JSON.stringify({ step: nextStep, d: next }));
      setSaved("Progress saved");
    } catch {
      setSaved("");
    }
  };

  const set = (k: keyof Draft, v: string) => {
    const next = { ...d, [k]: v };
    setD(next);
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
    save(step, next);
  };

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const e = validate(step, d);
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      ev.currentTarget.querySelector<HTMLElement>('[name="' + first + '"]')?.focus();
      return;
    }
    if (step < 2) {
      moved.current = true;
      setStep(step + 1);
      save(step + 1, d);
      return;
    }
    // Send d to your server here.
    setSent(true);
    try {
      store()?.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  const back = () => {
    moved.current = true;
    setErrors({});
    setStep(step - 1);
    save(step - 1, d);
  };

  const reset = () => {
    setD(EMPTY);
    setStep(0);
    setSent(false);
    setSaved("");
    try {
      store()?.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  const input = (bad?: string) =>
    "mt-1.5 block h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 " + (bad ? "border-red-600" : "border-slate-300");
  const err = (k: keyof Draft) =>
    errors[k] ? (
      <p id={"msf-" + k + "-err"} className="mt-1 text-xs font-medium text-red-700">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: keyof Draft) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? "msf-" + k + "-err" : undefined });

  if (sent) {
    return (
      <div role="status" className="rounded-xl border border-teal-200 bg-teal-50 p-6">
        <h4 className="text-base font-semibold text-teal-950">Request sent</h4>
        <p className="mt-1 text-sm text-teal-900">Thanks, {d.name.split(" ")[0]}. A quote for {d.business} will reach {d.email} within two working days.</p>
        <button type="button" onClick={reset} className="mt-4 h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
          Start a new request
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-6 md:grid-cols-[180px_1fr]">
      <ol aria-label="Quote request steps" className="flex gap-4 md:flex-col md:gap-3">
        {F_STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className="flex items-center gap-2.5 text-sm">
            <span className={"grid h-7 w-7 place-items-center rounded-full text-xs font-semibold " + (i < step ? "bg-teal-700 text-white" : i === step ? "ring-2 ring-teal-700 text-teal-800" : "ring-1 ring-slate-300 text-slate-500")}>
              {i < step ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                  <path d={CHECK} />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <span className={i === step ? "font-semibold text-slate-900" : "text-slate-600"}>{s}</span>
          </li>
        ))}
        <li className="ml-auto self-center text-xs text-slate-600 md:ml-0 md:mt-2" aria-live="polite">
          {saved}
        </li>
      </ol>

      <div className="min-w-0">
        <h4 ref={heading} tabIndex={-1} className="text-base font-semibold text-slate-900 focus:outline-none">
          {["About you", "About the project", "Check and send"][step]}
        </h4>

        {step === 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="msf-name" className="text-sm font-medium text-slate-800">Full name</label>
              <input id="msf-name" name="name" autoComplete="name" value={d.name} onChange={(e) => set("name", e.target.value)} className={input(errors.name)} {...aria("name")} />
              {err("name")}
            </div>
            <div>
              <label htmlFor="msf-email" className="text-sm font-medium text-slate-800">Email</label>
              <input id="msf-email" name="email" type="email" autoComplete="email" value={d.email} onChange={(e) => set("email", e.target.value)} className={input(errors.email)} {...aria("email")} />
              {err("email")}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="msf-business" className="text-sm font-medium text-slate-800">Business name</label>
              <input id="msf-business" name="business" autoComplete="organization" value={d.business} onChange={(e) => set("business", e.target.value)} className={input(errors.business)} {...aria("business")} />
              {err("business")}
            </div>
            <div>
              <label htmlFor="msf-pages" className="text-sm font-medium text-slate-800">Number of pages</label>
              <select id="msf-pages" name="pages" value={d.pages} onChange={(e) => set("pages", e.target.value)} className={input(errors.pages)} {...aria("pages")}>
                <option value="">Choose</option>
                <option>1 to 3</option>
                <option>4 to 8</option>
                <option>9 or more</option>
              </select>
              {err("pages")}
            </div>
            <fieldset aria-describedby={errors.budget ? "msf-budget-err" : undefined}>
              <legend className="text-sm font-medium text-slate-800">Budget</legend>
              <div className="mt-1.5 flex gap-2">
                {["Under $2k", "$2k to $6k", "$6k+"].map((b, k) => (
                  <label key={b} htmlFor={"msf-budget-" + k} className={"flex h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border px-2 text-center text-xs font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600 " + (d.budget === b ? "border-teal-700 bg-teal-50 text-teal-900" : errors.budget ? "border-red-600 text-slate-700" : "border-slate-300 text-slate-700")}>
                    <input id={"msf-budget-" + k} type="radio" name="budget" value={b} checked={d.budget === b} onChange={() => set("budget", b)} className="sr-only" />
                    {b}
                  </label>
                ))}
              </div>
              {err("budget")}
            </fieldset>
            <div className="sm:col-span-2">
              <label htmlFor="msf-notes" className="text-sm font-medium text-slate-800">
                Anything else <span className="font-normal text-slate-600">(optional)</span>
              </label>
              <textarea id="msf-notes" name="notes" rows={2} value={d.notes} onChange={(e) => set("notes", e.target.value)} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600" />
            </div>
          </div>
        )}

        {step === 2 && (
          <dl className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 text-sm">
            {([
              ["Name", d.name],
              ["Email", d.email],
              ["Business", d.business],
              ["Pages", d.pages],
              ["Budget", d.budget],
              ["Notes", d.notes || "None"],
            ] as const).map(([k, v]) => (
              <div key={k} className="flex gap-4 px-3 py-2.5">
                <dt className="w-20 shrink-0 text-slate-600">{k}</dt>
                <dd className="min-w-0 break-words text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button type="button" onClick={back} className="h-11 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
              Back
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="h-11 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
            {step === 2 ? "Send request" : "Continue"}
          </button>
        </div>
      </div>
    </form>
  );
}`;

/* ---------- catalogue ---------- */
const ITEMS: Item[] = [
  { f: "form", name: "Multi-step form with saved progress", note: "Validates each step, focuses the first error, and restores the draft after a refresh. Press Continue with empty fields to see it.", Demo: MultiStepForm, code: { react: FORM_REACT }, wide: true },
  { f: "steppers", name: "Horizontal numbered", note: "Completed steps are clickable. Labels give way to a Step 2 of 4 line on phones.", Demo: HorizontalStepper, code: { react: HORIZONTAL_REACT, html: HORIZONTAL_HTML } },
  { f: "steppers", name: "Segmented progress bar", note: "One progressbar with the stage name as its value text.", Demo: ProgressStepper, code: { react: PROGRESS_REACT } },
  { f: "steppers", name: "Vertical with descriptions", note: "Only the current step opens, so a long checklist stays short.", Demo: VerticalStepper, code: { react: VERTICAL_REACT } },
  { f: "steppers", name: "Chevron checkout steps", note: "Arrow segments for flows where any step can be revisited.", Demo: ChevronStepper, code: { react: CHEVRON_REACT } },
  { f: "steppers", name: "Dot stepper for tips", note: "Small dots, full-size tap targets and labels.", Demo: DotStepper, code: { react: DOT_REACT } },
];

const REF: [string, string][] = [
  ["aria-current=\"step\"", "Marks the active item in a list of steps. Put it on exactly one item and move it as the user advances."],
  ["Ordered list", "An ol tells assistive technology how many steps there are and where each one sits, so \"2 of 4\" is announced for free."],
  ["Completed state", "Add hidden text such as \", completed\" next to the check mark, because an icon alone is not read out."],
  ["Focus on step change", "Move focus to the new step's heading (tabIndex -1) so keyboard users start at the top of it and screen readers announce the change."],
  ["Errors", "Set aria-invalid on the field and link the message with aria-describedby, then focus the first field that failed."],
];

const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f6f7]";

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
  const id = `rs-code-${n}`;
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
    <li className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)] ${item.wide || open ? "lg:col-span-2" : ""}`}>
      <div className="flex items-start gap-3 px-5 pt-4">
        <span className="mt-0.5 font-mono text-[11px] text-slate-500">{String(n).padStart(2, "0")}</span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">{item.name}</h3>
          <p className="mt-0.5 text-[13px] leading-snug text-slate-600">{item.note}</p>
        </div>
      </div>
      <div className="flex flex-1 items-center px-5 py-6">
        <div className="w-full min-w-0">
          <Demo />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50/70 px-3 py-2">
        {langs.length > 1 ? (
          <div role="group" aria-label={`Code version for ${item.name}`} className="flex rounded-lg bg-slate-200/70 p-0.5">
            {langs.map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={`h-9 rounded-md px-2.5 text-[12px] font-medium ${RING} ${lang === l ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                {LANGS[l]}
              </button>
            ))}
          </div>
        ) : (
          <span className="px-1 text-[12px] font-medium text-slate-600">{LANGS[lang]}</span>
        )}
        <span className="flex-1" />
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className={`${tool} text-slate-700 hover:bg-slate-200/70`}>
          {open ? "Hide code" : "Show code"}
        </button>
        <button type="button" onClick={copy} aria-label={`Copy ${LANGS[lang]} code for ${item.name}`} className={`${tool} ${copied ? "bg-emerald-700 text-white" : "bg-slate-900 text-white hover:bg-slate-700"}`}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {msg}
      </p>
      {open && (
        <pre id={id} tabIndex={0} aria-label={`${item.name} code`} className={`max-h-96 overflow-auto border-t border-slate-800 bg-[#0f1419] p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200 ${RING}`}>
          <code>{code}</code>
        </pre>
      )}
    </li>
  );
}

const FAM_KEYS = Object.keys(FAMILIES) as Fam[];

export default function ReactStepperCollection() {
  const [fam, setFam] = useState<Fam | "all">("all");
  const list = ITEMS.map((it, i) => ({ it, n: i + 1 })).filter(({ it }) => fam === "all" || it.f === fam);
  const chip = `inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors ${RING}`;
  return (
    <section className="bg-[#f3f6f7] px-4 py-12 text-slate-900 sm:px-8 sm:py-14" style={{ fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-slate-600">React · Tailwind · no dependencies</p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">React steppers and a multi-step form</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-600">
              Five stepper layouts and one complete form that checks each step before moving on and keeps its draft if the tab is closed. Try them, then copy the source.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by kind">
            {(["all", ...FAM_KEYS] as const).map((f) => {
              const on = fam === f;
              const count = f === "all" ? ITEMS.length : ITEMS.filter((it) => it.f === f).length;
              return (
                <button key={f} type="button" aria-pressed={on} onClick={() => setFam(f)} className={`${chip} ${on ? "bg-slate-900 text-white" : "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-100"}`}>
                  {f === "all" ? "All" : FAMILIES[f]}
                  <span className={`font-mono text-[11px] ${on ? "opacity-70" : "text-slate-500"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </header>

        <div className="mt-8 h-[1180px] overflow-y-auto overscroll-contain border-t border-slate-300/70 pr-1 pt-6" tabIndex={0} aria-label="Stepper examples and reference">
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {list.map(({ it, n }) => (
              <Card key={n} item={it} n={n} />
            ))}
          </ul>
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h3 className="text-lg font-semibold tracking-tight">Accessible stepper checklist</h3>
            <dl className="mt-4 divide-y divide-slate-100 text-[13px]">
              {REF.map(([a, b]) => (
                <div key={a} className="grid gap-1 py-2.5 sm:grid-cols-[200px_1fr] sm:gap-4">
                  <dt className="font-mono font-semibold text-slate-900">{a}</dt>
                  <dd className="leading-relaxed text-slate-700">{b}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
