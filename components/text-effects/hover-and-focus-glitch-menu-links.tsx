import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const links = [
  { label: "Selected work", note: "Identity and packaging, 2019 to now" },
  { label: "Studio", note: "Four designers in a former print shop" },
  { label: "Journal", note: "Notes from the bench" },
  { label: "Start a project", note: "Replies within two working days" },
];

export default function HoverAndFocusGlitchMenuLinks() {
  const root = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [demo, setDemo] = useState(-1);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // A gentle demo: one link glitches every few seconds until the visitor points at or tabs to the menu.
  useEffect(() => {
    if (reduce || !visible || touched) {
      setDemo(-1);
      return;
    }
    let i = 0;
    let off: number | undefined;
    const run = () => {
      setDemo(i % links.length);
      off = window.setTimeout(() => setDemo(-1), 600);
      i += 1;
    };
    const first = window.setTimeout(run, 1450);
    const every = window.setInterval(run, 2400);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
      if (off) window.clearTimeout(off);
    };
  }, [reduce, visible, touched]);

  return (
    <section
      ref={root}
      data-paused={visible ? "false" : "true"}
      className="w10hov bg-[#e3ebe7] px-5 py-16 sm:px-10 sm:py-20"
      onPointerEnter={() => setTouched(true)}
      onFocus={() => setTouched(true)}
    >
      <style>{`
        .w10hov { --w10hov-ink: #13221d; --w10hov-a: #d43d51; --w10hov-b: #2259b8; --w10hov-burst: 0.5s; }
        .w10hov-txt { position: relative; display: inline-block; }
        .w10hov-txt::before, .w10hov-txt::after { content: attr(data-text); position: absolute; inset: 0; pointer-events: none; mix-blend-mode: multiply; opacity: 0; }
        .w10hov-txt::before { color: var(--w10hov-a); }
        .w10hov-txt::after { color: var(--w10hov-b); }
        .w10hov-link:hover .w10hov-txt, .w10hov-link:focus-visible .w10hov-txt, .w10hov-link[data-demo="on"] .w10hov-txt { animation: w10hov-jolt var(--w10hov-burst) steps(1, end) 1; }
        .w10hov-link:hover .w10hov-txt::before, .w10hov-link:focus-visible .w10hov-txt::before, .w10hov-link[data-demo="on"] .w10hov-txt::before { animation: w10hov-a var(--w10hov-burst) steps(1, end) 1; }
        .w10hov-link:hover .w10hov-txt::after, .w10hov-link:focus-visible .w10hov-txt::after, .w10hov-link[data-demo="on"] .w10hov-txt::after { animation: w10hov-b var(--w10hov-burst) steps(1, end) 1; }
        .w10hov-rule { transform: scaleX(0); transform-origin: left; transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .w10hov-link:hover .w10hov-rule, .w10hov-link:focus-visible .w10hov-rule, .w10hov-link[data-demo="on"] .w10hov-rule { transform: scaleX(1); }
        .w10hov-arrow { transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .w10hov-link:hover .w10hov-arrow, .w10hov-link:focus-visible .w10hov-arrow { transform: translateX(6px); }
        @keyframes w10hov-jolt { 0% { transform: translateX(-3px) skewX(8deg); } 20% { transform: translateX(3px); } 40% { transform: skewX(-4deg); } 60%, 100% { transform: none; } }
        @keyframes w10hov-a { 0% { opacity: 1; clip-path: inset(8% 0 60% 0); transform: translateX(-10px); } 20% { opacity: 1; clip-path: inset(52% 0 22% 0); transform: translateX(8px); } 40% { opacity: 1; clip-path: inset(30% 0 46% 0); transform: translateX(-4px); } 60%, 100% { opacity: 0; transform: none; } }
        @keyframes w10hov-b { 0% { opacity: 1; clip-path: inset(62% 0 10% 0); transform: translateX(9px); } 20% { opacity: 1; clip-path: inset(14% 0 64% 0); transform: translateX(-7px); } 40% { opacity: 1; clip-path: inset(72% 0 6% 0); transform: translateX(5px); } 60%, 100% { opacity: 0; transform: none; } }
        @media (prefers-reduced-motion: reduce) {
          .w10hov-link .w10hov-txt, .w10hov-link .w10hov-txt::before, .w10hov-link .w10hov-txt::after { animation: none !important; }
          .w10hov-rule, .w10hov-arrow { transition: none; }
        }
      `}</style>
      <div className="mx-auto max-w-5xl">
        <div className="flex items-baseline justify-between gap-4 border-b border-[#13221d]/20 pb-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#13221d]">Fernhill Type &amp; Print</h2>
          <p className="hidden text-sm text-[#40534b] sm:block">Hover or tab through the menu</p>
        </div>
        <nav aria-label="Studio">
          <ul>
            {links.map((link, i) => (
              <li key={link.label} className="border-b border-[#13221d]/20">
                <a
                  href="#"
                  data-demo={demo === i ? "on" : "off"}
                  className="w10hov-link group relative flex flex-col gap-1 py-5 outline-none focus-visible:ring-2 focus-visible:ring-[#2259b8] focus-visible:ring-offset-4 focus-visible:ring-offset-[#e3ebe7] sm:flex-row sm:items-center sm:justify-between sm:py-6"
                >
                  <span className="flex items-baseline gap-4">
                    <span aria-hidden="true" className="w-7 font-mono text-xs text-[#40534b]">0{i + 1}</span>
                    <span className="text-[clamp(32px,6vw,64px)] font-semibold leading-none tracking-tight text-[#13221d]">
                      <span className="sr-only">{link.label}</span>
                      <span aria-hidden="true" className="w10hov-txt" data-text={link.label}>{link.label}</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-3 pl-11 text-sm text-[#40534b] sm:pl-0">
                    {link.note}
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" className="w10hov-arrow hidden text-[#13221d] sm:block">
                      <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span aria-hidden="true" className="w10hov-rule absolute -bottom-px left-0 h-0.5 w-full bg-[#13221d]" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
