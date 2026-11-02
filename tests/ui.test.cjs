const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
let clock=0,messageHandler;
class Element{
 constructor(){this.value='';this.checked=false;this.hidden=false;this.readyState=4;this.duration=8;this.currentTime=0;this.paused=true;this.listeners={};this.style={};}
 addEventListener(n,fn){this.listeners[n]=fn;}removeEventListener(){}replaceChildren(){}insertBefore(){}load(){}pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}click(){}
}
const html=fs.readFileSync('frontend/index.html','utf8'),elements={};for(const m of html.matchAll(/id="([^"]+)"/g))elements[m[1]]=new Element();
for(const [key,value]of Object.entries({participant:'TEST',caregiver:'stop',condition:'negative_reinforcement',trials:'5',duration:'30'}))elements[key].value=value;
const context=vm.createContext({document:{getElementById:id=>{assert.ok(elements[id],id);return elements[id];},createElement:()=>new Element(),documentElement:{scrollHeight:900},body:new Element(),addEventListener(){}},window:{addEventListener:(n,fn)=>{messageHandler=fn;}},parent:{postMessage(){}},ResizeObserver:class{observe(){}},performance:{now:()=>clock},crypto:{randomUUID:()=> 'test'},setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},confirm:()=>true,console,Blob,URL});
vm.runInContext(fs.readFileSync('frontend/engine.js','utf8'),context);vm.runInContext(fs.readFileSync('frontend/task.js','utf8'),context);
(async()=>{
 const run=code=>vm.runInContext(code,context);
 messageHandler({data:{type:'streamlit:render',args:{available_media:run('planned.slice()')}}});
 await elements.settings.onsubmit({preventDefault(){}});assert.equal(elements.start.disabled,false);
 elements.start.onclick();assert.equal(run('config.interval'),30);
 assert.equal(run('activeName'),'Standing Barking 1.mp4');
 clock=1000;elements.sit.onclick();assert.equal(run('activeName'),'Standing to Sitting Barking 5.mov');
 elements.reprimand.onclick();assert.equal(run('activeName'),'Sitting Quiet 4.mov');assert.equal(run('active.muted'),true);
 clock=30000;run('tick()');assert.equal(run('activeName'),'Standing Barking 1.mp4');
 elements.praise.onclick();assert.equal(run('model.barking'),true);
 elements.pet.onclick();assert.equal(run('model.barking'),true);
 elements.stop.onclick();assert.equal(elements.done.hidden,false);assert.equal(run('model.reason'),'participant_ended');
 assert.equal(run('[...players.values()].every(p=>p.paused)'),true);
 elements.reset.onclick();elements.condition.value='extinction';await elements.settings.onsubmit({preventDefault(){}});
 elements.start.onclick();
 for(const offset of [1000,30000,60000,90000,120000,149999]){
  clock=30000+offset;run('tick()');elements.reprimand.onclick();
  assert.equal(run('model.barking'),true);assert.equal(elements.task.hidden,false);
 }
 clock=180000;run('tick()');assert.equal(elements.done.hidden,false);
 assert.equal(run('model.rows.length'),5);assert.equal(run('model.time'),150000);
 assert.equal(run('[...players.values()].every(p=>p.paused)'),true);
 assert.equal(run('[...voices.values()].every(p=>p.paused)'),true);
 assert.match(run('fullData().timing_policy'),/extinction continuous/);
 assert.match(html,/>I’m done<\/button>/);
 console.log('PASS: immediate barking, seated relief, trial restart, non-target responses, I’m done, continuous extinction and final media stop');
})().catch(e=>{console.error(e);process.exitCode=1;});
