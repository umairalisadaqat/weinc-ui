const meta = {
  slug: "moulded-pulp-bento-tray-feature-section-in-webgl-where-a-glass-loupe-a-brass-key-a-spool-and-a-folded-card-lift-into-focus",
  category: "feature-sections",
  name: "Moulded Pulp Bento Tray Feature Section in WebGL Where a Glass Loupe, a Brass Key, a Spool and a Folded Card Lift into Focus",
  keyword: "webgl bento feature section react",
  title: "WebGL Bento Feature Section: Objects in a Pulp Tray | We.Inc",
  description: "Free React bento feature section in raw WebGL: a pressed pulp tray in daylight where each feature is an object that rises out of its pocket into focus.",
  intro: "A shallow tray of pressed paper pulp lies on a linen cloth in window light, seen from above and a little to the side through a long lens. It is cut into four pockets of different sizes, a bento layout made physical, and each pocket holds one object that stands for one feature: a glass loupe with a brass rim and a walnut handle, a brass key, a spool of coral cotton and a folded paper card. Choose a feature and its object dips into the pulp for a moment, then rises out of its pocket on a spring, turns toward you and comes into sharp focus while the rest of the tray falls soft. The loupe bends the sun into a bright disc on the pocket floor, the brass mirrors the tray around it and the glazing bars of the window lie across everything as soft shadows. The feature name and its sentence are set large beside the tray in real text, and the list of features underneath is a set of ordinary buttons. On a phone the tray sits on top, framed square on, and the words and buttons follow below it in two columns.",
  useWhen: [
    "A product page needs to explain four features and you want each to be remembered as a thing, not as another icon in a grid.",
    "Your brand leans on craft and material, and a bright, quiet stage suits it better than a dark glowing one.",
    "You want a bento layout that people actually play with, while the names and sentences stay readable text for search and screen readers.",
    "A launch page needs one section that moves on its own in a preview and still works from the keyboard.",
  ],
  customize: [
    "The words come from `product` and `features` at the top of the file. Keep four entries, because each one belongs to a pocket; `object` is the small caption above the big feature name.",
    "Pocket sizes and positions are in `CELLS` as centre x, centre z, half width and half depth in metres, and the shader cuts the tray from the same numbers. Move the matching object in `lensP`, `keyP`, `spoolP` or `cardP` if you resize a pocket.",
    "`LIFT_SPRING` and `LIFT_DAMPING` set how an object rises: a lower damping gives a bigger overshoot and a longer wobble before it settles.",
    "The pulp colour is the pair of `mix` colours under the id 1 branch of `material`, the thread colour is `vec3(0.79, 0.2, 0.12)` and the card's printed band is `vec3(0.13, 0.26, 0.74)`. The section colour `#e7e1d6` should stay close to the cloth so the canvas edge never shows.",
    "Set `DEMO` to `false` to stop the tray walking through its features before anybody touches it.",
  ],
  accessibility: [
    "Every feature is a real `button` with `aria-pressed`, so Tab reaches each one and focusing it lifts its object exactly as hovering does. The big name and sentence sit in a polite live region once the visitor has started choosing.",
    "The canvas is hidden from assistive technology, and pointing at a pocket only repeats what the buttons already do, so nothing is reachable by pointer alone.",
    "With reduced motion the objects jump straight to their resting or lifted pose, the camera holds still and the tray never plays by itself; a single finished frame is drawn after each choice.",
  ],
  faqs: [
    { question: "How is the tray drawn without any 3D models?", answer: "Everything is one fragment shader that ray marches signed distance functions. The tray is a rounded slab with four rounded pockets carved out of it by a smooth subtraction, which gives the soft lip and the generous fillets that pressed pulp gets from its mould. The pockets narrow slightly toward the floor, just as a real moulded insert has draft on its walls so it can come out of the tool." },
    { question: "Why does a bright patch appear under the loupe?", answer: "For each point on the tray the shader follows the sun back to the plane of the lens and asks where that light passed through the glass. A convex lens squeezes the light it receives into a smaller circle, so the patch is smaller than the lens and brighter by the ratio of the two areas, with a dark ring around it where the brass rim and the bent light leave a gap. As the loupe lifts the distance grows, the disc shrinks and it gets brighter." },
    { question: "How is the glass itself shaded?", answer: "A ray that hits the loupe is split. One part reflects off the surface and picks up the window, weighted by the Fresnel term. The other bends into the glass, travels through it until it reaches the far surface, bends again on the way out and then looks at the rest of the scene, so the pulp under the lens appears enlarged and shifted, and the image moves as the lens turns." },
    { question: "How does the focus follow the chosen feature?", answer: "The shader writes each pixel's distance from the camera next to its colour. A second pass blurs every pixel by how far its distance is from the focus distance, which glides toward the lifted object, so the chosen object is crisp and the floor and the other pockets go soft the way they would through a long lens at a wide aperture." },
    { question: "Will it run smoothly on an ordinary laptop?", answer: "The scene is wrapped in a tight box so rays that miss the tray go straight to the cloth, each object is only measured when a ray is close to it, and soft shadows and occlusion use short loops. The picture is capped at about 1.6 million pixels, drawing stops when the section scrolls away or the tab is hidden, and if frames start running long the resolution steps down on its own." },
    { question: "What do visitors without WebGL 2 see?", answer: "A still tray made from plain elements: the four pockets in the same bento layout, tipped back in perspective, with a small drawing of each object. The chosen object rises out of its pocket with a shadow under it, and the text, buttons and live region work exactly as they do over the rendered scene." },
  ],
  related: [
    "valve-chassis-where-glass-feature-tubes-plug-in-warm-up-and-light-parts-of-a-site-on-a-blue-display",
    "website-rack-with-feature-units-that-slide-home-on-rails-and-light-up-as-sections-of-the-page",
    "light-table-slide-gallery-with-a-glass-loupe-that-glides-between-mounted-transparencies",
    "sunlit-cast-resin-cube-pricing-in-webgl-where-a-shaft-of-window-light-picks-the-plan-and-the-cubes-tumble-over-to-yearly",
  ],
  tags: ["feature section", "bento", "webgl", "3d", "ray marching", "depth of field", "daylight", "objects"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
