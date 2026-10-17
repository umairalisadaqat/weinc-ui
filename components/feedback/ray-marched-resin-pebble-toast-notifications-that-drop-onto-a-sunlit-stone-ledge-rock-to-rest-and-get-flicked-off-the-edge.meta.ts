const meta = {
  slug: "ray-marched-resin-pebble-toast-notifications-that-drop-onto-a-sunlit-stone-ledge-rock-to-rest-and-get-flicked-off-the-edge",
  category: "feedback",
  name: "Ray-Marched Resin Pebble Toast Notifications That Drop onto a Sunlit Stone Ledge, Rock to Rest and Get Flicked off the Edge",
  keyword: "react toast notification webgl",
  title: "3D Resin Pebble Toast Notifications (React, WebGL) | We.Inc",
  description: "Free React toasts cast as resin pebbles in a WebGL shader. Each drops on a sunlit ledge, rocks still, and is flicked off when dismissed.",
  intro: "A toast stack you can feel land. Every notice is a lozenge of cast pastel resin, ray-marched in a fragment shader, with its title and a mark printed on the flat top. A new one falls onto a honed travertine ledge in afternoon sun, bounces once, rocks on its curved base and comes to rest, while the others are shoved one place along the stone. Dismiss one and it winds up toward you for a moment, then is flicked away across the stone and drops off the far edge into the garden. The sun sits low behind the ledge, so light passes through the resin and each pebble throws a tinted shadow toward you with a bright gathered core, while leaf shade drifts over the back of the stone. Mint means done, apricot means check and coral means failed, but the printed mark, the word and the label in the panel say the same thing without colour. Beside the ledge the newest notice is set large in a serif with a dismiss button, older ones sit in a short list, and three buttons drop a fresh one of each kind. On phones the camera swings round so the row runs away from you and four pebbles still fit, and the panel sits underneath on a frosted card.",
  useWhen: [
    "A product page wants to show off its notification system with something more memorable than a grey bar in the corner.",
    "A calm, crafted brand such as a ceramics shop, a garden studio or a stationery maker needs feedback that matches its look.",
    "You want a reference for toasts that announce themselves properly, keep a short history and can be cleared one at a time by keyboard.",
    "A portfolio needs a bright, sunlit WebGL piece that is not another chrome sphere on black.",
  ],
  customize: [
    "`FEED` is the list of demo notices. Each has a `kind`, a short `title` that gets printed on the pebble and a `body` sentence for the panel. Keep titles under about ten characters so they fit the stone.",
    "`KINDS` sets each kind's resin colour in linear RGB (`resin`), the CSS colour of the small badges (`css`), the ink for text on light ground (`ink`) and the word shown with it (`label`).",
    "`MAX` is how many pebbles fit on the ledge before the oldest is flicked off; `STEP` is the spacing between them. Raise `STEP` above 1.33 if you make the pebbles wider in `RAD`.",
    "The weight of a landing lives in `physics`: gravity `17`, the bounce `0.26` and the rocking springs `58` and `70`. Lower the `2.6` and `2.8` damping values for a longer, looser wobble.",
    "The sun is the `L` vector and `SUNC` colour in the shader. It sits behind the ledge so the resin is backlit; lower its `y` value for longer shadows, or warm `SUNC` toward orange for late evening.",
  ],
  accessibility: [
    "Every notice exists as real text: the newest in an `h2` with its sentence, the rest in a list, each with a 40 pixel dismiss button whose label names the notice. Escape clears the newest.",
    "New notices are announced through a polite status region, and failures through an alert region so they interrupt. The canvas is hidden from assistive technology.",
    "Kind is carried three ways: the printed mark, the word on the badge and the colour. Mint, apricot and coral are also far apart in lightness.",
    "With reduced motion pebbles appear and vanish in place, the leaf shade and the self-running demo stop, and the frame refines and then stops drawing.",
  ],
  faqs: [
    {
      question: "How are the words printed on curved 3D pebbles?",
      answer: "Each notice is drawn once into a row of an offscreen canvas: the mark and the title in heavy white type on black. That canvas becomes a texture. When a ray hits the flat top of a pebble, the hit point is turned into the pebble's own coordinates, which become texture coordinates in that pebble's row, and the ink darkens the resin there. Because it lives in the pebble's frame, the print rocks and slides with it.",
    },
    {
      question: "Why do the shadows have colour and a bright spot in them?",
      answer: "For every point on the ledge the shader asks how far a ray toward the sun travels inside each pebble, treating it as an ellipsoid it can solve exactly. A long path absorbs more of the colours the resin does not reflect, so the shade is tinted. Rays that pass close to the middle of the lens are bent together, so a small core of brighter light is added there.",
    },
    {
      question: "How does a pebble rock instead of just bouncing?",
      answer: "Its height above the stone is the lowest point of a tilted ellipsoid, worked out from the two tilt angles. Landing hands some of the fall to those angles, and a spring pulls each back toward level with light damping, so it rocks a few times on its curved base. Sliding along the ledge tips it slightly against the push, and a heavy landing gives its neighbours a small shiver.",
    },
    {
      question: "Can I use it as a real toast system?",
      answer: "Yes. `push` takes a notice, adds it to the front of the list, flicks the oldest off if the ledge is full and announces it. `dismiss` takes an id. Move them into a context or store and call them from anywhere in your app. Remove the demo block in the frame loop when you do.",
    },
    {
      question: "What happens on a phone or without WebGL?",
      answer: "On narrow screens the camera swings round so the row of pebbles runs away from you and four still fit, and the notice panel sits on a frosted card below. Without WebGL 2 a still made of soft CSS shapes shows the same pebbles and words, and the panel works exactly the same.",
    },
  ],
  related: [
    "brass-counter-bell-notification-that-rings-and-raises-a-message-card-from-a-slot-in-the-desk",
    "kitchen-order-rail-notifications-with-printed-paper-tickets-that-slide-under-a-steel-rail-swing-and-pull-off",
    "ray-marched-tangerine-resin-rocker-switch-with-a-lamp-inside-that-glows-through-the-plastic-and-spills-across-a-lilac-table",
  ],
  tags: ["toast", "notification", "alert", "webgl", "ray marching", "shader", "physics", "resin"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
