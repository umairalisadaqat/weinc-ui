import { useEffect, useRef } from "react";

const CSS = `
  /* Change these: paper colour, ink colour, clay accent, card width. */
  .w1rai { --w1rai-paper: #f3ede4; --w1rai-ink: #2b2420; --w1rai-clay: #9a4a28; --w1rai-card: clamp(230px, 27vw, 310px); }
  .w1rai, .w1rai * { box-sizing: border-box; }
  .w1rai { position: relative; overflow: hidden; background: var(--w1rai-paper); color: var(--w1rai-ink); padding: 64px 0 56px; font-family: ui-sans-serif, system-ui, sans-serif; }
  .w1rai-head, .w1rai-foot { max-width: 72rem; margin: 0 auto; padding: 0 24px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
  .w1rai-kick { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .24em; text-transform: uppercase; color: var(--w1rai-clay); }
  .w1rai-title { margin: 12px 0 0; font-family: ui-serif, Georgia, serif; font-size: clamp(28px, 4vw, 44px); font-weight: 500; line-height: 1.1; letter-spacing: -.01em; }
  .w1rai-nav { display: flex; gap: 10px; }
  .w1rai-btn { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 999px; border: 1px solid rgba(43, 36, 32, .25); background: transparent; color: var(--w1rai-ink); cursor: pointer; transition: background-color .2s, color .2s, opacity .2s; }
  .w1rai-btn:hover:not(:disabled) { background: var(--w1rai-ink); color: var(--w1rai-paper); }
  .w1rai-btn:disabled { opacity: .35; cursor: default; }
  .w1rai-btn:focus-visible, .w1rai-card:focus-visible { outline: 2px solid var(--w1rai-clay); outline-offset: 4px; }
  .w1rai-view { margin-top: 40px; overflow: hidden; }
  .w1rai-track { position: relative; display: flex; gap: 20px; width: max-content; padding: 4px max(24px, calc((100vw - 72rem) / 2 + 24px)) 8px; touch-action: pan-y; cursor: grab; user-select: none; -webkit-user-select: none; will-change: transform; }
  .w1rai.w1rai-drag .w1rai-track { cursor: grabbing; }
  .w1rai-slide { width: var(--w1rai-card); flex: none; }
  .w1rai-card { display: block; color: inherit; text-decoration: none; border-radius: 6px; -webkit-user-drag: none; }
  .w1rai-ph { position: relative; display: block; aspect-ratio: 4 / 5; overflow: hidden; border-radius: 6px; background: #e2d8ca; box-shadow: 0 1px 2px rgba(43, 36, 32, .08), 0 14px 30px -18px rgba(43, 36, 32, .45); }
  .w1rai-ph img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .6s cubic-bezier(.2, .7, .2, 1); pointer-events: none; }
  .w1rai-card:hover img, .w1rai-card:focus-visible img { transform: scale(1.04); }
  .w1rai-name { display: block; margin-top: 14px; font-family: ui-serif, Georgia, serif; font-size: 19px; }
  .w1rai-note { display: block; margin-top: 4px; font-size: 14px; color: #5e534b; }
  .w1rai-foot { margin-top: 32px; align-items: center; }
  .w1rai-bar { position: relative; flex: 1; height: 2px; max-width: 420px; background: rgba(43, 36, 32, .15); overflow: hidden; }
  .w1rai-fill { position: absolute; inset: 0; background: var(--w1rai-ink); transform-origin: 0 50%; transform: scaleX(.3); }
  .w1rai-count { font-size: 13px; font-variant-numeric: tabular-nums; letter-spacing: .08em; color: #5e534b; }
  .w1rai-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 560px) { .w1rai-btn { width: 44px; height: 44px; } .w1rai-head { align-items: flex-start; flex-direction: column; } }
  @media (prefers-reduced-motion: reduce) { .w1rai-ph img, .w1rai-btn { transition: none; } .w1rai-card:hover img { transform: none; } }
`;

/* Change these: glide friction per frame (nearer 1 glides further), snap spring, its damping, idle advance (ms). */
var FRICTION=.93,SPRING=.1,DAMP=.7,IDLE=4000;
function init(R: any){
var q=s=>R.querySelector(".w1rai-"+s),V=q("view"),T=q("track"),F=q("fill"),C=q("count"),L=q("live"),P=q("prev"),N=q("next"),
S=[...R.querySelectorAll(".w1rai-slide")],n=S.length,rm=matchMedia("(prefers-reduced-motion: reduce)").matches,
x=0,v=0,min=0,pts=[0],i=0,mode=0,tgt=0,raf=0,fr=0,d=0,moved=0,h=[],vis=1,idle=0,
ac=new AbortController(),on=(el,t,f,c)=>el.addEventListener(t,f,{signal:ac.signal,capture:!!c}),
M=Math,A=M.abs,cl=(a,lo,hi)=>M.max(lo,M.min(hi,a)),rq=requestAnimationFrame,ca=cancelAnimationFrame,
z=k=>(k<10?"0":"")+k,last=()=>pts.length-1,num=k=>k==last()?n:k+1,
near=p=>{var b=0;pts.forEach((t,k)=>{if(A(t-p)<A(pts[b]-p))b=k});return b};
function measure(){min=M.min(0,V.clientWidth-T.offsetWidth);pts=[0];
S.forEach(s=>{var p=M.max(min,S[0].offsetLeft-s.offsetLeft);if(pts[last()]-p>1)pts.push(p)});
x=cl(x,min,0);draw()}
function draw(){T.style.transform="translate3d("+x+"px,0,0)";i=near(x);
var f=V.clientWidth/T.offsetWidth;
/* the bar grows with scaleX, never width */
F.style.transform="scaleX("+(f+(1-f)*(min?cl(x/min,0,1):1))+")";
C.textContent=z(num(i))+" / "+z(n);P.disabled=x>-1;N.disabled=x<min+1}
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
on(R,"focusin",e=>{stop();V.scrollLeft=0;var s=e.target.closest(".w1rai-slide");if(s)go(S.indexOf(s))});
on(R,"pointerenter",stop);
var io=new IntersectionObserver(en=>{vis=en[0].isIntersecting;if(vis)run();else{ca(raf);raf=0}});
on(window,"resize",measure);io.observe(R);measure();
/* idle demo: one slide every IDLE ms until the pointer arrives or anything is pressed */
if(!rm)idle=setInterval(()=>vis&&!document.hidden&&go(i<last()?i+1:0),IDLE);
return()=>{ac.abort();io.disconnect();stop();ca(raf);ca(fr)}}

export default function MomentumCardRailWithProgressBar() {
  const ref = useRef<any>(null);
  useEffect(() => (ref.current ? init(ref.current) : undefined), []);
  return (
    <section ref={ref} className="w1rai" role="region" aria-roledescription="carousel" aria-label="Pieces from the Fennick Clay Studio">
    <style>{CSS}</style>
      <div className="w1rai-head">
        <div>
          <p className="w1rai-kick">Fennick Clay Studio</p>
          <h2 className="w1rai-title">From the wheel this month</h2>
        </div>
        <div className="w1rai-nav">
          <button className="w1rai-btn w1rai-prev" type="button" aria-label="Previous slide"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <button className="w1rai-btn w1rai-next" type="button" aria-label="Next slide"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
      </div>
      <div className="w1rai-view">
        <div className="w1rai-track">
          <div className="w1rai-slide" role="group" aria-roledescription="slide" aria-label="1 of 6"><a className="w1rai-card" href="#" draggable="false"><span className="w1rai-ph"><img src="https://images.pexels.com/photos/29286721/pexels-photo-29286721.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Rows of unglazed bottle vases drying on a workshop rack" width="640" height="800" draggable="false" /></span><span className="w1rai-name">Bisque bottle vases</span><span className="w1rai-note">Drying on the rack before glaze</span></a></div>
          <div className="w1rai-slide" role="group" aria-roledescription="slide" aria-label="2 of 6"><a className="w1rai-card" href="#" draggable="false"><span className="w1rai-ph"><img src="https://images.pexels.com/photos/15122651/pexels-photo-15122651.jpeg?auto=compress&cs=tinysrgb&w=800" alt="A potter in an apron using a small torch on a tall clay vase" width="640" height="800" draggable="false" /></span><span className="w1rai-name">Firming with a torch</span><span className="w1rai-note">A tall vase before trimming</span></a></div>
          <div className="w1rai-slide" role="group" aria-roledescription="slide" aria-label="3 of 6"><a className="w1rai-card" href="#" draggable="false"><span className="w1rai-ph"><img src="https://images.pexels.com/photos/16124848/pexels-photo-16124848.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Two white vases painted with pink and blue flowers on a tree stump" width="640" height="800" draggable="false" /></span><span className="w1rai-name">Pink and blue florals</span><span className="w1rai-note">A pair of painted bud vases</span></a></div>
          <div className="w1rai-slide" role="group" aria-roledescription="slide" aria-label="4 of 6"><a className="w1rai-card" href="#" draggable="false"><span className="w1rai-ph"><img src="https://images.pexels.com/photos/32490730/pexels-photo-32490730.jpeg?auto=compress&cs=tinysrgb&w=800" alt="A row of jars glazed with red and blue patterns on a wooden shelf" width="640" height="800" draggable="false" /></span><span className="w1rai-name">Patterned jars</span><span className="w1rai-note">Red and cobalt glaze, shop shelf</span></a></div>
          <div className="w1rai-slide" role="group" aria-roledescription="slide" aria-label="5 of 6"><a className="w1rai-card" href="#" draggable="false"><span className="w1rai-ph"><img src="https://images.pexels.com/photos/18449692/pexels-photo-18449692.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Large terracotta urns and vases standing among green palm leaves" width="640" height="800" draggable="false" /></span><span className="w1rai-name">Terracotta urns</span><span className="w1rai-note">Unglazed, for the garden room</span></a></div>
          <div className="w1rai-slide" role="group" aria-roledescription="slide" aria-label="6 of 6"><a className="w1rai-card" href="#" draggable="false"><span className="w1rai-ph"><img src="https://images.pexels.com/photos/37821669/pexels-photo-37821669.jpeg?auto=compress&cs=tinysrgb&w=800" alt="A potter seated beside two brown clay vases in his workshop" width="640" height="800" draggable="false" /></span><span className="w1rai-name">A wheel-thrown pair</span><span className="w1rai-note">Two brown vases with their maker</span></a></div>
        </div>
      </div>
      <div className="w1rai-foot">
        <span className="w1rai-bar" aria-hidden="true"><span className="w1rai-fill"></span></span>
        <span className="w1rai-count" aria-hidden="true">01 / 06</span>
      </div>
      <p className="w1rai-live" aria-live="polite"></p>
    </section>
  );
}
