import { useMemo, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

/*
  CSS button styles collection.
  Every button below is defined once as plain CSS, written with "&" standing for the button's own
  selector and "K-" as the prefix for its keyframes. The page scopes each one to its own class
  (cbs-i0, cbs-i1 ...) and the Copy CSS control rewrites the same rules to a plain ".btn" class,
  so what you copy is exactly what you see.
*/

type Node =
  | string
  | { i: IconName }
  | { s: string; c?: Node[]; d?: Record<string, string> }
  | { b: Node[]; label?: string; pressed?: boolean };

type Item = {
  f: FamilyKey;
  name: string;
  css: string;
  c: Node[];
  aria?: string;
  stage?: Stage;
  pressed?: boolean;
  busy?: boolean;
  group?: boolean;
  exclusive?: boolean;
};

type Stage = "white" | "paper" | "ink" | "neu" | "scene" | "sky" | "lime";

const FAMILIES = {
  pressable: "3D pressable",
  glass: "Glass",
  brutalist: "Brutalist",
  gradient: "Gradient",
  solid: "Solid",
  outline: "Outline",
  shine: "Shine sweep",
  border: "Border animation",
  hover: "Animated hover",
  glow: "Soft glow",
  neumorphic: "Neumorphic",
  icon: "Icon",
  loading: "Loading",
  pill: "Pill",
  underline: "Minimal underline",
  split: "Split",
  toggle: "Toggle",
  social: "Social style",
} as const;
type FamilyKey = keyof typeof FAMILIES;

/* ---------- icons (24px grid, stroke) ---------- */
const ICONS = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  play: "M8 5v14l11-7z",
  check: "M5 12.5l4.5 4.5L19 7",
  cart: "M3 4h2l2.4 11h10.2L20 8H6.2M10 20a1 1 0 1 0 0-.01M17 20a1 1 0 1 0 0-.01",
  share: "M12 4v12M7 9l5-5 5 5M5 14v6h14v-6",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4",
  bookmark: "M6 4h12v17l-6-4-6 4z",
  chevron: "M7 10l5 5 5-5",
  key: "M14 10a4 4 0 1 0-3.5 4L4 20.5V23h3v-2h2v-2h2l1.5-1.5M15.5 7.5h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  chat: "M4 5h16v11H9l-5 4z",
  rss: "M5 5a14 14 0 0 1 14 14M5 11a8 8 0 0 1 8 8M6 19h.01",
  upload: "M12 20V9M7 14l5-5 5 5M5 4h14",
  star: "M12 4l2.5 5 5.5.8-4 3.9.9 5.5L12 16.6 7.1 19.2 8 13.7 4 9.8 9.5 9z",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9S14.5 18.4 12 21c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z",
  phone: "M8 3h8v18H8zM11 18h2",
  calendar: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4",
  lock: "M6 11h12v10H6zM9 11V8a3 3 0 0 1 6 0v3",
  bolt: "M13 3L5 14h6l-1 7 8-11h-6z",
} as const;
type IconName = keyof typeof ICONS;

/* ---------- shared base: applied to every button ---------- */
const BASE = `& {
  font: 600 15px/1.2 Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  letter-spacing: -0.01em;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; padding: 0 22px;
  border: 0; border-radius: 10px;
  color: inherit; background: none;
  cursor: pointer; position: relative; isolation: isolate;
  -webkit-tap-highlight-color: transparent;
  transition: transform .18s cubic-bezier(.2,.8,.2,1), background-color .2s ease, background-position .45s ease, color .2s ease, box-shadow .2s ease, border-color .2s ease;
}
&:focus-visible { outline: 2px solid #2563eb; outline-offset: 3px; }
& svg { width: 18px; height: 18px; flex: none; }
@media (prefers-reduced-motion: reduce) {
  &, &::before, &::after, & *, & *::before, & *::after { transition: none !important; animation: none !important; }
}`;

/* ---------- the collection ---------- */
const ITEMS: Item[] = [
  // SOLID
  { f: "solid", name: "Ink", c: ["Continue"], css: `& { background: #111827; color: #fff; box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 1px 2px rgba(17,24,39,.35); }
&:hover { background: #1f2937; }
&:active { transform: translateY(1px) scale(.985); }` },
  { f: "solid", name: "Cobalt", c: ["Save changes"], css: `& { background: #2563eb; color: #fff; border-radius: 8px; box-shadow: inset 0 1px 0 rgba(255,255,255,.22), 0 1px 2px rgba(30,64,175,.4); }
&:hover { background: #1d4ed8; }
&:active { background: #1e40af; transform: translateY(1px); }` },
  { f: "solid", name: "Evergreen", c: ["Confirm order"], css: `& { background: #047857; color: #fff; border-radius: 6px; }
&:hover { background: #065f46; }
&:active { transform: scale(.98); }` },
  { f: "solid", name: "Terracotta", c: ["Book a table"], css: `& { background: #c2410c; color: #fff; border-radius: 12px; }
&:hover { background: #9a3412; }
&:active { transform: translateY(1px); }` },
  { f: "solid", name: "Butter", c: ["Try it free"], css: `& { background: #fde047; color: #422006; border-radius: 12px; box-shadow: inset 0 -2px 0 rgba(66,32,6,.12); }
&:hover { background: #facc15; }
&:active { transform: translateY(1px); box-shadow: none; }` },
  { f: "solid", name: "Crimson", c: ["Delete project"], css: `& { background: #be123c; color: #fff; border-radius: 8px; }
&:hover { background: #9f1239; }
&:active { transform: scale(.98); }` },
  { f: "solid", name: "Square caps", c: ["Submit"], css: `& { background: #334155; color: #fff; border-radius: 0; text-transform: uppercase; letter-spacing: .14em; font-size: 12px; padding: 0 28px; }
&:hover { background: #0f172a; letter-spacing: .18em; }` },
  { f: "solid", name: "Large teal CTA", c: ["Start building", { i: "arrow" }], css: `& { background: #0f766e; color: #fff; border-radius: 12px; min-height: 52px; padding: 0 26px; font-size: 16px; }
& svg { transition: transform .2s ease; }
&:hover { background: #115e59; }
&:hover svg { transform: translateX(3px); }` },

  // OUTLINE
  { f: "outline", name: "Hairline", c: ["Cancel"], css: `& { background: #fff; color: #18181b; box-shadow: inset 0 0 0 1px #d4d4d8, 0 1px 2px rgba(0,0,0,.05); }
&:hover { background: #f4f4f5; box-shadow: inset 0 0 0 1px #a1a1aa; }` },
  { f: "outline", name: "Ink fill on hover", c: ["View details"], css: `& { color: #111827; border: 2px solid #111827; border-radius: 8px; }
&:hover { background: #111827; color: #fff; }` },
  { f: "outline", name: "Slide fill", c: ["Learn more"], css: `& { color: #1d4ed8; border: 1.5px solid #2563eb; border-radius: 8px; background: linear-gradient(#2563eb, #2563eb) no-repeat 0 0 / 0% 100%; transition: background-size .35s cubic-bezier(.7,0,.2,1), color .3s ease; }
&:hover { background-size: 100% 100%; color: #fff; }` },
  { f: "outline", name: "Dashed", c: [{ i: "plus" }, "Add section"], css: `& { color: #475569; border: 1.5px dashed #94a3b8; border-radius: 10px; }
&:hover { border-style: solid; border-color: #334155; color: #0f172a; background: #f8fafc; }` },
  { f: "outline", name: "Double rule", c: ["Read the essay"], css: `& { color: #0f172a; border: 4px double #0f172a; border-radius: 2px; font-family: Georgia, "Times New Roman", serif; font-weight: 500; font-style: italic; }
&:hover { background: #0f172a; color: #fff; }` },
  { f: "outline", name: "Thickening ring", c: ["Subscribe"], css: `& { color: #047857; box-shadow: inset 0 0 0 1.5px #059669; border-radius: 999px; }
&:hover { box-shadow: inset 0 0 0 3px #059669; }` },
  { f: "outline", name: "Brackets", c: ["Explore"], css: `& { color: #111827; padding: 0 26px; border-radius: 0; text-transform: uppercase; letter-spacing: .16em; font-size: 12px; }
&::before, &::after { content: ""; position: absolute; width: 12px; height: 12px; border: 2px solid #111827; transition: width .25s ease, height .25s ease; }
&::before { top: 0; left: 0; border-right: 0; border-bottom: 0; }
&::after { bottom: 0; right: 0; border-left: 0; border-top: 0; }
&:hover::before, &:hover::after { width: 100%; height: 100%; }` },

  // GRADIENT
  { f: "gradient", name: "Sunset", c: ["Get tickets"], css: `& { color: #fff; border-radius: 10px; background: linear-gradient(135deg, #ea580c, #be123c); box-shadow: 0 6px 16px -6px rgba(190,18,60,.55); }
&:hover { transform: translateY(-1px); box-shadow: 0 10px 22px -8px rgba(190,18,60,.6); }` },
  { f: "gradient", name: "Lagoon", c: ["Plan a trip"], css: `& { color: #fff; border-radius: 10px; background: linear-gradient(120deg, #0369a1, #0d9488); }
&:hover { filter: brightness(1.08); }` },
  { f: "gradient", name: "Moss", c: ["Plant a tree"], css: `& { color: #fff; border-radius: 999px; background: linear-gradient(180deg, #3f6212, #14532d); box-shadow: inset 0 1px 0 rgba(255,255,255,.2); }
&:hover { background: linear-gradient(180deg, #4d7c0f, #166534); }` },
  { f: "gradient", name: "Midnight blue", c: ["Deploy"], css: `& { color: #fff; border-radius: 10px; background: linear-gradient(135deg, #0f172a 20%, #1d4ed8); box-shadow: inset 0 1px 0 rgba(255,255,255,.12); }
&:hover { box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 8px 20px -10px #1d4ed8; }` },
  { f: "gradient", name: "Border fade", c: ["Open dashboard"], css: `& { color: #0f172a; border: 2px solid transparent; border-radius: 12px; background: linear-gradient(#fff, #fff) padding-box, linear-gradient(135deg, #0ea5e9, #10b981) border-box; }
&:hover { background: linear-gradient(#f0fdfa, #f0fdfa) padding-box, linear-gradient(135deg, #0ea5e9, #10b981) border-box; }` },
  { f: "gradient", name: "Gradient text", c: [{ s: "b-t", c: ["Join the waitlist"] }], css: `& { background: #fff; border-radius: 10px; box-shadow: inset 0 0 0 1px #e7e5e4; }
& .b-t { background: linear-gradient(90deg, #b45309, #be123c); -webkit-background-clip: text; background-clip: text; color: transparent; }
&:hover { box-shadow: inset 0 0 0 1px #d6d3d1, 0 2px 6px rgba(0,0,0,.06); }` },
  { f: "gradient", name: "Shifting", c: ["Upgrade plan"], css: `& { color: #fff; border-radius: 10px; background: linear-gradient(90deg, #0e7490, #1e40af, #0e7490) 0 0 / 200% 100%; }
&:hover { background-position: 100% 0; }` },
  { f: "gradient", name: "Copper mesh", c: ["Reserve"], css: `& { color: #fff7ed; border-radius: 10px; background: radial-gradient(circle at 20% 0%, #ea580c, transparent 60%), radial-gradient(circle at 100% 100%, #7c2d12, transparent 55%), #9a3412; box-shadow: inset 0 1px 0 rgba(255,237,213,.3); }
&:hover { transform: translateY(-1px); }` },

  // 3D PRESSABLE
  { f: "pressable", name: "Classic key", c: ["Press me"], css: `& { color: #fff; background: #2563eb; border-radius: 10px; box-shadow: 0 5px 0 #1e3a8a; transform: translateY(-2px); }
&:hover { transform: translateY(-3px); box-shadow: 0 6px 0 #1e3a8a; }
&:active { transform: translateY(3px); box-shadow: 0 0 0 #1e3a8a; transition-duration: .05s; }` },
  { f: "pressable", name: "Arcade", c: ["Play"], css: `& { color: #fff; background: radial-gradient(circle at 50% 30%, #f87171, #dc2626 60%); border-radius: 999px; min-height: 56px; padding: 0 30px; text-transform: uppercase; letter-spacing: .12em; font-size: 13px; box-shadow: 0 6px 0 #7f1d1d, 0 12px 16px -4px rgba(127,29,29,.45), inset 0 2px 0 rgba(255,255,255,.35); }
&:active { transform: translateY(5px); box-shadow: 0 1px 0 #7f1d1d, 0 3px 6px rgba(127,29,29,.4), inset 0 2px 0 rgba(255,255,255,.25); transition-duration: .06s; }` },
  { f: "pressable", name: "Keycap", c: [{ s: "b-k", c: ["Shift"] }], css: `& { color: #27272a; background: linear-gradient(#fafafa, #e4e4e7); border-radius: 9px; min-width: 96px; font: 500 13px/1 ui-monospace, "SF Mono", Menlo, monospace; box-shadow: inset 0 -3px 0 #d4d4d8, 0 1px 0 #a1a1aa, 0 4px 0 #71717a, 0 6px 8px rgba(0,0,0,.18); }
&:active { transform: translateY(3px); box-shadow: inset 0 -1px 0 #d4d4d8, 0 1px 0 #71717a, 0 2px 3px rgba(0,0,0,.2); transition-duration: .05s; }` },
  { f: "pressable", name: "Two layer", c: [{ s: "b-front", c: ["Add to cart"] }], css: `& { padding: 0; background: #14532d; border-radius: 12px; min-height: 0; }
& .b-front { display: block; padding: 13px 24px; border-radius: 12px; background: #16a34a; color: #fff; transform: translateY(-5px); transition: transform .25s cubic-bezier(.3,.7,.4,1.5); }
&:hover .b-front { transform: translateY(-7px); }
&:active .b-front { transform: translateY(-1px); transition-duration: .04s; }` },
  { f: "pressable", name: "Amber chunk", c: ["Claim offer"], css: `& { color: #451a03; background: #fbbf24; border-radius: 8px; box-shadow: 0 4px 0 #b45309, inset 0 1px 0 rgba(255,255,255,.5); }
&:active { transform: translateY(4px); box-shadow: 0 0 0 #b45309; transition-duration: .05s; }` },
  { f: "pressable", name: "Extruded", c: ["Build"], css: `& { color: #ecfdf5; background: #059669; border-radius: 8px; box-shadow: 1px 1px 0 #047857, 2px 2px 0 #047857, 3px 3px 0 #065f46, 4px 4px 0 #065f46, 5px 5px 0 #064e3b, 6px 6px 10px rgba(0,0,0,.25); }
&:hover { transform: translate(-1px,-1px); }
&:active { transform: translate(4px,4px); box-shadow: 1px 1px 0 #047857, 2px 2px 4px rgba(0,0,0,.2); transition-duration: .06s; }` },
  { f: "pressable", name: "Soft press", c: ["Next step"], css: `& { color: #0f172a; background: linear-gradient(#fff, #f1f5f9); border-radius: 999px; box-shadow: 0 0 0 1px #cbd5e1, 0 2px 0 #cbd5e1, 0 6px 12px -4px rgba(15,23,42,.18); }
&:active { transform: translateY(2px) scale(.98); box-shadow: 0 0 0 1px #cbd5e1, inset 0 2px 4px rgba(15,23,42,.12); }` },

  // GLASS
  { f: "glass", name: "Frosted", stage: "scene", c: ["Watch the film"], css: `& { color: #fff; border-radius: 14px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.32); -webkit-backdrop-filter: blur(14px) saturate(160%); backdrop-filter: blur(14px) saturate(160%); }
&:hover { background: rgba(255,255,255,.22); }` },
  { f: "glass", name: "Specular pill", stage: "scene", c: ["Get the app"], css: `& { color: #fff; border-radius: 999px; background: linear-gradient(180deg, rgba(255,255,255,.28), rgba(255,255,255,.06)); box-shadow: inset 0 1px 0 rgba(255,255,255,.7), inset 0 -1px 0 rgba(255,255,255,.15), 0 8px 24px -8px rgba(0,0,0,.5); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
&:hover { transform: translateY(-1px); }` },
  { f: "glass", name: "Smoke", stage: "scene", c: ["Skip intro"], css: `& { color: #f8fafc; border-radius: 12px; background: rgba(2,6,23,.42); border: 1px solid rgba(255,255,255,.12); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); }
&:hover { background: rgba(2,6,23,.6); }` },
  { f: "glass", name: "Teal tint", stage: "scene", c: ["Explore reef"], css: `& { color: #f0fdfa; border-radius: 12px; background: rgba(20,184,166,.22); border: 1px solid rgba(153,246,228,.45); -webkit-backdrop-filter: blur(12px) saturate(180%); backdrop-filter: blur(12px) saturate(180%); }
&:hover { background: rgba(20,184,166,.34); }` },
  { f: "glass", name: "Glass sheen", stage: "scene", c: ["Continue"], css: `& { color: #fff; overflow: hidden; border-radius: 12px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.28); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
&::after { content: ""; position: absolute; inset: 0; background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%); transform: translateX(-120%); transition: transform .6s ease; }
&:hover::after { transform: translateX(120%); }` },
  { f: "glass", name: "Glass icon", stage: "scene", aria: "Play preview", c: [{ i: "play" }], css: `& { color: #fff; width: 56px; height: 56px; padding: 0; border-radius: 999px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.35); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
& svg { width: 20px; height: 20px; fill: currentColor; margin-left: 3px; }
&:hover { transform: scale(1.06); }` },

  // NEUMORPHIC
  { f: "neumorphic", name: "Raised", stage: "neu", c: ["Start"], css: `& { color: #334155; background: #e6e9ef; border-radius: 14px; box-shadow: 6px 6px 14px #c3c8d2, -6px -6px 14px #ffffff; }
&:active { box-shadow: inset 4px 4px 10px #c3c8d2, inset -4px -4px 10px #ffffff; }` },
  { f: "neumorphic", name: "Pressed in", stage: "neu", c: ["Paused"], css: `& { color: #475569; background: #e6e9ef; border-radius: 14px; box-shadow: inset 4px 4px 10px #c3c8d2, inset -4px -4px 10px #ffffff; }
&:hover { box-shadow: 4px 4px 10px #c3c8d2, -4px -4px 10px #ffffff; color: #1e293b; }` },
  { f: "neumorphic", name: "Convex", stage: "neu", c: ["Record"], css: `& { color: #334155; border-radius: 999px; background: linear-gradient(145deg, #f6f8fc, #cfd3db); box-shadow: 6px 6px 12px #c3c8d2, -6px -6px 12px #ffffff; }
&:active { background: linear-gradient(145deg, #cfd3db, #f6f8fc); }` },
  { f: "neumorphic", name: "Concave", stage: "neu", c: ["Settings"], css: `& { color: #334155; border-radius: 14px; background: linear-gradient(145deg, #cfd3db, #f6f8fc); box-shadow: 6px 6px 12px #c3c8d2, -6px -6px 12px #ffffff; }
&:active { box-shadow: inset 3px 3px 8px #c3c8d2, inset -3px -3px 8px #ffffff; }` },
  { f: "neumorphic", name: "Round icon", stage: "neu", aria: "Play", c: [{ i: "play" }], css: `& { color: #2563eb; width: 64px; height: 64px; padding: 0; border-radius: 999px; background: #e6e9ef; box-shadow: 7px 7px 16px #c3c8d2, -7px -7px 16px #ffffff; }
& svg { width: 22px; height: 22px; fill: currentColor; margin-left: 3px; }
&:active { box-shadow: inset 5px 5px 12px #c3c8d2, inset -5px -5px 12px #ffffff; }` },
  { f: "neumorphic", name: "Accent dot", stage: "neu", c: [{ s: "b-dot" }, "Online"], css: `& { color: #334155; background: #e6e9ef; border-radius: 999px; box-shadow: 5px 5px 12px #c3c8d2, -5px -5px 12px #ffffff; }
& .b-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 3px #e6e9ef, 0 0 0 4px rgba(16,185,129,.35); }
&:active { box-shadow: inset 3px 3px 8px #c3c8d2, inset -3px -3px 8px #ffffff; }` },

  // GLOW
  { f: "glow", name: "Blue bloom", c: ["Get started"], css: `& { color: #fff; background: #2563eb; border-radius: 10px; box-shadow: 0 8px 24px -6px rgba(37,99,235,.55); }
&:hover { box-shadow: 0 12px 32px -6px rgba(37,99,235,.7); transform: translateY(-1px); }` },
  { f: "glow", name: "Emerald halo", stage: "ink", c: ["Go live"], css: `& { color: #022c22; background: #34d399; border-radius: 10px; box-shadow: 0 0 0 1px rgba(52,211,153,.5), 0 0 28px -4px rgba(52,211,153,.55); }
&:hover { box-shadow: 0 0 0 1px rgba(52,211,153,.7), 0 0 40px -2px rgba(52,211,153,.7); }` },
  { f: "glow", name: "Ember breathe", stage: "ink", c: ["Light it up"], css: `& { color: #fff7ed; background: #c2410c; border-radius: 10px; animation: K-breathe 2.8s ease-in-out infinite; }
@keyframes K-breathe { 0%, 100% { box-shadow: 0 0 18px -6px rgba(249,115,22,.5); } 50% { box-shadow: 0 0 32px -2px rgba(249,115,22,.75); } }` },
  { f: "glow", name: "Under glow", c: ["Download"], css: `& { color: #fff; background: #0f172a; border-radius: 12px; }
&::before { content: ""; position: absolute; z-index: -1; left: 12%; right: 12%; bottom: -8px; height: 70%; border-radius: 50%; background: linear-gradient(90deg, #0ea5e9, #22c55e); filter: blur(14px); opacity: .7; transition: opacity .25s ease, bottom .25s ease; }
&:hover::before { opacity: 1; bottom: -12px; }` },
  { f: "glow", name: "Moonlight", stage: "ink", c: ["Sign in"], css: `& { color: #0f172a; background: #f8fafc; border-radius: 10px; box-shadow: 0 0 24px -4px rgba(248,250,252,.4); }
&:hover { box-shadow: 0 0 36px 0 rgba(248,250,252,.55); }` },
  { f: "glow", name: "Ring glow", c: ["Send invite"], css: `& { color: #fff; background: #e11d48; border-radius: 10px; box-shadow: 0 0 0 4px rgba(225,29,72,.14); }
&:hover { box-shadow: 0 0 0 8px rgba(225,29,72,.14); }` },

  // ANIMATED HOVER
  { f: "hover", name: "Text roll", c: [{ s: "b-roll", d: { "data-text": "Get started" }, c: ["Get started"] }], css: `& { color: #fff; background: #111827; border-radius: 10px; overflow: hidden; }
& .b-roll { display: block; position: relative; transition: transform .35s cubic-bezier(.7,0,.2,1); }
& .b-roll::after { content: attr(data-text); position: absolute; left: 0; top: 160%; }
&:hover .b-roll { transform: translateY(-160%); }` },
  { f: "hover", name: "Rising fill", c: [{ s: "b-l", c: ["Apply now"] }], css: `& { color: #0f766e; border: 1.5px solid #0f766e; border-radius: 10px; overflow: hidden; }
&::before { content: ""; position: absolute; inset: 0; z-index: -1; background: #0f766e; transform: scaleY(0); transform-origin: bottom; transition: transform .3s cubic-bezier(.7,0,.2,1); }
&:hover { color: #fff; }
&:hover::before { transform: scaleY(1); }` },
  { f: "hover", name: "Circle bloom", c: ["Contact us"], css: `& { color: #111827; border-radius: 999px; box-shadow: inset 0 0 0 1.5px #111827; overflow: hidden; }
&::before { content: ""; position: absolute; z-index: -1; left: 50%; top: 50%; width: 140%; aspect-ratio: 1; border-radius: 50%; background: #111827; transform: translate(-50%,-50%) scale(0); transition: transform .4s cubic-bezier(.7,0,.2,1); }
&:hover { color: #fff; }
&:hover::before { transform: translate(-50%,-50%) scale(1); }` },
  { f: "hover", name: "Arrow reveal", c: ["See pricing", { s: "b-a", c: [{ i: "arrow" }] }], css: `& { color: #fff; background: #1d4ed8; border-radius: 10px; gap: 0; }
& .b-a { display: inline-flex; width: 0; opacity: 0; overflow: hidden; transition: width .25s ease, opacity .25s ease, margin .25s ease; }
&:hover .b-a { width: 18px; opacity: 1; margin-left: 8px; }` },
  { f: "hover", name: "Lift", c: ["Publish"], css: `& { color: #0f172a; background: #fff; border-radius: 10px; box-shadow: 0 0 0 1px #e2e8f0, 0 1px 2px rgba(15,23,42,.06); }
&:hover { transform: translateY(-3px); box-shadow: 0 0 0 1px #e2e8f0, 0 12px 24px -10px rgba(15,23,42,.3); }
&:active { transform: translateY(0); }` },
  { f: "hover", name: "Diagonal wipe", c: [{ s: "b-l", c: ["Shop the sale"] }], css: `& { color: #be123c; border: 1.5px solid #be123c; border-radius: 4px; overflow: hidden; }
&::before { content: ""; position: absolute; z-index: -1; top: 0; bottom: 0; left: -20%; width: 140%; background: #be123c; transform: skewX(-20deg) translateX(-100%); transition: transform .4s cubic-bezier(.7,0,.2,1); }
&:hover { color: #fff; }
&:hover::before { transform: skewX(-20deg) translateX(0); }` },
  { f: "hover", name: "Tracking out", c: ["Discover"], css: `& { color: #fff; background: #44403c; border-radius: 0; text-transform: uppercase; font-size: 12px; letter-spacing: .1em; padding: 0 28px; transition: letter-spacing .3s ease, background-color .3s ease; }
&:hover { letter-spacing: .28em; background: #1c1917; }` },
  { f: "hover", name: "Jelly", c: ["Boop"], css: `& { color: #422006; background: #fcd34d; border-radius: 999px; }
&:hover { animation: K-jelly .6s ease; }
@keyframes K-jelly { 0% { transform: scale(1,1); } 30% { transform: scale(1.12,.88); } 50% { transform: scale(.92,1.08); } 70% { transform: scale(1.04,.96); } 100% { transform: scale(1,1); } }` },

  // ICON
  { f: "icon", name: "Leading icon", c: [{ i: "download" }, "Download PDF"], css: `& { color: #fff; background: #0f172a; border-radius: 10px; padding: 0 20px 0 16px; }
&:hover { background: #1e293b; }` },
  { f: "icon", name: "Trailing icon", c: ["Next lesson", { i: "arrow" }], css: `& { color: #1e3a8a; background: #dbeafe; border-radius: 10px; padding: 0 16px 0 20px; }
&:hover { background: #bfdbfe; }
& svg { transition: transform .2s ease; }
&:hover svg { transform: translateX(3px); }` },
  { f: "icon", name: "Square icon", aria: "Delete", c: [{ i: "trash" }], css: `& { color: #b91c1c; width: 44px; padding: 0; border-radius: 10px; background: #fff; box-shadow: inset 0 0 0 1px #fecaca; }
&:hover { background: #fef2f2; }` },
  { f: "icon", name: "Round icon", aria: "Add to favourites", c: [{ i: "heart" }], css: `& { color: #e11d48; width: 48px; height: 48px; padding: 0; border-radius: 999px; background: #fff1f2; }
&:hover { background: #ffe4e6; transform: scale(1.06); }
&:active { transform: scale(.94); }` },
  { f: "icon", name: "Icon chip", c: [{ s: "b-chip", c: [{ i: "upload" }] }, "Upload files"], css: `& { color: #fff; background: #1e293b; border-radius: 12px; padding: 0 18px 0 6px; min-height: 48px; gap: 12px; }
& .b-chip { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,.12); }
&:hover .b-chip { background: #2563eb; }` },
  { f: "icon", name: "Stacked", c: [{ i: "calendar" }, { s: "b-l", c: ["Schedule"] }], css: `& { flex-direction: column; gap: 6px; padding: 12px 18px; min-width: 92px; color: #334155; background: #fff; border-radius: 14px; font-size: 12px; box-shadow: inset 0 0 0 1px #e2e8f0; }
& svg { width: 22px; height: 22px; color: #0f766e; }
&:hover { box-shadow: inset 0 0 0 1px #94a3b8; }` },
  { f: "icon", name: "Floating action", aria: "Create new", c: [{ i: "plus" }], css: `& { color: #fff; width: 56px; height: 56px; padding: 0; border-radius: 18px; background: #0f766e; box-shadow: 0 10px 24px -8px rgba(15,118,110,.6); }
& svg { width: 24px; height: 24px; transition: transform .3s ease; }
&:hover svg { transform: rotate(90deg); }` },

  // LOADING
  { f: "loading", name: "Ring spinner", busy: true, c: [{ s: "b-spin" }, "Saving"], css: `& { color: #fff; background: #2563eb; border-radius: 10px; min-width: 128px; }
& .b-spin { display: none; width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; animation: K-spin .7s linear infinite; }
&[aria-busy="true"] .b-spin { display: block; }
&[aria-busy="true"] { cursor: progress; }
@keyframes K-spin { to { transform: rotate(360deg); } }` },
  { f: "loading", name: "Bouncing dots", busy: true, aria: "Sending", c: [{ s: "b-dots", c: [{ s: "b-d" }, { s: "b-d" }, { s: "b-d" }] }, { s: "b-l", c: ["Send"] }], css: `& { color: #fff; background: #111827; border-radius: 999px; min-width: 112px; }
& .b-dots { display: none; gap: 5px; }
& .b-d { width: 6px; height: 6px; border-radius: 50%; background: #fff; animation: K-bounce 1s ease-in-out infinite; }
& .b-d:nth-child(2) { animation-delay: .15s; }
& .b-d:nth-child(3) { animation-delay: .3s; }
&[aria-busy="true"] .b-dots { display: inline-flex; }
&[aria-busy="true"] .b-l { display: none; }
@keyframes K-bounce { 0%, 80%, 100% { transform: translateY(0); opacity: .5; } 40% { transform: translateY(-5px); opacity: 1; } }` },
  { f: "loading", name: "Progress edge", busy: true, c: ["Uploading"], css: `& { color: #0f172a; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: inset 0 0 0 1px #cbd5e1; }
&::after { content: ""; position: absolute; left: 0; bottom: 0; height: 3px; width: 40%; background: #0f766e; transform: translateX(-100%); opacity: 0; }
&[aria-busy="true"]::after { opacity: 1; animation: K-slide 1.2s cubic-bezier(.6,0,.4,1) infinite; }
@keyframes K-slide { to { transform: translateX(260%); } }` },
  { f: "loading", name: "Swap spinner", busy: true, aria: "Pay now", c: [{ s: "b-l", c: ["Pay now"] }, { s: "b-spin" }], css: `& { color: #fff; background: #047857; border-radius: 10px; min-width: 120px; }
& .b-spin { position: absolute; width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,.3); border-right-color: #fff; opacity: 0; }
&[aria-busy="true"] .b-l { opacity: 0; }
&[aria-busy="true"] .b-spin { opacity: 1; animation: K-spin .8s linear infinite; }
@keyframes K-spin { to { transform: rotate(360deg); } }` },
  { f: "loading", name: "Striped", busy: true, c: ["Processing"], css: `& { color: #fff; background-color: #c2410c; border-radius: 10px; }
&[aria-busy="true"] { background-image: repeating-linear-gradient(-45deg, rgba(255,255,255,.14) 0 10px, transparent 10px 20px); background-size: 28px 28px; animation: K-stripes .8s linear infinite; }
@keyframes K-stripes { to { background-position: 28px 0; } }` },
  { f: "loading", name: "Shimmer", busy: true, c: ["Generating preview"], css: `& { color: #475569; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
&[aria-busy="true"]::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.85), transparent); transform: translateX(-100%); animation: K-shim 1.4s ease-in-out infinite; }
@keyframes K-shim { to { transform: translateX(100%); } }` },

  // PILL
  { f: "pill", name: "Soft tint", c: ["Filter results"], css: `& { color: #1e40af; background: #dbeafe; border-radius: 999px; padding: 0 20px; }
&:hover { background: #bfdbfe; }` },
  { f: "pill", name: "Live status", c: [{ s: "b-dot" }, "Live now"], css: `& { color: #fff; background: #0f172a; border-radius: 999px; padding: 0 18px 0 14px; }
& .b-dot { width: 8px; height: 8px; border-radius: 50%; background: #f43f5e; box-shadow: 0 0 0 0 rgba(244,63,94,.6); animation: K-ping 1.6s ease-out infinite; }
@keyframes K-ping { to { box-shadow: 0 0 0 7px rgba(244,63,94,0); } }` },
  { f: "pill", name: "Floating white", stage: "paper", c: ["Book a demo"], css: `& { color: #0f172a; background: #fff; border-radius: 999px; padding: 0 26px; min-height: 50px; box-shadow: 0 0 0 1px rgba(15,23,42,.06), 0 8px 20px -8px rgba(15,23,42,.25); }
&:hover { box-shadow: 0 0 0 1px rgba(15,23,42,.1), 0 14px 28px -10px rgba(15,23,42,.35); }` },
  { f: "pill", name: "Count badge", c: ["Inbox", { s: "b-n", c: ["12"] }], css: `& { color: #0f172a; background: #f1f5f9; border-radius: 999px; padding: 0 8px 0 18px; gap: 10px; }
& .b-n { min-width: 28px; height: 28px; padding: 0 8px; display: grid; place-items: center; border-radius: 999px; background: #0f172a; color: #fff; font-size: 12px; font-variant-numeric: tabular-nums; }
&:hover { background: #e2e8f0; }` },
  { f: "pill", name: "Tiny caps", c: ["New release"], css: `& { color: #0f766e; border-radius: 999px; min-height: 32px; padding: 0 14px; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; box-shadow: inset 0 0 0 1px #5eead4; background: #f0fdfa; }
&:hover { background: #ccfbf1; }` },
  { f: "pill", name: "Two tone", c: [{ s: "b-a", c: ["Free trial"] }, { s: "b-b", c: ["14 days"] }], css: `& { padding: 4px; gap: 0; border-radius: 999px; background: #111827; color: #fff; }
& .b-a { padding: 8px 14px; }
& .b-b { padding: 8px 14px; border-radius: 999px; background: #fde047; color: #422006; transition: transform .2s ease; }
&:hover .b-b { transform: translateX(2px); }` },

  // BRUTALIST
  { f: "brutalist", name: "Classic block", c: ["Hire us"], css: `& { color: #000; background: #fde047; border: 2px solid #000; border-radius: 0; box-shadow: 4px 4px 0 #000; font-weight: 800; }
&:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 #000; }
&:active { transform: translate(4px,4px); box-shadow: 0 0 0 #000; }` },
  { f: "brutalist", name: "Salmon", c: ["Read zine"], css: `& { color: #000; background: #fda4af; border: 2px solid #000; border-radius: 12px; box-shadow: 3px 4px 0 #000; font-weight: 700; }
&:active { transform: translate(3px,4px); box-shadow: none; }` },
  { f: "brutalist", name: "Mono slab", c: ["RUN_SCRIPT"], css: `& { color: #000; background: #fff; border: 3px solid #000; border-radius: 0; font: 700 13px/1 ui-monospace, "SF Mono", Menlo, monospace; letter-spacing: .04em; }
&:hover { background: #000; color: #fff; }` },
  { f: "brutalist", name: "Sticker", c: ["Grab one"], css: `& { color: #000; background: #a7f3d0; border: 2px solid #000; border-radius: 999px; box-shadow: 3px 3px 0 #000; transform: rotate(-3deg); font-weight: 800; }
&:hover { transform: rotate(0deg) scale(1.04); }` },
  { f: "brutalist", name: "Lime on black", stage: "ink", c: ["Enter"], css: `& { color: #000; background: #bef264; border: 2px solid #bef264; border-radius: 0; box-shadow: 5px 5px 0 #f8fafc; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; font-size: 13px; }
&:active { transform: translate(5px,5px); box-shadow: none; }` },
  { f: "brutalist", name: "Hatched", c: ["Sign up"], css: `& { color: #000; border: 2px solid #000; border-radius: 0; font-weight: 800; }
&::before { content: ""; position: absolute; z-index: -1; inset: 0; background: #fff; }
&::after { content: ""; position: absolute; z-index: -2; inset: -2px; transform: translate(6px,6px); border: 2px solid #000; background: repeating-linear-gradient(45deg, #000 0 1.5px, #fff 1.5px 5px); transition: transform .15s ease; }
&:hover::after { transform: translate(8px,8px); }
&:active { transform: translate(6px,6px); }
&:active::after { transform: translate(0,0); }` },

  // UNDERLINE
  { f: "underline", name: "Grow from left", c: ["Read more"], css: `& { color: #0f172a; padding: 0 2px; min-height: 36px; border-radius: 2px; }
&::after { content: ""; position: absolute; left: 0; right: 0; bottom: 6px; height: 2px; background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform .3s cubic-bezier(.7,0,.2,1); }
&:hover::after { transform: scaleX(1); }` },
  { f: "underline", name: "Centre out", c: ["About the studio"], css: `& { color: #1d4ed8; padding: 0 2px; min-height: 36px; border-radius: 2px; }
&::after { content: ""; position: absolute; left: 0; right: 0; bottom: 6px; height: 2px; background: currentColor; transform: scaleX(0); transition: transform .3s ease; }
&:hover::after { transform: scaleX(1); }` },
  { f: "underline", name: "Highlighter", c: ["View the menu"], css: `& { color: #1c1917; padding: 0 4px; min-height: 36px; border-radius: 0; background: linear-gradient(#fde68a, #fde68a) no-repeat 0 85% / 100% 6px; transition: background-size .25s ease; }
&:hover { background-size: 100% 80%; }` },
  { f: "underline", name: "Wavy", c: ["Change plan"], css: `& { color: #047857; padding: 0 2px; min-height: 36px; border-radius: 2px; text-decoration: underline; text-decoration-color: transparent; text-decoration-thickness: 1.5px; text-underline-offset: 6px; transition: text-decoration-color .2s ease; }
&:hover { text-decoration-style: wavy; text-decoration-color: currentColor; }` },
  { f: "underline", name: "Arrow link", c: [{ s: "b-l", c: ["All case studies"] }, { i: "arrow" }], css: `& { color: #0f172a; padding: 0 2px; min-height: 36px; border-radius: 2px; }
& .b-l { background: linear-gradient(currentColor, currentColor) no-repeat 0 100% / 100% 1px; padding-bottom: 2px; transition: background-size .3s ease; }
& svg { width: 16px; height: 16px; transition: transform .25s ease; }
&:hover .b-l { background-size: 0% 1px; background-position: 100% 100%; }
&:hover svg { transform: translateX(4px); }` },
  { f: "underline", name: "Offset slide", c: ["Privacy settings"], css: `& { color: #475569; padding: 0 2px; min-height: 36px; border-radius: 2px; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; transition: text-underline-offset .2s ease, color .2s ease; }
&:hover { color: #0f172a; text-underline-offset: 7px; }` },

  // SHINE
  { f: "shine", name: "Hover sweep", c: ["Upgrade"], css: `& { color: #fff; background: #1e293b; border-radius: 10px; overflow: hidden; }
&::after { content: ""; position: absolute; top: 0; bottom: 0; left: -60%; width: 40%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent); transform: skewX(-20deg); transition: left .6s ease; }
&:hover::after { left: 130%; }` },
  { f: "shine", name: "Auto glint", c: ["Go premium"], css: `& { color: #fff; background: #111827; border-radius: 10px; overflow: hidden; }
&::after { content: ""; position: absolute; top: 0; bottom: 0; width: 30%; left: -50%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent); transform: skewX(-20deg); animation: K-glint 3.2s ease-in-out infinite; }
@keyframes K-glint { 0%, 55% { left: -50%; } 85%, 100% { left: 130%; } }` },
  { f: "shine", name: "Gold leaf", c: ["Members only"], css: `& { color: #422006; border-radius: 8px; overflow: hidden; background: linear-gradient(135deg, #fde68a, #d97706 45%, #fcd34d 60%, #b45309); box-shadow: inset 0 1px 0 rgba(255,255,255,.6), 0 2px 6px rgba(180,83,9,.35); }
&::after { content: ""; position: absolute; inset: 0; background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,.7) 50%, transparent 65%); transform: translateX(-100%); transition: transform .7s ease; }
&:hover::after { transform: translateX(100%); }` },
  { f: "shine", name: "Brushed steel", c: ["Configure"], css: `& { color: #1f2937; border-radius: 8px; overflow: hidden; background: repeating-linear-gradient(90deg, rgba(255,255,255,.25) 0 1px, transparent 1px 3px), linear-gradient(180deg, #f3f4f6, #9ca3af); box-shadow: inset 0 1px 0 #fff, inset 0 -1px 0 #6b7280, 0 1px 3px rgba(0,0,0,.25); }
&::after { content: ""; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 40%, rgba(255,255,255,.75) 50%, transparent 60%); transform: translateX(-100%); transition: transform .6s ease; }
&:hover::after { transform: translateX(100%); }` },
  { f: "shine", name: "Outline shine", c: ["Watch demo"], css: `& { color: #0f172a; border-radius: 10px; overflow: hidden; box-shadow: inset 0 0 0 1.5px #0f172a; }
&::after { content: ""; position: absolute; top: 0; bottom: 0; left: -40%; width: 25%; background: linear-gradient(90deg, transparent, rgba(15,23,42,.12), transparent); transform: skewX(-20deg); transition: left .55s ease; }
&:hover::after { left: 120%; }` },
  { f: "shine", name: "Glint pill", c: ["Claim reward"], css: `& { color: #fff; background: #047857; border-radius: 999px; overflow: hidden; }
&::after { content: ""; position: absolute; top: -50%; bottom: -50%; width: 18px; left: -20%; background: rgba(255,255,255,.4); filter: blur(4px); transform: rotate(20deg); animation: K-glint 2.6s ease-in-out infinite; }
@keyframes K-glint { 0%, 60% { left: -20%; } 100% { left: 120%; } }` },

  // BORDER ANIMATION
  { f: "border", name: "Orbiting edge", c: [{ s: "b-l", c: ["Launch"] }], css: `& { color: #fff; border-radius: 12px; overflow: hidden; background: #0f172a; }
&::before { content: ""; position: absolute; z-index: -2; left: 50%; top: 50%; width: 200%; aspect-ratio: 1; background: conic-gradient(from 0deg, transparent 0 70%, #38bdf8 80%, #34d399 90%, transparent); transform: translate(-50%,-50%); animation: K-orbit 3s linear infinite; }
&::after { content: ""; position: absolute; z-index: -1; inset: 2px; border-radius: 10px; background: #0f172a; }
@keyframes K-orbit { to { transform: translate(-50%,-50%) rotate(360deg); } }` },
  { f: "border", name: "Draw the box", c: ["Hover to draw"], css: `& { color: #0f172a; border-radius: 0; background: linear-gradient(#0f172a,#0f172a) no-repeat 0 0 / 0 2px, linear-gradient(#0f172a,#0f172a) no-repeat 100% 0 / 2px 0, linear-gradient(#0f172a,#0f172a) no-repeat 100% 100% / 0 2px, linear-gradient(#0f172a,#0f172a) no-repeat 0 100% / 2px 0, #f1f5f9; transition: background-size .5s ease; }
&:hover { background-size: 100% 2px, 2px 100%, 100% 2px, 2px 100%, auto; }` },
  { f: "border", name: "Marching ants", c: ["Drop files here"], css: `& { color: #334155; border-radius: 0; background: linear-gradient(90deg, #334155 50%, transparent 0) repeat-x 0 0 / 12px 1.5px, linear-gradient(90deg, #334155 50%, transparent 0) repeat-x 0 100% / 12px 1.5px, linear-gradient(0deg, #334155 50%, transparent 0) repeat-y 0 0 / 1.5px 12px, linear-gradient(0deg, #334155 50%, transparent 0) repeat-y 100% 0 / 1.5px 12px; animation: K-ants .8s linear infinite; }
@keyframes K-ants { to { background-position: 12px 0, -12px 100%, 0 -12px, 100% 12px; } }` },
  { f: "border", name: "Ripple ring", c: ["Join call"], css: `& { color: #fff; background: #0f766e; border-radius: 999px; }
&::before, &::after { content: ""; position: absolute; inset: 0; border-radius: inherit; border: 2px solid #14b8a6; z-index: -1; animation: K-ripple 2.2s ease-out infinite; }
&::after { animation-delay: 1.1s; }
@keyframes K-ripple { from { transform: scale(1); opacity: .8; } to { transform: scale(1.35,1.7); opacity: 0; } }` },
  { f: "border", name: "Flowing edge", c: ["Create account"], css: `& { color: #0f172a; border: 2px solid transparent; border-radius: 12px; background: linear-gradient(#fff,#fff) padding-box, linear-gradient(90deg, #f97316, #0ea5e9, #10b981, #f97316) border-box; background-size: 100% 100%, 300% 100%; animation: K-flow 4s linear infinite; }
@keyframes K-flow { to { background-position: 0 0, 300% 0; } }` },
  { f: "border", name: "Offset frame", c: ["Portfolio"], css: `& { color: #fff; background: #1c1917; border-radius: 4px; }
&::before { content: ""; position: absolute; inset: 0; border: 1.5px solid #1c1917; border-radius: 6px; transition: inset .25s cubic-bezier(.2,.8,.2,1); z-index: -1; }
&:hover::before { inset: -6px; }` },

  // SPLIT
  { f: "split", name: "Menu split", group: true, aria: "Publish options", c: [{ b: ["Publish"] }, { b: [{ i: "chevron" }], label: "More publish options" }], css: `& { display: inline-flex; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,.3); }
& button { background: #111827; color: #fff; border-radius: 0; }
& button:hover { background: #1f2937; }
& button + button { padding: 0 12px; border-left: 1px solid rgba(255,255,255,.18); }` },
  { f: "split", name: "Count", group: true, aria: "Watch this project", c: [{ b: [{ i: "eye" }, "Watch"] }, { b: ["312"], label: "312 people watching" }], css: `& { display: inline-flex; border-radius: 8px; box-shadow: inset 0 0 0 1px #d4d4d8; background: #fff; }
& button { color: #18181b; border-radius: 8px 0 0 8px; padding: 0 14px; min-height: 38px; font-size: 14px; }
& button + button { border-radius: 0 8px 8px 0; border-left: 1px solid #d4d4d8; font-variant-numeric: tabular-nums; color: #3f3f46; }
& button:hover { background: #f4f4f5; }` },
  { f: "split", name: "Version", group: true, aria: "Download", c: [{ b: [{ i: "download" }, "Download"] }, { b: ["v2.4"], label: "Choose version, current v2.4" }], css: `& { display: inline-flex; border-radius: 10px; background: #1d4ed8; }
& button { color: #fff; border-radius: 10px 0 0 10px; }
& button + button { border-radius: 0 10px 10px 0; padding: 0 14px; background: #1e40af; font: 500 13px/1 ui-monospace, Menlo, monospace; }
& button:hover { background: #1e3a8a; }` },
  { f: "split", name: "Price", group: true, aria: "Buy", c: [{ b: ["Buy now"] }, { b: ["$48"], label: "Price 48 dollars" }], css: `& { display: inline-flex; border-radius: 999px; background: #fde047; padding: 4px; }
& button { color: #422006; border-radius: 999px; min-height: 40px; }
& button:first-child { background: #111827; color: #fff; }
& button:first-child:hover { background: #374151; }
& button + button { font-variant-numeric: tabular-nums; padding: 0 16px; }` },
  { f: "split", name: "Icon cell", group: true, aria: "Share", c: [{ b: [{ i: "share" }], label: "Share options" }, { b: ["Share link"] }], css: `& { display: inline-flex; border-radius: 10px; overflow: hidden; }
& button { border-radius: 0; color: #fff; background: #0f766e; }
& button:first-child { padding: 0 14px; background: #115e59; }
& button:hover { background: #134e4a; }` },
  { f: "split", name: "Stepper", group: true, aria: "Quantity", c: [{ b: [{ i: "minus" }], label: "Decrease" }, { b: ["2"], label: "Quantity 2" }, { b: [{ i: "plus" }], label: "Increase" }], css: `& { display: inline-flex; border-radius: 999px; box-shadow: inset 0 0 0 1px #d6d3d1; background: #fff; }
& button { color: #1c1917; width: 44px; padding: 0; border-radius: 999px; font-size: 17px; }
& button:nth-child(2) { width: 36px; cursor: default; font-variant-numeric: tabular-nums; font-size: 15px; }
& button:not(:nth-child(2)):hover { background: #f5f5f4; }` },

  // TOGGLE
  { f: "toggle", name: "Follow", pressed: false, c: [{ s: "b-off", c: [{ i: "plus" }, "Follow"] }, { s: "b-on", c: [{ i: "check" }, "Following"] }], css: `& { color: #fff; background: #111827; border-radius: 999px; min-width: 132px; }
& .b-off, & .b-on { display: inline-flex; align-items: center; gap: 6px; }
& .b-on { display: none; }
&[aria-pressed="true"] { background: #fff; color: #111827; box-shadow: inset 0 0 0 1px #d1d5db; }
&[aria-pressed="true"] .b-on { display: inline-flex; }
&[aria-pressed="true"] .b-off { display: none; }` },
  { f: "toggle", name: "Like", pressed: true, aria: "Like", c: [{ i: "heart" }], css: `& { color: #9ca3af; width: 48px; height: 48px; padding: 0; border-radius: 999px; background: #fff; box-shadow: inset 0 0 0 1px #e5e7eb; }
& svg { width: 22px; height: 22px; transition: transform .25s cubic-bezier(.3,.7,.4,1.6), fill .2s ease; fill: transparent; }
&[aria-pressed="true"] { color: #e11d48; }
&[aria-pressed="true"] svg { fill: #e11d48; transform: scale(1.12); }` },
  { f: "toggle", name: "Bookmark", pressed: false, c: [{ i: "bookmark" }, "Save"], css: `& { color: #334155; background: #f1f5f9; border-radius: 10px; }
& svg { fill: transparent; transition: fill .2s ease; }
&[aria-pressed="true"] { color: #fff; background: #0f766e; }
&[aria-pressed="true"] svg { fill: currentColor; }` },
  { f: "toggle", name: "Notify", pressed: true, c: [{ i: "bell" }, "Alerts"], css: `& { color: #64748b; background: #fff; border-radius: 10px; box-shadow: inset 0 0 0 1px #cbd5e1; }
&[aria-pressed="true"] { color: #92400e; background: #fef3c7; box-shadow: inset 0 0 0 1px #fcd34d; }
&[aria-pressed="true"] svg { animation: K-ring .5s ease; }
@keyframes K-ring { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(14deg); } 75% { transform: rotate(-14deg); } }` },
  { f: "toggle", name: "Switch button", pressed: true, c: [{ s: "b-track", c: [{ s: "b-knob" }] }, "Dark mode"], css: `& { color: #0f172a; background: #fff; border-radius: 999px; padding: 0 18px 0 8px; gap: 10px; box-shadow: inset 0 0 0 1px #e2e8f0; }
& .b-track { width: 40px; height: 24px; border-radius: 999px; background: #cbd5e1; padding: 3px; transition: background-color .2s ease; }
& .b-knob { display: block; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform .25s cubic-bezier(.3,.7,.4,1.3); }
&[aria-pressed="true"] .b-track { background: #2563eb; }
&[aria-pressed="true"] .b-knob { transform: translateX(16px); }` },
  { f: "toggle", name: "Segmented", group: true, exclusive: true, aria: "Billing period", c: [{ b: ["Monthly"], pressed: false }, { b: ["Yearly"], pressed: true }], css: `& { display: inline-flex; gap: 2px; padding: 4px; border-radius: 12px; background: #f1f5f9; }
& button { color: #475569; border-radius: 8px; min-height: 36px; padding: 0 16px; font-size: 14px; }
& button[aria-pressed="true"] { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(15,23,42,.15); }` },

  // SOCIAL STYLE (generic, no brand marks)
  { f: "social", name: "Email sign in", c: [{ i: "mail" }, "Continue with email"], css: `& { color: #18181b; background: #fff; border-radius: 10px; min-width: 240px; box-shadow: inset 0 0 0 1px #d4d4d8; }
&:hover { background: #fafafa; }` },
  { f: "social", name: "Passkey", c: [{ i: "key" }, "Sign in with a passkey"], css: `& { color: #fff; background: #18181b; border-radius: 10px; min-width: 240px; }
&:hover { background: #27272a; }` },
  { f: "social", name: "Phone code", c: [{ i: "phone" }, "Text me a code"], css: `& { color: #065f46; background: #ecfdf5; border-radius: 10px; min-width: 240px; box-shadow: inset 0 0 0 1px #a7f3d0; }
&:hover { background: #d1fae5; }` },
  { f: "social", name: "Share", c: [{ i: "share" }, "Share"], css: `& { color: #1e3a8a; background: #eff6ff; border-radius: 999px; }
&:hover { background: #dbeafe; }` },
  { f: "social", name: "Subscribe channel", c: [{ i: "play" }, "Subscribe", { s: "b-n", c: ["24K"] }], css: `& { color: #fff; background: #b91c1c; border-radius: 999px; padding: 0 8px 0 16px; }
& svg { fill: currentColor; width: 14px; height: 14px; }
& .b-n { padding: 4px 9px; border-radius: 999px; background: rgba(0,0,0,.22); font-size: 12px; font-variant-numeric: tabular-nums; }
&:hover { background: #991b1b; }` },
  { f: "social", name: "Message", c: [{ i: "chat" }, "Message"], css: `& { color: #0f172a; background: #fff; border-radius: 10px; box-shadow: 0 0 0 1px #e2e8f0, 0 1px 2px rgba(15,23,42,.06); }
& svg { color: #0d9488; }
&:hover { box-shadow: 0 0 0 1px #cbd5e1, 0 4px 10px -4px rgba(15,23,42,.15); }` },
  { f: "social", name: "Feed", c: [{ i: "rss" }, "Follow the feed"], css: `& { color: #9a3412; background: #fff7ed; border-radius: 10px; box-shadow: inset 0 0 0 1px #fed7aa; }
&:hover { background: #ffedd5; }` },
];

/* ---------- more variety: second passes that use different techniques ---------- */
const EXTRA: Item[] = [
  { f: "solid", name: "Sky inset", c: ["Open map"], css: `& { color: #0c4a6e; background: #bae6fd; border-radius: 10px; box-shadow: inset 0 -2px 0 rgba(12,74,110,.18); }
&:hover { background: #7dd3fc; }` },
  { f: "outline", name: "Ghost", c: ["Skip for now"], css: `& { color: #334155; border-radius: 8px; }
&:hover { background: #f1f5f9; color: #0f172a; }` },
  { f: "gradient", name: "Duotone stripe", c: ["Get the guide"], css: `& { color: #fff; border-radius: 0; background: linear-gradient(90deg, #0f172a 0 50%, #0f766e 50% 100%) 100% 0 / 200% 100%; }
&:hover { background-position: 0 0; }` },
  { f: "pressable", name: "Push pin", c: ["Pin note"], css: `& { color: #fff; background: #e11d48; border-radius: 999px; box-shadow: 0 4px 0 #9f1239, 0 8px 12px -4px rgba(0,0,0,.35); }
&:active { transform: translateY(4px); box-shadow: 0 0 0 #9f1239, 0 2px 4px rgba(0,0,0,.3); transition-duration: .05s; }` },
  { f: "glow", name: "Teal edge light", stage: "ink", c: ["Connect"], css: `& { color: #ccfbf1; background: #042f2e; border-radius: 10px; box-shadow: inset 0 0 0 1px rgba(45,212,191,.5), 0 0 22px -6px rgba(45,212,191,.6); }
&:hover { box-shadow: inset 0 0 0 1px rgba(45,212,191,.9), 0 0 30px -4px rgba(45,212,191,.8); }` },
  { f: "icon", name: "Search key", c: [{ i: "search" }, { s: "b-l", c: ["Search docs"] }, { s: "b-k", c: ["/"] }], css: `& { color: #64748b; background: #fff; border-radius: 10px; min-width: 220px; justify-content: flex-start; padding: 0 8px 0 14px; font-weight: 500; box-shadow: inset 0 0 0 1px #e2e8f0; }
& .b-l { flex: 1; text-align: left; }
& .b-k { font: 600 11px/1 ui-monospace, Menlo, monospace; color: #475569; padding: 5px 7px; border-radius: 6px; background: #f1f5f9; box-shadow: inset 0 -1px 0 #cbd5e1; }
&:hover { box-shadow: inset 0 0 0 1px #94a3b8; }` },
  { f: "hover", name: "Icon slide-in", c: [{ s: "b-ic", c: [{ i: "cart" }] }, { s: "b-l", c: ["Add to bag"] }], css: `& { color: #fff; background: #c2410c; border-radius: 10px; overflow: hidden; }
& .b-ic { position: absolute; inset: 0; display: grid; place-items: center; transform: translateY(-100%); transition: transform .3s cubic-bezier(.7,0,.2,1); }
& .b-l { transition: transform .3s cubic-bezier(.7,0,.2,1); }
&:hover .b-ic { transform: translateY(0); }
&:hover .b-l { transform: translateY(160%); }` },
  { f: "pill", name: "Avatar pill", c: [{ s: "b-av", c: ["MK"] }, "Invite Maya"], css: `& { color: #0f172a; background: #fff; border-radius: 999px; padding: 0 18px 0 5px; gap: 10px; box-shadow: inset 0 0 0 1px #e2e8f0; }
& .b-av { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: #fbcfe8; color: #831843; font-size: 12px; }
&:hover { box-shadow: inset 0 0 0 1px #94a3b8; }` },
  { f: "shine", name: "Holo foil", c: ["Collect card"], css: `& { color: #0f172a; border-radius: 10px; background: linear-gradient(110deg, #e0f2fe, #fef9c3, #fce7f3, #dcfce7, #e0f2fe) 0 0 / 300% 100%; box-shadow: inset 0 0 0 1px rgba(15,23,42,.12); }
&:hover { background-position: 100% 0; transition: background-position 1.2s ease; }` },
  { f: "neumorphic", name: "Dark soft UI", stage: "ink", c: ["Unlock"], css: `& { color: #e2e8f0; background: #1e293b; border-radius: 14px; box-shadow: 6px 6px 14px #0b1220, -6px -6px 14px #2c3a52; }
&:active { box-shadow: inset 4px 4px 10px #0b1220, inset -4px -4px 10px #2c3a52; }` },
  { f: "brutalist", name: "Cut corner", c: ["Next level"], css: `& { color: #fff; background: #1d4ed8; border-radius: 0; font-weight: 800; clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px); }
&:hover { background: #1e3a8a; }` },
  { f: "border", name: "Thin to thick", c: ["Choose"], css: `& { color: #7c2d12; border-radius: 10px; box-shadow: inset 0 0 0 1px #ea580c; }
&:hover { box-shadow: inset 0 0 0 1px #ea580c, 0 0 0 4px #ffedd5; }
&:active { box-shadow: inset 0 0 0 2px #c2410c, 0 0 0 4px #ffedd5; }` },
  { f: "loading", name: "Done state", busy: true, c: [{ s: "b-spin" }, { s: "b-l", c: ["Publishing"] }], css: `& { color: #fff; background: #0f172a; border-radius: 10px; min-width: 140px; }
& .b-spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.3); border-top-color: #34d399; display: none; animation: K-spin .7s linear infinite; }
&[aria-busy="true"] .b-spin { display: block; }
&[aria-busy="false"] { background: #047857; }
@keyframes K-spin { to { transform: rotate(360deg); } }` },
  { f: "social", name: "Website link", c: [{ i: "globe" }, "Visit website"], css: `& { color: #fff; background: linear-gradient(#334155, #1e293b); border-radius: 10px; box-shadow: inset 0 1px 0 rgba(255,255,255,.15); }
&:hover { background: linear-gradient(#475569, #334155); }` },
  { f: "underline", name: "Strike drop", c: ["Old price"], css: `& { color: #57534e; padding: 0 2px; min-height: 36px; border-radius: 2px; }
&::after { content: ""; position: absolute; left: 0; right: 0; height: 1.5px; top: 50%; background: currentColor; transition: top .25s ease; }
&:hover::after { top: calc(100% - 8px); }` },
  { f: "toggle", name: "Lock", pressed: false, aria: "Lock layer", c: [{ i: "lock" }], css: `& { color: #64748b; width: 44px; padding: 0; border-radius: 10px; background: #f8fafc; box-shadow: inset 0 0 0 1px #e2e8f0; }
&[aria-pressed="true"] { color: #fff; background: #334155; box-shadow: none; }` },
  { f: "glass", name: "Glass on light", stage: "sky", c: ["Check availability"], css: `& { color: #0c4a6e; border-radius: 12px; background: rgba(255,255,255,.55); border: 1px solid rgba(255,255,255,.9); box-shadow: 0 8px 24px -10px rgba(12,74,110,.35); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
&:hover { background: rgba(255,255,255,.75); }` },
  { f: "split", name: "Rating", group: true, aria: "Star this", c: [{ b: [{ i: "star" }, "Star"] }, { b: ["1.2k"], label: "1.2 thousand stars" }], css: `& { display: inline-flex; border-radius: 999px; background: #fef3c7; }
& button { color: #78350f; border-radius: 999px 0 0 999px; padding: 0 14px; }
& button + button { border-radius: 0 999px 999px 0; border-left: 1px solid #fcd34d; }
& button:hover { background: #fde68a; }
& svg { fill: #f59e0b; color: #b45309; }` },
  { f: "hover", name: "Bolt nudge", c: [{ i: "bolt" }, "Quick start"], css: `& { color: #422006; background: #fde047; border-radius: 10px; }
&:hover svg { animation: K-nudge .5s ease; }
@keyframes K-nudge { 0%, 100% { transform: translateY(0) rotate(0); } 30% { transform: translateY(-3px) rotate(-12deg); } 60% { transform: translateY(1px) rotate(8deg); } }` },
];

const ALL: Item[] = (Object.keys(FAMILIES) as FamilyKey[]).flatMap((f) => [...ITEMS, ...EXTRA].filter((it) => it.f === f));

/* ---------- rendering helpers ---------- */
const SVG_ATTRS = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;

function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

const TOGGLE_JS = `this.setAttribute('aria-pressed', this.getAttribute('aria-pressed') !== 'true')`;
const BUSY_JS = `this.setAttribute('aria-busy', this.getAttribute('aria-busy') !== 'true')`;

function renderNodes(nodes: Node[], key = "n"): ReactNode[] {
  return nodes.map((n, i) => {
    const k = `${key}${i}`;
    if (typeof n === "string") return n;
    if ("i" in n) return <Icon key={k} name={n.i} />;
    if ("b" in n)
      return (
        <button key={k} type="button" aria-label={n.label} aria-pressed={n.pressed}>
          {renderNodes(n.b, k)}
        </button>
      );
    return (
      <span key={k} className={n.s} {...(n.d ?? {})}>
        {n.c ? renderNodes(n.c, k) : null}
      </span>
    );
  });
}

function htmlNodes(nodes: Node[], exclusive = false): string {
  return nodes
    .map((n) => {
      if (typeof n === "string") return n;
      if ("i" in n) return `<svg ${SVG_ATTRS}><path d="${ICONS[n.i]}"/></svg>`;
      if ("b" in n) {
        const label = n.label ? ` aria-label="${n.label}"` : "";
        const pressed = n.pressed === undefined ? "" : ` aria-pressed="${n.pressed}"`;
        const js = exclusive ? ` onclick="pick(this)"` : "";
        return `\n  <button type="button"${label}${pressed}${js}>${htmlNodes(n.b)}</button>`;
      }
      const data = Object.entries(n.d ?? {}).map(([a, v]) => ` ${a}="${v}"`).join("");
      return `<span class="${n.s}"${data}>${n.c ? htmlNodes(n.c) : ""}</span>`;
    })
    .join("");
}

const scope = (css: string, sel: string, kf: string) => css.replace(/&/g, sel).replace(/\bK-/g, `${kf}-`);

function snippetFor(it: Item): string {
  if (it.group) {
    const cls = "btn-group";
    const base = scope(BASE, `.${cls} button`, cls);
    const css = scope(it.css, `.${cls}`, cls);
    const pick = it.exclusive
      ? `\n<script>\n  function pick(b) {\n    b.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));\n  }\n</script>`
      : "";
    return `<div class="${cls}" role="group" aria-label="${it.aria ?? it.name}">${htmlNodes(it.c, it.exclusive)}\n</div>\n\n<style>\n${base}\n${css}\n</style>${pick}\n`;
  }
  const aria = it.aria ? ` aria-label="${it.aria}"` : "";
  const pressed = it.pressed === undefined ? "" : ` aria-pressed="${it.pressed}" onclick="${TOGGLE_JS}"`;
  const busy = it.busy ? ` aria-busy="true" onclick="${BUSY_JS}"` : "";
  const inner = it.c.every((n) => typeof n === "string") ? htmlNodes(it.c) : `\n  ${it.c.map((n) => htmlNodes([n])).join("\n  ")}\n`;
  return `<button class="btn" type="button"${aria}${pressed}${busy}>${inner}</button>\n\n<style>\n${scope(BASE, ".btn", "btn")}\n${scope(it.css, ".btn", "btn")}\n</style>\n`;
}

const STAGES: Record<Stage, string> = {
  white: "bg-white",
  paper: "bg-[#f4f2ee]",
  ink: "bg-[#0b0f17]",
  neu: "bg-[#e6e9ef]",
  sky: "bg-[linear-gradient(135deg,#bae6fd,#e0f2fe_45%,#fef3c7)]",
  lime: "bg-lime-100",
  scene:
    "bg-[#0b1220] bg-[radial-gradient(circle_at_18%_30%,#0f766e_0,transparent_45%),radial-gradient(circle_at_85%_75%,#c2410c_0,transparent_42%),radial-gradient(circle_at_60%_10%,#1d4ed8_0,transparent_40%)]",
};

/* ---------- page ---------- */
const FAMILY_KEYS = Object.keys(FAMILIES) as FamilyKey[];

export default function CssButtonStylesCollection() {
  const [family, setFamily] = useState<FamilyKey | "all">("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styleSheet = useMemo(
    () =>
      scope(BASE, ".cbs-b", "cbs") +
      "\n" +
      scope(BASE, ".cbs-g button", "cbs") +
      "\n" +
      ALL.map((it, i) => scope(it.css, `.cbs-i${i}`, `cbs${i}`)).join("\n"),
    [],
  );

  const indexed = useMemo(() => ALL.map((it, i) => ({ it, i })), []);
  const q = query.trim().toLowerCase();
  const visible = indexed.filter(
    ({ it }) => (family === "all" || it.f === family) && (!q || `${it.name} ${FAMILIES[it.f]}`.toLowerCase().includes(q)),
  );
  const groups = FAMILY_KEYS.map((f) => ({ f, list: visible.filter((v) => v.it.f === f) })).filter((g) => g.list.length);

  async function copy(i: number) {
    const text = snippetFor(ALL[i]);
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) setOpen(i);
    setCopied(ok ? i : null);
    setAnnounce(ok ? `${ALL[i].name} CSS copied` : "Copy was blocked, the code is shown so you can select it");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  }

  function onStageClick(e: MouseEvent<HTMLDivElement>) {
    const b = (e.target as HTMLElement).closest("button");
    if (!b) return;
    const group = b.closest("[data-exclusive]");
    if (group) {
      group.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      return;
    }
    if (b.hasAttribute("aria-pressed")) b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
    if (b.hasAttribute("aria-busy")) b.setAttribute("aria-busy", String(b.getAttribute("aria-busy") !== "true"));
  }

  const chip =
    "inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f6f3]";

  return (
    <section
      className="bg-[#f7f6f3] px-4 py-12 text-[#16181d] sm:px-8 sm:py-16"
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}
    >
      <style>{styleSheet}</style>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">Pure CSS · copy and paste</p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">
              {ALL.length} CSS button styles you can copy
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone-600">
              Every button is plain HTML and one small block of CSS. Press Copy CSS and paste it into any page, framework or component.
            </p>
          </div>
          <dl className="flex gap-8 font-mono text-[12px] text-stone-600">
            <div>
              <dt className="uppercase tracking-[0.14em]">Buttons</dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#16181d]">{ALL.length}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.14em]">Families</dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#16181d]">{FAMILY_KEYS.length}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.14em]">JavaScript</dt>
              <dd className="mt-1 text-[22px] font-semibold tracking-tight text-[#16181d]">None</dd>
            </div>
          </dl>
        </header>

        <div className="mt-8 flex flex-col gap-3 border-y border-stone-300/70 py-4 lg:flex-row lg:items-center">
          <label htmlFor="cbs-search" className="sr-only">
            Search button styles
          </label>
          <div className="relative lg:w-64 lg:shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500">
              <path d={ICONS.search} />
            </svg>
            <input
              id="cbs-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search styles"
              className="h-10 w-full rounded-full border border-stone-300 bg-white pl-9 pr-4 text-[14px] text-stone-900 placeholder:text-stone-500 focus:border-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by family">
            {(["all", ...FAMILY_KEYS] as const).map((f) => {
              const on = family === f;
              const n = f === "all" ? ALL.length : ALL.filter((it) => it.f === f).length;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFamily(f)}
                  className={`${chip} ${on ? "bg-[#16181d] text-white" : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"}`}
                >
                  {f === "all" ? "All" : FAMILIES[f]}
                  <span className={`font-mono text-[11px] ${on ? "text-stone-300" : "text-stone-500"}`}>{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>

        <div className="mt-6 h-[1040px] overflow-y-auto overscroll-contain rounded-2xl pr-1" tabIndex={0} aria-label="Button styles">
          {groups.length === 0 && (
            <div className="grid h-60 place-items-center rounded-2xl border border-dashed border-stone-300 text-[14px] text-stone-600">
              No style matches "{query}". Try glass, pill or loading.
            </div>
          )}
          {groups.map(({ f, list }) => (
            <div key={f} className="mb-10 last:mb-2">
              <div className="sticky top-0 z-10 flex items-baseline justify-between bg-[#f7f6f3]/95 py-3 backdrop-blur-sm">
                <h3 className="text-[15px] font-semibold tracking-tight">{FAMILIES[f]}</h3>
                <span className="font-mono text-[12px] text-stone-600">{list.length} styles</span>
              </div>
              <ul className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.map(({ it, i }) => {
                  const isOpen = open === i;
                  return (
                    <li key={i} className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(22,24,29,0.04)] ${isOpen ? "col-span-full" : ""}`}>
                      <div className={`relative grid h-36 place-items-center px-4 ${STAGES[it.stage ?? "white"]}`} onClick={onStageClick}>
                        {it.group ? (
                          <div className={`cbs-g cbs-i${i}`} role="group" aria-label={it.aria ?? it.name} {...(it.exclusive ? { "data-exclusive": "" } : {})}>
                            {renderNodes(it.c)}
                          </div>
                        ) : (
                          <button type="button" className={`cbs-b cbs-i${i}`} aria-label={it.aria} aria-pressed={it.pressed} aria-busy={it.busy}>
                            {renderNodes(it.c)}
                          </button>
                        )}
                        <span className={`absolute left-3 top-3 font-mono text-[11px] ${it.stage === "ink" || it.stage === "scene" ? "text-slate-400" : "text-stone-500"}`}>
                          {String(i + 1).padStart(3, "0")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 border-t border-stone-200 px-3 py-2.5">
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-stone-800">{it.name}</span>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={`cbs-code-${i}`}
                          aria-label={`${isOpen ? "Hide" : "Show"} code for ${it.name}`}
                          onClick={() => setOpen(isOpen ? null : i)}
                          className="grid h-9 w-9 place-items-center rounded-lg text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                            <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => copy(i)}
                          aria-label={`Copy CSS for ${it.name}`}
                          className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${
                            copied === i ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-900 hover:bg-stone-200"
                          }`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                            <path d={copied === i ? ICONS.check : "M9 9h11v11H9zM5 15H4V4h11v1"} />
                          </svg>
                          {copied === i ? "Copied" : "Copy CSS"}
                        </button>
                      </div>
                      {isOpen && (
                        <pre
                          id={`cbs-code-${i}`}
                          tabIndex={0}
                          className="max-h-80 overflow-auto whitespace-pre-wrap break-words border-t border-stone-800 bg-[#111318] p-4 font-mono text-[11.5px] leading-[1.65] text-slate-200"
                        >
                          <code>{snippetFor(it)}</code>
                        </pre>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
