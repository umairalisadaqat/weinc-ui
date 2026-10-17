const meta = {
  slug: "reeded-glass-window-with-passing-night-lights-background",
  category: "backgrounds",
  name: "Reeded Glass with Passing Night Lights",
  keyword: "css animated background",
  title: "",
  description: "",
  intro: "Street lights and passing cars are seen through a fluted glass window at night: amber, white and red glows slide sideways at different speeds, broken into tall streaks by the vertical reeds. A navy shade on the left holds the text. It fits bars, restaurants, hotels and evening events that want a city mood without a video.",
  useWhen: ["A restaurant or wine bar wants its site to feel like the room after dark.", "A dark hero needs colour and movement that stays soft and out of focus."],
  customize: ["Change `--rdg-reed` to set the reed width; wider reeds look like old bathroom glass, narrow ones like a modern partition.", "Edit `--rdg-amber` for the main lamp and button colour, or recolour single lights in `.rdg-l1` to `.rdg-l6`.", "Use `--rdg-speed` to set the base pace of traffic; each light runs at its own multiple of it."],
  accessibility: ["Cream text sits on the darkest, shaded side of the window, which keeps contrast high as the lights go by.", "All six lights and the glass overlay are decorative, marked hidden and ignore taps."],
  faqs: [],
  related: [],
  tags: ["fluted glass", "night", "bokeh", "city lights", "pure css"],
  height: 560,
  section: true,
  collection: "animated-background-css",
  tech: "css",
  reducedMotion: "The lights hold their places behind the glass as still streaks of amber, white and red.",
  perf: "Six blurred gradient shapes move by transform under a static mask; no filters are animated.",
};

export default meta;
