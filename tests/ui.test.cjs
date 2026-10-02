const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
let clock=0,messageHandler;
class Element{
 constructor(){this.value='';this.checked=false;this.hidden=false;this.readyState=4;this.duration=8;this.currentTime=0;this.paused=true;this.listeners={};this.style={};}
 addEventListener(n,fn){this.listeners[n]=fn;}removeEventListener(){}replaceChildren(){}insertBefore(){}load(){}pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}click(){}
}
const html=fs.readFileSync('frontend/index.html','utf8'),elements={};for(const m of html.matchAll(/id="([^"]+)"/g))elements[m[1]]=new Element();
for(const [key,value]of Object.entries({participant:'TEST',caregiver:'stop',condition:'negative_reinforcement',trials:'5',duration:'20',interval:'40',extinctionDelay:'5'}))elements[key].value=value;
const context=vm.createContext({document:{getElementById:id=>{assert.ok(elements[id],id);return elements[id];},createElement:()=>new Element(),documentElement:{scrollHeight:900},body:new Element(),addEventListener(){}},window:{addEventListener:(n,fn)=>{messageHandler=fn;}},parent:{postMessage(){}},ResizeObserver:class{observe(){}},performance:{now:()=>clock},crypto:{randomUUID:()=> 'test'},setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},confirm:()=>true,console,Blob,URL});
vm.runInContext(fs.readFileSync('frontend/engine.js','utf8'),context);vm.runInContext(fs.readFileSync('frontend/task.js','utf8'),context);
(async()=>{
 const files=vm.runInContext('planned.slice()',context);
 messageHandler({data:{type:'streamlit:render',args:{available_media:[...files,'sound-check.mp3']}}});assert.equal(elements.prepare.disabled,false);
 
 await elements.settings.onsubmit({preventDefault(){}});assert.equal(elements.start.disabled,false);elements.start.onclick();
 assert.equal(elements.task.hidden,false);
 const run=code=>vm.runInContext(code,context);
 assert.equal(run('active.muted'),true);assert.equal(run('active.loop'),true);
 clock=1000;elements.sit.onclick();assert.match(run('activeName'),/Standing to Sitting Quiet/);
 assert.equal(run('active.loop'),false);assert.equal(run("voices.get(recordings.sit).paused"),false);
 run("active.listeners.ended()");assert.match(run('activeName'),/Sitting Quiet/);assert.equal(run('active.loop'),true);
 clock=40000;run('tick()');assert.match(run('activeName'),/Standing Barking/);assert.equal(run('active.muted'),false);
 elements.pet.onclick();assert.match(run('activeName'),/Standing Petted Barking/);assert.equal(run('model.barking'),true);
 run('active.currentTime=3');elements.pet.onclick();assert.equal(run('active.currentTime'),3);
 elements.praise.onclick();assert.equal(run('model.barking'),true);assert.equal(run('active.currentTime'),3);
 elements.reprimand.onclick();assert.match(run('activeName'),/Standing Petted Quiet/);assert.equal(run('active.muted'),true);assert.equal(run('active.currentTime'),3);
 assert.equal(run('model.responses.length'),5);run('active.listeners.ended()');assert.match(run('activeName'),/Standing Quiet/);
 for(const id of ['sit','pet','praise','reprimand'])assert.equal(elements[id].disabled,false);
 elements.stop.onclick();assert.equal(elements.done.hidden,false);assert.equal(run('[...voices.values()].every(a=>a.paused)'),true);
 elements.reset.onclick();elements.caregiver.value='pet';await elements.settings.onsubmit({preventDefault(){}});elements.start.onclick();
 clock+=40000;run('tick()');elements.reprimand.onclick();assert.equal(run('model.barking'),true);
 elements.sit.onclick();assert.match(run('activeName'),/Standing to Sitting Barking/);elements.pet.onclick();assert.match(run('activeName'),/Sitting Petted Quiet/);assert.equal(run('model.barking'),false);
 elements.stop.onclick();elements.reset.onclick();messageHandler({data:{type:'streamlit:render',args:{available_media:[]}}});await elements.settings.onsubmit({preventDefault(){}});assert.match(elements.error.textContent,/Missing media files/);
 console.log('PASS: media discovery, four buttons, both targets, audio, mute rules, one-shot actions, seated bases, missing-media gate');
})().catch(e=>{console.error(e);process.exitCode=1;});
