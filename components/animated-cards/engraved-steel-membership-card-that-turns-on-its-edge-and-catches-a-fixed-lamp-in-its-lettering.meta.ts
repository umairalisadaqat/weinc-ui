const meta = {
  slug: "engraved-steel-membership-card-that-turns-on-its-edge-and-catches-a-fixed-lamp-in-its-lettering",
  category: "animated-cards",
  name: "Engraved Steel Membership Card That Turns on Its Edge and Catches a Fixed Lamp in Its Lettering",
  keyword: "metal membership card react",
  title: "React Metal Membership Card That Spins | We.Inc",
  description: "Membership card in brushed steel: engraved lettering flares under a fixed lamp as you spin it on its edge. Copy the React code or the HTML version free.",
  intro: "A single metal card standing in a dark room. The front is brushed champagne steel with a member's name cut into it in a serif face, small tracked capitals for the house and the number, and an engine-turned rosette around a monogram. The back is bottle green anodised steel where the same cutter has gone through to bare metal, so the number shines. The lamp never moves. As the card rocks, a soft band of light slides across the plate, the walls of each letter swap from lit to shadowed, and the lettering flashes when the band passes over it. The card has thickness: turn it far enough and you see a pale edge. It rocks by itself, turns over every few seconds, and can be dragged or flicked to spin with weight. On a phone the whole card is scaled to fit the width.",
  useWhen: [
    "A members' club, gym, studio or hotel wants the membership itself to be the hero image of the join page.",
    "A loyalty or founding-supporter tier needs a keepsake object that feels worth more than a coloured rectangle.",
    "A personal site wants a contact card with a name and a number that visitors can pick up and turn round.",
    "A product page for metal cards, plaques or engraved gifts needs to show how the cut behaves in light.",
  ],
  customize: [
    "Every engraved word is in the `card` object at the top. `member` is the large serif line, `number` is repeated very large on the back, and `monogram` sits in the middle of the rosette.",
    "The plate colours are the two fills in `build`: `#bdb6a8` for the bright face and `#17382f` for the green one. The floor of the cut is `#2b2722` on the bright face and `#a3a39c` on the green one.",
    "`THICK` is the edge in pixels and `RADIUS` the corner. `W` and `H` set the plate size, and the artwork positions in `drawFront` and `drawBack` are written against those two numbers.",
    "`SWAY` is how far it rocks while idle and `TURN_EVERY` is the pause in seconds before it turns itself over. Set `TURN_EVERY` very high to keep the front showing.",
    "The lamp sits at `-0.3` radians in `paint`. The two `band` calls are the lamp and a cooler window light, and their last number is how wide and how strong each one is.",
  ],
  accessibility: [
    "The card is one real button with `aria-pressed` for which face is showing. Enter or Space turns it over and the left and right arrow keys give it a push, so nothing depends on dragging.",
    "The canvases are hidden from assistive technology. A live region under the card reads out every word engraved on the face that is currently showing.",
    "With reduced motion the card is drawn once at a slight angle and stays there. Turning it over swaps the face with no travel, and the frame loop only runs while a finger is on the card.",
    "Keep the caption or your own visible hint: the drag gesture is not discoverable from a still object.",
  ],
  faqs: [
    {
      question: "How does the lettering catch the light without a 3D library?",
      answer: "The artwork is drawn once in white on a hidden canvas and blurred by half a pixel. The code then reads where that picture gets brighter or darker from left to right and from top to bottom, and saves four thin outline pictures: walls facing left, right, up and down. Each frame it works out which side of the lamp the plate is turned to and draws the lit walls in white and the opposite walls in black, so the cut appears to have depth and the bright side swaps over as the card turns.",
    },
    {
      question: "Is the brushed finish an image file?",
      answer: "No. For every pixel row the code picks a random tone and then lays five short horizontal scratches of random length on top, about two and a half thousand strokes in all. That texture is drawn once per face and reused, so the per frame work is a handful of `drawImage` calls and three gradients.",
    },
    {
      question: "How is the edge of the card made?",
      answer: "Six rounded rectangles are stacked one pixel apart between the two faces inside a `preserve-3d` parent. Seen side on they merge into a solid strip that follows the rounded corners. Their fill is a CSS variable that the loop brightens as the edge swings toward the camera.",
    },
    {
      question: "Why does a flick sometimes spin it more than once?",
      answer: "On release the card keeps the speed of your finger. The code looks a third of a second ahead at where that speed would carry it and chooses the nearest face to settle on, so a hard flick passes several half turns before a spring pulls it to rest.",
    },
    {
      question: "Which fonts does it use?",
      answer: "Only fonts already on the visitor's device. The name asks for Didot, then Bodoni, then Georgia, and the small capitals ask for Helvetica Neue and then Arial. To use a brand typeface, load it on your page and put its name first in `SERIF` or `SANS`, then make sure it has finished loading before this component mounts.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches"],
  tags: ["card", "metal", "engraved", "canvas", "3d", "drag", "membership"],
  height: 660,
  section: true,
  interactive: true,
};

export default meta;
