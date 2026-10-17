const meta = {
  slug: "satin-opening-ribbon-on-brass-posts-that-brass-scissors-cut-so-both-halves-flutter-down-and-the-page-goes-live",
  category: "originals",
  name: "Satin Opening Ribbon on Brass Posts That Brass Scissors Cut So Both Halves Flutter Down and the Page Goes Live",
  keyword: "ribbon cutting animation react",
  title: "React Ribbon Cutting Animation for a Launch | We.Inc",
  description: "Launch moment: a satin ribbon tied between brass posts is cut by scissors and both halves flutter down as the page goes live. Free React and HTML code.",
  intro: "An opening ceremony for a web page. A florist's homepage hangs on a pale wall, slightly greyed, with a wide satin ribbon stretched in front of it between two brass posts and a pair of brass scissors waiting with one blade behind the ribbon and one in front. Press Cut the ribbon, or press the scissors, and they open a little wider, bite, and are lowered out of sight. The two halves let go at the middle, flutter down, turn over to show their duller back and come to rest hanging beside the posts, while the page takes its full colour and the label changes from Draft to Live. Tie a new ribbon pulls both ends back to the centre and the scissors return. The ribbon is a chain of points drawn on a canvas as shaded satin; the posts, scissors and page are gradients and one SVG. Below about 760 pixels the whole scene scales down above a full-size button.",
  useWhen: [
    "The last step of a site builder flow, where a finished draft is about to be made public.",
    "A product launch or shop opening page that wants a small ceremony in place of a countdown.",
    "A case study that shows a client site on the day it opened.",
    "A feature announcement where the reader should perform the reveal with one press.",
  ],
  customize: [
    "The page on the wall is the `site` object; its photograph, headline and button text are all read from there.",
    "`RIBBON` is the width of the satin and `RY` the height it is tied at. The four colours `FACE_LO`, `FACE_HI`, `BACK_LO` and `BACK_HI` are the shiny side and the reverse.",
    "`N` and `SEG` set how many links each half has and how much it sags. The `0.986` in `step` is air drag: closer to 1 and the halves swing like rope, lower and they float.",
    "The resting twist of each fallen half is `2.2` and `-3.5` in `step`. Set both to `0` for ribbons that hang flat.",
    "`FIRST_CUT`, `HOLD` and `TIED` time the self-playing demo. Remove the `loop` call to leave it waiting for a press.",
  ],
  accessibility: [
    "One real `button` with `aria-pressed` does everything, and its label says what the next press will do. The scissors are an extra pointer target for the same action, hidden from assistive technology.",
    "The page is announced as a single image whose label includes whether it is a draft or live, and a polite live region repeats the state in a sentence.",
    "With reduced motion the ribbon does not sway, and a press redraws the scene once in its other state: no swing, no falling, no moving scissors.",
  ],
  faqs: [
    {
      question: "How is the satin shaded?",
      answer: "Each link of the ribbon is a four-sided patch filled with a gradient that runs across its width: dark at the edges, a bright band a quarter of the way in. The brightness of that band depends on the angle of the link, so the sheen slides along the ribbon as it moves.",
    },
    {
      question: "How does a flat drawing show the ribbon turning over?",
      answer: "Every point has a twist angle that grows towards the cut end. The drawn width is the full width times the cosine of that angle, so the ribbon pinches to a line where it is edge on, and past that point the patch is filled with the colours of the reverse side.",
    },
    {
      question: "Why does one blade pass behind the ribbon?",
      answer: "The scissors are two separate drawings. One sits under the canvas the ribbon is painted on and the other sits over it, so the satin is between the blades in the stacking order as well as in the picture.",
    },
    {
      question: "How do I run my own publish call when it is cut?",
      answer: "Do the work in the button's `onClick` and call `api.current?.set(true)` when it succeeds. `set(false)` ties a new ribbon. The `live` state updates at the start of each move.",
    },
    {
      question: "Does the loop keep running when nothing is happening?",
      answer: "It runs while the piece is on screen, because the ribbon always sways a little, and it stops when the piece scrolls out of view or the tab is hidden.",
    },
  ],
  related: [
    "steel-roller-shutter-stencilled-draft-that-rattles-up-to-show-a-lit-shop-window-holding-the-live-site",
    "publish-button-that-fires-a-rolled-up-site-up-a-glass-pneumatic-tube",
    "framed-homepage-print-hung-on-a-nail-by-picture-wire-that-swings-settles-crooked-and-is-straightened",
  ],
  tags: ["publish", "launch", "ribbon", "scissors", "draft", "live", "physics", "canvas"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
