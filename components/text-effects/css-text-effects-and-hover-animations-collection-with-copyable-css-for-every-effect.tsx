import { createElement, useMemo, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

/*
  CSS text effects and hover animations.
  Each effect is plain HTML plus CSS written with "&" standing for the element with class "fx" and
  "K-" as the prefix for its keyframes. The page scopes every effect to its own wrapper
  (.cfx-i0 .fx, .cfx-i1 .fx ...) and Copy CSS rewrites the same rules to a plain ".fx" class, so
  the snippet is exactly what the tile shows. Every snippet ends with a reduced motion rule, and
  every animation is written so that switching it off leaves the finished, readable state.
*/

const FAMILIES = {
  gradient: "Gradient text",
  outline: "Outlined text",
  shadow: "Shadow and 3D",
  reveal: "Reveal and typewriter",
  underline: "Underline hovers",
  link: "Link hovers",
  image: "Image hovers",
  card: "Card lift and tilt",
  letters: "Letter animations",
  highlight: "Highlight markers",
  motion: "Subtle motion",
} as const;
type FamilyKey = keyof typeof FAMILIES;
type Stage = "white" | "paper" | "ink" | "night";

type Item = {
  f: FamilyKey;
  name: string;
  html: string;
  css: string;
  stage?: Stage;
  /** one-shot animation: the tile gets a Replay button */
  once?: boolean;
};

/* ---------- shared pieces ---------- */
const FONT = `"Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
const HEAD = `font-family: ${FONT}; font-size: 36px; font-weight: 800; line-height: 1.05; letter-spacing: -0.03em; margin: 0;`;
/* Strokes look cleanest on a static (non-variable) heavy font, which has no overlapping contours. */
const STATIC = `font-family: "Arial Black", "Helvetica Neue", Arial, sans-serif; font-weight: 900;`;
const LINK = `font-family: ${FONT}; font-size: 20px; font-weight: 600; color: #16181d; text-decoration: none; position: relative; display: inline-block; isolation: isolate;`;
const FOCUS = `&:focus-visible { outline: 2px solid #2563eb; outline-offset: 4px; border-radius: 4px; }`;
const SR = `& .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
& [aria-hidden] > span { display: inline-block; }`;
const RM = `@media (prefers-reduced-motion: reduce) {
  &, & *, &::before, &::after, & *::before, & *::after { animation: none !important; transition: none !important; }
}`;

/** Splits a word into letter spans with an --i index, keeping one readable copy for screen readers. */
const L = (w: string) =>
  `<span class="sr">${w}</span><span aria-hidden="true">${[...w]
    .map((ch, i) => `<span style="--i:${i}">${ch === " " ? "&nbsp;" : ch}</span>`)
    .join("")}</span>`;
/** Same for words. */
const W = (s: string) =>
  `<span class="sr">${s}</span><span aria-hidden="true">${s
    .split(" ")
    .map((w, i) => `<span style="--i:${i}">${w}</span>`)
    .join(" ")}</span>`;

const steps = (n: number, fn: (k: number) => string) => Array.from({ length: n }, (_, k) => fn(k + 1)).join(", ");

/* A painted landscape so image hovers work without a photo. Swap it for url(your-photo.jpg) center / cover. */
const PHOTO = `radial-gradient(circle at 72% 30%, #fde68a 0 9%, transparent 10%), linear-gradient(170deg, transparent 55%, #365314 56%), linear-gradient(195deg, transparent 48%, #4d7c0f 49%), linear-gradient(#fdba74, #fb923c 40%, #c2410c 70%)`;
const IMG = `& .fx-img { display: block; width: 100%; height: 100%; background: ${PHOTO}; background-size: cover; /* swap for url(your-photo.jpg) center / cover */ }`;
const FIG = (cap: string, extra = "") =>
  `<a class="fx" href="#"><span class="fx-img" role="img" aria-label="Orange sunset over green hills"></span>${extra}<span class="fx-cap">${cap}</span></a>`;
const FIGBASE = `& { display: block; position: relative; width: 220px; height: 140px; overflow: hidden; border-radius: 14px; text-decoration: none; font-family: ${FONT}; color: #fff; }
${FOCUS}
${IMG}
& .fx-cap { position: absolute; left: 14px; bottom: 12px; font-size: 15px; font-weight: 700; text-shadow: 0 1px 8px rgba(0,0,0,.45); }`;

const CARD = (title: string, body: string, extra = "") =>
  `<a class="fx" href="#">${extra}<span class="fx-title">${title}</span><span class="fx-body">${body}</span></a>`;
const CARDBASE = `& { display: block; width: 220px; padding: 20px; border-radius: 16px; background: #fff; color: #16181d; text-decoration: none; font-family: ${FONT}; border: 1px solid #e7e5e4; position: relative; }
${FOCUS}
& .fx-title { display: block; font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
& .fx-body { display: block; margin-top: 6px; font-size: 13.5px; line-height: 1.5; color: #57534e; }`;

/* ---------- the collection ---------- */
const ITEMS: Item[] = [
  // GRADIENT TEXT
  { f: "gradient", name: "Sunset", html: `<p class="fx">Golden hour</p>`, css: `& { ${HEAD} background: linear-gradient(90deg, #f97316, #e11d48); -webkit-background-clip: text; background-clip: text; color: transparent; }` },
  { f: "gradient", name: "Deep water", html: `<p class="fx">Open sea</p>`, css: `& { ${HEAD} background: linear-gradient(180deg, #0ea5e9, #1e3a8a); -webkit-background-clip: text; background-clip: text; color: transparent; }` },
  { f: "gradient", name: "Slow flowing gradient", html: `<p class="fx">Always moving</p>`, css: `& { ${HEAD} background: linear-gradient(90deg, #2563eb, #0d9488, #ca8a04, #2563eb); background-size: 300% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: K-flow 9s linear infinite; }
@keyframes K-flow { to { background-position: 300% 0; } }` },
  { f: "gradient", name: "Brushed silver", html: `<p class="fx">Steel</p>`, stage: "ink", css: `& { ${HEAD} font-size: 44px; background: linear-gradient(180deg, #f8fafc 0%, #cbd5e1 45%, #64748b 50%, #e2e8f0 75%, #94a3b8 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }` },
  { f: "gradient", name: "Gold leaf", html: `<p class="fx">Anniversary</p>`, stage: "night", css: `& { ${HEAD} background: linear-gradient(180deg, #fef3c7 0%, #fbbf24 38%, #92400e 52%, #fcd34d 70%, #b45309 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }` },
  { f: "gradient", name: "Gradient on hover", html: `<a class="fx" href="#">Hover to colour</a>`, css: `& { ${HEAD} font-size: 32px; display: inline-block; text-decoration: none; color: #16181d; background: linear-gradient(90deg, #7c3aed, #db2777) 0 0 / 0% 100% no-repeat, linear-gradient(#16181d, #16181d); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; transition: background-size .5s cubic-bezier(.2,.8,.2,1); }
&:hover, &:focus-visible { background-size: 100% 100%, auto; }
${FOCUS}` },
  { f: "gradient", name: "Hard split duotone", html: `<p class="fx">Half and half</p>`, css: `& { ${HEAD} background: linear-gradient(180deg, #16181d 52%, #2563eb 52%); -webkit-background-clip: text; background-clip: text; color: transparent; }` },
  { f: "gradient", name: "Pinstripe fill", html: `<p class="fx">STRIPES</p>`, css: `& { ${HEAD} font-size: 46px; letter-spacing: 0.02em; background: repeating-linear-gradient(-45deg, #0f766e 0 3px, #99f6e4 3px 6px); -webkit-background-clip: text; background-clip: text; color: transparent; }` },
  { f: "gradient", name: "Spotlight sweep on hover", html: `<a class="fx" href="#">Spotlight</a>`, stage: "ink", css: `& { ${HEAD} font-size: 40px; display: inline-block; text-decoration: none; background: radial-gradient(circle at var(--x, -20%) 50%, #fff 0 18%, #475569 42%); -webkit-background-clip: text; background-clip: text; color: transparent; transition: --x .8s ease; }
@property --x { syntax: "<percentage>"; inherits: false; initial-value: -20%; }
&:hover, &:focus-visible { --x: 120%; }
${FOCUS}` },

  // OUTLINED TEXT
  { f: "outline", name: "Hollow", html: `<p class="fx">Hollow</p>`, css: `& { ${HEAD} ${STATIC} font-size: 46px; color: transparent; -webkit-text-stroke: 1.5px #16181d; }` },
  { f: "outline", name: "Fill on hover", html: `<a class="fx" href="#">Fill me in</a>`, css: `& { ${HEAD} ${STATIC} display: inline-block; text-decoration: none; -webkit-text-stroke: 1.5px #1d4ed8; background: linear-gradient(#1d4ed8, #1d4ed8) 0 0 / 0% 100% no-repeat; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; transition: background-size .55s cubic-bezier(.7,0,.2,1); }
&:hover, &:focus-visible { background-size: 100% 100%; }
${FOCUS}` },
  { f: "outline", name: "Offset shadow outline", html: `<p class="fx">Offset</p>`, css: `& { ${HEAD} ${STATIC} font-size: 46px; color: transparent; -webkit-text-stroke: 1.5px #16181d; text-shadow: 4px 4px 0 #fb923c; }` },
  { f: "outline", name: "Echo layer", html: `<p class="fx" data-text="Echo">Echo</p>`, css: `& { ${HEAD} font-size: 50px; color: #16181d; position: relative; display: inline-block; isolation: isolate; }
&::after { content: attr(data-text); position: absolute; left: 6px; top: 6px; z-index: -1; color: transparent; -webkit-text-stroke: 1.5px #2563eb; }` },
  { f: "outline", name: "Sticker stroke", html: `<p class="fx">Sticker</p>`, stage: "paper", css: `& { ${HEAD} ${STATIC} font-size: 44px; color: #e11d48; -webkit-text-stroke: 8px #fff; paint-order: stroke fill; filter: drop-shadow(0 3px 4px rgba(0,0,0,.18)); }` },
  { f: "outline", name: "Glowing outline", html: `<p class="fx">Late night</p>`, stage: "night", css: `& { ${HEAD} ${STATIC} color: transparent; -webkit-text-stroke: 1.25px #67e8f9; text-shadow: 0 0 12px rgba(103,232,249,.45); }` },
  { f: "outline", name: "Outline to solid wipe", html: `<a class="fx" href="#" data-text="Wipe across">Wipe across</a>`, css: `& { ${HEAD} ${STATIC} font-size: 32px; display: inline-block; position: relative; text-decoration: none; color: transparent; -webkit-text-stroke: 1.25px #16181d; }
&::before { content: attr(data-text); position: absolute; inset: 0; color: #16181d; -webkit-text-stroke: 0; clip-path: inset(0 100% 0 0); transition: clip-path .6s cubic-bezier(.7,0,.2,1); }
&:hover::before, &:focus-visible::before { clip-path: inset(0 0 0 0); }
${FOCUS}` },
  { f: "outline", name: "Stencil on dark", html: `<p class="fx">STENCIL</p>`, stage: "ink", css: `& { ${HEAD} ${STATIC} font-size: 44px; letter-spacing: 0.08em; color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,.85); }` },

  // SHADOW AND 3D
  { f: "shadow", name: "Long shadow", html: `<p class="fx">Long</p>`, stage: "paper", css: `& { ${HEAD} font-size: 52px; letter-spacing: 0.01em; color: #fff7ed; text-shadow: ${steps(10, (k) => `${k}px ${k}px 0 #c2410c`)}; }` },
  { f: "shadow", name: "Retro stack", html: `<p class="fx">Retro</p>`, stage: "paper", css: `& { ${HEAD} font-size: 52px; color: #fef3c7; text-shadow: 3px 3px 0 #f97316, 6px 6px 0 #0d9488, 9px 9px 0 #1e3a8a; }` },
  { f: "shadow", name: "Letterpress", html: `<p class="fx">Letterpress</p>`, stage: "paper", css: `& { ${HEAD} color: #d6d3cd; text-shadow: 0 1px 0 rgba(255,255,255,.9), 0 -1px 0 rgba(0,0,0,.28); }` },
  { f: "shadow", name: "Embossed", html: `<p class="fx">Embossed</p>`, stage: "paper", css: `& { ${HEAD} color: #f4f2ee; text-shadow: -1px -1px 0 rgba(255,255,255,.9), 1px 1px 0 rgba(0,0,0,.18), 2px 2px 6px rgba(0,0,0,.12); }` },
  { f: "shadow", name: "Soft neon", html: `<p class="fx">Open late</p>`, stage: "night", css: `& { ${HEAD} color: #fdf4ff; text-shadow: 0 0 4px #f0abfc, 0 0 14px #d946ef, 0 0 32px rgba(217,70,239,.5); }` },
  { f: "shadow", name: "Extruded block", html: `<p class="fx">BLOCK</p>`, css: `& { ${HEAD} font-size: 50px; color: #3b82f6; text-shadow: ${steps(7, (k) => `0 ${k}px 0 hsl(221 70% ${42 - k * 3}%)`)}, 0 10px 14px rgba(0,0,0,.25); }` },
  { f: "shadow", name: "Lifted soft shadow", html: `<p class="fx">Floating</p>`, css: `& { ${HEAD} color: #16181d; text-shadow: 0 10px 18px rgba(22,24,29,.25); }` },
  { f: "shadow", name: "Anaglyph", html: `<p class="fx">Stereo</p>`, css: `& { ${HEAD} font-size: 46px; color: #16181d; text-shadow: -2px 0 0 rgba(239,68,68,.75), 2px 0 0 rgba(6,182,212,.75); }` },
  { f: "shadow", name: "Lift on hover", html: `<a class="fx" href="#">Pick me up</a>`, css: `& { ${HEAD} font-size: 32px; display: inline-block; text-decoration: none; color: #16181d; text-shadow: 0 0 0 rgba(22,24,29,0); transition: transform .3s cubic-bezier(.2,.8,.2,1), text-shadow .3s ease; }
&:hover, &:focus-visible { transform: translateY(-4px); text-shadow: 0 12px 16px rgba(22,24,29,.22); }
${FOCUS}` },
  { f: "shadow", name: "Candle glow", html: `<p class="fx">Warm light</p>`, stage: "night", css: `& { ${HEAD} color: #fff7ed; text-shadow: 0 0 6px rgba(253,186,116,.9), 0 0 24px rgba(251,146,60,.55), 0 0 48px rgba(194,65,12,.4); }` },

  // REVEAL AND TYPEWRITER
  { f: "reveal", name: "Typewriter", once: true, html: `<p class="fx">Hello, world.</p>`, css: `& { font: 600 24px/1.2 ui-monospace, "SF Mono", Menlo, monospace; margin: 0; width: 13ch; white-space: nowrap; overflow: hidden; border-right: 2px solid #2563eb; animation: K-type 1.8s steps(13) both, K-caret .8s step-end infinite; }
@keyframes K-type { from { width: 0; } }
@keyframes K-caret { 50% { border-color: transparent; } }` },
  { f: "reveal", name: "Slide up from mask", once: true, html: `<p class="fx"><span>Rise up</span></p>`, css: `& { ${HEAD} overflow: hidden; padding-bottom: 4px; }
& span { display: inline-block; animation: K-up .9s cubic-bezier(.2,.8,.2,1) both; }
@keyframes K-up { from { transform: translateY(110%); } }` },
  { f: "reveal", name: "Words fade up", once: true, html: `<p class="fx">${W("One word at a time")}</p>`, css: `& { ${HEAD} font-size: 28px; }
${SR}
& [aria-hidden] > span { animation: K-in .6s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--i) * 120ms); }
@keyframes K-in { from { opacity: 0; transform: translateY(12px); } }` },
  { f: "reveal", name: "Blur in", once: true, html: `<p class="fx">Coming into focus</p>`, css: `& { ${HEAD} font-size: 28px; animation: K-blur 1.1s ease-out both; }
@keyframes K-blur { from { opacity: 0; filter: blur(10px); } }` },
  { f: "reveal", name: "Clip wipe", once: true, html: `<p class="fx">Left to right</p>`, css: `& { ${HEAD} font-size: 32px; animation: K-wipe 1s cubic-bezier(.7,0,.2,1) both; }
@keyframes K-wipe { from { clip-path: inset(0 100% 0 0); } }` },
  { f: "reveal", name: "Tracking in", once: true, html: `<p class="fx">Settle down</p>`, css: `& { ${HEAD} font-size: 32px; animation: K-track 1s cubic-bezier(.2,.8,.2,1) both; }
@keyframes K-track { from { letter-spacing: 0.4em; opacity: 0; } }` },
  { f: "reveal", name: "Block reveal", once: true, html: `<p class="fx"><span>Unveiled</span></p>`, css: `& { ${HEAD} position: relative; display: inline-block; }
& span { animation: K-show 0s .45s both; }
&::after { content: ""; position: absolute; inset: 0; background: #2563eb; transform-origin: left; transform: scaleX(0); animation: K-bar .9s cubic-bezier(.7,0,.2,1) both; }
@keyframes K-show { from { opacity: 0; } }
@keyframes K-bar { 0% { transform: scaleX(0); } 50% { transform: scaleX(1); transform-origin: left; } 50.1% { transform-origin: right; } 100% { transform: scaleX(0); transform-origin: right; } }` },
  { f: "reveal", name: "Pop in", once: true, html: `<p class="fx">Ta-da</p>`, css: `& { ${HEAD} font-size: 46px; display: inline-block; animation: K-pop .6s cubic-bezier(.3,1.5,.5,1) both; }
@keyframes K-pop { from { opacity: 0; transform: scale(.6); } }` },
  { f: "reveal", name: "Letters drop", once: true, html: `<p class="fx">${L("Arrive")}</p>`, css: `& { ${HEAD} font-size: 44px; }
${SR}
& [aria-hidden] > span { animation: K-drop .5s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--i) * 60ms); }
@keyframes K-drop { from { opacity: 0; transform: translateY(-24px); } }` },
  { f: "reveal", name: "Two-line stagger", once: true, html: `<p class="fx"><span>Build it</span><span>this week</span></p>`, css: `& { ${HEAD} font-size: 30px; }
& span { display: block; animation: K-line .8s cubic-bezier(.2,.8,.2,1) both; }
& span + span { color: #2563eb; animation-delay: .15s; }
@keyframes K-line { from { opacity: 0; transform: translateX(-16px); } }` },

  // UNDERLINE HOVERS
  { f: "underline", name: "Slide in from left", html: `<a class="fx" href="#">Read the guide</a>`, css: `& { ${LINK} }
&::after { content: ""; position: absolute; left: 0; right: 0; bottom: -3px; height: 2px; background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform .3s cubic-bezier(.2,.8,.2,1); }
&:hover::after, &:focus-visible::after { transform: scaleX(1); }
${FOCUS}` },
  { f: "underline", name: "Grow from centre", html: `<a class="fx" href="#">Pricing</a>`, css: `& { ${LINK} }
&::after { content: ""; position: absolute; left: 0; right: 0; bottom: -3px; height: 2px; background: #2563eb; transform: scaleX(0); transition: transform .3s ease; }
&:hover::after, &:focus-visible::after { transform: scaleX(1); }
${FOCUS}` },
  { f: "underline", name: "In left, out right", html: `<a class="fx" href="#">Our story</a>`, css: `& { ${LINK} }
&::after { content: ""; position: absolute; left: 0; right: 0; bottom: -3px; height: 2px; background: currentColor; transform: scaleX(0); transform-origin: right; transition: transform .35s cubic-bezier(.7,0,.2,1); }
&:hover::after, &:focus-visible::after { transform: scaleX(1); transform-origin: left; }
${FOCUS}` },
  { f: "underline", name: "Rising highlight", html: `<a class="fx" href="#">See the work</a>`, css: `& { ${LINK} background: linear-gradient(#bfdbfe, #bfdbfe) 0 100% / 100% 3px no-repeat; transition: background-size .3s ease; }
&:hover, &:focus-visible { background-size: 100% 100%; }
${FOCUS}` },
  { f: "underline", name: "Wavy on hover", html: `<a class="fx" href="#">Get in touch</a>`, css: `& { ${LINK} text-decoration: underline; text-decoration-color: transparent; text-decoration-thickness: 1.5px; text-underline-offset: 5px; transition: text-decoration-color .25s ease; }
&:hover, &:focus-visible { text-decoration-style: wavy; text-decoration-color: #e11d48; }
${FOCUS}` },
  { f: "underline", name: "Double line", html: `<a class="fx" href="#">Documentation</a>`, css: `& { ${LINK} }
&::before, &::after { content: ""; position: absolute; left: 0; right: 0; height: 1.5px; background: currentColor; transform: scaleX(0); transition: transform .3s ease; }
&::before { bottom: -2px; transform-origin: left; }
&::after { bottom: -6px; transform-origin: right; transition-delay: .06s; }
&:hover::before, &:hover::after, &:focus-visible::before, &:focus-visible::after { transform: scaleX(1); }
${FOCUS}` },
  { f: "underline", name: "Gradient bar", html: `<a class="fx" href="#">New this month</a>`, css: `& { ${LINK} background: linear-gradient(90deg, #f97316, #e11d48) 0 100% / 0% 3px no-repeat; padding-bottom: 4px; transition: background-size .4s cubic-bezier(.2,.8,.2,1); }
&:hover, &:focus-visible { background-size: 100% 3px; }
${FOCUS}` },
  { f: "underline", name: "Dotted to solid", html: `<a class="fx" href="#">Terms of use</a>`, css: `& { ${LINK} text-decoration: underline dotted; text-decoration-thickness: 2px; text-underline-offset: 5px; text-decoration-color: #a8a29e; transition: text-decoration-color .2s ease; }
&:hover, &:focus-visible { text-decoration-style: solid; text-decoration-color: #16181d; }
${FOCUS}` },
  { f: "underline", name: "Offset tightens", html: `<a class="fx" href="#">Careers</a>`, css: `& { ${LINK} text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 8px; text-decoration-color: #a8a29e; transition: text-underline-offset .25s ease, text-decoration-thickness .25s ease, text-decoration-color .25s ease; }
&:hover, &:focus-visible { text-underline-offset: 3px; text-decoration-thickness: 3px; text-decoration-color: #2563eb; }
${FOCUS}` },
  { f: "underline", name: "Thick to thin", html: `<a class="fx" href="#">Book a call</a>`, css: `& { ${LINK} }
&::after { content: ""; position: absolute; left: 0; right: 0; bottom: -4px; height: 6px; background: #fde047; z-index: -1; transition: height .25s ease, bottom .25s ease; }
&:hover::after, &:focus-visible::after { height: 2px; bottom: -3px; background: #16181d; }
${FOCUS}` },

  // LINK HOVERS
  { f: "link", name: "Colour slides through", html: `<a class="fx" href="#">Explore features</a>`, css: `& { ${LINK} background: linear-gradient(90deg, #2563eb 50%, #16181d 50%) 100% 0 / 200% 100%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; transition: background-position .45s cubic-bezier(.7,0,.2,1); }
&:hover, &:focus-visible { background-position: 0 0; }
${FOCUS}` },
  { f: "link", name: "Strike through", html: `<a class="fx" href="#">Old price</a>`, css: `& { ${LINK} }
&::after { content: ""; position: absolute; left: -2px; right: -2px; top: 52%; height: 2px; background: #e11d48; transform: scaleX(0); transform-origin: left; transition: transform .3s ease; }
&:hover::after, &:focus-visible::after { transform: scaleX(1); }
${FOCUS}` },
  { f: "link", name: "Brackets appear", html: `<a class="fx" href="#">Menu</a>`, css: `& { ${LINK} font-family: ui-monospace, "SF Mono", Menlo, monospace; }
&::before, &::after { position: absolute; opacity: 0; color: #2563eb; transition: opacity .2s ease, transform .25s cubic-bezier(.2,.8,.2,1); }
&::before { content: "["; left: -14px; transform: translateX(6px); }
&::after { content: "]"; right: -14px; transform: translateX(-6px); }
&:hover::before, &:hover::after, &:focus-visible::before, &:focus-visible::after { opacity: 1; transform: none; }
${FOCUS}` },
  { f: "link", name: "Arrow nudges in", html: `<a class="fx" href="#">Next chapter <span aria-hidden="true">&rarr;</span></a>`, css: `& { ${LINK} }
& span { display: inline-block; opacity: 0; transform: translateX(-8px); transition: opacity .2s ease, transform .25s cubic-bezier(.2,.8,.2,1); }
&:hover span, &:focus-visible span { opacity: 1; transform: translateX(2px); }
${FOCUS}` },
  { f: "link", name: "Roll over", html: `<a class="fx" href="#"><span data-text="Contact us">Contact us</span></a>`, css: `& { ${LINK} overflow: hidden; vertical-align: bottom; line-height: 1.3; }
& span { display: inline-block; transition: transform .35s cubic-bezier(.7,0,.2,1); }
& span::after { content: attr(data-text); position: absolute; left: 0; top: 100%; color: #2563eb; }
&:hover span, &:focus-visible span { transform: translateY(-100%); }
${FOCUS}` },
  { f: "link", name: "Spacing opens", html: `<a class="fx" href="#">ABOUT</a>`, css: `& { ${LINK} font-size: 15px; letter-spacing: 0.12em; transition: letter-spacing .35s cubic-bezier(.2,.8,.2,1); }
&:hover, &:focus-visible { letter-spacing: 0.3em; }
${FOCUS}` },
  { f: "link", name: "Pill fills", html: `<a class="fx" href="#">Journal</a>`, css: `& { ${LINK} padding: 6px 14px; border-radius: 999px; transition: background-color .2s ease, color .2s ease; }
&:hover, &:focus-visible { background: #16181d; color: #fff; }
${FOCUS}` },
  { f: "link", name: "Marker swipe", html: `<a class="fx" href="#">Read more</a>`, css: `& { ${LINK} background: linear-gradient(transparent 55%, #fde047 55%) 0 0 / 0% 100% no-repeat; transition: background-size .35s ease; }
&:hover, &:focus-visible { background-size: 100% 100%; }
${FOCUS}` },
  { f: "link", name: "Underline becomes box", html: `<a class="fx" href="#">Support</a>`, css: `& { ${LINK} padding: 2px 6px; background: linear-gradient(#16181d, #16181d) 0 100% / 100% 2px no-repeat; transition: background-size .3s cubic-bezier(.7,0,.2,1), color .3s ease; }
&:hover, &:focus-visible { background-size: 100% 100%; color: #fff; }
${FOCUS}` },

  // IMAGE HOVERS
  { f: "image", name: "Slow zoom", html: FIG("Hill walk"), css: `${FIGBASE}
& .fx-img { transition: transform .8s cubic-bezier(.2,.8,.2,1); }
&:hover .fx-img, &:focus-visible .fx-img { transform: scale(1.08); }` },
  { f: "image", name: "Zoom and tilt", html: FIG("Sunset trail"), css: `${FIGBASE}
& .fx-img { transition: transform .7s cubic-bezier(.2,.8,.2,1); }
&:hover .fx-img, &:focus-visible .fx-img { transform: scale(1.12) rotate(-2deg); }` },
  { f: "image", name: "Grey to colour", html: FIG("Evening"), css: `${FIGBASE}
& .fx-img { filter: grayscale(1) contrast(1.05); transition: filter .5s ease; }
&:hover .fx-img, &:focus-visible .fx-img { filter: none; }` },
  { f: "image", name: "Caption slides up", html: FIG("Valley view <small>12 photos</small>"), css: `${FIGBASE}
& .fx-cap { left: 0; right: 0; bottom: 0; padding: 12px 14px; background: linear-gradient(transparent, rgba(0,0,0,.65)); transform: translateY(100%); transition: transform .35s cubic-bezier(.2,.8,.2,1); }
& .fx-cap small { display: block; font-weight: 500; font-size: 12px; opacity: .85; }
&:hover .fx-cap, &:focus-visible .fx-cap { transform: none; }` },
  { f: "image", name: "Dark overlay with label", html: FIG("View project"), css: `${FIGBASE}
&::after { content: ""; position: absolute; inset: 0; background: rgba(15,23,42,.55); opacity: 0; transition: opacity .3s ease; }
& .fx-cap { z-index: 1; left: 50%; top: 50%; bottom: auto; transform: translate(-50%, -40%); opacity: 0; transition: opacity .3s ease, transform .3s ease; white-space: nowrap; }
&:hover::after, &:focus-visible::after { opacity: 1; }
&:hover .fx-cap, &:focus-visible .fx-cap { opacity: 1; transform: translate(-50%, -50%); }` },
  { f: "image", name: "Pan across", html: FIG("Wide view"), css: `${FIGBASE}
& .fx-img { width: 130%; transition: transform 1.6s ease; }
&:hover .fx-img, &:focus-visible .fx-img { transform: translateX(-23%); }` },
  { f: "image", name: "Shine sweep", html: FIG("New arrival"), css: `${FIGBASE}
&::after { content: ""; position: absolute; top: 0; bottom: 0; left: -60%; width: 40%; background: linear-gradient(100deg, transparent, rgba(255,255,255,.45), transparent); transform: skewX(-12deg); transition: left .7s ease; }
&:hover::after, &:focus-visible::after { left: 130%; }` },
  { f: "image", name: "Inset frame", html: FIG("Gallery"), css: `${FIGBASE}
&::after { content: ""; position: absolute; inset: 0; border: 0 solid rgba(255,255,255,.9); border-radius: inherit; transition: border-width .3s ease; }
&:hover::after, &:focus-visible::after { border-width: 8px; }` },
  { f: "image", name: "Circle reveal", html: FIG("Open", `<span class="fx-dot" aria-hidden="true"></span>`), css: `${FIGBASE}
& .fx-dot { position: absolute; inset: 0; background: #1d4ed8; clip-path: circle(0% at 50% 50%); transition: clip-path .5s cubic-bezier(.7,0,.2,1); }
& .fx-cap { z-index: 1; opacity: 0; transition: opacity .2s ease .15s; }
&:hover .fx-dot, &:focus-visible .fx-dot { clip-path: circle(75% at 50% 50%); }
&:hover .fx-cap, &:focus-visible .fx-cap { opacity: 1; }` },

  // CARD LIFT AND TILT
  { f: "card", name: "Lift and shadow", stage: "paper", html: CARD("Weekly plan", "Pick a day and we hold the slot."), css: `${CARDBASE}
& { transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease; box-shadow: 0 1px 2px rgba(0,0,0,.05); }
&:hover, &:focus-visible { transform: translateY(-6px); box-shadow: 0 18px 30px -12px rgba(22,24,29,.25); }` },
  { f: "card", name: "3D tilt", stage: "paper", html: CARD("Tilted", "Leans back toward you on hover."), css: `${CARDBASE}
& { transform: perspective(700px); transition: transform .45s cubic-bezier(.2,.8,.2,1), box-shadow .45s ease; }
&:hover, &:focus-visible { transform: perspective(700px) rotateX(8deg) rotateY(-10deg) translateY(-4px); box-shadow: 14px 20px 30px -14px rgba(22,24,29,.3); }` },
  { f: "card", name: "Gradient border", stage: "paper", html: CARD("Featured", "A ring of colour wakes up."), css: `${CARDBASE}
& { border: 2px solid transparent; background: linear-gradient(#fff, #fff) padding-box, linear-gradient(135deg, #e7e5e4, #e7e5e4) border-box; transition: background .3s ease; }
&:hover, &:focus-visible { background: linear-gradient(#fff, #fff) padding-box, linear-gradient(135deg, #2563eb, #0d9488, #ca8a04) border-box; }` },
  { f: "card", name: "Accent bar grows", stage: "paper", html: CARD("Case study", "A line runs along the top edge."), css: `${CARDBASE}
& { overflow: hidden; }
&::before { content: ""; position: absolute; left: 0; top: 0; height: 3px; width: 100%; background: #2563eb; transform: scaleX(0); transform-origin: left; transition: transform .4s cubic-bezier(.2,.8,.2,1); }
&:hover::before, &:focus-visible::before { transform: scaleX(1); }` },
  { f: "card", name: "Stacked sheets", stage: "paper", html: CARD("Drafts", "The pile fans out behind."), css: `${CARDBASE}
&::before, &::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: #fff; border: 1px solid #e7e5e4; z-index: -1; transition: transform .35s cubic-bezier(.2,.8,.2,1); }
& { isolation: isolate; }
&:hover::before, &:focus-visible::before { transform: rotate(-4deg) translate(-6px, 2px); }
&:hover::after, &:focus-visible::after { transform: rotate(3deg) translate(6px, 4px); }` },
  { f: "card", name: "Flip to back", stage: "paper", html: `<a class="fx" href="#"><span class="fx-face">Front side</span><span class="fx-face fx-back">Back side, with the detail</span></a>`, css: `& { display: grid; width: 220px; height: 120px; perspective: 800px; text-decoration: none; font-family: ${FONT}; font-weight: 700; color: #16181d; }
${FOCUS}
& .fx-face { grid-area: 1 / 1; display: grid; place-items: center; padding: 16px; text-align: center; border-radius: 16px; background: #fff; border: 1px solid #e7e5e4; backface-visibility: hidden; transition: transform .6s cubic-bezier(.2,.8,.2,1); }
& .fx-back { background: #16181d; color: #fff; transform: rotateY(180deg); }
&:hover .fx-face, &:focus-visible .fx-face { transform: rotateY(-180deg); }
&:hover .fx-back, &:focus-visible .fx-back { transform: rotateY(0); }` },
  { f: "card", name: "Press in", stage: "paper", html: CARD("Tap target", "Sinks slightly when pressed."), css: `${CARDBASE}
& { box-shadow: 0 6px 16px -8px rgba(22,24,29,.25); transition: transform .12s ease, box-shadow .12s ease; }
&:hover { box-shadow: 0 10px 22px -10px rgba(22,24,29,.3); }
&:active { transform: scale(.97); box-shadow: 0 2px 6px -2px rgba(22,24,29,.25); }` },
  { f: "card", name: "Top light", stage: "ink", html: CARD("Night mode", "Light falls on the upper edge."), css: `${CARDBASE}
& { background: #111827; color: #f8fafc; border-color: #1f2937; transition: border-color .3s ease, background .3s ease; }
& .fx-body { color: #94a3b8; }
&:hover, &:focus-visible { border-color: #334155; background: radial-gradient(120% 70% at 50% 0%, #1e293b, #111827 70%); }` },
  { f: "card", name: "Corner fold", stage: "paper", html: CARD("Notes", "The corner turns down."), css: `${CARDBASE}
&::after { content: ""; position: absolute; right: -1px; top: -1px; width: 0; height: 0; border-radius: 0 16px 0 6px; background: linear-gradient(225deg, #f4f2ee 50%, #d6d3d1 50%); transition: width .3s ease, height .3s ease; }
&:hover::after, &:focus-visible::after { width: 34px; height: 34px; }` },

  // LETTER ANIMATIONS
  { f: "letters", name: "Gentle wave", html: `<p class="fx">${L("Wavelength")}</p>`, css: `& { ${HEAD} font-size: 34px; }
${SR}
& [aria-hidden] > span { animation: K-wave 2.4s ease-in-out infinite; animation-delay: calc(var(--i) * 90ms); }
@keyframes K-wave { 0%, 60%, 100% { transform: none; } 30% { transform: translateY(-6px); } }` },
  { f: "letters", name: "Hop on hover", html: `<a class="fx" href="#">${L("Bouncy")}</a>`, css: `& { ${HEAD} font-size: 40px; text-decoration: none; color: #16181d; display: inline-block; }
${SR}
${FOCUS}
& [aria-hidden] > span { transition: transform .35s cubic-bezier(.3,1.6,.5,1); transition-delay: calc(var(--i) * 35ms); }
&:hover [aria-hidden] > span, &:focus-visible [aria-hidden] > span { transform: translateY(-8px); }` },
  { f: "letters", name: "Colour cascade", html: `<a class="fx" href="#">${L("Cascade")}</a>`, css: `& { ${HEAD} font-size: 40px; text-decoration: none; color: #16181d; display: inline-block; }
${SR}
${FOCUS}
& [aria-hidden] > span { transition: color .25s ease; transition-delay: calc(var(--i) * 45ms); }
&:hover [aria-hidden] > span, &:focus-visible [aria-hidden] > span { color: #0d9488; }` },
  { f: "letters", name: "Flip letters", html: `<a class="fx" href="#">${L("Flipped")}</a>`, css: `& { ${HEAD} font-size: 40px; text-decoration: none; color: #16181d; display: inline-block; perspective: 400px; }
${SR}
${FOCUS}
& [aria-hidden] > span { transition: transform .5s cubic-bezier(.2,.8,.2,1); transition-delay: calc(var(--i) * 40ms); }
&:hover [aria-hidden] > span, &:focus-visible [aria-hidden] > span { transform: rotateX(360deg); }` },
  { f: "letters", name: "Spread apart", html: `<a class="fx" href="#">${L("Spread")}</a>`, css: `& { ${HEAD} font-size: 40px; text-decoration: none; color: #16181d; display: inline-block; }
${SR}
${FOCUS}
& [aria-hidden] > span { transition: transform .4s cubic-bezier(.2,.8,.2,1); }
&:hover [aria-hidden] > span, &:focus-visible [aria-hidden] > span { transform: translateX(calc((var(--i) - 2.5) * 3px)); }` },
  { f: "letters", name: "Squash per letter", html: `<p class="fx">${L("Squishy")}</p>`, css: `& { ${HEAD} font-size: 40px; }
${SR}
& [aria-hidden] > span { transition: transform .3s cubic-bezier(.3,1.6,.5,1); transform-origin: bottom; }
& [aria-hidden] > span:hover { transform: scale(1.25, .8); }` },
  { f: "letters", name: "Stretch tall", html: `<a class="fx" href="#">${L("Taller")}</a>`, css: `& { ${HEAD} font-size: 36px; text-decoration: none; color: #16181d; display: inline-block; }
${SR}
${FOCUS}
& [aria-hidden] > span { transform-origin: bottom; transition: transform .4s cubic-bezier(.2,.8,.2,1); transition-delay: calc(var(--i) * 30ms); }
&:hover [aria-hidden] > span, &:focus-visible [aria-hidden] > span { transform: scaleY(1.35); }` },
  { f: "letters", name: "Soft pulse", html: `<p class="fx">${L("Breathing")}</p>`, css: `& { ${HEAD} font-size: 34px; color: #1d4ed8; }
${SR}
& [aria-hidden] > span { animation: K-pulse 2.6s ease-in-out infinite; animation-delay: calc(var(--i) * 140ms); }
@keyframes K-pulse { 50% { opacity: .35; } }` },
  { f: "letters", name: "Tilt one by one", html: `<a class="fx" href="#">${L("Domino")}</a>`, css: `& { ${HEAD} font-size: 40px; text-decoration: none; color: #16181d; display: inline-block; }
${SR}
${FOCUS}
& [aria-hidden] > span { transform-origin: bottom left; transition: transform .3s ease; transition-delay: calc(var(--i) * 50ms); }
&:hover [aria-hidden] > span, &:focus-visible [aria-hidden] > span { transform: rotate(-8deg); }` },
  { f: "letters", name: "Swap colours", html: `<p class="fx">${L("Alternate")}</p>`, css: `& { ${HEAD} font-size: 34px; }
${SR}
& [aria-hidden] > span:nth-child(odd) { color: #c2410c; }
& [aria-hidden] > span:nth-child(even) { color: #0f766e; }` },

  // HIGHLIGHT MARKERS
  { f: "highlight", name: "Marker swipe in", once: true, html: `<p class="fx">Ship it <mark>this week</mark></p>`, css: `& { ${HEAD} font-size: 28px; }
& mark { color: inherit; background: linear-gradient(transparent 40%, #fde047 40%, #fde047 88%, transparent 88%) 0 0 / 100% 100% no-repeat; animation: K-mark 1s .3s cubic-bezier(.7,0,.2,1) both; }
@keyframes K-mark { from { background-size: 0% 100%; } }` },
  { f: "highlight", name: "Skewed block", html: `<p class="fx">A <mark>bold</mark> claim</p>`, css: `& { ${HEAD} font-size: 30px; }
& mark { color: #fff; background: none; position: relative; padding: 0 6px; z-index: 0; }
& mark::before { content: ""; position: absolute; inset: 2px 0; background: #e11d48; transform: skewX(-10deg); z-index: -1; border-radius: 3px; }` },
  { f: "highlight", name: "Half-height marker", html: `<p class="fx">Quiet <mark>emphasis</mark></p>`, css: `& { ${HEAD} font-size: 28px; }
& mark { color: inherit; background: linear-gradient(transparent 62%, #a7f3d0 62%); }` },
  { f: "highlight", name: "Rounded chip", html: `<p class="fx">Now in <mark>beta</mark></p>`, css: `& { ${HEAD} font-size: 28px; }
& mark { color: #1e40af; background: #dbeafe; padding: 0 .3em; border-radius: .4em; }` },
  { f: "highlight", name: "Hand drawn", html: `<p class="fx">Feels <mark>handmade</mark></p>`, stage: "paper", css: `& { ${HEAD} font-size: 28px; }
& mark { color: inherit; background: rgba(251,146,60,.45); padding: 0 .25em; border-radius: 0.8em 0.3em 0.9em 0.2em / 0.3em 0.9em 0.2em 0.8em; }` },
  { f: "highlight", name: "Circled word", once: true, html: `<p class="fx">This one <mark>matters</mark></p>`, css: `& { ${HEAD} font-size: 28px; }
& mark { color: inherit; background: none; position: relative; }
& mark::after { content: ""; position: absolute; inset: -6px -10px; border: 2.5px solid #e11d48; border-radius: 50%; transform: rotate(-3deg); animation: K-ring .6s .3s cubic-bezier(.2,.8,.2,1) both; }
@keyframes K-ring { from { opacity: 0; transform: rotate(-3deg) scale(.6); } }` },
  { f: "highlight", name: "Multi-line highlight", html: `<p class="fx"><mark>Highlights that wrap across lines stay tidy</mark></p>`, css: `& { font-family: ${FONT}; font-size: 20px; font-weight: 600; line-height: 1.6; max-width: 220px; margin: 0; }
& mark { color: inherit; background: #fef08a; padding: 0.1em 0.3em; -webkit-box-decoration-break: clone; box-decoration-break: clone; border-radius: 4px; }` },
  { f: "highlight", name: "Strike and replace", html: `<p class="fx"><s>slow</s> <ins>fast</ins> setup</p>`, css: `& { ${HEAD} font-size: 30px; }
& s { color: #a8a29e; text-decoration-thickness: 3px; text-decoration-color: #e11d48; }
& ins { text-decoration: none; color: #047857; }` },
  { f: "highlight", name: "Marker on hover", html: `<a class="fx" href="#">Hover to <mark>mark it</mark></a>`, css: `& { ${HEAD} font-size: 28px; text-decoration: none; color: #16181d; }
${FOCUS}
& mark { color: inherit; background: linear-gradient(104deg, rgba(253,224,71,0) 0.9%, #fde047 2.4%, #fde047 95%, rgba(253,224,71,0) 98%) 0 0 / 0% 100% no-repeat; transition: background-size .45s cubic-bezier(.7,0,.2,1); }
&:hover mark, &:focus-visible mark { background-size: 100% 100%; }` },

  // SUBTLE MOTION
  { f: "motion", name: "Shimmer", html: `<p class="fx">Loading results</p>`, css: `& { ${HEAD} font-size: 26px; background: linear-gradient(90deg, #a8a29e 40%, #16181d 50%, #a8a29e 60%) 0 0 / 300% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: K-shine 2.4s linear infinite; }
@keyframes K-shine { from { background-position: 100% 0; } to { background-position: 0 0; } }` },
  { f: "motion", name: "Breathing", html: `<p class="fx">Listening</p>`, css: `& { ${HEAD} font-size: 34px; animation: K-breathe 3.2s ease-in-out infinite; }
@keyframes K-breathe { 50% { opacity: .45; } }` },
  { f: "motion", name: "Float", html: `<p class="fx">Weightless</p>`, css: `& { ${HEAD} font-size: 34px; display: inline-block; animation: K-float 4s ease-in-out infinite; }
@keyframes K-float { 50% { transform: translateY(-6px); } }` },
  { f: "motion", name: "Rotating words", html: `<p class="fx">Build a <span class="fx-words" aria-hidden="true"><span>shop</span><span>blog</span><span>portfolio</span><span>shop</span></span><span class="sr">shop, blog or portfolio</span></p>`, css: `& { ${HEAD} font-size: 28px; }
${SR}
& .fx-words { display: inline-flex; flex-direction: column; height: 1.15em; overflow: hidden; vertical-align: bottom; color: #2563eb; text-align: left; }
& .fx-words span { display: block; height: 1.15em; animation: K-cycle 6s cubic-bezier(.7,0,.2,1) infinite; }
@keyframes K-cycle { 0%, 28% { transform: none; } 33%, 61% { transform: translateY(-100%); } 66%, 94% { transform: translateY(-200%); } 100% { transform: translateY(-300%); } }` },
  { f: "motion", name: "Blinking caret", html: `<p class="fx">Type here<span aria-hidden="true"></span></p>`, css: `& { ${HEAD} font-size: 30px; }
& span { display: inline-block; width: 3px; height: .9em; margin-left: 4px; vertical-align: -0.08em; background: #2563eb; animation: K-blink 1s step-end infinite; }
@keyframes K-blink { 50% { opacity: 0; } }` },
  { f: "motion", name: "Glow pulse", html: `<p class="fx">On air</p>`, stage: "night", css: `& { ${HEAD} font-size: 40px; color: #fecaca; text-shadow: 0 0 10px rgba(248,113,113,.4); animation: K-glow 2.8s ease-in-out infinite; }
@keyframes K-glow { 50% { text-shadow: 0 0 22px rgba(248,113,113,.8), 0 0 4px #fca5a5; } }` },
  { f: "motion", name: "Marquee strip", html: `<p class="fx"><span class="sr">Free shipping. New arrivals weekly.</span><span class="fx-track" aria-hidden="true"><span>Free shipping · New arrivals weekly · </span><span>Free shipping · New arrivals weekly · </span></span></p>`, css: `${SR}
& { margin: 0; width: 240px; overflow: hidden; font-family: ${FONT}; font-size: 15px; font-weight: 600; color: #16181d; border-block: 1px solid #d6d3d1; padding: 8px 0; mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); }
& .fx-track { display: flex; width: max-content; animation: K-scroll 12s linear infinite; }
& .fx-track span { white-space: pre; }
&:hover .fx-track { animation-play-state: paused; }
@keyframes K-scroll { to { transform: translateX(-50%); } }` },
  { f: "motion", name: "Slow sway", html: `<p class="fx">Easy does it</p>`, css: `& { ${HEAD} font-size: 30px; display: inline-block; transform-origin: 50% 100%; animation: K-sway 5s ease-in-out infinite; }
@keyframes K-sway { 25% { transform: rotate(-1.5deg); } 75% { transform: rotate(1.5deg); } }` },
  { f: "motion", name: "Tracking breathe", html: `<p class="fx">CALM</p>`, css: `& { ${HEAD} font-size: 34px; letter-spacing: 0.1em; animation: K-track 5s ease-in-out infinite; }
@keyframes K-track { 50% { letter-spacing: 0.22em; } }` },
];

/* ---------- second pass: extra variants to fill each family with useful options ---------- */
const MORE: Item[] = [
  { f: "gradient", name: "Mint to lime", html: `<p class="fx">Fresh start</p>`, css: `& { ${HEAD} background: linear-gradient(120deg, #059669, #84cc16); -webkit-background-clip: text; background-clip: text; color: transparent; }` },
  { f: "gradient", name: "Ink to blue on dark", html: `<p class="fx">Midnight</p>`, stage: "ink", css: `& { ${HEAD} font-size: 42px; background: linear-gradient(180deg, #ffffff 30%, #60a5fa); -webkit-background-clip: text; background-clip: text; color: transparent; }` },
  { f: "outline", name: "Thick outline", html: `<p class="fx">Chunky</p>`, stage: "paper", css: `& { ${HEAD} ${STATIC} font-size: 46px; color: #fef3c7; -webkit-text-stroke: 5px #16181d; paint-order: stroke fill; }` },
  { f: "shadow", name: "Hard drop shadow", html: `<p class="fx">Poster</p>`, css: `& { ${HEAD} font-size: 46px; color: #16181d; text-shadow: 4px 4px 0 #facc15; }` },
  { f: "shadow", name: "Inset carved", html: `<p class="fx">Carved</p>`, stage: "ink", css: `& { ${HEAD} font-size: 44px; color: #334155; text-shadow: 0 1px 0 rgba(255,255,255,.18), 0 -1px 0 #000; }` },
  { f: "underline", name: "Underline slides away", html: `<a class="fx" href="#">Blog</a>`, css: `& { ${LINK} }
&::after { content: ""; position: absolute; left: 0; right: 0; bottom: -3px; height: 2px; background: currentColor; transform-origin: right; transition: transform .3s ease; }
&:hover::after, &:focus-visible::after { transform: scaleX(0); }
${FOCUS}` },
  { f: "link", name: "Fade siblings", html: `<nav class="fx" aria-label="Example"><a href="#">Work</a><a href="#">Studio</a><a href="#">Contact</a></nav>`, css: `& { display: flex; gap: 18px; font-family: ${FONT}; font-size: 18px; font-weight: 600; }
& a { color: #16181d; text-decoration: none; transition: opacity .2s ease; }
& a:focus-visible { outline: 2px solid #2563eb; outline-offset: 4px; border-radius: 4px; }
&:hover a:not(:hover) { opacity: .35; }` },
  { f: "image", name: "Blur to sharp", html: FIG("Focus"), css: `${FIGBASE}
& .fx-img { filter: blur(3px) saturate(.8); transform: scale(1.06); transition: filter .5s ease, transform .5s ease; }
&:hover .fx-img, &:focus-visible .fx-img { filter: none; transform: none; }` },
  { f: "card", name: "Icon arrow slides", stage: "paper", html: CARD("Read the docs", "An arrow moves toward the next step.", `<span class="fx-arrow" aria-hidden="true">&rarr;</span>`), css: `${CARDBASE}
& .fx-arrow { position: absolute; right: 18px; top: 18px; font-size: 18px; color: #2563eb; transition: transform .3s cubic-bezier(.2,.8,.2,1); }
&:hover .fx-arrow, &:focus-visible .fx-arrow { transform: translateX(5px); }` },
  { f: "highlight", name: "Underline scribble", html: `<p class="fx">Really <mark>important</mark></p>`, css: `& { ${HEAD} font-size: 28px; }
& mark { color: inherit; background: none; text-decoration: underline wavy #2563eb; text-decoration-thickness: 2px; text-underline-offset: 6px; }` },
];

const ORDER = Object.keys(FAMILIES);
const ALL: Item[] = [...ITEMS, ...MORE].sort((a, b) => ORDER.indexOf(a.f) - ORDER.indexOf(b.f));

const scope = (css: string, sel: string, kf: string) => css.replace(/&/g, sel).replace(/\bK-/g, `${kf}-`);

function snippetFor(it: Item): string {
  return `${it.html}\n\n<style>\n${scope(`${it.css}\n${RM}`, ".fx", "fx")}\n</style>\n`;
}

const STAGES: Record<Stage, string> = {
  white: "bg-white text-[#16181d]",
  paper: "bg-[#f4f2ee] text-[#16181d]",
  ink: "bg-[#0b0f17] text-white",
  night: "bg-[radial-gradient(circle_at_30%_20%,#1e1b4b,#0b0f17_70%)] text-white",
};

const FAMILY_KEYS = Object.keys(FAMILIES) as FamilyKey[];
const COPY_PATH = "M9 9h11v11H9zM5 15H4V4h11v1";
const CHECK_PATH = "M5 12.5l4.5 4.5L19 7";

/* ---------- markup to React (renders our own fixed markup strings without innerHTML) ---------- */
const VOID_TAGS = new Set(["area", "br", "col", "hr", "img", "input", "meta", "link", "source", "wbr"]);
const ATTR_NAMES: Record<string, string> = { class: "className", for: "htmlFor", tabindex: "tabIndex", srcset: "srcSet", readonly: "readOnly", maxlength: "maxLength", colspan: "colSpan", rowspan: "rowSpan", datetime: "dateTime", viewbox: "viewBox", autoplay: "autoPlay", playsinline: "playsInline", crossorigin: "crossOrigin", value: "defaultValue", checked: "defaultChecked" };
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0", rarr: "\u2192", larr: "\u2190", middot: "\u00b7", mdash: "\u2014", ndash: "\u2013", hellip: "\u2026", copy: "\u00a9", times: "\u00d7" };
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITIES[e.toLowerCase()] ?? m,
  );
const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
function styleObject(s: string): Record<string, string> {
  const o: Record<string, string> = {};
  for (const part of s.split(";")) {
    const at = part.indexOf(":");
    if (at < 1) continue;
    const k = part.slice(0, at).trim();
    o[k.startsWith("--") ? k : camel(k)] = part.slice(at + 1).trim();
  }
  return o;
}
function markupProps(attrs: string, key: string): Record<string, unknown> {
  const props: Record<string, unknown> = { key };
  for (const m of attrs.matchAll(/([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    const raw = m[1];
    const val = m[2] ?? m[3] ?? m[4];
    const v = val === undefined ? true : decode(val);
    if (raw === "style" && typeof v === "string") props.style = styleObject(v);
    else if (/^(aria|data)-/.test(raw)) props[raw] = v;
    else props[ATTR_NAMES[raw.toLowerCase()] ?? (raw.includes("-") || raw.includes(":") ? camel(raw.replace(":", "-")) : raw)] = v === true && raw === "inert" ? "" : v;
  }
  return props;
}
function markupToReact(html: string): ReactNode[] {
  const root: ReactNode[] = [];
  const stack: { tag: string; props: Record<string, unknown>; kids: ReactNode[] }[] = [];
  const top = () => (stack.length ? stack[stack.length - 1].kids : root);
  let n = 0;
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+)/g;
  for (const m of html.matchAll(re)) {
    if (m[0].startsWith("<!--")) continue;
    if (m[4] !== undefined) {
      top().push(decode(m[4]));
    } else if (m[1]) {
      const tag = m[1].toLowerCase();
      if (!stack.some((el) => el.tag.toLowerCase() === tag)) continue;
      while (stack.length) {
        const el = stack.pop()!;
        top().push(createElement(el.tag, el.props, ...el.kids));
        if (el.tag.toLowerCase() === tag) break;
      }
    } else if (m[2]) {
      const tag = m[2];
      const selfClose = /\/\s*$/.test(m[3]);
      const props = markupProps(m[3].replace(/\/\s*$/, ""), `m${n++}`);
      if (selfClose || VOID_TAGS.has(tag.toLowerCase())) top().push(createElement(tag, props));
      else stack.push({ tag, props, kids: [] });
    }
  }
  while (stack.length) {
    const el = stack.pop()!;
    top().push(createElement(el.tag, el.props, ...el.kids));
  }
  return root;
}

export default function CssTextEffectsCollection() {
  const [family, setFamily] = useState<FamilyKey | "all">("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [replays, setReplays] = useState<Record<number, number>>({});
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styleSheet = useMemo(() => ALL.map((it, i) => scope(`${it.css}\n${RM}`, `.cfx-i${i} .fx`, `cfx${i}`)).join("\n"), []);

  const q = query.trim().toLowerCase();
  const visible = ALL.map((it, i) => ({ it, i })).filter(
    ({ it }) => (family === "all" || it.f === family) && (!q || `${it.name} ${FAMILIES[it.f]}`.toLowerCase().includes(q)),
  );
  const groups = FAMILY_KEYS.map((f) => ({ f, list: visible.filter((v) => v.it.f === f) })).filter((g) => g.list.length);

  async function copy(i: number) {
    let ok = false;
    try {
      await navigator.clipboard.writeText(snippetFor(ALL[i]));
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

  function replay(i: number) {
    setReplays((r) => ({ ...r, [i]: (r[i] ?? 0) + 1 }));
  }

  /* demo links point at "#": keep the page where it is */
  function onStageClick(e: MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("a")) e.preventDefault();
  }

  const chip =
    "inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f6f3]";
  const iconBtn =
    "grid h-9 w-9 place-items-center rounded-lg text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

  return (
    <section className="bg-[#f7f6f3] px-4 py-12 text-[#16181d] sm:px-8 sm:py-16" style={{ fontFamily: FONT }}>
      <style>{styleSheet}</style>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">Pure CSS · copy and paste</p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">
              {ALL.length} CSS text effects and hover animations
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone-600">
              Gradient and outlined text, shadows, reveals, underline and link hovers, image and card hovers, letter animations and
              highlights. Hover, tab or press Replay to see each one, then copy the HTML and CSS.
            </p>
          </div>
          <dl className="flex gap-8 font-mono text-[12px] text-stone-600">
            <div>
              <dt className="uppercase tracking-[0.14em]">Effects</dt>
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
          <label htmlFor="cfx-search" className="sr-only">
            Search text effects
          </label>
          <div className="relative lg:w-60 lg:shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500">
              <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />
            </svg>
            <input
              id="cfx-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search effects"
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

        <div className="mt-6 h-[1040px] overflow-y-auto overscroll-contain rounded-2xl pr-1" tabIndex={0} aria-label="Text effects">
          {groups.length === 0 && (
            <div className="grid h-60 place-items-center rounded-2xl border border-dashed border-stone-300 px-4 text-center text-[14px] text-stone-600">
              No effect matches "{query}". Try gradient, underline or typewriter.
            </div>
          )}
          {groups.map(({ f, list }) => (
            <div key={f} className="mb-10 last:mb-2">
              <div className="sticky top-0 z-10 flex items-baseline justify-between bg-[#f7f6f3]/95 py-3 backdrop-blur-sm">
                <h3 className="text-[15px] font-semibold tracking-tight">{FAMILIES[f]}</h3>
                <span className="font-mono text-[12px] text-stone-600">{list.length} effects</span>
              </div>
              <ul className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map(({ it, i }) => {
                  const isOpen = open === i;
                  const dark = it.stage === "ink" || it.stage === "night";
                  return (
                    <li key={i} className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(22,24,29,0.04)] ${isOpen ? "col-span-full" : ""}`}>
                      <div className={`relative grid h-48 place-items-center overflow-hidden px-5 text-center ${STAGES[it.stage ?? "white"]}`} onClick={onStageClick}>
                        <div key={replays[i] ?? 0} className={`cfx-i${i}`}>{markupToReact(it.html)}</div>
                        <span className={`absolute left-3 top-3 font-mono text-[11px] ${dark ? "text-slate-400" : "text-stone-500"}`}>{String(i + 1).padStart(3, "0")}</span>
                      </div>
                      <div className="flex items-center gap-1.5 border-t border-stone-200 px-3 py-2.5">
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-stone-800">{it.name}</span>
                        {it.once && (
                          <button type="button" onClick={() => replay(i)} aria-label={`Replay ${it.name}`} className={iconBtn}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                              <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={`cfx-code-${i}`}
                          aria-label={`${isOpen ? "Hide" : "Show"} code for ${it.name}`}
                          onClick={() => setOpen(isOpen ? null : i)}
                          className={iconBtn}
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
                            <path d={copied === i ? CHECK_PATH : COPY_PATH} />
                          </svg>
                          {copied === i ? "Copied" : "Copy CSS"}
                        </button>
                      </div>
                      {isOpen && (
                        <pre
                          id={`cfx-code-${i}`}
                          tabIndex={0}
                          className="max-h-80 overflow-auto whitespace-pre-wrap break-words border-t border-stone-800 bg-[#111318] p-4 text-left font-mono text-[11.5px] leading-[1.65] text-slate-200"
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
