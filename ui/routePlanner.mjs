import {kantoBoard} from '../board/kanto.mjs';

export function markRoutes(view,actions){
 const moves=actions.filter(a=>a.type==='move');
 if(moves.length<2)return [];
 moves.forEach((a,i)=>{a.letter=String.fromCharCode(65+i)});
 for(const a of actions)if(a.type==='meet')a.letter=moves.find(m=>m.route===a.route)?.letter;
 return moves;
}

export function hintFor(view,moves){
 const team=view.players[view.turn].team, knocked=team.filter(c=>c.knockedOut);
 const options=moves.map(move=>({move,space:kantoBoard.get(view.routes[move.route].destination),tile:view.tiles[view.routes[move.route].destination]}));
 const at=predicate=>options.find(predicate);
 let choice=at(o=>knocked.length && o.space.actions.includes('revive'));
 if(choice)return 'Pela rota '+choice.move.letter+' você pode recuperar '+knocked[0].name+'. Ele volta a lutar e a somar '+knocked[0].power+' PP.';
 choice=at(o=>o.tile?.chip);
 if(choice)return 'Na rota '+choice.move.letter+' está '+choice.tile.chip.name+'. Se capturar, sua equipe ganha '+choice.tile.chip.power+' PP.';
 choice=at(o=>o.space.actions.some(x=>x.startsWith('draw-item-')));
 if(choice)return 'A rota '+choice.move.letter+' repõe sua mão de itens. Você tem '+view.players[view.turn].handSize+' agora.';
 choice=at(o=>o.tile);
 if(choice)return 'Quer aumentar a equipe? A rota '+choice.move.letter+' oferece uma tentativa de captura. A ficha ainda está virada.';
 choice=at(o=>o.space.actions.includes('draw-event'));
 if(choice)return 'A rota '+choice.move.letter+' compra um evento. O efeito só será conhecido quando você chegar.';
 return 'Compare os destinos e os treinadores no caminho. Uma parada para trocar ou batalhar pode mudar onde seu turno termina.';
}

export function frameRoutes(view,moves,vp,map,setZoom){
 const points=moves.flatMap(a=>view.routes[a.route].path.map(id=>kantoBoard.get(id)));
 const bounds=axis=>[Math.min(...points.map(p=>p[axis])),Math.max(...points.map(p=>p[axis]))];
 const [l,r]=bounds('x'),[t,b]=bounds('y');
 const z=Math.max(1,Math.min(2.5,77/Math.max(1,r-l),73/Math.max(1,b-t)));
 setZoom(z);
 vp.scrollTo({left:(l+r)/200*map.offsetWidth-vp.clientWidth/2,top:(t+b)/200*map.offsetHeight-vp.clientHeight/2,behavior:'instant'});
}
