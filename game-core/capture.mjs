import { chip } from './setup.mjs';
import { shuffle } from './random.mjs';
export const offsets=Object.freeze({'great-ball':[-1,1],'ultra-ball':[1,2],'master-ball':[1,2,3,4],none:[0]});
export function legalOffsets(s){
 const allowed=offsets[s.ball];
 return s.ball!=='none' && s.history.length<s.strictBallFrom?[0,...allowed]:allowed;
}
export const chance=(faces,ball='none')=>[1,2,3,4,5,6].filter(face=>offsets[ball].some(n=>faces.includes(face+n))).length/6;
export function takeChip(s,space) {
  const t=s.tiles[space]; if(!t) throw new Error('Casa vazia');
  s.players[s.turn].team.push({id:t.id,knockedOut:false});
  const next=s.reserve[t.color].pop(); s.tiles[space]=next?{id:next,color:t.color,revealed:false}:null;
}
export function reveal(s,target) {
  const t=s.tiles[target]; t.revealed=true; s.target=target; s.phase='capture'; s.ball='none';
  s.log.push('Ficha revelada: '+chip(t.id).name+'.');
}
export function resolveCapture(s,delta) {
  if (!legalOffsets(s).includes(delta)) throw new Error('Ajuste de bola inválido');
  const t=s.tiles[s.target]; const c=chip(t.id);
  if(c.captureFaces.includes(s.roll+delta)) {takeChip(s,s.target);s.log.push(s.players[s.turn].name+' capturou '+c.name+'.');}
  else {
    s.log.push(c.name+' escapou.');
    if(t.color==='yellow') {
      const keys=Object.keys(s.tiles).filter(k=>s.tiles[k]?.color==='yellow');
      const ids=shuffle(s,keys.map(k=>s.tiles[k].id)); keys.forEach((k,i)=>s.tiles[k]={id:ids[i],color:'yellow',revealed:false});
    }
  }
  s.phase='end';s.target=null;
}
