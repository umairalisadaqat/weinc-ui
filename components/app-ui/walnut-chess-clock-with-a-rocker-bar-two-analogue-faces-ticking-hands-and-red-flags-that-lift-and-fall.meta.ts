const meta = {
  slug: "walnut-chess-clock-with-a-rocker-bar-two-analogue-faces-ticking-hands-and-red-flags-that-lift-and-fall",
  category: "app-ui",
  name: "Walnut Chess Clock with a Rocker Bar, Two Analogue Faces, Ticking Hands and Red Flags That Lift and Fall",
  keyword: "react chess clock component",
  title: "React Chess Clock Component with Falling Flags | We.Inc",
  description: "Chess clock on a canvas: a walnut case with analogue faces, a rocker bar to pass the turn and red flags the hands lift and drop. Free React and HTML code.",
  intro: "A working two player game timer in the shape of a wooden tournament clock. Each face counts down to the hour, so a three minute game starts with both minute hands three minutes short of twelve. A black bar rocks on a brass post above the case with an ivory cap over White's face and an ebony cap over Black's. Pressing one end down lifts the other and starts the other player's red seconds hand ticking. The small red flag near twelve is not animated on a timer. It hangs from a rivet as a pendulum, the minute hand pushes it up as it closes on the hour, and when the hand slips past, the flag drops and swings until it settles. That drop is the end of the game. Under the clock the two times are written as digits with a line that says whose move it is. The picture scales to the screen width, and on phones the controls wrap under the readout.",
  useWhen: [
    "A chess, draughts or go site wants an over-the-board timer that two people can share on one phone laid flat between them.",
    "A club or school tournament page needs a blitz clock with a few fixed time limits and no sign-up.",
    "A debate, pitch night or board game group needs two speakers timed in turn with a clear end.",
    "A landing page for a strategy game wants a physical object in the hero that already does something.",
  ],
  customize: [
    "`CONTROLS` lists the minutes offered under the clock and `START` picks the one used first. `[3, 5, 10]` with `START = 1` opens on five minutes.",
    "`players` holds the two names used in the readout, the status line and the button labels. Swap them for `Ada` and `Grace` or for two team names.",
    "`DEMO` is the seconds shown on each face while the piece plays by itself. The first real press swaps it for the chosen time limit.",
    "`FLAG` is the paint on the flags. The seconds hands use `#b3261e` in the `draw` function if you want them to match a new colour.",
    "`MAKER` is the lettering on the brass plate. The case colours are the three stops of the `wood` gradient, from `#7c4a28` to `#4c2a14`.",
  ],
  accessibility: [
    "Each half of the clock is a real `button` with `aria-pressed`, named for the player and for what pressing it does, so Tab and Space run a whole game without a pointer.",
    "The digits under the clock carry `role=\"timer\"` and are not announced every second. The status line is a polite live region that speaks only on a change of turn, a pause or a fallen flag.",
    "With reduced motion the self-playing demo is off, the bar and hands jump instead of springing, and the faces refresh four times a second so the time is still right.",
    "The time limit, Pause and Reset controls are 40 pixels tall with visible focus rings. Keep the digit readout if you restyle: the hands are a drawing.",
  ],
  faqs: [
    {
      question: "How does the flag know when to fall?",
      answer: "It does not. On every frame the code finds the smallest angle at which the flag clears the minute hand by testing the two line segments against each other, and the pendulum is not allowed below that angle. The flag length is worked out from the rivet position so the hand tip passes the flag tip exactly at twelve. After that nothing holds it and gravity does the rest.",
    },
    {
      question: "Why does a three minute game start near six o'clock?",
      answer: "Mechanical chess clocks are set so the flag falls on the hour, by tradition at six. The minute hand is drawn at the time remaining before twelve and the hour hand sits just short of six, which is how a club clock is set before a blitz game.",
    },
    {
      question: "Is the timing accurate enough for a real game?",
      answer: "The remaining time is reduced by the measured gap between frames, so it follows the device clock and does not drift with frame rate. The loop sleeps when the tab is hidden or the clock is scrolled off screen, which pauses the game. For rated play use a dedicated clock.",
    },
    {
      question: "How do I add an increment per move?",
      answer: "In the `press` function, add your bonus seconds to `s.t[side]` before the turn changes. That gives the player who has pressed their button the extra time, and the minute hand and flag follow because they are drawn from `s.t`.",
    },
    {
      question: "Can I pause without losing the position?",
      answer: "Pause levels the bar, which is how a mechanical clock is stopped, and both hands stand still. Pressing either end starts the opposite clock again from the same times. Reset puts both faces back to the chosen limit.",
    },
  ],
  related: ["mechanical-stopwatch-with-a-crown-you-press-a-ticking-sweep-hand-and-a-flyback-reset", "walnut-dice-tray-lined-in-green-baize-where-two-dice-tumble-with-rigid-body-physics-and-settle-on-true-faces"],
  tags: ["chess", "clock", "timer", "canvas", "game", "tabletop", "skeuomorphic"],
  height: 720,
  interactive: true,
};

export default meta;
