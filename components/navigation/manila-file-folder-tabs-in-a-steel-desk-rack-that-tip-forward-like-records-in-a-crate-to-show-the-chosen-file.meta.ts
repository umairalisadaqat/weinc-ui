const meta = {
  slug: "manila-file-folder-tabs-in-a-steel-desk-rack-that-tip-forward-like-records-in-a-crate-to-show-the-chosen-file",
  category: "navigation",
  name: "Manila File Folder Tabs in a Steel Desk Rack That Tip Forward like Records in a Crate to Show the Chosen File",
  keyword: "folder tabs react 3d",
  title: "React 3D Folder Tabs in a Steel Desk Rack | We.Inc",
  description: "Folder tabs in 3D: manila folders stand in a steel rack and tip forward like records in a crate to show the file you picked. Free React and HTML to copy.",
  intro: "Five manila folders standing in a brushed steel desk rack, drawn in true perspective from above the desk. Each folder has a cut tab at a different place along its top edge with a typed white label and a colour stripe. The folder you choose stands facing you with a typed sheet clipped to its front: a file number, a title, two ruled lines of details, a paragraph of notes and a colour print held on with a paperclip. The folders in front of it lie tipped forward on the desk in a small pile, backs up, with their tabs pointing at you so you can still read and press them; the ones behind show only their tabs over its top edge. Pick another and the folders in between fall or stand up one after another, each landing with a small hop. On a phone the folders are redrawn narrow and tall, and the print floats in the corner of the sheet with the words running round it.",
  useWhen: [
    "A studio, agency or archive wants its projects presented as files you flip through instead of a row of pills.",
    "There are four to six items and each has one strong portrait photograph plus a few lines of facts.",
    "The page needs one object that visitors want to play with, on a dark stage, without a headline wrapped round it.",
    "The order matters and you like that earlier files stay visible on the pile after the reader has passed them.",
  ],
  customize: [
    "`files` holds one folder each: `tab` is the label and the title, `band` the colour stripe and rule, `ref` the file number, `set` and `light` the two detail lines, then `notes`, `photo` and `alt`.",
    "`WIDE` and `SLIM` are the two sets of measurements. `fw` and `fh` size a folder, `tabW` and `tabH` its tab, and `photoW` and `photoH` the clipped print.",
    "`PITCH` is how steeply the camera looks down. Lower it towards `18` for a flatter, more frontal view; the stage height follows by itself.",
    "The card stock is the `MANILA` constant (`#e6c98f`) and the stage is `bg-[#1a2230]` with the radial gradient beside it. The rack colour is `#aab1b7` in `steel`.",
    "`GAP` spaces the folders from front to back, and `fall` is the easing of a folder dropping on the pile. Change `0.035` in it to `0` for a landing with no hop.",
  ],
  accessibility: [
    "Each folder has one real button over its tab with `role=\"tab\"`, `aria-selected` and `aria-controls`, and it tips over with the folder, so the same element works from both sides. A `role=\"tablist\"` element collects the five with `aria-owns`.",
    "Left and right arrows move through the files and wrap round, Home and End jump to the ends, and only the chosen tab takes part in the page's tab order.",
    "The sheet on each folder is a `role=\"tabpanel\"` labelled by its tab, with the notes as text and the print as an image with alt text. Sheets that are face down or covered are `aria-hidden`.",
    "Keyboard focus is drawn as a ring round the white label on whichever face of the folder is showing. With reduced motion folders change position without falling, and the rack stops flipping by itself.",
  ],
  faqs: [
    {
      question: "Is this real 3D or a drawing of it?",
      answer: "It is CSS 3D. One wrapper sets `perspective` and tilts the whole scene by `PITCH` degrees, and each folder is a flat element hinged on its bottom edge with `rotateX`. The browser works out the foreshortening, which is why the pile lying on the desk and the folder standing up agree with each other.",
    },
    {
      question: "Why can I still read the labels on folders that are lying face down?",
      answer: "Every folder has a second face with `backface-visibility: hidden`, turned over in advance, that carries the same label again along with a printed loan slip and a stamp. A real folder would show that label upside down from where you sit; here it is turned to read the right way, because being able to read the tab matters more.",
    },
    {
      question: "How do I change how many folders there are?",
      answer: "Add or remove entries in `files`. The tabs spread themselves evenly across the width and the rack grows deeper by `GAP` for each folder. Past six, shorten the labels or reduce `tabW`, since the tabs begin to overlap on a phone.",
    },
    {
      question: "The print covers part of the sheet. How much text fits beside it?",
      answer: "On the wide layout the words have a column about 310 pixels across, enough for thirty to thirty five words of notes at the given size. On a phone the notes run under the print at full width. Raise `fh` for longer notes.",
    },
    {
      question: "Can I turn off the automatic flipping?",
      answer: "Yes, remove the effect that sets the interval. Left in, it advances every 3.4 seconds until the first press or key, and it holds while the pointer rests on the rack.",
    },
  ],
  related: ["ring-binder-tabs-with-coloured-index-dividers-that-turn-over-chrome-rings-to-open-each-section", "pull-down-wall-chart-tabs-on-spring-rollers-that-snap-up-to-uncover-the-chart-hanging-behind"],
  tags: ["tabs", "folder tabs", "manila folder", "3d", "perspective", "skeuomorphic"],
  height: 783,
  section: true,
  interactive: true,
};

export default meta;
