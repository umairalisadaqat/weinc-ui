import { useEffect, useRef } from "react";

const CSS = `
  /* Change these: page colour, ink, accent for the handle, card width. */
  .w1scr { --w1scr-bg: #f7f8fa; --w1scr-ink: #1e293b; --w1scr-accent: #334155; --w1scr-card: clamp(250px, 30vw, 340px); }
  .w1scr, .w1scr * { box-sizing: border-box; }
  .w1scr { position: relative; overflow: hidden; background: var(--w1scr-bg); color: var(--w1scr-ink); padding: 64px 0 56px; font-family: ui-sans-serif, system-ui, sans-serif; }
  .w1scr-head, .w1scr-scrub { max-width: 72rem; margin: 0 auto; padding: 0 24px; }
  .w1scr-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
  .w1scr-kick { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: #475569; }
  .w1scr-title { margin: 12px 0 0; font-size: clamp(28px, 4vw, 42px); font-weight: 650; letter-spacing: -.025em; line-height: 1.1; }
  .w1scr-nav { display: flex; gap: 8px; }
  .w1scr-btn { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 10px; border: 1px solid #cbd5e1; background: #fff; color: var(--w1scr-ink); cursor: pointer; transition: opacity .2s, border-color .2s; }
  .w1scr-btn:hover:not(:disabled) { border-color: var(--w1scr-ink); }
  .w1scr-btn:disabled { opacity: .4; cursor: default; }
  .w1scr-btn:focus-visible, .w1scr-knob:focus-visible { outline: 2px solid var(--w1scr-ink); outline-offset: 3px; }
  .w1scr-view { margin-top: 36px; overflow: hidden; }
  .w1scr-track { display: flex; gap: 16px; width: max-content; padding: 6px calc(100vw - var(--w1scr-card) - max(24px, calc((100vw - 72rem) / 2 + 24px))) 10px max(24px, calc((100vw - 72rem) / 2 + 24px)); touch-action: pan-y; cursor: grab; user-select: none; -webkit-user-select: none; will-change: transform; }
  .w1scr-track:active { cursor: grabbing; }
  .w1scr-slide { width: var(--w1scr-card); flex: none; min-height: 230px; padding: 26px; border-radius: 14px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(15, 23, 42, .04), 0 12px 24px -16px rgba(15, 23, 42, .18); }
  .w1scr-time { margin: 0; font-size: 34px; font-weight: 300; font-variant-numeric: tabular-nums; letter-spacing: -.02em; color: #475569; }
  .w1scr-name { margin: 18px 0 0; font-size: 19px; font-weight: 650; }
  .w1scr-text { margin: 8px 0 0; font-size: 15px; line-height: 1.6; color: #475569; }
  .w1scr-scrub { margin-top: 34px; }
  .w1scr-bar { position: relative; height: 44px; }
  .w1scr-line { position: absolute; left: 0; right: 0; top: 21px; height: 2px; border-radius: 2px; background: #cbd5e1; }
  .w1scr-knob { position: absolute; left: 0; top: 0; display: grid; place-items: center; width: 64px; height: 44px; border-radius: 999px; background: var(--w1scr-accent); cursor: grab; touch-action: none; will-change: transform; box-shadow: 0 6px 14px -6px rgba(15, 23, 42, .5); }
  .w1scr-grip { width: 18px; height: 10px; border-left: 2px solid #e2e8f0; border-right: 2px solid #e2e8f0; box-shadow: inset 2px 0 0 transparent, inset -8px 0 0 -6px #e2e8f0; }
  .w1scr-ticks { display: flex; justify-content: space-between; margin-top: 10px; padding: 0 14px; font-size: 12px; font-variant-numeric: tabular-nums; color: #475569; }
  .w1scr-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 560px) { .w1scr-tick:nth-child(even) { visibility: hidden; } }
  @media (prefers-reduced-motion: reduce) { .w1scr-btn { transition: none; } }
`;

/* Change these: glide friction, snap spring, damping, idle advance (ms). */
var FRICTION=.93,SPRING=.1,DAMP=.7,IDLE=4000;
function init(R: any){
var q=s=>R.querySelector(".w1scr-"+s),V=q("view"),T=q("track"),B=q("bar"),H=q("knob"),L=q("live"),P=q("prev"),N=q("next"),
S=[...R.querySelectorAll(".w1scr-slide")],n=S.length,rm=matchMedia("(prefers-reduced-motion: reduce)").matches,
x=0,v=0,min=0,pts=[0],i=0,mode=0,tgt=0,raf=0,fr=0,d=0,moved=0,h=[],vis=1,idle=0,
ac=new AbortController(),on=(el,t,f,c)=>el.addEventListener(t,f,{signal:ac.signal,capture:!!c}),
M=Math,A=M.abs,cl=(a,lo,hi)=>M.max(lo,M.min(hi,a)),rq=requestAnimationFrame,ca=cancelAnimationFrame,
near=p=>{var b=0;pts.forEach((t,k)=>{if(A(t-p)<A(pts[b]-p))b=k});return b},
room=()=>B.clientWidth-H.offsetWidth,paint=()=>{if(!fr)fr=rq(()=>{fr=0;draw()})};
function ms(){pts=S.map(s=>S[0].offsetLeft-s.offsetLeft);min=pts[n-1];x=pts[i];draw()}
function draw(){T.style.transform="translate3d("+x+"px,0,0)";i=near(x);
/* the handle sits at the same fraction along its bar as the track along its run */
H.style.transform="translate3d("+room()*cl(x/min,0,1)+"px,0,0)";
H.setAttribute("aria-valuenow",i+1);H.setAttribute("aria-valuetext",S[i].dataset.name);
P.disabled=!i;N.disabled=i==n-1}
function loop(){
if(mode==1){x+=v;v*=x>0||x<min?.6:FRICTION;if(A(v)<3){mode=2;tgt=pts[near(x+v*9)]}}
else{v=(v+(tgt-x)*SPRING)*DAMP;x+=v;if(A(tgt-x)<.4&&A(v)<.4){x=tgt;mode=0}}
draw();raf=mode&&vis?rq(loop):0}
function run(){if(!raf&&mode&&vis)raf=rq(loop)}
function go(k: any, say: any){k=cl(k,0,n-1);tgt=pts[k];
if(rm){mode=0;x=tgt;draw()}else{mode=2;run()}
if(say)L.textContent="Slide "+(k+1)+" of "+n}
function stop(){clearInterval(idle)}
function grab(e: any){stop();ca(raf);raf=mode=moved=0;d={p:e.clientX,s:x,id:e.pointerId,k:e.currentTarget==H};h=[[e.timeStamp,x]];if(d.k)H.setPointerCapture(e.pointerId)}
on(T,"pointerdown",e=>{if(!e.button)grab(e)});on(H,"pointerdown",grab);
on(R,"pointermove",e=>{if(!d)return;var dx=e.clientX-d.p,m=d.s+(d.k?dx*min/room():dx),t=e.timeStamp;
if(!moved&&A(dx)>6){moved=1;d.k||T.setPointerCapture(d.id)}
if(!moved)return;
/* the track follows a drag on the cards, and moves the opposite way to a drag on the handle */
x=m>0?m*.35:m<min?min+(m-min)*.35:m;
h.push([t,x]);while(h.length>2&&t-h[0][0]>100)h.shift();paint()});
function up(e: any){if(!d)return;var k=d.k;d=0;if(!moved)return;
var a=h[0],b=h[h.length-1],t=b[0]-a[0];
v=!k&&t>0&&e.timeStamp-b[0]<80?(b[1]-a[1])/t*16.7:0;
if(rm)go(near(x));else{mode=1;run()}}
on(R,"pointerup",up);on(R,"pointercancel",up);
on(P,"click",()=>{stop();go(i-1,1)});on(N,"click",()=>{stop();go(i+1,1)});
on(R,"keydown",e=>{var k={ArrowLeft:-1,ArrowRight:1}[e.key];if(k){e.preventDefault();stop();go(i+k,1)}});
on(R,"focusin",e=>{stop();V.scrollLeft=0;var s=e.target.closest(".w1scr-slide");if(s)go(S.indexOf(s))});
on(R,"pointerenter",stop);
var io=new IntersectionObserver(en=>{vis=en[0].isIntersecting;if(vis)run();else{ca(raf);raf=0}});
on(window,"resize",ms);io.observe(R);ms();
/* idle demo: one slide every IDLE ms until the pointer arrives or anything is pressed */
if(!rm)idle=setInterval(()=>vis&&!document.hidden&&go(i<n-1?i+1:0),IDLE);
return()=>{ac.abort();io.disconnect();stop();ca(raf);ca(fr)}}

export default function SliderWithDraggableScrubberHandle() {
  const ref = useRef<any>(null);
  useEffect(() => (ref.current ? init(ref.current) : undefined), []);
  return (
    <section ref={ref} className="w1scr" role="region" aria-roledescription="carousel" aria-label="A day at Pell Street Bakery">
    <style>{CSS}</style>
      <div className="w1scr-head">
        <div>
          <p className="w1scr-kick">Pell Street Bakery</p>
          <h2 className="w1scr-title">One day at the bench</h2>
        </div>
        <div className="w1scr-nav">
          <button className="w1scr-btn w1scr-prev" type="button" aria-label="Previous slide"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <button className="w1scr-btn w1scr-next" type="button" aria-label="Next slide"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
      </div>
      <div className="w1scr-view">
        <div className="w1scr-track">
          <article className="w1scr-slide" role="group" aria-roledescription="slide" aria-label="1 of 6" data-name="04:30 Ovens on"><p className="w1scr-time">04:30</p><h3 className="w1scr-name">Ovens on</h3><p className="w1scr-text">The deck oven takes an hour to reach heat, so the first job is lighting it and feeding the rye starter.</p></article>
          <article className="w1scr-slide" role="group" aria-roledescription="slide" aria-label="2 of 6" data-name="05:45 Shaping"><p className="w1scr-time">05:45</p><h3 className="w1scr-name">Shaping</h3><p className="w1scr-text">Yesterday's dough comes out of the cold room and is shaped into batards and long tin loaves.</p></article>
          <article className="w1scr-slide" role="group" aria-roledescription="slide" aria-label="3 of 6" data-name="07:00 Doors open"><p className="w1scr-time">07:00</p><h3 className="w1scr-name">Doors open</h3><p className="w1scr-text">The first bake goes on the racks by the window while the coffee machine warms up.</p></article>
          <article className="w1scr-slide" role="group" aria-roledescription="slide" aria-label="4 of 6" data-name="10:30 Pastry"><p className="w1scr-time">10:30</p><h3 className="w1scr-name">Pastry</h3><p className="w1scr-text">Laminated dough for tomorrow's croissants is rolled, folded and rested three times.</p></article>
          <article className="w1scr-slide" role="group" aria-roledescription="slide" aria-label="5 of 6" data-name="13:00 Second bake"><p className="w1scr-time">13:00</p><h3 className="w1scr-name">Second bake</h3><p className="w1scr-text">Focaccia and seeded rolls for the lunch trade, topped with whatever the market had.</p></article>
          <article className="w1scr-slide" role="group" aria-roledescription="slide" aria-label="6 of 6" data-name="16:00 Mix for tomorrow"><p className="w1scr-time">16:00</p><h3 className="w1scr-name">Mix for tomorrow</h3><p className="w1scr-text">Flour, water and starter are mixed, then left to rise slowly in the cold overnight.</p></article>
        </div>
      </div>
      <div className="w1scr-scrub">
        <div className="w1scr-bar"><span className="w1scr-line" aria-hidden="true"></span><span className="w1scr-knob" role="slider" tabIndex="0" aria-label="Time of day" aria-valuemin="1" aria-valuemax="6" aria-valuenow="1" aria-valuetext="04:30 Ovens on"><span className="w1scr-grip" aria-hidden="true"></span></span></div>
        <div className="w1scr-ticks" aria-hidden="true"><span className="w1scr-tick">04:30</span><span className="w1scr-tick">05:45</span><span className="w1scr-tick">07:00</span><span className="w1scr-tick">10:30</span><span className="w1scr-tick">13:00</span><span className="w1scr-tick">16:00</span></div>
      </div>
      <p className="w1scr-live" aria-live="polite"></p>
    </section>
  );
}
