import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionTemplate, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const links = ["Work", "Studio", "Journal", "Shop", "Contact"];

// The edge that leads the move is stiff, the edge that trails is loose: that gap is the stretch.
const LEAD = { type: "spring", stiffness: 520, damping: 34, mass: 0.7 } as const;
const TRAIL = { type: "spring", stiffness: 150, damping: 15, mass: 0.9 } as const;
const PAD = 5; // gap between the blob and the edge of the bar
const DEMO_MS = 1150;

const chairs = [
  { name: "Oda lounge chair", price: "$1,240", tone: "bg-lime-300", seat: "#1c1917" },
  { name: "Tern side table", price: "$380", tone: "bg-stone-900", seat: "#bef264" },
  { name: "Halde bench", price: "$910", tone: "bg-orange-200", seat: "#1c1917" },
];

export default function NavbarWithLiquidStretchHighlightAndInvertingLabels() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const inView = useInView(rootRef, { amount: 0.3 });
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [demo, setDemo] = useState(true);
  const [ready, setReady] = useState(false);

  const left = useMotionValue(0);
  const right = useMotionValue(0);
  const rest = useMotionValue(1); // width the blob settles at
  const barW = useMotionValue(0);
  const target = hover ?? active;

  // Squash the blob vertically while it is stretched wider than its resting width.
  const squash = useTransform([left, right, rest], ([l, r, w]: number[]) => {
    const extra = Math.max(0, r - l - w);
    return PAD + Math.min(7, extra * 0.07);
  });
  const rightInset = useTransform([right, barW], ([r, w]: number[]) => Math.max(0, w - r));
  const clip = useMotionTemplate`inset(${squash}px ${rightInset}px ${squash}px ${left}px round 999px)`;

  const moveTo = useCallback(
    (index: number, instant: boolean) => {
      const bar = barRef.current;
      const el = itemRefs.current[index];
      if (!bar || !el) return;
      const l = el.offsetLeft;
      const r = l + el.offsetWidth;
      barW.set(bar.offsetWidth);
      rest.set(el.offsetWidth);
      if (instant) {
        left.set(l);
        right.set(r);
        return;
      }
      const goingRight = l >= left.get();
      animate(left, l, goingRight ? TRAIL : LEAD);
      animate(right, r, goingRight ? LEAD : TRAIL);
    },
    [barW, left, rest, right],
  );

  // First paint and every resize: snap, do not animate.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    moveTo(target, true);
    setReady(true);
    const ro = new ResizeObserver(() => moveTo(target, true));
    ro.observe(bar);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    moveTo(target, !!reduce);
    return () => {
      left.stop();
      right.stop();
    };
  }, [target, ready, reduce, moveTo, left, right]);

  // Idle demo: the blob visits each link in turn until someone takes over.
  useEffect(() => {
    if (!demo || reduce || !inView) return;
    const order = [1, 3, 2, 4, 0];
    let step = 0;
    const tick = () => {
      if (document.hidden) return;
      setActive(order[step % order.length]);
      step += 1;
    };
    let id = window.setTimeout(function run() {
      tick();
      id = window.setTimeout(run, DEMO_MS);
    }, 1400);
    return () => window.clearTimeout(id);
  }, [demo, reduce, inView]);

  const stop = () => setDemo(false);

  return (
    <section ref={rootRef} className="bg-stone-100 px-4 py-6 text-stone-900 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <a href="#" className="flex items-center gap-2 rounded-full text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-4 focus-visible:ring-offset-stone-100">
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
              <circle cx="8" cy="12" r="6" fill="#1c1917" />
              <circle cx="16" cy="12" r="6" fill="#a3e635" />
            </svg>
            Nordlow
          </a>

          <nav aria-label="Main" className="w-full sm:w-auto" onPointerDown={stop} onFocusCapture={stop}>
            <ul
              ref={barRef}
              onPointerLeave={() => setHover(null)}
              className="relative flex rounded-full bg-stone-900 shadow-lg shadow-stone-900/20"
              style={{ padding: 0 }}
            >
              {links.map((label, i) => (
                <li key={label} ref={(el) => { itemRefs.current[i] = el; }} className="flex-1 sm:flex-none">
                  <a
                    href="#"
                    aria-current={active === i ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      stop();
                      setActive(i);
                    }}
                    onPointerEnter={(e) => {
                      if (e.pointerType === "mouse") {
                        stop();
                        setHover(i);
                      }
                    }}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    className="group flex h-12 items-center justify-center rounded-full px-1 text-sm font-medium text-stone-300 focus-visible:outline-none sm:px-5"
                  >
                    <span className="rounded-full px-0.5 sm:px-1 group-focus-visible:ring-2 group-focus-visible:ring-white group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-stone-900">{label}</span>
                  </a>
                </li>
              ))}

              {/* One layer is both the blob and the dark copy of the labels. Its clip-path is the liquid shape. */}
              <motion.li
                aria-hidden="true"
                role="presentation"
                className="pointer-events-none absolute inset-0 flex rounded-full bg-lime-300"
                style={{ clipPath: clip, opacity: ready ? 1 : 0, willChange: "clip-path" }}
              >
                {links.map((label) => (
                  <span key={label} className="flex h-12 flex-1 items-center justify-center px-1 text-sm font-medium text-stone-950 sm:flex-none sm:px-5">
                    <span className="px-0.5 sm:px-1">{label}</span>
                  </span>
                ))}
              </motion.li>
            </ul>
          </nav>

          <a href="#" className="hidden h-12 items-center gap-1.5 rounded-full border border-stone-900 px-5 text-sm font-semibold transition-colors hover:bg-stone-900 hover:text-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-100 lg:flex">
            Book a visit
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </header>

        <div className="mt-10 grid items-end gap-8 sm:mt-14 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="text-sm font-medium text-stone-600">Autumn collection, made in small runs</p>
            <h1 className="mt-3 text-4xl font-semibold leading-none tracking-tight sm:text-6xl">
              Furniture that keeps its shape and loses its edges.
            </h1>
            <p className="mt-5 max-w-md text-base text-stone-600">
              Steam-bent ash, wool from one mill and joints you can take apart with a coin. Every piece ships flat and outlives the sofa it replaces.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#" className="flex h-12 items-center rounded-full bg-stone-900 px-6 text-sm font-semibold text-stone-50 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-100 motion-reduce:transition-none">
                See the collection
              </a>
              <a href="#" className="flex h-12 items-center rounded-full px-4 text-sm font-semibold underline decoration-lime-500 decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900">
                Order fabric samples
              </a>
            </div>
          </div>

          <ul className="grid grid-cols-3 gap-3 lg:col-span-2">
            {chairs.map((c, i) => (
              <li key={c.name} className={i === 1 ? "sm:-translate-y-6" : ""}>
                <div className={`flex aspect-[3/4] items-end justify-center rounded-3xl ${c.tone}`}>
                  <svg viewBox="0 0 60 80" className="w-3/4" aria-hidden="true">
                    <rect x="14" y="14" width="32" height="30" rx="14" fill={c.seat} />
                    <rect x="8" y="42" width="44" height="12" rx="6" fill={c.seat} />
                    <rect x="14" y="54" width="4" height="22" rx="2" fill={c.seat} />
                    <rect x="42" y="54" width="4" height="22" rx="2" fill={c.seat} />
                  </svg>
                </div>
                <p className="mt-2 text-xs font-semibold leading-tight sm:text-sm">{c.name}</p>
                <p className="text-xs text-stone-600">{c.price}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
