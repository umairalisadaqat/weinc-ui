import { useEffect, useRef } from "react";

const CSS = `
  /* Change these: frame colour, text colour, slider height, darkness of the shade behind captions. */
  .w1her { --w1her-bg: #1c1d1f; --w1her-text: #f4f2ee; --w1her-h: clamp(460px, 62vw, 640px); --w1her-shade: .8; }
  .w1her, .w1her * { box-sizing: border-box; }
  .w1her { position: relative; overflow: hidden; height: var(--w1her-h); background: var(--w1her-bg); color: var(--w1her-text); font-family: ui-sans-serif, system-ui, sans-serif; }
  .w1her-view { position: absolute; inset: 0; overflow: hidden; }
  .w1her-track { display: flex; height: 100%; touch-action: pan-y; cursor: grab; user-select: none; -webkit-user-select: none; will-change: transform; }
  .w1her-track:active { cursor: grabbing; }
  .w1her-slide { position: relative; flex: 0 0 100%; height: 100%; overflow: hidden; }
  .w1her-img { position: absolute; top: 0; bottom: 0; left: -22%; width: 144%; will-change: transform; }
  .w1her-img img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
  .w1her-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20, 21, 23, .55) 0%, rgba(20, 21, 23, 0) 24%, rgba(20, 21, 23, .25) 45%, rgba(20, 21, 23, var(--w1her-shade)) 100%); }
  .w1her-cap { text-shadow: 0 1px 12px rgba(0, 0, 0, .45); position: absolute; left: max(24px, 6vw); bottom: 48px; max-width: 32rem; }
  .w1her-place { margin: 0; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: #e2ded6; }
  .w1her-name { margin: 10px 0 0; font-size: clamp(30px, 5vw, 56px); font-weight: 500; line-height: 1.02; letter-spacing: -.025em; }
  .w1her-link { display: inline-flex; align-items: center; min-height: 44px; margin-top: 14px; padding: 0 20px; border-radius: 999px; background: var(--w1her-text); color: #1c1d1f; font-size: 14px; font-weight: 600; text-decoration: none; text-shadow: none; }
  .w1her-link:focus-visible, .w1her-btn:focus-visible { outline: 2px solid var(--w1her-text); outline-offset: 4px; }
  .w1her-top { position: absolute; top: 28px; left: max(24px, 6vw); right: 24px; display: flex; justify-content: space-between; align-items: baseline; gap: 12px; pointer-events: none; }
  .w1her-brand { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -.01em; }
  .w1her-sub { margin: 0; font-size: 13px; color: #e2ded6; }
  .w1her-ctl { text-shadow: 0 1px 8px rgba(0, 0, 0, .5); position: absolute; right: max(24px, 6vw); bottom: 52px; display: flex; align-items: center; gap: 10px; }
  .w1her-count { margin: 0 10px 0 0; font-size: 14px; font-variant-numeric: tabular-nums; letter-spacing: .06em; }
  .w1her-btn { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 999px; border: 1px solid rgba(244, 242, 238, .5); background: rgba(28, 29, 31, .35); color: inherit; cursor: pointer; transition: opacity .2s, background-color .2s; }
  .w1her-btn:hover:not(:disabled) { background: rgba(28, 29, 31, .7); }
  .w1her-btn:disabled { opacity: .4; cursor: default; }
  .w1her-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 640px) { .w1her-cap { bottom: 104px; } .w1her-ctl { left: 24px; right: auto; bottom: 36px; } }
  @media (prefers-reduced-motion: reduce) { .w1her-img { left: 0; width: 100%; transform: none !important; } .w1her-btn { transition: none; } }
`;

/* Change these: glide friction, snap spring, damping, parallax depth (0 = none, 0.5 = image moves at half speed), idle advance (ms). */
var FRICTION=.92,SPRING=.05,DAMP=.8,DEPTH=.4,IDLE=4000;
function init(R: any){
var q=s=>R.querySelector(".w1her-"+s),V=q("view"),T=q("track"),C=q("count"),L=q("live"),P=q("prev"),N=q("next"),
S=[...R.querySelectorAll(".w1her-slide")],n=S.length,rm=matchMedia("(prefers-reduced-motion: reduce)").matches,
x=0,v=0,lo=0,hi=0,pts=[],i=0,mode=0,tgt=0,raf=0,fr=0,d=0,moved=0,h=[],vis=1,idle=0,
ac=new AbortController(),on=(el,t,f,c)=>el.addEventListener(t,f,{signal:ac.signal,capture:!!c}),
M=Math,A=M.abs,cl=(a,b,c)=>M.max(b,M.min(c,a)),rq=requestAnimationFrame,ca=cancelAnimationFrame,
near=p=>{var b=0;pts.forEach((t,k)=>{if(A(t-p)<A(pts[b]-p))b=k});return b};
function ms(){pts=S.map(s=>-s.offsetLeft);hi=0;lo=pts[n-1];x=pts[i];draw()}
function draw(){T.style.transform="translate3d("+x+"px,0,0)";i=near(x);
/* each photo slides the other way inside its mask, so it seems to move slower */
S.forEach((s,k)=>s.firstElementChild.style.transform=`translate3d(${(x-pts[k])*-DEPTH}px,0,0)`);
C.textContent=`0${i+1} / 0${n}`;
P.disabled=!i;N.disabled=i==n-1}
function loop(){
if(mode==1){x+=v;v*=x>hi||x<lo?.6:FRICTION;if(A(v)<3){mode=2;tgt=pts[near(x+v*9)]}}
else{v=(v+(tgt-x)*SPRING)*DAMP;x+=v;if(A(tgt-x)<.4&&A(v)<.4){x=tgt;mode=0}}
draw();raf=mode&&vis?rq(loop):0}
function run(){if(!raf&&mode&&vis)raf=rq(loop)}
function go(k: any, say: any){k=cl(k,0,n-1);tgt=pts[k];
if(rm){mode=0;x=tgt;draw()}else{mode=2;run()}
if(say)L.textContent="Slide "+(k+1)+" of "+n}
function stop(){clearInterval(idle)}
on(T,"pointerdown",e=>{if(e.button)return;stop();ca(raf);raf=mode=moved=0;d={p:e.clientX,s:x,id:e.pointerId};h=[[e.timeStamp,x]]});
on(T,"pointermove",e=>{if(!d)return;var m=d.s+e.clientX-d.p,t=e.timeStamp;
if(!moved&&A(m-d.s)>6){moved=1;T.setPointerCapture(d.id)}
if(!moved)return;
x=m>hi?hi+(m-hi)*.35:m<lo?lo+(m-lo)*.35:m;
h.push([t,x]);while(h.length>2&&t-h[0][0]>100)h.shift();
if(!fr)fr=rq(()=>{fr=0;draw()})});
function up(e: any){if(!d)return;d=0;if(!moved)return;
var a=h[0],b=h[h.length-1],t=b[0]-a[0];
/* release speed from the last 100 ms of moves */
v=t>0&&e.timeStamp-b[0]<80?(b[1]-a[1])/t*16.7:0;
if(rm)go(near(x));else{mode=1;run()}}
on(T,"pointerup",up);on(T,"pointercancel",up);
on(T,"click",e=>{if(moved){e.preventDefault();e.stopPropagation();moved=0}},1);
on(P,"click",()=>{stop();go(i-1,1)});on(N,"click",()=>{stop();go(i+1,1)});
on(R,"keydown",e=>{var k={ArrowLeft:-1,ArrowRight:1}[e.key];if(k){e.preventDefault();stop();go(i+k,1)}});
on(R,"focusin",e=>{stop();V.scrollLeft=0;var s=e.target.closest(".w1her-slide");if(s)go(S.indexOf(s))});
on(R,"pointerenter",stop);
var io=new IntersectionObserver(en=>{vis=en[0].isIntersecting;if(vis)run();else{ca(raf);raf=0}});
on(window,"resize",ms);io.observe(R);ms();
/* idle demo: one sleeve every IDLE ms until the pointer arrives or anything is pressed */
if(!rm)idle=setInterval(()=>vis&&!document.hidden&&go(i<n-1?i+1:0),IDLE);
return()=>{ac.abort();io.disconnect();stop();ca(raf);ca(fr)}}

export default function FullBleedHeroSliderWithParallaxPhotos() {
  const ref = useRef<any>(null);
  useEffect(() => (ref.current ? init(ref.current) : undefined), []);
  return (
    <section ref={ref} className="w1her" role="region" aria-roledescription="carousel" aria-label="Recent houses by Arden Vale Architects">
    <style>{CSS}</style>
      <div className="w1her-view">
        <div className="w1her-track">
          <div className="w1her-slide" role="group" aria-roledescription="slide" aria-label="1 of 5"><span className="w1her-img"><img src="https://images.pexels.com/photos/27953061/pexels-photo-27953061.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Two white houses with steep gables against a deep blue sky" width="1600" height="1000" draggable="false" /></span><span className="w1her-shade" aria-hidden="true"></span><div className="w1her-cap"><p className="w1her-place">Cove Lane, Whitstable</p><h3 className="w1her-name">Two white gables</h3><a className="w1her-link" href="#" draggable="false">View project</a></div></div>
          <div className="w1her-slide" role="group" aria-roledescription="slide" aria-label="2 of 5"><span className="w1her-img"><img src="https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="A modern white house with curved glass balconies and dark window frames" width="1600" height="1000" draggable="false" /></span><span className="w1her-shade" aria-hidden="true"></span><div className="w1her-cap"><p className="w1her-place">Harbour Road, Poole</p><h3 className="w1her-name">Glass balcony house</h3><a className="w1her-link" href="#" draggable="false">View project</a></div></div>
          <div className="w1her-slide" role="group" aria-roledescription="slide" aria-label="3 of 5"><span className="w1her-img"><img src="https://images.pexels.com/photos/30580640/pexels-photo-30580640.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Two matching modern white houses with dark roofs on a new street under clouds" width="1600" height="1000" draggable="false" /></span><span className="w1her-shade" aria-hidden="true"></span><div className="w1her-cap"><p className="w1her-place">Elm Street, Leiden</p><h3 className="w1her-name">Twin family homes</h3><a className="w1her-link" href="#" draggable="false">View project</a></div></div>
          <div className="w1her-slide" role="group" aria-roledescription="slide" aria-label="4 of 5"><span className="w1her-img"><img src="https://images.pexels.com/photos/7031581/pexels-photo-7031581.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="A straight stone path through a green lawn beside a modern grey and timber house" width="1600" height="1000" draggable="false" /></span><span className="w1her-shade" aria-hidden="true"></span><div className="w1her-cap"><p className="w1her-place">Larch Close, Ghent</p><h3 className="w1her-name">Garden path, Larch House</h3><a className="w1her-link" href="#" draggable="false">View project</a></div></div>
          <div className="w1her-slide" role="group" aria-roledescription="slide" aria-label="5 of 5"><span className="w1her-img"><img src="https://images.pexels.com/photos/19516616/pexels-photo-19516616.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="A brick townhouse terrace with a stepped gable behind a clipped hedge" width="1600" height="1000" draggable="false" /></span><span className="w1her-shade" aria-hidden="true"></span><div className="w1her-cap"><p className="w1her-place">Mill Row, Utrecht</p><h3 className="w1her-name">Brick terrace</h3><a className="w1her-link" href="#" draggable="false">View project</a></div></div>
        </div>
      </div>
      <div className="w1her-top">
        <h2 className="w1her-brand">Arden Vale Architects</h2>
        <p className="w1her-sub">Selected houses</p>
      </div>
      <div className="w1her-ctl">
        <p className="w1her-count" aria-hidden="true">01 / 05</p>
        <button className="w1her-btn w1her-prev" type="button" aria-label="Previous slide"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        <button className="w1her-btn w1her-next" type="button" aria-label="Next slide"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      </div>
      <p className="w1her-live" aria-live="polite"></p>
    </section>
  );
}
