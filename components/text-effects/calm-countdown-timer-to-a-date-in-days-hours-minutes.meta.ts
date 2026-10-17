const meta = {
  slug: "calm-countdown-timer-to-a-date-in-days-hours-minutes",
  category: "text-effects",
  name: "Calm Countdown Timer to a Date",
  keyword: "counter animation",
  title: "",
  description: "",
  intro:
    "A countdown for a pottery studio's kiln opening, set in large serif numerals on a soft dawn gradient. On arrival the days, hours and minutes rise from zero to the real time left, then the figures only change once a minute, with a fine copper line creeping under the minutes. No seconds, no flashing, nothing urgent.",
  useWhen: [
    "You are announcing an opening, sale or workshop and want a countdown that informs without pressuring the visitor.",
  ],
  customize: [
    "Point `TARGET` (or `data-target` in the plain version) at your date in local time; once it passes, the same day next year is used.",
    "Rename the occasion with `EVENT`, which also feeds the hidden sentence screen readers hear.",
    "Shift the dawn colours in the `linear-gradient(170deg, ...)` on the section, and the copper accent with `#94512f`.",
  ],
  accessibility: [
    "The ticking figures are aria-hidden; a hidden sentence states the time left in words and a real time element carries the event date.",
  ],
  faqs: [],
  related: [],
  tags: ["countdown timer", "countdown to date", "days hours minutes", "event countdown"],
  height: 600,
  collection: "number-counter-animation",
  tech: "css",
  reducedMotion: "The real time left appears at once, still updating each minute, and the hairline stays empty.",
  perf: "One timeout per minute and a single 60 second transform animation on a one pixel line.",
};

export default meta;
