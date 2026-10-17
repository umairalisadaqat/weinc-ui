import { useEffect, useRef } from "react";

const CSS = `
  /* Change these: background, text, sleeve size, depth of the 3D view. */
  .w1cov { --w1cov-bg: #0f1a2b; --w1cov-text: #eef1f5; --w1cov-size: clamp(190px, 24vw, 270px); --w1cov-depth: 900px; }
  .w1cov, .w1cov * { box-sizing: border-box; }
  .w1cov { position: relative; overflow: hidden; background: radial-gradient(ellipse at 50% 60%, #1b2b45 0%, var(--w1cov-bg) 65%); color: var(--w1cov-text); padding: 60px 0 52px; font-family: ui-sans-serif, system-ui, sans-serif; text-align: center; }
  .w1cov-kick { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .24em; text-transform: uppercase; color: #c9a46b; }
  .w1cov-title { margin: 12px 0 0; font-size: clamp(28px, 4vw, 42px); font-weight: 600; letter-spacing: -.02em; }
  .w1cov-view { margin-top: 40px; overflow: hidden; perspective: var(--w1cov-depth); }
  .w1cov-track { display: flex; width: max-content; padding: 20px 0 40px; touch-action: pan-y; cursor: grab; user-select: none; -webkit-user-select: none; transform-style: preserve-3d; will-change: transform; }
  .w1cov-track:active { cursor: grabbing; }
  .w1cov-slide { position: relative; width: calc(var(--w1cov-size) * .62); flex: none; transform-style: preserve-3d; }
  .w1cov-card { position: relative; display: block; width: var(--w1cov-size); margin-left: calc(var(--w1cov-size) * -.19); aspect-ratio: 1; border-radius: 3px; overflow: hidden; background: var(--bg); color: var(--fg); text-decoration: none; text-align: left; box-shadow: 0 30px 40px -24px rgba(0, 0, 0, .8); will-change: transform; -webkit-box-reflect: below 2px linear-gradient(transparent 70%, rgba(255, 255, 255, .12)); }
  .w1cov-card:focus-visible, .w1cov-btn:focus-visible { outline: 2px solid #c9a46b; outline-offset: 4px; }
  .w1cov-c1 { --bg: #c9a46b; --fg: #23324a; }
  .w1cov-c2 { --bg: #d9d2c3; --fg: #8a3b2e; }
  .w1cov-c3 { --bg: #e7dcc7; --fg: #2f5d62; }
  .w1cov-c4 { --bg: #1d2433; --fg: #d4a24c; }
  .w1cov-c5 { --bg: #7a8f9e; --fg: #f0e8da; }
  .w1cov-c6 { --bg: #b7553a; --fg: #f2e6d0; }
  .w1cov-c7 { --bg: #e8e2d6; --fg: #22303f; }
  .w1cov-art { position: absolute; inset: 0; }
  .w1cov-circle::before { content: ""; position: absolute; width: 58%; aspect-ratio: 1; left: 21%; top: 14%; border-radius: 50%; background: var(--fg); opacity: .9; }
  .w1cov-stripe { inset: 0 0 38% 0; background: repeating-linear-gradient(90deg, transparent 0 14px, var(--fg) 14px 18px); opacity: .55; }
  .w1cov-arc::before { content: ""; position: absolute; width: 130%; aspect-ratio: 1; left: -15%; top: 46%; border-radius: 50%; border: 14px solid var(--fg); opacity: .8; }
  .w1cov-grid::before { content: ""; position: absolute; left: 16px; right: 16px; top: 16px; height: 46%; border-top: 3px solid var(--fg); border-bottom: 3px solid var(--fg); background: repeating-linear-gradient(0deg, transparent 0 18px, var(--fg) 18px 20px); opacity: .85; }
  .w1cov-txt { position: absolute; left: 16px; right: 16px; bottom: 14px; }
  .w1cov-t { display: block; font-size: 17px; font-weight: 700; letter-spacing: -.01em; }
  .w1cov-a { display: block; margin-top: 2px; font-size: 12px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; }
  .w1cov-foot { display: flex; align-items: center; justify-content: center; gap: 20px; }
  .w1cov-count { margin: 0; min-width: 11rem; font-size: 16px; font-weight: 600; }
  .w1cov-btn { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 999px; border: 1px solid rgba(238, 241, 245, .3); background: transparent; color: inherit; cursor: pointer; transition: opacity .2s, background-color .2s; }
  .w1cov-btn:hover:not(:disabled) { background: rgba(238, 241, 245, .1); }
  .w1cov-btn:disabled { opacity: .35; cursor: default; }
  .w1cov-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (prefers-reduced-motion: reduce) { .w1cov-btn { transition: none; } }
`;

/* Change these: glide friction, snap spring, damping, how far side sleeves turn (deg), idle advance (ms). */
var FRICTION=.94,SPRING=.09,DAMP=.72,TURN=48,IDLE=4000;
function init(R: any){
var q=s=>R.querySelector(".w1cov-"+s),V=q("view"),T=q("track"),C=q("count"),L=q("live"),P=q("prev"),N=q("next"),
S=[...R.querySelectorAll(".w1cov-slide")],n=S.length,rm=matchMedia("(prefers-reduced-motion: reduce)").matches,
x=0,v=0,lo=0,hi=0,pts=[],i=0,mode=0,tgt=0,raf=0,fr=0,d=0,moved=0,h=[],vis=1,idle=0,
ac=new AbortController(),on=(el,t,f,c)=>el.addEventListener(t,f,{signal:ac.signal,capture:!!c}),
M=Math,A=M.abs,cl=(a,b,c)=>M.max(b,M.min(c,a)),rq=requestAnimationFrame,ca=cancelAnimationFrame,
near=p=>{var b=0;pts.forEach((t,k)=>{if(A(t-p)<A(pts[b]-p))b=k});return b};
/* every slide has a resting x that puts its centre in the middle of the view */
function ms(){pts=S.map(s=>V.clientWidth/2-s.offsetLeft-s.offsetWidth/2);hi=pts[0];lo=pts[n-1];x=pts[i];draw()}
function draw(){T.style.transform="translate3d("+x+"px,0,0)";i=near(x);
S.forEach((s,k)=>{var w=s.offsetWidth,e=cl((pts[k]-x)/w,-3,3),a=A(e);
/* distance from centre turns, shrinks and pushes back each sleeve */
s.firstElementChild.style.transform=`translate3d(${-e*w*.38}px,0,${-a*120}px) rotateY(${cl(e*TURN,-TURN,TURN)}deg) scale(${1-M.min(a,2)*.08})`;
s.style.zIndex=99-M.round(a*9)});
C.textContent=S[i].dataset.name;P.disabled=!i;N.disabled=i==n-1}
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
on(R,"focusin",e=>{stop();V.scrollLeft=0;var s=e.target.closest(".w1cov-slide");if(s)go(S.indexOf(s))});
on(R,"pointerenter",stop);
var io=new IntersectionObserver(en=>{vis=en[0].isIntersecting;if(vis)run();else{ca(raf);raf=0}});
on(window,"resize",ms);io.observe(R);i=2;ms();
/* idle demo: one sleeve every IDLE ms until the pointer arrives or anything is pressed */
if(!rm)idle=setInterval(()=>vis&&!document.hidden&&go(i<n-1?i+1:0),IDLE);
return()=>{ac.abort();io.disconnect();stop();ca(raf);ca(fr)}}

export default function CoverFlowRecordSlider() {
  const ref = useRef<any>(null);
  useEffect(() => (ref.current ? init(ref.current) : undefined), []);
  return (
    <section ref={ref} className="w1cov" role="region" aria-roledescription="carousel" aria-label="New pressings from Tidewater Records">
    <style>{CSS}</style>
      <div className="w1cov-head">
        <p className="w1cov-kick">Tidewater Records</p>
        <h2 className="w1cov-title">New pressings on the shelf</h2>
      </div>
      <div className="w1cov-view">
        <div className="w1cov-track">
          <div className="w1cov-slide" role="group" aria-roledescription="slide" aria-label="1 of 7" data-name="Low Tide Hours"><a className="w1cov-card w1cov-c1" href="#" draggable="false"><span className="w1cov-art w1cov-stripe" aria-hidden="true"></span><span className="w1cov-txt"><span className="w1cov-t">Low Tide Hours</span><span className="w1cov-a">Marla Quist</span></span></a></div>
          <div className="w1cov-slide" role="group" aria-roledescription="slide" aria-label="2 of 7" data-name="Harbour Lights"><a className="w1cov-card w1cov-c2" href="#" draggable="false"><span className="w1cov-art w1cov-circle" aria-hidden="true"></span><span className="w1cov-txt"><span className="w1cov-t">Harbour Lights</span><span className="w1cov-a">The Fenwick Trio</span></span></a></div>
          <div className="w1cov-slide" role="group" aria-roledescription="slide" aria-label="3 of 7" data-name="Salt and Cedar"><a className="w1cov-card w1cov-c3" href="#" draggable="false"><span className="w1cov-art w1cov-arc" aria-hidden="true"></span><span className="w1cov-txt"><span className="w1cov-t">Salt and Cedar</span><span className="w1cov-a">Juno Ashby</span></span></a></div>
          <div className="w1cov-slide" role="group" aria-roledescription="slide" aria-label="4 of 7" data-name="North Pier"><a className="w1cov-card w1cov-c4" href="#" draggable="false"><span className="w1cov-art w1cov-grid" aria-hidden="true"></span><span className="w1cov-txt"><span className="w1cov-t">North Pier</span><span className="w1cov-a">Ola Brennan</span></span></a></div>
          <div className="w1cov-slide" role="group" aria-roledescription="slide" aria-label="5 of 7" data-name="Slow Current"><a className="w1cov-card w1cov-c5" href="#" draggable="false"><span className="w1cov-art w1cov-circle" aria-hidden="true"></span><span className="w1cov-txt"><span className="w1cov-t">Slow Current</span><span className="w1cov-a">Ivo and the Shoals</span></span></a></div>
          <div className="w1cov-slide" role="group" aria-roledescription="slide" aria-label="6 of 7" data-name="Fog Signals"><a className="w1cov-card w1cov-c6" href="#" draggable="false"><span className="w1cov-art w1cov-stripe" aria-hidden="true"></span><span className="w1cov-txt"><span className="w1cov-t">Fog Signals</span><span className="w1cov-a">Marla Quist</span></span></a></div>
          <div className="w1cov-slide" role="group" aria-roledescription="slide" aria-label="7 of 7" data-name="Winter Ferry"><a className="w1cov-card w1cov-c7" href="#" draggable="false"><span className="w1cov-art w1cov-arc" aria-hidden="true"></span><span className="w1cov-txt"><span className="w1cov-t">Winter Ferry</span><span className="w1cov-a">Hollis Day</span></span></a></div>
        </div>
      </div>
      <div className="w1cov-foot">
        <button className="w1cov-btn w1cov-prev" type="button" aria-label="Previous slide"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        <p className="w1cov-count">Salt and Cedar</p>
        <button className="w1cov-btn w1cov-next" type="button" aria-label="Next slide"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      </div>
      <p className="w1cov-live" aria-live="polite"></p>
    </section>
  );
}
