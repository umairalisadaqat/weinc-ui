const meta = {
  slug: "kitchen-order-rail-notifications-with-printed-paper-tickets-that-slide-under-a-steel-rail-swing-and-pull-off",
  category: "feedback",
  name: "Kitchen Order Rail Notifications with Printed Paper Tickets That Slide Under a Steel Rail, Swing and Pull Off",
  keyword: "react notification stack animation",
  title: "React Notification Stack as Kitchen Order Tickets | We.Inc",
  description: "Notification stack styled as a kitchen order rail: paper tickets slide under a steel rail, swing like paper and drop when pulled. Free React and HTML code.",
  intro: "A notification list that behaves like the ticket rail above a kitchen pass. Each alert is a strip of thermal paper with a reference, a time, a black or red heading bar, two or three printed lines and a barcode. New tickets feed in from the left end of an aluminium rail and shove the others along, and because every strip hangs from its top edge it swings backwards as it is pushed and settles on its own. Run the pointer across the paper and it flutters. Press a ticket and it drops off the rail behind the steel shelf. The rail holds five tickets on a desktop and two on a phone, and when it is full the oldest one falls to make room.",
  useWhen: [
    "A cafe, restaurant or shop dashboard shows incoming orders and payments and should feel like the counter it runs.",
    "You want a short queue of alerts where the order of arrival is obvious at a glance, newest on the left.",
    "A point-of-sale or delivery product page needs a lively picture of work arriving without a video.",
    "Alerts carry a few lines of detail each, which would be cramped in a one-line toast.",
  ],
  customize: [
    "`feed` is the list of things that get printed. Each entry has `kind` for the heading bar, `ref`, `time`, up to three `lines` and a `foot`. Set `alert: true` to print the bar in red.",
    "`EVERY` is the gap between tickets in milliseconds while the rail feeds itself. Call `print()` from your own data instead and delete the interval.",
    "Ticket width and spacing are `tw` and `gap` in `layout`, and the `5` in `clamp(..., 2, 5)` is the most tickets the rail will hold.",
    "The wall is the `TILES` picture. Swap the four `stop-color` greens for another glaze, such as `#f1ece0` to `#d8d0bd` for cream.",
    "Swing feel is in the frame loop: `44` is how strongly a ticket hangs straight, `2.3` is how fast it stops, and `0.00042` is how much a shove tips it.",
  ],
  accessibility: [
    "The tickets are a real list, and each one is a `button` whose printed text is its name, followed by a hidden instruction to pull it.",
    "Enter or Space pulls the focused ticket, and so do Delete, Backspace and Escape. Focus then moves to the neighbouring ticket, or to Print ticket when the rail is empty.",
    "A hidden polite status line reads every new ticket in full and confirms each one that is pulled.",
    "With reduced motion nothing slides, swings or falls: tickets appear in place and vanish when pulled, and the rail does not feed itself.",
  ],
  faqs: [
    {
      question: "How do the tickets swing without a physics library?",
      answer: "Each ticket has a position along the rail on a spring and an angle that behaves like a pendulum. The sideways force from the spring is fed into the pendulum with a small factor, so paper that is shoved to the right leans to the left first. A little skew is added from the swing speed, which is what makes it read as paper and not card.",
    },
    {
      question: "Is React re-rendering sixty times a second?",
      answer: "No. React only renders when a ticket is added or removed. The frame loop writes the transform of each list item directly, and it pauses while the rail is off screen or the tab is hidden.",
    },
    {
      question: "How do I connect it to real orders?",
      answer: "Replace `feed` with your own records and call `print()` whenever one arrives, for example from a websocket handler. To remove a ticket from code, call `drop(uid, false)` with the id you were given.",
    },
    {
      question: "What makes the torn edge at the bottom of each ticket?",
      answer: "A `clip-path` polygon on the `korn-ticket` class cuts a row of teeth six pixels deep. The shadow is a `drop-shadow` filter on the list item, so it follows the teeth and the swing.",
    },
    {
      question: "Does it fit a narrow sidebar?",
      answer: "The rail measures its own width, so in a 320 pixel column it holds two narrow tickets. Below that the text would wrap badly, so give it at least that much room.",
    },
  ],
  related: ["brass-counter-bell-notification-that-rings-and-raises-a-message-card-from-a-slot-in-the-desk", "rubber-stamp-and-ink-pad-that-stamps-a-document-status-with-ink-that-thins-until-it-is-inked-again", "spirit-level-balance-indicator-with-a-bubble-vial-that-settles-between-two-values"],
  tags: ["notifications", "tickets", "kitchen", "paper", "physics", "queue", "skeuomorphic"],
  height: 660,
  section: true,
  interactive: true,
};

export default meta;
