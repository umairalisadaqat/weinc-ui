const meta = {
  slug: "gilt-edged-show-ticket-card-in-webgl-with-hot-foil-that-catches-a-softbox-as-it-tilts-over-blue-lacquer",
  category: "animated-cards",
  name: "Gilt-Edged Show Ticket Card in WebGL with Hot Foil That Catches a Softbox as It Tilts over Blue Lacquer",
  keyword: "webgl 3d tilt card react",
  title: "WebGL 3D Tilt Card with Gold Foil and Gilt Edges | We.Inc",
  description: "Free React 3D card in raw WebGL: a thick show ticket with a fashion photograph, gold foil that lights up under a softbox, gilt edges, a shadow and a mirror floor.",
  intro: "One thick ticket floats a hand's width above a floor of poured cobalt lacquer. Its face carries a tipped-in fashion photograph in a pressed plate mark, a house name stamped in gold foil, a fluted foil seal that straddles the picture's corner, and letterpress lines in black. The board has real depth, and its edges are gilded. Everything is drawn in raw WebGL 2 through a long lens: the foil is a true mirror of a procedural studio, so as the card turns toward the pointer a wide softbox slides across the lettering and the seal flashes flute by flute. The lacquer takes a soft shadow from each lamp, a reflection that blurs where the surface has been wiped, and a faint warm patch where the foil throws the top lamp back down. Press the card and it dips, winds up and turns over on a spring to show the seat on its reverse. On a phone the camera steps back so the card fits, and a tap turns it.",
  useWhen: [
    "An event, fashion show, private view or members' evening needs a hero where the invitation itself is the picture.",
    "You sell something printed, such as stationery, tickets, gift cards or packaging, and want the finish to read as foil and board instead of flat colour.",
    "A product or membership page wants one object the visitor can handle before they read anything.",
    "You need a 3D tilt card with a real two-sided flip and no rendering library in the bundle.",
  ],
  customize: [
    "All printed words are in the `card` object at the top: `house` is the foil wordmark and the monogram, `seat` fills the three columns on the reverse, and `photo.src`, `photo.alt` and `photo.focusY` set the picture and which part of it is kept.",
    "`sides` holds the two large captions under the card. `SERIF` and `GROTESK` are the font stacks used both on the page and inside the card artwork.",
    "`TILT` is how far the card turns toward the pointer. `SPRING` and `DAMPING` set how it follows, and `FLIP_SPRING` with `FLIP_DAMPING` set the turn: drop `FLIP_DAMPING` toward 4 for a bigger overshoot.",
    "The foil colour is `GOLD` in the shader header (`vec3(1.0, 0.64, 0.2)`); try `vec3(0.95, 0.95, 0.97)` for silver or `vec3(1.0, 0.55, 0.42)` for copper. The floor colour is the blue `vec3(0.006, 0.026, 0.2)`, which appears in `floorTint` and in `FS_SET`, and the reverse of the card is `BLUE` in `paintSide`.",
    "Layout on both sides is plain canvas drawing in `paintSide`. `PH` is the photograph's rectangle, `SEAL` the small seal and `ROSE` the large medal on the reverse, all in pixels of a 1024 by 1536 sheet. `HT` is half the thickness of the board.",
  ],
  accessibility: [
    "The stage is a focusable group: the four arrow keys tilt the card under the lamps and Enter or Space turns it over. The Turn over button does the same and reports its state with `aria-pressed`.",
    "The canvas is hidden from assistive technology. A polite live region names the side on show and reads the photograph's description on the face or the row, seat and door time on the reverse.",
    "With reduced motion the card stops swaying, the camera holds still and turning over is drawn as one new frame with no spin.",
  ],
  faqs: [
    { question: "How does the gold foil react to light?", answer: "Foil areas are painted into a mask texture. Where the mask is set, the fragment shader throws away the paper colour and instead reflects the view direction about the surface normal and looks up what the studio contains in that direction: a large front softbox, a key lamp, a strip light and the lit floor. Nothing is faked with a moving gradient, so the highlight is where a real one would be for that camera and pose." },
    { question: "What makes the seal flash in segments?", answer: "Inside the seal ring the normal is leaned sideways by a sine of the angle around the centre, thirty-six times round on the face and forty-eight on the large medal on the reverse. Each flute therefore mirrors a slightly different part of the room, and neighbouring flutes catch the softbox at different moments as the card turns. The leaning fades out when a flute would be narrower than a few pixels, which keeps small screens free of moire." },
    { question: "How are the shadow and the floor reflection calculated?", answer: "Both are solved exactly for a rounded rectangle. For the shadow, a line from the floor to each lamp is intersected with the card's plane and the distance to the card outline is turned into a soft edge whose width grows with the gap between card and floor. The reflection does the same with the mirrored view ray, then reads the card artwork at a blur level set by distance and by how smudged the lacquer is at that spot." },
    { question: "Is the edge thickness real geometry?", answer: "Yes. The card is a small mesh built in `cardMesh`: two faces, a flat side wall and a quarter-round arris, with rounded corners. The side wall is shaded as burnished gold leaf with fine streaks and a slow unevenness along its length, so each lamp lands on it as a long soft glint instead of a flat band." },
    { question: "Does it use three.js or any other library?", answer: "No. It is four small shader programs, two array textures drawn with the 2D canvas API, one mesh and a multisampled framebuffer, all created and released in a single `useEffect`. The only imports are React and the reduced motion hook." },
    { question: "What is shown when WebGL 2 is missing?", answer: "A still version built from ordinary elements: the same photograph, a gradient gold wordmark, a gold side edge made from stacked box shadows and a blue radial backdrop, set at an angle with CSS perspective. The Turn over button swaps it to the reverse." },
  ],
  related: ["fashion-print-carousel-in-webgl-with-standing-prints-that-rock-on-their-corners-over-a-mirror-floor", "engraved-steel-membership-card-that-turns-on-its-edge-and-catches-a-fixed-lamp-in-its-lettering", "gift-card-with-a-silver-scratch-off-panel-a-brass-coin-and-foil-crumbs-that-scatter-as-you-rub"],
  tags: ["card", "webgl", "3d", "tilt", "foil", "flip", "reflection", "shadow"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
