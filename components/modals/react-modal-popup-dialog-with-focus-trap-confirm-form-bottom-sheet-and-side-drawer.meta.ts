const meta = {
  slug: "react-modal-popup-dialog-with-focus-trap-confirm-form-bottom-sheet-and-side-drawer",
  category: "modals",
  name: "React Modal Popup Dialog with Focus Trap, Confirm, Form, Bottom Sheet and Side Drawer",
  keyword: "react modal",
  title: "React Modal Popup: Confirm, Form, Sheet and Drawer | We.Inc",
  description: "Free React modal popup in one file: focus trap, Escape to close, scroll lock, focus return, click outside. Confirm, form, bottom sheet and drawer.",
  intro: "A React modal that handles the parts most snippets skip. One Modal component drives four popups on a sample projects screen: a delete confirmation, a new project form, a share sheet that rises from the bottom, and an invoice drawer that slides in from the right. When one opens, keyboard focus moves inside and Tab cycles only through its controls, Escape closes it, the page behind stops scrolling and becomes inert, and focus goes back to the button that opened it on close. Clicking the dimmed backdrop closes every variant except the confirmation, which waits for an explicit answer. On phones the form dialog fills the screen, and the sheet can be dragged down by its handle to dismiss.",
  useWhen: [
    "Asking someone to confirm a destructive step, like deleting a project or cancelling a plan, before it runs.",
    "Collecting two or three fields (a name, a choice) without sending people to a separate page.",
    "Offering share or filter options on a phone, where a sheet near the thumb is easier than a centred box.",
    "Showing the detail of one row, such as an invoice or an order, while the list stays in view behind it.",
  ],
  customize: [
    "In a real app, import createPortal from react-dom and return the Modal markup through createPortal(..., document.body). Then change absolute to fixed on the overlay and the panel wrapper, and pass document.body as the scroll element so the whole page locks.",
    "Pick a variant with the variant prop: center, sheet or drawer. The placement strings for each live in the placement object; widen the dialog by changing sm:w-[min(440px,calc(100%-32px))].",
    "Use role=\"alertdialog\" with closeOnOverlay={false} for any question that must be answered, and give initialFocusRef the safest button so a stray Enter does nothing harmful.",
    "The spring settings (stiffness 420, damping 36) set how snappy panels feel. The sheet closes after a 110 pixel drag or a fast flick; change those two numbers in onDragEnd.",
    "Colours are plain Tailwind: stone for surfaces, emerald-700 for focus rings and selected options, red-600 for the destructive button.",
  ],
  accessibility: [
    "Every panel has role=\"dialog\" or role=\"alertdialog\", aria-modal, and is labelled by its heading and described by its sub line. Trigger buttons carry aria-haspopup and aria-expanded.",
    "The content behind gets the inert attribute while a dialog is open, so screen readers and Tab cannot reach it, and the Tab trap wraps from last control to first and back.",
    "The form marks an empty name with aria-invalid and points to the error text through aria-describedby, then puts focus back on the field.",
    "With reduced motion on, panels appear without sliding or scaling and the sheet cannot be dragged; Escape and the close button still work.",
  ],
  faqs: [
    {
      question: "Do I still need a portal if the modal works without one here?",
      answer: "Yes, in a product. A parent with overflow hidden, a transform or its own z-index can clip a modal rendered in place. Rendering into document.body escapes all of that. The preview skips the portal only so the dialogs stay inside their frame.",
    },
    {
      question: "Why not use the native dialog element?",
      answer: "You can, and showModal gives you a top layer and Escape for free. It is still awkward to animate on close, and scroll lock and returning focus to a specific trigger need code anyway. This version keeps full control over motion and works the same in every browser.",
    },
    {
      question: "How does the scroll lock avoid the page jumping sideways?",
      answer: "lockScroll measures the scrollbar width before hiding overflow and adds that much right padding, then restores both values when the dialog closes.",
    },
    {
      question: "Why does the demo open with a dialog showing but no focus inside it?",
      answer: "The preview starts with the form open so you can see it, but stealing focus on page load would be rude to anyone reading. Once you open a dialog with a button, focus moves in as it should. In your app, opening always comes from a user action, so focus always moves.",
    },
    {
      question: "Can two modals be open at once?",
      answer: "The demo keeps one open value, which is the safer pattern. If you must stack them, give the second a higher z-index and make sure only the top one listens for Escape.",
    },
  ],
  related: [
    "velvet-stage-curtain-dialog-that-draws-apart-on-a-pull-cord-with-pleats-that-gather-and-sway",
    "react-toast-notification-system-with-undo-stacking-and-swipe-to-dismiss",
    "react-tabs-with-sliding-underline-segmented-pills-vertical-and-icon-count-variants",
  ],
  tags: ["modal", "dialog", "popup", "drawer", "bottom sheet", "focus trap", "react", "tailwind"],
  height: 640,
  interactive: true,
};

export default meta;
