import test from 'node:test';import assert from 'node:assert/strict';
import {victoryStats} from '../ui/victory.mjs';import {power} from '../game-core/setup.mjs';
test('Placar separa capturas com dado, equipe e cartas usadas pelo vencedor',()=>{
 const state={winner:0,players:[{id:0,name:'Ana',team:[{id:1,knockedOut:false},{id:2,knockedOut:true}]}],profiles:[{sprite:7}],number:42,
 journal:[{actor:'IA',details:['Ana capturou Pikachu.','Ana recebeu Bulbasaur.']},{actor:'Ana',details:['Gary capturou Rattata.','Ana capturou Abra.']}],
 history:[[0,{type:'reroll'}],[1,{type:'enc-reroll'}],[0,{type:'enc-reroll'}]]};
 assert.deepEqual(victoryStats(state),{name:'Ana',points:power(state.players[0]),team:2,captures:2,turns:42,rerolls:2,sprite:7});
});
