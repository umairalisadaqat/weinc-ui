const meta = {
  slug: "arched-brass-ticket-window-prompt-box-with-a-sliding-tray-that-carries-a-typed-slip-under-the-glass-and-returns-a-ticket",
  category: "originals",
  name: "Arched Brass Ticket Window Prompt Box with a Sliding Tray That Carries a Typed Slip Under the Glass and Returns a Ticket",
  keyword: "tailwind prompt box with animation",
  title: "React Prompt Box as a Brass Ticket Window | We.Inc",
  description: "Prompt box staged as a brass ticket window: write on the slip, slide the tray under the glass and a ticket comes back. Free React code and HTML to copy.",
  intro: "An arched booking-office window set in a pale wall, with a dark stone counter running out towards the viewer and a brass tray resting on it. A paper request slip lies in the tray, and that slip is the input: one sentence saying what you want built. Press Enter, or the pill on the tray's front lip, and the tray slides away from you, under the brass rail and behind the pane, where it is seen through tinted, slightly blurred glass while a blue reading light crosses it. It springs back carrying a ticket in place of the slip, with a blue end that sketches the result and a stub that names it: a website, a web app, a phone game or an agent. The idle loop serves four sample slips, one of each kind. The scene is a fixed drawing scaled to its container, so the window, rail and tray stay in proportion on a phone.",
  useWhen: [
    "A homepage opener for a builder that makes more than one kind of thing, where the answer to a sentence might be a site, an app, a game or an agent.",
    "A light, warm landing page that needs a single prompt field and would look wrong with a glowing dark input.",
    "An events, cinema or travel product that wants its search or request box to look like the counter customers already know.",
    "A playful enquiry form for a studio: the slip takes the request and the ticket confirms it was received.",
  ],
  customize: [
    "Sample requests are the `slips` array: each has a `sentence` and the `ticket` it returns, with `kind`, `name` and `line`.",
    "`ticketFrom` decides the kind for a visitor's own sentence by looking for words such as game, app or agent. Replace its body with your own routing, or call your backend there and return the same three fields.",
    "The four drawings on the blue end of the ticket are in `Sketch`, one small SVG group per kind. Add a kind to the `Kind` type and a matching group to offer a fifth.",
    "Brass comes from the `BRASS` and `BRASS_SIDE` gradients. Swapping their five stops for greys from `#f1f4f8` to `#444951` turns the window nickel.",
    "How far the tray travels is `y: -216` and `scale: 0.7` on the tray. A smaller scale makes the booth read as deeper.",
  ],
  accessibility: [
    "The slip contains a labelled `textarea`; Enter sends it and line breaks are removed so the sentence stays on three lines.",
    "The pill on the tray is a `button` that is renamed Write another once a ticket is out, and it returns focus to a fresh slip when pressed.",
    "The issued ticket is announced once in a status line with its kind and name, so the result does not depend on seeing the animation.",
    "Reduced motion shows the window with a ticket already on the tray, stops the lamp swaying and swaps slip for ticket without the slide.",
  ],
  faqs: [
    {
      question: "How is the glass effect made?",
      answer: "The pane is an empty element drawn above the tray with a faint blue tint, an inner edge highlight and two slanted white bands that shift a few pixels against the pointer through one CSS variable. While the tray is behind it, the tray takes a half pixel blur and a blue wash of its own, which is steadier across browsers than `backdrop-filter` inside a scaled scene.",
    },
    {
      question: "Why does the tray look like it moves away instead of just up?",
      answer: "It shrinks to 70 percent as it rises, the counter is drawn as a trapezoid that narrows towards the wall, and a dark blue wash fades in over the tray once it is inside. Those three cues together read as depth without any 3D transforms.",
    },
    {
      question: "Can I use this as a real form?",
      answer: "Yes. Read `text` inside `submit` and send it wherever you need. The field already limits length with `MAX` and ignores an empty slip by putting focus back in it.",
    },
    {
      question: "What stops the demo from typing over a visitor?",
      answer: "The first focus or keystroke sets a flag and clears all scheduled timers, then empties the slip. The sample loop stays off for the rest of the visit.",
    },
    {
      question: "How are the notches in the ticket cut?",
      answer: "Two radial gradients are used as a CSS mask and intersected, which removes a half circle from the top and bottom edge where the blue end meets the stub. The dashed line between them is a plain border.",
    },
  ],
  related: ["machined-aluminium-prompt-block-with-a-slot-that-swallows-a-typed-card-and-hands-back-a-printed-homepage", "brass-letterbox-file-upload-with-a-sprung-flap-that-swallows-envelopes-and-rattles-shut", "ticket-roll-dispenser-pricing-with-three-paper-rolls-and-a-plan-ticket-that-tears-off-and-lands-on-a-ledge"],
  tags: ["prompt box", "input", "brass", "glass", "ticket", "tray", "originals"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
