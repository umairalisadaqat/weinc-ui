const meta = {
  slug: "react-tabs-as-card-stock-file-folders-in-a-sunlit-walnut-desk-file-where-the-chosen-folder-rises-with-its-page",
  category: "navigation",
  name: "React Tabs as Card Stock File Folders in a Sunlit Walnut Desk File Where the Chosen Folder Rises With Its Page",
  keyword: "react tabs",
  title: "Photoreal React Tabs: File Folders in a Desk File | We.Inc",
  description: "Free React tabs drawn as card stock file folders in a walnut desk file. Pick a tab and the file opens there, lifting that folder and its printed page.",
  intro: "Four card stock folders in manila, sage, slate blue and brick stand in a small walnut desk file on an oak desk, and late sun through a window lays a pool of light and two bar shadows across them. Each folder has a cut tab with a paper label typed with its name. Choose a tab and the file opens at that folder: it and every folder behind it slide up out of the box, so the chosen face shows above the folders in front with its heading and two lines printed on the card, while every other tab stays in view and clickable. The picture is one WebGL fragment shader that averages many jittered frames, so the soft shadows, the paper fibres and the gentle blur of the far desk settle into a clean still within about a second, then drawing stops. Underneath it is a proper tab list: four real tab buttons laid exactly over the drawn tabs, and one tab panel holding the same text for screen readers.",
  useWhen: [
    "A product page needs a handful of short detail sections (overview, materials, shipping, care) and you want the switcher itself to be the memorable part.",
    "A portfolio, studio or stationery brand where a physical, tactile index fits the voice better than an underline bar.",
    "You need a worked example of the WAI-ARIA tabs pattern (roving tabindex, arrows, Home and End) driving a WebGL scene.",
    "A landing page section with three to five sections of a sentence or two each.",
  ],
  customize: [
    "Edit the `folders` array at the top. `label` is typed on the tab and is the tab's accessible name; `title` and `lines` are printed on the folder face and are also the tab panel's text, so one edit changes both.",
    "Change the card colours in `STOCK` inside the shader (linear colour, keep them muted) and the matching `stocks` hex list used by the no-WebGL fallback.",
    "`LIFT` sets how far the chosen folder rises, in centimetres. The spring passed to `springStep` (160 and 22) sets how heavy the card feels as it slides.",
    "Move the sun with `KEY_DIR` and `WIN_OFF` in the rig settings, and its strength with `KEY_COL`. The tab positions along the top edge are `TAB_X`.",
    "Set `DEMO` to `false` to stop the file opening at each folder in turn before anyone touches it.",
  ],
  accessibility: [
    "The tabs are native buttons with role tab inside a role tablist, with aria-selected, aria-controls and a roving tabindex, so only the chosen tab is in the Tab order.",
    "Left and Right arrows move to the previous and next tab and wrap around, Home and End jump to the first and last; the selection follows focus. The panel is a focusable role tabpanel labelled by its tab, and its text is announced when it changes.",
    "With reduced motion the folders switch position without sliding and the demo never runs. Without WebGL 2 the same tablist and panel render as plain coloured tabs and a card with visible text.",
  ],
  faqs: [
    { question: "How do I build accessible tabs in React?", answer: "Give the wrapper role tablist, each button role tab with aria-selected and aria-controls, and the content role tabpanel with aria-labelledby pointing back at its tab. Only the selected tab gets tabIndex 0; the rest get -1, and an onKeyDown handler moves focus with the arrow keys, Home and End. This component does exactly that in about twenty lines you can lift out." },
    { question: "Why does the chosen folder lift the ones behind it too?", answer: "If only the chosen folder rose, a front folder would cover every tab behind it and you could no longer see or click them. Opening the file at a point, the way you would part real folders, keeps the chosen page in front and every other label visible." },
    { question: "Is the panel text real text or part of the picture?", answer: "Both. The words are printed onto the folder in the shader so they sit on the card in the same light, and the identical text lives in the HTML tab panel over it, so screen readers, search and translation tools read it normally. Edit the folders array and both update." },
    { question: "Can I use more than four tabs?", answer: "The scene is built for four folders, which suits short detail sections. For five, add an entry to folders, a fifth position to TAB_X and STOCK, change the 4 in the shader loops and texture maths to 5, and narrow TW so the tabs fit along the top edge." },
    { question: "Will the WebGL slow my page down?", answer: "The canvas is capped at about 2.2 million pixels, pauses off screen and in hidden tabs, drops its resolution if a frame runs long while a folder moves, and stops drawing completely once the picture has settled." },
  ],
  related: [
    "glazed-ceramic-tile-tabs-in-webgl-leaning-on-a-sunlit-plaster-shelf-where-the-chosen-tile-rocks-upright-into-the-window-light",
    "manila-file-folder-tabs-in-a-steel-desk-rack-that-tip-forward-like-records-in-a-crate-to-show-the-chosen-file",
    "react-tabs-with-sliding-underline-segmented-pills-vertical-and-icon-count-variants",
  ],
  tags: ["tabs", "navigation", "webgl", "3d", "photoreal", "paper", "wood", "accessibility"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
