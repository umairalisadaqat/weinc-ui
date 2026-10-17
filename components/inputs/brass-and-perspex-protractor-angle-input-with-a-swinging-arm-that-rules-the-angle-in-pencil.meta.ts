const meta = {
  slug: "brass-and-perspex-protractor-angle-input-with-a-swinging-arm-that-rules-the-angle-in-pencil",
  category: "inputs",
  name: "Brass and Perspex Protractor Angle Input with a Swinging Arm That Rules the Angle in Pencil",
  keyword: "angle picker react",
  title: "React Angle Picker: Protractor with Brass Arm | We.Inc",
  description: "Angle picker drawn as a clear protractor on squared paper: swing the brass arm and the angle is ruled underneath in pencil. Free React and HTML to copy.",
  intro: "An angle field from 0 to 180 degrees, shown as a clear plastic protractor lying on a page of squared paper. A brass arm turns on a knurled nut at the centre mark. Drag anywhere on the protractor and the arm swings to follow with a little weight, and under it the angle is drawn in pencil: a base line, a second line along the arm, an arc and the figure written beside it. The plastic is the part worth looking at. The grid seen through it sits a couple of pixels out of place, the printed scale throws a faint twin onto the paper, the cut edge shows as a pale band, and a reflected window slides across the surface as the pointer moves. A large readout below gives the number and names the angle as acute, right, obtuse or straight. On phones the protractor is about 316 pixels across and the maker's line is dropped so the scale stays clean.",
  useWhen: [
    "A geometry lesson, quiz or homework tool asks the pupil to set or estimate an angle.",
    "A design tool needs a rotation, gradient direction or light angle and a bare number field gives no feel for it.",
    "A roof pitch, ramp or mitre cut calculator wants its first input to be the thing a builder would pick up.",
    "A stationery or school supply page needs one interactive object above the fold.",
  ],
  customize: [
    "`START` is the opening angle and `TOUR` is the list the arm visits by itself. `DEMO = false` stops the tour for use in a form.",
    "`INK` and `RED` are the two scale colours as comma separated red, green and blue. Swap `RED` for `INK` to print both rows in black.",
    "The plastic colour is the three stops of the `tint` gradient in `build`. Warm them towards `rgba(255,214,120,0.3)` for amber acrylic.",
    "`MAKER` is the small line printed above the base. Leave it as an empty string to remove it.",
    "The paper is `#f4f0e3` with grid lines in `rgba(58,128,172,...)`. The grid size is the `g` value, 12 pixels on desktop and 10 on phones.",
    "Arm weight is the `120` (stiffness) and `13` (damping) pair in the frame loop. Raise the damping to 22 and the arm stops without overshooting.",
  ],
  accessibility: [
    "The drawing is hidden from assistive technology. The control is a labelled `input type=\"range\"` from 0 to 180 whose value text reads, for example, \"64 degrees, acute\".",
    "Arrow keys turn the arm one degree, Page Up and Page Down take larger steps, Home and End go to 0 and 180, and a ring appears on the pivot while the slider has keyboard focus.",
    "The readout is an `output` tied to the slider and the angle name is a polite live region.",
    "Touch dragging is captured only over the protractor itself, so the page still scrolls from the paper around it. With reduced motion the arm jumps to the angle and the tour is off.",
  ],
  faqs: [
    {
      question: "How is the see-through plastic drawn?",
      answer: "The paper and pencil lines are drawn once as normal. Then the protractor outline becomes a clip, and the same paper and lines are drawn again inside it, shifted up and left by about two pixels. A pale tint, the printed scale, three edge strokes of different widths and a moving highlight go on top. The broken grid lines at the rim are what make it read as a thick clear sheet.",
    },
    {
      question: "Which way are the degrees measured?",
      answer: "Anticlockwise from the right hand end of the base line, which is the outer black scale. The inner red scale runs the other way, as on a school protractor, and is only decoration here.",
    },
    {
      question: "Can it cover a full 360 degrees?",
      answer: "Not as built. The object is a half circle, and pointing below the base line snaps to 0 or 180. For a full turn you would draw a second half, remove the clamp in `angleAt` and raise the slider's `max`.",
    },
    {
      question: "How do I get the value into a form?",
      answer: "Add a `name` to the range input, or lift the `value` state. Setting it from outside goes through `api.current.set(degrees)`, which also moves the arm.",
    },
    {
      question: "Why does the arm lag slightly behind my finger?",
      answer: "The drawn angle chases the target with a stiff spring while you hold it and a softer one when the tour or the keyboard moves it. The number in the readout always shows the target, so the value is exact even while the brass is still catching up.",
    },
  ],
  related: [
    "stainless-vernier-caliper-number-input-with-jaws-that-close-on-a-brass-bar-and-a-scale-that-reads-true",
    "steel-tape-measure-range-slider-with-a-blade-that-sags-a-thumb-lock-and-spring-rewind",
  ],
  tags: ["protractor", "angle", "slider", "perspex", "brass", "canvas", "geometry", "skeuomorphic"],
  height: 740,
  interactive: true,
};

export default meta;
