const meta = {
  slug: "currency-total-counter-ticking-dollars-and-cents",
  category: "text-effects",
  name: "Currency Total Counter With Cents",
  keyword: "animated number counter javascript",
  title: "",
  description: "",
  intro:
    "A paper statement slip for a small soap maker on a sea glass tint. Three line amounts and their sum tick up together in monospace figures, cents spinning quickest and settling last, while the big total lifts its cents into a smaller raised pair. Fits revenue recaps, donation totals and fundraising pages.",
  useWhen: [
    "The figure is money and the cents matter, so a rounded count-up would look like it skipped the detail.",
  ],
  customize: [
    "Edit the `lines` array; the total is summed from it, so the slip always adds up.",
    "Switch the currency by changing `CURRENCY` (or `data-currency` in the plain version); Intl.NumberFormat moves the symbol and separators for you.",
    "Change the tint with `bg-[#dcebe4]` and the raised cents colour with `text-[#2f6b5b]`, or `--cur-bg` and `--cur-accent`.",
  ],
  accessibility: [
    "Every amount, the total included, is written out in full in a hidden span, and the ticking figures sit in an aria-hidden layer that reserves its final width.",
  ],
  faqs: [],
  related: [],
  tags: ["currency counter", "money count up", "animated total", "intl numberformat"],
  height: 504,
  collection: "number-counter-animation",
  tech: "css",
  reducedMotion: "The slip shows every amount and the total already settled to the cent.",
  perf: "Four short text rewrites per frame for under two seconds, driven by one requestAnimationFrame loop.",
};

export default meta;
