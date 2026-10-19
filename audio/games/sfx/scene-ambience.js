'use strict';
(()=>{
 const config=document.currentScript,voice=document.getElementById('voice');
 if(!voice||!config.dataset.ambience)return;
 const continuous=config.dataset.continuous==='true';
 const bg=new Audio(config.dataset.ambience);bg.loop=true;bg.preload='none';
 let started=false,leaving=false;
 function allowed(){return !leaving&&!document.hidden&&!voice.muted&&started&&(continuous||!voice.paused)&&!document.querySelector('.stage.night-scene')}
 function sync(){
  bg.muted=voice.muted;bg.volume=voice.paused?.18:.10;
  if(allowed()){bg.play().then(()=>{if(!allowed())bg.pause()}).catch(()=>{})}
  else bg.pause();
 }
 voice.addEventListener('play',()=>{started=true;sync()});
 for(const event of ['pause','ended','volumechange','error'])voice.addEventListener(event,sync);
 document.addEventListener('visibilitychange',sync);
 document.addEventListener('pointerdown',()=>{if(started)sync()});
 window.addEventListener('pagehide',()=>{leaving=true;bg.pause()});
})();