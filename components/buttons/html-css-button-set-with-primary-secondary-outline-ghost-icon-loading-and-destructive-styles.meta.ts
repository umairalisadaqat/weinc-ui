const meta = {
  slug: "html-css-button-set-with-primary-secondary-outline-ghost-icon-loading-and-destructive-styles",
  category: "buttons",
  name: "HTML CSS Button Set with Primary, Secondary, Outline, Ghost, Icon, Loading and Destructive Styles",
  keyword: "html css button",
  title: "HTML CSS Button Set: Primary, Outline, Ghost, Loading | We.Inc",
  description: "Free HTML CSS button set: primary, secondary, outline, ghost, destructive, icon and loading buttons in three sizes, with hover, press, focus and disabled states.",
  intro: "This is a complete HTML CSS button kit you can drop into a product. Five styles (primary, secondary, outline, ghost and destructive), three sizes, buttons with leading and trailing icons, square icon-only buttons, a working loading button and disabled versions. Every button reacts the same way: a darker fill on hover, a one pixel sink and slight shrink when pressed, and a two pixel focus ring that only appears for keyboard users. On a phone the rows wrap onto new lines and every button stays at least 36 pixels tall.",
  useWhen: [
    "You are starting a design system and want one consistent set of buttons instead of a dozen one-off styles.",
    "A settings or editor screen needs a clear hierarchy: one primary action, a quieter secondary, and a red button for anything that deletes.",
    "A form submit takes a few seconds and the button should show it is working and block double clicks.",
    "A toolbar needs compact icon-only buttons that still have accessible names.",
  ],
  customize: [
    "Change the brand colour in the `primary` string: swap `bg-blue-600 hover:bg-blue-700 active:bg-blue-800` and `focus-visible:ring-blue-600` for your own three shades.",
    "Make the corners pill shaped by replacing `rounded-lg` in `base` with `rounded-full`, or square them with `rounded-md`.",
    "Adjust heights in the `sizes` object: `min-h-[36px]`, `min-h-[42px]` and `min-h-[50px]`. Keep the icon size width and height equal to the medium height so icon buttons line up with text buttons.",
    "For plain HTML, copy the class strings into a stylesheet with Tailwind, or write them as one `.btn` class plus `.btn-primary`, `.btn-outline` and so on, then use `<button class=\"btn btn-primary\">Save</button>`.",
    "Change how long the demo save takes by editing the `1800` timeout in `SaveButton`, or replace it with your real request.",
  ],
  accessibility: [
    "Every control is a native `button` with `type=\"button\"`, so Enter and Space work without extra script, and the three icon-only buttons carry an `aria-label` that says what they do.",
    "The save button sets `aria-busy` while working and announces \"Changes saved\" through a polite live region, so screen reader users hear the result.",
    "Disabled buttons use the real `disabled` attribute, which removes them from the tab order. Keep it rather than only greying them out.",
    "Pressing and hover transitions switch off under reduced motion, and the spinner stops turning.",
  ],
  faqs: [
    {
      question: "How do I use these buttons in plain HTML without React?",
      answer: "The React part is only a helper that joins class strings. In an HTML page that loads Tailwind, write `<button type=\"button\" class=\"...\">` and paste the `base` string followed by one variant string and one size string. The hover, active, focus and disabled styles are all in those classes, so no JavaScript is needed except for the loading behaviour.",
    },
    {
      question: "Can I write the same buttons in pure CSS?",
      answer: "Yes. Make a `.btn` rule with inline-flex, 8px radius, 600 weight and a short transition, then add `:hover`, `:active { transform: translateY(1px) scale(.98) }`, `:focus-visible { outline: 2px solid; outline-offset: 2px }` and `:disabled { opacity: .45; pointer-events: none }`. Each variant becomes its own class that only sets colours and borders.",
    },
    {
      question: "Why does the focus ring only show when I use the keyboard?",
      answer: "The ring uses `focus-visible`, which browsers apply after keyboard navigation but usually not after a mouse click. People who tab through the page always see where they are, while mouse users do not get a ring flashing after each click.",
    },
    {
      question: "How should a loading button behave?",
      answer: "Keep the button the same width so the layout does not jump (the demo sets `min-w-[148px]`), show a spinner next to a short label such as Saving, ignore further clicks until the request ends, and confirm the result. Put `aria-busy` on the button while it works.",
    },
    {
      question: "When should I use the ghost or outline style instead of secondary?",
      answer: "Secondary has a filled grey background and suits a second action next to a primary. Outline reads well on white cards and in forms. Ghost has no background until hover, which fits toolbars, table rows and menus where many buttons sit together.",
    },
    {
      question: "Should a link that looks like a button be an a or a button?",
      answer: "Use `a href` when it takes the visitor to another page and `button` when it does something on the current page. The classes work on both, so the look stays the same while the element matches what it does.",
    },
  ],
  related: [
    "neo-brutalist-button-set-with-sizes-and-icons",
    "glazed-celadon-ceramic-button-with-carved-lettering-that-rocks-under-the-finger",
    "thick-glass-pill-button-that-refracts-a-portrait-and-flattens-when-pressed",
  ],
  tags: ["button", "html css button", "loading button", "icon button", "outline button", "ghost button", "disabled state"],
  height: 660,
  interactive: true,
};

export default meta;
