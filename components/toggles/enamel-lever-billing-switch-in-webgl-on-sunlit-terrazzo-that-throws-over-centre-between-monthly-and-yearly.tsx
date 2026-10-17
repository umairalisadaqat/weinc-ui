import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Example plan. These prices are placeholders for the demo: put your own in.
const plan = {
  name: "Studio plan",
  monthly: { price: "$18", per: "per month", note: "Billed each month. Stop whenever you like." },
  yearly: { price: "$180", per: "per year", note: "Billed once a year. Twelve months for the price of ten." },
};
const LABELS = ["MONTHLY", "YEARLY"] as const;
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Fraunces", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
const FLOOR = "#ece6dc"; // terrazzo binder as a screen colour, for the frame and the still picture
const STOP = 0.42; // lever travel either side of upright, in radians

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
const FRAG = `precision highp float;
uniform vec2 R;uniform float A;uniform float S;uniform vec2 J;uniform vec2 LJ;uniform float W;uniform vec2 C;uniform vec2 O;uniform float F;uniform sampler2D T;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float box(vec3 p,vec3 b,float r){vec3 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
vec2 map(vec3 p){
  vec2 r=vec2(p.y,0.);
  vec3 q=p;q.y+=S;
  float base=box(q-vec3(0.,.2,0.),vec3(1.5,.2,.62),.17);
  float slot=box(q-vec3(0.,.42,-.12),vec3(.66,.2,.13),.1);
  base=max(base,-slot);
  if(base<r.x)r=vec2(base,1.);
  vec3 s=q;s.x=abs(s.x);
  float scr=length(s-vec3(1.25,.33,-.12))-.09;
  if(scr<r.x)r=vec2(scr,3.);
  vec3 l=q-vec3(0.,.26,-.12);
  float bar=max(length(l.xy)-.15,abs(l.z)-.17);
  if(bar<r.x)r=vec2(bar,3.);
  l.xy=rot(-A)*l.xy;
  float stem=box(l-vec3(0.,.5,0.),vec3(.092,.42,.092),.07);
  float hd=box(l-vec3(0.,1.02,0.),vec3(.25,.19,.31),.17);
  float lev=smin(stem,hd,.12);
  if(lev<r.x)r=vec2(lev,2.);
  return r;
}
vec3 nrm(vec3 p){vec2 e=vec2(.0012,-.0012);return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x);}
vec2 march(vec3 ro,vec3 rd,float tmax,int n){float t=.02;for(int i=0;i<110;i++){if(i>=n)break;vec2 h=map(ro+rd*t);if(h.x<.0006*t)return vec2(t,h.y);t+=h.x;if(t>tmax)break;}return vec2(-1.);}
float shadow(vec3 ro,vec3 rd){float res=1.,t=.015;for(int i=0;i<40;i++){float h=map(ro+rd*t).x;res=min(res,16.*h/t);t+=clamp(h,.012,.2);if(res<.002||t>5.)break;}return clamp(res,0.,1.);}
float ao(vec3 p,vec3 n){float o=0.,s=1.;for(int i=1;i<6;i++){float h=.03*float(i)*float(i)*.5+.01;o+=(h-map(p+n*h).x)*s;s*=.72;}return clamp(1.-1.6*o,0.,1.);}
vec3 h3(vec2 p){vec3 q=vec3(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)),dot(p,vec2(419.2,371.9)));return fract(sin(q)*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h3(i).x,h3(i+vec2(1,0)).x,f.x),mix(h3(i+vec2(0,1)).x,h3(i+vec2(1,1)).x,f.x),f.y);}
vec3 pal(float k){
  if(k<.16)return vec3(.62,.29,.19);
  if(k<.27)return vec3(.55,.6,.5);
  if(k<.36)return vec3(.33,.34,.36);
  if(k<.46)return vec3(.82,.63,.36);
  if(k<.56)return vec3(.84,.64,.58);
  if(k<.7)return vec3(.78,.76,.72);
  return vec3(.99,.975,.95);
}
vec3 chips(vec2 x,float sc,float sz,inout float m){
  vec2 n=floor(x*sc),f=fract(x*sc);float md=9.;vec3 id=vec3(0.);
  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 g=vec2(i,j);vec3 o=h3(n+g);vec2 r=g+.15+o.xy*.7-f;r=rot(o.z*6.283)*r;
    float d=max(abs(r.x)*1.15+abs(r.y)*.35,abs(r.y)*.95+abs(r.x)*.25)/(sz*(.55+.7*o.y));if(d<md){md=d;id=o;}}
  float e=.5+.18*(vn(x*sc*5.)-.5);
  m=1.-smoothstep(e-.04,e+.04,md);
  return pal(fract(id.z*7.13));
}
vec3 terr(vec2 p,out float ch){
  vec3 col=vec3(.96,.925,.87)*(.97+.06*vn(p*14.));
  float m;vec3 c=chips(p,2.6,.36,m);col=mix(col,c,m);ch=m;
  c=chips(p+17.3,6.,.32,m);col=mix(col,c,m*.95);ch=max(ch,m);
  c=chips(p-9.1,15.,.3,m);col=mix(col,c*.95,m*.9);
  return col;
}
vec3 LD=normalize(vec3(-.62,.7,-.36));
vec3 env(vec3 d){
  vec3 sky=mix(vec3(1.,.97,.92),vec3(.62,.75,.95),clamp(d.y*1.4,0.,1.));
  vec3 c=sky*1.15;
  vec3 w=d-LD*dot(d,LD);float a=dot(d,LD);
  vec2 wq=vec2(dot(w,normalize(vec3(.5,0.,-.86))),w.y);
  float win=step(.8,a)*(1.-smoothstep(.22,.26,abs(wq.x)))*(1.-smoothstep(.3,.34,abs(wq.y+.02)));
  win*=1.-(1.-smoothstep(.006,.014,abs(wq.x)))*.9;
  c+=win*vec3(6.,5.6,5.)*1.4;
  c=mix(c,vec3(.32,.30,.28),smoothstep(.1,.7,d.x)*smoothstep(.0,.4,d.y)*.55);
  if(d.y<0.)c=mix(vec3(.8,.76,.7),vec3(.55,.5,.45),clamp(-d.y*2.,0.,1.));
  return c;
}
float gobo(vec3 p){
  vec3 w=p-LD*(p.y/LD.y);
  vec2 g=rot(.18)*w.xz;
  float pen=.05+.05*p.y;
  float open=smoothstep(-pen,pen,g.x+2.15)*smoothstep(-pen,pen,3.8-g.x)*smoothstep(-pen,pen,g.y+2.9)*smoothstep(-pen,pen,2.6-g.y);
  float bar=smoothstep(.07-pen,.07+pen,abs(g.x-2.05))*smoothstep(.06-pen,.06+pen,abs(g.y-.9));
  float leaf=smoothstep(.45,.7,vn(g*1.3+3.)*.6+vn(g*3.7)*.4);
  return open*bar*mix(1.,.45,leaf*smoothstep(.5,2.5,g.x));
}
vec3 shade(vec3 p,vec3 rd,float m,vec3 n,bool deep){
  float sh=shadow(p+n*.004,LD)*gobo(p);
  float oc=ao(p,n);
  float dif=clamp(dot(n,LD),0.,1.);
  vec3 sun=vec3(1.,.9,.74)*3.5;
  vec3 amb=mix(vec3(.78,.68,.58),vec3(.86,.84,.82),n.y*.5+.5)*.72;
  vec3 hlf=normalize(LD-rd);
  float fr=pow(1.-clamp(dot(n,-rd),0.,1.),5.);
  float ink=0.;vec3 alb;float gloss;float f0;vec3 refl=env(reflect(rd,n));
  if(m<.5){
    float ch;alb=terr(p.xz*1.25,ch);
    gloss=.35+.4*ch;f0=.03;
    vec3 col=alb*(amb*oc+sun*dif*sh);
    col+=refl*(f0+.6*fr)*gloss*oc*.6;
    col+=sun*pow(clamp(dot(n,hlf),0.,1.),220.)*sh*gloss*1.2;
    return col;
  }
  if(m<1.5){
    alb=vec3(.84,.78,.66);
    vec3 sp=p;sp.y+=S;
    if(sp.y>.365&&n.y>.85){vec2 uv=vec2((sp.x+1.5)/3.,(sp.z+.62)/1.24);vec4 tx=texture2D(T,uv);ink=tx.a;alb*=mix(.74,1.06,smoothstep(-.6,.6,sp.z))*mix(.94,1.,smoothstep(-1.5,1.5,-sp.x));}
    if(sp.y<.33&&abs(sp.x)<.8&&abs(sp.z+.12)<.3)alb*=.3;
  } else if(m<2.5){alb=vec3(.62,.06,.028);}
  else {
    vec3 br=vec3(.98,.76,.42);
    vec3 col=br*refl*(.55+.45*fr)*oc+br*sun*pow(clamp(dot(n,hlf),0.,1.),60.)*sh*.9+br*amb*.12*oc;
    return col;
  }
  float wr=clamp((dot(n,LD)+.22)/1.22,0.,1.);
  vec3 sss=m>1.5?vec3(.9,.25,.12):vec3(.95,.85,.7);
  vec3 col=alb*(amb*oc+sun*wr*sh*.92)+sss*alb*.08*(1.-dif)*oc;
  float F0=.045,fre=F0+(1.-F0)*fr;
  vec3 rc=refl;float hk=0.;
  if(deep){vec3 rr=reflect(rd,n);vec2 h=march(p+n*.01,rr,4.,48);if(h.x>0.){vec3 q=p+n*.01+rr*h.x;vec3 qn=nrm(q);
      vec3 qa=h.y<.5?vec3(.9,.87,.82):h.y<1.5?vec3(.94,.9,.83):h.y<2.5?vec3(.8,.2,.12):vec3(.9,.7,.4);
      rc=qa*(amb+sun*clamp(dot(qn,LD),0.,1.)*.8);hk=1.;}}
  float rk=m<1.5?fre*1.05+.07*step(.85,n.y):fre*1.05;
  col+=rc*rk*oc;
  col+=sun*pow(clamp(dot(n,hlf),0.,1.),900.)*sh*7.;
  col=mix(col,rc*.85,hk*.5*step(.85,n.y)*(m<1.5?1.:0.));
  if(m<1.5){col+=sun*pow(clamp(dot(n,hlf),0.,1.),40.)*sh*.12;
    col+=vec3(1.,.96,.88)*smoothstep(.25,.85,n.z)*smoothstep(.15,.6,n.y)*3.2*(.45+.55*sh)*pow(clamp(1.-abs(n.x),0.,1.),2.);
    if(n.y>.85){vec3 sp2=p;sp2.y+=S;col*=mix(.62,1.,smoothstep(-.62,.5,sp2.z))*mix(.86,1.,smoothstep(1.6,-1.2,sp2.x));}
    col=mix(col,vec3(.03,.055,.17)*(amb*oc*.8+sun*wr*sh*.22)+rc*fre*.5,ink);}
  return col;
}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){
  vec2 fc=gl_FragCoord.xy+J;
  vec2 uv=(fc-.5*R)/R.y-O;
  vec3 ro=vec3(C.x*.9,3.25+C.y*.35,5.1);vec3 ta=vec3(0.,.45,0.);
  vec3 fw=normalize(ta-ro),rt=normalize(cross(fw,vec3(0,1,0))),up=cross(rt,fw);
  vec3 rd=normalize(uv.x*rt+uv.y*up+F*fw);
  float fd=length(ta-ro);vec3 fp=ro+rd*fd/dot(rd,fw);
  ro+=(rt*LJ.x+up*LJ.y);rd=normalize(fp-ro);
  vec3 col;
  float tg=-ro.y/rd.y;
  vec2 h=march(ro,rd,min(tg>0.?tg+.01:30.,30.),110);
  if(h.x<0.&&tg>0.){vec3 p=ro+rd*tg;col=shade(p,rd,0.,vec3(0,1,0),false);float fog=1.-exp(-max(tg-6.,0.)*.08);col=mix(col,vec3(.93,.9,.85)*1.3,fog);}
  else if(h.x>0.){vec3 p=ro+rd*h.x;vec3 n=h.y<.5?vec3(0,1,0):nrm(p);col=shade(p,rd,h.y,n,h.y>.5&&h.y<2.5);}
  else col=env(rd);
  col=aces(col*.74);
  col=pow(col,vec3(1./2.2));
  vec2 v=gl_FragCoord.xy/R-.5;col*=1.-.18*dot(v,v);
  col+=(h3(gl_FragCoord.xy+W*13.).x-.5)*.018;
  gl_FragColor=vec4(col,1./max(W,1.));
}`;

type Cam = { cx: number; cy: number; ox: number; oy: number; f: number };
// Same camera as the shader, so the real switch button sits exactly on the drawn one.
function project(w: number, h: number, cam: Cam, p: [number, number, number]) {
  const ro = [cam.cx * 0.9, 3.25 + cam.cy * 0.35, 5.1];
  const ta = [0, 0.45, 0];
  const fw = norm([ta[0] - ro[0], ta[1] - ro[1], ta[2] - ro[2]]);
  const rt = norm([-fw[2], 0, fw[0]]);
  const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
  const d = [p[0] - ro[0], p[1] - ro[1], p[2] - ro[2]];
  const z = dot(d, fw);
  const ux = (dot(d, rt) / z) * cam.f + cam.ox;
  const uy = (dot(d, up) / z) * cam.f + cam.oy;
  return [w / 2 + ux * h, h / 2 - uy * h];
}
function dot(a: number[], b: number[]) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function norm(a: number[]) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
function camFor(w: number, h: number): Cam {
  const wide = w >= 768;
  const asp = w / Math.max(1, h);
  return { cx: 0, cy: 0, ox: wide ? 0.33 : 0, oy: wide ? -0.05 : -0.06, f: wide ? 2.0 : 2.0 * Math.min(1, asp / 1.38) };
}

// The printing on the enamel plate, drawn once per change into a small texture.
function paintPlate(cv: HTMLCanvasElement, sel: number) {
  const g = cv.getContext("2d");
  if (!g) return;
  const W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H);
  g.textAlign = "center";
  g.textBaseline = "middle";
  const y = H * 0.75;
  LABELS.forEach((t, i) => {
    const x = W * (i === 0 ? 0.3 : 0.7);
    g.globalAlpha = i === sel ? 1 : 0.6;
    g.font = `800 58px ${FONT}`;
    if ("letterSpacing" in g) (g as unknown as { letterSpacing: string }).letterSpacing = "7px";
    g.fillStyle = "#fff";
    g.fillText(t, x, y);
  });
  g.globalAlpha = 0.7;
  g.fillStyle = "#fff";
  for (let k = -6; k <= 6; k++) {
    const x = W / 2 + k * 24;
    g.fillRect(x - 2, H * 0.53, 4, k % 3 === 0 ? 26 : 14);
  }
  g.globalAlpha = 1;
}

function Still({ box, yearly }: { box: { l: number; t: number; w: number; h: number }; yearly: boolean }) {
  const dots = Array.from({ length: 140 }, (_, i) => {
    const r = Math.sin(i * 91.7) * 43758.5453, s = Math.sin(i * 12.3) * 9631.7, u = Math.sin(i * 47.1) * 3711.3;
    const fr = (v: number) => v - Math.floor(v);
    return { x: fr(r) * 100, y: fr(s) * 100, z: 4 + fr(u) * 14, c: ["#a84d33", "#80947a", "#4d545e", "#d6a04c", "#d99a8a", "#f7f3ec"][i % 6], a: fr(r + s) * 180 };
  });
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: FLOOR }}>
      {dots.map((d, i) => (
        <span key={i} className="absolute" style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.z, height: d.z * 0.7, background: d.c, borderRadius: "38% 52% 30% 60%", transform: `rotate(${d.a}deg)`, opacity: 0.9 }} />
      ))}
      <div className="absolute" style={{ left: box.l + box.w * 0.06, top: box.t + box.h * 0.5, width: box.w * 0.96, height: box.h * 0.46, borderRadius: 40, background: "rgba(70,52,36,0.35)", filter: "blur(18px)" }} />
      <div className="absolute" style={{ left: box.l, top: box.t + box.h * 0.38, width: box.w, height: box.h * 0.5, borderRadius: 34, background: "linear-gradient(180deg,#fbf6ec 0%,#efe7d6 55%,#d9cdb6 100%)", boxShadow: "inset 0 2px 0 #fff, inset 0 -10px 18px rgba(120,96,60,0.25)" }}>
        <div className="absolute left-1/2 top-[26%] h-[20%] w-[44%] -translate-x-1/2 rounded-full" style={{ background: "#2a2018", boxShadow: "inset 0 6px 10px #000" }} />
        <div className="absolute inset-x-0 bottom-[16%] flex justify-around text-[13px] font-extrabold tracking-[0.3em] text-[#17213f]" style={{ fontFamily: FONT }}>
          <span style={{ opacity: yearly ? 0.6 : 1 }}>MONTHLY</span><span style={{ opacity: yearly ? 1 : 0.6 }}>YEARLY</span>
        </div>
      </div>
      <div className="absolute" style={{ left: box.l + box.w / 2 - box.w * 0.09, top: box.t + box.h * 0.066, width: box.w * 0.18, height: box.h * 0.52, transformOrigin: "50% 95%", transform: `rotate(${yearly ? 22 : -22}deg)` }}>
        <div className="mx-auto h-[62%] w-[34%] rounded-full" style={{ marginTop: "38%", background: "linear-gradient(90deg,#8f1f12,#d2462c 45%,#9a2615)" }} />
        <div className="absolute inset-x-0 top-0 h-[44%] rounded-[40%]" style={{ background: "radial-gradient(circle at 35% 30%,#ff9a7a 0%,#d4412a 32%,#8e1c10 100%)", boxShadow: "0 10px 18px rgba(80,20,10,0.35)" }} />
      </div>
    </div>
  );
}

export default function EnamelLeverBillingSwitch() {
  const reduceMotion = useReducedMotion();
  const [yearly, setYearly] = useState(true);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [box, setBox] = useState({ l: 0, t: 0, w: 0, h: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ set: (y: boolean, user: boolean) => void; drag: (dx: number | null) => boolean; touch: () => void } | null>(null);
  const yearlyRef = useRef(true);
  const dragRef = useRef<{ x: number; moved: boolean } | null>(null);

  const choose = (y: boolean, user = true) => {
    yearlyRef.current = y;
    setYearly(y);
    api.current?.set(y, user);
  };

  useEffect(() => {
    const st = stage.current, cv = canvas.current;
    if (!st || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = {
      a: STOP, v: 0, side: 1, load: 0, shake: 0, sv: 0, touched: false, dragging: false,
      raf: 0, last: 0, t0: 0, demoAt: 0, alive: true, visible: true, count: 0, fresh: true,
      px: 0, py: 0, sx: 0, sy: 0, fpsN: 0, fpsT: 0, slow: 0,
    };
    let cam = camFor(st.clientWidth, st.clientHeight);
    const layout = () => {
      const w = st.clientWidth, h = st.clientHeight;
      cam = camFor(w, h);
      const pts: [number, number, number][] = [[-1.6, 0, -0.7], [1.6, 0, -0.7], [-1.6, 0, 0.7], [1.6, 0, 0.7], [0, 1.45, -0.1]];
      const xy = pts.map((p) => project(w, h, cam, p));
      const xs = xy.map((p) => p[0]), ys = xy.map((p) => p[1]);
      const l = Math.min(...xs), t = Math.min(...ys);
      setBox({ l, t, w: Math.max(...xs) - l, h: Math.max(...ys) - t });
    };
    layout();

    const opts = { antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" as const };
    const gl = (cv.getContext("webgl", opts) ?? cv.getContext("experimental-webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) { setShown("still"); const ro0 = new ResizeObserver(layout); ro0.observe(st); return () => ro0.disconnect(); }
    const sh = (type: number, src: string) => { const o = gl.createShader(type)!; gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    const pr = gl.createProgram()!;
    if (!vs || !fs) { setShown("still"); return; }
    gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { setShown("still"); return; }
    gl.useProgram(pr);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "a");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(pr, n);
    const u = { R: U("R"), A: U("A"), S: U("S"), J: U("J"), LJ: U("LJ"), W: U("W"), C: U("C"), O: U("O"), F: U("F"), T: U("T") };

    const tc = document.createElement("canvas");
    tc.width = 1024; tc.height = 424;
    const tex = gl.createTexture();
    const upload = (sel: number) => {
      paintPlate(tc, sel);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tc);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    upload(1);
    gl.uniform1i(u.T, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let scale = 1;
    const size = () => {
      const w = st.clientWidth, h = st.clientHeight;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.2e6 / (w * h * dpr * dpr)));
      cv.width = Math.max(2, Math.round(w * dpr * k)); cv.height = Math.max(2, Math.round(h * dpr * k));
      gl.viewport(0, 0, cv.width, cv.height);
      s.fresh = true;
    };

    const draw = (n: number) => {
      const ang = n * 2.39996, rad = Math.sqrt(n % 24) / 4.9;
      gl.uniform2f(u.R, cv.width, cv.height);
      gl.uniform1f(u.A, s.a);
      gl.uniform1f(u.S, s.shake);
      gl.uniform2f(u.J, n > 1 ? Math.cos(ang * 3.1) * 0.5 : 0, n > 1 ? Math.sin(ang * 2.3) * 0.5 : 0);
      gl.uniform2f(u.LJ, n > 1 ? Math.cos(ang) * rad * 0.05 : 0, n > 1 ? Math.sin(ang) * rad * 0.05 : 0);
      gl.uniform1f(u.W, n);
      gl.uniform2f(u.C, s.sx, s.sy);
      gl.uniform2f(u.O, cam.ox, cam.oy);
      gl.uniform1f(u.F, cam.f);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // Over-centre snap: a slow creep while the spring loads, then it lets go and slams into the stop.
    const step = (dt: number) => {
      if (s.dragging) return true;
      let moving = false;
      const T = s.side, target = T * STOP;
      if (s.load > 0) {
        s.load -= dt;
        s.v += (-T * 2.2 - s.v) * Math.min(1, dt * 18);
        moving = true;
      } else if (Math.abs(s.a - target) > 1e-4 || Math.abs(s.v) > 1e-3) {
        s.v += T * 46 * dt;
        s.v *= Math.exp(-dt * 1.6);
        moving = true;
      }
      s.a += s.v * dt;
      if ((s.a - target) * T > 0) {
        const hit = Math.abs(s.v);
        s.a = target;
        s.v = -s.v * 0.3;
        if (hit > 0.8) s.sv += Math.min(hit, 9) * 0.012;
        if (Math.abs(s.v) < 0.35) s.v = 0;
      }
      s.sv += (-s.shake * 900 - s.sv * 26) * dt;
      s.shake += s.sv * dt;
      if (Math.abs(s.shake) > 1e-5 || Math.abs(s.sv) > 1e-4) moving = true; else { s.shake = 0; s.sv = 0; }
      return moving;
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.alive || !s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 1 / 60;
      const dt = Math.min(dtRaw, 1 / 30);
      s.last = now;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 3400; }
      if (!reduce && !s.touched && now > s.demoAt) {
        const y = !yearlyRef.current;
        yearlyRef.current = y; setYearly(y); set(y, false);
        s.demoAt = now + (y ? 3600 : 2600);
      }
      let moving = reduce ? false : step(dt);
      if (!reduce) {
        const k = 1 - Math.exp(-dt * 3);
        const dx = s.px - s.sx, dy = s.py - s.sy;
        s.sx += dx * k; s.sy += dy * k;
        if (Math.abs(dx) + Math.abs(dy) > 0.002) moving = true;
      }
      if (s.fresh) { draw(1); s.fresh = false; s.count = 1; }
      else if (moving) { draw(1); s.count = 1; }
      else if (s.count < 24) { s.count++; draw(s.count); }
      if (shownRef !== "gl") { shownRef = "gl"; setShown("gl"); }
      if (moving && dtRaw > 0.028) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 30 && scale > 0.45) { scale *= 0.8; s.slow = 0; size(); }
      if (moving) { s.fpsN++; s.fpsT += dtRaw; }
      st.dataset.fps = s.fpsT > 0 ? (s.fpsN / s.fpsT).toFixed(1) : "";
      if (moving || s.count < 24 || (!reduce && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    let shownRef = "wait";
    const wake = () => { if (!s.raf && s.visible && s.alive) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    const set = (y: boolean, user: boolean) => {
      if (user) s.touched = true;
      upload(y ? 1 : 0);
      const T = y ? 1 : -1;
      if (reduce) { s.side = T; s.a = T * STOP; s.v = 0; s.fresh = true; wake(); return; }
      if (s.side !== T) { s.side = T; s.load = s.dragging ? 0 : 0.11; s.v = 0; }
      s.dragging = false;
      s.fresh = true;
      wake();
    };
    const touch = () => { s.touched = true; };
    const drag = (dx: number | null) => {
      if (reduce) return false;
      s.touched = true;
      if (dx === null) return false;
      s.dragging = true;
      const base = s.side * STOP;
      s.a = Math.max(-STOP, Math.min(STOP, base + dx / 140));
      s.v = 0; s.fresh = true; wake();
      return Math.sign(s.a) !== s.side && Math.abs(s.a) > 0.04;
    };
    api.current = { set, drag, touch };

    size();
    const ro = new ResizeObserver(() => { size(); layout(); wake(); });
    ro.observe(st);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(st);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    const move = (e: PointerEvent) => {
      if (reduce || e.pointerType !== "mouse") return;
      const r = st.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      wake();
    };
    const leave = () => { s.px = 0; s.py = 0; wake(); };
    st.addEventListener("pointermove", move);
    st.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();
    return () => {
      s.alive = false;
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      st.removeEventListener("pointermove", move); st.removeEventListener("pointerleave", leave);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); if (!yearlyRef.current) choose(true); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); if (yearlyRef.current) choose(false); }
  };
  const down = (e: RPointerEvent<HTMLButtonElement>) => {
    dragRef.current = { x: e.clientX, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveP = (e: RPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 6) d.moved = true;
    if (d.moved) api.current?.drag(dx);
  };
  const up = (e: RPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || !d.moved) return;
    e.preventDefault();
    const dx = e.clientX - d.x;
    const flip = (yearlyRef.current && dx < -24) || (!yearlyRef.current && dx > 24);
    choose(flip ? !yearlyRef.current : yearlyRef.current);
  };
  const click = () => {
    if (dragRef.current?.moved) return;
    choose(!yearlyRef.current);
  };
  const p = yearly ? plan.yearly : plan.monthly;

  return (
    <section className="relative isolate overflow-hidden text-[#17213f]" style={{ fontFamily: FONT, background: FLOOR }}>
      <div ref={stage} className="relative h-[380px] w-full md:h-[640px]">
        {shown !== "gl" && <Still box={box} yearly={yearly} />}
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-500 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        <p className="pointer-events-none absolute left-5 top-5 text-[11px] font-bold uppercase tracking-[0.32em] text-[#17213f] md:left-12 md:top-10">Billing</p>
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label="Bill yearly"
          onKeyDown={onKey}
          onFocus={() => api.current?.touch()}
          onClick={click}
          onPointerDown={down}
          onPointerMove={moveP}
          onPointerUp={up}
          onPointerCancel={() => { dragRef.current = null; choose(yearlyRef.current); }}
          className="absolute cursor-grab touch-none rounded-[28px] outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[#17213f] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
          style={{ left: box.l, top: box.t, width: box.w, height: box.h }}
        />
      </div>
      <div className="relative px-5 pb-10 pt-1 md:pointer-events-none md:absolute md:bottom-0 md:left-0 md:top-0 md:flex md:w-[44%] md:flex-col md:justify-center md:px-12 md:pb-0">
        <h2 className="max-w-[12ch] text-[34px] leading-[0.98] tracking-[-0.03em] text-[#17213f] md:text-[54px]" style={{ fontFamily: SERIF }}>Pay by the month, or once a year.</h2>
        <div className="mt-6 flex items-end gap-3 md:mt-10" aria-live="polite">
          <div className="relative h-[64px] overflow-hidden md:h-[104px]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={p.price}
                initial={reduceMotion ? false : { y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { y: "-100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className="block text-[60px] font-semibold leading-none tracking-[-0.05em] tabular-nums md:text-[100px]"
              >
                {p.price}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="pb-2 md:pb-4">
            <p className="text-[14px] font-semibold text-[#17213f] md:text-[15px]">{plan.name}, {p.per}</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#5a4a3a]">Example prices</p>
          </div>
        </div>
        <p className="mt-3 max-w-[30ch] text-[15px] leading-[1.55] text-[#3b3328]">{p.note}</p>
        <p className="mt-6 hidden text-[11px] font-bold uppercase tracking-[0.26em] text-[#5a4a3a] md:block">Throw the lever, or press left and right</p>
      </div>
    </section>
  );
}
