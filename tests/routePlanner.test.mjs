import test from 'node:test';
import assert from 'node:assert/strict';
import {markRoutes,hintFor} from '../ui/routePlanner.mjs';
test('Dois trajetos ao mesmo destino têm letras distintas; o encontro recebe a letra do seu percurso',()=>{
 const actions=[{type:'move',route:0},{type:'move',route:1},{type:'meet',route:1}];
 const v={routes:[{destination:'cerulean'},{destination:'cerulean'}]};
 assert.deepEqual(markRoutes(v,actions).map(a=>a.letter),['A','B']);
 assert.equal(actions[2].letter,'B');
});
test('Dica usa a equipe e respeita a identidade oculta da ficha',()=>{
 const team=[{name:'Haunter',knockedOut:true,power:5}];
 const v={turn:0,players:[{team,handSize:0}],routes:[{destination:'g1'},{destination:'cerulean'}],tiles:{g1:{color:'green'}}};
 const moves=markRoutes(v,[{type:'move',route:0},{type:'move',route:1}]);
 assert.match(hintFor(v,moves),/rota B.*Haunter.*5 PP/);
 team[0].knockedOut=false;assert.match(hintFor(v,moves),/rota A.*virada/);
});
