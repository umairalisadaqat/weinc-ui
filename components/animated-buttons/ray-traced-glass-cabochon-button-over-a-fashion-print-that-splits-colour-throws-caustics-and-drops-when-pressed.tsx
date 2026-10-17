import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const LABEL = "Open the issue";
const MASTHEAD = "Chroma";
const FOLIO = ["Issue 14", "The colour issue"];
const CAPTION = "Solid glass, traced ray by ray. Press it.";
const PLATE = "Plate 03  /  Glass on colour print";
const HEAD_FROM = 0.44; // the subject starts this far across the photo; left of it the masthead always prints
const PHOTO = "https://images.pexels.com/photos/7515722/pexels-photo-7515722.jpeg?auto=compress&cs=tinysrgb&w=1600";
const PHOTO_ALT = "Profile of a woman with slicked-back dark hair in a red zip collar against a yellow wall, blue fabric out of focus beside her";
const SPOT = { u: 0.30, v: 0.70 }; // where on the print the glass sits (0 to 1 across, 0 to 1 down)
const MAST_SIZE = 274; // masthead size on a print 2048 wide
const PRINT_WIDTH = 8.6; // print width in glass-widths (the pill is 1 wide and 3 long)
const IOR = 1.52; // how strongly the glass bends light
const SPREAD = 0.085; // how far red and violet separate; 0 is colourless glass
const HOVER = 0.135; // resting height above the paper
const TINT = [0.16, 0.035, 0.07]; // what the glass absorbs per unit of thickness (red, green, blue)
const LAMP: [number, number, number] = [-4.5, 7, -3.4]; // where the lamp stands: left, up, back
const SERIF = '"Canela", "Tiempos Headline", "Didot", "Bodoni 72", "Playfair Display", "Iowan Old Style", Georgia, serif';
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

// Shape of the glass: half length of the spine, half width, height of the dome.
const A = 1, R = 0.5, H = 0.4;

const SHAPE = `
uniform vec3 uPos; uniform mat3 uRot;
const float A=${A.toFixed(2)}, R=${R.toFixed(2)}, H=${H.toFixed(2)}, K=R/H, BIG=1e5;
vec3 squash(vec3 p){ return vec3(p.x,p.y*K,p.z); }
// First hit from outside on the dome (a capsule squashed in height), or -1.
float domeNear(vec3 ro, vec3 rd, float r){
  float a=rd.y*rd.y+rd.z*rd.z+1e-7, b=ro.y*rd.y+ro.z*rd.z, c=ro.y*ro.y+ro.z*ro.z-r*r, h=b*b-a*c;
  if(h<0.) return -1.;
  float t=(-b-sqrt(h))/a, x=ro.x+t*rd.x;
  if(abs(x)<=A) return t;
  vec3 oc=ro-vec3(sign(x)*A,0.,0.);
  float a2=dot(rd,rd), b2=dot(oc,rd), c2=dot(oc,oc)-r*r, h2=b2*b2-a2*c2;
  if(h2<0.) return -1.;
  return (-b2-sqrt(h2))/a2;
}
// Where a ray that is already inside leaves the dome.
float domeFar(vec3 ro, vec3 rd){
  float a=rd.y*rd.y+rd.z*rd.z+1e-7, b=ro.y*rd.y+ro.z*rd.z, c=ro.y*ro.y+ro.z*ro.z-R*R, h=max(b*b-a*c,0.);
  float t=(-b+sqrt(h))/a, x=ro.x+t*rd.x;
  if(abs(x)<=A) return t;
  vec3 oc=ro-vec3(sign(x)*A,0.,0.);
  float a2=dot(rd,rd), b2=dot(oc,rd), c2=dot(oc,oc)-R*R, h2=max(b2*b2-a2*c2,0.);
  return (-b2+sqrt(h2))/a2;
}
vec3 domeNormal(vec3 p){
  vec3 s=squash(p); vec3 n=s-vec3(clamp(s.x,-A,A),0.,0.);
  return normalize(vec3(n.x,n.y*K,n.z));
}
// Carry a ray through the solid: out of the flat base or the dome, bouncing when the angle is too shallow to escape.
// pass is the share of light that makes it out through the last surface; it falls to nothing as the angle nears that limit.
bool through(inout vec3 o, inout vec3 d, float ior, out float len, out float pass){
  len=0.; pass=0.;
  for(int i=0;i<4;i++){
    float tb=d.y<-1e-5 ? -o.y/d.y : BIG;
    float td=domeFar(squash(o),squash(d));
    vec3 n; float t;
    if(tb<td){ t=tb; n=vec3(0.,1.,0.); } else { t=td; n=-domeNormal(o+d*td); }
    o+=d*t; len+=t;
    vec3 r=refract(d,n,ior);
    if(dot(r,r)>0.){ pass=1.-(.043+.957*pow(1.-max(-dot(r,n),0.),5.)); d=r; return true; }
    d=reflect(d,n); o+=n*2e-4;
  }
  return false;
}`;

// Pass one: a sheet of light rays is laid over the dome, pushed through the glass and drawn where it lands. Where the sheet bunches up, the paper gets brighter.
const CAUSTIC_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aG;
${SHAPE}
uniform vec2 uCausO, uCausS; uniform vec3 uLight; uniform float uIor, uSoak;
out vec2 vOld; out vec2 vLabel; out float vGain; out float vOk;
void main(){
  float a=aG.x*2.-1., b=clamp(aG.y*2.-1.,-.9995,.9995);
  vec3 p=vec3(a*(A+R*sqrt(1.-b*b)),0.,b*R);
  float q=length(vec2(max(abs(p.x)-A,0.),p.z))/R;
  p.y=H*sqrt(max(1.-q*q,0.));
  mat3 rt=transpose(uRot);
  vec3 rd=rt*(-uLight), n=domeNormal(p);
  vec3 pw=uRot*p+uPos;
  vec3 land=pw-uLight*(pw.y/uLight.y);
  vOld=land.xz; vOk=0.; vGain=0.; vLabel=vec2(p.x/(2.*(A+R))+.5, p.z/(2.*R)+.5);
  float c=dot(-rd,n);
  if(c>0.){
    float f=.043+.957*pow(1.-c,5.);
    vec3 d=refract(rd,n,1./uIor); vec3 o=p; float len, pass;
    if(through(o,d,uIor,len,pass)){
      vec3 wd=uRot*d, wo=uRot*o+uPos;
      if(wd.y<-.03){ land=wo+wd*(-wo.y/wd.y); vGain=(1.-f)*pass*exp(-uSoak*len); vOk=1.; }
    }
  }
  gl_Position=vec4((land.xz-uCausO)/uCausS*2.-1.,0.,1.);
}`;
const CAUSTIC_FS = `#version 300 es
precision highp float;
in vec2 vOld; in vec2 vLabel; in float vGain; in float vOk;
uniform sampler2D uLabel; uniform float uCell, uScale; uniform vec3 uHue;
out vec4 o;
void main(){
  if(vOk<.999) discard;
  vec2 dx=dFdx(vOld), dy=dFdy(vOld);
  float bunch=abs(dx.x*dy.y-dx.y*dy.x)/uCell;
  float ink=textureLod(uLabel,vLabel,1.5).a;
  o=vec4(uHue*(min(bunch,9.)*vGain*(1.-.92*ink)*uScale),1.);
}`;

// The camera's last touches, shared by both ways of finishing a frame: darker corners, a film curve and grain.
const FILM = `
vec3 film(vec3 col, vec2 fc, vec2 res, float time){
  vec2 v=fc/res-.5;
  col*=(1.-dot(v,v)*.85)*1.32;
  col=clamp((col*(2.51*col+.03))/(col*(2.43*col+.59)+.14),0.,1.);
  col=pow(col,vec3(1./2.2));
  vec2 g=fract(fc*vec2(.1234,.4562)+fract(time)*7.13); g+=dot(g,g+45.32);
  return col+(fract(g.x*g.y)-.5)*.024;
}`;
const SCENE_VS = `#version 300 es
void main(){ vec2 p=vec2(gl_VertexID==1?3.:-1., gl_VertexID==2?3.:-1.); gl_Position=vec4(p,0.,1.); }`;
// Pass two: the picture. One ray per pixel (four on the glass), split into six colours inside the glass.
const SCENE_FS = `#version 300 es
precision highp float;
${SHAPE}
uniform vec2 uRes; uniform float uTime, uTan, uFocus, uAper, uCausScale, uIor, uSpread; uniform int uAA;
uniform vec3 uCam, uF, uR, uU, uLight, uTint;
uniform vec4 uPrint; uniform vec2 uCausO, uCausS;
uniform sampler2D uTex, uCaus, uLabel; uniform bool uDirect;
out vec4 frag;
${FILM}
// Colour of one slice of the spectrum, 0 at red to 1 at violet, scaled so the whole run adds up to white.
vec3 hue(float t){ return vec3((max(0.,1.-abs(t-.08)/.42)+.35*max(0.,1.-abs(t-1.)/.2))/.317, max(0.,1.-abs(t-.5)/.36)/.36, max(0.,1.-abs(t-.85)/.38)/.31); }
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float card(vec2 p, vec2 c, vec2 h, float s){ vec2 q=abs(p-c)-h; float d=length(max(q,0.))+min(max(q.x,q.y),0.); return 1.-smoothstep(-s,s,d); }
// The studio: one hard strip lamp high behind the glass (it makes the shadows and the focus line), a long soft card low on the back wall
// (it makes the highlight along the far shoulder), a warm strip to one side and a dim fill behind the camera. s spreads them for rough surfaces.
vec3 env(vec3 d, float s, float lamp){
  vec3 c=mix(vec3(.010,.010,.012),vec3(.035,.037,.045),smoothstep(-.1,.9,d.y));
  vec3 q=d-uLight; float r=.03+lamp*1.6;
  c+=vec3(1.,.97,.92)*(1.1/(r*(r+.25)))*smoothstep(r*1.3,r*.5,length(q.yz))*smoothstep(.3+r,.2+r*.5,abs(q.x));
  if(d.z<-.02){ vec2 p=d.xy*(-10./d.z); c+=vec3(.86,.92,1.)*5.*card(p,vec2(-1.,3.6),vec2(6.5,1.9),.7+s*12.); }
  if(d.x>.02){ vec2 p=d.zy*(9./d.x); c+=vec3(1.,.70,.42)*4.*card(p,vec2(-1.5,3.6),vec2(.65,2.8),.2+s*9.); }
  if(d.z>.02){ vec2 p=d.xy*(10./d.z); c+=vec3(1.,.96,.9)*.6*card(p,vec2(-1.,5.),vec2(6.,3.),1.5+s*10.); }
  return c;
}
// How much of the lamp a point on the paper can see past the glass: 0 behind it, 1 clear of it.
float clearOf(vec3 P){
  mat3 rt=transpose(uRot);
  vec3 ro=squash(rt*(P-uPos)), rd=squash(rt*uLight); rd=normalize(rd);
  float b=rd.x, dd=dot(rd,ro), t=(ro.x*b-dd)/max(1.-b*b,1e-4), sx=clamp(ro.x+t*b,-A,A);
  t=sx*b-dd;
  float m=length(ro+rd*t-vec3(sx,0.,0.))-R;
  float out_=domeFar(ro,rd);
  float up=smoothstep(-.03,.05,(ro.y+rd.y*out_)/K);
  return 1.-smoothstep(.035,-.035,m)*(m<0. ? up : 1.);
}
vec3 poolOfLight(vec2 xz, float lod){
  vec2 uv=(xz-uCausO)/uCausS;
  vec2 e=smoothstep(vec2(0.),vec2(.05),uv)*smoothstep(vec2(0.),vec2(.05),1.-uv);
  float k=e.x*e.y; if(k<=0.) return vec3(1.);
  vec2 px=exp2(lod)/vec2(textureSize(uCaus,0));
  vec3 c=textureLod(uCaus,uv,lod).rgb*.4+(textureLod(uCaus,uv+px*vec2(.7,.3),lod).rgb+textureLod(uCaus,uv+px*vec2(-.3,.7),lod).rgb+textureLod(uCaus,uv+px*vec2(-.7,-.3),lod).rgb+textureLod(uCaus,uv+px*vec2(.3,-.7),lod).rgb)*.15;
  c*=uCausScale*k;
  return vec3(clearOf(vec3(xz.x,0.,xz.y)))+1.6*(1.-exp(-c/1.6));
}
// Paper print on a dark stone table. gx and gy say how much ground one pixel covers, which is also how the lens blur gets in.
vec3 ground(vec3 P, vec3 V, vec2 gx, vec2 gy, float blur){
  vec2 q=P.xz-uPrint.xy, hs=uPrint.zw;
  float fw=.5*(length(gx)+length(gy))+blur;
  vec2 dd=abs(q)-hs; float d=length(max(dd,0.))+min(max(dd.x,dd.y),0.);
  float inP=1.-smoothstep(-fw,fw,d);
  vec2 uv=q/(2.*hs)+.5;
  vec2 ux=gx/(2.*hs), uy=gy/(2.*hs);
  vec3 alb;
  if(blur>0.){
    // Out-of-focus paper: four spread taps, each already softened, so the blur stays smooth instead of blocky.
    vec2 o=vec2(blur)/(2.*hs); ux+=vec2(o.x*.7,0.); uy+=vec2(0.,o.y*.7);
    alb=(textureGrad(uTex,uv+o*vec2(.62,.25),ux,uy).rgb+textureGrad(uTex,uv+o*vec2(-.25,.62),ux,uy).rgb+textureGrad(uTex,uv+o*vec2(-.62,-.25),ux,uy).rgb+textureGrad(uTex,uv+o*vec2(.25,-.62),ux,uy).rgb)*.25;
  } else alb=textureGrad(uTex,uv,ux,uy).rgb;
  alb=pow(alb,vec3(2.2));
  float soft=clamp(1.-fw*30.,0.,1.);
  alb*=1.+soft*.035*(vnoise(P.xz*190.)-.5);
  float sp=vnoise(P.xz*2.3)*.25+vnoise(P.xz*23.)*.3+vnoise(P.xz*140.)*.45*soft;
  vec3 slab=vec3(.036,.034,.034)*(.72+.56*sp);
  // The print is mounted on board: its near edge shows, and it throws a thin shadow on the stone.
  float side=(1.-smoothstep(-fw,fw,abs(q.x)-hs.x))*smoothstep(-fw,fw,q.y-hs.y)*(1.-smoothstep(-fw,fw,q.y-hs.y-.036));
  vec2 sq=abs(q-uLight.xz/uLight.y*.045)-hs;
  float thrown=1.-(1.-inP)*(1.-side)*.8*(1.-smoothstep(-.012,.02+fw,length(max(sq,0.))+min(max(sq.x,sq.y),0.)));
  vec3 base=mix(mix(slab,vec3(.5,.49,.46),side),alb,inP);
  vec3 pool=poolOfLight(P.xz,1.+log2(1.+fw*60.));
  vec2 k=P.xz-vec2(.5,-.4);
  float fall=.22+.78*exp(-dot(k,k)*.028);
  // Where the glass comes down on the paper the gap closes and goes dark.
  vec3 po=transpose(uRot)*(P-uPos);
  float foot=length(vec2(max(abs(po.x)-A,0.),po.z))-R;
  float gap=max(-po.y,0.);
  float occ=1.-.5*exp(-gap*22.)*smoothstep(.06,-.03,abs(foot)-.02)-.22*exp(-gap*9.)*smoothstep(.1,-.3,foot);
  vec3 col=base*(vec3(.23,.24,.26)+vec3(1.46,1.4,1.32)*pool*fall*uLight.y)*occ;
  vec3 r=reflect(V,vec3(0.,1.,0.));
  float fr=.04+.96*pow(1.-max(-V.y,0.),5.);
  float rough=mix(.05,.16,inP);
  col+=env(r,rough,rough)*fr*mix(.5,.16,inP)*min(pool.g+.25,1.)*occ;
  col*=mix(.6+.4*smoothstep(-.01,.14+fw,d),1.,max(inP,side))*thrown;
  return col;
}
vec3 glass(vec3 p, vec3 od, vec3 rd, float t, float jit){
  vec3 n=domeNormal(p), nw=uRot*n;
  float c=max(dot(-od,n),0.), F=.043+.957*pow(1.-c,5.);
  vec3 rw=reflect(rd,nw);
  vec3 refl;
  if(rw.y>0.) refl=env(rw,.012,0.);
  else { vec3 wp=uRot*p+uPos; float tt=-wp.y/rw.y; refl=ground(wp+rw*tt,rw,vec2(.12,0.),vec2(0.,.12),0.); }
  float e=.006+t*.0009;
  vec3 tr=vec3(0.);
  for(int i=0;i<6;i++){
    float w=(float(i)+jit)/6., ior=uIor+uSpread*(w-.5);
    vec3 d=refract(od,n,1./ior), o=p; float len, pass; vec3 col=vec3(.01);
    if(through(o,d,ior,len,pass)){
      vec3 wd=uRot*d, wo=uRot*o+uPos;
      if(wd.y<-1e-3){ float tt=-wo.y/wd.y; col=ground(wo+wd*tt,wd,vec2(e,0.),vec2(0.,e),0.); } else col=env(wd,.03,.03);
      col*=exp(-uTint*len)*pass;
    }
    tr+=col*hue(w)/6.;
  }
  // White lettering fired onto the top of the glass, and a ground band where the dome meets its base.
  vec2 luv=vec2(p.x/(2.*(A+R))+.5, p.z/(2.*R)+.5);
  float ink=textureLod(uLabel,luv,max(0.,log2(t*uTan*2./uRes.y*340.))).a;
  float lit=max(dot(nw,uLight),0.);
  tr=mix(tr,vec3(.93,.93,.91)*(.30+1.25*lit),ink*.94);
  float band=smoothstep(.034,.012,p.y);
  tr=mix(tr,tr*.55+vec3(.55,.58,.57)*(.18+.9*lit),band*.7);
  return tr*(1.-F)+refl*F;
}
vec3 ray(vec2 fc){ vec2 s=(fc*2.-uRes)/uRes.y; return normalize(uF+uR*s.x*uTan+uU*s.y*uTan); }
vec3 shade(vec2 fc, float jit){
  vec3 rd=ray(fc);
  float tg=-uCam.y/rd.y;
  mat3 rt=transpose(uRot);
  vec3 oo=rt*(uCam-uPos), od=rt*rd;
  float t=domeNear(squash(oo),squash(od),R);
  if(t>0.&&t<tg){ vec3 p=oo+od*t; if(p.y>0.) return glass(p,od,rd,t,jit); }
  vec3 P=uCam+rd*tg;
  vec3 rx=ray(fc+vec2(1.,0.)), ry=ray(fc+vec2(0.,1.));
  vec2 gx=(uCam+rx*(-uCam.y/rx.y)).xz-P.xz, gy=(uCam+ry*(-uCam.y/ry.y)).xz-P.xz;
  float b=uAper*abs(tg-uFocus)/uFocus;
  return ground(P,rd,gx,gy,b);
}
const vec2 JIT[4]=vec2[4](vec2(.125,.375),vec2(-.375,.125),vec2(.375,-.125),vec2(-.125,-.375));
void main(){
  vec3 rd=ray(gl_FragCoord.xy);
  mat3 rt=transpose(uRot);
  float near=domeNear(squash(rt*(uCam-uPos)),squash(rt*rd),R+.03);
  int n=near>0. ? uAA : 1;
  vec3 col=vec3(0.);
  // Each sample starts its six colours at a different point in the spectrum, so sharp edges fan out smoothly instead of in six steps.
  float dith=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
  for(int s=0;s<4;s++){ if(s>=n) break; col+=shade(gl_FragCoord.xy+(n>1?JIT[s]:vec2(0.)),fract(dith+float(s)*.25+.125)); }
  col/=float(n);
  // With a float buffer the frame is kept unfinished and its too-bright part is noted, so the lens glow can be added before the film curve.
  if(uDirect) frag=vec4(film(col,gl_FragCoord.xy,uRes,uTime),1.);
  else { col=min(col,vec3(30.)); frag=vec4(col,max(dot(col,vec3(.3,.55,.15))-1.5,0.)); }
}`;

// Pass three: lens glow. Smaller copies of the frame spread whatever was brighter than white into a soft halo.
const LENS_FS = `#version 300 es
precision highp float;
uniform sampler2D uScene; uniform vec2 uRes; uniform float uTime;
out vec4 frag;
${FILM}
vec3 halo(vec2 uv, float lod){
  vec2 px=exp2(lod)/uRes*.75; vec4 c=vec4(0.);
  c+=textureLod(uScene,uv+px*vec2(1.,.4),lod); c+=textureLod(uScene,uv+px*vec2(-.4,1.),lod);
  c+=textureLod(uScene,uv+px*vec2(-1.,-.4),lod); c+=textureLod(uScene,uv+px*vec2(.4,-1.),lod);
  c*=.25;
  return c.rgb*c.a/(dot(c.rgb,vec3(.3,.55,.15))+.02);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec3 col=textureLod(uScene,uv,0.).rgb;
  float k=log2(uRes.y/700.);
  col+=halo(uv,1.5+k)*.22+halo(uv,3.+k)*.2+halo(uv,4.5+k)*.16;
  frag=vec4(film(col,gl_FragCoord.xy,uRes,uTime),1.);
}`;

type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

export default function RayTracedGlassCabochonButton() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [live, setLive] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = root.current, cv = canvas.current, img = photo.current, btn = button.current;
    if (!el || !cv || !img || !btn) return;
    const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const compile = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const link = (vs: string, fs: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
      const at = new Map<string, WebGLUniformLocation | null>();
      return { p, u: (n: string) => { if (!at.has(n)) at.set(n, gl.getUniformLocation(p, n)); return at.get(n)!; } };
    };
    const caus = link(CAUSTIC_VS, CAUSTIC_FS), scene = link(SCENE_VS, SCENE_FS), lens = link(SCENE_VS, LENS_FS);
    if (!caus || !scene || !lens) return;

    // The print: the photograph with a white margin and its type, painted once to a canvas and used as the paper's surface.
    const TW = 2048, TH = 1366;
    const sheet = document.createElement("canvas"); sheet.width = TW; sheet.height = TH;
    const paintPrint = (withPhoto: boolean) => {
      const x = sheet.getContext("2d")! as CanvasRenderingContext2D & { letterSpacing: string };
      const m = 72, w = TW - m * 2, h = TH - m * 2;
      x.globalAlpha = 1; x.fillStyle = "#f3f0e8"; x.fillRect(0, 0, TW, TH);
      const g = x.createLinearGradient(m, 0, TW - m, 0);
      g.addColorStop(0, "#1c6fb4"); g.addColorStop(0.3, "#1c6fb4"); g.addColorStop(0.36, "#e9b616"); g.addColorStop(1, "#e2a80f");
      x.fillStyle = g; x.fillRect(m, m, w, h);
      const word = document.createElement("canvas"); word.width = TW; word.height = TH;
      const wx = word.getContext("2d")! as CanvasRenderingContext2D & { letterSpacing: string };
      wx.fillStyle = "#fbf8f1"; wx.textBaseline = "alphabetic"; wx.letterSpacing = "-9px"; wx.font = `400 ${MAST_SIZE}px ${SERIF}`;
      wx.fillText(MASTHEAD, m + 44, m + MAST_SIZE * 0.98);
      if (withPhoto) {
        const sc = Math.max(w / img.naturalWidth, h / img.naturalHeight), dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
        x.save(); x.beginPath(); x.rect(m, m, w, h); x.clip();
        x.drawImage(img, m + (w - dw) / 2, m + (h - dh) / 2, dw, dh);
        x.restore();
        // A quarter-size copy is keyed on the yellow wall and blue cloth, so the masthead prints on the backdrop and passes behind the head.
        const kw = Math.round(w / 4), kh = Math.round(h / 4);
        const key = document.createElement("canvas"); key.width = kw; key.height = kh;
        const kx = key.getContext("2d", { willReadFrequently: true })!;
        kx.drawImage(sheet, m, m, w, h, 0, 0, kw, kh);
        const px = kx.getImageData(0, 0, kw, kh), d = px.data;
        const sm = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i] + 1, gg = d[i + 1], b = d[i + 2], mx = Math.max(r, gg, b), sat = (mx - Math.min(r, gg, b)) / mx;
          const wall = sm(0.42, 0.28, b / r) * sm(0.56, 0.66, gg / r), cloth = sm(1.15, 1.5, b / r) * sm(0.35, 0.55, sat);
          d[i + 3] = 255 * Math.max(sm(HEAD_FROM + 0.02, HEAD_FROM - 0.02, ((i >> 2) % kw) / kw), sm(0.4, 0.8, Math.min(1, wall + cloth)));
        }
        kx.putImageData(px, 0, 0);
        wx.globalCompositeOperation = "destination-in"; wx.imageSmoothingQuality = "high";
        wx.drawImage(key, m, m, w, h);
      }
      x.drawImage(word, 0, 0);
      x.fillStyle = "#fbf8f1"; x.textBaseline = "alphabetic"; x.letterSpacing = "6px"; x.font = `600 25px ${GROTESK}`;
      x.fillText(FOLIO[0].toUpperCase(), m + 62, m + MAST_SIZE * 0.98 + 78);
      x.globalAlpha = 0.8; x.fillText(FOLIO[1].toUpperCase(), m + 62, m + MAST_SIZE * 0.98 + 116); x.globalAlpha = 1;
      // Plate marks in the white margin, the way a lab labels a print.
      x.fillStyle = "#2a2926"; x.letterSpacing = "5px"; x.font = `600 23px ${GROTESK}`; x.textBaseline = "middle";
      x.textAlign = "center"; x.fillText(CAPTION.toUpperCase(), m + w * SPOT.u, TH - m / 2 + 1);
      x.textAlign = "right"; x.fillText(`${MASTHEAD} ${FOLIO[0]}`.toUpperCase(), TW - m, TH - m / 2 + 1); x.textAlign = "left";
      x.save(); x.translate(m / 2, TH - m - 40); x.rotate(-Math.PI / 2); x.fillText(PLATE.toUpperCase(), 0, 1); x.restore();
    };
    // The lettering on the glass, as a mask.
    const LW = 1200, LH = 400;
    const paintLabel = () => {
      const c = document.createElement("canvas"); c.width = LW; c.height = LH;
      const x = c.getContext("2d")! as CanvasRenderingContext2D & { letterSpacing: string };
      x.letterSpacing = "-2.5px"; x.font = `600 104px ${GROTESK}`; x.textBaseline = "middle"; x.fillStyle = "#fff";
      const w = x.measureText(LABEL).width, gap = 34, arrow = 74, x0 = (LW - (w + gap + arrow)) / 2;
      x.fillText(LABEL, x0, LH / 2 + 5);
      const ax = x0 + w + gap, ay = LH / 2 + 3;
      x.lineWidth = 11; x.lineCap = "round"; x.lineJoin = "round"; x.strokeStyle = "#fff";
      x.beginPath(); x.moveTo(ax, ay); x.lineTo(ax + arrow, ay); x.moveTo(ax + arrow - 28, ay - 28); x.lineTo(ax + arrow, ay); x.lineTo(ax + arrow - 28, ay + 28); x.stroke();
      return c;
    };

    const tex = (unit_: number, src: TexImageSource) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit_); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const an = gl.getExtension("EXT_texture_filter_anisotropic");
      if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, 8);
      return t;
    };
    let printTex: WebGLTexture | null = null;
    const loadPrint = () => {
      if (printTex) gl.deleteTexture(printTex);
      // A photo host that forbids pixel reads throws here; the print then keeps its two flat colour fields.
      try { paintPrint(img.complete && img.naturalWidth > 0); printTex = tex(0, sheet); }
      catch { paintPrint(false); printTex = tex(0, sheet); }
    };
    loadPrint();
    tex(1, paintLabel());

    // The light map the first pass draws into. Half-float where the browser allows it, so bright focus lines keep their headroom.
    const MW = 768, MH = 512;
    const float = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
    const mapScale = float ? 1 : 0.16;
    const map = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, map);
    if (float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, MW, MH, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, MW, MH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, map, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) { gl.bindFramebuffer(gl.FRAMEBUFFER, null); return; }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // The unfinished frame, kept in a float buffer for the lens glow. Without float buffers the scene pass finishes the picture itself.
    const shot = float ? gl.createTexture() : null, shotFbo = float ? gl.createFramebuffer() : null;
    let shotW = 0, shotH = 0;
    const fitShot = () => {
      if (!shot || (shotW === W && shotH === Hh)) return;
      shotW = W; shotH = Hh;
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, shot);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, W, Hh, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, shotFbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shot, 0);
    };

    const GX = 320, GY = 128;
    const pts = new Float32Array((GX + 1) * (GY + 1) * 2), idx = new Uint32Array(GX * GY * 6);
    for (let j = 0, k = 0; j <= GY; j++) for (let i = 0; i <= GX; i++) { pts[k++] = i / GX; pts[k++] = j / GY; }
    for (let j = 0, k = 0; j < GY; j++) for (let i = 0; i < GX; i++) { const a = j * (GX + 1) + i, b = a + GX + 1; idx[k++] = a; idx[k++] = a + 1; idx[k++] = b; idx[k++] = a + 1; idx[k++] = b + 1; idx[k++] = b; }
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, pts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    const plain = gl.createVertexArray();

    // The same spectrum the scene shader uses, cut into six slices that add up to white.
    const tri = (t: number, c: number, w: number) => Math.max(0, 1 - Math.abs(t - c) / w);
    const BANDS = Array.from({ length: 6 }, (_, i) => { const t = (i + 0.5) / 6; return [t, [(tri(t, 0.08, 0.42) + 0.35 * tri(t, 1, 0.2)) / 0.317 / 6, tri(t, 0.5, 0.36) / 0.36 / 6, tri(t, 0.85, 0.38) / 0.31 / 6]] as [number, number[]]; });
    const LIGHT = unit(LAMP);
    const printD = PRINT_WIDTH * TH / TW;
    const print = [PRINT_WIDTH * (0.5 - SPOT.u), printD * (0.5 - SPOT.v), PRINT_WIDTH / 2, printD / 2];
    const TAN = Math.tan((13.5 * Math.PI) / 180);

    // y is height above the paper; tilt and lean are the two ways it can rock, yaw is the twist it picks up when it lands off-centre.
    const s = { y: HOVER, vy: 0, tilt: 0, vt: 0, lean: 0, vl: 0, yaw: 0, vw: 0, held: false, tx: 0, tz: 0, px: 0, pz: 0, cx: 0, cz: 0 };
    let W = 0, Hh = 0, quality = 1, aa = 4, raf = 0, last = 0, start = 0, seen = true, touched = -1e9, nextDemo = 3300, demoUp = 0, slow = 0;

    const size = () => {
      const b = el.getBoundingClientRect();
      const k = Math.min(Math.max(window.devicePixelRatio || 1, 0.5), 1.5) * quality;
      W = Math.max(2, Math.round(b.width * k)); Hh = Math.max(2, Math.round(b.height * k));
      if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; }
    };

    const draw = (time: number) => {
      const asp = W / Hh;
      // Longer lens and a further camera on tall screens, so the glass keeps its share of the frame.
      const frac = Math.min(0.8, Math.max(0.4, 0.97 - 0.3 * asp));
      const dist = (2 * (A + R)) / (2 * TAN * asp * frac);
      // Tall screens look down more steeply, so the print fills the height instead of leaving bare table.
      const el0 = ((asp > 1.2 ? 50 : 54) * Math.PI) / 180 - s.cz * 0.035, az = s.cx * 0.05;
      const target: V3 = [asp > 1.2 ? 0.6 : 0.1, 0.1, asp > 1.2 ? -0.72 : -0.55];
      const cam: V3 = [target[0] + dist * Math.cos(el0) * Math.sin(az), target[1] + dist * Math.sin(el0), target[2] + dist * Math.cos(el0) * Math.cos(az)];
      const F = unit(sub(target, cam)), Rv = unit(cross(F, [0, 1, 0])), U = cross(Rv, F);

      // Rocking lifts the middle, because a flat base can only pivot on its own edge.
      const lift = Math.max(0, s.y) + Math.abs(Math.sin(s.tilt)) * (A + R) + Math.abs(Math.sin(s.lean)) * R;
      const pos: V3 = [0, lift, 0];
      const cy = Math.cos(s.yaw), sy = Math.sin(s.yaw), ct = Math.cos(s.tilt), st = Math.sin(s.tilt), cl = Math.cos(s.lean), sl = Math.sin(s.lean);
      // Column-major: turn about the vertical, then tilt end to end, then lean side to side.
      const rz = [ct, st, 0, -st, ct, 0, 0, 0, 1], rx = [1, 0, 0, 0, cl, sl, 0, -sl, cl], ry = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
      const mul = (a: number[], b: number[]) => { const o = new Array(9).fill(0); for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) o[c * 3 + r] += a[k * 3 + r] * b[c * 3 + k]; return o; };
      const rot = mul(ry, mul(rz, rx));

      const off = (lift + H * 0.4) / LIGHT[1];
      const cs = [5.1, 3.4], co = [-LIGHT[0] * off - cs[0] / 2, -LIGHT[2] * off - cs[1] / 2];

      // Light map: six slices of the spectrum, each bent a little differently and added together.
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, MW, MH);
      gl.clearColor(0, 0, 0, 1); gl.colorMask(true, true, true, true); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(caus.p); gl.bindVertexArray(vao);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.uniform3fv(caus.u("uPos"), pos); gl.uniformMatrix3fv(caus.u("uRot"), false, rot);
      gl.uniform2fv(caus.u("uCausO"), co); gl.uniform2fv(caus.u("uCausS"), cs); gl.uniform3fv(caus.u("uLight"), LIGHT);
      gl.uniform1f(caus.u("uCell"), (cs[0] / MW) * (cs[1] / MH)); gl.uniform1f(caus.u("uScale"), mapScale); gl.uniform1i(caus.u("uLabel"), 1);
      for (const [w, hue] of BANDS) {
        gl.uniform1f(caus.u("uIor"), IOR + SPREAD * (w - 0.5)); gl.uniform3fv(caus.u("uHue"), hue);
        gl.uniform1f(caus.u("uSoak"), (TINT[0] * hue[0] + TINT[1] * hue[1] + TINT[2] * hue[2]) / (hue[0] + hue[1] + hue[2]));
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);
      }
      gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, map); gl.generateMipmap(gl.TEXTURE_2D);

      fitShot();
      gl.bindFramebuffer(gl.FRAMEBUFFER, shotFbo); gl.viewport(0, 0, W, Hh);
      gl.useProgram(scene.p); gl.bindVertexArray(plain); gl.uniform1i(scene.u("uDirect"), shot ? 0 : 1);
      gl.uniform2f(scene.u("uRes"), W, Hh); gl.uniform1f(scene.u("uTime"), time); gl.uniform1f(scene.u("uTan"), TAN);
      gl.uniform1f(scene.u("uFocus"), dist); gl.uniform1f(scene.u("uAper"), 0.1); gl.uniform1f(scene.u("uCausScale"), 1 / mapScale);
      gl.uniform1f(scene.u("uIor"), IOR); gl.uniform1f(scene.u("uSpread"), SPREAD); gl.uniform1i(scene.u("uAA"), aa);
      gl.uniform3fv(scene.u("uCam"), cam); gl.uniform3fv(scene.u("uF"), F); gl.uniform3fv(scene.u("uR"), Rv); gl.uniform3fv(scene.u("uU"), U);
      gl.uniform3fv(scene.u("uLight"), LIGHT); gl.uniform3fv(scene.u("uTint"), TINT);
      gl.uniform3fv(scene.u("uPos"), pos); gl.uniformMatrix3fv(scene.u("uRot"), false, rot);
      gl.uniform4fv(scene.u("uPrint"), print); gl.uniform2fv(scene.u("uCausO"), co); gl.uniform2fv(scene.u("uCausS"), cs);
      gl.uniform1i(scene.u("uTex"), 0); gl.uniform1i(scene.u("uLabel"), 1); gl.uniform1i(scene.u("uCaus"), 2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (shot) {
        gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, shot); gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(lens.p); gl.uniform1i(lens.u("uScene"), 3); gl.uniform2f(lens.u("uRes"), W, Hh); gl.uniform1f(lens.u("uTime"), time);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      // Keep the real button exactly over the glass, so focus, taps and screen readers land on it.
      const b = el.getBoundingClientRect();
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [px, pz] of [[-(A + R), 0], [A + R, 0], [0, -R], [0, R], [-A, -R], [A, -R], [-A, R], [A, R]]) {
        const v = sub([px, lift + H * 0.5, pz], cam), z = dot(v, F);
        const sx = (dot(v, Rv) / (z * TAN * asp) + 1) * 0.5 * b.width, sy2 = (1 - dot(v, U) / (z * TAN)) * 0.5 * b.height;
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy2); y1 = Math.max(y1, sy2);
      }
      btn.style.left = `${x0.toFixed(1)}px`; btn.style.top = `${(y0 - 6).toFixed(1)}px`; btn.style.width = `${(x1 - x0).toFixed(1)}px`; btn.style.height = `${(y1 - y0 + 12).toFixed(1)}px`;
    };

    const step = (dt: number, t: number) => {
      if (s.held) s.vy -= 40 * dt; // a finger: one steady push, so it gathers speed all the way down
      else { const goal = HOVER + (reduce ? 0 : 0.018 * Math.sin(t / 1400)); s.vy += (140 * (goal - s.y) - 8.2 * s.vy) * dt; } // let go: it floats back up and overshoots once
      s.y += s.vy * dt;
      if (s.y < 0) {
        // It lands on the paper: most of the speed is lost and the rest goes into rocking on its edges.
        const hit = -s.vy; s.y = 0; s.vy = hit > 0.9 ? hit * 0.2 : 0;
        if (hit > 0.9) { s.vt += (s.px >= 0 ? 1 : -1) * (0.3 + 0.5 * Math.abs(s.px)) * hit * 0.55; s.vl += (s.pz >= 0 ? 1 : -1) * (0.3 + 0.5 * Math.abs(s.pz)) * hit * 0.5; s.vw += s.px * hit * 0.1; }
      }
      const idle = t - touched > 2600 && !reduce;
      const down = s.y < 0.012;
      const tt = down ? 0 : s.tx + (idle ? 0.022 * Math.sin(t / 2300) : 0);
      const tl = down ? 0 : s.tz + (idle ? 0.045 * Math.sin(t / 3100 + 1) : 0);
      // On the paper it rattles quickly and dies out; in the air it sways slowly.
      const k = down ? 360 : 120, c = down ? 5 : 7;
      s.vt += (k * (tt - s.tilt) - c * s.vt) * dt; s.tilt += s.vt * dt;
      s.vl += (k * 1.5 * (tl - s.lean) - c * 1.2 * s.vl) * dt; s.lean += s.vl * dt;
      s.vw += (70 * ((reduce ? 0 : 0.035 * Math.sin(t / 4700)) - s.yaw) - 6 * s.vw) * dt; s.yaw += s.vw * dt;
      const ease = Math.min(1, dt * 3);
      s.cx += ((idle ? 0.5 * Math.sin(t / 5200) : s.tx * 14) - s.cx) * ease; s.cz += ((idle ? 0.4 * Math.sin(t / 6100) : s.tz * 9) - s.cz) * ease;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!start) { start = now; last = now; }
      const raw = now - last, dt = Math.min(0.032, raw / 1000); last = now;
      const t = now - start;
      if (t - touched > 2600) {
        if (t > nextDemo && !s.held) { s.held = true; s.px = 0.5; s.pz = 0.4; demoUp = t + 300; nextDemo = t + 5200; }
        if (demoUp && t > demoUp) { demoUp = 0; s.held = false; s.vt -= 0.25; s.vl -= 0.3; }
      }
      // Four small steps keep the landing and the rattle stable at low frame rates.
      for (let i = 0; i < 4; i++) step(dt / 4, t);
      size(); draw(t / 1000);
      // If frames run long, first drop the extra samples on the glass, then the resolution.
      if (t > 1500) { slow = raw > 24 ? slow + 1 : Math.max(0, slow - 0.25); if (slow > 24) { slow = 0; if (aa > 2) aa = 2; else if (quality > 0.6) quality *= 0.85; else aa = 1; } }
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => { size(); draw(0); };
    const wake = () => { if (reduce) { still(); return; } if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    still(); setLive(true); wake();
    const onPhoto = () => { loadPrint(); if (reduce) still(); };
    if (!(img.complete && img.naturalWidth > 0)) img.addEventListener("load", onPhoto);

    const mark = () => { touched = start ? performance.now() - start : 0; demoUp = 0; };
    const onMove = (e: PointerEvent) => {
      const b = btn.getBoundingClientRect(), r = el.getBoundingClientRect();
      const dx = (e.clientX - (b.left + b.width / 2)) / r.width, dz = (e.clientY - (b.top + b.height / 2)) / r.height;
      s.tx = Math.max(-0.045, Math.min(0.045, -dx * 0.1)); s.tz = Math.max(-0.11, Math.min(0.11, dz * 0.28));
      mark(); if (reduce) { s.tilt = s.tx; s.lean = s.tz; still(); }
    };
    const down = (px: number, pz: number) => { mark(); s.held = true; s.px = px; s.pz = pz; if (reduce) { s.y = 0; s.tilt = 0; s.lean = 0; still(); } };
    const up = () => { if (!s.held) return; mark(); s.held = false; s.vt -= s.px * 0.5; s.vl -= s.pz * 0.7; if (reduce) { s.y = HOVER; s.vt = 0; s.vl = 0; still(); } };
    const onDown = (e: PointerEvent) => { const b = btn.getBoundingClientRect(); down(((e.clientX - b.left) / b.width) * 2 - 1, ((e.clientY - b.top) / b.height) * 2 - 1); };
    const onKeyDown = (e: KeyboardEvent) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) down(0.4, 0.3); };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === " " || e.key === "Enter") up(); };
    const onLeave = () => { s.tx = 0; s.tz = 0; };
    const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); raf = -1; for (const k of ["left", "top", "width", "height"]) btn.style.removeProperty(k); setLive(false); };
    el.addEventListener("pointermove", onMove); el.addEventListener("pointerleave", onLeave);
    btn.addEventListener("pointerdown", onDown); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    btn.addEventListener("keydown", onKeyDown); btn.addEventListener("keyup", onKeyUp); btn.addEventListener("blur", up);
    cv.addEventListener("webglcontextlost", onLost);
    const ro = new ResizeObserver(() => { if (reduce || !raf) still(); });
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen && raf !== -1) wake(); });
    io.observe(el);
    const onVis = () => { if (!document.hidden && raf !== -1) wake(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      img.removeEventListener("load", onPhoto);
      el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerleave", onLeave);
      btn.removeEventListener("pointerdown", onDown); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      btn.removeEventListener("keydown", onKeyDown); btn.removeEventListener("keyup", onKeyUp); btn.removeEventListener("blur", up);
      cv.removeEventListener("webglcontextlost", onLost);
      gl.getExtension("WEBGL_lose_context")?.loseContext(); // hand the textures and buffers back at once
      ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={root} className="relative h-[620px] w-full overflow-hidden bg-[#0b0b0c] sm:h-[700px]">
      {/* Shown until the traced picture is ready, and kept when the browser cannot trace it: the same print and glass, built from plain layers. */}
      <div aria-hidden={live} className={`absolute inset-0 ${live ? "opacity-0" : "opacity-100"}`} style={{ perspective: "1500px", perspectiveOrigin: "50% 30%" }}>
        <div className="absolute left-0 top-[46%] w-[172%] max-w-none [transform:translate(-1%,-50%)_rotateX(30deg)] sm:left-1/2 sm:top-[46%] sm:w-[112%] sm:[transform:translate(-27%,-50%)_rotateX(38deg)]">
          <div className="relative bg-[#f3f0e8] p-[3.4%] shadow-[0_60px_90px_rgba(0,0,0,0.7)]">
            <div className="relative aspect-[3/2] overflow-hidden bg-[#e2a80f]">
              <img ref={photo} src={PHOTO} alt={PHOTO_ALT} crossOrigin="anonymous" width={1600} height={1067} className="absolute inset-0 h-full w-full object-cover" />
              <p className="absolute left-[2.5%] top-[2%] text-[23vw] leading-none tracking-[-0.035em] text-[#fbf8f1] sm:text-[14.5vw]" style={{ fontFamily: SERIF }}>{MASTHEAD}</p>
              <p className="absolute left-[3.4%] top-[25.5%] text-[2.6vw] font-semibold uppercase leading-[1.7] tracking-[0.22em] text-[#fbf8f1] sm:text-[1.25vw]" style={{ fontFamily: GROTESK }}>{FOLIO[0]}<br />{FOLIO[1]}</p>
              <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/20" />
            </div>
          </div>
        </div>
        <div className="absolute left-1/2 top-[53%] h-[88px] w-[290px] -translate-x-1/2 -translate-y-1/2 sm:left-[40.6%] sm:top-[60%] sm:h-[140px] sm:w-[540px]">
          <span className="absolute inset-x-4 -bottom-7 h-10 translate-x-6 rounded-full bg-black/55 blur-xl" />
          <span className="absolute inset-0 rounded-full border border-white/45 bg-[#0a1a3a]/25 shadow-[inset_0_14px_20px_-6px_rgba(255,255,255,0.5),inset_0_-30px_26px_-12px_rgba(255,255,255,0.75),inset_0_-3px_0_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(10,20,40,0.35),0_14px_26px_rgba(0,0,0,0.4)] backdrop-blur-[5px] backdrop-brightness-90 backdrop-saturate-150" />
          <span className="absolute inset-x-[9%] top-[7%] h-[9%] rounded-full bg-gradient-to-b from-white/75 to-white/0 blur-[1.5px]" />
        </div>
      </div>

      <canvas ref={canvas} role="img" aria-label={`${PHOTO_ALT}, printed with a white margin and lying on a dark table under a bar of clear glass.`} className={`absolute inset-0 h-full w-full ${live ? "opacity-100" : "opacity-0"}`} />

      <h2 className="sr-only">{MASTHEAD}. {FOLIO.join(". ")}. {CAPTION}</h2>
      <button
        ref={button}
        type="button"
        onClick={() => setCount((c) => c + 1)}
        style={{ fontFamily: GROTESK }}
        className={`absolute left-1/2 top-[53%] flex h-[88px] w-[290px] touch-manipulation select-none items-center justify-center gap-3 rounded-full text-[22px] font-semibold tracking-[-0.02em] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 sm:left-[40.6%] sm:top-[60%] sm:h-[140px] sm:w-[540px] sm:text-[38px] ${live ? "text-transparent" : "-translate-x-1/2 -translate-y-[62%] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]"}`}
      >
        {LABEL}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 sm:h-9 sm:w-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16M13 5l7 7-7 7" /></svg>
      </button>

      <p className="sr-only" aria-live="polite">{count > 0 ? `Issue 14 opened ${count} ${count === 1 ? "time" : "times"}.` : ""}</p>
    </div>
  );
}
