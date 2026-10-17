const meta = {
  "slug": "photo-zooms-out-as-it-scrolls-in",
  "category": "scroll-effects",
  "name": "Photo Zooms Out as It Scrolls In",
  "keyword": "scroll zoom image",
  "title": "",
  "description": "",
  "intro": "A pottery studio section where one wide photograph starts slightly enlarged inside its rounded frame and eases back to its natural size as it travels up into view, with the caption settling underneath. The frame never changes size, only the picture inside it, so the text around it stays still while the image breathes.",
  "useWhen": [
    "A single hero photograph in the middle of a story, where the picture deserves a slow, cinematic moment."
  ],
  "customize": [
    "Set `--w1zom-from` to choose the starting zoom (and `FROM` in the fallback script to match).",
    "Change `animation-range: entry 0% cover 55%` on `.w1zom-img` so the zoom ends sooner or later.",
    "Move `transform-origin` on `.w1zom-img` toward the part of the photo that matters."
  ],
  "accessibility": [
    "The photo keeps a full alt text and a visible caption, and the scrolling box is focusable with a label."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "scroll zoom image",
    "image scale on scroll",
    "animation-timeline view",
    "photo reveal"
  ],
  "height": 620,
  "section": true,
  "collection": "scroll-animation",
  "tech": "css",
  "support": "Chrome, Edge and Safari 26+; script fallback elsewhere",
  "reducedMotion": "The photo sits at its natural size with the caption visible, and the demo scroll stays off.",
  "perf": "One scaled image layer and a caption fade; the fallback reads two rectangles per frame only while scrolling."
};

export default meta;
