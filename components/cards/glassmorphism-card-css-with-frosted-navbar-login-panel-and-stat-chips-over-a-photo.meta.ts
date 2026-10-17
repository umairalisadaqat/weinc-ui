const meta = {
  slug: "glassmorphism-card-css-with-frosted-navbar-login-panel-and-stat-chips-over-a-photo",
  category: "cards",
  name: "Glassmorphism Card CSS with Frosted Navbar, Login Panel and Stat Chips over a Photo",
  keyword: "glassmorphism css",
  title: "Glassmorphism Card CSS: Frosted Glass Card in React | We.Inc",
  description: "Free glassmorphism CSS in React and Tailwind: a frosted glass card, glass navbar, login panel and stat chips over a photo, with a solid fallback built in.",
  intro: "Four pieces of glassmorphism that share one CSS recipe: a frosted glass card for a listing, a pill navbar, a darker glass login panel and small stat chips, all sitting on a real sunset photograph. A segmented control switches the frost between light, medium and heavy so you can see how blur and tint change readability, and a Preview fallback switch shows exactly what visitors get in a browser without backdrop-filter. On phones the navbar hides its links, and the card, chips and login panel stack in one column.",
  useWhen: [
    "A hero or landing page has a strong photo and you want the navigation and a call to action to float over it without a heavy solid bar.",
    "You need a sign-in panel over a brand image where the inputs still pass contrast checks.",
    "A travel, weather or booking page wants small live figures, such as temperature or price, laid over a picture as chips.",
    "You searched for a glass card and want a tested recipe with a fallback, not a single class that looks muddy on a plain background.",
  ],
  customize: [
    "Edit the `FROSTS` object to tune each strength: `blur` feeds `backdrop-filter: blur()`, `tint` is the white alpha of the background and `edge` is the alpha of the one pixel border.",
    "The whole effect lives in the `CSS` string at the top. Move the `.s2g-glass` and `.s2g-glass-dark` rules into your stylesheet, rename them, and delete the `.s2g-nofilter` rules once you no longer need the preview switch.",
    "Swap `PHOTO` for your own picture. Busy, colourful images suit Light frost; bright or high-detail images need Heavy frost or the dark variant so text stays readable.",
    "Change the fallback colour inside the `@supports not` block: `rgba(58, 44, 38, 0.92)` is a warm brown picked from this photo, so match it to the dominant tone of yours.",
    "Change the content arrays `links` and `stats` to rename navigation items or chips without touching the markup.",
  ],
  accessibility: [
    "Every text colour on glass is white at 75 percent opacity or more, and the gradient over the photo darkens the top and bottom edges so the navbar and chips keep their contrast in bright spots.",
    "The navbar is a labelled `nav` with `aria-current` on the active link, the frost picker is a `radiogroup` and the fallback toggle is a `switch` with `aria-checked`.",
    "Both form fields have real labels, and every control has a white focus ring offset against a dark colour so it shows on any part of the photo.",
    "The slow drift of the photo and the staggered entrance stop when reduced motion is on; the layout itself does not depend on either.",
  ],
  faqs: [
    {
      question: "How does the glassmorphism CSS work?",
      answer: "Three properties do the work. `backdrop-filter: blur()` blurs whatever is behind the element, a semi-transparent background such as `rgba(255,255,255,0.16)` gives it a milky tint, and a thin light border plus an inset highlight on the top edge makes it read as a pane with thickness. `saturate(160%)` keeps the blurred colours from going grey.",
    },
    {
      question: "Why does my glass card look like a plain grey box?",
      answer: "Backdrop blur only shows when there is something behind the element to blur. On a flat white or single-colour background the result is just a translucent rectangle. Put glass over a photograph, a gradient or shapes, and make sure no parent between the card and that background has its own opaque fill.",
    },
    {
      question: "What happens in browsers without backdrop-filter?",
      answer: "The `@supports not` block detects the missing feature and gives each panel an almost opaque solid colour instead, so text never ends up floating over a raw photo. The Preview fallback switch applies the same rules on demand so you can check the result.",
    },
    {
      question: "Do I need the -webkit- prefix?",
      answer: "Safari supported only the prefixed `-webkit-backdrop-filter` for years, and older iPhones still in use need it. Keeping both lines costs nothing, so the recipe writes the prefixed and standard property side by side.",
    },
    {
      question: "Is backdrop-filter slow?",
      answer: "Blurring is done by the graphics card every time something behind the panel moves, so large blur radii over animated content can drop frames on weak phones. Keep the radius at 30px or less, avoid stacking many glass layers on top of each other, and do not animate the blur value itself.",
    },
    {
      question: "Can I use Tailwind classes instead of custom CSS?",
      answer: "Yes. `bg-white/15 backdrop-blur-lg backdrop-saturate-150 border border-white/30` gets close, and `supports-[not(backdrop-filter:blur(1px))]:bg-stone-800/90` adds the fallback. The CSS variables here are used so one picker can change every panel at once.",
    },
  ],
  related: [
    "mountain-lodge-photo-hero-with-drifting-cloud-headline-and-glass-booking-cards",
    "black-glass-pill-navbar-with-a-mercury-drop-that-stretches-to-the-active-link",
    "gift-card-with-a-silver-scratch-off-panel-a-brass-coin-and-foil-crumbs-that-scatter-as-you-rub",
  ],
  tags: ["glassmorphism", "glass card", "frosted glass", "backdrop-filter", "glass navbar", "login form", "css"],
  height: 680,
  section: true,
  interactive: true,
};

export default meta;
