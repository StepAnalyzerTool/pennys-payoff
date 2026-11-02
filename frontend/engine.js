/* Session clock is independent of media length. Trial windows are contiguous. */
(function(root){
'use strict';
class PlaydateSession {
 constructor(config){
  this.config={...config,interval:config.duration};
  if(!Number.isInteger(config.trials)||config.trials<1||!Number.isFinite(config.duration)||config.duration<=0)throw Error('Invalid session timing');
  this.time=0;this.running=true;this.posture='standing';this.barking=false;
  this.rows=[];this.responses=[];this.events=[];this.next=1;this.episode=null;this.reason=null;
  this.event('session_start',0);this.advance(0);
 }
 event(type,time,extra={}){this.events.push({type,elapsed_ms:time,...extra});}
 get stopAt(){return this.config.trials*this.config.duration*1000;}
 onset(n){return (n-1)*this.config.duration*1000;}
 closeWindow(time){
  const row=this.rows[this.rows.length-1];
  if(row&&row.actual_end_ms===null){row.actual_end_ms=time;row.barking_at_end=this.barking;}
 }
 silence(time,reason){
  if(!this.barking)return;
  for(const row of this.rows)if(row.barking_at_start&&row.actual_offset_ms===null)row.actual_offset_ms=time;
  this.event('barking_offset',time,{trial:this.rows.at(-1)?.trial,episode_trial:this.episode?.trial,reason});
  this.barking=false;this.episode=null;
 }
 finish(time,reason){
  this.closeWindow(time);this.silence(time,reason);this.running=false;this.reason=reason;this.time=time;
  this.event('session_end',time,{reason});
 }
 advance(time){
  if(!this.running)return;time=Math.max(this.time,time);
  while(this.next<=this.config.trials&&this.onset(this.next)<=time){
   const at=this.onset(this.next),n=this.next++;this.closeWindow(at);
   this.posture='standing';
   const wasBarking=this.barking;
   this.barking=this.config.condition!=='no_barking';
   const row={trial:n,onset_ms:at,window_end_ms:at+this.config.duration*1000,actual_end_ms:null,
    target_count:0,stop_count:0,pet_count:0,praise_count:0,sit_count:0,target_occurred:false,
    first_target_latency_ms:null,actual_offset_ms:null,barking_at_start:this.barking,barking_at_end:null,skipped:false};
   this.rows.push(row);this.event('trial_onset',at,{trial:n,barking:this.barking});
   if(this.barking&&!wasBarking){this.episode=row;this.event('barking_onset',at,{trial:n});}
  }
  if(time>=this.stopAt){this.finish(this.stopAt,'completed');return;}
  this.time=time;
 }
 respond(action,time){
  if(!['sit','stop','pet','praise'].includes(action))throw Error('Unknown response');
  this.advance(time);if(!this.running)return null;
  const row=this.rows.at(-1);
  const response={action,elapsed_ms:this.time,trial:row.trial,episode_trial:this.episode?.trial??null,
   period:'trial_window',posture_before:this.posture,barking_before:this.barking,
   terminated_barking:false,is_target:action===this.config.caregiver};
  row[action+'_count']++;
  if(action==='sit')this.posture='sitting';
  if(response.is_target){
   row.target_count++;row.target_occurred=true;
   if(row.first_target_latency_ms===null)row.first_target_latency_ms=this.time-row.onset_ms;
   if(this.barking&&this.config.condition==='negative_reinforcement'){
    response.terminated_barking=true;this.silence(this.time,'target_response');
   }
  }
  response.posture_after=this.posture;response.barking_after=this.barking;
  this.responses.push(response);return response;
 }
 stop(time,reason='participant_ended'){this.advance(time);if(this.running)this.finish(this.time,reason);}
}
if(typeof module!=='undefined')module.exports=PlaydateSession;else root.PlaydateSession=PlaydateSession;
})(globalThis);
