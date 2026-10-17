import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Example quotes from invented people. `edge` is the painted card edge, `ink` a darker shade for text on the page. */
const cards = [
  {
    quote: "The new site feels like our shop does: quiet, careful, and easy to find your way around.",
    name: "Marguerite Olande",
    trade: "Bookbinder",
    place: "Olande Bindery, Lyon",
    edge: "#b53c22",
    ink: "#8a2c19",
  },
  {
    quote: "We stopped explaining what we make over the phone. People arrive already knowing.",
    name: "Teodor Vass",
    trade: "Joiner",
    place: "Vass & Daughter, Ghent",
    edge: "#2a4775",
    ink: "#253f68",
  },
  {
    quote: "Booking a table used to take three emails. Now it takes a name and one tap.",
    name: "Ines Calloway",
    trade: "Tea room owner",
    place: "Calloway Rooms, Bath",
    edge: "#5c7b4c",
    ink: "#435a37",
  },
  {
    quote: "It finally looks like the work, and not like a template somebody else chose for us.",
    name: "Ravi Hale",
    trade: "Potter",
    place: "Hale Ceramics, Porto",
    edge: "#b7862b",
    ink: "#6f4f12",
  },
];

const HEADING = "Kind words, set in lead";
const KICKER = "Example quotes";
const HOLD_MS = 6800; // pause before the next card is taken down by itself
const LIFT_SPRING = 36; // stiffness of the lift
const LIFT_DAMP = 7.2; // lower = more overshoot as the card arrives
const PIN_SPEED = 3.4; // how fast the brass pin travels (units per second)
const MAX_PIXELS = 1_600_000;

/* ------------------------------------------------------------------ shaders */

const VERT = `#version 300 es
in vec2 aP; void main(){ gl_Position = vec4(aP,0.,1.); }`;

const SCENE = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uTime;
uniform vec3 uRo, uTa; uniform float uFov;
uniform vec3 uC[4]; uniform mat3 uR[4]; uniform vec3 uPin[4]; uniform vec3 uEdge[4];
uniform float uFocus, uAper; uniform vec3 uL;
uniform sampler2D uAtlas; uniform vec2 uTexel;
out vec4 fragColor;

const vec3 HE = vec3(0.45, 0.63, 0.018);
const float PR = 0.036;
const float SL = 0.11;
const vec3 LINEN = vec3(0.40, 0.335, 0.25);
const vec3 PAPER = vec3(0.84, 0.785, 0.675);
const vec3 INKC = vec3(0.035, 0.032, 0.03);
const vec3 BRASS = vec3(0.98, 0.74, 0.38);
const vec3 SUN = vec3(1.0, 0.80, 0.58) * 3.1;

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=p*2.03+7.1; a*=.5; } return s; }

float sdBox(vec3 p, vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.); }
float sdPin(vec3 p, vec3 h){
  vec3 q = p-h; float s = length(q*vec3(1.,1.,1.18))-PR;
  float r = length(q.xy)-0.0055; float z = max(q.z, -(q.z+SL+PR));
  float sh = length(max(vec2(r,z),0.))+min(max(r,z),0.);
  return min(s, sh);
}
float map(vec3 p){
  float d = 1e5;
  for(int i=0;i<4;i++){ d = min(d, sdBox((p-uC[i])*uR[i], HE)); d = min(d, sdPin(p, uPin[i])); }
  return d;
}
float softShadow(vec3 ro, vec3 rd){
  float res=1., t=0.006;
  for(int i=0;i<40;i++){ float h=map(ro+rd*t); res=min(res, 6.5*h/t); t+=clamp(h, 0.005, 0.3); if(res<0.002||t>5.) break; }
  return clamp(res,0.,1.);
}
float calcAO(vec3 p, vec3 n){
  float occ=0., sca=1.;
  for(int i=0;i<5;i++){ float h=0.012+0.07*float(i); occ+=(h-map(p+n*h))*sca; sca*=0.72; }
  return clamp(1.-2.4*occ, 0., 1.);
}
/* sunlight that reaches a point through the window: soft frame, glazing bars and a little leaf shade */
float windowLight(vec3 p){
  vec2 q = p.xy - uL.xy/uL.z*p.z;
  vec2 w = q - vec2(-0.35, 0.35);
  float frame = smoothstep(3.3, 2.6, abs(w.x + 0.25*w.y)) * smoothstep(2.4, 1.8, abs(w.y));
  vec2 g = vec2(q.x + 0.30*q.y + 0.55, q.y - 0.05*q.x + 0.35);
  float bx = abs(fract(g.x/2.05)-0.5)*2.05, by = abs(fract(g.y/2.3)-0.5)*2.3;
  float bars = mix(0.22, 1., smoothstep(0.018, 0.06, bx) * smoothstep(0.014, 0.05, by));
  float leaf = fbm(q*1.7 + vec2(uTime*0.05, sin(uTime*0.4)*0.06));
  float shade = mix(1., 0.25 + 0.75*smoothstep(0.42, 0.62, leaf), smoothstep(-0.2, -2.2, q.x) * smoothstep(-0.6, 1.4, q.y) * 0.75);
  return frame * bars * shade;
}
vec3 env(vec3 r){
  vec3 c = mix(vec3(0.07,0.055,0.04), vec3(0.20,0.17,0.13), smoothstep(-0.4, 0.6, r.y));
  c += vec3(0.45,0.47,0.52) * smoothstep(0.2, 0.9, r.z) * 0.6;
  float s = dot(r, uL); c += SUN * 0.9 * smoothstep(0.93, 0.985, s);
  return c;
}
float ggx(vec3 n, vec3 v, vec3 l, float rough){
  vec3 h = normalize(v+l); float a = rough*rough; float nh = max(dot(n,h),0.);
  float d = a*a/(3.14159*pow(nh*nh*(a*a-1.)+1., 2.));
  return d * max(dot(n,l),0.) / (4.*max(dot(n,v),0.15)*max(dot(n,l),0.15)+1e-3) * max(dot(n,l),0.);
}
vec2 boxHit(vec3 o, vec3 d, vec3 b, out vec3 n){
  vec3 m = 1./d; vec3 k = abs(m)*b; vec3 t1 = -m*o - k; vec3 t2 = -m*o + k;
  float tN = max(max(t1.x,t1.y),t1.z); float tF = min(min(t2.x,t2.y),t2.z);
  if(tN>tF || tF<0.) return vec2(-1.);
  n = -sign(d)*step(t1.yzx,t1.xyz)*step(t1.zxy,t1.xyz);
  return vec2(tN, tF);
}
float sphHit(vec3 o, vec3 d, vec3 c, float r){
  vec3 oc=o-c; float b=dot(oc,d); float h=b*b-dot(oc,oc)+r*r; if(h<0.) return -1.; return -b-sqrt(h);
}
float cylHit(vec3 o, vec3 d, vec3 c, float r, float len){
  vec2 oc=o.xy-c.xy; float a=dot(d.xy,d.xy); float b=dot(oc,d.xy); float cc=dot(oc,oc)-r*r; float h=b*b-a*cc;
  if(h<0.||a<1e-6) return -1.; float t=(-b-sqrt(h))/a; float z=o.z+d.z*t; if(z>c.z||z<c.z-len) return -1.; return t;
}

void main(){
  vec2 px = (2.*gl_FragCoord.xy - uRes)/uRes.y;
  vec3 fw = normalize(uTa-uRo); vec3 rt = normalize(cross(fw, vec3(0,1,0))); vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw + (px.x*rt + px.y*up)*uFov);
  vec3 ro = uRo;

  float tb = 1e9; int obj = -1; int id = 0; vec3 nl = vec3(0,0,1); vec3 lp = vec3(0);
  if(rd.z < 0.){ tb = -ro.z/rd.z; obj = 0; }
  for(int i=0;i<4;i++){
    vec3 n; vec3 o=(ro-uC[i])*uR[i]; vec3 d=rd*uR[i];
    vec2 h = boxHit(o, d, HE, n);
    if(h.x>0. && h.x<tb){ tb=h.x; obj=1; id=i; nl=n; lp=o+d*h.x; }
    float s = sphHit(ro*vec3(1,1,1.18), normalize(rd*vec3(1,1,1.18)), uPin[i]*vec3(1,1,1.18), PR);
    if(s>0.){ vec3 hp=(ro*vec3(1,1,1.18)+normalize(rd*vec3(1,1,1.18))*s)/vec3(1,1,1.18); float ts=length(hp-ro); if(ts<tb){ tb=ts; obj=2; id=i; } }
    float c = cylHit(ro, rd, uPin[i], 0.0055, SL+PR);
    if(c>0. && c<tb){ tb=c; obj=3; id=i; }
  }
  vec3 p = ro + rd*tb; vec3 v = -rd;
  vec3 n = vec3(0,0,1); vec3 alb = LINEN; float rough = 0.85; float f0 = 0.025; float metal = 0.; float cav = 1.;

  if(obj==0){
    float fp = tb*uFov*2./uRes.y;
    vec2 u = p.xy*175.;
    float sx = sign(sin(u.x*0.5)*sin(u.y*0.5));
    float fade = clamp(1. - fp*140., 0., 1.);
    vec2 e = vec2(0.35, 0.);
    #define WV(q) max(pow(abs(sin((q).y)),0.6)*(0.62+0.38*sx), pow(abs(sin((q).x)),0.6)*(0.62-0.38*sx))
    float h0 = WV(u); float hx = WV(u+e.xy); float hy = WV(u+e.yx);
    n = normalize(vec3(-(hx-h0)*0.55*fade, -(hy-h0)*0.55*fade, 1.));
    float slub = fbm(vec2(p.x*9., p.y*120.))*0.5 + fbm(vec2(p.x*130., p.y*8.))*0.5;
    alb = LINEN * (0.86 + 0.26*slub) * mix(1., 0.82 + 0.3*h0, fade);
    rough = 0.95;
  } else if(obj==1){
    vec3 nw = uR[id]*nl;
    if(nl.z > 0.5){
      vec2 uv = lp.xy/HE.xy*0.5+0.5;
      vec2 tc = vec2((float(id)+uv.x)/4., 1.-uv.y);
      vec4 t = texture(uAtlas, tc);
      vec2 du = vec2(uTexel.x*1.5, 0.), dv = vec2(0., uTexel.y*1.5);
      float hx = texture(uAtlas, tc+du).r - texture(uAtlas, tc-du).r;
      float hy = texture(uAtlas, tc-dv).r - texture(uAtlas, tc+dv).r;
      float ew = uTexel.x*1.5*2.*HE.x*2.*4.;
      float D = 0.0065;
      vec3 nn = normalize(vec3(D*hx/ew, D*hy/ew, 1.));
      vec2 ed = HE.xy - abs(lp.xy);
      float rim = 1. - smoothstep(0., 0.006, min(ed.x, ed.y));
      nn = normalize(nn + vec3(sign(lp.xy)*step(ed.yx, ed.xy)*rim*0.0, 0.) + vec3(sign(lp.x)*(1.-smoothstep(0.,0.006,ed.x)), sign(lp.y)*(1.-smoothstep(0.,0.006,ed.y)), 0.)*0.8);
      n = normalize(uR[id]*nn);
      float fib = fbm(lp.xy*vec2(260., 300.)); float fib2 = vnoise(lp.xy*vec2(900., 40.));
      alb = PAPER * (0.95 + 0.06*fib + 0.025*fib2);
      vec3 inkc = mix(INKC, uEdge[id]*0.5, t.b);
      float mott = 0.93 + 0.07*vnoise(lp.xy*900.) + 0.04*vnoise(lp.xy*90.);
      alb = mix(alb, inkc, clamp(t.g*mott*1.05, 0., 1.));
      rough = mix(0.62, 0.42, t.g); f0 = mix(0.03, 0.045, t.g);
      cav = 1. - 0.22*t.r;
    } else if(nl.z < -0.5){
      n = nw; alb = PAPER*0.92;
    } else {
      n = nw;
      float ln = fbm(lp.xy*vec2(140., 140.) + lp.z*400.);
      alb = uEdge[id] * (0.92 + 0.14*ln);
      rough = 0.7;
    }
  } else if(obj==2){
    vec3 q = p - uPin[id]; n = normalize(q*vec3(1.,1.,1.18*1.18));
    alb = BRASS; metal = 1.; rough = 0.22 + 0.08*vnoise(q.xy*300.);
  } else if(obj==3){
    vec3 q = p - uPin[id]; n = normalize(vec3(q.xy, 0.));
    alb = vec3(0.62,0.62,0.6); metal = 1.; rough = 0.3;
  }

  vec3 L = uL;
  float ndl = max(dot(n, L), 0.);
  float sh = ndl > 0. ? softShadow(p + n*0.004, L) : 0.;
  float wl = windowLight(p);
  float ao = calcAO(p + n*0.002, n) * cav;
  vec3 amb = mix(vec3(0.30,0.24,0.18), vec3(0.40,0.45,0.55), 0.5+0.5*n.y) * (0.42 + 0.3*n.z);
  vec3 col;
  if(metal > 0.5){
    vec3 r = reflect(rd, n);
    float fr = pow(1.-max(dot(n,v),0.), 5.);
    vec3 F = alb + (1.-alb)*fr;
    float rs = softShadow(p + n*0.004, r);
    col = env(r) * F * mix(0.35, 1., rs) * ao;
    col += SUN * F * ggx(n, v, L, rough) * sh * wl * 1.2;
    col += alb * 0.04 * amb;
  } else {
    vec3 diff = alb * (SUN * ndl * sh * wl + amb * ao);
    float spec = ggx(n, v, L, rough) * sh * wl;
    float fr = f0 + (1.-f0)*pow(1.-max(dot(n,v),0.), 5.);
    col = diff + SUN * spec * fr * 0.9;
  }
  // gentle room falloff away from the window
  if(obj==0) col *= mix(0.8, 1.0, smoothstep(-3.0, 0.5, p.y + 0.2*p.x));

  col *= 0.95;
  vec3 a = col*(2.51*col+0.03); vec3 b = col*(2.43*col+0.59)+0.14;
  col = clamp(a/b, 0., 1.);
  col = pow(col, vec3(1./2.2));

  float coc = clamp(uAper * abs(tb - uFocus) / tb, 0., 1.);
  fragColor = vec4(col, coc);
}`;

const POST = `#version 300 es
precision highp float;
uniform sampler2D uTex; uniform vec2 uRes; uniform float uMaxR; uniform float uTime;
out vec4 fragColor;
float hash(vec2 p){ p = fract(p*vec2(443.897, 441.423)); p += dot(p, p.yx+19.19); return fract((p.x+p.y)*p.x); }
void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  vec4 c = texture(uTex, uv);
  float cc = c.a; vec3 acc = c.rgb; float w = 1.;
  if(cc*uMaxR > 0.7){
    float jr = hash(gl_FragCoord.xy)*6.2831;
    for(int i=1;i<48;i++){
      float fi = float(i); float r = sqrt((fi - hash(gl_FragCoord.yx+fi)*0.5)/47.)*uMaxR; float a = fi*2.39996323 + jr;
      vec4 s = texture(uTex, uv + vec2(cos(a), sin(a))*r/uRes);
      float reach = min(s.a, cc)*uMaxR;
      float ww = clamp(reach - r + 1., 0., 1.);
      acc += s.rgb*ww; w += ww;
    }
  }
  vec3 col = acc/w;
  if(cc < 0.08){
    vec2 px = 1./uRes;
    vec3 n1 = texture(uTex, uv+vec2(px.x,0.)).rgb, n2 = texture(uTex, uv-vec2(px.x,0.)).rgb;
    vec3 n3 = texture(uTex, uv+vec2(0.,px.y)).rgb, n4 = texture(uTex, uv-vec2(0.,px.y)).rgb;
    vec3 lw = vec3(0.299,0.587,0.114);
    float lh = abs(dot(n1-n2, lw)), lv = abs(dot(n3-n4, lw));
    vec3 along = lh > lv ? (n3+n4)*0.5 : (n1+n2)*0.5;
    col = mix(col, along, clamp(max(lh,lv)*2.2, 0., 0.45));
  }
  vec2 q = uv - 0.5; col *= 1. - 0.32*dot(q*vec2(1.1,1.3), q*vec2(1.1,1.3));
  col += (hash(gl_FragCoord.xy + fract(uTime*7.)*91.) - 0.5) * 0.028;
  fragColor = vec4(col, 1.);
}`;

/* ------------------------------------------------------------------ helpers */

type V3 = [number, number, number];
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
const toLin = (hex: string): V3 => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.pow(c / 255, 2.2)) as V3;
};

/** Rotation Rz(roll) * Ry(yaw) * Rx(pitch), returned column-major for a GLSL mat3. */
function rotation(pitch: number, yaw: number, roll: number) {
  const [cx, sx, cy, sy, cz, sz] = [Math.cos(pitch), Math.sin(pitch), Math.cos(yaw), Math.sin(yaw), Math.cos(roll), Math.sin(roll)];
  const m = [
    [cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx],
    [sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx],
    [-sy, cy * sx, cy * cx],
  ];
  return { m, col: [m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]] };
}
const apply = (m: number[][], v: V3): V3 => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];

const HE: V3 = [0.45, 0.63, 0.018];
const PIN_DROP = 0.085; // pin sits this far below the top edge of a card
const PR = 0.036;
const SLOTS: { x: number; y: number; tilt: number }[] = [
  { x: 0.98, y: 0.76, tilt: 0.045 },
  { x: 2.2, y: 0.82, tilt: -0.03 },
  { x: 1.04, y: -0.82, tilt: -0.02 },
  { x: 2.24, y: -0.76, tilt: 0.05 },
];

const TW = 768;
const TH = 1075;

/** Draws every card face into one atlas: red = depth of the bite, green = ink, blue = ink is the edge colour. */
function buildAtlas() {
  const atlas = document.createElement("canvas");
  atlas.width = TW * cards.length;
  atlas.height = TH;
  const out = atlas.getContext("2d")!;
  const img = out.createImageData(atlas.width, TH);
  const layer = () => {
    const c = document.createElement("canvas");
    c.width = TW;
    c.height = TH;
    return [c, c.getContext("2d")!] as const;
  };
  const serif = 'Georgia, "Times New Roman", serif';
  const sans = '"Inter Tight", "Inter", "Helvetica Neue", Arial, sans-serif';
  cards.forEach((card, i) => {
    const [dc, d] = layer();
    const [ic, ink] = layer();
    const [ec, edge] = layer();
    for (const g of [d, ink, edge]) {
      g.fillStyle = "#000";
      g.fillRect(0, 0, TW, TH);
      g.fillStyle = "#fff";
      g.textBaseline = "alphabetic";
    }
    const both = (fn: (g: CanvasRenderingContext2D) => void, target: CanvasRenderingContext2D | null) => {
      fn(d);
      if (target) fn(target);
    };
    const spaced = (g: CanvasRenderingContext2D, px: string) => {
      (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = px;
    };
    // number, top left, blind
    both((g) => {
      g.font = `600 30px ${sans}`;
      spaced(g, "6px");
      g.textAlign = "left";
      g.fillText(`NO. 0${i + 1}`, 70, 110);
      g.textAlign = "right";
      g.fillText("EXAMPLE", TW - 70, 110);
      spaced(g, "0px");
    }, null);
    // the large initial, inked in the edge colour
    both((g) => {
      g.font = `700 560px ${serif}`;
      g.textAlign = "center";
      g.fillText(card.name[0], TW / 2, 640);
    }, edge);
    both((g) => {
      g.font = `700 560px ${serif}`;
      g.textAlign = "center";
      g.fillText(card.name[0], TW / 2, 640);
    }, ink);
    // rule
    both((g) => g.fillRect(70, 720, TW - 140, 4), ink);
    // name, inked dark
    both((g) => {
      g.font = `400 64px ${serif}`;
      g.textAlign = "left";
      g.fillText(card.name, 70, 820);
    }, ink);
    // trade and place, blind
    both((g) => {
      g.font = `600 27px ${sans}`;
      spaced(g, "5px");
      g.textAlign = "left";
      g.fillText(card.trade.toUpperCase(), 70, 896);
      g.fillText(card.place.toUpperCase(), 70, 944);
      spaced(g, "0px");
    }, null);
    const [bc, b] = layer();
    b.filter = "blur(2.8px)";
    b.drawImage(dc, 0, 0);
    const D = b.getImageData(0, 0, TW, TH).data;
    const I = ink.getImageData(0, 0, TW, TH).data;
    const E = edge.getImageData(0, 0, TW, TH).data;
    void bc;
    void ic;
    void ec;
    for (let y = 0; y < TH; y++) {
      for (let x = 0; x < TW; x++) {
        const s = (y * TW + x) * 4;
        const o = (y * atlas.width + i * TW + x) * 4;
        img.data[o] = D[s];
        img.data[o + 1] = I[s];
        img.data[o + 2] = E[s];
        img.data[o + 3] = 255;
      }
    }
  });
  out.putImageData(img, 0, 0);
  return atlas;
}

/* ------------------------------------------------------------------ component */

export default function LetterpressCardTestimonials() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [glOk, setGlOk] = useState(true);
  const [paused, setPaused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(0);
  const kick = useRef<() => void>(() => {});

  const go = useCallback((i: number) => {
    const n = ((i % cards.length) + cards.length) % cards.length;
    activeRef.current = n;
    setActive(n);
    kick.current();
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = window.setTimeout(() => go(activeRef.current + 1), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [active, paused, go]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) {
      setGlOk(false);
      return;
    }
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || "shader");
      return sh;
    };
    const program = (fs: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, "aP");
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
      return p;
    };
    let scene: WebGLProgram, post: WebGLProgram;
    try {
      scene = program(SCENE);
      post = program(POST);
    } catch (err) {
      console.warn(err);
      setGlOk(false);
      return;
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const atlasTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, buildAtlas());
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);

    const fbTex = gl.createTexture();
    const fb = gl.createFramebuffer();
    let W = 1,
      H = 1,
      scale = 1;
    const resize = () => {
      const r = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * scale;
      let w = Math.max(2, Math.round(r.width * dpr));
      let h = Math.max(2, Math.round(r.height * dpr));
      const k = Math.sqrt(MAX_PIXELS / (w * h));
      if (k < 1) {
        w = Math.round(w * k);
        h = Math.round(h * k);
      }
      W = w;
      H = h;
      canvas.width = w;
      canvas.height = h;
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, fbTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      dirty = true;
    };

    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = {
      res: U(scene, "uRes"),
      time: U(scene, "uTime"),
      ro: U(scene, "uRo"),
      ta: U(scene, "uTa"),
      fov: U(scene, "uFov"),
      c: U(scene, "uC"),
      r: U(scene, "uR"),
      pin: U(scene, "uPin"),
      edge: U(scene, "uEdge"),
      focus: U(scene, "uFocus"),
      aper: U(scene, "uAper"),
      l: U(scene, "uL"),
      atlas: U(scene, "uAtlas"),
      texel: U(scene, "uTexel"),
    };
    const pu = { tex: U(post, "uTex"), res: U(post, "uRes"), maxR: U(post, "uMaxR"), time: U(post, "uTime") };
    const edges = new Float32Array(cards.flatMap((c) => toLin(c.edge)));
    const sun = norm([-0.3, 0.36, 0.88]);
    const FOV = 0.33;

    // per card: lift l (spring), its velocity, pin travel p (0 in card, 1 held out, 2 pushed into the board)
    const st = cards.map((_, i) => ({ l: i === activeRef.current ? 1 : 0, v: 0, p: i === activeRef.current ? 2 : 0 }));
    let dirty = true;
    let visible = true;
    let raf = 0;
    let last = performance.now();
    const t0 = last;
    let px = 0,
      py = 0,
      spx = 0,
      spy = 0;
    let slow = 0,
      frames = 0,
      fpsT = last;

    const layout = () => {
      const r = stage.getBoundingClientRect();
      const phone = r.width < 640;
      const aspect = r.width / Math.max(1, r.height);
      if (phone) {
        const d = Math.max(6.2, 1.62 / (FOV * aspect));
        return { ro: [1.62, -0.02, d] as V3, ta: [1.62, -0.02, 0] as V3, lift: [1.62, 0.02, 2.05] as V3 };
      }
      // keep the whole cluster in the right half however wide the section is
      const d = Math.max(5.75, 2.7 / (0.54 * 2 * FOV * aspect));
      const cx = Math.max(0.42, 3.15 - d * FOV * aspect);
      return { ro: [cx - 0.08, 0.06, d] as V3, ta: [cx, 0.0, 0] as V3, lift: [1.62, 0.04, 2.1] as V3 };
    };

    const boardPose = (i: number) => {
      const s = SLOTS[i];
      const R = rotation(-0.035, 0, s.tilt);
      const pinPt: V3 = [s.x, s.y + HE[1] - PIN_DROP, 0];
      const off = apply(R.m, [0, -(HE[1] - PIN_DROP), 0]);
      const c: V3 = [pinPt[0] + off[0], pinPt[1] + off[1], off[2] + HE[2] + 0.0015];
      return { c, pinPt, ang: [-0.035, 0, s.tilt] as V3 };
    };

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      const L = layout();
      spx += (px - spx) * 0.06;
      spy += (py - spy) * 0.06;
      const ro: V3 = [L.ro[0] + spx * 0.16 + Math.sin(t * 0.21) * 0.04, L.ro[1] - spy * 0.1 + Math.sin(t * 0.17) * 0.03, L.ro[2]];
      const C: number[] = [];
      const Rm: number[] = [];
      const P: number[] = [];
      let focusL = 0;
      let focusD = Math.hypot(ro[0] - L.ta[0], ro[1] - L.ta[1], ro[2]);
      st.forEach((s, i) => {
        const b = boardPose(i);
        const k = clamp(s.l, -0.2, 1.2);
        const e = ease(k) + (k > 1 ? (k - 1) : 0);
        const to = norm(sub(ro, L.lift));
        const yawL = Math.atan2(to[0], to[2]) + 0.26 + Math.sin(t * 0.5) * 0.07 + spx * 0.12;
        const pitchL = -Math.asin(to[1]) + Math.sin(t * 0.7) * 0.035 - spy * 0.08;
        const rollL = Math.sin(t * 0.43) * 0.03 - 0.025;
        const arc = Math.sin(Math.PI * clamp(k, 0, 1));
        const ang: V3 = [mix(b.ang[0], pitchL, e) - 0.35 * arc, mix(b.ang[1], yawL, e) + 0.42 * arc, mix(b.ang[2], rollL, e)];
        const lift: V3 = [L.lift[0], L.lift[1] + Math.sin(t * 0.9) * 0.02 * e, L.lift[2]];
        const c: V3 = [mix(b.c[0], lift[0], e), mix(b.c[1], lift[1], e) + 0.12 * arc, mix(b.c[2], lift[2], e) + 0.35 * arc];
        const R = rotation(ang[0], ang[1], ang[2]);
        C.push(...c);
        Rm.push(...R.col);
        const zCard = 2 * HE[2] + 0.002 + PR * 0.72;
        const zHold = 0.22;
        const zBoard = PR * 0.72 + 0.004;
        const z = s.p <= 1 ? mix(zCard, zHold, ease(s.p)) : mix(zHold, zBoard, ease(s.p - 1));
        P.push(b.pinPt[0], b.pinPt[1], z);
        if (e > focusL) {
          focusL = e;
        }
        if (i === activeRef.current) focusD = mix(focusD, Math.hypot(ro[0] - c[0], ro[1] - c[1], ro[2] - c[2]), clamp(e, 0, 1));
      });

      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.viewport(0, 0, W, H);
      gl.useProgram(scene);
      gl.uniform2f(su.res, W, H);
      gl.uniform1f(su.time, t);
      gl.uniform3fv(su.ro, ro);
      gl.uniform3fv(su.ta, L.ta);
      gl.uniform1f(su.fov, FOV);
      gl.uniform3fv(su.c, C);
      gl.uniformMatrix3fv(su.r, false, Rm);
      gl.uniform3fv(su.pin, P);
      gl.uniform3fv(su.edge, edges);
      gl.uniform1f(su.focus, focusD);
      gl.uniform1f(su.aper, 1.15 * clamp(focusL, 0, 1));
      gl.uniform3fv(su.l, sun);
      gl.uniform1i(su.atlas, 0);
      gl.uniform2f(su.texel, 1 / (TW * cards.length), 1 / TH);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(post);
      gl.uniform1i(pu.tex, 1);
      gl.uniform2f(pu.res, W, H);
      gl.uniform1f(pu.maxR, (H / 720) * 15);
      gl.uniform1f(pu.time, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const step = (dt: number) => {
      let moving = false;
      st.forEach((s, i) => {
        const sel = i === activeRef.current;
        let lT: number, pT: number;
        if (sel) {
          pT = s.l > 0.45 ? 2 : 1;
          lT = s.p >= 0.98 ? 1 : 0;
        } else {
          pT = s.p > 1.01 ? 1 : s.l < 0.04 ? 0 : 1;
          lT = s.p <= 1.02 ? 0 : 1;
        }
        if (reduce) {
          s.l = sel ? 1 : 0;
          s.v = 0;
          s.p = sel ? 2 : 0;
          return;
        }
        const dp = pT - s.p;
        s.p += Math.sign(dp) * Math.min(Math.abs(dp), PIN_SPEED * dt);
        s.v += (LIFT_SPRING * (lT - s.l) - LIFT_DAMP * s.v) * dt;
        s.l += s.v * dt;
        if (Math.abs(dp) > 1e-3 || Math.abs(lT - s.l) > 1e-3 || Math.abs(s.v) > 1e-3) moving = true;
      });
      return moving;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      if (reduce && !dirty) {
        raf = 0;
        return;
      }
      draw(reduce ? t0 : now);
      dirty = false;
      frames++;
      if (dt > 0.024) slow++;
      else slow = Math.max(0, slow - 1);
      if (slow > 40 && scale > 0.55) {
        scale *= 0.85;
        slow = 0;
        resize();
      }
      if (now - fpsT > 1000) {
        canvas.dataset.fps = String(Math.round((frames * 1000) / (now - fpsT)));
        frames = 0;
        fpsT = now;
      }
      if (visible) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const start = () => {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    kick.current = () => {
      dirty = true;
      start();
    };

    const ro = new ResizeObserver(() => {
      resize();
      start();
    });
    ro.observe(stage);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !document.hidden;
      start();
    });
    io.observe(stage);
    const vis = () => {
      visible = !document.hidden;
      start();
    };
    document.addEventListener("visibilitychange", vis);
    const move = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      px = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      py = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    };
    const leave = () => {
      px = 0;
      py = 0;
    };
    const click = (e: MouseEvent) => {
      const r = stage.getBoundingClientRect();
      const L = layout();
      const fw = norm(sub(L.ta, L.ro));
      const rt = norm(cross(fw, [0, 1, 0]));
      const up = cross(rt, fw);
      let best = -1,
        bd = 1e9;
      SLOTS.forEach((s, i) => {
        if (i === activeRef.current) return;
        const d = sub([s.x, s.y, 0], L.ro);
        const z = dot(d, fw);
        const sx = r.width / 2 + (dot(d, rt) / (z * FOV)) * (r.height / 2);
        const sy = r.height / 2 - (dot(d, up) / (z * FOV)) * (r.height / 2);
        const dd = Math.hypot(sx - (e.clientX - r.left), sy - (e.clientY - r.top));
        if (dd < bd) {
          bd = dd;
          best = i;
        }
      });
      if (best >= 0 && bd < r.height * 0.22) go(best);
    };
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerleave", leave);
    stage.addEventListener("click", click);
    resize();
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
      stage.removeEventListener("click", click);
      kick.current = () => {};
      gl.deleteTexture(atlasTex);
      gl.deleteTexture(fbTex);
      gl.deleteFramebuffer(fb);
      gl.deleteBuffer(buf);
      gl.deleteProgram(scene);
      gl.deleteProgram(post);
    };
  }, [reduce, go]);

  const card = cards[active];
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(active - 1);
    }
  };

  return (
    <section
      ref={wrapRef}
      aria-roledescription="carousel"
      aria-label="Example quotes on letterpress cards"
      onKeyDown={onKey}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative w-full overflow-hidden bg-[#a8987f] text-[#2a2119]"
    >
      <style>{`
        @keyframes lpq-in { from { opacity: 0; transform: translateY(14px); filter: blur(6px); } to { opacity: 1; transform: none; filter: blur(0); } }
        .lpq-in { animation: lpq-in 900ms cubic-bezier(.2,.8,.2,1) 420ms both; }
        @media (prefers-reduced-motion: reduce) { .lpq-in { animation: none; } }
      `}</style>
      <div className="relative flex flex-col sm:block sm:h-[720px]">
        <div ref={stageRef} className="relative order-1 h-[440px] w-full cursor-pointer sm:absolute sm:inset-0 sm:h-full" aria-hidden="true">
          {glOk ? (
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          ) : (
            <StillBoard active={active} />
          )}
        </div>

        <div className="relative order-2 bg-[#b9a88d] px-5 pb-10 pt-8 sm:absolute sm:inset-y-0 sm:left-0 sm:flex sm:w-[46%] sm:flex-col sm:justify-center sm:bg-transparent sm:pl-[6%] sm:pr-0 sm:pt-0">
          <h2 className="font-['Inter_Tight','Inter',ui-sans-serif,system-ui] text-[13px] font-semibold uppercase tracking-[0.22em] text-[#3a2e22]">
            {HEADING}
            <span className="ml-3 font-medium normal-case tracking-[0.04em] text-[#4a3c2e]">{KICKER}</span>
          </h2>
          <div aria-live="polite" className="mt-6 sm:mt-8">
            <figure key={active} className="lpq-in">
              <blockquote className="font-['Iowan_Old_Style','Palatino_Linotype',Palatino,'Book_Antiqua',Georgia,serif] text-[31px] leading-[1.12] tracking-[-0.012em] text-[#231b14] sm:text-[44px] lg:text-[52px]">
                <span aria-hidden="true" className="mr-1" style={{ color: card.ink }}>
                  &ldquo;
                </span>
                {card.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-7 flex items-center gap-3 font-['Inter_Tight','Inter',ui-sans-serif,system-ui]">
                <span aria-hidden="true" className="h-[3px] w-8 rounded-full" style={{ background: card.ink }} />
                <span className="text-[17px] font-semibold tracking-[-0.01em] text-[#231b14]">{card.name}</span>
                <span className="text-[15px] text-[#3f3226]">
                  {card.trade}, {card.place}
                </span>
              </figcaption>
            </figure>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-2 font-['Inter_Tight','Inter',ui-sans-serif,system-ui]">
            <button
              type="button"
              onClick={() => go(active - 1)}
              aria-label="Previous card"
              className="grid h-11 w-11 place-items-center rounded-full border border-[#2a2119]/30 bg-[#efe6d6]/70 text-[#2a2119] transition hover:bg-[#f6efe3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a2119]"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              aria-label="Next card"
              className="grid h-11 w-11 place-items-center rounded-full border border-[#2a2119]/30 bg-[#efe6d6]/70 text-[#2a2119] transition hover:bg-[#f6efe3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a2119]"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <ul className="ml-1 flex flex-wrap gap-1.5" aria-label="Choose a card">
              {cards.map((c, i) => (
                <li key={c.name}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-pressed={i === active}
                    aria-label={`Card ${i + 1}: ${c.name}`}
                    className={`flex h-11 items-center gap-2 rounded-full px-3 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a2119] ${
                      i === active ? "bg-[#2a2119] text-[#f4ecdf]" : "text-[#2a2119] hover:bg-[#efe6d6]/60"
                    }`}
                  >
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c.edge }} />
                    {c.name.split(" ")[0]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Flat composition shown when WebGL is not available. */
function StillBoard({ active }: { active: number }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: "#a8987f",
        backgroundImage:
          "radial-gradient(120% 90% at 22% 18%, rgba(255,226,180,0.55), rgba(255,226,180,0) 60%), repeating-linear-gradient(0deg, rgba(60,45,30,0.07) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(60,45,30,0.06) 0 1px, transparent 1px 3px)",
      }}
    >
      <div className="absolute inset-y-0 right-[4%] grid w-[52%] grid-cols-2 place-items-center gap-6 p-8 max-sm:inset-x-0 max-sm:w-full">
        {cards.map((c, i) => (
          <div
            key={c.name}
            className="relative aspect-[5/7] w-[min(170px,38vw)] bg-[#efe8da] p-3 shadow-[0_1px_0_rgba(0,0,0,0.15),6px_10px_18px_rgba(40,25,10,0.28)]"
            style={{ borderRight: `3px solid ${c.edge}`, borderBottom: `3px solid ${c.edge}`, opacity: i === active ? 1 : 0.88, transform: `rotate(${SLOTS[i].tilt * 57}deg)` }}
          >
            <span className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff3c8,#c9962e_45%,#6d4a12)] shadow-[2px_3px_3px_rgba(0,0,0,0.35)]" />
            <div className="mt-6 text-center font-serif text-[64px] font-bold leading-none" style={{ color: c.edge, textShadow: "0 1px 0 rgba(255,255,255,0.7), 0 -1px 0 rgba(0,0,0,0.25)" }}>
              {c.name[0]}
            </div>
            <div className="mt-4 border-t border-[#2a2119]/40 pt-2 font-serif text-[13px] text-[#231b14]">{c.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
