const meta = {
  slug: "snow-globe-you-shake-with-drifting-flakes-over-a-tiny-cabin-on-a-turned-walnut-base",
  category: "app-ui",
  name: "Snow Globe You Shake with Drifting Flakes over a Tiny Cabin on a Turned Walnut Base",
  keyword: "snow globe animation react",
  title: "React Snow Globe Animation You Can Shake | We.Inc",
  description: "Canvas snow globe: grab and shake it, and the water lags behind the glass, whirls the flakes up and lets them sink over a cabin. Free React and HTML code.",
  intro: "A glass snow globe on a lathe-turned walnut base, standing alone on a midnight blue stage. Inside are a log cabin with a lamp in the window, six pines and a drift of snow. Pick the globe up with a mouse or a finger and it follows your hand on a spring, leaning as it goes. The water does not follow straight away: each change of speed pushes the flakes the opposite way and stirs them into eddies, then the liquid calms and they sink at their own pace, small ones slowly and near ones faster, until they lie on the drift. Let go and the globe rocks back to rest. The window reflection on the glass stays with the room rather than the globe, and slides a little as the pointer crosses. On phones the whole object scales down to fit the width and the Shake it button sits under it.",
  useWhen: [
    "A seasonal landing page, gift guide or holiday opening hours notice wants one object to play with in place of falling snow over the whole screen.",
    "A game or kids' app needs an idle toy on its menu or loading screen that rewards a shake.",
    "A thank you screen after a December order should feel like a small present.",
    "A hotel, ski school or Christmas market site wants a keepsake of the place as its opening picture.",
  ],
  customize: [
    "`FLAKES` is the number of flakes in the water. 260 is a flurry, 120 is a quiet night, and 500 still draws comfortably.",
    "`SETTLE` is the sinking speed in pixels a second. 8 gives glycerine that hangs for half a minute, 30 clears in a few seconds.",
    "`PLATE` is the text engraved on the brass plate. Keep it under about fourteen capitals so it stays inside the border.",
    "`LAMP` is the window light as three numbers. `150,200,255` turns the cabin cold and moonlit.",
    "`PROFILE` lists the base as height and half width pairs from top to bottom. Remove the middle pairs for a plain drum, or widen the last two for a heavier foot.",
    "The stage is the `bg-[#0a101d]` colour and the radial gradient beside it on the outer element. Change both together.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The Shake it button is a real button, reachable by Tab and pressed with Enter or Space, and does the same job as dragging.",
    "After each press a visually hidden live region says how many times the globe has been shaken.",
    "With reduced motion nothing animates: the globe is drawn once with the snow in the air, and the button redraws it with the flakes in new places.",
    "The drag area covers only the globe and has `touch-none`, so the rest of the block still scrolls the page on a phone.",
  ],
  faqs: [
    {
      question: "How does the snow know the globe was shaken?",
      answer: "The globe has a position and a speed. Every frame the code measures how much the speed changed, adds that to a stir value and pushes the water the opposite way. The stir value drives a slowly shifting pattern of eddies that carries the flakes, and it fades over a few seconds, after which only the sinking speed is left.",
    },
    {
      question: "Why do the flakes stop on the snow and not at the bottom of the glass?",
      answer: "The `ground` function returns the height of the drift at any point across the globe, including the rise under the cabin. A flake that reaches it while the water is calm is marked as resting and is no longer drawn. A hard enough shake wakes resting flakes and throws them upward.",
    },
    {
      question: "Can I put my own scene inside?",
      answer: "Yes. Everything inside the glass is painted once by `paintScene` into a hidden canvas. Replace the cabin and pines there with your own shapes, or draw an image with `drawImage`. Keep `ground` in step with your scene so the snow lands on it.",
    },
    {
      question: "Does it keep running when nobody is looking?",
      answer: "No. The loop stops when the block scrolls out of view or the tab is hidden and starts again when it returns. While it is left alone on screen it shakes itself every eight and a half seconds so the snow never fully settles.",
    },
    {
      question: "Is the glass a 3D model?",
      answer: "It is a flat canvas drawing: a faint blue fill that thickens toward the edge, a dark band just inside the rim, a bright reflection of a four-pane window, and a cooler bounce on the opposite side. The base and scene are painted once and reused, so each frame only moves the flakes and the reflections.",
    },
  ],
  related: ["brass-spinning-top-loader-that-chalks-a-spiral-and-stands-upright-when-done", "silver-foil-balloon-letters-on-strings-that-bob-bump-and-mirror-the-studio"],
  tags: ["snow globe", "toy", "physics", "canvas", "glass", "winter", "drag"],
  height: 720,
  interactive: true,
};

export default meta;
