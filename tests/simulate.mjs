import assert from 'node:assert/strict';
import { newGame } from '../game-core/setup.mjs';
import { getLegalActions,step,observe } from '../game-core/engine.mjs';
import { chooseAction } from '../ai/strategy.mjs';
import { chips, itemTypes,eventTypes,rivals } from '../game-data/catalog.mjs';
export function audit(s){
  const held=s.players.flatMap(p=>p.team.map(c=>c.id));
  const pieces=[...held,...Object.values(s.reserve).flat(),...s.starters.filter(Boolean),...Object.values(s.tiles).filter(Boolean).map(t=>t.id)];
  assert.equal(pieces.length,150);assert.equal(new Set(pieces).size,150);
  assert.ok(pieces.every(id=>Number.isInteger(id) && chips[id-1]?.id===id));
  assert.equal(s.events.length,54);
  const counts=values=>values.reduce((sum,id)=>(sum[id]=(sum[id]??0)+1,sum),{});
  const itemCounts=counts([...s.items,...s.players.flatMap(p=>p.hand),...Object.values(s.encounter?.fighters??{}).flatMap(f=>f.reserved.map(c=>c.type))]);
  for(const type of itemTypes)assert.equal(itemCounts[type.id],type.count);
  const eventCounts=counts(s.events);for(const type of eventTypes)assert.equal(eventCounts[type.id],type.count);
  const masterSet=new Set([...s.rivals,...(s.encounter?.rival?[s.encounter.rival]:[])]);
  assert.ok(rivals.every(r=>masterSet.has(r.name)));
  const reserved=Object.values(s.encounter?.fighters??{}).reduce((n,f)=>n+f.reserved.length,0);
  assert.equal(s.items.length+reserved+s.players.reduce((n,p)=>n+p.hand.length,0),54);
  assert.equal(s.rivals.length+(s.encounter?.rival?1:0),5);
}
export function simulate(seed,count,difficulty) {
  let s=newGame(seed,count,difficulty);let steps=0;
  while(s.phase!=='won' && steps<50000){
    const choices=getLegalActions(s,s.actor);assert.ok(choices.length,'Travamento '+JSON.stringify({seed,steps,enc:s.encounter,rosters:s.players.map(p=>p.team)}));
    const a=chooseAction(observe(s,s.actor),choices,difficulty);
    try{s=step(s,s.actor,a);audit(s);}catch(e){throw Error(JSON.stringify({seed,steps,phase:s.phase,actor:s.actor,action:a}),{cause:e});}
    steps++;
  }
  assert.equal(s.phase,'won','Limite de decisões atingido: '+seed);return {turns:s.number,steps};
}
if(process.argv[1]?.endsWith('simulate.mjs')){
 const n=Number(process.argv[2]??200);let turns=0,steps=0;
 for(let i=0;i<n;i++){const r=simulate(i+1,2+i%5,['easy','normal','hard'][i%3]);turns+=r.turns;steps+=r.steps;}
 console.log(JSON.stringify({partidas:n,turnos:turns,decisoes:steps}));
}


