const meta = {
  slug: "e-paper-display-key-that-flashes-and-redraws-its-own-label-when-pressed",
  category: "animated-buttons",
  name: "E-Paper Display Key That Flashes and Redraws Its Own Label When Pressed",
  keyword: "e-ink button react",
  title: "React E-Ink Button That Redraws Its Label | We.Inc",
  description: "Key cap with a simulated e-ink screen: press it and the panel flashes, redraws its label and fills a progress row. Free React code and HTML to copy.",
  intro: "A chunky putty-coloured key set into an orange casing, with a small e-paper screen under a clear window in its top. The screen is the label. Press the key and the cap drops into its slot, then the panel does what real electronic paper does: the old picture inverts, the whole screen goes black, then white, and the new picture settles in grain by grain. The demo is a publish button. Its first screen reads Publish with a draft tag. One press starts the job, and a row of twelve squares fills using quick updates that skip the flash and leave a faint ghost of what was there before. When the row is full, a second full flash clears the ghosts and shows Live with a tick. Each dot of the screen is simulated with its own response speed, so the transitions look like pigment moving, not a fade. The key is 304 pixels wide on phones and half as large again from tablet width.",
  useWhen: [
    "A button starts a job that takes a few seconds and you want the wait and the result shown on the control itself.",
    "A hardware, maker or smart home brand wants a hero control that looks like a real device part.",
    "A deploy, publish or sync action is the main event of a dashboard and a normal spinner feels throwaway.",
    "You need a status key whose label must stay readable when idle and should only draw attention at the moment it changes.",
  ],
  customize: [
    "`screens` holds the three states. Change each `title`, `note` and `tag`; titles up to about ten characters fit beside the round badge.",
    "`BLOCKS` and `BLOCK_MS` set the progress row. Twelve squares at 125 milliseconds runs for a second and a half. In real use, increase `s.filled` from your own progress events instead of the timer.",
    "`INK` and `PAPER` are the two pigment colours. `[150, 28, 24]` for `INK` gives the red of a three-colour shelf label.",
    "The casing is the root `bg-[#e8683c]` and its radial gradient. The cap is the `#f6f2e9` to `#d9d3c5` gradient, with the side wall just above it in the markup.",
    "The flash timing lives in the chain of `e < 150`, `e < 310`, `e < 470` and `e < 580` checks. Stretch those numbers for a slower, older-looking panel.",
  ],
  accessibility: [
    "The screen canvas and the plastic are decorative. A real `button` covers the key and its hidden text follows the screen: Publish, Publishing, then Live.",
    "`aria-busy` is set while the job runs, and presses during that time move the cap but do not restart the job.",
    "The line under the key is a polite live region and repeats the current state in ordinary text for anyone who cannot read the small screen.",
    "With reduced motion there is no flash and no progress row. The label changes in one step from Publish to Live and back.",
  ],
  faqs: [
    {
      question: "Why does the screen flash black and white before showing the new label?",
      answer: "Electronic paper moves charged dark and light particles through a fluid. To land every dot at a clean value the panel first drives them all to one extreme and then the other. The component copies that sequence: inverted old picture, black, white, a pale inverse of the new picture, then the picture itself.",
    },
    {
      question: "What is the ghosting during the progress row?",
      answer: "A quick update only pushes the dots that changed and does not flash, so a trace of the previous picture stays behind. Here each quick update adds seven percent of the difference into a `ghost` buffer that is drawn on top until the next full refresh sets it back to zero.",
    },
    {
      question: "How do I drive it from a real upload or deploy?",
      answer: "Call the same `goTo` function the timer uses. Move to step 1 when your request starts, raise `s.filled` and call `show(false, performance.now())` as progress arrives, and call `goTo(2, performance.now())` when it succeeds. Add a fourth entry to `screens` if you need an error state.",
    },
    {
      question: "Is the text on the screen an image?",
      answer: "No. Each state is drawn with ordinary canvas text and shapes in black on white on a hidden canvas, read back as brightness values, and used as the target for the dot simulation. Any system font works and the result is drawn at three dots per CSS pixel (`DOTS`).",
    },
    {
      question: "Does it keep drawing when nothing is happening?",
      answer: "The dot simulation runs only during a refresh and for about a second after it. While idle, the loop does no canvas work and only moves the streak of light on the window, and it stops when the key is off screen or the tab is hidden.",
    },
  ],
  related: ["glazed-celadon-ceramic-button-with-carved-lettering-that-rocks-under-the-finger", "wax-seal-button-that-a-brass-stamp-presses-into-molten-wax-on-an-envelope"],
  tags: ["e-ink", "e-paper", "key", "canvas", "progress", "skeuomorphic", "publish"],
  height: 800,
  interactive: true,
};

export default meta;
