import { useEffect, useRef } from "react";

// Ridge of spruce trees along the bottom edge.
const RIDGE = "M0 120L0 92L0 96L9 61L19 96L15 97L23 61L32 97L27 90L36 67L44 90L38 92L49 57L59 92L54 95L64 35L74 95L67 96L77 69L87 96L83 96L92 48L101 96L94 94L102 61L110 94L107 91L117 52L127 91L121 91L131 45L142 91L135 91L144 34L152 91L146 91L155 54L165 91L161 92L170 38L180 92L176 93L187 50L198 93L194 89L203 62L213 89L210 97L220 65L229 97L225 91L231 66L237 91L233 96L243 66L254 96L249 90L259 45L269 90L263 89L273 54L283 89L276 93L283 68L291 93L288 94L296 69L304 94L301 92L309 36L318 92L315 90L325 63L335 90L332 92L339 59L345 92L341 94L347 74L354 94L349 94L355 77L362 94L357 95L364 45L370 95L367 89L377 61L387 89L382 94L389 63L395 94L391 89L397 46L404 89L401 93L407 68L413 93L412 94L420 45L427 94L422 94L432 50L442 94L435 91L446 41L456 91L454 94L462 55L471 94L464 91L471 74L479 91L478 89L489 53L500 89L494 95L501 73L508 95L505 92L514 44L522 92L520 91L530 68L541 91L538 94L548 66L558 94L556 89L564 46L572 89L569 90L576 71L583 90L581 92L592 67L603 92L597 89L603 61L609 89L607 90L615 55L623 90L622 95L629 75L637 95L634 90L640 67L647 90L643 94L654 64L664 94L663 97L671 67L680 97L676 96L686 80L696 96L691 93L699 59L706 93L703 95L712 64L721 95L715 91L724 57L733 91L732 93L740 65L749 93L746 89L754 62L763 89L760 93L767 50L775 93L774 93L780 60L787 93L782 91L791 72L801 91L799 96L808 73L818 96L816 94L827 55L837 94L832 94L839 47L846 94L843 91L851 68L858 91L852 94L858 63L864 94L862 91L873 64L884 91L883 91L889 72L895 91L891 90L902 70L913 90L906 91L915 65L924 91L917 96L925 74L933 96L932 90L939 50L945 90L940 93L948 49L956 93L955 95L963 72L972 95L966 95L973 75L980 95L975 96L984 56L992 96L988 91L994 74L1000 91L997 96L1008 71L1019 96L1016 94L1026 61L1037 94L1032 90L1040 44L1048 90L1045 97L1053 57L1061 97L1055 96L1062 71L1070 96L1064 95L1074 44L1083 95L1077 93L1084 64L1091 93L1087 95L1095 38L1104 95L1103 94L1109 64L1115 94L1112 97L1121 62L1129 97L1124 97L1130 74L1136 97L1133 91L1141 61L1150 91L1147 94L1155 45L1163 94L1162 97L1171 68L1180 97L1178 91L1188 36L1198 91L1191 91L1201 50L1211 91L1209 91L1219 44L1228 91L1222 96L1230 76L1238 96L1236 92L1245 47L1254 92L1250 93L1260 67L1269 93L1265 95L1275 52L1285 95L1277 91L1284 56L1291 91L1291 92L1299 51L1307 92L1305 96L1312 47L1318 96L1314 97L1323 47L1332 97L1325 92L1334 56L1344 92L1338 96L1347 52L1355 96L1354 97L1364 60L1375 97L1370 95L1378 33L1386 95L1381 96L1390 36L1399 96L1395 93L1405 33L1415 93L1413 93L1424 42L1434 93L1426 95L1434 70L1442 95L1437 97L1447 59L1457 97L1440 94L1440 120Z";

const css = `
  /* Change these first:
     --nlc-green: main curtain colour (keep it soft, not neon)
     --nlc-rose: the faint colour at the top of the tallest curtain
     --nlc-speed: one sway cycle; larger is calmer
     .nlc-grain opacity: film grain strength */
  .nlc-hero { --nlc-green: 110, 214, 160; --nlc-rose: 168, 120, 176; --nlc-speed: 22s;
    position: relative; isolation: isolate; overflow: hidden; display: flex; align-items: center; min-height: 640px;
    background: linear-gradient(180deg, #04080f 0%, #08121d 50%, #0d1c26 100%); font-family: ui-sans-serif, system-ui, sans-serif; }
  .nlc-sky { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
  .nlc-stars { position: absolute; inset: 0 0 30% 0; opacity: .55;
    background-image: radial-gradient(1px 1px at 12% 18%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 27% 8%, #dfe8f5 50%, transparent 51%), radial-gradient(1.4px 1.4px at 44% 22%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 63% 12%, #e9eef8 50%, transparent 51%), radial-gradient(1px 1px at 78% 28%, #fff 50%, transparent 51%), radial-gradient(1.2px 1.2px at 91% 9%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 6% 40%, #cfd9ea 50%, transparent 51%), radial-gradient(1px 1px at 55% 36%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 86% 44%, #dbe4f2 50%, transparent 51%), radial-gradient(1px 1px at 35% 48%, #fff 50%, transparent 51%); }
  .nlc-curtain { position: absolute; left: -25%; width: 150%; mix-blend-mode: screen; transform-origin: 50% 100%;
    -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 45%, #000 70%, transparent 100%), linear-gradient(90deg, transparent 4%, #000 30%, #000 70%, transparent 96%);
    -webkit-mask-composite: source-in; mask-image: linear-gradient(180deg, transparent 0%, #000 45%, #000 70%, transparent 100%), linear-gradient(90deg, transparent 4%, #000 30%, #000 70%, transparent 96%); mask-composite: intersect;
    animation: nlc-sway var(--nlc-speed) ease-in-out infinite alternate; }
  .nlc-rays { position: absolute; inset: 0 -320px 0 0; filter: blur(5px);
    background: linear-gradient(0deg, rgba(var(--nlc-green), 0) 0%, rgba(var(--nlc-green), .85) 26%, rgba(var(--nlc-green), .32) 52%, rgba(var(--nlc-rose), .22) 76%, rgba(var(--nlc-rose), 0) 100%);
    -webkit-mask-image: repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0px, #000 9px, rgba(0,0,0,.5) 16px, rgba(0,0,0,.1) 27px, #000 41px, rgba(0,0,0,.35) 52px, rgba(0,0,0,.75) 66px, rgba(0,0,0,.12) 80px);
    mask-image: repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0px, #000 9px, rgba(0,0,0,.5) 16px, rgba(0,0,0,.1) 27px, #000 41px, rgba(0,0,0,.35) 52px, rgba(0,0,0,.75) 66px, rgba(0,0,0,.12) 80px);
    animation: nlc-shimmer 40s linear infinite; }
  .nlc-c1 { top: 4%; height: 62%; opacity: .9; rotate: -7deg; animation-delay: -9s; }
  .nlc-c2 { top: 14%; height: 50%; opacity: .55; rotate: 5deg; animation-duration: calc(var(--nlc-speed) * 1.3); animation-delay: -4s; }
  .nlc-c2 .nlc-rays { animation-duration: 55s; animation-direction: reverse; }
  .nlc-c3 { top: -6%; height: 58%; left: 10%; width: 110%; opacity: .4; rotate: -16deg; animation-duration: calc(var(--nlc-speed) * .8); animation-delay: -15s; }
  .nlc-glow { position: absolute; left: 0; right: 0; bottom: 0; height: 45%; background: radial-gradient(70% 90% at 40% 100%, rgba(var(--nlc-green), .16), transparent 70%); }
  .nlc-ridge { position: absolute; left: 0; bottom: 0; width: 100%; height: 110px; }
  .nlc-grain { position: absolute; inset: 0; opacity: .22; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23g%29'/%3E%3C/svg%3E"); }
  .nlc-hero[data-nlc-paused] * { animation-play-state: paused !important; }
  @keyframes nlc-sway { 0% { transform: translateX(-5%) skewX(-10deg) scaleY(.94); } 100% { transform: translateX(5%) skewX(8deg) scaleY(1.06); } }
  @keyframes nlc-shimmer { to { transform: translateX(-320px); } }
  @media (prefers-reduced-motion: reduce) { .nlc-hero * { animation: none !important; } }
`;

export default function NorthernLightsCurtainAurora() {
  const rootRef = useRef<HTMLElement>(null);

  // Pauses every animation while the hero is off screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([entry]) => root.toggleAttribute("data-nlc-paused", !entry.isIntersecting));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="nlc-hero relative isolate flex min-h-[640px] items-center overflow-hidden">
      <style>{css}</style>
      <div className="nlc-sky" aria-hidden="true">
        <div className="nlc-stars" />
        <div className="nlc-curtain nlc-c1"><div className="nlc-rays" /></div>
        <div className="nlc-curtain nlc-c2"><div className="nlc-rays" /></div>
        <div className="nlc-curtain nlc-c3"><div className="nlc-rays" /></div>
        <div className="nlc-glow" />
        <svg className="nlc-ridge" viewBox="0 0 1440 120" preserveAspectRatio="xMidYMax slice"><path d={RIDGE} fill="#03070b" /></svg>
        <div className="nlc-grain" />
      </div>
      <div className="relative mx-auto w-full max-w-5xl px-6 pb-[150px] pt-[120px] sm:px-10 sm:pb-40">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#b9e8cf]">Kettle Lake Cabins &middot; 68&deg; north</p>
        <h1 className="mt-[18px] max-w-[44rem] text-4xl font-semibold leading-[1.1] text-white [text-shadow:0_2px_24px_rgba(3,8,14,.5)] sm:text-6xl">Cabins far enough north to watch the sky move.</h1>
        <p className="mt-[22px] max-w-[34rem] text-lg leading-relaxed text-[#dbe7ee]">Six timber cabins on a frozen lake, a sauna by the shore and a guide who knocks on your door when the lights come out.</p>
        <a href="#" className="mt-9 inline-flex h-12 items-center rounded-[10px] bg-[#e9f6ef] px-[26px] text-[15px] font-semibold text-[#0b2a20] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9e8cf] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08121d]">Check winter dates</a>
      </div>
    </section>
  );
}
