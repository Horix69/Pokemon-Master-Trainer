import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {newGame} from '../game-core/setup.mjs';
import {getLegalActions,step,observe} from '../game-core/engine.mjs';
import {chooseAction} from '../ai/strategy.mjs';
import {save} from '../persistence/save.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
let s=newGame(1,2),move,capture,battle;
while(s.phase!=='won' && !(move&&capture&&battle)){
 const legal=getLegalActions(s,s.actor),a=chooseAction(observe(s,s.actor),legal,'normal');
 let n=step(s,s.actor,a);
 if(!move && s.actor===0 && s.phase==='move' && legal.length>1 && a.type==='move' && s.routes[a.route].path.length>2)move={s,i:legal.indexOf(a)};
 if(n.dieResult && s.actor===0){
  while(true){const opts=getLegalActions(n,n.actor);if(opts.length!==1||!['pass','enc-pass','adjust'].includes(opts[0].type))break;n=step(n,n.actor,opts[0]);}
  if(!capture&&a.type==='attempt'&&s.target&&!n.target)capture={s,i:legal.indexOf(a)};
  if(!battle&&a.type==='enc-roll'&&n.roundScore&&n.roundScore[0].total!==n.roundScore[1].total)battle={s,i:legal.indexOf(a)};
 }
 s=step(s,s.actor,a);
}
assert.ok(move&&capture&&battle);
const b=await chromium.launch({executablePath:process.env.BROWSER_BIN});
try{for(const [kind,fixture] of Object.entries({move,capture,battle})){
 let raw;save(fixture.s,{setItem:(_,v)=>raw=v});
 const p=await b.newPage();await p.addInitScript(v=>localStorage.setItem('pmt1999.game.v1',v),raw);await p.goto(pathToFileURL(resolve('index.html')).href);await p.locator('#singleplayer').click();
 
 await p.locator('#resume').click();if(kind==='move')await p.locator('#plus').click();
 const scope=await p.locator('#actionWindow[open]').count()?'#actionWindow':'#panel';
 const disp=()=>p.evaluate(()=>({scale:document.getElementById('scale').textContent,x:document.getElementById('viewport').scrollLeft,y:document.getElementById('viewport').scrollTop}));
 if(kind==='move')await p.locator('#viewport').evaluate(el=>el.scrollTo(60,80));const prior=await disp();
 await p.locator(scope+' [data-action="'+fixture.i+'"]').click();
 if(kind==='move'){await p.locator('.travelling').waitFor();assert.notEqual((await disp()).scale,prior.scale);await p.locator('.travelling').waitFor({state:'hidden'});assert.deepEqual(await disp(),prior);console.log('Zoom e posição recuperados:',prior);}
 else {const outcome=p.locator('.dieOutcome');await outcome.waitFor();const text=await outcome.textContent();assert.match(text,kind==='capture'?/Capturou|escapou/:/ganhou/);assert.equal(await p.locator('.diceCount').textContent(),'4');await p.locator('.diceClose').waitFor({state:'hidden',timeout:5000});console.log(kind,text);}
 await p.close();
}}finally{await b.close()}

