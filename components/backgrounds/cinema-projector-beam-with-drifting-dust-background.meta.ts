const meta = {
  slug: "cinema-projector-beam-with-drifting-dust-background",
  category: "backgrounds",
  name: "Cinema Projector Beam with Drifting Dust",
  keyword: "css background animation",
  title: "",
  description: "",
  intro: "From a small port high in the corner, a projector beam cuts across a dark room, flickering faintly the way film light does, while specks of dust drift slowly through it and vanish at its edges. The beam is two clipped gradients with blur, the dust is tiled dots. It suits cinemas, film festivals, theatres, photographers and video studios.",
  useWhen: ["A cinema, film club or theatre needs a hero that sets the mood before the listings.", "A dark page wants a single strong diagonal of light to lead the eye to the button."],
  customize: ["Warm or cool the beam by changing the three numbers in `--pjb-beam`, and its brightness with `--pjb-strength`.", "Change `--pjb-drift` for faster or calmer dust; the larger, softer dust always moves at one and a half times that.", "Reshape the cone by editing the `clip-path` polygons on `.pjb-beam::before` and `.pjb-cone` together."],
  accessibility: ["The flicker is a small opacity change of under one tenth, well short of a flash, and it stops with reduced motion.", "Light text on the near black room keeps strong contrast even where the beam crosses it."],
  faqs: [],
  related: [],
  tags: ["cinema", "projector", "light beam", "dust", "pure css"],
  height: 560,
  section: true,
  collection: "animated-background-css",
  tech: "css",
  reducedMotion: "The beam holds steady with no flicker, and the dust stays frozen as still specks in the light.",
  perf: "Opacity flicker and two transformed dust tiles run on the compositor; the blurs are drawn once.",
};

export default meta;
