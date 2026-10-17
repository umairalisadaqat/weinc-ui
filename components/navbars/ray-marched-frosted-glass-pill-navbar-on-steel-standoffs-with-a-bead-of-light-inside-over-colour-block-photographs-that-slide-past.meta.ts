const meta = {
  slug: "ray-marched-frosted-glass-pill-navbar-on-steel-standoffs-with-a-bead-of-light-inside-over-colour-block-photographs-that-slide-past",
  category: "navbars",
  name: "Ray-Marched Frosted Glass Pill Navbar on Steel Standoffs with a Bead of Light Inside over Colour-Block Photographs That Slide Past",
  keyword: "frosted glass navbar react webgl",
  title: "Frosted Glass Pill Navbar in 3D (React, WebGL) | We.Inc",
  description: "Free React navbar drawn as a pill of etched glass in a WebGL shader. A bead of light runs to the active link while the photograph behind slides to the next page.",
  intro: "A navigation bar photographed rather than styled. A fragment shader ray-marches a pill of glass held off a printed wall on two turned steel standoffs and looks along it through a long lens from the left. The back of the glass is acid etched and the rim is left polished, so the middle shows the photograph behind as a soft wash of its colours while the edge bends it sharply and splits it a little into red and blue. The link names are black enamel on the front face and drop their own faint shadows onto the frost a third of a bar behind them. The marker for the current page is a lozenge of lime light inside the glass, which also tints the rim, the nearer steel cap and the wall behind. Choose another link and its leading end draws back, shoots across, and the tail catches up late, while the page on the wall runs off sideways and the next photograph follows it in with its title set as wide as the pill. Underneath sit five ordinary anchors in a nav landmark, positioned over the lettering. On a phone the lens squares up, the pill spans the width and the title hangs just under its shadow on a tall crop of the same photograph.",
  useWhen: [
    "A portfolio, magazine or studio site has four to six sections and wants the header itself to be the thing people remember.",
    "Each section has one strong photograph and you would like moving between them to feel like changing the sheet on a wall, not swapping a div.",
    "You need a glass navigation bar that is honestly lit, with a shadow, a rim and refraction, instead of a backdrop blur with a white border.",
    "A landing page hero needs a slow, self-running centrepiece that still works as real navigation when someone reaches for it.",
  ],
  customize: [
    "`pages` holds everything per link: `label` on the glass, `title` and `deck` printed on the wall, `place` for the small capitals, the photo `src`, `flip` to mirror it, `ink` for the type and `back` for the two colours shown before the photo arrives.",
    "`LIGHT` is the colour of the bead in linear RGB and `GLOW` its strength. It ships lime. `[1, 0.74, 0.42]` gives a warm filament, `[1, 0.35, 0.3]` a tail lamp red.",
    "`FROST` is how far the etched face smears the wall, in bar heights. At 0.05 the glass is nearly clear, at 0.3 the photograph dissolves into two or three colours.",
    "`YAW` is how far round the lens stands. Zero looks at the pill square on, which suits a sticky header, and 0.45 makes the far end fall well away.",
    "The travel is in the two springs in `frame`: `215` and `19.5` for the leading end, `150` and `15.5` for the tail. Raise both damping numbers to about 28 for a bead that arrives without wobble.",
    "`START` is the link it opens on, and the `3800` and `3300` millisecond values set how long the idle demo holds each page.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. Navigation is a `nav` landmark holding a list of real anchors, each with its visible name as text and `aria-current=\"page\"` on the active one.",
    "Tab moves through the links in reading order and each shows a white focus ring drawn over its lettering, and Enter follows the link, which here moves the bead and changes the wall.",
    "The current title and standfirst are repeated in a polite live region, since the large type on the wall is painted into a texture and cannot be read by a screen reader.",
    "With reduced motion the softbox stops drifting, the demo never starts, and choosing a link places the bead and the new photograph at once with no slide.",
    "The enamel lettering is near black on pale frost. If you darken the photographs a great deal, check the contrast of the labels again or raise the veil term in `frost`.",
  ],
  faqs: [
    {
      question: "How is the frosted look made without a blur pass?",
      answer: "Each ray that leaves through the etched back face stops there and gathers nine samples of the wall from a small disc, taken from a coarser mip level of the photograph so the nine blend into a smooth wash. The disc is rotated per pixel and the frames are averaged, which hides the pattern. On top of that the frost adds the studio light it scatters itself, with a fine tooth of noise, which is what makes etched glass look pale rather than simply out of focus.",
    },
    {
      question: "Why is the rim sharp when the middle is soft?",
      answer: "Only the flat back face is treated as etched, and only inside a margin of about a tenth of a bar. A ray that exits through the margin, the rounded rim or an end is refracted out properly and reads the photograph where it lands, so the edge behaves as clear glass: displaced, compressed, and fringed because red, green and blue are sampled slightly apart.",
    },
    {
      question: "How do the real links line up with the drawn lettering?",
      answer: "The label positions are measured when the lettering is drawn, in the same units as the scene. On every resize the four corners of each label are projected through the same camera the shader uses and the anchor is placed over their bounding box, never shorter than 40 pixels. The pointer lean is small enough that the boxes do not need to follow it.",
    },
    {
      question: "What happens while a photograph is still downloading?",
      answer: "The wall is painted at once with the two `back` colours for that page and its title, so the scene is complete from the first frame. When the image arrives it is cropped to cover, the type is drawn over it and the texture is replaced. Photographs are requested with `crossOrigin` set, so they must come from a host that allows it.",
    },
    {
      question: "Can it be a sticky header over a scrolling page?",
      answer: "As written it is a full section with its own wall, because the refraction needs to know what is behind the glass. For a sticky bar, keep the section as the first screen and switch to an ordinary header after it scrolls away, or feed the shader a texture of your own page background in place of the photographs.",
    },
    {
      question: "What is shown when WebGL is not available?",
      answer: "The same five anchors laid out in a translucent rounded bar with a backdrop blur over the photograph as a plain image, the active link lit lime, and the title set in real text below. Nothing about the navigation depends on the canvas.",
    },
  ],
  related: ["ray-marched-tangerine-resin-rocker-switch-with-a-lamp-inside-that-glows-through-the-plastic-and-spills-across-a-lilac-table", "black-glass-pill-navbar-with-a-mercury-drop-that-stretches-to-the-active-link", "soft-silicone-pill-navbar-with-a-glowing-ball-rolling-under-the-rubber"],
  tags: ["navbar", "glass", "frosted", "webgl", "ray marching", "shader", "refraction", "photography"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
