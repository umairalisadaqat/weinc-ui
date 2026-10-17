const meta = {
  slug: "big-headline-hero-with-stats-row",
  category: "hero-sections",
  name: "Big Headline Hero with Stats Row",
  keyword: "tailwind hero with stats",
  title: "Tailwind Hero with Stats Row and Big Headline | We.Inc",
  description: "Hero with a huge headline over a rooftop photo and a stats row whose numbers roll like meter drums. Copy the React and Tailwind code or HTML free.",
  intro: "A hero for a rooftop solar installer built around one photograph of a tiled roof under a wide evening sky. The headline fills the empty sky in very large type, with its second line in an italic serif the colour of the roof tiles. Below the picture sits the stats row on a near-black band: three figures shown as meter drums that spin up to their value when the page loads, and a fourth that keeps counting, with a red tenths drum and a small disc whose mark slides the wrong way. A soft patch of low sun crosses the photo slowly. On phones the pitch and buttons drop onto the dark band and the three fixed figures share one line above the running one.",
  useWhen: [
    "Your best argument is a handful of numbers and you want them to feel like instruments, not captions.",
    "You have one photograph with a large calm area, such as sky, water or a plain wall, that can hold a headline of four or five words.",
    "The business sells something measured, like energy, water, miles or hours, where a running counter makes sense.",
    "You want a single strong action on the first screen with one quieter link beside it.",
  ],
  customize: [
    "Figures live in the `stats` array as a `value` string with an optional `prefix` and `unit`. Commas in the string stay still and every digit becomes a drum, so `\"12,400\"` works without other changes.",
    "The running counter starts at `LIVE_START`, which is in tenths, and ticks every `1100` milliseconds in the second effect. Delete that effect to freeze it, or change `LIVE_LABEL` to rename it.",
    "Swap `PHOTO` and `PHOTO_ALT`, then move the crop with `object-[78%_100%]`. Keep the busy part of the picture low and to the right so the headline stays on plain sky.",
    "The accent is `#b93a12` on the serif line, the button, the red drum and the disc mark. Drum paper is `#efe7d8` and the band is `#14110e`.",
    "Headline size is the `clamp(3.3rem,10.2vw,9.25rem)` value on the `h1`. Lower the middle number for a longer headline.",
  ],
  accessibility: [
    "The row is a description list. Each drum set is hidden from screen readers and a visually hidden copy of the plain figure sits beside it, so `2,418` is read as a number and not digit by digit.",
    "The running counter is announced once as an approximate figure and is deliberately not a live region, which would interrupt a screen reader every second.",
    "With reduced motion requested the drums show their final digits at once, the counter stops, the sun patch is parked and the photo does not ease in.",
    "Headline ink is near-black on a pale wash laid over the sky. If your photo is darker at the top, strengthen the `from-[#f4ecdd]/75` gradient or switch the heading to a light colour.",
  ],
  faqs: [
    { question: "How do the meter digits roll?", answer: "Each digit is a short window with a vertical strip of the numerals 0 to 9 inside it. The strip is moved up by ten percent of its own height per step with a spring, so a 7 is the strip shifted seventy percent. Two gradients over the window darken its top and bottom, which is what makes a flat strip look like a turning drum." },
    { question: "Why does one drum look red?", answer: "Old mechanical electricity meters print the tenths drum in red so the reader ignores it. Passing `redLast` to the `Meter` component colours the final drum that way. Remove the prop if your figure has no decimal place." },
    { question: "Will the counter keep running in a background tab?", answer: "No. An IntersectionObserver clears the interval while the hero is scrolled out of view, and browsers throttle timers in hidden tabs, so it costs nothing when nobody is looking." },
    { question: "Can I show the numbers without any animation?", answer: "Yes. Pass `still` as `true` to every `Meter`, or replace the `Meter` elements with plain text in the same `dd`. The layout, rules and captions stay as they are." },
    { question: "What kind of photo works behind a headline this large?", answer: "One where at least half the frame is quiet. Here the upper left is empty sky and the roof sits in the lower right, so the type and the subject never fight. A photo that is busy edge to edge needs a much stronger wash and usually looks worse." },
    { question: "How should real figures be sourced?", answer: "Use numbers you can show evidence for, and say what period they cover in the caption. The demo figures belong to an invented installer and are there to show the layout." },
  ],
  related: ["mountain-lodge-photo-hero-with-drifting-cloud-headline-and-glass-booking-cards", "neo-brutalist-hero-with-sticker-headline-and-shifting-hard-shadows", "olive-oil-bottle-hero-turning-on-a-seamless-backdrop-with-the-headline-orbiting-round-the-glass"],
  tags: ["hero", "stats", "large headline", "photo", "odometer", "counter", "solar", "numbers"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
