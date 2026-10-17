const meta = {
  slug: "soft-spotlight-gradient-following-pointer-background",
  category: "backgrounds",
  name: "Soft Spotlight That Follows the Pointer",
  keyword: "animated gradient background",
  title: "",
  description: "",
  intro: "A warm lamp pool lights a dark canvas backdrop, trailing the pointer with a soft lag and casting a faint pool on the floor beneath it. Leave the mouse alone for a couple of seconds and the lamp wanders on its own in a loose figure of eight, so the hero never sits dead. Tabbing to the button swings the light onto it. Suited to photographers, galleries, theatres and quiet product launches.",
  useWhen: [
    "You want one interactive touch in a hero that still looks complete for visitors who never move the mouse.",
    "A dark, low-key page needs warmth and depth rather than colour.",
  ],
  customize: [
    "Set `--spl-light` to a cool `200, 220, 255` for a daylight lamp, or lower its alpha steps for a dimmer room.",
    "Change `--spl-size` from `900px` to `600px` for a tighter, more theatrical pool of light.",
    "Raise `EASE` to `0.15` so the lamp snaps closer to the pointer, or raise `IDLE_AFTER` to wait longer before drifting.",
  ],
  accessibility: [
    "Nothing is revealed only under the light: the copy is fully readable at every lamp position.",
    "Keyboard focus moves the lamp to the focused element, and with reduced motion the lamp stays parked beside the headline.",
  ],
  faqs: [],
  related: [],
  tags: ["spotlight", "pointer", "interactive", "dark", "studio"],
  height: 600,
  section: true,
  interactive: true,
  collection: "animated-gradient-background",
  tech: "css",
  reducedMotion: "The lamp rests to the right of the headline as a fixed warm pool and ignores the pointer.",
  perf: "A tiny script eases two transformed layers each frame; painting stays on the compositor and the loop stops off screen.",
};

export default meta;
