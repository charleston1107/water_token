import {useSyncExternalStore} from 'react';
import {hardware} from './hardware';
import {KnobGate,parseState} from './serialProtocol';
// Minimal Web Serial interfaces keep the transport independent of UI and account state.
interface Port {readable:ReadableStream<Uint8Array>|null;open(options:{baudRate:number}):Promise<void>;close():Promise<void>}
interface Serial {requestPort():Promise<Port>}
type Connection={status:'disconnected'|'connecting'|'connected';raw:number|null;on:boolean|null;message:string};
let snapshot:Connection={status:'disconnected',raw:null,on:null,message:''};
const listeners=new Set<()=>void>();
const publish=(changes:Partial<Connection>)=>{snapshot={...snapshot,...changes};listeners.forEach(fn=>fn());};
const serialApi=()=>((navigator as Navigator & {serial?:Serial}).serial);
let port:Port|null=null;
let reader:ReadableStreamDefaultReader<Uint8Array>|null=null;
let readTask:Promise<void>|null=null;
let watchdog:ReturnType<typeof setInterval>|undefined;
let lastReport=0;
let closing=false;
const gate=new KnobGate();
hardware.subscribe(event=>{if(event.type==='RESET_DEMO'||event.type==='SHOWER_FORCE_STOP')gate.inhibit();});
export async function connectArduino(){
 if(snapshot.status!=='disconnected')return;
 if(!serialApi()||!window.isSecureContext){publish({message:'Open this page in desktop Chrome or Edge using localhost or HTTPS.'});return;}
 publish({status:'connecting',message:''});
 try {
  // Must run directly from the connect button's user gesture.
  port=await serialApi()!.requestPort();
  await port.open({baudRate:115200});
  if(!port.readable)throw new Error('Serial input unavailable.');
  gate.reset();closing=false;lastReport=Date.now();
  reader=port.readable.getReader();
  publish({status:'connected',raw:null,on:null,message:'Waiting for controller readings.'});
  watchdog=setInterval(()=>{if(Date.now()-lastReport>3000)void disconnectArduino('Controller signal lost. The shower session has ended.');},500);
  readTask=readLoop(reader);
 }catch(error){
  if(port)try{await port.close();}catch{}
  port=null;
  publish({status:'disconnected',message:error instanceof DOMException&&error.name==='NotFoundError'?'Port selection cancelled.':'Connection unavailable. Close the Arduino Serial Monitor and check the USB cable.'});
 }
}
async function readLoop(input:ReadableStreamDefaultReader<Uint8Array>){
 const decoder=new TextDecoder();let buffer='';
 try {
  while(true){
   const {value,done}=await input.read();if(done)break;
   buffer+=decoder.decode(value,{stream:true});
   let newline:number;
   while((newline=buffer.indexOf('\n'))>=0){
    const line=buffer.slice(0,newline);buffer=buffer.slice(newline+1);
    const report=parseState(line);if(!report)continue;
    lastReport=Date.now();publish({raw:report.raw,on:report.on,message:''});
    const event=gate.read(report.on);if(event)hardware.emit(event,{source:'arduino',raw:report.raw});
   }
   if(buffer.length>256)buffer='';
  }
 }catch{/* unplug and transport failures end the session below */}
 finally {
  input.releaseLock();reader=null;
  if(!closing)void disconnectArduino('Controller disconnected. The shower session has ended.');
 }
}
export async function disconnectArduino(message='Controller disconnected. The shower session has ended.'){
 if(closing)return;
 closing=true;clearInterval(watchdog);hardware.emit('SHOWER_STOP',{source:'serial-disconnect'});
 try{await reader?.cancel();await readTask;await port?.close();}catch{}
 finally{port=null;reader=null;readTask=null;gate.reset();publish({status:'disconnected',raw:null,on:null,message});closing=false;}
}
export function useArduino(){return useSyncExternalStore(listener=>{listeners.add(listener);return ()=>{listeners.delete(listener);};},()=>snapshot);}
