const meta = {
  slug: "sunlit-print-table-photo-gallery-in-webgl-where-the-chosen-print-lifts-off-travertine-into-focus-through-window-light-and-leaf-shadows",
  category: "galleries",
  name: "Sunlit Print Table Photo Gallery in WebGL Where the Chosen Print Lifts off Travertine into Focus Through Window Light and Leaf Shadows",
  keyword: "webgl 3d photo gallery react daylight",
  title: "React WebGL Photo Gallery on a Sunlit Stone Table | We.Inc",
  description: "Free 3D photo gallery in raw WebGL: curled prints on a sunlit travertine table, one lifts into focus while its shadow softens. React and HTML code.",
  intro: "Seven photographic prints lie on a honed travertine table in hard sun. A tall window throws its glazing bars across the stone, olive branches outside sway, and their leaf shadows slide over paper and table alike, crisp near the wall and softer further in. Pick a print and one edge peels off the stone, then the sheet bows under its own weight and comes up to the camera while the lens racks focus onto it and the table behind goes soft. Its sun shadow slides away and blurs as the sheet climbs, a second, wider shadow from the blocked sky stays underneath, and a little light comes through the paper tinted by the picture. Put it back and it drops, slaps flat, and the puff of air makes the neighbouring sheets flutter. Each sheet has a pressed plate mark around the photograph and a printed caption in its bottom margin. Everything is drawn in raw WebGL 2 with no rendering library. On a phone the lens widens and the prints move closer together so the lifted sheet still fits, and without WebGL a layered image version of the table is shown.",
  useWhen: [
    "A photographer or art director wants an edit of five to nine pictures presented as proofs laid out for selection, not as a slider.",
    "The page is light and warm, and a dark studio carousel would fight the rest of the design.",
    "You are showing a single series that shares a palette, so the pictures can sit side by side on one surface without clashing.",
    "You want depth, focus and shadow in a gallery but cannot add three.js or another 3D dependency.",
  ],
  customize: [
    "Replace the pictures in the `plates` array. `focus` is the crop centre from 0 to 1, `tone` fills the sheet until the photo arrives, and `title` is printed in the margin of the sheet and shown in the large serif line.",
    "`MASTHEAD` is the italic wordmark in the corner and on every sheet, and `SERIES` is the small label beside the counter. Type uses the `SERIF` and `GROTESK` stacks.",
    "Move the prints with the `slots` array: each row is x, z, turn in radians, edge curl and corner twist. Keep them from overlapping, because the sheets are not sorted against each other.",
    "`LIFT_SPRING` and `LIFT_DAMPING` shape the rise (lower damping overshoots more) and `DROP_GRAVITY` sets how hard a sheet lands. `HOLD_MS` is the pause between automatic changes.",
    "The light lives in the shader header: `SUN` is the direction, `SUNC` and `SKYC` the sun and sky colours, and `gobo` holds the window size and bar spacing. The `branches` array places each olive branch. The stone colours are the two `vec3` values mixed by `tone` in `FS_TABLE`.",
  ],
  accessibility: [
    "The stage is a single focusable carousel group: the left and right arrow keys lift the previous or next print, and two labelled round buttons do the same for pointer and switch users.",
    "The canvas is hidden from assistive technology, and a polite live region announces the print number, its title and a full description of the photograph each time the selection changes.",
    "With reduced motion the camera, the branch and the paper stop moving and a change of print is drawn as one new frame. Automatic changes also wait while anything inside the gallery has keyboard focus or a mouse pointer is over it.",
  ],
  faqs: [
    { question: "How are the shadows on the table calculated?", answer: "Each print is a shallow parabolic sheet, so a ray from any point toward the sun can be intersected with it in closed form with two Newton steps. The shader measures how far inside the sheet edge that ray lands and widens the soft edge with the distance travelled, which is why a print lying on the stone has a tight shadow and a lifted one has a broad, blurred one. No shadow map is involved." },
    { question: "Where do the window bars and leaves come from?", answer: "They are not textures. For every shaded point the `gobo` function follows the sun ray back to the wall, checks it against a window opening with glazing bars, then against a plane nearer the table that holds two procedural branches of leaf shapes. The leaves are posed on the CPU every frame and sent as uniforms, and because the test is done in 3D the pattern shifts correctly across a print as it rises." },
    { question: "Can visitors choose any print directly?", answer: "Yes. A pointer position is turned into a ray on the CPU and tested against each sheet, so clicking or tapping a print on the table lifts that one. Clicking anywhere else, or the print already in the air, moves to the next." },
    { question: "How heavy is it to run?", answer: "The table is one full-screen fragment pass with seven analytic sheet tests for sun and seven for sky, the prints are seven small meshes, and a lens pass adds the focus blur. Device pixel ratio is capped at 1.5, the canvas at roughly 1.5 million pixels, and the loop lowers its render scale if frames run long. Drawing stops when the section leaves the viewport." },
    { question: "What is printed on each sheet?", answer: "Every layer of the array texture is laid out on a 2D canvas first: paper colour, the cropped photograph, the title in tracked capitals, the wordmark and the plate number in the wide bottom margin. `PAD` and `FOOT` set those margins. That canvas is uploaded once per photo, so the caption bends and lights with the paper, and the pressed plate mark is added in the shader as a bevel that follows the same margins." },
    { question: "Does it work without WebGL 2?", answer: "A fallback built from ordinary images takes over: the same prints laid out on a tilted plane with CSS perspective, with the selected one shown large above them. The arrow keys, the buttons and the live caption behave the same way." },
  ],
  related: ["fashion-print-carousel-in-webgl-with-standing-prints-that-rock-on-their-corners-over-a-mirror-floor", "light-table-slide-gallery-with-a-glass-loupe-that-glides-between-mounted-transparencies", "magazine-stack-gallery-that-fans-out-across-the-table-and-lifts-the-chosen-issue-to-face-you"],
  tags: ["gallery", "webgl", "3d", "daylight", "shadows", "depth of field", "photography", "physics"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
