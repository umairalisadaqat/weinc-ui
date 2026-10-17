import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** The questions. Each one is printed on the front of a folded tag and its answer inside. */
const tags = [
  {
    q: "How long does framing take?",
    a: "Most pieces are ready in ten working days. A rush job takes three, as long as the moulding you choose is on the rack.",
    paper: [0.66, 0.53, 0.38],
  },
  {
    q: "Can you frame a shirt or an object?",
    a: "Yes. Shirts, medals, tiles and letters go into deep box frames, stitched or pinned in place so nothing is ever glued.",
    paper: [0.6, 0.63, 0.52],
  },
  {
    q: "Is the glass anti-reflective?",
    a: "Museum glass is offered on every order. It cuts glare in a bright room and filters the light that fades ink and dyes.",
    paper: [0.74, 0.57, 0.51],
  },
  {
    q: "Do you collect large work?",
    a: "We collect and deliver across the city on Thursdays. Anything over a metre travels in one of our own padded crates.",
    paper: [0.55, 0.6, 0.64],
  },
  {
    q: "Can I bring my own frame?",
    a: "Bring it in. We check the joints, cut a fresh mount and fit new glass to the frame you already love.",
    paper: [0.84, 0.78, 0.64],
  },
];
const SHOP = "Marrow Lane Framers";
const START_OPEN = 1; // which tag hangs open when the piece loads
const DEMO_EVERY = 5200; // ms between tags in the self-playing demo, until someone clicks

// Scene sizes in world units (must match the shader constants below).
const N = tags.length;
const SP = 0.5; // gap between hooks
const HW = 0.2; // half the tag width
const HOOKY = 1.08;
const HZ = 0.13;
const LS = 0.2; // string length
const F = 2.2; // lens: higher is longer and flatter
const CW = 384; // atlas pixels per tag column
const S = CW / (2 * HW); // atlas pixels per world unit
const SPREAD = Math.round(0.9 * S);
const QTOP = SPREAD + 8;
const AH = QTOP + Math.round(0.4 * S) + 8;

const VERT = `#version 300 es
in vec2 aP; void main(){ gl_Position=vec4(aP,0.,1.); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec4 uTag[5]; uniform vec3 uPaper[5];
uniform vec3 uRo; uniform vec3 uTa; uniform sampler2D uAtlas;
out vec4 o;
const float SP=${SP.toFixed(3)}, HW=${HW.toFixed(3)}, PT=0.06, PB=-0.44, FL=0.40, TH=0.0038, CR=0.0065;
const float HOOKY=${HOOKY.toFixed(3)}, HZ=${HZ.toFixed(3)}, LS=${LS.toFixed(3)};
const float CWp=${CW.toFixed(1)}, Sp=${S.toFixed(3)}, QT=${QTOP.toFixed(1)}, AW=${(CW * N).toFixed(1)}, AH=${AH.toFixed(1)};
const vec3 L=normalize(vec3(-0.6,0.58,0.55));

float h21(vec2 p){ p=fract(p*vec2(233.34,851.73)); p+=dot(p,p+23.45); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float s=0.,a=.5; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+7.1; a*=.5; } return s; }

float box2(vec2 p,vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,d.y),0.); }
float box3(vec3 p,vec3 b){ vec3 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,max(d.y,d.z)),0.); }
float ext(float d2,float z,float h){ vec2 w=vec2(d2,abs(z)-h); return min(max(w.x,w.y),0.)+length(max(w,0.)); }
float cap(vec3 p,vec3 a,vec3 b,float r){ vec3 pa=p-a,ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }

vec3 tagLocal(vec3 p,int i){
  vec4 T=uTag[i]; vec3 q=p-vec3(float(i-2)*SP,HOOKY,HZ);
  float c=cos(T.x),s=sin(T.x); q.xy=mat2(c,-s,s,c)*q.xy; q.y+=LS;
  c=cos(T.z); s=sin(T.z); q.xz=mat2(c,-s,s,c)*q.xz;
  float bx=q.x/HW; q.z+=0.011*bx*bx; return q;
}
// flap frame: u along the paper from the crease, v across its thickness (+ is the answer side)
vec2 flapUV(vec3 l,vec4 T){
  float b=T.y; vec3 dir=vec3(0.,-cos(b),sin(b)), n=vec3(0.,sin(b),cos(b));
  vec3 q=l-vec3(0.,PB,CR); float u=dot(q,dir); return vec2(u, dot(q,n)+CR-T.w*u*u);
}
// x: distance, y: part (0 paper panel, 1 flap, 2 crease, 3 ring, 4 string)
vec2 tagSDF(vec3 l,vec4 T){
  vec2 xy=l.xy;
  float d2=box2(xy-vec2(0.,(PT+PB)*.5),vec2(HW,(PT-PB)*.5));
  d2=max(d2,(abs(xy.x)+xy.y-(HW+PT-0.065))*0.7071);
  d2=max(d2,-(length(xy)-0.013));
  vec2 r=vec2(ext(d2,l.z,TH),0.);
  vec2 fu=flapUV(l,T);
  float df=ext(box2(vec2(l.x,fu.x-FL*.5),vec2(HW,FL*.5)-0.016)-0.016,fu.y,TH);
  if(df<r.x) r=vec2(df,1.);
  float ry=l.y-PB, rz=l.z-CR; float th=atan(-ry,-rz);
  if(th>-0.02 && th<T.y+0.02){ float dc=max(abs(length(vec2(ry,rz))-CR)-TH,abs(l.x)-HW); if(dc<r.x) r=vec2(dc,2.); }
  float dr=ext(abs(length(xy)-0.025)-0.011,l.z,TH+0.0011); if(dr<r.x) r=vec2(dr,3.);
  float ds=min(cap(l,vec3(0.,LS+0.001,0.),vec3(0.003,0.0,0.0075),0.0032),cap(l,vec3(0.,LS+0.001,0.),vec3(-0.003,0.0,-0.0075),0.0032));
  ds=min(ds,cap(l,vec3(0.003,-0.002,0.0075),vec3(-0.003,-0.002,-0.0075),0.0032));
  if(ds<r.x) r=vec2(ds,4.);
  return r;
}
// id: 0 wall, 1 oak rail, 2 brass, 10+i*10+part tag
vec2 map(vec3 p){
  vec2 r=vec2(p.z,0.);
  float rail=box3(p-vec3(0.,HOOKY+0.01,0.012),vec3(1.21,0.052,0.010))-0.004;
  if(rail<r.x) r=vec2(rail,1.);
  int hi=clamp(int(floor(p.x/SP+2.5)),0,4); float hx=float(hi-2)*SP;
  float br=ext(length(p.xy-vec2(hx,HOOKY+0.01))-0.026,p.z-0.029,0.003)-0.002;
  br=min(br,cap(p,vec3(hx,HOOKY+0.01,0.03),vec3(hx,HOOKY-0.012,HZ),0.0075));
  br=min(br,cap(p,vec3(hx,HOOKY-0.012,HZ),vec3(hx,HOOKY+0.028,HZ+0.026),0.0068));
  if(br<r.x) r=vec2(br,2.);
  if(p.z<HZ+0.6){
    int i0=clamp(int(floor(p.x/SP+2.)),0,4), i1=min(i0+1,4);
    vec2 a=tagSDF(tagLocal(p,i0),uTag[i0]); if(a.x<r.x) r=vec2(a.x,10.+float(i0)*10.+a.y);
    if(i1!=i0){ vec2 b=tagSDF(tagLocal(p,i1),uTag[i1]); if(b.x<r.x) r=vec2(b.x,10.+float(i1)*10.+b.y); }
  } else r.x=min(r.x,p.z-HZ-0.06);
  return r;
}
vec3 nor(vec3 p){ vec2 e=vec2(0.0006,-0.0006);
  return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x); }
float shadow(vec3 p){ float s=1.,t=0.004;
  for(int i=0;i<34;i++){ float h=map(p+L*t).x; s=min(s,14.*h/t); t+=clamp(h,0.003,0.06); if(s<0.01||t>1.4) break; }
  return clamp(s,0.,1.); }
float ao(vec3 p,vec3 n){ float a=0.,w=1.; for(int i=1;i<=4;i++){ float h=0.012*float(i)*float(i); a+=w*(h-map(p+n*h).x); w*=.6; } return clamp(1.-a*7.,0.,1.); }
// sunlight comes through a four-pane window with leaves outside
float sun(vec3 p){
  vec2 w=(p+L*((2.6-p.z)/L.z)).xy-vec2(-2.62,3.44);
  float bl=0.035;
  float m=smoothstep(bl,-bl,box2(w,vec2(1.05,0.66)));
  vec2 g=abs(w); m*=smoothstep(0.018,0.018+bl,g.x)*smoothstep(0.016,0.016+bl,g.y);
  float lv=fbm(w*2.6+vec2(uTime*0.05,sin(uTime*0.3)*0.06));
  m*=mix(0.25,1.,smoothstep(0.38,0.6,lv+0.12*(w.x+0.6)));
  return m;
}
vec3 env(vec3 d){
  vec3 c=mix(vec3(0.33,0.27,0.21),vec3(0.62,0.58,0.52),smoothstep(-0.3,0.6,d.y));
  c+=vec3(3.2,2.6,1.9)*pow(max(dot(d,L),0.),24.);
  c+=vec3(0.9,0.8,0.65)*smoothstep(0.8,0.95,d.z)*0.5;
  return c;
}
void main(){
  vec2 uv=(gl_FragCoord.xy-0.5*uRes)/uRes.y;
  vec3 fw=normalize(uTa-uRo), rt=normalize(cross(fw,vec3(0,1,0))), up=cross(rt,fw);
  vec3 rd=normalize(fw*${F.toFixed(2)}+rt*uv.x+up*uv.y), ro=uRo;
  float t=(ro.z-0.75)/max(-rd.z,1e-3); vec2 h=vec2(0.);
  for(int i=0;i<120;i++){ h=map(ro+rd*t); if(h.x<0.00025*t||t>40.) break; t+=h.x*0.85; }
  vec3 p=ro+rd*t, n=nor(p), col;
  float id=h.y, sh=shadow(p+n*0.0015), sm=sun(p), oc=ao(p,n);
  float dl=max(dot(n,L),0.);
  vec3 sunC=vec3(1.0,0.82,0.58)*3.0, amb=vec3(0.31,0.3,0.31)*(0.62+0.38*n.y)*oc, bounce=vec3(0.32,0.24,0.16)*0.35*oc*max(-n.y*0.5+0.5,0.);
  amb*=0.82+0.3*smoothstep(1.8,-1.4,p.x-p.y*0.6);
  vec3 alb; float spec=0., rough=0.9, metal=0.;
  if(id<0.5){
    float g=fbm(p.xy*9.)*0.6+fbm(p.xy*42.)*0.4;
    vec2 e=vec2(0.004,0.); float gx=fbm((p.xy+e)*42.)-fbm((p.xy-e)*42.), gy=fbm((p.xy+e.yx)*42.)-fbm((p.xy-e.yx)*42.);
    n=normalize(n+vec3(-gx,-gy,0.)*0.55); dl=max(dot(n,L),0.);
    alb=vec3(0.78,0.71,0.6)*(0.9+0.16*g);
  } else if(id<1.5){
    float gr=fbm(vec2(p.x*3.,p.y*90.+fbm(p.xy*6.)*4.));
    alb=mix(vec3(0.36,0.22,0.12),vec3(0.55,0.37,0.2),gr); spec=0.3; rough=0.45;
  } else if(id<2.5){
    alb=vec3(0.85,0.64,0.34); metal=1.; rough=0.28+0.15*fbm(p.xy*80.); spec=1.;
  } else {
    int ti=int(floor((id-10.)/10.)); float part=id-10.-float(ti)*10.;
    vec3 l=tagLocal(p,ti); vec3 pap=uPaper[ti];
    float fib=fbm(l.xy*160.)*0.5+fbm(l.xy*30.)*0.5;
    alb=pap*(0.93+0.1*fib); rough=0.85; spec=0.06;
    vec2 a=vec2(-1.);
    float x=(l.x/(2.*HW)+0.5)*CWp+float(ti)*CWp;
    if(part<0.5){ if(l.z>0.) a=vec2(x,(PT-l.y)*Sp); }
    else if(part<1.5){ vec2 f=flapUV(l,uTag[ti]); a= f.y>0. ? vec2(x,(0.5+f.x)*Sp) : vec2(x,QT+(FL-f.x)*Sp); }
    else if(part<3.5){ alb= part>2.5 ? vec3(0.86,0.8,0.68) : alb; }
    else { alb=vec3(0.62,0.5,0.36)*(0.8+0.3*fbm(vec2(l.y*300.,l.x*40.))); rough=1.; }
    alb*=mix(0.72,1.,smoothstep(0.15,0.6,abs(n.z)));
    if(a.x>=0.){ vec4 ink=texture(uAtlas,a/vec2(AW,AH)); alb=mix(alb,ink.rgb*(0.85+0.2*fib),ink.a); }
  }
  vec3 dif=alb*(sunC*dl*sh*sm+amb+bounce);
  if(id>9.5){ float tr=max(dot(-n,L),0.)*sm*sh; dif+=alb*alb*sunC*tr*0.35; }
  vec3 r=reflect(rd,n), hv=normalize(L-rd);
  float fr=0.04+0.96*pow(1.-max(dot(n,-rd),0.),5.);
  float g=pow(max(dot(n,hv),0.),2./(rough*rough*rough+0.002));
  if(metal>0.5){ dif=alb*(env(r)*mix(0.35,1.,oc)+sunC*g*sh*sm*0.5*(1.-rough))+alb*amb*0.25; }
  else dif+=spec*(fr*env(r)*0.25*oc+sunC*g*sh*sm*0.08);
  col=dif;
  float hz=smoothstep(-0.2,1.0,sm)*0.0; col+=hz;
  col*=1.0-0.28*dot(uv*vec2(0.8,1.),uv*vec2(0.8,1.));
  col=(col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14);
  col=pow(clamp(col,0.,1.),vec3(1./2.2));
  col+=(h21(gl_FragCoord.xy+fract(uTime)*91.)-0.5)*0.022;
  o=vec4(col,1.);
}`;

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > max && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}

const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

/** Prints every question and answer onto one texture the shader reads from. */
function makeAtlas() {
  const c = document.createElement("canvas");
  c.width = CW * N;
  c.height = AH;
  const g = c.getContext("2d")!;
  const ink = "rgba(30,23,18,1)";
  const red = "rgba(128,46,34,1)";
  tags.forEach((t, i) => {
    const x0 = i * CW;
    const pad = 34;
    const no = `No. ${String(i + 1).padStart(2, "0")}`;
    // inside spread: answer
    g.fillStyle = red;
    g.font = `600 17px ${SERIF}`;
    g.letterSpacing = "3px";
    g.fillText("ANSWER", x0 + pad, 0.17 * S);
    g.textAlign = "right";
    g.fillText(no.toUpperCase(), x0 + CW - pad, 0.17 * S);
    g.textAlign = "left";
    g.letterSpacing = "0px";
    g.fillStyle = ink;
    g.fillRect(x0 + pad, 0.17 * S + 14, CW - pad * 2, 2);
    g.font = `500 33px ${SERIF}`;
    wrap(g, t.a, CW - pad * 2).forEach((ln, k) => g.fillText(ln, x0 + pad, 0.17 * S + 66 + k * 42));
    g.font = `italic 400 19px ${SERIF}`;
    g.fillStyle = "rgba(40,31,24,0.75)";
    g.fillText(SHOP, x0 + pad, 0.86 * S);
    // outside of the flap: question
    const q0 = QTOP;
    g.strokeStyle = ink;
    g.lineWidth = 2;
    g.strokeRect(x0 + 20, q0 + 18, CW - 40, 0.4 * S - 36);
    g.lineWidth = 1;
    g.strokeRect(x0 + 27, q0 + 25, CW - 54, 0.4 * S - 50);
    g.fillStyle = red;
    g.beginPath();
    g.arc(x0 + CW - 64, q0 + 70, 26, 0, Math.PI * 2);
    g.lineWidth = 2.5;
    g.strokeStyle = red;
    g.stroke();
    g.font = `700 19px ${SERIF}`;
    g.textAlign = "center";
    g.fillText(String(i + 1).padStart(2, "0"), x0 + CW - 64, q0 + 77);
    g.textAlign = "left";
    g.fillStyle = ink;
    g.font = `700 42px ${SERIF}`;
    wrap(g, t.q, CW - 2 * pad - 64).forEach((ln, k) => g.fillText(ln, x0 + pad + 6, q0 + 92 + k * 48));
    g.font = `600 14px ${SERIF}`;
    g.letterSpacing = "3px";
    g.fillStyle = "rgba(40,31,24,0.7)";
    g.fillText("UNFOLD TO READ", x0 + pad + 6, q0 + 0.4 * S - 46);
    g.letterSpacing = "0px";
  });
  return c;
}

type Tag = { s: number; sv: number; b: number; bv: number; t: number; tv: number };

function camera(aspect: number) {
  const halfW = 1.46;
  const halfH = 0.57;
  const D = Math.max((halfW * F) / (0.5 * aspect), (halfH * F) / 0.5);
  const ta = [0.05, 0.62, 0.08];
  const dir = [0.17, 0.1, 1];
  const len = Math.hypot(dir[0], dir[1], dir[2]);
  const ro = ta.map((v, k) => v + (dir[k] / len) * D);
  return { ro, ta };
}

export default function FoldedPaperTagFaq() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<number | null>(START_OPEN);
  const [webgl, setWebgl] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const openRef = useRef<number | null>(START_OPEN);
  const userRef = useRef(false);
  const pokeRef = useRef<() => void>(() => {});
  const fpsRef = useRef(0);

  const choose = (i: number) => {
    userRef.current = true;
    setOpen((cur) => (cur === i ? null : i));
  };

  useEffect(() => {
    openRef.current = open;
    pokeRef.current();
  }, [open]);

  // self-playing demo: walks along the hooks until someone takes over
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      if (userRef.current) return;
      setOpen((cur) => ((cur ?? -1) + 1) % N);
    }, DEMO_EVERY);
    return () => window.clearInterval(id);
  }, [reduce]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) {
      setWebgl(false);
      return;
    }
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
      return s;
    };
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
    } catch (e) {
      console.warn(e);
      setWebgl(false);
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aP");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, makeAtlas());
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U("uRes"), uTime = U("uTime"), uTag = U("uTag"), uPaper = U("uPaper"), uRo = U("uRo"), uTa = U("uTa");
    gl.uniform1i(U("uAtlas"), 0);
    gl.uniform3fv(uPaper, new Float32Array(tags.flatMap((t) => t.paper)));

    const st: Tag[] = tags.map((_, i) => ({ s: 0.02 * Math.sin(i * 2.1), sv: 0, b: i === openRef.current ? 0.12 : Math.PI, bv: 0, t: 0, tv: 0 }));
    let scale = 1;
    let w = 0, h = 0, aspect = 4 / 3;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const budget = 1.1e6;
      const k = Math.min(dpr * scale, Math.sqrt(budget / Math.max(1, r.width * r.height)));
      w = Math.max(2, Math.round(r.width * k));
      h = Math.max(2, Math.round(r.height * k));
      canvas.width = w;
      canvas.height = h;
      aspect = r.width / Math.max(1, r.height);
      gl.viewport(0, 0, w, h);
      draw(lastT);
    };

    let lastT = 0;
    const draw = (time: number) => {
      const cam = camera(aspect);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, time);
      gl.uniform3fv(uRo, cam.ro);
      gl.uniform3fv(uTa, cam.ta);
      gl.uniform4fv(uTag, new Float32Array(st.flatMap((q) => [q.s, q.b, q.t, Math.max(-0.5, Math.min(0.5, q.bv * 0.05))])));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const step = (dt: number, time: number) => {
      st.forEach((q, i) => {
        const want = openRef.current === i;
        let acc: number;
        if (want) acc = -60 * Math.sin(q.b) + 2.6 * (Math.PI - q.b) - 1.5 * q.bv;
        else acc = 150 * (Math.PI - q.b) - 11 * q.bv - 20 * Math.sin(q.b);
        q.bv += acc * dt;
        q.b += q.bv * dt;
        if (q.b > Math.PI) {
          q.b = Math.PI;
          if (q.bv > 0) {
            q.sv += q.bv * 0.012 * (i % 2 ? 1 : -1);
            q.bv *= -0.28;
          }
        }
        if (q.b < 0.02) {
          q.b = 0.02;
          q.bv = Math.abs(q.bv) * 0.3;
        }
        const breeze = 0.014 * Math.sin(time * 0.7 + i * 1.3) + 0.006 * Math.sin(time * 1.9 + i);
        q.sv += (-17 * (q.s - breeze) - 0.9 * q.sv - q.bv * 0.02 * Math.cos(q.b)) * dt;
        q.s += q.sv * dt;
        q.tv += (-10 * q.t - 1.2 * q.tv + 0.04 * acc * dt * 10 * (i % 2 ? 1 : -1) * 0.02) * dt;
        q.t += q.tv * dt;
      });
    };

    const kick = () => {
      st.forEach((q, i) => {
        const want = openRef.current === i;
        if (want && q.b > 3.0 && Math.abs(q.bv) < 0.5) {
          q.bv = 0.9; // the flap lifts off its crease for a moment before it drops
          q.tv += 0.5 * (i % 2 ? 1 : -1);
        }
        if (!want && q.b < 3.0) q.sv += 0.25 * (i % 2 ? -1 : 1);
      });
    };

    let raf = 0;
    let visible = true;
    let prev = performance.now();
    let frames = 0, fpsT = prev, slow = 0;
    const loop = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      lastT = now / 1000;
      const sub = Math.ceil(dt / (1 / 240));
      for (let k = 0; k < sub; k++) step(dt / sub, lastT);
      draw(lastT);
      frames++;
      if (now - fpsT > 1000) {
        fpsRef.current = (frames * 1000) / (now - fpsT);
        canvas.dataset.fps = fpsRef.current.toFixed(1);
        if (fpsRef.current < 40 && scale > 0.6) {
          slow++;
          if (slow >= 2) {
            scale = Math.max(0.6, scale - 0.15);
            slow = 0;
            resize();
          }
        } else slow = 0;
        frames = 0;
        fpsT = now;
      }
      if (visible) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduce) return;
      if (!raf && visible) {
        prev = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    pokeRef.current = () => {
      if (reduce) {
        st.forEach((q, i) => {
          q.b = openRef.current === i ? 0.12 : Math.PI;
          q.bv = 0;
        });
        draw(lastT);
      } else kick();
    };

    // pointer shortcut: press a tag in the picture
    const hit = (ev: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const ux = (ev.clientX - r.left - r.width / 2) / r.height;
      const uy = -(ev.clientY - r.top - r.height / 2) / r.height;
      const { ro, ta } = camera(aspect);
      const fw = ta.map((v, k) => v - ro[k]);
      const fl = Math.hypot(fw[0], fw[1], fw[2]);
      const f = fw.map((v) => v / fl);
      const rtRaw = [-f[2], 0, f[0]];
      const rl = Math.hypot(rtRaw[0], rtRaw[2]);
      const rt = rtRaw.map((v) => v / rl);
      const up = [rt[1] * f[2] - rt[2] * f[1], rt[2] * f[0] - rt[0] * f[2], rt[0] * f[1] - rt[1] * f[0]];
      const rd = [0, 1, 2].map((k) => f[k] * F + rt[k] * ux + up[k] * uy);
      const tt = (HZ - ro[2]) / rd[2];
      const x = ro[0] + rd[0] * tt, y = ro[1] + rd[1] * tt;
      const i = Math.round(x / SP) + 2;
      if (i < 0 || i >= N || Math.abs(x - (i - 2) * SP) > HW + 0.03) return -1;
      if (y > HOOKY + 0.05 || y < HOOKY - LS - 0.9) return -1;
      return i;
    };
    const onClick = (e: MouseEvent) => {
      const i = hit(e);
      if (i >= 0) choose(i);
    };
    const onMove = (e: PointerEvent) => {
      const i = hit(e);
      canvas.style.cursor = i >= 0 ? "pointer" : "default";
      if (i >= 0 && !reduce) st[i].sv += 0.012 * Math.sign(e.movementX || 0);
    };
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("pointermove", onMove);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !document.hidden;
      if (visible) start();
    });
    io.observe(canvas);
    const onVis = () => {
      visible = !document.hidden;
      if (visible) start();
    };
    document.addEventListener("visibilitychange", onVis);
    start();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("pointermove", onMove);
      pokeRef.current = () => {};
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  return (
    <section className="relative overflow-hidden bg-[#e6dccb] text-[#2a221b]">
      <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.45fr_1fr] lg:gap-12 lg:py-16">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[4px] bg-[#cdbfa8] shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_30px_60px_-30px_rgba(60,40,20,0.45)]">
          {webgl ? (
            <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
          ) : (
            <StillWall open={open} />
          )}
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#7a3326]">{SHOP}</p>
          <h2
            className="mt-3 text-[40px] leading-[1.02] tracking-[-0.02em] sm:text-[52px]"
            style={{ fontFamily: SERIF, fontWeight: 600 }}
          >
            Asked at the counter
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#5a4c3e]">
            Pick a tag to let it fall open. The same answer is printed inside the paper.
          </p>
          <ul className="mt-7 border-t border-[#2a221b]/20">
            {tags.map((t, i) => {
              const isOpen = open === i;
              return (
                <li key={t.q} className="border-b border-[#2a221b]/20">
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`fptf-a-${i}`}
                      onClick={() => choose(i)}
                      className="flex min-h-[48px] w-full items-center gap-4 py-3 text-left text-[17px] leading-snug transition-colors hover:text-[#7a3326] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a3326] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e6dccb]"
                      style={{ fontFamily: SERIF }}
                    >
                      <span className="w-7 shrink-0 text-[13px] tabular-nums tracking-[0.1em] text-[#7a3326]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 font-semibold">{t.q}</span>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      >
                        <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`fptf-a-${i}`}
                        role="region"
                        aria-label={t.q}
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-4 pl-11 pr-6 text-[15px] leading-relaxed text-[#4a3e33]">{t.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Shown when the browser has no WebGL 2: the same wall, drawn with plain CSS. */
function StillWall({ open }: { open: number | null }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(160deg,#a89a88,#8c7f70)",
      }}
    >
      <div className="absolute left-[20%] top-[8%] grid h-[66%] w-[74%] grid-cols-2 gap-[3%] opacity-80 blur-[3px]">
        {[0, 1, 2, 3].map((k) => (
          <div key={k} className="bg-[#f6e4bf]/70" />
        ))}
      </div>
      <div className="absolute left-[9%] right-[9%] top-[24%] h-[4.5%] rounded-[3px] bg-gradient-to-b from-[#c79a62] to-[#8f6438] shadow-[6px_8px_8px_rgba(50,30,15,0.35)]" />
      <div className="absolute inset-x-[11%] top-[26%] flex justify-between">
        {tags.map((t, i) => {
          const c = `rgb(${t.paper.map((v) => Math.round(Math.min(255, v * 290))).join(",")})`;
          const isOpen = open === i;
          return (
            <div key={t.q} className="flex w-[16%] flex-col items-center" style={{ filter: "drop-shadow(10px 14px 6px rgba(60,40,20,0.3))" }}>
              <div className="h-3 w-3 rounded-full bg-[#d0a865]" />
              <div className="h-6 w-px bg-[#8a7258]" />
              <div
                className="relative w-full px-2 pb-2 pt-6 text-[8px] leading-tight text-[#2a221b] sm:text-[11px]"
                style={{
                  background: c,
                  aspectRatio: isOpen ? "0.44" : "0.8",
                  clipPath: "polygon(25% 0,75% 0,100% 13%,100% 100%,0 100%,0 13%)",
                  fontFamily: SERIF,
                }}
              >
                <span className="absolute left-1/2 top-[5%] h-2 w-2 -translate-x-1/2 rounded-full border border-[#efe6d4] bg-[#5a4c3e]" />
                {isOpen && <span className="absolute inset-x-0 top-[55%] h-px bg-black/15" />}
                <span className={isOpen ? "font-normal" : "font-semibold"}>{isOpen ? t.a : t.q}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
