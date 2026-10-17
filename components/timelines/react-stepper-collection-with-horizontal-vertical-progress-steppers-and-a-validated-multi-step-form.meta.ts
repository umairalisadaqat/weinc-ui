const meta = {
  slug: "react-stepper-collection-with-horizontal-vertical-progress-steppers-and-a-validated-multi-step-form",
  category: "timelines",
  name: "React Stepper and Multi-Step Form Components",
  keyword: "react stepper",
  title: "React Stepper and Multi-Step Form Components | We.Inc",
  description: "Free React steppers in Tailwind: horizontal, vertical, progress bar, chevron and dots, plus a multi-step form with per-step validation and saved progress.",
  intro: "Six dependency-free stepper pieces built with React state and Tailwind classes. The centrepiece is a three-step quote request form: each step checks only its own fields, the first field with a problem receives focus, every keystroke is saved to browser storage so a refresh brings the draft back, and the last step shows a summary before sending. Around it sit five stepper layouts: horizontal numbered steps with check marks, a vertical checklist that opens only the current step, a segmented progress bar, arrow-shaped checkout steps and a small dot stepper for tips. On phones the horizontal stepper swaps its labels for a Step 2 of 4 line, and the form's step list moves above the fields.",
  useWhen: [
    "A checkout, booking or signup flow is too long for one screen and splitting it into named steps makes it feel shorter.",
    "A quote or application form has required fields spread across topics and you want errors shown per step instead of all at once at the end.",
    "People often leave a long form halfway and come back later, so the draft should survive a refresh or a closed tab.",
    "An onboarding checklist or project tracker needs to show what is done, what is current and what comes next.",
  ],
  customize: [
    "Change the accent by replacing teal-700 and teal-800 in the horizontal stepper and the form; the progress bar uses amber-300 on #0f172a, and the chevron steps use indigo-700.",
    "Add or rename steps by editing the arrays at the top: H_STEPS, V_STEPS, P_STEPS, C_STEPS and F_STEPS. The connectors and counts follow the array length.",
    "Add a rule to the form inside validate(step, d), keyed by the field's name, and its message appears under the field with aria-invalid set automatically.",
    "Rename the saved draft by changing const KEY = \"quote-request-draft\", and clear it on your server's success response instead of straight after submit if sending can fail.",
    "To stop people jumping back in the horizontal stepper, remove the onClick on the step buttons and keep only Back and Continue.",
  ],
  accessibility: [
    "Every stepper is an ordered list with aria-current=\"step\" on the active item, and completed steps carry hidden text so the check mark is not the only signal.",
    "When the form changes step, focus moves to the new step's heading, which has tabIndex -1, so screen readers announce where the user has landed.",
    "Fields with errors get aria-invalid and aria-describedby pointing at the message; the budget choice is a fieldset with a legend and real radio inputs behind the styled labels.",
    "The progress bar is a single progressbar element whose aria-valuetext names the stage. All buttons are 40px or taller, and transitions stop under reduced motion.",
  ],
  faqs: [
    {
      question: "How do I build a stepper in React without a UI library?",
      answer: "Keep the current index in useState, render the steps as an ordered list, and style each item as done, current or upcoming by comparing its index with the state. The horizontal stepper here is about sixty lines including its Back and Continue buttons.",
    },
    {
      question: "How do I validate a multi-step form one step at a time?",
      answer: "Write a validate function that takes the step number and the form data and returns errors only for that step's fields. Run it when Continue is pressed, show the messages, focus the first failing field, and advance only when the result is empty.",
    },
    {
      question: "How can a multi-step form save progress?",
      answer: "Write the form data and current step to browser storage on every change and read it back in an effect on mount. Wrap each call in try and catch, because storage can be unavailable in private windows or when site data is blocked. Remove the entry after a successful send.",
    },
    {
      question: "Which ARIA attribute marks the current step?",
      answer: "aria-current=\"step\", which the ARIA specification defines for the current step within a process. Place it on one list item at a time. Do not use role=\"tablist\" for a stepper unless the steps really behave as tabs.",
    },
    {
      question: "Should users be able to click back to earlier steps?",
      answer: "Usually yes for completed steps, since it lets people fix a typo without pressing Back several times. Keep future steps disabled when they depend on earlier answers; use free navigation, like the chevron steps, only when the order is a suggestion.",
    },
  ],
  related: [
    "ray-marched-oak-groove-stepper-with-a-steel-ball-that-rolls-to-turned-brass-posts-in-raking-window-light",
    "html-form-examples-collection-with-every-input-type-and-copyable-html-css-or-tailwind",
    "pagination-collection-with-numbered-load-more-infinite-scroll-and-url-synced-react-tailwind-pieces",
  ],
  tags: ["react stepper", "stepper css", "multi step form", "react multi step form", "tailwind stepper", "progress steps", "wizard form react", "vertical stepper"],
  height: 1560,
  section: true,
  interactive: true,
};

export default meta;
