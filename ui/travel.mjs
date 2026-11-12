import {kantoBoard} from '../board/kanto.mjs';
export async function travel(before,after,action,label,fast=false){
 const player=before.turn,start=before.players[player].pos,end=after.players[player].pos;
 if(start===end && action.type!=='move')return;
 const route=action.type==='move'?before.routes[action.route]:['battle','trade'].includes(before.encounter?.kind)?before.routes[before.meetingRoute]:null;
 const index=route?.path.indexOf(end);
 const path=action.type==='move'?route.path:route && index>=0?route.path.slice(0,index+1):[start,end];
 const pawn=document.querySelector('[data-player="'+player+'"]'),vp=document.querySelector('#viewport'),map=document.querySelector('#map');
 if(!pawn||path.length<2)return;
 const arena=document.querySelector('#actionWindow');
 if(arena.open)arena.close();
 const shell=document.querySelector('#gameShell'),bar=document.querySelector('#actionBar');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const previous={width:map.style.width,scale:document.getElementById('scale').textContent,x:vp.scrollLeft,y:vp.scrollTop,pageX:window.scrollX,pageY:window.scrollY};
 const focus=Math.min(3,Math.max(1.75,(map.offsetWidth/vp.clientWidth)*1.35));
 map.style.width=focus*100+'%';document.getElementById('scale').textContent=Math.round(focus*100)+'%';
 const origin=kantoBoard.get(start);
 vp.scrollTo({left:map.offsetWidth*origin.x/100-vp.clientWidth/2,top:map.offsetHeight*origin.y/100-vp.clientHeight/2,behavior:'instant'});
 shell.inert=true; shell.classList.add('travelling');pawn.classList.add('walking');
 vp.scrollIntoView({block:'center',behavior:'instant'});
 const line=document.querySelector('#routepath polyline');
 let point={x:parseFloat(pawn.style.left),y:parseFloat(pawn.style.top)};
 const hold=[];
 try{
   for(let i=1;i<path.length;i++){
     const next=kantoBoard.get(path[i]);
     vp.scrollTo({left:map.offsetWidth*next.x/100-vp.clientWidth/2,top:map.offsetHeight*next.y/100-vp.clientHeight/2,behavior:reduced?'instant':'smooth'});
     bar.textContent=before.players[player].name+' · '+(route?'Passo '+i+' de '+(path.length-1):'Deslocamento')+' · '+label(path[i]);
     if(line)line.setAttribute('points',path.slice(0,i+1).map(id=>{const p=kantoBoard.get(id);return p.x*18+','+p.y*12}).join(' '));
     const frame=p=>({left:p.x+'%',top:p.y+'%'});
     const motion=pawn.animate([frame(point),frame(next)],{duration:reduced?100:fast?185:430,easing:'ease-in-out',fill:'forwards'});
     hold.push(motion);await motion.finished;point=next;
   }
   const dest=kantoBoard.get(end);
   if(['city','center'].includes(dest.kind)||end==='indigo-arrival'){
     const plaque=document.createElement('div');plaque.className='arrivalSign';
     const effect=dest.actions.includes('revive')?'Centro Pokémon':dest.actions.includes('draw-item-2')?'Compre dois itens':end==='indigo-arrival'?'Circuito final':'';
     const name=document.createElement('b');name.textContent=label(end);plaque.append(name);
     if(effect){const sub=document.createElement('small');sub.textContent=effect;plaque.append(sub);}
     const anchor=kantoBoard.get(end);plaque.style.left=Math.max(10,Math.min(90,anchor.x))+'%';plaque.style.top=(anchor.y>18?anchor.y-4:anchor.y+7)+'%';
     map.append(plaque);
     try{await new Promise(resolve=>setTimeout(resolve,fast?550:1100));}finally{plaque.remove();}
   }else await new Promise(resolve=>setTimeout(resolve,fast?120:330));
 }finally{hold.forEach(m=>m.cancel());line?.setAttribute('points','');map.style.width=previous.width;document.getElementById('scale').textContent=previous.scale;
 vp.scrollTo({left:previous.x,top:previous.y,behavior:'instant'});window.scrollTo({left:previous.pageX,top:previous.pageY,behavior:'instant'});shell.inert=false;shell.classList.remove('travelling');pawn.classList.remove('walking');}
}

