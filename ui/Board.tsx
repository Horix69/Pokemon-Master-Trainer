import {Trails,branchInk} from './Trails.tsx';
import { createRoot } from 'react-dom/client';
import {useLayoutEffect, type CSSProperties} from 'react';
import { kantoBoard, chipPositions } from '../board/kanto.mjs';

interface Point {x:number; y:number}
interface Tile {color:string; chip?:{id:number;name:string;captureFaces:number[]}}
interface View {
  tiles:Record<string,Tile|null>;
  players:{id:number;name:string;pos:string;power:number}[];
  routes:{destination:string;path:string[]}[];
}
interface Action {type:string;label:string;target?:string;route?:number;preview?:string;symbol?:string;letter?:string}
interface Props {sprites?:number[];view:View|null;actions:Action[];colors:string[];colorNames:Record<string,string>}
const sockets:Record<string,Point>=chipPositions;
function position(p:Point):CSSProperties{return {left:p.x+'%',top:p.y+'%'}}
function useCaptionLayout(routeKey:string){
 useLayoutEffect(()=>{
   if(!routeKey)return;
   const viewport=document.querySelector<HTMLElement>('#viewport')!;
   let frame=0;
   function place(){
     const area=viewport.getBoundingClientRect();
     const pins=Array.from(viewport.querySelectorAll<HTMLElement>('.forkPin'));
     const occupied=pins.map(pin=>pin.getBoundingClientRect());
     for(const pin of pins){
       const label=pin.querySelector<HTMLElement>('.forkCaption')!;
       const box=pin.getBoundingClientRect(),w=label.offsetWidth,h=label.offsetHeight;
       const options=[[box.right+4,box.top],[box.left-w-4,box.top],[box.left+(box.width-w)/2,box.top-h-4],[box.left+(box.width-w)/2,box.bottom+4]];
       let best=options[0],min=Infinity;
       for(const [x,y] of options){
         const nx=Math.max(area.left+3,Math.min(x,area.right-w-3)),ny=Math.max(area.top+3,Math.min(y,area.bottom-h-3));
         const cost=occupied.reduce((sum,r)=>sum+Math.max(0,Math.min(nx+w,r.right)-Math.max(nx,r.left))*Math.max(0,Math.min(ny+h,r.bottom)-Math.max(ny,r.top)),0)+Math.abs(nx-x)+Math.abs(ny-y);
         if(cost<min){min=cost;best=[nx,ny];}
       }
       label.style.right='auto';label.style.left=(best[0]-box.left-pin.clientLeft)+'px';label.style.top=(best[1]-box.top-pin.clientTop)+'px';
       occupied.push(new DOMRect(best[0],best[1],w,h));
     }
   }
   const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(place)};
   const observer=new ResizeObserver(schedule);observer.observe(viewport);observer.observe(viewport.querySelector('#map')!);
   place();viewport.addEventListener('scroll',schedule);
   return ()=>{observer.disconnect();viewport.removeEventListener('scroll',schedule);cancelAnimationFrame(frame);};
 },[routeKey]);
}
function Board({view,actions,colors,colorNames,sprites}:Props){
 const occupied=new Map<string,number>();
 const branches=actions.filter(a=>a.type==='move'&&a.letter && a.route!==undefined);

 useCaptionLayout(branches.map(a=>view!.routes[a.route!].path.join('/')).join('|'));
 return <>
   {view && branches.length>1 && <Trails routes={branches.map(a=>({path:view.routes[a.route!].path,letter:a.letter!}))}/>}
   <svg id="routepath"  viewBox="0 0 1800 1200" preserveAspectRatio="none" aria-hidden="true"><polyline className="pathline"/></svg>
   {Object.entries(view?.tiles??{}).map(([id,tile])=>{
     if(!tile||!sockets[id])return null;
     const index=actions.findIndex(a=>a.type==='target'&&a.target===id);
     const hidden=colorNames[tile.color];
     return <button key={id} className="mapchip" style={position(sockets[id])}
       data-action={index>=0?index:undefined} data-preview-chip={tile.chip?.id} data-preview-hidden={!tile.chip?hidden:undefined} data-chip={index<0?tile.chip?.id:undefined}
       data-hidden={index<0&&!tile.chip?hidden:undefined} title={tile.chip?.name??'Ficha '+hidden+' oculta'}>
       <img src={'assets/chips/'+(tile.chip?.id??tile.color)+'.webp'} alt=""/>
     </button>
   })}
   {view?.players.map(player=>{
     const p=kantoBoard.get(player.pos),count=occupied.get(player.pos)??0;
     occupied.set(player.pos,count+1);
     const total=view.players.filter(other=>other.pos===player.pos).length;
     const shift=(count-(total-1)/2)*1.8;
     return <span key={player.id} tabIndex={0} data-player={player.id} className="pawn trainerPawn" title={player.name} style={{...position({x:p.x+shift,y:p.y}),'--trainer':colors[player.id]} as CSSProperties}><img src={'assets/trainers/'+(sprites?.[player.id]??player.id+1)+'.png'} alt={player.name}/></span>
   })}
   {view && view.players.some(p=>p.power>=20 && kantoBoard.get(p.pos).kind!=='plateau') && <span className="islandGoal" style={position(kantoBoard.get('cinnabar'))} title="Com 20 pontos, siga para Cinnabar">⚑</span>}
   {actions.map((a,i)=>a.type==='move'&&a.route!==undefined&&view&&!actions.slice(0,i).some(b=>b.type==='move'&&b.route!==undefined&&view.routes[b.route].destination===view.routes[a.route!].destination)?
     <button key={i} className={'marker'+(a.letter?' forkPin':'')} style={{...position(kantoBoard.get(view.routes[a.route].destination)),'--branch':branchInk(branches.indexOf(a))} as CSSProperties}
       data-action={i} title={a.label+' · '+a.preview} aria-label={a.label+' · '+a.preview}>{a.letter?branches.filter(b=>view.routes[b.route!].destination===view.routes[a.route!].destination).map(b=>b.letter).join('/'):a.symbol??'→'}{a.letter&&<span className={'forkCaption'+(kantoBoard.get(view.routes[a.route].destination).x>65?' leftSide':'')}>{view.tiles[view.routes[a.route].destination]?.chip&&<img alt="" src={'assets/chips/'+view.tiles[view.routes[a.route].destination]!.chip!.id+'.webp'}/>}<span>{a.preview}</span></span>}</button>:null)}
 </>
}
const root=createRoot(document.getElementById('layer')!);
export function mapLayer(view:View|null,actions:Action[],colors:string[],colorNames:Record<string,string>,sprites?:number[]){
 root.render(<Board sprites={sprites} view={view} actions={actions} colors={colors} colorNames={colorNames}/>);
}

