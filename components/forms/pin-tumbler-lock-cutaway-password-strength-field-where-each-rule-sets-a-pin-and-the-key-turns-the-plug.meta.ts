const meta = {
  slug: "pin-tumbler-lock-cutaway-password-strength-field-where-each-rule-sets-a-pin-and-the-key-turns-the-plug",
  category: "forms",
  name: "Pin Tumbler Lock Cutaway Password Strength Field Where Each Rule Sets a Pin and the Key Turns the Plug",
  keyword: "password strength meter react",
  title: "React Password Strength Meter as a Pin Lock | We.Inc",
  description: "Password field with a strength meter drawn as a brass lock in section: each rule you meet sets a pin, then the key turns. Free React and HTML code to copy.",
  intro: "A new-password field whose strength meter is a door lock sawn in half. Above the field sits a brass cylinder in section with a nickel key already in the keyway, five spring-loaded pin stacks, and a bolt case behind. Each password rule owns one stack. While a rule is unmet its part of the key is uncut, so the steel key pin stands too tall and the copper driver above it straddles the line between plug and shell. Meet the rule and a cut is milled into the blade at that position, the stack drops, the join between the two pins lands exactly on the line and a small green lamp lights above the chamber. When all five agree, the plug rotates: the key turns edge on, the key pins swing out of the section, the drivers stay behind and the bolt slides out of its case. The key then comes back upright, so the resting picture of a strong password is every stack sitting on the line. Every keystroke also nudges the key and makes the pins hop. On phones the drawing shrinks to the screen width and the rules are repeated as a wrapped list of words under the field.",
  useWhen: [
    "A sign-up or change-password screen wants to explain the rules without a red list of complaints.",
    "A security product, password manager or locksmith site needs its form to make the point the brand makes.",
    "A teaching page about how locks or authentication work wants a diagram the reader can operate.",
    "An onboarding flow has one step that deserves a moment of delight before the dashboard.",
  ],
  customize: [
    "`rules` is the list of checks. Each entry has a `label` and a `test` function that receives the password. Four to six entries space themselves along the blade.",
    "`CUTS` holds the final depth of every cut in drawing units. Deeper numbers give longer key pins, so vary them or the stacks all look alike.",
    "`LAMP` colours the lamps, the glow on the shear line and the dots in the rule list. `#fbbf24` gives amber lamps on the brass.",
    "The shell colour is the five-stop gradient that starts `#f1d68c`. Replace the stops with greys for a nickel-plated cylinder.",
    "`DEMO` is the password the piece types for itself until someone focuses the field. Set it to an empty string to start with every pin unset.",
  ],
  accessibility: [
    "The drawing is hidden from assistive technology. The control is one labelled `input` with `autoComplete=\"new-password\"`, tied by `aria-describedby` to a live line that reads how many pins are set.",
    "Each rule in the list carries hidden text saying done or still needed, so the state is never told by the dot colour alone.",
    "The Show button is a real toggle with `aria-pressed` and switches the field between dots and plain text.",
    "With reduced motion nothing types by itself, and pins, plug and bolt jump straight to the state that matches the password.",
  ],
  faqs: [
    {
      question: "Is this how a real pin tumbler lock works?",
      answer: "The mechanism is faithful: a plug can only rotate when the gap in every pin stack lines up with the edge of the plug, and the cuts in the key set those heights. The liberty taken is that the key is cut while it is already in the lock, one position per rule, which no locksmith would attempt.",
    },
    {
      question: "How do I use the result in my form?",
      answer: "The component keeps the text in `value` and an array of booleans in `met`. `strong` is true when every rule passes. Lift `value` to the parent, disable your submit button until `strong`, and remove the `onSubmit` that currently cancels submission.",
    },
    {
      question: "Why does the key become a thin bar for a moment when the last pin sets?",
      answer: "The view is a side section, so a quarter turn of the plug shows the flat key edge on. Everything inside the plug is scaled vertically by the cosine of the turn angle about the plug axis, which is the projection you would see, and the key pins fade as they leave the cutting plane.",
    },
    {
      question: "Can I add a rule that checks a list of common passwords?",
      answer: "Yes. Add an entry to `rules` whose `test` returns false when the lower-cased password is in your list. It gets its own pin and lamp. For a check that needs the network, keep the result in state and read that state inside the `test`.",
    },
    {
      question: "Does the self-typing demo touch what a visitor has entered?",
      answer: "No. The first time the field receives focus the demonstration stops for good and the field is emptied so the visitor starts with a blank key. After that only their typing moves the pins.",
    },
  ],
  related: ["mechanical-key-switch-cutaway-input-with-a-stem-coil-spring-and-copper-leaf-that-move-as-you-type", "four-wheel-brass-combination-cable-lock-code-input-with-rings-that-click-round-and-a-cable-that-springs-free"],
  tags: ["password", "strength meter", "lock", "cutaway", "canvas", "brass", "form"],
  height: 720,
  interactive: true,
};

export default meta;
