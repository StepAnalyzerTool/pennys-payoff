const assert=require('node:assert/strict');
const Session=require('../frontend/engine.js');
const defaults={trials:5,duration:20,interval:40,extinctionDelay:5,condition:'negative_reinforcement',caregiver:'stop'};
const make=(extra={})=>new Session({...defaults,...extra});
// Quiet-period responses neither postpone the schedule nor cause barking.
let s=make();s.respond('target',1000);s.respond('sit',2000);assert.equal(s.posture,'sitting');s.advance(40000);assert.equal(s.posture,'standing');assert.equal(s.barking,true);
s.respond('sit',41000);assert.equal(s.barking,true);s.respond('target',42000);assert.equal(s.barking,false);assert.equal(s.posture,'sitting');s.respond('target',43000);assert.equal(s.rows[0].target_count,2);assert.equal(s.rows[0].first_target_latency_ms,2000);s.advance(80000);assert.equal(s.barking,true);assert.equal(s.posture,'standing');
// Extinction resets only with the target, not Sit; the 20-s window remains fixed.
s=make({condition:'extinction'});s.advance(40000);s.respond('target',58000);s.respond('target',62000);s.respond('sit',66000);s.advance(66999);assert.equal(s.barking,true);s.advance(67000);assert.equal(s.barking,false);assert.equal(s.rows[0].actual_offset_ms,67000);assert.equal(s.rows[0].target_count,1);assert.equal(s.responses[1].period,'extinction_extension');s.advance(80000);assert.equal(s.rows[1].onset_ms,80000);
// Continuous responding cannot be terminated accidentally by the next onset.
s=make({condition:'extinction'});s.advance(40000);for(let t=58000;t<82000;t+=4000)s.respond('target',t);s.advance(81000);assert.equal(s.barking,true);assert.equal(s.rows[1].skipped,true);s.advance(83000);assert.equal(s.barking,false);
// No barking: same posture reset and measurement windows, no effects on sound.
s=make({condition:'no_barking'});s.advance(40000);s.respond('sit',41000);s.respond('target',42000);assert.equal(s.barking,false);assert.equal(s.rows[0].target_occurred,true);s.advance(80000);assert.equal(s.posture,'standing');s.advance(240000);assert.equal(s.running,false);assert.equal(s.rows.length,5);
// No response ends barking at 20 s; late clicks are quiet responses.
s=make();s.advance(60000);assert.equal(s.barking,false);s.respond('target',60001);assert.equal(s.rows[0].target_count,0);
// Pet has the same functional contingency as Stop Barking.
s=make({caregiver:'pet'});s.advance(40000);s.respond('target',40100);assert.equal(s.barking,false);
// Final extinction extension is not cut off by nominal session end.
s=make({trials:1,condition:'extinction'});for(let t=58000;t<=82000;t+=4000)s.respond('target',t);assert.equal(s.running,true);s.advance(87000);assert.equal(s.running,false);assert.equal(s.reason,'completed');assert.equal(s.time,87000);
console.log('PASS: fixed onsets, quiet responses, posture, repeated responses, NR, extinction, overlap, no-barking and final extension');
