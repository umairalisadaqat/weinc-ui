const meta = {
  slug: "react-image-carousel-with-scroll-snap-autoplay-dots-thumbnails-and-swipe",
  category: "galleries",
  name: "React Image Carousel with Scroll Snap, Autoplay, Dots, Thumbnails and Swipe",
  keyword: "react carousel",
  title: "React Carousel: Image Slider, Card Row, Thumbnails | We.Inc",
  description: "Free React image carousel in Tailwind with no library: CSS scroll snap, swipe, arrows, dots, keyboard keys and autoplay that pauses on hover and focus.",
  intro: "Three React carousels that lean on the browser instead of a slider package. The track is an ordinary overflow row with CSS scroll snap, so swiping on a phone, trackpad flicks and shift-scroll all work natively, and the buttons simply call `scrollTo`. An IntersectionObserver watches which slide is mostly in view and keeps the dots, counter and thumbnails in step, whether you moved it by hand or by button. The full-width image slider autoplays with a filling progress bar on the active dot, stops while the pointer rests on it or anything inside has keyboard focus, and offers a pause button. The card row shows two products at a time beside the listing and a peek of the next one on phones, with arrows that grey out at either end. The thumbnail version is a property listing: a big photo, a counter and a strip of five small pictures to jump between. Everything stacks to one column below 1024px with no sideways page scroll.",
  useWhen: [
    "A landing page opens with a few large photographs and you want them to rotate on their own without hiding the controls.",
    "A shop or blog needs a horizontal row of product or article cards that people swipe through on their phone.",
    "A listing, portfolio or product page shows one large image with small previews underneath for jumping straight to a shot.",
    "You want a carousel without adding a dependency, and you would rather the browser handle momentum and touch.",
  ],
  customize: [
    "Swap the pictures and words in the `heroSlides`, `cards` and `rooms` arrays at the top. Each item has a `tone` hex colour that shows behind the image while it loads, so pick one close to the photo.",
    "`AUTOPLAY_MS` sets how long each hero slide stays, 5000 by default. Set it to `0` and the timer, progress fill and pause button all disappear.",
    "Change how many cards fit across by editing `sm:w-[calc((100%-1rem)/2)]` on the card link: it is `/2` with `1rem` for two; use `/3` with `2rem` for three. The `gap-4` on the track must match the rem you subtract.",
    "The slider shape comes from `aspect-[4/5] sm:aspect-[16/8]` on the hero track. Use `aspect-video` for a classic banner or a fixed height such as `h-[520px]` if your layout needs it.",
    "Snap position is `snap-start` on each slide. Change it to `snap-center` with some padding on the track to centre the active card and show half a card on both sides.",
  ],
  accessibility: [
    "Each carousel is a labelled `section` with `aria-roledescription=\"carousel\"`, and slides are groups announced as \"2 of 4\" plus their name. Slides out of view carry `aria-hidden` so screen readers do not read all of them at once.",
    "Left, Right, Home and End move the carousel whenever focus is inside it. Autoplay pauses while focus is inside, so keyboard users are never pulled along, and the live region only speaks when autoplay is off.",
    "With reduced motion on, autoplay never starts, the progress fill is skipped and button scrolling jumps instead of gliding. Keep this check if you add other effects.",
    "Every arrow, dot and thumbnail is a real button at least 40px tall with a visible focus ring and an accessible name.",
  ],
  faqs: [
    {
      question: "How do I make a carousel in React without a library?",
      answer: "Put the slides in a flex row with `overflow-x-auto` and `snap-x snap-mandatory`, give each slide `shrink-0 snap-start`, and let the browser do the scrolling. Your React code only needs two things: a function that scrolls the track to a slide's `offsetLeft`, and an observer that reports which slide is visible. The `useCarousel` hook here is that, in about forty lines.",
    },
    {
      question: "Does swipe work on phones?",
      answer: "Yes, and it needs no touch handlers. Because the track is a real scroll container, phones give it native momentum and the snap points catch each slide. That also means it never fights the page's vertical scroll, which is the usual complaint with drag-based sliders.",
    },
    {
      question: "How do I make the autoplay loop back to the first image?",
      answer: "It already does. `goTo` wraps the index with a modulo, so stepping past the last slide scrolls back to the first. If you want an endless one-way loop instead of a rewind, clone the first slide onto the end and jump back silently once it lands.",
    },
    {
      question: "Why does the autoplay stop when I hover over it?",
      answer: "Someone reading a caption or reaching for a button should not have the slide change under them. That is also a WCAG requirement for moving content. The timer is cleared while the pointer or focus is inside and restarts from the current slide when they leave.",
    },
    {
      question: "How do I hide the scrollbar on the carousel track?",
      answer: "The track uses `[scrollbar-width:none]` for Firefox and `[&::-webkit-scrollbar]:hidden` for Chrome and Safari. Scrolling still works with touch, trackpad and the buttons. Remove both classes if you want a visible bar as an extra hint that the row scrolls.",
    },
  ],
  related: [
    "concertina-fold-photo-book-carousel-that-opens-flat-at-the-centre",
    "light-table-slide-gallery-with-a-glass-loupe-that-glides-between-mounted-transparencies",
    "slide-projector-photo-carousel-with-a-tray-that-clicks-round-and-drops-each-frame-into-the-beam",
  ],
  tags: ["carousel", "react carousel", "image slider", "scroll snap", "autoplay", "thumbnails", "tailwind"],
  height: 1260,
  section: true,
  interactive: true,
};

export default meta;
