const meta = {
  slug: "crt-monitor-preview-frame-that-warms-up-with-scanlines-a-degauss-wobble-and-a-collapsing-power-off",
  category: "app-ui",
  name: "CRT Monitor Preview Frame That Warms Up with Scanlines, a Degauss Wobble and a Collapsing Power Off",
  keyword: "crt monitor effect react",
  title: "React CRT Monitor Effect Frame for Previews | We.Inc",
  description: "Device frame shaped like a tube monitor: your page sits behind scan lines while the set warms up, degausses and powers down. Free React and HTML code.",
  intro: "A device frame for showing a page, a game screen or a screenshot inside a fourteen inch tube monitor. The beige case, the sloping well round the glass, the badge and the thumbwheels are painted once on a canvas. The picture itself is ordinary HTML, here a small ceramics shop homepage over a photograph, so anything you can build can go on the tube. Over it sit scan lines, a faint colour mask, a slow rolling band, dark corners and a window reflected in the glass. The power button collapses the picture to a white line, then a dot that fades. Switching on does the reverse and the image comes up dim, soft and grey before the colour arrives. The degauss key shakes the picture and smears rainbow blotches across it for a second and a half. The monitor is 340 pixels wide on phones and larger from tablet width.",
  useWhen: [
    "A portfolio or case study shows an old project, a pixel art game or a terminal tool and a flat browser mock-up would undersell it.",
    "A retro game menu or launcher needs a screen within the screen for trailers and level previews.",
    "A landing page for a nostalgia product wants its hero image to switch on in front of the visitor.",
    "A theme or template picker wants a playful way to preview one option at a time.",
  ],
  customize: [
    "Replace everything inside the element marked `picture` with your own markup. It is a 232 by 176 pixel box, and it is scaled up with the rest of the set at `sm`.",
    "`CASE` is the plastic as three numbers. `[58, 58, 62]` gives a black studio monitor, and `[226, 226, 222]` a later cool white one.",
    "`GLOW` should be the main colour of your picture. It tints the light that spills on the case and the desk.",
    "Scan line strength is the `0.3` in the first repeating gradient. Drop it to `0.15` when the preview holds small text.",
    "The demo order and its pauses live in the `script` array. Empty it to leave the set on until someone touches a button.",
  ],
  accessibility: [
    "The tube is exposed as a single image with a label that changes between the preview description and switched off, and the tiny text inside it is hidden from screen readers.",
    "Power is a real button with `aria-pressed`. Each button has a 40 pixel hit area even though the plastic key drawn inside it is half that size.",
    "The words under the monitor are a polite live region that reports power on or standby.",
    "With reduced motion the picture appears and disappears at once, the rolling band is removed and the degauss key does nothing visible.",
  ],
  faqs: [
    {
      question: "Can I put live, clickable content on the screen?",
      answer: "Yes, with two changes. Remove `aria-hidden` from the picture element and `role=\"img\"` from the glass so the content is reachable. Then add `pointer-events-none` to the overlay layers above it. Keep in mind that links inside a 232 pixel wide preview are small targets on a phone.",
    },
    {
      question: "How is the degauss effect made without a shader?",
      answer: "Nothing is drawn per pixel. Each frame sets one transform and one filter on the picture: a few sine waves of different speeds move, rotate and zoom it, and a hue rotation swings back and forth. A blurred conic gradient in screen blend mode spins over the top for the colour blotches. All of it is multiplied by a value that decays over about a second and a half.",
    },
    {
      question: "Why does the image look grey when it first comes on?",
      answer: "A tube takes a moment to reach working temperature, and the picture is weak until it does. The warm-up here runs the brightness from 70 percent to full and the saturation from 20 percent to full over two seconds, with a small blur that clears at the same pace.",
    },
    {
      question: "Do the scan lines hurt text legibility?",
      answer: "At the default strength body text below about 12 pixels gets hard to read, which is true to the hardware. For a preview that people need to read, lower the scan line alpha and remove the colour mask layer, which is the element with `mix-blend-multiply`.",
    },
    {
      question: "Why is the case a canvas and the screen HTML?",
      answer: "The case needs grain and soft moulded edges that are tedious in CSS, and it never changes, so it is painted once. The screen has to hold your content and animate smoothly, which the browser does best with real elements moved on the compositor.",
    },
  ],
  related: ["ebony-and-ivory-domino-spiral-that-topples-tile-by-tile-with-real-contact-physics-and-stands-back-up", "gumball-machine-with-a-crank-you-turn-that-drops-a-glossy-ball-down-the-chute", "mechanical-stopwatch-with-a-crown-you-press-a-ticking-sweep-hand-and-a-flyback-reset"],
  tags: ["crt", "monitor", "device frame", "preview", "scanlines", "retro", "degauss", "skeuomorphic"],
  height: 780,
  interactive: true,
};

export default meta;
