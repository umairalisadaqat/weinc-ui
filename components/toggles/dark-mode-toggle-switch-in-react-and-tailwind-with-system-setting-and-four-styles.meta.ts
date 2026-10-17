const meta = {
  slug: "dark-mode-toggle-switch-in-react-and-tailwind-with-system-setting-and-four-styles",
  category: "toggles",
  name: "Dark Mode Toggle Switch in React and Tailwind with System Setting and Four Styles",
  keyword: "dark mode toggle switch",
  title: "Dark Mode Toggle Switch in React and Tailwind | We.Inc",
  description: "Free dark mode toggle switch for React and Tailwind: four styles, follows the system setting and remembers the choice. Copy the code and paste it.",
  intro: "A working dark mode toggle switch in four styles that all drive one shared theme: a sun and moon pill, a light, system and dark segmented control, a square icon button and an animated switch where the sun turns into a moon over a night sky. The settings card around them really changes between light and dark, so you can see the result before you wire it into your own app. On first load it follows the device setting, and once someone picks a side the choice is saved in the browser. On phones each row stacks its label above its control and nothing scrolls sideways.",
  useWhen: [
    "Your app or docs site needs a theme switch in the header and you want one that reads the device setting before anyone touches it.",
    "A settings page should offer Light, System and Dark as three explicit choices rather than an on and off switch.",
    "A marketing page wants a playful toggle with a little character, such as the sky switch, without pulling in an animation library beyond framer-motion.",
    "You are comparing switch styles and want to try each one against the same real content before choosing.",
  ],
  customize: [
    "Change `STORAGE_KEY` to the name your app already uses, so an existing saved preference carries over.",
    "To theme a whole site instead of the preview card, add `document.documentElement.classList.toggle(\"dark\", mode === \"dark\")` in an effect inside `useTheme` and use Tailwind's `dark:` classes.",
    "Set `DEMO` to false before shipping: it only exists so the preview turns dark once on its own, and it never writes to storage. The focus colour lives in `ring`.",
    "Keep only the style you need: each control is its own function (`SunMoonPill`, `Segmented`, `IconButton`, `AnimatedSwitch`) and takes the values returned by `useTheme`.",
    "Make the motion snappier or softer through `SPRING`: a `damping` of 24 gives a little overshoot, 45 settles with none.",
  ],
  accessibility: [
    "The pill and the animated switch are buttons with `role=\"switch\"` and `aria-checked`, labelled Dark mode, so screen readers hear on or off.",
    "The segmented control is a `radiogroup` with roving focus: Tab lands on the chosen option and the arrow keys move and select, as a native radio set does.",
    "The icon button's label says what pressing it will do (Switch to dark mode), and a polite live line under the heading announces the mode now showing.",
    "All controls have a visible focus ring and are at least 40px tall. With reduced motion the icon swap fades instead of spinning.",
  ],
  faqs: [
    {
      question: "How does it follow the system setting?",
      answer: "The hook reads `matchMedia(\"(prefers-color-scheme: dark)\")` and listens for its change event. While the preference is System, the mode tracks the device live, so switching the operating system to dark at sunset flips the page without a reload.",
    },
    {
      question: "Where is the choice saved, and what if storage is blocked?",
      answer: "Light or Dark is written to `localStorage` under `STORAGE_KEY`; choosing System removes the key. Every read and write sits in try and catch, so in a private window or with storage blocked the toggle still works for that visit and simply forgets afterwards.",
    },
    {
      question: "How do I stop the white flash before the saved theme loads?",
      answer: "React runs after the first paint, so put a tiny inline script in the document head that reads the same key and the media query and adds the `dark` class to the html element before the body renders. The hook then takes over once the app mounts.",
    },
    {
      question: "Why do the two-state toggles never choose System?",
      answer: "A switch only has two positions, so pressing it pins the opposite of what is showing now. If you want people to be able to go back to following the device, keep the segmented control somewhere, for example on a settings page, alongside the quick switch in the header.",
    },
    {
      question: "Does it work with Next.js or server rendering?",
      answer: "Yes. The component starts as System and only touches `window` inside an effect, so the server and first client render match. Mark the file as a client component in the App Router.",
    },
  ],
  related: [
    "press-stud-snap-toggle-on-a-waxed-canvas-strap-that-pops-open-and-curls-back",
    "brass-dolly-light-switch-toggle-on-a-fluted-rose-that-snaps-over-and-lights-a-filament-wall-lamp",
    "guarded-toggle-switch-row-with-red-flip-up-safety-covers-you-lift-before-each-switch-will-arm",
  ],
  tags: ["dark mode", "theme toggle", "switch", "light mode", "system theme", "segmented control", "localStorage"],
  height: 640,
  interactive: true,
};

export default meta;
