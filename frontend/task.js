'use strict';
const $=id=>document.getElementById(id);
const clips={
 'standing-barking':'Standing Barking 1.mp4','standing-quiet':'Standing Quiet 2.mp4',
 'sitting-barking':'Sitting Barking 3.mov','sitting-quiet':'Sitting Quiet 4.mov',
 'sit-barking':'Standing to Sitting Barking 5.mov','sit-quiet':'Standing to Sitting Quiet 6.mov',
 'standing-pet-barking':'Standing Petted Barking 7.mp4','standing-pet-quiet':'Standing Petted Quiet 8.mp4',
 'sitting-pet-barking':'Sitting Petted Barking 9.mov','sitting-pet-quiet':'Sitting Petted Quiet 10.mov'
};
const recordings={stop:'Penny Stop Barking Audio.m4a',sit:'Penny Sit Audio.m4a',praise:'Good Girl Penny Audio.m4a'};
const labels={stop:'Penny, stop barking!',pet:'Pet Penny',sit:'Sit!',praise:'Good girl, Penny!'};
const buttons={stop:'reprimand',pet:'pet',sit:'sit',praise:'praise'};
const planned=[...Object.values(clips),...Object.values(recordings)];
const voices=new Map();
function voice(name){if(!voices.has(name)){const a=document.createElement('audio');a.src='media/'+encodeURIComponent(name);a.preload='auto';voices.set(name,a);}return voices.get(name);}
function speak(which){
 for(const a of voices.values())a.pause();
 const name=recordings[which];if(!name||!available.has(name))return;
 const a=voice(name);a.currentTime=0;
 a.play().catch(err=>{if(err.name!=='AbortError'&&phase==='running')end('command_audio_playback_error: '+name);});
}
let available=new Set(),config,model,startClock,sessionId,startedUtc,ticker,action=null,active=null,activeName='',observedTrials=0,phase='setup',feedbackTimer;
const players=new Map();
function send(type,extra={}){parent.postMessage({isStreamlitMessage:true,type,...extra},'*');}
function resize(){send('streamlit:setFrameHeight',{height:Math.max(700,document.documentElement.scrollHeight)});}
new ResizeObserver(resize).observe(document.body);
function show(id){for(const name of ['setup','ready','task','done'])$(name).hidden=name!==id;resize();}
function required(c){const sounds=c.condition==='no_barking'?['quiet']:['quiet','barking'];return [...sounds.flatMap(s=>['standing','sitting','sit','standing-pet','sitting-pet'].map(k=>clips[k+'-'+s])),...Object.values(recordings)];}
window.addEventListener('message',e=>{
 if(e.data?.type!=='streamlit:render')return;
 available=new Set(e.data.args?.available_media??[]);
 $('assets').replaceChildren(...planned.map(name=>{const line=document.createElement('div');line.textContent=(available.has(name)?'Available: ':'Pending: ')+name;return line;}));
 $('media-status').textContent=`${Object.values(clips).filter(n=>available.has(n)).length} of 10 videos and ${Object.values(recordings).filter(n=>available.has(n)).length} of 3 command recordings uploaded. Sound check ${available.has('sound-check.mp3')?'available':'missing'}. Quiet videos are muted; spoken button recordings remain audible.`;
 $('prepare').disabled=false;$('prepare').textContent='Prepare session';resize();
});
send('streamlit:componentReady',{apiVersion:1});
function elapsed(){return performance.now()-startClock;}
function pauseMedia(){for(const p of players.values()){p.pause();p.hidden=true;}active=null;activeName='';}
function getPlayer(name){
 if(players.has(name))return players.get(name);
 const p=document.createElement('video');p.src='media/'+encodeURIComponent(name);p.playsInline=true;p.preload='auto';p.hidden=true;
 p.addEventListener('error',()=>{if(phase==='running')end('media_error: '+name);});
 p.addEventListener('waiting',()=>{if(phase==='running'&&p===active)model.event('video_waiting',elapsed(),{file:name});});
 p.addEventListener('ended',()=>{
  if(phase!=='running'||p!==active)return;
  if(action){action=null;render(true);}else {p.currentTime=0;p.play().catch(()=>end('media_playback_error'));}
 });
 $('stage').insertBefore(p,$('placeholder'));players.set(name,p);return p;
}
async function preload(names){
 await Promise.all(names.map(name=>new Promise((resolve,reject)=>{
  const p=Object.values(recordings).includes(name)?voice(name):getPlayer(name);if(p.readyState>=3){resolve();return;}
  const timeout=setTimeout(()=>finish(Error('A video could not load. Check the connection and try again.')),20000);
  function finish(err){clearTimeout(timeout);p.removeEventListener('canplay',ok);p.removeEventListener('error',bad);err?reject(err):resolve();}
  function ok(){finish();}function bad(){finish(Error('Unable to load '+name));}
  p.addEventListener('canplay',ok);p.addEventListener('error',bad);p.load();
 })));
}
$('settings').onsubmit=async e=>{
 e.preventDefault();config={participant:$('participant').value.trim(),caregiver:$('caregiver').value,condition:$('condition').value,preview:$('preview').checked};
 for(const k of ['trials','duration','interval','extinctionDelay'])config[k]=Number($(k).value);
 if(!config.participant||config.interval<=config.duration){$('error').textContent='Enter a participant ID and an onset interval longer than the trial window.';return;}
 const missing=required(config).filter(n=>!available.has(n));
 if(!config.preview&&missing.length){$('error').textContent='Upload these clips or enable researcher preview: '+missing.join(', ');return;}
 $('error').textContent='';$('sound-check').pause();$('sound-check').currentTime=0;
 $('preview-notice').hidden=!config.preview;$('ready-error').textContent='';$('start').disabled=true;$('start').textContent='Loading videos and audio…';phase='ready';show('ready');
 const names=required(config).filter(n=>available.has(n));
 if(config.preview&&config.condition!=='no_barking'&&available.has('barking.mp4'))names.push('barking.mp4');
 try{await preload([...new Set(names)]);if(phase==='ready'){$('start').disabled=false;$('start').textContent='Start session';}}
 catch(err){$('ready-error').textContent=err.message;$('start').textContent='Videos unavailable';}
};
$('back').onclick=()=>{phase='setup';show('setup');};
$('start').onclick=()=>{
 sessionId=crypto.randomUUID();startedUtc=new Date().toISOString();startClock=performance.now();model=new PlaydateSession(config);observedTrials=0;action=null;
 phase='running';for(const id of Object.values(buttons))$(id).disabled=false;$('feedback').textContent='';show('task');
 render(true);ticker=setInterval(tick,25);
};
function tick(){
 if(phase!=='running')return;
 const t=elapsed();model.advance(t);
 if(!model.running){complete();return;}
 if(model.rows.length!==observedTrials){const fresh=model.rows.slice(observedTrials);if(fresh.some(r=>!r.skipped))action=null;observedTrials=model.rows.length;}
 render();
}
function filename(){
 const sound=model.barking?'barking':'quiet';
 const key=action?.kind==='pet'?model.posture+'-pet':action?.kind==='sit'?'sit':model.posture;
 return clips[key+'-'+sound];
}
function render(force=false){
 let name=filename(),fallback=false;
 if(!available.has(name)){fallback=true;name=model.barking&&available.has('barking.mp4')?'barking.mp4':'';}
 $('preview-state').hidden=!config.preview;
 $('preview-state').textContent=`Preview state: ${model.posture} · ${model.barking?'barking':'quiet'}${fallback?' · temporary visual':''}`;
 $('placeholder').hidden=!!name;
 if(!name){pauseMedia();$('placeholder').textContent=`Penny is ${model.posture} and ${model.barking?'barking (video pending)':'quiet'}.`;return;}
 if(name===activeName&&!force)return;
 const previousPosition=active?.currentTime??0;
 pauseMedia();activeName=name;const p=getPlayer(name);active=p;p.hidden=false;
 p.loop=!action;p.muted=!model.barking;
 let position=0;
 if(action&&action.clipName&&action.clipName!==name)position=Math.min(previousPosition,Math.max(0,(p.duration||8)-0.1));
 if(action)action.clipName=name;
 p.currentTime=position;
 p.play().catch(()=>{if(phase==='running'&&p===active)end('media_playback_error');});
}
function respond(which){
 if(phase!=='running')return;tick();if(phase!=='running')return;
 const t=elapsed(),r=model.respond(which,t);if(!r){complete();return;}
 let restart=false;
 if(which==='sit'&&r.posture_before==='standing'){action={kind:'sit'};restart=true;}
 if(which==='pet'&&action?.kind!=='pet'){action={kind:'pet'};restart=true;}
 // Every click is measured; repeated petting does not restart an ongoing animation.
 speak(which);
 $('feedback').textContent=labels[which];clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>$('feedback').textContent='',900);
 render(restart);
}
for(const [which,id] of Object.entries(buttons))$(id).onclick=()=>respond(which);
function end(reason){if(phase!=='running')return;model.stop(elapsed(),reason);complete();}
function complete(){
 clearInterval(ticker);pauseMedia();phase='done';for(const id of Object.values(buttons))$(id).disabled=true;for(const a of voices.values())a.pause();action=null;
 const skipped=model.rows.filter(r=>r.skipped).length;
 $('summary').textContent=`${model.responses.length} responses recorded; ${model.rows.length} scheduled trial onsets reached${skipped?`, ${skipped} skipped because extinction continued`:''}. ${model.reason==='completed'?'Session complete.':model.reason} Download your data before starting again.`;
 show('done');
}
$('stop').onclick=()=>end('participant_ended');
document.addEventListener('visibilitychange',()=>{if(phase==='running')model.event('visibility_change',elapsed(),{hidden:document.hidden});});
function fullData(){return {version:'0.3.0',title:'Penny’s Playdate',session_id:sessionId,started_utc:startedUtc,config,available_media:[...available],timing_policy:'fixed onsets; overlapping extinction onsets skipped; finish waits for ongoing extinction',end_reason:model.reason,elapsed_ms:model.time,trials:model.rows,responses:model.responses,events:model.events};}
function download(content,mime,ext){const url=URL.createObjectURL(new Blob([content],{type:mime})),a=document.createElement('a');a.href=url;a.download=`pennys-playdate-${sessionId}-${ext}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function csv(rows,name){const output=rows.map(row=>({session_id:sessionId,participant:config.participant,caregiver:config.caregiver,condition:config.condition,preview:config.preview,...row}));const keys=[...new Set(output.flatMap(Object.keys))];const esc=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';download([keys.map(esc).join(','),...output.map(r=>keys.map(k=>esc(r[k])).join(','))].join('\r\n'),'text/csv;charset=utf-8',name+'.csv');}
$('csv').onclick=()=>csv(model.rows,'trials');$('responses').onclick=()=>csv(model.responses,'responses');$('json').onclick=()=>download(JSON.stringify(fullData(),null,2),'application/json','session.json');
$('reset').onclick=()=>{if(confirm('Have you downloaded your data? Starting again clears this session.')){model=null;phase='setup';show('setup');}};

