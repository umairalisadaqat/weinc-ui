const meta = {
  slug: "react-toast-notification-system-with-undo-stacking-and-swipe-to-dismiss",
  category: "feedback",
  name: "React Toast Notification System with Undo, Stacking and Swipe to Dismiss",
  keyword: "react toast",
  title: "React Toast Notification with Undo and Swipe | We.Inc",
  description: "Free React toast in one file: toast() function, success, error, info and loading states, undo button, stacked cards that fan out, swipe to dismiss.",
  intro: "A complete React toast setup with no library to install. One file gives you a toast() function you can call from anywhere, plus a Toaster viewport that you render once. Toasts come in four kinds (success, error, info and loading), can carry one action such as Undo or Retry, and stack into a tidy pile in the corner. Hover or tab into the pile and it fans out so every message can be read; while it is open, every timer pauses. Drag a toast sideways to throw it away, press its close button, or press Escape to clear the newest one. toast.promise() shows a spinner while work runs and turns into a success or error toast when it settles. On phones the stack spans the width of the screen with a 16 pixel margin, and a light and a dark skin are both included.",
  useWhen: [
    "Confirming something the user just did, such as saving a draft, sending an invoice or copying a link, without taking them off the page.",
    "Giving a short window to take back a destructive action: move to bin, archive, remove from a list, with an Undo button inside the toast.",
    "Showing progress for a request that takes a second or two, then replacing the spinner with the result in the same spot.",
    "Reporting a failed payment or upload with a Retry button, while leaving the rest of the screen usable.",
  ],
  customize: [
    "Move the store and the Toaster into their own file (for example lib/toast.ts) and render <Toaster /> once in your root layout; then import toast anywhere and call toast.success(\"Saved\").",
    "Change how long toasts stay with DEFAULT_DURATION (5000 ms). Errors default to 8000 ms and loading toasts stay until their promise settles; pass { duration: Infinity } to keep any toast until closed.",
    "To move the stack to the top right, change the viewport classes to top-6 and flip the stacking by setting y to index * 14 and offset (not -offset) in ToastCard.",
    "Icon colours live in ICON_COLOUR and ICON_COLOUR_DARK. The card look is the surface string: swap rounded-2xl for rounded-md for a sharper style.",
    "MAX_TOASTS caps how many are kept (5) and VISIBLE_WHEN_STACKED sets how many peek out of the pile (3).",
  ],
  accessibility: [
    "Each toast is announced by screen readers: errors use role=\"alert\" so they interrupt, the others use role=\"status\" so they wait for a pause.",
    "Focusing any toast button expands the stack and pauses the timers, so a keyboard user is never racing a countdown. Escape dismisses the newest toast.",
    "Cards hidden behind the front one are removed from the tab order and from the accessibility tree until the stack opens.",
    "With reduced motion turned on, toasts fade instead of sliding, swiping is switched off and the countdown bar is hidden; the close button still works.",
  ],
  faqs: [
    {
      question: "How do I call a toast from outside a React component?",
      answer: "The toast function talks to a tiny store held at module level, not to React context, so you can call it from an API helper, a form action or an event handler without passing anything down. The Toaster subscribes to that store with useSyncExternalStore and redraws when it changes.",
    },
    {
      question: "How does the undo button actually undo?",
      answer: "The toast only runs the function you give it. The usual pattern is to update your UI straight away, then call toast(\"Moved to bin\", { action: { label: \"Undo\", onClick: restore } }) and only delete on the server if the toast closes without the button being pressed. Clicking the action closes the toast for you.",
    },
    {
      question: "Why do the timers stop when I hover?",
      answer: "Reading a message that slides away mid sentence is frustrating. Each card keeps the time it has left, stops its timeout while the stack is open and starts again with what remained. The thin bar along the bottom freezes with it.",
    },
    {
      question: "Can I update a loading toast myself instead of using promise()?",
      answer: "Yes. toast.loading() returns an id. Keep it, and when your work finishes call the update helper in the store with that id and a new type and title, the same way toast.promise does internally.",
    },
    {
      question: "Does swipe to dismiss work on touch screens?",
      answer: "Yes. Each card can be dragged on the horizontal axis with a finger or a mouse. Past 90 pixels, or with a quick flick, it is dismissed; anything shorter springs back. Vertical scrolling of the page is left alone.",
    },
  ],
  related: [
    "restaurant-pager-puck-alert-that-buzzes-across-a-black-table-with-chasing-red-lights-and-a-dot-matrix-message",
    "kitchen-order-rail-notifications-with-printed-paper-tickets-that-slide-under-a-steel-rail-swing-and-pull-off",
    "brass-counter-bell-notification-that-rings-and-raises-a-message-card-from-a-slot-in-the-desk",
  ],
  tags: ["toast", "notification", "snackbar", "undo", "swipe", "react", "tailwind", "aria-live"],
  height: 640,
  interactive: true,
};

export default meta;
