import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Pose = { shot: 0 | 1; at: string; zoom?: number; flip?: boolean };

/** One slot per person: two sittings, cut into four poses. `tone` shows until a picture arrives. */
const people: { name: string; role: string; tone: string; shots: [{ src: string; alt: string }, { src: string; alt: string }]; poses: [Pose, Pose, Pose, Pose] }[] = [
  {
    name: "Halima Sesay",
    role: "Runs the press",
    tone: "#7f9fe0",
    shots: [
      { src: "https://images.pexels.com/photos/15520549/pexels-photo-15520549.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Smiling woman in a lilac headscarf and pink blouse leaning on a table, blue backdrop" },
      { src: "https://images.pexels.com/photos/15520550/pexels-photo-15520550.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "The same woman laughing with one hand raised to her shoulder" },
    ],
    poses: [
      { shot: 0, at: "50% 22%", zoom: 1.5 },
      { shot: 1, at: "56% 20%", zoom: 1.7 },
      { shot: 0, at: "50% 26%", zoom: 2.3 },
      { shot: 1, at: "50% 30%", zoom: 1.25, flip: true },
    ],
  },
  {
    name: "Winston Adeyemi",
    role: "Mixes the inks",
    tone: "#f3a9c8",
    shots: [
      { src: "https://images.pexels.com/photos/4584605/pexels-photo-4584605.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Bald man in a pink T-shirt raising his eyebrows at the camera, pink backdrop" },
      { src: "https://images.pexels.com/photos/4584606/pexels-photo-4584606.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "The same man turned side on, glancing back over his shoulder" },
    ],
    poses: [
      { shot: 0, at: "50% 34%", zoom: 1.7 },
      { shot: 1, at: "62% 16%", zoom: 1.7 },
      { shot: 0, at: "50% 36%", zoom: 2.6 },
      { shot: 1, at: "60% 20%", zoom: 1.3, flip: true },
    ],
  },
  {
    name: "Folake Obi",
    role: "Sets the type",
    tone: "#46525f",
    shots: [
      { src: "https://images.pexels.com/photos/9971680/pexels-photo-9971680.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Woman in patterned pink glasses and a plum shirt frowning with arms folded, slate backdrop" },
      { src: "https://images.pexels.com/photos/9971718/pexels-photo-9971718.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "The same woman looking straight into the lens with her head tilted" },
    ],
    poses: [
      { shot: 1, at: "52% 24%", zoom: 1.6 },
      { shot: 0, at: "50% 20%", zoom: 1.6 },
      { shot: 1, at: "54% 28%", zoom: 2.4 },
      { shot: 0, at: "50% 22%", zoom: 1.2, flip: true },
    ],
  },
  {
    name: "Caspar Lund",
    role: "Trims and binds",
    tone: "#b03a26",
    shots: [
      { src: "https://images.pexels.com/photos/8727463/pexels-photo-8727463.jpeg?auto=compress&cs=tinysrgb&w=500", alt: "Red haired man with a short beard in profile, brick red backdrop" },
      { src: "https://images.pexels.com/photos/8727340/pexels-photo-8727340.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "The same man in a long white top looking down with his arms held out" },
    ],
    poses: [
      { shot: 0, at: "40% 36%", zoom: 1.35 },
      { shot: 1, at: "50% 27%", zoom: 2.9 },
      { shot: 0, at: "44% 40%", zoom: 1.9, flip: true },
      { shot: 1, at: "50% 30%", zoom: 1.5 },
    ],
  },
  {
    name: "Emeka Bright",
    role: "Keeps the books",
    tone: "#1f7180",
    shots: [
      { src: "https://images.pexels.com/photos/36440745/pexels-photo-36440745.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Man in a checked wool coat resting his head on his hand, teal backdrop" },
      { src: "https://images.pexels.com/photos/36440743/pexels-photo-36440743.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "The same man with a hand at the back of his neck, eyes closed" },
    ],
    poses: [
      { shot: 0, at: "52% 12%", zoom: 2.5 },
      { shot: 1, at: "66% 8%", zoom: 2.6 },
      { shot: 0, at: "50% 22%", zoom: 1.5 },
      { shot: 0, at: "52% 13%", zoom: 3.3, flip: true },
    ],
  },
];

const club = "Saltmarsh Print Club";

// Design pixels: the booth panel is drawn at this size and scaled to the frame.
const SCENE_W = 940;
const SCENE_H = 660;
const PITCH = 166; // slot to slot
const SLIT_Y = 116; // where paper leaves the fascia
const STRIP_W = 116;
const FRAME_H = 104;
const GAP = 6;
const FOOT = 34;
const LEN = 8 + FRAME_H * 4 + GAP * 3 + FOOT;
const FIRST_X = (SCENE_W - PITCH * (people.length - 1)) / 2;

// the pendulum, in degrees and seconds
const PULL = 24; // how hard a strip is drawn back to plumb
const DRAG = 0.85; // air on paper
const GRAVITY = 2600;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const steel = "repeating-linear-gradient(90deg,rgba(255,255,255,0.07) 0 1px,rgba(0,0,0,0.035) 1px 2px,rgba(255,255,255,0) 2px 5px), linear-gradient(180deg,#f3f4f4 0%,#c9cdcf 22%,#e8eaeb 50%,#9da3a7 82%,#bcc1c4 100%)";
const grain = "radial-gradient(circle at 24% 30%, rgba(255,255,255,0.05) 0 0.6px, rgba(0,0,0,0) 1.1px), radial-gradient(circle at 70% 66%, rgba(0,0,0,0.22) 0 0.7px, rgba(0,0,0,0) 1.2px)";

type Body = { a: number; w: number; y: number; vy: number; mode: "hang" | "drop" | "feed"; step: number; wait: number; ph: number };

export default function PhotoBoothTeamStrips() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const stripRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bodies = useRef<Body[]>(people.map((_, i) => ({ a: [1.4, -0.9, 0.6, -1.3, 0.8][i % 5], w: 0, y: 0, vy: 0, mode: "hang", step: 4, wait: 0, ph: i * 1.7 })));
  const hold = useRef({ scale: 1, touched: false, over: false, lastX: 0, lastT: 0 });
  const [turn, setTurn] = useState<number[]>(people.map(() => 0));
  const [busy, setBusy] = useState(-1);
  const [focus, setFocus] = useState(2);
  const pan = useSpring(0, { stiffness: 90, damping: 18 });

  const place = useCallback(
    (jump: boolean) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const w = wrap.clientWidth;
      const sc = clamp(w / SCENE_W, 0.74, 1.1);
      hold.current.scale = sc;
      wrap.style.height = `${Math.round(SCENE_H * sc + (w < 640 ? 34 : 0))}px`;
      const centre = (FIRST_X + PITCH * focus) * sc;
      const x = SCENE_W * sc <= w ? (w - SCENE_W * sc) / 2 : clamp(w / 2 - centre, w - SCENE_W * sc + 40 * sc, -40 * sc);
      if (sceneRef.current) sceneRef.current.style.transform = `scale(${sc.toFixed(4)})`;
      if (jump || reduce) pan.jump(x);
      else pan.set(x);
    },
    [focus, pan, reduce],
  );
  useEffect(() => {
    place(true);
    const ro = new ResizeObserver(() => place(true));
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => place(false), [place]);

  /** Let go of the strip that is hanging and print that person again. */
  const print = useCallback(
    (i: number) => {
      const b = bodies.current[i];
      if (reduce) {
        setTurn((t) => t.map((v, k) => (k === i ? v + 1 : v)));
        return;
      }
      if (b.mode !== "hang") return;
      b.mode = "drop";
      b.vy = 60;
      b.w += b.a >= 0 ? 26 : -26;
    },
    [reduce],
  );

  // one loop moves every strip: sway, fall, and the four clunks of a new one feeding out
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let last = 0;
    let visible = true;
    const draw = (i: number) => {
      const b = bodies.current[i];
      const el = stripRefs.current[i];
      const sh = shadeRefs.current[i];
      if (el) {
        el.style.transform = `rotate(${b.a.toFixed(3)}deg) translate3d(0,${b.y.toFixed(2)}px,0)`;
        el.style.setProperty("--lean", b.a.toFixed(2));
      }
      if (sh) sh.style.transform = `rotate(${(b.a * 1.14 + 0.9).toFixed(3)}deg) translate3d(0,${b.y.toFixed(2)}px,0)`;
    };
    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.032, last ? (now - last) / 1000 : 0.016);
      last = now;
      const t = now / 1000;
      bodies.current.forEach((b, i) => {
        if (b.mode === "drop") {
          b.vy += GRAVITY * dt;
          b.y += b.vy * dt;
          b.a += b.w * dt;
          if (b.y > SCENE_H + 120) {
            b.mode = "feed";
            b.y = -LEN;
            b.a = 0;
            b.w = 0;
            b.vy = 0;
            b.step = 0;
            b.wait = 0.34;
            setTurn((v) => v.map((n, k) => (k === i ? n + 1 : n)));
            setBusy(i);
          }
        } else {
          const feeding = b.mode === "feed";
          if (feeding) {
            b.wait -= dt;
            if (b.wait <= 0 && b.step < 4) {
              b.step += 1;
              b.wait = 0.36;
              b.w += b.step % 2 ? 9 : -9;
            }
            const to = -LEN * (1 - b.step / 4);
            b.y += (to - b.y) * Math.min(1, dt * 17);
            if (b.step === 4 && Math.abs(to - b.y) < 0.4) {
              b.y = 0;
              b.mode = "hang";
              b.w += 14;
              setBusy((cur) => (cur === i ? -1 : cur));
            }
          }
          const out = 1 + b.y / LEN; // a short tongue of paper is stiff, a full strip is loose
          const draught = (Math.sin(t * 0.9 + b.ph) * 26 + Math.sin(t * 2.3 + b.ph * 2.1) * 12) * out;
          const acc = -(PULL + (1 - out) * 220) * b.a - (DRAG + (1 - out) * 7) * b.w + draught;
          b.w += acc * dt;
          b.a = clamp(b.a + b.w * dt, -38, 38);
        }
        draw(i);
      });
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      start();
    });
    if (wrapRef.current) io.observe(wrapRef.current);
    document.addEventListener("visibilitychange", start);
    start();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", start);
    };
  }, [reduce]);

  // the booth reprints one person after another until somebody takes over
  useEffect(() => {
    if (reduce) return;
    const order = [1, 3, 0, 4, 2];
    let n = 0;
    const go = () => {
      const s = hold.current;
      if (s.touched || s.over || document.hidden) return;
      const i = order[n % order.length];
      n += 1;
      setFocus(i);
      print(i);
    };
    const first = window.setTimeout(go, 3000);
    const loop = window.setInterval(go, 4600);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
    };
  }, [print, reduce]);

  // a pointer passing through a strip pushes it, harder the lower down it is caught
  const onMove = (e: React.PointerEvent) => {
    const wrap = wrapRef.current;
    if (!wrap || reduce) return;
    const s = hold.current;
    const r = wrap.getBoundingClientRect();
    const x = (e.clientX - r.left - pan.get()) / s.scale;
    const y = (e.clientY - r.top) / s.scale;
    const dx = x - s.lastX;
    const fresh = e.timeStamp - s.lastT < 80;
    s.lastX = x;
    s.lastT = e.timeStamp;
    if (!fresh || y < SLIT_Y || y > SLIT_Y + LEN + 20) return;
    bodies.current.forEach((b, i) => {
      if (b.mode !== "hang") return;
      const lever = (y - SLIT_Y) / LEN;
      const cx = FIRST_X + PITCH * i - Math.sin((b.a * Math.PI) / 180) * (y - SLIT_Y);
      if (Math.abs(x - cx) < STRIP_W / 2 + 6) b.w = clamp(b.w + dx * 0.62 * lever, -150, 150);
    });
  };

  const choose = (i: number) => {
    hold.current.touched = true;
    setFocus(i);
    print(i);
  };
  const step = (d: number) => {
    hold.current.touched = true;
    setFocus((f) => clamp(f + d, 0, people.length - 1));
  };

  return (
    <section aria-label={`The people of ${club}`} className="relative overflow-hidden bg-[#131110]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: `${grain}, radial-gradient(85% 80% at 50% 30%, #4b433f 0%, #2b2623 48%, #110f0e 100%)`, backgroundSize: "5px 7px, 11px 13px, auto" }} />
      <div ref={wrapRef} onPointerMove={onMove} onPointerEnter={() => (hold.current.over = true)} onPointerLeave={() => (hold.current.over = false)} className="relative w-full overflow-hidden" style={{ height: SCENE_H }}>
        <motion.div className="absolute left-0 top-0" style={{ x: pan }}>
          <div ref={sceneRef} className="relative origin-top-left" style={{ width: SCENE_W, height: SCENE_H }}>
            <ul className="m-0 list-none p-0">
              {people.map((p, i) => {
                const cx = FIRST_X + PITCH * i;
                const poses = p.poses.map((_, k) => p.poses[(k + turn[i]) % 4]);
                const seen = new Set<number>();
                return (
                  <li key={p.name}>
                    {/* everything below the slit; paper above it is still inside the machine */}
                    <div className="absolute" style={{ left: cx, top: SLIT_Y, width: 0, height: 0 }}>
                      <div className="absolute left-0 top-0" style={{ clipPath: "inset(0px -500px -900px -500px)" }}>
                        <div
                          ref={(el) => {
                            shadeRefs.current[i] = el;
                          }}
                          aria-hidden="true"
                          className="absolute rounded-[3px]"
                          style={{ left: -STRIP_W / 2 + 13, top: 4, width: STRIP_W, height: LEN, transformOrigin: `${STRIP_W / 2 - 13}px -4px`, transform: `rotate(${(bodies.current[i].a * 1.14 + 0.9).toFixed(2)}deg)`, background: "linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,0.7))", filter: "blur(9px)", willChange: "transform" }}
                        />
                        <div
                          ref={(el) => {
                            stripRefs.current[i] = el;
                          }}
                          className="absolute rounded-[2px]"
                          style={{
                            left: -STRIP_W / 2,
                            top: 0,
                            width: STRIP_W,
                            height: LEN,
                            transformOrigin: "50% 0",
                            transform: `rotate(${bodies.current[i].a}deg)`,
                            willChange: "transform",
                            backgroundColor: "#f4efe3",
                            backgroundImage: "linear-gradient(90deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0) 9%,rgba(255,255,255,0.5) 46%,rgba(0,0,0,0) 86%,rgba(0,0,0,0.14) 100%), linear-gradient(180deg,#e9e3d4 0%,#f8f4ea 12%,#f3eee1 70%,#fffdf6 100%)",
                            boxShadow: "0 0 0 0.5px rgba(0,0,0,0.35), 1px 1px 0 rgba(255,255,255,0.5) inset, -1px -1px 0 rgba(0,0,0,0.12) inset",
                          }}
                        >
                          <div className="absolute inset-x-[7px] top-[8px] flex flex-col" style={{ gap: GAP }}>
                            {poses.map((pose, k) => {
                              const shot = p.shots[pose.shot];
                              const first = !seen.has(pose.shot);
                              seen.add(pose.shot);
                              return (
                                <div key={k} className="relative overflow-hidden" style={{ height: FRAME_H, backgroundColor: p.tone }}>
                                  <img
                                    src={shot.src}
                                    alt={first ? shot.alt : ""}
                                    draggable={false}
                                    className="h-full w-full object-cover"
                                    style={{ objectPosition: pose.at, transformOrigin: pose.at, transform: `scale(${(pose.flip ? -1 : 1) * (pose.zoom ?? 1)}, ${pose.zoom ?? 1})` }}
                                  />
                                  <div aria-hidden="true" className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.18), inset 0 0 14px rgba(0,0,0,0.22)" }} />
                                </div>
                              );
                            })}
                          </div>
                          <div className="absolute inset-x-[8px] bottom-[7px]">
                            <p className="truncate font-mono text-[8px] font-bold uppercase leading-[1.25] tracking-[0.1em] text-[#1c1a17]">{p.name}</p>
                            <p className="flex justify-between font-mono text-[6.5px] uppercase leading-[1.3] tracking-[0.12em] text-[#4a463d]">
                              <span className="truncate">{p.role}</span>
                              <span aria-hidden="true">{String(417 + i * 6 + turn[i]).padStart(4, "0")}</span>
                            </p>
                          </div>
                          {/* gloss that slides across the emulsion as the strip leans */}
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 rounded-[2px]"
                            style={{ backgroundImage: "linear-gradient(104deg,rgba(255,255,255,0) 34%,rgba(255,255,255,0.3) 46%,rgba(255,255,255,0.05) 52%,rgba(255,255,255,0) 62%)", backgroundSize: "320% 100%", backgroundPosition: "calc(50% + var(--lean, 0) * 5%) 0" }}
                          />
                          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[90px] rounded-b-[2px]" style={{ background: "linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.16))" }} />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => choose(i)}
                      aria-label={`Print ${p.name}'s strip again. ${p.role}`}
                      className="absolute rounded-[6px] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                      style={{ left: cx - STRIP_W / 2 - 8, top: 40, width: STRIP_W + 16, height: SLIT_Y - 40 + LEN + 10 }}
                    />
                  </li>
                );
              })}
            </ul>

            {/* the fascia sits over the top of the paper */}
            <div aria-hidden="true" className="pointer-events-none absolute rounded-[9px]" style={{ left: FIRST_X - 96, top: 36, width: PITCH * (people.length - 1) + 192, height: 88, background: "rgba(0,0,0,0.55)", filter: "blur(10px)", transform: "translateY(8px)" }} />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute rounded-[9px]"
              style={{ left: FIRST_X - 96, top: 36, width: PITCH * (people.length - 1) + 192, height: 88, backgroundImage: steel, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -2px 1px rgba(0,0,0,0.4), inset 1px 0 0 rgba(255,255,255,0.5), inset -1px 0 0 rgba(0,0,0,0.25), 0 1px 0 rgba(0,0,0,0.6)" }}
            >
              {[
                [10, 10],
                [10, 68],
              ].flatMap(([x, y]) =>
                [0, 1].map((r) => (
                  <span key={`${y}-${r}`} className="absolute h-[10px] w-[10px] rounded-full" style={{ [r ? "right" : "left"]: x, top: y, background: "radial-gradient(circle at 35% 30%,#fff,#b1b7ba 50%,#5b6367)", boxShadow: "0 1px 1px rgba(0,0,0,0.5), inset 0 0 0 0.5px rgba(0,0,0,0.3)" }}>
                    <span className="absolute left-[1px] right-[1px] top-[4.5px] h-[1px] bg-black/50" style={{ transform: `rotate(${x + y + r * 50}deg)` }} />
                  </span>
                )),
              )}
              {people.map((p, i) => (
                <div key={p.name} className="absolute top-0 h-full" style={{ left: 96 + PITCH * i - PITCH / 2, width: PITCH }}>
                  <p className="absolute inset-x-0 top-[15px] text-center font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#26292b]" style={{ textShadow: "0 1px 0 rgba(255,255,255,0.75)" }}>
                    {p.name.split(" ")[0]}
                  </p>
                  <p className="absolute inset-x-0 top-[31px] text-center font-mono text-[7px] uppercase tracking-[0.2em] text-[#3d4245]" style={{ textShadow: "0 1px 0 rgba(255,255,255,0.6)" }}>
                    {p.role}
                  </p>
                  <span
                    className="absolute left-[18px] top-[17px] h-[9px] w-[9px] rounded-full"
                    style={{
                      background: busy === i ? "radial-gradient(circle at 40% 35%,#fff6d8,#ffb21c 45%,#c26a00)" : "radial-gradient(circle at 40% 35%,#8a5a3a,#4a2412 55%,#2a1208)",
                      boxShadow: busy === i ? "0 0 10px 3px rgba(255,170,30,0.75), 0 0 0 1.5px #6f777b" : "0 0 0 1.5px #6f777b, inset 0 1px 1px rgba(0,0,0,0.6)",
                    }}
                  />
                  {/* the slit, its pressed surround and felt lips */}
                  <div className="absolute bottom-[1px] left-1/2 h-[25px] w-[138px] -translate-x-1/2 rounded-t-[7px]" style={{ background: "linear-gradient(180deg,#8e9498,#b9bec1 40%,#d9dcdd)", boxShadow: "inset 0 2px 3px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(255,255,255,0.6)" }}>
                    <div className="absolute bottom-0 left-1/2 h-[12px] w-[124px] -translate-x-1/2 rounded-t-[4px]" style={{ background: "linear-gradient(180deg,#000 0%,#0a0a0a 55%,#2a2624 100%)", boxShadow: "inset 0 3px 4px #000, 0 -1px 0 rgba(0,0,0,0.5)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-7">
        <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-stone-200 sm:text-[11px]">
          <span className="font-bold">{club}</span>
          <br />
          <span className="text-stone-400">Press a strip to print it again</span>
        </p>
        <div className="pointer-events-auto flex gap-2 md:hidden">
          <button type="button" onClick={() => step(-1)} aria-label="Move along the booth to the left" className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/40 text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 active:scale-95">
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Move along the booth to the right" className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/40 text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 active:scale-95">
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
