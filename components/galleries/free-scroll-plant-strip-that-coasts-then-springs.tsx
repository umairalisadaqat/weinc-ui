import { useEffect, useRef } from "react";

const CSS = `
  /* Change these: background, text, leaf accent, card width. */
  .w1fre { --w1fre-bg: #1d2a22; --w1fre-text: #eef0e6; --w1fre-leaf: #b9cf8f; --w1fre-card: clamp(190px, 21vw, 240px); }
  .w1fre, .w1fre * { box-sizing: border-box; }
  .w1fre { position: relative; overflow: hidden; background: var(--w1fre-bg); color: var(--w1fre-text); padding: 64px 0 52px; font-family: ui-sans-serif, system-ui, sans-serif; }
  .w1fre-head, .w1fre-foot { max-width: 72rem; margin: 0 auto; padding: 0 24px; }
  .w1fre-kick { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: var(--w1fre-leaf); }
  .w1fre-title { margin: 12px 0 0; font-size: clamp(28px, 4vw, 42px); font-weight: 600; letter-spacing: -.02em; line-height: 1.1; }
  .w1fre-copy { margin: 12px 0 0; max-width: 34rem; font-size: 15px; line-height: 1.6; color: #c3c9b9; }
  .w1fre-view { margin-top: 36px; overflow: hidden; }
  .w1fre-track { position: relative; display: flex; gap: 16px; width: max-content; padding: 4px calc(100vw - var(--w1fre-card) - max(24px, calc((100vw - 72rem) / 2 + 24px))) 8px max(24px, calc((100vw - 72rem) / 2 + 24px)); touch-action: pan-y; cursor: grab; user-select: none; -webkit-user-select: none; will-change: transform; }
  .w1fre-track:active { cursor: grabbing; }
  .w1fre-slide { width: var(--w1fre-card); flex: none; opacity: .62; transition: opacity .45s ease; }
  .w1fre-slide.w1fre-on, .w1fre-slide:focus-within { opacity: 1; }
  .w1fre-card { display: block; color: inherit; text-decoration: none; border-radius: 14px; }
  .w1fre-card:focus-visible, .w1fre-btn:focus-visible { outline: 2px solid var(--w1fre-leaf); outline-offset: 4px; }
  .w1fre-ph { display: block; aspect-ratio: 3 / 4; overflow: hidden; border-radius: 14px; background: #2b3a30; box-shadow: 0 18px 30px -20px rgba(0, 0, 0, .7); }
  .w1fre-ph img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
  .w1fre-row { display: flex; justify-content: space-between; gap: 8px; margin-top: 12px; font-size: 16px; font-weight: 600; }
  .w1fre-price { font-variant-numeric: tabular-nums; color: var(--w1fre-leaf); }
  .w1fre-note { display: block; margin-top: 3px; font-size: 13px; color: #c3c9b9; }
  .w1fre-foot { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 28px; }
  .w1fre-now { margin: 0; font-size: 15px; }
  .w1fre-dim { color: #a9b2a0; margin-right: 6px; }
  .w1fre-count { font-weight: 600; }
  .w1fre-nav { display: flex; gap: 8px; }
  .w1fre-btn { display: grid; place-items: center; width: 52px; height: 44px; border-radius: 999px; border: 0; background: #2f4136; color: var(--w1fre-text); cursor: pointer; transition: background-color .2s, opacity .2s; }
  .w1fre-btn:hover:not(:disabled) { background: #3d5446; }
  .w1fre-btn:disabled { opacity: .35; cursor: default; }
  .w1fre-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (prefers-reduced-motion: reduce) { .w1fre-slide, .w1fre-btn { transition: none; } }
`;

/* Change these: glide friction (nearer 1 coasts further), spring stiffness, spring damping (higher = more overshoot), idle advance (ms). */
var FRICTION=.965,SPRING=.07,DAMP=.82,IDLE=4000;
function init(R: any){
var q=s=>R.querySelector(".w1fre-"+s),V=q("view"),T=q("track"),C=q("count"),L=q("live"),P=q("prev"),N=q("next"),
S=[...R.querySelectorAll(".w1fre-slide")],n=S.length,rm=matchMedia("(prefers-reduced-motion: reduce)").matches,
x=0,v=0,min=0,pts=[0],i=0,mode=0,tgt=0,raf=0,fr=0,d=0,moved=0,h=[],vis=1,idle=0,
ac=new AbortController(),on=(el,t,f,c)=>el.addEventListener(t,f,{signal:ac.signal,capture:!!c}),
M=Math,A=M.abs,cl=(a,lo,hi)=>M.max(lo,M.min(hi,a)),rq=requestAnimationFrame,ca=cancelAnimationFrame,
last=()=>pts.length-1,num=k=>k==last()?n:k+1,
near=p=>{var b=0;pts.forEach((t,k)=>{if(A(t-p)<A(pts[b]-p))b=k});return b};
function measure(){min=M.min(0,V.clientWidth-T.offsetWidth);pts=[0];
S.forEach(s=>{var p=M.max(min,S[0].offsetLeft-s.offsetLeft);if(pts[last()]-p>1)pts.push(p)});
x=cl(x,min,0);draw()}
function draw(){T.style.transform="translate3d("+x+"px,0,0)";i=near(x);
/* the card nearest the left edge is lit, the rest dim with opacity */
var c=num(i)-1;S.forEach((s,k)=>s.classList.toggle("w1fre-on",k==c));
C.textContent=S[c].dataset.name;P.disabled=x>-1;N.disabled=x<min+1}
function loop(){
/* mode 1 = coasting with friction, mode 2 = spring onto the chosen slide */
if(mode==1){x+=v;v*=x>0||x<min?.6:FRICTION;if(A(v)<3){mode=2;tgt=pts[near(x+v*9)]}}
else{v=(v+(tgt-x)*SPRING)*DAMP;x+=v;if(A(tgt-x)<.4&&A(v)<.4){x=tgt;mode=0}}
draw();raf=mode&&vis?rq(loop):0}
function run(){if(!raf&&mode&&vis)raf=rq(loop)}
function go(k: any, say: any){k=cl(k,0,last());tgt=pts[k];
if(rm){mode=0;x=tgt;draw()}else{mode=2;run()}
if(say)L.textContent="Slide "+num(k)+" of "+n}
function stop(){clearInterval(idle)}
on(T,"pointerdown",e=>{if(e.button)return;stop();ca(raf);raf=mode=moved=0;d={p:e.clientX,s:x,id:e.pointerId};h=[[e.timeStamp,x]]});
on(T,"pointermove",e=>{if(!d)return;var m=d.s+e.clientX-d.p,t=e.timeStamp;
if(!moved&&A(m-d.s)>6){moved=1;T.setPointerCapture(d.id)}
if(!moved)return;
/* rubber band past either end */
x=m>0?m*.35:m<min?min+(m-min)*.35:m;
h.push([t,x]);while(h.length>2&&t-h[0][0]>100)h.shift();
if(!fr)fr=rq(()=>{fr=0;draw()})});
function up(e: any){if(!d)return;d=0;if(!moved)return;
var a=h[0],b=h[h.length-1],t=b[0]-a[0];
/* release speed from the last 100 ms of moves */
v=t>0&&e.timeStamp-b[0]<80?(b[1]-a[1])/t*16.7:0;
if(rm)go(near(x));else{mode=1;run()}}
on(T,"pointerup",up);on(T,"pointercancel",up);
/* a drag is not a click on the card link */
on(T,"click",e=>{if(moved){e.preventDefault();e.stopPropagation();moved=0}},1);
on(P,"click",()=>{stop();go(i-1,1)});on(N,"click",()=>{stop();go(i+1,1)});
on(R,"keydown",e=>{var k={ArrowLeft:-1,ArrowRight:1}[e.key];if(k){e.preventDefault();stop();go(i+k,1)}});
on(R,"focusin",e=>{stop();V.scrollLeft=0;var s=e.target.closest(".w1fre-slide");if(s)go(S.indexOf(s))});
on(R,"pointerenter",stop);
var io=new IntersectionObserver(en=>{vis=en[0].isIntersecting;if(vis)run();else{ca(raf);raf=0}});
on(window,"resize",measure);io.observe(R);measure();
/* idle demo: one slide every IDLE ms until the pointer arrives or anything is pressed */
if(!rm)idle=setInterval(()=>vis&&!document.hidden&&go(i<last()?i+1:0),IDLE);
return()=>{ac.abort();io.disconnect();stop();ca(raf);ca(fr)}}

export default function FreeScrollPlantStrip() {
  const ref = useRef<any>(null);
  useEffect(() => (ref.current ? init(ref.current) : undefined), []);
  return (
    <section ref={ref} className="w1fre" role="region" aria-roledescription="carousel" aria-label="Plants at Ostler Glasshouse">
    <style>{CSS}</style>
      <div className="w1fre-head">
        <p className="w1fre-kick">Ostler Glasshouse, Bristol</p>
        <h2 className="w1fre-title">This week on the potting bench</h2>
        <p className="w1fre-copy">Flick the row and let it coast. It slows on its own and springs back onto the nearest plant.</p>
      </div>
      <div className="w1fre-view">
        <div className="w1fre-track">
          <div className="w1fre-slide" role="group" aria-roledescription="slide" aria-label="1 of 7" data-name="Snake plant"><a className="w1fre-card" href="#" draggable="false"><span className="w1fre-ph"><img src="https://images.pexels.com/photos/10467813/pexels-photo-10467813.jpeg?auto=compress&cs=tinysrgb&w=600" alt="A tall snake plant in a white ceramic pot beside a small cabinet" width="480" height="640" draggable="false" /></span><span className="w1fre-row"><span className="w1fre-name">Snake plant</span><span className="w1fre-price">£34</span></span><span className="w1fre-note">White ceramic pot, 60 cm</span></a></div>
          <div className="w1fre-slide" role="group" aria-roledescription="slide" aria-label="2 of 7" data-name="Boston fern"><a className="w1fre-card" href="#" draggable="false"><span className="w1fre-ph"><img src="https://images.pexels.com/photos/10903261/pexels-photo-10903261.jpeg?auto=compress&cs=tinysrgb&w=600" alt="A full Boston fern in a terracotta pot on a wooden floor" width="480" height="640" draggable="false" /></span><span className="w1fre-row"><span className="w1fre-name">Boston fern</span><span className="w1fre-price">£22</span></span><span className="w1fre-note">Terracotta, bright shade</span></a></div>
          <div className="w1fre-slide" role="group" aria-roledescription="slide" aria-label="3 of 7" data-name="Monstera on a stand"><a className="w1fre-card" href="#" draggable="false"><span className="w1fre-ph"><img src="https://images.pexels.com/photos/12014192/pexels-photo-12014192.jpeg?auto=compress&cs=tinysrgb&w=600" alt="A monstera in a white pot on a black metal stand by a window" width="480" height="640" draggable="false" /></span><span className="w1fre-row"><span className="w1fre-name">Monstera on a stand</span><span className="w1fre-price">£48</span></span><span className="w1fre-note">Black iron plant stand</span></a></div>
          <div className="w1fre-slide" role="group" aria-roledescription="slide" aria-label="4 of 7" data-name="Parlour palm"><a className="w1fre-card" href="#" draggable="false"><span className="w1fre-ph"><img src="https://images.pexels.com/photos/30343587/pexels-photo-30343587.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Soft green palm fronds above a terracotta pot" width="480" height="640" draggable="false" /></span><span className="w1fre-row"><span className="w1fre-name">Parlour palm</span><span className="w1fre-price">£26</span></span><span className="w1fre-note">Terracotta, low light</span></a></div>
          <div className="w1fre-slide" role="group" aria-roledescription="slide" aria-label="5 of 7" data-name="Holly fern"><a className="w1fre-card" href="#" draggable="false"><span className="w1fre-ph"><img src="https://images.pexels.com/photos/35920773/pexels-photo-35920773.jpeg?auto=compress&cs=tinysrgb&w=600" alt="A holly fern in a small terracotta pot on a wooden table" width="480" height="640" draggable="false" /></span><span className="w1fre-row"><span className="w1fre-name">Holly fern</span><span className="w1fre-price">£14</span></span><span className="w1fre-note">Small clay pot</span></a></div>
          <div className="w1fre-slide" role="group" aria-roledescription="slide" aria-label="6 of 7" data-name="Young monstera"><a className="w1fre-card" href="#" draggable="false"><span className="w1fre-ph"><img src="https://images.pexels.com/photos/9088036/pexels-photo-9088036.jpeg?auto=compress&cs=tinysrgb&w=600" alt="A young monstera with split leaves in a dark pot against a warm wall" width="480" height="640" draggable="false" /></span><span className="w1fre-row"><span className="w1fre-name">Young monstera</span><span className="w1fre-price">£19</span></span><span className="w1fre-note">Glazed navy pot</span></a></div>
          <div className="w1fre-slide" role="group" aria-roledescription="slide" aria-label="7 of 7" data-name="Windowsill pair"><a className="w1fre-card" href="#" draggable="false"><span className="w1fre-ph"><img src="https://images.pexels.com/photos/12951672/pexels-photo-12951672.jpeg?auto=compress&cs=tinysrgb&w=600" alt="A fern and a striped calathea in pots on a sunny windowsill" width="480" height="640" draggable="false" /></span><span className="w1fre-row"><span className="w1fre-name">Windowsill pair</span><span className="w1fre-price">£30</span></span><span className="w1fre-note">Fern and calathea</span></a></div>
        </div>
      </div>
      <div className="w1fre-foot">
        <p className="w1fre-now"><span className="w1fre-dim">Nearest</span> <span className="w1fre-count">Snake plant</span></p>
        <div className="w1fre-nav">
          <button className="w1fre-btn w1fre-prev" type="button" aria-label="Previous slide"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M19 12H5m6-6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <button className="w1fre-btn w1fre-next" type="button" aria-label="Next slide"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h14m-6-6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
      </div>
      <p className="w1fre-live" aria-live="polite"></p>
    </section>
  );
}
