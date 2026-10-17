const meta = {
  slug: "tailwind-product-card-row-with-photoreal-ceramic-cup-glass-carafe-and-linen-napkins-in-window-light",
  category: "cards",
  name: "Tailwind Product Card Row with a Photoreal Ceramic Cup, Glass Carafe and Linen Napkins in Window Light",
  keyword: "tailwind card",
  title: "Tailwind Product Card Row with Photoreal Objects | We.Inc",
  description: "Free React and Tailwind product cards: three cards with a title, price and add to cart button, each photo a live rendered object in window light.",
  intro: "Three shop cards sit in a row, each with a product name, a short detail line, a price and an add to cart button. The picture on each card is not a photo file: it is a stoneware cup, a glass carafe and a pair of folded linen napkins rendered live on a coloured paper sweep, with a low sun through a window behind them laying bar shadows across the paper. The cup has a speckled oat glaze and a bare clay foot, the carafe is traced through every wall of glass it crosses so the paper bends behind it, and the linen shows its weave and soft washing creases. Move the pointer over a card, or tab into it, and the object turns a little on the spot, like a shop assistant turning it toward you. The cards themselves are plain Tailwind markup that stacks into one column on a phone.",
  useWhen: [
    "A homeware, kitchen or craft shop wants a featured products row that stops the scroll without commissioning a photo shoot.",
    "You need a product card layout in Tailwind with real button states and an announced cart count to start from.",
    "A landing page for a small brand wants three hero products shown in one consistent light and colour story.",
    "You want a working example of a WebGL picture inside an ordinary card that still behaves like a normal image for layout and screen readers.",
  ],
  customize: [
    "Edit the `products` array at the top: `name`, `detail` and `price` fill the card text, `alt` is what screen readers hear for the picture, and `field` sets the paper colour behind the object in linear RGB.",
    "`still` is the flat colour shown while the picture loads or when WebGL is unavailable. Keep it close to the `field` colour so nothing jumps.",
    "`turn` is the angle each object rests at and `HOVER_TURN` is how far it turns on hover. The cup's resting angle is what puts the handle in profile.",
    "Prices use `Intl.NumberFormat`; change the `CURRENCY` line for another currency or locale.",
    "Move the sun with `KEY_DIR` and `WIN_OFF` in the light settings string. `WIN_HALF` makes the pool of light larger or smaller and `BAR` sets the width of the window bar shadows.",
  ],
  accessibility: [
    "Each picture is a `role=\"img\"` element with a written description, and the canvas inside it is hidden from assistive technology.",
    "Add to cart is a real button with `aria-pressed`, a visible focus ring, and the product name in hidden text so a list of buttons still makes sense. A polite live region says what was added or removed.",
    "Keyboard focus anywhere inside a card turns the object the same way hover does. With reduced motion the object snaps to its turned angle instead of easing there, and without WebGL 2 each card shows a plain colour field with a soft window light.",
  ],
  faqs: [
    { question: "How do I make a product card in Tailwind?", answer: "Use a flex column: an image box with a fixed aspect ratio and rounded corners, then a row with the name and price pushed apart by justify-between, a muted detail line, and a full width button. This piece does exactly that, so you can drop the WebGL picture and put an img tag in the image box if you only want the layout." },
    { question: "Can I use my own product photos instead of the rendered objects?", answer: "Yes. Replace the ProductPhoto component with an img inside the same aspect ratio box and keep the alt text from the products array. The card, button states and cart announcement all work the same." },
    { question: "Why does each card have its own canvas?", answer: "Each picture is a separate little photo studio with its own camera framing. Three small canvases also pause on their own when scrolled off screen, and once a picture has settled it stops drawing, so they cost nothing at rest." },
    { question: "Will three WebGL pictures slow the page down?", answer: "Each canvas renders for about a second while the picture sharpens, then stops. It only draws again while an object is turning on hover. Pixel counts are capped, and resolution drops automatically if frames run slow." },
  ],
  related: [
    "photoreal-html-css-button-set-of-glazed-ceramic-brushed-steel-walnut-and-frosted-glass-keys-on-travertine-in-window-light",
    "brushed-titanium-membership-card-in-webgl-rocking-on-a-stone-tray-in-window-light-with-an-anisotropic-sheen-and-laser-etched-type",
  ],
  tags: ["cards", "product card", "tailwind", "ecommerce", "webgl", "photoreal", "glass", "ceramic", "linen"],
  height: 900,
  section: true,
  interactive: true,
};

export default meta;
