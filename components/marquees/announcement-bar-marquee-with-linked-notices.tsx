import { useEffect, useRef, useState } from "react";

// Short notices for an invented boot maker. Each one is a real link.
const notices = [
  { label: "Resoling for winter: book a slot before 30 November", href: "#" },
  { label: "Read how a resole is done at our bench", href: "#" },
  { label: "New in: the waxed canvas field tote", href: "#" },
  { label: "Workshop open Tuesday to Saturday, 10 to 6", href: "#" },
];
const SPEED = 40; // seconds per loop

function Notices({ dup }: { dup?: boolean }) {
  return (
    <ul className="w3ann-group" aria-hidden={dup ? "true" : undefined}>
      {notices.map((n) => (
        <li key={n.label} className="flex items-center gap-10">
          <a
            href={n.href}
            tabIndex={dup ? -1 : undefined}
            className="rounded-sm underline decoration-[#8e8a80] underline-offset-4 hover:decoration-[#f4f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3b45a]"
          >
            {n.label}
          </a>
          <span aria-hidden="true" className="text-[#8e8a80]">/</span>
        </li>
      ))}
    </ul>
  );
}

export default function AnnouncementBarMarqueeWithLinkedNotices() {
  const root = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [off, setOff] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOff(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={root}
      data-paused={paused ? "" : undefined}
      data-off={off ? "" : undefined}
      className="w3ann bg-[#f4f1ea] text-[#1d1b18]"
      style={{ ["--w3ann-speed" as string]: `${SPEED}s` }}
    >
      <style>{`
        .w3ann-view { overflow: hidden; flex: 1; }
        .w3ann-track { display: flex; width: max-content; animation: w3ann-run var(--w3ann-speed) linear infinite; }
        .w3ann-group { display: flex; align-items: center; gap: 40px; padding: 0 40px 0 0; margin: 0; list-style: none; height: 44px; white-space: nowrap; font-size: 14px; }
        .w3ann[data-paused] .w3ann-track, .w3ann[data-off] .w3ann-track, .w3ann-view:hover .w3ann-track, .w3ann-view:focus-within .w3ann-track { animation-play-state: paused; }
        @keyframes w3ann-run { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .w3ann-view { overflow-x: auto; }
          .w3ann-track { animation: none; padding-left: 20px; }
          .w3ann-group[aria-hidden], .w3ann-toggle { display: none; }
        }
      `}</style>
      <div className="flex items-center bg-[#1d1b18] text-[#f4f1ea]">
        <div className="w3ann-view">
          <div className="w3ann-track">
            <Notices />
            <Notices dup />
          </div>
        </div>
        <button
          type="button"
          aria-pressed={paused}
          aria-label={paused ? "Play announcements" : "Pause announcements"}
          onClick={() => setPaused((p) => !p)}
          className="w3ann-toggle grid h-11 w-11 shrink-0 place-items-center border-l border-[#3a3732] hover:bg-[#2c2925] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e3b45a]"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="fill-current">
            {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />}
          </svg>
        </button>
      </div>
      <header className="border-b border-[#ddd6c8]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <a href="#" className="rounded font-serif text-xl font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1b18]">Fenwick Boot Co.</a>
          <nav aria-label="Main">
            <ul className="hidden gap-8 text-sm font-medium text-[#3d3a34] sm:flex">
              {["Boots", "Repairs", "Care", "Our bench"].map((l) => (
                <li key={l}><a href="#" className="rounded hover:text-[#1d1b18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1b18]">{l}</a></li>
              ))}
            </ul>
          </nav>
          <a href="#" className="inline-flex h-10 items-center rounded-full bg-[#1d1b18] px-4 text-sm font-medium text-[#f4f1ea] hover:bg-[#3a3732] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1b18] focus-visible:ring-offset-2">Basket (0)</a>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:py-20 md:grid-cols-2 md:items-end">
        <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">Goodyear welted boots, stitched and resoled in one workshop.</h1>
        <p className="max-w-md text-base leading-relaxed text-[#4a463e]">Leather from two tanneries we visit each spring, cut and lasted by hand, and resoled at the same bench when the soles wear through.</p>
      </div>
    </section>
  );
}
