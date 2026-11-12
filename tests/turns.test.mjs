import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame } from '../game-core/setup.mjs';
import { getLegalActions,step,observe } from '../game-core/engine.mjs';

function fixture(dest){
 const s=newGame(7,2);
 s.players[0].team=[{id:25,knockedOut:false}];s.players[1].team=[{id:52,knockedOut:false}];
 s.routes=[{path:['pallet',dest],destination:dest,meetings:[],passedCerulean:false,exact:true}];
 s.phase='move';return s;
}
function eventAt(type){
 const s=fixture('pe1');
 const i=s.events.indexOf(type);s.events.unshift(...s.events.splice(i,1));
 return s;
}
const move=s=>step(s,s.actor,{type:'move',route:0});
test('Cartas de compra e casas do Plateau compram a quantidade impressa',()=>{
 for(let n=1;n<=3;n++){
   const s=move(eventAt('take-'+n));assert.equal(s.players[0].hand.length,n);assert.equal(s.events.at(-1),'take-'+n);
 }
 for(const [id,n] of [['indigo-1',1],['indigo-3',3],['indigo-6',2]]){
   assert.equal(move(fixture(id)).players[0].hand.length,n);
 }
});
test('Chance permite escolher a ficha pela cor, com reposição e sem dado',()=>{
 let s=move(eventAt('chance'));assert.equal(s.phase,'target');
 assert.ok(getLegalActions(s,0).every(a=>s.tiles[a.target].color==='pink'));const id=s.tiles.p1.id;
 s=step(s,0,{type:'target',target:'p1'});assert.equal(s.players[0].team.at(-1).id,id);assert.equal(s.roll,null);
 assert.equal(s.tiles.p1.color,'pink');assert.equal(s.tiles.p1.revealed,false);
});
test('Dungeon revela somente a ficha escolhida e troca obrigatória exige fichas elegíveis',()=>{
 let s=move(eventAt('dungeon'));assert.equal(getLegalActions(s,0).length,4);
 s=step(s,0,{type:'target',target:'dungeon-2'});assert.equal(s.phase,'capture');assert.equal(s.tiles['dungeon-2'].revealed,true);
 assert.equal(move(eventAt('trade')).phase,'end');
});
test('Centros, evento Centro e Poção oferecem escolhas de recuperação distintas',()=>{
 const prepared=fixture('cerulean');prepared.players[0].team=[{id:25,knockedOut:true},{id:10,knockedOut:true}];
 const city=move(prepared);assert.ok(getLegalActions(city,0).some(a=>a.type==='challenge'));
 const e=eventAt('center');e.players[0].team=prepared.players[0].team;
 const center=move(e);assert.deepEqual(getLegalActions(center,0).map(a=>a.type),['heal','heal']);
 const s=fixture('p1');s.players[0].team[0].knockedOut=true;s.players[0].hand=['potion'];
 const next=step(s,0,{type:'potion',id:25});assert.equal(next.phase,'move');assert.equal(next.items.at(-1),'potion');assert.equal(next.players[0].team[0].knockedOut,false);
});
test('Sete itens exigem decisão pessoal de descarte e 20 pontos abrem a região final',()=>{
 let s=fixture('p1');s.phase='end';s.players[0].hand=Array(8).fill('bonus-1');assert.throws(()=>step(s,0,{type:'end'}));
 s=step(s,0,{type:'discard',card:'bonus-1'});assert.equal(s.players[0].hand.length,7);assert.equal(s.items.at(-1),'bonus-1');
 s.players[0].hand=[];s.players[0].team=[144,145,146].map(id=>({id,knockedOut:false}));
 s=step(s,0,{type:'end'});assert.equal(s.players[0].pos,'cinnabar');assert.equal(s.players[0].hand.length,2);assert.equal(s.turn,1);
 s.turn=s.actor=0;assert.ok(getLegalActions(s,0).some(a=>a.type==='enter'));
 s.players[0].team[0].knockedOut=true;assert.ok(!getLegalActions(s,0).some(a=>a.type==='enter'));
});
test('Máquina do Tempo permite uma nova rolagem e volta ao fundo do baralho',()=>{
 const a=fixture('p1');a.phase='turn';a.players[1].hand=['time-machine'];
 const x=step(a,0,{type:'roll'});assert.equal(x.phase,'react');assert.equal(x.actor,1);
 const y=step(x,1,{type:'reroll'});assert.equal(y.items.at(-1),'time-machine');
 assert.equal(y.phase,'move');assert.equal(y.roll,y.dieResult);assert.notEqual(y.rng,x.rng);
});
