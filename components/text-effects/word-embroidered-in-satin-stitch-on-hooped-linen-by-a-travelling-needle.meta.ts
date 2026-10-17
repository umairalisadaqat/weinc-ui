const meta = {
  slug: "word-embroidered-in-satin-stitch-on-hooped-linen-by-a-travelling-needle",
  category: "text-effects",
  name: "Word Embroidered in Satin Stitch on Hooped Linen by a Travelling Needle",
  keyword: "embroidery text effect react",
  title: "React Embroidery Text Effect in a Hoop | We.Inc",
  description: "Canvas text effect: a travelling needle sews a word into hooped linen in satin stitch, and the thread sheen follows the pointer. Free React and HTML code.",
  intro: "A piece of natural linen clamped in a beech embroidery hoop, with a word being sewn into it. The word is worked the way a hand embroiderer fills a letter: hundreds of short slanted stitches laid side by side, a narrow band at a time, with the long runs broken into staggered lengths. A steel needle rides the newest stitch and bobs in and out of the cloth with the working thread trailing from its eye, then parks beside the finished word. Each strand is shaded as a tiny cylinder and carries one bright stretch of sheen, and that stretch slides along all the stitches together as the pointer moves the lamp. After a pause the thread is pulled out from the right and the next word starts in a new colour. The hoop is a wide oval on desktop and a circle on phones, where a two word line is stacked.",
  useWhen: [
    "A craft shop, tailor, yarn store or handmade brand wants its greeting made the same way as its products.",
    "A wedding, baby or gift page needs a warm one line opener that is an object and not a font choice.",
    "An about page for a studio that talks about slow, careful work wants a picture of exactly that.",
    "A thank you screen after an order from a small maker should feel personal for a few seconds.",
  ],
  customize: [
    "`pieces` lists each `text` with its `thread` colour as a hex value. Saturated colours show the sheen best, and very dark ones hide the shading.",
    "`LINEN` is the cloth. Every weave thread, fold and shadow is mixed from it, so `#2b3447` gives navy cotton with no other changes apart from the section's ring offset class.",
    "`SLANT` is the stitch angle in radians. `0` lays the stitches flat across the stems, `-1.2` stands them nearly upright.",
    "`PACE` is the number of seconds a word takes to sew. The pause before unpicking is `hold` inside `paint`.",
    "`gap` in `buildStitches` is the spacing between rows of stitches. At 3 the linen shows through, like work done with a single strand.",
  ],
  accessibility: [
    "The canvas is decorative and hidden. The word being sewn is a real `h2`, visually hidden, in a polite live region so a change of word is announced once.",
    "Unpick and restitch is a normal button, reachable by keyboard, with a visible focus ring against the linen.",
    "With reduced motion the word is shown finished with the needle parked, nothing loops, and the button swaps to the next word in one step.",
    "The sheen is extra. Nothing is conveyed by the lamp position, so touch and keyboard users miss no information.",
  ],
  faqs: [
    {
      question: "How are the stitches worked out from ordinary text?",
      answer: "The word is drawn once, off screen, in a heavy italic serif. The component then walks parallel slanted lines across that drawing two pixels apart and records every stretch that lies inside a letter. Each stretch becomes a stitch with a start and an end, and stretches longer than about a sixth of the letter height are cut into shorter stitches.",
    },
    {
      question: "Why does it not redraw a thousand stitches every frame?",
      answer: "Finished stitches are painted once onto two hidden layers, one for their shadows and one for the floss, and those layers are simply copied each frame. Only the sheen is redrawn, as two batched strokes covering every stitch.",
    },
    {
      question: "Can it sew my brand typeface?",
      answer: "Yes. Change the `face` string in `buildStitches` to any font already loaded on the page. Faces with thick strokes give the best satin stitch. Hairline strokes become rows of very short stitches, which is also what happens on real cloth.",
    },
    {
      question: "How do I stop it unpicking the word?",
      answer: "Keep one entry in `pieces` and set `hold` to a very large number. The word is sewn once and the needle stays parked next to it, while the lamp keeps working.",
    },
    {
      question: "Does the cloth use an image file?",
      answer: "No. The weave is a 48 pixel tile of over and under threads drawn in code and repeated, with single thick threads, tonal patches and folds painted on top so the repeat does not show. The hoop, its grain and the brass screw are drawn the same way.",
    },
  ],
  related: ["layered-paper-cut-word-with-a-photograph-drifting-behind-the-letters", "blind-embossed-paragraph-that-inks-in-under-a-passing-lamp", "cinema-marquee-headline-with-letter-tiles-that-slide-along-rails-and-chasing-bulbs"],
  tags: ["embroidery", "stitch", "thread", "linen", "canvas", "craft", "handmade"],
  height: 760,
  interactive: true,
};

export default meta;
