export default {
  slug: "weather-forecast-card-with-animated-condition-icons",
  category: "motion-graphics",
  name: "Weather Forecast Card With Animated Icons",
  keyword: "animated weather icons",
  tags: ["animated weather icons", "weather card", "svg icons", "forecast", "css animation"],
  height: 560,
  collection: "animated-icons",
  tech: "css",
  support: "All current browsers",
  reducedMotion: "Each condition icon is drawn complete and stays still: sun, cloud, rain lines, snow, wind and bolt all in place.",
  perf: "Six small SVG loops on transform, opacity and dash offset, paused by a tiny observer whenever the card leaves the screen or the tab hides.",
  intro: "A deep navy forecast card for a harbour town with six condition icons that idle quietly: sun rays turn very slowly, a cloud drifts a pixel either way, rain lines and snow dots fall and fade, wind gusts travel along their curls and the storm bolt flickers by opacity. Each day names its condition in text beside the icon.",
  customize: [
    "Recolour the sun and the rain through `--m3wth-sunc` and `--m3wth-rainc`; the cloud fill follows `--m3wth-card` so it hides whatever sits behind it.",
    "Raise `--m3wth-speed` to 1.5 or 2 for calmer loops across the whole card.",
    "Copy any single `<svg>` with its classes to use one icon on its own, such as the rain icon in a site header.",
  ],
  accessibility: [
    "The icons are hidden from screen readers because every day already states its condition and temperatures as text, so nothing depends on reading the picture.",
  ],
  useWhen: [
    "A booking, travel or outdoor events page shows a short forecast and the icons should feel alive without a weather icon font.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
