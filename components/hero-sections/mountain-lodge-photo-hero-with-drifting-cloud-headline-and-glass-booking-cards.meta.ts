const meta = {
  slug: "mountain-lodge-photo-hero-with-drifting-cloud-headline-and-glass-booking-cards",
  category: "hero-sections",
  name: "Mountain Lodge Photo Hero with Drifting Cloud Headline and Glass Booking Cards",
  keyword: "tailwind photo hero with parallax glass cards",
  title: "Tailwind Photo Hero with Parallax Glass Cards | We.Inc",
  description: "Hero on one mountain photograph: real cloud drifts across a huge headline, with frosted booking and forecast cards at depth. Free React and HTML to copy.",
  intro: "A full-bleed hero for a mountain lodge, built on a single photograph of a hut above a sea of cloud. The headline is set very large in the open sky, and a piece of cloud cut from the same picture slides slowly in front of the letters, so the type appears to sit inside the weather. Two frosted cards float nearest the viewer: a booking card with night and guest controls that reprices as you tap, and a morning forecast that moves a cloud line up and down a small ridge drawing. Photo, headline and cards each shift by a different amount as the pointer moves. On phones the cards stack under the picture and the pointer effect is switched off.",
  useWhen: [
    "A lodge, cabin, retreat or small hotel has one strong landscape photograph and wants it to carry the first screen.",
    "You want a booking prompt visible straight away without covering the middle of the picture.",
    "The page should feel calm and bright instead of the usual dark photo with white text on top.",
    "You need a sense of depth from a flat image without video or a 3D library.",
  ],
  customize: [
    "Swap the picture by changing `PHOTO` and `PHOTO_ALT`. Pick one with pale sky at the top and cloud or mist in its lower right corner, because that corner is what the two wisps are cut from.",
    "Layer travel is the `DEPTH` object in pixels: raise `glassFront` for a stronger pull on the booking card, or set every value to `0` to remove the pointer effect.",
    "Cloud speed is `46s` in the `.lodge-cloud-hero-wisp` rule, and each wisp's size, height and starting point are the `width`, `top` and `delay` values in the small array beside it.",
    "Ink colour is `#0d2231` and the warm accent is `#ff9d5c`; replace both across the file to retheme. Card frost is the gradient in `.lodge-cloud-hero-glass` together with `backdrop-blur-2xl`.",
    "Prices come from `lodge.nightly` and the `stays` array; forecast days and cloud heights come from `mornings` and `LODGE_ALTITUDE`.",
  ],
  accessibility: [
    "Night and forecast day choices are real buttons that report `aria-pressed`, and the guest count is announced through `aria-live` when the plus and minus buttons change it.",
    "The drifting cloud copies of the photograph have empty alt text and sit in an `aria-hidden` wrapper, so the image is described once.",
    "With reduced motion requested the cloud is parked part way across the headline, the cards stop bobbing, the photo stops its slow zoom and nothing follows the pointer.",
    "Text stays dark navy on pale sky or on frosted white. If your photo is darker behind the headline, switch the heading to white and darken the top wash instead.",
  ],
  faqs: [
    { question: "How does the cloud pass in front of the headline?", answer: "A second and third copy of the same image are placed in small boxes above the heading. Each box shows only the cloudy lower right corner of the picture, is faded at its edges with a radial mask, and is moved sideways by a slow keyframe animation. Because cloud has no hard edges, the copy blends with the sky behind it." },
    { question: "Does it download the photograph three times?", answer: "No. All three image elements use the identical address, so the browser fetches it once and reuses it from memory." },
    { question: "How is the parallax depth made?", answer: "Pointer position is turned into two numbers between minus one and one, smoothed with a spring, and multiplied by a different pixel distance for each layer. The photo moves slightly against the pointer and the glass cards move with it, which reads as near and far." },
    { question: "What happens on a touch screen?", answer: "Touch pointers are ignored, so nothing jumps while scrolling. The cloud still drifts and the cards still float gently, which keeps the hero alive without input." },
    { question: "Can the booking card submit to a real system?", answer: "Yes. The card is a `form` with `nights` and `guests` held in state. Replace the `onSubmit` handler with a call to your booking page and pass those two values along." },
    { question: "Will backdrop blur slow the page down?", answer: "There are only three blurred surfaces and they are small, which modern phones handle well. If you target older devices, remove `backdrop-blur-2xl` and raise the white in the glass gradient so the cards stay readable." },
  ],
  related: ["neo-brutalist-hero-with-sticker-headline-and-shifting-hard-shadows", "olive-oil-bottle-hero-turning-on-a-seamless-backdrop-with-the-headline-orbiting-round-the-glass", "portrait-studio-hero-with-a-giant-headline-that-passes-behind-the-sitter-and-in-front-of-her"],
  tags: ["hero", "photo", "parallax", "glass", "booking", "travel", "cloud", "hotel"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
