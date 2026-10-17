import { useEffect, useRef } from "react";

const CSS = `
  /* Change these: background, text, accent for the quote mark and initials, quote size. */
  .w1quo { --w1quo-bg: #f1e3d6; --w1quo-text: #3a2119; --w1quo-accent: #b4532f; --w1quo-size: clamp(22px, 2.6vw, 32px); }
  .w1quo, .w1quo * { box-sizing: border-box; }
  .w1quo { position: relative; overflow: hidden; background: var(--w1quo-bg); color: var(--w1quo-text); padding: 72px 24px; font-family: ui-sans-serif, system-ui, sans-serif; }
  .w1quo-wrap { max-width: 72rem; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2.2fr); gap: 56px; align-items: start; }
  .w1quo-kick { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: #8e3f22; }
  .w1quo-title { margin: 14px 0 0; font-size: clamp(26px, 3vw, 36px); font-weight: 600; line-height: 1.15; letter-spacing: -.015em; }
  .w1quo-ctl { display: flex; align-items: center; gap: 14px; margin-top: 32px; }
  .w1quo-count { font-size: 14px; font-variant-numeric: tabular-nums; letter-spacing: .06em; }
  .w1quo-btn { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 999px; border: 1.5px solid var(--w1quo-text); background: transparent; color: inherit; cursor: pointer; transition: background-color .2s, color .2s, opacity .2s; }
  .w1quo-btn:hover:not(:disabled) { background: var(--w1quo-text); color: var(--w1quo-bg); }
  .w1quo-btn:disabled { opacity: .3; cursor: default; }
  .w1quo-btn:focus-visible { outline: 2px solid var(--w1quo-accent); outline-offset: 4px; }
  .w1quo-view { position: relative; overflow: hidden; padding-top: 52px; }
  .w1quo-mark { position: absolute; top: 0; left: 0; width: 64px; height: 48px; color: var(--w1quo-accent); }
  .w1quo-track { display: flex; touch-action: pan-y; cursor: grab; user-select: none; -webkit-user-select: none; will-change: transform; }
  .w1quo-track:active { cursor: grabbing; }
  .w1quo-slide { flex: 0 0 100%; margin: 0; will-change: opacity; }
  .w1quo-inner { padding-right: 8%; }
  .w1quo-q { margin: 0; }
  .w1quo-q p { margin: 0; font-family: ui-serif, Georgia, serif; font-size: var(--w1quo-size); line-height: 1.38; letter-spacing: -.005em; }
  .w1quo-by { display: flex; align-items: center; gap: 14px; margin-top: 28px; }
  .w1quo-av { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 999px; background: var(--w1quo-accent); color: #fff7ef; font-size: 14px; font-weight: 700; }
  .w1quo-nm { display: block; font-size: 15px; font-weight: 600; }
  .w1quo-it { display: block; font-size: 14px; color: #6b4a3d; }
  .w1quo-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 760px) { .w1quo-wrap { grid-template-columns: 1fr; gap: 28px; } .w1quo-ctl { margin-top: 20px; } }
  @media (prefers-reduced-motion: reduce) { .w1quo-btn { transition: none; } }
`;

/* Change these: glide friction, snap spring, damping, how fast a quote fades as it leaves (higher = sooner), idle advance (ms). */
var FRICTION=.9,SPRING=.07,DAMP=.76,FADE=1.7,IDLE=4500;
function init(R: any){
var q=s=>R.querySelector(".w1quo-"+s),V=q("view"),T=q("track"),C=q("count"),L=q("live"),P=q("prev"),N=q("next"),
S=[...R.querySelectorAll(".w1quo-slide")],n=S.length,rm=matchMedia("(prefers-reduced-motion: reduce)").matches,
x=0,v=0,lo=0,hi=0,pts=[],i=0,mode=0,tgt=0,raf=0,fr=0,d=0,moved=0,h=[],vis=1,idle=0,
ac=new AbortController(),on=(el,t,f,c)=>el.addEventListener(t,f,{signal:ac.signal,capture:!!c}),
M=Math,A=M.abs,cl=(a,b,c)=>M.max(b,M.min(c,a)),rq=requestAnimationFrame,ca=cancelAnimationFrame,
near=p=>{var b=0;pts.forEach((t,k)=>{if(A(t-p)<A(pts[b]-p))b=k});return b};
function ms(){pts=S.map(s=>-s.offsetLeft);hi=0;lo=pts[n-1];x=pts[i];draw()}
function draw(){T.style.transform="translate3d("+x+"px,0,0)";i=near(x);
/* a quote fades out as it moves off centre while the next fades in */
S.forEach((s,k)=>{var e=A(x-pts[k])/s.offsetWidth;s.style.opacity=M.max(0,1-e*FADE)});
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
on(R,"focusin",e=>{stop();V.scrollLeft=0;var s=e.target.closest(".w1quo-slide");if(s)go(S.indexOf(s))});
on(R,"pointerenter",stop);
var io=new IntersectionObserver(en=>{vis=en[0].isIntersecting;if(vis)run();else{ca(raf);raf=0}});
on(window,"resize",ms);io.observe(R);ms();
/* idle demo: one sleeve every IDLE ms until the pointer arrives or anything is pressed */
if(!rm)idle=setInterval(()=>vis&&!document.hidden&&go(i<n-1?i+1:0),IDLE);
return()=>{ac.abort();io.disconnect();stop();ca(raf);ca(fr)}}

export default function TestimonialSliderWithBigQuote() {
  const ref = useRef<any>(null);
  useEffect(() => (ref.current ? init(ref.current) : undefined), []);
  return (
    <section ref={ref} className="w1quo" role="region" aria-roledescription="carousel" aria-label="Notes from Calloway Joinery clients">
    <style>{CSS}</style>
      <div className="w1quo-wrap">
        <div className="w1quo-side">
          <p className="w1quo-kick">Calloway Joinery</p>
          <h2 className="w1quo-title">Furniture that came back to us</h2>
          <div className="w1quo-ctl">
            <button className="w1quo-btn w1quo-prev" type="button" aria-label="Previous slide"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M19 12H5m6-6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
            <span className="w1quo-count" aria-hidden="true">01 / 04</span>
            <button className="w1quo-btn w1quo-next" type="button" aria-label="Next slide"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h14m-6-6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          </div>
        </div>
        <div className="w1quo-view">
          <svg className="w1quo-mark" viewBox="0 0 64 48" aria-hidden="true"><path d="M0 48V28C0 12 8 3 24 0l3 6C17 9 13 15 13 22h11v26H0zm37 0V28c0-16 8-25 24-28l3 6c-10 3-14 9-14 16h11v26H37z" fill="currentColor"/></svg>
          <div className="w1quo-track">
          <figure className="w1quo-slide" role="group" aria-roledescription="slide" aria-label="1 of 4"><div className="w1quo-inner"><blockquote className="w1quo-q"><p>The leaf of my grandmother's table had split along the grain. It came back with the crack closed, the old pegs reused, and the scratch from my uncle's toy car left alone, as I asked.</p></blockquote><figcaption className="w1quo-by"><span className="w1quo-av" aria-hidden="true">IH</span><span><span className="w1quo-nm">Imogen Hale</span><span className="w1quo-it">Oak dining table, Frome</span></span></figcaption></div></figure>
          <figure className="w1quo-slide" role="group" aria-roledescription="slide" aria-label="2 of 4"><div className="w1quo-inner"><blockquote className="w1quo-q"><p>We brought in six chairs that did not match and had wobbled for years. Each one now sits flat on the kitchen tiles and they share one new rush seat pattern.</p></blockquote><figcaption className="w1quo-by"><span className="w1quo-av" aria-hidden="true">TW</span><span><span className="w1quo-nm">Tomasz Wilk</span><span className="w1quo-it">Kitchen chairs, Bath</span></span></figcaption></div></figure>
          <figure className="w1quo-slide" role="group" aria-roledescription="slide" aria-label="3 of 4"><div className="w1quo-inner"><blockquote className="w1quo-q"><p>They talked me through French polish against oil before touching the bureau, then sent photos as the layers built up. It looks like it did in the old family pictures.</p></blockquote><figcaption className="w1quo-by"><span className="w1quo-av" aria-hidden="true">RA</span><span><span className="w1quo-nm">Ruth Adeyemi</span><span className="w1quo-it">Walnut bureau, Bristol</span></span></figcaption></div></figure>
          <figure className="w1quo-slide" role="group" aria-roledescription="slide" aria-label="4 of 4"><div className="w1quo-inner"><blockquote className="w1quo-q"><p>A drawer that had not opened since we moved now slides on new oak runners. The brass handles were cleaned, not replaced, which was the part I cared about.</p></blockquote><figcaption className="w1quo-by"><span className="w1quo-av" aria-hidden="true">CR</span><span><span className="w1quo-nm">Callum Rees</span><span className="w1quo-it">Chest of drawers, Wells</span></span></figcaption></div></figure>
          </div>
        </div>
      </div>
      <p className="w1quo-live" aria-live="polite"></p>
    </section>
  );
}
