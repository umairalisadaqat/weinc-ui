const meta = {
  slug: "mechanical-watch-movement-loader-with-swinging-balance-wheel-and-breathing-hairspring",
  category: "loaders",
  name: "Mechanical Watch Movement Loader with Swinging Balance Wheel and Breathing Hairspring",
  keyword: "react canvas loader",
  title: "React Canvas Loader: Watch Movement | We.Inc",
  description: "Loader drawn on a canvas as a watch movement, with a swinging balance wheel, a breathing hairspring and a ticking escape wheel. Free React and HTML code.",
  intro: "A loader in the shape of the back of a mechanical watch, drawn on one canvas. A gold balance wheel swings back and forth while its blue hairspring tightens and loosens, and on every pass through centre the pallet fork snaps across and the escape wheel jumps one step with a small recoil. Two gold wheels creep round behind it, and every few seconds the large steel ratchet wheel turns four teeth as the movement winds itself, which makes the balance swing wider for a while. Brushed metal is painted with conic gradients that turn toward the pointer, so the highlights slide across every part as the light moves. The piece is a square that scales with the screen, 430 pixels at most, with a status line underneath.",
  useWhen: [
    "A first load or a long export takes several seconds and you would like people to have something worth watching.",
    "The product is about time, precision or craft: a booking tool, a jeweller, a repair shop, a scheduling app.",
    "You need a splash screen for a premium brand where a spinning ring would feel cheap.",
    "A not-found or maintenance page wants a centrepiece that keeps moving without asking for attention.",
  ],
  customize: [
    "Tempo is `BEATS_PER_SECOND`. 2.5 is calm; a real watch runs at 6 or 8, which looks frantic at this size.",
    "`REST_SWING` and `FULL_SWING` are the balance wheel's travel in radians before and after a wind, and `AUTO_WIND_EVERY` is the gap between automatic winds in seconds.",
    "Metals are the `GOLD`, `STEEL` and `ROSE` arrays of five stops, lightest first. Swap `GOLD` for a copy of `ROSE` to get a red gold movement.",
    "Each wheel's position and radius is a constant near the top (`BARREL`, `THIRD`, `FOURTH`, `ESCAPE`, `BALANCE`) on a 400 by 400 drawing, and the finger bridges are the `bridges` array.",
    "Size is the `w-[min(84vw,430px)]` class on the button, and the two lines of text are `LABEL` and `HINT`.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology and the text under it sits in a `role=\"status\"` region, so a screen reader hears the label once and is not flooded with ticks.",
    "The movement is a real `button` named Wind the movement. Enter, Space, a click or a tap all wind it, and it shows a focus ring.",
    "With reduced motion the canvas draws one still frame of the movement and never starts its animation loop.",
    "The loop also stops whenever the loader scrolls out of view or the tab goes to the background.",
  ],
  faqs: [
    { question: "How is the brushed metal drawn without images?", answer: "Each part is filled with `createConicGradient` centred on its own axis, alternating light and dark stops. That is how circular brushing catches light on a real wheel. The start angle follows the light, not the wheel, so highlights stay put while the teeth turn through them." },
    { question: "What makes the hairspring look as if it breathes?", answer: "The spiral is redrawn every frame as a line of 220 points. Its outer end is fixed and its inner end turns with the balance wheel, so the total angle wound into the coil changes with the swing and the turns bunch up and spread out, as a real spring does." },
    { question: "Is the gearing accurate?", answer: "It is plausible, not a working calibre. The order of parts is right (barrel, third wheel, fourth wheel, escape wheel, fork, balance) and the escape wheel does advance half a tooth per tick, but the tooth counts and ratios were chosen to look good at small size." },
    { question: "How heavy is it to run?", answer: "The plate and the bridges are painted once into two off-screen canvases and copied each frame. Only the wheels, the fork and the spring are redrawn. Pixel ratio is capped at 2 and the plate is repainted only when the light has moved noticeably." },
    { question: "Can it show real progress?", answer: "It is built as an indeterminate loader. To tie it to progress, drive `swing` from your percentage so the balance swings wider as the job nears its end, and put the number in the status text." },
  ],
  related: ["nitro-cold-brew-tumbler-loader-that-pours-cascades-and-settles-under-a-cream-head", "oil-and-water-liquid-timer-with-beads-that-rise-through-a-glass-hourglass-and-flip-to-restart", "steel-ball-bearing-loader-that-drops-a-ball-into-the-race-for-every-tenth-loaded"],
  tags: ["loader", "canvas", "watch", "gears", "spinner"],
  height: 628,
  interactive: true,
};

export default meta;
