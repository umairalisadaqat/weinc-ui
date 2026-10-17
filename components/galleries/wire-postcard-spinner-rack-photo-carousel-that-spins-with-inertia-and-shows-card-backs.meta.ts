const meta = {
  slug: "wire-postcard-spinner-rack-photo-carousel-that-spins-with-inertia-and-shows-card-backs",
  category: "galleries",
  name: "Wire Postcard Spinner Rack Photo Carousel That Spins with Inertia and Shows Card Backs",
  keyword: "react 3d rotating photo carousel",
  title: "React 3D Rotating Photo Carousel: Postcard Rack | We.Inc",
  description: "3D carousel built as a shop postcard rack: portraits in wire pockets round a pole that spins with inertia and shows card backs. Free React and HTML code.",
  intro: "A black wire spinner rack of the kind that stands by a gift shop door, alone on a cream studio floor. Eight columns turn round a steel pole and each column carries two postcards, so sixteen portraits are on the rack at once. The pair facing you is lit and full size, the neighbours turn away into shade, and through the gaps you can see the written sides of the cards on the far side, each with its stamp box, address lines and plate number. Give it a flick and it coasts on its bearing, loses speed and clicks into the nearest column. Every change of speed makes the cards lag and rock in their pockets and tips the whole rack a hair on its base. It turns one column by itself every few seconds. On phones the complete rack is scaled down, never rearranged.",
  useWhen: [
    "A photographer, illustrator or print shop sells cards or small prints and wants the gallery to look like the thing customers actually spin in a shop.",
    "You have between twelve and twenty portrait images and want most of them visible together instead of one slide at a time.",
    "The page is light and calm and needs a single dark, graphic object in the middle to carry it.",
    "A museum shop, travel site or stationery brand wants a playful browsing piece near the top of a collection page.",
  ],
  customize: [
    "Edit the `columns` array: each entry has a `top` and a `bottom` card with `src`, `alt`, `title`, a `focus` crop position and a `tone` colour that shows while the photo loads. Add or remove entries and the rack re-spaces itself, though you should widen `R` when you go past eight.",
    "Card size is `CW` and `CH`, the distance from pole to card face is `R`, and `TIER_Y` holds the top edge of the two pocket rows. Keep `R` at least `CW / 2 / Math.tan(Math.PI / N)` plus a little so neighbouring cards do not touch.",
    "The rack is powder black through the `WIRE` constant and the pole gradients. Swap them for a pale grey and set the section to a dark colour to reverse the scheme.",
    "How long a flick coasts is the `1.25` in `Math.exp(-1.25 * dt)`. The settle is the `34` and `7.4` spring pair, and how far cards rock is the `2.6` beside `alpha`.",
    "`HOLD_MS` is the pause between automatic turns. Set a very large number to leave the rack still until someone touches it.",
  ],
  accessibility: [
    "The rack is one focusable carousel group: left and right arrows turn it a column at a time, and the two round buttons do the same with labels that say which way it turns.",
    "All sixteen photographs are real images with alt text, so nothing is hidden from a screen reader while it happens to face away. The written sides are decoration and are hidden. The corner readout announces the facing column and both of its titles.",
    "Dragging only claims sideways movement over the rack itself, so a thumb can still scroll the page up and down through it. With reduced motion the timer, the coasting and the rocking are all off and a turn lands at once.",
  ],
  faqs: [
    { question: "How are the cards on the far side shown from behind?", answer: "Each postcard is two faces placed back to back with `backface-visibility: hidden`. The printed face holds the image and the second face, turned half a circle, is drawn as the written side. When a column passes behind the pole the browser hides the photograph and shows the other face without any script deciding." },
    { question: "Why do the cards rock when the rack changes speed?", answer: "Every card has its own small spring. Each frame the code measures how quickly the turning speed is changing and pushes all sixteen springs the opposite way, with a slightly different looseness per card, so they lean back as the rack starts, swing forward as it stops and never move in perfect unison." },
    { question: "How does the lighting change as it turns?", answer: "The script works out how squarely each column faces the camera and sets the opacity of three overlays per card: a warm shade on the printed side, a shade on the written side, and a diagonal sheen that only appears as a card swings through one angle on the right, as if catching a window." },
    { question: "Will sixteen images slow the page?", answer: "They are requested at 420 pixels wide, which is plenty for a 140 pixel card on a dense screen, and each sits on its own `tone` colour so the rack looks complete before any of them arrive. Movement is a single rotation of the parent plus one small rotation per card." },
    { question: "Can I use it with landscape cards?", answer: "Yes. Swap `CW` and `CH`, then raise `R` because wider cards need a larger circle, and shorten the gap between the two values in `TIER_Y`. Six columns suit landscape cards better than eight." },
  ],
  related: ["photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table", "riveted-swatch-deck-photo-carousel-that-fans-portraits-round-a-brass-pin"],
  tags: ["carousel", "3d", "postcards", "drag", "inertia", "rack"],
  height: 784,
  section: true,
  interactive: true,
};

export default meta;
