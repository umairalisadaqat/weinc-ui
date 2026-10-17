const meta = {
  slug: "thick-glass-pill-button-that-refracts-a-portrait-and-flattens-when-pressed",
  category: "animated-buttons",
  name: "Thick Glass Pill Button That Refracts a Portrait and Flattens When Pressed",
  keyword: "glass refraction button react",
  title: "React Glass Refraction Button over a Photo | We.Inc",
  description: "Glass pill button on a canvas: its rounded rim bends the portrait behind it with colour fringing and flattens when pressed. Free React and HTML to copy.",
  intro: "A pill of thick glass lying on a fashion portrait. It is not a blurred panel. A small canvas inside the button redraws the piece of photo underneath it sixty times a second, pulling each pixel near the rim inward so the picture bends the way it does through the edge of a paperweight. Red, green and blue are bent by slightly different amounts, which leaves a thin colour fringe on hard edges. A bright line runs along the side of the rim that faces the light and moves round as the pointer moves. Pressing squashes the pill, weakens the bend as if the glass had gone flatter, and on release a ring travels out from the point you touched. Left alone, the photo drifts slowly and the button presses itself every few seconds. The card is 300 pixels wide on phones and 350 on larger screens.",
  useWhen: [
    "One call to action sits on top of a photograph and should feel like an object resting on the print.",
    "A fashion, fragrance or interiors landing page wants a single showpiece control in the first screen.",
    "A portfolio cover needs an enter button that proves the developer can do more than a backdrop blur.",
    "A product card has a strong image and the usual solid button would cover the best part of it.",
  ],
  customize: [
    "`BEND` is the distance in pixels that the rim pulls the picture. 18 reads as a thin lens, 40 as a heavy slab.",
    "`SMOKE` darkens the glass so the white label stays readable. Raise it towards 1 over a dark photo, lower it to 0.7 over a pale one.",
    "Swap `PHOTO` and `PHOTO_ALT` for your own image, then move `FOCUS` to choose which part stays in the frame. The host must send an open cross-origin header or the canvas cannot read it.",
    "The pill is `h-[76px] w-[236px] sm:w-[268px]`. The rim width follows the height, so a taller pill gets a deeper bevel without other changes.",
    "The two fringe factors `0.86` and `1.16` in the paint loop set how far red and blue separate from green. Set both to 1 for colourless glass.",
  ],
  accessibility: [
    "It is a real `button` with a text label, so Space and Enter press it and the squash and ring play from the centre on key down and key up.",
    "A white focus ring with an orange offset is drawn outside the glass, where the refraction cannot hide it.",
    "The label carries a dark text shadow and the glass is smoked. Check contrast again if you change the photo, because the background under the words is the photo itself.",
    "With reduced motion the photo stops drifting, the self-pressing demo is off and the glass is drawn once, then redrawn only when you press or move the pointer.",
  ],
  faqs: [
    {
      question: "Why a 2D canvas and not WebGL or an SVG displacement filter?",
      answer: "The button is small, about 80,000 canvas pixels, so a plain loop over an image buffer costs well under a frame. It needs no shader compile, never loses a graphics context and behaves the same in every browser. SVG displacement on a backdrop only works in some browsers.",
    },
    {
      question: "What happens if the canvas cannot read the photo?",
      answer: "Reading pixels from an image on another host needs that host to allow it. If the read fails, the canvas stays hidden and the button falls back to a bordered, blurred panel, so there is still a usable button with the same label.",
    },
    {
      question: "How does the rim know which way to bend?",
      answer: "When the button is measured, each canvas pixel stores its distance from the edge of the pill and the direction the edge faces at that point. Every frame the loop reads the photo a little further in along that direction. The amount rises steeply close to the edge and is zero across the flat middle.",
    },
    {
      question: "Can the glass sit over moving content such as a video?",
      answer: "Yes, as long as the source can be drawn to a canvas. Replace the `drawImage` call with one that draws the current video frame at the same position. Anything built from ordinary page elements cannot be read this way.",
    },
    {
      question: "Will several of these on one page be slow?",
      answer: "Each one runs its own loop while it is on screen and stops when it scrolls away or the tab is hidden. Two or three are fine on a phone. For a grid of them, drop `RES` to 1 to quarter the work.",
    },
  ],
  related: ["wax-seal-button-that-a-brass-stamp-presses-into-molten-wax-on-an-envelope", "e-paper-display-key-that-flashes-and-redraws-its-own-label-when-pressed", "glazed-celadon-ceramic-button-with-carved-lettering-that-rocks-under-the-finger"],
  tags: ["glass", "refraction", "canvas", "button", "photo", "press"],
  height: 660,
  interactive: true,
};

export default meta;
