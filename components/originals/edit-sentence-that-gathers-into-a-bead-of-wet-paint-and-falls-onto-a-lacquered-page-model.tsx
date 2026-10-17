import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Everything painted on the board. Change the business here. */
const site = {
  brand: "Halloway Flowers",
  links: ["Bouquets", "Weddings", "Visit"],
  headline: ["Flowers cut", "this morning."],
  sub: "Hand-tied in the shop on Mill Lane, ready by noon.",
  cta: "Order a bouquet",
  photo: { src: "https://images.pexels.com/photos/8127839/pexels-photo-8127839.jpeg?auto=compress&cs=tinysrgb&w=600", alt: "Deep red peonies in a steel vase against a grey wall" },
};

const BLUE = "#4F98FB";
const INK = "#0B0D12";
const PAPER = "#FBFAF7";
const WARM = "#DC7440";
const COOL = "#E3E6EA";
const NIGHT = "#12151C";
const sans = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

type Look = { header: 0 | 1; button: 0 | 1; body: 0 | 1 };
type Part = "header" | "button" | "body" | "reset";
const FRESH: Look = { header: 0, button: 0, body: 0 };

// Design pixels. The board is drawn at this size and the scene is scaled to fit.
const W = 560;
const H = 390;
const SCENE_W = 900;
const SCENE_H = 420;
/** Where each coat lands, and the shape it has to stay inside. */
const zones: Record<Part, { x: number; y: number; w: number; h: number; radius: string; cx: number; cy: number }> = {
  header: { x: 0, y: 0, w: W, h: 58, radius: "14px 14px 0 0", cx: 300, cy: 29 },
  button: { x: 36, y: 300, w: 184, h: 52, radius: "26px", cx: 128, cy: 326 },
  body: { x: 0, y: 0, w: W, h: H, radius: "14px", cx: 250, cy: 210 },
  reset: { x: 0, y: 0, w: W, h: H, radius: "14px", cx: 280, cy: 190 },
};
const chips: { part: Part; label: string }[] = [
  { part: "header", label: "Header" },
  { part: "button", label: "Button" },
  { part: "body", label: "Page" },
  { part: "reset", label: "Start again" },
];

/** What saying it does: the sentence, the look afterwards and the colour of the bead. */
function plan(look: Look, part: Part): { say: string; next: Look; paint: string } {
  if (part === "header") return look.header ? { say: "Cool the header down.", next: { ...look, header: 0 }, paint: look.body ? "#232936" : COOL } : { say: "Make the header warmer.", next: { ...look, header: 1 }, paint: WARM };
  if (part === "button") return look.button ? { say: "Make the button plain.", next: { ...look, button: 0 }, paint: look.body ? PAPER : INK } : { say: "Turn the button blue.", next: { ...look, button: 1 }, paint: BLUE };
  if (part === "body") return look.body ? { say: "Make the page light.", next: { ...look, body: 0 }, paint: PAPER } : { say: "Make the page dark.", next: { ...look, body: 1 }, paint: NIGHT };
  return { say: "Start again in white.", next: FRESH, paint: PAPER };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** The page as it is painted on the board, for one look. */
function Face({ look, hidden }: { look: Look; hidden?: boolean }) {
  const dark = look.body === 1;
  const text = dark ? "#F6F4EF" : INK;
  const soft = dark ? "#A9B0BF" : "#565B66";
  const head = look.header ? WARM : dark ? "#232936" : COOL;
  const headText = look.header ? INK : text;
  const btn = look.button ? BLUE : dark ? PAPER : INK;
  const btnText = look.button ? INK : dark ? INK : "#FFFFFF";
  const Title = hidden ? "p" : "h2";
  return (
    <div aria-hidden={hidden ? "true" : undefined} className="absolute inset-0" style={{ background: dark ? NIGHT : PAPER }}>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-[26px]" style={{ height: 58, background: head, color: headText }}>
        <span className="flex items-center gap-[9px] text-[15px] font-extrabold tracking-[-0.025em]">
          <span aria-hidden="true" className="h-[10px] w-[10px] rounded-full" style={{ background: look.header ? INK : BLUE }} />
          {site.brand}
        </span>
        <span className="flex items-center gap-[20px] text-[11.5px] font-bold">
          {site.links.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </span>
      </div>
      <Title className="absolute left-[36px] top-[98px] text-[50px] font-black leading-[0.95] tracking-[-0.055em]" style={{ color: text }}>
        {site.headline.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </Title>
      <p className="absolute left-[38px] top-[216px] w-[250px] text-[13.5px] font-semibold leading-snug" style={{ color: soft }}>
        {site.sub}
      </p>
      <span className="absolute flex items-center justify-center gap-2 text-[15px] font-extrabold tracking-[-0.02em]" style={{ left: 36, top: 300, width: 184, height: 52, borderRadius: 26, background: btn, color: btnText }}>
        {site.cta}
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10h12M11 5l5 5-5 5" />
        </svg>
      </span>
      <div className="absolute overflow-hidden" style={{ left: 352, top: 86, width: 176, height: 270, borderRadius: 12, background: "#8d8f93", boxShadow: dark ? "0 0 0 1px rgba(255,255,255,0.10)" : "0 0 0 1px rgba(11,13,18,0.08)" }}>
        <img src={site.photo.src} alt={hidden ? "" : site.photo.alt} width={176} height={270} draggable={false} className="h-full w-full object-cover" />
      </div>
    </div>
  );
}

export default function PaintBeadPageEdit() {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  const swatchRef = useRef<HTMLSpanElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const coatRef = useRef<HTMLDivElement>(null);
  const rimBoxRef = useRef<HTMLDivElement>(null);
  const rimRef = useRef<SVGSVGElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const wetRef = useRef<HTMLDivElement>(null);
  const beadRef = useRef<HTMLDivElement>(null);
  const first = plan(FRESH, "header");
  const [cur, setCur] = useState<Look>(reduce ? first.next : FRESH);
  const [next, setNext] = useState<Look>(first.next);
  const [status, setStatus] = useState("");
  const api = useRef<{ say: (p: Part) => void } | null>(null);

  useEffect(() => {
    const stage = stageRef.current, pill = pillRef.current, typed = typedRef.current, swatch = swatchRef.current, wrap = wrapRef.current, scene = sceneRef.current;
    const board = boardRef.current, coat = coatRef.current, rimBox = rimBoxRef.current, rim = rimRef.current, spot = spotRef.current, bead = beadRef.current, wet = wetRef.current;
    if (!stage || !pill || !typed || !swatch || !wrap || !scene || !board || !coat || !rimBox || !rim || !spot || !bead || !wet) return;

    // one coat of paint from sentence to dry
    const s = {
      look: reduce ? first.next : FRESH, // what is dry on the board
      to: first.next,
      part: "header" as Part,
      say: first.say,
      paint: first.paint,
      phase: reduce ? "rest" : "swell",
      t0: performance.now() + 500,
      slow: 2.3, // the first coat runs slower so a still picture catches it half way
      x0: 0, y0: 0, x1: 0, y1: 0,
      R: 0,
      dip: 0, vdip: 0,
      px: 0, py: 0, tx: 0, ty: 0,
      scale: 1,
      demo: 0,
      user: -1e9,
      held: false,
      ph: [0.4, 2.1, 4.4],
    };
    let raf = 0;
    let visible = true;
    let last = performance.now();
    const TYPE = 26, SWELL = 400, FALL = 380, SPREAD = 1500, DRY = 1900, GAP = 650;

    const measure = () => {
      const sc = clamp(wrap.clientWidth / 700, 0.42, 1.2);
      s.scale = sc;
      wrap.style.height = `${Math.round(SCENE_H * sc)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);

    const lips = rim.querySelectorAll("path");
    /** The coat is a puddle, not a compass circle: its edge runs ahead in some directions and lags in others. */
    const setCoat = (r: number, wetness: number) => {
      const z = zones[s.part];
      const lag = 0.11 * (1 - (r / (s.R || 1)) * 0.6);
      let d = "";
      for (let i = 0; i < 44; i++) {
        const a = (i / 44) * Math.PI * 2;
        const rr = r * (1 + lag * (Math.sin(3 * a + s.ph[0]) * 0.5 + Math.sin(5 * a + s.ph[1]) * 0.32 + Math.sin(8 * a + s.ph[2]) * 0.18));
        d += `${i ? "L" : "M"}${(z.cx + Math.cos(a) * rr).toFixed(1)} ${(z.cy + Math.sin(a) * rr).toFixed(1)}`;
      }
      d += "Z";
      coat.style.clipPath = `path("${d}")`;
      wet.style.clipPath = `path("${d}")`;
      wet.style.opacity = wetness.toFixed(3);
      lips.forEach((l) => l.setAttribute("d", d));
    };
    const aim = () => {
      const z = zones[s.part];
      rimBox.style.left = `${z.x}px`;
      rimBox.style.top = `${z.y}px`;
      rimBox.style.width = `${z.w}px`;
      rimBox.style.height = `${z.h}px`;
      rimBox.style.borderRadius = z.radius;
      rim.style.left = `${-z.x}px`;
      rim.style.top = `${-z.y}px`;
      wet.style.left = `${-z.x}px`;
      wet.style.top = `${-z.y}px`;
      s.ph = [Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3];
      spot.style.left = `${z.cx}px`;
      spot.style.top = `${z.cy}px`;
      s.R = Math.hypot(Math.max(z.cx - z.x, z.x + z.w - z.cx), Math.max(z.cy - z.y, z.y + z.h - z.cy)) * 1.14 + 8;
      swatch.style.background = s.paint;
      bead.style.setProperty("--paint", s.paint);
    };
    /** Where the bead leaves the bar and where it lands, in stage pixels. */
    const sight = () => {
      const sr = stage.getBoundingClientRect(), pr = pill.getBoundingClientRect(), tr = spot.getBoundingClientRect();
      s.x1 = tr.left + tr.width / 2 - sr.left;
      s.y1 = tr.top + tr.height / 2 - sr.top;
      s.x0 = clamp(s.x1, pr.left - sr.left + 44, pr.right - sr.left - 44);
      s.y0 = pr.bottom - sr.top;
    };

    const begin = (part: Part, now: number, typeIt: boolean) => {
      // whatever was wet becomes the dry coat underneath
      s.look = s.to;
      setCur(s.to);
      const p = plan(s.look, part);
      s.part = part;
      s.to = p.next;
      s.say = p.say;
      s.paint = p.paint;
      aim();
      setCoat(0, 0);
      rim.style.opacity = "0";
      setNext(p.next);
      setStatus(p.say);
      if (reduce) {
        typed.textContent = p.say;
        s.look = p.next;
        setCur(p.next);
        s.phase = "rest";
        return;
      }
      s.slow = 1;
      s.phase = typeIt ? "type" : "swell";
      s.t0 = now;
    };
    aim();
    setCoat(0, 0);
    typed.textContent = s.say;

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const t = now - s.t0;
      const size = 40 * s.scale + 10;

      if (s.phase === "type") {
        const n = Math.min(s.say.length, Math.floor(t / TYPE));
        if (typed.dataset.n !== `${s.part}${n}`) {
          typed.dataset.n = `${s.part}${n}`;
          typed.textContent = s.say.slice(0, n);
        }
        if (n >= s.say.length && t > s.say.length * TYPE + 160) {
          s.phase = "swell";
          s.t0 = now;
        }
      } else if (s.phase === "swell" && t >= 0) {
        if (t < 20 || !s.x0) sight();
        const k = clamp(t / SWELL, 0, 1);
        const g = easeOut(k);
        const sway = Math.sin(t / 60) * (1 - k) * 0.06;
        bead.style.opacity = "1";
        bead.style.width = `${size}px`;
        bead.style.height = `${size}px`;
        bead.style.transform = `translate(${(s.x0 - size / 2).toFixed(1)}px, ${(s.y0 - size * (1 - 0.72 * g)).toFixed(1)}px) scale(${(0.35 + 0.65 * g + sway).toFixed(3)}, ${(0.35 + 0.65 * g + 0.22 * k * k).toFixed(3)})`;
        if (k >= 1) {
          sight();
          s.phase = "fall";
          s.t0 = now;
        }
      } else if (s.phase === "fall") {
        const k = clamp(t / FALL, 0, 1);
        const y = s.y0 - size * 0.28 + (s.y1 - size * 0.5 - (s.y0 - size * 0.28)) * k * k;
        const x = s.x0 + (s.x1 - s.x0) * k;
        bead.style.transform = `translate(${(x - size / 2).toFixed(1)}px, ${y.toFixed(1)}px) scale(${(1 - 0.16 * k).toFixed(3)}, ${(1.1 + 0.34 * k).toFixed(3)})`;
        spot.style.opacity = (0.5 * k * k).toFixed(3);
        spot.style.transform = `translate(-50%, -50%) scale(${(2.6 - 1.6 * k).toFixed(3)})`;
        if (k >= 1) {
          bead.style.opacity = "0";
          spot.style.opacity = "0";
          s.vdip = -230;
          s.phase = "spread";
          s.t0 = now;
        }
      } else if (s.phase === "spread") {
        const k = clamp(t / (SPREAD * s.slow), 0, 1);
        // fast out of the splash, then slow like something thick
        const r = s.R * (0.14 * easeOut(clamp(k * 9 * s.slow, 0, 1)) + 0.86 * (1 - Math.pow(1 - k, s.slow > 1 ? 1.25 : 2)));
        setCoat(r, 1);
        rim.style.opacity = clamp((1 - k) * 5, 0, 1).toFixed(3);
        if (k >= 1) {
          s.look = s.to;
          setCur(s.to);
          s.phase = "dry";
          s.t0 = now;
        }
      } else if (s.phase === "dry") {
        const k = clamp(t / DRY, 0, 1);
        setCoat(s.R, 1 - easeOut(k));
        if (k >= 1) {
          s.phase = "rest";
          s.t0 = now;
        }
      } else if (s.phase === "rest" && !reduce && t > GAP && now - s.user > 9000) {
        s.demo = (s.demo + 1) % chips.length;
        begin(chips[s.demo].part, now, true);
      }

      // the board takes the hit and settles; the gloss follows the pointer
      s.vdip += (-430 * s.dip - 17 * s.vdip) * dt;
      s.dip += s.vdip * dt;
      s.px += (s.tx - s.px) * 0.07;
      s.py += (s.ty - s.py) * 0.07;
      const idle = reduce ? 0 : Math.sin(now / 2400) * 1.4;
      board.style.transform = `rotateX(${(55 - s.py * 3).toFixed(2)}deg) rotateZ(${(-17 + s.px * 4 + idle).toFixed(2)}deg) translateZ(${s.dip.toFixed(2)}px)`;
      board.style.setProperty("--gx", `${(74 + s.px * 22 + idle * 3).toFixed(1)}%`);
      if (visible) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(stage);
    raf = requestAnimationFrame(tick);

    const move = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      s.tx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
      s.ty = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
    };
    const leave = () => {
      s.tx = 0;
      s.ty = 0;
      s.held = false;
    };
    const enter = () => {
      s.held = true;
    };
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerleave", leave);
    stage.addEventListener("pointerenter", enter);

    api.current = {
      say: (part) => {
        const now = performance.now();
        s.user = now;
        s.demo = chips.findIndex((c) => c.part === part);
        bead.style.opacity = "0";
        spot.style.opacity = "0";
        begin(part, now, true);
      },
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
      stage.removeEventListener("pointerenter", enter);
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  return (
    <section className="relative overflow-hidden bg-[#F6F4EF] px-4 pb-10 pt-10 sm:pb-14 sm:pt-14" style={{ fontFamily: sans }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 62% at 50% 58%, #FFFFFF 0%, #F6F4EF 46%, #E9E5DC 100%)" }} />
      <div ref={stageRef} className="relative mx-auto w-full max-w-[900px]">
        {/* the sentence */}
        <div className="relative z-30 flex justify-center">
          <div ref={pillRef} className="flex h-[58px] w-full max-w-[470px] items-center gap-3 rounded-full pl-[10px] pr-6 sm:h-[64px]" style={{ background: "linear-gradient(180deg, #1d212b 0%, #0B0D12 60%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.9), 0 18px 30px -14px rgba(11,13,18,0.45)" }}>
            <span aria-hidden="true" className="relative h-[38px] w-[38px] shrink-0 rounded-full sm:h-[44px] sm:w-[44px]" style={{ background: "#07080b", boxShadow: "inset 0 2px 5px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.12)" }}>
              <span ref={swatchRef} className="absolute inset-[5px] rounded-full" style={{ background: WARM, boxShadow: "inset 0 3px 4px rgba(255,255,255,0.45), inset 0 -4px 6px rgba(0,0,0,0.3)" }} />
            </span>
            <p className="min-w-0 flex-1 truncate text-[18px] font-extrabold tracking-[-0.03em] text-white sm:text-[22px]">
              <span ref={typedRef}>{first.say}</span>
              <span aria-hidden="true" className="edit-sentence-paint-bead-caret ml-[3px] inline-block h-[20px] w-[3px] translate-y-[3px] rounded-full sm:h-[24px]" style={{ background: BLUE }} />
            </p>
          </div>
        </div>

        {/* the bead of paint, in stage pixels */}
        <div
          ref={beadRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-20"
          style={{
            width: 40,
            height: 40,
            opacity: 0,
            transformOrigin: "50% 0%",
            borderRadius: "50% 50% 50% 50% / 58% 58% 42% 42%",
            background: "radial-gradient(circle at 34% 30%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 6%, rgba(255,255,255,0.22) 15%, rgba(255,255,255,0) 30%), radial-gradient(circle at 62% 80%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 34%), radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.30) 100%), var(--paint, #DC7440)",
            boxShadow: "0 0 0 0.5px rgba(11,13,18,0.18), 0 10px 14px -6px rgba(11,13,18,0.35)",
          }}
        />

        <div ref={wrapRef} className="relative z-10 mt-2 w-full sm:mt-4" style={{ height: SCENE_H }}>
          <div ref={sceneRef} className="absolute left-1/2 top-0" style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "1500px", perspectiveOrigin: "50% 20%" }}>
            <div ref={boardRef} className="absolute" style={{ left: SCENE_W / 2, top: 204, width: 0, height: 0, transformStyle: "preserve-3d", transform: "rotateX(55deg) rotateZ(-17deg)", ["--gx" as string]: "74%" }}>
              {/* shadow on the table */}
              <div aria-hidden="true" className="absolute" style={{ left: -W / 2 + 26, top: -H / 2 + 44, width: W, height: H, borderRadius: 30, background: "rgba(60,48,26,0.5)", filter: "blur(38px)", transform: "translateZ(-70px)" }} />
              <div aria-hidden="true" className="absolute" style={{ left: -W / 2 + 4, top: -H / 2 + 8, width: W, height: H, borderRadius: 16, background: "rgba(40,30,12,0.55)", filter: "blur(9px)", transform: "translateZ(-24px)" }} />
              {/* the thickness of the board: raw edge under a painted face */}
              {[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((i) => (
                <div key={i} aria-hidden="true" className="absolute" style={{ left: -W / 2, top: -H / 2, width: W, height: H, borderRadius: 14, background: i > 9 ? "#a39a88" : i % 2 ? "#d9d2c3" : "#cdc5b4", transform: `translateZ(${-i * 2}px)` }} />
              ))}
              <div className="absolute overflow-hidden" style={{ left: -W / 2, top: -H / 2, width: W, height: H, borderRadius: 14 }}>
                <Face look={cur} />
                {/* the new coat, let out from where the bead landed */}
                <div ref={coatRef} className="absolute inset-0" style={{ clipPath: "circle(0px at 0px 0px)" }}>
                  <Face look={next} hidden />
                </div>
                {/* the thick wet lip at the edge of the coat */}
                <div ref={rimBoxRef} aria-hidden="true" className="pointer-events-none absolute overflow-hidden">
                  <div ref={wetRef} className="absolute" style={{ width: W, height: H, opacity: 0, background: "linear-gradient(100deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.34) 37%, rgba(255,255,255,0.04) 47%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.14) 80%, rgba(255,255,255,0) 92%), linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.10) 100%)" }} />
                  <svg ref={rimRef} className="absolute" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{ opacity: 0, overflow: "visible" }}>
                    <path stroke="rgba(11,13,18,0.30)" strokeWidth="7" transform="translate(3 4)" style={{ filter: "blur(3px)" }} />
                    <path stroke="rgba(255,255,255,0.20)" strokeWidth="16" />
                    <path stroke="rgba(255,255,255,0.78)" strokeWidth="2.2" />
                  </svg>
                </div>
                <div ref={spotRef} aria-hidden="true" className="pointer-events-none absolute h-[34px] w-[34px] rounded-full" style={{ opacity: 0, transform: "translate(-50%, -50%)", background: "radial-gradient(circle, rgba(11,13,18,0.75) 0%, rgba(11,13,18,0) 68%)" }} />
                {/* lacquer: one broad band of studio light and a hard top edge */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(104deg, rgba(255,255,255,0) calc(var(--gx) - 30%), rgba(255,255,255,0.13) calc(var(--gx) - 6%), rgba(255,255,255,0.03) calc(var(--gx) + 4%), rgba(255,255,255,0) calc(var(--gx) + 26%))" }} />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ borderRadius: 14, boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.8), inset 1.5px 0 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(11,13,18,0.14), inset -2px 0 0 rgba(11,13,18,0.10)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* say it yourself */}
        <div className="relative z-30 mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8">
          {chips.map((c) => (
            <button
              key={c.part}
              type="button"
              onClick={() => api.current?.say(c.part)}
              aria-label={plan(cur, c.part).say}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#0B0D12]/10 bg-white px-5 text-[13px] font-extrabold tracking-[-0.01em] text-[#0B0D12] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_6px_14px_-8px_rgba(11,13,18,0.35)] transition hover:-translate-y-px hover:border-[#0B0D12]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F4EF] active:translate-y-0"
            >
              <span aria-hidden="true" className="h-[10px] w-[10px] rounded-full" style={{ background: plan(cur, c.part).paint, boxShadow: "inset 0 0 0 1px rgba(11,13,18,0.18)" }} />
              {c.label}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="sr-only">
          {status}
        </p>
      </div>
      <style>{`
        @keyframes edit-sentence-paint-bead-caret-blink { 0%, 55% { opacity: 1 } 56%, 100% { opacity: 0 } }
        .edit-sentence-paint-bead-caret { animation: edit-sentence-paint-bead-caret-blink 1.1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) { .edit-sentence-paint-bead-caret { animation: none; } }
      `}</style>
    </section>
  );
}
