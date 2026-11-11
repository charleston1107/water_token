/** Newline protocol: STATE,<ADC 0..1023>,<valve 0|1>. */
export function parseState(line:string):{raw:number;on:boolean}|null {
 const match=/^STATE,(\d{1,4}),([01])$/.exec(line.trim());
 if(!match || Number(match[1])>1023)return null;
 return {raw:Number(match[1]),on:match[2]==='1'};
}
/** Edge control: repeated high reports never override a manual stop or reset. */
export class KnobGate {
 private previous:boolean|null=null;
 read(on:boolean):'SHOWER_START'|'SHOWER_STOP'|null {
  if(on===this.previous)return null;
  this.previous=on;
  return on?'SHOWER_START':'SHOWER_STOP';
 }
 inhibit(){this.previous=true;}
 reset(){this.previous=null;}
}
