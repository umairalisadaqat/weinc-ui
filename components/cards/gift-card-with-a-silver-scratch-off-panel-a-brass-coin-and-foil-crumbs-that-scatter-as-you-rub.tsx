import { useEffect, useRef, useState } from "react";

// The card. `codes` are handed out one per card dealt, then start again.
const gift = {
  shop: "Fenn & Marlowe",
  trade: "FLORISTS",
  amount: "$60",
  line: "of seasonal stems, tied and delivered",
  hint: "SCRATCH FOR YOUR CODE",
  coin: "FM",
  photo: "https://images.pexels.com/photos/11731228/pexels-photo-11731228.jpeg?auto=compress&cs=tinysrgb&w=1200",
  alt: "Pink, yellow and white ranunculus heads laid together on a dark cloth",
  tone: "#3a2b2f",
  codes: ["FM-7Q4K-92TD", "FM-3HX8-51LW", "FM-9BN2-06RC"],
};
const W = 460; // card size in CSS pixels
const H = 292;
const PANEL = { x: 206, y: 213, w: 232, h: 54 }; // the foil, measured from the card's top left
const TILT = -5; // degrees the card lies at on the table
const MARGIN = 150; // how far crumbs may travel past the card edge
const START_FILLED = 0.56; // how much of the panel is already scratched when the page loads

type Crumb = { x: number; y: number; vx: number; vy: number; r: number; a: number; va: number; curl: number; shade: number; flake: boolean; still: boolean };

export default function ScratchOffGiftCard() {
  const root = useRef<HTMLDivElement>(null);
  const fitBox = useRef<HTMLDivElement>(null);
  const cardEl = useRef<HTMLDivElement>(null);
  const foil = useRef<HTMLCanvasElement>(null);
  const crumbsEl = useRef<HTMLCanvasElement>(null);
  const coinEl = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [deal, setDeal] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const api = useRef<{ rub: () => void; fresh: () => void } | null>(null);
  const code = gift.codes[deal % gift.codes.length];

  useEffect(() => {
    const el = root.current, box = fitBox.current, cv = foil.current, cc = crumbsEl.current, coin = coinEl.current, cardNode = cardEl.current;
    if (!el || !box || !cv || !cc || !coin || !cardNode) return;
    const ctx = cv.getContext("2d"), cx = cc.getContext("2d");
    if (!ctx || !cx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const d = Math.min(2, window.devicePixelRatio || 1);
    const PW = Math.round(PANEL.w * d), PH = Math.round(PANEL.h * d);
    cv.width = PW; cv.height = PH;
    const CW = W + MARGIN * 2, CH = H + MARGIN * 2;
    cc.width = Math.round(CW * d); cc.height = Math.round(CH * d);
    let seed = 23;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const make = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };

    // The foil as printed: dull silver, a wave pattern and tiny repeated lettering.
    const base = make(PW, PH), b = base.getContext("2d");
    if (b) {
      b.scale(d, d);
      const g = b.createLinearGradient(0, 0, PANEL.w, PANEL.h);
      g.addColorStop(0, "#cfd2d6"); g.addColorStop(0.3, "#9da1a8"); g.addColorStop(0.55, "#c6c9ce"); g.addColorStop(0.8, "#8f939b"); g.addColorStop(1, "#b4b8be");
      b.fillStyle = g; b.fillRect(0, 0, PANEL.w, PANEL.h);
      for (let i = 0; i < 2600; i++) { const v = rand(); b.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.5})` : `rgba(40,44,52,${(0.5 - v) * 0.36})`; b.fillRect(rand() * PANEL.w, rand() * PANEL.h, 0.7, 0.7); }
      b.lineWidth = 0.6; b.strokeStyle = "rgba(70,76,86,0.34)";
      for (let y = -4; y < PANEL.h + 6; y += 4.5) {
        b.beginPath();
        for (let x = 0; x <= PANEL.w; x += 3) { const yy = y + Math.sin(x * 0.11 + y * 0.6) * 2.2; if (x === 0) b.moveTo(x, yy); else b.lineTo(x, yy); }
        b.stroke();
      }
      b.font = '700 6px "Helvetica Neue",Helvetica,Arial,sans-serif'; b.fillStyle = "rgba(58,64,74,0.5)"; b.textBaseline = "middle";
      for (let row = 0; row < 5; row++) for (let x = -30 + (row % 2) * 22; x < PANEL.w; x += 46) b.fillText("S C R A T C H", x, 7 + row * 10.5);
    }
    const mask = make(PW, PH), m = mask.getContext("2d");
    const probe = make(29, 7), pr = probe.getContext("2d", { willReadFrequently: true });
    if (!m || !pr) return;
    m.scale(d, d); m.lineCap = "round"; m.strokeStyle = "#000"; m.fillStyle = "#000";

    const s = {
      coinX: W + 34, coinY: H - 8, toX: W + 34, toY: H - 8, press: 0, pressTo: 0,
      down: false, lastX: 0, lastY: 0, lastUser: -1e9, hover: false,
      path: [] as [number, number][], seg: 0, along: 0, wait: 0, startAfter: 3.3, doneFor: 0, done: false, dealing: false,
      crumbs: [] as Crumb[], crumbsDirty: true, foilDirty: true, sheen: 0.3, t: 0, checkIn: 0,
    };
    // The route the coin takes by itself: a tight zigzag from left to right, in panel coordinates.
    const route = () => {
      const pts: [number, number][] = [];
      for (let i = 0, x = 7; x < PANEL.w - 3; i++, x += 10.5) pts.push([x + (rand() - 0.5) * 5, i % 2 ? PANEL.h - 3 - rand() * 7 : 3 + rand() * 7]);
      return pts;
    };

    const spawn = (x: number, y: number, dx: number, dy: number, settle: boolean) => {
      const len = Math.hypot(dx, dy) || 1, n = Math.max(1, Math.round(len / 13));
      for (let i = 0; i < n; i++) {
        const sp = 130 + rand() * 330, side = (rand() - 0.5) * 300;
        const c: Crumb = { x: PANEL.x + x + (rand() - 0.5) * 10, y: PANEL.y + y + (rand() - 0.5) * 10, vx: (dx / len) * sp - (dy / len) * side, vy: (dy / len) * sp + (dx / len) * side, r: 0.9 + rand() * 2.6, a: rand() * 6.3, va: (rand() - 0.5) * 22, curl: 0.9 + rand() * 2.6, shade: rand(), flake: rand() < 0.6, still: false };
        if (settle) { c.x += c.vx / 5.5; c.y += c.vy / 5.5; c.a += c.va / 5.5; c.still = true; }
        s.crumbs.push(c);
      }
      if (s.crumbs.length > 240) s.crumbs.splice(0, s.crumbs.length - 240);
      s.crumbsDirty = true;
    };
    // One rub of the coin from a to b: a ragged core, streaks beside it and loose specks.
    const rub = (x0: number, y0: number, x1: number, y1: number, settle: boolean) => {
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
      for (let k = 0; k < 3; k++) {
        const o = (rand() - 0.5) * 9;
        m.globalAlpha = 1; m.lineWidth = 9 + rand() * 8;
        m.beginPath(); m.moveTo(x0 + nx * o, y0 + ny * o); m.lineTo(x1 + nx * o, y1 + ny * o); m.stroke();
      }
      for (let k = 0; k < 9; k++) {
        const o = (rand() - 0.5) * 30, t0 = rand() * 0.3, t1 = 0.7 + rand() * 0.3;
        m.globalAlpha = 0.55 + rand() * 0.45; m.lineWidth = 0.8 + rand() * 1.8;
        m.beginPath(); m.moveTo(x0 + dx * t0 + nx * o, y0 + dy * t0 + ny * o); m.lineTo(x0 + dx * t1 + nx * o, y0 + dy * t1 + ny * o); m.stroke();
      }
      m.globalAlpha = 1;
      for (let k = 0; k < 5; k++) { const t = rand(), o = (rand() - 0.5) * 28; m.beginPath(); m.arc(x0 + dx * t + nx * o, y0 + dy * t + ny * o, 0.5 + rand() * 1.3, 0, 6.3); m.fill(); }
      s.foilDirty = true;
      spawn(x1, y1, dx, dy, settle);
    };
    const cleared = () => {
      pr.clearRect(0, 0, 29, 7); pr.drawImage(mask, 0, 0, 29, 7);
      const px = pr.getImageData(0, 0, 29, 7).data; let sum = 0;
      for (let i = 3; i < px.length; i += 4) sum += px[i];
      return sum / (255 * 29 * 7);
    };
    const finish = () => { if (!s.done) { s.done = true; s.doneFor = 0; setRevealed(true); } };

    const drawFoil = () => {
      s.foilDirty = false;
      ctx.globalCompositeOperation = "source-over"; ctx.clearRect(0, 0, PW, PH); ctx.drawImage(base, 0, 0);
      const c = s.sheen * PW, g = ctx.createLinearGradient(c - PW * 0.3, 0, c + PW * 0.3, PH);
      g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,255,255,0.85)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = g; ctx.fillRect(0, 0, PW, PH);
      ctx.globalCompositeOperation = "destination-out"; ctx.drawImage(mask, 0, 0);
    };
    const drawCrumbs = () => {
      s.crumbsDirty = false;
      cx.setTransform(d, 0, 0, d, MARGIN * d, MARGIN * d);
      cx.clearRect(-MARGIN, -MARGIN, CW, CH);
      cx.lineCap = "round";
      for (const c of s.crumbs) {
        const v = 112 + c.shade * 84, tone = `rgb(${v | 0},${(v + 3) | 0},${(v + 8) | 0})`;
        if (c.flake) {
          // A flat flake: a small lopsided four-sided chip with a shadow under one edge.
          const cos = Math.cos(c.a), sin = Math.sin(c.a), w = c.r * 0.95, h = c.r * (0.3 + c.curl * 0.16);
          const chip = (ox: number, oy: number) => { cx.beginPath(); cx.moveTo(c.x + ox - cos * w - sin * h, c.y + oy - sin * w + cos * h); cx.lineTo(c.x + ox + cos * w - sin * h * 0.4, c.y + oy + sin * w + cos * h * 0.4); cx.lineTo(c.x + ox + cos * w * 0.7 + sin * h, c.y + oy + sin * w * 0.7 - cos * h); cx.lineTo(c.x + ox - cos * w * 0.8 + sin * h * 0.7, c.y + oy - sin * w * 0.8 - cos * h * 0.7); cx.closePath(); cx.fill(); };
          cx.fillStyle = "rgba(40,30,20,0.24)"; chip(0.7, 1);
          cx.fillStyle = tone; chip(0, 0);
        } else {
          cx.lineWidth = 1.2; cx.strokeStyle = "rgba(40,30,20,0.24)";
          cx.beginPath(); cx.arc(c.x + 0.8, c.y + 1.1, c.r, c.a, c.a + c.curl); cx.stroke();
          cx.lineWidth = 1; cx.strokeStyle = tone;
          cx.beginPath(); cx.arc(c.x, c.y, c.r, c.a, c.a + c.curl); cx.stroke();
          cx.lineWidth = 0.5; cx.strokeStyle = "rgba(255,255,255,0.55)";
          cx.beginPath(); cx.arc(c.x, c.y, c.r, c.a + c.curl * 0.3, c.a + c.curl * 0.5); cx.stroke();
        }
      }
    };
    const placeCoin = () => {
      const p = s.press;
      coin.style.transform = `translate(${(s.coinX - 7).toFixed(1)}px, ${(s.coinY - 8).toFixed(1)}px) rotate(${(-TILT + (s.coinX - s.toX) * 0.25).toFixed(2)}deg) scale(${(1 - p * 0.05).toFixed(3)})`;
      coin.style.filter = `drop-shadow(${(7 - p * 4).toFixed(1)}px ${(11 - p * 6).toFixed(1)}px ${(9 - p * 5).toFixed(1)}px rgba(52,34,12,${(0.34 + p * 0.14).toFixed(2)}))`;
    };

    const reset = (filled: number, settle: boolean) => {
      m.clearRect(0, 0, PANEL.w, PANEL.h);
      s.crumbs = []; s.path = route(); s.seg = 0; s.along = 0; s.wait = 0; s.done = false; s.doneFor = 0;
      const upto = Math.floor((s.path.length - 1) * filled);
      for (let i = 0; i < upto; i++) rub(s.path[i][0], s.path[i][1], s.path[i + 1][0], s.path[i + 1][1], true);
      s.seg = upto;
      if (filled >= 1) { s.done = true; s.toX = W + 34; s.toY = H - 8; }
      else if (upto > 0) { s.toX = PANEL.x + s.path[upto][0]; s.toY = PANEL.y + s.path[upto][1]; }
      else { s.toX = W + 34; s.toY = H - 8; }
      if (settle) { s.coinX = s.toX; s.coinY = s.toY; }
      s.foilDirty = true; s.crumbsDirty = true;
    };
    reset(reduce ? 1 : START_FILLED, true);
    if (reduce) setRevealed(true);

    const toLocal = (clientX: number, clientY: number) => {
      const r = box.getBoundingClientRect(), k = r.width / W;
      const dx = (clientX - (r.left + r.width / 2)) / k, dy = (clientY - (r.top + r.height / 2)) / k;
      const a = (TILT * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
      return [dx * cos + dy * sin + W / 2, -dx * sin + dy * cos + H / 2];
    };

    const dealNew = () => {
      if (s.dealing) return;
      s.dealing = true; s.toX = W + 34; s.toY = H - 8;
      const next = () => { setDeal((n) => n + 1); setRevealed(false); reset(0, false); s.startAfter = 1.3; };
      if (reduce) { next(); s.dealing = false; paint(); return; }
      cc.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
      const out = cardNode.animate([{ transform: "translate(0,0) rotate(0deg)" }, { transform: "translate(-150%,-20px) rotate(-9deg)" }], { duration: 460, easing: "cubic-bezier(.5,0,.9,.4)", fill: "forwards" });
      out.onfinish = () => {
        next();
        cc.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 10, fill: "forwards" });
        const back = cardNode.animate([{ transform: "translate(150%,24px) rotate(9deg)" }, { transform: "translate(0,0) rotate(0deg)" }], { duration: 620, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
        back.onfinish = () => { s.dealing = false; };
      };
    };

    const paint = () => { if (s.foilDirty) drawFoil(); if (s.crumbsDirty) drawCrumbs(); placeCoin(); };

    let raf = 0, last = 0, visible = true;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now; s.t += dt;
      const userIdle = now - s.lastUser > 3600 && !s.down;
      if (!reduce && userIdle && !s.dealing) {
        if (s.done) { s.doneFor += dt; s.pressTo = 0; s.toX = W + 34; s.toY = H - 8; if (s.doneFor > 4.2) dealNew(); }
        else {
          s.wait += dt;
          if (s.wait > s.startAfter && s.seg < s.path.length - 1) {
            let travel = 250 * dt; s.pressTo = 1;
            while (travel > 0 && s.seg < s.path.length - 1) {
              const [ax, ay] = s.path[s.seg], [bx, by] = s.path[s.seg + 1], len = Math.hypot(bx - ax, by - ay);
              const from = s.along, to = Math.min(len, from + travel);
              rub(ax + ((bx - ax) * from) / len, ay + ((by - ay) * from) / len, ax + ((bx - ax) * to) / len, ay + ((by - ay) * to) / len, false);
              s.toX = PANEL.x + ax + ((bx - ax) * to) / len; s.toY = PANEL.y + ay + ((by - ay) * to) / len;
              travel -= to - from; s.along = to;
              if (to >= len) { s.seg++; s.along = 0; }
            }
            s.coinX = s.toX; s.coinY = s.toY;
            if (s.seg >= s.path.length - 1) finish();
          } else if (s.seg === 0) { s.toX = W + 34; s.toY = H - 8; }
        }
      }
      const k = Math.min(1, dt * (s.down ? 30 : 12));
      s.coinX += (s.toX - s.coinX) * k; s.coinY += (s.toY - s.coinY) * k;
      s.press += (s.pressTo - s.press) * Math.min(1, dt * 14);
      const sh = Math.max(0, Math.min(1, (s.coinX - PANEL.x) / PANEL.w)) * 0.8 + 0.1 + Math.sin(s.t * 0.7) * 0.06;
      if (Math.abs(sh - s.sheen) > 0.004) { s.sheen = sh; s.foilDirty = true; }
      let moving = false; const f = Math.exp(-dt * 5.5);
      for (const c of s.crumbs) {
        if (c.still) continue;
        c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt; c.vx *= f; c.vy *= f; c.va *= f;
        if (Math.abs(c.vx) + Math.abs(c.vy) < 3) c.still = true;
        moving = true;
      }
      if (moving) s.crumbsDirty = true;
      paint();
      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } };

    const inPanel = (x: number, y: number) => x > PANEL.x - 6 && x < PANEL.x + PANEL.w + 6 && y > PANEL.y - 6 && y < PANEL.y + PANEL.h + 6;
    const down = (e: PointerEvent) => {
      const [x, y] = toLocal(e.clientX, e.clientY);
      s.lastUser = performance.now();
      if (!inPanel(x, y) || s.dealing) return;
      s.down = true; s.pressTo = 1; s.lastX = x; s.lastY = y; s.toX = x; s.toY = y;
      el.setPointerCapture(e.pointerId); e.preventDefault(); wake();
    };
    const move = (e: PointerEvent) => {
      const [x, y] = toLocal(e.clientX, e.clientY);
      if (e.pointerType === "mouse" || s.down) { s.lastUser = performance.now(); s.toX = x; s.toY = y; if (!s.down) s.pressTo = 0; }
      if (!s.down) return;
      if (Math.hypot(x - s.lastX, y - s.lastY) < 2.5) return;
      if (inPanel(x, y) || inPanel(s.lastX, s.lastY)) {
        rub(s.lastX - PANEL.x, s.lastY - PANEL.y, x - PANEL.x, y - PANEL.y, reduce);
        if ((s.checkIn = (s.checkIn + 1) % 5) === 0 && cleared() > 0.62) finish();
      }
      s.lastX = x; s.lastY = y;
      if (reduce) { s.coinX = x; s.coinY = y; paint(); }
    };
    const up = () => { if (s.down) { s.down = false; s.pressTo = 0; if (cleared() > 0.62) finish(); } };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    api.current = {
      // The keyboard route: each press rubs a third of the panel.
      rub: () => {
        if (s.done || s.dealing) return;
        s.lastUser = performance.now();
        const stop = Math.min(s.path.length - 1, s.seg + Math.ceil(s.path.length / 3));
        for (; s.seg < stop; s.seg++) rub(s.path[s.seg][0], s.path[s.seg][1], s.path[s.seg + 1][0], s.path[s.seg + 1][1], reduce);
        s.along = 0; s.toX = PANEL.x + s.path[s.seg][0]; s.toY = PANEL.y + s.path[s.seg][1];
        if (s.seg >= s.path.length - 1) finish();
        if (reduce) { s.coinX = s.toX; s.coinY = s.toY; paint(); } else wake();
      },
      fresh: () => { s.lastUser = performance.now(); dealNew(); wake(); },
    };

    const fit = () => setScale(Math.min(1.25, (el.clientWidth - 56) / (W + 26)));
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); });
    io.observe(el);
    const vis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", vis);
    paint(); wake();

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
      api.current = null;
    };
  }, []);

  return (
    <div ref={root} className="relative flex min-h-[660px] w-full select-none items-center justify-center overflow-hidden bg-[#e9dfcf] py-20">
      <style>{`
        .gift-card-scratch-gold { background-image: linear-gradient(100deg, #8a6420 0%, #e9c877 22%, #fff3c4 36%, #c79a3d 50%, #7d5a1b 64%, #e2bd66 82%, #9a7227 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .gift-card-scratch-milled { background: repeating-conic-gradient(#6b4a12 0deg 1.5deg, #f0cf7c 1.5deg 3deg); }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 60% at 38% 30%, #f6efe2 0%, #e9dfcf 55%, #d6c9b4 100%)" }} />

      <div ref={fitBox} className="relative" style={{ width: W * scale, height: H * scale }}>
        <div className="absolute left-1/2 top-1/2" style={{ width: W, height: H, marginLeft: -W / 2, marginTop: -H / 2, transform: `scale(${scale}) rotate(${TILT}deg)` }}>
          <div ref={cardEl} className="absolute inset-0">
            {/* Thickness: three stacked edges under the face, then the soft shadows of a card lying on a table. */}
            <div className="absolute inset-0 overflow-hidden rounded-[16px] bg-[#f6f0e4]" style={{ boxShadow: "0 1px 0 #e3d8c6, 0 2px 0 #d2c6b1, 0 3.5px 0 #b7a98f, 0 5px 3px rgba(60,40,15,0.3), 0 18px 28px -6px rgba(70,48,20,0.34), 0 44px 60px -18px rgba(70,48,20,0.3)" }}>
              <div className="absolute inset-x-0 top-0 h-[190px]" style={{ backgroundColor: gift.tone }}>
                <img src={gift.photo} alt={gift.alt} width={460} height={190} loading="eager" draggable={false} className="h-full w-full select-none object-cover" style={{ objectPosition: "50% 46%" }} />
                <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,10,14,0.05) 30%, rgba(20,10,14,0.72) 100%)" }} />
                <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(112deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 26%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.09) 78%, rgba(255,255,255,0) 100%)" }} />
                <div className="absolute bottom-[14px] left-[24px]">
                  <p className="relative font-serif text-[31px] leading-none tracking-[-0.01em]">
                    <span aria-hidden="true" className="absolute inset-0 text-black/60" style={{ transform: "translate(0.6px,1.1px)" }}>{gift.shop}</span>
                    <span className="gift-card-scratch-gold relative">{gift.shop}</span>
                  </p>
                </div>
                <p className="gift-card-scratch-gold absolute bottom-[19px] right-[24px] text-[8px] font-bold tracking-[0.34em]">{gift.trade}</p>
              </div>
              <div aria-hidden="true" className="absolute inset-x-0 top-[190px] h-px bg-[#b89243]" />
              <div className="absolute left-[24px] top-[207px]">
                <p className="text-[7.5px] font-bold tracking-[0.3em] text-[#6b5a3e]">GIFT CARD</p>
                <p className="mt-[3px] font-serif text-[36px] leading-none text-[#231c14]">{gift.amount}</p>
                <p className="mt-[5px] w-[150px] text-[8.5px] leading-[1.35] text-[#5d4f38]">{gift.line}</p>
              </div>
              <p className="absolute text-[6.5px] font-bold tracking-[0.3em] text-[#6b5a3e]" style={{ left: PANEL.x + 1, top: PANEL.y - 13 }}>{gift.hint}</p>
              <div className="absolute overflow-hidden rounded-[5px]" style={{ left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, backgroundColor: "#fbf8f1", backgroundImage: "repeating-linear-gradient(135deg, rgba(120,100,60,0.09) 0 1px, transparent 1px 5px)", boxShadow: "inset 0 0 0 1px rgba(90,70,40,0.28)" }}>
                <p className="flex h-full items-center justify-center font-mono text-[17px] font-bold tracking-[0.14em] text-[#231c14]" aria-hidden={!revealed}>{code}</p>
                <canvas ref={foil} aria-hidden="true" className="absolute inset-0 h-full w-full" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[5px]" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.18)" }} />
              </div>
              <button
                type="button"
                onClick={(e) => { if (e.detail === 0) api.current?.rub(); }}
                aria-label={revealed ? `Scratch panel, already scratched. The code is ${code}.` : "Scratch panel. Press to rub some of the foil away."}
                className="absolute cursor-grab touch-none rounded-[5px] outline-none focus-visible:ring-2 focus-visible:ring-[#231c14] focus-visible:ring-offset-2 active:cursor-grabbing"
                style={{ left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h }}
              />
            </div>
          </div>
          <canvas ref={crumbsEl} aria-hidden="true" className="pointer-events-none absolute" style={{ left: -MARGIN, top: -MARGIN, width: W + MARGIN * 2, height: H + MARGIN * 2 }} />
          {/* The coin. It is drawn to the lower right of the point it rubs with. */}
          <div ref={coinEl} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-[66px] w-[66px]" style={{ willChange: "transform" }}>
            <div className="gift-card-scratch-milled absolute inset-0 rounded-full" />
            <div className="absolute inset-[2.5px] rounded-full" style={{ background: "conic-gradient(from 210deg, #f7dd92, #b8872c 14%, #f3d481 30%, #8d6419 46%, #e6c26a 62%, #a87a25 78%, #f7dd92)" }} />
            <div className="absolute inset-[7px] rounded-full" style={{ background: "radial-gradient(circle at 34% 28%, #f6dc94 0%, #d3a747 46%, #a87a26 100%)", boxShadow: "inset 0 1.5px 1px rgba(255,255,255,0.6), inset 0 -2px 2px rgba(80,50,5,0.5), 0 0 0 0.6px rgba(80,50,5,0.6)" }} />
            <div className="absolute inset-[11px] rounded-full border border-dashed border-[#7a5615]/60" />
            <p className="absolute inset-0 flex items-center justify-center font-serif text-[21px] font-bold text-[#8a6218]" style={{ textShadow: "0 1px 0 rgba(255,240,190,0.9), 0 -0.8px 0 rgba(70,44,4,0.7)" }}>{gift.coin}</p>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{revealed ? `Code revealed: ${code}` : ""}</p>
      <div className="absolute bottom-6 left-7 right-7 flex items-end justify-between gap-4">
        <p className="pointer-events-none font-mono text-[10px] font-semibold uppercase leading-5 tracking-[0.22em] text-[#231c14]">
          {gift.shop} gift card
          <span className="block font-medium text-[#5d4f38]">Rub the silver panel with the coin</span>
        </p>
        <button type="button" onClick={() => api.current?.fresh()} className="min-h-[40px] shrink-0 whitespace-nowrap rounded-full border border-[#231c14]/25 bg-[#f6f0e4]/70 px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231c14] outline-none transition-colors hover:bg-[#f6f0e4] focus-visible:ring-2 focus-visible:ring-[#231c14]">
          New card
        </button>
      </div>
    </div>
  );
}
