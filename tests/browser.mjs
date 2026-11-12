import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { newGame } from '../game-core/setup.mjs';
import { getLegalActions,observe,step } from '../game-core/engine.mjs';
import { chooseAction } from '../ai/strategy.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER_BIN||undefined,headless:true});
try{
 const page=await browser.newPage({viewport:{width:1360,height:900}});
 await page.emulateMedia({reducedMotion:'reduce'});
 const coverage={fighter:0,card:0,duel:0};
 const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('request',req=>{if(/^https?:/.test(req.url()))network.push(req.url());});
 await page.addInitScript(seed=>{const timer=window.setTimeout.bind(window);window.setTimeout=(fn,delay,...args)=>timer(fn,[120,330,380,450,950,1000,1200,5000].includes(delay)?5:delay,...args);crypto.getRandomValues=arr=>{arr[0]=seed;return arr;};const animate=Element.prototype.animate;Element.prototype.animate=function(...args){const animation=animate.apply(this,args);animation.playbackRate=40;return animation;};},Number(process.env.QA_SEED??1));
 await page.goto(new URL('../index.html',import.meta.url).href);
 await page.locator('#singleplayer').click();await page.locator('#catalogNav').click();await page.locator('#search').fill('147');
 assert.equal(await page.locator('#grid button').count(),1);await page.locator('#grid button').hover();await page.locator('#inspectTip:popover-open').waitFor();await page.locator('#grid button').click();await page.getByRole('heading',{name:'Dratini',exact:true}).waitFor();await page.locator('#close').click();

 await page.locator('#rulesNav').click();await page.locator('#close').click();
 if(process.env.SCREENSHOT)await page.screenshot({path:process.env.SCREENSHOT});
 if(process.env.QA_FAST)await page.locator('#rhythm').selectOption('fast');
 await page.locator('#start').click();let state=newGame(Number(process.env.QA_SEED??1),2,'normal'),human=0;
 await page.locator('#arenaHide').click();
 await page.locator('#plus').click();assert.equal(await page.locator('#scale').textContent(),'150%');await page.locator('#scale').click();
 await page.getByRole('button',{name:'Ver detalhes da jogada'}).click();
 const passed=new Set();
 const saveKey='pmt1999.game.v1';
 const started=Date.now();
 while(Date.now()-started<300000){
   const snap=await page.evaluate(key=>{
     const data=JSON.parse(localStorage.getItem(key));
     return {n:data.history.length,last:data.history.slice(-12),win:!!document.querySelector('#finishReview'),
       die:!!document.querySelector('.diceClose'),result:[...document.querySelectorAll('#actionWindow[open] button')].some(b=>b.textContent==='Continuar após a batalha'||b.textContent.startsWith('Continuar após a batalha ·')),
       visible:!!document.querySelector('#actionWindow[open],#panel [data-action]'),moving:!!document.querySelector('.travelling')};
   },saveKey);
   const missing=snap.n-state.history.length;
   assert.ok(missing>=0 && missing<=12,'Histórico inesperado');
   for(const [actor,a] of missing?snap.last.slice(-missing):[])state=step(state,actor,a);
   if(errors.length)throw Error(errors.join(' '));
   if(await page.locator('.starterReveal[open] button').count()){await page.locator('.starterReveal button').dispatchEvent('click');continue;}
   if(await page.locator('.itemReveal[open]').count()){await page.locator('.receiptContinue').dispatchEvent('click');continue;}
   if(snap.die){await page.locator('.diceClose').first().dispatchEvent('click');continue;}
   if(snap.result){await page.getByRole('button',{name:/^Continuar após a batalha/}).dispatchEvent('click');continue;}
   if(snap.win)break;
   if(snap.moving || !snap.visible || passed.has(snap.n)){await page.waitForTimeout(10);continue;}
   const legal=getLegalActions(state,state.actor);
   const action=chooseAction(observe(state,state.actor),legal,'normal');
   if(legal.length===1 && ['pass','enc-pass','enc-commit','adjust','move'].includes(action.type)){await page.waitForTimeout(5);continue;}
   const control=state.actor===0?page.locator((await page.locator('#actionWindow[open]').count()?'#actionWindow':'#panel')+' [data-action="'+legal.indexOf(action)+'"]'):page.locator('#advanceAI');
   if(await page.locator('.starterReveal[open]').count())continue;
   if(!await control.count()){await page.waitForTimeout(10);continue;}
   if(action.type==='enc-fighter')coverage.fighter++;
   if(await control.locator('.cardface').count())coverage.card++;
   if(await page.locator('#actionWindow .duel').count())coverage.duel++;
   if(state.actor===0)human++;
   await control.dispatchEvent('click');passed.add(snap.n);
 }

 await page.locator('#finishReview').waitFor();
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(network.length,0,network.join('\n'));
 assert.equal(state.phase,'won');
 const winnerName=await page.evaluate(id=>JSON.parse(localStorage.getItem('pmt1999.game.v1')).profiles[id].name,state.winner);
 assert.equal(await page.locator('.victoryName').textContent(),winnerName);
 await page.waitForTimeout(2200);
 if(process.env.VICTORY_SCREENSHOT)await page.screenshot({path:process.env.VICTORY_SCREENSHOT});
 await page.waitForTimeout(2200);assert.ok(await page.locator('.victoryDialog[open]').count(),'Vitória permanece aberta para leitura');
 await page.locator('#finishReview').click();assert.equal(await page.locator('.victoryDialog[open]').count(),0);

 console.log(JSON.stringify({browser:await browser.version(),turns:state.number,humanActions:human,winner:state.winner,coverage,errors,externalRequests:network.length}));
}finally{await browser.close();}






