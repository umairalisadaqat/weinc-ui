import { useEffect, useRef, useState } from "react";

// Dawn over a still lake. Thin ripple lines, closer together near the horizon and wider apart
// near the viewer, slide sideways in three groups at different speeds, breaking up the sun's
// reflection the way a light breeze does.
const SKY = "linear-gradient(180deg,#f6e6d6 0%,#efd8c8 45%,#e2cdcf 100%)";
const WATER = "linear-gradient(180deg,#d9c3c4 0%,#a9a0b0 40%,#6c6d82 100%)";
const LIGHT_LINE = "#fff3ea";
const DARK_LINE = "#3f3f55";
const GROUP_SECONDS = [40, 55, 32]; // one group drifts the other way for a criss-cross shimmer

// [y, amplitude, waves per period, phase, light line?, stroke width, group, dash pattern]
const LINES: [number, number, number, number, number, number, number, string][] = [[9,0.4,9,0,1,0.7,0,"90 8 30 5"],[15,0.5,7,1.37,0,0.8,1,"127 21 59 12"],[24,0.6,11,2.74,1,0.8,2,"164 12 88 7"],[34,0.7,8,4.11,0,0.9,0,"201 25 47 14"],[45,0.8,6,5.48,1,1,1,"118 16 76 9"],[58,0.9,10,0.57,0,1.1,2,"155 29 35 16"],[72,1,9,1.94,1,1.1,0,"192 20 64 11"],[87,1.1,7,3.31,0,1.2,1,"109 11 93 6"],[104,1.3,11,4.68,1,1.3,2,"146 24 52 13"],[121,1.4,8,6.05,0,1.4,0,"183 15 81 8"],[139,1.5,6,1.14,1,1.5,1,"100 28 40 15"],[159,1.6,10,2.51,0,1.5,2,"137 19 69 10"],[179,1.7,9,3.88,1,1.6,0,"174 10 98 5"],[200,1.8,7,5.25,0,1.7,1,"91 23 57 12"],[222,1.9,11,0.34,1,1.8,2,"128 14 86 7"],[244,2,8,1.71,0,1.8,0,"165 27 45 14"],[268,2.1,6,3.08,1,1.9,1,"202 18 74 9"],[292,2.2,10,4.45,0,2,2,"119 9 33 16"]];

// One wave edge across 2880 units: two copies of a 1440-unit period, so sliding the SVG left by
// half its width loops with no seam. Each harm entry is [amplitude, waves per period, phase,
// sharpness?]; with a sharpness the crests come to narrow peaks over broad troughs, like real swell.
function wavePath(base: number, harm: number[][], h: number, close: "bottom" | "top" | "none" = "bottom", step = 36, env?: [number, number]) {
  const pts: number[][] = [];
  for (let x = -step; x <= 2880 + step; x += step) {
    const e = env ? 1 - env[0] + env[0] * Math.abs(Math.sin((Math.PI * env[1] * x) / 1440)) : 1;
    let y = base;
    for (const [a, c, ph, k] of harm) {
      const t = (2 * Math.PI * c * x) / 1440 + ph;
      y += k ? e * (a - 2 * a * Math.pow((1 + Math.cos(t)) / 2, k)) : a * e * Math.sin(t);
    }
    pts.push([x, y]);
  }
  const r = (n: number) => Math.round(n * 10) / 10;
  let d = "M0 " + r(pts[1][1]);
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    d += "C" + r(p1[0] + (p2[0] - p0[0]) / 6) + " " + r(p1[1] + (p2[1] - p0[1]) / 6) + " " + r(p2[0] - (p3[0] - p1[0]) / 6) + " " + r(p2[1] - (p3[1] - p1[1]) / 6) + " " + r(p2[0]) + " " + r(p2[1]);
  }
  if (close === "bottom") d += "L2880 " + h + "L0 " + h + "Z";
  if (close === "top") d += "L2880 0L0 0Z";
  return d;
}

function useOnScreen<T extends Element>() {
  const ref = useRef<T>(null);
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, onScreen] as const;
}

const css = `
@keyframes lkrf-slide { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
@keyframes lkrf-shimmer { from { transform: translate3d(0,0,0); } to { transform: translate3d(0,24px,0); } }
.lkrf-slide { animation: lkrf-slide linear infinite; will-change: transform; }
.lkrf-shimmer { animation: lkrf-shimmer 3.2s linear infinite; }
.lkrf-root[data-paused="true"] .lkrf-slide, .lkrf-root[data-paused="true"] .lkrf-shimmer { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .lkrf-slide, .lkrf-shimmer { animation: none !important; } }
`;

export default function RipplingLakeReflection() {
  const [ref, onScreen] = useOnScreen<HTMLElement>();
  return (
    <section ref={ref} data-paused={!onScreen} className="lkrf-root relative isolate min-h-[680px] overflow-hidden bg-[#efd8c8]">
      <style>{css}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[58%]" style={{ background: SKY }} />
        <div className="absolute right-[12%] top-[58%] h-56 w-[44%] -translate-y-1/2 [background:radial-gradient(closest-side,rgba(255,236,214,.95),rgba(255,226,200,.35)_45%,transparent)]" />
        <svg className="absolute inset-x-0 top-[calc(58%-26px)] h-[30px] w-full" viewBox="0 0 1440 30" preserveAspectRatio="none">
          <path d="M0 21.5C4 21.7 8 21.8 12 21.8C16 21.8 20 21.7 24 21.7C28 21.7 32 21.6 36 21.7C40 21.7 44 21.9 48 22C52 22.1 56 22.4 60 22.4C64 22.5 68 22.6 72 22.5C76 22.3 80 22 84 21.6C88 21.1 92 20.4 96 19.8C100 19.2 104 18.4 108 17.8C112 17.2 116 16.6 120 16.3C124 15.9 128 15.7 132 15.7C136 15.6 140 15.7 144 15.8C148 15.9 152 16.1 156 16.1C160 16.2 164 16.2 168 16.1C172 16 176 15.8 180 15.6C184 15.4 188 15.1 192 15C196 14.8 200 14.7 204 14.8C208 14.8 212 15.1 216 15.3C220 15.6 224 16 228 16.3C232 16.6 236 16.9 240 17C244 17.1 248 17.1 252 16.9C256 16.8 260 16.3 264 15.9C268 15.5 272 14.9 276 14.5C280 14 284 13.5 288 13.2C292 12.9 296 12.8 300 12.7C304 12.7 308 12.8 312 12.9C316 13 320 13.2 324 13.2C328 13.3 332 13.3 336 13.3C340 13.2 344 13 348 12.9C352 12.8 356 12.6 360 12.6C364 12.6 368 12.6 372 12.9C376 13.2 380 13.6 384 14.2C388 14.7 392 15.5 396 16.2C400 16.9 404 17.8 408 18.4C412 19 416 19.5 420 19.9C424 20.3 428 20.4 432 20.5C436 20.6 440 20.5 444 20.5C448 20.5 452 20.4 456 20.5C460 20.5 464 20.6 468 20.8C472 20.9 476 21.2 480 21.3C484 21.5 488 21.7 492 21.7C496 21.7 500 21.7 504 21.4C508 21.2 512 20.7 516 20.3C520 19.8 524 19.2 528 18.7C532 18.3 536 17.8 540 17.5C544 17.3 548 17.2 552 17.2C556 17.3 560 17.5 564 17.7C568 18 572 18.4 576 18.6C580 18.8 584 19 588 19.1C592 19.2 596 19.1 600 19C604 18.9 608 18.6 612 18.5C616 18.3 620 18.1 624 18C628 18 632 18 636 18.2C640 18.3 644 18.5 648 18.7C652 18.8 656 19.1 660 19.1C664 19.1 668 19 672 18.8C676 18.5 680 18 684 17.4C688 16.9 692 16.1 696 15.5C700 14.9 704 14.1 708 13.6C712 13.1 716 12.7 720 12.5C724 12.3 728 12.2 732 12.2C736 12.2 740 12.3 744 12.3C748 12.3 752 12.4 756 12.3C760 12.3 764 12.1 768 12C772 11.9 776 11.6 780 11.6C784 11.5 788 11.4 792 11.5C796 11.7 800 12 804 12.4C808 12.9 812 13.6 816 14.2C820 14.8 824 15.6 828 16.2C832 16.8 836 17.4 840 17.7C844 18.1 848 18.3 852 18.3C856 18.4 860 18.3 864 18.2C868 18.1 872 17.9 876 17.9C880 17.8 884 17.8 888 17.9C892 18 896 18.2 900 18.4C904 18.6 908 18.9 912 19C916 19.2 920 19.3 924 19.2C928 19.2 932 18.9 936 18.7C940 18.4 944 18 948 17.7C952 17.4 956 17.1 960 17C964 16.9 968 16.9 972 17.1C976 17.2 980 17.7 984 18.1C988 18.5 992 19.1 996 19.5C1000 20 1004 20.5 1008 20.8C1012 21.1 1016 21.2 1020 21.3C1024 21.3 1028 21.2 1032 21.1C1036 21 1040 20.8 1044 20.8C1048 20.7 1052 20.7 1056 20.7C1060 20.8 1064 21 1068 21.1C1072 21.2 1076 21.4 1080 21.4C1084 21.4 1088 21.4 1092 21.1C1096 20.8 1100 20.4 1104 19.8C1108 19.3 1112 18.5 1116 17.8C1120 17.1 1124 16.2 1128 15.6C1132 15 1136 14.5 1140 14.1C1144 13.7 1148 13.6 1152 13.5C1156 13.4 1160 13.5 1164 13.5C1168 13.5 1172 13.6 1176 13.5C1180 13.5 1184 13.4 1188 13.2C1192 13.1 1196 12.8 1200 12.7C1204 12.5 1208 12.3 1212 12.3C1216 12.3 1220 12.3 1224 12.6C1228 12.8 1232 13.3 1236 13.7C1240 14.2 1244 14.8 1248 15.3C1252 15.7 1256 16.2 1260 16.5C1264 16.7 1268 16.8 1272 16.8C1276 16.7 1280 16.5 1284 16.3C1288 16 1292 15.6 1296 15.4C1300 15.2 1304 15 1308 14.9C1312 14.8 1316 14.9 1320 15C1324 15.1 1328 15.4 1332 15.5C1336 15.7 1340 15.9 1344 16C1348 16 1352 16 1356 15.8C1360 15.7 1364 15.5 1368 15.3C1372 15.2 1376 14.9 1380 14.9C1384 14.9 1388 15 1392 15.2C1396 15.5 1400 16 1404 16.6C1408 17.1 1412 17.9 1416 18.5C1420 19.1 1424 19.9 1428 20.4C1432 20.9 1436 21.3 1440 21.5L1440 30L0 30Z" fill="#7b6f7a" fillOpacity=".75" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-[42%] overflow-hidden" style={{ background: WATER }}>
          <svg className="absolute inset-x-0 top-0 h-[24px] w-full scale-y-[-1] opacity-40" viewBox="0 0 1440 30" preserveAspectRatio="none">
            <path d="M0 21.5C4 21.7 8 21.8 12 21.8C16 21.8 20 21.7 24 21.7C28 21.7 32 21.6 36 21.7C40 21.7 44 21.9 48 22C52 22.1 56 22.4 60 22.4C64 22.5 68 22.6 72 22.5C76 22.3 80 22 84 21.6C88 21.1 92 20.4 96 19.8C100 19.2 104 18.4 108 17.8C112 17.2 116 16.6 120 16.3C124 15.9 128 15.7 132 15.7C136 15.6 140 15.7 144 15.8C148 15.9 152 16.1 156 16.1C160 16.2 164 16.2 168 16.1C172 16 176 15.8 180 15.6C184 15.4 188 15.1 192 15C196 14.8 200 14.7 204 14.8C208 14.8 212 15.1 216 15.3C220 15.6 224 16 228 16.3C232 16.6 236 16.9 240 17C244 17.1 248 17.1 252 16.9C256 16.8 260 16.3 264 15.9C268 15.5 272 14.9 276 14.5C280 14 284 13.5 288 13.2C292 12.9 296 12.8 300 12.7C304 12.7 308 12.8 312 12.9C316 13 320 13.2 324 13.2C328 13.3 332 13.3 336 13.3C340 13.2 344 13 348 12.9C352 12.8 356 12.6 360 12.6C364 12.6 368 12.6 372 12.9C376 13.2 380 13.6 384 14.2C388 14.7 392 15.5 396 16.2C400 16.9 404 17.8 408 18.4C412 19 416 19.5 420 19.9C424 20.3 428 20.4 432 20.5C436 20.6 440 20.5 444 20.5C448 20.5 452 20.4 456 20.5C460 20.5 464 20.6 468 20.8C472 20.9 476 21.2 480 21.3C484 21.5 488 21.7 492 21.7C496 21.7 500 21.7 504 21.4C508 21.2 512 20.7 516 20.3C520 19.8 524 19.2 528 18.7C532 18.3 536 17.8 540 17.5C544 17.3 548 17.2 552 17.2C556 17.3 560 17.5 564 17.7C568 18 572 18.4 576 18.6C580 18.8 584 19 588 19.1C592 19.2 596 19.1 600 19C604 18.9 608 18.6 612 18.5C616 18.3 620 18.1 624 18C628 18 632 18 636 18.2C640 18.3 644 18.5 648 18.7C652 18.8 656 19.1 660 19.1C664 19.1 668 19 672 18.8C676 18.5 680 18 684 17.4C688 16.9 692 16.1 696 15.5C700 14.9 704 14.1 708 13.6C712 13.1 716 12.7 720 12.5C724 12.3 728 12.2 732 12.2C736 12.2 740 12.3 744 12.3C748 12.3 752 12.4 756 12.3C760 12.3 764 12.1 768 12C772 11.9 776 11.6 780 11.6C784 11.5 788 11.4 792 11.5C796 11.7 800 12 804 12.4C808 12.9 812 13.6 816 14.2C820 14.8 824 15.6 828 16.2C832 16.8 836 17.4 840 17.7C844 18.1 848 18.3 852 18.3C856 18.4 860 18.3 864 18.2C868 18.1 872 17.9 876 17.9C880 17.8 884 17.8 888 17.9C892 18 896 18.2 900 18.4C904 18.6 908 18.9 912 19C916 19.2 920 19.3 924 19.2C928 19.2 932 18.9 936 18.7C940 18.4 944 18 948 17.7C952 17.4 956 17.1 960 17C964 16.9 968 16.9 972 17.1C976 17.2 980 17.7 984 18.1C988 18.5 992 19.1 996 19.5C1000 20 1004 20.5 1008 20.8C1012 21.1 1016 21.2 1020 21.3C1024 21.3 1028 21.2 1032 21.1C1036 21 1040 20.8 1044 20.8C1048 20.7 1052 20.7 1056 20.7C1060 20.8 1064 21 1068 21.1C1072 21.2 1076 21.4 1080 21.4C1084 21.4 1088 21.4 1092 21.1C1096 20.8 1100 20.4 1104 19.8C1108 19.3 1112 18.5 1116 17.8C1120 17.1 1124 16.2 1128 15.6C1132 15 1136 14.5 1140 14.1C1144 13.7 1148 13.6 1152 13.5C1156 13.4 1160 13.5 1164 13.5C1168 13.5 1172 13.6 1176 13.5C1180 13.5 1184 13.4 1188 13.2C1192 13.1 1196 12.8 1200 12.7C1204 12.5 1208 12.3 1212 12.3C1216 12.3 1220 12.3 1224 12.6C1228 12.8 1232 13.3 1236 13.7C1240 14.2 1244 14.8 1248 15.3C1252 15.7 1256 16.2 1260 16.5C1264 16.7 1268 16.8 1272 16.8C1276 16.7 1280 16.5 1284 16.3C1288 16 1292 15.6 1296 15.4C1300 15.2 1304 15 1308 14.9C1312 14.8 1316 14.9 1320 15C1324 15.1 1328 15.4 1332 15.5C1336 15.7 1340 15.9 1344 16C1348 16 1352 16 1356 15.8C1360 15.7 1364 15.5 1368 15.3C1372 15.2 1376 14.9 1380 14.9C1384 14.9 1388 15 1392 15.2C1396 15.5 1400 16 1404 16.6C1408 17.1 1412 17.9 1416 18.5C1420 19.1 1424 19.9 1428 20.4C1432 20.9 1436 21.3 1440 21.5L1440 30L0 30Z" fill="#5e5466" />
          </svg>
          <div className="absolute right-[24%] top-0 h-full w-[20%] overflow-hidden [background:linear-gradient(180deg,rgba(255,238,220,.85),rgba(255,228,205,.35)_60%,transparent)] [mask-image:linear-gradient(90deg,transparent,#000_30%,#000_70%,transparent)]">
            <div className="lkrf-shimmer absolute inset-x-0 -top-6 h-[calc(100%+48px)] [background:repeating-linear-gradient(180deg,transparent_0_9px,rgba(108,109,130,.55)_9px_12px,transparent_12px_17px,rgba(108,109,130,.3)_17px_24px)]" />
          </div>
          {GROUP_SECONDS.map((seconds, g) => (
            <svg key={g} className="lkrf-slide absolute left-0 top-0 h-full w-[200%]" style={{ animationDuration: `${seconds}s`, animationDirection: g === 1 ? "reverse" : "normal" }} viewBox="0 0 2880 300" preserveAspectRatio="none">
              {LINES.filter((l) => l[6] === g).map(([y, a, c, ph, light, w, , dash], i) => (
                <path key={i} d={wavePath(y, [[a, c, ph], [a * 0.4, c * 2 + 1, ph * 2]], 300, "none")} fill="none" stroke={light ? LIGHT_LINE : DARK_LINE} strokeOpacity={light ? 0.38 : 0.22} strokeWidth={w} strokeDasharray={dash} vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 pb-[330px] pt-20 sm:pt-24">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6a3f3a]">Larchmere Boathouse</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-[#2b1f27] sm:text-6xl">Rowing boats for hire from first light.</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#4b3942]">Quiet-hour rentals start at six, with a flask of coffee waiting on the jetty.</p>
        <a href="#" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#2b1f27] px-7 text-sm font-semibold text-[#fbefe6] transition hover:bg-[#453340] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b1f27] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efd8c8]">Reserve a dawn row</a>
      </div>
    </section>
  );
}
