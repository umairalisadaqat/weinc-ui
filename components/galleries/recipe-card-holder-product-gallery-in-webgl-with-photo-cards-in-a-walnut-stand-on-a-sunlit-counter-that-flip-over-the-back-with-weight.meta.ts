const meta = {
  slug: "recipe-card-holder-product-gallery-in-webgl-with-photo-cards-in-a-walnut-stand-on-a-sunlit-counter-that-flip-over-the-back-with-weight",
  category: "galleries",
  name: "Recipe Card Holder Product Gallery in WebGL with Photo Cards in a Walnut Stand on a Sunlit Counter That Flip Over the Back with Weight",
  keyword: "react 3d product gallery webgl",
  title: "Recipe Card Holder 3D Product Gallery in WebGL | We.Inc",
  description: "Free React WebGL gallery: product photos printed on thick cards in a walnut recipe stand on a sunny counter. Next lifts the front card over the top.",
  intro: "Five product photographs are printed on heavy cream card and stand in the slot of a walnut recipe holder, on an oak worktop in afternoon sun. The holder, the cards, the counter and the plaster wall behind are ray traced in one fragment shader, so the glazing bars of an unseen window fall across the wood and the cards throw soft shadows onto each other. Press Next and the front card is pulled toward you, lifted clear of the slot, turned end over end above the stand so its ruled reverse with care notes flashes past, and dropped into the back of the slot, where it bounces once. The cards left behind slide forward one after another and rock as they settle. Previous runs the same move the other way. The product name, note and price beside the stand are ordinary text that changes with the front card. On a phone the camera pulls back to keep the whole arc in view and the caption moves below the scene.",
  useWhen: [
    "A kitchenware, ceramics or homeware shop wants a small range shown as objects on a counter rather than a grid of thumbnails.",
    "A cafe, bakery or cookery school wants to flick through a handful of dishes or classes with a homely, handled feel.",
    "A launch page needs one slow, tactile gallery as its centrepiece instead of an autoplaying slider.",
    "You want a readable example of ray marching thin textured boxes, an array texture and soft shadows in plain WebGL 2.",
  ],
  customize: [
    "Each card comes from the `items` array: `name`, `note`, `price`, the three `care` lines printed on the reverse, `photo`, `alt` and a `tone` colour shown while the photo loads. The shop name and season line sit in `shop`.",
    "`FLIGHT_S` is how long a card spends in the air and `LIFT` how high it rises; `SLOT_SPRING` and `SLOT_DAMPING` control how the remaining cards slide forward, and a lower damping gives a longer knock-on rock.",
    "`AUTOPLAY_MS` and `FIRST_FLIP_MS` time the self-playing demo. Set `AUTOPLAY_MS` very high to make the stand wait for the visitor.",
    "The sun is `L` and `SUN` at the top of the fragment shader. Moving the `-5.0` in `win()` or the `1.7` bar spacing changes where the window frame shadows fall; `OAK` and `WALNUT` swap the two wood photographs.",
    "`paintCard` draws the printed face and the ruled reverse on a 2D canvas, so changing its fonts or the red and blue rule colours changes the print on every card.",
  ],
  accessibility: [
    "The stage is a focusable carousel group: Left and Right arrow keys flip back and forward, and the two round buttons carry `aria-label`s and visible focus rings.",
    "The canvas is hidden from assistive technology. The caption is a real heading and paragraph, and a polite live region reads the card number, product, price and a description of the photo after each flip.",
    "With reduced motion the stand stops playing by itself and a flip reorders the cards in a single frame, with the caption swapped without a fade.",
  ],
  faqs: [
    { question: "How does the card turn over the stand without passing through the others?", answer: "The flight is three curves running on slightly different clocks. Height rises on a softened sine that starts almost at once, the forward and back position follows a later smootherstep, and the full turn about the card's own width eases in between them. Because the lift leads, the card is above the stack before it starts travelling backwards, and it only drops once it is over the empty back slot." },
    { question: "Where does the weight come from?", answer: "Before it lifts, the card is pulled a little toward you and tips forward, which reads as anticipation. On landing it starts above the slot floor with a downward speed, so a small gravity step makes it bounce once, and its lean gets a kick that a damped spring lets settle. The other cards follow slot springs with staggered start times, so they arrive one after another." },
    { question: "Are the photos real 3D textures?", answer: "Each card face is painted onto a 2D canvas with the photo, its number, name and price, then copied into one layer of a WebGL array texture with mipmaps. The reverse of each card is another layer with a red rule, blue lines and care notes. The shader reads the right layer from where the ray hit the card in its own coordinates." },
    { question: "How is depth of field done?", answer: "Rather than tracing many rays per pixel, the shader picks a blurrier mip level the further a surface is from the front card. That keeps the photo on the front card sharp while the cards behind it, the far counter and the wall soften. Two rays per pixel with offset positions smooth the edges of the cards against the wood." },
    { question: "Will it run on a modest laptop?", answer: "Only the region around the stand is ray marched; the worktop and wall are flat planes found with one division. The canvas size is capped, the component drops its extra ray per pixel and then its resolution if frames run long, and it stops drawing when it scrolls out of view or the tab is hidden." },
    { question: "What do visitors see without WebGL 2?", answer: "A still version built from plain elements: three printed cards stacked at an angle with CSS perspective in a wooden block, on a counter and wall made of two flat colour bands. The caption and the buttons work the same way and change which photo is on the front card." },
  ],
  related: [
    "light-table-slide-gallery-with-a-glass-loupe-that-glides-between-mounted-transparencies",
    "photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table",
  ],
  tags: ["gallery", "carousel", "webgl", "3d", "cards", "product", "wood", "flip"],
  height: 740,
  section: true,
  interactive: true,
};

export default meta;
