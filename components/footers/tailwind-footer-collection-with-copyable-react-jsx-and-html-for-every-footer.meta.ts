const meta = {
  slug: "tailwind-footer-collection-with-copyable-react-jsx-and-html-for-every-footer",
  category: "footers",
  name: "34 Tailwind Footers You Can Copy as React or HTML",
  keyword: "tailwind footer",
  title: "34 Tailwind Footer Designs: Copy React or HTML | We.Inc",
  description: "Free Tailwind footer examples: multi-column, newsletter, big wordmark, local business hours, shop and legal bars. Copy each as React JSX or plain HTML.",
  intro: "A gallery of 34 website footers built with Tailwind CSS, grouped into twelve styles: multi-column link grids, newsletter signups, oversized wordmarks, one-line minimal bars, dark footers, app download blocks, contact details beside a drawn map, social icon rows, legal small print, full sitemaps, local businesses with opening hours and ecommerce footers with delivery perks. Each tile shows a scaled copy of the real footer at desktop width; press Full size to see it at its true size and resize the window to watch it stack. Copy JSX gives you a React component, Copy HTML gives you the same markup with class attributes for any page that loads Tailwind. On a phone the tiles run in one column and every footer collapses its columns into a stack or a two-column grid.",
  useWhen: [
    "You are finishing a landing page or marketing site and want a footer that matches its tone instead of a plain row of grey links.",
    "A client runs a shop, clinic, restaurant or trade business and the footer has to carry an address, phone number, hours or a delivery promise.",
    "You need a footer with an email signup and want to see the label, input and button already wired with the right attributes.",
    "You are building a large site such as a college, docs portal or insurer and the footer has to work as a sitemap or hold regulatory text.",
    "You want a statement footer with a huge brand name and need the font sizes that keep it on one line from phone to desktop.",
  ],
  customize: [
    "Change the link lists by editing the anchor text inside each `ul`. Every link uses `href=\"#\"`, so replace those with your own paths or your router's link component in React.",
    "Swap the colour scheme by changing the footer's background class, such as `bg-slate-950` or `bg-[#f4f1ec]`, then the matching text classes. Each footer uses one accent colour, so a find and replace on that name (for example `orange-300` to `teal-300`) recolours it in one pass.",
    "Resize the giant wordmarks with the pair of classes on the big text, such as `text-[22vw] lg:text-[17rem]`. The `vw` value controls phones and tablets and the `rem` value caps it on wide screens so it never overflows.",
    "Point the newsletter forms at your email provider by setting the form's `action` (or an `onSubmit` handler in React) and keeping `name=\"email\"`, `type=\"email\"` and the label's `for` value matched to the input id.",
    "Replace the drawn map in the contact footer with your map embed by swapping the `svg` inside the rounded box for an `iframe` with `className=\"absolute inset-0 h-full w-full\"` and a `title` describing the location.",
  ],
  accessibility: [
    "Every footer uses a real footer element, and groups of links sit in a nav with an aria-label such as Footer, Legal or Site map so screen reader users can tell the landmarks apart.",
    "Icon-only links, such as the email, photo and video circles, carry an aria-label that says where they go, and the icons themselves are hidden from assistive technology.",
    "Email and order-number inputs have a label tied to their id, visually hidden where the design has no room, and every link and button shows a focus ring when reached with the keyboard.",
    "Opening hours are written as a description list and addresses use the address element, so the structure is clear when read aloud. Keep those elements if you restyle them.",
  ],
  faqs: [
    {
      question: "How do I make a Tailwind footer stick to the bottom of a short page?",
      answer: "Make the page wrapper a column that fills the screen and push the footer down. Put `min-h-screen flex flex-col` on the element that wraps your header, main and footer, then add `flex-1` to main. The footer stays at the bottom on short pages and follows the content on long ones, without being fixed over it.",
    },
    {
      question: "What should a website footer include?",
      answer: "At minimum a copyright line and links to privacy and terms. Most sites also add the main sections of the site, a way to get in touch and a newsletter or social links. Local businesses benefit from the address, phone number and opening hours, and shops from delivery, returns and order help. Pick the footer style here that already holds the pieces your site needs.",
    },
    {
      question: "Does the HTML version work without React?",
      answer: "Yes. It is the same markup with class instead of className and needs only Tailwind on the page, either through your build or the Tailwind Play CDN while you prototype. The forms submit like normal HTML forms, so set the action to wherever your email signups or order lookups should go.",
    },
    {
      question: "Why do the column links stack on my phone?",
      answer: "The grids start with one or two columns and add more at the `sm`, `md` and `lg` breakpoints, for example `grid-cols-2 md:grid-cols-4`. If you want two columns on phones for a footer that stacks to one, change its base class from `grid` to `grid grid-cols-2`.",
    },
    {
      question: "Can I use these footers with Tailwind v4?",
      answer: "Yes. They use only standard utilities and a few arbitrary values like `bg-[#0b3a53]`, which work the same way in version 3 and version 4. No plugins or theme extensions are needed.",
    },
    {
      question: "Should the footer column titles be headings?",
      answer: "Short headings such as Product or Help make the footer easier to scan with a screen reader, which is why these footers use h2 for them. If your page outline needs it, change them to h3 or to plain p elements; the styling stays the same because it comes from the classes.",
    },
  ],
  related: [
    "brick-wall-footer-with-screwed-on-street-name-plates-lit-by-a-torch-that-follows-the-pointer",
    "css-button-styles-collection-with-copyable-html-and-css-for-every-button",
    "travertine-block-footer-with-a-wordmark-carved-in-roman-capitals-ray-marched-in-webgl-where-the-evening-sun-follows-the-pointer-and-rakes-shadows-through-the-cuts",
  ],
  tags: ["tailwind footer", "footer design", "website footer examples", "footer html css", "react footer", "newsletter footer", "dark footer", "responsive footer"],
  height: 1600,
  section: true,
  interactive: true,
};

export default meta;
