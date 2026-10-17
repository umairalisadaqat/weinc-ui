const meta = {
  slug: "machined-aluminium-prompt-block-with-a-slot-that-swallows-a-typed-card-and-hands-back-a-printed-homepage",
  category: "originals",
  name: "Machined Aluminium Prompt Block with a Slot That Swallows a Typed Card and Hands Back a Printed Homepage",
  keyword: "react prompt input component",
  title: "React Prompt Input Component with a Card Slot | We.Inc",
  description: "Prompt box drawn as an aluminium block: type on a card, the slot swallows it, a light pipe fills blue and a homepage rises out. Free React and HTML code.",
  intro: "A prompt box built as a desk object. A block of brushed aluminium sits on a dark table with a slot milled into its top face, and a warm white card stands in the slot. The card is the text field: click it and type one sentence about a business. Press Enter or the black key on the block and the card drops into the metal, blue light leaks from the slot, a glass light pipe across the face fills from left to right, and a taller card springs back up carrying a small homepage with a menu, a headline, a photograph and a blue button. Left alone, the block feeds itself three sample cards for a bakery, a surf school and a florist. The whole scene is one fixed drawing that scales to the width it is given, so on a phone the card, slot and key keep their proportions and nothing scrolls sideways.",
  useWhen: [
    "The first screen of a site builder or studio page where the only thing you want a visitor to do is type a sentence.",
    "A waitlist or launch page that needs one memorable object and no feature grid around it.",
    "A product tour step that explains brief in, page out, without a screenshot of a real interface.",
    "A dark portfolio or agency homepage where the enquiry box should feel like hardware.",
  ],
  customize: [
    "Sample cards live in the `briefs` array at the top: `sentence` is typed onto the card, and `brand`, `links`, `headline`, `cta`, `note` and `src` fill the page that comes back.",
    "To send the sentence to your own backend, call it inside `submit` before `feed`, then pass your result to `feed` in the shape that `pageFrom` returns.",
    "`HOLD` is how long a finished page stands during the self-running demo. Raise 4400 to 8000 for a slower loop.",
    "The accent is the `BLUE` constant. It colours the stripe on the card, the slot light, the light pipe and the page button together.",
    "The metal is the `BRUSH` pattern over a five stop grey gradient on the face. Swap the greys for `#3a3d44` to `#16181c` for a black anodised block.",
  ],
  accessibility: [
    "The card holds a real `textarea` with a label, a character limit and a blue caret, so it works with a keyboard, a screen reader and phone autofill like any other field.",
    "Enter submits and the black key is a `button` with a visible focus ring; its text changes from Feed card to New card so the action is always named.",
    "When a page has been printed, its headline is announced once through a polite status line. The sample typing is not announced letter by letter.",
    "With reduced motion the scene opens on a finished page, the demo loop does not run, and a submitted card swaps for its page without travel.",
  ],
  faqs: [
    {
      question: "Is the card a real input or a drawing of one?",
      answer: "It is a real `textarea` positioned on the card. You can select, paste, use dictation or an on-screen keyboard. The component only strips line breaks and limits the length to `MAX` characters so the sentence always fits the card.",
    },
    {
      question: "How does the card disappear into the block?",
      answer: "Both cards sit inside a container with hidden overflow whose bottom edge is the slot. Moving a card down by its own height slides it past that edge, and the lip of the block is drawn on top, so it reads as going into the metal with no masking tricks.",
    },
    {
      question: "What does the page show when a visitor types their own sentence?",
      answer: "The `pageFrom` function turns their words into a headline and draws a blue layout sketch where the photograph would be. Replace that function with a call to your own generator if you have one.",
    },
    {
      question: "Will the self-typing demo fight with a visitor who starts typing?",
      answer: "No. Focusing the card, typing, or pressing the key sets a flag, clears every pending timer and empties the card. The demo does not start again until the page is reloaded.",
    },
    {
      question: "Why does the highlight on the metal move?",
      answer: "A pointer listener writes one CSS variable, `--mx`, and a soft white band on the face is positioned with it. No React state changes while the pointer moves.",
    },
  ],
  related: ["proof-press-with-a-steel-cylinder-that-rolls-a-typed-brief-into-a-printed-homepage", "publish-button-that-fires-a-rolled-up-site-up-a-glass-pneumatic-tube", "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put"],
  tags: ["prompt box", "input", "aluminium", "card slot", "homepage", "hardware", "originals"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
