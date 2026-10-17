const meta = {
  slug: "photoreal-login-page-html-css-with-show-password-remember-me-and-a-cut-glass-door-knob-in-window-light",
  category: "forms",
  name: "Photoreal Login Page HTML CSS with Show Password, Remember Me and a Cut Glass Door Knob in Window Light",
  keyword: "login page html css",
  title: "Login Page HTML CSS with Show Password and Photo Panel | We.Inc",
  description: "Free React login page: email, password with show and hide, remember me, forgot link and two sign-in options, beside a WebGL cut glass knob in late sun.",
  intro: "A split sign-in screen. On the left sits the form people expect: email, a password field with a show and hide toggle, a remember me box, a forgot password link, one dark sign-in button and two alternative routes, a work account and a passkey, each with a plain line icon. On the right, an eight-sided cut glass door knob stands on a worn brass rose on a limewashed terracotta sill, with low sun from a window behind it laying a pool of light and bar shadows across the plaster. Light passing through the glass gathers into a bright ring inside the knob's shadow. The picture is a single fragment shader that averages many jittered frames, so facets, the soft far sill and the shadow edges settle into a clean still in about a second and then drawing stops. When the form passes its checks the knob turns as if the door were opening, then springs back. Nothing is sent anywhere: the submit handler is the one place to call your own sign-in code. On a phone the photo becomes a short band above the form.",
  useWhen: [
    "A product, studio or members area needs a sign-in screen that feels considered rather than a bare centred card.",
    "You want a login form with the details people look for, show password, remember me, inline errors, already wired and accessible.",
    "A brand built on craft, interiors, property or hospitality wants its first screen to carry a real object instead of an illustration.",
    "You need a reference for putting a WebGL panel next to an ordinary HTML form without the form depending on it.",
  ],
  customize: [
    "All visible words live in the `copy` object at the top: eyebrow, headline, lead line, button text and the sign-up prompt.",
    "Put your real sign-in call inside `onSubmit`, after the line that says demo only. Leave `turn.current.kick = true` there if you want the knob to turn on success, or move it into your success branch.",
    "`MIN_PASSWORD` sets the length check and the placeholder; `EMAIL_RE` is the email pattern. Error text is written in `validate`.",
    "Change the sill colour with `SILL` in the scene string, the glass tint with `GLASS_ABS` (larger numbers mean deeper colour), and the sun with `KEY_DIR`, `KEY_COL` and `WIN_OFF` in the rig settings.",
    "`TURN` is how far the knob rotates in radians; the spring values 70 and 13 in `springStep` set how slowly it turns and settles.",
  ],
  accessibility: [
    "Every input has a visible label. Errors appear under their field, are linked with aria-describedby, mark the field aria-invalid, and focus moves to the first field that needs fixing.",
    "The show password control is a real button with aria-pressed, aria-controls and a label that switches between Show password and Hide password. The browser keeps current-password autocomplete so password managers still fill it.",
    "Status messages for sign-in, forgot password and the two alternative routes are read from a polite live region. The photo panel is hidden from screen readers.",
    "With reduced motion the knob never turns. Without WebGL 2 the photo panel becomes a still: the same terracotta, window light and an octagon of glass.",
  ],
  faqs: [
    { question: "How do I connect this login page to a real backend?", answer: "Replace the demo lines in onSubmit with your request, for example a fetch to your sign-in endpoint or your auth library's sign-in function. Keep preventDefault, set an error message from the response if it fails, and trigger the knob only when it succeeds." },
    { question: "Does the show password button stop password managers working?", answer: "No. The field keeps its name and current-password autocomplete whether it is shown as text or dots, so saved passwords still fill in. Switching the type is the standard way to reveal a password." },
    { question: "Why are there no Google or Apple buttons?", answer: "The two alternative routes use generic icons so you can add whichever providers you actually support. Swap the label and icon on each button and call your provider's sign-in in its click handler." },
    { question: "Will the 3D panel slow down sign-in?", answer: "The form never waits for it. The canvas renders for about a second, then stops drawing, pauses when off screen or in a hidden tab, and caps its resolution. If WebGL is unavailable the page shows a CSS still instead." },
    { question: "Can I remove the photo panel and keep only the form?", answer: "Yes. Delete the right-hand div with the canvas and the effect that creates the stage, and change the grid to one column. The form works on its own." },
  ],
  related: [
    "ray-marched-brass-hotel-key-sign-in-form-where-the-key-swings-toward-a-lock-case-on-green-leather-as-you-type-and-throws-the-bolt-on-submit",
    "glassmorphism-card-css-with-frosted-navbar-login-panel-and-stat-chips-over-a-photo",
    "pin-tumbler-lock-cutaway-password-strength-field-where-each-rule-sets-a-pin-and-the-key-turns-the-plug",
  ],
  tags: ["forms", "login", "sign in", "password", "webgl", "photoreal", "glass", "brass"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
