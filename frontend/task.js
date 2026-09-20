'use strict';
const $ = id => document.getElementById(id);
const buttons = [...document.querySelectorAll('[data-response]')];
const bark = $('barking'), outcome = $('outcome');
let config, session, current, probability, phase = 'setup', timer, watchdog;
const now = () => performance.now();
function send(type, extra={}) { parent.postMessage({isStreamlitMessage:true,type,...extra}, '*'); }
send('streamlit:componentReady',{apiVersion:1});
function resize(){send('streamlit:setFrameHeight',{height:Math.max(740,document.documentElement.scrollHeight)});}
new ResizeObserver(resize).observe(document.body);
window.addEventListener('message',e=>{if(e.data?.type==='streamlit:render')resize();});
function show(id){for(const name of ['setup','ready','task','done'])$(name).hidden=name!==id;resize();}
function lock(){buttons.forEach(b=>b.disabled=true);}
function clearTimers(){clearTimeout(timer);clearTimeout(watchdog);}
function hideMedia(){bark.pause();outcome.pause();bark.hidden=true;outcome.hidden=true;$('quiet').hidden=true;}
function event(type,details={}){session?.events.push({type,utc:new Date().toISOString(),elapsed_ms:now()-session.startedClock,...details});}
function data(){const {startedClock,...rest}=session;return rest;}
function fail(message){if(['done','setup'].includes(phase))return;event('media_error',{message});finish('media_error: '+message);}
async function play(video){
  video.hidden=false;video.currentTime=0;
  watchdog=setTimeout(()=>fail('Video did not start within 15 seconds.'),15000);
  try{await video.play();clearTimeout(watchdog);return true;}catch(e){fail('Playback could not start. Check browser sound permissions.');return false;}
}
$('settings').addEventListener('submit',e=>{
  e.preventDefault();
  config={participant:$('participant').value.trim(),condition:$('condition').value};
  for(const key of ['trials','limit','gap','initial','step','minimum','maximum'])config[key]=Number($(key).value);
  if(!config.participant||config.minimum>config.maximum||config.initial<config.minimum||config.initial>config.maximum){$('error').textContent='Enter a participant ID and ensure minimum ≤ initial probability ≤ maximum.';return;}
  const soundCheck=$('sound-check');soundCheck.pause();soundCheck.currentTime=0;
  $('error').textContent='';phase='ready';show('ready');
  const check=()=>{if(bark.readyState>=3&&outcome.readyState>=3){$('start').disabled=false;$('start').textContent='Start session';}};
  bark.addEventListener('canplay',check);outcome.addEventListener('canplay',check);check();
});
$('start').onclick=()=>{
  session={version:'0.1.0',id:crypto.randomUUID(),started_utc:new Date().toISOString(),startedClock:now(),config:{...config},trials:[],events:[]};
  probability=config.initial;show('task');nextTrial();
};
async function nextTrial(){
  clearTimers();document.body.classList.remove('black');hideMedia();lock();buttons.forEach(b=>b.classList.remove('selected'));
  if(session.trials.length>=config.trials){finish('completed');return;}
  const number=session.trials.length+1, draw=number===1?null:Math.random();
  const barking=number===1||draw<probability/100;
  current={trial:number,forced_barking:number===1,random_draw:draw,barking,probability_before:probability,response:null,response_latency_ms:null,immediate_relief:false};
  $('progress').textContent=`Trial ${number} of ${config.trials}`;
  phase='loading';
  if(barking){if(!await play(bark)||phase!=='loading')return;}
  else $('quiet').hidden=false;
  current.onset_clock=now();current.onset_utc=new Date().toISOString();phase='trial';event('trial_onset',{trial:number,barking});
  if(barking)buttons.forEach(b=>b.disabled=false);
  timer=setTimeout(()=>endTrial('trial_limit'),config.limit*1000);
}
function choose(response){
  if(phase!=='trial'||current.response!==null||!current.barking)return;
  if(now()-current.onset_clock>=config.limit*1000){endTrial('trial_limit');return;}
  current.response=response;current.response_latency_ms=now()-current.onset_clock;lock();
  buttons.find(b=>b.dataset.response===response).classList.add('selected');
  const relief=response==='toy';current.immediate_relief=relief;
  probability=Math.max(config.minimum,Math.min(config.maximum,probability+(relief?config.step:-config.step)));
  event('response',{trial:current.trial,response,probability_after:probability});
  if(relief){clearTimers();phase='outcome';bark.pause();bark.hidden=true;play(outcome);}
}
buttons.forEach(b=>b.onclick=()=>choose(b.dataset.response));
outcome.addEventListener('ended',()=>{if(phase==='outcome')endTrial('outcome_finished');});
function saveTrial(reason){
  if(!current)return;
  const {onset_clock,...row}=current;
  row.duration_ms=onset_clock===undefined?null:now()-onset_clock;
  row.probability_after=probability;row.end_reason=reason;row.end_utc=new Date().toISOString();
  session.trials.push(row);current=null;
}
function endTrial(reason){
  if(!['trial','outcome'].includes(phase))return;
  clearTimers();saveTrial(reason);hideMedia();lock();phase='gap';document.body.classList.add('black');
  event('black_screen_onset');timer=setTimeout(nextTrial,config.gap*1000);
}
function finish(reason){
  clearTimers();hideMedia();lock();saveTrial(reason);phase='done';document.body.classList.remove('black');
  session.end_reason=reason;session.ended_utc=new Date().toISOString();event('session_end',{reason});
  show('done');$('summary').textContent=`${session.trials.length} trial records. ${reason==='completed'?'Session complete.':reason==='participant_ended'?'Session ended early.':reason} Download your data before starting again.`;
}
$('stop').onclick=()=>finish('participant_ended');
for(const video of [bark,outcome]){
 video.addEventListener('error',()=>{if(phase==='ready'){$('start').disabled=true;$('start').textContent='Video unavailable — reload and check media files';}else if(['trial','loading','outcome'].includes(phase))fail('Unable to load video.');});
 video.addEventListener('waiting',()=>{if(!video.paused)event('video_waiting',{video:video.id,trial:current?.trial});});
}
document.addEventListener('visibilitychange',()=>{if(session&&phase!=='done')event('visibility_change',{hidden:document.hidden});});
function download(content,mime,extension){const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=`pennys-payoff-${session.id}.${extension}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('json').onclick=()=>download(JSON.stringify(data(),null,2),'application/json','json');
$('csv').onclick=()=>{
 const rows=session.trials.map(row=>({session_id:session.id,participant:config.participant,condition:config.condition,...row}));
 const keys=rows.length?Object.keys(rows[0]):['session_id','participant','condition','trial'];
 const escape=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
 download([keys.map(escape).join(','),...rows.map(r=>keys.map(k=>escape(r[k])).join(','))].join('\r\n'),'text/csv;charset=utf-8','csv');
};
$('reset').onclick=()=>{if(confirm('Have you downloaded your data? Starting again clears this session.')){session=null;phase='setup';show('setup');}};
