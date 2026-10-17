const meta = {
  slug: "tailwind-hero-sections-collection-with-copyable-react-and-html-for-every-hero",
  category: "hero-sections",
  name: "50 Tailwind Hero Sections You Can Copy",
  keyword: "tailwind hero section",
  title: "50 Tailwind Hero Sections: Copy React or HTML | We.Inc",
  description: "Free set of 50 Tailwind hero sections: split image, photo background, SaaS, shop, app, event and newsletter. Copy each as React JSX or plain HTML.",
  intro: "Fifty landing page hero sections built with stock Tailwind classes, grouped into thirteen styles: centered, split image, full photo background, SaaS with a product screenshot, ecommerce, app download, portfolio and agency, local business, event, newsletter, stats and trust, editorial type, and dark or gradient. Each tile shows a scaled down copy of the real hero. Preview opens it at full size so you can check spacing and read the copy, and the two copy buttons give you the same section as a React component with className, or as plain HTML with class attributes. Photos are free to use from Pexels. On a phone every hero stacks into a single column, top bar links fold away, and the thumbnails render at phone width so you see the layout a phone visitor would get.",
  useWhen: [
    "You are starting a landing page and want a finished first screen to edit instead of a blank section and a guess at the spacing.",
    "You need to pitch two or three directions to a client, such as a photo background, a split layout and a bold type treatment, and want to compare them quickly.",
    "Your project is plain HTML, a CMS theme or a static site generator, so you need markup with Tailwind classes rather than a React component.",
    "You are building a page for a specific kind of business, a dentist, a bakery, a conference, a payroll tool, and want a hero whose structure already fits that business.",
  ],
  customize: [
    "Change the accent colour by swapping one colour family across the snippet, for example every `emerald-600` and `emerald-700` for `blue-600` and `blue-700`. Most heroes use one accent with a darker shade for hover.",
    "Make the headline larger or smaller by editing the two size classes on the h1, such as `text-4xl sm:text-6xl`. Keep the phone size at `text-4xl` or below so long words do not overflow at 360px.",
    "Replace a photo by changing the `src` and the `alt` on the img. Photo background heroes use `absolute inset-0 h-full w-full object-cover` plus a dark overlay div; raise the overlay opacity, such as `bg-slate-950/70`, if your photo is bright and the text gets hard to read.",
    "Adjust vertical breathing room with the padding on the inner container, usually `py-20 lg:py-28`. A hero that sits under a sticky header often needs a little extra top padding.",
    "Point the buttons at real pages by changing `href=\"#\"`. If a button submits a form, change the a element to `<button type=\"submit\">` and keep its classes.",
  ],
  accessibility: [
    "Each hero has exactly one h1, so drop it in as the first heading of the page. If you place one lower down a page that already has an h1, change it to h2.",
    "Every input has a label, shown or visually hidden with `sr-only`, and inputs carry `autocomplete` hints where a browser can fill them in.",
    "Colour swatches and the play button carry an aria-label, the donation amounts use aria-pressed, and decorative icons are hidden from screen readers with aria-hidden.",
    "Text on photos sits on a gradient or solid overlay. When you swap a photo, check the contrast of the headline and paragraph again, especially over skies and white interiors.",
  ],
  faqs: [
    {
      question: "How do I add one of these hero sections to a React or Next.js project?",
      answer: "Press Copy JSX, create a new file such as Hero.tsx, paste and import it where the page starts. The component has no props and no dependencies, so it works as soon as Tailwind is set up. Later you can lift the headline and button text into props.",
    },
    {
      question: "Will these work with Tailwind CSS version 4?",
      answer: "Yes. The classes are stock utilities that exist in both version 3 and version 4, with a few arbitrary values like `aspect-[4/5]` that both versions support. No plugin or theme extension is needed.",
    },
    {
      question: "What is the right height for a hero section?",
      answer: "Enough to show the headline, one paragraph and the main button without scrolling on a laptop. These use padding rather than a fixed screen height, which avoids text being cut off on short screens. If you want the hero to fill the screen, add `min-h-screen` and `flex items-center` to the section.",
    },
    {
      question: "Can I use the photos in the photo heroes on my site?",
      answer: "They load from Pexels, whose licence allows free use on websites without credit. For a real business it is better to swap in your own photos of your premises, team or product, since visitors trust pictures of the real thing more than stock images.",
    },
    {
      question: "Why do some copy buttons give a link and others a button element?",
      answer: "Anything that takes the visitor to another page is an a element, which the browser can open in a new tab. Actions on the same page, like Search or Add to bag, are button elements. Keep that split when you wire them up so keyboards and screen readers behave correctly.",
    },
    {
      question: "How do I keep the hero image from slowing the page down?",
      answer: "Leave the first image without lazy loading so it starts downloading straight away, give it a size the layout reserves, which the aspect classes already do, and serve it at roughly the width it displays. For a background photo around 1600 pixels wide is plenty.",
    },
  ],
  related: [
    "big-headline-hero-with-stats-row",
    "app-landing-hero-with-phone-mockup",
    "neo-brutalist-hero-with-sticker-headline-and-shifting-hard-shadows",
    "css-button-styles-collection-with-copyable-html-and-css-for-every-button",
  ],
  tags: ["tailwind hero section", "hero section", "hero section design", "landing page hero", "tailwind hero", "hero section html", "react hero section"],
  height: 1490,
  section: true,
  interactive: true,
};

export default meta;
