import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

/*
  CSS loaders and spinners collection.
  Every loader is defined once as plain CSS, written with "&" standing for the loader's own
  selector and "K-" as the prefix for its keyframes and private custom properties. The page scopes
  each one to its own class (cl-i0, cl-i1 ...) and the Copy CSS control rewrites the same rules to a
  plain ".loader" class, so what you copy is exactly what you see.
  Colour comes from --loader-color (or the element's own color), so one variable restyles a loader.
*/

type Item = {
  f: FamilyKey;
  name: string;
  css: string;
  /** Number of empty child spans. */
  n?: number;
  /** Text for each child span (used instead of n). */
  t?: string[];
  /** Plain text placed directly inside the loader. */
  text?: string;
};

const FAMILIES = {
  spinners: "Spinners",
  dots: "Dots",
  bars: "Bars",
  pulses: "Pulses",
  progress: "Progress bars",
  skeleton: "Skeleton screens",
  text: "Text loaders",
  morph: "Morphing shapes",
  orbit: "Orbit and motion",
  rings: "Gradient rings",
} as const;
type FamilyKey = keyof typeof FAMILIES;

/* ---------- helpers for writing the CSS ---------- */
const nth = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i)).join("\n");
const mix = (pct: number) => `color-mix(in srgb, currentColor ${pct}%, transparent)`;
const ring = (w: number) =>
  `-webkit-mask: radial-gradient(farthest-side, transparent calc(100% - ${w}px), #000 calc(100% - ${w - 1}px)); mask: radial-gradient(farthest-side, transparent calc(100% - ${w}px), #000 calc(100% - ${w - 1}px));`;
const SPIN = `@keyframes K-spin { to { transform: rotate(360deg); } }`;
const SKEL = `& { color: #94a3b8; display: grid; gap: 10px; width: 240px; --K-a: ${mix(16)}; --K-b: ${mix(32)}; }
& span { display: block; height: 12px; border-radius: 6px; background: linear-gradient(90deg, var(--K-a) 25%, var(--K-b) 37%, var(--K-a) 63%) 0 0 / 400% 100%; animation: K-sh 1.4s ease infinite; }
@keyframes K-sh { from { background-position: 100% 50%; } to { background-position: 0 50%; } }`;

/* ---------- shared base: applied to every loader ---------- */
const BASE = `& {
  color: var(--loader-color, #2563eb);
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  font: 600 15px/1.3 Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}
& *, &::before, &::after, & *::before, & *::after { box-sizing: border-box; }
@media (prefers-reduced-motion: reduce) {
  &, &::before, &::after, & *, & *::before, & *::after { animation: none !important; }
  & { animation: K-calm 1.8s ease-in-out infinite !important; }
  @keyframes K-calm { 50% { opacity: .45; } }
}`;

/* ---------- the collection ---------- */
const ITEMS: Item[] = [
  // SPINNERS
  { f: "spinners", name: "Classic ring", css: `& { width: 40px; height: 40px; border-radius: 50%; border: 4px solid ${mix(20)}; border-top-color: currentColor; animation: K-spin .8s linear infinite; }
${SPIN}` },
  { f: "spinners", name: "Split ring", css: `& { width: 40px; height: 40px; border-radius: 50%; border: 4px solid; border-color: currentColor transparent; animation: K-spin 1s linear infinite; }
${SPIN}` },
  { f: "spinners", name: "Counter rings", css: `& { width: 48px; height: 48px; border-radius: 50%; border: 3px solid transparent; border-top-color: currentColor; border-bottom-color: currentColor; animation: K-spin 1.2s linear infinite; }
&::after { content: ""; position: absolute; inset: 6px; border-radius: 50%; border: 3px solid transparent; border-left-color: currentColor; border-right-color: currentColor; opacity: .55; animation: K-spin .8s linear infinite reverse; }
${SPIN}` },
  { f: "spinners", name: "Dashed wheel", css: `& { width: 44px; height: 44px; border-radius: 50%; border: 3px dashed currentColor; animation: K-spin 2.4s linear infinite; }
${SPIN}` },
  { f: "spinners", name: "Quarter arc", css: `& { width: 44px; height: 44px; border-radius: 50%; background: conic-gradient(currentColor 0 25%, ${mix(15)} 0); ${ring(5)} animation: K-spin .9s linear infinite; }
${SPIN}` },
  { f: "spinners", name: "Fading tail", css: `& { width: 44px; height: 44px; border-radius: 50%; background: conic-gradient(from 0deg, transparent 10%, currentColor); ${ring(5)} animation: K-spin .8s linear infinite; }
${SPIN}` },
  { f: "spinners", name: "Petals", n: 12, css: `& { width: 44px; height: 44px; }
& span { position: absolute; left: 50%; top: 0; width: 4px; height: 12px; margin-left: -2px; border-radius: 2px; background: currentColor; transform-origin: 2px 22px; animation: K-fade 1.2s linear infinite; }
${nth(12, (i) => `& span:nth-child(${i + 1}) { transform: rotate(${i * 30}deg); animation-delay: ${(i * 0.1 - 1.2).toFixed(1)}s; }`)}
@keyframes K-fade { from { opacity: 1; } to { opacity: .15; } }` },
  { f: "spinners", name: "Eased arc", css: `& { width: 42px; height: 42px; border-radius: 50%; border: 4px solid transparent; border-top-color: currentColor; border-right-color: currentColor; animation: K-spin 1.1s cubic-bezier(.55,.15,.45,.85) infinite; }
${SPIN}` },
  { f: "spinners", name: "Clock", css: `& { width: 44px; height: 44px; border-radius: 50%; border: 3px solid currentColor; }
&::before, &::after { content: ""; position: absolute; left: 50%; bottom: 50%; width: 3px; margin-left: -1.5px; border-radius: 2px; background: currentColor; transform-origin: 50% 100%; }
&::before { height: 14px; animation: K-spin 1s linear infinite; }
&::after { height: 9px; animation: K-spin 12s linear infinite; }
${SPIN}` },
  { f: "spinners", name: "Half moon", css: `& { width: 40px; height: 40px; border-radius: 50%; border: 4px solid transparent; border-left-color: currentColor; animation: K-spin .7s linear infinite; }
${SPIN}` },
  { f: "spinners", name: "Three tone", css: `& { width: 42px; height: 42px; border-radius: 50%; border: 4px solid transparent; border-top-color: currentColor; border-left-color: ${mix(60)}; border-bottom-color: ${mix(25)}; animation: K-spin 1s linear infinite; }
${SPIN}` },
  { f: "spinners", name: "Ticking square", css: `& { width: 34px; height: 34px; border: 4px solid currentColor; border-radius: 6px; border-right-color: ${mix(25)}; animation: K-tick 2s cubic-bezier(.7,0,.3,1) infinite; }
@keyframes K-tick { 0%, 10% { transform: rotate(0); } 25%, 35% { transform: rotate(90deg); } 50%, 60% { transform: rotate(180deg); } 75%, 85% { transform: rotate(270deg); } 100% { transform: rotate(360deg); } }` },

  // DOTS
  { f: "dots", name: "Bouncing three", n: 3, css: `& { display: inline-flex; gap: 8px; padding-top: 12px; }
& span { width: 12px; height: 12px; border-radius: 50%; background: currentColor; animation: K-b .9s ease-in-out infinite; }
& span:nth-child(2) { animation-delay: .15s; }
& span:nth-child(3) { animation-delay: .3s; }
@keyframes K-b { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-12px); } }` },
  { f: "dots", name: "Typing", n: 3, css: `& { display: inline-flex; gap: 6px; padding: 12px 16px; border-radius: 18px; background: ${mix(12)}; }
& span { width: 9px; height: 9px; border-radius: 50%; background: currentColor; opacity: .25; animation: K-t 1.2s ease-in-out infinite; }
& span:nth-child(2) { animation-delay: .2s; }
& span:nth-child(3) { animation-delay: .4s; }
@keyframes K-t { 0%, 60%, 100% { opacity: .25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }` },
  { f: "dots", name: "Grow three", n: 3, css: `& { display: inline-flex; gap: 6px; }
& span { width: 14px; height: 14px; border-radius: 50%; background: currentColor; animation: K-g 1.4s ease-in-out infinite both; }
& span:nth-child(1) { animation-delay: -.32s; }
& span:nth-child(2) { animation-delay: -.16s; }
@keyframes K-g { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }` },
  { f: "dots", name: "Sine wave", n: 5, css: `& { display: inline-flex; gap: 5px; height: 28px; align-items: center; }
& span { width: 8px; height: 8px; border-radius: 50%; background: currentColor; animation: K-w 1s ease-in-out infinite; }
${nth(5, (i) => `& span:nth-child(${i + 1}) { animation-delay: ${(i * 0.1 - 1).toFixed(1)}s; }`)}
@keyframes K-w { 0%, 100% { transform: translateY(8px); } 50% { transform: translateY(-8px); } }` },
  { f: "dots", name: "Dot circle", n: 8, css: `& { width: 44px; height: 44px; }
& span { position: absolute; left: 50%; top: 0; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: currentColor; transform-origin: 4px 22px; animation: K-f 1s linear infinite; }
${nth(8, (i) => `& span:nth-child(${i + 1}) { transform: rotate(${i * 45}deg); animation-delay: ${(i * 0.125 - 1).toFixed(3)}s; }`)}
@keyframes K-f { from { opacity: 1; } to { opacity: .15; } }` },
  { f: "dots", name: "Grid wave", n: 9, css: `& { display: grid; grid-template-columns: repeat(3, 10px); gap: 4px; }
& span { width: 10px; height: 10px; border-radius: 2px; background: currentColor; animation: K-g 1.3s ease-in-out infinite; }
${nth(9, (i) => `& span:nth-child(${i + 1}) { animation-delay: ${((Math.floor(i / 3) + (i % 3)) * 0.1).toFixed(1)}s; }`)}
@keyframes K-g { 0%, 70%, 100% { transform: scale(1); opacity: 1; } 35% { transform: scale(.2); opacity: .3; } }` },
  { f: "dots", name: "Passing light", css: `& { width: 10px; height: 10px; margin: 0 20px; border-radius: 50%; animation: K-p 1.2s linear infinite; }
@keyframes K-p {
  0%, 100% { background: ${mix(25)}; box-shadow: -20px 0 currentColor, 20px 0 ${mix(25)}; }
  33% { background: currentColor; box-shadow: -20px 0 ${mix(25)}, 20px 0 ${mix(25)}; }
  66% { background: ${mix(25)}; box-shadow: -20px 0 ${mix(25)}, 20px 0 currentColor; }
}` },
  { f: "dots", name: "Swap", n: 2, css: `& { width: 46px; height: 16px; }
& span { position: absolute; top: 1px; width: 14px; height: 14px; border-radius: 50%; background: currentColor; animation: K-s 1s ease-in-out infinite; }
& span:nth-child(2) { opacity: .45; animation-direction: reverse; }
@keyframes K-s { 0%, 100% { left: 0; transform: scale(1); } 50% { left: 32px; transform: scale(.75); } }` },
  { f: "dots", name: "Newton cradle", n: 4, css: `& { display: inline-flex; gap: 1px; padding: 0 20px; }
& span { width: 12px; height: 12px; border-radius: 50%; background: currentColor; transform-origin: 50% -22px; }
& span:first-child { animation: K-l 1.2s ease-in-out infinite; }
& span:last-child { animation: K-r 1.2s ease-in-out infinite; }
@keyframes K-l { 0%, 50%, 100% { transform: rotate(0); } 25% { transform: rotate(40deg); } }
@keyframes K-r { 0%, 50%, 100% { transform: rotate(0); } 75% { transform: rotate(-40deg); } }` },
  { f: "dots", name: "Corner chase", n: 4, css: `& { width: 36px; height: 36px; animation: K-spin 1.6s ease-in-out infinite; }
& span { position: absolute; width: 12px; height: 12px; border-radius: 50%; background: currentColor; animation: K-s 1.6s ease-in-out infinite; }
& span:nth-child(1) { top: 0; left: 0; }
& span:nth-child(2) { top: 0; right: 0; opacity: .75; }
& span:nth-child(3) { bottom: 0; right: 0; opacity: .5; }
& span:nth-child(4) { bottom: 0; left: 0; opacity: .3; }
@keyframes K-s { 50% { transform: scale(.6); } }
${SPIN}` },
  { f: "dots", name: "Ellipsis reveal", css: `& { width: 52px; aspect-ratio: 4; background: radial-gradient(circle closest-side, currentColor 90%, transparent) 0 / calc(100% / 3) 100% space; clip-path: inset(0 100% 0 0); animation: K-e 1.2s steps(4) infinite; }
@keyframes K-e { to { clip-path: inset(0 -34% 0 0); } }` },

  // BARS
  { f: "bars", name: "Equalizer", n: 5, css: `& { display: inline-flex; align-items: flex-end; gap: 4px; height: 32px; }
& span { width: 5px; height: 100%; border-radius: 2px; background: currentColor; transform-origin: bottom; animation: K-eq 1s ease-in-out infinite; }
${nth(5, (i) => `& span:nth-child(${i + 1}) { animation-delay: ${[-0.2, -0.55, -0.1, -0.75, -0.4][i]}s; }`)}
@keyframes K-eq { 0%, 100% { transform: scaleY(.25); } 50% { transform: scaleY(1); } }` },
  { f: "bars", name: "Stretch wave", n: 5, css: `& { display: inline-flex; align-items: center; gap: 4px; height: 36px; }
& span { width: 5px; height: 100%; border-radius: 3px; background: currentColor; animation: K-s 1.1s ease-in-out infinite; }
${nth(5, (i) => `& span:nth-child(${i + 1}) { animation-delay: ${(i * 0.1 - 1.1).toFixed(1)}s; }`)}
@keyframes K-s { 0%, 40%, 100% { transform: scaleY(.35); } 20% { transform: scaleY(1); } }` },
  { f: "bars", name: "Ladder", n: 5, css: `& { display: inline-flex; align-items: flex-end; gap: 4px; }
& span { width: 6px; border-radius: 2px; background: currentColor; opacity: .2; animation: K-l 1.25s ease-in-out infinite; }
${nth(5, (i) => `& span:nth-child(${i + 1}) { height: ${8 + i * 6}px; animation-delay: ${(i * 0.15).toFixed(2)}s; }`)}
@keyframes K-l { 0%, 100% { opacity: .2; } 30% { opacity: 1; } }` },
  { f: "bars", name: "Signal", n: 4, css: `& { display: inline-flex; align-items: flex-end; gap: 3px; }
& span { width: 6px; border-radius: 1.5px; background: currentColor; animation: K-s 1.6s steps(1) infinite; }
${nth(4, (i) => `& span:nth-child(${i + 1}) { height: ${8 + i * 6}px; animation-name: K-s${i}; }`)}
${nth(4, (i) => `@keyframes K-s${i} { 0% { opacity: .2; } ${(i + 1) * 20}% { opacity: 1; } 100% { opacity: .2; } }`)}` },
  { f: "bars", name: "Menu lines", n: 3, css: `& { display: inline-flex; flex-direction: column; gap: 5px; width: 40px; }
& span { height: 5px; border-radius: 3px; background: currentColor; transform-origin: left; animation: K-m 1.2s ease-in-out infinite; }
& span:nth-child(2) { animation-delay: .15s; }
& span:nth-child(3) { animation-delay: .3s; }
@keyframes K-m { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(.3); } }` },
  { f: "bars", name: "Battery", css: `& { width: 46px; height: 22px; border: 2.5px solid currentColor; border-radius: 5px; margin-right: 5px; }
&::before { content: ""; position: absolute; inset: 2px; border-radius: 1.5px; background: currentColor; transform-origin: left; animation: K-c 2s steps(4, jump-none) infinite; }
&::after { content: ""; position: absolute; right: -6.5px; top: 50%; width: 3px; height: 8px; margin-top: -4px; border-radius: 0 2px 2px 0; background: currentColor; }
@keyframes K-c { from { transform: scaleX(0); } to { transform: scaleX(1); } }` },
  { f: "bars", name: "Flipping bar", css: `& { width: 6px; height: 36px; border-radius: 3px; background: currentColor; animation: K-f 1.2s cubic-bezier(.7,0,.3,1) infinite; }
@keyframes K-f { to { transform: rotate(180deg); } }` },
  { f: "bars", name: "Piano keys", n: 4, css: `& { display: inline-flex; gap: 4px; padding-top: 8px; }
& span { width: 9px; height: 28px; border-radius: 2px; background: currentColor; opacity: .45; animation: K-p 1.2s ease-in-out infinite; }
${nth(4, (i) => `& span:nth-child(${i + 1}) { animation-delay: ${(i * 0.15).toFixed(2)}s; }`)}
@keyframes K-p { 0%, 40%, 100% { transform: translateY(0); opacity: .45; } 20% { transform: translateY(-8px); opacity: 1; } }` },
  { f: "bars", name: "Growing chart", n: 4, css: `& { display: inline-flex; align-items: flex-end; gap: 5px; height: 34px; padding-bottom: 2px; border-bottom: 2px solid ${mix(35)}; }
& span { width: 7px; border-radius: 2px 2px 0 0; background: currentColor; transform-origin: bottom; animation: K-g 2s ease-out infinite; }
${nth(4, (i) => `& span:nth-child(${i + 1}) { height: ${[14, 26, 18, 30][i]}px; animation-delay: ${(i * 0.15).toFixed(2)}s; }`)}
@keyframes K-g { 0% { transform: scaleY(0); } 35%, 80% { transform: scaleY(1); } 100% { transform: scaleY(0); } }` },
  { f: "bars", name: "Turning cross", n: 2, css: `& { width: 40px; height: 40px; animation: K-spin 2.4s linear infinite; }
& span { position: absolute; left: 50%; top: 2px; width: 5px; height: 36px; margin-left: -2.5px; border-radius: 3px; background: currentColor; animation: K-x 1.2s ease-in-out infinite; }
& span:nth-child(2) { opacity: .5; animation-direction: reverse; }
@keyframes K-x { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(90deg); } }
${SPIN}` },

  // PULSES
  { f: "pulses", name: "Ripple", n: 2, css: `& { width: 48px; height: 48px; }
& span { position: absolute; inset: 0; border: 3px solid currentColor; border-radius: 50%; opacity: 0; animation: K-r 1.6s cubic-bezier(0,.2,.8,1) infinite; }
& span:nth-child(2) { animation-delay: -.8s; }
@keyframes K-r { 0% { transform: scale(0); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }` },
  { f: "pulses", name: "Fading disc", css: `& { width: 40px; height: 40px; border-radius: 50%; background: currentColor; animation: K-p 1s ease-in-out infinite; }
@keyframes K-p { 0% { transform: scale(0); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }` },
  { f: "pulses", name: "Heartbeat", css: `& { width: 30px; height: 30px; border-radius: 50%; background: currentColor; animation: K-h 1.3s ease-in-out infinite; }
@keyframes K-h { 0%, 70%, 100% { transform: scale(1); } 14% { transform: scale(1.25); } 28% { transform: scale(1); } 42% { transform: scale(1.18); } }` },
  { f: "pulses", name: "Radar", css: `& { width: 48px; height: 48px; border-radius: 50%; border: 2px solid ${mix(30)}; overflow: hidden; }
&::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, transparent 70%, ${mix(70)}); animation: K-spin 1.6s linear infinite; }
&::after { content: ""; position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: currentColor; }
${SPIN}` },
  { f: "pulses", name: "Sonar", css: `& { width: 14px; height: 14px; margin: 16px; border-radius: 50%; background: currentColor; animation: K-s 1.5s ease-out infinite; }
@keyframes K-s { 0% { box-shadow: 0 0 0 0 ${mix(55)}; } 100% { box-shadow: 0 0 0 18px transparent; } }` },
  { f: "pulses", name: "Double bounce", n: 2, css: `& { width: 42px; height: 42px; }
& span { position: absolute; inset: 0; border-radius: 50%; background: currentColor; opacity: .55; animation: K-d 2s ease-in-out infinite; }
& span:nth-child(2) { animation-delay: -1s; }
@keyframes K-d { 0%, 100% { transform: scale(0); } 50% { transform: scale(1); } }` },
  { f: "pulses", name: "Breathing tile", css: `& { width: 32px; height: 32px; border-radius: 8px; background: currentColor; animation: K-b 2s ease-in-out infinite; }
@keyframes K-b { 0%, 100% { transform: scale(.7) rotate(0); opacity: .5; } 50% { transform: scale(1) rotate(45deg); opacity: 1; } }` },
  { f: "pulses", name: "Target", n: 3, css: `& { width: 48px; height: 48px; }
& span { position: absolute; border: 3px solid currentColor; border-radius: 50%; opacity: .2; animation: K-t 1.5s ease-in-out infinite; }
& span:nth-child(1) { inset: 16px; }
& span:nth-child(2) { inset: 8px; animation-delay: .2s; }
& span:nth-child(3) { inset: 0; animation-delay: .4s; }
@keyframes K-t { 0%, 60%, 100% { opacity: .2; } 25% { opacity: 1; } }` },
  { f: "pulses", name: "Square echo", n: 2, css: `& { width: 44px; height: 44px; }
& span { position: absolute; inset: 0; border: 3px solid currentColor; border-radius: 6px; opacity: 0; animation: K-e 1.8s ease-out infinite; }
& span:nth-child(2) { animation-delay: -.9s; }
@keyframes K-e { 0% { transform: scale(0) rotate(0); opacity: 1; } 100% { transform: scale(1) rotate(90deg); opacity: 0; } }` },
  { f: "pulses", name: "Soft glow", css: `& { width: 22px; height: 22px; margin: 12px; border-radius: 50%; background: currentColor; animation: K-g 1.6s ease-in-out infinite; }
@keyframes K-g { 0%, 100% { transform: scale(.85); box-shadow: 0 0 0 0 ${mix(40)}; } 50% { transform: scale(1); box-shadow: 0 0 22px 6px ${mix(40)}; } }` },

  // PROGRESS
  { f: "progress", name: "Sliding segment", css: `& { width: 200px; height: 6px; border-radius: 999px; overflow: hidden; background: ${mix(18)}; }
&::before { content: ""; position: absolute; inset: 0; width: 40%; border-radius: inherit; background: currentColor; animation: K-i 1.3s cubic-bezier(.6,0,.4,1) infinite; }
@keyframes K-i { from { transform: translateX(-100%); } to { transform: translateX(250%); } }` },
  { f: "progress", name: "Two speed", css: `& { width: 200px; height: 4px; overflow: hidden; background: ${mix(18)}; }
&::before, &::after { content: ""; position: absolute; top: 0; bottom: 0; background: currentColor; }
&::before { animation: K-a 2.1s cubic-bezier(.65,.815,.735,.395) infinite; }
&::after { animation: K-b 2.1s cubic-bezier(.165,.84,.44,1) 1.15s infinite; }
@keyframes K-a { 0% { left: -35%; right: 100%; } 60%, 100% { left: 100%; right: -90%; } }
@keyframes K-b { 0% { left: -200%; right: 100%; } 60%, 100% { left: 107%; right: -8%; } }` },
  { f: "progress", name: "Candy stripes", css: `& { width: 200px; height: 12px; border-radius: 999px; background-color: currentColor; background-image: repeating-linear-gradient(-45deg, rgba(255,255,255,.3) 0 8px, transparent 8px 16px); background-size: 22.63px 22.63px; animation: K-s .7s linear infinite; }
@keyframes K-s { to { background-position: 22.63px 0; } }` },
  { f: "progress", name: "Grow and shrink", css: `& { width: 200px; height: 3px; background: ${mix(15)}; overflow: hidden; }
&::before { content: ""; position: absolute; inset: 0; background: currentColor; animation: K-g 1.6s ease-in-out infinite; }
@keyframes K-g { 0% { transform: scaleX(0); transform-origin: left; } 50% { transform: scaleX(1); transform-origin: left; } 50.1% { transform-origin: right; } 100% { transform: scaleX(0); transform-origin: right; } }` },
  { f: "progress", name: "Filling loop", css: `& { width: 200px; height: 8px; border-radius: 999px; overflow: hidden; background: ${mix(18)}; }
&::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: currentColor; transform-origin: left; animation: K-f 2.4s ease-in-out infinite; }
@keyframes K-f { 0% { transform: scaleX(0); opacity: 1; } 80% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(1); opacity: 0; } }` },
  { f: "progress", name: "Segments", n: 5, css: `& { display: inline-flex; gap: 4px; }
& span { width: 28px; height: 8px; border-radius: 2px; background: ${mix(20)}; animation: K-s 1.5s ease-in-out infinite; }
${nth(5, (i) => `& span:nth-child(${i + 1}) { animation-delay: ${(i * 0.15).toFixed(2)}s; }`)}
@keyframes K-s { 0%, 60%, 100% { background: ${mix(20)}; } 20% { background: currentColor; } }` },
  { f: "progress", name: "Shimmer track", css: `& { width: 200px; height: 8px; border-radius: 999px; overflow: hidden; background: currentColor; }
&::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent); transform: translateX(-100%); animation: K-s 1.5s ease-in-out infinite; }
@keyframes K-s { to { transform: translateX(100%); } }` },
  { f: "progress", name: "Bouncing pill", css: `& { width: 200px; height: 8px; border-radius: 999px; background: ${mix(18)}; }
&::before { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%; border-radius: inherit; background: currentColor; animation: K-b 1s ease-in-out infinite alternate; }
@keyframes K-b { to { left: 70%; } }` },
  { f: "progress", name: "Marching dashes", css: `& { width: 200px; height: 6px; background: repeating-linear-gradient(90deg, currentColor 0 12px, transparent 12px 20px) 0 0 / 20px 100%; -webkit-mask: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent); mask: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent); animation: K-m .5s linear infinite; }
@keyframes K-m { to { background-position: 20px 0; } }` },
  { f: "progress", name: "Dot on a line", css: `& { width: 200px; height: 12px; }
&::before { content: ""; position: absolute; left: 0; right: 0; top: 5px; height: 2px; border-radius: 1px; background: ${mix(25)}; }
&::after { content: ""; position: absolute; top: 0; left: 0; width: 12px; height: 12px; border-radius: 50%; background: currentColor; animation: K-d 1.4s cubic-bezier(.6,0,.4,1) infinite alternate; }
@keyframes K-d { to { left: calc(100% - 12px); } }` },
  { f: "progress", name: "Ring fill", css: `@property --K-p { syntax: "<percentage>"; inherits: false; initial-value: 0%; }
& { width: 44px; height: 44px; border-radius: 50%; background: conic-gradient(currentColor var(--K-p), ${mix(15)} 0); ${ring(5)} animation: K-p 2s ease-in-out infinite; }
@keyframes K-p { 0% { --K-p: 0%; } 85%, 100% { --K-p: 100%; } }` },

  // SKELETON
  { f: "skeleton", name: "Text lines", n: 3, css: `${SKEL}
& span:nth-child(3) { width: 60%; }` },
  { f: "skeleton", name: "Avatar and name", n: 3, css: `${SKEL}
& { grid-template-columns: 44px 1fr; gap: 8px 12px; }
& span:nth-child(1) { grid-row: span 2; width: 44px; height: 44px; border-radius: 50%; }
& span:nth-child(2) { align-self: end; }
& span:nth-child(3) { width: 60%; height: 10px; }` },
  { f: "skeleton", name: "Card", n: 4, css: `${SKEL}
& { width: 220px; padding: 12px; border: 1px solid ${mix(30)}; border-radius: 14px; }
& span:nth-child(1) { height: 92px; border-radius: 8px; }
& span:nth-child(3) { width: 70%; height: 10px; }
& span:nth-child(4) { width: 90px; height: 28px; border-radius: 999px; margin-top: 4px; }` },
  { f: "skeleton", name: "List rows", n: 6, css: `${SKEL}
& { grid-template-columns: 28px 1fr; gap: 10px; align-items: center; }
& span:nth-child(odd) { width: 28px; height: 28px; border-radius: 50%; }
& span:nth-child(even) { height: 10px; }
& span:nth-child(4) { width: 75%; }
& span:nth-child(6) { width: 55%; }` },
  { f: "skeleton", name: "Profile", n: 3, css: `${SKEL}
& { width: 200px; justify-items: center; }
& span { width: 60%; }
& span:nth-child(1) { width: 64px; height: 64px; border-radius: 50%; margin-bottom: 4px; }
& span:nth-child(3) { width: 40%; height: 10px; }` },
  { f: "skeleton", name: "Pulsing paragraph", n: 4, css: `& { color: #94a3b8; display: grid; gap: 9px; width: 240px; }
& span { display: block; height: 10px; border-radius: 5px; background: ${mix(24)}; animation: K-p 1.6s ease-in-out infinite; }
& span:nth-child(2) { width: 92%; }
& span:nth-child(4) { width: 48%; }
@keyframes K-p { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }` },
  { f: "skeleton", name: "Table", n: 9, css: `${SKEL}
& { grid-template-columns: 2fr 1fr 1fr; gap: 10px; }
& span { height: 10px; }
& span:nth-child(-n+3) { height: 12px; --K-a: ${mix(30)}; --K-b: ${mix(45)}; }` },
  { f: "skeleton", name: "Photo grid", n: 4, css: `${SKEL}
& { width: 176px; grid-template-columns: 1fr 1fr; gap: 8px; }
& span { height: auto; aspect-ratio: 1; border-radius: 10px; }
${nth(4, (i) => `& span:nth-child(${i + 1}) { animation-delay: ${(i * 0.12).toFixed(2)}s; }`)}` },
  { f: "skeleton", name: "Chat thread", n: 3, css: `${SKEL}
& { width: 220px; gap: 8px; }
& span { height: 28px; }
& span:nth-child(1) { width: 66%; border-radius: 14px 14px 14px 4px; }
& span:nth-child(2) { width: 54%; justify-self: end; border-radius: 14px 14px 4px 14px; }
& span:nth-child(3) { width: 44%; border-radius: 14px 14px 14px 4px; }` },
  { f: "skeleton", name: "Article header", n: 4, css: `${SKEL}
& { width: 240px; }
& span:nth-child(1) { height: 18px; width: 85%; }
& span:nth-child(2) { height: 10px; width: 40%; }
& span:nth-child(3) { height: 72px; border-radius: 10px; }` },
  { f: "skeleton", name: "Form", n: 5, css: `${SKEL}
& { width: 220px; gap: 8px; }
& span:nth-child(odd) { height: 9px; width: 32%; }
& span:nth-child(even) { height: 34px; border-radius: 8px; margin-bottom: 4px; }
& span:nth-child(5) { width: 42%; height: 34px; border-radius: 8px; --K-a: ${mix(30)}; --K-b: ${mix(45)}; }` },
  { f: "skeleton", name: "Product tile", n: 4, css: `${SKEL}
& { width: 230px; grid-template-columns: 76px 1fr; gap: 9px 12px; align-items: center; }
& span:nth-child(1) { grid-row: span 3; width: 76px; height: 76px; border-radius: 12px; }
& span:nth-child(3) { width: 60%; height: 10px; }
& span:nth-child(4) { width: 40%; height: 16px; }` },
  { f: "skeleton", name: "Dashboard", n: 6, css: `${SKEL}
& { width: 250px; grid-template-columns: repeat(3, 1fr); gap: 8px; }
& span:nth-child(-n+3) { height: 30px; border-radius: 8px; }
& span:nth-child(4) { grid-column: 1 / -1; height: 50px; border-radius: 8px; }
& span:nth-child(n+5) { grid-column: 1 / -1; height: 9px; }
& span:nth-child(6) { width: 70%; }` },
  { f: "skeleton", name: "Media post card", n: 5, css: `${SKEL}
& { width: 230px; grid-template-columns: 28px 1fr; gap: 7px 10px; padding: 8px; border: 1px solid ${mix(30)}; border-radius: 12px; }
& span:nth-child(1) { grid-column: 1 / -1; height: 46px; border-radius: 6px; }
& span:nth-child(2) { grid-row: span 2; width: 28px; height: 28px; border-radius: 50%; }
& span:nth-child(3) { align-self: end; height: 10px; }
& span:nth-child(4) { width: 55%; height: 8px; }
& span:nth-child(5) { grid-column: 1 / -1; width: 85%; height: 9px; }` },
  { f: "skeleton", name: "Inbox", n: 9, css: `${SKEL}
& { grid-template-columns: 32px 1fr; gap: 6px 12px; }
& span:nth-child(3n+1) { grid-row: span 2; width: 32px; height: 32px; border-radius: 50%; }
& span:nth-child(3n+2) { width: 50%; height: 11px; align-self: end; }
& span:nth-child(3n) { height: 9px; margin-bottom: 8px; }` },
  { f: "skeleton", name: "Table with toolbar", n: 11, css: `${SKEL}
& { width: 250px; grid-template-columns: 2fr 1fr 52px; gap: 12px 10px; align-items: center; }
& span:nth-child(3n) { height: 10px; }
& span:nth-child(3n+1) { width: 80%; height: 10px; }
& span:nth-child(3n+2) { height: 16px; border-radius: 999px; }
& span:nth-child(1) { grid-column: 1 / 3; width: auto; height: 28px; border-radius: 8px; margin-bottom: 4px; }
& span:nth-child(2) { height: 28px; border-radius: 8px; margin-bottom: 4px; }` },
  { f: "skeleton", name: "Profile with cover", n: 4, css: `${SKEL}
& { width: 230px; gap: 8px; }
& span:nth-child(1) { height: 52px; border-radius: 10px; }
& span:nth-child(2) { width: 48px; height: 48px; margin: -30px 0 0 14px; border-radius: 50%; outline: 4px solid var(--loader-bg, #fff); }
& span:nth-child(3) { width: 55%; height: 12px; margin-left: 14px; }
& span:nth-child(4) { width: 35%; height: 9px; margin-left: 14px; }` },
  { f: "skeleton", name: "Article page", n: 6, css: `${SKEL}
& { width: 240px; gap: 7px; }
& span:nth-child(1) { height: 36px; border-radius: 8px; margin-bottom: 2px; }
& span:nth-child(2) { width: 25%; height: 7px; }
& span:nth-child(3) { width: 92%; height: 14px; }
& span:nth-child(4) { width: 58%; height: 14px; margin-bottom: 2px; }
& span:nth-child(n+5) { height: 8px; }
& span:nth-child(6) { width: 72%; }` },
  { f: "skeleton", name: "Chat with avatars", n: 6, css: `${SKEL}
& { width: 230px; grid-template-columns: 26px 1fr; gap: 10px 8px; align-items: end; }
& span:nth-child(odd) { width: 26px; height: 26px; border-radius: 50%; }
& span:nth-child(even) { height: 30px; border-radius: 14px 14px 14px 4px; }
& span:nth-child(2) { width: 78%; }
& span:nth-child(4) { width: 52%; }
& span:nth-child(5) { visibility: hidden; }
& span:nth-child(6) { width: 64%; justify-self: end; border-radius: 14px 14px 4px 14px; --K-a: ${mix(28)}; --K-b: ${mix(42)}; }` },

  // TEXT
  { f: "text", name: "Counting dots", text: "Loading", css: `&::after { content: ""; display: inline-block; width: 1.2em; text-align: left; animation: K-d 1.2s steps(1) infinite; }
@keyframes K-d { 0% { content: ""; } 25% { content: "."; } 50% { content: ".."; } 75% { content: "..."; } }` },
  { f: "text", name: "Letter wave", t: ["L", "o", "a", "d", "i", "n", "g"], css: `& { font-size: 18px; }
& span { display: inline-block; animation: K-w 1.2s ease-in-out infinite; }
${nth(7, (i) => `& span:nth-child(${i + 1}) { animation-delay: ${(i * 0.08).toFixed(2)}s; }`)}
@keyframes K-w { 0%, 40%, 100% { transform: translateY(0); } 20% { transform: translateY(-6px); } }` },
  { f: "text", name: "Shimmer text", text: "Loading your workspace", css: `& { background: linear-gradient(90deg, ${mix(40)} 40%, currentColor 50%, ${mix(40)} 60%) 0 0 / 300% 100%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: K-s 1.8s linear infinite; }
@keyframes K-s { from { background-position: 100% 0; } to { background-position: 0 0; } }` },
  { f: "text", name: "Typewriter", t: ["Loading..."], css: `& { font: 600 15px/1.3 ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
& span { display: inline-block; overflow: hidden; white-space: nowrap; vertical-align: bottom; border-right: 2px solid; width: 10ch; animation: K-t 2.2s steps(10) infinite, K-c .6s step-end infinite alternate; }
@keyframes K-t { 0% { width: 0; } 80%, 100% { width: 10ch; } }
@keyframes K-c { 50% { border-color: transparent; } }` },
  { f: "text", name: "Letter fade", t: ["L", "O", "A", "D", "I", "N", "G"], css: `& { font-size: 13px; letter-spacing: .3em; }
& span { animation: K-f 1.4s ease-in-out infinite; }
${nth(7, (i) => `& span:nth-child(${i + 1}) { animation-delay: ${(i * 0.1).toFixed(1)}s; }`)}
@keyframes K-f { 0%, 100% { opacity: .2; } 30% { opacity: 1; } }` },
  { f: "text", name: "Filling word", text: "LOADING", css: `& { font-size: 26px; font-weight: 800; letter-spacing: .04em; background: linear-gradient(to top, currentColor 50%, ${mix(22)} 50%) 0 0 / 100% 200%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: K-f 2s ease-in-out infinite; }
@keyframes K-f { from { background-position: 0 0; } to { background-position: 0 100%; } }` },
  { f: "text", name: "Blinking caret", text: "Loading", css: `&::after { content: ""; display: inline-block; width: 2px; height: 1.1em; margin-left: 3px; vertical-align: -.18em; background: currentColor; animation: K-b 1s step-end infinite; }
@keyframes K-b { 50% { opacity: 0; } }` },
  { f: "text", name: "Rolling words", t: ["Loading", "Fetching data", "Almost there", "Loading"], css: `& { height: 1.4em; overflow: hidden; line-height: 1.4em; }
& span { display: block; animation: K-r 6s cubic-bezier(.7,0,.3,1) infinite; }
@keyframes K-r { 0%, 25% { transform: translateY(0); } 33%, 58% { transform: translateY(-100%); } 66%, 91% { transform: translateY(-200%); } 100% { transform: translateY(-300%); } }` },
  { f: "text", name: "Spreading letters", text: "LOADING", css: `& { font-size: 13px; animation: K-s 1.8s ease-in-out infinite; }
@keyframes K-s { 0%, 100% { letter-spacing: .06em; opacity: .5; } 50% { letter-spacing: .32em; opacity: 1; } }` },
  { f: "text", name: "Underline sweep", text: "Loading", css: `& { padding-bottom: 6px; overflow: hidden; }
&::after { content: ""; position: absolute; left: 0; bottom: 0; width: 40%; height: 2px; border-radius: 1px; background: currentColor; animation: K-u 1.3s cubic-bezier(.6,0,.4,1) infinite; }
@keyframes K-u { from { transform: translateX(-100%); } to { transform: translateX(250%); } }` },
  { f: "text", name: "Flipping letters", t: ["L", "O", "A", "D", "I", "N", "G"], css: `& { font-size: 18px; font-weight: 700; perspective: 200px; }
& span { display: inline-block; animation: K-f 2.4s ease-in-out infinite; }
${nth(7, (i) => `& span:nth-child(${i + 1}) { animation-delay: ${(i * 0.09).toFixed(2)}s; }`)}
@keyframes K-f { 0%, 30%, 100% { transform: rotateY(0); } 15% { transform: rotateY(180deg); opacity: .5; } }` },

  // MORPH
  { f: "morph", name: "Square to circle", css: `& { width: 36px; height: 36px; background: currentColor; animation: K-m 1.6s ease-in-out infinite; }
@keyframes K-m { 0%, 100% { border-radius: 4px; transform: rotate(0); } 50% { border-radius: 50%; transform: rotate(180deg); } }` },
  { f: "morph", name: "Blob", css: `& { width: 44px; height: 44px; background: currentColor; animation: K-b 3s ease-in-out infinite; }
@keyframes K-b {
  0%, 100% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; transform: rotate(0); }
  33% { border-radius: 70% 30% 46% 54% / 30% 29% 71% 70%; }
  66% { border-radius: 30% 70% 35% 65% / 62% 40% 60% 38%; transform: rotate(180deg); }
}` },
  { f: "morph", name: "Shape cycle", css: `& { width: 40px; height: 40px; background: currentColor; animation: K-c 3s cubic-bezier(.7,0,.3,1) infinite; }
@keyframes K-c {
  0%, 25% { clip-path: polygon(50% 0, 50% 0, 100% 100%, 0 100%); }
  33%, 58% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
  66%, 91% { clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); }
  100% { clip-path: polygon(50% 0, 50% 0, 100% 100%, 0 100%); }
}` },
  { f: "morph", name: "Flip tile", css: `& { width: 36px; height: 36px; border-radius: 4px; background: currentColor; animation: K-f 1.2s ease-in-out infinite; }
@keyframes K-f { 0% { transform: perspective(120px) rotateX(0) rotateY(0); } 50% { transform: perspective(120px) rotateX(-180deg) rotateY(0); } 100% { transform: perspective(120px) rotateX(-180deg) rotateY(-180deg); } }` },
  { f: "morph", name: "Folding cube", n: 4, css: `& { width: 36px; height: 36px; margin: 6px; transform: rotateZ(45deg); }
& span { float: left; position: relative; width: 50%; height: 50%; transform: scale(1.1); }
& span::before { content: ""; position: absolute; inset: 0; background: currentColor; transform-origin: 100% 100%; animation: K-f 2.4s linear infinite both; }
& span:nth-child(2) { transform: scale(1.1) rotateZ(90deg); }
& span:nth-child(3) { transform: scale(1.1) rotateZ(270deg); }
& span:nth-child(4) { transform: scale(1.1) rotateZ(180deg); }
& span:nth-child(2)::before { animation-delay: .3s; }
& span:nth-child(3)::before { animation-delay: .9s; }
& span:nth-child(4)::before { animation-delay: .6s; }
@keyframes K-f { 0%, 10% { transform: perspective(140px) rotateX(-180deg); opacity: 0; } 25%, 75% { transform: perspective(140px) rotateX(0); opacity: 1; } 90%, 100% { transform: perspective(140px) rotateY(180deg); opacity: 0; } }` },
  { f: "morph", name: "Hourglass", css: `& { width: 0; height: 0; border: 18px solid; border-color: currentColor transparent; border-radius: 3px; animation: K-h 1.8s cubic-bezier(.7,0,.3,1) infinite; }
@keyframes K-h { 0%, 40% { transform: rotate(0); } 60%, 100% { transform: rotate(180deg); } }` },
  { f: "morph", name: "Squash ball", n: 1, css: `& { width: 40px; height: 52px; }
& span { position: absolute; left: 11px; bottom: 6px; width: 18px; height: 18px; border-radius: 50%; background: currentColor; transform-origin: 50% 100%; animation: K-b .9s cubic-bezier(.4,0,.6,1) infinite; }
&::after { content: ""; position: absolute; left: 8px; bottom: 0; width: 24px; height: 4px; border-radius: 50%; background: ${mix(25)}; animation: K-s .9s cubic-bezier(.4,0,.6,1) infinite; }
@keyframes K-b { 0%, 100% { transform: translateY(0) scale(1.3, .7); } 15%, 85% { transform: translateY(-4px) scale(1); } 50% { transform: translateY(-30px) scale(.95, 1.05); } }
@keyframes K-s { 0%, 100% { transform: scaleX(1); opacity: 1; } 50% { transform: scaleX(.5); opacity: .4; } }` },
  { f: "morph", name: "Pill stretch", css: `& { width: 12px; height: 12px; border-radius: 999px; background: currentColor; animation: K-p 1s ease-in-out infinite alternate; }
@keyframes K-p { from { width: 12px; transform: translateX(0); } to { width: 48px; transform: translateX(0); } }` },
  { f: "morph", name: "Star bloom", css: `& { width: 42px; height: 42px; background: currentColor; animation: K-s 2s ease-in-out infinite; }
@keyframes K-s {
  0%, 100% { clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); transform: rotate(0); }
  50% { clip-path: polygon(50% 0, 85% 15%, 100% 50%, 85% 85%, 50% 100%, 15% 85%, 0 50%, 15% 15%); transform: rotate(90deg); }
}` },
  { f: "morph", name: "Ring to disc", css: `& { width: 44px; height: 44px; border-radius: 50%; border: 3px solid currentColor; animation: K-r 1.6s ease-in-out infinite; }
@keyframes K-r { 0%, 100% { border-width: 3px; transform: scale(1); } 50% { border-width: 22px; transform: scale(.8); } }` },
  { f: "morph", name: "Turning drop", css: `& { width: 34px; height: 34px; border-radius: 0 50% 50% 50%; background: currentColor; animation: K-d 1.4s cubic-bezier(.6,0,.4,1) infinite; }
@keyframes K-d { 0% { transform: rotate(45deg); } 100% { transform: rotate(405deg); } }` },

  // ORBIT
  { f: "orbit", name: "Satellite", css: `& { width: 48px; height: 48px; border-radius: 50%; border: 2px solid ${mix(25)}; }
&::before { content: ""; position: absolute; left: 50%; top: -6px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: currentColor; transform-origin: 5px 29px; animation: K-spin 1.2s linear infinite; }
${SPIN}` },
  { f: "orbit", name: "Twin dots", n: 2, css: `& { width: 40px; height: 40px; animation: K-spin 1s linear infinite; }
& span { position: absolute; left: 50%; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: currentColor; }
& span:nth-child(1) { top: 0; }
& span:nth-child(2) { bottom: 0; opacity: .45; }
${SPIN}` },
  { f: "orbit", name: "Atom", n: 3, css: `& { width: 52px; height: 52px; perspective: 800px; }
&::before { content: ""; position: absolute; left: 50%; top: 50%; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; background: currentColor; }
& span { position: absolute; inset: 0; border-radius: 50%; border-bottom: 3px solid currentColor; }
& span:nth-child(1) { animation: K-1 1.2s linear infinite; }
& span:nth-child(2) { border-right: 3px solid currentColor; border-bottom: 0; animation: K-2 1.2s linear infinite; }
& span:nth-child(3) { border-top: 3px solid currentColor; border-bottom: 0; animation: K-3 1.2s linear infinite; }
@keyframes K-1 { from { transform: rotateX(35deg) rotateY(-45deg) rotateZ(0); } to { transform: rotateX(35deg) rotateY(-45deg) rotateZ(360deg); } }
@keyframes K-2 { from { transform: rotateX(50deg) rotateY(10deg) rotateZ(0); } to { transform: rotateX(50deg) rotateY(10deg) rotateZ(360deg); } }
@keyframes K-3 { from { transform: rotateX(35deg) rotateY(55deg) rotateZ(0); } to { transform: rotateX(35deg) rotateY(55deg) rotateZ(360deg); } }` },
  { f: "orbit", name: "Moon", css: `& { width: 52px; height: 52px; border-radius: 50%; border: 1.5px dashed ${mix(40)}; animation: K-spin 3s linear infinite; }
&::before { content: ""; position: absolute; left: 50%; top: 50%; width: 18px; height: 18px; margin: -9px 0 0 -9px; border-radius: 50%; background: currentColor; }
&::after { content: ""; position: absolute; left: 50%; top: -5px; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: currentColor; }
${SPIN}` },
  { f: "orbit", name: "Dot trail", n: 6, css: `& { width: 44px; height: 44px; animation: K-spin 1s linear infinite; }
& span { position: absolute; left: 50%; top: 0; border-radius: 50%; background: currentColor; }
${nth(6, (i) => {
  const s = 10 - i * 1.2;
  return `& span:nth-child(${i + 1}) { width: ${s.toFixed(1)}px; height: ${s.toFixed(1)}px; margin-left: -${(s / 2).toFixed(1)}px; transform-origin: ${(s / 2).toFixed(1)}px 22px; transform: rotate(-${i * 26}deg); opacity: ${(1 - i * 0.14).toFixed(2)}; }`;
})}
${SPIN}` },
  { f: "orbit", name: "Comet", css: `& { width: 46px; height: 46px; animation: K-spin 1s linear infinite; }
&::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(transparent 40%, currentColor); ${ring(3)} }
&::after { content: ""; position: absolute; left: 50%; top: -3px; width: 9px; height: 9px; margin-left: -4.5px; border-radius: 50%; background: currentColor; }
${SPIN}` },
  { f: "orbit", name: "Chasing balls", n: 5, css: `& { width: 46px; height: 46px; }
& span { position: absolute; inset: 0; animation: K-c 1.6s cubic-bezier(.5,0,.5,1) infinite; }
& span::before { content: ""; position: absolute; left: 50%; top: 0; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: currentColor; }
${nth(5, (i) => `& span:nth-child(${i + 1}) { animation-delay: ${(i * 0.06).toFixed(2)}s; opacity: ${(1 - i * 0.15).toFixed(2)}; }`)}
@keyframes K-c { to { transform: rotate(360deg); } }` },
  { f: "orbit", name: "Figure eight", n: 2, css: `& { width: 60px; height: 30px; }
& span { position: absolute; left: 0; top: 0; width: 10px; height: 10px; border-radius: 50%; background: currentColor; offset-path: path("M30 15 C 40 2, 58 2, 58 15 C 58 28, 40 28, 30 15 C 20 2, 2 2, 2 15 C 2 28, 20 28, 30 15 Z"); offset-rotate: 0deg; animation: K-o 2s linear infinite; }
& span:nth-child(2) { opacity: .4; animation-delay: -1s; }
@keyframes K-o { from { offset-distance: 0%; } to { offset-distance: 100%; } }` },
  { f: "orbit", name: "Square track", n: 1, css: `& { width: 40px; height: 40px; border: 2px solid ${mix(25)}; border-radius: 2px; }
& span { position: absolute; left: -6px; top: -6px; width: 10px; height: 10px; border-radius: 50%; background: currentColor; animation: K-t 2s cubic-bezier(.6,0,.4,1) infinite; }
@keyframes K-t { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(38px, 0); } 50% { transform: translate(38px, 38px); } 75% { transform: translate(0, 38px); } }` },
  { f: "orbit", name: "Gyroscope", n: 3, css: `& { width: 50px; height: 50px; perspective: 240px; }
& span { position: absolute; border: 2px solid currentColor; border-radius: 50%; }
& span:nth-child(1) { inset: 0; animation: K-x 2s linear infinite; }
& span:nth-child(2) { inset: 7px; opacity: .7; animation: K-y 1.6s linear infinite; }
& span:nth-child(3) { inset: 14px; opacity: .45; animation: K-z 1.2s linear infinite; }
@keyframes K-x { to { transform: rotateX(360deg); } }
@keyframes K-y { to { transform: rotateY(360deg); } }
@keyframes K-z { to { transform: rotateX(360deg) rotateY(360deg); } }` },
  { f: "orbit", name: "Pendulum", n: 1, css: `& { width: 44px; height: 44px; }
&::before { content: ""; position: absolute; left: 50%; top: 0; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; background: ${mix(40)}; }
& span { position: absolute; left: 50%; top: 3px; width: 2px; height: 30px; margin-left: -1px; background: currentColor; transform-origin: 50% 0; animation: K-p 1.2s ease-in-out infinite alternate; }
& span::after { content: ""; position: absolute; left: 50%; bottom: -10px; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: currentColor; }
@keyframes K-p { from { transform: rotate(40deg); } to { transform: rotate(-40deg); } }` },

  // GRADIENT RINGS
  { f: "rings", name: "Ocean ring", css: `& { width: 46px; height: 46px; border-radius: 50%; background: conic-gradient(from 0deg, #0ea5e9, #6366f1, #0ea5e9); ${ring(6)} animation: K-spin 1.2s linear infinite; }
&::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, rgba(255,255,255,0) 60%, rgba(255,255,255,.55)); }
${SPIN}` },
  { f: "rings", name: "Spectrum", css: `& { width: 46px; height: 46px; border-radius: 50%; background: conic-gradient(#f43f5e, #f59e0b, #84cc16, #06b6d4, #8b5cf6, #f43f5e); ${ring(5)} animation: K-spin 1.6s linear infinite; }
${SPIN}` },
  { f: "rings", name: "Teal to indigo tail", css: `& { width: 46px; height: 46px; border-radius: 50%; background: conic-gradient(from 90deg, transparent 15%, #14b8a6 55%, #6366f1); ${ring(6)} animation: K-spin .9s linear infinite; }
${SPIN}` },
  { f: "rings", name: "Glow ring", css: `& { width: 46px; height: 46px; animation: K-spin 1.2s linear infinite; }
&::before, &::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, transparent 20%, #22d3ee, #a855f7); ${ring(5)} }
&::before { filter: blur(6px); opacity: .9; }
${SPIN}` },
  { f: "rings", name: "Segmented", css: `& { width: 46px; height: 46px; border-radius: 50%; background: repeating-conic-gradient(currentColor 0 20deg, transparent 20deg 30deg); ${ring(7)} animation: K-spin 1.2s steps(12) infinite; }
${SPIN}` },
  { f: "rings", name: "Breathing arc", css: `& { width: 46px; height: 46px; border-radius: 50%; padding: 3px; background: conic-gradient(#f97316, #ec4899, #8b5cf6, #f97316); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); animation: K-spin 1.4s linear infinite, K-w 1.4s ease-in-out infinite; }
@keyframes K-w { 50% { padding: 9px; } }
${SPIN}` },
  { f: "rings", name: "Sunset pair", css: `& { width: 50px; height: 50px; border-radius: 50%; background: conic-gradient(from 0deg, transparent 25%, #f59e0b, #ef4444); ${ring(5)} animation: K-spin 1.2s linear infinite; }
&::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 180deg, transparent 25%, #ef4444, #a855f7); -webkit-mask: radial-gradient(farthest-side, transparent 62%, #000 63% 76%, transparent 77%); mask: radial-gradient(farthest-side, transparent 62%, #000 63% 76%, transparent 77%); animation: K-spin .8s linear infinite reverse; }
${SPIN}` },
  { f: "rings", name: "Glass orb", css: `& { width: 46px; height: 46px; border-radius: 50%; overflow: hidden; background: radial-gradient(circle at 32% 28%, #e0f2fe 0, #60a5fa 22%, #2563eb 58%, #1e3a8a 100%); box-shadow: 0 8px 20px -8px rgba(37,99,235,.7); }
&::before { content: ""; position: absolute; inset: 0; background: conic-gradient(from 0deg, transparent, rgba(255,255,255,.65), transparent 35%); animation: K-spin 1.4s linear infinite; }
${SPIN}` },
  { f: "rings", name: "Hue shift", css: `& { width: 46px; height: 46px; border-radius: 50%; background: conic-gradient(from 0deg, transparent 10%, #10b981, #3b82f6); ${ring(3)} animation: K-spin 1s linear infinite, K-h 4s linear infinite; }
@keyframes K-h { to { filter: hue-rotate(360deg); } }
${SPIN}` },
  { f: "rings", name: "Gradient dots", n: 8, css: `& { width: 46px; height: 46px; }
& span { position: absolute; left: 50%; top: 0; width: 9px; height: 9px; margin-left: -4.5px; border-radius: 50%; transform-origin: 4.5px 23px; animation: K-d 1s ease-in-out infinite; }
${nth(8, (i) => {
  const cols = ["#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"];
  return `& span:nth-child(${i + 1}) { background: ${cols[i]}; transform: rotate(${i * 45}deg); animation-delay: ${(i * 0.125 - 1).toFixed(3)}s; }`;
})}
@keyframes K-d { 0%, 100% { scale: .45; } 50% { scale: 1; } }` },
  { f: "rings", name: "Still ring, moving light", css: `@property --K-a { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
& { width: 46px; height: 46px; border-radius: 50%; background: conic-gradient(from var(--K-a), #f43f5e, #fb923c 25%, ${mix(12)} 25%); ${ring(5)} animation: K-a 1.4s linear infinite; }
@keyframes K-a { to { --K-a: 360deg; } }` },
];

const ALL: Item[] = (Object.keys(FAMILIES) as FamilyKey[]).flatMap((f) => ITEMS.filter((it) => it.f === f));

/* ---------- rendering helpers ---------- */
const scope = (css: string, sel: string, kf: string) => css.replace(/&/g, sel).replace(/\bK-/g, `${kf}-`);

function childrenHtml(it: Item): string {
  const kids = it.t ? it.t.map((s) => `<span>${s}</span>`) : Array.from({ length: it.n ?? 0 }, () => "<span></span>");
  if (it.text && !kids.length) return it.text;
  if (!kids.length) return "";
  return `\n  ${kids.join("\n  ")}\n`;
}

function snippetFor(it: Item): string {
  return `<div class="loader" role="status" aria-label="Loading">${childrenHtml(it)}</div>\n\n<style>\n${scope(BASE, ".loader", "loader")}\n${scope(it.css, ".loader", "loader")}\n</style>\n`;
}

const SEARCH_ICON = "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4";
const CHECK_ICON = "M5 12.5l4.5 4.5L19 7";
const COPY_ICON = "M9 9h11v11H9zM5 15H4V4h11v1";

/* ---------- page ---------- */
const FAMILY_KEYS = Object.keys(FAMILIES) as FamilyKey[];

export default function CssLoadersCollection() {
  const [family, setFamily] = useState<FamilyKey | "all">("all");
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styleSheet = useMemo(
    () => scope(BASE, ".cl-b", "cl") + "\n" + ALL.map((it, i) => scope(it.css, `.cl-i${i}`, `cl${i}`)).join("\n"),
    [],
  );

  const indexed = useMemo(() => ALL.map((it, i) => ({ it, i })), []);
  const q = query.trim().toLowerCase();
  const visible = indexed.filter(
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

  const t = dark
    ? {
        page: "bg-[#0d0f13] text-slate-100",
        muted: "text-slate-400",
        line: "border-slate-700/70",
        card: "border-slate-800 bg-[#14171d]",
        stage: "bg-[#0f1216]",
        chipOff: "bg-[#14171d] text-slate-300 ring-1 ring-inset ring-slate-700 hover:bg-slate-800",
        chipOn: "bg-slate-100 text-slate-900",
        input: "border-slate-700 bg-[#14171d] text-slate-100 placeholder:text-slate-500 focus:border-slate-500",
        sticky: "bg-[#0d0f13]/95",
        btn: "bg-slate-800 text-slate-100 hover:bg-slate-700",
        icon: "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
        ring: "focus-visible:ring-offset-[#0d0f13]",
      }
    : {
        page: "bg-[#f7f6f3] text-[#16181d]",
        muted: "text-stone-600",
        line: "border-stone-300/70",
        card: "border-stone-200 bg-white",
        stage: "bg-white",
        chipOff: "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100",
        chipOn: "bg-[#16181d] text-white",
        input: "border-stone-300 bg-white text-stone-900 placeholder:text-stone-500 focus:border-stone-500",
        sticky: "bg-[#f7f6f3]/95",
        btn: "bg-stone-100 text-stone-900 hover:bg-stone-200",
        icon: "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
        ring: "focus-visible:ring-offset-[#f7f6f3]",
      };
  const stageVars = (dark
    ? { "--loader-color": "#7fb2ff", "--loader-bg": "#0f1216" }
    : { "--loader-color": "#2563eb" }) as CSSProperties;

  const chip = `inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${t.ring}`;

  return (
    <section
      className={`px-4 py-12 transition-colors sm:px-8 sm:py-16 ${t.page}`}
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}
    >
      <style>{styleSheet}</style>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className={`font-mono text-[12px] uppercase tracking-[0.18em] ${t.muted}`}>Pure CSS · copy and paste</p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">
              {ALL.length} CSS loaders and spinners
            </h2>
            <p className={`mt-4 max-w-xl text-[15px] leading-relaxed ${t.muted}`}>
              Each loader is one element, a few spans and a small block of CSS. Press Copy CSS to take the HTML and styles together, ready for any page or framework.
            </p>
          </div>
          <dl className={`flex gap-8 font-mono text-[12px] ${t.muted}`}>
            <div>
              <dt className="uppercase tracking-[0.14em]">Loaders</dt>
              <dd className={`mt-1 text-[22px] font-semibold tracking-tight ${dark ? "text-slate-100" : "text-[#16181d]"}`}>{ALL.length}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.14em]">Families</dt>
              <dd className={`mt-1 text-[22px] font-semibold tracking-tight ${dark ? "text-slate-100" : "text-[#16181d]"}`}>{FAMILY_KEYS.length}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.14em]">JavaScript</dt>
              <dd className={`mt-1 text-[22px] font-semibold tracking-tight ${dark ? "text-slate-100" : "text-[#16181d]"}`}>None</dd>
            </div>
          </dl>
        </header>

        <div className={`mt-8 flex flex-col gap-3 border-y py-4 lg:flex-row lg:items-center ${t.line}`}>
          <div className="flex gap-2 lg:shrink-0">
            <label htmlFor="cl-search" className="sr-only">
              Search loaders
            </label>
            <div className="relative flex-1 lg:w-56">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${t.muted}`}>
                <path d={SEARCH_ICON} />
              </svg>
              <input
                id="cl-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search loaders"
                className={`h-10 w-full rounded-full border pl-9 pr-4 text-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${t.input}`}
              />
            </div>
            <button
              type="button"
              aria-pressed={dark}
              onClick={() => setDark(!dark)}
              className={`${chip} h-10 ${t.chipOff}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                <path d={dark ? "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" : "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"} />
              </svg>
              Dark preview
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by family">
            {(["all", ...FAMILY_KEYS] as const).map((f) => {
              const on = family === f;
              const n = f === "all" ? ALL.length : ALL.filter((it) => it.f === f).length;
              return (
                <button key={f} type="button" aria-pressed={on} onClick={() => setFamily(f)} className={`${chip} ${on ? t.chipOn : t.chipOff}`}>
                  {f === "all" ? "All" : FAMILIES[f]}
                  <span className={`font-mono text-[11px] ${on ? "opacity-70" : t.muted}`}>{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>

        <div className="mt-6 h-[1040px] overflow-y-auto overscroll-contain rounded-2xl pr-1" tabIndex={0} aria-label="Loaders">
          {groups.length === 0 && (
            <div className={`grid h-60 place-items-center rounded-2xl border border-dashed text-[14px] ${t.line} ${t.muted}`}>
              No loader matches "{query}". Try ring, dots or skeleton.
            </div>
          )}
          {groups.map(({ f, list }) => (
            <div key={f} className="mb-10 last:mb-2">
              <div className={`sticky top-0 z-10 flex items-baseline justify-between py-3 backdrop-blur-sm ${t.sticky}`}>
                <h3 className="text-[15px] font-semibold tracking-tight">{FAMILIES[f]}</h3>
                <span className={`font-mono text-[12px] ${t.muted}`}>{list.length} loaders</span>
              </div>
              <ul className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.map(({ it, i }) => {
                  const isOpen = open === i;
                  return (
                    <li key={i} className={`overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(22,24,29,0.04)] ${t.card} ${isOpen ? "col-span-full" : ""}`}>
                      <div className={`relative grid h-36 place-items-center overflow-hidden px-4 ${t.stage}`} style={stageVars}>
                        <div className={`cl-b cl-i${i}`} role="img" aria-label={`${it.name} loader`}>
                          {it.text}
                          {it.t ? it.t.map((s, k) => <span key={k}>{s}</span>) : Array.from({ length: it.n ?? 0 }, (_, k) => <span key={k} />)}
                        </div>
                        <span className={`absolute left-3 top-3 font-mono text-[11px] ${t.muted}`}>{String(i + 1).padStart(3, "0")}</span>
                      </div>
                      <div className={`flex items-center gap-2 border-t px-3 py-2.5 ${dark ? "border-slate-800" : "border-stone-200"}`}>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{it.name}</span>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={`cl-code-${i}`}
                          aria-label={`${isOpen ? "Hide" : "Show"} code for ${it.name}`}
                          onClick={() => setOpen(isOpen ? null : i)}
                          className={`grid h-9 w-9 place-items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${t.icon}`}
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
                            copied === i ? "bg-emerald-700 text-white" : t.btn
                          }`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                            <path d={copied === i ? CHECK_ICON : COPY_ICON} />
                          </svg>
                          {copied === i ? "Copied" : "Copy CSS"}
                        </button>
                      </div>
                      {isOpen && (
                        <pre
                          id={`cl-code-${i}`}
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
