const meta = {
  slug: "navbar-with-centered-links-and-mobile-menu",
  category: "navbars",
  name: "Navbar with Centered Links, CTA Button and Mobile Menu",
  keyword: "tailwind navbar",
  title: "Tailwind Navbar with Centered Links | We.Inc",
  description: "Navbar over a photo hero: logo left, links in the true centre, a booking button and a glass mobile menu with a photo per page. Free React and HTML to copy.",
  intro: "A transparent site header drawn over a full-width photograph, shown here for a lakeside boat hire. The logo sits on the left, four page links sit exactly in the middle and a sign-in link with a cream booking button sit on the right. Each link owns a photograph, a headline and three facts, so hovering or focusing a link swaps the whole hero behind the bar to preview that page, and a thin marker springs across to sit under it. Left alone, the preview steps through the links and the marker fills up like a timer. Below 768 pixels the links fold into a round menu button that drops a sheet of dark glass with one photo row per page and both actions side by side.",
  useWhen: [
    "Your home page opens on a strong photograph and a solid white header would cut the top off it.",
    "You have four or five top-level pages that each have their own picture, such as rooms, trips, menus or projects.",
    "You want the links centred on the page itself, not just spaced between the logo and the buttons.",
    "You need a phone menu that feels designed, with thumbnails, without pulling in a menu library.",
  ],
  customize: [
    "Edit the `links` array at the top. Every entry carries `label`, `img`, `thumb`, `alt`, a two-line `headline`, `copy` and three `facts` pairs, and the bar, the hero and the phone menu all read from it.",
    "`CYCLE_MS` is how long the self-playing preview rests on each link (3600). To switch the auto-play off, start `demo` as `useState(false)`.",
    "The phone menu starts open so the preview shows it. Change `useState(true)` for `open` to `useState(false)` before you ship.",
    "The warm accent is `#ffd9a0` (marker fill, eyebrow, active dot) and the button cream is `#fff4e2`. The dark base under the photos is `#0b1d24`; the two gradient overlays use `#06141a`.",
    "To make clicks go to real pages, remove `e.preventDefault()` from the link handlers and set each `href`. Keep `choose(i)` only if you want the hero to change without leaving the page.",
  ],
  accessibility: [
    "The link for the page being viewed carries `aria-current=\"page\"`; the previewed link only moves the visual marker, so screen readers are not told the page changed when it has not.",
    "Previews fire on keyboard focus as well as pointer hover, and the phone menu shows every headline as text, so nothing is reachable by hover alone.",
    "The menu button exposes `aria-expanded` and `aria-controls`, its label switches between Open menu and Close menu, and Escape inside the sheet closes it and hands focus back to the button.",
    "Two dark gradients sit between the photographs and the white text. If you use brighter pictures, deepen the `from-[#06141a]/80` and `/90` stops instead of thinning the type.",
  ],
  faqs: [
    { question: "How are the links kept in the exact centre of the bar?", answer: "The header is a grid with `md:grid-cols-[1fr_auto_1fr]`. The two outer columns always take equal space, so the middle column lands in the true centre even though the logo is narrower than the sign-in link plus the button. With flexbox and `justify-between` the links would drift towards the lighter side." },
    { question: "How does the photo change when I hover a link?", answer: "All four photographs are stacked in the same spot and only the shown one has full opacity. Hover or focus sets a `peek` index, the component shows `peek ?? current`, and framer-motion fades between the images over 0.6 seconds while the headline block swaps with a short spring." },
    { question: "What is the thin line under the active link?", answer: "It is one element shared between the links through a framer-motion `layoutId`, so it slides with a spring instead of jumping. While the preview plays by itself, an inner bar scales from left to right over `CYCLE_MS` to show when the next link is due." },
    { question: "Will four full-size photos slow the page down?", answer: "Each hero image is requested at 1600 pixels wide with `loading=\"lazy\"`, and the phone menu uses separate 200 pixel thumbnails. If the weight matters, keep one hero photo and delete the `img` field from the other links; the headline and facts will still swap." },
    { question: "How do I make this header stick while the page scrolls?", answer: "Lift the `<header>` out of the hero, give it `sticky top-0 z-40` and add a background such as `bg-[#06141a]/70 backdrop-blur` once the page has scrolled, because white links over ordinary page content will not be readable." },
  ],
  related: ["navbar-with-liquid-stretch-highlight-and-inverting-labels", "soft-silicone-pill-navbar-with-a-glowing-ball-rolling-under-the-rubber", "black-glass-pill-navbar-with-a-mercury-drop-that-stretches-to-the-active-link"],
  tags: ["navbar", "header", "mobile menu", "centered links", "photo hero", "cta"],
  height: 700,
  section: true,
  interactive: true,
};

export default meta;
