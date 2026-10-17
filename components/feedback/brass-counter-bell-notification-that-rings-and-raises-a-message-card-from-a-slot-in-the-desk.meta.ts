const meta = {
  slug: "brass-counter-bell-notification-that-rings-and-raises-a-message-card-from-a-slot-in-the-desk",
  category: "feedback",
  name: "Brass Counter Bell Notification That Rings and Raises a Message Card from a Slot in the Desk",
  keyword: "react notification bell component",
  title: "React Notification Bell with a Message Card | We.Inc",
  description: "Notification drawn as a brass reception bell: press the plunger, the dome rings and a printed card rises with the next message. Free React code and HTML.",
  intro: "A notification you ring for. A polished brass reception bell stands on a walnut desk, and behind it a cream card on a brass rod carries one message: who sent it, when, a headline and a line of detail. Press the plunger and the dome shivers, the old card drops into a slot in the desk and the next one springs up and rocks to a stop. The bell is not a picture. Its base, dome and plunger are profiles spun around an axis and lit by a small painted room, which is why a window with glazing bars shows in the metal. On a phone the bell stays the same size, the card narrows to fit the screen and the whole scene is 590 pixels tall.",
  useWhen: [
    "A booking, reception or restaurant site wants its confirmation message to feel like service at a counter.",
    "An empty inbox or a quiet dashboard needs one charming object that hands over updates one at a time.",
    "A landing page for a concierge, hotel or front-of-house product needs a hero object visitors can press.",
    "You have three to six short announcements and want people to step through them on purpose.",
  ],
  customize: [
    "`notes` holds the cards. Each has `from`, `time`, `title` and `body`. Keep titles under about 24 characters so they stay on two lines at phone width.",
    "`HOLD` is how long a card stays up while the piece plays by itself, in milliseconds. The self-running loop stops for good the first time someone presses the bell or puts a card away.",
    "The metal colour is the three multipliers `1.0`, `0.71` and `0.3` in the brass branch of `turn`. `0.95, 0.95, 1.0` gives nickel, `1.0, 0.6, 0.45` gives copper.",
    "`DOME` is the outline of the bell as radius and height pairs. Raise the heights in the middle of the list for a taller, more pointed bell.",
    "Set `SOUND` to `true` for a short ding. It only plays after a visitor has pressed the bell themselves.",
  ],
  accessibility: [
    "The bell is a real `button` with a spoken name, so Enter and Space ring it, and the card has its own Put away button.",
    "Escape pressed anywhere inside the piece lowers the card, and a visually hidden `role=\"status\"` line reads each new message and confirms when one is put away.",
    "With reduced motion the card changes in place, the dome does not shake and the self-running loop never starts.",
    "The canvas is hidden from assistive technology. Keep the message in the card and the status line if you change the artwork.",
  ],
  faqs: [
    {
      question: "How is the brass drawn without a 3D library?",
      answer: "Each part is a list of radius and height points. The code sweeps every point around a circle, keeps the nearest surface for each pixel, then works out what a mirror at that angle would see in a small made-up room with a window and a lamp. That runs once on load and the result is kept as an image.",
    },
    {
      question: "Does it redraw all the time?",
      answer: "No. The canvas repaints only while the plunger is moving or the dome is still ringing, which is a little over a second per press. The card is ordinary HTML moved by two springs.",
    },
    {
      question: "Can I raise a card from my own code when something happens?",
      answer: "Call `ring()` from an effect that watches your data. To show a specific message, push it onto `notes` and call `raise` with its position in the list.",
    },
    {
      question: "Why does the card sink into the desk?",
      answer: "The card sits inside a box that ends at the brass slot and hides anything below it, so pushing the card down by `TRAVEL` pixels makes it disappear behind the desk top.",
    },
    {
      question: "Will the text on the card stay sharp?",
      answer: "Yes. Only the bell is on a canvas. The card is real text in a serif face, so it scales with the browser, can be selected and is read by screen readers.",
    },
  ],
  related: ["kitchen-order-rail-notifications-with-printed-paper-tickets-that-slide-under-a-steel-rail-swing-and-pull-off", "restaurant-pager-puck-alert-that-buzzes-across-a-black-table-with-chasing-red-lights-and-a-dot-matrix-message", "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put"],
  tags: ["notification", "bell", "brass", "toast", "canvas", "skeuomorphic", "card"],
  height: 700,
  interactive: true,
};

export default meta;
