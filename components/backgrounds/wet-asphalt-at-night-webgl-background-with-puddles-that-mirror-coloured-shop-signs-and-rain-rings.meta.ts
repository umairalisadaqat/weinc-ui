const meta = {
  slug: "wet-asphalt-at-night-webgl-background-with-puddles-that-mirror-coloured-shop-signs-and-rain-rings",
  category: "backgrounds",
  name: "Wet Asphalt at Night WebGL Background with Puddles That Mirror Coloured Shop Signs and Rain Rings",
  keyword: "wet asphalt neon reflection shader background",
  title: "React Shader Background: Wet Asphalt at Night | We.Inc",
  description: "Night street background in WebGL: a shader draws rain-soaked asphalt whose puddles mirror coloured shop signs and rain rings. Free React and HTML to copy.",
  intro: "You are looking down at a road just after rain, at night. The shop signs are across the street and out of frame, so all you see of them is what the road gives back: magenta, cyan, amber and green pulled into long streaks on the wet stone, and sharp upside-down shapes wherever a puddle lies flat. Drops still land in the puddles and throw out rings. A worn white line runs away from you, and the stone in the surface shows up in the foreground where the sign light rakes across it. The viewpoint sways slowly from side to side, which slides every reflection across the puddles, and the pointer moves it directly. A caption pill is the only thing drawn on top. On a phone the same road is framed taller, with more of the dark foreground.",
  useWhen: [
    "A bar, club night, late venue or record label wants a first screen that feels like the walk there.",
    "A film, game or music release page needs colour and atmosphere behind white type without using a still from the work itself.",
    "A dark product page wants movement that comes from light and weather, not from floating shapes.",
    "You are building a city guide or events listing and want a header that says night without showing any particular place.",
  ],
  customize: [
    "`street.signs` lists the five tube colours. Set them all to shades of one hue, for example ambers from `[1.0, 0.45, 0.1]` to `[1.0, 0.8, 0.4]`, for a sodium-lit back street.",
    "`street.water` moves the waterline. At `0.35` only the deepest dips hold a mirror; at `0.62` most of the road is one sheet.",
    "`street.rain` scales the rings. `0` gives still puddles after the shower has passed, `2` a downpour that breaks every reflection.",
    "Sign positions and sizes live in `across` in the shader as pairs of centre and half-size on a wall 14 units away. Move one up the wall and its reflection lands nearer the bottom of the screen.",
    "`street.patch` is the stretch of road you stand on: any other pair of numbers gives a new arrangement of puddles. `street.paint` set to `0` removes the white line.",
  ],
  accessibility: [
    "Nothing in the scene carries meaning, so the canvas and the CSS streaks behind it are marked `aria-hidden` and let pointer events through to whatever you layer above.",
    "Most of the frame is close to black but the streaks reach full brightness, so white text can vanish where it crosses one. Put copy in the lower half, or on a dark pill as the caption does.",
    "The magenta sign dips in brightness now and then like a tired tube. It is a small change in a reflection, not a full-screen flash, and with reduced motion on the scene is one fixed frame with no rain, sway or flicker.",
  ],
  faqs: [
    { question: "Where are the signs? I only see reflections.", answer: "They are never drawn directly. The camera is tilted down far enough that the horizon is above the top edge. Each pixel finds its point on the road, bounces the line of sight off the surface there, and follows it to a wall across the street where the signs are described as simple bars and a ring." },
    { question: "Why are the reflections long streaks on the road but sharp in the puddles?", answer: "Rough wet stone tilts the bounce by small amounts, and at a low viewing angle a small tilt towards or away from you moves the reflected point a long way up or down the wall. The shader models that by blurring each sign far more vertically than sideways when the surface is rough. Standing water is flat, so the blur drops to nearly nothing and you get a mirror." },
    { question: "How do the puddles get their shapes?", answer: "A slow noise gives the lie of the road and a constant, `street.water`, gives the water level. Anywhere the road is below that level is a puddle. The individual stones are added to the height, so at a puddle's edge they poke through the water one by one." },
    { question: "How is the rain done?", answer: "Two loose grids cover the road. Each square has one drop on a repeating timer, and its ring is a short wave that widens and fades. Only the slope of that wave is used, to tip the water surface, which is why you see rings as wobbles in the reflections and not as drawn circles." },
    { question: "What is the fallback?", answer: "Four blurred vertical gradients in the sign colours over near-black, fading towards the bottom. It appears immediately and stays if the shader cannot run." },
    { question: "Will it keep a phone warm?", answer: "It is the heaviest of this family because of the rings and the eleven sign shapes, so the canvas is held to `street.maxPixels`, 950,000, and `street.quality` starts at `0.8`. The frame loop stops off screen and in hidden tabs. Setting `street.rain` to `0` saves the most." },
  ],
  related: ["polished-terrazzo-floor-webgl-background-with-marble-chips-and-brass-strips-that-catch-a-moving-lamp", "brass-armillary-sphere-background-with-nested-rings-that-turn-about-a-tilted-axis-and-catch-the-lamp", "marbled-paper-webgl-background-with-floating-inks-combed-into-feathers-on-a-wet-size-bath"],
  tags: ["webgl", "shader", "asphalt", "rain", "night", "reflection", "puddles", "background"],
  height: 760,
  section: true,
};

export default meta;
