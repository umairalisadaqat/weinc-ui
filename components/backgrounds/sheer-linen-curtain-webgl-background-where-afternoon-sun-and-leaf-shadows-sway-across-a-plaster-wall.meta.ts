const meta = {
  slug: "sheer-linen-curtain-webgl-background-where-afternoon-sun-and-leaf-shadows-sway-across-a-plaster-wall",
  category: "backgrounds",
  name: "Sheer Linen Curtain WebGL Background Where Afternoon Sun and Leaf Shadows Sway Across a Plaster Wall",
  keyword: "sunlight shadow background react",
  tags: ["webgl background", "sunlight shadows", "animated background", "curtain", "hero background"],
  title: "Sheer Linen Curtain Sunlight Background (React, WebGL) | We.Inc",
  description: "Free React hero background: low sun through a swaying linen curtain and a tree, traced in WebGL onto lime plaster and oak, with soft dappled leaf shadows.",
  intro: "A calm, photographic hero background for a light page. One fragment shader draws a lime plaster wall meeting a pale oak floor, seen by a camera turned slightly so the wall recedes. For every visible point it follows a single ray back toward the sun and asks what stands in the way: a tall two-light garden door, a sheer unbleached linen curtain drawn across one light, and a tree outside. Each obstacle is blurred by its own distance from the wall, so the window bars stay fairly crisp, the curtain folds are a little softer and the far leaves melt into round dapples, which is how a real sun disc behaves. Light that passes the linen is warmed, fold edges let less through, and the patch bends over the skirting onto the floor. The breeze rises and falls on its own; moving a pointer leans the camera and the curtain edge, and a click or the Breeze button sends a gust that swells, overshoots and settles. On phones the lens widens so the window patch stays in frame and vertical swipes still scroll.",
  useWhen: [
    "An interiors studio, small hotel, ceramicist or architect wants a first screen that feels like a quiet room rather than a gradient.",
    "A wellness or slow-living brand needs motion so gentle that it reads as atmosphere, not as an effect.",
    "You have a serif headline and one button and want the background to do the rest without fighting the text for attention.",
    "A booking or enquiry page should set a warm, unhurried mood before anyone reads a word.",
  ],
  customize: [
    "Edit the `hero` object at the top for the eyebrow, headline, paragraph and button label.",
    "`SUN` in the shader is the direction toward the sun. Lowering its second number gives a longer, later-afternoon slant; raising it shortens the patch toward noon.",
    "`SUNCOL` and `PLASTER` set the colour of the light and of the wall. A cooler sun such as `vec3(0.9, 0.92, 1.0)` turns the scene into a bright morning.",
    "`D_TREE` is how far away the tree stands. Larger values soften the leaf shadows into bigger, rounder dapples; smaller values make them sharper and more leaf-shaped.",
    "`SPEED` scales the whole breeze, and the `0.22` base in the gust target inside the frame loop sets how much the curtain moves when nobody touches it.",
  ],
  accessibility: [
    "The canvas is `aria-hidden`; the headline is a real `h1`, and the copy and button are ordinary text that screen readers and translation tools can reach.",
    "Since the light keeps moving, a Pause button with `aria-pressed` is always shown next to Breeze, and both are 40 pixels tall with visible focus rings.",
    "With reduced motion, or when WebGL is missing, no loop starts at all and a CSS composition of the same wall and window patch is shown instead.",
    "Body text sits on the shaded part of the wall, where the stone-900 colour keeps contrast comfortably above 4.5 to 1.",
  ],
  faqs: [
    { question: "Is this a video or an image?", answer: "Neither. It is a single shader computed live each frame, so it stays sharp at any size and weighs a few kilobytes of code instead of megabytes of footage." },
    { question: "Why do the leaf shadows look like soft circles?", answer: "Each blocker is blurred by its distance from the wall times the apparent size of the sun. A tree several metres away blurs a lot, so small gaps between leaves become round spots of light, just as they do outdoors." },
    { question: "Will it slow down a phone?", answer: "The canvas is capped at roughly 0.9 million pixels, the device pixel ratio is held to 1.5, and the loop measures its own frame time and lowers resolution if frames run long. It stops entirely when scrolled off screen or when the tab is hidden." },
    { question: "Can I put dark text on it?", answer: "Yes. The left side of the frame is the shaded wall, so dark text reads well there. If you move the copy to the right, move the window by changing the numbers in the `win` line so the sunny patch sits elsewhere." },
    { question: "How do I stop the curtain without stopping the leaves?", answer: "Set the `sway` factor inside `folds` to zero. The curtain then hangs still in its folds while the tree keeps moving in the breeze." },
  ],
  related: [
    "ray-marched-glass-ribbon-webgl-background-with-dispersion-and-rainbow-caustics-on-a-sunlit-wall-that-parts-around-the-pointer",
    "arched-stained-glass-window-webgl-background-that-pours-coloured-light-across-a-stone-floor-as-the-sun-moves",
    "sunlit-print-table-photo-gallery-in-webgl-where-the-chosen-print-lifts-off-travertine-into-focus-through-window-light-and-leaf-shadows",
  ],
  height: 760,
  section: true,
};

export default meta;
