export default {
  slug: "file-sync-status-icons-uploading-synced-offline-and-error",
  category: "motion-graphics",
  name: "File Sync Status Icons With Retry",
  keyword: "animated status icons",
  tags: ["status icons", "upload status", "sync icon", "error state", "animated svg"],
  height: 560,
  collection: "animated-icons",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Each row shows its finished icon and text at once, and a retry swaps straight from the warning to the synced check.",
  perf: "One looping arrow, one spinner that runs only during a retry and a few one-off stroke draws; loops pause when the list is off screen.",
  intro: "A shared folder list for a bakery where each file shows its state as an icon plus words: an arrow rising out of a tray while it uploads, a cloud whose check draws in once it has synced, a cloud struck through when offline, and a warning triangle that nudges once. Retry crossfades that last row to turning arrows, then to a fresh check.",
  customize: [
    "Set the four state colours with `--m3sts-up`, `--m3sts-ok`, `--m3sts-off` and `--m3sts-err`.",
    "Change `SPIN` and the `DONE` and `WAIT` messages; in a real app call `set()` when your upload request settles instead of the timer.",
    "Delete the `demo` timeout line so the preview retry no longer runs by itself.",
  ],
  accessibility: [
    "Every state is written out beside its icon, the icons are hidden from screen readers, and a retry is announced once through a role status element when it starts and when it finishes.",
  ],
  useWhen: [
    "A file manager, uploader or offline-first app needs per-item states that stay readable for people who never notice the icon.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
