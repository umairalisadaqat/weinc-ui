import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The product. Change the words here. */
const PRODUCT = {
  maker: "Halde Ceramics",
  name: "Ondine",
  kind: "fluted vase",
  price: "$148",
  blurb: "Thrown by hand in grogged stoneware, then cut with twenty four flutes. The glaze runs thin on every ridge and pools deep in every groove, so the colour shifts as light moves round it.",
  facts: ["34 cm tall", "Stoneware", "Raw clay foot"],
};

/** Colourways: glaze, paper plinth, backdrop paper and the page tint around the stage. */
const COLOURWAYS = [
  { name: "Lagoon", glaze: "#1f7f80", plinth: "#e95a42", backdrop: "#fbd67a", page: "#fdeec4" },
  { name: "Cobalt", glaze: "#0f3a8f", plinth: "#f2782a", backdrop: "#f8c0c2", page: "#fde3e3" },
  { name: "Marigold", glaze: "#e08a12", plinth: "#3f63d2", backdrop: "#b2e3cf", page: "#dff3ea" },
  { name: "Rose clay", glaze: "#c95c68", plinth: "#76a87d", backdrop: "#d4cbf4", page: "#ece8fb" },
];

const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
/** Seconds the glaze takes to wipe from one colourway to the next. */
const WIPE_SECONDS = 1.25;
/** Self-playing demo: first change after this many seconds, then one every DEMO_EVERY. Stops on any input. */
const DEMO_FIRST = 4.2;
const DEMO_EVERY = 5.2;
/** Idle turning speed (radians a second) and how quickly a flick slows down. */
const IDLE_SPIN = 0.32;
const FRICTION = 2.6;
/** Render scale limits (canvas pixels per CSS pixel) and the pixel budget per frame. */
const MAX_SCALE = 1.5;
const MIN_SCALE = 0.75;
const PIXEL_BUDGET = 1_100_000;

const toLinear = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.pow(v / 255, 2.2)) as [number, number, number];
};

const VS = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FS = `precision highp float;
uniform vec2 uRes;uniform float uRot,uWipe,uBob,uSeed;
uniform vec3 uGA,uGB,uPA,uPB,uBA,uBB;
#define BASE 0.46
#define VH 1.42
#define PR 0.74
vec3 L;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float prof(float t){return 0.17+0.3*exp(-pow((t-0.37)/0.26,2.))+0.085*pow(smoothstep(0.8,1.,t),2.);}
vec3 vloc(vec3 p){float c=cos(uRot),s=sin(uRot);return vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);}
float fl(vec3 q,float t){float m=smoothstep(0.07,0.17,t)*(1.-smoothstep(0.7,0.8,t));
 return m*cos(24.*atan(q.z,q.x));}
float vase(vec3 p){vec3 q=vloc(p);float h=q.y-BASE;float t=clamp(h/VH,0.,1.);
 float r=prof(t)+0.0085*fl(q,t);float rho=length(q.xz);
 float shell=abs(rho-r+0.012)-0.012;
 float lip=smoothstep(0.985,1.,t)*0.006;
 float d=max(shell+lip,max(-h,h-VH));
 d=min(d,max(rho-r,abs(h-0.05)-0.05));
 return d*0.62;}
float rcyl(vec3 p,float r,float y0,float y1,float rb){vec2 d=vec2(length(p.xz)-r+rb,abs(p.y-(y0+y1)*0.5)-(y1-y0)*0.5+rb);
 return min(max(d.x,d.y),0.)+length(max(d,0.))-rb;}
float plinth(vec3 p){return min(rcyl(p,PR-0.012,0.,BASE-0.05,0.02),rcyl(p,PR,BASE-0.115,BASE,0.012));}
float map(vec3 p){return min(vase(p),plinth(p));}
vec2 box(vec3 ro,vec3 rd){vec3 lo=vec3(-PR-0.02,-0.01,-PR-0.02),hi=vec3(PR+0.02,BASE+VH+0.02,PR+0.02);
 vec3 inv=1./rd;vec3 a=(lo-ro)*inv,b=(hi-ro)*inv;vec3 mn=min(a,b),mx=max(a,b);
 return vec2(max(max(mn.x,mn.y),mn.z),min(min(mx.x,mx.y),mx.z));}
vec3 nrm(vec3 p){vec2 e=vec2(0.0012,-0.0012);
 return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx));}
float shadow(vec3 ro,vec3 rd){vec2 b=box(ro,rd);if(b.x>b.y||b.y<0.)return 1.;
 float res=1.,t=max(b.x,0.015);
 for(int i=0;i<44;i++){float h=map(ro+rd*t);res=min(res,7.*h/t);t+=clamp(h,0.012,0.2);if(res<0.003||t>b.y)break;}
 return clamp(res,0.,1.);}
float occl(vec3 p,vec3 n){float o=0.,s=1.;
 for(int i=1;i<=5;i++){float h=0.015+0.05*float(i*i)*0.5;o+=(h-map(p+n*h))*s;s*=0.72;}
 return clamp(1.-1.4*o,0.,1.);}
float wipeK(vec3 p){float e=-0.25+uWipe*2.75+0.035*sin(atan(p.z,p.x)*3.+p.y*5.);return smoothstep(e+0.06,e-0.06,p.y);}
vec3 SUN=vec3(1.,0.95,0.86)*2.25;
float win(vec3 p){vec3 tx=normalize(cross(vec3(0,1,0),L)),ty=cross(L,tx);float u=dot(p,tx),v=dot(p,ty);
 float fr=smoothstep(3.6,2.6,abs(u-0.3))*smoothstep(3.4,2.4,abs(v));return mix(0.45,1.,fr);}
vec3 SKY=vec3(0.78,0.82,0.92)*0.78;
vec3 env(vec3 d,vec3 bg){
 vec3 col=mix(vec3(0.85,0.82,0.78),vec3(0.6,0.72,0.95),clamp(d.y*1.5,0.,1.))*0.8;
 vec3 tx=normalize(cross(vec3(0,1,0),L)),ty=cross(L,tx);float a=dot(d,L);
 if(a>0.){vec2 u=vec2(dot(d,tx),dot(d,ty))/a;
  float w=smoothstep(0.56,0.5,abs(u.x))*smoothstep(0.8,0.74,abs(u.y));
  w*=1.-0.9*smoothstep(0.022,0.01,abs(u.x))-0.9*smoothstep(0.022,0.01,abs(u.y-0.12));
  col+=w*vec3(1.,0.97,0.9)*7.;}
 vec3 f=normalize(vec3(0.95,0.18,0.3));col+=smoothstep(0.9,0.95,dot(d,f))*vec3(1.)*1.6;
 col=mix(col,bg*(SUN*L.y+SKY)*0.75,smoothstep(0.06,-0.3,d.y));
 return col;}
vec3 tone(vec3 x){x*=1.0;return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.,1.);}
void main(){
 L=normalize(vec3(-0.62,0.74,0.5));
 vec2 uv=(gl_FragCoord.xy-0.5*uRes)/min(uRes.y,uRes.x*1.18);
 vec3 ro=vec3(0.,1.5+uBob,5.1),ta=vec3(0.,0.97,0.);
 vec3 fw=normalize(ta-ro),rt=normalize(cross(fw,vec3(0,1,0))),up=cross(rt,fw);
 vec3 rd=normalize(fw*1.88+rt*uv.x+up*uv.y);
 float kw=smoothstep(0.3,0.95,uWipe);
 vec3 bgW=mix(uBA,uBB,kw);
 float flIl=SUN.x*L.y*0.92+SKY.x;
 vec3 col=bgW*vec3(flIl)*mix(1.,0.8,clamp(uv.y+0.2,0.,1.));
 float tHit=-1.;vec2 b=box(ro,rd);
 if(b.x<b.y&&b.y>0.){float t=max(b.x,0.);
  for(int i=0;i<120;i++){float h=map(ro+rd*t);if(h<0.0007){tHit=t;break;}t+=h;if(t>b.y)break;}}
 float tf=rd.y<0.?-ro.y/rd.y:1e9;
 if(tHit>0.){vec3 p=ro+rd*tHit;vec3 n=nrm(p);float sh=shadow(p+n*0.003,L);float ao=occl(p,n);
  float k=wipeK(p);float dif=max(dot(n,L),0.);
  vec3 bgC=mix(uBA,uBB,k);
  vec3 amb=SKY*(0.55+0.45*n.y)*ao+bgC*0.55*(0.5-0.5*n.y)*ao;
  if(vase(p)<plinth(p)){
   vec3 q=vloc(p);float h=q.y-BASE;float t=clamp(h/VH,0.,1.);float a=atan(q.z,q.x);float f=fl(q,t);
   float line=0.085+0.012*sin(a*5.)+0.007*sin(a*13.+1.)-0.05*pow(max(sin(a*7.+1.3),0.),24.);
   float gz=smoothstep(line-0.005,line+0.005,h);
   bool inside=length(q.xz)<prof(t)-0.012;
   vec3 g=mix(uGA,uGB,k)*0.8;
   float thick=0.5+0.5*f;
   vec3 ga=mix(g*mix(0.42,1.,thick),vec3(1.),0.1*thick)*mix(0.72,1.,smoothstep(line,line+0.09,h));
   ga=mix(ga,mix(g,vec3(1.),0.25),smoothstep(0.96,1.,t)*0.6);
   vec3 clay=vec3(0.74,0.6,0.47)*(0.9+0.2*vnoise(q.xz*60.+q.y*40.))*(1.-0.35*step(0.93,hash(floor(vec2(a*60.,h*200.)))));
   vec3 alb=mix(clay,ga,gz);
   vec3 c=alb*(SUN*dif*sh+amb);
   c+=alb*g*0.25*SKY*pow(clamp(1.-abs(dot(n,rd)),0.,1.),2.)*gz;
   float edge=exp(-pow((p.y-(-0.25+uWipe*2.75))/0.04,2.))*step(0.001,uWipe)*step(uWipe,0.999);
   c*=1.+0.12*edge;
   if(gz>0.01){float F=0.035+0.965*pow(1.-max(dot(n,-rd),0.),5.);
    vec3 r=reflect(rd,n);vec3 e=env(r,bgC)*mix(0.35,1.,sh*0.5+0.5)*ao;
    if(inside)e*=0.35;
    c=mix(c,e,F*gz);vec3 hv=normalize(L-rd);c+=SUN*pow(max(dot(n,hv),0.),220.)*sh*1.4*gz;}
   col=c;
  }else{
   vec3 pa=mix(uPA,uPB,k);float ang=atan(p.z,p.x);
   float fib=0.96+0.04*vnoise(vec2(ang*260.,p.y*60.))+0.03*vnoise(p.xz*90.)-0.05*smoothstep(0.01,0.,abs(p.y-BASE+0.05))*step(n.y,0.5);
   float seam=1.-0.12*smoothstep(0.012,0.,abs(ang-2.2))*step(p.y,BASE-0.02);
   vec3 alb=pa*fib*seam*(n.y>0.6?1.04:1.);
   col=alb*(SUN*dif*sh+amb);
   col+=alb*0.12*SUN*pow(max(dot(n,normalize(L-rd)),0.),12.)*sh;
  }
 }else if(tf<1e8){vec3 p=ro+rd*tf;float k=smoothstep(-1.+uWipe*11.+0.6,-1.+uWipe*11.-0.6,length(p.xz));
  vec3 alb=mix(uBA,uBB,k)*(0.97+0.05*vnoise(p.xz*40.));
  float d2=length(p.xz);float sh=shadow(p+vec3(0,0.002,0),L);float ao=d2<1.6?mix(0.3,1.,occl(p,vec3(0,1,0))):1.;
  sh*=win(p);vec3 c=alb*(SUN*L.y*sh+SKY*ao)*0.92;
  vec3 wall=mix(uBA,uBB,kw)*vec3(flIl)*mix(1.,0.8,clamp(uv.y+0.2,0.,1.));
  col=mix(c,wall,smoothstep(6.,16.,tf));
 }
 col=tone(col);
 col=pow(col,vec3(1./2.2));
 vec2 sv=gl_FragCoord.xy/uRes-0.5;col*=1.-0.12*dot(sv,sv);
 col+=(hash(gl_FragCoord.xy+uSeed)-0.5)/180.;
 gl_FragColor=vec4(col,1.);
}`;

type Gl = WebGLRenderingContext;

function makeProgram(gl: Gl): WebGLProgram | null {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const v = sh(gl.VERTEX_SHADER, VS);
  const f = sh(gl.FRAGMENT_SHADER, FS);
  const prog = gl.createProgram();
  if (!v || !f || !prog) return null;
  gl.attachShader(prog, v);
  gl.attachShader(prog, f);
  gl.linkProgram(prog);
  return gl.getProgramParameter(prog, gl.LINK_STATUS) ? prog : null;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Still picture used when WebGL is missing: the same vase in flat SVG shading. */
function StillVase({ way }: { way: (typeof COLOURWAYS)[number] }) {
  return (
    <svg viewBox="0 0 400 440" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="god5-v" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".4" />
          <stop offset=".28" stopColor="#fff" stopOpacity="0" />
          <stop offset=".7" stopColor="#000" stopOpacity=".2" />
          <stop offset="1" stopColor="#000" stopOpacity=".42" />
        </linearGradient>
        <linearGradient id="god5-h" x1="0" y1="0" x2="0" y2="1">
          <stop offset=".55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".3" />
        </linearGradient>
        <pattern id="god5-f" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#000" opacity=".16" />
          <rect x="2" width="5" height="10" fill="#fff" opacity=".16" />
        </pattern>
        <filter id="god5-b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
        <clipPath id="god5-c"><path d="M182 300 C150 268 120 222 132 180 C142 148 176 132 184 112 C188 101 184 95 176 90 L224 90 C216 95 212 101 216 112 C224 132 258 148 268 180 C280 222 250 268 218 300 Z" /></clipPath>
      </defs>
      <rect width="400" height="440" fill={way.backdrop} />
      <ellipse cx="262" cy="372" rx="150" ry="20" fill="#000" opacity=".16" filter="url(#god5-b)" />
      <path d="M96 300 v60 a104 20 0 0 0 208 0 v-60z" fill={way.plinth} />
      <path d="M96 300 v60 a104 20 0 0 0 208 0 v-60z" fill="url(#god5-v)" />
      <path d="M93 300 v16 a107 21 0 0 0 214 0 v-16z" fill={way.plinth} />
      <path d="M93 300 v16 a107 21 0 0 0 214 0 v-16z" fill="url(#god5-v)" />
      <ellipse cx="200" cy="300" rx="107" ry="21" fill={way.plinth} />
      <ellipse cx="200" cy="300" rx="107" ry="21" fill="#fff" opacity=".2" />
      <ellipse cx="232" cy="301" rx="56" ry="9" fill="#000" opacity=".18" filter="url(#god5-b)" />
      <g clipPath="url(#god5-c)">
        <rect width="400" height="440" fill={way.glaze} />
        <rect width="400" height="440" fill="url(#god5-f)" />
        <rect width="400" height="440" fill="url(#god5-v)" />
        <rect y="90" width="400" height="210" fill="url(#god5-h)" />
        <rect x="150" y="150" width="9" height="90" rx="4.5" fill="#fff" opacity=".55" filter="url(#god5-b)" />
        <rect y="288" width="400" height="14" fill="#cdb79c" />
      </g>
      <ellipse cx="200" cy="91" rx="24" ry="4.5" fill="#000" opacity=".4" />
    </svg>
  );
}

export default function RayMarchedFlutedVaseProductCard() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [bag, setBag] = useState(0);
  const [glFailed, setGlFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const state = useRef({ rot: 0.35, vel: 0, from: 0, to: 0, wipe: 1, wipeStart: 0, lastInput: -1e9, demo: true, dirty: true });
  const reduceRef = useRef(!!reduce);
  reduceRef.current = !!reduce;

  const choose = (i: number, fromUser: boolean) => {
    const s = state.current;
    if (fromUser) s.demo = false;
    if (i === s.to) return;
    s.from = s.to;
    s.to = i;
    s.wipe = reduceRef.current ? 1 : 0;
    s.wipeStart = performance.now();
    if (reduceRef.current) s.from = i;
    s.dirty = true;
    setActive(i);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" }) as Gl | null;
    const prog = gl ? makeProgram(gl) : null;
    if (!gl || !prog) {
      setGlFailed(true);
      return;
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(prog);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const U = { res: u("uRes"), rot: u("uRot"), wipe: u("uWipe"), bob: u("uBob"), seed: u("uSeed"), ga: u("uGA"), gb: u("uGB"), pa: u("uPA"), pb: u("uPB"), ba: u("uBA"), bb: u("uBB") };
    const lin = COLOURWAYS.map((c) => ({ g: toLinear(c.glaze), p: toLinear(c.plinth), b: toLinear(c.backdrop) }));

    let scale = Math.min(window.devicePixelRatio || 1, MAX_SCALE);
    let w = 0;
    let h = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const s = Math.min(scale, Math.sqrt(PIXEL_BUDGET / Math.max(1, r.width * r.height)));
      w = Math.max(1, Math.round(r.width * s));
      h = Math.max(1, Math.round(r.height * s));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      state.current.dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(stage);

    let raf = 0;
    let last = performance.now();
    const t0 = last;
    let slow = 0;
    let frames = 0;
    let fpsT = last;
    let nextDemo = t0 + DEMO_FIRST * 1000;

    const frame = (now: number) => {
      raf = 0;
      const s = state.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const still = reduceRef.current;
      if (!still) {
        const idle = now - s.lastInput > 2500;
        const target = idle ? IDLE_SPIN : 0;
        s.vel += (target - s.vel) * (1 - Math.exp(-FRICTION * dt));
        s.rot += s.vel * dt;
        if (s.demo && now > nextDemo) {
          nextDemo = now + DEMO_EVERY * 1000;
          choose((s.to + 1) % COLOURWAYS.length, false);
        }
      }
      if (s.wipe < 1) {
        s.wipe = Math.min(1, (now - s.wipeStart) / (WIPE_SECONDS * 1000));
        if (s.wipe >= 1) s.from = s.to;
      }
      const a = lin[s.from];
      const b = lin[s.to];
      gl.uniform2f(U.res, w, h);
      gl.uniform1f(U.rot, s.rot);
      gl.uniform1f(U.wipe, s.wipe >= 1 ? 0 : ease(s.wipe));
      gl.uniform1f(U.bob, still ? 0 : Math.sin((now - t0) / 2600) * 0.035);
      gl.uniform1f(U.seed, still ? 0 : (now % 997) / 9.7);
      gl.uniform3fv(U.ga, s.wipe >= 1 ? b.g : a.g);
      gl.uniform3fv(U.gb, b.g);
      gl.uniform3fv(U.pa, s.wipe >= 1 ? b.p : a.p);
      gl.uniform3fv(U.pb, b.p);
      gl.uniform3fv(U.ba, s.wipe >= 1 ? b.b : a.b);
      gl.uniform3fv(U.bb, b.b);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      s.dirty = false;

      frames++;
      if (now - fpsT > 1000) {
        const fps = (frames * 1000) / (now - fpsT);
        canvas.dataset.fps = fps.toFixed(1);
        if (now - t0 > 5000 && fps < 40 && scale > MIN_SCALE && ++slow > 2) {
          scale = Math.max(MIN_SCALE, scale * 0.82);
          slow = 0;
          resize();
        }
        frames = 0;
        fpsT = now;
      }
      if (visible && !document.hidden && (!still || s.wipe < 1 || s.dirty)) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    (state.current as unknown as { kick: () => void }).kick = kick;
    const onVis = () => !document.hidden && kick();
    document.addEventListener("visibilitychange", onVis);
    kick();

    // drag to turn
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastT = performance.now();
      state.current.demo = false;
      state.current.lastInput = lastT;
      canvas.setPointerCapture(e.pointerId);
      kick();
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const s = state.current;
      const da = (dx / Math.max(200, canvas.clientWidth)) * Math.PI * 1.6;
      s.rot += da;
      s.vel = da / Math.max(0.008, (now - lastT) / 1000);
      s.lastInput = now;
      lastX = e.clientX;
      lastT = now;
      s.dirty = true;
      kick();
    };
    const up = () => {
      dragging = false;
      state.current.lastInput = performance.now();
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kickLoop = () => (state.current as unknown as { kick?: () => void }).kick?.();

  const onKey = (e: React.KeyboardEvent) => {
    const s = state.current;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      s.demo = false;
      s.rot += (e.key === "ArrowLeft" ? -1 : 1) * (Math.PI / 12);
      s.vel = 0;
      s.lastInput = performance.now();
      s.dirty = true;
      kickLoop();
    }
  };

  const pick = (i: number) => {
    choose(i, true);
    kickLoop();
  };

  const onSwatchKey = (e: React.KeyboardEvent, i: number) => {
    const n = COLOURWAYS.length;
    let j = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % n;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + n) % n;
    if (j < 0) return;
    e.preventDefault();
    pick(j);
    const el = document.getElementById(`god5-sw-${j}`);
    el?.focus();
  };

  const addToBag = () => {
    const s = state.current;
    s.demo = false;
    if (!reduceRef.current) s.vel = 5.5;
    s.lastInput = performance.now() - 2600;
    kickLoop();
    setBag((b) => b + 1);
  };

  const way = COLOURWAYS[active];

  return (
    <section
      className="relative w-full overflow-hidden px-4 py-10 sm:px-8 sm:py-14"
      style={{ backgroundColor: way.page, transition: reduce ? "none" : `background-color ${WIPE_SECONDS}s ease`, fontFamily: FONT, minHeight: 640 }}
    >
      <div className="mx-auto grid max-w-6xl items-stretch gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div
          ref={stageRef}
          tabIndex={0}
          role="group"
          aria-roledescription="3D viewer"
          aria-label={`${PRODUCT.name} ${PRODUCT.kind} in ${way.name}. Use the left and right arrow keys to turn it.`}
          onKeyDown={onKey}
          className="relative h-[440px] overflow-hidden rounded-[28px] lg:h-auto lg:min-h-[600px] outline-none focus-visible:ring-4 focus-visible:ring-black/40 sm:h-[560px]"
          style={{ backgroundColor: way.backdrop }}
        >
          {glFailed ? <StillVase way={way} /> : <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-grab touch-pan-y active:cursor-grabbing" aria-hidden="true" />}
          <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-2 text-[13px] font-medium text-neutral-800 backdrop-blur-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M4 12a8 4 0 0 0 16 0" />
              <path d="M17 9l3 3-3 3" />
              <path d="M7 15l-3-3" />
            </svg>
            Drag to turn
          </div>
        </div>

        <div className="flex flex-col rounded-[28px] bg-white p-6 sm:p-9">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-600">{PRODUCT.maker}</p>
            <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900" aria-label={`Bag, ${bag} item${bag === 1 ? "" : "s"}`} role="img">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 8h14l-1 12H6L5 8z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
              {bag > 0 && (
                <span key={bag} className="god5-pop absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1 text-[11px] font-semibold text-white">
                  {bag}
                </span>
              )}
            </span>
          </div>

          <h2 className="mt-6 text-[52px] font-semibold leading-[0.9] tracking-[-0.045em] text-neutral-950 sm:text-[72px]">{PRODUCT.name}</h2>
          <p className="mt-2 text-[24px] italic text-neutral-700 sm:text-[28px]" style={{ fontFamily: SERIF }}>
            {PRODUCT.kind}
          </p>
          <p className="mt-5 text-[30px] font-semibold tracking-[-0.03em] text-neutral-950 tabular-nums">{PRODUCT.price}</p>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutral-600">{PRODUCT.blurb}</p>

          <div className="mt-7">
            <p id="god5-cw" className="text-[13px] font-medium text-neutral-600">
              Colourway <span className="ml-1 font-semibold text-neutral-950">{way.name}</span>
            </p>
            <div role="radiogroup" aria-labelledby="god5-cw" className="mt-3 flex gap-3">
              {COLOURWAYS.map((c, i) => (
                <button
                  key={c.name}
                  id={`god5-sw-${i}`}
                  type="button"
                  role="radio"
                  aria-checked={i === active}
                  aria-label={c.name}
                  tabIndex={i === active ? 0 : -1}
                  onClick={() => pick(i)}
                  onKeyDown={(e) => onSwatchKey(e, i)}
                  className={`relative h-12 w-12 rounded-full outline-none transition-transform duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 motion-reduce:transition-none ${i === active ? "ring-2 ring-neutral-900 ring-offset-[3px]" : ""}`}
                  style={{ background: `radial-gradient(circle at 34% 30%, rgba(255,255,255,.55), rgba(255,255,255,0) 38%), linear-gradient(160deg, ${c.glaze}, ${c.glaze} 55%, rgba(0,0,0,.35) 140%), ${c.glaze}` }}
                >
                  <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white" style={{ backgroundColor: c.plinth }} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          <ul className="mt-6 flex flex-wrap gap-2">
            {PRODUCT.facts.map((f) => (
              <li key={f} className="rounded-full border border-neutral-200 px-3 py-1.5 text-[13px] text-neutral-700">
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={addToBag}
              className="god5-press flex h-14 w-full items-center justify-between rounded-full bg-neutral-950 pl-7 pr-2 text-[16px] font-semibold text-white outline-none transition-transform duration-150 active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-neutral-400 motion-reduce:transition-none"
            >
              <span>{bag > 0 ? "Add another" : "Add to bag"}</span>
              <span className="flex h-10 items-center rounded-full px-4 text-[14px] text-neutral-950" style={{ backgroundColor: way.page, transition: reduce ? "none" : `background-color ${WIPE_SECONDS}s ease` }}>
                {PRODUCT.price}
              </span>
            </button>
            <p className="mt-3 text-center text-[13px] text-neutral-600" aria-live="polite">
              {bag > 0 ? `${bag} in your bag, ${way.name} glaze.` : "Each one is thrown to order and varies a little."}
            </p>
          </div>
        </div>
      </div>
      <style>{`
@keyframes god5-pop-k { 0% { transform: scale(.2); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
.god5-pop { animation: god5-pop-k .45s cubic-bezier(.3,1.6,.5,1) both; }
@media (prefers-reduced-motion: reduce) { .god5-pop { animation: none; } }
`}</style>
    </section>
  );
}
