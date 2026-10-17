export default {
  slug: "copy-to-clipboard-icon-that-crossfades-into-a-check",
  category: "motion-graphics",
  name: "Copy to Clipboard Icon That Turns Into a Check",
  keyword: "copy to clipboard animation",
  tags: ["copy button", "clipboard icon", "checkmark", "code snippet", "icon crossfade"],
  height: 460,
  collection: "animated-icons",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The clipboard swaps for the check and the label changes to Copied in one step, with no fade or drawing.",
  perf: "Two transitions per click on a single small SVG; nothing runs between clicks and no frame loop exists.",
  intro: "Copy buttons on a dark command panel in a docs page. Press one and the two-sheet clipboard icon shrinks and fades while a mint check draws in on the same spot, the word changes to Copied, and after two seconds both slip back. The icon is not morphed point by point: two finished shapes simply crossfade, which works in every browser.",
  customize: [
    "Change `HOLD` for how long the check stays before the button resets.",
    "Recolour the check with `--m3cpy-accent` and the panel with `--m3cpy-code`.",
    "Add more commands by copying an `<li>`; each button copies the text of the `<code>` beside it.",
  ],
  accessibility: [
    "Each button names its command with aria-label, the result is read once from a status region, and a refused clipboard request says so instead of showing a false check.",
  ],
  useWhen: [
    "Docs, a settings page with an API key, or a referral link needs a copy action that proves it worked.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
