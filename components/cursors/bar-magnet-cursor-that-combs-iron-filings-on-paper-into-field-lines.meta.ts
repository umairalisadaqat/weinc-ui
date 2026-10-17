const meta = {
  slug: "bar-magnet-cursor-that-combs-iron-filings-on-paper-into-field-lines",
  category: "cursors",
  name: "Bar Magnet Cursor That Combs Iron Filings on Paper into Field Lines",
  keyword: "magnetic field cursor effect canvas",
  title: "React Cursor Effect: Magnet and Iron Filings | We.Inc",
  description: "Cursor effect with a bar magnet that follows the pointer over iron filings, which turn and chain into field lines. Copy the React code or HTML free.",
  intro: "A sheet of white paper dusted with several thousand iron filings, and a red and steel bar magnet that follows the pointer across it. Far from the magnet the filings lie at whatever angle they fell. Closer in they swing round to follow the field, slide sideways into separate curved lines with bare paper between them, and the nearest are pulled up against the two poles in a bristle. Move the magnet and the pattern re-forms behind it with a slight lag, each filing on its own spring. The magnet has weight: it trails the pointer, overshoots a little and turns its long side into the direction of travel. A click gives it a quarter turn. Left alone it is led round the sheet in a slow loop. The sheet is landscape on a desktop and turns portrait on a phone, where a sideways drag leads the magnet.",
  useWhen: [
    "A science, education or museum page wants an opening that is also a small working demonstration.",
    "A studio site wants a cursor piece with no photograph in it at all, only black marks on white paper.",
    "You need a quiet interactive figure beside an article about attention, influence or how a market lines up behind one player.",
    "A 404 or holding page should give visitors something to push around while they decide where to go.",
  ],
  customize: [
    "`AREA_PER_FILING` sets the density. `90` is a light dusting, `40` is a heavy one, and `MAX_FILINGS` caps the count on very large sheets.",
    "`LINES` is how many field lines the filings gather onto. `24` gives bold separate ribs, `64` gives a fine silky pattern.",
    "`REACH` controls how far from the magnet filings are combed straight. Double it and the whole sheet lines up; halve it for a small tidy halo.",
    "Change the two greys in `INK` for the filings, and the three stops of the `red` gradient for the north half of the magnet.",
    "The sheet shape is `aspect-[4/5]` on phones and `sm:aspect-[3/2]` above. The captions printed in its corners are two plain spans.",
  ],
  accessibility: [
    "The sheet is one native button. Arrow keys slide the magnet, Enter or Space turns it a quarter, and the label says so.",
    "The canvas is decorative and hidden from assistive technology, and the caption on the sheet names what the figure shows.",
    "With reduced motion nothing loops: the filings are drawn settled, and the sheet redraws once each time the magnet is moved or turned.",
    "The filings are near black on near white, so the pattern does not depend on colour. Only the red pole does, and it is also stamped with a letter.",
  ],
  faqs: [
    { question: "Is the field pattern real physics?", answer: "The directions are. The magnet is treated as two poles, and each filing reads the sum of the two fields at its own spot, which gives the same family of curves a bar magnet makes on paper. The strength falls off more gently than in life so the pattern fills the sheet, and the way filings gather into distinct lines is modelled directly, by sliding each one onto the nearest of a fixed number of field lines." },
    { question: "How do the filings form separate lines instead of an even texture?", answer: "Every field line of a two-pole magnet has a constant value of one simple quantity: the angle to one pole minus the angle to the other. The code rounds that value to the nearest of forty steps and nudges the filing sideways until it sits on that step. Near the poles the steps are close together and the nudge is strong; far away it fades to nothing." },
    { question: "Why canvas 2D and not WebGL?", answer: "Thin dark lines on a transparent canvas need no shader. All the filings of one grey are added to a single path and stroked once, so a frame is two strokes plus the magnet, and the paper underneath is ordinary CSS that you can restyle." },
    { question: "Can I hide the magnet and let the cursor be the magnet?", answer: "Yes. Delete everything in `paint` after the loop that strokes the filings. The field still follows the pointer, and with no bar on top you also see the filings that line up between the poles." },
    { question: "Does it keep running when it is off screen?", answer: "No. An IntersectionObserver and the page visibility event both stop the animation frame loop, and it starts again from the current state when the sheet comes back into view." },
  ],
  related: ["portrait-buried-under-sand-in-a-tray-where-the-pointer-drags-a-finger-trail-that-sifts-shut", "reversible-sequin-portrait-panel-that-flips-to-gold-foil-where-the-pointer-brushes"],
  tags: ["cursor", "magnet", "iron filings", "field lines", "canvas", "physics", "particles"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
