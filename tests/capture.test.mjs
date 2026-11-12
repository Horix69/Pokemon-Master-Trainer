import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame,chip } from '../game-core/setup.mjs';
import { offsets,chance,resolveCapture,reveal } from '../game-core/capture.mjs';
import { getLegalActions,step } from '../game-core/engine.mjs';
test('Cada combinação de bola, cor e face resolve segundo a ficha e repõe pela cor',()=>{
 for(const target of ['p1','g1','b1','r1','dungeon-1']){
  for(const [ball,adjustments] of Object.entries(offsets))for(const delta of adjustments)for(let face=1;face<=6;face++){
    const s=newGame(15,2);const t=s.tiles[target];reveal(s,target);s.roll=face;s.ball=ball;
    const ok=chip(t.id).captureFaces.includes(face+delta);resolveCapture(s,delta);
    assert.equal(s.players[0].team.some(c=>c.id===t.id),ok);
    if(ok)assert.ok(!s.tiles[target]||s.tiles[target].color===t.color && !s.tiles[target].revealed);
    else if(t.color==='yellow')assert.ok(Object.values(s.tiles).filter(x=>x?.color==='yellow').every(x=>!x.revealed));
    else assert.deepEqual(s.tiles[target],{...t,revealed:true});
  }
 }
});
test('Uso da bola antecede o dado e só permite ajustar após rolar',()=>{
 let s=newGame(2,2);s.players[0].hand=['great-ball'];reveal(s,'p1');
 assert.throws(()=>step(s,0,{type:'adjust',delta:-1}));
 s=step(s,0,{type:'attempt',ball:'great-ball'});assert.equal(s.items.at(-1),'great-ball');assert.equal(s.phase,'adjust');
 assert.deepEqual(getLegalActions(s,0).map(a=>a.delta),[-1,1]);
 assert.throws(()=>step(s,0,{type:'attempt',ball:'great-ball'}));assert.equal(chance([6],'master-ball'),4/6);
});
test('Reserva esgotada deixa a casa vazia',()=>{
 const s=newGame(2,2);s.reserve.pink=[];reveal(s,'p1');s.roll=chip(s.tiles.p1.id).captureFaces[0];s.ball='none';resolveCapture(s,0);assert.equal(s.tiles.p1,null);
});
test('As três bolas exigem um dos ajustes impressos; sem bola vale o dado natural',()=>{
 const expected={'great-ball':[-1,1],'ultra-ball':[1,2],'master-ball':[1,2,3,4],none:[0]};
 for(const [ball,values] of Object.entries(expected)){
   const s=newGame(7,2);reveal(s,'r1');s.phase='adjust';s.roll=5;s.ball=ball;
   assert.deepEqual(getLegalActions(s,0).map(a=>a.delta),values);
   if(ball!=='none')assert.throws(()=>step(s,0,{type:'adjust',delta:0}));
 }
});
test('Replay aceita ajuste zero antigo apenas antes do limite de migração',()=>{
 const s=newGame(8,2);reveal(s,'b1');s.phase='adjust';s.ball='ultra-ball';s.roll=4;
 s.strictBallFrom=1;assert.equal(step(s,0,{type:'adjust',delta:0}).phase,'end');
 s.strictBallFrom=0;assert.throws(()=>step(s,0,{type:'adjust',delta:0}));
});
