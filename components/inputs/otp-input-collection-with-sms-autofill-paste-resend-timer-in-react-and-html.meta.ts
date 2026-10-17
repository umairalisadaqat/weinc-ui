const meta = {
  slug: "otp-input-collection-with-sms-autofill-paste-resend-timer-in-react-and-html",
  category: "inputs",
  name: "OTP Input Collection with SMS Autofill, Paste and a Resend Timer in React and HTML",
  keyword: "otp input",
  title: "OTP Input: 6 One-Time Code Fields in React and HTML | We.Inc",
  description: "Free OTP input fields in React and plain HTML: SMS autofill with one-time-code, paste of the full code, auto-advance, error state and a resend countdown.",
  intro: "Six one-time code inputs you can copy without installing a package. The first uses the pattern most sign-in screens should start with: one real text field, made invisible and laid over six drawn boxes, so the browser's code suggestion, a pasted code and the WebOTP API all fill it the same way. The others cover separate boxes that jump forward and back, a verify form with an announced error and a 30 second resend countdown, a dark field that submits itself on the last digit, a masked four-digit PIN and an eight-character invite code with letters. Two of them also come as plain HTML with a small CSS block and a short script. On a phone the number pad opens for every numeric field and the boxes shrink to fit a 360px screen.",
  useWhen: [
    "A sign-up, login or checkout step sends a code by text message or email and you want the phone to offer that code above the keyboard.",
    "You are replacing an OTP package that breaks paste or screen readers and want a field you fully control in about sixty lines.",
    "A second sign-in step asks for an authenticator app code and should submit as soon as all six digits are in.",
    "A banking or kiosk style screen needs a short PIN that stays masked until the person chooses to reveal it.",
    "Team invites or gift cards use a code made of letters and numbers that people often paste with a dash in the middle.",
  ],
  customize: [
    "Change the code length with the LENGTH, SIZE or DIGITS constant at the top of each piece; the grid uses grid-cols-6, so update that class to match (grid-cols-4, grid-cols-8).",
    "Restyle the active box by editing border-indigo-600 ring-indigo-600/25 in the single field piece, or focus:border-slate-900 in the split boxes.",
    "Set your own resend delay with RESEND_AFTER in the verify piece (seconds), and replace the DEMO_CODE comparison with a call to your server.",
    "For the HTML versions, the colours live in the style block: #4f46e5 for the active box and #be123c for errors. Keep the .otp-input rules as they are, because they keep the real field clickable.",
  ],
  accessibility: [
    "Each code is one labelled text field whenever possible, so a screen reader hears 'Verification code, edit text' once instead of six unlabelled boxes. The drawn boxes are aria-hidden.",
    "The split version labels every box 'Digit 1 of 6' and wraps them in a group named by the visible heading, with the help text linked through aria-describedby.",
    "Errors set aria-invalid and appear in a role=alert paragraph that is added to aria-describedby. Resend and success messages use role=status so they are announced without stealing focus.",
    "Fields use a 16px font size inside the invisible input, which stops iOS from zooming the page on focus. Keep it when you restyle.",
  ],
  faqs: [
    {
      question: "Why one hidden input instead of six separate inputs?",
      answer: "A single field receives an autofilled or pasted code in one go, keeps one label for assistive technology and needs no focus juggling. Six inputs can work, as the split piece shows, but you have to handle paste, Backspace and arrow keys yourself and put autocomplete=\"one-time-code\" only on the first box.",
    },
    {
      question: "What does autocomplete=\"one-time-code\" actually do?",
      answer: "MDN lists one-time-code as the autocomplete token for a one-time password used to verify identity, typically received by text message, email or an authenticator app. Browsers and password managers use it to decide whether to offer a code they have seen. It is a hint, so the field still has to accept typing and paste.",
    },
    {
      question: "How does the WebOTP API fill the code on Android?",
      answer: "Call navigator.credentials.get with an otp option and transport set to sms. When a text arrives whose last line is the at sign, your domain, a space and a hash before the code, the browser asks the person to allow it and then resolves with an object whose code property holds the digits. MDN marks it as available in Chromium browsers on Android only, so feature detect OTPCredential and keep autocomplete as the main path.",
    },
    {
      question: "Should the code field be type=\"number\"?",
      answer: "No. A number field drops leading zeros, can change value on scroll and adds spin arrows. Use type=\"text\" with inputmode=\"numeric\" to get the digit keyboard, then strip anything that is not a digit in your change handler.",
    },
    {
      question: "How long should the resend wait be?",
      answer: "There is no standard. Pick a delay that matches how fast your provider usually delivers and your rate limits on the server, and always enforce the limit server side, since a disabled button only guides honest users.",
    },
  ],
  related: [
    "wooden-type-verification-code-input-where-number-blocks-drop-into-a-brass-composing-stick-and-a-wedge-locks-the-line",
    "html-form-examples-collection-with-every-input-type-and-copyable-html-css-or-tailwind",
    "react-tag-input-with-autocomplete-suggestions-paste-support-and-coloured-category-chips",
  ],
  tags: ["otp input", "react otp input", "one-time code", "verification code input", "pin input", "sms autofill", "webotp", "2fa code field"],
  height: 1316,
  section: true,
  interactive: true,
};

export default meta;
