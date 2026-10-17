const meta = {
  "slug": "footer-sign-off-logo-that-draws-on-entry",
  "category": "motion-graphics",
  "name": "Footer Sign-Off Logo That Draws on Entry",
  "keyword": "logo animation",
  "title": "",
  "description": "",
  "intro": "A closing sign-off for an outdoor shop's footer: when the footer reaches the screen, a brass circle draws, then the ridge line of two peaks, then a river stroke underneath, and the shop name slides in beside the mark. Below it sit real link columns, the street address and a legal line.",
  "useWhen": [
    "A footer on a long page where the logo drawing in gives the end of the page a small, deliberate moment."
  ],
  "customize": [
    "Change the line colour with `--m1ftr-stroke` and the footer background with `--m1ftr-bg`.",
    "Swap the three paths in the mark for your own line logo, each with `pathLength=\"1\"`, and adjust the delays on `.s2` and `.s3`."
  ],
  "accessibility": [
    "The mark is labelled with the shop name and the link columns sit in a labelled `nav`, with the address in an `address` element."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "footer logo animation",
    "line logo draw",
    "svg stroke",
    "site footer"
  ],
  "height": 360,
  "collection": "logo-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The drawn mark and the shop name are both shown finished in the footer from the start.",
  "perf": "Three thin strokes repaint as they draw on entry, about 1.3 seconds of work, then the footer stays static."
} satisfies UiMeta;

export default meta;
