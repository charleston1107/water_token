import {useEffect,useState} from 'react';
import {initial,start,stop,tick,awardBonus,led,type State} from './domain';
import {hardware} from './hardware';
const key='water-token-account-v1';
function restore(){try{const s=JSON.parse(localStorage.getItem(key)||'null');if(s&&s.activities&&Number.isFinite(s.epoch)&&Number.isFinite(s.personal))return tick(s,Date.now());}catch{}return initial();}
let state:State=restore();
const listeners=new Set<()=>void>();
function update(next:State){const prev=state;state=next;localStorage.setItem(key,JSON.stringify(state));listeners.forEach(fn=>fn());if(prev.active&&!state.active&&state.summary?.forced)hardware.emit('SHOWER_FORCE_STOP',state.summary);const before=prev.active?led(prev.active.duration):'OFF',after=state.active?led(state.active.duration):'OFF';if(before!==after)hardware.emit('LED_STATE_CHANGE',after);}
hardware.subscribe(event=>{if(event.type==='SHOWER_START')update(start(state,event.timestamp));if(event.type==='SHOWER_STOP')update(stop(state,event.timestamp));if(event.type==='SHOWER_TICK')update(tick(state,event.timestamp));if(event.type==='RESET_DEMO')update(initial(event.timestamp));});
export function bonus(){update(awardBonus(state,Date.now()));}
export function useWater(){const [s,set]=useState(state);const [now,setNow]=useState(Date.now());useEffect(()=>{const listener=()=>set(state);listeners.add(listener);const timer=setInterval(()=>{setNow(Date.now());if(state.active)hardware.emit('SHOWER_TICK');},100);return ()=>{listeners.delete(listener);clearInterval(timer);};},[]);return {s,now};}
