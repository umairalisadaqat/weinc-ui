import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// The customer's question and the shop's answer, which arrives word by word.
const QUESTION = "Hi, will the speckled mugs be back before the 20th? It\'s for my sister\'s birthday.";
const REPLY = "Good news: a fresh batch of speckled mugs comes out of the kiln on Thursday. I can set two aside for you now and post them Friday morning, so they arrive in plenty of time.";
const WORDS = REPLY.split(" ");
const START_AT = 11; // words already shown on load, so the preview is never empty

export default function ShopSupportReplyTyped() {
  const rootRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(START_AT);
  const [thinking, setThinking] = useState(false);
  const [still, setStill] = useState(START_AT); // words that appear without the fade-in
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduce) { setShown(WORDS.length); setStill(WORDS.length); setThinking(false); return; }
    let alive = true;
    let visible = true;
    let timer = 0;
    let resume: null | (() => void) = null;
    const wait = (ms: number) =>
      new Promise<void>((done) => {
        const go = () => { timer = window.setTimeout(done, ms); };
        if (visible) go();
        else resume = go;
      });
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && resume) { const r = resume; resume = null; r(); }
    });
    io.observe(el);
    (async () => {
      let n = START_AT;
      while (alive) {
        while (n < WORDS.length && alive) {
          const prev = WORDS[n - 1] ?? "";
          await wait(/[.,:]$/.test(prev) ? 360 : 70 + Math.random() * 110);
          n++;
          setShown(n);
        }
        await wait(4200);
        n = 0;
        setShown(0);
        setStill(0);
        setThinking(true);
        await wait(1500);
        setThinking(false);
      }
    })();
    return () => { alive = false; window.clearTimeout(timer); io.disconnect(); };
  }, [reduce]);

  return (
    <section ref={rootRef} className="ssr-root px-4 py-16 sm:py-20">
      <style>{`
        .ssr-root { background: linear-gradient(180deg, #f4f1ec 0%, #ebe6de 100%); }
        .ssr-card { max-width: 30rem; margin: 0 auto; border-radius: 20px; background: #ffffff; border: 1px solid #e2dbd0; box-shadow: 0 24px 50px -28px rgba(60,45,30,0.35); overflow: hidden; }
        .ssr-top { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 1px solid #eee8df; }
        .ssr-av { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: #9b5a3c; color: #fff; font-size: 13px; font-weight: 600; }
        .ssr-name { font-size: 14px; font-weight: 600; color: #2b2520; }
        .ssr-status { font-size: 12px; color: #5f6b5a; }
        .ssr-thread { display: flex; flex-direction: column; gap: 12px; padding: 20px 18px 24px; }
        .ssr-msg { max-width: 85%; padding: 11px 14px; border-radius: 16px; font-size: 15px; line-height: 1.5; }
        .ssr-me { align-self: flex-end; background: #2f3b33; color: #f3f1ec; border-bottom-right-radius: 5px; }
        .ssr-them { align-self: flex-start; background: #f3ede4; color: #2b2520; border-bottom-left-radius: 5px; }
        .ssr-stack { display: grid; }
        .ssr-stack > * { grid-area: 1 / 1; }
        .ssr-ghost { visibility: hidden; }
        .ssr-w { display: inline; animation: ssr-in 260ms ease-out both; }
        @keyframes ssr-in { from { opacity: 0; filter: blur(2px); } to { opacity: 1; filter: blur(0); } }
        .ssr-dots { display: flex; gap: 5px; align-items: center; height: 1.5em; }
        .ssr-dots i { width: 7px; height: 7px; border-radius: 50%; background: #9b8a78; animation: ssr-bob 1.1s ease-in-out infinite; }
        .ssr-dots i:nth-child(2) { animation-delay: 0.15s; } .ssr-dots i:nth-child(3) { animation-delay: 0.3s; }
        @keyframes ssr-bob { 0%, 60%, 100% { transform: translateY(0); opacity: 0.55; } 30% { transform: translateY(-4px); opacity: 1; } }
        .ssr-time { font-size: 11px; color: #6b6158; }
        @media (prefers-reduced-motion: reduce) { .ssr-w, .ssr-dots i { animation: none; } }
      `}</style>
      <div className="ssr-card">
        <div className="ssr-top">
          <span className="ssr-av" aria-hidden="true">MO</span>
          <div>
            <h2 className="ssr-name">Maya at Kiln &amp; Clay</h2>
            <p className="ssr-status">Usually replies within the hour</p>
          </div>
        </div>
        <div className="ssr-thread">
          <p className="ssr-msg ssr-me"><span className="sr-only">You said: </span>{QUESTION}</p>
          <div className="ssr-msg ssr-them">
            <p className="sr-only">Maya replied: {REPLY}</p>
            <div className="ssr-stack" aria-hidden="true">
              <span className="ssr-ghost">{REPLY}</span>
              {thinking || shown === 0 ? (
                <span className="ssr-dots"><i /><i /><i /></span>
              ) : (
                <span>
                  {WORDS.slice(0, shown).map((w, i) => (
                    <span key={i} className="ssr-w" style={i < still ? { animation: "none" } : undefined}>{w} </span>
                  ))}
                </span>
              )}
            </div>
          </div>
          <span className="ssr-time" aria-hidden="true">Seen 2:14 pm</span>
        </div>
      </div>
    </section>
  );
}
