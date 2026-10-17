const meta = {
  slug: "ray-marched-hourglass-loader-in-a-turned-ash-frame-on-a-sunlit-desk-that-pours-coral-sand-into-a-growing-cone-and-flips-over-when-full",
  category: "loaders",
  name: "Ray-Marched Hourglass Loader in a Turned Ash Frame on a Sunlit Desk That Pours Coral Sand into a Growing Cone and Flips Over When Full",
  keyword: "hourglass loader react",
  title: "Ray-Marched Hourglass Progress Loader (React, WebGL) | We.Inc",
  description: "Free React progress loader in one WebGL shader: a glass hourglass in a turned wooden frame pours coral sand into a cone, then flips itself over at 100%.",
  intro: "A progress screen set on a sunny desk. An hourglass in a pale turned frame stands in window light, and coral sand runs through the neck as the number climbs. The upper bulb drains into a little crater, the stream wavers as clumps go through, and the lower bulb builds a cone on a level bed. At one hundred the glass tips back to take its weight, goes over in one heavy movement that runs a little past and settles, and the cone that is now on top slumps down into the neck before the next run begins. The window frame throws its bars across the boards and up the wall, so the long shadow of the spindles shares the desk with them. The figures, the phase counter and the status line are ordinary text on the left of the picture, and on a phone they sit under the glass.",
  useWhen: [
    "An export, backup or upload runs long enough that people will look at the screen and wonder whether anything is happening.",
    "A booking or checkout step has to wait on someone else's server and the wait should feel measured rather than stuck.",
    "A portfolio, studio or craft brand wants its loading screen to look like a photograph of an object on a real desk.",
    "A job finishes in rounds, and the flip at the end of each round is a natural place to mark one batch done.",
  ],
  customize: [
    "`stages` holds the status lines; each has a `note` and the last percent it covers in `until`.",
    "`demo` is the script the preview follows, as pairs of percent and seconds. Delete the marked block in the frame loop and write your own number to `s.goal` for real progress. The sand follows that number with a lag, so a sudden jump still pours instead of teleporting.",
    "`SAND` is the colour of the grains in linear RGB. `[0.2, 0.42, 0.85]` gives a cobalt sand, `[0.95, 0.8, 0.45]` a natural beach sand.",
    "`SUNC` and `SUN` in the shader are the colour and direction of the sunlight; `pane()` draws the window it comes through, so changing its cell sizes changes the bars thrown across the desk.",
    "The wood is set in `wood()`: the two mixed colours are the dark and light of the grain. Darker values turn the ash into walnut.",
    "The turn is a spring in the `phase === 2` branch. Lower `K` for a slower, heavier turn; lower `D` for more overshoot.",
  ],
  accessibility: [
    "The canvas is decorative and hidden from screen readers. A real element with `role=\"progressbar\"` carries `aria-valuenow` and an `aria-valuetext` that reads the number and the current phase together.",
    "The phase line is a polite live region, so a new phase is announced once while the figures change silently.",
    "The one control, \"Turn the glass over\", is a native button with a visible focus ring; it finishes the current run and turns the glass.",
    "With reduced motion the scene renders once and stays still, the script does not play, and the button moves the number on in steps of twenty without any turning or pouring.",
  ],
  faqs: [
    {
      question: "How do I connect it to a real task?",
      answer: "The whole scene reads one value, `s.goal`, from 0 to 100. Remove the demo block at the top of the frame loop and set `s.goal` from your upload progress or your job status. When it reaches 100 and the sand has caught up, the glass turns over on its own and the number starts again from zero.",
    },
    {
      question: "Is the sand a picture or is it modelled?",
      answer: "It is modelled. The upper and lower heaps are solids described by a few heights: the level of the top bed, the depth of its crater, the bed and the peak of the lower cone. The renderer finds their surface pixel by pixel, then breaks it into grains a fraction of a millimetre across at this scale, some pale, some dark, a few catching the sun.",
    },
    {
      question: "What happens to the sand when it flips?",
      answer: "Nothing pours during the turn. The cone travels upside down with the glass, and once the frame has landed the shader describes the upper bulb by the shape of that old cone and lets it slump into the neck over about half a second. Only then does the stream start again.",
    },
    {
      question: "Why is the percentage not drawn inside the scene?",
      answer: "So it stays text. Screen readers, translation tools and copy and paste all work on it, it uses your page font at any size, and it does not cost the renderer anything. The picture only has to show the object.",
    },
    {
      question: "How heavy is it?",
      answer: "It is one fragment shader that ray marches a small scene inside a bounding sphere, with planes for the desk and wall solved directly. The drawing buffer is capped at about a million pixels and a device pixel ratio of 1.25, it stops drawing when it scrolls out of view or the tab is hidden, and it gives up resolution if frames start running long.",
    },
    {
      question: "What shows without WebGL?",
      answer: "A still made with gradients and clipped shapes in the same layout: the wall, the boards, a simple hourglass with sand at the right level and the number as text. The progress semantics and the button do not depend on the canvas.",
    },
  ],
  related: [
    "ray-traced-glass-pendant-loader-that-fills-with-glowing-liquid-and-focuses-a-point-of-light-under-a-wall-sized-percentage",
    "oil-and-water-liquid-timer-with-beads-that-rise-through-a-glass-hourglass-and-flip-to-restart",
    "brass-spinning-top-loader-that-chalks-a-spiral-and-stands-upright-when-done",
  ],
  tags: ["loader", "progress", "webgl", "ray marching", "hourglass", "sand", "shader", "percentage"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
