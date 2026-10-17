import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from "react";

/*
  Every piece below is written once: the function renders the live demo and the
  string next to it is that same source file, so the code you copy is the code you see.
*/

type Lang = "react" | "html";
type Piece = {
  id: string;
  name: string;
  blurb: string;
  group: string;
  Demo: () => ReactElement;
  react: string;
  html?: string;
  stage: string;
};

const s1Demo = (() => {
const STAR = "M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z";

const items = [
  { name: "Walnut serving board", rating: 4.3, reviews: 218 },
  { name: "Enamel camping mug", rating: 3.75, reviews: 64 },
  { name: "Wool picnic blanket", rating: 2.5, reviews: 12 },
];

// Rounds to the nearest quarter star, then clips a row of filled stars to that width.
function Stars({ value, size = "h-5 w-5" }: { value: number; size?: string }) {
  const shown = Math.round(value * 4) / 4;
  const row = (cls: string) =>
    Array.from({ length: 5 }, (_, i) => (
      <svg key={i} viewBox="0 0 24 24" aria-hidden="true" className={`${size} shrink-0 ${cls}`}>
        <path d={STAR} />
      </svg>
    ));
  return (
    <span role="img" aria-label={`Rated ${value} out of 5`} className="relative inline-flex">
      <span className="flex">{row("fill-stone-200")}</span>
      <span className="absolute inset-y-0 left-0 flex overflow-hidden" style={{ width: `${(shown / 5) * 100}%` }}>
        {row("fill-amber-500")}
      </span>
    </span>
  );
}

function StarReadOnly() {
  return (
    <ul className="w-full max-w-xs divide-y divide-stone-200">
      {items.map((it) => (
        <li key={it.name} className="py-3 first:pt-0 last:pb-0">
          <p className="text-sm font-semibold text-stone-900">{it.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <Stars value={it.rating} />
            <span className="text-sm tabular-nums text-stone-700">{it.rating}</span>
            <a href="#" className="rounded text-sm text-stone-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600">
              {it.reviews} reviews
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
  return StarReadOnly;
})();
const s1React = "const STAR = \"M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z\";\n\nconst items = [\n  { name: \"Walnut serving board\", rating: 4.3, reviews: 218 },\n  { name: \"Enamel camping mug\", rating: 3.75, reviews: 64 },\n  { name: \"Wool picnic blanket\", rating: 2.5, reviews: 12 },\n];\n\n// Rounds to the nearest quarter star, then clips a row of filled stars to that width.\nfunction Stars({ value, size = \"h-5 w-5\" }: { value: number; size?: string }) {\n  const shown = Math.round(value * 4) / 4;\n  const row = (cls: string) =>\n    Array.from({ length: 5 }, (_, i) => (\n      <svg key={i} viewBox=\"0 0 24 24\" aria-hidden=\"true\" className={`${size} shrink-0 ${cls}`}>\n        <path d={STAR} />\n      </svg>\n    ));\n  return (\n    <span role=\"img\" aria-label={`Rated ${value} out of 5`} className=\"relative inline-flex\">\n      <span className=\"flex\">{row(\"fill-stone-200\")}</span>\n      <span className=\"absolute inset-y-0 left-0 flex overflow-hidden\" style={{ width: `${(shown / 5) * 100}%` }}>\n        {row(\"fill-amber-500\")}\n      </span>\n    </span>\n  );\n}\n\nexport default function StarReadOnly() {\n  return (\n    <ul className=\"w-full max-w-xs divide-y divide-stone-200\">\n      {items.map((it) => (\n        <li key={it.name} className=\"py-3 first:pt-0 last:pb-0\">\n          <p className=\"text-sm font-semibold text-stone-900\">{it.name}</p>\n          <div className=\"mt-1 flex items-center gap-2\">\n            <Stars value={it.rating} />\n            <span className=\"text-sm tabular-nums text-stone-700\">{it.rating}</span>\n            <a href=\"#\" className=\"rounded text-sm text-stone-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600\">\n              {it.reviews} reviews\n            </a>\n          </div>\n        </li>\n      ))}\n    </ul>\n  );\n}\n";

const s1Html = `<!-- Set --rating on each element. Partial stars come from the gradient stop. -->
<p class="stars" style="--rating: 4.3" role="img" aria-label="Rated 4.3 out of 5"></p>
<p class="stars" style="--rating: 3.75" role="img" aria-label="Rated 3.75 out of 5"></p>

<style>
  .stars {
    --size: 20px;
    --on: #f59e0b;
    --off: #e7e5e4;
    margin: 4px 0;
    width: calc(var(--size) * 5);
    height: var(--size);
    background: linear-gradient(90deg, var(--on) calc(var(--rating) / 5 * 100%), var(--off) 0);
    /* One star shape, repeated five times, used as a mask. */
    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z'/%3E%3C/svg%3E") 0 0 / var(--size) var(--size) repeat-x;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z'/%3E%3C/svg%3E") 0 0 / var(--size) var(--size) repeat-x;
  }
</style>
`;

const s5Demo = (() => {
const STAR = "M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z";
// Review counts per star level, 5 down to 1. The average and percentages are worked out from these.
const COUNTS: Record<number, number> = { 5: 146, 4: 41, 3: 17, 2: 8, 1: 6 };

function ReviewSummaryBars() {
  const [filter, setFilter] = useState<number | null>(null);
  const total = Object.values(COUNTS).reduce((a, b) => a + b, 0);
  const average = Object.entries(COUNTS).reduce((s, [k, v]) => s + Number(k) * v, 0) / total;
  const avg = Math.round(average * 10) / 10;

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 sm:flex-row sm:items-start">
      <div className="shrink-0">
        <p className="text-4xl font-semibold tracking-tight text-stone-900">{avg.toFixed(1)}</p>
        <span role="img" aria-label={`Average ${avg} out of 5`} className="mt-1 flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <svg key={n} viewBox="0 0 24 24" aria-hidden="true" className={`h-4 w-4 ${n <= Math.round(avg) ? "fill-amber-500" : "fill-stone-200"}`}>
              <path d={STAR} />
            </svg>
          ))}
        </span>
        <p className="mt-1 text-xs text-stone-600">{total} reviews</p>
      </div>
      <ul className="flex-1 space-y-0.5">
        {[5, 4, 3, 2, 1].map((n) => {
          const pct = Math.round((COUNTS[n] / total) * 100);
          const on = filter === n;
          return (
            <li key={n}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={`${n} stars: ${COUNTS[n]} reviews, ${pct} percent. Show only these`}
                onClick={() => setFilter(on ? null : n)}
                className={`flex h-10 w-full items-center gap-2 rounded-md px-1.5 text-xs text-stone-700 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${on ? "bg-amber-50" : ""}`}
              >
                <span className="w-3 tabular-nums">{n}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200">
                  <span className="block h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-8 text-right tabular-nums">{pct}%</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p role="status" className="sr-only">
        {filter ? `Showing ${COUNTS[filter]} ${filter}-star reviews` : ""}
      </p>
    </div>
  );
}
  return ReviewSummaryBars;
})();
const s5React = "import { useState } from \"react\";\n\nconst STAR = \"M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z\";\n// Review counts per star level, 5 down to 1. The average and percentages are worked out from these.\nconst COUNTS: Record<number, number> = { 5: 146, 4: 41, 3: 17, 2: 8, 1: 6 };\n\nexport default function ReviewSummaryBars() {\n  const [filter, setFilter] = useState<number | null>(null);\n  const total = Object.values(COUNTS).reduce((a, b) => a + b, 0);\n  const average = Object.entries(COUNTS).reduce((s, [k, v]) => s + Number(k) * v, 0) / total;\n  const avg = Math.round(average * 10) / 10;\n\n  return (\n    <div className=\"flex w-full max-w-sm flex-col gap-4 sm:flex-row sm:items-start\">\n      <div className=\"shrink-0\">\n        <p className=\"text-4xl font-semibold tracking-tight text-stone-900\">{avg.toFixed(1)}</p>\n        <span role=\"img\" aria-label={`Average ${avg} out of 5`} className=\"mt-1 flex\">\n          {[1, 2, 3, 4, 5].map((n) => (\n            <svg key={n} viewBox=\"0 0 24 24\" aria-hidden=\"true\" className={`h-4 w-4 ${n <= Math.round(avg) ? \"fill-amber-500\" : \"fill-stone-200\"}`}>\n              <path d={STAR} />\n            </svg>\n          ))}\n        </span>\n        <p className=\"mt-1 text-xs text-stone-600\">{total} reviews</p>\n      </div>\n      <ul className=\"flex-1 space-y-0.5\">\n        {[5, 4, 3, 2, 1].map((n) => {\n          const pct = Math.round((COUNTS[n] / total) * 100);\n          const on = filter === n;\n          return (\n            <li key={n}>\n              <button\n                type=\"button\"\n                aria-pressed={on}\n                aria-label={`${n} stars: ${COUNTS[n]} reviews, ${pct} percent. Show only these`}\n                onClick={() => setFilter(on ? null : n)}\n                className={`flex h-10 w-full items-center gap-2 rounded-md px-1.5 text-xs text-stone-700 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${on ? \"bg-amber-50\" : \"\"}`}\n              >\n                <span className=\"w-3 tabular-nums\">{n}</span>\n                <span className=\"h-2 flex-1 overflow-hidden rounded-full bg-stone-200\">\n                  <span className=\"block h-full rounded-full bg-amber-500\" style={{ width: `${pct}%` }} />\n                </span>\n                <span className=\"w-8 text-right tabular-nums\">{pct}%</span>\n              </button>\n            </li>\n          );\n        })}\n      </ul>\n      <p role=\"status\" className=\"sr-only\">\n        {filter ? `Showing ${COUNTS[filter]} ${filter}-star reviews` : \"\"}\n      </p>\n    </div>\n  );\n}\n";

const s2Demo = (() => {
const STAR = "M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z";
const WORDS = ["Poor", "Fair", "Good", "Very good", "Excellent"];

function StarRadioInput() {
  const [value, setValue] = useState(4);
  const [hover, setHover] = useState(0);
  const lit = hover || value;

  return (
    <fieldset className="w-full max-w-xs">
      <legend className="text-sm font-semibold text-stone-900">How was your stay?</legend>
      <div className="mt-2 flex" onMouseLeave={() => setHover(0)}>
        {WORDS.map((word, i) => {
          const n = i + 1;
          return (
            <span key={n}>
              <input
                id={`stay-${n}`}
                type="radio"
                name="stay"
                value={n}
                checked={value === n}
                onChange={() => setValue(n)}
                className="peer sr-only"
              />
              <label
                htmlFor={`stay-${n}`}
                onMouseEnter={() => setHover(n)}
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-lg peer-focus-visible:ring-2 peer-focus-visible:ring-amber-600"
              >
                <span className="sr-only">
                  {n} {n === 1 ? "star" : "stars"}, {word}
                </span>
                <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-8 w-8 transition-colors ${n <= lit ? "fill-amber-500" : "fill-stone-200"}`}>
                  <path d={STAR} />
                </svg>
              </label>
            </span>
          );
        })}
      </div>
      <p className="mt-1 text-sm text-stone-600" aria-hidden="true">
        {WORDS[lit - 1]}
      </p>
    </fieldset>
  );
}
  return StarRadioInput;
})();
const s2React = "import { useState } from \"react\";\n\nconst STAR = \"M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z\";\nconst WORDS = [\"Poor\", \"Fair\", \"Good\", \"Very good\", \"Excellent\"];\n\nexport default function StarRadioInput() {\n  const [value, setValue] = useState(4);\n  const [hover, setHover] = useState(0);\n  const lit = hover || value;\n\n  return (\n    <fieldset className=\"w-full max-w-xs\">\n      <legend className=\"text-sm font-semibold text-stone-900\">How was your stay?</legend>\n      <div className=\"mt-2 flex\" onMouseLeave={() => setHover(0)}>\n        {WORDS.map((word, i) => {\n          const n = i + 1;\n          return (\n            <span key={n}>\n              <input\n                id={`stay-${n}`}\n                type=\"radio\"\n                name=\"stay\"\n                value={n}\n                checked={value === n}\n                onChange={() => setValue(n)}\n                className=\"peer sr-only\"\n              />\n              <label\n                htmlFor={`stay-${n}`}\n                onMouseEnter={() => setHover(n)}\n                className=\"grid h-11 w-11 cursor-pointer place-items-center rounded-lg peer-focus-visible:ring-2 peer-focus-visible:ring-amber-600\"\n              >\n                <span className=\"sr-only\">\n                  {n} {n === 1 ? \"star\" : \"stars\"}, {word}\n                </span>\n                <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" className={`h-8 w-8 transition-colors ${n <= lit ? \"fill-amber-500\" : \"fill-stone-200\"}`}>\n                  <path d={STAR} />\n                </svg>\n              </label>\n            </span>\n          );\n        })}\n      </div>\n      <p className=\"mt-1 text-sm text-stone-600\" aria-hidden=\"true\">\n        {WORDS[lit - 1]}\n      </p>\n    </fieldset>\n  );\n}\n";

const s3Demo = (() => {
const STAR = "M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z";

function StarHalfInput() {
  const [value, setValue] = useState(3.5);
  const [hover, setHover] = useState(0);
  const lit = hover || value;

  return (
    <fieldset className="w-full max-w-xs">
      <legend className="text-sm font-semibold text-stone-900">Rate this recipe</legend>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => {
            const fill = Math.max(0, Math.min(1, lit - (star - 1)));
            return (
              <div key={star} className="relative h-12 w-12">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="absolute inset-0 h-full w-full fill-stone-200">
                  <path d={STAR} />
                </svg>
                <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-12 w-12 fill-rose-500">
                    <path d={STAR} />
                  </svg>
                </div>
                {[star - 0.5, star].map((v, half) => (
                  <span key={v}>
                    <input id={`recipe-${v}`} type="radio" name="recipe" value={v} checked={value === v} onChange={() => setValue(v)} className="peer sr-only" />
                    <label
                      htmlFor={`recipe-${v}`}
                      onMouseEnter={() => setHover(v)}
                      className={`absolute inset-y-0 w-1/2 cursor-pointer rounded-md peer-focus-visible:ring-2 peer-focus-visible:ring-rose-600 ${half ? "right-0" : "left-0"}`}
                    >
                      <span className="sr-only">{v} stars</span>
                    </label>
                  </span>
                ))}
              </div>
            );
          })}
        </div>
        <span className="text-sm font-semibold tabular-nums text-stone-900" aria-hidden="true">
          {lit.toFixed(1)}
        </span>
      </div>
      <p className="mt-1 text-xs text-stone-600">Click the left half of a star for a half point.</p>
    </fieldset>
  );
}
  return StarHalfInput;
})();
const s3React = "import { useState } from \"react\";\n\nconst STAR = \"M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z\";\n\nexport default function StarHalfInput() {\n  const [value, setValue] = useState(3.5);\n  const [hover, setHover] = useState(0);\n  const lit = hover || value;\n\n  return (\n    <fieldset className=\"w-full max-w-xs\">\n      <legend className=\"text-sm font-semibold text-stone-900\">Rate this recipe</legend>\n      <div className=\"mt-2 flex items-center gap-3\">\n        <div className=\"flex\" onMouseLeave={() => setHover(0)}>\n          {[1, 2, 3, 4, 5].map((star) => {\n            const fill = Math.max(0, Math.min(1, lit - (star - 1)));\n            return (\n              <div key={star} className=\"relative h-12 w-12\">\n                <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" className=\"absolute inset-0 h-full w-full fill-stone-200\">\n                  <path d={STAR} />\n                </svg>\n                <div className=\"absolute inset-y-0 left-0 overflow-hidden\" style={{ width: `${fill * 100}%` }}>\n                  <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" className=\"h-12 w-12 fill-rose-500\">\n                    <path d={STAR} />\n                  </svg>\n                </div>\n                {[star - 0.5, star].map((v, half) => (\n                  <span key={v}>\n                    <input id={`recipe-${v}`} type=\"radio\" name=\"recipe\" value={v} checked={value === v} onChange={() => setValue(v)} className=\"peer sr-only\" />\n                    <label\n                      htmlFor={`recipe-${v}`}\n                      onMouseEnter={() => setHover(v)}\n                      className={`absolute inset-y-0 w-1/2 cursor-pointer rounded-md peer-focus-visible:ring-2 peer-focus-visible:ring-rose-600 ${half ? \"right-0\" : \"left-0\"}`}\n                    >\n                      <span className=\"sr-only\">{v} stars</span>\n                    </label>\n                  </span>\n                ))}\n              </div>\n            );\n          })}\n        </div>\n        <span className=\"text-sm font-semibold tabular-nums text-stone-900\" aria-hidden=\"true\">\n          {lit.toFixed(1)}\n        </span>\n      </div>\n      <p className=\"mt-1 text-xs text-stone-600\">Click the left half of a star for a half point.</p>\n    </fieldset>\n  );\n}\n";

const s4Demo = (() => {
// Pure CSS: no state at all. Inputs and labels must be direct siblings for ~ and :has() to work.
const css = `
.css-rate { border: 0; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
.css-rate legend { font-size: 14px; font-weight: 600; color: #1c1917; }
.css-rate-stars { display: flex; margin-top: 8px; }
.css-rate-stars input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.css-rate-stars label { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 8px; cursor: pointer; }
.css-rate-stars label::before {
  content: ""; width: 30px; height: 30px; background: #d6d3d1;
  clip-path: polygon(50% 4%, 61% 37%, 96% 37%, 68% 58%, 79% 92%, 50% 71%, 21% 92%, 32% 58%, 4% 37%, 39% 37%);
  transition: background-color .15s;
}
.css-rate-stars input:checked + label::before,
.css-rate-stars label:has(~ input:checked)::before,
.css-rate-stars label:hover::before,
.css-rate-stars label:has(~ label:hover)::before { background: #0d9488; }
.css-rate-stars input:focus-visible + label { outline: 2px solid #0f766e; outline-offset: 1px; }
.css-rate-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .css-rate-stars label::before { transition: none; } }
`;

function StarPureCss() {
  return (
    <fieldset className="css-rate">
      <style>{css}</style>
      <legend>Rate the delivery</legend>
      <div className="css-rate-stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <Fragment key={n}>
            <input type="radio" id={`deliv-${n}`} name="delivery" value={n} defaultChecked={n === 3} />
            <label htmlFor={`deliv-${n}`}>
              <span className="css-rate-sr">{n} {n === 1 ? "star" : "stars"}</span>
            </label>
          </Fragment>
        ))}
      </div>
    </fieldset>
  );
}
  return StarPureCss;
})();
const s4React = "import { Fragment } from \"react\";\n\n// Pure CSS: no state at all. Inputs and labels must be direct siblings for ~ and :has() to work.\nconst css = `\n.css-rate { border: 0; margin: 0; padding: 0; font-family: system-ui, sans-serif; }\n.css-rate legend { font-size: 14px; font-weight: 600; color: #1c1917; }\n.css-rate-stars { display: flex; margin-top: 8px; }\n.css-rate-stars input { position: absolute; opacity: 0; width: 1px; height: 1px; }\n.css-rate-stars label { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 8px; cursor: pointer; }\n.css-rate-stars label::before {\n  content: \"\"; width: 30px; height: 30px; background: #d6d3d1;\n  clip-path: polygon(50% 4%, 61% 37%, 96% 37%, 68% 58%, 79% 92%, 50% 71%, 21% 92%, 32% 58%, 4% 37%, 39% 37%);\n  transition: background-color .15s;\n}\n.css-rate-stars input:checked + label::before,\n.css-rate-stars label:has(~ input:checked)::before,\n.css-rate-stars label:hover::before,\n.css-rate-stars label:has(~ label:hover)::before { background: #0d9488; }\n.css-rate-stars input:focus-visible + label { outline: 2px solid #0f766e; outline-offset: 1px; }\n.css-rate-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }\n@media (prefers-reduced-motion: reduce) { .css-rate-stars label::before { transition: none; } }\n`;\n\nexport default function StarPureCss() {\n  return (\n    <fieldset className=\"css-rate\">\n      <style>{css}</style>\n      <legend>Rate the delivery</legend>\n      <div className=\"css-rate-stars\">\n        {[1, 2, 3, 4, 5].map((n) => (\n          <Fragment key={n}>\n            <input type=\"radio\" id={`deliv-${n}`} name=\"delivery\" value={n} defaultChecked={n === 3} />\n            <label htmlFor={`deliv-${n}`}>\n              <span className=\"css-rate-sr\">{n} {n === 1 ? \"star\" : \"stars\"}</span>\n            </label>\n          </Fragment>\n        ))}\n      </div>\n    </fieldset>\n  );\n}\n";

const s4Html = `<fieldset class="css-rate">
  <legend>Rate the delivery</legend>
  <div class="css-rate-stars">
    <input type="radio" id="deliv-1" name="delivery" value="1"><label for="deliv-1"><span class="css-rate-sr">1 star</span></label>
    <input type="radio" id="deliv-2" name="delivery" value="2"><label for="deliv-2"><span class="css-rate-sr">2 stars</span></label>
    <input type="radio" id="deliv-3" name="delivery" value="3" checked><label for="deliv-3"><span class="css-rate-sr">3 stars</span></label>
    <input type="radio" id="deliv-4" name="delivery" value="4"><label for="deliv-4"><span class="css-rate-sr">4 stars</span></label>
    <input type="radio" id="deliv-5" name="delivery" value="5"><label for="deliv-5"><span class="css-rate-sr">5 stars</span></label>
  </div>
</fieldset>

<style>
.css-rate { border: 0; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
.css-rate legend { font-size: 14px; font-weight: 600; color: #1c1917; }
.css-rate-stars { display: flex; margin-top: 8px; }
.css-rate-stars input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.css-rate-stars label { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 8px; cursor: pointer; }
.css-rate-stars label::before {
  content: ""; width: 30px; height: 30px; background: #d6d3d1;
  clip-path: polygon(50% 4%, 61% 37%, 96% 37%, 68% 58%, 79% 92%, 50% 71%, 21% 92%, 32% 58%, 4% 37%, 39% 37%);
  transition: background-color .15s;
}
.css-rate-stars input:checked + label::before,
.css-rate-stars label:has(~ input:checked)::before,
.css-rate-stars label:hover::before,
.css-rate-stars label:has(~ label:hover)::before { background: #0d9488; }
.css-rate-stars input:focus-visible + label { outline: 2px solid #0f766e; outline-offset: 1px; }
.css-rate-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .css-rate-stars label::before { transition: none; } }
</style>
`;

const s6Demo = (() => {
const LABELS = ["Not useful", "Slightly useful", "Useful", "Very useful", "Essential"];

// Custom radio group with roving tabindex, following the WAI-ARIA radio group pattern.
function StarRovingTiles() {
  const [value, setValue] = useState(4);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusable = value ? value - 1 : 0;

  function choose(i: number) {
    setValue(i + 1);
    refs.current[i]?.focus();
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLButtonElement>) {
    const last = LABELS.length - 1;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i === 0 ? last : i - 1)
      : null;
    if (next === null) return;
    e.preventDefault();
    choose(next);
  }

  return (
    <div className="w-full max-w-xs rounded-xl bg-stone-900 p-4 text-stone-100">
      <p id="guide-q" className="text-sm font-semibold">
        Was this guide useful?
      </p>
      <div role="radiogroup" aria-labelledby="guide-q" className="mt-3 grid grid-cols-5 gap-1.5">
        {LABELS.map((label, i) => {
          const checked = value === i + 1;
          const lit = i < value;
          return (
            <button
              key={label}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={`${i + 1} of 5, ${label}`}
              tabIndex={i === focusable ? 0 : -1}
              onClick={() => choose(i)}
              onKeyDown={(e) => onKeyDown(i, e)}
              className={`flex h-12 flex-col items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                lit ? "bg-amber-400 text-stone-950" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex min-h-[40px] items-center justify-between">
        <p className="text-sm text-stone-300">{value ? LABELS[value - 1] : "Pick a score from 1 to 5"}</p>
        {value > 0 && (
          <button type="button" onClick={() => setValue(0)} className="h-10 rounded-md px-3 text-sm text-stone-200 hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
  return StarRovingTiles;
})();
const s6React = "import { useRef, useState, type KeyboardEvent } from \"react\";\n\nconst LABELS = [\"Not useful\", \"Slightly useful\", \"Useful\", \"Very useful\", \"Essential\"];\n\n// Custom radio group with roving tabindex, following the WAI-ARIA radio group pattern.\nexport default function StarRovingTiles() {\n  const [value, setValue] = useState(4);\n  const refs = useRef<(HTMLButtonElement | null)[]>([]);\n  const focusable = value ? value - 1 : 0;\n\n  function choose(i: number) {\n    setValue(i + 1);\n    refs.current[i]?.focus();\n  }\n\n  function onKeyDown(i: number, e: KeyboardEvent<HTMLButtonElement>) {\n    const last = LABELS.length - 1;\n    const next =\n      e.key === \"ArrowRight\" || e.key === \"ArrowDown\" ? (i === last ? 0 : i + 1)\n      : e.key === \"ArrowLeft\" || e.key === \"ArrowUp\" ? (i === 0 ? last : i - 1)\n      : null;\n    if (next === null) return;\n    e.preventDefault();\n    choose(next);\n  }\n\n  return (\n    <div className=\"w-full max-w-xs rounded-xl bg-stone-900 p-4 text-stone-100\">\n      <p id=\"guide-q\" className=\"text-sm font-semibold\">\n        Was this guide useful?\n      </p>\n      <div role=\"radiogroup\" aria-labelledby=\"guide-q\" className=\"mt-3 grid grid-cols-5 gap-1.5\">\n        {LABELS.map((label, i) => {\n          const checked = value === i + 1;\n          const lit = i < value;\n          return (\n            <button\n              key={label}\n              ref={(el) => {\n                refs.current[i] = el;\n              }}\n              type=\"button\"\n              role=\"radio\"\n              aria-checked={checked}\n              aria-label={`${i + 1} of 5, ${label}`}\n              tabIndex={i === focusable ? 0 : -1}\n              onClick={() => choose(i)}\n              onKeyDown={(e) => onKeyDown(i, e)}\n              className={`flex h-12 flex-col items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${\n                lit ? \"bg-amber-400 text-stone-950\" : \"bg-stone-800 text-stone-300 hover:bg-stone-700\"\n              }`}\n            >\n              {i + 1}\n            </button>\n          );\n        })}\n      </div>\n      <div className=\"mt-3 flex min-h-[40px] items-center justify-between\">\n        <p className=\"text-sm text-stone-300\">{value ? LABELS[value - 1] : \"Pick a score from 1 to 5\"}</p>\n        {value > 0 && (\n          <button type=\"button\" onClick={() => setValue(0)} className=\"h-10 rounded-md px-3 text-sm text-stone-200 hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300\">\n            Clear\n          </button>\n        )}\n      </div>\n    </div>\n  );\n}\n";

const PIECES: Piece[] = [
  { id: "s1", name: "Read-only score, quarter-star fill", blurb: "A clipped row of filled stars over an empty row, labelled once as an image.", group: "display", Demo: s1Demo, react: s1React, html: s1Html, stage: "bg-[#faf8f4] ring-1 ring-inset ring-stone-200/80" },
  { id: "s5", name: "Review summary with bars", blurb: "Average worked out from the counts, with bars that filter by star level.", group: "display", Demo: s5Demo, react: s5React, stage: "bg-[#faf8f4] ring-1 ring-inset ring-stone-200/80" },
  { id: "s2", name: "Star input on native radios", blurb: "Hover preview, a word for each level and real radio keyboard behaviour.", group: "input", Demo: s2Demo, react: s2React, stage: "bg-[#faf8f4] ring-1 ring-inset ring-stone-200/80" },
  { id: "s3", name: "Half-star input", blurb: "Two hit areas per star give scores from 0.5 to 5.", group: "input", Demo: s3Demo, react: s3React, stage: "bg-[#faf8f4] ring-1 ring-inset ring-stone-200/80" },
  { id: "s4", name: "Pure CSS radio rating", blurb: "No state or script. Radios in their natural order coloured with :has().", group: "input", Demo: s4Demo, react: s4React, html: s4Html, stage: "bg-[#faf8f4] ring-1 ring-inset ring-stone-200/80" },
  { id: "s6", name: "Numbered score tiles", blurb: "A custom radio group with roving focus and a clear button.", group: "input", Demo: s6Demo, react: s6React, stage: "bg-[#faf8f4] ring-1 ring-inset ring-stone-200/80" }
];
const GROUPS: { key: string; label: string }[] = [{"key":"display","label":"Display only"},{"key":"input","label":"Rating inputs"}];
const TEXT: { eyebrow: string; title: string; lead: string; refTitle: string; refNote: string } = {"eyebrow":"React · pure CSS · HTML","title":"Star ratings you can read and set","lead":"Six rating pieces: a read-only score with quarter-star fill, a review summary with filter bars, a radio-based star input, a half-star input, a version with no script at all and a numbered score picker.","refTitle":"Which markup to use","refNote":"Roles and keys follow the radio group pattern in the WAI-ARIA Authoring Practices Guide. Support for :has() and CSS masks is per MDN's compatibility data."};
const REF_HEAD: string[] = ["Case","Markup","Keyboard"];
const REF_ROWS: string[][] = [
  [
    "Showing a score",
    "One element with role=\"img\" and aria-label=\"Rated 4.3 out of 5\". The drawn stars are aria-hidden.",
    "Not focusable; nothing to operate."
  ],
  [
    "Choosing a score",
    "Native radio inputs in a fieldset with a legend; each label holds a star and hidden text.",
    "Tab enters the group, arrow keys move and select, as with any radio set."
  ],
  [
    "Half stars",
    "Ten radios, two per star, each label covering one half.",
    "Arrow keys step by half a point."
  ],
  [
    "No JavaScript",
    "Radios plus :has() to colour the stars before the checked one. Needs a browser with :has() support.",
    "Native radio keys."
  ],
  [
    "Custom buttons",
    "role=\"radiogroup\" with role=\"radio\" buttons, aria-checked and a roving tabindex.",
    "Arrows move, check and wrap; only one button is in the tab order."
  ],
  [
    "Summary bars",
    "Buttons with aria-pressed to filter reviews by star level.",
    "Tab and Enter or Space."
  ]
];

const COPY_ICON = "M9 9h10v10H9zM5 15V5h10";
const CHECK_ICON = "M5 12.5l4.5 4.5L19 7.5";
const CODE_ICON = "M8 7l-5 5 5 5M16 7l5 5-5 5";

export default function StarRatingCollection() {
  const [group, setGroup] = useState("all");
  const [langs, setLangs] = useState<Record<string, Lang>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const shown = group === "all" ? PIECES : PIECES.filter((p) => p.group === group);
  const langOf = (p: Piece): Lang => (p.html ? langs[p.id] ?? "react" : "react");
  const codeOf = (p: Piece) => (langOf(p) === "html" && p.html ? p.html : p.react);
  const langName = (l: Lang) => (l === "html" ? "HTML, CSS and JS" : "React and Tailwind");

  async function copy(p: Piece) {
    let ok = false;
    try {
      await navigator.clipboard.writeText(codeOf(p));
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) setOpen(p.id);
    setCopied(ok ? p.id : null);
    setAnnounce(ok ? `${p.name}: ${langName(langOf(p))} copied` : "Copy was blocked, so the code is shown under the demo for you to select");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  }

  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2";
  const chip = `inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-colors ${ring}`;

  return (
    <section
      className="bg-white px-4 py-12 sm:px-8 sm:py-14"
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}
    >
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">{TEXT.eyebrow}</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] text-stone-950 sm:text-[42px]">{TEXT.title}</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-stone-600">{TEXT.lead}</p>
        </header>

        <div role="group" aria-label="Filter the collection" className="mt-8 flex flex-wrap gap-1.5 border-y border-stone-300/70 py-4">
          {[{ key: "all", label: "All" }, ...GROUPS, { key: "ref", label: "Reference table" }].map((g) => {
            const on = group === g.key;
            const n = g.key === "ref" ? REF_ROWS.length : g.key === "all" ? PIECES.length : PIECES.filter((p) => p.group === g.key).length;
            return (
              <button
                key={g.key}
                type="button"
                aria-pressed={on}
                onClick={() => setGroup(g.key)}
                className={`${chip} ${on ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"}`}
              >
                {g.label}
                <span className={`font-mono text-[11px] ${on ? "opacity-75" : "text-stone-500"}`}>{n}</span>
              </button>
            );
          })}
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>

        {group !== "ref" && (
        <ul className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => {
            const isOpen = open === p.id;
            const l = langOf(p);
            return (
              <li
                key={p.id}
                className={`flex min-w-0 flex-col rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.05)] ${isOpen ? "md:col-span-2 lg:col-span-3" : ""}`}
              >
                <div className="px-4 pt-4">
                  <h3 className="text-[14px] font-semibold text-stone-950">{p.name}</h3>
                  <p className="mt-0.5 text-[13px] leading-snug text-stone-600">{p.blurb}</p>
                </div>
                <div className={`relative mx-3 mt-3 flex min-w-0 items-start justify-center rounded-xl px-3 py-6 sm:px-5 ${p.stage}`}>
                  <p.Demo />
                </div>
                <div className="flex flex-wrap items-center gap-2 px-3 py-3">
                  {p.html && (
                    <div role="group" aria-label={`Code version for ${p.name}`} className="inline-flex rounded-lg bg-stone-100 p-0.5">
                      {(["react", "html"] as Lang[]).map((x) => (
                        <button
                          key={x}
                          type="button"
                          aria-pressed={l === x}
                          onClick={() => setLangs({ ...langs, [p.id]: x })}
                          className={`h-9 rounded-md px-2.5 text-[12px] font-semibold ${ring} ${l === x ? "bg-white text-stone-950 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
                        >
                          {x === "react" ? "React" : "HTML"}
                        </button>
                      ))}
                    </div>
                  )}
                  <span className="flex-1" />
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`code-${p.id}`}
                    onClick={() => setOpen(isOpen ? null : p.id)}
                    className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold text-stone-700 hover:bg-stone-100 ${ring}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                      <path d={CODE_ICON} />
                    </svg>
                    {isOpen ? "Hide code" : "Code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(p)}
                    aria-label={`Copy ${langName(l)} for ${p.name}`}
                    className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${ring} ${copied === p.id ? "bg-emerald-700 text-white" : "bg-stone-900 text-white hover:bg-stone-700"}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                      <path d={copied === p.id ? CHECK_ICON : COPY_ICON} />
                    </svg>
                    {copied === p.id ? "Copied" : "Copy"}
                  </button>
                </div>
                {isOpen && (
                  <pre
                    id={`code-${p.id}`}
                    tabIndex={0}
                    aria-label={`${langName(l)} for ${p.name}`}
                    className="max-h-[440px] overflow-auto rounded-b-2xl border-t border-stone-800 bg-[#121316] p-4 font-mono text-[12px] leading-[1.65] text-stone-200"
                  >
                    <code>{codeOf(p)}</code>
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
        )}

        {group === "ref" && (
        <div className="mt-6">
          <h3 className="text-[17px] font-semibold tracking-tight text-stone-950">{TEXT.refTitle}</h3>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-stone-600">{TEXT.refNote}</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white" tabIndex={0} role="region" aria-label={TEXT.refTitle}>
            <table className="w-full min-w-[600px] text-left text-[13px]">
              <thead className="bg-stone-50 text-stone-700">
                <tr>
                  {REF_HEAD.map((h) => (
                    <th key={h} scope="col" className="px-4 py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REF_ROWS.map((r, i) => (
                  <tr key={i} className="border-t border-stone-200 align-top">
                    {r.map((c, j) =>
                      j === 0 ? (
                        <th key={j} scope="row" className="whitespace-nowrap px-4 py-2.5 font-mono text-[12px] font-medium text-stone-900">
                          {c}
                        </th>
                      ) : (
                        <td key={j} className="px-4 py-2.5 leading-relaxed text-stone-700">
                          {c}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
