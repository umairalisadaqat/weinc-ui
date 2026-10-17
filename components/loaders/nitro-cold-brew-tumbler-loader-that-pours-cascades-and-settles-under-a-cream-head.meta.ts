const meta = {
  slug: "nitro-cold-brew-tumbler-loader-that-pours-cascades-and-settles-under-a-cream-head",
  category: "loaders",
  name: "Nitro Cold Brew Tumbler Loader That Pours, Cascades and Settles Under a Cream Head",
  keyword: "react canvas loading animation glass",
  title: "React Canvas Loading Animation: Cold Brew Glass | We.Inc",
  description: "Loader on a canvas: a tumbler is poured full of nitro coffee, the surge cascades down the wall and settles under a cream head. Free React and HTML code.",
  intro: "A loader that borrows the one thing people happily wait for at a coffee bar. A thick tumbler stands alone on a warm paper-coloured stage. Coffee is poured in as a tan cloud, bands of tiny bubbles fall down the inside of the glass, and the dark drink clears from the floor upward while a cream head thickens on top. How far the drink has cleared is the percentage shown under the glass. When it is ready the level drops, leaving rings of foam on the wall, and the next glass is poured. Moving the pointer slides the reflections, crossing the glass rocks the surface, and a click or the Enter key asks for a fresh pour. The drawing keeps its proportions down to a 360 pixel phone.",
  useWhen: [
    "A cafe, roastery or bar ordering page needs something to show while an order is being placed or a menu is fetched.",
    "A long job such as an export or a render deserves a wait screen with more character than a spinning ring.",
    "A brand site for a drink wants a looping hero object that needs no video file.",
    "You have a real progress number and want it shown as a glass settling instead of a bar filling.",
  ],
  customize: [
    "`VALUE` is `null` for the self-running loop. Give it a number from 0 to 1 and the glass stays full while the dark line climbs to that fraction.",
    "`COFFEE`, `SURGE` and `CREAM` are the three colours of the drink. `#3a1206`, `#b5522a` and `#f1dcc0` make a red ale, and the amber light in the foot of the glass follows `COFFEE`.",
    "`POUR`, `SETTLE`, `HOLD` and `DRAIN` are the lengths of the four parts of the loop in seconds. A `SETTLE` of 3 suits a short wait.",
    "`RT` and `RB` are the radius of the rim and of the foot. Make them equal for a straight highball, or raise `BASE` from 34 for an even heavier bottom.",
    "The stage colour is the `bg-[#e9e1d3]` class and the radial gradient beside it on the outer element.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The line under the glass is a `progressbar` with `aria-valuenow`, so a screen reader can read the percentage and the current stage on request.",
    "The glass is a real button named after the drink, reachable with Tab and worked with Enter or Space, and it shows a focus ring.",
    "With reduced motion the loop never starts: the glass is drawn once, full and settled, and the label reads Ready.",
  ],
  faqs: [
    {
      question: "How is the falling cloud drawn without a fluid simulation?",
      answer: "One 256 pixel tile of wavy bubble bands is generated when the component mounts. Each frame it is painted twice at different sizes and speeds into a small off-screen canvas, then cut by a soft vertical mask whose edge is the line where the drink has cleared. Moving that edge up is all the settling there is.",
    },
    {
      question: "Why does the dark coffee look round and not like a flat brown shape?",
      answer: "A glass of dark liquid lets light through only near its sides, where the path through the drink is short. A horizontal gradient paints thin amber slivers at both edges and near-black between them, and the thick foot repeats the colour as a lens would.",
    },
    {
      question: "Can I connect it to a real upload or fetch?",
      answer: "Turn `VALUE` into a prop or a piece of state and pass in your fraction. The frame loop eases toward whatever number it finds, so irregular updates still look smooth.",
    },
    {
      question: "What are the pale rings left on the glass when it empties?",
      answer: "That is lacing, the foam a head leaves behind as the level drops. It is drawn once into its own canvas as broken arcs and shown only above the current surface, so it appears as the drink goes down and is covered again by the next pour.",
    },
    {
      question: "Is it heavy to run?",
      answer: "The frame is a few dozen gradient fills plus two pattern fills into a small off-screen canvas that is scaled up. Device pixel ratio is capped at 2, and the loop stops when the glass is off screen or the tab is in the background.",
    },
  ],
  related: ["glass-test-tube-rack-bar-chart-with-dyed-liquid-that-rises-sloshes-and-settles-on-each-value", "oil-and-water-liquid-timer-with-beads-that-rise-through-a-glass-hourglass-and-flip-to-restart", "steel-ball-bearing-loader-that-drops-a-ball-into-the-race-for-every-tenth-loaded"],
  tags: ["loader", "glass", "liquid", "coffee", "canvas", "progress", "skeuomorphic"],
  height: 760,
  interactive: true,
};

export default meta;
