const assert=require('node:assert/strict');
const Session=require('../frontend/engine.js');
const make=(condition='negative_reinforcement',caregiver='stop')=>new Session({trials:5,duration:30,interval:40,condition,caregiver});
for(const condition of ['negative_reinforcement','extinction','no_barking']){
 const s=make(condition);assert.equal(s.rows.length,1);assert.equal(s.rows[0].onset_ms,0);
 for(const t of [29999,30000,59999,60000,90000,120000,149999]){
  s.advance(t);assert.equal(s.running,true);assert.equal(s.barking,condition!=='no_barking');
 }
 assert.deepEqual(s.rows.map(r=>r.onset_ms),[0,30000,60000,90000,120000]);
 assert.equal(s.events.filter(e=>e.type==='barking_offset').length,0);
 s.advance(150000);assert.equal(s.running,false);assert.equal(s.barking,false);
 assert.equal(s.time,150000);assert.equal(s.rows.length,5);assert.equal(s.respond('stop',150001),null);
}
for(const target of ['stop','pet']){
 const s=make('negative_reinforcement',target),other=target==='stop'?'pet':'stop';
 for(const a of ['sit','praise',other]){s.respond(a,1000);assert.equal(s.barking,true);}
 s.respond(target,2000);assert.equal(s.barking,false);assert.equal(s.posture,'sitting');
 s.respond(target,3000);assert.equal(s.rows[0].target_count,2);
 s.advance(29999);assert.equal(s.barking,false);
 s.advance(30000);assert.equal(s.barking,true);assert.equal(s.posture,'standing');
 s.respond(target,30000);assert.equal(s.responses.at(-1).trial,2);assert.equal(s.rows[1].first_target_latency_ms,0);
 const e=make('extinction',target);
 for(let t=1000;t<150000;t+=1000){e.respond(target,t);assert.equal(e.barking,true);}
 e.advance(150000);assert.equal(e.running,false);assert.equal(e.time,150000);
 assert.equal(e.events.filter(x=>x.type==='barking_offset').length,1);
}
let s=make();s.stop(12500);assert.equal(s.running,false);assert.equal(s.reason,'participant_ended');
assert.equal(s.rows[0].actual_end_ms,12500);assert.equal(s.rows[0].actual_offset_ms,12500);
s=make('extinction');s.advance(999999);assert.equal(s.rows.length,5);assert.equal(s.time,150000);
console.log('PASS: contiguous five-trial schedule, no automatic relief, both targets, continuous extinction, exact end, early exit and exports');
