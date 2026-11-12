import {chips,rivals,evolutionGroups} from '../game-data/catalog.mjs';
import {offsets} from '../game-core/capture.mjs';
import {evolutionBonus} from '../game-core/encounters.mjs';
const faces=[1,2,3,4,5,6];
export function rollTargets(view,action){
 const e=view.encounter;
 if(action.type==='attempt'||(action.type==='reroll'&&view.reason==='capture')){
   const c=view.tiles[view.target]?.chip;
   if(!c)return [];
   const ball=action.ball??view.ball;
   const groups=[{label:'Faces de captura de '+c.name,faces:c.captureFaces}];
   if(ball!=='none')groups.push({label:'Resultados úteis com a bola escolhida',faces:faces.filter(f=>offsets[ball].some(n=>c.captureFaces.includes(f+n)))});
   return groups;
 }
 if(!e||!(action.type==='enc-roll'||action.type==='enc-reroll'&&e.stage==='reaction'))return [];
 const index=e.dice.length-(action.type==='enc-reroll'?1:0);
 const ids=[e.turn,e.opponent];
 function bounds(side,face){
   if(e.kind==='final'&&side===1){
     const r=rivals.find(r=>r.name===e.rival);
     const total=r.attack+face+r.bonusByFace[face-1];return [total,total];
   }
   const f=e.fighters.find(f=>f.playerId===ids[side]);
   const base=chips[f.chipId-1].attack+evolutionBonus(view.players[ids[side]].team,f.chipId,evolutionGroups)+face;
   const known=f.cards?.reduce((n,c)=>n+Number(c.slice(-1)),0);
   return [base+(known??f.cardCount),base+(known??5*f.cardCount)];
 }
 const other=index===1?[e.dice[0]]:faces;
 const certain=[],possible=[];
 for(const face of faces){
   const [low,high]=bounds(index,face);
   if(other.every(d=>low>bounds(1-index,d)[1]))certain.push(face);
   else if(other.some(d=>high>bounds(1-index,d)[0]))possible.push(face);
 }
 const groups=[];
 if(certain.length)groups.push({label:'Vencem esta rodada com os dados atuais',faces:certain});
 if(possible.length)groups.push({label:'Podem vencer, conforme o dado adversário ou bônus ocultos',faces:possible});
 return groups.length?groups:[{label:'Nenhuma face vence diretamente esta rodada.',faces:[]}];
}
