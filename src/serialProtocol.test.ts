import {test} from 'node:test';
import assert from 'node:assert/strict';
import {KnobGate,parseState} from './serialProtocol';
import {initial,start,stop,tick} from './domain';
test('serial packets accept UNO ADC range and CRLF',()=>{assert.deepEqual(parseState('STATE,801,1\r'),{raw:801,on:true});assert.deepEqual(parseState('STATE,0,0'),{raw:0,on:false});assert.deepEqual(parseState('STATE,1023,1'),{raw:1023,on:true});for(const line of ['STATE,1024,1','STATE,-1,0','STATE,800,2','hello','STATE,1,1,extra','STATE,NaN,0'])assert.equal(parseState(line),null);});
test('one event per physical edge, repeated heartbeat is inert',()=>{const gate=new KnobGate();assert.equal(gate.read(false),'SHOWER_STOP');assert.equal(gate.read(false),null);assert.equal(gate.read(true),'SHOWER_START');assert.equal(gate.read(true),null);assert.equal(gate.read(false),'SHOWER_STOP');});
test('reset and forced stop require low then high; reconnect syncs position',()=>{const gate=new KnobGate();gate.inhibit();assert.equal(gate.read(true),null);assert.equal(gate.read(false),'SHOWER_STOP');assert.equal(gate.read(true),'SHOWER_START');gate.reset();assert.equal(gate.read(true),'SHOWER_START');});
test('hardware edge input runs the same account calculation and summary',()=>{const gate=new KnobGate();let state=initial(0);function packet(line:string,time:number){const p=parseState(line);if(!p)return;const event=gate.read(p.on);if(event==='SHOWER_START')state=start(state,time);if(event==='SHOWER_STOP')state=stop(state,time);}
packet('STATE,900,1',0);state=tick(state,10000);packet('STATE,900,1',10000);packet('STATE,600,0',30000);assert.equal(state.active,null);assert.equal(state.summary?.consumed,60);assert.equal(state.personal,0);assert.equal(state.reserve,410);
packet('STATE,900,1',40000);state=stop(state,45000);packet('STATE,900,1',46000);assert.equal(state.active,null);packet('STATE,600,0',47000);packet('STATE,900,1',48000);assert.ok(state.active);});
