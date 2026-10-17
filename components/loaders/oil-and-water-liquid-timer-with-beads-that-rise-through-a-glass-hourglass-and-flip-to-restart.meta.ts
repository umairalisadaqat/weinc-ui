const meta = {
  slug: "oil-and-water-liquid-timer-with-beads-that-rise-through-a-glass-hourglass-and-flip-to-restart",
  category: "loaders",
  name: "Oil and Water Liquid Timer with Beads That Rise Through a Glass Hourglass and Flip to Restart",
  keyword: "react countdown timer animation",
  title: "React Countdown Timer Animation: Oil Hourglass | We.Inc",
  description: "Countdown on a canvas: an hourglass of water and oil where beads squeeze up through the neck and a tap flips it to restart. Free React and HTML code.",
  intro: "An hourglass that runs backwards. Two glass bulbs joined at a narrow neck are held between brass plates on a near-black stage and filled with water and a measure of orange oil. Oil is lighter than water, so it collects under the neck and escapes upward one bead at a time. Each bead stretches thin to pass the neck, rounds out as the bulb widens, wanders on its way up and joins the layer floating under the top plate with a small wobble. The oil left below the neck is the time remaining, printed as minutes and seconds under the piece. Tap it, or press Enter, and the timer hops, turns over and starts again, with both layers staying level through the whole turn. It is a single centred drawing that scales to a 360 pixel screen.",
  useWhen: [
    "A recipe, tea or coffee page needs a short timer that people will enjoy looking at while they wait.",
    "A quiz, game or workshop screen gives each round a fixed number of seconds.",
    "A checkout or booking flow holds a reservation for a few minutes and wants the hold to feel calm instead of threatening.",
    "A focus or breathing tool needs a slow, physical object in the middle of an otherwise empty screen.",
  ],
  customize: [
    "`DURATION` is the run time in seconds. The bead rate is worked out from it, so 180 gives a three minute timer with the same amount of oil.",
    "`OIL` and `WATER` are the two liquids. `#35d07f` oil in `#9fb7ff` water looks like a lab sample, and the glow on the table takes the oil colour.",
    "`BRASS` is the five-stop gradient used for the plates, collars and rods. Swap it for greys such as `#111`, `#555`, `#f2f2f2`, `#777`, `#0a0a0a` to get steel.",
    "`AUTO` decides whether the timer turns itself over at zero. Set it to `false` when the end of the run should wait for the visitor.",
    "`TOTAL = AREA * 0.36` sets how much of one bulb the oil fills. 0.5 makes a deeper layer and bigger changes in level per second.",
  ],
  accessibility: [
    "The time is real text in an element with `role=\"timer\"`, updated once a second, and it reads Done at zero. The canvas itself is hidden from assistive technology.",
    "The whole timer is one button labelled Turn the timer over, with a visible focus ring, so restarting never needs a pointer.",
    "With reduced motion there are no beads, no wobble and no spin. The two levels move one step each second so the timer still tells the time, and turning it over is instant.",
  ],
  faqs: [
    {
      question: "How do the liquids stay level while the hourglass is turning?",
      answer: "Nothing is rotated with the glass except the glass. Each frame the outline of a bulb is turned to its current angle, and a short search finds the horizontal line that leaves the right area of that outline above it. The oil is painted above that line and clipped to the bulb, so it behaves at every angle the way a floating layer would.",
    },
    {
      question: "Is the countdown accurate?",
      answer: "The oil below the neck is drained at a steady rate of the total divided by `DURATION`, measured in real elapsed time, and beads are released as that debt builds up. The printed time comes from the oil that is left, so the picture and the number cannot drift apart. Like any animation loop it pauses while the tab is hidden.",
    },
    {
      question: "How can I run code when the time is up?",
      answer: "The `left` state reaches 0 at the end of a run. Add an effect that watches it and calls your handler, and set `AUTO` to `false` if you do not want the timer to turn over while your handler works.",
    },
    {
      question: "Why does a bead get long and thin in the neck?",
      answer: "Its area is kept constant. When the glass is narrower than the bead, the width is limited to the room available and the height is increased to match, which is what a real drop does when it is forced through a gap.",
    },
    {
      question: "Why do the highlights not spin with the glass?",
      answer: "The lamp is fixed in the room. The reflections fade as the timer passes through the horizontal and reappear on whichever side now faces left, and the gradient on the brass slides the opposite way, so after half a turn the piece is lit exactly as before.",
    },
  ],
  related: ["ink-drop-progress-indicator-that-blooms-through-a-glass-of-water-one-drop-per-step", "nitro-cold-brew-tumbler-loader-that-pours-cascades-and-settles-under-a-cream-head"],
  tags: ["timer", "hourglass", "oil", "water", "glass", "canvas", "countdown"],
  height: 760,
  interactive: true,
};

export default meta;
