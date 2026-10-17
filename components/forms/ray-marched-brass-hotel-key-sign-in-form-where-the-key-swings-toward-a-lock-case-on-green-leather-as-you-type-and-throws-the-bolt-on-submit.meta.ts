const meta = {
  slug: "ray-marched-brass-hotel-key-sign-in-form-where-the-key-swings-toward-a-lock-case-on-green-leather-as-you-type-and-throws-the-bolt-on-submit",
  category: "forms",
  name: "Ray-Marched Brass Hotel Key Sign-In Form Where the Key Swings Toward a Lock Case on Green Leather as You Type and Throws the Bolt on Submit",
  keyword: "3d login form react webgl",
  title: "3D Brass Key Sign-In Form in WebGL (React, Tailwind) | We.Inc",
  description: "Free React sign-in form beside a WebGL brass key on green leather. Fill it in and the key swings to the lock; sign in and it turns and throws the bolt.",
  intro: "A two-column login section for a hotel, a members' club or any product that wants its front door to feel like one. On the left sits an ordinary form: an email field, a password field, a forgotten-password link and one button, set in a large serif headline over plain sans labels. On the right a fragment shader traces a brass room key with an ivory oval fob, lying on a green leather desk top beside a brass box lock, lit by low sun through a window whose glazing bars fall across the leather. As the two fields fill, the key drags itself round on the leather until it points at the keyhole. Submitting a valid pair lifts it, rolls its bit downward, pushes it into the lock and gives it a quarter turn, and the bolt shoots out of the face of the case. Pressing the button again turns it back and lays it down. Below 1024 pixels the picture moves above the form at a fixed height and the camera pulls back so the lock and key stay whole.",
  useWhen: [
    "A boutique hotel or serviced apartment brand wants its guest login to feel like collecting a key at the desk.",
    "A members' club, private library or wine society needs a sign-in page with more ceremony than a plain card.",
    "You are building a marketing preview of an account area and want the login itself to be the screenshot people share.",
    "A design portfolio needs one piece that shows live form state driving a rendered 3D scene without a 3D library.",
  ],
  customize: [
    "`copy` at the top holds every visible sentence, including both headlines, the field labels, the button text and the two error messages. `DEMO_EMAIL` and `DEMO_PASSWORD` are what the idle demo types.",
    "The key poses are the `REST`, `NEAR`, `READY` and `IN` objects. Move `REST` to start the key further away, or change `NEAR.yaw` to alter how squarely it ends up facing the lock before sign-in.",
    "`LEATHER` in the shader sets the desk colour; `vec3(0.11, 0.03, 0.025)` gives oxblood and `vec3(0.06, 0.05, 0.1)` a navy blotter. `BRASS` is the metal tint, and `vec3(0.95, 0.93, 0.9)` turns everything to nickel.",
    "`SUN` is the direction of the window light and `SUNC` its colour and strength. The `pane()` function draws the window bars, so changing its `2.0` and `1.7` spacings changes the pattern of light on the leather.",
    "The turn is a spring: `520` is its stiffness and `22` its damping in the `turn` phase. Lower the damping to 12 for a springier, more bouncing quarter turn.",
  ],
  accessibility: [
    "The canvas is decorative and hidden from assistive technology. Both inputs have visible labels tied by `htmlFor`, and the password field is a normal `type=\"password\"` input that browsers and password managers treat as usual.",
    "Validation runs on submit only. Each problem is written as text under its own field, linked with `aria-describedby`, the field gets `aria-invalid`, and focus moves to the first one that needs fixing.",
    "The success line sits in a polite live region and is only filled after a real submit, so screen readers hear that the sign-in worked and never hear the demo. Every control has a strong focus ring, and the green button text passes 4.5 to 1 on its background.",
    "With reduced motion the demo never runs and the key does not travel: the scene is traced once and simply changes to the new state. The idle demo also stops the moment the form gains focus, so it never types under a keyboard user. Without WebGL an SVG drawing of the same desk takes its place.",
  ],
  faqs: [
    {
      question: "Does this form send my password anywhere?",
      answer: "No. The submit handler calls `preventDefault`, checks that the email looks like an address and that the password has at least eight characters, then only changes state on the page. To wire it up, send `email` and `password` to your own sign-in endpoint inside `submit` and call `api.current?.open(true)` only when your server agrees.",
    },
    {
      question: "How does typing move a 3D object without a 3D library?",
      answer: "The fields compute a single number from 0 to 1 for how complete the form is. A spring in the animation loop chases that number, blends the key between its resting and its near pose, and hands the result to the shader as a position, a heading and a roll. The shader rotates every point into the key's own frame before measuring the distance to it, so moving the key costs nothing extra.",
    },
    {
      question: "How is the brass made to look like metal?",
      answer: "Metal has no diffuse colour, so the shader colours only reflections. It reflects a simple room with a bright window and a lamp, tints the result with the brass colour, adds a sharp highlight from the sun, and raises the roughness and darkens the tint where ambient occlusion says a corner is tucked away, which reads as old polish and tarnish.",
    },
    {
      question: "Why is the background blurred but the keyhole sharp?",
      answer: "Each frame shoots its rays from a slightly different point on an imaginary lens aimed at the same focal plane through the keyhole. Frames are blended into a floating point buffer, so after a second or so of stillness the leather far from that plane is soft, as it would be through a camera at a wide aperture.",
    },
    {
      question: "Will it run on a phone?",
      answer: "It caps the drawing buffer at about a million pixels and at 1.5 times device pixel ratio, and if frames take too long it lowers the resolution further. It stops drawing when the section is off screen or the tab is hidden, and once the scene is still it finishes refining and goes idle.",
    },
  ],
  related: [
    "ray-marched-rose-soap-bar-email-input-that-stamps-each-typed-letter-into-the-soap-and-slides-away-across-wet-green-tiles-when-sent",
    "pin-tumbler-lock-cutaway-password-strength-field-where-each-rule-sets-a-pin-and-the-key-turns-the-plug",
    "hotel-room-key-and-enamel-fob-on-a-brass-ring-that-swing-and-knock-together",
  ],
  tags: ["login form", "sign in", "password field", "webgl", "ray marching", "shader", "brass", "depth of field", "skeuomorphic"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
