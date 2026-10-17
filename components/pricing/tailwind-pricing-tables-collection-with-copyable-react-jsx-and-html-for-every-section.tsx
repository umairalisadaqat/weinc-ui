import { createElement, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

/*
  Tailwind pricing tables collection.
  Each section below is written once as Tailwind markup. A small parser turns it into a tree that
  React renders for the preview, and the same tree is printed back out as React JSX (with useState
  wired in) or as plain HTML (with a short script). So what you copy is exactly what you see.

  Behaviour hooks inside the markup:
    data-m / data-y        text shown for the first / second billing state
    data-bill-toggle       a role="switch" button that flips the billing state
    data-bill="m" | "y"    segmented buttons that pick a billing state
    data-usage="key"       a range slider or checkbox that feeds the calculator
    data-calc="k:b,i,r+…"  shows base + max(0, value - included) * rate, summed over terms
    data-units="key"       shows the current value of one usage input
  All prices are examples.
*/

type El = { t: string; a: Record<string, string>; c: Nd[] };
type Nd = string | El;
type Tag =
  | "Toggle"
  | "2 plans"
  | "3 plans"
  | "4 plans"
  | "Comparison"
  | "Usage slider"
  | "Single plan"
  | "Enterprise"
  | "FAQ"
  | "Dark"
  | "Minimal"
  | "Horizontal"
  | "Mobile first";
type Variant = { name: string; tags: Tag[]; sv?: string; html: string };

/* ---------- small markup helpers (they only build strings) ---------- */
const TICK = "M4.5 10.5l3.5 3.5 7.5-8";
const CROSS = "M6 6l8 8M14 6l-8 8";
const ck = (cls: string) =>
  `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="mt-0.5 h-4 w-4 shrink-0 ${cls}"><path d="${TICK}" /></svg>`;
const li = (text: string, cls: string) => `<li class="flex gap-3">${ck(cls)}<span>${text}</span></li>`;
const no = (text: string, cls: string) =>
  `<li class="flex gap-3 ${cls}"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" class="mt-0.5 h-4 w-4 shrink-0"><path d="${CROSS}" /></svg><span><span class="sr-only">Not included: </span>${text}</span></li>`;
const yes = (cls: string) =>
  `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-label="Included" role="img" class="mx-auto h-5 w-5 ${cls}"><path d="${TICK}" /></svg>`;
const dash = (cls: string) => `<span class="${cls}" aria-label="Not included">–</span>`;
const sw = (on: string, ring: string) =>
  `<button type="button" role="switch" aria-checked="false" aria-label="Bill yearly" data-bill-toggle class="group relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-slate-300 transition-colors before:absolute before:-inset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none ${on} ${ring}"><span class="h-5 w-5 translate-x-1 rounded-full bg-white shadow-sm transition-transform group-aria-checked:translate-x-6 motion-reduce:transition-none"></span></button>`;
const seg = (wrap: string, btn: string, a = "Monthly", b = "Yearly", label = "Billing period") =>
  `<div role="group" aria-label="${label}" class="${wrap}"><button type="button" data-bill="m" aria-pressed="true" class="${btn}">${a}</button><button type="button" data-bill="y" aria-pressed="false" class="${btn}">${b}</button></div>`;

/* ---------- the collection (every brand, plan and price is invented) ---------- */
const VARIANTS: Variant[] = [
  {
    name: "Three Plans with Yearly Switch",
    tags: ["3 plans", "Toggle"],
    html: `<section class="bg-white px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-5xl">
    <div class="mx-auto max-w-2xl text-center">
      <p class="text-sm font-semibold text-indigo-600">Fernway pricing</p>
      <h2 class="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Plans that grow with your shop</h2>
      <p class="mt-4 text-lg text-slate-600">Start small, add stock and staff when you need them. Cancel any time.</p>
    </div>
    <div class="mt-10 flex items-center justify-center gap-3 text-sm font-medium text-slate-700"><span>Monthly</span>${sw("aria-checked:bg-indigo-600", "focus-visible:ring-indigo-600")}<span>Yearly <span class="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">2 months free</span></span></div>
    <div class="mt-12 grid gap-6 lg:grid-cols-3 lg:items-center">
      <div class="rounded-2xl border border-slate-200 p-8">
        <h3 class="text-lg font-semibold">Starter</h3>
        <p class="mt-1 text-sm text-slate-600">For a first online shop.</p>
        <p class="mt-6 flex items-baseline gap-1"><span class="text-4xl font-semibold tracking-tight" data-m="$19" data-y="$16">$19</span><span class="text-sm text-slate-600">/month</span></p>
        <p class="mt-1 text-xs text-slate-500" data-m="Billed monthly" data-y="$190 billed yearly">Billed monthly</p>
        <a href="#" class="mt-6 block rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">Start with Starter</a>
        <ul class="mt-8 space-y-3 text-sm text-slate-700">${li("100 products", "text-indigo-600")}${li("1 staff account", "text-indigo-600")}${li("Card and wallet payments", "text-indigo-600")}</ul>
      </div>
      <div class="relative rounded-2xl bg-slate-900 p-8 text-white shadow-xl ring-1 ring-slate-900 lg:py-12">
        <p class="absolute -top-3 left-8 rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold">Most popular</p>
        <h3 class="text-lg font-semibold">Growth</h3>
        <p class="mt-1 text-sm text-slate-300">For shops with steady orders.</p>
        <p class="mt-6 flex items-baseline gap-1"><span class="text-4xl font-semibold tracking-tight" data-m="$49" data-y="$41">$49</span><span class="text-sm text-slate-300">/month</span></p>
        <p class="mt-1 text-xs text-slate-400" data-m="Billed monthly" data-y="$490 billed yearly">Billed monthly</p>
        <a href="#" class="mt-6 block rounded-lg bg-indigo-500 px-4 py-2.5 text-center text-sm font-semibold hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Start with Growth</a>
        <ul class="mt-8 space-y-3 text-sm text-slate-200">${li("Unlimited products", "text-indigo-300")}${li("5 staff accounts", "text-indigo-300")}${li("Abandoned cart emails", "text-indigo-300")}${li("Discount codes", "text-indigo-300")}</ul>
      </div>
      <div class="rounded-2xl border border-slate-200 p-8">
        <h3 class="text-lg font-semibold">Scale</h3>
        <p class="mt-1 text-sm text-slate-600">For several stores and warehouses.</p>
        <p class="mt-6 flex items-baseline gap-1"><span class="text-4xl font-semibold tracking-tight" data-m="$129" data-y="$108">$129</span><span class="text-sm text-slate-600">/month</span></p>
        <p class="mt-1 text-xs text-slate-500" data-m="Billed monthly" data-y="$1,290 billed yearly">Billed monthly</p>
        <a href="#" class="mt-6 block rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">Start with Scale</a>
        <ul class="mt-8 space-y-3 text-sm text-slate-700">${li("Everything in Growth", "text-indigo-600")}${li("Unlimited staff", "text-indigo-600")}${li("Multiple warehouses", "text-indigo-600")}</ul>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Free and Pro Side by Side",
    tags: ["2 plans"],
    html: `<section class="bg-emerald-50 px-4 py-20 text-emerald-950 sm:px-6">
  <div class="mx-auto max-w-4xl">
    <h2 class="text-center text-4xl font-semibold tracking-tight">Free for notes. Pro for everything.</h2>
    <p class="mx-auto mt-4 max-w-xl text-center text-emerald-900/80">Pinecraft keeps your notes in sync on every device. Upgrade when you want sharing and history.</p>
    <div class="mt-12 grid overflow-hidden rounded-3xl border border-emerald-200 bg-white md:grid-cols-2">
      <div class="p-8 sm:p-10">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-emerald-700">Free</h3>
        <p class="mt-4 text-5xl font-semibold tracking-tight">$0</p>
        <p class="mt-2 text-sm text-emerald-900/70">Free forever, no card needed</p>
        <ul class="mt-8 space-y-3 text-sm">${li("Unlimited notes", "text-emerald-600")}${li("Sync across 2 devices", "text-emerald-600")}${li("7 days of history", "text-emerald-600")}</ul>
        <a href="#" class="mt-10 inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-emerald-300 px-5 text-sm font-semibold hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Create a free account</a>
      </div>
      <div class="bg-emerald-900 p-8 text-white sm:p-10">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-emerald-300">Pro</h3>
        <p class="mt-4 text-5xl font-semibold tracking-tight">$6<span class="text-lg font-medium text-emerald-200">/month</span></p>
        <p class="mt-2 text-sm text-emerald-200">or $60 a year</p>
        <ul class="mt-8 space-y-3 text-sm text-emerald-50">${li("Everything in Free", "text-emerald-300")}${li("Unlimited devices", "text-emerald-300")}${li("Shared notebooks", "text-emerald-300")}${li("Full version history", "text-emerald-300")}</ul>
        <a href="#" class="mt-10 inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-emerald-400 px-5 text-sm font-semibold text-emerald-950 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Upgrade to Pro</a>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Four Tier Grid with Segmented Billing",
    tags: ["4 plans", "Toggle"],
    html: `<section class="bg-slate-50 px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-6xl">
    <div class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
      <div><h2 class="text-4xl font-semibold tracking-tight">Pricing for Tidepool Analytics</h2><p class="mt-3 max-w-lg text-slate-600">Every plan includes unlimited dashboards. Pick by how much traffic you track.</p></div>
      ${seg("inline-flex rounded-lg bg-slate-200 p-1", "min-h-[40px] rounded-md px-4 text-sm font-semibold text-slate-600 transition aria-pressed:bg-white aria-pressed:text-slate-900 aria-pressed:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 motion-reduce:transition-none")}
    </div>
    <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="flex flex-col rounded-xl border border-slate-200 bg-white p-6"><h3 class="font-semibold">Hobby</h3><p class="mt-1 text-sm text-slate-600">10k page views</p><p class="mt-6 text-3xl font-semibold"><span data-m="$9" data-y="$7">$9</span><span class="text-sm font-normal text-slate-500">/mo</span></p><ul class="mt-6 flex-1 space-y-2.5 text-sm text-slate-700">${li("1 site", "text-sky-600")}${li("6 months of data", "text-sky-600")}</ul><a href="#" class="mt-8 rounded-lg bg-slate-100 py-2.5 text-center text-sm font-semibold hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Choose Hobby</a></div>
      <div class="flex flex-col rounded-xl border border-slate-200 bg-white p-6"><h3 class="font-semibold">Startup</h3><p class="mt-1 text-sm text-slate-600">100k page views</p><p class="mt-6 text-3xl font-semibold"><span data-m="$24" data-y="$19">$24</span><span class="text-sm font-normal text-slate-500">/mo</span></p><ul class="mt-6 flex-1 space-y-2.5 text-sm text-slate-700">${li("5 sites", "text-sky-600")}${li("2 years of data", "text-sky-600")}${li("Goal tracking", "text-sky-600")}</ul><a href="#" class="mt-8 rounded-lg bg-slate-100 py-2.5 text-center text-sm font-semibold hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Choose Startup</a></div>
      <div class="flex flex-col rounded-xl border-2 border-sky-600 bg-white p-6"><div class="flex items-center justify-between"><h3 class="font-semibold">Business</h3><span class="rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">Best value</span></div><p class="mt-1 text-sm text-slate-600">1M page views</p><p class="mt-6 text-3xl font-semibold"><span data-m="$69" data-y="$55">$69</span><span class="text-sm font-normal text-slate-500">/mo</span></p><ul class="mt-6 flex-1 space-y-2.5 text-sm text-slate-700">${li("50 sites", "text-sky-600")}${li("5 years of data", "text-sky-600")}${li("Funnels and cohorts", "text-sky-600")}</ul><a href="#" class="mt-8 rounded-lg bg-sky-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">Choose Business</a></div>
      <div class="flex flex-col rounded-xl border border-slate-200 bg-white p-6"><h3 class="font-semibold">Agency</h3><p class="mt-1 text-sm text-slate-600">5M page views</p><p class="mt-6 text-3xl font-semibold"><span data-m="$199" data-y="$159">$199</span><span class="text-sm font-normal text-slate-500">/mo</span></p><ul class="mt-6 flex-1 space-y-2.5 text-sm text-slate-700">${li("Unlimited sites", "text-sky-600")}${li("Client reports", "text-sky-600")}${li("Your own logo", "text-sky-600")}</ul><a href="#" class="mt-8 rounded-lg bg-slate-100 py-2.5 text-center text-sm font-semibold hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Choose Agency</a></div>
    </div>
    <p class="mt-6 text-center text-sm text-slate-600" data-m="Switch to yearly billing and pay for 10 months, not 12." data-y="Prices shown per month, billed once a year.">Switch to yearly billing and pay for 10 months, not 12.</p>
  </div>
</section>`,
  },
  {
    name: "Dark Pricing with Lit Middle Plan",
    tags: ["3 plans", "Dark", "Toggle"],
    html: `<section class="bg-zinc-950 px-4 py-24 text-zinc-100 sm:px-6">
  <div class="mx-auto max-w-5xl">
    <div class="text-center"><h2 class="text-4xl font-semibold tracking-tight sm:text-5xl">Render faster with Kilnworks</h2><p class="mt-4 text-zinc-400">Cloud render minutes for studios of every size.</p></div>
    <div class="mt-10 flex justify-center">${seg("inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1", "min-h-[40px] rounded-full px-5 text-sm font-medium text-zinc-400 transition aria-pressed:bg-amber-400 aria-pressed:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 motion-reduce:transition-none")}</div>
    <div class="mt-12 grid gap-6 md:grid-cols-3">
      <div class="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7"><h3 class="font-medium text-zinc-300">Solo</h3><p class="mt-5 text-4xl font-semibold"><span data-m="$15" data-y="$12">$15</span><span class="text-base font-normal text-zinc-500"> /mo</span></p><ul class="mt-7 space-y-3 text-sm text-zinc-300">${li("300 render minutes", "text-amber-400")}${li("1080p output", "text-amber-400")}</ul><a href="#" class="mt-8 block rounded-lg border border-zinc-700 py-2.5 text-center text-sm font-semibold hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">Get Solo</a></div>
      <div class="relative rounded-2xl border border-amber-400/60 bg-zinc-900 p-7 shadow-[0_0_60px_-12px_rgba(251,191,36,0.45)]"><h3 class="font-medium text-amber-300">Studio</h3><p class="mt-5 text-4xl font-semibold"><span data-m="$45" data-y="$36">$45</span><span class="text-base font-normal text-zinc-500"> /mo</span></p><ul class="mt-7 space-y-3 text-sm text-zinc-200">${li("1,500 render minutes", "text-amber-400")}${li("4K output", "text-amber-400")}${li("Priority queue", "text-amber-400")}${li("3 seats", "text-amber-400")}</ul><a href="#" class="mt-8 block rounded-lg bg-amber-400 py-2.5 text-center text-sm font-semibold text-zinc-950 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">Get Studio</a></div>
      <div class="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7"><h3 class="font-medium text-zinc-300">Facility</h3><p class="mt-5 text-4xl font-semibold"><span data-m="$140" data-y="$112">$140</span><span class="text-base font-normal text-zinc-500"> /mo</span></p><ul class="mt-7 space-y-3 text-sm text-zinc-300">${li("6,000 render minutes", "text-amber-400")}${li("8K output", "text-amber-400")}${li("Unlimited seats", "text-amber-400")}</ul><a href="#" class="mt-8 block rounded-lg border border-zinc-700 py-2.5 text-center text-sm font-semibold hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">Get Facility</a></div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Feature Comparison Table",
    tags: ["Comparison", "3 plans", "Toggle"],
    html: `<section class="bg-white px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-5xl">
    <div class="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"><div><h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Compare Larkspur plans</h2><p class="mt-2 text-slate-600">Booking software for salons and studios.</p></div><div class="flex items-center gap-3 text-sm font-medium text-slate-700"><span>Monthly</span>${sw("aria-checked:bg-violet-600", "focus-visible:ring-violet-600")}<span>Yearly</span></div></div>
    <div class="mt-10 overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full min-w-[640px] text-left text-sm">
        <caption class="sr-only">Larkspur plans compared feature by feature</caption>
        <thead class="bg-slate-50"><tr><th scope="col" class="w-2/5 p-4 font-medium text-slate-600">Features</th><th scope="col" class="p-4 text-center"><span class="block font-semibold">Chair</span><span class="mt-1 block text-2xl font-semibold" data-m="$29" data-y="$24">$29</span></th><th scope="col" class="bg-violet-50 p-4 text-center"><span class="block font-semibold text-violet-700">Salon</span><span class="mt-1 block text-2xl font-semibold" data-m="$79" data-y="$65">$79</span></th><th scope="col" class="p-4 text-center"><span class="block font-semibold">Group</span><span class="mt-1 block text-2xl font-semibold" data-m="$189" data-y="$155">$189</span></th></tr></thead>
        <tbody class="divide-y divide-slate-200">
          <tr><th scope="row" class="p-4 font-medium">Staff calendars</th><td class="p-4 text-center">1</td><td class="bg-violet-50/60 p-4 text-center">10</td><td class="p-4 text-center">Unlimited</td></tr>
          <tr><th scope="row" class="p-4 font-medium">Online booking page</th><td class="p-4">${yes("text-violet-600")}</td><td class="bg-violet-50/60 p-4">${yes("text-violet-600")}</td><td class="p-4">${yes("text-violet-600")}</td></tr>
          <tr><th scope="row" class="p-4 font-medium">Text reminders</th><td class="p-4 text-center">${dash("text-slate-400")}</td><td class="bg-violet-50/60 p-4">${yes("text-violet-600")}</td><td class="p-4">${yes("text-violet-600")}</td></tr>
          <tr><th scope="row" class="p-4 font-medium">Deposits and no-show fees</th><td class="p-4 text-center">${dash("text-slate-400")}</td><td class="bg-violet-50/60 p-4">${yes("text-violet-600")}</td><td class="p-4">${yes("text-violet-600")}</td></tr>
          <tr><th scope="row" class="p-4 font-medium">Multiple locations</th><td class="p-4 text-center">${dash("text-slate-400")}</td><td class="bg-violet-50/60 p-4 text-center">${dash("text-slate-400")}</td><td class="p-4">${yes("text-violet-600")}</td></tr>
          <tr><th scope="row" class="p-4 font-medium">Support</th><td class="p-4 text-center">Email</td><td class="bg-violet-50/60 p-4 text-center">Email and chat</td><td class="p-4 text-center">Named manager</td></tr>
        </tbody>
        <tfoot><tr><td class="p-4"></td><td class="p-4"><a href="#" class="block rounded-lg border border-slate-300 py-2 text-center font-semibold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600">Choose</a></td><td class="bg-violet-50/60 p-4"><a href="#" class="block rounded-lg bg-violet-600 py-2 text-center font-semibold text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">Choose</a></td><td class="p-4"><a href="#" class="block rounded-lg border border-slate-300 py-2 text-center font-semibold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600">Choose</a></td></tr></tfoot>
      </table>
    </div>
  </div>
</section>`,
  },
  {
    name: "Usage Based Pricing Slider",
    tags: ["Usage slider", "Single plan"],
    html: `<section class="bg-[#f6f5f1] px-4 py-20 text-stone-900 sm:px-6">
  <div class="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
    <div><p class="text-sm font-semibold text-orange-700">Pay as you send</p><h2 class="mt-2 text-4xl font-semibold tracking-tight">Postbird charges for emails sent, nothing else.</h2><p class="mt-4 text-stone-600">The first 3,000 emails each month are free. After that every thousand costs $0.80. Move the slider to see your bill.</p></div>
    <div class="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <label for="pb-emails" class="flex items-baseline justify-between text-sm font-medium text-stone-700">Emails per month<span class="text-2xl font-semibold text-stone-900" data-units="emails">40,000</span></label>
      <input id="pb-emails" type="range" min="1000" max="200000" step="1000" value="40000" data-usage="emails" class="mt-5 w-full accent-orange-600" />
      <div class="mt-2 flex justify-between text-xs text-stone-500"><span>1k</span><span>200k</span></div>
      <div class="mt-8 flex items-end justify-between border-t border-stone-200 pt-6"><div><p class="text-sm text-stone-600">Estimated monthly cost</p><p class="mt-1 text-5xl font-semibold tracking-tight" data-calc="emails:0,3000,0.0008" data-dec="2">$29.60</p></div><a href="#" class="rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2">Start sending</a></div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Per Seat Team Pricing Calculator",
    tags: ["Usage slider", "2 plans"],
    html: `<section class="bg-white px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-4xl">
    <h2 class="text-center text-4xl font-semibold tracking-tight">Pay per teammate on Quillstack</h2>
    <div class="mx-auto mt-10 max-w-md"><label for="qs-seats" class="flex justify-between text-sm font-medium text-slate-700"><span>Team size</span><span><span data-units="seats">12</span> people</span></label><input id="qs-seats" type="range" min="1" max="100" value="12" data-usage="seats" class="mt-3 w-full accent-teal-600" /></div>
    <div class="mt-10 grid gap-6 sm:grid-cols-2">
      <div class="rounded-2xl border border-slate-200 p-8"><h3 class="text-lg font-semibold">Team</h3><p class="mt-1 text-sm text-slate-600">$8 per person each month</p><p class="mt-6 text-4xl font-semibold tracking-tight" data-calc="seats:0,0,8">$96</p><p class="text-sm text-slate-500">per month</p><ul class="mt-6 space-y-2.5 text-sm text-slate-700">${li("Shared docs and wikis", "text-teal-600")}${li("90 day page history", "text-teal-600")}</ul></div>
      <div class="rounded-2xl bg-teal-900 p-8 text-white"><h3 class="text-lg font-semibold">Company</h3><p class="mt-1 text-sm text-teal-100">$14 per person, first 5 included in a $40 base</p><p class="mt-6 text-4xl font-semibold tracking-tight" data-calc="seats:40,5,14">$138</p><p class="text-sm text-teal-200">per month</p><ul class="mt-6 space-y-2.5 text-sm text-teal-50">${li("Single sign-on", "text-teal-300")}${li("Unlimited history", "text-teal-300")}${li("Audit log", "text-teal-300")}</ul></div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Single Plan Pricing Card",
    tags: ["Single plan"],
    html: `<section class="bg-rose-50 px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-rose-100 md:flex">
    <div class="p-8 sm:p-10 md:flex-1"><h2 class="text-3xl font-semibold tracking-tight">One plan. Every recipe.</h2><p class="mt-3 text-slate-600">Saffron Table gives you the full cookbook library, meal planner and shopping lists.</p><p class="mt-8 text-sm font-semibold text-rose-700">What you get</p><ul class="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">${li("2,400 tested recipes", "text-rose-600")}${li("Weekly meal planner", "text-rose-600")}${li("Shared shopping list", "text-rose-600")}${li("Offline mode", "text-rose-600")}</ul></div>
    <div class="flex flex-col justify-center bg-rose-100/60 p-8 text-center sm:p-10 md:w-72"><p class="text-sm font-medium text-slate-600">Pay once a year</p><p class="mt-3 text-5xl font-semibold tracking-tight">$48</p><p class="mt-1 text-sm text-slate-600">that is $4 a month</p><a href="#" class="mt-6 rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2">Join Saffron Table</a><p class="mt-3 text-xs text-slate-600">Cancel before renewal, keep access until then.</p></div>
  </div>
</section>`,
  },
  {
    name: "Plans with Enterprise Contact Form",
    tags: ["Enterprise", "2 plans"],
    html: `<section class="bg-slate-950 px-4 py-20 text-white sm:px-6">
  <div class="mx-auto grid max-w-6xl gap-10 lg:grid-cols-5">
    <div class="lg:col-span-3"><h2 class="text-4xl font-semibold tracking-tight">Harbourline for teams of any size</h2><p class="mt-3 text-slate-400">Self-serve plans start today. Larger fleets get a plan built with our team.</p>
      <div class="mt-10 grid gap-4 sm:grid-cols-2"><div class="rounded-xl border border-slate-800 p-6"><h3 class="font-semibold">Crew</h3><p class="mt-3 text-3xl font-semibold">$39<span class="text-sm font-normal text-slate-400">/mo</span></p><p class="mt-2 text-sm text-slate-400">Up to 10 vehicles tracked live.</p><a href="#" class="mt-6 inline-block text-sm font-semibold text-sky-400 hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">Start a trial →</a></div><div class="rounded-xl border border-slate-800 p-6"><h3 class="font-semibold">Depot</h3><p class="mt-3 text-3xl font-semibold">$149<span class="text-sm font-normal text-slate-400">/mo</span></p><p class="mt-2 text-sm text-slate-400">Up to 60 vehicles, route planning.</p><a href="#" class="mt-6 inline-block text-sm font-semibold text-sky-400 hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">Start a trial →</a></div></div>
    </div>
    <form class="rounded-2xl bg-white p-6 text-slate-900 sm:p-8 lg:col-span-2" action="#"><h3 class="text-lg font-semibold">Enterprise</h3><p class="mt-1 text-sm text-slate-600">Over 60 vehicles, custom terms or on-site setup. We reply within one working day.</p>
      <label for="hl-email" class="mt-6 block text-sm font-medium">Work email</label><input id="hl-email" type="email" autocomplete="email" placeholder="you@company.example" class="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/30" />
      <label for="hl-fleet" class="mt-4 block text-sm font-medium">Fleet size</label><select id="hl-fleet" class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/30"><option>60 to 200</option><option>200 to 1,000</option><option>Over 1,000</option></select>
      <button type="submit" class="mt-6 w-full rounded-lg bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">Talk to sales</button></form>
  </div>
</section>`,
  },
  {
    name: "Pricing Section with FAQ",
    tags: ["3 plans", "FAQ"],
    html: `<section class="bg-white px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-5xl">
    <h2 class="text-center text-4xl font-semibold tracking-tight">Simple pricing for Copperleaf invoices</h2>
    <div class="mt-12 grid gap-4 md:grid-cols-3">
      <div class="rounded-xl bg-slate-50 p-6"><h3 class="font-semibold">Freelance</h3><p class="mt-3 text-3xl font-semibold">$12<span class="text-sm font-normal text-slate-500">/mo</span></p><p class="mt-2 text-sm text-slate-600">20 invoices a month, card payments.</p><a href="#" class="mt-6 block rounded-lg bg-white py-2.5 text-center text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-700">Choose</a></div>
      <div class="rounded-xl bg-lime-300 p-6"><h3 class="font-semibold">Studio</h3><p class="mt-3 text-3xl font-semibold">$29<span class="text-sm font-normal text-lime-900">/mo</span></p><p class="mt-2 text-sm text-lime-950">Unlimited invoices, 3 users, reminders.</p><a href="#" class="mt-6 block rounded-lg bg-slate-900 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-lime-300">Choose</a></div>
      <div class="rounded-xl bg-slate-50 p-6"><h3 class="font-semibold">Firm</h3><p class="mt-3 text-3xl font-semibold">$79<span class="text-sm font-normal text-slate-500">/mo</span></p><p class="mt-2 text-sm text-slate-600">Unlimited users, approvals, exports.</p><a href="#" class="mt-6 block rounded-lg bg-white py-2.5 text-center text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-700">Choose</a></div>
    </div>
    <div class="mx-auto mt-16 max-w-3xl"><h3 class="text-xl font-semibold">Questions about billing</h3>
      <div class="mt-4 divide-y divide-slate-200 border-y border-slate-200">
        <details class="group py-4" open><summary class="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-700">Can I change plans later?<span class="text-xl leading-none text-slate-500 transition group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true">+</span></summary><p class="mt-3 text-sm text-slate-600">Yes. Upgrades apply at once and we charge only the difference for the rest of the month. Downgrades apply at your next bill.</p></details>
        <details class="group py-4"><summary class="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-700">Do you take a cut of payments?<span class="text-xl leading-none text-slate-500 transition group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true">+</span></summary><p class="mt-3 text-sm text-slate-600">No. Your payment processor charges its usual card fee and we add nothing on top.</p></details>
        <details class="group py-4"><summary class="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-700">What happens if I cancel?<span class="text-xl leading-none text-slate-500 transition group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true">+</span></summary><p class="mt-3 text-sm text-slate-600">Your account turns read only. You can still download every invoice you have sent as a PDF or spreadsheet.</p></details>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Minimal Pricing List",
    tags: ["Minimal", "3 plans"],
    html: `<section class="bg-white px-4 py-24 text-neutral-900 sm:px-6">
  <div class="mx-auto max-w-2xl">
    <h2 class="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">Pricing</h2>
    <p class="mt-4 text-3xl font-light leading-snug tracking-tight">Northfold hosts your portfolio. Choose how much room you need.</p>
    <ul class="mt-12 divide-y divide-neutral-200 border-y border-neutral-200">
      <li class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-6"><div><h3 class="font-medium">Sketch</h3><p class="text-sm text-neutral-600">One portfolio, 50 images</p></div><p class="font-mono text-lg">$4 / mo</p></li>
      <li class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-6"><div><h3 class="font-medium">Folio</h3><p class="text-sm text-neutral-600">Your own domain, unlimited images</p></div><p class="font-mono text-lg">$10 / mo</p></li>
      <li class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-6"><div><h3 class="font-medium">Studio</h3><p class="text-sm text-neutral-600">Client proofing and print sales</p></div><p class="font-mono text-lg">$22 / mo</p></li>
    </ul>
    <a href="#" class="mt-10 inline-flex min-h-[44px] items-center gap-2 border-b border-neutral-900 text-sm font-medium hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 motion-reduce:transition-none">Start a 14 day trial <span aria-hidden="true">→</span></a>
  </div>
</section>`,
  },
  {
    name: "Horizontal Plan Rows",
    tags: ["Horizontal", "3 plans"],
    html: `<section class="bg-teal-950 px-4 py-20 text-teal-50 sm:px-6">
  <div class="mx-auto max-w-5xl">
    <h2 class="text-4xl font-semibold tracking-tight">Brightwell coworking memberships</h2>
    <div class="mt-10 space-y-3">
      <div class="grid items-center gap-4 rounded-2xl bg-teal-900/60 p-6 md:grid-cols-[1.2fr_2fr_auto_auto] md:gap-8"><h3 class="text-lg font-semibold">Drop in</h3><p class="text-sm text-teal-200">Any open desk, 8 days a month, coffee included.</p><p class="text-2xl font-semibold">$120<span class="text-sm font-normal text-teal-300">/mo</span></p><a href="#" class="rounded-full border border-teal-400 px-5 py-2.5 text-center text-sm font-semibold hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">Join</a></div>
      <div class="grid items-center gap-4 rounded-2xl bg-teal-300 p-6 text-teal-950 md:grid-cols-[1.2fr_2fr_auto_auto] md:gap-8"><h3 class="text-lg font-semibold">Resident <span class="ml-2 rounded-full bg-teal-950 px-2 py-0.5 align-middle text-xs font-semibold text-teal-100">Popular</span></h3><p class="text-sm text-teal-900">Your own desk every day, locker and 4 meeting room hours.</p><p class="text-2xl font-semibold">$290<span class="text-sm font-normal text-teal-800">/mo</span></p><a href="#" class="rounded-full bg-teal-950 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-950 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300">Join</a></div>
      <div class="grid items-center gap-4 rounded-2xl bg-teal-900/60 p-6 md:grid-cols-[1.2fr_2fr_auto_auto] md:gap-8"><h3 class="text-lg font-semibold">Private office</h3><p class="text-sm text-teal-200">A lockable room for up to 4 people, all hours.</p><p class="text-2xl font-semibold">$980<span class="text-sm font-normal text-teal-300">/mo</span></p><a href="#" class="rounded-full border border-teal-400 px-5 py-2.5 text-center text-sm font-semibold hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">Join</a></div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Mobile First Plan Picker",
    tags: ["Mobile first", "3 plans"],
    html: `<section class="bg-indigo-50 px-4 py-16 text-slate-900 sm:px-6">
  <form class="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm sm:p-8" action="#">
    <h2 class="text-2xl font-semibold tracking-tight">Choose your Wavelength plan</h2>
    <p class="mt-1 text-sm text-slate-600">Ad-free listening on every device.</p>
    <fieldset class="mt-6 space-y-3"><legend class="sr-only">Plan</legend>
      <label for="wl-plan-1" class="flex min-h-[64px] cursor-pointer items-center gap-4 rounded-2xl border-2 border-slate-200 px-4 py-3 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-600"><input id="wl-plan-1" type="radio" name="wl-plan" class="h-5 w-5 accent-indigo-600" /><span class="flex-1"><span class="block font-semibold">Monthly</span><span class="block text-sm text-slate-600">Pay as you go</span></span><span class="font-semibold">$7.99</span></label>
      <label for="wl-plan-2" class="flex min-h-[64px] cursor-pointer items-center gap-4 rounded-2xl border-2 border-slate-200 px-4 py-3 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-600"><input id="wl-plan-2" type="radio" name="wl-plan" checked class="h-5 w-5 accent-indigo-600" /><span class="flex-1"><span class="block font-semibold">Yearly <span class="ml-1 rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">Save 37%</span></span><span class="block text-sm text-slate-600">$59.99 once a year</span></span><span class="font-semibold">$5.00<span class="text-xs font-normal text-slate-500">/mo</span></span></label>
      <label for="wl-plan-3" class="flex min-h-[64px] cursor-pointer items-center gap-4 rounded-2xl border-2 border-slate-200 px-4 py-3 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-600"><input id="wl-plan-3" type="radio" name="wl-plan" class="h-5 w-5 accent-indigo-600" /><span class="flex-1"><span class="block font-semibold">Family</span><span class="block text-sm text-slate-600">Up to 6 listeners</span></span><span class="font-semibold">$12.99</span></label>
    </fieldset>
    <button type="submit" class="mt-6 min-h-[52px] w-full rounded-full bg-indigo-600 text-base font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">Continue</button>
    <p class="mt-3 text-center text-xs text-slate-600">You can change or cancel your plan in settings.</p>
  </form>
</section>`,
  },
  {
    name: "Personal and Team Pricing Switch",
    tags: ["Toggle", "2 plans"],
    sv: "team",
    html: `<section class="bg-white px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-4xl text-center">
    <h2 class="text-4xl font-semibold tracking-tight">Mapleframe for you, or for your whole team</h2>
    <div class="mt-8 flex justify-center">${seg("inline-flex rounded-xl border border-slate-200 p-1", "min-h-[40px] rounded-lg px-5 text-sm font-semibold text-slate-600 transition aria-pressed:bg-slate-900 aria-pressed:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 motion-reduce:transition-none", "Personal", "Team", "Who is it for")}</div>
    <div class="mt-10 grid gap-6 text-left md:grid-cols-2">
      <div class="rounded-2xl border border-slate-200 p-8"><h3 class="text-lg font-semibold" data-m="Basic" data-y="Team Basic">Basic</h3><p class="mt-4 text-4xl font-semibold" data-m="$0" data-y="$6 per user">$0</p><p class="mt-2 text-sm text-slate-600" data-m="Up to 3 projects with photo storage of 2 GB." data-y="Shared projects, comments and 50 GB per user.">Up to 3 projects with photo storage of 2 GB.</p><a href="#" class="mt-6 inline-block rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900">Get started</a></div>
      <div class="rounded-2xl bg-amber-100 p-8"><h3 class="text-lg font-semibold" data-m="Plus" data-y="Team Plus">Plus</h3><p class="mt-4 text-4xl font-semibold" data-m="$9 a month" data-y="$15 per user">$9 a month</p><p class="mt-2 text-sm text-amber-950" data-m="Unlimited projects, 200 GB, print-ready exports." data-y="Brand kits, approvals, admin controls and 1 TB per user.">Unlimited projects, 200 GB, print-ready exports.</p><a href="#" class="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2">Try Plus free</a></div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Brutalist Pricing Cards",
    tags: ["3 plans"],
    html: `<section class="bg-yellow-300 px-4 py-20 text-black sm:px-6">
  <div class="mx-auto max-w-5xl">
    <h2 class="text-5xl font-black uppercase leading-none tracking-tight sm:text-6xl">Pick a plan.<br />Ship the zine.</h2>
    <div class="mt-12 grid gap-6 md:grid-cols-3">
      <div class="border-4 border-black bg-white p-6 shadow-[8px_8px_0_#000]"><h3 class="text-xl font-black uppercase">Photocopy</h3><p class="mt-4 text-5xl font-black">$0</p><ul class="mt-6 space-y-2 font-medium"><li>1 issue a month</li><li>100 readers</li></ul><a href="#" class="mt-8 block border-4 border-black bg-white py-3 text-center font-black uppercase hover:bg-black hover:text-yellow-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2">Start free</a></div>
      <div class="border-4 border-black bg-pink-400 p-6 shadow-[8px_8px_0_#000]"><h3 class="text-xl font-black uppercase">Press</h3><p class="mt-4 text-5xl font-black">$12</p><ul class="mt-6 space-y-2 font-medium"><li>Weekly issues</li><li>5,000 readers</li><li>Paid subscriptions</li></ul><a href="#" class="mt-8 block border-4 border-black bg-black py-3 text-center font-black uppercase text-white hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2">Go Press</a></div>
      <div class="border-4 border-black bg-white p-6 shadow-[8px_8px_0_#000]"><h3 class="text-xl font-black uppercase">Syndicate</h3><p class="mt-4 text-5xl font-black">$40</p><ul class="mt-6 space-y-2 font-medium"><li>Unlimited readers</li><li>10 editors</li><li>Custom domain</li></ul><a href="#" class="mt-8 block border-4 border-black bg-white py-3 text-center font-black uppercase hover:bg-black hover:text-yellow-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2">Go big</a></div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Editorial Serif Pricing",
    tags: ["3 plans", "Minimal"],
    html: `<section class="bg-[#f3eee4] px-4 py-24 text-[#2b2620] sm:px-6">
  <div class="mx-auto max-w-5xl">
    <h2 class="max-w-2xl font-serif text-5xl leading-tight">Subscribe to The Lantern Review</h2>
    <p class="mt-4 max-w-xl text-[#5c5348]">Long reads on design and cities, delivered on Sunday mornings.</p>
    <div class="mt-14 grid border-t border-[#2b2620] md:grid-cols-3 md:divide-x md:divide-[#2b2620]/20">
      <div class="py-8 md:pr-8"><h3 class="font-serif text-2xl">Reader</h3><p class="mt-6 font-serif text-4xl">$5<span class="font-sans text-sm text-[#5c5348]"> a month</span></p><p class="mt-4 text-sm leading-relaxed text-[#5c5348]">Every essay online and the full archive back to the first issue.</p><a href="#" class="mt-6 inline-block border-b border-[#2b2620] pb-0.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a3412]">Subscribe</a></div>
      <div class="border-t border-[#2b2620]/20 py-8 md:border-t-0 md:px-8"><p class="text-xs font-semibold uppercase tracking-widest text-[#9a3412]">Editor's choice</p><h3 class="mt-2 font-serif text-2xl">Print and digital</h3><p class="mt-6 font-serif text-4xl">$14<span class="font-sans text-sm text-[#5c5348]"> a month</span></p><p class="mt-4 text-sm leading-relaxed text-[#5c5348]">Four printed quarterlies a year posted to your door, plus everything online.</p><a href="#" class="mt-6 inline-block bg-[#9a3412] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7c2d12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a3412] focus-visible:ring-offset-2">Subscribe</a></div>
      <div class="border-t border-[#2b2620]/20 py-8 md:border-t-0 md:pl-8"><h3 class="font-serif text-2xl">Patron</h3><p class="mt-6 font-serif text-4xl">$30<span class="font-sans text-sm text-[#5c5348]"> a month</span></p><p class="mt-4 text-sm leading-relaxed text-[#5c5348]">Print, digital, two gift subscriptions and an invite to the yearly salon.</p><a href="#" class="mt-6 inline-block border-b border-[#2b2620] pb-0.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a3412]">Subscribe</a></div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Dark Split Hero with Plan Card",
    tags: ["Single plan", "Dark", "Toggle"],
    html: `<section class="bg-[#0d1117] px-4 py-20 text-slate-100 sm:px-6">
  <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
    <div><h2 class="text-4xl font-semibold tracking-tight sm:text-5xl">Backups that run while you sleep</h2><p class="mt-5 text-lg text-slate-400">Vaultline copies your databases every hour, keeps 30 days of history and restores in one click.</p><ul class="mt-8 space-y-3 text-slate-300">${li("Hourly snapshots", "text-emerald-400")}${li("Encrypted before they leave your server", "text-emerald-400")}${li("Restore to any point in time", "text-emerald-400")}</ul></div>
    <div class="rounded-3xl border border-slate-800 bg-slate-900 p-8">
      <div class="flex items-center justify-between"><h3 class="font-semibold">Vaultline Pro</h3><div class="flex items-center gap-2 text-sm text-slate-400"><span>Yearly</span>${sw("aria-checked:bg-emerald-500", "focus-visible:ring-emerald-400 focus-visible:ring-offset-slate-900")}</div></div>
      <p class="mt-8 flex items-baseline gap-2"><span class="text-6xl font-semibold tracking-tight" data-m="$32" data-y="$26">$32</span><span class="text-slate-400">per server / month</span></p>
      <p class="mt-2 min-h-[20px] text-sm text-emerald-400" data-m="" data-y="You save $72 per server each year"></p>
      <a href="#" class="mt-8 block rounded-xl bg-emerald-500 py-3.5 text-center font-semibold text-slate-950 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Protect my first server</a>
      <p class="mt-4 text-center text-xs text-slate-500">14 days free. No card needed to try.</p>
    </div>
  </div>
</section>`,
  },
  {
    name: "Everything in the Plan Before, Plus",
    tags: ["3 plans"],
    html: `<section class="bg-white px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-6xl">
    <h2 class="max-w-xl text-4xl font-semibold tracking-tight">Ridgeway project plans, from first client to full studio</h2>
    <div class="mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 lg:grid-cols-3">
      <div class="bg-white p-8"><h3 class="text-lg font-semibold">Basic</h3><p class="mt-2 text-sm text-slate-600">Plan and track simple projects.</p><p class="mt-6 text-4xl font-semibold">$10</p><p class="text-sm text-slate-500">per user, per month</p><a href="#" class="mt-6 block rounded-md bg-blue-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Buy Basic</a><p class="mt-8 text-sm font-semibold">Includes</p><ul class="mt-3 space-y-2.5 text-sm text-slate-700">${li("Boards and lists", "text-blue-600")}${li("Due dates and reminders", "text-blue-600")}${li("File attachments", "text-blue-600")}</ul></div>
      <div class="bg-white p-8"><h3 class="text-lg font-semibold">Plus</h3><p class="mt-2 text-sm text-slate-600">Run projects across a team.</p><p class="mt-6 text-4xl font-semibold">$18</p><p class="text-sm text-slate-500">per user, per month</p><a href="#" class="mt-6 block rounded-md bg-blue-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Buy Plus</a><p class="mt-8 text-sm font-semibold">Everything in Basic, plus</p><ul class="mt-3 space-y-2.5 text-sm text-slate-700">${li("Timelines", "text-blue-600")}${li("Time tracking", "text-blue-600")}${li("Guest access", "text-blue-600")}</ul></div>
      <div class="bg-white p-8"><h3 class="text-lg font-semibold">Studio</h3><p class="mt-2 text-sm text-slate-600">Budgets, billing and reports.</p><p class="mt-6 text-4xl font-semibold">$29</p><p class="text-sm text-slate-500">per user, per month</p><a href="#" class="mt-6 block rounded-md bg-blue-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Buy Studio</a><p class="mt-8 text-sm font-semibold">Everything in Plus, plus</p><ul class="mt-3 space-y-2.5 text-sm text-slate-700">${li("Project budgets", "text-blue-600")}${li("Invoices from tracked time", "text-blue-600")}${li("Profit reports", "text-blue-600")}</ul></div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Subscription or Lifetime License",
    tags: ["2 plans"],
    html: `<section class="bg-sky-50 px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-4xl">
    <h2 class="text-center text-4xl font-semibold tracking-tight">Own Glyphbox outright, or keep it current</h2>
    <p class="mx-auto mt-3 max-w-lg text-center text-slate-600">A font manager for designers. Both options include every feature available today.</p>
    <div class="mt-12 grid gap-6 md:grid-cols-2">
      <div class="rounded-3xl bg-white p-8 ring-1 ring-sky-100"><h3 class="font-semibold">Subscription</h3><p class="mt-4 text-5xl font-semibold tracking-tight">$4<span class="text-base font-medium text-slate-500">/month</span></p><ul class="mt-8 space-y-3 text-sm text-slate-700">${li("Every new feature as it ships", "text-sky-600")}${li("Sync across 3 computers", "text-sky-600")}${li("Cancel whenever you like", "text-sky-600")}</ul><a href="#" class="mt-8 block rounded-xl bg-sky-600 py-3 text-center text-sm font-semibold text-white hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">Subscribe</a></div>
      <div class="rounded-3xl bg-slate-900 p-8 text-white"><h3 class="font-semibold">Lifetime license</h3><p class="mt-4 text-5xl font-semibold tracking-tight">$89<span class="text-base font-medium text-slate-400"> once</span></p><ul class="mt-8 space-y-3 text-sm text-slate-200">${li("Version 3 yours to keep", "text-sky-300")}${li("1 year of updates included", "text-sky-300")}${li("Install on 2 computers", "text-sky-300")}</ul><a href="#" class="mt-8 block rounded-xl bg-white py-3 text-center text-sm font-semibold text-slate-900 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">Buy once</a></div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Pricing with Education Discount Banner",
    tags: ["3 plans"],
    html: `<section class="bg-white px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-5xl">
    <h2 class="text-center text-4xl font-semibold tracking-tight">Plans for Chalkline classrooms</h2>
    <div class="mt-12 grid gap-6 md:grid-cols-3">
      <div class="rounded-2xl border border-slate-200 p-7"><h3 class="font-semibold">Teacher</h3><p class="mt-4 text-3xl font-semibold">$8<span class="text-sm font-normal text-slate-500">/mo</span></p><p class="mt-3 text-sm text-slate-600">One teacher, up to 150 students.</p></div>
      <div class="rounded-2xl border border-slate-200 p-7"><h3 class="font-semibold">Department</h3><p class="mt-4 text-3xl font-semibold">$60<span class="text-sm font-normal text-slate-500">/mo</span></p><p class="mt-3 text-sm text-slate-600">Ten teachers sharing lesson banks.</p></div>
      <div class="rounded-2xl border border-slate-200 p-7"><h3 class="font-semibold">School</h3><p class="mt-4 text-3xl font-semibold">$240<span class="text-sm font-normal text-slate-500">/mo</span></p><p class="mt-3 text-sm text-slate-600">Every teacher, parent reports, rostering.</p></div>
    </div>
    <div class="mt-6 flex flex-col items-start gap-4 rounded-2xl bg-fuchsia-50 p-6 ring-1 ring-fuchsia-200 sm:flex-row sm:items-center sm:justify-between"><div><h3 class="font-semibold text-fuchsia-900">Public school or charity?</h3><p class="mt-1 text-sm text-fuchsia-900/80">Send us proof of status and we take 50% off any plan for as long as you stay.</p></div><a href="#" class="shrink-0 rounded-lg bg-fuchsia-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-700 focus-visible:ring-offset-2">Apply for the discount</a></div>
  </div>
</section>`,
  },
  {
    name: "Dark Comparison Table",
    tags: ["Comparison", "Dark", "4 plans"],
    html: `<section class="bg-neutral-950 px-4 py-20 text-neutral-100 sm:px-6">
  <div class="mx-auto max-w-6xl">
    <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Every Driftwood hosting plan, side by side</h2>
    <div class="mt-10 overflow-x-auto">
      <table class="w-full min-w-[720px] border-collapse text-sm">
        <caption class="sr-only">Driftwood hosting plans compared</caption>
        <thead><tr class="border-b border-neutral-800"><th scope="col" class="py-4 pr-4 text-left font-medium text-neutral-400">Plan</th><th scope="col" class="px-4 py-4 text-left font-semibold">Spark<span class="block text-xl">$5</span></th><th scope="col" class="px-4 py-4 text-left font-semibold">Flame<span class="block text-xl">$15</span></th><th scope="col" class="rounded-t-xl bg-rose-500/10 px-4 py-4 text-left font-semibold text-rose-300">Blaze<span class="block text-xl text-white">$40</span></th><th scope="col" class="px-4 py-4 text-left font-semibold">Inferno<span class="block text-xl">$120</span></th></tr></thead>
        <tbody class="divide-y divide-neutral-800 text-neutral-300">
          <tr><th scope="row" class="py-3.5 pr-4 text-left font-normal text-neutral-400">Memory</th><td class="px-4 py-3.5">1 GB</td><td class="px-4 py-3.5">4 GB</td><td class="bg-rose-500/10 px-4 py-3.5 text-white">16 GB</td><td class="px-4 py-3.5">64 GB</td></tr>
          <tr><th scope="row" class="py-3.5 pr-4 text-left font-normal text-neutral-400">Processor cores</th><td class="px-4 py-3.5">1</td><td class="px-4 py-3.5">2</td><td class="bg-rose-500/10 px-4 py-3.5 text-white">6</td><td class="px-4 py-3.5">16</td></tr>
          <tr><th scope="row" class="py-3.5 pr-4 text-left font-normal text-neutral-400">Disk</th><td class="px-4 py-3.5">25 GB</td><td class="px-4 py-3.5">80 GB</td><td class="bg-rose-500/10 px-4 py-3.5 text-white">320 GB</td><td class="px-4 py-3.5">1.2 TB</td></tr>
          <tr><th scope="row" class="py-3.5 pr-4 text-left font-normal text-neutral-400">Transfer each month</th><td class="px-4 py-3.5">1 TB</td><td class="px-4 py-3.5">3 TB</td><td class="bg-rose-500/10 px-4 py-3.5 text-white">8 TB</td><td class="px-4 py-3.5">20 TB</td></tr>
          <tr><th scope="row" class="py-3.5 pr-4 text-left font-normal text-neutral-400">Daily backups</th><td class="px-4 py-3.5">${dash("text-neutral-600")}</td><td class="px-4 py-3.5">${yes("!mx-0 text-rose-400")}</td><td class="bg-rose-500/10 px-4 py-3.5">${yes("!mx-0 text-rose-400")}</td><td class="px-4 py-3.5">${yes("!mx-0 text-rose-400")}</td></tr>
        </tbody>
        <tfoot><tr><td></td><td class="px-4 pt-6"><a href="#" class="inline-block rounded-md border border-neutral-700 px-4 py-2 font-semibold hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">Deploy</a></td><td class="px-4 pt-6"><a href="#" class="inline-block rounded-md border border-neutral-700 px-4 py-2 font-semibold hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">Deploy</a></td><td class="rounded-b-xl bg-rose-500/10 px-4 pb-4 pt-6"><a href="#" class="inline-block rounded-md bg-rose-500 px-4 py-2 font-semibold text-white hover:bg-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">Deploy</a></td><td class="px-4 pt-6"><a href="#" class="inline-block rounded-md border border-neutral-700 px-4 py-2 font-semibold hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">Deploy</a></td></tr></tfoot>
      </table>
    </div>
    <p class="mt-4 text-xs text-neutral-500">Monthly prices per server.</p>
  </div>
</section>`,
  },
  {
    name: "Volume Rate Tiers Table",
    tags: ["Comparison", "Minimal"],
    html: `<section class="bg-white px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_1.3fr]">
    <div><h2 class="text-4xl font-semibold tracking-tight">Signalhouse text message rates</h2><p class="mt-4 text-slate-600">You pay per message sent. The more you send in a month, the less each one costs. Rates drop automatically, no plan to change.</p><a href="#" class="mt-8 inline-block rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2">Get an API key</a></div>
    <div class="overflow-hidden rounded-xl border border-slate-200">
      <table class="w-full text-sm"><caption class="sr-only">Price per message by monthly volume</caption>
        <thead class="bg-slate-50 text-left"><tr><th scope="col" class="px-5 py-3 font-medium text-slate-600">Messages this month</th><th scope="col" class="px-5 py-3 text-right font-medium text-slate-600">Price per message</th></tr></thead>
        <tbody class="divide-y divide-slate-200 font-mono">
          <tr><td class="px-5 py-4">First 10,000</td><td class="px-5 py-4 text-right">$0.0079</td></tr>
          <tr><td class="px-5 py-4">10,001 to 100,000</td><td class="px-5 py-4 text-right">$0.0065</td></tr>
          <tr><td class="px-5 py-4">100,001 to 1,000,000</td><td class="px-5 py-4 text-right">$0.0049</td></tr>
          <tr class="bg-slate-50"><td class="px-5 py-4">Over 1,000,000</td><td class="px-5 py-4 text-right font-sans font-semibold"><a href="#" class="text-indigo-700 underline underline-offset-4 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700">Ask for a rate</a></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>`,
  },
  {
    name: "Credit Pack Pricing",
    tags: ["4 plans"],
    html: `<section class="bg-orange-50 px-4 py-20 text-stone-900 sm:px-6">
  <div class="mx-auto max-w-5xl">
    <div class="text-center"><h2 class="text-4xl font-semibold tracking-tight">Top up Pixelmint credits</h2><p class="mt-3 text-stone-600">One credit prints one photo. Credits never expire.</p></div>
    <div class="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <a href="#" class="group rounded-2xl bg-white p-6 ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 motion-reduce:transition-none"><p class="text-sm text-stone-600">Small</p><p class="mt-2 text-3xl font-semibold">20</p><p class="text-sm text-stone-600">credits</p><p class="mt-6 font-semibold">$6</p><p class="text-xs text-stone-500">$0.30 each</p></a>
      <a href="#" class="group rounded-2xl bg-white p-6 ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 motion-reduce:transition-none"><p class="text-sm text-stone-600">Medium</p><p class="mt-2 text-3xl font-semibold">60</p><p class="text-sm text-stone-600">credits</p><p class="mt-6 font-semibold">$15</p><p class="text-xs text-stone-500">$0.25 each</p></a>
      <a href="#" class="group rounded-2xl bg-orange-600 p-6 text-white transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 motion-reduce:transition-none"><p class="text-sm text-orange-100">Large</p><p class="mt-2 text-3xl font-semibold">150</p><p class="text-sm text-orange-100">credits</p><p class="mt-6 font-semibold">$30</p><p class="text-xs text-orange-100">$0.20 each</p></a>
      <a href="#" class="group rounded-2xl bg-white p-6 ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 motion-reduce:transition-none"><p class="text-sm text-stone-600">Studio</p><p class="mt-2 text-3xl font-semibold">500</p><p class="text-sm text-stone-600">credits</p><p class="mt-6 font-semibold">$80</p><p class="text-xs text-stone-500">$0.16 each</p></a>
    </div>
  </div>
</section>`,
  },
  {
    name: "Build Your Plan with Two Sliders",
    tags: ["Usage slider"],
    html: `<section class="bg-slate-100 px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm sm:p-10">
    <h2 class="text-3xl font-semibold tracking-tight">Size your Cloudberry workspace</h2>
    <p class="mt-2 text-slate-600">$5 base, then $6 per member after the first 3 and $0.04 per GB after the first 50 GB.</p>
    <div class="mt-8 space-y-8">
      <div><label for="cb-members" class="flex justify-between text-sm font-medium"><span>Members</span><span data-units="members">8</span></label><input id="cb-members" type="range" min="1" max="50" value="8" data-usage="members" class="mt-3 w-full accent-blue-600" /></div>
      <div><label for="cb-storage" class="flex justify-between text-sm font-medium"><span>Storage (GB)</span><span data-units="storage">200</span></label><input id="cb-storage" type="range" min="10" max="2000" step="10" value="200" data-usage="storage" class="mt-3 w-full accent-blue-600" /></div>
    </div>
    <div class="mt-10 flex flex-col gap-4 rounded-2xl bg-blue-50 p-6 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-sm text-blue-900">Your monthly price</p><p class="text-4xl font-semibold tracking-tight text-blue-950" data-calc="members:5,3,6+storage:0,50,0.04">$41</p></div><a href="#" class="rounded-xl bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Create workspace</a></div>
  </div>
</section>`,
  },
  {
    name: "Base Plan with Add Ons",
    tags: ["Usage slider", "Single plan"],
    html: `<section class="bg-white px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
    <div><h2 class="text-4xl font-semibold tracking-tight">Start with Oakhollow Core, add what you need</h2><p class="mt-4 text-slate-600">Core runs your property listings for $25 a month. Tick the extras and the total updates.</p></div>
    <fieldset class="rounded-2xl border border-slate-200 p-6"><legend class="px-2 text-sm font-semibold">Add-ons</legend>
      <div class="space-y-3">
        <label for="addon-tours" class="flex min-h-[56px] cursor-pointer items-center gap-4 rounded-xl border border-slate-200 px-4 has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50"><input id="addon-tours" type="checkbox" checked data-usage="tours" class="h-5 w-5 accent-purple-600" /><span class="flex-1 text-sm font-medium">Virtual tours</span><span class="text-sm text-slate-600">+$15</span></label>
        <label for="addon-leads" class="flex min-h-[56px] cursor-pointer items-center gap-4 rounded-xl border border-slate-200 px-4 has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50"><input id="addon-leads" type="checkbox" data-usage="leads" class="h-5 w-5 accent-purple-600" /><span class="flex-1 text-sm font-medium">Lead inbox and auto replies</span><span class="text-sm text-slate-600">+$10</span></label>
        <label for="addon-sign" class="flex min-h-[56px] cursor-pointer items-center gap-4 rounded-xl border border-slate-200 px-4 has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50"><input id="addon-sign" type="checkbox" data-usage="sign" class="h-5 w-5 accent-purple-600" /><span class="flex-1 text-sm font-medium">E-signatures</span><span class="text-sm text-slate-600">+$12</span></label>
      </div>
      <div class="mt-6 flex items-center justify-between border-t border-slate-200 pt-5"><p class="text-sm text-slate-600">Total per month</p><p class="text-3xl font-semibold" data-calc="tours:25,0,15+leads:0,0,10+sign:0,0,12">$40</p></div>
      <a href="#" class="mt-5 block rounded-lg bg-purple-700 py-3 text-center text-sm font-semibold text-white hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2">Continue to checkout</a>
    </fieldset>
  </div>
</section>`,
  },
  {
    name: "Cards with Yearly Savings Badges",
    tags: ["3 plans", "Toggle"],
    html: `<section class="bg-gradient-to-b from-cyan-50 to-white px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-5xl text-center">
    <h2 class="text-4xl font-semibold tracking-tight">Seabright scheduling plans</h2>
    <div class="mt-8 flex items-center justify-center gap-3 text-sm font-medium"><span>Monthly</span>${sw("aria-checked:bg-cyan-600", "focus-visible:ring-cyan-600")}<span>Yearly</span></div>
    <div class="mt-12 grid gap-6 text-left md:grid-cols-3">
      <div class="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200"><div class="flex items-center justify-between"><h3 class="font-semibold">Personal</h3><span class="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-800 empty:hidden" data-m="" data-y="Save $24"></span></div><p class="mt-4 text-4xl font-semibold"><span data-m="$10" data-y="$8">$10</span><span class="text-sm font-normal text-slate-500">/mo</span></p><p class="mt-3 text-sm text-slate-600">One calendar, unlimited booking links.</p><a href="#" class="mt-6 block rounded-lg bg-slate-100 py-2.5 text-center text-sm font-semibold hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600">Choose Personal</a></div>
      <div class="rounded-2xl bg-white p-7 shadow-md ring-2 ring-cyan-600"><div class="flex items-center justify-between"><h3 class="font-semibold">Team</h3><span class="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-800 empty:hidden" data-m="" data-y="Save $72"></span></div><p class="mt-4 text-4xl font-semibold"><span data-m="$24" data-y="$18">$24</span><span class="text-sm font-normal text-slate-500">/mo</span></p><p class="mt-3 text-sm text-slate-600">Round robin, shared pages, 5 calendars.</p><a href="#" class="mt-6 block rounded-lg bg-cyan-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2">Choose Team</a></div>
      <div class="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200"><div class="flex items-center justify-between"><h3 class="font-semibold">Clinic</h3><span class="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-800 empty:hidden" data-m="" data-y="Save $180"></span></div><p class="mt-4 text-4xl font-semibold"><span data-m="$60" data-y="$45">$60</span><span class="text-sm font-normal text-slate-500">/mo</span></p><p class="mt-3 text-sm text-slate-600">Intake forms, deposits, 20 calendars.</p><a href="#" class="mt-6 block rounded-lg bg-slate-100 py-2.5 text-center text-sm font-semibold hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600">Choose Clinic</a></div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Centered Pricing Hero with Quote",
    tags: ["Single plan", "Toggle"],
    html: `<section class="bg-white px-4 py-24 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-2xl text-center">
    <h2 class="text-5xl font-semibold tracking-tight">Everything in Inkwell, one price</h2>
    <div class="mt-8 flex justify-center">${seg("inline-flex rounded-full bg-slate-100 p-1", "min-h-[40px] rounded-full px-5 text-sm font-semibold text-slate-600 transition aria-pressed:bg-white aria-pressed:text-slate-900 aria-pressed:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 motion-reduce:transition-none")}</div>
    <p class="mt-10 text-7xl font-semibold tracking-tighter" data-m="$12" data-y="$120">$12</p>
    <p class="mt-2 text-slate-600" data-m="per writer, per month" data-y="per writer, per year">per writer, per month</p>
    <a href="#" class="mt-8 inline-flex min-h-[48px] items-center rounded-full bg-red-700 px-8 font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">Start writing</a>
    <figure class="mx-auto mt-16 max-w-lg border-t border-slate-200 pt-8"><blockquote class="text-lg text-slate-700">"We dropped three separate tools for drafts, edits and publishing. The whole newsroom lives in one place now."</blockquote><figcaption class="mt-4 text-sm text-slate-600">Mara Okafor, editor at a made-up weekly</figcaption></figure>
  </div>
</section>`,
  },
  {
    name: "Service Packages Bento",
    tags: ["3 plans", "Enterprise"],
    html: `<section class="bg-stone-900 px-4 py-20 text-stone-100 sm:px-6">
  <div class="mx-auto max-w-6xl">
    <h2 class="max-w-xl text-4xl font-semibold tracking-tight">Website packages from Tallgrass Studio</h2>
    <div class="mt-12 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
      <div class="flex flex-col rounded-3xl bg-lime-200 p-8 text-stone-900 lg:row-span-2"><p class="text-sm font-semibold">Most chosen</p><h3 class="mt-2 text-3xl font-semibold">Launch</h3><p class="mt-3 text-stone-700">A five page site written, designed and live in three weeks, with booking or contact forms.</p><p class="mt-auto pt-10 text-5xl font-semibold tracking-tight">$4,800</p><p class="text-sm text-stone-700">fixed price, paid in two parts</p><a href="#" class="mt-6 block rounded-full bg-stone-900 py-3 text-center text-sm font-semibold text-white hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 focus-visible:ring-offset-lime-200">Book a call</a></div>
      <div class="rounded-3xl bg-stone-800 p-8 lg:col-span-2"><div class="flex flex-wrap items-baseline justify-between gap-2"><h3 class="text-2xl font-semibold">Care plan</h3><p class="text-2xl font-semibold">$290<span class="text-sm font-normal text-stone-400"> /month</span></p></div><p class="mt-3 max-w-xl text-stone-300">Hosting, updates, two hours of changes each month and a short report on what visitors did.</p></div>
      <div class="rounded-3xl bg-stone-800 p-8"><h3 class="text-xl font-semibold">Landing page</h3><p class="mt-2 text-sm text-stone-300">One page for a launch or campaign.</p><p class="mt-6 text-2xl font-semibold">$1,600</p></div>
      <div class="rounded-3xl border border-stone-700 p-8"><h3 class="text-xl font-semibold">Larger builds</h3><p class="mt-2 text-sm text-stone-300">Shops, member areas and multi-language sites are quoted after a short call.</p><a href="#" class="mt-6 inline-block text-sm font-semibold text-lime-300 underline underline-offset-4 hover:text-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300">Ask for a quote</a></div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Launch Discount with Struck Prices",
    tags: ["3 plans"],
    html: `<section class="bg-white px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-5xl">
    <div class="mx-auto max-w-xl text-center"><p class="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Launch offer: 30% off your first year</p><h2 class="mt-4 text-4xl font-semibold tracking-tight">Fieldnote plans</h2></div>
    <div class="mt-12 grid gap-6 md:grid-cols-3">
      <div class="rounded-2xl border border-slate-200 p-7"><h3 class="font-semibold">Solo</h3><p class="mt-4 flex items-baseline gap-2"><span class="text-4xl font-semibold">$7</span><s class="text-lg text-slate-500"><span class="sr-only">was </span>$10</s></p><p class="mt-1 text-sm text-slate-600">per month for 12 months</p><a href="#" class="mt-6 block rounded-lg bg-green-700 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2">Claim offer</a></div>
      <div class="rounded-2xl border border-slate-200 p-7"><h3 class="font-semibold">Crew</h3><p class="mt-4 flex items-baseline gap-2"><span class="text-4xl font-semibold">$21</span><s class="text-lg text-slate-500"><span class="sr-only">was </span>$30</s></p><p class="mt-1 text-sm text-slate-600">per month for 12 months</p><a href="#" class="mt-6 block rounded-lg bg-green-700 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2">Claim offer</a></div>
      <div class="rounded-2xl border border-slate-200 p-7"><h3 class="font-semibold">Field office</h3><p class="mt-4 flex items-baseline gap-2"><span class="text-4xl font-semibold">$56</span><s class="text-lg text-slate-500"><span class="sr-only">was </span>$80</s></p><p class="mt-1 text-sm text-slate-600">per month for 12 months</p><a href="#" class="mt-6 block rounded-lg bg-green-700 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2">Claim offer</a></div>
    </div>
    <p class="mt-6 text-center text-sm text-slate-600">After 12 months the regular price applies. We email you a week before.</p>
  </div>
</section>`,
  },
  {
    name: "Cards Overlapping a Colour Band",
    tags: ["3 plans"],
    html: `<section class="bg-white text-slate-900">
  <div class="bg-violet-700 px-4 pb-40 pt-20 text-center text-white sm:px-6"><h2 class="text-4xl font-semibold tracking-tight">Pricing for Bramblecast podcasts</h2><p class="mx-auto mt-3 max-w-md text-violet-100">Host, publish and grow your show from one dashboard.</p></div>
  <div class="mx-auto -mt-28 grid max-w-5xl gap-6 px-4 pb-20 sm:px-6 md:grid-cols-3">
    <div class="rounded-2xl bg-white p-7 shadow-lg ring-1 ring-slate-200"><h3 class="font-semibold">Hobby</h3><p class="mt-4 text-4xl font-semibold">$9</p><p class="text-sm text-slate-600">per month</p><ul class="mt-6 space-y-2.5 text-sm text-slate-700">${li("3 hours of uploads", "text-violet-600")}${li("Basic stats", "text-violet-600")}</ul></div>
    <div class="rounded-2xl bg-white p-7 shadow-lg ring-2 ring-violet-600"><h3 class="font-semibold text-violet-700">Creator</h3><p class="mt-4 text-4xl font-semibold">$19</p><p class="text-sm text-slate-600">per month</p><ul class="mt-6 space-y-2.5 text-sm text-slate-700">${li("12 hours of uploads", "text-violet-600")}${li("Listener locations", "text-violet-600")}${li("Show website", "text-violet-600")}</ul><a href="#" class="mt-7 block rounded-lg bg-violet-700 py-2.5 text-center text-sm font-semibold text-white hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2">Start creating</a></div>
    <div class="rounded-2xl bg-white p-7 shadow-lg ring-1 ring-slate-200"><h3 class="font-semibold">Network</h3><p class="mt-4 text-4xl font-semibold">$59</p><p class="text-sm text-slate-600">per month</p><ul class="mt-6 space-y-2.5 text-sm text-slate-700">${li("Unlimited uploads", "text-violet-600")}${li("10 shows", "text-violet-600")}${li("Sponsor reports", "text-violet-600")}</ul></div>
  </div>
</section>`,
  },
  {
    name: "Included and Missing Feature Checklist",
    tags: ["3 plans"],
    html: `<section class="bg-slate-50 px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-5xl">
    <h2 class="text-center text-4xl font-semibold tracking-tight">Choose a Hearthstone plan</h2>
    <p class="mx-auto mt-3 max-w-lg text-center text-slate-600">Who each plan is for, and exactly what it leaves out.</p>
    <div class="mt-12 grid gap-6 md:grid-cols-3">
      <div class="rounded-2xl bg-white p-7 ring-1 ring-slate-200"><h3 class="font-semibold">Renter</h3><p class="mt-1 text-sm text-slate-600">For one flat or room.</p><p class="mt-5 text-3xl font-semibold">$3<span class="text-sm font-normal text-slate-500">/mo</span></p><ul class="mt-6 space-y-2.5 text-sm text-slate-700">${li("Bills split with housemates", "text-blue-600")}${li("Chore rota", "text-blue-600")}${no("Repairs log", "text-slate-500")}${no("Tenant payments", "text-slate-500")}</ul></div>
      <div class="rounded-2xl bg-white p-7 ring-1 ring-slate-200"><h3 class="font-semibold">Owner</h3><p class="mt-1 text-sm text-slate-600">For your own home.</p><p class="mt-5 text-3xl font-semibold">$6<span class="text-sm font-normal text-slate-500">/mo</span></p><ul class="mt-6 space-y-2.5 text-sm text-slate-700">${li("Bills split with housemates", "text-blue-600")}${li("Chore rota", "text-blue-600")}${li("Repairs log", "text-blue-600")}${no("Tenant payments", "text-slate-500")}</ul></div>
      <div class="rounded-2xl bg-white p-7 ring-1 ring-slate-200"><h3 class="font-semibold">Landlord</h3><p class="mt-1 text-sm text-slate-600">For up to 10 properties.</p><p class="mt-5 text-3xl font-semibold">$18<span class="text-sm font-normal text-slate-500">/mo</span></p><ul class="mt-6 space-y-2.5 text-sm text-slate-700">${li("Bills split with housemates", "text-blue-600")}${li("Chore rota", "text-blue-600")}${li("Repairs log", "text-blue-600")}${li("Tenant payments", "text-blue-600")}</ul></div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Dark Free or Pro Toggle Card",
    tags: ["2 plans", "Dark", "Toggle"],
    html: `<section class="bg-[#111015] px-4 py-20 text-white sm:px-6">
  <div class="mx-auto max-w-3xl">
    <div class="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><h2 class="text-3xl font-semibold tracking-tight">Lumenpost for creators</h2>${seg("inline-flex rounded-full bg-white/10 p-1", "min-h-[40px] rounded-full px-4 text-sm font-medium text-white/70 transition aria-pressed:bg-white aria-pressed:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 motion-reduce:transition-none")}</div>
    <div class="mt-10 grid gap-4 sm:grid-cols-2">
      <div class="rounded-2xl bg-white/5 p-7 ring-1 ring-white/10"><h3 class="text-white/80">Free</h3><p class="mt-3 text-4xl font-semibold">$0</p><p class="mt-3 text-sm text-white/60">Schedule 10 posts a month to 2 accounts.</p><a href="#" class="mt-6 inline-block rounded-full px-1 text-sm font-semibold text-pink-300 hover:text-pink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400">Sign up free</a></div>
      <div class="rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 p-[1px]"><div class="h-full rounded-2xl bg-[#1a1820] p-7"><h3 class="text-pink-300">Pro</h3><p class="mt-3 text-4xl font-semibold"><span data-m="$15" data-y="$150">$15</span><span class="text-base font-normal text-white/50" data-m=" /month" data-y=" /year"> /month</span></p><p class="mt-3 text-sm text-white/70">Unlimited posts, 10 accounts, best time suggestions.</p><a href="#" class="mt-6 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1820]">Go Pro</a></div></div>
    </div>
  </div>
</section>`,
  },
  {
    name: "Plans with Collapsible Full Comparison",
    tags: ["3 plans", "Comparison"],
    html: `<section class="bg-white px-4 py-20 text-slate-900 sm:px-6">
  <div class="mx-auto max-w-5xl">
    <h2 class="text-center text-4xl font-semibold tracking-tight">Pebblestone survey plans</h2>
    <div class="mt-12 grid gap-4 md:grid-cols-3">
      <div class="rounded-xl border border-slate-200 p-6"><h3 class="font-semibold">Basic</h3><p class="mt-3 text-3xl font-semibold">$0</p><p class="mt-2 text-sm text-slate-600">100 responses a month</p></div>
      <div class="rounded-xl border-2 border-emerald-600 p-6"><h3 class="font-semibold">Standard</h3><p class="mt-3 text-3xl font-semibold">$25<span class="text-sm font-normal text-slate-500">/mo</span></p><p class="mt-2 text-sm text-slate-600">5,000 responses a month</p></div>
      <div class="rounded-xl border border-slate-200 p-6"><h3 class="font-semibold">Research</h3><p class="mt-3 text-3xl font-semibold">$90<span class="text-sm font-normal text-slate-500">/mo</span></p><p class="mt-2 text-sm text-slate-600">Unlimited responses</p></div>
    </div>
    <details class="group mt-8 rounded-xl border border-slate-200"><summary class="flex min-h-[48px] cursor-pointer list-none items-center justify-center gap-2 rounded-xl text-sm font-semibold text-emerald-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">Compare all features<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" class="h-4 w-4 transition group-open:rotate-180 motion-reduce:transition-none"><path d="M5 8l5 5 5-5" /></svg></summary>
      <div class="overflow-x-auto border-t border-slate-200"><table class="w-full min-w-[560px] text-sm"><caption class="sr-only">All Pebblestone features by plan</caption><thead class="text-left text-slate-600"><tr><th scope="col" class="p-4 font-medium">Feature</th><th scope="col" class="p-4 font-medium">Basic</th><th scope="col" class="p-4 font-medium">Standard</th><th scope="col" class="p-4 font-medium">Research</th></tr></thead><tbody class="divide-y divide-slate-100"><tr><th scope="row" class="p-4 text-left font-normal">Question types</th><td class="p-4">8</td><td class="p-4">All 24</td><td class="p-4">All 24</td></tr><tr><th scope="row" class="p-4 text-left font-normal">Logic and branching</th><td class="p-4">${dash("text-slate-400")}</td><td class="p-4">${yes("!mx-0 text-emerald-600")}</td><td class="p-4">${yes("!mx-0 text-emerald-600")}</td></tr><tr><th scope="row" class="p-4 text-left font-normal">Export to spreadsheet</th><td class="p-4">${dash("text-slate-400")}</td><td class="p-4">${yes("!mx-0 text-emerald-600")}</td><td class="p-4">${yes("!mx-0 text-emerald-600")}</td></tr><tr><th scope="row" class="p-4 text-left font-normal">Panel recruitment</th><td class="p-4">${dash("text-slate-400")}</td><td class="p-4">${dash("text-slate-400")}</td><td class="p-4">${yes("!mx-0 text-emerald-600")}</td></tr></tbody></table></div>
    </details>
  </div>
</section>`,
  },
  {
    name: "Compact Pricing Strip for Footers",
    tags: ["Minimal", "Horizontal", "3 plans"],
    html: `<section class="border-y border-slate-200 bg-white px-4 py-10 text-slate-900 sm:px-6">
  <div class="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-center">
    <h2 class="text-xl font-semibold tracking-tight lg:w-56">Gridmarker pricing</h2>
    <ul class="grid flex-1 gap-3 sm:grid-cols-3">
      <li class="rounded-lg bg-slate-50 px-5 py-4"><p class="text-sm text-slate-600">Personal</p><p class="text-xl font-semibold">Free</p></li>
      <li class="rounded-lg bg-slate-50 px-5 py-4"><p class="text-sm text-slate-600">Team</p><p class="text-xl font-semibold">$8 <span class="text-sm font-normal text-slate-500">per editor</span></p></li>
      <li class="rounded-lg bg-slate-50 px-5 py-4"><p class="text-sm text-slate-600">Organisation</p><p class="text-xl font-semibold">$16 <span class="text-sm font-normal text-slate-500">per editor</span></p></li>
    </ul>
    <a href="#" class="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2">See full pricing</a>
  </div>
</section>`,
  },
  {
    name: "Stacked Mobile Pricing Accordion",
    tags: ["Mobile first", "3 plans", "FAQ"],
    html: `<section class="bg-amber-50 px-4 py-16 text-stone-900 sm:px-6">
  <div class="mx-auto max-w-lg">
    <h2 class="text-3xl font-semibold tracking-tight">Greenhaven garden club</h2>
    <p class="mt-2 text-stone-600">Tap a plan to see what is in it.</p>
    <div class="mt-8 space-y-3">
      <details class="group rounded-2xl bg-white ring-1 ring-amber-200"><summary class="flex min-h-[64px] cursor-pointer list-none items-center gap-4 rounded-2xl px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"><span class="flex-1 font-semibold">Seedling</span><span class="font-semibold">$4/mo</span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" class="h-4 w-4 text-stone-500 transition group-open:rotate-180 motion-reduce:transition-none"><path d="M5 8l5 5 5-5" /></svg></summary><div class="px-5 pb-5 text-sm text-stone-700"><ul class="space-y-2">${li("Monthly planting calendar", "text-amber-700")}${li("Member forum", "text-amber-700")}</ul></div></details>
      <details class="group rounded-2xl bg-white ring-2 ring-amber-600" open><summary class="flex min-h-[64px] cursor-pointer list-none items-center gap-4 rounded-2xl px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"><span class="flex-1 font-semibold">Grower <span class="ml-1 rounded-full bg-amber-600 px-2 py-0.5 text-xs text-white">Popular</span></span><span class="font-semibold">$9/mo</span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" class="h-4 w-4 text-stone-500 transition group-open:rotate-180 motion-reduce:transition-none"><path d="M5 8l5 5 5-5" /></svg></summary><div class="px-5 pb-5 text-sm text-stone-700"><ul class="space-y-2">${li("Everything in Seedling", "text-amber-700")}${li("A seed packet posted each season", "text-amber-700")}${li("Live Q and A with growers", "text-amber-700")}</ul><a href="#" class="mt-5 block rounded-xl bg-amber-700 py-3 text-center font-semibold text-white hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2">Join as a Grower</a></div></details>
      <details class="group rounded-2xl bg-white ring-1 ring-amber-200"><summary class="flex min-h-[64px] cursor-pointer list-none items-center gap-4 rounded-2xl px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"><span class="flex-1 font-semibold">Allotment</span><span class="font-semibold">$19/mo</span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" class="h-4 w-4 text-stone-500 transition group-open:rotate-180 motion-reduce:transition-none"><path d="M5 8l5 5 5-5" /></svg></summary><div class="px-5 pb-5 text-sm text-stone-700"><ul class="space-y-2">${li("Everything in Grower", "text-amber-700")}${li("Soil test kit twice a year", "text-amber-700")}${li("One garden visit a year", "text-amber-700")}</ul></div></details>
    </div>
  </div>
</section>`,
  },
];

/* ---------- tiny parser for the markup above (well formed, double quoted attributes) ---------- */
const VOID = new Set(["input", "br", "img", "hr", "path", "circle", "rect", "line", "polyline"]);

function parse(src: string): El {
  const root: El = { t: "#", a: {}, c: [] };
  const stack: El[] = [root];
  const re = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[\w:-]+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const top = stack[stack.length - 1];
    if (m[5] !== undefined) {
      const txt = m[5].replace(/\s+/g, " ");
      if (txt.trim()) top.c.push(txt);
      continue;
    }
    if (m[1]) {
      stack.pop();
      continue;
    }
    const a: Record<string, string> = {};
    const ar = /([\w:-]+)(?:="([^"]*)")?/g;
    let x: RegExpExecArray | null;
    while ((x = ar.exec(m[3]))) a[x[1]] = x[2] ?? "";
    const el: El = { t: m[2], a, c: [] };
    top.c.push(el);
    if (!m[4] && !VOID.has(m[2])) stack.push(el);
  }
  return root.c.find((n): n is El => typeof n !== "string") ?? root;
}

/* ---------- pricing maths shared by preview, JSX and HTML ---------- */
type Usage = Record<string, number>;
const term = (v: number, base: number, incl: number, rate: number) => base + Math.max(0, v - incl) * rate;
function calc(spec: string, u: Usage) {
  return spec.split("+").reduce((sum, t) => {
    const [k, r] = t.split(":");
    const [b, i, rate] = r.split(",").map(Number);
    return sum + term(u[k] ?? 0, b, i, rate);
  }, 0);
}
const money = (n: number, d: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function initialUsage(n: Nd, u: Usage = {}): Usage {
  if (typeof n === "string") return u;
  if (n.a["data-usage"]) u[n.a["data-usage"]] = n.a.type === "checkbox" ? ("checked" in n.a ? 1 : 0) : Number(n.a.value);
  n.c.forEach((c) => initialUsage(c, u));
  return u;
}
const hasAttr = (n: Nd, a: string): boolean => typeof n !== "string" && (a in n.a || n.c.some((c) => hasAttr(c, a)));

type Parsed = { v: Variant; tree: El; usage: Usage; bill: boolean; slide: boolean };
const PARSED: Parsed[] = VARIANTS.map((v) => {
  const tree = parse(v.html);
  return { v, tree, usage: initialUsage(tree), bill: hasAttr(tree, "data-m"), slide: hasAttr(tree, "data-usage") };
});

/* ---------- React renderer for the preview ---------- */
const RENAME: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  colspan: "colSpan",
  rowspan: "rowSpan",
  autocomplete: "autoComplete",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
  checked: "defaultChecked",
};
const DROP = new Set(["data-m", "data-y", "data-bill-toggle", "data-bill", "data-usage", "data-calc", "data-dec", "data-units"]);

type Ctx = { y: boolean; setY: (y: boolean) => void; u: Usage; setU: (u: Usage) => void; uid: string };

function textFor(n: El, ctx: { y: boolean; u: Usage }): string | null {
  if ("data-m" in n.a) return ctx.y ? n.a["data-y"] : n.a["data-m"];
  if (n.a["data-calc"]) return money(calc(n.a["data-calc"], ctx.u), Number(n.a["data-dec"] ?? 0));
  if (n.a["data-units"]) return (ctx.u[n.a["data-units"]] ?? 0).toLocaleString("en-US");
  return null;
}

function render(n: Nd, ctx: Ctx, key: string): ReactNode {
  if (typeof n === "string") return n;
  const p: Record<string, unknown> = { key };
  for (const [k, val] of Object.entries(n.a)) {
    if (DROP.has(k)) continue;
    let name = RENAME[k] ?? k;
    if (n.t === "input" && k === "value") name = "defaultValue";
    if ((k === "id" || k === "for" || k === "name") && val) {
      p[name] = `${ctx.uid}-${val}`;
      continue;
    }
    p[name] = val === "" && !k.startsWith("data-") && k !== "data-m" ? true : val;
  }
  if ("data-bill-toggle" in n.a) {
    p["aria-checked"] = ctx.y;
    p.onClick = () => ctx.setY(!ctx.y);
  }
  if (n.a["data-bill"]) {
    const want = n.a["data-bill"] === "y";
    p["aria-pressed"] = ctx.y === want;
    p.onClick = () => ctx.setY(want);
  }
  const uk = n.a["data-usage"];
  if (uk) {
    delete p.defaultValue;
    delete p.defaultChecked;
    if (n.a.type === "checkbox") {
      p.checked = ctx.u[uk] === 1;
      p.onChange = (e: { target: HTMLInputElement }) => ctx.setU({ ...ctx.u, [uk]: e.target.checked ? 1 : 0 });
    } else {
      p.value = ctx.u[uk];
      p.onChange = (e: { target: HTMLInputElement }) => ctx.setU({ ...ctx.u, [uk]: Number(e.target.value) });
    }
  }
  if (n.t === "form") p.onSubmit = (e: { preventDefault: () => void }) => e.preventDefault();
  if (n.t === "a") p.onClick = (e: { preventDefault: () => void }) => e.preventDefault();
  const txt = textFor(n, ctx);
  const kids = txt !== null ? [txt] : n.c.map((c, i) => render(c, ctx, `${key}.${i}`));
  return createElement(n.t, p, ...(VOID.has(n.t) ? [] : kids));
}

/* ---------- printers: plain HTML and React JSX ---------- */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inlineOnly = (n: El) => n.c.some((c) => typeof c === "string");

function toHtml(n: Nd, ctx: { y: boolean; u: Usage }, d = 0, top = false): string {
  if (typeof n === "string") return esc(n);
  const pad = "  ".repeat(d);
  const attrs = Object.entries(n.a)
    .map(([k, v]) => (v === "" ? ` ${k}` : ` ${k}="${v.replace(/"/g, "&quot;")}"`))
    .join("");
  const open = `<${n.t}${top ? " data-pricing" : ""}${attrs}${VOID.has(n.t) ? " /" : ""}>`;
  if (VOID.has(n.t)) return pad + open;
  const txt = textFor(n, ctx);
  if (txt !== null) return `${pad}${open}${esc(txt)}</${n.t}>`;
  if (inlineOnly(n) || n.c.length === 0) return `${pad}${open}${n.c.map((c) => toHtml(c, ctx, 0).trimStart()).join("")}</${n.t}>`;
  return `${pad}${open}\n${n.c.map((c) => toHtml(c, ctx, d + 1)).join("\n")}\n${pad}</${n.t}>`;
}

const HTML_SCRIPT = `<script>
  // Billing switch and usage calculator. Works for every [data-pricing] block on the page.
  document.querySelectorAll("[data-pricing]").forEach(function (root) {
    function money(n, d) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); }
    function bill(yearly) {
      root.querySelectorAll("[data-m]").forEach(function (el) { el.textContent = yearly ? el.dataset.y : el.dataset.m; });
      root.querySelectorAll("[data-bill-toggle]").forEach(function (b) { b.setAttribute("aria-checked", yearly); });
      root.querySelectorAll("[data-bill]").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.bill === "y") === yearly); });
    }
    function usage() {
      var u = {};
      root.querySelectorAll("[data-usage]").forEach(function (i) { u[i.dataset.usage] = i.type === "checkbox" ? (i.checked ? 1 : 0) : Number(i.value); });
      root.querySelectorAll("[data-units]").forEach(function (el) { el.textContent = u[el.dataset.units].toLocaleString("en-US"); });
      root.querySelectorAll("[data-calc]").forEach(function (el) {
        var total = el.dataset.calc.split("+").reduce(function (sum, t) {
          var p = t.split(":"), r = p[1].split(",").map(Number);
          return sum + r[0] + Math.max(0, u[p[0]] - r[1]) * r[2];
        }, 0);
        el.textContent = money(total, Number(el.dataset.dec || 0));
      });
    }
    root.querySelectorAll("[data-bill-toggle]").forEach(function (b) {
      b.addEventListener("click", function () { bill(b.getAttribute("aria-checked") !== "true"); });
    });
    root.querySelectorAll("[data-bill]").forEach(function (b) {
      b.addEventListener("click", function () { bill(b.dataset.bill === "y"); });
    });
    root.querySelectorAll("[data-usage]").forEach(function (i) { i.addEventListener("input", usage); });
  });
</script>`;

function htmlSnippet(p: Parsed): string {
  const head = `<!-- ${p.v.name}. Example prices and invented brand: replace them with your own.\n     Needs Tailwind CSS v3.4 or newer. -->\n`;
  const body = toHtml(p.tree, { y: false, u: p.usage }, 0, true);
  return head + body + (p.bill || p.slide ? `\n\n${HTML_SCRIPT}\n` : "\n");
}

const jstr = (s: string) => JSON.stringify(s);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function calcExpr(spec: string, dec: number): string {
  const parts = spec.split("+").map((t) => {
    const [k, r] = t.split(":");
    const [b, i, rate] = r.split(",");
    return `term(usage.${k}, ${b}, ${i}, ${rate})`;
  });
  return `{money(${parts.join(" + ")}, ${dec})}`;
}

function toJsx(n: Nd, sv: string, d: number): string {
  const pad = "  ".repeat(d);
  if (typeof n === "string") {
    const t = n.replace(/[{}<>]/g, (c) => `{${jstr(c)}}`);
    return pad + t.trim();
  }
  const props: string[] = [];
  for (const [k, val] of Object.entries(n.a)) {
    if (DROP.has(k) || k === "data-pricing") continue;
    if ("data-bill-toggle" in n.a && k === "aria-checked") continue;
    if (n.a["data-bill"] && k === "aria-pressed") continue;
    if (n.a["data-usage"] && (k === "value" || k === "checked")) continue;
    let name = RENAME[k] ?? k;
    if (n.t === "input" && k === "value") name = "defaultValue";
    props.push(val === "" ? name : `${name}=${jstr(val)}`);
  }
  if ("data-bill-toggle" in n.a) props.push(`aria-checked={${sv}}`, `onClick={() => set${cap(sv)}(!${sv})}`);
  if (n.a["data-bill"]) {
    const y = n.a["data-bill"] === "y";
    props.push(`aria-pressed={${y ? "" : "!"}${sv}}`, `onClick={() => set${cap(sv)}(${y})}`);
  }
  const uk = n.a["data-usage"];
  if (uk) {
    if (n.a.type === "checkbox")
      props.push(`checked={usage.${uk} === 1}`, `onChange={(e) => setUsage({ ...usage, ${uk}: e.target.checked ? 1 : 0 })}`);
    else props.push(`value={usage.${uk}}`, `onChange={(e) => setUsage({ ...usage, ${uk}: Number(e.target.value) })}`);
  }
  const open = `<${n.t}${props.length ? " " + props.join(" ") : ""}`;
  if (VOID.has(n.t)) return `${pad}${open} />`;
  let inner: string | null = null;
  if ("data-m" in n.a) inner = `{${sv} ? ${jstr(n.a["data-y"])} : ${jstr(n.a["data-m"])}}`;
  else if (n.a["data-calc"]) inner = calcExpr(n.a["data-calc"], Number(n.a["data-dec"] ?? 0));
  else if (n.a["data-units"]) inner = `{usage.${n.a["data-units"]}.toLocaleString("en-US")}`;
  if (inner !== null) return `${pad}${open}>${inner}</${n.t}>`;
  if (n.c.length === 0) return `${pad}${open}></${n.t}>`;
  if (inlineOnly(n)) {
    const parts = n.c.map((c, i) => {
      if (typeof c !== "string") return toJsx(c, sv, 0);
      let t = c.replace(/[{}<>]/g, (ch) => `{${jstr(ch)}}`);
      if (i > 0 && t.startsWith(" ")) t = `{" "}${t.trimStart()}`;
      if (i < n.c.length - 1 && t.endsWith(" ")) t = `${t.trimEnd()}{" "}`;
      return t;
    });
    return `${pad}${open}>${parts.join("")}</${n.t}>`;
  }
  return `${pad}${open}>\n${n.c.map((c) => toJsx(c, sv, d + 1)).join("\n")}\n${pad}</${n.t}>`;
}

const pascal = (s: string) => s.replace(/[^a-zA-Z0-9 ]/g, "").split(" ").map(cap).join("");

function jsxSnippet(p: Parsed): string {
  const sv = p.v.sv ?? "yearly";
  const hooks: string[] = [];
  if (p.bill) hooks.push(`  const [${sv}, set${cap(sv)}] = useState(false);`);
  if (p.slide) hooks.push(`  const [usage, setUsage] = useState(${JSON.stringify(p.usage).replace(/"(\w+)":/g, "$1: ").replace(/,/g, ", ")});`);
  const imp = hooks.length ? `import { useState } from "react";\n\n` : "";
  const helpers = p.slide
    ? `// Price = base + (amount over what is included) x rate.\nconst term = (value, base, included, rate) => base + Math.max(0, value - included) * rate;\nconst money = (n, decimals) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });\n\n`
    : "";
  return `${imp}// ${p.v.name}. Example prices and invented brand: replace them with your own.\n// Tailwind CSS v3.4 or newer.\n${helpers}export default function ${pascal(p.v.name)}() {\n${hooks.join("\n")}${hooks.length ? "\n" : ""}  return (\n${toJsx(p.tree, sv, 2)}\n  );\n}\n`;
}

/* ---------- scaled preview tile ---------- */
const DESIGN_W = 1200;

function Preview({ p, full, uid }: { p: Parsed; full: boolean; uid: string }) {
  const [y, setY] = useState(false);
  const [u, setU] = useState<Usage>(p.usage);
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ s: number; w: number; h: number } | null>(null);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      const avail = o.clientWidth;
      const wide = window.innerWidth >= 1024 && !full;
      const w = wide ? DESIGN_W : avail;
      const s = avail / w;
      setBox({ s, w, h: Math.ceil(i.offsetHeight * s) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(i);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [full]);

  const ctx: Ctx = { y, setY, u, setU, uid };
  return (
    <div ref={outer} className="relative overflow-hidden" style={box ? { height: box.h } : undefined}>
      <div
        ref={inner}
        style={box ? { width: box.w, transform: `scale(${box.s})`, transformOrigin: "0 0" } : undefined}
        className={box ? "absolute left-0 top-0" : ""}
      >
        {render(p.tree, ctx, uid)}
      </div>
    </div>
  );
}

/* ---------- page ---------- */
const TAGS: Tag[] = ["Toggle", "2 plans", "3 plans", "4 plans", "Comparison", "Usage slider", "Single plan", "Enterprise", "FAQ", "Dark", "Minimal", "Horizontal", "Mobile first"];
const ICON_COPY = "M9 9h11v11H9zM5 15H4V4h11v1";
const ICON_CODE = "M8 7l-5 5 5 5M16 7l5 5-5 5";
const ICON_EXPAND = "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5";
const ICON_SHRINK = "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5";

function Svg({ d, cls = "h-4 w-4" }: { d: string; cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cls}>
      <path d={d} />
    </svg>
  );
}

export default function TailwindPricingTablesCollection() {
  const [tag, setTag] = useState<Tag | "All">("All");
  const [query, setQuery] = useState("");
  const [full, setFull] = useState<number | null>(null);
  const [code, setCode] = useState<{ i: number; lang: "jsx" | "html" } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      PARSED.map((p, i) => ({ p, i })).filter(
        ({ p }) => (tag === "All" || p.v.tags.includes(tag)) && (!q || `${p.v.name} ${p.v.tags.join(" ")}`.toLowerCase().includes(q)),
      ),
    [tag, q],
  );

  async function copy(i: number, lang: "jsx" | "html") {
    const p = PARSED[i];
    const text = lang === "jsx" ? jsxSnippet(p) : htmlSnippet(p);
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) setCode({ i, lang });
    setCopied(ok ? `${i}${lang}` : null);
    setAnnounce(ok ? `${p.v.name} ${lang === "jsx" ? "React JSX" : "HTML"} copied` : "Copy was blocked, the code is shown so you can select it");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  }

  const chip =
    "inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f4f1] motion-reduce:transition-none";
  const tool =
    "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 motion-reduce:transition-none";

  return (
    <section className="bg-[#f4f4f1] px-4 py-12 text-[#17181c] sm:px-8 sm:py-16" style={{ fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">React + Tailwind · plain HTML</p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">{PARSED.length} Tailwind pricing tables you can copy</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone-600">
              Toggles that switch, sliders that recalculate, comparison tables and FAQ sections. Every brand and price is an example: swap in your own.
            </p>
          </div>
          <dl className="flex gap-8 font-mono text-[12px] text-stone-600">
            <div>
              <dt className="uppercase tracking-[0.14em]">Sections</dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#17181c]">{PARSED.length}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.14em]">Working toggles</dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#17181c]">{PARSED.filter((p) => p.bill).length}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.14em]">Calculators</dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#17181c]">{PARSED.filter((p) => p.slide).length}</dd>
            </div>
          </dl>
        </header>

        <div className="mt-8 flex flex-col gap-3 border-y border-stone-300/70 py-4 lg:flex-row lg:items-center">
          <label htmlFor="tpt-search" className="sr-only">
            Search pricing sections
          </label>
          <input
            id="tpt-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: dark, slider, table"
            className="h-10 w-full rounded-full border border-stone-300 bg-white px-4 text-[14px] text-stone-900 placeholder:text-stone-500 focus:border-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 lg:w-60 lg:shrink-0"
          />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
            {(["All", ...TAGS] as const).map((t) => {
              const on = tag === t;
              const n = t === "All" ? PARSED.length : PARSED.filter((p) => p.v.tags.includes(t)).length;
              return (
                <button key={t} type="button" aria-pressed={on} onClick={() => setTag(t)} className={`${chip} ${on ? "bg-[#17181c] text-white" : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"}`}>
                  {t}
                  <span className={`font-mono text-[11px] ${on ? "text-stone-300" : "text-stone-500"}`}>{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>

        <div className="mt-6 h-[1160px] overflow-y-auto overscroll-contain rounded-2xl pr-1" tabIndex={0} aria-label="Pricing sections">
          {visible.length === 0 && (
            <div className="grid h-60 place-items-center rounded-2xl border border-dashed border-stone-300 text-[14px] text-stone-600">Nothing matches "{query}". Try toggle, dark or table.</div>
          )}
          <ul className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            {visible.map(({ p, i }) => {
              const isFull = full === i;
              const open = code?.i === i ? code.lang : null;
              return (
                <li key={i} className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(23,24,28,0.04)] ${isFull || open ? "lg:col-span-2" : ""}`}>
                  <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 px-4 py-3">
                    <span className="font-mono text-[11px] text-stone-500">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="min-w-0 flex-1 truncate text-[14px] font-semibold">{p.v.name}</h3>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">Example prices</span>
                  </div>
                  <Preview p={p} full={isFull} uid={`tpt${i}`} />
                  <div className="flex flex-wrap items-center gap-2 border-t border-stone-200 px-3 py-2.5">
                    <span className="hidden min-w-0 flex-1 truncate text-[12px] text-stone-600 sm:block">{p.v.tags.join(" · ")}</span>
                    <button type="button" aria-pressed={isFull} onClick={() => setFull(isFull ? null : i)} className={`${tool} hidden text-stone-700 hover:bg-stone-100 lg:inline-flex`}>
                      <Svg d={isFull ? ICON_SHRINK : ICON_EXPAND} cls="h-3.5 w-3.5" />
                      {isFull ? "Fit" : "Full size"}
                    </button>
                    <button
                      type="button"
                      aria-expanded={!!open}
                      aria-controls={`tpt-code-${i}`}
                      onClick={() => setCode(open ? null : { i, lang: "jsx" })}
                      className={`${tool} text-stone-700 hover:bg-stone-100`}
                    >
                      <Svg d={ICON_CODE} cls="h-3.5 w-3.5" />
                      {open ? "Hide code" : "Code"}
                    </button>
                    <button type="button" onClick={() => copy(i, "jsx")} aria-label={`Copy React JSX for ${p.v.name}`} className={`${tool} ${copied === `${i}jsx` ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-900 hover:bg-stone-200"}`}>
                      <Svg d={copied === `${i}jsx` ? "M5 12.5l4.5 4.5L19 7" : ICON_COPY} cls="h-3.5 w-3.5" />
                      {copied === `${i}jsx` ? "Copied" : "JSX"}
                    </button>
                    <button type="button" onClick={() => copy(i, "html")} aria-label={`Copy HTML for ${p.v.name}`} className={`${tool} ${copied === `${i}html` ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-900 hover:bg-stone-200"}`}>
                      <Svg d={copied === `${i}html` ? "M5 12.5l4.5 4.5L19 7" : ICON_COPY} cls="h-3.5 w-3.5" />
                      {copied === `${i}html` ? "Copied" : "HTML"}
                    </button>
                  </div>
                  {open && (
                    <div id={`tpt-code-${i}`} className="border-t border-stone-800 bg-[#111318]">
                      <div className="flex gap-1 px-3 pt-3" role="group" aria-label="Code language">
                        {(["jsx", "html"] as const).map((l) => (
                          <button
                            key={l}
                            type="button"
                            aria-pressed={open === l}
                            onClick={() => setCode({ i, lang: l })}
                            className={`min-h-[32px] rounded-md px-3 font-mono text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${open === l ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
                          >
                            {l === "jsx" ? "React JSX" : "HTML"}
                          </button>
                        ))}
                      </div>
                      <pre tabIndex={0} className="max-h-96 overflow-auto p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200">
                        <code>{open === "jsx" ? jsxSnippet(p) : htmlSnippet(p)}</code>
                      </pre>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
