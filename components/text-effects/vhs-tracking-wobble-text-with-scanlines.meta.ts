const meta = {
  slug: "vhs-tracking-wobble-text-with-scanlines",
  category: "text-effects",
  name: "VHS Tracking Wobble Text",
  keyword: "vhs glitch text css",
  title: "",
  description: "",
  intro: "An italic serif headline on a warm tape-brown screen that sways a fraction of a pixel, while a soft tracking band rolls down the frame and drags a torn, colour-fringed strip of the words sideways as it passes. Scanlines and a blinking PLAY marker finish the rental-shop look. It suits retro shops, film nights and anything nostalgic.",
  useWhen: [
    "A video store, film club or vintage shop wants a hero line that feels like a worn cassette rather than a digital error.",
    "You prefer a slow, rolling disturbance over sharp bursts, so the headline stays readable while it moves.",
  ],
  customize: [
    "Slow the roll by raising `--w10vhs-speed`; the band and the torn strip share it, so they stay in step.",
    "Change the fringe colours with `--w10vhs-warm` and `--w10vhs-cool`, and the lettering with `--w10vhs-ink`.",
    "Make the tear gentler by halving the `translateX` values inside `@keyframes w10vhs-tear`.",
  ],
  accessibility: [
    "The headline is read once from a hidden span, while the wobbling base and the torn copy are hidden from assistive tech. Reduced motion freezes the band mid-screen with one still offset strip, and the blinking marker stops.",
  ],
  faqs: [],
  related: [],
  tags: ["vhs text effect", "glitch text css", "retro headline", "scanlines", "tracking distortion"],
  height: 560,
  section: true,
  collection: "glitch-text-effect",
  tech: "css",
  reducedMotion: "A still frame: the tracking band rests mid-screen and one strip of the headline sits offset with colour fringes.",
  perf: "Three small CSS loops on transform and clip-path over one headline, so paint work stays light and only an off-screen pause runs in JavaScript.",
};

export default meta;
