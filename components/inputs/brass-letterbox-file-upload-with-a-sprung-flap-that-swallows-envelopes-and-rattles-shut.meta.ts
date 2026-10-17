const meta = {
  slug: "brass-letterbox-file-upload-with-a-sprung-flap-that-swallows-envelopes-and-rattles-shut",
  category: "inputs",
  name: "Brass Letterbox File Upload with a Sprung Flap That Swallows Envelopes and Rattles Shut",
  keyword: "react file upload dropzone",
  title: "React File Upload Dropzone as a Brass Letterbox | We.Inc",
  description: "File upload drawn as a brass letterbox on a painted door: drop a file and an envelope goes through the flap, which clacks shut. Free React and HTML code.",
  intro: "A file upload that looks like the front door. A polished brass letter plate sits on dark green gloss paint, with two slotted screws, a hinge barrel and the word LETTERS cast into the flap. Choose a file, or drag one over the door, and the flap is pushed inwards so you can see the draught bristles in the slot. An envelope with the file name typed on its label is laid in the opening, pushed halfway, then let go to drop through. With nothing holding it the spring throws the flap shut and it bounces against the frame two or three times before it rests. Only then does the file appear in the delivered list under the plate. Reflections on the brass follow the pointer from side to side. On phones the plate is drawn at about two thirds of its desktop size, which still fills the screen from edge to edge, and the list sits beneath it.",
  useWhen: [
    "A tenant, client or applicant has to send documents and the upload step deserves more warmth than a dashed rectangle.",
    "A property, lettings or home services site wants its contact form to end on an object from the trade.",
    "A support page asks for a screenshot or an invoice and you want the hand-off to feel finished when the file has gone.",
    "A landing page needs one playful object that also does a real job.",
  ],
  customize: [
    "`plate.word` is the text cast into the flap. Seven letters fit at the default size. For a longer word lower the `22 * S` in the font line of `paintFixed`.",
    "`plate.hint` and `plate.rule` are the two lines under the plate. The file input has no `accept` attribute, so add one to match whatever the rule says.",
    "The door colour is `#12382c` on the root plus the three greens in the radial gradient beneath it. Swap them for `#16233f`, `#22355c` and `#0d1730` for a navy door.",
    "The metal is the list of colour stops in the `brass` function. Replace the yellows with greys from `#f4f6f8` down to `#4a4f57` for chrome.",
    "`TRAVEL` is how many seconds an envelope takes to go through. The rattle is the `0.46` bounce factor in the frame loop: 0.2 gives one dull clack, 0.6 a long chatter.",
  ],
  accessibility: [
    "The control is a native `input type=\"file\"` with a `label` that wraps the drawing, so Tab reaches it, Enter or Space opens the picker and a gold ring shows focus round the plate.",
    "The canvas is hidden from assistive technology. The label text, the delivered list and a polite live message that names each file carry the meaning.",
    "Dropping is an extra. Every file that can be dragged in can also be chosen through the picker.",
    "With reduced motion nothing swings: the flap is shown ajar with one envelope in the slot, and chosen files go straight into the list.",
  ],
  faqs: [
    {
      question: "Where do the files go?",
      answer: "Nowhere yet. The `take` function receives the `FileList` from the picker or the drop and only records names and sizes. Send each `File` to your own endpoint there, with `fetch` and a `FormData`, and call `api.current.post` when you want the envelope to go through.",
    },
    {
      question: "Can the envelope wait for a real upload to finish?",
      answer: "Yes. The push is a function of time called `pushed`, which pauses for a moment at the halfway point. Feed it your upload progress in place of the clock and the envelope will stay half in the slot until the request completes.",
    },
    {
      question: "How is the envelope drawn in perspective on a flat canvas?",
      answer: "Each envelope is painted once, flat, on its own small canvas. Every frame the part that is still outside the door is copied in strips two pixels tall, and each strip is drawn slightly wider than the one above it. That makes a trapezium that reads as paper lying flat and pointing into the slot.",
    },
    {
      question: "Why does the flap bounce when it closes?",
      answer: "The flap angle is a spring with very little damping. A real flap cannot swing out past the frame, so when the angle reaches zero its speed is reversed and roughly halved. That repeats until the speed is too small to see.",
    },
    {
      question: "Does it limit file size or type?",
      answer: "Not by itself. The line under the plate is only text. Check `file.size` and `file.type` inside `take`, and skip or report anything you do not accept before it is posted.",
    },
  ],
  related: ["signature-pad-on-cotton-paper-with-a-fountain-pen-that-leaves-wet-ink-which-dries", "coloured-pencil-roll-colour-picker-where-the-chosen-pencil-slides-out-of-its-canvas-pocket-and-scribbles-a-swatch", "four-wheel-brass-combination-cable-lock-code-input-with-rings-that-click-round-and-a-cable-that-springs-free"],
  tags: ["file upload", "dropzone", "brass", "letterbox", "canvas", "spring", "skeuomorphic"],
  height: 740,
  interactive: true,
};

export default meta;
