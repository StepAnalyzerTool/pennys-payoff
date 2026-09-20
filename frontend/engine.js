/* Pure session model. Times are milliseconds since Start; media never controls the schedule. */
(function(root){
'use strict';
class PlaydateSession {
 constructor(config){
  this.config={...config}; this.time=0; this.running=true; this.posture='standing';this.barking=false;
  this.rows=[];this.responses=[];this.events=[];this.next=1;this.episode=null;this.reason=null;
  this.event('session_start',0);
 }
 event(type,time,extra={}){this.events.push({type,elapsed_ms:time,...extra});}
 get stopAt(){return (this.config.trials+1)*this.config.interval*1000;}
 onset(n){return n*this.config.interval*1000;}
 offset(){if(!this.episode)return Infinity;return Math.max(this.episode.onset_ms+this.config.duration*1000,this.config.condition==='extinction'?(this.episode.last_target_ms??-Infinity)+this.config.extinctionDelay*1000:-Infinity);}
 advance(time){
  if(!this.running)return; time=Math.max(this.time,time);
  while(this.running){
   const nextOnset=this.next<=this.config.trials?this.onset(this.next):Infinity;
   const nextOffset=this.offset();
   const nextFinish=this.episode?Infinity:Math.max(this.time,this.stopAt);
   const at=Math.min(nextOnset,nextOffset,nextFinish);
   if(at>time)break;
   this.time=at;
   // At a tie, complete the previous episode before a new scheduled onset.
   if(nextOffset===at){this.barking=false;this.event('barking_offset',at,{trial:this.episode.trial,reason:'time_requirement_met'});this.episode.actual_offset_ms=at;this.episode=null;continue;}
   if(nextOnset===at){
    const n=this.next++;const row={trial:n,onset_ms:at,window_end_ms:at+this.config.duration*1000,target_count:0,sit_count:0,target_occurred:false,first_target_latency_ms:null,actual_offset_ms:null,skipped:false};
    this.rows.push(row);
    if(this.episode){row.skipped=true;this.event('scheduled_onset_skipped',at,{trial:n,ongoing_trial:this.episode.trial});continue;}
    this.posture='standing';this.barking=this.config.condition!=='no_barking';
    this.event('trial_onset',at,{trial:n,barking:this.barking});
    if(this.barking)this.episode=row;
    continue;
   }
   this.running=false;this.reason='completed';this.event('session_end',at,{reason:this.reason});this.time=at;return;
  }
  this.time=time;
 }
 respond(action,time){
  this.advance(time);if(!this.running)return null;
  const row=this.rows.find(r=>!r.skipped&&time>=r.onset_ms&&time<r.window_end_ms);
  const response={action,elapsed_ms:time,trial:row?.trial??null,episode_trial:this.episode?.trial??null,period:row?'trial_window':this.episode?'extinction_extension':this.next===1?'initial_quiet':'between_trials',posture_before:this.posture,barking_before:this.barking,terminated_barking:false};
  if(action==='sit'){
   if(row)row.sit_count++;this.posture='sitting';
  }else if(action==='target'){
   if(row){row.target_count++;row.target_occurred=true;if(row.first_target_latency_ms===null)row.first_target_latency_ms=time-row.onset_ms;}
   if(this.episode&&this.config.condition==='extinction')this.episode.last_target_ms=time;
   if(this.barking&&this.config.condition==='negative_reinforcement'){
    response.terminated_barking=true;this.barking=false;this.episode.actual_offset_ms=time;
    this.event('barking_offset',time,{trial:this.episode.trial,reason:'target_response'});this.episode=null;
   }
  }else throw Error('Unknown response');
  response.posture_after=this.posture;response.barking_after=this.barking;
  this.responses.push(response);return response;
 }
 stop(time,reason='participant_ended'){this.advance(time);if(!this.running)return;this.running=false;this.reason=reason;this.event('session_end',time,{reason});}
}
if(typeof module!=='undefined')module.exports=PlaydateSession;else root.PlaydateSession=PlaydateSession;
})(globalThis);
