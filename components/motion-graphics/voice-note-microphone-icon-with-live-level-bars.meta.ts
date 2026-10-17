export default {
  slug: "voice-note-microphone-icon-with-live-level-bars",
  category: "motion-graphics",
  name: "Voice Note Microphone Icon With Level Bars",
  keyword: "animated microphone icon",
  tags: ["microphone icon", "recording state", "level bars", "voice note", "animated svg"],
  height: 410,
  collection: "animated-icons",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Recording is shown by the red button, a solid dot, the stop square and still bars at a fixed height, with the timer still counting.",
  perf: "Eight bars scale on the compositor only while the recording state is on; a one second timer runs alongside and both pause off screen.",
  intro: "The voice note control of a lettings agency's repair form. Press the dark round button and the microphone gives way to a stop square, a soft red ring breathes around it, a dot blinks beside the word Recording and eight level bars rise and fall out of step. Press again and everything settles to a still, ready note.",
  customize: [
    "Recolour the recording state with `--m3mic-rec` and the bars with `--m3mic-bar`.",
    "Drive the bars from real input by setting each rect's scaleY from an AnalyserNode instead of the `m3mic-level` keyframes.",
    "Delete the `demo` line so the preview no longer starts in the recording state.",
  ],
  accessibility: [
    "The button is a toggle with aria-pressed and a label that changes between record and stop, and starting or stopping is announced once through a status region.",
  ],
  useWhen: [
    "A support, messaging or notes app lets people leave audio and needs a clear sign that it is listening.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
