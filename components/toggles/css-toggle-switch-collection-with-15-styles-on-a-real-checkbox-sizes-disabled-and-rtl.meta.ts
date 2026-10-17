const meta = {
  slug: "css-toggle-switch-collection-with-15-styles-on-a-real-checkbox-sizes-disabled-and-rtl",
  category: "toggles",
  name: "CSS Toggle Switch Collection with 15 Styles on a Real Checkbox, Sizes, Disabled and RTL",
  keyword: "css toggle switch",
  title: "CSS Toggle Switch: 15 Accessible Styles to Copy | We.Inc",
  description: "Free CSS toggle switches in 15 styles, each a native checkbox with role=switch. Pick small, medium or large, try disabled and right to left, then copy the code.",
  intro: "Fifteen toggle switches made from HTML and CSS only, each built on a native checkbox with role=switch so it toggles with Space, submits with a form and is read out as a switch. The styles differ in construction: a thin track with an oversized thumb, words inside the track, a tick and cross in the thumb, a settings row with a hint, a two-option billing switch, a rocker with I and O marks, a fill that sweeps in behind the thumb and more. Controls above the grid set the size, show the disabled state and flip the direction to right to left, and the copied snippet includes whatever you chose. A second tab has a small React component styled with Tailwind. On phones the grid becomes a single column.",
  useWhen: [
    "A settings page has options that apply as soon as they change, such as notifications, privacy or theme, and each needs an on and off control.",
    "You want a toggle in a plain HTML page or CMS template with no script and no component library.",
    "Your interface ships in Arabic, Hebrew or another right-to-left language and the thumb has to travel the other way without a second stylesheet.",
    "A pricing section needs a monthly and yearly choice where both options stay visible next to the control.",
    "You are building a React app with Tailwind and want a typed switch with three sizes and a change callback.",
  ],
  customize: [
    "Change the on colour in the rule that ends `:checked + .switch-classic__track`, for example `background: #15803d`; the off colour is the `background` on `__track` itself.",
    "Resize a switch by changing the pixel value in `font: 500 16px/1.3` on the root. Every length inside is in em, so the track, thumb and travel scale together.",
    "If you change the track width or thumb size, update the travel in `translateX(calc(1.25em * var(--dir)))`. It equals track width minus thumb width minus both side gaps.",
    "For the React switch, add a size to `SW_SIZES` with matching `track`, `thumb` and `on` classes, keeping the translate equal to track width minus thumb minus 4px of padding.",
  ],
  accessibility: [
    "The input stays in the page, visually hidden but focusable, so keyboard and screen reader behaviour comes from the browser. Do not replace it with a div or span with a click handler.",
    "The focus outline is drawn on the track through `:focus-visible + .__track`; keep a visible ring if you restyle it, because the real input is invisible.",
    "Text inside the track and the icons in the thumb sit in an aria-hidden element, so they are decoration; the label text is what names the switch. The two-option switch uses aria-label=\"Yearly billing\", which includes its visible word.",
    "Several off tracks are a mid grey on white. If your page background is darker or the switch is small, check that the track still stands out at 3 to 1 against its surroundings.",
  ],
  faqs: [
    {
      question: "Should a toggle switch be a checkbox or a button?",
      answer: "Both can be correct. A checkbox with role=switch keeps form submission and native keyboard handling for free, which suits CSS-only snippets. A button with role=switch and aria-checked works too but needs script to flip the state. This collection uses the checkbox.",
    },
    {
      question: "How do I make a toggle switch with only CSS?",
      answer: "Hide the checkbox visually, draw a track and thumb as spans after it, and use `input:checked + .track` to recolour the track and move the thumb with a transform. Wrap everything in a label so clicking the text toggles the input.",
    },
    {
      question: "Do I need aria-checked on a checkbox switch?",
      answer: "No. The native checked state is exposed to assistive technology already, and adding aria-checked to an input of type checkbox is discouraged by the ARIA in HTML rules because the two can disagree.",
    },
    {
      question: "How do I read the switch value when a form submits?",
      answer: "Give the input a name and, if you like, a value. When it is on the form sends name=value (or name=on by default); when it is off nothing is sent for it, the same as any checkbox.",
    },
    {
      question: "Why does the thumb move the wrong way in Arabic or Hebrew?",
      answer: "A plain translateX always moves to the right. These snippets multiply the distance by a --dir property that becomes -1 under dir=\"rtl\" and place the thumb with inset-inline-start, so it starts and ends on the correct sides.",
    },
  ],
  related: [
    "dark-mode-toggle-switch-in-react-and-tailwind-with-system-setting-and-four-styles",
    "html-form-examples-collection-with-every-input-type-and-copyable-html-css-or-tailwind",
    "css-hamburger-menu-collection-with-12-animated-icons-and-accessible-mobile-nav",
  ],
  tags: ["css toggle switch", "toggle button html css", "role switch checkbox", "accessible toggle switch", "rtl toggle switch", "react switch tailwind", "pure css switch"],
  height: 1220,
  section: true,
  interactive: true,
};

export default meta;
