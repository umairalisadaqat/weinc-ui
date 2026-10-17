export default {
  slug: "form-error-and-warning-icons-that-draw-and-nudge-once",
  category: "motion-graphics",
  name: "Form Error and Warning Icons That Draw",
  keyword: "error animation css",
  tags: ["error state", "warning icon", "form validation", "animated icons", "svg stroke"],
  height: 470,
  collection: "animated-icons",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The warning triangle, the error circle and both messages are drawn complete, and the field does not move.",
  perf: "Two small icons draw once and the field shifts sideways for under half a second; nothing loops.",
  intro: "A rowing club signup form caught in an error. An amber notice above draws its warning triangle and drops in the exclamation mark, then the email field nudges sideways once and a red circle draws beside the message that explains what is missing. Fix the address and submit, and the circle swaps its mark for a quiet check.",
  customize: [
    "Change `--m3wrn-err` and `--m3wrn-warn` to your own error and warning colours; keep 4.5:1 contrast on the tinted banner.",
    "Soften or remove the sideways nudge by editing the pixel values in `m3wrn-nudge`.",
    "Swap the regular expression in the submit handler for your own validation, and call `show(false)` from it to replay the error.",
  ],
  accessibility: [
    "The input carries aria-invalid and points at its message with aria-describedby, and the message text sits in a status region so each change is read once.",
  ],
  useWhen: [
    "A signup, checkout or settings form needs its error to be noticed without a red flash or a modal.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
