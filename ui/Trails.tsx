import {kantoBoard} from '../board/kanto.mjs';
const inks=['#12657a','#843b75','#98451c','#304caf','#3c642b','#703623'];
const dashes=['','15 8','4 6','18 6 4 6','8 6','20 10'];
export function branchInk(index:number){return inks[index%inks.length]}
interface Trail{path:string[];letter:string}
export function Trails({routes}:{routes:Trail[]}){
 const edges=new Map<string,{a:string;b:string;uses:number[]}>();
 routes.forEach(({path},i)=>path.slice(1).forEach((b,j)=>{
   const a=path[j],key=[a,b].sort().join('/');
   const edge=edges.get(key)??{a,b,uses:[]};edge.uses.push(i);edges.set(key,edge);
 }));
 return <svg className="forkTrails" viewBox="0 0 1800 1200" preserveAspectRatio="none" aria-hidden="true">{[...edges].map(([key,{a,b,uses}])=>{
   const p=kantoBoard.get(a),q=kantoBoard.get(b),shared=uses.length>1;
   const points={x1:p.x*18,y1:p.y*12,x2:q.x*18,y2:q.y*12};
   return <g key={key}><line {...points} stroke="#fff4cc" strokeWidth={shared?9:13}/>
   <line {...points} stroke={shared?'#596e63':branchInk(uses[0])} strokeWidth={shared?4:8} strokeDasharray={shared?'':dashes[uses[0]%6]}/></g>;
 })}</svg>
}
