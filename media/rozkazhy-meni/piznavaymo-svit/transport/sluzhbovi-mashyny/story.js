const cfg=window.SCENE,voice=document.getElementById('voice'),start=document.getElementById('start'),caption=document.getElementById('caption'),bar=document.getElementById('progress'),scene=document.getElementById('scene');
const sceneOrder=['pozhezhna','shvydka','politsiia','smittievoz','pidmitalna','snihoprybyralna','poshtovyi-furhon','evakuator'];
const sceneSlug=location.pathname.split('/').filter(Boolean).at(-2),sceneIndex=sceneOrder.indexOf(sceneSlug);
let engineAudio=null;
scene.dataset.direction=sceneIndex%2===1?'left':'right';
if(!scene.classList.contains('no-traffic')){
  const trafficOne=document.createElement('img'),trafficTwo=document.createElement('img');
  trafficOne.className='traffic-car one';trafficOne.alt='';trafficOne.src='/media/pograymo/assets/illustrations/transport/city-car-blue.webp';
  trafficTwo.className='traffic-car two';trafficTwo.alt='';trafficTwo.src='/media/pograymo/assets/illustrations/transport/convertible-red.webp';
  scene.prepend(trafficTwo);scene.prepend(trafficOne);
}
function stopEngine(){if(!engineAudio)return;engineAudio.pause();engineAudio.currentTime=0;engineAudio=null}
function startEngine(){stopEngine();engineAudio=new Audio('/audio/games/sfx/car_drive_soft.mp3');engineAudio.loop=true;engineAudio.volume=.28;engineAudio.play().catch(()=>{engineAudio=null})}
function reset(){stopEngine();scene.classList.remove('playing','leaving');caption.textContent=cfg.ready;bar.style.width='0';start.hidden=false;start.style.background='';start.style.alignItems='center';start.style.paddingBottom='0';start.querySelector('span').textContent='↻ Послухати ще раз'}
function play(){start.hidden=true;voice.currentTime=0;startEngine();voice.volume=1;scene.classList.remove('playing','leaving');void scene.offsetWidth;scene.classList.add('playing');caption.textContent=cfg.lines[0].text;voice.play().catch(reset)}
start.addEventListener('click',()=>{if(start.querySelector('span').textContent.includes('всю історію'))location.href=cfg.restart;else play()});
voice.addEventListener('timeupdate',()=>{const t=voice.currentTime,d=voice.duration||cfg.duration;bar.style.width=`${Math.min(100,t/d*100)}%`;let line=cfg.lines[0].text;for(const item of cfg.lines)if(t>=item.at)line=item.text;caption.textContent=line});
voice.addEventListener('ended',()=>{stopEngine();bar.style.width='100%';scene.classList.remove('playing');scene.classList.add('leaving');setTimeout(()=>{if(new URLSearchParams(location.search).get('mode')==='story'&&cfg.next){location.href=cfg.next;return}scene.classList.remove('leaving');start.hidden=false;if(cfg.restart){start.style.background='transparent';start.style.alignItems='end';start.style.paddingBottom='15%';start.querySelector('span').textContent='↻ Подивитися всю історію ще раз'}else start.querySelector('span').textContent='↻ Послухати ще раз'},850)});
if(new URLSearchParams(location.search).get('mode')==='story')setTimeout(()=>{play();setTimeout(()=>{if(voice.paused&&voice.currentTime<.1)reset()},650)},220);
