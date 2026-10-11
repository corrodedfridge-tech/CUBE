(()=>{
/* CUBE v3.3 - the whole game.
   Written as separate modules and concatenated in order; the banner above each one
   says which file it was, so you can find things by searching for the banner. */


/* ==================== 00-assets.js */
/* ================= ASSETS =================
   Every sprite and clip in the game, as a path. The bundler (tools/bundle.py) swaps each
   of these for a data URI when it folds the game into one file; here they stay paths, so
   the repository holds real pngs and mp3s instead of four megabytes of base64. */
const KA={img:{ball1:'assets/knight/ball1.png',ball2:'assets/knight/ball2.png',ball3:'assets/knight/ball3.png',ball4:'assets/knight/ball4.png',ball5:'assets/knight/ball5.png',t0:'assets/knight/t0.png',t1:'assets/knight/t1.png',t2:'assets/knight/t2.png',t3:'assets/knight/t3.png',idle:'assets/knight/idle.png',r1:'assets/knight/r1.png',r2:'assets/knight/r2.png',r3:'assets/knight/r3.png'},aud:{music:'assets/knight/music.mp3',vac:'assets/knight/vac.mp3',roar:'assets/knight/roar.mp3'}};
/* Lava assets (originals: https://github.com/corrodedfridge-tech/cube./main/<file>) */const LA={img:{lava:'assets/lava/lava.png'},aud:{lava:'assets/lava/lava.mp3'}};
const FL={n:20,fw:100,fh:103,img:{"body": "assets/matthew/body.png", "handA": "assets/matthew/handA.png", "handB": "assets/matthew/handB.png", "chain": "assets/matthew/chain.png", "bullet": "assets/matthew/bullet.png", "hazard": "assets/matthew/hazard.png", "bomb": "assets/matthew/bomb.png", "face2": "assets/matthew/face2.png", "sweep": "assets/matthew/sweep.png", "scream": "assets/matthew/scream.png", "lance": "assets/matthew/lance.png", "face3": "assets/matthew/face3.png", "boom": "assets/matthew/boom.png"},mus:"assets/matthew/mus.mp3",chs:"assets/matthew/chs.mp3",bms:"assets/matthew/bms.mp3",wps:"assets/matthew/wps.mp3",rls:"assets/matthew/rls.mp3"};

/* ==================== 00-intro.js */
'use strict';

/* ===========================================================================
   >>> CORNER VIDEO — THIS IS THE LINE TO EDIT <<<

   Paste a link to your clip between the quotes. A normal GitHub page link
   works — the one you get from the "Copy link" button on the file, e.g.
     https://github.com/corrodedfridge-tech/cube./blob/main/my-clip.mp4
   A direct link to any .mp4 or .webm works too.
   Leave it as '' and the panel draws its own animation instead.

   Use H.264 .mp4 or VP9 .webm — HEVC/H.265 only plays in Safari.
=========================================================================== */
const FEED_URL = 'https://github.com/corrodedfridge-tech/cube./blob/main/snaptik_7684375027839405333_v3.mp4';
/* ======================================================================== */

/* ==================== 01-util.js */
/* ================= UTIL ================= */
const $=id=>document.getElementById(id);
const TAU=Math.PI*2,rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const damp=(a,b,k,dt)=>lerp(a,b,1-Math.exp(-k*dt)); // frame-rate independent smoothing
const easeOutBack=t=>1+2.70158*Math.pow(t-1,3)+1.70158*Math.pow(t-1,2);
const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const TOUCH=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;   // phone/tablet: thumb controls + lighter effects
const DBG=/[?&]debug(\b|=)/.test(location.search);                                 // ?debug unlocks the boss-summon keys
const mq=matchMedia('(prefers-reduced-motion: reduce)');let reduce=mq.matches;
if(mq.addEventListener)mq.addEventListener('change',e=>{reduce=e.matches});

/* ==================== 02-state.js */
/* ================= GAME STATE ================= */
const AW=1000,AH=640,MAXV=430,CTRL='WASD / ARROWS · SPACE FIRE · P PAUSE · M MUTE';
const G={state:'menu',tp:0,upT:8,kn:0,kT:-999,surgeT:0,t:0,diff:0,speed:210,next:1,bonus:0,score:0,nmCd:0,tr:0,fl:0,fc:0,dyT:0,overT:0,nb:false,chain:0,chainT:0,nm:0,kills:0,maxChain:0};
let clock=0,ts=1,slowT=0,slowTo=1,freeze=0,best=+store.get('cube-best','0')||0,last=performance.now();
const cam={x:0,y:0,z:1,zk:0};
const shake=a=>{G.tr=Math.min(1,G.tr+a*(reduce?.2:1)*SHKM)};  // camera trauma, scaled by the setting
const slow=(t,to)=>{if(!reduce){slowT=t;slowTo=to}};          // brief time dilation

/* ==================== 03-canvas.js */
/* ================= CANVAS ================= */
const cv=$('c'),ctx=cv.getContext('2d');
let vw=0,vh=0,dpr=1,scale=1;
let port=false,arCY=.52;
function resize(){
  dpr=Math.min(window.devicePixelRatio||1,TOUCH?1.5:2);                 // fewer pixels to push on a phone
  vw=Math.max(1,innerWidth||0);vh=Math.max(1,innerHeight||0);   // an embedded pane can report 0 mid-resize
  cv.width=Math.round(vw*dpr);cv.height=Math.round(vh*dpr);
  port=vh>vw;document.body.classList.toggle('port',port);
  // portrait is width-bound so the arena rides high and leaves the lower half to thumbs;
  // landscape fills the height and puts the HUD in the side gutters instead.
  scale=Math.max(1e-4,Math.min(vw*(TOUCH?.98:.92)/AW,vh*(TOUCH?(port?.46:.80):.68)/AH));
  arCY=TOUCH?(port?.33:.42):.52;
  const ah=AH*scale,st=document.documentElement.style;                  // the HUD anchors to these
  st.setProperty('--art',(vh*arCY-ah/2).toFixed(1)+'px');
  st.setProperty('--arb',(vh*arCY+ah/2).toFixed(1)+'px');
}
addEventListener('resize',resize);resize();

/* ==================== 04-ui.js */
/* ================= UI ================= */
// Screens (title / pause / game over) are DOM overlays with keyboard + mouse navigation; the HUD is a DOM layer over the canvas.
const hudEl=$('hud'),scoreEl=$('score'),bestEl=$('best'),muteBtn=$('mute'),pauseBtn=$('bp');
const VER='3.3';
const SC={menu:$('menu'),pause:$('pause'),over:$('over'),cards:$('cards'),win:$('win'),shop:$('shop'),settings:$('settings'),awards:$('awards'),bank:$('bank')};
let scr=null,focusI=0;
const fmt=n=>Math.round(n).toLocaleString('en-US');
const fmtT=s=>((s/60)|0)+':'+('0'+((s|0)%60)).slice(-2);
const btns=()=>scr?[...SC[scr].querySelectorAll('.btn')].filter(b=>b.offsetParent!==null):[];   // hidden entries are not focusable
function focusBtn(d){const b=btns();if(!b.length)return;if(d)focusI=(focusI+d+b.length)%b.length;b.forEach((x,i)=>x.classList.toggle('on',i===focusI))}
function show(n){scr=n;for(const k in SC)SC[k].classList.toggle('on',k===n);cv.className=n==='menu'?'bl':n?'dim':'';focusI=0;focusBtn()}
const nameplate=(on,nm,bar)=>{if(nm)$('bnm').textContent=nm;
  $('boss').classList.toggle('nobar',on&&bar===false);$('boss').classList.toggle('on',!!on)};
function hudUpdate(){scoreEl.textContent=fmt(G.score);bestEl.textContent='Best '+fmt(Math.max(best,G.score))}
function verStamp(){const e=$('verl');if(e)e.textContent='v'+VER}
function hsUpdate(){$('hs').textContent=best?'Best '+fmt(best):'';
  const e=$('shm');if(e)e.textContent=shards?fmt(shards)+' ◆ to spend':''}
function countUp(el,to,ms){const t0=performance.now();(function f(){const u=Math.min(1,(performance.now()-t0)/ms);el.textContent=fmt(to*(1-Math.pow(1-u,3)));if(u<1)requestAnimationFrame(f)})()}

/* ==================== 05-audio.js */
/* ================= AUDIO (Web Audio, generated) ================= */
let AC=null,master=null,musG=null,sfxG=null,VOL=.5,SHKM=1,muted=store.get('cube-mute','0')==='1';
function audio(){
  // if the browser force-muted the corner feed to allow autoplay, the first real input wins the sound back
  const fv=$('vfv');if(fv&&fv.muted&&!muted&&$('vfeed').classList.contains('on'))fv.muted=false;
  if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=muted?0:VOL;master.connect(AC.destination);
    musG=AC.createGain();sfxG=AC.createGain();musG.connect(master);sfxG.connect(master);applySet()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume()}
function tone(f,d,type,v,f2){if(!AC||muted)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(sfxG||master);o.start(t);o.stop(t+d+.02)}
function noise(d,v,f){if(!AC||muted)return;const n=AC.sampleRate*d|0,b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;fl.type='lowpass';fl.frequency.value=f;g.gain.value=v;s.connect(fl);fl.connect(g);g.connect(sfxG||master);s.start()}
const sfx={ui(){tone(520,.07,'sine',.08,720)},move(){tone(140+rnd(0,20),.05,'triangle',.03)},spawn(){tone(210,.06,'sine',.016,150)},land(){tone(110,.18,'sine',.14,45)},near(){tone(620,.16,'sine',.09,1400);tone(1240,.1,'triangle',.03)},death(){noise(.7,.5,900);tone(180,.6,'sawtooth',.12,35)}};
function setMute(m){muted=m;store.set('cube-mute',m?'1':'0');if(master)master.gain.value=m?0:VOL;
  if(typeof elApply==='function')elApply();
  const fv=$('vfv');if(fv)fv.muted=m;                          // the corner feed is a DOM element, not on the master gain
  muteBtn.classList.toggle('off',m);muteBtn.setAttribute('aria-pressed',m?'true':'false')}

/* ==================== 05b-media.js */
/* ================= MEDIA (the audio Web Audio cannot have) =================
   The long clips -- the Knight's music, his vacuum, his roar, the lava bed, Matthew's track --
   are files on disk, and a page opened straight from the file system cannot load them into
   the audio graph. fetch is blocked, XHR is blocked, and a media element routed through an
   AudioContext from a file:// URL plays but comes out silent. A plain <audio> element works
   everywhere, so that is what they are.

   The catch is that a plain element is not on the master gain, so mute and the two volume
   sliders have to reach it by hand. Everything below exists so the rest of the game does not
   have to know: elPlay returns a handle with the same shape playBuf returns, including a gain
   object that fakes the three AudioParam methods stopSnd uses, so every call site is
   unchanged and fades still fade. */
const MEDIA=[];                                   // every element currently playing
const elBus=b=>(muted?0:1)*(SET.vol/100)*((b==='mus'?SET.mus:SET.sfx)/100);
function elApply(){for(let i=0;i<MEDIA.length;i++){const h=MEDIA[i];
  try{h.el.volume=clamp(h.v*elBus(h.bus),0,1)}catch(e){}}}
function elDrop(h){const i=MEDIA.indexOf(h);if(i>=0)MEDIA.splice(i,1)}

/* an AudioParam that drives element volume instead of a gain node */
function elGain(h){
  let tid=0;
  const put=()=>{try{h.el.volume=clamp(h.v*elBus(h.bus),0,1)}catch(e){}};
  return {
    get value(){return h.v},
    set value(v){h.v=v;clearInterval(tid);tid=0;put()},
    cancelScheduledValues(){clearInterval(tid);tid=0;return this},
    setValueAtTime(v){h.v=v;put();return this},
    linearRampToValueAtTime(v,t){
      const secs=Math.max(.02,t-(AC?AC.currentTime:0)),from=h.v,t0=performance.now();
      clearInterval(tid);
      tid=setInterval(()=>{
        const u=Math.min(1,(performance.now()-t0)/(secs*1000));
        h.v=from+(v-from)*u;put();
        if(u>=1){clearInterval(tid);tid=0}
      },25);
      return this},
    exponentialRampToValueAtTime(v,t){return this.linearRampToValueAtTime(v,t)}
  };
}
function elPlay(src,vol,loop,bus){
  if(!src)return null;
  const h={el:new Audio(),v:vol===undefined?1:vol,bus:bus||'sfx'};
  h.el.src=src;h.el.loop=!!loop;h.el.preload='auto';
  h.g={gain:elGain(h)};
  h.s={stop(t){                                   // stopSnd asks for a time; honour it
    const d=Math.max(0,(t||0)-(AC?AC.currentTime:0));
    setTimeout(()=>{try{h.el.pause();h.el.src=''}catch(e){}elDrop(h)},d*1000+30)}};
  MEDIA.push(h);
  try{h.el.volume=clamp(h.v*elBus(h.bus),0,1)}catch(e){}
  if(!loop)h.el.addEventListener('ended',()=>elDrop(h),{once:true});
  const p=h.el.play();if(p&&p.catch)p.catch(()=>{});
  return h;
}
/* one-shots that overlap (his explosions arrive in clusters) cannot share an element, so
   each clip keeps a small ring of them */
const POOL={};
function elShot(src,vol,bus){
  if(!src)return;
  let p=POOL[src];
  if(!p){p={i:0,e:[]};for(let i=0;i<5;i++){const a=new Audio();a.src=src;a.preload='auto';p.e.push(a)}POOL[src]=p}
  const a=p.e[p.i];p.i=(p.i+1)%p.e.length;
  try{a.currentTime=0;a.volume=clamp((vol===undefined?1:vol)*elBus(bus||'sfx'),0,1);
    const q=a.play();if(q&&q.catch)q.catch(()=>{})}catch(e){}
}
function elPauseAll(on){for(let i=0;i<MEDIA.length;i++){
  try{if(on)MEDIA[i].el.pause();else{const p=MEDIA[i].el.play();if(p&&p.catch)p.catch(()=>{})}}catch(e){}}}

/* ==================== 06-settings.js */
/* ================= SETTINGS =================
   Four sliders and a switch. The sliders are live -- moving one is audible immediately,
   because every sound in the game runs through the two busses below. The switch is hard
   mode, and it is not a difficulty curve shifted by ten percent. */
const SETD={vol:70,mus:80,sfx:95,shake:100,hard:0};
const SET=Object.assign({},SETD);
function setLoad(){
  try{Object.assign(SET,JSON.parse(store.get('cube-set','')||'{}'))}catch(e){}
  for(const k in SETD)if(typeof SET[k]!=='number')SET[k]=SETD[k];
  SET.hard=SET.hard?1:0;applySet();
}
function setSave(){store.set('cube-set',JSON.stringify(SET))}
function applySet(){
  VOL=SET.vol/100*.5;SHKM=SET.shake/100;
  if(master)master.gain.value=muted?0:VOL;
  if(musG)musG.gain.value=SET.mus/100;
  if(sfxG)sfxG.gain.value=SET.sfx/100;
  const fv=$('vfv');if(fv)fv.volume=clamp(SET.vol/100*.8,0,1);
  elApply();                                     // the <audio> clips are not on the master gain
  document.body.classList.toggle('hardon',!!SET.hard);
  const h=$('hud');if(h)h.classList.toggle('hardon',!!SET.hard);
}

/* --- hard mode. Everything it touches, in one place, so it stays honest. --- */
const HARD=()=>SET.hard?1:0;
function hShield(n){return SET.hard?Math.max(2,Math.round(n*.45)):n}   // you start with about half
function hDiff(d){return SET.hard?clamp(.4+d*.72,0,1):d}               // and you start at threat 3
function hGap(g){return SET.hard?g*.6:g}                               // they arrive far closer together
function hLead(l){return SET.hard?l*.62:l}                             // and tell you later that they are coming
function hPick(t){return SET.hard?t*1.55:t}                            // pickups are rarer
function hTp(v){return SET.hard?v*.72:v}                               // and the gun charges slower
function hHP(v){return SET.hard?v*1.4:v}                               // the bosses hold up longer
function hPay(v){return SET.hard?Math.round(v*1.75):v}                 // which is what the extra shards are for

/* --- the screen --- */
const SETR=[
  ['vol',  'Volume',        'everything, all at once'],
  ['mus',  'Music',         'the boss tracks and the ambience'],
  ['sfx',  'Sound effects', 'cubes, shots, explosions'],
  ['shake','Screen shake',  'turn it down if the camera is too much'],
  ['hard', 'Hard mode',     'see below']
];
let setI=0;
function setDraw(){
  let h='';
  for(let i=0;i<SETR.length;i++){const r=SETR[i],v=SET[r[0]],hd=r[0]==='hard';
    h+='<div class="st'+(i===setI?' sel':'')+(hd?' hard':'')+(hd&&v?' yes':'')+'" data-i="'+i+'">'+
       '<span class="stn">'+r[1]+'<span class="std">'+r[2]+'</span></span>'+
       (hd?'<span class="stv"><i class="sw"></i></span>'
          :'<span class="stv"><span class="stb"><i style="width:'+v+'%"></i></span>'+
            '<span class="stn9">'+(v?v+'%':'off')+'</span></span>')+
       '</div>'}
  $('setrow').innerHTML=h;
}
function setOpen(){setI=0;setDraw();show('settings');sfx.ui()}
function setMove(d){setI=(setI+d+SETR.length)%SETR.length;setDraw();sfx.nav()}
function setAdj(d){
  const k=SETR[setI][0];
  if(k==='hard'){setToggle();return}
  SET[k]=clamp(SET[k]+d*5,0,100);applySet();setSave();setDraw();
  if(k!=='shake')sfx.nav();                                  // so you can hear what you just did
}
function setToggle(){
  const k=SETR[setI][0];
  if(k!=='hard'){setAdj(1);return}
  SET.hard=SET.hard?0:1;applySet();setSave();setDraw();
  if(SET.hard){sfx.no();shake(.4);toast('Hard mode','Fewer shields, faster cubes, later warnings, bigger payouts')}
  else sfx.up();
}
$('setrow').addEventListener('click',e=>{
  const r=e.target.closest&&e.target.closest('.st');if(!r)return;
  const i=+r.dataset.i;
  if(i===setI&&SETR[i][0]==='hard'){setToggle();return}
  if(i===setI&&SETR[i][0]!=='hard'){                         // click along the bar to set the level
    const b=r.querySelector('.stb');
    if(b){const q=b.getBoundingClientRect();
      if(e.clientX>=q.left-6&&e.clientX<=q.right+6){
        SET[SETR[i][0]]=clamp(Math.round((e.clientX-q.left)/q.width*20)*5,0,100);
        applySet();setSave();setDraw();sfx.nav();return}}}
  setI=i;setDraw();sfx.nav();
});

setMute(muted);

/* ==================== 07-glow.js */
/* ================= GLOW SPRITES (cheap bloom) ================= */
function glow(rgb){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba('+rgb+',.55)');r.addColorStop(.4,'rgba('+rgb+',.16)');r.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=r;g.fillRect(0,0,128,128);return c}
const glowW=glow('255,255,255'),glowR=glow('255,32,40');

/* ==================== 08-particles.js */
/* ================= PARTICLES (ring-buffer pool) ================= */
let skinBuilt=0;
const PN=420,parts=Array.from({length:PN},()=>({on:0,x:0,y:0,vx:0,vy:0,l:0,m:1,s:2,r:0,vr:0,c:0,d:1}));let pi=0;
function emit(x,y,vx,vy,life,s,c,d,vr){const p=parts[pi];pi=(pi+1)%PN;p.on=1;p.x=x;p.y=y;p.vx=vx;p.vy=vy;p.l=p.m=life;p.s=s;p.c=c;p.d=d;p.r=rnd(0,TAU);p.vr=vr||0}
function burst(x,y,n,spd,life,s,c,d){for(let i=0;i<n;i++){const a=rnd(0,TAU),v=spd*rnd(.25,1);emit(x,y,Math.cos(a)*v,Math.sin(a)*v,life*rnd(.6,1),s*rnd(.5,1.2),c,d,rnd(-8,8))}}
function stepParts(dt){for(let i=0;i<PN;i++){const p=parts[i];if(!p.on)continue;p.l-=dt;if(p.l<=0){p.on=0;continue}const f=Math.exp(-p.d*dt);p.vx*=f;p.vy*=f;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt}}

/* ==================== 09-player.js */
/* ================= PLAYER ================= */
const P={x:AW/2,y:AH/2,vx:0,vy:0,s:26,rot:0,qx:0,qy:0,qxv:0,qyv:0,cd:0,tt:0,drop:0,alive:true,
  dsh:0,dcd:0,ddx:1,ddy:0,dlast:0};
const DSHT=.19,DSHCD=1.15,DSHV=1180,DGN=10;                       // dash: length, cooldown, speed, ghosts
const dgh=Array.from({length:DGN},()=>({on:0,x:0,y:0,r:0,l:0,m:1}));let dgi=0;
const keys={},MAP={KeyE:'e',ShiftLeft:'dash',ShiftRight:'dash',KeyW:'u',ArrowUp:'u',KeyS:'d',ArrowDown:'d',KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r',Space:'f',KeyJ:'f'};
function land(){P.qx=.24;P.qy=-.3;P.qxv=P.qyv=0;burst(P.x,P.y,18,280,.55,3,0,3.5);shake(.3);sfx.land()}
function stepPlayer(dt){
  if(!P.alive)return;
  if(P.drop>0){P.drop-=dt/.45;if(P.drop<=0){P.drop=0;land()}}
  let ax=0,ay=0;if(G.state==='play'){ax=(keys.r|0)-(keys.l|0);ay=(keys.d|0)-(keys.u|0);if(tmv>=0){ax=tax;ay=tay}
    if(BR.on&&BR.st!=='cross'){ax=0;ay=0}}else if(G.state==='menu'){demoAI(dt);ax=dax;ay=day}
  const l=Math.hypot(ax,ay);if(l>1){ax/=l;ay/=l}
  const sp0=Math.hypot(P.vx,P.vy);P.cd-=dt;
  // sharp direction change: stretch along new heading + small puff
  if(l>0&&sp0>170&&P.cd<=0&&(ax*P.vx+ay*P.vy)/(sp0*l)<.25){P.qx=.2*Math.abs(ax)-.1*Math.abs(ay);P.qy=.2*Math.abs(ay)-.1*Math.abs(ax);P.qxv=P.qyv=0;P.cd=.16;burst(P.x,P.y,6,130,.32,2.6,0,4);sfx.move()}
  // acceleration: snappy when pushing, softer when releasing
  if(P.dsh>0){const u=P.dsh/DSHT,v=DSHV*(.45+.55*u);P.vx=P.ddx*v;P.vy=P.ddy*v}   // the dash owns velocity while it runs
  else{const k=l>0?11:7,mv=MAXV*(1+.3*(P.z>0))*(1+SHOP.spd*.06);P.vx=damp(P.vx,ax*mv,k,dt);P.vy=damp(P.vy,ay*mv,k,dt)}
  P.x+=P.vx*dt;P.y+=P.vy*dt;
  // arena bounds + wall impact squash
  const m=P.s/2+4,lo=m+SH.l,hi=AW-m-SH.r,to=m+SH.u,bo=AH-m-SH.d;        // the shrink walls are solid
  if(P.x<lo||P.x>hi){const v=Math.abs(P.vx),sg=P.x<lo?-1:1;P.x=clamp(P.x,Math.min(lo,hi),Math.max(lo,hi));
    if(SH.on&&SH.ph===1){SH.shove=1;P.qx=-.3;P.qy=.2;P.qxv=P.qyv=0}
    if(v>140){P.qx=-.26;P.qy=.16;P.qxv=P.qyv=0;burst(P.x+sg*P.s/2,P.y,6,150,.35,2.6,0,4);sfx.move();shake(.05)}P.vx=0}
  if(P.y<to||P.y>bo){const v=Math.abs(P.vy),sg=P.y<to?-1:1;P.y=clamp(P.y,Math.min(to,bo),Math.max(to,bo));
    if(SH.on&&SH.ph===1){SH.shove=1;P.qy=-.3;P.qx=.2;P.qxv=P.qyv=0}
    if(v>140){P.qy=-.26;P.qx=.16;P.qxv=P.qyv=0;burst(P.x,P.y+sg*P.s/2,6,150,.35,2.6,0,4);sfx.move();shake(.05)}P.vy=0}
  // springs return the cube to its rest shape (with wobble)
  P.qxv+=(-P.qx*300-P.qxv*17)*dt;P.qx+=P.qxv*dt;P.qyv+=(-P.qy*300-P.qyv*17)*dt;P.qy+=P.qyv*dt;
  P.rot=damp(P.rot,clamp(P.vx/MAXV,-1,1)*.34,12,dt);
  const sp=Math.hypot(P.vx,P.vy);
  if(sp>60){P.tt-=dt;if(P.tt<=0){P.tt=.016;emit(P.x-P.vx*.015+rnd(-4,4),P.y-P.vy*.015+rnd(-4,4),rnd(-14,14)-P.vx*.04,rnd(-14,14)-P.vy*.04,.42,rnd(2,5)*Math.min(1,sp/MAXV+.3),0,3)}}
}


/* --- dash: a short, fast commitment with a window of invulnerability on it ------------------
   It is the only way to pass through something safely, so it is the move that gets you out of a
   closing wall or a wave you misread. Cooldown is long enough that it cannot replace dodging. */
function tryDash(){
  if(P.dcd>0||P.dsh>0||!P.alive||G.state!=='play'||P.drop>0)return;
  if(BR.on&&BR.st!=='cross')return;
  let dx=(keys.r|0)-(keys.l|0),dy=(keys.d|0)-(keys.u|0);
  if(tmv>=0&&(Math.abs(tax)>.2||Math.abs(tay)>.2)){dx=tax;dy=tay}
  let l=Math.hypot(dx,dy);
  if(l<.1){const sp=Math.hypot(P.vx,P.vy);                       // no input: dash the way you are moving
    if(sp>40){dx=P.vx/sp;dy=P.vy/sp;l=1}else{dx=P.ddx;dy=P.ddy;l=1}}
  else{dx/=l;dy/=l;l=1}
  ach('rDash');ach('dash');AS.rNoDash=1;
  P.ddx=dx;P.ddy=dy;P.dsh=DSHT*(1+U.phase*.1+SHOP.dsh*.06);P.dcd=DSHCD*Math.pow(.84,U.phase)*Math.pow(.9,SHOP.dsh);
  P.vx=dx*DSHV*(1+U.phase*.07);P.vy=dy*DSHV*(1+U.phase*.07);
  P.inv=Math.max(P.inv,DSHT+.04);                                 // the i-frames are the whole point
  P.qx=.34;P.qy=-.26;P.qxv=P.qyv=0;
  for(let i=0;i<16;i++){const a=Math.atan2(dy,dx)+Math.PI+rnd(-.7,.7),v=rnd(160,430);
    emit(P.x,P.y,Math.cos(a)*v,Math.sin(a)*v,.4,2.8,0,4)}
  shake(.16);slow(.07,.6);sfx.dashgo();
}
function stepDash(dt){
  if(P.dcd>0){const was=P.dcd;P.dcd=Math.max(0,P.dcd-dt);if(was>0&&P.dcd<=0&&G.state==='play')sfx.dashrdy()}
  if(P.dsh>0){
    P.dsh=Math.max(0,P.dsh-dt);
    P.dlast+=dt;
    if(P.dlast>.022){P.dlast=0;const g=dgh[dgi];dgi=(dgi+1)%DGN;
      g.on=1;g.x=P.x;g.y=P.y;g.r=P.rot;g.l=g.m=.3}
  }
  for(let i=0;i<DGN;i++){const g=dgh[i];if(!g.on)continue;g.l-=dt;if(g.l<=0)g.on=0}
  dashHud();
}
function drawGhosts(){
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<DGN;i++){const g=dgh[i];if(!g.on)continue;
    const u=g.l/g.m,s=P.s*(.5+.5*u);
    A(.45*u);ctx.fillStyle='#fff';
    ctx.save();ctx.translate(g.x,g.y);ctx.rotate(g.r);rr(-s/2,-s/2,s,s,s*.24);ctx.fill();ctx.restore()}
  ctx.globalCompositeOperation='source-over';A(1);
}
const dashEl=$('dashw'),dashF=$('dashf');let dashPrev=-1;
function dashHud(){
  if(!dashEl)return;
  const full=DSHCD*Math.pow(.84,U.phase)*Math.pow(.9,SHOP.dsh),u=P.dcd>0?1-P.dcd/full:1,q=Math.round(u*100);
  if(q===dashPrev)return;dashPrev=q;
  dashF.style.transform='scaleX('+u.toFixed(3)+')';
  dashEl.classList.toggle('rdy',u>=1);
}

/* ==================== 10-cubes.js */
/* ================= OBSTACLES + PATTERNS ================= */
const ON=340,obs=Array.from({length:ON},()=>({on:0,x:0,y:0,vx:0,vy:0,s:30,r:0,vr:0,a:0,near:0,h:0,hp:1,f:0,hb:-1,ht:-9,k:0,tm:0,sp:0,life:0,
  b:0,bt:0,bp:0,bf:0,bg:0,cx:0,cy:0,ca:0,cr:0,cw:0,cv:0}));   // b = attack behaviour (see stepBehave)
// dl = spawn delay in seconds (staggers sequences), h = homing time in seconds
function spawnObs(x,y,vx,vy,s,dl,h){for(let i=0;i<ON;i++){const o=obs[i];if(o.on)continue;o.on=1;o.x=x;o.y=y;o.vx=vx;o.vy=vy;o.s=s;o.r=rnd(0,TAU);o.vr=rnd(-1.8,1.8)*(1+Math.hypot(vx,vy)/600);
    const lead=WNO?0:hLead(WLEAD);if(lead)warnAt(x,y,vx,vy,s,(lead+(dl||0))*WRATE);
    o.a=-(dl||0)-lead;o.near=0;o.h=h||0;o.hp=Math.ceil(s/22);o.f=0;o.hb=-1;o.ht=-9;o.k=0;o.tm=0;o.b=0;o.bt=0;o.bf=0;o.bg=0;return o}}
const DIR=[[1,0],[-1,0],[0,1],[0,-1]];
const edge=(s,t)=>s<2?[s?AW:0,t*AH]:[t*AW,s===2?0:AH];
const pat={
  single(){const s=rnd(0,4)|0,e=edge(s,rnd(.1,.9)),v=G.speed*rnd(.85,1.2);spawnObs(e[0],e[1],DIR[s][0]*v,DIR[s][1]*v,rnd(20,46))},
  diag(){const l=Math.random()<.5,y=rnd(.1,.9)*AH,v=G.speed*rnd(.9,1.1),dy=(y<AH/2?1:-1)*rnd(.4,.9);spawnObs(l?0:AW,y,(l?1:-1)*v*.8,dy*v,rnd(22,40))},
  aimed(){const s=rnd(0,4)|0,e=edge(s,rnd(.15,.85)),a=Math.atan2(P.y-e[1],P.x-e[0])+rnd(-.1,.1),v=G.speed*1.05;spawnObs(e[0],e[1],Math.cos(a)*v,Math.sin(a)*v,rnd(24,38))},
  pincer(){const h=Math.random()<.5,v=G.speed*.95,o=rnd(-30,30);if(h){spawnObs(0,P.y+o,v,0,34);spawnObs(AW,P.y-o,-v,0,34)}else{spawnObs(P.x+o,0,0,v,34);spawnObs(P.x-o,AH,0,-v,34)}},
  wall(){const h=Math.random()<.5,n=h?8:12,len=h?AH:AW,gap=rnd(1,n-1)|0,v=G.speed*.62,sd=Math.random()<.5;for(let i=0;i<n;i++){if(i===gap)continue;const c=(i+.5)/n*len,s=len/n*.78;if(h)spawnObs(sd?0:AW,c,sd?v:-v,0,s);else spawnObs(c,sd?0:AH,0,sd?v:-v,s)}G.next+=.9}
};
Object.assign(pat,{
  // fan: five cubes spread from one edge point toward the player
  fan(){const s=rnd(0,4)|0,e=edge(s,rnd(.2,.8)),b=Math.atan2(P.y-e[1],P.x-e[0]),v=G.speed*.9,w=G.diff>.4?3:2;for(let i=-w;i<=w;i++){const a=b+i*.22;spawnObs(e[0],e[1],Math.cos(a)*v,Math.sin(a)*v,24)}},
  // seeker: slow, large cube that steers toward the player for 3s (lighter red while homing)
  seeker(){const n=G.diff>.5?2:1,v=G.speed*.62;for(let i=0;i<n;i++){const s=rnd(0,4)|0,e=edge(s,rnd(.2,.8));spawnObs(e[0],e[1],DIR[s][0]*v,DIR[s][1]*v,36,i*.9,3)}},
  // darts: three small fast cubes fired in sequence at where you were
  darts(){const s=rnd(0,4)|0,v=G.speed*1.6;for(let i=0;i<(G.diff>.45?5:3);i++){const e=edge(s,rnd(.15,.85)),a=Math.atan2(P.y-e[1],P.x-e[0]);spawnObs(e[0],e[1],Math.cos(a)*v,Math.sin(a)*v,15,i*.32)}},
  // ring: cubes appear around you and close in together; find the gap
  ring(){const T=lerp(2.1,1.5,G.diff),r0=rnd(0,TAU),N=G.diff>.45?11:8;for(let i=0;i<N;i++){const a=r0+i*TAU/N,x=clamp(P.x+Math.cos(a)*320,0,AW),y=clamp(P.y+Math.sin(a)*320,0,AH);if(Math.hypot(P.x-x,P.y-y)<190)continue;spawnObs(x,y,(P.x-x)/T,(P.y-y)/T,26)}},
  // curtain: a wall with a two-slot gap that appears as a sweeping wave
  curtain(){const h=Math.random()<.5,n=h?9:14,len=h?AH:AW,f=Math.random()<.5,rv=Math.random()<.5,gap=rnd(0,n-1)|0,v=G.speed*.75;for(let i=0;i<n;i++){if(i===gap||i===gap+1)continue;const c=(i+.5)/n*len,d=(rv?n-1-i:i)*.11,sz=len/n*.8;if(h)spawnObs(f?0:AW,c,f?v:-v,0,sz,d);else spawnObs(c,f?0:AH,0,f?v:-v,sz,d)}G.next+=1.2},
  // nova: radial burst from a point inside the arena, away from the player
  nova(){let x,y,t=0;do{x=rnd(120,AW-120);y=rnd(120,AH-120)}while(Math.hypot(P.x-x,P.y-y)<260&&++t<12);const r0=rnd(0,TAU),v=G.speed*.75,N=G.diff>.5?16:12;for(let i=0;i<N;i++){const a=r0+i*TAU/N;spawnObs(x,y,Math.cos(a)*v,Math.sin(a)*v,20)}burst(x,y,14,160,.5,3,1,3)},
  // lanes: crossing rows and columns of slow cubes; weave through
  lanes(){const v=G.speed*.6,a=Math.random()<.5,b=Math.random()<.5,o1=rnd(0,90),o2=rnd(0,100);for(let i=0;i<4;i++)spawnObs(a?0:AW,o1+80+i*150,a?v:-v,0,40,i*.15);for(let i=0;i<6;i++)spawnObs(o2+90+i*150,b?0:AH,0,b?v:-v,40,.3+i*.12);G.next+=1.2}
});

Object.assign(pat,{
  // chargers: cubes drift in, hang there winding up, then lunge at where you stand
  chargers(){const k=G.diff>.55?3:2,v=G.speed*.5;
    for(let i=0;i<k;i++){const s=rnd(0,4)|0,e=edge(s,rnd(.2,.8)),
      o=spawnObs(e[0],e[1],DIR[s][0]*v,DIR[s][1]*v,34,i*.45);
      if(o){o.b=1;o.bp=lerp(1.5,1.0,G.diff)+i*.22}}},
  // vortex: a ring that spins around the middle of the arena and tightens as it goes
  vortex(){const cx=AW/2,cy=AH/2,n=G.diff>.6?8:6,r0=rnd(0,TAU),
    dir=Math.random()<.5?1:-1,R=rnd(250,310);
    for(let i=0;i<n;i++){const a=r0+i*TAU/n,o=spawnObs(cx+Math.cos(a)*R,cy+Math.sin(a)*R,0,0,26,i*.07);
      if(o){o.b=2;o.cx=cx;o.cy=cy;o.ca=a;o.cr=R;o.cw=dir*lerp(.75,1.15,G.diff);o.cv=lerp(26,40,G.diff);o.bp=7.5}}
    G.next+=.7},
  // weave: cubes cross the arena sliding side to side, so the gaps keep moving
  weave(){const h=Math.random()<.5,f=Math.random()<.5,n=5,v=G.speed*.78,len=h?AH:AW;
    for(let i=0;i<n;i++){const c=(i+.5)/n*len,
      o=h?spawnObs(f?0:AW,c,f?v:-v,0,28,i*.1):spawnObs(c,f?0:AH,0,f?v:-v,28,i*.1);
      if(o){o.b=3;o.cw=rnd(2.2,3.1);o.ca=i*1.3;o.cv=lerp(130,205,G.diff)}}},
  // splitters: big cubes that burst into a pair partway across
  splitters(){const k=G.diff>.5?3:2,v=G.speed*.72;
    for(let i=0;i<k;i++){const s=rnd(0,4)|0,e=edge(s,rnd(.2,.8)),
      a=Math.atan2(P.y-e[1],P.x-e[0])+rnd(-.22,.22),
      o=spawnObs(e[0],e[1],Math.cos(a)*v,Math.sin(a)*v,44,i*.3);
      if(o){o.b=4;o.bp=rnd(.8,1.2)}}},
  // crossfire: two fans from opposite sides, timed to meet in the middle
  crossfire(){const h=Math.random()<.5,v=G.speed*.95,t=rnd(.25,.75);
    for(let sd=0;sd<2;sd++){const e=h?[sd?AW:0,t*AH]:[t*AW,sd?AH:0],
      b=Math.atan2(P.y-e[1],P.x-e[0]);
      for(let i=-1;i<=1;i++)spawnObs(e[0],e[1],Math.cos(b+i*.3)*v,Math.sin(b+i*.3)*v,24,sd*.18)}},
  // comb: short teeth from both sides, interlocking, with a lane running through the middle
  comb(){const h=Math.random()<.5,n=7,len=h?AH:AW,v=G.speed*.68,sz=len/n*.62;
    for(let i=0;i<n;i++){const c=(i+.5)/n*len,top=i%2===0;
      if(h)spawnObs(top?0:AW,c,top?v:-v,0,sz,i*.08);
      else spawnObs(c,top?0:AH,0,top?v:-v,sz,i*.08)}
    G.next+=.8},
  // spiral: a turret in the middle sweeping round, laying down an unwinding arm of cubes
  spiral(){const cx=rnd(AW*.35,AW*.65),cy=rnd(AH*.35,AH*.65),r0=rnd(0,TAU),
    dir=Math.random()<.5?1:-1,n=14,v=G.speed*.82;
    for(let i=0;i<n;i++){const a=r0+dir*i*.46;
      spawnObs(cx,cy,Math.cos(a)*v,Math.sin(a)*v,21,i*.1)}
    burst(cx,cy,12,150,.5,3,1,3);G.next+=.8}
});

Object.assign(pat,{
  // vice: left and right close in, then cubes run the shortened corridor
  vice(){shrinkStart(1);const v=G.speed*.8;
    for(let i=0;i<5;i++){const y=rnd(.1,.9)*AH,f=Math.random()<.5;
      spawnObs(f?0:AW,y,(f?1:-1)*v,rnd(-40,40),26,1.3+i*.34)}},
  // press: ceiling and floor come down, with cubes crossing the gap that is left
  press(){shrinkStart(2);const v=G.speed*.85;
    for(let i=0;i<5;i++){const x=rnd(.1,.9)*AW,f=Math.random()<.5;
      spawnObs(x,f?0:AH,rnd(-40,40),(f?1:-1)*v,26,1.3+i*.34)}},
  // collapse: all four walls shut to a box and a nova goes off inside it
  collapse(){shrinkStart(3)},
  // iris: the walls leave one off-centre pocket -- get to it before they finish
  iris(){shrinkStart(4);const v=G.speed*.7;
    for(let i=0;i<4;i++){const s=rnd(0,4)|0,e=edge(s,rnd(.2,.8));
      spawnObs(e[0],e[1],DIR[s][0]*v,DIR[s][1]*v,28,1.5+i*.4)}}
});

Object.assign(pat,{
  // scythe: an arm of cubes pivoting out of a corner, sweeping the quarter in front of it
  scythe(){const cn=(Math.random()*4)|0,ox=cn&1?AW:0,oy=cn&2?AH:0,
    base=Math.atan2(AH/2-oy,AW/2-ox),dir=Math.random()<.5?1:-1,v=G.speed*.95;
    for(let i=0;i<9;i++){const a=base+dir*(i-4)*.17;
      spawnObs(ox,oy,Math.cos(a)*v,Math.sin(a)*v,24,i*.085)}},
  // hail: three dense bursts of small fast cubes off one edge
  hail(){const s=(Math.random()*4)|0,v=G.speed*1.35;
    for(let w=0;w<3;w++)for(let i=0;i<6;i++){const e=edge(s,rnd(.08,.92));
      spawnObs(e[0],e[1],DIR[s][0]*v*rnd(.85,1.15),DIR[s][1]*v*rnd(.85,1.15),16,w*.55+i*.05)}
    G.next+=.6},
  // tunnel: two diagonal walls converging, with a corridor running between them
  tunnel(){const f=Math.random()<.5,v=G.speed*.72,gap=rnd(.3,.7);
    for(let i=0;i<9;i++){const u=(i+.5)/9;
      if(Math.abs(u-gap)<.14)continue;
      const y=u*AH,dy=(u<gap?-1:1)*v*.32;
      spawnObs(f?0:AW,y,(f?1:-1)*v,dy,30,i*.07)}
    G.next+=.7},
  // boomerang: cubes thrown past you that stall, turn, and come back aimed
  boomerang(){const k=G.diff>.55?4:3,v=G.speed*1.5;
    for(let i=0;i<k;i++){const s=(Math.random()*4)|0,e=edge(s,rnd(.2,.8)),
      a=Math.atan2(P.y-e[1],P.x-e[0])+rnd(-.3,.3),
      o=spawnObs(e[0],e[1],Math.cos(a)*v,Math.sin(a)*v,24,i*.26);
      if(o){o.b=5;o.bp=rnd(.75,1.0);o.cx=Math.cos(a)*v;o.cy=Math.sin(a)*v}}},
  // swarm: a cloud of small cubes that all steer toward you at once
  swarm(){const k=G.diff>.6?12:9,v=G.speed*.56,s=(Math.random()*4)|0;
    for(let i=0;i<k;i++){const e=edge(s,rnd(.05,.95)),a=Math.atan2(P.y-e[1],P.x-e[0])+rnd(-.5,.5);
      spawnObs(e[0],e[1],Math.cos(a)*v,Math.sin(a)*v,17,i*.07,2.6)}
    G.next+=.5}
});

Object.assign(pat,{
  // cross: all four edges fire at once, straight through the middle
  cross(){const v=G.speed*.9,t=rnd(.3,.7);
    for(let s=0;s<4;s++){const e=edge(s,t);
      for(let i=0;i<2;i++)spawnObs(e[0],e[1],DIR[s][0]*v,DIR[s][1]*v,26,i*.42)}},
  // drizzle: a long thin rain off one edge, never dense, never stopping
  drizzle(){const s=(Math.random()*4)|0,v=G.speed*1.05,k=G.diff>.5?14:10;
    for(let i=0;i<k;i++){const e=edge(s,rnd(.05,.95));
      spawnObs(e[0],e[1],DIR[s][0]*v*rnd(.8,1.2),DIR[s][1]*v*rnd(.8,1.2),rnd(14,22),i*.17)}
    G.next+=.8},
  // mortar: shells lobbed into the arena that stall and burst into their own ring
  mortar(){const k=G.diff>.55?3:2;
    for(let i=0;i<k;i++){let x,y,t=0;
      do{x=rnd(140,AW-140);y=rnd(140,AH-140)}while(Math.hypot(P.x-x,P.y-y)<190&&++t<10);
      const s=(Math.random()*4)|0,e=edge(s,rnd(.2,.8)),
        a=Math.atan2(y-e[1],x-e[0]),v=Math.hypot(x-e[0],y-e[1])/.75,
        o=spawnObs(e[0],e[1],Math.cos(a)*v,Math.sin(a)*v,34,i*.4);
      if(o){o.b=6;o.bp=rnd(1.0,1.35)}}},
  // grinder: two walls running the same way with their gaps offset, so you have to cut across
  grinder(){const h=Math.random()<.5,f=Math.random()<.5,v=G.speed*.68,n=8,len=h?AH:AW,
    g1=1+(Math.random()*(n-2)|0),g2=(g1+3+(Math.random()*2|0))%n;
    for(let p=0;p<2;p++)for(let i=0;i<n;i++){
      if(i===(p?g2:g1))continue;
      const c=(i+.5)/n*len,sz=len/n*.74,d=p*.95;
      if(h)spawnObs(f?-60:AW+60,c,f?v:-v,0,sz,d);else spawnObs(c,f?-60:AH+60,0,f?v:-v,sz,d)}
    G.next+=1.3},
  // helix: two weaving streams out of phase, braiding across the arena
  helix(){const h=Math.random()<.5,f=Math.random()<.5,v=G.speed*.82,len=h?AH:AW;
    for(let p=0;p<2;p++)for(let i=0;i<4;i++){
      const c=(i+.5)/4*len,
        o=h?spawnObs(f?0:AW,c,f?v:-v,0,26,p*.3+i*.12):spawnObs(c,f?0:AH,0,f?v:-v,26,p*.3+i*.12);
      if(o){o.b=3;o.cw=2.6;o.ca=p*Math.PI;o.cv=lerp(150,225,G.diff)}}
    G.next+=.6},
  // cluster: one knot of cubes that arrives together and splits apart on top of you
  cluster(){const s=(Math.random()*4)|0,e=edge(s,rnd(.25,.75)),
    a=Math.atan2(P.y-e[1],P.x-e[0]),v=G.speed*.8,k=G.diff>.5?5:4;
    for(let i=0;i<k;i++){const o=spawnObs(e[0]+rnd(-18,18),e[1]+rnd(-18,18),
      Math.cos(a)*v*rnd(.95,1.05),Math.sin(a)*v*rnd(.95,1.05),30,i*.05);
      if(o){o.b=4;o.bp=rnd(.85,1.25)}}}
});

Object.assign(pat,{
  slabs(){flHazard()},                    // whole regions of the floor condemned
  bombs(){flBombs()},                     // cluster bombs, cats and all
  sweep(){flWipe()},                      // the stretched sweep -- jump it
  launch(){flLaunch()},                   // it takes aim, then goes straight through
  scream(){flScream()}                    // rings of sound, each with one way through
});
const PAT=[['single',0,3],['diag',.05,2],['aimed',.12,3],['weave',.15,2],['fan',.18,2],['chargers',.2,2],
  ['seeker',.22,2],['darts',.26,2],['pincer',.3,2],['splitters',.32,2],['ring',.34,2],['curtain',.4,2],
  ['wall',.45,2],['crossfire',.47,2],['nova',.5,2],['comb',.52,2],['spiral',.56,2],['lanes',.58,2],['vortex',.62,2],
  ['vice',.36,2],['press',.42,2],['iris',.5,2],['collapse',.6,2],
  ['scythe',.24,2],['hail',.28,2],['boomerang',.38,2],['tunnel',.44,2],['swarm',.54,2],
  ['cross',.1,3],['drizzle',.14,3],['cluster',.3,2],['helix',.4,2],['mortar',.46,2],['grinder',.56,2],
  ['sweep',.33,2],['slabs',.42,2],['bombs',.5,2],['launch',.58,2],['scream',.3,3]]; // [name, unlock difficulty, weight]
function spawnPattern(){let tot=0;
  const his=FB.haz.length||FB.bmb.length||FB.wipe||FB.lau||FB.scr;
  const sk=(SH.on||his)?{}:null;                                           // one squeeze at a time
  if(SH.on){sk.vice=1;sk.press=1;sk.iris=1;sk.collapse=1}
  if(his||SH.on){sk.sweep=1;sk.slabs=1;sk.bombs=1;sk.launch=1;sk.scream=1}             // and one of his at a time
  for(let i=0;i<PAT.length;i++)if(G.diff>=PAT[i][1]&&!(sk&&sk[PAT[i][0]]))tot+=PAT[i][2];let r=sr()*tot;for(let i=0;i<PAT.length;i++){if(G.diff<PAT[i][1]||(sk&&sk[PAT[i][0]]))continue;r-=PAT[i][2];if(r<=0){pat[PAT[i][0]]();break}}if(G.diff>.3&&Math.random()<.5)pat.aimed();
  if(G.diff>.55&&sr()<.34)pat.darts();
  if(G.diff>.75&&sr()<.22)pat.aimed();
  sfx.spawn()}

/* --- attack behaviours: what a cube does once it is in play ---------------------------------
   b=1 charger  drifts in, hangs in the air winding up, then lunges straight at where you are
   b=2 orbiter  swings around a pivot on a shrinking radius, so the ring closes as it spins
   b=3 weaver   holds a heading but slides side to side, so the gap keeps moving
   b=4 splitter travels, then bursts into two smaller cubes on diverging paths
   Each returns true if it has already placed the cube itself. -------------------------------- */
function stepBehave(o,dt){
  o.bt+=dt;
  if(o.b===1){                                   // charger
    if(!o.bf){
      if(o.bt<o.bp){const f=Math.exp(-3.4*dt);o.vx*=f;o.vy*=f;        // hangs, winding up
        if(Math.random()<.5)emit(o.x+rnd(-14,14),o.y+rnd(-14,14),rnd(-40,40),rnd(-40,40),.3,2,1,4)}
      else{o.bf=1;const a=Math.atan2(P.y-o.y,P.x-o.x),v=G.speed*2.15;
        o.vx=Math.cos(a)*v;o.vy=Math.sin(a)*v;o.vr=rnd(-11,11);
        burst(o.x,o.y,10,220,.4,2.6,1,3);sfx.dash()}}
    return false}
  if(o.b===2){                                   // orbiter
    if(o.a<1)return false;
    o.ca+=o.cw*dt;o.cr=Math.max(34,o.cr-o.cv*dt);
    o.x=o.cx+Math.cos(o.ca)*o.cr;o.y=o.cy+Math.sin(o.ca)*o.cr;
    o.vx=-Math.sin(o.ca)*o.cw*o.cr;o.vy=Math.cos(o.ca)*o.cw*o.cr;    // only for the ghost trail
    o.r+=o.vr*dt;o.f-=dt;o.bg+=dt;
    if(o.bg>o.bp){o.on=0;burst(o.x,o.y,6,160,.4,2.4,1,3)}            // lets go once its turn is done
    return true}
  if(o.b===3){                                   // weaver
    const a=Math.atan2(o.vy,o.vx),sp=Math.hypot(o.vx,o.vy),w=Math.cos(o.bt*o.cw+o.ca)*o.cv;
    o.x+=-Math.sin(a)*w*dt;o.y+=Math.cos(a)*w*dt;
    return false}
  if(o.b===6){                                   // mortar: coasts in, stalls, bursts into a ring
    const u=clamp(o.bt/o.bp,0,1),f=Math.exp(-2.6*dt);o.vx*=f;o.vy*=f;
    if(Math.random()<.3)emit(o.x+rnd(-8,8),o.y+rnd(-8,8),rnd(-40,40),rnd(-40,40),.3,2,1,4);
    if(u>=1){const r0=rnd(0,TAU),v=G.speed*.85,N=G.diff>.5?9:7;
      WNO=1;for(let j=0;j<N;j++){const a=r0+j*TAU/N;spawnObs(o.x,o.y,Math.cos(a)*v,Math.sin(a)*v,o.s*.5)}WNO=0;
      burst(o.x,o.y,14,300,.5,3.2,1,3);sfx.split();shake(.12);o.on=0;return true}
    return false}
  if(o.b===5){                                   // boomerang: flies out, stalls, comes back through you
    if(!o.bf){const u=clamp(o.bt/o.bp,0,1),k=1-u;o.vx=o.cx*k;o.vy=o.cy*k;
      if(u>=1){o.bf=1;const a=Math.atan2(P.y-o.y,P.x-o.x),v=Math.hypot(o.cx,o.cy)*1.1;
        o.cx=Math.cos(a)*v;o.cy=Math.sin(a)*v;o.vr=rnd(-7,7);
        burst(o.x,o.y,8,190,.38,2.6,1,3)}}
    else{const u=clamp((o.bt-o.bp)/.34,0,1);o.vx=o.cx*u;o.vy=o.cy*u}
    return false}
  if(o.b===4&&o.bt>=o.bp&&!o.bf){                // splitter
    o.bf=1;const a=Math.atan2(o.vy,o.vx),sp=Math.hypot(o.vx,o.vy);
    WNO=1;
    for(let j=-1;j<=1;j+=2){const na=a+j*.5,c=spawnObs(o.x,o.y,Math.cos(na)*sp*1.15,Math.sin(na)*sp*1.15,o.s*.62);
      if(c)c.a=.85}
    WNO=0;
    burst(o.x,o.y,12,260,.45,3,1,3);sfx.split();o.on=0;return true}
  return false
}

/* ==================== 11-warnings.js */
/* ================= SPAWN WARNINGS =================
   Nothing arrives unannounced any more. Every cube books its place first: a marker sits where
   it will appear, with a chevron pointing the way it is going to travel and a dashed line
   along its path, and only then does the cube turn up. Cubes that are plainly already on
   screen -- the Knight's collection, a splitter's halves, a mortar's shell -- skip it, because
   you watched those arrive. */
const WLEAD=1.19,WRATE=.42;                      // a is 1/.42 per second, so this is ~0.5 s of notice
let WNO=0;                                       // set while spawning something that needs no warning
const WN=160,wrn=Array.from({length:WN},()=>({on:0,x:0,y:0,a:0,t:0,d:1,s:20}));let wni=0;
function warnAt(x,y,vx,vy,s,d){
  const w=wrn[wni];wni=(wni+1)%WN;
  w.on=1;w.x=x;w.y=y;w.a=Math.atan2(vy,vx);w.t=0;w.d=Math.max(.12,d);w.s=s||20;
}
function stepWarn(dt){for(let i=0;i<WN;i++){const w=wrn[i];if(!w.on)continue;w.t+=dt;if(w.t>=w.d)w.on=0}}
function drawWarn(){
  ctx.save();rr(0,0,AW,AH,26);ctx.clip();
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<WN;i++){const w=wrn[i];if(!w.on)continue;
    const u=clamp(w.t/w.d,0,1),pul=.45+.55*Math.abs(Math.sin(w.t*17)),
      r=w.s*.5*(1.5-.45*u),dx=Math.cos(w.a),dy=Math.sin(w.a);
    A((.2+.5*u)*pul);
    ctx.strokeStyle='rgba(255,70,60,1)';ctx.lineWidth=1.6+1.6*u;
    ctx.setLineDash([7,9]);ctx.beginPath();                     // the line it will come down
    ctx.moveTo(w.x+dx*r,w.y+dy*r);ctx.lineTo(w.x+dx*(r+78+40*u),w.y+dy*(r+78+40*u));ctx.stroke();
    ctx.setLineDash([]);
    A((.3+.6*u)*pul);ctx.lineWidth=2+1.6*u;                     // the place it will be
    ctx.beginPath();ctx.arc(w.x,w.y,r,0,TAU);ctx.stroke();
    const cx=w.x+dx*(r+15),cy=w.y+dy*(r+15);                    // and the way it is pointing
    ctx.beginPath();
    ctx.moveTo(cx-dx*9-dy*9,cy-dy*9+dx*9);ctx.lineTo(cx,cy);ctx.lineTo(cx-dx*9+dy*9,cy-dy*9-dx*9);
    ctx.stroke();
    A(.18*pul*u);ctx.drawImage(glowR,w.x-r*2.4,w.y-r*2.4,r*4.8,r*4.8);
  }
  ctx.globalCompositeOperation='source-over';A(1);ctx.restore();
}
/* collision: forgiving circle hitboxes; near-miss = a thin ring outside the hitbox */
function stepObs(dt){const gr=48+8*U.graze;
  for(let i=0;i<ON;i++){const o=obs[i];if(!o.on)continue;
    o.a=Math.min(1,o.a+dt/.42);const e=o.a>0?o.a*o.a:0;
    if(o.h>0&&o.a>=1&&P.alive){o.h-=dt;const sp=Math.hypot(o.vx,o.vy),c=Math.atan2(o.vy,o.vx),t=Math.atan2(P.y-o.y,P.x-o.x),w=Math.atan2(Math.sin(t-c),Math.cos(t-c)),n=c+clamp(w,-1.5*dt,1.5*dt);o.vx=Math.cos(n)*sp;o.vy=Math.sin(n)*sp}          // eased spawn: grows & creeps before committing
    if(o.k&&knightBlock(o,dt))continue;   // roaring-knight cubes have their own motion
    if(o.b&&stepBehave(o,dt)){if(!o.on)continue}else
    {o.x+=o.vx*e*dt;o.y+=o.vy*e*dt;o.r+=o.vr*dt;o.f-=dt;}
    if(!o.k&&o.b!==2&&o.a>=1&&(o.x<-100||o.x>AW+100||o.y<-100||o.y>AH+100)){o.on=0;continue}   // (knight cubes manage their own life)
    if((G.state!=='play'&&G.state!=='menu')||P.drop>0||o.a<.8)continue;
    const d=Math.hypot(P.x-o.x,P.y-o.y),hr=9+o.s*.44;
    if(P.inv>0){if(P.dsh>0&&d<hr)AS.fClutch=1;continue}   // dashed straight through it
    if(d<hr){if(U.shield>0){shieldBreak();continue}if(G.state==='menu'){demoReset();return}die();return}
    if(d<hr+gr){gz+=1-(d-hr)/gr;if(Math.random()<.3)emit(P.x+rnd(-8,8),P.y+rnd(-8,8),(P.x-o.x)*.5+rnd(-30,30),(P.y-o.y)*.5+rnd(-30,30),.3,2,0,4)}   // graze fills TP
    if(!o.near&&d<hr+20){o.near=1;nearMiss(o)}
  }
}
function nearMiss(o){
  if(G.nmCd>0)return;G.nmCd=.3;
  G.chain=(G.chainT>0?G.chain:0)+1;G.chainT=3.2;G.nm++;G.maxChain=Math.max(G.maxChain,G.chain);   // near misses within 3.2 s of each other build a chain
  ach('rNm');ach('nm');achMax('rChain',G.chain);achMax('maxChain',G.chain);
  const bn=Math.round(25*(1+Math.min(G.chain-1,4)*.5));G.bonus+=bn;G.tp=Math.min(100,G.tp+6);
  G.fl=Math.max(G.fl,.08);G.fc=0;shake(.28);slow(.13,.32);cam.zk+=reduce?0:.014;
  if(U.chrono)slow(.1+.04*U.chrono,.62-.06*U.chrono);                 // chrono: the world drags
  if(U.surge&&G.chain>=5&&G.surgeT<=0){G.surgeT=2.2+1.4*U.surge;popText(P.x,P.y-92,'SURGE','#ffd36a',22);sfx.up()}
  burst((P.x+o.x)/2,(P.y+o.y)/2,12,240,.5,2.6,0,3);burst(P.x,P.y,5,140,.35,2,1,3);sfx.near();
  popText(P.x,P.y-38,'+'+bn,'#fff',G.chain>1?28:23);if(G.chain>1)popText(P.x,P.y-66,'×'+G.chain+' chain','#ff6a66',16);
  scoreEl.animate([{transform:'scale(1.16)'},{transform:'scale(1)'}],{duration:340,easing:'cubic-bezier(.2,.8,.2,1)'});
  if(G.chain>1)cnEl.animate([{transform:'scale(1.6)'},{transform:'scale(1)'}],{duration:280,easing:'cubic-bezier(.2,.8,.2,1)'});
}

/* ==================== 12-shrink.js */
/* ================= ARENA SHRINK =================
   Some attacks take the room away instead of filling it. Slabs slide in from the edges,
   the walls are solid so they shove the cube rather than killing it outright, and the
   cubes keep coming through them -- the squeeze is that you have less room to dodge in.
   SH.l/r/u/d are the live insets; stepPlayer clamps to them and drawShrink draws them. */
const SH={on:0,ph:0,t:0,mode:0,l:0,r:0,u:0,d:0,tl:0,tr:0,tu:0,td:0,hold:3.4,shove:0};
const SHN=['','Vice','Press','Collapse','Iris'];
function shrinkClear(){SH.on=0;SH.ph=0;SH.l=SH.r=SH.u=SH.d=0;SH.tl=SH.tr=SH.tu=SH.td=0;SH.shove=0}
function shrinkStart(mode){
  if(SH.on)return;
  SH.on=1;SH.ph=0;SH.t=0;SH.mode=mode;SH.shove=0;
  SH.l=SH.r=SH.u=SH.d=0;
  const deep=lerp(.30,.40,G.diff);                       // how far in the walls come
  if(mode===1){SH.tl=AW*deep;SH.tr=AW*deep;SH.tu=0;SH.td=0}
  else if(mode===2){SH.tl=0;SH.tr=0;SH.tu=AH*deep;SH.td=AH*deep}
  else if(mode===3){const k=deep*.78;SH.tl=AW*k;SH.tr=AW*k;SH.tu=AH*k;SH.td=AH*k}
  else{                                                   // iris: the pocket sits off to one side
    const bx=rnd(.1,.6),by=rnd(.1,.6),w=deep*1.5,h=deep*1.5;
    SH.tl=AW*bx*w;SH.tr=AW*(1-bx)*w;SH.tu=AH*by*h;SH.td=AH*(1-by)*h}
  SH.hold=lerp(3.6,4.8,G.diff);
  toast(SHN[mode],'The arena is closing');shake(.3);G.fl=Math.max(G.fl,.1);G.fc=0;sfx.shwarn();
}
function stepShrink(dt){
  if(!SH.on)return;
  SH.t+=dt;SH.shove=Math.max(0,SH.shove-dt*3);
  if(SH.ph===0){                                          // warning: edges pulse, nothing moves yet
    if(SH.t>=.95){SH.ph=1;SH.t=0;shake(.35);sfx.shmove()}}
  else if(SH.ph===1){                                     // closing
    const u=clamp(SH.t/1.25,0,1),e=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
    SH.l=SH.tl*e;SH.r=SH.tr*e;SH.u=SH.tu*e;SH.d=SH.td*e;
    if(u>=1){SH.ph=2;SH.t=0;shake(.45);G.fl=Math.max(G.fl,.14);G.fc=0;sfx.shlock();
      if(SH.mode===3){const cx=(SH.l+AW-SH.r)/2,cy=(SH.u+AH-SH.d)/2;   // the box fills with a burst
        const r0=rnd(0,TAU),v=G.speed*.55;
        for(let i=0;i<8;i++){const a=r0+i*TAU/8;spawnObs(cx,cy,Math.cos(a)*v,Math.sin(a)*v,20,i*.05)}
        burst(cx,cy,14,180,.5,3,1,3)}}}
  else if(SH.ph===2){                                     // held shut
    if(SH.t>=SH.hold){SH.ph=3;SH.t=0;sfx.shopen()}}
  else{                                                   // opening back up
    const u=clamp(SH.t/.9,0,1),e=1-Math.pow(1-u,3);
    SH.l=SH.tl*(1-e);SH.r=SH.tr*(1-e);SH.u=SH.tu*(1-e);SH.d=SH.td*(1-e);
    if(u>=1)shrinkClear()}
  // dust dragged along the moving faces
  if(SH.ph===1&&Math.random()<.7){
    const pick=Math.random();
    if(SH.tl&&pick<.25)emit(SH.l,rnd(0,AH),rnd(60,260),rnd(-60,60),.4,2.4,1,3);
    else if(SH.tr&&pick<.5)emit(AW-SH.r,rnd(0,AH),-rnd(60,260),rnd(-60,60),.4,2.4,1,3);
    else if(SH.tu&&pick<.75)emit(rnd(0,AW),SH.u,rnd(-60,60),rnd(60,260),.4,2.4,1,3);
    else if(SH.td)emit(rnd(0,AW),AH-SH.d,rnd(-60,60),-rnd(60,260),.4,2.4,1,3)}
}
function drawShrink(){
  if(!SH.on)return;
  const warn=SH.ph===0,pulse=.5+.5*Math.sin(clock*(warn?18:7)),
    moving=SH.ph===1||SH.ph===3;
  ctx.save();rr(0,0,AW,AH,26);ctx.clip();
  const faces=[];
  if(SH.tl)faces.push([0,0,SH.l,AH,1,0]);
  if(SH.tr)faces.push([AW-SH.r,0,SH.r,AH,-1,0]);
  if(SH.tu)faces.push([0,0,AW,SH.u,0,1]);
  if(SH.td)faces.push([0,AH-SH.d,AW,SH.d,0,-1]);
  for(let i=0;i<faces.length;i++){
    const [x,y,w,h,nx,ny]=faces[i];
    if(w<=0||h<=0)continue;
    // body: dark slab with a hazard sheen running along it
    A(.92);ctx.fillStyle='#120406';ctx.fillRect(x,y,w,h);
    A(.16);ctx.fillStyle='#ff2a2a';ctx.fillRect(x,y,w,h);
    A(.2);ctx.strokeStyle='rgba(255,90,80,1)';ctx.lineWidth=1;
    ctx.beginPath();
    if(nx){for(let k=-h;k<h*2;k+=26){ctx.moveTo(x,y+k);ctx.lineTo(x+w,y+k+w)}}
    else{for(let k=-w;k<w*2;k+=26){ctx.moveTo(x+k,y);ctx.lineTo(x+k+h,y+h)}}
    ctx.stroke();
    // the live edge
    const ex=nx>0?x+w:nx<0?x:0,ey=ny>0?y+h:ny<0?y:0;
    A(1);ctx.strokeStyle=warn?'rgba(255,'+(90+120*pulse|0)+',80,1)':'rgba(255,230,200,.95)';
    ctx.lineWidth=warn?2+2*pulse:3;
    ctx.beginPath();
    if(nx){ctx.moveTo(ex,y);ctx.lineTo(ex,y+h)}else{ctx.moveTo(x,ey);ctx.lineTo(x+w,ey)}
    ctx.stroke();
    ctx.globalCompositeOperation='lighter';
    A(moving?.6:.34+.3*pulse);
    if(nx)ctx.drawImage(glowR,ex-90,-40,180,AH+80);else ctx.drawImage(glowR,-40,ey-90,AW+80,180);
    ctx.globalCompositeOperation='source-over';
  }
  // the warning outline of where the walls are about to stop
  if(warn){A(.25+.4*pulse);ctx.strokeStyle='rgba(255,70,60,1)';ctx.lineWidth=2;
    ctx.setLineDash([14,12]);ctx.strokeRect(SH.tl,SH.tu,AW-SH.tl-SH.tr,AH-SH.tu-SH.td);ctx.setLineDash([])}
  // the surviving pocket gets a faint rim so its shape is readable
  if(!warn){A(.3);ctx.strokeStyle='rgba(255,180,150,.8)';ctx.lineWidth=1.4;
    ctx.strokeRect(SH.l,SH.u,AW-SH.l-SH.r,AH-SH.u-SH.d)}
  A(1);ctx.restore();
}

/* ==================== 13-shooting.js */
/* ================= TP, SHOOTING, UPGRADES ================= */
// Standing near red cubes (graze) fills TP; holding fire spends it on auto-aimed shots. Pickups upgrade the cube.
const COST=4,BN=80,PKN=4,FF='"Comic Sans MS",CSans,"Comic Sans",sans-serif',FONT='700 13px '+FF;
const tpEl=$('tp'),tpv=$('tpv'),upsEl=$('ups'),cellsEl=$('cells');
let gz=0,gt=0,tpi=-1,fireCd=0,tipDone=false;P.inv=0;P.gl=0;P.tk=0;
const U={rate:0,power:0,multi:0,pierce:0,graze:0,shield:0,
  homing:0,orbit:0,magnet:0,phase:0,surge:0,chrono:0};
// key, label, max level, draw weight, what it does
const UP=[
  ['rate','RATE',5,3,'Shoot faster. Each level cuts the gap between volleys by a fifth.'],
  ['power','POWER',3,3,'Every shot hits harder. Big cubes take fewer hits to break.'],
  ['multi','MULTI',4,2,'Fire an extra shot per volley, spread in a fan.'],
  ['pierce','PIERCE',3,2,'Shots carry on through what they kill instead of stopping.'],
  ['graze','GRAZE',3,2,'A wider near-miss ring, and grazing fills TP faster.'],
  ['shield','SHIELD',5,3,'One more shield. Each absorbs a hit and clears the cubes around you.'],
  ['homing','HOMING',3,3,'Shots curve toward whatever is nearest. Harder to miss with.'],
  ['orbit','ORBIT',8,1,'Another shard circles you and breaks what it touches, then recharges.'],
  ['magnet','MAGNET',2,2,'Pickups pull toward you from across the arena.'],
  ['phase','PHASE',3,2,'The dash recharges sooner and carries you further.'],
  ['surge','SURGE',2,2,'At a five chain, your fire rate doubles for a few seconds.'],
  ['chrono','CHRONO',2,1,'Every near miss drags time out for a moment.']
];
const bul=Array.from({length:BN},()=>({on:0,x:0,y:0,vx:0,vy:0,l:0,d:1,p:0}));
const pks=Array.from({length:PKN},()=>({on:0,x:0,y:0,k:0,l:0,t:0}));
const bnEl=$('banner'),bnT=$('bt'),bnS=$('bs');
function toast(t,sub){   // announcement banner: big title, red underline sweeps in, dim subtitle
  if(G.state==='menu')return;bnT.textContent=t;bnS.textContent=sub||'';bnEl.classList.remove('go');void bnEl.offsetWidth;bnEl.classList.add('go')
}
const ICO={rate:'<path d="M6 6l6 6-6 6M13 6l6 6-6 6"/>',power:'<path d="M13 3L6 13h5l-1 8 7-10h-5z"/>',multi:'<path d="M12 20v-9M12 20L6 8M12 20l6-12"/>',pierce:'<path d="M3 12h18M17 7l4 5-4 5M8 5v14"/>',graze:'<circle cx="12" cy="12" r="3"/><path d="M12 3a9 9 0 0 1 9 9M12 21a9 9 0 0 1-9-9"/>',shield:'<path d="M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6z"/>',
  homing:'<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  orbit:'<circle cx="12" cy="12" r="2.6"/><ellipse cx="12" cy="12" rx="9" ry="4.4" transform="rotate(-25 12 12)"/><circle cx="20" cy="8.6" r="1.8"/>',
  magnet:'<path d="M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4z"/>',
  phase:'<path d="M4 7h10M4 12h14M4 17h10"/><path d="M16 7l4 5-4 5"/>',
  surge:'<path d="M4 14l5-10v7h5l-5 9v-6z"/><path d="M16 5l4 4M16 15l4 4"/>',
  chrono:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>'};
function upsHud(pop){   // inventory slots: icon + level pips
  let h='';for(let i=0;i<UP.length;i++){const u=UP[i],v=U[u[0]];let pp='';for(let j=0;j<u[2];j++)pp+='<b'+(j<v?' class="l"':'')+'></b>';
    h+='<span class="up'+(v?' on':' off')+'" title="'+u[1]+'"><svg viewBox="0 0 24 24">'+ICO[u[0]]+'</svg><span class="pp">'+pp+'</span></span>'}
  upsEl.innerHTML=h;if(pop>=0&&upsEl.children[pop])upsEl.children[pop].animate([{transform:'scale(1.35)',filter:'brightness(2)'},{transform:'none',filter:'none'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'})
}
const cells=Array.from({length:25},()=>cellsEl.appendChild(document.createElement('i')));let tpCount=0;
function tpHud(ti){   // 25 cells x 4 TP each; a cell flashes as it fills
  const n=ti>>2;
  for(let i=0;i<25;i++)cells[i].className=i<n?'on':(i===n&&(ti&3)>=2)?'half':'';
  if(n>tpCount)for(let i=tpCount;i<n;i++)cells[i].animate([{transform:'scaleY(2.4)',filter:'brightness(3)'},{transform:'none',filter:'none'}],{duration:280,easing:'cubic-bezier(.2,.8,.2,1)'});
  tpCount=n;
}
const chainEl=$('chain'),cnEl=$('cn'),cfEl=$('cf');
function chainHud(){const on=G.chain>=2&&G.chainT>0&&G.state==='play';chainEl.classList.toggle('on',on);if(on){cnEl.textContent='×'+G.chain;cfEl.style.transform='scaleX('+(G.chainT/3.2).toFixed(3)+')'}}
/* floating combat text (world space) */
const FTN=28,ft=Array.from({length:FTN},()=>({on:0,x:0,y:0,l:1,m:1,t:'',c:'#fff',s:20}));let fti=0;
function popText(x,y,t,c,s){if(G.state==='menu')return;const f=ft[fti];fti=(fti+1)%FTN;f.on=1;f.x=x;f.y=y;f.l=f.m=1;f.t=t;f.c=c||'#fff';f.s=s||20}
function stepText(dt){for(let i=0;i<FTN;i++){const f=ft[i];if(!f.on)continue;f.l-=dt;if(f.l<=0){f.on=0;continue}f.y-=52*dt*(.3+f.l/f.m)}}
function drawText(){
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.globalCompositeOperation='source-over';
  for(let i=0;i<FTN;i++){const f=ft[i];if(!f.on)continue;const u=1-f.l/f.m,k=easeOutBack(Math.min(1,u*5)),a=f.l/f.m<.35?f.l/f.m/.35:1;
    ctx.font='700 '+f.s+'px '+FF;A(a);ctx.fillStyle=f.c;ctx.save();ctx.translate(f.x,f.y);ctx.scale(k,k);ctx.fillText(f.t,0,0);ctx.restore()}
  ctx.restore();A(1);
}
function resetArm(){document.body.classList.remove('picking');if(AC)flLoadSnd();for(const k in U)U[k]=0;U.shield=hShield(5+SHOP.hp);G.surgeT=0;ORB.length=0;        // start every run with a full set of shields
  for(let i=0;i<BN;i++)bul[i].on=0;for(let i=0;i<PKN;i++)pks[i].on=0;for(let i=0;i<WN;i++)wrn[i].on=0;shrinkClear();knightReset();aquaReset();bridgeReset();floweyReset();lavaPreload();lavaSound(false);clearHaz();F.on=false;F.la=0;setKeyLabel(0);P.z=P.jt=0;fireCd=0;P.inv=0;P.gl=P.tk=0;P.dsh=0;P.dcd=0;P.ddx=1;P.ddy=0;dashPrev=-1;for(let i=0;i<DGN;i++)dgh[i].on=0;gt=0;tpi=-1;tmSec=-1;thrLv=0;upsHud()}
function fireBullet(x,y,a,d,p){for(let i=0;i<BN;i++){const b=bul[i];if(b.on)continue;b.on=1;b.x=x;b.y=y;b.vx=Math.cos(a)*900;b.vy=Math.sin(a)*900;b.l=1.4;b.d=d;b.p=p;return}}
function stepShoot(dt){
  if(BR.on)return;                                        // the fire key is the Quick Embrace input here
  fireCd-=dt;
  if(!P.alive||(G.state!=='play'&&G.state!=='menu')||P.drop>0||F.on||fireCd>0||G.tp<COST)return;
  const want=FB.on?(TOUCH||!!keys.e):(keys.f||keys.e||G.state==='menu');   // SPACE is the jump in there, so E shoots
  if(!want)return;
  let bd=knightLive()?330:760,bo=null;                     // auto-aim: nearest visible cube or live knife, with target lead
  // while he is up, stop reaching across the room for a cube: the shots you can spare go to him
  for(let j=0;j<ON;j++){const o=obs[j];if(!o.on||o.a<.5)continue;const d=Math.hypot(o.x-P.x,o.y-P.y);if(d<bd){bd=d;bo=o}}
  for(let j=0;j<KFN;j++){const k=kf[j];if(!k.on||k.st!==1)continue;const d=Math.hypot(k.x-P.x,k.y-P.y);if(d<bd){bd=d;bo=k}}
  let tx,ty,tvx=0,tvy=0;
  if(bo){tx=bo.x;ty=bo.y;tvx=bo.vx;tvy=bo.vy}
  else{const bb=(FB.on&&flBody())||bossBody();if(!bb)return;tx=bb.x;ty=bb.y;bd=Math.hypot(tx-P.x,ty-P.y)}   // no cubes in range: shoot whichever boss is up
  const t=bd/900,a=Math.atan2(ty+tvy*t-P.y,tx+tvx*t-P.x),n=1+U.multi,dx=Math.cos(a),dy=Math.sin(a);
  fireCd=.26*Math.pow(.8,U.rate)*(G.surgeT>0?.5:1);G.tp-=COST;ach('rShots');ach('shots');AS.rNoShot=1;
  for(let i=0;i<n;i++)fireBullet(P.x+dx*16,P.y+dy*16,a+(i-(n-1)/2)*.15,1+U.power+SHOP.dmg*.6,U.pierce);
  P.vx-=dx*40;P.vy-=dy*40;                                 // tiny recoil
  for(let i=0;i<3;i++)emit(P.x+dx*18,P.y+dy*18,dx*260+rnd(-70,70),dy*260+rnd(-70,70),.18,2.4,0,6);
  sfx.shoot();
}
let bossB=null;
function stepBul(dt){bossB=bossBody();const n=Math.max(1,Math.ceil(dt/.012));for(let s=0;s<n;s++)stepBul1(dt/n)}   // substeps: no tunnelling
function stepBul1(dt){
  for(let i=0;i<BN;i++){const b=bul[i];if(!b.on)continue;
    if(U.homing&&b.l<1.25){let bd=460,bo=null;                      // homing: curve toward the nearest cube
      for(let j=0;j<ON;j++){const o=obs[j];if(!o.on||o.a<.5)continue;
        const d=Math.hypot(o.x-b.x,o.y-b.y);if(d<bd){bd=d;bo=o}}
      if(!bo&&bossB){bo=bossB}
      if(bo){const sp=Math.hypot(b.vx,b.vy),c=Math.atan2(b.vy,b.vx),
        t=Math.atan2(bo.y-b.y,bo.x-b.x),w=Math.atan2(Math.sin(t-c),Math.cos(t-c)),
        m=U.homing*2.4*dt,nn=c+clamp(w,-m,m);
        b.vx=Math.cos(nn)*sp;b.vy=Math.sin(nn)*sp}}
    b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;
    if(b.l<=0||b.x<-80||b.x>AW+(bossB||FB.on?600:80)||b.y<-80||b.y>AH+80){b.on=0;continue}
    for(let j=0;j<ON;j++){const o=obs[j];if(!o.on||o.a<.5||(o.hb===i&&gt-o.ht<.3))continue;
      if(Math.hypot(b.x-o.x,b.y-o.y)>o.s*.5+5)continue;
      o.hb=i;o.ht=gt;o.hp-=b.d;o.f=.1;burst(b.x,b.y,4,200,.25,2,0,5);sfx.hit();
      if(o.hp<=0)kill(o);
      if(b.p>0)b.p--;else{b.on=0;break}                    // pierce upgrade lets shots pass through
    }
    if(b.on)for(let j=0;j<KFN;j++){const k=kf[j];if(!k.on||k.st!==1)continue;       // Aqua's knives can be shot out of the air
      if(Math.hypot(b.x-k.x,b.y-k.y)>12+13*k.sz)continue;
      k.on=0;G.kills++;G.bonus+=10;burst(k.x,k.y,9,270,.45,2.8,1,3);sfx.kill();popText(k.x,k.y-12,'+10','#ff6a66',16);
      if(b.p>0)b.p--;else{b.on=0;break}}
    if(b.on&&FB.on)for(let j=FB.bul.length-1;j>=0;j--){const q=FB.bul[j];   // his spray can be shot down
      if(Math.hypot(b.x-q.x,b.y-q.y)>q.s*.34+6)continue;
      FB.bul.splice(j,1);ach('fMattShots');burst(b.x,b.y,7,250,.35,2.6,1,4);sfx.kill();G.bonus+=6;
      if(b.p>0)b.p--;else{b.on=0;break}}
    if(b.on&&FB.on){const fb=flBody();                               // the final boss can be hurt
      if(fb&&Math.abs(b.x-fb.x)<fb.w&&Math.abs(b.y-fb.y)<fb.h){flHurt(b.d);burst(b.x,b.y,5,240,.3,2.4,1,4);
        if(b.p>0)b.p--;else{b.on=0;continue}}}
    if(b.on&&bossB&&Math.hypot(b.x-bossB.x,b.y-bossB.y)<bossB.r){                      // the Knight bleeds now
      if(knightLive()){knightHurt(b.d);burst(b.x,b.y,5,240,.3,2.4,1,4);sfx.hit()}else fizzle(b);
      if(b.p>0)b.p--;else b.on=0}
  }
}
function kill(o,quiet){o.on=0;G.kills++;ach('rKills');ach('kills');bst++;
  if(o.k>0&&knightLive())knightHurt(KCUBE());   // what he throws is part of him
boomAt(o.x,o.y,.32+o.s/90);burst(o.x,o.y,14,320,.6,3.6,1,3);burst(o.x,o.y,6,200,.4,2.4,0,3);G.bonus+=10;shake(.05);sfx.kill();if(!quiet)popText(o.x,o.y-12,'+10','#ff6a66',17)}
function shieldBreak(){   // a shield absorbs one hit, then blasts nearby cubes and grants brief invulnerability
  U.shield--;upsHud();P.inv=FB.on?2.3:1.7;   // more room to recover inside the finale
  AS.rHit=(AS.rHit||0)+1;AS.rClean=0;K.clean=false;FB.clean=false;G.lastHit=G.t;
  for(let j=0;j<ON;j++){const q=obs[j];if(q.on&&Math.hypot(q.x-P.x,q.y-P.y)<270)kill(q,true)}
  for(let i=0;i<36;i++){const a=i/36*TAU;emit(P.x,P.y,Math.cos(a)*640,Math.sin(a)*640,.55,3.4,0,4.5)}
  boomAt(P.x,P.y,2.2);shake(.5);G.fl=Math.max(G.fl,.22);G.fc=0;slow(.14,.3);sfx.shield();toast('Shield broke','Nearby cubes destroyed');
}
function spawnPick(){
  let n=0,tw=0;for(let i=0;i<PKN;i++)if(pks[i].on)n++;if(n>=3)return;
  for(let i=0;i<UP.length;i++)if(U[UP[i][0]]<UP[i][2])tw+=UP[i][3];if(!tw)return;
  let r=sr()*tw,k=0;for(let i=0;i<UP.length;i++){if(U[UP[i][0]]>=UP[i][2])continue;r-=UP[i][3];if(r<=0){k=i;break}}
  for(let i=0;i<PKN;i++){const p=pks[i];if(p.on)continue;let x,y,t=0;do{x=rnd(90,AW-90);y=rnd(90,AH-90)}while(Math.hypot(x-P.x,y-P.y)<170&&++t<12);
    p.on=1;p.x=x;p.y=y;p.k=k;p.l=16;p.t=0;burst(x,y,10,120,.5,2.4,0,3);return}
}
function collect(p){
  p.on=0;
  for(let i=0;i<28;i++){const a=i/28*TAU;emit(p.x,p.y,Math.cos(a)*300,Math.sin(a)*300,.6,3,0,4)}
  shake(.12);G.fl=Math.max(G.fl,.05);G.fc=0;
  if(G.state==='menu'){collectApply(p,(Math.random()*UP.length)|0);return}   // the title demo just takes one
  cardOpen(p);
}
function collectApply(p,k){
  G.tp=Math.min(100,G.tp+30);popText(P.x,P.y-30,'+30 TP','#fff',18);
  if(k>=0&&U[UP[k][0]]<UP[k][2]){const u=UP[k];U[u[0]]++;upsHud(k);toast(u[1],'Level '+U[u[0]])}
  else toast('+30 TP','Everything is maxed');
  sfx.up();
}
function stepPicks(dt){const mr=U.magnet?130+130*U.magnet:0;
  for(let i=0;i<PKN;i++){const p=pks[i];if(!p.on)continue;p.t+=dt;p.l-=dt;
    if(mr&&P.alive){const dx=P.x-p.x,dy=P.y-p.y,d=Math.hypot(dx,dy);
      if(d<mr&&d>1){const k=(1-d/mr)*300*dt;p.x+=dx/d*k;p.y+=dy/d*k}}if(p.l<=0){p.on=0;burst(p.x,p.y,8,90,.4,2,0,3);continue}if((G.state==='play'||G.state==='menu')&&P.alive&&P.drop<=0&&Math.hypot(P.x-p.x,P.y-p.y)<26)collect(p)}}
Object.assign(sfx,{no(){tone(150,.12,'square',.04,90)},
  win(){tone(523.25,.5,'sine',.09,784);setTimeout(()=>tone(659.25,.5,'sine',.08,988),140);setTimeout(()=>tone(783.99,1.1,'sine',.08,1174),300)},
  cardUp(){tone(640,.12,'sine',.06,940);setTimeout(()=>tone(960,.16,'sine',.05,1300),80)},
  dashgo(){tone(520,.13,'triangle',.05,170);noise(.1,.1,2400)},
  dashrdy(){tone(880,.07,'sine',.03,1180)},
  shwarn(){tone(180,.5,'square',.045,120);noise(.3,.12,500)},
  shmove(){tone(90,.9,'sawtooth',.07,54);noise(.8,.16,340)},
  shlock(){tone(64,.5,'sine',.13,36);noise(.3,.3,260)},
  shopen(){tone(150,.5,'sine',.06,330)},
  dash(){tone(300,.14,'sawtooth',.05,80);noise(.1,.09,900)},split(){tone(420,.1,'square',.04,190);noise(.12,.08,1300)},
  shoot(){tone(760+rnd(0,80),.05,'triangle',.028,320)},hit(){tone(260,.05,'square',.025,140)},kill(){tone(200,.14,'sawtooth',.05,55);noise(.12,.1,1600)},up(){tone(520,.1,'sine',.07,780);setTimeout(()=>tone(780,.16,'sine',.07,1170),70)},shield(){noise(.4,.35,1400);tone(420,.3,'sine',.1,90)}});


/* --- orbit: a shard that rides around you and breaks what it touches, then has to recharge --- */
const ORB=[];                                     // one per level, however many you buy
function orbFit(){while(ORB.length<U.orbit)ORB.push({a:ORB.length/Math.max(1,U.orbit)*TAU,cd:0});
  for(let i=0;i<ORB.length;i++)ORB[i].a=ORB[i].a}
function stepOrbit(dt){
  if(!U.orbit||!P.alive||G.state!=='play')return;
  if(ORB.length<U.orbit)orbFit();
  for(let i=0;i<U.orbit&&i<ORB.length;i++){const o=ORB[i];
    o.a+=dt*2.15;if(o.cd>0){o.cd-=dt;continue}
    const R=64,x=P.x+Math.cos(o.a)*R,y=P.y+Math.sin(o.a)*R;
    for(let j=0;j<ON;j++){const q=obs[j];
      if(!q.on||q.a<.5||q.s>40)continue;                         // it cannot break the big ones
      if(Math.hypot(q.x-x,q.y-y)>q.s*.5+9)continue;
      kill(q);o.cd=.85;burst(x,y,8,220,.35,2.4,0,4);break}}
}
function drawOrbit(){
  if(!U.orbit||!P.alive)return;
  if(ORB.length<U.orbit)orbFit();
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<U.orbit&&i<ORB.length;i++){const o=ORB[i],R=64,x=P.x+Math.cos(o.a)*R,y=P.y+Math.sin(o.a)*R,
    rdy=o.cd<=0,s=rdy?9:5;
    A(rdy?.75:.3);ctx.drawImage(glowW,x-26,y-26,52,52);
    A(rdy?1:.42);ctx.fillStyle='#fff';
    ctx.save();ctx.translate(x,y);ctx.rotate(o.a*2.4);rr(-s/2,-s/2,s,s,s*.25);ctx.fill();ctx.restore()}
  ctx.globalCompositeOperation='source-over';A(1);
}

/* ==================== 14-cards.js */
/* ================= UPGRADE CARDS =================
   A pickup no longer hands you a random upgrade. It stops the arena and offers three, and you
   take one. That one choice is what makes two runs with the same seed end up different. */
const cardEl=$('cards'),cardRow=$('cardrow');let cardPick3=[],cardI=0,cardPend=null;
function cardOpen(p){
  const avail=[];
  for(let i=0;i<UP.length;i++)if(U[UP[i][0]]<UP[i][2])for(let w=0;w<UP[i][3];w++)avail.push(i);
  const seen={},pool=[];
  for(let i=0;i<UP.length;i++)if(U[UP[i][0]]<UP[i][2])pool.push(i);
  if(!pool.length){collectApply(p,-1);return}                   // everything maxed: just take the TP
  cardPick3=[];
  while(cardPick3.length<Math.min(3,pool.length)){
    const k=avail.length?avail[(Math.random()*avail.length)|0]:pool[(Math.random()*pool.length)|0];
    if(seen[k])continue;seen[k]=1;cardPick3.push(k)}
  cardPend=p;cardI=0;
  let h='';
  for(let i=0;i<cardPick3.length;i++){const u=UP[cardPick3[i]],v=U[u[0]];
    let pp='';for(let j=0;j<u[2];j++)pp+='<b'+(j<v?' class="l"':'')+'></b>';
    h+='<div class="card'+(i===0?' sel':'')+(v?'':' new')+'" data-i="'+i+'">'+
       '<svg viewBox="0 0 24 24">'+ICO[u[0]]+'</svg>'+
       '<h4>'+u[1]+'</h4><span class="lv">'+(v?'Level '+v+' → '+(v+1):'New')+'</span>'+
       '<p>'+u[4]+'</p><span class="pp">'+pp+'</span></div>'}
  cardRow.innerHTML=h;
  for(const k in keys)keys[k]=0;
  G.state='cards';document.body.classList.add('picking');show('cards');sfx.cardUp();
}
function cardMove(d){
  if(!cardPick3.length)return;
  cardI=(cardI+d+cardPick3.length)%cardPick3.length;
  const c=cardRow.children;for(let i=0;i<c.length;i++)c[i].classList.toggle('sel',i===cardI);
  sfx.nav();
}
function cardTake(){ach('rUps');ach('ups');AS.rNoUp=1;
  if(!cardPick3.length)return;
  const k=cardPick3[cardI],p=cardPend;
  cardPick3=[];cardPend=null;cardRow.innerHTML='';
  document.body.classList.remove('picking');show(null);G.state='play';
  collectApply(p,k);
}
cardRow.addEventListener('click',e=>{
  const c=e.target.closest&&e.target.closest('.card');if(!c)return;
  cardI=+c.dataset.i;cardTake()});
cardRow.addEventListener('pointermove',e=>{
  const c=e.target.closest&&e.target.closest('.card');if(!c||+c.dataset.i===cardI)return;
  cardI=+c.dataset.i;const ch=cardRow.children;
  for(let i=0;i<ch.length;i++)ch[i].classList.toggle('sel',i===cardI)});

/* ==================== 15-shop.js */
/* ================= SHARDS, THE SHOP, AND SCALING =================
   Runs pay out shards. Shards buy permanent stats from the menu, and those stats stay bought.
   The catch is that the game reads what you own and pushes back: every level you buy nudges
   enemy speed, spawn density and boss health up with it, so the fight never gets easier --
   it gets bigger. You are not grinding past the game, you are growing into it. */
const SHOPK=[
  ['spd','SPEED',   5, 40,1.6,'Move faster. Every level adds about 6% to your top speed.'],
  ['dmg','DAMAGE',  5, 55,1.7,'Every shot lands harder, from the first cube to the last boss.'],
  ['hp', 'PLATING', 4, 70,1.9,'Start each run with another shield already fitted.'],
  ['tp', 'CHARGE',  4, 45,1.6,'Grazing fills TP faster, so you shoot more often.'],
  ['dsh','KINETICS',4, 50,1.7,'The dash comes back sooner and carries you further.']
];
const SHOP={spd:0,dmg:0,hp:0,tp:0,dsh:0};
let shards=0;
/* ---- rebirth ----
   Max everything out and the shop offers to take it all away. You lose every level and every
   shard; you gain a rebirth, and a rebirth raises the ceiling on all five upgrades by one,
   pays out more for the rest of time, and makes the arena worse by the same amount. The
   ceiling has no limit, so neither does the ladder -- rebirth nine is a different game from
   rebirth one, in both directions. */
let RB=0;
const rbCost=()=>Math.round(2600*Math.pow(1.85,RB));
const rbPay=()=>1+RB*.55;                          // every run pays more, forever
const rbHeat=()=>1-Math.pow(.86,RB);               // 0, .14, .26, .36 ... and never reaches 1
function shopCap(){let m=0;for(let i=0;i<SHOPK.length;i++)m+=SHOPK[i][2]+RB;return m}
function rbReady(){return shopTotal()>=shopCap()&&shards>=rbCost()}
function rebirth(){
  if(!rbReady()){sfx.no();return}
  RB++;
  for(const k in SHOP)SHOP[k]=0;
  shards=0;                                        // you walk out with nothing but the number
  shopSave();ach('rebirths');achCheck();
  shopDraw();hsUpdate();sfx.win();shake(.9);
  toast('Rebirth '+RB,'Every ceiling is one higher. So is everything else.');
}
function shopLoad(){
  shards=+store.get('cube-shards','0')||0;RB=Math.max(0,+store.get('cube-rb','0')||0);
  try{const s=JSON.parse(store.get('cube-shop','')||'{}');
    for(const k in SHOP)if(typeof s[k]==='number')SHOP[k]=clamp(s[k]|0,0,shopMax(k))}catch(e){}
}
function shopSave(){store.set('cube-shards',String(shards));store.set('cube-shop',JSON.stringify(SHOP));store.set('cube-rb',String(RB))}
function shopMax(k){for(let i=0;i<SHOPK.length;i++)if(SHOPK[i][0]===k)return SHOPK[i][2]+RB;return 0}
function shopCost(i){const u=SHOPK[i];return Math.round(u[3]*Math.pow(u[4],SHOP[u[0]])*Math.pow(1.5,RB))}
function shopTotal(){let n=0;for(const k in SHOP)n+=SHOP[k];return n}
/* ---- the scaling ----
   dsK() is what you own between runs, 0..1. pwr() is what you are holding right now: the
   shop, plus every upgrade card you have picked up this run, plus the shields in hand. The
   arena is driven by pwr(), so it answers a good run while the run is still happening
   instead of waiting for the next one. */
function dsK(){return clamp(shopTotal()/shopCap(),0,1)}
let UPMAX=0;function upMax(){if(!UPMAX)for(let i=0;i<UP.length;i++)UPMAX+=UP[i][2];return UPMAX}
function upTotal(){let n=0;for(let i=0;i<UP.length;i++)if(UP[i][0]!=='shield')n+=U[UP[i][0]];return n}
function pwr(){
  const shop=dsK(),                                     // what you bought
        run=clamp(upTotal()/(upMax()*.62),0,1),         // what you have picked up this run
        sh=clamp((U.shield-4)/9,0,1);                   // and how much you can afford to lose
  return clamp(shop*.42+run*.46+sh*.12,0,1);
}
function dsSpeed(){return(1+pwr()*.62)*(1+rbHeat()*.7)}      // cubes move faster
function dsRate(){return(1-pwr()*.5)*(1-rbHeat()*.45)}       // and arrive far closer together
function dsHP(){return hHP((1+pwr()*1.7)*(1+rbHeat()*1.6))}  // and the bosses hold up longer
function dsDiff(){return clamp(pwr()*.26+rbHeat()*.34,0,.6)} // and the curve starts further along
/* --- the screen --- */
const shopEl=$('shop'),shopRow=$('shoprow'),shardEl=$('shardn'),shardM=$('shardm');
let shopI=0;
function shopDraw(){
  let h='';
  for(let i=0;i<SHOPK.length;i++){const u=SHOPK[i],cap=shopMax(u[0]),v=SHOP[u[0]],max=v>=cap,c=shopCost(i);
    let pp='';for(let j=0;j<cap;j++)pp+='<b'+(j<v?' class="l"':'')+(j>=u[2]?' r':'')+'></b>';
    h+='<div class="srow'+(i===shopI?' sel':'')+(max?' max':'')+(!max&&shards>=c?' can':'')+'" data-i="'+i+'">'+
       '<span class="sn">'+u[1]+'</span>'+
       '<span class="spp">'+pp+'</span>'+
       '<span class="sd">'+u[5]+'</span>'+
       '<span class="sc">'+(max?'MAX':fmt(c)+' ◆')+'</span></div>'}
  // the ladder's next rung, offered once everything else is at the top
  const full=shopTotal()>=shopCap(),rc=rbCost(),ri=SHOPK.length;
  h+='<div class="srow rb'+(ri===shopI?' sel':'')+(rbReady()?' can':'')+(full?'':' off')+'" data-i="'+ri+'">'+
     '<span class="sn">REBIRTH'+(RB?'  ×'+RB:'')+'</span>'+
     '<span class="spp"></span>'+
     '<span class="sd">'+(full
       ?'Hand back every level and every shard. Each upgrade gains a level of headroom and every run pays '+Math.round((RB+1)*55)+'% more — and the arena answers in kind. There is no last one.'
       :'Max out all five first. Then the ceiling moves.')+'</span>'+
     '<span class="sc">'+(full?fmt(rc)+' ◆':'LOCKED')+'</span></div>';
  shopRow.innerHTML=h;
  shardEl.textContent=fmt(shards);
  shardM.textContent=(RB?'Rebirth '+RB+'  ·  ':'')+
    (shopTotal()?'Difficulty +'+Math.round((dsK()*.42+rbHeat())*100)+'%':(RB?'Nothing bought yet':'No upgrades yet'));
}
function shopOpen(){shopTab=0;shopI=0;shopDraw();show('shop');sfx.ui()}
function shopMove(d){const n=SHOPK.length+1;shopI=(shopI+d+n)%n;shopDraw();sfx.nav()}
function shopBuy(){const _sp=shards;
  const i=shopI;
  if(i===SHOPK.length){rebirth();return}
  const u=SHOPK[i];
  if(SHOP[u[0]]>=shopMax(u[0])){sfx.no();return}
  const c=shopCost(i);
  if(shards<c){sfx.no();return}
  shards-=c;ach('spend',c);SHOP[u[0]]++;shopSave();shopDraw();sfx.up();
  const el=shopRow.children[i];
  if(el)el.animate([{transform:'scale(1.03)',filter:'brightness(2)'},{transform:'none',filter:'none'}],
    {duration:360,easing:'cubic-bezier(.2,.8,.2,1)'});
}
shopRow.addEventListener('click',e=>{const r=e.target.closest&&e.target.closest('.srow');
  if(!r)return;shopI=+r.dataset.i;shopDraw();shopBuy()});
/* --- payout --- */
function payout(){
  if(G.banked)return 0;                                  // already paid, at the multiplier
  const got=Math.round(rbPay()*hPay(Math.max(1,Math.round(G.score/140)+Math.round(G.kills/8)+(G.floweyDone?60:0))));
  shards+=got;ach('earn',got);shopSave();return got;
}

/* ==================== 16-skins.js */
/* ================= COSMETICS =================
   Skins for the cube. Bought with the same shards the upgrades use, kept forever, and purely
   a look -- none of them change a number. A few cost almost nothing so there is always
   something to spend a bad run on; a few cost more than most runs will ever pay out. */
const SKINS=[
  ['classic', 'Classic',    0,    '#fff → #c9c9d0'],
  ['ember',   'Ember',      25,   'warm'],
  ['mint',    'Mint',       25,   'cool'],
  ['violet',  'Violet',     45,   'cool'],
  ['ink',     'Ink',        80,   'dark'],
  ['rust',    'Rust',       140,  'warm'],
  ['chrome',  'Chrome',     260,  'metal'],
  ['glass',   'Glass',      340,  'clear'],
  ['hollow',  'Hollow',     420,  'outline'],
  ['circuit', 'Circuit',    700,  'lit'],
  ['prism',   'Prism',      1600, 'shifting'],
  ['nebula',  'Nebula',     2400, 'deep'],
  ['void',    'Void',       3600, 'absent'],
  ['gold',    'Solid Gold', 6000, 'obscene']
];
const SKGLOW={classic:'255,255,255',ember:'255,150,70',mint:'150,255,190',violet:'190,150,255',
  ink:'120,120,140',rust:'226,120,60',chrome:'220,230,255',glass:'190,230,255',
  hollow:'255,255,255',circuit:'120,255,210',prism:'255,255,255',nebula:'180,140,255',
  void:'150,120,255',gold:'255,214,110'};
const SKCSS={classic:'linear-gradient(160deg,#fff,#c9c9d0)',ember:'linear-gradient(160deg,#ffd9a0,#e8641c)',
  mint:'linear-gradient(160deg,#dcffe9,#39c97e)',violet:'linear-gradient(160deg,#e3d4ff,#7a3cff)',
  ink:'linear-gradient(160deg,#4a4a56,#0a0a10)',rust:'linear-gradient(160deg,#e8a36a,#8c3310)',
  chrome:'linear-gradient(160deg,#fff,#8e9bb5 40%,#fff 55%,#5d6880)',
  glass:'linear-gradient(160deg,rgba(220,245,255,.75),rgba(120,180,220,.35))',
  hollow:'transparent',circuit:'linear-gradient(160deg,#10231d,#04110d)',
  prism:'linear-gradient(90deg,#ff4d4d,#ffd24d,#4dff88,#4dd2ff,#b44dff,#ff4d4d)',
  nebula:'radial-gradient(circle at 35% 30%,#b98cff,#2a1150 70%)',
  void:'radial-gradient(circle at 50% 50%,#000 55%,#7a5cff)',
  gold:'linear-gradient(160deg,#fff3c4,#e0a93a 45%,#fff0b8 60%,#9c6d14)'};
/* A skin may carry a picture instead of a paint routine: give its row a fifth entry with
   the path, drop the file in assets/skins, and the cube wears it. See the README. */
const SKIMG={};
for(let i=0;i<SKINS.length;i++)if(SKINS[i][4]){const im=new Image();im.src=SKINS[i][4];SKIMG[SKINS[i][0]]=im}
const SKOWN={classic:1};let EQUIP='classic';
function skinLoad(){
  try{const o=JSON.parse(store.get('cube-skins','')||'[]');
    for(let i=0;i<o.length;i++)SKOWN[o[i]]=1}catch(e){}
  const e=store.get('cube-skin','classic');
  EQUIP=SKOWN[e]?e:'classic';
}
function skinSave(){
  const o=[];for(const k in SKOWN)if(SKOWN[k])o.push(k);
  store.set('cube-skins',JSON.stringify(o));store.set('cube-skin',EQUIP);
}
const SKGC={};
const skGlow=id=>SKGC[id]||(SKGC[id]=glow(SKGLOW[id]||'255,255,255'));
/* the cube itself, painted inside the transform drawPlayer has already set up */
function cubePaint(s){
  const h=s/2,r=s*.24;let g;
  const pic=SKIMG[EQUIP];
  if(pic&&pic.complete&&pic.naturalWidth){        // a photograph, cropped square and rounded off
    ctx.save();rr(-h,-h,s,s,r);ctx.clip();
    const k=Math.max(s/pic.naturalWidth,s/pic.naturalHeight),w=pic.naturalWidth*k,ht=pic.naturalHeight*k;
    ctx.drawImage(pic,-w/2,-ht/2,w,ht);ctx.restore();
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.6;rr(-h,-h,s,s,r);ctx.stroke();
    return}

  switch(EQUIP){
  case 'ember': g=ctx.createLinearGradient(0,-h,0,h);g.addColorStop(0,'#ffd9a0');g.addColorStop(1,'#e8641c');break;
  case 'mint':  g=ctx.createLinearGradient(0,-h,0,h);g.addColorStop(0,'#dcffe9');g.addColorStop(1,'#39c97e');break;
  case 'violet':g=ctx.createLinearGradient(0,-h,0,h);g.addColorStop(0,'#e3d4ff');g.addColorStop(1,'#7a3cff');break;
  case 'ink':   g=ctx.createLinearGradient(0,-h,0,h);g.addColorStop(0,'#4a4a56');g.addColorStop(1,'#0a0a10');break;
  case 'rust':  g=ctx.createLinearGradient(0,-h,0,h);g.addColorStop(0,'#e8a36a');g.addColorStop(1,'#8c3310');break;
  case 'chrome':g=ctx.createLinearGradient(-h,-h,h,h);
    g.addColorStop(0,'#ffffff');g.addColorStop(.38,'#8e9bb5');g.addColorStop(.52,'#ffffff');
    g.addColorStop(.66,'#6b7790');g.addColorStop(1,'#cdd6e6');break;
  case 'glass': g=ctx.createLinearGradient(0,-h,0,h);
    g.addColorStop(0,'rgba(226,246,255,.8)');g.addColorStop(1,'rgba(120,180,220,.35)');break;
  case 'hollow':g=null;break;
  case 'circuit':g=ctx.createLinearGradient(0,-h,0,h);g.addColorStop(0,'#10231d');g.addColorStop(1,'#04110d');break;
  case 'prism': {const hu=(clock*70)%360;g=ctx.createLinearGradient(-h,-h,h,h);
    g.addColorStop(0,'hsl('+hu+',100%,72%)');g.addColorStop(.5,'hsl('+((hu+90)%360)+',100%,66%)');
    g.addColorStop(1,'hsl('+((hu+200)%360)+',100%,70%)');break}
  case 'nebula':g=ctx.createRadialGradient(-h*.3,-h*.4,1,0,0,s);
    g.addColorStop(0,'#c79dff');g.addColorStop(.55,'#5a2aa8');g.addColorStop(1,'#180a33');break;
  case 'void':  g=ctx.createRadialGradient(0,0,1,0,0,h*1.25);
    g.addColorStop(0,'#000');g.addColorStop(.72,'#07040f');g.addColorStop(1,'#7a5cff');break;
  case 'gold':  g=ctx.createLinearGradient(-h,-h,h,h);
    g.addColorStop(0,'#fff6d2');g.addColorStop(.36,'#e0a93a');g.addColorStop(.54,'#fff0b8');
    g.addColorStop(.74,'#b8841f');g.addColorStop(1,'#ffeaa8');break;
  default:      g=ctx.createLinearGradient(0,-h,0,h);g.addColorStop(0,'#fff');g.addColorStop(1,'#c9c9d0');
  }
  rr(-h,-h,s,s,r);
  if(g){ctx.fillStyle=g;ctx.fill()}
  // the few that need more than a fill
  if(EQUIP==='hollow'){ctx.strokeStyle='#fff';ctx.lineWidth=2.6;ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=1;rr(-h*.52,-h*.52,s*.52,s*.52,r*.5);ctx.stroke()}
  else if(EQUIP==='ink'||EQUIP==='void'){ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.3;ctx.stroke()}
  else if(EQUIP==='glass'){ctx.strokeStyle='rgba(235,250,255,.9)';ctx.lineWidth=1.6;ctx.stroke();
    ctx.globalCompositeOperation='lighter';A(.5);ctx.fillStyle='#fff';
    rr(-h*.62,-h*.66,s*.3,s*.18,3);ctx.fill();ctx.globalCompositeOperation='source-over';A(1)}
  else if(EQUIP==='circuit'){ctx.strokeStyle='rgba(120,255,210,.85)';ctx.lineWidth=1.4;ctx.stroke();
    ctx.globalCompositeOperation='lighter';
    A(.5+.4*Math.sin(clock*5));ctx.strokeStyle='rgba(120,255,210,1)';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(-h*.6,-h*.2);ctx.lineTo(0,-h*.2);ctx.lineTo(0,h*.55);
    ctx.moveTo(h*.6,h*.1);ctx.lineTo(h*.15,h*.1);ctx.stroke();
    ctx.globalCompositeOperation='source-over';A(1)}
  else if(EQUIP==='nebula'){ctx.globalCompositeOperation='lighter';
    for(let i=0;i<7;i++){const sd=i*73.3,a=clock*.5+sd,
      px=Math.cos(a)*h*.55*((sd*.013)%1),py=Math.sin(a*1.3)*h*.55*((sd*.019)%1);
      A(.4+.5*Math.sin(clock*3+i));ctx.fillStyle='#fff';ctx.fillRect(px,py,1.6,1.6)}
    ctx.globalCompositeOperation='source-over';A(1)}
  else if(EQUIP==='gold'){ctx.strokeStyle='rgba(255,240,180,.9)';ctx.lineWidth=1.4;ctx.stroke()}
}
/* --- the cosmetics screen --- */
const skRow=$('skinrow');let skI=0;
function skDraw(){
  let h='';
  for(let i=0;i<SKINS.length;i++){const u=SKINS[i],own=!!SKOWN[u[0]],eq=EQUIP===u[0];
    h+='<div class="sk'+(i===skI?' sel':'')+(own?' own':'')+(eq?' eq':'')+'" data-i="'+i+'">'+
       '<span class="skp" style="background:'+(u[4]?'url('+u[4]+') 50%/cover':(SKCSS[u[0]]||'#fff'))+'"></span>'+
       '<span class="skn">'+u[1]+'</span>'+
       '<span class="skc">'+(eq?'WORN':own?'Wear it':u[2]+' ◆')+'</span></div>'}
  skRow.innerHTML=h;shardEl.textContent=fmt(shards);
}
function skOpen(){shopOpen();shopSec(1)}
function skMove(d){skI=(skI+d+SKINS.length)%SKINS.length;skDraw();sfx.nav()}
function skTake(){
  const u=SKINS[skI];
  if(SKOWN[u[0]]){EQUIP=u[0];skinSave();skDraw();sfx.up();return}
  if(shards<u[2]){sfx.no();return}
  shards-=u[2];ach('spend',u[2]);SKOWN[u[0]]=1;EQUIP=u[0];skinSave();shopSave();skDraw();sfx.up();
  AS.skins=(()=>{let k=0;for(const q in SKOWN)if(SKOWN[q])k++;return k})();achCheck();
  const el=skRow.children[skI];
  if(el)el.animate([{transform:'scale(1.08)',filter:'brightness(2)'},{transform:'none',filter:'none'}],
    {duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});
}
skRow.addEventListener('click',e=>{const r=e.target.closest&&e.target.closest('.sk');
  if(!r)return;skI=+r.dataset.i;skDraw();skTake()});
let aT=.25,aIdle=0,aCorn=0,bst=0,bstT=0;    // the sweep's own clocks

/* ==================== 17-awards.js */
/* ================= AWARDS =================
   Every award is the same shape: a counter and a number to reach. Flags are counters that
   only ever go to one, so a single loop checks all of them and every one gets a progress bar
   for free. Run counters (r*) are wiped at the start of a run; the rest are for life.

   [id, category, name, what it takes, shards, counter, target, secret?] */
const ACAT=['Score','Endurance','Destruction','Precision','Movement','Bosses','Discipline','Fortune','Hard','Daily','Banking','Secrets'];
const ACH=[
/* ---- Score ---- */
['sc1',0,'First blood','Score 500 in one run',5,'rScore',500],
['sc2',0,'Warming up','Score 1,500 in one run',10,'rScore',1500],
['sc3',0,'Three thousand','Score 3,000 in one run',10,'rScore',3000],
['sc4',0,'Five thousand','Score 5,000 in one run',20,'rScore',5000],
['sc5',0,'Eight thousand','Score 8,000 in one run',25,'rScore',8000],
['sc6',0,'Five figures','Score 10,000 in one run',35,'rScore',10000],
['sc7',0,'Fifteen','Score 15,000 in one run',65,'rScore',15000],
['sc8',0,'Twenty','Score 20,000 in one run',95,'rScore',20000],
['sc9',0,'Thirty','Score 30,000 in one run',150,'rScore',30000],
['sc10',0,'Fifty','Score 50,000 in one run',340,'rScore',50000],
['sc11',0,'Lifetime hundred','Score 100,000 across every run',60,'score',100000],
['sc12',0,'Lifetime million','Score 1,000,000 across every run',560,'score',1000000],
/* ---- Endurance ---- */
['en1',1,'Thirty seconds','Last 30 seconds',5,'rTime',30],
['en2',1,'One minute','Last a minute',10,'rTime',60],
['en3',1,'Two minutes','Last two minutes',10,'rTime',120],
['en4',1,'Three minutes','Last three minutes',20,'rTime',180],
['en5',1,'Four minutes','Last four minutes',30,'rTime',240],
['en6',1,'Five sharp','Reach five minutes — he is waiting',55,'rTime',300],
['en7',1,'Seven minutes','Last seven minutes',90,'rTime',420],
['en8',1,'Ten minutes','Last ten minutes',160,'rTime',600],
['en9',1,'A quarter hour','Last fifteen minutes',370,'rTime',900],
['en10',1,'An hour in the arena','One hour across every run',30,'time',3600],
['en11',1,'A working day','Eight hours across every run',170,'time',28800],
['en12',1,'Regular','Finish 100 runs',75,'runs',100],
/* ---- Destruction ---- */
['de1',2,'Ten down','Kill 10 cubes in a run',5,'rKills',10],
['de2',2,'Fifty down','Kill 50 cubes in a run',10,'rKills',50],
['de3',2,'Century','Kill 100 cubes in a run',15,'rKills',100],
['de4',2,'Two hundred','Kill 200 cubes in a run',30,'rKills',200],
['de5',2,'Four hundred','Kill 400 cubes in a run',60,'rKills',400],
['de6',2,'Eight hundred','Kill 800 cubes in a run',120,'rKills',800],
['de7',2,'Fifteen hundred','Kill 1,500 cubes in a run',300,'rKills',1500],
['de8',2,'A thousand, eventually','Kill 1,000 cubes across every run',15,'kills',1000],
['de9',2,'Five thousand gone','Kill 5,000 cubes across every run',55,'kills',5000],
['de10',2,'Twenty thousand gone','Kill 20,000 cubes across every run',150,'kills',20000],
['de11',2,'Hundred thousand gone','Kill 100,000 cubes across every run',745,'kills',100000],
['de12',2,'Trigger finger','Fire 1,000 shots across every run',10,'shots',1000],
['de13',2,'Barrel hot','Fire 20,000 shots across every run',80,'shots',20000],
['de14',2,'Nothing left standing','Clear 25 cubes inside three seconds',35,'fBurst',1],
/* ---- Precision ---- */
['pr1',3,'Close','10 near misses in a run',5,'rNm',10],
['pr2',3,'Closer','40 near misses in a run',10,'rNm',40],
['pr3',3,'Reckless','100 near misses in a run',20,'rNm',100],
['pr4',3,'Suicidal','250 near misses in a run',55,'rNm',250],
['pr5',3,'Why','500 near misses in a run',130,'rNm',500],
['pr6',3,'A thousand brushes','1,000 near misses across every run',25,'nm',1000],
['pr7',3,'Ten thousand brushes','10,000 near misses across every run',140,'nm',10000],
['pr8',3,'Chain of five','Reach a ×5 chain',10,'rChain',5],
['pr9',3,'Chain of ten','Reach a ×10 chain',15,'rChain',10],
['pr10',3,'Chain of twenty','Reach a ×20 chain',35,'rChain',20],
['pr11',3,'Chain of thirty','Reach a ×30 chain',90,'rChain',30],
['pr12',3,'Chain of fifty','Reach a ×50 chain',260,'rChain',50],
['pr13',3,'Topped off','Hold 100 TP at once',10,'fFullTp',1],
['pr14',3,'Never empty','Hold 100 TP in ten separate runs',60,'fFullTp',10],
/* ---- Movement ---- */
['mv1',4,'Dash','Use the dash for the first time',5,'dash',1],
['mv2',4,'Blink','Dash 100 times',10,'dash',100],
['mv3',4,'Teleport','Dash 1,000 times',60,'dash',1000],
['mv4',4,'Afterimage','Dash 25 times in one run',25,'rDash',25],
['mv5',4,'Groundless','Dash 60 times in one run',70,'rDash',60],
['mv6',4,'Hop','Jump 200 times',10,'jump',200],
['mv7',4,'Airborne','Jump 2,000 times',65,'jump',2000],
['mv8',4,'Out of the way','Dash through a cube on the frame it would have hit you',55,'fClutch',1],
/* ---- Bosses ---- */
['bo1',5,'Met the Knight','Face the Roaring Knight',10,'fKnightMet',1],
['bo2',5,'Chipped him','Take the Knight to half health',25,'fKnightHalf',1],
['bo3',5,'Killed the Knight','Put the Roaring Knight down',250,'bKnight',1],
['bo4',5,'Killed him twice','Put the Knight down twice',125,'bKnight',2],
['bo5',5,'Killed him five times','Put the Knight down five times',370,'bKnight',5],
['bo6',5,'Killed him ten times','Put the Knight down ten times',680,'bKnight',10],
['bo7',5,'Untouched by the Knight','Kill him without losing a shield in the fight',280,'fKnightClean',1],
['bo8',5,'Crossed the Bridge','Cross the Gravity Bridge',60,'bridges',1],
['bo9',5,'Crossed it five times','Cross the Gravity Bridge five times',100,'bridges',5],
['bo10',5,'Crossed it twenty times','Cross the Gravity Bridge twenty times',310,'bridges',20],
['bo11',5,'The floor held','Survive the floor collapse',10,'floors',1],
['bo12',5,'The floor held ten times','Survive the floor collapse ten times',35,'floors',10],
['bo13',5,'The floor held fifty times','Survive the floor collapse fifty times',130,'floors',50],
['bo14',5,'Clean sweep','Clear three bosses in one run',40,'rBoss',3],
['bo15',5,'Cleaner sweep','Clear five bosses in one run',120,'rBoss',5],
['bo16',5,'Twenty-five bosses','Kill twenty-five bosses of any kind',370,'bAny',25],
['bo17',5,'Fifty bosses','Kill fifty bosses of any kind',495,'bAny',50],
['bo18',5,'Met Matthew','Reach five minutes and find out',35,'fMattMet',1],
['bo19',5,'Hurt him','Take Matthew to half health',80,'fMattHalf',1],
['bo20',5,'Killed Matthew','Put Matthew down',560,'bMatthew',1],
['bo21',5,'He came back','Face Matthew a second time',150,'fMattAgain',1],
['bo22',5,'Killed him twice','Put Matthew down twice',435,'bMatthew',2],
['bo23',5,'Killed him five times','Put Matthew down five times',930,'bMatthew',5],
['bo24',5,'Matthew untouched','Kill Matthew without losing a shield in the fight',870,'fMattClean',1],
['bo25',5,'Full house','Kill the Knight, cross the Bridge and kill Matthew in one run',990,'fAllThree',1],
['bo26',5,'Ten bosses down','Kill ten bosses of any kind',310,'bAny',10],
/* ---- Discipline ---- */
['di1',6,'Untouchable','Last two minutes without losing a shield',60,'fNoHit2',1],
['di2',6,'Still untouchable','Last four minutes without losing a shield',175,'fNoHit4',1],
['di3',6,'Glass','Last six minutes without losing a shield',560,'fNoHit6',1],
['di4',6,'Pacifist','Last two minutes without firing a shot',75,'fNoShot2',1],
['di5',6,'Deep pacifist','Last four minutes without firing a shot',300,'fNoShot4',1],
['di6',6,'Grounded','Last three minutes without dashing',65,'fNoDash3',1],
['di7',6,'Feet on the floor','Last five minutes without dashing',190,'fNoDash5',1],
['di8',6,'No help','Last three minutes without taking an upgrade card',100,'fNoUp3',1],
['di9',6,'Naked','Reach the Knight with no shop upgrades at all',90,'fNoShop',1],
['di10',6,'Last shield','Survive a full minute on your final shield',80,'fOneShield',1],
['di11',6,'Down to nothing','Finish a run with no shields left and over 10,000 points',110,'fBrokeRich',1],
['di12',6,'Ten clean runs','Finish ten runs without ever losing a shield in the first minute',70,'fClean1',10],
['di13',6,'No cards taken','Finish a five-minute run without a single upgrade card',435,'fNoUp5',1],
['di14',6,'The hard way','Beat a boss with one shield remaining',130,'fLastStand',1],
['di15',6,'An hour without a scratch','One run, sixty minutes of play, never once hit',2000,'rClean',3600],
/* ---- Fortune ---- */
['fo1',7,'First shards','Earn 100 shards in total',5,'earn',100],
['fo2',7,'Pocket money','Earn 1,000 shards in total',10,'earn',1000],
['fo3',7,'Comfortable','Earn 10,000 shards in total',60,'earn',10000],
['fo4',7,'Rich','Earn 50,000 shards in total',260,'earn',50000],
['fo5',7,'Obscene','Earn 200,000 shards in total',745,'earn',200000],
['fo6',7,'First purchase','Buy anything',5,'spend',1],
['fo7',7,'Spender','Spend 5,000 shards',35,'spend',5000],
['fo8',7,'Nothing saved','Spend 25,000 shards',150,'spend',25000],
['fo9',7,'Dressed','Own five skins',25,'skins',5],
['fo10',7,'Wardrobe','Own ten skins',90,'skins',10],
['fo11',7,'Every look','Own all fourteen skins',495,'skins',14],
['fo12',7,'Upgraded','Reach 10 total shop levels',30,'shopLv',10],
['fo13',7,'Maxed','Max out every shop upgrade',370,'shopLv',23],
['fo14',7,'Big pickup','Collect 12 upgrade cards in one run',55,'rUps',12],
['fo15',7,'Born again','Rebirth once',300,'rebirths',1],
['fo16',7,'Third life','Rebirth three times',800,'rebirths',3],
['fo17',7,'No last one','Rebirth seven times',2500,'rebirths',7],
/* ---- Hard ---- */
['ha1',8,'Hell, briefly','Last 60 seconds in hard mode',15,'fHard1',1],
['ha2',8,'Hell, properly','Last three minutes in hard mode',75,'fHard3',1],
['ha3',8,'Hell, fluently','Last five minutes in hard mode',250,'fHard5',1],
['ha4',8,'Hell, at home','Last eight minutes in hard mode',560,'fHard8',1],
['ha5',8,'Hard score','Score 10,000 in hard mode',125,'hardBest',10000],
['ha6',8,'Hard score, doubled','Score 25,000 in hard mode',435,'hardBest',25000],
['ha7',8,'Hard Knight','Kill the Roaring Knight in hard mode',495,'fHardKnight',1],
['ha8',8,'Hard Matthew','Kill Matthew in hard mode',1115,'fHardMatt',1],
['ha9',8,'Hard crossing','Cross the Gravity Bridge in hard mode',745,'fHardBridge',1],
['ha10',8,'Twenty-five hard runs','Finish 25 runs in hard mode',150,'hardRuns',25],
/* ---- Daily ---- */
['da1',9,'First daily','Play one daily cube',10,'dayRuns',1],
['da2',9,'A week of dailies','Play seven dailies',35,'dayRuns',7],
['da3',9,'A month of dailies','Play thirty dailies',150,'dayRuns',30],
['da4',9,'A hundred dailies','Play a hundred dailies',620,'dayRuns',100],
['da5',9,'Three in a row','A three-day daily streak',30,'dayStreak',3],
['da6',9,'A week straight','A seven-day daily streak',100,'dayStreak',7],
['da7',9,'A month straight','A thirty-day daily streak',495,'dayStreak',30],
['da8',9,'Good day','Score 10,000 on a daily cube',130,'dayBest',10000],
/* ---- Banking ---- */
['ba1',10,'Banked','Bank a run for the first time',10,'banks',1],
['ba2',10,'Cautious','Bank ten runs',60,'banks',10],
['ba3',10,'Always banks','Bank fifty runs',190,'banks',50],
['ba4',10,'Banked a thousand','Bank 1,000 shards in total',25,'banked',1000],
['ba5',10,'Banked ten thousand','Bank 10,000 shards in total',130,'banked',10000],
['ba6',10,'Banked fifty thousand','Bank 50,000 shards in total',560,'banked',50000],
['ba7',10,'Double or nothing','Bank at a ×2 multiplier or better',75,'fBank2',1],
['ba8',10,'Let it ride','Bank at a ×3 multiplier',370,'fBank3',1],
/* ---- Secrets ---- */
['se1',11,'Stood still','Survive a whole minute without touching a key',100,'fIdle',1,1],
['se2',11,'Corner office','Spend thirty seconds in one corner and live',90,'fCorner',1,1],
['se3',11,'Gold standard','Wear Solid Gold into a hard-mode run',250,'fGoldHard',1,1],
['se4',11,'Hollow victory','Beat a boss wearing Hollow',150,'fHollowWin',1,1],
['se5',11,'Everything on','Hard mode, daily cube, one run',310,'fHardDaily',1,1],
['se6',11,'Shot the messenger','Destroy 50 of Matthew’s projectiles',175,'fMattShots',50,1],
['se7',11,'Patience','Reach ten minutes without ever banking',435,'fPatience',1,1],
['se8',11,'Completionist','Unlock every other award',1240,'achs',151,1]
];
const ADEF={};for(let i=0;i<ACH.length;i++)ADEF[ACH[i][5]]=0;
const AS=Object.assign({},ADEF);
const AGOT={};let aQ=[],aQT=0;

function achLoad(){
  try{Object.assign(AS,JSON.parse(store.get('cube-stats','')||'{}'))}catch(e){}
  try{const g=JSON.parse(store.get('cube-ach','')||'[]');for(let i=0;i<g.length;i++)AGOT[g[i]]=1}catch(e){}
  for(const k in ADEF)if(typeof AS[k]!=='number')AS[k]=0;
  AS.achs=achCount();
  achCheck(1);                      // a save from before an award existed still earns it, quietly
  AS.achs=achCount();
}
function achSave(){
  store.set('cube-stats',JSON.stringify(AS));
  const g=[];for(const k in AGOT)if(AGOT[k])g.push(k);store.set('cube-ach',JSON.stringify(g));
}
const achCount=()=>{let n=0;for(const k in AGOT)if(AGOT[k])n++;return n};
const achTotal=()=>{let n=0;for(let i=0;i<ACH.length;i++)n+=ACH[i][4];return n};
/* every counter the awards read, bumped through here so nothing is ever missed */
function ach(k,v){AS[k]=(AS[k]||0)+(v===undefined?1:v)}
function achMax(k,v){if(v>(AS[k]||0))AS[k]=v}
function achReset(){for(const k in AS)if(k.charAt(0)==='r'&&k.charAt(1)>='A'&&k.charAt(1)<='Z')AS[k]=0}

function achCheck(quiet){
  let got=null;
  for(let i=0;i<ACH.length;i++){const a=ACH[i];
    if(AGOT[a[0]])continue;
    if((AS[a[5]]||0)<a[6])continue;
    AGOT[a[0]]=1;AS.achs=achCount();
    shards+=a[4];ach('earn',a[4]);
    if(!quiet)aQ.push(a);got=a;
  }
  if(got){shopSave();achSave();hsUpdate()}
}
/* They come in from the bottom right, stack up to four deep, and take themselves away
   again. Unlocking six at once becomes a short queue instead of a flicker, and none of it
   sits over the middle of the arena while you are trying to read it. */
const ATRAY=$('atray');
function achPop(a){
  if(!ATRAY)return;
  const d=document.createElement('div');d.className='apop';
  d.innerHTML='<i class="ai">★</i><b>'+a[2]+'</b><span>'+a[3]+'</span><em>+'+a[4]+' ◆</em>';
  ATRAY.appendChild(d);
  while(ATRAY.children.length>4)ATRAY.removeChild(ATRAY.firstChild);
  setTimeout(()=>{if(d.parentNode)d.parentNode.removeChild(d)},5600);
}
function achStep(dt){
  if(!aQ.length)return;
  aQT-=dt;if(aQT>0)return;
  const a=aQ.shift();aQT=.9;
  achPop(a);sfx.up();
}

/* --- the screen --- */
let acI=0,acF=0;                                   // acF: 0 all, 1 locked, 2 unlocked
function acDraw(){
  const list=acList();
  if(acI>=list.length)acI=Math.max(0,list.length-1);
  let h='',cat=-1;
  for(let i=0;i<list.length;i++){const a=list[i],own=!!AGOT[a[0]],sec=a[7]&&!own;
    if(a[1]!==cat){cat=a[1];h+='<h4 class="acg">'+ACAT[cat]+'</h4>'}
    const cur=Math.min(AS[a[5]]||0,a[6]),pc=Math.round(cur/a[6]*100);
    h+='<div class="ac'+(own?' own':'')+(i===acI?' sel':'')+'" data-i="'+i+'">'+
       '<b>'+(sec?'? ? ?':a[2])+'</b>'+
       '<span>'+(sec?'Hidden — you will know it when you do it':a[3])+'</span>'+
       (own||a[6]<2?'':'<i class="acb"><u style="width:'+pc+'%"></u></i>')+
       '<em>'+(own?'✓ '+a[4]+' ◆':(a[6]>1?fmt(cur)+' / '+fmt(a[6]):a[4]+' ◆'))+'</em></div>'}
  $('acrow').innerHTML=h||'<p class="chint">Nothing here yet</p>';
  const n=achCount();
  $('acn').textContent=n+' / '+ACH.length;
  $('acp').style.width=Math.round(n/ACH.length*100)+'%';
  $('acf').textContent=['Everything','Still locked','Unlocked'][acF];
  const s=$('acrow').querySelector('.sel');if(s&&s.scrollIntoView)s.scrollIntoView({block:'nearest'});
}
function acList(){
  return ACH.filter(a=>acF===0||(acF===1?!AGOT[a[0]]:!!AGOT[a[0]]));
}
function acOpen(){acI=0;acF=0;acDraw();show('awards');sfx.ui()}
function acMove(d){const n=acList().length;if(!n)return;acI=(acI+d+n)%n;acDraw();sfx.nav()}
function acFilt(){acF=(acF+1)%3;acI=0;acDraw();sfx.ui()}
$('acrow').addEventListener('click',e=>{const r=e.target.closest&&e.target.closest('.ac');
  if(!r)return;acI=+r.dataset.i;acDraw();sfx.nav()});
$('acf').addEventListener('click',()=>{acFilt()});

/* --- the shop has two sections: what you buy, and what you wear --- */
let shopTab=0;
function shopSec(t){
  shopTab=t;
  $('shoprow').classList.toggle('hid',t!==0);
  $('skinrow').classList.toggle('hid',t!==1);
  const tb=$('shoptabs').children;
  for(let i=0;i<tb.length;i++)tb[i].classList.toggle('on',i===t);
  $('shophint').innerHTML=t===0
    ?'<kbd>W</kbd><kbd>S</kbd> choose &nbsp;\u00b7&nbsp; <kbd>Space</kbd> buy &nbsp;\u00b7&nbsp; <kbd>Q</kbd><kbd>E</kbd> section &nbsp;\u00b7&nbsp; <kbd>Esc</kbd> back'
    :'<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> choose &nbsp;\u00b7&nbsp; <kbd>Space</kbd> buy or wear &nbsp;\u00b7&nbsp; <kbd>Q</kbd><kbd>E</kbd> section &nbsp;\u00b7&nbsp; <kbd>Esc</kbd> back';
  if(t===0)shopDraw();else skDraw();
}
$('shoptabs').addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.stab');
  if(!b)return;shopSec(+b.dataset.t);sfx.ui()});

/* ==================== 18-bank.js */
/* ================= THE POT =================
   Shards are no longer handed over at the end regardless. They accumulate during the run as
   a pot, and every boss you put down raises the multiplier on it. Clear a boss and the run
   stops to ask: take the pot at the current multiplier and walk, or keep it riding and find
   out. Dying still pays the pot -- at x1. So pushing on never risks what you already had,
   only what stopping now would have been worth. */
const BMUL=[1,1.5,2,3,4,5];
const potBase=()=>Math.max(1,Math.round(rbPay()*(G.score/140+G.kills/8)));
const potMul=()=>BMUL[Math.min(BMUL.length-1,G.cleared||0)];
const potNow=()=>Math.round(potBase()*potMul());
let bankRet=null;                                  // what to run if they keep going

function bankOffer(what,after){
  G.cleared=(G.cleared||0)+1;ach('bAny');ach('rBoss');
  if(G.state!=='play'){if(after)after();return}
  bankRet=after||null;
  G.state='bank';
  const base=potBase(),m=potMul(),now=Math.round(base*m),nx=BMUL[Math.min(BMUL.length-1,G.cleared+1)];
  $('bkw').textContent=what+' down';
  $('bkv').textContent=fmt(now);
  $('bkb').textContent=fmt(base)+' ◆ pot  ×'+m.toFixed(m%1?1:0);
  $('bknx').textContent='Keep going and the next one makes it ×'+nx.toFixed(nx%1?1:0)+
    '. Die and you still take the '+fmt(base)+', just without the multiplier.';
  for(const k in keys)keys[k]=0;
  bnEl.classList.remove('go');document.body.classList.add('banking');   // nothing of the run showing through
  show('bank');sfx.up();
}
function bankTake(){
  const got=potNow();
  shards+=got;ach('earn',got);ach('banks');ach('banked',got);
  if(potMul()>=2)ach('fBank2');if(potMul()>=3)ach('fBank3');
  AS.rBanked=1;shopSave();achSave();achCheck();
  document.body.classList.remove('banking');
  G.banked=got;G.state='play';show(null);
  die(true);                                        // ends the run cleanly, without the death
}
function bankPass(){
  document.body.classList.remove('banking');
  G.state='play';show(null);const f=bankRet;bankRet=null;if(f)f();
}

/* ==================== 19-daily.js */
/* ================= THE DAILY CUBE =================
   One arena a day, the same for every run of that day, because the order the attacks come in
   is drawn from the date instead of from nothing. Cube positions inside an attack still vary
   -- it is the shape of the run that is fixed, not every pixel. One scored attempt a day;
   after that you can replay it as much as you like for nothing. */
let DRS=null;                                        // the seeded stream, null outside a daily
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const sr=()=>DRS?DRS():Math.random();                 // every run-shaping roll goes through here
const srnd=(a,b)=>a+sr()*(b-a);
function dayKey(d){d=d||new Date();
  return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function daySeed(k){let h=2166136261>>>0;for(let i=0;i<k.length;i++){h^=k.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
const DAY={day:'',score:0,done:0,streak:0,last:''};
function dayLoad(){
  try{Object.assign(DAY,JSON.parse(store.get('cube-daily','')||'{}'))}catch(e){}
  if(DAY.day!==dayKey()){DAY.day=dayKey();DAY.score=0;DAY.done=0}
  AS.dayStreak=DAY.streak||0;
}
function daySave(){store.set('cube-daily',JSON.stringify(DAY))}
function dayStart(){                                 // called from start() when G.daily is on
  DRS=mulberry(daySeed(DAY.day));
}
function dayFinish(){
  if(!G.daily)return;
  const scored=!DAY.done;
  if(scored){
    DAY.done=1;DAY.score=G.score;
    const y=new Date(Date.now()-864e5);
    DAY.streak=(DAY.last===dayKey(y))?(DAY.streak||0)+1:1;
    DAY.last=DAY.day;
    ach('dayRuns');achMax('dayBest',G.score);AS.dayStreak=DAY.streak;
    if(SET.hard)ach('fHardDaily');
    daySave();
  }else if(G.score>DAY.score){DAY.score=G.score;achMax('dayBest',G.score);daySave()}
  DRS=null;
}
function dayInfo(){
  const e=$('dayl');if(!e)return;
  e.textContent=DAY.done?('Today: '+fmt(DAY.score)+(DAY.streak>1?'  ·  '+DAY.streak+'-day streak':''))
                        :'Not played today';
}
function dayPlay(){
  G.daily=1;start();
  toast('Daily cube  ·  '+DAY.day,DAY.done?'Replay, for nothing':'One scored attempt');
}

/* ==================== 20-feedback.js */
/* ================= TP FEEDBACK + MENU DEMO ================= */
const thrB=$('thr').children,tmEl=$('tm');let thrLv=0,tmSec=-1,lastTk=0,lastRd=0,dax=0,day=0,dait=0;
function tpTick(ti){   // each TP point gained: outline flash, spark, rising tick
  P.tk=1;const a=rnd(0,TAU);emit(P.x+Math.cos(a)*22,P.y+Math.sin(a)*22,Math.cos(a)*100,Math.sin(a)*100,.35,2,0,5);
  if(G.state==='play'&&clock-lastTk>.055){lastTk=clock;sfx.tick(ti);cells[Math.min(24,ti>>2)].animate([{filter:'brightness(3)'},{filter:'none'}],{duration:170})}
}
function tpReady(){if(G.state!=='play'||clock-lastRd<.6)return;lastRd=clock;P.tk=1;sfx.ready();tpEl.animate([{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:320,easing:'cubic-bezier(.2,.8,.2,1)'})}
Object.assign(sfx,{tick(t){tone(480+t*9,.035,'sine',.022)},ready(){tone(880,.12,'sine',.06,1320)},nav(){tone(700,.035,'sine',.05,820)},tink(){tone(1500,.04,'square',.016,900)}});
// attract mode: the menu runs a real, AI-piloted game behind the blur
function demoReset(){clearHaz();shrinkClear();for(let i=0;i<WN;i++)wrn[i].on=0;for(let i=0;i<ON;i++)obs[i].on=0;for(let i=0;i<BN;i++)bul[i].on=0;P.x=AW/2;P.y=AH/2;P.vx=P.vy=0;P.inv=1;G.t=12;G.next=.6;G.tp=30;dait=0}
function demoAI(dt){   // pick the safest of 9 moves by predicting cube positions ~0.5s ahead
  dait-=dt;if(dait>0)return;dait=.1;let bc=1e9;
  for(let c=0;c<9;c++){
    const mx=c<8?Math.cos(c*Math.PI/4):0,my=c<8?Math.sin(c*Math.PI/4):0;let cost=c<8?0:2;
    for(let k=1;k<=3;k++){
      const t=k*.17,x=clamp(P.x+mx*MAXV*t*.85,30,AW-30),y=clamp(P.y+my*MAXV*t*.85,30,AH-30);
      for(let j=0;j<ON;j++){const o=obs[j];if(!o.on||o.a<=0)continue;const d=Math.hypot(x-o.x-o.vx*t,y-o.y-o.vy*t),q=o.s*.5+42;if(d<q)cost+=(1-d/q)*(1-d/q)*12}
    }
    cost+=(Math.abs(P.x-AW/2)/AW+Math.abs(P.y-AH/2)/AH)*3;
    if(cost<bc){bc=cost;dax=mx;day=my}
  }
}

/* ==================== 21-lasers.js */
/* ================= LASERS + BLASTS (non-cube attacks) ================= */
// Beams: dashed warning line (tracks you, then locks + flickers) -> layered additive beam -> fade.
// Zones: converging blast circles, and expanding shockwave rings with a gap. Grazing a beam also charges TP.
const BM=8,ZN=14;
const bm=Array.from({length:BM},()=>({on:0,x:0,y:0,a:0,t:0,tw:1,tf:.32,W:24,trk:0,fired:0}));
const zn=Array.from({length:ZN},()=>({on:0,k:0,x:0,y:0,r:60,v:0,th:16,ga:0,gh:.5,t:0,tw:1,fired:0}));
function clearHaz(){for(let i=0;i<HN;i++)hl[i].on=0;for(let i=0;i<BM;i++)bm[i].on=0;for(let i=0;i<ZN;i++)zn[i].on=0}
function beam(x,y,a,tw,W,trk){for(let i=0;i<BM;i++){const b=bm[i];if(b.on)continue;b.on=1;b.x=x;b.y=y;b.a=a;b.t=0;b.tw=tw;b.W=W;b.trk=trk||0;b.fired=0;return}}
function zone(k,x,y,tw,r,v){for(let i=0;i<ZN;i++){const z=zn[i];if(z.on)continue;z.on=1;z.k=k;z.x=x;z.y=y;z.tw=tw;z.r=r;z.v=v;z.t=0;z.fired=0;z.ga=rnd(0,TAU);z.gh=lerp(.55,.4,G.diff);z.th=16;return}}
function hurt(){if(P.inv>0||G.state!=='play')return;if(U.shield>0){shieldBreak();return}die()}
function stepHaz(dt){
  const live=G.state==='play'&&P.alive&&P.drop<=0;
  for(let i=0;i<BM;i++){const b=bm[i];if(!b.on)continue;
    b.t+=dt;if(b.t<b.trk){b.x=P.x;b.y=P.y}                      // tracking phase: the line follows you, then locks
    const f=b.t-b.tw;
    if(f>=0&&!b.fired){b.fired=1;shake(.16);G.fl=Math.max(G.fl,.05);G.fc=0;sfx.laser()}
    if(f>=.04&&f<b.tf&&live){const d=Math.abs((P.x-b.x)*Math.sin(b.a)-(P.y-b.y)*Math.cos(b.a)),h=b.W*.42+6;if(d<h)hurt();else if(d<h+42)gz+=1-(d-h)/42}
    if(f>=0&&f<b.tf&&Math.random()<.8){const q=rnd(-800,800),x=b.x+Math.cos(b.a)*q,y=b.y+Math.sin(b.a)*q;if(x>0&&x<AW&&y>0&&y<AH)emit(x,y,rnd(-70,70),rnd(-70,70)-30,.35,rnd(2,3.5),Math.random()<.5?1:0,3)}
    if(f>b.tf+.35)b.on=0;
  }
  for(let i=0;i<ZN;i++){const z=zn[i];if(!z.on)continue;
    z.t+=dt;const f=z.t-z.tw;
    if(f>=0&&!z.fired){z.fired=1;
      if(z.k===0){shake(.22);G.fl=Math.max(G.fl,.08);G.fc=0;burst(z.x,z.y,18,380,.5,3,1,3);burst(z.x,z.y,10,240,.4,2.5,0,3);sfx.boom()}
      else{shake(.32);G.fl=Math.max(G.fl,.1);G.fc=0;burst(z.x,z.y,22,430,.7,3.6,1,2.4);   // a column of lava goes up
        for(let q=0;q<18;q++){const a=rnd(0,TAU);emit(z.x+rnd(-20,20),z.y+rnd(-20,20),Math.cos(a)*rnd(40,185),-rnd(230,520),rnd(.7,1.3),rnd(2.6,4.6),1,1.3)}
        sfx.erupt()}}
    if(z.k===0){if(f>=0&&f<.12&&live&&Math.hypot(P.x-z.x,P.y-z.y)<z.r*.88+4)hurt();if(f>.4)z.on=0}
    else{if(f>=0&&f<.2&&live&&Math.hypot(P.x-z.x,P.y-z.y)<z.r*.9+6)hurt();if(f>.6)z.on=0}   // the column catches you mid-jump too
  }
}
function drawBeam(b){
  const c=Math.cos(b.a),s=Math.sin(b.a),x0=b.x-c*1500,y0=b.y-s*1500,x1=b.x+c*1500,y1=b.y+s*1500,f=b.t-b.tw;
  const ln=(w,a,col)=>{ctx.strokeStyle=col;A(a);ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke()};
  ctx.globalCompositeOperation='lighter';
  if(f<0){   // warning: dashed line that sharpens, then flickers once locked
    const k=b.t/b.tw,lk=b.t>Math.max(b.trk,b.tw-.4),fl=lk?(Math.sin(b.t*42)>0?1:.3):1;
    ctx.setLineDash([12,14]);ctx.lineDashOffset=-clock*70;ln(1.3+k*1.6,(.15+.45*k)*fl,'#ff2a2a');ctx.setLineDash([]);
    if(lk)ln(b.W,(.05+.12*k)*fl,'#ff2a2a');                     // width preview
  }else{     // fire: red halo + red body + white-hot core
    const wf=f<.05?f/.05:f<b.tf?1:Math.max(0,1-(f-b.tf)/.3);
    if(wf>0){ln(b.W*wf*4.2,.2*wf,'#ff1e26');ln(b.W*wf*1.7,.6*wf,'#ff2a2a');ln(b.W*wf*.55,wf,'#fff')}
  }
}
function drawZone(z){
  const f=z.t-z.tw;ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ff2a2a';ctx.fillStyle='#ff2a2a';
  if(z.k===0){
    if(f<0){const k=z.t/z.tw;A(.25+.4*k);ctx.lineWidth=1.6;ctx.setLineDash([8,10]);ctx.lineDashOffset=clock*40;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.stroke();ctx.setLineDash([]);
      A(.04+.2*k*k);ctx.beginPath();ctx.arc(z.x,z.y,z.r*k,0,TAU);ctx.fill()}            // fill converges on the edge
    else if(f<.35){const u=f/.35;ctx.fillStyle='#fff';A((1-u)*(1-u)*.9);ctx.beginPath();ctx.arc(z.x,z.y,z.r*(1+u*.15),0,TAU);ctx.fill();
      ctx.strokeStyle='#ff3038';A(1-u);ctx.lineWidth=3+(1-u)*6;ctx.beginPath();ctx.arc(z.x,z.y,z.r*(1+u*.5),0,TAU);ctx.stroke()}
  }else{   // lava eruption: a molten ring that fills, then a burst of fire
    if(f<0){const k=z.t/z.tw,lk=k>.72,fl=lk?(Math.sin(z.t*44)>0?1:.4):1;
      ctx.globalCompositeOperation='source-over';A(.45+.35*k);ctx.strokeStyle='#190603';ctx.lineWidth=8+k*3;
      ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.stroke();                       // dark backing, or the ring vanishes into the lava
      ctx.globalCompositeOperation='lighter';ctx.strokeStyle=lk?'#fff1c8':'#ffb23a';ctx.fillStyle='#ff8a1e';
      A((.45+.5*k)*fl);ctx.lineWidth=2.4+k*3;ctx.setLineDash([7,9]);ctx.lineDashOffset=-clock*52;
      ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.stroke();ctx.setLineDash([]);
      A((.06+.3*k*k)*fl);ctx.beginPath();ctx.arc(z.x,z.y,z.r*k,0,TAU);ctx.fill()}
    else if(f<.6){const u=f/.6;
      ctx.fillStyle='#ffd27a';A((1-u)*(1-u));ctx.beginPath();ctx.arc(z.x,z.y,z.r*(1+u*.2),0,TAU);ctx.fill();
      ctx.strokeStyle='#ff7a16';A(1-u);ctx.lineWidth=4+(1-u)*9;ctx.beginPath();ctx.arc(z.x,z.y,z.r*(1+u*.66),0,TAU);ctx.stroke()}
  }
}
Object.assign(pat,{
  // snipe: lock-on laser(s) through your position; move before it fires
  snipe(){const n=G.diff>.55?2:1,a0=rnd(0,Math.PI);for(let i=0;i<n;i++)beam(P.x,P.y,a0+i*rnd(.8,2.3),lerp(1.3,1,G.diff),24,.75);G.next+=.9;sfx.warn()},
  // cross: horizontal + vertical laser through your position (diagonals too, late game)
  cross(){beam(P.x,P.y,0,1.35,26,.8);beam(P.x,P.y,Math.PI/2,1.35,26,.8);if(G.diff>.75){beam(P.x,P.y,Math.PI/4,1.35,22,.8);beam(P.x,P.y,-Math.PI/4,1.35,22,.8)}G.next+=1.1;sfx.warn()},
  // comb: parallel lasers that fire one after another; hide in the gaps
  comb(){const h=Math.random()<.5,a=(h?0:Math.PI/2)+rnd(-.3,.3),nx=-Math.sin(a),ny=Math.cos(a),N=h?5:6,off=rnd(-28,28),dr=Math.random()<.5;for(let i=0;i<N;i++){const d=(i-(N-1)/2)*132+off;beam(AW/2+nx*d,AH/2+ny*d,a,1.1+(dr?i:N-1-i)*.17,26,0)}G.next+=1.3;sfx.warn()},
  // strike: converging blast circles, one aimed at you
  strike(){const n=G.diff>.5?3:2;for(let i=0;i<n;i++){const x=i?rnd(90,AW-90):clamp(P.x+rnd(-40,40),70,AW-70),y=i?rnd(90,AH-90):clamp(P.y+rnd(-40,40),70,AH-70);zone(0,x,y,1+i*.28,64,0)}G.next+=.6;sfx.warn()},
});
PAT.push(['snipe',.14,2],['strike',.2,2],['comb',.36,2],['cross',.46,2]);   // [name, unlock difficulty, weight]
Object.assign(sfx,{warn(){tone(900,.06,'square',.018)},laser(){noise(.25,.22,3200);tone(1500,.3,'sawtooth',.05,90)},boom(){noise(.35,.3,700);tone(120,.3,'sine',.14,40)}});

/* ==================== 22-events.js */
/* ================= BLACK HOLES + SUPER EVENTS ================= */
// Black holes pull you (and cubes) toward a lethal core. Every ~30-40s a super event takes over the arena (no regular attacks):
// FLOOR: the floor cracks into pieces over lava, SPACE jumps gaps | BARRAGE: rapid blast circles | STORM: tracking lasers.
const HN=2,FC=8,FR=5,glowL=glow('255,86,24'),keyEl=$('key');
function setKeyLabel(m){const t=m===2?(TOUCH?'FIRE':'E'):m?'JUMP':(TOUCH?'FIRE':'SPACE');
  keyEl.textContent=t;const f=$('firel');if(f)f.textContent=m===2&&TOUCH?'JUMP':t}
P.z=0;P.jt=0;
const hl=Array.from({length:HN},()=>({on:0,x:0,y:0,t:0,life:9,r:22,R:260}));
const F={on:false,ph:0,t:0,c:0,wv:0,n:0,lv:0,la:0,sh:1,ec:0,v:[],
  bub:[],surge:0,sgT:0,gey:0,geyT:0,rain:0,heat:0,tl:Array.from({length:FC*FR},()=>({q:null,cx:0,cy:0,st:0,t:0,r:0,cr:null}))};   // tile st: 0 ok, 1 warning, 2 falling, 3 gone, 4 rising
let jf=0,jlab=false;
function spawnHole(x,y,life){for(let i=0;i<HN;i++){const h=hl[i];if(h.on)continue;h.on=1;h.x=x;h.y=y;h.t=0;h.life=life;return}}
function stepHoles(dt){
  const live=G.state==='play'&&P.alive&&P.drop<=0;
  for(let i=0;i<HN;i++){const h=hl[i];if(!h.on)continue;
    h.t+=dt;if(h.t>h.life+.5){h.on=0;burst(h.x,h.y,24,420,.6,3,0,3);continue}
    if(h.t<.9||h.t>h.life)continue;                                  // pull is active between grow-in and collapse
    const dx=h.x-P.x,dy=h.y-P.y,d=Math.hypot(dx,dy)||1;
    if(live&&d<h.R){const u=1-d/h.R,a=5600*u*u+350*u;P.vx+=dx/d*a*dt;P.vy+=dy/d*a*dt;if(d<h.R*.45)gz+=.5*(1-d/(h.R*.45));if(d<h.r){hurt();if(P.inv>0)h.t=h.life}}   // close = inescapable
    for(let j=0;j<ON;j++){const o=obs[j];if(!o.on||o.a<.5)continue;const ex=h.x-o.x,ey=h.y-o.y,e=Math.hypot(ex,ey)||1;if(e<h.R){const v=1-e/h.R,b=2200*v*v*dt;o.vx+=ex/e*b;o.vy+=ey/e*b;if(e<h.r+o.s*.3){o.on=0;burst(o.x,o.y,6,150,.4,2.4,1,4)}}}   // swallows cubes too
    if(Math.random()<.9){const a=rnd(0,TAU),q=h.R*rnd(.25,1),sp=q/.8;emit(h.x+Math.cos(a)*q,h.y+Math.sin(a)*q,-Math.cos(a)*sp-Math.sin(a)*110,-Math.sin(a)*sp+Math.cos(a)*110,.8,rnd(1.6,3),Math.random()<.4?1:0,0)}
  }
}
function drawHole(h){
  const gw=Math.min(1,h.t/.9),cl=h.t>h.life?Math.max(0,1-(h.t-h.life)/.5):1,k=gw*cl,r=h.r*k;
  ctx.globalCompositeOperation='lighter';
  A(.35*k);ctx.drawImage(glowR,h.x-r*5,h.y-r*5,r*10,r*10);
  A(.08*k);ctx.strokeStyle='#ff2a2a';ctx.lineWidth=1;ctx.setLineDash([4,10]);ctx.lineDashOffset=clock*20;ctx.beginPath();ctx.arc(h.x,h.y,h.R*k,0,TAU);ctx.stroke();ctx.setLineDash([]);   // reach of the pull
  for(let n=0;n<3;n++){const a0=clock*(1.6-n*.4)+n*2;A(.55*k/(n+1));ctx.strokeStyle=n?'#ff2a2a':'#fff';ctx.lineWidth=2.6-n*.6;ctx.beginPath();ctx.arc(h.x,h.y,r*(1.5+n*.55),a0,a0+3.6);ctx.stroke()}   // swirling accretion arms
  ctx.globalCompositeOperation='source-over';A(1);ctx.fillStyle='#000';ctx.beginPath();ctx.arc(h.x,h.y,r*1.1,0,TAU);ctx.fill();
  A(.9*k);ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(h.x,h.y,r*1.12,0,TAU);ctx.stroke();A(1);
}
Object.assign(pat,{blackhole(){for(let n=G.diff>.6&&Math.random()<.5?2:1;n>0;n--){let x,y,t=0;do{x=rnd(150,AW-150);y=rnd(130,AH-130)}while(Math.hypot(P.x-x,P.y-y)<300&&++t<12);spawnHole(x,y,lerp(8,11,G.diff))}G.next+=.8;sfx.warn()}});
PAT.push(['blackhole',.3,2]);
/* --- jump (only used during the floor event) --- */
const JD=.56;
function stepJump(dt){
  const f=keys.f?1:0;
  const needJump=FB.on||F.on||!!FB.wipe;
  if(needJump!==jlab){jlab=needJump;setKeyLabel(FB.on?2:needJump?1:0)}
  if((F.on||FB.on||FB.wipe)&&P.alive&&G.state==='play'&&f&&!jf&&P.jt<=0){P.jt=.001;ach('jump');sfx.jump();burst(P.x,P.y,9,170,.3,2.4,0,4);shake(.04)}
  jf=f;
  if(P.jt>0){P.jt+=dt;
    if(P.jt>=JD){P.jt=0;P.z=0;P.qx=.16;P.qy=-.22;P.qxv=P.qyv=0;burst(P.x,P.y,10,185,.32,2.5,0,4);if(F.on||FB.on)sfx.thud()}
    else P.z=Math.sin(Math.PI*P.jt/JD)}
}

/* --- lava: the 38-frame texture, pre-sliced into repeating canvas patterns --- */
const LVT={img:new Image(),pat:[],w:32,n:38,sc:2.3,ready:false};
LVT.img.onload=()=>{
  for(let i=0;i<LVT.n;i++){
    const c=document.createElement('canvas');c.width=c.height=LVT.w;
    const g=c.getContext('2d');g.imageSmoothingEnabled=false;
    g.drawImage(LVT.img,i*LVT.w,0,LVT.w,LVT.w,0,0,LVT.w,LVT.w);
    const p=ctx.createPattern(c,'repeat');if(!p)return;
    LVT.pat.push(p);
  }
  LVT.ready=LVT.pat.length===LVT.n;
};
LVT.img.src=LA.img.lava;
function lavaFill(a,ox,oy){   // one tiled frame of the texture across the whole arena
  if(!LVT.ready)return false;
  const p=LVT.pat[Math.floor(clock/.1)%LVT.n];
  if(!p.setTransform)return false;
  try{p.setTransform(new DOMMatrix([LVT.sc,0,0,LVT.sc,ox,oy]))}catch(e){return false}
  A(a);ctx.fillStyle=p;ctx.fillRect(0,0,AW,AH);return true;
}
/* --- lava ambience: a seamless loop whose gain follows how much lava is showing --- */
const LVS={buf:null,h:null,loading:false};
function lavaPreload(){if(LVS.loading)return;LVS.loading=true;LVS.buf=LA.aud.lava}
function playLoop(b,vol){if(!AC||!b)return null;
  if(typeof b==='string')return elPlay(b,vol,true,'sfx');
  const s=AC.createBufferSource(),g=AC.createGain();s.buffer=b;s.loop=true;g.gain.value=vol;
  s.connect(g);g.connect(sfxG||master);s.onended=()=>{try{s.disconnect();g.disconnect()}catch(e){}};s.start();return{s,g}}
function lavaSound(on){
  if(on){if(!LVS.h&&LVS.buf)LVS.h=playLoop(LVS.buf,0)}
  else if(LVS.h){stopSnd(LVS.h,.7);LVS.h=null}
}

/* --- floor collapse: jittered tile grid over lava --- */
function inQuad(t,x,y){for(let i=0;i<4;i++){const a=t.q[i],b=t.q[(i+1)%4],ax=t.cx+(a[0]-t.cx)*1.06,ay=t.cy+(a[1]-t.cy)*1.06,bx=t.cx+(b[0]-t.cx)*1.06,by=t.cy+(b[1]-t.cy)*1.06;if((bx-ax)*(y-ay)-(by-ay)*(x-ax)<0)return false}return true}
function buildFloor(){
  F.on=true;F.ph=0;F.wv=0;F.lv=0;F.la=0;F.sh=1;F.ec=2.6;F.v.length=0;setKeyLabel(1);lavaPreload();
  F.bub.length=0;F.surge=0;F.sgT=2.4;F.gey=0;F.geyT=4.2;F.rain=0;F.heat=0;
  for(let j=0;j<=FR;j++)for(let i=0;i<=FC;i++){const e=i>0&&i<FC&&j>0&&j<FR;F.v.push([i*AW/FC+(e?rnd(-18,18):0),j*AH/FR+(e?rnd(-18,18):0)])}
  for(let r=0;r<FR;r++)for(let c=0;c<FC;c++){const t=F.tl[r*FC+c],a=F.v[r*(FC+1)+c],b=F.v[r*(FC+1)+c+1],d=F.v[(r+1)*(FC+1)+c+1],e=F.v[(r+1)*(FC+1)+c];
    t.q=[a,b,d,e];t.cx=(a[0]+b[0]+d[0]+e[0])/4;t.cy=(a[1]+b[1]+d[1]+e[1])/4;t.st=0;t.t=0;t.r=rnd(-.35,.35);
    t.cr=[];const nc=3+(Math.random()*2|0);                       // fracture lines, revealed as the tile is condemned
    for(let k=0;k<nc;k++){const a0=rnd(0,TAU),l=rnd(22,46),a1=a0+rnd(-.6,.6);
      t.cr.push([Math.cos(a0)*5,Math.sin(a0)*5,Math.cos(a0)*l*.55,Math.sin(a0)*l*.55,Math.cos(a1)*l,Math.sin(a1)*l])}
  }
}
function tilesGone(){let n=0;for(let i=0;i<F.tl.length;i++)if(F.tl[i].st===3)n++;return n}
function dropWave(){   // some tiles crack and shudder, then fall into the lava
  const al=[];for(let i=0;i<F.tl.length;i++)if(F.tl[i].st===0)al.push(F.tl[i]);
  const n=Math.min(al.length-6,Math.ceil(al.length*(F.wv<3?.28:.34)));
  for(let i=0;i<n;i++){const t=al.splice(rnd(0,al.length)|0,1)[0];t.st=1;t.t=0}
  let safe=false,nt=null,nd=1e9;
  for(let i=0;i<F.tl.length;i++){const t=F.tl[i],d=Math.hypot(t.cx-P.x,t.cy-P.y);if(t.st===0&&d<280)safe=true;if(t.st===1&&d<nd){nd=d;nt=t}}
  if(!safe&&nt)nt.st=0;                                               // fairness: always keep a tile within jump reach
  shake(.1);sfx.crack();
}

/* --- lava life: bubbles swell on the open pit and pop, and some of them are a warning ------- */
function lavaBubble(dt){
  const gone=tilesGone();
  if(gone>1&&Math.random()<dt*(1.0+gone*.2)&&F.bub.length<9){
    let t=null,g=0;
    for(let i=0;i<F.tl.length;i++)if(F.tl[i].st===3&&Math.random()<1/(++g))t=F.tl[i];
    if(t)F.bub.push({x:t.cx+rnd(-44,44),y:t.cy+rnd(-36,36),t:0,
      d:rnd(1.0,1.8),r:rnd(6,15),hot:Math.random()<lerp(.05,.13,G.diff)});
  }
  for(let i=F.bub.length-1;i>=0;i--){const b=F.bub[i];
    b.t+=dt;
    if(b.t>=b.d){                                                     // pop
      for(let k=0;k<9;k++){const a=rnd(0,TAU);
        emit(b.x,b.y,Math.cos(a)*rnd(30,160),-rnd(90,290),rnd(.5,1.1),rnd(1.8,3.6),1,1.4)}
      sfx.bubble();
      if(b.hot)zone(1,b.x,b.y,lerp(.95,.75,G.diff),62,0);             // the big ones throw a gout up
      F.bub.splice(i,1)}
  }
}
/* --- geyser sweep: a line of eruptions marching across the pit, so standing still is wrong --- */
function lavaGeyser(){
  const h=Math.random()<.5,n=5,lead=lerp(1.5,1.2,G.diff);
  const c=h?rnd(90,AH-90):rnd(90,AW-90),rv=Math.random()<.5;
  for(let i=0;i<n;i++){const u=(rv?n-1-i:i)/(n-1),
    x=h?90+u*(AW-180):c,y=h?c:90+u*(AH-180);
    zone(1,x,y,lead+i*.19,66,0)}
  sfx.warn();
}
function stepFloor(dt){
  if(F.ph<3)F.la=Math.min(1,F.la+dt*2);else F.la=Math.max(0,F.la-dt*1.6);
  lavaSound(F.la>.02&&G.state==='play');
  if(LVS.h)LVS.h.g.gain.value=F.la*(.5+.35*F.surge);
  F.heat=damp(F.heat,F.la*(.3+.7*Math.min(1,tilesGone()/10)),3,dt);
  if(F.ph>=1&&F.ph<=2)lavaBubble(dt);else if(F.bub.length)F.bub.length=0;
  // the tide: the pit swells every few seconds and the whole arena brightens with it
  if(F.ph>=1&&F.ph<=2){F.sgT-=dt;
    if(F.sgT<=0){F.sgT=lerp(5.2,3.6,G.diff);F.surge=1;shake(.22);sfx.swell();
      for(let i=0;i<F.tl.length;i++){const t=F.tl[i];if(t.st!==3||Math.random()>.5)continue;
        for(let k=0;k<4;k++)emit(t.cx+rnd(-50,50),t.cy+rnd(-40,40),rnd(-60,60),-rnd(140,330),rnd(.7,1.4),rnd(2,4),1,1.2)}}}
  F.surge=Math.max(0,F.surge-dt*1.15);
  if(F.ph===0){G.tr=Math.max(G.tr,.22);F.sh=1-.045*Math.min(1,F.t/1.4);if(F.t>1.5){F.ph=1;F.c=.2;sfx.crack()}}      // rumble, seams open
  else if(F.ph===1){F.sh=.955;F.c-=dt;if(F.c<=0){dropWave();F.c=lerp(2.7,2.0,F.wv/5);if(++F.wv>=5){F.ph=2;F.c=4.0}}}
  else if(F.ph===2){F.c-=dt;
    if((F.geyT-=dt)<=0){F.geyT=lerp(5.4,4.2,G.diff);lavaGeyser()}            // the pit starts firing back in lines
    if(F.c<=1.1&&!F.gey){F.gey=1;                                             // one last surge before it closes
      shake(.7);G.fl=Math.max(G.fl,.3);G.fc=0;F.surge=1.4;sfx.erupt();
      const cx=AW/2,cy=AH/2;for(let i=0;i<14;i++){const a=i/14*TAU;
        emit(cx,cy,Math.cos(a)*620,Math.sin(a)*620,1,4.4,1,1.1)}}
    if(F.c<=0){F.ph=3;F.c=1;F.gey=0;for(let i=0;i<F.tl.length;i++){const t=F.tl[i];if(t.st===3){t.st=4;t.t=-Math.random()*.3}}sfx.event()}}   // floor re-forms
  else{F.c-=dt;F.sh=lerp(.955,1,Math.min(1,(1-F.c)/1));
    if(F.c<=0){F.on=false;setKeyLabel(0);lavaSound(false);F.bub.length=0;for(let i=0;i<ZN;i++)if(zn[i].k===1)zn[i].on=0;endEv();return}}
  // eruptions: once the floor is properly broken the lava starts hitting back, so a safe
  // tile is no longer a safe place to stand. One is aimed at you, the rest are scattered.
  if(F.ph>=1&&F.ph<=2&&F.wv>=2){
    F.ec-=dt;
    if(F.ec<=0){F.ec=lerp(1.9,1.35,G.diff);const n=1;
      for(let q=0;q<n;q++){
        const x=q?rnd(90,AW-90):clamp(P.x+rnd(-70,70),75,AW-75),
              y=q?rnd(90,AH-90):clamp(P.y+rnd(-70,70),75,AH-75);
        zone(1,x,y,lerp(1.15,.92,G.diff)+q*.24,72,0)}
      sfx.warn()}
  }
  let on=false;
  for(let i=0;i<F.tl.length;i++){const t=F.tl[i];
    if(t.st===1){t.t+=dt;if(t.t>1){t.st=2;t.t=0;burst(t.cx,t.cy,6,150,.4,2.5,1,3)}}
    else if(t.st===2){t.t+=dt;if(t.t>.6){t.st=3;                                   // the moment it hits the lava
      burst(t.cx,t.cy,14,310,.6,3.4,1,3);
      for(let k=0;k<11;k++){const a=rnd(0,TAU);emit(t.cx+rnd(-34,34),t.cy+rnd(-24,24),Math.cos(a)*rnd(60,220),-rnd(130,310),rnd(.6,1.1),rnd(2.4,4.4),1,1.6)}
      shake(.07);sfx.splash()}}
    else if(t.st===4){t.t+=dt;if(t.t>.6)t.st=0}
    if(!on&&(t.st===0||t.st===1||t.st===4)&&inQuad(t,P.x,P.y))on=true}
  // embers drifting up off the exposed lava
  const gone=tilesGone();
  if(gone&&Math.random()<F.la*.95){const t=F.tl[(Math.random()*F.tl.length)|0];
    if(t.st===3)emit(t.cx+rnd(-52,52),t.cy+rnd(-52,52),rnd(-20,20),-rnd(30,95),rnd(.9,1.8),rnd(1.6,3.2),1,.5)}
  if(P.alive&&G.state==='play'){F.lv=(P.z<=.04&&!on)?F.lv+dt:0;if(F.lv>.14)die()}                // grounded over lava = death (shields don't help)
}
function drawFloor(){
  ctx.save();rr(0,0,AW,AH,26);ctx.clip();
  const sg=Math.min(1,F.surge),lit=F.la*(.55+.45*Math.min(1,tilesGone()/8))*(1+sg*.28);   // brighter as the pit opens, brighter still on a surge
  const g=ctx.createLinearGradient(0,0,0,AH);g.addColorStop(0,'#2b0503');g.addColorStop(1,'#5c0c04');
  A(F.la);ctx.fillStyle=g;ctx.fillRect(0,0,AW,AH);
  lavaFill(F.la*.88,Math.sin(clock*.17)*30,(clock*(6+11*sg))%(LVT.w*LVT.sc));   // the flow speeds up with the tide
  A(F.la*(.54-.08*sg));ctx.fillStyle='#140302';ctx.fillRect(0,0,AW,AH);  // knock the orange back into the game's palette
  if(sg>.01){ctx.globalCompositeOperation='lighter';A(sg*.16);ctx.fillStyle='#ff5a18';ctx.fillRect(0,0,AW,AH);
    ctx.globalCompositeOperation='source-over'}                        // the swell washes the whole pit
  const vg=ctx.createRadialGradient(AW/2,AH/2,AH*.26,AW/2,AH/2,AH*.95);
  vg.addColorStop(0,'rgba(10,2,1,0)');vg.addColorStop(1,'rgba(10,2,1,.72)');
  A(F.la);ctx.fillStyle=vg;ctx.fillRect(0,0,AW,AH);                   // the pit falls away toward the walls
  ctx.globalCompositeOperation='lighter';
  for(let k=0;k<7;k++){const r=230+60*Math.sin(clock*.7+k);A(lit*(.4+.18*Math.sin(clock*1.3+k)));
    ctx.drawImage(glowL,AW*(.5+.48*Math.sin(clock*.31+k*1.7))-r,AH*(.5+.45*Math.cos(clock*.23+k*2.3))-r,r*2,r*2)}   // drifting molten glow
  // bubbles swelling on the open lava
  for(let i=0;i<F.bub.length;i++){const b=F.bub[i],u=clamp(b.t/b.d,0,1),r=b.r*(.3+.7*u);
    A(F.la*(.3+.5*u));ctx.fillStyle=b.hot?'rgba(255,214,150,1)':'rgba(255,140,40,1)';
    ctx.beginPath();ctx.ellipse(b.x,b.y,r,r*.68,0,0,TAU);ctx.fill();
    A(F.la*.5*u);ctx.drawImage(glowL,b.x-r*3,b.y-r*3,r*6,r*6);
    if(b.hot){A(F.la*(.35+.45*Math.sin(clock*16)));ctx.strokeStyle='rgba(255,246,220,.9)';ctx.lineWidth=1.6;
      ctx.beginPath();ctx.ellipse(b.x,b.y,r*1.3,r*.9,0,0,TAU);ctx.stroke()}}
  ctx.globalCompositeOperation='source-over';
  for(let i=0;i<F.tl.length;i++){const t=F.tl[i];if(t.st===3)continue;
    let k=F.sh,al=1,rot=0,ox=0,oy=0,wr=0;
    if(F.ph===0){ox=rnd(-1,1)*F.t*1.2;oy=rnd(-1,1)*F.t*1.2}
    if(t.st===1){wr=Math.abs(Math.sin(t.t*13));ox=rnd(-1.5,1.5);oy=rnd(-1.5,1.5)}
    else if(t.st===2){const u=t.t/.6;k*=1-.28*u;al=1-u;rot=t.r*u;oy=14*u}
    else if(t.st===4){const u=clamp(t.t/.6,0,1);k*=.7+.3*easeOutBack(u);al=Math.min(1,u*2)}
    if(al<=0)continue;
    A(al);ctx.save();ctx.translate(t.cx+ox,t.cy+oy);ctx.rotate(rot);ctx.scale(k,k);
    ctx.beginPath();for(let n=0;n<4;n++)ctx.lineTo(t.q[n][0]-t.cx,t.q[n][1]-t.cy);ctx.closePath();
    ctx.fillStyle='#0d0d10';ctx.fill();
    if(wr){ctx.fillStyle='rgba(255,80,30,'+(.14+.28*wr)+')';ctx.fill()}
    ctx.lineJoin='round';
    if(F.la>.04){                                                      // molten rim: the slab edge glowing against the pit
      A(al*F.la*(t.st===2?.95:.5)*(1+sg*.6));ctx.lineWidth=(5+4*sg)/k;ctx.strokeStyle='rgba(255,110,24,.5)';ctx.stroke()}
    A(al);ctx.lineWidth=1.4/k;ctx.strokeStyle=t.st===2?'rgba(255,140,60,.9)':'rgba(255,255,255,.12)';ctx.stroke();
    if(t.st===1&&t.cr){                                                // fracture lines opening up before it drops
      const u=Math.min(1,t.t/.85);A(al*(.25+.7*u));ctx.strokeStyle='rgba(255,150,50,'+(.5+.5*wr)+')';ctx.lineWidth=(1+2.1*u)/k;
      ctx.beginPath();for(let n=0;n<t.cr.length;n++){const c=t.cr[n];
        ctx.moveTo(c[0],c[1]);ctx.lineTo(c[2]*u,c[3]*u);ctx.lineTo(c[4]*u,c[5]*u)}
      ctx.stroke()}
    ctx.restore()}
  A(1);ctx.restore();
}
Object.assign(sfx,{
  splash(){noise(.3,.26,900);tone(90,.3,'sine',.1,38)},
  thud(){tone(130,.12,'sine',.07,55)},
  bubble(){tone(rnd(150,260),.1,'sine',.025,70);noise(.08,.05,620)},
  swell(){tone(52,1.1,'sine',.1,30);noise(.9,.14,420)},
  erupt(){noise(.5,.34,700);tone(80,.5,'sawtooth',.12,32);tone(240,.3,'square',.04,70)}
});
/* --- event scheduler --- */
function startEv(){
  const k=G.fForce?'floor'
         :(G.xForce||(!G.floweyDone&&G.t>=300)||(G.floweyDone&&G.t-(G.flT||0)>170))?'flowey'   // 5:00, then again and again
         :(G.kForce||(!G.knightKilled&&G.t>28&&(!G.kn||G.t-G.kT>lerp(74,58,G.diff))))?'knight'   // until you finish him
         :(G.bForce||(G.kn>=1&&!G.bridgeDone&&G.t>170))?'bridge'
         :['floor','barrage','storm'][(sr()*3)|0];
  G.fForce=false;
  shrinkClear();FB.haz.length=0;FB.bmb.length=0;FB.wipe=null;FB.lau=null;   // a set-piece needs the whole arena
  const solo=k==='knight'||k==='bridge'||k==='flowey';       // the set-piece encounters announce themselves
  G.ev=k;F.t=0;F.c=.5;F.n=0;
  if(k==='knight'){for(let i=0;i<HN;i++)hl[i].on=0}else{clearHaz();for(let i=0;i<ON;i++){const o=obs[i];if(o.on){burst(o.x,o.y,8,220,.5,3,1,3);o.on=0}}}
  if(!solo){toast(k==='floor'?'Floor collapse':k==='barrage'?'Barrage':'Laser storm',k==='floor'?(TOUCH?'Tap right to jump':'Space to jump'):k==='barrage'?'Keep moving':'Watch the lines');sfx.event();shake(.45);G.fl=Math.max(G.fl,.12);G.fc=0}
  if(k==='floor')buildFloor();if(k==='knight')startKnight();if(k==='flowey')startFlowey();if(k==='bridge')startBridge();
}
function endEv(){if(G.ev==='floor')ach('floors');else if(G.ev==='storm')ach('storms');else if(G.ev==='barrage')ach('barrages');G.ev=null;G.evT=lerp(50,38,G.diff);G.next=1.4;G.tp=Math.min(100,G.tp+50);G.upT=Math.min(G.upT,.6);toast('Survived','+50 TP');sfx.up()}
function stepEv(dt){
  if(G.state!=='play')return;
  if(!G.ev){
    if(!G.floweyDone&&G.t>=300&&P.drop<=0){G.xForce=true;startEv();return}   // 5:00 on the dot
    if(P.drop<=0&&(G.evT-=dt)<=0)startEv();return}
  F.t+=dt;
  if(G.ev==='floor')stepFloor(dt);
  else if(G.ev==='barrage'){F.c-=dt;if(F.c<=0){F.c=lerp(.34,.22,G.diff);const a=F.n++%3===0;zone(0,a?clamp(P.x+rnd(-30,30),60,AW-60):rnd(70,AW-70),a?clamp(P.y+rnd(-30,30),60,AH-60):rnd(70,AH-70),.85,58,0)}if(F.t>7.5)endEv()}
  else if(G.ev==='knight')stepKnight(dt);
  else if(G.ev==='bridge')stepBridge(dt);
  else if(G.ev==='flowey')stepFlowey(dt);
  else{F.c-=dt;if(F.c<=0){F.c=lerp(.55,.4,G.diff);beam(P.x+rnd(-120,120),P.y+rnd(-120,120),rnd(0,Math.PI),.95,22,.45);sfx.warn()}if(F.t>7)endEv()}
}
Object.assign(sfx,{event(){noise(.6,.3,500);tone(70,.7,'sawtooth',.1,35)},crack(){noise(.3,.3,1800);tone(160,.25,'square',.04,60)},jump(){tone(330,.18,'sine',.07,660)}});

/* ==================== 23-knight.js */
/* ================= THE ROARING KNIGHT (one-time boss) ================= */
// Runs as the 'knight' super event. States (ROARING_KNIGHT_*): appearing > transforming > idle > vacuuming > spilling > departing > gone.
// Every animation frame lasts 100 ms and frames hard-cut (no cross-fades). All 13 frames share one 754x653 canvas, so they draw from one anchor.
// He slides in from, and back out to, the right edge of the screen. He cannot be hurt: your shots hit his body and fizzle out.
const KI={};for(const k in KA.img){const im=new Image();im.src=KA.img[k];KI[k]=im}
const KN={sc:.52,ax:400,ay:305,fr:.1,x:AW+165,y:AH*.52};   // sprite scale, anchor in the sprite canvas, seconds per frame, resting position (right of the arena)
const SQ={orb:['ball1','ball2','ball3','ball4','ball5'],trn:['t0','t1','t2','t3'],rtr:['t3','t2','t1','t0'],orbr:['ball5','ball4','ball3','ball2','ball1']};
const KB={ball1:[404,307,88],ball2:[404,307,88],ball3:[404,306,88],ball4:[405,306,88],ball5:[404,303,88],t0:[397,318,101],t1:[403,302,283],t2:[403,272,376],t3:[428,283,477],idle:[384,296,524],r1:[355,406,633],r2:[388,326,670],r3:[362,400,612]};   // per-frame body (sprite px): centre x, centre y, longest side -> the circle your shots hit
const TM={slide:2.2,charge:1.8,hold:.5,out:1.9};   // seconds: slide in + hover/charge before the transformation; idle beat before leaving + slide out
const K={hp:0,mhp:0,hit:0,dead:false,cleanT:0,clean:true,lv:0,on:false,fr:0,st:'gone',t:0,x:KN.x,y:KN.y,x0:KN.x,x1:KN.x,s:1,sx:0,sy:0,fx:0,gacc:0,col:0,ph:0,mus:0,im:null,ik:null,vac:null,vacD:0,roar:null,vacT:5,rel:0,relN:0,racc:0,buf:{},loading:false};
const MUS={h:null,f:null};
const sm=u=>u<=0?0:u>=1?1:u*u*(3-2*u),easeOut3=u=>1-Math.pow(1-clamp(u,0,1),3),easeIn3=u=>{u=clamp(u,0,1);return u*u*u};
const loopF=(list,t)=>list[Math.floor(t/KN.fr)%list.length],onceF=(list,t)=>list[Math.min(list.length-1,Math.floor(t/KN.fr))],animDone=(list,t)=>t>=list.length*KN.fr;
const setF=k=>{K.ik=k;K.im=k?KI[k]:null};
function viewEdgeR(fr){   // world x of the right edge of the screen for a given camera framing amount
  const fit=Math.min(1,vw*.95/((AW+490)*scale)),z=(scale*cam.z+cam.zk*scale)*(1-fr*(1-fit)),cx=vw/2-fr*245*z;return AW/2-cam.x+(vw-cx)/z;
}
const offX=()=>Math.max(viewEdgeR(0),viewEdgeR(1),AW+520)+160;   // just beyond the right edge of the screen
// what one of his own cubes is worth against him: it scales with your gun, so a run that
// invested in damage finishes him in two visits and a bare one takes four or five
const KCUBE=()=>30*(1+U.power*.25+SHOP.dmg*.35);
function knightLive(){   // he is only solid once he is through the door and before he leaves
  return K.on&&!K.dead&&(K.st==='idle'||K.st==='vacuuming'||K.st==='spilling')}
function knightBar(){const f=$('bf');if(f)f.style.transform='scaleX('+clamp(K.hp/K.mhp,0,1).toFixed(3)+')'}
/* His health pool carries across every appearance in a run. He is not a wall of hit points
   you grind in one sitting -- he is a job you come back to. */
function knightHurt(d){
  if(!knightLive())return;
  K.hp-=d;K.hit=.12;knightBar();
  if(K.hp<=K.mhp*.5&&!K.halfSeen){K.halfSeen=true;ach('fKnightHalf');toast('He felt that','Half way through him')}
  if(K.hp<=0)knightDie();
}
function knightDie(){
  K.dead=true;K.hp=0;knightBar();
  setSt('dying');K.mus=2;musicStop(1.4);stopSnd(K.vac,.3);stopSnd(K.roar,.5);K.vac=K.roar=null;
  knightClearCubes();shake(1);G.fl=Math.max(G.fl,.6);G.fc=0;slow(1.8,.12);
  for(let i=0;i<12;i++)setTimeout(()=>{if(K.st==='dying')boomAt(K.x+rnd(-190,190),K.y+rnd(-150,150),rnd(1.1,2.4))},i*130);
  ach('bKnight');if(SET.hard)ach('fHardKnight');if(K.clean)ach('fKnightClean');
  if(U.shield<=1)ach('fLastStand');if(EQUIP==='hollow')ach('fHollowWin');
  G.knightKilled=true;achCheck();
}
function bossBody(){   // the circle your shots hit (null while the boss is absent or still off-screen)
  if(Q.on&&Q.st!=='gone'&&Q.st!=='in'){const z=AN.sc*Q.s;return{x:Q.x+Q.sx,y:Q.y+Q.sy-Q.hz-200*z,r:Math.max(24,112*z)}}
  if(!K.on||!K.ik||K.x-70>viewEdgeR(K.fr))return null;
  const b=KB[K.ik],z=KN.sc*K.s;
  return{x:K.x+K.sx+(b[0]-KN.ax)*z,y:K.y+K.sy+(b[1]-KN.ay)*z,r:Math.max(20,b[2]*.36*z)};
}
let lastTink=0;
function fizzle(b){burst(b.x,b.y,3,110,.22,2,0,6);if(clock-lastTink>.06){lastTink=clock;sfx.tink()}}
/* --- audio: decoded once, played through the game's master gain (so mute works); every handle can be faded + disposed --- */
function b64buf(d){const s=atob(d.slice(d.indexOf(',')+1)),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u.buffer}
function knightPreload(){
  if(K.loading)return;K.loading=true;
  for(const k in KA.aud)K.buf[k]=KA.aud[k];          // paths; the elements load them
  try{const m=new Audio();m.preload='metadata';m.src=KA.aud.vac;   // how long the vacuum runs
    m.addEventListener('loadedmetadata',()=>{if(isFinite(m.duration))K.vacD=m.duration},{once:true})}catch(e){}
}
function playBuf(b,vol,bus){if(!AC||!b)return null;
  if(typeof b==='string')return elPlay(b,vol,false,bus===musG?'mus':'sfx');   // a file, not a buffer
  const s=AC.createBufferSource(),g=AC.createGain();s.buffer=b;g.gain.value=vol;s.connect(g);g.connect(bus||sfxG||master);s.onended=()=>{try{s.disconnect();g.disconnect()}catch(e){}};s.start();return{s,g}}
function stopSnd(h,fade){if(!h||!AC)return;try{const t=AC.currentTime;h.g.gain.cancelScheduledValues(t);h.g.gain.setValueAtTime(h.g.gain.value,t);if(fade>0)h.g.gain.linearRampToValueAtTime(0,t+fade);else h.g.gain.value=0;h.s.stop(t+fade+.02)}catch(e){}}
function musicStart(b,v){if(MUS.h||!b)return;MUS.h=playBuf(b,v||.7,musG)}   // one channel: two bosses can never overlap
function musicStop(f){const h=MUS.h;MUS.h=null;if(h){MUS.f=h;stopSnd(h,f)}}
function musicKill(){stopSnd(MUS.h,0);stopSnd(MUS.f,0);MUS.h=MUS.f=null}
/* --- afterimage trail: duplicates of the current frame are left behind, drift right at a constant speed and fade out --- */
const GN=40,gh=Array.from({length:GN},()=>({on:0,x:0,y:0,l:0,m:.55,a:1,z:1,im:null}));let ghi=0;
const ghLive=()=>{let n=0;for(let i=0;i<GN;i++)if(gh[i].on)n++;return n};
function stepGhosts(dt){
  K.gacc+=K.fx*dt;
  const gstep=TOUCH?.075:.04;if(K.gacc>=gstep&&K.im){K.gacc%=gstep;const g=gh[ghi];ghi=(ghi+1)%GN;g.on=1;g.x=K.x+K.sx;g.y=K.y+K.sy;g.l=g.m=.55;g.a=.25+.45*K.fx;g.z=KN.sc*K.s;g.im=K.im}
  for(let i=0;i<GN;i++){const g=gh[i];if(!g.on)continue;g.l-=dt;if(g.l<=0){g.on=0;continue}g.x+=260*dt}
}
function drawKnight(){
  if(!K.on&&!ghLive())return;
  ctx.save();ctx.imageSmoothingEnabled=false;   // crisp pixel art
  for(let n=0;n<GN;n++){const g=gh[(ghi+n)%GN];if(!g.on||!g.im.naturalWidth)continue;A(g.a*g.l/g.m);ctx.save();ctx.translate(g.x,g.y);ctx.scale(g.z,g.z);ctx.drawImage(g.im,-KN.ax,-KN.ay);ctx.restore()}   // oldest first, so newer copies overlap older ones
  if(K.on&&K.im&&K.im.naturalWidth){
    ctx.save();ctx.translate(K.x+K.sx,K.y+K.sy);
    ctx.globalCompositeOperation='lighter';A(.5);ctx.drawImage(glowW,-270,-270,540,540);ctx.globalCompositeOperation='source-over';   // soft light so the black body reads as a silhouette
    A(1);ctx.scale(KN.sc*K.s,KN.sc*K.s);ctx.drawImage(K.im,-KN.ax,-KN.ay);ctx.restore()}
  ctx.restore();A(1);
}
/* --- the knight's cubes: real obstacle-pool objects with modes (k): 1 pulled in, 2 spilled (fast, then decelerating), 3 small split cubes --- */
function knightCubes(){let n=0;for(let i=0;i<ON;i++)if(obs[i].on&&obs[i].k>0)n++;return n}
function knightClearCubes(){for(let i=0;i<ON;i++){const o=obs[i];if(o.on&&o.k>0){o.on=0;burst(o.x,o.y,2,90,.3,2,1,4)}}}
function knightBlock(o,dt){   // returns true if the block was removed
  if(o.a<1)return false;
  o.tm+=dt;
  if(o.k===1){            // vacuum: accelerate toward the boss
    const ex=K.x-o.x,ey=K.y-o.y,d=Math.hypot(ex,ey)||1,sp=110+640*Math.pow(Math.min(1,o.tm/1.6),2);
    o.vx=ex/d*sp;o.vy=ey/d*sp;
    if(d<34||sp*dt>=d){o.on=0;K.col++;burst(K.x,K.y,2,170,.3,2.4,1,4);return true}
    return false}
  const f=Math.exp(-(o.k===2?1.5:.25)*dt);o.vx*=f;o.vy*=f;                       // smooth deceleration, never a hard stop
  if(o.k===3){const a=o.sp*dt,c=Math.cos(a),s=Math.sin(a),vx=o.vx;o.vx=vx*c-o.vy*s;o.vy=vx*s+o.vy*c}   // each small cube curves its own way
  const m=o.s*.5;                                                                // stay on the map: bounce off the walls
  if((o.x<m&&o.vx<0)||(o.x>AW-m&&o.vx>0))o.vx=-o.vx;
  if((o.y<m&&o.vy<0)||(o.y>AH-m&&o.vy>0))o.vy=-o.vy;
  if(o.k===2&&o.tm>1.7)knightSplit(o);
  else if(o.k===3&&o.tm>o.life){o.s-=dt*28;if(o.s<3){o.on=0;burst(o.x,o.y,3,100,.3,2,1,4);return true}}   // shrink away
  return false;
}
function knightSplit(o){   // one slowed block -> three small cubes on different paths
  const a0=Math.atan2(o.vy,o.vx);burst(o.x,o.y,10,260,.45,2.6,1,3);sfx.hit();
  for(let i=0;i<3;i++){
    const a=a0+rnd(-1.9,1.9)+(i-1)*.5,v=rnd(190,340),c=i?spawnObs(o.x,o.y,0,0,rnd(16,22)):o;
    if(!c)continue;
    c.k=3;c.tm=0;c.a=1;c.vx=Math.cos(a)*v;c.vy=Math.sin(a)*v;if(!i)c.s=rnd(16,22);c.hp=1;c.sp=rnd(-1.3,1.3);c.life=rnd(3,4.2);
  }
}
function spawnVac(){   // a fresh cube appears somewhere on the map and starts being pulled in
  let x,y,q=0;do{x=rnd(80,AW-80);y=rnd(80,AH-80)}while(Math.hypot(x-P.x,y-P.y)<190&&++q<14);
  WNO=1;const o=spawnObs(x,y,0,0,rnd(30,40));WNO=0;if(o){o.k=1;o.tm=0}
}
function spillOne(){   // one cube shot out of the boss, leftward into the arena
  const a=Math.PI+rnd(-1.15,1.15),v=1250*rnd(.85,1.1),o=spawnObs(K.x-30,K.y+rnd(-40,40),Math.cos(a)*v,Math.sin(a)*v,rnd(30,40));
  if(o){o.k=2;o.tm=0;o.a=1;o.vr*=3}
  burst(K.x-30,K.y,3,520,.3,2.6,1,3);shake(.03);
}
function setSt(s){K.st=s;K.t=0}
function startKnight(){
  G.kForce=false;G.tp=Math.min(100,G.tp+40);K.lv=G.kn;   // 0 the first time, then 1, 2, ...   // enough TP to take a few shots at him
  K.on=true;K.y=KN.y;K.x0=offX();K.x=K.x0;K.s=1;K.fx=0;K.gacc=0;K.mus=0;K.col=0;K.ph=0;K.sx=K.sy=0;setF('ball1');setSt('appearing');knightPreload();
  if(!K.mhp){K.mhp=Math.round(3200*dsHP());K.hp=K.mhp;K.halfSeen=false}   // one pool for the whole run
  K.dead=false;K.clean=true;ach('fKnightMet');
}
function reveal(){const r=['Survive','He is back','Again','He will not stop','No more hiding'][Math.min(4,K.lv)];
  toast('The Roaring Knight',r);nameplate(true,K.lv?'The Roaring Knight  ×'+(K.lv+1):'The Roaring Knight');
  $('boss').classList.add('live');knightBar();shake(.45);G.fl=Math.max(G.fl,.14);G.fc=0;slow(.18,.4);burst(K.x,K.y,36,780,.7,3.4,0,3);burst(K.x,K.y,16,520,.6,3,1,3)}
function startVacuum(){
  setSt('vacuuming');K.col=0;K.racc=0;
  K.vacT=clamp((K.vacD||5.4)-1.2,3,6)*(1-Math.min(.3,K.lv*.1));   // and a shorter wind-upK.vac=playBuf(K.buf.vac,.8);sfx.warn();   // vacuum sound: started once, stopped when the pickup ends
}
function startRelease(){
  K.ph=1;K.t=0;K.s=1;K.rel=0;K.racc=0;K.relN=Math.min(44,clamp(K.col,14,28)+K.lv*7);        // more cubes every time he returns
  burst(K.x,K.y,30,700,.6,3,1,3);shake(.5);G.fl=Math.max(G.fl,.15);G.fc=0;K.roar=playBuf(K.buf.roar,.9);   // roar: started once here
}
function startDeparting(){setSt('departing');K.mus=2;K.x1=offX();nameplate(false);musicStop(1.2);stopSnd(K.roar,.4);K.roar=null}   // music fades out the moment he starts to leave
function knightFinish(){   // encounter over: nothing of the boss may remain
  K.on=false;K.st='gone';$('boss').classList.remove('live');$('bf').style.transform='';K.mus=2;musicKill();stopSnd(K.vac,0);stopSnd(K.roar,0);K.vac=K.roar=null;nameplate(false);
  knightClearCubes();for(let i=0;i<GN;i++)gh[i].on=0;K.fx=0;setF(null);
  G.knightDone=true;G.kn++;G.kT=G.t;endEv();
}
function knightAbort(){   // the run ended mid-fight (player died)
  if(!K.on)return;K.on=false;K.st='gone';$('boss').classList.remove('live');$('bf').style.transform='';K.mus=2;musicStop(1);stopSnd(K.vac,.2);stopSnd(K.roar,.2);K.vac=K.roar=null;nameplate(false);for(let i=0;i<GN;i++)gh[i].on=0;setF(null);
}
function knightReset(){   // new run
  K.mhp=0;K.hp=0;K.dead=false;K.halfSeen=false;$('boss').classList.remove('live');$('bf').style.transform='';
  K.on=false;K.st='gone';K.mus=0;musicKill();stopSnd(K.vac,0);stopSnd(K.roar,0);K.vac=K.roar=null;nameplate(false);for(let i=0;i<GN;i++)gh[i].on=0;setF(null);G.knightDone=false;G.kForce=false;K.lv=0;knightPreload();
}
function stepKnight(dt){
  if(!K.on)return;
  K.t+=dt;const t=K.t;K.sx=0;K.sy=Math.sin(clock*2.2)*8;K.hit=Math.max(0,K.hit-dt);   // he hovers
  if(!K.mus&&K.buf.music&&(K.st==='idle'||K.st==='vacuuming'||K.st==='spilling')){K.mus=1;musicStart(K.buf.music)}   // boss music: only once idle, never twice
  switch(K.st){
  case 'appearing':{   // the orb slides in from the right edge of the screen, then hovers and charges (ball1..ball5 loop, 100 ms per frame)
    if(t<TM.slide){K.x=lerp(K.x0,KN.x,easeOut3(t/TM.slide));K.fx=1.1}
    else{
      K.x=KN.x;const k=clamp((t-TM.slide)/TM.charge,0,1);K.fx=.6+.5*k;
      if(Math.random()<.3+.6*k){const a=rnd(0,TAU),r=rnd(80,170)*(1.25-.6*k);emit(K.x+Math.cos(a)*r,K.y+Math.sin(a)*r,-Math.cos(a)*r/.28,-Math.sin(a)*r/.28,.28,2.2,k>.6&&Math.random()<.5?1:0,0)}
    }
    setF(loopF(SQ.orb,t));
    if(t>=TM.slide+TM.charge){setSt('transforming');shake(.3);burst(K.x,K.y,18,460,.5,3,0,3)}
    break}
  case 'transforming':K.x=KN.x;K.fx=1.3;setF(onceF(SQ.trn,t));if(animDone(SQ.trn,t)){setSt('idle');reveal()}break;
  case 'idle':K.x=KN.x;K.fx=.7;setF('idle');if(t>=3)startVacuum();break;
  case 'vacuuming':{
    K.fx=.7;K.sx=rnd(-4,4);K.sy+=rnd(-4,4);setF('r1');
    if(t<Math.min(K.vacT,4.4)){K.racc+=dt*4.6;while(K.racc>=1){K.racc--;spawnVac()}}   // he keeps pulling in fresh cubes while he sucks
    if(Math.random()<.85){const a=rnd(0,TAU),r=rnd(240,360);emit(K.x+Math.cos(a)*r,K.y+Math.sin(a)*r,-Math.cos(a)*r/.45,-Math.sin(a)*r/.45,.45,2.4,Math.random()<.5?1:0,0)}
    let rem=0;for(let i=0;i<ON;i++)if(obs[i].on&&obs[i].k===1)rem++;
    if(t>K.vacT+6&&rem){for(let i=0;i<ON;i++){const o=obs[i];if(o.on&&o.k===1){o.on=0;K.col++}}rem=0}   // safety: never get stuck
    if(t>=K.vacT&&!rem){stopSnd(K.vac,.15);K.vac=null;setSt('spilling');K.ph=0}
    break}
  case 'spilling':
    if(K.ph===0){   // compress
      K.s=1-.07*sm(t/.5);K.sx=rnd(-6,6);K.sy+=rnd(-6,6);K.fx=.8;setF('r1');
      const a=rnd(0,TAU),r=rnd(80,170);emit(K.x+Math.cos(a)*r,K.y+Math.sin(a)*r,-Math.cos(a)*r/.2,-Math.sin(a)*r/.2,.2,2.6,1,0);
      if(t>=.5)startRelease();
    }else if(K.ph===1){   // violent release: cubes stream out one after another while he alternates roaring2 <-> roaring3 every 100 ms
      K.sx=rnd(-3.5,3.5);K.sy+=rnd(-3.5,3.5);K.fx=1;setF(((t/KN.fr)|0)&1?'r3':'r2');
      K.racc+=dt*K.relN/2.6;while(K.racc>=1&&K.rel<K.relN){K.racc--;K.rel++;spillOne()}
      if(t>=3.4&&K.rel>=K.relN){K.ph=2;K.t=0}
    }else{   // cubes slow, split, scatter and vanish; he hovers in his idle pose (no second attack)
      setF('idle');K.fx=.7;
      if((t>1&&!knightCubes())||t>14){knightClearCubes();startDeparting()}
    }
    break;
  case 'dying':{   // he does not leave: he comes apart where he hovers
    K.fx=1.4;K.s=Math.max(.05,1-t*.42);K.sx=rnd(-14,14);K.sy+=rnd(-14,14);
    setF(((t/KN.fr)|0)&1?'r3':'r2');
    if(Math.random()<.9){const a=rnd(0,TAU),r=rnd(40,260);
      emit(K.x+Math.cos(a)*r,K.y+Math.sin(a)*r,Math.cos(a)*460,Math.sin(a)*460,.6,3.4,1,2.6)}
    if(t>2.4){setF(null);K.fx=0;knightClearCubes();
      burst(K.x,K.y,60,900,1.3,6,1,2.2);boomAt(K.x,K.y,3.4);shake(1);
      G.bonus+=900;popText(K.x,K.y,'+900','#ffe28a',30);
      knightFinish();bankOffer('The Roaring Knight',null)}
    break}
  case 'departing':{   // mirror of the entrance: idle beat > transformation 3..0 > orb 5..1 (loops while he hovers) > he slides off to the right
    const A0=TM.hold,B0=A0+SQ.rtr.length*KN.fr,C0=B0+TM.charge*.6,D0=C0+TM.out;
    if(t<A0){K.x=KN.x;setF('idle');K.fx=.6}
    else if(t<B0){K.x=KN.x;setF(onceF(SQ.rtr,t-A0));K.fx=.9}
    else if(t<C0){K.x=KN.x;setF(loopF(SQ.orbr,t-B0));K.fx=.8}
    else if(t<D0){K.x=lerp(KN.x,K.x1,easeIn3((t-C0)/TM.out));setF(loopF(SQ.orbr,t-C0));K.fx=1.1}
    else{setF(null);K.fx=0;if(!ghLive()||t>D0+1)knightFinish()}
    break}
  }
  if(K.on)stepGhosts(dt);
}


/* ================= (Aqua removed) =================
   The knife boss is no longer part of the run. These stubs keep the handful of shared
   call sites honest without carrying her code or her 550 KB of sprites and music. */
const Q={on:false,st:'gone',s:1,x:0,y:0,sx:0,sy:0,hz:0},AN={sc:1,ax:0,ay:0,fr:.1},kf=[],KFN=0;
function startAqua(){}
function stepAqua(){}
function drawAqua(){}
function aquaReset(){G.aquaDone=true;G.qForce=false}
function aquaAbort(){}
function stepKnives(){}
function drawKnives(){}
function clearKnives(){}



/* The Ninth Angle used to live here. It is gone -- removed, not disabled -- and nothing
   else in the game refers to it any more. */

/* ==================== 24-matthew.js */
/* ================= THE FINAL BOSS =================
   Timed to the track. It comes in from the right as a pure black cut-out, shaking, and stays
   that way for the first fifteen seconds -- then the music turns over and so does it, and you
   see what you have been dodging. Everything about it jitters from then until it dies.
   Three attacks on a loop: chains dragged across the room, a spray of large projectiles,
   and slabs of hazard stretched over whole regions of the screen. */
const FI={};for(const k in FL.img){const im=new Image();im.src=FL.img[k];FI[k]=im}
const FSIL={};                                   // pure-black cut-outs, baked once
function flPrep(){
  for(const k of ['body','handA','handB','chain','face2','face3']){
    const im=FI[k];if(!im.complete||!im.naturalWidth)continue;
    if(FSIL[k])continue;
    const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
    const g=c.getContext('2d');g.drawImage(im,0,0);
    g.globalCompositeOperation='source-in';g.fillStyle='#000';g.fillRect(0,0,c.width,c.height);
    FSIL[k]=c}
}
const FBW=276,FBH=182,FHW=136;                   // body and hand draw sizes
const FB={on:false,st:'gone',t:0,mt:0,x:AW+300,y:AH*.36,hp:1,mhp:1,rev:false,pw:1,bmb:[],
  face:0,faceT:0,faceF:0,wipe:null,shot:[],shotT:0,lau:null,scr:null,
  jx:0,jy:0,atk:-1,atkT:0,seq:-1,flash:0,hit:0,died:false,shk:0,
  hands:[],bul:[],haz:[],chain:null,aud:null,node:null,boomT:0,wrn:[]};

/* --- sound for the blasts, and for the sweep. Decoded to buffers once so twenty of them can
       go off together without twenty audio elements fighting over the device. --- */
const FSND={boom:null,wipe:null,rals:null,bt:0,wt:-9};
function flLoadSnd(){
  if(FSND.boom)return;
  FSND.boom=FL.bms;FSND.wipe=FL.wps;FSND.rals=FL.rls;   // paths, played from a pool of elements
}
function flPlay(k,v){if(muted||!FSND[k])return;elShot(FSND[k],v,'sfx')}
function boomSnd(){                                   // a cap, or a cluster becomes a wall of noise
  if(clock-FSND.bt<.05)return;FSND.bt=clock;flPlay('boom',.34);
}
function medalSnd(){                                  // the long clip: let it finish, do not stack it
  if(clock-FSND.wt<8.2)return;FSND.wt=clock;flPlay('wipe',.75);
}
const BOOM=Array.from({length:22},()=>({on:0,x:0,y:0,s:1,t:0,r:0,hot:0,hit:0}));let boomi=0;
function boomAt(x,y,s,hot){                       // the explosion, anywhere, any size
  const b=BOOM[boomi];boomi=(boomi+1)%BOOM.length;
  b.on=1;b.x=x;b.y=y;b.s=s||1;b.t=0;b.r=rnd(0,TAU);b.hot=hot?1:0;b.hit=0;boomSnd();
  if(hot){shake(.22+.1*(s||1));G.fl=Math.max(G.fl,.06)}
}
function stepBoom(dt){
  const live=G.state==='play'&&P.alive&&P.inv<=0&&P.drop<=0&&P.z<=.45;
  for(let i=0;i<BOOM.length;i++){const b=BOOM[i];if(!b.on)continue;
    b.t+=dt;
    if(b.hot&&b.t>.03&&b.t<.42)flGraze(b.x,b.y,FL.fw*b.s*.6);
    if(b.hot&&!b.hit&&b.t>.03&&b.t<.42&&live&&
       Math.hypot(P.x-b.x,P.y-b.y)<FL.fw*b.s*.6+P.s*.3){b.hit=1;hurt()}
    if(b.t>=FL.n/26)b.on=0}}
function drawBoom(){
  const sh=FI.boom;if(!sh||!sh.complete||!sh.naturalWidth)return;
  for(let i=0;i<BOOM.length;i++){const b=BOOM[i];if(!b.on)continue;
    const f=Math.min(FL.n-1,(b.t*26)|0),w=FL.fw*b.s*1.9,h=FL.fh*b.s*1.9;
    ctx.globalCompositeOperation='lighter';A(.55);                      // heat around it
    ctx.drawImage(glowL,b.x-w*.75,b.y-h*.75,w*1.5,h*1.5);
    ctx.globalCompositeOperation='source-over';A(1);                    // and the fire itself, solid
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.r);
    ctx.drawImage(sh,f*FL.fw,0,FL.fw,FL.fh,-w/2,-h/2,w,h);ctx.restore()}
  A(1);
}
/* --- the track. An <audio> element so the 15 s mark is read off the real playhead, routed
       through the master gain so mute and pause still work. --- */
function flMusic(on){
  if(on){
    if(FB.aud)return;
    try{
      FB.h=elPlay(FL.mus,1,true,'mus');FB.aud=FB.h&&FB.h.el;
    }catch(e){FB.aud=null}
  }else if(FB.aud){
    try{FB.aud.pause();FB.aud.src=''}catch(e){}
    FB.aud=null;FB.node=null}
}
const flTime=()=>FB.aud?FB.aud.currentTime:FB.t;   // the fight runs on the song, not the clock
const FACES=['body','face2','face3'];              // what it is wearing this second


/* the chain's own sound, played off its own element so it can overlap the track */
let flChSnd=null;
function flChainSnd(){
  if(!AC)return;
  try{
    elShot(FL.chs,1,'sfx');
  }catch(e){}
}

/* How much game the player is actually bringing. Summoned at 0:10 with nothing, this is ~1.
   Reached at 5:00 off a real run, with ten card picks and a shop behind them, it is near 2 --
   and Matthew is that much faster and that much harder to put down. */
function flPow(){
  let u=0;for(const k in U)u+=U[k];
  return 1+u*.055+shopTotal()*.05;
}
const flP=()=>FB.on?FB.pw:1+G.diff*.5;   // his attacks keep their teeth when they turn up elsewhere
/* --- lifecycle --- */
function startFlowey(){
  G.xForce=false;flPrep();
  FB.on=true;FB.st='enter';FB.t=0;FB.rev=false;FB.atk=-1;FB.atkT=1e9;FB.seq=-1;
  FB.flash=0;FB.hit=0;FB.died=false;FB.shk=0;FB.boomT=0;
  FB.x=AW+460;FB.y=AH*.38;
  FB.pw=flPow();
  FB.mhp=Math.round(1050*dsHP()*(1+(FB.pw-1)*.5)*(1+(G.flw||0)*.45));   // every return is a harder oneFB.hp=FB.mhp;
  FB.bul.length=0;FB.haz.length=0;FB.chain=null;FB.wrn.length=0;FB.bmb.length=0;
  FB.wipe=null;FB.shot.length=0;FB.lau=null;FB.scr=null;FB.face=0;FB.faceT=1;FB.faceF=0;
  FB.hands=[{x:AW+240,y:AH*.26,tx:AW-210,ty:AH*.24,m:0,a:0,ph:0},
            {x:AW+240,y:AH*.66,tx:AW-210,ty:AH*.68,m:0,a:0,ph:Math.PI}];
  for(let i=0;i<BOOM.length;i++)BOOM[i].on=0;
  G.tp=Math.min(100,G.tp+60);
  flMusic(true);flLoadSnd();setKeyLabel(2);
  nameplate(true,G.floweyDone?'MATTHEW  ×'+((G.flw||0)+1):'? ? ?');$('boss').classList.add('live','flo');flBar();
  FB.clean=true;ach('fMattMet');if(G.flw)ach('fMattAgain');
  toast('...','Something is coming in from the right');
  shake(.6);G.fl=Math.max(G.fl,.25);G.fc=0;
}
function flBar(){const f=$('bf');if(f)f.style.transform='scaleX('+clamp(FB.hp/FB.mhp,0,1).toFixed(3)+')'}
function floweyEnd(win){
  FB.on=false;FB.st='gone';flMusic(false);nameplate(false);setKeyLabel(0);P.z=P.jt=0;
  $('boss').classList.remove('live','flo');$('bf').style.transform='';
  FB.bul.length=0;FB.haz.length=0;FB.chain=null;FB.wrn.length=0;FB.bmb.length=0;FB.wipe=null;FB.shot.length=0;FB.lau=null;FB.scr=null;G.flT=G.t;
  const first=!G.floweyDone;G.floweyDone=true;G.flw=(G.flw||0)+1;
  if(win){ach('bMatthew');if(SET.hard)ach('fHardMatt');if(FB.clean)ach('fMattClean');
    if(U.shield<=1)ach('fLastStand');if(EQUIP==='hollow')ach('fHollowWin');
    if(G.knightKilled&&G.bridgeDone)ach('fAllThree');
    G.bonus+=1400;achCheck()}
  if(win&&first)winRun();                                  // only the first kill ends the run
  else if(win)bankOffer('Matthew',endEv);
  else endEv();
}
function floweyAbort(){if(!FB.on)return;FB.on=false;FB.st='gone';flMusic(false);nameplate(false);setKeyLabel(0);P.z=P.jt=0;
  $('boss').classList.remove('live','flo');$('bf').style.transform='';
  FB.bul.length=0;FB.haz.length=0;FB.chain=null;FB.wrn.length=0;FB.bmb.length=0;FB.wipe=null;FB.shot.length=0;FB.lau=null;FB.scr=null}
function floweyReset(){FB.on=false;FB.st='gone';flMusic(false);FB.bul.length=0;FB.haz.length=0;FB.wrn.length=0;FB.bmb.length=0;FB.wipe=null;FB.shot.length=0;FB.lau=null;FB.scr=null;
  FB.chain=null;G.floweyDone=false;G.flw=0;G.flT=0;FB.halfSeen=false;G.xForce=false;$('boss').classList.remove('live','flo')}
const flRest=()=>clamp(viewEdgeR(0)-FBW*.56,AW+FBW*.42,AW+230);   // off the arena, still on screen
function flBody(){
  if(!FB.on||FB.st==='gone'||FB.st==='dying'||FB.x>AW+300)return null;
  return{x:FB.x,y:FB.y,w:FBW*.56,h:FBH*.62};
}
function flHurt(d){
  if(!FB.on||FB.st==='dying')return;
  FB.hp-=d;FB.hit=.1;flBar();
  if(FB.hp<=FB.mhp*.5&&!FB.halfSeen){FB.halfSeen=true;ach('fMattHalf')}
  if(FB.hp<=0){FB.st='dying';FB.t=0;FB.died=true;
    FB.bul.length=0;FB.haz.length=0;FB.chain=null;FB.bmb.length=0;FB.wipe=null;FB.shot.length=0;FB.lau=null;FB.scr=null;clearHaz();
    flMusic(false);shake(1);G.fl=Math.max(G.fl,.5);G.fc=0;slow(1.6,.13);
    for(let i=0;i<9;i++)setTimeout(()=>{if(FB.st==='dying')boomAt(FB.x+rnd(-150,150),FB.y+rnd(-110,110),rnd(1,2.2))},i*140)}
}

/* Grazing works on Matthew the way it works on a cube: ride close to what he throws and the
   near miss pays for the shot you fire back. Without this the fight is the only place in the
   game where playing well earns you nothing. */
function flGraze(x,y,r){
  if(G.state!=='play'||!P.alive||P.drop>0)return;
  const d=Math.hypot(P.x-x,P.y-y),gr=r+46+8*U.graze;
  if(d<gr&&d>r){gz+=(1-(d-r)/(gr-r))*.8;
    if(Math.random()<.18)emit(P.x+rnd(-8,8),P.y+rnd(-8,8),(P.x-x)*.4,(P.y-y)*.4,.3,2,0,4)}
}
/* --- ATTACK 1: chains dragged across the room ------------------------------------------- */
function flChains(){
  FB.chain={t:0,dur:3.1,ext:0,tip:[AW,AW],ys:[AH*.3,AH*.7],amp:AH*.26,
    sp:lerp(.62,.95,dsK())*clamp(FB.pw*.8,.8,1.9)};
  flChainSnd();
  FB.hands[0].m=0;FB.hands[1].m=0;
  sfx.flChain();
}
/* --- ATTACK 2: a spray of large projectiles ---------------------------------------------- */
function flSpray(){
  FB.spray={t:0,dur:2.7,n:0,gap:lerp(.72,.46,dsK())/clamp(FB.pw*.9,.8,2)};
  FB.hands[0].m=1;FB.hands[1].m=1;
  sfx.flSpray();
}
function flShoot(h){
  const k=7+Math.round(3*dsK()+2.5*(FB.pw-1)),a0=rnd(0,TAU),v=lerp(170,245,dsK())*clamp(FB.pw*.86,.85,1.5);
  for(let i=0;i<k;i++){const a=a0+i*TAU/k+rnd(-.1,.1);
    FB.bul.push({x:h.x,y:h.y,vx:Math.cos(a)*v*rnd(.8,1.2),vy:Math.sin(a)*v*rnd(.8,1.2),
      r:rnd(0,TAU),vr:rnd(-2.4,2.4),s:rnd(54,78),l:7})}
  boomAt(h.x,h.y,.7);shake(.18);flPlay('rals',.6);   // they scream on the way out
}
/* --- ATTACK 3: slabs of hazard stretched over the room ----------------------------------- */
function flHazard(){
  const n=3+Math.round(2*dsK()+1.5*(flP()-1));
  for(let i=0;i<n;i++){
    const vert=Math.random()<.5;
    let x,y,w,h;
    if(vert){w=rnd(110,190);h=AH;x=rnd(20,AW-w-20);y=0}
    else{w=AW;h=rnd(90,150);x=0;y=rnd(20,AH-h-20)}
    FB.haz.push({x,y,w,h,t:-i*.26,warn:lerp(.95,.68,dsK())/clamp(flP()*.6,.75,1.35),live:1.45,done:0})}
  sfx.flHaz();
}

/* --- ATTACK 4: cluster bombs. One lands, sits for a beat, then goes up and throws four more
       of itself out, and those go up too. The blasts are the real ones, so they all bite. --- */
function flBombs(){
  const k=2+Math.round(dsK()+(flP()-1));
  for(let i=0;i<k;i++){
    const h=FB.hands[i%2],e=edge((Math.random()*4)|0,rnd(.2,.8)),
      sx=h?h.x:e[0],sy=h?h.y:e[1];
    let x,y,t=0;
    do{x=rnd(120,AW-120);y=rnd(120,AH-120)}while(Math.hypot(P.x-x,P.y-y)<130&&++t<10);
    flLob(sx,sy,x,y,1,i*.3);
  }
  if(FB.hands[0]){FB.hands[0].m=1;FB.hands[1].m=1}
  sfx.flBomb();
}
function flLob(x0,y0,x1,y1,gen,dl){
  FB.bmb.push({x0,y0,x1,y1,x:x0,y:y0,t:-(dl||0),
    fly:gen>1?.42:.62,fuse:(gen>1?.62:.85)/clamp(flP()*.75,.8,1.5),
    gen,r:rnd(0,TAU),vr:rnd(-5,5),s:gen>1?46:66,blew:0});
}
function stepBombs(dt){
  for(let i=FB.bmb.length-1;i>=0;i--){const b=FB.bmb[i];
    b.t+=dt;if(b.t<0)continue;
    b.r+=b.vr*dt;
    if(b.t<b.fly){                                    // the throw: a lob with a fake arc
      const u=b.t/b.fly;
      b.x=lerp(b.x0,b.x1,u);b.y=lerp(b.y0,b.y1,u)-Math.sin(u*Math.PI)*120;
    }else{
      b.x=b.x1;b.y=b.y1;
      if(b.t>=b.fly+b.fuse&&!b.blew){
        b.blew=1;
        boomAt(b.x,b.y,b.gen>1?.78:1.1,1);            // a live blast, same as all of his
        if(b.gen===1){const k=3+(Math.random()<.4?1:0),a0=rnd(0,TAU);
          for(let j=0;j<k;j++){const a=a0+j*TAU/k,d=rnd(105,170);
            flLob(b.x,b.y,clamp(b.x+Math.cos(a)*d,40,AW-40),clamp(b.y+Math.sin(a)*d,40,AH-40),2,.04*j)}}
        FB.bmb.splice(i,1)}}}
}
function drawBombs(){
  const im=FI.bomb;
  for(let i=0;i<FB.bmb.length;i++){const b=FB.bmb[i];if(b.t<0)continue;
    const air=b.t<b.fly,u=air?b.t/b.fly:1,
      sc=b.s*(air?1+Math.sin(u*Math.PI)*.35:1),
      f=air?0:clamp((b.t-b.fly)/b.fuse,0,1);
    if(!air){                                         // the fuse, tightening on the spot
      ctx.globalCompositeOperation='lighter';
      A(.3+.6*f);ctx.strokeStyle='rgba(255,'+(190-130*f|0)+',60,1)';ctx.lineWidth=2+4*f;
      ctx.beginPath();ctx.arc(b.x,b.y,b.s*(1.5-.5*f),0,TAU);ctx.stroke();
      A(.2+.5*f);ctx.drawImage(glowR,b.x-b.s*1.8,b.y-b.s*1.8,b.s*3.6,b.s*3.6);
      ctx.globalCompositeOperation='source-over';A(1)}
    else{A(.3);ctx.fillStyle='#000';ctx.beginPath();            // its shadow on the way down
      ctx.ellipse(lerp(b.x0,b.x1,u),lerp(b.y0,b.y1,u),sc*.34,sc*.14,0,0,TAU);ctx.fill()}
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.r);
    A(1);
    if(im&&im.width)ctx.drawImage(im,-sc/2,-sc/2,sc,sc);
    else{ctx.fillStyle='#e8893a';rr(-sc/2,-sc/2,sc,sc,8);ctx.fill()}
    if(!air&&f>.5){A((f-.5)*1.8);ctx.fillStyle='#fff';rr(-sc/2,-sc/2,sc,sc,8);ctx.fill()}
    ctx.restore();A(1)}
}

/* --- ATTACK: the sweep. A slab of it, stretched the full height of the room, crossing from
       one side to the other. There is nowhere to stand, so you go around or over it. --- */
function flWipe(){
  if(FB.wipe)return;
  const dir=Math.random()<.5?1:-1;
  FB.wipe={dir,t:0,warn:lerp(1.1,.85,dsK()),dur:lerp(2.6,2.1,dsK())/clamp(flP()*.8,.85,1.4),
    h:lerp(120,150,dsK()),snd:0,y:0};
  sfx.flWipe();
}
/* --- ATTACK: he throws them straight at you, one after another. --- */
function flShots(){
  FB.shotT=0;
  const k=4+Math.round(2*dsK()+2*(FB.pw-1));
  for(let i=0;i<k;i++)FB.shot.push({t:-i*lerp(.3,.19,dsK()),x:0,y:0,vx:0,vy:0,s:0,go:0,
    hx:FB.hands[i%2]?0:0,idx:i%2});
  flPlay('wipe',.5);
}
function stepWipe(dt){
  const live=G.state==='play'&&P.alive&&P.inv<=0&&P.drop<=0;
  if(FB.wipe){const w=FB.wipe;w.t+=dt;
    if(w.t>w.warn&&!w.snd){w.snd=1;medalSnd()}
    if(w.t>w.warn){
      const u=clamp((w.t-w.warn)/w.dur,0,1);
      w.y=w.dir>0?lerp(-w.h,AH+w.h,u):lerp(AH+w.h,-w.h,u);   // across the whole room, top to bottom
      if(live&&P.z<=.45&&Math.abs(P.y-w.y)<w.h*.5+P.s*.28)hurt();   // the jump is the answer
      if(u>=1)FB.wipe=null}}
  for(let i=FB.shot.length-1;i>=0;i--){const s=FB.shot[i];
    s.t+=dt;if(s.t<0)continue;
    if(!s.go){s.go=1;const h=FB.hands[s.idx]||FB.hands[0];
      const a=Math.atan2(P.y-h.y,P.x-h.x),v=lerp(330,430,dsK())*clamp(FB.pw*.86,.85,1.4);
      s.x=h.x;s.y=h.y;s.vx=Math.cos(a)*v;s.vy=Math.sin(a)*v;s.s=lerp(74,96,dsK());
      boomAt(h.x,h.y,.5)}
    s.x+=s.vx*dt;s.y+=s.vy*dt;
    if(s.x<-160||s.x>AW+260||s.y<-160||s.y>AH+160){FB.shot.splice(i,1);continue}
    flGraze(s.x,s.y,s.s*.3);
    if(live&&Math.hypot(P.x-s.x,P.y-s.y)<s.s*.3+P.s*.3){hurt();FB.shot.splice(i,1)}}
}
function drawWipe(){
  const im=FI.hazard;
  if(FB.wipe){const w=FB.wipe;
    if(w.t<=w.warn){const u=clamp(w.t/w.warn,0,1),ey=w.dir>0?-w.h*.4:AH+w.h*.4;
      ctx.globalCompositeOperation='lighter';
      A(.22+.45*u*(Math.sin(clock*22)>0?1:.4));ctx.fillStyle='#ff2a2a';
      ctx.fillRect(0,w.dir>0?0:AH-80,AW,80);
      for(let i=0;i<11;i++){const x=(i+.5)/11*AW;                  // chevrons pointing the way it comes
        A(.3+.5*u);ctx.strokeStyle='rgba(255,90,70,1)';ctx.lineWidth=3;
        ctx.beginPath();ctx.moveTo(x-20,ey+w.dir*-26);ctx.lineTo(x,ey+w.dir*22);
        ctx.lineTo(x+20,ey+w.dir*-26);ctx.stroke()}
      ctx.globalCompositeOperation='source-over';
      A(.7+.3*Math.sin(clock*9));ctx.fillStyle='#fff';ctx.font='700 22px '+FF;ctx.textAlign='center';
      ctx.fillText(TOUCH?'TAP TO JUMP':'JUMP IT',AW/2,AH*.52);A(1)}
    else{const y=w.y,sw=FI.sweep;
      A(1);
      if(sw&&sw.width){const tw=w.h*(sw.width/sw.height)*1.1;      // stretched right across
        for(let x=-20;x<AW+20;x+=tw)ctx.drawImage(sw,x,y-w.h/2,tw,w.h)}
      else{ctx.fillStyle='#8e0f16';ctx.fillRect(0,y-w.h/2,AW,w.h)}
      ctx.globalCompositeOperation='lighter';
      A(.4+.3*Math.sin(clock*26));ctx.drawImage(glowR,-60,y-w.h,AW+120,w.h*2);
      ctx.globalCompositeOperation='source-over';
      A(.7+.3*Math.sin(clock*30));ctx.strokeStyle='rgba(255,250,236,1)';ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(0,y-w.h/2);ctx.lineTo(AW,y-w.h/2);
      ctx.moveTo(0,y+w.h/2);ctx.lineTo(AW,y+w.h/2);ctx.stroke();A(1)}}
  const si=FI.bomb;
  for(let i=0;i<FB.shot.length;i++){const s=FB.shot[i];if(!s.go)continue;
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(s.vy,s.vx));
    ctx.globalCompositeOperation='lighter';A(.4);
    ctx.drawImage(glowR,-s.s,-s.s*.7,s.s*2,s.s*1.4);
    ctx.globalCompositeOperation='source-over';A(1);
    if(si&&si.width)ctx.drawImage(si,-s.s/2,-s.s/2,s.s,s.s);
    else{ctx.fillStyle='#ff5a3a';rr(-s.s/2,-s.s/2,s.s,s.s,7);ctx.fill()}
    ctx.restore()}
  A(1);
}

/* --- ATTACK: it takes aim. The thing turns to point at you and hangs there just long enough
       that you know, then leaves in a straight line and does not stop. --- */
function flLaunch(){
  if(FB.lau)return;
  const e=(Math.random()*4)|0,p=edge(e,rnd(.2,.8));
  FB.lau={x:p[0],y:p[1],a:Math.atan2(P.y-p[1],P.x-p[0]),t:0,
    aim:lerp(1.15,.85,dsK()),go:0,s:lerp(118,150,dsK()),
    v:lerp(560,760,dsK())*clamp(flP()*.85,.85,1.4)};
  medalSnd();
}
function stepLaunch(dt){
  const L=FB.lau;if(!L)return;
  const live=G.state==='play'&&P.alive&&P.inv<=0&&P.drop<=0;
  L.t+=dt;
  if(!L.go){
    const tg=Math.atan2(P.y-L.y,P.x-L.x),d=Math.atan2(Math.sin(tg-L.a),Math.cos(tg-L.a));
    L.a+=clamp(d,-2.4*dt,2.4*dt);                       // it tracks while it winds up, then commits
    if(L.t>=L.aim){L.go=1;boomAt(L.x,L.y,1.1);shake(.3)}
  }else{
    L.x+=Math.cos(L.a)*L.v*dt;L.y+=Math.sin(L.a)*L.v*dt;
    if(live&&Math.hypot(P.x-L.x,P.y-L.y)<L.s*.3+P.s*.3)hurt();
    flGraze(L.x,L.y,L.s*.3);
    if(L.x<-320||L.x>AW+320||L.y<-320||L.y>AH+320)FB.lau=null}
}
function drawLaunch(){
  const L=FB.lau;if(!L)return;
  const im=FI.lance||FI.bomb,u=L.go?1:clamp(L.t/L.aim,0,1);
  if(!L.go){                                            // the line it is going to take
    ctx.globalCompositeOperation='lighter';
    A(.25+.55*u*(Math.sin(clock*20)>0?1:.45));
    ctx.strokeStyle='rgba(255,90,70,1)';ctx.lineWidth=3+3*u;
    ctx.setLineDash([18,14]);ctx.beginPath();
    ctx.moveTo(L.x,L.y);ctx.lineTo(L.x+Math.cos(L.a)*1800,L.y+Math.sin(L.a)*1800);ctx.stroke();
    ctx.setLineDash([]);
    A(.3+.4*u);ctx.drawImage(glowR,L.x-L.s,L.y-L.s,L.s*2,L.s*2);
    ctx.globalCompositeOperation='source-over';A(1)}
  ctx.save();ctx.translate(L.x,L.y);ctx.rotate(L.a);
  if(L.go){ctx.globalCompositeOperation='lighter';A(.5);
    ctx.drawImage(glowR,-L.s*1.3,-L.s*.8,L.s*2.6,L.s*1.6);
    ctx.globalCompositeOperation='source-over'}
  A(1);const k=L.s*(L.go?1:.6+.4*u);
  if(im&&im.width)ctx.drawImage(im,-k/2,-k/2,k,k);
  else{ctx.fillStyle='#ff5a3a';rr(-k/2,-k/2,k,k,8);ctx.fill()}
  ctx.restore();A(1);
}

/* --- ATTACK: the scream. It arrives small, swells until it fills a third of the room, and
       then lets go: rings of sound come off it one after another, each with a single gap
       somewhere on its circumference, and the gaps do not line up. You do not outrun it --
       you read where the next hole is and put yourself in it. --- */
function flScream(){
  if(FB.scr)return;
  const m=120;
  FB.scr={x:rnd(m,AW-m),y:rnd(m,AH-m),t:0,
    warn:lerp(1.0,.72,dsK()),
    n:0,gap:lerp(1.05,.72,dsK())/clamp(flP()*.85,.85,1.5),
    rings:[],max:3+((dsK()*2)|0),dur:0,done:0,sh:0};
  FB.scr.dur=FB.scr.warn+FB.scr.gap*FB.scr.max+1.9;
}
function stepScream(dt){
  const S=FB.scr;if(!S)return;
  const live=G.state==='play'&&P.alive&&P.inv<=0&&P.drop<=0;
  S.t+=dt;
  if(S.t>S.warn){
    if(!S.sh){S.sh=1;shake(.55);flPlay('rals',.7);G.fl=Math.max(G.fl,.2)}
    // one ring per beat, each with its gap somewhere new
    while(S.n<S.max&&S.t>=S.warn+S.n*S.gap){
      S.rings.push({r:46,a:rnd(0,TAU),w:lerp(1.05,.78,dsK()),hit:0});
      S.n++;shake(.22);boomSnd();
    }
  }
  const sp=lerp(230,330,dsK())*clamp(flP()*.9,.9,1.4);
  for(let i=S.rings.length-1;i>=0;i--){
    const g=S.rings[i];g.r+=sp*dt;
    if(g.r>1500){S.rings.splice(i,1);continue}
    const dx=P.x-S.x,dy=P.y-S.y,d=Math.hypot(dx,dy);
    if(Math.abs(d-g.r)<26){
      let da=Math.atan2(dy,dx)-g.a;da=Math.atan2(Math.sin(da),Math.cos(da));
      if(Math.abs(da)>g.w*.5){if(live)hurt()}
      else flGraze(S.x+Math.cos(g.a)*g.r,S.y+Math.sin(g.a)*g.r,30);
    }
  }
  if(S.t>=S.dur&&!S.rings.length)FB.scr=null;
}
function drawScream(){
  const S=FB.scr;if(!S)return;
  const im=FI.scream,u=clamp(S.t/S.warn,0,1);
  // the rings
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<S.rings.length;i++){const g=S.rings[i],f=clamp(1-g.r/1400,0,1);
    A(.22+.5*f);ctx.strokeStyle='rgba(255,236,160,1)';ctx.lineWidth=16*f+5;
    ctx.beginPath();ctx.arc(S.x,S.y,g.r,g.a+g.w*.5,g.a-g.w*.5+TAU);ctx.stroke();
    A(.5*f);ctx.strokeStyle='rgba(255,255,255,1)';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(S.x,S.y,g.r,g.a+g.w*.5,g.a-g.w*.5+TAU);ctx.stroke()}
  ctx.globalCompositeOperation='source-over';A(1);
  // the face
  const grow=S.t<=S.warn?(.22+.78*u*u):(1+.12*Math.sin((S.t-S.warn)*26)),
        w=lerp(120,330,dsK()*.4+.6)*grow;
  if(S.t<=S.warn){                                  // the tell: it is coming, and from here
    ctx.globalCompositeOperation='lighter';
    A(.18+.5*u*(Math.sin(clock*22)>0?1:.4));ctx.drawImage(glowR,S.x-w,S.y-w,w*2,w*2);
    ctx.globalCompositeOperation='source-over';
    A(.5+.4*u);ctx.strokeStyle='rgba(255,90,70,1)';ctx.lineWidth=3;ctx.setLineDash([14,12]);
    ctx.beginPath();ctx.arc(S.x,S.y,w*.8,0,TAU);ctx.stroke();ctx.setLineDash([])}
  A(S.t<=S.warn?.35+.65*u:1);
  if(im&&im.width){const h=w*(im.height/im.width);
    ctx.save();ctx.translate(S.x,S.y);
    if(S.t>S.warn)ctx.rotate(Math.sin(S.t*31)*.035);
    ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore()}
  else{ctx.fillStyle='#ffe28a';ctx.beginPath();ctx.arc(S.x,S.y,w*.4,0,TAU);ctx.fill()}
  A(1);
}
const FATK=[flChains,flSpray,flHazard,flBombs,flWipe,flShots,flLaunch,flScream];
/* 0 chains and 1 spray need the hands, so only one of those at a time. Everything else --
   slabs, cluster bombs, the sweep, the thrown shots -- can land whenever, including on top
   of a hand attack. Nothing runs on a fixed rotation any more. */
const FHAND=[1,1,0,0,0,0,0,0],FGAP=[4.2,3.8,3.0,3.5,4.0,3.2,3.6,4.4];
function flLive(){let n=0;if(FB.chain)n++;if(FB.spray)n++;if(FB.wipe)n++;if(FB.lau)n++;if(FB.scr)n++;
  if(FB.haz.length)n++;if(FB.bmb.length)n++;if(FB.shot.length)n++;return n}
function flNext(){
  if(flLive()>=3){FB.atkT=.5;return}                 // wait for the room to clear a little
  const busy=!!(FB.chain||FB.spray);
  const pool=[];for(let i=0;i<FATK.length;i++){
    if(busy&&FHAND[i])continue;
    if(i===4&&FB.wipe)continue;
    if(i!==FB.atk||FATK.length<3)pool.push(i)}
  const k=pool.length?pool[(Math.random()*pool.length)|0]:2;
  FB.atk=k;FATK[k]();
  FB.atkT=FGAP[k]/clamp(FB.pw*.92,.8,1.7);
}
/* --- step --- */
function stepFlowey(dt){
  if(!FB.on)return;
  FB.t+=dt;FB.mt=flTime();
  FB.flash=Math.max(0,FB.flash-dt*2);FB.hit=Math.max(0,FB.hit-dt*6);
  FB.faceF=Math.max(0,FB.faceF-dt*4.5);
  if(FB.rev&&(FB.faceT-=dt)<=0){FB.faceT=1;FB.face++;FB.faceF=1;   // one second each, with a flash
    boomAt(FB.x+rnd(-70,70),FB.y+rnd(-60,60),.75);shake(.14)}
  const J=FB.rev?3.4:2.2;                                   // the shaking, always
  FB.jx=rnd(-J,J);FB.jy=rnd(-J,J);
  if(!FB.rev&&FB.mt>=15){                                   // the turn
    FB.rev=true;FB.flash=1;shake(1);G.fl=Math.max(G.fl,.55);G.fc=0;slow(.7,.16);
    nameplate(true,'MATTHEW');FB.atkT=.7;
    toast('MATTHEW',TOUCH?'Tap to jump · it fires for you':'E to shoot him · Space to jump');
    for(let i=0;i<6;i++)boomAt(FB.x+rnd(-170,170),FB.y+rnd(-130,130),rnd(1.2,2.4));
    sfx.flReveal()}
  // background chaos: explosions keep going off through the whole fight
  if(FB.st==='fight'&&FB.rev&&!FB.chain&&(FB.boomT-=dt)<=0){
    FB.boomT=lerp(1.25,.8,dsK())/clamp(FB.pw*.9,.8,1.55);
    const k=1+(Math.random()<.4?1:0);
    for(let i=0;i<k;i++){let x,y,t=0;
      do{x=rnd(70,AW-70);y=rnd(70,AH-70)}while(Math.hypot(P.x-x,P.y-y)<110&&++t<8);
      FB.wrn.push({x,y,s:rnd(.9,1.5),t:0,dur:lerp(.85,.6,dsK())})}}
  stepBombs(dt);stepWipe(dt);stepLaunch(dt);stepScream(dt);
  for(let i=FB.wrn.length-1;i>=0;i--){const w=FB.wrn[i];w.t+=dt;
    if(w.t>=w.dur){boomAt(w.x,w.y,w.s,1);FB.wrn.splice(i,1)}}
  stepBoom(dt);

  if(FB.st==='enter'){
    FB.x=damp(FB.x,flRest(),2.2,dt);               // it never comes onto the floor you fight on
    if(FB.x<flRest()+26){FB.st='fight';FB.t=0}
  }else if(FB.st==='dying'){
    const u=clamp(FB.t/4.2,0,1);
    FB.x+=240*dt*u;FB.y+=40*dt*u;
    G.tr=Math.max(G.tr,.25+.3*u);
    if(Math.random()<.5)boomAt(FB.x+rnd(-170,170),FB.y+rnd(-130,130),rnd(.7,1.8));
    if(u>=1){G.fl=1;G.fc=0;floweyEnd(true);return}
    return;
  }else if(FB.st==='fight'){
    FB.x=damp(FB.x,flRest(),3,dt);FB.y=damp(FB.y,AH*.38,3,dt);
    if(FB.rev&&(FB.atkT-=dt)<=0)flNext();      // it does nothing at all until the song turns over
  }
  const live=G.state==='play'&&P.alive&&P.inv<=0&&P.drop<=0;
  // hands
  for(let i=0;i<2;i++){const h=FB.hands[i];
    if(FB.chain){const c=FB.chain,u=c.t;
      h.ty=c.ys[i]+Math.sin(u*c.sp*2.1+h.ph)*c.amp;
      h.tx=AW-230+Math.sin(u*.9+h.ph)*60}
    else if(FB.spray){h.tx=AW-300+Math.sin(FB.spray.t*1.2+h.ph)*150;
      h.ty=AH*.5+Math.cos(FB.spray.t*1.5+h.ph)*AH*.3}
    else{h.tx=AW-210;h.ty=i?AH*.68:AH*.24}
    h.x=damp(h.x,h.tx,4.6,dt);h.y=damp(h.y,h.ty,4.6,dt);
    if(live&&Math.abs(P.x-h.x)<FHW*.34&&Math.abs(P.y-h.y)<FHW*.3)hurt()}
  // ATTACK 1: the chains themselves
  if(FB.chain){const c=FB.chain;c.t+=dt;
    c.ext=clamp(c.t/.75,0,1);                                     // it reaches out over three quarters of a second
    for(let i=0;i<2;i++)c.tip[i]=FB.hands[i].x-(FB.hands[i].x+80)*easeOut3(c.ext);
    for(let i=0;i<2;i++){const h=FB.hands[i];if(P.x<h.x&&P.x>c.tip[i])flGraze(P.x,h.y,19)}
    if(live&&P.z<=.3)for(let i=0;i<2;i++){const h=FB.hands[i];        // a jump clears them
      if(P.x>c.tip[i]&&P.x<h.x&&Math.abs(P.y-h.y)<19+P.s*.3){hurt();break}}
    if(c.t>=c.dur)FB.chain=null}
  // ATTACK 2: volleys and the projectiles they leave behind
  if(FB.spray){const s=FB.spray;s.t+=dt;
    if(s.t>=s.n*s.gap+.5&&s.n*s.gap<s.dur-.6){flShoot(FB.hands[s.n%2]);s.n++}
    if(s.t>=s.dur)FB.spray=null}
  for(let i=FB.bul.length-1;i>=0;i--){const b=FB.bul[i];
    b.x+=b.vx*dt;b.y+=b.vy*dt;b.r+=b.vr*dt;b.l-=dt;
    if(b.l<=0||b.x<-120||b.x>AW+120||b.y<-120||b.y>AH+120){FB.bul.splice(i,1);continue}
    flGraze(b.x,b.y,b.s*.34);
    if(live&&Math.hypot(P.x-b.x,P.y-b.y)<b.s*.34+P.s*.3){hurt();FB.bul.splice(i,1)}}
}
function stepSlabs(dt){                 // runs whether he is here or not
  if(!FB.haz.length)return;
  const live=G.state==='play'&&P.alive&&P.inv<=0&&P.drop<=0;
  for(let i=FB.haz.length-1;i>=0;i--){const z=FB.haz[i];z.t+=dt;
    if(z.t>z.warn&&z.t<z.warn+z.live){
      if(!z.done){z.done=1;boomAt(z.x+z.w/2,z.y+z.h/2,1.4);shake(.3)}
      if(live&&P.x>z.x&&P.x<z.x+z.w&&P.y>z.y&&P.y<z.y+z.h){    // heavy: takes two shields
        if(U.shield>1){U.shield--;upsHud()}
        hurt()}}
    if(z.t>z.warn+z.live+.3)FB.haz.splice(i,1)}
}
/* --- draw -------------------------------------------------------------------------------- */
function flImg(k){return FB.rev?FI[k]:(FSIL[k]||FI[k])}

/* the room it brings with it: everything that is not the arena, not you and not it goes red */
function drawFloweyField(){
  if(!FB.on)return;
  const u=FB.rev?1:clamp(FB.t/1.6,0,1),p=.5+.5*Math.sin(clock*1.7);
  A(1);ctx.fillStyle=FB.rev?'#6b0206':'#2a0205';ctx.fillRect(-3000,-3000,8000,8000);
  ctx.globalCompositeOperation='lighter';
  A(.1+.12*p*u);ctx.fillStyle='#ff2a2a';ctx.fillRect(-3000,-3000,8000,8000);
  ctx.globalCompositeOperation='source-over';
  const g=ctx.createRadialGradient(AW/2,AH/2,AH*.3,AW/2,AH/2,AH*1.9);   // edges fall away to black
  g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.9)');
  A(1);ctx.fillStyle=g;ctx.fillRect(-3000,-3000,8000,8000);
  A(.9);ctx.strokeStyle='rgba(255,120,100,'+(.3+.3*p)+')';ctx.lineWidth=2;   // where the floor ends
  rr(-2,-2,AW+4,AH+4,27);ctx.stroke();A(1);
}
function drawFloweyBack(){                        // one hand sits behind the body, for depth
  if(!FB.on||FB.st==='gone')return;
  flPrep();
  const h=FB.hands[0],im=flImg(FB.spray?'handB':'handA');
  if(im&&im.width){const w=FHW,hh=w*(im.height/im.width);
    ctx.save();ctx.translate(h.x+FB.jx*1.6,h.y+FB.jy*1.6);ctx.scale(.86,.86);
    A(FB.rev?.8:1);ctx.drawImage(im,-w/2,-hh/2,w,hh);ctx.restore();A(1)}
  // chain from that hand, tiled to the left wall
  if(FB.chain)flDrawChain(h,.86,FB.chain.tip[0]);
}
function flDrawChain(h,sc,tip){
  const im=flImg('chain');if(!im||!im.width)return;
  const ch=36*sc,cw=ch*(im.width/im.height),y=h.y+FB.jy,x0=tip===undefined?-cw:tip;
  ctx.save();
  ctx.globalCompositeOperation='lighter';                  // the band is lethal, so it has to be read
  A(.42);ctx.drawImage(glowR,x0-30,y-52,h.x-x0+60,104);
  ctx.globalCompositeOperation='source-over';A(1);
  for(let x=h.x;x>x0;x-=cw*.94)ctx.drawImage(im,Math.max(x0,x-cw),y-ch/2,cw,ch);
  ctx.globalCompositeOperation='lighter';
  A(.45+.35*Math.sin(clock*9));ctx.strokeStyle='rgba(255,90,70,1)';ctx.lineWidth=2.2;
  ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(h.x,y);ctx.stroke();
  A(.8);ctx.fillStyle='rgba(255,210,190,1)';ctx.beginPath();ctx.arc(x0,y,6,0,TAU);ctx.fill();
  ctx.globalCompositeOperation='source-over';A(1);
  ctx.restore();
}

function drawSlabs(){
  if(!FB.haz.length)return;
  const im=FI.hazard;
  ctx.save();rr(0,0,AW,AH,26);ctx.clip();
  for(let i=0;i<FB.haz.length;i++){const z=FB.haz[i];if(z.t<0)continue;
    const on=z.t>z.warn&&z.t<z.warn+z.live,u=Math.min(1,z.t/z.warn);
    if(!on){A(.12+.3*u*(Math.sin(clock*22)>0?1:.4));ctx.fillStyle='#ff2a2a';
      ctx.fillRect(z.x,z.y,z.w,z.h);
      A(.5+.4*u);ctx.strokeStyle='rgba(255,70,60,1)';ctx.lineWidth=3;
      ctx.setLineDash([16,12]);ctx.strokeRect(z.x,z.y,z.w,z.h);ctx.setLineDash([])}
    else{A(1);if(im&&im.width)ctx.drawImage(im,z.x,z.y,z.w,z.h);
      else{ctx.fillStyle='#b00';ctx.fillRect(z.x,z.y,z.w,z.h)}
      A(.5+.5*Math.sin(clock*30));ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=3;
      ctx.strokeRect(z.x,z.y,z.w,z.h);A(1)}}
  A(1);ctx.restore();
}
function drawFlowey(){
  if(!FB.on||FB.st==='gone')return;
  flPrep();
  ctx.save();rr(0,0,AW,AH,26);ctx.clip();
  // the hazard slabs stay on the floor (drawSlabs covers them outside the fight)
  for(let i=0;i<FB.haz.length;i++){const z=FB.haz[i];if(z.t<0)continue;
    const on=z.t>z.warn&&z.t<z.warn+z.live,u=Math.min(1,z.t/z.warn);
    if(!on){A(.12+.3*u*(Math.sin(clock*22)>0?1:.4));ctx.fillStyle='#ff2a2a';
      ctx.fillRect(z.x,z.y,z.w,z.h);
      A(.5+.4*u);ctx.strokeStyle='rgba(255,70,60,1)';ctx.lineWidth=3;
      ctx.setLineDash([16,12]);ctx.strokeRect(z.x,z.y,z.w,z.h);ctx.setLineDash([])}
    else{const im=FI.hazard;
      A(1);if(im&&im.width)ctx.drawImage(im,z.x,z.y,z.w,z.h);
      else{ctx.fillStyle='#b00';ctx.fillRect(z.x,z.y,z.w,z.h)}
      A(.5+.5*Math.sin(clock*30));ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=3;
      ctx.strokeRect(z.x,z.y,z.w,z.h);A(1)}}
  ctx.restore();ctx.save();          // past here it is off the arena, so no clip
  // the body
  const im=flImg(FACES[FB.face%FACES.length]);
  if(im&&im.width){
    ctx.globalCompositeOperation='lighter';
    A(.3+.16*Math.sin(clock*2.4)+FB.hit*2);
    ctx.drawImage(glowR,FB.x-FBW*.82,FB.y-FBH*.95,FBW*1.64,FBH*1.9);
    ctx.globalCompositeOperation='source-over';A(1);
    ctx.save();ctx.translate(FB.x+FB.jx,FB.y+FB.jy);
    if(FB.hit>0){ctx.globalCompositeOperation='lighter'}
    A(1);ctx.drawImage(im,-FBW/2,-FBH/2,FBW,FBH);
    ctx.globalCompositeOperation='source-over';
    if(FB.hit>0||FB.faceF>0){A(Math.max(FB.hit*2.4,FB.faceF*.85));ctx.fillStyle='#fff';
      ctx.fillRect(-FBW/2,-FBH/2,FBW,FBH);A(1)}
    if(!FB.rev){A(.55+.35*Math.sin(clock*7));ctx.strokeStyle='rgba(190,20,24,1)';ctx.lineWidth=3;
      ctx.strokeRect(-FBW/2,-FBH/2,FBW,FBH);A(1)}                 // a rim, so the cut-out is a shape
    ctx.restore()}
  // the front hand, over the body
  const h=FB.hands[1],hm=flImg(FB.spray?'handB':'handA');
  if(hm&&hm.width){const w=FHW*1.1,hh=w*(hm.height/hm.width);
    ctx.save();ctx.translate(h.x+FB.jx*1.6,h.y+FB.jy*1.6);
    A(1);ctx.drawImage(hm,-w/2,-hh/2,w,hh);ctx.restore()}
  if(FB.chain)flDrawChain(h,1.1,FB.chain.tip[1]);
  // the projectiles
  const bi=FI.bullet;
  for(let i=0;i<FB.bul.length;i++){const b=FB.bul[i];
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.r);
    A(Math.min(1,b.l*2));
    if(bi&&bi.width)ctx.drawImage(bi,-b.s/2,-b.s/2,b.s,b.s);
    else{ctx.fillStyle='#fff';rr(-b.s/2,-b.s/2,b.s,b.s,6);ctx.fill()}
    ctx.restore();A(1)}
  for(let i=0;i<FB.wrn.length;i++){const w=FB.wrn[i],u=clamp(w.t/w.dur,0,1),
    R=FL.fw*w.s*.56;
    ctx.globalCompositeOperation='lighter';
    A(.25+.5*u);ctx.strokeStyle='rgba(255,170,60,1)';ctx.lineWidth=2+3*u;
    ctx.beginPath();ctx.arc(w.x,w.y,R*(1.9-.9*u),0,TAU);ctx.stroke();
    A(.3+.4*u);ctx.lineWidth=1.6;
    ctx.beginPath();ctx.arc(w.x,w.y,R,0,TAU);ctx.stroke();
    A(.2+.4*u);ctx.drawImage(glowR,w.x-R*1.5,w.y-R*1.5,R*3,R*3);
    ctx.globalCompositeOperation='source-over';A(1)}
  drawWipe();drawLaunch();drawScream();
  drawBombs();
  drawBoom();
  if(FB.flash>.01){A(FB.flash*.85);ctx.fillStyle='#fff';ctx.fillRect(0,0,AW,AH);A(1)}
  ctx.restore();
}
Object.assign(sfx,{
  flChain(){tone(74,.7,'sawtooth',.09,42);noise(.5,.2,500)},
  flBomb(){tone(190,.3,'triangle',.05,95);noise(.2,.1,800)},
  flWipe(){tone(88,.9,'sawtooth',.08,44);noise(.7,.18,600)},
  flSpray(){tone(300,.4,'square',.05,150);noise(.2,.12,1400)},
  flHaz(){tone(120,.6,'square',.07,60);noise(.4,.2,700)},
  flReveal(){noise(1.6,.5,260);tone(38,2.4,'sawtooth',.17,22);tone(110,1.4,'square',.08,55)}
});

/* ==================== 25-touch.js */
/* ================= TOUCH CONTROLS ================= */
// Left ~46% of the screen is a floating analog stick (it appears under your thumb wherever you
// press); the rest of the screen is fire — a big target rather than a small button, so the ring
// drawn at bottom right is only an affordance and never has to be hit exactly.
const touchEl=$('touch'),stickEl=$('stick'),nubEl=$('nub'),fireEl=$('fireb'),fireLb=$('firel'),dashBtn=$('dashb');
let tmv=-1,tfr=-1,tsx=0,tsy=0,tax=0,tay=0;
const SR=56,DEAD=.17;
function stickAt(x,y){stickEl.style.left=x+'px';stickEl.style.top=y+'px'}
function stickShow(x,y){stickAt(x,y);stickEl.classList.add('on');nubEl.style.transform='translate(-50%,-50%)'}
function stickHide(){stickEl.classList.remove('on');nubEl.style.transform='translate(-50%,-50%)';tax=tay=0}
function fireDown(d){tfr=d?tfr:-1;keys.f=d?1:0;fireEl.classList.toggle('dn',!!d)}
function touchStart(e){
  if(e.pointerType!=='touch')return false;
  if(e.target.closest&&e.target.closest('.btn,#btns,.ib'))return false;
  audio();
  if(G.state==='menu'){if(!SUB(scr))start();return true}
  if(G.state!=='play')return false;
  e.preventDefault();
  if(e.clientX<innerWidth*.46&&tmv<0){tmv=e.pointerId;tsx=e.clientX;tsy=e.clientY;stickShow(e.clientX,e.clientY)}
  else if(e.target&&e.target.closest&&e.target.closest('#dashb')){tryDash();dashBtn.classList.add('dn');setTimeout(()=>dashBtn.classList.remove('dn'),140)}
  else if(tfr<0){tfr=e.pointerId;fireDown(1)}
  return true;
}
function touchMove(e){
  if(e.pointerType!=='touch'||e.pointerId!==tmv)return;
  e.preventDefault();
  let dx=e.clientX-tsx,dy=e.clientY-tsy,d=Math.hypot(dx,dy);
  if(d>SR*1.7){const k=(d-SR*1.7)/d;tsx+=dx*k;tsy+=dy*k;stickAt(tsx,tsy);dx=e.clientX-tsx;dy=e.clientY-tsy;d=Math.hypot(dx,dy)}
  if(d<.001){tax=tay=0}
  else{const u=Math.min(1,d/SR),m=u<DEAD?0:(u-DEAD)/(1-DEAD);tax=dx/d*m;tay=dy/d*m}
  const nd=Math.min(d,SR);
  nubEl.style.transform='translate(-50%,-50%) translate('+(d?dx/d*nd:0).toFixed(1)+'px,'+(d?dy/d*nd:0).toFixed(1)+'px)';
}
function touchEnd(e){
  if(e.pointerType!=='touch')return;
  if(e.pointerId===tmv){tmv=-1;stickHide()}
  else if(e.pointerId===tfr)fireDown(0);
}
function touchClear(){tmv=-1;fireDown(0);stickHide()}
if(TOUCH){
  addEventListener('pointerdown',touchStart,{passive:false});
  addEventListener('pointermove',touchMove,{passive:false});
  addEventListener('pointerup',touchEnd);
  addEventListener('pointercancel',touchEnd);
  document.body.classList.add('touch');
  addEventListener('contextmenu',e=>{if(e.target===cv||e.target===touchEl)e.preventDefault()});
}

/* ==================== 26-install.js */
/* ================= INSTALL (progressive web app) ================= */
// Served over http(s) next to manifest.webmanifest + sw.js, the game can be installed to a phone
// home screen and then runs offline. Opened as a bare file these registrations fail harmlessly.
let instEvt=null;
const instB=$('installb'),iosEl=$('ios');
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function showInstall(){if(!standalone){instB.classList.remove('hid');if(scr==='menu')focusBtn()}}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();instEvt=e;showInstall()});
addEventListener('appinstalled',()=>{instEvt=null;instB.classList.add('hid');iosEl.classList.remove('on')});
if(isIOS&&TOUCH&&!standalone)showInstall();
async function doInstall(){
  if(instEvt){const d=instEvt;instEvt=null;d.prompt();try{const r=await d.userChoice;if(r.outcome==='accepted')instB.classList.add('hid')}catch(e){}return}
  iosEl.classList.add('on');
}
iosEl.addEventListener('click',()=>iosEl.classList.remove('on'));
if('serviceWorker'in navigator&&/^https?:$/.test(location.protocol))
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

/* ==================== 27-bridge.js */
/* ================= THE GRAVITY BRIDGE (one-time encounter) ================= */
// Runs as the 'bridge' super event, drawn as a flat 2D side elevation: the deck is a surface you
// stand ON, the towers and cables rise above it, the void falls away below. A crushing downforce
// pins you to the deck and makes you heavy; a gale blows right-to-left, back toward where you
// started. No jumping, no shooting -- the fire key is the Quick Embrace input, and stamina is the
// only way to die here.
//
// Modular on purpose: everything lives behind BR.* and the five entry points
// (startBridge / stepBridge / drawBridge / drawBridgeFore / drawPlayerEnergy).
const glowG=glow('96,255,150'),glowA=glow('255,176,86');       // energy green, and the warm haze behind it
const DKY=AH*.62,DKH=92,TOWH=232,SPAN=620;                      // deck surface, slab depth, tower height, bay width
const BSEC=[   // wind, gravity, energy, name
  {w:1.10,g:1.10,e:.55,n:'The span forms'},
  {w:1.42,g:1.42,e:.70,n:'Heavier'},
  {w:1.70,g:1.68,e:.85,n:'Unstable'},
  {w:1.90,g:1.88,e:1.00,n:'It will not hold'},
  {w:2.02,g:2.02,e:1.20,n:'The far side'}
];
const BSEG=[0,.2,.4,.6,.85,1.01];                               // prog boundaries for those five
const QEAT=[.09,.19,.29,.39,.49,.59,.69,.78,.87,.95];           // where a Quick Embrace is waiting
const WSPD=132,HVY=.17,PRATE=.034;                              // wind drift, weight drag, crossing rate
const KILLX=26,WARNX=260;                                       // the left edge pulverises you; the warning band before it
const FOOT=()=>DKY-P.s/2;                                       // the player's feet rest on the deck
const BR={on:false,st:'gone',t:0,prog:0,stam:100,sect:-1,w:1,g:1,en:.55,
  gust:0,gustT:3,qe:null,qi:0,low:0,flash:0,push:0,off:0,danger:0,wrn:0,cx0:0,bob:0,
  dust:[],deb:[],rib:[],trail:[],wake:[],vine:[],wacc:0,hum:null,wind:null,pf:false};
for(let i=0;i<72;i++)BR.dust.push({x:rnd(0,AW),y:rnd(0,AH),z:rnd(.3,1),s:rnd(1,3)});
for(let i=0;i<24;i++)BR.deb.push({x:rnd(0,AW),y:rnd(0,DKY),vy:0,r:rnd(0,TAU),vr:rnd(-2,2),s:rnd(5,15),z:rnd(.45,1)});
for(let i=0;i<110;i++)BR.wake.push({on:0,x:0,y:0,vx:0,vy:0,l:0,m:1,s:2});
for(let i=0;i<14;i++)BR.trail.push({x:0,y:0,l:0});

/* --- procedural ambience: a wind bed and a gravity drone, both through the master gain --- */
function noiseBuf(sec){const n=AC.sampleRate*sec|0,b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);
  let v=0;for(let i=0;i<n;i++){v=(v*.94)+(Math.random()*2-1)*.06;d[i]=v*3.2}
  const f=(AC.sampleRate*.25)|0;for(let i=0;i<f;i++){const k=i/f;d[i]=d[i]*k+d[n-f+i]*(1-k)}   // seam blend
  return b}
function bridgeAudioStart(){
  if(!AC||BR.wind)return;
  try{
    const s=AC.createBufferSource(),bp=AC.createBiquadFilter(),g=AC.createGain();
    s.buffer=noiseBuf(3);s.loop=true;bp.type='bandpass';bp.frequency.value=620;bp.Q.value=.6;
    g.gain.value=0;s.connect(bp);bp.connect(g);g.connect(sfxG||master);s.start();
    BR.wind={s,g,f:bp};
    const o=AC.createOscillator(),o2=AC.createOscillator(),g2=AC.createGain();
    o.type='sine';o.frequency.value=34;o2.type='sine';o2.frequency.value=51;
    g2.gain.value=0;o.connect(g2);o2.connect(g2);g2.connect(sfxG||master);o.start();o2.start();
    BR.hum={s:o,s2:o2,g:g2};
  }catch(e){}
}
function bridgeAudioStop(){
  if(BR.wind){try{BR.wind.g.gain.cancelScheduledValues(AC.currentTime);BR.wind.g.gain.linearRampToValueAtTime(0,AC.currentTime+.5);BR.wind.s.stop(AC.currentTime+.6)}catch(e){}BR.wind=null}
  if(BR.hum){try{BR.hum.g.gain.cancelScheduledValues(AC.currentTime);BR.hum.g.gain.linearRampToValueAtTime(0,AC.currentTime+.5);BR.hum.s.stop(AC.currentTime+.6);BR.hum.s2.stop(AC.currentTime+.6)}catch(e){}BR.hum=null}
}
function bridgeAudioLevel(wind,grav){
  if(BR.wind){BR.wind.g.gain.value=wind*.07;BR.wind.f.frequency.value=480+wind*340}
  if(BR.hum)BR.hum.g.gain.value=grav*.05;
}

/* --- lifecycle --- */
function startBridge(){
  G.bForce=false;BR.on=true;BR.t=0;BR.prog=0;BR.stam=100;BR.sect=-1;BR.qe=null;BR.qi=0;
  BR.gust=0;BR.gustT=4;BR.low=0;BR.flash=0;BR.push=0;BR.off=0;BR.danger=0;BR.wrn=0;BR.bob=0;BR.w=1;BR.g=1;BR.en=0;
  for(let i=0;i<BR.trail.length;i++)BR.trail[i].l=0;
  BR.rib.length=0;for(let i=0;i<16;i++)BR.rib.push({p:i/16,on:0});
  BR.vine.length=0;BR.wacc=0;
  for(let i=0;i<18;i++){                                          // creep in from above and below, never across the walkway
    const top=i%2===0,lim=top?DKY-66:DKY+DKH+28,pts=[];
    let x=rnd(-40,AW+40),y=top?-24:AH+24,ang=top?Math.PI/2:-Math.PI/2;
    for(let k=0;k<11;k++){
      ang+=rnd(-.52,.52);const st=rnd(24,46);
      x+=Math.cos(ang)*st;y+=Math.sin(ang)*st;
      if(top?y>lim:y<lim)break;
      pts.push([x,y]);}
    if(pts.length>2)BR.vine.push({pts,w:rnd(1.6,3.8),ph:rnd(0,TAU),nodes:[rnd(.35,.7),rnd(.7,.95)]});}
  for(let i=0;i<BR.wake.length;i++)BR.wake[i].on=0;
  BR.st='intro';P.inv=99;P.z=0;P.jt=0;                              // nothing else can touch the player here
  Object.assign(P,{x:AW*.36,y:FOOT(),vx:0,vy:0});
  stamHud(true);feedShow(true);bridgeAudioStart();
  toast('The Gravity Bridge','Cross it');nameplate(true,'The Gravity Bridge',false);   // nothing here to damage, so no bar
  shake(.5);G.fl=Math.max(G.fl,.2);G.fc=0;slow(.5,.3);sfx.bform();
}
function bridgeEnd(){
  BR.on=false;BR.st='gone';P.inv=0;G.bridgeDone=true;ach('bridges');
  if(SET.hard)ach('fHardBridge');
  achCheck();
  stamHud(false);feedShow(false);bridgeAudioStop();nameplate(false);endEv();
  bankOffer('The Gravity Bridge',null);
}
function bridgeAbort(){   // the run ended some other way
  if(!BR.on)return;BR.on=false;BR.st='gone';P.inv=0;
  stamHud(false);feedShow(false);bridgeAudioStop();nameplate(false);
}
function bridgeReset(){
  BR.on=false;BR.st='gone';BR.prog=0;BR.stam=100;BR.qe=null;
  stamHud(false);feedShow(false);bridgeAudioStop();G.bridgeDone=false;G.bForce=false;
}

/* --- Quick Embrace: a ring collapses onto a target band, hit FIRE inside it --- */
function qeStart(){BR.qe={t:0,dur:lerp(1.45,1.08,BR.prog),res:0,ht:0};sfx.qecall();G.fl=Math.max(G.fl,.05);G.fc=0}
function qeResolve(ok){
  const q=BR.qe;q.res=ok?1:-1;q.ht=0;
  if(ok){BR.stam=Math.min(100,BR.stam+21);BR.flash=Math.max(BR.flash,.5);shake(.3);slow(.16,.38);
    for(let i=0;i<34;i++){const a=i/34*TAU;emit(P.x,P.y,Math.cos(a)*420,Math.sin(a)*420,.7,3.4,2,3.2)}
    popText(P.x,P.y-48,'+21','#8dffa0',27);sfx.qeok()}
  else{BR.stam=Math.max(0,BR.stam-9);BR.gust=1.25;shake(.26);
    burst(P.x,P.y,14,260,.5,3,1,3);popText(P.x,P.y-44,'-9','#ff6a66',22);sfx.qebad()}
}
function stepQE(dt){
  const q=BR.qe;if(!q)return;
  if(q.res){q.ht+=dt;if(q.ht>.55)BR.qe=null;return}
  q.t+=dt;
  const r=1-q.t/q.dur;
  if(keys.f&&!BR.pf)qeResolve(r<.34&&r>.04);                      // a much tighter target band
  else if(q.t>=q.dur)qeResolve(false);
}

/* --- the crossing --- */
function stepBridge(dt){
  if(!BR.on)return;
  BR.t+=dt;
  const sect=Math.max(0,BSEG.findIndex((v,i)=>BR.prog>=v&&BR.prog<BSEG[i+1]));
  if(BR.st==='cross'&&sect!==BR.sect){BR.sect=sect;const S=BSEC[sect];
    if(sect>0){toast('Section '+(sect+1),S.n);shake(.3);G.fl=Math.max(G.fl,.08);G.fc=0;sfx.bsect();
      BR.stam=Math.min(100,BR.stam+11);popText(P.x,P.y-62,'+11','#8dffa0',20)}}
  const S=BSEC[BR.sect<0?0:BR.sect];
  const ramp=BR.st==='intro'?clamp((BR.t-1.6)/1.4,0,1):BR.st==='cross'?1:BR.st==='win'?Math.max(0,1-BR.t/.9):1;
  BR.w=S.w*ramp*(1+BR.gust*.26);BR.g=S.g*ramp;BR.en=S.e*(BR.st==='intro'?clamp(BR.t/2.2,0,1):1);
  bridgeAudioLevel(BR.w,BR.g);
  if(BR.gust>0)BR.gust=Math.max(0,BR.gust-dt*.8);

  switch(BR.st){
  case 'intro':{   // the span assembles bay by bay out of the void, then hands over control
    const u=clamp(BR.t/2.6,0,1);
    for(let i=0;i<BR.rib.length;i++)BR.rib[i].on=clamp((u*1.5-Math.abs(BR.rib[i].p-.5)*1.3)*3,0,1);
    G.tr=Math.max(G.tr,.1+.22*(1-u));
    P.y=FOOT();P.vy=0;
    if(BR.t>1.1&&BR.t<1.2){shake(.45);G.fl=Math.max(G.fl,.16);G.fc=0;sfx.bsnap()}
    if(BR.t>=3.1){BR.st='cross';BR.sect=-1;BR.flash=.5;shake(.35);sfx.bgo()}
    break}
  case 'cross':{
    // side view: you are standing ON the deck, so the fight is purely horizontal. Gravity does not
    // drop you off anything -- it makes you heavy, dragging at whatever speed you build up.
    P.y=FOOT();P.vy=0;
    P.x-=BR.w*WSPD*dt;                                            // the gale, pushing you back
    P.x-=P.vx*HVY*(BR.g-1)*dt;                                    // the weight, resisting every move
    P.x=Math.min(P.x,AW-46);
    BR.danger=P.x<WARNX?clamp((WARNX-P.x)/(WARNX-KILLX),0,1):0;
    if(BR.danger>.35){BR.wrn+=dt;if(BR.wrn>.28-.18*BR.danger){BR.wrn=0;sfx.edge(BR.danger)}}else BR.wrn=0;
    if(P.x<=KILLX){BR.st='crush';BR.t=0;BR.cx0=P.x;BR.qe=null;
      shake(1);G.fl=Math.max(G.fl,.45);G.fc=0;slow(1.1,.18);sfx.crush();
      for(let i=0;i<60;i++){const a=rnd(-1.5,1.5);
        emit(P.x,P.y+rnd(-16,16),-rnd(300,1100),Math.sin(a)*rnd(60,340),rnd(.5,1.1),rnd(2.6,5),0,1.4)}
      break}
    BR.bob=damp(BR.bob,BR.g-1,5,dt);
    // progress: ground is only gained to the right of the line, and lost when you are driven back
    BR.push=clamp((P.x-AW*.30)/(AW*.34),-1,1);
    BR.prog=clamp(BR.prog+(BR.push>0?BR.push*PRATE:BR.push*PRATE*.55)*dt,0,1);
    BR.off=P.x<AW*.19?clamp((AW*.19-P.x)/(AW*.14),0,1):0;         // pinned against the upwind end
    // stamina
    let drain=lerp(3.6,5.6,BR.prog)+(keys.r||(tmv>=0&&tax>.25)?2.4:0)+BR.danger*3;
    if(!keys.r&&tax<=.25&&BR.danger<.05)drain-=6.4;               // easing off recovers, but the wind takes ground back
    BR.stam=clamp(BR.stam-drain*dt,0,100);
    if(BR.stam<28){BR.low+=dt;if(BR.low>.75){BR.low=0;sfx.stamlow()}}else BR.low=0;
    if(!BR.qe&&BR.qi<QEAT.length&&BR.prog>=QEAT[BR.qi]){BR.qi++;qeStart()}
    stepQE(dt);
    G.tr=Math.max(G.tr,.06+.12*BR.g*(1+BR.gust));
    if(BR.gustT-=dt,BR.gustT<=0){BR.gustT=lerp(5.4,3.4,BR.prog);BR.gust=1.1;sfx.gust();shake(.3);BR.flash=Math.max(BR.flash,.14)}
    if(BR.stam<=0){BR.st='fail';BR.t=0;shake(.8);G.fl=Math.max(G.fl,.3);G.fc=0;slow(1,.22);sfx.bfail()}
    else if(BR.prog>=1){BR.st='win';BR.t=0;BR.qe=null;shake(.7);BR.flash=1;slow(.8,.3);sfx.bwin()}
    break}
  case 'win':{     // gravity lets go, the wind dies, the span lights end to end
    const u=clamp(BR.t/2.8,0,1);
    P.y=FOOT();P.vy=0;P.x+=260*dt*(1-u);
    if(BR.t<.1)for(let i=0;i<70;i++){const a=rnd(0,TAU),v=rnd(260,760);emit(P.x,P.y,Math.cos(a)*v,Math.sin(a)*v,1.1,4,2,1.6)}
    if(BR.t>1.5&&BR.t<1.56){G.fl=Math.max(G.fl,.5);G.fc=0;shake(.4)}
    if(u>=1){bridgeEnd();return}
    break}
  case 'crush':{   // dragged into the edge and pulverised
    const u=clamp(BR.t/1.15,0,1);
    P.x=lerp(BR.cx0,-40,easeIn3(u));P.y=FOOT();P.vx=P.vy=0;
    P.qx=-.55*u;P.qy=.7*u;P.qxv=P.qyv=0;                          // squeezed to nothing
    G.tr=Math.max(G.tr,.45+.55*u);
    if(Math.random()<.9)emit(P.x+rnd(-10,10),P.y+rnd(-18,18),-rnd(400,1300),rnd(-200,200),rnd(.3,.8),rnd(2,4.6),0,1.2);
    if(u>=1){bridgeAbort();die();return}
    break}
  default:{        // fail: the energy implodes and the weight finishes the job
    const u=clamp(BR.t/1.5,0,1);
    P.y=FOOT()+10*u;P.vy=0;P.qx=.34*u;P.qy=-.5*u;P.qxv=P.qyv=0;
    G.tr=Math.max(G.tr,.3+.4*u);
    if(BR.t<.08)for(let i=0;i<46;i++){const a=rnd(0,TAU),q=rnd(90,220);emit(P.x+Math.cos(a)*q,P.y+Math.sin(a)*q,-Math.cos(a)*q*3.4,-Math.sin(a)*q*3.4,.55,3.4,2,1.2)}
    if(u>=1){bridgeAbort();die();return}
    break}
  }
  BR.pf=!!keys.f;
  BR.flash=Math.max(0,BR.flash-dt*2.2);
  if(BR.st==='cross'||BR.st==='win'){                              // white wake torn off backwards by the gale
    BR.wacc+=dt*(52+BR.w*34);
    while(BR.wacc>=1){BR.wacc--;
      for(let i=0;i<BR.wake.length;i++){const w=BR.wake[i];if(w.on)continue;
        w.on=1;w.x=P.x+rnd(-11,11);w.y=P.y+rnd(-13,13);
        w.vx=-(210+BR.w*280)-rnd(0,170);w.vy=rnd(-34,34);
        w.l=w.m=rnd(.42,.85);w.s=rnd(1.2,2.8);break}}}
  for(let i=0;i<BR.wake.length;i++){const w=BR.wake[i];if(!w.on)continue;
    w.l-=dt;if(w.l<=0){w.on=0;continue}
    w.x+=w.vx*dt;w.y+=w.vy*dt;w.vy*=.985;
    if(w.x<-70)w.on=0}
  // motes and debris blown down the span, and pressed toward the deck
  for(let i=0;i<BR.dust.length;i++){const d=BR.dust[i];
    d.x-=(140+BR.w*250)*d.z*dt;d.y+=BR.g*30*d.z*dt;
    if(d.x<-20){d.x=AW+20;d.y=rnd(0,DKY)}if(d.y>DKY+DKH)d.y=-20}
  for(let i=0;i<BR.deb.length;i++){const b=BR.deb[i];
    b.x-=(90+BR.w*320)*b.z*dt;b.vy=Math.min(b.vy+BR.g*170*dt,BR.g*200);b.y+=b.vy*dt;b.r+=b.vr*dt;
    if(b.y>DKY-b.s*.5*b.z&&b.y<DKY+26){b.y=DKY-b.s*.5*b.z;b.vy=-b.vy*.22;b.vr*=.6}   // bounces along the deck
    if(b.x<-40||b.y>AH+40){b.x=AW+rnd(10,140);b.y=rnd(-40,DKY*.6);b.vy=0;b.vr=rnd(-2,2)}}
  stamHud();
}

/* --- drawing: a plain platform under an aurora sky. The sky carries a little green from the
   start and swings further into it the closer the far side gets; past two thirds, vines creep in
   around the frame. The player keeps no green of their own -- just a white wake tearing off to
   the left in the gale. --- */
const mixc=(a,b,t)=>{   // lerp two '#rrggbb' values
  const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16),
    r=Math.round(((pa>>16)&255)+((((pb>>16)&255)-((pa>>16)&255))*t)),
    g=Math.round(((pa>>8)&255)+((((pb>>8)&255)-((pa>>8)&255))*t)),
    l=Math.round((pa&255)+(((pb&255)-(pa&255))*t));
  return 'rgb('+r+','+g+','+l+')';
};
const SKYA=['#2a1a0b','#6b4418','#bc843e','#8a5a26','#120b05'];   // amber at the start
const SKYG=['#06170f','#0f4b2d','#43c982','#1b6b44','#031009'];   // green by the far side
const greenAmt=()=>Math.pow(clamp(BR.prog,0,1),1.35);             // held back early, strong late
const vineAmt=()=>clamp((BR.prog-.62)/.33,0,1);

function drawAurora(amt){   // soft curtains rippling across the upper sky
  if(amt<=0)return;
  ctx.globalCompositeOperation='lighter';
  for(let b=0;b<4;b++){
    const ph=clock*(.22+b*.06)+b*2.3,drift=(clock*(9+b*5))%(AW+300);
    for(let i=0;i<46;i++){
      const u=i/46,x=((u*(AW+300)+drift)%(AW+300))-150;
      const wob=Math.sin(u*9+ph)*30+Math.sin(u*21-ph*1.6)*13,
        top=28+b*34+wob,
        h=(110+70*Math.sin(u*6+ph*1.4))*(1+b*.22),
        a=amt*(.075+.065*Math.sin(u*13+ph*2.2))*(1-b*.14);
      if(a<=.002)continue;
      const g=ctx.createLinearGradient(0,top,0,top+h);
      g.addColorStop(0,'rgba(120,255,175,0)');
      g.addColorStop(.35,'rgba(108,255,168,'+a.toFixed(4)+')');
      g.addColorStop(.72,'rgba(96,240,190,'+(a*.6).toFixed(4)+')');
      g.addColorStop(1,'rgba(90,255,210,0)');
      ctx.fillStyle=g;ctx.fillRect(x,top,(AW+300)/46+1.5,h);
    }
  }
  ctx.globalCompositeOperation='source-over';
}
function drawVines(amt){   // tendrils creeping in around the edges as the far side nears
  if(amt<=0||!BR.vine.length)return;
  ctx.globalCompositeOperation='lighter';
  ctx.lineCap='round';
  for(let i=0;i<BR.vine.length;i++){
    const v=BR.vine[i],n=Math.max(2,Math.round(v.pts.length*amt));
    ctx.strokeStyle='rgba(110,255,170,'+(.2+.45*amt).toFixed(3)+')';ctx.lineWidth=v.w;
    ctx.beginPath();
    for(let k=0;k<n;k++){const p=v.pts[k],sw=Math.sin(clock*1.1+v.ph+k*.42)*(2.4+k*.22);
      k?ctx.lineTo(p[0]+sw,p[1]):ctx.moveTo(p[0]+sw,p[1])}
    ctx.stroke();
    ctx.strokeStyle='rgba(225,255,238,'+(.12+.26*amt).toFixed(3)+')';ctx.lineWidth=v.w*.4;
    ctx.beginPath();
    for(let k=0;k<n;k++){const p=v.pts[k],sw=Math.sin(clock*1.1+v.ph+k*.42)*(2.4+k*.22);
      k?ctx.lineTo(p[0]+sw,p[1]):ctx.moveTo(p[0]+sw,p[1])}
    ctx.stroke();
    for(let j=0;j<v.nodes.length;j++){   // buds along the length
      const f=v.nodes[j],k=Math.floor(f*(n-1));if(k<1)continue;
      const p=v.pts[k],sw=Math.sin(clock*1.1+v.ph+k*.42)*(2.4+k*.22),
        r=(2+1.4*Math.sin(clock*2.4+v.ph+j))*(.5+.5*amt);
      ctx.fillStyle='rgba(180,255,210,'+(.35+.4*amt).toFixed(3)+')';
      ctx.beginPath();ctx.arc(p[0]+sw,p[1],r,0,TAU);ctx.fill();
      A(.22*amt);ctx.drawImage(glowG,p[0]+sw-22,p[1]-22,44,44);A(1);
    }
  }
  ctx.globalCompositeOperation='source-over';
}
function drawBridge(){
  const en=BR.en,sc=BR.prog*3400,DB=DKY+DKH,gr=greenAmt();
  const asm=BR.st==='intro'?clamp((BR.t-.5)/1.9,0,1):1;            // the platform lays itself out from the middle
  ctx.save();rr(0,0,AW,AH,26);ctx.clip();
  // sky, swinging from amber toward green as the far side gets closer
  let g=ctx.createLinearGradient(0,0,0,AH);
  g.addColorStop(0,mixc(SKYA[0],SKYG[0],gr));g.addColorStop(.32,mixc(SKYA[1],SKYG[1],gr));
  g.addColorStop(.58,mixc(SKYA[2],SKYG[2],gr));g.addColorStop(.63,mixc(SKYA[3],SKYG[3],gr));
  g.addColorStop(1,mixc(SKYA[4],SKYG[4],gr));
  A(1);ctx.fillStyle=g;ctx.fillRect(0,0,AW,AH);
  drawAurora(.95+1.25*gr);                                         // present from the first step, dominant by the end
  ctx.globalCompositeOperation='lighter';
  for(let k=0;k<6;k++){const r=250+110*Math.sin(clock*.33+k*1.2),
    x=AW*(.5+.54*Math.sin(clock*.12+k*2.3))-r,y=DKY*(.45+.3*Math.cos(clock*.1+k*1.5))-r;
    A((.1+.05*Math.sin(clock*.8+k))*(1-gr));ctx.drawImage(glowA,x,y,r*2,r*2);
    A((.1+.05*Math.sin(clock*.8+k))*gr);ctx.drawImage(glowG,x,y,r*2,r*2)}
  ctx.globalCompositeOperation='source-over';A(1);   // the haze loop leaves alpha low; the slab must be opaque
  drawVines(vineAmt());
  if(asm<=0){ctx.restore();return}
  const hw=AW*.5*asm,x0=AW*.5-hw,x1=AW*.5+hw;                      // it grows out from the centre during the intro
  // the slab itself
  g=ctx.createLinearGradient(0,DKY,0,DB);
  g.addColorStop(0,mixc('#2a1c14','#13261b',gr));g.addColorStop(.14,mixc('#0c0806','#060f0a',gr));
  g.addColorStop(1,'#040202');
  ctx.fillStyle=g;ctx.fillRect(x0,DKY,hw*2,DKH);
  // plating seams sliding past, so the ground you are covering is visible
  ctx.save();ctx.beginPath();ctx.rect(x0,DKY,hw*2,DKH);ctx.clip();
  ctx.strokeStyle=mixc('#e4aa62','#8fe8b4',gr);A(.13);ctx.lineWidth=1.4;ctx.beginPath();
  for(let x=-((sc*.8)%92);x<AW+92;x+=92){ctx.moveTo(x,DKY);ctx.lineTo(x,DB)}
  ctx.stroke();A(.07);ctx.lineWidth=1;ctx.beginPath();
  ctx.moveTo(0,DKY+DKH*.55);ctx.lineTo(AW,DKY+DKH*.55);ctx.stroke();
  ctx.restore();A(1);
  // the lit surface you walk on
  ctx.strokeStyle=mixc('#ffe0ac','#cdffe2',gr);ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(x0,DKY);ctx.lineTo(x1,DKY);ctx.stroke();
  ctx.strokeStyle=mixc('#784a20','#2c6b47',gr);ctx.lineWidth=2;    // shadowed lip just under it
  ctx.beginPath();ctx.moveTo(x0,DKY+3);ctx.lineTo(x1,DKY+3);ctx.stroke();
  ctx.globalCompositeOperation='lighter';
  A(.22*asm*(1-gr));ctx.drawImage(glowA,x0-40,DKY-46,hw*2+80,62);
  A(.22*asm*gr);ctx.drawImage(glowG,x0-40,DKY-46,hw*2+80,62);
  ctx.globalCompositeOperation='source-over';A(1);
  // energy seam running its length
  ctx.strokeStyle='rgba(150,255,195,'+(.3+.5*en)+')';ctx.lineWidth=2.2;
  ctx.beginPath();ctx.moveTo(x0,DKY+12);ctx.lineTo(x1,DKY+12);ctx.stroke();
  // bottom edge, then the drop
  ctx.strokeStyle='rgba(10,7,4,.9)';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x0,DB);ctx.lineTo(x1,DB);ctx.stroke();
  const vd=ctx.createLinearGradient(0,DB,0,AH);
  vd.addColorStop(0,'rgba(6,4,2,.85)');vd.addColorStop(.45,'rgba(6,4,2,.92)');vd.addColorStop(1,'rgba(4,2,1,.98)');
  A(1);ctx.fillStyle=vd;ctx.fillRect(0,DB,AW,AH-DB);
  ctx.restore();
}
/* --- drawing: wind, debris and the far side, over the top of the player --- */
function drawBridgeFore(){
  const DB=DKY+DKH,gr=greenAmt();
  const cFar=mixc('#ffb060','#7dffb4',gr),cNear=mixc('#ffdcaa','#c8ffdd',gr);
  ctx.save();rr(0,0,AW,AH,26);ctx.clip();
  // the left edge: a grinding wall. Reach it and you are pulverised, so it is drawn loud.
  if(BR.on){
    const dz=BR.danger||0,ww=KILLX+22;
    ctx.globalCompositeOperation='source-over';
    const gw=ctx.createLinearGradient(0,0,ww+96,0);
    gw.addColorStop(0,'rgba(0,0,0,.96)');gw.addColorStop(.5,'rgba(12,3,3,.74)');gw.addColorStop(1,'rgba(0,0,0,0)');
    A(1);ctx.fillStyle=gw;ctx.fillRect(0,0,ww+96,AH);
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<26;i++){const sd=i*53.7,
      q=((clock*(1.5+((sd*.011)%1))+((sd*.017)%1))%1),
      y=((sd*.031)%1)*AH,h=10+42*((sd*.007)%1);
      A((.22+.55*dz)*Math.sin(q*Math.PI));
      ctx.fillStyle=dz>.5?'rgba(255,130,95,1)':'rgba(190,255,215,1)';
      ctx.fillRect(q*ww*1.15-8,y,3+7*q,h)}
    A(.26+.5*dz);ctx.drawImage(glowG,-130,AH/2-270,260,540);
    if(dz>.02){A(dz*.6);ctx.drawImage(glowR,-170,AH/2-330,340,660);
      ctx.strokeStyle='rgba(255,90,70,'+(dz*(.5+.5*Math.sin(clock*14))).toFixed(3)+')';ctx.lineWidth=3+5*dz;
      ctx.beginPath();ctx.moveTo(KILLX,0);ctx.lineTo(KILLX,AH);ctx.stroke()}
    ctx.globalCompositeOperation='source-over';A(1);
  }
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<BR.deb.length;i++){const b=BR.deb[i],s=b.s*b.z;
    A(.14+.3*b.z);ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.r);
    ctx.fillStyle=mixc('#603c1c','#2b5c3e',gr);ctx.fillRect(-s/2,-s/2,s,s);
    ctx.strokeStyle=cNear;ctx.lineWidth=1.1;ctx.strokeRect(-s/2,-s/2,s,s);ctx.restore()}
  // the gale: long streaks running right to left across the whole frame
  const n=30+(BR.w*26|0);
  for(let i=0;i<n;i++){
    const sd=i*127.1,q=((clock*(.46+BR.w*.54)+((sd*.0137)%1))%1),
      y=((sd*.0391)%1)*AH,x=AW+180-q*(AW+360),
      L=90+BR.w*165*(.4+((sd*.0071)%1)),near=Math.abs(y-DKY)<70;
    if(y>DKY&&y<DB)continue;
    A((.07+.26*BR.w)*Math.sin(q*Math.PI)*(.45+.55*((sd*.0213)%1))*(near?.75:1));
    ctx.strokeStyle=near?cNear:cFar;
    ctx.lineWidth=.9+1.6*((sd*.0053)%1);
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+L,y+BR.g*3);ctx.stroke()}
  for(let i=0;i<BR.dust.length;i++){const d=BR.dust[i];
    if(d.y>DKY&&d.y<DB)continue;
    A(.12+.4*d.z);ctx.fillStyle=cFar;ctx.fillRect(d.x,d.y,d.s*d.z*2.4,d.s*d.z)}
  // the player's wake: white, torn off backwards down the span
  for(let i=0;i<BR.wake.length;i++){const w=BR.wake[i];if(!w.on)continue;
    const t=w.l/w.m,L=Math.min(58,Math.abs(w.vx)*.055);
    A(t*t);ctx.strokeStyle='rgba(255,255,255,1)';ctx.lineWidth=w.s*(.4+.6*t);
    ctx.beginPath();ctx.moveTo(w.x,w.y);ctx.lineTo(w.x+L,w.y);ctx.stroke()}
  ctx.globalCompositeOperation='source-over';A(1);
  ctx.restore();
  // the far side, once it comes into view
  if(BR.prog>.84&&BR.st!=='fail'){
    const u=(BR.prog-.84)/.16,x=AW-20-u*70;
    ctx.save();rr(0,0,AW,AH,26);ctx.clip();ctx.globalCompositeOperation='lighter';
    A(.16+.38*u);ctx.drawImage(glowG,x-200,DKY-320,400,500);
    ctx.strokeStyle='rgba(210,255,228,'+(.45+.5*u)+')';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(x,60);ctx.lineTo(x,DB+50);ctx.stroke();
    ctx.globalCompositeOperation='source-over';A(1);ctx.restore()}
  // quick embrace ring, drawn last so it is never buried
  const q=BR.qe;
  if(q){
    const r0=112,rt=r0*.30,rb=r0*.07;
    ctx.save();ctx.globalCompositeOperation='lighter';
    if(!q.res){
      const r=1-q.t/q.dur,cr=r0*r;
      ctx.strokeStyle='rgba(150,255,185,.9)';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(P.x,P.y,rt,0,TAU);ctx.stroke();
      A(.35);ctx.lineWidth=rt-rb;ctx.strokeStyle='rgba(120,255,170,.5)';
      ctx.beginPath();ctx.arc(P.x,P.y,(rt+rb)/2,0,TAU);ctx.stroke();
      A(1);ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=3.4;
      ctx.beginPath();ctx.arc(P.x,P.y,cr,0,TAU);ctx.stroke();
      A(.5);ctx.drawImage(glowG,P.x-cr-30,P.y-cr-30,(cr+30)*2,(cr+30)*2);
      ctx.globalCompositeOperation='source-over';A(1);
      ctx.font='700 17px '+FF;ctx.textAlign='center';ctx.fillStyle='#ffffff';
      ctx.fillText(TOUCH?'TAP':'SPACE',P.x,P.y-r0-18);
    }else{
      const u=q.ht/.55;A(1-u);
      ctx.strokeStyle=q.res>0?'rgba(170,255,200,1)':'rgba(255,120,80,1)';ctx.lineWidth=5*(1-u);
      ctx.beginPath();ctx.arc(P.x,P.y,rt+u*110,0,TAU);ctx.stroke();
      ctx.globalCompositeOperation='source-over';A(1)}
    ctx.restore()}
  if(BR.danger>.02){const dv=ctx.createLinearGradient(0,0,AW*.5,0);
    dv.addColorStop(0,'rgba(255,40,30,'+(BR.danger*.4).toFixed(3)+')');dv.addColorStop(1,'rgba(255,40,30,0)');
    A(1);ctx.fillStyle=dv;ctx.fillRect(0,0,AW*.5,AH)}
  if(BR.flash>.004){A(BR.flash*.4);ctx.fillStyle=mixc('#ffeec4','#dcffe8',gr);ctx.fillRect(0,0,AW,AH);A(1)}
}
/* --- the player carries no aura of its own now: a contact shadow, and a white glow so the cube
   stays readable against the sky. The wake behind it is drawn with the wind, in drawBridgeFore. --- */
function drawPlayerEnergy(){
  const gz=clamp(BR.bob,0,1.2);
  ctx.save();
  ctx.globalCompositeOperation='source-over';
  A(.45);ctx.fillStyle='#000';ctx.beginPath();
  ctx.ellipse(P.x,DKY+3,23+9*gz,5.5,0,0,TAU);ctx.fill();A(1);
  ctx.globalCompositeOperation='lighter';
  A(.3+.2*BR.flash);ctx.drawImage(glowW,P.x-72,P.y-72,144,144);
  ctx.globalCompositeOperation='source-over';A(1);ctx.restore();
}
Object.assign(sfx,{
  bform(){noise(1.1,.3,420);tone(44,1.3,'sine',.16,26);tone(180,.9,'sine',.06,520)},
  bsnap(){noise(.35,.3,2200);tone(320,.4,'sawtooth',.08,60)},
  bgo(){tone(420,.3,'sine',.08,880);setTimeout(()=>tone(640,.35,'sine',.07,1200),90)},
  bsect(){tone(150,.5,'sine',.1,70);noise(.3,.16,600)},
  gust(){noise(.8,.3,1500)},
  qecall(){tone(880,.1,'sine',.06,1320);tone(1320,.08,'triangle',.03)},
  qeok(){tone(620,.14,'sine',.09,980);setTimeout(()=>tone(980,.22,'sine',.08,1480),80)},
  qebad(){tone(200,.3,'sawtooth',.09,70);noise(.2,.16,500)},
  stamlow(){tone(300,.1,'square',.045,210)},
  edge(d){tone(120+260*d,.07,'square',.03+.05*d,70)},
  crush(){noise(1.2,.6,260);tone(70,1.3,'sawtooth',.2,20);tone(190,.5,'square',.08,40)},
  bfail(){noise(1,.45,300);tone(60,1.1,'sawtooth',.16,22)},
  bwin(){tone(330,.5,'sine',.1,990);setTimeout(()=>tone(500,.5,'sine',.09,1480),120);setTimeout(()=>tone(740,.7,'sine',.08,1980),260)}
});

/* ==================== 28-feed.js */
/* ================= STAMINA BAR + CORNER FEED ================= */
const stamEl=$('stamw'),stamF=$('stamf'),stamV=$('stamv');let stamPrev=-1;
function stamHud(show){
  if(show===true){stamEl.classList.add('on');$('foot').classList.add('hid');stamPrev=-1}
  else if(show===false){stamEl.classList.remove('on');$('foot').classList.remove('hid');return}
  const v=Math.round(BR.stam);if(v===stamPrev)return;stamPrev=v;
  stamF.style.transform='scaleX('+(BR.stam/100).toFixed(3)+')';stamV.textContent=v;
  stamEl.classList.toggle('low',BR.stam<28);stamEl.classList.toggle('crit',BR.stam<12);
}
/* The corner feed plays bridge-feed.mp4 when one is sitting next to index.html. With no file —
   which is how this ships — it falls back to an energy field drawn here, so the panel is never
   a dead black box. Either way it starts with the encounter, loops, and stops when it ends. */
const feedEl=$('vfeed'),feedV=$('vfv'),feedC=$('vfc'),fx=feedC.getContext('2d');
let feedRAF=0,feedTried=false,feedT=0,feedLast=0,feedIdx=0,feedObj=null;
// a github.com page link points at HTML, so rewrite it to the raw file
function feedRaw(u){
  u=(u||'').trim();if(!u)return '';
  let m=u.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/i);
  if(m)return 'https://raw.githubusercontent.com/'+m[1]+'/'+m[2]+'/'+m[3].split('?')[0];
  return u;
}
const FEEDSRC=[feedRaw(FEED_URL),'bridge-feed.mp4','bridge-feed.webm'].filter(Boolean);
function feedSet(u){
  feedV.src=u;try{feedV.load()}catch(e){}
  feedV.muted=muted;feedV.volume=.8;
  const pr=feedV.play();
  // if the browser refuses audible autoplay, take it muted rather than losing the video
  if(pr&&pr.catch)pr.catch(()=>{feedV.muted=true;const p2=feedV.play();if(p2&&p2.catch)p2.catch(()=>{})});
}
// GitHub hands raw files back as application/octet-stream, which some browsers refuse to play.
// If the plain src is rejected, pull the bytes down and re-label them before handing them over.
function feedRetype(u){
  fetch(u,{mode:'cors'}).then(r=>r.ok?r.blob():Promise.reject(0)).then(b=>{
    if(feedObj)URL.revokeObjectURL(feedObj);
    feedObj=URL.createObjectURL(b.slice(0,b.size,/\.webm(\?|$)/i.test(u)?'video/webm':'video/mp4'));
    feedSet(feedObj);
  }).catch(()=>feedTry());
}
function feedTry(){
  if(feedIdx>=FEEDSRC.length)return;                 // nothing left: the drawn animation stands in
  const u=FEEDSRC[feedIdx++];
  if(/^https?:/i.test(u)&&!feedV.dataset.retried){feedV.dataset.retried='1';feedSet(u);feedV.dataset.pending=u}
  else feedSet(u);
}
feedV.addEventListener('error',()=>{
  if(!feedEl.classList.contains('on'))return;
  const p=feedV.dataset.pending;
  if(p){feedV.dataset.pending='';feedRetype(p);return}   // one re-label attempt before moving on
  feedTry();
});
function feedPaint(now){
  if(!feedEl.classList.contains('on')){feedRAF=0;return}
  feedRAF=requestAnimationFrame(feedPaint);
  // if a real clip is up, show it and stop drawing the stand-in entirely
  const live=feedV.readyState>=2&&!feedV.paused&&!feedV.ended;
  if(feedC.classList.contains('hid')!==live)feedC.classList.toggle('hid',live);
  if(live)return;
  const d=Math.min(.05,(now-feedLast)/1000||0);feedLast=now;feedT+=d;
  const w=feedC.width,h=feedC.height,t=feedT;
  fx.globalCompositeOperation='source-over';
  const g=fx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,'#241506');g.addColorStop(.55,'#432a0d');g.addColorStop(1,'#180d04');
  fx.fillStyle=g;fx.fillRect(0,0,w,h);
  fx.globalCompositeOperation='lighter';
  for(let i=0;i<5;i++){   // ribbons of energy coiling through the frame
    const ph=t*(.5+i*.17)+i*1.4;
    fx.strokeStyle='rgba(130,255,180,'+(.14+.1*Math.sin(t+i)).toFixed(3)+')';
    fx.lineWidth=1.4+i*.5;fx.beginPath();
    for(let x=0;x<=w;x+=6){
      const y=h*.5+Math.sin(x*.035+ph)*h*(.16+.06*i)+Math.sin(x*.012-ph*1.7)*h*.1;
      x?fx.lineTo(x,y):fx.moveTo(x,y)}
    fx.stroke()}
  fx.fillStyle='rgba(200,255,220,1)';
  for(let i=0;i<26;i++){const sd=i*91.7,
    x=((sd*.013%1)*w-t*(16+(sd*.007%1)*34))%w,px=x<0?x+w:x,
    y=((sd*.029%1)*h+Math.sin(t*1.3+i)*7+h)%h;
    fx.globalAlpha=.2+.5*((sd*.019)%1);fx.fillRect(px,y,2.2,1.4)}
  fx.globalAlpha=1;
  const r=Math.max(1,Math.min(w,h)*(.3+.06*Math.sin(t*1.6))||1);
  const rg=fx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,r*2.2);
  rg.addColorStop(0,'rgba(120,255,170,.22)');rg.addColorStop(1,'rgba(120,255,170,0)');
  fx.fillStyle=rg;fx.fillRect(0,0,w,h);
  fx.globalCompositeOperation='source-over';
}
function feedShow(on){
  if(on){
    feedEl.classList.add('on');
    if(!feedTried){feedTried=true;feedTry()}
    else{feedV.muted=muted;const pr=feedV.play();if(pr&&pr.catch)pr.catch(()=>{feedV.muted=true;feedV.play().catch(()=>{})})}
    if(!feedRAF){feedLast=performance.now();feedRAF=requestAnimationFrame(feedPaint)}
  }else{
    feedEl.classList.remove('on');
    try{feedV.pause()}catch(e){}
    if(feedRAF){cancelAnimationFrame(feedRAF);feedRAF=0}
  }
}
function feedSize(){   // keep the internal buffer matched to the laid-out panel
  const r=feedC.getBoundingClientRect();if(!r.width)return;
  const d=Math.min(window.devicePixelRatio||1,TOUCH?1.5:2);
  const w=Math.round(r.width*d),h=Math.round(r.height*d);
  if(feedC.width!==w||feedC.height!==h){feedC.width=w;feedC.height=h}
}
addEventListener('resize',feedSize);feedSize();verStamp();setLoad();shopLoad();skinLoad();achLoad();dayLoad();dayInfo();hsUpdate();

/* ==================== 29-flow.js */
/* ================= FLOW ================= */
function die(q){
  if(q){G.state='dying';G.dyT=1.05;P.alive=true;knightAbort();aquaAbort();bridgeAbort();floweyAbort();
    shrinkClear();lavaSound(false);G.nb=G.score>best;if(G.nb){best=G.score;store.set('cube-best',String(best))}
    sfx.win();return}
  G.state='dying';G.dyT=0;P.alive=false;knightAbort();aquaAbort();bridgeAbort();floweyAbort();shrinkClear();lavaSound(false);G.chain=0;G.chainT=0;G.nb=G.score>best;if(G.nb){best=G.score;store.set('cube-best',String(best))}
  freeze=.11;slow(.9,.22);shake(1);G.fl=.6;G.fc=2;cam.zk+=reduce?0:.03;   // hit-stop → slow-mo → shake → flash
  burst(P.x,P.y,30,560,1.2,8,0,2.2);burst(P.x,P.y,34,720,.95,5.5,1,2.6);sfx.death();
}
function gameOver(){
  G.state='over';G.overT=0;
  achMax('rTime',G.t);achMax('rScore',G.score);ach('score',G.score);ach('deaths',G.banked?0:1);
  if(!AS.rHit&&G.t>=60)ach('fClean1');
  if(!AS.rHit&&G.score>=10000&&U.shield<=0)AS.fBrokeRich=1;
  if(U.shield<=0&&G.score>=10000)AS.fBrokeRich=1;
  AS.skins=(()=>{let k=0;for(const q in SKOWN)if(SKOWN[q])k++;return k})();
  AS.shopLv=shopTotal();
  dayFinish();achCheck();achSave();
hudEl.classList.remove('on');nameplate(false);hsUpdate();
  const os=$('os');os.textContent='0';countUp(os,G.score,900);
  $('onb').classList.toggle('hid',!G.nb);$('obest').textContent='Best '+fmt(best);
  const pay=G.banked||payout();
  $('opay').textContent='+'+fmt(pay)+' ◆'+(G.banked?'  banked ×'+potMul().toFixed(potMul()%1?1:0):'');hsUpdate();
  $('o2a').textContent=G.daily?'Daily cube':(SET.hard?'Hard mode':'');
  $('o1').textContent=fmtT(G.t);$('o2').textContent=G.nm;$('o3').textContent=G.kills;$('o4').textContent=G.maxChain>1?'×'+G.maxChain:'–';
  show('over');
}
function start(){
  audio();sfx.ui();for(let i=0;i<ON;i++)obs[i].on=0;
  Object.assign(P,{x:AW/2,y:AH/2,vx:0,vy:0,rot:0,qx:0,qy:0,qxv:0,qyv:0,cd:0,drop:1,alive:true});
  Object.assign(G,{state:'play',t:0,diff:0,speed:210,next:.9,kn:0,kT:-999,bonus:0,score:0,nmCd:0,fl:0,tp:0,upT:8,ev:null,evT:32,chain:0,chainT:0,nm:0,kills:0,maxChain:0,
    cleared:0,banked:0,knightKilled:false,flw:0,flT:0,lastHit:-99});resetArm();
  achReset();aIdle=0;aCorn=0;bst=0;bstT=clock;aT=.25;aQ.length=0;
  ach('runs');if(SET.hard)ach('hardRuns');
  DRS=null;if(G.daily)dayStart();                        // the daily draws its run from the date
  cam.x=0;cam.y=0;cam.z=1;cam.zk=0;                            // never carry a poisoned camera into a new run
  document.body.classList.remove('banking');
  freeze=0;slowT=0;ts=1;show(null);hudEl.classList.add('on');hudUpdate();toast('Go','Dodge the red cubes');
}
function toMenu(){   // back to the title screen; the AI-piloted demo takes over the background again
  audio();sfx.ui();resetArm();DRS=null;G.daily=0;dayInfo();
  Object.assign(P,{alive:true,drop:0,qx:0,qy:0,qxv:0,qyv:0,rot:0});
  Object.assign(G,{state:'menu',ev:null,evT:32,diff:0,speed:210,kn:0,kT:-999,bonus:0,score:0,fl:0,fc:0,tr:0,nmCd:0,upT:8,chain:0,chainT:0});
  document.body.classList.remove('banking');
  freeze=0;slowT=0;ts=1;demoReset();hudEl.classList.remove('on');nameplate(false);hsUpdate();show('menu');
}
function pause(){if(G.state!=='play')return;G.state='paused';try{$('vfv').pause()}catch(e){}
  elPauseAll(true);
  if(AC&&(MUS.h||K.vac||K.roar||LVS.h||BR.wind||FB.on))AC.suspend();for(const k in keys)keys[k]=0;show('pause')}
function resume(){elPauseAll(false);
  audio();G.state='play';show(null);if(BR.on)feedShow(true)}
const SUB=s=>s==='shop'||s==='settings'||s==='awards';              // the three menu-within-the-menu screens
function act(a){audio();if(a==='menu'&&SUB(scr)){show('menu');sfx.ui();return}
  if(a==='shop'){shopOpen();return}if(a==='settings'){setOpen();return}if(a==='awards'){acOpen();return}
  if(a==='daily'){dayPlay();return}if(a==='banktake'){bankTake();return}if(a==='bankpass'){bankPass();return}
  if(a==='cont'){winCont();return}if(a==='install'){doInstall();return}if(a==='play'||a==='retry'||a==='restart')start();else if(a==='resume')resume();else if(a==='menu')toMenu()}


/* --- winning: the only ending the game has. You can stop here, or go on without it. --- */
function winRun(){
  G.ev=null;G.evT=lerp(50,38,G.diff);G.next=1.6;G.state='won';
  G.nb=G.score>best;if(G.nb){best=G.score;store.set('cube-best',String(best))}
  hsUpdate();
  $('ws').textContent=fmt(G.score);$('wbest').textContent='Best '+fmt(Math.max(best,G.score));
  $('wnb').classList.toggle('hid',!G.nb);
  const pay=payout();$('wpay').textContent='+'+fmt(pay)+' ◆';hsUpdate();
  $('w1').textContent=fmtT(G.t);$('w2').textContent=fmt(G.nm);
  $('w3').textContent=fmt(G.kills);$('w4').textContent=G.maxChain>1?'×'+G.maxChain:'–';
  show('win');sfx.win();
}
function winCont(){show(null);G.state='play';G.evT=Math.max(G.evT,14);G.tp=Math.min(100,G.tp+60);
  toast('Beyond','Nothing is coming to end it now')}

/* ==================== 30-update.js */
/* ================= UPDATE ================= */
const dust=Array.from({length:46},()=>({x:rnd(-200,AW+200),y:rnd(-150,AH+150),z:rnd(.25,1),vx:rnd(-6,6),vy:rnd(-10,-2),ph:rnd(0,TAU)}));
function update(dt){
  clock+=dt;
  if(G.state==='cards'||G.state==='bank'){chainHud();return}
freeze=Math.max(0,freeze-dt);slowT-=dt;
  ts=freeze>0?0:damp(ts,slowT>0?slowTo:1,slowT>0?30:6,dt);const sd=dt*ts;   // sd = gameplay (slowable) time
  if(G.surgeT>0)G.surgeT-=dt;
  G.fl=damp(G.fl,0,6,dt);G.tr=Math.max(0,G.tr-dt*1.5);G.nmCd-=dt;gt+=sd;P.inv=Math.max(0,P.inv-sd);K.fr=damp(K.fr,K.on?1:0,2.2,dt);if(G.chainT>0){G.chainT-=dt;if(G.chainT<=0)G.chain=0}
  if(G.state==='play'||G.state==='menu'){
    G.t+=sd;G.diff=hDiff(clamp(1-Math.exp(-G.t/118)+dsDiff(),0,1));G.speed=210*(1+G.diff*.86)*dsSpeed();  // difficulty curve, pushed up by what you own
    if(P.drop<=0&&!G.ev){G.next-=sd;if(G.next<=0){spawnPattern();G.next+=(SH.on?2.2:0)+hGap(lerp(.8,.26,G.diff)*srnd(.85,1.15)*dsRate())}}
    const sc=(G.t*10+G.bonus)|0;if(sc!==G.score){G.score=sc;hudUpdate()}
    G.upT-=sd;if(G.upT<=0){if(!BR.on&&!FB.on)spawnPick();G.upT=hPick(lerp(10,7,G.diff))}    // an upgrade appears every ~8s
  }
  gz=0;stepWarn(sd);
  stepSlabs(sd);                                   // always: his own loop does not do it
  if(!FB.on){stepBoom(sd);stepBombs(sd);stepWipe(sd);stepLaunch(sd);stepScream(sd)}
  stepShrink(sd);stepOrbit(sd);stepDash(sd);stepPlayer(sd);stepJump(sd);stepObs(sd);stepHaz(sd);stepHoles(sd);stepEv(sd);stepKnives(sd);stepShoot(sd);stepBul(sd);stepPicks(sd);stepParts(sd);stepText(dt);
  if((G.state==='play'||G.state==='menu')&&P.alive){
    G.tp=Math.min(100,G.tp+hTp(gz*32*(1+.4*U.graze)*(1+SHOP.tp*.13))*sd);
    if(FB.on&&P.alive)G.tp=Math.min(100,G.tp+13*(1+SHOP.tp*.12)*sd);          // the finale keeps you loaded
  }
  for(let i=0;i<dust.length;i++){const d=dust[i];d.x+=d.vx*d.z*dt;d.y+=d.vy*d.z*dt;if(d.y<-150)d.y=AH+150;if(d.x<-200)d.x=AW+200;if(d.x>AW+200)d.x=-200}
  if(!Number.isFinite(P.x)||!Number.isFinite(P.y)||!Number.isFinite(P.vx)||!Number.isFinite(P.vy)){
    P.x=AW/2;P.y=AH/2;P.vx=P.vy=0}                             // self-heal rather than wedge
  if(!Number.isFinite(cam.x)||!Number.isFinite(cam.y)||!Number.isFinite(cam.z)||!Number.isFinite(cam.zk)){
    cam.x=cam.y=cam.zk=0;cam.z=1}
  const f=.04+G.diff*.03;cam.x=damp(cam.x,-(P.x-AW/2)*f,4,dt);cam.y=damp(cam.y,-(P.y-AH/2)*f,4,dt);cam.zk=damp(cam.zk,0,8,dt);
  cam.z=damp(cam.z,1+G.diff*.07+(G.state==='dying'?.05:0),3,dt);
  const ti=G.tp|0;
  if(ti!==tpi){if(tpi>=0&&ti>tpi&&gz>0)tpTick(ti);if(tpi>=0&&tpi<COST&&ti>=COST)tpReady();tpi=ti;tpv.textContent=ti;tpHud(ti);tpEl.classList.toggle('rdy',ti>=COST);tpEl.classList.toggle('full',ti>=100)}
  tpEl.classList.toggle('dn',FB.on?!!keys.e:!!keys.f);
  P.gl=damp(P.gl,gz>0?Math.min(1,.4+gz*.35):0,gz>0?20:6,dt);P.tk=Math.max(0,P.tk-dt*6);
  if(G.state==='play'){const lv=Math.min(5,Math.ceil(G.diff*5.5)||1),sec=G.t|0;if(lv!==thrLv){if(thrLv>0&&lv>thrLv&&!BR.on&&!K.on&&!Q.on&&!FB.on)toast('Threat '+lv,'Cubes are getting faster');thrLv=lv;for(let i=0;i<5;i++)thrB[i].className=i<lv?'on':''}if(sec!==tmSec){tmSec=sec;tmEl.textContent=fmtT(sec)}}
  else if(G.state==='menu'&&G.t>50)demoReset();
  if(!tipDone&&G.state==='play'&&G.tp>=COST){tipDone=true;toast('Fire ready',TOUCH?'Hold the right side':'Hold space or click')}
  if(G.state!=='play')achStep(dt);
  if(G.state==='play'){achStep(dt);
    aT-=dt;
    if(aT<=0){aT=.25;
      achMax('rTime',G.t);achMax('rScore',G.score);ach('time',.25);
      if(G.tp>=100){ach('fFullTp',AS.rFullTp?0:1);AS.rFullTp=1}
      const noHit=!AS.rHit;
      if(noHit&&G.t>=120)AS.fNoHit2=1;if(noHit&&G.t>=240)AS.fNoHit4=1;if(noHit&&G.t>=360)AS.fNoHit6=1;
      if(!AS.rNoShot&&G.t>=120)AS.fNoShot2=1;if(!AS.rNoShot&&G.t>=240)AS.fNoShot4=1;
      if(!AS.rNoDash&&G.t>=180)AS.fNoDash3=1;if(!AS.rNoDash&&G.t>=300)AS.fNoDash5=1;
      if(!AS.rNoUp&&G.t>=180)AS.fNoUp3=1;if(!AS.rNoUp&&G.t>=300)AS.fNoUp5=1;
      if(!G.banked&&G.t>=600)AS.fPatience=1;
      if(U.shield===1){AS.rOne=(AS.rOne||0)+.25;if(AS.rOne>=60)AS.fOneShield=1}else AS.rOne=0;
      if(SET.hard){ach('hardTime',.25);
        if(G.t>=60)AS.fHard1=1;if(G.t>=180)AS.fHard3=1;if(G.t>=300)AS.fHard5=1;if(G.t>=480)AS.fHard8=1;
        achMax('hardBest',G.score);if(EQUIP==='gold')AS.fGoldHard=1}
      const idle=!keys.l&&!keys.r&&!keys.u&&!keys.d&&!keys.f&&!keys.e;
      if(idle){aIdle+=.25;if(aIdle>=60)AS.fIdle=1}else aIdle=0;
      if(!AS.rHit&&!idle)ach('rClean',.25);        // the unscratched hour, and only while you play
      const cx=P.x<170||P.x>AW-170,cy=P.y<150||P.y>AH-150;
      if(cx&&cy){aCorn+=.25;if(aCorn>=30)AS.fCorner=1}else aCorn=0;
      if(bst>=25&&clock-bstT<3)AS.fBurst=1;
      if(clock-bstT>=3){bst=0;bstT=clock}
      if(!SHOP.spd&&!SHOP.dmg&&!SHOP.hp&&!SHOP.tp&&!SHOP.dsh&&K.on)AS.fNoShop=1;
      achCheck();
    }
  }
  chainHud();
  if(G.state==='dying'){G.dyT+=dt;if(G.dyT>1.1)gameOver()}else if(G.state==='over')G.overT+=dt;
}

/* ==================== 31-render.js */
/* ================= RENDER ================= */
function rr(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h)}
const A=a=>{ctx.globalAlpha=a<0?0:a>1?1:a};
function drawPlayer(){
  const s=P.s,sp=Math.min(1,Math.hypot(P.vx,P.vy)/MAXV),ang=Math.atan2(P.vy,P.vx),idle=1-Math.min(1,sp*3),br=1+Math.sin(clock*2.2)*.03*idle,dr=P.drop*P.drop*P.drop;
  if(P.z>0){ctx.globalCompositeOperation='source-over';A(.4*(1-P.z*.5));ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(P.x,P.y+8,13*(1-P.z*.3),6*(1-P.z*.3),0,0,TAU);ctx.fill()}
  ctx.globalCompositeOperation='lighter';A((.55+.12*idle*Math.sin(clock*2.2)+G.fl*3)*(1-dr));ctx.drawImage(skGlow(EQUIP),P.x-100,P.y-100,200,200);
  ctx.globalCompositeOperation='source-over';A((1-dr*.9)*(P.inv>0&&Math.sin(clock*45)>0?.35:1));
  ctx.save();ctx.translate(P.x,P.y);
  ctx.translate(0,-P.z*22);ctx.scale(1+P.z*.3,1+P.z*.3);ctx.rotate(ang);ctx.scale(1+sp*.14,1-sp*.09);ctx.rotate(-ang);           // velocity stretch
  ctx.rotate(P.rot);const k=br*(1+dr*.8);ctx.scale((1+P.qx)*k,(1+P.qy)*k); // tilt + squash springs
  cubePaint(s);ctx.restore();A(1);
  if(BR.on)drawPlayerEnergy();
  for(let i=0;i<U.shield;i++){ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(P.x,P.y,25+i*6+Math.sin(clock*3+i)*1.2,0,TAU);ctx.stroke()}
  if(P.gl>.02||P.tk>0){   // TP outline: appears while grazing, pops on every TP tick, arc = TP fill
    const q=s+12+P.tk*7+Math.sin(clock*10)*1.2*P.gl,per=4*q*.92;
    ctx.save();ctx.translate(P.x,P.y);ctx.rotate(P.rot);ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#fff';
    A(.22*P.gl+.5*P.tk);ctx.lineWidth=6;rr(-q/2-2,-q/2-2,q+4,q+4,q*.3);ctx.stroke();
    A(.3*P.gl+.5*P.tk);ctx.lineWidth=1.4;rr(-q/2,-q/2,q,q,q*.26);ctx.stroke();
    A(Math.min(1,.55*P.gl+.6*P.tk));ctx.lineWidth=2.6+P.tk*1.6;ctx.setLineDash([per*G.tp/100,per*2]);rr(-q/2,-q/2,q,q,q*.26);ctx.stroke();
    ctx.restore();A(1)}
}
function render(){
  const fitR=vw*.95/((AW+490)*scale),fit=Number.isFinite(fitR)?Math.min(1,fitR):1,
    z=(scale*cam.z+cam.zk*scale)*(1-K.fr*(1-fit)),cx=vw/2-K.fr*245*z,cy=vh*arCY,sh=G.tr*G.tr*24,
    shx=(Math.sin(clock*67)+Math.sin(clock*41+2))*.5*sh,shy=(Math.sin(clock*59+1)+Math.sin(clock*47))*.5*sh;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalCompositeOperation='source-over';A(1);
  ctx.fillStyle='#050506';ctx.fillRect(0,0,vw,vh);
  // soft light behind the player
  const px=cx+shx+(P.x-AW/2+cam.x)*z,py=cy+shy+(P.y-AH/2+cam.y)*z;
  let g=ctx.createRadialGradient(Number.isFinite(px)?px:vw/2,Number.isFinite(py)?py:vh/2,0,
    Number.isFinite(px)?px:vw/2,Number.isFinite(py)?py:vh/2,Math.max(1,Math.max(vw,vh)*.5));g.addColorStop(0,'rgba(255,255,255,.09)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,vw,vh);
  ctx.save();ctx.translate(cx+shx,cy+shy);ctx.scale(z,z);ctx.translate(-AW/2+cam.x,-AH/2+cam.y);
  // parallax grid: shifts less than the arena → depth
  ctx.save();ctx.translate(-cam.x*.4,-cam.y*.4);ctx.strokeStyle='rgba(255,255,255,.035)';ctx.lineWidth=1/z;ctx.beginPath();
  for(let x=-640;x<=1664;x+=64){ctx.moveTo(x,-512);ctx.lineTo(x,1152)}for(let y=-512;y<=1152;y+=64){ctx.moveTo(-640,y);ctx.lineTo(1664,y)}ctx.stroke();ctx.restore();
  if(FB.on)drawFloweyField();
  rr(0,0,AW,AH,26);ctx.fillStyle='rgba(255,255,255,.022)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=1.2;ctx.stroke();
  if(F.on)drawFloor();
  if(BR.on)drawBridge();
  // floating dust at varying depth
  ctx.fillStyle='#fff';
  for(let i=0;i<dust.length;i++){const d=dust[i];A(.08+.28*d.z*(.6+.4*Math.sin(clock*.8+d.ph)));const s=d.z*2.2;ctx.fillRect(d.x-cam.x*(1-d.z)-s/2,d.y-cam.y*(1-d.z)-s/2,s,s)}
  A(1);
  drawKnight();drawAqua();
  // obstacles: glow, ghost trail, body
  for(let i=0;i<ON;i++){const o=obs[i];if(!o.on)continue;
    if(o.a<=0)continue;const s=o.s*easeOutBack(o.a),e=o.a*o.a;
    ctx.globalCompositeOperation='lighter';A(.6*Math.min(1,o.a*1.5));ctx.drawImage(glowR,o.x-s*1.5,o.y-s*1.5,s*3,s*3);
    ctx.globalCompositeOperation='source-over';
    const wind=o.b===1&&!o.bf&&o.a>=1;
    ctx.fillStyle=o.f>0?'#fff':wind?(Math.sin(clock*26)>0?'#ffd166':'#ff8a2e'):o.h>0?'#ff5c57':o.b===4?'#ff7a3c':'#ee1c25';
    if(wind){const u=clamp(o.bt/o.bp,0,1);ctx.globalCompositeOperation='lighter';A(.5*(1-u));
      ctx.strokeStyle='rgba(255,190,90,1)';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(o.x,o.y,s*.6+42*(1-u),0,TAU);ctx.stroke();
      ctx.globalCompositeOperation='source-over';A(1)}
    for(let j=4;j>0;j--){const t=j*.024,q=s*(1-j*.05);A(.15*(1-j/5));ctx.save();ctx.translate(o.x-o.vx*e*t,o.y-o.vy*e*t);ctx.rotate(o.r-o.vr*t);rr(-q/2,-q/2,q,q,q*.18);ctx.fill();ctx.restore()}
    A(1);ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.k===1?Math.atan2(o.vy,o.vx):o.r);
    if(o.k===1){const sq=1+Math.min(1.6,Math.hypot(o.vx,o.vy)/650);ctx.scale(sq,1/Math.sqrt(sq))}
    rr(-s/2,-s/2,s,s,s*.18);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;ctx.stroke();ctx.restore();
  }
  drawWarn();
  drawFloweyBack();drawFlowey();drawKnives();drawShrink();
  // laser beams + blast zones, clipped to the arena
  ctx.save();rr(0,0,AW,AH,26);ctx.clip();
  for(let i=0;i<HN;i++)if(hl[i].on)drawHole(hl[i]);
  for(let i=0;i<ZN;i++)if(zn[i].on)drawZone(zn[i]);
  for(let i=0;i<BM;i++)if(bm[i].on)drawBeam(bm[i]);
  ctx.restore();ctx.globalCompositeOperation='source-over';A(1);
  if(F.on&&F.heat>.02){ctx.globalCompositeOperation='lighter';A(F.heat*(.3+.25*Math.sin(clock*3)));
    ctx.drawImage(glowL,P.x-120,P.y-120,240,240);ctx.globalCompositeOperation='source-over';A(1)}
  if(!FB.on){drawSlabs();drawWipe();drawLaunch();drawScream();drawBombs();drawBoom()}
  if(P.alive){drawGhosts();drawPlayer();drawOrbit()}
  // upgrade pickups
  ctx.font=FONT;ctx.textAlign='center';
  for(let i=0;i<PKN;i++){const p=pks[i];if(!p.on)continue;
    const k=easeOutBack(Math.min(1,p.t/.4)),al=p.l<4&&Math.sin(clock*14)>0?.35:1;
    ctx.globalCompositeOperation='lighter';A(.5*al);ctx.drawImage(glowW,p.x-48,p.y-48,96,96);
    ctx.globalCompositeOperation='source-over';A(al);ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,(15+Math.sin(clock*4+i)*1.2)*k,0,TAU);ctx.stroke();
    A(al*.4);ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,(23+Math.sin(clock*3+i)*2)*k,0,TAU);ctx.stroke();
    A(al);ctx.fillStyle='#fff';ctx.save();ctx.translate(p.x,p.y);ctx.rotate(clock*.9);ctx.scale(k,k);rr(-5,-5,10,10,2);ctx.fill();ctx.restore();
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-clock*.55);ctx.scale(k,k);rr(-9,-9,18,18,3);ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
    A(1)}
  // bullets (additive)
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<BN;i++){const b=bul[i];if(!b.on)continue;A(.55);ctx.drawImage(glowW,b.x-22,b.y-22,44,44);A(1);ctx.fillStyle='#fff';ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx));rr(-11,-2,22,4,2);ctx.fill();ctx.restore()}
  ctx.globalCompositeOperation='source-over';
  drawText();
  // particles (additive)
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<PN;i++){const p=parts[i];if(!p.on)continue;const t=p.l/p.m,s=p.s*(.4+.6*t);A(t);ctx.fillStyle=p.c===2?'#8dffa0':p.c?'#ff2a2a':'#fff';ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillRect(-s/2,-s/2,s,s);ctx.restore()}
  if(BR.on)drawBridgeFore();
  ctx.globalCompositeOperation='source-over';A(1);ctx.restore();
  // vignette + impact flash
  g=ctx.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*.4,vw/2,vh/2,Math.hypot(vw,vh)*.55);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.75)');ctx.fillStyle=g;ctx.fillRect(0,0,vw,vh);
  if(G.fl>.004){ctx.fillStyle='#fff';A(G.fl*(G.fc===2?.55:1));ctx.fillRect(0,0,vw,vh);if(G.fc===2){ctx.fillStyle='#ff2a2a';A(G.fl*.45);ctx.fillRect(0,0,vw,vh)}A(1)}
}

/* ==================== 32-input.js */
/* ================= INPUT ================= */
function menuKey(c){
  if(c==='ArrowDown'||c==='KeyS'){focusBtn(1);sfx.nav()}
  else if(c==='ArrowUp'||c==='KeyW'){focusBtn(-1);sfx.nav()}
  else if(c==='Enter'||c==='NumpadEnter'||c==='Space'){const b=btns()[focusI];if(b)act(b.dataset.a)}
}
addEventListener('keydown',e=>{
  if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&!e.metaKey&&!e.ctrlKey&&!e.altKey){
    if(!e.repeat&&G.state==='play'){audio();tryDash()}return}                 // SHIFT dashes
  if(e.metaKey||e.ctrlKey||e.altKey||/^(Shift|Control|Alt|Meta|Caps)/.test(e.code))return;
  const c=e.code,m=MAP[c];if(m){keys[m]=1;if(c.startsWith('Arrow')||c==='Space')e.preventDefault()}
  if(e.repeat)return;audio();
  if(c==='KeyM'){setMute(!muted);sfx.ui();return}
  const s=G.state,pk=c==='KeyP'||c==='Escape';
  if(s==='cards'){
    if(c==='ArrowLeft'||c==='KeyA')cardMove(-1);
    else if(c==='ArrowRight'||c==='KeyD')cardMove(1);
    else if(c==='Space'||c==='Enter'||c==='NumpadEnter'||c==='KeyW'||c==='ArrowUp')cardTake();
    return}
  if(s==='won'){if(c==='Enter'||c==='NumpadEnter'||c==='Space')winCont();else if(c==='Escape')toMenu();else menuKey(c);return}
  if(DBG&&c==='KeyB'&&s==='play'&&!G.ev){G.kForce=true;G.evT=0;return}                  // debug (?debug): summon the Roaring Knight
  if(DBG&&c==='KeyF'&&s==='play'&&!G.ev){G.fForce=true;G.evT=0;return}                  // debug (?debug): trigger the floor collapse
  if(DBG&&c==='KeyG'&&s==='play'&&!G.ev&&!G.bridgeDone){G.bForce=true;G.evT=0;return}   // debug (?debug): start the Gravity Bridge
  if(DBG&&c==='KeyX'&&s==='play'&&!G.ev){G.xForce=true;G.evT=0;return}                  // debug (?debug): summon the final boss
  if(s==='play'){if(pk)pause();else if(c==='KeyR')start()}
  else if(s==='paused'){if(pk)resume();else if(c==='KeyR')start();else menuKey(c)}
  else if(s==='menu'){
    if(scr==='shop'){
      if(c==='Escape'||c==='Backspace'){show('menu');return}
      if(c==='KeyQ'){shopSec(0);sfx.nav();return}
      if(c==='KeyE'){shopSec(1);sfx.nav();return}
      if(c==='Tab'){shopSec(shopTab?0:1);sfx.nav();return}
      if(shopTab===0){
        if(c==='KeyW'||c==='ArrowUp')shopMove(-1);
        else if(c==='KeyS'||c==='ArrowDown')shopMove(1);
        else if(c==='KeyA'||c==='ArrowLeft')shopSec(1);
        else if(c==='KeyD'||c==='ArrowRight')shopSec(1);
        else if(c==='Space'||c==='Enter'||c==='NumpadEnter')shopBuy();
      }else{
        if(c==='KeyA'||c==='ArrowLeft')skMove(-1);
        else if(c==='KeyD'||c==='ArrowRight')skMove(1);
        else if(c==='KeyW'||c==='ArrowUp')skMove(-5);
        else if(c==='KeyS'||c==='ArrowDown')skMove(5);
        else if(c==='Space'||c==='Enter'||c==='NumpadEnter')skTake();
      }
      return}
    if(scr==='awards'){
      if(c==='Escape'||c==='Backspace')show('menu');
      else if(c==='KeyW'||c==='ArrowUp')acMove(-1);
      else if(c==='KeyS'||c==='ArrowDown')acMove(1);
      else if(c==='Space'||c==='Enter'||c==='NumpadEnter')acFilt();
      return}
    if(scr==='settings'){
      if(c==='Escape'||c==='Backspace')show('menu');
      else if(c==='KeyW'||c==='ArrowUp')setMove(-1);
      else if(c==='KeyS'||c==='ArrowDown')setMove(1);
      else if(c==='KeyA'||c==='ArrowLeft')setAdj(-1);
      else if(c==='KeyD'||c==='ArrowRight')setAdj(1);
      else if(c==='Space'||c==='Enter'||c==='NumpadEnter')setToggle();
      return}
    start()}
  else if(s==='bank'){menuKey(c);return}
  else if(s==='over'&&G.overT>.6){if(c==='KeyR')start();else if(c==='Escape')toMenu();else menuKey(c)}
});
addEventListener('keyup',e=>{const m=MAP[e.code];if(m)keys[m]=0});
addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch')return;                      // touch goes through the stick + fire zones instead
  if(e.target.closest&&e.target.closest('.btn,#btns,#acf,.ac,.st,.sk'))return;audio();const s=G.state;
  if(s==='bank')return;
  if(s==='menu'){if(!SUB(scr))start()}else if(s==='play')keys.f=1;else if(s==='cards')return;
});
addEventListener('pointerup',e=>{if(e.pointerType!=='touch')keys.f=0});
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.btn');if(!b||(G.state==='over'&&G.overT<.6))return;act(b.dataset.a);b.blur()});
document.addEventListener('mouseover',e=>{const b=e.target.closest&&e.target.closest('.btn');if(!b||!scr)return;const i=[...btns()].indexOf(b);if(i>=0&&i!==focusI){focusI=i;focusBtn();sfx.nav()}});
pauseBtn.addEventListener('click',()=>{audio();if(G.state==='play')pause();else if(G.state==='paused')resume();pauseBtn.blur()});
muteBtn.addEventListener('click',()=>{audio();setMute(!muted);sfx.ui();muteBtn.blur()});
addEventListener('blur',()=>{for(const k in keys)keys[k]=0;if(TOUCH)touchClear();pause()});                 // graceful focus loss
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});

/* ==================== 33-loop.js */
/* ================= LOOP ================= */
function frame(now){
  requestAnimationFrame(frame);                                  // reschedule FIRST: one bad frame must never stop the game
  const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;
  try{
    if(G.state!=='paused')update(dt);
    render();
  }catch(e){if(!frame.warned){frame.warned=1;console.error('frame error (recovered):',e)}}
}
if(document.fonts&&document.fonts.load)document.fonts.load('700 20px CSans').catch(()=>{});
demoReset();hudUpdate();hsUpdate();requestAnimationFrame(frame);
setTimeout(()=>show('menu'),80);
if(DBG)window.__dbg=()=>({pwr:+pwr().toFixed(3),diff:+G.diff.toFixed(3),speed:Math.round(G.speed),gap:+dsRate().toFixed(2),hp:+dsHP().toFixed(2),ups:upTotal(),sh:U.shield,live:obs.filter(o=>o.on&&o.a>=0).length,clean:Math.round(AS.rClean||0)});if(DBG)window.__give=(k,v)=>{U[k]=v};   // ?debug only
if(DBG)window.__scream=()=>{flScream();return !!FB.scr};
})();
