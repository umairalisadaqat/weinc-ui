const meta = {
  slug: "ray-marched-white-ceramic-pour-over-cone-and-glass-carafe-coffee-roaster-hero-on-pale-stone-in-raking-morning-sun-with-steam",
  category: "hero-sections",
  name: "Ray-Marched White Ceramic Pour-Over Cone and Glass Carafe Coffee Roaster Hero on Pale Stone in Raking Morning Sun with Steam",
  keyword: "coffee roaster hero section react webgl",
  title: "Pour-Over Coffee Roaster Hero Section (React, WebGL) | We.Inc",
  description: "Free React coffee hero: a glazed pour-over cone drips into a glass carafe on travertine in low morning sun, with rising steam and a sun you can move.",
  intro: "An opening screen for a coffee roaster, shot like a quiet kitchen at seven in the morning. A white glazed cone lined with a pleated paper filter sits on a thin glass carafe on a honed travertine counter, a fine thread of coffee runs from the cone into the pot and wisps of steam curl up through a low sun coming from behind and to the left. A single fragment shader traces the whole set: soft shadows that stretch across the stone, amber light the coffee lets through into its own shadow, the pores of the travertine picked out by the raking light, and steam that lights up when it sits between you and the sun. Each frame is traced with a small sub-pixel shift and averaged with the last ones, so the rims of the cone and the edges of the glass stay smooth. Moving the pointer swings the sun round and lifts or lowers it, and with nothing touched it drifts slowly by itself. The serif headline, copy and two links sit on the left on wide screens; on phones they sit on top and the pot stands below.",
  useWhen: [
    "A roaster, cafe or brewing equipment shop wants a calm first screen that feels like the morning ritual it sells.",
    "There is no product photography yet, or the photos are of bags and labels rather than of the brew itself.",
    "The brand is quiet and material, stone, glaze and glass, and a stock photo of latte art would cheapen it.",
    "You want a hero that rewards a moment of play without hiding the call to buy.",
  ],
  customize: [
    "`roaster` at the top holds the house name, the three headline lines (the middle line is set in italic brown), the copy, both links and the small note at the bottom.",
    "`COFFEE` is how quickly the brew absorbs red, green and blue. Lower numbers such as `[1.4, 3.2, 7.0]` give a lighter, tea-like filter coffee with more amber at the edges.",
    "`LEVEL` is how full the carafe is, from about `0.15` for the first few seconds of a brew to `0.7` for a full pot.",
    "`STONE`, `WALL` and `GLAZE` set the counter, the wall and the cone in linear light. A darker stone such as `[0.3, 0.29, 0.28]` reads as slate; then switch the text classes `text-[#1a120c]` to a light colour.",
    "The resting sun lives in the `light` object (`az` is round the set, `el` is height). A smaller `el` such as `0.22` gives longer, earlier shadows.",
  ],
  accessibility: [
    "The headline is a real `h1`, followed by the copy and both links in reading order. The canvas is hidden from screen readers because it only sets the mood.",
    "Moving the light does not need a pointer: on wider screens a focusable control labelled for the arrow keys swings the sun left, right, up and down.",
    "With reduced motion the scene is traced sixteen times with shifted samples into one clean still, the light stops drifting and the copy does not slide in.",
    "Near-black brown text sits on the light stone and wall at well over 4.5 to 1. Check it again if you darken the set.",
  ],
  faqs: [
    {
      question: "How is the glass drawn without a texture or a model?",
      answer: "The carafe is a signed distance shape: a squashed sphere blended into a neck, hollowed into a shell about two hundredths of a unit thick. When a ray meets the shell the shader adds a reflection of the room weighted by the Fresnel term, dims what passes through a little more at grazing angles so the edges show a faint green-grey, and carries on into the pot to find the coffee, the falling stream or the counter behind.",
    },
    {
      question: "Why are the edges smooth when ray marching usually looks jagged?",
      answer: "Every frame is traced with the pixel grid nudged by a different sub-pixel offset from a Halton sequence, and the result is folded into a running average of earlier frames. When the scene is still, sixteen frames add up to sixteen samples per pixel, which is real supersampling at the cost of a single trace per frame.",
    },
    {
      question: "Where does the warm glow inside the shadow come from?",
      answer: "The shadow test tracks three things separately on its way to the sun: the opaque cone and grounds, the coffee and the glass. Coffee does not block light outright, it lets through a dim amber, so the middle of the carafe's shadow on the stone is warm brown while the cone's shadow is a clean grey.",
    },
    {
      question: "How is the steam made?",
      answer: "Above the cone the shader walks eighteen steps through a column of moving three-dimensional noise, kept to thin curling ribbons and shifted sideways as it rises as if by a draught. Each step adds a little light, much more when you look toward the sun, so the wisps glow against the shaded wall.",
    },
    {
      question: "Will it hold its frame rate on an ordinary laptop?",
      answer: "The drawing buffer is held to about 1.1 million pixels and 1.5 device pixels per CSS pixel, the object is only marched inside a tight bounding cylinder, and if frames keep running long the buffer gives up resolution in steps. Nothing is drawn while the section is off screen or the tab is hidden.",
    },
    {
      question: "What shows when WebGL is missing?",
      answer: "A CSS version of the set: the shaded wall and the stone, a white cone above a glass pot holding dark coffee, and a soft shadow across the counter. All the text and both links are ordinary HTML, so they read the same either way.",
    },
  ],
  related: [
    "ray-marched-frosted-glass-serum-dropper-hero-standing-in-shallow-water-on-pale-stone-with-caustics-and-pointer-ripples",
    "ray-marched-white-plaster-architecture-model-hero-with-stairs-arches-and-a-courtyard-where-a-low-sun-follows-the-pointer",
    "nitro-cold-brew-tumbler-loader-that-pours-cascades-and-settles-under-a-cream-head",
  ],
  tags: ["hero", "webgl", "ray marching", "shader", "coffee", "ceramic", "glass", "steam", "product"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
