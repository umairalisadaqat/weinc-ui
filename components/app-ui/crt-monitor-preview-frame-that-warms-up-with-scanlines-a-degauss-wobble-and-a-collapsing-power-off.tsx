import { useEffect, useRef, useState } from "react";

// The page shown on the tube. Swap the block inside the element marked "picture" for your own preview.
const site = {
  brand: "Ember Row",
  links: ["Shop", "Studio", "Visit"],
  headline: ["Thrown by hand.", "Fired on Fridays."],
  cta: "See the new kiln load",
  photo: "https://images.pexels.com/photos/14608171/pexels-photo-14608171.jpeg?auto=compress&cs=tinysrgb&w=900",
  alt: "Three white ceramic vases on a deep red backdrop",
};
const set = { maker: "LUMEN", model: "14", mode: "640 x 480" };
const CASE = [216, 207, 186]; // case plastic, as red, green, blue
const GLOW = "255,96,84"; // colour the picture throws on the room
const W = 340, H = 306;

export default function CrtMonitorPreviewFrame() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pic = useRef<HTMLDivElement>(null);
  const beam = useRef<HTMLDivElement>(null);
  const purity = useRef<HTMLDivElement>(null);
  const spill = useRef<HTMLDivElement>(null);
  const floor = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(true);
  const api = useRef<{ power: (v: boolean) => void; degauss: () => void } | null>(null);

  // ---------- The case is painted once ----------
  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const c = cv.getContext("2d");
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.65;
    cv.width = W * dpr; cv.height = H * dpr;
    c.scale(dpr, dpr);
    const tone = (k: number, a = 1) => `rgba(${Math.min(255, CASE[0] * k) | 0},${Math.min(255, CASE[1] * k) | 0},${Math.min(255, CASE[2] * k) | 0},${a})`;
    const rr = (x: number, y: number, w: number, h: number, r: number | number[]) => {
      const [a, b, d, e] = typeof r === "number" ? [r, r, r, r] : r;
      c.beginPath(); c.moveTo(x + a, y); c.lineTo(x + w - b, y); c.arcTo(x + w, y, x + w, y + b, b); c.lineTo(x + w, y + h - d); c.arcTo(x + w, y + h, x + w - d, y + h, d); c.lineTo(x + e, y + h); c.arcTo(x, y + h, x, y + h - e, e); c.lineTo(x, y + a); c.arcTo(x, y, x + a, y, a); c.closePath();
    };
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const grain = (x: number, y: number, w: number, h: number, n: number, amt: number) => {
      for (let i = 0; i < n; i++) { const v = rand(); c.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * amt})` : `rgba(50,42,22,${(0.5 - v) * amt})`; c.fillRect(x + rand() * w, y + rand() * h, 0.7, 0.7); }
    };
    // A step in the moulding: lit on one side, shaded on the other.
    const step = (x: number, y: number, w: number, h: number, r: number, raise: boolean, wd = 2) => {
      c.save(); rr(x, y, w, h, r); c.clip(); c.lineWidth = wd;
      c.strokeStyle = raise ? "rgba(255,255,255,0.7)" : "rgba(30,24,10,0.6)"; rr(x + 0.8, y + 1, w, h, r); c.stroke();
      c.strokeStyle = raise ? "rgba(30,24,10,0.45)" : "rgba(255,255,255,0.75)"; rr(x - 0.8, y - 1, w, h, r); c.stroke();
      c.restore();
    };

    // Swivel stand: a neck in shadow and a foot.
    const neck = c.createLinearGradient(124, 0, 216, 0); neck.addColorStop(0, tone(0.34)); neck.addColorStop(0.3, tone(0.62)); neck.addColorStop(0.7, tone(0.5)); neck.addColorStop(1, tone(0.28));
    c.fillStyle = neck; c.beginPath(); c.moveTo(132, 256); c.lineTo(208, 256); c.lineTo(216, 280); c.lineTo(124, 280); c.closePath(); c.fill();
    const under = c.createLinearGradient(0, 258, 0, 274); under.addColorStop(0, "rgba(0,0,0,0.75)"); under.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = under; c.fillRect(124, 258, 92, 16);
    const foot = c.createLinearGradient(0, 276, 0, 298); foot.addColorStop(0, tone(0.98)); foot.addColorStop(0.35, tone(0.8)); foot.addColorStop(1, tone(0.46));
    rr(84, 276, 172, 21, [9, 9, 7, 7]); c.fillStyle = foot; c.fill();
    c.save(); rr(84, 276, 172, 21, [9, 9, 7, 7]); c.clip(); grain(84, 276, 172, 21, 1400, 0.3);
    const fe = c.createLinearGradient(84, 0, 256, 0); fe.addColorStop(0, "rgba(255,255,255,0.35)"); fe.addColorStop(0.08, "rgba(255,255,255,0)"); fe.addColorStop(0.9, "rgba(0,0,0,0)"); fe.addColorStop(1, "rgba(0,0,0,0.4)");
    c.fillStyle = fe; c.fillRect(84, 276, 172, 21); c.fillStyle = "rgba(255,255,255,0.7)"; c.fillRect(92, 276.4, 156, 0.8); c.restore();

    // Case front.
    const body = () => rr(20, 6, 300, 254, [15, 15, 11, 11]);
    const bg = c.createLinearGradient(0, 6, 0, 260); bg.addColorStop(0, tone(1.12)); bg.addColorStop(0.05, tone(1.04)); bg.addColorStop(0.6, tone(0.95)); bg.addColorStop(1, tone(0.8));
    body(); c.fillStyle = bg; c.fill();
    c.save(); body(); c.clip();
    grain(20, 6, 300, 254, 26000, 0.3);
    const le = c.createLinearGradient(20, 0, 34, 0); le.addColorStop(0, "rgba(255,255,255,0.55)"); le.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = le; c.fillRect(20, 6, 14, 254);
    const re = c.createLinearGradient(304, 0, 320, 0); re.addColorStop(0, "rgba(30,24,10,0)"); re.addColorStop(1, "rgba(30,24,10,0.45)"); c.fillStyle = re; c.fillRect(304, 6, 16, 254);
    const be = c.createLinearGradient(0, 246, 0, 260); be.addColorStop(0, "rgba(30,24,10,0)"); be.addColorStop(1, "rgba(30,24,10,0.5)"); c.fillStyle = be; c.fillRect(20, 246, 300, 14);
    const te = c.createLinearGradient(0, 6, 0, 16); te.addColorStop(0, "rgba(255,255,255,0.75)"); te.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = te; c.fillRect(20, 6, 300, 10);
    c.restore();

    // The well the tube sits in: four sloping walls, darkest under the brow.
    const wo = { x: 37, y: 24, w: 266, h: 198, r: 19 }, wi = { x: 51, y: 36, w: 238, h: 182, r: 22 };
    const wall = c.createLinearGradient(0, wo.y, 0, wo.y + wo.h); wall.addColorStop(0, tone(0.42)); wall.addColorStop(0.1, tone(0.56)); wall.addColorStop(0.5, tone(0.78)); wall.addColorStop(0.92, tone(1.02)); wall.addColorStop(1, tone(1.1));
    rr(wo.x, wo.y, wo.w, wo.h, wo.r); c.fillStyle = wall; c.fill();
    c.save(); rr(wo.x, wo.y, wo.w, wo.h, wo.r); c.clip();
    grain(wo.x, wo.y, wo.w, wo.h, 6000, 0.24);
    const wl = c.createLinearGradient(wo.x, 0, wi.x + 4, 0); wl.addColorStop(0, "rgba(255,255,255,0.22)"); wl.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = wl; c.fillRect(wo.x, wo.y, 18, wo.h);
    const wr = c.createLinearGradient(wi.x + wi.w - 4, 0, wo.x + wo.w, 0); wr.addColorStop(0, "rgba(20,16,6,0)"); wr.addColorStop(1, "rgba(20,16,6,0.42)"); c.fillStyle = wr; c.fillRect(wi.x + wi.w - 4, wo.y, 20, wo.h);
    // Mitre lines in the corners of the well.
    c.lineWidth = 0.7;
    for (const [x0, y0, x1, y1] of [[wo.x + 5, wo.y + 5, wi.x + 6, wi.y + 6], [wo.x + wo.w - 5, wo.y + 5, wi.x + wi.w - 6, wi.y + 6], [wo.x + 5, wo.y + wo.h - 5, wi.x + 6, wi.y + wi.h - 6], [wo.x + wo.w - 5, wo.y + wo.h - 5, wi.x + wi.w - 6, wi.y + wi.h - 6]]) {
      c.strokeStyle = "rgba(30,24,10,0.3)"; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.strokeStyle = "rgba(255,255,255,0.3)"; c.beginPath(); c.moveTo(x0 + 0.8, y0); c.lineTo(x1 + 0.8, y1); c.stroke();
    }
    c.restore();
    step(wo.x, wo.y, wo.w, wo.h, wo.r, false, 2.2);
    // Black mask round the glass.
    c.save(); c.shadowColor = "rgba(0,0,0,0.7)"; c.shadowBlur = 5 * dpr; rr(wi.x, wi.y, wi.w, wi.h, wi.r); c.fillStyle = "#050505"; c.fill(); c.restore();
    c.lineWidth = 0.8; c.strokeStyle = "rgba(255,255,255,0.13)"; rr(wi.x + 0.5, wi.y + 0.5, wi.w - 1, wi.h - 1, wi.r); c.stroke();

    // Chin: a parting line, the badge, two thumbwheels, wells for the lamp and the two buttons.
    c.fillStyle = "rgba(30,24,10,0.35)"; c.fillRect(21, 229, 298, 1); c.fillStyle = "rgba(255,255,255,0.6)"; c.fillRect(21, 230, 298, 0.8);
    c.textBaseline = "middle"; c.fillStyle = "#3a3426"; c.font = '800 9.5px "Helvetica Neue", Helvetica, Arial, sans-serif';
    let x = 42; for (const ch of set.maker) { c.fillStyle = "rgba(255,255,255,0.6)"; c.fillText(ch, x, 245.7); c.fillStyle = "#3a3426"; c.fillText(ch, x, 245); x += c.measureText(ch).width + 2.6; }
    c.fillStyle = "#c8432b"; c.fillRect(x + 2, 240.6, 2.4, 8.6); c.fillStyle = "#d99a2b"; c.fillRect(x + 5.4, 240.6, 2.4, 8.6); c.fillStyle = "#3f7f6c"; c.fillRect(x + 8.8, 240.6, 2.4, 8.6);
    c.fillStyle = "#5a5342"; c.font = '700 5.4px "Helvetica Neue", Helvetica, Arial, sans-serif'; c.fillText(set.model, x + 15, 245.2);
    for (const wx of [146, 170]) {
      rr(wx, 251, 18, 9, 2); c.fillStyle = "#0e0d0a"; c.fill();
      const wh = c.createLinearGradient(0, 252, 0, 260); wh.addColorStop(0, "#77705e"); wh.addColorStop(0.4, "#4b4638"); wh.addColorStop(1, "#1c1a14");
      c.fillStyle = wh; c.fillRect(wx + 1.5, 252.6, 15, 7.4);
      for (let k = wx + 2.4; k < wx + 16; k += 1.9) { c.fillStyle = "rgba(0,0,0,0.6)"; c.fillRect(k, 252.6, 0.7, 7.4); }
      step(wx, 251, 18, 9, 2, false, 1.4);
    }
    c.beginPath(); c.arc(214, 244.5, 3.9, 0, Math.PI * 2); c.fillStyle = "#12100b"; c.fill();
    c.beginPath(); c.arc(214.4, 245.1, 3.9, 0, Math.PI * 2); c.lineWidth = 0.7; c.strokeStyle = "rgba(255,255,255,0.65)"; c.stroke();
    rr(233, 237, 26, 15, 3.5); c.fillStyle = "#17150f"; c.fill(); step(233, 237, 26, 15, 3.5, false, 1.6);
    c.beginPath(); c.arc(288, 244.5, 12, 0, Math.PI * 2); c.fillStyle = "#17150f"; c.fill();
    c.beginPath(); c.arc(288.5, 245.3, 12, 0, Math.PI * 2); c.lineWidth = 0.9; c.strokeStyle = "rgba(255,255,255,0.7)"; c.stroke();
    c.beginPath(); c.arc(287.5, 243.7, 12, 0, Math.PI * 2); c.strokeStyle = "rgba(30,24,10,0.5)"; c.stroke();
    c.fillStyle = "rgba(58,52,38,0.8)"; c.font = '700 3.6px "Helvetica Neue", Helvetica, Arial, sans-serif'; c.textAlign = "center";
    c.fillText("DEGAUSS", 246, 256.2); c.textAlign = "left";
  }, []);

  // ---------- The tube: every effect is a transform or a filter on the picture ----------
  useEffect(() => {
    const el = pic.current, line = beam.current, rainbow = purity.current, halo = spill.current, pool = floor.current;
    if (!el || !line || !rainbow || !halo || !pool) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // lit: 0 off, 1 on. since: seconds into the current power change. wob: seconds into a degauss, or -1.
    const s = { lit: true, since: 99, wob: -1 };
    const ease = (v: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, v)), 3);
    const paint = (t: number) => {
      let sx = 1, sy = 1, bright = 1, sat = 1, blur = 0, op = 1, flash = 0;
      if (s.lit) {
        const a = s.since;
        if (a < 0.1) { op = 0; }
        else if (a < 0.5) { const k = ease((a - 0.1) / 0.4); sy = 0.006 + 0.994 * k * (1 + 0.1 * Math.sin(k * Math.PI)); sx = 0.7 + 0.3 * ease((a - 0.1) / 0.22); bright = 2.6 - 1.9 * k; sat = 0.2; blur = 1.4; flash = 1 - k; }
        else if (a < 2.6) { const k = (a - 0.5) / 2.1, e = ease(k); bright = 0.7 + 0.3 * e; sat = 0.2 + 0.8 * e; blur = 1.4 * (1 - e); }
      } else {
        const a = s.since;
        if (a < 0.16) { const k = a / 0.16; sy = 1 - 0.994 * k * k; bright = 1 + 2.4 * k; flash = k; }
        else if (a < 0.44) { const k = (a - 0.16) / 0.28; sy = 0.006; sx = 1 - 0.985 * ease(k); bright = 3.4; flash = 1; }
        else if (a < 1.1) { const k = (a - 0.44) / 0.66; sy = 0.008; sx = 0.015; bright = 3.4; flash = 1 - k; op = 1 - k; }
        else { op = 0; }
      }
      // Degauss: the coil's field shakes the beam and smears the colours, and both die away.
      let dx = 0, dy = 0, rot = 0, zoom = 1, hue = 0, A = 0;
      if (s.wob >= 0 && s.wob < 1.9) {
        A = Math.exp(-s.wob * 2.5) * (1 - Math.max(0, s.wob - 1.5) / 0.4);
        dx = A * 5.5 * Math.sin(t * 43); dy = A * 3.2 * Math.sin(t * 37 + 1.1); rot = A * 1.5 * Math.sin(t * 29 + 0.4);
        zoom = 1 + A * 0.045 * Math.sin(t * 33 + 2); hue = A * 75 * Math.sin(t * 19);
      }
      el.style.transform = `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${(sx * zoom).toFixed(4)},${(sy * zoom).toFixed(4)})`;
      el.style.filter = `brightness(${(bright * 1.5).toFixed(3)}) saturate(${(sat * 1.2 * (1 + A * 0.8)).toFixed(3)}) hue-rotate(${hue.toFixed(1)}deg) blur(${blur.toFixed(2)}px)`;
      el.style.opacity = op.toFixed(3);
      line.style.opacity = (flash * op).toFixed(3);
      line.style.transform = `scale(${Math.max(0.012, sx).toFixed(4)},1)`;
      rainbow.style.opacity = (A * 0.85 * op).toFixed(3);
      rainbow.style.transform = `translate(${(dx * 5).toFixed(1)}px,${(dy * 5).toFixed(1)}px) rotate(${(t * 140).toFixed(1)}deg) scale(1.8)`;
      const lum = s.lit ? (s.since < 0.1 ? 0 : Math.min(1, 0.35 + 0.65 * ease((s.since - 0.1) / 2.4))) : Math.max(0, 1 - s.since / 0.35);
      halo.style.opacity = lum.toFixed(3); pool.style.opacity = lum.toFixed(3);
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9;
    // The demo starts from a warm, steady picture, then degausses, switches off, and warms up again.
    const script: [number, () => void][] = [[3.5, () => { s.wob = 0; }], [3.2, () => { s.lit = false; s.since = 0; setOn(false); }], [1.7, () => { s.lit = true; s.since = 0; s.wob = 0.02; setOn(true); }], [5.2, () => {}]];
    let cue = 0, due = script[0][0];
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      s.since += dt; if (s.wob >= 0) { s.wob += dt; if (s.wob > 1.9) s.wob = -1; }
      if (now - touched > 8000) {
        due -= dt;
        if (due <= 0) { script[cue][1](); cue = (cue + 1) % script.length; due = script[cue][0]; }
      }
      paint(t);
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { s.since = 99; s.wob = -1; paint(0); };

    api.current = {
      power: (v) => { touched = performance.now(); cue = v ? 3 : 2; due = script[cue][0]; s.lit = v; s.since = 0; if (v) s.wob = 0.02; if (reduce) still(); else wake(); },
      degauss: () => { touched = performance.now(); if (s.lit && !reduce) { s.wob = 0; wake(); } },
    };
    if (reduce) still(); else wake();

    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(el);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const toggle = () => { const next = !on; setOn(next); api.current?.power(next); };

  return (
    <div className="flex min-h-[620px] w-full flex-col items-center justify-center overflow-hidden bg-[#0b090d] bg-[radial-gradient(80%_60%_at_50%_42%,#1d1820_0%,#0b090d_72%)] px-4 py-10 sm:min-h-[780px]">
      <style>{`
        @keyframes crt-monitor-preview-frame-roll { from { transform: translateY(-120%); } to { transform: translateY(420%); } }
        .crt-monitor-preview-frame-roll { animation: crt-monitor-preview-frame-roll 6s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .crt-monitor-preview-frame-roll { animation: none; opacity: 0; } }
      `}</style>
      <div className="relative h-[306px] w-[340px] shrink-0 sm:my-[100px] sm:scale-[1.65]">
        {/* Light the picture throws on the desk and round the case. */}
        <div ref={floor} aria-hidden="true" className="absolute left-[10px] top-[272px] h-[60px] w-[320px] rounded-[50%] blur-2xl" style={{ background: `radial-gradient(closest-side, rgba(${GLOW},0.42), rgba(${GLOW},0))` }} />
        <div aria-hidden="true" className="absolute left-[70px] top-[290px] h-[14px] w-[200px] rounded-[50%] bg-black opacity-80 blur-md" />
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div ref={spill} aria-hidden="true" className="absolute left-[54px] top-[39px] h-[176px] w-[232px] rounded-[20px]" style={{ boxShadow: `0 0 22px 5px rgba(${GLOW},0.3), 0 0 60px 18px rgba(${GLOW},0.12)` }} />

        {/* The glass. */}
        <div
          role="img"
          aria-label={on ? `Preview of the ${site.brand} ceramics homepage on a tube monitor` : "Monitor switched off"}
          className="absolute left-[54px] top-[39px] h-[176px] w-[232px] overflow-hidden bg-[#0d100e] bg-[radial-gradient(70%_70%_at_50%_45%,#1e2420_0%,#0a0c0b_100%)]"
          style={{ borderRadius: "22px / 19px" }}
        >
          {/* picture */}
          <div ref={pic} aria-hidden="true" className="absolute inset-0 origin-center bg-[#8d1420] will-change-transform">
            <img src={site.photo} alt={site.alt} width={900} height={600} className="absolute inset-0 h-full w-full bg-[#8d1420] object-cover object-[50%_60%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/35" />
            <div className="absolute inset-x-[14px] top-[11px] flex items-center justify-between text-white">
              <span className="font-serif text-[8.5px] font-semibold italic tracking-tight">{site.brand}</span>
              <span className="flex gap-[7px] font-mono text-[4.6px] uppercase tracking-[0.16em]">
                {site.links.map((l) => <span key={l}>{l}</span>)}
              </span>
            </div>
            <div className="absolute inset-x-[14px] bottom-[13px] text-white">
              <p className="font-serif text-[15px] font-medium italic leading-[1.05] tracking-tight">
                {site.headline.map((l) => <span key={l} className="block">{l}</span>)}
              </p>
              <span className="mt-[6px] inline-block rounded-full bg-white px-[7px] py-[2.6px] font-mono text-[4.6px] font-semibold uppercase tracking-[0.14em] text-[#7a0f1a]">{site.cta}</span>
            </div>
          </div>
          {/* The beam as a bare line, seen for a moment at switch-on and switch-off. */}
          <div ref={beam} aria-hidden="true" className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 opacity-0">
            <div className="h-full w-full rounded-full bg-white shadow-[0_0_8px_3px_rgba(255,255,255,0.85),0_0_22px_8px_rgba(190,220,255,0.5)]" />
          </div>
          {/* Colour blotches while the coil fires. */}
          <div ref={purity} aria-hidden="true" className="absolute inset-[-20%] opacity-0 mix-blend-screen" style={{ background: "conic-gradient(from 0deg at 50% 50%, rgba(255,0,90,0.75), rgba(255,210,0,0.6), rgba(0,255,150,0.7), rgba(0,140,255,0.75), rgba(200,0,255,0.6), rgba(255,0,90,0.75))", filter: "blur(16px)" }} />
          {/* Scan lines and the shadow mask. */}
          <div aria-hidden="true" className="absolute inset-0" style={{ background: "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0, rgba(0,0,0,0) 1.1px, rgba(0,0,0,0.3) 1.5px, rgba(0,0,0,0.3) 2px)" }} />
          <div aria-hidden="true" className="absolute inset-0 opacity-50 mix-blend-multiply" style={{ background: "repeating-linear-gradient(to right, rgba(255,150,150,1) 0, rgba(255,150,150,1) 0.67px, rgba(150,255,150,1) 0.67px, rgba(150,255,150,1) 1.33px, rgba(150,150,255,1) 1.33px, rgba(150,150,255,1) 2px)" }} />
          <div aria-hidden="true" className="crt-monitor-preview-frame-roll absolute inset-x-0 top-0 h-[30%]" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.075) 55%, rgba(255,255,255,0))" }} />
          {/* The bulge of the tube: dark corners, a deep shadow under the mask, the room in the glass. */}
          <div aria-hidden="true" className="absolute inset-0" style={{ borderRadius: "22px / 19px", background: "radial-gradient(115% 115% at 50% 50%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.6) 100%)", boxShadow: "inset 0 0 10px 3px rgba(0,0,0,0.85), inset 0 5px 9px rgba(0,0,0,0.6)" }} />
          <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(90% 55% at 30% -8%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0) 62%), linear-gradient(118deg, rgba(255,255,255,0) 8%, rgba(255,255,255,0.11) 15%, rgba(255,255,255,0.03) 27%, rgba(255,255,255,0) 28%)" }} />
          <div aria-hidden="true" className="absolute bottom-[9px] right-[13px] h-[20px] w-[58px] rounded-[50%] bg-white/10 blur-[5px]" />
        </div>

        {/* Lamp, degauss key, power button. */}
        <span aria-hidden="true" className={`absolute left-[211px] top-[241.5px] h-[6px] w-[6px] rounded-full transition-colors duration-150 ${on ? "bg-[#9dff7a] shadow-[0_0_5px_1.5px_rgba(140,255,110,0.8)]" : "bg-[#2a3a22]"}`} />
        <button
          type="button"
          onClick={() => api.current?.degauss()}
          aria-label="Degauss the screen"
          className="group absolute left-[226px] top-[224px] flex h-[40px] w-[40px] items-center justify-center outline-none"
        >
          <span className="block h-[11px] w-[22px] rounded-[2.5px] bg-gradient-to-b from-[#ece4cd] to-[#b9b097] shadow-[0_1.4px_0_rgba(0,0,0,0.6),inset_0_0.7px_0_rgba(255,255,255,0.9)] transition-transform duration-75 group-active:translate-y-[1px] group-active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] group-focus-visible:ring-2 group-focus-visible:ring-white group-focus-visible:ring-offset-1 group-focus-visible:ring-offset-[#17150f]" />
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={on}
          aria-label="Power"
          className="group absolute left-[268px] top-[224.5px] flex h-[40px] w-[40px] items-center justify-center rounded-full outline-none"
        >
          <span className={`flex h-[20px] w-[20px] items-center justify-center rounded-full bg-gradient-to-b from-[#f1e9d3] to-[#b4ab92] transition-transform duration-75 group-active:translate-y-[1px] group-focus-visible:ring-2 group-focus-visible:ring-white group-focus-visible:ring-offset-1 group-focus-visible:ring-offset-[#17150f] ${on ? "translate-y-[0.6px] shadow-[0_0.6px_0_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(60,50,20,0.35)]" : "shadow-[0_1.8px_0_rgba(0,0,0,0.65),inset_0_0.8px_0_rgba(255,255,255,0.95)]"}`}>
            <svg viewBox="0 0 20 20" className="h-[9px] w-[9px] text-[#4a4332]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M10 3v7" /><path d="M5.6 6.2a6.2 6.2 0 1 0 8.8 0" /></svg>
          </span>
        </button>
      </div>
      <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-[#b9b2bf] sm:mt-0">
        <span className="font-semibold text-white">{set.maker} {set.model}</span>
        <span className="mx-2 text-[#8f8896]">/</span>
        <span aria-live="polite">{on ? `Power on / ${set.mode}` : "Standby"}</span>
      </p>
    </div>
  );
}
