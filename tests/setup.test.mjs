import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame,power } from '../game-core/setup.mjs';
import { step,observe,getLegalActions } from '../game-core/engine.mjs';
import { chooseAction } from '../ai/strategy.mjs';
import { save,load } from '../persistence/save.mjs';
import { sample } from '../game-core/random.mjs';
import { audit } from './simulate.mjs';
test('Preparação preserva todas as peças e esconde baralhos, semente, iniciais e fichas',()=>{
 for(let count=2;count<=6;count++){
  let s=newGame(179,count);audit(s);const v=observe(s,0);
  for(const field of ['rng','seed','history','items','rivals','events','reserve'])assert.ok(!(field in v));
  assert.ok(Object.values(v.tiles).every(t=>!t.chip));assert.equal(Object.keys(s.tiles).length,41);
  assert.ok(v.players.slice(1).every(p=>!('hand' in p)));
  while(s.phase==='pick'){const choices=getLegalActions(s,s.actor);s=step(s,s.actor,choices[0]);audit(s);}
  while(s.phase==='tie')s=step(s,s.actor,getLegalActions(s,s.actor)[0]);
  assert.equal(power(s.players[s.turn]),Math.min(...s.players.map(power)));assert.equal(s.reserve.starter.length,6-count);
 }
});
test('Ações inválidas e ações fora de vez são rejeitadas atomicamente',()=>{
 const s=newGame(0,2);const before=structuredClone(s);
 assert.throws(()=>step(s,1,{type:'pick',slot:1}));assert.throws(()=>step(s,0,{type:'pick',slot:77}));assert.deepEqual(s,before);
});
test('O gerador produz pares iguais e todos os 36 resultados de dois dados',()=>{
 const seen=new Set(),s={rng:123};for(let i=0;i<2000;i++)seen.add([sample(s,6),sample(s,6)].join(','));assert.equal(seen.size,36);
});
test('Replay recupera o mesmo estado intermediário e os mesmos próximos dados',()=>{
 let raw=null;const storage={getItem:()=>raw,setItem:(_,v)=>raw=v};let s=newGame(104,5,'hard');
 assert.equal(load(storage),null);
 for(let i=0;i<250 && s.phase!=='won';i++){
  const a=chooseAction(observe(s,s.actor),getLegalActions(s,s.actor),s.difficulty);
  s=step(s,s.actor,a);
  if(i%33===0){save(s,storage);assert.deepEqual(load(storage),s);}
 }
 raw='{"version":0}';assert.throws(()=>load(storage));raw='{';assert.throws(()=>load(storage));
});
test('Escolha da IA independe de uma permutação das peças ocultas',()=>{
 const s=newGame(1,3);const other=structuredClone(s);other.starters.reverse();other.events.reverse();other.items.reverse();other.rng=200;
 for(const d of ['easy','normal','hard']){
  const v=observe(s,0),u=observe(other,0);assert.deepEqual(v,u);
  assert.deepEqual(chooseAction(v,getLegalActions(s,0),d),chooseAction(u,getLegalActions(other,0),d));
 }
});
