const meta = {
  slug: "floppy-drive-save-indicator-with-a-disk-that-slides-in-a-flickering-busy-lamp-and-a-spring-eject",
  category: "feedback",
  name: "Floppy Drive Save Indicator with a Disk That Slides In, a Flickering Busy Lamp and a Spring Eject",
  keyword: "save indicator animation react",
  title: "React Save Indicator Animation: Floppy Drive | We.Inc",
  description: "Save indicator on a canvas: a disk is pushed into a drive, a lamp flickers while it writes, then the disk springs back out. Free React and HTML to copy.",
  intro: "A save state shown as a small external disk drive seen from above and in front. An orange three and a half inch disk with a hand-lettered paper label rests a little under a third of the way into the slot. Press Save changes, or push the disk itself, and it slides in until only its front edge shows. The eject button pops out of the face, and the green lamp on the left flickers in uneven bursts while the disk shivers slightly. When the write is over the button dips, the disk is thrown back out on a spring and rocks to a stop. A status line underneath reads Unsaved changes, Writing to disk or All changes saved. The piece is 330 pixels wide on phones and the button under it is 44 pixels tall.",
  useWhen: [
    "A document, form builder or settings page saves on demand and wants the wait to be something worth watching for two seconds.",
    "An autosave product needs one honest signal that work has gone from edited to stored.",
    "A retro computing shop, museum page or emulator front end wants its save step to match the period.",
    "An onboarding screen has to teach people that saving is manual here, and a toast would be missed.",
  ],
  customize: [
    "`DISK` and `CASE` are the plastic colours as three numbers each. `[38, 92, 190]` makes a blue disk, and `[214, 204, 176]` turns the drive beige.",
    "`file.label` holds the two lines written on the paper label, and `file.maker` and `file.model` are the name moulded into the badge.",
    "`WRITE_SECONDS` is how long the lamp runs. If you are waiting on a real request, call the eject from your own promise instead of from the clock check in `step`.",
    "`OUT` is how far in the disk rests when idle, from 0 to 1. Lower it to 0.2 to show more of the shutter, or raise it to 0.5 for a tighter picture.",
    "The eject bounce is the pair `130` and `9.5` in `step`. Raise the second number towards 22 and the disk slides out and stops with no rocking.",
  ],
  accessibility: [
    "The only stop in the tab order is the Save changes button under the drive. The disk is a second, labelled button for mouse and touch, kept out of the tab order so keyboard users do not land on the same action twice.",
    "The line of text under the button has `role=\"status\"`, so each change of state is read out without moving focus.",
    "While a write is running the button stays focusable and sets `aria-disabled`, which avoids focus being thrown to the page body the way a disabled attribute would.",
    "With reduced motion nothing slides: the picture switches to the seated disk with the lamp on, then back to the resting one.",
  ],
  faqs: [
    {
      question: "How do I tie the animation to a real save request?",
      answer: "Call `api.current.save()` when the request starts. To end on the response instead of a timer, replace the `s.clock > WRITE_SECONDS` test with a flag you set when your promise settles. Everything after that, the button dip and the spring out, follows by itself.",
    },
    {
      question: "What should happen if the save fails?",
      answer: "Keep the disk seated and stop the flicker with the lamp held on, then show your error in the status line. A simple way is a fourth phase that skips the eject branch. People read a disk that will not come out as a problem straight away.",
    },
    {
      question: "Why is the disk drawn only once?",
      answer: "The shell, shutter, label and lettering are painted to an offscreen canvas when the component mounts. Each frame copies that picture to its new position and clips it at the mouth of the slot. That keeps the per-frame work to one image copy, two shadows and the lamp.",
    },
    {
      question: "Is the lamp pattern random?",
      answer: "It is three sine waves of different speeds added together and cut off at a threshold. The result looks irregular, like a head seeking between tracks, but it is the same on every run and needs no random numbers during animation.",
    },
    {
      question: "Does the handwriting on the label need a font file?",
      answer: "No fonts are loaded. The label asks for a marker style face that ships with the operating system and falls back through a short list ending in the generic cursive family, so the lettering varies a little between Mac, Windows and Android.",
    },
  ],
  related: ["chrome-stomp-footswitch-toggle-with-jewel-lamp-on-a-powder-coated-pedal", "glass-rain-gauge-progress-meter-that-fills-drop-by-drop-with-a-meniscus-and-tips-out-when-full", "ink-drop-progress-indicator-that-blooms-through-a-glass-of-water-one-drop-per-step"],
  tags: ["save", "floppy", "disk", "drive", "status", "canvas", "retro", "skeuomorphic"],
  height: 800,
  interactive: true,
};

export default meta;
