import {validateProfiles} from './profiles.mjs';
import { chips, itemTypes, eventTypes, rivals } from '../game-data/catalog.mjs';
import { shuffle, rollDie } from './random.mjs';
import { spaces } from '../board/kanto.mjs';

export const chip = id => chips[id - 1];
export const power = player => player.team.reduce((sum,t)=>sum+(t.knockedOut ? 0 : chip(t.id).power),0);
const deck = types => types.flatMap(c => Array(c.count).fill(c.id));
export function newGame(seed, count=2, difficulty='normal', humans=1, profiles) {
  if (!Number.isInteger(humans) || humans<1 || humans>count || !Number.isInteger(seed) || seed<0 || seed>0xffffffff || !Number.isInteger(count) || count<2 || count>6 || !['easy','normal','hard'].includes(difficulty)) throw new Error('Configuração inválida');
  const s={version:1,strictBallFrom:0,legacyUntil:0,timeMachineFrom:0,seed,count,humans,difficulty,rng:seed,phase:'pick',actor:0,turn:0,number:1,cinnabar:'cinnabar',history:[],journal:[],log:[],reserve:{},tiles:{},roll:null,declined:[],routes:[]};
  s.players=Array.from({length:count},(_,id)=>({id,pos:'pallet',passedCerulean:false,team:[],hand:[],name:id || humans>1?'Treinador '+(id+1):'Você'}));
  if(profiles){validateProfiles(profiles,count);s.profiles=structuredClone(profiles);s.players.forEach((p,i)=>p.name=profiles[i].name);}
  for (const color of ['starter','pink','green','blue','red','yellow']) {
    s.reserve[color]=shuffle(s,chips.filter(c=>c.color===color).map(c=>c.id));
  }
  s.starters=s.reserve.starter.splice(0);
  const place=(id,color)=>{ const value=s.reserve[color].pop(); if (!value) throw new Error('Fichas insuficientes'); s.tiles[id]={id:value,color,revealed:false}; };
  for (const tile of spaces) if(tile.kind==='catch') place(tile.id,tile.color);
  for(let i=1;i<=4;i++) place('dungeon-'+i,'yellow');
  s.items=shuffle(s,deck(itemTypes)); s.events=shuffle(s,deck(eventTypes)); s.rivals=shuffle(s,rivals.map(r=>r.name));
  return s;
}
export function setupActions(s) {
  if(s.phase==='pick') return s.starters.flatMap((id,slot)=>id?[{type:'pick',slot,label:'Ficha '+(slot+1)}]:[]);
  return [{type:'tie',label:'Rolar desempate'}];
}
function begin(s,id) {
  s.turn=s.actor=id; s.phase='turn';
  s.log.push(s.players[id].name+' começa em Pallet Town.');
}
export function setupStep(s,a) {
  if(a.type==='pick') {
    s.players[s.actor].team.push({id:s.starters[a.slot],knockedOut:false}); s.starters[a.slot]=null;
    if(++s.actor < s.count) return;
    s.reserve.starter.push(...s.starters.filter(Boolean)); s.starters=[];
    const min=Math.min(...s.players.map(power));
    s.tied=s.players.filter(p=>power(p)===min).map(p=>p.id); s.tieRolls={};
  } else {
    const face=rollDie(s); s.tieRolls[s.actor]=face; s.log.push(s.players[s.actor].name+' rolou '+face+' no desempate.');
    const next=s.tied.find(id=>!(id in s.tieRolls));
    if(next!==undefined){s.actor=next; return;}
    const max=Math.max(...Object.values(s.tieRolls)); s.tied=s.tied.filter(id=>s.tieRolls[id]===max); s.tieRolls={};
  }
  if(s.tied.length===1) begin(s,s.tied[0]);
  else {s.phase='tie';s.actor=s.tied[0];}
}




