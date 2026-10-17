import { useMemo, useState } from "react";

// 100+ CSS gradient backgrounds. Every entry is one `background` value, so the
// snippet you copy is self-contained: paste it on any element and it works.
// Animated entries add a class with keyframes and stop under reduced motion.

type Family =
  | "Linear" | "Radial" | "Conic" | "Mesh" | "Pastel" | "Deep" | "Duotone"
  | "Grain" | "Patterns" | "Blobs" | "Aurora" | "Paper" | "Animated";

type Bg = { n: string; f: Family; dark?: boolean; bg: string; anim?: string; kf?: string };

const FAMILIES: Family[] = ["Linear", "Radial", "Conic", "Mesh", "Pastel", "Deep", "Duotone", "Grain", "Patterns", "Blobs", "Aurora", "Paper", "Animated"];

// Inline SVG noise tile. Frequency sets grain size, alpha sets strength.
const noise = (freq = 0.85, alpha = 0.35, size = 160) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${alpha} 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
const noiseLight = (freq = 0.8, alpha = 0.18) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 ${alpha} 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
const wave = (stroke: string, w = 80, h = 20) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'%3E%3Cpath d='M0 ${h / 2} Q ${w / 4} 0 ${w / 2} ${h / 2} T ${w} ${h / 2}' fill='none' stroke='${stroke.replace("#", "%23")}' stroke-width='1.5'/%3E%3C/svg%3E")`;

const BACKGROUNDS: Bg[] = [
  // Linear
  { n: "Terracotta Dusk", f: "Linear", dark: true, bg: "linear-gradient(135deg, #7c2d12 0%, #c2410c 45%, #fdba74 100%)" },
  { n: "Harbour Morning", f: "Linear", bg: "linear-gradient(160deg, #e0f2fe 0%, #fef3c7 100%)" },
  { n: "Sage Field", f: "Linear", bg: "linear-gradient(180deg, #f0fdf4 0%, #bbf7d0 100%)" },
  { n: "Ink to Teal", f: "Linear", dark: true, bg: "linear-gradient(120deg, #0f172a 0%, #134e4a 60%, #0d9488 100%)" },
  { n: "Apricot Wash", f: "Linear", bg: "linear-gradient(90deg, #fff7ed 0%, #fed7aa 50%, #fecaca 100%)" },
  { n: "Steel Horizon", f: "Linear", bg: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 55%, #94a3b8 100%)" },
  { n: "Pine and Moss", f: "Linear", dark: true, bg: "linear-gradient(200deg, #14532d 0%, #052e16 100%)" },
  { n: "Citrus Pop", f: "Linear", bg: "linear-gradient(115deg, #fef08a 0%, #fdba74 60%, #fb923c 100%)" },
  { n: "Ocean Shelf", f: "Linear", dark: true, bg: "linear-gradient(180deg, #0c4a6e 0%, #075985 40%, #0e7490 100%)" },
  { n: "Rosewater Fade", f: "Linear", bg: "linear-gradient(150deg, #fff1f2 0%, #fce7f3 50%, #ffffff 100%)" },
  { n: "Hard Stop Split", f: "Linear", dark: true, bg: "linear-gradient(105deg, #111827 0 55%, #ea580c 55% 100%)" },
  // Radial
  { n: "Ember Glow", f: "Radial", dark: true, bg: "radial-gradient(circle at 50% 100%, #f97316 0%, #7c2d12 35%, #1c0a03 75%)" },
  { n: "Sunrise Corner", f: "Radial", bg: "radial-gradient(circle at 0% 0%, #fde68a 0%, #fff7ed 45%, #ffffff 80%)" },
  { n: "Spotlight Navy", f: "Radial", dark: true, bg: "radial-gradient(ellipse at 50% 0%, #1e40af 0%, #0b1220 65%)" },
  { n: "Lagoon Eye", f: "Radial", bg: "radial-gradient(circle at 50% 120%, #5eead4 0%, #ccfbf1 40%, #f0fdfa 75%)" },
  { n: "Vignette Stone", f: "Radial", bg: "radial-gradient(ellipse at center, #fafaf9 40%, #d6d3d1 100%)" },
  { n: "Moonlit Pool", f: "Radial", dark: true, bg: "radial-gradient(circle at 70% 30%, #334155 0%, #0f172a 55%, #020617 100%)" },
  { n: "Petal Halo", f: "Radial", bg: "radial-gradient(circle at 30% 70%, #fecdd3 0%, #fff1f2 50%, #ffffff 90%)" },
  { n: "Lime Burst", f: "Radial", bg: "radial-gradient(circle at 80% 20%, #d9f99d 0%, #f7fee7 50%, #ffffff 85%)" },
  // Conic
  { n: "Colour Wheel Soft", f: "Conic", bg: "conic-gradient(from 180deg at 50% 50%, #fecaca, #fde68a, #bbf7d0, #bae6fd, #fecaca)" },
  { n: "Brass Dial", f: "Conic", dark: true, bg: "conic-gradient(from 90deg at 50% 50%, #78350f, #f59e0b, #451a03, #d97706, #78350f)" },
  { n: "Beacon Sweep", f: "Conic", dark: true, bg: "conic-gradient(from 200deg at 0% 100%, #0f172a 0deg, #0ea5e9 40deg, #0f172a 90deg)" },
  { n: "Pie Quarters", f: "Conic", bg: "conic-gradient(#fde68a 0 25%, #fecaca 0 50%, #bfdbfe 0 75%, #bbf7d0 0)" },
  { n: "Satin Fold", f: "Conic", bg: "conic-gradient(from 135deg at 60% 40%, #f5f5f4, #d6d3d1, #fafaf9, #e7e5e4, #f5f5f4)" },
  { n: "Petrol Sheen", f: "Conic", dark: true, bg: "conic-gradient(from 45deg at 30% 70%, #042f2e, #0f766e, #1e3a8a, #042f2e)" },
  { n: "Sunray Burst", f: "Conic", bg: "repeating-conic-gradient(from 0deg at 50% 110%, #fef3c7 0deg 6deg, #fde68a 6deg 12deg)" },
  // Mesh
  { n: "Morning Mesh", f: "Mesh", bg: "radial-gradient(at 12% 18%, #fde68a 0px, transparent 50%), radial-gradient(at 88% 12%, #bae6fd 0px, transparent 50%), radial-gradient(at 70% 88%, #fecaca 0px, transparent 50%), radial-gradient(at 18% 82%, #bbf7d0 0px, transparent 50%), #fffbeb" },
  { n: "Harbour Mesh", f: "Mesh", dark: true, bg: "radial-gradient(at 20% 20%, #0e7490 0px, transparent 50%), radial-gradient(at 80% 30%, #1e3a8a 0px, transparent 55%), radial-gradient(at 50% 90%, #0f766e 0px, transparent 50%), #020617" },
  { n: "Peach Mesh", f: "Mesh", bg: "radial-gradient(at 0% 0%, #fed7aa 0px, transparent 55%), radial-gradient(at 100% 0%, #fecdd3 0px, transparent 55%), radial-gradient(at 100% 100%, #fde68a 0px, transparent 55%), #fff7ed" },
  { n: "Lichen Mesh", f: "Mesh", bg: "radial-gradient(at 25% 30%, #d9f99d 0px, transparent 45%), radial-gradient(at 75% 20%, #a7f3d0 0px, transparent 50%), radial-gradient(at 60% 85%, #fef9c3 0px, transparent 50%), #f7fee7" },
  { n: "Ember Mesh", f: "Mesh", dark: true, bg: "radial-gradient(at 15% 85%, #c2410c 0px, transparent 50%), radial-gradient(at 85% 20%, #9f1239 0px, transparent 50%), radial-gradient(at 50% 50%, #78350f 0px, transparent 60%), #1c0a03" },
  { n: "Glacier Mesh", f: "Mesh", bg: "radial-gradient(at 10% 10%, #e0f2fe 0px, transparent 50%), radial-gradient(at 90% 40%, #c7d2fe 0px, transparent 50%), radial-gradient(at 30% 90%, #cffafe 0px, transparent 50%), #f8fafc" },
  { n: "Orchard Mesh", f: "Mesh", bg: "radial-gradient(at 80% 80%, #fca5a5 0px, transparent 45%), radial-gradient(at 20% 30%, #fde047 0px, transparent 45%), radial-gradient(at 70% 15%, #86efac 0px, transparent 45%), #fefce8" },
  { n: "Midnight Garden", f: "Mesh", dark: true, bg: "radial-gradient(at 30% 20%, #166534 0px, transparent 50%), radial-gradient(at 80% 70%, #0f766e 0px, transparent 50%), radial-gradient(at 10% 90%, #3f6212 0px, transparent 45%), #030712" },
  { n: "Clay Studio Mesh", f: "Mesh", bg: "radial-gradient(at 0% 50%, #fdba74 0px, transparent 50%), radial-gradient(at 100% 50%, #d6d3d1 0px, transparent 55%), radial-gradient(at 50% 0%, #fef3c7 0px, transparent 50%), #fafaf9" },
  { n: "Seaglass Mesh", f: "Mesh", bg: "radial-gradient(at 40% 20%, #99f6e4 0px, transparent 50%), radial-gradient(at 90% 80%, #bfdbfe 0px, transparent 50%), radial-gradient(at 0% 100%, #d9f99d 0px, transparent 50%), #f0fdfa" },
  // Soft pastel
  { n: "Milk and Honey", f: "Pastel", bg: "linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)" },
  { n: "Powder Blue", f: "Pastel", bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" },
  { n: "Mint Cream", f: "Pastel", bg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #f0fdfa 100%)" },
  { n: "Blush Paper", f: "Pastel", bg: "linear-gradient(160deg, #fff1f2 0%, #ffe4e6 100%)" },
  { n: "Butter Lilac", f: "Pastel", bg: "linear-gradient(120deg, #fef9c3 0%, #ede9fe 100%)" },
  { n: "Pistachio Peach", f: "Pastel", bg: "linear-gradient(120deg, #ecfccb 0%, #ffedd5 100%)" },
  { n: "Sky Sorbet", f: "Pastel", bg: "linear-gradient(180deg, #e0f2fe 0%, #fce7f3 100%)" },
  { n: "Oat Milk", f: "Pastel", bg: "linear-gradient(180deg, #faf7f2 0%, #efe7da 100%)" },
  { n: "Cotton Coral", f: "Pastel", bg: "radial-gradient(circle at 80% 10%, #fed7aa 0%, transparent 45%), linear-gradient(180deg, #fff7ed, #fff1f2)" },
  // Deep / dark
  { n: "Ink Blue Lamp", f: "Deep", dark: true, bg: "radial-gradient(circle at 85% 15%, #1d4ed8 0%, transparent 35%), #0b1020" },
  { n: "Obsidian", f: "Deep", dark: true, bg: "linear-gradient(180deg, #18181b 0%, #09090b 100%)" },
  { n: "Deep Forest", f: "Deep", dark: true, bg: "radial-gradient(ellipse at 50% 0%, #14532d 0%, #022c22 50%, #01120e 100%)" },
  { n: "Oxblood", f: "Deep", dark: true, bg: "linear-gradient(160deg, #4c0519 0%, #1c0509 100%)" },
  { n: "Abyss", f: "Deep", dark: true, bg: "radial-gradient(ellipse at 50% 120%, #0c4a6e 0%, #020617 60%)" },
  { n: "Graphite Rim", f: "Deep", dark: true, bg: "radial-gradient(ellipse at 50% -20%, #3f3f46 0%, #18181b 50%, #09090b 100%)" },
  { n: "Espresso", f: "Deep", dark: true, bg: "linear-gradient(135deg, #292524 0%, #1c1917 50%, #0c0a09 100%)" },
  { n: "Night Shift", f: "Deep", dark: true, bg: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" },
  { n: "Bottle Green", f: "Deep", dark: true, bg: "linear-gradient(200deg, #064e3b 0%, #022c22 100%)" },
  // Duotone
  { n: "Tomato and Cream", f: "Duotone", bg: "linear-gradient(135deg, #fef3c7 0 50%, #fca5a5 50% 100%)" },
  { n: "Cobalt Mustard", f: "Duotone", dark: true, bg: "linear-gradient(160deg, #1e3a8a 0%, #1e3a8a 30%, #ca8a04 100%)" },
  { n: "Teal Coral", f: "Duotone", bg: "linear-gradient(120deg, #99f6e4 0%, #fda4af 100%)" },
  { n: "Forest Rust", f: "Duotone", dark: true, bg: "linear-gradient(135deg, #14532d 0%, #9a3412 100%)" },
  { n: "Sand and Slate", f: "Duotone", bg: "linear-gradient(180deg, #f5e6c8 0%, #f5e6c8 50%, #cbd5e1 50%, #cbd5e1 100%)" },
  { n: "Plum Saffron", f: "Duotone", dark: true, bg: "linear-gradient(140deg, #4a044e 0%, #f59e0b 120%)" },
  { n: "Mint Navy", f: "Duotone", dark: true, bg: "linear-gradient(200deg, #6ee7b7 -20%, #0f172a 60%)" },
  { n: "Sky Tangerine", f: "Duotone", bg: "linear-gradient(90deg, #bae6fd 0%, #fed7aa 100%)" },
  // Grain
  { n: "Grain Riso Pink", f: "Grain", bg: `${noise(0.7, 0.22)}, linear-gradient(120deg, #fbcfe8, #fef08a)` },
  { n: "Grain Apricot", f: "Grain", bg: `${noise(0.85, 0.3)}, linear-gradient(135deg, #fed7aa, #fecaca)` },
  { n: "Grain Midnight", f: "Grain", dark: true, bg: `${noiseLight(0.8, 0.12)}, radial-gradient(ellipse at 30% 0%, #1e3a8a 0%, #020617 70%)` },
  { n: "Grain Sage", f: "Grain", bg: `${noise(0.7, 0.25)}, linear-gradient(180deg, #ecfccb, #bbf7d0)` },
  { n: "Grain Ember", f: "Grain", dark: true, bg: `${noiseLight(0.9, 0.14)}, radial-gradient(circle at 50% 110%, #ea580c 0%, #431407 45%, #0c0a09 85%)` },
  { n: "Grain Fog", f: "Grain", bg: `${noise(1.1, 0.22)}, linear-gradient(180deg, #f8fafc, #e2e8f0)` },
  { n: "Grain Teal Night", f: "Grain", dark: true, bg: `${noiseLight(0.75, 0.13)}, radial-gradient(at 80% 20%, #0f766e 0px, transparent 50%), radial-gradient(at 20% 80%, #155e75 0px, transparent 50%), #042f2e` },
  // Patterns
  { n: "Blueprint Grid", f: "Patterns", dark: true, bg: "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px) 0 0 / 24px 24px, #1e3a8a" },
  { n: "Dot Grid", f: "Patterns", bg: "radial-gradient(#cbd5e1 1.2px, transparent 1.6px) 0 0 / 18px 18px, #f8fafc" },
  { n: "Dot Grid Dark", f: "Patterns", dark: true, bg: "radial-gradient(rgba(148,163,184,.35) 1.2px, transparent 1.6px) 0 0 / 20px 20px, #0b1120" },
  { n: "Graph Paper", f: "Patterns", bg: "linear-gradient(#e5e7eb 1px, transparent 1px) 0 0 / 100px 100px, linear-gradient(90deg, #e5e7eb 1px, transparent 1px) 0 0 / 100px 100px, linear-gradient(#f3f4f6 1px, transparent 1px) 0 0 / 20px 20px, linear-gradient(90deg, #f3f4f6 1px, transparent 1px) 0 0 / 20px 20px, #ffffff" },
  { n: "Pinstripe", f: "Patterns", bg: "repeating-linear-gradient(90deg, #f1f5f9 0 14px, #e2e8f0 14px 15px)" },
  { n: "Awning Stripes", f: "Patterns", bg: "repeating-linear-gradient(90deg, #fef3c7 0 28px, #fdba74 28px 56px)" },
  { n: "Diagonal Hatch", f: "Patterns", bg: "repeating-linear-gradient(45deg, #fafaf9 0 9px, #e7e5e4 9px 10px)" },
  { n: "Caution Tape Soft", f: "Patterns", dark: true, bg: "repeating-linear-gradient(-45deg, #1c1917 0 18px, #3a2a12 18px 36px)" },
  { n: "Checkerboard", f: "Patterns", bg: "conic-gradient(#e7e5e4 25%, #fafaf9 0 50%, #e7e5e4 0 75%, #fafaf9 0) 0 0 / 32px 32px" },
  { n: "Gingham", f: "Patterns", bg: "repeating-linear-gradient(0deg, rgba(239,68,68,.18) 0 12px, transparent 12px 24px), repeating-linear-gradient(90deg, rgba(239,68,68,.18) 0 12px, transparent 12px 24px), #fffbf5" },
  { n: "Gentle Waves", f: "Patterns", bg: `${wave("#7dd3fc")} 0 0 / 80px 20px, #f0f9ff` },
  { n: "Night Waves", f: "Patterns", dark: true, bg: `${wave("#334155", 60, 16)} 0 0 / 60px 16px, #0f172a` },
  { n: "Polka Cherry", f: "Patterns", bg: "radial-gradient(#fda4af 5px, transparent 5.5px) 0 0 / 30px 30px, radial-gradient(#fda4af 5px, transparent 5.5px) 15px 15px / 30px 30px, #fff1f2" },
  { n: "Isometric Diamonds", f: "Patterns", bg: "linear-gradient(135deg, #e0f2fe 25%, transparent 25%) -20px 0 / 40px 40px, linear-gradient(225deg, #e0f2fe 25%, transparent 25%) -20px 0 / 40px 40px, linear-gradient(315deg, #e0f2fe 25%, transparent 25%) 0 0 / 40px 40px, linear-gradient(45deg, #e0f2fe 25%, transparent 25%) 0 0 / 40px 40px, #f8fafc" },
  { n: "Plus Grid", f: "Patterns", dark: true, bg: "linear-gradient(rgba(94,234,212,.35) 1px, transparent 1px) 11px 0 / 24px 24px, linear-gradient(90deg, rgba(94,234,212,.35) 1px, transparent 1px) 0 11px / 24px 24px, #042f2e" },
  // Blurred blobs
  { n: "Lemon Blob", f: "Blobs", bg: "radial-gradient(40% 50% at 25% 40%, rgba(253,224,71,.7) 0%, transparent 100%), radial-gradient(35% 45% at 75% 65%, rgba(251,146,60,.45) 0%, transparent 100%), #fffdf5" },
  { n: "Pool Blobs", f: "Blobs", bg: "radial-gradient(45% 55% at 70% 30%, rgba(56,189,248,.45) 0%, transparent 100%), radial-gradient(40% 50% at 25% 75%, rgba(45,212,191,.45) 0%, transparent 100%), #f8fafc" },
  { n: "Lava Blobs", f: "Blobs", dark: true, bg: "radial-gradient(35% 45% at 30% 30%, rgba(234,88,12,.7) 0%, transparent 100%), radial-gradient(40% 50% at 70% 75%, rgba(190,18,60,.6) 0%, transparent 100%), #120806" },
  { n: "Moss Blobs", f: "Blobs", dark: true, bg: "radial-gradient(45% 50% at 20% 70%, rgba(132,204,22,.4) 0%, transparent 100%), radial-gradient(35% 45% at 80% 25%, rgba(16,185,129,.45) 0%, transparent 100%), #07130c" },
  { n: "Rose Quartz Blobs", f: "Blobs", bg: "radial-gradient(40% 55% at 15% 20%, rgba(251,113,133,.35) 0%, transparent 100%), radial-gradient(45% 50% at 85% 80%, rgba(251,191,36,.35) 0%, transparent 100%), #fffafa" },
  { n: "Ice Blobs", f: "Blobs", dark: true, bg: "radial-gradient(40% 50% at 70% 35%, rgba(125,211,252,.4) 0%, transparent 100%), radial-gradient(35% 40% at 25% 70%, rgba(165,180,252,.3) 0%, transparent 100%), #0a0f1c" },
  // Aurora
  { n: "Polar Green", f: "Aurora", dark: true, bg: "radial-gradient(90% 55% at 50% 0%, rgba(74,222,128,.6) 0%, transparent 70%), radial-gradient(60% 30% at 30% 10%, rgba(45,212,191,.4) 0%, transparent 70%), #04140f" },
  { n: "Northern Ribbon", f: "Aurora", dark: true, bg: "linear-gradient(160deg, transparent 30%, rgba(52,211,153,.55) 45%, transparent 60%), linear-gradient(175deg, transparent 40%, rgba(34,211,238,.35) 55%, transparent 70%), linear-gradient(180deg, #020617, #0b1730)" },
  { n: "Dawn Aurora", f: "Aurora", bg: "linear-gradient(165deg, transparent 25%, rgba(251,191,36,.35) 40%, transparent 55%), linear-gradient(150deg, transparent 45%, rgba(244,114,182,.25) 60%, transparent 75%), #fffaf0" },
  { n: "Arctic Curtain", f: "Aurora", dark: true, bg: "repeating-linear-gradient(100deg, rgba(45,212,191,.0) 0 40px, rgba(45,212,191,.18) 60px, rgba(45,212,191,0) 80px), radial-gradient(70% 50% at 50% 0%, rgba(56,189,248,.35), transparent 70%), #031322" },
  { n: "Copper Aurora", f: "Aurora", dark: true, bg: "linear-gradient(170deg, transparent 35%, rgba(251,146,60,.45) 50%, transparent 62%), linear-gradient(190deg, transparent 50%, rgba(250,204,21,.25) 62%, transparent 75%), #140b05" },
  { n: "Glacier Aurora", f: "Aurora", bg: "linear-gradient(160deg, transparent 30%, rgba(56,189,248,.3) 45%, transparent 60%), linear-gradient(175deg, transparent 45%, rgba(52,211,153,.25) 60%, transparent 75%), #f5fbff" },
  // Paper and texture
  { n: "Watercolour Sheet", f: "Paper", bg: `${noise(0.55, 0.1)}, radial-gradient(60% 50% at 30% 40%, rgba(147,197,253,.35), transparent), radial-gradient(50% 40% at 75% 70%, rgba(253,186,116,.3), transparent), #fbfaf6` },
  { n: "Newsprint", f: "Paper", bg: `${noise(0.9, 0.18)}, #f4f1ea` },
  { n: "Kraft Board", f: "Paper", bg: `${noise(0.6, 0.28)}, linear-gradient(180deg, #d6b98c, #c9a874)` },
  { n: "Linen Weave", f: "Paper", bg: "repeating-linear-gradient(0deg, rgba(120,113,108,.07) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(120,113,108,.07) 0 1px, transparent 1px 3px), #f7f3ec" },
  { n: "Ruled Notebook", f: "Paper", bg: "linear-gradient(90deg, transparent 47px, rgba(244,63,94,.35) 47px 48px, transparent 48px), repeating-linear-gradient(180deg, #fffdf7 0 27px, #bfdbfe 27px 28px)" },
  { n: "Blackboard", f: "Paper", dark: true, bg: `${noiseLight(0.7, 0.08)}, radial-gradient(ellipse at 40% 30%, #2f3d36 0%, #1b2420 80%)` },
  // Animated
  { n: "Slow Tide", f: "Animated", anim: "bgk-tide 16s ease-in-out infinite", bg: "linear-gradient(120deg, #fde68a, #fecaca, #bae6fd, #bbf7d0) 0 0 / 300% 300%",
    kf: "@keyframes bgk-tide { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }" },
  { n: "Turning Beacon", f: "Animated", dark: true, anim: "bgk-spin 12s linear infinite", bg: "conic-gradient(from var(--bgk-a) at 50% 120%, #0f172a 0deg, #0ea5e9 30deg, #0f172a 70deg, #0f172a 360deg)",
    kf: "@property --bgk-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }\n@keyframes bgk-spin { to { --bgk-a: 360deg; } }" },
  { n: "Drifting Dots", f: "Animated", anim: "bgk-drift 8s linear infinite", bg: "radial-gradient(#94a3b8 1.2px, transparent 1.6px) 0 0 / 20px 20px, #f8fafc",
    kf: "@keyframes bgk-drift { to { background-position: 20px 20px, 0 0; } }" },
  { n: "Breathing Aurora", f: "Animated", dark: true, anim: "bgk-breathe 14s ease-in-out infinite", bg: "radial-gradient(60% 40% at 30% 0%, rgba(52,211,153,.55), transparent 70%) 0 0 / 200% 200%, radial-gradient(50% 35% at 70% 10%, rgba(56,189,248,.45), transparent 70%) 0 0 / 200% 200%, #020617",
    kf: "@keyframes bgk-breathe { 0%, 100% { background-position: 0% 0%, 100% 0%, 0 0; } 50% { background-position: 60% 20%, 30% 10%, 0 0; } }" },
  { n: "Moving Stripes", f: "Animated", anim: "bgk-stripes 3s linear infinite", bg: "repeating-linear-gradient(45deg, #fff7ed 0 14px, #ffedd5 14px 28px) 0 0 / 39.6px 39.6px",
    kf: "@keyframes bgk-stripes { to { background-position: 39.6px 0; } }" },
  { n: "Wandering Mesh", f: "Animated", anim: "bgk-wander 18s ease-in-out infinite", bg: "radial-gradient(at var(--bgk-x) 20%, #fecaca 0px, transparent 50%), radial-gradient(at 80% var(--bgk-y), #bae6fd 0px, transparent 50%), radial-gradient(at 30% 85%, #fde68a 0px, transparent 50%), #fffbeb",
    kf: "@property --bgk-x { syntax: '<percentage>'; inherits: false; initial-value: 15%; }\n@property --bgk-y { syntax: '<percentage>'; inherits: false; initial-value: 20%; }\n@keyframes bgk-wander { 0%, 100% { --bgk-x: 15%; --bgk-y: 20%; } 50% { --bgk-x: 70%; --bgk-y: 75%; } }" },
];

// Order used to deal the "All" view, strongest families first.
const DEAL: Family[] = ["Mesh", "Linear", "Animated", "Grain", "Deep", "Conic", "Patterns", "Aurora", "Duotone", "Radial", "Blobs", "Paper", "Pastel"];

const HEADLINES = [
  "Book the studio in a minute.", "Notes from a slow kiln.", "Ship on Friday, sleep on Saturday.",
  "Fresh bread by seven.", "Four nights north of the tree line.", "Your invoices, finally quiet.",
  "Plant more than you pick.", "A calmer inbox starts here.",
];

const slugOf = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function cssFor(b: Bg) {
  const cls = `.bg-${slugOf(b.n)}`;
  if (!b.anim) return `${cls} {\n  background: ${b.bg};\n}`;
  return `${b.kf}\n${cls} {\n  background: ${b.bg};\n  animation: ${b.anim};\n}\n@media (prefers-reduced-motion: reduce) {\n  ${cls} { animation: none; }\n}`;
}

// Tailwind arbitrary property. Spaces become underscores; skipped for data URIs and animations.
function twFor(b: Bg) {
  if (b.anim || b.bg.includes("url(")) return null;
  return `[background:${b.bg.replace(/\s*,\s*/g, ",").replace(/\s*\/\s*/g, "/").replace(/\s+/g, "_")}]`;
}

const STEP = 12;

export default function CssGradientBackgroundsCollection() {
  const [family, setFamily] = useState<Family | "All">("All");
  const [tone, setTone] = useState<"all" | "light" | "dark">("all");
  const [limit, setLimit] = useState(STEP);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState("");

  // "All" deals one from each family in turn, so the first screen shows the range.
  const list = useMemo(() => {
    const match = BACKGROUNDS.filter((b) => (family === "All" || b.f === family) && (tone === "all" || (tone === "dark" ? !!b.dark : !b.dark)));
    if (family !== "All") return match;
    const groups = DEAL.map((f) => match.filter((b) => b.f === f));
    const out: Bg[] = [];
    for (let i = 0; out.length < match.length; i++) groups.forEach((g) => g[i] && out.push(g[i]));
    return out;
  }, [family, tone]);
  const shown = list.slice(0, limit);
  const darkPage = tone === "dark";

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(key);
    window.setTimeout(() => setCopied((c) => (c === key ? "" : c)), 1600);
  };

  const animCss = BACKGROUNDS.filter((b) => b.anim)
    .map((b) => `${b.kf}\n.bgk-tile-${slugOf(b.n)} { animation: ${b.anim}; }`)
    .join("\n");

  const pill = (active: boolean) =>
    `h-10 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
      darkPage
        ? `focus-visible:ring-sky-400 focus-visible:ring-offset-zinc-950 ${active ? "bg-white text-zinc-900" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`
        : `focus-visible:ring-sky-600 ${active ? "bg-zinc-900 text-white" : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"}`
    }`;

  return (
    <section
      data-paused={paused}
      className={`bgk-root min-h-[600px] w-full px-4 py-12 sm:px-8 sm:py-16 transition-colors ${darkPage ? "bg-zinc-950 text-zinc-100" : "bg-stone-50 text-zinc-900"}`}
      style={{ fontFamily: '"Inter Tight", Inter, ui-sans-serif, system-ui, sans-serif' }}
    >
      <style>{`${animCss}
.bgk-root[data-paused="true"] [class*="bgk-tile-"] { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { [class*="bgk-tile-"] { animation: none !important; } }`}</style>

      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className={`text-sm font-semibold uppercase tracking-[0.14em] ${darkPage ? "text-sky-300" : "text-orange-700"}`}>Copy-paste backgrounds</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{BACKGROUNDS.length} CSS Gradient Backgrounds to Copy</h2>
            <p className={`mt-4 text-base leading-relaxed ${darkPage ? "text-zinc-400" : "text-zinc-600"}`}>
              Linear, radial, conic, mesh, grain, patterns and aurora. Each one is a single <code className="font-mono text-[0.9em]">background</code> value, with a Tailwind class where it fits.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Background tone" className={`flex rounded-full p-1 ${darkPage ? "bg-zinc-900" : "bg-zinc-200/70"}`}>
              {(["all", "light", "dark"] as const).map((t) => (
                <button key={t} type="button" aria-pressed={tone === t} onClick={() => { setTone(t); setLimit(STEP); }}
                  className={`h-9 rounded-full px-4 text-sm font-medium capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    tone === t ? (darkPage ? "bg-zinc-700 text-white" : "bg-white text-zinc-900 shadow-sm") : darkPage ? "text-zinc-400" : "text-zinc-600"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
            <button type="button" aria-pressed={paused} onClick={() => setPaused((p) => !p)} className={pill(false)}>
              {paused ? "Play motion" : "Pause motion"}
            </button>
          </div>
        </div>

        <div role="group" aria-label="Filter by family" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {(["All", ...FAMILIES] as const).map((f) => (
            <button key={f} type="button" aria-pressed={family === f} onClick={() => { setFamily(f); setLimit(STEP); }} className={`shrink-0 ${pill(family === f)}`}>
              {f === "Deep" ? "Deep and dark" : f === "Pastel" ? "Soft pastel" : f === "Blobs" ? "Blurred blobs" : f === "Paper" ? "Paper and texture" : f}
            </button>
          ))}
        </div>

        <p className="sr-only" aria-live="polite">{copied ? "Copied to clipboard" : `${list.length} backgrounds shown`}</p>

        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((b, i) => {
            const key = slugOf(b.n);
            const tw = twFor(b);
            return (
              <li key={key} className={`overflow-hidden rounded-2xl ${darkPage ? "bg-zinc-900 ring-1 ring-zinc-800" : "bg-white ring-1 ring-zinc-200"}`}>
                <div className={`relative flex aspect-[16/10] items-end p-5 ${b.anim ? `bgk-tile-${key}` : ""}`} style={{ background: b.bg }}>
                  <p className={`max-w-[15ch] text-xl font-semibold leading-tight tracking-tight ${b.dark ? "text-white" : "text-zinc-900"} ${b.f === "Patterns" ? `rounded-lg px-3 py-2 ${b.dark ? "bg-black/60" : "bg-white/85"}` : ""}`}>
                    {HEADLINES[i % HEADLINES.length]}
                  </p>
                  <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${b.dark ? "bg-black/30 text-white" : "bg-white/70 text-zinc-800"}`}>{b.f}</span>
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <h3 className="truncate text-sm font-semibold">{b.n}</h3>
                  <div className="flex shrink-0 gap-1.5">
                    <button type="button" onClick={() => copy(cssFor(b), `${key}-css`)} aria-label={`Copy CSS for ${b.n}`}
                      className={`h-10 rounded-lg px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${darkPage ? "bg-white text-zinc-900 hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-700"}`}>
                      {copied === `${key}-css` ? "Copied" : "Copy CSS"}
                    </button>
                    {tw && (
                      <button type="button" onClick={() => copy(tw, `${key}-tw`)} aria-label={`Copy Tailwind class for ${b.n}`}
                        className={`h-10 rounded-lg px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${darkPage ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"}`}>
                        {copied === `${key}-tw` ? "Copied" : "Tailwind"}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {list.length > shown.length && (
          <div className="mt-8 flex justify-center">
            <button type="button" onClick={() => setLimit((l) => l + STEP * 3)} className={pill(true)}>
              Show more ({list.length - shown.length} left)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
