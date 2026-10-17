const meta = {
  slug: "louvred-window-shutters-toggle-that-tilt-their-slats-and-swing-open-onto-a-coastal-photograph",
  category: "toggles",
  name: "Louvred Window Shutters Toggle That Tilt Their Slats and Swing Open onto a Coastal Photograph",
  keyword: "react window shutters reveal toggle",
  title: "React Reveal Toggle: Window Shutters That Open | We.Inc",
  description: "Switch built as louvred shutters in a dark room: the slats tilt, the leaves swing out in 3D and daylight shows a photograph. Free React and HTML code.",
  intro: "A window in a thick wall, seen from inside a shaded room. Two sage green shutters with fifty-six real louvres cover a photograph of a harbour. Press the window and the slats turn first, so the view arrives as thin bright stripes and bars of sun land on the sill. A moment later the left leaf swings outward on its hinges and the right one follows, each drawn in true perspective so it narrows as it goes. As they open, the sides of the window recess, the sill and the plaster around the frame all brighten. Press again and the leaves come back, knock shut with one small bounce, and the louvres close after them. While open the leaves stir a little in the wind and the view drifts against your pointer. Everything is CSS 3D over one image, and the window scales down as a unit on phones.",
  useWhen: [
    "A hotel, villa or holiday rental page wants to hold back its best photograph for one beat and then give it away.",
    "A light and dark theme switch could be literal: shutters closed for dark, open for light, driving the page colours from the same state.",
    "A gallery or portfolio wants a cover image that the visitor uncovers by hand before scrolling on.",
    "A privacy or do-not-disturb setting needs a control that shows plainly whether the outside can see in.",
  ],
  customize: [
    "`view` holds the photograph, its alt text, the `focus` point used for cropping and the `place` caption. Portrait pictures of about three by four fit the opening best.",
    "`PAINT` has three tones of the shutter colour: `lit` for the top edge of each slat, `mid` for the faces and `dark` for the undersides. Use `#b9c7d6`, `#5f7186` and `#2c3644` for faded blue.",
    "`SLATS` is the number of louvres in each of the four panels. Fourteen gives fine blinds, eight gives chunky plantation shutters.",
    "`TILT` and `SWING` are the angles in degrees for the louvres and the leaves. Keep `SWING` under 85 or the open leaves turn edge on and vanish.",
    "`WALL` is the plaster colour and the page background. The daylight that spreads over it is the `radial-gradient` with `rgba(255,222,170,0.34)`.",
  ],
  accessibility: [
    "One transparent `button` covers the whole window. It has `role=\"switch\"`, `aria-checked` and the label Shutters open, and both Space and Enter work it.",
    "The photograph is a real `img` with alt text that describes the view, so the content behind the shutters is available without opening them.",
    "The second caption line is a polite live region that says whether the shutters are open and what a press will do next.",
    "With reduced motion the window is shown already open, with no breeze, no drift in the photograph and no automatic opening and closing.",
  ],
  faqs: [
    {
      question: "Are the gaps between the slats faked?",
      answer: "No. Each louvre is its own element turned with `rotateX`, and the photograph sits behind the leaves in the same box. When the slats tilt they take up less height on screen, and what you see between them is the real image. That is why the stripes line up with the picture once the leaves swing away.",
    },
    {
      question: "How do the leaves keep their perspective inside a clipped box?",
      answer: "The opening has `overflow: hidden` and `perspective: 900px` on the same element. Clipping flattens 3D for anything above it, but the leaves are direct children, so each still rotates in depth about its outer edge. Inside a leaf, `transform-style: preserve-3d` lets the slats and tilt rods keep their own rotation.",
    },
    {
      question: "How does one press produce two movements in order?",
      answer: "There are three springs: one for the louvre tilt and one for each leaf. A leaf only gets its open target once the tilt has passed 70 percent, and on the way back the tilt only closes when both leaves are nearly shut. The right leaf waits until the left has started, so they never move as one rigid piece.",
    },
    {
      question: "Can I use the open state to change my page theme?",
      answer: "Yes. `open` is plain state. Lift it to a parent or call your theme setter inside `set`. The component also writes `--o`, the openness from 0 to 1, onto its root on every frame, so you can fade other elements in step with the leaves.",
    },
    {
      question: "Is it heavy to animate that many slats?",
      answer: "The slats do not each run an animation. One number, `--t`, is written to the scene per frame and every slat reads it through `calc` in its transform. The loop pauses when the window is off screen or the tab is in the background.",
    },
  ],
  related: ["frosted-window-pane-over-a-photograph-that-thaws-under-a-warm-fingertip-and-freezes-over-again", "shop-door-open-closed-enamel-sign-toggle-that-spins-on-its-chain-and-rings-a-brass-bell"],
  tags: ["shutters", "window", "toggle", "switch", "reveal", "louvres", "3d", "photograph"],
  height: 720,
  interactive: true,
};

export default meta;
