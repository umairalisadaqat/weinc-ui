const meta = {
  slug: "chrome-stomp-footswitch-toggle-with-jewel-lamp-on-a-powder-coated-pedal",
  category: "toggles",
  name: "Chrome Stomp Footswitch Toggle with Jewel Lamp on a Powder-Coated Pedal",
  keyword: "react toggle switch skeuomorphic",
  title: "React Toggle Switch as a Chrome Footswitch | We.Inc",
  description: "On and off toggle drawn as a guitar pedal: press the chrome footswitch and an amber jewel lamp lights above it. Copy the React code or HTML version free.",
  intro: "An on and off switch in the shape of a guitar effects pedal. A red powder-coated box, seen from above, carries two parts: a chrome footswitch held by a hex nut and washer, and a faceted amber jewel lamp in a chrome bezel. Press the footswitch and its domed cap sinks most of the way into the threaded bush, then pops back with one small bounce. The lamp comes on quickly and dies away more slowly, like a filament. When lit it throws an amber pool across the paint and shows up as a warm smear in the chrome cap. The dome is painted as a convex mirror, with the room in the middle, a dark horizon ring and the red of the box around the rim, and its window reflection slides as the pointer moves. The pedal is 320 pixels wide on phones.",
  useWhen: [
    "A music app, amp simulator or plug-in page needs a bypass switch that guitarists recognise at a glance.",
    "One setting on a page is the main event, such as going live or arming a recording, and a small pill switch feels too slight for it.",
    "A landing page for audio gear wants a single object to press in the hero.",
    "You want a toggle whose lit state can be seen from across the room on a wall display or kiosk.",
  ],
  customize: [
    "`effect` holds the name announced to screen readers, the two status words under the pedal and the two lines printed on the box.",
    "`BOX` is the powder coat as red, green and blue numbers. The side wall, the rolled edge and the reflection in the chrome all follow it. `[38, 92, 168]` gives a blue pedal, `[232, 196, 64]` a yellow one.",
    "`LAMP` is the lit jewel. `[90, 230, 120]` makes it green. The unlit glass is the three `mix(...)` lines in `draw`, where the first number of each pair is the dark colour.",
    "Switch travel is `15` in `top = 14 + 15 * (1 - press)`. A larger number makes a taller cap that sinks further.",
    "The return bounce comes from stiffness `620` and damping `17`. Set the damping to 40 for a cap that rises without overshoot.",
  ],
  accessibility: [
    "The control is a real `button` with `role=\"switch\"` and `aria-checked`, sitting over the footswitch. Space and Enter toggle it and the cap dips to show the press.",
    "A white focus ring with a red offset is drawn around the washer, so keyboard focus stays visible against the paint.",
    "The lamp is never the only signal. The status line below the pedal says Engaged or Bypassed and is a polite live region.",
    "With reduced motion the cap does not travel, the lamp changes at once and the pedal does not press itself.",
  ],
  faqs: [
    {
      question: "How is the chrome drawn without an image or WebGL?",
      answer: "Chrome has no colour of its own, so it is painted as what it would reflect. The flat nut and washer use a conic gradient of light and dark wedges. The dome uses a radial gradient that runs from white, through a near black ring for the horizon, to the red of the box at the rim, plus two small white ellipses for a window.",
    },
    {
      question: "Why does the lamp fade out slower than it comes on?",
      answer: "Pilot lamps on old amplifiers and pedals are small filament bulbs behind a cut glass jewel, and a filament keeps glowing for a moment while it cools. The lamp value chases its target at one rate going up and a slower rate going down, which is enough to suggest that.",
    },
    {
      question: "Does the switch change state on press or on release?",
      answer: "On release, with the normal `click` event, so that touch, mouse, keyboard and switch access devices all behave the same and a press can be cancelled by sliding off. The cap follows the pointer down at once, so it still feels immediate.",
    },
    {
      question: "Can I start with the lamp off?",
      answer: "Yes. Change `useState(true)` and `useRef(true)` at the top of the component to `false`, and the starting `lamp: 1` in the state object to `0`.",
    },
    {
      question: "How do I stop it pressing itself?",
      answer: "The idle demo begins five seconds after the last interaction. Delete the line that tests `t > nextDemo` in the frame loop and the switch only moves when someone uses it. The slow drift of the reflections is separate and can stay.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "guarded-toggle-switch-row-with-red-flip-up-safety-covers-you-lift-before-each-switch-will-arm", "hotel-keycard-door-lock-switch-with-a-card-that-dips-into-the-reader-a-lamp-that-turns-green-and-a-lever-that-drops"],
  tags: ["toggle", "switch", "footswitch", "chrome", "pedal", "lamp", "canvas", "skeuomorphic"],
  height: 740,
  interactive: true,
};

export default meta;
