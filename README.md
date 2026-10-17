# WeInc UI

Free React + Tailwind CSS components from [we.inc/components](https://we.inc/components), released under the MIT licence.

This repository holds the 353 components that WeInc designed and wrote itself, in 33 categories. Each component lives at `components/<category>/<slug>.tsx`, next to a `<slug>.meta.ts` file with its description, usage notes, customisation tips and accessibility notes. Every component has a live preview at `https://we.inc/components/<category>/<slug>`.

## Using a component

1. Copy the `.tsx` file into your project. Each file has one default export and takes no required props.
2. Make sure Tailwind CSS is set up, since most components are styled with Tailwind classes.
3. Install any of these packages the file imports. These are the only dependencies used:
   - `react`
   - `framer-motion` (used by many of the animated components)
   - `lucide-react` (icons, used by a few)

### With the shadcn CLI

Most components can also be added with the shadcn CLI:

```bash
npx shadcn@latest add https://we.inc/r/<slug>.json
```

Replace `<slug>` with the file name without `.tsx`.

## Components by category

| Category | Components |
|---|---|
| `originals` | 46 |
| `inputs` | 24 |
| `ecommerce` | 21 |
| `galleries` | 21 |
| `toggles` | 21 |
| `hero-sections` | 16 |
| `feedback` | 15 |
| `animated-cards` | 14 |
| `app-ui` | 14 |
| `navigation` | 14 |
| `content` | 13 |
| `dashboard` | 13 |
| `backgrounds` | 12 |
| `text-effects` | 12 |
| `loaders` | 11 |
| `forms` | 8 |
| `pricing` | 8 |
| `cursors` | 7 |
| `navbars` | 7 |
| `testimonials` | 7 |
| `animated-buttons` | 6 |
| `scroll-effects` | 6 |
| `cta-sections` | 5 |
| `faq` | 5 |
| `timelines` | 5 |
| `footers` | 4 |
| `modals` | 4 |
| `buttons` | 3 |
| `cards` | 3 |
| `borders` | 2 |
| `docks` | 2 |
| `feature-sections` | 2 |
| `tables` | 2 |
| **Total** | **353** |

## Adapted components are not included

we.inc/components also includes some components adapted from other MIT-licensed libraries. Those are not part of this repository. They are available on we.inc with credit to their original authors, listed at [we.inc/components/licenses](https://we.inc/components/licenses).

## Licence

MIT. See [LICENSE](LICENSE).
