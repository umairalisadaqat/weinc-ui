const meta = {
  "slug": "empty-inbox-state-with-tray-and-paper-plane-drawing",
  "category": "motion-graphics",
  "name": "Empty Inbox State with Tray and Paper Plane",
  "keyword": "empty state illustration",
  "title": "",
  "description": "",
  "intro": "An empty inbox inside a small mail app. The open tray is drawn first, then a looping flight trail and a paper plane leaving it, while the heading, sentence and two actions sit still beside the drawing. On phones the folder list becomes a row above the message pane.",
  "useWhen": [
    "The first view of a messages, support or notifications area before anything has arrived, where a blank list would look broken."
  ],
  "customize": [
    "Change the line colour with `--m4inb-pen` and the plane and button colour with `--m4inb-accent`.",
    "Rewrite the heading and sentence in `.m4inb-h` and `.m4inb-p` to say what will appear in this list."
  ],
  "accessibility": [
    "The drawing is hidden from screen readers; the state is told by the real heading, the message count and the sentence.",
    "The current folder carries `aria-current=\"page\"` in a labelled `nav`."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "empty state",
    "empty inbox",
    "svg illustration",
    "line drawing"
  ],
  "height": 560,
  "collection": "svg-line-drawing-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The tray and paper plane are drawn and still next to the text.",
  "perf": "Eight small strokes repaint for about 1.4 seconds when the pane first shows, then nothing runs."
} satisfies UiMeta;

export default meta;
