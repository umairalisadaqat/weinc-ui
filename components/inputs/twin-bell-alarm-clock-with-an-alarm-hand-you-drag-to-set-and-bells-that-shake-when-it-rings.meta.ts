const meta = {
  slug: "twin-bell-alarm-clock-with-an-alarm-hand-you-drag-to-set-and-bells-that-shake-when-it-rings",
  category: "inputs",
  name: "Twin-Bell Alarm Clock with an Alarm Hand You Drag to Set and Bells That Shake When It Rings",
  keyword: "react alarm clock component",
  title: "React Alarm Clock Component You Set by Hand | We.Inc",
  description: "Alarm clock on a canvas: a twin-bell clock showing the real time, with an alarm hand you drag to set and bells that shake. Free React and HTML to copy.",
  intro: "A bedside alarm clock painted in red enamel, standing on two nickel legs on a cream table. It tells the real time with a second hand that ticks and settles, and it carries a fourth, shorter brass hand: the alarm. Press anywhere on the dial and that brass hand jumps to your finger, moving in five minute notches as you drag. When the hour and minute hands reach it, the hammer between the bells starts to fly, both bells blur and the whole clock rattles on its feet for eight seconds. Nothing makes a noise unless you switch the sound constant on. The time is also printed in digits under the clock, next to a switch that disarms the alarm and a button that rings it for a moment. On a phone the clock scales down with the screen and the controls stay on one row.",
  useWhen: [
    "A reminder, wake-up or habit app wants a time field that people enjoy touching more than two dropdowns.",
    "A landing page for a sleep or morning routine product needs one object that carries the whole idea.",
    "A booking or delivery form asks for a single time of day and five minute precision is enough.",
    "A children's or classroom site teaches how to read an analogue dial alongside the digital time.",
  ],
  customize: [
    "`ENAMEL` is the case colour. The same value tints the reflection under each bell and the armed switch, so change the `bg-[#d8402b]` class on the switch to match.",
    "`ALARM_START` is where the brass hand begins, in minutes past twelve. `6 * 60 + 30` is half past six.",
    "`STEP` sets the notch size for dragging and arrow keys. Use 1 for minute precision or 15 for quarter hours.",
    "`RING_SECONDS` is how long a real alarm rings. The preview ring that plays three seconds after load is the `el > 3000 && el < 4300` test in the frame loop: delete it to stop the demonstration.",
    "`SOUND` is false. Set it to true for a quiet two-note rattle built with the Web Audio API, which browsers only allow after the visitor has clicked something.",
  ],
  accessibility: [
    "The dial is a `role=\"slider\"` named Alarm time. Arrow keys move the alarm by one notch, Page Up and Page Down by an hour, and `aria-valuetext` reads the time as 6:30 instead of a raw number.",
    "The line under the digits is a polite live region. It announces Ringing when the bells start, which matters because the clock is silent by default.",
    "The alarm switch is a real button with `role=\"switch\"` and `aria-checked`, and every control shows a dark focus ring against the cream background.",
    "With reduced motion the clock never shakes and the second hand steps without its bounce. The word Ringing still appears.",
  ],
  faqs: [
    {
      question: "The alarm hand has no AM or PM. When does it ring?",
      answer: "Like the real object, the dial covers twelve hours, so the alarm matches the next time the hands reach it, morning or evening. If you need a 24 hour alarm, keep a separate AM or PM flag in state and add it to the comparison in the frame loop where `cur === L.alarm` is tested.",
    },
    {
      question: "How do I get the chosen alarm time out of the component?",
      answer: "The `alarm` state holds minutes past twelve as a number from 0 to 715. Lift it to a parent, or call your own handler inside `move` and `pick`, the two places where it changes.",
    },
    {
      question: "Why do the bells look blurred while it rings?",
      answer: "Each bell is drawn three times during a ring: once solid and twice at a small angle either side with low opacity. That fakes the smear a camera records from a part vibrating faster than the shutter, so even a single still frame reads as ringing.",
    },
    {
      question: "Will the alarm fire if the tab is in the background?",
      answer: "No. Drawing and the alarm check both pause when the tab is hidden or the clock is scrolled out of view, to save battery. For an alarm that must fire regardless, run the comparison in your own timer or a service worker and use this component only as the display.",
    },
    {
      question: "Can I change the numerals or the small text on the dial?",
      answer: "Yes. The numbers are written with `fillText` in a loop from 1 to 12, and the two small lines above and below the centre are plain strings in the same block. Swap the font string for a serif to make it look older.",
    },
  ],
  related: ["enamel-kitchen-timer-you-twist-to-set-that-ticks-down-a-held-booking-and-rings", "steel-wristwatch-with-a-sweeping-seconds-hand-date-window-and-a-crown-you-pull-to-set-the-time"],
  tags: ["alarm clock", "time input", "canvas", "analog clock", "skeuomorphic", "bells"],
  height: 820,
  interactive: true,
};

export default meta;
