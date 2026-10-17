import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The article this header opens. Everything printed in the book comes from here too. */
const article = {
  kicker: "Long read",
  part: "Chapter four",
  title: "The Orchard Keeps Its Own Hours",
  deck: "A season with the last grafter on Hensley Lane, who prunes by the light and not by the calendar.",
  author: "Ines Calloway",
  minutes: "14 min read",
  book: "Low Light at Hensley",
};

/** Page text. `left` and `front` end the previous chapter, `back` is the epigraph, `opening` starts this one. */
const pages = {
  left: {
    folio: "86",
    text: "By the time the frost lifted the yard had gone quiet again, and the ladders leaned where they had been dropped the night before. Nobody spoke of the crop. We swept the packing shed, we oiled the shears, we counted crates that did not need counting. My aunt walked the lower rows twice before breakfast with her hands behind her back, as if she were inspecting soldiers. When she came in she said only that the old Bramleys had held, and that the young trees by the wall would tell us nothing until spring. It was the kind of answer that sounded like comfort and was really a refusal to guess. I have since learned that this is what growers do. They wait in a way that looks like work, and they work in a way that looks like waiting.",
  },
  front: {
    folio: "87",
    text: "That night the wind turned round to the west and the kitchen window rattled in its frame until someone wedged a folded letter into the gap. In the morning the sky was the colour of skimmed milk. The last of the windfalls lay brown in the grass, and the starlings had found them. I remember thinking that the year was over, that whatever the orchard had meant to do it had done, and that we would only be clearing up after it now. I was wrong about that, as I was wrong about most things that winter.",
  },
  back: {
    quote: "Every tree keeps a calendar of its own. The grafter only learns to read it.",
    source: "from a grafter's notebook, Hensley Lane",
  },
  opening: {
    text: "The first cut of the year is made before anyone else is awake. Odile Marchetti carries her saw out at half past six, while the frost still holds the grass stiff, and she does not look at her watch again until noon. She reads the buds instead. A swollen tip on a Cox means one thing, a split scale on a Russet means another, and the difference between them is a week of work. She has done this on the same eleven acres for longer than the farm has had electricity.",
  },
};

const START_P = 0.68; // where the page hangs in the air when the piece loads
const DEMO = [
  [3.6, 0.68], // seconds held, then the next target
  [3.4, 1],
  [2.4, 0],
  [2.2, 0.68],
] as const;

// World sizes, shared with the shader.
const W = 0.62; // page width
const H = 0.44; // half page height (along the table)
const F = 2.0; // lens
const PW = 640; // atlas pixels per page
const PH = Math.round((PW * 2 * H) / W);
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const VERT = `#version 300 es
in vec2 aP; void main(){ gl_Position=vec4(aP,0.,1.); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec3 uRo; uniform vec3 uTa; uniform float uShift;
uniform vec4 uSheet; uniform sampler2D uAtlas;
out vec4 o;
const float W=${W.toFixed(3)}, H=${H.toFixed(3)}, O=0.016, BT=0.009, T=0.03, TH=0.0011, PHA=0.004;
const float YB=BT, YT=BT+T, HY=YT+0.0006, PI=3.14159265;
const vec3 L=normalize(vec3(-0.35,0.62,-0.7));
const vec3 BMIN=vec3(-0.68,-0.01,-0.48), BMAX=vec3(0.68,0.7,0.72);

float h21(vec2 p){ p=fract(p*vec2(233.34,851.73)); p+=dot(p,p+23.45); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float s=0.,a=.5; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+7.1; a*=.5; } return s; }
float box2(vec2 p,vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,d.y),0.); }
float box3(vec3 p,vec3 b){ vec3 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,max(d.y,d.z)),0.); }
vec2 boxHit(vec3 ro,vec3 rd){ vec3 iv=1./rd; vec3 a=(BMIN-ro)*iv, b=(BMAX-ro)*iv; vec3 n=min(a,b), f=max(a,b);
  return vec2(max(max(n.x,n.y),n.z), min(min(f.x,f.y),f.z)); }

// the turning leaf: an arc hinged at the gutter that curls back on itself
vec3 sheetD(vec3 p){
  float zn=clamp(p.z/H,-1.,1.);
  float ph=clamp(uSheet.x+uSheet.z*zn,PHA,PI-PHA);
  float k=uSheet.y*(1.+0.32*zn);
  k=clamp(k,0.004,max(0.004,2.*(ph-PHA)/W*0.95));
  vec2 t=vec2(cos(ph),sin(ph)), n=vec2(-t.y,t.x);
  vec2 q=p.xy-vec2(0.,HY);
  float r=1./k;
  vec2 v=vec2(dot(q,t),dot(q,n)+r);
  float s=-atan(-v.x,v.y)/k;
  float sc=clamp(s,0.,W), d2;
  if(s==sc) d2=abs(length(v)-r);
  else { float tc=-W*k; d2=min(length(v-vec2(0.,r)),length(v-r*vec2(-sin(tc),cos(tc)))); }
  vec2 w=vec2(d2-TH,abs(p.z)-H);
  float d=min(max(w.x,w.y),0.)+length(max(w,0.));
  return vec3(d,sc,length(v)>r?1.:-1.);
}
float hBlock(float ax){ return YB+T*(1.-0.42*exp(-ax/0.035))-0.003*smoothstep(W-0.025,W,ax); }
// id: 0 cloth, 1 boards, 2 page blocks, 3 leaf, 4 headband
vec2 map(vec3 p){
  vec2 r=vec2(box3(p-vec3(0.,BT*.5,0.),vec3(W+O-0.003,BT*.5-0.0025,H+O-0.003))-0.0025,1.);
  float ax=abs(p.x);
  float db=max(max((p.y-hBlock(ax))*0.8,max(ax-W,abs(p.z)-H)),YB-0.002-p.y);
  if(db<r.x) r=vec2(db,2.);
  vec3 sd=sheetD(p); if(sd.x<r.x) r=vec2(sd.x,3.);
  float hb=max(length(vec2(p.x*0.8,p.y-YB-0.012))-0.009,abs(abs(p.z)-H+0.004)-0.005);
  if(hb<r.x) r=vec2(hb,4.);
  return r;
}
vec3 nor(vec3 p){ vec2 e=vec2(0.0004,-0.0004);
  return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x); }
float shadow(vec3 p){
  vec2 bh=boxHit(p,L); if(bh.x>bh.y||bh.y<0.) return 1.;
  float s=1., t=max(bh.x,0.003);
  for(int i=0;i<44;i++){ float h=map(p+L*t).x; s=min(s,16.*h/t); t+=clamp(h,0.002,0.05); if(s<0.01||t>bh.y) break; }
  return clamp(s,0.,1.);
}
float ao(vec3 p,vec3 n){ float a=0.,w=1.; for(int i=1;i<=4;i++){ float h=0.008*float(i)*float(i); a+=w*(h-map(p+n*h).x); w*=.6; } return clamp(1.-a*8.,0.,1.); }
// morning sun through a window with a cross bar and a tree outside
float sun(vec3 p){
  vec2 w=(p+L*((2.4-p.y)/L.y)).xz-vec2(-2.2,-3.31);
  float bl=0.05+0.02*fbm(w*3.);
  float m=smoothstep(bl,-bl,box2(w,vec2(1.62,1.25)));
  vec2 g=abs(w); m*=smoothstep(0.02,0.02+bl,g.x)*smoothstep(0.018,0.018+bl,g.y);
  float lv=fbm(w*2.2+vec2(uTime*0.04,sin(uTime*0.27)*0.05));
  m*=mix(0.3,1.,smoothstep(0.34,0.56,lv+0.1*(w.x+1.2)));
  return m;
}
vec3 env(vec3 d){
  vec3 c=mix(vec3(0.3,0.27,0.24),vec3(0.66,0.64,0.6),smoothstep(-0.2,0.7,d.y));
  c+=vec3(3.4,2.8,2.0)*pow(max(dot(d,L),0.),18.);
  return c;
}
vec4 ink(float idx,vec2 uv){ return texture(uAtlas,vec2((idx+clamp(uv.x,0.,1.))*0.25,clamp(uv.y,0.,1.)),-0.9); }
void main(){
  vec2 uv=(gl_FragCoord.xy-0.5*uRes)/uRes.y; uv.y+=uShift;
  vec3 fw=normalize(uTa-uRo), rt=normalize(cross(fw,vec3(0,1,0))), up=cross(rt,fw);
  vec3 rd=normalize(fw*${F.toFixed(2)}+rt*uv.x+up*uv.y), ro=uRo;
  float tp=-ro.y/rd.y; if(tp<0.) tp=1e3;
  float t=tp, id=0.; bool hit=false;
  vec2 bh=boxHit(ro,rd);
  if(bh.x<bh.y && bh.y>0.){
    float tt=max(bh.x,0.), te=min(bh.y,tp);
    for(int i=0;i<110;i++){ vec2 h=map(ro+rd*tt); if(h.x<0.00012*tt){ hit=true; id=h.y; break; } tt+=h.x*0.7; if(tt>te) break; }
    if(hit) t=tt;
  }
  vec3 p=ro+rd*t;
  vec3 n= hit ? nor(p) : vec3(0.,1.,0.);
  float fp=t/(uRes.y*${F.toFixed(2)});
  vec3 alb; float rough=0.9, spec=0.04, metal=0., trans=0.;
  vec3 sunC=vec3(1.0,0.8,0.55)*2.0;
  if(!hit){
    // linen: slubbed weave, ironed fold lines, detail fading with distance
    vec2 c=p.xz;
    float fade=smoothstep(0.0045,0.0016,fp);
    float sx=fbm(vec2(c.x*30.,c.y*3.)), sz=fbm(vec2(c.x*3.,c.y*30.)+5.);
    float tx=sin(c.x*430.+sx*5.), tz=sin(c.y*430.+sz*5.);
    float cross_=step(0.,sin(c.x*215.+sx*2.5)*sin(c.y*215.+sz*2.5));
    float wv=mix(tz*tz,tx*tx,cross_);
    float slub=fbm(vec2(c.x*8.,c.y*90.))*0.5+fbm(vec2(c.x*90.,c.y*8.))*0.5;
    alb=vec3(0.66,0.6,0.5)*(0.9+0.1*fbm(c*5.))*(1.-fade*(0.12*(1.-wv)+0.08*(slub-0.5)));
    float fx=c.x+0.98, fz=c.y+0.78;
    float gx=-2.*fx/0.0009*exp(-fx*fx/0.0009)*0.0018, gz=-2.*fz/0.0012*exp(-fz*fz/0.0012)*0.0016;
    n=normalize(vec3(-gx-fade*0.05*(tx*cos(c.x*430.)),1.,-gz-fade*0.05*tz*cos(c.y*430.)));
    rough=0.95;
  } else if(id<1.5){
    // cloth over the boards
    float wv=fbm(p.xz*vec2(300.,40.))*0.5+fbm(p.xz*vec2(40.,300.))*0.5;
    alb=vec3(0.13,0.2,0.19)*(0.85+0.3*wv); rough=0.8; spec=0.05;
  } else if(id<2.5){
    if(n.y>0.55 && p.y>YB+T*0.4){
      float ax=abs(p.x), fib=fbm(p.xz*170.)*0.5+fbm(p.xz*24.)*0.5;
      alb=vec3(0.88,0.83,0.73)*(0.95+0.07*fib);
      vec2 cock=vec2(fbm(p.xz*9.),fbm(p.xz*9.+4.))-0.5; n=normalize(n+vec3(cock.x,0.,cock.y)*0.05);
      vec4 k= p.x<0. ? ink(0.,vec2((p.x+W)/W,(p.z+H)/(2.*H))) : ink(3.,vec2(p.x/W,(p.z+H)/(2.*H)));
      float gilt=k.a*step(0.5,k.r)*step(0.34,k.g)*step(k.b,0.3);
      alb=mix(alb,k.rgb*0.7,min(1.,k.a*1.15));
      if(gilt>0.5){ alb=vec3(0.78,0.5,0.15); metal=1.; rough=0.22+0.25*fbm(p.xz*500.); }
      rough=max(rough*(1.-metal),metal>0.5?rough:0.85);
    } else {
      float st=fbm(vec2(p.y*2200.,(p.x+p.z)*6.));
      alb=vec3(0.9,0.85,0.74)*(0.86+0.18*st); rough=0.9;
    }
  } else if(id<3.5){
    vec3 sd=sheetD(p);
    float u=sd.y/W, v=(p.z+H)/(2.*H);
    float fib=fbm(vec2(u*W,p.z)*170.)*0.5+fbm(vec2(u*W,p.z)*24.)*0.5;
    alb=vec3(0.89,0.84,0.74)*(0.95+0.07*fib); rough=0.85;
    bool front=sd.z>0.;
    vec4 k= front ? ink(1.,vec2(u,v)) : ink(2.,vec2(1.-u,v));
    vec4 kb= front ? ink(2.,vec2(1.-u,v)) : ink(1.,vec2(u,v));
    trans=1.;
    alb=mix(alb,alb*0.82,kb.a*0.12);
    alb=mix(alb,k.rgb*0.7,min(1.,k.a*1.15));
    if(dot(n,L)<0.) alb=mix(alb,alb*0.45,kb.a*0.75);
  } else {
    float s=step(0.5,fract(p.x*300.+p.y*300.));
    alb=mix(vec3(0.5,0.1,0.08),vec3(0.86,0.8,0.66),s); rough=0.6;
  }
  float sm=sun(p), oc=1.;
  vec3 pp=p+n*0.0012;
  if(p.x>BMIN.x-0.12 && p.x<BMAX.x+0.12 && p.z>BMIN.z-0.12 && p.z<BMAX.z+0.1) oc=ao(p,n);
  float dl=dot(n,L), sh, tr=0.;
  if(trans>0.5 && dl<0.){ sh=shadow(p-n*0.0025); tr=-dl*sh*sm; dl=0.; }
  else { sh= dl>0. ? shadow(pp) : 0.; dl=max(dl,0.); }
  vec3 amb=vec3(0.27,0.26,0.26)*(0.55+0.45*n.y)*oc;
  vec3 bounce=vec3(0.45,0.33,0.2)*0.45*oc*clamp(0.5-0.5*n.y,0.,1.);
  vec3 dif=alb*(sunC*dl*sh*sm+amb+bounce);
  if(trans>0.5) dif+=alb*vec3(1.,0.86,0.66)*sunC*tr*0.42;
  vec3 r=reflect(rd,n), hv=normalize(L-rd);
  float fr=0.04+0.96*pow(1.-max(dot(n,-rd),0.),5.);
  float g=pow(max(dot(n,hv),0.),2./(rough*rough*rough+0.002))*(1./(rough*rough*2.+0.2));
  vec3 col;
  if(metal>0.5) col=alb*(env(r)*0.3*oc+sunC*g*sh*sm*0.9+sunC*dl*sh*sm*0.35)+alb*amb*0.25;
  else col=dif+spec*(fr*env(r)*0.3*oc+sunC*g*sh*sm*0.12);
  // morning haze toward the back of the room
  col=mix(col,vec3(0.62,0.58,0.52),smoothstep(2.5,6.,t)*0.2);
  col*=1.0-0.24*dot(uv*vec2(0.75,1.),uv*vec2(0.75,1.));
  col=(col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14);
  col=pow(clamp(col,0.,1.),vec3(1./2.2));
  col=mix(col,col*col*(3.-2.*col),0.35);
  col+=(h21(gl_FragCoord.xy+fract(uTime)*91.)-0.5)*0.02;
  o=vec4(col,1.);
}`;

function lines(ctx: CanvasRenderingContext2D, text: string, max: number, firstIndent = 0, narrow?: { lines: number; by: number }) {
  const out: { words: string[]; w: number; last: boolean; indent: number }[] = [];
  let cur: string[] = [];
  const width = (i: number) => max - (i === 0 ? firstIndent : 0) - (narrow && i < narrow.lines ? narrow.by : 0);
  for (const word of text.split(" ")) {
    const next = [...cur, word].join(" ");
    if (ctx.measureText(next).width > width(out.length) && cur.length) {
      out.push({ words: cur, w: width(out.length), last: false, indent: max - width(out.length) });
      cur = [word];
    } else cur.push(word);
  }
  if (cur.length) out.push({ words: cur, w: width(out.length), last: true, indent: max - width(out.length) });
  return out;
}

/** Sets justified text, the way a book is set. */
function setBody(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lead: number, opts: { indent?: number; narrow?: { lines: number; by: number } } = {}) {
  const ls = lines(g, text, max, opts.indent ?? 0, opts.narrow);
  ls.forEach((l, i) => {
    const x0 = x + l.indent;
    if (l.last || l.words.length < 2) {
      g.fillText(l.words.join(" "), x0, y + i * lead);
      return;
    }
    const wordsW = l.words.reduce((s, w) => s + g.measureText(w).width, 0);
    const gap = (l.w - wordsW) / (l.words.length - 1);
    let cx = x0;
    l.words.forEach((w) => {
      g.fillText(w, cx, y + i * lead);
      cx += g.measureText(w).width + gap;
    });
  });
  return y + ls.length * lead;
}

/** Prints the four pages into one texture: left page, leaf front, leaf back, chapter opening. */
function makeAtlas() {
  const c = document.createElement("canvas");
  c.width = PW * 4;
  c.height = PH;
  const g = c.getContext("2d")!;
  const ink = "rgb(24,19,16)";
  const red = "rgb(128,46,34)";
  const gilt = "rgb(196,140,46)";
  const top = 92;
  const body = 21;
  const lead = 31;
  const head = (x0: number, label: string, folio: string, verso: boolean) => {
    g.fillStyle = ink;
    g.font = `500 13px ${SERIF}`;
    g.letterSpacing = "3px";
    g.textAlign = "center";
    g.fillText(label.toUpperCase(), x0 + PW / 2, 56);
    g.letterSpacing = "0px";
    g.font = `400 16px ${SERIF}`;
    g.fillText(folio, x0 + (verso ? 70 : PW - 70), PH - 44);
    g.textAlign = "left";
  };
  // 0: left page (verso)
  let x0 = 0;
  head(x0, article.book, pages.left.folio, true);
  g.fillStyle = ink;
  g.font = `500 ${body}px ${SERIF}`;
  setBody(g, pages.left.text, x0 + 66, top + 20, PW - 66 - 54, lead, { indent: 26 });
  // 1: leaf front (recto)
  x0 = PW;
  head(x0, "The long frost", pages.front.folio, false);
  g.fillStyle = ink;
  g.font = `500 ${body}px ${SERIF}`;
  const end = setBody(g, pages.front.text, x0 + 54, top + 20, PW - 54 - 66, lead, { indent: 26 });
  g.fillStyle = red;
  [-18, 0, 18].forEach((dx) => {
    g.beginPath();
    g.arc(x0 + PW / 2 + dx, end + 40, dx === 0 ? 4 : 3, 0, Math.PI * 2);
    g.fill();
  });
  // 2: leaf back (verso): epigraph
  x0 = PW * 2;
  g.fillStyle = ink;
  g.textAlign = "center";
  g.font = `italic 400 27px ${SERIF}`;
  const qs = lines(g, pages.back.quote, PW - 200);
  qs.forEach((l, i) => g.fillText(l.words.join(" "), x0 + PW / 2, PH * 0.34 + i * 40));
  g.font = `400 14px ${SERIF}`;
  g.letterSpacing = "2.5px";
  g.fillStyle = red;
  g.fillText(pages.back.source.toUpperCase(), x0 + PW / 2, PH * 0.34 + qs.length * 40 + 30);
  g.letterSpacing = "0px";
  g.font = `400 16px ${SERIF}`;
  g.fillStyle = ink;
  g.fillText("88", x0 + 70, PH - 44);
  g.textAlign = "left";
  // 3: chapter opening (recto) with a gilt drop cap
  x0 = PW * 3;
  g.textAlign = "center";
  g.fillStyle = red;
  g.font = `500 15px ${SERIF}`;
  g.letterSpacing = "6px";
  g.fillText(article.part.toUpperCase(), x0 + PW / 2, 150);
  g.letterSpacing = "0px";
  g.fillStyle = ink;
  g.font = `italic 400 38px ${SERIF}`;
  const ts = lines(g, article.title, PW - 170);
  ts.forEach((l, i) => g.fillText(l.words.join(" "), x0 + PW / 2, 214 + i * 46));
  const ruleY = 214 + ts.length * 46 + 6;
  g.fillRect(x0 + PW / 2 - 28, ruleY, 56, 1.5);
  g.textAlign = "left";
  const by = ruleY + 74;
  const capLines = 4;
  g.fillStyle = gilt;
  g.font = `600 ${lead * capLines + 6}px ${SERIF}`;
  const cap = pages.opening.text[0];
  g.fillText(cap, x0 + 54, by + lead * (capLines - 1) + 2);
  const capW = g.measureText(cap).width + 14;
  g.fillStyle = ink;
  g.font = `500 ${body}px ${SERIF}`;
  setBody(g, pages.opening.text.slice(1), x0 + 54, by, PW - 54 - 66, lead, { narrow: { lines: capLines, by: capW } });
  g.font = `400 16px ${SERIF}`;
  g.textAlign = "center";
  g.fillText("89", x0 + PW / 2, PH - 44);
  g.textAlign = "left";
  return c;
}

/** Turns page progress into the leaf's hinge angle, curl and twist. */
function leaf(p: number, v: number, time: number) {
  const a = Math.sin(Math.PI * Math.min(1, Math.max(0, p)));
  const phi = 0.004 + (Math.PI - 0.008) * Math.min(1, Math.max(0, p)) + 0.03 * Math.sin(time * 1.15) * a;
  const k = 0.004 + 1.95 * Math.pow(a, 1.15) + Math.max(-0.6, Math.min(1.3, 0.9 * v));
  const tw = 0.3 * a + Math.max(-0.2, Math.min(0.25, 0.12 * v)) + 0.02 * Math.sin(time * 0.8) * a;
  return [phi, k, tw, 0];
}

function camera(aspect: number) {
  const ta = [0.0, 0.06, 0.04];
  const dir = [0.42, 1.0, 1.0];
  const len = Math.hypot(dir[0], dir[1], dir[2]);
  const fitW = 1.3;
  const D = Math.max((fitW * F) / (0.5 * aspect), 4.05);
  const ro = ta.map((v, k) => v + (dir[k] / len) * D);
  const shift = aspect < 0.9 ? 0.3 : 0.235;
  return { ro, ta, shift };
}

export default function OpenHardbackArticleHeader() {
  const reduce = useReducedMotion();
  const [webgl, setWebgl] = useState(true);
  const [turned, setTurned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const targetRef = useRef<number>(START_P);
  const userRef = useRef(false);
  const pokeRef = useRef<() => void>(() => {});

  const turn = () => {
    userRef.current = true;
    const next = targetRef.current < 0.5 ? 1 : 0;
    targetRef.current = next;
    setTurned(next === 1);
    pokeRef.current();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
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
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U("uRes"), uTime = U("uTime"), uRo = U("uRo"), uTa = U("uTa"), uShift = U("uShift"), uSheet = U("uSheet");
    gl.uniform1i(U("uAtlas"), 0);

    // page state: progress p (0 lying right, 1 lying left) and its speed
    const st = { p: reduce ? 1 : START_P, v: 0 };
    if (reduce) targetRef.current = 1;
    let scale = 1;
    let w = 0, h = 0, aspect = 16 / 9;
    let lastT = 0;
    const draw = (time: number) => {
      const cam = camera(aspect);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, time);
      gl.uniform3fv(uRo, cam.ro);
      gl.uniform3fv(uTa, cam.ta);
      gl.uniform1f(uShift, cam.shift);
      gl.uniform4fv(uSheet, leaf(st.p, st.v, reduce ? 0 : time));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const k = Math.min(dpr * scale, Math.sqrt(1.5e6 / Math.max(1, r.width * r.height)));
      w = Math.max(2, Math.round(r.width * k));
      h = Math.max(2, Math.round(r.height * k));
      canvas.width = w;
      canvas.height = h;
      aspect = r.width / Math.max(1, r.height);
      gl.viewport(0, 0, w, h);
      draw(lastT);
    };

    // the idle demo: hold the leaf in the air, let it land, turn it back
    let demoAt = performance.now() / 1000;
    let demoI = 0;
    const step = (dt: number, time: number) => {
      if (!userRef.current && time - demoAt > DEMO[demoI][0]) {
        demoAt = time;
        demoI = (demoI + 1) % DEMO.length;
        targetRef.current = DEMO[demoI][1];
      }
      const tgt = targetRef.current;
      // paper is light: a soft spring with air drag, and it lands with a small bounce
      const acc = 13 * (tgt - st.p) - 4.6 * st.v;
      st.v += acc * dt;
      st.p += st.v * dt;
      if (st.p > 1) {
        st.p = 1;
        if (st.v > 0) st.v *= -0.22;
      }
      if (st.p < 0) {
        st.p = 0;
        if (st.v < 0) st.v *= -0.22;
      }
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
      for (let i = 0; i < sub; i++) step(dt / sub, lastT);
      draw(lastT);
      frames++;
      if (now - fpsT > 1000) {
        const fps = (frames * 1000) / (now - fpsT);
        canvas.dataset.fps = fps.toFixed(1);
        if (fps < 40 && scale > 0.55) {
          slow++;
          if (slow >= 2) {
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
      if (reduce) return;
      if (!raf && visible) {
        prev = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    pokeRef.current = () => {
      if (reduce) {
        st.p = targetRef.current;
        st.v = 0;
        draw(lastT);
      } else start();
    };

    // scrolling over the header turns the leaf: down turns it over, up brings it back
    const nudge = (dy: number) => {
      if (reduce) return;
      userRef.current = true;
      const t = Math.max(0, Math.min(1, targetRef.current + dy / 650));
      targetRef.current = t;
      setTurned(t > 0.5);
    };
    let lastY = window.scrollY;
    let wheelAt = 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (performance.now() - wheelAt > 120) {
        const r = root.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) nudge(y - lastY);
      }
      lastY = y;
    };
    const onWheel = (e: WheelEvent) => {
      wheelAt = performance.now();
      nudge(e.deltaY);
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      wheelAt = performance.now();
      nudge((touchY - y) * 1.4);
      touchY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    root.addEventListener("wheel", onWheel, { passive: true });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: true });

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
      window.removeEventListener("scroll", onScroll);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      pokeRef.current = () => {};
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [reduce]);

  return (
    <header ref={rootRef} className="relative isolate min-h-[680px] overflow-hidden bg-[#c9c0b0] text-[#221c17] sm:min-h-[780px]">
      {webgl ? (
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full" />
      ) : (
        <StillBook />
      )}
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-12 text-center sm:px-6 sm:pt-14">
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6e2a1f] sm:text-[12px]">
          <span>{article.kicker}</span>
          <span aria-hidden="true" className="h-px w-6 bg-[#6e2a1f]/60" />
          <span>{article.part}</span>
        </p>
        <h2
          className="mt-4 max-w-4xl text-balance text-[44px] leading-[0.95] tracking-[-0.025em] sm:text-[68px] lg:text-[84px]"
          style={{ fontFamily: SERIF, fontWeight: 500 }}
        >
          {article.title}
        </h2>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[#3d342c] sm:text-[18px]" style={{ fontFamily: SERIF, fontStyle: "italic" }}>
          {article.deck}
        </p>
        <p className="mt-4 text-[12px] font-medium uppercase tracking-[0.2em] text-[#4a4037]" style={{ fontFamily: '"Inter Tight", "Inter", ui-sans-serif, system-ui' }}>
          By {article.author} <span aria-hidden="true">·</span> {article.minutes}
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-4 px-4 sm:justify-end sm:px-8">
        <span aria-hidden="true" className="hidden text-[12px] tracking-[0.06em] text-[#3d342c] sm:inline" style={{ fontFamily: SERIF, fontStyle: "italic" }}>
          or scroll to turn it
        </span>
        <button
          type="button"
          onClick={turn}
          aria-pressed={turned}
          className="min-h-[44px] rounded-full bg-[#221c17]/85 px-5 text-[13px] font-medium tracking-[0.04em] text-[#f3ece0] shadow-[0_8px_24px_-10px_rgba(30,20,10,0.6)] backdrop-blur-sm transition-colors hover:bg-[#221c17] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3ece0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#221c17]"
          style={{ fontFamily: '"Inter Tight", "Inter", ui-sans-serif, system-ui' }}
        >
          {turned ? "Turn back a page" : "Turn the page"}
        </button>
      </div>
      <div className="sr-only">
        <p>{pages.back.quote} ({pages.back.source})</p>
        <p>{pages.opening.text}</p>
      </div>
    </header>
  );
}

/** Shown without WebGL 2: the open book in still light, set in real type. */
function StillBook() {
  return (
    <div
      className="absolute inset-0 -z-10"
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 38% 78%, rgba(255,236,200,0.55), transparent 70%), repeating-linear-gradient(0deg, rgba(90,70,50,0.05) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(90,70,50,0.05) 0 1px, transparent 1px 4px), #c9c0b0",
      }}
    >
      <div className="absolute bottom-[12%] left-1/2 w-[min(80%,500px)] -translate-x-1/2 [perspective:1100px]">
        <div
          className="grid grid-cols-2 rounded-[3px] bg-[#22332f] p-[6px] shadow-[18px_26px_30px_-12px_rgba(50,35,20,0.5)]"
          style={{ transform: "rotateX(38deg) rotateZ(-6deg)" }}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              className="aspect-[0.7] overflow-hidden bg-[#f1e9d8] p-[7%] text-justify text-[5px] leading-[1.45] text-[#2a231d] sm:text-[7px]"
              style={{
                fontFamily: SERIF,
                backgroundImage: i === 0 ? "linear-gradient(90deg, transparent 80%, rgba(80,60,40,0.22))" : "linear-gradient(270deg, transparent 80%, rgba(80,60,40,0.22))",
              }}
            >
              {i === 0 ? (
                <p>{pages.left.text}</p>
              ) : (
                <p>
                  <span className="float-left mr-1 text-[3.4em] leading-[0.8] text-[#b0812f]">{pages.opening.text[0]}</span>
                  {pages.opening.text.slice(1)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
