import { allowsTimeMachine } from './random.mjs';
import { chip, power, setupActions, setupStep } from './setup.mjs';
import { rollDie } from './random.mjs';
import { legalOffsets, offsets, reveal, takeChip, resolveCapture } from './capture.mjs';
import { spaces, kantoBoard } from '../board/kanto.mjs';
import { getLegalRoutes } from '../board/graph.mjs';
import { enterEncounter, encounterActions, applyEncounter, encounterView } from './encounters.mjs';
import { itemTypes,eventTypes } from '../game-data/catalog.mjs';

export const itemName=id=>itemTypes.find(c=>c.id===id)?.name ?? id;
export function placeName(id) {
  if(names[id])return names[id]; const s=kantoBoard.get(id);
  if(s?.kind==='catch' || s?.kind==='event')return (s.kind==='catch'?'Captura':'Evento')+' '+({pink:'rosa',green:'verde',blue:'azul',red:'vermelho'}[s.color])+' ('+id.toUpperCase()+')';
  return id.replace('indigo-','Indigo · ').replace('dungeon-','Dungeon · ');
}
const names={pallet:'Pallet Town',viridian:'Viridian City',pewter:'Pewter City',cerulean:'Cerulean City',saffron:'Saffron City',celadon:'Celadon City',vermilion:'Vermilion City',fuchsia:'Fuchsia City',lavender:'Lavender Town',cinnabar:'Cinnabar Island'};
const option=(type,label,data={})=>({type,label,...data});
const own=s=>s.players[s.turn];
const standing=p=>p.team.some(c=>!c.knockedOut);
const tradable=p=>p.team.some(c=>chip(c.id).color!=='starter');
const fainted=p=>p.team.filter(c=>c.knockedOut);
const occupied=(s,id)=>s.players.some(p=>p.id!==s.turn && p.pos===id);
function draw(s,n) {
  const cards=s.items.splice(0,n);own(s).hand.push(...cards);
  s.log.push(own(s).name+' recebeu '+cards.length+' carta(s) de item.');
}
function play(s,id,who=s.actor) {
  const hand=s.players[who].hand;const index=hand.indexOf(id);
  if(index<0)throw new Error('Carta indisponível'); hand.splice(index,1);s.items.push(id);
}
function roll(s,reason) {
  s.roll=rollDie(s);s.log.push(own(s).name+' rolou '+s.roll+'.');
  s.reason=reason;s.reactors=Array.from({length:s.count},(_,i)=>(s.turn+i)%s.count).filter(id=>s.players[id].hand.length>0);
  if(allowsTimeMachine(s) && s.reactors.length){s.actor=s.reactors[0];s.phase='react';} else afterRoll(s);
}
function advanceReaction(s) { if(s.reactors.length)s.actor=s.reactors[0];else afterRoll(s); }
function afterRoll(s) {
  s.actor=s.turn;
  if(s.reason==='capture'){s.phase='adjust';return;}
  if(s.reason==='center'){
    if([1,6].includes(s.roll))own(s).team.forEach(c=>c.knockedOut=false);
    s.phase='end';return;
  }
  const occupants={};
  for(const p of s.players)(occupants[p.pos]??=[]).push(p.id);
  s.routes=getLegalRoutes(kantoBoard,{start:own(s).pos,roll:s.roll,occupants,playerId:s.turn,passedCerulean:own(s).passedCerulean,power:own(s).pos==='cinnabar'?0:power(own(s))});
  s.phase=s.routes.length?'move':'end';
}
function selectTiles(s,color,mode) {
  let keys=Object.keys(s.tiles).filter(k=>s.tiles[k]?.color===color);
  if(!keys.length && mode==='chance')keys=Object.keys(s.tiles).filter(k=>s.tiles[k] && s.tiles[k].color!=='yellow');
  s.targets=keys;s.choiceMode=mode;s.phase=keys.length?'target':'end';
}
function event(s,space) {
  const id=s.events.shift(); s.events.push(id);s.lastEvent=id;
  s.log.push('Evento: '+eventTypes.find(c=>c.id===id).name+'.');
  if(id.startsWith('take-'))draw(s,Number(id.slice(-1)));
  if(id==='chance')selectTiles(s,space.color,'chance');
  if(id==='dungeon')selectTiles(s,'yellow','capture');
  if(id==='center' && fainted(own(s)).length){s.phase='heal';s.challenge=false;}
  if(id==='trade' && tradable(own(s)) && s.players.some(p=>p.id!==s.turn && tradable(p)))s.phase='eventTrade';
  if(id==='fight' && standing(own(s)) && s.players.some(p=>p.id!==s.turn && standing(p)))s.phase='eventFight';
}
function land(s,id,exact=true) {
  const p=own(s);p.pos=id;const tile=kantoBoard.get(id);s.phase='end';
  s.log.push(p.name+' chegou a '+placeName(id)+'.');
  if(tile.actions.includes('verify-saffron'))s.log.push('Saffron: efeito pendente de conferência na edição de 1999.');
  if(tile.kind==='catch' && s.tiles[id])reveal(s,id);
  if(tile.actions.includes('draw-event'))event(s,tile);
  for(const n of [1,2,3])if(tile.actions.includes('draw-item-'+n))draw(s,n);
  if(tile.actions.includes('revive') && fainted(p).length){s.phase='heal';s.challenge=true;}
  if(tile.actions.includes('final') && exact && standing(p))enterEncounter(s,'final');
  for(const color of ['red','blue','green'])if(tile.actions.includes('catch-'+color))selectTiles(s,color,'capture');
}
function moveChoices(s) {
  const result=[];
  s.routes.forEach((r,i)=>{
    if(s.lockedRoute!==undefined && s.lockedRoute!==i)return;
    result.push(option('move','Ir para '+placeName(r.destination),{route:i}));
    if(s.lockedRoute!==undefined)return;
    for(const m of r.meetings){
      const q=s.players[m.playerId];if(s.declined.includes(q.id))continue;
      if(tradable(own(s)) && tradable(q))result.push(option('meet','Propor troca a '+q.name,{route:i,opponent:q.id,kind:'trade'}));
      if(standing(own(s)) && standing(q))result.push(option('meet','Desafiar '+q.name,{route:i,opponent:q.id,kind:'battle'}));
    }
  });
  return result;
}
const heals=s=>fainted(own(s)).map(t=>option('heal','Reviver '+chip(t.id).name,{id:t.id}));
export function getLegalActions(s,id) {
  if(id!==s.actor || s.phase==='won')return [];
  const p=own(s);let actions=[];
  switch(s.phase) {
    case 'pick': case 'tie': return setupActions(s);
    case 'encounter': return encounterActions(s);
    case 'turn':
      actions=[option('roll','Lançar dado')];
      if(p.pos==='cinnabar' && power(p)>=20)actions.push(option('enter','Entrar no Indigo Plateau'));
      if(p.hand.includes('fly') && kantoBoard.get(p.pos).kind!=='plateau')for(const tile of spaces){
        if(['city','center'].includes(tile.kind) && tile.id!==p.pos && (tile.id==='cinnabar'||!occupied(s,tile.id)))actions.push(option('fly','Voar para '+placeName(tile.id),{id:tile.id}));
      }
      break;
    case 'move': actions=moveChoices(s);break;
    case 'capture':
      return ['none',...Object.keys(offsets).filter(k=>p.hand.includes(k))].map(ball=>option('attempt',ball==='none'?'Tentar captura':'Usar '+itemName(ball),{ball}));
    case 'adjust': return legalOffsets(s).map(delta=>option('adjust','Resolver com '+(s.roll+delta),{delta}));
    case 'target':return s.targets.map(target=>option('target',s.tiles[target].revealed?chip(s.tiles[target].id).name:placeName(target),{target}));
    case 'react':if(!allowsTimeMachine(s))return [option('pass','Aplicar resultado')];return [option('pass','Manter o dado'),...(s.players[id].hand.includes('time-machine')?[option('reroll','Usar Máquina do Tempo')]:[])];
    case 'heal': return [...heals(s),...(s.challenge && fainted(p).length>1?[option('challenge','Rolar para recuperar todos')]:[])];
    case 'eventTrade':case 'eventFight':return s.players.filter(q=>q.id!==s.turn && (s.phase==='eventTrade'?tradable(q):standing(q))).map(q=>option('opponent','Escolher '+q.name,{opponent:q.id}));
    case 'end':
      actions=p.hand.length>7?[...new Set(p.hand)].map(card=>option('discard','Devolver '+itemName(card),{card})):[option('end','Encerrar turno')];break;
    default:throw new Error('Fase desconhecida: '+s.phase);
  }
  if(['move','end'].includes(s.phase) && p.hand.includes('potion'))actions.push(...heals(s).map(a=>({...a,type:'potion',label:'Poção · '+a.label})));
  return actions;
}
export function step(s,id,requested) {
  const legal=getLegalActions(s,id);
  const a=legal.find(x=>Object.keys(x).filter(k=>k!=='label').every(k=>x[k]===requested[k]) && Object.keys(requested).every(k=>Object.hasOwn(x,k)));
  if(!a)throw new Error('Ação ilegal para este jogador ou fase.');
  const n=structuredClone({...s,history:null,journal:null,log:null});n.dieResult=null;n.log=[];n.history=s.history;
  if(n.phase==='encounter'){const meeting=n.encounter.kind==='trade'||n.encounter.kind==='battle';applyEncounter(n,a);if(meeting && n.phase==='move')n.lockedRoute=n.meetingRoute;if(meeting && n.phase==='end' && n.routes[n.meetingRoute]?.path.slice(0,n.routes[n.meetingRoute].path.indexOf(own(n).pos)+1).includes('cerulean'))own(n).passedCerulean=true;}
  else if(n.phase==='pick'||n.phase==='tie')setupStep(n,a);
  else switch(a.type) {
    case 'enter':own(n).pos='indigo-arrival';n.log.push('Entrada no Indigo Plateau.');break;
    case 'roll':roll(n,'movement');break;
    case 'reroll':play(n,'time-machine');roll(n,n.reason);break;
    case 'pass': n.reactors.shift();advanceReaction(n);break;
    case 'fly':play(n,'fly');if(a.id==='cerulean')own(n).passedCerulean=true;land(n,a.id);break;
    case 'move': {const route=n.routes[a.route];own(n).passedCerulean=route.passedCerulean;land(n,route.destination,route.exact);break;}
    case 'meet':n.meetingRoute=a.route;enterEncounter(n,a.kind,a.opponent);break;
    case 'opponent':enterEncounter(n,n.phase==='eventTrade'?'forced-trade':'event-battle',a.opponent);break;
    case 'attempt': n.ball=a.ball;if(a.ball!=='none')play(n,a.ball);roll(n,'capture');break;
    case 'adjust':resolveCapture(n,a.delta);break;
    case 'target':if(n.choiceMode==='chance'){takeChip(n,a.target);n.phase='end';}else reveal(n,a.target);break;
    case 'potion':play(n,'potion');own(n).team.find(t=>t.id===a.id).knockedOut=false;break;
    case 'heal':own(n).team.find(t=>t.id===a.id).knockedOut=false;n.phase='end';break;
    case 'challenge':roll(n,'center');break;
    case 'discard':play(n,a.card);break;
    case 'end': {
      const p=own(n);
      if(power(p)>=20 && p.pos!=='cinnabar' && kantoBoard.get(p.pos).kind!=='plateau') {
        land(n,'cinnabar');if(p.hand.length>7)break;
      }
      n.turn=(n.turn+1)%n.count;n.actor=n.turn;n.number++;n.roll=null;n.lastEvent=null;n.phase='turn';n.declined=[];delete n.lockedRoute;n.routes=[];break;
    }
  }
  // Store one public account per decision. Private selections stay sealed.
  const concealed = {
    'enc-bonus':'Reservou uma carta de bônus em segredo.',
    'enc-fighter':'Escolheu um Pokémon para o combate.',
    'enc-incentive':'Preparou um incentivo para a proposta.',
    'enc-offer':'Preparou uma proposta de troca.',
    discard:'Devolveu um item ao fundo do baralho.',
    pick:'Escolheu uma ficha inicial virada para baixo.',
    pass:'Manteve o resultado do dado.',
    'enc-pass':'Manteve o resultado do dado.'
  };
  const details=[...n.log];
  if(a.type==='enc-accept' && s.encounter?.stage==='response'){
    const offer=s.encounter.offer;
    details.push(chip(offer.give).name+' foi trocado por '+chip(offer.get).name+'.');
  }
  if(n.number!==s.number)details.push('Próximo turno: '+n.players[n.turn].name+'.');
  if(a.type==='adjust')details.push('Resultado de captura: '+(s.roll+a.delta)+'.');
  if(n.dieResult && !details.some(m=>m.includes('rolou ')))details.push('Resultado do dado: '+n.dieResult+'.');
  if(a.type==='target' && s.choiceMode==='chance')details.push('Ficha obtida: '+chip(s.tiles[a.target].id).name+'.');
  if(s.phase==='pick' && n.phase!=='pick')for(const p of n.players)details.push(p.name+' recebeu '+chip(p.team[0].id).name+'.');
  for(const player of n.players){
    for(const member of player.team){
      const prior=s.players[player.id].team.find(t=>t.id===member.id);
      if(prior && prior.knockedOut!==member.knockedOut)details.push(chip(member.id).name+(member.knockedOut?' foi nocauteado.':' foi recuperado.'));
    }
  }
  n.journal=[...(s.journal??[]),{turn:s.number,actor:s.players[id].name,action:concealed[a.type]??a.label,details}];
  n.log=[...s.log,...n.log].slice(-100);
  const {label,...payload}=a;n.history=[...s.history,[id,payload]];return n;
}
export function observe(s,viewer) {
  const visibleTeam=p=>s.phase==='pick'?[]:p.team.map(t=>({...chip(t.id),knockedOut:t.knockedOut}));
  return {phase:s.phase,turn:s.turn,actor:s.actor,number:s.number,roll:s.roll,viewer,difficulty:s.difficulty,
    players:s.players.map(p=>({id:p.id,name:p.name,pos:p.pos,team:visibleTeam(p),power:s.phase==='pick'?0:power(p),handSize:p.hand.length,...(p.id===viewer?{hand:[...p.hand]}:{})})),
    tiles:Object.fromEntries(Object.entries(s.tiles).map(([k,v])=>[k,v?{color:v.color,...(v.revealed?{chip:chip(v.id)}:{})}:null])),
    starterSlots:s.starters.map(Boolean),lastEvent:s.lastEvent,target:s.target,ball:s.ball,reason:s.reason,log:s.log.slice(-20),routes:s.phase==='move'?structuredClone(s.routes):[],
    ...(s.phase==='encounter'?{encounter:encounterView(s,viewer)}:{}),winner:s.winner};
}





