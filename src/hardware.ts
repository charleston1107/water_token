export type EventType='SHOWER_START'|'SHOWER_STOP'|'SHOWER_TICK'|'LED_STATE_CHANGE'|'SHOWER_FORCE_STOP'|'RESET_DEMO';
export type DomainEvent={type:EventType;timestamp:number;payload?:unknown};
type Listener=(event:DomainEvent)=>void;
/** Transport boundary: a serial adapter may send commands and subscribe to outputs here. */
class HardwareAdapter {
 private listeners=new Set<Listener>();
 subscribe(listener:Listener){this.listeners.add(listener);return ()=>{this.listeners.delete(listener);};}
 emit(type:EventType,payload?:unknown){const event={type,timestamp:Date.now(),payload};this.listeners.forEach(listener=>listener(event));}
}
export const hardware=new HardwareAdapter();
