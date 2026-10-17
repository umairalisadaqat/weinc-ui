const meta = {
  slug: "ray-marched-paper-pop-up-book-scroll-story-where-a-tea-hillside-a-drying-barn-and-a-tin-unfold-from-the-spread",
  category: "scroll-effects",
  name: "Ray Marched Paper Pop-Up Book Scroll Story Where a Tea Hillside, a Drying Barn and a Tin Unfold from the Spread",
  keyword: "react pop-up book scroll animation",
  title: "React Pop-Up Book Scroll Story in WebGL | We.Inc",
  description: "Free scroll story in React: a cloth book opens on a table as you scroll and paper hills, a barn and a tin stand up, one per heading. Copy the code.",
  intro: "A cloth-bound book lies on a linen table in low afternoon light. As the section scrolls into view the front board swings over and lands with a small bounce, then the story stands up out of the spread one fold at a time: three ridges of cut card for the hillside, a terracotta barn, and finally a tea tin. Each fold has its own heading and sentence set in real text beside the book, and three buttons let a reader jump straight to any fold. The whole scene is one WebGL fragment shader that ray-marches the book and the paper, with soft shadows, light glowing through the thin card from behind, ambient occlusion and a shallow focus. On a phone the book sits above the words and the buttons stay a full thumb high.",
  useWhen: [
    "A food, drink or craft brand wants to tell where a product comes from in three short steps instead of a wall of copy.",
    "An origin or about page needs one memorable moment that rewards the reader for scrolling.",
    "A launch page for a children's book, a stationery shop or a print studio wants a scene made of paper.",
    "A case study has a before, a during and an after, and each deserves its own headline.",
  ],
  customize: [
    "Edit the `beats` array for the three headings, sentences and fold names. Each `at` value is how far through the story the book must be for that fold to stand.",
    "`RISE` lists when each paper piece stands up, as pairs from 0 to 1: three ridges, the barn, then the tin. Spread the pairs out for a slower story.",
    "Colours live in the shader's `albedo` function: the ridges are the three `vec3` greens, the barn is `vec3(0.6, 0.2, 0.1)` and the tin is `vec3(0.03, 0.22, 0.24)`. The book cloth is the ink blue at the top of that function.",
    "The words printed on the pages are drawn by `spreadPrint`. Change the lines there; they are mapped onto the spread as a texture.",
    "`lx`, `ly` and `lz` in `draw` aim the afternoon light. A smaller `ly` gives longer shadows across the table.",
  ],
  accessibility: [
    "The canvas is hidden from screen readers. The current fold's heading and sentence sit in a polite live region, so they are read when the story moves on.",
    "The three fold buttons carry `aria-pressed`, take a single tab stop and move with the arrow keys, Home and End.",
    "With reduced motion the book is drawn once, already open with everything standing, and the buttons and scrolling jump straight to each fold.",
    "Keep the text column outside the canvas if you rearrange the layout, so the words never depend on WebGL.",
  ],
  faqs: [
    {
      question: "How does scrolling map to the pages opening?",
      answer: "A passive scroll listener measures where the stage sits in the window. The book is closed as the stage enters from the bottom and fully open once it is centred. That one number sets the board angle and when each piece stands, and springs smooth everything between them so the board can bounce and the card can sway.",
    },
    {
      question: "What does it show before anyone scrolls?",
      answer: "It loads already open with every piece standing. After a few seconds a demo closes the book and opens it again one fold at a time, and it stops for good the first time the page scrolls or a button is pressed.",
    },
    {
      question: "Is this a 3D model file?",
      answer: "No. Every shape is a signed distance function written in the shader: the boards and page blocks are rounded boxes, each ridge is a profile of sine waves cut from a thin slab and hinged at its foot, and the barn and tin are a box with a gable and two cylinders that rise out of the paper.",
    },
    {
      question: "Will it slow down a laptop?",
      answer: "The canvas is held to about 1.2 million pixels, rendering stops when the section is off screen or the tab is hidden, and once nothing moves it adds up a few dozen softened frames and then sleeps. If frames run slow it lowers its own resolution.",
    },
    {
      question: "What if the browser has no WebGL?",
      answer: "A flat drawing of the open book with the hills, sun, barn and tin takes its place, and the headings and buttons keep working exactly as before.",
    },
  ],
  related: [
    "hanging-garment-bag-scroll-reveal-with-a-brass-zip-that-parts-waxed-canvas-over-a-photograph",
    "pop-up-card-where-a-typed-sentence-stands-up-as-a-layered-paper-homepage",
    "ray-marched-oak-groove-stepper-with-a-steel-ball-that-rolls-to-turned-brass-posts-in-raking-window-light",
  ],
  tags: ["scroll", "pop-up book", "paper", "webgl", "ray marching", "storytelling", "3d"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
