import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The three printed proofs: one homepage, three styles. Change names and copy here. */
const proofs = [
  { key: "A", style: "Linen", line: "Soft serif, cream paper, quiet photography." },
  { key: "B", style: "Night", line: "Heavy type on near-black, one warm accent." },
  { key: "C", style: "Market", line: "Clay colour blocks, pill buttons, three cards." },
];
const BUSINESS = "Tidewater Surf School";
const START = 1; // the proof that already lies on the table when the piece loads
const DEMO_EVERY = 6200; // ms between picks in the idle demo, until someone chooses
const BLUE = "#4F98FB";
const GROT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

// World sizes (metres, roughly). The shader receives the same numbers.
const HW = 0.21; // half width of a print
const HH = 0.28; // half height of a print
const TH = 0.0016; // half thickness of the paper
const CLIP = 0.05; // from the top of the print to the string
const SP = 0.58; // gap between proofs on the line
const LX = 1.22; // the line runs between two brass eyes at plus and minus LX
const Y0 = 1.3; // height of the eyes
const ZL = 0.24; // distance of the line from the wall
const SAG = 0.05;
const DIP = 0.032; // how far a hanging print pulls the line down
const REST = [
  [-0.16, 0.5, -0.15],
  [0.03, 0.52, 0.08],
  [0.17, 0.5, 0.18],
]; // where each proof lands on the table: x, z, turn
const FALL = 1.1; // seconds from unclip to landing
const RISE = 0.9;
const PW = 480; // atlas pixels per print
const PH = 640;

const VERT = `#version 300 es
in vec2 a; out vec2 vUv;
void main(){ vUv=a*0.5+0.5; gl_Position=vec4(a,0.,1.); }`;

const SCENE = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec3 uRo, uTa;
uniform vec4 uA[3]; uniform vec4 uB[3]; uniform vec3 uDip;
uniform sampler2D uAtlas;
out vec4 o;
const float HW=${HW.toFixed(4)}, HH=${HH.toFixed(4)}, TH=${TH.toFixed(4)}, CL=${CLIP.toFixed(4)};
const float SP=${SP.toFixed(4)}, LX=${LX.toFixed(4)}, Y0=${Y0.toFixed(4)}, ZL=${ZL.toFixed(4)}, SAG=${SAG.toFixed(4)};
const vec3 L=normalize(vec3(-0.5,0.64,0.58));
const vec3 BLUE=vec3(0.078,0.31,0.96);

float h21(vec2 p){ p=fract(p*vec2(233.34,851.73)); p+=dot(p,p+23.45); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float s=0.,a=.5; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+7.1; a*=.5; } return s; }
float box2(vec2 p,vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,d.y),0.); }
float box3(vec3 p,vec3 b){ vec3 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,max(d.y,d.z)),0.); }
float ext(float d2,float z,float h){ vec2 w=vec2(d2,abs(z)-h); return min(max(w.x,w.y),0.)+length(max(w,0.)); }
float cap(vec3 p,vec3 a,vec3 b,float r){ vec3 pa=p-a,ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }

float lineY(float x){
  float y=Y0-SAG*(1.-(x/LX)*(x/LX));
  for(int i=0;i<3;i++){ float d=(x-float(i-1)*SP)/0.24; y-=uDip[i]*exp(-d*d); }
  return y;
}
vec3 local(vec3 p,int i){
  vec4 A=uA[i], B=uB[i]; vec3 q=p-A.xyz;
  q.xy=rot(B.x)*q.xy; q.zx=rot(B.y)*q.zx; q.yz=rot(A.w)*q.yz;
  float bx=q.x/HW; q.z+=B.z*(bx*bx-0.35);
  return q;
}
// x distance, y part: 0 paper, 1 clip jaws, 2 wire
vec2 sheet(vec3 q){
  vec2 r=vec2(ext(box2(q.xy,vec2(HW,HH)-0.003)-0.003,q.z,TH),0.);
  vec3 c=q-vec3(0.,HH-0.004,0.);
  float jaw=box3(c,vec3(0.031,0.019,0.0016+0.0035*clamp((c.y+0.019)/0.038,0.,1.)))-0.0016;
  jaw=min(jaw,cap(c,vec3(-0.031,0.018,0.),vec3(0.031,0.018,0.),0.0052));
  if(jaw<r.x) r=vec2(jaw,1.);
  float w=1e3;
  for(int s=-1;s<=1;s+=2){ float fs=float(s);
    w=min(w,cap(c,vec3(-0.027,0.018,0.0055*fs),vec3(-0.017,0.004+CL,0.0012*fs),0.0015));
    w=min(w,cap(c,vec3(0.027,0.018,0.0055*fs),vec3(0.017,0.004+CL,0.0012*fs),0.0015));
    w=min(w,cap(c,vec3(-0.017,0.004+CL,0.0012*fs),vec3(0.017,0.004+CL,0.0012*fs),0.0015)); }
  if(w<r.x) r=vec2(w,2.);
  return r;
}
// id: 0 wall, 1 table, 2 string, 3 brass eye, 10+i*10+part a print
vec2 map(vec3 p){
  vec2 r=vec2(p.z,0.);
  if(p.y<r.x) r=vec2(p.y,1.);
  float x=clamp(p.x,-LX,LX);
  float dl=length(vec3(p.x-x,(p.y-lineY(x))*0.98,p.z-ZL))-0.0021;
  if(dl<r.x) r=vec2(dl,2.);
  float ax=(p.x<0.?-1.:1.)*(LX+0.012);
  float de=cap(p,vec3(ax,Y0,0.),vec3(ax,Y0,ZL-0.012),0.0048);
  vec3 er=p-vec3(ax,Y0,ZL); de=min(de,length(vec2(length(er.yz)-0.011,er.x))-0.0026);
  de=min(de,ext(length(p.xy-vec2(ax,Y0))-0.016,p.z-0.004,0.004)-0.001);
  if(de<r.x) r=vec2(de,3.);
  for(int i=0;i<3;i++){
    float b=length(p-uA[i].xyz)-(HH+CL+0.03);
    if(b>r.x) continue;
    vec2 s=sheet(local(p,i));
    s.x*=0.8;
    if(s.x<r.x) r=vec2(s.x,10.+float(i)*10.+s.y);
  }
  return r;
}
vec3 nor(vec3 p){ vec2 e=vec2(0.0004,-0.0004);
  return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x); }
float shadow(vec3 p){ float s=1.,t=0.003;
  for(int i=0;i<40;i++){ float h=map(p+L*t).x; s=min(s,16.*h/t); t+=clamp(h,0.002,0.08); if(s<0.01||t>2.2) break; }
  return clamp(s,0.,1.); }
float ao(vec3 p,vec3 n){ float a=0.,w=1.; for(int i=1;i<=4;i++){ float h=0.01*float(i)*float(i); a+=w*(h-map(p+n*h).x); w*=.6; } return clamp(1.-a*6.,0.,1.); }
// sun through a tall studio window with a mullion and a cross bar
float sun(vec3 p){
  vec2 w=(p+L*((3.0-p.z)/L.z)).xy-vec2(-2.05,4.15);
  float bl=0.05+0.02*length(w);
  float m=smoothstep(bl,-bl,box2(w,vec2(1.25,1.0)));
  vec2 g=abs(w-vec2(0.,0.25)); m*=smoothstep(0.02,0.02+bl,g.x)*smoothstep(0.018,0.018+bl,g.y);
  float lv=fbm(w*2.2+vec2(uTime*0.04,sin(uTime*0.25)*0.05));
  m*=mix(0.35,1.,smoothstep(0.32,0.58,lv+0.1*(w.y+0.4)));
  return m;
}
vec3 env(vec3 d){
  vec3 c=mix(vec3(0.36,0.31,0.26),vec3(0.78,0.75,0.7),smoothstep(-0.4,0.7,d.y));
  c+=vec3(3.4,2.8,2.1)*pow(max(dot(d,L),0.),20.);
  c+=vec3(1.1,1.05,1.0)*smoothstep(0.55,0.9,d.y)*smoothstep(0.2,-0.4,d.x)*0.6;
  return c;
}
vec4 shade(vec2 uv){
  vec3 fw=normalize(uTa-uRo), rt=normalize(cross(fw,vec3(0,1,0))), up=cross(rt,fw);
  vec3 rd=normalize(fw*2.4+rt*uv.x+up*uv.y), ro=uRo;
  float t=0.; vec2 h=vec2(0.);
  if(rd.y<0.&&rd.z<0.) t=max(0.,min((ro.y-Y0-0.12)/(-rd.y),ro.z/(-rd.z))-0.05);
  for(int i=0;i<130;i++){ h=map(ro+rd*t); if(h.x<0.00012*t||t>30.) break; t+=h.x; }
  vec3 p=ro+rd*t, n=nor(p);
  float id=h.y, sh=shadow(p+n*0.0012), sm=sun(p), oc=ao(p,n);
  float dl=max(dot(n,L),0.);
  vec3 sunC=vec3(1.0,0.84,0.64)*3.1;
  vec3 amb=vec3(0.34,0.34,0.36)*(0.6+0.4*n.y)*oc;
  vec3 bounce=vec3(0.36,0.28,0.2)*0.4*oc*max(0.5-0.5*n.y,0.);
  amb*=0.85+0.3*smoothstep(1.6,-1.2,p.x-p.y*0.5);
  vec3 alb=vec3(0.8); float spec=0.04, rough=0.85, metal=0.;
  if(id<0.5){
    float g=fbm(p.xy*7.)*0.6+fbm(p.xy*38.)*0.4;
    vec2 e=vec2(0.004,0.); float gx=fbm((p.xy+e)*38.)-fbm((p.xy-e)*38.), gy=fbm((p.xy+e.yx)*38.)-fbm((p.xy-e.yx)*38.);
    n=normalize(n+vec3(-gx,-gy,0.)*0.4); dl=max(dot(n,L),0.);
    alb=vec3(0.82,0.78,0.71)*(0.92+0.12*g);
  } else if(id<1.5){
    float gr=fbm(vec2(p.x*2.2+fbm(p.xz*3.)*1.5,p.z*70.));
    alb=mix(vec3(0.6,0.47,0.33),vec3(0.75,0.62,0.45),gr)*(0.94+0.08*fbm(p.xz*40.));
    spec=0.22; rough=0.42;
  } else if(id<2.5){
    alb=vec3(0.86,0.83,0.76)*(0.85+0.2*vn(vec2(p.x*900.,0.))); rough=1.;
  } else if(id<3.5){
    alb=vec3(0.86,0.66,0.36); metal=1.; rough=0.3; spec=1.;
  } else {
    int si=int(floor((id-10.)/10.)); float part=id-10.-float(si)*10.;
    vec3 q=local(p,si);
    if(part<0.5){
      float fib=fbm(q.xy*220.);
      alb=vec3(0.93,0.92,0.89)*(0.97+0.04*fib); rough=0.6; spec=0.05;
      if(q.z>0.){
        vec2 a=vec2((q.x/(2.*HW)+0.5+float(si))/3.,(HH-q.y)/(2.*HH));
        vec4 ink=texture(uAtlas,a);
        alb=mix(alb,ink.rgb,ink.a);
        rough=0.16+0.05*fib; spec=0.55;
      }
      alb*=mix(0.8,1.,smoothstep(0.05,0.5,abs(dot(n,normalize(vec3(0.,0.,1.))))+0.5));
    } else {
      bool blue=uB[si].w>0.5 && part<1.5;
      alb= blue ? BLUE*0.9 : vec3(0.78,0.79,0.8);
      metal= blue ? 0. : 1.; rough= blue ? 0.22 : 0.26; spec= blue ? 0.6 : 1.;
    }
  }
  vec3 dif=alb*(sunC*dl*sh*sm+amb+bounce);
  if(id>9.5){ float tr=max(dot(-n,L),0.)*sm*sh; dif+=alb*sunC*tr*0.16; }
  vec3 r=reflect(rd,n), hv=normalize(L-rd);
  float fr=0.04+0.96*pow(1.-max(dot(n,-rd),0.),5.);
  float g=pow(max(dot(n,hv),0.),2./(rough*rough*rough+0.002));
  if(metal>0.5) dif=alb*(env(r)*mix(0.3,1.,oc)+sunC*g*sh*sm*0.4*(1.-rough))+alb*amb*0.2;
  else dif+=spec*(fr*env(r)*0.3*oc+sunC*g*sh*sm*0.05);
  return vec4(dif,t);
}
void main(){
  vec2 px=1./uRes.yy;
  vec4 a=shade((gl_FragCoord.xy+vec2(0.25,-0.25)-0.5*uRes)/uRes.y);
  vec4 b=shade((gl_FragCoord.xy+vec2(-0.25,0.25)-0.5*uRes)/uRes.y);
  vec3 col=(a.rgb+b.rgb)*0.5;
  col=(col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14);
  col=pow(clamp(col,0.,1.),vec3(1./2.2));
  o=vec4(col,clamp(min(a.w,b.w)/8.,0.,1.));
}`;

const POST = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uSrc; uniform vec2 uRes; uniform float uFocus, uTime;
float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec4 c0=texture(uSrc,vUv);
  float z=c0.a*8.;
  vec2 e=1./uRes; vec3 Lm=vec3(0.299,0.587,0.114);
  float nw=dot(textureLod(uSrc,vUv+vec2(-e.x,-e.y),0.).rgb,Lm), ne=dot(textureLod(uSrc,vUv+vec2(e.x,-e.y),0.).rgb,Lm);
  float sw=dot(textureLod(uSrc,vUv+vec2(-e.x,e.y),0.).rgb,Lm), se=dot(textureLod(uSrc,vUv+e,0.).rgb,Lm), lm=dot(c0.rgb,Lm);
  float lo=min(lm,min(min(nw,ne),min(sw,se))), hi=max(lm,max(max(nw,ne),max(sw,se)));
  vec2 dir=vec2(-((nw+ne)-(sw+se)),(nw+sw)-(ne+se));
  float rcp=1./(min(abs(dir.x),abs(dir.y))+max((nw+ne+sw+se)*0.03125,0.0078));
  dir=clamp(dir*rcp,-8.,8.)*e;
  vec3 fa=0.5*(textureLod(uSrc,vUv+dir*(1./3.-0.5),0.).rgb+textureLod(uSrc,vUv+dir*(2./3.-0.5),0.).rgb);
  vec3 fb=fa*0.5+0.25*(textureLod(uSrc,vUv-dir*0.5,0.).rgb+textureLod(uSrc,vUv+dir*0.5,0.).rgb);
  float lb=dot(fb,Lm); c0.rgb=(lb<lo||lb>hi)?fa:fb;
  float pxs=uRes.y/720.;
  float coc=clamp(abs(z-uFocus)/max(z,0.1)*16.-0.6,0.,4.5)*pxs;
  vec3 acc=c0.rgb; float ws=1.;
  float j=hash(gl_FragCoord.xy)*6.283;
  float lod=log2(max(coc/3.,1.));
  for(int i=0;i<12;i++){
    float fi=(float(i)+0.5)/12.; float an=float(i)*2.39996+j;
    vec2 off=vec2(cos(an),sin(an))*sqrt(fi)*coc/uRes;
    acc+=textureLod(uSrc,vUv+off,lod).rgb; ws+=1.;
  }
  vec3 col=acc/ws;
  vec3 bl=textureLod(uSrc,vUv,4.).rgb*0.5+textureLod(uSrc,vUv,6.).rgb*0.5;
  col+=bl*bl*0.04;
  vec2 v=vUv-0.5; col*=1.-dot(v,v)*0.3;
  col+=(hash(gl_FragCoord.xy+fract(uTime)*91.7)-0.5)*0.022*(1.-0.4*col);
  o=vec4(col,1.);
}`;

/* ---------- the printed proofs ---------- */

function sea(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, warm: number) {
  const sky = g.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, warm ? "#e9c9a0" : "#bcd0d6");
  sky.addColorStop(0.42, warm ? "#f2dcc0" : "#dfe7e4");
  sky.addColorStop(0.44, warm ? "#3d6a72" : "#4f7d86");
  sky.addColorStop(1, warm ? "#1d3a40" : "#24464d");
  g.fillStyle = sky;
  g.fillRect(x, y, w, h);
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  const sunX = x + w * 0.68;
  const glow = g.createRadialGradient(sunX, y + h * 0.4, 2, sunX, y + h * 0.4, h * 0.5);
  glow.addColorStop(0, "rgba(255,246,226,0.95)");
  glow.addColorStop(1, "rgba(255,246,226,0)");
  g.fillStyle = glow;
  g.fillRect(x, y, w, h);
  for (let k = 0; k < 26; k++) {
    const yy = y + h * 0.46 + (k / 26) ** 1.6 * h * 0.54;
    g.strokeStyle = `rgba(255,255,255,${0.12 + 0.18 * Math.random()})`;
    g.lineWidth = 0.6 + k * 0.08;
    g.beginPath();
    for (let xx = x; xx <= x + w; xx += 6) {
      const yv = yy + Math.sin(xx * (0.05 - k * 0.0012) + k * 1.7) * (0.6 + k * 0.12);
      if (xx === x) g.moveTo(xx, yv);
      else g.lineTo(xx, yv);
    }
    g.stroke();
  }
  // a surfer on the wave
  g.fillStyle = "rgba(20,28,30,0.85)";
  g.beginPath();
  g.ellipse(x + w * 0.36, y + h * 0.66, w * 0.05, 2.2, -0.15, 0, Math.PI * 2);
  g.fill();
  g.fillRect(x + w * 0.355, y + h * 0.6, 3, h * 0.055);
  g.beginPath();
  g.arc(x + w * 0.358, y + h * 0.59, 3.2, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function paintProof(g: CanvasRenderingContext2D, i: number, x0: number) {
  const B = 22; // white print border
  const BB = 62; // deeper border at the foot for the proof label
  const x = x0 + B, y = B, w = PW - 2 * B, h = PH - B - BB;
  g.fillStyle = "#f7f6f2";
  g.fillRect(x0, 0, PW, PH);
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.textBaseline = "alphabetic";
  if (i === 0) {
    g.fillStyle = "#efe7da";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#2b2620";
    g.font = `italic 600 17px ${SERIF}`;
    g.fillText("Tidewater", x + 22, y + 34);
    g.font = `500 10px ${GROT}`;
    ["Lessons", "Tides", "Stay"].forEach((t, k) => g.fillText(t, x + w - 150 + k * 48, y + 32));
    g.fillRect(x + 22, y + 48, w - 44, 1);
    g.font = `500 37px ${SERIF}`;
    ["Read the water,", "then ride it."].forEach((t, k) => g.fillText(t, x + 22, y + 104 + k * 40));
    g.font = `400 11.5px ${SERIF}`;
    g.fillStyle = "#5b5248";
    ["Small groups, warm wetsuits and a coach", "who has surfed this bay since childhood."].forEach((t, k) =>
      g.fillText(t, x + 22, y + 176 + k * 17),
    );
    g.strokeStyle = "#2b2620";
    g.lineWidth = 1.4;
    g.beginPath();
    g.roundRect(x + 22, y + 208, 118, 32, 16);
    g.stroke();
    g.fillStyle = "#2b2620";
    g.font = `600 11px ${GROT}`;
    g.fillText("Book a lesson", x + 42, y + 228);
    sea(g, x + 22, y + 262, w - 44, 206, 0);
    g.font = `italic 400 11px ${SERIF}`;
    g.fillStyle = "#5b5248";
    ["Morning", "Midday", "Evening"].forEach((t, k) => {
      g.fillText(t, x + 22 + k * ((w - 44) / 3), y + 494);
      g.fillRect(x + 22 + k * ((w - 44) / 3), y + 502, (w - 44) / 3 - 14, 1);
    });
  } else if (i === 1) {
    g.fillStyle = "#101317";
    g.fillRect(x, y, w, h);
    sea(g, x, y + 250, w, h - 250, 1);
    const fade = g.createLinearGradient(0, y + 250, 0, y + 330);
    fade.addColorStop(0, "#101317");
    fade.addColorStop(1, "rgba(16,19,23,0)");
    g.fillStyle = fade;
    g.fillRect(x, y + 250, w, 80);
    g.fillStyle = "#f3f0ea";
    g.font = `800 13px ${GROT}`;
    g.fillText("TIDEWATER", x + 22, y + 34);
    g.font = `600 10px ${GROT}`;
    g.fillStyle = "rgba(243,240,234,0.7)";
    ["LESSONS", "TIDES", "STAY"].forEach((t, k) => g.fillText(t, x + w - 170 + k * 52, y + 33));
    g.fillStyle = "#f3f0ea";
    g.font = `900 62px ${GROT}`;
    g.letterSpacing = "-3px";
    ["RIDE THE", "MORNING", "SWELL."].forEach((t, k) => g.fillText(t, x + 20, y + 112 + k * 56));
    g.letterSpacing = "0px";
    g.fillStyle = "#e9c27a";
    g.beginPath();
    g.roundRect(x + 22, y + h - 62, 128, 34, 17);
    g.fill();
    g.fillStyle = "#101317";
    g.font = `800 11px ${GROT}`;
    g.fillText("Book a lesson", x + 44, y + h - 41);
    g.fillStyle = "#f3f0ea";
    g.font = `600 10px ${GROT}`;
    g.fillText("Boards and suits included", x + 166, y + h - 41);
  } else {
    g.fillStyle = "#f3ede3";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#c2583a";
    g.beginPath();
    g.roundRect(x + 14, y + 14, w - 28, 300, 18);
    g.fill();
    g.fillStyle = "#fbefe6";
    g.font = `800 15px ${GROT}`;
    g.fillText("tidewater", x + 34, y + 46);
    g.beginPath();
    g.roundRect(x + w - 118, y + 28, 84, 26, 13);
    g.fill();
    g.fillStyle = "#c2583a";
    g.font = `700 10px ${GROT}`;
    g.fillText("Book now", x + w - 99, y + 45);
    g.fillStyle = "#fbefe6";
    g.font = `800 40px ${GROT}`;
    g.letterSpacing = "-1.5px";
    ["Surf lessons", "for every tide"].forEach((t, k) => g.fillText(t, x + 34, y + 128 + k * 42));
    g.letterSpacing = "0px";
    g.font = `500 12px ${GROT}`;
    g.fillText("Beginners welcome, boards waiting.", x + 34, y + 204);
    sea(g, x + 34, y + 222, w - 68, 74, 1);
    const cards: [string, string][] = [
      ["#6f7a46", "Beginners"],
      ["#d9a75a", "Improvers"],
      ["#2f6a6e", "Board hire"],
    ];
    const cw = (w - 28 - 20) / 3;
    cards.forEach(([c, t], k) => {
      const cx = x + 14 + k * (cw + 10);
      g.fillStyle = c;
      g.beginPath();
      g.roundRect(cx, y + 330, cw, 160, 14);
      g.fill();
      g.fillStyle = "#fbefe6";
      g.font = `800 14px ${GROT}`;
      g.fillText(t, cx + 14, y + 470);
      g.beginPath();
      g.arc(cx + cw - 22, y + 352, 9, 0, Math.PI * 2);
      g.fill();
    });
  }
  g.restore();
  // proof label in the foot of the print
  g.fillStyle = "#3a352f";
  g.font = `600 13px ${MONO}`;
  g.letterSpacing = "2px";
  g.fillText(`PROOF ${proofs[i].key}`, x0 + B + 2, PH - 26);
  g.textAlign = "right";
  g.fillText(proofs[i].style.toUpperCase(), x0 + PW - B - 2, PH - 26);
  g.textAlign = "left";
  g.letterSpacing = "0px";
  g.fillStyle = "rgba(58,53,47,0.35)";
  g.fillRect(x0 + B, PH - 46, PW - 2 * B, 1);
}

function makeAtlas() {
  const c = document.createElement("canvas");
  c.width = PW * 3;
  c.height = PH;
  const g = c.getContext("2d")!;
  for (let i = 0; i < 3; i++) paintProof(g, i, i * PW);
  return c;
}

/* ---------- motion ---------- */

type P = { u: number; s: number; sv: number; land: number; lv: number; dip: number; dv: number; landed: boolean };
type V3 = [number, number, number];

const lineY = (x: number, dips: number[]) => {
  let y = Y0 - SAG * (1 - (x / LX) ** 2);
  dips.forEach((d, i) => {
    const k = (x - (i - 1) * SP) / 0.24;
    y -= d * Math.exp(-k * k);
  });
  return y;
};
const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// world = Rz(roll) Ry(yaw) Rx(pitch) local
const toWorld = (v: V3, pitch: number, yaw: number, roll: number): V3 => {
  let [x, y, z] = v;
  let c = Math.cos(pitch), s = Math.sin(pitch);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(yaw);
  s = Math.sin(yaw);
  [z, x] = [z * c - x * s, z * s + x * c];
  c = Math.cos(roll);
  s = Math.sin(roll);
  [x, y] = [x * c - y * s, x * s + y * c];
  return [x, y, z];
};
const PROBES: V3[] = [
  [-HW, -HH, 0],
  [HW, -HH, 0],
  [-HW, HH, 0],
  [HW, HH, 0],
  [0, HH + 0.018, -0.0055],
  [0, HH + 0.018, 0.0055],
  [0.03, HH + 0.012, -0.006],
  [-0.03, HH + 0.012, -0.006],
];

function pose(i: number, q: P, dips: number[], t: number) {
  const R = HH + CLIP;
  const px = (i - 1) * SP;
  const py = lineY(px, dips);
  const hang: V3 = [px + Math.sin(q.s) * R, py - Math.cos(q.s) * R, ZL];
  const [rx, rz, ry] = REST[i];
  const u = q.u;
  const side = i === 0 ? 1 : -1;
  const e = sstep(0, 1, u);
  const x = hang[0] + (rx - hang[0]) * e + 0.06 * side * Math.sin(u * Math.PI);
  const y = hang[1] + (TH + 0.0062 - hang[1]) * u * u;
  const z = ZL + (rz - ZL) * e + 0.05 * Math.sin(u * Math.PI);
  const flutter = Math.sin(u * Math.PI * 2.3) * u * (1 - u) * 4;
  const pitch = -Math.PI / 2 * sstep(0.04, 0.9, u) + 0.32 * flutter + q.land;
  const roll = q.s * (1 - sstep(0, 0.5, u)) + 0.2 * side * flutter;
  const yaw = ry * sstep(0.2, 1, u) + 0.004 * Math.sin(t * 0.5 + i) * (1 - u);
  const c: V3 = [x, y, z];
  // never through the table or the wall
  let lowY = 1e3, lowZ = 1e3;
  for (const p of PROBES) {
    const w = toWorld(p, pitch, yaw, roll);
    lowY = Math.min(lowY, c[1] + w[1]);
    lowZ = Math.min(lowZ, c[2] + w[2]);
  }
  if (lowY < 0.0008) c[1] += 0.0008 - lowY;
  if (lowZ < 0.01) c[2] += 0.01 - lowZ;
  return { c, pitch, yaw, roll };
}

function camera(aspect: number, t: number, phone: boolean) {
  const ta: V3 = [0, phone ? 0.72 : 0.66, 0.3];
  const halfW = phone ? 1.42 : 1.46;
  const halfH = phone ? 0.9 : 0.86;
  const D = Math.max((halfW * 2.4) / (0.5 * aspect), (halfH * 2.4) / 0.5);
  const dir: V3 = [0.1 + 0.012 * Math.sin(t * 0.17), 0.78, 1];
  const len = Math.hypot(...dir);
  const ro = ta.map((v, k) => v + (dir[k] / len) * D) as V3;
  return { ro, ta };
}

export default function ThreeProofsOnAStringLine() {
  const reduce = useReducedMotion();
  const [kept, setKept] = useState(START);
  const [webgl, setWebgl] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keptRef = useRef(START);
  const userRef = useRef(false);
  const pokeRef = useRef<() => void>(() => {});

  const choose = (i: number) => {
    userRef.current = true;
    setKept(i);
  };

  useEffect(() => {
    keptRef.current = kept;
    pokeRef.current();
  }, [kept]);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      if (!userRef.current) setKept((k) => (k + 1) % 3);
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
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
      return s;
    };
    const link = (fs: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, "a");
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
      return p;
    };
    let scene: WebGLProgram, post: WebGLProgram;
    try {
      scene = link(SCENE);
      post = link(POST);
    } catch (e) {
      console.warn(e);
      setWebgl(false);
      return;
    }
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uTime", "uRo", "uTa", "uA", "uB", "uDip", "uAtlas"].map((n) => [n, U(scene, n)]));
    const pu = Object.fromEntries(["uSrc", "uRes", "uFocus", "uTime"].map((n) => [n, U(post, n)]));
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const atlas = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, atlas);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, makeAtlas());
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));

    const fbo = gl.createFramebuffer();
    const fbTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const st: P[] = [0, 1, 2].map((i) => {
      const on = i === keptRef.current;
      return { u: on ? 1 : 0, s: 0.03 * Math.sin(i * 2.3), sv: 0, land: 0, lv: 0, dip: on ? 0 : DIP, dv: 0, landed: on };
    });

    let scale = 1;
    let w = 2, h = 2, aspect = 16 / 9, phone = false;
    let time = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const k = Math.min(dpr * scale, Math.sqrt(1.3e6 / Math.max(1, r.width * r.height)));
      w = Math.max(2, Math.round(r.width * k));
      h = Math.max(2, Math.round(r.height * k));
      canvas.width = w;
      canvas.height = h;
      aspect = r.width / Math.max(1, r.height);
      phone = r.width < 640;
      gl.bindTexture(gl.TEXTURE_2D, fbTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTex, 0);
      draw();
    };

    const A = new Float32Array(12);
    const B = new Float32Array(12);
    const draw = () => {
      const cam = camera(aspect, time, phone);
      const dips = st.map((q) => q.dip);
      let focus = 0;
      st.forEach((q, i) => {
        const p = pose(i, q, dips, time);
        A.set([p.c[0], p.c[1], p.c[2], p.pitch], i * 4);
        B.set([p.roll, p.yaw, 0.009 * (1 - q.u) + 0.003, i === keptRef.current && q.u > 0.96 ? 1 : 0], i * 4);
        if (i === keptRef.current) focus = Math.hypot(p.c[0] - cam.ro[0], p.c[1] - cam.ro[1], p.c[2] - cam.ro[2]);
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, w, h);
      gl.useProgram(scene);
      gl.uniform2f(su.uRes, w, h);
      gl.uniform1f(su.uTime, time);
      gl.uniform3fv(su.uRo, cam.ro);
      gl.uniform3fv(su.uTa, cam.ta);
      gl.uniform4fv(su.uA, A);
      gl.uniform4fv(su.uB, B);
      gl.uniform3fv(su.uDip, dips);
      gl.uniform1i(su.uAtlas, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.useProgram(post);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fbTex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.uniform1i(pu.uSrc, 0);
      gl.uniform2f(pu.uRes, w, h);
      gl.uniform1f(pu.uFocus, focus);
      gl.uniform1f(pu.uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const step = (dt: number) => {
      st.forEach((q, i) => {
        const want = keptRef.current === i;
        const was = q.u;
        q.u = want ? Math.min(1, q.u + dt / FALL) : Math.max(0, q.u - dt / RISE);
        if (want && was === 0 && q.u > 0) {
          // the line lets go: the other prints jump and sway
          st.forEach((o, j) => {
            if (j !== i) o.sv += (j < i ? -1 : 1) * 0.3;
          });
        }
        if (want && q.u >= 1 && !q.landed) {
          q.landed = true;
          q.lv = 1.1; // the leading edge kicks up once as the print lands
        }
        if (!want) q.landed = false;
        if (!want && was > 0 && q.u === 0) q.sv += 0.35 * (i === 0 ? -1 : 1); // rehung: it rocks on its clip
        q.lv += (-260 * q.land - 9 * q.lv) * dt;
        q.land += q.lv * dt;
        if (q.land < 0) {
          q.land = 0;
          q.lv = Math.abs(q.lv) * 0.25;
        }
        const target = q.u < 0.02 ? DIP : 0;
        q.dv += (-120 * (q.dip - target) - 4 * q.dv) * dt;
        q.dip += q.dv * dt;
        const breeze = 0.018 * Math.sin(time * 0.6 + i * 1.7) + 0.007 * Math.sin(time * 1.7 + i * 0.6);
        q.sv += (-14 * (q.s - breeze) - 0.7 * q.sv - q.dv * 0.02) * dt;
        q.s += q.sv * dt;
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
      time += dt;
      const sub = Math.ceil(dt / (1 / 240));
      for (let k = 0; k < sub; k++) step(dt / sub);
      draw();
      frames++;
      if (now - fpsT > 1000) {
        const fps = (frames * 1000) / (now - fpsT);
        canvas.dataset.fps = fps.toFixed(1);
        if (fps < 45 && scale > 0.55) {
          if (++slow >= 2) {
            scale = Math.max(0.55, scale - 0.15);
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
      if (reduce || raf || !visible) return;
      prev = performance.now();
      raf = requestAnimationFrame(loop);
    };
    pokeRef.current = () => {
      if (reduce) {
        st.forEach((q, i) => {
          const on = keptRef.current === i;
          Object.assign(q, { u: on ? 1 : 0, dip: on ? 0 : DIP, dv: 0, land: 0, lv: 0, landed: on });
        });
        draw();
      }
    };

    // press a hanging print in the picture to keep it
    const pick = (ev: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const ux = (ev.clientX - r.left - r.width / 2) / r.height;
      const uy = -(ev.clientY - r.top - r.height / 2) / r.height;
      const { ro, ta } = camera(aspect, time, phone);
      const f = ta.map((v, k) => v - ro[k]);
      const fl = Math.hypot(...f);
      const fw = f.map((v) => v / fl);
      const rl = Math.hypot(fw[2], fw[0]);
      const rt = [-fw[2] / rl, 0, fw[0] / rl];
      const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      const rd = [0, 1, 2].map((k) => fw[k] * 2.4 + rt[k] * ux + up[k] * uy);
      const tt = (ZL - ro[2]) / rd[2];
      const x = ro[0] + rd[0] * tt, y = ro[1] + rd[1] * tt;
      const i = Math.round(x / SP) + 1;
      if (i < 0 || i > 2 || Math.abs(x - (i - 1) * SP) > HW + 0.04) return -1;
      if (y > Y0 + 0.02 || y < Y0 - 2 * HH - CLIP - 0.12 || st[i].u > 0.5) return -1;
      return i;
    };
    const onClick = (e: MouseEvent) => {
      const i = pick(e);
      if (i >= 0) choose(i);
    };
    const onMove = (e: PointerEvent) => {
      const i = pick(e);
      canvas.style.cursor = i >= 0 ? "pointer" : "default";
      if (i >= 0 && !reduce) st[i].sv += 0.02 * Math.sign(e.movementX || 0);
    };
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("pointermove", onMove);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting && !document.hidden;
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
      gl.deleteTexture(atlas);
      gl.deleteTexture(fbTex);
      gl.deleteFramebuffer(fbo);
      gl.deleteBuffer(buf);
      gl.deleteProgram(scene);
      gl.deleteProgram(post);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  return (
    <section className="relative overflow-hidden bg-[#F6F4EF] text-[#0B0D12]" style={{ fontFamily: GROT }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="relative aspect-[1/1] w-full overflow-hidden rounded-[6px] bg-[#cdbfa9] shadow-[0_40px_80px_-40px_rgba(40,30,20,0.55)] sm:aspect-[16/9]">
          {webgl ? (
            <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
          ) : (
            <StillStudio kept={kept} />
          )}
        </div>
        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#0B0D12]/60">{BUSINESS}, printed three ways</p>
            <h2 className="mt-2 text-[44px] font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-[64px]">
              Try three. <span style={{ color: BLUE }}>Keep one.</span>
            </h2>
          </div>
          <div role="group" aria-label="Choose the proof to keep" className="flex flex-wrap gap-2">
            {proofs.map((p, i) => {
              const on = kept === i;
              return (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={on}
                  title={p.line}
                  onClick={() => choose(i)}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-[15px] font-bold tracking-[-0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F4EF] ${
                    on ? "bg-[#0B0D12] text-[#F6F4EF]" : "bg-[#e7e2d8] text-[#0B0D12] hover:bg-[#ddd6c9]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full transition-colors"
                    style={{ background: on ? BLUE : "rgba(11,13,18,0.25)" }}
                  />
                  {on ? `Kept: ${p.style}` : p.style}
                </button>
              );
            })}
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          {`${proofs[kept].style} is the kept proof. ${proofs[kept].line}`}
        </p>
      </div>
    </section>
  );
}

/** Without WebGL 2: the same studio as a still, with the real printed proofs. */
function StillStudio({ kept }: { kept: number }) {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    refs.current.forEach((c, i) => {
      if (!c) return;
      const g = c.getContext("2d");
      if (g) paintProof(g, i, 0);
    });
  }, []);
  return (
    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#d8cfc1 0%,#cfc4b4 62%,#b89a76 62%,#a7865f 100%)" }}>
      <div className="absolute left-[6%] right-[6%] top-[12%] h-px bg-[#efe9dc]" />
      {proofs.map((p, i) => {
        const on = i === kept;
        const style = on
          ? { left: `${36 + (i - 1) * 6}%`, top: "60%", width: "26%", transform: "perspective(600px) rotateX(58deg) rotateZ(4deg)" }
          : { left: `${11 + i * 28}%`, top: "13%", width: "21%", transform: `rotate(${(i - 1) * 1.5}deg)` };
        return (
          <div key={p.key} className="absolute" style={{ ...style, filter: "drop-shadow(14px 18px 10px rgba(50,35,20,0.35))" }}>
            <div
              className="mx-auto mb-[-6px] h-4 w-8 rounded-[3px]"
              style={{ background: on ? BLUE : "linear-gradient(180deg,#e3e5e8,#9ea3a8)" }}
            />
            <canvas ref={(el) => { refs.current[i] = el; }} width={PW} height={PH} className="block h-auto w-full" />
          </div>
        );
      })}
    </div>
  );
}
