/** VITARA · Ensamblaje electrónico: referencia aportada por el usuario + logo oficial + iconos muestreados. */
(function () {
  'use strict';
  const canvas=document.getElementById('welcome-particles'),splash=document.getElementById('splash');
  const ctx=canvas?.getContext('2d',{alpha:true});if(!ctx||!splash)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const glyphs=[
    {label:'CUIDADO',path:'M-5 -13H5V-5H13V5H5V13H-5V5H-13V-5H-5Z'},
    {label:'LATIDO',path:'M-19 1H-11L-6 -10L1 12L7 -4L11 1H19'},
    {label:'CONEXIÓN',path:'M-12 -12C12 -12 -12 12 12 12M12 -12C-12 -12 12 12 -12 12M-8 -8H8M-5 0H5M-8 8H8'},
    {label:'MEDICINA',path:'M-14 -3L-3 -14C7 -24 24 -7 14 3L3 14C-7 24 -24 7 -14 -3ZM-8 -8L8 8'},
    {label:'ESCUCHA',path:'M-11 -14V-4C-11 9 11 9 11 -4V-14M-4 7V12C-4 23 17 22 17 8M13 4A5 5 0 1 0 23 4A5 5 0 1 0 13 4'},
    {label:'BIENESTAR',path:'M0 15L-15 0C-27 -16 -7 -24 0 -12C7 -24 27 -16 15 0Z'}
  ];
  let seed=47;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const stars=Array.from({length:105},()=>({x:random(),y:random(),z:.2+random()*.8,phase:random()*6.28}));
  const needles=Array.from({length:62},(_,i)=>({angle:i/62*Math.PI*2,span:.1+random()*.45,phase:random()}));
  const circuit=Array.from({length:30},()=>({angle:random()*Math.PI*2,phase:random(),length:20+random()*50}));
  let logoPoints=[],width=0,height=0,frame=0,lastDraw=-Infinity,started=performance.now();
  const logo=new Image(),reference=new Image();
  const progress=(t,delay,duration,staticMode)=>staticMode?1:Math.min(1,Math.max(0,(t-delay)/duration));
  const ease=p=>1-Math.pow(1-p,3);
  function sampleGlyph(glyph,index){
    const sample=document.createElement('canvas');sample.width=sample.height=88;const c=sample.getContext('2d');c.translate(44,44);c.scale(1.25,1.25);c.strokeStyle='#fff';c.lineWidth=1.7;c.lineCap='round';c.lineJoin='round';c.stroke(new Path2D(glyph.path));
    const pixels=c.getImageData(0,0,88,88).data,points=[];
    for(let y=0;y<88;y+=2)for(let x=0;x<88;x+=2)if(pixels[(y*88+x)*4+3]>45)points.push({x:(x-44)/1.25,y:(y-44)/1.25,phase:random()*6.28,delay:random()*.5,color:index%2?'#f0d8a4':'#9effee'});
    return points;
  }
  glyphs.forEach((glyph,i)=>glyph.points=sampleGlyph(glyph,i));
  canvas.dataset.symbols=String(glyphs.length);canvas.dataset.symbolPoints=String(glyphs.reduce((n,g)=>n+g.points.length,0));canvas.dataset.globe='user-reference-and-projected-grid';
  function resize(){width=canvas.clientWidth;height=canvas.clientHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);requestDraw();}
  logo.onload=()=>{
    const sample=document.createElement('canvas');sample.width=220;sample.height=204;const c=sample.getContext('2d');c.drawImage(logo,0,0,220,204);const pixels=c.getImageData(0,0,220,204).data;
    for(let y=0;y<204;y+=2)for(let x=0;x<220;x+=2){const i=(y*220+x)*4;if(pixels[i+1]>46&&pixels[i+2]>35)logoPoints.push({x:(x-110)/220,y:(y-102)/220,color:`rgb(${Math.max(35,pixels[i])},${Math.min(255,pixels[i+1]+35)},${Math.min(255,pixels[i+2]+35)})`,angle:random()*6.28,radius:.6+random()*.55,delay:random()*.55});}
    canvas.dataset.points=String(logoPoints.length);requestDraw();
  };
  logo.onerror=()=>{canvas.dataset.logoError='true';splash.classList.add('welcome-logo-fallback');};
  reference.onload=requestDraw;reference.onerror=()=>{canvas.dataset.referenceError='true';};
  logo.src='./logo%20VITARA.jpeg';reference.src='./assets/welcome/globo-referencia.png';
  function grid(cx,cy,r,t,staticMode){
    const rotation=staticMode?.15:t*.025;
    function project(lat,lon){const x=Math.cos(lat)*Math.sin(lon+rotation),y=Math.sin(lat),z=Math.cos(lat)*Math.cos(lon+rotation);return{x:cx+r*x,y:cy-r*y*.99,z};}
    ctx.lineWidth=.65;
    const drawLine=points=>{ctx.beginPath();let drawing=false;for(const p of points){if(p.z<-.04){drawing=false;continue;}if(!drawing)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);drawing=true;}ctx.stroke();};
    ctx.strokeStyle='#54d9f047';
    for(let lat=-60;lat<=60;lat+=20)drawLine(Array.from({length:85},(_,i)=>project(lat*Math.PI/180,i/84*Math.PI*2)));
    for(let lon=0;lon<360;lon+=24)drawLine(Array.from({length:65},(_,i)=>project(-Math.PI/2+i/64*Math.PI,lon*Math.PI/180)));
    ctx.strokeStyle='#8cfbff8c';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#52c9e925';ctx.beginPath();ctx.arc(cx,cy,r*1.035,0,Math.PI*2);ctx.stroke();
  }
  function drawGlobe(cx,cy,r,t,staticMode){
    const p=ease(progress(t,.05,2,staticMode));ctx.save();ctx.globalAlpha=p;
    const glow=ctx.createRadialGradient(cx,cy,r*.58,cx,cy,r*1.22);glow.addColorStop(0,'#062b3d00');glow.addColorStop(.72,'#15c7ed0e');glow.addColorStop(.85,'#21dbf22b');glow.addColorStop(1,'#21dbf200');ctx.fillStyle=glow;ctx.fillRect(cx-r*1.3,cy-r*1.3,r*2.6,r*2.6);
    if(reference.complete&&reference.naturalWidth){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.34*p;ctx.beginPath();ctx.arc(cx,cy,r*1.08,0,Math.PI*2);ctx.clip();ctx.drawImage(reference,cx-r*1.5,cy-r*1.48,r*3,r*3);ctx.restore();}
    grid(cx,cy,r,t,staticMode);
    for(const needle of needles){const a=needle.angle+(staticMode?0:Math.sin(t*.14)*.015),start=r*1.015,end=r*(1.05+needle.span);ctx.globalAlpha=p*(.2+.55*needle.phase);ctx.strokeStyle='#37c9f3';ctx.lineWidth=needle.phase>.65?1.5:.6;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*start,cy+Math.sin(a)*start);ctx.lineTo(cx+Math.cos(a)*end,cy+Math.sin(a)*end);ctx.stroke();const pulse=staticMode?1:((t*.16+needle.phase)%1);ctx.fillStyle='#7ffaff';ctx.fillRect(cx+Math.cos(a)*(start+(end-start)*pulse)-1.2,cy+Math.sin(a)*(start+(end-start)*pulse)-1.2,2.4,2.4);}
    ctx.globalAlpha=p;ctx.strokeStyle='#5adfff4d';ctx.lineWidth=.8;
    for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(cx,cy+r*1.02,r*(.48+i*.29),r*(.07+i*.037),0,0,Math.PI*2);ctx.stroke();}
    for(const line of circuit){const a=line.angle,base=r*.7+(staticMode?.5:(t*.05+line.phase)%1)*r;const x=cx+Math.cos(a)*base,y=cy+r*1.02+Math.sin(a)*base*.16;ctx.strokeStyle='#65e5f33d';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*line.length,y+Math.sin(a)*line.length*.16);ctx.lineTo(x+Math.cos(a)*line.length+12,y+Math.sin(a)*line.length*.16);ctx.stroke();}
    ctx.restore();
  }
  function drawSymbols(cx,cy,r,t,staticMode){
    const mini=width<550,rx=Math.min(width*.385,r*1.38),ry=r*.86,iconSize=mini?.46:.65;
    for(let i=0;i<glyphs.length;i++){
      const a=(i*60-60)*Math.PI/180,x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry,p=ease(progress(t,.8+i*.09,2.6,staticMode));
      ctx.save();ctx.globalAlpha=p;ctx.strokeStyle='#73eae54d';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r*.64,cy+Math.sin(a)*r*.64);ctx.quadraticCurveTo(x,cy,x,y);ctx.stroke();ctx.fillStyle='#052338ee';ctx.beginPath();ctx.arc(x,y,mini?20:29,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#6bebea66';ctx.stroke();
      ctx.strokeStyle=i%2?'#e9d3a875':'#8ff9e877';ctx.setLineDash([2,5]);ctx.beginPath();ctx.arc(x,y,mini?24:34,-Math.PI*.5,Math.PI*1.2*p);ctx.stroke();ctx.setLineDash([]);
      for(const point of glyphs[i].points){const q=ease(progress(t,1.05+i*.1+point.delay,2.5,staticMode)),radius=(1-q)*Math.min(width*.3,180),angle=point.phase+(1-q)*3;const px=x+point.x*iconSize*q+Math.cos(angle)*radius,py=y+point.y*iconSize*q+Math.sin(angle)*radius;ctx.globalAlpha=.6+.4*q;ctx.fillStyle=point.color;ctx.fillRect(px,py,mini?1.1:1.4,mini?1.1:1.4);if(q<.96&&point.phase>5.8){ctx.strokeStyle='#7dffe658';ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+5*(1-q),py-4);ctx.stroke();}}
      ctx.globalAlpha=p;ctx.font=`${mini?6:8}px monospace`;ctx.textAlign='center';ctx.fillStyle='#a0d9de';ctx.fillText(glyphs[i].label,x,y+(mini?36:47));ctx.restore();
    }
  }
  function draw(now){
    frame=0;if(splash.hidden||document.hidden)return;
    const staticMode=reduced.matches||document.documentElement.dataset.movimiento==='reducido';
    if(!staticMode&&now-lastDraw<32){requestDraw();return;}lastDraw=now;
    const t=(now-started)/1000,cx=width/2,cy=height*.39,r=Math.min(width*.30,height*.245,245),logoScale=r*1.40;
    ctx.clearRect(0,0,width,height);
    for(const star of stars){ctx.globalAlpha=star.z*(staticMode?.5:.25+.35*Math.sin(t*.6+star.phase)**2);ctx.fillStyle=star.phase>5?'#c6a2e8':'#63dff5';ctx.fillRect(star.x*width,star.y*height,star.z*2,star.z*2);}ctx.globalAlpha=1;
    drawGlobe(cx,cy,r,t,staticMode);
    // Dark lens keeps the logo legible within the illuminated geographic structure.
    const lens=ctx.createRadialGradient(cx,cy,0,cx,cy,r*.83);lens.addColorStop(0,'#001721dd');lens.addColorStop(.7,'#001721ae');lens.addColorStop(1,'#00172100');ctx.fillStyle=lens;ctx.fillRect(cx-r,cy-r,r*2,r*2);
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<logoPoints.length;i++){const p=logoPoints[i],q=ease(progress(t,.15+p.delay,3.2,staticMode)),angle=p.angle+(1-q)*4;const x=cx+p.x*logoScale*q+Math.cos(angle)*width*p.radius*(1-q),y=cy+p.y*logoScale*q+Math.sin(angle)*height*.65*p.radius*(1-q);ctx.globalAlpha=staticMode?.95:.68+.3*Math.sin(i+t*1.3)**2;ctx.fillStyle=p.color;ctx.fillRect(x,y,width<550?1.2:1.8,width<550?1.2:1.8);if(i%27===0&&q<.98){ctx.strokeStyle='#6effd657';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+10*(1-q),y-12*(1-q));ctx.stroke();}}
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';drawSymbols(cx,cy,r,t,staticMode);
    canvas.dataset.assembly=staticMode||t>4.8?'assembled':'forming';
    if(!staticMode)requestDraw();
  }
  function requestDraw(){if(!frame&&!splash.hidden&&!document.hidden)frame=requestAnimationFrame(draw);}
  function stop(){cancelAnimationFrame(frame);frame=0;}
  function restart(){stop();started=performance.now();lastDraw=-Infinity;requestDraw();}
  new MutationObserver(()=>{if(splash.hidden)stop();else restart();}).observe(splash,{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(()=>{lastDraw=-Infinity;requestDraw();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-movimiento']});
  new ResizeObserver(resize).observe(canvas);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else requestDraw();});reduced.addEventListener('change',()=>{lastDraw=-Infinity;requestDraw();});
  resize();
})();
