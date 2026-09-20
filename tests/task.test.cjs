const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
let clock=0,nextId=0;const timers=new Map();
function el(id){return {id,value:'',hidden:false,disabled:false,readyState:4,dataset:{},classList:{add(){},remove(){},contains(){return false}},addEventListener(type,fn){this[type]=fn},pause(){this.paused=true},play(){this.paused=false;return Promise.resolve()},click(){},textContent:''};}
const elements=new Map();const get=id=>{if(!elements.has(id))elements.set(id,el(id));return elements.get(id)};
const buttons=['pet','toy','scold'].map(response=>Object.assign(el(response),{dataset:{response}}));
const context=vm.createContext({console,performance:{now:()=>clock},Date,Math,crypto:require('node:crypto').webcrypto,setTimeout:(fn,delay)=>{const id=++nextId;timers.set(id,{fn,at:clock+delay});return id},clearTimeout:id=>timers.delete(id),parent:{postMessage(){}},ResizeObserver:class{observe(){}},window:{addEventListener(){}},document:{getElementById:get,querySelectorAll:()=>buttons,body:el('body'),documentElement:{scrollHeight:740},addEventListener(){},createElement:()=>el('a')},confirm:()=>true});
vm.runInContext(fs.readFileSync('frontend/task.js','utf8'),context);
const run=s=>vm.runInContext(s,context);
async function tick(ms){const target=clock+ms;while(true){const due=[...timers].filter(([,v])=>v.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;clock=due[1].at;timers.delete(due[0]);due[1].fn();await new Promise(setImmediate)}clock=target;}
(async()=>{
run("config={participant:'test',condition:'tangible',trials:5,limit:20,gap:1,initial:50,minimum:10,maximum:90,step:10};$('start').onclick()");await new Promise(setImmediate);
assert.equal(run('current.barking'),true);assert.equal(run('phase'),'trial');
await tick(19000);run("choose('toy')");await Promise.resolve();
assert.equal(run('probability'),60);assert(buttons.every(b=>b.disabled));run("choose('pet')");assert.equal(run('current.response'),'toy');
await tick(10000);assert.equal(run('phase'),'outcome');run("outcome.ended()");assert.equal(run('phase'),'gap');assert.equal(run('session.trials[0].duration_ms'),29000);
// Force subsequent barking for deterministic timeout testing.
run('probability=100');await tick(1000);assert.equal(run('phase'),'trial');run("choose('pet')");assert.equal(run('probability'),90);await tick(19999);assert.equal(run('phase'),'trial');await tick(1);assert.equal(run('phase'),'gap');assert.equal(run('session.trials[1].duration_ms'),20000);
// Quiet trial with no response or probability update.
run('probability=0');await tick(1000);assert.equal(run('current.barking'),false);assert(buttons.every(b=>b.disabled));run("choose('toy')");assert.equal(run('current.response'),null);await tick(20000);assert.equal(run('probability'),0);
// No response on a barking trial.
run('probability=100');await tick(1000);await tick(20000);assert.equal(run('session.trials[3].response'),null);assert.equal(run('probability'),100);
await tick(1000);run("finish('participant_ended')");assert.equal(run('session.trials.length'),5);assert.equal(run('phase'),'done');await tick(30000);assert.equal(run('phase'),'done');
console.log('PASS: first barking, late outcome beyond timeout, one response, lockout, exact simulated trial/gap timing, probability changes, quiet/no-response trials, early stop');
})().catch(e=>{console.error(e);process.exitCode=1});
