const meta = {
  slug: "library-date-due-card-and-pocket-event-list-that-a-self-inking-dater-stamps-row-by-row",
  category: "content",
  name: "Library Date Due Card and Pocket Event List That a Self Inking Dater Stamps Row by Row",
  keyword: "react event list component",
  title: "React Event List as a Stamped Library Card | We.Inc",
  description: "Event list drawn as a library date card in a manila pocket: a self-inking dater stamps each new date in rough ink. Free React and Tailwind code, or HTML.",
  intro: "A buff library card stands in a manila pocket on a lilac table. The card is ruled like the ones glued inside old books, with a red heading, a date column and eight typed lines listing what is on. Dates that have been announced are stamped beside their line in red, navy or violet ink, each a little crooked and patchy. A black self inking dater rests next to the pocket, and its window shows the date it will print next. Press it and it is carried to the next empty line, pressed down and lifted away, leaving the date behind. The card itself can be dragged down into the pocket and pulled out again. When every line is stamped the card is put away and a fresh one comes up. On a narrow screen the dater sits below the pocket.",
  useWhen: [
    "A bookshop, library, cafe or community hall wants its coming evenings listed with more character than a table.",
    "A product page needs a short release log where each shipped item gets a visible mark.",
    "A course or club site lists sessions and wants the confirmed ones to stand apart from the ones still to be dated.",
    "A wedding or festival page has a running order of six to eight entries.",
  ],
  customize: [
    "The list is the `dates` array. `date`, `what` and `where` are the words on each line, `ink` picks a colour from `INKS`, and `turn`, `dx` and `dy` are how crooked and off centre that impression lands.",
    "`library` holds the name printed on the pocket and the card, the italic title of the card and the red serial number.",
    "The starting value of `stamped` (and the matching number in `live`) decides how many lines are already dated when the page loads. The number a fresh card starts with is set where `stamp` handles a full card.",
    "`STAGE` and the radial gradient under it colour the table. `manila` is the pocket stock, and the card colour is the `#f3ead3` on its face.",
    "`ROW` is the height of a ruled line and `OUT` is how far the card travels. If you add lines, raise `CH` and `OUT` by one `ROW` each so the last line still clears the pocket.",
  ],
  accessibility: [
    "The lines are a real ordered list, so a screen reader hears the events in order, with the stamped date as ordinary text and a hidden note on the lines still waiting for one.",
    "The dater is a button whose label says which date and event it will stamp next. A second button under the scene does the same thing, and a polite live region reports the running count.",
    "The strip across the top of the card is a button with `aria-expanded` that tucks the card away or pulls it out, so dragging is never the only route.",
    "With reduced motion the dater stays where it rests and the date simply appears on the line; the card moves between its two positions without a spring and nothing plays by itself.",
  ],
  faqs: [
    {
      question: "How is the stamped ink made to look uneven?",
      answer: "Each date is live text in a monospace face, run through one small SVG filter defined in the component. A turbulence layer pushes the edges of the letters about by a pixel or two, and a second, stretched layer of noise is turned into a transparency mask so parts of the impression print faint. `mix-blend-mode: multiply` then lets the card show through.",
    },
    {
      question: "Why does the stamp get larger as it moves?",
      answer: "The scene is seen from straight above, so height can only be shown by size and shadow. A single `lift` value runs from 0, pressed on the card, to 1, carried in the hand. The body scales up slightly with it while the shadow slides further away, spreads and fades.",
    },
    {
      question: "How does the card stay behind the front of the pocket?",
      answer: "The pocket is two layers with the card between them. The front layer has a thumb notch cut with a radial `mask-image`, and it ignores the pointer, so you can still grab the part of the card that sits behind it.",
    },
    {
      question: "Can the dates come from my own data?",
      answer: "Yes. Replace `dates` with your records and set `stamped` to the number that are confirmed. If you would rather mark them one at a time from your own code, call `stamp()` whenever a record changes and it will carry the dater to the next empty line.",
    },
    {
      question: "What happens if someone presses the stamp while the card is in the pocket?",
      answer: "The card is pulled out first. `stamp` checks whether it is out, slides it up, waits about half a second for it to arrive and only then sends the dater across.",
    },
  ],
  related: ["photo-booth-team-strips-that-feed-out-of-chrome-slots-in-four-clunks-then-hang-and-swing-on-the-panel", "porcelain-dotted-desk-globe-you-spin-with-inertia-with-flag-pins-that-trail-as-it-turns", "staff-locker-wall-team-section-with-steel-doors-that-swing-open-on-a-taped-portrait-and-a-shelf-of-belongings"],
  tags: ["events", "list", "library", "card", "stamp", "paper", "drag", "timeline"],
  height: 793,
  section: true,
  interactive: true,
};

export default meta;
