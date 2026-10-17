const meta = {
  slug: "four-wheel-brass-combination-cable-lock-code-input-with-rings-that-click-round-and-a-cable-that-springs-free",
  category: "inputs",
  name: "Four-Wheel Brass Combination Cable Lock Code Input with Rings That Click Round and a Cable That Springs Free",
  keyword: "react otp input combination lock",
  title: "React OTP Input as a Combination Lock | We.Inc",
  description: "One-time-code input drawn as a bike cable lock: type, roll or drag the brass number rings and the cable springs free when right. Free React and HTML code.",
  intro: "A four digit code field dressed as the cable lock you would loop through a bicycle frame. The barrel lies on a pale table with four brass rings between two graphite end caps, and a red vinyl cable arcs over the top from one end to the other. Each ring is a real text field. Type a digit and that ring rolls the short way round to it, overshoots a hair and settles, then focus moves to the next ring. You can also roll a ring with the up and down arrows or by dragging it with a finger. The numerals are foreshortened as they pass over the top and bottom of the ring, and the knurled shoulders travel with them. When all four rings read the code, the steel pin leaves its socket and the free end of the cable springs up and sways. On a phone the whole lock scales to the width of the screen and each ring stays tall enough to hit with a thumb.",
  useWhen: [
    "A sign-in or checkout step asks for a short numeric code from a text message and the page has room for one memorable object.",
    "A bike shop, locker hire, storage or luggage brand wants the verification step to look like the product.",
    "A landing page hides a discount or a download behind a code printed on a card or said in a video.",
    "An escape-room or puzzle page needs a combination that visitors can actually dial.",
  ],
  customize: [
    "`CODE` is the combination. The number of rings follows its length, so `\"471960\"` draws six. Lower `WHEEL_W` from 80 to about 56 when you go past four so the barrel still fits.",
    "`CABLE` colours the sleeve and both index arrows. `#1f6f5b` gives a bottle green cable, `#1d1d1f` a plain black one.",
    "The `BRASS` list of gradient stops paints the rings. Swap it for the `STEEL` list a few lines below to get nickel rings.",
    "Ring feel is the pair `210` and `19` in the frame loop (stiffness and damping). Raise 19 to 30 for a ring that stops dead with no overshoot.",
    "`HINT` is the caption shown while locked. Replace it with where the code was sent, and remove the digits from it before you ship.",
  ],
  accessibility: [
    "Every ring is an `input` with `inputMode=\"numeric\"` and its own label such as Digit 2 of 4, grouped in a `fieldset` whose legend names the code. The canvas is hidden from assistive technology.",
    "Digits can be typed, pasted as a group, or stepped with Up and Down. Left, Right and Backspace move between rings, so nothing depends on dragging.",
    "The caption is a polite live region that changes from Locked to Code accepted, which is how a screen reader user learns the cable has let go.",
    "With reduced motion the rings jump to their digit, the cable is drawn already open or already shut, and the self-playing demonstration does not run.",
  ],
  faqs: [
    {
      question: "How do I check the code on my server instead of in the browser?",
      answer: "Remove the comparison with `CODE` and keep only the `digits` state. When the fourth ring is set, send `digits.join(\"\")` to your endpoint and store the answer in a piece of state, then use that state in place of the `open` constant and in the `matches` function inside the effect. The cable follows whatever that returns.",
    },
    {
      question: "Why do the numbers look squashed near the top and bottom of a ring?",
      answer: "Each numeral sits at an angle on a cylinder. Its height on screen is multiplied by the cosine of that angle and its position by the sine, which is what a real ring does when you look at it side on. A dark gradient over both horizons finishes the curve.",
    },
    {
      question: "Does the browser offer the code from a text message?",
      answer: "The first ring carries `autoComplete=\"one-time-code\"`, and a paste into any ring fills all of them from the digits it finds. On phones that suggest the code above the keyboard, tapping the suggestion is treated the same as a paste.",
    },
    {
      question: "What happens when the wrong code is entered?",
      answer: "A cable lock gives no error, it just stays shut. When the last ring is typed and the four digits do not match, the free end is given a short tug so the cable twitches against the pin, and the caption keeps saying Locked.",
    },
    {
      question: "Can a ring roll forever in one direction?",
      answer: "Yes. Ring positions are kept as running totals, not as values from 0 to 9, so going from 9 up to 0 turns one face forward instead of spinning nine faces back. The same trick lets the demonstration give each ring a full extra turn when it scrambles.",
    },
  ],
  related: ["steel-safe-promo-code-reveal-with-a-combination-dial-you-turn-and-a-thick-door-that-swings-open", "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put"],
  tags: ["otp", "code input", "combination lock", "canvas", "brass", "verification", "skeuomorphic"],
  height: 700,
  interactive: true,
};

export default meta;
