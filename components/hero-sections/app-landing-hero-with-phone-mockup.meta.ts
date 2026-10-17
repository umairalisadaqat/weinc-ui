const meta = {
  slug: "app-landing-hero-with-phone-mockup",
  category: "hero-sections",
  name: "App Landing Hero with Phone Mockup",
  keyword: "tailwind app landing page hero",
  title: "Tailwind App Landing Hero with Phone Mockup | We.Inc",
  description: "App landing hero with a tilted phone mockup cycling bird photos, a live sound meter and download buttons. Copy the React and Tailwind code or HTML free.",
  intro: "A dark hero for a mobile app, demonstrated with a birdsong identifier. On the left are the app mark, a two-line headline, a paragraph, two download buttons and a row of three recordings to try. On the right a phone drawn in markup leans back in 3D over a misty forest photograph. Its screen shows a full-height bird photograph, a frosted listening meter with moving bars, and an answer card that springs up with the species, its Latin name and a match score. The phone moves on to the next bird every few seconds, sound rings spread out behind it and two glass notes float beside it. On phones the text comes first, the buttons go full width and the handset sits below.",
  useWhen: [
    "You are launching an app whose screen is mostly photography, such as nature, travel, food or fitness.",
    "You want the mockup to demonstrate what the app does in a loop instead of showing one frozen screenshot.",
    "The page needs equal download links for two phone platforms without using either store's badge artwork.",
    "A dark, atmospheric first screen suits the product better than a pastel one.",
  ],
  customize: [
    "The screens come from the `birds` array: name, Latin name, a line of detail, match score, photo address, alt text and a `focus` value that sets `object-position` so the subject stays in frame.",
    "`HOLD_MS = 2900` is how long each screen stays up. The loop stops for good once a visitor presses one of the recording chips.",
    "Resting tilt is the `-13` and `6` inside the `rotateY` and `rotateX` transforms, and the numbers they are multiplied by set how far the phone follows the pointer.",
    "The accent is `#ff9a52` with `#ffb37a` for small text, on a `#071a20` base. The backdrop is `FOREST`; keep the two gradient overlays above it so the headline stays readable.",
    "Handset size is `h-[600px] w-[292px]` with a `rounded-[52px]` shell and a `rounded-[42px]` screen. Scale all four together.",
  ],
  accessibility: [
    "The recording chips are buttons with `aria-pressed`, so the demo can be driven from the keyboard and the current choice is announced.",
    "Each bird photograph in the handset has alt text naming the species. The small copies in the chips have empty alt because the chip label already says it.",
    "Under reduced motion the phone rests at its tilt, the meter bars and rings hold still, the screens stop rotating automatically and chips switch them with a plain fade.",
    "Both download links keep full phrases such as Get Hark for Android in their text, and the glass one has a light border so it does not rely on blur alone to be seen.",
  ],
  faqs: [
    { question: "How is the phone tilted in 3D with Tailwind?", answer: "The column has `[perspective:1600px]` and the handset is a Framer Motion element with `rotateY` and `rotateX`. Pointer position across the section is mapped to a few degrees either way and smoothed by a spring, so the phone turns slightly toward the cursor and settles back when it leaves." },
    { question: "How do the photographs change inside the screen?", answer: "The image is keyed by its address inside `AnimatePresence`. When the index changes, the outgoing photo fades while the new one fades in from a slightly larger scale. The answer card is keyed by species name and uses `mode=\"popLayout\"`, so the old card lifts away as the new one springs up." },
    { question: "What draws the sound meter?", answer: "Twenty-six thin spans, each with a fixed height taken from a sine formula, run the same scale keyframe with a different negative delay and duration. That is enough to look like a live level meter and costs no script after the first render." },
    { question: "Can I put my own screenshots in the handset?", answer: "Yes. Point each entry's `photo` at a tall screenshot and delete the meter and answer card overlays if the screenshot already contains its own interface. Portrait images around 900 pixels wide are plenty for this size." },
    { question: "Why not use the official store badges?", answer: "You can, and each store publishes artwork and spacing rules for them. The neutral pair here is useful before approval, for a waiting list, or when you want two buttons that match each other." },
    { question: "Does the loop keep running off screen?", answer: "No. An intersection observer pauses the interval and every keyframe animation when the hero leaves the viewport and resumes them when it returns." },
  ],
  related: ["bakery-hero-whose-headline-is-the-shadow-of-window-lettering-thrown-on-a-wall-by-a-moving-sun", "big-headline-hero-with-stats-row", "mountain-lodge-photo-hero-with-drifting-cloud-headline-and-glass-booking-cards"],
  tags: ["hero", "mobile app", "phone mockup", "download buttons", "3d tilt", "photo", "dark"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
