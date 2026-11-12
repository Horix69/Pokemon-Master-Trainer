import {createRequire} from 'node:module';import assert from 'node:assert/strict';
import {newGame} from '../game-core/setup.mjs';import {step,getLegalActions,observe} from '../game-core/engine.mjs';import {chooseAction} from '../ai/strategy.mjs';import {save} from '../persistence/save.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
let s=newGame(16,2,'normal');for(let i=0;s.phase!=='won' && i<50000;i++)s=step(s,s.actor,chooseAction(observe(s,s.actor),getLegalActions(s,s.actor),'normal'));
assert.equal(s.phase,'won');let raw;save(s,{setItem:(k,v)=>raw=v});
const b=await chromium.launch({executablePath:process.env.BROWSER_BIN});
try{for(const [width,height] of [[1360,1000],[305,678],[678,305]]){
 const p=await b.newPage({viewport:{width,height},hasTouch:width!==1360});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(raw=>localStorage.setItem('pmt1999.game.v1',raw),raw);
 await p.goto(new URL('../index.html',import.meta.url).href);await p.locator('#singleplayer').click();await p.locator('#resume').click();
 await p.locator('.victoryName').waitFor();assert.equal(await p.locator('.victoryName').textContent(),s.players[s.winner].name);
 await p.waitForTimeout(1200);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 if(width===1360)await p.screenshot({path:'../../work/victory31-resume.png'});
 await p.locator('#finishReview').click();assert.equal(await p.locator('.victoryDialog[open]').count(),0);
 await p.getByRole('button',{name:'Ver detalhes da jogada'}).click();await p.locator('#victoryHome').click();await p.locator('#saveExit').click();assert.ok(await p.locator('#singleplayer').isVisible());
 assert.deepEqual(errors,[]);console.log('Vitória, retomar e menu OK',width,height);await p.close();
}}finally{await b.close()}
