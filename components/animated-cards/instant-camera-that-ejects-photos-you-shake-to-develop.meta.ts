const meta = {
  slug: "instant-camera-that-ejects-photos-you-shake-to-develop",
  category: "animated-cards",
  name: "Instant Camera That Ejects Photos You Shake to Develop",
  keyword: "react instant photo card animation",
  title: "React Instant Photo Cards You Shake to Develop | We.Inc",
  description: "Press the shutter and a photo feeds out of the camera, lands on the table and develops while you drag and shake it. Free React and Tailwind code, or HTML.",
  intro: "A cream instant camera drawn in gradients sits over a dark table. Press its red shutter and the frame flashes, a white-bordered print feeds out of the slot in three pulls, then falls to a free place on the table with a springy landing. The print starts as a milky grey square and its picture slowly gains contrast and colour. Pick any print up and it trails your pointer, tilts with the direction of travel and develops faster the harder you shake it. Four prints stay on the table and the oldest slides away when a fifth arrives. On phones the prints shrink a little and overlap in a loose pile.",
  useWhen: [
    "A photographer, photo booth or event page that wants its gallery to feel handled, not gridded.",
    "A memories or year-in-review section where each press brings out one more picture.",
    "The empty state of an upload screen, with the shutter standing in for the add button.",
    "A playful about page where team portraits land on the table one by one.",
  ],
  customize: [
    "Swap the pictures and pencilled captions in the `photos` array. Square crops work best because the window is square.",
    "Resting places are in `spots`: `kx` is the sideways position in units of the spread, `y` is pixels from the top and `r` is the tilt.",
    "`DEVELOP_SECONDS` sets how long an untouched print takes. The shake bonus is the `b.energy * 2.4` factor in the step function.",
    "Print size is `PHOTO_W` and `PHOTO_H`, and the undeveloped colour is the grey-green gradient on the veil layer.",
    "The camera body is the cream gradient starting `#f6f1e6` and the two bands under the lens are `#e4572e` and `#f2a541`.",
  ],
  accessibility: [
    "The shutter is a real button labelled Take a photo, so the whole piece can be driven with Tab and Enter.",
    "Every print carries the alt text of its picture, and a polite live region announces what was just shot.",
    "With reduced motion on there is no flash, no feed and no automatic shooting: a press places a finished print straight on the table.",
  ],
  faqs: [
    { question: "How is the developing effect done?", answer: "Two things change together as a number runs from 0 to 1. A grey-green layer over the picture fades out, and a CSS filter on the image moves from low contrast, no saturation and a warm sepia cast to none. Once it reaches 1 the filter is removed completely." },
    { question: "How does shaking speed it up?", answer: "While a print is held it follows the pointer on a spring, so it has a real velocity. That speed feeds a short-lived energy value, and the developing rate is multiplied by it. Holding the print still gives no bonus." },
    { question: "Why does the print appear to come out of the slot?", answer: "During the feed the print is clipped with `clip-path` at the height of the slot, so only the part below the slot line is drawn. The clip is removed as soon as it is fully out and starts to fall." },
    { question: "Can I stop the camera firing by itself?", answer: "The automatic shots come from one timeout and one interval in the mount effect. Remove them and the camera only fires on a press. As written it also holds off for nine seconds after any touch." },
    { question: "Can the prints link somewhere?", answer: "Yes, but keep dragging and clicking apart: record whether the pointer moved between down and up, and only follow the link when it did not." },
    { question: "Does the flash cause problems for sensitive visitors?", answer: "It is one soft fade lasting about half a second per shot, and shots are at least 1.25 seconds apart. It is skipped entirely when the visitor asks for reduced motion." },
  ],
  related: ["tear-off-desk-calendar-with-pages-that-peel-curl-and-flutter-away", "leather-luggage-tag-on-a-buckled-strap-with-rope-physics-you-can-drag-and-fling", "matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches"],
  tags: ["instant photo", "camera", "drag", "spring physics", "develop", "gallery"],
  height: 700,
  section: true,
  interactive: true,
};

export default meta;
