export default {
  slug: "form-sent-envelope-that-seals-and-shows-a-check",
  category: "motion-graphics",
  name: "Form Sent Envelope That Seals With a Check",
  keyword: "success animation",
  tags: ["success animation", "form sent", "envelope icon", "checkmark", "contact form"],
  height: 600,
  collection: "animated-icons",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The sealed envelope with its check badge and the full confirmation text appear at once with no movement.",
  perf: "A handful of SVG shapes animate transform, opacity and one dash offset for about a second and a half, then stop for good.",
  intro: "The thank-you state of a pottery studio's contact form. A letter slides down into an envelope, the flap folds shut over it, the envelope gives a small lift and a terracotta badge arrives at its corner while its check draws. Below it the card repeats the subject and reply address so the sender knows what went out.",
  customize: [
    "Change `--m3env-accent` for the badge and `--m3env-ink` for the envelope outline.",
    "Scale the whole sequence with `--m3env-time`; values under 1 make it snappier.",
    "Replace the two rows of the summary list with the fields your own form collects.",
  ],
  accessibility: [
    "The drawing is decoration hidden with aria-hidden; the heading carries role status, so rendering this card after a successful submit is announced once as Message sent.",
  ],
  useWhen: [
    "A contact, enquiry or booking form needs a confirmation that feels like the message really went somewhere.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
