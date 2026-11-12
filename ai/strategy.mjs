import { chance, offsets } from '../game-core/capture.mjs';
import { kantoBoard } from '../board/kanto.mjs';
import { evaluateEncounterAction } from '../game-core/encounters.mjs';
import { chips, rivals, evolutionGroups } from '../game-data/catalog.mjs';
const colors=['pink','green','blue','red','yellow'];
const averages=Object.fromEntries(colors.map(color=>{
  const group=chips.filter(c=>c.color===color);
  return [color,group.reduce((sum,c)=>sum+c.power*chance(c.captureFaces),0)/group.length];
}));
function tileValue(v,id) {
  const t=v.tiles[id];return t?.chip?t.chip.power*chance(t.chip.captureFaces):averages[t?.color]??0;
}
function destination(v,id) {
  const p=v.players[v.viewer],s=kantoBoard.get(id);
  if(s.actions.includes('final'))return 30;
  if(s.kind==='plateau')return 10;
  if(s.kind==='center' && p.team.some(c=>c.knockedOut))return 8;
  if(s.kind==='catch')return 1+tileValue(v,id);
  if(s.actions.includes('draw-item-2'))return p.handSize<4?3:1;
  return s.kind==='event'?2:0;
}
function attackOf(member,team) {
  const groups=evolutionGroups.filter(g=>g.at(-1)===member.id && g.every(id=>team.some(c=>c.id===id)));
  return member.attack+Math.max(0,...groups.map(g=>g.length===3?5:3));
}
// Enumera os 36 pares de resultados públicos possíveis, sem acesso ao gerador da mesa.
function battleOdds(left,right,bonusByFace=[0,0,0,0,0,0]){
  let wins=0,losses=0;
  for(let a=1;a<=6;a++)for(let b=1;b<=6;b++){
    const diff=left+a-right-b-bonusByFace[b-1];
    if(diff>0)wins++;
    if(diff<0)losses++;
  }
  return wins/(wins+losses||1);
}
function fighterStrength(p) {
  return Math.max(0,...p.team.filter(c=>!c.knockedOut).map(c=>attackOf(c,p.team)));
}
function encounterScore(v,a,difficulty){
  const score=evaluateEncounterAction(v,a,difficulty);
  if(a.type==='enc-reroll' && difficulty!=='easy'){
    const e=v.encounter;
    if(!e.vote && e.dice.length && [e.turn,e.opponent].includes(v.viewer)){
      const roller=e.dice.length-1;
      const strength=(id,face)=>{
        const master=id===e.opponent?rivals.find(r=>r.name===e.rival):null;
        if(master)return master.attack+face+master.bonusByFace[face-1];
        const f=e.fighters.find(f=>f.playerId===id),p=v.players[id];
        const c=p.team.find(c=>c.id===f?.chipId);
        if(!c || (f.cardCount && !f.cards))return null;
        return attackOf(c,p.team)+face+(f.cards??[]).reduce((n,c)=>n+Number(c.slice(-1)),0);
      };
      const value=face=>{
        let total=0;
        for(let other=1;other<=6;other++){
          const left=strength(e.turn,roller===0?face:e.dice[0]);
          const right=strength(e.opponent,roller===1?face:other);
          if(left===null || right===null)return null;
          const diff=(left-right)*(v.viewer===e.turn?1:-1);
          total+=diff>0?1:diff===0?0.5:0;
        }
        return total/6;
      };
      const current=value(e.dice.at(-1)),values=[1,2,3,4,5,6].map(value);
      if(current!==null && values.every(n=>n!==null))return values.reduce((a,b)=>a+b,0)/6-current-0.12;
    }
  }
  if(difficulty!=='hard')return score;
  const e=v.encounter,p=v.players[v.viewer];
  if(a.type==='enc-fighter'){
    const fighter=p.team.find(c=>c.id===a.chip);
    return attackOf(fighter,p.team)-fighter.power/100;
  }
  if(a.type==='enc-offer'){
    const rival=v.players[e.opponent],given=p.team.find(c=>c.id===a.give),received=rival.team.find(c=>c.id===a.get);
    return (received.knockedOut?0:received.power)-(given.knockedOut?0:given.power)+(received.attack-given.attack)*0.4;
  }
  if(a.type==='enc-bonus'){
    const fighter=p.team.find(c=>c.id===e.chip);
    const base=attackOf(fighter,p.team)+(e.reserved||[]).reduce((n,c)=>n+Number(c.slice(-1)),0);
    const bonus=Number(a.card.slice(-1));
    if(e.kind==='final'){
      // O desafiante ainda desconhece qual dos cinco Mestres foi comprado.
      const mean=rivals.reduce((n,r)=>n+battleOdds(base+bonus,r.attack,r.bonusByFace),0)/rivals.length;
      return 2+mean*10+bonus/100;
    }
    const other=v.players[e.turn===v.viewer?e.opponent:e.turn];
    const foe=other.team.find(c=>c.id===e.choices?.[other.id]);
    const strength=foe?attackOf(foe,other.team):fighterStrength(other);
    return 12*(battleOdds(base+bonus,strength)-battleOdds(base,strength))-0.08*bonus;
  }
  return score;
}
export function evaluateAction(v,a,difficulty) {
  const p=v.players[v.viewer],t=v.tiles[v.target]?.chip;
  if(a.type.startsWith('enc-'))return encounterScore(v,a,difficulty);
  switch(a.type){
    case 'move': {
      const r=v.routes[a.route];let score=destination(v,r.destination);
      if(difficulty==='hard'){
        const next=kantoBoard.get(r.destination).edges.filter(e=>e.rule==='road'||e.rule==='clockwise');
        if(next.length)score+=next.reduce((n,e)=>n+destination(v,e.to),0)/next.length/5;
        if(v.players.some(q=>q.id!==p.id && q.power>=18) && v.tiles[r.destination])score+=1;
      }
      return score;
    }
    case 'meet':
      if(difficulty==='hard'){
        const other=v.players[a.opponent];
        if(a.kind==='trade'){
          const give=p.team.filter(c=>c.color!=='starter'),get=other.team.filter(c=>c.color!=='starter' && !c.knockedOut);
          if(!give.length||!get.length)return -1;
          return Math.max(...get.map(c=>c.power))-Math.min(...give.map(c=>c.knockedOut?0:c.power));
        }
        return 7*battleOdds(fighterStrength(p),fighterStrength(other))-3;
      }
      return a.kind==='battle' && p.team.some(c=>!c.knockedOut && c.attack>Math.max(0,...v.players[a.opponent].team.filter(q=>!q.knockedOut).map(q=>q.attack))+2)?4:-1;
    case 'fly':return destination(v,a.id)-3;
    case 'enter':return 50;
    case 'roll':return 1;
    case 'attempt':return chance(t.captureFaces,a.ball)*t.power-(a.ball==='none'?0:0.25*offsets[a.ball].length);
    case 'adjust':return t.captureFaces.includes(v.roll+a.delta)?10:0;
    case 'potion':case 'heal':return p.team.find(c=>c.id===a.id).power;
    case 'challenge':return p.team.filter(c=>c.knockedOut).reduce((n,c)=>n+c.power,0)/3;
    case 'discard':return a.card.startsWith('bonus')?-Number(a.card.slice(-1)):a.card==='fly'?1:-3;
    case 'target':return v.tiles[a.target]?.chip?.power??tileValue(v,a.target);
    case 'opponent':return -v.players[a.opponent].power;
    case 'reroll':{
      if(v.reason==='capture' && t){
        const useful=offsets[v.ball].some(n=>t.captureFaces.includes(v.roll+n));
        const probability=chance(t.captureFaces,v.ball);
        return (v.viewer===v.turn?probability-Number(useful):Number(useful)-probability)-0.15;
      }
      if(v.reason==='center')return (v.viewer===v.turn?![1,6].includes(v.roll):[1,6].includes(v.roll))?1:-1;
      return -1;
    }
    default:return 0;
  }
}
export function chooseAction(v,actions,difficulty) {
  if(!actions.length)throw new Error('Sem ação disponível');
  // Deterministic tie-breaking uses public information only.
  const offset=(v.number+v.viewer+v.players[v.viewer].team.length)%actions.length;
  if(difficulty==='easy' && ['move','target','pick'].includes(v.phase))return actions[offset];
  let best=actions[offset],score=evaluateAction(v,best,difficulty);
  for(let i=1;i<actions.length;i++){
    const a=actions[(offset+i)%actions.length],value=evaluateAction(v,a,difficulty);
    if(value>score){score=value;best=a;}
  }
  return best;
}


