const meta = {
  slug: "portrait-print-with-a-liquid-glass-bead-that-chases-the-pointer-and-shows-a-second-photograph",
  category: "cursors",
  name: "Portrait Print with a Liquid Glass Bead That Chases the Pointer and Shows a Second Photograph",
  keyword: "image hover reveal effect react",
  title: "React Image Hover Reveal with a Liquid Glass Bead | We.Inc",
  description: "Image reveal in WebGL: a bead of liquid glass chases the cursor across a portrait and shows another photo refracted inside. Free React and HTML code.",
  intro: "One portrait on a dark wall, and on it a fat bead of clear liquid that shows a different portrait through itself. The bead is six drops joined into one soft shape. The largest springs after the pointer with a little overshoot and the smaller ones lag behind in a chain, so a quick movement pulls the bead into a string of droplets that then run back together. It is lit like a real drop: the second picture is magnified and bent toward the rim, there is a hard glint on the side facing the lamp, a glow on the far side, and a shadow and a crescent of focused light on the print beneath. With no pointer the bead wanders. Clicking or tapping the print swaps which picture is the print and which is inside the bead. The card scales down to phone width and a finger steers the bead while it is on the picture.",
  useWhen: [
    "A lookbook or campaign page has two frames from the same shoot and wants a playful way to show both in one slot.",
    "You need a before and after, day and night, or sketch and render comparison that feels less clinical than a slider handle.",
    "A portfolio cover should reward the visitor for moving the mouse without hiding anything essential.",
    "A product page wants to show a second colourway through a moving window on the first.",
  ],
  customize: [
    "Put your two pictures in `looks`. They should be framed alike, because the bead shows the same area of the second picture that it covers on the first.",
    "`DROPS` holds the size of each drop as a share of the print height. Shrink the first value for a smaller bead, or shorten both `DROPS` and `PULL` to four entries for a tidier one (change the `6` in the shader loops and the uniform to match).",
    "`PULL` is how hard each drop chases the one ahead. Halve the later numbers for long trailing strings; make them all about `100` for a bead that barely breaks up.",
    "Magnification is the `0.060`, `0.065` and `0.070` trio in the shader. Equal numbers remove the colour fringe at the rim.",
    "The lamp direction is `vec2(-0.55, -0.83)`, top left. Flip the first sign to light the bead from the right; the glint, shadow and crescent all follow.",
  ],
  accessibility: [
    "The whole print is one native button with `aria-pressed`, and its label names which portrait is on top and which is inside the bead.",
    "Arrow keys roll the bead when the print has focus, and Enter or Space swaps the portraits, so nothing depends on a mouse.",
    "Both photographs are real images with their own alt text beneath the canvas, so the second one is available without finding it by hover.",
    "With reduced motion, or without WebGL, the print shows the second portrait through a fixed round window, and the swap still works.",
  ],
  faqs: [
    { question: "How does the bead split into droplets and join up again?", answer: "Each drop adds a field that is strong at its centre and fades with distance. The shader adds the six fields together and draws liquid wherever the total passes a threshold. Two drops that are close push the total over the line in the gap between them, which is what makes them bridge and merge; pull them apart and the bridge thins and snaps." },
    { question: "What makes it read as glass and not a flat circular mask?", answer: "Four things taken from how a water drop on paper looks. The picture inside is displaced toward the centre more and more strongly near the rim. The side nearest the light is slightly shaded and the far side glows. There is one small hard reflection of the lamp. And the print outside gets a soft shadow with a bright sliver where the drop has focused the light." },
    { question: "Can the bead reveal a video or a block of text?", answer: "The inside is sampled from a texture, so a video works if you upload the current frame to the second texture on every draw. Live HTML text cannot be sampled this way. For text, render it into the second image." },
    { question: "Why does the bead keep moving when I am not touching it?", answer: "About two seconds after the last pointer movement the target switches to a slow looping path, so a preview or a visitor on a touch screen still sees what the piece does. Remove the `if (stamp - aim.current.at > 2200)` block to keep it parked where it was left." },
    { question: "What does it cost to draw?", answer: "Three passes over the six drops per pixel and six texture reads, on a canvas the size of the print at a pixel ratio capped at two. The loop pauses when the print is off screen or the tab is hidden." },
  ],
  related: ["photograph-in-an-enamel-darkroom-tray-under-water-that-ripples-where-the-pointer-drags", "photo-gallery-on-a-cotton-paper-sheet-where-each-portrait-blooms-in-like-ink-through-wet-fibres"],
  tags: ["image reveal", "cursor", "mask", "liquid glass", "metaballs", "webgl", "refraction", "portrait"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
