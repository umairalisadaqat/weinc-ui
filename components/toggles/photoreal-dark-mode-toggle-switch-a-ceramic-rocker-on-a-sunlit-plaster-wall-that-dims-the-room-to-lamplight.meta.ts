const meta = {
  slug: "photoreal-dark-mode-toggle-switch-a-ceramic-rocker-on-a-sunlit-plaster-wall-that-dims-the-room-to-lamplight",
  category: "toggles",
  name: "Photoreal Dark Mode Toggle Switch: a Ceramic Rocker on a Sunlit Plaster Wall that Dims the Room to Lamplight",
  keyword: "dark mode toggle switch",
  title: "Photoreal Dark Mode Toggle Switch in React | We.Inc",
  description: "Free React dark mode toggle switch drawn as a real wall rocker. Flip it and the room fades to lamplight while the settings card turns dark.",
  intro: "An ivory ceramic rocker sits in a walnut plate on a terracotta plaster wall, with afternoon sun from a mullioned window laying bar shadows across it. Flip the rocker and the sun fades out over about a second and a half, a table lamp below warms up and throws its cone up the wall, and the settings card beside it changes to its dark theme at the same pace. The rocker is a real HTML switch laid exactly over the drawn one, so mouse, touch, Tab, Space and Enter all work. On first load it follows the device setting; once someone picks a side the choice is saved in the browser, and a link puts it back on the device setting.",
  useWhen: [
    "A product page or app settings screen wants a dark mode toggle switch that people stop to play with.",
    "You need a theme switch that follows prefers-color-scheme until the visitor chooses, then remembers the choice.",
    "An interiors, lighting or home brand wants its theme control to feel like the room it sells.",
    "You want a working example of a real role=switch control laid over a WebGL scene.",
  ],
  customize: [
    "Set `STORAGE_KEY` to the key your app already uses so a saved preference carries over.",
    "Set `APPLY_TO_HTML` to true to put the `dark` class on the html element and theme your whole site with Tailwind's `dark:` classes.",
    "`FADE_SECONDS` sets how long the room takes to go from sun to lamplight. The wall colour is the vec3 passed to `matPlaster` in `shade`.",
    "Move the window light with `KEY_DIR`, `WIN_HALF` and `WIN_OFF`, and the lamp with `LAMP_POS` and `LAMP_COL`. `ROCK` is how far the rocker tilts.",
    "The card colours live in the `card` object, one set for light and one for dark: swap them for your own design tokens.",
  ],
  accessibility: [
    "Both the rocker and the small switch in the card are buttons with role switch, aria-checked and the label Dark mode, so screen readers hear on or off.",
    "The line under Dark mode is a polite live region that says the state and whether it follows the device or the visitor's choice.",
    "The rocker shows a cream focus ring when reached by keyboard. With reduced motion the room and rocker change instantly, and without WebGL 2 a CSS still with the same working switch is shown.",
  ],
  faqs: [
    { question: "How does it follow the system setting?", answer: "It reads the prefers-color-scheme media query and listens for changes. Until someone flips the switch, the theme tracks the device live; after that their saved choice wins until they press Use device setting." },
    { question: "What happens if localStorage is blocked?", answer: "Reads and writes sit inside try and catch. In a private window the switch still works for the visit and just forgets afterwards." },
    { question: "Does the 3D scene keep using the GPU?", answer: "No. While the room fades it draws every frame; once still, it averages frames into a clean picture and stops drawing. It also pauses off screen and when the tab is hidden." },
    { question: "Can I use only the logic without the picture?", answer: "Yes. The useTheme hook at the top is plain React and returns the theme, whether it follows the device, and a choose function. Wire it to any button." },
  ],
  related: [
    "dark-mode-toggle-switch-in-react-and-tailwind-with-system-setting-and-four-styles",
    "porcelain-wall-light-switch-settings-list-with-three-bakelite-dollies-that-snap-over-and-throw-lamp-light-up-a-sunlit-wall",
    "brass-dolly-light-switch-toggle-on-a-fluted-rose-that-snaps-over-and-lights-a-filament-wall-lamp",
  ],
  tags: ["toggles", "dark mode", "theme", "switch", "webgl", "photoreal"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
