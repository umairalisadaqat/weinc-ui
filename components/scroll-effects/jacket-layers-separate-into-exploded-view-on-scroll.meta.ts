export default {
  "slug": "jacket-layers-separate-into-exploded-view-on-scroll",
  "category": "scroll-effects",
  "name": "Jacket Layers Separate On Scroll",
  "keyword": "exploded view scroll animation",
  "title": "",
  "description": "",
  "intro": "An outdoor brand explains a three-layer jacket fabric with an exploded diagram that stays pinned. The layers start pressed together, pull apart when the story begins, and each step lifts one into full strength with its name tag. Suits technical products, mattresses, packaging and anything whose value sits in layers people never see.",
  "useWhen": [
    "A product built from layers or parts whose order matters, explained from outside to inside."
  ],
  "customize": [
    "Spread the layers further or closer with the `24cqmin` translate values on `.w1lyr-p-face` and `.w1lyr-p-lin`.",
    "Change the plate angle with `rotateX(58deg) rotateZ(-45deg)` on `.w1lyr-plate`.",
    "Add a layer by adding a `.w1lyr-pl` block, giving it a translate and a matching step."
  ],
  "accessibility": [
    "The diagram is described once in text, and each layer is named again as a step heading."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "scrollytelling",
    "exploded view",
    "css 3d",
    "product layers",
    "sticky scroll"
  ],
  "height": 640,
  "section": true,
  "collection": "scrollytelling",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "The three layers stay pulled apart at full strength with their names showing, beside the steps as a plain list.",
  "perf": "Three flat plates move with translate and fade with opacity; the tilt is a fixed transform that never changes."
} satisfies UiMeta;
