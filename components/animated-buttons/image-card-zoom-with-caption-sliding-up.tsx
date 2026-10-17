const cabins = [
  { name: "Lakeshore Hut", detail: "Sleeps 4 · wood stove · from $180 a night", src: "https://images.pexels.com/photos/17006057/pexels-photo-17006057.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Two wooden cabins on a snowy lakeshore under misty mountains, reflected in still water" },
  { name: "Green Water Lodge", detail: "Sleeps 6 · private jetty · from $240 a night", src: "https://images.pexels.com/photos/19499666/pexels-photo-19499666.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Wooden lodges at the edge of a clear green lake surrounded by dense pine forest" },
  { name: "Alm Cottage", detail: "Sleeps 2 · meadow terrace · from $130 a night", src: "https://images.pexels.com/photos/34408249/pexels-photo-34408249.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Weathered timber cottage beside a fenced meadow and a mountain lake in autumn" },
];

export default function ImageCardZoomWithCaptionSlidingUp() {
  return (
    <section className="bg-[#1d2a22] px-5 py-16 text-[#eef0e8] sm:py-20">
      <style>{`
        .w3zoo-img { transition: transform .9s cubic-bezier(.2,.7,.2,1); }
        .w3zoo-shade { opacity: 0; transition: opacity .6s ease; }
        .w3zoo-cap { transform: translateY(30px); transition: transform .6s cubic-bezier(.2,.7,.2,1); }
        .w3zoo-detail { opacity: 0; transition: opacity .45s ease .05s; }
        .w3zoo-card:focus-visible { outline: 2px solid #eef0e8; outline-offset: 4px; }
        .w3zoo-card:focus-visible .w3zoo-img, .w3zoo-demo .w3zoo-img { transform: scale(1.07); }
        .w3zoo-card:focus-visible .w3zoo-shade, .w3zoo-demo .w3zoo-shade,
        .w3zoo-card:focus-visible .w3zoo-detail, .w3zoo-demo .w3zoo-detail { opacity: 1; }
        .w3zoo-card:focus-visible .w3zoo-cap, .w3zoo-demo .w3zoo-cap { transform: none; }
        .w3zoo-grid:focus-within .w3zoo-demo:not(:focus-visible) .w3zoo-img { transform: none; }
        .w3zoo-grid:focus-within .w3zoo-demo:not(:focus-visible) .w3zoo-cap { transform: translateY(30px); }
        .w3zoo-grid:focus-within .w3zoo-demo:not(:focus-visible) .w3zoo-shade,
        .w3zoo-grid:focus-within .w3zoo-demo:not(:focus-visible) .w3zoo-detail { opacity: 0; }
        @media (hover: hover) and (pointer: fine) {
          .w3zoo-grid:hover .w3zoo-demo:not(:hover) .w3zoo-img { transform: none; }
          .w3zoo-grid:hover .w3zoo-demo:not(:hover) .w3zoo-cap { transform: translateY(30px); }
          .w3zoo-grid:hover .w3zoo-demo:not(:hover) .w3zoo-shade,
          .w3zoo-grid:hover .w3zoo-demo:not(:hover) .w3zoo-detail { opacity: 0; }
          .w3zoo-card:hover .w3zoo-img { transform: scale(1.07); }
          .w3zoo-card:hover .w3zoo-cap { transform: none; }
          .w3zoo-card:hover .w3zoo-shade, .w3zoo-card:hover .w3zoo-detail { opacity: 1; }
        }
        /* touch screens have no hover, so the detail line is simply shown */
        @media (hover: none), (prefers-reduced-motion: reduce) {
          .w3zoo-img, .w3zoo-cap, .w3zoo-detail, .w3zoo-shade { transition: none; }
          .w3zoo-grid .w3zoo-card .w3zoo-cap { transform: none; }
          .w3zoo-grid .w3zoo-card .w3zoo-detail, .w3zoo-grid .w3zoo-card .w3zoo-shade { opacity: 1; }
          .w3zoo-grid .w3zoo-card .w3zoo-img { transform: none; }
        }
      `}</style>
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b7c4a8]">Hollow Pine Stays</p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">Three cabins, one lake each.</h2>
        <ul className="w3zoo-grid mt-10 grid gap-5 sm:grid-cols-3">
          {cabins.map((c, i) => (
            <li key={c.name}>
              <a href="#" className={`w3zoo-card relative block aspect-[3/4] overflow-hidden rounded-2xl bg-[#2c3b31] ${i === 0 ? "w3zoo-demo" : ""}`}>
                <img src={c.src} alt={c.alt} loading="lazy" width={600} height={800} className="w3zoo-img absolute inset-0 h-full w-full object-cover" />
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                <span aria-hidden="true" className="w3zoo-shade absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <span className="w3zoo-cap absolute inset-x-0 bottom-0 block p-5">
                  <span className="block text-xl font-semibold text-white">{c.name}</span>
                  <span className="w3zoo-detail mt-1 block text-sm text-white/90">{c.detail}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
