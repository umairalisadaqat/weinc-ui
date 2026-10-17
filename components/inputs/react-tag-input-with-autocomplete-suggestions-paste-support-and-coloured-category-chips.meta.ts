const meta = {
  slug: "react-tag-input-with-autocomplete-suggestions-paste-support-and-coloured-category-chips",
  category: "inputs",
  name: "React Tag Input with Autocomplete Suggestions, Paste Support and Coloured Category Chips",
  keyword: "react tag input",
  title: "React Tag Input with Suggestions and Tailwind | We.Inc",
  description: "Free React tag input in Tailwind: Enter or comma adds, Backspace removes, paste a list, keyboard suggestions, max count and no duplicates. Copy and paste.",
  intro: "A tag input lets people build a short list of words inside one field: skills on a profile, labels on an issue, the stack of a project. This one is a single React component with no extra libraries, shown in three versions. The plain field takes free text. The second offers a filtered suggestion list you can walk with the arrow keys. The third colours each chip by the group it belongs to and turns unknown words into grey custom labels. Every version adds a tag on Enter or comma, removes the last one on Backspace when the text box is empty, splits a pasted list on commas, semicolons or new lines, refuses duplicates without regard to case, and stops at a maximum count shown in the corner. Chips spring in and out and wrap onto new lines, so the field grows with its content and still fits a 360 pixel phone screen.",
  useWhen: [
    "A profile or job form asks for skills, interests or languages and a fixed checkbox list would be too long.",
    "An issue tracker, CMS or file manager needs labels that come from a known set but may also be invented on the spot.",
    "A search or filter bar should hold several terms at once, each removable with one click.",
    "An invite or share form takes a handful of names or addresses, often pasted from a spreadsheet.",
  ],
  customize: [
    "Change the suggestion lists in `SKILLS` and `LABELS` at the top of the file. Each item is `{ value, category }`, and `category` is optional.",
    "Add or recolour groups in `CATEGORIES`. Each one holds a chip class such as `bg-sky-50 text-sky-800 ring-sky-200` and a dot class such as `bg-sky-500`.",
    "Set the limit per field with the `max` prop. The counter turns `text-rose-600` and says Limit reached once the field is full.",
    "Change what splits typed or pasted text by editing the `SPLIT` pattern. Remove `;` from it if your tags may contain semicolons.",
    "The plain chip style is `bg-slate-900 text-white` inside `chipClass`. Swap it for `bg-indigo-600` or a soft `bg-slate-100 text-slate-800` for a lighter look.",
  ],
  accessibility: [
    "The text box has a real label, and its hint text is linked through `aria-describedby`. When suggestions are on, it is a `combobox` that points at the open `listbox` and at the highlighted option with `aria-activedescendant`, so screen readers follow the arrow keys.",
    "Each chip has its own remove button named, for example, Remove Figma. Additions, removals, duplicates and the limit are announced through a polite live region.",
    "Focus stays in the text box after a tag is removed, so a keyboard user can keep typing. With reduced motion, chips appear and disappear without the spring and the duplicate shake.",
  ],
  faqs: [
    {
      question: "How do I read the tags in my form?",
      answer: "The list lives in the `tags` state inside `TagInput`. Lift it up by adding `value` and `onChange` props, or render a hidden input per tag, for example `<input type=\"hidden\" name=\"skills\" value={t.value} />`, so a normal form post sends them.",
    },
    {
      question: "Can I limit tags to the suggestion list only?",
      answer: "Yes. In `add`, return false when the typed text does not match an item in `suggestions`, and show a message such as Pick a label from the list. The paste path in `addMany` needs the same check.",
    },
    {
      question: "Why does Backspace only remove a tag when the box is empty?",
      answer: "So that people can still correct a word they are typing. Once the text is gone, the next Backspace takes the last chip off, which is the behaviour people expect from email clients.",
    },
    {
      question: "Are duplicates compared with case?",
      answer: "No. React and react count as the same tag. The chip already in the field shakes and a short red line says it is there. Change the `toLowerCase` comparisons in `has` if your tags are case sensitive.",
    },
    {
      question: "How do I load suggestions from a server?",
      answer: "Replace the `matches` memo with state filled by a debounced fetch on `query`. Keep the list short, six or so, and keep the same option ids so keyboard navigation keeps working.",
    },
  ],
  related: [
    "paper-coffee-cup-name-field-where-a-marker-writes-what-you-type-round-the-cup",
    "wooden-type-verification-code-input-where-number-blocks-drop-into-a-brass-composing-stick-and-a-wedge-locks-the-line",
  ],
  tags: ["tag input", "chips", "autocomplete", "combobox", "multi select", "react", "tailwind", "form"],
  height: 900,
  interactive: true,
};

export default meta;
