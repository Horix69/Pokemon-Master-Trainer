import test from 'node:test';
import assert from 'node:assert/strict';
import {receivedItems} from '../ui/itemReveal.mjs';
import {evaluateAction} from '../ai/strategy.mjs';
import {newGame} from '../game-core/setup.mjs';
import {getLegalActions,step} from '../game-core/engine.mjs';
test('Recebimentos preservam repetidas e ignoram cartas antigas e descartadas',()=>{
 const before={players:[{id:0,hand:['potion','fly','potion']},{id:1,hand:[]}]};
 const after={players:[{id:0,name:'Ana',hand:['potion','potion','potion']},{id:1,name:'IA',hand:['fly','fly']}]};
 assert.deepEqual(receivedItems(before,after),[{id:0,name:'Ana',cards:['potion']},{id:1,name:'IA',cards:['fly','fly']}]);
 assert.deepEqual(receivedItems(before,before),[]);
});
test('Máquina do Tempo só aparece após dado, inclusive de outro jogador',()=>{
 let s=newGame(16,2,'normal');while(s.phase==='pick')s=step(s,s.actor,getLegalActions(s,s.actor)[0]);
 while(s.phase==='tie')s=step(s,s.actor,getLegalActions(s,s.actor)[0]);
 s.phase='turn';s.turn=1;s.actor=1;s.players[0].hand=['time-machine'];s.players[1].hand=[];
 assert.ok(!getLegalActions(s,0).some(a=>a.type==='reroll'));
 s=step(s,1,getLegalActions(s,1).find(a=>a.type==='roll'));
 assert.equal(s.phase,'react');assert.equal(s.actor,0);
 assert.ok(getLegalActions(s,0).some(a=>a.type==='reroll'));
 s=step(s,0,getLegalActions(s,0).find(a=>a.type==='pass'));
 assert.ok(!getLegalActions(s,0).some(a=>a.type==='reroll'));
});
test('IA preserva a carta se a rerrolagem não pode melhorar a captura',()=>{
 const v={players:[{}],viewer:0,turn:0,reason:'capture',target:'a',tiles:{a:{chip:{captureFaces:[1,2,3,4,5,6]}}},ball:'none',roll:1};
 assert.ok(evaluateAction(v,{type:'reroll'},'normal')<0);
 v.tiles.a.chip.captureFaces=[6];assert.ok(evaluateAction(v,{type:'reroll'},'normal')>0);
});
