import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from "react";

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

const q1Demo = (() => {
const MIN = 1;
const MAX = 10;

function QuantityClassic() {
  const [qty, setQty] = useState(2);
  const [draft, setDraft] = useState("2");

  const set = (n: number) => {
    const v = Math.min(MAX, Math.max(MIN, Math.round(n)));
    setQty(v);
    setDraft(String(v));
  };

  // Spinbutton keys from the WAI-ARIA Authoring Practices.
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const keys: Record<string, number> = { ArrowUp: qty + 1, ArrowDown: qty - 1, PageUp: qty + 5, PageDown: qty - 5, Home: MIN, End: MAX };
    if (e.key in keys) {
      e.preventDefault();
      set(keys[e.key]);
    } else if (e.key === "Enter") set(Number(draft) || MIN);
  }

  const btn =
    "grid w-11 place-items-center text-stone-700 transition-colors hover:bg-stone-100 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 aria-disabled:cursor-not-allowed aria-disabled:text-stone-300 aria-disabled:hover:bg-transparent";

  return (
    <div>
      <label htmlFor="qty-classic" className="block text-sm font-semibold text-stone-900">
        Quantity
      </label>
      <div className="mt-2 inline-flex h-11 items-stretch overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm">
        <button type="button" aria-label="Decrease quantity" aria-controls="qty-classic" aria-disabled={qty <= MIN} onClick={() => qty > MIN && set(qty - 1)} className={btn}>
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth={2} strokeLinecap="round">
            <path d="M5 10h10" />
          </svg>
        </button>
        <input
          id="qty-classic"
          type="text"
          inputMode="numeric"
          role="spinbutton"
          aria-valuenow={qty}
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-describedby="qty-classic-help"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 2))}
          onBlur={() => set(Number(draft) || MIN)}
          onKeyDown={onKeyDown}
          className="w-14 border-x border-stone-300 text-center text-base font-semibold tabular-nums text-stone-900 outline-none focus-visible:bg-emerald-50"
        />
        <button type="button" aria-label="Increase quantity" aria-controls="qty-classic" aria-disabled={qty >= MAX} onClick={() => qty < MAX && set(qty + 1)} className={btn}>
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth={2} strokeLinecap="round">
            <path d="M5 10h10M10 5v10" />
          </svg>
        </button>
      </div>
      <p id="qty-classic-help" className="mt-2 text-xs text-stone-600">
        Limit {MAX} per order. Arrow keys, Page Up and Page Down work too.
      </p>
    </div>
  );
}
  return QuantityClassic;
})();
const q1React = "import { useState, type KeyboardEvent } from \"react\";\n\nconst MIN = 1;\nconst MAX = 10;\n\nexport default function QuantityClassic() {\n  const [qty, setQty] = useState(2);\n  const [draft, setDraft] = useState(\"2\");\n\n  const set = (n: number) => {\n    const v = Math.min(MAX, Math.max(MIN, Math.round(n)));\n    setQty(v);\n    setDraft(String(v));\n  };\n\n  // Spinbutton keys from the WAI-ARIA Authoring Practices.\n  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {\n    const keys: Record<string, number> = { ArrowUp: qty + 1, ArrowDown: qty - 1, PageUp: qty + 5, PageDown: qty - 5, Home: MIN, End: MAX };\n    if (e.key in keys) {\n      e.preventDefault();\n      set(keys[e.key]);\n    } else if (e.key === \"Enter\") set(Number(draft) || MIN);\n  }\n\n  const btn =\n    \"grid w-11 place-items-center text-stone-700 transition-colors hover:bg-stone-100 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 aria-disabled:cursor-not-allowed aria-disabled:text-stone-300 aria-disabled:hover:bg-transparent\";\n\n  return (\n    <div>\n      <label htmlFor=\"qty-classic\" className=\"block text-sm font-semibold text-stone-900\">\n        Quantity\n      </label>\n      <div className=\"mt-2 inline-flex h-11 items-stretch overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm\">\n        <button type=\"button\" aria-label=\"Decrease quantity\" aria-controls=\"qty-classic\" aria-disabled={qty <= MIN} onClick={() => qty > MIN && set(qty - 1)} className={btn}>\n          <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className=\"h-4 w-4 fill-none stroke-current\" strokeWidth={2} strokeLinecap=\"round\">\n            <path d=\"M5 10h10\" />\n          </svg>\n        </button>\n        <input\n          id=\"qty-classic\"\n          type=\"text\"\n          inputMode=\"numeric\"\n          role=\"spinbutton\"\n          aria-valuenow={qty}\n          aria-valuemin={MIN}\n          aria-valuemax={MAX}\n          aria-describedby=\"qty-classic-help\"\n          value={draft}\n          onChange={(e) => setDraft(e.target.value.replace(/\\D/g, \"\").slice(0, 2))}\n          onBlur={() => set(Number(draft) || MIN)}\n          onKeyDown={onKeyDown}\n          className=\"w-14 border-x border-stone-300 text-center text-base font-semibold tabular-nums text-stone-900 outline-none focus-visible:bg-emerald-50\"\n        />\n        <button type=\"button\" aria-label=\"Increase quantity\" aria-controls=\"qty-classic\" aria-disabled={qty >= MAX} onClick={() => qty < MAX && set(qty + 1)} className={btn}>\n          <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className=\"h-4 w-4 fill-none stroke-current\" strokeWidth={2} strokeLinecap=\"round\">\n            <path d=\"M5 10h10M10 5v10\" />\n          </svg>\n        </button>\n      </div>\n      <p id=\"qty-classic-help\" className=\"mt-2 text-xs text-stone-600\">\n        Limit {MAX} per order. Arrow keys, Page Up and Page Down work too.\n      </p>\n    </div>\n  );\n}\n";

const q1Html = `<div class="qty" data-min="1" data-max="10">
  <label for="qty-classic" class="qty-label">Quantity</label>
  <div class="qty-box">
    <button type="button" class="qty-btn" data-step="-1" aria-label="Decrease quantity" aria-controls="qty-classic">
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10h10"/></svg>
    </button>
    <input id="qty-classic" class="qty-input" type="text" inputmode="numeric" role="spinbutton"
      value="2" aria-valuenow="2" aria-valuemin="1" aria-valuemax="10" aria-describedby="qty-classic-help">
    <button type="button" class="qty-btn" data-step="1" aria-label="Increase quantity" aria-controls="qty-classic">
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10h10M10 5v10"/></svg>
    </button>
  </div>
  <p id="qty-classic-help" class="qty-help">Limit 10 per order. Arrow keys, Page Up and Page Down work too.</p>
</div>

<style>
  .qty { font-family: system-ui, sans-serif; color: #1c1917; }
  .qty-label { display: block; font-size: 14px; font-weight: 600; }
  .qty-box { display: inline-flex; height: 44px; margin-top: 8px; overflow: hidden;
    border: 1px solid #d6d3d1; border-radius: 8px; background: #fff; box-shadow: 0 1px 2px rgb(0 0 0 / 0.05); }
  .qty-btn { display: grid; place-items: center; width: 44px; border: 0; background: none; color: #44403c; cursor: pointer; }
  .qty-btn:hover { background: #f5f5f4; }
  .qty-btn[aria-disabled="true"] { color: #d6d3d1; cursor: not-allowed; background: none; }
  .qty-btn:focus-visible { outline: 2px solid #047857; outline-offset: -2px; }
  .qty-btn svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
  .qty-input { width: 56px; border: 0; border-inline: 1px solid #d6d3d1; text-align: center;
    font: 600 16px system-ui, sans-serif; font-variant-numeric: tabular-nums; color: #1c1917; outline: none; }
  .qty-input:focus-visible { background: #ecfdf5; }
  .qty-help { margin: 8px 0 0; font-size: 12px; color: #57534e; }
</style>

<script>
  document.querySelectorAll(".qty").forEach((root) => {
    const input = root.querySelector(".qty-input");
    const [dec, inc] = root.querySelectorAll(".qty-btn");
    const min = Number(root.dataset.min), max = Number(root.dataset.max);
    let value = Number(input.value);

    function set(n) {
      value = Math.min(max, Math.max(min, Math.round(n) || min));
      input.value = value;
      input.setAttribute("aria-valuenow", value);
      dec.setAttribute("aria-disabled", value <= min);
      inc.setAttribute("aria-disabled", value >= max);
    }

    root.querySelectorAll(".qty-btn").forEach((b) =>
      b.addEventListener("click", () => set(value + Number(b.dataset.step)))
    );
    input.addEventListener("input", () => { input.value = input.value.replace(/\\D/g, "").slice(0, 2); });
    input.addEventListener("blur", () => set(Number(input.value)));
    input.addEventListener("keydown", (e) => {
      const keys = { ArrowUp: value + 1, ArrowDown: value - 1, PageUp: value + 5, PageDown: value - 5, Home: min, End: max };
      if (e.key in keys) { e.preventDefault(); set(keys[e.key]); }
      else if (e.key === "Enter") set(Number(input.value));
    });
    set(value);
  });
</script>
`;

const q3Demo = (() => {
const STEP = 6; // sold by the case
const MIN = 6;
const MAX = 48;

function QuantityCasePacks() {
  const [qty, setQty] = useState(12);
  const [draft, setDraft] = useState("12");
  const [note, setNote] = useState("");

  // Snaps any typed number to the nearest whole case.
  function commit(n: number) {
    const snapped = Math.min(MAX, Math.max(MIN, Math.round(n / STEP) * STEP));
    setNote(n && snapped !== n ? `Rounded ${n} to ${snapped}, a full case.` : "");
    setQty(snapped);
    setDraft(String(snapped));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const keys: Record<string, number> = { ArrowUp: qty + STEP, ArrowDown: qty - STEP, Home: MIN, End: MAX };
    if (e.key in keys) {
      e.preventDefault();
      commit(keys[e.key]);
    } else if (e.key === "Enter") commit(Number(draft));
  }

  const cases = qty / STEP;
  const side =
    "flex h-12 w-12 items-center justify-center rounded-xl border border-stone-300 bg-white text-lg font-medium text-stone-800 hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:text-stone-300";

  return (
    <div className="w-full max-w-[16rem]">
      <label htmlFor="qty-case" className="block text-sm font-semibold text-stone-900">
        Sparkling water, bottles
      </label>
      <p id="qty-case-help" className="mt-0.5 text-xs text-stone-600">
        Sold in cases of {STEP}, up to {MAX} bottles.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" aria-label={`Remove a case of ${STEP}`} disabled={qty <= MIN} onClick={() => commit(qty - STEP)} className={side}>
          -{STEP}
        </button>
        <div className="flex h-12 flex-1 flex-col items-center justify-center rounded-xl bg-emerald-50">
          <input
            id="qty-case"
            type="text"
            inputMode="numeric"
            role="spinbutton"
            aria-valuenow={qty}
            aria-valuemin={MIN}
            aria-valuemax={MAX}
            aria-valuetext={`${qty} bottles, ${cases} ${cases === 1 ? "case" : "cases"}`}
            aria-describedby="qty-case-help"
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 3))}
            onBlur={() => commit(Number(draft))}
            onKeyDown={onKeyDown}
            className="w-16 rounded bg-transparent text-center text-base font-semibold leading-tight tabular-nums text-emerald-950 outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          />
          <span aria-hidden="true" className="text-[11px] leading-tight text-emerald-800">
            {cases} {cases === 1 ? "case" : "cases"}
          </span>
        </div>
        <button type="button" aria-label={`Add a case of ${STEP}`} disabled={qty >= MAX} onClick={() => commit(qty + STEP)} className={side}>
          +{STEP}
        </button>
      </div>
      <p role="status" className="mt-2 min-h-[1rem] text-xs text-stone-600">
        {note}
      </p>
    </div>
  );
}
  return QuantityCasePacks;
})();
const q3React = "import { useState, type KeyboardEvent } from \"react\";\n\nconst STEP = 6; // sold by the case\nconst MIN = 6;\nconst MAX = 48;\n\nexport default function QuantityCasePacks() {\n  const [qty, setQty] = useState(12);\n  const [draft, setDraft] = useState(\"12\");\n  const [note, setNote] = useState(\"\");\n\n  // Snaps any typed number to the nearest whole case.\n  function commit(n: number) {\n    const snapped = Math.min(MAX, Math.max(MIN, Math.round(n / STEP) * STEP));\n    setNote(n && snapped !== n ? `Rounded ${n} to ${snapped}, a full case.` : \"\");\n    setQty(snapped);\n    setDraft(String(snapped));\n  }\n\n  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {\n    const keys: Record<string, number> = { ArrowUp: qty + STEP, ArrowDown: qty - STEP, Home: MIN, End: MAX };\n    if (e.key in keys) {\n      e.preventDefault();\n      commit(keys[e.key]);\n    } else if (e.key === \"Enter\") commit(Number(draft));\n  }\n\n  const cases = qty / STEP;\n  const side =\n    \"flex h-12 w-12 items-center justify-center rounded-xl border border-stone-300 bg-white text-lg font-medium text-stone-800 hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:text-stone-300\";\n\n  return (\n    <div className=\"w-full max-w-[16rem]\">\n      <label htmlFor=\"qty-case\" className=\"block text-sm font-semibold text-stone-900\">\n        Sparkling water, bottles\n      </label>\n      <p id=\"qty-case-help\" className=\"mt-0.5 text-xs text-stone-600\">\n        Sold in cases of {STEP}, up to {MAX} bottles.\n      </p>\n      <div className=\"mt-3 flex items-center gap-2\">\n        <button type=\"button\" aria-label={`Remove a case of ${STEP}`} disabled={qty <= MIN} onClick={() => commit(qty - STEP)} className={side}>\n          -{STEP}\n        </button>\n        <div className=\"flex h-12 flex-1 flex-col items-center justify-center rounded-xl bg-emerald-50\">\n          <input\n            id=\"qty-case\"\n            type=\"text\"\n            inputMode=\"numeric\"\n            role=\"spinbutton\"\n            aria-valuenow={qty}\n            aria-valuemin={MIN}\n            aria-valuemax={MAX}\n            aria-valuetext={`${qty} bottles, ${cases} ${cases === 1 ? \"case\" : \"cases\"}`}\n            aria-describedby=\"qty-case-help\"\n            value={draft}\n            onChange={(e) => setDraft(e.target.value.replace(/\\D/g, \"\").slice(0, 3))}\n            onBlur={() => commit(Number(draft))}\n            onKeyDown={onKeyDown}\n            className=\"w-16 rounded bg-transparent text-center text-base font-semibold leading-tight tabular-nums text-emerald-950 outline-none focus-visible:ring-2 focus-visible:ring-emerald-700\"\n          />\n          <span aria-hidden=\"true\" className=\"text-[11px] leading-tight text-emerald-800\">\n            {cases} {cases === 1 ? \"case\" : \"cases\"}\n          </span>\n        </div>\n        <button type=\"button\" aria-label={`Add a case of ${STEP}`} disabled={qty >= MAX} onClick={() => commit(qty + STEP)} className={side}>\n          +{STEP}\n        </button>\n      </div>\n      <p role=\"status\" className=\"mt-2 min-h-[1rem] text-xs text-stone-600\">\n        {note}\n      </p>\n    </div>\n  );\n}\n";

const q5Demo = (() => {
// Work in whole quarter-kilos so 0.1 + 0.2 style rounding errors never show up.
const STEP_Q = 1; // 0.25 kg
const MIN_Q = 1;
const MAX_Q = 20; // 5 kg
const PRICE_PER_KG = 18;

function QuantityWeightDecimal() {
  const [q, setQ] = useState(5);
  const [draft, setDraft] = useState("1.25");
  const kg = (n: number) => (n / 4).toFixed(2);

  function set(n: number) {
    const v = Math.min(MAX_Q, Math.max(MIN_Q, Math.round(n)));
    setQ(v);
    setDraft(kg(v));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const keys: Record<string, number> = { ArrowUp: q + STEP_Q, ArrowDown: q - STEP_Q, PageUp: q + 4, PageDown: q - 4, Home: MIN_Q, End: MAX_Q };
    if (e.key in keys) {
      e.preventDefault();
      set(keys[e.key]);
    } else if (e.key === "Enter") set(parseFloat(draft) * 4 || MIN_Q);
  }

  const arrow =
    "grid h-1/2 w-11 place-items-center text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 disabled:text-stone-300";

  return (
    <div className="w-full max-w-[16rem]">
      <label htmlFor="qty-weight" className="block text-sm font-semibold text-stone-900">
        Arabica beans, whole
      </label>
      <div className="mt-2 flex h-14 overflow-hidden rounded-xl border border-stone-300 bg-white focus-within:border-emerald-700">
        <div className="flex flex-1 items-baseline gap-1 px-3 pt-3">
          <input
            id="qty-weight"
            type="text"
            inputMode="decimal"
            role="spinbutton"
            aria-valuenow={q / 4}
            aria-valuemin={MIN_Q / 4}
            aria-valuemax={MAX_Q / 4}
            aria-valuetext={`${kg(q)} kilograms`}
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, "").slice(0, 5))}
            onBlur={() => set(parseFloat(draft) * 4 || MIN_Q)}
            onKeyDown={onKeyDown}
            className="w-full min-w-0 bg-transparent text-xl font-semibold tabular-nums text-stone-900 outline-none"
          />
          <span aria-hidden="true" className="text-sm text-stone-600">
            kg
          </span>
        </div>
        <div className="flex flex-col border-l border-stone-300">
          <button type="button" aria-label="Add 250 grams" aria-controls="qty-weight" disabled={q >= MAX_Q} onClick={() => set(q + STEP_Q)} className={`${arrow} border-b border-stone-300`}>
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 12l4-4 4 4" />
            </svg>
          </button>
          <button type="button" aria-label="Remove 250 grams" aria-controls="qty-weight" disabled={q <= MIN_Q} onClick={() => set(q - STEP_Q)} className={arrow}>
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8l4 4 4-4" />
            </svg>
          </button>
        </div>
      </div>
      <dl className="mt-3 flex justify-between text-sm">
        <dt className="text-stone-600">${PRICE_PER_KG.toFixed(2)} per kg</dt>
        <dd className="font-semibold tabular-nums text-stone-900">${((q / 4) * PRICE_PER_KG).toFixed(2)}</dd>
      </dl>
    </div>
  );
}
  return QuantityWeightDecimal;
})();
const q5React = "import { useState, type KeyboardEvent } from \"react\";\n\n// Work in whole quarter-kilos so 0.1 + 0.2 style rounding errors never show up.\nconst STEP_Q = 1; // 0.25 kg\nconst MIN_Q = 1;\nconst MAX_Q = 20; // 5 kg\nconst PRICE_PER_KG = 18;\n\nexport default function QuantityWeightDecimal() {\n  const [q, setQ] = useState(5);\n  const [draft, setDraft] = useState(\"1.25\");\n  const kg = (n: number) => (n / 4).toFixed(2);\n\n  function set(n: number) {\n    const v = Math.min(MAX_Q, Math.max(MIN_Q, Math.round(n)));\n    setQ(v);\n    setDraft(kg(v));\n  }\n\n  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {\n    const keys: Record<string, number> = { ArrowUp: q + STEP_Q, ArrowDown: q - STEP_Q, PageUp: q + 4, PageDown: q - 4, Home: MIN_Q, End: MAX_Q };\n    if (e.key in keys) {\n      e.preventDefault();\n      set(keys[e.key]);\n    } else if (e.key === \"Enter\") set(parseFloat(draft) * 4 || MIN_Q);\n  }\n\n  const arrow =\n    \"grid h-1/2 w-11 place-items-center text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 disabled:text-stone-300\";\n\n  return (\n    <div className=\"w-full max-w-[16rem]\">\n      <label htmlFor=\"qty-weight\" className=\"block text-sm font-semibold text-stone-900\">\n        Arabica beans, whole\n      </label>\n      <div className=\"mt-2 flex h-14 overflow-hidden rounded-xl border border-stone-300 bg-white focus-within:border-emerald-700\">\n        <div className=\"flex flex-1 items-baseline gap-1 px-3 pt-3\">\n          <input\n            id=\"qty-weight\"\n            type=\"text\"\n            inputMode=\"decimal\"\n            role=\"spinbutton\"\n            aria-valuenow={q / 4}\n            aria-valuemin={MIN_Q / 4}\n            aria-valuemax={MAX_Q / 4}\n            aria-valuetext={`${kg(q)} kilograms`}\n            value={draft}\n            onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, \"\").slice(0, 5))}\n            onBlur={() => set(parseFloat(draft) * 4 || MIN_Q)}\n            onKeyDown={onKeyDown}\n            className=\"w-full min-w-0 bg-transparent text-xl font-semibold tabular-nums text-stone-900 outline-none\"\n          />\n          <span aria-hidden=\"true\" className=\"text-sm text-stone-600\">\n            kg\n          </span>\n        </div>\n        <div className=\"flex flex-col border-l border-stone-300\">\n          <button type=\"button\" aria-label=\"Add 250 grams\" aria-controls=\"qty-weight\" disabled={q >= MAX_Q} onClick={() => set(q + STEP_Q)} className={`${arrow} border-b border-stone-300`}>\n            <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className=\"h-4 w-4 fill-none stroke-current\" strokeWidth={2} strokeLinecap=\"round\" strokeLinejoin=\"round\">\n              <path d=\"M6 12l4-4 4 4\" />\n            </svg>\n          </button>\n          <button type=\"button\" aria-label=\"Remove 250 grams\" aria-controls=\"qty-weight\" disabled={q <= MIN_Q} onClick={() => set(q - STEP_Q)} className={arrow}>\n            <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className=\"h-4 w-4 fill-none stroke-current\" strokeWidth={2} strokeLinecap=\"round\" strokeLinejoin=\"round\">\n              <path d=\"M6 8l4 4 4-4\" />\n            </svg>\n          </button>\n        </div>\n      </div>\n      <dl className=\"mt-3 flex justify-between text-sm\">\n        <dt className=\"text-stone-600\">${PRICE_PER_KG.toFixed(2)} per kg</dt>\n        <dd className=\"font-semibold tabular-nums text-stone-900\">${((q / 4) * PRICE_PER_KG).toFixed(2)}</dd>\n      </dl>\n    </div>\n  );\n}\n";

const q2Demo = (() => {
const product = { name: "Oat milk, barista", size: "1 litre carton", price: 3.4, max: 12 };

function QuantityPillCard() {
  const [qty, setQty] = useState(3);
  const set = (n: number) => setQty(Math.min(product.max, Math.max(0, n)));

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const keys: Record<string, number> = { ArrowUp: qty + 1, ArrowRight: qty + 1, ArrowDown: qty - 1, ArrowLeft: qty - 1, Home: 0, End: product.max };
    if (e.key in keys) {
      e.preventDefault();
      set(keys[e.key]);
    }
  }

  const round =
    "grid h-10 w-10 place-items-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40";

  return (
    <article className="w-full max-w-[15rem] rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div aria-hidden="true" className="grid h-24 place-items-center rounded-xl bg-[#efe9df]">
        <div className="h-16 w-10 rounded-t-md rounded-b-sm bg-white shadow-[inset_0_-14px_0_#d9c7a8]" />
      </div>
      <h4 id="pill-name" className="mt-3 text-sm font-semibold text-stone-900">
        {product.name}
      </h4>
      <p className="text-xs text-stone-600">{product.size}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums text-stone-900">${(product.price * Math.max(qty, 1)).toFixed(2)}</span>
        <div className="flex items-center rounded-full bg-stone-900 p-0.5">
          <button type="button" aria-label="One fewer" disabled={qty === 0} onClick={() => set(qty - 1)} className={round}>
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth={2.2} strokeLinecap="round">
              <path d="M5 10h10" />
            </svg>
          </button>
          <div
            role="spinbutton"
            tabIndex={0}
            aria-labelledby="pill-name"
            aria-valuenow={qty}
            aria-valuemin={0}
            aria-valuemax={product.max}
            aria-valuetext={`${qty} ${qty === 1 ? "carton" : "cartons"}`}
            onKeyDown={onKeyDown}
            className="min-w-[1.75rem] rounded text-center text-sm font-semibold tabular-nums text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {qty}
          </div>
          <button type="button" aria-label="One more" disabled={qty === product.max} onClick={() => set(qty + 1)} className={round}>
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth={2.2} strokeLinecap="round">
              <path d="M5 10h10M10 5v10" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
  return QuantityPillCard;
})();
const q2React = "import { useState, type KeyboardEvent } from \"react\";\n\nconst product = { name: \"Oat milk, barista\", size: \"1 litre carton\", price: 3.4, max: 12 };\n\nexport default function QuantityPillCard() {\n  const [qty, setQty] = useState(3);\n  const set = (n: number) => setQty(Math.min(product.max, Math.max(0, n)));\n\n  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {\n    const keys: Record<string, number> = { ArrowUp: qty + 1, ArrowRight: qty + 1, ArrowDown: qty - 1, ArrowLeft: qty - 1, Home: 0, End: product.max };\n    if (e.key in keys) {\n      e.preventDefault();\n      set(keys[e.key]);\n    }\n  }\n\n  const round =\n    \"grid h-10 w-10 place-items-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40\";\n\n  return (\n    <article className=\"w-full max-w-[15rem] rounded-2xl border border-stone-200 bg-white p-4 shadow-sm\">\n      <div aria-hidden=\"true\" className=\"grid h-24 place-items-center rounded-xl bg-[#efe9df]\">\n        <div className=\"h-16 w-10 rounded-t-md rounded-b-sm bg-white shadow-[inset_0_-14px_0_#d9c7a8]\" />\n      </div>\n      <h4 id=\"pill-name\" className=\"mt-3 text-sm font-semibold text-stone-900\">\n        {product.name}\n      </h4>\n      <p className=\"text-xs text-stone-600\">{product.size}</p>\n      <div className=\"mt-3 flex items-center justify-between gap-2\">\n        <span className=\"text-sm font-semibold tabular-nums text-stone-900\">${(product.price * Math.max(qty, 1)).toFixed(2)}</span>\n        <div className=\"flex items-center rounded-full bg-stone-900 p-0.5\">\n          <button type=\"button\" aria-label=\"One fewer\" disabled={qty === 0} onClick={() => set(qty - 1)} className={round}>\n            <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className=\"h-4 w-4 fill-none stroke-current\" strokeWidth={2.2} strokeLinecap=\"round\">\n              <path d=\"M5 10h10\" />\n            </svg>\n          </button>\n          <div\n            role=\"spinbutton\"\n            tabIndex={0}\n            aria-labelledby=\"pill-name\"\n            aria-valuenow={qty}\n            aria-valuemin={0}\n            aria-valuemax={product.max}\n            aria-valuetext={`${qty} ${qty === 1 ? \"carton\" : \"cartons\"}`}\n            onKeyDown={onKeyDown}\n            className=\"min-w-[1.75rem] rounded text-center text-sm font-semibold tabular-nums text-white outline-none focus-visible:ring-2 focus-visible:ring-white\"\n          >\n            {qty}\n          </div>\n          <button type=\"button\" aria-label=\"One more\" disabled={qty === product.max} onClick={() => set(qty + 1)} className={round}>\n            <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className=\"h-4 w-4 fill-none stroke-current\" strokeWidth={2.2} strokeLinecap=\"round\">\n              <path d=\"M5 10h10M10 5v10\" />\n            </svg>\n          </button>\n        </div>\n      </div>\n    </article>\n  );\n}\n";

const q4Demo = (() => {
const MAX = 9;

function AddToCartStepper() {
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");
  const addRef = useRef<HTMLButtonElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  // After the button swaps for the stepper (or back), keep keyboard focus in a sensible place.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    (qty === 0 ? addRef.current : valueRef.current)?.focus();
  }, [qty]);

  function change(n: number, swap = false) {
    const v = Math.min(MAX, Math.max(0, n));
    moveFocus.current = swap;
    setQty(v);
    setMessage(v === 0 ? "Removed from cart" : `${v} in cart`);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") change(qty + 1);
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") change(qty - 1, qty === 1);
    else return;
    e.preventDefault();
  }

  const icon = "grid h-11 w-11 place-items-center rounded-lg text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40";

  return (
    <div className="w-full max-w-[15rem]">
      <p className="text-sm font-semibold text-stone-900">Linen tea towel, olive</p>
      <p className="text-xs text-stone-600">$14.00</p>
      <div className="mt-3 h-11">
        {qty === 0 ? (
          <button
            ref={addRef}
            type="button"
            onClick={() => change(1, true)}
            className="h-11 w-full rounded-lg bg-emerald-800 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2"
          >
            Add to cart
          </button>
        ) : (
          <div className="flex h-11 items-center justify-between rounded-lg bg-emerald-800">
            <button type="button" aria-label={qty === 1 ? "Remove from cart" : "Decrease quantity"} onClick={() => change(qty - 1, qty === 1)} className={icon}>
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d={qty === 1 ? "M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" : "M5 10h10"} />
              </svg>
            </button>
            <div
              ref={valueRef}
              role="spinbutton"
              tabIndex={0}
              aria-label="Tea towels in cart"
              aria-valuenow={qty}
              aria-valuemin={0}
              aria-valuemax={MAX}
              onKeyDown={onKeyDown}
              className="rounded px-2 text-sm font-semibold tabular-nums text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {qty} in cart
            </div>
            <button type="button" aria-label="Increase quantity" disabled={qty >= MAX} onClick={() => change(qty + 1)} className={icon}>
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth={1.8} strokeLinecap="round">
                <path d="M5 10h10M10 5v10" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <p role="status" className="mt-2 min-h-[1rem] text-xs text-stone-600">
        {message}
      </p>
    </div>
  );
}
  return AddToCartStepper;
})();
const q4React = "import { useEffect, useRef, useState, type KeyboardEvent } from \"react\";\n\nconst MAX = 9;\n\nexport default function AddToCartStepper() {\n  const [qty, setQty] = useState(1);\n  const [message, setMessage] = useState(\"\");\n  const addRef = useRef<HTMLButtonElement>(null);\n  const valueRef = useRef<HTMLDivElement>(null);\n  const moveFocus = useRef(false);\n\n  // After the button swaps for the stepper (or back), keep keyboard focus in a sensible place.\n  useEffect(() => {\n    if (!moveFocus.current) return;\n    moveFocus.current = false;\n    (qty === 0 ? addRef.current : valueRef.current)?.focus();\n  }, [qty]);\n\n  function change(n: number, swap = false) {\n    const v = Math.min(MAX, Math.max(0, n));\n    moveFocus.current = swap;\n    setQty(v);\n    setMessage(v === 0 ? \"Removed from cart\" : `${v} in cart`);\n  }\n\n  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {\n    if (e.key === \"ArrowUp\" || e.key === \"ArrowRight\") change(qty + 1);\n    else if (e.key === \"ArrowDown\" || e.key === \"ArrowLeft\") change(qty - 1, qty === 1);\n    else return;\n    e.preventDefault();\n  }\n\n  const icon = \"grid h-11 w-11 place-items-center rounded-lg text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40\";\n\n  return (\n    <div className=\"w-full max-w-[15rem]\">\n      <p className=\"text-sm font-semibold text-stone-900\">Linen tea towel, olive</p>\n      <p className=\"text-xs text-stone-600\">$14.00</p>\n      <div className=\"mt-3 h-11\">\n        {qty === 0 ? (\n          <button\n            ref={addRef}\n            type=\"button\"\n            onClick={() => change(1, true)}\n            className=\"h-11 w-full rounded-lg bg-emerald-800 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2\"\n          >\n            Add to cart\n          </button>\n        ) : (\n          <div className=\"flex h-11 items-center justify-between rounded-lg bg-emerald-800\">\n            <button type=\"button\" aria-label={qty === 1 ? \"Remove from cart\" : \"Decrease quantity\"} onClick={() => change(qty - 1, qty === 1)} className={icon}>\n              <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className=\"h-4 w-4 fill-none stroke-current\" strokeWidth={1.8} strokeLinecap=\"round\" strokeLinejoin=\"round\">\n                <path d={qty === 1 ? \"M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10\" : \"M5 10h10\"} />\n              </svg>\n            </button>\n            <div\n              ref={valueRef}\n              role=\"spinbutton\"\n              tabIndex={0}\n              aria-label=\"Tea towels in cart\"\n              aria-valuenow={qty}\n              aria-valuemin={0}\n              aria-valuemax={MAX}\n              onKeyDown={onKeyDown}\n              className=\"rounded px-2 text-sm font-semibold tabular-nums text-white outline-none focus-visible:ring-2 focus-visible:ring-white\"\n            >\n              {qty} in cart\n            </div>\n            <button type=\"button\" aria-label=\"Increase quantity\" disabled={qty >= MAX} onClick={() => change(qty + 1)} className={icon}>\n              <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className=\"h-4 w-4 fill-none stroke-current\" strokeWidth={1.8} strokeLinecap=\"round\">\n                <path d=\"M5 10h10M10 5v10\" />\n              </svg>\n            </button>\n          </div>\n        )}\n      </div>\n      <p role=\"status\" className=\"mt-2 min-h-[1rem] text-xs text-stone-600\">\n        {message}\n      </p>\n    </div>\n  );\n}\n";

const q6Demo = (() => {
type Line = { id: string; name: string; variant: string; price: number; qty: number; max: number };

const START: Line[] = [
  { id: "apron", name: "Linen apron", variant: "Sand, one size", price: 28, qty: 1, max: 5 },
  { id: "wraps", name: "Beeswax wraps", variant: "Set of 3", price: 16, qty: 2, max: 10 },
];

const money = (n: number) => `$${n.toFixed(2)}`;

function CartLineQuantity() {
  const [lines, setLines] = useState<Line[]>(START);
  const [status, setStatus] = useState("");

  function setQty(id: string, n: number) {
    const next = lines.map((l) => (l.id === id ? { ...l, qty: Math.min(l.max, Math.max(1, n)) } : l));
    setLines(next);
    setStatus(`Subtotal ${money(next.reduce((s, l) => s + l.price * l.qty, 0))}`);
  }

  function remove(id: string) {
    const line = lines.find((l) => l.id === id);
    setLines(lines.filter((l) => l.id !== id));
    setStatus(`${line?.name} removed`);
  }

  function onKeyDown(l: Line, e: KeyboardEvent<HTMLInputElement>) {
    const keys: Record<string, number> = { ArrowUp: l.qty + 1, ArrowDown: l.qty - 1, Home: 1, End: l.max };
    if (!(e.key in keys)) return;
    e.preventDefault();
    setQty(l.id, keys[e.key]);
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const step = "grid h-10 w-9 place-items-center text-stone-700 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 disabled:text-stone-300";

  return (
    <div className="w-full max-w-sm">
      <ul className="divide-y divide-stone-200 border-y border-stone-200">
        {lines.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
            <div className="min-w-0 basis-full">
              <p id={`line-${l.id}`} className="truncate text-sm font-semibold text-stone-900">
                {l.name}
              </p>
              <p className="text-xs text-stone-600">
                {l.variant} · {money(l.price)}
              </p>
            </div>
            <div className="flex items-center rounded-md border border-stone-300">
              <button type="button" aria-label={`Fewer ${l.name}`} disabled={l.qty <= 1} onClick={() => setQty(l.id, l.qty - 1)} className={step}>
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth={2} strokeLinecap="round">
                  <path d="M5 10h10" />
                </svg>
              </button>
              <input
                type="text"
                inputMode="numeric"
                role="spinbutton"
                aria-labelledby={`line-${l.id}`}
                aria-valuenow={l.qty}
                aria-valuemin={1}
                aria-valuemax={l.max}
                value={l.qty}
                onChange={(e) => setQty(l.id, Number(e.target.value.replace(/\D/g, "")) || 1)}
                onKeyDown={(e) => onKeyDown(l, e)}
                className="h-10 w-9 border-x border-stone-300 text-center text-base font-semibold tabular-nums text-stone-900 outline-none focus-visible:bg-emerald-50"
              />
              <button type="button" aria-label={`More ${l.name}`} disabled={l.qty >= l.max} onClick={() => setQty(l.id, l.qty + 1)} className={step}>
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth={2} strokeLinecap="round">
                  <path d="M5 10h10M10 5v10" />
                </svg>
              </button>
            </div>
            <span className="ml-auto w-16 text-right text-sm font-semibold tabular-nums text-stone-900">{money(l.price * l.qty)}</span>
            <button
              type="button"
              aria-label={`Remove ${l.name}`}
              onClick={() => remove(l.id)}
              className="grid h-10 w-10 place-items-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth={1.8} strokeLinecap="round">
                <path d="M6 6l8 8M14 6l-8 8" />
              </svg>
            </button>
          </li>
        ))}
        {lines.length === 0 && (
          <li className="flex items-center justify-between py-4 text-sm text-stone-600">
            Your cart is empty.
            <button type="button" onClick={() => setLines(START)} className="h-10 rounded-md px-3 font-medium text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
              Restore items
            </button>
          </li>
        )}
      </ul>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-stone-600">Subtotal</span>
        <span className="font-semibold tabular-nums text-stone-900">{money(subtotal)}</span>
      </div>
      <p role="status" className="sr-only">
        {status}
      </p>
    </div>
  );
}
  return CartLineQuantity;
})();
const q6React = "import { useState, type KeyboardEvent } from \"react\";\n\ntype Line = { id: string; name: string; variant: string; price: number; qty: number; max: number };\n\nconst START: Line[] = [\n  { id: \"apron\", name: \"Linen apron\", variant: \"Sand, one size\", price: 28, qty: 1, max: 5 },\n  { id: \"wraps\", name: \"Beeswax wraps\", variant: \"Set of 3\", price: 16, qty: 2, max: 10 },\n];\n\nconst money = (n: number) => `$${n.toFixed(2)}`;\n\nexport default function CartLineQuantity() {\n  const [lines, setLines] = useState<Line[]>(START);\n  const [status, setStatus] = useState(\"\");\n\n  function setQty(id: string, n: number) {\n    const next = lines.map((l) => (l.id === id ? { ...l, qty: Math.min(l.max, Math.max(1, n)) } : l));\n    setLines(next);\n    setStatus(`Subtotal ${money(next.reduce((s, l) => s + l.price * l.qty, 0))}`);\n  }\n\n  function remove(id: string) {\n    const line = lines.find((l) => l.id === id);\n    setLines(lines.filter((l) => l.id !== id));\n    setStatus(`${line?.name} removed`);\n  }\n\n  function onKeyDown(l: Line, e: KeyboardEvent<HTMLInputElement>) {\n    const keys: Record<string, number> = { ArrowUp: l.qty + 1, ArrowDown: l.qty - 1, Home: 1, End: l.max };\n    if (!(e.key in keys)) return;\n    e.preventDefault();\n    setQty(l.id, keys[e.key]);\n  }\n\n  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);\n  const step = \"grid h-10 w-9 place-items-center text-stone-700 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 disabled:text-stone-300\";\n\n  return (\n    <div className=\"w-full max-w-sm\">\n      <ul className=\"divide-y divide-stone-200 border-y border-stone-200\">\n        {lines.map((l) => (\n          <li key={l.id} className=\"flex flex-wrap items-center gap-x-3 gap-y-2 py-3\">\n            <div className=\"min-w-0 basis-full\">\n              <p id={`line-${l.id}`} className=\"truncate text-sm font-semibold text-stone-900\">\n                {l.name}\n              </p>\n              <p className=\"text-xs text-stone-600\">\n                {l.variant} · {money(l.price)}\n              </p>\n            </div>\n            <div className=\"flex items-center rounded-md border border-stone-300\">\n              <button type=\"button\" aria-label={`Fewer ${l.name}`} disabled={l.qty <= 1} onClick={() => setQty(l.id, l.qty - 1)} className={step}>\n                <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className=\"h-3.5 w-3.5 fill-none stroke-current\" strokeWidth={2} strokeLinecap=\"round\">\n                  <path d=\"M5 10h10\" />\n                </svg>\n              </button>\n              <input\n                type=\"text\"\n                inputMode=\"numeric\"\n                role=\"spinbutton\"\n                aria-labelledby={`line-${l.id}`}\n                aria-valuenow={l.qty}\n                aria-valuemin={1}\n                aria-valuemax={l.max}\n                value={l.qty}\n                onChange={(e) => setQty(l.id, Number(e.target.value.replace(/\\D/g, \"\")) || 1)}\n                onKeyDown={(e) => onKeyDown(l, e)}\n                className=\"h-10 w-9 border-x border-stone-300 text-center text-base font-semibold tabular-nums text-stone-900 outline-none focus-visible:bg-emerald-50\"\n              />\n              <button type=\"button\" aria-label={`More ${l.name}`} disabled={l.qty >= l.max} onClick={() => setQty(l.id, l.qty + 1)} className={step}>\n                <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className=\"h-3.5 w-3.5 fill-none stroke-current\" strokeWidth={2} strokeLinecap=\"round\">\n                  <path d=\"M5 10h10M10 5v10\" />\n                </svg>\n              </button>\n            </div>\n            <span className=\"ml-auto w-16 text-right text-sm font-semibold tabular-nums text-stone-900\">{money(l.price * l.qty)}</span>\n            <button\n              type=\"button\"\n              aria-label={`Remove ${l.name}`}\n              onClick={() => remove(l.id)}\n              className=\"grid h-10 w-10 place-items-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700\"\n            >\n              <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\" className=\"h-4 w-4 fill-none stroke-current\" strokeWidth={1.8} strokeLinecap=\"round\">\n                <path d=\"M6 6l8 8M14 6l-8 8\" />\n              </svg>\n            </button>\n          </li>\n        ))}\n        {lines.length === 0 && (\n          <li className=\"flex items-center justify-between py-4 text-sm text-stone-600\">\n            Your cart is empty.\n            <button type=\"button\" onClick={() => setLines(START)} className=\"h-10 rounded-md px-3 font-medium text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700\">\n              Restore items\n            </button>\n          </li>\n        )}\n      </ul>\n      <div className=\"mt-3 flex items-center justify-between text-sm\">\n        <span className=\"text-stone-600\">Subtotal</span>\n        <span className=\"font-semibold tabular-nums text-stone-900\">{money(subtotal)}</span>\n      </div>\n      <p role=\"status\" className=\"sr-only\">\n        {status}\n      </p>\n    </div>\n  );\n}\n";

const q6Html = `<div class="cart">
  <ul class="cart-lines">
    <li class="cart-line" data-price="28" data-max="5">
      <div class="cart-info">
        <p id="line-apron" class="cart-name">Linen apron</p>
        <p class="cart-meta">Sand, one size · $28.00</p>
      </div>
      <div class="cart-step">
        <button type="button" data-step="-1" aria-label="Fewer Linen apron">&minus;</button>
        <input type="text" inputmode="numeric" role="spinbutton" value="1" aria-labelledby="line-apron"
          aria-valuenow="1" aria-valuemin="1" aria-valuemax="5">
        <button type="button" data-step="1" aria-label="More Linen apron">+</button>
      </div>
      <span class="cart-total">$28.00</span>
      <button type="button" class="cart-remove" aria-label="Remove Linen apron">&times;</button>
    </li>
    <li class="cart-line" data-price="16" data-max="10">
      <div class="cart-info">
        <p id="line-wraps" class="cart-name">Beeswax wraps</p>
        <p class="cart-meta">Set of 3 · $16.00</p>
      </div>
      <div class="cart-step">
        <button type="button" data-step="-1" aria-label="Fewer Beeswax wraps">&minus;</button>
        <input type="text" inputmode="numeric" role="spinbutton" value="2" aria-labelledby="line-wraps"
          aria-valuenow="2" aria-valuemin="1" aria-valuemax="10">
        <button type="button" data-step="1" aria-label="More Beeswax wraps">+</button>
      </div>
      <span class="cart-total">$32.00</span>
      <button type="button" class="cart-remove" aria-label="Remove Beeswax wraps">&times;</button>
    </li>
  </ul>
  <div class="cart-sub"><span>Subtotal</span><strong class="cart-subtotal">$60.00</strong></div>
  <p class="cart-sr" role="status"></p>
</div>

<style>
  .cart { max-width: 24rem; font-family: system-ui, sans-serif; color: #1c1917; }
  .cart-lines { list-style: none; margin: 0; padding: 0; border-block: 1px solid #e7e5e4; }
  .cart-line { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 12px 0; }
  .cart-line + .cart-line { border-top: 1px solid #e7e5e4; }
  .cart-info { flex-basis: 100%; min-width: 0; }
  .cart-name { margin: 0; font-size: 14px; font-weight: 600; }
  .cart-meta { margin: 0; font-size: 12px; color: #57534e; }
  .cart-step { display: flex; border: 1px solid #d6d3d1; border-radius: 6px; }
  .cart-step button { width: 36px; height: 40px; border: 0; background: none; font-size: 16px; color: #44403c; cursor: pointer; }
  .cart-step button:disabled { color: #d6d3d1; cursor: not-allowed; }
  .cart-step input { width: 36px; border: 0; border-inline: 1px solid #d6d3d1; text-align: center;
    font: 600 16px system-ui, sans-serif; font-variant-numeric: tabular-nums; outline: none; }
  .cart-step input:focus-visible { background: #ecfdf5; }
  .cart-total { margin-left: auto; width: 64px; text-align: right; font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .cart-remove { width: 40px; height: 40px; border: 0; border-radius: 6px; background: none; font-size: 18px; color: #78716c; cursor: pointer; }
  .cart-remove:hover { background: #f5f5f4; color: #1c1917; }
  .cart button:focus-visible { outline: 2px solid #047857; outline-offset: -2px; }
  .cart-sub { display: flex; justify-content: space-between; margin-top: 12px; font-size: 14px; color: #57534e; }
  .cart-sub strong { color: #1c1917; font-variant-numeric: tabular-nums; }
  .cart-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>

<script>
  (() => {
    const cart = document.querySelector(".cart");
    const status = cart.querySelector(".cart-sr");
    const money = (n) => \`$\${n.toFixed(2)}\`;

    function refresh() {
      let sub = 0;
      cart.querySelectorAll(".cart-line").forEach((line) => {
        const input = line.querySelector("input");
        const qty = Number(input.value);
        const total = Number(line.dataset.price) * qty;
        sub += total;
        line.querySelector(".cart-total").textContent = money(total);
        input.setAttribute("aria-valuenow", qty);
        const [dec, inc] = line.querySelectorAll(".cart-step button");
        dec.disabled = qty <= 1;
        inc.disabled = qty >= Number(line.dataset.max);
      });
      cart.querySelector(".cart-subtotal").textContent = money(sub);
      return sub;
    }

    cart.querySelectorAll(".cart-line").forEach((line) => {
      const input = line.querySelector("input");
      const max = Number(line.dataset.max);
      const set = (n) => {
        input.value = Math.min(max, Math.max(1, Math.round(n) || 1));
        status.textContent = \`Subtotal \${money(refresh())}\`;
      };
      line.querySelectorAll("[data-step]").forEach((b) =>
        b.addEventListener("click", () => set(Number(input.value) + Number(b.dataset.step)))
      );
      input.addEventListener("input", () => set(Number(input.value.replace(/\\D/g, ""))));
      input.addEventListener("keydown", (e) => {
        const v = Number(input.value);
        const keys = { ArrowUp: v + 1, ArrowDown: v - 1, Home: 1, End: max };
        if (e.key in keys) { e.preventDefault(); set(keys[e.key]); }
      });
      line.querySelector(".cart-remove").addEventListener("click", () => {
        const name = line.querySelector(".cart-name").textContent;
        line.remove();
        refresh();
        status.textContent = \`\${name} removed\`;
      });
    });
    refresh();
  })();
</script>
`;

const PIECES: Piece[] = [
  { id: "q1", name: "Classic bordered stepper", blurb: "Text field with spinbutton keys, a typed value that clamps on blur and buttons that stay focusable at the limits.", group: "fields", Demo: q1Demo, react: q1React, html: q1Html, stage: "bg-[#f7f5f1] ring-1 ring-inset ring-stone-200/80" },
  { id: "q3", name: "Step of six, rounded to whole cases", blurb: "Typed amounts snap to the nearest case and say so in a status line.", group: "fields", Demo: q3Demo, react: q3React, stage: "bg-[#f7f5f1] ring-1 ring-inset ring-stone-200/80" },
  { id: "q5", name: "Decimal weight with stacked arrows", blurb: "Quarter-kilo steps counted as whole numbers, with a running price.", group: "fields", Demo: q5Demo, react: q5React, stage: "bg-[#f7f5f1] ring-1 ring-inset ring-stone-200/80" },
  { id: "q2", name: "Pill stepper on a product card", blurb: "Compact dark control where the number itself is the focusable spinbutton.", group: "shop", Demo: q2Demo, react: q2React, stage: "bg-[#f7f5f1] ring-1 ring-inset ring-stone-200/80" },
  { id: "q4", name: "Add to cart that turns into a stepper", blurb: "The minus becomes a bin at one, and focus moves with the swap.", group: "shop", Demo: q4Demo, react: q4React, stage: "bg-[#f7f5f1] ring-1 ring-inset ring-stone-200/80" },
  { id: "q6", name: "Cart lines with totals", blurb: "Per-line limits, line totals, remove buttons and an announced subtotal.", group: "shop", Demo: q6Demo, react: q6React, html: q6Html, stage: "bg-white ring-1 ring-inset ring-stone-200/80" }
];
const GROUPS: { key: string; label: string }[] = [{"key":"fields","label":"Stepper fields"},{"key":"shop","label":"Product and cart"}];
const TEXT: { eyebrow: string; title: string; lead: string; refTitle: string; refNote: string } = {"eyebrow":"React · HTML, CSS and JS · spinbutton keys","title":"Quantity inputs for online stores","lead":"Six plus and minus steppers built for checkout pages: limits that disable the right button, step sizes such as cases of six, decimal weights, an add to cart button that becomes a stepper and a full cart line with live totals.","refTitle":"Spinbutton keyboard and ARIA reference","refNote":"Keys and attributes follow the spinbutton pattern in the WAI-ARIA Authoring Practices Guide. Page Up and Page Down are optional in that pattern; two pieces here use them for jumps of five."};
const REF_HEAD: string[] = ["Key or attribute","Behaviour","Used in"];
const REF_ROWS: string[][] = [
  [
    "Up Arrow / Down Arrow",
    "Increase or decrease the value by one step.",
    "Every piece (the pill and cart button also accept Right and Left)."
  ],
  [
    "Home / End",
    "Jump to the minimum or the maximum, when one is set.",
    "Every piece with a field you can focus."
  ],
  [
    "Page Up / Page Down",
    "Optional larger step. Here, five units or one kilo.",
    "Classic stepper, decimal weight."
  ],
  [
    "role=\"spinbutton\"",
    "Tells assistive technology this control holds a number in a range that can be stepped.",
    "On the focusable value, whether an input or a div with tabindex=0."
  ],
  [
    "aria-valuenow / min / max",
    "The current value and its limits. Update aria-valuenow on every change.",
    "All six."
  ],
  [
    "aria-valuetext",
    "A readable version when the bare number is unclear, such as '12 bottles, 2 cases' or '1.25 kilograms'.",
    "Case packs, decimal weight, pill card."
  ],
  [
    "Label",
    "The spinbutton needs a name: a label element, aria-label or aria-labelledby pointing at the product name.",
    "Cart line uses the product name as the label."
  ]
];

const COPY_ICON = "M9 9h10v10H9zM5 15V5h10";
const CHECK_ICON = "M5 12.5l4.5 4.5L19 7.5";
const CODE_ICON = "M8 7l-5 5 5 5M16 7l5 5-5 5";

export default function QuantityInputCollection() {
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

  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2";
  const chip = `inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-colors ${ring}`;

  return (
    <section
      className="bg-[#fbfaf8] px-4 py-12 sm:px-8 sm:py-14"
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
                className={`${chip} ${on ? "bg-emerald-800 text-white" : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"}`}
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
