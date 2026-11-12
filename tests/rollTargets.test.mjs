import assert from 'node:assert/strict';
import test from 'node:test';
import {rollTargets} from '../ui/rollTargets.mjs';

test('Captura separa faces impressas e resultados úteis com bola',()=>{
 const v={target:'p1',tiles:{p1:{chip:{name:'Ficha',captureFaces:[5]}}}};
 assert.deepEqual(rollTargets(v,{type:'attempt',ball:'great-ball'}).map(g=>g.faces),[[5],[4,6]]);
});
test('Um empate não aparece como vitória; bônus secretos dão apenas resultados possíveis',()=>{
 const e={kind:'battle',turn:0,opponent:1,dice:[4],fighters:[{playerId:0,chipId:1,cardCount:0},{playerId:1,chipId:4,cardCount:0}]};
 const v={encounter:e,players:[{team:[{id:1}]},{team:[{id:4}]}]};
 assert.deepEqual(rollTargets(v,{type:'enc-roll'}).map(g=>g.faces),[[5,6]]);
 e.fighters[0].cardCount=1;
 assert.deepEqual(rollTargets(v,{type:'enc-roll'}).map(g=>g.faces),[[6]]);
 assert.match(rollTargets(v,{type:'enc-roll'})[0].label,/Podem/);
});
