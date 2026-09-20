const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
let clock=0,messageHandler;
class Element{
 constructor(){this.value='';this.checked=false;this.hidden=false;this.readyState=4;this.duration=8;this.currentTime=0;this.paused=true;this.listeners={};this.style={};}
 addEventListener(n,fn){this.listeners[n]=fn;}removeEventListener(){}replaceChildren(){}insertBefore(){}load(){}pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}click(){}
}
const html=fs.readFileSync('frontend/index.html','utf8'),elements={};for(const m of html.matchAll(/id="([^"]+)"/g))elements[m[1]]=new Element();
for(const [key,value]of Object.entries({participant:'TEST',caregiver:'stop',condition:'negative_reinforcement',trials:'5',duration:'20',interval:'40',extinctionDelay:'5'}))elements[key].value=value;elements.preview.checked=true;
const context=vm.createContext({document:{getElementById:id=>{assert.ok(elements[id],id);return elements[id];},createElement:()=>new Element(),documentElement:{scrollHeight:900},body:new Element(),addEventListener(){}},window:{addEventListener:(n,fn)=>{messageHandler=fn;}},parent:{postMessage(){}},ResizeObserver:class{observe(){}},performance:{now:()=>clock},crypto:{randomUUID:()=> 'test'},setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},confirm:()=>true,console,Blob,URL});
vm.runInContext(fs.readFileSync('frontend/engine.js','utf8'),context);vm.runInContext(fs.readFileSync('frontend/task.js','utf8'),context);
(async()=>{
 messageHandler({data:{type:'streamlit:render',args:{available_media:['barking.mp4','sound-check.mp3']}}});assert.equal(elements.prepare.disabled,false);
 await elements.settings.onsubmit({preventDefault(){}});assert.equal(elements.start.disabled,false);elements.start.onclick();assert.equal(elements.task.hidden,false);assert.equal(elements.target.disabled,false);
 clock=1000;elements.sit.onclick();assert.match(elements['placeholder'].textContent,/sitting/);
 clock=40000;vm.runInContext('tick()',context);assert.match(elements['preview-state'].textContent,/standing.*barking/);
 elements.target.onclick();assert.match(elements['placeholder'].textContent,/quiet/);assert.equal(elements.target.disabled,false);
 elements.target.onclick();assert.equal(vm.runInContext('model.responses.length',context),3);
 elements.stop.onclick();assert.equal(elements.done.hidden,false);
 elements.reset.onclick();elements.preview.checked=false;await elements.settings.onsubmit({preventDefault(){}});assert.match(elements.error.textContent,/Upload these clips/);
 console.log('PASS: media discovery, preview setup, quiet Sit, scheduled barking, repeated target, stop, missing-asset gate');
})().catch(e=>{console.error(e);process.exitCode=1;});
