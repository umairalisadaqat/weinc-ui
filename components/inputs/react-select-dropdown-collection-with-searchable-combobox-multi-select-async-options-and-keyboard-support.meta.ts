const meta = {
  slug: "react-select-dropdown-collection-with-searchable-combobox-multi-select-async-options-and-keyboard-support",
  category: "inputs",
  name: "React Select Dropdown Collection with Searchable Combobox, Multi Select, Async Options and Keyboard Support",
  keyword: "react select",
  title: "React Select and Searchable Dropdown: 6 Components | We.Inc",
  description: "Free React select components with Tailwind and no package: searchable combobox, multi-select, chips, async options and grouped lists with full keyboard support.",
  intro: "Six select components for React written from scratch, each in one file you can paste into a project. A select-only dropdown replaces the native select with type-ahead and coloured status dots. A searchable combobox filters a list of teammates. An async field waits for a pause in typing, cancels the previous request and reports how many results came back. A grouped list shows time zones under labelled headings. Two multi-selects cover the common shapes: a checkmark list that stays open while you toggle, and a chip field limited to known options. All six keep focus on the field and move a highlight with aria-activedescendant, close on Escape or an outside click, and fit a 360px screen with 40px rows.",
  useWhen: [
    "You want a styled select in React without adding a dependency, and need keyboard and screen reader behaviour to match the native control.",
    "A long list such as people, products or cities needs a search box that filters as the user types.",
    "Options come from an API and you need debounce, cancellation and a loading state.",
    "Users must pick several values from a fixed list, either as a summary field or as removable chips.",
    "Options fall into categories, such as time zones by region, and headings make the list easier to scan.",
  ],
  customize: [
    "Replace the data arrays at the top (STATUSES, PEOPLE, TEAMS, TOOLS, GROUPS) with your own; the components only read label strings and ids.",
    "Change the highlight colour from bg-sky-50 and the focus ring from ring-sky-600 to match your brand.",
    "In the async piece, swap the body of searchCities for your request and pass it the AbortSignal so stale responses are dropped. Adjust the 250ms debounce in the effect.",
    "Make lists taller or shorter with max-h-52 or max-h-56 on the listbox; the highlighted option scrolls into view inside the list.",
  ],
  accessibility: [
    "Each field has role=combobox with aria-expanded, aria-controls and aria-activedescendant, and each popup is a role=listbox with role=option rows carrying aria-selected.",
    "The editable fields add aria-autocomplete=list, the multi-select list sets aria-multiselectable, and grouped options sit in role=group lists labelled by their heading.",
    "Result counts and loading in the async field are announced through a role=status line linked with aria-describedby. Chip remove buttons are named, for example 'Remove Figma'.",
    "Search inputs use a 16px font on phones, which prevents iOS from zooming in when the field gets focus.",
  ],
  faqs: [
    {
      question: "Do I need react-select or a headless UI library for this?",
      answer: "Not for these cases. A combobox is mostly state for open, query and highlighted index plus a key handler. Libraries help when you need virtualised lists of thousands of options, creatable options with complex validation or extensive theming, but a single file is easier to read and adjust for most forms.",
    },
    {
      question: "Why does focus stay on the input instead of moving into the list?",
      answer: "The combobox pattern keeps DOM focus on the field so the user can keep typing, and uses aria-activedescendant to point at the highlighted option's id. Screen readers announce that option as if it were focused. This is why every option needs a stable, unique id.",
    },
    {
      question: "Should I use a native select instead?",
      answer: "If you need a plain single choice with no search, icons or descriptions, yes. The native select is accessible, works with every keyboard and opens the system picker on phones. Reach for a custom combobox when you need filtering, multiple chips, async loading or rich option content.",
    },
    {
      question: "How do I stop old search results from replacing newer ones?",
      answer: "Create an AbortController for each request, pass its signal to the request, and abort it in the effect's cleanup. When the query changes, the previous request is cancelled before the next one starts, so an earlier slow response can never overwrite a later one.",
    },
    {
      question: "How is this different from the tag input component?",
      answer: "The chip multi-select here only accepts options from a known list, so it behaves like a select. The separate tag input lets people type any new tag, paste comma separated values and sort tags into categories.",
    },
  ],
  related: [
    "react-tag-input-with-autocomplete-suggestions-paste-support-and-coloured-category-chips",
    "tailwind-table-react-data-table-with-sorting-search-row-selection-and-pagination",
    "navbar-with-search-field-and-category-bar",
  ],
  tags: ["react select", "react dropdown", "searchable dropdown", "react autocomplete", "combobox", "multi select", "async select", "aria-activedescendant"],
  height: 1368,
  section: true,
  interactive: true,
};

export default meta;
