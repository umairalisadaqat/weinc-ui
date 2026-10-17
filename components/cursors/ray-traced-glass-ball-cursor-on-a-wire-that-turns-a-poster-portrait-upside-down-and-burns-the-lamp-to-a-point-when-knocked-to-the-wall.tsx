import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const MASTHEAD = "Verso";
const FOLIO = ["No. 08", "The upside-down issue"];
const CAPTION = "Carry the glass across her. Press, and it swings at the wall.";
const PHOTO = "https://images.pexels.com/photos/10198110/pexels-photo-10198110.jpeg?auto=compress&cs=tinysrgb&w=1600";
const PHOTO_ALT = "Portrait of a young woman in an oversized white shirt framing her chin with both hands against a deep green backdrop";
const FACE = { u: 0.51, v: 0.36 }; // where her face is in the photograph (0 to 1 across, 0 to 1 down)
const BALL = 0.62; // radius of the glass; the frame is 6 tall
const GAP = 4.4; // how far the glass hangs off the wall, in ball radii; under 1.5 the picture inside stands upright
const IOR = 1.43; // how strongly the glass bends light
const SPREAD = 0.075; // how far red and violet separate; 0 is colourless glass
const TINT = [0.05, 0.012, 0.03]; // what the glass absorbs per unit of thickness (red, green, blue)
const LAMP: [number, number, number] = [-0.68, 0.47, 0.56]; // where the lamp stands: left, up, towards the camera
const VIEW_FROM = 10; // degrees the camera stands to the right of square-on
const REST = { x: 0, y: 0.3 }; // where the glass waits, measured from her face (the frame is 6 tall)
const ROAM = { x: 3, y: 1.05, seconds: 19 }; // the figure of eight it wanders when nobody is steering
const KNOCK_EVERY = 8200; // milliseconds between the knocks it gives itself
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

// Pass one: a disc of lamp rays is pushed through the ball and drawn where it lands on the wall. Where the disc bunches up the wall gets brighter.
const CAUSTIC_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aG;
uniform vec3 uC, uLight, uE1, uE2; uniform float uR, uIor; uniform vec2 uCausO, uCausS;
out vec2 vOld; out float vGain; out float vOk;
void main(){
  float r=aG.x*.9995, a=aG.y*6.2831853;
  vec3 n=r*cos(a)*uE1+r*sin(a)*uE2+sqrt(1.-r*r)*uLight;
  vec3 p=uC+uR*n, rd=-uLight;
  vec3 land=p+rd*(p.z/uLight.z);
  vOld=land.xy; vOk=0.; vGain=0.;
  float f=.043+.957*pow(1.-dot(uLight,n),5.);
  vec3 d=refract(rd,n,1./uIor);
  vec3 p2=p+d*(-2.*dot(d,n)*uR), n2=(p2-uC)/uR;
  vec3 o=refract(d,-n2,uIor);
  if(dot(o,o)>0.&&o.z<-.04){
    float f2=.043+.957*pow(1.-max(dot(o,n2),0.),5.);
    land=p2+o*(-p2.z/o.z); vGain=(1.-f)*(1.-f2); vOk=1.;
  }
  gl_Position=vec4((land.xy-uCausO)/uCausS*2.-1.,0.,1.);
}`;
const CAUSTIC_FS = `#version 300 es
precision highp float;
in vec2 vOld; in float vGain; in float vOk;
uniform float uCell, uScale, uCap; uniform vec3 uHue;
out vec4 o;
void main(){
  if(vOk<.999) discard;
  vec2 dx=dFdx(vOld), dy=dFdy(vOld);
  float bunch=abs(dx.x*dy.y-dx.y*dy.x)/uCell;
  o=vec4(uHue*(min(bunch,uCap)*vGain*uScale),1.);
}`;

// The camera's last touches, shared by both ways of finishing a frame: darker corners, a film curve and grain.
const FILM = `
vec3 film(vec3 col, vec2 fc, vec2 res, float time){
  vec2 v=fc/res-.5;
  col*=(1.-dot(v,v)*.9)*1.18;
  col=clamp((col*(2.51*col+.03))/(col*(2.43*col+.59)+.14),0.,1.);
  col=pow(col,vec3(1./2.2));
  vec2 g=fract(fc*vec2(.1234,.4562)+fract(time)*7.13); g+=dot(g,g+45.32);
  return col+(fract(g.x*g.y)-.5)*.022;
}`;
const SCENE_VS = `#version 300 es
void main(){ vec2 p=vec2(gl_VertexID==1?3.:-1., gl_VertexID==2?3.:-1.); gl_Position=vec4(p,0.,1.); }`;
// Pass two: the picture. One ray per pixel on the wall, four on the glass, each split into six colours inside it.
const SCENE_FS = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uTime, uTan, uFocus, uAper, uCausScale, uIor, uSpread, uR; uniform int uAA;
uniform vec3 uCam, uF, uRt, uU, uLight, uTint, uC, uTop;
uniform vec4 uPrint, uBand; uniform vec2 uCausO, uCausS;
uniform sampler2D uTex, uCaus; uniform bool uDirect;
out vec4 frag;
${FILM}
const float LAMP=.021, WIRE=.0085;
// Colour of one slice of the spectrum, 0 at red to 1 at violet, scaled so the whole run adds up to white.
vec3 hue(float t){ return vec3((max(0.,1.-abs(t-.08)/.42)+.35*max(0.,1.-abs(t-1.)/.2))/.317, max(0.,1.-abs(t-.5)/.36)/.36, max(0.,1.-abs(t-.85)/.38)/.31); }
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float card(vec2 p, vec2 c, vec2 h, float s){ vec2 q=abs(p-c)-h; float d=length(max(q,0.))+min(max(q.x,q.y),0.); return 1.-smoothstep(-s,s,d); }
// The room behind the camera: a tall window where the lamp stands (its glazing bars show in the glass), a cool strip to the right,
// a warm floor and a dim ceiling. s spreads them for rough surfaces.
vec3 room(vec3 d, float s){
  vec3 c=mix(vec3(.16,.13,.1),vec3(.07,.075,.085),smoothstep(-.6,.5,d.y));
  if(d.z>.02){
    vec2 p=d.xy/d.z, w=uLight.xy/uLight.z, h=vec2(.34,.52);
    float pane=card(p,w,h,.012+s);
    vec2 g=(p-w)/h;
    float bars=smoothstep(.0,.05+s*2.,abs(abs(g.x)-.34))*smoothstep(.0,.035+s*2.,abs(g.y))*smoothstep(.0,.035+s*2.,abs(abs(g.y)-.5));
    c+=vec3(.86,.93,1.)*7.*pane*mix(1.,bars,1./(1.+s*30.));
    float sr=.03+s*1.5; c+=vec3(1.,.93,.8)*(.07/(sr*sr))*smoothstep(sr,sr*.5,length(p-w-vec2(.0,.13)));
  }
  if(d.x>.02){ vec2 p=d.zy/d.x; c+=vec3(.62,.78,1.)*2.6*card(p,vec2(.5,.1),vec2(.1,1.1),.05+s); }
  if(d.x<-.02){ vec2 p=d.zy/-d.x; c+=vec3(1.,.8,.62)*.7*card(p,vec2(-.2,-.3),vec2(.5,.5),.4+s); }
  return c;
}
// How much of the lamp a point on the wall can see past the ball, its brass cap and its wire.
float clearOf(vec3 P){
  vec3 pc=uC-P; float a=dot(pc,uLight), m=length(pc-uLight*a)-uR, w=max(a,0.)*LAMP+.003;
  float ball=smoothstep(-w,w,m);
  vec3 up=normalize(uTop-uC), A=uC+up*uR, B=uTop;
  vec2 sa=A.xy-uLight.xy*(A.z/uLight.z), sb=B.xy-uLight.xy*(B.z/uLight.z), ab=sb-sa, ap=P.xy-sa;
  float h=clamp(dot(ap,ab)/dot(ab,ab),0.,1.), dist=length(ap-ab*h);
  float pw=(A.z/uLight.z)*LAMP+.002;
  float wire=1.-min(1.,WIRE/pw)*smoothstep(pw+WIRE,max(pw-WIRE,0.),dist)*.9;
  float capd=length(ap-ab*clamp(dot(ap,ab)/dot(ab,ab),0.,.13/length(ab)));
  float cap=smoothstep(.07-pw,.07+pw,capd);
  return ball*wire*cap;
}
vec3 poolOfLight(vec3 P, float lod){
  float clear=clearOf(P);
  vec2 uv=(P.xy-uCausO)/uCausS;
  vec2 e=smoothstep(vec2(0.),vec2(.06),uv)*smoothstep(vec2(0.),vec2(.06),1.-uv);
  float k=e.x*e.y; if(k<=0.) return vec3(clear);
  vec2 px=exp2(lod)/vec2(textureSize(uCaus,0));
  vec3 c=textureLod(uCaus,uv,lod).rgb*.4+(textureLod(uCaus,uv+px*vec2(.7,.3),lod).rgb+textureLod(uCaus,uv+px*vec2(-.3,.7),lod).rgb+textureLod(uCaus,uv+px*vec2(-.7,-.3),lod).rgb+textureLod(uCaus,uv+px*vec2(.3,-.7),lod).rgb)*.15;
  c*=uCausScale*k;
  return vec3(clear)+90.*(1.-exp(-c/90.));
}
// The poster, pasted to the wall. gx and gy say how much wall one pixel covers; blur is the lens being focused on the glass, not the wall.
vec3 wall(vec3 P, vec3 V, vec2 gx, vec2 gy, float blur, float fine){
  vec2 hs=uPrint.zw, q=P.xy-uPrint.xy;
  vec2 uv=vec2(q.x/(2.*hs.x)+.5,.5-q.y/(2.*hs.y));
  vec2 ux=vec2(gx.x,-gx.y)/(2.*hs), uy=vec2(gy.x,-gy.y)/(2.*hs);
  vec3 alb;
  if(blur>0.){
    vec2 o=vec2(blur,-blur)/(2.*hs); ux+=vec2(o.x*.45,0.); uy+=vec2(0.,o.y*.45);
    alb=textureGrad(uTex,uv,ux,uy).rgb*.16;
    for(int i=0;i<6;i++){ float a=float(i)*1.0472+.4; alb+=textureGrad(uTex,uv+o*vec2(cos(a),sin(a))*.72,ux,uy).rgb*.14; }
  } else alb=textureGrad(uTex,uv,ux,uy).rgb;
  alb=pow(alb,vec3(2.2));
  // Past the edge of the poster the wall is bare plaster: the camera never sees it, the glass does.
  vec2 pe=abs(q)-hs; float edge=.5*(length(gx)+length(gy))+blur+.004;
  alb=mix(alb,vec3(.6,.57,.52),smoothstep(-edge,edge,max(pe.x,pe.y)));
  // Paste wrinkles and the lap where two sheets meet: slopes in the paper that the raking lamp picks out.
  vec3 n=vec3(0.,0.,1.);
  if(fine>0.){
    vec2 w=P.xy*vec2(.55,1.7); float e=.06;
    float h0=vnoise(w)+.35*vnoise(w*3.1+7.), hx=vnoise(w+vec2(e,0.))+.35*vnoise((w+vec2(e,0.))*3.1+7.), hy=vnoise(w+vec2(0.,e))+.35*vnoise((w+vec2(0.,e))*3.1+7.);
    n=normalize(vec3(-(hx-h0)/e*.03*fine,-(hy-h0)/e*.03*fine,1.));
    alb*=1.+.05*(vnoise(P.xy*150.)-.5)*fine;
  }
  float diff=max(dot(n,uLight),0.)/uLight.z;
  vec3 pool=poolOfLight(P,1.+log2(1.+(.5*(length(gx)+length(gy))+blur)*90.));
  vec2 k=P.xy-vec2(-1.3,1.);
  // The sun comes in through a side window, so it crosses the wall as one slanted band with shade above and below it.
  float across=dot(P.xy-uBand.xy,normalize(vec2(-uLight.y,uLight.x)))*sign(-uLight.x);
  float band=smoothstep(-uBand.z-.3,-uBand.z+.3,across)*smoothstep(uBand.w+.3,uBand.w-.3,across);
  float spot=(.4+.6*exp(-dot(k,k)*.03))*(.1+.9*band);
  vec3 col=alb*(vec3(.24,.26,.3)+vec3(1.25,1.15,1.0)*pool*spot*diff);
  vec3 r=reflect(V,n);
  float fr=.04+.96*pow(1.-max(dot(-V,n),0.),5.);
  col+=room(r,.16)*fr*.3*min(pool.g+.3,1.);
  return col;
}
// Finite cylinder between pa and pb: distance along the ray and the surface normal, or -1.
vec4 cyl(vec3 ro, vec3 rd, vec3 pa, vec3 pb, float ra){
  vec3 ba=pb-pa, oc=ro-pa; float baba=dot(ba,ba), bard=dot(ba,rd), baoc=dot(ba,oc);
  float k2=baba-bard*bard, k1=baba*dot(oc,rd)-baoc*bard, k0=baba*dot(oc,oc)-baoc*baoc-ra*ra*baba;
  float h=k1*k1-k2*k0; if(h<0.) return vec4(-1.);
  h=sqrt(h); float t=(-k1-h)/k2, y=baoc+t*bard;
  if(y>0.&&y<baba) return vec4(t,(oc+t*rd-ba*y/baba)/ra);
  t=((y<0.?0.:baba)-baoc)/bard;
  if(abs(k1+k2*t)<h) return vec4(t,ba*sign(y)/sqrt(baba));
  return vec4(-1.);
}
vec3 ray(vec2 fc){ vec2 s=(fc*2.-uRes)/uRes.y; return normalize(uF+uRt*s.x*uTan+uU*s.y*uTan); }
// Where the middle of the spectrum lands on the wall after going through the ball; z is 0 if it never gets there.
vec3 landing(vec3 rd){
  vec3 oc=uCam-uC; float b=dot(oc,rd), h=b*b-dot(oc,oc)+uR*uR;
  if(h<=0.) return vec3(0.);
  vec3 p=uCam+rd*(-b-sqrt(h)), n=(p-uC)/uR;
  vec3 d=refract(rd,n,1./uIor); vec3 p2=p+d*(-2.*dot(d,n)*uR);
  vec3 o=refract(d,(uC-p2)/uR,uIor);
  if(o.z>-.02) return vec3(0.);
  return vec3((p2+o*(-p2.z/o.z)).xy,1.);
}
vec3 beyond(vec3 p, vec3 d, vec2 gx, vec2 gy){
  vec3 far=room(d,.01);
  if(d.z>-.02) return far;
  vec3 P=p+d*(-p.z/d.z);
  return mix(wall(P,d,gx,gy,0.,0.),far,smoothstep(14.,40.,length(P.xy)));
}
vec3 glass(vec3 p, vec3 rd, vec2 fc, float jit){
  vec3 n=(p-uC)/uR, up=normalize(uTop-uC);
  float c=max(dot(-rd,n),0.), F=.043+.957*pow(1.-c,5.);
  vec3 refl=beyond(p,reflect(rd,n),vec2(.3,0.),vec2(0.,.3));
  // How much wall one pixel covers once the ball has bent the view, from where the neighbouring pixels land.
  vec3 l0=landing(rd), lx=landing(ray(fc+vec2(1.,0.))), ly=landing(ray(fc+vec2(0.,1.)));
  vec2 gx=l0.z*lx.z>0. ? lx.xy-l0.xy : vec2(.01,0.), gy=l0.z*ly.z>0. ? ly.xy-l0.xy : vec2(0.,.01);
  float gl=max(length(gx),length(gy)); if(gl>1.2){ gx*=1.2/gl; gy*=1.2/gl; }
  vec3 tr=vec3(0.);
  for(int i=0;i<6;i++){
    float w=(float(i)+jit)/6., ior=uIor+uSpread*(w-.5);
    vec3 d=refract(rd,n,1./ior); float len=-2.*dot(d,n)*uR;
    vec3 p2=p+d*len, n2=(p2-uC)/uR;
    vec3 o=refract(d,-n2,ior);
    float f2=.043+.957*pow(1.-max(dot(o,n2),0.),5.);
    vec3 col=beyond(p2,o,gx,gy)*(1.-f2);
    // The foot of the brass cap, seen from inside the glass.
    col=mix(col,vec3(.09,.06,.03),smoothstep(.9925,.9945,dot(n2,up)));
    if(i==2){
      // A second, fainter picture of the room: light that bounced once off the inside of the far wall of the ball.
      vec3 dr=reflect(d,-n2); vec3 p3=p2+dr*(-2.*dot(dr,n2)*uR), n3=(p3-uC)/uR;
      vec3 o3=refract(dr,-n3,ior);
      tr+=beyond(p3,o3,vec2(.4,0.),vec2(0.,.4))*f2*(1.-f2)*exp(-uTint*len*2.);
    }
    tr+=col*exp(-uTint*len)*hue(w)/6.;
  }
  return tr*(1.-F)+refl*F;
}
vec3 brass(vec3 n, vec3 rd, float along){
  vec3 r=reflect(rd,n);
  vec3 c=room(r,.05)*vec3(1.,.74,.38)+vec3(.2,.13,.05)*(.25+.75*max(dot(n,uLight),0.));
  return c*(.75+.25*smoothstep(0.,.3,abs(fract(along*46.)-.5)));
}
vec3 shade(vec2 fc, float jit){
  vec3 rd=ray(fc);
  float tw=-uCam.z/rd.z;
  vec3 oc=uCam-uC; float b=dot(oc,rd), h=b*b-dot(oc,oc)+uR*uR;
  float ts=h>0. ? -b-sqrt(h) : 1e9;
  vec3 up=normalize(uTop-uC);
  vec4 c1=cyl(uCam,rd,uC+up*(uR-.012),uC+up*(uR+.075),.068), c2=cyl(uCam,rd,uC+up*(uR+.07),uC+up*(uR+.15),.026);
  vec3 col; float tn;
  if(c1.x>0.&&c1.x<ts){ tn=c1.x; col=brass(c1.yzw,rd,dot(uCam+rd*tn-uC,up)); }
  else if(c2.x>0.&&c2.x<ts){ tn=c2.x; col=brass(c2.yzw,rd,0.); }
  else if(ts<tw){ tn=ts; col=glass(uCam+rd*ts,rd,fc,jit); }
  else {
    tn=tw; vec3 P=uCam+rd*tw;
    vec3 rx=ray(fc+vec2(1.,0.)), ry=ray(fc+vec2(0.,1.));
    vec2 gx=(uCam+rx*(-uCam.z/rx.z)).xy-P.xy, gy=(uCam+ry*(-uCam.z/ry.z)).xy-P.xy;
    col=wall(P,rd,gx,gy,uAper*abs(tw-uFocus)/uFocus,1.);
  }
  // The wire: a hair of steel, drawn by how much of the pixel it covers so it never breaks into steps.
  vec3 A=uC+up*(uR+.14), ax=normalize(uTop-A), w0=uCam-A;
  float bb=dot(rd,ax), dd=dot(rd,w0), ee=dot(ax,w0), den=1.-bb*bb;
  float tr=(bb*ee-dd)/den, ta=(ee-bb*dd)/den;
  if(ta>0.&&tr>0.&&tr<tn){
    vec3 side=normalize(cross(ax,rd));
    float x=dot(uCam+rd*tr-(A+ax*ta),side), pf=tr*uTan*2./uRes.y;
    float cov=clamp((WIRE-abs(x))/pf+.5,0.,1.)*min(1.,2.*WIRE/pf+.25);
    float u=clamp(x/WIRE,-1.,1.);
    vec3 n=normalize(side*u*.8-rd*sqrt(1.-u*u*.64));
    float lit=.5+.5*dot(n,uLight);
    vec3 steel=vec3(.07,.07,.075)+vec3(.95,.9,.8)*lit*lit*lit*.9;
    col=mix(col,steel,cov);
  }
  return col;
}
const vec2 JIT[4]=vec2[4](vec2(.125,.375),vec2(-.375,.125),vec2(.375,-.125),vec2(-.125,-.375));
void main(){
  vec3 rd=ray(gl_FragCoord.xy);
  vec3 oc=uCam-(uC+normalize(uTop-uC)*.07); float b=dot(oc,rd), rr=uR+.11+2.*length(oc)*uTan/uRes.y;
  int n=b*b-dot(oc,oc)+rr*rr>0. ? uAA : 1;
  vec3 col=vec3(0.);
  // Each sample starts its six colours at a different point in the spectrum, so sharp edges fan out smoothly instead of in six steps.
  float dith=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
  for(int s=0;s<4;s++){ if(s>=n) break; col+=shade(gl_FragCoord.xy+(n>1?JIT[s]:vec2(0.)),fract(dith+float(s)*.25+.125)); }
  col/=float(n);
  // With a float buffer the frame is kept unfinished and its too-bright part is noted, so the lens glow can be added before the film curve.
  if(uDirect) frag=vec4(film(col,gl_FragCoord.xy,uRes,uTime),1.);
  else { col=min(col,vec3(40.)); frag=vec4(col,max(dot(col,vec3(.3,.55,.15))-1.6,0.)); }
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
  col+=halo(uv,1.5+k)*.2+halo(uv,3.+k)*.18+halo(uv,4.5+k)*.14;
  frag=vec4(film(col,gl_FragCoord.xy,uRes,uTime),1.);
}`;

type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export default function RayTracedGlassBallCursorOnAWire() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const knock = useRef<HTMLButtonElement>(null);
  const api = useRef<{ pause: (on: boolean) => void } | null>(null);
  const [live, setLive] = useState(false);
  const [moving, setMoving] = useState(false);
  const [paused, setPaused] = useState(false);
  const [knocks, setKnocks] = useState(0);

  useEffect(() => {
    const el = root.current, cv = canvas.current, img = photo.current, btn = knock.current;
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

    const LIGHT = unit(LAMP);
    const TAN = Math.tan((11 * Math.PI) / 180), DIST = 3 / TAN; // the frame is 6 tall where it meets the wall
    const YTOP = 9.5; // the rail the wire runs up to, far out of frame
    let R = BALL, D0 = BALL * GAP;

    // The poster: the photograph with its masthead, painted once to a canvas and used as the wall's surface.
    const TW = 2048, TH = 1365;
    const sheet = document.createElement("canvas"); sheet.width = TW; sheet.height = TH;
    // seen is the part of the poster the camera frames, in poster pixels: the type is laid out inside it.
    const paintPoster = (withPhoto: boolean, seen: number[]) => {
      const x = sheet.getContext("2d")! as CanvasRenderingContext2D & { letterSpacing: string };
      const [x0, y0, x1, y1] = seen, w = x1 - x0, h = y1 - y0, wide = w > h;
      x.globalAlpha = 1; x.textAlign = "left";
      const g = x.createRadialGradient(TW * 0.5, TH * 0.4, 60, TW * 0.5, TH * 0.4, TW * 0.7);
      g.addColorStop(0, "#2b5a52"); g.addColorStop(1, "#0f2a29");
      x.fillStyle = g; x.fillRect(0, 0, TW, TH);
      const word = document.createElement("canvas"); word.width = TW; word.height = TH;
      const wx = word.getContext("2d")! as CanvasRenderingContext2D & { letterSpacing: string };
      // The masthead runs from the left edge of the frame until it tucks in behind her head.
      const left = x0 + w * (wide ? 0.04 : 0.06), right = wide ? TW * (FACE.u - 0.062) : x1 - w * 0.07;
      wx.font = `800 100px ${GROTESK}`; wx.letterSpacing = "-5px";
      const size = Math.min(((right - left) / wx.measureText(MASTHEAD).width) * 100, h * (wide ? 0.36 : 0.15));
      wx.font = `800 ${size}px ${GROTESK}`; wx.letterSpacing = `${(-size * 0.055).toFixed(1)}px`;
      wx.fillStyle = "#efe9da"; wx.textBaseline = "alphabetic";
      const base = y0 + h * (wide ? 0.075 : 0.05) + size * 0.73;
      wx.fillText(MASTHEAD, left - size * 0.045, base);
      if (withPhoto) {
        const sc = Math.max(TW / img.naturalWidth, TH / img.naturalHeight), dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
        x.drawImage(img, (TW - dw) / 2, (TH - dh) / 2, dw, dh);
        // A quarter-size copy is keyed on the green backdrop, so the masthead prints on the backdrop and passes behind her.
        const kw = TW >> 2, kh = TH >> 2;
        const key = document.createElement("canvas"); key.width = kw; key.height = kh;
        const kx = key.getContext("2d", { willReadFrequently: true })!;
        kx.filter = "blur(1.2px)"; kx.drawImage(sheet, 0, 0, kw, kh); kx.filter = "none";
        const px = kx.getImageData(0, 0, kw, kh), d = px.data;
        const sm = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
        for (let i = 0; i < d.length; i += 4) d[i + 3] = 255 * sm(1.12, 1.42, (d[i + 1] + d[i + 2] + 8) / (2 * d[i] + 8));
        kx.putImageData(px, 0, 0);
        wx.globalCompositeOperation = "destination-in"; wx.imageSmoothingQuality = "high";
        wx.drawImage(key, 0, 0, TW, TH);
      }
      x.drawImage(word, 0, 0);
      // Folio lines, set small against the masthead.
      const small = Math.max(15, h * 0.0215);
      x.fillStyle = "#efe9da"; x.textBaseline = "alphabetic"; x.letterSpacing = `${(small * 0.24).toFixed(1)}px`; x.font = `600 ${small}px ${GROTESK}`;
      if (wide) {
        x.textAlign = "right";
        x.fillText(FOLIO[0].toUpperCase(), x1 - w * 0.045, y0 + h * 0.105);
        x.globalAlpha = 0.72; x.fillText(FOLIO[1].toUpperCase(), x1 - w * 0.045, y0 + h * 0.105 + small * 1.75); x.globalAlpha = 1;
        x.fillRect(x1 - w * 0.045 - small * 2.6, y0 + h * 0.105 - small * 2.1, small * 2.4, Math.max(2, small * 0.12));
        x.textAlign = "left";
      }
    };
    const tex = (unit_: number, src: TexImageSource) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit_); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const an = gl.getExtension("EXT_texture_filter_anisotropic");
      if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, 4);
      return t;
    };
    let posterTex: WebGLTexture | null = null, seen = [0, 0, TW, TH], painted = "";
    const loadPoster = () => {
      if (posterTex) gl.deleteTexture(posterTex);
      // A photo host that forbids pixel reads throws here; the poster then keeps its plain green ground.
      try { paintPoster(img.complete && img.naturalWidth > 0, seen); posterTex = tex(0, sheet); }
      catch { paintPoster(false, seen); posterTex = tex(0, sheet); }
    };

    // The light map the first pass draws into. Half-float where the browser allows it, so a focused point keeps its headroom.
    const MW = 640, MH = 640;
    const float = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
    const mapScale = float ? 1 : 0.1;
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

    // The disc of lamp rays: rings from the middle of the ball out to its rim.
    const GR = 96, GA = 160;
    const pts = new Float32Array((GR + 1) * (GA + 1) * 2), idx = new Uint32Array(GR * GA * 6);
    for (let j = 0, k = 0; j <= GA; j++) for (let i = 0; i <= GR; i++) { pts[k++] = Math.sin(((i / GR) * Math.PI) / 2); pts[k++] = j / GA; }
    for (let j = 0, k = 0; j < GA; j++) for (let i = 0; i < GR; i++) { const a = j * (GR + 1) + i, b = a + GR + 1; idx[k++] = a; idx[k++] = a + 1; idx[k++] = b; idx[k++] = a + 1; idx[k++] = b + 1; idx[k++] = b; }
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, pts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    const plain = gl.createVertexArray();

    // The same spectrum the scene shader uses, cut into six slices that add up to white.
    const tri = (t: number, c: number, w: number) => Math.max(0, 1 - Math.abs(t - c) / w);
    const BANDS = Array.from({ length: 6 }, (_, i) => { const t = (i + 0.5) / 6; return [t, [(tri(t, 0.08, 0.42) + 0.35 * tri(t, 1, 0.2)) / 0.317 / 6, tri(t, 0.5, 0.36) / 0.36 / 6, tri(t, 0.85, 0.38) / 0.31 / 6]] as [number, number[]]; });
    const E1 = unit(cross([0, 1, 0], LIGHT)), E2 = cross(LIGHT, E1);

    // tx, ty: where the glass is being sent. ax, ay: the carriage on the rail above it. sx, sz: how far it has swung sideways and in depth.
    const s = { tx: 0, ty: 0, ax: 0, ay: 0, vax: 0, vay: 0, sx: 0, vsx: 0, sz: 0, vsz: 0, held: false, cx: 0, cy: 0 };
    let W = 0, Hh = 0, asp = 1.8, quality = 1, aa = 4, raf = 0, last = 0, start = 0, shown = true, stopped = false;
    let touched = -1e9, nextKnock = 4300, knockUp = 0, slow = 0, roamAt = 0;
    let cam: V3 = [0, 0, DIST], F: V3 = [0, 0, -1], Rv: V3 = [1, 0, 0], U: V3 = [0, 1, 0];
    let print = [0, 0, 6, 4];

    const aimCamera = () => {
      const yaw = ((asp > 1 ? VIEW_FROM : VIEW_FROM * 0.6) * Math.PI) / 180 + s.cx * 0.03, pitch = -0.035 + s.cy * 0.02;
      cam = [DIST * Math.sin(yaw) * Math.cos(pitch), DIST * Math.sin(pitch), DIST * Math.cos(yaw) * Math.cos(pitch)];
      F = unit(sub([0, 0, 0], cam)); Rv = unit(cross(F, [0, 1, 0])); U = cross(Rv, F);
    };
    // Where a point of the frame (-1 to 1 across and up) meets the plane at depth z.
    const meet = (nx: number, ny: number, z: number) => {
      const d: V3 = [F[0] + Rv[0] * nx * asp * TAN + U[0] * ny * TAN, F[1] + Rv[1] * nx * asp * TAN + U[1] * ny * TAN, F[2] + Rv[2] * nx * asp * TAN + U[2] * ny * TAN];
      const t = (z - cam[2]) / d[2];
      return [cam[0] + d[0] * t, cam[1] + d[1] * t];
    };
    // Size the poster so it covers everything the camera can see, with her face held near the middle of the frame.
    const hang = () => {
      const cx = s.cx, cy = s.cy; s.cx = 0; s.cy = 0; aimCamera();
      const c = [meet(-1, -1, 0), meet(1, -1, 0), meet(-1, 1, 0), meet(1, 1, 0)];
      const bx0 = Math.min(...c.map((p) => p[0])) - 0.5, bx1 = Math.max(...c.map((p) => p[0])) + 0.5, by0 = Math.min(...c.map((p) => p[1])) - 0.3, by1 = Math.max(...c.map((p) => p[1])) + 0.3;
      const pw = Math.max(bx1 - bx0, (by1 - by0) * (TW / TH)), ph = (pw * TH) / TW;
      const px = clamp((asp > 1 ? -0.1 : 0.05) - (FACE.u - 0.5) * pw, bx1 - pw / 2, bx0 + pw / 2);
      const py = clamp((asp > 1 ? 0.5 : 0.1) + (FACE.v - 0.5) * ph, by1 - ph / 2, by0 + ph / 2);
      print = [px, py, pw / 2, ph / 2];
      const toU = (wx: number) => ((wx - (px - pw / 2)) / pw) * TW, toV = (wy: number) => ((py + ph / 2 - wy) / ph) * TH;
      seen = [toU(Math.max(c[0][0], c[2][0])), toV(Math.min(c[2][1], c[3][1])), toU(Math.min(c[1][0], c[3][0])), toV(Math.max(c[0][1], c[1][1]))];
      s.cx = cx; s.cy = cy;
      const sig = seen.map((v) => Math.round(v / 8)).join();
      if (sig !== painted) { painted = sig; loadPoster(); }
    };

    const size = () => {
      const b = el.getBoundingClientRect();
      const k = Math.min(Math.max(window.devicePixelRatio || 1, 0.5), 1.5) * quality;
      const w = Math.max(2, Math.round(b.width * k)), h = Math.max(2, Math.round(b.height * k));
      if (w === W && h === Hh) return;
      W = w; Hh = h; cv.width = W; cv.height = Hh;
      const was = asp; asp = W / Hh;
      R = asp > 1 ? BALL : BALL * 0.86; D0 = R * GAP;
      if (Math.abs(was - asp) > 0.01 || !painted) hang();
    };
    // The glass waits on the line between the camera and her face, so the face is what it turns over.
    const rest = () => {
      const fx = print[0] + (FACE.u - 0.5) * 2 * print[2] + REST.x, fy = print[1] - (FACE.v - 0.5) * 2 * print[3] + REST.y, k = D0 / cam[2];
      return [fx + (cam[0] - fx) * k, fy + (cam[1] - fy) * k];
    };

    const draw = (time: number) => {
      aimCamera();
      const len = YTOP - s.ay;
      const C: V3 = [s.ax + s.sx, s.ay + (s.sx * s.sx + s.sz * s.sz) / (2 * len), D0 + s.sz];
      const top: V3 = [s.ax, YTOP, D0];
      // The lamp's pool moves and grows with the distance to the wall, so the map is fitted round it every frame.
      const along = C[2] / LIGHT[2], cw = [C[0] - LIGHT[0] * along, C[1] - LIGHT[1] * along];
      const half = (R * Math.max(1.3, 0.4 + 1.1 * Math.abs(along / R - 1.45)) * 1.2) / LIGHT[2];
      const cs = [half * 2, half * 2], co = [cw[0] - half, cw[1] - half];

      // Light map: six slices of the spectrum, each bent a little differently and added together.
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, MW, MH);
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(caus.p); gl.bindVertexArray(vao);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.uniform3fv(caus.u("uC"), C); gl.uniform1f(caus.u("uR"), R); gl.uniform3fv(caus.u("uLight"), LIGHT);
      gl.uniform3fv(caus.u("uE1"), E1); gl.uniform3fv(caus.u("uE2"), E2);
      gl.uniform2fv(caus.u("uCausO"), co); gl.uniform2fv(caus.u("uCausS"), cs);
      gl.uniform1f(caus.u("uCell"), (cs[0] / MW) * (cs[1] / MH)); gl.uniform1f(caus.u("uScale"), mapScale); gl.uniform1f(caus.u("uCap"), float ? 400 : 9);
      for (const [w, hue] of BANDS) {
        gl.uniform1f(caus.u("uIor"), IOR + SPREAD * (w - 0.5)); gl.uniform3fv(caus.u("uHue"), hue);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);
      }
      gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, map); gl.generateMipmap(gl.TEXTURE_2D);

      fitShot();
      gl.bindFramebuffer(gl.FRAMEBUFFER, shotFbo); gl.viewport(0, 0, W, Hh);
      gl.useProgram(scene.p); gl.bindVertexArray(plain); gl.uniform1i(scene.u("uDirect"), shot ? 0 : 1);
      gl.uniform2f(scene.u("uRes"), W, Hh); gl.uniform1f(scene.u("uTime"), time); gl.uniform1f(scene.u("uTan"), TAN);
      gl.uniform1f(scene.u("uFocus"), DIST - D0); gl.uniform1f(scene.u("uAper"), 0.08); gl.uniform1f(scene.u("uCausScale"), 1 / mapScale);
      gl.uniform1f(scene.u("uIor"), IOR); gl.uniform1f(scene.u("uSpread"), SPREAD); gl.uniform1f(scene.u("uR"), R); gl.uniform1i(scene.u("uAA"), aa);
      gl.uniform3fv(scene.u("uCam"), cam); gl.uniform3fv(scene.u("uF"), F); gl.uniform3fv(scene.u("uRt"), Rv); gl.uniform3fv(scene.u("uU"), U);
      gl.uniform3fv(scene.u("uLight"), LIGHT); gl.uniform3fv(scene.u("uTint"), TINT);
      gl.uniform3fv(scene.u("uC"), C); gl.uniform3fv(scene.u("uTop"), top);
      gl.uniform4fv(scene.u("uPrint"), print); gl.uniform4f(scene.u("uBand"), 0, 0.2, asp > 1 ? 3.3 : 2.6, asp > 1 ? 3.1 : 2.6); gl.uniform2fv(scene.u("uCausO"), co); gl.uniform2fv(scene.u("uCausS"), cs);
      gl.uniform1i(scene.u("uTex"), 0); gl.uniform1i(scene.u("uCaus"), 2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (shot) {
        gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, shot); gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(lens.p); gl.uniform1i(lens.u("uScene"), 3); gl.uniform2f(lens.u("uRes"), W, Hh); gl.uniform1f(lens.u("uTime"), time);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const step = (dt: number, t: number) => {
      // The carriage and hoist run after the target; the glass hangs below and is dragged along late, so it lags, then swings past.
      const kx = 46 * (s.tx - s.ax) - 11.5 * s.vax, ky = 60 * (s.ty - s.ay) - 13 * s.vay;
      s.vax += kx * dt; s.ax += s.vax * dt; s.vay += ky * dt; s.ay += s.vay * dt;
      s.vsx += (-17 * s.sx - 0.42 * kx - 1.8 * s.vsx) * dt; s.sx += s.vsx * dt;
      const idle = t - touched > 2600;
      // A finger on it is one steady push at the wall; let go and it swings back out past where it hung.
      const push = s.held ? -64 : idle ? 1.3 * Math.sin(t / 1450) : 0;
      s.vsz += (-15 * s.sz - 1.15 * s.vsz + push) * dt; s.sz += s.vsz * dt;
      const stop = R + 0.012 - D0;
      if (s.sz < stop) { s.sz = stop; s.vsz = s.vsz < -0.5 ? -s.vsz * 0.4 : 0; }
      const ease = Math.min(1, dt * 2.5), [hx, hy] = rest();
      s.cx += ((idle ? 0.45 * Math.sin(t / 5300) : clamp((s.tx - hx) * 0.3, -1, 1)) - s.cx) * ease;
      s.cy += ((idle ? 0.4 * Math.sin(t / 6700) : clamp((s.ty - hy) * 0.3, -1, 1)) - s.cy) * ease;
    };
    // Left alone, it waits where it looks best, then wanders a slow figure of eight across her and knocks now and then.
    const roam = (t: number, dt: number) => {
      const wait = clamp((t - Math.max(touched + 2600, 3000)) / 2500, 0, 1);
      roamAt += dt * wait * wait * (3 - 2 * wait);
      const a = (roamAt / ROAM.seconds) * Math.PI * 2;
      const [rx, ry] = rest(), wx = asp > 1 ? ROAM.x : ROAM.x * 0.36;
      s.tx = rx - wx * Math.sin(a); s.ty = ry - ROAM.y * (0.75 * Math.sin(2 * a) + 0.35 * (1 - Math.cos(a)));
    };

    const frame = (now: number) => {
      raf = 0;
      if (!start) { start = now; last = now; }
      const raw = now - last, dt = Math.min(0.032, raw / 1000); last = now;
      const t = now - start;
      if (t - touched > 2600) {
        roam(t, dt);
        if (t > nextKnock && !s.held) { s.held = true; knockUp = t + 950; nextKnock = t + KNOCK_EVERY; }
        if (knockUp && t > knockUp) { knockUp = 0; s.held = false; }
      }
      // Four small steps keep the knock against the wall stable at low frame rates.
      for (let i = 0; i < 4; i++) step(dt / 4, t);
      size(); draw(t / 1000);
      // If frames run long, first drop the extra samples on the glass, then the resolution.
      if (t > 1500) { slow = raw > 24 ? slow + 1 : Math.max(0, slow - 0.25); if (slow > 24) { slow = 0; if (aa > 2) aa = 2; else if (quality > 0.6) quality *= 0.85; else aa = 1; } }
      if (shown && !stopped && !document.hidden) raf = requestAnimationFrame(frame);
    };
    // One finished picture, for reduced motion and for the first paint: the glass goes straight to where it was sent.
    const still = () => { size(); s.ax = s.tx; s.ay = s.ty; s.vax = s.vay = s.sx = s.vsx = s.vsz = 0; s.sz = s.held ? R + 0.012 - D0 : 0; draw(0); };
    const wake = () => { if (reduce) { still(); return; } if (!raf && !stopped) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    size();
    [s.tx, s.ty] = rest(); s.ax = s.tx; s.ay = s.ty;
    still(); setLive(true); setMoving(!reduce); wake();
    const onPhoto = () => { loadPoster(); if (reduce || stopped) still(); };
    if (!(img.complete && img.naturalWidth > 0)) img.addEventListener("load", onPhoto);

    const mark = () => { touched = start ? performance.now() - start : 0; knockUp = 0; };
    const send = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      const nx = clamp(((e.clientX - b.left) / b.width) * 2 - 1, -0.93, 0.93), ny = clamp(1 - ((e.clientY - b.top) / b.height) * 2, -0.8, 0.8);
      [s.tx, s.ty] = meet(nx, ny, D0);
      mark(); if (reduce || stopped) still();
    };
    const press = () => { mark(); s.held = true; if (reduce || stopped) still(); };
    const release = () => { if (!s.held) return; mark(); s.held = false; setKnocks((n) => n + 1); if (reduce || stopped) still(); };
    const onMove = (e: PointerEvent) => { if (e.pointerType === "mouse" || e.buttons) send(e); };
    const onDown = (e: PointerEvent) => { if ((e.target as HTMLElement).closest("button")) return; send(e); press(); };
    const onKeyDown = (e: KeyboardEvent) => {
      const arrows: Record<string, number[]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
      if (arrows[e.key]) {
        e.preventDefault();
        const [lx, ly] = meet(-0.93, -0.8, D0), [hx, hy] = meet(0.93, 0.8, D0);
        s.tx = clamp(s.tx + arrows[e.key][0] * 0.45, Math.min(lx, hx), Math.max(lx, hx)); s.ty = clamp(s.ty + arrows[e.key][1] * 0.45, Math.min(ly, hy), Math.max(ly, hy));
        mark(); if (reduce || stopped) still();
      } else if ((e.key === " " || e.key === "Enter") && !e.repeat) press();
    };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === " " || e.key === "Enter") release(); };
    const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); raf = -1; setLive(false); setMoving(false); };
    el.addEventListener("pointermove", onMove); el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", release); window.addEventListener("pointercancel", release);
    btn.addEventListener("keydown", onKeyDown); btn.addEventListener("keyup", onKeyUp); btn.addEventListener("blur", release);
    const btnDown = () => press();
    btn.addEventListener("pointerdown", btnDown);
    cv.addEventListener("webglcontextlost", onLost);
    api.current = { pause: (on) => { stopped = on; if (on) { cancelAnimationFrame(raf); raf = 0; } else wake(); } };
    const ro = new ResizeObserver(() => { if (reduce || !raf) still(); });
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => { shown = entry.isIntersecting; if (shown && raf !== -1) wake(); });
    io.observe(el);
    const onVis = () => { if (!document.hidden && raf !== -1) wake(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf); api.current = null;
      img.removeEventListener("load", onPhoto);
      el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", release); window.removeEventListener("pointercancel", release);
      btn.removeEventListener("keydown", onKeyDown); btn.removeEventListener("keyup", onKeyUp); btn.removeEventListener("blur", release);
      btn.removeEventListener("pointerdown", btnDown);
      cv.removeEventListener("webglcontextlost", onLost);
      gl.getExtension("WEBGL_lose_context")?.loseContext(); // hand the textures and buffers back at once
      ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const pill = "pointer-events-auto flex h-10 items-center gap-2 rounded-full border border-white/25 bg-black/35 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md transition-colors hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/60";
  return (
    <div ref={root} className="relative h-[620px] w-full cursor-none touch-pan-y select-none overflow-hidden bg-[#10201f] sm:h-[700px]" style={{ fontFamily: GROTESK }}>
      <style>{`@keyframes glass-ball-cursor-on-a-wire-sway { 0%, 100% { transform: rotate(-1.6deg); } 50% { transform: rotate(1.6deg); } }`}</style>
      {/* Shown until the traced picture is ready, and kept when the browser cannot trace it: the same poster and glass, built from plain layers. */}
      <div aria-hidden={live} className={`absolute inset-0 ${live ? "opacity-0" : "opacity-100"}`}>
        <img ref={photo} src={PHOTO} alt={PHOTO_ALT} crossOrigin="anonymous" width={1600} height={1068} className="absolute inset-0 h-full w-full bg-[#1d3f3b] object-cover object-[51%_30%]" />
        <p className="absolute left-[5%] top-[3%] text-[27vw] font-extrabold leading-none tracking-[-0.055em] text-[#efe9da] opacity-90 sm:left-[4%] sm:top-[6%] sm:text-[15.5vw]">{MASTHEAD}</p>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_38%_36%,transparent_30%,rgba(4,12,12,0.6)_100%)]" />
        <div className="absolute left-[62%] top-[36%] h-0 w-0 origin-[0_-700px] motion-safe:animate-[glass-ball-cursor-on-a-wire-sway_5s_ease-in-out_infinite] sm:left-[52%] sm:top-[33%]">
          <span className="absolute -top-[700px] left-0 h-[620px] w-px bg-gradient-to-b from-white/20 to-white/70" />
          <span className="absolute left-[80px] top-[110px] h-[170px] w-[170px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,244,214,0.5)_0%,rgba(255,244,214,0.28)_45%,rgba(0,0,0,0.3)_62%,transparent_72%)] blur-[3px]" />
          <span className="absolute left-0 top-0 h-[170px] w-[170px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35),inset_0_0_26px_6px_rgba(0,0,0,0.55),0_30px_50px_rgba(0,0,0,0.35)]">
            <span className="absolute left-1/2 top-1/2 h-[700px] w-[1050px] -translate-x-[46%] -translate-y-[62%] rotate-180 bg-cover bg-center" style={{ backgroundImage: `url(${PHOTO})` }} />
            <span className="absolute left-[18%] top-[12%] h-[26%] w-[20%] -rotate-12 rounded-[40%] bg-gradient-to-b from-white/90 to-white/30 blur-[1px]" />
            <span className="absolute inset-0 rounded-full shadow-[inset_-10px_-14px_24px_rgba(255,255,255,0.28)]" />
          </span>
          <span className="absolute -top-[97px] left-0 h-[14px] w-[16px] -translate-x-1/2 rounded-[3px] bg-gradient-to-r from-[#5b3d12] via-[#f1c877] to-[#6b4a17]" />
        </div>
      </div>

      <canvas ref={canvas} role="img" aria-label={`${PHOTO_ALT}, pasted up as a poster with the masthead ${MASTHEAD}. A clear glass ball hangs in front of it on a wire and shows the picture behind it upside down.`} className={`absolute inset-0 h-full w-full ${live ? "opacity-100" : "opacity-0"}`} />

      <h2 className="sr-only">{MASTHEAD}. {FOLIO.join(". ")}.</h2>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/55 to-transparent px-5 pb-5 pt-16 sm:px-8 sm:pb-7">
        <p className="max-w-[15rem] text-[11px] font-medium uppercase leading-[1.65] tracking-[0.2em] text-white/85 sm:max-w-none">{CAPTION}</p>
        <div className="flex shrink-0 gap-2">
          <button ref={knock} type="button" aria-label="Knock the glass against the wall. Arrow keys carry it." aria-describedby="glass-ball-cursor-keys" className={`${pill} w-10 cursor-pointer justify-center px-0 sm:w-auto sm:px-4`}>
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="8" cy="10" r="4.6" /><path d="M16.5 4v12M14 7.5v5" /></svg>
            <span className="hidden sm:inline">Knock</span>
          </button>
          {moving && (
            <button type="button" aria-pressed={paused} onClick={() => { api.current?.pause(!paused); setPaused(!paused); }} aria-label={paused ? "Resume the glass" : "Pause the glass"} className={`${pill} w-10 cursor-pointer justify-center px-0 sm:w-auto sm:px-4`}>
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="currentColor">{paused ? <path d="M6.5 4.5v11l9-5.5z" /> : <path d="M6 4.5h2.6v11H6zM11.4 4.5H14v11h-2.6z" />}</svg>
              <span className="hidden sm:inline">{paused ? "Play" : "Pause"}</span>
            </button>
          )}
        </div>
      </div>
      <p id="glass-ball-cursor-keys" className="sr-only">With this button focused, the arrow keys carry the glass and Space or Enter knocks it against the wall.</p>
      <p className="sr-only" aria-live="polite">{knocks > 0 ? `The glass has knocked the wall ${knocks} ${knocks === 1 ? "time" : "times"}.` : ""}</p>
    </div>
  );
}
