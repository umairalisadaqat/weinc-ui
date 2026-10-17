const meta = {
  slug: "brushed-titanium-membership-card-in-webgl-rocking-on-a-stone-tray-in-window-light-with-an-anisotropic-sheen-and-laser-etched-type",
  category: "animated-cards",
  name: "Brushed Titanium Membership Card in WebGL Rocking on a Stone Tray in Window Light with an Anisotropic Sheen and Laser Etched Type",
  keyword: "react 3d metal card webgl",
  title: "Brushed Titanium 3D Card in WebGL with Anisotropic Sheen | We.Inc",
  description: "Free React WebGL card: brushed titanium with laser-etched type, rocking in a pale stone tray under window light. Tilt it to sweep the sheen, click to flip it.",
  intro: "A metal membership card the size of a bank card lies in a shallow tray of pale travertine, on a table by a tall window. The plate is brushed titanium: its grooves run along its length, so the window does not appear in it as a picture but as a long soft streak that runs across the grain. Move the pointer and the card rocks on whichever corner is lowest, and that streak slides over the plate while the laser-etched lettering stays dark and matte. Afternoon sun falls through the glazing bars and lays their shadow across the stone. The tray, its rim and the table are ray marched in a fragment shader with soft shadows and occlusion; the card is a real mesh with a polished chamfer. Click, tap or press Enter and it lifts, turns over about its short side and settles on the reverse, which carries a signature panel and a serial. On a phone the camera pulls back so the whole tray stays in frame.",
  useWhen: [
    "A members' club, private bank, concierge or loyalty programme wants the card itself as the hero of its join page.",
    "You sell metal objects such as cards, pens, watches or hardware and want a surface that reads as machined rather than painted grey.",
    "A pricing or tier page needs one premium object to set the tone above plain plan details.",
    "You want an example of anisotropic reflection in plain WebGL 2 that you can read in one file.",
  ],
  customize: [
    "Everything etched lives in the `card` object at the top: `house`, `tier`, `number`, `member`, `valid`, `serial`, `signature` and the two `small` lines on the reverse. Keep `number` an obvious placeholder.",
    "The brushing is set in `FS_CARD`: `spread` (0.26) is how far the window smears across the grain and `aB` (0.3) how long the sun streak runs; lower both for a finer satin, raise them for a coarse hairline finish.",
    "`TI` in the card shader is the metal colour. Try `vec3(0.75, 0.6, 0.42)` for bronze or `vec3(0.3, 0.3, 0.32)` for a darker gunmetal plate. The stone colours are the two `mix` values inside `stone()`.",
    "`TILT` sets how far the card rocks toward the pointer, `SPRING` and `DAMPING` how it follows, and `FLIP_SPRING` with `FLIP_DAMPING` how lively the turn is. `REST_YAW` is how askew it lies in the tray.",
    "Move the window by changing `SUN` and `WZ` in the shader header. `pane()` places the two glazing bars, so changing `q.x + 1.0` or `q.y - 2.7` moves their shadows across the tray.",
  ],
  accessibility: [
    "The stage is a focusable group. Arrow keys rock the card and Enter or Space turns it over; the Turn over button does the same and reports the side with `aria-pressed`.",
    "The canvas is hidden from screen readers. A polite live region names the side on show and reads the number and expiry on the face or the serial and signature on the reverse.",
    "With reduced motion the camera and the card hold still and turning over swaps to the other side in a single frame.",
  ],
  faqs: [
    { question: "What makes the sheen anisotropic?", answer: "Brushed metal has grooves in one direction, so its tiny facets tilt across the grooves but hardly along them. The shader reflects the room thirteen times with the normal leaned by different amounts across the grain and averages the results, and it lights the sun with a Ward highlight that is narrow along the grooves and long across them. Together they stretch every reflection into a band." },
    { question: "Why does the card rock instead of floating?", answer: "Each frame the code works out the height of all eight corners of the plate after rotation and lifts the card until the lowest one just touches the floor of the tray. When you tilt it, it therefore pivots on an edge like a real card would, and when it turns over it rolls up onto its side before lifting clear." },
    { question: "How is the stone tray drawn?", answer: "The tray is a rounded box with a rounded pocket subtracted from it, written as a signed distance function and ray marched only inside its bounding box. Its normal, a five-tap ambient occlusion and a soft shadow toward the sun come from the same function. The travertine colour is warped noise laid in bands with a few darker pores." },
    { question: "Where does the window shadow come from?", answer: "For every lit point the shader follows the sun direction back to a window plane behind the tray and checks whether the ray passes through glass or one of the two glazing bars. The edge softens with that distance, which is how real sunlight through a window behaves, so the bars land crisp on the stone." },
    { question: "Does it need a 3D library?", answer: "No. It uses four small shader programs, one array texture painted with the 2D canvas API, one mesh and a multisampled framebuffer, all created in a single `useEffect` and released when it unmounts. It renders at a capped pixel count, lowers resolution if frames run long and stops while off screen." },
    { question: "What happens without WebGL 2?", answer: "It shows a still version built from plain elements: a stone tray drawn with inset shadows, a card filled with a brushed metal gradient and dark etched lettering, set at an angle with CSS perspective. The Turn over button still swaps between face and reverse." },
  ],
  related: [
    "engraved-steel-membership-card-that-turns-on-its-edge-and-catches-a-fixed-lamp-in-its-lettering",
    "gilt-edged-show-ticket-card-in-webgl-with-hot-foil-that-catches-a-softbox-as-it-tilts-over-blue-lacquer",
    "gift-card-with-a-silver-scratch-off-panel-a-brass-coin-and-foil-crumbs-that-scatter-as-you-rub",
  ],
  tags: ["card", "webgl", "3d", "metal", "anisotropic", "flip", "tilt", "shadow"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
