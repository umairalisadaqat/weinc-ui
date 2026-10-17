export default {
  slug: "ink-dot-cursor-trail-fading-over-stationery-hero",
  category: "cursors",
  name: "Ink Dot Cursor Trail",
  keyword: "cursor trail",
  title: "Ink Dot Cursor Trail in HTML, CSS, JS and React | We.Inc",
  description: "Free cursor trail of fading ink dots behind a stationery hero. Plain HTML, CSS and JS or React, with touch ink blots, keyboard handling and reduced motion support.",
  intro:
    "A chain of twenty small ink dots chases the pointer across a cream paper hero for a made-up stationery shop. Each dot eases toward the one in front, shrinking and thinning as it goes, so a quick flick of the mouse leaves a tapering stroke that settles back into a single pen tip. The dots travel under the headline and buttons, so copy stays crisp. Before anyone moves a mouse, the trail traces a slow figure of eight so the preview never sits still.",
  useWhen: [
    "A boutique shop or studio landing page where a hint of handwriting suits the brand.",
    "The first screen of a portfolio that has room to breathe and no form to fill in.",
    "A launch or campaign page where a small moment of play makes people stay a few seconds longer.",
  ],
  customize: [
    "Change `DOTS` to make the stroke longer or shorter; around ten feels like a pencil, twenty like a wet brush.",
    "Raise `TAIL` toward 0.6 for a tight, quick trail, or drop it toward 0.25 for a lazy, drifting one.",
    "Set `--w2ink-ink` and the two colours in the `.w2ink-dot` gradient to match your own ink, such as a sepia brown or a deep green.",
    "Edit `--w2ink-dot` to size every dot at once; the trail keeps its taper because each dot scales from that base.",
  ],
  accessibility: [
    "The trail layer is marked aria-hidden and ignores the pointer, so screen readers and clicks only ever meet the real headline, links and buttons.",
    "When someone tabs into the hero, the trail fades out so it can never sit on top of a focus outline, and it returns on the next mouse move.",
    "With reduced motion the dots are never created and the page shows the finished hero, and on touch screens a tap leaves a brief blot instead.",
  ],
  faqs: [
    {
      question: "How does the trail follow the mouse without lag building up?",
      answer:
        "One requestAnimationFrame loop moves every dot. The first dot moves a fixed share of the way to the pointer each frame, and each later dot moves a share of the way to the dot ahead of it. Only transform changes, so the browser can move the dots without recalculating layout.",
    },
    {
      question: "Why do the dots pass behind the text?",
      answer:
        "The dot layer sits below the content in the stacking order. That keeps the headline and button labels fully readable while the ink still looks like it is soaking into the paper around them. Move the layer above the content with a higher z-index if you prefer it on top.",
    },
    {
      question: "Does the real cursor disappear?",
      answer:
        "No. The system arrow stays visible the whole time, and the trail is purely an accent behind it. That keeps text selection, link pointers and every built-in cursor cue working exactly as visitors expect.",
    },
    {
      question: "What happens on a phone or tablet?",
      answer:
        "A finger has no hover state, so there is nothing to trail. The script checks for a fine pointer first; on touch screens it skips the dots and draws a soft blot that spreads and fades wherever someone taps.",
    },
    {
      question: "Will it keep running when the hero scrolls away?",
      answer:
        "An IntersectionObserver stops the frame loop as soon as the section leaves the screen and starts it again when it returns, so a long page with this hero at the top pays nothing while people read further down.",
    },
  ],
  related: ["bar-magnet-cursor-that-combs-iron-filings-on-paper-into-field-lines", "portrait-buried-under-sand-in-a-tray-where-the-pointer-drags-a-finger-trail-that-sifts-shut", "big-headline-hero-with-stats-row"],
  tags: ["cursor trail", "mouse trail", "custom cursor", "hero section", "ink"],
  height: 640,
  section: true,
  collection: "cursor-effects",
  standalone: true,
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The hero shows complete and still, with no trail and no tap blot.",
  perf: "Twenty small elements moved with transform in one frame loop that stops when the hero is off screen.",
} satisfies UiMeta;
